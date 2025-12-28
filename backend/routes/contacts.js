const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, requireAdmin } = require('./auth');

// ==========================================
// PUBLIC API - Gửi liên hệ từ khách hàng
// ==========================================

// POST - Gửi liên hệ mới
router.post('/', async (req, res) => {
    try {
        const { ho_ten, email, so_dien_thoai, chu_de, noi_dung } = req.body;

        // Validation
        if (!ho_ten || !email || !chu_de || !noi_dung) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Tạo bảng nếu chưa có
        await db.query(`
            CREATE TABLE IF NOT EXISTS lien_he (
                ma_lien_he INT AUTO_INCREMENT PRIMARY KEY,
                ho_ten VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL,
                so_dien_thoai VARCHAR(20),
                chu_de VARCHAR(200) NOT NULL,
                noi_dung TEXT NOT NULL,
                trang_thai ENUM('chua_doc', 'da_doc', 'da_phan_hoi') DEFAULT 'chua_doc',
                phan_hoi TEXT,
                ngay_phan_hoi TIMESTAMP NULL,
                ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        const [result] = await db.query(`
            INSERT INTO lien_he (ho_ten, email, so_dien_thoai, chu_de, noi_dung)
            VALUES (?, ?, ?, ?, ?)
        `, [ho_ten, email, so_dien_thoai || null, chu_de, noi_dung]);

        res.status(201).json({
            success: true,
            message: 'Gửi liên hệ thành công! Chúng tôi sẽ phản hồi sớm nhất.',
            data: { ma_lien_he: result.insertId }
        });

    } catch (error) {
        console.error('Create contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi gửi liên hệ'
        });
    }
});

// ==========================================
// ADMIN API - Quản lý liên hệ
// ==========================================

// GET - Lấy tất cả liên hệ (admin)
router.get('/admin/all', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (page - 1) * limit;

        let whereClause = '1=1';
        const params = [];

        if (status && status !== 'all') {
            whereClause += ` AND trang_thai = ?`;
            params.push(status);
        }

        if (search) {
            whereClause += ` AND (ho_ten LIKE ? OR email LIKE ? OR chu_de LIKE ? OR noi_dung LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        const [contacts] = await db.query(`
            SELECT * FROM lien_he
            WHERE ${whereClause}
            ORDER BY 
                CASE trang_thai 
                    WHEN 'chua_doc' THEN 1 
                    WHEN 'da_doc' THEN 2 
                    ELSE 3 
                END,
                ngay_tao DESC
            LIMIT ? OFFSET ?
        `, [...params, parseInt(limit), parseInt(offset)]);

        const [countResult] = await db.query(`SELECT COUNT(*) as total FROM lien_he WHERE ${whereClause}`, params);

        // Đếm theo trạng thái
        const [stats] = await db.query(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN trang_thai = 'chua_doc' THEN 1 ELSE 0 END) as chua_doc,
                SUM(CASE WHEN trang_thai = 'da_doc' THEN 1 ELSE 0 END) as da_doc,
                SUM(CASE WHEN trang_thai = 'da_phan_hoi' THEN 1 ELSE 0 END) as da_phan_hoi
            FROM lien_he
        `);

        res.json({
            success: true,
            data: contacts,
            stats: stats[0],
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total,
                totalPages: Math.ceil(countResult[0].total / limit)
            }
        });

    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET - Lấy chi tiết liên hệ
router.get('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [contacts] = await db.query(`SELECT * FROM lien_he WHERE ma_lien_he = ?`, [req.params.id]);

        if (contacts.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' });
        }

        // Cập nhật trạng thái thành đã đọc nếu chưa đọc
        if (contacts[0].trang_thai === 'chua_doc') {
            await db.query(`UPDATE lien_he SET trang_thai = 'da_doc' WHERE ma_lien_he = ?`, [req.params.id]);
            contacts[0].trang_thai = 'da_doc';
        }

        res.json({ success: true, data: contacts[0] });

    } catch (error) {
        console.error('Get contact detail error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PUT - Phản hồi liên hệ
router.put('/admin/:id/reply', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { phan_hoi } = req.body;

        if (!phan_hoi || phan_hoi.trim() === '') {
            return res.status(400).json({ success: false, message: 'Nội dung phản hồi không được để trống' });
        }

        // Kiểm tra liên hệ tồn tại
        const [contacts] = await db.query(`SELECT * FROM lien_he WHERE ma_lien_he = ?`, [req.params.id]);
        if (contacts.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy liên hệ' });
        }

        // Cập nhật phản hồi
        await db.query(`
            UPDATE lien_he 
            SET phan_hoi = ?, trang_thai = 'da_phan_hoi', ngay_phan_hoi = NOW()
            WHERE ma_lien_he = ?
        `, [phan_hoi.trim(), req.params.id]);

        // Gửi email phản hồi (nếu có cấu hình mailer)
        try {
            const mailer = require('../config/mailer');
            if (mailer && mailer.sendMail) {
                await mailer.sendMail({
                    to: contacts[0].email,
                    subject: `Re: ${contacts[0].chu_de} - Yến Nhi Tech`,
                    html: `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #1e40af;">Phản hồi từ Yến Nhi Tech</h2>
                            <p>Xin chào <strong>${contacts[0].ho_ten}</strong>,</p>
                            <p>Cảm ơn bạn đã liên hệ với chúng tôi. Dưới đây là phản hồi cho câu hỏi của bạn:</p>
                            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
                                <p style="color: #374151; margin: 0;">${phan_hoi}</p>
                            </div>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                            <p style="color: #6b7280; font-size: 14px;">
                                <strong>Tin nhắn gốc của bạn:</strong><br>
                                ${contacts[0].noi_dung}
                            </p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                            <p style="color: #6b7280; font-size: 12px;">
                                Yến Nhi Tech - 74-76 Lê Lợi, Trà Vinh<br>
                                Hotline: 028.6670.4455 | Email: yennhitech@gmail.com
                            </p>
                        </div>
                    `
                });
                console.log('✅ Email phản hồi đã được gửi đến:', contacts[0].email);
            }
        } catch (emailError) {
            console.log('⚠️ Không thể gửi email phản hồi:', emailError.message);
        }

        res.json({ success: true, message: 'Phản hồi thành công!' });

    } catch (error) {
        console.error('Reply contact error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// PUT - Cập nhật trạng thái
router.put('/admin/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { trang_thai } = req.body;
        const validStatuses = ['chua_doc', 'da_doc', 'da_phan_hoi'];

        if (!validStatuses.includes(trang_thai)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        await db.query(`UPDATE lien_he SET trang_thai = ? WHERE ma_lien_he = ?`, [trang_thai, req.params.id]);

        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });

    } catch (error) {
        console.error('Update contact status error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// DELETE - Xóa liên hệ
router.delete('/admin/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.query(`DELETE FROM lien_he WHERE ma_lien_he = ?`, [req.params.id]);
        res.json({ success: true, message: 'Xóa liên hệ thành công' });
    } catch (error) {
        console.error('Delete contact error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

module.exports = router;

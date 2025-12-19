const express = require('express');
const router = express.Router();
const db = require('../config/database');

// Gửi tin nhắn liên hệ
router.post('/', async (req, res) => {
    try {
        const { ho_ten, email, so_dien_thoai, chu_de, noi_dung } = req.body;

        // Validation
        if (!ho_ten || !email || !chu_de || !noi_dung) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin bắt buộc!'
            });
        }

        if (noi_dung.length < 1000) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung tin nhắn phải có ít nhất 1000 ký tự!'
            });
        }

        // Email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ!'
            });
        }

        // Insert into database
        const sql = `
            INSERT INTO lien_he (ho_ten, email, so_dien_thoai, chu_de, noi_dung, ngay_gui, trang_thai)
            VALUES (?, ?, ?, ?, ?, NOW(), 'chua_doc')
        `;

        db.query(sql, [ho_ten, email, so_dien_thoai || null, chu_de, noi_dung], (err, result) => {
            if (err) {
                console.error('Error inserting contact message:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra khi gửi tin nhắn!'
                });
            }

            res.json({
                success: true,
                message: 'Tin nhắn đã được gửi thành công! Chúng tôi sẽ phản hồi sớm nhất.',
                data: {
                    id: result.insertId
                }
            });
        });

    } catch (error) {
        console.error('Contact error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra, vui lòng thử lại!'
        });
    }
});

// Lấy danh sách tin nhắn liên hệ (cho admin)
router.get('/', async (req, res) => {
    try {
        const { trang_thai, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let sql = 'SELECT * FROM lien_he';
        let countSql = 'SELECT COUNT(*) as total FROM lien_he';
        const params = [];

        if (trang_thai) {
            sql += ' WHERE trang_thai = ?';
            countSql += ' WHERE trang_thai = ?';
            params.push(trang_thai);
        }

        sql += ' ORDER BY ngay_gui DESC LIMIT ? OFFSET ?';

        db.query(countSql, params, (err, countResult) => {
            if (err) {
                console.error('Error counting messages:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra!'
                });
            }

            const total = countResult[0].total;

            db.query(sql, [...params, parseInt(limit), offset], (err, results) => {
                if (err) {
                    console.error('Error fetching messages:', err);
                    return res.status(500).json({
                        success: false,
                        message: 'Có lỗi xảy ra!'
                    });
                }

                res.json({
                    success: true,
                    data: results,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        totalPages: Math.ceil(total / limit)
                    }
                });
            });
        });

    } catch (error) {
        console.error('Get contacts error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

// Cập nhật trạng thái tin nhắn
router.put('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { trang_thai } = req.body;

        const validStatus = ['chua_doc', 'da_doc', 'da_phan_hoi'];
        if (!validStatus.includes(trang_thai)) {
            return res.status(400).json({
                success: false,
                message: 'Trạng thái không hợp lệ!'
            });
        }

        const sql = 'UPDATE lien_he SET trang_thai = ? WHERE id = ?';
        
        db.query(sql, [trang_thai, id], (err, result) => {
            if (err) {
                console.error('Error updating status:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra!'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tin nhắn!'
                });
            }

            res.json({
                success: true,
                message: 'Cập nhật trạng thái thành công!'
            });
        });

    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

// Xóa tin nhắn
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const sql = 'DELETE FROM lien_he WHERE id = ?';
        
        db.query(sql, [id], (err, result) => {
            if (err) {
                console.error('Error deleting message:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra!'
                });
            }

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy tin nhắn!'
                });
            }

            res.json({
                success: true,
                message: 'Xóa tin nhắn thành công!'
            });
        });

    } catch (error) {
        console.error('Delete message error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

// Đếm tin nhắn chưa đọc
router.get('/unread-count', async (req, res) => {
    try {
        const sql = "SELECT COUNT(*) as count FROM lien_he WHERE trang_thai = 'chua_doc'";
        
        db.query(sql, (err, result) => {
            if (err) {
                console.error('Error counting unread:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra!'
                });
            }

            res.json({
                success: true,
                count: result[0].count
            });
        });

    } catch (error) {
        console.error('Count unread error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

module.exports = router;

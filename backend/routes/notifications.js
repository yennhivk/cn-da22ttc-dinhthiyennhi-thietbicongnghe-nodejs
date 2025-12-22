const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('./auth');

// Tạo bảng thông báo nếu chưa có
async function ensureNotificationsTable() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS thong_bao (
                ma_thong_bao INT AUTO_INCREMENT PRIMARY KEY,
                ma_tai_khoan INT DEFAULT NULL COMMENT 'NULL = thông báo cho tất cả người dùng',
                loai_thong_bao ENUM('order', 'promotion', 'system', 'news') DEFAULT 'system',
                tieu_de VARCHAR(255) NOT NULL,
                noi_dung TEXT,
                duong_dan VARCHAR(255) DEFAULT NULL,
                da_doc TINYINT(1) DEFAULT 0,
                ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Tạo bảng theo dõi trạng thái đọc cho thông báo chung
        await db.query(`
            CREATE TABLE IF NOT EXISTS thong_bao_da_doc (
                ma_tai_khoan INT NOT NULL,
                ma_thong_bao INT NOT NULL,
                ngay_doc DATETIME DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (ma_tai_khoan, ma_thong_bao),
                FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE,
                FOREIGN KEY (ma_thong_bao) REFERENCES thong_bao(ma_thong_bao) ON DELETE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
    } catch (error) {
        console.error('Error creating notifications table:', error);
    }
}

ensureNotificationsTable();

// Lấy tất cả thông báo của user (bao gồm thông báo chung và riêng)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;
        const { type, unread_only } = req.query;

        let query = `
            SELECT 
                tb.ma_thong_bao,
                tb.loai_thong_bao,
                tb.tieu_de,
                tb.noi_dung,
                tb.duong_dan,
                tb.ngay_tao,
                CASE 
                    WHEN tb.ma_tai_khoan IS NULL THEN 
                        CASE WHEN tbd.ma_tai_khoan IS NOT NULL THEN 1 ELSE 0 END
                    ELSE tb.da_doc
                END as da_doc
            FROM thong_bao tb
            LEFT JOIN thong_bao_da_doc tbd ON tb.ma_thong_bao = tbd.ma_thong_bao AND tbd.ma_tai_khoan = ?
            WHERE (tb.ma_tai_khoan IS NULL OR tb.ma_tai_khoan = ?)
        `;
        const params = [userId, userId];

        if (type && type !== 'all') {
            query += ` AND tb.loai_thong_bao = ?`;
            params.push(type);
        }

        if (unread_only === 'true') {
            query += ` AND (
                (tb.ma_tai_khoan IS NULL AND tbd.ma_tai_khoan IS NULL) OR
                (tb.ma_tai_khoan IS NOT NULL AND tb.da_doc = 0)
            )`;
        }

        query += ` ORDER BY tb.ngay_tao DESC LIMIT 50`;

        const [notifications] = await db.query(query, params);

        // Lấy thêm thông báo từ khuyến mãi đang hoạt động
        const [promotions] = await db.query(`
            SELECT 
                ma_khuyen_mai as ma_thong_bao,
                'promotion' as loai_thong_bao,
                CONCAT('🎁 ', ten_khuyen_mai) as tieu_de,
                CONCAT(mo_ta, ' - Mã: ', ma_giam_gia) as noi_dung,
                'promotions.html' as duong_dan,
                ngay_bat_dau as ngay_tao,
                0 as da_doc
            FROM khuyen_mai 
            WHERE trang_thai = 1 AND ngay_ket_thuc >= NOW()
            ORDER BY ngay_bat_dau DESC
        `);

        // Lấy thông báo đơn hàng của user
        const [orderNotifications] = await db.query(`
            SELECT 
                dh.ma_don_hang as ma_thong_bao,
                'order' as loai_thong_bao,
                CASE 
                    WHEN dh.trang_thai_don_hang = 'dang_xu_ly' THEN CONCAT('📦 Đơn hàng #', dh.ma_don_hang, ' đang được xử lý')
                    WHEN dh.trang_thai_don_hang = 'dang_giao' THEN CONCAT('🚚 Đơn hàng #', dh.ma_don_hang, ' đang được giao')
                    WHEN dh.trang_thai_don_hang = 'hoan_thanh' THEN CONCAT('✅ Đơn hàng #', dh.ma_don_hang, ' đã hoàn thành')
                    WHEN dh.trang_thai_don_hang = 'da_huy' THEN CONCAT('❌ Đơn hàng #', dh.ma_don_hang, ' đã bị hủy')
                    ELSE CONCAT('Đơn hàng #', dh.ma_don_hang)
                END as tieu_de,
                CONCAT('Tổng tiền: ', FORMAT(dh.tong_tien, 0), 'đ') as noi_dung,
                'order-history.html' as duong_dan,
                dh.ngay_tao,
                0 as da_doc
            FROM don_hang dh
            WHERE dh.ma_tai_khoan = ?
            ORDER BY dh.ngay_tao DESC
            LIMIT 10
        `, [userId]);

        // Kết hợp tất cả thông báo
        let allNotifications = [...notifications];
        
        // Thêm khuyến mãi nếu filter là all hoặc promotion
        if (!type || type === 'all' || type === 'promotion') {
            allNotifications = [...allNotifications, ...promotions];
        }
        
        // Thêm đơn hàng nếu filter là all hoặc order
        if (!type || type === 'all' || type === 'order') {
            allNotifications = [...allNotifications, ...orderNotifications];
        }

        // Sắp xếp theo thời gian mới nhất
        allNotifications.sort((a, b) => new Date(b.ngay_tao) - new Date(a.ngay_tao));

        res.json({
            success: true,
            data: allNotifications.slice(0, 50)
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thông báo' });
    }
});

// Lấy thông báo công khai (không cần đăng nhập) - khuyến mãi và tin tức
router.get('/public', async (req, res) => {
    try {
        // Lấy khuyến mãi đang hoạt động
        const [promotions] = await db.query(`
            SELECT 
                CONCAT('promo_', ma_khuyen_mai) as id,
                'promotion' as type,
                CONCAT('🎁 ', ten_khuyen_mai) as title,
                CONCAT(mo_ta, ' - Mã: ', ma_giam_gia) as message,
                'promotions.html' as link,
                ngay_bat_dau as time,
                'fa-tag' as icon,
                'text-red-500' as iconColor
            FROM khuyen_mai 
            WHERE trang_thai = 1 AND ngay_ket_thuc >= NOW()
            ORDER BY ngay_bat_dau DESC
            LIMIT 10
        `);

        // Lấy tin tức mới
        const [news] = await db.query(`
            SELECT 
                CONCAT('news_', ma_tin) as id,
                'system' as type,
                CONCAT('📰 ', tieu_de) as title,
                LEFT(noi_dung, 100) as message,
                CONCAT('news-detail.html?id=', ma_tin) as link,
                ngay_dang as time,
                'fa-newspaper' as icon,
                'text-blue-500' as iconColor
            FROM tin_tuc 
            WHERE trang_thai = 'hien_thi'
            ORDER BY ngay_dang DESC
            LIMIT 5
        `);

        // Thông báo hệ thống mặc định
        const systemNotifications = [
            {
                id: 'system_welcome',
                type: 'system',
                title: 'Chào mừng bạn đến với Yến Nhi Tech!',
                message: 'Khám phá ngay các sản phẩm công nghệ hàng đầu với giá tốt nhất.',
                link: null,
                time: new Date(),
                icon: 'fa-bell',
                iconColor: 'text-yellow-500'
            }
        ];

        const allNotifications = [...promotions, ...news, ...systemNotifications];
        allNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));

        res.json({
            success: true,
            data: allNotifications
        });
    } catch (error) {
        console.error('Get public notifications error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thông báo' });
    }
});

// Đánh dấu thông báo đã đọc
router.put('/:id/read', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;
        const notificationId = req.params.id;

        // Kiểm tra thông báo có tồn tại không
        const [notification] = await db.query(
            'SELECT * FROM thong_bao WHERE ma_thong_bao = ?',
            [notificationId]
        );

        if (notification.length === 0) {
            return res.json({ success: true, message: 'OK' }); // Có thể là thông báo từ khuyến mãi/đơn hàng
        }

        if (notification[0].ma_tai_khoan === null) {
            // Thông báo chung - thêm vào bảng đã đọc
            await db.query(`
                INSERT IGNORE INTO thong_bao_da_doc (ma_tai_khoan, ma_thong_bao)
                VALUES (?, ?)
            `, [userId, notificationId]);
        } else {
            // Thông báo riêng - cập nhật trực tiếp
            await db.query(
                'UPDATE thong_bao SET da_doc = 1 WHERE ma_thong_bao = ? AND ma_tai_khoan = ?',
                [notificationId, userId]
            );
        }

        res.json({ success: true, message: 'Đã đánh dấu đã đọc' });
    } catch (error) {
        console.error('Mark notification read error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });
    }
});

// Đánh dấu tất cả đã đọc
router.put('/read-all', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;

        // Đánh dấu thông báo riêng
        await db.query(
            'UPDATE thong_bao SET da_doc = 1 WHERE ma_tai_khoan = ?',
            [userId]
        );

        // Đánh dấu thông báo chung
        await db.query(`
            INSERT IGNORE INTO thong_bao_da_doc (ma_tai_khoan, ma_thong_bao)
            SELECT ?, ma_thong_bao FROM thong_bao WHERE ma_tai_khoan IS NULL
        `, [userId]);

        res.json({ success: true, message: 'Đã đánh dấu tất cả đã đọc' });
    } catch (error) {
        console.error('Mark all read error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật thông báo' });
    }
});

// Đếm số thông báo chưa đọc
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;

        // Đếm thông báo riêng chưa đọc
        const [privateUnread] = await db.query(`
            SELECT COUNT(*) as count FROM thong_bao 
            WHERE ma_tai_khoan = ? AND da_doc = 0
        `, [userId]);

        // Đếm thông báo chung chưa đọc
        const [publicUnread] = await db.query(`
            SELECT COUNT(*) as count FROM thong_bao tb
            LEFT JOIN thong_bao_da_doc tbd ON tb.ma_thong_bao = tbd.ma_thong_bao AND tbd.ma_tai_khoan = ?
            WHERE tb.ma_tai_khoan IS NULL AND tbd.ma_tai_khoan IS NULL
        `, [userId]);

        // Đếm khuyến mãi đang hoạt động (coi như chưa đọc)
        const [promoCount] = await db.query(`
            SELECT COUNT(*) as count FROM khuyen_mai 
            WHERE trang_thai = 1 AND ngay_ket_thuc >= NOW()
        `);

        const totalUnread = (privateUnread[0]?.count || 0) + 
                           (publicUnread[0]?.count || 0) + 
                           (promoCount[0]?.count || 0);

        res.json({
            success: true,
            data: { unread_count: totalUnread }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, message: 'Lỗi đếm thông báo' });
    }
});

module.exports = router;

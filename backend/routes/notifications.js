const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('./auth');

// Lấy tất cả thông báo của user (từ bảng khuyến mãi và đơn hàng)
router.get('/', authenticateToken, async (req, res) => {
    const userId = req.user.ma_tai_khoan;
    const { type } = req.query;

    console.log('📬 Get notifications for user:', userId, 'type:', type);

    let allNotifications = [];

    // 1. Lấy thông báo khuyến mãi đang hoạt động
    if (!type || type === 'all' || type === 'promotion') {
        try {
            const [promotions] = await db.query(`
                SELECT 
                    CONCAT('promo_', ma_khuyen_mai) as id,
                    'promotion' as type,
                    CONCAT('🎁 ', ten_khuyen_mai) as title,
                    CONCAT(IFNULL(mo_ta, ''), ' - Mã: ', IFNULL(ma_giam_gia, '')) as message,
                    'promotions.html' as link,
                    ngay_bat_dau as time,
                    0 as is_read
                FROM khuyen_mai 
                WHERE trang_thai = 1 AND ngay_ket_thuc >= NOW()
                ORDER BY ngay_bat_dau DESC
                LIMIT 10
            `);
            console.log('📢 Promotions found:', promotions.length);
            // Map is_read to read for frontend
            const mappedPromos = promotions.map(p => ({ ...p, read: p.is_read }));
            allNotifications = [...allNotifications, ...mappedPromos];
        } catch (promoError) {
            console.error('❌ Error fetching promotions:', promoError.message);
        }
    }

    // 2. Lấy thông báo đơn hàng của user
    if (!type || type === 'all' || type === 'order') {
        try {
            const [orders] = await db.query(`
                SELECT 
                    CONCAT('order_', dh.ma_don_hang) as id,
                    'order' as type,
                    CASE 
                        WHEN dh.trang_thai_don_hang = 'dang_xu_ly' THEN CONCAT('📦 Đơn hàng #', dh.ma_don_hang, ' đang được xử lý')
                        WHEN dh.trang_thai_don_hang = 'dang_giao' THEN CONCAT('🚚 Đơn hàng #', dh.ma_don_hang, ' đang được giao')
                        WHEN dh.trang_thai_don_hang = 'hoan_thanh' THEN CONCAT('✅ Đơn hàng #', dh.ma_don_hang, ' đã hoàn thành')
                        WHEN dh.trang_thai_don_hang = 'da_huy' THEN CONCAT('❌ Đơn hàng #', dh.ma_don_hang, ' đã bị hủy')
                        ELSE CONCAT('Đơn hàng #', dh.ma_don_hang)
                    END as title,
                    CONCAT('Tổng tiền: ', FORMAT(dh.tong_tien, 0), 'đ') as message,
                    'order-history.html' as link,
                    dh.ngay_tao as time,
                    0 as is_read
                FROM don_hang dh
                WHERE dh.ma_tai_khoan = ?
                ORDER BY dh.ngay_tao DESC
                LIMIT 20
            `, [userId]);
            console.log('📦 Orders found:', orders.length);
            // Map is_read to read for frontend
            const mappedOrders = orders.map(o => ({ ...o, read: o.is_read }));
            allNotifications = [...allNotifications, ...mappedOrders];
        } catch (orderError) {
            console.error('❌ Error fetching orders:', orderError.message);
        }
    }

    // 3. Thêm thông báo hệ thống mặc định - LUÔN thêm vào
    if (!type || type === 'all' || type === 'system') {
        allNotifications.push({
            id: 'system_welcome',
            type: 'system',
            title: '🔔 Chào mừng bạn đến với Yến Nhi Tech!',
            message: 'Cảm ơn bạn đã đăng ký tài khoản. Khám phá ngay các sản phẩm công nghệ hàng đầu.',
            link: null,
            time: new Date(),
            read: 0
        });
    }

    // Sắp xếp theo thời gian mới nhất
    allNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    console.log('✅ Total notifications:', allNotifications.length);

    res.json({
        success: true,
        data: allNotifications
    });
});

// Lấy thông báo công khai (không cần đăng nhập) - chỉ khuyến mãi
router.get('/public', async (req, res) => {
    console.log('📬 Get public notifications');
    
    let allNotifications = [];

    // Lấy khuyến mãi đang hoạt động
    try {
        const [promotions] = await db.query(`
            SELECT 
                CONCAT('promo_', ma_khuyen_mai) as id,
                'promotion' as type,
                CONCAT('🎁 ', ten_khuyen_mai) as title,
                CONCAT(IFNULL(mo_ta, ''), ' - Mã: ', IFNULL(ma_giam_gia, '')) as message,
                'promotions.html' as link,
                ngay_bat_dau as time,
                0 as is_read
            FROM khuyen_mai 
            WHERE trang_thai = 1 AND ngay_ket_thuc >= NOW()
            ORDER BY ngay_bat_dau DESC
            LIMIT 10
        `);
        console.log('📢 Public promotions found:', promotions.length);
        // Map is_read to read for frontend
        const mappedPromos = promotions.map(p => ({ ...p, read: p.is_read }));
        allNotifications = [...mappedPromos];
    } catch (promoError) {
        console.error('❌ Error fetching public promotions:', promoError.message);
        // Không throw error, tiếp tục với thông báo mặc định
    }

    // Thông báo hệ thống mặc định - LUÔN thêm vào
    allNotifications.push({
        id: 'system_welcome',
        type: 'system',
        title: '🔔 Chào mừng bạn đến với Yến Nhi Tech!',
        message: 'Khám phá ngay các sản phẩm công nghệ hàng đầu với giá tốt nhất.',
        link: null,
        time: new Date(),
        read: 0
    });

    allNotifications.sort((a, b) => new Date(b.time) - new Date(a.time));

    console.log('✅ Total public notifications:', allNotifications.length);

    res.json({
        success: true,
        data: allNotifications
    });
});

// Đếm số thông báo (khuyến mãi + đơn hàng mới)
router.get('/unread-count', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;

        // Đếm khuyến mãi đang hoạt động
        const [promoCount] = await db.query(`
            SELECT COUNT(*) as count FROM khuyen_mai 
            WHERE trang_thai = 1 AND ngay_ket_thuc >= NOW()
        `);

        // Đếm đơn hàng của user (trong 30 ngày gần đây)
        const [orderCount] = await db.query(`
            SELECT COUNT(*) as count FROM don_hang 
            WHERE ma_tai_khoan = ? AND ngay_tao >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [userId]);

        // +1 cho thông báo hệ thống chào mừng
        const totalCount = (promoCount[0]?.count || 0) + (orderCount[0]?.count || 0) + 1;

        res.json({
            success: true,
            data: { unread_count: totalCount }
        });
    } catch (error) {
        console.error('Get unread count error:', error);
        res.status(500).json({ success: false, message: 'Lỗi đếm thông báo' });
    }
});

// Đánh dấu đã đọc
router.put('/:id/read', authenticateToken, async (req, res) => {
    res.json({ success: true, message: 'OK' });
});

// Đánh dấu tất cả đã đọc
router.put('/read-all', authenticateToken, async (req, res) => {
    res.json({ success: true, message: 'OK' });
});

module.exports = router;

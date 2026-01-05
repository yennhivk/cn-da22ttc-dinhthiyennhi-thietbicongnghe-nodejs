const express = require('express');
const router = express.Router();
const db = require('../config/database');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Import middleware từ auth.js
const { authenticateToken, requireAdmin } = require('./auth');

// Cấu hình multer upload ảnh sản phẩm
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../images/products');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Chỉ chấp nhận file ảnh'));
    }
});

// ==========================================
// DASHBOARD - THỐNG KÊ
// ==========================================
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('📊 Dashboard request received');
        const { startDate, endDate } = req.query;
        console.log('📅 Date filters:', { startDate, endDate });
        
        // Xây dựng điều kiện lọc theo khoảng ngày
        let dateFilter = '';
        let dateFilterOrders = '';
        let dateFilterDH = ''; // Cho bảng don_hang với alias dh
        
        if (startDate && endDate) {
            dateFilter = `AND DATE(ngay_tao) BETWEEN '${startDate}' AND '${endDate}'`;
            dateFilterOrders = `WHERE DATE(ngay_tao) BETWEEN '${startDate}' AND '${endDate}'`;
            dateFilterDH = `AND DATE(dh.ngay_tao) BETWEEN '${startDate}' AND '${endDate}'`;
        } else if (startDate) {
            dateFilter = `AND DATE(ngay_tao) >= '${startDate}'`;
            dateFilterOrders = `WHERE DATE(ngay_tao) >= '${startDate}'`;
            dateFilterDH = `AND DATE(dh.ngay_tao) >= '${startDate}'`;
        } else if (endDate) {
            dateFilter = `AND DATE(ngay_tao) <= '${endDate}'`;
            dateFilterOrders = `WHERE DATE(ngay_tao) <= '${endDate}'`;
            dateFilterDH = `AND DATE(dh.ngay_tao) <= '${endDate}'`;
        }

        console.log('1️⃣ Query revenue...');
        // Tổng doanh thu (theo filter)
        const [revenue] = await db.query(`
            SELECT COALESCE(SUM(tong_tien), 0) as total_revenue 
            FROM don_hang 
            WHERE trang_thai_don_hang = 'hoan_thanh' ${dateFilter}
        `);
        console.log('✅ Revenue done');

        console.log('2️⃣ Query orders...');
        // Tổng đơn hàng (theo filter)
        const [orders] = await db.query(`
            SELECT COUNT(*) as total_orders FROM don_hang ${dateFilterOrders}
        `);
        console.log('✅ Orders done');

        console.log('3️⃣ Query products...');
        // Tổng sản phẩm
        const [products] = await db.query(`SELECT COUNT(*) as total_products FROM san_pham`);
        console.log('✅ Products done');

        console.log('4️⃣ Query customers...');
        // Tổng khách hàng (theo filter - khách hàng đăng ký trong khoảng thời gian)
        let customerQuery = `SELECT COUNT(*) as total_customers FROM tai_khoan WHERE vai_tro = 'khach_hang'`;
        if (startDate || endDate) {
            customerQuery = `SELECT COUNT(*) as total_customers FROM tai_khoan WHERE vai_tro = 'khach_hang' ${dateFilter}`;
        }
        const [customers] = await db.query(customerQuery);
        console.log('✅ Customers done');

        console.log('5️⃣ Query ordersByStatus...');
        // Đơn hàng theo trạng thái (theo filter)
        let statusQuery = `SELECT trang_thai_don_hang as trang_thai, COUNT(*) as count FROM don_hang`;
        if (startDate || endDate) {
            statusQuery += ` ${dateFilterOrders}`;
        }
        statusQuery += ` GROUP BY trang_thai_don_hang`;
        const [ordersByStatus] = await db.query(statusQuery);
        console.log('✅ OrdersByStatus done');

        console.log('6️⃣ Query recentOrders...');
        // Đơn hàng gần đây
        const [recentOrders] = await db.query(`
            SELECT dh.*, dh.trang_thai_don_hang as trang_thai, tk.ten_dang_nhap, tk.email
            FROM don_hang dh
            LEFT JOIN tai_khoan tk ON dh.ma_tai_khoan = tk.ma_tai_khoan
            ORDER BY dh.ngay_tao DESC
            LIMIT 10
        `);
        console.log('✅ RecentOrders done');

        console.log('7️⃣ Query topProducts...');
        // Sản phẩm bán chạy
        const [topProducts] = await db.query(`
            SELECT sp.ma_san_pham, sp.ten_san_pham, sp.gia,
                   (SELECT duong_dan_anh FROM anh_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = 1 LIMIT 1) as anh_chinh,
                   COALESCE(SUM(ctdh.so_luong), 0) as total_sold
            FROM san_pham sp
            LEFT JOIN chi_tiet_don_hang ctdh ON sp.ma_san_pham = ctdh.ma_san_pham
            LEFT JOIN don_hang dh ON ctdh.ma_don_hang = dh.ma_don_hang AND dh.trang_thai_don_hang = 'hoan_thanh'
            GROUP BY sp.ma_san_pham, sp.ten_san_pham, sp.gia
            ORDER BY total_sold DESC
            LIMIT 5
        `);
        console.log('✅ TopProducts done');

        console.log('8️⃣ Query topCustomers...');
        // Top 10 khách hàng mua nhiều nhất
        const [topCustomers] = await db.query(`
            SELECT 
                tk.ma_tai_khoan,
                tk.ten_dang_nhap as ho_ten,
                tk.email,
                COUNT(dh.ma_don_hang) as total_orders,
                COALESCE(SUM(dh.tong_tien), 0) as total_spent
            FROM tai_khoan tk
            JOIN don_hang dh ON tk.ma_tai_khoan = dh.ma_tai_khoan
            WHERE dh.trang_thai_don_hang = 'hoan_thanh' ${dateFilterDH}
            GROUP BY tk.ma_tai_khoan, tk.ten_dang_nhap, tk.email
            ORDER BY total_spent DESC
            LIMIT 10
        `);
        console.log('✅ TopCustomers done');

        console.log('9️⃣ Query monthlyRevenue...');
        // Doanh thu theo tháng (12 tháng gần nhất - KHÔNG bị filter)
        const [monthlyRevenue] = await db.query(`
            SELECT 
                DATE_FORMAT(ngay_tao, '%Y-%m') as month,
                COALESCE(SUM(tong_tien), 0) as revenue
            FROM don_hang
            WHERE trang_thai_don_hang = 'hoan_thanh' AND ngay_tao >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(ngay_tao, '%Y-%m')
            ORDER BY month ASC
        `);
        console.log('✅ MonthlyRevenue done:', monthlyRevenue.length, 'months');

        console.log('🔟 Query categoryStats...');
        // Thống kê sản phẩm theo danh mục (DỮ LIỆU THỰC)
        const [categoryStats] = await db.query(`
            SELECT 
                dm.ten_danh_muc,
                COUNT(sp.ma_san_pham) as so_san_pham,
                COALESCE(SUM(sp.so_luong), 0) as tong_ton_kho,
                COALESCE(SUM(sp.so_luong * sp.gia), 0) as gia_tri_ton_kho
            FROM danh_muc_san_pham dm
            LEFT JOIN san_pham sp ON dm.ma_danh_muc = sp.ma_danh_muc AND sp.trang_thai = 'hien_thi'
            GROUP BY dm.ma_danh_muc, dm.ten_danh_muc
            ORDER BY dm.ten_danh_muc
        `);
        console.log('✅ CategoryStats done');

        console.log('1️⃣1️⃣ Query categoryRevenue...');
        // Doanh thu theo danh mục (DỮ LIỆU THỰC)
        const [categoryRevenue] = await db.query(`
            SELECT 
                dm.ten_danh_muc,
                COALESCE(SUM(ctdh.so_luong * ctdh.gia_ban), 0) as doanh_thu
            FROM danh_muc_san_pham dm
            LEFT JOIN san_pham sp ON dm.ma_danh_muc = sp.ma_danh_muc
            LEFT JOIN chi_tiet_don_hang ctdh ON sp.ma_san_pham = ctdh.ma_san_pham
            LEFT JOIN don_hang dh ON ctdh.ma_don_hang = dh.ma_don_hang AND dh.trang_thai_don_hang = 'hoan_thanh'
            GROUP BY dm.ma_danh_muc, dm.ten_danh_muc
            ORDER BY doanh_thu DESC
        `);
        console.log('✅ CategoryRevenue done');

        console.log('1️⃣2️⃣ Query totalSold...');
        // Tổng số lượng sản phẩm đã bán (theo filter)
        const [totalSold] = await db.query(`
            SELECT COALESCE(SUM(ctdh.so_luong), 0) as total_sold
            FROM chi_tiet_don_hang ctdh
            JOIN don_hang dh ON ctdh.ma_don_hang = dh.ma_don_hang
            WHERE dh.trang_thai_don_hang = 'hoan_thanh' ${dateFilterDH}
        `);
        console.log('✅ TotalSold done');

        console.log('1️⃣3️⃣ Query newsStats...');
        // Thống kê tin tức theo danh mục
        let newsStats = [];
        try {
            const [news] = await db.query(`
                SELECT danh_muc, COUNT(*) as so_bai, SUM(luot_xem) as tong_luot_xem
                FROM tin_tuc
                WHERE trang_thai = 'hien_thi'
                GROUP BY danh_muc
                ORDER BY so_bai DESC
            `);
            newsStats = news;
        } catch (e) {
            console.log('⚠️ News stats error:', e.message);
        }
        console.log('✅ NewsStats done');

        console.log('1️⃣4️⃣ Query newsMonthlyStats...');
        // Thống kê bài viết theo tháng và danh mục (12 tháng gần nhất)
        let newsMonthlyStats = [];
        try {
            const [newsMonthly] = await db.query(`
                SELECT 
                    DATE_FORMAT(ngay_tao, '%Y-%m') as thang,
                    danh_muc,
                    COUNT(*) as so_bai
                FROM tin_tuc
                WHERE trang_thai = 'hien_thi' AND ngay_tao >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(ngay_tao, '%Y-%m'), danh_muc
                ORDER BY thang ASC, danh_muc
            `);
            newsMonthlyStats = newsMonthly;
        } catch (e) {
            console.log('⚠️ News monthly stats error:', e.message);
        }
        console.log('✅ NewsMonthlyStats done');

        console.log('1️⃣5️⃣ Query topRatedProducts...');
        // Top sản phẩm được đánh giá cao nhất (theo điểm trung bình)
        let topRatedProducts = [];
        try {
            const [rated] = await db.query(`
                SELECT 
                    sp.ma_san_pham,
                    sp.ten_san_pham,
                    COUNT(dg.ma_danh_gia) as so_danh_gia,
                    ROUND(AVG(dg.so_sao), 1) as diem_trung_binh
                FROM san_pham sp
                JOIN danh_gia dg ON sp.ma_san_pham = dg.ma_san_pham
                GROUP BY sp.ma_san_pham, sp.ten_san_pham
                HAVING COUNT(dg.ma_danh_gia) >= 1
                ORDER BY diem_trung_binh DESC, so_danh_gia DESC
                LIMIT 10
            `);
            topRatedProducts = rated;
        } catch (e) {
            console.log('⚠️ Top rated products error:', e.message);
        }
        console.log('✅ TopRatedProducts done');

        console.log('1️⃣6️⃣ Query customerGrowth...');
        // Tỷ lệ tăng trưởng khách hàng theo tháng (12 tháng gần nhất)
        let customerGrowth = [];
        try {
            const [growth] = await db.query(`
                SELECT 
                    DATE_FORMAT(ngay_tao, '%Y-%m') as thang,
                    COUNT(*) as so_khach_moi
                FROM tai_khoan
                WHERE vai_tro = 'khach_hang' AND ngay_tao >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(ngay_tao, '%Y-%m')
                ORDER BY thang ASC
            `);
            customerGrowth = growth;
        } catch (e) {
            console.log('⚠️ Customer growth error:', e.message);
        }
        console.log('✅ CustomerGrowth done');

        console.log('✅ All queries done, sending response...');
        res.json({
            success: true,
            data: {
                stats: {
                    total_revenue: revenue[0].total_revenue,
                    total_orders: orders[0].total_orders,
                    total_products: products[0].total_products,
                    total_customers: customers[0].total_customers,
                    total_sold: totalSold[0].total_sold
                },
                orders_by_status: ordersByStatus,
                recent_orders: recentOrders,
                top_products: topProducts,
                top_customers: topCustomers,
                monthly_revenue: monthlyRevenue,
                category_stats: categoryStats,
                category_revenue: categoryRevenue,
                news_stats: newsStats,
                news_monthly_stats: newsMonthlyStats,
                top_rated_products: topRatedProducts,
                customer_growth: customerGrowth
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error.message);
        console.error('Dashboard error stack:', error.stack);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
});

// ==========================================
// QUẢN LÝ SẢN PHẨM
// ==========================================

// Lấy tất cả sản phẩm (admin - bao gồm cả ẩn)
router.get('/products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 100, search, category, status } = req.query;

        console.log('🔍 Admin products search:', { search, category, status });

        let whereClause = '1=1';
        const params = [];

        if (search && search.trim()) {
            whereClause += ` AND (sp.ten_san_pham LIKE ? OR sp.thuong_hieu LIKE ? OR sp.mo_ta LIKE ?)`;
            const searchTerm = `%${search.trim()}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }
        if (category) {
            whereClause += ` AND sp.ma_danh_muc = ?`;
            params.push(category);
        }
        if (status) {
            whereClause += ` AND sp.trang_thai = ?`;
            params.push(status);
        }

        const query = `
            SELECT sp.*, dm.ten_danh_muc,
                   (SELECT duong_dan_anh FROM anh_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = 1 LIMIT 1) as anh_chinh
            FROM san_pham sp
            LEFT JOIN danh_muc_san_pham dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE ${whereClause}
            ORDER BY sp.ma_san_pham DESC
            LIMIT ${parseInt(limit)}
        `;

        console.log('🔍 Query:', query);
        console.log('🔍 Params:', params);

        const [products] = await db.query(query, params);

        console.log('🔍 Found:', products.length, 'products');

        res.json({
            success: true,
            data: products,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: products.length
            }
        });
    } catch (error) {
        console.error('❌ Get products error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server: ' + error.message });
    }
});

// Lấy chi tiết sản phẩm
router.get('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [products] = await db.query(`
            SELECT sp.*, dm.ten_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc_san_pham dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE sp.ma_san_pham = ?
        `, [req.params.id]);

        if (products.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
        }

        const [images] = await db.query(`SELECT * FROM anh_san_pham WHERE ma_san_pham = ?`, [req.params.id]);

        res.json({
            success: true,
            data: { ...products[0], images }
        });
    } catch (error) {
        console.error('Get product error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Thêm sản phẩm mới
router.post('/products', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ten_san_pham, mo_ta, gia, so_luong, thuong_hieu, ma_danh_muc, trang_thai = 'hien_thi' } = req.body;

        if (!ten_san_pham || !gia) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        const [result] = await db.query(`
            INSERT INTO san_pham (ten_san_pham, mo_ta, gia, so_luong, thuong_hieu, ma_danh_muc, trang_thai, ngay_tao)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        `, [ten_san_pham, mo_ta, gia, so_luong || 0, thuong_hieu, ma_danh_muc, trang_thai]);

        res.status(201).json({
            success: true,
            message: 'Thêm sản phẩm thành công',
            data: { ma_san_pham: result.insertId }
        });
    } catch (error) {
        console.error('Create product error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Cập nhật sản phẩm
router.put('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ten_san_pham, mo_ta, gia, so_luong, thuong_hieu, ma_danh_muc, trang_thai } = req.body;

        await db.query(`
            UPDATE san_pham SET
                ten_san_pham = COALESCE(?, ten_san_pham),
                mo_ta = COALESCE(?, mo_ta),
                gia = COALESCE(?, gia),
                so_luong = COALESCE(?, so_luong),
                thuong_hieu = COALESCE(?, thuong_hieu),
                ma_danh_muc = COALESCE(?, ma_danh_muc),
                trang_thai = COALESCE(?, trang_thai),
                ngay_cap_nhat = NOW()
            WHERE ma_san_pham = ?
        `, [ten_san_pham, mo_ta, gia, so_luong, thuong_hieu, ma_danh_muc, trang_thai, req.params.id]);

        res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });
    } catch (error) {
        console.error('Update product error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Xóa sản phẩm
router.delete('/products/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const productId = req.params.id;
        
        // Kiểm tra sản phẩm có trong đơn hàng không
        const [orderCheck] = await db.query(
            `SELECT COUNT(*) as count FROM chi_tiet_don_hang WHERE ma_san_pham = ?`, 
            [productId]
        );
        
        if (orderCheck[0].count > 0) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không thể xóa sản phẩm này vì đã có trong đơn hàng. Hãy ẩn sản phẩm thay vì xóa.' 
            });
        }
        
        // Xóa các bản ghi liên quan
        await db.query(`DELETE FROM anh_san_pham WHERE ma_san_pham = ?`, [productId]);
        await db.query(`DELETE FROM danh_gia WHERE ma_san_pham = ?`, [productId]);
        await db.query(`DELETE FROM gio_hang WHERE ma_san_pham = ?`, [productId]);
        
        // Xóa sản phẩm
        await db.query(`DELETE FROM san_pham WHERE ma_san_pham = ?`, [productId]);

        res.json({ success: true, message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Lỗi khi xóa sản phẩm: ' + error.message });
    }
});

// Upload ảnh sản phẩm
router.post('/products/:id/images', authenticateToken, requireAdmin, upload.array('images', 5), async (req, res) => {
    try {
        const productId = req.params.id;
        const isMain = req.body.is_main === 'true' || req.body.is_main === '1';

        console.log('📸 Upload request - Product ID:', productId);
        console.log('📸 Files received:', req.files?.length || 0);

        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ success: false, message: 'Vui lòng chọn ảnh' });
        }

        // Kiểm tra sản phẩm tồn tại
        const [product] = await db.query('SELECT ma_san_pham FROM san_pham WHERE ma_san_pham = ?', [productId]);
        if (product.length === 0) {
            return res.status(404).json({ success: false, message: 'Sản phẩm không tồn tại' });
        }

        // Tạo bảng anh_san_pham nếu chưa có
        await db.query(`
            CREATE TABLE IF NOT EXISTS anh_san_pham (
                ma_anh INT AUTO_INCREMENT PRIMARY KEY,
                ma_san_pham INT NOT NULL,
                duong_dan_anh VARCHAR(500) NOT NULL,
                la_anh_chinh TINYINT(1) DEFAULT 0,
                ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Nếu là ảnh chính, bỏ flag ảnh chính cũ
        if (isMain) {
            await db.query(`UPDATE anh_san_pham SET la_anh_chinh = 0 WHERE ma_san_pham = ?`, [productId]);
        }

        const insertedImages = [];
        for (let i = 0; i < req.files.length; i++) {
            const file = req.files[i];
            const imagePath = '/images/products/' + file.filename;
            console.log('📸 Saving image:', imagePath);
            
            const [result] = await db.query(`
                INSERT INTO anh_san_pham (ma_san_pham, duong_dan_anh, la_anh_chinh)
                VALUES (?, ?, ?)
            `, [productId, imagePath, isMain && i === 0 ? 1 : 0]);
            insertedImages.push({ ma_anh: result.insertId, duong_dan_anh: imagePath });
        }

        console.log('✅ Upload success:', insertedImages.length, 'images');
        res.json({ success: true, message: 'Upload ảnh thành công', data: insertedImages });
    } catch (error) {
        console.error('❌ Upload image error:', error.message);
        console.error('❌ Stack:', error.stack);
        res.status(500).json({ success: false, message: 'Lỗi upload: ' + error.message });
    }
});

// ==========================================
// QUẢN LÝ DANH MỤC
// ==========================================

router.get('/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT dm.*, COUNT(sp.ma_san_pham) as so_san_pham
            FROM danh_muc_san_pham dm
            LEFT JOIN san_pham sp ON dm.ma_danh_muc = sp.ma_danh_muc
            GROUP BY dm.ma_danh_muc
            ORDER BY dm.ten_danh_muc
        `);
        res.json({ success: true, data: categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.post('/categories', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ten_danh_muc, mo_ta } = req.body;
        if (!ten_danh_muc) {
            return res.status(400).json({ success: false, message: 'Tên danh mục là bắt buộc' });
        }

        const [result] = await db.query(`
            INSERT INTO danh_muc_san_pham (ten_danh_muc, mo_ta) VALUES (?, ?)
        `, [ten_danh_muc, mo_ta]);

        res.status(201).json({
            success: true,
            message: 'Thêm danh mục thành công',
            data: { ma_danh_muc: result.insertId }
        });
    } catch (error) {
        console.error('Create category error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.put('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ten_danh_muc, mo_ta } = req.body;
        await db.query(`
            UPDATE danh_muc_san_pham SET ten_danh_muc = ?, mo_ta = ? WHERE ma_danh_muc = ?
        `, [ten_danh_muc, mo_ta, req.params.id]);

        res.json({ success: true, message: 'Cập nhật danh mục thành công' });
    } catch (error) {
        console.error('Update category error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.delete('/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Kiểm tra có sản phẩm trong danh mục không
        const [products] = await db.query(`SELECT COUNT(*) as count FROM san_pham WHERE ma_danh_muc = ?`, [req.params.id]);
        if (products[0].count > 0) {
            return res.status(400).json({ success: false, message: 'Không thể xóa danh mục có sản phẩm' });
        }

        await db.query(`DELETE FROM danh_muc_san_pham WHERE ma_danh_muc = ?`, [req.params.id]);
        res.json({ success: true, message: 'Xóa danh mục thành công' });
    } catch (error) {
        console.error('Delete category error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});


// ==========================================
// QUẢN LÝ ĐƠN HÀNG
// ==========================================

// API thống kê đơn hàng chi tiết
router.get('/orders/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        console.log('📊 Loading order stats...');
        
        // Khởi tạo giá trị mặc định
        let totalOrders = 0;
        let totalRevenue = 0;
        let completedRevenue = 0;
        let statusStats = [];
        let monthlyRevenue = [];
        let paymentStats = [];
        let recentOrders = [];

        // 1. Tổng đơn hàng và doanh thu
        try {
            const [rows] = await db.query(`
                SELECT 
                    COUNT(*) as total_orders,
                    COALESCE(SUM(tong_tien), 0) as total_revenue,
                    COALESCE(SUM(CASE WHEN trang_thai_don_hang = 'hoan_thanh' THEN tong_tien ELSE 0 END), 0) as completed_revenue
                FROM don_hang
            `);
            if (rows && rows[0]) {
                totalOrders = rows[0].total_orders || 0;
                totalRevenue = rows[0].total_revenue || 0;
                completedRevenue = rows[0].completed_revenue || 0;
            }
            console.log('✅ Total stats:', { totalOrders, totalRevenue, completedRevenue });
        } catch (e) {
            console.log('⚠️ Lỗi query tổng:', e.message);
        }

        // 2. Đơn hàng theo trạng thái
        try {
            const [rows] = await db.query(`
                SELECT trang_thai_don_hang as trang_thai, COUNT(*) as count, COALESCE(SUM(tong_tien), 0) as revenue
                FROM don_hang GROUP BY trang_thai_don_hang
            `);
            if (rows) statusStats = rows;
            console.log('✅ Status stats:', statusStats);
        } catch (e) {
            console.log('⚠️ Lỗi query trạng thái:', e.message);
        }

        // 3. Doanh thu theo tháng
        try {
            const [rows] = await db.query(`
                SELECT DATE_FORMAT(ngay_tao, '%Y-%m') as month, DATE_FORMAT(ngay_tao, '%m/%Y') as month_label,
                       COUNT(*) as order_count, COALESCE(SUM(tong_tien), 0) as revenue
                FROM don_hang WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
                GROUP BY DATE_FORMAT(ngay_tao, '%Y-%m') ORDER BY month ASC
            `);
            if (rows) monthlyRevenue = rows;
            console.log('✅ Monthly revenue:', monthlyRevenue.length, 'months');
        } catch (e) {
            console.log('⚠️ Lỗi query tháng:', e.message);
        }

        // 4. Phương thức thanh toán - lấy từ bảng thanh_toan
        try {
            const [rows] = await db.query(`
                SELECT tt.phuong_thuc, COUNT(DISTINCT tt.ma_don_hang) as count, 
                       COALESCE(SUM(dh.tong_tien), 0) as revenue
                FROM thanh_toan tt
                LEFT JOIN don_hang dh ON tt.ma_don_hang = dh.ma_don_hang
                GROUP BY tt.phuong_thuc
            `);
            if (rows && rows.length > 0) {
                paymentStats = rows;
            } else {
                // Nếu không có dữ liệu trong bảng thanh_toan, mặc định COD
                paymentStats = [{ phuong_thuc: 'COD', count: totalOrders, revenue: totalRevenue }];
            }
            console.log('✅ Payment stats:', paymentStats);
        } catch (e) {
            console.log('⚠️ Lỗi query thanh toán:', e.message);
            paymentStats = [{ phuong_thuc: 'COD', count: totalOrders, revenue: totalRevenue }];
        }

        // 5. Đơn hàng gần đây
        try {
            const [rows] = await db.query(`
                SELECT dh.ma_don_hang, dh.tong_tien, dh.trang_thai_don_hang as trang_thai, dh.ngay_tao, tk.ten_dang_nhap
                FROM don_hang dh LEFT JOIN tai_khoan tk ON dh.ma_tai_khoan = tk.ma_tai_khoan
                ORDER BY dh.ngay_tao DESC LIMIT 5
            `);
            if (rows) recentOrders = rows;
            console.log('✅ Recent orders:', recentOrders.length);
        } catch (e) {
            console.log('⚠️ Lỗi query recent:', e.message);
        }

        console.log('📊 Sending response...');
        res.json({
            success: true,
            data: {
                total_orders: totalOrders,
                total_revenue: totalRevenue,
                completed_revenue: completedRevenue,
                avg_order_value: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
                status_stats: statusStats,
                monthly_revenue: monthlyRevenue,
                payment_stats: paymentStats,
                recent_orders: recentOrders
            }
        });
    } catch (error) {
        console.error('❌ Order stats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi: ' + error.message });
    }
});

router.get('/orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT dh.*, dh.trang_thai_don_hang as trang_thai, dh.dia_chi_giao_hang as dia_chi_giao, 
                   tk.ten_dang_nhap, tk.email,
                   (SELECT COUNT(*) FROM chi_tiet_don_hang WHERE ma_don_hang = dh.ma_don_hang) as so_san_pham
            FROM don_hang dh
            LEFT JOIN tai_khoan tk ON dh.ma_tai_khoan = tk.ma_tai_khoan
            WHERE 1=1
        `;
        const params = [];

        if (status) {
            query += ` AND dh.trang_thai_don_hang = ?`;
            params.push(status);
        }
        if (search) {
            query += ` AND (CAST(dh.ma_don_hang AS CHAR) LIKE ? OR tk.ten_dang_nhap LIKE ? OR tk.email LIKE ? OR dh.dia_chi_giao_hang LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
        }

        query += ` ORDER BY dh.ngay_tao DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [orders] = await db.query(query, params);

        // Count total
        const [countResult] = await db.query(`SELECT COUNT(*) as total FROM don_hang`);

        res.json({
            success: true,
            data: orders,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total
            }
        });
    } catch (error) {
        console.error('Get orders error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.get('/orders/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [orders] = await db.query(`
            SELECT dh.*, dh.trang_thai_don_hang as trang_thai, dh.dia_chi_giao_hang as dia_chi_giao,
                   tk.ten_dang_nhap, tk.email
            FROM don_hang dh
            LEFT JOIN tai_khoan tk ON dh.ma_tai_khoan = tk.ma_tai_khoan
            WHERE dh.ma_don_hang = ?
        `, [req.params.id]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const [items] = await db.query(`
            SELECT ctdh.*, sp.ten_san_pham,
                   (SELECT duong_dan_anh FROM anh_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = 1 LIMIT 1) as anh_chinh
            FROM chi_tiet_don_hang ctdh
            LEFT JOIN san_pham sp ON ctdh.ma_san_pham = sp.ma_san_pham
            WHERE ctdh.ma_don_hang = ?
        `, [req.params.id]);

        res.json({
            success: true,
            data: { ...orders[0], items }
        });
    } catch (error) {
        console.error('Get order error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.put('/orders/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { trang_thai } = req.body;
        const validStatuses = ['dang_xu_ly', 'dang_giao', 'hoan_thanh', 'da_huy'];

        if (!validStatuses.includes(trang_thai)) {
            return res.status(400).json({ success: false, message: 'Trạng thái không hợp lệ' });
        }

        await db.query(`UPDATE don_hang SET trang_thai_don_hang = ? WHERE ma_don_hang = ?`, 
            [trang_thai, req.params.id]);

        res.json({ success: true, message: 'Cập nhật trạng thái đơn hàng thành công' });
    } catch (error) {
        console.error('Update order status error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ==========================================
// QUẢN LÝ TÀI KHOẢN
// ==========================================

router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, role, search, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT 
                tk.ma_tai_khoan, 
                tk.ten_dang_nhap, 
                tk.email, 
                tk.vai_tro, 
                tk.trang_thai, 
                tk.hinh_anh, 
                tk.ngay_tao, 
                tk.google_id,
                tk.so_dien_thoai,
                COUNT(DISTINCT dh.ma_don_hang) as so_don_hang
            FROM tai_khoan tk
            LEFT JOIN don_hang dh ON tk.ma_tai_khoan = dh.ma_tai_khoan
            WHERE 1=1
        `;
        const params = [];

        if (role) {
            query += ` AND tk.vai_tro = ?`;
            params.push(role);
        }
        if (status !== undefined) {
            query += ` AND tk.trang_thai = ?`;
            params.push(parseInt(status));
        }
        if (search) {
            query += ` AND (tk.ten_dang_nhap LIKE ? OR tk.email LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        query += ` GROUP BY tk.ma_tai_khoan ORDER BY tk.ngay_tao DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [users] = await db.query(query, params);
        const [countResult] = await db.query(`SELECT COUNT(*) as total FROM tai_khoan`);

        res.json({
            success: true,
            data: users,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult[0].total
            }
        });
    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT 
                tk.ma_tai_khoan, 
                tk.ten_dang_nhap, 
                tk.email, 
                tk.vai_tro, 
                tk.trang_thai, 
                tk.hinh_anh, 
                tk.ngay_tao,
                tk.google_id,
                tk.so_dien_thoai,
                COUNT(DISTINCT dh.ma_don_hang) as so_don_hang
            FROM tai_khoan tk
            LEFT JOIN don_hang dh ON tk.ma_tai_khoan = dh.ma_tai_khoan
            WHERE tk.ma_tai_khoan = ?
            GROUP BY tk.ma_tai_khoan
        `, [req.params.id]);

        if (users.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản' });
        }

        // Lấy lịch sử đơn hàng
        const [orders] = await db.query(`
            SELECT ma_don_hang, tong_tien, trang_thai_don_hang as trang_thai, ngay_tao
            FROM don_hang WHERE ma_tai_khoan = ?
            ORDER BY ngay_tao DESC LIMIT 10
        `, [req.params.id]);

        res.json({
            success: true,
            data: { ...users[0], orders }
        });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ten_dang_nhap, email, mat_khau, vai_tro = 'khach_hang' } = req.body;

        if (!ten_dang_nhap || !email || !mat_khau) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc' });
        }

        // Kiểm tra email tồn tại
        const [existing] = await db.query(`SELECT ma_tai_khoan FROM tai_khoan WHERE email = ?`, [email]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Email đã tồn tại' });
        }

        const hashedPassword = await bcrypt.hash(mat_khau, 10);
        const [result] = await db.query(`
            INSERT INTO tai_khoan (ten_dang_nhap, email, mat_khau, vai_tro, trang_thai, ngay_tao)
            VALUES (?, ?, ?, ?, 1, NOW())
        `, [ten_dang_nhap, email, hashedPassword, vai_tro]);

        res.status(201).json({
            success: true,
            message: 'Tạo tài khoản thành công',
            data: { ma_tai_khoan: result.insertId }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ten_dang_nhap, vai_tro, trang_thai } = req.body;

        await db.query(`
            UPDATE tai_khoan SET
                ten_dang_nhap = COALESCE(?, ten_dang_nhap),
                vai_tro = COALESCE(?, vai_tro),
                trang_thai = COALESCE(?, trang_thai)
            WHERE ma_tai_khoan = ?
        `, [ten_dang_nhap, vai_tro, trang_thai, req.params.id]);

        res.json({ success: true, message: 'Cập nhật tài khoản thành công' });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.put('/users/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.query(`
            UPDATE tai_khoan SET trang_thai = IF(trang_thai = 1, 0, 1) WHERE ma_tai_khoan = ?
        `, [req.params.id]);

        res.json({ success: true, message: 'Đã thay đổi trạng thái tài khoản' });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Không cho xóa chính mình
        if (parseInt(req.params.id) === req.user.ma_tai_khoan) {
            return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính mình' });
        }

        await db.query(`DELETE FROM khach_hang WHERE ma_tai_khoan = ?`, [req.params.id]);
        await db.query(`DELETE FROM tai_khoan WHERE ma_tai_khoan = ?`, [req.params.id]);

        res.json({ success: true, message: 'Xóa tài khoản thành công' });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ==========================================
// QUẢN LÝ ĐÁNH GIÁ
// ==========================================

router.get('/reviews', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT dg.*, tk.ten_dang_nhap, sp.ten_san_pham
            FROM danh_gia dg
            LEFT JOIN tai_khoan tk ON dg.ma_tai_khoan = tk.ma_tai_khoan
            LEFT JOIN san_pham sp ON dg.ma_san_pham = sp.ma_san_pham
            WHERE 1=1
        `;
        const params = [];

        if (status !== undefined) {
            query += ` AND dg.trang_thai = ?`;
            params.push(parseInt(status));
        }

        query += ` ORDER BY dg.ngay_tao DESC LIMIT ? OFFSET ?`;
        params.push(parseInt(limit), parseInt(offset));

        const [reviews] = await db.query(query, params);

        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('Get reviews error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.put('/reviews/:id/toggle-status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.query(`UPDATE danh_gia SET trang_thai = IF(trang_thai = 1, 0, 1) WHERE ma_danh_gia = ?`, [req.params.id]);
        res.json({ success: true, message: 'Đã thay đổi trạng thái đánh giá' });
    } catch (error) {
        console.error('Toggle review status error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

router.delete('/reviews/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.query(`DELETE FROM danh_gia WHERE ma_danh_gia = ?`, [req.params.id]);
        res.json({ success: true, message: 'Xóa đánh giá thành công' });
    } catch (error) {
        console.error('Delete review error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ==========================================
// TẠO ĐƠN HÀNG MẪU ĐỂ TEST
// ==========================================
router.post('/create-sample-orders', authenticateToken, requireAdmin, async (req, res) => {
    try {
        // Lấy ma_tai_khoan của admin hiện tại
        const adminId = req.user.ma_tai_khoan;

        // Tạo 5 đơn hàng mẫu với các trạng thái khác nhau (theo schema: dang_xu_ly, dang_giao, hoan_thanh, da_huy)
        const orders = [
            { tong_tien: 25990000, trang_thai: 'dang_xu_ly', dia_chi: '123 Nguyễn Văn A, Q.1, TP.HCM' },
            { tong_tien: 15500000, trang_thai: 'dang_xu_ly', dia_chi: '456 Lê Văn B, Q.3, TP.HCM' },
            { tong_tien: 34900000, trang_thai: 'dang_giao', dia_chi: '789 Trần Văn C, Q.7, TP.HCM' },
            { tong_tien: 8990000, trang_thai: 'hoan_thanh', dia_chi: '321 Phạm Văn D, Q.Bình Thạnh, TP.HCM' },
            { tong_tien: 12000000, trang_thai: 'da_huy', dia_chi: '654 Hoàng Văn E, Q.Tân Bình, TP.HCM' }
        ];

        const insertedOrders = [];
        for (const order of orders) {
            const [result] = await db.query(`
                INSERT INTO don_hang (ma_tai_khoan, tong_tien, trang_thai_don_hang, dia_chi_giao_hang, ngay_tao)
                VALUES (?, ?, ?, ?, NOW() - INTERVAL FLOOR(RAND() * 7) DAY)
            `, [adminId, order.tong_tien, order.trang_thai, order.dia_chi]);
            insertedOrders.push(result.insertId);
        }

        res.json({
            success: true,
            message: `Đã tạo ${insertedOrders.length} đơn hàng mẫu`,
            data: { order_ids: insertedOrders }
        });
    } catch (error) {
        console.error('Create sample orders error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo đơn hàng mẫu: ' + error.message });
    }
});

// ==========================================
// QUẢN LÝ KHUYẾN MÃI
// ==========================================

// Lấy tất cả khuyến mãi
router.get('/promotions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [promotions] = await db.query(`
            SELECT * FROM khuyen_mai ORDER BY ma_khuyen_mai DESC
        `);
        res.json({ success: true, data: promotions });
    } catch (error) {
        console.error('Get promotions error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách khuyến mãi' });
    }
});

// Lấy chi tiết 1 khuyến mãi
router.get('/promotions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [promotions] = await db.query('SELECT * FROM khuyen_mai WHERE ma_khuyen_mai = ?', [req.params.id]);
        if (promotions.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy khuyến mãi' });
        }
        res.json({ success: true, data: promotions[0] });
    } catch (error) {
        console.error('Get promotion error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy thông tin khuyến mãi' });
    }
});

// Thêm khuyến mãi mới
router.post('/promotions', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ten_khuyen_mai, ma_giam_gia, mo_ta, ngay_bat_dau, ngay_ket_thuc, dieu_kien_ap_dung, trang_thai } = req.body;
        
        // Kiểm tra mã giảm giá đã tồn tại
        const [existing] = await db.query('SELECT ma_khuyen_mai FROM khuyen_mai WHERE ma_giam_gia = ?', [ma_giam_gia]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã tồn tại' });
        }

        const [result] = await db.query(`
            INSERT INTO khuyen_mai (ten_khuyen_mai, ma_giam_gia, mo_ta, ngay_bat_dau, ngay_ket_thuc, dieu_kien_ap_dung, trang_thai)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [ten_khuyen_mai, ma_giam_gia, mo_ta, ngay_bat_dau, ngay_ket_thuc, dieu_kien_ap_dung, trang_thai || 1]);

        // Tự động tạo thông báo cho tất cả người dùng về khuyến mãi mới
        try {
            await db.query(`
                INSERT INTO thong_bao (ma_tai_khoan, loai_thong_bao, tieu_de, noi_dung, duong_dan)
                VALUES (NULL, 'promotion', ?, ?, 'promotions.html')
            `, [`🎁 ${ten_khuyen_mai}`, `${mo_ta} - Mã: ${ma_giam_gia}`]);
        } catch (notifError) {
            console.log('Could not create notification:', notifError.message);
        }

        res.json({ success: true, message: 'Thêm khuyến mãi thành công', data: { id: result.insertId } });
    } catch (error) {
        console.error('Create promotion error:', error);
        res.status(500).json({ success: false, message: 'Lỗi thêm khuyến mãi: ' + error.message });
    }
});

// Cập nhật khuyến mãi
router.put('/promotions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ten_khuyen_mai, ma_giam_gia, mo_ta, ngay_bat_dau, ngay_ket_thuc, dieu_kien_ap_dung, trang_thai } = req.body;
        
        // Kiểm tra mã giảm giá trùng với khuyến mãi khác
        const [existing] = await db.query('SELECT ma_khuyen_mai FROM khuyen_mai WHERE ma_giam_gia = ? AND ma_khuyen_mai != ?', [ma_giam_gia, req.params.id]);
        if (existing.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã giảm giá đã được sử dụng' });
        }

        await db.query(`
            UPDATE khuyen_mai 
            SET ten_khuyen_mai = ?, ma_giam_gia = ?, mo_ta = ?, ngay_bat_dau = ?, ngay_ket_thuc = ?, dieu_kien_ap_dung = ?, trang_thai = ?
            WHERE ma_khuyen_mai = ?
        `, [ten_khuyen_mai, ma_giam_gia, mo_ta, ngay_bat_dau, ngay_ket_thuc, dieu_kien_ap_dung, trang_thai, req.params.id]);

        res.json({ success: true, message: 'Cập nhật khuyến mãi thành công' });
    } catch (error) {
        console.error('Update promotion error:', error);
        res.status(500).json({ success: false, message: 'Lỗi cập nhật khuyến mãi: ' + error.message });
    }
});

// Xóa khuyến mãi
router.delete('/promotions/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM khuyen_mai WHERE ma_khuyen_mai = ?', [req.params.id]);
        res.json({ success: true, message: 'Xóa khuyến mãi thành công' });
    } catch (error) {
        console.error('Delete promotion error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa khuyến mãi' });
    }
});

// API public cho trang frontend lấy khuyến mãi đang hoạt động
router.get('/public/promotions', async (req, res) => {
    try {
        const [promotions] = await db.query(`
            SELECT ma_khuyen_mai, ten_khuyen_mai, ma_giam_gia, mo_ta, ngay_bat_dau, ngay_ket_thuc, dieu_kien_ap_dung
            FROM khuyen_mai 
            WHERE trang_thai = 1 AND ngay_ket_thuc >= NOW()
            ORDER BY ngay_bat_dau ASC
        `);
        res.json({ success: true, data: promotions });
    } catch (error) {
        console.error('Get public promotions error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách khuyến mãi' });
    }
});

// ==========================================
// API KIỂM TRA VÀ ÁP DỤNG MÃ GIẢM GIÁ (PUBLIC)
// ==========================================
router.post('/public/apply-promo', async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        
        if (!code) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập mã giảm giá' });
        }
        
        // Tìm mã giảm giá trong database
        const [promos] = await db.query(`
            SELECT * FROM khuyen_mai 
            WHERE ma_giam_gia = ? AND trang_thai = 1 AND ngay_ket_thuc >= NOW()
        `, [code.toUpperCase()]);
        
        if (promos.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Mã giảm giá không hợp lệ hoặc đã hết hạn' 
            });
        }
        
        const promo = promos[0];
        let discountAmount = 0;
        let discountPercent = 0;
        let message = '';
        
        // Phân tích mô tả để lấy % giảm giá
        // Ví dụ: "Giảm 20% cho tất cả đơn hàng trên 5 triệu"
        const percentMatch = promo.mo_ta.match(/(\d+)%/);
        if (percentMatch) {
            discountPercent = parseInt(percentMatch[1]);
        }
        
        // Kiểm tra điều kiện áp dụng
        const conditionMatch = promo.dieu_kien_ap_dung ? promo.dieu_kien_ap_dung.match(/>=?\s*([\d.,]+)/) : null;
        let minOrderValue = 0;
        
        if (conditionMatch) {
            // Chuyển đổi giá trị (ví dụ: "5.000.000" -> 5000000)
            minOrderValue = parseInt(conditionMatch[1].replace(/[.,]/g, ''));
        }
        
        // Kiểm tra đơn hàng có đủ điều kiện không
        if (minOrderValue > 0 && subtotal < minOrderValue) {
            return res.status(400).json({
                success: false,
                message: `Đơn hàng phải từ ${new Intl.NumberFormat('vi-VN').format(minOrderValue)}đ để áp dụng mã này`,
                minOrderValue: minOrderValue
            });
        }
        
        // Tính số tiền giảm
        if (discountPercent > 0) {
            discountAmount = Math.round(subtotal * discountPercent / 100);
            message = `Giảm ${discountPercent}% (${new Intl.NumberFormat('vi-VN').format(discountAmount)}đ)`;
        } else {
            // Nếu không có %, giả sử giảm cố định (có thể mở rộng logic sau)
            discountAmount = 0;
            message = promo.mo_ta;
        }
        
        res.json({
            success: true,
            data: {
                code: promo.ma_giam_gia,
                name: promo.ten_khuyen_mai,
                description: promo.mo_ta,
                discountPercent: discountPercent,
                discountAmount: discountAmount,
                minOrderValue: minOrderValue,
                message: message,
                validUntil: promo.ngay_ket_thuc
            }
        });
        
    } catch (error) {
        console.error('Apply promo error:', error);
        res.status(500).json({ success: false, message: 'Lỗi kiểm tra mã giảm giá' });
    }
});

// ==========================================
// QUẢN LÝ THÔNG BÁO (ADMIN)
// ==========================================

// Lấy tất cả thông báo
router.get('/notifications', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const [notifications] = await db.query(`
            SELECT tb.*, tk.ten_dang_nhap
            FROM thong_bao tb
            LEFT JOIN tai_khoan tk ON tb.ma_tai_khoan = tk.ma_tai_khoan
            ORDER BY tb.ngay_tao DESC
            LIMIT 100
        `);
        res.json({ success: true, data: notifications });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Lỗi lấy danh sách thông báo' });
    }
});

// Tạo thông báo mới (gửi cho tất cả hoặc 1 user cụ thể)
router.post('/notifications', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { ma_tai_khoan, loai_thong_bao, tieu_de, noi_dung, duong_dan } = req.body;

        if (!tieu_de) {
            return res.status(400).json({ success: false, message: 'Tiêu đề là bắt buộc' });
        }

        const [result] = await db.query(`
            INSERT INTO thong_bao (ma_tai_khoan, loai_thong_bao, tieu_de, noi_dung, duong_dan)
            VALUES (?, ?, ?, ?, ?)
        `, [ma_tai_khoan || null, loai_thong_bao || 'system', tieu_de, noi_dung, duong_dan]);

        res.json({ success: true, message: 'Tạo thông báo thành công', data: { id: result.insertId } });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ success: false, message: 'Lỗi tạo thông báo: ' + error.message });
    }
});

// Xóa thông báo
router.delete('/notifications/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        await db.query('DELETE FROM thong_bao_da_doc WHERE ma_thong_bao = ?', [req.params.id]);
        await db.query('DELETE FROM thong_bao WHERE ma_thong_bao = ?', [req.params.id]);
        res.json({ success: true, message: 'Xóa thông báo thành công' });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Lỗi xóa thông báo' });
    }
});

module.exports = router;

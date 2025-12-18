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
        // Tổng doanh thu
        const [revenue] = await db.query(`
            SELECT COALESCE(SUM(tong_tien), 0) as total_revenue 
            FROM don_hang 
            WHERE trang_thai_don_hang = 'hoan_thanh'
        `);

        // Tổng đơn hàng
        const [orders] = await db.query(`SELECT COUNT(*) as total_orders FROM don_hang`);

        // Tổng sản phẩm
        const [products] = await db.query(`SELECT COUNT(*) as total_products FROM san_pham`);

        // Tổng khách hàng
        const [customers] = await db.query(`
            SELECT COUNT(*) as total_customers FROM tai_khoan WHERE vai_tro = 'khach_hang'
        `);

        // Đơn hàng theo trạng thái
        const [ordersByStatus] = await db.query(`
            SELECT trang_thai_don_hang as trang_thai, COUNT(*) as count 
            FROM don_hang 
            GROUP BY trang_thai_don_hang
        `);

        // Đơn hàng gần đây
        const [recentOrders] = await db.query(`
            SELECT dh.*, dh.trang_thai_don_hang as trang_thai, tk.ten_dang_nhap, tk.email
            FROM don_hang dh
            LEFT JOIN tai_khoan tk ON dh.ma_tai_khoan = tk.ma_tai_khoan
            ORDER BY dh.ngay_tao DESC
            LIMIT 10
        `);

        // Sản phẩm bán chạy
        const [topProducts] = await db.query(`
            SELECT sp.ma_san_pham, sp.ten_san_pham, sp.gia,
                   (SELECT duong_dan_anh FROM anh_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = 1 LIMIT 1) as anh_chinh,
                   COALESCE(SUM(ctdh.so_luong), 0) as total_sold
            FROM san_pham sp
            LEFT JOIN chi_tiet_don_hang ctdh ON sp.ma_san_pham = ctdh.ma_san_pham
            LEFT JOIN don_hang dh ON ctdh.ma_don_hang = dh.ma_don_hang AND dh.trang_thai_don_hang = 'hoan_thanh'
            GROUP BY sp.ma_san_pham
            ORDER BY total_sold DESC
            LIMIT 5
        `);

        // Doanh thu theo tháng (12 tháng gần nhất)
        const [monthlyRevenue] = await db.query(`
            SELECT 
                DATE_FORMAT(ngay_tao, '%Y-%m') as month,
                SUM(tong_tien) as revenue
            FROM don_hang
            WHERE trang_thai_don_hang = 'hoan_thanh' AND ngay_tao >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(ngay_tao, '%Y-%m')
            ORDER BY month DESC
        `);

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

        // Tổng số lượng sản phẩm đã bán
        const [totalSold] = await db.query(`
            SELECT COALESCE(SUM(ctdh.so_luong), 0) as total_sold
            FROM chi_tiet_don_hang ctdh
            JOIN don_hang dh ON ctdh.ma_don_hang = dh.ma_don_hang
            WHERE dh.trang_thai_don_hang = 'hoan_thanh'
        `);

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
                monthly_revenue: monthlyRevenue,
                category_stats: categoryStats,
                category_revenue: categoryRevenue
            }
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
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
        await db.query(`DELETE FROM anh_san_pham WHERE ma_san_pham = ?`, [req.params.id]);
        await db.query(`DELETE FROM san_pham WHERE ma_san_pham = ?`, [req.params.id]);

        res.json({ success: true, message: 'Xóa sản phẩm thành công' });
    } catch (error) {
        console.error('Delete product error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
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
        // Tổng đơn hàng và doanh thu
        const [totalStats] = await db.query(`
            SELECT 
                COUNT(*) as total_orders,
                COALESCE(SUM(tong_tien), 0) as total_revenue,
                COALESCE(SUM(CASE WHEN trang_thai_don_hang = 'hoan_thanh' THEN tong_tien ELSE 0 END), 0) as completed_revenue
            FROM don_hang
        `);

        // Đơn hàng theo trạng thái
        const [statusStats] = await db.query(`
            SELECT 
                trang_thai_don_hang as trang_thai,
                COUNT(*) as count,
                COALESCE(SUM(tong_tien), 0) as revenue
            FROM don_hang
            GROUP BY trang_thai_don_hang
        `);

        // Doanh thu theo tháng (12 tháng gần nhất)
        const [monthlyRevenue] = await db.query(`
            SELECT 
                DATE_FORMAT(ngay_tao, '%Y-%m') as month,
                DATE_FORMAT(ngay_tao, '%m/%Y') as month_label,
                COUNT(*) as order_count,
                COALESCE(SUM(tong_tien), 0) as revenue
            FROM don_hang
            WHERE ngay_tao >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(ngay_tao, '%Y-%m')
            ORDER BY month ASC
        `);

        // Doanh thu theo phương thức thanh toán
        const [paymentStats] = await db.query(`
            SELECT 
                tt.phuong_thuc,
                COUNT(*) as count,
                COALESCE(SUM(tt.so_tien), 0) as revenue
            FROM thanh_toan tt
            GROUP BY tt.phuong_thuc
        `);

        // Đơn hàng gần đây
        const [recentOrders] = await db.query(`
            SELECT dh.ma_don_hang, dh.tong_tien, dh.trang_thai_don_hang as trang_thai, 
                   dh.ngay_tao, tk.ten_dang_nhap
            FROM don_hang dh
            LEFT JOIN tai_khoan tk ON dh.ma_tai_khoan = tk.ma_tai_khoan
            ORDER BY dh.ngay_tao DESC
            LIMIT 5
        `);

        res.json({
            success: true,
            data: {
                total_orders: totalStats[0].total_orders,
                total_revenue: totalStats[0].total_revenue,
                completed_revenue: totalStats[0].completed_revenue,
                status_stats: statusStats,
                monthly_revenue: monthlyRevenue,
                payment_stats: paymentStats,
                recent_orders: recentOrders
            }
        });
    } catch (error) {
        console.error('Order stats error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
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

module.exports = router;

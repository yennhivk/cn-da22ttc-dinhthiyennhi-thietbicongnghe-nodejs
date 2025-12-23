const express = require('express');
const router = express.Router();
const db = require('../config/database');

// GET - Lấy tất cả sản phẩm với thông tin ảnh và danh mục
router.get('/', async (req, res) => {
    try {
        const { category, brand, minPrice, maxPrice, search, sort } = req.query;
        
        let query = `
            SELECT 
                sp.ma_san_pham,
                sp.ten_san_pham,
                sp.mo_ta,
                sp.gia,
                sp.so_luong,
                sp.thuong_hieu,
                sp.trang_thai,
                dm.ten_danh_muc,
                dm.ma_danh_muc,
                (SELECT duong_dan_anh FROM anh_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = 1 LIMIT 1) as anh_chinh
            FROM san_pham sp
            LEFT JOIN danh_muc_san_pham dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE sp.trang_thai = 'hien_thi'
        `;
        
        const params = [];
        
        // Lọc theo danh mục
        if (category) {
            query += ` AND dm.ten_danh_muc LIKE ?`;
            params.push(`%${category}%`);
        }
        
        // Lọc theo thương hiệu
        if (brand) {
            query += ` AND sp.thuong_hieu LIKE ?`;
            params.push(`%${brand}%`);
        }
        
        // Lọc theo giá
        if (minPrice) {
            query += ` AND sp.gia >= ?`;
            params.push(parseFloat(minPrice));
        }
        if (maxPrice) {
            query += ` AND sp.gia <= ?`;
            params.push(parseFloat(maxPrice));
        }
        
        // Tìm kiếm
        if (search) {
            query += ` AND (sp.ten_san_pham LIKE ? OR sp.mo_ta LIKE ? OR sp.thuong_hieu LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }
        
        // Sắp xếp
        if (sort === 'price_asc') {
            query += ` ORDER BY sp.gia ASC`;
        } else if (sort === 'price_desc') {
            query += ` ORDER BY sp.gia DESC`;
        } else if (sort === 'newest') {
            query += ` ORDER BY sp.ngay_tao DESC`;
        } else {
            query += ` ORDER BY sp.ma_san_pham DESC`;
        }
        
        const [products] = await db.query(query, params);
        
        res.json({
            success: true,
            count: products.length,
            data: products
        });
    } catch (error) {
        console.error('Lỗi lấy danh sách sản phẩm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh sách sản phẩm',
            error: error.message
        });
    }
});

// GET - Lấy chi tiết sản phẩm theo ID
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Lấy thông tin sản phẩm
        const [products] = await db.query(`
            SELECT 
                sp.*,
                dm.ten_danh_muc,
                dm.ma_danh_muc
            FROM san_pham sp
            LEFT JOIN danh_muc_san_pham dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE sp.ma_san_pham = ? AND sp.trang_thai = 'hien_thi'
        `, [id]);
        
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        // Lấy tất cả ảnh của sản phẩm
        const [images] = await db.query(`
            SELECT * FROM anh_san_pham 
            WHERE ma_san_pham = ?
            ORDER BY la_anh_chinh DESC
        `, [id]);
        
        // Lấy đánh giá của sản phẩm
        const [reviews] = await db.query(`
            SELECT 
                dg.*,
                tk.ten_dang_nhap
            FROM danh_gia dg
            LEFT JOIN tai_khoan tk ON dg.ma_tai_khoan = tk.ma_tai_khoan
            WHERE dg.ma_san_pham = ? AND dg.trang_thai = 1
            ORDER BY dg.ngay_tao DESC
        `, [id]);
        
        const product = {
            ...products[0],
            images: images,
            reviews: reviews
        };
        
        res.json({
            success: true,
            data: product
        });
    } catch (error) {
        console.error('Lỗi lấy chi tiết sản phẩm:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy chi tiết sản phẩm',
            error: error.message
        });
    }
});

// GET - Lấy danh mục sản phẩm
router.get('/categories/all', async (req, res) => {
    try {
        const [categories] = await db.query(`
            SELECT 
                dm.*,
                COUNT(sp.ma_san_pham) as so_luong_san_pham
            FROM danh_muc_san_pham dm
            LEFT JOIN san_pham sp ON dm.ma_danh_muc = sp.ma_danh_muc AND sp.trang_thai = 'hien_thi'
            GROUP BY dm.ma_danh_muc
            ORDER BY dm.ten_danh_muc
        `);
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Lỗi lấy danh mục:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi lấy danh mục',
            error: error.message
        });
    }
});

// POST - Gửi đánh giá sản phẩm
router.post('/:id/reviews', async (req, res) => {
    try {
        const productId = req.params.id;
        const { so_sao, noi_dung } = req.body;
        
        // Kiểm tra token
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Vui lòng đăng nhập để đánh giá'
            });
        }
        
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret_key_here_change_in_production');
        } catch (err) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }
        
        const userId = decoded.ma_tai_khoan;
        
        // Validate input
        if (!so_sao || so_sao < 1 || so_sao > 5) {
            return res.status(400).json({
                success: false,
                message: 'Số sao phải từ 1 đến 5'
            });
        }
        
        if (!noi_dung || noi_dung.trim().length < 10) {
            return res.status(400).json({
                success: false,
                message: 'Nội dung đánh giá phải có ít nhất 10 ký tự'
            });
        }
        
        // Kiểm tra sản phẩm tồn tại
        const [products] = await db.query('SELECT ma_san_pham FROM san_pham WHERE ma_san_pham = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sản phẩm'
            });
        }
        
        // Kiểm tra xem user đã đánh giá sản phẩm này chưa
        const [existingReview] = await db.query(
            'SELECT ma_danh_gia FROM danh_gia WHERE ma_san_pham = ? AND ma_tai_khoan = ?',
            [productId, userId]
        );
        
        if (existingReview.length > 0) {
            // Cập nhật đánh giá cũ
            await db.query(
                'UPDATE danh_gia SET so_sao = ?, noi_dung = ?, ngay_tao = NOW() WHERE ma_san_pham = ? AND ma_tai_khoan = ?',
                [so_sao, noi_dung.trim(), productId, userId]
            );
            
            return res.json({
                success: true,
                message: 'Đã cập nhật đánh giá của bạn'
            });
        }
        
        // Thêm đánh giá mới
        await db.query(
            'INSERT INTO danh_gia (ma_san_pham, ma_tai_khoan, so_sao, noi_dung, trang_thai) VALUES (?, ?, ?, ?, 1)',
            [productId, userId, so_sao, noi_dung.trim()]
        );
        
        res.json({
            success: true,
            message: 'Đánh giá của bạn đã được gửi thành công'
        });
        
    } catch (error) {
        console.error('Lỗi gửi đánh giá:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi gửi đánh giá',
            error: error.message
        });
    }
});

module.exports = router;

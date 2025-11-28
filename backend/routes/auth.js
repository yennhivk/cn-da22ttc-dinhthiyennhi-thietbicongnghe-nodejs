const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// ==========================================
// ĐĂNG KÝ TÀI KHOẢN MỚI
// ==========================================
router.post('/register', async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau, email, vai_tro = 'khach_hang' } = req.body;

        // Validate input
        if (!ten_dang_nhap || !mat_khau || !email) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng điền đầy đủ thông tin'
            });
        }

        // Kiểm tra email hợp lệ
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({
                success: false,
                message: 'Email không hợp lệ'
            });
        }

        // Kiểm tra độ dài mật khẩu
        if (mat_khau.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu phải có ít nhất 6 ký tự'
            });
        }

        // Kiểm tra tên đăng nhập đã tồn tại
        const [existingUser] = await db.query(
            'SELECT ma_tai_khoan FROM tai_khoan WHERE ten_dang_nhap = ?',
            [ten_dang_nhap]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Tên đăng nhập đã tồn tại'
            });
        }

        // Kiểm tra email đã tồn tại
        const [existingEmail] = await db.query(
            'SELECT ma_tai_khoan FROM tai_khoan WHERE email = ?',
            [email]
        );

        if (existingEmail.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email đã được sử dụng'
            });
        }

        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt.hash(mat_khau, 10);

        // Thêm tài khoản mới vào database
        const [result] = await db.query(
            'INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, vai_tro, trang_thai) VALUES (?, ?, ?, ?, 1)',
            [ten_dang_nhap, hashedPassword, email, vai_tro]
        );

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công',
            data: {
                ma_tai_khoan: result.insertId,
                ten_dang_nhap,
                email,
                vai_tro
            }
        });

    } catch (error) {
        console.error('❌ Lỗi đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng ký',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// ĐĂNG NHẬP
// ==========================================
router.post('/login', async (req, res) => {
    try {
        const { ten_dang_nhap, mat_khau } = req.body;

        // Validate input
        if (!ten_dang_nhap || !mat_khau) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tên đăng nhập và mật khẩu'
            });
        }

        // Tìm tài khoản trong database
        const [users] = await db.query(
            'SELECT ma_tai_khoan, ten_dang_nhap, mat_khau, email, vai_tro, trang_thai FROM tai_khoan WHERE ten_dang_nhap = ?',
            [ten_dang_nhap]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        const user = users[0];

        // Kiểm tra trạng thái tài khoản
        if (user.trang_thai !== 1) {
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa'
            });
        }

        // So sánh mật khẩu
        const isPasswordValid = await bcrypt.compare(mat_khau, user.mat_khau);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Tên đăng nhập hoặc mật khẩu không đúng'
            });
        }

        // Tạo JWT token
        const token = jwt.sign(
            {
                ma_tai_khoan: user.ma_tai_khoan,
                ten_dang_nhap: user.ten_dang_nhap,
                vai_tro: user.vai_tro
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );

        // Lưu thông tin vào session
        req.session.user = {
            ma_tai_khoan: user.ma_tai_khoan,
            ten_dang_nhap: user.ten_dang_nhap,
            email: user.email,
            vai_tro: user.vai_tro
        };

        res.json({
            success: true,
            message: 'Đăng nhập thành công',
            data: {
                token,
                user: {
                    ma_tai_khoan: user.ma_tai_khoan,
                    ten_dang_nhap: user.ten_dang_nhap,
                    email: user.email,
                    vai_tro: user.vai_tro
                }
            }
        });

    } catch (error) {
        console.error('❌ Lỗi đăng nhập:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đăng nhập',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// ĐĂNG XUẤT
// ==========================================
router.post('/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({
                success: false,
                message: 'Lỗi khi đăng xuất'
            });
        }
        res.json({
            success: true,
            message: 'Đăng xuất thành công'
        });
    });
});

// ==========================================
// KIỂM TRA TRẠNG THÁI ĐĂNG NHẬP
// ==========================================
router.get('/me', async (req, res) => {
    try {
        // Kiểm tra session
        if (!req.session.user) {
            return res.status(401).json({
                success: false,
                message: 'Chưa đăng nhập'
            });
        }

        // Lấy thông tin user từ database
        const [users] = await db.query(
            'SELECT ma_tai_khoan, ten_dang_nhap, email, vai_tro, trang_thai FROM tai_khoan WHERE ma_tai_khoan = ?',
            [req.session.user.ma_tai_khoan]
        );

        if (users.length === 0) {
            req.session.destroy();
            return res.status(404).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        const user = users[0];

        if (user.trang_thai !== 1) {
            req.session.destroy();
            return res.status(403).json({
                success: false,
                message: 'Tài khoản đã bị khóa'
            });
        }

        res.json({
            success: true,
            data: {
                ma_tai_khoan: user.ma_tai_khoan,
                ten_dang_nhap: user.ten_dang_nhap,
                email: user.email,
                vai_tro: user.vai_tro
            }
        });

    } catch (error) {
        console.error('❌ Lỗi kiểm tra trạng thái:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// ==========================================
// MIDDLEWARE XÁC THỰC
// ==========================================
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Không tìm thấy token xác thực'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn'
            });
        }
        req.user = user;
        next();
    });
};

// ==========================================
// MIDDLEWARE KIỂM TRA QUYỀN ADMIN
// ==========================================
const requireAdmin = (req, res, next) => {
    if (req.user.vai_tro !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập'
        });
    }
    next();
};

module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.requireAdmin = requireAdmin;

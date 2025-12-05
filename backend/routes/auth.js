const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { sendOTPEmail, sendWelcomeEmail } = require('../config/mailer');

// Lưu trữ OTP tạm thời (trong production nên dùng Redis)
const otpStore = new Map();

// Cấu hình multer để upload ảnh
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../uploads/avatars');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
    fileFilter: function (req, file, cb) {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Chỉ chấp nhận file ảnh (jpeg, jpg, png, gif, webp)'));
    }
});

// ==========================================
// GỬI OTP XÁC NHẬN EMAIL ĐĂNG KÝ
// ==========================================
router.post('/send-register-otp', async (req, res) => {
    try {
        const ten_dang_nhap = req.body.ten_dang_nhap;
        const mat_khau = req.body.mat_khau;
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
        
        console.log('📝 Send OTP request:', { ten_dang_nhap, email });

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

        // Tạo OTP 6 số
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = Date.now() + 300000; // 5 phút (300 giây)

        // Mã hóa mật khẩu trước khi lưu tạm
        const hashedPassword = await bcrypt.hash(mat_khau, 10);

        // Lưu thông tin đăng ký tạm thời
        otpStore.set(email, {
            otp,
            expiresAt,
            registerData: {
                ten_dang_nhap,
                mat_khau: hashedPassword,
                email,
                vai_tro: 'khach_hang'
            }
        });

        // Gửi email OTP
        try {
            await sendOTPEmail(email, otp, ten_dang_nhap);
            console.log(`✅ Đã gửi OTP đăng ký đến ${email}`);
        } catch (emailError) {
            console.error('❌ Lỗi gửi email:', emailError);
            return res.status(500).json({
                success: false,
                message: 'Không thể gửi email xác nhận. Vui lòng thử lại.'
            });
        }

        res.json({
            success: true,
            message: 'Đã gửi mã xác nhận đến email của bạn'
        });

    } catch (error) {
        console.error('❌ Lỗi gửi OTP đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

// ==========================================
// XÁC NHẬN OTP VÀ TẠO TÀI KHOẢN
// ==========================================
router.post('/verify-register-otp', async (req, res) => {
    try {
        const email = req.body.email ? req.body.email.trim().toLowerCase() : '';
        const otp = req.body.otp ? req.body.otp.trim() : '';

        console.log('📧 Verify OTP request:', { email, otp, emailLength: email.length, otpLength: otp.length });
        console.log('📦 OTP Store keys:', Array.from(otpStore.keys()));

        const storedData = otpStore.get(email);

        if (!storedData) {
            console.log('❌ Không tìm thấy OTP cho email:', email);
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không tồn tại hoặc đã hết hạn. Vui lòng đăng ký lại.'
            });
        }

        console.log('✅ Found stored OTP:', storedData.otp, 'User input:', otp);
        console.log('⏰ Expires at:', new Date(storedData.expiresAt), 'Now:', new Date());

        // Kiểm tra hết hạn
        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(email);
            console.log('❌ OTP đã hết hạn');
            return res.status(400).json({
                success: false,
                message: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.'
            });
        }

        // Kiểm tra OTP - so sánh cả string
        if (String(storedData.otp) !== String(otp)) {
            console.log('❌ OTP không khớp. Stored:', storedData.otp, 'Input:', otp);
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không đúng'
            });
        }

        // OTP đúng - tạo tài khoản
        const { ten_dang_nhap, mat_khau, vai_tro } = storedData.registerData;

        const [result] = await db.query(
            'INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, vai_tro, trang_thai) VALUES (?, ?, ?, ?, 1)',
            [ten_dang_nhap, mat_khau, email, vai_tro]
        );

        // Xóa OTP
        otpStore.delete(email);

        // Gửi email chào mừng
        try {
            await sendWelcomeEmail(email, ten_dang_nhap);
            console.log(`✅ Đã gửi email chào mừng đến ${email}`);
        } catch (emailError) {
            console.error('⚠️ Không thể gửi email chào mừng:', emailError.message);
            // Không throw error vì đăng ký đã thành công
        }

        res.status(201).json({
            success: true,
            message: 'Đăng ký tài khoản thành công! Vui lòng đăng nhập.',
            data: {
                ma_tai_khoan: result.insertId,
                ten_dang_nhap,
                email,
                vai_tro
            }
        });

    } catch (error) {
        console.error('❌ Lỗi xác nhận OTP đăng ký:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

// ==========================================
// ĐĂNG KÝ TÀI KHOẢN MỚI (giữ lại cho tương thích)
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
        const { email, mat_khau } = req.body;

        // Validate input
        if (!email || !mat_khau) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập email và mật khẩu'
            });
        }

        // Tìm tài khoản trong database bằng email
        const [users] = await db.query(
            'SELECT ma_tai_khoan, ten_dang_nhap, mat_khau, email, vai_tro, trang_thai, hinh_anh FROM tai_khoan WHERE email = ?',
            [email]
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
                    vai_tro: user.vai_tro,
                    hinh_anh: user.hinh_anh || null
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

        // Lấy thông tin user từ database (bao gồm cả thông tin cá nhân)
        const [users] = await db.query(
            `SELECT tk.ma_tai_khoan, tk.ten_dang_nhap, tk.email, tk.vai_tro, tk.trang_thai, tk.hinh_anh,
                    kh.ho_ten, kh.so_dien_thoai, kh.dia_chi, kh.tinh_thanh, kh.quan_huyen
             FROM tai_khoan tk
             LEFT JOIN khach_hang kh ON tk.ma_tai_khoan = kh.ma_tai_khoan
             WHERE tk.ma_tai_khoan = ?`,
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
            user: {
                ma_tai_khoan: user.ma_tai_khoan,
                ten_dang_nhap: user.ten_dang_nhap,
                email: user.email,
                vai_tro: user.vai_tro,
                hinh_anh: user.hinh_anh,
                ho_ten: user.ho_ten,
                so_dien_thoai: user.so_dien_thoai,
                dia_chi: user.dia_chi,
                tinh_thanh: user.tinh_thanh,
                quan_huyen: user.quan_huyen
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

// ==========================================
// CẬP NHẬT THÔNG TIN TÀI KHOẢN
// ==========================================
router.put('/update-profile', authenticateToken, async (req, res) => {
    try {
        const { ten_dang_nhap } = req.body;
        const userId = req.user.ma_tai_khoan;

        await db.query(
            'UPDATE tai_khoan SET ten_dang_nhap = ? WHERE ma_tai_khoan = ?',
            [ten_dang_nhap, userId]
        );

        res.json({
            success: true,
            message: 'Cập nhật thông tin thành công'
        });
    } catch (error) {
        console.error('❌ Lỗi cập nhật profile:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi cập nhật thông tin'
        });
    }
});

// ==========================================
// UPLOAD AVATAR
// ==========================================
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn file ảnh'
            });
        }

        const userId = req.user.ma_tai_khoan;
        const avatarPath = '/uploads/avatars/' + req.file.filename;

        await db.query(
            'UPDATE tai_khoan SET hinh_anh = ? WHERE ma_tai_khoan = ?',
            [avatarPath, userId]
        );

        res.json({
            success: true,
            message: 'Upload avatar thành công',
            data: { hinh_anh: avatarPath }
        });
    } catch (error) {
        console.error('❌ Lỗi upload avatar:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi upload avatar'
        });
    }
});

// ==========================================
// ĐỔI MẬT KHẨU
// ==========================================
router.put('/change-password', authenticateToken, async (req, res) => {
    try {
        const { mat_khau_cu, mat_khau_moi } = req.body;
        const userId = req.user.ma_tai_khoan;

        // Lấy mật khẩu hiện tại
        const [users] = await db.query(
            'SELECT mat_khau FROM tai_khoan WHERE ma_tai_khoan = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tài khoản không tồn tại'
            });
        }

        // Kiểm tra mật khẩu cũ
        const isValid = await bcrypt.compare(mat_khau_cu, users[0].mat_khau);
        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Mật khẩu hiện tại không đúng'
            });
        }

        // Mã hóa mật khẩu mới
        const hashedPassword = await bcrypt.hash(mat_khau_moi, 10);

        await db.query(
            'UPDATE tai_khoan SET mat_khau = ? WHERE ma_tai_khoan = ?',
            [hashedPassword, userId]
        );

        res.json({
            success: true,
            message: 'Đổi mật khẩu thành công'
        });
    } catch (error) {
        console.error('❌ Lỗi đổi mật khẩu:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server khi đổi mật khẩu'
        });
    }
});

// ==========================================
// GOOGLE OAUTH
// ==========================================
const passport = require('passport');

// Bắt đầu đăng nhập Google
router.get('/google', passport.authenticate('google', {
    scope: ['profile', 'email']
}));

// Callback từ Google
router.get('/google/callback', 
    passport.authenticate('google', { failureRedirect: '/login?error=google_failed' }),
    (req, res) => {
        try {
            const user = req.user;
            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5500';
            
            // Đăng nhập trực tiếp (không cần xác nhận OTP)
            const token = jwt.sign(
                {
                    ma_tai_khoan: user.ma_tai_khoan,
                    ten_dang_nhap: user.ten_dang_nhap,
                    vai_tro: user.vai_tro
                },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: process.env.JWT_EXPIRE || '24h' }
            );

            req.session.user = {
                ma_tai_khoan: user.ma_tai_khoan,
                ten_dang_nhap: user.ten_dang_nhap,
                email: user.email,
                vai_tro: user.vai_tro
            };

            const userData = encodeURIComponent(JSON.stringify({
                ma_tai_khoan: user.ma_tai_khoan,
                ten_dang_nhap: user.ten_dang_nhap,
                email: user.email,
                vai_tro: user.vai_tro,
                hinh_anh: user.hinh_anh
            }));
            
            res.redirect(`${frontendUrl}/pages/auth-callback.html?token=${token}&user=${userData}`);
        } catch (error) {
            console.error('Google callback error:', error);
            res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5500'}/pages/login.html?error=server_error`);
        }
    }
);

// ==========================================
// XÁC NHẬN OTP
// ==========================================
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;
        
        const storedData = otpStore.get(email);
        
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không tồn tại hoặc đã hết hạn'
            });
        }
        
        // Kiểm tra hết hạn
        if (Date.now() > storedData.expiresAt) {
            otpStore.delete(email);
            // Xóa user khỏi database nếu chưa xác nhận
            await db.query('DELETE FROM tai_khoan WHERE email = ? AND trang_thai = 0', [email]);
            return res.status(400).json({
                success: false,
                message: 'Mã OTP đã hết hạn. Vui lòng đăng ký lại.'
            });
        }
        
        // Kiểm tra OTP
        if (storedData.otp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Mã OTP không đúng'
            });
        }
        
        // OTP đúng - kích hoạt tài khoản
        await db.query('UPDATE tai_khoan SET trang_thai = 1 WHERE email = ?', [email]);
        
        // Xóa OTP
        otpStore.delete(email);
        
        // Tạo token và trả về
        const userData = storedData.userData;
        const token = jwt.sign(
            {
                ma_tai_khoan: userData.ma_tai_khoan,
                ten_dang_nhap: userData.ten_dang_nhap,
                vai_tro: userData.vai_tro
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: process.env.JWT_EXPIRE || '24h' }
        );
        
        res.json({
            success: true,
            message: 'Xác nhận thành công! Chào mừng bạn đến với Yến Nhi Tech.',
            data: {
                token,
                user: userData
            }
        });
        
    } catch (error) {
        console.error('❌ Lỗi xác nhận OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

// Gửi lại OTP
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;
        
        const storedData = otpStore.get(email);
        if (!storedData) {
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy yêu cầu đăng ký. Vui lòng đăng ký lại.'
            });
        }
        
        // Tạo OTP mới
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        storedData.otp = otp;
        storedData.expiresAt = Date.now() + 300000; // 5 phút
        otpStore.set(email, storedData);
        
        // Gửi email
        await sendOTPEmail(email, otp, storedData.userData.ten_dang_nhap);
        
        res.json({
            success: true,
            message: 'Đã gửi lại mã OTP'
        });
        
    } catch (error) {
        console.error('❌ Lỗi gửi lại OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server'
        });
    }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.requireAdmin = requireAdmin;

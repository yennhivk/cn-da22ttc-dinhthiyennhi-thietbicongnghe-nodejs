const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const db = require('./database');

const hasGoogleOAuthConfig =
    !!process.env.GOOGLE_CLIENT_ID &&
    !!process.env.GOOGLE_CLIENT_SECRET &&
    !!process.env.GOOGLE_CALLBACK_URL;

if (hasGoogleOAuthConfig) {
    passport.use(new GoogleStrategy({
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    }, async (accessToken, refreshToken, profile, done) => {
        try {
            const email = profile.emails[0].value;
            const googleId = profile.id;
            const displayName = profile.displayName;
            const avatar = profile.photos[0]?.value || null;

            // Kiểm tra user đã tồn tại chưa (theo google_id hoặc email)
            const [existingUsers] = await db.query(
                'SELECT * FROM tai_khoan WHERE google_id = ? OR email = ?',
                [googleId, email]
            );

            let user;

            let isNewUser = false;

            if (existingUsers.length > 0) {
                user = existingUsers[0];
                // Cập nhật google_id nếu user đăng ký bằng email trước đó
                if (!user.google_id) {
                    await db.query(
                        'UPDATE tai_khoan SET google_id = ?, hinh_anh = COALESCE(hinh_anh, ?) WHERE ma_tai_khoan = ?',
                        [googleId, avatar, user.ma_tai_khoan]
                    );
                }
            } else {
                // Tạo user mới với trạng thái active (1) - không cần xác nhận OTP
                isNewUser = true;
                const username = email.split('@')[0] + '_' + Date.now();
                const [result] = await db.query(
                    'INSERT INTO tai_khoan (ten_dang_nhap, email, google_id, hinh_anh, vai_tro, trang_thai) VALUES (?, ?, ?, ?, ?, ?)',
                    [displayName || username, email, googleId, avatar, 'khach_hang', 1]
                );

                const [newUser] = await db.query(
                    'SELECT * FROM tai_khoan WHERE ma_tai_khoan = ?',
                    [result.insertId]
                );
                user = newUser[0];
            }

            return done(null, user, { isNewUser });
        } catch (error) {
            console.error('Google OAuth Error:', error);
            return done(error, null);
        }
    }));
} else {
    console.warn('⚠️ Google OAuth chưa được cấu hình. Bỏ qua strategy Google.');
}

passport.serializeUser((user, done) => {
    done(null, user.ma_tai_khoan);
});

passport.deserializeUser(async (id, done) => {
    try {
        const [users] = await db.query(
            'SELECT ma_tai_khoan, ten_dang_nhap, email, vai_tro, hinh_anh FROM tai_khoan WHERE ma_tai_khoan = ?',
            [id]
        );
        done(null, users[0] || null);
    } catch (error) {
        done(error, null);
    }
});

module.exports = passport;

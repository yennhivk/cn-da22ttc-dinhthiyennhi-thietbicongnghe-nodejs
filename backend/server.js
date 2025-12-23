const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import database connection
const db = require('./config/database');
const passport = require('./config/passport');

// Khởi tạo Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: '*',
    credentials: true
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Session configuration
app.use(session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: true,
    saveUninitialized: true,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: false, // Set to true in production with HTTPS
        httpOnly: true,
        sameSite: 'lax'
    }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Static files
app.use('/images', express.static(path.join(__dirname, 'images')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/pages', express.static(path.join(__dirname, '../frontend/pages')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));

// Test route
app.get('/', (req, res) => {
    res.json({
        message: 'Backend API đang chạy!',
        status: 'success',
        timestamp: new Date().toISOString()
    });
});

// Test database connection route
app.get('/api/test-db', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT 1 + 1 AS result');
        res.json({
            message: 'Kết nối database thành công!',
            result: rows[0].result,
            database: process.env.DB_NAME
        });
    } catch (error) {
        res.status(500).json({
            message: 'Lỗi kết nối database',
            error: error.message
        });
    }
});

// Import routes
app.use('/api/products', require('./routes/products'));
const authRouter = require('./routes/auth');
console.log('Auth routes loaded:', authRouter.stack.map(r => r.route?.path).filter(Boolean));
app.use('/api/auth', authRouter);
app.use('/api/admin', require('./routes/admin'));
app.use('/api/news', require('./routes/news'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/contact', require('./routes/contact'));
app.use('/api/chatbot', require('./routes/chatbot'));
app.use('/api/notifications', require('./routes/notifications'));

// Payment routes
try {
    const paymentRouter = require('./routes/payment');
    app.use('/api/payment', paymentRouter);
    console.log('✅ Payment routes loaded');
} catch (err) {
    console.error('❌ Error loading payment routes:', err.message);
}

// app.use('/api/cart', require('./routes/cart'));
// app.use('/api/orders', require('./routes/orders'));

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Route không tồn tại',
        path: req.path
    });
});

// Error handler
app.use((err, req, res, next) => {
    console.error('❌ Lỗi server:', err.stack);
    res.status(500).json({
        message: 'Lỗi server',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
    });
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(50));
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`📅 Thời gian: ${new Date().toLocaleString('vi-VN')}`);
    console.log(`🌍 Môi trường: ${process.env.NODE_ENV || 'development'}`);
    console.log('='.repeat(50));
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM nhận được, đang đóng server...');
    server.close(() => {
        console.log('✅ Server đã đóng');
        process.exit(0);
    });
});

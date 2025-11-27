const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

// Import database connection
const db = require('./config/database');

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
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Static files
app.use('/images', express.static(path.join(__dirname, 'images')));

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

// Import routes (sẽ thêm sau)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/products', require('./routes/products'));
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

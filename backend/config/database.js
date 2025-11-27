const mysql = require('mysql2');
require('dotenv').config();

// Tạo connection pool để quản lý kết nối tốt hơn
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Choncon1310@',
    database: process.env.DB_NAME || 'CSDL_DoAnCN',
    charset: process.env.DB_CHARSET || 'utf8mb4',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0
});

// Sử dụng promise wrapper để dễ dàng sử dụng async/await
const promisePool = pool.promise();

// Test kết nối database
pool.getConnection((err, connection) => {
    if (err) {
        console.error('❌ Lỗi kết nối database:', err.message);
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.error('   Mất kết nối đến database');
        }
        if (err.code === 'ER_CON_COUNT_ERROR') {
            console.error('   Database có quá nhiều kết nối');
        }
        if (err.code === 'ECONNREFUSED') {
            console.error('   Không thể kết nối đến database server');
        }
        return;
    }
    if (connection) {
        console.log('✅ Kết nối database thành công!');
        console.log(`   Database: ${process.env.DB_NAME}`);
        console.log(`   Host: ${process.env.DB_HOST}:${process.env.DB_PORT}`);
        connection.release();
    }
});

// Xử lý lỗi pool
pool.on('error', (err) => {
    console.error('❌ Lỗi database pool:', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('   Kết nối database bị mất');
    }
});

module.exports = {
    pool,
    promisePool,
    query: (sql, params) => promisePool.query(sql, params),
    execute: (sql, params) => promisePool.execute(sql, params)
};

const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const connection = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'CSDL_DoAnCN'
});

// Kiểm tra cấu trúc bảng
connection.query('DESCRIBE lich_su_chatbot', (err, result) => {
    console.log('=== BẢNG lich_su_chatbot ===');
    if (err) {
        console.log('Lỗi:', err.message);
    } else {
        console.table(result);
    }
    
    connection.query('DESCRIBE cuoc_hoi_thoai_chatbot', (err2, result2) => {
        console.log('\n=== BẢNG cuoc_hoi_thoai_chatbot ===');
        if (err2) {
            console.log('Lỗi:', err2.message);
        } else {
            console.table(result2);
        }
        connection.end();
    });
});

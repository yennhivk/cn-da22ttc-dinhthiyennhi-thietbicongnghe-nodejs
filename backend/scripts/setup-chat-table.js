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

const sql = `
CREATE TABLE IF NOT EXISTS cuoc_hoi_thoai_chatbot (
    ma_cuoc_hoi_thoai INT NOT NULL AUTO_INCREMENT,
    ma_tai_khoan INT NOT NULL,
    tieu_de VARCHAR(255) DEFAULT 'Cuộc hội thoại mới',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    trang_thai ENUM('hoat_dong', 'da_xoa') DEFAULT 'hoat_dong',
    PRIMARY KEY (ma_cuoc_hoi_thoai),
    KEY idx_ma_tai_khoan (ma_tai_khoan),
    CONSTRAINT fk_cuoc_hoi_thoai_tai_khoan FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

connection.query(sql, (err, result) => {
    if (err) {
        console.error('❌ Lỗi tạo bảng:', err.message);
    } else {
        console.log('✅ Đã tạo bảng cuoc_hoi_thoai_chatbot thành công!');
    }
    connection.end();
});

/**
 * Script migrate database cho tính năng cuộc hội thoại chatbot
 * Chạy: node scripts/migrate-chat-conversations.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'csdl_doancn'
    });

    console.log('🔄 Bắt đầu migrate database...\n');

    try {
        // 1. Tạo bảng cuoc_hoi_thoai_chatbot
        console.log('1. Tạo bảng cuoc_hoi_thoai_chatbot...');
        await connection.execute(`
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
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        console.log('   ✅ Đã tạo bảng cuoc_hoi_thoai_chatbot\n');

        // 2. Kiểm tra và thêm cột ma_cuoc_hoi_thoai vào lich_su_chatbot
        console.log('2. Kiểm tra cột ma_cuoc_hoi_thoai trong lich_su_chatbot...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lich_su_chatbot' AND COLUMN_NAME = 'ma_cuoc_hoi_thoai'
        `, [process.env.DB_NAME || 'csdl_doancn']);

        if (columns.length === 0) {
            console.log('   Thêm cột ma_cuoc_hoi_thoai...');
            await connection.execute(`
                ALTER TABLE lich_su_chatbot 
                ADD COLUMN ma_cuoc_hoi_thoai INT DEFAULT NULL AFTER ma_tai_khoan
            `);
            console.log('   ✅ Đã thêm cột ma_cuoc_hoi_thoai\n');
        } else {
            console.log('   ✅ Cột ma_cuoc_hoi_thoai đã tồn tại\n');
        }

        // 3. Thêm index (nếu chưa có)
        console.log('3. Kiểm tra index...');
        try {
            await connection.execute(`
                ALTER TABLE lich_su_chatbot
                ADD INDEX idx_ma_cuoc_hoi_thoai (ma_cuoc_hoi_thoai)
            `);
            console.log('   ✅ Đã thêm index\n');
        } catch (err) {
            if (err.code === 'ER_DUP_KEYNAME') {
                console.log('   ✅ Index đã tồn tại\n');
            } else {
                throw err;
            }
        }

        // 4. Di chuyển dữ liệu cũ
        console.log('4. Di chuyển dữ liệu cũ...');
        const [oldMessages] = await connection.execute(`
            SELECT DISTINCT ma_tai_khoan FROM lich_su_chatbot 
            WHERE ma_cuoc_hoi_thoai IS NULL AND ma_tai_khoan IS NOT NULL
        `);

        if (oldMessages.length > 0) {
            console.log(`   Tìm thấy ${oldMessages.length} user có tin nhắn cũ`);
            
            for (const row of oldMessages) {
                // Tạo cuộc hội thoại mới cho user
                const [result] = await connection.execute(`
                    INSERT INTO cuoc_hoi_thoai_chatbot (ma_tai_khoan, tieu_de, ngay_tao)
                    SELECT ?, 'Cuộc hội thoại cũ', MIN(ngay_tao)
                    FROM lich_su_chatbot WHERE ma_tai_khoan = ?
                `, [row.ma_tai_khoan, row.ma_tai_khoan]);

                // Cập nhật tin nhắn cũ
                await connection.execute(`
                    UPDATE lich_su_chatbot 
                    SET ma_cuoc_hoi_thoai = ?
                    WHERE ma_tai_khoan = ? AND ma_cuoc_hoi_thoai IS NULL
                `, [result.insertId, row.ma_tai_khoan]);
            }
            console.log('   ✅ Đã di chuyển dữ liệu cũ\n');
        } else {
            console.log('   ✅ Không có dữ liệu cũ cần di chuyển\n');
        }

        console.log('🎉 Migration hoàn tất!');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
    } finally {
        await connection.end();
    }
}

migrate();

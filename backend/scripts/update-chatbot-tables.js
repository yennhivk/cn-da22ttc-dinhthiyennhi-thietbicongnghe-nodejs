/**
 * Script cập nhật cấu trúc bảng chatbot
 * Chạy: node scripts/update-chatbot-tables.js
 */

require('dotenv').config();
const mysql = require('mysql2/promise');

async function updateChatbotTables() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'CSDL_DoAnCN',
        charset: process.env.DB_CHARSET || 'utf8mb4'
    });

    console.log('🔗 Đã kết nối database');

    try {
        // 1. Tạo bảng cuộc hội thoại chatbot
        console.log('\n📦 Tạo bảng cuoc_hoi_thoai_chatbot...');
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
        console.log('✅ Bảng cuoc_hoi_thoai_chatbot đã sẵn sàng');

        // 2. Kiểm tra cấu trúc bảng lich_su_chatbot hiện tại
        console.log('\n📋 Kiểm tra cấu trúc bảng lich_su_chatbot...');
        const [columns] = await connection.execute(`
            SELECT COLUMN_NAME FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lich_su_chatbot'
        `, [process.env.DB_NAME || 'CSDL_DoAnCN']);

        const columnNames = columns.map(c => c.COLUMN_NAME);
        console.log('Các cột hiện có:', columnNames.join(', '));

        // 3. Đổi tên cột nếu cần
        if (columnNames.includes('tin_nhan') && !columnNames.includes('cau_hoi')) {
            console.log('\n🔄 Đổi tên cột tin_nhan thành cau_hoi...');
            await connection.execute(`ALTER TABLE lich_su_chatbot CHANGE COLUMN tin_nhan cau_hoi TEXT`);
            console.log('✅ Đã đổi tên cột tin_nhan -> cau_hoi');
        }

        if (columnNames.includes('phan_hoi') && !columnNames.includes('tra_loi')) {
            console.log('\n🔄 Đổi tên cột phan_hoi thành tra_loi...');
            await connection.execute(`ALTER TABLE lich_su_chatbot CHANGE COLUMN phan_hoi tra_loi TEXT`);
            console.log('✅ Đã đổi tên cột phan_hoi -> tra_loi');
        }

        if (columnNames.includes('ngay_tao') && !columnNames.includes('ngay_chat')) {
            console.log('\n🔄 Đổi tên cột ngay_tao thành ngay_chat...');
            await connection.execute(`ALTER TABLE lich_su_chatbot CHANGE COLUMN ngay_tao ngay_chat DATETIME DEFAULT CURRENT_TIMESTAMP`);
            console.log('✅ Đã đổi tên cột ngay_tao -> ngay_chat');
        }

        // 4. Thêm cột ma_cuoc_hoi_thoai nếu chưa có
        // Cập nhật lại danh sách cột
        const [updatedColumns] = await connection.execute(`
            SELECT COLUMN_NAME FROM information_schema.COLUMNS 
            WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'lich_su_chatbot'
        `, [process.env.DB_NAME || 'CSDL_DoAnCN']);
        const updatedColumnNames = updatedColumns.map(c => c.COLUMN_NAME);

        if (!updatedColumnNames.includes('ma_cuoc_hoi_thoai')) {
            console.log('\n➕ Thêm cột ma_cuoc_hoi_thoai...');
            await connection.execute(`ALTER TABLE lich_su_chatbot ADD COLUMN ma_cuoc_hoi_thoai INT DEFAULT NULL AFTER ma_tai_khoan`);
            console.log('✅ Đã thêm cột ma_cuoc_hoi_thoai');
        }

        // 5. Kiểm tra và tạo index
        console.log('\n📇 Kiểm tra index...');
        const [indexes] = await connection.execute(`
            SHOW INDEX FROM lich_su_chatbot WHERE Key_name = 'idx_ma_cuoc_hoi_thoai'
        `);
        if (indexes.length === 0) {
            await connection.execute(`CREATE INDEX idx_ma_cuoc_hoi_thoai ON lich_su_chatbot(ma_cuoc_hoi_thoai)`);
            console.log('✅ Đã tạo index idx_ma_cuoc_hoi_thoai');
        } else {
            console.log('✅ Index idx_ma_cuoc_hoi_thoai đã tồn tại');
        }

        // 6. Hiển thị cấu trúc bảng cuối cùng
        console.log('\n📊 Cấu trúc bảng lich_su_chatbot sau khi cập nhật:');
        const [finalColumns] = await connection.execute(`DESCRIBE lich_su_chatbot`);
        finalColumns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
        });

        console.log('\n📊 Cấu trúc bảng cuoc_hoi_thoai_chatbot:');
        const [convColumns] = await connection.execute(`DESCRIBE cuoc_hoi_thoai_chatbot`);
        convColumns.forEach(col => {
            console.log(`   - ${col.Field}: ${col.Type} ${col.Null === 'YES' ? '(NULL)' : '(NOT NULL)'}`);
        });

        console.log('\n✅ Hoàn tất cập nhật database!');

    } catch (error) {
        console.error('❌ Lỗi:', error.message);
        throw error;
    } finally {
        await connection.end();
        console.log('\n🔌 Đã đóng kết nối database');
    }
}

updateChatbotTables().catch(console.error);

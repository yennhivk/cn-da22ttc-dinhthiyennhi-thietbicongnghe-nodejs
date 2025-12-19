-- =====================================================
-- Script cập nhật bảng chatbot
-- Chạy script này để cập nhật cấu trúc database
-- =====================================================

-- 1. Tạo bảng cuộc hội thoại chatbot (nếu chưa có)
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

-- 2. Cập nhật bảng lich_su_chatbot - thêm cột mới nếu chưa có
-- Kiểm tra và đổi tên cột tin_nhan thành cau_hoi
ALTER TABLE lich_su_chatbot 
CHANGE COLUMN tin_nhan cau_hoi TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kiểm tra và đổi tên cột phan_hoi thành tra_loi
ALTER TABLE lich_su_chatbot 
CHANGE COLUMN phan_hoi tra_loi TEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Kiểm tra và đổi tên cột ngay_tao thành ngay_chat
ALTER TABLE lich_su_chatbot 
CHANGE COLUMN ngay_tao ngay_chat DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Thêm cột ma_cuoc_hoi_thoai nếu chưa có
ALTER TABLE lich_su_chatbot 
ADD COLUMN IF NOT EXISTS ma_cuoc_hoi_thoai INT DEFAULT NULL AFTER ma_tai_khoan;

-- Thêm index cho cột mới (nếu chưa có)
CREATE INDEX IF NOT EXISTS idx_ma_cuoc_hoi_thoai ON lich_su_chatbot(ma_cuoc_hoi_thoai);

-- 3. Di chuyển dữ liệu cũ (tùy chọn)
-- Tạo cuộc hội thoại mặc định cho các tin nhắn cũ chưa có cuộc hội thoại
INSERT INTO cuoc_hoi_thoai_chatbot (ma_tai_khoan, tieu_de, ngay_tao)
SELECT DISTINCT ma_tai_khoan, 'Cuộc hội thoại cũ', MIN(ngay_chat)
FROM lich_su_chatbot
WHERE ma_cuoc_hoi_thoai IS NULL AND ma_tai_khoan IS NOT NULL
GROUP BY ma_tai_khoan
ON DUPLICATE KEY UPDATE tieu_de = tieu_de;

-- Cập nhật các tin nhắn cũ với cuộc hội thoại tương ứng
UPDATE lich_su_chatbot ls
JOIN cuoc_hoi_thoai_chatbot c ON ls.ma_tai_khoan = c.ma_tai_khoan
SET ls.ma_cuoc_hoi_thoai = c.ma_cuoc_hoi_thoai
WHERE ls.ma_cuoc_hoi_thoai IS NULL;

-- =====================================================
-- Kiểm tra cấu trúc bảng sau khi cập nhật
-- =====================================================
-- DESCRIBE lich_su_chatbot;
-- DESCRIBE cuoc_hoi_thoai_chatbot;

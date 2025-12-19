-- =====================================================
-- Script tạo bảng cuộc hội thoại chatbot
-- Chạy script này để cập nhật database
-- =====================================================

-- Tạo bảng lưu các cuộc hội thoại chatbot
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

-- Thêm cột ma_cuoc_hoi_thoai vào bảng lich_su_chatbot (nếu chưa có)
-- Bảng lich_su_chatbot hiện có các cột: ma_lich_su, ma_tai_khoan, tin_nhan, phan_hoi, ngay_tao

ALTER TABLE lich_su_chatbot 
ADD COLUMN ma_cuoc_hoi_thoai INT DEFAULT NULL AFTER ma_tai_khoan;

-- Thêm index cho cột mới
ALTER TABLE lich_su_chatbot
ADD INDEX idx_ma_cuoc_hoi_thoai (ma_cuoc_hoi_thoai);

-- =====================================================
-- Di chuyển dữ liệu cũ (tùy chọn)
-- =====================================================

-- Tạo cuộc hội thoại mặc định cho các tin nhắn cũ chưa có cuộc hội thoại
INSERT INTO cuoc_hoi_thoai_chatbot (ma_tai_khoan, tieu_de, ngay_tao)
SELECT DISTINCT ma_tai_khoan, 'Cuộc hội thoại cũ', MIN(ngay_tao)
FROM lich_su_chatbot
WHERE ma_cuoc_hoi_thoai IS NULL AND ma_tai_khoan IS NOT NULL
GROUP BY ma_tai_khoan;

-- Cập nhật các tin nhắn cũ với cuộc hội thoại tương ứng
UPDATE lich_su_chatbot ls
JOIN cuoc_hoi_thoai_chatbot c ON ls.ma_tai_khoan = c.ma_tai_khoan
SET ls.ma_cuoc_hoi_thoai = c.ma_cuoc_hoi_thoai
WHERE ls.ma_cuoc_hoi_thoai IS NULL;

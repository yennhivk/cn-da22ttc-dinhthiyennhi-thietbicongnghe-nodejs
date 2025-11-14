-- =========================================
-- CẤU HÌNH CHUNG CHO CƠ SỞ DỮ LIỆU
-- =========================================
CREATE DATABASE IF NOT EXISTS CSDL_DoAnCN
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE CSDL_DoAnCN;

-- Đảm bảo kết nối hỗ trợ tiếng Việt
SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET COLLATION_CONNECTION = 'utf8mb4_unicode_ci';

-- =========================================
-- 1. BẢNG TÀI KHOẢN NGƯỜI DÙNG
-- =========================================
CREATE TABLE tai_khoan (
    ma_tai_khoan INT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL,
    mat_khau VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL,
    vai_tro ENUM('admin','khach_hang') DEFAULT 'khach_hang',
    trang_thai TINYINT DEFAULT 1,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 2. BẢNG DANH MỤC SẢN PHẨM
-- =========================================
CREATE TABLE danh_muc_san_pham (
    ma_danh_muc INT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100) NOT NULL,
    mo_ta TEXT
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 3. BẢNG SẢN PHẨM
-- =========================================
CREATE TABLE san_pham (
    ma_san_pham INT AUTO_INCREMENT PRIMARY KEY,
    ma_danh_muc INT,
    ten_san_pham VARCHAR(255) NOT NULL,
    mo_ta TEXT,
    gia DECIMAL(10,2) NOT NULL,
    so_luong INT DEFAULT 0,
    thuong_hieu VARCHAR(100),
    trang_thai ENUM('hien_thi','an','xoa') DEFAULT 'hien_thi',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_danh_muc) REFERENCES danh_muc_san_pham(ma_danh_muc)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 4. BẢNG ẢNH SẢN PHẨM
-- =========================================
CREATE TABLE anh_san_pham (
    ma_anh INT AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT,
    duong_dan_anh VARCHAR(255),
    la_anh_chinh TINYINT DEFAULT 0,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 5. BẢNG ĐƠN HÀNG
-- =========================================
CREATE TABLE don_hang (
    ma_don_hang INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    tong_tien DECIMAL(10,2) NOT NULL,
    trang_thai_thanh_toan ENUM('cho_xu_ly','da_thanh_toan','that_bai') DEFAULT 'cho_xu_ly',
    trang_thai_don_hang ENUM('dang_xu_ly','dang_giao','hoan_thanh','da_huy') DEFAULT 'dang_xu_ly',
    dia_chi_giao_hang TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 6. BẢNG CHI TIẾT ĐƠN HÀNG
-- =========================================
CREATE TABLE chi_tiet_don_hang (
    ma_chi_tiet INT AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang INT,
    ma_san_pham INT,
    so_luong INT NOT NULL,
    gia_ban DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (ma_don_hang) REFERENCES don_hang(ma_don_hang),
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 7. BẢNG THANH TOÁN
-- =========================================
CREATE TABLE thanh_toan (
    ma_thanh_toan INT AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang INT,
    phuong_thuc ENUM('COD','Ngan_Hang','Momo','ZaloPay') NOT NULL,
    so_tien DECIMAL(10,2),
    ngay_thanh_toan DATETIME DEFAULT CURRENT_TIMESTAMP,
    ma_giao_dich VARCHAR(100),
    FOREIGN KEY (ma_don_hang) REFERENCES don_hang(ma_don_hang)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 8. BẢNG ĐÁNH GIÁ & PHẢN HỒI
-- =========================================
CREATE TABLE danh_gia (
    ma_danh_gia INT AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT,
    ma_tai_khoan INT,
    so_sao TINYINT CHECK (so_sao BETWEEN 1 AND 5),
    noi_dung TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai TINYINT DEFAULT 1,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 9. BẢNG LỊCH SỬ TRÒ CHUYỆN CHATBOT
-- =========================================
CREATE TABLE lich_su_chatbot (
    ma_lich_su INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    tin_nhan TEXT,
    phan_hoi TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 10. BẢNG GIỎ HÀNG
-- =========================================
CREATE TABLE gio_hang (
    ma_gio_hang INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    tong_tien DECIMAL(10,2) DEFAULT 0,
    so_luong_san_pham INT DEFAULT 0,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 11. BẢNG CHI TIẾT GIỎ HÀNG
-- =========================================
CREATE TABLE chi_tiet_gio_hang (
    ma_chi_tiet_gio INT AUTO_INCREMENT PRIMARY KEY,
    ma_gio_hang INT,
    ma_san_pham INT,
    so_luong INT DEFAULT 1,
    gia_tai_thoi_diem_them DECIMAL(10,2),
    ngay_them DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_gio_hang) REFERENCES gio_hang(ma_gio_hang),
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 12. BẢNG RESET PASSWORD
-- =========================================
CREATE TABLE reset_password (
    ma_reset INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    token VARCHAR(255),
    thoi_gian_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_het_han DATETIME,
    trang_thai ENUM('chua_su_dung','da_su_dung','het_han') DEFAULT 'chua_su_dung',
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 13. BẢNG LIÊN HỆ
-- =========================================
CREATE TABLE lien_he (
    ma_lien_he INT AUTO_INCREMENT PRIMARY KEY,
    ten_nguoi_gui VARCHAR(100),
    email VARCHAR(150),
    so_dien_thoai VARCHAR(20),
    noi_dung TEXT,
    ngay_gui DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('chua_phan_hoi','da_phan_hoi') DEFAULT 'chua_phan_hoi'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 14. BẢNG QUẢNG CÁO
-- =========================================
CREATE TABLE quang_cao (
    ma_quang_cao INT AUTO_INCREMENT PRIMARY KEY,
    tieu_de VARCHAR(255),
    hinh_anh VARCHAR(255),
    duong_dan VARCHAR(255),
    ngay_hien_thi DATETIME,
    ngay_ket_thuc DATETIME,
    trang_thai ENUM('dang_hien_thi','da_an') DEFAULT 'dang_hien_thi'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 15. BẢNG TIN TỨC
-- =========================================
CREATE TABLE tin_tuc (
    ma_tin INT AUTO_INCREMENT PRIMARY KEY,
    tieu_de VARCHAR(255),
    noi_dung LONGTEXT,
    anh_dai_dien VARCHAR(255),
    tac_gia VARCHAR(100),
    ngay_dang DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('hien_thi','an') DEFAULT 'hien_thi'
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 16. BẢNG DỮ LIỆU TÌM KIẾM
-- =========================================
CREATE TABLE du_lieu_tim_kiem (
    ma_tim_kiem INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    tu_khoa VARCHAR(255),
    ngay_tim_kiem DATETIME DEFAULT CURRENT_TIMESTAMP,
    ket_qua_tra_ve INT DEFAULT 0,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 17. BẢNG KHUYẾN MÃI
-- =========================================
CREATE TABLE khuyen_mai (
    ma_khuyen_mai INT AUTO_INCREMENT PRIMARY KEY,
    ten_khuyen_mai VARCHAR(100),
    ma_giam_gia VARCHAR(50),
    mo_ta TEXT,
    ngay_bat_dau DATETIME,
    ngay_ket_thuc DATETIME,
    dieu_kien_ap_dung TEXT,
    trang_thai TINYINT DEFAULT 1
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 18. BẢNG HÓA ĐƠN
-- =========================================
CREATE TABLE hoa_don (
    ma_hoa_don INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    ngay_xuat DATETIME DEFAULT CURRENT_TIMESTAMP,
    tong_tien DECIMAL(15,2),
    phuong_thuc_thanh_toan VARCHAR(50),
    trang_thai ENUM('da_thanh_toan','cho_thanh_toan','da_huy') DEFAULT 'cho_thanh_toan',
    ghi_chu TEXT,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- =========================================
-- 19. BẢNG CHI TIẾT HÓA ĐƠN
-- =========================================
CREATE TABLE chi_tiet_hoa_don (
    ma_chi_tiet INT AUTO_INCREMENT PRIMARY KEY,
    ma_hoa_don INT,
    ma_san_pham INT,
    so_luong INT,
    don_gia DECIMAL(15,2),
    thue DECIMAL(5,2),
    thanh_tien DECIMAL(15,2),
    FOREIGN KEY (ma_hoa_don) REFERENCES hoa_don(ma_hoa_don),
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, vai_tro, trang_thai)
VALUES
('admin', '123456', 'admin@shop.vn', 'admin', 1),
('nguyenvana', '123456', 'vana@gmail.com', 'khach_hang', 1),
('lethib', '123456', 'lethib@gmail.com', 'khach_hang', 1);

INSERT INTO danh_muc_san_pham (ten_danh_muc, mo_ta)
VALUES
('Điện thoại', 'Các dòng điện thoại thông minh chính hãng'),
('Laptop', 'Máy tính xách tay hiệu năng cao'),
('Phụ kiện', 'Tai nghe, sạc, ốp lưng và các phụ kiện khác');

INSERT INTO san_pham (ma_danh_muc, ten_san_pham, mo_ta, gia, so_luong, thuong_hieu)
VALUES
(1, 'iPhone 15 Pro Max', 'Điện thoại cao cấp của Apple', 33990000, 10, 'Apple'),
(1, 'Samsung Galaxy S24 Ultra', 'Flagship Android mạnh mẽ', 29990000, 8, 'Samsung'),
(2, 'MacBook Air M3 2024', 'Laptop mỏng nhẹ pin lâu', 28990000, 5, 'Apple'),
(2, 'Dell XPS 13 Plus', 'Laptop doanh nhân sang trọng', 25990000, 4, 'Dell'),
(3, 'Tai nghe AirPods Pro 2', 'Tai nghe chống ồn chủ động', 5990000, 20, 'Apple'),
(3, 'Sạc nhanh 65W Anker', 'Củ sạc nhanh dùng cho nhiều thiết bị', 990000, 50, 'Anker');

INSERT INTO anh_san_pham (ma_san_pham, duong_dan_anh, la_anh_chinh)
VALUES
(1, 'images/iphone15.jpg', 1),
(2, 'images/s24ultra.jpg', 1),
(3, 'images/macbook_air_m3.jpg', 1),
(4, 'images/dell_xps13plus.jpg', 1),
(5, 'images/airpodspro2.jpg', 1),
(6, 'images/anker65w.jpg', 1);

INSERT INTO gio_hang (ma_tai_khoan, tong_tien, so_luong_san_pham)
VALUES
(2, 39980000, 2),
(3, 5990000, 1);

INSERT INTO chi_tiet_gio_hang (ma_gio_hang, ma_san_pham, so_luong, gia_tai_thoi_diem_them)
VALUES
(1, 1, 1, 33990000),
(1, 6, 1, 5990000),
(2, 5, 1, 5990000);

INSERT INTO don_hang (ma_tai_khoan, tong_tien, trang_thai_thanh_toan, trang_thai_don_hang, dia_chi_giao_hang)
VALUES
(2, 39980000, 'da_thanh_toan', 'dang_giao', '123 Lý Thường Kiệt, Hà Nội'),
(3, 5990000, 'cho_xu_ly', 'dang_xu_ly', '45 Lê Duẩn, Đà Nẵng');

INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_san_pham, so_luong, gia_ban)
VALUES
(1, 1, 1, 33990000),
(1, 6, 1, 5990000),
(2, 5, 1, 5990000);

INSERT INTO thanh_toan (ma_don_hang, phuong_thuc, so_tien, ma_giao_dich)
VALUES
(1, 'Ngan_Hang', 39980000, 'GD20251113001'),
(2, 'COD', 5990000, 'GD20251113002');

INSERT INTO danh_gia (ma_san_pham, ma_tai_khoan, so_sao, noi_dung)
VALUES
(1, 2, 5, 'Sản phẩm cực kỳ tốt, hiệu năng mượt mà.'),
(3, 3, 4, 'Máy đẹp, nhẹ, pin ổn. Chỉ hơi nóng khi chạy nặng.');

INSERT INTO lich_su_chatbot (ma_tai_khoan, tin_nhan, phan_hoi)
VALUES
(2, 'Shop có iPhone 15 không?', 'Dạ, hiện shop có sẵn iPhone 15 Pro Max 256GB ạ!'),
(3, 'Có giao hàng Đà Nẵng không?', 'Dạ, shop có hỗ trợ giao toàn quốc nhé!');

INSERT INTO lien_he (ten_nguoi_gui, email, so_dien_thoai, noi_dung)
VALUES
('Nguyễn Văn A', 'vana@gmail.com', '0909123456', 'Tôi muốn hỏi về tình trạng đơn hàng #1'),
('Lê Thị B', 'lethib@gmail.com', '0909345678', 'Sản phẩm AirPods có còn hàng không?');

INSERT INTO khuyen_mai (ten_khuyen_mai, ma_giam_gia, mo_ta, ngay_bat_dau, ngay_ket_thuc, dieu_kien_ap_dung)
VALUES
('Giảm giá Black Friday', 'BLACK2025', 'Giảm 20% cho tất cả đơn hàng trên 5 triệu', '2025-11-25', '2025-11-30', 'Đơn hàng >= 5.000.000đ'),
('Giáng sinh rực rỡ', 'XMAS2025', 'Giảm 15% cho phụ kiện', '2025-12-15', '2025-12-31', 'Danh mục phụ kiện');

INSERT INTO hoa_don (ma_tai_khoan, tong_tien, phuong_thuc_thanh_toan, trang_thai, ghi_chu)
VALUES
(2, 39980000, 'Ngan_Hang', 'da_thanh_toan', 'Hóa đơn cho đơn hàng #1'),
(3, 5990000, 'COD', 'cho_thanh_toan', 'Chưa thanh toán');

INSERT INTO chi_tiet_hoa_don (ma_hoa_don, ma_san_pham, so_luong, don_gia, thue, thanh_tien)
VALUES
(1, 1, 1, 33990000, 10, 37389000),
(1, 6, 1, 5990000, 10, 6589000),
(2, 5, 1, 5990000, 0, 5990000);

INSERT INTO tin_tuc (tieu_de, noi_dung, anh_dai_dien, tac_gia)
VALUES
('Apple ra mắt iPhone 15 Pro Max', 'Sản phẩm mới mang đến nhiều nâng cấp vượt trội về camera và hiệu năng.', 'images/news1.jpg', 'Admin'),
('Mẹo sử dụng MacBook hiệu quả hơn', 'Tổng hợp các phím tắt và mẹo giúp bạn làm việc nhanh hơn trên macOS.', 'images/news2.jpg', 'Admin');

INSERT INTO du_lieu_tim_kiem (ma_tai_khoan, tu_khoa, ket_qua_tra_ve)
VALUES
(2, 'iPhone', 5),
(3, 'AirPods', 2);

INSERT INTO quang_cao (tieu_de, hinh_anh, duong_dan, ngay_hien_thi, ngay_ket_thuc)
VALUES
('Sale sốc Black Friday', 'images/banner_blackfriday.jpg', 'khuyen-mai.html', '2025-11-20', '2025-11-30'),
('Ưu đãi Giáng sinh', 'images/banner_xmas.jpg', 'xmas-sale.html', '2025-12-15', '2025-12-31');

-- ============================================
-- ✅ HIỂN THỊ TOÀN BỘ DỮ LIỆU TRONG CSDL ecommerce
-- ============================================


-- 1. Bảng tài khoản người dùng
SELECT * FROM tai_khoan;

-- 2. Bảng danh mục sản phẩm
SELECT * FROM danh_muc_san_pham;

-- 3. Bảng sản phẩm
SELECT * FROM san_pham;

-- 4. Bảng ảnh sản phẩm
SELECT * FROM anh_san_pham;

-- 5. Bảng đơn hàng
SELECT * FROM don_hang;

-- 6. Bảng chi tiết đơn hàng
SELECT * FROM chi_tiet_don_hang;

-- 7. Bảng thanh toán
SELECT * FROM thanh_toan;

-- 8. Bảng đánh giá & phản hồi sản phẩm
SELECT * FROM danh_gia;

-- 9. Bảng lịch sử trò chuyện chatbot
SELECT * FROM lich_su_chatbot;

-- 10. Bảng giỏ hàng
SELECT * FROM gio_hang;

-- 11. Bảng chi tiết giỏ hàng
SELECT * FROM chi_tiet_gio_hang;

-- 12. Bảng reset password
SELECT * FROM reset_password;

-- 13. Bảng liên hệ
SELECT * FROM lien_he;

-- 14. Bảng quảng cáo
SELECT * FROM quang_cao;

-- 15. Bảng tin tức
SELECT * FROM tin_tuc;

-- 16. Bảng dữ liệu tìm kiếm
SELECT * FROM du_lieu_tim_kiem;

-- 17. Bảng khuyến mãi
SELECT * FROM khuyen_mai;

-- 18. Bảng hóa đơn
SELECT * FROM hoa_don;

-- 19. Bảng chi tiết hóa đơn
SELECT * FROM chi_tiet_hoa_don;


CREATE DATABASE cua_hang_cong_nghe CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE cua_hang_cong_nghe;
CREATE TABLE tai_khoan (
    ma_tai_khoan INT AUTO_INCREMENT PRIMARY KEY,
    ten_dang_nhap VARCHAR(50) NOT NULL UNIQUE,
    mat_khau VARCHAR(255) NOT NULL,
    email VARCHAR(100) UNIQUE,
    vai_tro ENUM('admin','khach_hang') DEFAULT 'khach_hang',
    trang_thai TINYINT DEFAULT 1,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE ho_so_khach_hang (
    ma_ho_so INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    ho_ten VARCHAR(100),
    so_dien_thoai VARCHAR(20),
    dia_chi TEXT,
    anh_dai_dien VARCHAR(255),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
);
CREATE TABLE danh_muc_san_pham (
    ma_danh_muc INT AUTO_INCREMENT PRIMARY KEY,
    ten_danh_muc VARCHAR(100),
    mo_ta TEXT
);
CREATE TABLE san_pham (
    ma_san_pham INT AUTO_INCREMENT PRIMARY KEY,
    ma_danh_muc INT,
    ten_san_pham VARCHAR(255),
    mo_ta TEXT,
    gia DECIMAL(10,2),
    so_luong INT DEFAULT 0,
    thuong_hieu VARCHAR(100),
    trang_thai ENUM('hien_thi','an','xoa') DEFAULT 'hien_thi',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_danh_muc) REFERENCES danh_muc_san_pham(ma_danh_muc)
);
CREATE TABLE anh_san_pham (
    ma_anh INT AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT,
    duong_dan_anh VARCHAR(255),
    la_anh_chinh TINYINT DEFAULT 0,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham)
);
CREATE TABLE don_hang (
    ma_don_hang INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    tong_tien DECIMAL(10,2),
    trang_thai_thanh_toan ENUM('cho_xu_ly','da_thanh_toan','that_bai') DEFAULT 'cho_xu_ly',
    trang_thai_don_hang ENUM('dang_xu_ly','dang_giao','hoan_thanh','da_huy') DEFAULT 'dang_xu_ly',
    dia_chi_giao_hang TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
);
CREATE TABLE chi_tiet_don_hang (
    ma_chi_tiet INT AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang INT,
    ma_san_pham INT,
    so_luong INT,
    gia_ban DECIMAL(10,2),
    FOREIGN KEY (ma_don_hang) REFERENCES don_hang(ma_don_hang),
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham)
);
CREATE TABLE thanh_toan (
    ma_thanh_toan INT AUTO_INCREMENT PRIMARY KEY,
    ma_don_hang INT,
    phuong_thuc ENUM('COD','Ngan_Hang','Momo','ZaloPay'),
    so_tien DECIMAL(10,2),
    ngay_thanh_toan DATETIME,
    ma_giao_dich VARCHAR(100),
    FOREIGN KEY (ma_don_hang) REFERENCES don_hang(ma_don_hang)
);
CREATE TABLE danh_gia_san_pham (
    ma_danh_gia INT AUTO_INCREMENT PRIMARY KEY,
    ma_san_pham INT,
    ma_tai_khoan INT,
    so_sao TINYINT,
    noi_dung TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai TINYINT DEFAULT 1,
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham),
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
);
CREATE TABLE lich_su_chatbot (
    ma_lich_su INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    tin_nhan TEXT,
    phan_hoi TEXT,
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
);
CREATE TABLE gio_hang (
    ma_gio_hang INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    tong_tien DECIMAL(10,2) DEFAULT 0,
    so_luong_san_pham INT DEFAULT 0,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
);
CREATE TABLE chi_tiet_gio_hang (
    ma_chi_tiet_gio INT AUTO_INCREMENT PRIMARY KEY,
    ma_gio_hang INT,
    ma_san_pham INT,
    so_luong INT,
    gia_tai_thoi_diem_them DECIMAL(10,2),
    ngay_them DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ma_gio_hang) REFERENCES gio_hang(ma_gio_hang),
    FOREIGN KEY (ma_san_pham) REFERENCES san_pham(ma_san_pham)
);
CREATE TABLE reset_password (
    ma_reset INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT,
    token VARCHAR(255),
    thoi_gian_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    thoi_gian_het_han DATETIME,
    trang_thai ENUM('chua_su_dung','da_su_dung','het_han') DEFAULT 'chua_su_dung',
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
);
CREATE TABLE lien_he (
    ma_lien_he INT AUTO_INCREMENT PRIMARY KEY,
    ten_nguoi_gui VARCHAR(100),
    email VARCHAR(150),
    so_dien_thoai VARCHAR(20),
    noi_dung TEXT,
    ngay_gui DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('chua_phan_hoi','da_phan_hoi') DEFAULT 'chua_phan_hoi'
);
CREATE TABLE quang_cao (
    ma_quang_cao INT AUTO_INCREMENT PRIMARY KEY,
    tieu_de VARCHAR(255),
    hinh_anh VARCHAR(255),
    duong_dan VARCHAR(255),
    ngay_hien_thi DATETIME,
    ngay_ket_thuc DATETIME,
    trang_thai ENUM('dang_hien_thi','da_an') DEFAULT 'dang_hien_thi'
);
CREATE TABLE tin_tuc (
    ma_tin INT AUTO_INCREMENT PRIMARY KEY,
    tieu_de VARCHAR(255),
    noi_dung LONGTEXT,
    anh_dai_dien VARCHAR(255),
    tac_gia VARCHAR(100),
    ngay_dang DATETIME DEFAULT CURRENT_TIMESTAMP,
    trang_thai ENUM('hien_thi','an') DEFAULT 'hien_thi'
);

-- 1️⃣ Tài khoản người dùng
INSERT INTO tai_khoan (ten_dang_nhap, mat_khau, email, vai_tro, trang_thai) VALUES
('admin', '123456', 'admin@cuahangCN.vn', 'admin', 1),
('hoanganh', '123456', 'hoanganh@gmail.com', 'khach_hang', 1),
('minhquan', '123456', 'minhquan@gmail.com', 'khach_hang', 1);

-- 2️⃣ Hồ sơ khách hàng
INSERT INTO ho_so_khach_hang (ma_tai_khoan, ho_ten, so_dien_thoai, dia_chi, anh_dai_dien) VALUES
(2, 'Nguyễn Hoàng Anh', '0905123456', 'Hà Nội', 'anh1.jpg'),
(3, 'Trần Minh Quân', '0912345678', 'TP. Hồ Chí Minh', 'anh2.jpg');

-- 3️⃣ Danh mục sản phẩm
INSERT INTO danh_muc_san_pham (ten_danh_muc, mo_ta) VALUES
('Laptop', 'Các loại máy tính xách tay'),
('Tai nghe', 'Tai nghe có dây và không dây'),
('Phụ kiện', 'Chuột, bàn phím, cáp sạc'),
('PC Gaming', 'Máy tính chơi game cấu hình cao');

-- 4️⃣ Sản phẩm
INSERT INTO san_pham (ma_danh_muc, ten_san_pham, mo_ta, gia, so_luong, thuong_hieu, trang_thai) VALUES
(1, 'Laptop ASUS TUF Gaming F15', 'Laptop gaming hiệu năng cao với RTX 4060', 25990000, 10, 'ASUS', 'hien_thi'),
(1, 'MacBook Air M2 13-inch', 'Chip Apple M2, RAM 8GB, SSD 256GB', 28990000, 8, 'Apple', 'hien_thi'),
(2, 'Tai nghe Sony WH-1000XM5', 'Tai nghe chống ồn cao cấp', 8990000, 15, 'Sony', 'hien_thi'),
(3, 'Chuột Logitech G Pro X Superlight', 'Chuột không dây dành cho game thủ', 3490000, 20, 'Logitech', 'hien_thi'),
(4, 'PC Gaming Intel i7 RTX 4070', 'Máy tính chơi game cấu hình mạnh', 35990000, 5, 'MSI', 'hien_thi');

-- 5️⃣ Ảnh sản phẩm
INSERT INTO anh_san_pham (ma_san_pham, duong_dan_anh, la_anh_chinh) VALUES
(1, 'asus_tuf1.jpg', 1), (1, 'asus_tuf2.jpg', 0),
(2, 'macbook_m2.jpg', 1), (2, 'macbook_m2_side.jpg', 0),
(3, 'sony_xm5.jpg', 1),
(4, 'logitech_prox.jpg', 1),
(5, 'pc_msi.jpg', 1);

-- 6️⃣ Đơn hàng
INSERT INTO don_hang (ma_tai_khoan, tong_tien, trang_thai_thanh_toan, trang_thai_don_hang, dia_chi_giao_hang) VALUES
(2, 8990000, 'da_thanh_toan', 'dang_giao', 'Hà Nội'),
(3, 28990000, 'cho_xu_ly', 'dang_xu_ly', 'TP. Hồ Chí Minh');

-- 7️⃣ Chi tiết đơn hàng
INSERT INTO chi_tiet_don_hang (ma_don_hang, ma_san_pham, so_luong, gia_ban) VALUES
(1, 3, 1, 8990000),
(2, 2, 1, 28990000);

-- 8️⃣ Thanh toán
INSERT INTO thanh_toan (ma_don_hang, phuong_thuc, so_tien, ngay_thanh_toan, ma_giao_dich) VALUES
(1, 'Momo', 8990000, NOW(), 'GD12345'),
(2, 'Ngan_Hang', 28990000, NOW(), 'GD67890');

-- 9️⃣ Đánh giá sản phẩm
INSERT INTO danh_gia_san_pham (ma_san_pham, ma_tai_khoan, so_sao, noi_dung) VALUES
(3, 2, 5, 'Chống ồn cực tốt, pin lâu!'),
(2, 3, 4, 'MacBook mượt mà, nhưng giá hơi cao.');

-- 🔟 Lịch sử chatbot
INSERT INTO lich_su_chatbot (ma_tai_khoan, tin_nhan, phan_hoi) VALUES
(2, 'Shop có giảm giá laptop không?', 'Dạ, hiện tại laptop ASUS TUF đang giảm 10%!'),
(3, 'Tôi muốn biết tình trạng đơn hàng.', 'Đơn hàng của anh đang được xử lý.');

-- 11️⃣ Giỏ hàng
INSERT INTO gio_hang (ma_tai_khoan, tong_tien, so_luong_san_pham) VALUES
(2, 25990000, 1),
(3, 3490000, 1);

-- 12️⃣ Chi tiết giỏ hàng
INSERT INTO chi_tiet_gio_hang (ma_gio_hang, ma_san_pham, so_luong, gia_tai_thoi_diem_them) VALUES
(1, 1, 1, 25990000),
(2, 4, 1, 3490000);

-- 13️⃣ Reset password
INSERT INTO reset_password (ma_tai_khoan, token, thoi_gian_het_han, trang_thai) VALUES
(2, 'token123', DATE_ADD(NOW(), INTERVAL 1 DAY), 'chua_su_dung'),
(3, 'token456', DATE_ADD(NOW(), INTERVAL 1 DAY), 'chua_su_dung');

-- 14️⃣ Liên hệ
INSERT INTO lien_he (ten_nguoi_gui, email, so_dien_thoai, noi_dung) VALUES
('Nguyễn Hoàng Anh', 'hoanganh@gmail.com', '0905123456', 'Tôi cần hỗ trợ đổi sản phẩm'),
('Trần Minh Quân', 'minhquan@gmail.com', '0912345678', 'Hỏi về chính sách bảo hành');

-- 15️⃣ Quảng cáo
INSERT INTO quang_cao (tieu_de, hinh_anh, duong_dan, ngay_hien_thi, ngay_ket_thuc) VALUES
('Giảm giá Laptop ASUS', 'banner_asus.jpg', '/san-pham/1', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY)),
('Khuyến mãi Tai nghe Sony', 'banner_sony.jpg', '/san-pham/3', NOW(), DATE_ADD(NOW(), INTERVAL 15 DAY));

-- 16️⃣ Tin tức
INSERT INTO tin_tuc (tieu_de, noi_dung, anh_dai_dien, tac_gia) VALUES
('Top 5 laptop gaming đáng mua nhất 2025', 'Danh sách laptop gaming tốt nhất cho sinh viên và game thủ...', 'tin1.jpg', 'Admin'),
('Công nghệ chống ồn mới trên Sony XM5', 'Sony XM5 ra mắt với khả năng chống ồn gấp đôi thế hệ trước...', 'tin2.jpg', 'Admin');

-- 17️⃣ Dữ liệu tìm kiếm
INSERT INTO du_lieu_tim_kiem (ma_tai_khoan, tu_khoa, ket_qua_tra_ve) VALUES
(2, 'laptop asus', 5),
(3, 'tai nghe sony', 3);


-- 1️⃣ Xem danh sách tài khoản người dùng
SELECT * FROM tai_khoan;

-- 2️⃣ Xem hồ sơ khách hàng
SELECT * FROM ho_so_khach_hang;

-- 3️⃣ Xem danh mục sản phẩm
SELECT * FROM danh_muc_san_pham;

-- 4️⃣ Xem sản phẩm
SELECT * FROM san_pham;

-- 5️⃣ Xem ảnh sản phẩm
SELECT * FROM anh_san_pham;

-- 6️⃣ Xem đơn hàng
SELECT * FROM don_hang;

-- 7️⃣ Xem chi tiết đơn hàng
SELECT * FROM chi_tiet_don_hang;

-- 8️⃣ Xem thông tin thanh toán
SELECT * FROM thanh_toan;

-- 9️⃣ Xem đánh giá sản phẩm
SELECT * FROM danh_gia_san_pham;

-- 🔟 Xem lịch sử trò chuyện chatbot
SELECT * FROM lich_su_chatbot;

-- 11️⃣ Xem giỏ hàng
SELECT * FROM gio_hang;

-- 12️⃣ Xem chi tiết giỏ hàng
SELECT * FROM chi_tiet_gio_hang;

-- 13️⃣ Xem yêu cầu reset mật khẩu
SELECT * FROM reset_password;

-- 14️⃣ Xem liên hệ của khách hàng
SELECT * FROM lien_he;

-- 15️⃣ Xem danh sách quảng cáo
SELECT * FROM quang_cao;

-- 16️⃣ Xem tin tức, bài viết công nghệ
SELECT * FROM tin_tuc;

-- 17️⃣ Xem dữ liệu tìm kiếm của người dùng
SELECT * FROM du_lieu_tim_kiem;

-- MySQL dump 10.13  Distrib 8.0.43, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: csdl_doancn
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `anh_san_pham`
--

DROP TABLE IF EXISTS `anh_san_pham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `anh_san_pham` (
  `ma_anh` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int DEFAULT NULL,
  `duong_dan_anh` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `la_anh_chinh` tinyint DEFAULT '0',
  PRIMARY KEY (`ma_anh`),
  KEY `ma_san_pham` (`ma_san_pham`),
  CONSTRAINT `anh_san_pham_ibfk_1` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `anh_san_pham`
--

LOCK TABLES `anh_san_pham` WRITE;
/*!40000 ALTER TABLE `anh_san_pham` DISABLE KEYS */;
INSERT INTO `anh_san_pham` VALUES (1,1,'images/iphone15.jpg',1),(2,2,'images/s24ultra.jpg',1),(3,3,'images/macbook_air_m3.jpg',1),(4,4,'images/dell_xps13plus.jpg',1),(5,5,'images/airpodspro2.jpg',1),(6,6,'images/anker65w.jpg',1);
/*!40000 ALTER TABLE `anh_san_pham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chi_tiet_don_hang`
--

DROP TABLE IF EXISTS `chi_tiet_don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_don_hang` (
  `ma_chi_tiet` int NOT NULL AUTO_INCREMENT,
  `ma_don_hang` int DEFAULT NULL,
  `ma_san_pham` int DEFAULT NULL,
  `so_luong` int NOT NULL,
  `gia_ban` decimal(10,2) NOT NULL,
  PRIMARY KEY (`ma_chi_tiet`),
  KEY `ma_don_hang` (`ma_don_hang`),
  KEY `ma_san_pham` (`ma_san_pham`),
  CONSTRAINT `chi_tiet_don_hang_ibfk_1` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_don_hang`),
  CONSTRAINT `chi_tiet_don_hang_ibfk_2` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chi_tiet_don_hang`
--

LOCK TABLES `chi_tiet_don_hang` WRITE;
/*!40000 ALTER TABLE `chi_tiet_don_hang` DISABLE KEYS */;
INSERT INTO `chi_tiet_don_hang` VALUES (1,1,1,1,33990000.00),(2,1,6,1,5990000.00),(3,2,5,1,5990000.00);
/*!40000 ALTER TABLE `chi_tiet_don_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chi_tiet_gio_hang`
--

DROP TABLE IF EXISTS `chi_tiet_gio_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_gio_hang` (
  `ma_chi_tiet_gio` int NOT NULL AUTO_INCREMENT,
  `ma_gio_hang` int DEFAULT NULL,
  `ma_san_pham` int DEFAULT NULL,
  `so_luong` int DEFAULT '1',
  `gia_tai_thoi_diem_them` decimal(10,2) DEFAULT NULL,
  `ngay_them` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_chi_tiet_gio`),
  KEY `ma_gio_hang` (`ma_gio_hang`),
  KEY `ma_san_pham` (`ma_san_pham`),
  CONSTRAINT `chi_tiet_gio_hang_ibfk_1` FOREIGN KEY (`ma_gio_hang`) REFERENCES `gio_hang` (`ma_gio_hang`),
  CONSTRAINT `chi_tiet_gio_hang_ibfk_2` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chi_tiet_gio_hang`
--

LOCK TABLES `chi_tiet_gio_hang` WRITE;
/*!40000 ALTER TABLE `chi_tiet_gio_hang` DISABLE KEYS */;
INSERT INTO `chi_tiet_gio_hang` VALUES (1,1,1,1,33990000.00,'2025-11-13 12:33:07'),(2,1,6,1,5990000.00,'2025-11-13 12:33:07'),(3,2,5,1,5990000.00,'2025-11-13 12:33:07');
/*!40000 ALTER TABLE `chi_tiet_gio_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chi_tiet_hoa_don`
--

DROP TABLE IF EXISTS `chi_tiet_hoa_don`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_hoa_don` (
  `ma_chi_tiet` int NOT NULL AUTO_INCREMENT,
  `ma_hoa_don` int DEFAULT NULL,
  `ma_san_pham` int DEFAULT NULL,
  `so_luong` int DEFAULT NULL,
  `don_gia` decimal(15,2) DEFAULT NULL,
  `thue` decimal(5,2) DEFAULT NULL,
  `thanh_tien` decimal(15,2) DEFAULT NULL,
  PRIMARY KEY (`ma_chi_tiet`),
  KEY `ma_hoa_don` (`ma_hoa_don`),
  KEY `ma_san_pham` (`ma_san_pham`),
  CONSTRAINT `chi_tiet_hoa_don_ibfk_1` FOREIGN KEY (`ma_hoa_don`) REFERENCES `hoa_don` (`ma_hoa_don`),
  CONSTRAINT `chi_tiet_hoa_don_ibfk_2` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chi_tiet_hoa_don`
--

LOCK TABLES `chi_tiet_hoa_don` WRITE;
/*!40000 ALTER TABLE `chi_tiet_hoa_don` DISABLE KEYS */;
INSERT INTO `chi_tiet_hoa_don` VALUES (1,1,1,1,33990000.00,10.00,37389000.00),(2,1,6,1,5990000.00,10.00,6589000.00),(3,2,5,1,5990000.00,0.00,5990000.00);
/*!40000 ALTER TABLE `chi_tiet_hoa_don` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danh_gia`
--

DROP TABLE IF EXISTS `danh_gia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_gia` (
  `ma_danh_gia` int NOT NULL AUTO_INCREMENT,
  `ma_san_pham` int DEFAULT NULL,
  `ma_tai_khoan` int DEFAULT NULL,
  `so_sao` tinyint DEFAULT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` tinyint DEFAULT '1',
  PRIMARY KEY (`ma_danh_gia`),
  KEY `ma_san_pham` (`ma_san_pham`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `danh_gia_ibfk_1` FOREIGN KEY (`ma_san_pham`) REFERENCES `san_pham` (`ma_san_pham`),
  CONSTRAINT `danh_gia_ibfk_2` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `danh_gia_chk_1` CHECK ((`so_sao` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danh_gia`
--

LOCK TABLES `danh_gia` WRITE;
/*!40000 ALTER TABLE `danh_gia` DISABLE KEYS */;
INSERT INTO `danh_gia` VALUES (1,1,2,5,'Sản phẩm cực kỳ tốt, hiệu năng mượt mà.','2025-11-13 12:33:39',1),(2,3,3,4,'Máy đẹp, nhẹ, pin ổn. Chỉ hơi nóng khi chạy nặng.','2025-11-13 12:33:39',1);
/*!40000 ALTER TABLE `danh_gia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danh_muc_san_pham`
--

DROP TABLE IF EXISTS `danh_muc_san_pham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_muc_san_pham` (
  `ma_danh_muc` int NOT NULL AUTO_INCREMENT,
  `ten_danh_muc` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`ma_danh_muc`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danh_muc_san_pham`
--

LOCK TABLES `danh_muc_san_pham` WRITE;
/*!40000 ALTER TABLE `danh_muc_san_pham` DISABLE KEYS */;
INSERT INTO `danh_muc_san_pham` VALUES (1,'Điện thoại','Các dòng điện thoại thông minh chính hãng'),(2,'Laptop','Máy tính xách tay hiệu năng cao'),(3,'Phụ kiện','Tai nghe, sạc, ốp lưng và các phụ kiện khác');
/*!40000 ALTER TABLE `danh_muc_san_pham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `don_hang`
--

DROP TABLE IF EXISTS `don_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `don_hang` (
  `ma_don_hang` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int DEFAULT NULL,
  `tong_tien` decimal(10,2) NOT NULL,
  `trang_thai_thanh_toan` enum('cho_xu_ly','da_thanh_toan','that_bai') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_xu_ly',
  `trang_thai_don_hang` enum('dang_xu_ly','dang_giao','hoan_thanh','da_huy') COLLATE utf8mb4_unicode_ci DEFAULT 'dang_xu_ly',
  `dia_chi_giao_hang` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_don_hang`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `don_hang_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `don_hang`
--

LOCK TABLES `don_hang` WRITE;
/*!40000 ALTER TABLE `don_hang` DISABLE KEYS */;
INSERT INTO `don_hang` VALUES (1,2,39980000.00,'da_thanh_toan','dang_giao','123 Lý Thường Kiệt, Hà Nội','2025-11-13 12:33:17'),(2,3,5990000.00,'cho_xu_ly','dang_xu_ly','45 Lê Duẩn, Đà Nẵng','2025-11-13 12:33:17');
/*!40000 ALTER TABLE `don_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `du_lieu_tim_kiem`
--

DROP TABLE IF EXISTS `du_lieu_tim_kiem`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `du_lieu_tim_kiem` (
  `ma_tim_kiem` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int DEFAULT NULL,
  `tu_khoa` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_tim_kiem` datetime DEFAULT CURRENT_TIMESTAMP,
  `ket_qua_tra_ve` int DEFAULT '0',
  PRIMARY KEY (`ma_tim_kiem`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `du_lieu_tim_kiem_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `du_lieu_tim_kiem`
--

LOCK TABLES `du_lieu_tim_kiem` WRITE;
/*!40000 ALTER TABLE `du_lieu_tim_kiem` DISABLE KEYS */;
INSERT INTO `du_lieu_tim_kiem` VALUES (1,2,'iPhone','2025-11-13 12:34:52',5),(2,3,'AirPods','2025-11-13 12:34:52',2);
/*!40000 ALTER TABLE `du_lieu_tim_kiem` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gio_hang`
--

DROP TABLE IF EXISTS `gio_hang`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gio_hang` (
  `ma_gio_hang` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int DEFAULT NULL,
  `tong_tien` decimal(10,2) DEFAULT '0.00',
  `so_luong_san_pham` int DEFAULT '0',
  `ngay_cap_nhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_gio_hang`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `gio_hang_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gio_hang`
--

LOCK TABLES `gio_hang` WRITE;
/*!40000 ALTER TABLE `gio_hang` DISABLE KEYS */;
INSERT INTO `gio_hang` VALUES (1,2,39980000.00,2,'2025-11-13 12:32:57'),(2,3,5990000.00,1,'2025-11-13 12:32:57');
/*!40000 ALTER TABLE `gio_hang` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hoa_don`
--

DROP TABLE IF EXISTS `hoa_don`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hoa_don` (
  `ma_hoa_don` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int DEFAULT NULL,
  `ngay_xuat` datetime DEFAULT CURRENT_TIMESTAMP,
  `tong_tien` decimal(15,2) DEFAULT NULL,
  `phuong_thuc_thanh_toan` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` enum('da_thanh_toan','cho_thanh_toan','da_huy') COLLATE utf8mb4_unicode_ci DEFAULT 'cho_thanh_toan',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`ma_hoa_don`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `hoa_don_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hoa_don`
--

LOCK TABLES `hoa_don` WRITE;
/*!40000 ALTER TABLE `hoa_don` DISABLE KEYS */;
INSERT INTO `hoa_don` VALUES (1,2,'2025-11-13 12:34:24',39980000.00,'Ngan_Hang','da_thanh_toan','Hóa đơn cho đơn hàng #1'),(2,3,'2025-11-13 12:34:24',5990000.00,'COD','cho_thanh_toan','Chưa thanh toán');
/*!40000 ALTER TABLE `hoa_don` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `khuyen_mai`
--

DROP TABLE IF EXISTS `khuyen_mai`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `khuyen_mai` (
  `ma_khuyen_mai` int NOT NULL AUTO_INCREMENT,
  `ten_khuyen_mai` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ma_giam_gia` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `ngay_bat_dau` datetime DEFAULT NULL,
  `ngay_ket_thuc` datetime DEFAULT NULL,
  `dieu_kien_ap_dung` text COLLATE utf8mb4_unicode_ci,
  `trang_thai` tinyint DEFAULT '1',
  PRIMARY KEY (`ma_khuyen_mai`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `khuyen_mai`
--

LOCK TABLES `khuyen_mai` WRITE;
/*!40000 ALTER TABLE `khuyen_mai` DISABLE KEYS */;
INSERT INTO `khuyen_mai` VALUES (1,'Giảm giá Black Friday','BLACK2025','Giảm 20% cho tất cả đơn hàng trên 5 triệu','2025-11-25 00:00:00','2025-11-30 00:00:00','Đơn hàng >= 5.000.000đ',1),(2,'Giáng sinh rực rỡ','XMAS2025','Giảm 15% cho phụ kiện','2025-12-15 00:00:00','2025-12-31 00:00:00','Danh mục phụ kiện',1);
/*!40000 ALTER TABLE `khuyen_mai` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lich_su_chatbot`
--

DROP TABLE IF EXISTS `lich_su_chatbot`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_chatbot` (
  `ma_lich_su` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int DEFAULT NULL,
  `tin_nhan` text COLLATE utf8mb4_unicode_ci,
  `phan_hoi` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_lich_su`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `lich_su_chatbot_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_su_chatbot`
--

LOCK TABLES `lich_su_chatbot` WRITE;
/*!40000 ALTER TABLE `lich_su_chatbot` DISABLE KEYS */;
INSERT INTO `lich_su_chatbot` VALUES (1,2,'Shop có iPhone 15 không?','Dạ, hiện shop có sẵn iPhone 15 Pro Max 256GB ạ!','2025-11-13 12:33:47'),(2,3,'Có giao hàng Đà Nẵng không?','Dạ, shop có hỗ trợ giao toàn quốc nhé!','2025-11-13 12:33:47');
/*!40000 ALTER TABLE `lich_su_chatbot` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lien_he`
--

DROP TABLE IF EXISTS `lien_he`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lien_he` (
  `ma_lien_he` int NOT NULL AUTO_INCREMENT,
  `ten_nguoi_gui` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `so_dien_thoai` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noi_dung` text COLLATE utf8mb4_unicode_ci,
  `ngay_gui` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` enum('chua_phan_hoi','da_phan_hoi') COLLATE utf8mb4_unicode_ci DEFAULT 'chua_phan_hoi',
  PRIMARY KEY (`ma_lien_he`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lien_he`
--

LOCK TABLES `lien_he` WRITE;
/*!40000 ALTER TABLE `lien_he` DISABLE KEYS */;
INSERT INTO `lien_he` VALUES (1,'Nguyễn Văn A','vana@gmail.com','0909123456','Tôi muốn hỏi về tình trạng đơn hàng #1','2025-11-13 12:33:55','chua_phan_hoi'),(2,'Lê Thị B','lethib@gmail.com','0909345678','Sản phẩm AirPods có còn hàng không?','2025-11-13 12:33:55','chua_phan_hoi');
/*!40000 ALTER TABLE `lien_he` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `quang_cao`
--

DROP TABLE IF EXISTS `quang_cao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `quang_cao` (
  `ma_quang_cao` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hinh_anh` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `duong_dan` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_hien_thi` datetime DEFAULT NULL,
  `ngay_ket_thuc` datetime DEFAULT NULL,
  `trang_thai` enum('dang_hien_thi','da_an') COLLATE utf8mb4_unicode_ci DEFAULT 'dang_hien_thi',
  PRIMARY KEY (`ma_quang_cao`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `quang_cao`
--

LOCK TABLES `quang_cao` WRITE;
/*!40000 ALTER TABLE `quang_cao` DISABLE KEYS */;
INSERT INTO `quang_cao` VALUES (1,'Sale sốc Black Friday','images/banner_blackfriday.jpg','khuyen-mai.html','2025-11-20 00:00:00','2025-11-30 00:00:00','dang_hien_thi'),(2,'Ưu đãi Giáng sinh','images/banner_xmas.jpg','xmas-sale.html','2025-12-15 00:00:00','2025-12-31 00:00:00','dang_hien_thi');
/*!40000 ALTER TABLE `quang_cao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reset_password`
--

DROP TABLE IF EXISTS `reset_password`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reset_password` (
  `ma_reset` int NOT NULL AUTO_INCREMENT,
  `ma_tai_khoan` int DEFAULT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `thoi_gian_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `thoi_gian_het_han` datetime DEFAULT NULL,
  `trang_thai` enum('chua_su_dung','da_su_dung','het_han') COLLATE utf8mb4_unicode_ci DEFAULT 'chua_su_dung',
  PRIMARY KEY (`ma_reset`),
  KEY `ma_tai_khoan` (`ma_tai_khoan`),
  CONSTRAINT `reset_password_ibfk_1` FOREIGN KEY (`ma_tai_khoan`) REFERENCES `tai_khoan` (`ma_tai_khoan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reset_password`
--

LOCK TABLES `reset_password` WRITE;
/*!40000 ALTER TABLE `reset_password` DISABLE KEYS */;
/*!40000 ALTER TABLE `reset_password` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `san_pham`
--

DROP TABLE IF EXISTS `san_pham`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `san_pham` (
  `ma_san_pham` int NOT NULL AUTO_INCREMENT,
  `ma_danh_muc` int DEFAULT NULL,
  `ten_san_pham` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mo_ta` text COLLATE utf8mb4_unicode_ci,
  `gia` decimal(10,2) NOT NULL,
  `so_luong` int DEFAULT '0',
  `thuong_hieu` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `trang_thai` enum('hien_thi','an','xoa') COLLATE utf8mb4_unicode_ci DEFAULT 'hien_thi',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ma_san_pham`),
  KEY `ma_danh_muc` (`ma_danh_muc`),
  CONSTRAINT `san_pham_ibfk_1` FOREIGN KEY (`ma_danh_muc`) REFERENCES `danh_muc_san_pham` (`ma_danh_muc`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `san_pham`
--

LOCK TABLES `san_pham` WRITE;
/*!40000 ALTER TABLE `san_pham` DISABLE KEYS */;
INSERT INTO `san_pham` VALUES (1,1,'iPhone 15 Pro Max','Điện thoại cao cấp của Apple',33990000.00,10,'Apple','hien_thi','2025-11-13 12:32:45','2025-11-13 12:32:45'),(2,1,'Samsung Galaxy S24 Ultra','Flagship Android mạnh mẽ',29990000.00,8,'Samsung','hien_thi','2025-11-13 12:32:45','2025-11-13 12:32:45'),(3,2,'MacBook Air M3 2024','Laptop mỏng nhẹ pin lâu',28990000.00,5,'Apple','hien_thi','2025-11-13 12:32:45','2025-11-13 12:32:45'),(4,2,'Dell XPS 13 Plus','Laptop doanh nhân sang trọng',25990000.00,4,'Dell','hien_thi','2025-11-13 12:32:45','2025-11-13 12:32:45'),(5,3,'Tai nghe AirPods Pro 2','Tai nghe chống ồn chủ động',5990000.00,20,'Apple','hien_thi','2025-11-13 12:32:45','2025-11-13 12:32:45'),(6,3,'Sạc nhanh 65W Anker','Củ sạc nhanh dùng cho nhiều thiết bị',990000.00,50,'Anker','hien_thi','2025-11-13 12:32:45','2025-11-13 12:32:45');
/*!40000 ALTER TABLE `san_pham` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tai_khoan`
--

DROP TABLE IF EXISTS `tai_khoan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tai_khoan` (
  `ma_tai_khoan` int NOT NULL AUTO_INCREMENT,
  `ten_dang_nhap` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mat_khau` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `google_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vai_tro` enum('admin','khach_hang') COLLATE utf8mb4_unicode_ci DEFAULT 'khach_hang',
  `trang_thai` tinyint DEFAULT '1',
  `ngay_tao` datetime DEFAULT CURRENT_TIMESTAMP,
  `hinh_anh` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ma_tai_khoan`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tai_khoan`
--

LOCK TABLES `tai_khoan` WRITE;
/*!40000 ALTER TABLE `tai_khoan` DISABLE KEYS */;
INSERT INTO `tai_khoan` VALUES (1,'admin','123456','admin@shop.vn',NULL,'admin',1,'2025-11-13 12:32:29',NULL),(2,'nguyenvana','123456','vana@gmail.com',NULL,'khach_hang',1,'2025-11-13 12:32:29',NULL),(3,'lethib','123456','lethib@gmail.com',NULL,'khach_hang',1,'2025-11-13 12:32:29',NULL),(4,'nhi','$2b$10$7MQxv4qPu6QJLoH.BcQL/Oqz0IoNYUQkQmgmJk5qQSIeQr2.3pY6C','yennhivk82@gmail.com','106455236021628128201','khach_hang',1,'2025-11-28 14:38:18','https://lh3.googleusercontent.com/a/ACg8ocLuUQ5bSPcB2F55AB0j4ITUWK_Quphfvc74CRpZEShEFszO910=s96-c'),(5,'nhi dinh','$2b$10$P.4MzRPkB/G1ODf8ypV8A.xSAcCJ7g90NPSDcjHK3fLoQfCDgSium','110122237@st.tvu.edu.vn',NULL,'khach_hang',1,'2025-11-28 14:39:48',NULL),(6,'0337878399','$2b$10$uBG5ukGGNhR22l4TXsh23uIMQKUS34/1vQH7lc15TdwDkbkJSJOQO','yennhi84@gmail.com',NULL,'khach_hang',1,'2025-11-28 15:02:51',NULL),(7,'0335261859','$2b$10$Q3Bt9n8bR5.loqkU.VdHcegxCwxmihWqRF3DT.oec55Qz0IsIbXqq','110122227@st.tvu.edu.vn',NULL,'khach_hang',1,'2025-11-28 15:19:32',NULL),(8,'huynh thuật','$2b$10$1Mx20NIh3.SLe9aKX000Oe14IQxvPmrnxup46KIylzGe/x82PYT0a','yennhivk83@gmail.com',NULL,'khach_hang',1,'2025-11-28 15:30:09','/uploads/avatars/avatar-1764320335702-762319967.jpg'),(9,'nhi yến',NULL,'dinhthiyennhitv84@gmail.com','116772768161931040372','khach_hang',1,'2025-11-28 16:32:57','https://lh3.googleusercontent.com/a/ACg8ocIC3DzBqLinrG6m9fDq5bUPE0Mjy7TT5MaeIUJcMItBUFipWg=s96-c'),(10,'Test','$2b$10$E.DsaVCcEqTXT0BzYT3zTe7nern.UoaNm3ZnscHcF8/12WXqKq3EW','newtest@test.com',NULL,'khach_hang',1,'2025-11-29 15:14:50',NULL),(11,'nguyen hoang thuat','$2b$10$AvGbweJqbV5fGpVAcAl14.fjo1.kandFUhW351qzIv/OPv8mNo6nK','nguyenhuynhkithuat84tv@gmail.com',NULL,'khach_hang',1,'2025-11-29 16:07:40',NULL),(12,'vinh khung','$2b$10$rbxh.VfJjFp2FfhjfVhAR.CcqvT11x0F2Y0k5s8Dx6wza5yGH7obO','quangvinhho000@gmail.com',NULL,'khach_hang',1,'2025-11-29 16:18:48',NULL);
/*!40000 ALTER TABLE `tai_khoan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thanh_toan`
--

DROP TABLE IF EXISTS `thanh_toan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thanh_toan` (
  `ma_thanh_toan` int NOT NULL AUTO_INCREMENT,
  `ma_don_hang` int DEFAULT NULL,
  `phuong_thuc` enum('COD','Ngan_Hang','Momo','ZaloPay') COLLATE utf8mb4_unicode_ci NOT NULL,
  `so_tien` decimal(10,2) DEFAULT NULL,
  `ngay_thanh_toan` datetime DEFAULT CURRENT_TIMESTAMP,
  `ma_giao_dich` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`ma_thanh_toan`),
  KEY `ma_don_hang` (`ma_don_hang`),
  CONSTRAINT `thanh_toan_ibfk_1` FOREIGN KEY (`ma_don_hang`) REFERENCES `don_hang` (`ma_don_hang`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thanh_toan`
--

LOCK TABLES `thanh_toan` WRITE;
/*!40000 ALTER TABLE `thanh_toan` DISABLE KEYS */;
INSERT INTO `thanh_toan` VALUES (1,1,'Ngan_Hang',39980000.00,'2025-11-13 12:33:31','GD20251113001'),(2,2,'COD',5990000.00,'2025-11-13 12:33:31','GD20251113002');
/*!40000 ALTER TABLE `thanh_toan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tin_tuc`
--

DROP TABLE IF EXISTS `tin_tuc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tin_tuc` (
  `ma_tin` int NOT NULL AUTO_INCREMENT,
  `tieu_de` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `noi_dung` longtext COLLATE utf8mb4_unicode_ci,
  `anh_dai_dien` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tac_gia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ngay_dang` datetime DEFAULT CURRENT_TIMESTAMP,
  `trang_thai` enum('hien_thi','an') COLLATE utf8mb4_unicode_ci DEFAULT 'hien_thi',
  PRIMARY KEY (`ma_tin`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tin_tuc`
--

LOCK TABLES `tin_tuc` WRITE;
/*!40000 ALTER TABLE `tin_tuc` DISABLE KEYS */;
INSERT INTO `tin_tuc` VALUES (1,'Apple ra mắt iPhone 15 Pro Max','Sản phẩm mới mang đến nhiều nâng cấp vượt trội về camera và hiệu năng.','images/news1.jpg','Admin','2025-11-13 12:34:45','hien_thi'),(2,'Mẹo sử dụng MacBook hiệu quả hơn','Tổng hợp các phím tắt và mẹo giúp bạn làm việc nhanh hơn trên macOS.','images/news2.jpg','Admin','2025-11-13 12:34:45','hien_thi');
/*!40000 ALTER TABLE `tin_tuc` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-29 16:24:53

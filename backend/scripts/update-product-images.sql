-- Script cập nhật ảnh sản phẩm với ảnh online tạm thời
-- Chạy script này nếu chưa có ảnh trong thư mục backend/images

UPDATE anh_san_pham SET duong_dan_anh = 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400' WHERE ma_san_pham = 1; -- iPhone 15
UPDATE anh_san_pham SET duong_dan_anh = 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400' WHERE ma_san_pham = 2; -- Samsung S24
UPDATE anh_san_pham SET duong_dan_anh = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400' WHERE ma_san_pham = 3; -- MacBook Air
UPDATE anh_san_pham SET duong_dan_anh = 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=400' WHERE ma_san_pham = 4; -- Dell XPS
UPDATE anh_san_pham SET duong_dan_anh = 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=400' WHERE ma_san_pham = 5; -- AirPods Pro
UPDATE anh_san_pham SET duong_dan_anh = 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=400' WHERE ma_san_pham = 6; -- Anker charger

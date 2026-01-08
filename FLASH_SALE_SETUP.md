# 🚀 Hướng dẫn khởi động Flash Sale

## ✅ Đã hoàn thành:
- ✅ Tạo bảng `flash_sale` trong database
- ✅ Thêm API routes vào `backend/routes/admin.js`
- ✅ Thêm giao diện Flash Sale vào `frontend/pages/admin.html`

## 🔧 Cần làm ngay:

### 1. **RESTART Backend Server**
Backend server cần restart để load các API routes Flash Sale mới.

**Cách 1: Dừng và chạy lại**
```bash
# Tìm process đang chạy
Get-Process -Name node

# Dừng server (Ctrl+C trong terminal đang chạy server)
# Hoặc kill process:
Stop-Process -Id <process_id>

# Chạy lại server
cd backend
node server.js
```

**Cách 2: Nếu dùng nodemon (tự động restart)**
```bash
# Server sẽ tự động restart khi có thay đổi file
# Nếu không tự restart, save lại file backend/routes/admin.js
```

### 2. **Kiểm tra server đã chạy**
Mở trình duyệt và truy cập:
```
http://localhost:3000/api/admin/flash-sale
```

Nếu thấy response (dù là lỗi authentication) = Server đã chạy ✅

### 3. **Sử dụng Flash Sale**
1. Đăng nhập vào trang Admin
2. Click menu "⚡ Flash Sale"
3. Chuyển sang tab "🐌 Sản phẩm bán chậm"
4. Click nút "⚡ Thêm vào Flash Sale" trên sản phẩm muốn sale
5. Cấu hình giá sale, thời gian, số lượng
6. Lưu lại!

## 📊 Các API đã thêm:
- `GET /api/admin/flash-sale` - Lấy danh sách flash sale
- `POST /api/admin/flash-sale` - Thêm sản phẩm vào flash sale
- `DELETE /api/admin/flash-sale/:id` - Xóa khỏi flash sale

## 🎯 Tính năng:
- ✅ Quản lý Flash Sale theo trạng thái (Đang diễn ra, Sắp diễn ra, Đã kết thúc)
- ✅ Xem danh sách sản phẩm bán chậm
- ✅ Thêm nhanh sản phẩm vào Flash Sale
- ✅ Cấu hình giá sale, thời gian, số lượng giới hạn
- ✅ Biểu đồ tổng quan sản phẩm bán chậm trong Dashboard

## ⚠️ Lưu ý:
- Server PHẢI restart sau khi thêm routes mới
- Đảm bảo database đã có bảng `flash_sale`
- Kiểm tra port 3000 không bị conflict

# Tài khoản Admin Mặc định

## Thông tin tài khoản Admin

Hệ thống đã được cấu hình với tài khoản admin mặc định:

**Email:** yennhivk82@gmail.com  
**Phương thức đăng nhập:** Google OAuth  
**Vai trò:** Admin (có toàn quyền quản trị)

## Cách đăng nhập vào trang Admin

1. Truy cập trang đăng nhập admin:
   ```
   http://localhost:5500/frontend/pages/admin-login.html
   ```

2. Nhấn nút **"Đăng nhập với Google"**

3. Chọn tài khoản Google: **yennhivk82@gmail.com**

4. Sau khi xác thực thành công, bạn sẽ được chuyển đến trang quản trị:
   ```
   http://localhost:5500/frontend/pages/admin.html
   ```

## Lưu ý quan trọng

- ✅ Tài khoản này có quyền truy cập đầy đủ vào trang quản trị
- ✅ Đăng nhập bằng Google OAuth - không cần mật khẩu
- ✅ Hệ thống tự động kiểm tra quyền admin trước khi cho phép truy cập
- ⚠️ Chỉ tài khoản có `vai_tro = 'admin'` mới có thể đăng nhập vào trang admin

## Cấu trúc phân quyền

Trong database `CSDL_DoAnCN`, bảng `tai_khoan` có cột `vai_tro` với 2 giá trị:
- `'admin'` - Quản trị viên (có thể truy cập trang admin)
- `'khach_hang'` - Khách hàng (chỉ có thể mua sắm)

## Thêm tài khoản admin mới

Để thêm tài khoản admin khác, chạy lệnh SQL:

```sql
UPDATE tai_khoan 
SET vai_tro = 'admin' 
WHERE email = 'email_cua_ban@gmail.com';
```

Hoặc sử dụng script Node.js có sẵn:

```bash
cd backend
node scripts/set-admin-account.js
```

Sau đó chỉnh sửa email trong file `set-admin-account.js` trước khi chạy.

## Kiểm tra tài khoản admin

Để xem danh sách tất cả tài khoản admin:

```sql
SELECT ma_tai_khoan, ten_dang_nhap, email, vai_tro, trang_thai 
FROM tai_khoan 
WHERE vai_tro = 'admin';
```

## Hỗ trợ

Nếu gặp vấn đề khi đăng nhập admin:
1. Kiểm tra tài khoản có `vai_tro = 'admin'` trong database
2. Kiểm tra `trang_thai = 1` (hoạt động)
3. Xóa cache và localStorage của trình duyệt
4. Kiểm tra backend server đang chạy ở port 3300

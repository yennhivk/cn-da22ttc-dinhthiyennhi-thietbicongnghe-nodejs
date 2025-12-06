# Tổng quan cấu trúc hệ thống Admin

## Tóm tắt
Đã loại bỏ file trùng lặp `ADMIN_LOGIN_SETUP.md` (cách tiếp cận cũ).
Hệ thống hiện tại sử dụng **Admin Login riêng biệt hoàn toàn**.

## Cấu trúc File Admin

### Frontend Pages
```
frontend/pages/
├── admin-login.html          ← Trang đăng nhập admin riêng
├── admin-callback.html       ← Callback xử lý Google OAuth cho admin  
├── admin.html                ← Dashboard admin (được bảo vệ)
└── test-auth.html            ← Tool debug (hỗ trợ cả user & admin)
```

### Backend Routes (auth.js)
```javascript
// USER ROUTES
POST   /api/auth/login              // Đăng nhập user thường
GET    /api/auth/verify             // Verify token user
GET    /api/auth/google             // Google OAuth cho user
GET    /api/auth/google/callback    // Callback chung (xử lý cả user & admin)

// ADMIN ROUTES (Riêng biệt)
POST   /api/auth/admin-login        // Đăng nhập admin
GET    /api/auth/verify-admin       // Verify token admin
GET    /api/auth/google-admin       // Google OAuth cho admin
```

### Documentation
```
ADMIN_SEPARATE_LOGIN.md     ← Hướng dẫn đầy đủ (file duy nhất)
```

## Phân biệt User vs Admin

### User Login Flow
```
login.html 
  → POST /api/auth/login hoặc GET /api/auth/google
  → auth-callback.html
  → index.html
  
LocalStorage: token, user
Verify: GET /api/auth/verify
```

### Admin Login Flow  
```
admin-login.html
  → POST /api/auth/admin-login hoặc GET /api/auth/google-admin
  → admin-callback.html
  → admin.html
  
LocalStorage: admin_token, admin_user
Verify: GET /api/auth/verify-admin
```

## File đã xóa
- ❌ `ADMIN_LOGIN_SETUP.md` - Cách tiếp cận cũ (dùng chung với user login)

## File được cập nhật
- ✅ `test-auth.html` - Thêm mode switch để test cả user và admin
- ✅ `admin.html` - Sử dụng admin_token và admin_user
- ✅ `auth.js` - Thêm routes admin riêng

## Không có trùng lặp

Tất cả file hiện tại đều cần thiết và có mục đích riêng:

### Pages riêng biệt
- `login.html` ≠ `admin-login.html` (giao diện và logic khác nhau)
- `auth-callback.html` ≠ `admin-callback.html` (xử lý callback khác nhau)
- `account.html` ≠ `admin.html` (trang user vs trang quản trị)

### Routes riêng biệt
- `/auth/login` ≠ `/auth/admin-login`
- `/auth/verify` ≠ `/auth/verify-admin`
- `/auth/google` ≠ `/auth/google-admin`

### Storage riêng biệt
- `token, user` ≠ `admin_token, admin_user`

## Kết luận

✅ Đã loại bỏ file documentation trùng lặp
✅ Không có code trùng lặp - tất cả đều có mục đích riêng
✅ Hệ thống admin và user hoàn toàn tách biệt
✅ Mỗi file đều cần thiết cho chức năng của nó

Để biết chi tiết cách sử dụng, xem file `ADMIN_SEPARATE_LOGIN.md`

# Hướng dẫn đăng nhập Admin riêng biệt

## Tổng quan
Hệ thống giờ đã có 2 hệ thống đăng nhập riêng biệt:
1. **Đăng nhập người dùng** - Cho khách hàng mua sắm
2. **Đăng nhập Admin** - Cho quản trị viên (RIÊNG BIỆT HOÀN TOÀN)

## 🔐 Tài khoản Admin mặc định

**Email:** yennhivk82@gmail.com  
**Phương thức:** Đăng nhập Google OAuth  
**Vai trò:** Admin (toàn quyền quản trị)

## Đăng nhập Admin

### URL truy cập
```
http://localhost:5500/frontend/pages/admin-login.html
```

### Tính năng
✅ Trang đăng nhập admin riêng với giao diện chuyên nghiệp
✅ Đăng nhập bằng Google OAuth (phương thức duy nhất)
✅ LocalStorage riêng (`admin_token`, `admin_user`)
✅ Session riêng trên server
✅ Callback riêng (`admin-callback.html`)
✅ Token verification riêng (`/api/auth/verify-admin`)
✅ Tài khoản admin mặc định: yennhivk82@gmail.com

## Cách hoạt động

### Đăng nhập Google OAuth (Duy nhất)
```
Flow: admin-login.html → GET /api/auth/google-admin → admin.html
```

Kiểm tra:
- Xác thực Google thành công
- Kiểm tra `vai_tro = 1`
- Nếu không phải admin → Reject và quay về admin-login
- Nếu là admin → Lưu token và chuyển đến admin.html

### 2. Truy cập trang Admin
```
Flow: admin.html
   → Kiểm tra admin_token và admin_user trong localStorage
   → GET /api/auth/verify-admin (verify token)
   → Nếu hợp lệ → Hiển thị dashboard
   → Nếu không → Chuyển về admin-login.html
```

## Phân biệt với đăng nhập User

| Tính năng | User Login | Admin Login |
|-----------|-----------|-------------|
| **URL đăng nhập** | `/pages/login.html` | `/pages/admin-login.html` |
| **Phương thức** | Email/Password hoặc Google | Chỉ Google OAuth |
| **API đăng nhập** | `POST /api/auth/login` | N/A (chỉ Google) |
| **Google OAuth** | `GET /api/auth/google` | `GET /api/auth/google-admin` |
| **Callback page** | `auth-callback.html` | `admin-callback.html` |
| **Verify API** | `GET /api/auth/verify` | `GET /api/auth/verify-admin` |
| **LocalStorage token** | `token` | `admin_token` |
| **LocalStorage user** | `user` | `admin_user` |
| **Session key** | `req.session.user` | `req.session.admin` |
| **JWT payload** | `is_admin: false/undefined` | `is_admin: true` |
| **Sau đăng nhập** | `index.html` | `admin.html` |

## Tạo tài khoản Admin

Admin chỉ có thể đăng nhập bằng Google OAuth. Để cấp quyền admin cho một tài khoản Google:

### Tài khoản admin mặc định
**Email:** yennhivk82@gmail.com (đã được cấu hình)

### Cấp quyền admin cho email Google khác
```sql
-- Tìm tài khoản theo email Google
SELECT ma_tai_khoan, email, vai_tro FROM tai_khoan WHERE email = 'yourgoogle@gmail.com';

-- Cấp quyền admin (sử dụng 'admin' cho ENUM)
UPDATE tai_khoan 
SET vai_tro = 'admin' 
WHERE email = 'yourgoogle@gmail.com';
```

**Hoặc sử dụng script Node.js:**
```bash
cd backend
node scripts/set-admin-account.js
```
(Chỉnh sửa email trong file script trước khi chạy)

### Lưu ý quan trọng
- ⚠️ Admin **CHỈ** đăng nhập bằng Google OAuth
- ⚠️ Không cần tạo mật khẩu cho tài khoản admin
- ⚠️ Email phải tồn tại trong database với `vai_tro = 'admin'`
- ⚠️ Khi đăng nhập Google lần đầu, tài khoản sẽ tự động được tạo (nếu chưa có)
- ⚠️ Sau đó cần cập nhật `vai_tro = 'admin'` trong database để cấp quyền admin

## Kiểm tra hệ thống

### Test đăng nhập Admin Google
```
1. Mở: http://localhost:5500/frontend/pages/admin-login.html
2. Nhấn "Đăng nhập với Google"
3. Chọn tài khoản Google
4. Nếu email chưa có trong database → Tài khoản được tạo tự động
5. Kiểm tra database và cập nhật vai_tro = 1
6. Đăng nhập lại → Thành công vào admin.html
```

### Test tách biệt hoàn toàn
```
1. Đăng nhập user ở login.html → Lưu vào `token` và `user`
2. Mở tab mới → Truy cập admin-login.html
3. Đăng nhập admin → Lưu vào `admin_token` và `admin_user`
4. Kiểm tra localStorage: Có 4 keys riêng biệt
5. User và Admin hoạt động độc lập
```

## Bảo mật

### 1. Tách biệt hoàn toàn
- ✅ Admin và User dùng localStorage keys khác nhau
- ✅ Admin và User dùng session keys khác nhau  
- ✅ Admin và User dùng callback URLs khác nhau
- ✅ Admin có JWT payload `is_admin: true`

### 2. Xác thực nghiêm ngặt
- ✅ Luôn kiểm tra `vai_tro = 1` ở backend
- ✅ Verify token mỗi khi load admin.html
- ✅ Session timeout sau 24h
- ✅ Google OAuth chỉ cho phép admin login

### 3. Best Practices
- 🔐 Chỉ cấp `vai_tro = 1` cho những người thực sự cần
- 🔐 Sử dụng email Google doanh nghiệp cho admin
- 🔐 Enable 2FA cho Google accounts của admin
- 🔐 Thường xuyên kiểm tra logs đăng nhập admin
- 🔐 Không cần quản lý mật khẩu (chỉ dùng Google OAuth)

## Troubleshooting

### Lỗi: "Tài khoản không có quyền admin"
```sql
-- Kiểm tra vai_tro
SELECT email, vai_tro FROM tai_khoan WHERE email = 'your@email.com';

-- Nếu vai_tro != 'admin', cập nhật
UPDATE tai_khoan SET vai_tro = 'admin' WHERE email = 'your@email.com';

-- Hoặc dùng script:
-- cd backend
-- node scripts/set-admin-account.js
```

### Lỗi: "Token không hợp lệ"
```javascript
// Xóa localStorage và đăng nhập lại
localStorage.removeItem('admin_token');
localStorage.removeItem('admin_user');
// Refresh page
```

### Lỗi: Google OAuth không hoạt động
```
1. Kiểm tra GOOGLE_CLIENT_ID và GOOGLE_CLIENT_SECRET trong .env
2. Kiểm tra Authorized redirect URIs trong Google Console
3. Đảm bảo email Google có trong database với vai_tro = 1
```

## Logs và Monitoring

### Các log quan trọng
```javascript
// Backend console sẽ hiển thị:
'🔐 Admin login attempt: { email }'
'✅ Admin login successful: user@email.com'
'❌ Google admin login failed - not admin: user@email.com'
```

### Kiểm tra trong browser
```javascript
// Console log khi load admin.html
'Checking admin auth - User:', {...}
'Checking admin auth - Token:', 'exists'
'Verifying admin token with server...'
'Verify admin success:', {...}
```

## Production Deployment

Khi deploy production, cập nhật:

### Frontend
```javascript
// admin-login.html, admin.html
const API_URL = 'https://your-domain.com/api';
```

### Backend (.env)
```env
FRONTEND_URL=https://your-domain.com
GOOGLE_CLIENT_ID=your-production-client-id
GOOGLE_CLIENT_SECRET=your-production-client-secret
```

### Google OAuth Console
Thêm production URLs:
- Authorized JavaScript origins: `https://your-domain.com`
- Authorized redirect URIs: `https://your-domain.com/api/auth/google/callback`

## Tổng kết

Hệ thống admin login riêng đã hoàn toàn tách biệt khỏi user login:

✅ Trang đăng nhập riêng
✅ API endpoints riêng
✅ LocalStorage riêng
✅ Session riêng
✅ Callback riêng
✅ Token verification riêng
✅ Google OAuth flow riêng

Admin và User không thể ảnh hưởng lẫn nhau!

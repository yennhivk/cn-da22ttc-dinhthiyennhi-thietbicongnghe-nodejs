# SƠ ĐỒ LUỒNG XỬ LÝ DỮ LIỆU - HỆ THỐNG E-COMMERCE

## 📊 TỔNG QUAN KIẾN TRÚC HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (FRONTEND)                           │
│  HTML + CSS + JavaScript (Vanilla JS)                               │
│  - Trang chủ, Sản phẩm, Giỏ hàng, Thanh toán                       │
│  - Quản lý Admin Dashboard                                          │
└──────────────────┬──────────────────────────────────────────────────┘
                   │ HTTP/HTTPS Requests
                   │ (fetch API)
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     SERVER (BACKEND - EXPRESS.JS)                    │
│  Node.js + Express.js                                                │
│  PORT: 3000/3300                                                     │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  MIDDLEWARE LAYER                                         │      │
│  │  - CORS                                                    │      │
│  │  - Body Parser                                             │      │
│  │  - Express Session                                         │      │
│  │  - Passport.js (Google OAuth)                             │      │
│  │  - JWT Authentication                                      │      │
│  │  - Multer (File Upload)                                   │      │
│  └──────────────────────────────────────────────────────────┘      │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │  ROUTES (API ENDPOINTS)                                   │      │
│  │  - /api/auth      (Xác thực & Đăng nhập)                │      │
│  │  - /api/products  (Sản phẩm)                             │      │
│  │  - /api/admin     (Quản trị)                             │      │
│  │  - /api/cart      (Giỏ hàng - client-side)              │      │
│  │  - /api/orders    (Đơn hàng - planned)                   │      │
│  └──────────────────────────────────────────────────────────┘      │
└──────────────────┬──────────────────────────────────────────────────┘
                   │ MySQL2 (Promise)
                   │ Connection Pool
                   ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    DATABASE (MySQL)                                  │
│  CSDL_DoAnCN                                                         │
│  - tai_khoan (Tài khoản)                                            │
│  - san_pham (Sản phẩm)                                              │
│  - danh_muc_san_pham (Danh mục)                                     │
│  - anh_san_pham (Ảnh sản phẩm)                                      │
│  - don_hang (Đơn hàng)                                              │
│  - chi_tiet_don_hang (Chi tiết đơn hàng)                           │
│  - thanh_toan (Thanh toán)                                          │
│  - danh_gia (Đánh giá)                                              │
│  - gio_hang (Giỏ hàng - DB)                                         │
│  - lich_su_chatbot (Lịch sử chatbot)                               │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🔄 CHI TIẾT LUỒNG XỬ LÝ DỮ LIỆU

### 1️⃣ LUỒNG XÁC THỰC & ĐĂNG NHẬP (Authentication Flow)

#### A. ĐĂNG KÝ TÀI KHOẢN (với OTP Email)

```mermaid
graph TD
    A[User nhập form đăng ký] --> B[Frontend: auth.js/register]
    B --> C{Validate dữ liệu}
    C -->|Lỗi| D[Hiển thị thông báo lỗi]
    C -->|OK| E[POST /api/auth/send-register-otp]
    
    E --> F[Backend: routes/auth.js]
    F --> G{Kiểm tra email tồn tại}
    G -->|Đã tồn tại| H[Return 409: Email đã dùng]
    G -->|Chưa tồn tại| I[Tạo OTP 6 số]
    
    I --> J[Hash mật khẩu với bcrypt]
    J --> K[Lưu vào otpStore Map]
    K --> L[Gửi email OTP - mailer.js]
    L --> M[Nodemailer gửi qua SMTP]
    M --> N[Return success]
    
    N --> O[User nhập OTP]
    O --> P[POST /api/auth/verify-register-otp]
    P --> Q{Kiểm tra OTP}
    Q -->|Sai/Hết hạn| R[Return lỗi]
    Q -->|Đúng| S[INSERT vào tai_khoan]
    S --> T[(Database: tai_khoan)]
    T --> U[Gửi email chào mừng]
    U --> V[Return success + token JWT]
    V --> W[Frontend lưu token + user vào localStorage]
    W --> X[Chuyển trang chủ]
```

**Dữ liệu lưu trữ:**
- **otpStore (Memory)**: `{ email: { otp, expiresAt, registerData } }`
- **Database tai_khoan**: `ma_tai_khoan, ten_dang_nhap, mat_khau (hashed), email, vai_tro, trang_thai`
- **localStorage**: `token (JWT), user (JSON)`

---

#### B. ĐĂNG NHẬP THÔNG THƯỜNG

```mermaid
graph TD
    A[User nhập login form] --> B[POST /api/auth/login]
    B --> C[Backend query tai_khoan by email/username]
    C --> D{User tồn tại?}
    D -->|Không| E[Return 401]
    D -->|Có| F{Tài khoản active?}
    F -->|Không| G[Return 403]
    F -->|Có| H[bcrypt.compare mật khẩu]
    H --> I{Mật khẩu đúng?}
    I -->|Không| J[Return 401]
    I -->|Có| K[Tạo JWT token]
    K --> L[Return token + user info]
    L --> M[Frontend lưu vào localStorage]
    M --> N[Update UI: hiển thị tên user]
```

**Dữ liệu:**
- **Request**: `{ email, mat_khau }`
- **Response**: `{ success, token, user: { ma_tai_khoan, ten_dang_nhap, email, vai_tro } }`

---

#### C. ĐĂNG NHẬP GOOGLE OAUTH 2.0

```mermaid
graph TD
    A[User click Login with Google] --> B[Redirect: /api/auth/google]
    B --> C[Passport Google Strategy]
    C --> D[Google OAuth Consent Screen]
    D --> E[User cho phép]
    E --> F[Google callback: /api/auth/google/callback]
    F --> G[Passport nhận profile + email]
    
    G --> H{Query tai_khoan by google_id/email}
    H -->|Tồn tại| I[Load user từ DB]
    H -->|Chưa có| J[INSERT new user vào DB]
    J --> K[Set vai_tro = khach_hang, trang_thai = 1]
    K --> L[Lưu google_id, hinh_anh]
    
    I --> M[passport.serializeUser]
    L --> M
    M --> N[Session lưu ma_tai_khoan]
    N --> O[Redirect: /frontend/pages/auth-callback.html]
    O --> P[Frontend lấy user info từ /api/auth/me]
    P --> Q[Lưu vào localStorage]
    Q --> R[Close popup, reload parent]
```

**Dữ liệu:**
- **Session**: `ma_tai_khoan`
- **tai_khoan table**: Thêm/cập nhật `google_id, hinh_anh`

---

### 2️⃣ LUỒNG SẢN PHẨM (Product Flow)

#### A. TẢI DANH SÁCH SẢN PHẨM

```mermaid
graph TD
    A[User truy cập trang products.html] --> B[products.js: loadProducts]
    B --> C[GET /api/products?category=&brand=&search=]
    
    C --> D[Backend: routes/products.js]
    D --> E[Build SQL query động]
    E --> F{Có filter?}
    F -->|Category| G[WHERE ma_danh_muc = ?]
    F -->|Brand| H[WHERE thuong_hieu LIKE ?]
    F -->|Price| I[WHERE gia BETWEEN ? AND ?]
    F -->|Search| J[WHERE ten_san_pham LIKE ?]
    
    G --> K[Execute query]
    H --> K
    I --> K
    J --> K
    
    K --> L[JOIN san_pham với danh_muc_san_pham]
    L --> M[Subquery: lấy anh_chinh từ anh_san_pham]
    M --> N[(Database query)]
    N --> O[Return JSON array]
    
    O --> P[Frontend: displayProducts]
    P --> Q[Loop qua products]
    Q --> R[Tạo HTML card cho mỗi sản phẩm]
    R --> S[Render lên DOM]
    S --> T[Attach event: click -> product-detail.html?id=X]
```

**SQL Query:**
```sql
SELECT 
    sp.ma_san_pham, sp.ten_san_pham, sp.mo_ta, sp.gia, 
    sp.so_luong, sp.thuong_hieu, sp.trang_thai,
    dm.ten_danh_muc, dm.ma_danh_muc,
    (SELECT duong_dan_anh FROM anh_san_pham 
     WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = 1 
     LIMIT 1) as anh_chinh
FROM san_pham sp
LEFT JOIN danh_muc_san_pham dm ON sp.ma_danh_muc = dm.ma_danh_muc
WHERE sp.trang_thai = 'hien_thi'
ORDER BY sp.ma_san_pham DESC
```

---

#### B. XEM CHI TIẾT SẢN PHẨM

```mermaid
graph TD
    A[User click vào sản phẩm] --> B[Redirect: product-detail.html?id=123]
    B --> C[product-detail.js: loadProductDetail]
    C --> D[GET /api/products/123]
    
    D --> E[Backend: Query san_pham by ID]
    E --> F[JOIN với danh_muc_san_pham]
    F --> G[Query all anh_san_pham của product]
    G --> H[Query danh_gia + ten_dang_nhap]
    
    H --> I[Combine data: product + images + reviews]
    I --> J[Return JSON]
    
    J --> K[Frontend render chi tiết]
    K --> L[Hiển thị gallery ảnh]
    L --> M[Hiển thị mô tả, giá, số lượng]
    M --> N[Hiển thị reviews]
    N --> O[Button: Thêm vào giỏ hàng]
```

---

### 3️⃣ LUỒNG GIỎ HÀNG (Cart Flow - LocalStorage)

**⚠️ Lưu ý:** Giỏ hàng hiện tại lưu ở **localStorage** (client-side), không dùng bảng `gio_hang` trong DB.

```mermaid
graph TD
    A[User click Thêm vào giỏ] --> B[cart.js: addToCart]
    B --> C{Kiểm tra đăng nhập?}
    C -->|Chưa| D[Alert: Vui lòng đăng nhập]
    C -->|Rồi| E[Get cart key: cart_ma_tai_khoan]
    
    E --> F[Load cart từ localStorage]
    F --> G{Sản phẩm đã có?}
    G -->|Có| H[Tăng so_luong += 1]
    G -->|Chưa| I[Push product mới vào array]
    
    H --> J[Save cart vào localStorage]
    I --> J
    J --> K[Update badge số lượng]
    K --> L[Show notification]
    
    M[User vào cart.html] --> N[loadCart từ localStorage]
    N --> O[Loop render cart items]
    O --> P[Hiển thị checkbox, số lượng, giá]
    P --> Q[Calculate tổng tiền của items đã chọn]
    Q --> R[User thay đổi số lượng]
    R --> S[updateQuantity: +/-]
    S --> J
    
    T[User xóa item] --> U[removeFromCart]
    U --> V[Filter cart array]
    V --> J
```

**Cấu trúc localStorage:**
```javascript
{
  "cart_5": [  // cart_{ma_tai_khoan}
    {
      "ma_san_pham": 1,
      "ten_san_pham": "Laptop Dell",
      "gia": 15000000,
      "so_luong": 2,
      "anh_chinh": "/images/products/dell.jpg"
    }
  ],
  "selected_5": [0, 1]  // Indices of selected items
}
```

---

### 4️⃣ LUỒNG ĐẶT HÀNG (Checkout Flow)

```mermaid
graph TD
    A[User click Thanh toán] --> B[checkout.html]
    B --> C[Load cart items đã chọn]
    C --> D[Hiển thị form địa chỉ]
    D --> E[User nhập thông tin giao hàng]
    
    E --> F[User click Đặt hàng]
    F --> G[POST /api/orders/create - PLANNED]
    
    G --> H[Backend BEGIN TRANSACTION]
    H --> I[INSERT don_hang]
    I --> J[(don_hang table)]
    J --> K[Get ma_don_hang]
    
    K --> L[Loop cart items]
    L --> M[INSERT chi_tiet_don_hang]
    M --> N[(chi_tiet_don_hang table)]
    
    N --> O[UPDATE san_pham.so_luong -= quantity]
    O --> P[(san_pham table)]
    
    P --> Q{Payment method}
    Q -->|COD| R[INSERT thanh_toan COD]
    Q -->|Online| S[Call Payment Gateway API]
    
    R --> T[COMMIT TRANSACTION]
    S --> U{Payment success?}
    U -->|Có| T
    U -->|Không| V[ROLLBACK]
    
    T --> W[Clear cart localStorage]
    W --> X[Return order info]
    X --> Y[Redirect: order-success.html]
```

**Dữ liệu:**
- **don_hang**: `ma_don_hang, ma_tai_khoan, tong_tien, trang_thai_thanh_toan, trang_thai_don_hang, dia_chi_giao_hang`
- **chi_tiet_don_hang**: `ma_chi_tiet, ma_don_hang, ma_san_pham, so_luong, gia_ban`
- **thanh_toan**: `ma_thanh_toan, ma_don_hang, phuong_thuc, so_tien, ma_giao_dich`

---

### 5️⃣ LUỒNG QUẢN TRỊ ADMIN

#### A. ĐĂNG NHẬP ADMIN

```mermaid
graph TD
    A[Admin vào admin-login.html] --> B[Nhập tài khoản]
    B --> C[POST /api/auth/admin-login]
    C --> D[Backend check vai_tro = admin]
    D --> E{Is admin?}
    E -->|Không| F[Return 403 Forbidden]
    E -->|Có| G[Check password]
    G --> H[Generate JWT with admin role]
    H --> I[Return token]
    I --> J[Frontend lưu token]
    J --> K[Redirect: admin.html]
```

---

#### B. DASHBOARD THỐNG KÊ

```mermaid
graph TD
    A[Admin vào admin.html] --> B[GET /api/admin/dashboard]
    B --> C[Middleware: authenticateToken]
    C --> D[Middleware: requireAdmin]
    D --> E{Valid admin token?}
    E -->|Không| F[Return 401/403]
    E -->|Có| G[Execute multiple queries]
    
    G --> H[Query 1: SUM tong_tien - Revenue]
    G --> I[Query 2: COUNT don_hang - Orders]
    G --> J[Query 3: COUNT san_pham - Products]
    G --> K[Query 4: COUNT tai_khoan - Customers]
    G --> L[Query 5: GROUP BY trang_thai - Order status]
    G --> M[Query 6: TOP 10 recent orders]
    G --> N[Query 7: TOP 5 best sellers]
    G --> O[Query 8: Monthly revenue - 12 months]
    G --> P[Query 9: Category stats]
    
    H --> Q[Combine all results]
    I --> Q
    J --> Q
    K --> Q
    L --> Q
    M --> Q
    N --> Q
    O --> Q
    P --> Q
    
    Q --> R[Return JSON stats]
    R --> S[Frontend render charts]
    S --> T[Chart.js visualize]
```

---

#### C. QUẢN LÝ SẢN PHẨM (CRUD)

**Tạo sản phẩm:**
```mermaid
graph TD
    A[Admin click Thêm SP] --> B[Modal form]
    B --> C[Upload ảnh - Multer]
    C --> D[POST /api/admin/products]
    D --> E[Multer save file to /images/products]
    E --> F[BEGIN TRANSACTION]
    F --> G[INSERT san_pham]
    G --> H[Get ma_san_pham]
    H --> I[INSERT anh_san_pham multiple]
    I --> J[Set la_anh_chinh = 1 for first]
    J --> K[COMMIT]
    K --> L[Return product info]
```

**Cập nhật sản phẩm:**
```mermaid
graph TD
    A[Admin edit product] --> B[PUT /api/admin/products/:id]
    B --> C[UPDATE san_pham SET ...]
    C --> D{Upload ảnh mới?}
    D -->|Có| E[Multer save new images]
    E --> F[INSERT anh_san_pham]
    D -->|Không| G[Skip]
    F --> H[Return success]
    G --> H
```

**Xóa sản phẩm:**
```mermaid
graph TD
    A[Admin delete] --> B[DELETE /api/admin/products/:id]
    B --> C{Soft delete?}
    C -->|Có| D[UPDATE trang_thai = 'xoa']
    C -->|Không| E[DELETE from san_pham]
    E --> F[CASCADE delete anh_san_pham]
    D --> G[Return success]
    F --> G
```

---

### 6️⃣ LUỒNG UPLOAD & QUẢN LÝ FILE

```mermaid
graph TD
    A[User upload file] --> B[Multer middleware]
    B --> C{Check file type}
    C -->|Invalid| D[Return error]
    C -->|Valid| E{Check file size}
    E -->|> 5MB| F[Return error]
    E -->|< 5MB| G[Generate unique filename]
    
    G --> H[timestamp-random.ext]
    H --> I[Save to disk]
    I --> J[/uploads/avatars/ OR /images/products/]
    J --> K[Return file path]
    K --> L[Save path vào Database]
    
    L --> M{Type}
    M -->|Avatar| N[UPDATE tai_khoan.hinh_anh]
    M -->|Product| O[INSERT anh_san_pham]
    
    N --> P[Static serve: /uploads/avatars/file.jpg]
    O --> Q[Static serve: /images/products/file.jpg]
```

**Multer Config:**
```javascript
storage: diskStorage({
  destination: './images/products' | './uploads/avatars',
  filename: 'product-{timestamp}-{random}.jpg'
})
limits: { fileSize: 5 * 1024 * 1024 } // 5MB
fileFilter: jpeg|jpg|png|gif|webp
```

---

### 7️⃣ LUỒNG GỬI EMAIL

```mermaid
graph TD
    A[Backend trigger email] --> B[mailer.js functions]
    B --> C{Email type}
    
    C -->|OTP| D[sendOTPEmail]
    C -->|Welcome| E[sendWelcomeEmail]
    C -->|Reset Password| F[sendResetPasswordEmail]
    
    D --> G[Load HTML template]
    E --> G
    F --> G
    
    G --> H[Replace placeholders]
    H --> I[Nodemailer transporter]
    I --> J[SMTP config from .env]
    J --> K[transporter.sendMail]
    
    K --> L{Send success?}
    L -->|Có| M[Return resolve]
    L -->|Không| N[Return reject + error]
```

**Config:**
```javascript
{
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
}
```

---

## 📈 SƠ ĐỒ QUAN HỆ DATABASE (ERD Simplified)

```mermaid
erDiagram
    TAI_KHOAN ||--o{ DON_HANG : "đặt"
    TAI_KHOAN ||--o{ DANH_GIA : "viết"
    TAI_KHOAN ||--o{ LICH_SU_CHATBOT : "có"
    TAI_KHOAN ||--o| GIO_HANG : "có"
    
    DANH_MUC_SAN_PHAM ||--o{ SAN_PHAM : "chứa"
    
    SAN_PHAM ||--o{ ANH_SAN_PHAM : "có"
    SAN_PHAM ||--o{ CHI_TIET_DON_HANG : "trong"
    SAN_PHAM ||--o{ DANH_GIA : "nhận"
    SAN_PHAM ||--o{ CHI_TIET_GIO_HANG : "trong"
    
    DON_HANG ||--o{ CHI_TIET_DON_HANG : "chứa"
    DON_HANG ||--o| THANH_TOAN : "có"
    
    GIO_HANG ||--o{ CHI_TIET_GIO_HANG : "chứa"
    
    TAI_KHOAN {
        int ma_tai_khoan PK
        string ten_dang_nhap
        string mat_khau
        string email
        enum vai_tro
        string google_id
        string hinh_anh
        tinyint trang_thai
    }
    
    SAN_PHAM {
        int ma_san_pham PK
        int ma_danh_muc FK
        string ten_san_pham
        text mo_ta
        decimal gia
        int so_luong
        string thuong_hieu
        enum trang_thai
    }
    
    DON_HANG {
        int ma_don_hang PK
        int ma_tai_khoan FK
        decimal tong_tien
        enum trang_thai_thanh_toan
        enum trang_thai_don_hang
        text dia_chi_giao_hang
    }
    
    CHI_TIET_DON_HANG {
        int ma_chi_tiet PK
        int ma_don_hang FK
        int ma_san_pham FK
        int so_luong
        decimal gia_ban
    }
```

---

## 🔐 LUỒNG BẢO MẬT

### JWT Authentication Flow

```
1. Login → Server tạo JWT token
   Payload: { ma_tai_khoan, email, vai_tro, exp }
   
2. Client lưu token vào localStorage

3. Mỗi request → Header: Authorization: Bearer {token}

4. Server middleware authenticateToken:
   - jwt.verify(token, SECRET_KEY)
   - Attach user vào req.user
   
5. Admin routes → requireAdmin middleware:
   - Check req.user.vai_tro === 'admin'
```

### Password Hashing

```javascript
// Đăng ký
const hashedPassword = await bcrypt.hash(password, 10);

// Đăng nhập  
const match = await bcrypt.compare(inputPassword, hashedPassword);
```

---

## 📦 LUỒNG DỮ LIỆU QUA CÁC LAYER

```
┌─────────────────────────────────────────────────┐
│  PRESENTATION LAYER (Frontend)                  │
│  - HTML Templates                               │
│  - JavaScript Event Handlers                    │
│  - LocalStorage (cart, token, user)            │
└────────────────┬────────────────────────────────┘
                 │
                 │ fetch API (JSON)
                 ▼
┌─────────────────────────────────────────────────┐
│  APPLICATION LAYER (Backend Routes)             │
│  - Express Routes                               │
│  - Request Validation                           │
│  - Business Logic                               │
│  - Response Formatting                          │
└────────────────┬────────────────────────────────┘
                 │
                 │ SQL Queries
                 ▼
┌─────────────────────────────────────────────────┐
│  DATA ACCESS LAYER (Database)                   │
│  - MySQL Connection Pool                        │
│  - CRUD Operations                              │
│  - Transactions                                 │
│  - Foreign Key Constraints                      │
└─────────────────────────────────────────────────┘
```

---

## 🔄 CÁC LUỒNG XỬ LÝ NGOẠI LỆ (Error Handling)

```mermaid
graph TD
    A[Request đến server] --> B{Có token?}
    B -->|Không| C[Return 401 Unauthorized]
    B -->|Có| D{Token valid?}
    D -->|Không| C
    D -->|Có| E{Route tồn tại?}
    E -->|Không| F[404 Handler]
    E -->|Có| G{Có quyền truy cập?}
    G -->|Không| H[Return 403 Forbidden]
    G -->|Có| I[Execute handler]
    
    I --> J{Database error?}
    J -->|Có| K[500 Internal Server Error]
    J -->|Không| L{Business logic error?}
    L -->|Có| M[400 Bad Request]
    L -->|Không| N[200 Success]
```

---

## 📊 TỔNG KẾT LUỒNG DỮ LIỆU CHÍNH

### 🎯 Các điểm chính:

1. **Frontend → Backend**: Sử dụng `fetch()` API với JSON format
2. **Authentication**: JWT token + Passport.js (Google OAuth)
3. **Session**: Express-session cho OAuth callback
4. **Cart**: LocalStorage (client-side) - không sync với DB
5. **File Upload**: Multer middleware → disk storage
6. **Email**: Nodemailer với SMTP
7. **Database**: MySQL với connection pooling
8. **Security**: bcrypt password hashing, JWT verification
9. **Admin**: Separate login flow + role-based access control
10. **Error Handling**: Centralized error middleware

### 🚀 Các API Endpoints chính:

**Auth:**
- `POST /api/auth/send-register-otp` - Gửi OTP
- `POST /api/auth/verify-register-otp` - Xác nhận OTP
- `POST /api/auth/login` - Đăng nhập thường
- `GET /api/auth/google` - OAuth Google
- `POST /api/auth/logout` - Đăng xuất

**Products:**
- `GET /api/products` - Danh sách sản phẩm
- `GET /api/products/:id` - Chi tiết sản phẩm
- `GET /api/products/categories/all` - Danh mục

**Admin:**
- `GET /api/admin/dashboard` - Thống kê
- `GET /api/admin/products` - Quản lý SP
- `POST /api/admin/products` - Tạo SP
- `PUT /api/admin/products/:id` - Sửa SP
- `DELETE /api/admin/products/:id` - Xóa SP
- `GET /api/admin/orders` - Quản lý đơn hàng

---

## 📁 CẤU TRÚC FILE & NHIỆM VỤ

```
backend/
├── server.js              # Entry point, khởi tạo Express
├── config/
│   ├── database.js       # MySQL connection pool
│   ├── passport.js       # Google OAuth strategy
│   └── mailer.js         # Nodemailer config & functions
├── routes/
│   ├── auth.js           # Authentication endpoints
│   ├── products.js       # Product CRUD public
│   └── admin.js          # Admin endpoints (protected)
├── images/products/      # Static product images
└── uploads/avatars/      # User avatars

frontend/
├── index.html            # Homepage
├── js/
│   ├── auth.js           # Login/logout logic
│   ├── products.js       # Product listing & filter
│   ├── product-detail.js # Single product view
│   ├── cart.js           # Cart management (localStorage)
│   └── main.js           # Global utilities
└── pages/
    ├── login.html
    ├── register.html
    ├── products.html
    ├── product-detail.html
    ├── cart.html
    ├── checkout.html
    ├── admin-login.html
    └── admin.html
```

---

**💡 Lưu ý quan trọng:**

- Giỏ hàng hiện tại lưu ở **localStorage**, chưa dùng bảng `gio_hang` trong DB
- OTP lưu tạm ở **Memory Map**, production nên dùng Redis
- Đơn hàng chưa có route hoàn chỉnh (planned)
- Session chỉ dùng cho OAuth, không dùng cho auth thường (dùng JWT)
- Static files serve trực tiếp từ Express


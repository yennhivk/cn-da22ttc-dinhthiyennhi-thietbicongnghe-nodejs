# KIẾN TRÚC HỆ THỐNG - YẾN NHI TECH
## Website Bán Hàng Điện Tử (E-Commerce)

---

## 1. TỔNG QUAN KIẾN TRÚC

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              KIẾN TRÚC 3 TẦNG (3-TIER)                          │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    PRESENTATION LAYER (Frontend)                         │   │
│  │                         HTML + CSS + JavaScript                          │   │
│  │                           TailwindCSS                                    │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼ HTTP/REST API                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                    BUSINESS LOGIC LAYER (Backend)                        │   │
│  │                         Node.js + Express.js                             │   │
│  │                    Authentication: JWT + Passport.js                     │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                    │                                            │
│                                    ▼ MySQL Protocol                             │
│  ┌─────────────────────────────────────────────────────────────────────────┐   │
│  │                      DATA LAYER (Database)                               │   │
│  │                           MySQL (mysql2)                                 │   │
│  │                        Database: CSDL_DoAnCN                             │   │
│  └─────────────────────────────────────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. SƠ ĐỒ KIẾN TRÚC CHI TIẾT

```
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         CLIENT SIDE                                           │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                    WEB BROWSER                                          │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │                              FRONTEND (Static Files)                             │   │  │
│  │  │                                                                                  │   │  │
│  │  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │  │
│  │  │   │  index.html  │  │ products.html│  │  cart.html   │  │ checkout.html│        │   │  │
│  │  │   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │   │  │
│  │  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │  │
│  │  │   │  login.html  │  │ register.html│  │ account.html │  │  admin.html  │        │   │  │
│  │  │   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │   │  │
│  │  │   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │   │  │
│  │  │   │  news.html   │  │ contact.html │  │ articles.html│  │ promotions   │        │   │  │
│  │  │   └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘        │   │  │
│  │  │                                                                                  │   │  │
│  │  │   ┌─────────────────────────────────────────────────────────────────────────┐   │   │  │
│  │  │   │                        JAVASCRIPT MODULES                                │   │   │  │
│  │  │   │  auth.js │ cart.js │ products.js │ chatbot.js │ main.js │ news.js       │   │   │  │
│  │  │   └─────────────────────────────────────────────────────────────────────────┘   │   │  │
│  │  │                                                                                  │   │  │
│  │  │   ┌─────────────────────────────────────────────────────────────────────────┐   │   │  │
│  │  │   │                           CSS STYLING                                    │   │   │  │
│  │  │   │              TailwindCSS (CDN) + Custom CSS (style.css)                  │   │   │  │
│  │  │   └─────────────────────────────────────────────────────────────────────────┘   │   │  │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              │ HTTP Requests (Fetch API)
                                              │ Port: 3000
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                         SERVER SIDE                                           │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              BACKEND (Node.js + Express)                                │  │
│  │                                     server.js                                           │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                                 MIDDLEWARE                                        │  │  │
│  │  │   ┌─────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐    │  │  │
│  │  │   │  CORS   │ │BodyPars│ │   Session   │ │  Passport   │ │  Static Files   │    │  │  │
│  │  │   └─────────┘ └─────────┘ └─────────────┘ └─────────────┘ └─────────────────┘    │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                              REST API ROUTES                                      │  │  │
│  │  │                                                                                   │  │  │
│  │  │   /api/auth        → auth.js        (Đăng nhập, Đăng ký, OTP, Google OAuth)      │  │  │
│  │  │   /api/products    → products.js    (CRUD Sản phẩm, Tìm kiếm, Lọc)               │  │  │
│  │  │   /api/admin       → admin.js       (Quản lý Admin, Dashboard)                   │  │  │
│  │  │   /api/news        → news.js        (Tin tức, Bài viết)                          │  │  │
│  │  │   /api/articles    → articles.js    (Bài viết chi tiết)                          │  │  │
│  │  │   /api/contact     → contact.js     (Form liên hệ)                               │  │  │
│  │  │   /api/chatbot     → chatbot.js     (Chatbot AI hỗ trợ)                          │  │  │
│  │  │   /api/payment     → payment.js     (Thanh toán MoMo, COD)                       │  │  │
│  │  │   /api/notifications → notifications.js (Thông báo người dùng)                   │  │  │
│  │  │                                                                                   │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘  │  │
│  │                                                                                         │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                              CONFIG MODULES                                       │  │  │
│  │  │   database.js (MySQL) │ passport.js (OAuth) │ mailer.js │ momo.js               │  │  │
│  │  └──────────────────────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
                                              │
                                              │ MySQL Protocol (mysql2)
                                              │ Port: 3306
                                              ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        DATABASE LAYER                                         │
│  ┌────────────────────────────────────────────────────────────────────────────────────────┐  │
│  │                              MySQL Database: CSDL_DoAnCN                                │  │
│  │                                                                                         │  │
│  │   ┌─────────────────────────────────────────────────────────────────────────────────┐  │  │
│  │   │                              CORE TABLES (19 bảng)                               │  │  │
│  │   │                                                                                  │  │  │
│  │   │   ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │  │
│  │   │   │ tai_khoan   │  │danh_muc_san_pham│  │  san_pham   │  │ anh_san_pham    │    │  │  │
│  │   │   │ (Users)     │  │  (Categories)   │  │ (Products)  │  │ (Product Images)│    │  │  │
│  │   │   └─────────────┘  └─────────────────┘  └─────────────┘  └─────────────────┘    │  │  │
│  │   │                                                                                  │  │  │
│  │   │   ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │  │
│  │   │   │  don_hang   │  │chi_tiet_don_hang│  │ thanh_toan  │  │   danh_gia      │    │  │  │
│  │   │   │  (Orders)   │  │ (Order Details) │  │ (Payments)  │  │   (Reviews)     │    │  │  │
│  │   │   └─────────────┘  └─────────────────┘  └─────────────┘  └─────────────────┘    │  │  │
│  │   │                                                                                  │  │  │
│  │   │   ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │  │
│  │   │   │  gio_hang   │  │chi_tiet_gio_hang│  │  hoa_don    │  │chi_tiet_hoa_don │    │  │  │
│  │   │   │   (Cart)    │  │  (Cart Items)   │  │ (Invoices)  │  │(Invoice Details)│    │  │  │
│  │   │   └─────────────┘  └─────────────────┘  └─────────────┘  └─────────────────┘    │  │  │
│  │   │                                                                                  │  │  │
│  │   │   ┌─────────────┐  ┌─────────────────┐  ┌─────────────┐  ┌─────────────────┐    │  │  │
│  │   │   │  tin_tuc    │  │   khuyen_mai    │  │  quang_cao  │  │    lien_he      │    │  │  │
│  │   │   │   (News)    │  │  (Promotions)   │  │    (Ads)    │  │   (Contacts)    │    │  │  │
│  │   │   └─────────────┘  └─────────────────┘  └─────────────┘  └─────────────────┘    │  │  │
│  │   │                                                                                  │  │  │
│  │   │   ┌─────────────┐  ┌─────────────────┐  ┌─────────────────────────────────────┐ │  │  │
│  │   │   │reset_password│ │lich_su_chatbot  │  │        du_lieu_tim_kiem             │ │  │  │
│  │   │   │(Password Reset)│(Chatbot History)│  │         (Search Data)               │ │  │  │
│  │   │   └─────────────┘  └─────────────────┘  └─────────────────────────────────────┘ │  │  │
│  │   │                                                                                  │  │  │
│  │   └─────────────────────────────────────────────────────────────────────────────────┘  │  │
│  └────────────────────────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. SƠ ĐỒ LUỒNG DỮ LIỆU (DATA FLOW)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              LUỒNG XỬ LÝ CHÍNH                                          │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌──────────┐         ┌──────────┐         ┌──────────┐         ┌──────────┐
    │  USER    │ ──────► │ FRONTEND │ ──────► │ BACKEND  │ ──────► │ DATABASE │
    │ (Browser)│ ◄────── │  (HTML/  │ ◄────── │ (Node.js)│ ◄────── │ (MySQL)  │
    └──────────┘         │   JS)    │         └──────────┘         └──────────┘
                         └──────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         LUỒNG XÁC THỰC (AUTHENTICATION FLOW)                            │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐    1. Login Request     ┌─────────────┐    2. Verify     ┌──────────┐
    │  User   │ ─────────────────────► │   Backend   │ ───────────────► │ Database │
    │         │                         │  (auth.js)  │                  │          │
    └─────────┘                         └─────────────┘                  └──────────┘
         ▲                                    │                               │
         │                                    │ 3. Generate JWT               │
         │                                    ▼                               │
         │    5. Store Token            ┌─────────────┐    4. User Data      │
         └─────────────────────────────│   Response  │ ◄─────────────────────┘
                                        │  (JWT Token)│
                                        └─────────────┘

    ┌─────────────────────────────────────────────────────────────────────────────────┐
    │                        GOOGLE OAUTH 2.0 FLOW                                     │
    │                                                                                  │
    │   User ──► Login Page ──► Google Auth ──► Callback ──► Backend ──► JWT Token    │
    │                              │                            │                      │
    │                              └── passport-google-oauth20 ─┘                      │
    └─────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                         LUỒNG ĐẶT HÀNG (ORDER FLOW)                                     │
└─────────────────────────────────────────────────────────────────────────────────────────┘

    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │ Xem SP  │ ──► │Thêm Giỏ │ ──► │Checkout │ ──► │Thanh toán│ ──► │Đơn hàng │
    │         │     │  Hàng   │     │         │     │MoMo/COD │     │ Hoàn tất│
    └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
         │               │               │               │               │
         ▼               ▼               ▼               ▼               ▼
    ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
    │san_pham │     │gio_hang │     │don_hang │     │thanh_toan│     │ hoa_don │
    │         │     │chi_tiet │     │chi_tiet │     │         │     │chi_tiet │
    └─────────┘     └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

---

## 4. CÔNG NGHỆ SỬ DỤNG

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              TECHNOLOGY STACK                                           │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   FRONTEND                    BACKEND                      DATABASE                     │
│   ────────                    ───────                      ────────                     │
│   • HTML5                     • Node.js                    • MySQL                      │
│   • CSS3                      • Express.js 5.x             • mysql2 driver              │
│   • JavaScript (ES6+)         • JWT (jsonwebtoken)         • UTF8MB4 charset            │
│   • TailwindCSS (CDN)         • Passport.js                                             │
│                               • bcrypt                                                  │
│                               • nodemailer                                              │
│                               • multer (file upload)                                    │
│                               • axios                                                   │
│                                                                                         │
│   AUTHENTICATION              PAYMENT                      EXTERNAL SERVICES            │
│   ──────────────              ───────                      ─────────────────            │
│   • JWT Token                 • MoMo Payment               • Google OAuth 2.0           │
│   • Session (express-session) • COD (Cash on Delivery)     • Nodemailer (Email)         │
│   • Google OAuth 2.0          • Bank Transfer                                           │
│   • OTP via Email                                                                       │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. SƠ ĐỒ CƠ SỞ DỮ LIỆU (ERD SIMPLIFIED)

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              ENTITY RELATIONSHIP DIAGRAM                                │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │   tai_khoan     │
                                    │   (Users)       │
                                    ├─────────────────┤
                                    │ PK: ma_tai_khoan│
                                    │ ten_dang_nhap   │
                                    │ mat_khau        │
                                    │ email           │
                                    │ vai_tro         │
                                    │ google_id       │
                                    └────────┬────────┘
                                             │
              ┌──────────────────────────────┼──────────────────────────────┐
              │                              │                              │
              ▼                              ▼                              ▼
    ┌─────────────────┐            ┌─────────────────┐            ┌─────────────────┐
    │   gio_hang      │            │   don_hang      │            │   danh_gia      │
    │   (Cart)        │            │   (Orders)      │            │   (Reviews)     │
    ├─────────────────┤            ├─────────────────┤            ├─────────────────┤
    │ PK: ma_gio_hang │            │ PK: ma_don_hang │            │ PK: ma_danh_gia │
    │ FK: ma_tai_khoan│            │ FK: ma_tai_khoan│            │ FK: ma_san_pham │
    │ tong_tien       │            │ tong_tien       │            │ FK: ma_tai_khoan│
    └────────┬────────┘            │ trang_thai      │            │ so_sao          │
             │                     └────────┬────────┘            │ noi_dung        │
             │                              │                     └─────────────────┘
             ▼                              ▼
    ┌─────────────────┐            ┌─────────────────┐
    │chi_tiet_gio_hang│            │chi_tiet_don_hang│
    ├─────────────────┤            ├─────────────────┤
    │ FK: ma_gio_hang │            │ FK: ma_don_hang │
    │ FK: ma_san_pham │            │ FK: ma_san_pham │
    │ so_luong        │            │ so_luong        │
    └────────┬────────┘            │ gia_ban         │
             │                     └────────┬────────┘
             │                              │
             └──────────────┬───────────────┘
                            │
                            ▼
                  ┌─────────────────┐         ┌─────────────────┐
                  │   san_pham      │◄────────│danh_muc_san_pham│
                  │   (Products)    │         │  (Categories)   │
                  ├─────────────────┤         ├─────────────────┤
                  │ PK: ma_san_pham │         │ PK: ma_danh_muc │
                  │ FK: ma_danh_muc │         │ ten_danh_muc    │
                  │ ten_san_pham    │         │ mo_ta           │
                  │ gia             │         └─────────────────┘
                  │ thuong_hieu     │
                  └────────┬────────┘
                           │
                           ▼
                  ┌─────────────────┐
                  │  anh_san_pham   │
                  │ (Product Images)│
                  ├─────────────────┤
                  │ FK: ma_san_pham │
                  │ duong_dan_anh   │
                  │ la_anh_chinh    │
                  └─────────────────┘
```

---

## 6. CẤU TRÚC THƯ MỤC DỰ ÁN

```
YenNhiTech/
├── backend/                          # Server-side code
│   ├── config/                       # Cấu hình
│   │   ├── database.js               # Kết nối MySQL
│   │   ├── passport.js               # Google OAuth config
│   │   ├── mailer.js                 # Email config
│   │   └── momo.js                   # MoMo payment config
│   │
│   ├── routes/                       # API Routes
│   │   ├── auth.js                   # Xác thực (login, register, OTP)
│   │   ├── products.js               # CRUD sản phẩm
│   │   ├── admin.js                  # Quản trị viên
│   │   ├── news.js                   # Tin tức
│   │   ├── articles.js               # Bài viết
│   │   ├── contact.js                # Liên hệ
│   │   ├── chatbot.js                # Chatbot AI
│   │   ├── payment.js                # Thanh toán
│   │   └── notifications.js          # Thông báo
│   │
│   ├── scripts/                      # Database scripts
│   ├── images/                       # Product images
│   ├── uploads/                      # User uploads
│   ├── server.js                     # Entry point
│   ├── package.json                  # Dependencies
│   └── .env                          # Environment variables
│
├── frontend/                         # Client-side code
│   ├── css/                          # Stylesheets
│   │   ├── style.css
│   │   └── chatbot.css
│   │
│   ├── js/                           # JavaScript modules
│   │   ├── auth.js                   # Authentication logic
│   │   ├── auth-ui.js                # Auth UI components
│   │   ├── cart.js                   # Shopping cart
│   │   ├── products.js               # Product listing
│   │   ├── product-detail.js         # Product detail page
│   │   ├── chatbot.js                # Chatbot interface
│   │   ├── news.js                   # News module
│   │   ├── articles.js               # Articles module
│   │   ├── main.js                   # Main app logic
│   │   └── search-suggestions.js     # Search autocomplete
│   │
│   ├── pages/                        # HTML pages (31 pages)
│   │   ├── login.html                # Đăng nhập
│   │   ├── register.html             # Đăng ký
│   │   ├── products.html             # Danh sách sản phẩm
│   │   ├── product-detail.html       # Chi tiết sản phẩm
│   │   ├── cart.html                 # Giỏ hàng
│   │   ├── checkout.html             # Thanh toán
│   │   ├── admin.html                # Trang quản trị
│   │   ├── account.html              # Tài khoản
│   │   ├── order-history.html        # Lịch sử đơn hàng
│   │   └── ...                       # Các trang khác
│   │
│   ├── includes/                     # Reusable components
│   ├── images/                       # Static images
│   ├── videos/                       # Video files
│   └── index.html                    # Homepage
│
└── CSDL_DoAnCN.sql                   # Database schema
```

---

## 7. API ENDPOINTS

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              REST API ENDPOINTS                                         │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   AUTHENTICATION (/api/auth)                                                            │
│   ─────────────────────────                                                             │
│   POST   /register              Đăng ký tài khoản mới                                   │
│   POST   /login                 Đăng nhập                                               │
│   POST   /verify-otp            Xác thực OTP                                            │
│   POST   /forgot-password       Quên mật khẩu                                           │
│   POST   /reset-password        Đặt lại mật khẩu                                        │
│   GET    /google                Đăng nhập Google OAuth                                  │
│   GET    /google/callback       Google OAuth callback                                   │
│                                                                                         │
│   PRODUCTS (/api/products)                                                              │
│   ────────────────────────                                                              │
│   GET    /                      Lấy danh sách sản phẩm                                  │
│   GET    /:id                   Lấy chi tiết sản phẩm                                   │
│   GET    /category/:id          Lấy sản phẩm theo danh mục                              │
│   GET    /search?q=             Tìm kiếm sản phẩm                                       │
│   POST   /                      Thêm sản phẩm (Admin)                                   │
│   PUT    /:id                   Cập nhật sản phẩm (Admin)                               │
│   DELETE /:id                   Xóa sản phẩm (Admin)                                    │
│                                                                                         │
│   ADMIN (/api/admin)                                                                    │
│   ──────────────────                                                                    │
│   POST   /login                 Đăng nhập Admin                                         │
│   GET    /dashboard             Thống kê tổng quan                                      │
│   GET    /users                 Quản lý người dùng                                      │
│   GET    /orders                Quản lý đơn hàng                                        │
│   PUT    /orders/:id            Cập nhật trạng thái đơn hàng                            │
│                                                                                         │
│   PAYMENT (/api/payment)                                                                │
│   ──────────────────────                                                                │
│   POST   /momo/create           Tạo thanh toán MoMo                                     │
│   POST   /momo/callback         MoMo callback                                           │
│   POST   /cod                   Thanh toán COD                                          │
│                                                                                         │
│   NEWS & ARTICLES (/api/news, /api/articles)                                            │
│   ──────────────────────────────────────────                                            │
│   GET    /                      Lấy danh sách tin tức/bài viết                          │
│   GET    /:id                   Lấy chi tiết                                            │
│                                                                                         │
│   OTHERS                                                                                │
│   ──────                                                                                │
│   POST   /api/contact           Gửi form liên hệ                                        │
│   POST   /api/chatbot           Gửi tin nhắn chatbot                                    │
│   GET    /api/notifications     Lấy thông báo người dùng                                │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 8. BẢO MẬT HỆ THỐNG

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              SECURITY MEASURES                                          │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                           AUTHENTICATION                                         │  │
│   │   • JWT Token với thời hạn 24h                                                   │  │
│   │   • Mật khẩu được hash bằng bcrypt                                               │  │
│   │   • OTP qua email để xác thực                                                    │  │
│   │   • Google OAuth 2.0 cho đăng nhập bên thứ 3                                     │  │
│   │   • Session management với express-session                                       │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                           DATA PROTECTION                                        │  │
│   │   • CORS enabled để kiểm soát cross-origin requests                              │  │
│   │   • Input validation trên cả client và server                                    │  │
│   │   • Prepared statements để chống SQL Injection                                   │  │
│   │   • Environment variables cho thông tin nhạy cảm                                 │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│   │                           ROLE-BASED ACCESS                                      │  │
│   │   • Admin: Toàn quyền quản lý hệ thống                                           │  │
│   │   • Khách hàng: Xem sản phẩm, đặt hàng, đánh giá                                 │  │
│   │   • Guest: Chỉ xem sản phẩm                                                      │  │
│   └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 9. TÍNH NĂNG CHÍNH CỦA HỆ THỐNG

| STT | Tính năng | Mô tả |
|-----|-----------|-------|
| 1 | Quản lý sản phẩm | CRUD sản phẩm, danh mục, hình ảnh |
| 2 | Giỏ hàng | Thêm/xóa/cập nhật sản phẩm trong giỏ |
| 3 | Đặt hàng | Quy trình checkout hoàn chỉnh |
| 4 | Thanh toán | MoMo, COD, Chuyển khoản |
| 5 | Xác thực | Đăng ký, đăng nhập, Google OAuth, OTP |
| 6 | Quản trị | Dashboard admin, quản lý đơn hàng |
| 7 | Tin tức | Bài viết, tin tức công nghệ |
| 8 | Chatbot | Hỗ trợ khách hàng tự động |
| 9 | Đánh giá | Review sản phẩm với sao |
| 10 | Tìm kiếm | Tìm kiếm sản phẩm với gợi ý |
| 11 | Thông báo | Thông báo đơn hàng, khuyến mãi |
| 12 | Liên hệ | Form liên hệ hỗ trợ |

---

*Tài liệu được tạo tự động - Yến Nhi Tech E-Commerce System*

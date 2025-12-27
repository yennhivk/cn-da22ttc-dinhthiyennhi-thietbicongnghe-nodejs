# CHƯƠNG 3: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

## 3.1. MÔ TẢ HỆ THỐNG

### 3.1.1. Tổng quan hệ thống

Website Yến Nhi Tech là hệ thống web fullstack được xây dựng theo kiến trúc Client-Server, bao gồm:

**Phía Client (Frontend):**
- **Giao diện người dùng (Customer Interface):** Trang chủ, danh sách sản phẩm, chi tiết sản phẩm, giỏ hàng, thanh toán, đăng ký/đăng nhập, tin tức, liên hệ
- **Giao diện quản trị (Admin Interface):** Dashboard thống kê, quản lý sản phẩm, quản lý đơn hàng, quản lý khách hàng, quản lý tin tức, quản lý danh mục

**Phía Server (Backend):**
- **RESTful API Server:** Xử lý nghiệp vụ, xác thực JWT, truy vấn dữ liệu, tích hợp thanh toán MoMo
- **Database Server:** Lưu trữ dữ liệu MySQL với 19 bảng quan hệ

### 3.1.2. Kiến trúc hệ thống

**Hình 3.2: Kiến trúc hệ thống**

```
┌─────────────────────────────────────────────┐
│              CLIENT LAYER                   │
│ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│ │ Customer │ │  Admin   │ │  Mobile  │     │
│ │ Website  │ │Dashboard │ │ Browser  │     │
│ └──────────┘ └──────────┘ └──────────┘     │
│      HTML5 / CSS3 / JS / TailwindCSS       │
└─────────────────────────────────────────────┘
                      │
                      ▼ HTTP/REST API
┌─────────────────────────────────────────────┐
│     SERVER LAYER (Node.js + Express.js)     │
│ ┌─────────────────────────────────────────┐ │
│ │ Middleware: CORS|Session|JWT|Multer     │ │
│ ├─────────────────────────────────────────┤ │
│ │ API: /auth|/products|/admin|/payment    │ │
│ ├─────────────────────────────────────────┤ │
│ │ Services: Nodemailer|MoMo|Google OAuth  │ │
│ └─────────────────────────────────────────┘ │
└─────────────────────────────────────────────┘
                      │
                      ▼ MySQL Protocol
┌─────────────────────────────────────────────┐
│            DATA LAYER (MySQL)               │
│ ┌─────────────────────────────────────────┐ │
│ │ tai_khoan|san_pham|don_hang|thanh_toan  │ │
│ │ danh_muc|gio_hang|danh_gia|tin_tuc...   │ │
│ └─────────────────────────────────────────┘ │
│            19 bảng - UTF8MB4                │
└─────────────────────────────────────────────┘
```

#### 1. Client Layer (Lớp giao diện người dùng)

Đây là lớp tương tác trực tiếp với người sử dụng, bao gồm:

**Customer Website:**
Website dành cho khách hàng, được xây dựng bằng HTML, CSS, JavaScript và TailwindCSS để tạo giao diện trực quan, hiện đại. Các trang chính bao gồm:
- Trang chủ (index.html)
- Danh sách sản phẩm (products.html)
- Chi tiết sản phẩm (product-detail.html)
- Giỏ hàng (cart.html)
- Thanh toán (checkout.html)
- Đăng nhập/Đăng ký (login.html, register.html)
- Tin tức (news.html, articles.html)
- Liên hệ (contact.html)

**Admin Dashboard:**
Giao diện quản trị cho nhân viên và quản lý cửa hàng (admin.html), cho phép:
- Xem thống kê doanh thu, đơn hàng
- Quản lý sản phẩm và danh mục
- Quản lý đơn hàng và trạng thái
- Quản lý tài khoản khách hàng
- Quản lý tin tức và bài viết

**Mobile Browser (Responsive):**
Giao diện tương thích trên thiết bị di động nhờ TailwindCSS, đảm bảo trải nghiệm người dùng thống nhất trên nhiều kích thước màn hình.

Các thành phần ở lớp này giao tiếp với server thông qua HTTP/REST API.

#### 2. Server Layer (Node.js + Express.js)

Lớp server là trung tâm xử lý nghiệp vụ và điều phối dữ liệu của toàn bộ hệ thống, được xây dựng trên nền tảng Node.js kết hợp với Express.js nhằm triển khai các RESTful API một cách linh hoạt và hiệu quả.

**Các thành phần hỗ trợ quan trọng:**
- **CORS:** Cho phép frontend truy cập API từ các domain khác nhau
- **Session (express-session):** Quản lý phiên làm việc của người dùng
- **JWT Authentication (jsonwebtoken):** Xác thực và phân quyền người dùng thông qua cơ chế token
- **Multer:** Upload hình ảnh cho sản phẩm và avatar người dùng
- **Bcrypt:** Mã hóa mật khẩu người dùng
- **Nodemailer:** Gửi email xác thực OTP và thông báo
- **Passport.js:** Hỗ trợ đăng nhập qua Google OAuth 2.0
- **Axios:** Tích hợp thanh toán MoMo

**Các module API chính:**
- `/api/auth` - Xác thực người dùng
- `/api/products` - Quản lý sản phẩm
- `/api/admin` - Chức năng quản trị
- `/api/payment` - Thanh toán MoMo
- `/api/news` - Tin tức
- `/api/articles` - Bài viết
- `/api/contact` - Liên hệ
- `/api/chatbot` - Chatbot hỗ trợ
- `/api/notifications` - Thông báo

#### 3. Data Layer (MySQL)

Đây là lớp lưu trữ dữ liệu của hệ thống, sử dụng hệ quản trị cơ sở dữ liệu MySQL với character set utf8mb4 hỗ trợ tiếng Việt.

**Các bảng chính:**
| STT | Tên bảng | Mô tả |
|-----|----------|-------|
| 1 | tai_khoan | Lưu thông tin tài khoản người dùng |
| 2 | danh_muc_san_pham | Phân loại danh mục sản phẩm |
| 3 | san_pham | Lưu thông tin sản phẩm |
| 4 | anh_san_pham | Hình ảnh sản phẩm |
| 5 | don_hang | Quản lý đơn hàng |
| 6 | chi_tiet_don_hang | Chi tiết từng đơn hàng |
| 7 | thanh_toan | Thông tin thanh toán |
| 8 | danh_gia | Đánh giá sản phẩm |
| 9 | lich_su_chatbot | Lịch sử trò chuyện chatbot |
| 10 | gio_hang | Giỏ hàng người dùng |
| 11 | chi_tiet_gio_hang | Chi tiết giỏ hàng |
| 12 | reset_password | Quản lý đặt lại mật khẩu |
| 13 | lien_he | Thông tin liên hệ |
| 14 | quang_cao | Quản lý quảng cáo |
| 15 | tin_tuc | Nội dung tin tức |
| 16 | du_lieu_tim_kiem | Lịch sử tìm kiếm |
| 17 | khuyen_mai | Chương trình khuyến mãi |
| 18 | hoa_don | Hóa đơn |
| 19 | chi_tiet_hoa_don | Chi tiết hóa đơn |

Server giao tiếp với MySQL thông qua thư viện mysql2 để thực hiện các thao tác CRUD.

### 3.1.3. Cấu trúc dự án

**Hình 3.3: Cấu trúc dự án**

```
yennhi-tech/
├── backend/
│   ├── config/
│   │   ├── database.js      # Cấu hình kết nối MySQL
│   │   ├── mailer.js        # Cấu hình gửi email OTP
│   │   ├── momo.js          # Cấu hình thanh toán MoMo
│   │   └── passport.js      # Cấu hình Google OAuth
│   ├── routes/
│   │   ├── auth.js          # API xác thực
│   │   ├── products.js      # API sản phẩm
│   │   ├── admin.js         # API quản trị
│   │   ├── payment.js       # API thanh toán
│   │   ├── news.js          # API tin tức
│   │   ├── articles.js      # API bài viết
│   │   ├── contact.js       # API liên hệ
│   │   ├── chatbot.js       # API chatbot
│   │   └── notifications.js # API thông báo
│   ├── images/              # Hình ảnh sản phẩm
│   ├── uploads/             # Upload avatar, bài viết
│   ├── scripts/             # Scripts hỗ trợ
│   ├── server.js            # Entry point
│   ├── package.json         # Dependencies
│   └── .env                 # Biến môi trường
├── frontend/
│   ├── css/
│   │   ├── style.css        # CSS chính
│   │   └── chatbot.css      # CSS chatbot
│   ├── js/
│   │   ├── main.js          # JavaScript chính
│   │   ├── auth.js          # Xử lý xác thực
│   │   ├── auth-ui.js       # UI xác thực
│   │   ├── products.js      # Xử lý sản phẩm
│   │   ├── product-detail.js# Chi tiết sản phẩm
│   │   ├── cart.js          # Giỏ hàng
│   │   ├── news.js          # Tin tức
│   │   ├── articles.js      # Bài viết
│   │   ├── chatbot.js       # Chatbot
│   │   └── search-suggestions.js # Gợi ý tìm kiếm
│   ├── pages/
│   │   ├── admin.html       # Trang quản trị
│   │   ├── admin-login.html # Đăng nhập admin
│   │   ├── products.html    # Danh sách sản phẩm
│   │   ├── product-detail.html # Chi tiết sản phẩm
│   │   ├── cart.html        # Giỏ hàng
│   │   ├── checkout.html    # Thanh toán
│   │   ├── login.html       # Đăng nhập
│   │   ├── register.html    # Đăng ký
│   │   ├── account.html     # Tài khoản
│   │   ├── order-history.html # Lịch sử đơn hàng
│   │   ├── news.html        # Tin tức
│   │   ├── articles.html    # Bài viết
│   │   ├── contact.html     # Liên hệ
│   │   ├── about.html       # Giới thiệu
│   │   └── ...              # Các trang khác
│   ├── includes/
│   │   ├── header.html      # Header component
│   │   ├── footer.html      # Footer component
│   │   └── chatbot.html     # Chatbot component
│   ├── images/              # Hình ảnh giao diện
│   └── index.html           # Trang chủ
├── CSDL_DoAnCN.sql          # Script khởi tạo database
└── README.md                # Mô tả dự án
```

**Mô tả:** Cấu trúc thư mục của dự án Yến Nhi Tech được tổ chức theo hướng tách biệt rõ ràng giữa frontend và backend, giúp hệ thống dễ phát triển, bảo trì và mở rộng.

Thư mục **backend** đảm nhiệm toàn bộ xử lý nghiệp vụ và dữ liệu, trong đó thư mục `config` chứa các cấu hình quan trọng như kết nối cơ sở dữ liệu, gửi email OTP, tích hợp thanh toán MoMo và xác thực Google OAuth. Thư mục `routes` định nghĩa các API theo từng nghiệp vụ cụ thể như xác thực, quản lý sản phẩm, giỏ hàng, đơn hàng, thanh toán và tin tức.

Thư mục **frontend** chịu trách nhiệm hiển thị giao diện người dùng, bao gồm khu vực admin dành cho quản trị với dashboard, quản lý sản phẩm, đơn hàng và khách hàng, cùng các trang giao diện phía người dùng như trang chủ, sản phẩm, giỏ hàng, thanh toán, đăng nhập và đăng ký. Các tài nguyên giao diện được tổ chức trong các thư mục `css`, `js`, `includes` và `images` nhằm đảm bảo tính tái sử dụng và nhất quán.



## 3.2. XÁC ĐỊNH CÁC YÊU CẦU CHỨC NĂNG CỦA HỆ THỐNG

### 3.2.1. Sơ đồ Usecase

**Hình 3.4: Sơ đồ UseCase**

**Mô tả:** Sơ đồ mô tả ba nhóm người dùng chính: Khách vãng lai, Thành viên, và Admin, mỗi nhóm có quyền truy cập các chức năng khác nhau trong hệ thống.

#### Khách vãng lai (Guest)
Có thể xem các nội dung công khai như:
- Xem trang chủ
- Xem danh sách sản phẩm
- Xem chi tiết sản phẩm
- Tìm kiếm sản phẩm
- Xem tin tức, bài viết
- Xem thông tin liên hệ
- Đăng ký tài khoản

#### Thành viên (Member)
Người dùng đã đăng ký được sử dụng thêm các chức năng nâng cao như:
- Đăng nhập (Email/Password hoặc Google OAuth)
- Quản lý giỏ hàng (thêm, sửa, xóa sản phẩm)
- Đặt hàng và thanh toán (COD, MoMo)
- Xem lịch sử đơn hàng
- Đánh giá sản phẩm
- Quản lý thông tin cá nhân
- Đổi mật khẩu
- Nhận thông báo
- Sử dụng chatbot hỗ trợ

#### Admin (Quản trị viên)
Có quyền quản trị hệ thống, bao gồm:
- Đăng nhập riêng qua trang admin-login
- Xem Dashboard thống kê (doanh thu, đơn hàng, sản phẩm, khách hàng)
- Quản lý sản phẩm (CRUD, upload ảnh, ẩn/hiện)
- Quản lý danh mục sản phẩm
- Quản lý đơn hàng (xem, cập nhật trạng thái)
- Quản lý tài khoản khách hàng (xem, khóa/mở khóa)
- Quản lý tin tức và bài viết
- Xem báo cáo thống kê theo tháng, theo danh mục

Sơ đồ thể hiện rõ ràng phạm vi hệ thống và mối liên hệ giữa các actor với các chức năng tương ứng.

## 3.3. THIẾT KẾ XỬ LÝ HỆ THỐNG

### 3.3.1. Thiết kế API RESTful

#### A. API Xác thực (Authentication) - `/api/auth`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /send-register-otp | Gửi mã OTP xác thực email đăng ký |
| POST | /verify-register-otp | Xác thực OTP và tạo tài khoản |
| POST | /register | Đăng ký tài khoản (legacy) |
| POST | /login | Đăng nhập lấy JWT token |
| POST | /logout | Đăng xuất, hủy session |
| GET | /me | Lấy thông tin người dùng đang đăng nhập |
| GET | /verify | Xác thực JWT token |
| PUT | /update-profile | Cập nhật thông tin cá nhân |
| POST | /upload-avatar | Upload ảnh đại diện |
| PUT | /change-password | Đổi mật khẩu |
| GET | /google | Bắt đầu đăng nhập Google OAuth |
| GET | /google/callback | Callback từ Google |
| POST | /verify-otp | Xác nhận OTP |
| POST | /resend-otp | Gửi lại OTP |
| POST | /admin-login | Đăng nhập riêng cho Admin |

#### B. API Sản phẩm (Products) - `/api/products`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | / | Lấy danh sách sản phẩm (hỗ trợ filter, search, sort) |
| GET | /:id | Xem chi tiết sản phẩm |
| GET | /categories/all | Lấy tất cả danh mục |
| POST | /:id/reviews | Gửi đánh giá sản phẩm (yêu cầu đăng nhập) |

#### C. API Quản trị (Admin) - `/api/admin`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /dashboard | Lấy dữ liệu thống kê Dashboard |
| GET | /products | Lấy tất cả sản phẩm (bao gồm ẩn) |
| GET | /products/:id | Chi tiết sản phẩm |
| POST | /products | Thêm sản phẩm mới |
| PUT | /products/:id | Cập nhật sản phẩm |
| DELETE | /products/:id | Xóa sản phẩm |
| POST | /products/:id/images | Upload ảnh sản phẩm |
| GET | /categories | Lấy danh mục |
| POST | /categories | Thêm danh mục |
| PUT | /categories/:id | Cập nhật danh mục |
| DELETE | /categories/:id | Xóa danh mục |
| GET | /orders | Danh sách đơn hàng |
| GET | /orders/stats | Thống kê đơn hàng |
| GET | /orders/:id | Chi tiết đơn hàng |
| PUT | /orders/:id/status | Cập nhật trạng thái đơn hàng |
| GET | /users | Danh sách tài khoản |
| GET | /users/:id | Chi tiết tài khoản |
| POST | /users | Tạo tài khoản mới |

#### D. API Thanh toán (Payment) - `/api/payment`

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /momo/create | Tạo thanh toán MoMo |
| GET | /momo/callback | Callback từ MoMo (redirect) |
| POST | /momo/ipn | IPN từ MoMo (server-to-server) |
| GET | /momo/status/:orderId | Kiểm tra trạng thái thanh toán |
| POST | /momo/simulate | Thanh toán giả lập (sandbox) |

#### E. API Tin tức & Bài viết

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | /api/news | Lấy danh sách tin tức |
| GET | /api/articles | Lấy danh sách bài viết |

#### F. API Khác

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/contact | Gửi form liên hệ |
| POST | /api/chatbot | Gửi tin nhắn chatbot |
| GET | /api/notifications | Lấy thông báo |

### 3.3.2. Sơ đồ tuần tự (Sequence Diagram)

**Hình 3.5: Sơ đồ tuần tự - Quy trình đăng ký tài khoản**

```
Khách hàng -> Frontend: Nhập thông tin đăng ký
Frontend -> Backend: POST /api/auth/send-register-otp
Backend -> Database: Kiểm tra email tồn tại
Database -> Backend: Kết quả kiểm tra
Backend -> Mailer: Gửi email OTP
Mailer -> Khách hàng: Email chứa mã OTP
Backend -> Frontend: Thông báo đã gửi OTP
Khách hàng -> Frontend: Nhập mã OTP
Frontend -> Backend: POST /api/auth/verify-register-otp
Backend -> Backend: Xác thực OTP
Backend -> Database: INSERT tài khoản mới
Database -> Backend: Kết quả
Backend -> Mailer: Gửi email chào mừng
Backend -> Frontend: Đăng ký thành công
Frontend -> Khách hàng: Chuyển đến trang đăng nhập
```

**Hình 3.6: Sơ đồ tuần tự - Quy trình đăng nhập**

```
Khách hàng -> Frontend: Nhập email/mật khẩu
Frontend -> Backend: POST /api/auth/login
Backend -> Database: SELECT tài khoản theo email
Database -> Backend: Thông tin tài khoản
Backend -> Backend: So sánh mật khẩu (bcrypt)
Backend -> Backend: Tạo JWT token
Backend -> Frontend: Token + thông tin user
Frontend -> LocalStorage: Lưu token
Frontend -> Khách hàng: Đăng nhập thành công
```

**Hình 3.7: Sơ đồ tuần tự - Quy trình đặt hàng**

```
Khách hàng -> Frontend: Thêm sản phẩm vào giỏ
Frontend -> LocalStorage: Lưu giỏ hàng
Khách hàng -> Frontend: Tiến hành thanh toán
Frontend -> Backend: POST /api/orders/create
Backend -> Database: INSERT đơn hàng
Backend -> Database: INSERT chi tiết đơn hàng
Database -> Backend: Mã đơn hàng
Backend -> Frontend: Thông tin đơn hàng
[Nếu thanh toán MoMo]
Frontend -> Backend: POST /api/payment/momo/create
Backend -> MoMo API: Tạo giao dịch
MoMo API -> Backend: URL thanh toán
Backend -> Frontend: Redirect URL
Frontend -> MoMo: Chuyển đến trang thanh toán
MoMo -> Backend: IPN callback
Backend -> Database: Cập nhật trạng thái
MoMo -> Frontend: Redirect callback
Frontend -> Khách hàng: Kết quả thanh toán
```



## 3.4. MÔ HÌNH HOẠT ĐỘNG CỦA HỆ THỐNG

### 3.4.1. Quy trình đăng ký tài khoản

**Hình 3.8: Quy trình đăng ký tài khoản**

```
[Bắt đầu]
    ↓
[Khách hàng truy cập trang đăng ký]
    ↓
[Nhập thông tin: Tên, Email, Mật khẩu]
    ↓
[Hệ thống kiểm tra email đã tồn tại?]
    ↓ Không
[Gửi mã OTP đến email]
    ↓
[Khách hàng nhập mã OTP]
    ↓
[OTP đúng và còn hạn?]
    ↓ Đúng
[Tạo tài khoản mới]
    ↓
[Gửi email chào mừng]
    ↓
[Chuyển đến trang đăng nhập]
    ↓
[Kết thúc]
```

### 3.4.2. Quy trình đặt hàng

**Hình 3.9: Quy trình đặt hàng**

```
[Bắt đầu]
    ↓
[Khách hàng duyệt sản phẩm]
    ↓
[Thêm sản phẩm vào giỏ hàng]
    ↓
[Xem giỏ hàng]
    ↓
[Điều chỉnh số lượng (nếu cần)]
    ↓
[Tiến hành thanh toán]
    ↓
[Đã đăng nhập?]
    ↓ Có
[Nhập thông tin giao hàng]
    ↓
[Chọn phương thức thanh toán]
    ├── COD (Thanh toán khi nhận hàng)
    │       ↓
    │   [Tạo đơn hàng]
    │       ↓
    │   [Hiển thị xác nhận đơn hàng]
    │
    └── MoMo
            ↓
        [Tạo đơn hàng]
            ↓
        [Chuyển đến trang thanh toán MoMo]
            ↓
        [Khách hàng thanh toán]
            ↓
        [MoMo callback]
            ↓
        [Cập nhật trạng thái thanh toán]
            ↓
        [Hiển thị kết quả]
    ↓
[Kết thúc]
```

### 3.4.3. Quy trình quản lý đơn hàng (Admin)

**Hình 3.10: Quy trình quản lý đơn hàng**

```
[Bắt đầu]
    ↓
[Admin đăng nhập]
    ↓
[Truy cập Dashboard]
    ↓
[Xem danh sách đơn hàng]
    ↓
[Lọc theo trạng thái/tìm kiếm]
    ↓
[Chọn đơn hàng cần xử lý]
    ↓
[Xem chi tiết đơn hàng]
    ↓
[Cập nhật trạng thái]
    ├── Đang xử lý → Đang giao
    ├── Đang giao → Hoàn thành
    └── Hủy đơn
    ↓
[Lưu thay đổi]
    ↓
[Thông báo cho khách hàng (nếu có)]
    ↓
[Kết thúc]
```

### 3.4.4. Quy trình quản lý sản phẩm (Admin)

**Hình 3.11: Quy trình quản lý sản phẩm**

```
[Bắt đầu]
    ↓
[Admin truy cập quản lý sản phẩm]
    ↓
[Chọn thao tác]
    ├── Thêm mới
    │       ↓
    │   [Nhập thông tin sản phẩm]
    │       ↓
    │   [Upload hình ảnh]
    │       ↓
    │   [Chọn danh mục]
    │       ↓
    │   [Lưu sản phẩm]
    │
    ├── Chỉnh sửa
    │       ↓
    │   [Chọn sản phẩm]
    │       ↓
    │   [Cập nhật thông tin]
    │       ↓
    │   [Lưu thay đổi]
    │
    ├── Xóa
    │       ↓
    │   [Chọn sản phẩm]
    │       ↓
    │   [Xác nhận xóa]
    │       ↓
    │   [Xóa sản phẩm và ảnh liên quan]
    │
    └── Ẩn/Hiện
            ↓
        [Chọn sản phẩm]
            ↓
        [Thay đổi trạng thái hiển thị]
    ↓
[Kết thúc]
```

## 3.5. CƠ CHẾ BẢO MẬT

### 3.5.1. Xác thực người dùng (Authentication)

Hệ thống sử dụng JWT (JSON Web Token) để xác thực người dùng:

```javascript
// Tạo JWT token khi đăng nhập
const token = jwt.sign(
    {
        ma_tai_khoan: user.ma_tai_khoan,
        ten_dang_nhap: user.ten_dang_nhap,
        vai_tro: user.vai_tro
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
);
```

### 3.5.2. Mã hóa mật khẩu

Mật khẩu được mã hóa bằng bcrypt với salt rounds = 10:

```javascript
// Mã hóa mật khẩu
const hashedPassword = await bcrypt.hash(mat_khau, 10);

// So sánh mật khẩu
const isValid = await bcrypt.compare(mat_khau, user.mat_khau);
```

### 3.5.3. Phân quyền (Authorization)

Middleware kiểm tra quyền Admin:

```javascript
const requireAdmin = (req, res, next) => {
    if (req.user.vai_tro !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền truy cập'
        });
    }
    next();
};
```

### 3.5.4. Xác thực OTP qua Email

- OTP 6 số được tạo ngẫu nhiên
- Thời hạn: 5 phút
- Gửi qua Nodemailer với Gmail SMTP

## KẾT LUẬN CHƯƠNG 3

Chương này đã trình bày một cách chi tiết quá trình hiện thực hóa hệ thống website Yến Nhi Tech, từ tổng quan kiến trúc đến các khía cạnh thiết kế và triển khai cốt lõi.

**Nội dung chương bao gồm:**

1. **Mô tả tổng thể hệ thống** với kiến trúc Client–Server 3 lớp (Client Layer, Server Layer, Data Layer) và cấu trúc thư mục dự án rõ ràng, giúp đảm bảo tính tổ chức và khả năng bảo trì.

2. **Các yêu cầu chức năng** của hệ thống được xác định thông qua biểu đồ Use Case dành cho 3 nhóm người dùng: Khách vãng lai, Thành viên và Quản trị viên.

3. **Thiết kế dữ liệu** tập trung vào cơ sở dữ liệu MySQL với 19 bảng dữ liệu quan hệ, phản ánh đầy đủ các nghiệp vụ của cửa hàng công nghệ.

4. **Thiết kế xử lý** dựa trên API RESTful với các module: Authentication, Products, Admin, Payment, News, Contact, Chatbot, Notifications.

5. **Cơ chế bảo mật** bao gồm:
   - Xác thực JWT (JSON Web Token)
   - Mã hóa mật khẩu bcrypt
   - Xác thực OTP qua email
   - Phân quyền Admin/User
   - Hỗ trợ đăng nhập Google OAuth 2.0

6. **Mô hình hoạt động** của hệ thống được minh họa thông qua các sơ đồ tuần tự và sơ đồ hoạt động, giúp làm rõ luồng xử lý của các nghiệp vụ chính: đăng ký, đăng nhập, đặt hàng, thanh toán MoMo, quản lý sản phẩm và đơn hàng.

Hệ thống được xây dựng với các công nghệ hiện đại:
- **Frontend:** HTML5, CSS3, TailwindCSS, JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MySQL
- **Authentication:** JWT, Passport.js (Google OAuth)
- **Payment:** MoMo API
- **Email:** Nodemailer

Kiến trúc này đảm bảo tính mở rộng, bảo trì dễ dàng và phù hợp cho một hệ thống website thương mại điện tử hoàn chỉnh.

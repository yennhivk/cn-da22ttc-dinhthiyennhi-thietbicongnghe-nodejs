# BỔ SUNG CHƯƠNG 3: HIỆN THỰC HÓA NGHIÊN CỨU - PHẦN 1

## 3.3 Mô tả chi tiết các chức năng trong hệ thống

### 3.3.1 Chức năng đăng ký và đăng nhập

#### 3.3.1.1 Mô tả chức năng

Chức năng đăng ký và đăng nhập là cổng vào của hệ thống, cho phép người dùng tạo tài khoản mới và truy cập vào các tính năng của website. Đây là chức năng quan trọng nhất vì nó liên quan đến bảo mật và quản lý người dùng.

**Đăng ký tài khoản:**
- Người dùng điền thông tin: họ tên, email, số điện thoại, mật khẩu
- Hệ thống kiểm tra tính hợp lệ của dữ liệu
- Hệ thống kiểm tra email đã tồn tại chưa
- Mật khẩu được mã hóa bằng bcrypt trước khi lưu vào database
- Tài khoản mới được tạo với vai trò mặc định là "học viên"
- Gửi email xác nhận đăng ký (tùy chọn)

**Đăng nhập:**
- Người dùng nhập email và mật khẩu
- Hệ thống kiểm tra thông tin đăng nhập
- Nếu đúng, tạo session và chuyển hướng đến trang chủ
- Nếu sai, hiển thị thông báo lỗi
- Hỗ trợ đăng nhập bằng Google OAuth (tùy chọn)

#### 3.3.1.2 Sơ đồ tuần tự (Sequence Diagram)

```
Người dùng          Giao diện          Controller          Model          Database
    |                  |                  |                  |                |
    |--Nhập thông tin->|                  |                  |                |
    |                  |--Gửi yêu cầu---->|                  |                |
    |                  |                  |--Validate------->|                |
    |                  |                  |                  |--Kiểm tra----->|
    |                  |                  |                  |<--Kết quả------|
    |                  |                  |<--Kết quả--------|                |
    |                  |                  |--Mã hóa mật khẩu>|                |
    |                  |                  |                  |--Lưu dữ liệu-->|
    |                  |                  |                  |<--Xác nhận-----|
    |                  |                  |--Tạo session---->|                |
    |                  |<--Phản hồi-------|                  |                |
    |<--Chuyển trang---|                  |                  |                |
```

#### 3.3.1.3 Mã nguồn minh họa

**File: controllers/AuthController.php**

```php
<?php
class AuthController {
    private $userModel;
    
    public function __construct() {
        $this->userModel = new User();
    }
    
    // Xử lý đăng ký
    public function register() {
        if ($_SERVER['REQUEST_METHOD'] == 'POST') {
            // Lấy dữ liệu từ form
            $data = [
                'user_name' => trim($_POST['user_name']),
                'email' => trim($_POST['email']),
                'phone' => trim($_POST['phone']),
                'password' => trim($_POST['password']),
                'confirm_password' => trim($_POST['confirm_password'])
            ];
            
            // Validate dữ liệu
            $errors = $this->validateRegister($data);
            
            if (empty($errors)) {
                // Mã hóa mật khẩu
                $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
                
                // Tạo user_id
                $data['user_id'] = $this->generateUserId();
                $data['role'] = 'STUDENT';
                
                // Lưu vào database
                if ($this->userModel->create($data)) {
                    $_SESSION['success'] = 'Đăng ký thành công!';
                    header('Location: /login');
                    exit();
                } else {
                    $errors[] = 'Có lỗi xảy ra, vui lòng thử lại';
                }
            }
            
            // Hiển thị lỗi
            $_SESSION['errors'] = $errors;
            $_SESSION['old_data'] = $data;
        }
        
        require_once 'views/auth/register.php';
    }
    
    // Validate dữ liệu đăng ký
    private function validateRegister($data) {
        $errors = [];
        
        // Kiểm tra tên
        if (empty($data['user_name'])) {
            $errors[] = 'Vui lòng nhập họ tên';
        }
        
        // Kiểm tra email
        if (empty($data['email'])) {
            $errors[] = 'Vui lòng nhập email';
        } elseif (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $errors[] = 'Email không hợp lệ';
        } elseif ($this->userModel->findByEmail($data['email'])) {
            $errors[] = 'Email đã được sử dụng';
        }
        
        // Kiểm tra số điện thoại
        if (empty($data['phone'])) {
            $errors[] = 'Vui lòng nhập số điện thoại';
        } elseif (!preg_match('/^[0-9]{10}$/', $data['phone'])) {
            $errors[] = 'Số điện thoại không hợp lệ';
        }
        
        // Kiểm tra mật khẩu
        if (empty($data['password'])) {
            $errors[] = 'Vui lòng nhập mật khẩu';
        } elseif (strlen($data['password']) < 6) {
            $errors[] = 'Mật khẩu phải có ít nhất 6 ký tự';
        }
        
        // Kiểm tra xác nhận mật khẩu
        if ($data['password'] !== $data['confirm_password']) {
            $errors[] = 'Mật khẩu xác nhận không khớp';
        }
        
        return $errors;
    }
}
```


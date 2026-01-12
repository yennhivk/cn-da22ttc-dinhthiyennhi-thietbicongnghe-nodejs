# BỔ SUNG CHƯƠNG 3: HIỆN THỰC HÓA NGHIÊN CỨU - PHẦN 2

### 3.3.2 Chức năng quản lý khóa học

#### 3.3.2.1 Mô tả chức năng

Chức năng quản lý khóa học cho phép quản trị viên thực hiện các thao tác CRUD (Create, Read, Update, Delete) đối với khóa học trong hệ thống.

**Các chức năng chính:**

**Xem danh sách khóa học:**
- Hiển thị tất cả khóa học trong hệ thống
- Thông tin bao gồm: mã khóa học, tên, thời gian, giảng viên, trạng thái
- Hỗ trợ phân trang nếu có nhiều khóa học
- Có thể lọc theo trạng thái hoặc giảng viên

**Thêm khóa học mới:**
- Nhập thông tin: tên khóa học, mô tả, thời gian bắt đầu/kết thúc
- Chọn giảng viên phụ trách
- Chọn các kỹ năng đào tạo (Listening, Speaking, Reading, Writing)
- Upload ảnh minh họa cho khóa học
- Thiết lập trạng thái khóa học

**Sửa thông tin khóa học:**
- Cập nhật các thông tin của khóa học
- Thay đổi giảng viên phụ trách
- Cập nhật thời gian và trạng thái

**Xóa khóa học:**
- Xóa khóa học khỏi hệ thống
- Kiểm tra xem có học viên đã đăng ký chưa
- Nếu có học viên, cảnh báo trước khi xóa

#### 3.3.2.2 Sơ đồ hoạt động (Activity Diagram) - Thêm khóa học

```
[Bắt đầu]
    |
    v
[Quản trị viên truy cập trang quản lý khóa học]
    |
    v
[Nhấn nút "Thêm khóa học mới"]
    |
    v
[Hiển thị form nhập thông tin]
    |
    v
[Nhập thông tin khóa học]
    |
    v
[Chọn giảng viên]
    |
    v
[Chọn kỹ năng đào tạo]
    |
    v
[Upload ảnh (tùy chọn)]
    |
    v
[Nhấn nút "Lưu"]
    |
    v
<Validate dữ liệu>
    |
    +--[Không hợp lệ]-->[Hiển thị lỗi]--+
    |                                    |
    |                                    v
    |                            [Quay lại form]
    |
    +--[Hợp lệ]
    |
    v
[Tạo mã khóa học tự động]
    |
    v
[Lưu vào database]
    |
    v
<Lưu thành công?>
    |
    +--[Không]-->[Hiển thị lỗi]
    |
    +--[Có]
    |
    v
[Hiển thị thông báo thành công]
    |
    v
[Chuyển về trang danh sách khóa học]
    |
    v
[Kết thúc]
```

#### 3.3.2.3 Cấu trúc bảng dữ liệu chi tiết

**Bảng Course:**

```sql
CREATE TABLE Course (
    course_id VARCHAR(20) PRIMARY KEY,
    course_name VARCHAR(255) NOT NULL,
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    teacher_id VARCHAR(20),
    image_url VARCHAR(255),
    status BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (teacher_id) REFERENCES Teacher(teacher_id),
    INDEX idx_status (status),
    INDEX idx_teacher (teacher_id),
    INDEX idx_dates (start_date, end_date)
);
```

**Bảng Course_Skills (Quan hệ nhiều-nhiều giữa Course và Skills):**

```sql
CREATE TABLE Course_Skills (
    course_id VARCHAR(20),
    skill_id VARCHAR(20),
    PRIMARY KEY (course_id, skill_id),
    FOREIGN KEY (course_id) REFERENCES Course(course_id) ON DELETE CASCADE,
    FOREIGN KEY (skill_id) REFERENCES Skills(skill_id) ON DELETE CASCADE
);
```

**Ràng buộc toàn vẹn:**
- course_id là khóa chính, không được null
- course_name không được rỗng
- end_date phải lớn hơn start_date
- teacher_id phải tồn tại trong bảng Teacher
- Khi xóa khóa học, tự động xóa các bản ghi liên quan trong Course_Skills

#### 3.3.2.4 Mã nguồn minh họa

**File: models/Course.php**

```php
<?php
class Course {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance()->getConnection();
    }
    
    // Lấy tất cả khóa học
    public function getAll($limit = null, $offset = 0) {
        $sql = "SELECT c.*, t.teacher_name, t.email_teacher,
                GROUP_CONCAT(s.skill_name) as skills
                FROM Course c
                LEFT JOIN Teacher t ON c.teacher_id = t.teacher_id
                LEFT JOIN Course_Skills cs ON c.course_id = cs.course_id
                LEFT JOIN Skills s ON cs.skill_id = s.skill_id
                GROUP BY c.course_id
                ORDER BY c.created_at DESC";
        
        if ($limit) {
            $sql .= " LIMIT ? OFFSET ?";
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("ii", $limit, $offset);
        } else {
            $stmt = $this->db->prepare($sql);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    }
    
    // Lấy khóa học theo ID
    public function getById($course_id) {
        $sql = "SELECT c.*, t.teacher_name
                FROM Course c
                LEFT JOIN Teacher t ON c.teacher_id = t.teacher_id
                WHERE c.course_id = ?";
        
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("s", $course_id);
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_assoc();
    }
    
    // Thêm khóa học mới
    public function create($data) {
        $this->db->begin_transaction();
        
        try {
            // Thêm khóa học
            $sql = "INSERT INTO Course (course_id, course_name, description, 
                    start_date, end_date, teacher_id, image_url, status)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("sssssssi", 
                $data['course_id'],
                $data['course_name'],
                $data['description'],
                $data['start_date'],
                $data['end_date'],
                $data['teacher_id'],
                $data['image_url'],
                $data['status']
            );
            
            $stmt->execute();
            
            // Thêm kỹ năng
            if (!empty($data['skills'])) {
                $this->addSkills($data['course_id'], $data['skills']);
            }
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log($e->getMessage());
            return false;
        }
    }
    
    // Cập nhật khóa học
    public function update($course_id, $data) {
        $this->db->begin_transaction();
        
        try {
            $sql = "UPDATE Course SET 
                    course_name = ?,
                    description = ?,
                    start_date = ?,
                    end_date = ?,
                    teacher_id = ?,
                    image_url = ?,
                    status = ?
                    WHERE course_id = ?";
            
            $stmt = $this->db->prepare($sql);
            $stmt->bind_param("ssssssis",
                $data['course_name'],
                $data['description'],
                $data['start_date'],
                $data['end_date'],
                $data['teacher_id'],
                $data['image_url'],
                $data['status'],
                $course_id
            );
            
            $stmt->execute();
            
            // Cập nhật kỹ năng
            if (isset($data['skills'])) {
                $this->removeAllSkills($course_id);
                $this->addSkills($course_id, $data['skills']);
            }
            
            $this->db->commit();
            return true;
            
        } catch (Exception $e) {
            $this->db->rollback();
            error_log($e->getMessage());
            return false;
        }
    }
    
    // Xóa khóa học
    public function delete($course_id) {
        // Kiểm tra xem có học viên đã đăng ký chưa
        $sql = "SELECT COUNT(*) as count FROM Enrollment WHERE course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("s", $course_id);
        $stmt->execute();
        $result = $stmt->get_result()->fetch_assoc();
        
        if ($result['count'] > 0) {
            return ['success' => false, 'message' => 'Không thể xóa khóa học đã có học viên đăng ký'];
        }
        
        // Xóa khóa học
        $sql = "DELETE FROM Course WHERE course_id = ?";
        $stmt = $this->db->prepare($sql);
        $stmt->bind_param("s", $course_id);
        
        if ($stmt->execute()) {
            return ['success' => true, 'message' => 'Xóa khóa học thành công'];
        } else {
            return ['success' => false, 'message' => 'Có lỗi xảy ra'];
        }
    }
}
```


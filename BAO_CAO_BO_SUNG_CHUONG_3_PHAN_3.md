# BỔ SUNG CHƯƠNG 3: HIỆN THỰC HÓA NGHIÊN CỨU - PHẦN 3

### 3.3.3 Chức năng làm bài kiểm tra trình độ

#### 3.3.3.1 Mô tả chức năng

Chức năng làm bài kiểm tra là một trong những chức năng quan trọng nhất của hệ thống, giúp đánh giá trình độ tiếng Anh của học viên. Hệ thống sử dụng ma trận đề để tạo bài test ngẫu nhiên nhưng vẫn đảm bảo cân đối về nội dung và độ khó.

**Quy trình làm bài test:**

1. **Chọn bài test:**
   - Học viên xem danh sách các bài test có sẵn
   - Mỗi bài test hiển thị thông tin: tên, mô tả, số câu hỏi, thời gian
   - Học viên phải đăng nhập mới được làm bài

2. **Bắt đầu làm bài:**
   - Hệ thống tạo một attempt (lượt làm bài) mới
   - Sinh câu hỏi ngẫu nhiên dựa trên ma trận đề
   - Bắt đầu đếm thời gian
   - Hiển thị câu hỏi lần lượt hoặc tất cả cùng lúc

3. **Trả lời câu hỏi:**
   - Học viên chọn đáp án cho mỗi câu hỏi
   - Có thể bỏ qua và quay lại sau
   - Có thể xem lại các câu đã trả lời
   - Hệ thống tự động lưu đáp án (auto-save)

4. **Nộp bài:**
   - Học viên nhấn nút "Nộp bài"
   - Hệ thống xác nhận trước khi nộp
   - Tính điểm tự động
   - Xác định trình độ dựa trên tổng điểm

5. **Xem kết quả:**
   - Hiển thị tổng điểm
   - Hiển thị trình độ (A1, A2, B1, B2)
   - Hiển thị số câu đúng/sai
   - Có thể xem lại đáp án (tùy cấu hình)

#### 3.3.3.2 Thuật toán sinh câu hỏi từ ma trận đề

**Đầu vào:**
- Ma trận đề (TEST_MATRIX và TEST_MATRIX_DETAIL)
- Ngân hàng câu hỏi (QUESTIONS)

**Đầu ra:**
- Danh sách câu hỏi cho bài test

**Thuật toán:**

```
FUNCTION generateQuestions(matrix_id):
    // Lấy thông tin ma trận
    matrix = getMatrixById(matrix_id)
    matrix_details = getMatrixDetails(matrix_id)
    
    questions = []
    
    // Với mỗi chi tiết trong ma trận
    FOR EACH detail IN matrix_details:
        topic_id = detail.topic_id
        difficulty_id = detail.difficulty_id
        question_count = detail.question_count
        
        // Lấy câu hỏi ngẫu nhiên theo điều kiện
        available_questions = getQuestionsByTopicAndDifficulty(
            topic_id, 
            difficulty_id,
            status = ACTIVE
        )
        
        // Kiểm tra đủ câu hỏi không
        IF available_questions.length < question_count:
            THROW ERROR "Không đủ câu hỏi"
        
        // Chọn ngẫu nhiên
        selected = randomSelect(available_questions, question_count)
        questions.append(selected)
    END FOR
    
    // Trộn câu hỏi
    shuffle(questions)
    
    RETURN questions
END FUNCTION
```

#### 3.3.3.3 Sơ đồ luồng dữ liệu (Data Flow Diagram)

**Level 0 - Context Diagram:**

```
                    +------------------+
                    |                  |
    Học viên ------>|  Hệ thống Test   |-----> Kết quả
                    |                  |
                    +------------------+
                           |
                           v
                    Cơ sở dữ liệu
```

**Level 1 - Detailed DFD:**

```
                    Thông tin đăng nhập
Học viên ----------------------------------------> [1.0 Xác thực]
                                                        |
                                                        | Session
                                                        v
                    Chọn bài test                  [2.0 Chọn test]
Học viên ---------------------------------------->      |
                                                        | Test info
                                                        v
                    Bắt đầu                        [3.0 Tạo attempt]
Học viên ---------------------------------------->      |
                                                        | Attempt ID
                                                        v
                    Câu hỏi                        [4.0 Sinh câu hỏi]
                    <----------------------------------------
                                                        |
                    Đáp án                              | Questions
Học viên ----------------------------------------> [5.0 Lưu đáp án]
                                                        |
                    Nộp bài                             | Answers
Học viên ----------------------------------------> [6.0 Chấm điểm]
                                                        |
                    Kết quả                             | Score
                    <----------------------------------------
                                                        |
                                                        v
                                                   Database
```

#### 3.3.3.4 Mã nguồn minh họa

**File: controllers/TestController.php**

```php
<?php
class TestController {
    private $testModel;
    private $questionModel;
    private $attemptModel;
    
    public function __construct() {
        $this->testModel = new Test();
        $this->questionModel = new Question();
        $this->attemptModel = new TestAttempt();
    }
    
    // Bắt đầu làm bài test
    public function startTest($test_id) {
        // Kiểm tra đăng nhập
        if (!isset($_SESSION['user_id'])) {
            header('Location: /login');
            exit();
        }
        
        $user_id = $_SESSION['user_id'];
        
        // Lấy thông tin test
        $test = $this->testModel->getById($test_id);
        if (!$test) {
            $_SESSION['error'] = 'Bài test không tồn tại';
            header('Location: /tests');
            exit();
        }
        
        // Tạo attempt mới
        $attempt_id = $this->generateAttemptId();
        $attempt_data = [
            'attempt_id' => $attempt_id,
            'test_id' => $test_id,
            'user_id' => $user_id,
            'started_at' => date('Y-m-d H:i:s'),
            'status' => 'IN_PROGRESS'
        ];
        
        if (!$this->attemptModel->create($attempt_data)) {
            $_SESSION['error'] = 'Không thể bắt đầu bài test';
            header('Location: /tests');
            exit();
        }
        
        // Sinh câu hỏi từ ma trận
        $matrix_id = $test['matrix_id'];
        $questions = $this->generateQuestions($matrix_id);
        
        if (empty($questions)) {
            $_SESSION['error'] = 'Không thể tạo câu hỏi cho bài test';
            header('Location: /tests');
            exit();
        }
        
        // Lưu câu hỏi vào attempt
        $this->attemptModel->saveQuestions($attempt_id, $questions);
        
        // Lưu attempt_id vào session
        $_SESSION['current_attempt'] = $attempt_id;
        
        // Chuyển đến trang làm bài
        header("Location: /test/do/$attempt_id");
        exit();
    }
    
    // Sinh câu hỏi từ ma trận đề
    private function generateQuestions($matrix_id) {
        $questions = [];
        
        // Lấy chi tiết ma trận
        $matrix_details = $this->testModel->getMatrixDetails($matrix_id);
        
        foreach ($matrix_details as $detail) {
            $topic_id = $detail['topic_id'];
            $difficulty_id = $detail['difficulty_id'];
            $question_count = $detail['question_count'];
            
            // Lấy câu hỏi theo topic và difficulty
            $available = $this->questionModel->getByTopicAndDifficulty(
                $topic_id,
                $difficulty_id,
                true // chỉ lấy câu hỏi active
            );
            
            // Kiểm tra đủ câu hỏi không
            if (count($available) < $question_count) {
                error_log("Không đủ câu hỏi cho topic $topic_id, difficulty $difficulty_id");
                return [];
            }
            
            // Chọn ngẫu nhiên
            shuffle($available);
            $selected = array_slice($available, 0, $question_count);
            $questions = array_merge($questions, $selected);
        }
        
        // Trộn tất cả câu hỏi
        shuffle($questions);
        
        return $questions;
    }
    
    // Lưu đáp án
    public function saveAnswer() {
        if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
            http_response_code(405);
            echo json_encode(['error' => 'Method not allowed']);
            exit();
        }
        
        $attempt_id = $_POST['attempt_id'] ?? '';
        $question_id = $_POST['question_id'] ?? '';
        $selected_answer = $_POST['selected_answer'] ?? '';
        
        // Validate
        if (empty($attempt_id) || empty($question_id)) {
            echo json_encode(['success' => false, 'message' => 'Thiếu thông tin']);
            exit();
        }
        
        // Kiểm tra quyền
        $attempt = $this->attemptModel->getById($attempt_id);
        if ($attempt['user_id'] !== $_SESSION['user_id']) {
            echo json_encode(['success' => false, 'message' => 'Không có quyền']);
            exit();
        }
        
        // Lưu đáp án
        $result = $this->attemptModel->saveAnswer($attempt_id, $question_id, $selected_answer);
        
        echo json_encode(['success' => $result]);
        exit();
    }
    
    // Nộp bài và chấm điểm
    public function submitTest($attempt_id) {
        // Kiểm tra quyền
        $attempt = $this->attemptModel->getById($attempt_id);
        if ($attempt['user_id'] !== $_SESSION['user_id']) {
            $_SESSION['error'] = 'Không có quyền';
            header('Location: /tests');
            exit();
        }
        
        // Cập nhật trạng thái
        $this->attemptModel->updateStatus($attempt_id, 'COMPLETED');
        $this->attemptModel->updateCompletedTime($attempt_id);
        
        // Chấm điểm
        $score = $this->calculateScore($attempt_id);
        
        // Xác định trình độ
        $level = $this->determineLevel($score);
        
        // Lưu kết quả
        $result_data = [
            'result_id' => $this->generateResultId(),
            'attempt_id' => $attempt_id,
            'user_id' => $_SESSION['user_id'],
            'test_id' => $attempt['test_id'],
            'total_questions' => $this->attemptModel->countQuestions($attempt_id),
            'correct_answers' => $this->attemptModel->countCorrectAnswers($attempt_id),
            'score' => $score,
            'level_id' => $level['level_id'],
            'date_test' => date('Y-m-d H:i:s')
        ];
        
        $this->attemptModel->saveResult($result_data);
        
        // Xóa session
        unset($_SESSION['current_attempt']);
        
        // Chuyển đến trang kết quả
        header("Location: /test/result/$attempt_id");
        exit();
    }
    
    // Tính điểm
    private function calculateScore($attempt_id) {
        $answers = $this->attemptModel->getAnswers($attempt_id);
        $total_score = 0;
        
        foreach ($answers as $answer) {
            if ($answer['is_correct']) {
                $total_score += $answer['question_score'];
            }
        }
        
        return $total_score;
    }
    
    // Xác định trình độ
    private function determineLevel($score) {
        $levels = $this->testModel->getAllLevels();
        
        foreach ($levels as $level) {
            if ($score >= $level['min_score'] && $score <= $level['max_score']) {
                return $level;
            }
        }
        
        return $levels[0]; // Trả về level thấp nhất nếu không tìm thấy
    }
}
```


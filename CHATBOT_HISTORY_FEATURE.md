# Tính năng Lịch sử Chat riêng cho mỗi User

## Mô tả
Tính năng này cho phép mỗi user có lịch sử chatbot riêng, với khả năng:
- Xem lịch sử các cuộc hội thoại đã có
- Tạo cuộc hội thoại mới
- Xóa cuộc hội thoại
- Yêu cầu đăng nhập khi muốn xem lịch sử hoặc tạo mới

## Cách sử dụng

### Trên giao diện Chatbot
1. **Nút Lịch sử (🕐)**: Click để xem danh sách các cuộc hội thoại đã có
2. **Nút Tạo mới (+)**: Click để tạo cuộc hội thoại mới
3. **Nút Đóng (×)**: Đóng cửa sổ chat

### Yêu cầu đăng nhập
- Nếu chưa đăng nhập, khi click vào nút Lịch sử hoặc Tạo mới, hệ thống sẽ hiển thị modal yêu cầu đăng nhập
- User có thể chat mà không cần đăng nhập, nhưng lịch sử sẽ không được lưu

## Cấu trúc Database

### Bảng `cuoc_hoi_thoai_chatbot`
```sql
CREATE TABLE cuoc_hoi_thoai_chatbot (
    ma_cuoc_hoi_thoai INT AUTO_INCREMENT PRIMARY KEY,
    ma_tai_khoan INT NOT NULL,
    tieu_de VARCHAR(255) DEFAULT 'Cuộc hội thoại mới',
    ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP,
    ngay_cap_nhat DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    trang_thai ENUM('hoat_dong', 'da_xoa') DEFAULT 'hoat_dong',
    FOREIGN KEY (ma_tai_khoan) REFERENCES tai_khoan(ma_tai_khoan)
);
```

### Bảng `lich_su_chatbot` (đã cập nhật)
- Thêm cột `ma_cuoc_hoi_thoai` để liên kết với cuộc hội thoại

## API Endpoints

### GET /api/chatbot/conversations
- Lấy danh sách cuộc hội thoại của user
- Yêu cầu: Token xác thực

### POST /api/chatbot/conversations
- Tạo cuộc hội thoại mới
- Body: `{ tieu_de: "Tiêu đề" }`
- Yêu cầu: Token xác thực

### DELETE /api/chatbot/conversations/:id
- Xóa cuộc hội thoại (soft delete)
- Yêu cầu: Token xác thực

### GET /api/chatbot/conversations/:id/messages
- Lấy tin nhắn của một cuộc hội thoại
- Yêu cầu: Token xác thực

### POST /api/chatbot/send
- Gửi tin nhắn
- Body: `{ message, history, conversationId }`
- Token xác thực: Tùy chọn (nếu có sẽ lưu lịch sử)

## Cài đặt

### 1. Chạy migration database
```bash
cd backend
node scripts/migrate-chat-conversations.js
```

### 2. Khởi động server
```bash
cd backend
node server.js
```

## Files đã thay đổi
- `backend/routes/chatbot.js` - API endpoints mới
- `frontend/js/main.js` - Logic chatbot frontend
- `frontend/index.html` - UI chatbot với các nút mới
- `backend/scripts/create-chat-conversations.sql` - SQL script
- `backend/scripts/migrate-chat-conversations.js` - Migration script

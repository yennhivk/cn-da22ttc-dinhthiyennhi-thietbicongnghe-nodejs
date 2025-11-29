// ==========================================
// QUẢN LÝ XÁC THỰC NGƯỜI DÙNG
// ==========================================

const API_URL = 'http://localhost:3300/api';

// Lấy thông tin user từ localStorage
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Lấy token
function getToken() {
    return localStorage.getItem('token');
}

// Kiểm tra đã đăng nhập chưa
function isLoggedIn() {
    return !!getToken();
}

// Đăng xuất
async function logout() {
    try {
        const token = getToken();
        
        if (token) {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
        }
        
        // Xóa thông tin local
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Chuyển về trang chủ
        window.location.href = '/frontend/index.html';
        
    } catch (error) {
        console.error('Lỗi đăng xuất:', error);
        // Vẫn xóa thông tin local dù có lỗi
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/frontend/index.html';
    }
}

// Cập nhật UI dựa trên trạng thái đăng nhập
function updateAuthUI() {
    const user = getCurrentUser();
    const authButtons = document.getElementById('authButtons');
    
    if (!authButtons) return;
    
    if (user) {
        authButtons.innerHTML = `
            <span style="margin-right: 15px; color: #333;">
                Xin chào, <strong>${user.ten_dang_nhap}</strong>
            </span>
            <button onclick="logout()" class="btn-logout" style="
                padding: 8px 16px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 5px;
                cursor: pointer;
            ">
                Đăng xuất
            </button>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="/frontend/pages/login.html" class="btn-login" style="
                padding: 8px 16px;
                background: #007bff;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                margin-right: 10px;
            ">
                Đăng nhập
            </a>
            <a href="/frontend/pages/register.html" class="btn-register" style="
                padding: 8px 16px;
                background: #28a745;
                color: white;
                text-decoration: none;
                border-radius: 5px;
            ">
                Đăng ký
            </a>
        `;
    }
}

// Kiểm tra quyền admin
function isAdmin() {
    const user = getCurrentUser();
    return user && user.vai_tro === 'admin';
}

// Yêu cầu đăng nhập (redirect nếu chưa đăng nhập)
function requireLogin() {
    if (!isLoggedIn()) {
        alert('Vui lòng đăng nhập để tiếp tục');
        window.location.href = '/frontend/pages/login.html';
        return false;
    }
    return true;
}

// Yêu cầu quyền admin
function requireAdmin() {
    if (!isAdmin()) {
        alert('Bạn không có quyền truy cập trang này');
        window.location.href = '/frontend/index.html';
        return false;
    }
    return true;
}

// Gọi API với token
async function fetchWithAuth(url, options = {}) {
    const token = getToken();
    
    if (!token) {
        throw new Error('Chưa đăng nhập');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
    };
    
    const response = await fetch(url, {
        ...options,
        headers
    });
    
    // Nếu token hết hạn, đăng xuất
    if (response.status === 401 || response.status === 403) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/frontend/pages/login.html';
        throw new Error('Phiên đăng nhập đã hết hạn');
    }
    
    return response;
}

// Khởi tạo khi trang load
document.addEventListener('DOMContentLoaded', () => {
    updateAuthUI();
});

// ==========================================
// AUTH UI - Quản lý hiển thị đăng nhập/đăng xuất
// ==========================================

// Chỉ khai báo nếu chưa tồn tại
if (typeof AUTH_API_URL === 'undefined') {
    var AUTH_API_URL = 'http://localhost:3300/api';
}

// Khởi tạo Auth UI khi trang load
document.addEventListener('DOMContentLoaded', function() {
    initAuthUI();
});

function initAuthUI() {
    const user = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');
    
    // Tìm container user account trong navbar
    const userAccountContainer = document.querySelector('.user-account-container');
    if (!userAccountContainer) return;
    
    if (user && token) {
        // Đã đăng nhập - hiển thị dropdown user
        const avatarSrc = user.hinh_anh ? 
            (user.hinh_anh.startsWith('http') ? user.hinh_anh : AUTH_API_URL.replace('/api', '') + user.hinh_anh) 
            : '';
        
        userAccountContainer.innerHTML = `
            <div class="relative group">
                <button class="flex items-center gap-2 text-black hover:text-red-600 transition cursor-pointer">
                    <div class="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center border-2 border-orange-300 overflow-hidden">
                        ${avatarSrc ? 
                            `<img src="${avatarSrc}" class="w-full h-full object-cover" alt="Avatar" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';">
                             <svg class="w-5 h-5 text-orange-600" style="display:none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                             </svg>` :
                            `<svg class="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                             </svg>`
                        }
                    </div>
                    <span class="text-lg font-semibold text-red-600">${user.ten_dang_nhap || user.ho_ten || 'User'}</span>
                    <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
                
                <!-- Dropdown Menu -->
                <div class="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                    <div class="p-4 border-b border-gray-100">
                        <p class="font-bold text-gray-800 text-lg">${user.ten_dang_nhap || user.ho_ten || 'User'}</p>
                        <p class="text-gray-500 text-sm">${user.email || ''}</p>
                    </div>
                    <div class="py-2">
                        <a href="${getBasePath()}account.html" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span class="text-gray-700 font-medium">Tài khoản của tôi</span>
                        </a>
                        <a href="${getBasePath()}order-history.html" class="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition">
                            <svg class="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                            </svg>
                            <span class="text-gray-700 font-medium">Đơn hàng của tôi</span>
                        </a>
                        <button onclick="handleLogoutGlobal()" class="flex items-center gap-3 px-4 py-3 hover:bg-red-50 transition w-full text-left">
                            <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                            <span class="text-red-500 font-medium">Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Chưa đăng nhập - hiển thị nút đăng nhập
        userAccountContainer.innerHTML = `
            <a href="${getBasePath()}login.html" class="flex items-center gap-2 text-black hover:text-red-600 transition">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span class="text-lg font-semibold">Đăng nhập</span>
            </a>
        `;
    }
}

// Xác định base path dựa trên vị trí file hiện tại
function getBasePath() {
    const path = window.location.pathname;
    // Nếu đang ở trong thư mục /pages/, không cần thêm gì (cùng cấp)
    // Nếu ở ngoài (index.html), cần thêm pages/
    if (path.includes('/pages/')) {
        return '';
    }
    return 'pages/';
}

// Hàm đăng xuất global
function handleLogoutGlobal() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Đăng xuất thành công!');
    const path = window.location.pathname;
    window.location.href = path.includes('/pages/') ? '../index.html' : 'index.html';
}

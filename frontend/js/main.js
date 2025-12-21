/**
 * Global Functions - Yến Nhi Mobile
 * Các hàm JavaScript dùng chung cho toàn bộ website
 */

// Toggle Mobile Menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.getElementById('menuIcon');
    const closeIcon = document.getElementById('closeIcon');
    
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
        if (menuIcon) menuIcon.classList.toggle('hidden');
        if (closeIcon) closeIcon.classList.toggle('hidden');
    }
}

// Handle Search (Desktop)
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    if (searchInput && searchInput.value.trim()) {
        const searchQuery = encodeURIComponent(searchInput.value.trim());
        window.location.href = `pages/products.html?search=${searchQuery}`;
    }
}

// Handle Search (Mobile)
function handleMobileSearch() {
    const searchInput = document.getElementById('mobileSearchInput');
    if (searchInput && searchInput.value.trim()) {
        const searchQuery = encodeURIComponent(searchInput.value.trim());
        window.location.href = `pages/products.html?search=${searchQuery}`;
    }
}

// Navigate to Home
function navigateToHome() {
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pages/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Add Enter key support for search
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleMobileSearch();
            }
        });
    }
});

// Shopping Cart Functions (dùng cho index.html - trang chủ)
// Lưu ý: Trang products.html và product-detail.html có hàm addToCart riêng trong products.js/product-detail.js
// Hàm này chỉ được gọi khi các file JS khác không định nghĩa addToCart

// Kiểm tra xem đang ở trang nào để quyết định có định nghĩa addToCart hay không
(function() {
    // Nếu đang ở trang products hoặc product-detail, không định nghĩa addToCart
    // vì các trang đó đã có hàm riêng trong products.js hoặc product-detail.js
    const isProductPage = window.location.pathname.includes('products.html') || 
                          window.location.pathname.includes('product-detail.html');
    
    if (isProductPage) {
        console.log('main.js: Đang ở trang sản phẩm, bỏ qua định nghĩa addToCart');
        return;
    }
    
    // Định nghĩa addToCart cho trang chủ và các trang khác
    window.addToCart = function(product) {
        // Kiểm tra đăng nhập
        if (!localStorage.getItem('token')) {
            showLoginRequiredModal();
            return;
        }
        
        // Lấy cart key theo user
        const user = JSON.parse(localStorage.getItem('user'));
        const cartKey = user ? `cart_${user.ma_tai_khoan}` : 'cart_guest';
        let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        
        // Xử lý nhiều kiểu tham số
        let productData;
        if (typeof product === 'object' && product !== null) {
            productData = product;
        } else if (typeof product === 'number') {
            // Nếu là ID, tạo object cơ bản
            productData = { id: product, name: 'Sản phẩm #' + product, price: 0 };
        } else if (typeof product === 'string') {
            // Nếu là tên sản phẩm
            productData = { id: Date.now(), name: product, price: 0 };
        } else {
            console.error('addToCart: Tham số không hợp lệ', product);
            return;
        }
        
        const existingItem = cart.find(item => item.id === productData.id || item.ma_san_pham === productData.id);
        
        if (existingItem) {
            existingItem.quantity = (existingItem.quantity || existingItem.so_luong || 0) + 1;
            existingItem.so_luong = existingItem.quantity;
        } else {
            cart.push({
                id: productData.id,
                ma_san_pham: productData.id,
                name: productData.name,
                ten_san_pham: productData.name,
                price: productData.price,
                gia: productData.price,
                image: productData.image,
                anh_chinh: productData.image,
                quantity: 1,
                so_luong: 1
            });
        }
        
        localStorage.setItem(cartKey, JSON.stringify(cart));
        updateCartBadgeGlobal();
        showToast('Đã thêm vào giỏ hàng!', 'success');
    };
})();

// Cập nhật cart badge (global)
function updateCartBadgeGlobal() {
    const user = JSON.parse(localStorage.getItem('user'));
    const cartKey = user ? `cart_${user.ma_tai_khoan}` : 'cart_guest';
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.quantity) || parseInt(item.so_luong) || 0), 0);
    
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = totalItems || 0;
    });
}

// Hiển thị modal yêu cầu đăng nhập (dùng cho index.html)
function showLoginRequiredModal() {
    // Xóa modal cũ nếu có
    const existingModal = document.getElementById('loginRequiredModalMain');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4';
    modal.id = 'loginRequiredModalMain';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onclick="event.stopPropagation()">
            <div class="text-center">
                <svg class="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Yêu cầu đăng nhập</h3>
                <p class="text-gray-600 mb-6">Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng</p>
                <div class="flex gap-3">
                    <button id="closeLoginModalMainBtn" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition">
                        Để sau
                    </button>
                    <a href="pages/login.html" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center inline-flex items-center justify-center">
                        Đăng nhập
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Thêm event listener cho nút đóng
    document.getElementById('closeLoginModalMainBtn').addEventListener('click', function() {
        modal.remove();
    });
    
    // Đóng modal khi click bên ngoài
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Đóng modal đăng nhập (main.js) - giữ lại để tương thích
function closeLoginModalMain() {
    const modal = document.getElementById('loginRequiredModalMain');
    if (modal) modal.remove();
}

// Chuyển đến trang đăng nhập (main.js - từ index.html) - giữ lại để tương thích
function goToLoginPageMain() {
    window.location.href = 'pages/login.html';
}

function removeFromCartGlobal(productId) {
    const user = JSON.parse(localStorage.getItem('user'));
    const cartKey = user ? `cart_${user.ma_tai_khoan}` : 'cart_guest';
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    cart = cart.filter(item => (item.id !== productId && item.ma_san_pham !== productId));
    localStorage.setItem(cartKey, JSON.stringify(cart));
    updateCartBadgeGlobal();
    showToast('Đã xóa khỏi giỏ hàng!', 'info');
}

function clearCartGlobal() {
    const user = JSON.parse(localStorage.getItem('user'));
    const cartKey = user ? `cart_${user.ma_tai_khoan}` : 'cart_guest';
    localStorage.setItem(cartKey, '[]');
    updateCartBadgeGlobal();
    showToast('Giỏ hàng đã được xóa!', 'info');
}

function getCartGlobal() {
    const user = JSON.parse(localStorage.getItem('user'));
    const cartKey = user ? `cart_${user.ma_tai_khoan}` : 'cart_guest';
    return JSON.parse(localStorage.getItem(cartKey) || '[]');
}

function getCartTotalGlobal() {
    const cart = getCartGlobal();
    return cart.reduce((total, item) => total + ((item.price || item.gia || 0) * (item.quantity || item.so_luong || 0)), 0);
}

// Toast Notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'toast';
    
    const bgColor = {
        success: 'bg-green-500',
        error: 'bg-red-500',
        info: 'bg-blue-500',
        warning: 'bg-yellow-500'
    }[type] || 'bg-gray-500';
    
    toast.innerHTML = `
        <div class="flex items-center gap-3 ${bgColor} text-white px-4 py-3 rounded-lg shadow-lg">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
            <span class="font-semibold">${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Loading Spinner
function showLoading() {
    const loading = document.createElement('div');
    loading.id = 'loading-overlay';
    loading.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    loading.innerHTML = '<div class="spinner"></div>';
    document.body.appendChild(loading);
}

function hideLoading() {
    const loading = document.getElementById('loading-overlay');
    if (loading) {
        loading.remove();
    }
}

// Format Currency (VND)
function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Format Date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Validate Email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate Phone (Vietnam)
function validatePhone(phone) {
    const re = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    return re.test(phone);
}

// User Authentication - Sử dụng token và user từ localStorage
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    showToast('Đã đăng xuất!', 'info');
    
    // Xác định đường dẫn đúng dựa trên vị trí hiện tại
    const currentPath = window.location.pathname;
    if (currentPath.includes('/pages/')) {
        window.location.href = '../index.html';
    } else {
        window.location.href = 'index.html';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Cập nhật cart badge cho tất cả các trang
    updateCartBadgeGlobal();
    
    // Check if user is logged in and update UI
    if (isLoggedIn()) {
        const user = getCurrentUser();
        const loginButtons = document.querySelectorAll('[href*="login.html"]');
        loginButtons.forEach(btn => {
            if (btn.textContent.includes('Đăng nhập')) {
                btn.textContent = user.name || user.ten_dang_nhap || 'Tài khoản';
                btn.href = 'pages/profile.html';
            }
        });
    }
});

// Scroll to top
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Add scroll to top button
window.addEventListener('scroll', function() {
    const scrollBtn = document.getElementById('scrollTopBtn');
    if (scrollBtn) {
        if (window.pageYOffset > 300) {
            scrollBtn.classList.remove('hidden');
        } else {
            scrollBtn.classList.add('hidden');
        }
    }
});

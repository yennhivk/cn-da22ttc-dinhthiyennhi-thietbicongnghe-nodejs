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

// Chatbot Functions
let chatbotOpen = false;
let chatHistory = [];
let currentConversationId = null;
const CHATBOT_API = 'http://127.0.0.1:3300/api/chatbot';

function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    if (chatbotWindow) {
        chatbotOpen = !chatbotOpen;
        chatbotWindow.classList.toggle('active');
    }
}

// Lấy token từ localStorage
function getAuthToken() {
    return localStorage.getItem('token');
}

// Hiển thị modal yêu cầu đăng nhập
function showLoginRequiredModal() {
    const modal = document.createElement('div');
    modal.id = 'loginRequiredModal';
    modal.className = 'fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-sm mx-4 shadow-2xl">
            <div class="text-center">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                </div>
                <h3 class="text-lg font-bold text-gray-800 mb-2">Yêu cầu đăng nhập</h3>
                <p class="text-gray-600 mb-6">Vui lòng đăng nhập để xem và lưu lịch sử chat của bạn.</p>
                <div class="flex gap-3 justify-center">
                    <button onclick="closeLoginRequiredModal()" class="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition">Đóng</button>
                    <a href="pages/login.html" class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">Đăng nhập</a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
}

function closeLoginRequiredModal() {
    const modal = document.getElementById('loginRequiredModal');
    if (modal) modal.remove();
}

// Hiển thị lịch sử các cuộc hội thoại
async function showChatHistory() {
    const token = getAuthToken();
    if (!token) {
        showLoginRequiredModal();
        return;
    }

    try {
        // Sử dụng API /history đơn giản hơn
        const response = await fetch(`${CHATBOT_API}/history`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            if (response.status === 401) {
                showLoginRequiredModal();
                return;
            }
            alert('Có lỗi xảy ra: ' + (data.message || 'Unknown'));
            return;
        }

        // Hiển thị lịch sử chat đơn giản
        showSimpleHistory(data.history);

    } catch (error) {
        console.error('Error fetching history:', error);
        // Hiển thị lịch sử local nếu không lấy được từ server
        showLocalHistory();
    }
}

// Hiển thị lịch sử chat đơn giản
function showSimpleHistory(history) {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;

    let html = `
        <div class="p-2">
            <div class="flex items-center justify-between mb-4">
                <h4 class="font-bold text-gray-800 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Lịch sử chat
                </h4>
                <button onclick="backToChatView()" class="text-blue-600 text-sm hover:underline">← Quay lại</button>
            </div>
    `;

    if (!history || history.length === 0) {
        html += `
            <div class="text-center text-gray-500 py-8">
                <svg class="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <p>Chưa có lịch sử chat</p>
            </div>
        `;
    } else {
        html += `<div class="space-y-3 max-h-[300px] overflow-y-auto">`;
        history.slice(0, 20).forEach(item => {
            const date = new Date(item.timestamp).toLocaleDateString('vi-VN');
            const time = new Date(item.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
            html += `
                <div class="bg-gray-50 rounded-lg p-3">
                    <div class="text-xs text-gray-400 mb-2">${date} ${time}</div>
                    <div class="text-sm text-gray-800 mb-1"><strong>Bạn:</strong> ${escapeHtml(item.question)}</div>
                    <div class="text-sm text-blue-600"><strong>Bot:</strong> ${escapeHtml(item.answer?.substring(0, 100) || '')}...</div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    messagesArea.innerHTML = html;
}

// Hiển thị lịch sử local (từ session hiện tại)
function showLocalHistory() {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;

    let html = `
        <div class="p-2">
            <div class="flex items-center justify-between mb-4">
                <h4 class="font-bold text-gray-800 flex items-center gap-2">
                    <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Lịch sử chat (phiên hiện tại)
                </h4>
                <button onclick="backToChatView()" class="text-blue-600 text-sm hover:underline">← Quay lại</button>
            </div>
    `;

    if (chatHistory.length === 0) {
        html += `
            <div class="text-center text-gray-500 py-8">
                <p>Chưa có tin nhắn nào trong phiên này</p>
            </div>
        `;
    } else {
        html += `<div class="space-y-2 max-h-[300px] overflow-y-auto">`;
        chatHistory.forEach(item => {
            html += `
                <div class="bg-gray-50 rounded-lg p-2 text-sm">
                    <div class="${item.role === 'user' ? 'text-gray-800' : 'text-blue-600'}">
                        <strong>${item.role === 'user' ? 'Bạn' : 'Bot'}:</strong> ${escapeHtml(item.content?.substring(0, 80) || '')}...
                    </div>
                </div>
            `;
        });
        html += `</div>`;
    }

    html += `</div>`;
    messagesArea.innerHTML = html;
}

// Tải cuộc hội thoại cụ thể
async function loadConversation(conversationId) {
    const token = getAuthToken();
    if (!token) {
        showLoginRequiredModal();
        return;
    }

    try {
        const response = await fetch(`${CHATBOT_API}/conversations/${conversationId}/messages`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!data.success) {
            alert('Có lỗi xảy ra: ' + data.message);
            return;
        }

        // Cập nhật conversationId hiện tại
        currentConversationId = conversationId;
        
        // Xóa lịch sử chat local và thay thế bằng lịch sử từ server
        chatHistory = [];
        
        // Hiển thị tin nhắn
        displayConversationMessages(data.messages);

    } catch (error) {
        console.error('Error loading conversation:', error);
        alert('Không thể tải cuộc hội thoại!');
    }
}

// Hiển thị tin nhắn của cuộc hội thoại
function displayConversationMessages(messages) {
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;

    let html = '';
    
    messages.forEach(msg => {
        const time = new Date(msg.timestamp).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
        
        // User message
        html += `
            <div class="flex justify-end mb-3">
                <div class="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[80%]">
                    <p class="text-sm">${escapeHtml(msg.question)}</p>
                    <span class="text-xs text-blue-200 mt-1 block">${time}</span>
                </div>
            </div>
        `;
        
        // Bot reply
        html += `
            <div class="flex justify-start mb-3">
                <div class="flex gap-2 max-w-[80%]">
                    <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                    <div class="bg-white shadow-md px-4 py-2 rounded-2xl rounded-tl-none">
                        <p class="text-sm text-gray-800 whitespace-pre-wrap">${escapeHtml(msg.answer)}</p>
                        <span class="text-xs text-gray-400 mt-1 block">${time}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Thêm vào chatHistory để duy trì context
        chatHistory.push({ role: 'user', content: msg.question });
        chatHistory.push({ role: 'assistant', content: msg.answer });
    });

    messagesArea.innerHTML = html;
    messagesArea.scrollTop = messagesArea.scrollHeight;
}

// Quay lại giao diện chat chính
function backToChatView() {
    currentConversationId = null;
    chatHistory = [];
    
    const messagesArea = document.getElementById('chatMessages');
    if (!messagesArea) return;

    messagesArea.innerHTML = `
        <!-- Bot Message -->
        <div class="flex justify-start mb-4">
            <div class="flex gap-2 max-w-[80%]">
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>
                <div class="bg-white shadow-md px-4 py-2 rounded-2xl rounded-tl-none">
                    <p class="text-sm text-gray-800">Xin chào! Chúng tôi có thể giúp gì cho bạn? 😊</p>
                    <span class="text-xs text-gray-400 mt-1 block">Vừa xong</span>
                </div>
            </div>
        </div>
        
        <!-- Quick Reply Options -->
        <div class="flex flex-wrap gap-2 mb-4">
            <button onclick="quickChat('Tư vấn sản phẩm')" class="bg-blue-100 text-blue-700 text-xs px-3 py-2 rounded-full hover:bg-blue-200 transition">📱 Tư vấn sản phẩm</button>
            <button onclick="quickChat('Khuyến mãi')" class="bg-blue-100 text-blue-700 text-xs px-3 py-2 rounded-full hover:bg-blue-200 transition">💰 Khuyến mãi</button>
            <button onclick="quickChat('Giao hàng')" class="bg-blue-100 text-blue-700 text-xs px-3 py-2 rounded-full hover:bg-blue-200 transition">🚚 Giao hàng</button>
        </div>
    `;
}

// Tạo cuộc hội thoại mới - đơn giản chỉ reset chat
function createNewConversation() {
    console.log('🔵 createNewConversation called');
    
    // Reset chat history local
    chatHistory = [];
    currentConversationId = null;
    
    // Reset giao diện chat
    backToChatView();
    
    // Thông báo
    const messagesArea = document.getElementById('chatMessages');
    if (messagesArea) {
        // Thêm tin nhắn chào mừng
        messagesArea.innerHTML = `
            <div class="flex items-start gap-3 mb-4">
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                </div>
                <div class="bg-gray-100 rounded-2xl rounded-tl-none px-4 py-3 max-w-[85%]">
                    <p class="text-gray-800 text-sm">Xin chào! 👋 Đây là cuộc hội thoại mới. Tôi có thể giúp gì cho bạn?</p>
                    <span class="text-xs text-gray-400 mt-1 block">Vừa xong</span>
                </div>
            </div>
        `;
    }
    
    console.log('✅ Đã tạo cuộc hội thoại mới');
}

// Xóa cuộc hội thoại
async function deleteConversation(conversationId) {
    if (!confirm('Bạn có chắc muốn xóa cuộc hội thoại này?')) return;

    const token = getAuthToken();
    if (!token) {
        showLoginRequiredModal();
        return;
    }

    try {
        const response = await fetch(`${CHATBOT_API}/conversations/${conversationId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (data.success) {
            // Nếu đang xóa cuộc hội thoại hiện tại
            if (currentConversationId === conversationId) {
                currentConversationId = null;
                chatHistory = [];
            }
            // Refresh danh sách
            showChatHistory();
        } else {
            alert('Có lỗi xảy ra: ' + data.message);
        }

    } catch (error) {
        console.error('Error deleting conversation:', error);
        alert('Không thể xóa cuộc hội thoại!');
    }
}

// Quick chat với các lựa chọn nhanh
function quickChat(message) {
    const input = document.getElementById('chatInput');
    if (input) {
        input.value = message;
        sendChatMessage();
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    
    if (input && input.value.trim() && messages) {
        const userMessage = input.value.trim();
        
        // Add user message to UI
        const userDiv = document.createElement('div');
        userDiv.className = 'flex justify-end mb-3';
        userDiv.innerHTML = `
            <div class="bg-blue-600 text-white px-4 py-2 rounded-2xl rounded-br-none max-w-[80%]">
                <p class="text-sm">${escapeHtml(userMessage)}</p>
                <span class="text-xs text-blue-200 mt-1 block">${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
        `;
        messages.appendChild(userDiv);
        
        input.value = '';
        messages.scrollTop = messages.scrollHeight;

        // Add loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'flex justify-start mb-3';
        loadingDiv.id = 'chatLoading';
        loadingDiv.innerHTML = `
            <div class="flex gap-2 max-w-[80%]">
                <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                    </svg>
                </div>
                <div class="bg-white shadow-md px-4 py-2 rounded-2xl rounded-tl-none">
                    <div class="flex items-center gap-1">
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0ms"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 150ms"></div>
                        <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 300ms"></div>
                    </div>
                </div>
            </div>
        `;
        messages.appendChild(loadingDiv);
        messages.scrollTop = messages.scrollHeight;

        // Add to history
        chatHistory.push({ role: 'user', content: userMessage });

        try {
            // Chuẩn bị headers với token nếu có
            const headers = {
                'Content-Type': 'application/json'
            };
            const token = getAuthToken();
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            // Call AI API
            const response = await fetch(`${CHATBOT_API}/send`, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({
                    message: userMessage,
                    history: chatHistory.slice(-10), // Keep last 10 messages for context
                    conversationId: currentConversationId
                })
            });

            const data = await response.json();

            // Remove loading indicator
            const loading = document.getElementById('chatLoading');
            if (loading) loading.remove();

            // Add bot response
            const botReply = data.success ? data.reply : 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại sau!';
            const images = data.images || [];
            
            // Tạo HTML cho hình ảnh sản phẩm
            let imagesHtml = '';
            if (images.length > 0) {
                imagesHtml = `
                    <div class="flex gap-2 mt-3 overflow-x-auto pb-2">
                        ${images.map(img => `
                            <div class="flex-shrink-0 bg-gray-50 rounded-lg p-2 text-center cursor-pointer hover:bg-gray-100 transition" style="width: 100px;">
                                <img src="${img.url}" alt="${img.name}" class="w-16 h-16 object-cover rounded-lg mx-auto mb-1" onerror="this.src='https://via.placeholder.com/64?text=SP'">
                                <p class="text-xs text-gray-700 font-medium truncate">${escapeHtml(img.name)}</p>
                                <p class="text-xs text-red-600 font-bold">${img.price}</p>
                            </div>
                        `).join('')}
                    </div>
                `;
            }
            
            const botDiv = document.createElement('div');
            botDiv.className = 'flex justify-start mb-3';
            botDiv.innerHTML = `
                <div class="flex gap-2 max-w-[85%]">
                    <img src="images/Screenshot 2025-11-10 154306.png" alt="Logo" class="w-8 h-8 rounded-full object-cover flex-shrink-0 border border-gray-200">
                    <div class="bg-white shadow-md px-4 py-2 rounded-2xl rounded-tl-none">
                        <p class="text-sm text-gray-800 whitespace-pre-wrap">${escapeHtml(botReply)}</p>
                        ${imagesHtml}
                        <span class="text-xs text-gray-400 mt-1 block">${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            `;
            messages.appendChild(botDiv);
            messages.scrollTop = messages.scrollHeight;

            // Add to history
            chatHistory.push({ role: 'assistant', content: botReply });

        } catch (error) {
            console.error('Chatbot error:', error);
            
            // Remove loading indicator
            const loading = document.getElementById('chatLoading');
            if (loading) loading.remove();

            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'flex justify-start mb-3';
            errorDiv.innerHTML = `
                <div class="flex gap-2 max-w-[80%]">
                    <div class="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z"/>
                        </svg>
                    </div>
                    <div class="bg-white shadow-md px-4 py-2 rounded-2xl rounded-tl-none">
                        <p class="text-sm text-gray-800">Cảm ơn bạn đã liên hệ! Để được hỗ trợ nhanh nhất, vui lòng gọi hotline 1900.5301 ạ! 😊</p>
                        <span class="text-xs text-gray-400 mt-1 block">${new Date().toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</span>
                    </div>
                </div>
            `;
            messages.appendChild(errorDiv);
            messages.scrollTop = messages.scrollHeight;
        }
    }
}

// Escape HTML để tránh XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Cho phép gửi tin nhắn bằng Enter
document.addEventListener('DOMContentLoaded', function() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendChatMessage();
            }
        });
    }
});

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

// Export chatbot functions to global scope for onclick handlers
window.toggleChatbot = toggleChatbot;
window.showChatHistory = showChatHistory;
window.createNewConversation = createNewConversation;
window.loadConversation = loadConversation;
window.deleteConversation = deleteConversation;
window.backToChatView = backToChatView;
window.quickChat = quickChat;
window.sendChatMessage = sendChatMessage;
window.closeLoginRequiredModal = closeLoginRequiredModal;

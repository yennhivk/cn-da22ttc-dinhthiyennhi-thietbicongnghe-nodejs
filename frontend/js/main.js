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

// Shopping Cart Functions
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function updateCartCount() {
    const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = cartCount;
    });
}

function addToCart(product) {
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Đã thêm vào giỏ hàng!', 'success');
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Đã xóa khỏi giỏ hàng!', 'info');
}

function updateCartQuantity(productId, quantity) {
    const item = cart.find(item => item.id === productId);
    if (item) {
        item.quantity = parseInt(quantity);
        if (item.quantity <= 0) {
            removeFromCart(productId);
        } else {
            localStorage.setItem('cart', JSON.stringify(cart));
            updateCartCount();
        }
    }
}

function clearCart() {
    cart = [];
    localStorage.setItem('cart', JSON.stringify(cart));
    updateCartCount();
    showToast('Giỏ hàng đã được xóa!', 'info');
}

function getCart() {
    return cart;
}

function getCartTotal() {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
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

// User Authentication (Mock)
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;

function login(email, password) {
    // Mock login - trong thực tế sẽ gọi API
    const user = {
        id: 1,
        email: email,
        name: 'Nguyễn Văn A',
        phone: '0123456789',
        address: '123 Đường ABC, TP.HCM'
    };
    
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    showToast('Đăng nhập thành công!', 'success');
    return user;
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    showToast('Đã đăng xuất!', 'info');
    window.location.href = 'index.html';
}

function isLoggedIn() {
    return currentUser !== null;
}

function getCurrentUser() {
    return currentUser;
}

// Chatbot Functions
let chatbotOpen = false;

function toggleChatbot() {
    const chatbotWindow = document.getElementById('chatbotWindow');
    if (chatbotWindow) {
        chatbotOpen = !chatbotOpen;
        chatbotWindow.classList.toggle('active');
    }
}

function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const messages = document.getElementById('chatMessages');
    
    if (input && input.value.trim() && messages) {
        const userMessage = input.value.trim();
        
        // Add user message
        const userDiv = document.createElement('div');
        userDiv.className = 'flex justify-end mb-3';
        userDiv.innerHTML = `
            <div class="bg-blue-600 text-white px-4 py-2 rounded-lg max-w-xs">
                ${userMessage}
            </div>
        `;
        messages.appendChild(userDiv);
        
        input.value = '';
        
        // Simulate bot response
        setTimeout(() => {
            const botDiv = document.createElement('div');
            botDiv.className = 'flex justify-start mb-3';
            botDiv.innerHTML = `
                <div class="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg max-w-xs">
                    Cảm ơn bạn đã liên hệ! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
                </div>
            `;
            messages.appendChild(botDiv);
            messages.scrollTop = messages.scrollHeight;
            
            // Save chat history
            saveChatHistory(userMessage, 'Cảm ơn bạn đã liên hệ!');
        }, 1000);
        
        messages.scrollTop = messages.scrollHeight;
    }
}

function saveChatHistory(userMessage, botReply) {
    let history = JSON.parse(localStorage.getItem('chatHistory')) || [];
    history.push({
        timestamp: new Date().toISOString(),
        user: userMessage,
        bot: botReply
    });
    localStorage.setItem('chatHistory', JSON.stringify(history));
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
    
    // Check if user is logged in and update UI
    if (isLoggedIn()) {
        const user = getCurrentUser();
        const loginButtons = document.querySelectorAll('[href*="login.html"]');
        loginButtons.forEach(btn => {
            btn.textContent = user.name;
            btn.href = 'pages/profile.html';
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

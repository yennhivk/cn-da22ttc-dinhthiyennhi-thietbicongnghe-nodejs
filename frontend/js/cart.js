// Cart JavaScript
const API_URL = 'http://localhost:3300/api';
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EKhông có ảnh%3C/text%3E%3C/svg%3E';

// Lưu trữ các sản phẩm được chọn (theo index)
let selectedItems = new Set();

// Kiểm tra đăng nhập
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Lấy user hiện tại
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Lấy cart key theo user
function getCartKey() {
    const user = getCurrentUser();
    return user ? `cart_${user.ma_tai_khoan}` : 'cart_guest';
}

// Lấy selected key theo user
function getSelectedKey() {
    const user = getCurrentUser();
    return user ? `selected_${user.ma_tai_khoan}` : 'selected_guest';
}

// Lưu selected items vào localStorage
function saveSelectedItems() {
    const selectedKey = getSelectedKey();
    localStorage.setItem(selectedKey, JSON.stringify([...selectedItems]));
}

// Load selected items từ localStorage
function loadSelectedItems() {
    const selectedKey = getSelectedKey();
    const saved = localStorage.getItem(selectedKey);
    if (saved) {
        selectedItems = new Set(JSON.parse(saved));
    } else {
        // Mặc định chọn tất cả
        const cartKey = getCartKey();
        const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
        selectedItems = new Set(cart.map((_, index) => index));
    }
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    // Kiểm tra đăng nhập
    if (!isLoggedIn()) {
        showLoginRequiredPage();
        return;
    }
    
    // Clean invalid cart data
    cleanCartData();
    // Load selected items
    loadSelectedItems();
    loadCart();
    updateCartBadge();
});

// Hiển thị trang yêu cầu đăng nhập
function showLoginRequiredPage() {
    const container = document.getElementById('cartItems');
    if (container) {
        container.innerHTML = `
            <div class="text-center py-16">
                <svg class="w-24 h-24 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-700 mb-2">Vui lòng đăng nhập</h3>
                <p class="text-gray-500 mb-6">Bạn cần đăng nhập để xem giỏ hàng của mình</p>
                <a href="login.html" class="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                    Đăng nhập ngay
                </a>
            </div>
        `;
    }
    // Cập nhật summary
    const subtotalEl = document.getElementById('cartSubtotal');
    const totalEl = document.getElementById('cartTotal');
    const itemCountEl = document.getElementById('cartItemCount');
    if (subtotalEl) subtotalEl.textContent = '0₫';
    if (totalEl) totalEl.textContent = '0₫';
    if (itemCountEl) itemCountEl.textContent = '0 sản phẩm';
}

// Clean invalid cart data
function cleanCartData() {
    const cartKey = getCartKey();
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    // Filter out invalid items
    cart = cart.filter(item => {
        return item && item.ma_san_pham && item.ten_san_pham;
    });
    
    // Ensure so_luong and gia are valid numbers
    cart = cart.map(item => ({
        ...item,
        so_luong: parseInt(item.so_luong) || 1,
        gia: parseFloat(item.gia) || 0
    }));
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
}

// Load cart from localStorage
function loadCart() {
    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    displayCart(cart);
    updateCartSummary(cart);
}

// Display cart items
function displayCart(cart) {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    if (cart.length === 0) {
        selectedItems.clear();
        saveSelectedItems();
        container.innerHTML = `
            <div class="text-center py-16">
                <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">Giỏ hàng trống</h3>
                <p class="text-gray-500 mb-6">Bạn chưa có sản phẩm nào trong giỏ hàng</p>
                <a href="products.html" class="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                    Tiếp tục mua sắm
                </a>
            </div>
        `;
        return;
    }
    
    // Xóa các index không hợp lệ khỏi selectedItems
    selectedItems = new Set([...selectedItems].filter(i => i < cart.length));
    saveSelectedItems();
    
    // Kiểm tra xem tất cả đã được chọn chưa
    const allSelected = cart.length > 0 && selectedItems.size === cart.length;
    
    // Header với checkbox chọn tất cả
    let html = `
        <div class="bg-white rounded-xl shadow-md p-4 mb-4 border border-gray-100">
            <div class="flex items-center gap-3">
                <label class="flex items-center gap-3 cursor-pointer select-none">
                    <input type="checkbox" 
                           id="selectAll" 
                           onchange="toggleSelectAll(this.checked)"
                           ${allSelected ? 'checked' : ''}
                           class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer">
                    <span class="font-semibold text-gray-700">Chọn tất cả (${cart.length} sản phẩm)</span>
                </label>
                <div class="ml-auto flex items-center gap-2">
                    <span class="text-sm text-gray-500">Đã chọn: <strong class="text-red-600">${selectedItems.size}</strong> sản phẩm</span>
                    ${selectedItems.size > 0 ? `
                        <button onclick="removeSelectedItems()" class="text-red-500 hover:text-red-700 text-sm font-medium ml-2">
                            Xóa đã chọn
                        </button>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    // Danh sách sản phẩm
    html += cart.map((item, index) => {
        const isSelected = selectedItems.has(index);
        return `
        <div class="bg-white rounded-xl shadow-md p-4 mb-4 border-2 ${isSelected ? 'border-red-400 bg-red-50/30' : 'border-gray-100'} transition-all duration-200">
            <div class="flex gap-4">
                <!-- Checkbox -->
                <div class="flex items-center">
                    <input type="checkbox" 
                           id="item-${index}" 
                           onchange="toggleItemSelection(${index}, this.checked)"
                           ${isSelected ? 'checked' : ''}
                           class="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500 cursor-pointer">
                </div>
                
                <!-- Product Image -->
                <div class="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden cursor-pointer" onclick="toggleItemSelection(${index}, !selectedItems.has(${index})); document.getElementById('item-${index}').checked = selectedItems.has(${index});">
                    <img src="${item.anh_chinh || PLACEHOLDER_IMAGE}" 
                         alt="${item.ten_san_pham}" 
                         class="w-full h-full object-contain"
                         onerror="this.src='${PLACEHOLDER_IMAGE}'">
                </div>
                
                <!-- Product Info -->
                <div class="flex-1">
                    <h3 class="font-semibold text-gray-900 mb-1 cursor-pointer hover:text-red-600" onclick="toggleItemSelection(${index}, !selectedItems.has(${index})); document.getElementById('item-${index}').checked = selectedItems.has(${index});">${item.ten_san_pham}</h3>
                    <p class="text-red-600 font-bold text-lg">${formatPrice(item.gia)}</p>
                    
                    <!-- Quantity Controls -->
                    <div class="flex items-center gap-3 mt-2">
                        <div class="flex items-center border border-gray-300 rounded-lg">
                            <button onclick="updateQuantity(${index}, -1)" class="px-3 py-1 hover:bg-gray-100 transition">-</button>
                            <span class="px-3 py-1 border-x border-gray-300">${parseInt(item.so_luong) || 1}</span>
                            <button onclick="updateQuantity(${index}, 1)" class="px-3 py-1 hover:bg-gray-100 transition">+</button>
                        </div>
                        <button onclick="removeItem(${index})" class="text-red-500 hover:text-red-700 transition" title="Xóa sản phẩm">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <!-- Item Total -->
                <div class="text-right">
                    <p class="text-sm text-gray-500">Thành tiền</p>
                    <p class="font-bold text-red-600">${formatPrice(item.gia * (parseInt(item.so_luong) || 1))}</p>
                </div>
            </div>
        </div>
    `}).join('');
    
    container.innerHTML = html;
}

// Toggle chọn/bỏ chọn một sản phẩm
function toggleItemSelection(index, isSelected) {
    if (isSelected) {
        selectedItems.add(index);
    } else {
        selectedItems.delete(index);
    }
    saveSelectedItems();
    loadCart(); // Reload để cập nhật UI và tính toán lại
}

// Toggle chọn/bỏ chọn tất cả
function toggleSelectAll(isSelected) {
    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    if (isSelected) {
        selectedItems = new Set(cart.map((_, index) => index));
    } else {
        selectedItems.clear();
    }
    saveSelectedItems();
    loadCart();
}

// Xóa các sản phẩm đã chọn
function removeSelectedItems() {
    if (selectedItems.size === 0) {
        showNotification('Vui lòng chọn sản phẩm cần xóa');
        return;
    }
    
    if (!confirm(`Bạn có chắc muốn xóa ${selectedItems.size} sản phẩm đã chọn?`)) {
        return;
    }
    
    const cartKey = getCartKey();
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    // Xóa từ cuối lên để không ảnh hưởng index
    const sortedIndices = [...selectedItems].sort((a, b) => b - a);
    sortedIndices.forEach(index => {
        cart.splice(index, 1);
    });
    
    localStorage.setItem(cartKey, JSON.stringify(cart));
    selectedItems.clear();
    saveSelectedItems();
    loadCart();
    updateCartBadge();
    showNotification(`Đã xóa ${sortedIndices.length} sản phẩm`);
}


// Update cart summary - chỉ tính cho các sản phẩm được chọn
function updateCartSummary(cart) {
    // Chỉ tính tổng cho các sản phẩm được chọn
    let subtotal = 0;
    let selectedCount = 0;
    
    cart.forEach((item, index) => {
        if (selectedItems.has(index)) {
            const qty = parseInt(item.so_luong) || 1;
            subtotal += item.gia * qty;
            selectedCount += qty;
        }
    });
    
    const shipping = subtotal > 500000 ? 0 : (subtotal > 0 ? 30000 : 0);
    const total = subtotal + shipping;
    
    const subtotalEl = document.getElementById('cartSubtotal');
    const shippingEl = document.getElementById('cartShipping');
    const totalEl = document.getElementById('cartTotal');
    const itemCountEl = document.getElementById('cartItemCount');
    
    if (subtotalEl) subtotalEl.textContent = formatPrice(subtotal);
    if (shippingEl) {
        if (subtotal === 0) {
            shippingEl.textContent = '0₫';
        } else {
            shippingEl.textContent = shipping === 0 ? 'Miễn phí' : formatPrice(shipping);
        }
    }
    if (totalEl) totalEl.textContent = formatPrice(total);
    if (itemCountEl) {
        itemCountEl.textContent = `${selectedCount} sản phẩm được chọn`;
    }
    
    // Cập nhật nút thanh toán
    const checkoutBtn = document.getElementById('checkoutBtn');
    if (checkoutBtn) {
        if (selectedItems.size === 0) {
            checkoutBtn.disabled = true;
            checkoutBtn.classList.add('opacity-50', 'cursor-not-allowed');
            checkoutBtn.classList.remove('hover:bg-red-700');
        } else {
            checkoutBtn.disabled = false;
            checkoutBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            checkoutBtn.classList.add('hover:bg-red-700');
        }
    }
}

// Update quantity
function updateQuantity(index, change) {
    const cartKey = getCartKey();
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    if (cart[index]) {
        cart[index].so_luong = Math.max(1, (parseInt(cart[index].so_luong) || 1) + change);
        localStorage.setItem(cartKey, JSON.stringify(cart));
        loadCart();
        updateCartBadge();
    }
}

// Remove item from cart
function removeItem(index) {
    const cartKey = getCartKey();
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    cart.splice(index, 1);
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    // Cập nhật selectedItems - xóa index này và giảm các index lớn hơn
    selectedItems.delete(index);
    const newSelected = new Set();
    selectedItems.forEach(i => {
        if (i > index) {
            newSelected.add(i - 1);
        } else {
            newSelected.add(i);
        }
    });
    selectedItems = newSelected;
    saveSelectedItems();
    
    loadCart();
    updateCartBadge();
    showNotification('Đã xóa sản phẩm khỏi giỏ hàng');
}

// Clear all cart
function clearCart() {
    if (confirm('Bạn có chắc muốn xóa tất cả sản phẩm trong giỏ hàng?')) {
        const cartKey = getCartKey();
        localStorage.setItem(cartKey, '[]');
        loadCart();
        updateCartBadge();
        showNotification('Đã xóa tất cả sản phẩm');
    }
}

// Update cart badge
function updateCartBadge() {
    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.so_luong) || 0), 0);
    
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.textContent = totalItems || 0;
    });
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50';
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
}

// Tiến hành thanh toán
function proceedToCheckout() {
    if (selectedItems.size === 0) {
        showNotification('Vui lòng chọn ít nhất một sản phẩm để thanh toán');
        return;
    }
    
    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    // Lấy các sản phẩm được chọn
    const selectedProducts = [];
    cart.forEach((item, index) => {
        if (selectedItems.has(index)) {
            selectedProducts.push(item);
        }
    });
    
    // Lưu sản phẩm được chọn để thanh toán
    const user = getCurrentUser();
    const checkoutKey = user ? `checkout_${user.ma_tai_khoan}` : 'checkout_guest';
    localStorage.setItem(checkoutKey, JSON.stringify(selectedProducts));
    
    // Chuyển đến trang thanh toán
    window.location.href = 'checkout.html';
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

// API Configuration
const API_URL = 'http://localhost:3300/api';

// State management
let allProducts = [];
let filteredProducts = [];
let currentCategory = null;
let currentBrand = null;

// Load products when page loads
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupEventListeners();
    
    // Check URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category');
    const brand = urlParams.get('brand');
    
    if (category) {
        currentCategory = category;
    }
    if (brand) {
        currentBrand = brand;
    }
});

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleSearch();
            }
        });
    }
    
    // Mobile search
    const mobileSearchInput = document.getElementById('mobileSearchInput');
    if (mobileSearchInput) {
        mobileSearchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handleMobileSearch();
            }
        });
    }
}

// Load products from API
async function loadProducts() {
    try {
        showLoading();
        
        let url = `${API_URL}/products`;
        const params = new URLSearchParams();
        
        if (currentCategory) {
            params.append('category', currentCategory);
        }
        if (currentBrand) {
            params.append('brand', currentBrand);
        }
        
        if (params.toString()) {
            url += `?${params.toString()}`;
        }
        
        const response = await fetch(url);
        const result = await response.json();
        
        if (result.success) {
            allProducts = result.data;
            filteredProducts = result.data;
            displayProducts(filteredProducts);
            updateResultCount(filteredProducts.length);
        } else {
            showError('Không thể tải sản phẩm');
        }
    } catch (error) {
        console.error('Lỗi khi tải sản phẩm:', error);
        showError('Lỗi kết nối đến server. Vui lòng kiểm tra backend đang chạy.');
    } finally {
        hideLoading();
    }
}

// Display products in grid
function displayProducts(products) {
    const container = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
    
    if (!container) {
        console.error('Không tìm thấy container sản phẩm');
        return;
    }
    
    if (products.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-20">
                <svg class="w-24 h-24 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">Không tìm thấy sản phẩm</h3>
                <p class="text-gray-500">Vui lòng thử lại với từ khóa khác</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = products.map(product => createProductCard(product)).join('');
}

// Create product card HTML
function createProductCard(product) {
    const imageUrl = product.anh_chinh || '../images/placeholder.jpg';
    const price = formatPrice(product.gia);
    const oldPrice = formatPrice(product.gia * 1.15); // Giả sử giá cũ cao hơn 15%
    const discount = 15; // Giả sử giảm 15%
    
    return `
        <div class="bg-white rounded-lg overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 relative group product-card">
            <!-- Freeship Badge -->
            <div class="absolute top-2 left-2 z-10">
                <div class="bg-red-600 text-white rounded-full w-12 h-12 flex items-center justify-center shadow-lg">
                    <div class="text-center">
                        <div class="text-[10px] font-bold leading-tight">FREESHIP</div>
                        <div class="text-[8px] leading-tight">TOÀN QUỐC</div>
                    </div>
                </div>
            </div>
            
            <!-- Product Image -->
            <div class="relative p-4 bg-gray-50 cursor-pointer" onclick="viewProduct(${product.ma_san_pham})">
                <img src="${imageUrl}" 
                     alt="${product.ten_san_pham}" 
                     class="product-image w-full h-48 object-contain"
                     onerror="this.src='../images/placeholder.jpg'">
                
                <!-- Feature Badges -->
                <div class="absolute top-2 left-2 space-y-1 max-w-[45%]">
                    ${product.thuong_hieu ? `
                    <div class="feature-badge bg-white/95 backdrop-blur-sm px-2 py-1 rounded shadow-md border border-gray-200">
                        <span class="text-[10px] font-medium text-gray-800 leading-tight block">${product.thuong_hieu}</span>
                    </div>
                    ` : ''}
                    ${product.so_luong > 0 ? `
                    <div class="feature-badge bg-white/95 backdrop-blur-sm px-2 py-1 rounded shadow-md border border-gray-200">
                        <span class="text-[10px] font-medium text-gray-800 leading-tight block">Còn ${product.so_luong} sản phẩm</span>
                    </div>
                    ` : `
                    <div class="feature-badge bg-red-100 backdrop-blur-sm px-2 py-1 rounded shadow-md border border-red-300">
                        <span class="text-[10px] font-medium text-red-600 leading-tight block">Hết hàng</span>
                    </div>
                    `}
                </div>
                
                <!-- Installment Badge -->
                <div class="absolute bottom-2 right-2">
                    <div class="bg-blue-600 text-white px-3 py-1.5 rounded-md shadow-lg">
                        <span class="text-xs font-bold">Trả góp 0%</span>
                    </div>
                </div>
            </div>
            
            <!-- Product Info -->
            <div class="p-3">
                <!-- Pricing -->
                <div class="mb-2">
                    <div class="flex items-baseline gap-2 mb-1">
                        <span class="text-sm text-gray-400 line-through">${oldPrice}</span>
                        <span class="text-red-600 text-xs font-bold">-${discount}%</span>
                    </div>
                    <div class="text-xl font-bold text-red-600">${price}</div>
                    <div class="text-xs text-green-600 font-medium">Giảm ${formatPrice(product.gia * 0.15)}</div>
                </div>
                
                <!-- Product Name -->
                <h3 class="font-semibold text-gray-900 text-sm mb-2 line-clamp-2 cursor-pointer hover:text-red-600" onclick="viewProduct(${product.ma_san_pham})">
                    ${product.ten_san_pham}
                </h3>
                
                <!-- Category Badge -->
                ${product.ten_danh_muc ? `
                <div class="mb-2">
                    <span class="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        ${product.ten_danh_muc}
                    </span>
                </div>
                ` : ''}
                
                <!-- Description -->
                ${product.mo_ta ? `
                <p class="text-xs text-gray-600 mb-2 line-clamp-2">${product.mo_ta}</p>
                ` : ''}
                
                <!-- Action Buttons -->
                <div class="flex gap-2 mt-3">
                    <button onclick="addToCart(${product.ma_san_pham})" 
                            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm ${product.so_luong === 0 ? 'opacity-50 cursor-not-allowed' : ''}"
                            ${product.so_luong === 0 ? 'disabled' : ''}>
                        <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                        </svg>
                        ${product.so_luong === 0 ? 'Hết hàng' : 'Thêm vào giỏ'}
                    </button>
                    <button onclick="viewProduct(${product.ma_san_pham})" 
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 text-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Format price to Vietnamese currency
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// View product details
function viewProduct(productId) {
    window.location.href = `product-detail.html?id=${productId}`;
}

// Add to cart
function addToCart(productId) {
    const product = allProducts.find(p => p.ma_san_pham === productId);
    if (!product) return;
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem('cart') || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.ma_san_pham === productId);
    
    if (existingItem) {
        existingItem.so_luong += 1;
    } else {
        cart.push({
            ma_san_pham: product.ma_san_pham,
            ten_san_pham: product.ten_san_pham,
            gia: product.gia,
            anh_chinh: product.anh_chinh,
            so_luong: 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem('cart', JSON.stringify(cart));
    
    // Update cart badge
    updateCartBadge();
    
    // Show notification
    showNotification('Đã thêm sản phẩm vào giỏ hàng!');
}

// Update cart badge
function updateCartBadge() {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const totalItems = cart.reduce((sum, item) => sum + item.so_luong, 0);
    
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => {
        badge.textContent = totalItems;
    });
}

// Show notification
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-20 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
        <div class="flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Handle search
function handleSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
    }
}

// Handle mobile search
function handleMobileSearch() {
    const searchInput = document.getElementById('mobileSearchInput');
    const searchTerm = searchInput.value.trim();
    
    if (searchTerm) {
        window.location.href = `products.html?search=${encodeURIComponent(searchTerm)}`;
    }
}

// Show loading
function showLoading() {
    const container = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full flex justify-center items-center py-20">
                <div class="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-red-600"></div>
            </div>
        `;
    }
}

// Hide loading
function hideLoading() {
    // Loading will be replaced by products
}

// Show error
function showError(message) {
    const container = document.querySelector('.grid.grid-cols-1.sm\\:grid-cols-2');
    if (container) {
        container.innerHTML = `
            <div class="col-span-full text-center py-20">
                <svg class="w-24 h-24 mx-auto text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <h3 class="text-xl font-semibold text-gray-600 mb-2">Có lỗi xảy ra</h3>
                <p class="text-gray-500 mb-4">${message}</p>
                <button onclick="loadProducts()" class="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-6 rounded-lg transition">
                    Thử lại
                </button>
            </div>
        `;
    }
}

// Update result count
function updateResultCount(count) {
    const resultText = document.querySelector('.text-gray-500 strong');
    if (resultText) {
        resultText.textContent = count;
    }
}

// Toggle mobile menu
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    const menuIcon = document.getElementById('menuIcon');
    const closeIcon = document.getElementById('closeIcon');
    
    if (mobileMenu.classList.contains('hidden')) {
        mobileMenu.classList.remove('hidden');
        menuIcon.classList.add('hidden');
        closeIcon.classList.remove('hidden');
    } else {
        mobileMenu.classList.add('hidden');
        menuIcon.classList.remove('hidden');
        closeIcon.classList.add('hidden');
    }
}

// Switch tab
function switchTab(tabName) {
    // Hide all content
    document.getElementById('content-kham-pha').classList.add('hidden');
    
    // Show selected content
    if (tabName === 'kham-pha') {
        document.getElementById('content-kham-pha').classList.remove('hidden');
    }
    
    // Update tab styles
    const tabs = ['kham-pha', 'san-pham', 'bai-viet'];
    tabs.forEach(tab => {
        const tabElement = document.getElementById(`tab-${tab}`);
        if (tab === tabName) {
            tabElement.classList.add('text-red-600', 'border-red-600');
            tabElement.classList.remove('text-gray-600', 'border-transparent');
        } else {
            tabElement.classList.remove('text-red-600', 'border-red-600');
            tabElement.classList.add('text-gray-600', 'border-transparent');
        }
    });
}

// Toggle filter
function toggleFilter(filterId) {
    const filter = document.getElementById(filterId);
    const icon = document.getElementById(filterId + 'Icon');
    
    if (filter.classList.contains('hidden')) {
        filter.classList.remove('hidden');
        icon.style.transform = 'rotate(180deg)';
    } else {
        filter.classList.add('hidden');
        icon.style.transform = 'rotate(0deg)';
    }
}

// Initialize cart badge on page load
updateCartBadge();

// Show "Khám phá" tab by default
document.addEventListener('DOMContentLoaded', function() {
    switchTab('kham-pha');
});

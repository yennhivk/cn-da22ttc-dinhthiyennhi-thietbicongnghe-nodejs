// API Configuration
const API_URL = 'http://localhost:3000/api';

// State
let currentProduct = null;
let currentQuantity = 1;

// Kiem tra dang nhap
function isLoggedIn() {
    return !!localStorage.getItem('token');
}

// Lay user hien tai
function getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Lay cart key theo user
function getCartKey() {
    const user = getCurrentUser();
    return user ? `cart_${user.ma_tai_khoan}` : 'cart_guest';
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const productId = urlParams.get('id');
    
    if (productId) {
        loadProductDetail(productId);
    } else {
        showError('KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m');
    }
    
    updateCartBadge();
});

// Load product detail from API
async function loadProductDetail(productId) {
    try {
        const response = await fetch(`${API_URL}/products/${productId}`);
        const result = await response.json();
        
        if (result.success) {
            currentProduct = result.data;
            displayProductDetail(currentProduct);
            loadRelatedProducts(currentProduct.ma_danh_muc);
        } else {
            showError('KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m');
        }
    } catch (error) {
        console.error('Lá»—i khi táº£i sáº£n pháº©m:', error);
        showError('Lá»—i káº¿t ná»‘i Ä‘áº¿n server');
    }
}

// Display product detail
function displayProductDetail(product) {
    // Update page title
    document.title = `${product.ten_san_pham} - Yáº¿n Nhi Tech`;
    
    // Breadcrumb
    document.getElementById('breadcrumbCategory').textContent = product.ten_danh_muc || 'Sáº£n pháº©m';
    document.getElementById('breadcrumbProduct').textContent = product.ten_san_pham;
    
    // Main image
    const mainImageUrl = getProductImageUrl(product.images?.[0]?.duong_dan_anh);
    document.getElementById('mainImage').src = mainImageUrl;
    document.getElementById('mainImage').alt = product.ten_san_pham;

    // Thumbnails
    const thumbnailContainer = document.getElementById('thumbnailContainer');
    if (product.images && product.images.length > 0) {
        thumbnailContainer.innerHTML = product.images.map((img, index) => `
            <button onclick="changeMainImage('${getProductImageUrl(img.duong_dan_anh)}', this)" 
                    class="thumbnail-item flex-shrink-0 w-20 h-20 border-2 ${index === 0 ? 'border-red-600' : 'border-gray-200'} rounded-lg overflow-hidden">
                <img src="${getProductImageUrl(img.duong_dan_anh)}" alt="Thumbnail ${index + 1}" 
                     class="w-full h-full object-contain"
                     onerror="this.onerror=null; this.src=PLACEHOLDER_IMAGE">
            </button>
        `).join('');
    } else {
        thumbnailContainer.innerHTML = `
            <div class="thumbnail-item flex-shrink-0 w-20 h-20 border-2 border-red-600 rounded-lg overflow-hidden">
                <img src="${mainImageUrl}" alt="Thumbnail" class="w-full h-full object-contain">
            </div>
        `;
    }
    
    // Product info
    document.getElementById('productBrand').textContent = product.thuong_hieu || 'KhÃ´ng rÃµ';
    document.getElementById('productName').textContent = product.ten_san_pham;
    
    // Price
    const price = product.gia;
    const oldPrice = price * 1.15;
    const savedAmount = oldPrice - price;
    
    document.getElementById('productPrice').textContent = formatPrice(price);
    document.getElementById('oldPrice').textContent = formatPrice(oldPrice);
    document.getElementById('savedAmount').textContent = formatPrice(savedAmount);
    
    // Stock
    const stockInfo = document.getElementById('stockInfo');
    const stockBadge = document.getElementById('stockBadge');
    const addToCartBtn = document.getElementById('addToCartBtn');
    const buyNowBtn = document.querySelector('button[onclick="buyNow()"]');
    
    if (product.so_luong > 0) {
        stockInfo.textContent = `CÃ²n ${product.so_luong} sáº£n pháº©m`;
        stockBadge.textContent = 'CÃ²n hÃ ng';
        stockBadge.className = 'bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold';
        addToCartBtn.disabled = false;
        if (buyNowBtn) buyNowBtn.disabled = false;
    } else {
        stockInfo.textContent = 'Háº¿t hÃ ng';
        stockInfo.className = 'text-red-600 text-sm font-bold';
        stockBadge.textContent = 'ðŸš« Háº¿t hÃ ng';
        stockBadge.className = 'bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold';
        
        // VÃ´ hiá»‡u hÃ³a nÃºt thÃªm vÃ o giá»
        addToCartBtn.disabled = true;
        addToCartBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
        addToCartBtn.classList.remove('bg-red-600', 'hover:bg-red-700');
        addToCartBtn.innerHTML = `
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path></svg>
            Sáº£n pháº©m háº¿t hÃ ng
        `;
        
        // VÃ´ hiá»‡u hÃ³a nÃºt mua ngay
        if (buyNowBtn) {
            buyNowBtn.disabled = true;
            buyNowBtn.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-400');
            buyNowBtn.classList.remove('bg-orange-500', 'hover:bg-orange-600');
            buyNowBtn.innerHTML = `
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Táº¡m háº¿t hÃ ng
            `;
        }
        
        // VÃ´ hiá»‡u hÃ³a cÃ¡c nÃºt sá»‘ lÆ°á»£ng
        const quantityInput = document.getElementById('quantity');
        const decreaseBtn = document.querySelector('button[onclick="decreaseQuantity()"]');
        const increaseBtn = document.querySelector('button[onclick="increaseQuantity()"]');
        
        if (quantityInput) quantityInput.disabled = true;
        if (decreaseBtn) decreaseBtn.disabled = true;
        if (increaseBtn) increaseBtn.disabled = true;
    }
    
    // Description - Chi tiáº¿t hÆ¡n
    displayProductDescription(product);
    
    // Specs - Chi tiáº¿t hÆ¡n
    displayProductSpecs(product);
    
    // Reviews
    displayReviews(product.reviews || []);
}

// Hiá»ƒn thá»‹ mÃ´ táº£ sáº£n pháº©m chi tiáº¿t
function displayProductDescription(product) {
    const descContainer = document.getElementById('productDescription');
    
    // Táº¡o mÃ´ táº£ chi tiáº¿t dá»±a trÃªn thÃ´ng tin sáº£n pháº©m
    let descriptionHTML = '';
    
    if (product.mo_ta) {
        descriptionHTML += `
            <div class="mb-6">
                <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <svg class="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    Giá»›i thiá»‡u sáº£n pháº©m
                </h3>
                <p class="text-gray-700 leading-relaxed">${product.mo_ta}</p>
            </div>
        `;
    }
    
    // ThÃªm Ä‘iá»ƒm ná»•i báº­t
    descriptionHTML += `
        <div class="mb-6">
            <h3 class="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path>
                </svg>
                Điểm nổi bật
            </h3>
            <ul class="space-y-2">
                <li class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-gray-700">Sản phẩm chính hãng ${product.thuong_hieu || ''} - Bảo hành 12 tháng</span>
                </li>
                <li class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-gray-700">Thiết kế hiện đại, sang trọng phù hợp mọi phong cách</span>
                </li>
                <li class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-gray-700">Hiệu năng mạnh mẽ, đáp ứng mọi nhu cầu sử dụng</span>
                </li>
                <li class="flex items-start gap-3">
                    <svg class="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                    </svg>
                    <span class="text-gray-700">Hỗ trợ kỹ thuật 24/7, đội ngũ tư vấn chuyên nghiệp</span>
                </li>
            </ul>
        </div>
    `;
    
    // ThÃªm cam káº¿t
    descriptionHTML += `
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-200">
            <h3 class="text-lg font-bold text-blue-800 mb-3 flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
                </svg>
                Cam káº¿t tá»« Yáº¿n Nhi Tech
            </h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div class="flex items-center gap-2 text-sm text-blue-700">
                    <span class="text-lg">âœ…</span>
                    <span>100% sáº£n pháº©m chÃ­nh hÃ£ng</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-blue-700">
                    <span class="text-lg">🚚</span>
                    <span>Giao hàng toàn quốc</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-blue-700">
                    <span class="text-lg">🔄</span>
                    <span>Đổi trả trong 7 ngày</span>
                </div>
                <div class="flex items-center gap-2 text-sm text-blue-700">
                    <span class="text-lg">🛡️</span>
                    <span>Báº£o hÃ nh táº­n nÆ¡i</span>
                </div>
            </div>
        </div>
    `;
    
    descContainer.innerHTML = descriptionHTML;
}

// Hiá»ƒn thá»‹ thÃ´ng sá»‘ ká»¹ thuáº­t chi tiáº¿t
function displayProductSpecs(product) {
    const specsContainer = document.getElementById('productSpecs');
    
    // Táº¡o thÃ´ng sá»‘ ká»¹ thuáº­t dá»±a trÃªn danh má»¥c sáº£n pháº©m
    let specsHTML = `
        <div class="overflow-hidden rounded-xl border border-gray-200">
            <table class="w-full">
                <tbody>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700 w-1/3">ThÆ°Æ¡ng hiá»‡u</td>
                        <td class="px-4 py-3 text-gray-900">${product.thuong_hieu || 'Äang cáº­p nháº­t'}</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Danh má»¥c</td>
                        <td class="px-4 py-3 text-gray-900">${product.ten_danh_muc || 'Äang cáº­p nháº­t'}</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">MÃ£ sáº£n pháº©m</td>
                        <td class="px-4 py-3 text-gray-900">SP${String(product.ma_san_pham).padStart(6, '0')}</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">TÃ¬nh tráº¡ng</td>
                        <td class="px-4 py-3">
                            <span class="${product.so_luong > 0 ? 'text-green-600' : 'text-red-600'} font-medium">
                                ${product.so_luong > 0 ? 'CÃ²n hÃ ng (' + product.so_luong + ' sáº£n pháº©m)' : 'Háº¿t hÃ ng'}
                            </span>
                        </td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">Báº£o hÃ nh</td>
                        <td class="px-4 py-3 text-gray-900">12 thÃ¡ng chÃ­nh hÃ£ng táº¡i trung tÃ¢m báº£o hÃ nh</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Xuáº¥t xá»©</td>
                        <td class="px-4 py-3 text-gray-900">ChÃ­nh hÃ£ng - Nháº­p kháº©u</td>
                    </tr>
    `;
    
    // ThÃªm thÃ´ng sá»‘ theo danh má»¥c
    if (product.ten_danh_muc) {
        const category = product.ten_danh_muc.toLowerCase();
        
        if (category.includes('Ä‘iá»‡n thoáº¡i') || category.includes('phone')) {
            specsHTML += `
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">MÃ n hÃ¬nh</td>
                        <td class="px-4 py-3 text-gray-900">AMOLED, 6.7 inch, 120Hz</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Chip xá»­ lÃ½</td>
                        <td class="px-4 py-3 text-gray-900">Chip cao cáº¥p tháº¿ há»‡ má»›i</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">RAM</td>
                        <td class="px-4 py-3 text-gray-900">8GB / 12GB</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Bá»™ nhá»› trong</td>
                        <td class="px-4 py-3 text-gray-900">128GB / 256GB / 512GB</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">Camera sau</td>
                        <td class="px-4 py-3 text-gray-900">48MP + 12MP + 12MP</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Camera trÆ°á»›c</td>
                        <td class="px-4 py-3 text-gray-900">12MP</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">Pin</td>
                        <td class="px-4 py-3 text-gray-900">4500mAh, sáº¡c nhanh 65W</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Há»‡ Ä‘iá»u hÃ nh</td>
                        <td class="px-4 py-3 text-gray-900">${product.thuong_hieu === 'Apple' ? 'iOS' : 'Android'}</td>
                    </tr>
            `;
        } else if (category.includes('laptop')) {
            specsHTML += `
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">MÃ n hÃ¬nh</td>
                        <td class="px-4 py-3 text-gray-900">14 inch / 15.6 inch, Full HD / 2K</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">CPU</td>
                        <td class="px-4 py-3 text-gray-900">Intel Core i5/i7 hoáº·c AMD Ryzen 5/7</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">RAM</td>
                        <td class="px-4 py-3 text-gray-900">8GB / 16GB / 32GB DDR5</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">á»” cá»©ng</td>
                        <td class="px-4 py-3 text-gray-900">SSD 256GB / 512GB / 1TB NVMe</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">Card Ä‘á»“ há»a</td>
                        <td class="px-4 py-3 text-gray-900">Intel Iris Xe / NVIDIA RTX</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Pin</td>
                        <td class="px-4 py-3 text-gray-900">LÃªn Ä‘áº¿n 10 giá» sá»­ dá»¥ng</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">Há»‡ Ä‘iá»u hÃ nh</td>
                        <td class="px-4 py-3 text-gray-900">${product.thuong_hieu === 'Apple' ? 'macOS' : 'Windows 11'}</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Trá»ng lÆ°á»£ng</td>
                        <td class="px-4 py-3 text-gray-900">1.4kg - 1.8kg</td>
                    </tr>
            `;
        } else if (category.includes('phá»¥ kiá»‡n') || category.includes('tai nghe')) {
            specsHTML += `
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">Loáº¡i káº¿t ná»‘i</td>
                        <td class="px-4 py-3 text-gray-900">Bluetooth 5.3 / CÃ³ dÃ¢y</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">Thá»i lÆ°á»£ng pin</td>
                        <td class="px-4 py-3 text-gray-900">LÃªn Ä‘áº¿n 30 giá» (vá»›i há»™p sáº¡c)</td>
                    </tr>
                    <tr class="border-b border-gray-200 bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">Chá»‘ng nÆ°á»›c</td>
                        <td class="px-4 py-3 text-gray-900">IPX4 / IPX5</td>
                    </tr>
                    <tr class="border-b border-gray-200">
                        <td class="px-4 py-3 font-semibold text-gray-700">TÃ­nh nÄƒng</td>
                        <td class="px-4 py-3 text-gray-900">Chá»‘ng á»“n chá»§ Ä‘á»™ng (ANC), XuyÃªn Ã¢m</td>
                    </tr>
            `;
        }
    }
    
    specsHTML += `
                    <tr class="bg-gray-50">
                        <td class="px-4 py-3 font-semibold text-gray-700">Phá»¥ kiá»‡n Ä‘i kÃ¨m</td>
                        <td class="px-4 py-3 text-gray-900">Há»™p, sÃ¡ch hÆ°á»›ng dáº«n, cÃ¡p sáº¡c, phá»¥ kiá»‡n theo mÃ¡y</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="mt-4 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <p class="text-sm text-yellow-800">
                <strong>LÆ°u Ã½:</strong> ThÃ´ng sá»‘ ká»¹ thuáº­t cÃ³ thá»ƒ thay Ä‘á»•i theo tá»«ng phiÃªn báº£n sáº£n pháº©m. 
                Vui lÃ²ng liÃªn há»‡ hotline <strong class="text-red-600">1900.5301</strong> Ä‘á»ƒ Ä‘Æ°á»£c tÆ° váº¥n chi tiáº¿t.
            </p>
        </div>
    `;
    
    specsContainer.innerHTML = specsHTML;
}


// Display reviews
function displayReviews(reviews) {
    const container = document.getElementById('reviewsContainer');
    const reviewCount = reviews.length;
    
    document.getElementById('reviewCount').textContent = `${reviewCount} Ä‘Ã¡nh giÃ¡`;
    document.getElementById('tabReviewCount').textContent = reviewCount;
    document.getElementById('totalReviewsDisplay').textContent = reviewCount;
    
    // Kiá»ƒm tra token cÃ²n há»£p lá»‡ khÃ´ng
    const token = localStorage.getItem('token');
    let isValidLogin = false;
    
    if (token) {
        try {
            // Decode JWT Ä‘á»ƒ kiá»ƒm tra expiry
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiry = payload.exp * 1000; // Convert to milliseconds
            isValidLogin = Date.now() < expiry;
            
            if (!isValidLogin) {
                // Token háº¿t háº¡n, xÃ³a Ä‘i
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        } catch (e) {
            // Token khÃ´ng há»£p lá»‡
            localStorage.removeItem('token');
            localStorage.removeItem('user');
        }
    }
    
    // Hien thi form danh gia hoac nut dang nhap
    if (isValidLogin) {
        document.getElementById('reviewFormContainer').classList.remove('hidden');
        document.getElementById('loginToReview').classList.add('hidden');
        // Máº·c Ä‘á»‹nh chá»n 5 sao
        selectStar(5);
    } else {
        document.getElementById('reviewFormContainer').classList.add('hidden');
        document.getElementById('loginToReview').classList.remove('hidden');
    }
    
    // TÃ­nh Ä‘iá»ƒm trung bÃ¬nh vÃ  phÃ¢n bá»‘ sao
    let avgRating = 0;
    const ratingCounts = {5: 0, 4: 0, 3: 0, 2: 0, 1: 0};
    
    if (reviewCount > 0) {
        reviews.forEach(r => {
            avgRating += r.so_sao;
            ratingCounts[r.so_sao] = (ratingCounts[r.so_sao] || 0) + 1;
        });
        avgRating = avgRating / reviewCount;
    }
    
    // Hiá»ƒn thá»‹ Ä‘iá»ƒm trung bÃ¬nh
    document.getElementById('avgRatingDisplay').textContent = avgRating.toFixed(1);
    document.getElementById('ratingText').textContent = avgRating.toFixed(1);
    
    // Hiá»ƒn thá»‹ sao trung bÃ¬nh
    document.getElementById('avgStarsDisplay').innerHTML = generateStars(Math.round(avgRating));
    
    // Hiá»ƒn thá»‹ phÃ¢n bá»‘ sao
    const distributionHTML = [5, 4, 3, 2, 1].map(star => {
        const count = ratingCounts[star] || 0;
        const percent = reviewCount > 0 ? (count / reviewCount * 100) : 0;
        return `
            <div class="flex items-center gap-3">
                <span class="text-sm font-medium text-gray-600 w-12">${star} sao</span>
                <div class="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div class="bg-yellow-400 h-full rounded-full transition-all duration-500" style="width: ${percent}%"></div>
                </div>
                <span class="text-sm text-gray-500 w-16 text-right">${count} (${percent.toFixed(0)}%)</span>
            </div>
        `;
    }).join('');
    document.getElementById('ratingDistribution').innerHTML = distributionHTML;
    
    // Hiá»ƒn thá»‹ danh sÃ¡ch Ä‘Ã¡nh giÃ¡
    if (reviewCount === 0) {
        container.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <svg class="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <p>Chưa có đánh giá nào cho sản phẩm này</p>
                <p class="text-sm mt-2">Hãy là người đầu tiên đánh giá!</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = `
        <h3 class="font-bold text-lg text-gray-900 mb-4">📝 Tất cả đánh giá (${reviewCount})</h3>
        <div class="space-y-4">
            ${reviews.map(review => `
                <div class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition">
                    <div class="flex items-start gap-4">
                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                            <span class="text-white font-bold text-lg">${(review.ten_dang_nhap || 'U')[0].toUpperCase()}</span>
                        </div>
                        <div class="flex-1">
                            <div class="flex items-center justify-between mb-2">
                                <div>
                                    <span class="font-semibold text-gray-900">${review.ten_dang_nhap || 'Người dùng'}</span>
                                    <span class="text-green-600 text-xs ml-2 bg-green-100 px-2 py-0.5 rounded-full">✓ Đã mua hàng</span>
                                </div>
                                <span class="text-gray-400 text-sm">${formatDate(review.ngay_tao)}</span>
                            </div>
                            <div class="flex text-yellow-400 mb-2">
                                ${generateStars(review.so_sao)}
                            </div>
                            <p class="text-gray-700">${review.noi_dung}</p>
                        </div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
}

// Chá»n sá»‘ sao khi viáº¿t Ä‘Ã¡nh giÃ¡
let selectedStarRating = 5;
function selectStar(rating) {
    selectedStarRating = rating;
    document.getElementById('selectedRating').value = rating;
    const buttons = document.querySelectorAll('#starSelector .star-btn');
    buttons.forEach((btn, index) => {
        if (index < rating) {
            btn.classList.remove('text-gray-300');
            btn.classList.add('text-yellow-400');
        } else {
            btn.classList.remove('text-yellow-400');
            btn.classList.add('text-gray-300');
        }
    });
}

// Gá»­i Ä‘Ã¡nh giÃ¡
async function submitReview(event) {
    event.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) {
        alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
        return;
    }
    
    const content = document.getElementById('reviewContent').value.trim();
    if (!content) {
        alert('Vui lòng nhập nội dung đánh giá!');
        return;
    }
    
    if (content.length < 10) {
        alert('Nội dung đánh giá phải có ít nhất 10 ký tự!');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${currentProduct.ma_san_pham}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                so_sao: selectedStarRating,
                noi_dung: content
            })
        });
        
        const result = await response.json();
        
        if (response.status === 401) {
            // Token het han hoac khong hop le
            alert('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại!');
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
            return;
        }
        
        if (result.success) {
            alert('Đánh giá của bạn đã được gửi thành công!');
            document.getElementById('reviewContent').value = '';
            selectStar(5);
            // Reload product de cap nhat danh gia
            loadProductDetail(currentProduct.ma_san_pham);
        } else {
            alert(result.message || 'Có lỗi xảy ra khi gửi đánh giá!');
        }
    } catch (error) {
        console.error('Lỗi gửi đánh giá:', error);
        alert('Không thể kết nối đến server!');
    }
}

// Generate star HTML
function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        if (i <= rating) {
            stars += '<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
        } else {
            stars += '<svg class="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>';
        }
    }
    return stars;
}

// Load related products - Láº¥y táº¥t cáº£ sáº£n pháº©m khÃ¡c
async function loadRelatedProducts(categoryId) {
    try {
        // Láº¥y táº¥t cáº£ sáº£n pháº©m
        const response = await fetch(`${API_URL}/products`);
        const result = await response.json();
        
        if (result.success) {
            // Lá»c bá» sáº£n pháº©m hiá»‡n táº¡i vÃ  sáº¯p xáº¿p: Æ°u tiÃªn cÃ¹ng danh má»¥c trÆ°á»›c
            let relatedProducts = result.data
                .filter(p => p.ma_san_pham !== currentProduct.ma_san_pham)
                .sort((a, b) => {
                    // Æ¯u tiÃªn sáº£n pháº©m cÃ¹ng danh má»¥c
                    if (a.ma_danh_muc === categoryId && b.ma_danh_muc !== categoryId) return -1;
                    if (a.ma_danh_muc !== categoryId && b.ma_danh_muc === categoryId) return 1;
                    // Sau Ä‘Ã³ Æ°u tiÃªn cÃ¹ng thÆ°Æ¡ng hiá»‡u
                    if (a.thuong_hieu === currentProduct.thuong_hieu && b.thuong_hieu !== currentProduct.thuong_hieu) return -1;
                    if (a.thuong_hieu !== currentProduct.thuong_hieu && b.thuong_hieu === currentProduct.thuong_hieu) return 1;
                    return 0;
                });
            
            displayRelatedProducts(relatedProducts, categoryId);
        }
    } catch (error) {
        console.error('Lá»—i khi táº£i sáº£n pháº©m liÃªn quan:', error);
        // Hiá»ƒn thá»‹ sáº£n pháº©m máº«u náº¿u khÃ´ng káº¿t ná»‘i Ä‘Æ°á»£c API
        displaySampleRelatedProducts();
    }
}

// Hiá»ƒn thá»‹ sáº£n pháº©m máº«u khi khÃ´ng cÃ³ dá»¯ liá»‡u tá»« API
function displaySampleRelatedProducts() {
    const container = document.getElementById('relatedProducts');
    const sampleProducts = [
        { id: 1, name: 'iPhone 15 Pro Max', price: 33990000, brand: 'Apple', image: PLACEHOLDER_IMAGE },
        { id: 2, name: 'Samsung Galaxy S24 Ultra', price: 29990000, brand: 'Samsung', image: PLACEHOLDER_IMAGE },
        { id: 3, name: 'MacBook Air M3 2024', price: 28990000, brand: 'Apple', image: PLACEHOLDER_IMAGE },
        { id: 4, name: 'Dell XPS 13 Plus', price: 25990000, brand: 'Dell', image: PLACEHOLDER_IMAGE },
        { id: 5, name: 'Tai nghe AirPods Pro 2', price: 5990000, brand: 'Apple', image: PLACEHOLDER_IMAGE },
    ];
    
    let html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">';
    html += sampleProducts.map(product => createRelatedProductCard(product.id, product.name, product.price, product.brand, product.image)).join('');
    html += '</div>';
    html += createViewMoreButton();
    
    container.innerHTML = html;
}

// Display related products vá»›i nÃºt xem thÃªm
function displayRelatedProducts(products, categoryId) {
    const container = document.getElementById('relatedProducts');
    
    if (products.length === 0) {
        displaySampleRelatedProducts();
        return;
    }
    
    // Hiá»ƒn thá»‹ tá»‘i Ä‘a 5 sáº£n pháº©m Ä‘áº§u tiÃªn
    const displayProducts = products.slice(0, 5);
    const hasMore = products.length > 5;
    
    let html = '<div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">';
    html += displayProducts.map(product => `
        <a href="product-detail.html?id=${product.ma_san_pham}" class="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 group">
            <!-- Badge giáº£m giÃ¡ -->
            <div class="relative">
                <div class="absolute top-2 left-2 z-10">
                    <span class="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-15%</span>
                </div>
                <div class="p-4 bg-gradient-to-b from-gray-50 to-white">
                    <img src="${getProductImageUrl(product.anh_chinh)}" 
                         alt="${product.ten_san_pham}" 
                         class="w-full h-36 object-contain group-hover:scale-110 transition-transform duration-300"
                         onerror="this.onerror=null; this.src=PLACEHOLDER_IMAGE">
                </div>
            </div>
            <div class="p-3">
                <!-- ThÆ°Æ¡ng hiá»‡u -->
                <span class="text-xs text-blue-600 font-medium">${product.thuong_hieu || 'ChÃ­nh hÃ£ng'}</span>
                <!-- TÃªn sáº£n pháº©m -->
                <h3 class="font-semibold text-gray-900 text-sm mt-1 line-clamp-2 group-hover:text-red-600 transition min-h-[40px]">${product.ten_san_pham}</h3>
                <!-- GiÃ¡ -->
                <div class="mt-2">
                    <p class="text-red-600 font-bold text-base">${formatPrice(product.gia)}</p>
                    <p class="text-gray-400 text-xs line-through">${formatPrice(product.gia * 1.15)}</p>
                </div>
                <!-- Rating giáº£ -->
                <div class="flex items-center gap-1 mt-2">
                    <div class="flex text-yellow-400">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    </div>
                    <span class="text-xs text-gray-500">(${Math.floor(Math.random() * 50) + 10})</span>
                </div>
            </div>
        </a>
    `).join('');
    html += '</div>';
    
    // ThÃªm nÃºt xem thÃªm
    html += createViewMoreButton(categoryId);
    
    container.innerHTML = html;
}

// Táº¡o card sáº£n pháº©m liÃªn quan
function createRelatedProductCard(id, name, price, brand, image) {
    return `
        <a href="product-detail.html?id=${id}" class="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200 group">
            <div class="relative">
                <div class="absolute top-2 left-2 z-10">
                    <span class="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded">-15%</span>
                </div>
                <div class="p-4 bg-gradient-to-b from-gray-50 to-white">
                    <img src="${image}" 
                         alt="${name}" 
                         class="w-full h-36 object-contain group-hover:scale-110 transition-transform duration-300">
                </div>
            </div>
            <div class="p-3">
                <span class="text-xs text-blue-600 font-medium">${brand}</span>
                <h3 class="font-semibold text-gray-900 text-sm mt-1 line-clamp-2 group-hover:text-red-600 transition min-h-[40px]">${name}</h3>
                <div class="mt-2">
                    <p class="text-red-600 font-bold text-base">${formatPrice(price)}</p>
                    <p class="text-gray-400 text-xs line-through">${formatPrice(price * 1.15)}</p>
                </div>
                <div class="flex items-center gap-1 mt-2">
                    <div class="flex text-yellow-400">
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                        <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
                    </div>
                    <span class="text-xs text-gray-500">(${Math.floor(Math.random() * 50) + 10})</span>
                </div>
            </div>
        </a>
    `;
}

// Táº¡o nÃºt xem thÃªm
function createViewMoreButton(categoryId) {
    return `
        <div class="flex justify-center mt-8">
            <a href="products.html${categoryId ? '?category=' + categoryId : ''}" 
               class="inline-flex items-center gap-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-8 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1">
                <span>Xem thÃªm sáº£n pháº©m</span>
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                </svg>
            </a>
        </div>
    `;
}

// Default placeholder image
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300"%3E%3Crect fill="%23f3f4f6" width="300" height="300"/%3E%3Ctext fill="%239ca3af" font-family="Arial" font-size="14" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EKhÃ´ng cÃ³ áº£nh%3C/text%3E%3C/svg%3E';

// Helper function to get full image URL
function getProductImageUrl(imagePath) {
    if (!imagePath) return PLACEHOLDER_IMAGE;
    if (imagePath.startsWith('http')) return imagePath;
    if (imagePath.startsWith('data:')) return imagePath;
    // Xá»­ lÃ½ Ä‘Æ°á»ng dáº«n tá»« database (cÃ³ thá»ƒ báº¯t Ä‘áº§u báº±ng / hoáº·c khÃ´ng)
    const cleanPath = imagePath.startsWith('/') ? imagePath : '/' + imagePath;
    return `${API_URL.replace('/api', '')}${cleanPath}`;
}

// Format price
function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(price);
}

// Format date
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Change main image
function changeMainImage(imageUrl, element) {
    document.getElementById('mainImage').src = imageUrl;
    
    // Update active thumbnail
    document.querySelectorAll('.thumbnail-item').forEach(thumb => {
        thumb.classList.remove('border-red-600');
        thumb.classList.add('border-gray-200');
    });
    element.classList.remove('border-gray-200');
    element.classList.add('border-red-600');
}

// Quantity controls
function increaseQuantity() {
    const input = document.getElementById('quantity');
    const max = currentProduct?.so_luong || 99;
    const newValue = parseInt(input.value) + 1;
    
    // Kiá»ƒm tra sá»‘ lÆ°á»£ng > 5 thÃ¬ yÃªu cáº§u liÃªn há»‡ hotline
    if (newValue > 5) {
        showQuantityLimitModal();
        return;
    }
    
    if (newValue <= max) {
        input.value = newValue;
        currentQuantity = newValue;
    }
}

// Modal hiá»ƒn thá»‹ khi sá»‘ lÆ°á»£ng > 5
function showQuantityLimitModal() {
    const existingModal = document.getElementById('quantityLimitModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.id = 'quantityLimitModal';
    modal.className = 'fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onclick="event.stopPropagation()">
            <div class="text-center">
                <svg class="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Thông báo đặt hàng số lượng lớn</h3>
                <p class="text-gray-600 mb-4">Để đặt mua số lượng trên 5 sản phẩm, vui lòng liên hệ trực tiếp với cửa hàng để được hỗ trợ giá tốt nhất!</p>
                <div class="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 mb-4">
                    <p class="text-lg font-bold text-yellow-700">📞 Hotline: 0335162856</p>
                    <p class="text-sm text-yellow-600 mt-1">Hỗ trợ 8:00 - 21:30 hàng ngày</p>
                </div>
                <div class="flex gap-3">
                    <button onclick="closeQuantityLimitModal()" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition">
                        Đóng
                    </button>
                    <a href="tel:0335162856" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center inline-flex items-center justify-center gap-2">
                        <span>📞</span> Gọi ngay
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            closeQuantityLimitModal();
        }
    });
}

function closeQuantityLimitModal() {
    const modal = document.getElementById('quantityLimitModal');
    if (modal) modal.remove();
}

function decreaseQuantity() {
    const input = document.getElementById('quantity');
    if (parseInt(input.value) > 1) {
        input.value = parseInt(input.value) - 1;
        currentQuantity = parseInt(input.value);
    }
}

// Tab switching
function switchTab(tabName) {
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Remove active from all tabs
    document.querySelectorAll('.tab-btn').forEach(tab => {
        tab.classList.remove('active', 'border-red-600', 'text-red-600');
        tab.classList.add('border-transparent');
    });
    
    // Show selected content
    document.getElementById(`content-${tabName}`).classList.remove('hidden');
    
    // Activate selected tab
    const activeTab = document.getElementById(`tab-${tabName}`);
    activeTab.classList.add('active', 'border-red-600', 'text-red-600');
    activeTab.classList.remove('border-transparent');
}


// Hien thi yeu cau dang nhap
function showLoginRequired() {
    // Xoa modal cu neu co
    const existingModal = document.getElementById('loginRequiredModal');
    if (existingModal) existingModal.remove();
    
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4';
    modal.id = 'loginRequiredModal';
    modal.innerHTML = `
        <div class="bg-white rounded-xl p-6 max-w-md w-full shadow-2xl" onclick="event.stopPropagation()">
            <div class="text-center">
                <svg class="w-16 h-16 mx-auto text-yellow-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <h3 class="text-xl font-bold text-gray-900 mb-2">Yêu cầu đăng nhập</h3>
                <p class="text-gray-600 mb-6">Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng</p>
                <div class="flex gap-3">
                    <button id="closeLoginModalBtn" class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-4 rounded-lg transition">
                        Để sau
                    </button>
                    <a href="login.html" class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition text-center inline-flex items-center justify-center">
                        Đăng nhập
                    </a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Them event listener cho nut dong
    document.getElementById('closeLoginModalBtn').addEventListener('click', function() {
        modal.remove();
    });
    
    // Dong modal khi click ben ngoai
    modal.addEventListener('click', function(e) {
        if (e.target === modal) {
            modal.remove();
        }
    });
}

// Dong modal dang nhap (giu lai de tuong thich)
function closeLoginModal() {
    const modal = document.getElementById('loginRequiredModal');
    if (modal) modal.remove();
}

// Chuyen den trang dang nhap (giu lai de tuong thich)
function goToLoginPage() {
    window.location.href = 'login.html';
}

// Add to cart from detail page
function addToCartFromDetail() {
    // Kiem tra dang nhap
    if (!isLoggedIn()) {
        showLoginRequired();
        return;
    }
    
    if (!currentProduct) return;
    
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    
    // Kiá»ƒm tra sá»‘ lÆ°á»£ng > 5 thÃ¬ yÃªu cáº§u liÃªn há»‡ hotline
    if (quantity > 5) {
        showQuantityLimitModal();
        return;
    }
    
    // Kiá»ƒm tra giÃ¡ khÃ´ng Ã¢m
    if (currentProduct.gia < 0) {
        showNotification('Lá»—i: GiÃ¡ sáº£n pháº©m khÃ´ng há»£p lá»‡!');
        return;
    }
    
    const cartKey = getCartKey();
    
    // Get cart from localStorage
    let cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    
    // Check if product already in cart
    const existingItem = cart.find(item => item.ma_san_pham === currentProduct.ma_san_pham);
    
    if (existingItem) {
        const newQuantity = (parseInt(existingItem.so_luong) || 0) + quantity;
        
        // Kiá»ƒm tra tá»•ng sá»‘ lÆ°á»£ng > 5
        if (newQuantity > 5) {
            showQuantityLimitModal();
            return;
        }
        
        existingItem.so_luong = newQuantity;
    } else {
        cart.push({
            ma_san_pham: currentProduct.ma_san_pham,
            ten_san_pham: currentProduct.ten_san_pham,
            gia: Math.max(0, currentProduct.gia), // Äáº£m báº£o giÃ¡ khÃ´ng Ã¢m
            anh_chinh: getProductImageUrl(currentProduct.images?.[0]?.duong_dan_anh),
            so_luong: parseInt(quantity) || 1
        });
    }
    
    // Save to localStorage
    localStorage.setItem(cartKey, JSON.stringify(cart));
    
    // Update cart badge
    updateCartBadge();
    
    // Show notification
    showNotification(`Đã thêm ${quantity} sản phẩm vào giỏ hàng!`);
}

// Buy now
function buyNow() {
    // Kiem tra dang nhap truoc
    if (!isLoggedIn()) {
        showLoginRequired();
        return;
    }
    addToCartFromDetail();
    window.location.href = 'cart.html';
}

// Add to wishlist
function addToWishlist() {
    showNotification('Đã thêm vào danh sách yêu thích!');
}

// Share product
function shareProduct() {
    if (navigator.share) {
        navigator.share({
            title: currentProduct?.ten_san_pham,
            url: window.location.href
        });
    } else {
        // Copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        showNotification('Đã sao chép link sản phẩm!');
    }
}

// Image modal
function openImageModal() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    modalImage.src = document.getElementById('mainImage').src;
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeImageModal() {
    document.getElementById('imageModal').classList.add('hidden');
    document.body.style.overflow = '';
}

// Close modal on escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeImageModal();
    }
});

// Update cart badge
function updateCartBadge() {
    const cartKey = getCartKey();
    const cart = JSON.parse(localStorage.getItem(cartKey) || '[]');
    const totalItems = cart.reduce((sum, item) => sum + (parseInt(item.so_luong) || 0), 0);
    
    document.querySelectorAll('.cart-badge').forEach(badge => {
        badge.textContent = totalItems || 0;
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

// Show error
function showError(message) {
    document.querySelector('main').innerHTML = `
        <div class="max-w-7xl mx-auto px-4 py-20 text-center">
            <svg class="w-24 h-24 mx-auto text-red-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <h2 class="text-2xl font-bold text-gray-700 mb-2">${message}</h2>
            <p class="text-gray-500 mb-6">Vui lÃ²ng thá»­ láº¡i hoáº·c quay vá» trang sáº£n pháº©m</p>
            <a href="products.html" class="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                Xem táº¥t cáº£ sáº£n pháº©m
            </a>
        </div>
    `;
}

// Mobile menu toggle
function toggleMobileMenu() {
    const mobileMenu = document.getElementById('mobileMenu');
    if (mobileMenu) {
        mobileMenu.classList.toggle('hidden');
    }
}

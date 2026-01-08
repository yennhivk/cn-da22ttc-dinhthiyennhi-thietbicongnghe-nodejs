// Flash Sale - Giờ Vàng Giá Sốc
// Hiển thị sản phẩm flash sale đang diễn ra trên trang chủ

async function loadFlashSaleProducts() {
    try {
        const response = await fetch('http://localhost:3300/api/products/flash-sale');
        const data = await response.json();
        
        if (data.success && data.data.length > 0) {
            renderFlashSaleSection(data.data);
        } else {
            // Không có flash sale, ẩn section
            const section = document.getElementById('flash-sale-section');
            if (section) section.style.display = 'none';
        }
    } catch (error) {
        console.error('Load flash sale error:', error);
        const section = document.getElementById('flash-sale-section');
        if (section) section.style.display = 'none';
    }
}

function renderFlashSaleSection(products) {
    const section = document.getElementById('flash-sale-section');
    if (!section) return;
    
    section.style.display = 'block';
    
    const container = document.getElementById('flash-sale-products');
    if (!container) return;
    
    const html = products.map(product => {
        const discount = product.phan_tram_giam;
        const endTime = new Date(product.thoi_gian_ket_thuc);
        const now = new Date();
        const timeLeft = Math.floor((endTime - now) / 1000); // seconds
        
        // Tính thời gian còn lại
        const hours = Math.floor(timeLeft / 3600);
        const minutes = Math.floor((timeLeft % 3600) / 60);
        const seconds = timeLeft % 60;
        
        const remaining = product.so_luong_gioi_han ? 
            product.so_luong_gioi_han - product.so_luong_da_ban : null;
        const soldPercent = product.so_luong_gioi_han ? 
            Math.round((product.so_luong_da_ban / product.so_luong_gioi_han) * 100) : 0;
        
        return `
            <div class="flash-sale-card bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all border-2 border-red-200">
                <div class="relative">
                    <img src="${product.anh_chinh || 'images/placeholder.png'}" 
                         alt="${product.ten_san_pham}" 
                         class="w-full h-48 object-cover">
                    <div class="absolute top-2 left-2 bg-red-600 text-white px-3 py-1 rounded-full font-bold text-lg shadow-lg">
                        -${discount}%
                    </div>
                    <div class="absolute top-2 right-2 bg-yellow-400 text-red-600 px-2 py-1 rounded text-xs font-bold animate-pulse">
                        🔥 HOT
                    </div>
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-gray-800 mb-2 line-clamp-2 h-12" title="${product.ten_san_pham}">
                        ${product.ten_san_pham}
                    </h3>
                    
                    <div class="flex items-center gap-2 mb-3">
                        <span class="text-2xl font-bold text-red-600">${formatPrice(product.gia_sale)}</span>
                        <span class="text-sm text-gray-500 line-through">${formatPrice(product.gia_goc)}</span>
                    </div>
                    
                    ${product.so_luong_gioi_han ? `
                    <div class="mb-3">
                        <div class="flex justify-between text-xs text-gray-600 mb-1">
                            <span>Đã bán: ${product.so_luong_da_ban}/${product.so_luong_gioi_han}</span>
                            <span>${soldPercent}%</span>
                        </div>
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-red-500 h-2 rounded-full transition-all" style="width: ${soldPercent}%"></div>
                        </div>
                        ${remaining > 0 ? `<p class="text-xs text-orange-600 mt-1">⚡ Chỉ còn ${remaining} sản phẩm</p>` : ''}
                    </div>
                    ` : ''}
                    
                    <div class="bg-orange-50 border border-orange-200 rounded p-2 mb-3">
                        <p class="text-xs text-gray-600 mb-1">⏰ Kết thúc sau:</p>
                        <div class="flex gap-1 text-center">
                            <div class="flex-1 bg-red-600 text-white rounded py-1">
                                <div class="text-lg font-bold countdown-hours">${hours.toString().padStart(2, '0')}</div>
                                <div class="text-[10px]">Giờ</div>
                            </div>
                            <div class="flex-1 bg-red-600 text-white rounded py-1">
                                <div class="text-lg font-bold countdown-minutes">${minutes.toString().padStart(2, '0')}</div>
                                <div class="text-[10px]">Phút</div>
                            </div>
                            <div class="flex-1 bg-red-600 text-white rounded py-1">
                                <div class="text-lg font-bold countdown-seconds">${seconds.toString().padStart(2, '0')}</div>
                                <div class="text-[10px]">Giây</div>
                            </div>
                        </div>
                    </div>
                    
                    <a href="pages/product-detail.html?id=${product.ma_san_pham}" 
                       class="block w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white text-center py-2 rounded-lg font-bold transition-all">
                        MUA NGAY
                    </a>
                </div>
            </div>
        `;
    }).join('');
    
    container.innerHTML = html;
    
    // Start countdown timers
    startCountdowns();
}

function startCountdowns() {
    setInterval(() => {
        document.querySelectorAll('.flash-sale-card').forEach((card, index) => {
            const hoursEl = card.querySelector('.countdown-hours');
            const minutesEl = card.querySelector('.countdown-minutes');
            const secondsEl = card.querySelector('.countdown-seconds');
            
            if (!hoursEl || !minutesEl || !secondsEl) return;
            
            let hours = parseInt(hoursEl.textContent);
            let minutes = parseInt(minutesEl.textContent);
            let seconds = parseInt(secondsEl.textContent);
            
            seconds--;
            
            if (seconds < 0) {
                seconds = 59;
                minutes--;
            }
            
            if (minutes < 0) {
                minutes = 59;
                hours--;
            }
            
            if (hours < 0) {
                // Flash sale ended, reload page
                location.reload();
                return;
            }
            
            hoursEl.textContent = hours.toString().padStart(2, '0');
            minutesEl.textContent = minutes.toString().padStart(2, '0');
            secondsEl.textContent = seconds.toString().padStart(2, '0');
        });
    }, 1000);
}

function formatPrice(price) {
    return new Intl.NumberFormat('vi-VN').format(price || 0) + 'đ';
}

// Load flash sale khi trang load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadFlashSaleProducts);
} else {
    loadFlashSaleProducts();
}

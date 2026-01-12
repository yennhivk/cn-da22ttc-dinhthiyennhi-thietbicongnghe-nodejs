// Dynamic Navigation Categories Loader
const NAV_API_BASE = 'http://localhost:3300/api';

function getCategorySlugFromName(name) {
    const slugMap = {
        'Laptop': 'laptop',
        'PC Gaming': 'pc-gaming',
        'Màn hình': 'man-hinh',
        'CPU VGA': 'cpu-vga',
        'Case Nguồn': 'case-nguon',
        'Phụ kiện': 'phu-kien',
        'Tai nghe': 'tai-nghe',
        'Điện thoại': 'dien-thoai',
        'Điện máy': 'dien-may',
        'Ốp lưng': 'op-lung',
        'Chuột, Bàn phím': 'chuot-ban-phim'
    };
    return slugMap[name] || name.toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd').replace(/Đ/g, 'D')
        .replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
}

async function loadNavCategories() {
    const container = document.getElementById('dynamic-nav-categories');
    if (!container) return;
    
    // Detect if we're in pages folder or root
    const isInPages = window.location.pathname.includes('/pages/');
    const productsPath = isInPages ? 'products.html' : 'pages/products.html';
    
    try {
        const response = await fetch(`${NAV_API_BASE}/products/categories/all`);
        const result = await response.json();
        
        if (result.success && result.data) {
            const categories = result.data;
            let html = '';
            
            categories.forEach((cat, index) => {
                const slug = getCategorySlugFromName(cat.ten_danh_muc);
                if (index === 0) {
                    html += `<a href="${productsPath}?category=${slug}" class="nav-menu-blink flex items-center gap-1 text-base font-bold text-red-500 hover:text-blue-600 transition">
                        <span class="lightning-blink text-yellow-400">⚡</span>
                        <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path></svg>
                        ${cat.ten_danh_muc}
                    </a>`;
                } else {
                    html += `<a href="${productsPath}?category=${slug}" class="nav-menu-blink text-base font-bold text-red-500 hover:text-blue-600 transition">
                        <span class="lightning-blink text-yellow-400">⚡</span> ${cat.ten_danh_muc}
                    </a>`;
                }
            });
            
            container.innerHTML = html;
        }
    } catch (error) {
        console.error('Error loading nav categories:', error);
        // Fallback to static links
        container.innerHTML = `
            <a href="${productsPath}?category=laptop" class="nav-menu-blink text-base font-bold text-red-500 hover:text-blue-600 transition"><span class="lightning-blink text-yellow-400">⚡</span> Laptop</a>
            <a href="${productsPath}?category=pc-gaming" class="nav-menu-blink text-base font-bold text-red-500 hover:text-blue-600 transition"><span class="lightning-blink text-yellow-400">⚡</span> PC Gaming</a>
            <a href="${productsPath}?category=man-hinh" class="nav-menu-blink text-base font-bold text-red-500 hover:text-blue-600 transition"><span class="lightning-blink text-yellow-400">⚡</span> Màn hình</a>
        `;
    }
}

// Auto-load when DOM is ready
document.addEventListener('DOMContentLoaded', loadNavCategories);

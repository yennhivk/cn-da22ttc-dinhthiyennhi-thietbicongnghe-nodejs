// Articles API Configuration
const ARTICLES_API_URL = 'http://localhost:3000/api/articles';

// Biáº¿n lÆ°u táº¥t cáº£ bÃ i viáº¿t Ä‘á»ƒ Ä‘áº¿m theo danh má»¥c
let allArticlesData = [];
let currentPage = 1;
let currentCategory = '';
let currentSearch = '';

// Format thá»i gian
function formatTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays < 7) return `${diffDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: 'long', year: 'numeric' });
}

// Láº¥y tÃªn danh má»¥c
function getCategoryName(category) {
    const names = {
        'huong_dan': '📚 Hướng dẫn',
        'danh_gia': '⭐ Đánh giá',
        'meo_vat': '💡 Mẹo vặt',
        'so_sanh': '⚖️ So sánh'
    };
    return names[category] || category;
}

// Láº¥y mÃ u badge danh má»¥c
function getCategoryBadgeColor(category) {
    const colors = {
        'huong_dan': 'bg-blue-100 text-blue-700',
        'danh_gia': 'bg-yellow-100 text-yellow-700',
        'meo_vat': 'bg-green-100 text-green-700',
        'so_sanh': 'bg-purple-100 text-purple-700'
    };
    return colors[category] || 'bg-gray-100 text-gray-700';
}

// Load sá»‘ lÆ°á»£ng bÃ i viáº¿t theo danh má»¥c
async function loadArticleCategoryCounts() {
    try {
        const response = await fetch(`${ARTICLES_API_URL}?limit=1000`);
        const result = await response.json();
        
        if (result.success && result.data) {
            allArticlesData = result.data;
            updateArticleCategoryCounts();
        }
    } catch (error) {
        console.error('Lỗi load article category counts:', error);
    }
}

// Cáº­p nháº­t sá»‘ lÆ°á»£ng bÃ i viáº¿t theo danh má»¥c
function updateArticleCategoryCounts() {
    const categoryCounts = {};
    let totalCount = allArticlesData.length;
    
    allArticlesData.forEach(article => {
        const category = article.danh_muc || 'khac';
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    
    // Cáº­p nháº­t sá»‘ liá»‡u trÃªn giao diá»‡n
    const categoryCountElements = document.querySelectorAll('.article-category-count');
    categoryCountElements.forEach(el => {
        const categoryName = el.getAttribute('data-category');
        if (categoryName === 'all') {
            el.textContent = `(${totalCount})`;
        } else if (categoryCounts[categoryName] !== undefined) {
            el.textContent = `(${categoryCounts[categoryName]})`;
        } else {
            el.textContent = '(0)';
        }
    });
    
    console.log('📊 Article category counts:', categoryCounts);
}

// Load táº¥t cáº£ bÃ i viáº¿t
async function loadArticles(page = 1, category = '', search = '') {
    try {
        let url = `${ARTICLES_API_URL}?page=${page}&limit=9`;
        
        if (category) {
            url += `&category=${encodeURIComponent(category)}`;
        }
        
        if (search) {
            url += `&search=${encodeURIComponent(search)}`;
        }

        console.log('🔍 Loading articles with URL:', url);

        const response = await fetch(url);
        const result = await response.json();
        
        console.log('📝 Articles API Response:', result);

        const container = document.getElementById('articlesGrid');
        if (!container) return;

        if (!result.success || result.data.length === 0) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">📰</div>
                    <p class="text-gray-500 text-lg font-semibold">Không tìm thấy bài viết nào</p>
                    <p class="text-gray-400 text-sm mt-2">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                </div>
            `;
            updateSearchInfo(0, search, category);
            return;
        }

        container.innerHTML = result.data.map(article => `
            <article class="article-card bg-white rounded-xl shadow-md overflow-hidden group cursor-pointer" onclick="window.location.href='article-detail.html?id=${article.ma_bai_viet}'">
                <div class="relative h-48 overflow-hidden">
                    <img src="${article.hinh_anh || 'https://via.placeholder.com/400x200?text=Bai+viet'}" alt="${article.tieu_de}" class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" onerror="this.src='https://via.placeholder.com/400x200?text=Bai+viet'">
                    <span class="absolute top-3 left-3 ${getCategoryBadgeColor(article.danh_muc)} px-3 py-1 rounded-full text-xs font-bold">${getCategoryName(article.danh_muc)}</span>
                </div>
                <div class="p-4">
                    <div class="flex items-center gap-2 text-xs text-gray-500 mb-2">
                        <span>📅 ${formatTimeAgo(article.ngay_tao)}</span>
                        <span>•</span>
                        <span>👁️ ${article.luot_xem || 0} lượt xem</span>
                    </div>
                    <h3 class="font-bold text-base mb-2 text-gray-800 line-clamp-2 group-hover:text-indigo-600 transition">${article.tieu_de}</h3>
                    <p class="text-gray-600 text-sm mb-3 line-clamp-2">${article.mo_ta_ngan || ''}</p>
                    <div class="flex items-center justify-between">
                        <span class="text-xs text-gray-400">✍️ ${article.tac_gia || 'Admin'}</span>
                        <a href="article-detail.html?id=${article.ma_bai_viet}" class="inline-flex items-center gap-1 text-indigo-600 font-semibold text-sm hover:text-indigo-700">
                            Đọc thêm <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                        </a>
                    </div>
                </div>
            </article>
        `).join('');

        // Update pagination
        updatePagination(result.pagination);

        // Update search info
        updateSearchInfo(result.pagination.total, search, category);
    } catch (error) {
        console.error('Lỗi load bài viết:', error);
        const container = document.getElementById('articlesGrid');
        if (container) {
            container.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <div class="text-6xl mb-4">❌</div>
                    <p class="text-red-500 text-lg font-semibold">Lỗi tải bài viết</p>
                    <p class="text-gray-400 text-sm mt-2">Vui lòng thử lại sau</p>
                </div>
            `;
        }
    }
}

// Update pagination
function updatePagination(pagination) {
    const container = document.getElementById('articlesPagination');
    if (!container) return;

    const { page, totalPages } = pagination;
    let html = '';

    // Previous button
    html += `<button onclick="changePage(${page - 1})" ${page <= 1 ? 'disabled' : ''} class="px-4 py-2 rounded-lg ${page <= 1 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
    </button>`;

    // Page numbers
    for (let i = 1; i <= Math.min(totalPages, 5); i++) {
        html += `<button onclick="changePage(${i})" class="px-4 py-2 rounded-lg ${i === page ? 'bg-indigo-600 text-white font-bold' : 'bg-white text-gray-700 hover:bg-gray-100'} transition font-semibold">${i}</button>`;
    }

    // Next button
    html += `<button onclick="changePage(${page + 1})" ${page >= totalPages ? 'disabled' : ''} class="px-4 py-2 rounded-lg ${page >= totalPages ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} transition">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
    </button>`;

    container.innerHTML = html;
}

// Update search info
function updateSearchInfo(total, search, category) {
    const container = document.getElementById('searchInfo');
    if (!container) return;

    let filterInfo = [];
    
    if (search) {
        filterInfo.push(`từ khóa <span class="font-bold text-blue-600">"${search}"</span>`);
    }
    
    if (category) {
        filterInfo.push(`danh mục <span class="font-bold text-green-600">${getCategoryName(category)}</span>`);
    }

    if (filterInfo.length > 0) {
        container.innerHTML = `Tìm thấy <span class="font-bold text-indigo-600">${total}</span> kết quả với ${filterInfo.join(', ')}`;
    } else {
        container.innerHTML = `Hiển thị <span class="font-bold text-indigo-600">${total}</span> bài viết`;
    }
}

// Change page
function changePage(page) {
    if (page < 1) return;
    currentPage = page;
    loadArticles(currentPage, currentCategory, currentSearch);
    window.scrollTo({ top: document.getElementById('articlesGrid').offsetTop - 100, behavior: 'smooth' });
}

// Filter by category
function updateCategoryFilter() {
    const selectedRadio = document.querySelector('.category-radio:checked');
    currentCategory = selectedRadio ? selectedRadio.value : '';
    currentPage = 1;
    loadArticles(currentPage, currentCategory, currentSearch);
    
    // Highlight selected category
    document.querySelectorAll('.category-radio').forEach(radio => {
        const label = radio.closest('label');
        if (radio.checked) {
            label.classList.add('bg-indigo-50', 'border-indigo-200');
            label.classList.remove('hover:bg-gray-50');
        } else {
            label.classList.remove('bg-indigo-50', 'border-indigo-200');
            label.classList.add('hover:bg-gray-50');
        }
    });
}

// Search articles
function searchArticles(query) {
    currentSearch = query;
    currentPage = 1;
    loadArticles(currentPage, currentCategory, currentSearch);
}

// Reset all filters
function resetFilters() {
    currentPage = 1;
    currentCategory = '';
    currentSearch = '';
    
    const searchInput = document.getElementById('articleSearchInput');
    if (searchInput) searchInput.value = '';
    
    const allCategoryRadio = document.querySelector('.category-radio[value=""]');
    if (allCategoryRadio) allCategoryRadio.checked = true;
    
    document.querySelectorAll('.category-radio').forEach(radio => {
        const label = radio.closest('label');
        if (radio.value === '') {
            label.classList.add('bg-indigo-50', 'border-indigo-200');
            label.classList.remove('hover:bg-gray-50');
        } else {
            label.classList.remove('bg-indigo-50', 'border-indigo-200');
            label.classList.add('hover:bg-gray-50');
        }
    });
    
    loadArticles();
}

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadArticles();
    loadArticleCategoryCounts();

    // Setup search
    const searchInput = document.getElementById('articleSearchInput');
    if (searchInput) {
        let timeout;
        searchInput.addEventListener('input', function() {
            clearTimeout(timeout);
            timeout = setTimeout(() => searchArticles(this.value), 500);
        });
    }

    // Setup category filter
    const categoryRadios = document.querySelectorAll('.category-radio');
    categoryRadios.forEach(radio => {
        radio.addEventListener('change', updateCategoryFilter);
    });
    
    // Initial highlight
    const allCategoryRadio = document.querySelector('.category-radio[value=""]');
    if (allCategoryRadio) {
        const label = allCategoryRadio.closest('label');
        label.classList.add('bg-indigo-50', 'border-indigo-200');
    }
});

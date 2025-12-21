/**
 * Search Suggestions - Tìm kiếm gợi ý giống YouTube
 * Hiển thị dropdown gợi ý sản phẩm khi người dùng gõ vào thanh tìm kiếm
 */

(function() {
    'use strict';
    
    const API_URL = 'http://localhost:3300/api';
    let debounceTimer = null;
    let currentFocus = -1;
    
    // Khởi tạo khi DOM ready
    document.addEventListener('DOMContentLoaded', initSearchSuggestions);
    
    function initSearchSuggestions() {
        // Tìm tất cả các input tìm kiếm
        const searchInputs = document.querySelectorAll('#searchInput, #headerSearch, #mobileSearchInput');
        
        searchInputs.forEach(input => {
            if (!input) return;
            
            // Tạo container cho dropdown
            createSuggestionsDropdown(input);
            
            // Lắng nghe sự kiện input
            input.addEventListener('input', handleInput);
            input.addEventListener('keydown', handleKeydown);
            input.addEventListener('focus', handleFocus);
        });
        
        // Đóng dropdown khi click ra ngoài
        document.addEventListener('click', handleClickOutside);
    }
    
    function createSuggestionsDropdown(input) {
        // Tìm parent container của input
        const parent = input.parentElement;
        parent.style.position = 'relative';
        
        // Tạo dropdown container
        const dropdown = document.createElement('div');
        dropdown.className = 'search-suggestions-dropdown';
        dropdown.id = `suggestions-${input.id}`;
        dropdown.innerHTML = '';
        dropdown.style.cssText = `
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-radius: 0 0 12px 12px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.15);
            max-height: 480px;
            overflow-y: auto;
            z-index: 9999;
            display: none;
            margin-top: 2px;
        `;
        
        parent.appendChild(dropdown);
    }
    
    function handleInput(e) {
        const input = e.target;
        const query = input.value.trim();
        
        // Clear timer cũ
        if (debounceTimer) clearTimeout(debounceTimer);
        
        if (query.length < 1) {
            hideDropdown(input);
            return;
        }
        
        // Debounce 300ms
        debounceTimer = setTimeout(() => {
            fetchSuggestions(input, query);
        }, 300);
    }
    
    function handleKeydown(e) {
        const input = e.target;
        const dropdown = document.getElementById(`suggestions-${input.id}`);
        if (!dropdown) return;
        
        const items = dropdown.querySelectorAll('.suggestion-item');
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            if (currentFocus >= items.length) currentFocus = 0;
            setActiveSuggestion(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            if (currentFocus < 0) currentFocus = items.length - 1;
            setActiveSuggestion(items);
        } else if (e.key === 'Enter') {
            if (currentFocus > -1 && items[currentFocus]) {
                e.preventDefault();
                items[currentFocus].click();
            }
        } else if (e.key === 'Escape') {
            hideDropdown(input);
        }
    }
    
    function handleFocus(e) {
        const input = e.target;
        if (input.value.trim().length >= 1) {
            fetchSuggestions(input, input.value.trim());
        }
    }
    
    function handleClickOutside(e) {
        const dropdowns = document.querySelectorAll('.search-suggestions-dropdown');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(e.target) && !e.target.matches('#searchInput, #headerSearch, #mobileSearchInput')) {
                dropdown.style.display = 'none';
            }
        });
    }
    
    function setActiveSuggestion(items) {
        items.forEach((item, index) => {
            if (index === currentFocus) {
                item.classList.add('bg-gray-100');
                item.scrollIntoView({ block: 'nearest' });
            } else {
                item.classList.remove('bg-gray-100');
            }
        });
    }

    async function fetchSuggestions(input, query) {
        try {
            const response = await fetch(`${API_URL}/search/suggestions?q=${encodeURIComponent(query)}&limit=8`);
            const result = await response.json();
            
            if (result.success && result.data.length > 0) {
                showSuggestions(input, result.data, query);
            } else {
                hideDropdown(input);
            }
        } catch (error) {
            console.error('Lỗi tìm kiếm gợi ý:', error);
            hideDropdown(input);
        }
    }
    
    function showSuggestions(input, products, query) {
        const dropdown = document.getElementById(`suggestions-${input.id}`);
        if (!dropdown) return;
        
        currentFocus = -1;
        
        // Xác định đường dẫn base dựa trên vị trí trang hiện tại
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '' : 'pages/';
        const apiBasePath = API_URL.replace('/api', '');
        
        let html = `
            <div class="p-3 border-b border-gray-100">
                <div class="flex items-center gap-2 text-sm text-gray-500">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <span>Kết quả cho "<strong class="text-gray-700">${escapeHtml(query)}</strong>"</span>
                </div>
            </div>
        `;
        
        products.forEach((product, index) => {
            const imageUrl = getImageUrl(product.anh_chinh, apiBasePath);
            const price = formatPrice(product.gia);
            const highlightedName = highlightMatch(product.ten_san_pham, query);
            
            html += `
                <div class="suggestion-item flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50"
                     onclick="goToProduct(${product.ma_san_pham})"
                     data-index="${index}">
                    <div class="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        <img src="${imageUrl}" 
                             alt="${escapeHtml(product.ten_san_pham)}" 
                             class="w-full h-full object-contain"
                             onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E'">
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="font-medium text-gray-800 text-sm line-clamp-2">${highlightedName}</div>
                        <div class="flex items-center gap-2 mt-1">
                            <span class="text-red-600 font-bold text-sm">${price}</span>
                            ${product.ten_danh_muc ? `<span class="text-xs text-gray-400">• ${escapeHtml(product.ten_danh_muc)}</span>` : ''}
                        </div>
                    </div>
                    <svg class="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </div>
            `;
        });
        
        // Nút xem tất cả kết quả
        html += `
            <div class="p-3 bg-gray-50 rounded-b-xl">
                <button onclick="searchAll('${escapeHtml(query)}')" 
                        class="w-full flex items-center justify-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm py-2 hover:bg-blue-50 rounded-lg transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    Xem tất cả kết quả cho "${escapeHtml(query)}"
                </button>
            </div>
        `;
        
        dropdown.innerHTML = html;
        dropdown.style.display = 'block';
    }
    
    function hideDropdown(input) {
        const dropdown = document.getElementById(`suggestions-${input.id}`);
        if (dropdown) {
            dropdown.style.display = 'none';
        }
        currentFocus = -1;
    }
    
    function getImageUrl(imagePath, apiBasePath) {
        if (!imagePath) return 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f3f4f6%22 width=%22100%22 height=%22100%22/%3E%3C/svg%3E';
        if (imagePath.startsWith('http')) return imagePath;
        return `${apiBasePath}/${imagePath}`;
    }
    
    function formatPrice(price) {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(price);
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function highlightMatch(text, query) {
        if (!query) return escapeHtml(text);
        const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
        return escapeHtml(text).replace(regex, '<mark class="bg-yellow-200 px-0.5 rounded">$1</mark>');
    }
    
    // Global functions
    window.goToProduct = function(productId) {
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '' : 'pages/';
        window.location.href = `${basePath}product-detail.html?id=${productId}`;
    };
    
    window.searchAll = function(query) {
        const isInPages = window.location.pathname.includes('/pages/');
        const basePath = isInPages ? '' : 'pages/';
        window.location.href = `${basePath}products.html?search=${encodeURIComponent(query)}`;
    };
})();

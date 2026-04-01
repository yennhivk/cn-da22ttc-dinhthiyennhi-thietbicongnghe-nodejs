const fs = require('fs');
const file = '../frontend/pages/payment-result.html';
let content = fs.readFileSync(file, 'utf8');

const viewBtnHTML = `<div class="space-y-3">
                        <!-- Nút xem hóa đơn -->
                        <button onclick="viewInvoice(\${orderId})" class="block w-full border border-blue-600 text-blue-600 hover:bg-blue-50 font-semibold py-3 rounded-lg transition flex justify-center items-center gap-2 mb-3">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                            </svg>
                            Xem hóa đơn
                        </button>`;

if (!content.includes('viewInvoice(${orderId})')) {
    content = content.replace('<div class="space-y-3">', viewBtnHTML);
}

// Thêm hàm viewInvoice
const viewInvoiceFunc = `
        async function viewInvoice(orderId) {
            if (!orderId) {
                alert('Không tìm thấy mã đơn hàng!');
                return;
            }
            
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    alert('Vui lòng đăng nhập để xem hóa đơn.');
                    return;
                }
                
                const btn = event.currentTarget;
                const originalContent = btn.innerHTML;
                btn.innerHTML = '<span class="animate-spin mr-2">🔄</span> Đang tải hóa đơn...';
                btn.disabled = true;

                const API_URL = 'http://localhost:3000/api';
                const response = await fetch(\`\${API_URL}/auth/my-orders/\${orderId}/invoice?action=view\`, {
                    headers: { 'Authorization': \`Bearer \${token}\` }
                });
                
                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(\`Mã lỗi: \${response.status}\`);
                }
                
                // Hiển thị PDF trong tab mới
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
                
                // Mở lại các nút
                setTimeout(() => window.URL.revokeObjectURL(url), 10000);
                
                btn.innerHTML = originalContent;
                btn.disabled = false;
            } catch (err) {
                console.error('View error:', err);
                alert('Có lỗi xảy ra khi xem hóa đơn! ' + err.message);
                
                const btn = event.currentTarget;
                btn.innerHTML = \`
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                    </svg>
                    Xem hóa đơn
                \`;
                btn.disabled = false;
            }
        }
`;

if (!content.includes('function viewInvoice(orderId)')) {
    content = content.replace('async function downloadInvoice(orderId) {', viewInvoiceFunc + '\n        async function downloadInvoice(orderId) {');
}

fs.writeFileSync(file, content);
console.log('Xong!');

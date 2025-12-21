// Chatbot Widget
(function() {
    // Determine if we're in pages folder
    const isInPages = window.location.pathname.includes('/pages/');
    const basePath = isInPages ? '../' : '';

    // Create chatbot HTML
    const chatbotHTML = `
    <div id="chatbot-container">
        <button id="chatbot-toggle" class="chatbot-toggle" title="Chat với chúng tôi">
            <svg id="chat-icon" class="w-7 h-7" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            <svg id="close-icon" class="chatbot-hidden" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
        </button>

        <div id="chatbot-window" class="chatbot-window chatbot-hidden">
            <div class="chatbot-header">
                <div style="display:flex;align-items:center;gap:12px">
                    <div class="chatbot-avatar">
                        <img src="${basePath}images/Screenshot 2025-11-10 154306.png" alt="Bot">
                        <span class="online-dot"></span>
                    </div>
                    <div>
                        <h3 style="font-weight:bold;color:white;margin:0">Yến Nhi Tech</h3>
                        <p style="font-size:12px;color:#fef3c7;margin:0">Hỗ trợ trực tuyến</p>
                    </div>
                </div>
                <button id="chatbot-minimize" style="background:none;border:none;color:white;cursor:pointer">
                    <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                    </svg>
                </button>
            </div>

            <div id="chatbot-messages" class="chatbot-messages">
                <div class="chat-message bot-message">
                    <div class="message-content">
                        <p>Xin chào! 👋 Tôi là trợ lý ảo của <strong>Yến Nhi Tech</strong>.</p>
                        <p style="margin-top:8px">Tôi có thể giúp bạn:</p>
                        <ul style="margin:4px 0 0 16px;list-style:disc;font-size:14px">
                            <li>Tư vấn sản phẩm</li>
                            <li>Kiểm tra đơn hàng</li>
                            <li>Hỗ trợ kỹ thuật</li>
                            <li>Thông tin khuyến mãi</li>
                        </ul>
                    </div>
                    <span class="message-time">Vừa xong</span>
                </div>
            </div>

            <div id="quick-replies" class="quick-replies">
                <button class="quick-reply-btn" data-message="Tôi muốn xem sản phẩm mới">🆕 Sản phẩm mới</button>
                <button class="quick-reply-btn" data-message="Có khuyến mãi gì không?">🎁 Khuyến mãi</button>
                <button class="quick-reply-btn" data-message="Kiểm tra đơn hàng">📦 Đơn hàng</button>
                <button class="quick-reply-btn" data-message="Tôi cần hỗ trợ">🆘 Hỗ trợ</button>
            </div>

            <div class="chatbot-input-area">
                <input type="text" id="chatbot-input" placeholder="Nhập tin nhắn..." autocomplete="off">
                <button id="chatbot-send" class="chatbot-send-btn" title="Gửi">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                </button>
            </div>
        </div>
    </div>`;

    // Insert chatbot into page
    document.body.insertAdjacentHTML('beforeend', chatbotHTML);

    // Get elements
    const toggle = document.getElementById('chatbot-toggle');
    const chatWindow = document.getElementById('chatbot-window');
    const minimize = document.getElementById('chatbot-minimize');
    const input = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send');
    const messages = document.getElementById('chatbot-messages');
    const quickReplies = document.querySelectorAll('.quick-reply-btn');
    const chatIcon = document.getElementById('chat-icon');
    const closeIcon = document.getElementById('close-icon');

    let isOpen = false;

    // Toggle chat window
    toggle.addEventListener('click', () => {
        isOpen = !isOpen;
        chatWindow.classList.toggle('chatbot-hidden', !isOpen);
        chatIcon.classList.toggle('chatbot-hidden', isOpen);
        closeIcon.classList.toggle('chatbot-hidden', !isOpen);
        if (isOpen) input.focus();
    });

    // Minimize button
    minimize.addEventListener('click', () => {
        isOpen = false;
        chatWindow.classList.add('chatbot-hidden');
        chatIcon.classList.remove('chatbot-hidden');
        closeIcon.classList.add('chatbot-hidden');
    });

    // Send message
    function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';
        showTyping();

        setTimeout(() => {
            hideTyping();
            const response = getBotResponse(text);
            addMessage(response, 'bot');
        }, 1000 + Math.random() * 1000);
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    // Quick replies
    quickReplies.forEach(btn => {
        btn.addEventListener('click', () => {
            input.value = btn.dataset.message;
            sendMessage();
        });
    });

    // Add message to chat
    function addMessage(text, type) {
        const div = document.createElement('div');
        div.className = `chat-message ${type}-message`;
        const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        div.innerHTML = `
            <div class="message-content"><p>${text}</p></div>
            <span class="message-time">${time}</span>
        `;
        messages.appendChild(div);
        messages.scrollTop = messages.scrollHeight;
    }

    // Typing indicator
    function showTyping() {
        const typing = document.createElement('div');
        typing.id = 'typing-indicator';
        typing.className = 'chat-message bot-message';
        typing.innerHTML = `<div class="message-content typing-indicator"><span></span><span></span><span></span></div>`;
        messages.appendChild(typing);
        messages.scrollTop = messages.scrollHeight;
    }

    function hideTyping() {
        const typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();
    }

    // Bot responses
    function getBotResponse(text) {
        const lower = text.toLowerCase();
        const productPage = basePath + 'pages/products.html';
        const promoPage = basePath + 'pages/promotions.html';
        const orderPage = basePath + 'pages/order-history.html';

        if (lower.includes('sản phẩm') || lower.includes('mới') || lower.includes('điện thoại') || lower.includes('laptop')) {
            return `📱 Chúng tôi có nhiều sản phẩm mới nhất từ các thương hiệu hàng đầu như Apple, Samsung, Xiaomi... Bạn có thể xem tại trang <a href="${productPage}" style="color:#d97706;text-decoration:underline">Sản phẩm</a> nhé!`;
        }
        
        if (lower.includes('khuyến mãi') || lower.includes('giảm giá') || lower.includes('sale')) {
            return `🎁 Hiện tại chúng tôi đang có nhiều chương trình khuyến mãi hấp dẫn! Giảm đến 50% cho nhiều sản phẩm. Xem chi tiết tại <a href="${promoPage}" style="color:#d97706;text-decoration:underline">Khuyến mãi</a>!`;
        }
        
        if (lower.includes('đơn hàng') || lower.includes('kiểm tra') || lower.includes('giao hàng')) {
            return `📦 Để kiểm tra đơn hàng, bạn vui lòng đăng nhập và vào mục <a href="${orderPage}" style="color:#d97706;text-decoration:underline">Đơn hàng của tôi</a>. Nếu cần hỗ trợ thêm, hãy liên hệ hotline: <strong>1900 1234</strong>`;
        }
        
        if (lower.includes('hỗ trợ') || lower.includes('giúp') || lower.includes('vấn đề')) {
            return '🆘 Tôi sẵn sàng hỗ trợ bạn! Bạn có thể:<br>• Gọi hotline: <strong>1900 1234</strong><br>• Email: support@yennhitech.vn<br>• Hoặc mô tả vấn đề của bạn, tôi sẽ cố gắng giúp đỡ!';
        }
        
        if (lower.includes('giá') || lower.includes('bao nhiêu')) {
            return `💰 Giá sản phẩm tùy thuộc vào từng mẫu. Bạn có thể xem giá chi tiết tại trang <a href="${productPage}" style="color:#d97706;text-decoration:underline">Sản phẩm</a>. Chúng tôi cam kết giá tốt nhất thị trường!`;
        }
        
        if (lower.includes('bảo hành')) {
            return '🛡️ Tất cả sản phẩm tại Yến Nhi Tech đều được bảo hành chính hãng:<br>• Điện thoại: 12-24 tháng<br>• Laptop: 12-36 tháng<br>• Phụ kiện: 6-12 tháng';
        }
        
        if (lower.includes('địa chỉ') || lower.includes('cửa hàng') || lower.includes('ở đâu')) {
            return '📍 Địa chỉ cửa hàng:<br><strong>Yến Nhi Tech</strong><br>123 Đường ABC, Quận XYZ, TP.HCM<br>Mở cửa: 8:00 - 21:00 hàng ngày';
        }
        
        if (lower.includes('xin chào') || lower.includes('hello') || lower.includes('hi')) {
            return 'Xin chào bạn! 👋 Rất vui được hỗ trợ bạn. Bạn cần tôi giúp gì ạ?';
        }
        
        if (lower.includes('cảm ơn') || lower.includes('thank')) {
            return 'Không có gì ạ! 😊 Rất vui được hỗ trợ bạn. Nếu cần thêm gì, đừng ngại hỏi nhé!';
        }
        
        return 'Cảm ơn bạn đã liên hệ! 😊 Tôi chưa hiểu rõ câu hỏi của bạn. Bạn có thể hỏi về:<br>• Sản phẩm mới<br>• Khuyến mãi<br>• Đơn hàng<br>• Bảo hành<br>Hoặc gọi hotline <strong>1900 1234</strong> để được hỗ trợ trực tiếp!';
    }
})();

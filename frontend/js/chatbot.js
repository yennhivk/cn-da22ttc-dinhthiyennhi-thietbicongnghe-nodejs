// Chatbot Widget with Groq AI
(function() {
    const GROQ_API_KEY = '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';
    const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
    
    // Determine if we're in pages folder
    const isInPages = window.location.pathname.includes('/pages/');
    const basePath = isInPages ? '../' : '';

    // System prompt for the AI
    const SYSTEM_PROMPT = `Bạn là trợ lý ảo của cửa hàng công nghệ "Yến Nhi Tech". Hãy trả lời ngắn gọn, thân thiện và hữu ích bằng tiếng Việt.

Thông tin về cửa hàng:
- Tên: Yến Nhi Tech
- Địa chỉ: 74-76 Lê Lợi, khóm 3, Trà Vinh
- Hotline: 1900 1234
- Email: support@yennhitech.vn
- Giờ mở cửa: 8:00 - 21:00 hàng ngày

Sản phẩm kinh doanh:
- Điện thoại: iPhone, Samsung, Xiaomi, OPPO, Vivo, Realme
- Laptop: MacBook, Dell, HP, Asus, Lenovo, Acer
- Phụ kiện: Tai nghe, sạc, ốp lưng, cường lực, chuột, bàn phím
- Điện máy: Tivi, máy lạnh, tủ lạnh, máy giặt

Chính sách:
- Bảo hành: Điện thoại 12-24 tháng, Laptop 12-36 tháng, Phụ kiện 6-12 tháng
- Đổi trả: 7 ngày đổi trả miễn phí nếu lỗi từ nhà sản xuất
- Giao hàng: Miễn phí trong nội thành, COD toàn quốc
- Thanh toán: Tiền mặt, chuyển khoản, Visa/Master, Momo, ZaloPay

Hãy trả lời ngắn gọn (tối đa 3-4 câu), thân thiện và sử dụng emoji phù hợp.`;

    // Conversation history
    let conversationHistory = [];

    // Create chatbot HTML
    const chatbotHTML = `
    <div id="chatbot-container">
        <button id="chatbot-toggle" class="chatbot-toggle" title="Chat với chúng tôi">
            <svg id="chat-icon" width="28" height="28" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                        <p style="font-size:12px;color:#fef3c7;margin:0">🤖 AI Hỗ trợ 24/7</p>
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
                        <p>Xin chào! 👋 Tôi là trợ lý AI của <strong>Yến Nhi Tech</strong>.</p>
                        <p style="margin-top:8px">Tôi có thể giúp bạn tư vấn sản phẩm, kiểm tra đơn hàng, hỗ trợ kỹ thuật và nhiều hơn nữa. Hãy hỏi tôi bất cứ điều gì! 😊</p>
                    </div>
                    <span class="message-time">Vừa xong</span>
                </div>
            </div>

            <div id="quick-replies" class="quick-replies">
                <button class="quick-reply-btn" data-message="Tư vấn điện thoại cho tôi">📱 Tư vấn ĐT</button>
                <button class="quick-reply-btn" data-message="Có khuyến mãi gì không?">🎁 Khuyến mãi</button>
                <button class="quick-reply-btn" data-message="Chính sách bảo hành">🛡️ Bảo hành</button>
                <button class="quick-reply-btn" data-message="Địa chỉ cửa hàng">📍 Địa chỉ</button>
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
    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        addMessage(text, 'user');
        input.value = '';
        input.disabled = true;
        sendBtn.disabled = true;
        
        showTyping();

        try {
            const response = await getAIResponse(text);
            hideTyping();
            addMessage(response, 'bot');
        } catch (error) {
            hideTyping();
            addMessage('Xin lỗi, tôi đang gặp sự cố. Vui lòng thử lại hoặc gọi hotline 1900 1234 để được hỗ trợ! 📞', 'bot');
            console.error('Chatbot error:', error);
        }
        
        input.disabled = false;
        sendBtn.disabled = false;
        input.focus();
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
        
        // Convert markdown-like formatting to HTML
        let formattedText = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\n/g, '<br>');
        
        div.innerHTML = `
            <div class="message-content"><p>${formattedText}</p></div>
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

    // Get AI response from Groq
    async function getAIResponse(userMessage) {
        // Add user message to history
        conversationHistory.push({
            role: 'user',
            content: userMessage
        });

        // Keep only last 10 messages to avoid token limit
        if (conversationHistory.length > 10) {
            conversationHistory = conversationHistory.slice(-10);
        }

        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GROQ_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    ...conversationHistory
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const aiMessage = data.choices[0].message.content;

        // Add AI response to history
        conversationHistory.push({
            role: 'assistant',
            content: aiMessage
        });

        return aiMessage;
    }
})();

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const util = require('util');
const jwt = require('jsonwebtoken');

// Promisify database query
const query = util.promisify(db.query).bind(db);

// Groq AI Configuration
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

// Middleware xác thực token (optional - không bắt buộc đăng nhập)
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        req.user = null;
        return next();
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            req.user = null;
        } else {
            req.user = user;
        }
        next();
    });
};

// Middleware xác thực token (bắt buộc đăng nhập)
const requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Vui lòng đăng nhập để sử dụng tính năng này!'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'Token không hợp lệ hoặc đã hết hạn!'
            });
        }
        req.user = user;
        next();
    });
};

// System prompt cho chatbot Yến Nhi Tech
const SYSTEM_PROMPT = `Bạn là trợ lý AI của cửa hàng Yến Nhi Tech - chuyên bán điện thoại, laptop, điện máy và phụ kiện công nghệ.

THÔNG TIN CỬA HÀNG:
- Tên: Yến Nhi Tech
- Địa chỉ: 74-76 Lê Lợi, khóm 3, Trà Vinh
- Hotline mua hàng: 1900.5301 (8:00 - 21:30)
- Hotline bảo hành: 1900.5325 (8:00 - 21:00)
- Hotline khiếu nại: 1900.5310 (8:00 - 21:30)
- Email: support@yennhitech.vn
- Website: yennhitech.vn

CHÍNH SÁCH:
- Giao hàng toàn quốc, miễn phí trong nội thành Trà Vinh
- Bảo hành chính hãng 12-24 tháng
- Đổi trả trong 7 ngày nếu lỗi nhà sản xuất
- Hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng
- Thanh toán: Tiền mặt, chuyển khoản, thẻ tín dụng, Momo, ZaloPay

CÁCH TRẢ LỜI:
- Thân thiện, lịch sự, chuyên nghiệp
- Trả lời ngắn gọn, đúng trọng tâm (tối đa 150 từ)
- Sử dụng emoji phù hợp
- Nếu không biết thông tin chính xác về sản phẩm, hướng dẫn khách liên hệ hotline
- Luôn kết thúc bằng câu hỏi hỗ trợ thêm hoặc lời cảm ơn
- Trả lời bằng tiếng Việt`;

// Gửi tin nhắn đến chatbot AI
router.post('/send', optionalAuth, async (req, res) => {
    try {
        const { message, history = [], conversationId = null } = req.body;

        if (!message || message.trim().length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng nhập tin nhắn!'
            });
        }

        // Lấy userId từ token (nếu có)
        const userId = req.user?.ma_tai_khoan;

        // Kiểm tra API key
        if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
            // Fallback response nếu chưa có API key
            const fallbackReply = getFallbackResponse(message);
            
            // Lưu lịch sử chat vào database (nếu user đã đăng nhập)
            if (userId) {
                await saveChatHistory(userId, message, fallbackReply, conversationId);
            }
            
            return res.json({
                success: true,
                reply: fallbackReply,
                source: 'fallback'
            });
        }

        // Tạo messages array cho Groq API (OpenAI compatible)
        const messages = [
            {
                role: 'system',
                content: SYSTEM_PROMPT
            }
        ];

        // Thêm lịch sử chat
        history.forEach(h => {
            messages.push({
                role: h.role === 'user' ? 'user' : 'assistant',
                content: h.content
            });
        });

        // Thêm tin nhắn hiện tại
        messages.push({
            role: 'user',
            content: message
        });

        // Gọi Groq API
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 500,
                top_p: 0.95
            })
        });

        const data = await response.json();

        if (data.error) {
            console.error('Groq API Error:', data.error);
            return res.json({
                success: true,
                reply: getFallbackResponse(message),
                source: 'fallback'
            });
        }

        const reply = data.choices?.[0]?.message?.content || getFallbackResponse(message);

        // Lưu lịch sử chat vào database (nếu user đã đăng nhập)
        if (userId) {
            await saveChatHistory(userId, message, reply, conversationId);
        }

        res.json({
            success: true,
            reply: reply,
            source: 'groq'
        });

    } catch (error) {
        console.error('Chatbot error:', error);
        res.json({
            success: true,
            reply: getFallbackResponse(req.body.message),
            source: 'fallback'
        });
    }
});

// Fallback responses khi không có API key hoặc lỗi
function getFallbackResponse(message) {
    const lowerMessage = message.toLowerCase();

    // Chào hỏi
    if (lowerMessage.match(/xin chào|hello|hi|chào|hey/)) {
        return 'Xin chào! 👋 Chào mừng bạn đến với Yến Nhi Tech. Tôi có thể giúp gì cho bạn ạ?';
    }

    // Hỏi về sản phẩm
    if (lowerMessage.match(/iphone|điện thoại|phone|samsung|xiaomi|oppo/)) {
        return '📱 Yến Nhi Tech có đa dạng điện thoại chính hãng: iPhone, Samsung, Xiaomi, OPPO... với nhiều ưu đãi hấp dẫn! Bạn quan tâm dòng nào, để tôi tư vấn chi tiết ạ?';
    }

    if (lowerMessage.match(/laptop|macbook|dell|asus|lenovo|hp/)) {
        return '💻 Chúng tôi có nhiều laptop từ gaming đến văn phòng: MacBook, Dell, Asus, Lenovo, HP... Bạn cần laptop cho mục đích gì để tôi tư vấn phù hợp ạ?';
    }

    // Giá cả
    if (lowerMessage.match(/giá|bao nhiêu|price|tiền/)) {
        return '💰 Để báo giá chính xác, bạn vui lòng cho tôi biết sản phẩm cụ thể bạn quan tâm, hoặc liên hệ hotline 1900.5301 để được tư vấn chi tiết ạ!';
    }

    // Khuyến mãi
    if (lowerMessage.match(/khuyến mãi|giảm giá|sale|ưu đãi|promotion/)) {
        return '🎉 Hiện tại shop đang có nhiều chương trình khuyến mãi hấp dẫn! Bạn có thể xem tại trang Khuyến mãi trên website hoặc liên hệ hotline 1900.5301 để biết thêm chi tiết ạ!';
    }

    // Giao hàng
    if (lowerMessage.match(/giao hàng|ship|delivery|vận chuyển/)) {
        return '🚚 Yến Nhi Tech giao hàng toàn quốc! Miễn phí ship nội thành Trà Vinh. Thời gian giao hàng 1-3 ngày tùy khu vực. Bạn cần giao đến đâu ạ?';
    }

    // Bảo hành
    if (lowerMessage.match(/bảo hành|warranty|lỗi|hỏng|sửa/)) {
        return '🛡️ Sản phẩm tại Yến Nhi Tech được bảo hành chính hãng 12-24 tháng. Nếu cần hỗ trợ bảo hành, vui lòng liên hệ hotline 1900.5325 (8:00 - 21:00) ạ!';
    }

    // Địa chỉ
    if (lowerMessage.match(/địa chỉ|ở đâu|cửa hàng|shop|location/)) {
        return '📍 Yến Nhi Tech: 74-76 Lê Lợi, khóm 3, Trà Vinh. Mở cửa: 8:00 - 21:30 hàng ngày. Rất hân hạnh được đón tiếp bạn!';
    }

    // Liên hệ
    if (lowerMessage.match(/hotline|số điện thoại|liên hệ|contact|gọi/)) {
        return '📞 Hotline Yến Nhi Tech:\n• Mua hàng: 1900.5301 (8:00 - 21:30)\n• Bảo hành: 1900.5325 (8:00 - 21:00)\n• Khiếu nại: 1900.5310\n• Email: support@yennhitech.vn';
    }

    // Trả góp
    if (lowerMessage.match(/trả góp|installment|góp|0%/)) {
        return '💳 Yến Nhi Tech hỗ trợ trả góp 0% lãi suất qua thẻ tín dụng các ngân hàng. Bạn cần tư vấn thêm về điều kiện trả góp không ạ?';
    }

    // Thanh toán
    if (lowerMessage.match(/thanh toán|payment|chuyển khoản|momo|zalopay/)) {
        return '💵 Các hình thức thanh toán:\n• Tiền mặt khi nhận hàng (COD)\n• Chuyển khoản ngân hàng\n• Thẻ tín dụng/ghi nợ\n• Ví Momo, ZaloPay\nBạn muốn thanh toán theo hình thức nào ạ?';
    }

    // Cảm ơn
    if (lowerMessage.match(/cảm ơn|thank|thanks|tks/)) {
        return 'Không có gì ạ! 😊 Rất vui được hỗ trợ bạn. Nếu cần thêm thông tin gì, đừng ngại hỏi nhé!';
    }

    // Default response
    return 'Cảm ơn bạn đã liên hệ Yến Nhi Tech! 😊 Để được tư vấn chi tiết hơn, bạn vui lòng liên hệ hotline 1900.5301 hoặc cho tôi biết cụ thể bạn cần hỗ trợ về vấn đề gì ạ?';
}

// Lưu lịch sử chat vào database
async function saveChatHistory(userId, userMessage, botReply, conversationId = null) {
    try {
        let convId = conversationId;
        
        // Nếu không có conversationId, tạo cuộc hội thoại mới hoặc lấy cuộc hội thoại gần nhất
        if (!convId) {
            // Kiểm tra xem có cuộc hội thoại active nào không
            const existingConvSql = `
                SELECT ma_cuoc_hoi_thoai FROM cuoc_hoi_thoai_chatbot 
                WHERE ma_tai_khoan = ? AND trang_thai = 'hoat_dong' 
                ORDER BY ngay_cap_nhat DESC LIMIT 1
            `;
            const existingConv = await query(existingConvSql, [userId]);
            
            if (existingConv.length > 0) {
                convId = existingConv[0].ma_cuoc_hoi_thoai;
            } else {
                // Tạo cuộc hội thoại mới
                const createConvSql = `
                    INSERT INTO cuoc_hoi_thoai_chatbot (ma_tai_khoan, tieu_de)
                    VALUES (?, ?)
                `;
                // Lấy 20 ký tự đầu của tin nhắn làm tiêu đề
                const title = userMessage.substring(0, 50) + (userMessage.length > 50 ? '...' : '');
                const result = await query(createConvSql, [userId, title]);
                convId = result.insertId;
            }
        }
        
        // Lưu tin nhắn vào lịch sử
        const sql = `
            INSERT INTO lich_su_chatbot (ma_tai_khoan, ma_cuoc_hoi_thoai, cau_hoi, tra_loi, ngay_chat)
            VALUES (?, ?, ?, ?, NOW())
        `;
        
        await query(sql, [userId, convId, userMessage, botReply]);
        
        // Cập nhật thời gian cuộc hội thoại
        await query(`UPDATE cuoc_hoi_thoai_chatbot SET ngay_cap_nhat = NOW() WHERE ma_cuoc_hoi_thoai = ?`, [convId]);
        
        return convId;
    } catch (err) {
        console.error('Error saving chat history:', err);
        return null;
    }
}

// Lấy lịch sử chat của user
router.get('/history', optionalAuth, async (req, res) => {
    try {
        const userId = req.user?.ma_tai_khoan;
        
        if (!userId) {
            return res.json({
                success: true,
                history: []
            });
        }

        const sql = `
            SELECT cau_hoi as question, tra_loi as answer, ngay_chat as timestamp
            FROM lich_su_chatbot
            WHERE ma_tai_khoan = ?
            ORDER BY ngay_chat DESC
            LIMIT 50
        `;

        db.query(sql, [userId], (err, results) => {
            if (err) {
                console.error('Error fetching chat history:', err);
                return res.status(500).json({
                    success: false,
                    message: 'Có lỗi xảy ra!'
                });
            }

            res.json({
                success: true,
                history: results
            });
        });

    } catch (error) {
        console.error('Chat history error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

// ============ API QUẢN LÝ CUỘC HỘI THOẠI ============

// Lấy danh sách cuộc hội thoại của user
router.get('/conversations', requireAuth, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;

        const sql = `
            SELECT 
                c.ma_cuoc_hoi_thoai as id,
                c.tieu_de as title,
                c.ngay_tao as createdAt,
                c.ngay_cap_nhat as updatedAt,
                (SELECT COUNT(*) FROM lich_su_chatbot WHERE ma_cuoc_hoi_thoai = c.ma_cuoc_hoi_thoai) as messageCount
            FROM cuoc_hoi_thoai_chatbot c
            WHERE c.ma_tai_khoan = ? AND c.trang_thai = 'hoat_dong'
            ORDER BY c.ngay_cap_nhat DESC
            LIMIT 20
        `;

        const results = await query(sql, [userId]);

        res.json({
            success: true,
            conversations: results
        });

    } catch (error) {
        console.error('Get conversations error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

// Tạo cuộc hội thoại mới
router.post('/conversations', requireAuth, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;

        const { title = 'Cuộc hội thoại mới' } = req.body;

        const sql = `
            INSERT INTO cuoc_hoi_thoai_chatbot (ma_tai_khoan, tieu_de)
            VALUES (?, ?)
        `;

        const result = await query(sql, [userId, title]);

        res.json({
            success: true,
            conversation: {
                id: result.insertId,
                title: title,
                createdAt: new Date(),
                updatedAt: new Date(),
                messageCount: 0
            }
        });

    } catch (error) {
        console.error('Create conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

// Lấy tin nhắn của một cuộc hội thoại
router.get('/conversations/:id/messages', requireAuth, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;
        const conversationId = req.params.id;

        // Kiểm tra cuộc hội thoại có thuộc về user không
        const checkSql = `
            SELECT ma_cuoc_hoi_thoai FROM cuoc_hoi_thoai_chatbot 
            WHERE ma_cuoc_hoi_thoai = ? AND ma_tai_khoan = ? AND trang_thai = 'hoat_dong'
        `;
        const checkResult = await query(checkSql, [conversationId, userId]);
        
        if (checkResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc hội thoại!'
            });
        }

        const sql = `
            SELECT 
                ma_lich_su as id,
                cau_hoi as question,
                tra_loi as answer,
                ngay_chat as timestamp
            FROM lich_su_chatbot
            WHERE ma_cuoc_hoi_thoai = ?
            ORDER BY ngay_chat ASC
        `;

        const results = await query(sql, [conversationId]);

        res.json({
            success: true,
            messages: results
        });

    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

// Xóa cuộc hội thoại (soft delete)
router.delete('/conversations/:id', requireAuth, async (req, res) => {
    try {
        const userId = req.user.ma_tai_khoan;
        const conversationId = req.params.id;

        // Kiểm tra cuộc hội thoại có thuộc về user không
        const checkSql = `
            SELECT ma_cuoc_hoi_thoai FROM cuoc_hoi_thoai_chatbot 
            WHERE ma_cuoc_hoi_thoai = ? AND ma_tai_khoan = ?
        `;
        const checkResult = await query(checkSql, [conversationId, userId]);
        
        if (checkResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy cuộc hội thoại!'
            });
        }

        // Soft delete - đánh dấu đã xóa
        const sql = `
            UPDATE cuoc_hoi_thoai_chatbot 
            SET trang_thai = 'da_xoa' 
            WHERE ma_cuoc_hoi_thoai = ?
        `;

        await query(sql, [conversationId]);

        res.json({
            success: true,
            message: 'Đã xóa cuộc hội thoại!'
        });

    } catch (error) {
        console.error('Delete conversation error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra!'
        });
    }
});

// Kiểm tra trạng thái chatbot
router.get('/status', (req, res) => {
    res.json({
        success: true,
        aiEnabled: GROQ_API_KEY && GROQ_API_KEY !== 'your_groq_api_key_here',
        provider: 'Groq (Llama 3.3 70B)'
    });
});

module.exports = router;

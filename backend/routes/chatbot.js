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

        // Ưu tiên dùng fallback cho câu hỏi phổ biến (phản hồi nhanh)
        const quickResponse = getQuickResponse(message);
        if (quickResponse) {
            if (userId) {
                saveChatHistory(userId, message, quickResponse.text, conversationId);
            }
            return res.json({
                success: true,
                reply: quickResponse.text,
                images: quickResponse.images || [],
                source: 'quick'
            });
        }

        // Kiểm tra API key
        if (!GROQ_API_KEY || GROQ_API_KEY === 'your_groq_api_key_here') {
            // Fallback response nếu chưa có API key
            const fallbackResponse = getFallbackResponse(message);
            
            // Lưu lịch sử chat vào database (nếu user đã đăng nhập)
            if (userId) {
                await saveChatHistory(userId, message, fallbackResponse.text, conversationId);
            }
            
            return res.json({
                success: true,
                reply: fallbackResponse.text,
                images: fallbackResponse.images || [],
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

        // Gọi Groq API - sử dụng model nhanh hơn
        const response = await fetch(GROQ_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.1-8b-instant',  // Model nhỏ, phản hồi nhanh hơn
                messages: messages,
                temperature: 0.7,
                max_tokens: 300,  // Giảm để phản hồi nhanh hơn
                top_p: 0.9
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

// Quick responses cho câu hỏi phổ biến (phản hồi tức thì) - trả về object {text, images}
function getQuickResponse(message) {
    const lowerMessage = message.toLowerCase().trim();

    // Chào hỏi
    if (lowerMessage.match(/^(xin chào|hello|hi|chào|hey|alo|chào bạn|xin chao)$/i)) {
        return { text: 'Xin chào! 👋 Chào mừng bạn đến với Yến Nhi Tech. Tôi có thể giúp gì cho bạn ạ?', images: [] };
    }

    // Tư vấn sản phẩm chung
    if (lowerMessage.match(/^(tư vấn sản phẩm|tư vấn|muốn mua|cần mua|mua gì)$/i)) {
        return { text: '📱 Yến Nhi Tech có đa dạng sản phẩm:\n• Điện thoại: iPhone, Samsung, Xiaomi, OPPO...\n• Laptop: MacBook, Dell, Asus, Lenovo...\n• Tablet: iPad, Samsung Tab...\n• Phụ kiện: Tai nghe, sạc, ốp lưng...\n\nBạn đang quan tâm đến loại sản phẩm nào ạ?', images: [] };
    }

    // iPhone
    if (lowerMessage.match(/iphone|ip\s?\d+/i) && !lowerMessage.match(/^apple$/i)) {
        return {
            text: '🍎 iPhone tại Yến Nhi Tech:\n• iPhone 15 Pro Max: 29.990.000đ\n• iPhone 15 Pro: 25.990.000đ\n• iPhone 15: 19.990.000đ\n\n✅ Bảo hành 12 tháng | Trả góp 0%',
            images: [
                { url: 'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=120&h=120&fit=crop', name: 'iPhone 15 Pro Max', price: '29.990.000đ' },
                { url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=120&h=120&fit=crop', name: 'iPhone 15 Pro', price: '25.990.000đ' }
            ]
        };
    }

    // Samsung
    if (lowerMessage.match(/samsung|galaxy/i)) {
        return {
            text: '📱 Samsung tại Yến Nhi Tech:\n• Galaxy S24 Ultra: 27.990.000đ\n• Galaxy S24+: 22.990.000đ\n• Galaxy Z Flip: 25.990.000đ\n\n✅ Bảo hành 12 tháng | Trả góp 0%',
            images: [
                { url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=120&h=120&fit=crop', name: 'Galaxy S24 Ultra', price: '27.990.000đ' },
                { url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=120&h=120&fit=crop', name: 'Galaxy S24+', price: '22.990.000đ' }
            ]
        };
    }

    // Xiaomi
    if (lowerMessage.match(/xiaomi|redmi|poco/i)) {
        return {
            text: '📱 Xiaomi tại Yến Nhi Tech:\n• Xiaomi 14 Ultra: 23.990.000đ\n• Redmi Note 13: 4.490.000đ\n\n✅ Giá tốt nhất | Bảo hành 18 tháng',
            images: [
                { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=120&h=120&fit=crop', name: 'Xiaomi 14 Ultra', price: '23.990.000đ' }
            ]
        };
    }

    // Laptop/MacBook
    if (lowerMessage.match(/laptop|macbook|dell|asus|lenovo|hp|máy tính xách tay/i)) {
        return {
            text: '💻 Laptop tại Yến Nhi Tech:\n• MacBook Pro M3: 39.990.000đ\n• MacBook Air M3: 27.990.000đ\n• Dell XPS: 15.990.000đ\n\n✅ Bảo hành 12-24 tháng | Cài phần mềm miễn phí',
            images: [
                { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=120&h=120&fit=crop', name: 'MacBook Pro M3', price: '39.990.000đ' },
                { url: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=120&h=120&fit=crop', name: 'MacBook Air M3', price: '27.990.000đ' }
            ]
        };
    }

    // iPad/Tablet
    if (lowerMessage.match(/tablet|ipad|máy tính bảng/i)) {
        return {
            text: '📱 Tablet tại Yến Nhi Tech:\n• iPad Pro M4: 25.990.000đ\n• iPad Air M2: 15.990.000đ\n• iPad 10: 9.990.000đ\n\n✅ Tặng bao da, bút cảm ứng',
            images: [
                { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=120&h=120&fit=crop', name: 'iPad Pro M4', price: '25.990.000đ' }
            ]
        };
    }

    // Tai nghe
    if (lowerMessage.match(/tai nghe|airpods|headphone|earbuds/i)) {
        return {
            text: '🎧 Tai nghe tại Yến Nhi Tech:\n• AirPods Pro 2: 5.990.000đ\n• AirPods 3: 4.290.000đ\n• Samsung Buds: 2.490.000đ\n\n✅ Chính hãng 100%',
            images: [
                { url: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=120&h=120&fit=crop', name: 'AirPods Pro 2', price: '5.990.000đ' }
            ]
        };
    }

    // Apple chung
    if (lowerMessage.match(/apple/i)) {
        return {
            text: '🍎 Sản phẩm Apple tại Yến Nhi Tech:\n• iPhone 15 series: từ 19.990.000đ\n• MacBook: từ 27.990.000đ\n• iPad: từ 9.990.000đ\n• AirPods: từ 4.290.000đ\n\n✅ Chính hãng Apple Việt Nam',
            images: [
                { url: 'https://images.unsplash.com/photo-1678652197831-2d180705cd2c?w=120&h=120&fit=crop', name: 'iPhone 15 Pro', price: '25.990.000đ' },
                { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=120&h=120&fit=crop', name: 'MacBook Pro', price: '39.990.000đ' }
            ]
        };
    }

    // Các response không có hình
    if (lowerMessage.match(/khuyến mãi|giảm giá|sale|ưu đãi/i)) {
        return { text: '🎉 Khuyến mãi HOT:\n• Giảm đến 30% điện thoại\n• Tặng phụ kiện 2 triệu\n• Trả góp 0%\n• Freeship toàn quốc\n\n📞 Hotline: 1900.5301', images: [] };
    }
    if (lowerMessage.match(/giao hàng|ship|vận chuyển/i)) {
        return { text: '🚚 Giao hàng:\n• Miễn phí nội thành Trà Vinh\n• Toàn quốc: 20-50k\n• Đơn >5 triệu: Freeship\n• Thời gian: 1-3 ngày', images: [] };
    }
    if (lowerMessage.match(/bảo hành|warranty/i)) {
        return { text: '🛡️ Bảo hành:\n• Điện thoại: 12-24 tháng\n• Laptop: 12-24 tháng\n• Đổi mới 7 ngày nếu lỗi\n\n📞 Hotline: 1900.5325', images: [] };
    }
    if (lowerMessage.match(/địa chỉ|ở đâu|cửa hàng/i)) {
        return { text: '📍 Yến Nhi Tech:\n🏪 74-76 Lê Lợi, Khóm 3, Trà Vinh\n⏰ 8:00 - 21:30 hàng ngày\n📞 1900.5301', images: [] };
    }
    if (lowerMessage.match(/hotline|liên hệ|số điện thoại/i)) {
        return { text: '📞 Liên hệ:\n• Mua hàng: 1900.5301\n• Bảo hành: 1900.5325\n• Email: support@yennhitech.vn', images: [] };
    }
    if (lowerMessage.match(/trả góp|góp/i)) {
        return { text: '💳 Trả góp 0% lãi suất qua thẻ tín dụng\n• Duyệt hồ sơ 15 phút\n• Chỉ cần CMND + Bằng lái\n\n📞 1900.5301', images: [] };
    }
    if (lowerMessage.match(/cảm ơn|thank/i)) {
        return { text: 'Không có gì ạ! 😊 Rất vui được hỗ trợ bạn!', images: [] };
    }
    if (lowerMessage.match(/tạm biệt|bye/i)) {
        return { text: 'Tạm biệt! 👋 Hẹn gặp lại bạn! 🌟', images: [] };
    }

    return null;
}

// Fallback responses khi không có API key hoặc lỗi
// Fallback response khi AI không khả dụng
function getFallbackResponse(message) {
    // Thử quick response trước
    const quickReply = getQuickResponse(message);
    if (quickReply) return quickReply;
    
    // Default response cho các câu hỏi không match
    return {
        text: 'Cảm ơn bạn đã liên hệ Yến Nhi Tech! 😊\n\nTôi có thể hỗ trợ bạn về:\n• Tư vấn sản phẩm (iPhone, Samsung, Laptop...)\n• Khuyến mãi & giá cả\n• Giao hàng & thanh toán\n• Bảo hành & đổi trả\n\nBạn cần hỗ trợ vấn đề gì ạ?',
        images: []
    };
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
        console.log('📝 [CREATE CONV] User:', req.user);
        const userId = req.user.ma_tai_khoan;
        
        if (!userId) {
            console.log('❌ [CREATE CONV] Không có userId');
            return res.status(400).json({
                success: false,
                message: 'Không tìm thấy thông tin người dùng!'
            });
        }

        const { title = 'Cuộc hội thoại mới' } = req.body;

        const sql = `
            INSERT INTO cuoc_hoi_thoai_chatbot (ma_tai_khoan, tieu_de)
            VALUES (?, ?)
        `;

        const result = await query(sql, [userId, title]);
        console.log('✅ [CREATE CONV] Tạo thành công, ID:', result.insertId);

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
        console.error('❌ [CREATE CONV] Error:', error);
        res.status(500).json({
            success: false,
            message: 'Có lỗi xảy ra: ' + error.message
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

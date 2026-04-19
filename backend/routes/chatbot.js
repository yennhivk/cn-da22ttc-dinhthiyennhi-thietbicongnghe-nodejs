const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages) return res.status(400).json({ error: 'Messages required' });

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        let sanitizedMessages = messages.map(msg => {
            let clone = { ...msg };
            if (clone.role === 'assistant' && typeof clone.content === 'string') {
                clone.content = clone.content.replace(/<[^>]*>?/gm, ' ').trim();
                // Ensure content is never empty or just whitespace
                if (!clone.content) clone.content = 'Tôi đã show sản phẩm cho bạn.';
            }
            return clone;
        });

        const tools = [
            {
                type: 'function',
                function: {
                    name: 'search_products',
                    description: 'Tìm kiếm sản phẩm, thiết bị, phụ kiện (laptop, điện thoại, vi xử lý...) từ cửa hàng trực tiếp Database.',
                    parameters: {
                        type: 'object',
                        properties: { query: { type: 'string', description: 'Tên sản phẩm thiết bị cần tìm' } },
                        required: ['query']
                    }
                }
            }
        ];

        let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ model: 'llama-3.3-70b-versatile', messages: sanitizedMessages, temperature: 0.7, max_tokens: 1024, tools: tools, tool_choice: 'auto' })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Groq Error:', errText);
            return res.status(response.status).json({ error: 'Groq API error' });
        }

        let data = await response.json();
        let aiMessage = data.choices && data.choices[0] ? data.choices[0].message : null;

        if (aiMessage && aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            let finalHtml = '';
            for (const toolCall of aiMessage.tool_calls) {
                if (toolCall.function.name === 'search_products') {
                    let args = { query: '' };
                    try { args = JSON.parse(toolCall.function.arguments); } catch(e) {}
                    
                    try {
                        const [rows] = await db.query('SELECT sp.ma_san_pham, sp.ten_san_pham, sp.gia, a.duong_dan_anh FROM san_pham sp LEFT JOIN anh_san_pham a ON sp.ma_san_pham = a.ma_san_pham AND a.la_anh_chinh = 1 WHERE sp.ten_san_pham LIKE ? OR sp.mo_ta LIKE ? OR sp.thuong_hieu LIKE ? LIMIT 3', [`%${args.query}%`, `%${args.query}%`, `%${args.query}%`]);
                        if (rows.length > 0) {
                            finalHtml = 'Dạ, tôi tìm thấy sản phẩm này cho bạn:<br><br>' + rows.map(r => {
                                const priceFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.gia);
                                let imgSrc = 'http://localhost:3000/images/Logo-removebg-preview.png';
                                if (r.duong_dan_anh) {
                                    if (r.duong_dan_anh.startsWith('http')) imgSrc = r.duong_dan_anh;
                                    else imgSrc = `http://localhost:${process.env.PORT || 3000}${r.duong_dan_anh.startsWith('/') ? '' : '/'}${r.duong_dan_anh}`;
                                }
                                return `<div style="border:1px solid #ddd;border-radius:8px;padding:15px;margin:10px 0;background:#fff;"><strong style="color:#222;font-size:16px;">${r.ten_san_pham}</strong><br><span style="color:#ef4444;font-weight:bold;font-size:15px;">Giá: ${priceFormat}</span><br><div style="text-align:center;margin:15px 0;"><img src="${imgSrc}" onerror="this.onerror=null;this.src='http://localhost:3000/images/Logo-removebg-preview.png';" style="width:100%;max-width:200px;border-radius:5px;box-shadow:0 2px 4px rgba(0,0,0,0.1);"></div><a href="/frontend/pages/product-detail.html?id=${r.ma_san_pham}" target="_blank" style="display:block;background:linear-gradient(90deg,#0052cc,#003399);color:#fff;padding:10px 0;border-radius:6px;text-align:center;text-decoration:none;font-weight:bold;margin-top:10px;cursor:pointer;">MUA NGAY &rarr;</a></div>`;
                            }).join('');
                        } else {
                            finalHtml = 'Thật xin lỗi, tôi không tìm thấy sản phẩm nào khớp với: ' + args.query;
                        }
                    } catch(e) {}
                }
            }
            data.choices[0].message = { role: 'assistant', content: finalHtml };
            delete data.choices[0].message.tool_calls;
        }
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;

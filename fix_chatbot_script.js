const fs = require('fs');
const code = `const express = require('express');
const router = express.Router();
const db = require('../config/database');

router.post('/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array is required' });
        }

        const GROQ_API_KEY = process.env.GROQ_API_KEY;
        if (!GROQ_API_KEY) {
            return res.status(500).json({ error: 'Groq API key not configured' });
        }

        const tools = [
            {
                type: "function",
                function: {
                    name: "search_products",
                    description: "Hàm tìm kiếm sản phẩm. Gọi hàm này ngay lập tức khi khách hàng hỏi cấu hình, muốn xem hình ảnh, giá cả, hoặc tìm một sản phẩm, phụ kiện, điện thoại, máy tính cụ thể. Trả về kết quả dưới dạng chuỗi HTML (tên, giá, link gốc...).",
                    parameters: {
                        type: "object",
                        properties: {
                            query: {
                                type: "string",
                                description: "Từ khóa tìm kiếm (ví dụ: 'iphone', 'laptop dell', 'chuột razer', 'tai nghe')"
                            }
                        },
                        required: ["query"]
                    }
                }
            }
        ];

        // 1st API Call
        let response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': \`Bearer \${GROQ_API_KEY}\`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: messages,
                temperature: 0.7,
                max_tokens: 1024,
                tools: tools,
                tool_choice: "auto"
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Groq error:', errorText);
            return res.status(response.status).json({ error: 'Groq API error' });
        }

        let data = await response.json();
        let aiMessage = data.choices && data.choices[0] ? data.choices[0].message : null;

        // If tool called
        if (aiMessage && aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
            // Include assistant thought
            messages.push(aiMessage);

            for (const toolCall of aiMessage.tool_calls) {
                if (toolCall.function.name === 'search_products') {
                    let args = { query: '' };
                    try {
                        args = JSON.parse(toolCall.function.arguments);
                    } catch(e) {}

                    let productInfo = "Rất tiếc, mình không tìm thấy sản phẩm nào khớp với yêu cầu: " + args.query;
                    
                    try {
                        const [rows] = await db.query(
                            \`SELECT sp.ma_san_pham, sp.ten_san_pham, sp.gia, sp.mo_ta, a.duong_dan_anh 
                            FROM san_pham sp
                            LEFT JOIN anh_san_pham a ON sp.ma_san_pham = a.ma_san_pham AND a.la_anh_chinh = 1
                            WHERE sp.ten_san_pham LIKE ? OR sp.mo_ta LIKE ? OR sp.thuong_hieu LIKE ?
                            LIMIT 3\`, 
                            [\`%\${args.query}%\`, \`%\${args.query}%\`, \`%\${args.query}%\`]
                        );

                        if (rows.length > 0) {
                            productInfo = "Dưới đây là một số sản phẩm phù hợp. Bạn hãy chèn NGUYÊN VĂN chuỗi HTML dưới đây vào câu trả lời, đừng sửa thành markdown!\\n\\n";
                            productInfo += rows.map(r => {
                                const priceFormat = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(r.gia);
                                const imgSrc = r.duong_dan_anh ? \`http://localhost:3300/uploads/\${r.duong_dan_anh}\` : 'http://localhost:3300/uploads/default.jpg';
                                const link = \`/frontend/pages/product-detail.html?id=\${r.ma_san_pham}\`;
                                return \`<div style="border:1px solid #ddd;border-radius:8px;padding:10px;margin:10px 0;">\` +
                                    \`<strong>\${r.ten_san_pham}</strong><br>\` +
                                    \`<span style="color:#e53935;font-weight:bold;">Giá: \${priceFormat}</span><br>\` +
                                    \`<div style="text-align:center;margin:10px 0;">\` +
                                    \`<img src="\${imgSrc}" style="width:100%;max-width:200px;border-radius:5px;"></div>\` +
                                    \`<a href="\${link}" target="_blank" style="display:inline-block;background:#f28500;color:#fff;padding:8px 12px;border-radius:5px;text-decoration:none;font-weight:bold;">Chi tiết & Mua ngay &rarr;</a>\` +
                                    \`</div>\`;
                            }).join('');
                        }
                    } catch (err) {
                        console.error('Lỗi khi truy vấn DB trong tool_call:', err);
                    }

                    messages.push({
                        role: 'tool',
                        tool_call_id: toolCall.id,
                        name: 'search_products',
                        content: productInfo
                    });
                }
            }

            // Tell assistant to include the raw HTML and do not attempt to use codeblocks:
            messages.push({
                role: 'system',
                content: "QUAN TRỌNG: Bạn vừa được cung cấp các đoạn HTML của sản phẩm. Bạn hãy sử dụng nguyên văn đoạn HTML đó để giới thiệu cho khách, TUYỆT ĐỐI KHÔNG ĐƯỢC đặt HTML vào trong cú pháp code block (\`\`\`html) vì UI sẽ không thể render ảnh. Cứ bỏ nguyên nội dung code HTML ra ngoài dạng text thông thường là được."
            });

            // 2nd API Call
            let secondResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': \`Bearer \${GROQ_API_KEY}\`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: messages,
                    temperature: 0.7,
                    max_tokens: 1024
                })
            });

            if (!secondResponse.ok) {
                console.error('Groq error 2');
                return res.status(secondResponse.status).json({ error: 'Groq API error on second call' });
            }

            data = await secondResponse.json();
        }

        res.json(data);
    } catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

module.exports = router;
`;
fs.writeFileSync('d:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/backend/routes/chatbot.js', code);
console.log('Done writing routes/chatbot.js');
const fs = require('fs');
const path = 'd:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/backend/routes/products.js';
let content = fs.readFileSync(path, 'utf8');

const target = \            LIMIT ?
        \, [queryStr, queryStr, queryStr, \\\\\\%%\\\, limitNum]);
    try {
        // Láº¥y flash sale\;

const replacement = \            LIMIT ?
        \, [queryStr, queryStr, queryStr, \\\\\\%%\\\, limitNum]);

        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// ==========================================
// FLASH SALE - PUBLIC API (phải đặt trước route /:id)
// ==========================================

// Lấy danh sách sản phẩm Flash Sale đang diễn ra và sắp diễn ra (không cần auth)
router.get('/flash-sale', async (req, res) => {
    try {
        // Láº¥y flash sale\;

content = content.replace(target, replacement);
fs.writeFileSync(path, content, 'utf8');

const fs = require('fs');
const path = "d:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/backend/routes/products.js";
let c = fs.readFileSync(path, "utf8");

const oldStr = `            LIMIT ?
        \`, [queryStr, queryStr, queryStr, \`\${q}%\`, limitNum]);
    try {
        // Lấy flash sale đang diễn ra`;

const newStr = `            LIMIT ?
        \`, [queryStr, queryStr, queryStr, \`\${q}%\`, limitNum]);

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
        // Lấy flash sale đang diễn ra`;

c = c.replace(oldStr, newStr);
fs.writeFileSync(path, c, "utf8");
console.log("Replaced");

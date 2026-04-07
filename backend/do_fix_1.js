const fs = require('fs');
const file = 'd:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/backend/routes/products.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');

const routerConfig = `// ==========================================
// SEARCH SUGGESTIONS API
// ==========================================
router.get('/search/suggestions', async (req, res) => {
    try {
        const { q, limit = 8 } = req.query;
        
        if (!q) {
            return res.json({ success: true, data: [] });
        }

        const queryStr = \`%\${q}%\`;
        const limitNum = parseInt(limit) || 8;

        const [products] = await db.query(\`
            SELECT 
                sp.ma_san_pham,
                sp.ten_san_pham,
                sp.thuong_hieu,
                sp.gia,
                (SELECT duong_dan_anh FROM anh_san_pham WHERE ma_san_pham = sp.ma_san_pham AND la_anh_chinh = 1 LIMIT 1) as anh_chinh
            FROM san_pham sp
            LEFT JOIN danh_muc_san_pham dm ON sp.ma_danh_muc = dm.ma_danh_muc
            WHERE sp.trang_thai = 'hien_thi' 
              AND (sp.ten_san_pham LIKE ? OR dm.ten_danh_muc LIKE ? OR sp.thuong_hieu LIKE ?)
            ORDER BY sp.ten_san_pham LIKE ? DESC, sp.ten_san_pham ASC
            LIMIT ?
        \`, [queryStr, queryStr, queryStr, \`\${q}%\`, limitNum]);

        res.json({ success: true, data: products });
    } catch (error) {
        console.error('Search suggestions error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

`;

lines.splice(4, 0, routerConfig);
fs.writeFileSync(file, lines.join('\n'), 'utf8');
console.log('Added search suggestions');

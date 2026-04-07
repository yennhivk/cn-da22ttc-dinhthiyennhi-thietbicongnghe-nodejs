const fs = require('fs');
const path = "d:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/backend/routes/products.js";
let lines = fs.readFileSync(path, 'utf8').split('\n');

const insertContent = `
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
router.get('/flash-sale', async (req, res) => {`;

// Insert the content between lines 33 and 34
lines.splice(33, 0, insertContent);

fs.writeFileSync(path, lines.join('\n'), 'utf8');
console.log("Fixed!");

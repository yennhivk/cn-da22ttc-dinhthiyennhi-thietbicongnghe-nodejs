const fs = require('fs');
let p = fs.readFileSync('routes/products.js', 'utf8');

// Find the search block
const oldSearchBlock = `        // TÃ¬m kiáº¿m
        if (search) {
            const searchStr = search.trim();
            const searchPattern = \`%\${searchStr.replace(/\\s+/g, '%')}%\`;
            const exactPattern = \`%\${searchStr}%\`;
            query += \` AND (sp.ten_san_pham LIKE ? OR dm.ten_danh_muc LIKE ? OR sp.thuong_hieu LIKE ? OR sp.mo_ta LIKE ? OR EXISTS (
                SELECT 1 FROM anh_san_pham a 
                WHERE a.ma_san_pham = sp.ma_san_pham 
                AND a.duong_dan_anh LIKE ?
            ))\`;
            params.push(exactPattern, exactPattern, exactPattern, exactPattern, searchPattern);
        }`;

const newSearchBlock = `        // TÃ¬m kiáº¿m
        if (search) {
            const searchStr = search.trim();
            const words = searchStr.split(' ').filter(w => w.length > 0);
            
            // Tìm chính xác (exact pattern) cho toàn b? chu?i
            const searchPattern = \`%\${searchStr.replace(/\\s+/g, '%')}%\`;
            const exactPattern = \`%\${searchStr}%\`;
            
            let searchCondition = \`(sp.ten_san_pham LIKE ? OR dm.ten_danh_muc LIKE ? OR sp.thuong_hieu LIKE ? OR sp.mo_ta LIKE ? OR EXISTS (
                SELECT 1 FROM anh_san_pham a 
                WHERE a.ma_san_pham = sp.ma_san_pham 
                AND a.duong_dan_anh LIKE ?
            ))\`;
            params.push(exactPattern, exactPattern, exactPattern, exactPattern, searchPattern);
            
            // Tìm theo t?ng t? r?i r?c (ch? n?u có nhi?u hon 1 t?)
            if (words.length > 1) {
                let wordConditions = [];
                for (const word of words) {
                    // Không tìm t? quá ng?n nhu 'dt' unless necessary, but let's just search all
                    if (word.length >= 2) {
                        wordConditions.push(\`(sp.ten_san_pham LIKE ? OR dm.ten_danh_muc LIKE ? OR sp.thuong_hieu LIKE ? OR EXISTS(SELECT 1 FROM anh_san_pham a2 WHERE a2.ma_san_pham = sp.ma_san_pham AND a2.duong_dan_anh LIKE ?))\`);
                        const wordPattern = \`%\${word}%\`;
                        params.push(wordPattern, wordPattern, wordPattern, wordPattern);
                    }
                }
                if (wordConditions.length > 0) {
                    searchCondition = \`(\${searchCondition} OR (\${wordConditions.join(' AND ')}))\`;
                }
            }
            
            query += \` AND \${searchCondition}\`;
        }`;

p = p.replace(oldSearchBlock, newSearchBlock);
fs.writeFileSync('routes/products.js', p);
console.log('Fixed search string to split by words AND');

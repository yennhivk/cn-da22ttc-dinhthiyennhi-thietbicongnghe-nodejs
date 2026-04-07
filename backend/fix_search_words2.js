const fs = require('fs');
let p = fs.readFileSync('routes/products.js', 'utf8');

// Find the search block by slicing
const startStr = "        // TÃ¬m kiáº¿m\n        if (search) {";
const endStr = "params.push(exactPattern, exactPattern, exactPattern, exactPattern, searchPattern);\n        }";

const startIdx = p.indexOf(startStr);
const endIdx = p.indexOf(endStr) + endStr.length;

if (startIdx !== -1 && endIdx !== -1) {
    const oldBlock = p.substring(startIdx, endIdx);

const newSearchBlock = `        // TÃ¬m kiáº¿m
        if (search) {
            const searchStr = search.trim();
            const words = searchStr.split(' ').filter(w => w.trim().length > 0);
            
            const searchPattern = \`%\${searchStr.replace(/\\s+/g, '%')}%\`;
            const exactPattern = \`%\${searchStr}%\`;
            
            let searchCondition = \`(sp.ten_san_pham LIKE ? OR dm.ten_danh_muc LIKE ? OR sp.thuong_hieu LIKE ? OR sp.mo_ta LIKE ? OR EXISTS (
                SELECT 1 FROM anh_san_pham a 
                WHERE a.ma_san_pham = sp.ma_san_pham 
                AND a.duong_dan_anh LIKE ?
            ))\`;
            params.push(exactPattern, exactPattern, exactPattern, exactPattern, searchPattern);
            
            if (words.length > 1) {
                let wordConditions = [];
                for (const word of words) {
                    if (word.length >= 2) {
                        wordConditions.push(\`(sp.ten_san_pham LIKE ? OR dm.ten_danh_muc LIKE ? OR sp.thuong_hieu LIKE ? OR EXISTS(SELECT 1 FROM anh_san_pham a2 WHERE a2.ma_san_pham = sp.ma_san_pham AND a2.duong_dan_anh LIKE ?))\`);
                        const wordPattern = \`%\${word}%\`;
                        params.push(wordPattern, wordPattern, wordPattern, wordPattern);
                    }
                }
                if (wordConditions.length > 0) {
                    // Yêu c?u tìm M?T TRONG NH?NG t? dó cung du?c phép hi?n ra (OR)
                    searchCondition = \`(\${searchCondition} OR (\${wordConditions.join(' OR ')}))\`;
                }
            }
            
            query += \` AND \${searchCondition}\`;`;

    p = p.substring(0, startIdx) + newSearchBlock + p.substring(endIdx);
    fs.writeFileSync('routes/products.js', p);
    console.log('Fixed search string to split by words OR');
} else {
    console.log('Could not find the search block!');
}

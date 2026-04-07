const fs = require('fs');
const file = 'd:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/backend/routes/products.js';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/if \(search\) \{\s*query \+= ` AND \(sp\.ten_san_pham LIKE \? OR sp\.mo_ta LIKE \? OR sp\.thuong_hieu LIKE \?\)`(?:;)?\s*params\.push\(`%\$\{search\}%`, `%\$\{search\}%`, `%\$\{search\}%`\)(?:;)?\s*\}/, 
`if (search) {
            query += \` AND (sp.ten_san_pham LIKE ? OR dm.ten_danh_muc LIKE ? OR sp.thuong_hieu LIKE ?)\`;
            params.push(\`%\${search}%\`, \`%\${search}%\`, \`%\${search}%\`);
        }`);

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed main search API');

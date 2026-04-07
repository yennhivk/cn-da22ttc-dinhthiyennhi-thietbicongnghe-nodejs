const fs = require('fs');
const p = 'd:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/backend/routes/products.js';
let c = fs.readFileSync(p, 'utf-8');

c = c.replace('sp.thuong_hieu LIKE ? OR sp.mo_ta LIKE ? OR EXISTS', 'sp.thuong_hieu LIKE ? OR EXISTS');
c = c.replace('params.push(exactPattern, exactPattern, exactPattern, exactPattern, searchPattern);', 'params.push(exactPattern, exactPattern, exactPattern, searchPattern);');
c = c.replace(/wordConditions\.join\(' OR '\)/g, "wordConditions.join(' AND ')");

fs.writeFileSync(p, c);
console.log('Fixed search string!');

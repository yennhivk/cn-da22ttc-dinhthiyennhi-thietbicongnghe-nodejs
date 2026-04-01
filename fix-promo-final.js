const fs = require('fs');
const file = 'frontend/pages/promotions.html';
let content = fs.readFileSync(file, 'utf8');

const regex1 = /\/\* Hiệu ứng hoa mai r[\s\S]*?(?=\s*\/\* C)/g;
content = content.replace(regex1, '');

const regex2 = /\/\* Nhánh mai trang trí header \*\/[\s\S]*?(?=<\/style>)/g;
content = content.replace(regex2, '');

const regex3 = /<!-- Hoa mai rơi -->\n*\s*<div id="hoaMaiContainer"><\/div>/g;
content = content.replace(regex3, '');

const regex4 = /<!-- Nhánh mai bên trái -->[\s\S]*?(?=<div class="max-w-7xl)/g;
content = content.replace(regex4, '');

const regex5 = /\/\/\s*Tạo hiệu ứng hoa mai rơi với 5 cánh[\s\S]*?setTimeout\(createHoaMai,\s*i\s*\*\s*200\);\s*\}/g;
content = content.replace(regex5, '');

fs.writeFileSync(file, content);
const fs = require('fs');
const path = './frontend/pages/promotions.html';
let content = fs.readFileSync(path, 'utf8');

// remove styles 
content = content.replace(/\/\* Hiệu ứng hoa mai rơi \*\/[\s\S]*?(?=\.banner-carousel)/g, '');
content = content.replace(/\/\* Nhánh mai trang trí header \*\/[\s\S]*?(?=<\/style>)/g, '');

// html 
content = content.replace(/<!-- Hoa mai rơi -->\s*<div id="hoaMaiContainer"><\/div>/g, '');
content = content.replace(/<!-- Nhánh mai bên trái -->[\s\S]*?(?=<div class="max-w-7xl)/g, '');

// js 
content = content.replace(/\/\/ Tạo hiệu ứng hoa mai rơi với 5 cánh[\s\S]*?setTimeout\(createHoaMai,\s*i\s*\*\s*200\);\s*\}/g, '');

fs.writeFileSync(path, content);
console.log('Success');

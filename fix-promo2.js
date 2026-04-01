const fs = require('fs');
const file = 'frontend/pages/promotions.html';
let content = fs.readFileSync(file, 'utf8');

const s1 = content.indexOf('        /* Nền Tết với hoa mai */');
const e1 = content.indexOf('        /* Promotion Card Style */');
if (s1 !== -1 && e1 !== -1) content = content.substring(0, s1) + content.substring(e1);

const s2 = content.indexOf('        /* Nhánh mai trang trí header */');
const e2 = content.indexOf('    </style>');
if (s2 !== -1 && e2 !== -1) content = content.substring(0, s2) + content.substring(e2);

const s3 = content.indexOf('        <!-- Hoa mai rơi -->');
const e3 = content.indexOf('        <!-- Header with HOT badge -->');
if (s3 !== -1 && e3 !== -1) content = content.substring(0, s3) + content.substring(e3);

const s4 = content.indexOf('            <!-- Nhánh mai bên trái -->');
const e4 = content.indexOf('            <div class="max-w-7xl mx-auto px-4">');
if (s4 !== -1 && e4 !== -1) content = content.substring(0, s4) + content.substring(e4);

const s5 = content.indexOf('        // Tạo hiệu ứng hoa mai rơi với 5 cánh');
const e5 = content.indexOf('    </script>');
if (s5 !== -1 && e5 !== -1) content = content.substring(0, s5) + content.substring(e5);

fs.writeFileSync(file, content, 'utf8');
console.log('Success cut indices');
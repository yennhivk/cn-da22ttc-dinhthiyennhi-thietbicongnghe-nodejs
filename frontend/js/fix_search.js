const fs = require('fs');
const file = 'd:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/frontend/js/search-suggestions.js';
let content = fs.readFileSync(file, 'utf8');

const target1 = `        products.forEach((product, index) => {`;
const replacement1 = `        if (products.length === 0) {
            html += \`
                <div class="p-4 text-center text-gray-500 text-sm">
                    Không tìm th?y s?n ph?m
                </div>
            \`;
        } else {
            products.forEach((product, index) => {`;

content = content.replace(target1, replacement1);

const target2 = `        });

        // Äáº·t HTML vÃ o dropdown`;

const replacement2 = `        });
        }

        // Äáº·t HTML vÃ o dropdown`;

content = content.replace(target2, replacement2);

fs.writeFileSync(file, content);
console.log("Done");

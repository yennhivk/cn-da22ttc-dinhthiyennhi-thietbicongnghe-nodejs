const fs = require('fs');
const file = 'd:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/frontend/js/main.js';
let c = fs.readFileSync(file, 'utf8');

const regex = /fileInput\.addEventListener\('change', function\(e\) \{[\s\S]*?fileInput\.value = '';\s*\}\);/;

const replacement = `fileInput.addEventListener('change', async function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const originalPlaceholder = input.placeholder;
            input.value = '';
            input.placeholder = 'AI dang phân tích hình ?nh...';
            input.disabled = true;

            try {
                if (!window.tf || !window.mobilenet) {
                    await new Promise((resolve, reject) => {
                        const scriptTf = document.createElement('script');
                        scriptTf.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@3.20.0/dist/tf.min.js';
                        scriptTf.onload = () => {
                            const scriptMn = document.createElement('script');
                            scriptMn.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.0/dist/mobilenet.min.js';
                            scriptMn.onload = resolve;
                            scriptMn.onerror = reject;
                            document.head.appendChild(scriptMn);
                        };
                        scriptTf.onerror = reject;
                        document.head.appendChild(scriptTf);
                    });
                }

                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise((resolve) => img.onload = resolve);

                const model = await window.mobilenet.load();
                const predictions = await model.classify(img);

                const text = predictions.map(p => p.className.toLowerCase()).join(', ');
                console.log('AI detected:', text);
                let searchTerm = '';
                
                if (text.includes('cellular') || text.includes('phone') || text.includes('ipod') || text.includes('hand-held')) searchTerm = 'di?n tho?i';
                else if (text.includes('laptop') || text.includes('computer') || text.includes('macbook')) searchTerm = 'laptop';
                else if (text.includes('headphone') || text.includes('earphone') || text.includes('headset')) searchTerm = 'tai nghe';
                else if (text.includes('mouse') || text.includes('optical mouse')) searchTerm = 'chu?t';
                else if (text.includes('keyboard') || text.includes('typewriter')) searchTerm = 'bàn phím';
                else if (text.includes('monitor') || text.includes('screen') || text.includes('television')) searchTerm = 'màn hình';
                else if (text.includes('loudspeaker') || text.includes('speaker') || text.includes('subwoofer')) searchTerm = 'loa';
                else if (text.includes('watch') || text.includes('clock') || text.includes('analog clock')) searchTerm = 'd?ng h?';
                else if (text.includes('backpack') || text.includes('bag') || text.includes('case')) searchTerm = 'balo';
                else if (text.includes('adapter') || text.includes('plug') || text.includes('charger')) searchTerm = 's?c';

                if (!searchTerm) {
                    searchTerm = normalizeImageFileName(file.name);
                }

                input.value = searchTerm;
                navigateToSearchResults(searchTerm);

            } catch (err) {
                console.error('L?i AI Image Search:', err);
                const fallbackQuery = normalizeImageFileName(file.name);
                input.value = fallbackQuery || '';
                if (fallbackQuery) navigateToSearchResults(fallbackQuery);
            } finally {
                input.disabled = false;
                input.placeholder = originalPlaceholder;
                fileInput.value = '';
            }
        });`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    fs.writeFileSync(file, c, 'utf8');
    console.log('Successfully injected TFJS');
} else {
    console.log('Regex did not match');
}

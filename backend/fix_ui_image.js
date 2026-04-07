const fs = require('fs');
let content = fs.readFileSync('d:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/frontend/js/main.js', 'utf8');

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

                // Chuy?n file sang Data URL d? luu localStorage
                const reader = new FileReader();
                const dataUrl = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.readAsDataURL(file);
                });

                const img = new Image();
                img.src = dataUrl;
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

                // Luu ?nh hi?n th?
                sessionStorage.setItem('currentSearchImage', dataUrl);
                sessionStorage.setItem('currentSearchTerm', searchTerm);

                // Không gán chu?i text vào input n?a d? giao di?n render ?nh (du?c x? lý ? ph?n trên wrapper)
                // Ði?u hu?ng t?i page search v?i param, sau dó s? khôi ph?c ?nh ? onload
                navigateToSearchResults(searchTerm);

            } catch (err) {
                console.error('L?i AI Image Search:', err);
                const fallbackQuery = normalizeImageFileName(file.name);
                if (fallbackQuery) navigateToSearchResults(fallbackQuery);
            } finally {
                input.disabled = false;
                input.placeholder = originalPlaceholder;
                fileInput.value = '';
            }
        });`;

const startIdx = content.indexOf("fileInput.addEventListener('change', async function(e) {");
const endIdx = content.indexOf("    });\n}\n\n// Navigate to Home");

if (startIdx !== -1 && endIdx !== -1) {
    // S?a do?n mã AddEventListener change
    const oldBlock = content.substring(startIdx, endIdx + 8);
    content = content.replace(oldBlock, replacement + "\n    });\n}");

    // Tìm constructor hook c?a input d? inject UI cho Image
    const uiInjector = `
        // --- HI?N TH? ?NH ÐÃ LUU (IMAGE SEARCH) ---
        const savedImage = sessionStorage.getItem('currentSearchImage');
        const savedTerm = sessionStorage.getItem('currentSearchTerm');
        const params = new URLSearchParams(window.location.search);
        
        if (savedImage && params.get('search') === savedTerm) {
            // Bi?n ch? thành trong su?t
            input.style.color = 'transparent';
            input.value = savedTerm;

            // Xoá ?nh cu n?u có
            const oldThumb = wrapper.querySelector('.img-search-thumb');
            if (oldThumb) oldThumb.remove();

            const thumbWrapper = document.createElement('div');
            thumbWrapper.className = 'img-search-thumb';
            thumbWrapper.style.cssText = 'position:absolute; left:12px; top:50%; transform:translateY(-50%); height:32px; display:flex; align-items:center; background:#f0f2f5; border-radius:16px; padding:2px 8px 2px 2px; overflow:hidden; z-index:3; max-width:180px; box-shadow:0 1px 3px rgba(0,0,0,0.1);';
            
            const thumbImg = document.createElement('img');
            thumbImg.src = savedImage;
            thumbImg.style.cssText = 'height:28px; width:28px; object-fit:cover; border-radius:50%; margin-right:6px;';
            
            const clearBtn = document.createElement('span');
            clearBtn.innerHTML = '×';
            clearBtn.style.cssText = 'cursor:pointer; font-weight:bold; font-size:16px; color:#666; line-height:1; margin-left:4px;';
            clearBtn.onclick = (e) => {
                e.preventDefault();
                e.stopPropagation();
                thumbWrapper.remove();
                input.style.color = '';
                input.value = '';
                sessionStorage.removeItem('currentSearchImage');
                sessionStorage.removeItem('currentSearchTerm');
                
                // N?u dang ? trang search, chuy?n hu?ng l?i (ho?c render l?i)
                if (window.location.pathname.includes('products.html')) {
                    window.location.href = 'products.html';
                }
            };
            
            thumbWrapper.appendChild(thumbImg);
            thumbWrapper.appendChild(clearBtn);
            wrapper.appendChild(thumbWrapper);
            
            // Can l? trái input ra ngoài ?nh
            input.style.paddingLeft = '90px';
        }`;

    // Inject before const fileInput = document.createElement('input'); 
    const marker = "const fileInput = document.createElement('input');";
    content = content.replace(marker, uiInjector + "\n\n        " + marker);

    fs.writeFileSync('d:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/frontend/js/main.js', content, 'utf8');
    console.log('Successfully replaced fileInput logic and UI injector');
} else {
    console.log('Indexes not found!');
}

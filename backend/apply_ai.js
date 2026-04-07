const fs = require('fs');
const p = 'd:/BaoCao_KLTN/kltn-da22ttc-dinhthiyennhi-thietbicongnghe-nodejs/frontend/js/main.js';
let c = fs.readFileSync(p, 'utf8');

const regex = /reader.onload = async function\(event\) \{[\s\S]*?reader\.readAsDataURL\(file\);/;

const replacement = `reader.onload = async function(event) {
                const base64Str = event.target.result;
                sessionStorage.setItem('uploadedImage', base64Str);
                
                input.value = '';
                input.placeholder = 'Đang phân tích hình ảnh (AI)...';
                
                try {
                    // Sửa dụng cache model đã load ngầm trước đó
                    if (!window.__aiModel) {
                        if (!window.tf) {
                            await new Promise((resolve, reject) => {
                                const script = document.createElement('script');
                                script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs';
                                script.onload = resolve;
                                document.head.appendChild(script);
                            });
                        }
                        if (!window.mobilenet) {
                            await new Promise((resolve, reject) => {
                                const script = document.createElement('script');
                                script.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet';
                                script.onload = resolve;
                                document.head.appendChild(script);
                            });
                        }
                        // MobileNet v2 alpha 0.5 (cực lẹ)
                        window.__aiModel = await window.mobilenet.load({version: 2, alpha: 0.5});
                    }
                    
                    const imgForAI = new Image();
                    imgForAI.src = base64Str;
                    await new Promise(resolve => imgForAI.onload = resolve);
                    
                    const model = window.__aiModel;
                    // Lấy top 7 dự đoán để tỷ lệ trúng từ khóa công nghệ cao hơn
                    const predictions = await model.classify(imgForAI, 7); 
                    
                    let inferredQuery = '';
                    const classNames = predictions.map(p => p.className.toLowerCase()).join(', ');
                    
                    // Cải thiện thuật toán mapping bằng tiếng Việt (bao quát cực rộng)
                    if (classNames.includes('cellular') || classNames.includes('phone') || classNames.includes('dial') || classNames.includes('ipod') || classNames.includes('tablet')) {
                        inferredQuery = 'điện thoại';
                    } else if (classNames.includes('laptop') || classNames.includes('notebook')) {
                        inferredQuery = 'laptop';
                    } else if (classNames.includes('desktop') || classNames.includes('computer') || classNames.includes('monitor') || classNames.includes('screen') || classNames.includes('television') || classNames.includes('tv')) {
                        inferredQuery = 'màn hình'; 
                    } else if (classNames.includes('mouse') || classNames.includes('joystick')) {
                        inferredQuery = 'chuột';
                    } else if (classNames.includes('keyboard') || classNames.includes('typewriter')) {
                        inferredQuery = 'bàn phím';
                    } else if (classNames.includes('headphone') || classNames.includes('headset') || classNames.includes('loudspeaker') || classNames.includes('speaker') || classNames.includes('microphone') || classNames.includes('earphone')) {
                        inferredQuery = 'tai nghe';
                    } else if (classNames.includes('modem') || classNames.includes('router') || classNames.includes('switch') || classNames.includes('usb')) {
                        inferredQuery = 'phụ kiện';
                    } else {
                        inferredQuery = normalizeImageFileName(file.name);
                    }
                    
                    if (inferredQuery) {
                        sessionStorage.setItem('imageSearchQuery', inferredQuery);
                        navigateToSearchResults(inferredQuery);
                    } else {
                        // Nếu AI bó tay
                        alert('Không nhận diện được hình ảnh công nghệ. Bạn hãy thử chụp rõ nét hình ảnh sản phẩm hơn!');
                        input.placeholder = 'Tìm kiếm...';
                    }
                    
                } catch (err) {
                    console.error('Lỗi phân tích AI:', err);
                    const fallbackQuery = normalizeImageFileName(file.name);
                    if (fallbackQuery) {
                        sessionStorage.setItem('imageSearchQuery', fallbackQuery);
                        navigateToSearchResults(fallbackQuery);
                    } else {
                        alert('Mạng chậm hoặc lỗi kết nối. Vui lòng thử lại!');
                        input.placeholder = 'Tìm kiếm...';
                    }
                }
            };
            reader.readAsDataURL(file);`;

if (regex.test(c)) {
    c = c.replace(regex, replacement);
    
    const preloadParams = `
// 1. Tự động tải sẵn AI Model dưới nền (Background Preloading)
window.addEventListener('DOMContentLoaded', async () => {
    if (!window.location.pathname.includes('index.html') && window.location.pathname !== '/') return; // Load on main pages
    try {
        if (!window.tf) {
            const tfScript = document.createElement('script');
            tfScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs';
            document.head.appendChild(tfScript);
            await new Promise(r => tfScript.onload = r);
        }
        if (!window.mobilenet) {
            const mnScript = document.createElement('script');
            mnScript.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet';
            document.head.appendChild(mnScript);
            await new Promise(r => mnScript.onload = r);
        }
        // Chọn version 2 alpha 0.5 tải model cực nhanh
        if (!window.__aiModel) {
            window.__aiModel = await window.mobilenet.load({version: 2, alpha: 0.5});
            console.log('AI Image Model loaded and ready in background!');
        }
    } catch(e) {
        console.log('Preload AI ignored');
    }
});

`;
    if (!c.includes('Tự động tải sẵn AI Model dưới nền')) {
        c = preloadParams + c;
    }
    
    fs.writeFileSync(p, c);
    console.log('Successfully optimized main.js AI logic!');
} else {
    console.log('Regex did not match!');
}

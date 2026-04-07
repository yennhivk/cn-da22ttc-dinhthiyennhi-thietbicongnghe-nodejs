const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'js', 'main.js');
let content = fs.readFileSync(file, 'utf8');

const regex = /fileInput\.addEventListener\('change', function\(e\) \{[\s\S]*?fileInput\.value \= '';\s+\}\);/;

if(regex.test(content)) {
    const replacement = \ileInput.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = function(event) {
                const base64Str = event.target.result;
                sessionStorage.setItem('uploadedImage', base64Str);
                
                const inferredQuery = normalizeImageFileName(file.name);
                if (inferredQuery) {
                    input.value = inferredQuery;
                    sessionStorage.setItem('imageSearchQuery', inferredQuery);
                    navigateToSearchResults(inferredQuery);
                } else {
                    alert('Không d?c du?c t? khóa t? tên file ?nh.');
                }
            };
            reader.readAsDataURL(file);
            fileInput.value = '';
        });\;
    
    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully updated main.js');
} else {
    console.log('Regex did not match.');
}

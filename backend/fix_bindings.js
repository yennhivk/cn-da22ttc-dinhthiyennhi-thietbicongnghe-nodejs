const fs = require('fs');
let p = fs.readFileSync('routes/products.js', 'utf8');
p = p.replace(/\[queryStr, queryStr, queryStr, \`\$\{q\}%\`, limitNum\]/g, "[queryStr, queryStr, queryStr, '%' + q.replace(/\\s+/g, '%') + '%', `${q}%`, limitNum]");
fs.writeFileSync('routes/products.js', p);

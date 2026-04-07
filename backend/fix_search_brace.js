const fs = require('fs');
let p = fs.readFileSync('routes/products.js', 'utf8');
p = p.replace("query += ` AND (${searchCondition})`;\r\n        \r\n        // Sắp xếp", "query += ` AND (${searchCondition})`;\n        }\r\n        \r\n        // Sắp xếp");
p = p.replace("query += ` AND (${searchCondition})`;\n        \n        // Sắp xếp", "query += ` AND (${searchCondition})`;\n        }\n        \n        // Sắp xếp");
fs.writeFileSync('routes/products.js', p);
console.log('Added closing brace');

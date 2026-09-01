const fs = require('fs');
let content = fs.readFileSync('c:/marketing/infimech-erp-marketing/frontend/src/App.jsx', 'utf8');
const idx1 = content.indexOf('clientPortalFolder.name');
console.log('h2 area:', JSON.stringify(content.substring(idx1-60, idx1+30)));
const idx2 = content.indexOf('Cari file apa');
console.log('placeholder area:', JSON.stringify(content.substring(idx2-20, idx2+20)));

const fs = require('fs');
const c = fs.readFileSync('c:/marketing/infimech-erp-marketing/frontend/src/App.jsx', 'utf8');
const idx = c.indexOf('clientPortalFolder.name');
console.log('h2 context:', c.substring(idx-60, idx+40));
const idx2 = c.indexOf('Cari file apa');
console.log('placeholder:', c.substring(idx2-25, idx2+30));
const idx3 = c.indexOf("46px', height: '46px'");
console.log('file icon:', c.substring(idx3+60, idx3+200));

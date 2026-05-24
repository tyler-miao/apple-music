const fs = require('fs');
const path = 'C:/Users/Colorful/Desktop/app/frontend/src/components/search/SearchResults.tsx';
const b64 = process.argv[2];
const content = Buffer.from(b64, 'base64').toString('utf-8');
fs.writeFileSync(path, content, 'utf-8');
console.log('Written ' + content.length + ' chars');

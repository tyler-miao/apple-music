const fs = require('fs');
const b64 = process.argv[2];
const content = Buffer.from(b64, 'base64').toString('utf-8');
const path = 'C:/Users/Colorful/Desktop/app/frontend/src/components/search/SearchResults.tsx';
fs.writeFileSync(path, content, 'utf-8');
const buf = fs.readFileSync(path);
try { new TextDecoder('utf-8', {fatal: true}).decode(buf); console.log('Valid UTF-8'); } catch(e) { console.log('Invalid:', e.message); }

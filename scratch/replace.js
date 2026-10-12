const fs = require('fs');
const path = 'server/routes/recommendations.js';
let content = fs.readFileSync(path, 'utf8');
content = content.replace('const COLD_START_THRESHOLD = 3;', 'const COLD_START_THRESHOLD = 8;');
fs.writeFileSync(path, content);
console.log('done');

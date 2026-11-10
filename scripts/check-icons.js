const fs = require('fs'), path = require('path');
const need = ['build/icon.ico', 'src/assets/icon-192.png', 'src/assets/icon-512.png'];
need.forEach(f => console.log((fs.existsSync(path.join(__dirname, '..', f)) ? 'OK    ' : 'THIẾU ') + f));

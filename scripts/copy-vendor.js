// Chép thư viện đọc .docx/.pdf vào src/vendor để app chạy offline (không cần CDN).
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const out = path.join(root, 'src', 'vendor');
fs.mkdirSync(out, { recursive: true });
const jobs = [
  ['node_modules/jszip/dist/jszip.min.js', 'jszip.min.js'],
  ['node_modules/pdfjs-dist/build/pdf.min.js', 'pdf.min.js'],
  ['node_modules/pdfjs-dist/build/pdf.worker.min.js', 'pdf.worker.min.js'],
];
let bad = 0;
for (const [from, to] of jobs) {
  const src = path.join(root, from);
  if (fs.existsSync(src)) { fs.copyFileSync(src, path.join(out, to)); console.log('vendor <-', to); }
  else { console.warn('THIẾU:', from); bad++; }
}
if (bad) { console.error('Chưa chép đủ thư viện. Hãy chạy: npm install'); process.exitCode = 1; }

// Lưu dữ liệu app ra file JSON trong thư mục người dùng.
// Bản đã cài: <thư mục cài đặt>\EnV-Data\library.json
const { app } = require('electron');
const fs = require('fs');
const path = require('path');

// Có thể tự đổi nơi lưu bằng ⚙ Dữ liệu -> Đổi nơi lưu; lựa chọn được ghi nhớ trong location.json (thư mục userData).
const base = () => app.getPath('userData');
const ptr = () => path.join(base(), 'location.json');
// Mặc định (bản đã cài): thư mục "EnV-Data" nằm BÊN TRONG thư mục cài đặt (nơi có EnV.exe),
// ví dụ cài ở D:\EnV thì dữ liệu ở D:\EnV\EnV-Data. Vì gỡ cài đặt / cập nhật có thể xóa thư mục cài đặt,
// app luôn giữ thêm 1 bản sao lưu library.json trong %APPDATA% và tự khôi phục nếu thư mục dữ liệu bị mất.
// Nếu thư mục cài đặt không ghi được (vd Program Files) thì dùng %APPDATA%.
let defCache = null, inInstall = false, lastMirror = 0;
const mirrorDir = () => path.join(base(), 'mirror');
function copyData(from, to) {
  for (const f of ['library.json', 'library.json.bak']) {
    const s = path.join(from, f);
    if (fs.existsSync(s)) fs.copyFileSync(s, path.join(to, f));
  }
  const up = path.join(from, 'uploads');
  if (fs.existsSync(up)) { try { fs.cpSync(up, path.join(to, 'uploads'), { recursive: true }); } catch (_) {} }
}
function defaultDir() {
  if (defCache) return defCache;
  const old = path.join(base(), 'data');
  if (!app.isPackaged) return (defCache = old);
  const inst = process.env.PORTABLE_EXECUTABLE_DIR || path.dirname(process.execPath);
  const d = path.join(inst, 'EnV-Data');
  try {
    fs.mkdirSync(d, { recursive: true });
    const t = path.join(d, '.w'); fs.writeFileSync(t, '1'); fs.unlinkSync(t);   // thử quyền ghi
    if (!fs.existsSync(path.join(d, 'library.json'))) {
      // lần đầu / bị xóa: lấy từ nơi cũ (cạnh thư mục cài đặt), bản sao lưu, hoặc %APPDATA%
      const parent = path.dirname(inst);
      for (const c of [path.join(parent, 'LisApp-Data'), path.join(parent, 'EnV-Data'), mirrorDir(), old]) {
        if (fs.existsSync(path.join(c, 'library.json'))) { try { copyData(c, d); } catch (_) {} break; }
      }
    }
    inInstall = true;
    return (defCache = d);
  } catch (_) { return (defCache = old); }
}
// sao lưu library.json sang %APPDATA% (tối đa 1 lần / phút, và 1 lần khi thoát app)
function mirrorNow() {
  if (!inInstall) return;
  try { fs.mkdirSync(mirrorDir(), { recursive: true }); fs.copyFileSync(file(), path.join(mirrorDir(), 'library.json')); lastMirror = Date.now(); } catch (_) {}
}
function dir() {
  try {
    const d = JSON.parse(fs.readFileSync(ptr(), 'utf8')).dir;   // nơi người dùng tự chọn (nếu có)
    if (d) { fs.mkdirSync(d, { recursive: true }); return d; }
  } catch (_) { /* dùng mặc định */ }
  return defaultDir();
}
function setDir(d) {
  const from = dir();
  fs.mkdirSync(d, { recursive: true });
  if (path.resolve(from) !== path.resolve(d)) {
    const lib = path.join(d, 'library.json');
    if (fs.existsSync(lib)) fs.renameSync(lib, lib + '.old-' + Date.now());
    for (const f of ['library.json', 'library.json.bak']) {
      const s = path.join(from, f);
      if (fs.existsSync(s)) fs.copyFileSync(s, path.join(d, f));
    }
    // chép luôn thư mục uploads (bản gốc các file đã tải lên)
    const up = path.join(from, 'uploads');
    if (fs.existsSync(up)) { try { fs.cpSync(up, path.join(d, 'uploads'), { recursive: true }); } catch (_) {} }
  }
  fs.mkdirSync(base(), { recursive: true });
  fs.writeFileSync(ptr(), JSON.stringify({ dir: d }));
  return d;
}
const file = () => path.join(dir(), 'library.json');

// ---- Bản gốc các file người dùng tải lên: lưu cứng cạnh library.json (EnV-Data/uploads/<tab>/) ----
const safe = n => String(n || 'file').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 120) || 'file';
function saveFile(tab, name, buf) {
  const d = path.join(dir(), 'uploads', safe(tab));
  fs.mkdirSync(d, { recursive: true });
  const stamp = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const f = path.join(d, stamp + '-' + safe(name));
  fs.writeFileSync(f, Buffer.from(buf));
  return f;
}
function uploadsInfo() {
  let n = 0, bytes = 0;
  const walk = p => { try { for (const e of fs.readdirSync(p, { withFileTypes: true })) { const q = path.join(p, e.name); if (e.isDirectory()) walk(q); else { n++; try { bytes += fs.statSync(q).size; } catch (_) {} } } } catch (_) {} };
  walk(path.join(dir(), 'uploads'));
  return { files: n, bytes };
}

function load() {
  for (const f of [file(), file() + '.bak']) {
    try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch (_) { /* thử file kế tiếp */ }
  }
  return {};
}

function save(data) {
  fs.mkdirSync(dir(), { recursive: true });
  const f = file(), tmp = f + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(data));            // ghi tạm
  try { if (fs.existsSync(f)) fs.copyFileSync(f, f + '.bak'); } catch (_) {}
  fs.renameSync(tmp, f);                                  // đổi tên = ghi nguyên tử, không hỏng file khi mất điện
  if (inInstall && Date.now() - lastMirror > 60000) mirrorNow();
  return true;
}

function info() {
  let bytes = 0;
  try { bytes = fs.statSync(file()).size; } catch (_) {}
  return { path: file(), bytes, dir: dir(), uploads: uploadsInfo() };
}

module.exports = { load, save, info, dir, setDir, saveFile, mirrorNow };

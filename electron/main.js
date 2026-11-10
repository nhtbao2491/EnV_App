const { app, BrowserWindow, ipcMain, shell, Menu, dialog, net } = require('electron');
const fs = require('fs');
const path = require('path');
const store = require('./store');
const { autoUpdater } = require('electron-updater');
const https = require('https');

// ---- Giọng ONLINE (nhiều giọng tự nhiên): Microsoft Edge Neural (gói msedge-tts) + Google dịch. Lỗi thì app tự quay về giọng trong máy. ----
let EdgeTTS = null, EDGE_FMT = null;
try { const m = require('msedge-tts'); EdgeTTS = m.MsEdgeTTS; EDGE_FMT = m.OUTPUT_FORMAT; } catch (_) { /* chưa cài gói -> bỏ qua */ }
const withTimeout = (p, ms) => Promise.race([p, new Promise((_, r) => setTimeout(() => r(new Error('timeout')), ms))]);
async function edgeSynth(voice, text) {
  if (!EdgeTTS) throw new Error('Chưa có gói msedge-tts');
  const tts = new EdgeTTS();
  await tts.setMetadata(voice, EDGE_FMT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
  const r = tts.toStream(text), stream = r && r.audioStream ? r.audioStream : r, chunks = [];
  await new Promise((res, rej) => { stream.on('data', c => chunks.push(c)); stream.on('end', res); stream.on('close', res); stream.on('error', rej); });
  const b = Buffer.concat(chunks);
  if (!b.length) throw new Error('Không nhận được âm thanh');
  return b;
}
const G_TLD = { 'en-US': 'com', 'en-GB': 'co.uk', 'en-AU': 'com.au', 'en-IN': 'co.in', 'en-CA': 'ca', 'en-IE': 'ie', 'en-ZA': 'co.za' };
function googleSynth(lang, text) {
  return new Promise((resolve, reject) => {
    const url = 'https://translate.google.' + (G_TLD[lang] || 'com') + '/translate_tts?ie=UTF-8&client=tw-ob&tl=en&q=' + encodeURIComponent(text.slice(0, 190));
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      if (res.statusCode !== 200) { res.resume(); return reject(new Error('HTTP ' + res.statusCode)); }
      const c = []; res.on('data', d => c.push(d)); res.on('end', () => resolve(Buffer.concat(c)));
    }).on('error', reject);
  });
}
ipcMain.handle('tts:synth', async (e, kind, voice, text) => {
  try {
    const b = await withTimeout(kind === 'edge' ? edgeSynth(voice, String(text)) : googleSynth(voice, String(text)), 20000);
    return { ok: true, data: b };
  } catch (err) { return { ok: false, error: String((err && err.message) || err).slice(0, 160) }; }
});

// Giữ nguyên thư mục userData cũ (chứa con trỏ vị trí dữ liệu + bản sao lưu) để không mất dữ liệu khi đổi tên app thành EnV
app.setPath('userData', path.join(app.getPath('appData'), 'Listening Transcript'));

// Chỉ cho chạy 1 cửa sổ
if (!app.requestSingleInstanceLock()) app.quit();

let win;
function createWindow() {
  win = new BrowserWindow({
    width: 1280, height: 820, minWidth: 360, minHeight: 560, // cho phép thu nhỏ như màn hình điện thoại để thử responsive
    backgroundColor: '#faf7f0',
    title: 'EnV',
    icon: path.join(__dirname, '..', 'build', 'icon.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  Menu.setApplicationMenu(null);
  win.loadFile(path.join(__dirname, '..', 'src', 'index.html'));
  // Link ngoài mở bằng trình duyệt, không mở trong app
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith('file://')) { e.preventDefault(); shell.openExternal(url); } });
}

ipcMain.handle('store:load', () => store.load());
ipcMain.on('store:save', (e, data) => { try { store.save(data); e.returnValue = true; } catch (err) { e.returnValue = false; } });
ipcMain.handle('store:info', () => store.info());
ipcMain.handle('store:saveFile', (e, tab, name, buf) => { try { return store.saveFile(tab, name, buf); } catch (err) { return false; } });
ipcMain.handle('store:chooseDir', async () => {
  const r = await dialog.showOpenDialog(win, { title: 'Chọn thư mục lưu dữ liệu (ví dụ ổ D)', properties: ['openDirectory', 'createDirectory'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  return store.setDir(path.basename(p).toLowerCase() === 'env-data' ? p : path.join(p, 'EnV-Data'));
});
ipcMain.handle('store:open', () => shell.openPath(store.dir()));

// ---- Tự cập nhật (chỉ chạy khi đã cài bằng bộ cài, không chạy ở npm start) ----
const status = s => { if (win && !win.isDestroyed()) win.webContents.send('upd:status', s); };
const isPortable = !!process.env.PORTABLE_EXECUTABLE_DIR;
let lastCheck = 0;
function repoInfo() {   // owner/repo do electron-builder ghi vào app-update.yml lúc build
  try {
    const t = fs.readFileSync(path.join(process.resourcesPath, 'app-update.yml'), 'utf8');
    const o = (t.match(/^owner:\s*(.+)$/m) || [])[1], r = (t.match(/^repo:\s*(.+)$/m) || [])[1];
    if (o && r) return { owner: o.trim(), repo: r.trim() };
  } catch (_) {}
  return null;
}
const ver = v => String(v || '').replace(/^v/i, '').split(/[.-]/).map(x => parseInt(x, 10) || 0);
const newer = (a, b) => { const x = ver(a), y = ver(b); for (let i = 0; i < 3; i++) { if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) > (y[i] || 0); } return false; };
// hỏi thẳng GitHub: bản mới nhất là gì (không phụ thuộc bộ tự cập nhật) -> luôn báo được "có bản mới"
async function latestRelease() {
  const ri = repoInfo();
  if (!ri) return { ok: false, m: app.isPackaged ? 'Chưa biết repo GitHub của app (thiếu app-update.yml).' : 'Chế độ chạy thử.' };
  try {
    const r = await net.fetch(`https://api.github.com/repos/${ri.owner}/${ri.repo}/releases/latest`, { headers: { 'User-Agent': 'EnV-App', Accept: 'application/vnd.github+json' } });
    if (!r.ok) return { ok: false, status: r.status, m: 'GitHub trả về mã ' + r.status + (r.status === 404 ? ' (repo Private hoặc chưa có Release)' : '') };
    const j = await r.json();
    return { ok: true, tag: j.tag_name, url: j.html_url, current: app.getVersion(), newer: newer(j.tag_name, app.getVersion()) };
  } catch (e) { return { ok: false, m: String((e && e.message) || e).slice(0, 160) }; }
}
function checkNow() {
  lastCheck = Date.now();
  if (!app.isPackaged) return Promise.resolve(status({ s: 'dev' }));
  if (isPortable) return Promise.resolve(status({ s: 'portable' }));   // bản portable không tự thay file được
  return autoUpdater.checkForUpdates().catch(() => {});
}
function initUpdater() {
  if (!app.isPackaged || isPortable) return;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.allowPrerelease = false;
  autoUpdater.on('checking-for-update', () => status({ s: 'checking' }));
  autoUpdater.on('update-available', i => status({ s: 'available', v: i.version }));
  autoUpdater.on('update-not-available', () => status({ s: 'none' }));
  autoUpdater.on('download-progress', p => status({ s: 'progress', p: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', i => status({ s: 'ready', v: i.version }));
  autoUpdater.on('error', e => status({ s: 'error', m: String((e && e.message) || e).slice(0, 200) }));
  setTimeout(checkNow, 4000);
  setInterval(checkNow, 4 * 3600 * 1000);                          // kiểm tra lại mỗi 4 giờ khi app đang mở
  app.on('browser-window-focus', () => { if (Date.now() - lastCheck > 30 * 60 * 1000) checkNow(); });
}
ipcMain.handle('upd:version', () => app.getVersion());
ipcMain.handle('upd:check', () => checkNow());
ipcMain.handle('upd:latest', () => latestRelease());
ipcMain.handle('upd:open', (e, url) => { if (/^https:\/\/github\.com\//.test(String(url))) shell.openExternal(url); });
ipcMain.on('upd:install', () => autoUpdater.quitAndInstall());
app.on('before-quit', () => { try { store.mirrorNow(); } catch (_) {} });

app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });
app.whenReady().then(() => { createWindow(); initUpdater(); });
app.on('window-all-closed', () => app.quit());

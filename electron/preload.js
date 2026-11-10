const { contextBridge, ipcRenderer } = require('electron');

// Cầu nối an toàn: giao diện web chỉ gọi được các hàm lưu trữ này.
contextBridge.exposeInMainWorld('nativeStore', {
  load: () => ipcRenderer.invoke('store:load'),
  save: (data) => ipcRenderer.sendSync('store:save', data),
  info: () => ipcRenderer.invoke('store:info'),
  saveFile: (tab, name, buf) => ipcRenderer.invoke('store:saveFile', tab, name, buf),
  chooseDir: () => ipcRenderer.invoke('store:chooseDir'),
  openFolder: () => ipcRenderer.invoke('store:open'),
});

contextBridge.exposeInMainWorld('appUpdate', {
  version: () => ipcRenderer.invoke('upd:version'),
  check: () => ipcRenderer.invoke('upd:check'),
  latest: () => ipcRenderer.invoke('upd:latest'),
  open: url => ipcRenderer.invoke('upd:open', url),
  install: () => ipcRenderer.send('upd:install'),
  onStatus: cb => ipcRenderer.on('upd:status', (e, s) => cb(s)),
});

contextBridge.exposeInMainWorld('nativeTTS', {
  synth: (kind, voice, text) => ipcRenderer.invoke('tts:synth', kind, voice, text),
});

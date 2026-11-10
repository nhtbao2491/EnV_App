/* Service worker: cache khung app để mở offline trên điện thoại (chỉ chạy khi host bằng http/https) */
const V='ltt-v11';
const FILES=['./','index.html','manifest.webmanifest','css/app.css','css/layout.css','css/data.css','css/practice.css','css/edit.css',
  'js/storage.js','js/player.js','js/reader.js','js/library.js','js/guides.js','js/parsers.js','js/lib2.js','js/import.js','js/writing.js','js/builtin.js','js/builtin2.js','js/builtin3.js','js/sentences.js','js/phanxa.js','js/tabs.js','js/data.js','js/updater.js','js/app.js',
  'vendor/jszip.min.js','vendor/pdf.min.js','vendor/pdf.worker.min.js','assets/icon-192.png','assets/icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(
  caches.open(V).then(c=>Promise.all(FILES.map(f=>c.add(f).catch(()=>{})))).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(
  caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open(V).then(x=>x.put(e.request,c));return r})
    .catch(()=>caches.match(e.request)));
});

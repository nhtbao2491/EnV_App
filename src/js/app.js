/* Khởi động: nạp dữ liệu đã lưu -> dựng giao diện -> nhớ cài đặt người dùng */
(async function(){
  await Store.init();
  if(typeof loadVoices==='function')loadVoices();   // áp dụng lại bộ lọc giọng đã lưu
  allReload();tabGo(Store.get('tab','l'));

  // Nhớ cài đặt trình phát + bản nháp transcript
  const ST=Store.get('settings',{});
  const ctl={rate:'value',gap:'value',rep:'checked',hid:'checked'};
  Object.entries(ctl).forEach(([id,prop])=>{
    const e=$(id);if(!e)return;
    if(id in ST){e[prop]=ST[id];e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
    const save=()=>{const s=Store.get('settings',{});s[id]=e[prop];Store.set('settings',s)};
    e.addEventListener('input',save);e.addEventListener('change',save);
  });
  const t=$('txt'),draft=Store.get('draft','');
  if(draft&&!t.value)t.value=draft;
  t.addEventListener('input',()=>Store.set('draft',t.value));

  // Bản web/điện thoại: đăng ký service worker để cài lên màn hình chính & chạy offline
  if('serviceWorker' in navigator&&/^https?:$/.test(location.protocol)){
    navigator.serviceWorker.register('sw.js').catch(()=>{});
  }
})();

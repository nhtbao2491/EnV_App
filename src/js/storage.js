/*
 * Store — lớp lưu trữ cục bộ dùng chung cho mọi nền tảng.
 *  - Bản .exe (Electron): lưu vào file JSON trong thư mục dữ liệu người dùng (có bản .bak).
 *  - Bản web / điện thoại: lưu vào localStorage của trình duyệt.
 * Đọc/ghi đồng bộ trên bộ nhớ đệm, tự ghi xuống đĩa sau ~300ms.
 * Thêm dữ liệu mới của app: chỉ cần Store.set('tenKhoa', giaTri).
 */
const Store=(()=>{
  const WEB_KEY='ltt:db',native=window.nativeStore||null;
  let db={},timer=null;

  async function init(){
    try{
      if(native)db=(await native.load())||{};
      else{const raw=localStorage.getItem(WEB_KEY);db=raw?JSON.parse(raw):{}}
    }catch(e){db={}}
    if(!db||typeof db!=='object'||Array.isArray(db))db={};
    // chuyển dữ liệu từ bản HTML đơn lẻ cũ (khóa 'rdData' trong localStorage)
    try{
      if(db.rdData==null){const old=localStorage.getItem('rdData');if(old){db.rdData=JSON.parse(old);flush()}}
    }catch(e){}
  }
  function flush(){
    clearTimeout(timer);timer=null;
    try{
      if(native)native.save(db);
      else localStorage.setItem(WEB_KEY,JSON.stringify(db));
    }catch(e){console.warn('Không lưu được dữ liệu',e)}
  }
  function schedule(){clearTimeout(timer);timer=setTimeout(flush,300)}
  const get=(k,def)=>k in db?db[k]:def;
  const set=(k,v)=>{db[k]=v;schedule()};
  const remove=k=>{delete db[k];schedule()};
  function clearAll(){db={};flush()}
  const all=()=>JSON.parse(JSON.stringify(db));
  const size=()=>new Blob([JSON.stringify(db)]).size;

  async function info(){
    const base={where:native?'File trên máy (bản .exe)':'Bộ nhớ trình duyệt',bytes:size(),path:'',canOpen:!!native};
    if(native&&native.info){try{Object.assign(base,await native.info())}catch(e){}}
    return base;
  }
  function exportBackup(){
    const blob=new Blob([JSON.stringify({app:'listening-transcript',version:1,savedAt:new Date().toISOString(),data:db},null,2)],{type:'application/json'});
    const a=document.createElement('a');a.href=URL.createObjectURL(blob);
    a.download='listening-backup-'+new Date().toISOString().slice(0,10)+'.json';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  }
  async function importBackup(file,mode='merge'){
    const j=JSON.parse(await file.text());
    const d=j&&j.data&&typeof j.data==='object'?j.data:null;
    if(!d||j.app!=='listening-transcript')throw new Error('File không phải bản sao lưu của app này.');
    if(mode==='replace')db={};
    if(mode==='merge'&&Array.isArray(d.rdData)){
      const cur=Array.isArray(db.rdData)?db.rdData:[];
      d.rdData.forEach(g=>{const i=cur.findIndex(x=>x.name===g.name);if(i>=0)cur[i]=g;else cur.push(g)});
      db={...db,...d,rdData:cur};
    }else db={...db,...d};
    flush();
  }
  // lưu thêm bản gốc của file vừa tải lên vào thư mục dữ liệu cạnh nơi cài đặt (chỉ bản .exe; bản web chỉ lưu dữ liệu đã đọc)
  async function archive(tab,file){
    if(!native||!native.saveFile||!file)return false;
    try{return await native.saveFile(String(tab||'khac'),file.name,await file.arrayBuffer())}catch(e){console.warn('Không lưu được bản gốc',e);return false}
  }
  window.addEventListener('pagehide',()=>{if(timer)flush()});
  window.addEventListener('beforeunload',()=>{if(timer)flush()});
  return{init,get,set,remove,clearAll,all,size,info,exportBackup,importBackup,flush,archive};
})();

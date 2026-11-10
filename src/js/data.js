/* Bảng "Dữ liệu": xem dung lượng, sao lưu, khôi phục, xóa toàn bộ */
(function(){
  const dd=$('dd'),msg=$('ddmsg');let opener=null,delT=null;
  const fmt=b=>b<1024?b+' B':b<1048576?(b/1024).toFixed(1)+' KB':(b/1048576).toFixed(2)+' MB';
  async function render(){
    const i=await Store.info(),g=Store.get('rdData',[]),wn=WL.total(),sn=SL.total(),pn=PL.total();
    const n=g.reduce((a,x)=>a+(x.items||[]).length,0);
    $('ddinfo').innerHTML='';
    [['Nơi lưu',i.where],['Đường dẫn',i.path||'—'],['Dung lượng',fmt(i.bytes)],['File gốc đã tải lên',i.uploads?(i.uploads.files+' file · '+fmt(i.uploads.bytes)+' (thư mục uploads cạnh nơi lưu)'):'— (chỉ bản .exe lưu thêm file gốc)'],['Thư viện',g.length+' thư mục · '+n+' bài nghe'],['Bài viết',wn+' bài'],['Ghép câu · Ráp từ',sn+' unit'],['Ghép câu · Viết câu',pn+' unit']]
      .forEach(([k,v])=>{const r=document.createElement('div');r.className='kv';
        const a=document.createElement('b');a.textContent=k;const b=document.createElement('span');b.textContent=v;r.append(a,b);$('ddinfo').appendChild(r)});
    $('ddopen').hidden=!i.canOpen;$('ddmove').hidden=!i.canOpen;
  }
  function open(){opener=document.activeElement;dd.hidden=false;msg.textContent='';render();$('ddx').focus()}
  function close(){dd.hidden=true;if(opener)opener.focus()}
  $('dataBtn').onclick=open;$('ddx').onclick=close;
  dd.onclick=e=>{if(e.target===dd)close()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dd.hidden)close()});

  $('ddexp').onclick=()=>{Store.exportBackup();msg.textContent='Đã tạo file sao lưu (.json).'};
  $('ddimp').onchange=async e=>{
    const f=e.target.files[0];e.target.value='';if(!f)return;
    try{
      await Store.importBackup(f,$('ddrep').checked?'replace':'merge');
      allReload();render();msg.textContent='Đã khôi phục từ “'+f.name+'”.';
    }catch(err){msg.textContent='Lỗi: '+err.message}
  };
  $('ddmove').onclick=async()=>{
    try{const d=await window.nativeStore.chooseDir();if(d){msg.textContent='Đã chuyển dữ liệu sang: '+d;render()}}
    catch(err){msg.textContent='Không đổi được nơi lưu: '+err.message}
  };
  $('ddopen').onclick=()=>window.nativeStore&&window.nativeStore.openFolder();
  const b=$('ddclr');
  b.onclick=()=>{
    if(b.dataset.s){
      clearTimeout(delT);delete b.dataset.s;b.textContent='🗑 Xóa toàn bộ dữ liệu';b.classList.remove('dg');
      Store.clearAll();allClear();render();msg.textContent='Đã xóa toàn bộ dữ liệu đã lưu (bài nghe, bài viết, ghép câu).';
    }else{
      b.dataset.s=1;b.textContent='Bấm lần nữa để xóa hết';b.classList.add('dg');
      delT=setTimeout(()=>{delete b.dataset.s;b.textContent='🗑 Xóa toàn bộ dữ liệu';b.classList.remove('dg')},3500);
    }
  };
})();

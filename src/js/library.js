/* Thư viện bài nghe: thư mục, thêm/xóa/đổi tên, lưu qua Store */
const SPK=/^([^:.!?,]{1,40}):\s+(.+)$/;
const kind=t=>t.split(/\n+/).filter(l=>SPK.test(l.trim())).length>=2?'d':'r';
const el=(t,c,x)=>{const e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e};
function rdSave(){Store.set('rdData',RD.groups)}
const rdGid=g=>g.file||g.id||(g.id='g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
// nhớ bài nghe đang mở (qua các lần mở app)
function rdSelect(it){
  RD.sel=it;const g=it&&RD.groups.find(x=>x.items.includes(it));
  if(g)Store.set('cur:rd',{g:rdGid(g),t:it.title,i:g.items.indexOf(it)});else Store.remove('cur:rd');
}
function rdRestore(){
  const c=Store.get('cur:rd',null);RD.sel=null;if(!c)return;
  const g=RD.groups.find(x=>rdGid(x)===c.g);if(g)RD.sel=g.items.find(x=>x.title===c.t)||g.items[c.i]||null;
}
// Bài nghe mẫu có sẵn: luôn nằm trong danh sách, không xóa / đổi tên được
function rdBuiltin(){
  return{ver:1,groups:[{file:'bai-nghe-mau',name:'Bài nghe mẫu (có sẵn)',items:[
    {title:'Wonders of the Natural World (độc thoại)',text:S1},
    {title:'Job Interview — three candidates (hội thoại)',text:S2},
    {title:'A Busy Morning (độc thoại ngắn)',text:'Anna wakes up early and makes a cup of tea. She checks her phone and reads a short message from her teacher.\n\nAfter breakfast, she walks to the bus stop and talks with a neighbour about the weather. The bus arrives a few minutes late, but she does not mind. She enjoys looking out of the window and listening to music on the way to work.'},
    {title:'At the Café (hội thoại ngắn)',text:'Anna: Hi, Ben! Have you been waiting long?\nBen: Not really. I just ordered two coffees.\nAnna: Thanks. Shall we sit by the window?\nBen: Sure. It is much quieter there.\nAnna: How was your weekend?\nBen: It was great. I visited my grandparents in the countryside.\nAnna: That sounds lovely. I stayed at home and finished a book.'},
    {title:'Planning a Weekend Trip (hội thoại)',text:'Tom: Where should we go this weekend?\nAnna: I think we should visit the beach.\nTom: Great idea. Shall we leave early in the morning?\nAnna: Yes, let us leave at six to avoid the traffic.\nTom: Perfect. I will bring some sandwiches and water.\nAnna: And I will check the weather forecast tonight.'}
  ]}]};
}
function rdEnsure(){
  const ch=fixedSync(RD.groups,rdBuiltin(),it=>({title:it.title,text:it.text}),(n,m)=>{n.done=m.done});
  RD.groups.forEach(g=>{g.open=!!g.open;rdGid(g)});
  return ch;
}
function rdLoad(){const d=Store.get('rdData',[]);if(Array.isArray(d))RD.groups=d.filter(g=>g&&Array.isArray(g.items));RD.groups.forEach(g=>{g.open=false;rdGid(g)});if(rdEnsure())rdSave();rdRestore()}
function ren(target,val,set,after){
  const inp=el('input','tn');inp.value=val;inp.setAttribute('aria-label','Đổi tên');
  target.replaceWith(inp);inp.focus();inp.select();let d=false;
  inp.onblur=()=>{if(d)return;d=true;const v=inp.value.trim();if(v)set(v);if(after)after();else{rdSave();rdRender()}};
  inp.onkeydown=e=>{if(e.key==='Enter')inp.blur();if(e.key==='Escape'){inp.value='';inp.blur()}};
}
function del2(btn,fn){
  let t;btn.onclick=()=>{
    if(btn.dataset.s){clearTimeout(t);fn()}
    else{btn.dataset.s=1;btn.textContent='Xóa?';btn.classList.add('dg');t=setTimeout(()=>{delete btn.dataset.s;btn.textContent='🗑';btn.classList.remove('dg')},3000)}
  };
}
function rdRender(){
  const q=RD.q.trim().toLowerCase(),box=$('rl');box.innerHTML='';let tot=0,shown=0,dn=0;
  RD.groups.forEach((g,gi)=>{
    tot+=g.items.length;dn+=g.items.filter(x=>x.done).length;
    const nameHit=q&&g.name.toLowerCase().includes(q);
    const hit=g.items.map((_,i)=>i).filter(i=>!q||nameHit||(g.items[i].title+' '+g.items[i].text).toLowerCase().includes(q));
    if(q&&!hit.length)return;
    shown++;
    const open=q?true:!!g.open;
    const fr=el('div','fr'),fb=el('button','fd');
    fb.setAttribute('aria-expanded',open);fb.title=g.name;
    if(RD.sel&&g.items.includes(RD.sel))fb.classList.add('curf');
    fb.append(el('span','',open?'▾':'▸'),el('span','','📁'),el('span','nm',g.name),el('span','cnt',g.items.filter(x=>x.done).length+'/'+g.items.length));
    fb.onclick=()=>{g.open=!g.open;rdSave();rdRender()};
    const en=el('button','ib','✎');en.title='Đổi tên thư mục';en.setAttribute('aria-label','Đổi tên thư mục '+g.name);
    en.onclick=()=>ren(fb,g.name,v=>{g.name=v});
    const dl=el('button','ib','🗑');dl.title='Xóa thư mục';dl.setAttribute('aria-label','Xóa thư mục '+g.name);
    del2(dl,()=>{RD.groups.splice(gi,1);rdSave();rdRender()});
    if(g.fixed)fr.append(fb);else fr.append(fb,en,dl);
    box.appendChild(fr);
    if(g._new){delete g._new;setTimeout(()=>en.click())}
    if(!open)return;
    const ch=el('div','ch');
    if(!g.items.length)ch.appendChild(el('p','mute','Thư mục trống'));
    hit.forEach(i=>{
      const it=g.items[i],row=el('div','rw');
      const b=el('button','pk'+(RD.sel===it?' on':''));
      const k=kind(it.text),ic=el('span','ic',k==='d'?'💬':'📖');
      ic.title=k==='d'?'Hội thoại':'Bài đọc';ic.setAttribute('role','img');ic.setAttribute('aria-label',ic.title);
      b.title=it.title;b.append(ic,el('span','tt',(i+1)+'. '+it.title));
      if(RD.sel===it)b.appendChild(el('span','bdg cur','● Đang nghe'));
      b.onclick=()=>rdPick(it);
      const e=el('button','ib','✎');e.title='Đổi tên bài';e.setAttribute('aria-label','Đổi tên bài '+(i+1));
      e.onclick=()=>ren(b,it.title,v=>{it.title=v});
      const d=el('button','ib','🗑');d.title='Xóa bài';d.setAttribute('aria-label','Xóa bài '+(i+1));
      del2(d,()=>{g.items.splice(i,1);if(RD.sel===it)RD.sel=null;rdSave();rdRender()});
      const ok=!!it.done,st=el('button','st'+(ok?' on':''),ok?'✓':'');
      st.title=ok?'Đã nghe — bấm để bỏ đánh dấu':'Chưa nghe — bấm để đánh dấu đã nghe';st.setAttribute('aria-pressed',ok);st.setAttribute('aria-label',st.title);
      st.onclick=()=>{it.done=!it.done;rdSave();rdRender()};
      if(g.fixed)row.append(st,b);else row.append(st,b,e,d);
      ch.appendChild(row);
    });
    box.appendChild(ch);
  });
  if(!shown){box.appendChild(el('p','mute',tot?'Không có bài nào khớp.':'Chưa có bài nghe. Hãy tải file lên hoặc tạo thư mục mới.'))}
  $('rc').textContent=tot?'('+dn+'/'+tot+')':'';$('rsum').textContent=tot?'Đã nghe '+dn+'/'+tot+' bài  ·  ✓ = đã nghe, ○ = chưa nghe':'';
}
function rdPick(it){
  rdSelect(it);$('txt').value=it.text;build();rdRender();
  rdShow(false);
  $('player').scrollIntoView({behavior:'smooth',block:'start'});
}
function rdShow(on){
  const p=$('rd');p.hidden=!on;$('rb').hidden=!on;
  if(on){
    // mở sẵn thư mục chứa bài đang nghe và cuộn tới đúng chỗ đó
    RD.q='';$('rq').value='';
    const g=RD.sel&&RD.groups.find(x=>x.items.includes(RD.sel));if(g)g.open=true;
    rdRender();
    const cur=$('rl').querySelector('.pk.on');
    if(cur)setTimeout(()=>cur.scrollIntoView({block:'center'}));
    else if(!matchMedia('(pointer:coarse)').matches)$('rq').focus({preventScroll:true});
  }
}
async function rdFiles(files){
  const msg=$('rmsg');
  for(const f of files){
    msg.textContent='Đang đọc '+f.name+'...';
    try{
      const ext=f.name.split('.').pop().toLowerCase();
      if(ext!=='docx'&&ext!=='pdf')throw new Error('chỉ hỗ trợ .docx và .pdf');
      const items=await(ext==='pdf'?readPdf(f):readDocx(f));
      if(!items.length)throw new Error('không nhận diện được bài đọc nào (kiểm tra tiêu đề có chữ lớn hoặc in đậm không).');
      msg.textContent='Đã đọc “'+f.name+'” — hãy kiểm tra ở bảng xem trước.';
      const nd=items.filter(x=>kind(x.text)==='d').length,short=items.filter(x=>x.text.trim().split(/\s+/).length<15).length;
      const c=await impAsk({file:f.name,fileObj:f,tab:'nghe',noun:'bài nghe',items,groups:()=>RD.groups,
        warns:[short?short+' bài rất ngắn (dưới 15 từ) — có thể bị tách sai tiêu đề.':''].filter(Boolean),
        line:it=>({t:it.title,b:(kind(it.text)==='d'?'💬 hội thoại':'📖 độc thoại')+' · '+it.text.trim().split(/\s+/).length+' từ'}),
        sample:it=>{const ls=parse(it.text);return ls.slice(0,5).map(l=>(l.turn&&l.who?l.who+': ':'')+l.text).concat(ls.length>5?['… và '+(ls.length-5)+' câu nữa']:[])}});
      if(!c){msg.textContent='Đã hủy — chưa thêm “'+f.name+'” vào danh sách.';continue}
      const its=c.items;
      let old=c.target==='file'?RD.groups.findIndex(g=>g.file===f.name):-1;
      if(old>=0){its.forEach(n=>{const m=RD.groups[old].items.find(x=>x.title===n.title&&x.text===n.text);if(m&&m.done)n.done=true})}
      if(c.target==='file'){
        const grp={file:f.name,name:old>=0?RD.groups[old].name:c.name,open:true,items:its};
        if(old>=0)RD.groups[old]=grp;else RD.groups.push(grp);rdGid(grp);
      }else if(c.target==='new'){const g={name:c.name,open:true,items:its};if(!RD.groups.some(x=>x.file===f.name))g.file=f.name;rdGid(g);RD.groups.push(g)}
      else{const g=RD.groups[+c.target];its.forEach(n=>g.items.push(n));g.open=true}
      msg.textContent='Đã thêm '+its.length+' bài nghe từ “'+f.name+'”. Bấm “📚 Bài nghe” để chọn.';
    }catch(e){msg.textContent='Lỗi với '+f.name+': '+e.message}
  }
  RD.sel=null;Store.remove('cur:rd');rdSave();rdRender();
  $('gopen').hidden=!RD.groups.length;
  const rb=$('ro');rb.classList.add('pulse');setTimeout(()=>rb.classList.remove('pulse'),2400);
}
// ---- thêm bài nghe vào thư mục (như playlist) ----
function addFill(){
  const s=$('af');s.innerHTML='';
  RD.groups.forEach((g,i)=>{if(!g.fixed)s.appendChild(new Option(g.name,i))});
  s.appendChild(new Option('＋ Thư mục mới…','new'));
  const firstFree=RD.groups.findIndex(g=>!g.fixed);
  s.value=firstFree>=0?(RD.last!=null&&RD.groups[RD.last]&&!RD.groups[RD.last].fixed?RD.last:firstFree):'new';
  $('anf').hidden=s.value!=='new';
}
function addOpen(){
  const t=$('txt').value.trim();
  if(!t){$('amsg').textContent='Ô Transcript đang trống — hãy nạp hoặc dán nội dung trước.';return}
  $('amsg').textContent='';
  const ls=parse(t),k=kind(t),who=[...new Set(ls.map(l=>l.who))];
  const dup=RD.groups.find(g=>g.items.some(i=>i.text.trim()===t));
  $('pvm').textContent=(k==='d'?'💬 Hội thoại':'📖 Độc thoại')+' · '+ls.length+' câu · '+t.split(/\s+/).length+' từ'+(k==='d'?' · '+who.length+' người nói':'');
  const pv=$('pvt');pv.innerHTML='';
  if(dup)pv.appendChild(el('div','pvw','⚠ Nội dung này đã có trong thư mục “'+dup.name+'”.'));
  ls.slice(0,12).forEach(l=>{const d=el('div','pvl');if(k==='d'&&l.turn)d.appendChild(el('b','',l.who+': '));d.appendChild(el('span','',l.text));pv.appendChild(d)});
  if(ls.length>12)pv.appendChild(el('div','mute','… và '+(ls.length-12)+' câu nữa'));
  $('at').value=(RD.sel&&RD.sel.text===t)?RD.sel.title:t.split(/\s+/).slice(0,6).join(' ');
  $('anf').value='Bài nghe của tôi';addFill();$('ad').hidden=false;$('at').focus();$('at').select();
}
function addSave(){
  const t=$('txt').value.trim(),title=$('at').value.trim()||'Bài nghe mới';
  if(!t)return;
  let g;
  if($('af').value==='new'){g={name:$('anf').value.trim()||'Bài nghe của tôi',open:false,items:[]};rdGid(g);RD.groups.push(g)}
  else g=RD.groups[+$('af').value];
  const it={title,text:t};g.items.push(it);
  rdSelect(it);RD.last=RD.groups.indexOf(g);rdSave();rdRender();
  $('ad').hidden=true;$('amsg').textContent='Đã lưu “'+title+'” vào thư mục “'+g.name+'”.';
}
$('addb').onclick=addOpen;
$('acx').onclick=$('adx').onclick=()=>{$('ad').hidden=true;$('addb').focus()};
$('ad').onclick=e=>{if(e.target===$('ad'))$('ad').hidden=true};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('ad').hidden)$('ad').hidden=true});
$('asv').onclick=addSave;
$('af').onchange=()=>{$('anf').hidden=$('af').value!=='new'};
$('at').onkeydown=e=>{if(e.key==='Enter')addSave()};
$('rn').onclick=()=>{const ng={name:'Thư mục mới',open:false,items:[],_new:true};rdGid(ng);RD.groups.push(ng);RD.q='';$('rq').value='';rdSave();rdRender()};
$('rf').onchange=e=>{if(e.target.files.length)rdFiles([...e.target.files]);e.target.value=''};
$('ro').onclick=()=>rdShow($('rd').hidden);
$('rx').onclick=()=>rdShow(false);
$('rb').onclick=()=>rdShow(false);
$('rq').oninput=e=>{RD.q=e.target.value;rdRender()};
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('rd').hidden)rdShow(false)});
$('gopen').onclick=()=>{gClose();rdShow(true)};

// đánh dấu đã nghe khi phát hết bài (gọi từ player.js)
function lsDone(){if(RD.sel&&!RD.sel.done){RD.sel.done=true;rdSave();rdRender()}}

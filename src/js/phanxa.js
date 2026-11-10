/* Ghép câu — LOẠI 2: “Viết câu”. Mỗi câu gồm câu tiếng Việt + vài từ gợi ý (từ · loại từ · nghĩa);
 * người học tự viết câu tiếng Anh vào dòng “→”. Bộ có sẵn (builtin2.js) kèm đáp án nên app chấm điểm tự động (theo từ & thứ tự từ). */
const X={sel:null,mode:'a',hide:false};
const xDone=it=>it.sents.filter(s=>(s.u||'').trim()).length;
const PL=makeLib({
  key:'pxData',noNum:true,title:'Danh sách bài viết câu',search:'Tìm unit hoặc câu...',count:'xc',
  emptyMsg:'Chưa có bài viết câu.',
  textOf:it=>it.title+' '+it.sents.map(s=>s.vi).join(' '),
  isDone:it=>!!it.done,toggle:it=>{it.done=!it.done},
  doneTip:'Đã viết xong unit — bấm để bỏ đánh dấu',todoTip:'Chưa xong — bấm để đánh dấu đã viết xong unit',
  row:it=>({ic:'✍',tt:it.title,badges:[xDone(it)+'/'+it.sents.length]}),
  sum:(t,d)=>'Đã xong '+d+'/'+t+' unit  ·  ✓ = xong, ○ = chưa xong',
  pick:it=>{xMode('b');xShow(it)},
  create:()=>xNew(),add:gi=>xNew(gi),edit:it=>xNew(null,it)
});

function xMode(m){
  X.mode=m;Store.set('smode',m);
  [['m1','a'],['m2','b']].forEach(([id,k])=>{const b=$(id);b.classList.toggle('on',m===k);b.setAttribute('aria-selected',m===k)});
  $('sintro').hidden=m!=='a';$('xintro').hidden=m!=='b';
  $('sunit').hidden=m!=='a'||!S.sel;$('xunit').hidden=m!=='b'||!X.sel;
  $('slb').textContent=m==='a'?'Ráp từ':'Viết câu';$('sic').textContent=m==='a'?'🧩':'✍';
  $('sc').hidden=m!=='a';$('xc').hidden=m!=='b';
  SL.show(false);PL.show(false);sClose();
}
function xRow(s,i,it){
  const d=el('div','xq'),v=el('div','sv');
  v.append(el('b','',s.n+'. '),s.vi);
  const h=el('ul','xh');
  s.h.forEach(([w,t,m])=>{const li=el('li');li.append(el('b','xw',w));if(t)li.append(' ',el('i','xt','('+t+')'));if(m)li.append(': '+m);h.appendChild(li)});
  const a=el('div','sa'),inp=el('textarea','si xi');
  inp.rows=1;inp.value=s.u||'';inp.spellcheck=false;inp.autocomplete='off';inp.autocapitalize='off';
  inp.setAttribute('aria-label','Câu '+s.n+' — câu tiếng Anh của bạn');
  const cap=el('button','ib','Aa'),clr=el('button','ib','⌫');
  cap.title='Viết hoa chữ đầu câu';clr.title='Xóa câu này';cap.type=clr.type='button';
  const fit=()=>{inp.style.height='auto';inp.style.height=Math.max(inp.scrollHeight,34)+'px'};
  const upd=()=>{s.u=inp.value;d.classList.toggle('has',!!inp.value.trim());PL.save();fit();xFoot(it)};
  inp.oninput=upd;
  inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const n=d.nextElementSibling;if(n){const x=n.querySelector('.si');if(x)x.focus()}}};
  cap.onclick=()=>{inp.value=inp.value.replace(/^(\s*)(\S)/,(m,sp,c)=>sp+c.toUpperCase());upd()};
  clr.onclick=()=>{inp.value='';upd();inp.focus()};
  a.append(el('span','ar','→'),inp,cap,clr);
  d.append(v,h,a);d._fit=fit;d.classList.toggle('has',!!(s.u||'').trim());
  return d;
}
function xHasKey(it){return it.sents.some(s=>s.key)}
function xFoot(it){
  $('xprog').textContent='Đã viết '+xDone(it)+'/'+it.sents.length+' câu';
  const b=$('xmark');b.textContent=it.done?'✓ Đã xong unit (bấm để bỏ)':'☐ Đánh dấu đã xong unit';b.classList.toggle('on',!!it.done);
  const has=xHasKey(it);
  $('xcheck').hidden=!!it.rv;$('xcheck').textContent=has?'✔ Kiểm tra đáp án':'👁 Hoàn tất & xem lại';
  $('xedit').hidden=!it.rv;$('xins').hidden=!!it.rv;
  const miss=it.sents.some(s=>!s.key);
  $('xkeyb').hidden=!(it.rv&&miss);$('xkeyclr').hidden=!it.sents.some(s=>s.pasted);
  $('xfm').textContent=it.savedAt?'Đã lưu lúc '+it.savedAt:'';
}
function xFlat(){return PL.groups.flatMap(g=>g.items)}
// dòng ở chế độ XEM KẾT QUẢ
function xRowRv(s,i,it){
  const r=s.key?checkSentence(s.u||'',s.key):{r:(s.u||'').trim()?'raw':'empty'};
  const d=el('div','xq rv'+(['ok','part','no'].includes(r.r)?' '+r.r:'')),v=el('div','sv');
  v.append(el('b','',s.n+'. '),s.vi);
  const h=el('ul','xh');
  s.h.forEach(([w,t,m])=>{const li=el('li');li.append(el('b','xw',w));if(t)li.append(' ',el('i','xt','('+t+')'));if(m)li.append(': '+m);h.appendChild(li)});
  const a=el('div','rva'),t=(s.u||'').trim();
  const eb=el('button','ib','✎');eb.type='button';eb.title='Sửa câu này';eb.setAttribute('aria-label','Sửa câu '+s.n);eb.onclick=()=>xEdit(i);
  a.append(el('span','ar','→'),el('span','rvt'+(t?'':' mute'),t||'(chưa viết)'),eb);
  const fb=el('div','sf');fbFill(fb,r,s);
  d.append(v,h,a,fb);return d;
}
function xList(it){
  const box=$('xlist');box.innerHTML='';
  it.sents.forEach((s,i)=>box.appendChild(it.rv?xRowRv(s,i,it):xRow(s,i,it)));
  [...box.children].forEach(c=>{if(c._fit)c._fit()});
  const r=$('xres');
  if(it.rv)gradeSummary(r,it.sents,'Một ý có thể viết bằng nhiều cách đúng — điểm chỉ cho biết bài bạn giống đáp án đã dán bao nhiêu.');else{r.hidden=true;r.textContent=''}
}
function xShow(it,quiet){
  X.sel=it;$('xunit').hidden=false;
  $('xutopic').textContent=it.topic||'';$('xutopic').hidden=!it.topic;
  $('xutitle').textContent=it.title;
  xList(it);
  const f=xFlat(),k=f.indexOf(it);
  $('xpos').textContent=k>=0?'Unit '+(k+1)+'/'+f.length:'';
  $('xprev').disabled=k<=0;$('xnext').disabled=k<0||k>=f.length-1;
  xFoot(it);xHint(X.hide);$('xfm').textContent=it.savedAt?'Đã lưu lúc '+it.savedAt:'';
  if(!quiet)$('xunit').scrollIntoView({behavior:'smooth',block:'start'});
}
function xHint(hide){
  X.hide=hide;Store.set('xhide',hide);
  $('xlist').classList.toggle('nohint',hide);
  $('xhint').textContent=hide?'👁 Hiện gợi ý':'🙈 Ẩn gợi ý';
}
function xStep(d){
  const f=xFlat(),k=f.indexOf(X.sel),n=f[k+d];
  if(k>=0&&n){PL.select(n);xShow(n)}
}
function xCheck(){
  const it=X.sel;if(!it)return;
  if(!xDone(it)){$('xprog').textContent='Hãy viết ít nhất một câu trước khi kiểm tra.';return}
  it.rv=true;it.done=true;PL.save();PL.render();
  xShow(it,true);$('xutitle').scrollIntoView({behavior:'smooth',block:'start'});
}
function xEdit(i){
  const it=X.sel;if(!it)return;
  it.rv=false;PL.save();xList(it);xFoot(it);
  const r=$('xlist').children[i||0];
  if(r){const x=r.querySelector('.si');if(x){x.focus();r.scrollIntoView({block:'center',behavior:'smooth'})}}
}
function xReset(){
  const it=X.sel;if(!it)return;
  it.sents.forEach(s=>{s.u=''});it.done=false;delete it.rv;delete it.savedAt;PL.save();PL.render();xShow(it,true);
}
function xSave(){
  const it=X.sel;if(!it)return;
  it.savedAt=nowHM();PL.save();Store.flush();
  const txt=it.title+'\n\n'+it.sents.map(s=>s.n+'. '+s.vi+'\n→ '+((s.u||'').trim()||'(chưa viết)')+(it.rv&&s.key?'\n   Đáp án: '+s.key.split(/\s*\|\s*/)[0]:'')).join('\n\n')+'\n\n(Lưu lúc '+it.savedAt+')\n';
  const ok=dlText('bai-lam-'+fileSlug(it.title)+'.txt',txt);
  xFoot(it);$('xfm').textContent='Đã lưu bài làm lúc '+it.savedAt+' (lưu trong app'+(ok?' và tải thêm một file .txt':'')+').';
}
function xCopy(){
  const it=X.sel;if(!it)return;
  $('xcp').value='Hãy sửa lỗi tiếng Anh cho từng câu dưới đây (mỗi câu một dòng theo dạng “1. câu đã sửa”, kèm giải thích ngắn lỗi sai).\n\n'+it.title+'\n\n'+it.sents.map(s=>s.n+'. '+s.vi+'\n→ '+((s.u||'').trim()||'(chưa viết)')).join('\n\n');
  copyEl('xcp','bài làm của unit này (kèm lời nhờ AI sửa)','xfm');
}
// dán đáp án / bản AI đã sửa: "1. câu đúng" mỗi dòng
function xKeyApply(){
  const it=X.sel;if(!it)return;
  let n=0;
  $('xkeyt').value.split(/\r?\n/).forEach(l=>{
    const m=l.match(/^\s*(?:câu\s*)?(\d+)\s*[.):\-–]\s*(?:[→➔➜]\s*)?(.+)$/i);if(!m)return;
    const s=it.sents.find(x=>x.n===+m[1]);if(s&&(!s.key||s.pasted)){s.key=NZ(m[2]);s.pasted=true;n++}
  });
  if(!n){$('xfm').textContent='Không nhận ra dòng nào. Mỗi dòng cần dạng “1. câu tiếng Anh”.';return}
  $('xkeyt').value='';PL.save();xList(it);xFoot(it);$('xfm').textContent='Đã áp dụng đáp án cho '+n+' câu và chấm điểm.';
}
function xKeyClear(){
  const it=X.sel;if(!it)return;
  it.sents.forEach(s=>{if(s.pasted){delete s.key;delete s.pasted}});PL.save();xList(it);xFoot(it);$('xfm').textContent='Đã xóa đáp án đã dán (đáp án có sẵn trong file vẫn giữ nguyên).';
}
/* bộ có sẵn: luôn có trong danh sách, giữ tiến độ khi cập nhật */
function xEnsureBuiltin(){
  const ch=fixedSync(PL.groups,BUILTIN_PX,
    u=>({title:u.title,topic:u.topic,sents:u.sents.map(s=>({n:s.n,vi:s.vi,h:s.h,key:s.key}))}),
    (n,m)=>{n.done=m.done;n.rv=m.rv;n.savedAt=m.savedAt;n.sents.forEach(s=>{const o=m.sents.find(y=>y.n===s.n);if(o){if(o.u)s.u=o.u;if(o.pasted&&!s.key){s.key=o.key;s.pasted=true}}})});
  if(ch){PL.sel=null;PL.save()}
}
const XP=`Hãy tạo bài tập VIẾT CÂU Việt → Anh gồm [5] unit, mỗi unit [30] câu, trình độ [B1], các chủ đề: [liệt kê tên chủ đề]. Xuất ra file Excel (.xlsx); nếu không tạo được thì xuất văn bản thuần theo đúng khung dưới đây.

KHUNG EXCEL (ưu tiên): MỘT sheet tên "Ghép câu", hàng 1 là tiêu đề, mỗi hàng sau là MỘT câu, đúng 5 cột:
A  Chủ đề      tên unit, GHI LẶP LẠI ở mọi hàng của unit đó (ví dụ: UNIT 1 · Chào hỏi)
B  STT         số thứ tự câu, đánh lại từ 1 trong mỗi unit
C  Tiếng Việt  câu tiếng Việt cần dịch
D  Gợi ý       2–4 gợi ý, mỗi gợi ý dạng  từ tiếng Anh (loại từ): nghĩa tiếng Việt  — cách nhau bằng dấu chấm phẩy ";"
E  Đáp án      câu tiếng Anh đúng, viết hoa đầu câu, có dấu câu — CỘT BẮT BUỘC, app dùng để chấm điểm

KHUNG VĂN BẢN (nếu không làm được Excel):
- Mỗi unit mở đầu bằng MỘT dòng:  UNIT 1 · TÊN UNIT   (đánh số 1, 2, 3...)
- Mỗi câu là MỘT dòng, ba phần cách nhau bằng dấu gạch đứng " | ":
  Câu tiếng Việt | gợi ý; gợi ý; gợi ý | đáp án tiếng Anh

Quy tắc:
- Đáp án luôn có đủ; nếu câu có hai cách viết đúng thì ghi cả hai, cách nhau bằng dấu | (trong Excel) .
- Gợi ý chọn đúng những từ/cụm người học dễ quên; độ khó tăng dần trong mỗi unit; đúng trình độ đã chọn.
- Dấu phẩy trong đáp án viết sát từ đứng trước (Hello, my name is Lan.). App chấm theo từ và thứ tự từ, không trừ điểm khi thiếu dấu câu.
- Văn bản thường: không in đậm, không markdown, không đánh số câu, không ghi chú chen vào, không công thức, không ô gộp, không thêm sheet.`;
const xCarry=(n,m)=>{n.done=m.done;n.rv=m.rv;n.savedAt=m.savedAt;n.sents.forEach(s=>{const o=m.sents.find(y=>y.vi===s.vi);if(o){if(o.u)s.u=o.u;if(o.key&&!s.key)s.key=o.key}})};
async function xFiles(files){
  const msg=$('xmsg');
  for(const f of files){
    msg.textContent='Đang đọc '+f.name+'...';
    try{
      const ext=f.name.split('.').pop().toLowerCase(),base=f.name.replace(/\.[^.]+$/,'');
      const items=ext==='xlsx'?parseXRows(await readXlsx(f)):parseXFileLines((await readLines(f)).lines,base);
      if(!items.length)throw new Error('không nhận diện được unit nào. Excel cần các cột Chủ đề · STT · Tiếng Việt · Gợi ý · Đáp án (tải file Excel mẫu); file Word/PDF/txt: mỗi câu một dòng “Câu Việt | gợi ý; gợi ý | đáp án” dưới dòng “UNIT 1 · …”.');
      const n=items.reduce((a,u)=>a+u.sents.length,0),k=items.reduce((a,u)=>a+u.sents.filter(s=>s.key).length,0),nh=items.reduce((a,u)=>a+u.sents.filter(s=>!s.h.length).length,0);
      msg.textContent='Đã đọc “'+f.name+'” — hãy kiểm tra ở bảng xem trước.';
      const c=await impAsk({file:f.name,fileObj:f,tab:'ghep-cau-viet-cau',noun:'unit',items,groups:()=>PL.groups,need:u=>u.sents.every(s=>s.key),
        warns:[k<n?(k?(n-k)+'/'+n+' câu chưa có đáp án (cột E). Unit thiếu đáp án được bỏ chọn sẵn vì không chấm điểm được — hãy bổ sung đáp án rồi tải lại.':'File chưa có đáp án (cột E) nên app không chấm điểm được. Hãy tải file Excel mẫu và điền đủ 5 cột.'):'',nh?nh+' câu chưa có gợi ý từ.':''].filter(Boolean),
        line:u=>({t:u.title,b:u.sents.length+' câu'}),
        sample:u=>u.sents.slice(0,4).map(s=>s.n+'. '+s.vi+(s.h.length?'  ·  gợi ý: '+s.h.map(h=>h[0]).join(', '):'')+(s.key?'   ✓ '+s.key.split(/\s*\|\s*/)[0]:'')).concat(u.sents.length>4?['… và '+(u.sents.length-4)+' câu nữa']:[])});
      if(!c){msg.textContent='Đã hủy — chưa thêm “'+f.name+'” vào danh sách.';continue}
      PL.addTo(c.target,f.name,c.items,xCarry,c.name);
      msg.textContent='Đã thêm '+c.items.length+' unit từ “'+f.name+'”. Bấm “📚 Mở danh sách bài viết câu” để chọn unit.';
    }catch(e){msg.textContent='Lỗi với '+f.name+': '+e.message}
  }
  const b=$('so');b.classList.add('pulse');setTimeout(()=>b.classList.remove('pulse'),2400);
}
// tạo mới / sửa một unit viết câu
function xNew(gi,edit){
  edOpen({
    title:edit?'Sửa unit viết câu':'Tạo unit viết câu mới',edit:!!edit,lib:PL,gi,
    fields:[
      {k:'title',label:'Tên unit',ph:'Ví dụ: UNIT 1 · Chào hỏi',val:edit?edit.title:''},
      {k:'lines',label:'Các câu (mỗi dòng một câu)',area:1,rows:9,
        ph:'Tôi đến từ Việt Nam. | from (giới từ): từ; Vietnam (danh từ riêng): Việt Nam | I come from Vietnam.\nMẹ tôi đang nấu ăn. | mother (danh từ): mẹ; cook (động từ): nấu ăn | My mother is cooking.',
        help:'Dạng:  Câu tiếng Việt | gợi ý; gợi ý | đáp án.  Gợi ý dạng “từ (loại từ): nghĩa”. Nên điền đủ đáp án để app chấm điểm được.',val:edit?xToLines(edit):''}
    ],
    parse:v=>{
      if(!v.title.trim())return{err:'Hãy nhập tên unit.'};
      const r=parseXLines(v.lines);
      if(r.errs.length)return{err:r.errs.slice(0,3).join(' · ')+(r.errs.length>3?' …':'')};
      if(!r.sents.length)return{err:'Hãy nhập ít nhất một câu.'};
      const k=r.sents.filter(x=>x.key).length;
      return{item:{title:NZ(v.title),topic:edit?edit.topic||'':'',sents:r.sents},info:'✓ '+r.sents.length+' câu · '+k+' câu có đáp án'};
    },
    save:(item,ch)=>{
      if(edit){
        item.sents.forEach(n=>{const o=edit.sents.find(x=>x.vi===n.vi);if(o&&o.u)n.u=o.u});
        edit.title=item.title;edit.sents=item.sents;PL.save();PL.render();if(X.sel===edit)xShow(edit,true);
      }else{edAddNew(PL,item,ch);xMode('b');xShow(item)}
    }
  });
}
(function(){
  $('xP').value=XP;
  $('xcp2').onclick=()=>copyEl('xP','prompt','xfm2');
  $('xf').onchange=e=>{if(e.target.files.length)xFiles([...e.target.files]);e.target.value=''};
  $('xnew').onclick=()=>xNew();
  $('xcheck').onclick=xCheck;$('xedit').onclick=()=>xEdit(0);$('xsave').onclick=xSave;
  $('xkeyok').onclick=xKeyApply;$('xkeyclr').onclick=xKeyClear;
  $('m1').onclick=()=>xMode('a');$('m2').onclick=()=>xMode('b');
  $('xopen').onclick=()=>PL.show(true);
  $('xprev').onclick=()=>xStep(-1);$('xnext').onclick=()=>xStep(1);
  $('xhint').onclick=()=>xHint(!X.hide);
  $('xmark').onclick=()=>{if(!X.sel)return;X.sel.done=!X.sel.done;PL.save();PL.render();xFoot(X.sel)};
  $('xreset').onclick=xReset;$('xcopy').onclick=xCopy;
  X.hide=!!Store.get('xhide',false);
})();

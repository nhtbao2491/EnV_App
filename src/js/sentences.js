/* Tab 3 — Ghép câu: danh sách tài liệu → unit → tất cả câu trong unit (câu Việt + các từ Anh cần ráp). */
const SP=`Hãy tạo file Excel (.xlsx) bài tập RÁP CÂU tiếng Anh gồm [5] chủ đề, mỗi chủ đề [30] câu, trình độ [B1], các chủ đề: [liệt kê tên chủ đề]. Nếu không tạo được file .xlsx thì xuất bảng văn bản, mỗi hàng một câu, các cột cách nhau bằng dấu Tab, đúng thứ tự cột bên dưới.

Cấu trúc bắt buộc: MỘT sheet tên "Ghép câu", hàng 1 là tiêu đề, mỗi hàng sau là MỘT câu, đúng 5 cột:
A  Chủ đề                    tên chủ đề, GHI LẶP LẠI ở mọi hàng của chủ đề đó (ví dụ: Chủ đề 1 · Chào hỏi)
B  STT                       số thứ tự câu, đánh lại từ 1 trong mỗi chủ đề
C  Tiếng Việt                câu tiếng Việt cần dịch
D  Tiếng Anh bị xáo trộn     các từ của câu đáp án xếp LỘN XỘN, cách nhau bằng dấu " / "
E  Đáp án                    câu tiếng Anh đúng, viết hoa đầu câu, có dấu câu — CỘT BẮT BUỘC, app dùng để chấm điểm

Quy tắc:
- Các từ ở cột D phải ghép lại ĐÚNG và ĐỦ thành câu ở cột E (không thiếu, không thừa; từ lặp lại thì ghi lặp lại).
- DẤU PHẨY (và dấu hai chấm, chấm phẩy) trong câu phải GẮN LIỀN với từ đứng ngay trước nó, không tách thành ô riêng. Ví dụ câu "Hello, my name is Lan." thì cột D là:  name / is / Lan / my / hello,
- Dấu chấm / hỏi / chấm than ở CUỐI câu thì KHÔNG ghi ở cột D (chỉ ghi ở cột E).
- Cột D viết thường, trừ tên riêng và chữ "I"; thứ tự từ phải thật sự bị xáo trộn, không để nguyên thứ tự câu đúng.
- Câu tiếng Việt dịch đúng nghĩa câu đáp án; độ khó tăng dần trong mỗi chủ đề (câu ngắn trước, câu dài sau); đúng trình độ đã chọn.
- Nếu một câu có hai cách ráp đúng, ghi cả hai ở cột E, cách nhau bằng dấu | .
- Mỗi ô chỉ chứa văn bản thuần: không công thức, không ô gộp, không ghi chú, không thêm sheet hay hàng/cột nào khác.`;

const S={sel:null};
const sDone=it=>it.sents.filter(x=>(x.u||'').trim()).length;
const SL=makeLib({
  key:'spData',noNum:true,title:'Danh sách bài ghép câu',search:'Tìm unit hoặc câu...',count:'sc',
  emptyMsg:'Chưa có bài ghép câu. Hãy tải file lên hoặc dùng bài mẫu.',
  textOf:it=>it.title+' '+it.sents.map(s=>s.vi).join(' '),
  isDone:it=>!!it.done,toggle:it=>{it.done=!it.done},
  doneTip:'Đã làm xong unit — bấm để bỏ đánh dấu',todoTip:'Chưa xong — bấm để đánh dấu đã xong unit',
  row:it=>({ic:'🧩',tt:it.title,badges:[sDone(it)+'/'+it.sents.length]}),
  sum:(t,d)=>'Đã xong '+d+'/'+t+' unit  ·  ✓ = xong, ○ = chưa xong',
  pick:it=>{xMode('a');sShow(it)},
  create:()=>sNew(),add:gi=>sNew(gi),edit:it=>sNew(null,it)
});
const COARSE=matchMedia('(pointer:coarse)').matches;

function sRow(s,i,it){
  const d=el('div','sq'),v=el('div','sv');
  v.append(el('b','',(i+1)+'. '),s.vi);
  const w=el('div','sw'),chips=s.words.map(x=>{const b=el('button','chip',x);b.type='button';return b});
  chips.forEach((b,k)=>{if(k)w.appendChild(el('span','sl2',' / '));w.appendChild(b)});
  const a=el('div','sa'),inp=el('input','si');
  inp.value=s.u||'';inp.autocomplete='off';inp.spellcheck=false;inp.autocapitalize='off';inp.setAttribute('aria-label','Câu '+(i+1)+' — đáp án của bạn');
  const cap=el('button','ib','Aa'),clr=el('button','ib','⌫');
  cap.title='Viết hoa chữ đầu câu';clr.title='Xóa câu này';
  cap.type=clr.type='button';
  const fb=el('div','sf');fb.hidden=true;
  const sync=()=>{const m=usedMask(s.words,inp.value);chips.forEach((b,k)=>b.classList.toggle('used',m[k]))};
  const upd=()=>{s.u=inp.value;fb.hidden=true;d.className='sq';SL.save();sync();sFoot(it)};
  chips.forEach((b,k)=>b.onclick=()=>{
    if(b.classList.contains('used'))return;
    inp.value=(inp.value.trim()?inp.value.replace(/\s+$/,'')+' ':'')+s.words[k];
    upd();if(!COARSE)inp.focus();
  });
  inp.oninput=upd;
  inp.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const n=d.nextElementSibling;if(n){const x=n.querySelector('.si');if(x)x.focus()}}};
  cap.onclick=()=>{inp.value=inp.value.replace(/^(\s*)(\S)/,(m,sp,c)=>sp+c.toUpperCase());upd()};
  clr.onclick=()=>{inp.value='';upd();inp.focus()};
  a.append(el('span','ar','→'),inp,cap,clr);
  d.append(v,w,a,fb);
  d._fb=fb;d._s=s;sync();
  return d;
}
function sFoot(it){
  const has=it.sents.some(s=>s.key),n=sDone(it);
  $('sprog').textContent='Đã điền '+n+'/'+it.sents.length+' câu';
  $('sgrade').hidden=!!it.rv;$('sgrade').textContent=has?'✔ Kiểm tra đáp án':'👁 Hoàn tất & xem lại';
  $('sedit').hidden=!it.rv;$('snokey').hidden=has||!!it.rv;$('sins').hidden=!!it.rv;
  $('ssm').textContent=it.savedAt?'Đã lưu lúc '+it.savedAt:'';
  const b=$('smark');b.textContent=it.done?'✓ Đã xong unit (bấm để bỏ)':'☐ Đánh dấu đã xong unit';b.classList.toggle('on',!!it.done);
}
// dòng ở chế độ XEM KẾT QUẢ: chỉ đọc, có nút ✎ để sửa câu đó
function sRowRv(s,i,it){
  const r=s.key?checkSentence(s.u||'',s.key):{r:(s.u||'').trim()?'raw':'empty'};
  const d=el('div','sq rv'+(['ok','part','no'].includes(r.r)?' '+r.r:'')),v=el('div','sv');
  v.append(el('b','',(i+1)+'. '),s.vi);
  const a=el('div','sa rva'),t=(s.u||'').trim();
  const eb=el('button','ib','✎');eb.type='button';eb.title='Sửa câu này';eb.setAttribute('aria-label','Sửa câu '+(i+1));eb.onclick=()=>sEdit(i);
  a.append(el('span','ar','→'),el('span','rvt'+(t?'':' mute'),t||'(chưa điền)'),eb);
  const fb=el('div','sf');fbFill(fb,r,s);
  d.append(v,a,fb);return d;
}
function sList(it){
  const box=$('slist');box.innerHTML='';
  it.sents.forEach((s,i)=>box.appendChild(it.rv?sRowRv(s,i,it):sRow(s,i,it)));
  const r=$('sres');
  if(it.rv)gradeSummary(r,it.sents,'Một câu có thể ráp được nhiều cách đúng — nếu bạn thấy mình đúng mà bị đánh dấu sai, bấm ✎ để xem lại.');else{r.hidden=true;r.textContent=''}
}
function sShow(it,quiet){
  S.sel=it;$('sunit').hidden=false;
  $('sutopic').textContent=it.topic||'';$('sutopic').hidden=!it.topic;
  $('sutitle').textContent=it.title;
  sList(it);
  const p=SL.locate(it);
  $('spos').textContent=p?(p.g.name+' · '+(p.i+1)+'/'+p.g.items.length):'';
  $('sprev').disabled=!p||p.i===0;$('snext').disabled=!p||p.i===p.g.items.length-1;
  sFoot(it);
  if(!quiet)$('sunit').scrollIntoView({behavior:'smooth',block:'start'});
}
function sStep(d){
  const p=S.sel&&SL.locate(S.sel);if(!p)return;
  const n=p.g.items[p.i+d];if(n){SL.select(n);sShow(n)}
}
function sGrade(){
  const it=S.sel;if(!it)return;
  if(!sDone(it)){$('sprog').textContent='Hãy điền ít nhất một câu trước khi kiểm tra.';return}
  it.rv=true;it.done=true;SL.save();SL.render();
  sShow(it,true);$('sutitle').scrollIntoView({behavior:'smooth',block:'start'});
}
function sEdit(i){
  const it=S.sel;if(!it)return;
  it.rv=false;SL.save();sList(it);sFoot(it);
  const r=$('slist').children[i||0];
  if(r){const x=r.querySelector('.si');if(x){x.focus();r.scrollIntoView({block:'center',behavior:'smooth'})}}
}
function sReset(){
  const it=S.sel;if(!it)return;
  it.sents.forEach(s=>{s.u=''});it.done=false;delete it.rv;delete it.savedAt;SL.save();SL.render();sShow(it,true);
}
function sSave(){
  const it=S.sel;if(!it)return;
  it.savedAt=nowHM();SL.save();Store.flush();
  const txt=it.title+'\n\n'+it.sents.map((s,i)=>(i+1)+'. '+s.vi+'\n→ '+((s.u||'').trim()||'(chưa điền)')+(it.rv&&s.key?'\n   Đáp án: '+s.key.split(/\s*\|\s*/)[0]:'')).join('\n\n')+'\n\n(Lưu lúc '+it.savedAt+')\n';
  const ok=dlText('bai-lam-'+fileSlug(it.title)+'.txt',txt);
  sFoot(it);$('ssm').textContent='Đã lưu bài làm lúc '+it.savedAt+' (lưu trong app'+(ok?' và tải thêm một file .txt':'')+').';
}
const sCarry=(n,m)=>{n.done=m.done;n.rv=m.rv;n.savedAt=m.savedAt;n.sents.forEach((s,i)=>{if(m.sents[i]&&m.sents[i].vi===s.vi)s.u=m.sents[i].u})};
async function sFiles(files){
  const msg={set textContent(t){$('smsg').textContent=t}};
  for(const f of files){
    msg.textContent='Đang đọc '+f.name+'...';
    try{
      const ext=f.name.split('.').pop().toLowerCase();
      const items=ext==='xlsx'?parseSentenceRows(await readXlsx(f)):parseSentences((await readLines(f)).lines);
      if(!items.length)throw new Error('không nhận diện được unit nào. Với file Excel: cần các cột Chủ đề · STT · Tiếng Việt · Tiếng Anh bị xáo trộn · Đáp án (tải file Excel mẫu ở trên). Với PDF/Word: cần dòng “UNIT 1 · …”, câu đánh số “1. …”, dòng các từ cách nhau bằng dấu / và dòng “→ đáp án”.');
      const n=items.reduce((a,u)=>a+u.sents.length,0),k=items.reduce((a,u)=>a+u.sents.filter(s=>s.key).length,0);
      msg.textContent='Đã đọc “'+f.name+'” — hãy kiểm tra ở bảng xem trước.';
      const c=await impAsk({file:f.name,fileObj:f,tab:'ghep-cau-rap-tu',noun:'unit',items,groups:()=>SL.groups,need:u=>u.sents.every(s=>s.key),
        warns:[k<n?(k?(n-k)+'/'+n+' câu chưa có đáp án (cột E). Unit thiếu đáp án được bỏ chọn sẵn vì không chấm điểm được — hãy bổ sung cột E rồi tải lại.':'File chưa có cột Đáp án (cột E) nên app không chấm điểm được. Hãy tải file Excel mẫu và điền đủ 5 cột.'):''].filter(Boolean),
        line:u=>({t:u.title,b:u.sents.length+' câu'}),
        sample:u=>u.sents.slice(0,4).map((s,i)=>(i+1)+'. '+s.vi+'  →  '+s.words.join(' / ')+(s.key?'   ✓ '+s.key.split(/\s*\|\s*/)[0]:'')).concat(u.sents.length>4?['… và '+(u.sents.length-4)+' câu nữa']:[])});
      if(!c){msg.textContent='Đã hủy — chưa thêm “'+f.name+'” vào danh sách.';continue}
      SL.addTo(c.target,f.name,c.items,sCarry,c.name);
      msg.textContent='Đã thêm '+c.items.length+' unit từ “'+f.name+'”. Bấm “Mở danh sách bài ghép câu” để chọn unit.';
    }catch(e){msg.textContent='Lỗi với '+f.name+': '+e.message}
  }
  sOpenBtns();
  const b=$('so');b.classList.add('pulse');setTimeout(()=>b.classList.remove('pulse'),2400);
}
// tạo mới / sửa một unit ráp từ
function sNew(gi,edit){
  edOpen({
    title:edit?'Sửa unit ráp từ':'Tạo unit ráp từ mới',edit:!!edit,lib:SL,gi,
    fields:[
      {k:'title',label:'Tên unit',ph:'Ví dụ: UNIT 1 · Chào hỏi',val:edit?edit.title:''},
      {k:'lines',label:'Các câu (mỗi dòng một câu)',area:1,rows:9,
        ph:'Xin chào, tôi tên là Lan. | name / is / Lan / my / hello, | Hello, my name is Lan.\nRất vui được gặp bạn. | Nice to meet you.',
        help:'Dạng:  Câu tiếng Việt | các từ cách nhau bằng “ / ” | đáp án.  Dấu phẩy gắn liền với từ đứng trước (hello,). Có thể bỏ cột các từ (chỉ ghi: Câu Việt | đáp án) — app tự xáo từ từ đáp án. Đáp án giúp app chấm điểm nên nên điền đủ.',val:edit?rapToLines(edit):''}
    ],
    parse:v=>{
      if(!v.title.trim())return{err:'Hãy nhập tên unit.'};
      const r=parseRapLines(v.lines);
      if(r.errs.length)return{err:r.errs.slice(0,3).join(' · ')+(r.errs.length>3?' …':'')};
      if(!r.sents.length)return{err:'Hãy nhập ít nhất một câu.'};
      const k=r.sents.filter(x=>x.key).length;
      return{item:{title:NZ(v.title),topic:edit?edit.topic||'':'',sents:r.sents},
        info:'✓ '+r.sents.length+' câu · '+k+' câu có đáp án'+(r.warns.length?' · ⚠ '+r.warns[0]:'')};
    },
    save:(item,ch)=>{
      if(edit){
        item.sents.forEach(n=>{const o=edit.sents.find(x=>x.vi===n.vi);if(o&&o.u)n.u=o.u});
        edit.title=item.title;edit.sents=item.sents;SL.save();SL.render();if(S.sel===edit)sShow(edit,true);
      }else{edAddNew(SL,item,ch);xMode('a');sShow(item)}
      sOpenBtns();
    }
  });
}
function sOpenBtns(){$('sopen').hidden=!SL.total()}
function sClose(){}
function sEnsureBuiltin(){
  const ch=fixedSync(SL.groups,BUILTIN_SP,
    u=>({title:u.title,topic:u.topic,sents:u.sents.map(s=>({vi:s.vi,words:fixChips(s.words,s.key),key:s.key}))}),
    (n,m)=>{n.done=m.done;n.rv=m.rv;n.savedAt=m.savedAt;n.sents.forEach((s,i)=>{if(m.sents[i]&&m.sents[i].vi===s.vi)s.u=m.sents[i].u})});
  if(ch){SL.sel=null;SL.save()}
}
function sOpenBuiltin(){
  const f=BUILTIN_SP.groups.map(g=>g.file);
  SL.groups.forEach(g=>{g.open=g.file===f[0]});SL.show(true);
}
(function(){
  $('sP').value=SP;
  $('sf').onchange=e=>{if(e.target.files.length)sFiles([...e.target.files]);e.target.value=''};
  $('sopen').onclick=()=>SL.show(true);
  $('so').onclick=()=>(X.mode==='b'?PL:SL).toggle();
  $('sgrade').onclick=sGrade;$('sreset').onclick=sReset;$('sedit').onclick=()=>sEdit(0);$('ssave').onclick=sSave;$('snew').onclick=()=>sNew();
  $('smark').onclick=()=>{if(!S.sel)return;S.sel.done=!S.sel.done;SL.save();SL.render();sFoot(S.sel)};
  $('sprev').onclick=()=>sStep(-1);$('snext').onclick=()=>sStep(1);
  $('scp').onclick=()=>copyEl('sP','prompt','sfm');
})();

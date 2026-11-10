/* Dùng chung cho cả 3 tab:
 *  - impAsk: bảng XEM TRƯỚC khi thêm file vào danh sách (chọn mục, chọn thư mục đích)
 *  - edOpen: hộp tạo / sửa bài thủ công
 *  - dlText + nowHM: nút "Lưu bài làm"
 *  - parser cho tab "Viết câu" (file Excel / Word / PDF / txt, và dòng gõ tay)
 */
const nowHM=()=>{const d=new Date(),p=n=>String(n).padStart(2,'0');return p(d.getHours())+':'+p(d.getMinutes())+' '+p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear()};
const fileSlug=s=>String(s||'bai-lam').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/gi,'d').replace(/[^a-z0-9]+/gi,'-').replace(/^-+|-+$/g,'').slice(0,40)||'bai-lam';
function dlText(name,txt){
  try{
    const a=document.createElement('a');a.href=URL.createObjectURL(new Blob(['\ufeff'+txt],{type:'text/plain;charset=utf-8'}));
    a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),2000);return true;
  }catch(e){return false}
}

/* ================= XEM TRƯỚC TRƯỚC KHI THÊM ================= */
/* o: {file, noun, items, groups:()=>[...], warns:[], line:it=>({t,b}), sample:it=>[chuỗi...]}
 * trả về Promise<{items,target,name}|null>; target: 'file' | 'new' | chỉ số thư mục */
function impAsk(o){
  return new Promise(res=>{
    const M=$('pd');let done=false;
    const fin=v=>{if(done)return;done=true;M.hidden=true;document.removeEventListener('keydown',esc);res(v)};
    const esc=e=>{if(e.key==='Escape')fin(null)};
    document.addEventListener('keydown',esc);
    $('pdt').textContent='Xem trước trước khi thêm';
    const n=o.items.length;
    $('pdsum').textContent='“'+o.file+'” — tìm thấy '+n+' '+o.noun+'. Chưa có gì được thêm vào danh sách: kiểm tra rồi bấm “Thêm vào danh sách”.';
    const W=$('pdw');W.innerHTML='';
    (o.warns||[]).forEach(w=>W.appendChild(el('div','pvw','⚠ '+w)));
    const gs=o.groups(),title=new Set();
    gs.forEach(g=>g.items.forEach(x=>title.add(x.title)));
    const lack=o.items.map(it=>o.need?!o.need(it):false);   // mục thiếu đáp án: mặc định KHÔNG chọn
    const on=o.items.map((_,i)=>!lack[i]),L=$('pdl');L.innerHTML='';
    const ok=$('pdok'),all=$('pdall');
    const upd=()=>{const k=on.filter(Boolean).length;ok.textContent='✓ Thêm '+k+' '+o.noun+' vào danh sách';ok.disabled=!k;all.checked=k===n;all.indeterminate=k>0&&k<n};
    o.items.forEach((it,i)=>{
      const r=el('div','pdr'),lb=el('label','pdk'),cb=document.createElement('input');
      cb.type='checkbox';cb.checked=on[i];cb.setAttribute('aria-label','Chọn '+it.title);
      cb.onchange=()=>{on[i]=cb.checked;upd()};
      const p=o.line(it);
      lb.append(cb,el('span','pdn',p.t));
      if(p.b)lb.appendChild(el('span','bdg',p.b));
      if(lack[i])lb.appendChild(el('span','bdg warn','thiếu đáp án — không chấm được'));
      if(title.has(it.title))lb.appendChild(el('span','bdg warn','đã có tên này'));
      const tg=el('button','ib','👁');tg.type='button';tg.title='Xem nội dung';tg.setAttribute('aria-label','Xem nội dung '+it.title);
      const dt=el('div','pdd');dt.hidden=true;
      const flip=()=>{if(!dt.childNodes.length)o.sample(it).forEach(x=>dt.appendChild(el('div','',x)));dt.hidden=!dt.hidden};
      tg.onclick=flip;r.append(lb,tg,dt);L.appendChild(r);
      if(i===0)flip();
    });
    all.onchange=()=>{on.fill(all.checked);[...L.querySelectorAll('input[type=checkbox]')].forEach(c=>{c.checked=all.checked});upd()};
    const S=$('pdto'),NM=$('pdnm');S.innerHTML='';
    const same=gs.findIndex(g=>g.file===o.file);
    if(same>=0)S.appendChild(new Option('Cập nhật thư mục “'+gs[same].name+'” (giữ tiến độ đã làm)','file'));
    S.appendChild(new Option('＋ Tạo thư mục mới','new'));
    gs.forEach((g,i)=>{if(!g.fixed&&i!==same)S.appendChild(new Option('Thêm vào thư mục “'+g.name+'”',i))});
    S.value=same>=0?'file':'new';
    NM.value=o.file.replace(/\.[^.]+$/,'');NM.hidden=S.value!=='new';
    S.onchange=()=>{NM.hidden=S.value!=='new'};
    ok.onclick=()=>{
      const r={items:o.items.filter((_,i)=>on[i]),target:S.value,name:NM.value.trim()||o.file.replace(/\.[^.]+$/,'')};
      if(o.fileObj&&typeof Store.archive==='function')Store.archive(o.tab||'khac',o.fileObj);   // lưu thêm bản gốc cạnh nơi cài đặt (bản .exe)
      fin(r);
    };
    $('pdcx').onclick=$('pdx').onclick=()=>fin(null);
    M.onclick=e=>{if(e.target===M)fin(null)};
    upd();M.hidden=false;ok.focus();
  });
}

/* ================= HỘP TẠO / SỬA BÀI THỦ CÔNG =================
 * c: {title, fields:[{k,label,area,rows,ph,help,val}], lib, gi, edit, parse(v)->{item,info,err}, save(item,{target,name})} */
const ED={op:null};
function edOpen(c){
  const M=$('ed'),F=$('edf');F.innerHTML='';
  $('edt').textContent=c.title;
  const ctl={};
  c.fields.forEach(f=>{
    const lb=el('label','fl');lb.append(f.label);
    const x=el(f.area?'textarea':'input','fi'+(f.area?' fa':''));
    if(f.area)x.rows=f.rows||6;
    x.value=f.val||'';x.placeholder=f.ph||'';x.spellcheck=false;
    ctl[f.k]=x;lb.appendChild(x);
    if(f.help)lb.appendChild(el('span','mute edh',f.help));
    F.appendChild(lb);
  });
  const S=$('edto'),NM=$('ednm'),TL=$('edtl'),W=$('edw'),ok=$('edok');
  TL.hidden=!!c.edit;NM.hidden=true;
  if(!c.edit){
    S.innerHTML='';const gs=c.lib.groups;
    gs.forEach((g,i)=>{if(!g.fixed)S.appendChild(new Option(g.name,i))});
    S.appendChild(new Option('＋ Tạo thư mục mới…','new'));
    const first=gs.findIndex(g=>!g.fixed);
    S.value=(c.gi!=null&&gs[c.gi]&&!gs[c.gi].fixed)?String(c.gi):(first>=0?String(first):'new');
    NM.value='Bài của tôi';NM.hidden=S.value!=='new';
    S.onchange=()=>{NM.hidden=S.value!=='new';if(!NM.hidden)NM.focus()};
  }
  const vals=()=>{const v={};Object.keys(ctl).forEach(k=>{v[k]=ctl[k].value});return v};
  const run=()=>{
    const r=c.parse(vals())||{};
    W.className='edw '+(r.err?'bad':'ok');W.textContent=r.err||r.info||'';
    ok.disabled=!r.item;return r;
  };
  Object.values(ctl).forEach(x=>x.addEventListener('input',run));
  const close=()=>{M.hidden=true;document.removeEventListener('keydown',esc);if(ED.op){try{ED.op.focus()}catch(e){}ED.op=null}};
  const esc=e=>{if(e.key==='Escape')close()};
  document.addEventListener('keydown',esc);
  ok.textContent=c.edit?'✓ Lưu thay đổi':'✓ Tạo bài';
  ok.onclick=()=>{const r=run();if(!r.item)return;close();c.save(r.item,{target:S.value,name:NM.value.trim()||'Bài của tôi'})};
  $('edcx').onclick=$('edx').onclick=close;
  M.onclick=e=>{if(e.target===M)close()};
  ED.op=document.activeElement;
  run();M.hidden=false;
  const f0=Object.values(ctl)[0];if(f0)f0.focus();
}
// thêm 1 mục mới theo lựa chọn thư mục trong hộp tạo bài, rồi chọn nó làm bài đang làm
function edAddNew(lib,item,ch){
  lib.addTo(ch.target,undefined,[item],null,ch.name);
  lib.select(item);const p=lib.locate(item);if(p)p.g.open=true;lib.save();lib.render();
}

/* ================= PARSER DÒNG GÕ TAY / FILE CHO "RÁP TỪ" & "VIẾT CÂU" ================= */
const STARTERS=new Set(['the','a','an','he','she','it','we','they','you','what','where','when','why','how','who','which','do','does','did','is','are','am','was','were','can','could','will','would','should','shall','may','might','must','please','there','this','that','these','those','my','your','his','her','our','their','let','have','has','had','if','in','on','at','after','before','every','today','tomorrow','yesterday']);
function scrambleWords(key){
  // dấu , ; : gắn liền với từ đứng trước (hello,); dấu cuối câu và dấu ngoặc kép thì bỏ
  const t=String(key).split('|')[0].replace(/[“”"]/g,'').split(/\s+/).filter(Boolean).map(x=>x.replace(/[.!?…]+$/,'')).filter(Boolean);
  if(t.length<2)return t;
  if(t[0]!=='I'&&!/^I'/.test(t[0])&&STARTERS.has(t[0].replace(/[,;:]+$/,'').toLowerCase()))t[0]=t[0].charAt(0).toLowerCase()+t[0].slice(1);
  const o=t.join(' ');let k=0;
  do{for(let i=t.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[t[i],t[j]]=[t[j],t[i]]}k++}while(k<12&&t.join(' ')===o);
  return t;
}
const splitCols=l=>(l.includes('\t')?l.split('\t'):l.split('|')).map(x=>x.trim());
const noNum=l=>l.replace(/^\s*\d+\s*[.)]\s+/,'');
// "Tiếng Việt | từ / từ / từ | đáp án"  (cột 2 hoặc 3 có thể bỏ: thiếu từ thì app tự xáo từ đáp án)
function parseRapLine(raw){
  const p=splitCols(noNum(raw)),vi=p[0]||'';
  if(!vi)return{err:'thiếu câu tiếng Việt'};
  let w='',key='';
  if(p.length===2){if(p[1].includes('/'))w=p[1];else key=p[1]}
  else if(p.length>=3){w=p[1];key=p.slice(2).join(' | ')}
  let words=w.split('/').map(x=>x.trim()).filter(Boolean),warn='';
  if(!words.length&&key)words=scrambleWords(key);
  if(words.length<2)return{err:'cần ít nhất 2 từ để ráp (điền cột các từ, hoặc điền đáp án để app tự xáo từ)'};
  if(key){
    words=fixChips(words,key);   // dấu phẩy gắn liền với từ phía trước
    const tk=s=>s.replace(/[.,!?;:"“”]+/g,' ').split(/\s+/).filter(Boolean).map(chipCore).sort().join(' ');
    if(tk(key.split('|')[0])!==tk(words.join(' ')))warn='các từ chưa khớp đúng với đáp án';
  }
  return{s:{vi,words,key},warn};
}
function parseRapLines(text){
  const sents=[],errs=[],warns=[];
  String(text).split(/\r?\n/).forEach((raw,i)=>{
    if(!raw.trim())return;
    const r=parseRapLine(raw);
    if(r.err)errs.push('Dòng '+(i+1)+': '+r.err);else{sents.push(r.s);if(r.warn)warns.push('Dòng '+(i+1)+': '+r.warn)}
  });
  return{sents,errs,warns};
}
const rapToLines=it=>it.sents.map(s=>s.vi+' | '+s.words.join(' / ')+(s.key?' | '+s.key:'')).join('\n');

/* gợi ý "word (loại từ): nghĩa; word (loại từ): nghĩa" */
function parseHintStr(s){
  return String(s||'').split(/[;\n]+/).map(x=>x.trim()).filter(Boolean).map(x=>{
    let m=x.match(/^(.+?)\s*[(（]([^)）]*)[)）]\s*[:：\-–]?\s*(.*)$/);
    if(m)return[m[1].trim(),m[2].trim(),m[3].trim()];
    const p=x.split(/\s*[·•]\s*/);
    if(p.length>=2)return[p[0],p.length>2?p[1]:'',p[p.length-1]];
    m=x.match(/^(.+?)\s*[:：]\s*(.+)$/);
    return m?[m[1].trim(),'',m[2].trim()]:[x,'',''];
  });
}
const hintsToStr=h=>(h||[]).map(([w,t,m])=>w+(t?' ('+t+')':'')+(m?': '+m:'')).join('; ');
// "Tiếng Việt | gợi ý; gợi ý | đáp án (không bắt buộc)"
function parseXLine(raw){
  const p=splitCols(noNum(raw)),vi=p[0]||'';
  if(!vi)return{err:'thiếu câu tiếng Việt'};
  let hs='',key='';
  if(p.length===2){
    if(/[.?!]$/.test(p[1])&&p[1].split(/\s+/).length>=3&&!/[(:;·]/.test(p[1]))key=p[1];else hs=p[1];
  }else if(p.length>=3){hs=p[1];key=p.slice(2).join(' | ')}
  return{s:{vi,h:parseHintStr(hs),key}};
}
function parseXLines(text){
  const sents=[],errs=[];
  String(text).split(/\r?\n/).forEach((raw,i)=>{
    if(!raw.trim())return;
    const r=parseXLine(raw);
    if(r.err)errs.push('Dòng '+(i+1)+': '+r.err);else{r.s.n=sents.length+1;sents.push(r.s)}
  });
  return{sents,errs};
}
const xToLines=it=>it.sents.map(s=>s.vi+' | '+hintsToStr(s.h)+(s.key?' | '+s.key:'')).join('\n');

/* file Word/PDF/txt cho "Viết câu": dòng "UNIT 1 · Tên" rồi mỗi dòng một câu theo mẫu trên */
function parseXFileLines(rawLines,defTitle){
  const L=rawLines.map(NZ).filter(Boolean),units=[];
  let cur=null,topic='';
  const fin=()=>{if(cur&&cur.sents.length)units.push(cur);cur=null};
  L.forEach(l=>{
    if(R_TOPIC.test(l)){fin();topic=l;return}
    if(R_UNIT.test(l)&&!/[|\t]/.test(l)){fin();cur={title:NZ(l.replace(/^(unit)\s*(\d+)/i,(x,a,b)=>a.toUpperCase()+' '+b)),topic,sents:[]};return}
    if(!/[|\t]/.test(l))return;
    const r=parseXLine(l);if(r.err)return;
    if(!cur)cur={title:defTitle||'Bài mới',topic,sents:[]};
    r.s.n=cur.sents.length+1;cur.sents.push(r.s);
  });
  fin();return units;
}
/* Excel cho "Viết câu": cột Chủ đề | STT | Tiếng Việt | Gợi ý | Đáp án (tùy chọn) */
function parseXRows(sheets){
  const units=[],has=(s,re)=>re.test(NZ(s||''));
  sheets.forEach(sh=>{
    const rows=sh.rows.map(r=>(r||[]).map(x=>NZ(x==null?'':x)));
    const h=rows.findIndex(r=>r.filter(Boolean).length>=3&&r.some(c=>has(c,/vi[ệe]t/i))&&r.some(c=>has(c,/g[ợo]i [ýy]|hint/i)));
    if(h<0)return;
    const H=rows[h],find=re=>H.findIndex(c=>has(c,re));
    const cV=find(/vi[ệe]t/i),cH=find(/g[ợo]i [ýy]|hint/i),cA=find(/[đd][áa]p [áa]n|answer|key/i),cT=find(/ch[ủu] [đd][ềe]|unit|topic|b[àa]i/i);
    if(cV<0||cH<0)return;
    let cur=null;const push=()=>{if(cur&&cur.sents.length)units.push(cur);cur=null};
    rows.slice(h+1).forEach(r=>{
      const vi=r[cV]||'',hs=r[cH]||'',key=cA>=0?(r[cA]||''):'',tp=cT>=0?(r[cT]||''):'';
      if(!vi&&!hs){const t=r.find(Boolean);if(t){push();cur={title:t,topic:'',sents:[]}}return}
      const title=tp||(cur&&cur.title)||sh.name||'Chủ đề';
      if(!cur||cur.title!==title){push();cur={title,topic:'',sents:[]}}
      if(vi)cur.sents.push({n:cur.sents.length+1,vi,h:parseHintStr(hs),key});
    });
    push();
  });
  return units;
}

/* ================= tóm tắt kết quả chấm dùng chung (Ráp từ / Viết câu) ================= */
function fbFill(fb,r,s){
  fb.textContent='';fb.hidden=false;
  if(r.r==='ok'){
    fb.append(el('b','','✓ Đúng'));
    if(r.tips&&r.tips.length)fb.append(el('span','tip',' — lưu ý nhỏ (không trừ điểm): '+r.tips.join('; ')+'. Đáp án: '),el('b','k',r.key));
  }
  else if(r.r==='part')fb.append(el('b','','≈ Gần đúng ('+Math.round(r.sc*100)+'%). '),'Đáp án: ',el('b','k',r.key));
  else if(r.r==='no')fb.append(el('b','','✗ Chưa đúng'+(r.sc>0?' ('+Math.round(r.sc*100)+'% giống đáp án)':'')+'. '),'Đáp án: ',el('b','k',r.key));
  else if(r.r==='empty'&&s.key)fb.append(el('b','','— Chưa điền. '),'Đáp án: ',el('b','k',s.key.split(/\s*\|\s*/)[0]));
  else if(r.r==='empty')fb.append(el('b','','— Chưa điền.'));
  else fb.hidden=true;
}
function gradeSummary(box,sents,extra){
  box.textContent='';
  const c={ok:0,part:0,no:0,empty:0};let tot=0,sum=0;
  sents.forEach(s=>{if(!s.key)return;tot++;const r=checkSentence(s.u||'',s.key);c[r.r]++;sum+=r.sc||0});
  if(!tot){box.hidden=true;return}
  box.hidden=false;
  box.append(el('b','big',sc10(sum/tot)+'/10'),el('span','',' · ✓ '+c.ok+' đúng · ≈ '+c.part+' gần đúng · ✗ '+c.no+' sai · — '+c.empty+' chưa điền (trên '+tot+' câu có đáp án)'));
  box.appendChild(el('p','mute wnote','Điểm tính theo TỪ và THỨ TỰ TỪ, không phân biệt hoa/thường. Thiếu hoặc thừa dấu câu (kể cả dấu phẩy) chỉ hiện lưu ý, không bị trừ điểm. Câu gần đúng được tính điểm theo % giống đáp án.'));
  if(extra)box.appendChild(el('p','mute wnote',extra));
}

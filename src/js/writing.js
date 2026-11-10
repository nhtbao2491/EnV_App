/* Tab 2 — Luyện viết (dịch Việt → Anh): mỗi lần một bài, gõ bản tiếng Anh rồi bấm Chấm điểm. */
const WP=`Hãy tạo [10] bài luyện viết Việt → Anh trình độ [B1] về các chủ đề: [liệt kê chủ đề]. Mỗi bài gồm một đoạn tiếng Việt khoảng [6–8] câu và [4] từ/cụm gợi ý. Xuất ra file Word (.docx); nếu không tạo được file thì xuất văn bản thuần đúng theo khung dưới đây.

Khung bắt buộc cho MỖI bài, đúng thứ tự, mỗi mục bắt đầu ở một dòng mới:
Bài 01: Tên bài                (đánh số 01, 02, 03...; viết đúng chữ "Bài", số, dấu hai chấm)
Trình độ: B1                   (A1, A2, B1, B2, C1 hoặc C2)
Tiếng Việt:                    (một dòng riêng, chỉ có đúng chữ này)
[đoạn văn tiếng Việt]          (một đoạn liền, không xuống dòng giữa chừng)
Từ gợi ý: english (nghĩa tiếng Việt) · english (nghĩa tiếng Việt) · ...
                               (một dòng; các mục cách nhau bằng dấu · ; từ/cụm tiếng Anh đứng trước, nghĩa tiếng Việt trong ngoặc tròn)
Tiếng Anh:                     (một dòng riêng, chỉ có đúng chữ này)
[bản dịch tiếng Anh]           (một đoạn liền — ĐÁP ÁN BẮT BUỘC, app dùng để chấm điểm; bài thiếu phần này sẽ không được chấm)
---                            (dòng ngăn cách ở cuối mỗi bài)

Quy tắc:
- Các từ gợi ý phải xuất hiện đúng trong bản dịch tiếng Anh.
- Bản dịch tiếng Anh tự nhiên, bám sát nghĩa tiếng Việt, đúng trình độ đã chọn, câu hoàn chỉnh có dấu câu; dấu phẩy viết sát từ đứng trước (Hello, my name is Lan.).
- App chấm theo TỪ và THỨ TỰ TỪ (không phân biệt hoa/thường); thiếu hoặc thừa dấu câu chỉ bị nhắc nhẹ, không trừ điểm.
- Văn bản thường: không in đậm, không markdown, không bảng, không ảnh, không đánh số câu, không ghi chú hay phần nào khác chen vào.`;

const W={sel:null};
const WL=makeLib({
  key:'wrData',title:'Danh sách bài viết',search:'Tìm bài viết (tên, trình độ)...',count:'wc',
  emptyMsg:'Chưa có bài viết. Hãy tải file lên hoặc dùng bài mẫu.',
  textOf:it=>it.title+' '+(it.level||'')+' '+it.vi,
  isDone:it=>!!it.done,toggle:it=>{it.done=!it.done},
  doneTip:'Đã làm — bấm để bỏ đánh dấu',todoTip:'Chưa làm — bấm để đánh dấu đã làm',
  row:it=>({ic:'✍',tt:it.title,badges:[it.level,it.best!=null?'★ '+sc10(it.best):'']}),
  sum:(t,d)=>'Đã làm '+d+'/'+t+' bài  ·  ✓ = đã làm, ○ = chưa làm',
  pick:it=>wShow(it),
  create:()=>wNew(),add:gi=>wNew(gi),edit:it=>wNew(null,it)
});
const sc10=f=>(Math.round(f*100)/10).toString();

function wShow(it,quiet){
  W.sel=it;$('wlesson').hidden=false;
  $('wtitle').textContent=it.title;
  const lv=$('wlv');lv.hidden=!it.level;lv.textContent='';
  if(it.level){lv.append('Trình độ: ',el('span','lvb',it.level))}
  $('wvi').textContent=it.vi;
  const h=$('whint');h.hidden=!it.hints.length;h.textContent='';
  if(it.hints.length){
    h.appendChild(el('b','','Từ gợi ý: '));
    it.hints.forEach((x,i)=>{
      if(i)h.appendChild(el('span','sp',' · '));
      h.appendChild(el('span','t',x.en));
      if(x.vi)h.append(' ',el('span','m','('+x.vi+')'));
    });
  }
  const p=WL.locate(it);
  $('wpos').textContent=p?(p.g.name+' · bài '+(p.i+1)+'/'+p.g.items.length):'';
  $('wprev').disabled=!p||p.i===0;$('wnext').disabled=!p||p.i===p.g.items.length-1;
  $('wmsg2').textContent='';
  wMark();wView();
  if(!quiet)$('wlesson').scrollIntoView({behavior:'smooth',block:'start'});
}
// dựng chế độ LÀM BÀI (ô gõ) hoặc XEM KẾT QUẢ (chỉ đọc, có nút Chỉnh sửa)
function wView(){
  const it=W.sel;if(!it)return;
  const has=!!(it.answers&&it.answers.length),rv=!!it.rv&&!!(it.ans||'').trim();
  $('wans').value=it.ans||'';
  $('wans').hidden=rv;
  $('wrev').hidden=!rv||has;$('wrev').textContent=rv?it.ans:'';
  $('wgrade').hidden=rv;$('wgrade').textContent=has?'✔ Kiểm tra đáp án':'👁 Hoàn tất & xem lại';
  $('wedit').hidden=!rv;
  $('wnokey').hidden=has;
  $('wkeyb').hidden=!(rv&&!has);
  const r=$('wres');r.hidden=true;r.textContent='';
  if(rv&&has)wRes(gradeWriting(it.ans,it.answers));
}
function wMark(){const it=W.sel;if(!it)return;const b=$('wmark');b.textContent=it.done?'✓ Đã làm (bấm để bỏ)':'☐ Đánh dấu đã làm';b.classList.toggle('on',!!it.done)}
function wStep(d){
  const p=W.sel&&WL.locate(W.sel);if(!p)return;
  const n=p.g.items[p.i+d];if(n){WL.select(n);wShow(n)}
}
function wGrade(){
  const it=W.sel;if(!it)return;
  const t=$('wans').value;
  if(!t.trim()){$('wmsg2').textContent='Hãy gõ bài làm của bạn trước khi kiểm tra.';return}
  it.ans=t;it.rv=true;it.done=true;
  if(it.answers&&it.answers.length){const g=gradeWriting(t,it.answers);it.last=g.f;it.best=Math.max(it.best||0,g.f)}
  WL.save();WL.render();wMark();wView();
  $('wtitle').scrollIntoView({behavior:'smooth',block:'start'});
}
function wEdit(){
  const it=W.sel;if(!it)return;
  it.rv=false;WL.save();wView();$('wans').focus();
}
function wSave(){
  const it=W.sel;if(!it)return;
  if(!$('wans').hidden)it.ans=$('wans').value;
  it.savedAt=nowHM();WL.save();Store.flush();WL.render();
  const txt=it.title+(it.level?'\nTrình độ: '+it.level:'')+'\n\nTiếng Việt:\n'+it.vi+'\n\nBài làm của tôi:\n'+((it.ans||'').trim()||'(chưa viết)')
    +(it.answers&&it.answers.length&&it.rv?'\n\nĐáp án:\n'+it.answers[0]:'')+'\n\n(Lưu lúc '+it.savedAt+')\n';
  const ok=dlText('bai-lam-'+fileSlug(it.title)+'.txt',txt);
  $('wmsg2').textContent='Đã lưu bài làm lúc '+it.savedAt+' (lưu trong app'+(ok?' và tải thêm một file .txt':'')+').';
}
function wKeyApply(){
  const it=W.sel;if(!it)return;
  const t=$('wkeyt').value.split(/\n+/).map(NZ).filter(Boolean).join(' ');
  if(!t){$('wmsg2').textContent='Hãy dán đáp án tiếng Anh vào ô trước.';return}
  it.answers=[t];
  const g=gradeWriting(it.ans||'',it.answers);it.last=g.f;it.best=Math.max(it.best||0,g.f);
  $('wkeyt').value='';WL.save();WL.render();wView();$('wmsg2').textContent='Đã áp dụng đáp án và chấm điểm.';
}
function wRes(g){
  const r=$('wres');r.hidden=false;r.textContent='';
  const pct=Math.round(g.f*100);
  const cls=g.exact?'ok':pct>=70?'near':'no';
  const verdict=g.exact?'✓ Chính xác — đúng từ và thứ tự từ so với đáp án!':pct>=85?'Rất gần đáp án':pct>=70?'Khá tốt — còn vài chỗ khác đáp án':pct>=50?'Tạm được — xem lại các từ bị thiếu / thừa':'Chưa khớp — đọc đáp án rồi viết lại';
  const top=el('div','wscore '+cls);
  top.append(el('b','big',sc10(g.exact?1:g.f)+'/10'),el('span','',' · '+(g.exact?100:pct)+'% — '+verdict));
  r.appendChild(top);
  if(g.tips&&g.tips.length)r.appendChild(el('p','wtip','Lưu ý nhỏ về dấu câu / viết hoa (không bị trừ điểm): '+g.tips.join('; ')+'.'));
  // hiển thị theo "từ + dấu câu đi liền sau nó"
  const mk=(label,toks,matched,badCls)=>{
    const d=el('div','wline');d.appendChild(el('b','',label));
    const p=el('p',''),gs=[];
    toks.forEach((t,i)=>{let G=gs[gs.length-1];if(!G||G.g!==t.g){G={g:t.g,raw:'',ok:true};gs.push(G)}if(t.raw)G.raw=t.raw;if(!matched.has(i))G.ok=false});
    gs.forEach((G,i)=>{if(i)p.append(' ');p.appendChild(el('span','tk '+(G.ok?'ok':badCls),G.raw))});
    if(!gs.length)p.appendChild(el('span','mute','(trống)'));
    d.appendChild(p);return d;
  };
  r.appendChild(mk('Bài của bạn (từ thừa gạch đỏ):',g.u,g.ma,'bad'));
  r.appendChild(mk('Đáp án (từ bạn còn thiếu tô vàng):',g.r,g.mb,'miss'));
  r.appendChild(el('p','mute wnote','Chấm theo TỪ và THỨ TỰ TỪ: không phân biệt hoa/thường; dấu câu (kể cả dấu phẩy) gắn với từ đứng trước và chỉ nhắc nhẹ, không bị trừ điểm. Một ý có thể dịch nhiều cách đúng — điểm cho biết bài bạn giống đáp án trong file bao nhiêu.'));
  const full=el('details','fx'),sm=el('summary','','Xem đáp án nguyên văn');
  full.append(sm,el('p','wfull',g.ans));r.appendChild(full);
}
function wReset(){
  const it=W.sel;if(!it)return;
  it.ans='';delete it.last;delete it.best;delete it.rv;delete it.savedAt;it.done=false;
  WL.save();WL.render();wMark();wView();$('wmsg2').textContent='';$('wans').focus();
}
const wCarry=(n,m)=>{n.ans=m.ans;n.done=m.done;n.best=m.best;n.last=m.last;n.rv=m.rv;n.savedAt=m.savedAt};
async function wFiles(files){
  const msg=$('wmsg');
  for(const f of files){
    msg.textContent='Đang đọc '+f.name+'...';
    try{
      const{lines,pdf}=await readLines(f);
      const items=parseWriting(lines,pdf);
      if(!items.length)throw new Error('không nhận diện được bài nào. File cần đủ các dòng “Bài 01: …”, “Trình độ:”, “Tiếng Việt:”, “Từ gợi ý:”, “Tiếng Anh:” (đáp án) và “---” ngăn cách (xem khung mẫu).');
      const nk=items.filter(x=>!x.answers.length).length,nh=items.filter(x=>!x.hints.length).length;
      msg.textContent='Đã đọc “'+f.name+'” — hãy kiểm tra ở bảng xem trước.';
      const c=await impAsk({file:f.name,fileObj:f,tab:'viet',noun:'bài viết',items,groups:()=>WL.groups,need:it=>it.answers.length>0,
        warns:[nk?nk+' bài chưa có phần “Tiếng Anh” (đáp án) — được bỏ chọn sẵn vì không chấm điểm được. Hãy bổ sung đáp án rồi tải lại.':'',nh?nh+' bài chưa có từ gợi ý.':''].filter(Boolean),
        line:it=>({t:it.title,b:[it.level,it.answers.length?'':'thiếu đáp án'].filter(Boolean).join(' · ')}),
        sample:it=>['Tiếng Việt: '+it.vi.slice(0,260)+(it.vi.length>260?'…':''),'Từ gợi ý: '+(it.hints.map(h=>h.en).join(' · ')||'—'),'Tiếng Anh: '+(it.answers[0]?it.answers[0].slice(0,260)+(it.answers[0].length>260?'…':''):'(chưa có)')]});
      if(!c){msg.textContent='Đã hủy — chưa thêm “'+f.name+'” vào danh sách.';continue}
      WL.addTo(c.target,f.name,c.items,wCarry,c.name);
      msg.textContent='Đã thêm '+c.items.length+' bài viết từ “'+f.name+'”. Bấm “✍ Bài viết” để chọn bài.';
    }catch(e){msg.textContent='Lỗi với '+f.name+': '+e.message}
  }
  $('wopen').hidden=!WL.total();
  const b=$('wo');b.classList.add('pulse');setTimeout(()=>b.classList.remove('pulse'),2400);
}
// tạo mới / sửa nội dung một bài viết (gi: thư mục chọn sẵn; edit: bài cần sửa)
function wNew(gi,edit){
  edOpen({
    title:edit?'Sửa nội dung bài viết':'Tạo bài viết mới',edit:!!edit,lib:WL,gi,
    fields:[
      {k:'title',label:'Tên bài',ph:'Ví dụ: Bài 01: Gia đình tôi',val:edit?edit.title:''},
      {k:'level',label:'Trình độ (không bắt buộc)',ph:'A1, A2, B1, B2, C1, C2',val:edit?edit.level||'':''},
      {k:'vi',label:'Đoạn tiếng Việt cần dịch',area:1,rows:6,ph:'Dán hoặc gõ đoạn tiếng Việt...',val:edit?edit.vi:''},
      {k:'hints',label:'Từ gợi ý (không bắt buộc)',area:1,rows:3,ph:'neighborhood (khu phố) · pharmacy (tiệm thuốc) · noise (tiếng ồn)',help:'Mỗi mục dạng: từ tiếng Anh (nghĩa). Cách nhau bằng dấu · hoặc xuống dòng.',val:edit?edit.hints.map(h=>h.en+(h.vi?' ('+h.vi+')':'')).join(' · '):''},
      {k:'en',label:'Đáp án tiếng Anh (nên điền để chấm điểm)',area:1,rows:5,ph:'Có đáp án thì app mới chấm điểm được. Nếu để trống, sau này có thể dán đáp án vào.',val:edit&&edit.answers.length?edit.answers[0]:''}
    ],
    parse:v=>{
      if(!v.title.trim())return{err:'Hãy nhập tên bài.'};
      if(!v.vi.trim())return{err:'Hãy nhập đoạn tiếng Việt.'};
      const answers=v.en.trim()?[v.en.split(/\n+/).map(NZ).filter(Boolean).join(' ')]:[];
      const hints=parseHints(v.hints.replace(/\n+/g,' · '));
      return{item:{title:NZ(v.title),level:v.level.trim()?lvOf(v.level):'',vi:v.vi.trim(),hints,answers},
        info:'✓ '+hints.length+' từ gợi ý · '+(answers.length?'có đáp án (chấm điểm được)':'chưa có đáp án (chỉ xem lại bài)')};
    },
    save:(item,ch)=>{
      if(edit){
        const changed=item.vi!==edit.vi||JSON.stringify(item.answers)!==JSON.stringify(edit.answers);
        Object.assign(edit,item);if(changed){delete edit.last;delete edit.best}
        WL.save();WL.render();if(W.sel===edit)wShow(edit,true);
      }else{edAddNew(WL,item,ch);wShow(item)}
      $('wopen').hidden=!WL.total();
    }
  });
}
// bài viết mẫu có sẵn: luôn nằm trong danh sách, không xóa / đổi tên được
function wBuiltin(){return BUILTIN_W}
function wEnsureBuiltin(){
  const old=WL.groups.findIndex(g=>g.file==='bai-viet-mau');if(old>=0){WL.groups.splice(old,1);WL.save()}   // bỏ 4 bài mẫu cũ: đã thay bằng 100 bài
  const ch=fixedSync(WL.groups,wBuiltin(),
    it=>({title:it.title,level:it.level,vi:it.vi,hints:it.hints,answers:it.answers}),
    wCarry);
  if(ch){WL.sel=null;WL.save()}
}
(function(){
  $('wP').value=WP;
  $('wf').onchange=e=>{if(e.target.files.length)wFiles([...e.target.files]);e.target.value=''};
  $('wopen').onclick=()=>WL.show(true);
  $('wo').onclick=()=>WL.toggle();
  $('wgrade').onclick=wGrade;$('wreset').onclick=wReset;$('wedit').onclick=wEdit;$('wsave').onclick=wSave;$('wnew').onclick=()=>wNew();$('wkeyok').onclick=wKeyApply;
  $('wmark').onclick=()=>{if(!W.sel)return;W.sel.done=!W.sel.done;WL.save();WL.render();wMark()};
  $('wprev').onclick=()=>wStep(-1);$('wnext').onclick=()=>wStep(1);
  $('wans').addEventListener('input',()=>{if(W.sel){W.sel.ans=$('wans').value;WL.save()}});
  $('wcp').onclick=()=>copyEl('wP','prompt','wfm');
})();

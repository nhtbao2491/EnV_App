/* Danh sách thư mục → mục dùng chung cho tab Viết & Ghép câu (giống danh sách Bài nghe):
 * tìm kiếm, đổi tên, xóa, và đánh dấu đã làm / chưa làm. Dữ liệu lưu qua Store. */
const COARSE_L=matchMedia('(pointer:coarse)').matches;
function makeLib(o){
  const L={groups:[],sel:null,q:''};
  const back=el('div','drb'),dr=el('aside','drw');
  back.hidden=dr.hidden=true;dr.setAttribute('role','dialog');dr.setAttribute('aria-label',o.title);
  const hd=el('div','hd'),acts=el('span'),nb=el('button','','📁＋ Thư mục'),xb=el('button','','✕');
  xb.setAttribute('aria-label','Đóng');acts.append(nb,' ',xb);hd.append(el('b','',o.title),acts);
  const q=el('input');q.type='search';q.placeholder=o.search;q.setAttribute('aria-label',o.search);
  const sum=el('p','mute');sum.style.margin='0';
  const box=el('div','lst');
  if(o.noNew)nb.hidden=true;
  const cb=el('button','p','＋ Tạo bài mới');cb.type='button';cb.hidden=!o.create;cb.onclick=()=>{L.show(false);o.create()};
  dr.append(hd,cb,q,sum,box);document.body.append(back,dr);

  const save=()=>Store.set(o.key,L.groups);
  L.save=save;
  const gid=g=>g.file||g.id||(g.id='g'+Date.now().toString(36)+Math.random().toString(36).slice(2,6));
  const CK='cur:'+o.key;
  L.load=()=>{const d=Store.get(o.key,[]);L.groups=Array.isArray(d)?d.filter(g=>g&&Array.isArray(g.items)):[];L.groups.forEach(g=>{g.open=false;gid(g)});L.sel=null;L.restore()};
  // nhớ bài đang làm (qua lần mở app sau)
  L.select=it=>{L.sel=it;const p=it&&L.locate(it);if(p)Store.set(CK,{g:gid(p.g),t:it.title,i:p.i});else Store.remove(CK)};
  L.restore=()=>{
    const c=Store.get(CK,null);L.sel=null;if(!c)return null;
    const g=L.groups.find(x=>gid(x)===c.g);if(!g)return null;
    L.sel=g.items.find(x=>x.title===c.t)||g.items[c.i]||null;return L.sel;
  };
  // mở thư mục chứa bài đang làm
  L.reveal=()=>{const p=L.sel&&L.locate(L.sel);if(p)p.g.open=true;return !!p};
  L.show=on=>{
    dr.hidden=back.hidden=!on;
    if(on){
      L.q='';q.value='';const has=L.reveal();L.render();
      const cur=box.querySelector('.pk.on');
      if(cur)setTimeout(()=>cur.scrollIntoView({block:'center'}));
      if(!has&&!COARSE_L)q.focus({preventScroll:true});
    }
  };
  L.toggle=()=>L.show(dr.hidden);
  L.locate=it=>{for(const g of L.groups){const i=g.items.indexOf(it);if(i>=0)return{g,i}}return null};
  L.total=()=>L.groups.reduce((a,g)=>a+g.items.length,0);
  // thêm / thay thế thư mục theo tên file, giữ lại tiến độ cũ bằng hàm carry(mới, cũ)
  L.upsert=(file,items,carry,name)=>{
    const i=L.groups.findIndex(g=>g.file===file);
    if(i>=0)items.forEach(n=>{const m=L.groups[i].items.find(x=>x.title===n.title);if(m)carry(n,m)});
    const grp={file,name:i>=0?L.groups[i].name:(name||file.replace(/\.[^.]+$/,'')),open:false,items};
    if(i>=0)L.groups[i]=grp;else L.groups.push(grp);
    L.sel=null;save();L.render();
  };

  // thêm items vào: 'new' (thư mục mới) | chỉ số thư mục có sẵn | 'file' (cập nhật thư mục cùng tên file, giữ tiến độ)
  L.addTo=(target,file,items,carry,name)=>{
    let g;
    if(target==='file')return L.upsert(file,items,carry,name);
    if(target==='new'){const dupF=file&&L.groups.some(x=>x.file===file);g={file:file&&!dupF?file:undefined,name:name||'Thư mục mới',open:true,items:[]};gid(g);L.groups.push(g)}
    else g=L.groups[+target];
    items.forEach(n=>g.items.push(n));g.open=true;L.sel=null;save();L.render();return g;
  };
  L.render=()=>{
    const qq=L.q.trim().toLowerCase();box.innerHTML='';let tot=0,dn=0,shown=0;
    L.groups.forEach((g,gi)=>{
      tot+=g.items.length;dn+=g.items.filter(o.isDone).length;
      const nameHit=qq&&g.name.toLowerCase().includes(qq);
      const hit=g.items.map((_,i)=>i).filter(i=>!qq||nameHit||o.textOf(g.items[i]).toLowerCase().includes(qq));
      if(qq&&!hit.length)return;
      shown++;
      const open=qq?true:!!g.open;
      const fr=el('div','fr'),fb=el('button','fd');
      fb.setAttribute('aria-expanded',open);fb.title=g.name;
      if(L.sel&&g.items.includes(L.sel))fb.classList.add('curf');
      fb.append(el('span','',open?'▾':'▸'),el('span','','📁'),el('span','nm',g.name),el('span','cnt',g.items.filter(o.isDone).length+'/'+g.items.length));
      fb.onclick=()=>{g.open=!g.open;save();L.render()};
      const en=el('button','ib','✎');en.title='Đổi tên thư mục';en.setAttribute('aria-label','Đổi tên thư mục '+g.name);
      en.onclick=()=>ren(fb,g.name,v=>{g.name=v},()=>{save();L.render()});
      const dl=el('button','ib','🗑');dl.title='Xóa thư mục';dl.setAttribute('aria-label','Xóa thư mục '+g.name);
      del2(dl,()=>{L.groups.splice(gi,1);save();L.render()});
      if(g.fixed)fr.append(fb);else{
        fr.append(fb,en,dl);
        if(o.add){const ad=el('button','ib','＋');ad.title='Thêm bài vào thư mục này';ad.setAttribute('aria-label','Thêm bài vào thư mục '+g.name);ad.onclick=()=>{L.show(false);o.add(gi)};fr.classList.add('has3');fr.insertBefore(ad,en)}
      }
      box.appendChild(fr);
      if(g._new){delete g._new;setTimeout(()=>en.click())}
      if(!open)return;
      const ch=el('div','ch'+(o.wrap?' wrap':''));
      if(!g.items.length)ch.appendChild(el('p','mute','Thư mục trống'));
      hit.forEach(i=>{
        const it=g.items[i],row=el('div','rw'),ok=!!o.isDone(it),p=o.row(it,i);
        const st=el('button','st'+(ok?' on':''),ok?'✓':'');
        st.title=ok?o.doneTip:o.todoTip;st.setAttribute('aria-pressed',ok);st.setAttribute('aria-label',st.title);
        st.onclick=()=>{o.toggle(it);save();L.render();if(o.onChange)o.onChange(it)};
        const b=el('button','pk'+(L.sel===it?' on':''));
        b.title=p.tt;b.append(el('span','ic',p.ic),el('span','tt',(o.noNum?'':(i+1)+'. ')+p.tt));
        if(L.sel===it)b.appendChild(el('span','bdg cur','● Đang làm'));
        (p.badges||[]).filter(Boolean).forEach(x=>b.appendChild(el('span','bdg',x)));
        b.onclick=()=>{L.select(it);L.show(false);o.pick(it)};
        const e=el('button','ib','✎');e.title='Đổi tên';e.setAttribute('aria-label','Đổi tên mục '+(i+1));
        e.onclick=()=>ren(b,it.title,v=>{it.title=v},()=>{save();L.render()});
        const d=el('button','ib','🗑');d.title='Xóa';d.setAttribute('aria-label','Xóa mục '+(i+1));
        del2(d,()=>{g.items.splice(i,1);if(L.sel===it)L.sel=null;save();L.render();if(o.onRemove)o.onRemove(it)});
        if(g.fixed)row.append(st,b);else{
          row.append(st,b,e,d);
          if(o.edit){const ed=el('button','ib','📝');ed.title='Sửa nội dung bài';ed.setAttribute('aria-label','Sửa nội dung mục '+(i+1));ed.onclick=()=>{L.show(false);o.edit(it,g)};row.insertBefore(ed,e);row.classList.add('has4')}
        }
        ch.appendChild(row);
      });
      box.appendChild(ch);
    });
    if(!shown)box.appendChild(el('p','mute',tot?'Không có mục nào khớp.':o.emptyMsg));
    sum.textContent=tot?o.sum(tot,dn):'';
    if(o.count)$(o.count).textContent=tot?'('+dn+'/'+tot+')':'';
  };
  nb.onclick=()=>{const ng={name:'Thư mục mới',open:false,items:[],_new:true};gid(ng);L.groups.push(ng);L.q='';q.value='';save();L.render()};
  xb.onclick=back.onclick=()=>L.show(false);
  q.oninput=e=>{L.q=e.target.value;L.render()};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!dr.hidden)L.show(false)});
  return L;
}

/* Bộ có sẵn (bài mẫu) của mỗi tab: luôn nằm trong danh sách, KHÔNG xóa / đổi tên được (g.fixed).
 * groups: mảng thư mục của danh sách · B: {ver,groups:[{file,name,items}]} · mk(item)->bản mới · carry(mới,cũ) giữ tiến độ đã làm.
 * Trả về true nếu có thay đổi (để gọi lưu). Chỉ những mục người dùng tự thêm mới xóa được. */
function fixedSync(groups,B,mk,carry){
  let ch=false;
  B.groups.slice().reverse().forEach(bg=>{
    const g=groups.find(x=>x.file===bg.file);
    if(g&&g.fixed&&g.ver===B.ver&&g.items.length===bg.items.length)return;
    ch=true;
    const fresh=bg.items.map(mk);
    if(g){
      fresh.forEach(n=>{const m=g.items.find(x=>x.title===n.title);if(m)carry(n,m)});
      g.items=fresh;g.ver=B.ver;g.fixed=true;g.name=bg.name;
    }else groups.unshift({file:bg.file,name:bg.name,open:false,fixed:true,ver:B.ver,items:fresh});
  });
  if(ch){const f=B.groups.map(x=>x.file);groups.sort((a,b)=>{const i=f.indexOf(a.file),j=f.indexOf(b.file);return (i<0?99:i)-(j<0?99:j)})}
  return ch;
}

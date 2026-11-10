/* Đọc file .docx / .pdf -> danh sách bài đọc (thư viện nằm trong src/vendor) */
// ---- nạp file bài đọc (docx / pdf) ----
const RD={groups:[],sel:null,q:'',last:null};
const loadScript=u=>new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=()=>no(new Error('Không tải được thư viện đọc file (thiếu src/vendor — chạy npm install).'));document.head.appendChild(s)});
const VI=/[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/i;
const r5=x=>Math.round(x*2)/2;
const isVi=t=>(t.match(/[ăâđêôơưàáạảãèéẹẻẽìíịỉĩòóọỏõùúụủũỳýỵỷỹ]/gi)||[]).length/t.length>=0.05||/[ăđơưạảãẹẻẽịỉĩọỏõụủũỳỵỷỹ]/i.test(t);

// blocks: [{t,size,bold,hs}] -> [{title,text}]
function segment(blocks){
  const cnt={};blocks.forEach(b=>{const k=r5(b.size);cnt[k]=(cnt[k]||0)+b.t.length});
  const body=+Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
  blocks.forEach(b=>{b.h=b.t.length<=120&&!/[,;]$/.test(b.t)&&(b.hs||b.size>=body+1.5||(b.bold&&b.size>=body-.5))});
  const clean=t=>t.replace(/^reading\s*\d+\s*[—–:.\-]\s*/i,'').trim();
  const wc=a=>a.join(' ').split(/\s+/).length;
  const isRd=b=>/^reading[:.]?$/i.test(b.t);
  const out=[];
  const marks=blocks.map((b,i)=>isRd(b)?i:-1).filter(i=>i>=0);
  if(marks.length){ // mẫu: nhãn "Reading" -> tiêu đề -> các đoạn nội dung
    marks.forEach(m=>{
      const tb=blocks[m+1];if(!tb)return;
      const ps=[];
      for(let j=m+2;j<blocks.length;j++){const b=blocks[j];if(isRd(b)||b.h||isVi(b.t)||/^topic:/i.test(b.t)||/^reading\s*\d+/i.test(b.t)||/^[-_=—–*]{3,}$/.test(b.t))break;ps.push(b.t)}
      if(ps.length&&wc(ps)>=8)out.push({title:clean(tb.t),text:ps.join('\n')});
    });
    if(out.length)return out;
  }
  const sc={};blocks.filter(b=>b.h).forEach(b=>{const k=r5(b.size);sc[k]=(sc[k]||0)+1});
  const ks=Object.keys(sc).map(Number).sort((a,b)=>b-a);
  let L=ks.find(k=>sc[k]>=3);if(L==null)L=ks[0];if(L==null)return [];
  const secs=[];let cur=null;
  blocks.forEach(b=>{if(b.h&&r5(b.size)===L){cur={title:b.t,bs:[]};secs.push(cur)}else if(cur)cur.bs.push(b)});
  secs.forEach(s=>{
    const groups=[];let g=null;
    s.bs.forEach(b=>{if(b.h){g=null}else{if(!g){g=[];groups.push(g)}if(!isVi(b.t))g.push(b.t)}});
    groups.sort((a,b)=>wc(b)-wc(a));
    const best=groups[0]||[];
    if(best.length&&wc(best)>=8)out.push({title:clean(s.title),text:best.join('\n')});
  });
  return out;
}

async function readDocx(file){
  await loadScript('vendor/jszip.min.js');
  const z=await JSZip.loadAsync(await file.arrayBuffer());
  const P=new DOMParser(),W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const dx=P.parseFromString(await z.file('word/document.xml').async('string'),'text/xml');
  const sf=z.file('word/styles.xml'),sx=sf?P.parseFromString(await sf.async('string'),'text/xml'):null;
  const g=(el,n)=>el?el.getElementsByTagNameNS(W,n)[0]:null;
  const at=(el,n)=>el?el.getAttributeNS(W,n):null;
  const off=v=>['0','false'].includes(v);
  const styles={};if(sx)[...sx.getElementsByTagNameNS(W,'style')].forEach(s=>{styles[at(s,'styleId')]=s});
  const defP=Object.keys(styles).find(k=>at(styles[k],'default')==='1'&&at(styles[k],'type')==='paragraph');
  const dd=g(sx,'rPrDefault'),defSz=dd&&g(dd,'sz')?+at(g(dd,'sz'),'val')/2:10;
  const sty=(id,n=0)=>{
    const s=styles[id];if(!s||n>6)return {};
    const rp=g(s,'rPr'),o={};
    if(rp){const a=g(rp,'sz'),b=g(rp,'b');if(a)o.sz=+at(a,'val')/2;if(b)o.b=!off(at(b,'val'))}
    const bo=g(s,'basedOn');return {...(bo?sty(at(bo,'val'),n+1):{}),...o};
  };
  const blocks=[];
  for(const p of g(dx,'body').children){
    if(p.localName!=='p')continue;
    const ps=g(p,'pStyle'),sid=ps?at(ps,'val'):defP,pst=sty(sid);
    let t='',mx=0,all=true;
    for(const r of p.getElementsByTagNameNS(W,'r')){
      const rt=[...r.children].map(c=>c.localName==='t'?c.textContent:c.localName==='tab'?' ':c.localName==='br'?' ':'').join('');
      t+=rt;if(!rt.trim())continue;
      const rp=g(r,'rPr'),a=rp&&g(rp,'sz'),b=rp&&g(rp,'b');
      mx=Math.max(mx,a?+at(a,'val')/2:(pst.sz||defSz));
      if(!(b?!off(at(b,'val')):!!pst.b))all=false;
    }
    t=t.replace(/\s+/g,' ').trim();if(!t)continue;
    const nm=at(g(styles[sid],'name'),'val')||sid||'';
    blocks.push({t,size:mx||pst.sz||defSz,bold:all,hs:/^(title|heading\s*\d)/i.test(nm)});
  }
  return segment(blocks);
}

async function pdfLineObjs(file){
  await loadScript('vendor/pdf.min.js');
  pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('vendor/pdf.worker.min.js',document.baseURI).href;
  const pdf=await pdfjsLib.getDocument({data:await file.arrayBuffer()}).promise;
  const lines=[];
  for(let n=1;n<=pdf.numPages;n++){
    const pg=await pdf.getPage(n);
    try{await pg.getOperatorList()}catch(e){}
    const tc=await pg.getTextContent(),rows={};
    tc.items.forEach(it=>{
      if(!it.str||!it.str.trim()&&!it.hasEOL)return;
      const sz=Math.hypot(it.transform[0],it.transform[1])||it.height,y=Math.round(it.transform[5]/2);
      let nm='';try{nm=pg.commonObjs.get(it.fontName).name||''}catch(e){}
      const k=Object.keys(rows).find(r=>Math.abs(r-y)<=1)??y;
      (rows[k]=rows[k]||[]).push({x:it.transform[4],s:it.str,sz,b:/bold|black|heavy|semibold|demi/i.test(nm)});
    });
    Object.keys(rows).map(Number).sort((a,b)=>b-a).forEach(k=>{
      const it=rows[k].sort((a,b)=>a.x-b.x),t=it.map(i=>i.s).join('').replace(/\s+/g,' ').trim();
      if(!t)return;
      const w=it.filter(i=>i.s.trim());
      lines.push({t,size:Math.max(...w.map(i=>i.sz)),bold:w.every(i=>i.b),y:k*2,pg:n});
    });
  }
  // bỏ header/footer lặp lại & số trang
  const rep={};lines.forEach(l=>{const k=l.t.replace(/\d+/g,'#');rep[k]=(rep[k]||new Set()).add(l.pg)});
  const keep=l=>/^[→➔➜]/.test(l.t)||/ \/ /.test(l.t); // dòng mũi tên / dòng từ ráp câu không phải header
  const ls=lines.filter(l=>keep(l)||(!(pdf.numPages>2&&rep[l.t.replace(/\d+/g,'#')].size>=Math.max(3,pdf.numPages*.5))&&!/^\d+$/.test(l.t)));
  return ls;
}
async function readPdf(file){
  const ls=await pdfLineObjs(file);
  // gộp dòng thành đoạn
  const blocks=[];
  ls.forEach(l=>{
    const p=blocks[blocks.length-1];
    const big=l.bold||l.size>=(p?p.size:0)+1.5;
    if(p&&!p.lone&&p.pg===l.pg&&Math.abs(p.size-l.size)<.6&&p.bold===l.bold&&p.y-l.y<=l.size*1.7&&!(p.bold&&p.t.length>120)){p.t+=' '+l.t;p.y=l.y;p.lone=false}
    else blocks.push({t:l.t,size:l.size,bold:l.bold,y:l.y,pg:l.pg,lone:false});
  });
  return segment(blocks);
}

// ---- đọc file thành danh sách dòng chữ thuần (cho tab Viết & Ghép câu) ----
async function docxLines(file){
  await loadScript('vendor/jszip.min.js');
  const z=await JSZip.loadAsync(await file.arrayBuffer());
  const W='http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const dx=new DOMParser().parseFromString(await z.file('word/document.xml').async('string'),'text/xml');
  const out=[];
  for(const p of dx.getElementsByTagNameNS(W,'p')){
    let t='';
    for(const r of p.getElementsByTagNameNS(W,'r'))
      for(const c of r.children)t+=c.localName==='t'?c.textContent:c.localName==='tab'?' ':c.localName==='br'?'\n':'';
    t.split('\n').forEach(x=>{x=x.replace(/\s+/g,' ').trim();if(x)out.push(x)});
  }
  return out;
}
async function readLines(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='txt'||ext==='md')return{lines:(await file.text()).split(/\r?\n/),pdf:false};
  if(ext==='docx')return{lines:await docxLines(file),pdf:false};
  if(ext==='pdf')return{lines:(await pdfLineObjs(file)).map(l=>l.t),pdf:true};
  throw new Error('chỉ hỗ trợ .docx, .pdf và .txt');
}

// ---- đọc .xlsx -> [{name, rows:[[ô,...],...]}] ----
async function readXlsx(file){
  await loadScript('vendor/jszip.min.js');
  const z=await JSZip.loadAsync(await file.arrayBuffer()),P=new DOMParser();
  const xml=async n=>{const f=z.file(n);return f?P.parseFromString(await f.async('string'),'text/xml'):null};
  const local=(e,n)=>[...e.getElementsByTagName('*')].filter(x=>x.localName===n);
  const ss=[],sx=await xml('xl/sharedStrings.xml');
  if(sx)local(sx,'si').forEach(si=>ss.push(local(si,'t').map(t=>t.textContent).join('')));
  const wb=await xml('xl/workbook.xml'),rel=await xml('xl/_rels/workbook.xml.rels'),map={};
  if(rel)local(rel,'Relationship').forEach(r=>{map[r.getAttribute('Id')]=r.getAttribute('Target')});
  const col=r=>{let n=0;for(const ch of r.replace(/[^A-Z]/gi,'').toUpperCase())n=n*26+ch.charCodeAt(0)-64;return n-1};
  const out=[];
  for(const sh of local(wb,'sheet')){
    const rid=sh.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id')||sh.getAttribute('r:id');
    let t=(map[rid]||'').replace(/^\//,'');if(t&&!t.startsWith('xl/'))t='xl/'+t;
    const d=t&&await xml(t);if(!d)continue;
    const rows=[];
    local(d,'row').forEach(r=>{
      const a=[];
      local(r,'c').forEach(c=>{
        const ty=c.getAttribute('t'),v=local(c,'v')[0],i=ci(c);
        let s='';
        if(ty==='s'&&v)s=ss[+v.textContent]||'';
        else if(ty==='inlineStr')s=local(c,'t').map(x=>x.textContent).join('');
        else if(v)s=v.textContent;
        a[i]=String(s).trim();
      });
      for(let k=0;k<a.length;k++)if(a[k]==null)a[k]='';
      rows.push(a);
    });
    out.push({name:sh.getAttribute('name')||'',rows});
    function ci(c){return col(c.getAttribute('r')||'A')}
  }
  return out;
}

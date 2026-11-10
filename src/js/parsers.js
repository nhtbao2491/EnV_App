/* Phân tích file & chấm điểm cho tab Viết và tab Ghép câu.
 * Toàn hàm thuần (không đụng DOM) nên có thể kiểm thử riêng. */
const NZ=s=>String(s).normalize('NFC').replace(/\u00a0/g,' ').replace(/\s+/g,' ').trim();

/* ================= TAB VIẾT: Bài N: tên / Trình độ / Tiếng Việt / Từ gợi ý / Tiếng Anh ================= */
const R_TITLE=/^b[àa]i\s*\d+\b/i;
const R_LEVEL=/^(?:tr[ìi]nh\s*[đd][ộo]|c[ấa]p\s*[đd][ộo]|level)\s*[:：]\s*(.*)$/i;
const R_VI=/^ti[ếe]ng\s*vi[ệe]t\s*[:：]?\s*(.*)$/i;
const R_HINT=/^t[ừu]\s*g[ợo]i\s*[ýy]\s*[:：]?\s*(.*)$/i;
const R_EN=/^ti[ếe]ng\s*anh\s*[:：]?\s*(.*)$/i;
const R_SEP=/^[-_=—–*]{3,}$/;

function parseHints(s){
  const parts=[];let d=0,b='';
  for(const ch of s){
    if(ch==='('||ch==='（')d++;else if(ch===')'||ch==='）')d=Math.max(0,d-1);
    if(d===0&&(ch==='·'||ch==='•'||ch==='|')){parts.push(b);b=''}else b+=ch;
  }
  parts.push(b);
  return parts.map(x=>x.trim()).filter(Boolean).map(x=>{
    const m=x.match(/^(.*?)\s*[(（](.*)[)）]\s*$/);
    return m?{en:m[1].trim(),vi:m[2].trim()}:{en:x,vi:''};
  }).filter(h=>h.en);
}

// lines: mảng dòng chữ; pdf=true thì các dòng cùng mục là một đoạn bị xuống dòng (nối bằng khoảng trắng)
function parseWriting(rawLines,pdf){
  const L=rawLines.map(NZ).filter(Boolean),out=[];
  let cur=null,sec=null,prev='';
  const fin=()=>{
    if(!cur)return;
    const sp=x=>x.join(' ').replace(/\s+/g,' ').trim();
    const vi=pdf?sp(cur.vi):cur.vi.join('\n').trim();
    const answers=cur.en.map(sp).filter(Boolean);
    if(vi)out.push({title:cur.title,level:cur.level,vi,hints:parseHints(pdf?sp(cur.hint):cur.hint.join(' · ')),answers});
    cur=null;
  };
  const start=title=>{fin();cur={title,level:'',vi:[],hint:[],en:[]};sec=null};
  for(const l of L){
    let m;
    if(R_SEP.test(l)){fin();sec=null;prev='';continue}
    if(R_TITLE.test(l)){start(l);continue}
    if((m=l.match(R_LEVEL))&&cur&&sec!=='en'){cur.level=lvOf(m[1]);sec=null;continue}
    if(m=l.match(R_VI)){
      if(!cur||(cur.vi.length&&sec!=='vi'))start(prev||'Bài chưa đặt tên');
      sec='vi';if(m[1])cur.vi.push(m[1]);continue;
    }
    if(!cur){prev=l;continue}
    if(m=l.match(R_HINT)){sec='hint';if(m[1])cur.hint.push(m[1]);continue}
    if(m=l.match(R_EN)){sec='en';cur.en.push([]);if(m[1])cur.en[cur.en.length-1].push(m[1]);continue}
    if(sec==='vi')cur.vi.push(l);
    else if(sec==='hint')cur.hint.push(l);
    else if(sec==='en'&&cur.en.length)cur.en[cur.en.length-1].push(l);
    else prev=l;
  }
  fin();
  return out;
}
function lvOf(s){s=NZ(s);const m=s.match(/\b([ABC][12])\b/i);return m?m[1].toUpperCase():s}

/* ================= BỘ CHẤM ĐIỂM DÙNG CHUNG (Viết · Ráp từ · Viết câu) =================
 * Mỗi "từ" mang theo dấu câu đứng liền SAU nó (Hello, → từ "hello" + dấu ","), nên dấu phẩy luôn gắn với từ phía trước.
 * Điểm chỉ tính theo TỪ và THỨ TỰ TỪ (không phân biệt hoa/thường). Thiếu / thừa dấu câu, quên viết hoa chỉ là
 * "lưu ý" hiển thị bên dưới — KHÔNG bị tính là sai. */
const CONTR=[[/\bcan't\b/g,'can not'],[/\bcannot\b/g,'can not'],[/\bwon't\b/g,'will not'],[/\bshan't\b/g,'shall not'],
  [/n't\b/g,' not'],[/'m\b/g,' am'],[/'re\b/g,' are'],[/'ve\b/g,' have'],[/'ll\b/g,' will']];
const P_END=/[.!?…]/,P_IN=/[,;:]/;
function ptok(s){
  const out=[];let g=0;
  String(s==null?'':s).normalize('NFC').replace(/[’‘`´]/g,"'").replace(/[“”«»]/g,'"').split(/\s+/).filter(Boolean).forEach(raw=>{
    const m=raw.match(/^([^\p{L}\p{N}]*)(.*?)([^\p{L}\p{N}]*)$/u);
    let core=m[2],tail=m[3];
    if(!core){ // token chỉ toàn dấu (— , ...) -> gắn vào từ trước
      if(out.length)out[out.length-1].p+=raw.replace(/["'()\[\]]/g,'');
      return;
    }
    if(/'$/.test(core)){core=core.slice(0,-1)} // dấu nháy đóng
    const punct=(tail.replace(/["'()\[\]\s]/g,'')+'').replace(/[–—-]+/g,'');
    let low=core.toLowerCase();
    CONTR.forEach(([r,x])=>{low=low.replace(r,x)});
    const parts=low.replace(/[–—-]/g,' ').replace(/[^\p{L}\p{N}'\s]/gu,'').split(/\s+/).map(t=>t.replace(/^'+|'+$/g,'')).filter(Boolean);
    if(!parts.length){if(out.length)out[out.length-1].p+=punct;return}
    parts.forEach((w,i)=>out.push({w,p:i===parts.length-1?punct:'',raw:i===0?raw:'',cap:i===0&&/\p{Lu}/u.test(core),g}));
    g++;
  });
  return out;
}
const wtok=s=>ptok(s).map(t=>t.w);
function lcsDiff(a,b){
  const n=a.length,m=b.length,dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const ma=new Set(),mb=new Set(),pairs=[];let i=0,j=0;
  while(i<n&&j<m){
    if(a[i]===b[j]){ma.add(i);mb.add(j);pairs.push([i,j]);i++;j++}
    else if(dp[i+1][j]>=dp[i][j+1])i++;else j++;
  }
  return{n:dp[0][0],ma,mb,pairs};
}
// lưu ý nhỏ về dấu câu / viết hoa (KHÔNG ảnh hưởng điểm)
function punctTips(ut,rt,pairs,max){
  const tips=[],add=t=>{if(tips.length<(max||4))tips.push(t)};
  pairs.forEach(([i,j])=>{
    const u=ut[i],r=rt[j],last=j===rt.length-1;
    const rc=P_IN.test(r.p),uc=P_IN.test(u.p);
    if(rc&&!uc)add('thiếu dấu phẩy/dấu ngắt sau “'+r.w+'”');
    else if(!rc&&uc&&!last)add('thừa dấu phẩy/dấu ngắt sau “'+u.w+'”');
  });
  if(rt.length&&ut.length){
    const re=(rt[rt.length-1].p.match(P_END)||[''])[0],ue=(ut[ut.length-1].p.match(P_END)||[''])[0];
    if(re&&!ue)add('thiếu dấu câu cuối câu (“'+re+'”)');
    else if(re&&ue&&re!==ue)add('dấu cuối câu nên là “'+re+'”');
    else if(!re&&ue)add('đáp án không có dấu “'+ue+'” ở cuối');
    if(/^\p{Ll}/u.test(ut[0].raw)&&rt[0].cap)add('chữ đầu câu nên viết hoa');
  }
  pairs.forEach(([i,j])=>{if(j>0&&rt[j].cap&&ut[i].raw&&!ut[i].cap&&rt[j].raw)add('nên viết hoa “'+rt[j].raw.replace(/[^\p{L}\p{N}']/gu,'')+'”')});
  return tips;
}
/* so bài làm với MỘT đáp án -> {f (0..1), exact, ma, mb, u, r, tips} */
function gradeOne(user,ans){
  const u=ptok(user),r=ptok(ans),d=lcsDiff(u.map(t=>t.w),r.map(t=>t.w));
  const f=(u.length+r.length)?2*d.n/(u.length+r.length):0;
  return{f,u,r,ma:d.ma,mb:d.mb,exact:u.length>0&&u.length===r.length&&d.n===r.length,tips:punctTips(u,r,d.pairs),ans};
}
// nhiều đáp án (mảng) -> lấy đáp án khớp nhất
function gradeWriting(user,answers){
  let best=null;
  (Array.isArray(answers)?answers:[answers]).forEach(a=>{const g=gradeOne(user,a);if(!best||g.f>best.f)best=g});
  return best;
}

/* ================= TAB GHÉP CÂU: UNIT n · tên / "k. câu Việt" / từ / từ / → đáp án (tùy chọn) ================= */
const R_UNIT=/^(?:unit|b[àa]i)\s*(\d+)\s*[·•:.\-–—]\s*(.+)$/i;
const R_TOPIC=/^ch[ủu]\s*[đd][ềe]\s*\d+/i;
const R_NUM=/^(\d+)\s*[.)]\s*(.+)$/;
const R_ARROW=/^[→➔➜]\s*(.*)$/;
const R_SKIP=/^(r[áa]p l[ạa]i c[áa]c t[ừu]|ch[ữu] [đd][ầa]u c[âa]u)/i;

function parseSentences(rawLines){
  const L=rawLines.map(NZ).filter(Boolean),units=[];
  let unit=null,topic='',s=null,mode='';
  const finS=()=>{
    if(s&&unit){
      const words=s.w.split('/').map(x=>x.trim()).filter(Boolean);
      if(words.length>=2&&s.vi)unit.sents.push({vi:s.vi.trim(),words:fixChips(words,s.key),key:s.key||''});
    }
    s=null;mode='';
  };
  const finU=()=>{finS();if(unit&&unit.sents.length)units.push(unit);unit=null};
  for(const l of L){
    let m;
    if(R_TOPIC.test(l)){finU();topic=l;continue}
    if((m=l.match(R_UNIT))&&!R_NUM.test(l)){finU();unit={title:NZ(l.replace(/^(unit)\s*(\d+)/i,(x,a,b)=>a.toUpperCase()+' '+b)),topic,sents:[]};continue}
    if(!unit||R_SKIP.test(l))continue;
    if(m=l.match(R_NUM)){finS();s={vi:m[2],w:'',key:''};mode='vi';continue}
    if(!s)continue;
    if(m=l.match(R_ARROW)){const k=m[1].replace(/[_\s]+$/,'').replace(/^[_\s]+/,'').trim();s.key=/[A-Za-z]/.test(k)?k:'';mode='done';continue}
    if(mode==='vi'){
      if(l.includes('/')){s.w=l;mode='w'}else s.vi+=' '+l;
    }else if(mode==='w')s.w+=' '+l;
  }
  finU();
  return units;
}

// ---- ô chữ (chip) cho "Ráp từ": dấu phẩy / chấm phẩy / hai chấm GẮN LIỀN với từ đứng trước ----
// words: các từ đã xáo; key: đáp án. Trả về words có dấu đính kèm đúng như trong đáp án (Hello, my name is Lan.)
const chipCore=w=>String(w).toLowerCase().replace(/[’‘`´]/g,"'").replace(/[^\p{L}\p{N}'-]/gu,'');
function fixChips(words,key){
  const k=String(key||'').split(/\s*\|\s*/)[0];
  if(!k||!words||!words.length)return words;
  const pool={};
  k.replace(/[’‘`´]/g,"'").split(/\s+/).filter(Boolean).forEach(t=>{
    const m=t.match(/^[^\p{L}\p{N}]*(.*?)([,;:]+)[^\p{L}\p{N}]*$/u);
    if(!m||!m[1])return;
    const c=chipCore(m[1]);(pool[c]=pool[c]||[]).push(m[2][0]);
  });
  return words.map(w=>{
    const bare=String(w).replace(/[,;:]+$/,''),c=chipCore(bare);
    if(pool[c]&&pool[c].length)return bare+pool[c].shift();
    return bare;
  });
}
// mặt nạ các từ đã dùng: ghép từng từ trong câu đang gõ với một chip chưa dùng (so theo phần chữ, bỏ dấu câu)
function usedMask(words,text){
  const used=words.map(()=>false),cs=words.map(chipCore);
  ptok(text).forEach(t=>{
    const c=chipCore(t.raw||t.w);
    let k=cs.findIndex((w,i)=>!used[i]&&w===c);
    if(k<0)k=cs.findIndex((w,i)=>!used[i]&&w===t.w);
    if(k>=0)used[k]=true;
  });
  return used;
}
/* chấm 1 câu: r = ok (đúng từ & thứ tự) | part (gần đúng ≥70%) | no | empty | nokey ; sc = điểm 0..1 ; tips = lưu ý dấu câu/viết hoa */
function checkSentence(user,key){
  const u=NZ(user);if(!u)return{r:'empty',sc:0};
  const keys=String(key).split(/\s*\|\s*/).map(NZ).filter(Boolean);
  if(!keys.length)return{r:'nokey',sc:0};
  const g=gradeWriting(u,keys);
  if(g.exact){
    return{r:'ok',sc:1,key:g.ans,tips:g.tips,
      note:g.tips.length?'Đúng từ & thứ tự — lưu ý nhỏ (không bị trừ điểm): '+g.tips.join('; '):''};
  }
  return{r:g.f>=0.7?'part':'no',sc:g.f,key:g.ans,f:g.f,
    note:'Giống đáp án '+Math.round(g.f*100)+'% (tính theo từ & thứ tự từ)'};
}

/* Excel/bảng: cột Chủ đề | STT | Tiếng Việt | Tiếng Anh bị xáo trộn | Đáp án (nhận theo tên cột; không có tên thì theo thứ tự cột) */
function parseSentenceRows(sheets){
  const units=[],has=(s,re)=>re.test(NZ(s||''));
  sheets.forEach(sh=>{
    const rows=sh.rows.map(r=>(r||[]).map(x=>NZ(x==null?'':x)));
    const h=rows.findIndex(r=>r.filter(Boolean).length>=3&&r.some(c=>has(c,/vi[ệe]t/i))&&r.some(c=>has(c,/x[áa]o|l[ộo]n|tr[ộo]n|t[áa]ch|r[áa]p|scrambl|shuffl|anh/i)));
    if(h<0)return;
    const H=rows[h],find=re=>H.findIndex(c=>has(c,re));
    let cV=find(/vi[ệe]t/i),cA=find(/[đd][áa]p [áa]n|answer|key/i);
    let cW=H.findIndex((c,i)=>i!==cA&&has(c,/x[áa]o|l[ộo]n|tr[ộo]n|t[áa]ch|r[áa]p|scrambl|shuffl/i));
    if(cW<0)cW=H.findIndex((c,i)=>i!==cA&&i!==cV&&has(c,/anh|english/i));
    let cT=find(/ch[ủu] [đd][ềe]|unit|topic|b[àa]i/i);
    if(cV<0||cW<0)return;
    let cur=null;
    const push=()=>{if(cur&&cur.sents.length)units.push(cur);cur=null};
    rows.slice(h+1).forEach(r=>{
      const vi=r[cV]||'',wr=r[cW]||'',key=cA>=0?(r[cA]||''):'',tp=cT>=0?(r[cT]||''):'';
      if(!vi&&!wr){const t=r.find(Boolean);if(t){push();cur={title:t,topic:'',sents:[]}}return}
      const title=tp||(cur&&cur.title)||sh.name||'Chủ đề';
      if(!cur||cur.title!==title){push();cur={title,topic:'',sents:[]}}
      const words=wr.split(/\s*[\/|]\s*/).map(x=>x.trim()).filter(Boolean);
      if(vi&&words.length>=2)cur.sents.push({vi,words:fixChips(words,key),key});
    });
    push();
  });
  return units;
}

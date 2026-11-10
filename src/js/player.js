/* Trình phát: tách câu, giọng đọc, phát/dừng */
const S1=`Welcome to "Wonders of the Natural World" — a journey through some of the most breathtaking landscapes on our planet.
We begin in the tropics, deep inside a vast rainforest. The air is warm and humid, filled with the sounds of birds and insects. This ancient ecosystem is home to thousands of species — from colorful butterflies to rare frogs hidden beneath leaves on the ground.
High above, a family of elephants moves slowly through the jungle, searching for water near a small stream. These magnificent creatures need enormous amounts of food and water to survive. In the nearby pond, a group of ducks bobs gently on the surface.
Moving higher, we reach a rugged mountain range. The valleys below are blanketed in thick forest. A lone lion rests on a rock at the edge of a cliff, watching the vast plain below. On the plain, a herd of zebras grazes peacefully. Their distinctive black and white stripes make each one unique.
Further south, we find a dry desert where very little rain falls. Only the most resilient species survive here — animals and plants that have adapted to extreme conditions. The soil is cracked and barren.
We end our journey at the ocean shore — where the waves roll gently across the sandy shore and dolphins leap through the water near a small rocky island. Above the cliff, a giraffe-like silhouette appears — but wait, that's just a tall palm tree.
The beauty of our planet's natural world is extraordinary. It is our responsibility to protect every ecosystem, every wildlife habitat, and every species — before it is too late.`;
const S2=`Interviewer: Good afternoon, everyone. Thank you for coming in today. We're looking for a motivated individual to join our team as a junior software programmer. Let's begin. Candidate One — please introduce yourself.
Candidate 1 (Tuan): Good afternoon. My name is Tuan. I recently graduated with a degree in Computer Science from Hanoi National University. I've been working as an intern at a local IT firm for the past six months, which gave me hands-on experience in coding and software development. I applied for this role because I want to build a long-term career in the tech industry.
Interviewer: Excellent. What qualifications do you have beyond your degree?
Tuan: I have a certificate in cloud computing and I'm currently enrolled in an advanced course on data engineering.
Interviewer: Good. Candidate Two — your turn.
Candidate 2 (Lan): Hi! I'm Lan, and I currently work full-time as a junior designer at a small startup. My manager has always said I'm very reliable and hardworking. I've also been working closely with our accountant on project budgets, so I have some cross-department experience.
Interviewer: Interesting. What's your biggest professional strength?
Lan: I think it's communication. I always make sure everyone in the team is on the same page — especially in meetings. I try to manage my time well and never miss a deadline.
Interviewer: Candidate Three?
Candidate 3 (Nam): I'm Nam. I worked as a journalist for two years before switching careers into tech. It was challenging, but I'm now a self-taught programmer with strong skills in Python and JavaScript. My previous employer gave me an excellent reference — I can share it if needed.
Interviewer: Great. Final question for all three: where do you see yourself in five years?
Tuan: I hope to be promoted to a senior engineer role and eventually manage my own department.
Lan: I'd love to become a director of design and build a company where creativity drives everything.
Nam: I want to become a professional programmer who also manages a small team. I'm even considering starting my own company one day.
Interviewer: Excellent answers. We'll review your CVs and contact you by Friday. Thank you all for your time.`;

const $=id=>document.getElementById(id);
const BM=document.getElementById('bmsg').textContent;
const synth=window.speechSynthesis;
let natural=false,voices=[],lines=[],cfg={},idx=0,playing=false,timer=null,token=0;

/* ===== GIỌNG ĐỌC: lấy TẤT CẢ giọng tiếng Anh có trên thiết bị, giọng tự nhiên (Natural/Neural/Google/Siri…) xếp trước ===== */
const NAT_RE=/natural|neural|online|google|premium|enhanced|siri|wavenet|multilingual|studio|eloquence/i;
const isNat=v=>!!v.online||NAT_RE.test(v.name)||NAT_RE.test(v.voiceURI||'');
const vKey=v=>v.voiceURI||v.name;
const ACCENT={'en-US':'Mỹ','en-GB':'Anh','en-AU':'Úc','en-IN':'Ấn Độ','en-CA':'Canada','en-IE':'Ireland','en-ZA':'Nam Phi','en-NZ':'New Zealand','en-SG':'Singapore','en-PH':'Philippines','en-NG':'Nigeria','en-KE':'Kenya','en-HK':'Hồng Kông','en-TZ':'Tanzania','en-GH':'Ghana','en-SC':'Scotland','en':'Tiếng Anh'};
const ACC_ORDER=['en-US','en-GB','en-AU','en-IN','en-CA','en-IE','en-ZA','en-NZ'];
const accOf=l=>{l=String(l||'').replace('_','-');const m=l.match(/^en-([A-Za-z]{2})/i);return m?'en-'+m[1].toUpperCase():'en'};
const accName=l=>ACCENT[accOf(l)]||accOf(l);
let allEn=[],VOICE_TIMER=null;
/* ===== Giọng ONLINE (chỉ bản .exe, cần Internet): Microsoft Edge Neural + Google ===== */
const EDGE_VOICES={'en-US':['Aria:f','Jenny:f','Michelle:f','Ana:f','Ava:f','Emma:f','Guy:m','Andrew:m','Brian:m','Christopher:m','Eric:m','Roger:m','Steffan:m'],
 'en-GB':['Sonia:f','Libby:f','Maisie:f','Abbi:f','Bella:f','Hollie:f','Olivia:f','Ryan:m','Thomas:m','Alfie:m','Elliot:m','Ethan:m','Noah:m','Oliver:m'],
 'en-AU':['Natasha:f','William:m'],'en-CA':['Clara:f','Liam:m'],'en-IN':['Neerja:f','Prabhat:m'],'en-IE':['Emily:f','Connor:m'],
 'en-NZ':['Molly:f','Mitchell:m'],'en-ZA':['Leah:f','Luke:m'],'en-SG':['Luna:f','Wayne:m'],'en-HK':['Yan:f','Sam:m'],
 'en-KE':['Asilia:f','Chilemba:m'],'en-NG':['Ezinne:f','Abeo:m'],'en-PH':['Rosa:f','James:m'],'en-TZ':['Imani:f','Elimu:m']};
const GOOGLE_VOICES=[['en-US','Google dịch (giọng Mỹ)'],['en-GB','Google dịch (giọng Anh)'],['en-AU','Google dịch (giọng Úc)'],['en-IN','Google dịch (giọng Ấn Độ)'],['en-CA','Google dịch (giọng Canada)'],['en-IE','Google dịch (giọng Ireland)'],['en-ZA','Google dịch (giọng Nam Phi)']];
function onlineVoices(){
  if(!window.nativeTTS)return [];
  const out=[];
  Object.entries(EDGE_VOICES).forEach(([lang,l])=>l.forEach(x=>{const[n,g]=x.split(':');
    out.push({name:n+' · Microsoft Online (Natural)',lang,voiceURI:'edge:'+lang+'-'+n+'Neural',online:'edge',id:lang+'-'+n+'Neural',g})}));
  GOOGLE_VOICES.forEach(([lang,nm])=>out.push({name:nm,lang,voiceURI:'google:'+lang,online:'google',id:lang,g:''}));
  return out;
}
const AUDIO_CACHE=new Map();let curAudio=null;
async function onlineAudio(vo,text){
  const k=vo.voiceURI+'|'+text;if(AUDIO_CACHE.has(k))return AUDIO_CACHE.get(k);
  const r=await window.nativeTTS.synth(vo.online,vo.id,text);
  if(!r||!r.ok)throw new Error((r&&r.error)||'lỗi giọng online');
  const url=URL.createObjectURL(new Blob([r.data],{type:'audio/mpeg'}));
  if(AUDIO_CACHE.size>60){const f=AUDIO_CACHE.keys().next().value;URL.revokeObjectURL(AUDIO_CACHE.get(f));AUDIO_CACHE.delete(f)}
  AUDIO_CACHE.set(k,url);return url;
}
function sortVoices(a,b){
  const n=(isNat(b)?1:0)-(isNat(a)?1:0);if(n)return n;
  const ia=ACC_ORDER.indexOf(accOf(a.lang)),ib=ACC_ORDER.indexOf(accOf(b.lang));
  const d=(ia<0?99:ia)-(ib<0?99:ib);if(d)return d;
  return a.name.localeCompare(b.name);
}
function voiceNote(){
  const no=allEn.filter(v=>v.online).length;
  if(no){$('msg').textContent='Có '+allEn.length+' giọng tiếng Anh: '+(allEn.length-no)+' giọng trong máy + '+no+' giọng online (🌐 cần Internet; nếu lỗi sẽ tự đọc bằng giọng trong máy). Đang hiển thị '+voices.length+'.';return}
  if(!synth){$('msg').textContent='Trình duyệt không hỗ trợ đọc giọng nói.';return}
  const nn=allEn.filter(isNat).length,acc=[...new Set(allEn.map(v=>accName(v.lang)))].join(', ');
  $('msg').textContent='Có '+allEn.length+' giọng tiếng Anh'+(nn?' (trong đó '+nn+' giọng tự nhiên ★)':'')+(acc?' · giọng vùng: '+acc:'')+'. Đang hiển thị '+voices.length+'.'
    +(nn?'':' Máy chưa có giọng tự nhiên — mở bằng Microsoft Edge hoặc Chrome để có thêm giọng Natural/Google.')
    +(allEn.length<8?' Muốn thêm giọng: Windows → Cài đặt → Thời gian & ngôn ngữ → Giọng nói → Thêm giọng.':'');
}
function applyFilter(){
  const f=(typeof Store!=='undefined'&&Store.get('vfilter','all'))||'all';
  let l=allEn;
  if(f==='nat')l=allEn.filter(isNat);else if(f==='online')l=allEn.filter(v=>v.online);else if(f!=='all')l=allEn.filter(v=>accOf(v.lang)===f);
  voices=l.length?l:allEn;
}
function fillFilter(){
  const s=$('vf');if(!s)return;
  const f=(typeof Store!=='undefined'&&Store.get('vfilter','all'))||'all';
  s.innerHTML='';
  s.appendChild(new Option('Tất cả giọng tiếng Anh ('+allEn.length+')','all'));
  const nn=allEn.filter(isNat).length;
  if(nn)s.appendChild(new Option('★ Chỉ giọng tự nhiên ('+nn+')','nat'));
  const no=allEn.filter(v=>v.online).length;
  if(no)s.appendChild(new Option('🌐 Chỉ giọng online ('+no+')','online'));
  [...new Set(allEn.map(v=>accOf(v.lang)))].sort((a,b)=>{const x=ACC_ORDER.indexOf(a),y=ACC_ORDER.indexOf(b);return (x<0?99:x)-(y<0?99:y)})
    .forEach(c=>s.appendChild(new Option('Giọng '+(ACCENT[c]||c)+' ('+allEn.filter(v=>accOf(v.lang)===c).length+')',c)));
  s.value=[...s.options].some(o=>o.value===f)?s.value=f:'all';
}
function loadVoices(){
  const list=synth?synth.getVoices():[];
  const en=list.filter(v=>/^en([-_]|$)/i.test(v.lang||''));
  allEn=en.concat(onlineVoices()).sort(sortVoices);
  natural=allEn.some(isNat);
  fillFilter();applyFilter();
  if(lines.length){renderSpeakers();voiceNote()}
}
if(synth){
  loadVoices();synth.onvoiceschanged=loadVoices;
  // một số trình duyệt nạp giọng chậm: thử lại vài lần
  let tries=0;VOICE_TIMER=setInterval(()=>{const n=allEn.length;loadVoices();if(++tries>=20||(n&&allEn.length===n&&tries>4))clearInterval(VOICE_TIMER)},500);
}

// ---- giới tính / giọng ----
const MALE=/\b(david|mark|guy|james|george|daniel|alex|fred|ryan|thomas|richard|rishi|oliver|male|aaron|arthur|gordon|lee|reed|eddy|rocko|ralph|bruce|albert|evan|liam|eric|roger|brian|andrew|matthew|ravi|mike|tom|nathan|jorge|diego|luca|henri|william|mitchell|prabhat|steffan|connor|christopher|sam|davis|jason|tony|brandon|jacob|ethan|elliot|alfie|noah|luke|bradley|guy|hemant|kalpesh|liam|rhys|ronan|ryan|wayne|zack|stephen|justin|kevin|lucas|jerry|joey|juan|nicholas|patrick|paul|peter|john|henry|harry|jack|mason|logan|jimmy|calvin|clive|dylan|finn|stuart|trevor)\b/i;
const FEMALE=/\b(female|zira|aria|jenny|hazel|susan|karen|moira|tessa|victoria|allison|ava|fiona|kate|serena|michelle|emma|libby|sonia|samantha|flo|shelley|sandy|grandma|catherine|heather|linda|jessica|amy|joanna|nicky|veena|monica|natasha|clara|neerja|ana|mia|molly|leah|elizabeth|google us english|jane|nancy|sara|sarah|amber|ashley|cora|maisie|abbi|bella|hollie|ivy|kendra|kimberly|salli|ruth|olivia|lily|holly|isla|ella|grace|jenna|joan|lisa|marie|mary|nora|rose|sally|sophie|stella|laura|lucy|vicki|zoe|siri|emily|anna|ellen|eva|paulina|tracy)\b/i;
const FN=/^(lan|hoa|mai|linh|huong|hương|thu|trang|anna|mary|lisa|sara|sarah|emily|anh|ngoc|ngọc)$/i;
const MN=/^(tuan|tuấn|nam|minh|hung|hùng|john|david|tom|mike|peter|long|duc|đức|khoa)$/i;
function guessGender(n,i){
  const w=n.split(/\s+/)[0];
  if(FN.test(w))return 'f';
  if(MN.test(w))return 'm';
  return i%2?'m':'f';
}
function vGender(v){return v.g?v.g:FEMALE.test(v.name)?'f':MALE.test(v.name)?'m':''}
// xếp xen kẽ theo giọng vùng, giọng tự nhiên trước, để mỗi người nói nghe khác nhau
function divList(pred){
  const l=voices.filter(pred),nat=l.filter(isNat),rest=l.filter(v=>!isNat(v));
  const spread=arr=>{
    const by={};arr.forEach(v=>(by[v.lang]=by[v.lang]||[]).push(v));
    const ks=Object.keys(by),out=[];
    for(let i=0;out.length<arr.length;i++)ks.forEach(k=>{if(by[k][i])out.push(by[k][i])});
    return out;
  };
  return spread(nat).concat(spread(rest));
}
function voiceFor(n){
  const c=cfg[n];
  if(c.voice!==''){return voices.find(v=>vKey(v)===c.voice)||allEn.find(v=>vKey(v)===c.voice)||null}
  const names=Object.keys(cfg),slot=names.slice(0,names.indexOf(n)).filter(x=>cfg[x].gender===c.gender&&cfg[x].voice==='').length;
  let list=divList(v=>vGender(v)===c.gender);
  if(!list.length)list=divList(v=>vGender(v)==='');
  if(!list.length)list=divList(()=>true);
  return list.length?list[slot%list.length]:null;
}
function shuffle(){
  const used=new Set(),all=voices.map((_,i)=>i);
  Object.keys(cfg).forEach(n=>{
    const c=cfg[n];
    let pool=all.filter(i=>vGender(voices[i])===c.gender&&!used.has(i));
    if(!pool.length)pool=all.filter(i=>!used.has(i));
    if(!pool.length)pool=all;
    if(!pool.length)return;
    const i=pool[Math.random()*pool.length|0];used.add(i);
    c.voice=vKey(voices[i]);c.pitch=+(0.85+Math.random()*0.3).toFixed(2);
  });
  renderSpeakers();
}
function effPitch(n){
  const c=cfg[n],v=voiceFor(n);
  const adj=(v&&vGender(v)===c.gender)?1:(c.gender==='m'?0.7:1.12);
  return Math.min(2,Math.max(0.1,c.pitch*adj));
}

// ---- tách câu ----
const ABBR=/\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|vs|etc|Inc|Ltd|Co|No|Mt|Fig|approx|e\.g|i\.e|a\.m|p\.m)\.["”’')\]]*$/i;
function splitSentences(t){
  t=t.replace(/\s+/g,' ').trim();
  const parts=[],re=/[.!?…]+["”’')\]]*(?=\s|$)/g;let start=0,m;
  while((m=re.exec(t))){
    const end=m.index+m[0].length,head=t.slice(start,end),next=t.slice(end).trimStart();
    if(end<t.length&&(ABBR.test(head)||/(?:^|\s)[A-Z]\.$/.test(head)||/^[a-z]/.test(next)))continue;
    parts.push(head.trim());start=end;
  }
  if(start<t.length)parts.push(t.slice(start).trim());
  return parts.filter(Boolean);
}
function pack(arr){ // gộp câu quá ngắn vào câu bên cạnh
  const out=[];
  for(const s of arr){
    const last=out[out.length-1];
    if(last&&(last.split(' ').length<3||s.split(' ').length<2)&&last.length+s.length<120)out[out.length-1]=last+' '+s;
    else out.push(s);
  }
  return out;
}
function breakLong(s,max=180){ // câu quá dài thì ngắt ở ; : — , gần cuối
  if(s.length<=max)return [s];
  const out=[];let rest=s;
  while(rest.length>max){
    const win=rest.slice(0,max);let cut=-1;
    for(const re of [/[;:—–]\s/g,/,\s/g]){
      let m,last=-1;
      while((m=re.exec(win)))if(m.index>40)last=m.index+m[0].length;
      if(last>0){cut=last;break}
    }
    if(cut<0){cut=win.lastIndexOf(' ');if(cut<40)cut=max}
    out.push(rest.slice(0,cut).trim());rest=rest.slice(cut).trim();
  }
  if(rest)out.push(rest);
  return out;
}
const chunks=t=>pack(splitSentences(t)).flatMap(x=>breakLong(x));
const speakText=t=>t.replace(/\s*[—–]\s*/g,', ').replace(/["“”]/g,'').replace(/\s+/g,' ').replace(/[,\s]+$/,'');

// ---- parse ----
function parse(text){
  const KW=/^(reading|essay|article|story|email|announcement|dialogue|conversation|interview)$/i;
  const out=[],raw=text.split(/\n+/).map(s=>s.trim().replace(/^[-•*]\s+/,'')).map(l=>{const m=l.match(/^content\s*:\s*(.*)$/i);return m?m[1].trim():l}).filter(l=>l&&!KW.test(l)&&!/^(title|topic)\s*:/i.test(l));
  const re=/^([^:.!?,]{1,40}):\s+(.+)$/;
  const hasSpk=raw.filter(l=>re.test(l)).length>=2;
  let who='Người đọc';
  for(const l of raw){
    let body=l;
    if(hasSpk){
      const m=l.match(re);
      if(m){const p=m[1].match(/\(([^)]+)\)/);who=(p?p[1]:m[1]).trim();body=m[2]}
    }
    chunks(body).forEach((t,i)=>out.push({who,text:t,turn:i===0}));
  }
  return out;
}

// ---- UI ----
function syncSample(){}
function build(){
  stop();syncSample();
  lines=parse($('txt').value);
  $('bmsg').textContent=lines.length?BM:'Ô Transcript đang trống — hãy dán nội dung hoặc chọn một bài mẫu.';
  if(!lines.length){$('player').hidden=$('outsec').hidden=true;return}
  const names=[...new Set(lines.map(l=>l.who))];
  const old=cfg;cfg={};
  names.forEach((n,i)=>{cfg[n]=old[n]||{gender:guessGender(n,i),voice:'',pitch:[1,.92,1.1,.85,1.15][i%5]}});
  renderSpeakers();renderLines();
  $('player').hidden=$('outsec').hidden=false;
  idx=0;mark();
  voiceNote();
}
function renderSpeakers(){
  const box=$('spks');box.innerHTML='';
  Object.keys(cfg).forEach(n=>{
    const d=document.createElement('div');d.className='spk';
    const b=document.createElement('b');b.textContent=n;
    const g=document.createElement('select');g.setAttribute('aria-label','Giới tính của '+n);
    g.innerHTML='<option value="f">Nữ</option><option value="m">Nam</option>';
    g.value=cfg[n].gender;
    const sel=document.createElement('select');sel.className='v';sel.setAttribute('aria-label','Giọng của '+n);
    const fill=()=>{
      sel.innerHTML='';
      const au=document.createElement('option');au.value='';au.textContent='Tự động theo giới tính'+(voiceFor(n)?' ('+voiceFor(n).name+')':'');sel.appendChild(au);
      const opt=v=>{const o=document.createElement('option');o.value=vKey(v);o.textContent=(v.online?'🌐 ':isNat(v)?'★ ':'')+v.name+' ('+v.lang+')'+(vGender(v)?(vGender(v)==='f'?' – nữ':' – nam'):'');return o};
      const nat=voices.filter(isNat),rest=voices.filter(v=>!isNat(v));
      const grp=(label,arr)=>{if(!arr.length)return;const og=document.createElement('optgroup');og.label=label;arr.forEach(v=>og.appendChild(opt(v)));sel.appendChild(og)};
      grp('★ Giọng tự nhiên ('+nat.length+')',nat);
      grp('Giọng thường ('+rest.length+')',rest);
      sel.value=cfg[n].voice;
      if(sel.value!==cfg[n].voice)sel.value='';
    };
    fill();
    g.onchange=()=>{cfg[n].gender=g.value;cfg[n].voice='';renderSpeakers()};
    sel.onchange=()=>{cfg[n].voice=sel.value};
    const mk=(lb,key,mn,mx)=>{
      const w=document.createElement('label');w.className='sl';w.append(lb);
      const r=document.createElement('input');r.type='range';r.min=mn;r.max=mx;r.step=0.05;r.value=cfg[n][key];
      r.setAttribute('aria-label',lb+' của '+n);r.oninput=()=>cfg[n][key]=+r.value;
      w.appendChild(r);return w;
    };
    d.append(b,g,sel,mk('Cao độ','pitch',0.5,1.8));box.appendChild(d);
  });
}
function renderLines(){
  const o=$('out');o.innerHTML='';
  lines.forEach((l,i)=>{
    const d=document.createElement('div');d.className='line'+(l.turn&&i>0?' turn':'');d.tabIndex=0;d.setAttribute('role','listitem');
    const b=document.createElement('b');b.textContent=(Object.keys(cfg).length>1&&l.turn)?l.who:'';
    const s=document.createElement('span');s.textContent=l.text;
    d.append(b,s);
    const go=()=>{jump(i)};
    d.onclick=go;d.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}};
    o.appendChild(d);
  });
  hideToggle();
}
function mark(){
  [...$('out').children].forEach((e,i)=>e.classList.toggle('on',i===idx));
  const o=$('out'),el=o.children[idx];
  if(el)o.scrollTo({top:Math.max(0,el.offsetTop-(o.clientHeight-el.offsetHeight)/2),behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'auto':'smooth'});
}
function hideToggle(){[...$('out').children].forEach(e=>e.classList.toggle('hide',$('hid').checked))}

// ---- playback ----
function afterLine(my){
  if(my!==token||!playing)return;
  if(!$('rep').checked)idx++;
  if(idx>=lines.length){playing=false;idx=0;setBtn();mark();if(typeof lsDone==='function')lsDone();return}
  const nx=lines[idx],g=+$('gap').value*(nx&&!nx.turn?0.35:1);
  timer=setTimeout(()=>{if(my===token)speak()},g);
}
function speakSystem(l,my,vo){
  const u=new SpeechSynthesisUtterance(speakText(l.text));
  if(vo&&!vo.online)u.voice=vo;
  u.lang=(u.voice&&u.voice.lang)||(vo&&vo.lang)||'en-US';
  u.rate=Math.min(2,Math.max(0.3,+$('rate').value));u.pitch=effPitch(l.who);
  window._u=u; // tránh bị GC
  u.onend=()=>afterLine(my);
  u.onerror=e=>{if(e.error==='canceled'||e.error==='interrupted')return;$('msg').textContent='Lỗi đọc: '+e.error};
  synth.speak(u);
}
function prefetch(){const n=lines[idx+1];if(!n)return;const vo=voiceFor(n.who);if(vo&&vo.online)onlineAudio(vo,speakText(n.text)).catch(()=>{})}
function speak(){
  if(!playing||!synth)return;
  const my=token,l=lines[idx];if(!l){stop();idx=0;mark();return}
  mark();
  const vo=voiceFor(l.who);
  if(vo&&vo.online){
    onlineAudio(vo,speakText(l.text)).then(url=>{
      if(my!==token||!playing)return;
      const a=new Audio(url);curAudio=a;a.playbackRate=Math.min(2,Math.max(0.5,+$('rate').value));
      a.onended=()=>afterLine(my);
      a.onerror=()=>{if(my===token&&playing)speakSystem(l,my,null)};
      a.play().catch(()=>{if(my===token&&playing)speakSystem(l,my,null)});
      prefetch();
    }).catch(e=>{
      if(my!==token||!playing)return;
      $('msg').textContent='Giọng online lỗi ('+e.message+') — tạm đọc bằng giọng trong máy. Kiểm tra Internet hoặc chọn giọng khác.';
      speakSystem(l,my,null);
    });
    return;
  }
  speakSystem(l,my,vo);
}
function setBtn(){$('play').textContent=playing?'⏸ Tạm dừng':'▶ Phát'}
function halt(){token++;clearTimeout(timer);if(curAudio){try{curAudio.pause()}catch(e){}curAudio=null}if(synth)synth.cancel()}
function stop(){playing=false;halt();setBtn()}
function jump(i){idx=i;mark();if(playing){halt();speak()}else{playing=true;setBtn();halt();speak()}}

$('play').onclick=()=>{
  if(playing){playing=false;halt();setBtn()}
  else{playing=true;setBtn();halt();speak()}
};
$('stop').onclick=()=>{stop();idx=0;mark()};
$('prev').onclick=()=>{idx=Math.max(0,idx-1);mark();if(playing){halt();speak()}};
$('next').onclick=()=>{idx=Math.min(lines.length-1,idx+1);mark();if(playing){halt();speak()}};
$('rate').oninput=e=>$('rv').textContent=(+e.target.value).toFixed(2)+'×';
$('gap').oninput=e=>$('gv').textContent=(e.target.value/1000).toFixed(1)+'s';
$('hid').onchange=hideToggle;
$('build').onclick=build;
$('shuf').onclick=shuffle;
if($('vf'))$('vf').onchange=()=>{Store.set('vfilter',$('vf').value);Object.values(cfg).forEach(c=>{c.voice=''});applyFilter();if(lines.length){renderSpeakers();voiceNote()}};
$('txt').oninput=syncSample;
syncSample();

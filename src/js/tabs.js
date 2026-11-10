/* Thanh tab: 🎧 Nghe · ✍ Viết · 🧩 Ghép câu — mỗi tab có danh sách riêng (nút trên thanh đầu trang) */
const TB={l:'ro',w:'wo',s:'so'};
function tabGo(k){
  if(!TB[k])k='l';
  Object.keys(TB).forEach(t=>{
    const on=t===k,b=$('tab-'+t);
    b.classList.toggle('on',on);b.setAttribute('aria-selected',on);
    $('pg-'+t).hidden=!on;$(TB[t]).hidden=!on;
  });
  rdShow(false);WL.show(false);SL.show(false);PL.show(false);sClose();
  if(k!=='l'&&typeof stop==='function')stop();
  Store.set('tab',k);
}
function allReload(){rdLoad();rdRender();WL.load();wEnsureBuiltin();WL.render();SL.load();sEnsureBuiltin();SL.render();PL.load();xEnsureBuiltin();PL.render();X.hide=!!Store.get('xhide',false);
  // khôi phục bài đang làm dở ở mỗi tab (không cuộn trang)
  if(WL.sel)wShow(WL.sel,true);if(SL.sel)sShow(SL.sel,true);if(PL.sel)xShow(PL.sel,true);
  xMode(Store.get('smode','a'));$('wopen').hidden=!WL.total();sOpenBtns()}
function allClear(){RD.groups=[];RD.sel=null;Store.remove('cur:rd');rdEnsure();rdSave();rdRender();WL.groups=[];WL.sel=null;wEnsureBuiltin();WL.save();WL.render();SL.groups=[];SL.sel=null;sEnsureBuiltin();SL.render();sOpenBtns();PL.groups=[];PL.sel=null;X.sel=null;xEnsureBuiltin();PL.render();$('wlesson').hidden=true;$('sunit').hidden=true;$('xunit').hidden=true}
Object.keys(TB).forEach(t=>{$('tab-'+t).onclick=()=>tabGo(t)});
$('tabs').addEventListener('keydown',e=>{
  const ks=Object.keys(TB),i=ks.findIndex(t=>$('tab-'+t).classList.contains('on'));
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){const n=ks[(i+(e.key==='ArrowRight'?1:ks.length-1))%ks.length];tabGo(n);$('tab-'+n).focus()}
});

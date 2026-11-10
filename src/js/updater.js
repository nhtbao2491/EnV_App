/* Cập nhật app (chỉ có trong bản .exe): hỏi thẳng GitHub xem có bản mới không, tự tải & cài khi đóng app.
 * Nút ở ⚙ Dữ liệu → “Kiểm tra cập nhật”. Nếu bộ tự cập nhật không làm được, vẫn báo bản mới + nút mở trang tải. */
(function(){
  const U=window.appUpdate;if(!U)return;
  const box=$('upd'),t=$('updt'),b=$('updb'),btn=$('ddupd'),ver=$('ddver');
  let manual=false,h=null,latest=null,action=null;
  btn.hidden=false;U.version().then(v=>ver.textContent='Phiên bản hiện tại: '+v);
  const M={checking:'Đang kiểm tra cập nhật...',none:'Bạn đang dùng bản mới nhất.',dev:'Chế độ chạy thử không có cập nhật.',
    portable:'Bản portable không tự thay file được.'};
  const why=m=>{m=String(m||'');
    if(/404|Not Found|Cannot find|latest\.yml|no published versions/i.test(m))return 'Không tìm thấy bản phát hành trên GitHub: repo đang để Private, hoặc Release chưa có file latest.yml.';
    if(/401|403|rate limit|Unauthorized|Forbidden/i.test(m))return 'GitHub từ chối truy cập (repo Private hoặc quá giới hạn). Hãy để repo ở chế độ Public.';
    if(/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ERR_INTERNET|ERR_NAME|net::|getaddrinfo|socket|proxy/i.test(m))return 'Máy không kết nối được tới GitHub (kiểm tra Internet / tường lửa).';
    if(/signature|sha512|checksum/i.test(m))return 'File cập nhật không khớp — hãy tải bộ cài mới nhất thủ công.';
    return 'Lỗi: '+m.slice(0,140)};
  const show=(msg,{btnText='',fn=null,sticky=false}={})=>{
    clearTimeout(h);box.hidden=!msg;t.textContent=msg;action=fn;
    b.hidden=!btnText;b.textContent=btnText;
    if(msg&&!sticky)h=setTimeout(()=>{box.hidden=true},9000);
  };
  b.onclick=()=>{if(action)action()};
  const openPage=()=>latest&&latest.url&&U.open(latest.url);
  // sau khi bộ cập nhật nói "không có / lỗi", đối chiếu với GitHub để báo đúng thực tế
  async function explain(s){
    latest=await U.latest().catch(()=>null);
    if(latest&&latest.ok&&latest.newer){
      show('GitHub có bản '+latest.tag+' (bạn đang dùng '+latest.current+') nhưng app chưa tải được tự động'+(s.s==='error'?' — '+why(s.m):'')+'. Bấm để mở trang tải bộ cài.',{btnText:'Mở trang tải',fn:openPage,sticky:true});
    }else if(s.s==='error'){
      show('Không kiểm tra được cập nhật. '+(latest&&!latest.ok?latest.m+'. ':'')+why(s.m));
    }else if(s.s==='portable'){
      show(latest&&latest.ok?(latest.newer?'Có bản mới '+latest.tag+' (bạn đang dùng '+latest.current+'). Bản portable cần tải lại file .exe mới.':'Bạn đang dùng bản mới nhất ('+latest.current+').'):M.portable,
        latest&&latest.ok&&latest.newer?{btnText:'Mở trang tải',fn:openPage,sticky:true}:{});
    }else show(latest&&latest.ok?'Bạn đang dùng bản mới nhất ('+latest.current+', GitHub: '+latest.tag+').':M.none);
  }
  btn.onclick=()=>{manual=true;show(M.checking,{sticky:true});U.check()};
  U.onStatus(s=>{
    if(s.s==='available')return show('Có bản '+s.v+', đang tải...',{sticky:true});
    if(s.s==='progress')return show('Đang tải bản cập nhật '+s.p+'%',{sticky:true});
    if(s.s==='ready')return show('Đã tải xong bản '+s.v+'. Cập nhật sẽ tự cài khi bạn đóng app, hoặc bấm khởi động lại ngay.',{btnText:'Khởi động lại ngay',fn:()=>U.install(),sticky:true});
    if(s.s==='checking')return manual?show(M.checking,{sticky:true}):0;
    if(s.s==='dev')return manual?show(M.dev):0;
    // none / error / portable: chỉ báo khi người dùng chủ động bấm; lỗi lúc tự kiểm tra thì im lặng
    // trừ khi GitHub thật sự có bản mới
    if(manual||s.s==='none'||s.s==='error'||s.s==='portable'){
      if(manual){manual=false;explain(s)}
      else U.latest().then(r=>{latest=r;if(r&&r.ok&&r.newer)show('GitHub có bản mới '+r.tag+' (bạn đang dùng '+r.current+').',{btnText:'Mở trang tải',fn:openPage,sticky:true})}).catch(()=>{});
    }
  });
})();

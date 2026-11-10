/* Nghe: chỉ còn prompt nhờ AI tạo file bài nghe (không còn khung mẫu / nút tải) */
const GP2=`Hãy tạo [10] bài đọc tiếng Anh trình độ [B1] về các chủ đề: [liệt kê chủ đề]. Mỗi bài khoảng [150–200] từ, gồm [3–5] đoạn. Xuất ra file Word (.docx); nếu không tạo được file thì xuất văn bản thuần đúng theo khung dưới đây.

Khung bắt buộc cho MỖI bài, đúng thứ tự:
Reading 01 — Tên bài đọc      (dòng tiêu đề, chữ lớn và in đậm; đánh số 01, 02, 03...)
Reading                        (một dòng riêng, chỉ có đúng chữ này)
Tên bài đọc                    (một dòng tiêu đề của bài)
Đoạn 1                         (mỗi đoạn là một đoạn văn riêng)
Đoạn 2
...
---                            (dòng ngăn cách ở cuối mỗi bài)

Quy tắc:
- Nội dung bài đọc viết bằng tiếng Anh, văn bản thường, không in đậm từ trong đoạn, không bảng, không ảnh, không ghi chú chen giữa các đoạn.
- Nếu là bài hội thoại giữa 2 người: mỗi lượt nói một dòng, dạng  Tên: lời thoại  (tên ngắn gọn, nhất quán, không dùng dấu hai chấm trong lời thoại, không chú thích trong ngoặc).
- Không thêm phần nào khác (từ vựng, câu hỏi, dịch nghĩa) vào giữa bài. Nếu cần, đặt ở cuối file bằng tiếng Việt.`;
async function copyEl(id,name,mid){
  const t=$(id);let ok=false;
  try{await navigator.clipboard.writeText(t.value);ok=true}catch(e){t.focus();t.select();try{ok=document.execCommand('copy')}catch(_){}}
  $(mid).textContent=ok?'Đã sao chép '+name+'.':'Không sao chép tự động được — hãy bôi đen và nhấn Ctrl+C.';
}
function gClose(){}
(function(){$('gP2').value=GP2;$('gc2').onclick=()=>copyEl('gP2','prompt','fmsg')})();

# EnV — bộ khung ứng dụng

Một mã nguồn dùng cho **máy tính (.exe)** và **điện thoại (web/PWA)**.

## 3 tab luyện tập (v1.1)

| Tab | Việc làm | Nguồn dữ liệu |
|---|---|---|
| 🎧 Nghe | Nghe transcript; danh sách có dấu **✓ đã nghe / ○ chưa nghe** (tự đánh dấu khi nghe hết bài, hoặc bấm vòng tròn để đánh dấu tay; mỗi thư mục có bộ đếm x/y) | .docx / .pdf theo khung "Reading" |
| ✍ Viết | Mỗi lần một bài: tên bài, Trình độ, Tiếng Việt, Từ gợi ý, ô gõ tiếng Anh, nút **Chấm điểm** (so với phần "Tiếng Anh" trong file) | file theo khung Viết — xem `samples/mau-khung-bai-viet.docx` và hộp "Khung file mẫu & prompt" trong tab |
| 🧩 Ghép câu | Danh sách: tài liệu → chủ đề/unit → bấm để hiện cả bài (câu Việt + các từ cần ráp + dòng làm bài) | **Excel (.xlsx)** 5 cột: Chủ đề · STT · Tiếng Việt · Tiếng Anh bị xáo trộn · Đáp án — xem `samples/mau-khung-ghep-cau.xlsx`; vẫn đọc được PDF/DOCX dạng "UNIT n · …" |

Khung Viết: `Bài 01: Tên bài` / `Trình độ: B1` / `Tiếng Việt:` + đoạn văn / `Từ gợi ý: từ (nghĩa) · từ (nghĩa)` / `Tiếng Anh:` + đáp án / `---`.
Chấm điểm Viết: so từ với đáp án (không phân biệt hoa/thường, bỏ dấu câu). Ghép câu: chấm khi file có dòng `→ đáp án`; file không có đáp án thì chỉ luyện và tự đánh dấu "đã xong unit".
Dữ liệu mới lưu ở khóa `wrData` (Viết) và `spData` (Ghép câu), nằm chung trong file sao lưu của ⚙ Dữ liệu.

## Cập nhật: xem trước, tạo mới, xem kết quả
- **Danh sách mở đúng chỗ đang làm**: mở danh sách là tự bung thư mục chứa bài đang làm, cuộn tới đúng dòng và gắn nhãn “● Đang làm”. Vị trí được nhớ cả khi tắt/mở lại app (khóa `cur:*` trong Store).
- **Xem trước khi thêm** (`js/import.js` → `impAsk`): tải file (Nghe / Viết / Ráp từ / Viết câu) sẽ hiện bảng xem trước — tick chọn từng bài, xem nội dung, xem cảnh báo, chọn thư mục đích — rồi mới thêm vào danh sách.
- **Tạo mới / sửa nội dung bằng tay** ở cả Viết, Ráp từ, Viết câu: nút “＋ Tạo … mới” (trang chính và đầu ngăn kéo), nút “＋” cạnh mỗi thư mục tự tạo, nút “📝” sửa từng bài. Dòng gõ tay: `Câu Việt | các từ / cách / nhau | đáp án` (Ráp từ, bỏ cột từ thì app tự xáo) và `Câu Việt | gợi ý; gợi ý | đáp án` (Viết câu).
- **Viết câu** có thêm tải file (Excel/Word/PDF/txt), khung mẫu & prompt AI.
- **Kiểm tra đáp án → chế độ xem kết quả** (chỉ đọc): ô làm bài ẩn đi, bấm “✎ Chỉnh sửa bài làm” (hoặc ✎ ở từng câu) để sửa. Bài chưa có đáp án vẫn “Hoàn tất & xem lại” được, và có thể dán đáp án / bản AI đã sửa (`1. câu đúng`) để app chấm.
- **💾 Lưu bài làm**: lưu vào app (kèm giờ lưu) và tải thêm một file .txt.

## Bộ ghép câu có sẵn

`src/js/builtin.js` chứa bộ **Ráp câu tiếng Anh — 1500 mẫu câu thông dụng** lấy từ file PDF (5 chủ đề, 50 unit, 1500 câu, có đáp án). Bộ này luôn nằm trong danh sách bài ghép câu (5 thư mục theo chủ đề, không xóa/đổi tên được; tiến độ làm bài vẫn được lưu). Muốn đổi nội dung: sửa `builtin.js` rồi tăng `ver`.

## Ghép câu loại 2 — Viết câu

`src/js/builtin2.js` chứa bộ **1.500 câu phản xạ tiếng Anh – tiếng Việt (A1 → B2)**: 5 nhóm, 40 unit, mỗi câu có câu tiếng Việt + gợi ý từ (từ · loại từ · nghĩa). Tài liệu gốc không có đáp án nên app không chấm tự động; người học tự viết, có nút ẩn gợi ý, sao chép bài làm (để nhờ AI sửa) và đánh dấu đã xong unit. Logic nằm ở `src/js/phanxa.js`. Trong tab Ghép câu, chuyển giữa loại 1 (Ráp từ) và loại 2 (Viết câu) ở thanh trên cùng.

## Cấu trúc thư mục

```
listening-app/
├─ package.json          cấu hình + lệnh build (Electron, electron-builder)
├─ BUILD-EXE.bat         bấm đúp để đóng gói .exe (Windows)
├─ RUN-DEV.bat           bấm đúp để chạy thử, chưa đóng gói
├─ electron/             phần vỏ desktop
│  ├─ main.js            tạo cửa sổ, nhận lệnh lưu/đọc dữ liệu
│  ├─ preload.js         cầu nối an toàn giữa giao diện và máy
│  └─ store.js           ghi dữ liệu ra file JSON (có .bak, ghi nguyên tử)
├─ src/                  toàn bộ giao diện (dùng chung desktop + điện thoại)
│  ├─ index.html
│  ├─ css/ app.css (giao diện gốc) · layout.css (responsive) · data.css
│  ├─ js/  storage.js  lớp lưu trữ Store (dùng chung mọi nền tảng)
│  │       player.js   tách câu, giọng đọc, phát/dừng
│  │       reader.js   đọc file .docx/.pdf
│  │       library.js  thư mục + danh sách bài nghe
│  │       guides.js   khung mẫu & prompt cho AI (tab Nghe)
│       parsers.js  phân tích file Viết / Ghép câu + chấm điểm
│       lib2.js     danh sách thư mục → mục dùng chung (Viết, Ghép câu)
│       writing.js  tab Viết   ·  sentences.js  tab Ghép câu  ·  tabs.js  thanh tab
│  │       data.js     hộp thoại "⚙ Dữ liệu"
│  │       app.js      khởi động, nhớ cài đặt
│  ├─ vendor/            jszip, pdf.js (tự chép khi npm install)
│  ├─ assets/            icon PWA
│  ├─ manifest.webmanifest, sw.js   để cài lên màn hình chính điện thoại
└─ build/icon.ico        icon của file .exe
```

## Lưu trữ cục bộ

Mọi dữ liệu đi qua `Store` (`src/js/storage.js`):

| Nền tảng | Nơi lưu |
|---|---|
| .exe | `%APPDATA%\EnV\data\library.json` (+ `.bak`) |
| Web / điện thoại | localStorage của trình duyệt |

- Tự lưu mỗi khi tải file, thêm bài, đổi tên, xóa; cũng nhớ tốc độ, nghỉ giữa câu và bản nháp transcript.
- Nút **⚙ Dữ liệu**: xem dung lượng, xuất/nhập sao lưu `.json`, mở thư mục dữ liệu, xóa toàn bộ (bấm 2 lần để xác nhận).
- Xóa từng bài/thư mục: dùng nút 🗑 trong danh sách bài nghe như cũ.
- Dữ liệu từ bản HTML đơn lẻ cũ (khóa `rdData`) tự được chuyển sang khi mở lần đầu trên cùng trình duyệt.
- Thêm dữ liệu mới cho tính năng sau này: `Store.set('tenKhoa', giaTri)` / `Store.get('tenKhoa', macDinh)`.

## Đóng gói thành phần mềm (.exe cài đặt)

1. Cài Node.js LTS: https://nodejs.org
2. Trong thư mục dự án: `npm install` rồi `npm run dist` (hoặc bấm đúp `BUILD-EXE.bat`).
3. Kết quả: `dist\EnV-Setup-1.0.0.exe` — bấm đúp để cài. Bộ cài tự tạo **shortcut "EnV" ngoài Desktop** và trong Start Menu, cài vào `%LOCALAPPDATA%\Programs` (không cần quyền admin).
4. Gỡ cài đặt: Settings → Apps. Dữ liệu bài nghe được giữ lại khi gỡ.
5. Cần bản chạy thẳng không cài: `npm run dist:portable` → `dist\EnV-Portable-1.0.0.exe`.

Lần đầu build trên Windows nếu gặp lỗi "Cannot create symbolic link": bật Settings → For developers → Developer Mode rồi build lại.

Icon: `build/icon.ico` (cho .exe/shortcut) và `src/assets/icon-*.png` (cho web/điện thoại). Thay logo = thay các file này rồi build lại.

## Dùng trên điện thoại

- Thử nhanh: `npm run serve`, mở `http://<IP máy tính>:8080` trên điện thoại cùng Wi‑Fi.
- Dùng thật: đưa thư mục `src/` lên một hosting HTTPS tĩnh (GitHub Pages, Netlify, Cloudflare Pages…), mở bằng Chrome/Safari rồi chọn **Thêm vào màn hình chính** — chạy offline được nhờ `sw.js`.
- Muốn thử giao diện điện thoại ngay trên desktop: kéo hẹp cửa sổ app (cho phép đến 360 px).

## Giao diện responsive

- Dưới 560 px (điện thoại): 1 cột, danh sách bài nghe là ngăn kéo toàn màn hình, nút to hơn khi cảm ứng.
- 700–1099 px (máy tính bảng): 1 cột rộng hơn.
- Từ 1100 px (máy tính): danh sách bài nghe dính cố định bên trái, nội dung bên phải.

## Lưu ý

- Giọng "Natural" của Microsoft Edge là giọng online, **không** có trong cửa sổ Electron; bản .exe dùng giọng đã cài trong Windows (Settings → Time & language → Speech). Muốn giọng tự nhiên hơn, cài thêm voice pack tiếng Anh.
- Font Atkinson Hyperlegible không còn tải từ Internet; app dùng Segoe UI / font hệ thống. Muốn giữ font cũ: tải file font vào `src/assets/` rồi khai báo `@font-face` trong `layout.css`.
- Không có CDN nào còn lại: đọc .docx/.pdf chạy hoàn toàn offline.

## Bản cài EnV & tự cập nhật

- Shortcut ngoài Desktop tên **EnV**; bộ cài: `dist\EnV-Setup-<version>.exe`.
- Cập nhật dùng GitHub Releases: đẩy code lên GitHub rồi chạy `UPDATE-GITHUB.bat` và nhập số phiên bản mới — GitHub Actions (`.github/workflows/release.yml`) tự build và đăng `.exe` lên Releases. Không cần điền owner: electron-builder lấy từ git remote. App đã cài sẽ tự tải bản mới (hoặc bấm ⚙ Dữ liệu → Kiểm tra cập nhật).
- Chỉ bản **cài đặt** mới tự cập nhật; bản portable thì không.

## Nơi lưu dữ liệu

Bản đã cài: dữ liệu nằm trong `EnV-Data` **bên trong thư mục cài đặt** (cài ở `D:\EnV` thì dữ liệu ở `D:\EnV\EnV-Data`). Vì gỡ cài đặt/cập nhật có thể xóa thư mục cài đặt, app luôn giữ thêm 1 bản sao lưu `library.json` trong `%APPDATA%\Listening Transcript\mirror` và tự khôi phục khi cần.

## Đẩy lên GitHub & cập nhật về sau

1. Tạo repo trống trên github.com (tên gợi ý `listening-app`), copy link `.git`.
2. Lần đầu: bấm đúp `PUSH-GITHUB.bat`, dán link repo.
3. Mỗi lần sửa code: bấm đúp `UPDATE-GITHUB.bat` → nhập nội dung thay đổi. Muốn ra bản `.exe` mới thì nhập thêm số phiên bản (vd `1.0.1`); GitHub tự build, khoảng vài phút sau file nằm ở tab **Releases**.
4. Bản đã cài tự tải bản mới khi mở app (bản portable thì tải tay).
5. Bản điện thoại (PWA): bật GitHub Pages cho thư mục `src/` hoặc dùng Netlify/Cloudflare Pages.


## Cập nhật v1.2 — khung thống nhất, chấm điểm chuẩn, giọng đọc, lưu cứng
- **Chấm điểm dùng chung** (`parsers.js`: `ptok`, `gradeOne`, `checkSentence`) cho Viết · Ráp từ · Viết câu: so TỪ và THỨ TỰ TỪ, không phân biệt hoa/thường. Dấu câu đi liền sau từ đứng trước nó; thiếu/thừa dấu phẩy, dấu cuối câu, quên viết hoa chỉ hiện “lưu ý nhỏ”, KHÔNG bị tính sai. Câu gần đúng được điểm theo % giống đáp án.
- **Ráp từ**: dấu phẩy / hai chấm / chấm phẩy gắn liền với từ đứng trước ngay trong ô chữ (“hello,”). Bộ 1500 câu đã được sửa (`builtin.js` ver 3); file tải lên tự được chỉnh (`fixChips`).
- **Viết câu** có sẵn đáp án cho cả 1500 câu (`builtin2.js` ver 2, lấy từ file “1500 câu phản xạ có đáp án”) nên chấm tự động.
- **Khung thống nhất**: Ráp từ và Viết câu cùng Excel 5 cột (Chủ đề · STT · Tiếng Việt · Từ xáo trộn / Gợi ý · Đáp án) — `assets/mau-khung-ghep-cau.xlsx`, `assets/mau-khung-viet-cau.xlsx`; Viết dùng Word `assets/mau-khung-bai-viet.docx`. Cột/phần Đáp án là bắt buộc: mục thiếu đáp án bị bỏ chọn sẵn ở bảng xem trước.
- **Bài mẫu có sẵn** ở mọi tab (Nghe: “Bài nghe mẫu”, Viết: “Bài viết mẫu”, 2 loại Ghép câu) nằm cố định trong danh sách, không xóa/đổi tên được; chỉ mục tự thêm mới xóa được. Đã bỏ nút “Dùng bài mẫu”.
- **Giọng đọc**: lấy tất cả giọng tiếng Anh của thiết bị, giọng tự nhiên (★) xếp trước, lọc theo vùng (Mỹ, Anh, Úc, Ấn…); bỏ ô “Tốc độ” riêng của từng người nói (chỉ còn một thanh Tốc độ chung).
- **Lưu cứng**: bản .exe lưu thêm file gốc đã tải lên vào `EnV-Data/uploads/<tab>/` cạnh `library.json` (cùng thư mục dữ liệu, đi theo khi “Đổi nơi lưu”).

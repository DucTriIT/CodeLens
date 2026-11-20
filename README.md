# CodeLens

Xưởng clip giải thích công nghệ cho developer Việt Nam. Claude viết kịch bản (từ chủ đề hoặc từ bài viết bạn đã research), bạn chỉnh sửa, rồi trình duyệt render clip motion graphics 2D dọc 9:16 (1080×1920, 30 fps) ra file MP4, dài tối đa khoảng 2 phút.

Có hai cách dùng:

| | Trên claude.ai (artifact) | Chạy trên máy (repo này) |
|---|---|---|
| Gọi Claude bằng | Tài khoản claude.ai (subscription) | **API key** của bạn |
| Lưu kịch bản, clip | Bộ nhớ của artifact | Thư mục `data/` trên máy |
| Viết kịch bản theo lịch | Tác vụ Claude theo lịch, lúc 6:47 sáng | Vào giờ render, khi trang đang mở |
| Giới hạn mỗi clip | 20 MB (clip dài bị nén mạnh hơn) | Không giới hạn, luôn ở 5 Mbps |
| Giọng đọc thuyết minh | Không có (chỉ lưu lời thuyết minh) | Giọng nam tiếng Việt miễn phí |

## Chạy trên máy

Cần [Node.js](https://nodejs.org) 20 trở lên và Chrome hoặc Edge bản mới.

1. Cài thư viện:

   ```bash
   npm install
   ```

2. Tạo file `.env` từ file mẫu, rồi điền API key (lấy ở https://platform.claude.com):

   ```bash
   cp .env.example .env
   ```

   Trên Windows (PowerShell): `Copy-Item .env.example .env`. Mở `.env` và điền vào dòng `ANTHROPIC_API_KEY=`.

3. Chạy server:

   ```bash
   npm start
   ```

4. Mở http://127.0.0.1:5173 bằng Chrome hoặc Edge.

Mỗi lần gọi Claude, cửa sổ chạy server in ra model và số token đầu vào, đầu ra, để bạn theo dõi chi phí.

## Cấu hình (`.env`)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `ANTHROPIC_API_KEY` | (trống) | API key. Thiếu key thì các nút AI báo lỗi, phần còn lại vẫn dùng được. |
| `CODELENS_MODEL` | `claude-opus-5-5` | Model dùng để viết và kiểm tra kịch bản. Đổi sang `claude-sonnet-5-5` cho rẻ hơn. |
| `PORT` | `5173` | Cổng của server. |
| `HOST` | `127.0.0.1` | Chỉ máy bạn truy cập được. Đặt `0.0.0.0` nếu muốn mở cho máy khác trong mạng LAN; khi đó ai vào được trang cũng dùng được API key của bạn. |
| `CODELENS_DATA_DIR` | `data` | Nơi lưu kịch bản (`data/db/`), clip (`data/assets/`) và giọng đọc đã tạo (`data/tts/`). |
| `CODELENS_TTS_VOICE` | `vi-VN-NamMinhNeural` | Giọng mặc định: `vi-VN-NamMinhNeural` (nam) hoặc `vi-VN-HoaiMyNeural` (nữ). Chọn được trong tab Lịch & logo. |

## Cấu trúc kịch bản

Mỗi kịch bản có ba phần, ghi ở ô **Phần** của từng cảnh:

1. **Mở bài** (2 cảnh): câu hook, rồi giới thiệu clip sẽ nói về những gì ("Trong clip này, mình sẽ…").
2. **Thân bài:** giải thích từng bước, đi đúng các ý đã hứa ở mở bài.
3. **Kết bài:** tóm tắt ý chính và một câu chốt hoặc mẹo nhớ.

Cuối mọi clip, CodeLens tự thêm **cảnh kêu gọi follow**: logo lớn, nút "Theo dõi" được bấm, kèm lời đọc. Đổi chữ hoặc tắt cảnh này ở tab **Lịch & logo → Cảnh kết**. Trình soạn hiện số cảnh của mỗi phần và báo khi kịch bản thiếu phần nào.

### Tiêu chí chất lượng

AI viết và AI kiểm tra kỹ thuật đều theo các tiêu chí sau. Giọng kể như một Senior Developer giải thích cho một Junior: đặt vấn đề, dẫn dắt, giải thích vì sao, rồi mới tới cách triển khai.

| Tiêu chí | Quy tắc |
|---|---|
| Hook | Bắt đầu bằng một vấn đề thực tế |
| Mở bài | Nói rõ người xem sẽ học được gì |
| Thuật ngữ | Giải thích bằng một câu đơn giản trước khi dùng |
| Ví dụ | Một ví dụ cụ thể xuyên suốt clip |
| Hình | Mỗi cảnh một ý chính; bảng hoặc danh sách tối đa 4 mục |
| Lời đọc | Giải thích thêm, không đọc lại nguyên văn phụ đề |
| Độ sâu | Người mới hiểu được, dev có kinh nghiệm vẫn học thêm |
| Kết bài | Một thông điệp chính, kèm giới hạn của giải pháp |

### Series nhiều phần

CodeLens ưu tiên chất lượng hơn độ ngắn. Khi viết từ chủ đề hoặc từ bài viết, AI lên kế hoạch trước. Nếu một clip khoảng 2 phút không đủ để giải thích kỹ, AI chia thành series (tối đa 4 phần) và viết từng phần, các phần dùng chung một ví dụ và không lặp ý.

- Mỗi phần có nhãn **PHẦN 1/3** ở góc trên.
- Cảnh cuối của các phần chưa phải phần cuối đổi thành **"ĐÓN XEM PHẦN 2"**, đọc lời giới thiệu phần sau. Sửa lời này trong trình soạn, ô "Lời giới thiệu phần…".
- Phần cuối kết bằng cảnh follow như thường.

Ví dụ có sẵn: series **Outbox Pattern** gồm 3 phần: lỗi dual write, cách outbox hoạt động, gửi trùng và thứ tự event.

## Giọng đọc (thuyết minh)

Mỗi cảnh có hai lớp chữ:

- **Phụ đề:** câu nhấn mạnh ngắn, hiện trên màn hình.
- **Lời thuyết minh:** đoạn giải thích kỹ hơn, được đọc thành tiếng bằng giọng nam tiếng Việt. Cảnh tự kéo dài theo độ dài giọng đọc, đọc xong mới chuyển cảnh. Nhạc nền tự nhỏ lại khi có tiếng nói.

Giọng đọc dùng giọng neural tiếng Việt miễn phí của tính năng Read Aloud trong Microsoft Edge, qua thư viện [`msedge-tts`](https://www.npmjs.com/package/msedge-tts). Không cần key, nhưng cần Internet. Mỗi đoạn đọc được lưu lại trong `data/tts/`, lần sau dùng lại không phải tạo nữa.

Cần biết trước khi dùng cho kênh:

- Đây là dịch vụ không chính thức. Microsoft không công bố nó như một API công khai, nên có thể đổi hoặc ngừng bất cứ lúc nào, và điều khoản dùng cho mục đích thương mại (kênh có kiếm tiền) chưa rõ ràng.
- Muốn chắc chắn về bản quyền giọng đọc, dùng dịch vụ có giấy phép: Azure AI Speech (cùng giọng NamMinh, có gói miễn phí hằng tháng), FPT.AI hoặc Viettel AI.

Trong trình soạn:

- **▶ Nghe:** nghe thử lời thuyết minh của từng cảnh.
- **Khớp thời lượng với giọng đọc:** tạo giọng đọc cho cả clip và chỉnh độ dài từng cảnh cho khớp, để phần xem trước đúng nhịp. Khi render, bước này cũng tự chạy.
- **AI viết lời thuyết minh:** thêm lời thuyết minh cho kịch bản cũ chưa có.

## Chia sẻ Facebook

Mỗi clip trong Thư viện (và trong Hàng đợi khi render xong) có nút **Chia sẻ Facebook**. Hộp chia sẻ gồm:

- **Caption:** soạn sẵn từ kịch bản (tiêu đề, câu mở đầu, các ý chính, hashtag). Bấm **AI viết caption** để Claude viết lại cho hấp dẫn hơn, rồi bấm **Sao chép caption**.
- **Đăng thẳng lên Fanpage:** chỉ có ở bản chạy trên máy, khi `.env` có `FB_PAGE_ID` và `FB_PAGE_TOKEN`. Video được tải lên Fanpage kèm caption, công khai ngay; trang hỏi bấm hai lần để tránh đăng nhầm.
- **Chia sẻ qua ứng dụng:** hiện khi trình duyệt hỗ trợ chia sẻ file (điện thoại, Windows), để chọn ứng dụng Facebook.
- **Tự đăng trên Facebook:** tải video, sao chép caption, mở facebook.com, rồi tạo bài viết hoặc Reel. Dùng cách này cho **trang cá nhân**.

Facebook không cho phần mềm tự đăng lên trang cá nhân; API chỉ đăng được lên Fanpage.

Lấy `FB_PAGE_ID` và `FB_PAGE_TOKEN`:

1. Tạo một app tại https://developers.facebook.com (loại Business).
2. Mở Graph API Explorer, chọn app vừa tạo, cấp quyền `pages_show_list`, `pages_read_engagement`, `pages_manage_posts`, rồi bấm Generate Access Token.
3. Gọi `me/accounts`. Kết quả liệt kê các Fanpage bạn quản trị, kèm `id` (đây là `FB_PAGE_ID`) và `access_token` (đây là `FB_PAGE_TOKEN`).
4. Token lấy từ Explorer thường hết hạn sau vài giờ. Đổi sang token dài hạn bằng Access Token Debugger (nút Extend), rồi gọi lại `me/accounts` để lấy Page token không hết hạn.

Token này đăng được lên Fanpage của bạn: giữ bí mật như mật khẩu, chỉ để trong `.env`.

Kịch bản viết trên bản claude.ai chuyển sang bản trên máy được: bấm **Xuất kịch bản (.json)** ở bản claude.ai, rồi bấm **Nhập kịch bản** ở bản trên máy.

## Chọn model AI

Tab **Lịch & logo → Model AI** cho chọn model riêng cho từng việc. Áp dụng cho cả bản claude.ai lẫn bản trên máy.

| Việc | Gợi ý tiết kiệm | Vì sao |
|---|---|---|
| Gợi ý chủ đề, caption Facebook | Claude Haiku 5.5 | Việc ngắn, sai sót ít hậu quả |
| Viết kịch bản và lời thuyết minh | Claude Sonnet 5.5 | Cần văn tiếng Việt tốt và đúng kỹ thuật |
| Kiểm tra kỹ thuật | Claude Opus 5.5 | Lớp chốt chặn cuối cho độ chính xác |

Bấm **Dùng gợi ý tiết kiệm** để chọn nhanh bộ trên. Để "Mặc định" thì bản trên máy dùng `CODELENS_MODEL`, còn claude.ai tự chọn.

Giá API (USD cho mỗi 1 triệu token, đầu vào / đầu ra): Haiku 5.5 $0.10 / $0.50, Sonnet 5.5 $2 / $10, Opus 5.5 $4 / $20. Bản claude.ai không tính tiền theo token mà tính vào hạn mức gói của bạn.

Trên bản chạy trên máy, Haiku 5.5 không có fallback phía server: nếu Haiku từ chối một yêu cầu vì chính sách an toàn, nút AI sẽ báo lỗi thay vì tự chuyển sang model khác.

## Bảo mật API key

- Key chỉ nằm trong `.env` và trong server Node. Trình duyệt không bao giờ thấy key.
- `.env` và `data/` đã có trong `.gitignore`. Đừng commit file `.env`.
- Mặc định server chỉ nghe ở `127.0.0.1`, máy khác không gọi được.

## Cấu trúc

- `server.js`: phục vụ trang, lưu dữ liệu vào `data/`, gọi Claude bằng SDK `@anthropic-ai/sdk`. Có bật fallback phía server (`fallbacks: "default"`): nếu model từ chối vì chính sách an toàn, API tự chạy lại yêu cầu trên một model dự phòng trong cùng lần gọi.
- `public/codelens.html`: toàn bộ ứng dụng, dùng chung cho cả bản claude.ai.
- `public/local-adapter.js`: nối trang với server trên máy, thay cho các tính năng của claude.ai (bộ nhớ, AI, file, tải về).

Mỗi kịch bản AI viết sẽ gọi Claude hai lần: một lần để viết, một lần để kiểm tra độ chính xác kỹ thuật (với kịch bản tạo từ bài viết, lần này đối chiếu với bài). Mức độ suy nghĩ (effort): gợi ý chủ đề và viết kịch bản dùng `medium`; tạo từ bài viết và kiểm tra kỹ thuật dùng `high`.

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

### Giọng văn tự nhiên

Lời thuyết minh phải nghe như một kỹ sư người Việt đang nói chuyện với đồng nghiệp, không như ghi chú hay văn dịch. Quy tắc của AI có:

- Bộ hướng dẫn giọng văn: xưng "mình", gọi người xem là "bạn"; câu đầy đủ, có từ nối (thì, mà, thế là…); không câu cụt, không văn dịch từ tiếng Anh; phụ đề không chứa nguyên câu lệnh code.
- Ví dụ câu cứng và câu tự nhiên tương ứng để AI bắt chước.
- Lời đọc mỗi cảnh dài khoảng 80–250 ký tự, tổng tối đa 1.500 ký tự. Để vừa 2 phút, AI bớt cảnh chứ không nén câu.
- Giọng đọc mặc định nhanh hơn 10% (đổi ở tab Lịch & logo → Giọng đọc).

Sau bước kiểm tra kỹ thuật, AI chạy thêm bước **biên tập giọng văn**: đóng vai biên tập viên tiếng Việt, chỉ viết lại tiêu đề, phụ đề và lời đọc cho tự nhiên, không đổi nội dung kỹ thuật. Kịch bản cũ thì bấm nút **AI biên tập giọng văn** trong trình soạn.

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

### Nguồn giọng đọc: Azure AI Speech (nên dùng)

Azure AI Speech là dịch vụ chính thức của Microsoft, có cùng giọng `vi-VN-NamMinhNeural`. Gói **Free (F0)** cho khoảng 500.000 ký tự giọng neural mỗi tháng, tương đương khoảng 300 clip 2 phút. Kiểm tra lại hạn mức trên trang giá của Azure, vì Microsoft có thể thay đổi.

Cách lấy key:

1. Đăng ký tài khoản tại https://azure.microsoft.com/free. Azure có thể yêu cầu thẻ để xác minh; gói F0 không tự trừ tiền.
2. Vào https://portal.azure.com → **Create a resource** → tìm **Speech** → **Create**.
3. Chọn **Region** gần bạn, ví dụ **Southeast Asia**, và **Pricing tier: Free F0**. Mỗi subscription chỉ được một tài nguyên F0.
4. Tạo xong, mở tài nguyên → **Keys and Endpoint**. Copy **KEY 1** và **Location/Region** (ví dụ `southeastasia`).
5. Điền vào `.env` rồi khởi động lại server:

   ```
   AZURE_SPEECH_KEY=<KEY 1>
   AZURE_SPEECH_REGION=southeastasia
   ```

Khi server khởi động, dòng `Voice: Azure AI Speech (southeastasia), Edge as fallback` cho biết đã nhận key. Tab **Lịch & logo → Giọng đọc** hiện số ký tự Azure đã dùng trong tháng. Bộ đếm chỉ tính các câu Azure tạo ra trên máy này; số chính xác xem trong Azure portal.

- Mặc định (`CODELENS_TTS_PROVIDER=auto`), nếu Azure lỗi (hết hạn mức, sai key, mất mạng) thì câu đó tự dùng Edge, để render không bị dừng.
- Đặt `CODELENS_TTS_PROVIDER=azure` nếu chỉ muốn dùng Azure, hoặc `edge` nếu muốn tắt Azure.
- Câu nào đã tạo giọng thì được lưu trong `data/tts/` và dùng lại, không tốn thêm ký tự.

### Nguồn giọng đọc dự phòng: Microsoft Edge

Khi chưa có key Azure, giọng đọc dùng giọng neural tiếng Việt miễn phí của tính năng Read Aloud trong Microsoft Edge, qua thư viện [`msedge-tts`](https://www.npmjs.com/package/msedge-tts). Không cần key, nhưng cần Internet. Mỗi đoạn đọc được lưu lại trong `data/tts/`, lần sau dùng lại không phải tạo nữa.

Cần biết trước khi dùng cho kênh:

- Đây là dịch vụ không chính thức. Microsoft không công bố nó như một API công khai, nên có thể đổi hoặc ngừng bất cứ lúc nào, và điều khoản dùng cho mục đích thương mại (kênh có kiếm tiền) chưa rõ ràng.
- Muốn chắc chắn về bản quyền giọng đọc, dùng dịch vụ có giấy phép: Azure AI Speech (cùng giọng NamMinh, có gói miễn phí hằng tháng), FPT.AI hoặc Viettel AI.

### Cách đọc từ tiếng Anh

Giọng tiếng Việt đọc từ tiếng Anh theo kiểu tiếng Việt ("cache", "Kafka" nghe rất lạ). Tab **Lịch & logo → Giọng đọc → Cách đọc từ tiếng Anh** là một từ điển, mỗi dòng `từ = cách đọc` (ví dụ `cache = két`, `server = sơ vơ`). Trước khi gửi đi tạo giọng, CodeLens thay các từ này bằng cách đọc; phụ đề và lời thuyết minh trên màn hình vẫn giữ chữ gốc.

- Có sẵn khoảng 30 từ phổ biến; sửa, thêm, rồi bấm **▶ Nghe câu này** để thử trước khi lưu.
- **AI gợi ý từ kịch bản đang mở** tìm các từ tiếng Anh chưa có trong từ điển và đề xuất cách đọc.
- Sửa từ điển chỉ làm các câu có từ đó phải tạo lại giọng; các câu khác vẫn dùng bản đã lưu.

### Phụ đề trên video

Facebook Reels không hỗ trợ tải phụ đề hay tự tạo phụ đề, nên CodeLens in lời thuyết minh thẳng vào video (bật/tắt ở **Lịch & logo → Phụ đề trên video**, mặc định bật). Lời thuyết minh chạy trong ô dưới cùng, mỗi lần một câu, khớp với giọng đọc; câu nhấn mạnh của cảnh chuyển lên dưới tiêu đề.

Nếu render báo "Không tạo được giọng đọc":

- **"Dịch vụ giọng đọc tạm thời từ chối":** dịch vụ miễn phí đôi khi cắt kết nối khi nhận nhiều yêu cầu liên tiếp. Server đã tự thử lại 5 lần. Nếu vẫn lỗi, chờ vài phút rồi bấm **Thử lại** trong Hàng đợi; các cảnh đã có giọng đọc được giữ lại, không phải tạo lại.
- **"Không kết nối được dịch vụ giọng đọc":** máy không ra được Internet, hoặc tường lửa/proxy chặn `speech.platform.bing.com`.
- Cửa sổ server in các dòng `[tts] …` cho biết lần thử nào lỗi và vì sao.

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

- **Phụ đề và transcript:** nút **Tải phụ đề + transcript (.zip)** tải một gói gồm `captions.vi_VN.srt` và `transcript.txt`. Khi đăng Reel, tải file `.srt` lên mục **Closed captions** và file `.txt` lên mục **Text transcripts**. Nội dung là lời thuyết minh (cảnh chưa có lời thuyết minh thì dùng phụ đề), mỗi câu một đoạn, tối đa 2 dòng. Mốc thời gian được ghi lúc render nên khớp với giọng đọc; clip render trước khi có tính năng này thì thời gian được ước tính và dàn theo độ dài thật của clip. Gói là `.zip` vì claude.ai không cho tải trực tiếp file `.srt`.

Facebook không cho phần mềm tự đăng lên trang cá nhân; API chỉ đăng được lên Fanpage.

Lấy `FB_PAGE_ID` và `FB_PAGE_TOKEN`:

1. Tạo một app tại https://developers.facebook.com (loại Business).
2. Mở Graph API Explorer, chọn app vừa tạo, chọn **Get User Access Token** và cấp các quyền `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` và **`publish_video`** (bắt buộc để đăng video; thêm `business_management` nếu Fanpage nằm trong Meta Business Suite). Bấm Generate Access Token và **tick chọn đúng Fanpage** trong hộp thoại cấp quyền.
3. Gọi `me/accounts?fields=id,name,access_token,tasks`. Ở dòng Fanpage của bạn, `tasks` phải có `CREATE_CONTENT`; `id` là `FB_PAGE_ID`, `access_token` là `FB_PAGE_TOKEN`. Kiểm tra token bằng Access Token Debugger: Type là Page và Scopes có `pages_manage_posts` lẫn `publish_video`.
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

# CodeLens

Xưởng clip giải thích công nghệ cho developer Việt Nam. Claude viết kịch bản (từ chủ đề hoặc từ bài viết bạn đã research), bạn chỉnh sửa, rồi trình duyệt render clip motion graphics 2D dọc 9:16 (1080×1920, 30 fps) ra file MP4. Mỗi dạng clip có độ dài riêng, từ khoảng 30 giây (tin công nghệ) đến tối đa khoảng 80 giây, để luôn đăng được Reels.

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
| `CODELENS_TTS_VOICE` | `en-US-BrianMultilingualNeural` | Giọng mặc định. Giọng đa ngôn ngữ `en-US-BrianMultilingualNeural` (nam), `en-US-AndrewMultilingualNeural` (nam), `en-US-AvaMultilingualNeural` (nữ) đọc được cả tiếng Việt lẫn từ tiếng Anh trong cùng một câu. Giọng chỉ tiếng Việt: `vi-VN-NamMinhNeural` (nam), `vi-VN-HoaiMyNeural` (nữ). Chọn được trong tab Lịch & logo. |

## Dạng clip

CodeLens làm được nhiều kiểu clip cho các mục đích khác nhau. Bốn dạng đầu trong bảng dưới xoay quanh một case cụ thể; bốn dạng sau dùng khi bạn cần tổng quan, đi sâu có code, hướng dẫn, hoặc đưa tin.

Chọn **Dạng clip** ở ô cạnh nút gợi ý (lựa chọn được nhớ trong trình duyệt):

| Dạng clip | Độ dài | Mở bằng | Mạch nội dung |
|---|---|---|---|
| **Tình huống dev hay gặp** (mặc định) | 55–70 giây | Triệu chứng kèm con số: "Khách F5, bị trừ tiền 2 lần" | Triệu chứng → tái hiện → chẩn đoán → khái niệm là cách chữa → bẫy khi áp dụng |
| **Sự cố thật (postmortem)** | 60–80 giây | Thiệt hại và tên sự cố | Diễn biến → nguyên nhân gốc → biện pháp lẽ ra đã chặn được → bài học |
| **Kiến trúc công ty thật** | 60–80 giây | Bài toán và quy mô | Cách thường làm gãy ở đâu → thiết kế họ chọn → khái niệm đứng sau → trade-off |
| **Đoán lỗi** | 55–70 giây | Hậu quả và lời thách | Luồng có lỗi ẩn → mời người xem đoán → lời giải → cách sửa |
| **Tổng quan: X là gì** | 45–60 giây | Bài toán mà chủ đề giải quyết | Định nghĩa một câu → các đặc tính hoặc thành phần chính → hệ thống thật dùng nó ra sao → khi nào nên dùng. Dành cho chủ đề rộng: OOP, Load balancer, Idempotency. Không có code. |
| **Đi sâu chủ đề nhỏ (có code)** | 60–75 giây | Vấn đề cụ thể mà kỹ thuật sửa được | Code có vấn đề → ý tưởng trong một câu → code sau khi sửa, tô sáng dòng thay đổi → cách dùng → lỗi hay gặp. Dành cho chủ đề hẹp: Dependency Injection, Factory pattern. Có 2–4 cảnh khung code. |
| **Hướng dẫn từng bước** | 60–75 giây | Kết quả sẽ đạt được | BƯỚC 1, BƯỚC 2… mỗi bước một cảnh, có lệnh hoặc cấu hình thật → cách kiểm tra đã làm đúng → một lỗi hay gặp. |
| **Tin công nghệ (30 giây)** | khoảng 30 giây | Chuyện gì vừa xảy ra, kèm một câu hỏi | Chi tiết bất ngờ nhất của tin → điều dev rút ra → câu hỏi mồi bình luận. Chỉ dùng thông tin trong nguồn bạn đưa. |
| **Giải bài thuật toán (LeetCode)** | khoảng 2–3 phút | Đề bài một câu, ví dụ vào và ra | Cách ngây thơ và vì sao chậm → ý tưởng then chốt → mô phỏng từng bước trên ví dụ → code tô sáng dòng then chốt → một bẫy hay gặp → độ phức tạp và dấu hiệu nhận dạng dạng bài. Lời đọc chi tiết theo từng bước. |

- Nút **Gợi ý case** đề xuất theo dạng đang chọn: triệu chứng kèm "Cách chữa: …", sự cố kèm "Bài học: …".
- Gõ một khái niệm (ví dụ "Idempotency key") ở dạng *Tình huống dev hay gặp* thì AI tự chọn tình huống hay gặp nhất mà khái niệm đó chữa được.
- Chủ đề rộng (OOP, Load balancer) thì chọn **Tổng quan: X là gì**. Chủ đề hẹp cần thấy cách viết (Dependency Injection, Factory pattern) thì chọn **Đi sâu chủ đề nhỏ (có code)**. Cần chỉ cách làm một việc bằng một tool thì chọn **Hướng dẫn từng bước**.
- **Tin công nghệ** cần nguồn thật: gõ tin kèm chi tiết chính, hoặc dán bài báo ở **Từ bài viết**. AI không tự biết tin mới, nên nút gợi ý và lịch viết tự động không áp dụng cho dạng này.
- **Cảnh khung code:** ở các dạng có code, AI dùng bố cục **Khung code** cho cảnh cần hiện code hoặc cấu hình. Trong trình soạn, chọn bố cục này sẽ hiện ô **Tên file hoặc tool** và ô **Code** (tối đa 9 dòng, mỗi dòng 46 ký tự). Gõ `!!` ở đầu dòng để tô sáng dòng quan trọng; các dòng còn lại mờ đi sau khi code hiện xong.
- **Cảnh mô phỏng mảng:** dạng *Giải bài thuật toán* dùng bố cục **Mô phỏng mảng**: một hàng ô (tối đa 14), các con trỏ có tên trượt giữa các ô, cửa sổ tô xanh, ô đang xét tô cam, ô đã loại làm mờ, và bảng biến bên dưới (giá trị vừa đổi hiện màu cam). Mỗi bước có **lời đọc riêng**; khi render có giọng đọc, hình chuyển sang bước mới đúng lúc giọng đọc bắt đầu nói về bước đó, và phụ đề hiện đúng câu của bước. Trong trình soạn, trạng thái mỗi bước gõ dạng `L=0 R=2 win=0-2 hi=2 dim=0 | best=3; seen={a:0}`.
- Clip thuật toán dài hơn 90 giây nên không đăng được qua API Reels của Meta: đăng thành video trên Fanpage, đăng Reels bằng app Facebook, hoặc chia thành hai phần.
- **Từ khóa:** tiêu đề và phụ đề của mỗi cảnh chứa từ khóa trọng tâm (tên khái niệm, tool, lệnh, tham số) tô màu cam.
- **Sự cố thật** và **Kiến trúc công ty thật** nên làm qua **Từ bài viết**: dán postmortem hoặc bài engineering blog gốc để AI bám theo nguồn. Không có nguồn thì AI chỉ kể những gì chắc chắn và bỏ số liệu không chắc.
- Tình huống do AI dựng được kể như tình huống điển hình ("giả sử…"), không gắn tên công ty thật.

Mỗi kịch bản vẫn có ba phần, ghi ở ô **Phần** của từng cảnh:

1. **Mở bài** (2 cảnh): hậu quả của case, rồi tái hiện case. Không còn câu mục lục "Trong clip này, mình sẽ…".
2. **Thân bài:** chẩn đoán, gọi tên khái niệm là cách chữa, giải thích cơ chế trên chính case, và bẫy khi áp dụng.
3. **Kết bài:** trước và sau trên chính case, một câu chốt, có thể kèm một câu hỏi mời bình luận.

**Caption Facebook** cũng dẫn bằng case: dòng đầu là hậu quả, rồi tên khái niệm là lời giải, 3–4 ý người xem nhận được, một câu hỏi mồi bình luận, và 4–6 hashtag gọn.

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
- Lời đọc mỗi cảnh dài khoảng 80–250 ký tự. Tổng độ dài theo dạng clip, tối đa 900 ký tự (riêng tin công nghệ tối đa 300). Để vừa thời lượng, AI thu hẹp phạm vi hoặc bớt cảnh chứ không nén câu.
- Cảnh kêu gọi follow ở cuối dài khoảng 5 giây.
- Giọng đọc mặc định nhanh hơn 10% (đổi ở tab Lịch & logo → Giọng đọc).

Sau bước kiểm tra kỹ thuật, AI chạy thêm bước **biên tập giọng văn**: đóng vai biên tập viên tiếng Việt, chỉ viết lại tiêu đề, phụ đề và lời đọc cho tự nhiên, không đổi nội dung kỹ thuật. Kịch bản cũ thì bấm nút **AI biên tập giọng văn** trong trình soạn.

### Series nhiều phần

Clip ngắn thì phạm vi phải hẹp. Khi viết từ chủ đề hoặc từ bài viết, AI lên kế hoạch trước và ưu tiên một clip với phạm vi vừa đủ. Chỉ khi chủ đề không thể giải thích đúng trong một clip, AI mới chia thành series (tối đa 4 phần) và viết từng phần, các phần dùng chung một ví dụ và không lặp ý.

- Mỗi phần có nhãn **PHẦN 1/3** ở góc trên.
- Cảnh cuối của các phần chưa phải phần cuối đổi thành **"ĐÓN XEM PHẦN 2"**, đọc lời giới thiệu phần sau. Sửa lời này trong trình soạn, ô "Lời giới thiệu phần…".
- Phần cuối kết bằng cảnh follow như thường.

Ví dụ có sẵn: series **Outbox Pattern** gồm 3 phần: lỗi dual write, cách outbox hoạt động, gửi trùng và thứ tự event.

## Bộ ảnh (carousel) từ kịch bản

Mỗi kịch bản có nút **Bộ ảnh (carousel)** trong trình soạn. Nút này làm một bài đăng ảnh nhiều trang, mỗi ảnh 1080×1350.

**Caption nói, ảnh chứng minh.** Ảnh không chép lại caption thành chữ. Mỗi ảnh cho người xem *thấy* điều caption vừa nói:
- **Bằng chứng, kết quả trực quan:** mô phỏng màn hình thật (điện thoại nhận hai tin trừ tiền, trang thanh toán đang quay, dashboard có hai dòng trùng, terminal, bảng dữ liệu), hoặc ảnh chụp màn hình thật bạn tải lên.
- **Diễn giải thêm:** hình tự vẽ làm rõ cơ chế (dòng thời gian, hai cửa sổ đặt cạnh nhau, biểu đồ, request được chú thích).
- **Liệt kê:** lưới thẻ có emoji khi nội dung là danh sách tính năng hay điều cần nhớ.

**AI tự thiết kế từng ảnh bằng HTML.** Không có khuôn điền chữ: AI chọn số ảnh (5–9) và bố cục riêng cho mỗi ảnh, dùng một bộ class có sẵn (cửa sổ trình duyệt, điện thoại, thông báo, tin nhắn, dòng log, bảng, thẻ, nhãn) cùng style và SVG inline. App giữ phần khung cố định: nền sáng màu xanh theo logo, logo CodeLens góc trên trái, số trang góc trên phải. HTML của AI được lọc (bỏ script và mọi tài nguyên ngoài) rồi dựng thành ảnh ngay trong trình duyệt; nội dung quá đầy thì tự co lại cho vừa khung.

Cách dùng:
- **Bài này nhằm làm gì:** một dòng định hướng cho AI, ví dụ "giới thiệu tính năng, lấy 2 app mình đã làm làm ví dụ".
- **Ảnh chụp màn hình thật:** tải lên tối đa 6 ảnh và ghi mỗi ảnh là gì. AI đặt chúng vào khung trình duyệt hoặc điện thoại làm bằng chứng. Không có ảnh thì AI tự nghĩ và dựng hình ví dụ.
- **AI thiết kế bộ ảnh:** viết caption trước, rồi mỗi phần của caption ứng với đúng một ảnh, cùng thứ tự.
- **Sửa ảnh này bằng lời:** chọn một ảnh rồi nhắn, ví dụ "bớt chữ, thêm màn hình điện thoại báo trừ tiền 2 lần". Chỉ ảnh đó được dựng lại.
- Sửa được mô tả của từng ảnh (đăng kèm ảnh đó), caption, thứ tự ảnh, và cả HTML nếu muốn sửa tay.
- **Tạo nhanh (không AI):** dựng bộ ảnh từ kịch bản theo một mẫu kiểu Swiss editorial: nhãn phần, số trang lớn cạnh tiêu đề, các ý đánh số có đường kẻ, và một hàng ô icon lấy từ các thành phần của cảnh. Không tốn AI.
- **Model tạo ảnh:** chọn riêng trong khung bộ ảnh (hoặc ở tab Lịch & logo, mục "Thiết kế bộ ảnh"), tách khỏi model viết kịch bản. Model nhẹ rẻ hơn nhưng thiết kế thường đơn giản hơn.
- **Tải bộ ảnh (.zip):** các file `01.jpg`… kèm `caption-va-mo-ta.txt`.
- **Tải clip ảnh cho Reels (.mp4):** ghép các ảnh thành clip dọc 1080×1920 không có âm thanh, mỗi ảnh 3–8 giây.
- **Đăng thẳng lên Fanpage** (bản chạy trên máy, khi đã cấu hình Fanpage), có ô hẹn giờ 1–24 giờ:
  - **Đăng bài ảnh:** một bài nhiều ảnh, caption là nội dung bài, mỗi ảnh mang mô tả riêng (`/{page}/photos` chưa đăng, rồi một bài `/{page}/feed` gắn tất cả ảnh).
  - **Đăng Reels:** Reels chỉ nhận video, nên app ghép các ảnh thành clip im lặng, lưu vào Thư viện rồi đăng kèm caption.

Font Be Vietnam Pro nằm sẵn trong `public/fonts` (giấy phép OFL) và được nhúng vào từng ảnh xuất ra, nên ảnh trông giống nhau trên mọi máy. Việc dựng ảnh cần Chrome hoặc Edge.

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

### Giọng đa ngôn ngữ (mặc định)

Mặc định CodeLens dùng giọng **Brian đa ngôn ngữ** (`en-US-BrianMultilingualNeural`). Giọng này đọc cả tiếng Việt lẫn từ tiếng Anh (request, Idempotency Key, load balancer…) trong cùng một đoạn, nên từ tiếng Anh giữ được âm tiếng Anh thay vì bị đọc theo kiểu Việt. Khi dùng giọng đa ngôn ngữ, danh sách "Cách đọc từ tiếng Anh" bên dưới được bỏ qua. Muốn quay lại giọng cũ thì chọn Nam Minh ở tab **Lịch & logo**.

Nếu dùng Azure chính thức, giá của giọng đa ngôn ngữ có thể khác giọng tiếng Việt thường; xem bảng giá của Azure trước khi dùng nhiều.

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
- **Đăng thẳng lên Fanpage:** chỉ có ở bản chạy trên máy, khi `.env` có `FB_PAGE_ID` và `FB_PAGE_TOKEN`. Có hai nút, đều đăng công khai ngay và hỏi bấm hai lần để tránh đăng nhầm:
  - **Đăng lên Reels:** dùng Reels Publishing API (`/{page}/video_reels`: start, tải file lên `rupload.facebook.com`, finish với `video_state=PUBLISHED`). Clip hiện ở tab Reels và bảng tin. Meta ghi giới hạn cho Reels đăng qua API là **3–90 giây** và tối đa 30 Reels mỗi 24 giờ. Clip dài hơn có thể bị từ chối (lỗi 1363128); khi đó trang báo rõ, và bạn tải video về đăng Reels bằng app Facebook (app nhận clip dài hơn) hoặc dùng nút Đăng lên Fanpage. CodeLens không cắt hay đổi độ dài clip.
  - **Đăng lên Fanpage:** đăng thành bài video thường (`/{page}/videos`).
  - **Hẹn giờ đăng:** tick ô này và chọn từ 1 đến 24 giờ. Hai nút đổi thành **Hẹn đăng Reels** và **Hẹn đăng Fanpage**; Facebook giữ bài và tự đăng đúng giờ (Reels dùng `video_state=SCHEDULED`, video thường dùng `published=false`, cả hai kèm `scheduled_publish_time`). Xem, đổi giờ hoặc hủy bài đã hẹn trong Meta Business Suite.
  - **Kèm phụ đề tiếng Việt** (bật sẵn): sau khi đăng, server tải file `.srt` của clip lên `/{video-id}/captions` với ngôn ngữ mặc định `vi_VN`, nên người xem bật được phụ đề (CC) trên Facebook. Nếu Facebook chưa xử lý xong video, server thử lại vài lần. Nếu vẫn lỗi, bài vẫn được đăng và trang báo để bạn tải gói phụ đề rồi thêm tay trong Meta Business Suite. API không có chỗ cho transcript dạng text, nên `transcript.txt` vẫn phải tải lên tay nếu bạn muốn.
- **Chia sẻ qua ứng dụng:** hiện khi trình duyệt hỗ trợ chia sẻ file (điện thoại, Windows), để chọn ứng dụng Facebook.
- **Tự đăng trên Facebook:** tải video, sao chép caption, mở facebook.com, rồi tạo bài viết hoặc Reel. Dùng cách này cho **trang cá nhân**.

- **Phụ đề và transcript:** nút **Tải phụ đề + transcript (.zip)** tải một gói gồm `captions.vi_VN.srt` và `transcript.txt`. Khi đăng Reel, tải file `.srt` lên mục **Closed captions** và file `.txt` lên mục **Text transcripts**. Nội dung là lời thuyết minh (cảnh chưa có lời thuyết minh thì dùng phụ đề), mỗi câu một đoạn, tối đa 2 dòng. Mốc thời gian được ghi lúc render nên khớp với giọng đọc; clip render trước khi có tính năng này thì thời gian được ước tính và dàn theo độ dài thật của clip. Gói là `.zip` vì claude.ai không cho tải trực tiếp file `.srt`.

Facebook không cho phần mềm tự đăng lên trang cá nhân; API chỉ đăng được lên Fanpage.

Lấy `FB_PAGE_ID` và `FB_PAGE_TOKEN`:

1. Tạo một app tại https://developers.facebook.com (loại Business).
2. Mở Graph API Explorer, chọn app vừa tạo, chọn **Get User Access Token** và cấp các quyền `pages_show_list`, `pages_read_engagement`, `pages_manage_posts` và **`publish_video`** (bắt buộc để đăng video; thêm `business_management` nếu Fanpage nằm trong Meta Business Suite). Bấm Generate Access Token và **tick chọn đúng Fanpage** trong hộp thoại cấp quyền.
3. Gọi `me/accounts?fields=id,name,access_token,tasks`. Ở dòng Fanpage của bạn, `tasks` phải có `CREATE_CONTENT`; `id` là `FB_PAGE_ID`, `access_token` là `FB_PAGE_TOKEN`. Kiểm tra token bằng Access Token Debugger: Type là Page và Scopes có `pages_manage_posts` lẫn `publish_video`. Token này dùng chung cho cả nút Đăng lên Reels, Đăng lên Fanpage và phần gắn phụ đề, không cần thêm quyền mới.
4. Token lấy từ Explorer thường hết hạn sau vài giờ. Đổi sang token dài hạn bằng Access Token Debugger (nút Extend), rồi gọi lại `me/accounts` để lấy Page token không hết hạn.

Token này đăng được lên Fanpage của bạn: giữ bí mật như mật khẩu, chỉ để trong `.env`.

Kịch bản viết trên bản claude.ai chuyển sang bản trên máy được: tick các kịch bản cần chuyển ở bản claude.ai rồi bấm **Xuất đã chọn** (không tick thì nút là **Xuất tất cả**), sau đó bấm **Nhập kịch bản** ở bản trên máy. Nhập được nhiều file cùng lúc; kịch bản trùng mã thì được cập nhật, không bị nhân đôi.

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

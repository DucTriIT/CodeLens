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

Kịch bản viết trên bản claude.ai chuyển sang bản trên máy được: bấm **Xuất kịch bản (.json)** ở bản claude.ai, rồi bấm **Nhập kịch bản** ở bản trên máy.

## Bảo mật API key

- Key chỉ nằm trong `.env` và trong server Node. Trình duyệt không bao giờ thấy key.
- `.env` và `data/` đã có trong `.gitignore`. Đừng commit file `.env`.
- Mặc định server chỉ nghe ở `127.0.0.1`, máy khác không gọi được.

## Cấu trúc

- `server.js`: phục vụ trang, lưu dữ liệu vào `data/`, gọi Claude bằng SDK `@anthropic-ai/sdk`. Có bật fallback phía server (`fallbacks: "default"`): nếu model từ chối vì chính sách an toàn, API tự chạy lại yêu cầu trên một model dự phòng trong cùng lần gọi.
- `public/codelens.html`: toàn bộ ứng dụng, dùng chung cho cả bản claude.ai.
- `public/local-adapter.js`: nối trang với server trên máy, thay cho các tính năng của claude.ai (bộ nhớ, AI, file, tải về).

Mỗi kịch bản AI viết sẽ gọi Claude hai lần: một lần để viết, một lần để kiểm tra độ chính xác kỹ thuật (với kịch bản tạo từ bài viết, lần này đối chiếu với bài). Mức độ suy nghĩ (effort): gợi ý chủ đề và viết kịch bản dùng `medium`; tạo từ bài viết và kiểm tra kỹ thuật dùng `high`.

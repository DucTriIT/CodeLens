from lib import *

S = []
def add(html, narr, cap, sc=None): S.append({"html": html, "narr": narr, "cap": cap, "sc": sc})

DOC_TOP = ('<h4>Đồng bộ đơn sang kho</h4><div class="sec">## Summary</div>Sau khi khách thanh toán, đơn được gửi sang hệ thống kho.'
           '<div class="sec">## Business view</div><ul><li>Chỉ đơn <b>đã thanh toán</b> mới sang kho.</li><li>Gửi lỗi thì thử lại <b>3 lần</b>.</li>'
           '<li>Hết 3 lần: đơn nằm trong danh sách lỗi, chờ xử lý tay.</li><li><b>Cách test:</b> tắt kho giả lập, đặt một đơn, xem danh sách lỗi.</li></ul>')

add(eb("Dùng Claude để lập trình · Phần 3/7") +
    h1("Một trang<br>tài liệu.<br><span class='acc'>Hai kiểu<br>người đọc.</span>") + GROW +
    grid(2, kc(None, "QA", "Cần biết quy tắc và cách test. Không đọc code."), kc(None, "Claude", "Cần biết file nào, bảng nào. Không đọc được suy nghĩ.")) +
    gap(26) + lead("Viết thế nào để cả hai cùng hiểu?"),
    "Tài liệu kỹ thuật thường chỉ dev đọc nổi. Trong kho của mình, mỗi trang phải phục vụ cả QA lẫn Claude.",
    "Một trang tài liệu mà cả QA lẫn Claude đều đọc được thì viết thế nào? Vuốt để xem 👉",
    ("title", "MỘT TRANG, *HAI NGƯỜI ĐỌC*", "QA đọc được, *Claude cũng đọc được*", [("person", ""), ("document", ""), ("robot", "")]))

add(eb("Ticket #4827 sang tay QA") + h2("QA cũng cần<br>hiểu ticket này.") + gap(26) + ticket() + gap(26) +
    chat("Chị QA nhắn", "10:15", ("me", "Thanh toán xong mà kho không thấy đơn: là lỗi, hay hệ thống thiết kế như vậy? Mình test lại thế nào?")) + GROW +
    p("QA không đọc code. Và <b>không nên phải đọc</b>."),
    "Ticket cũ giờ sang tay QA. Chị ấy cần biết đây là lỗi hay đúng thiết kế, và test lại thế nào.",
    "Ticket sang tay QA. Chị ấy cần biết đây là lỗi hay đúng thiết kế, và test thế nào. Nhưng QA đâu đọc code.",
    ("flow", "QA *KHÔNG ĐỌC CODE*", "Lỗi thật, hay *đúng thiết kế*? Test thế nào?", [("person", "QA hỏi"), ("document", "Tài liệu"), ("check", "Biết cách test")]))

add(eb("Sắp xếp kho") + h2("Chia thư mục<br><span class='acc'>theo câu hỏi</span>") + gap(26) +
    dirs(("flows/", "Việc này chạy thế nào?"), ("troubleshooting/", "Lỗi này nghĩa là gì?"), ("systems/", "Ứng dụng này làm gì?"),
         ("data/  integrations/", "Dữ liệu, queue nằm đâu?"), ("conventions/", "Team quy ước gì?"), ("_generated/", "Máy tự quét. Không sửa tay.", 1)) + GROW +
    p("Mở kho ra là biết câu hỏi của mình thuộc ngăn nào."),
    "Kho chia thư mục theo câu hỏi: luồng nghiệp vụ, danh mục lỗi, từng ứng dụng, dữ liệu, và quy ước của team.",
    "Kho chia thư mục theo câu hỏi: việc này chạy thế nào, lỗi này nghĩa là gì, dữ liệu nằm đâu. Mở ra là biết tìm ở ngăn nào.",
    ("stack", "CHIA THEO *CÂU HỎI*", "Mỗi thư mục trả lời *một loại câu hỏi*", [("truck", "Luồng nghiệp vụ"), ("bug", "Danh mục lỗi"), ("server", "Từng ứng dụng"), ("database", "Dữ liệu, queue")]))

add(eb("Nửa trên của trang") + h2("Viết cho <span class='acc'>người</span>") + gap(24) +
    '<div class="doc">' + DOC_TOP + '<div class="cut"></div><div class="dimx"><div class="sec">## Steps</div>OrderSyncJob.cs → WarehouseClient.Send() → …</div>'
    '<div class="side" style="top:-20px;right:24px">QA đọc tới đây là đủ</div></div>' + GROW +
    p("Lời thường, có quy tắc và <b>cách test</b>. Không một dòng code."),
    "Mỗi trang mở đầu bằng tóm tắt và phần viết bằng lời thường: quy tắc là gì, test thế nào. QA chỉ cần đọc tới đó.",
    "Nửa trên mỗi trang viết bằng lời thường: tóm tắt, quy tắc nghiệp vụ, cách test. QA đọc tới đó là đủ.",
    ("stack", "NỬA TRÊN: *CHO NGƯỜI*", "Tóm tắt, quy tắc và *cách test*, bằng lời thường", [("document", "Tóm tắt"), ("check", "Quy tắc"), ("search", "Cách test")]))

add(eb("Phần đầu file") + h2("Vài dòng cho <span class='acc'>máy</span>") + gap(24) +
    term("flows/dong-bo-don-sang-kho.md", "<span class='d'>---</span>\n<span class='a'>title:</span> Đồng bộ đơn sang kho\n<span class='a'>sources:</span>\n  - OrderService/OrderSyncJob.cs\n  - OrderService/WarehouseClient.cs\n<span class='a'>tables:</span> [Orders, OrderSyncErrors]\n<span class='a'>verified:</span> 2026-11-20\n<span class='d'>---</span>") + gap(24) +
    stack(rw("→", "sources", "Trang này dựa trên những file code nào"), rw("→", "verified", "Lần cuối có người kiểm tra nội dung")) + GROW,
    "Đầu mỗi trang có vài dòng cho máy đọc: trang dựa trên file code nào, và lần cuối được kiểm tra khi nào.",
    "Đầu mỗi trang có vài dòng cho máy: trang dựa trên file code nào, bảng nào, lần cuối kiểm tra khi nào. Nhờ đó Claude mở đúng file.",
    ("code", "VÀI DÒNG *CHO MÁY*", "File code nào, bảng nào, *kiểm tra khi nào*", [],
     {"code": "---\ntitle: Đồng bộ đơn sang kho\n!!sources:\n!!  - OrderService/OrderSyncJob.cs\ntables: [Orders, OrderSyncErrors]\n!!verified: 2026-11-20\n---", "codeTitle": "dong-bo-don-sang-kho.md"}))

add(eb("Phần nhàm chán") + h2("Để script<br><span class='acc'>tự quét từ code</span>") + gap(24) +
    term("Terminal", "<span class='a'>&gt;</span> <span class='w'>python tools/generate.py</span>") + gap(18) +
    grid(2, kc(None, "Mọi bảng", "và đoạn code nào đang dùng nó"), kc(None, "Mọi queue", "tên và nơi gửi, nơi nhận"),
         kc(None, "Mọi class", "nằm ở project nào, file nào"), kc(None, "Mọi câu báo lỗi", "kèm class, hàm, file ném ra nó", True)) + GROW +
    p("Người viết phần <b>vì sao</b>. Máy liệt kê phần <b>có gì</b>."),
    "Phần liệt kê thì mình để script quét từ code: mọi bảng, mọi queue, mọi câu báo lỗi. Không ai phải gõ tay.",
    "Phần liệt kê để script tự quét từ code: mọi bảng, mọi queue, mọi câu báo lỗi. Người chỉ viết phần 'vì sao'.",
    ("flow", "MÁY *TỰ LIỆT KÊ*", "Người viết *vì sao*, máy liệt kê *có gì*", [("code", "Code"), ("gear", "Script quét"), ("book", "Danh mục")]))

add(eb("Cùng một trang") + h2("Hai cách hỏi,<br><span class='acc'>hai cách trả lời</span>") + gap(24) +
    chat("QA hỏi Claude", "10:32", ("me", "Dùng acme-kb, giải thích cho QA: đơn sang kho hoạt động thế nào?"),
         ("Claude", "Đơn chỉ sang kho <b>sau khi thanh toán xong</b>. Nếu gửi lỗi, hệ thống thử lại 3 lần. Để test: tắt kho giả lập rồi đặt một đơn…")) + gap(22) +
    p("Claude tìm theo chế độ dành cho <b>người làm nghiệp vụ</b>, nên ưu tiên phần viết bằng lời thường.") + GROW,
    "Khi QA nhờ Claude giải thích, Claude trả lời bằng đúng phần viết cho người làm nghiệp vụ.",
    "QA hỏi thì Claude trả lời bằng phần viết cho người làm nghiệp vụ. Dev hỏi thì Claude đi tiếp xuống phần code. Cùng một trang.",
    ("compare", "CÙNG TRANG, *HAI CÁCH HỎI*", "QA nhận lời thường, dev nhận *đường tới code*", [("person", "QA: lời thường"), ("code", "Dev: tới code")]))

add(eb("Bạn làm thử") + h2("Viết 1 trang cho<br><span class='acc'>luồng hay bị hỏi nhất</span>") + gap(24) +
    stack(sign("1", "Summary", "3 câu: luồng này làm gì"), sign("2", "Business view", "Quy tắc và cách test, bằng lời thường"),
          sign("3", "Steps", "Đi qua file nào, bảng nào"), sign("4", "sources + verified", "Dựa trên file nào, kiểm tra hôm nào")) + GROW +
    p("Đưa cho một bạn QA đọc thử. Bạn ấy hiểu là đạt."),
    "Bạn thử viết một trang cho luồng hay bị hỏi nhất, rồi đưa một bạn QA đọc. Bạn ấy hiểu là đạt.",
    "Bạn làm thử: viết 1 trang cho luồng hay bị hỏi nhất theo 4 mục này, rồi đưa một bạn QA đọc thử.",
    ("stack", "THỬ VIẾT *MỘT TRANG*", "Chọn luồng *hay bị hỏi nhất* trong team", [("document", "Summary"), ("person", "Business view"), ("code", "Steps"), ("clock", "sources, verified")]))

add(nextslide(4, "Dạy AI nói<br>“tôi không biết”", "Kho chưa viết về một thứ, AI sẽ lấy trang <b>gần giống nhất</b> và trả lời như thật. Chặn chuyện đó thế nào?"),
    "Ở phần bốn, mình chỉ cách làm cho AI biết nói tôi không biết, thay vì trả lời gần đúng.",
    "Phần 4: làm sao để AI biết nói 'tôi không biết' thay vì trả lời gần đúng? Follow CodeLens để xem tiếp.")

PART = {"n": 3, "acc": "#ffb23e", "title": "Một trang tài liệu, hai kiểu người đọc", "format": "concept",
        "hook": "Tài liệu kỹ thuật của bạn, QA có đọc nổi không?", "concept": "Trang tài liệu cho người và AI",
        "slides": S, "trailer": [0, 1, 3, 4, 8],
        "caption": """Tài liệu kỹ thuật của team bạn, QA có đọc nổi không? 👇

Trong kho kiến thức của mình, mỗi trang phải phục vụ hai kiểu người đọc cùng lúc:

👉 Nửa trên viết cho người: tóm tắt, quy tắc nghiệp vụ, cách test. Không một dòng code
👉 Vài dòng đầu file viết cho máy: trang dựa trên file code nào, kiểm tra hôm nào
👉 Phần liệt kê (bảng, queue, câu báo lỗi) để script tự quét
👉 Kho chia thư mục theo câu hỏi, mở ra là biết tìm ở đâu

Nhờ vậy QA hỏi Claude thì nhận lời thường, dev hỏi thì Claude dẫn tới đúng file code.

Mẫu 4 mục để bạn viết thử nằm ở ảnh 8.

Team bạn đang để tài liệu ở đâu: wiki, Notion hay trong repo? 👇

#codelens #claude #AI #tailieu #laptrinh"""}

from lib import *

# Bài kỹ thuật đứng riêng, không đánh số trong series.
S = []
def add(html, narr, cap, sc=None): S.append({"html": html, "narr": narr, "cap": cap, "sc": sc})

def cmp(*rows):
    Y, N = '<div class="c y{w}">✓</div>', '<div class="c n{w}">✕</div>'
    out = '<div class="cmp"><div class="hd"></div><div class="hd">Đọc code<br>mỗi phiên</div><div class="hd">Dán tài liệu<br>vào chat</div><div class="hd win">Kho + công cụ</div>'
    for label, a, b, c in rows:
        cell = lambda v, w="": (Y if v == 1 else N if v == 0 else '<div class="c m{w}">' + str(v) + "</div>").replace("{w}", w)
        out += f"<div>{label}</div>" + cell(a) + cell(b) + cell(c, " win")
    return out + "</div>"

add(eb("Bài kỹ thuật · acme-kb") +
    h1("Cùng một<br>model.<br><span class='acc'>Khác ở thứ<br>nó được đọc.</span>") + GROW +
    grid(3, kc(None, "Khôn hơn", "đọc đúng thứ tự"), kc(None, "Nhanh hơn", "đọc ít hơn"), kc(None, "Chính xác hơn", "biết nói “không có”")) + gap(24) +
    lead("Bên trong kho kiến thức: kỹ thuật nào làm ra ba điều này?"),
    "Cùng một model, Claude trả lời khác hẳn tuỳ vào thứ nó được đọc. Mình mở nắp kho kiến thức cho bạn xem.",
    "Cùng một model, khác nhau ở thứ nó được đọc. Kỹ thuật nào giúp Claude khôn hơn, nhanh hơn, chính xác hơn? Vuốt để xem 👉")

add(eb("So sánh") + h2("3 cách cho AI<br><span class='acc'>hiểu hệ thống</span>") + gap(22) +
    cmp(("Nhớ được giữa các phiên", 0, 0, 1), ("Không tốn token đọc lại", 0, 0, 1), ("Khớp với code hiện tại", 1, 0, "báo trang<br>đã cũ"),
        ("Biết nói “chưa có tài liệu”", 0, 0, 1), ("Người không code dùng được", 0, 1, 1), ("Trả lời được khi không có AI", 0, 0, 1)) + GROW +
    p("Đọc code thì đúng nhưng chậm. Dán tài liệu thì nhanh nhưng <b>không biết nó đã cũ</b>."),
    "Đọc code mỗi phiên thì đúng nhưng chậm. Dán tài liệu thì nhanh nhưng dễ cũ. Kho kèm công cụ lấy được cả hai.",
    "So sánh 3 cách cho AI hiểu hệ thống: đọc code mỗi phiên, dán tài liệu vào chat, và kho kiến thức kèm công cụ tra cứu.")

add(eb("Nền móng") + h2("Sơ đồ tri thức:<br><span class='acc'>một file mục lục</span>") + gap(22) +
    term("INDEX.md  ·  câu hỏi → trang", "") .replace("<pre></pre>", '<div style="padding:20px"><div class="map2">'
        '<div><span>Đơn không sang kho?</span><i>→</i><b>flows/dong-bo-don…</b></div>'
        '<div><span>Lỗi timeout kho là gì?</span><i>→</i><b>troubleshooting/loi-kho</b></div>'
        '<div><span>Bảng Orders có gì?</span><i>→</i><b>data/orders</b></div>'
        '<div><span>Team đặt tên nhánh sao?</span><i>→</i><b>conventions/branches</b></div></div></div>') + gap(20) +
    stack(rw("→", "Bản đồ hệ thống + bảng “câu hỏi → trang”", "Giữ dưới 120 dòng để luôn gọn"),
          rw("→", "Người và AI dùng chung một bản đồ", "Claude tự nạp nó ở mọi phiên; QA mở ra đọc")) + GROW,
    "Nền móng là sơ đồ tri thức: một file mục lục ghi câu hỏi nào thì đọc trang nào. Người và AI dùng chung.",
    "Nền móng là sơ đồ tri thức: một file mục lục ghi câu hỏi nào thì đọc trang nào. Claude tự nạp nó, QA mở ra đọc.")

add(eb("Khôn hơn") + h2("Đọc theo thứ tự,<br><span class='acc'>từ rộng tới hẹp</span>") + gap(22) +
    '<div class="tl"><div><span class="tm">1 · mục lục</span>Biết câu hỏi thuộc ngăn nào</div>'
    '<div><span class="tm">2 · kb_search</span>Tìm đoạn tài liệu liên quan</div>'
    '<div><span class="tm">3 · kb_lookup</span>Tra một cái tên: class, bảng, queue, câu báo lỗi</div>'
    '<div><span class="tm">4 · kb_get</span>Đọc trọn trang khi cần</div>'
    '<div><span class="tm">5 · sources</span>Mở đúng file code mà trang trỏ tới</div>'
    '<div><span class="tm">6 · db_query</span>Bước cuối: xác nhận bằng dữ liệu thật, chỉ-đọc</div></div>' + GROW +
    p("Mỗi bước thu hẹp phạm vi. Claude <b>không bao giờ phải quét cả repo</b>."),
    "Khôn hơn là nhờ đọc từ rộng tới hẹp: mục lục, tìm kiếm, tra tên, đọc trang, rồi mới mở đúng file code.",
    "Khôn hơn: Claude đọc theo thứ tự từ rộng tới hẹp. Mục lục, tìm kiếm, tra tên, đọc trang, rồi mới mở đúng file code.")

add(eb("Nhanh hơn") + h2("Đọc ít hơn,<br><span class='acc'>không đọc lại</span>") + gap(22) +
    stack(rw("01", "Mỗi trang chỉ trả về tối đa 2 đoạn", "Các mục khớp khác chỉ liệt kê tên"),
          rw("02", "Chỉ mục tự dựng lại khi tài liệu đổi", "Chỉ tính lại embedding cho trang vừa sửa"),
          rw("03", "Model embedding nạp sẵn trong tiến trình", "Hỏi trên giao diện web không phải khởi động lại"),
          rw("04", "Danh mục code do script quét sẵn", "Tra tên bảng, tên class không cần grep")) + GROW +
    p("Ít chữ đi vào ngữ cảnh hơn thì trả lời nhanh hơn và <b>tốn ít token hơn</b>."),
    "Nhanh hơn là nhờ đọc ít hơn. Mỗi trang chỉ trả về tối đa hai đoạn, chỉ mục và danh mục code đã dựng sẵn.",
    "Nhanh hơn: mỗi trang chỉ trả về tối đa 2 đoạn, chỉ mục dựng sẵn, danh mục code quét sẵn. Ít chữ vào ngữ cảnh, tốn ít token.")

add(eb("Chính xác hơn") + h2("Bên trong<br><span class='acc'>kb_search</span>") + gap(20) +
    stack(grid(2, kc("BM25", None, "Từ khoá, trên SQLite FTS5"), kc("bge-small", None, "Embedding, chạy trên máy")),
          kc("RRF", None, "Trộn hai bảng xếp hạng thành một", True),
          grid(2, kc(None, "Tăng điểm", "Trang gắn đúng cái tên được hỏi"), kc(None, "Giảm điểm", "Mục “liên quan”, “câu hỏi mở”")),
          grid(2, kc(None, "Ngưỡng tối thiểu", "Dưới ngưỡng: “No KB match”"), kc(None, "Dò khoảng trống", "Tên có trong code, kho chưa viết"))) + GROW +
    p("Hai lớp cuối là thứ RAG thường thiếu: <b>quyền không trả lời</b>."),
    "Chính xác hơn là nhờ tìm kiếm lai, từ khoá cộng embedding. Thêm ngưỡng tối thiểu, và dò chỗ kho còn thiếu.",
    "Chính xác hơn: bên trong kb_search là BM25 + embedding trộn bằng RRF, thêm ngưỡng tối thiểu và dò chỗ kho còn thiếu.")

add(eb("Điểm hữu dụng nhất") + h2("QA tự hỏi,<br><span class='acc'>tự có câu trả lời</span>") + gap(22) +
    stack('<div class="lvl"><div class="tm">không AI</div><div><div class="h">Mở mục lục, đọc trang</div><div class="d">Mỗi trang có Summary và Business view bằng lời thường</div></div></div>',
          '<div class="lvl"><div class="tm">không AI<br>tức thì</div><div><div class="h">Tìm kiếm trên giao diện web</div><div class="d">Gõ câu hỏi thường, bấm chế độ Business</div></div></div>',
          '<div class="lvl ai"><div class="tm">có AI<br>10–60 giây</div><div><div class="h">Hỏi Claude, chỉ dùng kho</div><div class="d">Trả lời có dẫn tới trang, không đọc code</div></div></div>') + GROW +
    p("Chỉ cần quy tắc nghiệp vụ thì dừng ở <b>hai mức đầu</b>: không tốn phí, không phải chờ dev."),
    "Điểm hữu dụng nhất: QA tự hỏi và tự có câu trả lời. Hai mức đầu không cần AI, chỉ cần mục lục và tìm kiếm.",
    "Điểm hữu dụng nhất: QA tự hỏi, tự có câu trả lời. Hai mức đầu không cần AI, không tốn phí, không phải chờ dev.")

add(eb("QA dùng thế nào") + h2("Gõ câu hỏi thường,<br><span class='acc'>nhận lời thường</span>") + gap(20) +
    '<div class="inp">đơn trả tiền rồi mà kho không thấy</div>' + gap(14) +
    chips("Tất cả", "*Business", "Tech") + gap(16) +
    '<div class="res"><div class="pth">flows/dong-bo-don-sang-kho.md  ·  Business view</div><div class="sn" style="color:#dfe5f1">Chỉ đơn đã thanh toán mới sang kho. Gửi lỗi thì thử lại 3 lần. Hết 3 lần, đơn nằm trong danh sách lỗi chờ xử lý tay. <b>Cách test:</b> tắt kho giả lập, đặt một đơn…</div><div class="bd"><span class="bdg good">Người đã duyệt · còn mới</span></div></div>' + GROW +
    p("Chế độ Business xếp phần viết cho người làm nghiệp vụ lên đầu. <b>Không có AI nào chạy</b> ở bước này."),
    "QA gõ câu hỏi bằng lời thường và nhận ngay quy tắc nghiệp vụ, kèm cách test. Không có AI nào chạy.",
    "QA gõ câu hỏi thường, bấm chế độ Business, nhận ngay quy tắc nghiệp vụ và cách test. Không có AI nào chạy ở bước này.")

add(eb("Lợi ích") + h2("Một kho,<br><span class='acc'>bốn người hưởng</span>") + gap(22) +
    grid(2, kc(None, "QA", "Tự trả lời câu hỏi nghiệp vụ, có sẵn cách test"),
         kc(None, "Dev", "Thôi bị hỏi lại cùng một câu. AI mở đúng file."),
         kc(None, "Người mới", "Có bản đồ hệ thống từ ngày đầu"),
         kc(None, "Claude", "Bớt đoán, biết khi nào phải nói “chưa có”", True)) + GROW +
    p("Cùng một trang tài liệu phục vụ cả bốn. Viết một lần, <b>không phải bảo trì hai bản</b>."),
    "Một kho mà bốn bên cùng hưởng: QA, dev, người mới, và cả Claude.",
    "Một kho, bốn người hưởng: QA, dev, người mới và Claude. Viết một lần, không phải bảo trì hai bản tài liệu.")

add(eb("Bạn làm thử") + h2("Bắt đầu từ<br><span class='acc'>sơ đồ tri thức</span>") + gap(22) +
    stack(sign("1", "Viết một file mục lục", "Bảng “câu hỏi → trang”, dưới 120 dòng"),
          sign("2", "Mỗi trang mở đầu bằng lời thường", "Summary và Business view, có cách test"),
          sign("3", "Rồi mới thêm tìm kiếm", "Từ khoá trước, embedding sau")) + GROW +
    '<div class="cta"><span>Follow CodeLens để xem cả series</span><span>→</span></div>',
    "Bạn có thể bắt đầu từ sơ đồ tri thức: một file mục lục, mỗi trang mở đầu bằng lời thường.",
    "Bạn làm thử: viết một file mục lục và cho mỗi trang một phần mở đầu bằng lời thường. Tìm kiếm và AI thêm sau.")

PART = {"n": 8, "acc": "#22d3ee", "title": "Cùng một model, khác ở thứ nó được đọc", "format": "deep",
        "hook": "", "concept": "", "noscript": True, "head": "BÀI KỸ THUẬT", "tag": "acme-kb · Bài kỹ thuật", "end": "Hết bài",
        "slides": S, "trailer": [0, 1, 6, 7, 9],
        "caption": """Cùng một model Claude, sao lúc trả lời rất chuẩn, lúc lại đoán bừa? Khác nhau ở thứ nó được đọc 👇

Bài này mở nắp kho kiến thức trong repo của mình để xem kỹ thuật bên trong:

🧠 Khôn hơn: đọc theo thứ tự từ rộng tới hẹp. Mục lục → tìm kiếm → tra tên → đọc trang → mới mở đúng file code
⚡ Nhanh hơn: mỗi trang chỉ trả về tối đa 2 đoạn, chỉ mục và danh mục code dựng sẵn
🎯 Chính xác hơn: tìm kiếm lai BM25 + embedding trộn bằng RRF, thêm ngưỡng tối thiểu và dò chỗ kho còn thiếu. AI được quyền nói "chưa có tài liệu"

Nhưng điểm mình thấy hữu dụng nhất lại không cần AI: nhờ có sơ đồ tri thức, QA tự gõ câu hỏi và nhận ngay quy tắc nghiệp vụ kèm cách test. Không tốn phí, không phải chờ dev.

Ảnh 2 so sánh 3 cách cho AI hiểu hệ thống. Ảnh 10 là 3 bước để bạn bắt đầu.

Team bạn đang cho AI đọc gì: code, wiki, hay chưa có gì? 👇

#codelens #claude #AI #RAG #laptrinh"""}

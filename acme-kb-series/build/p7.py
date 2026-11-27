from lib import *

S = []
def add(html, narr, cap, sc=None): S.append({"html": html, "narr": narr, "cap": cap, "sc": sc})

add(eb("Dùng Claude để lập trình · Phần 7/7") +
    h1("Dán một<br>dòng lỗi.<br><span class='acc'>Biết ngay<br>nó ở đâu.</span>") + GROW +
    ticket(title="Lại một đơn đã thanh toán mà kho không nhận được.", pri="Đang trực") + gap(24) +
    lead("Phần cuối: kho kiến thức thành công cụ trực sự cố."),
    "Phần cuối. Một ticket giống hệt quay lại lúc mình đang trực. Lần này mình không mở code, mình mở trình duyệt.",
    "Phần cuối: ticket quay lại đúng lúc đang trực. Lần này mình không mở code. Vuốt để xem 👉",
    ("title", "DÁN LỖI, *BIẾT NGAY*", "Kho kiến thức thành *công cụ trực sự cố*", [("bug", ""), ("search", ""), ("check", "")]))

add(eb("Giao diện web của kho") + h2("Mở trình duyệt,<br><span class='acc'>không mở code</span>") + gap(24) +
    '<div class="term"><div class="tb"><i></i><i></i><i></i>127.0.0.1:8765  ·  acme-kb</div><div style="padding:26px 28px">' +
    chips("Tìm kiếm", "*🧭 Trace", "*🚨 Triage", "*🩺 Health", "Hỏi AI") + '</div></div>' + gap(22) +
    stack(rw("→", "Chạy ngay trên máy bạn", "Chỉ mở cho chính máy đó, có khoá bằng passphrase"),
          rw("→", "Trace, Triage, Health không dùng AI", "Chạy các truy vấn chỉ-đọc viết sẵn, không tốn phí")) + GROW,
    "Kho có thêm một giao diện web chạy ngay trên máy. Ba công cụ chính không dùng AI nên không tốn phí.",
    "Kho có thêm giao diện web chạy ngay trên máy. Ba công cụ Trace, Triage, Health không dùng AI nên không tốn phí.",
    ("hub", "MỞ *TRÌNH DUYỆT*", "Ba công cụ *không dùng AI*, không tốn phí", [("browser", "Giao diện kho"), ("search", "Trace"), ("bug", "Triage"), ("chart", "Health")]))

add(eb("🧭 Trace") + h2("Gõ mã đơn,<br><span class='acc'>ra dòng thời gian</span>") + gap(22) +
    '<div class="tl"><div><span class="tm">08:11:02</span>Thanh toán thành công</div><div><span class="tm">08:11:03</span>Gửi đơn sang kho</div>'
    '<div class="bad"><span class="tm">08:11:33</span>Lần thử 1: kho không trả lời</div><div class="bad"><span class="tm">08:13:40</span>Lần thử 3: kho không trả lời</div>'
    '<div class="bad"><span class="tm">08:13:41</span>Ghi vào OrderSyncErrors</div></div>' + gap(20) +
    '<div class="res"><div class="bd" style="margin-top:0"><span class="bdg stale">Phát hiện: đã thanh toán, chưa đồng bộ</span></div></div>' + GROW +
    p("Gom từ nhiều bảng trong vài giây. Tên, số điện thoại, email của khách <b>không được lấy ra</b>."),
    "Trace: gõ mã đơn, vài giây sau có dòng thời gian của đơn đó, gom từ nhiều bảng, kèm các điểm bất thường.",
    "Trace: gõ mã đơn là ra dòng thời gian của đơn đó, gom từ nhiều bảng, kèm điểm bất thường. Thông tin cá nhân của khách không được lấy ra.",
    ("flow", "TRACE: *DÒNG THỜI GIAN*", "Gõ mã đơn, thấy đơn *đi qua những đâu*", [("cart", "Thanh toán"), ("queue", "Gửi sang kho"), ("warning", "Lỗi 3 lần"), ("database", "Bảng lỗi")], {"mark": {"index": 2, "type": "cross"}}))

add(eb("🚨 Triage") + h2("Dán lỗi vào,<br><span class='acc'>ra phán quyết</span>") + gap(22) +
    term("Dán dòng lỗi hoặc stack trace", "<span class='w'>System.TimeoutException: Warehouse API\ndid not respond</span>") + gap(16) +
    grid(2, '<div class="kc hi"><div class="t">TĂNG VỌT</div><div class="v">so với mức thường ngày</div><div class="bars" style="margin-top:14px"><i style="height:18%"></i><i style="height:22%"></i><i style="height:15%"></i><i style="height:20%"></i><i style="height:24%"></i><i class="hi" style="height:70%"></i><i class="hi" style="height:100%"></i></div></div>',
         kc(None, "Ném ra ở", "<span class='mono'>WarehouseClient.Send()</span><br>WarehouseClient.cs")) + gap(16) +
    chips("MỚI", "*TĂNG VỌT", "Nhiễu cũ", "Im ắng") + GROW +
    p("Biết lỗi này <b>mới hay cũ</b> trước khi đánh thức ai dậy."),
    "Triage: dán một dòng lỗi vào, nó cho biết lỗi này mới, đang tăng vọt hay chỉ là nhiễu cũ, và được ném ra ở file nào.",
    "Triage: dán dòng lỗi vào là biết lỗi mới, đang tăng vọt, hay chỉ là nhiễu cũ, và được ném ra ở class nào, file nào.",
    ("flow", "TRIAGE: *PHÁN QUYẾT*", "Lỗi mới, *tăng vọt*, hay chỉ là nhiễu cũ?", [("bug", "Dán dòng lỗi"), ("chart", "Mới hay cũ"), ("code", "Ném ra ở đâu")]))

add(eb("🩺 Health") + h2("Cái gì<br><span class='acc'>đang hỏng?</span>") + gap(22) +
    stack('<div class="hc red"><div><div class="t">Đồng bộ sang kho</div><div class="v">Tăng vọt so với 7 ngày trước</div></div><span class="pill">UNHEALTHY</span></div>',
          '<div class="hc amber"><div><div class="t">Webhook đối tác</div><div class="v">Có lỗi, ở mức thường ngày</div></div><span class="pill">WARNING</span></div>',
          '<div class="hc green"><div><div class="t">Job nền</div><div class="v">Không có gì bất thường</div></div><span class="pill">HEALTHY</span></div>',
          '<div class="hc green"><div><div class="t">Bảo trì chỉ mục ban đêm</div><div class="v">Đêm qua chạy xong</div></div><span class="pill">HEALTHY</span></div>') + GROW +
    p("Mỗi thẻ so lỗi hôm nay với <b>mức thường ngày</b>. Thẻ đỏ tự nổi lên đầu."),
    "Health cho biết cái gì đang hỏng, bằng các thẻ đỏ, vàng, xanh. Mỗi thẻ so lỗi hôm nay với mức thường ngày.",
    "Health: các thẻ đỏ, vàng, xanh cho biết cái gì đang hỏng. Mỗi thẻ so lỗi hôm nay với mức thường ngày, thẻ đỏ tự nổi lên đầu.",
    ("stack", "HEALTH: *CÁI GÌ HỎNG?*", "So lỗi hôm nay với *mức thường ngày*", [("cross", "Đỏ: tăng vọt"), ("warning", "Vàng: như mọi ngày"), ("check", "Xanh: ổn")]))

add(eb("Khi cần giải thích") + h2("Hỏi AI, kèm luôn<br><span class='acc'>dữ liệu vừa xem</span>") + gap(22) +
    grid(2, kc(None, "Chỉ kho", "Trả lời từ tài liệu, có dẫn đường tới trang. Không đọc code."),
         kc(None, "Kho + code", "Được đọc thêm code khi kho chưa đủ. Vẫn không sửa được gì.", True)) + gap(18) +
    stack(rw("→", "Đính kèm dữ liệu trace vào câu hỏi", "Claude bắt đầu từ đúng những dòng bạn đang nhìn"),
          rw("→", "Chép phiên đó sang terminal để làm tiếp", "Mỗi cuộc hỏi là một phiên Claude Code thật")) + GROW,
    "Cần giải thích thì mình hỏi AI, kèm luôn dữ liệu vừa trace. Claude trả lời từ kho, có dẫn nguồn, và không sửa được gì.",
    "Cần giải thích thì bấm hỏi AI, kèm luôn dữ liệu vừa trace. Claude trả lời từ kho, có dẫn nguồn, và không sửa được gì.",
    ("flow", "HỎI AI, *KÈM DỮ LIỆU*", "Trả lời từ kho, *có dẫn nguồn*, không sửa gì", [("search", "Dữ liệu trace"), ("robot", "Claude"), ("book", "Dẫn nguồn")]))

add(eb("Cả series trong một ảnh") + h2("Ticket #4827: <span class='ok'>đóng.</span>") + gap(22) +
    dirs(("1 Kho trên code", "AI hết đoán"), ("2 Bốn mảnh ghép", "Claude tự mở kho"), ("3 Trang hai nửa", "QA cũng đọc được"),
         ("4 Ba nhãn", "AI biết nói “chưa có”"), ("5 DB chỉ-đọc", "Xem dữ liệu thật, an toàn"), ("6 Ca đêm", "Kho không nói dối"),
         ("7 Trace, Triage", "Trực sự cố không mở code")) + GROW + p("Mỗi lớp gỡ một bức tường mà ticket đụng phải."),
    "Vậy là ticket được đóng, nhờ từng lớp trong series: kho kiến thức, bốn mảnh ghép, nhãn tin cậy, database chỉ đọc, và ca đêm.",
    "Cả series trong một ảnh: 7 lớp đã giúp đóng ticket #4827. Lưu lại để xem khi cần 🔖",
    ("stack", "TICKET *ĐÓNG*", "Bảy lớp, *một kho kiến thức* trong repo", [("book", "Kho kiến thức"), ("gear", "4 mảnh ghép"), ("shield", "Database chỉ đọc"), ("clock", "Ca đêm")]))

add(eb("Bạn làm thử") + h2("5 bước cho<br><span class='acc'>repo của bạn</span>") + gap(22) +
    stack(sign("1", "Viết CLAUDE.md: luật và mục lục"), sign("2", "Viết 3 trang cho 3 luồng hay bị hỏi nhất"),
          sign("3", "Ghi nguồn và ngày kiểm tra cho mỗi trang"), sign("4", "Viết script báo trang cũ theo git"),
          sign("5", "Bọc phần tìm kiếm thành công cụ cho AI")) + GROW +
    p("Chưa cần làm hết. Bước 1 đến 3 không cần công cụ nào."),
    "Bạn có thể bắt đầu ngay: viết file luật, viết ba trang cho ba luồng hay bị hỏi nhất, rồi mới tính tới công cụ.",
    "Bạn làm thử: 5 bước dựng kho kiến thức cho repo của bạn. Bắt đầu từ bước 1, đừng chờ đủ công cụ.",
    ("stack", "NĂM BƯỚC *CHO BẠN*", "Viết luật, viết 3 trang, rồi mới *tính tới công cụ*", [("document", "CLAUDE.md"), ("book", "3 trang đầu"), ("clock", "Nguồn, ngày"), ("code", "Script báo cũ")]))

add(eb("Hết series") + h1("Cảm ơn bạn<br>đã xem hết<br><span class='acc'>7 phần.</span>") + gap(30) +
    lead("Bạn muốn mình đào sâu phần nào? <b>Bình luận số phần</b>, mình làm tiếp.") + GROW +
    '<div class="cta"><span>Follow CodeLens để xem series sau</span><span>→</span></div>',
    "Series đến đây là hết. Bạn muốn mình đào sâu phần nào thì bình luận nhé.",
    "Hết series 7 phần. Bạn muốn mình đào sâu phần nào? Bình luận số phần nhé, và follow CodeLens để xem series sau.")

PART = {"n": 7, "acc": "#a3e635", "title": "Dán một dòng lỗi, biết ngay nó ở đâu", "format": "architecture",
        "hook": "Đang trực mà gặp lỗi lạ, bạn mở gì đầu tiên?", "concept": "Trace, Triage, Health từ kho kiến thức",
        "slides": S, "trailer": [0, 2, 3, 4, 8],
        "caption": """Đang trực mà gặp lỗi lạ, bạn mở gì đầu tiên? Mình không còn mở code nữa 👇

Phần cuối của series: kho kiến thức trong repo trở thành công cụ trực sự cố, chạy ngay trên máy.

👉 Trace: gõ mã đơn, ra dòng thời gian của đơn đó
👉 Triage: dán dòng lỗi, biết lỗi mới, đang tăng vọt hay chỉ là nhiễu cũ
👉 Health: thẻ đỏ, vàng, xanh cho biết cái gì đang hỏng
👉 Hỏi AI: kèm luôn dữ liệu vừa xem, Claude trả lời có dẫn nguồn

Ba công cụ đầu không dùng AI nên không tốn phí.

Ảnh 7 tóm tắt cả series. Ảnh 8 là 5 bước để bạn tự làm cho repo của mình.

Bạn muốn mình đào sâu phần nào trong 7 phần? Bình luận số phần nhé 👇

#codelens #claude #AI #devops #laptrinh"""}

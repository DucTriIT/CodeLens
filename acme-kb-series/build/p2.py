from lib import *

S = []
def add(html, narr, cap, sc=None): S.append({"html": html, "narr": narr, "cap": cap, "sc": sc})

add(eb("Mình dùng Claude để lập trình · Phần 2/7") +
    h1("Có kho rồi.<br>Nhưng Claude<br><span class='acc'>không biết mở.</span>") + gap(40) +
    '<div class="puz"><div>CLAUDE.md<span>luật</span></div><div>MCP<span>công cụ</span></div><div>Skill<span>quy trình</span></div><div>Hook<span>bảo vệ</span></div></div>' +
    GROW + lead("4 mảnh ghép để Claude tự làm đúng, ngay trong repo của bạn."),
    "Phần trước mình đã có kho kiến thức. Nhưng Claude đâu tự biết phải đọc kho trước khi đụng vào code.",
    "Có kho kiến thức rồi vẫn chưa xong: Claude không tự biết phải mở kho ra đọc. Cần thêm 4 mảnh ghép 👉",
    ("title", "KHO CÓ, CLAUDE *KHÔNG MỞ*", "Cần *4 mảnh ghép* để Claude tự làm đúng", [("book", ""), ("robot", ""), ("warning", "")]))

add(eb("Ticket #4827, phiên mới") + h2("Kho nằm ngay đó.<br><span class='acc'>Claude vẫn đoán.</span>") + gap(32) +
    chat("Phiên mới", "Thứ Tư · 08:40", ("me", "Vì sao đơn đã thanh toán mà không sang kho?"),
         ("Claude", "Để mình đọc code trong <b>OrderService</b> xem sao…")) + gap(28) +
    p("Không ai nói cho Claude biết <b>luật chơi của repo này</b>: có kho, kho nằm ở đâu, và phải đọc kho trước.") + GROW +
    p("Giống nhân viên mới ngày đầu đi làm mà không ai dặn gì."),
    "Mở phiên mới, hỏi lại ticket cũ, Claude vẫn lao vào đọc code. Vì chưa ai dặn nó luật chơi của repo.",
    "Mở phiên mới, Claude vẫn lao vào đọc code và đoán. Vì chưa ai dặn nó luật chơi của repo.",
    ("flow", "CHƯA AI *DẶN LUẬT*", "Kho nằm ngay đó, Claude vẫn *đi đọc code*", [("person", "Bạn hỏi"), ("robot", "Claude"), ("code", "Đọc code, đoán")]))

add(eb("Mảnh 1") + h2("CLAUDE.md:<br><span class='acc'>tờ nội quy</span>") + gap(28) +
    term("D:\\Acme\\CLAUDE.md  ·  ví dụ", "<span class='w'># Luật khi làm việc ở Acme</span>\n<span class='a'>1.</span> Tra acme-kb trước khi đọc code\n<span class='a'>2.</span> Chỉ mở file mà kho trỏ tới\n<span class='a'>3.</span> Kho chưa có? Nói rõ, rồi mới đọc code\n\n<span class='w'># Mục lục kho</span>\n<span class='d'>Đơn hàng → flows/dong-bo-don-sang-kho.md\nLỗi thường gặp → troubleshooting/…</span>") + gap(24) +
    p("Claude Code <b>tự nạp file này</b> ở mọi phiên mở trong thư mục. Bạn không phải nhắc lại.") + GROW,
    "Mảnh một là file CLAUDE.md. Claude tự nạp nó ở mọi phiên, trong đó có luật của team và mục lục của kho.",
    "Mảnh 1: CLAUDE.md. Một file ghi luật của team và mục lục kho. Claude tự đọc nó ở mọi phiên, bạn không phải nhắc lại.",
    ("stack", "MẢNH 1: *CLAUDE.MD*", "Luật của team và *mục lục kho*, tự nạp mỗi phiên", [("document", "Luật của team"), ("book", "Mục lục kho"), ("robot", "Tự nạp mỗi phiên")]))

add(eb("Mảnh 2") + h2("MCP: bộ công cụ<br><span class='acc'>để tự tra kho</span>") + gap(28) +
    stack(kc("kb_search", None, "Tìm trong kho bằng câu hỏi thường: “đơn không sang kho”"),
          kc("kb_lookup", None, "Tra một cái tên: class, bảng, queue"),
          kc("kb_get", None, "Đọc trọn một trang")) + gap(24) +
    p("Claude gọi các công cụ này như gọi hàm. Bạn <b>không phải dán tài liệu vào chat</b> nữa.") + GROW,
    "Mảnh hai là MCP, bộ công cụ để Claude tự tra kho: tìm kiếm, tra một cái tên, hoặc đọc cả trang.",
    "Mảnh 2: MCP. Bộ công cụ để Claude tự tìm trong kho, tra một cái tên, hoặc đọc trọn một trang. Hết cảnh dán tài liệu vào chat.",
    ("hub", "MẢNH 2: *MCP*", "Claude *tự tra kho* như gọi một hàm", [("robot", "Claude"), ("search", "kb_search"), ("key", "kb_lookup"), ("document", "kb_get")]))

add(eb("Mảnh 3") + h2("Skill: quy trình<br><span class='acc'>gõ một lệnh là chạy</span>") + gap(28) +
    term("Claude Code", "<span class='a'>&gt;</span> <span class='w'>/kb-update</span>\n\n<span class='g'>✓</span> Tìm trang đã cũ so với code\n<span class='g'>✓</span> Đọc lại đúng phần code liên quan\n<span class='g'>✓</span> Sửa trang, ghi ngày kiểm tra") + gap(24) +
    p("Việc nào bạn hay phải dặn AI từng bước, hãy viết thành skill. <b>Dặn một lần, dùng mãi.</b>") + GROW,
    "Mảnh ba là skill, một quy trình viết sẵn. Gõ một lệnh, Claude tự tìm trang tài liệu đã cũ rồi cập nhật.",
    "Mảnh 3: Skill. Một quy trình viết sẵn. Gõ /kb-update là Claude tự tìm trang tài liệu đã cũ và cập nhật.",
    ("flow", "MẢNH 3: *SKILL*", "Gõ *một lệnh*, Claude chạy cả quy trình", [("laptop", "/kb-update"), ("search", "Tìm trang cũ"), ("document", "Cập nhật")]))

add(eb("Mảnh 4") + h2("Hook: bảo vệ<br><span class='acc'>đứng ở cổng</span>") + gap(28) +
    term("guard.py  ·  chạy trước mỗi lệnh", "git push             <span class='r'>✕ CHẶN</span>\nxoá cả thư mục       <span class='r'>✕ CHẶN</span>\nđọc db.config.json   <span class='r'>✕ CHẶN</span>\ncurl, wget           <span class='y'>? HỎI BẠN</span>\nkb_search            <span class='g'>✓ CHO QUA</span>") + gap(24) +
    p("Hook là một script chạy <b>trước</b> mỗi lệnh của Claude. Nó không dựa vào lời hứa của AI.") + GROW,
    "Mảnh bốn là hook, một script chạy trước mỗi lệnh. Ghi git, xoá hàng loạt hay đọc file mật khẩu đều bị chặn.",
    "Mảnh 4: Hook. Một script chạy trước mỗi lệnh của Claude. Ghi git, xoá hàng loạt, đọc file mật khẩu đều bị chặn.",
    ("stack", "MẢNH 4: *HOOK*", "Script chạy *trước mỗi lệnh*, chặn việc nguy hiểm", [("shield", "Chặn ghi git"), ("lock", "Chặn file mật khẩu"), ("check", "Cho qua tra cứu")]))

add(eb("Ráp lại") + h2("Một lệnh,<br><span class='acc'>cài cả bốn.</span>") + gap(28) +
    term("Terminal", "<span class='a'>&gt;</span> <span class='w'>python setup/setup.py</span>\n\n<span class='g'>✓</span> Tạo môi trường Python\n<span class='g'>✓</span> Cài skill /kb-update\n<span class='g'>✓</span> Gắn hook bảo vệ\n<span class='g'>✓</span> Đăng ký MCP server\n<span class='g'>✓</span> Viết CLAUDE.md") + gap(24) +
    p("Chạy lại bao nhiêu lần cũng được. Máy đồng nghiệp chỉ cần đúng lệnh này.") + gap(14) +
    chips("Cũng cài được cho", "Codex", "Copilot", "Grok") + GROW,
    "Cả bốn mảnh được cài bằng đúng một lệnh. Máy đồng nghiệp chạy lệnh đó là giống hệt máy mình.",
    "Cả 4 mảnh được cài bằng một lệnh duy nhất. Máy đồng nghiệp chạy đúng lệnh đó là giống hệt máy mình.",
    ("hub", "MỘT LỆNH, *CÀI CẢ BỐN*", "Máy nào chạy cũng ra *cùng một cấu hình*", [("laptop", "setup.py"), ("document", "CLAUDE.md"), ("api", "MCP"), ("book", "Skill"), ("shield", "Hook")]))

add(eb("Ticket #4827, lần ba") + h2("Lần này, Claude<br><span class='ok'>tự mở kho.</span>") + gap(28) +
    chat("Phiên mới", "Thứ Năm · 09:10", ("me", "Vì sao đơn đã thanh toán mà không sang kho?"),
         ("Claude", "<span class='mono' style='font-size:25px;color:#969dad'>kb_search(“đơn không sang kho”)</span><br>Theo trang <b>flows/dong-bo-don-sang-kho.md</b>: đơn được gửi lại tối đa 3 lần, hết lượt thì ghi vào bảng <b>OrderSyncErrors</b>. Mình mở file kho trỏ tới để kiểm tra.")) +
    GROW + p("Không ai nhắc. Việc đầu tiên Claude làm là <b>tra kho</b>."),
    "Giờ hỏi lại ticket cũ, việc đầu tiên Claude làm là tra kho, rồi mới mở đúng file mà kho trỏ tới.",
    "Ráp đủ 4 mảnh: mở phiên mới, việc đầu tiên Claude làm là tra kho, rồi mới mở đúng file cần xem.",
    ("flow", "CLAUDE *TỰ MỞ KHO*", "Tra kho trước, rồi mới *mở đúng file*", [("person", "Bạn hỏi"), ("book", "Tra kho"), ("code", "Mở đúng file")]))

add(eb("Bạn làm thử") + h2("Bắt đầu từ<br><span class='acc'>mảnh số 1</span>") + gap(28) +
    stack(sign("1", "Tạo CLAUDE.md ở gốc repo"), sign("2", "Viết 5 điều bạn hay phải nhắc AI nhất"),
          sign("3", "Thêm mục lục: việc gì thì đọc file nào")) + GROW +
    p("Mất khoảng 15 phút. Chưa cần MCP, skill hay hook."),
    "Bạn có thể bắt đầu từ mảnh một: tạo file CLAUDE.md, viết năm điều hay phải nhắc AI, và một mục lục ngắn.",
    "Bạn làm thử: tạo CLAUDE.md ở gốc repo, viết 5 điều hay phải nhắc AI nhất, thêm một mục lục ngắn. Khoảng 15 phút.",
    ("stack", "BẮT ĐẦU TỪ *MẢNH 1*", "Chưa cần MCP hay hook, chỉ cần *một file*", [("document", "Tạo CLAUDE.md"), ("check", "Viết 5 luật"), ("book", "Thêm mục lục")]))

add(nextslide(3, "Một trang tài liệu,<br>hai kiểu người đọc", "QA không đọc code. Claude không đọc được suy nghĩ. Vậy viết một trang thế nào cho <b>cả hai cùng hiểu</b>?"),
    "Ở phần ba, mình chỉ cách viết một trang tài liệu mà cả QA lẫn Claude đều đọc được.",
    "Phần 3: viết một trang tài liệu thế nào để cả QA lẫn Claude đều đọc được? Follow CodeLens để xem tiếp.")

PART = {"n": 2, "acc": "#4da3ff", "title": "4 mảnh ghép để Claude “ở” trong repo", "format": "howto",
        "hook": "Có kho kiến thức rồi, sao Claude vẫn đi đoán?", "concept": "CLAUDE.md, MCP, skill, hook",
        "slides": S, "trailer": [0, 1, 6, 7, 9],
        "caption": """Bạn viết tài liệu rất kỹ, rồi AI... không thèm mở ra đọc 👇

Có kho kiến thức mới là một nửa. Nửa còn lại là làm cho Claude tự biết dùng nó. Mình ráp 4 mảnh:

👉 CLAUDE.md: tờ nội quy, Claude tự đọc ở mọi phiên
👉 MCP: bộ công cụ để Claude tự tra kho
👉 Skill: quy trình viết sẵn, gõ một lệnh là chạy
👉 Hook: bảo vệ đứng cổng, chặn lệnh nguy hiểm

Cả bốn cài bằng một lệnh. Máy đồng nghiệp chạy đúng lệnh đó là xong.

Bạn chưa cần làm hết. Bắt đầu từ mảnh 1, mất khoảng 15 phút (xem ảnh 9).

Bạn đang dùng mảnh nào rồi? Bình luận cho mình biết 👇

#codelens #claude #claudecode #AI #laptrinh"""}

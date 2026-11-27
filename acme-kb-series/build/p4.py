from lib import *

S = []
def add(html, narr, cap, sc=None): S.append({"html": html, "narr": narr, "cap": cap, "sc": sc})

add(eb("Dùng Claude để lập trình · Phần 4/7") +
    h1("Dạy AI nói<br><span class='acc'>“tôi không<br>biết”</span>") + GROW +
    '<div class="quote" style="font-size:52px">Câu trả lời sai thì dễ thấy. Câu trả lời <span class="acc">gần đúng</span> mới nguy hiểm.</div>' + gap(30) +
    lead("3 nhãn giúp AI tự khai độ tin cậy."),
    "Có kho rồi vẫn chưa yên. Hỏi một thứ kho chưa viết, AI sẽ lấy trang gần giống nhất và trả lời như thật.",
    "Câu trả lời sai thì dễ thấy. Câu trả lời gần đúng mới nguy hiểm. Mình dạy AI nói 'tôi không biết' thế nào? 👉",
    ("title", "DẠY AI NÓI *KHÔNG BIẾT*", "Câu trả lời *gần đúng* mới là câu nguy hiểm", [("robot", ""), ("warning", ""), ("book", "")]))

add(eb("Chuyện xảy ra") + h2("Kho thiếu.<br><span class='acc'>AI mượn tạm.</span>") + gap(24) +
    chat("Hỏi về job hoàn tiền", "14:02", ("me", "RefundSyncJob chạy thế nào?"),
         ("Claude", "Theo tài liệu <b>đồng bộ đơn</b>, job sẽ thử lại 3 lần rồi ghi vào bảng lỗi…")) + gap(22) +
    grid(2, kc(None, "Kho có", "Trang về <b>OrderSyncJob</b> (đồng bộ đơn)"), kc(None, "Bạn hỏi", "<b>RefundSyncJob</b> (hoàn tiền). Chưa ai viết.", True)) + GROW +
    p("Hai job tên gần giống nhau. Câu trả lời nghe rất thuyết phục, và <b>không ai kiểm chứng</b>."),
    "Ví dụ mình hỏi về job hoàn tiền, mà kho chỉ có trang về job đồng bộ đơn. Claude mượn tạm trang đó.",
    "Hỏi về job hoàn tiền, kho chỉ có trang về job đồng bộ đơn. Claude mượn tạm trang gần giống, trả lời nghe vẫn rất thuyết phục.",
    ("compare", "KHO THIẾU, AI *MƯỢN TẠM*", "Hỏi job hoàn tiền, nhận câu trả lời của *job khác*", [("document", "Kho: đồng bộ đơn"), ("warning", "Hỏi: hoàn tiền")]))

add(eb("Bước 1 · tìm cho chuẩn") + h2("Tìm bằng<br><span class='acc'>hai con mắt</span>") + gap(24) +
    grid(2, kc(None, "Từ khoá", "Khớp đúng tên riêng: <span class='mono'>OrderSyncErrors</span>"),
         kc(None, "Ý nghĩa", "“đơn không sang kho” ≈ “đồng bộ thất bại”")) + gap(16) +
    kc(None, "Trộn hai bảng xếp hạng thành một", "Trang nào được cả hai mắt chọn thì lên đầu.", True) + gap(22) +
    chips("*Chạy hoàn toàn trên máy", "*Không tốn phí API") + GROW +
    p("Tìm trượt ngay từ đầu thì phía sau có cẩn thận mấy cũng vô ích."),
    "Đầu tiên là tìm cho chuẩn. Kho tìm theo từ khoá và theo ý nghĩa cùng lúc, rồi trộn kết quả.",
    "Bước 1: tìm cho chuẩn. Kho tìm theo từ khoá và theo ý nghĩa cùng lúc, rồi trộn kết quả. Chạy hoàn toàn trên máy, không tốn phí.",
    ("flow", "TÌM BẰNG *HAI CÁCH*", "Từ khoá và ý nghĩa, *trộn làm một*", [("key", "Từ khoá"), ("search", "Ý nghĩa"), ("check", "Trộn kết quả")]))

add(eb("Nhãn 1 và 2") + h2("Mỗi kết quả tự khai<br><span class='acc'>độ tin cậy</span>") + gap(24) +
    stack('<div class="res"><div class="pth">flows/dong-bo-don-sang-kho.md</div><div class="sn">Đơn được gửi lại tối đa 3 lần…</div><div class="bd"><span class="bdg ai">AI viết · chưa ai duyệt</span></div></div>',
          '<div class="res"><div class="pth">troubleshooting/loi-kho.md</div><div class="sn">Timeout khi gọi API kho…</div><div class="bd"><span class="bdg stale">⚠ CŨ: 3 commit chưa xem lại</span></div></div>',
          '<div class="res"><div class="pth">systems/order-service.md</div><div class="sn">Ứng dụng nhận và xử lý đơn…</div><div class="bd"><span class="bdg good">Người đã duyệt · còn mới</span></div></div>') + GROW +
    p("Claude đọc nhãn và biết <b>nên tin trang nào đến đâu</b>."),
    "Mỗi kết quả tự khai độ tin cậy. Trang AI viết mà chưa ai duyệt thì có nhãn. Trang mà code đã đổi thì bị đánh dấu cũ.",
    "Nhãn 1: 'AI viết, chưa ai duyệt'. Nhãn 2: 'đã cũ', khi code đổi sau lần kiểm tra cuối. Claude đọc nhãn và biết nên tin đến đâu.",
    ("stack", "KẾT QUẢ *TỰ KHAI*", "Ai viết, ai duyệt, *còn mới hay đã cũ*", [("robot", "AI viết, chưa duyệt"), ("clock", "Đã cũ"), ("check", "Người đã duyệt")]))

add(eb("Nhãn 3 · quan trọng nhất") + h2("Kho chưa có?<br><span class='acc'>Nói thẳng.</span>") + gap(24) +
    term("kb_search", "<span class='a'>&gt;</span> <span class='w'>RefundSyncJob chạy thế nào?</span>\n\n<span class='y'>⚠ KB gap:</span> RefundSyncJob có trong code,\nnhưng chưa trang nào trong kho nhắc tới.\n\n<span class='g'>Hãy đọc code:</span> Refund/RefundSyncJob.cs\n\n<span class='d'>2 kết quả rút gọn · chỉ là chủ đề lân cận</span>") + gap(22) +
    p("Công cụ biết cái tên này <b>có trong code</b> nhờ danh mục script quét ở phần 3.") + GROW,
    "Quan trọng nhất: hỏi một cái tên có trong code mà kho chưa viết, công cụ báo thẳng là kho còn thiếu, và chỉ đúng file cần đọc.",
    "Nhãn 3: hỏi một cái tên có trong code mà kho chưa viết, công cụ báo thẳng 'kho còn thiếu' và chỉ Claude đi đọc đúng file.",
    ("flow", "KHO THIẾU? *NÓI THẲNG*", "Báo *kho còn thiếu* và chỉ đúng file cần đọc", [("search", "Hỏi tên lạ"), ("warning", "Báo kho thiếu"), ("code", "Đọc đúng file")]))

add(eb("Hỏi lạc đề") + h2("Không có thì<br><span class='acc'>trả về tay trắng</span>") + gap(24) +
    term("kb_search", "<span class='a'>&gt;</span> <span class='w'>cách nấu phở bò</span>\n\n<span class='d'>No KB match</span>") + gap(22) +
    p("Công cụ tìm kiếm nào cũng có thể trả về “10 kết quả gần nhất”. Nhưng với AI, một kết quả không liên quan là <b>một cái cớ để bịa</b>.") + GROW,
    "Còn hỏi lạc đề thì công cụ trả về không có kết quả, chứ không cố nhét một trang cho có.",
    "Hỏi lạc đề thì công cụ trả về 'không có kết quả'. Với AI, một kết quả không liên quan là một cái cớ để bịa.",
    ("compare", "KHÔNG CÓ? *TAY TRẮNG*", "Không cố nhét *một kết quả cho có*", [("cross", "Kết quả gần nhất"), ("check", "Không có kết quả")]))

add(eb("Giữ cho tìm kiếm không tệ đi") + h2("AI trả lời tệ?<br><span class='acc'>Thêm một bài kiểm tra.</span>", 64) + gap(24) +
    term("Terminal", "<span class='a'>&gt;</span> <span class='w'>python tools/eval_search.py</span>\n\n<span class='d'>đo trên bộ câu hỏi thật:</span>\n  hit@1     <span class='d'>đúng ngay kết quả đầu</span>\n  hit@3     <span class='d'>đúng trong 3 kết quả đầu</span>\n  coverage  <span class='d'>độ phủ</span>\n  tokens    <span class='d'>tốn bao nhiêu chữ</span>") + gap(22) +
    p("Mỗi lần một câu hỏi thật bị trả lời tệ, mình thêm nó vào bộ này. Chỉnh xong thuật toán thì chạy lại.") + GROW,
    "Mỗi lần một câu hỏi thật bị trả lời tệ, mình thêm nó vào bộ kiểm tra, để lần chỉnh sau không làm hỏng lại.",
    "Mỗi lần một câu hỏi thật bị trả lời tệ, mình thêm nó vào bộ kiểm tra. Chỉnh thuật toán xong thì chạy lại cả bộ.",
    ("flow", "TRẢ LỜI TỆ? *THÊM TEST*", "Câu hỏi thật thành *bài kiểm tra* cho tìm kiếm", [("bug", "Trả lời tệ"), ("document", "Thêm vào bộ test"), ("chart", "Đo lại")]))

add(eb("Bạn làm thử") + h2("3 nhãn cho công cụ<br><span class='acc'>AI của bạn</span>") + gap(24) +
    stack(sign("1", "Ai viết, ai duyệt", "AI viết mà chưa ai xem thì phải ghi rõ"),
          sign("2", "Còn mới hay đã cũ", "Code đổi sau lần kiểm tra cuối là cũ"),
          sign("3", "“Chưa có tài liệu”", "Thay vì đưa ra kết quả gần giống")) + GROW +
    p("Áp dụng được cho mọi thứ bạn đưa cho AI đọc: wiki, RAG, tài liệu nội bộ."),
    "Bạn có thể thêm ba nhãn này vào bất cứ thứ gì đưa cho AI đọc: ai duyệt, mới hay cũ, và chưa có tài liệu.",
    "Bạn làm thử: thêm 3 nhãn này vào bất cứ thứ gì bạn đưa cho AI đọc, từ wiki đến RAG nội bộ.",
    ("stack", "BA NHÃN *NÊN CÓ*", "Dùng được cho wiki, RAG, *tài liệu nội bộ*", [("person", "Ai viết, ai duyệt"), ("clock", "Mới hay cũ"), ("warning", "Chưa có tài liệu")]))

add(nextslide(5, "Cho AI nhìn vào<br>database production", "Tài liệu nói đơn được thử lại 3 lần. Nhưng <b>đơn này</b> thì sao? Muốn chắc, phải nhìn dữ liệu thật."),
    "Ở phần năm, mình cho Claude nhìn vào database production, mà vẫn ngủ ngon.",
    "Phần 5: cho AI nhìn vào database production mà vẫn ngủ ngon. Follow CodeLens để xem tiếp.")

PART = {"n": 4, "acc": "#b07cff", "title": "Dạy AI nói “tôi không biết”", "format": "concept",
        "hook": "AI trả lời gần đúng còn nguy hiểm hơn trả lời sai?", "concept": "Nhãn tin cậy cho kết quả tìm kiếm",
        "slides": S, "trailer": [0, 1, 4, 7, 8],
        "caption": """AI trả lời sai thì bạn thấy ngay. AI trả lời gần đúng thì bạn tin 👇

Mình hỏi về job hoàn tiền, kho kiến thức chỉ có trang về job đồng bộ đơn. Claude mượn tạm trang gần giống và trả lời rất thuyết phục.

Mình chặn chuyện đó bằng 3 nhãn trên mỗi kết quả tìm kiếm:

👉 "AI viết, chưa ai duyệt": biết ai đứng sau nội dung
👉 "Đã cũ": code đã đổi sau lần kiểm tra cuối
👉 "Kho còn thiếu": cái tên có trong code nhưng chưa ai viết, hãy đi đọc code

Hỏi lạc đề thì trả về tay trắng, không cố nhét một kết quả cho có.

Ba nhãn này dùng được cho mọi thứ bạn đưa cho AI đọc, kể cả wiki hay RAG nội bộ.

Bạn từng bị AI trả lời "gần đúng" lần nào chưa? Kể mình nghe 👇

#codelens #claude #AI #RAG #laptrinh"""}

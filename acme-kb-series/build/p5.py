from lib import *

S = []
def add(html, narr, cap, sc=None): S.append({"html": html, "narr": narr, "cap": cap, "sc": sc})

add(eb("Dùng Claude để lập trình · Phần 5/7") +
    h1("Cho AI nhìn<br>vào database<br><span class='acc'>production.</span>") + gap(30) +
    lead("Và vẫn ngủ ngon.") + GROW + ticket() + gap(24) +
    p("Tài liệu nói đơn được thử lại 3 lần. Nhưng <b>đơn A-10293</b> thì sao?"),
    "Tài liệu nói đơn được thử lại ba lần. Nhưng đơn này thì sao? Muốn chắc, Claude phải nhìn dữ liệu thật trên production.",
    "Cho AI nhìn vào database production mà vẫn ngủ ngon, làm thế nào? Vuốt để xem 4 lớp mình dùng 👉",
    ("title", "AI NHÌN VÀO *PRODUCTION*", "Xem dữ liệu thật, mà vẫn *ngủ ngon*", [("robot", ""), ("database", ""), ("shield", "")]))

add(eb("Nghe đã thấy sợ") + h2("3 nỗi sợ khi<br><span class='acc'>AI chạm vào DB</span>") + gap(26) +
    stack(sign("1", "AI chạy nhầm UPDATE, DELETE", "Một câu lệnh là mất dữ liệu thật"),
          sign("2", "Truy vấn nặng làm khoá bảng", "Khách đang đặt hàng thì hệ thống đứng"),
          sign("3", "Mật khẩu, API key lọt vào chat", "Lọt rồi thì không lấy lại được")) + GROW +
    p("Nên nhiều team chọn cách dễ nhất: <b>cấm hẳn</b>. Và AI lại phải đoán."),
    "Nghe là thấy sợ. AI có thể ghi nhầm dữ liệu, làm khoá bảng, hoặc để lộ mật khẩu vào khung chat.",
    "3 nỗi sợ khi AI chạm vào database: ghi nhầm dữ liệu, truy vấn nặng làm khoá bảng, mật khẩu lọt vào chat.",
    ("stack", "BA *NỖI SỢ*", "Ghi nhầm, khoá bảng, *lộ mật khẩu*", [("cross", "Ghi nhầm dữ liệu"), ("lock", "Khoá bảng"), ("key", "Lộ mật khẩu")]))

add(eb("Cách mình làm") + h2("4 lớp <span class='acc'>chỉ-đọc</span>") + gap(22) +
    '<div class="ring" style="--o:25%"><div class="rl"><b>1</b>Chỉ nhận đúng một câu SELECT</div>'
    '<div class="ring" style="--o:45%"><div class="rl"><b>2</b>Bảng nào cũng phải đọc không khoá (NOLOCK)</div>'
    '<div class="ring" style="--o:70%"><div class="rl"><b>3</b>Phiên chỉ-đọc, chờ khoá tối đa 5 giây</div>'
    '<div class="ring" style="--o:100%"><div class="rl"><b>4</b>Chạy trong transaction, luôn rollback</div>'
    '<div class="core">Database production</div></div></div></div></div>' + GROW +
    p("Một lớp sót thì còn ba lớp sau."),
    "Mình bọc database bằng bốn lớp. Chỉ nhận một câu SELECT. Phải đọc không khoá. Phiên làm việc chỉ đọc. Và luôn rollback.",
    "4 lớp chỉ-đọc bọc quanh database: chỉ nhận SELECT, bắt buộc đọc không khoá, phiên chỉ-đọc, và luôn rollback. Sót một lớp vẫn còn ba.",
    ("stack", "BỐN LỚP *CHỈ ĐỌC*", "Sót một lớp thì *còn ba lớp sau*", [("check", "Chỉ SELECT"), ("door", "Đọc không khoá"), ("lock", "Phiên chỉ đọc"), ("clock", "Luôn rollback")]))

add(eb("Thử lách xem") + h2("Sai luật là<br><span class='acc'>bị từ chối ngay</span>") + gap(24) +
    term("db_query", "<span class='w'>UPDATE Orders SET Synced = 1 …</span>\n<span class='r'>✕ Từ chối: chỉ nhận SELECT</span>\n\n<span class='w'>SELECT * FROM Orders</span>\n<span class='r'>✕ Từ chối: thiếu WITH (NOLOCK)</span>\n\n<span class='w'>SELECT … FROM OrderSyncErrors\n  WITH (NOLOCK) WHERE OrderId = 10293</span>\n<span class='g'>✓ [env: prod]  3 dòng</span>") + gap(22) +
    chips("Tối đa 50 dòng mỗi lần", "Luôn ghi rõ môi trường") + GROW,
    "Câu lệnh ghi bị từ chối ngay ở công cụ. Kết quả tối đa năm mươi dòng, và luôn ghi rõ đang ở môi trường nào.",
    "Câu lệnh ghi bị từ chối ngay. Quên đọc không khoá cũng bị từ chối. Kết quả tối đa 50 dòng và luôn ghi rõ đang ở môi trường nào.",
    ("code", "SAI LUẬT, *TỪ CHỐI NGAY*", "Câu lệnh ghi *không bao giờ* tới được database", [],
     {"code": "UPDATE Orders SET Synced = 1\n!!-- từ chối: chỉ nhận SELECT\n\nSELECT * FROM OrderSyncErrors\n  WITH (NOLOCK)\n  WHERE OrderId = 10293\n-- [env: prod] 3 dòng", "codeTitle": "db_query"}))

add(eb("Bí mật") + h2("Che ngay cả khi<br><span class='acc'>lỡ lọt qua</span>") + gap(24) +
    term("db_query", "<span class='w'>SELECT PasswordHash FROM Users …</span>\n<span class='r'>✕ Từ chối: cột bí mật</span>\n\n<span class='w'>SELECT * FROM Partners WITH (NOLOCK)</span>\n<span class='d'>Name      ApiKey   Config</span>\nKho Bắc   <span class='y'>***</span>      {\"token\": \"<span class='y'>***</span>\"}") + gap(22) +
    stack(rw("→", "Hỏi thẳng cột bí mật: từ chối"), rw("→", "Lọt qua SELECT *: che thành ***"), rw("→", "Token nằm trong chuỗi: cũng che")) + GROW,
    "Hỏi thẳng cột mật khẩu thì bị từ chối. Lỡ lọt qua thì bị che thành dấu sao, kể cả token nằm trong chuỗi.",
    "Hỏi thẳng cột mật khẩu: từ chối. Lỡ lọt qua SELECT *: che thành ***. Token nằm trong chuỗi cũng bị che.",
    ("stack", "BÍ MẬT *BỊ CHE*", "Hỏi thẳng thì từ chối, lọt qua thì *che lại*", [("cross", "Từ chối cột bí mật"), ("lock", "Che thành dấu sao"), ("key", "Che cả token")]))

add(eb("Mật khẩu database") + h2("Không nằm trong chat.<br><span class='acc'>Không nằm trong git.</span>", 66) + gap(26) +
    ck((True, "Bạn tự gõ mật khẩu trong terminal của mình"), (True, "Lưu dạng mã hoá, chỉ tài khoản Windows của bạn trên máy này mở được"),
       (True, "Hook chặn mọi lệnh cố đọc file cấu hình"), (False, "Không bao giờ dán mật khẩu vào khung chat với AI")) + GROW +
    p("AI dùng được kết nối, nhưng <b>không bao giờ nhìn thấy mật khẩu</b>."),
    "Mật khẩu database thì mình tự gõ trong terminal. Nó được mã hoá, và hook chặn mọi lệnh cố đọc file cấu hình.",
    "Mật khẩu database: tự gõ trong terminal, lưu dạng mã hoá, hook chặn mọi lệnh cố đọc. AI dùng được kết nối nhưng không thấy mật khẩu.",
    ("flow", "MẬT KHẨU *NGOÀI CHAT*", "AI dùng kết nối, *không thấy mật khẩu*", [("person", "Bạn tự gõ"), ("lock", "Mã hoá"), ("shield", "Hook chặn đọc")]))

add(eb("Điều quan trọng nhất") +
    '<div class="quote">Chốt chặn thật là <span class="acc">quyền của tài khoản database.</span></div>' + gap(34) +
    grid(2, kc(None, "Chỉ được đọc", "Tài khoản riêng cho AI, không có quyền ghi"), kc(None, "Cấm cột bí mật", "Cấm ngay ở database, nhờ DBA cài")) + gap(22) +
    p("Bốn lớp ở trên là <b>phòng hờ</b>. Kể cả khi tất cả cùng hỏng, tài khoản này vẫn không ghi được gì.") + GROW +
    p("Và xem dữ liệu luôn là bước <b>cuối cùng</b>, sau khi đã đọc tài liệu."),
    "Nhưng chốt chặn thật vẫn là quyền của tài khoản database: chỉ được đọc. Mấy lớp kia chỉ là phòng hờ.",
    "Chốt chặn thật là quyền của tài khoản database: chỉ được đọc, cấm hẳn cột bí mật. Các lớp khác chỉ là phòng hờ.",
    ("hub", "CHỐT CHẶN *THẬT*", "Tài khoản *chỉ được đọc*, cấm cột bí mật", [("database", "Tài khoản DB"), ("check", "Chỉ đọc"), ("cross", "Cấm cột bí mật")]))

add(eb("Bạn làm thử") + h2("Checklist trước khi<br><span class='acc'>cho AI chạm DB</span>") + gap(24) +
    ck((True, "Tài khoản riêng, chỉ có quyền đọc"), (True, "Công cụ chỉ nhận SELECT, có giới hạn số dòng"),
       (True, "Không khoá bảng, có giới hạn thời gian chờ"), (True, "Che cột bí mật trong kết quả"), (True, "Mật khẩu không nằm trong chat hay git")) + GROW +
    p("Thiếu mục đầu tiên thì bốn mục sau chưa đủ."),
    "Trước khi cho AI chạm vào database, bạn kiểm tra năm việc này. Thiếu việc đầu tiên thì bốn việc sau chưa đủ.",
    "Bạn làm thử: checklist 5 mục trước khi cho AI chạm vào database. Lưu lại để dùng nhé 🔖",
    ("stack", "CHECKLIST *NĂM MỤC*", "Thiếu mục đầu thì *bốn mục sau chưa đủ*", [("key", "Tài khoản chỉ đọc"), ("check", "Chỉ SELECT"), ("clock", "Có giới hạn"), ("lock", "Che bí mật")]))

add(nextslide(6, "23 giờ, tài liệu<br>tự viết lại", "Hai tuần sau, code đổi. Tài liệu đứng yên. Kho bắt đầu <b>nói dối</b>, và AI tin nó."),
    "Ở phần sáu, mình chỉ cách để tài liệu tự cập nhật mỗi đêm, trong lúc mình ngủ.",
    "Phần 6: tài liệu tự cập nhật lúc 23 giờ, trong lúc bạn ngủ. Follow CodeLens để xem tiếp.")

PART = {"n": 5, "acc": "#2ed3b0", "title": "Cho AI nhìn vào database production", "format": "architecture",
        "hook": "Bạn có dám cho AI chạy truy vấn trên production không?", "concept": "Truy vấn chỉ-đọc nhiều lớp",
        "slides": S, "trailer": [0, 1, 2, 6, 8],
        "caption": """Bạn có dám cho AI chạy truy vấn trên database production không? 👇

Mình dám, vì AI phải đi qua 4 lớp trước khi chạm được vào dữ liệu:

👉 Chỉ nhận đúng một câu SELECT
👉 Bảng nào cũng phải đọc không khoá
👉 Phiên làm việc chỉ-đọc, chờ tối đa 5 giây
👉 Mọi thứ chạy trong transaction và luôn rollback

Cột mật khẩu, API key thì bị từ chối hoặc che thành ***. Mật khẩu database mình tự gõ trong terminal, không bao giờ dán vào chat.

Nhưng chốt chặn thật vẫn là quyền của tài khoản database: chỉ được đọc. Mấy lớp kia chỉ là phòng hờ.

Checklist 5 mục ở ảnh 8, bạn lưu lại dùng nhé.

Team bạn đang cho AI truy cập dữ liệu ở mức nào? 👇

#codelens #claude #AI #database #baomat"""}

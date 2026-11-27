from lib import *

S = []
def add(html, narr, cap, sc=None): S.append({"html": html, "narr": narr, "cap": cap, "sc": sc})

add(eb("Dùng Claude để lập trình · Phần 6/7") +
    '<div class="mono acc" style="font-size:150px;font-weight:800;line-height:1">23:00</div>' +
    h1("Tài liệu tự<br>viết lại.") + gap(24) + lead("Còn bạn thì đi ngủ.") + GROW +
    '<div class="quote" style="font-size:46px">Kho kiến thức có một kẻ thù: <span class="acc">thời gian.</span></div>',
    "Kho kiến thức có một kẻ thù: thời gian. Hai tuần sau, code đổi, tài liệu thành sai, và AI lại tự tin đọc cái sai đó.",
    "23 giờ, tài liệu tự viết lại, còn bạn thì đi ngủ. Mình làm thế nào? Vuốt để xem 👉",
    ("title", "TÀI LIỆU *TỰ VIẾT LẠI*", "Mỗi đêm lúc *23 giờ*, trong lúc bạn ngủ", [("clock", ""), ("document", ""), ("robot", "")]))

add(eb("Hai tuần sau") + h2("Code đổi.<br><span class='acc'>Tài liệu đứng yên.</span>") + gap(24) +
    term("OrderSyncJob.cs  ·  commit mới", "<span class='r'>-   Retry(order, 3);</span>\n<span class='g'>+   Retry(order, 5);</span>") + gap(18) +
    '<div class="doc"><div class="sec" style="margin-top:0">## Business view</div><ul><li>Gửi lỗi thì thử lại <b>3 lần</b>.</li></ul><div class="side" style="top:-18px;right:24px">vẫn ghi 3</div></div>' + GROW +
    p("Từ giây phút đó, kho bắt đầu <b>nói dối</b>. Và Claude tin kho hơn tin code."),
    "Ví dụ ai đó sửa số lần thử lại từ ba lên năm. Trang tài liệu vẫn ghi ba. Từ giây phút đó, kho bắt đầu nói dối.",
    "Ai đó sửa số lần thử lại từ 3 lên 5. Tài liệu vẫn ghi 3. Từ giây phút đó, kho kiến thức bắt đầu nói dối.",
    ("before-after", "CODE ĐỔI, *KHO ĐỨNG YÊN*", "Code ghi 5 lần, tài liệu *vẫn ghi 3*", [("code", "Code: 5 lần", "L"), ("document", "Kho: 3 lần", "R")], {"left": "CODE", "right": "TÀI LIỆU"}))

add(eb("Bước 1") + h2("Biết trang nào<br><span class='acc'>đã cũ</span>") + gap(24) +
    grid(2, kc("sources:", None, "OrderSyncJob.cs<br><span class='mono'>verified: 20/11</span>"), kc("git log", None, "OrderSyncJob.cs<br><span class='mono'>commit: 25/11</span>", True)) + gap(16) +
    '<div class="res"><div class="pth">flows/dong-bo-don-sang-kho.md</div><div class="bd"><span class="bdg stale">⚠ CŨ: 1 commit chưa xem lại</span></div></div>' + gap(22) +
    term("Mở Claude lên là thấy", "<span class='y'>1 trang đã cũ. Chạy /kb-update</span>") + GROW +
    p("Nhờ mỗi trang ghi rõ nó dựa trên file nào, việc so sánh là <b>tự động</b>."),
    "Nhờ mỗi trang ghi rõ nó dựa trên file nào, một script so với lịch sử git và biết ngay trang nào đã cũ.",
    "Bước 1: mỗi trang ghi rõ nó dựa trên file code nào. Script so với lịch sử git là biết ngay trang nào đã cũ.",
    ("flow", "BIẾT TRANG *ĐÃ CŨ*", "So *file nguồn* của trang với lịch sử git", [("document", "Trang ghi nguồn"), ("clock", "So với git"), ("warning", "Báo trang cũ")]))

add(eb("Bước 2 · mỗi đêm") + h2("Ca đêm của <span class='acc'>Claude</span>") + gap(24) +
    '<div class="tl"><div><span class="tm">23:00</span>Chạy test của chính bộ công cụ<small>Test hỏng thì dừng, không cho AI chạy</small></div>'
    '<div><span class="tm">tiếp theo</span>Lập danh sách trang đã cũ</div>'
    '<div><span class="tm">song song</span>3 worker Claude, mỗi worker một nhóm trang<small>Trang nào không cần sửa thì không đụng tới</small></div>'
    '<div><span class="tm">sau cùng</span>1 integrator gom lại<small>Sửa mục lục, viết trang mới cho luồng mới</small></div>'
    '<div><span class="tm">kết thúc</span>Dựng lại chỉ mục tìm kiếm, viết báo cáo</div></div>' + GROW,
    "Mỗi đêm, một job tự chạy. Nó chạy test trước, rồi giao cho ba worker Claude cập nhật song song, và một integrator gom lại.",
    "Bước 2: mỗi đêm 23 giờ, job chạy test trước, lập danh sách trang cũ, giao 3 worker Claude cập nhật song song, rồi 1 integrator gom lại.",
    ("flow", "CA ĐÊM *CỦA CLAUDE*", "Test trước, *3 worker* song song, 1 integrator", [("check", "Chạy test"), ("group", "3 worker"), ("manager", "Integrator"), ("document", "Báo cáo")]))

add(eb("Không ai canh") + h2("Nên ca đêm<br><span class='acc'>bị trói tay</span>") + gap(24) +
    ck((True, "Đọc code ở mọi repo"), (True, "Sửa file trong thư mục kho"), (False, "Commit, push, pull"),
       (False, "Chạm vào database"), (False, "Lên mạng, gọi agent phụ")) + gap(20) +
    chips("Mỗi worker có trần ngân sách") + GROW +
    p("Việc gì không ai xem thì quyền phải <b>hẹp hơn</b> ban ngày."),
    "Vì không ai canh, ca đêm bị trói tay. Nó được sửa trong kho, nhưng không được commit, không đụng database, không lên mạng.",
    "Ca đêm không ai canh nên bị trói tay: được đọc code và sửa trong kho, không được commit, không đụng database, không lên mạng.",
    ("compare", "CA ĐÊM *BỊ TRÓI TAY*", "Không ai canh thì quyền phải *hẹp hơn*", [("check", "Đọc, sửa trong kho"), ("cross", "Commit, database")]))

add(eb("Buổi sáng") + h2("Pha cà phê,<br><span class='acc'>đọc báo cáo</span>") + gap(24) +
    '<div class="doc"><h4 style="font-size:34px">Báo cáo đêm qua</h4>'
    '<div class="sec">Đã sửa</div>flows/dong-bo-don-sang-kho.md<br><span style="opacity:.6">Số lần thử lại: 3 → 5</span>'
    '<div class="sec">Không đổi</div>4 trang đã xem, nội dung còn đúng'
    '<div class="sec">Chờ bạn duyệt</div>1 trang do AI sửa<div class="side" style="top:-18px;right:24px">ví dụ</div></div>' + GROW +
    p("Trang nào sửa, <b>vì sao</b> sửa, trang nào còn cũ, trang nào chờ duyệt."),
    "Sáng ra mình đọc báo cáo: trang nào đã sửa và vì sao, trang nào đang chờ mình duyệt.",
    "Sáng ra đọc báo cáo: trang nào đã sửa và vì sao, trang nào còn cũ, trang nào đang chờ bạn duyệt.",
    ("stack", "SÁNG RA *ĐỌC BÁO CÁO*", "Sửa gì, vì sao, và *trang nào chờ duyệt*", [("document", "Đã sửa"), ("check", "Còn đúng"), ("person", "Chờ bạn duyệt")]))

add(eb("Nguyên tắc") + h2("AI sửa.<br><span class='acc'>Người duyệt.</span>") + gap(26) +
    stack(rw("1", "AI sửa trang", "Trang mang nhãn “AI · chưa duyệt”"), rw("2", "Bạn xem phần thay đổi", "git diff đúng trang đó"),
          rw("3", "Bạn bấm duyệt", "Nhãn biến mất"), rw("4", "Bạn tự commit", "Job không bao giờ commit thay bạn")) + GROW +
    p("AI làm phần nặng. Chữ ký cuối cùng vẫn là <b>của người</b>."),
    "Trang AI sửa đều mang nhãn chưa duyệt. Mình xem phần thay đổi, bấm duyệt, rồi tự tay commit.",
    "Nguyên tắc: AI sửa, người duyệt. Trang AI sửa mang nhãn 'chưa duyệt' cho tới khi bạn xem và tự tay commit.",
    ("flow", "AI SỬA, *NGƯỜI DUYỆT*", "Job *không bao giờ* tự commit", [("robot", "AI sửa"), ("search", "Bạn xem diff"), ("check", "Bạn duyệt"), ("key", "Bạn commit")]))

add(eb("Bạn làm thử") + h2("Chưa cần job đêm.<br><span class='acc'>Chỉ cần biết trang<br>nào đang nói dối.</span>", 66) + gap(24) +
    stack(sign("1", "Ghi nguồn cho mỗi trang", "Trang này dựa trên những file code nào"),
          sign("2", "Ghi ngày kiểm tra cuối", "Một dòng ở đầu trang là đủ"),
          sign("3", "Viết script hỏi git", "File nguồn có commit mới sau ngày đó không?")) + GROW +
    p("Ba bước này làm được trong một buổi chiều."),
    "Bạn chưa cần job đêm. Chỉ cần ghi nguồn và ngày kiểm tra cho mỗi trang, rồi viết một script hỏi git.",
    "Bạn làm thử: ghi nguồn và ngày kiểm tra cho mỗi trang, rồi viết script hỏi git. Một buổi chiều là biết trang nào đang nói dối.",
    ("stack", "BẮT ĐẦU *TỪ NHỎ*", "Chỉ cần biết trang nào *đang nói dối*", [("document", "Ghi nguồn"), ("clock", "Ghi ngày kiểm tra"), ("code", "Script hỏi git")]))

add(nextslide(7, "Dán một dòng lỗi,<br>biết ngay nó ở đâu", "Phần cuối: ticket quay lại đúng lúc đang trực. Lần này mình <b>không mở code</b>."),
    "Ở phần cuối, kho kiến thức trở thành công cụ trực sự cố: dán một dòng lỗi là biết nó ở đâu.",
    "Phần 7, phần cuối: dán một dòng lỗi, biết ngay nó ở đâu. Follow CodeLens để xem tiếp.")

PART = {"n": 6, "acc": "#ff5fa2", "title": "23 giờ, tài liệu tự viết lại", "format": "howto",
        "hook": "Tài liệu của bạn còn đúng được bao lâu sau khi viết?", "concept": "Tự cập nhật tài liệu, người duyệt",
        "slides": S, "trailer": [0, 1, 3, 6, 8],
        "caption": """Tài liệu viết xong thì đúng được bao lâu? Thường là tới lần sửa code kế tiếp 👇

Kho kiến thức có một kẻ thù là thời gian. Code đổi, tài liệu đứng yên, và AI tin tài liệu hơn tin code.

Mình xử lý bằng hai bước:

👉 Mỗi trang ghi rõ nó dựa trên file code nào. Script so với lịch sử git là biết trang nào đã cũ
👉 Mỗi đêm 23 giờ, một job giao cho 3 worker Claude cập nhật các trang cũ, rồi viết báo cáo

Ca đêm bị trói tay: không commit, không đụng database, không lên mạng.

Sáng ra mình đọc báo cáo, xem phần thay đổi, bấm duyệt và tự tay commit. AI sửa, người duyệt.

Bạn chưa cần job đêm. Ba bước bắt đầu nằm ở ảnh 8.

Tài liệu team bạn lần cuối được cập nhật là khi nào? 👇

#codelens #claude #AI #tailieu #tudonghoa"""}

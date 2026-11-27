"""Dựng một phần của series acme-kb từ nội dung trong pN.py.

  python lib.py gen N     viết slides/phan-N.html, caption, trailer và kịch bản CodeLens
  python lib.py voice N   tạo giọng đọc (cần server CodeLens ở cổng 5173) và trang clip
"""
import importlib, json, os, re, subprocess, sys, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
SLIDES = os.path.join(ROOT, "slides")
EXAMPLE = os.path.join(os.path.dirname(ROOT), "examples", "acme-kb-series.json")
SERIES = "Mình dùng Claude để lập trình: acme-kb"
TOTAL = 7

# ---------- khối HTML ----------
GROW = '<div class="grow"></div>'
def gap(n): return f'<div style="height:{n}px"></div>'
def eb(t): return f'<div class="eyebrow">{t}</div>'
def h1(t, size=None): return f'<h1{"" if not size else f" style=font-size:{size}px"}>{t}</h1>'
def h2(t, size=None): return f'<h2{"" if not size else f" style=font-size:{size}px"}>{t}</h2>'
def lead(t): return f'<p class="lead">{t}</p>'
def p(t): return f'<p class="p">{t}</p>'
def ticket(meta=False, title="Khách đã thanh toán, nhưng kho không nhận được đơn.", pri="Khẩn"):
    m = '<div class="tk-meta"><span>Acme Shop · đơn A-10293</span><span>mở lúc 08:12</span></div>' if meta else ""
    return (f'<div class="ticket{"" if meta else " sm"}"><div class="tk-top"><span>TICKET #4827</span>'
            f'<span class="tk-pri">{pri}</span></div><div class="tk-title">{title}</div>{m}</div>')
def chat(title, when, *bubbles):
    b = "".join(f'<div class="bub me">{t}</div>' if who == "me" else
                f'<div class="bub ai"><div class="who"><i></i>{who}</div>{t}</div>' for who, t in bubbles)
    return f'<div class="chat"><div class="chat-h"><span>{title}</span><span>{when}</span></div><div class="chat-b">{b}</div></div>'
def term(title, body): return f'<div class="term"><div class="tb"><i></i><i></i><i></i>{title}</div><pre>{body}</pre></div>'
def kc(k=None, t=None, v=None, hi=False):
    return (f'<div class="kc{" hi" if hi else ""}">' + (f'<div class="k">{k}</div>' if k else "") +
            (f'<div class="t">{t}</div>' if t else "") + (f'<div class="v">{v}</div>' if v else "") + "</div>")
def grid(n, *items): return f'<div class="g{n}">' + "".join(items) + "</div>"
def stack(*items): return '<div class="stackc">' + "".join(items) + "</div>"
def rw(num, text, small=None): return f'<div class="rw"><span class="num">{num}</span><span>{text}{f"<small>{small}</small>" if small else ""}</span></div>'
def sign(n, h, d=None): return f'<div class="sign"><div class="n">{n}</div><div><div class="h">{h}</div>{f"<div class=d>{d}</div>" if d else ""}</div></div>'
def dirs(*rows): return '<div class="dir">' + "".join(f'<div{" class=dimd" if len(r) > 2 else ""}><b>{r[0]}</b><span>{r[1]}</span></div>' for r in rows) + "</div>"
def ck(*rows): return '<div class="ck">' + "".join(f'<div class="{"y" if ok else "n"}"><i>{"✓" if ok else "✕"}</i><span>{t}</span></div>' for ok, t in rows) + "</div>"
def chips(*items): return '<div class="tabs">' + "".join(f'<span{" class=on" if i.startswith("*") else ""}>{i.lstrip("*")}</span>' for i in items) + "</div>"
def flow(*items): return '<div class="fl">' + "<i>→</i>".join(f'<span{" class=hi" if i.startswith("*") else ""}>{i.lstrip("*")}</span>' for i in items) + "</div>"
def nextslide(n, title, line):
    return (eb("Phần sau · sắp đăng") + f'<div class="nextbox"><div class="n">PHẦN {n}/{TOTAL}</div><div class="t">{title}</div></div>' +
            gap(36) + lead(line) + GROW + '<div class="cta"><span>Follow CodeLens để xem tiếp</span><span>→</span></div>')

# ---------- trang ảnh carousel ----------
HEAD = """<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"><title>acme-kb · {title}</title>
<link rel="stylesheet" href="style.css"><link rel="stylesheet" href="kit.css">
<style>body{{--acc:{acc}}}.fitc{{display:flex;flex-direction:column;width:928px}}.fitc>*{{flex-shrink:0}}{css}</style></head><body>
"""
def gen_slides(P):
    n = P["n"]
    out = HEAD.format(title=f"Phần {n}", acc=P["acc"], css="")
    for i, s in enumerate(P["slides"]):
        out += f'<section class="s" id="s{i+1}"><div class="fitc">\n{s["html"]}\n</div></section>\n'
    out += """<script>
  window.FITTED = false;
  // Phóng nội dung mỗi ảnh cho đầy khung 928×1070 mà không tràn
  document.fonts.ready.then(() => {
    document.querySelectorAll(".fitc").forEach(w => {
      const box = w.parentNode.getBoundingClientRect();
      for (let z = 1.3; z >= 1; z -= 0.02) {
        w.style.zoom = z; w.style.width = 928 / z + "px"; w.style.height = "auto";
        const r = w.getBoundingClientRect();
        if (r.bottom <= box.top + 1220 || z <= 1.001) { w.style.height = 1070 / z + "px"; break; }
      }
    });
    window.FITTED = true;
  });
  const S = [...document.querySelectorAll(".s")], n = S.length;
  S.forEach((s, i) => {
    const dots = S.map((_, j) => `<b class="${j === i ? "on" : ""}"></b>`).join("");
    s.insertAdjacentHTML("afterbegin", `<div class="top"><div class="brand"><i></i>CODELENS</div><div>acme-kb · ${String(i + 1).padStart(2, "0")}/${String(n).padStart(2, "0")}</div></div>`);
    s.insertAdjacentHTML("beforeend", `<div class="bot"><div class="dots">${dots}</div><div class="swipe">${i < n - 1 ? "Vuốt →" : "%s"}</div></div>`);
  });
</script></body></html>
""" % ("Hết series" if n == TOTAL else f"Hết phần {n}")
    open(os.path.join(SLIDES, f"phan-{n}.html"), "w").write(out)

# ---------- trang clip / trailer: mỗi ảnh thành một cảnh động ----------
MOVIE_CSS = """
body{width:1080px;height:1920px;overflow:hidden;background:var(--bg)}
.bgfx{position:absolute;inset:0;background:radial-gradient(1100px 900px at 105% -5%,color-mix(in srgb,var(--acc) 28%,transparent),transparent 60%),radial-gradient(900px 800px at -15% 105%,color-mix(in srgb,var(--acc) 14%,transparent),transparent 60%)}
.gridbg{position:absolute;inset:0;background-image:linear-gradient(#ffffff08 1px,transparent 1px),linear-gradient(90deg,#ffffff08 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(180deg,#000,transparent 75%)}
.brandbar{position:absolute;left:76px;right:76px;top:110px;display:flex;justify-content:space-between;font-size:28px;font-weight:600;color:var(--mut);letter-spacing:.04em}
.prog{position:absolute;left:76px;right:76px;top:170px;height:6px;border-radius:6px;background:#ffffff14;overflow:hidden}
.prog i{display:block;height:100%;width:0;background:var(--acc)}
.sc{position:absolute;left:0;right:0;top:230px;height:1230px;display:flex;align-items:center;justify-content:center;animation:sc var(--d) linear var(--a) both}
.sc.last{animation-name:sclast}
.fit{width:928px;display:flex;flex-direction:column}
.fit>*{flex-shrink:0}
.fit .grow{height:34px;flex:none}
@keyframes sc{0%{opacity:0}4%{opacity:1}96%{opacity:1}100%{opacity:0}}
@keyframes sclast{0%{opacity:0}4%{opacity:1}100%{opacity:1}}
.in{animation:in .7s cubic-bezier(.2,.8,.2,1) calc(var(--a) + var(--t)) both}
@keyframes in{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:none}}
#sub{position:absolute;left:60px;right:60px;top:1490px;height:150px;display:flex;align-items:center;justify-content:center;text-align:center}
#sub span{background:#000000cc;border-radius:20px;padding:14px 28px;font-size:40px;font-weight:700;line-height:1.3;color:#fff}
"""
MOVIE_JS = """
const CLIP = %s;
const scs = [...document.querySelectorAll(".sc")];
scs.forEach((el, i) => {
  const c = CLIP.scenes[i]; el.style.setProperty("--a", c.a + "s"); el.style.setProperty("--d", c.d + "s");
  const kids = [...el.querySelector(".fit").children].filter(k => !k.classList.contains("grow"));
  const step = Math.min(CLIP.step, Math.max(0.3, (c.d - 2.6) / kids.length));
  kids.forEach((k, j) => { k.classList.add("in"); k.style.setProperty("--t", (0.15 + j * step).toFixed(2) + "s"); });
});
const subs = CLIP.scenes.flatMap(s => s.subs || []), sub = document.querySelector("#sub span"), bar = document.getElementById("bar");
let fitted = false;
window.DURATION = CLIP.total;
window.render = t => {
  if (!fitted) { // phóng mỗi cảnh cho vừa khung, sau khi font đã nạp
    fitted = true;
    document.querySelectorAll(".sc").forEach(sc => {
      const f = sc.querySelector(".fit"), o = sc.style.animation; sc.style.animation = "none"; sc.style.opacity = 1;
      const box = sc.getBoundingClientRect();
      for (let z = 1.5; z >= 0.6; z -= 0.02) { f.style.zoom = z; f.style.width = 968 / z + "px"; if (f.getBoundingClientRect().height <= box.height) break; }
      sc.style.animation = o; sc.style.opacity = "";
    });
  }
  document.getAnimations().forEach(a => { a.pause(); a.currentTime = t * 1000; });
  const s = subs.find(x => t >= x.from && t < x.to + 0.15);
  sub.textContent = s ? s.text : ""; sub.parentNode.style.visibility = s ? "visible" : "hidden";
  bar.style.width = Math.min(100, t / CLIP.total * 100) + "%%";
};
"""
def gen_movie(P, name, idx, clip, right):
    n = P["n"]
    out = HEAD.format(title=name, acc=P["acc"], css=MOVIE_CSS)
    out += f'<div class="bgfx"></div><div class="gridbg"></div>\n<div class="brandbar"><div class="brand"><i></i>CODELENS</div><div>{right}</div></div>\n<div class="prog"><i id="bar"></i></div>\n'
    for k, i in enumerate(idx):
        out += f'<div class="sc{" last" if k == len(idx) - 1 else ""}"><div class="fit">\n{P["slides"][i]["html"]}\n</div></div>\n'
    out += '<div id="sub"><span></span></div>\n<script>' + MOVIE_JS % json.dumps(clip, ensure_ascii=False) + "</script></body></html>\n"
    open(os.path.join(SLIDES, f"{name}.html"), "w").write(out)

def gen_trailer(P):
    idx = P["trailer"]; t = 0; scenes = []
    for k in range(len(idx)):
        d = 4.0 if k < len(idx) - 1 else 5.0
        scenes.append({"a": round(t, 2), "d": d}); t += d
    gen_movie(P, f"trailer-phan-{P['n']}", idx, {"total": round(t, 2), "step": 0.5, "scenes": scenes}, f"Series · Phần {P['n']}/{TOTAL}")

# ---------- giọng đọc ----------
SAY = [("acme-kb", "Acme K B"), ("CLAUDE.md", "Claude chấm M D"), ("/kb-update", "K B update"), ("MCP", "M C P"), ("QA", "Q A"),
       ("SELECT", "select"), ("git", "ghít"), ("API", "A P I")]
def narrations(P):
    last = P["slides"][-1]
    return [s["narr"] for s in P["slides"][:-1]] + [last["narr"] + (" Follow CodeLens để không bỏ lỡ nhé." if P["n"] < TOTAL else "")]
def voice(P):
    n = P["n"]; V = os.path.join(os.environ.get("SCRATCH", "/tmp"), f"voice{n}"); os.makedirs(V, exist_ok=True)
    LEAD, TAIL = 0.3, 0.45; scenes = []; t0 = 0; texts = narrations(P)
    for i, text in enumerate(texts):
        say = text
        for a, b in SAY: say = say.replace(a, b)
        mp3 = f"{V}/{i+1}.mp3"
        req = urllib.request.Request("http://127.0.0.1:5173/api/tts", data=json.dumps({"text": say}).encode(), headers={"Content-Type": "application/json"})
        open(mp3, "wb").write(urllib.request.urlopen(req, timeout=120).read())
        a = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", mp3], capture_output=True, text=True).stdout)
        d = round(LEAD + a + TAIL, 2)
        parts = [x.strip() for x in re.split(r'(?<=[.?!,:])\s+', text) if x.strip()]; lines = []; cur = ""
        for x in parts:
            if cur and len(cur) + len(x) + 1 > 52: lines.append(cur); cur = x
            else: cur = (cur + " " + x).strip()
        if cur: lines.append(cur)
        tot = sum(map(len, lines)); tt = t0 + LEAD; subs = []
        for l in lines:
            dd = a * len(l) / tot; subs.append({"from": round(tt, 2), "to": round(tt + dd, 2), "text": l}); tt += dd
        scenes.append({"a": round(t0, 2), "d": d, "subs": subs}); t0 += d
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", mp3, "-af", f"adelay={int(LEAD*1000)}:all=1,apad", "-t", str(d), "-ar", "44100", "-ac", "2", f"{V}/s{i+1}.wav"], check=True)
    open(f"{V}/list.txt", "w").write("".join(f"file '{V}/s{i+1}.wav'\n" for i in range(len(texts))))
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", f"{V}/list.txt", "-c", "copy", f"{V}/voice.wav"], check=True)
    gen_movie(P, f"clip-phan-{n}", list(range(len(P["slides"]))), {"total": round(t0, 2), "step": 1.1, "scenes": scenes}, f"acme-kb · Phần {n}/{TOTAL}")
    print(f"phần {n}: clip {round(t0, 1)} giây" + ("  ⚠ dài hơn 90 giây" if t0 > 90 else ""))

# ---------- caption và kịch bản CodeLens ----------
def gen_caption(P):
    n = P["n"]; out = f"PHẦN {n}: {P['title'].upper()}\n\n=== CAPTION BÀI ĐĂNG ===\n\n{P['caption'].strip()}\n\n=== CHÚ THÍCH TỪNG ẢNH ===\n"
    for i, s in enumerate(P["slides"]): out += f"\n{i+1:02d}.png\n{s['cap']}\n"
    open(os.path.join(HERE, f"caption-phan-{n}.txt"), "w").write(out)

def gen_script(P):
    n = P["n"]; scenes = []; body = [s for s in P["slides"] if s.get("sc")]
    for k, s in enumerate(body):
        layout, heading, subtitle, actors = s["sc"][:4]; extra = s["sc"][4] if len(s["sc"]) > 4 else {}
        acts = [{"icon": a[0], "label": a[1], "side": a[2] if len(a) > 2 else ""} for a in actors]
        links = [{"from": i, "to": i + 1, "label": ""} for i in range(len(acts) - 1)] if layout == "flow" else \
                [{"from": 0, "to": i, "label": ""} for i in range(1, len(acts))] if layout == "hub" else []
        sc = {"part": "intro" if k == 0 else "outro" if k == len(body) - 1 else "body", "layout": layout, "duration": 4, "heading": heading,
              "subtitle": subtitle, "narration": s["narr"], "actors": acts, "links": links, "focus": 0 if layout == "hub" else -1, "mark": None,
              "left": "", "right": "", "code": "", "codeTitle": ""}
        sc.update(extra)
        assert len(heading) <= 90 and len(subtitle) <= 140 and len(s["narr"]) <= 600, heading
        assert all(len(a["label"]) <= 40 for a in acts) and len(acts) <= 6
        assert all(len(l) <= 46 for l in sc["code"].split("\n")) and sc["code"].count("\n") < 9, heading
        scenes.append(sc)
    script = {"id": f"acme-kb-p{n}", "title": f"Mình dùng Claude để lập trình (Phần {n}): {P['title']}", "topic": "Kho kiến thức cho AI trong repo",
              "category": "AI", "format": P["format"], "hook": P["hook"], "metaphor": "Ticket: khách đã thanh toán nhưng kho không nhận được đơn, trong hệ thống đặt hàng giả định của Acme",
              "concept": P["concept"], "status": "draft", "createdBy": "user", "reviewed": False, "reviewNotes": [],
              "series": {"id": "acme-kb-series", "title": SERIES, "part": n, "total": TOTAL},
              "nextTeaser": P["slides"][-1]["narr"] if n < TOTAL else "", "scenes": scenes}
    d = json.load(open(EXAMPLE)); d["scripts"] = [x for x in d["scripts"] if x["id"] != script["id"]] + [script]
    d["scripts"].sort(key=lambda x: x["series"]["part"])
    json.dump(d, open(EXAMPLE, "w"), ensure_ascii=False, indent=1)
    tot = sum(len(x) for x in narrations(P))
    print(f"phần {n}: {len(P['slides'])} ảnh, {len(scenes)} cảnh, lời đọc {tot} ký tự ≈ {round(tot/13)} giây")

if __name__ == "__main__":
    cmd, n = sys.argv[1], int(sys.argv[2])
    sys.path.insert(0, HERE)
    P = importlib.import_module(f"p{n}").PART
    if cmd == "gen": gen_slides(P); gen_trailer(P); gen_caption(P); gen_script(P)
    elif cmd == "voice": voice(P)

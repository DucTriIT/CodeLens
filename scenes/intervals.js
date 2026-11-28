// Simulation scene "intervals": intervals drawn as bars over a number line, one bar per row, so the viewer sees
// where they overlap. Under the bars a green "Kết quả" row shows the answer built so far (merged or kept intervals).
// Scene data: items [[start, end] | [start, end, "label"]], optional extra [start, end] (the interval to insert).
// Step state: at, hi, dim (item indexes; the extra interval has index items.length), out [[start, end]],
// clash [start, end], ptr {name: x}, extra [start, end] (the new interval after it grew; carries over).
(function () {
  const MAX_ITEMS = 8, MAX_PTR = 3;
  const NUM = /^\s*-?\d+(\.\d+)?\s*$/;
  // A number with at most one decimal, or null. Only real numbers and numeric strings count (+[] and +null do not).
  const num = (v) => {
    if (typeof v === "string" ? !NUM.test(v) : typeof v !== "number") return null;
    const x = Math.round(+v * 10) / 10;
    return Number.isFinite(x) ? Math.min(9999, Math.max(-999, x)) : null;
  };
  // One interval from [s, e], [s, e, label], {start, end}, "1-3" or "[1,3]". Returns [s, e] with s <= e, or null.
  function pair(v) {
    let a = null, b = null;
    if (Array.isArray(v)) { if (v.length === 2 || v.length === 3) { a = num(v[0]); b = num(v[1]); } }
    else if (v && typeof v === "object") { a = num(v.start ?? v.s ?? v.from ?? v.l); b = num(v.end ?? v.e ?? v.to ?? v.r); }
    else if (typeof v === "string") {
      const m = v.match(/(-?\d+(?:\.\d+)?)\s*(?:,|-|–|:|\.\.|to)\s*(-?\d+(?:\.\d+)?)/);
      if (m) { a = num(m[1]); b = num(m[2]); }
    }
    if (a == null || b == null) return null;
    return a <= b ? [a, b] : [b, a];
  }
  // A list of intervals from an array, a JSON string or "1-3, 2-6". withLabel keeps a short third element.
  function list(v, withLabel, h) {
    if (typeof v === "string") {
      try { v = JSON.parse(v); } catch (e) { v = v.match(/-?\d+(?:\.\d+)?\s*(?:,|-|–|:|\.\.|to)\s*-?\d+(?:\.\d+)?/g) || []; }
    }
    if (!Array.isArray(v)) return [];
    if (v.length >= 2 && v.length <= 3 && num(v[0]) != null && num(v[1]) != null) v = [v]; // a single bare [s, e]
    const res = [];
    for (const it of v) {
      const p = pair(it); if (!p) continue;
      if (withLabel) {
        const raw = Array.isArray(it) ? it[2] : it && typeof it === "object" ? it.label ?? it.name : "";
        const lb = typeof raw === "string" || typeof raw === "number" ? h.str(raw, 6) : "";
        if (lb) p.push(lb);
      }
      res.push(p); if (res.length >= MAX_ITEMS) break;
    }
    return res;
  }
  const fmt = (p, label) => (label ? label + " " : "") + "[" + p[0] + "," + p[1] + "]";

  const S = (say, o) => Object.assign({ say }, o);
  const heap = (items) => ({ kind: "heap", name: "heap", items });

  (window.__codelensSimDefs = window.__codelensSimDefs || []).push(["intervals", {
    label: "Mô phỏng khoảng trên trục số (gộp khoảng, phòng họp)",
    when: "các khoảng [đầu, cuối] trên trục số: gộp khoảng, chèn khoảng, lịch họp và số phòng họp, bỏ khoảng chồng lấn (greedy theo điểm cuối), giao của hai danh sách khoảng, bắn bóng bay.",
    prompt: "MÔ PHỎNG các khoảng thành thanh ngang trên một trục số để người xem THẤY chỗ chồng lấn. \"items\": tối đa 8 khoảng [[đầu, cuối]] hoặc [[đầu, cuối, \"nhãn\"]] (số nguyên hoặc một chữ số thập phân; nhãn ngắn như \"A\", \"B\" khi có hai danh sách), viết ĐÚNG thứ tự code duyệt, tức ĐÃ SẮP XẾP theo tiêu chí của lời giải; có \"box\" thì tối đa 5 khoảng. \"extra\": [đầu, cuối] CHỈ dùng khi bài có một khoảng mới cần chèn; nó mang chỉ số bằng số khoảng trong \"items\". Mỗi bước có: \"at\": chỉ số khoảng đang xét hoặc null; \"hi\": [chỉ số các khoảng đang giữ hoặc đang so sánh]; \"dim\": [chỉ số các khoảng đã xử lý xong hoặc bị loại]; \"out\": [[đầu, cuối]] TOÀN BỘ kết quả tính đến bước này (các khoảng đã gộp, hoặc tập được giữ lại), vẽ thành hàng \"Kết quả\" và tự dài ra khi một khoảng được nới (bài chỉ đếm, như số phòng họp, thì bỏ \"out\"); \"clash\": [đầu, cuối] đoạn trục mà hai khoảng đang chồng nhau (tô đỏ), chỉ đặt ở bước phát hiện chồng lấn; \"ptr\": {\"end\": 6} tối đa 3 vạch dọc có tên tại một vị trí trên trục (mốc end, đường quét). Mỗi bước là trạng thái ĐẦY ĐỦ, không cộng dồn từ bước trước; riêng \"extra\" đặt trong một bước (giá trị mới của khoảng cần chèn sau khi nới) thì được giữ cho các bước sau. Tách bước phát hiện chồng lấn (có \"clash\") khỏi bước gộp hoặc loại. Ví dụ: \"items\": [[1,3],[2,6],[8,10]], \"steps\": [{\"say\": \"…\", \"at\": 1, \"dim\": [0], \"out\": [[1,3]], \"clash\": [2,3], \"ptr\": {\"end\": 3}}, {\"say\": \"…\", \"at\": 1, \"dim\": [0], \"out\": [[1,6]], \"ptr\": {\"end\": 6}}].",
    review: "Thứ tự \"items\" phải đúng là thứ tự code duyệt (đã sắp xếp theo đúng tiêu chí của lời giải). Ở mỗi bước, \"out\" phải đúng là kết quả tính đến lúc đó, \"clash\" chỉ xuất hiện khi hai khoảng thật sự chồng nhau và đúng bằng đoạn giao, vị trí các vạch \"ptr\" và các giờ kết thúc trong \"box\" phải khớp với biến trong code.",
    dataHint: "{\"items\": [[1,3],[2,6],[8,10],[15,18]]}; các khoảng viết theo thứ tự thuật toán duyệt, có thể thêm nhãn [1,3,\"A\"]. Bài chèn khoảng thêm \"extra\": [4,8].",
    stepHint: "{\"at\": 1, \"hi\": [], \"dim\": [0], \"out\": [[1,3]], \"clash\": [2,3], \"ptr\": {\"end\": 3}}; \"out\" là hàng kết quả, \"clash\" là đoạn chồng lấn tô đỏ, khoảng \"extra\" mang chỉ số bằng số khoảng trong \"items\"",
    fields: ["items", "extra"],

    norm(sc, h) {
      sc = sc && typeof sc === "object" ? sc : {};
      const out = { items: list(sc.items ?? sc.intervals ?? sc.list, true, h) };
      const ex = pair(sc.extra ?? sc.newInterval ?? sc.insert);
      if (ex) out.extra = ex;
      return out;
    },

    normStep(st, data, h) {
      st = st && typeof st === "object" ? st : {};
      const n = ((data && data.items) || []).length, hasX = !!(data && data.extra);
      const idx = (v) => {
        if (v === "extra" || v === "new") return hasX ? n : null;
        const x = num(v);
        return x != null && Number.isInteger(x) && x >= 0 && x < n + (hasX ? 1 : 0) ? x : null;
      };
      const idxList = (v) => {
        const a = Array.isArray(v) ? v : typeof v === "string" ? v.split(/[\s,]+/) : v == null ? [] : [v];
        return [...new Set(a.map(idx).filter(x => x != null))];
      };
      const ptr = {}; const src = st.ptr ?? st.pointers ?? st.markers ?? st.lines;
      if (src && typeof src === "object") {
        (Array.isArray(src) ? src.map(o => [o && (o.name ?? o.label), o && (o.x ?? o.at ?? o.value)]) : Object.entries(src)).forEach(([k, v]) => {
          const name = h.str(k, 6), x = num(v);
          if (name && x != null && Object.keys(ptr).length < MAX_PTR) ptr[name] = x;
        });
      }
      const res = {
        at: idx(st.at ?? st.cur ?? st.i), hi: idxList(st.hi ?? st.highlight), dim: idxList(st.dim ?? st.done ?? st.removed),
        out: list(st.out ?? st.result ?? st.res ?? st.merged, false, h), clash: pair(st.clash ?? st.overlap ?? st.conflict), ptr,
      };
      const ex = hasX ? pair(st.extra ?? st.newInterval) : null;
      if (ex) res.extra = ex;
      return res;
    },

    draw(c, sc, f, h) {
      const { COL, FONT, MONO, clamp, lerp } = h;
      const A = f.area, items = Array.isArray(sc.items) ? sc.items : [], n = items.length;
      const X0 = Array.isArray(sc.extra) ? sc.extra : null;
      if (!A || (!n && !X0)) return;
      const steps = Array.isArray(f.steps) ? f.steps : [], st = f.st || {}, pr = f.pr || st;
      const u = clamp(f.u == null ? 1 : f.u, 0, 1), k = f.k || 0;
      // the new interval as of step j: the latest step up to j that set "extra", else the scene's
      const exAt = (j) => { for (let i = Math.min(j, steps.length - 1); i >= 0; i--) if (steps[i] && steps[i].extra) return steps[i].extra; return X0; };
      const exNow = X0 ? exAt(k) : null, exPrev = X0 ? (steps[k - 1] ? exAt(k - 1) : exNow) : null;

      // axis range over everything any step shows, so the scale never changes during the scene
      let lo = Infinity, hi = -Infinity;
      const see = (p) => { if (p) { lo = Math.min(lo, p[0]); hi = Math.max(hi, p[1]); } };
      items.forEach(see); see(X0); steps.forEach(s => { if (X0) see(s.extra); (s.out || []).forEach(see); });
      lo = Math.floor(lo); hi = Math.ceil(hi); if (hi <= lo) hi = lo + 1;
      const pad = 36, axW = A.w - pad * 2;
      const X = (v) => A.x + pad + (clamp(v, lo, hi) - lo) / (hi - lo) * axW;

      // named marker lines: each label sits above the rows near its line; labels that would collide are spread sideways
      const order = [...new Set(steps.flatMap(s => Object.keys(s.ptr || {})))];
      const spread = (a, gapX) => { // a: [{cx, w}] sorted by cx; keeps them apart and inside the area
        a.forEach((t, j) => { t.cx = Math.max(t.cx, (j ? a[j - 1].cx + a[j - 1].w / 2 + gapX : A.x + 4) + t.w / 2); });
        for (let j = a.length - 1; j >= 0; j--) a[j].cx = Math.min(a[j].cx, (a[j + 1] ? a[j + 1].cx - a[j + 1].w / 2 - gapX : A.x + A.w - 4) - a[j].w / 2);
        return a;
      };
      const ptrLay = (s) => {
        c.font = `800 34px ${FONT}`;
        return spread(order.map((nm, oi) => ({ nm, oi, v: (s.ptr || {})[nm] })).filter(p => p.v !== undefined)
          .map(p => ({ ...p, text: `${p.nm}=${p.v}`, cx: X(p.v) })).map(p => ({ ...p, w: c.measureText(p.text).width })).sort((p, q) => p.cx - q.cx || p.oi - q.oi), 18);
      };

      // vertical layout: [marker labels] [extra row] [item rows] [result caption + row] [axis]
      const rowsN = n + (X0 ? 1 : 0), anyOut = steps.some(s => (s.out || []).length);
      // (the result row keeps its endpoints on a line of text under its bars: result bars are often too close for labels beside them)
      const topPad = order.length ? 72 : 8, axisH = 62, capH = anyOut ? 48 : 0, lblH = anyOut ? 44 : 0;
      const units = rowsN + (anyOut ? 1 : 0);
      const rowH = Math.min(124, (A.h - topPad - axisH - capH - lblH) / units);
      const top = A.y + (A.h - (topPad + rowH * units + capH + lblH + axisH)) / 2 + topPad;
      const gap = clamp(rowH * 0.2, 6, 22), bh = rowH - gap, rad = Math.min(16, bh / 2.5);
      const rowOf = (i) => i === n ? 0 : i + (X0 ? 1 : 0);          // the extra interval takes the first row
      const rowY = (r) => top + r * rowH + gap / 2;
      const outY = top + rowsN * rowH + capH + gap / 2;
      const axisY = top + units * rowH + capH + lblH + 12;
      const fs = clamp(Math.round(bh * 0.46), 24, 40);

      // ticks: the smallest step whose labels do not touch
      c.font = `500 26px ${MONO}`;
      const tickW = Math.max(c.measureText(String(lo)).width, c.measureText(String(hi)).width) + 18;
      const stepV = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000].find(s => s * axW / (hi - lo) >= tickW) || 5000;
      const ticks = []; for (let v = Math.ceil(lo / stepV) * stepV; v <= hi; v += stepV) ticks.push(v);
      c.strokeStyle = "rgba(140,155,181,0.16)"; c.lineWidth = 2;
      ticks.forEach(v => { c.beginPath(); c.moveTo(X(v), top - 4); c.lineTo(X(v), axisY); c.stroke(); });

      const texts = [], late = []; // bar labels are drawn last, over the clash band and the marker lines
      const barPath = (x0, x1, y) => { const w = Math.max(x1 - x0, 10); c.beginPath(); c.roundRect(x0, y, w, bh, Math.min(rad, w / 2)); return w; };
      const label = (text, x0, w, y, inCol, outCol, alpha) => texts.push({ text, x0, w, y: y + bh / 2 + 2, inCol, outCol, alpha });
      const has = (s, key, i) => (s[key] || []).includes(i);
      const mix = (a, b) => lerp(a ? 1 : 0, b ? 1 : 0, u);

      // item bars (and the extra interval, index n)
      for (let i = 0; i < rowsN; i++) {
        const isX = i === n, p = isX ? exNow : items[i], q = isX ? exPrev : p;
        const x0 = lerp(X(q[0]), X(p[0]), u), x1 = lerp(X(q[1]), X(p[1]), u), y = rowY(rowOf(i));
        const dimA = mix(has(pr, "dim", i), has(st, "dim", i)), atA = mix(pr.at === i, st.at === i), hiA = mix(has(pr, "hi", i), has(st, "hi", i));
        const alpha = 1 - 0.68 * dimA;
        c.save(); c.globalAlpha *= alpha;
        const w = barPath(x0, x1, y); c.fillStyle = COL.disk; c.fill();
        const wash = (a, col) => { if (a > 0) { c.save(); c.globalAlpha *= a; c.fillStyle = col; c.fill(); c.restore(); } };
        const ring = (a, col, lw) => { if (a > 0) { c.save(); c.globalAlpha *= a; c.strokeStyle = col; c.lineWidth = lw; c.stroke(); c.restore(); } };
        if (isX) wash(0.32, COL.violet);
        wash(hiA, "rgba(77,184,255,0.16)"); wash(atA, COL.orange);
        ring(1, isX ? COL.violet : "rgba(77,184,255,0.45)", isX ? 4 : 3); ring(hiA, COL.blue, 5); ring(atA, COL.orange, 3);
        c.restore();
        label(fmt(p, isX ? "mới" : p[2]), x0, w, y, atA > 0.5 ? COL.ink : COL.white, atA > 0.5 ? COL.orange : isX ? COL.violet : COL.white, alpha);
      }

      // result row: a bar that exists in the previous step slides from its old edges; a new bar grows from its start
      if (anyOut) {
        const so = [...(st.out || [])].sort((p, q) => p[0] - q[0]), po = pr.out || [];
        c.save(); c.beginPath(); c.roundRect(A.x + 4, outY - 8, A.w - 8, bh + lblH + 12, 18);
        c.globalAlpha *= 0.08; c.fillStyle = COL.green; c.fill(); c.globalAlpha *= 5; c.strokeStyle = COL.green; c.lineWidth = 2; c.stroke(); c.restore();
        if (!so.length) { c.font = `500 28px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = COL.muted; c.fillText("(chưa có)", A.x + A.w / 2, outY + (bh + lblH) / 2); }
        let lf = Math.min(fs, 30); c.font = `700 ${lf}px ${MONO}`;
        if (so.reduce((sum, o) => sum + c.measureText(fmt(o)).width + 12, 0) > A.w - 12) { lf = 24; c.font = `700 ${lf}px ${MONO}`; }
        const tags = spread(so.map(o => ({ text: fmt(o), w: c.measureText(fmt(o)).width, cx: X((o[0] + o[1]) / 2) })), 12);
        const same = (p, o) => p[0] === o[0] && p[1] === o[1], gone = po.filter(p => !so.some(o => same(p, o)));
        so.forEach((o, j) => {
          // where this bar comes from: itself, else a bar of the previous step that it replaces (same edge or overlapping)
          const m = po.find(p => same(p, o)) || gone.find(p => p[0] === o[0] || p[1] === o[1]) || gone.find(p => p[0] < o[1] && p[1] > o[0]);
          const x0 = X(m ? lerp(m[0], o[0], u) : o[0]), x1 = X(m ? lerp(m[1], o[1], u) : lerp(o[0], o[1], u));
          const fresh = !m || !same(m, o);
          c.save(); if (!m) c.globalAlpha *= u;
          barPath(x0, x1, outY); c.fillStyle = COL.green; c.fill();
          if (fresh) { c.strokeStyle = COL.white; c.lineWidth = 4; c.stroke(); }
          c.restore();
          late.push(() => { c.save(); if (!m) c.globalAlpha *= u; c.font = `700 ${lf}px ${MONO}`; c.textAlign = "center"; c.textBaseline = "middle";
            c.fillStyle = fresh ? COL.white : COL.green; c.fillText(tags[j].text, tags[j].cx, outY + bh + lblH / 2 + 2); c.restore(); });
        });
      }

      // clash: a red band over the stretch where two intervals overlap, spanning the rows involved
      let clashX = null;
      if (st.clash) {
        const [a, b] = st.clash, same = pr.clash && pr.clash[0] === a && pr.clash[1] === b;
        const touches = (p) => !!p && (a === b ? p[0] <= a && p[1] >= a : p[0] < b && p[1] > a);
        const geom = (i) => i === n ? exNow : items[i];
        const all = Array.from({ length: rowsN }, (_, i) => i), live = (i) => !has(st, "dim", i);
        const marked = [...new Set([st.at, ...(st.hi || []), X0 && live(n) ? n : null])].filter(i => i != null && i < rowsN);
        const outHit = anyOut && (st.out || []).some(touches);
        const span = (ids, withOut) => { const ys = ids.filter(i => touches(geom(i))).map(i => rowY(rowOf(i))); if (withOut && outHit) ys.push(outY); return ys; };
        let ys = span(marked, false);
        if (ys.length < 2) ys = span(marked, true);
        if (ys.length < 2) ys = span(all.filter(live), true);
        if (ys.length < 2) ys = [rowY(0), rowY(rowsN - 1)];
        let x0 = X(a), x1 = X(b); if (x1 - x0 < 12) { const m = (x0 + x1) / 2; x0 = m - 6; x1 = m + 6; }
        const y0 = Math.min(...ys) - 8, y1 = Math.max(...ys) + bh + 8;
        clashX = [x0, x1, same ? 1 : u];
        c.save(); c.globalAlpha *= clashX[2];
        c.save(); c.globalAlpha *= 0.34; c.fillStyle = COL.red; c.fillRect(x0, y0, x1 - x0, y1 - y0); c.restore();
        c.strokeStyle = COL.red; c.lineWidth = 4; c.beginPath(); c.moveTo(x0, y0); c.lineTo(x0, y1); c.moveTo(x1, y0); c.lineTo(x1, y1); c.stroke();
        c.restore();
      }

      // axis
      c.strokeStyle = COL.muted; c.lineWidth = 3; c.beginPath(); c.moveTo(X(lo) - 20, axisY); c.lineTo(X(hi) + 20, axisY);
      ticks.forEach(v => { c.moveTo(X(v), axisY); c.lineTo(X(v), axisY + 12); }); c.stroke();
      c.font = `500 26px ${MONO}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = COL.muted;
      ticks.forEach(v => c.fillText(String(v), X(v), axisY + 33));
      if (clashX) { c.save(); c.globalAlpha *= clashX[2]; c.strokeStyle = COL.red; c.lineWidth = 8; c.beginPath(); c.moveTo(clashX[0], axisY); c.lineTo(clashX[1], axisY); c.stroke(); c.restore(); }

      // marker lines slide from their previous position
      const cols = h.ptrCols(), pick = [2, 1, 3, 0], was = ptrLay(pr);
      ptrLay(st).forEach(p => {
        const old = was.find(q => q.nm === p.nm), x = old ? lerp(X(old.v), X(p.v), u) : X(p.v);
        const col = cols[pick[p.oi % 4] % cols.length];
        c.save(); if (!old) c.globalAlpha *= u;
        c.strokeStyle = col; c.lineWidth = 4; c.setLineDash([10, 10]); c.lineDashOffset = p.oi * 10;
        c.beginPath(); c.moveTo(x, top - 6); c.lineTo(x, axisY); c.stroke(); c.setLineDash([]);
        c.fillStyle = col; c.beginPath(); c.moveTo(x, top - 4); c.lineTo(x - 15, top - 26); c.lineTo(x + 15, top - 26); c.closePath(); c.fill();
        c.beginPath(); c.arc(x, axisY, 8, 0, Math.PI * 2); c.fill();
        c.font = `800 34px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
        c.fillText(p.text, old ? lerp(old.cx, p.cx, u) : p.cx, top - 48);
        c.restore();
      });

      // bar labels: inside the bar when they fit, otherwise beside it
      c.font = `700 ${fs}px ${MONO}`; c.textBaseline = "middle";
      texts.forEach(t => {
        const tw = c.measureText(t.text).width;
        c.save(); c.globalAlpha *= t.alpha;
        if (tw + 20 <= t.w) { c.textAlign = "center"; c.fillStyle = t.inCol; c.fillText(t.text, t.x0 + t.w / 2, t.y); }
        else if (t.x0 + t.w + 12 + tw <= A.x + A.w) { c.textAlign = "left"; c.fillStyle = t.outCol; c.fillText(t.text, t.x0 + t.w + 12, t.y); }
        else { c.textAlign = "right"; c.fillStyle = t.outCol; c.fillText(t.text, t.x0 - 12, t.y); }
        c.restore();
      });
      late.forEach(fn => fn());
      if (anyOut) { // the caption sits on a dark tag so bands and marker lines pass behind it
        c.font = `700 28px ${FONT}`; const tw = c.measureText("Kết quả").width, cy = outY - 32;
        c.save(); c.globalAlpha *= 0.88; c.fillStyle = COL.bg; c.beginPath(); c.roundRect(A.x + 4, cy - 20, tw + 24, 40, 12); c.fill(); c.restore();
        c.textAlign = "left"; c.textBaseline = "middle"; c.fillStyle = COL.green; c.fillText("Kết quả", A.x + 16, cy);
      }
    },

    samples: [
      { // LeetCode 56 Merge Intervals: the result row grows; no box, no vars
        heading: "GỘP *KHOẢNG* TRÙNG NHAU", subtitle: "LeetCode 56: sắp theo điểm đầu rồi gộp dần từ trái sang phải",
        narration: "Cùng chạy thuật toán gộp khoảng trên bốn khoảng đã sắp xếp.",
        items: [[1, 3], [2, 6], [8, 10], [15, 18]],
        steps: [
          S("Bốn khoảng đã được sắp theo điểm bắt đầu. Mình sẽ đi từ trên xuống và gom dần vào hàng kết quả bên dưới.", { out: [] }),
          S("Khoảng đầu tiên từ 1 đến 3. Kết quả đang rỗng nên mình đưa thẳng vào, và ghi nhớ điểm cuối hiện tại là 3.", { at: 0, out: [[1, 3]], ptr: { end: 3 } }),
          S("Khoảng từ 2 đến 6 bắt đầu ở 2, nhỏ hơn điểm cuối 3. Hai khoảng chồng nhau ở đoạn màu đỏ nên phải gộp lại.", { at: 1, dim: [0], out: [[1, 3]], clash: [2, 3], ptr: { end: 3 } }),
          S("Gộp tức là nới điểm cuối của khoảng trong kết quả ra số lớn hơn giữa 3 và 6. Bạn thấy thanh xanh dài ra tới 6.", { at: 1, dim: [0], out: [[1, 6]], ptr: { end: 6 } }),
          S("Khoảng từ 8 đến 10 bắt đầu ở 8, lớn hơn điểm cuối 6. Không chồng lên ai nên mình mở một khoảng mới trong kết quả.", { at: 2, dim: [0, 1], out: [[1, 6], [8, 10]], ptr: { end: 10 } }),
          S("Khoảng từ 15 đến 18 cũng bắt đầu sau điểm cuối 10, nên nó đứng riêng và được thêm vào kết quả.", { at: 3, dim: [0, 1, 2], out: [[1, 6], [8, 10], [15, 18]], ptr: { end: 18 } }),
          S("Duyệt xong cả bốn khoảng. Kết quả còn ba khoảng rời nhau, và mỗi khoảng chỉ được xem đúng một lần sau khi sắp xếp.", { dim: [0, 1, 2, 3], out: [[1, 6], [8, 10], [15, 18]] }),
        ],
      },
      { // LeetCode 253 Meeting Rooms II: sweep by start time, min-heap of end times in the box
        heading: "CẦN *MẤY PHÒNG* HỌP", subtitle: "LeetCode 253: min-heap giữ giờ kết thúc của các phòng đang bận",
        narration: "Mỗi thanh là một cuộc họp, heap cho biết phòng nào trống sớm nhất.",
        items: [[0, 30], [5, 10], [15, 20]],
        steps: [
          S("Ba cuộc họp đã sắp theo giờ bắt đầu. Heap sẽ giữ giờ kết thúc của từng phòng đang có người dùng.", { box: heap([]), vars: { rooms: "0" } }),
          S("Cuộc họp đầu tiên bắt đầu lúc 0. Chưa có phòng nào nên mình mở phòng mới và đẩy giờ kết thúc 30 vào heap.", { at: 0, ptr: { start: 0 }, box: heap(["30"]), vars: { start: "0", rooms: "1" } }),
          S("Cuộc họp thứ hai bắt đầu lúc 5. Đỉnh heap là 30, tức phòng duy nhất còn bận tới 30, nên hai cuộc họp đè lên nhau.", { at: 1, hi: [0], clash: [5, 10], ptr: { start: 5 }, box: heap(["30"]), vars: { start: "5", rooms: "1" } }),
          S("Không phòng nào trống nên phải mở phòng thứ hai. Đẩy 10 vào heap, và 10 nổi lên đỉnh vì nó kết thúc sớm nhất.", { at: 1, hi: [0], ptr: { start: 5 }, box: heap(["10", "30"]), vars: { start: "5", rooms: "2" } }),
          S("Cuộc họp thứ ba bắt đầu lúc 15. Đỉnh heap là 10, nhỏ hơn 15, nghĩa là phòng đó đã họp xong và dùng lại được.", { at: 2, hi: [0, 1], ptr: { start: 15 }, box: heap(["10", "30"]), vars: { start: "15", rooms: "2" } }),
          S("Mình lấy 10 ra khỏi heap rồi đẩy 20 vào: cuộc họp thứ ba dùng lại đúng phòng vừa trống, số phòng vẫn là 2.", { at: 2, hi: [0], dim: [1], ptr: { start: 15 }, box: heap(["20", "30"]), vars: { start: "15", rooms: "2" } }),
          S("Hết danh sách. Kích thước heap là 2, đó chính là số phòng tối thiểu, vì chưa lúc nào có quá hai cuộc họp cùng diễn ra.", { hi: [0, 2], dim: [1], box: heap(["20", "30"]), vars: { start: "15", rooms: "2" } }),
        ],
      },
      { // LeetCode 435 Non-overlapping Intervals: greedy by end time, removed intervals dimmed, "end" marker
        heading: "BỎ ÍT *KHOẢNG* NHẤT", subtitle: "LeetCode 435: sắp theo điểm cuối, luôn giữ khoảng kết thúc sớm nhất",
        narration: "Tham lam theo điểm kết thúc: giữ được càng nhiều thì bỏ càng ít.",
        items: [[1, 2], [2, 3], [1, 3], [3, 4]],
        steps: [
          S("Các khoảng đã sắp theo điểm kết thúc. Khoảng nào kết thúc sớm thì chừa nhiều chỗ nhất cho những khoảng phía sau.", { out: [], vars: { removed: "0" } }),
          S("Khoảng đầu tiên luôn được giữ. Mình đặt mốc end bằng 2, là điểm cuối của khoảng vừa giữ.", { at: 0, out: [[1, 2]], ptr: { end: 2 }, vars: { removed: "0" } }),
          S("Khoảng từ 2 đến 3 bắt đầu đúng tại mốc end. Chạm nhau ở đầu mút không tính là chồng, nên giữ lại và dời end sang 3.", { at: 1, hi: [0], out: [[1, 2], [2, 3]], ptr: { end: 3 }, vars: { removed: "0" } }),
          S("Khoảng từ 1 đến 3 bắt đầu ở 1, nằm trước mốc end là 3. Nó đè lên những khoảng đã giữ ở đoạn màu đỏ.", { at: 2, hi: [0, 1], out: [[1, 2], [2, 3]], clash: [1, 3], ptr: { end: 3 }, vars: { removed: "0" } }),
          S("Mình bỏ khoảng này và tăng biến đếm lên 1. Mốc end giữ nguyên ở 3 vì tập đang giữ không thay đổi.", { hi: [0, 1], dim: [2], out: [[1, 2], [2, 3]], ptr: { end: 3 }, vars: { removed: "1" } }),
          S("Khoảng cuối bắt đầu ở 3, đúng bằng end nên không chồng. Mình giữ nó lại và dời end sang 4.", { at: 3, hi: [0, 1], dim: [2], out: [[1, 2], [2, 3], [3, 4]], ptr: { end: 4 }, vars: { removed: "1" } }),
          S("Duyệt xong. Chỉ cần bỏ một khoảng là ba khoảng còn lại nối đuôi nhau trên hàng kết quả, không khoảng nào chồng lên nhau.", { hi: [0, 1, 3], dim: [2], out: [[1, 2], [2, 3], [3, 4]], vars: { removed: "1" } }),
        ],
      },
      { // LeetCode 57 Insert Interval: "extra" is the new interval; it grows as overlapping items are merged into it
        heading: "CHÈN MỘT *KHOẢNG MỚI*", subtitle: "LeetCode 57: giữ phần bên trái, gộp phần chồng lấn, nối phần còn lại",
        narration: "Khoảng mới sẽ lớn dần khi nó nuốt các khoảng chồng lên mình.",
        items: [[1, 2], [3, 5], [6, 7], [8, 10], [12, 16]], extra: [4, 8],
        steps: [
          S("Danh sách đã sắp sẵn và không chồng nhau. Thanh màu tím là khoảng mới từ 4 đến 8 cần chèn vào đúng chỗ.", { out: [] }),
          S("Khoảng từ 1 đến 2 kết thúc trước khi khoảng mới bắt đầu ở 4. Nó nằm hẳn bên trái nên đưa thẳng vào kết quả.", { at: 0, out: [[1, 2]] }),
          S("Khoảng từ 3 đến 5 chưa kết thúc khi khoảng mới bắt đầu. Hai bên chồng nhau ở đoạn màu đỏ nên phải gộp.", { at: 1, dim: [0], out: [[1, 2]], clash: [4, 5] }),
          S("Gộp bằng cách lấy điểm đầu nhỏ hơn và điểm cuối lớn hơn. Khoảng mới nới sang trái, bây giờ là từ 3 đến 8.", { at: 1, dim: [0], out: [[1, 2]], extra: [3, 8] }),
          S("Khoảng từ 6 đến 7 nằm gọn bên trong khoảng mới. Gộp vào thì hai đầu mút không đổi, vẫn là từ 3 đến 8.", { at: 2, dim: [0, 1], out: [[1, 2]], clash: [6, 7] }),
          S("Khoảng từ 8 đến 10 bắt đầu đúng tại điểm 8, nơi khoảng mới kết thúc. Chạm nhau ở đầu mút vẫn tính là chồng.", { at: 3, dim: [0, 1, 2], out: [[1, 2]], clash: [8, 8] }),
          S("Vậy là gộp tiếp: điểm cuối của khoảng mới được nới từ 8 ra 10. Khoảng mới bây giờ trải từ 3 đến 10.", { at: 3, dim: [0, 1, 2], out: [[1, 2]], extra: [3, 10] }),
          S("Khoảng từ 12 đến 16 bắt đầu sau điểm 10 nên không còn chồng nữa. Lúc này mình mới đưa khoảng đã gộp vào kết quả.", { at: 4, dim: [0, 1, 2, 3, 5], out: [[1, 2], [3, 10]] }),
          S("Phần còn lại nằm hẳn bên phải nên chỉ việc nối vào sau. Kết quả gồm ba khoảng, vẫn theo đúng thứ tự tăng dần.", { dim: [0, 1, 2, 3, 4, 5], out: [[1, 2], [3, 10], [12, 16]] }),
        ],
      },
    ],
  }]);
})();

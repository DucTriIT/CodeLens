// Linked-list figure for algorithm clips: nodes as boxes joined by arrows, so the viewer sees the "next" arrows change.
// Scene data: nodes (main list), cycle (index the tail links back to), second (a second list for merge problems).
// Step state: ptr (named pointers), next (arrows that differ from the original list at this step), hi, dim, cut.
// Addressing: a node of the main list is its index (0, 1, 2…); a node of the second list is "b0", "b1"…
// A pointer may also stand on a null: -1 is before the head, the list length is after the tail ("b-1", "b3" for list b).
(window.__codelensSimDefs = window.__codelensSimDefs || []).push(["list", (() => {
  const lens = (d) => [(d.nodes || []).length, (d.second || []).length];
  // Parses a node reference into [list, index], or null when invalid. With ends=true the two nulls are allowed too.
  function ref(v, d, ends) {
    let l = 0, i = v;
    if (typeof v === "string") {
      const m = /^\s*([ab]?)\s*(-?\d+|null|none|nil)?\s*$/i.exec(v);
      if (!m || (!m[1] && m[2] === undefined)) return null;
      l = m[1].toLowerCase() === "b" ? 1 : 0; i = m[2] === undefined || !/\d/.test(m[2]) ? null : +m[2];
    } else if (v === undefined || (v !== null && typeof v !== "number")) return null;
    const n = lens(d)[l]; if (!n) return null;
    i = i === null ? n : Math.round(i);
    if (!Number.isFinite(i) || (ends ? i < -1 || i > n : i < 0 || i >= n)) return null;
    return [l, i];
  }
  const fmt = (r) => r[0] ? "b" + r[1] : r[1];
  const ids = (v, d) => [...new Set((Array.isArray(v) ? v : String(v == null ? "" : v).split(/[\s,]+/)).map(x => ref(x, d)).filter(Boolean).map(fmt))];

  function norm(sc, h) {
    sc = sc && typeof sc === "object" ? sc : {};
    const vals = (v, max) => (Array.isArray(v) ? v : String(v == null ? "" : v).split(/\s*(?:,|->|→)\s*|\s+/))
      .map(x => h.str(x && typeof x === "object" ? (x.val ?? x.value ?? "") : x, 4)).filter(x => x !== "").slice(0, max);
    const second = vals(sc.second ?? sc.list2 ?? sc.nodes2, 6);
    const nodes = vals(sc.nodes ?? sc.list ?? sc.values, second.length ? 6 : 8);
    const out = { nodes }; const cv = sc.cycle ?? sc.pos;
    const cy = typeof cv === "number" || (typeof cv === "string" && cv.trim()) ? h.int(cv, 0, nodes.length - 1, -1) : -1;
    if (cy >= 0) out.cycle = cy;
    if (second.length && nodes.length) out.second = second;
    return out;
  }
  function normStep(st, d, h) {
    st = st && typeof st === "object" ? st : {}; d = d || {};
    const ptr = {}; const ps = st.ptr || st.pointers || {};
    (Array.isArray(ps) ? ps.map(o => [o && (o.name || o.label), o && (o.at ?? o.index ?? o.node)]) : Object.entries(typeof ps === "object" ? ps : {})).forEach(([k, v]) => {
      const name = h.str(k, 6), r = ref(v, d, true); if (name && r && Object.keys(ptr).length < 4) ptr[name] = fmt(r);
    });
    const next = {}; const ns = st.next || st.arrows || {}; const N = lens(d);
    (Array.isArray(ns) ? ns : Object.entries(typeof ns === "object" ? ns : {})).forEach(e => {
      if (!Array.isArray(e)) return; const s = ref(e[0], d), t = ref(e[1], d, true);
      if (s && t) next[fmt(s)] = t[1] < 0 || t[1] >= N[t[0]] ? -1 : fmt(t);
    });
    return { ptr, next, hi: ids(st.hi, d), dim: ids(st.dim, d), cut: ids(st.cut ?? st.removed, d) };
  }

  function draw(c, sc, f, h) {
    const { COL, FONT, MONO, clamp, lerp } = h;
    const d = { nodes: Array.isArray(sc.nodes) ? sc.nodes : [], second: Array.isArray(sc.second) ? sc.second : [] };
    const N = lens(d), A = f.area; if (!N[0] || !A) return;
    const two = N[1] > 0, cyc = Number.isInteger(sc.cycle) && sc.cycle >= 0 && sc.cycle < N[0] ? sc.cycle : -1;
    const O = (v) => v && typeof v === "object" ? v : {}, Ls = (v) => Array.isArray(v) ? v.map(String) : [];
    const S = (s) => { s = O(s); return { ptr: O(s.ptr), next: O(s.next), hi: Ls(s.hi), dim: Ls(s.dim), cut: Ls(s.cut) }; };
    const st = S(f.st), pr = S(f.pr || f.st), all = (Array.isArray(f.steps) && f.steps.length ? f.steps : [f.st]).map(S);
    const u = f.u == null ? 1 : clamp(+f.u || 0, 0, 1);
    const key = (r) => String(fmt(r));
    const every = []; for (let l = 0; l < 2; l++) for (let i = 0; i < N[l]; i++) every.push([l, i]);
    // where a node's arrow goes: "" is null, otherwise the key of the target node
    const dflt = (r) => r[1] + 1 < N[r[0]] ? key([r[0], r[1] + 1]) : (!r[0] && cyc >= 0 ? String(cyc) : "");
    const eff = (s, r) => { const v = s.next[key(r)]; if (v === undefined) return dflt(r); const t = v === -1 ? null : ref(v, d); return t ? key(t) : ""; };
    const ptrAt = (s) => Object.entries(s.ptr).map(([nm, v]) => [nm, ref(v, d, true)]).filter(x => x[1]);
    // which null labels the scene needs, over all steps, so the layout never jumps
    const nullL = [false, false], nullR = [false, false];
    all.forEach(s => {
      ptrAt(s).forEach(([, r]) => { if (r[1] < 0) nullL[r[0]] = true; if (r[1] >= N[r[0]]) nullR[r[0]] = true; });
      for (let l = 0; l < 2; l++) if (N[l]) { if (eff(s, [l, N[l] - 1]) === "") nullR[l] = true; if (N[l] > 1 && eff(s, [l, 0]) === "") nullL[l] = true; }
    });
    const anyL = nullL[0] || nullL[1];

    // A layout: one row, two rows for two lists, or one list wrapped onto two rows. Picks the largest node that fits.
    const plan = (wrap) => {
      const split = wrap ? Math.ceil(N[0] / 2) : N[0] + 1, rows = two || wrap ? 2 : 1;
      const rowOf = (r) => r[0] || r[1] >= split ? 1 : 0, colOf = (r) => !r[0] && r[1] >= split ? r[1] - split : r[1];
      const cnt = two ? N : wrap ? [split, N[0] - split] : [N[0]];
      const arcD = [0, 0], stack = [0, 0];
      all.forEach(s => {
        every.forEach(r => {
          const t = eff(s, r); if (!t) return; const q = ref(t, d), row = rowOf(r);
          if (rowOf(q) === row && colOf(q) !== colOf(r) + 1) arcD[row] = Math.max(arcD[row], Math.abs(colOf(q) - colOf(r)) || 1);
        });
        const at = {}; ptrAt(s).forEach(([, r]) => { const k = key(r); at[k] = (at[k] || 0) + 1; stack[rowOf(r)] = Math.max(stack[rowOf(r)], at[k]); });
      });
      const geo = (cw, v) => {   // v stretches the figure vertically when the area is taller than the row needs
        const ch = Math.round(cw * 0.86 * Math.min(v, 1.35)), gap = Math.max(40, Math.round(cw * 0.48)), pitch = cw + gap;
        const nf = clamp(Math.round(cw * 0.28), 24, 36), nullW = Math.round(nf * 2.4) + 6;
        const idxF = clamp(Math.round(cw * 0.22 * v), 24, 34), idxH = idxF + 12;
        const pf = clamp(Math.round(Math.min(cw * 0.34 * v, pitch * 0.3)), 30, 52), th = Math.round(pf * 0.6), plh = pf + 6;
        const pz = (k) => k ? 6 + th + 2 + k * plh : 0;
        const ah = (dd) => Math.min(cw * 1.1, cw * (0.42 + 0.16 * (dd - 1))) * v, arcH = arcD.map(x => x ? Math.round(ah(x)) + 10 : 0);
        const m = Math.max(20, gap * 0.5), lane = Math.max(34, Math.round(cw * 0.3 * v));
        const left = Math.max(wrap ? m + 6 : 0, anyL ? nullW + gap : 0);
        let W = 0;
        for (let r = 0; r < rows; r++) W = Math.max(W, left + cnt[r] * pitch - gap + (wrap && !r ? m + 6 : 0) + ((two ? nullR[r] : nullR[0] && r === rows - 1) ? gap + nullW : 0));
        const top = []; let y = 0, laneY = 0;
        if (two) { y = pz(stack[0]) + idxH; top[0] = y; y += ch + Math.max(Math.round(cw * 0.95 * v), arcH[0] + arcH[1] + 16); top[1] = y; y += ch + idxH + pz(stack[1]); }
        else for (let r = 0; r < rows; r++) { if (r) { laneY = y + lane / 2; y += lane; } y += arcH[r]; top[r] = y; y += ch + idxH + pz(stack[r]); }
        return { cw, ch, gap, pitch, nf, nullW, idxF, idxH, pf, th, plh, ah, m, left, W, H: y, top, laneY, wrap, split, rowOf, colOf,
          lw: clamp(cw * 0.045, 4, 7), hs: clamp(cw * 0.17, 14, 26) };
      };
      let g = null; for (let cw = 176; cw >= 44; cw -= 2) { g = geo(cw, 1); if (g.W <= A.w && g.H <= A.h) break; }
      for (let v = 1.6; v > 1.01; v -= 0.05) { const t = geo(g.cw, v); if (t.H <= A.h * 0.8) return t; }
      return g;
    };
    let G = plan(false);
    if (!two && N[0] >= 5 && G.cw < 84) { const g2 = plan(true); if (g2.cw > G.cw * 1.15) G = g2; }
    const { cw, ch, gap, idxH, th, plh } = G;
    const ox = A.x + (A.w - G.W) / 2, oy = A.y + (A.h - G.H) / 2;
    const side = (row) => two && !row ? -1 : 1;   // index and pointers: above the upper of two lists, otherwise below
    const box = (r) => {
      const row = G.rowOf(r), col = G.colOf(r), x = ox + G.left + col * G.pitch, y = oy + G.top[row];
      const cx = r[1] < 0 ? ox + G.left - gap - G.nullW / 2 : r[1] >= N[r[0]] ? x + G.nullW / 2 : x + cw / 2;
      return { row, col, x, y, cx, cy: y + ch / 2 };
    };

    // ---- arrows: every arrow is a polyline, so it can be drawn growing ----
    const bez = (x0, y0, x1, y1, x2, y2, x3, y3) => Array.from({ length: 21 }, (_, i) => {
      const t = i / 20, a = 1 - t; return [a * a * a * x0 + 3 * a * a * t * x1 + 3 * a * t * t * x2 + t * t * t * x3, a * a * a * y0 + 3 * a * a * t * y1 + 3 * a * t * t * y2 + t * t * t * y3];
    });
    const rounded = (pts, rad) => {
      const out = [pts[0]];
      for (let i = 1; i < pts.length - 1; i++) {
        const [px, py] = pts[i], a0 = pts[i - 1], b0 = pts[i + 1], la = Math.hypot(a0[0] - px, a0[1] - py), lb = Math.hypot(b0[0] - px, b0[1] - py);
        if (!la || !lb) { out.push(pts[i]); continue; }
        const ra = Math.min(rad, la / 2, lb / 2), a = [px + (a0[0] - px) / la * ra, py + (a0[1] - py) / la * ra], b = [px + (b0[0] - px) / lb * ra, py + (b0[1] - py) / lb * ra];
        for (let j = 0; j <= 4; j++) { const t = j / 4, w = 1 - t; out.push([w * w * a[0] + 2 * w * t * px + t * t * b[0], w * w * a[1] + 2 * w * t * py + t * t * b[1]]); }
      }
      out.push(pts[pts.length - 1]); return out;
    };
    const pathOf = (r, t) => {
      const a = box(r), P = 5;
      if (!t) {
        if (r[1] === N[r[0]] - 1) return { p: [[a.x + cw + P, a.cy], [a.x + cw + gap - 6, a.cy]] };   // tail to the null on the right
        if (r[1] === 0) return { p: [[a.x - P, a.cy], [a.x - gap + 6, a.cy]] };                        // head to the null on the left
        return { p: [[a.x + cw + P, a.cy], [a.x + cw + gap * 0.62, a.cy]], bar: true };                // a middle node cut off: stub with a bar
      }
      const q = ref(t, d), b = box(q);
      if (a.row === b.row) {
        if (b.col === a.col + 1) return { p: [[a.x + cw + P, a.cy], [b.x - P, a.cy]] };
        // backwards, skipping or cycle link: an arc outside the row; it leaves near the middle of the node's edge and lands
        // near the corner facing its source, so an arrow in and an arrow out of one node never share a point
        const sd = two && !a.row ? 1 : -1, dir = Math.sign(b.col - a.col) || -1, y0 = sd < 0 ? a.y - P : a.y + ch + P;
        const yc = y0 + sd * 1.33 * G.ah(Math.abs(b.col - a.col) || 1), sx = a.cx + dir * cw * 0.1, ex = b.cx - dir * cw * 0.28;
        return { p: bez(sx, y0, sx, yc, ex, yc, ex, y0) };
      }
      if (G.wrap && Math.abs(q[1] - r[1]) === 1 && Math.min(q[1], r[1]) === G.split - 1) {
        // the link across the wrap runs right, down through the lane between the rows, then into the next row
        const s = a.row ? b : a, e = a.row ? a : b, xr = s.x + cw + G.m, xl = e.x - G.m, ly = oy + G.laneY;
        const p = rounded([[s.x + cw + P, s.cy], [xr, s.cy], [xr, ly], [xl, ly], [xl, e.cy], [e.x - P, e.cy]], 16);
        return { p: a.row ? p.reverse() : p };
      }
      const dx = b.cx - a.cx, dy = b.cy - a.cy, k = Math.min((cw / 2 + P) / Math.abs(dx || 1e-6), (ch / 2 + P) / Math.abs(dy || 1e-6));
      return { p: [[a.cx + dx * k, a.cy + dy * k], [b.cx - dx * k, b.cy - dy * k]] };
    };
    const trunc = (p, len) => {
      const out = [p[0]]; let dir = [1, 0];
      for (let i = 1; i < p.length && len > 0; i++) {
        const dx = p[i][0] - p[i - 1][0], dy = p[i][1] - p[i - 1][1], L = Math.hypot(dx, dy); if (!L) continue;
        const k = Math.min(1, len / L); out.push([p[i - 1][0] + dx * k, p[i - 1][1] + dy * k]); dir = [dx / L, dy / L]; len -= L;
      }
      return { out, dir };
    };
    const drawArrow = (a, frac, col, alpha) => {
      const len = a.p.reduce((s, q, i) => i ? s + Math.hypot(q[0] - a.p[i - 1][0], q[1] - a.p[i - 1][1]) : 0, 0) * frac;
      if (len < 3 || alpha <= 0.01) return;
      const hs = Math.min(G.hs, len), full = trunc(a.p, len), line = trunc(a.p, len - (a.bar ? 0 : hs * 0.8)), tip = full.out[full.out.length - 1], [ux, uy] = full.dir;
      c.save(); c.globalAlpha *= alpha; c.strokeStyle = c.fillStyle = col; c.lineWidth = G.lw; c.lineCap = "round"; c.lineJoin = "round";
      c.beginPath(); line.out.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke();
      c.beginPath();
      if (a.bar) { c.moveTo(tip[0] - uy * hs * 0.8, tip[1] + ux * hs * 0.8); c.lineTo(tip[0] + uy * hs * 0.8, tip[1] - ux * hs * 0.8); c.stroke(); }
      else { c.moveTo(tip[0], tip[1]); c.lineTo(tip[0] - ux * hs - uy * hs * 0.55, tip[1] - uy * hs + ux * hs * 0.55); c.lineTo(tip[0] - ux * hs + uy * hs * 0.55, tip[1] - uy * hs - ux * hs * 0.55); c.closePath(); c.fill(); }
      c.restore();
    };

    // ---- null labels: bright while an arrow or a pointer is on them ----
    c.textAlign = "center"; c.textBaseline = "middle";
    const onNull = (s, l, i) => ptrAt(s).some(([, r]) => r[0] === l && r[1] === i);
    for (let l = 0; l < 2; l++) {
      if (!N[l] || (l && !two)) continue;
      const spots = [[nullL[l], -1, N[l] > 1 && eff(st, [l, 0]) === ""], [nullR[l], N[l], eff(st, [l, N[l] - 1]) === ""]];
      spots.forEach(([need, i, live]) => {
        if (!need) return; const b = box([l, i]);
        c.save(); c.globalAlpha *= live || onNull(st, l, i) ? 1 : 0.4; c.font = `600 ${G.nf}px ${MONO}`; c.fillStyle = COL.muted; c.fillText("null", b.cx, b.cy + 1, G.nullW); c.restore();
      });
    }
    // ---- nodes ----
    const fadeOf = (s, k) => s.cut.includes(k) ? 0.5 : s.dim.includes(k) ? 0.32 : 1;
    const maxLen = Math.max(1, ...d.nodes.concat(d.second).map(v => String(v).length));
    const vf = Math.round(clamp(Math.min(ch * 0.46, (cw - 16) / (0.62 * maxLen)), 24, 78));
    every.forEach(r => {
      const k = key(r), b = box(r), al = lerp(fadeOf(pr, k), fadeOf(st, k), u);
      const hi = lerp(+pr.hi.includes(k), +st.hi.includes(k), u), cut = lerp(+pr.cut.includes(k), +st.cut.includes(k), u);
      c.save(); c.globalAlpha *= al;
      c.beginPath(); c.roundRect(b.x, b.y, cw, ch, cw * 0.16); c.fillStyle = COL.disk; c.fill();
      if (hi > 0) { c.save(); c.globalAlpha *= hi; c.fillStyle = COL.orange; c.fill(); c.restore(); }
      c.strokeStyle = hi > 0.5 ? COL.orange : "rgba(77,184,255,0.45)"; c.lineWidth = 3; c.stroke();
      c.font = `700 ${vf}px ${MONO}`; c.fillStyle = hi > 0.5 ? COL.ink : COL.white; c.fillText(String((r[0] ? d.second : d.nodes)[r[1]]), b.cx, b.cy + 2, cw - 12);
      c.font = `500 ${G.idxF}px ${MONO}`; c.fillStyle = COL.muted; c.fillText(k, b.cx, side(b.row) > 0 ? b.y + ch + idxH / 2 + 3 : b.y - idxH / 2 - 1);
      c.restore();
      if (cut > 0) {   // a removed node: red dashed outline and a strike
        c.save(); c.globalAlpha *= cut; c.strokeStyle = COL.red; c.lineWidth = 4; c.lineCap = "round";
        c.setLineDash([14, 10]); c.beginPath(); c.roundRect(b.x, b.y, cw, ch, cw * 0.16); c.stroke(); c.setLineDash([]);
        c.beginPath(); c.moveTo(b.x + cw * 0.14, b.y + ch * 0.86); c.lineTo(b.x + cw * 0.86, b.y + ch * 0.14); c.stroke(); c.restore();
      }
    });
    // ---- arrows: blue = as in the original list, green = changed earlier, orange = changed in this step (grows with u) ----
    every.forEach(r => {
      const k = key(r), now = eff(st, r), old = eff(pr, r), al = lerp(fadeOf(pr, k), fadeOf(st, k), u);
      const calm = (t) => t === dflt(r) ? COL.blue : COL.green;
      if (now !== old && u < 1) drawArrow(pathOf(r, old), 1, calm(old), al * (1 - u));
      drawArrow(pathOf(r, now), now !== old ? u : 1, now !== old ? COL.orange : calm(now), al);
    });
    // ---- pointers: slide from their previous node; several on one node stack ----
    const cols = h.ptrCols(), order = [...new Set(all.flatMap(s => Object.keys(s.ptr)))];
    const spot = (s) => {
      const out = {}, at = {};
      ptrAt(s).forEach(([nm, r]) => { const k = key(r), b = box(r), sd = side(b.row); at[k] = at[k] || 0; out[nm] = { x: b.cx, y: sd > 0 ? b.y + ch + idxH : b.y - idxH, slot: at[k]++, sd }; });
      return out;
    };
    const now = spot(st), was = spot(pr);
    Object.keys(now).reverse().forEach(nm => {   // reversed, so the triangle keeps the colour of the name nearest to it
      const b = now[nm], a = was[nm] || b, x = lerp(a.x, b.x, u), y = lerp(a.y, b.y, u), slot = lerp(a.slot, b.slot, u), sd = b.sd;
      c.save(); if (!was[nm]) c.globalAlpha *= u; c.fillStyle = cols[Math.max(0, order.indexOf(nm)) % cols.length];
      c.beginPath(); c.moveTo(x, y + sd * 6); c.lineTo(x - th * 0.7, y + sd * (6 + th)); c.lineTo(x + th * 0.7, y + sd * (6 + th)); c.closePath(); c.fill();
      c.font = `800 ${G.pf}px ${FONT}`; const tw = c.measureText(nm).width;
      c.fillText(nm, clamp(x, A.x + tw / 2 + 2, A.x + A.w - tw / 2 - 2), y + sd * (6 + th + 2 + plh * (slot + 0.5)));
      c.restore();
    });
  }

  return {
    label: "Danh sách liên kết",
    when: "danh sách liên kết: đảo danh sách, con trỏ nhanh và chậm (nút giữa, phát hiện vòng), xóa nút thứ n từ cuối, trộn hai danh sách đã sắp xếp, sắp xếp lại các nút. Hình vẽ cho thấy từng mũi tên next đổi hướng.",
    prompt: 'MÔ PHỎNG thuật toán trên danh sách liên kết, người xem phải thấy MŨI TÊN next đổi hướng. "nodes": giá trị các nút theo thứ tự, tối đa 8 nút, mỗi nút tối đa 4 ký tự (ví dụ ["1","2","3","4","5"]); code dùng nút giả thì thêm nút "D" ở đầu. "cycle": chỉ số nút mà nút cuối trỏ về (chỉ khi có vòng). "second": danh sách thứ hai cho bài trộn hai danh sách (khi đó mỗi danh sách tối đa 6 nút); nút của "nodes" ghi bằng chỉ số 0, 1, 2…, nút của "second" ghi "b0", "b1"… Mỗi bước: {"say", "ptr": {"prev": -1, "curr": 0} (tên ngắn: prev, curr, next, slow, fast, tail; giá trị là nút con trỏ đang đứng; null TRƯỚC nút đầu ghi -1, null SAU nút cuối ghi bằng số nút, với "second" là "b-1" và ví dụ "b3"), "next": {"1": 0, "0": -1} (CHỈ những mũi tên next đang KHÁC danh sách gốc ở bước này, dạng nút nguồn: nút đích, -1 là null. Đây là ảnh chụp: bước sau phải ghi lại MỌI mũi tên đã đổi ở các bước trước; mũi tên mới đổi ở bước này tự được tô cam), "hi": [nút đang xét], "dim": [nút đã xong hoặc bị loại], "cut": [nút đã bị gỡ khỏi danh sách]}. Ví dụ khi đảo 1, 2, 3 và đã lật hai mũi tên: {"ptr": {"prev": 1, "curr": 2}, "next": {"0": -1, "1": 0}, "hi": [2]}. Bài trộn: nối kết quả bằng "next" đi qua lại giữa hai danh sách, ví dụ {"ptr": {"p1": 1, "p2": "b1", "tail": "b0"}, "next": {"0": "b0"}}. Mỗi bước chỉ đổi MỘT mũi tên, ứng với đúng một lệnh gán .next trong code.',
    review: 'Tự chạy code trên đúng danh sách của cảnh: ở mỗi bước, "next" phải liệt kê đủ và đúng mọi nút có .next khác danh sách gốc tại thời điểm đó (không làm rơi mũi tên đã đổi ở bước trước), và mỗi con trỏ trong "ptr" phải đứng đúng nút hoặc đúng null mà biến đó đang giữ.',
    dataHint: 'Ví dụ: {"nodes": ["1","2","3","4","5"]}. Có vòng thì thêm "cycle": 1 (nút cuối trỏ về nút 1). Bài hai danh sách thì thêm "second": ["1","3","4"]; nút của nó được gọi là "b0", "b1", "b2".',
    stepHint: 'Ví dụ: {"ptr": {"prev": 0, "curr": 1}, "next": {"0": -1, "1": 0}, "hi": [1], "dim": [], "cut": []}. "next" ghi mọi mũi tên đang khác danh sách gốc (-1 là null). Con trỏ ở null: -1 là trước nút đầu, bằng số nút là sau nút cuối.',
    fields: ["nodes", "cycle", "second"],
    norm, normStep, draw,
    samples: [
      { heading: "LẬT TỪNG *MŨI TÊN*", subtitle: "LeetCode 206: đảo danh sách 1, 2, 3, 4, 5 bằng ba con trỏ prev, curr, next",
        narration: "Mình đảo danh sách bằng cách lật từng mũi tên một.", nodes: ["1", "2", "3", "4", "5"], steps: [
          { say: "Ban đầu prev là null, còn curr đứng ở nút đầu tiên. Mọi mũi tên vẫn đang chỉ sang phải, và mình sẽ lật chúng lần lượt từng cái một.", ptr: { prev: -1, curr: 0 } },
          { say: "Mình cất nút kế tiếp vào next để không mất dấu, rồi cho mũi tên của nút 1 quay về prev, lúc này đang là null.", ptr: { prev: -1, curr: 0, next: 1 }, next: { 0: -1 }, hi: [0] },
          { say: "Cả prev và curr tiến một bước. Mũi tên của nút 2 được lật lại để chỉ về nút 1, còn next giữ sẵn nút 3 cho vòng lặp sau.", ptr: { prev: 0, curr: 1, next: 2 }, next: { 0: -1, 1: 0 }, hi: [1] },
          { say: "Lặp lại đúng các thao tác đó: cất nút 4 vào next, rồi lật mũi tên của nút 3 để nó chỉ ngược về nút 2.", ptr: { prev: 1, curr: 2, next: 3 }, next: { 0: -1, 1: 0, 2: 1 }, hi: [2] },
          { say: "Tới nút 4, mũi tên của nó quay về nút 3. Bạn để ý phần bên trái đã đảo xong, còn mũi tên bên phải vẫn giữ nguyên.", ptr: { prev: 2, curr: 3, next: 4 }, next: { 0: -1, 1: 0, 2: 1, 3: 2 }, hi: [3] },
          { say: "Nút 5 là nút cuối nên next lúc này là null. Mình lật nốt mũi tên của nó về nút 4, vậy là mọi mũi tên đã đổi chiều.", ptr: { prev: 3, curr: 4, next: 5 }, next: { 0: -1, 1: 0, 2: 1, 3: 2, 4: 3 }, hi: [4] },
          { say: "curr đi tới null nên vòng lặp dừng. prev đang đứng ở nút 5, đó chính là đầu của danh sách đã đảo, nên mình trả về prev.", ptr: { prev: 4, curr: 5 }, next: { 0: -1, 1: 0, 2: 1, 3: 2, 4: 3 }, hi: [4] },
        ] },
      { heading: "RÙA VÀ THỎ *GẶP NHAU*", subtitle: "LeetCode 141: slow đi một bước, fast đi hai bước, có vòng thì sẽ gặp nhau",
        narration: "Hai con trỏ chạy với hai tốc độ khác nhau để tìm vòng.", nodes: ["3", "2", "0", "-4"], cycle: 1, steps: [
          { say: "Nút cuối cùng trỏ ngược về nút thứ hai nên danh sách này có vòng. Mình cho slow và fast cùng xuất phát ở nút đầu tiên.", ptr: { slow: 0, fast: 0 } },
          { say: "Mỗi lượt slow đi một bước còn fast đi hai bước. Sau lượt đầu, slow ở nút thứ hai và fast ở nút thứ ba, hai con trỏ chưa gặp nhau.", ptr: { slow: 1, fast: 2 } },
          { say: "Lượt hai, slow sang nút thứ ba. fast đi tới nút cuối rồi theo mũi tên vòng quay lại nút thứ hai, nên giờ nó đang đuổi phía sau slow.", ptr: { slow: 2, fast: 1 } },
          { say: "Lượt ba, slow tới nút cuối và fast đi thêm hai bước cũng tới đúng nút đó. Hai con trỏ gặp nhau nên chắc chắn có vòng, mình trả về true.", ptr: { slow: 3, fast: 3 }, hi: [3] },
        ] },
      { heading: "TRỘN HAI *DANH SÁCH*", subtitle: "LeetCode 21: luôn so hai nút đầu và nối nút nhỏ hơn vào sau tail",
        narration: "Mình trộn hai danh sách đã sắp xếp bằng cách nối lại mũi tên.", nodes: ["1", "2", "4"], second: ["1", "3", "4"], steps: [
          { say: "Hai danh sách đều đã sắp xếp tăng dần. p1 và p2 đứng ở đầu mỗi danh sách, mình sẽ luôn so hai nút này và lấy nút nhỏ hơn.", ptr: { p1: 0, p2: "b0" } },
          { say: "Hai nút đầu cùng là 1, mình lấy nút của danh sách trên. tail đánh dấu nút cuối của kết quả, còn p1 tiến sang nút 2.", ptr: { p1: 1, p2: "b0", tail: 0 }, hi: [0] },
          { say: "So 2 với 1 thì 1 nhỏ hơn, nên mũi tên của tail được nối xuống nút 1 ở danh sách dưới. tail dời theo, còn p2 tiến sang nút 3.", ptr: { p1: 1, p2: "b1", tail: "b0" }, next: { 0: "b0" }, hi: ["b0"] },
          { say: "So 2 với 3 thì 2 nhỏ hơn, mình nối tail ngược lên nút 2 của danh sách trên. Kết quả lúc này là 1, 1, 2 và p1 sang nút 4.", ptr: { p1: 2, p2: "b1", tail: 1 }, next: { 0: "b0", b0: 1 }, hi: [1] },
          { say: "So 4 với 3 thì 3 nhỏ hơn, tail nối xuống nút 3 rồi dời theo. p2 tiến sang nút 4, cũng là nút cuối của danh sách dưới.", ptr: { p1: 2, p2: "b2", tail: "b1" }, next: { 0: "b0", b0: 1, 1: "b1" }, hi: ["b1"] },
          { say: "Hai nút cùng là 4, mình ưu tiên danh sách trên nên tail nối lên nút 4 phía trên. p1 đi tới null, tức là danh sách trên đã hết.", ptr: { p1: 3, p2: "b2", tail: 2 }, next: { 0: "b0", b0: 1, 1: "b1", b1: 2 }, hi: [2] },
          { say: "Một bên đã hết nên không cần so nữa, mình nối tail thẳng vào phần còn lại của danh sách dưới. Đi theo các mũi tên sẽ ra 1, 1, 2, 3, 4, 4.", ptr: { p1: 3, p2: "b2", tail: 2 }, next: { 0: "b0", b0: 1, 1: "b1", b1: 2, 2: "b2" }, hi: ["b2"] },
        ] },
      { heading: "*NHẢY QUA* NÚT CẦN XÓA", subtitle: "LeetCode 19: xóa nút thứ hai từ cuối bằng hai con trỏ cách nhau n nút",
        narration: "Mình giữ hai con trỏ cách nhau đúng n nút.", nodes: ["D", "1", "2", "3", "4", "5"], steps: [
          { say: "Mình thêm nút giả D đứng trước đầu danh sách, để khi phải xóa nút đầu cũng không cần xử lý riêng. slow và fast cùng bắt đầu ở D.", ptr: { slow: 0, fast: 0 }, vars: { n: "2", "cách nhau": "0" } },
          { say: "Cần xóa nút thứ hai tính từ cuối, nên mình cho fast đi trước đúng hai bước. Từ giờ fast luôn cách slow hai nút.", ptr: { slow: 0, fast: 2 }, vars: { n: "2", "cách nhau": "2" } },
          { say: "Sau đó hai con trỏ cùng tiến từng bước một. Khoảng cách hai nút được giữ nguyên, slow ở nút 1 và fast ở nút 3.", ptr: { slow: 1, fast: 3 }, vars: { n: "2", "cách nhau": "2" } },
          { say: "Cả hai tiến thêm một bước nữa, slow sang nút 2 còn fast sang nút 4. Sau fast vẫn còn một nút nên mình chưa dừng lại.", ptr: { slow: 2, fast: 4 }, vars: { n: "2", "cách nhau": "2" } },
          { say: "fast chạm nút cuối thì dừng. Lúc này slow đứng ở nút 3, ngay trước nút 4, chính là nút thứ hai tính từ cuối cần xóa.", ptr: { slow: 3, fast: 5 }, hi: [4], vars: { n: "2", "cách nhau": "2" } },
          { say: "Mình cho mũi tên của slow nhảy qua nút 4 để trỏ thẳng tới nút 5. Nút 4 rời khỏi danh sách, kết quả còn lại là 1, 2, 3, 5.", ptr: { slow: 3, fast: 5 }, next: { 3: 5 }, cut: [4], vars: { n: "2", "cách nhau": "2" } },
        ] },
      { heading: "TÌM *ĐẦU VÒNG*", subtitle: "LeetCode 142: nút đầu tiên bị gặp lại lần hai chính là nơi vòng bắt đầu",
        narration: "Mình ghi lại các nút đã đi qua để biết vòng bắt đầu ở đâu.", nodes: ["1", "2", "3", "4", "5"], cycle: 2, steps: [
          { say: "Nút cuối trỏ ngược về nút 3 nên danh sách có vòng. Mình dùng một set tên seen để ghi lại những nút đã đi qua, curr bắt đầu ở nút 1.", ptr: { curr: 0 }, box: { kind: "set", name: "seen", items: [] }, vars: { "curr.val": "1", "trong seen": "không" } },
          { say: "Nút 1 chưa có trong seen nên mình thêm nó vào, rồi cho curr đi tiếp theo mũi tên sang nút 2.", ptr: { curr: 1 }, box: { kind: "set", name: "seen", items: ["1"] }, vars: { "curr.val": "2", "trong seen": "không" } },
          { say: "Nút 2 cũng chưa gặp lần nào, mình thêm vào seen và đi tiếp. curr đang ở nút 3, bạn nhớ nút này vì lát nữa mình sẽ quay lại.", ptr: { curr: 2 }, box: { kind: "set", name: "seen", items: ["1", "2"] }, vars: { "curr.val": "3", "trong seen": "không" } },
          { say: "Nút 3 được thêm vào seen và curr sang nút 4. Cho tới giờ mỗi nút mới chỉ được ghé qua đúng một lần.", ptr: { curr: 3 }, box: { kind: "set", name: "seen", items: ["1", "2", "3"] }, vars: { "curr.val": "4", "trong seen": "không" } },
          { say: "Nút 4 vào seen, curr sang nút 5 là nút cuối. Mũi tên của nút 5 không chỉ ra null mà vòng ngược lại phía trước.", ptr: { curr: 4 }, box: { kind: "set", name: "seen", items: ["1", "2", "3", "4"] }, vars: { "curr.val": "5", "trong seen": "không" } },
          { say: "Thêm nút 5 rồi đi theo mũi tên vòng, curr quay về nút 3. Nút 3 đã nằm trong seen, nên đây chính là nút bắt đầu vòng và mình trả về nó.", ptr: { curr: 2 }, hi: [2], box: { kind: "set", name: "seen", items: ["1", "2", "3", "4", "5"] }, vars: { "curr.val": "3", "trong seen": "có" } },
        ] },
    ],
  };
})()]);

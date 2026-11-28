// Simulation scene "matrix": a 2D grid for islands and flood fill, BFS on a grid, matrix traversal, 2D DP tables
// and board backtracking. Scene data: rows (+ optional rowLabels, colLabels, empty). Step state: at, hi, dim, region,
// path, ptr (a snapshot of that step) and vals (cell values the code overwrites; these CARRY FORWARD to later steps).
(window.__codelensSimDefs = window.__codelensSimDefs || []).push(["matrix", (() => {
  const MAX_R = 9, MAX_C = 9, MAX_LIST = 40;
  const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const num = (v) => typeof v === "number" ? v : typeof v === "string" && v.trim() !== "" ? +v : NaN;
  const val = (v) => [...String(v == null || typeof v === "object" ? "" : v).trim()].slice(0, 3).join("");
  // One row: an array of cells, or a string. "11000" is one cell per character; "1 12 3" or "1,12,3" is split.
  const splitRow = (v) => {
    if (Array.isArray(v)) return v.map(val);
    if (typeof v !== "string" && typeof v !== "number") return null;
    const s = String(v).trim();
    return (/[\s,]/.test(s) ? s.split(/[\s,]+/) : [...s]).map(val);
  };
  function normRows(v) {
    if (typeof v === "number") v = [v];
    if (typeof v === "string") v = /[\n;|]/.test(v) ? v.split(/[\n;|]+/) : v.trim().split(/[\s,]+/);
    if (!Array.isArray(v)) return [];
    const rows = v.slice(0, 60).map(splitRow).filter(r => r && r.length).slice(0, MAX_R).map(r => r.slice(0, MAX_C));
    const w = Math.max(0, ...rows.map(r => r.length));
    return rows.map(r => r.concat(Array(w - r.length).fill("")));
  }
  const normLabels = (v, n) => {
    const a = Array.isArray(v) ? v.map(val) : typeof v === "string" ? (/[\s,]/.test(v.trim()) ? v.trim().split(/[\s,]+/) : [...v]).map(val) : [];
    const l = a.slice(0, n); return l.some(Boolean) ? l : null;
  };
  // A list of cells. An item is [r, c], "r,c", {r, c}, or a rectangle [r0, c0, r1, c1] (kept compact, expanded when drawn).
  function cellList(v, R, C, rects) {
    let a = typeof v === "string" ? v.split(/[\s;|]+/).filter(Boolean) : isObj(v) ? [v] : v;
    if (!Array.isArray(a)) return [];
    if ((a.length === 2 || a.length === 4) && a.every(x => Number.isFinite(num(x)))) a = [a];
    const out = [], seen = new Set();
    for (const raw of a.slice(0, 200)) {
      let it = typeof raw === "string" ? raw.split(/[,:x]/) : isObj(raw) ? [raw.r ?? raw.row, raw.c ?? raw.col] : raw;
      if (!Array.isArray(it) || (it.length !== 2 && it.length !== 4)) continue;
      it = it.map(x => Math.round(num(x)));
      if (!it.every(Number.isFinite)) continue;
      if (it.length === 4) {
        if (!rects) continue;
        const r0 = Math.max(0, Math.min(it[0], it[2])), r1 = Math.min(R - 1, Math.max(it[0], it[2]));
        const c0 = Math.max(0, Math.min(it[1], it[3])), c1 = Math.min(C - 1, Math.max(it[1], it[3]));
        if (r0 > r1 || c0 > c1) continue;
        it = r0 === r1 && c0 === c1 ? [r0, c0] : [r0, c0, r1, c1];
      } else if (it[0] < 0 || it[0] >= R || it[1] < 0 || it[1] >= C) continue;
      const key = it.join(",");
      if (rects ? seen.has(key) : out.length && out[out.length - 1].join(",") === key) continue;
      seen.add(key); out.push(it);
      if (out.length >= MAX_LIST) break;
    }
    return out;
  }
  function norm(sc) {
    sc = isObj(sc) ? sc : {};
    const rows = normRows(sc.rows ?? sc.grid ?? sc.matrix ?? sc.board ?? sc.table);
    const out = { rows }; const R = rows.length, C = R ? rows[0].length : 0;
    const rl = normLabels(sc.rowLabels ?? sc.rowLabel ?? sc.rowNames, R), cl = normLabels(sc.colLabels ?? sc.colLabel ?? sc.colNames, C);
    if (rl) out.rowLabels = rl;
    if (cl) out.colLabels = cl;
    const e = sc.empty ?? sc.blank ?? sc.water;
    out.empty = e == null || isObj(e) || typeof e === "boolean" ? ["0", "."]
      : [...new Set((Array.isArray(e) ? e : String(e).split(/[\s,]+/)).map(val).filter(Boolean))].slice(0, 6);
    return out;
  }
  function normStep(st, data, h) {
    st = isObj(st) ? st : {};
    const rows = (data && Array.isArray(data.rows) && data.rows) || []; const R = rows.length, C = R ? rows[0].length : 0;
    const out = {};
    const at = cellList(st.at ?? st.cur ?? st.cursor ?? st.pos, R, C, false)[0];
    if (at) out.at = at;
    const lists = { hi: st.hi ?? st.highlight ?? st.look, dim: st.dim ?? st.visited ?? st.seen ?? st.done, region: st.region ?? st.group ?? st.island ?? st.area };
    for (const k of Object.keys(lists)) { const l = cellList(lists[k], R, C, true); if (l.length) out[k] = l; }
    const path = cellList(st.path ?? st.route ?? st.trace, R, C, false);
    if (path.length) out.path = path;
    const ps = st.ptr ?? st.pointers, ptr = {};
    (Array.isArray(ps) ? ps.map(o => isObj(o) ? [o.name ?? o.label, o.at ?? o.cell ?? o.pos ?? [o.r ?? o.row, o.c ?? o.col]] : Array.isArray(o) ? o : [])
      : isObj(ps) ? Object.entries(ps) : []).forEach(([k, v]) => {
      const name = h.str(k, 6), cell = cellList(v, R, C, false)[0];
      if (name && cell && (ptr[name] || Object.keys(ptr).length < 4)) ptr[name] = cell;
    });
    if (Object.keys(ptr).length) out.ptr = ptr;
    // vals: {"r,c": value}; also {"r": [a whole row]} and [[r, c, value], ...]
    const vs = st.vals ?? st.set ?? st.values ?? st.write, vals = {};
    const put = (r, c, v) => { r = Math.round(num(r)); c = Math.round(num(c)); if (r >= 0 && r < R && c >= 0 && c < C) vals[`${r},${c}`] = val(v); };
    if (Array.isArray(vs)) vs.slice(0, 81).forEach(o => { if (Array.isArray(o)) Array.isArray(o[0]) ? put(o[0][0], o[0][1], o[1]) : put(o[0], o[1], o[2]); });
    else if (isObj(vs)) Object.entries(vs).forEach(([k, v]) => {
      const m = /^\s*\[?\s*(\d+)\s*[,;:x\s]\s*(\d+)\s*\]?\s*$/.exec(k);
      if (m) put(m[1], m[2], v);
      else if (/^\s*\d+\s*$/.test(k)) (Array.isArray(v) ? v : splitRow(v) || []).forEach((x, c) => { if (x != null) put(k, c, x); });
    });
    if (Object.keys(vals).length) out.vals = vals;
    return out;
  }

  function draw(c, sc, f, h) {
    const rows = Array.isArray(sc && sc.rows) ? sc.rows : []; const R = Math.min(rows.length, MAX_R);
    const C = R ? Math.min(MAX_C, Math.max(...rows.map(r => (Array.isArray(r) ? r.length : 0)))) : 0;
    if (!R || !C || !f || !f.area) return;
    const { COL, FONT, MONO, clamp, lerp } = h; const A = f.area;
    const st = f.st || {}, steps = Array.isArray(f.steps) && f.steps.length ? f.steps : [st];
    const k = clamp(f.k | 0, 0, steps.length - 1), pr = k > 0 && f.pr ? f.pr : st;
    const u = k > 0 ? clamp(+f.u || 0, 0, 1) : 1;
    // cell values now and one step ago: the scene's rows plus every "vals" up to that step
    const grid = Array.from({ length: R }, (_, r) => Array.from({ length: C }, (_, q) => String((rows[r] || [])[q] ?? "")));
    const prev = grid.map(r => r.slice());
    steps.slice(0, k + 1).forEach((s, j) => Object.entries((s && s.vals) || {}).forEach(([key, v]) => {
      const [r, q] = key.split(",").map(Number);
      if (grid[r] && q >= 0 && q < C) { grid[r][q] = String(v); if (j < k) prev[r][q] = String(v); }
    }));
    const emptyVals = new Set([...(Array.isArray(sc.empty) ? sc.empty : ["0", "."]), ""]);
    const ids = (l) => { const s = new Set(); (Array.isArray(l) ? l : []).forEach(it => {
      if (!Array.isArray(it)) return; const [r0, c0, r1 = r0, c1 = c0] = it;
      for (let r = Math.max(0, r0); r <= r1 && r < R; r++) for (let q = Math.max(0, c0); q <= c1 && q < C; q++) s.add(r * 16 + q);
    }); return s; };
    const same = (a, b) => a.size === b.size && [...a].every(x => b.has(x));
    const hiN = ids(st.hi), hiP = ids(pr.hi), dimN = ids(st.dim), dimP = ids(pr.dim), regN = ids(st.region), regP = ids(pr.region);
    const cellOf = (v) => Array.isArray(v) && v[0] >= 0 && v[0] < R && v[1] >= 0 && v[1] < C ? v : null;
    const atN = cellOf(st.at), atP = cellOf(pr.at);

    // ---- layout: square cells as large as the area allows, labels above and to the left ----
    const RL = Array.isArray(sc.rowLabels) ? sc.rowLabels : null, CLb = Array.isArray(sc.colLabels) ? sc.colLabels : null;
    const rowLab = (r) => RL ? String(RL[r] ?? "") : String(r), colLab = (q) => CLb ? String(CLb[q] ?? "") : String(q);
    const anyPtr = steps.some(s => s && s.ptr), gap = Math.max(R, C) > 6 ? 6 : 10;
    const labLen = Math.max(1, ...Array.from({ length: R }, (_, r) => rowLab(r).length));
    const padT = anyPtr ? 18 : 0, padB = anyPtr ? 28 : 4;
    let lf = 30, lw = 0, lh = 0, cs = 0;
    for (let pass = 0; pass < 3; pass++) {
      lw = Math.round(labLen * lf * 0.62 + 22); lh = Math.round(lf * 1.5);
      cs = Math.max(16, Math.floor(Math.min((A.w - 2 * lw - gap * (C - 1)) / C, (A.h - lh - padT - padB - gap * (R - 1)) / R, 236)));
      lf = clamp(Math.round(cs * 0.26), 24, 40);
    }
    const pitch = cs + gap, gw = C * cs + (C - 1) * gap, gh = R * cs + (R - 1) * gap;
    const gx = A.x + (A.w - gw) / 2, gy = A.y + (A.h - (lh + padT + gh + padB)) / 2 + lh + padT;
    const X = (q) => gx + q * pitch, Y = (r) => gy + r * pitch, cx = (q) => X(q) + cs / 2, cy = (r) => Y(r) + cs / 2;
    const rad = Math.min(16, cs * 0.16);
    const box = (x, y, w, hh, r) => { c.beginPath(); c.roundRect(x, y, w, hh, r); };

    // labels: the cursor's row and column are picked out in orange
    c.textBaseline = "middle";
    const labFont = (custom) => `${custom ? 700 : 500} ${custom ? lf : Math.min(lf, 30)}px ${MONO}`;
    const labCol = (on, custom) => on ? COL.orange : custom ? "rgba(242,246,252,0.82)" : COL.muted;
    c.font = labFont(!!CLb); c.textAlign = "center";
    for (let q = 0; q < C; q++) { c.fillStyle = labCol(atN && atN[1] === q, !!CLb); c.fillText(colLab(q), cx(q), gy - padT - lh / 2 + 2, cs); }
    c.font = labFont(!!RL); c.textAlign = "right";
    for (let r = 0; r < R; r++) { c.fillStyle = labCol(atN && atN[0] === r, !!RL); c.fillText(rowLab(r), gx - 16, cy(r) + 2, lw - 14); }

    // cells: an empty cell (water, wall, blank) is hollow and muted; a visited or ruled-out cell is faded
    const dimA = (id) => { const a = dimP.has(id) ? 0.32 : 1, b = dimN.has(id) ? 0.32 : 1; return lerp(a, b, u); };
    for (let r = 0; r < R; r++) for (let q = 0; q < C; q++) {
      const e = lerp(emptyVals.has(prev[r][q]) ? 1 : 0, emptyVals.has(grid[r][q]) ? 1 : 0, u);
      c.save(); c.globalAlpha *= dimA(r * 16 + q);
      box(X(q), Y(r), cs, cs, rad);
      c.save(); c.globalAlpha *= lerp(1, 0.22, e); c.fillStyle = "#1B2D52"; c.fill(); c.restore();
      c.strokeStyle = `rgba(77,184,255,${lerp(0.6, 0.16, e)})`; c.lineWidth = 3; c.stroke();
      c.restore();
    }

    // region: one blue area whose outline follows the cell borders (rounded on every corner)
    const regionPath = (set) => {
      const from = new Map(); const add = (a, b) => { if (!from.has(a)) from.set(a, []); from.get(a).push({ b, used: false }); };
      set.forEach(id => { // boundary edges, clockwise around each cell; a lattice point is r * 16 + c
        if (!set.has(id - 16)) add(id, id + 1);
        if (!set.has(id + 1)) add(id + 1, id + 17);
        if (!set.has(id + 16)) add(id + 17, id + 16);
        if (!set.has(id - 1)) add(id + 16, id);
      });
      c.beginPath();
      from.forEach((list, a0) => list.forEach(e0 => {
        if (e0.used) return; const pts = []; let a = a0, e = e0;
        while (e && !e.used) { // follow the boundary; where two cells touch only at a corner, turn right to stay on one cell
          e.used = true; pts.push(a); const d = e.b - a, right = d === 1 ? 16 : d === 16 ? -1 : d === -1 ? -16 : 1;
          a = e.b; const nx = from.get(a) || []; e = nx.find(x => x.b - a === right) || nx.find(x => !x.used);
        }
        const n = pts.length; const P = pts.map(v => [X(v & 15) - gap / 2, Y(v >> 4) - gap / 2]).filter((p, i, arr) => {
          const p0 = arr[(i + n - 1) % n], p1 = arr[(i + 1) % n]; return (p[0] - p0[0]) * (p1[1] - p[1]) !== (p[1] - p0[1]) * (p1[0] - p[0]);
        });
        const m = P.length; if (m < 4) return;
        c.moveTo((P[0][0] + P[1][0]) / 2, (P[0][1] + P[1][1]) / 2);
        for (let i = 1; i <= m; i++) { const p = P[i % m], p1 = P[(i + 1) % m]; c.arcTo(p[0], p[1], p1[0], p1[1], rad + 3); }
        c.closePath();
      }));
    };
    const drawRegion = (set, fillA, lineA) => {
      if (!set.size || (fillA <= 0 && lineA <= 0)) return;
      regionPath(set);
      c.save(); c.globalAlpha *= fillA; c.fillStyle = "rgba(77,184,255,0.2)"; c.fill(); c.restore();
      c.save(); c.globalAlpha *= lineA; c.strokeStyle = COL.blue; c.lineWidth = 5; c.lineJoin = "round"; c.stroke(); c.restore();
    };
    if (same(regN, regP)) drawRegion(regN, 1, 1);
    else { drawRegion(regP, 1 - u, Math.min(1, 2 - 2 * u)); drawRegion(regN, u, Math.min(1, 2 * u)); }

    // path: green cells joined, in order, by short arrows across the gaps (so the values stay readable).
    // A path that grows or shrinks at its end fades only the cells that changed; any other change cross-fades.
    const pathN = (Array.isArray(st.path) ? st.path : []).filter(cellOf), pathP = (Array.isArray(pr.path) ? pr.path : []).filter(cellOf);
    const isPrefix = (a, b) => a.length <= b.length && a.every((p, i) => p[0] === b[i][0] && p[1] === b[i][1]);
    const paths = isPrefix(pathP, pathN) ? [[pathN, (i) => i < pathP.length ? 1 : u]]
      : isPrefix(pathN, pathP) ? [[pathP, (i) => i < pathN.length ? 1 : 1 - u]] : [[pathP, () => 1 - u], [pathN, () => u]];
    paths.forEach(([P, aOf]) => P.forEach((p, i) => {
      if (aOf(i) <= 0) return;
      c.save(); c.globalAlpha *= aOf(i); box(X(p[1]), Y(p[0]), cs, cs, rad);
      c.fillStyle = "rgba(52,211,153,0.2)"; c.fill(); c.strokeStyle = COL.green; c.lineWidth = 5; c.stroke(); c.restore();
    }));
    const pathArrows = () => paths.forEach(([P, aOf]) => P.forEach((p, i) => {
      if (!i || aOf(i) <= 0) return;
      const ax = cx(P[i - 1][1]), ay = cy(P[i - 1][0]), dx = cx(p[1]) - ax, dy = cy(p[0]) - ay, L = Math.hypot(dx, dy); if (!L) return;
      const t = 0.35 * pitch / Math.max(Math.abs(dx / L), Math.abs(dy / L)), s = clamp(cs * 0.13, 10, 22);
      c.save(); c.globalAlpha *= aOf(i); c.translate(ax, ay); c.rotate(Math.atan2(dy, dx)); c.fillStyle = COL.green;
      const tip = L - t + s * 0.5, w = Math.max(3, s * 0.36);
      c.beginPath(); c.moveTo(t, -w); c.lineTo(tip - s * 1.5, -w); c.lineTo(tip - s * 1.5, -s); c.lineTo(tip, 0);
      c.lineTo(tip - s * 1.5, s); c.lineTo(tip - s * 1.5, w); c.lineTo(t, w); c.closePath(); c.fill(); c.restore();
    }));

    // cells being examined: orange frame and tint
    hiN.forEach(id => {
      c.save(); c.globalAlpha *= (hiP.has(id) ? 1 : u) * dimA(id);
      box(X(id & 15) + 1, Y(id >> 4) + 1, cs - 2, cs - 2, rad); c.fillStyle = "rgba(255,138,31,0.26)"; c.fill();
      c.strokeStyle = COL.orange; c.lineWidth = 5; c.stroke(); c.restore();
    });

    // cursor: a solid orange cell that slides from the previous step's cell
    const cur = atN || atP;
    if (cur) {
      const a = atN && atP ? atP : cur, alpha = atN && atP ? 1 : atN ? u : 1 - u;
      if (alpha > 0) {
        c.save(); c.globalAlpha *= alpha;
        box(lerp(X(a[1]), X(cur[1]), u) - 3, lerp(Y(a[0]), Y(cur[0]), u) - 3, cs + 6, cs + 6, rad + 2); c.fillStyle = COL.orange; c.fill();
        c.restore();
      }
    }

    // values: a value written in this step swaps in halfway through the transition and stays orange for the step
    c.textAlign = "center"; c.textBaseline = "middle";
    const fontFor = (s) => `700 ${Math.max(24, Math.round(cs * (s.length <= 1 ? 0.5 : s.length === 2 ? 0.42 : 0.31)))}px ${MONO}`;
    for (let r = 0; r < R; r++) for (let q = 0; q < C; q++) {
      const changed = grid[r][q] !== prev[r][q], showNew = !changed || u >= 0.5, v = showNew ? grid[r][q] : prev[r][q];
      if (!v) continue;
      const here = (p) => !!p && p[0] === r && p[1] === q;
      const onCur = (here(atN) && (u >= 0.5 || here(atP))) || (here(atP) && u < 0.5); // the cursor is (mostly) over this cell
      const fresh = changed && showNew, muted = emptyVals.has(v);
      c.save();
      c.globalAlpha *= (onCur ? 1 : dimA(r * 16 + q)) * (changed ? Math.abs(u - 0.5) * 2 : 1) * (muted && !onCur && !fresh ? 0.6 : 1);
      c.fillStyle = onCur ? COL.ink : fresh ? COL.orange : muted ? COL.muted : COL.white;
      c.font = fontFor(v); c.fillText(v, cx(q), cy(r) + 2, cs - 10);
      c.restore();
    }

    pathArrows();

    // named pointers: a coloured frame and a name tag on a corner of the cell; they slide between steps
    const order = [...new Set(steps.flatMap(s => Object.keys((s && s.ptr) || {})))], cols = h.ptrCols(), slotAt = {};
    const ts = clamp(Math.round(cs * 0.24), 26, 44), th = ts + 8;
    const ptrs = Object.keys(st.ptr || {}).map(nm => {
      const b = cellOf(st.ptr[nm]); if (!b) return null; const was = cellOf((pr.ptr || {})[nm]), a = was || b;
      const slot = slotAt[b.join()] = (slotAt[b.join()] || 0) + 1;
      return { nm, slot, x: lerp(X(a[1]), X(b[1]), u), y: lerp(Y(a[0]), Y(b[0]), u), alpha: was ? 1 : u, col: cols[Math.max(0, order.indexOf(nm)) % cols.length] };
    }).filter(Boolean);
    ptrs.forEach(p => {
      const inset = (p.slot - 1) * 8; c.save(); c.globalAlpha *= p.alpha;
      box(p.x + inset, p.y + inset, cs - 2 * inset, cs - 2 * inset, rad); c.strokeStyle = COL.ink; c.lineWidth = 10; c.stroke();
      c.strokeStyle = p.col; c.lineWidth = 6; c.stroke(); c.restore();
    });
    ptrs.forEach(p => { // tags go to the corners in turn: top-left, bottom-right, bottom-left, top-right
      c.save(); c.globalAlpha *= p.alpha; c.font = `800 ${ts}px ${FONT}`;
      const tw = Math.max(th, c.measureText(p.nm).width + 20), right = p.slot % 2 === 0, low = p.slot === 2 || p.slot === 3;
      const tx = right ? p.x + cs + 6 - tw : p.x - 6, ty = (low ? p.y + cs : p.y) - th / 2;
      box(tx, ty, tw, th, 10); c.fillStyle = p.col; c.fill(); c.strokeStyle = COL.ink; c.lineWidth = 3; c.stroke();
      c.fillStyle = COL.ink; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(p.nm, tx + tw / 2, ty + th / 2 + 1);
      c.restore();
    });
  }

  const S = (name, items) => ({ kind: "stack", name, items });
  const Q = (name, items) => ({ kind: "queue", name, items });
  return {
    label: "Lưới 2 chiều (ma trận, bảng DP)",
    when: "lưới hoặc bảng hai chiều: đếm đảo, loang DFS/BFS trên lưới (flood fill), đường đi ngắn nhất trên lưới, duyệt ma trận, bảng quy hoạch động hai chiều (LCS, edit distance, unique paths), quay lui trên bàn cờ (N-Queens, word search).",
    prompt: `MÔ PHỎNG thuật toán trên lưới hai chiều. "rows": lưới, mỗi hàng là một chuỗi mà mỗi ký tự là một ô (["11000","11000"]) hoặc một mảng (["0","12",""], ô chưa có giá trị là ""); tối đa ${MAX_R}×${MAX_C}, nên 3–6 hàng và cột, ô tối đa 3 ký tự. "empty": các giá trị là ô trống (nước, tường), vẽ mờ; mặc định ["0","."], bảng DP đặt []. "rowLabels", "colLabels": nhãn hàng và cột (bảng DP: ký tự của hai chuỗi, ví dụ ["","a","c","e"]); bỏ qua thì hiện chỉ số. Một ô viết [hàng, cột], đếm từ 0; vùng chữ nhật viết [hàng đầu, cột đầu, hàng cuối, cột cuối]. Mỗi bước: "at": ô code đang đứng; "hi": [ô đang được kiểm tra, ví dụ ô hàng xóm]; "dim": [ô đã xét xong hoặc bị loại]; "region": [ô của vùng đang loang: hòn đảo đang duyệt, vùng đã lan tới]; "path": [ô nối thành đường theo thứ tự: đường BFS, truy vết DP, các ô đang chọn khi quay lui]; "ptr": {"i": [0,1]} khi code có nhiều con trỏ; "vals": {"1,2": "0"} ghi giá trị mới vào ô hàng 1 cột 2. Các trường này chỉ tả riêng bước đó, TRỪ "vals": giá trị đã ghi được GIỮ cho mọi bước sau, nên mỗi bước chỉ ghi những ô code vừa gán (nhấn chìm đất thành "0", điền ô DP), không lặp lại ô cũ. Loang DFS/BFS: mỗi bước lan thêm MỘT ô hoặc lấy MỘT ô khỏi queue, "box" chứa tọa độ dạng "1,2". Bảng DP: "rows" chỉ có hàng và cột cơ sở, mỗi bước điền một ô hoặc một đoạn hàng, cuối cùng vẽ "path" truy vết. Ví dụ bước: {"say": "…", "at": [1,0], "region": [[0,0],[1,0]], "vals": {"1,0": "0"}, "box": {"kind": "stack", "name": "dfs", "items": ["0,0","1,0"]}}.`,
    review: `Tự chạy lại code trên đúng lưới "rows" và đối chiếu từng bước: ô "at", các ô "hi", "region", "path" và tọa độ trong "box" phải theo đúng thứ tự duyệt và thứ tự các hướng của code. "vals" cộng dồn: giá trị một ô ở một bước là "rows" cộng mọi "vals" từ bước đầu tới bước đó, và phải bằng đúng giá trị code đã ghi.`,
    dataHint: `{"rows": ["11000","11000","00100"]} hoặc {"rows": [["0","0"],["0",""]], "rowLabels": ["","a"], "colLabels": ["","b"], "empty": []}. Mỗi hàng là một chuỗi (mỗi ký tự một ô) hoặc một mảng; tối đa ${MAX_R}×${MAX_C}, ô tối đa 3 ký tự. "empty" là các giá trị vẽ mờ như ô trống (mặc định "0" và ".").`,
    stepHint: `{"at": [0,1], "hi": [[1,1]], "dim": [[0,0]], "region": [[0,0],[0,1]], "path": [[0,0],[0,1]], "ptr": {"i": [0,1]}, "vals": {"0,1": "0"}}. Ô là [hàng, cột] đếm từ 0; vùng chữ nhật là [hàng đầu, cột đầu, hàng cuối, cột cuối]. Chú ý: "vals" (ghi giá trị mới vào ô "hàng,cột") được GIỮ cho mọi bước sau, chỉ ghi ô vừa đổi; các trường khác chỉ có hiệu lực trong bước đó.`,
    fields: ["rows", "rowLabels", "colLabels", "empty"],
    norm, normStep, draw,
    samples: [
      { // LeetCode 200, recursive DFS trying down, up, right, left; the box is the call stack
        heading: "ĐẾM *ĐẢO* BẰNG DFS", subtitle: "LeetCode 200: gặp ô đất thì loang DFS nhấn chìm cả hòn đảo rồi mới quét tiếp",
        narration: "Mình chạy thử trên một lưới bốn hàng năm cột.",
        rows: ["11000", "11000", "00100", "00011"],
        steps: [
          { say: "Mình quét từ góc trên trái. Ô hàng 0 cột 0 là số 1, tức là đất chưa thăm, nên count lên 1 và mình gọi DFS, nhấn chìm ô này thành 0.", at: [0, 0], region: [[0, 0]], vals: { "0,0": "0" }, box: S("dfs", ["0,0"]), vars: { count: "1" } },
          { say: "DFS thử đi xuống trước. Ô hàng 1 cột 0 cũng là đất nên mình nhấn chìm nó và có thêm một lời gọi nằm trên stack.", at: [1, 0], region: [[0, 0], [1, 0]], vals: { "1,0": "0" }, box: S("dfs", ["0,0", "1,0"]), vars: { count: "1" } },
          { say: "Từ đây, ô bên dưới là nước, ô bên trên đã chìm, còn ô bên phải ở hàng 1 cột 1 là đất. DFS loang sang phải và nhấn chìm ô đó.", at: [1, 1], region: [[0, 0], [1, 0], [1, 1]], vals: { "1,1": "0" }, box: S("dfs", ["0,0", "1,0", "1,1"]), vars: { count: "1" } },
          { say: "Bên dưới là nước nên DFS thử đi lên và gặp ô đất cuối cùng ở hàng 0 cột 1. Nhấn chìm nốt, cả bốn ô của hòn đảo đã thành 0.", at: [0, 1], region: [[0, 0, 1, 1]], vals: { "0,1": "0" }, box: S("dfs", ["0,0", "1,0", "1,1", "0,1"]), vars: { count: "1" } },
          { say: "Quanh ô này không còn đất, các lời gọi DFS lần lượt trả về và stack rỗng. Vòng quét trở lại ô xuất phát, hòn đảo này không thể bị đếm lần nữa.", at: [0, 0], region: [[0, 0, 1, 1]], box: S("dfs", []), vars: { count: "1" } },
          { say: "Vòng quét đi tiếp. Những ô vừa chìm giờ đều là 0 nên bị bỏ qua, cho tới ô hàng 2 cột 2 là đất mới. Count lên 2 và mình lại gọi DFS.", at: [2, 2], region: [[2, 2]], vals: { "2,2": "0" }, box: S("dfs", ["2,2"]), vars: { count: "2" } },
          { say: "Bốn ô hàng xóm của nó đều là nước nên DFS trả về ngay. Hòn đảo thứ hai chỉ có đúng một ô.", at: [2, 2], hi: [[3, 2], [1, 2], [2, 3], [2, 1]], region: [[2, 2]], box: S("dfs", []), vars: { count: "2" } },
          { say: "Quét tiếp tới ô hàng 3 cột 3 thì lại gặp đất. Count lên 3, mình nhấn chìm ô này và bắt đầu lượt DFS thứ ba.", at: [3, 3], region: [[3, 3]], vals: { "3,3": "0" }, box: S("dfs", ["3,3"]), vars: { count: "3" } },
          { say: "Bên dưới là mép lưới, bên trên là nước, còn bên phải là đất. DFS loang sang ô hàng 3 cột 4 và nhấn chìm nó.", at: [3, 4], region: [[3, 3, 3, 4]], vals: { "3,4": "0" }, box: S("dfs", ["3,3", "3,4"]), vars: { count: "3" } },
          { say: "Stack lại rỗng và vòng quét đi hết lưới mà không gặp thêm ô đất nào. Hàm trả về count bằng 3, tức là lưới có ba hòn đảo.", at: [3, 4], box: S("dfs", []), vars: { count: "3" } },
        ],
      },
      { // LeetCode 1143 with text1 = "ace" (rows) and text2 = "abcde" (columns); no box, no vars
        heading: "BẢNG *DP* CỦA LCS", subtitle: "LeetCode 1143: chuỗi con chung dài nhất của \"ace\" và \"abcde\"",
        narration: "Mình điền bảng quy hoạch động từng hàng một.",
        rows: [["0", "0", "0", "0", "0", "0"], ["0", "", "", "", "", ""], ["0", "", "", "", "", ""], ["0", "", "", "", "", ""]],
        rowLabels: ["", "a", "c", "e"], colLabels: ["", "a", "b", "c", "d", "e"], empty: [],
        steps: [
          { say: "Mỗi hàng là một ký tự của chuỗi ace, mỗi cột là một ký tự của chuỗi abcde. Hàng đầu và cột đầu ứng với chuỗi rỗng nên toàn số 0.", hi: [[0, 0, 0, 5], [1, 0, 3, 0]] },
          { say: "Ô đầu tiên so chữ a với chữ a. Hai ký tự giống nhau nên mình lấy ô chéo phía trên bên trái là 0 rồi cộng 1, được 1.", at: [1, 1], hi: [[0, 0]], vals: { "1,1": "1" } },
          { say: "Sang phải, chữ a khác chữ b. Khi khác nhau mình lấy số lớn hơn giữa ô phía trên là 0 và ô bên trái là 1, nên ô này bằng 1.", at: [1, 2], hi: [[0, 2], [1, 1]], vals: { "1,2": "1" } },
          { say: "Ba ô còn lại của hàng chữ a cũng không khớp ký tự nào, nên chúng lần lượt chép số 1 từ ô bên trái sang.", at: [1, 5], vals: { "1,3": "1", "1,4": "1", "1,5": "1" } },
          { say: "Xuống hàng chữ c, hai ô đầu chép số 1 từ phía trên. Tới cột chữ c thì khớp, nên ô này lấy ô chéo là 1 rồi cộng 1, thành 2.", at: [2, 3], hi: [[1, 2]], vals: { "2,1": "1", "2,2": "1", "2,3": "2" } },
          { say: "Chữ c không khớp với chữ d và chữ e, nên hai ô cuối hàng giữ nguyên số 2 lấy từ ô bên trái.", at: [2, 5], vals: { "2,4": "2", "2,5": "2" } },
          { say: "Ở hàng chữ e, bốn ô đầu đều không khớp. Mỗi ô lấy số lớn hơn giữa ô phía trên và ô bên trái, lần lượt được 1, 1, 2, 2.", at: [3, 4], vals: { "3,1": "1", "3,2": "1", "3,3": "2", "3,4": "2" } },
          { say: "Ô cuối cùng so chữ e với chữ e và khớp. Mình lấy ô chéo là 2 cộng 1 được 3, đó chính là độ dài chuỗi con chung dài nhất.", at: [3, 5], hi: [[2, 4]], vals: { "3,5": "3" } },
          { say: "Muốn biết đó là chuỗi nào, mình đi ngược từ góc dưới phải. Chữ e khớp nên đi chéo lên, rồi tại ô không khớp mình đi sang trái về phía số lớn hơn.", path: [[3, 5], [2, 4], [2, 3]] },
          { say: "Chữ c khớp nên lại đi chéo, lùi sang trái một ô, rồi chữ a khớp và đi chéo lần cuối. Ba bước chéo cho mình ba ký tự a, c, e.", path: [[3, 5], [2, 4], [2, 3], [1, 2], [1, 1], [0, 0]] },
        ],
      },
      { // LeetCode 994, BFS by levels trying down, up, right, left; one dequeue per step
        heading: "BFS *LAN* CAM THỐI", subtitle: "LeetCode 994: mỗi phút cam thối làm hỏng cam tươi kề bên, BFS đếm số phút",
        narration: "Số 2 là cam thối, số 1 là cam tươi, số 0 là ô trống.",
        rows: ["211", "110", "011"],
        steps: [
          { say: "Ban đầu chỉ có một quả cam thối ở góc trên trái, mình cho nó vào queue. Lưới có 6 quả cam tươi và đồng hồ đang ở phút 0.", region: [[0, 0]], box: Q("q", ["0,0"]), vars: { minutes: "0", fresh: "6" } },
          { say: "Lấy ô hàng 0 cột 0 ra khỏi queue. Cam tươi bên dưới và bên phải bị lây, đổi thành 2 và vào queue. Hết lớp đầu tiên nên minutes lên 1.", at: [0, 0], hi: [[1, 0], [0, 1]], region: [[0, 0], [1, 0], [0, 1]], vals: { "1,0": "2", "0,1": "2" }, box: Q("q", ["1,0", "0,1"]), vars: { minutes: "1", fresh: "4" } },
          { say: "Lớp thứ hai có hai ô. Ô hàng 1 cột 0 chỉ còn một hàng xóm tươi ở bên phải, quả đó bị thối và được thêm vào cuối queue.", at: [1, 0], hi: [[1, 1]], region: [[0, 0, 1, 1]], vals: { "1,1": "2" }, box: Q("q", ["0,1", "1,1"]), vars: { minutes: "1", fresh: "3" } },
          { say: "Ô hàng 0 cột 1 lây sang quả bên phải ở cột 2. Lớp thứ hai đã xử lý xong nên minutes tăng lên 2, lưới chỉ còn 2 quả tươi.", at: [0, 1], hi: [[0, 2]], region: [[0, 0, 1, 1], [0, 2]], vals: { "0,2": "2" }, box: Q("q", ["1,1", "0,2"]), vars: { minutes: "2", fresh: "2" } },
          { say: "Sang lớp thứ ba, ô ở giữa lưới làm thối quả ngay bên dưới nó. Bên phải nó là ô trống nên không có gì để lây.", at: [1, 1], hi: [[2, 1]], region: [[0, 0, 1, 1], [0, 2], [2, 1]], vals: { "2,1": "2" }, box: Q("q", ["0,2", "2,1"]), vars: { minutes: "2", fresh: "1" } },
          { say: "Ô hàng 0 cột 2 không còn hàng xóm tươi nào, vì bên dưới nó là ô trống. Lớp thứ ba kết thúc và minutes lên 3.", at: [0, 2], hi: [[1, 2]], region: [[0, 0, 1, 1], [0, 2], [2, 1]], box: Q("q", ["2,1"]), vars: { minutes: "3", fresh: "1" } },
          { say: "Lớp thứ tư chỉ có ô hàng 2 cột 1. Nó làm thối quả cuối cùng ở góc dưới phải, fresh về 0 và minutes lên 4.", at: [2, 1], hi: [[2, 2]], region: [[0, 0, 1, 1], [0, 2], [2, 1, 2, 2]], vals: { "2,2": "2" }, box: Q("q", ["2,2"]), vars: { minutes: "4", fresh: "0" } },
          { say: "Không còn cam tươi nên vòng lặp dừng, dù trong queue vẫn còn một ô. Đáp án là 4 phút.", region: [[0, 0, 1, 1], [0, 2], [2, 1, 2, 2]], box: Q("q", ["2,2"]), vars: { minutes: "4", fresh: "0" } },
        ],
      },
      { // LeetCode 79 with word = "SEE", DFS trying up, down, left, right; k = letters matched so far
        heading: "*QUAY LUI* TÌM TỪ", subtitle: "LeetCode 79: tìm từ SEE trên bảng chữ, đi vào ngõ cụt thì lùi lại và thử hướng khác",
        narration: "Mình tìm từ SEE trên bảng chữ ba hàng bốn cột.",
        rows: ["ABCE", "SFCS", "ADEE"],
        steps: [
          { say: "Từ cần tìm là SEE nên ô bắt đầu phải là chữ S. Ô góc trên trái là chữ A, không khớp, và cả hàng đầu cũng không có chữ S nào.", at: [0, 0], vars: { k: "0", "word[k]": "S" } },
          { say: "Ô hàng 1 cột 0 là chữ S nên mình thử đi từ đây. Chữ tiếp theo phải là E, nhưng ba ô kề nó là A, A và F, không ô nào khớp.", at: [1, 0], hi: [[0, 0], [2, 0], [1, 1]], path: [[1, 0]], vars: { k: "1", "word[k]": "E" } },
          { say: "Nhánh đó thất bại nên mình bỏ nó và quét tiếp. Ô hàng 1 cột 3 cũng là chữ S, mình bắt đầu một đường đi mới từ đây.", at: [1, 3], dim: [[1, 0]], path: [[1, 3]], vars: { k: "1", "word[k]": "E" } },
          { say: "Thử đi lên trước. Ô hàng 0 cột 3 là chữ E, khớp với chữ thứ hai. Đường đi dài thêm một ô và mình cần đúng một chữ E nữa.", at: [0, 3], dim: [[1, 0]], path: [[1, 3], [0, 3]], vars: { k: "2", "word[k]": "E" } },
          { say: "Từ ô E này, bên trên và bên phải là mép bảng, bên trái là chữ C, còn bên dưới là ô đã nằm trên đường đi. Không hướng nào đi được.", at: [0, 3], hi: [[0, 2]], dim: [[1, 0]], path: [[1, 3], [0, 3]], vars: { k: "2", "word[k]": "E" } },
          { say: "Vậy là ngõ cụt. Mình quay lui, tức là bỏ ô E đó khỏi đường đi và trở về ô chữ S để thử hướng khác.", at: [1, 3], dim: [[1, 0], [0, 3]], path: [[1, 3]], vars: { k: "1", "word[k]": "E" } },
          { say: "Lần này mình đi xuống. Ô hàng 2 cột 3 cũng là chữ E và khớp, nên đường đi lại có hai ô.", at: [2, 3], dim: [[1, 0], [0, 3]], path: [[1, 3], [2, 3]], vars: { k: "2", "word[k]": "E" } },
          { say: "Bên trên là ô đang dùng, bên dưới là mép bảng, còn bên trái là chữ E. Đã khớp đủ ba chữ S, E, E nên hàm trả về true.", at: [2, 2], dim: [[1, 0], [0, 3]], path: [[1, 3], [2, 3], [2, 2]], vars: { k: "3", found: "true" } },
        ],
      },
    ],
  };
})()]);

// Simulation scene "tree": binary trees (LeetCode level-order form), n-ary trees, tries, heaps and recursion trees.
// Scene data: nodes (labels), optional parent (parent index of every node; absent = level-order binary), optional edge
// (a short label on the edge to each node's parent). Every step marks nodes by their index in "nodes".
(function () {
  const MAX_BIN = 15, MAX_GEN = 16, MAX_LEVELS = 5, LBL = 7;
  const NIL = /^(null|none|nil|)$/i;
  // An array from an array, a JSON string or "a,b,c".
  const list = (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v !== "string" || !v.trim()) return [];
    const s = v.trim();
    if (s[0] === "[") { try { const j = JSON.parse(s); if (Array.isArray(j)) return j; } catch (e) { /* fall through */ } }
    return s.replace(/^\[|\]$/g, "").split(",").map(x => x.trim());
  };
  const arr = (s, k) => (s && Array.isArray(s[k]) ? s[k] : []);
  const obj = (s, k) => (s && s[k] && typeof s[k] === "object" ? s[k] : {});
  const shownIn = (s, i) => !(s && Number.isFinite(s.show)) || i < s.show;

  // Tree structure and abstract layout. par[i] is the parent index, -1 for the root, -2 for a slot that is not drawn.
  // x is in leaf-slot units: leaves sit one unit apart and a parent is centred over its children. In a binary tree
  // a missing sibling still takes a slot, so a single child keeps its left or right slant.
  function build(sc) {
    const nodes = arr(sc, "nodes"), n = nodes.length;
    const binary = !arr(sc, "parent").length;
    let par = new Array(n).fill(-2), side = new Array(n).fill(0);
    if (!binary) {
      for (let i = 0; i < n; i++) { const p = sc.parent[i]; par[i] = i === 0 ? -1 : Number.isInteger(p) && p >= 0 && p < i ? p : 0; }
    } else if (n && nodes[0] != null) {
      // LeetCode form: children are listed only for nodes that exist.
      par[0] = -1; const q = [0]; let i = 1;
      while (q.length && i < n) { const p = q.shift(); for (const sd of [-1, 1]) { if (i < n && nodes[i] != null) { par[i] = p; side[i] = sd; q.push(i); } i++; } }
      const lost = (pp) => pp.filter((p, j) => p === -2 && nodes[j] != null).length;
      if (lost(par)) {
        // Heap form (children of slot i at 2i+1 and 2i+2): used when it keeps more of the nodes.
        const hp = new Array(n).fill(-2), hs = new Array(n).fill(0); hp[0] = -1;
        for (let j = 1; j < n; j++) if (nodes[j] != null && hp[(j - 1) >> 1] !== -2) { hp[j] = (j - 1) >> 1; hs[j] = j % 2 ? -1 : 1; }
        if (lost(hp) < lost(par)) { par = hp; side = hs; }
      }
    }
    const depth = new Array(n).fill(0), kids = nodes.map(() => []);
    for (let i = 1; i < n; i++) {
      const p = par[i]; if (p < 0) continue;
      if (par[p] === -2 || depth[p] + 1 >= MAX_LEVELS) { par[i] = -2; continue; }
      depth[i] = depth[p] + 1; kids[p].push(i);
    }
    const x = new Array(n).fill(0); let next = 0;
    const put = (i) => {
      const k = kids[i]; if (!k.length) { x[i] = next++; return; }
      const one = binary && k.length === 1 ? side[k[0]] : 0;
      if (one > 0) next++;
      k.forEach(put);
      if (one < 0) next++;
      x[i] = one ? x[k[0]] - one * 0.5 : (x[k[0]] + x[k[k.length - 1]]) / 2;
    };
    const drawn = []; for (let i = 0; i < n; i++) if (par[i] !== -2) drawn.push(i);
    if (drawn.length) put(0);
    const xs = drawn.map(i => x[i]), xmin = Math.min(...xs, 0);
    return { nodes, n, par, depth, kids, drawn, x: x.map(v => v - xmin), cols: drawn.length ? Math.max(...xs) - xmin : 0, levels: drawn.length ? Math.max(...drawn.map(i => depth[i])) + 1 : 0 };
  }

  function norm(sc, h) {
    sc = sc && typeof sc === "object" ? sc : {};
    let raw = list(sc.nodes ?? sc.tree ?? sc.values), par = list(sc.parent ?? sc.parents);
    // nodes written as objects: {label, parent}
    const objs = raw.map(o => (o && typeof o === "object" && !Array.isArray(o) ? o : null));
    if (!par.length && objs.some(o => o && (o.parent ?? o.p) != null)) par = objs.map(o => (o ? o.parent ?? o.p ?? -1 : -1));
    raw = raw.map((v, i) => (objs[i] ? objs[i].label ?? objs[i].val ?? objs[i].value ?? objs[i].text ?? "" : v));
    const general = par.length > 0;
    let nodes = raw.slice(0, general ? MAX_GEN : MAX_BIN).map(v => (general ? (v == null ? "" : h.str(v, LBL)) : v == null || NIL.test(String(v).trim()) ? null : h.str(v, LBL)));
    if (!general) { while (nodes.length && nodes[nodes.length - 1] == null) nodes.pop(); if (nodes[0] == null) nodes = []; }
    const out = { nodes };
    if (general) out.parent = nodes.map((_, i) => { const p = Math.round(+par[i]); return i > 0 && Number.isFinite(p) && p >= 0 && p < i ? p : i ? 0 : -1; });
    const e = list(sc.edge ?? sc.edges ?? sc.edgeLabels);
    if (e.length) { const edge = nodes.map((_, i) => (i && e[i] != null && typeof e[i] !== "object" ? h.str(e[i], 4) : "")); if (edge.some(Boolean)) out.edge = edge; }
    return out;
  }

  // Only the fields that are set are kept, so a step's JSON stays short in the editor.
  function normStep(st, data, h) {
    st = st && typeof st === "object" ? st : {};
    const n = arr(data, "nodes").length, o = {};
    const idx = (v) => { if (v == null || v === "" || typeof v === "object" || typeof v === "boolean") return -1; const x = Math.round(+v); return Number.isFinite(x) && x >= 0 && x < n ? x : -1; };
    const ids = (v) => [...new Set((Array.isArray(v) ? v : v == null ? [] : String(v).split(/[\s,]+/)).map(idx).filter(x => x >= 0))];
    const texts = (v, len) => { const t = {}; if (v && typeof v === "object") Object.entries(v).forEach(([k, x]) => { const i = idx(k), s = x == null ? "" : h.str(x, len); if (i >= 0 && s) t[i] = s; }); return t; };
    const ats = ids(st.at ?? st.cur ?? st.node);
    if (ats.length) o.at = ats[0];
    for (const [k, alt] of [["path", "stack"], ["hi", "highlight"], ["done", "ok"], ["dim", "pruned"], ["bad", "reject"]]) {
      const l = ids(st[k] ?? st[alt]).concat(k === "hi" ? ats.slice(1) : []); if (l.length) o[k] = [...new Set(l)];
    }
    const src = st.ptr || st.pointers, ptr = {};
    if (src && typeof src === "object") (Array.isArray(src) ? src.map(p => [p && (p.name || p.label), p && (p.at ?? p.index)]) : Object.entries(src)).slice(0, 4).forEach(([k, v]) => { const nm = h.str(k, 5), i = idx(v); if (nm && i >= 0) ptr[nm] = i; });
    if (Object.keys(ptr).length) o.ptr = ptr;
    const vals = texts(st.vals ?? st.values ?? st.val, 6), lab = texts(st.lab ?? st.labels, LBL);
    if (Object.keys(vals).length) o.vals = vals;
    if (Object.keys(lab).length) o.lab = lab;
    const sh = st.show ?? st.shown, shn = typeof sh === "number" || (typeof sh === "string" && sh.trim()) ? Math.round(+sh) : NaN;
    if (Number.isFinite(shn) && shn >= 1 && shn < n) o.show = shn;
    return o;
  }

  function draw(c, sc, f, h) {
    const { COL, FONT, MONO, lerp, clamp } = h;
    const T = build(sc || {}); if (!T.drawn.length || !f || !f.area) return;
    const A = f.area, st = f.st || {}, pr = f.pr || st, u = f.u == null ? 1 : clamp(+f.u || 0, 0, 1);
    const steps = Array.isArray(f.steps) && f.steps.length ? f.steps : [st];
    const anyVals = steps.some(s => Object.keys(obj(s, "vals")).length), anyPtr = steps.some(s => Object.keys(obj(s, "ptr")).length);
    // geometry: column width from the leaf slots, radius and level gap from the area's height
    // a pointer on a leaf hangs under it, so the deepest level then needs room below
    const Lv = T.levels, isLeaf = (i) => T.drawn.includes(i) && !T.kids[i].length;
    const lowPtr = steps.some(s => Object.values(obj(s, "ptr")).some(i => isLeaf(i) && T.depth[i] === Lv - 1));
    const padX = 14 + (anyPtr ? 30 : 0), padT = 14, padB = 14 + (anyVals ? 26 : 0) + (lowPtr ? 76 : 0);
    const availW = A.w - 2 * padX, availH = A.h - padT - padB;
    const colW = Math.min(300, availW / (T.cols + 1));
    const r = Math.max(20, Math.min(colW * 0.4, 62, Lv > 1 ? availH * 0.32 / (Lv - 1 + 0.64) : availH / 2));
    const gap = Lv > 1 ? Math.min(290, (availH - 2 * r) / (Lv - 1)) : 0;
    const x0 = A.x + A.w / 2 - T.cols * colW / 2, y0 = A.y + padT + (availH - gap * (Lv - 1) - 2 * r) / 2 + r;
    const mono = (sz, wt = 700) => `${wt} ${Math.round(sz)}px ${MONO}`;
    const has = (s, k, i) => arr(s, k).includes(i);
    const amt = (fn, i) => lerp(fn(pr, i) ? 1 : 0, fn(st, i) ? 1 : 0, u);
    const labelOf = (s, i) => { const l = obj(s, "lab")[i]; return String(l != null ? l : T.nodes[i] == null ? "" : T.nodes[i]); };
    // every drawn node: position, pill width (a circle when the label is short) and font size
    const base = clamp(r * 0.8, 24, 46), maxW = Math.max(2 * r, colW - 12), N = {};
    for (const i of T.drawn) {
      const text = labelOf(st, i), old = labelOf(pr, i);
      c.font = mono(base); const tw = c.measureText(text).width;
      const w = clamp(tw + r * 0.7, 2 * r, maxW); let fs = base; while (fs > 24 && tw * fs / base > w - 14) fs -= 2;
      N[i] = { x: x0 + T.x[i] * colW, y: y0 + T.depth[i] * gap, w, fs, text: old !== text && u <= 0.5 ? old : text, flip: old !== text ? Math.abs(2 * u - 1) : 1 };
    }
    const shape = (nd, grow = 0) => { c.beginPath(); c.roundRect(nd.x - nd.w / 2 - grow, nd.y - r - grow, nd.w + 2 * grow, 2 * (r + grow), r + grow); };
    // distance from a node's centre to its outline along a unit direction
    const rim = (nd, ux, uy) => { const a = nd.w / 2 - r; if (a <= 0.5) return r; const t = Math.abs(uy) > 1e-6 ? r / Math.abs(uy) : 1e9; return Math.abs(ux) * t <= a ? t : a * Math.abs(ux) + Math.sqrt(Math.max(0, r * r - a * a * uy * uy)); };
    const dimA = (i) => lerp(has(pr, "dim", i) ? 0.32 : 1, has(st, "dim", i) ? 0.32 : 1, u);
    const onPath = (s, i) => has(s, "path", i) && has(s, "path", T.par[i]);
    const EDGE = "rgba(77,184,255,0.45)", efs = clamp(r * 0.62, 24, 30);
    // the highlighted path is orange while it is being walked and green once every node on it is accepted
    const pathCol = arr(st, "path").length && arr(st, "path").every(i => has(st, "done", i)) ? COL.green : COL.orange;

    // edges, behind the nodes; an edge to a node that does not exist yet is a faint dashed line
    for (const i of T.drawn) {
      const p = T.par[i]; if (p < 0) continue;
      const a = N[p], b = N[i], len = Math.hypot(b.x - a.x, b.y - a.y) || 1, ux = (b.x - a.x) / len, uy = (b.y - a.y) / len;
      const ra = rim(a, ux, uy), rb = rim(b, ux, uy);
      const x1 = a.x + ux * ra, y1 = a.y + uy * ra, x2 = b.x - ux * rb, y2 = b.y - uy * rb;
      const ap = amt(shownIn, i), line = (xe, ye) => { c.beginPath(); c.moveTo(x1, y1); c.lineTo(xe, ye); c.stroke(); };
      c.lineCap = "round";
      if (ap < 1) { c.save(); c.globalAlpha *= (1 - ap) * 0.22; c.setLineDash([10, 12]); c.strokeStyle = COL.blue; c.lineWidth = 3; line(x2, y2); c.restore(); }
      if (ap <= 0) continue;
      c.save(); c.globalAlpha *= ap * dimA(i);
      const xe = lerp(x1, x2, ap), ye = lerp(y1, y2, ap);
      c.strokeStyle = EDGE; c.lineWidth = 4; line(xe, ye);
      const pa = amt(onPath, i);
      if (pa > 0) { c.save(); c.globalAlpha *= pa; c.strokeStyle = pathCol; c.lineWidth = 8; line(xe, ye); c.restore(); }
      const el = arr(sc, "edge")[i];
      if (el) {
        c.font = `700 ${Math.round(efs)}px ${FONT}`; c.textAlign = "center"; c.textBaseline = "middle";
        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2, tw = c.measureText(el).width + 14;
        c.fillStyle = COL.bg; c.beginPath(); c.roundRect(mx - tw / 2, my - efs / 2 - 4, tw, efs + 8, 8); c.fill();
        c.fillStyle = pa > 0.5 ? pathCol : COL.white; c.fillText(el, mx, my + 1);
      }
      c.restore();
    }

    // nodes: the look fades from the previous step's state to this step's
    const kind = (s, i) => (s.at === i ? "at" : has(s, "bad", i) ? "bad" : has(s, "done", i) ? "done" : has(s, "hi", i) ? "hi" : has(s, "path", i) ? "path" : "");
    const LOOK = { "": [null, EDGE, 3], at: [COL.orange, COL.orange, 3], bad: ["rgba(255,92,108,0.28)", COL.red, 5], done: ["rgba(52,211,153,0.26)", COL.green, 5], hi: ["rgba(77,184,255,0.16)", COL.blue, 5], path: [null, COL.orange, 5] };
    const look = (nd, k, a) => { if (a <= 0) return; const [fill, stroke, lw] = LOOK[k]; c.save(); c.globalAlpha *= a; shape(nd); if (fill) { c.fillStyle = fill; c.fill(); } c.strokeStyle = stroke; c.lineWidth = lw; c.stroke(); c.restore(); };
    for (const i of T.drawn) {
      const nd = N[i], ap = amt(shownIn, i);
      if (ap < 1) { c.save(); c.globalAlpha *= (1 - ap) * 0.22; c.setLineDash([10, 12]); c.strokeStyle = COL.blue; c.lineWidth = 3; shape(nd); c.stroke(); c.restore(); }
      if (ap <= 0) continue;
      c.save(); c.globalAlpha *= ap * dimA(i);
      if (ap < 1) { c.translate(nd.x, nd.y); c.scale(0.6 + 0.4 * ap, 0.6 + 0.4 * ap); c.translate(-nd.x, -nd.y); }
      shape(nd); c.fillStyle = COL.disk; c.fill();
      const k1 = kind(pr, i), k2 = kind(st, i);
      if (k1 !== k2) look(nd, k1, 1 - u);
      look(nd, k2, k1 === k2 ? 1 : u);
      const ink = k1 === k2 ? k2 === "at" : (u > 0.5 ? k2 : k1) === "at";
      c.globalAlpha *= nd.flip; c.font = mono(nd.fs); c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = ink ? COL.ink : COL.white; c.fillText(nd.text, nd.x, nd.y + 2, nd.w - 10);
      c.restore();
    }

    // cursor ring: slides from the previous "at" to this one
    const ca = shownIn(pr, pr.at) ? N[pr.at] : null, cb = shownIn(st, st.at) ? N[st.at] : null;
    if (ca || cb) {
      const a = ca || cb, b = cb || ca, al = ca && cb ? 1 : cb ? u : 1 - u;
      if (al > 0) { c.save(); c.globalAlpha *= al; shape({ x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u), w: lerp(a.w, b.w, u) }, 9); c.strokeStyle = COL.orange; c.lineWidth = 5; c.stroke(); c.restore(); }
    }

    // values beside nodes: a tag on the bottom rim; one that is new or changed in this step is filled
    const v1 = obj(pr, "vals"), v2 = obj(st, "vals"), bh = clamp(r * 0.72, 32, 44);
    for (const key of Object.keys(v2)) {
      const nd = N[key]; if (!nd || !shownIn(st, +key)) continue;
      const txt = String(v2[key]), fresh = pr !== st && v1[key] !== v2[key];
      c.save(); if (pr !== st && v1[key] === undefined) c.globalAlpha *= u;
      c.font = mono(Math.max(24, bh * 0.74)); const bw = Math.max(bh + 8, c.measureText(txt).width + 20), by = nd.y + r + 4;
      c.beginPath(); c.roundRect(nd.x - bw / 2, by - bh / 2, bw, bh, bh / 2); c.fillStyle = COL.bg; c.fill();
      if (fresh) { c.save(); c.globalAlpha *= u; c.fillStyle = COL.yellow; c.fill(); c.restore(); }
      c.strokeStyle = COL.yellow; c.lineWidth = 2.5; c.stroke();
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = fresh && u > 0.5 ? COL.ink : COL.yellow; c.fillText(txt, nd.x, by + 2);
      c.restore();
    }

    // named pointers: a triangle and the name, under a leaf, on an inner node's outer shoulder, or beside the root;
    // they slide between steps
    const pfs = Math.round(Lv > 1 ? clamp((gap - 2 * r) * 0.6, 26, 38) : 38), tri = pfs * 0.68;
    c.font = `800 ${pfs}px ${FONT}`;
    const place = (s) => {
      const out = {}, groups = {};
      for (const [nm, i] of Object.entries(obj(s, "ptr"))) if (N[i] && shownIn(s, i)) (groups[i] = groups[i] || []).push(nm);
      for (const key of Object.keys(groups)) {
        const nd = N[key], names = groups[key], ws = names.map(nm => c.measureText(nm).width), W = ws.reduce((a, b) => a + b, 0) + 12 * (names.length - 1);
        const p = T.par[key] >= 0 ? N[T.par[key]] : null;
        let sd = p && p.x < nd.x - 1 ? 1 : -1, dx, dy, tx, ty, lx, ly;
        if (isLeaf(+key)) {
          // under a leaf, like a pointer under an array cell (below the value tag when there is one)
          dx = 0; dy = 1; tx = nd.x; ty = nd.y + r + (obj(s, "vals")[key] !== undefined ? bh / 2 + 10 : 12); lx = nd.x; ly = ty + tri + 4 + pfs / 2;
        } else if (!p) {
          if (nd.x - nd.w / 2 - 20 - tri - W < A.x) sd = 1;
          dx = sd; dy = 0; tx = nd.x + sd * (nd.w / 2 + 12); ty = nd.y; lx = tx + sd * (tri + 8 + W / 2); ly = ty;
        } else {
          if (Math.abs(p.x - nd.x) <= 1 && nd.x - nd.w / 2 - W < A.x) sd = 1;
          dx = sd * 0.64; dy = -0.77; tx = nd.x + sd * (nd.w / 2 - r) + dx * (r + 12); ty = nd.y + dy * (r + 12);
          lx = tx + dx * tri + sd * (W / 2 - 6); ly = ty + dy * tri - pfs * 0.55; // the names sit above the triangle's base, growing outwards
        }
        lx = clamp(lx, A.x + W / 2 + 2, A.x + A.w - W / 2 - 2);
        let off = lx - W / 2;
        names.forEach((nm, j) => { out[nm] = { tx, ty, dx, dy, lx: off + ws[j] / 2, ly }; off += ws[j] + 12; });
      }
      return out;
    };
    const P1 = place(pr), P2 = place(st), cols = h.ptrCols(), order = [...new Set(steps.flatMap(s => Object.keys(obj(s, "ptr"))))];
    for (const nm of Object.keys(P2)) {
      const b = P2[nm], a = P1[nm] || b, m = (k) => lerp(a[k], b[k], u);
      let dx = m("dx"), dy = m("dy"); const dl = Math.hypot(dx, dy) || 1; dx /= dl; dy /= dl;
      const tx = m("tx"), ty = m("ty"), bx = tx + dx * tri, by = ty + dy * tri, hw = tri * 0.6;
      c.save(); if (!P1[nm]) c.globalAlpha *= u;
      c.fillStyle = cols[Math.max(0, order.indexOf(nm)) % cols.length];
      c.beginPath(); c.moveTo(tx, ty); c.lineTo(bx - dy * hw, by + dx * hw); c.lineTo(bx + dy * hw, by - dx * hw); c.closePath(); c.fill();
      c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(nm, m("lx"), m("ly") + 1);
      c.restore();
    }
  }

  const Q = (items) => ({ kind: "queue", name: "q", items });
  (window.__codelensSimDefs = window.__codelensSimDefs || []).push(["tree", {
    label: "Cây (tree)",
    when: "cây nhị phân, BST, heap, trie (duyệt DFS, BFS theo tầng, chiều sâu, đường đi, tổ tiên chung) và CÂY ĐỆ QUY của backtracking hay memo (subsets, permutations, Fibonacci).",
    prompt: 'vẽ một cây, mỗi bước đánh dấu nút theo CHỈ SỐ. "nodes": cây nhị phân viết level-order như LeetCode, null là thiếu con, ví dụ [3,9,20,null,null,15,7] (tối đa 15 phần tử, 4 tầng). Cây nhiều nhánh, trie và cây đệ quy thì thêm "parent": chỉ số nút cha của từng nút, gốc là -1, cha luôn đứng trước con, ví dụ "nodes": ["[]","[1]","[1,2]","[2]"], "parent": [-1,0,1,0] (tối đa 15 nút, 4 tầng, 8 lá, nhãn tối đa 6 ký tự; liệt kê nút theo đúng thứ tự được gọi). Tùy chọn "edge": nhãn ngắn trên cạnh nối mỗi nút với cha, ví dụ ["","a","b"] cho trie hoặc ["","+1","+2"]. Mọi trạng thái dùng chỉ số của nút trong "nodes" (từ 0, null cũng chiếm một chỉ số), KHÔNG dùng giá trị của nút. Mỗi bước {"say", "at": nút đang thăm, "path": [các nút từ gốc tới nút đang thăm, cạnh nối chúng được tô sáng], "hi": [nút đang chờ trong queue hoặc đang được so sánh], "done": [nút đã xử lý xong hoặc thuộc đáp án], "dim": [nhánh bị loại], "bad": [nút vi phạm], "ptr": {"p": 3, "cur": 1} con trỏ có tên, "vals": {"3": "1"} giá trị ghi cạnh nút (kết quả hàm đệ quy trả về, memo), "lab": {"0": "5"} nhãn mới của nút khi giá trị đổi (heap), "show": số nút đầu tiên đã mọc ra (cây đệ quy lớn dần theo từng lời gọi; bỏ trống là hiện cả cây)}. Mỗi bước là ảnh chụp đầy đủ: nút nào còn đánh dấu thì phải ghi lại, trường nào rỗng thì bỏ. BFS thì kèm "box" queue; DFS đệ quy thì ghi giá trị trả về vào "vals". Ví dụ một bước: {"say": "…", "at": 4, "path": [0,1,4], "done": [3], "vals": {"3": "1"}, "vars": {"best": "2"}}.',
    review: 'Mọi chỉ số trong at, path, hi, done, dim, ptr, vals phải trỏ đúng nút theo vị trí trong "nodes" (null cũng chiếm một chỉ số) chứ không phải theo giá trị, và thứ tự thăm nút phải đúng với thuật toán (DFS, BFS hay đệ quy). Với cây đệ quy, "parent" phải đúng quan hệ gọi hàm và "show" phải tăng dần theo đúng thứ tự gọi.',
    dataHint: 'cây nhị phân level-order, null là thiếu con: {"nodes": [3, 9, 20, null, null, 15, 7]}. Cây đệ quy, trie, cây nhiều nhánh: {"nodes": ["[]", "[1]", "[2]"], "parent": [-1, 0, 0], "edge": ["", "+1", "+2"]}',
    stepHint: '{"at": 2, "path": [0, 2], "hi": [5, 6], "done": [0], "dim": [1], "bad": [], "ptr": {"p": 5}, "vals": {"1": "2"}, "lab": {"0": "9"}, "show": 5}; mọi số là chỉ số nút trong "nodes", trường nào không dùng thì bỏ',
    fields: ["nodes", "parent", "edge"],
    norm, normStep, draw,
    samples: [
      { // LeetCode 102: level-order traversal with a queue
        heading: "DUYỆT *THEO TẦNG*", subtitle: "Queue giữ đúng các nút của một tầng, lấy hết tầng này mới sang tầng sau",
        narration: "Mình chạy BFS trên cây ví dụ của LeetCode 102 và theo dõi queue ở từng bước.",
        nodes: [3, 9, 20, null, null, 15, 7],
        steps: [
          { say: "Mình bỏ nút gốc 3 vào queue trước. Queue luôn chứa đúng những nút đang chờ được thăm, còn res thì chưa có tầng nào.", hi: [0], box: Q(["3"]), vars: { res: "[]" } },
          { say: "Tầng đầu chỉ có một nút. Mình lấy 3 ra khỏi queue, ghi vào level, rồi đẩy hai con của nó là 9 và 20 vào cuối queue.", at: 0, hi: [1, 2], box: Q(["9", "20"]), vars: { res: "[]", level: "[3]" } },
          { say: "Hết tầng nên level được chép vào res. Queue đang có hai nút, tức tầng mới có hai nút. Mình lấy 9 ra, nó là lá nên không đẩy thêm gì.", at: 1, done: [0], hi: [2], box: Q(["20"]), vars: { res: "[[3]]", level: "[9]" } },
          { say: "Lấy tiếp 20 ra và ghi vào level. Nút này có hai con là 15 và 7, mình đẩy cả hai vào queue để dành cho tầng sau.", at: 2, done: [0, 1], hi: [5, 6], box: Q(["15", "7"]), vars: { res: "[[3]]", level: "[9,20]" } },
          { say: "Tầng hai xong, res nhận thêm 9 và 20. Sang tầng ba, mình lấy 15 ra khỏi queue, nó không có con nào cả.", at: 5, done: [0, 1, 2], hi: [6], box: Q(["7"]), vars: { res: "[[3],[9,20]]", level: "[15]" } },
          { say: "Lấy nốt 7 ra, level bây giờ có 15 và 7. Queue đã rỗng, nghĩa là bên dưới không còn tầng nào nữa.", at: 6, done: [0, 1, 2, 5], box: Q([]), vars: { res: "[[3],[9,20]]", level: "[15,7]" } },
          { say: "Chép tầng cuối vào res rồi dừng vì queue rỗng. Kết quả là ba tầng từ trên xuống, mỗi nút được thăm đúng một lần.", done: [0, 1, 2, 5, 6], box: Q([]), vars: { res: "[[3],[9,20],[15,7]]", level: "[15,7]" } },
        ] },
      { // LeetCode 543: diameter of a binary tree, post-order DFS with the returned heights beside the nodes
        heading: "*ĐƯỜNG KÍNH* CỦA CÂY", subtitle: "Mỗi nút trả về chiều cao, còn đường kính là tổng hai nhánh lớn nhất",
        narration: "Mình duyệt DFS trên cây ví dụ của LeetCode 543 và ghi chiều cao mỗi nút trả về ngay cạnh nút đó.",
        nodes: [1, 2, 3, 4, 5],
        steps: [
          { say: "Hàm depth trả về chiều cao của một nhánh. Mình gọi nó ở gốc 1, nhưng gốc phải chờ hai con trả lời trước nên mình đi xuống bên trái.", at: 0, path: [0], vars: { best: "0" } },
          { say: "Tới nút 2, nó cũng chưa tính được gì vì còn hai con bên dưới. Mình đi tiếp xuống con trái của nó là nút 4.", at: 1, path: [0, 1], vars: { best: "0" } },
          { say: "Nút 4 là lá, hai phía đều rỗng nên l và r bằng 0. Đường đi qua nó dài 0, còn chiều cao trả về cho cha là 1.", at: 3, path: [0, 1, 3], vals: { 3: "1" }, vars: { best: "0", l: "0", r: "0" } },
          { say: "Quay lên rồi sang con phải là nút 5. Nó cũng là lá nên cho kết quả giống hệt: best vẫn là 0 và nó trả về 1.", at: 4, path: [0, 1, 4], vals: { 3: "1", 4: "1" }, vars: { best: "0", l: "0", r: "0" } },
          { say: "Giờ nút 2 đã có đủ hai câu trả lời, l bằng 1 và r bằng 1. Đường dài nhất uốn qua nó là 1 cộng 1 bằng 2 nên best lên 2, và nó trả về 2.", at: 1, path: [0, 1], hi: [3, 4], vals: { 1: "2", 3: "1", 4: "1" }, vars: { best: "2", l: "1", r: "1" } },
          { say: "Sang nhánh phải của gốc là nút 3. Đây là lá nên l và r bằng 0, best giữ nguyên là 2 và nút 3 trả về chiều cao 1.", at: 2, path: [0, 2], vals: { 1: "2", 2: "1", 3: "1", 4: "1" }, vars: { best: "2", l: "0", r: "0" } },
          { say: "Về lại gốc với l bằng 2 và r bằng 1. Đường uốn qua gốc dài 2 cộng 1 bằng 3, lớn hơn best cũ nên best thành 3.", at: 0, path: [0], hi: [1, 2], vals: { 0: "3", 1: "2", 2: "1", 3: "1", 4: "1" }, vars: { best: "3", l: "2", r: "1" } },
          { say: "Đáp án là 3, chính là đường đi từ nút 4 lên 2, qua gốc 1 rồi xuống 3. Cả cây chỉ được duyệt một lần nên rất nhanh.", done: [0, 1, 2, 3], path: [0, 1, 2, 3], vals: { 0: "3", 1: "2", 2: "1", 3: "1", 4: "1" }, vars: { best: "3" } },
        ] },
      { // LeetCode 78: subsets as a recursion tree that grows call by call (no box, no vars)
        heading: "CÂY ĐỆ QUY *SUBSETS*", subtitle: "Mỗi nút của cây đệ quy là một tập con, đủ 8 nút là đủ 8 tập con",
        narration: "Với bài Subsets, mình vẽ từng lời gọi đệ quy thành một nút để bạn thấy backtracking đi và quay lui thế nào.",
        nodes: ["[]", "[1]", "[1,2]", "[1,2,3]", "[1,3]", "[2]", "[2,3]", "[3]"], parent: [-1, 0, 1, 2, 1, 0, 5, 0],
        edge: ["", "+1", "+2", "+3", "+3", "+2", "+3", "+3"],
        steps: [
          { say: "Với nums gồm 1, 2, 3, lời gọi đầu tiên có cur rỗng. Vừa vào hàm là mình chép cur vào kết quả, nên tập rỗng là tập con đầu tiên.", show: 1, at: 0, path: [0] },
          { say: "Vòng lặp chọn số 1 bỏ vào cur rồi gọi đệ quy. Cây mọc thêm một nút, và tập chỉ có số 1 được ghi nhận ngay.", show: 2, at: 1, path: [0, 1], done: [0] },
          { say: "Từ đây mình chỉ được chọn các số đứng sau số 1 để không lặp lại tập cũ. Thêm 2 vào, ta có tập gồm 1 và 2.", show: 3, at: 2, path: [0, 1, 2], done: [0, 1] },
          { say: "Thêm tiếp 3 thì được tập đủ ba số. Sau số 3 không còn số nào để chọn nên vòng lặp không chạy, nhánh này dừng ở đây.", show: 4, at: 3, path: [0, 1, 2, 3], done: [0, 1, 2] },
          { say: "Mình quay lui: gỡ 3 ra, rồi gỡ 2 ra, cur chỉ còn số 1. Vòng lặp ở nút đó chọn tiếp số 3, sinh ra tập gồm 1 và 3.", show: 5, at: 4, path: [0, 1, 4], done: [0, 1, 2, 3] },
          { say: "Nhánh bắt đầu bằng số 1 đã hết. Quay về gốc, gỡ 1 ra và chọn số 2, từ giờ các tập con sẽ không chứa số 1 nữa.", show: 6, at: 5, path: [0, 5], done: [0, 1, 2, 3, 4] },
          { say: "Sau số 2 chỉ còn số 3 để thêm vào, nên nhánh này chỉ mọc thêm đúng một nút là tập gồm 2 và 3.", show: 7, at: 6, path: [0, 5, 6], done: [0, 1, 2, 3, 4, 5] },
          { say: "Quay về gốc lần cuối và chọn số 3. Sau nó không còn số nào nên nút này là lá, không gọi đệ quy thêm nữa.", at: 7, path: [0, 7], done: [0, 1, 2, 3, 4, 5, 6] },
          { say: "Cây có tám nút, mỗi nút là một tập con, đúng bằng 2 mũ 3. Thứ tự các nút mọc ra cũng chính là thứ tự trong kết quả.", done: [0, 1, 2, 3, 4, 5, 6, 7] },
        ] },
      { // LeetCode 235: lowest common ancestor in a BST, named pointers and ruled-out subtrees (no box, no vars)
        heading: "*TỔ TIÊN CHUNG* TRONG BST", subtitle: "Nút đầu tiên nằm giữa p và q chính là tổ tiên chung gần nhất",
        narration: "Bài tìm tổ tiên chung gần nhất trong BST chỉ cần đi một đường từ gốc xuống, mình chạy thử với p là 3 và q là 5.",
        nodes: [6, 2, 8, 0, 4, 7, 9, null, null, 3, 5],
        steps: [
          { say: "Cần tìm tổ tiên chung gần nhất của p là 3 và q là 5. Mình đặt cur ở gốc 6 và tận dụng thứ tự của BST thay vì duyệt cả cây.", at: 0, path: [0], ptr: { cur: 0, p: 9, q: 10 } },
          { say: "Cả 3 và 5 đều nhỏ hơn 6 nên hai nút chắc chắn nằm bên trái. Mình bỏ hẳn nhánh phải và cho cur xuống nút 2.", at: 1, path: [0, 1], dim: [2, 5, 6], ptr: { cur: 1, p: 9, q: 10 } },
          { say: "Lần này cả 3 và 5 đều lớn hơn 2, vậy p và q cùng nằm bên phải của nó. Bỏ nút 0, cur đi xuống nút 4.", at: 4, path: [0, 1, 4], dim: [2, 3, 5, 6], ptr: { cur: 4, p: 9, q: 10 } },
          { say: "Tại nút 4 thì p nhỏ hơn còn q lớn hơn, hai nút rẽ về hai phía. Đây là điểm tách nên 4 chính là đáp án, chỉ sau ba bước đi.", done: [4], path: [0, 1, 4], dim: [2, 3, 5, 6], ptr: { cur: 4, p: 9, q: 10 } },
        ] },
    ],
  }]);
})();

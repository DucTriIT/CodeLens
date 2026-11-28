// Simulation scene "graph": nodes and edges for BFS/DFS, topological sort, shortest paths and union-find.
// The scene holds labels and edges only; this module chooses every position (layers for a DAG, a ring otherwise).
(window.__codelensSimDefs = window.__codelensSimDefs || []).push(["graph", (() => {
  const MAXN = 10, MAXE = 24, TAGLEN = 7, EDGE_COL = "#6C83AB", TAU = Math.PI * 2;
  const cache = new Map(); // layouts, keyed by graph + area + which nodes carry tags
  const arr = (v) => Array.isArray(v) ? v : v == null || v === "" ? [] : typeof v === "string" ? v.split(/[\s,;]+/).filter(Boolean) : [v];
  const scalar = (x) => x != null && typeof x !== "object" && typeof x !== "boolean";
  const ARROW = /\s*(?:-+>?|>|→)\s*/;
  const strPairs = (s) => (s.match(/[\w.]+\s*(?:-+>?|>|→)\s*[\w.]+/g) || []).map(p => p.split(ARROW));
  const bez = (g, t) => { const s = 1 - t; return [s * s * g.p0[0] + 2 * s * t * g.c[0] + t * t * g.p2[0], s * s * g.p0[1] + 2 * s * t * g.c[1] + t * t * g.p2[1]]; };
  const hits = (rc, pts, pad) => pts.reduce((s, p) => s + (p[0] > rc[0] - pad && p[0] < rc[0] + rc[2] + pad && p[1] > rc[1] - pad && p[1] < rc[1] + rc[3] + pad ? 1 : 0), 0);
  const overlap = (a, b, pad) => a[0] < b[0] + b[2] + pad && b[0] < a[0] + a[2] + pad && a[1] < b[1] + b[3] + pad && b[1] < a[1] + a[3] + pad;
  const rcDist = (rc, p) => Math.hypot(Math.max(rc[0] - p[0], 0, p[0] - rc[0] - rc[2]), Math.max(rc[1] - p[1], 0, p[1] - rc[1] - rc[3]));

  function norm(sc, h) {
    sc = sc && typeof sc === "object" ? sc : {};
    const directed = [true, "true", 1, "1", "yes"].includes(sc.directed ?? sc.isDirected);
    // raw edges: [a, b, w] arrays, {from, to, w} objects, or a string such as "0-1, 1-2"
    let raw = sc.edges;
    if (typeof raw === "string") { try { raw = JSON.parse(raw); } catch (e) { raw = strPairs(raw); } }
    raw = (Array.isArray(raw) ? raw : []).map(e => Array.isArray(e) ? e : e && typeof e === "object" ? [e.from ?? e.u ?? e.a ?? e.source, e.to ?? e.v ?? e.b ?? e.target, e.w ?? e.weight ?? e.cost] : null)
      .filter(e => e && scalar(e[0]) && scalar(e[1])).slice(0, 80);
    const ends = raw.flatMap(e => [e[0], e[1]]);
    // nodes: labels, or a count n meaning 0..n-1; without it, count the nodes from the edges
    let nv = sc.nodes ?? sc.vertices ?? sc.n, labels, counted = false;
    if (typeof nv === "string" && /^\s*\d+\s*$/.test(nv)) nv = +nv;
    if (nv == null || (!Array.isArray(nv) && typeof nv !== "string" && typeof nv !== "number")) { nv = Math.max(-1, ...ends.map(x => Math.round(+x)).filter(x => x >= 0 && x < MAXN)) + 1; }
    if (typeof nv === "number") { counted = true; labels = Array.from({ length: h.clamp(Math.round(nv) || 0, 0, MAXN) }, (_, i) => String(i)); }
    else labels = arr(nv).slice(0, MAXN).map((x, i) => h.str(x, 4) || String(i));
    const n = labels.length;
    const isIdx = (x) => String(x).trim() !== "" && Number.isInteger(+x) && +x >= 0 && +x < n;
    const lab = (x) => labels.indexOf(String(x).trim());
    // rescue: endpoints written as labels (typically 1-based node numbers) instead of indexes
    let byLabel = false;
    if (ends.length && !ends.every(isIdx)) {
      if (ends.every(x => lab(x) >= 0)) byLabel = true;
      else if (counted && ends.every(x => Number.isInteger(+x) && +x >= 1 && +x <= n)) { labels = labels.map((_, i) => String(i + 1)); byLabel = true; }
    }
    const at = (x) => byLabel ? lab(x) : isIdx(x) ? +x : lab(x);
    const seen = new Set(), edges = [];
    raw.forEach(e => {
      const a = at(e[0]), b = at(e[1]); if (a < 0 || b < 0 || a === b || edges.length >= MAXE) return;
      const key = directed || a < b ? a + ">" + b : b + ">" + a; if (seen.has(key)) return; seen.add(key);
      const w = e[2], num = typeof w === "number" || (typeof w === "string" && w.trim() !== "") ? +w : NaN;
      const wv = Number.isFinite(num) ? h.clamp(Math.round(num * 100) / 100, -9999, 99999) : typeof w === "string" ? h.str(w, 4) : "";
      edges.push(wv === "" ? [a, b] : [a, b, wv]);
    });
    const sv = String(sc.shape || "").toLowerCase();
    const shape = /^(lay|dag|tầng|tang)/.test(sv) ? "layers" : /^(cir|ring|round|vòng)/.test(sv) ? "circle" : /^(grid|lưới)/.test(sv) ? "grid" : undefined;
    return { nodes: labels, edges, directed, shape, _byLabel: byLabel };
  }

  function normStep(st, data, h) {
    st = st && typeof st === "object" ? st : {}; data = data || {};
    const labels = Array.isArray(data.nodes) ? data.nodes : [], n = labels.length, E = Array.isArray(data.edges) ? data.edges : [];
    const ix = (x) => { if (!scalar(x)) return -1; const s = String(x).trim(), li = labels.indexOf(s); return data._byLabel ? li : s !== "" && Number.isInteger(+s) && +s >= 0 && +s < n ? +s : li; };
    const list = (v) => [...new Set(arr(v).map(ix).filter(i => i >= 0))];
    const hasEdge = (a, b) => E.some(e => (e[0] === a && e[1] === b) || (e[0] === b && e[1] === a));
    const pairs = (v) => {
      if (typeof v === "string") v = strPairs(v);
      v = Array.isArray(v) ? v : [];
      if (v.length === 2 && v.every(scalar)) v = [v]; // a single pair written flat
      const seen = new Set(), out = [];
      v.forEach(p => {
        if (p && !Array.isArray(p) && typeof p === "object") p = [p.from ?? p.u ?? p.a, p.to ?? p.v ?? p.b];
        if (!Array.isArray(p) || p.length < 2) return;
        const a = ix(p[0]), b = ix(p[1]), key = data.directed || a < b ? a + ">" + b : b + ">" + a; if (a < 0 || b < 0 || a === b || !hasEdge(a, b) || seen.has(key)) return;
        seen.add(key); out.push([a, b]);
      });
      return out;
    };
    const map = (v, fn) => {
      const o = {}, isA = Array.isArray(v), ent = isA ? v.map((x, i) => [i < n ? i : -1, x]) : v && typeof v === "object" ? Object.entries(v).map(([k, x]) => [ix(k), x]) : [];
      ent.map(([k, x]) => [k, fn(x)]).filter(([k, x]) => k >= 0 && x != null && x !== "").sort((p, q) => p[0] - q[0]).forEach(([k, x]) => { o[k] = x; });
      return o;
    };
    const a0 = st.at ?? st.cur ?? st.current ?? st.node, al = list(Array.isArray(a0) ? a0 : [a0]);
    const out = {}; if (al.length) out.at = al[0];
    const lists = { hi: [...new Set([...list(st.hi ?? st.highlight), ...al.slice(1)])], dim: list(st.dim ?? st.visited ?? st.seen), done: list(st.done ?? st.final ?? st.ok),
      edge: pairs(st.edge ?? st.edges ?? st.active), used: pairs(st.used ?? st.tree ?? st.path), bad: pairs(st.bad ?? st.reject ?? st.cut) };
    Object.keys(lists).forEach(k => { if (lists[k].length) out[k] = lists[k]; });
    const tags = map(st.tags ?? st.tag ?? st.labels, x => scalar(x) ? h.str(x, TAGLEN) : "");
    const group = map(st.group ?? st.groups ?? st.comp ?? st.colors ?? st.color, x => scalar(x) && x !== "" ? h.int(x, 0, 99, null) : null);
    if (Object.keys(tags).length) out.tags = tags;
    if (Object.keys(group).length) out.group = group;
    return out;
  }

  // Positions, node radius, edge curves, weight pills and tag slots for one scene in one area.
  function layout(c, sc, f, h) {
    const labels = sc.nodes, n = labels.length, A = f.area, steps = Array.isArray(f.steps) ? f.steps : [];
    const tagLen = labels.map((_, i) => Math.max(0, ...steps.map(s => s && s.tags && s.tags[i] != null ? String(s.tags[i]).length : 0)));
    const key = JSON.stringify([n, sc.edges, sc.directed, sc.shape, A.x, A.y, A.w, A.h, tagLen]);
    if (cache.has(key)) return cache.get(key);
    const ok = (x) => Number.isInteger(x) && x >= 0 && x < n;
    const E = (Array.isArray(sc.edges) ? sc.edges : []).filter(e => Array.isArray(e) && ok(e[0]) && ok(e[1]) && e[0] !== e[1]).map(e => ({ a: e[0], b: e[1], w: e[2] }));
    const dagDepth = () => { // longest-path depth; null when the graph has a cycle
      const ind = Array(n).fill(0), d = Array(n).fill(0), q = []; E.forEach(e => ind[e.b]++); ind.forEach((v, i) => { if (!v) q.push(i); }); let seen = 0;
      while (q.length) { const u = q.shift(); seen++; E.forEach(e => { if (e.a === u) { d[e.b] = Math.max(d[e.b], d[u] + 1); if (!--ind[e.b]) q.push(e.b); } }); }
      return seen === n ? d : null;
    };
    const bfsDepth = () => {
      const d = Array(n).fill(-1);
      for (let s = 0; s < n; s++) if (d[s] < 0) { d[s] = 0; const q = [s]; while (q.length) { const u = q.shift(); E.forEach(e => { const v = e.a === u ? e.b : e.b === u ? e.a : -1; if (v >= 0 && d[v] < 0) { d[v] = d[u] + 1; q.push(v); } }); } }
      return d;
    };
    const dag = sc.directed && E.length ? dagDepth() : null;
    const dagL = dag ? Math.max(...dag) + 1 : 0, dagM = dag ? Math.max(...dag.map(d => dag.filter(x => x === d).length)) : 0; // layers, and the widest one
    // a DAG reads best in layers, unless that makes one long row of nodes with no room for the edges
    const shape = ["circle", "layers", "grid"].includes(sc.shape) ? sc.shape : dag && dagL <= 5 && (dagM > 1 || dagL <= 3) ? "layers" : "circle";
    const depth = shape === "layers" ? (dag || bfsDepth()) : null;
    // ring order with the fewest edge crossings, then the shortest chords, then the least reordering
    const ring = (() => {
      const slot = labels.map((_, i) => i); if (shape !== "circle" || n < 4 || !E.length) return slot;
      const cost = (s) => {
        let x = 0;
        for (let i = 0; i < E.length; i++) {
          const p = s[E[i].a], q = s[E[i].b], lo = Math.min(p, q), hi = Math.max(p, q); x += Math.min(hi - lo, n - hi + lo) * 10;
          for (let j = i + 1; j < E.length; j++) { const u = s[E[j].a], v = s[E[j].b]; if (u !== p && u !== q && v !== p && v !== q && (u > lo && u < hi) !== (v > lo && v < hi)) x += 1000; }
        }
        for (let i = 0; i < n; i++) if (s[i] !== i) x++;
        return x;
      };
      let best = slot.slice(), bc = cost(slot);
      const swap = (s, i, j) => { const t = s[i]; s[i] = s[j]; s[j] = t; };
      if (n <= 8) { const perm = (k) => { if (k === n) { const cc = cost(slot); if (cc < bc) { bc = cc; best = slot.slice(); } return; } for (let j = k; j < n; j++) { swap(slot, k, j); perm(k + 1); swap(slot, k, j); } }; perm(1); }
      else for (let pass = 0, moved = true; moved && pass < 20; pass++) { moved = false; for (let i = 1; i < n; i++) for (let j = i + 1; j < n; j++) { swap(best, i, j); const cc = cost(best); if (cc < bc) { bc = cc; moved = true; } else swap(best, i, j); } }
      return best;
    })();
    // order inside each layer: a few barycentre sweeps
    const rows = []; const posIn = Array(n).fill(0);
    if (depth) {
      depth.forEach((d, i) => (rows[d] = rows[d] || []).push(i));
      const setPos = (r) => r.forEach((i, j) => { posIn[i] = j - (r.length - 1) / 2; });
      rows.forEach(setPos);
      for (let sweep = 0; sweep < 4; sweep++) {
        const down = sweep % 2 === 0;
        (down ? rows : rows.slice().reverse()).forEach(r => {
          const bc = {};
          r.forEach(i => { const nb = E.filter(e => e.a === i || e.b === i).map(e => e.a === i ? e.b : e.a).filter(v => down ? depth[v] < depth[i] : depth[v] > depth[i]); bc[i] = nb.length ? nb.reduce((s, v) => s + posIn[v], 0) / nb.length : posIn[i]; });
          r.sort((p, q) => bc[p] - bc[q] || p - q); setPos(r);
        });
      }
    }
    const place = (iw, ih) => {
      if (n === 1) return [[iw / 2, ih / 2]];
      if (shape === "layers") {
        const Lc = rows.length, M = Math.max(...rows.map(r => r.length));
        const horiz = Math.min(iw / Lc, ih / M) >= Math.min(ih / Lc, iw / M), main = horiz ? iw : ih, cross = horiz ? ih : iw;
        const gm = Lc > 1 ? Math.min(main / (Lc - 1), 420) : 0, gc = M > 1 ? Math.min(cross / (M - 1), 340) : 0;
        return labels.map((_, i) => { const m = main / 2 + (depth[i] - (Lc - 1) / 2) * gm, cr = cross / 2 + posIn[i] * gc; return horiz ? [m, cr] : [cr, m]; });
      }
      if (shape === "grid") {
        let cols = 1, bs = -1; for (let k = 1; k <= n; k++) { const s = Math.min(iw / k, ih / Math.ceil(n / k)); if (s > bs) { bs = s; cols = k; } }
        const rw = Math.ceil(n / cols), gx = cols > 1 ? Math.min(iw / (cols - 1), 380) : 0, gy = rw > 1 ? Math.min(ih / (rw - 1), 380) : 0;
        return labels.map((_, i) => [iw / 2 + (i % cols - (cols - 1) / 2) * gx, ih / 2 + (Math.floor(i / cols) - (rw - 1) / 2) * gy]);
      }
      // ellipse, nodes evenly spaced along its arc, starting at the top and going clockwise
      const M = 720, a = iw / 2, b = ih / 2, pts = [], cum = [0];
      for (let j = 0; j <= M; j++) { const th = -Math.PI / 2 + j / M * TAU; pts.push([a + a * Math.cos(th), b + b * Math.sin(th)]); if (j) cum.push(cum[j - 1] + Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1])); }
      const off = n % 2 ? 0 : -0.5;
      return ring.map(s => { const fr = (((s + off) / n) % 1 + 1) % 1, j = cum.findIndex(v => v >= fr * cum[M]); return pts[Math.max(0, j)]; });
    };
    const twin = new Set(E.map(e => e.a + ">" + e.b));
    let r = 60, mg = [0, 0, 0, 0], P = [], G = [], slots = {}; // mg: extra left, top, right, bottom room taken by tags
    for (let it = 0; it < 4; it++) {
      const last = it === 3, pad = r + 14;
      const iw = Math.max(40, A.w - 2 * pad - mg[0] - mg[2]), ih = Math.max(40, A.h - 2 * pad - mg[1] - mg[3]), ix0 = A.x + pad + mg[0], iy0 = A.y + pad + mg[1];
      P = place(iw, ih).map(p => [ix0 + p[0], iy0 + p[1]]);
      let dmin = Infinity; for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) dmin = Math.min(dmin, Math.hypot(P[i][0] - P[j][0], P[i][1] - P[j][1]));
      if (n > 1 && dmin > 520) { const cx = ix0 + iw / 2, cy = iy0 + ih / 2, k = 520 / dmin; P = P.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]); dmin = 520; } // a sparse graph is not stretched
      // radius: a third of the closest pair, and small enough to leave every edge room for its arrow and weight
      const emin = Math.min(Infinity, ...E.map(e => Math.hypot(P[e.a][0] - P[e.b][0], P[e.a][1] - P[e.b][1]))), need = (sc.directed ? 78 : 50) + (E.some(e => e.w != null) ? 44 : 0);
      const r2 = n < 2 ? 70 : h.clamp(Math.min(dmin * 0.3, (emin - need) / 2), 28, 70); r = last ? Math.min(r, r2) : r2;
      const cen = [P.reduce((s, p) => s + p[0], 0) / n, P.reduce((s, p) => s + p[1], 0) / n];
      // edges: straight, or bowed when a node is in the way or when the opposite directed edge exists
      G = E.map(e => {
        const p0 = P[e.a], p2 = P[e.b], dx = p2[0] - p0[0], dy = p2[1] - p0[1], d = Math.hypot(dx, dy) || 1, nx = -dy / d, ny = dx / d, mid = [(p0[0] + p2[0]) / 2, (p0[1] + p2[1]) / 2];
        const mk = (off) => ({ p0, p2, c: [mid[0] + nx * off, mid[1] + ny * off] });
        const clear = (g) => { // distance from the curve to the nearest other node; far below zero when it leaves the area
          let m = 1e6, pen = 0;
          for (let j = 1; j < 16; j++) { const q = bez(g, j / 16); if (q[0] < A.x + 8 || q[0] > A.x + A.w - 8 || q[1] < A.y + 8 || q[1] > A.y + A.h - 8) pen = 1e4; P.forEach((p, k) => { if (k !== e.a && k !== e.b) m = Math.min(m, Math.hypot(q[0] - p[0], q[1] - p[1])); }); }
          return m - pen;
        };
        let g = mk(0);
        if (sc.directed && twin.has(e.b + ">" + e.a)) g = mk(Math.max(34, d * 0.16));
        else if (clear(g) < r + 18) {
          const b = 2 * (r + 34) * ((mid[0] - cen[0]) * nx + (mid[1] - cen[1]) * ny < 0 ? -1 : 1), cand = [b, -b, 1.6 * b, -1.6 * b].map(mk).map(x => [clear(x), x]);
          g = (cand.find(x => x[0] >= r + 18) || cand.sort((p, q) => q[0] - p[0])[0])[1];
        }
        const solve = (from, cenP, rad) => { let lo = from, hi = 0.5; for (let j = 0; j < 14; j++) { const m = (lo + hi) / 2, q = bez(g, m); if (Math.hypot(q[0] - cenP[0], q[1] - cenP[1]) < rad) lo = m; else hi = m; } return hi; };
        g.t0 = solve(0, p0, r + 4); g.t1 = solve(1, p2, r + (sc.directed ? 7 : 4)); g.tb = sc.directed ? solve(1, p2, r + 31) : g.t1; // tb: where the arrowhead starts
        g.ok = d > 2 * r + (sc.directed ? 46 : 16) && g.t0 < g.tb;
        g.pts = Array.from({ length: 25 }, (_, j) => bez(g, g.t0 + (g.tb - g.t0) * j / 24)); g.tip = bez(g, g.t1); g.pill = null;
        return g;
      });
      // weight pills near the middle of each edge, moved along it when the middle is crowded
      const pills = []; c.font = `700 28px ${h.MONO}`;
      G.forEach((g, i) => {
        if (E[i].w == null || !g.ok) return;
        const txt = h.str(E[i].w, 5), pw = c.measureText(txt).width + 22, ph = 40; let best = null;
        [0.5, 0.4, 0.6, 0.31, 0.69].forEach(t => {
          const q = bez(g, g.t0 + (g.tb - g.t0) * t), rc = [q[0] - pw / 2, q[1] - ph / 2, pw, ph]; let s = Math.abs(t - 0.5) * 30;
          G.forEach((o, j) => { if (j !== i && o.ok) s += 10 * hits(rc, o.pts, 6); }); pills.forEach(pl => { if (overlap(rc, pl.rc, 6)) s += 200; }); P.forEach(p => { if (rcDist(rc, p) < r + 6) s += 200; });
          if (!best || s < best.s) best = { s, rc, txt };
        });
        g.pill = best; pills.push(best);
      });
      // tag slots: beside the node, preferably away from the centre and off the edges; they push the figure inwards
      slots = {}; const over = [0, 0, 0, 0]; c.font = `700 30px ${h.MONO}`; const cw = c.measureText("0").width;
      labels.forEach((_, i) => {
        if (!tagLen[i]) return;
        const tw = tagLen[i] * cw + 24, th = 44; let ox = P[i][0] - cen[0], oy = P[i][1] - cen[1]; const ol = Math.hypot(ox, oy);
        if (ol < 12) { ox = 0; oy = -1; } else { ox /= ol; oy /= ol; }
        let best = null;
        for (let a = 0; a < 12; a++) {
          const dx = Math.cos(a * TAU / 12), dy = Math.sin(a * TAU / 12); let s0 = r, rc;
          do { s0 += 4; rc = [P[i][0] + dx * s0 - tw / 2, P[i][1] + dy * s0 - th / 2, tw, th]; } while (rcDist(rc, P[i]) < r + 17);
          let s = 34 * Math.abs(dx) - 30 * (dx * ox + dy * oy); // above or below unless something is in the way
          G.forEach(g => { if (g.ok) s += 14 * hits(rc, g.pts, 5) + (hits(rc, [g.tip], 12) ? 40 : 0); });
          P.forEach((p, k) => { if (k !== i && rcDist(rc, p) < r + 10) s += 400; }); pills.forEach(pl => { if (overlap(rc, pl.rc, 4)) s += 300; }); Object.values(slots).forEach(o => { if (overlap(rc, o, 6)) s += 400; });
          const ov = [A.x + 4 - rc[0], A.y + 4 - rc[1], rc[0] + tw - (A.x + A.w - 4), rc[1] + th - (A.y + A.h - 4)].map(v => Math.max(0, v));
          s += last ? (ov[0] + ov[1] + ov[2] + ov[3]) * 20 : (ov[0] + ov[2]) + (ov[1] + ov[3]) * 0.4;
          if (!best || s < best.s) best = { s, rc, ov };
        }
        best.ov.forEach((v, j) => { over[j] = Math.max(over[j], v); });
        if (last) { best.rc[0] = h.clamp(best.rc[0], A.x + 4, Math.max(A.x + 4, A.x + A.w - 4 - tw)); best.rc[1] = h.clamp(best.rc[1], A.y + 4, Math.max(A.y + 4, A.y + A.h - 4 - th)); }
        slots[i] = best.rc;
      });
      mg = mg.map((v, j) => v + over[j]);
    }
    const L = { P, r, E, G, slots };
    if (cache.size > 40) cache.clear();
    cache.set(key, L);
    return L;
  }

  function draw(c, sc, f, h) {
    const labels = sc && Array.isArray(sc.nodes) ? sc.nodes : []; if (!labels.length || !f || !f.area) return;
    const { COL, MONO, lerp } = h, st = f.st || {}, pr = f.pr || st, first = pr === st, u = first || f.u == null ? 1 : h.clamp(+f.u || 0, 0, 1);
    const L = layout(c, sc, f, h), { P, r, E, G } = L, GC = [COL.blue, COL.violet, COL.yellow, "#FF8FD0", COL.white, COL.cyan, COL.teal];
    // what a step marks: node sets, and the state of every edge ("used" < "edge" < "bad")
    const view = (s) => {
      const has = (k, i) => Array.isArray(s[k]) && s[k].includes(i), es = new Map(), rev = new Map();
      ["used", "edge", "bad"].forEach(k => (Array.isArray(s[k]) ? s[k] : []).forEach(p => {
        if (!Array.isArray(p)) return; let j = E.findIndex(e => e.a === p[0] && e.b === p[1]), rv = false;
        if (j < 0) { j = E.findIndex(e => e.a === p[1] && e.b === p[0]); rv = true; }
        if (j >= 0) { es.set(j, k); rev.set(j, rv); }
      }));
      const dimE = (j) => !es.get(j) && has("dim", E[j].a) && has("dim", E[j].b);
      return { s, has, es, rev, dimE, tags: s.tags || {}, group: s.group || {} };
    };
    const Vs = view(st), Vp = first ? Vs : view(pr);
    const ECOL = { edge: COL.orange, used: COL.green, bad: COL.red };
    const drawEdge = (j, k, dimmed, al) => {
      const g = G[j]; if (!g.ok || al <= 0.01) return;
      c.save(); c.globalAlpha *= al * (dimmed ? 0.35 : 1); c.strokeStyle = c.fillStyle = ECOL[k] || EDGE_COL; c.lineWidth = k === "edge" ? 10 : k ? 8 : 5; c.lineCap = "round"; c.lineJoin = "round";
      if (k === "bad") c.setLineDash([22, 18]);
      c.beginPath(); g.pts.forEach((p, q) => q ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1])); c.stroke(); c.setLineDash([]);
      if (sc.directed) { // arrowhead with its tip just outside the target's rim
        const b = g.pts[24], t = g.tip, dx = t[0] - b[0], dy = t[1] - b[1], d = Math.hypot(dx, dy) || 1, hw = k ? 16 : 12;
        c.beginPath(); c.moveTo(t[0], t[1]); c.lineTo(b[0] - dy / d * hw, b[1] + dx / d * hw); c.lineTo(b[0] + dy / d * hw, b[1] - dx / d * hw); c.closePath(); c.fill();
      }
      c.restore();
    };
    // plain edges first, then the answer so far, rejected ones, and the edges being followed on top
    ["", "used", "bad", "edge"].forEach(k => E.forEach((_, j) => {
      const a = Vp.es.get(j) || "", b = Vs.es.get(j) || "", da = Vp.dimE(j), db = Vs.dimE(j), same = a === b && da === db;
      if (b === k) drawEdge(j, b, db, same ? 1 : u);
      if (a === k && !same) drawEdge(j, a, da, 1 - u);
    }));
    G.forEach((g, j) => { // weights
      if (!g.pill || !g.ok) return; const rc = g.pill.rc, k = Vs.es.get(j), col = ECOL[k] || null;
      c.beginPath(); c.roundRect(rc[0], rc[1], rc[2], rc[3], 14); c.fillStyle = COL.bg; c.fill();
      c.save(); if (Vs.dimE(j)) c.globalAlpha *= 0.45; c.strokeStyle = col || EDGE_COL; c.lineWidth = col ? 4 : 2.5; c.stroke();
      c.font = `700 28px ${MONO}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col || COL.white; c.fillText(g.pill.txt, rc[0] + rc[2] / 2, rc[1] + rc[3] / 2 + 1, rc[2] - 8); c.restore();
    });
    // nodes
    const styleOf = (V, i) => {
      const at = V.s.at === i, done = V.has("done", i), hi = V.has("hi", i), dim = V.has("dim", i) && !at && !done && !hi, g = V.group[i], gc = g != null ? GC[Math.abs(g) % GC.length] : null;
      return { fill: at ? COL.orange : done ? COL.green : COL.disk, tint: at || done ? null : gc || (hi ? COL.orange : null), ta: gc === COL.white ? 0.26 : gc ? 0.4 : 0.2,
        stroke: hi ? COL.orange : gc || (at ? COL.orange : done ? COL.green : "rgba(77,184,255,0.45)"), lw: hi ? 8 : gc ? 6 : 3, alpha: dim ? 0.32 : 1, ink: at || done };
    };
    const drawNode = (i, S, al) => {
      if (al <= 0.01) return; const x = P[i][0], y = P[i][1], t = String(labels[i]);
      c.save(); c.globalAlpha *= al * S.alpha; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = S.fill; c.fill();
      if (S.tint) { c.save(); c.globalAlpha *= S.ta; c.fillStyle = S.tint; c.fill(); c.restore(); }
      c.strokeStyle = S.stroke; c.lineWidth = S.lw; c.stroke();
      c.font = `700 ${Math.round(Math.min(r * 0.92, (2 * r - 14) / (0.62 * Math.max(1, t.length))))}px ${MONO}`; c.textAlign = "center"; c.textBaseline = "middle";
      c.fillStyle = S.ink ? COL.ink : COL.white; c.fillText(t, x, y + 2, 2 * r - 10); c.restore();
    };
    labels.forEach((_, i) => {
      const a = styleOf(Vp, i), b = styleOf(Vs, i);
      if (u >= 1 || JSON.stringify(a) === JSON.stringify(b)) drawNode(i, b, 1);
      else if (b.alpha < 1) { drawNode(i, a, 1 - u); drawNode(i, b, u); }
      else { drawNode(i, a, 1); drawNode(i, b, u); }
    });
    // the cursor ring slides from the previous node being processed
    if (st.at != null && P[st.at]) {
      const b = P[st.at], a = pr.at != null && P[pr.at] ? P[pr.at] : b;
      c.save(); if (pr.at == null) c.globalAlpha *= u;
      c.beginPath(); c.arc(lerp(a[0], b[0], u), lerp(a[1], b[1], u), r + 10, 0, TAU); c.strokeStyle = COL.orange; c.lineWidth = 5; c.stroke(); c.restore();
    }
    // a dot travels along each edge that starts being followed in this step
    G.forEach((g, j) => {
      if (!g.ok || Vs.es.get(j) !== "edge") return;
      const tt = Vp.es.get(j) === "edge" && Vp.rev.get(j) === Vs.rev.get(j) ? 1 : u, fade = sc.directed ? h.clamp((1 - tt) / 0.2, 0, 1) : 1; if (fade <= 0.01) return;
      const q = bez(g, Vs.rev.get(j) ? lerp(g.t1, g.t0, tt) : lerp(g.t0, g.t1, tt));
      c.save(); c.globalAlpha *= fade; c.beginPath(); c.arc(q[0], q[1], 12, 0, TAU); c.fillStyle = COL.white; c.fill(); c.strokeStyle = COL.orange; c.lineWidth = 5; c.stroke(); c.restore();
    });
    // tags: a value that changed in this step is orange
    Object.keys(L.slots).forEach(i => {
      const rc = L.slots[i], t = Vs.tags[i], was = Vp.tags[i]; if (t == null) return;
      const changed = !first && was !== t, col = changed ? COL.orange : COL.white, S = styleOf(Vs, +i);
      c.save(); c.globalAlpha *= (was == null && !first ? u : 1) * (S.alpha < 1 ? 0.55 : 1);
      c.beginPath(); c.roundRect(rc[0], rc[1], rc[2], rc[3], 12); c.fillStyle = "rgba(8,16,34,0.9)"; c.fill(); c.strokeStyle = changed ? COL.orange : "rgba(140,165,205,0.5)"; c.lineWidth = 2.5; c.stroke();
      c.font = `700 30px ${MONO}`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillStyle = col; c.fillText(String(t), rc[0] + rc[2] / 2, rc[1] + rc[3] / 2 + 1, rc[2] - 10); c.restore();
    });
  }

  const IN = (a) => Object.fromEntries(a.map((v, i) => [i, "in=" + v]));
  const D = (a) => Object.fromEntries(a.map((v, i) => [i, "d=" + v]));
  const heap = (...items) => ({ kind: "heap", name: "pq", items });
  const queue = (...items) => ({ kind: "queue", name: "q", items });
  return {
    label: "Đồ thị (nút và cạnh)",
    when: "đồ thị nút và cạnh: BFS, DFS, thành phần liên thông, phát hiện chu trình, topological sort (Course Schedule), đường đi ngắn nhất (Dijkstra, Bellman-Ford), union-find, tô hai màu (bipartite).",
    prompt: 'MÔ PHỎNG thuật toán trên đồ thị. "nodes": nhãn các nút, tối đa 8 nút, mỗi nhãn tối đa 4 ký tự (ví dụ ["A","B","C"]), hoặc một số n nghĩa là các nút 0..n-1. "edges": [[a, b]] hoặc [[a, b, trọng số]], a và b là CHỈ SỐ nút tính từ 0 (nút có nhãn "1" trong ["1","2","3"] là chỉ số 0). "directed": true nếu cạnh có hướng từ a tới b. KHÔNG ghi tọa độ: hình tự xếp nút (đồ thị có hướng không chu trình xếp theo tầng, còn lại xếp vòng tròn). Mỗi bước, tất cả theo chỉ số nút: "at": nút đang xử lý (vừa lấy khỏi queue, stack, heap), "hi": [nút đang được xét tới hoặc vừa cập nhật], "dim": [nút đã thăm xong], "done": [nút đã chốt kết quả], "edge": [[a, b]] cạnh đang đi qua ở bước này, viết đúng chiều đi, "used": [[a, b]] cạnh thuộc lời giải tính tới lúc này (cây BFS/DFS, cây đường đi ngắn nhất, cạnh đã union), "bad": [[a, b]] cạnh bị loại (tạo chu trình, xung đột màu), "tags": {"chỉ số": "d=3"} giá trị ngắn tối đa 6 ký tự ghi cạnh nút (khoảng cách, indegree, cha), "group": {"chỉ số": số} để các nút cùng số có cùng màu (union-find, thành phần liên thông, tô hai màu). Mỗi bước là ảnh chụp ĐẦY ĐỦ: ghi lại mọi "tags", "used", "dim", "done", "group" còn hiệu lực, không cộng dồn từ bước trước. Ví dụ một bước Dijkstra: {"say": "…", "at": 2, "done": [0], "edge": [[2, 1]], "used": [[0, 2]], "hi": [1], "tags": {"0": "d=0", "1": "d=3", "2": "d=1", "3": "d=∞"}, "box": {"kind": "heap", "name": "pq", "items": ["(3,2)", "(4,2)"]}}.',
    review: 'Tự chạy thuật toán trên đúng "nodes" và "edges": thứ tự lấy nút khỏi queue, stack hay heap, giá trị trong "tags" (khoảng cách, indegree) và "group" ở từng bước phải khớp với code. "edges" và mọi trường của bước phải dùng CHỈ SỐ nút tính từ 0 chứ không dùng nhãn, và mỗi cạnh trong "edge", "used", "bad" phải có trong "edges".',
    dataHint: '{"nodes": ["A","B","C","D"], "edges": [[0,1],[0,2],[1,3]], "directed": true}. "nodes" có thể là một số n (các nút 0..n-1); cạnh có trọng số ghi [a, b, w]; a và b là chỉ số nút tính từ 0; có thể thêm "shape": "circle", "layers" hoặc "grid" để ép cách xếp.',
    stepHint: '{"at": 1, "hi": [3], "dim": [0], "done": [], "edge": [[1,3]], "used": [[0,1]], "bad": [], "tags": {"3": "d=2"}, "group": {"0": 1, "1": 1}}',
    fields: ["nodes", "edges", "directed", "shape"],
    norm, normStep, draw,
    samples: [
      { // LeetCode 207, numCourses = 5, prerequisites = [[1,0],[2,0],[3,1],[3,2],[4,3]], Kahn's algorithm
        heading: "XẾP MÔN BẰNG *KAHN*", subtitle: "LeetCode 207: mũi tên nối môn tiên quyết với môn học sau",
        narration: "Mình chạy thuật toán Kahn trên năm môn học để xem có học hết được không.",
        nodes: 5, edges: [[0, 1], [0, 2], [1, 3], [2, 3], [3, 4]], directed: true,
        steps: [
          { say: "Mỗi nút ghi số môn tiên quyết còn thiếu, gọi là bậc vào. Chỉ môn 0 có bậc vào bằng 0 nên mình đưa nó vào hàng đợi trước.", hi: [0], tags: IN([0, 1, 1, 2, 1]), box: queue("0"), vars: { count: "0" } },
          { say: "Lấy môn 0 ra học. Hai môn 1 và 2 cần môn 0, nên bậc vào của chúng giảm về 0 và cả hai được thêm vào hàng đợi.", at: 0, edge: [[0, 1], [0, 2]], hi: [1, 2], tags: IN([0, 0, 0, 2, 1]), box: queue("1", "2"), vars: { count: "1" } },
          { say: "Lấy môn 1. Môn 3 bớt được một môn tiên quyết, bậc vào còn 1. Nó vẫn phải chờ môn 2 nên chưa được vào hàng đợi.", at: 1, dim: [0], edge: [[1, 3]], hi: [3], tags: IN([0, 0, 0, 1, 1]), box: queue("2"), vars: { count: "2" } },
          { say: "Lấy môn 2. Bậc vào của môn 3 giảm về 0, nghĩa là mọi môn tiên quyết của nó đã học xong, nên mình thêm 3 vào hàng đợi.", at: 2, dim: [0, 1], edge: [[2, 3]], hi: [3], tags: IN([0, 0, 0, 0, 1]), box: queue("3"), vars: { count: "3" } },
          { say: "Lấy môn 3 và đi theo cạnh sang môn 4. Bậc vào của môn 4 giảm về 0 nên môn 4 được vào hàng đợi.", at: 3, dim: [0, 1, 2], edge: [[3, 4]], hi: [4], tags: IN([0, 0, 0, 0, 0]), box: queue("4"), vars: { count: "4" } },
          { say: "Lấy môn 4, môn này không mở khóa thêm môn nào. Hàng đợi đã rỗng nên vòng lặp dừng lại ở đây.", at: 4, dim: [0, 1, 2, 3], tags: IN([0, 0, 0, 0, 0]), box: queue(), vars: { count: "5" } },
          { say: "Mình đã học đủ 5 trên 5 môn, tức là đồ thị không có chu trình. Kết quả trả về là true.", done: [0, 1, 2, 3, 4], tags: IN([0, 0, 0, 0, 0]), box: queue(), vars: { count: "5" } },
        ] },
      { // LeetCode 743, times = [[1,2,4],[1,3,1],[3,2,2],[2,4,1],[4,5,3],[5,1,2]], n = 5, k = 1, answer 7
        heading: "DIJKSTRA TÌM *ĐƯỜNG NGẮN NHẤT*", subtitle: "LeetCode 743: tín hiệu phát từ nút 1, bao lâu thì cả 5 nút đều nhận được?",
        narration: "Mình chạy Dijkstra từ nút 1, heap luôn đưa ra nút có khoảng cách nhỏ nhất.",
        nodes: ["1", "2", "3", "4", "5"], edges: [[0, 1, 4], [0, 2, 1], [2, 1, 2], [1, 3, 1], [3, 4, 3], [4, 0, 2]], directed: true,
        steps: [
          { say: "Tín hiệu phát từ nút 1 nên khoảng cách của nó là 0, các nút khác tạm coi là vô cực. Heap ban đầu chỉ có nút 1.", hi: [0], tags: D([0, "∞", "∞", "∞", "∞"]), box: heap("(0,1)") },
          { say: "Lấy nút 1 khỏi heap và xét hai cạnh đi ra. Nút 2 nhận khoảng cách 4, nút 3 nhận khoảng cách 1, cả hai được đẩy vào heap.", at: 0, edge: [[0, 1], [0, 2]], hi: [1, 2], tags: D([0, 4, 1, "∞", "∞"]), box: heap("(1,3)", "(4,2)") },
          { say: "Heap đưa ra nút 3 vì khoảng cách 1 là nhỏ nhất. Đi tiếp sang nút 2 chỉ tốn 1 cộng 2 bằng 3, tốt hơn 4, nên mình cập nhật nút 2.", at: 2, done: [0], edge: [[2, 1]], used: [[0, 2]], hi: [1], tags: D([0, 3, 1, "∞", "∞"]), box: heap("(3,2)", "(4,2)") },
          { say: "Lấy nút 2 với khoảng cách 3. Cạnh sang nút 4 có trọng số 1 nên nút 4 nhận khoảng cách 4 và được đẩy vào heap.", at: 1, done: [0, 2], edge: [[1, 3]], used: [[0, 2], [2, 1]], hi: [3], tags: D([0, 3, 1, 4, "∞"]), box: heap("(4,2)", "(4,4)") },
          { say: "Heap lại đưa ra nút 2 với khoảng cách cũ là 4. Con số này lớn hơn giá trị 3 đã chốt nên đây là bản ghi cũ, mình bỏ qua.", at: 1, done: [0, 1, 2], used: [[0, 2], [2, 1], [1, 3]], tags: D([0, 3, 1, 4, "∞"]), box: heap("(4,4)") },
          { say: "Lấy nút 4 với khoảng cách 4. Cạnh sang nút 5 có trọng số 3 nên nút 5 nhận khoảng cách 7 và được đẩy vào heap.", at: 3, done: [0, 1, 2], edge: [[3, 4]], used: [[0, 2], [2, 1], [1, 3]], hi: [4], tags: D([0, 3, 1, 4, 7]), box: heap("(7,5)") },
          { say: "Lấy nút 5. Nó chỉ có cạnh quay về nút 1, mà 7 cộng 2 bằng 9 không tốt hơn 0, nên không có gì thay đổi. Heap đã rỗng.", at: 4, done: [0, 1, 2, 3], edge: [[4, 0]], used: [[0, 2], [2, 1], [1, 3], [3, 4]], tags: D([0, 3, 1, 4, 7]), box: heap() },
          { say: "Mọi nút đều đã có khoảng cách ngắn nhất. Nút xa nhất là nút 5 với khoảng cách 7, nên đáp án của bài là 7.", done: [0, 1, 2, 3, 4], used: [[0, 2], [2, 1], [1, 3], [3, 4]], tags: D([0, 3, 1, 4, 7]), box: heap() },
        ] },
      { // LeetCode 684, edges = [[1,2],[3,4],[4,5],[2,3],[1,4]], union with parent[find(a)] = find(b), answer [1,4]
        heading: "TÌM *CẠNH THỪA* BẰNG UNION-FIND", subtitle: "LeetCode 684: cạnh nào nối hai nút đã cùng nhóm thì chính là cạnh thừa",
        narration: "Mình duyệt từng cạnh và gộp nhóm bằng union-find, mỗi màu là một nhóm.",
        nodes: ["1", "2", "3", "4", "5"], edges: [[0, 1], [2, 3], [3, 4], [1, 2], [0, 3]], directed: false,
        steps: [
          { say: "Lúc đầu mỗi nút là một nhóm riêng nên có năm màu khác nhau. Mình sẽ xét lần lượt từng cạnh theo đúng thứ tự đề bài cho.", group: [0, 1, 2, 3, 4] },
          { say: "Cạnh nối 1 với 2: hai nút khác nhóm nên mình gộp lại. Từ giờ nút 1 mang màu của nút 2, hai nút thuộc cùng một nhóm.", edge: [[0, 1]], hi: [0, 1], group: [1, 1, 2, 3, 4] },
          { say: "Cạnh nối 3 với 4: hai nút vẫn khác nhóm nên gộp tiếp. Bây giờ còn ba nhóm, ứng với ba màu trên hình.", edge: [[2, 3]], hi: [2, 3], used: [[0, 1]], group: [1, 1, 3, 3, 4] },
          { say: "Cạnh nối 4 với 5: gốc của nhóm chứa nút 4 được gắn vào nút 5, nên cả ba nút 3, 4 và 5 về chung một màu.", edge: [[3, 4]], hi: [3, 4], used: [[0, 1], [2, 3]], group: [1, 1, 4, 4, 4] },
          { say: "Cạnh nối 2 với 3 chạm vào hai nhóm khác nhau nên vẫn hợp lệ. Gộp xong, cả năm nút nằm chung một nhóm duy nhất.", edge: [[1, 2]], hi: [1, 2], used: [[0, 1], [2, 3], [3, 4]], group: [4, 4, 4, 4, 4] },
          { say: "Cạnh nối 1 với 4: hai nút đã cùng nhóm, thêm cạnh này sẽ tạo chu trình. Đây chính là cạnh thừa, đáp án là cặp 1 và 4.", bad: [[0, 3]], hi: [0, 3], used: [[0, 1], [2, 3], [3, 4], [1, 2]], group: [4, 4, 4, 4, 4] },
        ] },
    ],
  };
})()]);

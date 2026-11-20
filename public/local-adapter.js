// Gives the CodeLens page the same `window.claude.use(name)` interface it has on claude.ai,
// backed by the local server: files on disk instead of the artifact database, and your
// Anthropic API key (kept on the server) instead of the claude.ai account.
(() => {
  "use strict";
  window.__CODELENS_LOCAL = true;
  const json = async (res) => {
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw { code: body.code || "upstream_error", message: body.message || `HTTP ${res.status}` };
    return body;
  };
  const call = (method, url, body) => fetch(url, { method, headers: body ? { "content-type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined }).then(json);

  // ---- live updates ----
  const subs = new Map(); // collection -> Set<fn>
  let es = null;
  const ensureEvents = () => {
    if (es) return;
    es = new EventSource("/api/events");
    es.onmessage = (e) => { try { const { col } = JSON.parse(e.data); (subs.get(col) || []).forEach(fn => fn()); } catch (_) {} };
  };
  const watch = (col, fn) => { ensureEvents(); if (!subs.has(col)) subs.set(col, new Set()); subs.get(col).add(fn); return () => subs.get(col).delete(fn); };

  // ---- db (same shape as the artifact db capability, for the calls CodeLens uses) ----
  const split = (p) => { const s = String(p).split("/").filter(Boolean); return { col: s[0], id: s[1] }; };
  const snapDoc = (id, exists, data) => ({ id, exists, data: () => (data ? JSON.parse(JSON.stringify(data)) : undefined), metadata: { fromCache: false, hasPendingWrites: false } });
  const docRef = (p) => {
    const { col, id } = split(p);
    const get = async () => { const r = await call("GET", `/api/db/${col}/${id}`); return snapDoc(id, r.exists, r.data); };
    return {
      id, path: p, get,
      set: (data) => call("PUT", `/api/db/${col}/${id}`, data).then(() => {}),
      update: (data) => call("PATCH", `/api/db/${col}/${id}`, data).then(() => {}),
      delete: () => call("DELETE", `/api/db/${col}/${id}`).then(() => {}),
      onSnapshot(next, error) { const run = () => get().then(next, e => error && error(e)); run(); return watch(col, run); },
    };
  };
  const collectionRef = (col) => {
    const get = async () => { const rows = await call("GET", `/api/db/${col}`); const docs = rows.map(r => snapDoc(r.id, true, r.data)); return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } }; };
    return {
      path: col, get,
      doc: (id) => docRef(`${col}/${id || Math.random().toString(36).slice(2, 12)}`),
      add: async (data) => { const ref = docRef(`${col}/${Math.random().toString(36).slice(2, 12)}`); await ref.set(data); return ref; },
      onSnapshot(next, error) { const run = () => get().then(next, e => error && error(e)); run(); return watch(col, run); },
    };
  };
  const db = { doc: docRef, collection: collectionRef };

  // ---- sample: Claude through the local server (API key) ----
  const parseJson = (text) => {
    let t = String(text || "").trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
    try { return JSON.parse(t); } catch (_) {}
    const a = t.indexOf("{"), b = t.lastIndexOf("}");
    if (a >= 0 && b > a) { try { return JSON.parse(t.slice(a, b + 1)); } catch (_) {} }
    throw { code: "invalid_json", message: "Claude trả về kết quả không phải JSON hợp lệ." };
  };
  const sample = async (input, opts = {}) => {
    const r = await call("POST", "/api/ai", { input, modelTier: opts.modelTier || "default", model: opts.model || "" });
    if (opts.onText) { try { opts.onText({ text: r.text, delta: r.text }); } catch (_) {} }
    return { text: r.text, truncated: r.truncated, modelTierApplied: opts.modelTier || "default", modelApplied: r.model };
  };
  sample.json = async (input, opts = {}) => {
    const r = await sample(typeof input === "string" ? input + "\n\nChỉ trả về JSON hợp lệ, không kèm giải thích hay markdown." : input, opts);
    return parseJson(r.text);
  };
  sample.limits = async () => ({ maxPromptBytes: 2 * 1024 * 1024 });

  // ---- assets ----
  const assets = {
    upload: (blob, options = {}) => fetch("/api/assets", { method: "POST", headers: { "content-type": options.type || blob.type || "application/octet-stream" }, body: blob }).then(json),
    list: () => call("GET", "/api/assets"),
    delete: (id) => call("DELETE", `/api/assets/${id}`),
  };

  // ---- downloads: a normal browser download works outside claude.ai ----
  const downloads = {
    async save({ filename, data }) {
      const blob = data instanceof Blob ? data : new Blob([data]);
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 60000);
      return { status: "saved" };
    },
  };

  // ---- voice: Vietnamese voice-over generated on the local server (free Edge neural voices) ----
  let status = null;
  const voice = {
    async info() { status = await call("GET", "/api/status"); return { voices: status.voices || {}, defaultVoice: status.defaultVoice, tts: status.tts || {} }; },
    async synthesize(text, opts = {}) {
      const res = await fetch("/api/tts", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text, voice: opts.voice, rate: opts.rate }) });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw { code: b.code || "tts_failed", message: b.message || `HTTP ${res.status}` }; }
      return res.arrayBuffer();
    },
  };

  const caps = { db, sample, assets, downloads, voice };
  window.claude = { use: async (name) => caps[name] || null };
})();

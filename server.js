// CodeLens local studio server.
// Serves the CodeLens page, keeps scripts/clips/settings on disk under ./data,
// and calls Claude with YOUR Anthropic API key (read from .env, never sent to the browser).
import http from "node:http";
import fs from "node:fs/promises";
import { existsSync, readFileSync, createReadStream } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import { MsEdgeTTS, OUTPUT_FORMAT } from "msedge-tts";
import { HttpsProxyAgent } from "https-proxy-agent";

const here = path.dirname(fileURLToPath(import.meta.url));

// ---- .env (tiny loader, no extra dependency) ----
const envFile = path.join(here, ".env");
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && !line.trim().startsWith("#") && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const PORT = Number(process.env.PORT || 5173);
const HOST = process.env.HOST || "127.0.0.1"; // local only by default
const MODEL = process.env.CODELENS_MODEL || "claude-opus-5-5";
const DATA = path.resolve(here, process.env.CODELENS_DATA_DIR || "data");
const MAX_ASSET_BYTES = 200 * 1024 * 1024;
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);
const client = hasKey ? new Anthropic() : null; // reads ANTHROPIC_API_KEY from the environment

// Page tiers map to effort levels on one model (Claude Opus 5.5 defaults to "medium").
const EFFORT = { quick: "low", default: "medium", complex: "high" };

const NAME = /^[A-Za-z0-9_-]{1,120}$/;
const send = (res, status, body, type = "application/json; charset=utf-8") => {
  res.writeHead(status, { "content-type": type, "cache-control": "no-store" });
  res.end(typeof body === "string" || Buffer.isBuffer(body) ? body : JSON.stringify(body));
};
const readBody = (req, limit) => new Promise((resolve, reject) => {
  const chunks = []; let size = 0;
  req.on("data", (c) => { size += c.length; if (size > limit) { reject(Object.assign(new Error("too_large"), { code: "too_large" })); req.destroy(); } else chunks.push(c); });
  req.on("end", () => resolve(Buffer.concat(chunks)));
  req.on("error", reject);
});

// ---- tiny document store: data/db/<collection>/<id>.json ----
const colDir = (col) => path.join(DATA, "db", col);
async function listDocs(col) {
  const dir = colDir(col); if (!existsSync(dir)) return [];
  const out = [];
  for (const f of await fs.readdir(dir)) {
    if (!f.endsWith(".json") || f.endsWith(".tmp")) continue;
    try { out.push({ id: f.slice(0, -5), data: JSON.parse(await fs.readFile(path.join(dir, f), "utf8")) }); } catch { /* skip broken file */ }
  }
  return out;
}
async function getDoc(col, id) {
  try { return JSON.parse(await fs.readFile(path.join(colDir(col), id + ".json"), "utf8")); } catch { return null; }
}
// Writes to one document run one at a time, so a PATCH never reads a half-written file.
const queues = new Map();
function withDocLock(key, fn) {
  const prev = queues.get(key) || Promise.resolve();
  const next = prev.catch(() => {}).then(fn);
  queues.set(key, next);
  next.finally(() => { if (queues.get(key) === next) queues.delete(key); }).catch(() => {});
  return next;
}
async function putDoc(col, id, data) {
  await fs.mkdir(colDir(col), { recursive: true });
  const file = path.join(colDir(col), id + ".json");
  const tmp = `${file}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2));
  await fs.rename(tmp, file);
}

// ---- live updates (Server-Sent Events) ----
const listeners = new Set();
const broadcast = (col) => { for (const res of listeners) res.write(`data: ${JSON.stringify({ col })}\n\n`); };

// ---- Claude ----
async function askClaude(input, tier) {
  const messages = typeof input === "string" ? [{ role: "user", content: input }] : input;
  const stream = client.beta.messages.stream({
    model: MODEL,
    max_tokens: 64000,
    output_config: { effort: EFFORT[tier] || "medium" },
    // On a policy decline the API retries on a fallback model inside the same call.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    messages,
  });
  const msg = await stream.finalMessage();
  if (msg.stop_reason === "refusal") {
    throw Object.assign(new Error("Claude từ chối yêu cầu này."), { code: "refused" });
  }
  const text = msg.content.filter((b) => b.type === "text").map((b) => b.text).join("");
  return { text, truncated: msg.stop_reason === "max_tokens", model: msg.model, usage: msg.usage };
}
function apiError(err) {
  if (err.code === "refused") return { status: 422, code: "refused", message: err.message };
  if (err instanceof Anthropic.AuthenticationError) return { status: 401, code: "bad_api_key", message: "API key không hợp lệ. Kiểm tra ANTHROPIC_API_KEY trong file .env." };
  if (err instanceof Anthropic.PermissionDeniedError) return { status: 403, code: "permission_denied", message: "API key không có quyền dùng model này." };
  if (err instanceof Anthropic.RateLimitError) return { status: 429, code: "rate_limited", message: "Vượt giới hạn tốc độ của API. Thử lại sau ít phút." };
  if (err instanceof Anthropic.BadRequestError) return { status: 400, code: "invalid_request", message: err.message };
  if (err instanceof Anthropic.APIError) return { status: 502, code: "upstream_error", message: `Lỗi API ${err.status ?? ""}: ${err.message}` };
  return { status: 500, code: "upstream_error", message: String(err && err.message || err) };
}

// ---- voice-over: free Vietnamese neural voices through Microsoft Edge's Read Aloud service ----
const TTS_VOICES = {
  "vi-VN-NamMinhNeural": "Nam Minh (nam)",
  "vi-VN-HoaiMyNeural": "Hoài My (nữ)",
};
const TTS_DEFAULT_VOICE = TTS_VOICES[process.env.CODELENS_TTS_VOICE] ? process.env.CODELENS_TTS_VOICE : "vi-VN-NamMinhNeural";
const proxyUrl = process.env.HTTPS_PROXY || process.env.https_proxy;
const ttsAgent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;
const xmlEscape = (s) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]));
let ttsChain = Promise.resolve(); // one synthesis at a time is gentler on the free service
function synthesize(text, voice, rate) {
  const run = async () => {
    const tts = new MsEdgeTTS({ agent: ttsAgent, connectionTimeoutMs: 15000, synthesisTimeoutMs: 60000 });
    try {
      await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
      const { audioStream } = tts.toStream(xmlEscape(text), { rate });
      return await new Promise((resolve, reject) => {
        const chunks = [];
        audioStream.on("data", (d) => chunks.push(d));
        audioStream.on("error", reject);
        audioStream.on("close", () => (chunks.length ? resolve(Buffer.concat(chunks)) : reject(new Error("Không nhận được âm thanh."))));
      });
    } finally { try { tts.close(); } catch { /* already closed */ } }
  };
  const p = ttsChain.then(run, run);
  ttsChain = p.catch(() => {});
  return p;
}
async function ttsAudio(text, voice, rate) {
  const key = crypto.createHash("sha256").update(`${voice}|${rate}|${text}`).digest("hex").slice(0, 32);
  const file = path.join(DATA, "tts", key + ".mp3");
  if (existsSync(file)) return fs.readFile(file);
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const buf = await synthesize(text, voice, rate);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, buf);
      return buf;
    } catch (err) { lastErr = err; await new Promise((r) => setTimeout(r, 800 * (attempt + 1))); }
  }
  throw lastErr;
}

// ---- Facebook Page publishing (Graph API; personal profiles cannot be posted to by apps) ----
const FB_PAGE_ID = process.env.FB_PAGE_ID || "";
const FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || "";
const FB_PAGE_NAME = process.env.FB_PAGE_NAME || "";
const FB_GRAPH_VERSION = process.env.FB_GRAPH_VERSION || "v26.0";
const FB_VIDEO_BASE = process.env.FB_GRAPH_VIDEO_BASE || "https://graph-video.facebook.com"; // overridable for testing
const fbConfigured = Boolean(FB_PAGE_ID && FB_PAGE_TOKEN);
async function publishToPage(file, caption, title) {
  const buf = await fs.readFile(file);
  const form = new FormData();
  form.append("access_token", FB_PAGE_TOKEN);
  form.append("description", caption);
  if (title) form.append("title", title.slice(0, 250));
  form.append("published", "true");
  form.append("source", new Blob([buf], { type: "video/mp4" }), "codelens.mp4");
  const res = await fetch(`${FB_VIDEO_BASE}/${FB_GRAPH_VERSION}/${encodeURIComponent(FB_PAGE_ID)}/videos`, { method: "POST", body: form });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.error) {
    const e = body.error || {};
    throw Object.assign(new Error(e.message || `Facebook trả lỗi HTTP ${res.status}`), { fbCode: e.code });
  }
  return body; // { id: <video id> }
}

// ---- page ----
const pagePath = path.join(here, "public", "codelens.html");
const adapterPath = path.join(here, "public", "local-adapter.js");
function renderPage() {
  const body = readFileSync(pagePath, "utf8");
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><script src="/local-adapter.js"></script></head><body>${body}</body></html>`;
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const parts = url.pathname.split("/").filter(Boolean);
  try {
    if (req.method === "GET" && url.pathname === "/") return send(res, 200, renderPage(), "text/html; charset=utf-8");
    if (req.method === "GET" && url.pathname === "/local-adapter.js") return send(res, 200, readFileSync(adapterPath), "text/javascript; charset=utf-8");
    if (req.method === "GET" && url.pathname === "/api/status") return send(res, 200, { hasKey, model: MODEL, voices: TTS_VOICES, defaultVoice: TTS_DEFAULT_VOICE, facebook: { configured: fbConfigured, pageName: FB_PAGE_NAME } });

    if (req.method === "POST" && url.pathname === "/api/facebook/publish") {
      if (!fbConfigured) return send(res, 400, { code: "fb_not_configured", message: "Chưa cấu hình Fanpage: thêm FB_PAGE_ID và FB_PAGE_TOKEN vào file .env rồi khởi động lại server." });
      const { assetId, caption, title } = JSON.parse((await readBody(req, 256 * 1024)).toString("utf8") || "{}");
      if (!/^[0-9a-f]{32}$/.test(assetId || "")) return send(res, 400, { code: "invalid_request", message: "Thiếu file video." });
      const file = path.join(DATA, "assets", assetId);
      if (!existsSync(file)) return send(res, 404, { code: "not_found", message: "Không tìm thấy file video trong thư viện." });
      try {
        const out = await publishToPage(file, String(caption || "").slice(0, 5000), String(title || ""));
        console.log(`[facebook] published video ${out.id}`);
        return send(res, 200, { id: out.id, url: `https://www.facebook.com/${encodeURIComponent(out.id)}` });
      } catch (err) {
        console.error("[facebook]", err.message);
        const hint = err.fbCode === 190 ? " Token đã hết hạn hoặc không hợp lệ: tạo Page access token mới." : err.fbCode === 200 || err.fbCode === 10 ? " Token thiếu quyền pages_manage_posts hoặc bạn không phải quản trị viên Fanpage." : "";
        return send(res, 502, { code: "fb_failed", message: err.message + hint });
      }
    }

    if (req.method === "POST" && url.pathname === "/api/tts") {
      const { text, voice, rate } = JSON.parse((await readBody(req, 64 * 1024)).toString("utf8") || "{}");
      const clean = String(text || "").replace(/\*/g, "").replace(/\s+/g, " ").trim().slice(0, 2000);
      if (!clean) return send(res, 400, { code: "invalid_request", message: "Thiếu nội dung để đọc." });
      const v = TTS_VOICES[voice] ? voice : TTS_DEFAULT_VOICE;
      const r = /^[+-]?\d{1,2}%$/.test(String(rate || "")) ? String(rate) : "+0%";
      try { return send(res, 200, await ttsAudio(clean, v, r), "audio/mpeg"); }
      catch (err) { console.error("[tts]", err.message || err); return send(res, 502, { code: "tts_failed", message: "Không tạo được giọng đọc (cần Internet để dùng giọng đọc Microsoft Edge). Thử lại sau." }); }
    }

    if (req.method === "GET" && url.pathname === "/api/events") {
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive" });
      res.write(": ok\n\n"); listeners.add(res);
      const ping = setInterval(() => res.write(": ping\n\n"), 25000);
      req.on("close", () => { clearInterval(ping); listeners.delete(res); });
      return;
    }

    // /api/db/<col>[/<id>]
    if (parts[0] === "api" && parts[1] === "db" && NAME.test(parts[2] || "")) {
      const col = parts[2], id = parts[3];
      if (id !== undefined && !NAME.test(id)) return send(res, 400, { code: "invalid_argument", message: "Bad id" });
      if (req.method === "GET" && !id) return send(res, 200, await listDocs(col));
      if (req.method === "GET") { const d = await getDoc(col, id); return send(res, 200, { id, exists: !!d, data: d }); }
      if (req.method === "PUT" || req.method === "PATCH") {
        const data = JSON.parse((await readBody(req, 2 * 1024 * 1024)).toString("utf8") || "{}");
        await withDocLock(`${col}/${id}`, async () => {
          const next = req.method === "PATCH" ? { ...((await getDoc(col, id)) || {}), ...data } : data;
          await putDoc(col, id, next);
        });
        broadcast(col); return send(res, 200, { ok: true });
      }
      if (req.method === "DELETE") {
        await withDocLock(`${col}/${id}`, () => fs.rm(path.join(colDir(col), id + ".json"), { force: true }));
        broadcast(col); return send(res, 200, { ok: true });
      }
    }

    // assets
    if (url.pathname === "/api/assets" && req.method === "POST") {
      const buf = await readBody(req, MAX_ASSET_BYTES);
      const id = crypto.randomBytes(16).toString("hex");
      const contentType = String(req.headers["content-type"] || "application/octet-stream").split(";")[0];
      await fs.mkdir(path.join(DATA, "assets"), { recursive: true });
      await fs.writeFile(path.join(DATA, "assets", id), buf);
      await fs.writeFile(path.join(DATA, "assets", id + ".meta.json"), JSON.stringify({ contentType, sizeBytes: buf.length, createdAt: new Date().toISOString() }));
      return send(res, 200, { id, url: "/_blob/" + id, sizeBytes: buf.length, contentType });
    }
    if (url.pathname === "/api/assets" && req.method === "GET") {
      const dir = path.join(DATA, "assets"); const assets = []; let bytes = 0;
      if (existsSync(dir)) for (const f of await fs.readdir(dir)) {
        if (!f.endsWith(".meta.json")) continue;
        const m = JSON.parse(await fs.readFile(path.join(dir, f), "utf8")); const id = f.slice(0, -10);
        assets.push({ id, url: "/_blob/" + id, ...m }); bytes += m.sizeBytes || 0;
      }
      return send(res, 200, { assets, usage: { files: assets.length, bytes, maxFiles: 100000, maxBytes: 100 * 1024 ** 3 } });
    }
    if (parts[0] === "api" && parts[1] === "assets" && /^[0-9a-f]{32}$/.test(parts[2] || "") && req.method === "DELETE") {
      await fs.rm(path.join(DATA, "assets", parts[2]), { force: true });
      await fs.rm(path.join(DATA, "assets", parts[2] + ".meta.json"), { force: true });
      return send(res, 200, { deleted: true });
    }
    if (parts[0] === "_blob" && /^[0-9a-f]{32}$/.test(parts[1] || "") && req.method === "GET") {
      const file = path.join(DATA, "assets", parts[1]);
      if (!existsSync(file)) return send(res, 404, { code: "not_found" });
      const meta = JSON.parse(await fs.readFile(file + ".meta.json", "utf8"));
      const size = meta.sizeBytes; const range = /bytes=(\d*)-(\d*)/.exec(req.headers.range || "");
      if (range) { // video seeking
        const start = range[1] ? +range[1] : 0, end = range[2] ? +range[2] : size - 1;
        res.writeHead(206, { "content-type": meta.contentType, "content-range": `bytes ${start}-${end}/${size}`, "accept-ranges": "bytes", "content-length": end - start + 1 });
        return createReadStream(file, { start, end }).pipe(res);
      }
      res.writeHead(200, { "content-type": meta.contentType, "content-length": size, "accept-ranges": "bytes" });
      return createReadStream(file).pipe(res);
    }

    // Claude
    if (url.pathname === "/api/ai" && req.method === "POST") {
      if (!client) return send(res, 400, { code: "no_api_key", message: "Chưa có API key: thêm ANTHROPIC_API_KEY vào file .env rồi khởi động lại server." });
      const { input, modelTier } = JSON.parse((await readBody(req, 2 * 1024 * 1024)).toString("utf8"));
      try {
        const out = await askClaude(input, modelTier);
        console.log(`[ai] ${out.model} in=${out.usage.input_tokens} out=${out.usage.output_tokens}`);
        return send(res, 200, out);
      } catch (err) { const e = apiError(err); console.error("[ai]", e.code, e.message); return send(res, e.status, { code: e.code, message: e.message }); }
    }

    send(res, 404, { code: "not_found" });
  } catch (err) {
    console.error(err);
    send(res, err.code === "too_large" ? 413 : 500, { code: err.code || "error", message: String(err.message || err) });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`CodeLens: http://${HOST === "0.0.0.0" ? "localhost" : HOST}:${PORT}`);
  console.log(hasKey ? `Claude: ${MODEL} (API key loaded from environment)` : "Claude: no ANTHROPIC_API_KEY set. AI buttons will show an error until you add one to .env");
  console.log(`Data folder: ${DATA}`);
});

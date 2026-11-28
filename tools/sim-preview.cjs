// Checks and previews simulation scene modules.
//   node tools/sim-preview.cjs scenes/matrix.js [more.js ...] --out <dir>    a module, without building it into the page
//   node tools/sim-preview.cjs --out <dir>                                   the modules already built into the page
// For every module it validates the definition, normalises each sample twice (must be stable), feeds norm() junk
// (must not throw), draws every step of every sample, checks the figure stays inside its area, and writes one JPEG
// per step (the full frame near the end of the step). Exits 1 if any check fails.
const { chromium } = require("playwright");
const { spawn } = require("child_process");
const fs = require("fs"), path = require("path"), os = require("os"), net = require("net");
const root = path.join(__dirname, "..");
const args = process.argv.slice(2); const oi = args.indexOf("--out");
const out = path.resolve(oi >= 0 ? args[oi + 1] : path.join(os.tmpdir(), "sim-preview"));
const files = args.filter((a, i) => a !== "--out" && (oi < 0 || i !== oi + 1));
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, "127.0.0.1", () => { const p = s.address().port; s.close(() => r(p)); }); });
(async () => {
  fs.mkdirSync(out, { recursive: true });
  const port = await freePort(); const data = fs.mkdtempSync(path.join(os.tmpdir(), "codelens-sim-"));
  const server = spawn(process.execPath, ["server.js"], { cwd: root, env: { ...process.env, PORT: String(port), CODELENS_DATA_DIR: data }, stdio: "ignore" });
  let failed = false; const browser = await chromium.launch();
  try {
    await new Promise(r => setTimeout(r, 1500));
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 } });
    for (const f of files) await ctx.addInitScript({ content: fs.readFileSync(path.resolve(f), "utf8") });
    const page = await ctx.newPage(); const errs = []; page.on("pageerror", e => errs.push(String(e)));
    await page.goto(`http://127.0.0.1:${port}/`); await page.waitForFunction(() => window.__codelens, null, { timeout: 15000 });
    await page.evaluate(() => document.fonts.ready);
    const res = await page.evaluate(async () => {
      const L = window.__codelens, H = L.simH(); const report = []; const shots = [];
      const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
      for (const name of Object.keys(L.SIMS)) {
        const def = L.SIMS[name]; const bad = (m) => report.push(`FAIL ${name}: ${m}`); const ok = (m) => report.push(`ok   ${name}: ${m}`);
        for (const k of ["label", "when", "prompt", "review", "dataHint", "stepHint"]) if (typeof def[k] !== "string" || !def[k].trim()) bad(`missing text field "${k}"`);
        if (!Array.isArray(def.fields) || !def.fields.length) bad(`"fields" must list the scene-level data fields`);
        const reserved = ["layout", "duration", "heading", "subtitle", "narration", "part", "actors", "links", "focus", "mark", "left", "right", "code", "codeTitle", "steps", "cells"];
        (def.fields || []).forEach(k => { if (reserved.includes(k)) bad(`field name "${k}" is reserved by the scene itself`); });
        if (!Array.isArray(def.samples) || def.samples.length < 2) bad("needs at least 2 samples");
        if ((def.prompt || "").length > 1500) bad(`prompt is ${def.prompt.length} chars; keep it under 1500`);
        // junk must not throw
        const junk = [{}, { steps: "x" }, { steps: [null, 3, "a", {}] }, Object.fromEntries((def.fields || []).map(k => [k, null])), Object.fromEntries((def.fields || []).map(k => [k, 12345])),
          Object.fromEntries((def.fields || []).map(k => [k, "zzz"])), Object.fromEntries((def.fields || []).map(k => [k, Array.from({ length: 500 }, (_, i) => i)])), Object.fromEntries((def.fields || []).map(k => [k, [[[]], {}, null, "x", -1, 1e9]]))];
        let junkOk = true;
        for (const j of junk) {
          try { const d = def.norm({ ...j }, H) || {}; if (def.normStep) for (const st of [{}, null, { at: "x", hi: "y", dim: 5 }, { at: [99, -99], hi: [[9, 9], "q", null], ptr: { a: {} } }]) def.normStep(st || {}, d, H);
            const sc = L.normScript({ title: "t", scenes: [{ layout: name, heading: "h", ...j, steps: [{ say: "a" }, { say: "b", at: "x", hi: 7, dim: "q", ptr: 3 }] }] }).scenes[0];
            const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920; const lay = L.simLayout(sc);
            sc.steps.forEach((st, k) => def.draw(cv.getContext("2d"), sc, { st, pr: sc.steps[k - 1] || st, u: 0.5, k, tl: 1, steps: sc.steps, area: lay.area }, H));
          } catch (e) { junkOk = false; bad(`throws on junk input ${JSON.stringify(j).slice(0, 80)}: ${e.message}`); }
        }
        if (junkOk) ok("norm, normStep and draw survive junk input");
        for (const [si, smp] of (def.samples || []).entries()) {
          const raw = { title: "Mẫu " + name, format: "algo", category: "Algorithm", scenes: [{ part: "body", duration: 4, heading: smp.heading || "CHẠY *TỪNG BƯỚC*", subtitle: smp.subtitle || "Ví dụ mẫu của kiểu cảnh này", narration: smp.narration || "", actors: [], links: [], ...smp, layout: name }] };
          const s1 = L.normScript(raw), s2 = L.normScript(JSON.parse(JSON.stringify(s1)));
          const sc = s1.scenes[0];
          if (!eq(s1.scenes, s2.scenes)) bad(`sample ${si + 1}: normalising twice changes the scene (norm must be stable)`);
          if (sc.layout !== name) { bad(`sample ${si + 1}: layout lost`); continue; }
          if (sc.steps.length < 3) bad(`sample ${si + 1}: needs at least 3 steps`);
          for (const k of def.fields) if (smp[k] !== undefined && sc[k] === undefined) bad(`sample ${si + 1}: field "${k}" was dropped by norm`);
          sc.steps.forEach((st, k) => { if (!st.say || st.say.length < 20) bad(`sample ${si + 1} step ${k + 1}: "say" is missing or too short`); });
          const lay = L.simLayout(sc); const A = lay.area; const n = sc.steps.length; const T = Array.from({ length: n }, (_, j) => j * sc.duration / n);
          for (let k = 0; k < n; k++) {
            // the module alone, on a clear canvas: must draw something and stay inside its area
            const solo = document.createElement("canvas"); solo.width = 1080; solo.height = 1920; const sx = solo.getContext("2d");
            try { def.draw(sx, sc, { st: sc.steps[k], pr: sc.steps[k - 1] || sc.steps[k], u: 1, k, tl: T[k] + 1, steps: sc.steps, area: A }, H); def.draw(sx, sc, { st: sc.steps[k], pr: sc.steps[k - 1] || sc.steps[k], u: 0.5, k, tl: T[k] + 0.2, steps: sc.steps, area: A }, H); }
            catch (e) { bad(`sample ${si + 1} step ${k + 1}: draw throws: ${e.message}`); continue; }
            const px = sx.getImageData(0, 0, 1080, 1920).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
            for (let y = 0; y < 1920; y += 2) for (let x = 0; x < 1080; x += 2) if (px[(y * 1080 + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
            if (x1 < 0) bad(`sample ${si + 1} step ${k + 1}: nothing was drawn`);
            else if (x0 < A.x - 12 || y0 < A.y - 12 || x1 > A.x + A.w + 12 || y1 > A.y + A.h + 12) bad(`sample ${si + 1} step ${k + 1}: draws outside its area (ink ${x0},${y0}–${x1},${y1}; area ${A.x},${A.y}–${A.x + A.w},${A.y + A.h})`);
            else if ((x1 - x0) < A.w * 0.45 && (y1 - y0) < A.h * 0.45) bad(`sample ${si + 1} step ${k + 1}: figure uses under 45% of its area in both directions (ink ${x1 - x0}×${y1 - y0}, area ${A.w}×${A.h}); scale it up`);
            // the whole frame as the clip shows it, near the end of the step
            const cv = document.createElement("canvas"); cv.width = 1080; cv.height = 1920;
            L.drawFrame(cv.getContext("2d"), s1, Math.min(sc.duration - 0.35, T[k] + (sc.duration / n) * 0.9));
            shots.push({ file: `${name}-${si + 1}-step${String(k + 1).padStart(2, "0")}.jpg`, url: cv.toDataURL("image/jpeg", 0.85) });
          }
          ok(`sample ${si + 1}: ${n} steps drawn, area ${A.w}×${A.h}${lay.anyBox ? ", with box" : ""}${lay.maxVars ? `, ${lay.maxVars} vars` : ""}`);
        }
      }
      if (!Object.keys(L.SIMS).length) report.push("FAIL no module registered: push [name, def] onto window.__codelensSimDefs");
      return { report, shots };
    });
    res.shots.forEach(s => fs.writeFileSync(path.join(out, s.file), Buffer.from(s.url.split(",")[1], "base64")));
    errs.forEach(e => res.report.push("FAIL page error: " + e));
    console.log(res.report.join("\n")); console.log(`${res.shots.length} frame(s) in ${out}`);
    failed = res.report.some(l => l.startsWith("FAIL"));
  } finally { await browser.close(); server.kill(); fs.rmSync(data, { recursive: true, force: true }); }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });

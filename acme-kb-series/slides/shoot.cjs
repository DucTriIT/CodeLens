// Chụp từng ảnh carousel: node shoot.cjs phan-1.html ../phan-1 [scale]
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const [, , page, out, scale] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: +(scale || 2) });
  await p.goto("file://" + path.resolve(page));
  await p.evaluate(() => document.fonts.ready);
  await p.waitForFunction(() => window.FITTED !== false);
  const n = await p.locator(".s").count();
  for (let i = 0; i < n; i++) {
    const el = p.locator(".s").nth(i);
    // Báo nếu nội dung tràn khỏi khung
    const over = await el.evaluate(e => e.scrollHeight - e.clientHeight);
    if (over > 0) console.log(`slide ${i + 1}: tràn ${over}px`);
    await el.screenshot({ path: path.join(out, String(i + 1).padStart(2, "0") + ".png") });
  }
  console.log(n + " ảnh");
  await b.close();
})();

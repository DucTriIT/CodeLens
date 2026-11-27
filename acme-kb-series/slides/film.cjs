// Dựng clip từ trang có window.render(t): node film.cjs trailer-phan-1.html <thư mục frame> [danh sách giây để chụp thử]
const { chromium } = require("playwright");
const path = require("path");
(async () => {
  const [, , page, out, only] = process.argv;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto("file://" + path.resolve(page));
  await p.evaluate(() => document.fonts.ready);
  const fps = 30, dur = await p.evaluate(() => window.DURATION);
  const frames = only ? only.split(",").map(s => Math.round(+s * fps)) : [...Array(Math.round(dur * fps)).keys()];
  for (const i of frames) {
    await p.evaluate(t => window.render(t), i / fps);
    await p.screenshot({ path: path.join(out, "f_" + String(i).padStart(4, "0") + ".png") });
  }
  console.log(frames.length + " frame, " + dur + " giây");
  await b.close();
})();

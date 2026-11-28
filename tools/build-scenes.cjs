// Copies the simulation scene modules (scenes/*.js) into public/codelens.html, between the SIM-SCENES markers,
// so the page stays one self-contained file. Run after editing a module:  node tools/build-scenes.cjs
const fs = require("fs"), path = require("path");
const root = path.join(__dirname, "..");
const ORDER = ["matrix", "tree", "list", "graph", "intervals"]; // also the order the AI reads them in
const dir = path.join(root, "scenes");
const names = fs.readdirSync(dir).filter(f => f.endsWith(".js")).map(f => f.slice(0, -3))
  .sort((a, b) => (ORDER.indexOf(a) + 1 || 99) - (ORDER.indexOf(b) + 1 || 99) || a.localeCompare(b));
const BEGIN = "/* SIM-SCENES:BEGIN (generated from scenes/*.js by tools/build-scenes.cjs: edit the sources, then run it again) */";
const END = "/* SIM-SCENES:END */";
let body = "";
for (const n of names) {
  const src = fs.readFileSync(path.join(dir, n + ".js"), "utf8").trim();
  if (/<\/script/i.test(src)) throw new Error(`scenes/${n}.js contains "</script", which would end the page's script block`);
  new Function(src); // syntax check
  // each module in its own scope, so top-level names in two modules cannot collide
  body += `\n/* --- scenes/${n}.js --- */\n(() => {\n${src}\n})();\n`;
}
const file = path.join(root, "public", "codelens.html");
const html = fs.readFileSync(file, "utf8");
const a = html.indexOf(BEGIN), b = html.indexOf(END);
if (a < 0 || b < a) throw new Error("SIM-SCENES markers not found in public/codelens.html");
fs.writeFileSync(file, html.slice(0, a + BEGIN.length) + body + html.slice(b));
console.log(`inlined ${names.length} scene module(s): ${names.join(", ") || "(none)"}`);

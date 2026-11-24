// Un foglio con più foto affiancate (per guardarle in un colpo): node foglio.js uscita.png larghezza foto1.png foto2.png …
// (le foto di uno stesso foglio: col nome piccolo sotto). Edge invisibile, solo per disegnare la pagina.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const [out, larg, ...files] = process.argv.slice(2);
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  const p = await (await b.newContext({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1 })).newPage();
  const W = +larg || 260;
  const html = "<body style='margin:0;background:#222;font:12px sans-serif;color:#ddd;display:flex;flex-wrap:wrap;gap:6px;padding:6px;width:" + (4 * (W + 6) + 6) + "px'>" +
    files.map(f => "<div style='width:" + W + "px'><img style='width:" + W + "px;display:block' src='data:image/png;base64," + fs.readFileSync(f).toString("base64") + "'><div>" + path.basename(f, ".png") + "</div></div>").join("") + "</body>";
  await p.setContent(html); await p.waitForTimeout(300);
  const box = await p.evaluate(() => { const r = document.body.getBoundingClientRect(); return { w: Math.ceil(r.width), h: Math.ceil(document.body.scrollHeight) }; });
  await p.setViewportSize({ width: box.w, height: Math.min(box.h, 8000) });
  await p.screenshot({ path: out, fullPage: true });
  await b.close();
})();

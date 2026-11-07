// UN FOGLIO DI CONFRONTO: le stesse zone di più foto, ingrandite e affiancate, con una scritta sopra ciascuna.
// Uso: node foglio.js uscita.png "x,y,w,h" scala "Titolo 1=foto1.png" "Titolo 2=foto2.png" ...
// (x, y, w, h nei pixel veri delle foto; scala = quanto ingrandire)
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const [out, rect, scala, ...voci] = process.argv.slice(2);
const [x, y, w, h] = rect.split(",").map(Number), k = +scala || 1;
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const p = await (await b.newContext({ viewport: { width: 1600, height: 1200 }, deviceScaleFactor: 1 })).newPage();
    const celle = voci.map(v => { const i = v.indexOf("="), t = v.slice(0, i), f = v.slice(i + 1); const d = "data:image/png;base64," + fs.readFileSync(f).toString("base64");
      return `<div class="c"><div class="t">${t}</div><div class="f" style="width:${w * k}px;height:${h * k}px"><img src="${d}" style="left:${-x * k}px;top:${-y * k}px;transform-origin:0 0;transform:scale(${k})"></div></div>`; }).join("");
    await p.setContent(`<html><body style="margin:0;background:#0d1020;font:800 22px system-ui;color:#f4f5fb"><div id="g" style="display:inline-flex;gap:14px;padding:14px">${celle}</div>
      <style>.c{display:flex;flex-direction:column;gap:6px;align-items:center}.f{position:relative;overflow:hidden;border-radius:10px}.f img{position:absolute}.t{padding:2px 6px}</style></body></html>`);
    await p.waitForTimeout(300);
    const g = await p.$("#g"); await g.screenshot({ path: out }); console.log("ok " + out);
  } finally { await b.close(); }
})();

// Mette più foto affiancate in una sola immagine con le etichette (per mandarle al proprietario).
// Uso: node collage.js uscita.png "Titolo" "Etichetta|foto.png" "Etichetta|foto.png" … [--righe 2]
// Una colonna per etichetta; con --righe 2 le foto vanno in 2 righe (le prime metà sopra).
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const a = process.argv.slice(2), out = a.shift(), titolo = a.shift();
let righe = 1; const i = a.indexOf("--righe"); if (i >= 0) { righe = +a[i + 1]; a.splice(i, 2); }
const voci = a.map(x => { const [et, f] = x.split("|"); return { et, src: "data:image/png;base64," + fs.readFileSync(f).toString("base64") }; });
const perRiga = Math.ceil(voci.length / righe);
const html = `<html><body style="margin:0;background:#0b0e1c;font-family:Segoe UI,Arial;color:#fff;padding:18px">
<div style="font-size:30px;font-weight:800;margin:0 0 14px 6px">${titolo}</div>
<div style="display:grid;grid-template-columns:repeat(${perRiga},auto);gap:18px 18px;align-items:start;justify-content:start">
${voci.map(v => `<div><div style="font-size:24px;font-weight:800;margin:0 0 8px 4px;color:#ffd43b">${v.et}</div><img src="${v.src}" style="width:390px;border-radius:18px;display:block"></div>`).join("")}
</div></body></html>`;
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 400 * perRiga + 60, height: 600 }, deviceScaleFactor: 1 });
  await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({ path: out, fullPage: true });
  await b.close(); console.log("ok " + out);
})();

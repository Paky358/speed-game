// FOGLI DI FOTO: mette le foto di una cartella su fogli da 8 (4 x 2), col nome sotto ogni foto, per guardarle tutte in poco.
// Uso: node fogli.js <cartella delle foto> <cartella dei fogli> [per foglio, di partenza 8] [filtro nel nome]
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const [DA, A, PER = "8", FILTRO = ""] = process.argv.slice(2);
fs.mkdirSync(A, { recursive: true });
const foto = fs.readdirSync(DA).filter(f => f.endsWith(".png") && f.includes(FILTRO)).sort();
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: 1640, height: 900 } });
  for (let i = 0, n = 1; i < foto.length; i += +PER, n++) {
    const pezzi = foto.slice(i, i + +PER).map(f => `<figure><img src="data:image/png;base64,${fs.readFileSync(path.join(DA, f)).toString("base64")}"><figcaption>${f.replace(/\.png$/, "")}</figcaption></figure>`).join("");
    await p.setContent(`<style>body{margin:0;background:#222;font:12px sans-serif;color:#fff;display:grid;grid-template-columns:repeat(4,400px);gap:8px;padding:8px}figure{margin:0}img{width:400px;display:block}figcaption{padding:2px 0;word-break:break-all}</style>${pezzi}`);
    await p.waitForTimeout(300);
    const out = path.join(A, "foglio-" + String(n).padStart(2, "0") + ".jpg");
    await p.screenshot({ path: out, fullPage: true, type: "jpeg", quality: 70 });
    console.log(out);
  }
  await b.close();
})();

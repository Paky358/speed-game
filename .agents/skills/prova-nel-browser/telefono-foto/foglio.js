// I FOGLI DELLE FOTO del Telefono Disegnato: tante foto piccole su un foglio solo, per guardarle in un colpo.
// Uso: node foglio.js --dir D:\SG-telefono-prove\partite\n4 --filtro -360 --per 6 --larga 250 --out foglio-360.png [--da 0 --quante 24]
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const DIR = arg.dir, PER = +(arg.per || 6), LARGA = +(arg.larga || 250);
let file = fs.readdirSync(DIR).filter(f => f.endsWith(".png") && f.indexOf(arg.filtro || "") >= 0 && !/^foglio/.test(f)).sort();
file = file.slice(+(arg.da || 0), +(arg.da || 0) + +(arg.quante || 999));
(async () => {
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu"] });
  const p = await b.newPage({ viewport: { width: PER * (LARGA + 12) + 12, height: 800 } });
  const html = "<body style='margin:0;padding:6px;background:#222;font:12px sans-serif;color:#eee;display:grid;grid-template-columns:repeat(" + PER + "," + LARGA + "px);gap:6px'>" +
    file.map(f => "<div><img style='width:" + LARGA + "px;display:block' src='data:image/png;base64," + fs.readFileSync(path.join(DIR, f)).toString("base64") + "'><div>" + f + "</div></div>").join("") + "</body>";
  await p.setContent(html); await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(DIR, arg.out || "foglio.png"), fullPage: true });
  await b.close();
  console.log("foglio con " + file.length + " foto");
})();

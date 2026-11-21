// 🖼️ FOTO AFFIANCATE (20 nov 2026, caccia ai difetti del Prezzo è Giusto): mette più foto una accanto all'altra con una
// scritta sopra ognuna e un titolo, e salva un PNG (per mandare al proprietario «prima» e «dopo» in una foto sola).
// Uso: node affianca.js <uscita.png> "<titolo>" "<scritta 1>=<foto 1>" "<scritta 2>=<foto 2>" …
// Usa Edge senza schermo, in fila con le prove (un Edge alla volta su tutto il PC).
const fs = require("fs"), path = require("path");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const [OUT, TITOLO, ...COPPIE] = process.argv.slice(2);
const CODA = "C:/Users/joetr/sg-strumenti/coda"; let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia);
async function turno() {
  try { fs.mkdirSync(CODA, { recursive: true }); } catch (e) {}
  mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, String(process.pid));
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    await new Promise(r => setTimeout(r, 1500));
  }
}
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
(async () => {
  const pezzi = COPPIE.map(c => { const i = c.indexOf("="); return { scritta: c.slice(0, i), foto: c.slice(i + 1) }; });
  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#0d1020;font-family:Segoe UI,Arial,sans-serif;color:#f4f5fb;display:inline-block;padding:18px 18px 22px}
    h1{font-size:22px;margin:0 0 14px;font-weight:800}
    .fila{display:flex;gap:18px;align-items:flex-start}
    figure{margin:0;display:flex;flex-direction:column;gap:8px}
    figcaption{font-size:17px;font-weight:800;color:#ff8fb0}
    img{display:block;width:360px;height:auto;border-radius:18px;border:2px solid #2b3150}
  </style><h1>${esc(TITOLO || "")}</h1><div class="fila">${pezzi.map(p => `<figure><figcaption>${esc(p.scritta)}</figcaption><img src="data:image/png;base64,${fs.readFileSync(p.foto).toString("base64")}"></figure>`).join("")}</div>`;
  await turno();
  const b = await chromium.launch({ channel: "msedge", args: ["--disable-gpu"] });
  try {
    const p = await (await b.newContext({ viewport: { width: 400 * pezzi.length + 60, height: 900 }, deviceScaleFactor: 1.5 })).newPage();
    await p.setContent(html); await p.waitForTimeout(200);
    await p.locator("body").screenshot({ path: OUT });
    console.log("fatto: " + OUT);
  } finally { await b.close().catch(() => {}); lascia(); }
})();

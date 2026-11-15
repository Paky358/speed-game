// Foglio delle facce dei calciatori (15 nov 2026): barbe, tagli e figurine vere, per il prima e dopo.
// Uso: node facce.js --porta 8991 --fuori DIR --pre prima- [--file asta-vecchio.js]
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1];
const BASE = "http://localhost:" + (arg.porta || 8991), DOVE = arg.fuori, PRE = arg.pre || "";
fs.mkdirSync(DOVE, { recursive: true });

const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto");
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    await new Promise(r => setTimeout(r, 2000));
  }
}
(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", headless: true });
  try {
    const ctx = await b.newContext({ viewport: { width: 1320, height: 1800 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    if (arg.file) await ctx.route(/\/js\/games\/asta\.js/, async (route) => route.fulfill({ status: 200, body: fs.readFileSync(arg.file, "utf8"), headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" } }));
    const p = await ctx.newPage(); p.on("pageerror", e => console.log("errore: " + e.message));
    await p.goto(BASE + "/sw.js");
    await p.addInitScript(([L, PX, COL]) => { window.__LAB = L; window.__PX = PX; window.__COL = COL; }, [JSON.parse(fs.readFileSync(arg.lab, "utf8")), +(arg.px || 200), +(arg.col || 6)]);
    await p.goto(BASE + "/sw.js");
    const info = await p.evaluate(async () => { const LL = window.__LAB, PP = window.__PX, CC = window.__COL;
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/asta.js");
      const w = await window.apriTel("Paky", { x: 0 }); await w.SG.scaricaGioco("asta");
      const f = document.querySelector("iframe"); f.style.cssText = "position:absolute;top:0;left:0;width:1320px;height:1800px;border:0;transform:none;z-index:9";
      const S = w.SGAstaAspetto, d = w.document; window.__LAB = LL; window.__PX = PP; window.__COL = CC;
      // (qualche barba scelta apposta sulle figurine vere, come farebbe il proprietario dall'editor)
      const P = S.prop();
      Object.assign(P, {
        "Bastoni (Inter)": { p: 3, c: "nero", t: "corti", b: "pizzetto" },
        "Dimarco (Inter)": { p: 3, c: "castano scuro", t: "corti col ciuffo", b: "baffi e pizzetto" },
        "Mancini (Roma)": { p: 3, c: "castano scuro", t: "riga di lato", b: "baffi" },
        "Gila (Milan)": { p: 3, c: "castano scuro", t: "mossi", b: "piena" },
      });
      S.grafica(true);
      const box = d.createElement("div"); box.style.cssText = "position:fixed;inset:0;z-index:99999;background:#151a2e;overflow:hidden;padding:10px;font:800 12px system-ui;color:#c9cee6;text-align:center";
      d.body.appendChild(box);
      function tit(t) { const h = d.createElement("div"); h.textContent = t; h.style.cssText = "text-align:left;font-size:16px;color:#ffe066;margin:8px 4px 4px"; box.appendChild(h); }
      function griglia(n) { const g = d.createElement("div"); g.style.cssText = "display:grid;grid-template-columns:repeat(" + n + ",1fr);gap:4px"; box.appendChild(g); return g; }
      function testa(g, a, lab, px) { const c = d.createElement("div"); const cv = d.createElement("canvas"); cv.style.width = cv.style.height = px + "px"; c.appendChild(cv); const l = d.createElement("div"); l.textContent = lab; c.appendChild(l); g.appendChild(c); S.testa(cv, a, true); }
      const PX = +(window.__PX || 200), L = window.__LAB || [];
      tit("Laboratorio"); const gl = griglia(+(window.__COL || 6));
      const t0 = performance.now(); L.forEach(x => testa(gl, x.a, x.n, PX)); window.__MS = Math.round(performance.now() - t0);
      return L.length;
    });
    await p.waitForTimeout(1500);
    const alt = await p.evaluate(() => { const w = document.querySelector("iframe").contentWindow, d = w.document, b = d.body.lastElementChild; return Math.ceil(b.scrollHeight); });
    console.log("tagli " + info + ", alto " + alt + ", ms " + await p.evaluate(() => window.__MS));
    await p.screenshot({ path: path.join(DOVE, PRE + "facce.png"), clip: { x: 0, y: 0, width: 1320, height: Math.min(1800, alt + 10) } });
  } finally { await b.close(); lascia(); }
})().catch(e => { console.log("NO: " + (e && e.stack || e)); process.exit(1); });

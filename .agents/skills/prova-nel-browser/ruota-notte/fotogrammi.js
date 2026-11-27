// LA RUOTA CHE GIRA COL COMPUTER RALLENTATO ×4 (27 nov 2026): perde fotogrammi? Con le luci dello sfondo accese e spente.
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\ruota-notte\fotogrammi.js --porta 8977 [--giri 3] [--mis 360x780]
// (il server della copia acceso sulla porta). Una partita contro i Bot sul telefono finto; a ogni giro di Paky il computer va
// rallentato 4 volte e si contano i fotogrammi del telefono mentre la ruota gira (requestAnimationFrame): quanti, ogni quanto,
// quanti sopra i 50 ms. Stessa fila di prova.js (uno strumento alla volta su tutto il PC).
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8977), GIRI = +(arg.giri || 3), MIS = (arg.mis || "360x780").split("x").map(Number);
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "fotogrammi-ruota");
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    await new Promise(r => setTimeout(r, 2000));
  }
}
(async () => {
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, serviceWorkers: "block" });
    const page = await ctx.newPage(), cdp = await ctx.newCDPSession(page);
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async (MIS) => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      const w = await window.apriTel("Paky", { x: 0 }), f = document.getElementById("tel-Paky");
      f.style.width = MIS[0] + "px"; f.style.height = MIS[1] + "px"; f.style.transform = "none"; w.dispatchEvent(new w.Event("resize"));
      const tess = await window.aspetta(() => window.COPIONE.aiuti.tessera(w, "La Ruota della Fortuna"), 8000); tess.click(); await window.dorme(400);
      await window.aspetta(() => window.clicca(w, /Contro i Bot/, ".modo-grande"), 6000); await window.dorme(500);
      window.clicca(w, /Comincia/);
      window.__W = w;
    }, MIS);
    const righe = [];
    for (let g = 0; g < GIRI * 2; g++) {
      const sfondo = g % 2 === 0;   // un giro con le luci dello sfondo, uno senza
      // Paky deve girare: se la frase lampo o una lettera lo impediscono, il pilota le fa
      const pronto = await page.evaluate(async () => {
        const w = window.__W, fine = Date.now() + 120000;
        while (Date.now() < fine) {
          const P = w.__RUOTA && w.__RUOTA.ultima; if (!P) { await window.dorme(200); continue; }
          if (P.fase === "fine") return "fine";
          const io = P.giocatori[P.turno] && P.giocatori[P.turno].id === "host";
          if (P.fase === "lampo" && P.lampo && !P.lampo.chi && P.lampo.n >= 3) { P.prenota("host", P.lampo.n, 300); }
          if (P.fase === "lampo" && P.lampo && P.lampo.chi === "host") { P.lampoSoluzione("host", P.lampo.frase); }
          if (io && P.fase === "gira" && w.document.querySelector(".ru-alto.tocca .ru-piatto-alto") && P.consonantiNascoste() > 0) return "gira";
          if (io && P.fase === "consonante") { const L = "BCDFGHLMNPRSTVZ".split("").find(x => !P.chiamate[x]); P.consonante(L); }
          if (io && (P.fase === "vocale" || P.fase === "risolvi")) P.rinuncia();
          if (io && P.fase === "gira" && P.consonantiNascoste() === 0) { P.risolvi(); P.soluzione(P.frase); }
          await window.dorme(250);
        }
        return "tempo";
      });
      if (pronto !== "gira") { righe.push("(si ferma: " + pronto + ")"); break; }
      await page.evaluate((sf) => { const c = window.__W.document.querySelector(".ru-fondo"); if (c) c.style.display = sf ? "" : "none"; window.__W.__fermaFondo = !sf; }, sfondo);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      const r = await page.evaluate(async (forza) => {
        const w = window.__W, P = w.__RUOTA.ultima, g0 = P.giroN, t = [];
        let on = true; (function rif(ts) { if (!on) return; t.push(ts); w.requestAnimationFrame(rif); })(w.performance.now());
        await window.spingiRuota(w, forza);
        await window.aspetta(() => P.giroN > g0 && P.fase === "girando", 4000);
        const t0 = w.performance.now(); t.length = 0;
        await window.aspetta(() => P.fase !== "girando", 12000, 50);
        on = false;
        const d = []; for (let i = 1; i < t.length; i++) d.push(t[i] - t[i - 1]);
        d.sort((a, b) => a - b);
        const durata = w.performance.now() - t0;
        return { n: t.length, durata: Math.round(durata), fps: +(t.length / durata * 1000).toFixed(1), mediana: +(d[Math.floor(d.length / 2)] || 0).toFixed(1), lenti: d.filter(x => x > 50).length, peggiore: Math.round(d[d.length - 1] || 0) };
      }, 0.3 + 0.35 * (g % 3));
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      righe.push((sfondo ? "luci accese" : "luci spente") + ": " + r.n + " fotogrammi in " + r.durata + " ms (" + r.fps + " al secondo), ogni " + r.mediana + " ms di solito, sopra i 50 ms: " + r.lenti + ", il peggiore " + r.peggiore + " ms");
      console.log(righe[righe.length - 1]);
    }
    fs.writeFileSync(path.join(arg.dove || __dirname, "fotogrammi.txt"), "Computer rallentato ×4, telefono " + MIS.join("x") + "\n" + righe.join("\n") + "\n");
  } catch (e) { console.log("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

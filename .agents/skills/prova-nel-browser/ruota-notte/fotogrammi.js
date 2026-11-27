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
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s); try { await window.COPIONE.carica("ruota-notte/prove.js"); } catch (e) { await window.COPIONE.carica("preferiti/ruota2.js"); }   // (anche su una copia vecchia, per confrontare)
      const w = await window.apriTel("Paky", { x: 0 }), f = document.getElementById("tel-Paky");
      f.style.width = MIS[0] + "px"; f.style.height = MIS[1] + "px"; f.style.transform = "none"; w.dispatchEvent(new w.Event("resize"));
      const tess = await window.aspetta(() => window.COPIONE.aiuti.tessera(w, "La Ruota della Fortuna"), 8000); tess.click(); await window.dorme(400);
      await window.aspetta(() => window.clicca(w, /Contro i Bot/, ".modo-grande"), 6000); await window.dorme(500);
      window.clicca(w, /Comincia/);
      window.__W = w;
    }, MIS);
    const righe = [];
    for (let g = 0; g < GIRI * 2; g++) {
      const sfondo = true; const PROVA = (arg.css || "").split("|")[g % 2] || ""; await page.evaluate((css) => { const d = window.__W.document; let s = d.getElementById("__prova"); if (!s) { s = d.createElement("style"); s.id = "__prova"; d.head.appendChild(s); } s.textContent = css.replace("ZOOMTARDI", ""); window.__W.__RUOTA_ZOOM_DA = /ZOOMTARDI/.test(css) ? 0.8 : 0; }, PROVA);   // un giro con le luci dello sfondo, uno senza
      // Paky deve girare: se la frase lampo o una lettera lo impediscono, il pilota le fa
      const pronto = await page.evaluate(async () => {
        const w = window.__W, fine = Date.now() + 120000;
        while (Date.now() < fine) {
          const P = w.__RUOTA && w.__RUOTA.ultima; if (!P) { await window.dorme(200); continue; }
          if (P.fase === "fine") return "fine";
          const io = P.giocatori[P.turno] && P.giocatori[P.turno].id === "host";
          const az = (a, x) => w.__RUOTA.ui() && w.__RUOTA.ui().cb.onAzione(a, x);
          if (P.fase === "lampo" && P.lampo && !P.lampo.chi && P.lampo.n >= 3) az("prenoto", { n: P.lampo.n, ms: 300 });
          if (P.fase === "lampo" && P.lampo && P.lampo.chi === "host") az("soluzione", P.lampo.frase);
          if (io && P.fase === "gira" && (w.document.querySelector(".ru-alto.tocca .ru-piatto-alto") || [].some.call(w.document.querySelectorAll(".ru-azioni button"), x => /Gira/.test(x.textContent) && !x.disabled)) && P.consonantiNascoste() > 0) return "gira";
          if (io && P.fase === "consonante") { const L = "BCDFGHLMNPRSTVZ".split("").find(x => !P.chiamate[x]); az("lettera", L); }
          if (io && P.fase === "risolvi") az("soluzione", P.frase);
          if (io && P.fase === "gira" && P.consonantiNascoste() === 0) az("risolvi");
          await window.dorme(250);
        }
        return "tempo";
      });
      if (pronto !== "gira") { righe.push("(si ferma: " + pronto + ")"); break; }
      await page.evaluate((sf) => { const c = window.__W.document.querySelector(".ru-fondo"); if (c) c.style.display = sf ? "" : "none"; window.__W.__fermaFondo = !sf; }, sfondo);
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
      if (arg.profilo) { await cdp.send("Profiler.enable"); await cdp.send("Profiler.start"); }
      const r = await page.evaluate(async (forza) => {
        const w = window.__W, P = w.__RUOTA.ultima, g0 = P.giroN, t = [];
        let on = true; (function rif(ts) { if (!on) return; t.push(ts); w.requestAnimationFrame(rif); })(w.performance.now());
        if (window.spingiRuota) await window.spingiRuota(w, forza); else { const b = [].find.call(w.document.querySelectorAll(".ru-azioni button"), x => /Gira/.test(x.textContent) && !x.disabled); if (b) b.click(); }
        await window.aspetta(() => P.giroN > g0 && P.fase === "girando", 4000);
        const t0 = w.performance.now(); t.length = 0;
        await window.aspetta(() => P.fase !== "girando", 12000, 50);
        on = false;
        const d = [], lunghi = []; for (let i = 1; i < t.length; i++) { d.push(t[i] - t[i - 1]); if (t[i] - t[i - 1] > 50) lunghi.push(Math.round(t[i - 1] - t0) + "ms:" + Math.round(t[i] - t[i - 1])); }
        d.sort((a, b) => a - b);
        const durata = w.performance.now() - t0;
        return { n: t.length, durata: Math.round(durata), fps: +(t.length / durata * 1000).toFixed(1), mediana: +(d[Math.floor(d.length / 2)] || 0).toFixed(1), lenti: d.filter(x => x > 50).length, peggiore: Math.round(d[d.length - 1] || 0), lunghi: lunghi.join(" ") };
      }, 0.3 + 0.35 * (g % 3));
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      if (arg.profilo) { const { profile } = await cdp.send("Profiler.stop"); const self = {}, dt = profile.timeDeltas || [], id2 = {}; profile.nodes.forEach(n => id2[n.id] = n); (profile.samples || []).forEach((s, i) => { const n = id2[s], k = n.callFrame.functionName + " " + (n.callFrame.url || "").split("/").pop() + ":" + n.callFrame.lineNumber; self[k] = (self[k] || 0) + (dt[i] || 0) / 1000; }); console.log(Object.entries(self).sort((a, b) => b[1] - a[1]).slice(0, 14).map(x => Math.round(x[1]) + "ms " + x[0]).join(" | ")); }
      righe.push((PROVA ? "[" + PROVA.slice(0, 40) + "] " : "[così com'è] ") + ": " + r.n + " fotogrammi in " + r.durata + " ms (" + r.fps + " al secondo), ogni " + r.mediana + " ms di solito, sopra i 50 ms: " + r.lenti + ", il peggiore " + r.peggiore + " ms (" + r.lunghi + ")");
      console.log(righe[righe.length - 1]);
    }
    fs.writeFileSync(path.join(arg.dove || __dirname, "fotogrammi.txt"), "Computer rallentato ×4, telefono " + MIS.join("x") + "\n" + righe.join("\n") + "\n");
  } catch (e) { console.log("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

// 📖 LE FOTO DEL LIBRO VERO (quello nel gioco, novità v463): l'album aperto dai Trofei con numeri finti, passo per passo, e la misura
// della pagina che gira col computer rallentato ×4. Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: node .agents\skills\prova-nel-browser\album\libro-vero-foto.js --porta 8977 --dove D:\SG-album-prove\libro2\gioco [--misure 360x640,412x915]
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8977), DOVE = arg.dove || path.join(__dirname, "libro-vero-foto");
const MISURE = (arg.misure || "360x640,412x915").split(",").map(m => m.split("x").map(Number));
fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda"; let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-libro-vero");
  for (;;) { const v = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; }); if (v[0] === path.basename(mioLock)) return; await new Promise(r => setTimeout(r, 2000)); }
}
(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding"] });
  const diario = [];
  try {
    for (const [L, H] of MISURE) {
      const ctx = await b.newContext({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" }), p = await ctx.newPage();
      p.on("pageerror", e => diario.push("❗ " + e.message));
      await p.goto(BASE + "/sw.js");
      await p.evaluate(async ([L, H]) => {
        const tf = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(tf.split("// ===== ESEMPIO =====")[0]);
        const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
        window.__ST = { al_oggi: {} }; window.__statFinte = function (nome, g) { return g === "astafanta" ? window.__ST : {}; };
        const P = await window.apriTel("Paky", { x: 0 }); const f = document.getElementById("tel-Paky"); f.style.cssText += ";left:0;top:0;transform:none;z-index:9999;width:" + L + "px;height:" + H + "px";
        P.dispatchEvent(new P.Event("resize"));
        if (!P.SG_FANTA_IDS) await P.SGCuore.caricaPezzo("asta");
        const D = P.SG_FANTA_CALCIATORI, per = {};
        ["P", "D", "C", "A"].forEach(r => ["A", "B", "C"].forEach(fa => ((D[r] || {})[fa] || []).forEach(k => { const m = /\((.*)\)$/.exec(k); (per[m[1]] = per[m[1]] || []).push({ k, r }); })));
        const id = k => P.SG_FANTA_IDS[k] ? "fc" + P.SG_FANTA_IDS[k] : null;
        const voce = (i) => [1, 10 + i, 10 + i, 10 + i, 0, 0, 2, 130, 150, i % 3, i % 2, 0, 0, 1, 90, "2026-11-12|Cagliari|1"];
        window.__metti = (k, i) => { const x = id(k); if (x) window.__ST.al_oggi[x] = voce(i || 1); };
        ["Martinez L. (Inter)", "Barella (Inter)", "Thuram (Inter)", "Bastoni (Inter)", "Dimarco (Inter)", "Calhanoglu (Inter)", "Sommer (Inter)"].forEach((k, i) => window.__metti(k, i));
        per.Napoli.forEach((x, i) => { if (i !== 3) window.__metti(x.k, i); }); window.__ULTIMA = per.Napoli[3].k;
        per.Torino.forEach((x, i) => window.__metti(x.k, i)); per.Roma.forEach((x, i) => { if (i % 3 === 0) window.__metti(x.k, i); });
        P.localStorage.removeItem("sg-alb-viste-x"); Object.keys(P.localStorage).filter(k => /^sg-alb-viste/.test(k)).forEach(k => P.localStorage.removeItem(k));
      }, [L, H]);
      const fr = await (await p.$("#tel-Paky")).contentFrame();
      const ev = (f, a) => fr.evaluate(f, a);
      const scatta = async (n, ms) => { await p.waitForTimeout(ms == null ? 500 : ms); await p.screenshot({ path: path.join(DOVE, n + "-" + L + "x" + H + ".png"), clip: { x: 0, y: 0, width: L, height: H } }); diario.push(n + " " + L + "x" + H); };
      const clic = async (sel) => { const r = await ev(s => { const e = document.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return [b.left + b.width / 2, s === ".lb-cop" ? b.bottom - 30 : b.top + b.height / 2]; }, sel); if (!r) { diario.push("❗ non trovo " + sel); return false; } await p.mouse.click(r[0], r[1]); return true; };
      await ev(() => window.SGCuore.apriAlbum()); await p.waitForTimeout(1500);
      await scatta("01-copertina", 300);
      await clic(".lb-cop"); await scatta("02-le-luci-si-accendono", 420);
      await p.waitForTimeout(1800); await scatta("03-indice", 300);
      await clic(".lb-ig button[data-sq=Inter]"); await p.waitForTimeout(250); await scatta("04-si-gira-verso-l-inter", 0); await p.waitForTimeout(1400); await scatta("05-inter-pagina-1", 300);
      // la pagina segue il dito
      await p.mouse.move(L * 0.85, H * 0.55); await p.mouse.down(); for (let x = 0.85; x >= 0.45; x -= 0.05) await p.mouse.move(L * x, H * 0.55); await scatta("06-la-pagina-segue-il-dito", 80);
      await p.mouse.move(L * 0.2, H * 0.55); await p.mouse.up(); await p.waitForTimeout(1500); await scatta("07-inter-pagina-2", 300);
      await clic(".lb-foglio[style*=visible] .lb-cas:not(:has(.lb-fig))"); await scatta("08-tocchi-un-tassello-vuoto", 250);
      await ev(() => { const b = [...document.querySelectorAll(".lb-cas")].find(x => x.__c && x.__c.nome === "Martinez L."); b && b.click(); }); await scatta("09-la-scheda-con-te", 400);
      await clic(".alb-foglio .chiudi"); await p.waitForTimeout(300);
      await p.mouse.move(L * 0.2, H * 0.55); await p.mouse.down(); for (let x = 0.2; x <= 0.9; x += 0.1) await p.mouse.move(L * x, H * 0.55); await p.mouse.up(); await p.waitForTimeout(1200); await scatta("10-indietro-col-dito", 200);
      // le figurine nuove: l'ultima del Napoli e una dell'Inter arrivano dopo una partita
      await p.evaluate(() => { window.__metti(window.__ULTIMA, 4); window.__metti("Akanji (Inter)", 5); });
      await ev(() => window.SGCuore.apriAlbum()); await p.waitForTimeout(1200); await clic(".lb-cop"); await p.waitForTimeout(2300); await scatta("11-indice-con-le-nuove", 300);
      await clic(".lb-ig button[data-sq=Napoli]"); await p.waitForTimeout(1250); await scatta("12-la-figurina-nuova-vola", 0); await p.waitForTimeout(500); await scatta("13-si-attacca", 0);
      await p.waitForTimeout(1000); await scatta("14-napoli-completa", 0); await p.waitForTimeout(700); await scatta("15-i-coriandoli", 0); await p.waitForTimeout(2500); await scatta("16-napoli-d-oro", 0);
      // ⏱️ la pagina che gira col computer ×4 (il tasto ›, e il dito)
      if (L === 360) {
        const cdp = await ctx.newCDPSession(p); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
        for (let n = 0; n < 3; n++) {
          await p.waitForTimeout(2500);
          await ev(() => { const dt = []; let ult = 0; window.__dt = dt; window.__via = true; window.__t0 = performance.now(); (function g(t) { if (ult) dt.push([t - ult, t - window.__t0]); ult = t; if (window.__via) requestAnimationFrame(g); })(0); });
          await ev(() => { window.__tc = performance.now() - window.__t0; }); await clic(".lb-fr.giu"); await p.waitForTimeout(1300);
          const m = await ev(() => { window.__via = false; const t0 = window.__tc || 0, giro = window.__dt.filter(x => x[1] > t0 && x[1] - x[0] < t0 + 700), dopo = window.__dt.filter(x => x[1] - x[0] >= t0 + 700);
            const r = l => ({ fotogrammi: l.length, medio: Math.round(l.reduce((a, b) => a + b[0], 0) / Math.max(1, l.length)), lenti: l.filter(x => x[0] > 34).map(x => Math.round(x[0]) + "@" + Math.round(x[1] - t0)).join(" ") || "nessuno" }); return { giro: r(giro), dopo: r(dopo) }; });
          diario.push("⏱️ pagina che gira (tasto ›) col computer ×4: mentre gira (0,62 s) " + JSON.stringify(m.giro) + " · dopo, a pagina ferma " + JSON.stringify(m.dopo));
        }
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      }
      // 📱↔️ il telefono girato
      await p.evaluate(([L, H]) => { const f = document.getElementById("tel-Paky"); f.style.width = (H < 700 ? 640 : 915) + "px"; f.style.height = (H < 700 ? 360 : 412) + "px"; }, [L, H]);
      await p.waitForTimeout(1500); await p.screenshot({ path: path.join(DOVE, "17-girato-" + (H < 700 ? "640x360" : "915x412") + ".png"), clip: { x: 0, y: 0, width: H < 700 ? 640 : 915, height: H < 700 ? 360 : 412 } }); diario.push("17 girato");
      const err = await p.evaluate(() => window.erroriTel ? window.erroriTel() : []); if (err.length) diario.push("❗ errori: " + err.slice(0, 4).join(" | "));
      await ctx.close();
    }
  } finally { fs.writeFileSync(path.join(DOVE, "diario.txt"), diario.join("\n") + "\n"); console.log(diario.join("\n")); await b.close(); lascia(); }
})();

// LA GIORNATA IN 2 O IN 8, SUL TELEFONO ALTO O BASSO, COL NOME DI CHI L'HA COMPRATO O SOLO IL COLORE (6 nov 2026): foto di un'azione,
// un gol, una parata e il podio, e gli errori della pagina. Uso: node dopo7.js --porta 8981 --dove D:\cartella --n 8 [--basso] [--nome]
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
const BASE = "http://localhost:" + (arg.porta || 8981), DOVE = arg.dove || path.join(__dirname, "foto"), OTTO = +arg.n === 8, BASSO = !!arg.basso, NOME = !!arg.nome;
const TAG = (OTTO ? "8" : "2") + (BASSO ? "-basso" : "-alto") + (NOME ? "-nome" : "-colore") + "-", LW = BASSO ? 360 : 390, LH = BASSO ? 640 : 844;
fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto");
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    await new Promise(r => setTimeout(r, 2000));
  }
}
const AGGANCI = [["R.campoBox = palco(el, R);", "window.__RIV = R; window.__PV = { coloriSquadra: coloriSquadra, maglia: maglia, srcAv: srcAv, cfgDi: cfgDi }; R.campoBox = palco(el, R);"]];
(async () => {
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion", "--autoplay-policy=no-user-gesture-required"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    await ctx.route(/\/js\/games\/asta\.js/, async (route) => {
      const r = await route.fetch(); let s = await r.text();
      for (const [a, b] of AGGANCI) { if (s.indexOf(a) < 0) console.log("⚠️ aggancio non trovato: " + a.slice(0, 60)); s = s.split(a).join(b); }
      await route.fulfill({ status: 200, body: s, headers: { "content-type": "text/javascript; charset=utf-8", "cache-control": "no-store" } });
    });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.log("errore pagina: " + e.message));
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async (otto) => {
      if (otto[0]) window.__PV_NOMI = ["Paky", "Giulia", "Luca", "Marta", "Ciro", "Sara", "Tonino", "Francesca"]; else window.__PV_NOMI = ["Paky", "Giulia"];
      window.__PV_W = otto[2]; window.__PV_H = otto[3]; window.__PV_NOMECHI = otto[1];
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/asta.js"); await window.COPIONE.carica("asta-grafica/provini.js");
    }, [OTTO, NOME, LW, LH]);
    const ev = (f, a) => page.evaluate(f, a);
    const pre = "";
    async function scatta(nome) { await page.waitForTimeout(250); await page.screenshot({ path: path.join(DOVE, pre + nome + ".png"), clip: { x: 0, y: 0, width: LW, height: LH } }); console.log("📸 " + pre + nome); }
    async function zoom(nome, lw, lh) {
      const b = await ev(() => { var r = window.PV.w().__RIV, cv = window.PV.w().document.querySelector("canvas.st-az"), q = cv.getBoundingClientRect(); return [q.left + r.az.dove[0], q.top + r.az.dove[1], q.left, q.top, q.width, q.height]; });
      const w = lw || 190, h = lh || 150, x = Math.max(b[2], Math.min(b[2] + b[4] - w, b[0] - w / 2)), y = Math.max(b[3], Math.min(b[3] + b[5] - h, b[1] - h * 0.55));
      await page.screenshot({ path: path.join(DOVE, pre + nome + ".png"), clip: { x: x, y: y, width: w, height: h } }); console.log("🔍 " + pre + nome);
    }
    page.on("console", m => { if (m.type() === "error") console.log("console: " + m.text().slice(0, 300)); });
    page.on("crash", () => console.log("PAGINA CRASHATA"));
    const stato = () => ev(() => { const w = window.PV.w(), m = w.performance && w.performance.memory, min = w.document.querySelector(".st-bar-min"); return "heap " + (m ? Math.round(m.usedJSHeapSize / 1e6) + " MB" : "?") + " · " + (min ? min.textContent : "?") + " · fermo " + !!(w.__T && w.__T.fermo) + " · coda " + (w.__T && w.__T.coda ? w.__T.coda.length : "?"); });
    console.log(await ev(() => window.PV.prepara()));
    await ev(() => window.PV.veloce());
    for (const [cond, nome] of [["azione", "azione"], ["gol", "gol"], ["parata", "parata"]]) {
      console.log("prima di " + cond + ": " + await stato()); const r = await ev(c => window.PV.aspetta(c, 240000), cond); console.log(r + " · " + await stato()); if (/^NO/.test(r)) continue;
      await scatta(TAG + nome); await ev(() => window.PV.riparti()); await page.waitForTimeout(2500);
    }
    const r2 = await ev(() => window.PV.aspetta("pagella", 400000)); console.log(r2); await ev(() => window.PV.riparti());
    await ev(() => window.PV.salta()); await page.waitForTimeout(3000); await scatta(TAG + "podio");
  } finally { await browser.close().catch(() => {}); lascia(); }
})().catch(e => { console.log("NO: " + (e && e.stack || e)); lascia(); process.exit(1); });

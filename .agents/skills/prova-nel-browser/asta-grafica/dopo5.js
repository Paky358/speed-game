// (STORICO: le varianti A/B/C e 0/1/2 non ci sono più nel gioco, scelti C e il nome come regola) LE FOTO DELLE PROPOSTE DEL 6 NOV POMERIGGIO (omini più belli, il nome di chi l'ha comprato sotto il calciatore).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\asta-grafica\dopo5.js --porta 8981 --dove C:\cartella\foto [--otto]
// (il server della copia acceso sulla porta). Le varianti sono già nel gioco: window.__astaOminoV ("A" com'erano, "B", "C")
// e window.__astaEtichV ("0" senza il nome di chi l'ha comprato, "1" dentro l'etichetta, "2" etichetta scura).
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
const BASE = "http://localhost:" + (arg.porta || 8981), DOVE = arg.dove || path.join(__dirname, "foto"), OTTO = !!arg.otto;
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
      if (otto) window.__PV_NOMI = ["Paky", "Giulia", "Luca", "Marta", "Ciro", "Sara", "Tonino", "Francesca"];
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/asta.js"); await window.COPIONE.carica("asta-grafica/provini.js");
    }, OTTO);
    const ev = (f, a) => page.evaluate(f, a);
    const pre = OTTO ? "8-" : "";
    async function scatta(nome) { await page.waitForTimeout(250); await page.screenshot({ path: path.join(DOVE, pre + nome + ".png"), clip: { x: 0, y: 0, width: 390, height: 844 } }); console.log("📸 " + pre + nome); }
    async function zoom(nome, lw, lh) {
      const b = await ev(() => { var r = window.PV.w().__RIV, cv = window.PV.w().document.querySelector("canvas.st-az"), q = cv.getBoundingClientRect(); return [q.left + r.az.dove[0], q.top + r.az.dove[1], q.left, q.top, q.width, q.height]; });
      const w = lw || 190, h = lh || 150, x = Math.max(b[2], Math.min(b[2] + b[4] - w, b[0] - w / 2)), y = Math.max(b[3], Math.min(b[3] + b[5] - h, b[1] - h * 0.55));
      await page.screenshot({ path: path.join(DOVE, pre + nome + ".png"), clip: { x: x, y: y, width: w, height: h } }); console.log("🔍 " + pre + nome);
    }
    function vista(om, et) { return ev(([om, et]) => { var w = window.PV.w(); w.__astaOminoV = om; w.__astaEtichV = et; window.PV.foto(window.PV.p); }, [om, et]); }
    console.log(await ev(() => window.PV.prepara()));
    await ev(() => window.PV.veloce());
    for (let g = 0; g < (OTTO ? 2 : 3); g++) {
      const r = await ev(() => window.PV.aspetta("azione")); console.log(r); if (/^NO/.test(r)) break;
      if (!OTTO) for (const om of ["A", "B", "C"]) { await vista(om, "0"); await scatta("omini-" + g + "-" + om); await zoom("omini-" + g + "-" + om + "-vicino"); }
      for (const et of ["0", "1", "2"]) { await vista("B", et); await scatta("nome-" + g + "-" + et); await zoom("nome-" + g + "-" + et + "-vicino", 260, 190); }
      await ev(() => { var w = window.PV.w(); w.__astaOminoV = null; w.__astaEtichV = null; window.PV.riparti(); }); await page.waitForTimeout(4000);
    }
  } finally { await browser.close().catch(() => {}); lascia(); }
})().catch(e => { console.log("NO: " + (e && e.stack || e)); lascia(); process.exit(1); });

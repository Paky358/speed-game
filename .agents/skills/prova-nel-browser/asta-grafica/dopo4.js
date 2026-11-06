// LE FOTO DEI PROVINI DELLA GIORNATA (6 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\asta-grafica\foto.js --porta 8981 --dove C:\cartella\foto
// (il server della copia acceso sulla porta). asta.js arriva coi 6 agganci dei provini (solo qui: il gioco vero non li ha).
const path = require("path"), fs = require("fs"), os = require("os");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1];
const BASE = "http://localhost:" + (arg.porta || 8981), DOVE = arg.dove || path.join(__dirname, "foto"), SOLO = arg.solo ? arg.solo.split(",") : null;
fs.mkdirSync(DOVE, { recursive: true });

// la fila: un Edge di prova alla volta su tutto il PC
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
const AGGANCI = [
  ["R.campoBox = palco(el, R);", "window.__RIV = R; window.__PV = { coloriSquadra: coloriSquadra, maglia: maglia, srcAv: srcAv, cfgDi: cfgDi }; R.campoBox = palco(el, R);"],
  ['ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(-u * 0.38, -u * 1.86, u * 0.76, u * 0.16);', 'ctx.fillStyle = "rgba(255,255,255,.12)"; ctx.fillRect(-u * 0.38, -u * 1.86, u * 0.76, u * 0.16); if (window.__PV_MAGLIA) window.__PV_MAGLIA(ctx, u, kit, o, dir);'],
  ["      figure.sort(function (a, b) { return a.y - b.y; });", "      if (window.__PV_FIG) window.__PV_FIG(figure, sc, p, A); A._fig = figure; figure.sort(function (a, b) { return a.y - b.y; });"],
  ["      if (A.fondo) ctx.drawImage(A.fondo, 0, 0, w, h);", "      if (A.fondo) ctx.drawImage(A.fondo, 0, 0, w, h); if (window.__PV_FONDO) window.__PV_FONDO(ctx, A);"],
  ["      var fs = Math.round(Math.max(9, Math.min(12, Math.min(w, h) * 0.032)));", "      if (window.__PV_SOPRA) window.__PV_SOPRA(ctx, A, cam, A._fig); var fs = Math.round(Math.max(9, Math.min(12, Math.min(w, h) * 0.032)));"],
  ['ctx.beginPath(); ctx.arc(gp[0], gp[1] - zpx - rb * 0.6, rb, 0, Math.PI * 2); ctx.fillStyle = "#fff";', 'ctx.beginPath(); ctx.arc(gp[0], gp[1] - zpx - rb * 0.6, rb, 0, Math.PI * 2); ctx.fillStyle = window.__PV_PALLA || "#fff";']
];

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
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/asta.js"); await window.COPIONE.carica("asta-grafica/provini.js");
    });
    const ev = (f, a) => page.evaluate(f, a);
    async function scatta(nome) { await page.waitForTimeout(350); await page.screenshot({ path: path.join(DOVE, nome + ".png"), clip: { x: 0, y: 0, width: 390, height: 844 } }); console.log("📸 " + nome); }
    async function prop(k, x, nome) { if (SOLO && SOLO.indexOf(nome || k) < 0 && SOLO.indexOf(k) < 0) return; await ev(([k, x]) => window.PV.mostra(k, x), [k, x]); await scatta(nome || k); }
    if (arg.capitano) { console.log(await ev(n => window.COPIONE.prova("cap1", { n: n }), +arg.capitano)); return; }
    // (6 nov) il tuffo del portiere: una parata vera, fotografata in 4 istanti
    console.log(await ev(() => window.PV.prepara()));
    await ev(() => window.PV.veloce());
    for (let g = 0; g < 2; g++) {
      const r = await ev(gg => window.PV.parataFinta(gg ? "fuori" : "cross", 11 + gg * 6), g); console.log(r); if (r.indexOf("?") >= 0) break;
      for (const [nome, dd] of [["1-carica", -0.05], ["2-volo", -0.005], ["3-colpo", 0.015], ["4-a-terra", 0.12], ["5-si-rialza", 0.3]]) {
        await ev(x => { var sc = window.PV.sc; window.PV.foto(Math.min(1, sc.paf + x), { zoomFine: 1.2, tz: 0 }); }, dd); await page.waitForTimeout(200); const b = await ev(() => { var r = window.PV.w().__RIV, cv = r.az && window.PV.w().document.querySelector("canvas.st-az"), q = cv.getBoundingClientRect(); return [q.left + r.az.dove[0], q.top + r.az.dove[1]]; }); await page.screenshot({ path: path.join(DOVE, "zoom-" + g + "-" + nome + ".png"), clip: { x: Math.max(0, b[0] - 70), y: Math.max(0, b[1] - 60), width: 140, height: 110 } }); console.log("📸 zoom " + nome);
      }
      await ev(() => window.PV.riparti()); await page.waitForTimeout(3000);
    }
  } finally { await browser.close().catch(() => {}); lascia(); }
})().catch(e => { console.log("NO: " + (e && e.stack || e)); lascia(); process.exit(1); });

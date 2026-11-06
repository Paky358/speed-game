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
    // (6 nov) le foto di quello che è stato COSTRUITO (niente provini sopra)
    console.log(await ev(() => window.PV.prepara("asta")));
    await scatta("1-asta-maglia-girata");
    await ev(() => window.PV.maglieRetro()); await scatta("2-maglie-girate"); await ev(() => window.PV.togli());
    console.log(await ev(() => window.PV.prepara()));
    await ev(() => window.PV.veloce());
    const tipi = {};
    for (let g = 0; g < 6 && Object.keys(tipi).length < 3; g++) {
      const r = await ev(() => window.PV.aspetta("gol")); console.log(r); if (/^NO/.test(r)) break;
      const f = await ev(() => window.PV.fest()); const tipo = f ? f.tipo : "?";
      if (tipi[tipo]) { await ev(() => window.PV.riparti()); await page.waitForTimeout(4000); continue; }
      tipi[tipo] = 1; await page.waitForTimeout(700); await scatta("3-gol-banda-" + tipo);
      if (f) { await ev(t => window.PV.istante(t[0] + 0.13), f.t); await scatta("4-esultanza-" + tipo); await ev(t => window.PV.istante(Math.min(1, t[1] + 0.07)), f.t); await scatta("5-abbraccio-" + tipo); }
      await ev(() => window.PV.riparti()); await page.waitForTimeout(1250); await scatta("6-punti-che-volano-" + tipo);
      await page.waitForTimeout(4000);
    }
  } finally { await browser.close().catch(() => {}); lascia(); }
})().catch(e => { console.log("NO: " + (e && e.stack || e)); lascia(); process.exit(1); });

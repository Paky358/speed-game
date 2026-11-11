// LE FOTO DELL'ASTA DEI TEMI ONLINE IN 8 (11 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Fa girare lo scenario an1 (preferiti/asta-notte.js) e salva le foto di saletta, inizio round, scelta (8, 7, 6, 3 carte), sala,
// busta, esito, voto e fine a 360x640 e 412x915. Uso:
//   "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\asta-grafica\temi-foto.js --porta 8955 --dove C:\cartella\foto [--prova an1]
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
const BASE = "http://localhost:" + (arg.porta || 8955), DOVE = arg.dove || path.join(__dirname, "foto-temi"), PROVA = arg.prova || "an1";
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
(async () => {
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.log("errore pagina: " + e.message));
    await page.exposeFunction("__scatta", async (nome, w, h) => { await page.screenshot({ path: path.join(DOVE, nome + ".png"), clip: { x: 0, y: 0, width: w, height: h } }); console.log("📸 " + nome); });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    if (arg.fluent) await page.evaluate(m => { window.__FLUENT = m; }, JSON.parse(fs.readFileSync(arg.fluent, "utf8")));   // (--fluent mappa.json: la foto della proposta con Fluent Emoji 3D)
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/asta.js"); await window.COPIONE.carica("preferiti/asta-notte.js");
    });
    console.log(await page.evaluate(([p, m]) => window.COPIONE.prova(p, m), [PROVA, Object.assign({}, arg.morbido ? { morbido: true } : {}, arg.maledetta ? { maledetta: true } : {}, arg.normali ? { round: "normali" } : {})]));
  } finally { await browser.close(); }
})();

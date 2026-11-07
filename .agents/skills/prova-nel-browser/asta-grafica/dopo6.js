// LE FOTO DELLA RUOTA DELLO SPAREGGIO (6 nov 2026): fa girare la prova bu2 (sullo stesso telefono, in 3) o bu4 (online, in 2: --online)
// e fotografa il telefono di Paky (390x844) quando la ruota gira: all'inizio, a metà, quasi ferma, ferma.
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\asta-grafica\dopo6.js --porta 8981 --dove C:\cartella\foto [--online]
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1] && !process.argv[i + 1].startsWith("--") ? process.argv[i + 1] : true;
const BASE = "http://localhost:" + (arg.porta || 8981), DOVE = arg.dove || path.join(__dirname, "foto"), ONL = !!arg.online;
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
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion", "--autoplay-policy=no-user-gesture-required"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.log("errore pagina: " + e.message));
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/asta.js");
    });
    // il telefono di Paky grande appena c'è; la prova gira da sola
    await page.evaluate((onl) => {
      window.__ESITO = null; window.COPIONE.prova(onl ? "bu4" : "bu2").then(r => { window.__ESITO = String(r); }, e => { window.__ESITO = "NO " + e; });
      const iv = setInterval(() => { const f = document.getElementById("tel-Paky"); if (f && !f.__grande) { f.__grande = 1; f.style.cssText = "position:absolute;top:0;left:0;width:390px;height:844px;border:0;background:#000;transform:none;z-index:9"; try { f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); } catch (e) {} } }, 50);
    }, ONL);
    const fino = Date.now() + 400000;
    let parte = null;
    while (Date.now() < fino) {
      parte = await page.evaluate(() => { const f = document.getElementById("tel-Paky"), d = f && f.contentDocument; return d && d.querySelector(".st-ruota canvas") ? performance.now() : null; });
      if (parte) break;
      const es = await page.evaluate(() => window.__ESITO); if (es) { console.log("la prova è finita prima: " + es); return; }
      await page.waitForTimeout(40);
    }
    if (!parte) { console.log("NO: la ruota non arriva"); return; }
    const pre = ONL ? "ruota2-" : "ruota3-";
    for (const [nome, ms] of [["1-parte", 900], ["2-gira", 2600], ["3-rallenta", 5200], ["4-quasi-ferma", 7300], ["5-ferma", 8600]]) {
      const ora = await page.evaluate(() => performance.now()); if (parte + ms > ora) await page.waitForTimeout(parte + ms - ora);
      await page.screenshot({ path: path.join(DOVE, pre + nome + ".png"), clip: { x: 0, y: 0, width: 390, height: 844 } }); console.log("📸 " + pre + nome);
    }
    for (let i = 0; i < 600; i++) { const es = await page.evaluate(() => window.__ESITO); if (es) { console.log("prova: " + es.slice(0, 600)); break; } await page.waitForTimeout(500); }
  } finally { await browser.close().catch(() => {}); lascia(); }
})().catch(e => { console.log("NO: " + (e && e.stack || e)); lascia(); process.exit(1); });

// LE FOTO DEL QUARTO AVVISO «Hai sbloccato altri trofei · +N» (26 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\trofei-avvisi\foto.js --porta 8996 --dove D:\SG-trofei-prove
// (il server della copia acceso sulla porta). Fa girare la prova ta6 (preferiti/trofei-avvisi.js) e fotografa il «+9» su 360x640 e 412x915.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8996), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-trofei-avvisi");
  let detto = false;
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ in fila dietro: " + vivi[0]); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}
(async () => {
  await turno();
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1000, height: 1000 }, deviceScaleFactor: 3, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.log("❗ errore pagina: " + e.message));
    await page.exposeFunction("__scatta", async (L, H) => {
      await page.waitForTimeout(150);
      const file = path.join(DOVE, "quarto-avviso-" + L + "x" + H + ".png");
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: L, height: H } });
      console.log("📸 " + file);
    });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    const r = await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/trofei-avvisi.js");
      window.__fotoAvviso = async (w, m) => {
        const f = document.getElementById("tel-Paky");
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = m[0] + "px"; f.style.height = m[1] + "px"; f.style.zIndex = 9999;
        w.dispatchEvent(new w.Event("resize"));
        await window.__scatta(m[0], m[1]);
      };
      return await window.COPIONE.prova("ta6");
    });
    console.log(JSON.stringify(r).slice(0, 600));
  } finally { await browser.close(); lascia(); }
})();

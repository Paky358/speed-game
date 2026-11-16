// LE FOTO DELLA SERIE A 2017-18 (16 nov 2026): l'asta e la giornata con la scritta dell'anno, sul telefono di Paky (host) e di Giulia.
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\asta-grafica\foto-stagione.js --porta 8941 --dove C:\cartella
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1];
const BASE = "http://localhost:" + (arg.porta || 8941), DOVE = arg.dove || path.join(__dirname, "foto-stagione"); fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda"; let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto");
  for (;;) { const v = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (v[0] === path.basename(mioLock)) return; await new Promise(r => setTimeout(r, 2000)); }
}
(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-gpu"] });
  try {
    const page = await (await b.newContext({ viewport: { width: 1600, height: 1000 } })).newPage();
    await page.goto(BASE + "/sw.js");
    console.log(await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-stagione.js");
      return await COPIONE.prova("stF");
    }));
    const tel = n => page.locator("#tel-" + n);
    // (i telefoni finti sono rimpiccioliti a metà: per le foto a grandezza vera, 390x844, uno accanto all'altro)
    await page.evaluate(() => { [["Paky", 0], ["Giulia", 400]].forEach(([n, x]) => { const f = document.getElementById("tel-" + n); f.style.transform = "none"; f.style.left = x + "px"; f.style.width = "390px"; f.style.height = "844px"; f.style.zIndex = 9; f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); }); });
    await page.waitForTimeout(2500);
    await tel("Paky").screenshot({ path: path.join(DOVE, "1-asta-paky.png") }); await tel("Giulia").screenshot({ path: path.join(DOVE, "2-asta-giulia.png") });
    console.log("giornata:", await page.evaluate(() => window.__stagioneGiornata()));
    await page.waitForTimeout(9000);
    await tel("Paky").screenshot({ path: path.join(DOVE, "3-giornata-paky.png") });
    await page.waitForTimeout(9000);
    await tel("Giulia").screenshot({ path: path.join(DOVE, "4-giornata-giulia.png") });
  } finally { await b.close(); lascia(); }
})();

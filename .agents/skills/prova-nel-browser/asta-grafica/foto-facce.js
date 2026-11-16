// LA FOTO DELL EDITOR «Facce dei calciatori» (16 nov 2026), a grandezza di telefono.
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\asta-grafica\foto-stagione.js --porta 8941 --dove C:\cartella
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1];
const BASE = "http://localhost:" + (arg.porta || 8941), DOVE = arg.dove || path.join(__dirname, "foto-facce"); fs.mkdirSync(DOVE, { recursive: true });
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
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(s.split("// ===== ESEMPIO =====")[0]);
      const w = await window.apriTel("IL PAPPONE", { x: 0 }); const f = document.getElementById("tel-IL PAPPONE"); f.style.transform = "none"; f.style.width = "390px"; f.style.height = "844px"; f.style.zIndex = 9;
      await w.SG.scaricaGioco("asta"); w.SGAstaAspetto.facce();
    });
    await page.waitForTimeout(6000);
    await page.locator("iframe[id=\"tel-IL PAPPONE\"]").screenshot({ path: path.join(DOVE, "editor-facce.png") });
  } finally { await b.close(); lascia(); }
})();

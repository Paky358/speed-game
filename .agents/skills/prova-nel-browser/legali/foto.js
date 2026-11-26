// 📜 LE FOTO DELLE PAGINE LEGALI (26 nov 2026): privacy, regole, crediti su un telefono 360x640 (prima schermata e pagina intera),
// più la home in fondo e il profilo coi telefoni finti. Edge invisibile, stessa fila di prova.js.
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\legali\foto.js --porta 8991 --dove D:\SG-legali-prove\foto
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8991), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-legali");
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
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-gpu"] });
  try {
    // 1) le tre pagine, come le vede un telefono
    const tel = await browser.newContext({ viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, serviceWorkers: "block" });
    const p = await tel.newPage();
    p.on("pageerror", e => console.log("❗ " + e.message));
    for (const pg of ["privacy", "regole", "crediti"]) {
      await p.goto(BASE + "/" + pg + ".html", { waitUntil: "load" }); await p.waitForTimeout(500);
      await p.screenshot({ path: path.join(DOVE, pg + "-1-schermo.png") });
      await p.screenshot({ path: path.join(DOVE, pg + "-2-intera.png"), fullPage: true });
      console.log(pg + ": largo " + await p.evaluate(() => document.documentElement.scrollWidth) + ", alto " + await p.evaluate(() => document.documentElement.scrollHeight));
    }
    await p.evaluate(() => { const d = document.querySelector("details.cr-gruppo"); d.open = true; d.scrollIntoView(); });
    await p.waitForTimeout(400); await p.screenshot({ path: path.join(DOVE, "crediti-3-prezzo-aperto.png") });
    await p.fill("#cr-q", "bolt"); await p.waitForTimeout(500);
    await p.evaluate(() => document.getElementById("cr-q").scrollIntoView());
    await p.waitForTimeout(300); await p.screenshot({ path: path.join(DOVE, "crediti-4-cerca-bolt.png") });
    await tel.close();
    // 2) la home e il profilo, coi telefoni finti
    const ctx = await browser.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.log("❗ " + e.message));
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => { const s = await (await fetch("/.agents/skills/prova-nel-browser/telefoni-finti.js?" + Date.now())).text(); (0, eval)(s.split("// ===== ESEMPIO =====")[0]); });
    await page.evaluate(() => window.apriTel("Giulia", { x: 0 }));
    await page.evaluate(() => { const f = document.getElementById("tel-Giulia"); f.style.cssText += ";left:0;top:0;transform:none;width:360px;height:640px;z-index:9999"; f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize")); });
    await page.waitForFunction(() => { const w = window.finestra("Giulia"); return w && w.document.querySelector(".home [data-gioco]"); }, null, { timeout: 15000 });
    await page.waitForTimeout(1200);
    const clip = { x: 0, y: 0, width: 360, height: 640 };
    await page.evaluate(() => { const d = window.finestra("Giulia").document; for (let e = d.querySelector(".home-legale"); e; e = e.parentElement) e.scrollTop = e.scrollHeight; d.scrollingElement.scrollTop = 1e6; });
    await page.waitForTimeout(500); await page.screenshot({ path: path.join(DOVE, "app-1-home-in-fondo.png"), clip });
    console.log("home: la riga sta a " + await page.evaluate(() => { const w = window.finestra("Giulia"), r = w.document.querySelector(".home-legale").getBoundingClientRect(), m = w.document.querySelector(".ms-menu, .menu-sotto, nav"); return Math.round(r.top) + "-" + Math.round(r.bottom) + " (menu da " + (m ? Math.round(m.getBoundingClientRect().top) : "?") + ")"; }));
    await page.evaluate(() => window.finestra("Giulia").SGCuore.schermataAccesso());
    await page.waitForTimeout(800);
    await page.evaluate(() => { const d = window.finestra("Giulia").document; for (let e = d.querySelector(".pf-cancella"); e; e = e.parentElement) e.scrollTop = e.scrollHeight; d.scrollingElement.scrollTop = 1e6; });
    await page.waitForTimeout(400); await page.screenshot({ path: path.join(DOVE, "app-2-profilo-in-fondo.png"), clip });
    await page.evaluate(() => { const w = window.finestra("Giulia"); w.SGNube.cancella = () => new Promise(r => setTimeout(r, 300)); w.__fermaSi = true; });
    await page.evaluate(() => window.finestra("Giulia").SGCuore.chiediConferma && 0);
    // la conferma: i telefoni finti la toccano da soli; la fotografo prima che sparisca
    await page.evaluate(() => { clearInterval(window.__autoConferma); window.__autoConferma = null; window.finestra("Giulia").document.querySelector(".pf-cancella").click(); });
    await page.waitForTimeout(500); await page.screenshot({ path: path.join(DOVE, "app-3-conferma.png"), clip });
    await page.evaluate(() => { const b = window.finestra("Giulia").document.querySelector(".conferma-sfondo .btn-rosso"); if (b) { b.disabled = false; b.click(); } });
    await page.waitForTimeout(800); await page.screenshot({ path: path.join(DOVE, "app-4-password.png"), clip });
    await page.evaluate(() => { const d = window.finestra("Giulia").document; d.querySelector(".bp-cancella .bp-pwd").value = "prova123"; d.querySelector(".bp-cancella .btn-rosso").click(); });
    await page.waitForTimeout(1200); await page.screenshot({ path: path.join(DOVE, "app-5-cancellato.png"), clip });
  } finally { await browser.close(); lascia(); }
})().catch(e => { console.error(e); lascia(); process.exit(1); });

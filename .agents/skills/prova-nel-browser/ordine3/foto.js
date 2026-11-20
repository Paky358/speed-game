// LE FOTO DI PAROLA D'ORDINE (giro 3, 20 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\ordine3\foto.js --porta 8951 --dove C:\cartella\foto [--copione nome]
// (il server della copia acceso sulla porta). I copioni delle foto sono in fondo (COPIONI).
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1];
const BASE = "http://localhost:" + (arg.porta || 8951), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-ordine");
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
  const browser = await chromium.launch({ channel: "msedge", headless: !arg.vedi, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--disable-features=IntensiveWakeUpThrottling,CalculateNativeWinOcclusion", "--autoplay-policy=no-user-gesture-required"] });
  try {
    const ctx = await browser.newContext({ viewport: { width: 1400, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => console.log("errore pagina: " + e.message));
    page.on("console", m => { if (m.type() === "error") console.log("console: " + m.text().slice(0, 200)); });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("ordine3/scene.js");
      window.COPIONE.aiuti.pulisci();
    });
    const ev = (f, a) => page.evaluate(f, a);
    // la foto di un telefono: l'iframe a grandezza vera in alto a sinistra, sopra gli altri
    async function scatta(nome, file, L, H, prima) {
      L = L || 390; H = H || 844;
      await ev(([n, L, H]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); f.__vec = f.__vec || f.style.cssText;
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 9999;
        const w = f.contentWindow; w.dispatchEvent(new w.Event("resize"));
      }, [nome, L, H]);
      if (prima) await ev(prima, nome);
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      await ev(n => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; } }); }, nome);
      console.log("📸 " + file);
    }
    const quale = arg.copione || "oggi";
    const dorme_ = (p, ms) => p.waitForTimeout(ms);
    if (quale === "oggi") {
      await ev(() => O3.saletta(["Luca", "Ugo", "Giulia", "Sara"], { Paky: 0, Luca: 0, Ugo: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]));
      await scatta("Sara", "oggi-1-saletta-amica-390");
      await scatta("Sara", "oggi-1b-saletta-amica-360", 360, 640);
      await scatta("Paky", "oggi-2-saletta-host-390");
      // un amico appena entrato (Bea): in che squadra finisce?
      await ev(async () => { await apriTel("Bea", { hash: "gioco=ordine&stanza=" + O3.C, x: 1000 }); await dorme(1500); });
      await scatta("Bea", "oggi-3-saletta-appena-entrata-390");
      await ev(() => O3.partita(3));
      await scatta("Sara", "oggi-4-partita-chat-chiusa-390");
      await scatta("Sara", "oggi-4b-partita-chat-chiusa-360", 360, 640);
      await scatta("Sara", "oggi-5-partita-chat-aperta-390", 390, 844, n => { const w = finestra(n); w.__ORDINE.ui.log.click(); });
      await scatta("Giulia", "oggi-6-partita-capo-390");
    }
    if (quale === "prop") {   // le proposte: --v A|B|C (saletta e chat della stessa lettera)
      const V = arg.v || "A", P = "prop" + V + "-";
      await ev(v => { O3.prop = { sq: v, chat: v }; }, V);
      await ev(() => O3.saletta(["Luca", "Ugo", "Giulia", "Sara"], { Paky: 0, Luca: 0, Ugo: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]));
      await scatta("Sara", P + "1-saletta-390");
      await scatta("Sara", P + "1b-saletta-360", 360, 640);
      await scatta("Paky", P + "2-saletta-host-390");
      await ev(async () => { O3.metti(await apriTel("Bea", { hash: "gioco=ordine&stanza=" + O3.C, x: 1000 })); await dorme(1500); });
      await scatta("Bea", P + "3-saletta-appena-entrata-390");
      await ev(() => O3.partita(3));
      await scatta("Sara", P + "4-partita-390");
      await scatta("Sara", P + "4b-partita-360", 360, 640);
      await scatta("Sara", P + "5-partita-chat-aperta-390", 390, 844, n => { const u = finestra(n).__ORDINE.ui; if (u.chC) u.chC.click(); else if (u.chA) u.chA.click(); else if (u.chB) u.chB.click(); else u.log.click(); });
      // a 3 squadre, in 7, sul telefono piccolo
      await ev(() => { COPIONE.aiuti.pulisci(); });
      await ev(() => O3.saletta(["Luca", "Ugo", "Giulia", "Sara", "Dina", "Marco"], { Paky: 0, Luca: 0, Ugo: 1, Giulia: 1, Sara: 2, Dina: 2, Marco: 2 }, ["Luca", "Giulia", "Sara"], { squadre: 3 }));
      await scatta("Dina", P + "6-saletta-3sq-360", 360, 640);
      await ev(() => O3.partita(2));
      await scatta("Dina", P + "7-partita-3sq-360", 360, 640);
    }
    if (quale === "difetti") {   // la caccia ai difetti: tanti momenti, telefono piccolo (360x640) e alto (412x915)
      const V = arg.v || "oggi", P = "d" + V + "-";
      if (V !== "oggi") await ev(v => { O3.prop = { sq: v.split("")[0], chat: v.split("")[1] || v.split("")[0] }; }, V);
      const due = async (n, f) => { await scatta(n, P + f + "-360", 360, 640); await scatta(n, P + f + "-412", 412, 915); };
      await ev(() => O3.saletta(["Luca", "Ugo", "Giulia", "Sara"], { Paky: 0, Luca: 0, Ugo: 0, Giulia: 1, Sara: 1 }, ["Luca", "Giulia"]));
      if (!arg.dal) await due("Paky", "01-saletta-host");
      await ev(() => O3.partita(0));
      await due("Paky", "02-inizio");
      // si arriva al turno dei Rossi, all'indizio
      await ev(async () => { for (let g = 0; g < 3; g++) { await O3.finoIndizio(); if (O3.vm().turno === 0) return; await O3.indizio(1); await O3.gira("n"); await dorme(1500); } });
      await due("Luca", "03-capo-scrive");
      await ev(() => { const u = finestra("Luca").__ORDINE.ui, inp = u.sotto.querySelector(".or-input"); if (inp) { inp.focus(); inp.value = "QUOKKA"; inp.dispatchEvent(new (finestra("Luca").Event)("input", { bubbles: true })); } });
      await due("Luca", "04-capo-scrive-parola");
      await ev(() => O3.indizio(2));
      await dorme_(page, 2500);
      await ev(() => O3.segna("mia"));
      await dorme_(page, 1200);
      await due("Paky", "05-indovino-segnata");
      await due("Giulia", "06-capo-avversario");
      // Bea arriva tardi, Dina guarda col link
      await ev(async () => { O3.metti(await apriTel("Bea", { hash: "gioco=ordine&stanza=" + O3.C, x: 1000 })); await dorme(3500); });
      await due("Bea", "07-arriva-tardi");
      await ev(async () => { O3.metti(await apriTel("Dina", { hash: "gioco=ordine&stanza=" + O3.C + "&guarda=1", x: 1200 })); await dorme(3500); });
      await due("Dina", "08-guarda");
      await ev(() => O3.gira("mia"));
      await dorme_(page, 2500);
      await due("Paky", "09-dopo-giusta");
      // Luca, il capo, esce apposta
      await ev(async () => { const L = finestra("Luca"); L.document.querySelector(".st-esci").click(); await dorme(800); const b = L.document.querySelector(".conferma-sfondo .btn-rosso"); if (b) b.click(); await dorme(4000); });
      await due("Ugo", "10-capo-uscito");
      await due("Giulia", "11-capo-uscito-avversari");
      await ev(async () => { await O3.gira("n"); await dorme(1500); await O3.finoIndizio(); if (O3.vm().turno !== 0) { await O3.indizio(1); await O3.gira("n"); await dorme(1500); await O3.finoIndizio(); } });
      await due("Ugo", "11b-capo-uscito-tocca-a-noi");
      await ev(async () => { O3.manda("Ugo", { t: "capo" }); await dorme(2500); });
      await due("Ugo", "12-nuovo-capo");
      // fine: la squadra di turno gira la nera
      await ev(async () => { await O3.indizio(1); await O3.gira("x"); await dorme(6000); });
      await due("Paky", "13-fine-host");
      await due("Giulia", "14-fine-vince");
      await due("Dina", "15-fine-guarda");
    }
    if (arg.fine) await page.waitForTimeout(+arg.fine);
  } finally { await browser.close(); }
})().catch(e => { console.log("ERRORE " + (e && e.stack || e)); process.exit(1); });

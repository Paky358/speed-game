// LE FOTO DEL BLACK JACK (caccia ai difetti, 22 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\bj-tavolo\foto.js --porta 8940 --dove D:\SG-bj-prove\difetti\prima
//      [--copione online|gara|locale] [--n 4] [--pre prefisso] [--esperti 1] [--solo 360|412]
// (il server della copia acceso sulla porta). Ogni foto su due telefoni: basso 360x640 e alto 412x915. Scrive anche diario.txt.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8940), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario.txt");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-blackjack");
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
    const ctx = await browser.newContext({ viewport: { width: 1900, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => scriviD("❗ errore pagina: " + e.message));
    page.on("console", m => { if (m.type() === "error" && !/vibrate|favicon|404/.test(m.text())) scriviD("❗ console: " + m.text().slice(0, 200)); });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/blackjack.js");
      await window.COPIONE.carica("bj-tavolo/scene.js");
      window.COPIONE.aiuti.pulisci();
    });
    const ev = (f, a) => page.evaluate(f, a);
    const dorme = ms => page.waitForTimeout(ms);
    const quale = arg.copione || "online", N = +(arg.n || 4);
    const PRE = arg.pre || quale + (quale === "locale" ? "" : N) + "-";
    let nf = 0;
    async function scatta(nome, file, L, H) {
      await ev(([n, L, H]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); if (!f) return;
        f.__vec = f.__vec || f.style.cssText;
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 9999;
        const w = f.contentWindow; w.dispatchEvent(new w.Event("resize"));
      }, [nome, L, H]);
      await dorme(700);
      const ok = await ev(n => !!document.getElementById("tel-" + n), nome);
      if (ok) await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      const info = await ev(n => {
        const w = window.finestra(n); if (!w) return "(niente)";
        const d = w.document, tx = (d.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 220);
        // cose tagliate: testi che escono dal loro riquadro o dallo schermo
        const fuori = [];
        d.querySelectorAll(".bj-wrap button, .bj-wrap .bj-hero *, .bjr-nome, .bjr-matt-nome, .bj-evento, .bjr-fum").forEach(e => {
          if (!e.offsetParent || !e.childElementCount && !e.textContent.trim()) return;
          const r = e.getBoundingClientRect();
          if (r.right > w.innerWidth + 1 || r.left < -1 || r.bottom > w.innerHeight + 1) fuori.push((e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
          else if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== "visible") fuori.push("tagliato " + (e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
        });
        const sc = d.scrollingElement && d.scrollingElement.scrollHeight > w.innerHeight + 2 ? " · ⚠️ SCORRE (" + d.scrollingElement.scrollHeight + ")" : "";
        const num = (tx.match(/\b\d{4,}\b/g) || []).filter(x => !/^20\d\d$/.test(x));
        return tx + sc + (fuori.length ? " · ⚠️ FUORI: " + fuori.slice(0, 6).join(" | ") : "") + (num.length ? " · ⚠️ NUMERI SENZA PUNTO: " + num.join(",") : "");
      }, nome);
      await ev(() => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; } }); });
      scriviD("📸 " + file + " · " + nome + " · " + info);
    }
    async function due(n, f) {
      const k = String(++nf).padStart(2, "0");
      if (arg.solo !== "412") await scatta(n, PRE + k + "-" + f + "-360", 360, 640);
      if (arg.solo !== "360") await scatta(n, PRE + k + "-" + f + "-412", 412, 915);
    }
    // aspetta un momento della mano (fase, e chi gioca)
    const fino = async (cond, ms) => { const t = Date.now() + (ms || 30000); while (Date.now() < t) { if (await ev(cond)) return true; await dorme(150); } return false; };
    const passi = async (cond, ms) => { const t = Date.now() + (ms || 60000); while (Date.now() < t) { const v = await ev(() => { const v = BJT.vm(); return { fase: v.fase, turno: v.turno, g: (v.giocatori || []).map(g => g.nome) }; }); if (await ev(cond)) return true; if (v.fase === "punta") await ev(() => BJT.punta()); else if (v.fase === "assic" || v.fase === "gioca") await ev(() => BJT.turno()); await dorme(200); } return false; };
    fs.writeFileSync(DIARIO, "Copione " + quale + " in " + N + " · " + new Date().toISOString() + "\n");
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia"].slice(0, N - 1);
    if (quale === "online" || quale === "gara") {
      const imp = quale === "gara" ? { uguali: true, quota: 1000, mani: 6 } : { mani: 0 };
      if (arg.esperti) Object.assign(imp, { t213: true, royal: true, buster: true, charlie: true });
      // la prima mano truccata: Giulia ha due 8 (si divide), Paky 10+6
      const mazzo = ["10♠", "8♣", "9♦", "5♥", "6♠", "8♦", "7♣", "K♥", "Q♣"].slice(0, 0);
      await ev(([a, i, m]) => BJT.apri(a, i, { monete: 25000, mazzo: m }), [AMICI, imp, mazzo]);
      await due("Paky", "saletta-host"); await due(AMICI[0], "saletta-amico");
      await ev(() => BJT.comincia());
      await dorme(2500);
      await due("Paky", "punta-host"); await due(AMICI[0], "punta-amico");
      // puntano tutti tranne Paky: la foto di chi aspetta
      await ev(() => BJT.punta(["Paky"]));
      await dorme(800);
      await due(AMICI[0], "punta-ha-puntato");
      await ev(() => BJT.punta());
      // fino al turno di Paky (zoom su chi gioca), foto
      await passi(() => { const v = BJT.vm(); return v.fase === "gioca" && (v.giocatori[v.turno] || {}).nome === "Paky"; });
      await dorme(1500);
      await due("Paky", "gioca-tocca-a-te"); await due(AMICI[0], "gioca-guarda-paky");
      if (AMICI[1]) { await ev(() => BJT.tardi("Bea")); await due("Bea", "arriva-tardi"); await ev(() => BJT.guarda("Dina")); await due("Dina", "guarda-col-link"); }
      await passi(() => { const v = BJT.vm(); return v.fase === "banco"; });
      await dorme(1200);
      await due(AMICI[0], "banco-gioca");
      await passi(() => BJT.vm().fase === "esito");
      await dorme(1500);
      await due("Paky", "esito-host"); await due(AMICI[0], "esito-amico");
      if (AMICI[1]) await due("Bea", "esito-arrivata-tardi");
      // seconda mano
      await ev(() => BJT.nuova());
      await dorme(1500);
      if (AMICI[1]) await due("Bea", "mano2-entra");
      await passi(() => { const v = BJT.vm(); return v.fase === "gioca" && v.turno > 0; });
      await dorme(1500);
      await due(AMICI[0], "mano2-gioca");
      await passi(() => BJT.vm().fase === "esito");
      await dorme(1200);
      await due("Paky", "mano2-esito");
      if (quale === "gara") {
        for (let k = 0; k < 6; k++) { const v = await ev(() => BJT.vm().fase); if (v === "fine") break; await ev(() => BJT.nuova()); await passi(() => { const f = BJT.vm().fase; return f === "esito" || f === "fine" || f === "svela"; }); const f = await ev(() => BJT.vm().fase); if (f === "svela" || (await ev(() => !!BJT.vm().segreta))) { await due(AMICI[0], "gara-ultima-segreta"); } await passi(() => { const f = BJT.vm().fase; return f === "esito" || f === "fine"; }); }
        await dorme(1500);
        await due("Paky", "gara-fine"); await due(AMICI[0], "gara-fine-amico");
      } else {
        await ev(() => BJT.basta());
        await dorme(2000);
        await due("Paky", "fine-host"); await due(AMICI[0], "fine-amico");
      }
    } else if (quale === "locale") {
      await ev(() => BJT.locale([], {}));
      await due("Paky", "locale-inizio");
      for (let k = 0; k < 40; k++) { const p = await ev(() => BJT.passoLocale()); if (k === 3) await due("Paky", "locale-punta"); if (p === "carta" || p === "stai") { await due("Paky", "locale-gioca-" + k); break; } await dorme(600); }
      for (let k = 0; k < 60; k++) { const t = await ev(() => (window.finestra("Paky").document.querySelector(".bj-hero") || {}).innerText || ""); if (/Nuova mano/.test(t)) break; await ev(() => BJT.passoLocale()); await dorme(500); }
      await dorme(1200);
      await due("Paky", "locale-esito");
    }
    scriviD("✅ fine");
  } catch (e) { scriviD("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

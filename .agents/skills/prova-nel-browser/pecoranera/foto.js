// LE FOTO DI «🐑 PECORA NERA» (26 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\pecoranera\foto.js --porta 8990 --dove D:\SG-holy-sheep-prove\foto --n 6
//      [--pre prefisso] [--solo 360|412] [--giri 3]
// (il server della copia acceso sulla porta). Partita online in N dalla stanza con le domande vere; alla 2ª domanda arriva Tom
// (tardi) e Dina guarda col link. Ogni foto su due telefoni: basso 360x640 e alto 412x915 (più 360x340 con la tastiera aperta).
// Scrive diario-N.txt con le cose che escono dallo schermo, la pagina che scorre, i numeri senza il punto e le risposte che
// finiscono nella foto della partita mentre si scrive (spoiler).
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8990), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario-" + (arg.n || 6) + ".txt");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-pecoranera");
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
    const ctx = await browser.newContext({ viewport: { width: 1900, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => scriviD("❗ errore pagina: " + e.message));
    page.on("console", m => { if (m.type() === "error" && !/vibrate|favicon|404/.test(m.text())) scriviD("❗ console: " + m.text().slice(0, 200)); });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/pecoranera.js");
      window.COPIONE.aiuti.pulisci();
    });
    const ev = (f, a) => page.evaluate(f, a);
    const dorme = ms => page.waitForTimeout(ms);
    const N = +(arg.n || 6), GIRI = +(arg.giri || 3), PRE = arg.pre || "n" + N + "-";
    let nf = 0;
    async function scatta(nome, file, L, H, tastiera) {
      await ev(([n, L, H, tk]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); if (!f) return;
        f.__vec = f.__vec || f.style.cssText;
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 9999;
        const w = f.contentWindow;
        if (tk) { const c = w.document.querySelector(".pn-input"); if (c && c.offsetParent) c.focus(); w.document.documentElement.classList.add("tastiera"); }
        w.dispatchEvent(new w.Event("resize"));
      }, [nome, L, H, !!tastiera]);
      await dorme(700);
      const ok = await ev(n => !!document.getElementById("tel-" + n), nome);
      if (ok) await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      const info = await ev(n => {
        const w = window.finestra(n); if (!w) return "(niente)";
        const d = w.document, tx = (d.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 240);
        const fuori = [];
        d.querySelectorAll(".pn-scena button, .pn-info, .pn-chip, .pn-domanda, .pn-g, .pn-gt, .pn-gn, .pn-gp, .pn-tit, .pn-stato, .pn-tempo, .pn-aspetta, .pn-pari, .pn-muti, .pn-input, .classifica li, .fine-tasti button, .sl-targa").forEach(e => {
          if (!e.offsetParent || !e.childElementCount && !e.textContent.trim() && !/input/.test(e.className)) return;
          const r = e.getBoundingClientRect();
          if (r.width && (r.right > w.innerWidth + 1 || r.left < -1 || r.bottom > w.innerHeight + 1 || r.top < -1)) fuori.push((e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
          else if ((e.scrollWidth > e.clientWidth + 2 || e.scrollHeight > e.clientHeight + 2) && /pn-gt|pn-gn|pn-chip-nm|pn-info|pn-g$/.test(e.className)) fuori.push("tagliato " + e.className + "«" + e.textContent.trim().slice(0, 24) + "»");
        });
        const scL = [].filter.call(d.querySelectorAll(".schermata, .schermata .contenuto, .pn-scena, .pn-corpo"), c => c.offsetParent && c.scrollHeight > c.clientHeight + 2).map(c => c.className.split(" ").slice(0, 2).join(".") + "+" + (c.scrollHeight - c.clientHeight));
        if (d.scrollingElement && d.scrollingElement.scrollHeight > w.innerHeight + 2) scL.push("pagina+" + (d.scrollingElement.scrollHeight - w.innerHeight));
        const sc = scL.length ? " · ⚠️ SCORRE " + scL.join(",") : "";
        const num = (tx.match(/\b\d{4,}\b/g) || []).filter(x => !/^20\d\d$/.test(x));
        return tx + sc + (fuori.length ? " · ⚠️ FUORI: " + fuori.slice(0, 6).join(" | ") : "") + (num.length ? " · ⚠️ NUMERI SENZA PUNTO: " + num.join(",") : "");
      }, nome);
      await ev(() => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; const w = f.contentWindow; if (w) { w.document.documentElement.classList.remove("tastiera"); const c = w.document.querySelector(".pn-input"); if (c) c.blur(); w.dispatchEvent(new w.Event("resize")); } } }); });
      await dorme(250);
      scriviD("📸 " + file + " · " + nome + " · " + info);
    }
    async function due(n, f, tk) {
      if (!n) return;
      const k = String(++nf).padStart(2, "0");
      if (arg.solo !== "412") await scatta(n, PRE + k + "-" + f + "-360", 360, 640);
      if (arg.solo !== "360") await scatta(n, PRE + k + "-" + f + "-412", 412, 915);
      if (tk && arg.solo !== "412") await scatta(n, PRE + k + "-" + f + "-tastiera", 360, 340, true);
    }
    fs.writeFileSync(DIARIO, "Pecora Nera in " + N + " · " + new Date().toISOString() + "\n");
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia"].slice(0, N - 1), NOMI = ["Paky"].concat(AMICI);
    const vm = () => ev(() => COPIONE.aiuti.vm(window.__C) || {});
    const finoA = async (cond, ms) => { const t = Date.now() + (ms || 60000); while (Date.now() < t) { const v = await vm(); if (cond(v)) return v; await dorme(150); } return null; };
    await ev(a => (async () => { const Z = await PN.stanza(a, { fermo: true, prova: { tempo: 90, durata: "corta", domande: null } }); window.__C = Z.C; })(), AMICI);
    await dorme(1200);
    await due("Paky", "saletta-host");
    await due(AMICI[0], "saletta-amico");
    await ev(() => window.clicca(window.finestra("Paky"), /Comincia/));
    // le risposte: gruppi di misure diverse e qualcuno da solo
    const PAROLE = ["latte", "Coca-Cola", "sabato", "fragola", "pizza", "mare", "rosso", "cane"];
    // lo spoiler: le risposte nella foto della partita mentre si scrive
    await ev(() => { window.__spoiler = []; window.__spia = setInterval(() => { const v = COPIONE.aiuti.vm(window.__C); if (v && v.passo === "scrivi" && /"(t|testo|risp)":/.test(JSON.stringify({ g: v.gruppi, u: v.unioni }))) window.__spoiler.push(v.n); }, 100); });
    let tardi = false, chi = NOMI.slice();
    for (let giro = 1; giro <= GIRI; giro++) {
      let v = await finoA(v => v.fase === "gioco" && v.passo === "scrivi" && v.n === giro, 30000);
      if (!v) { const vv = await vm(); scriviD("❗ niente domanda " + giro + " (fase " + vv.fase + ")"); break; }
      await dorme(600);
      if (giro === 1) {
        await due("Paky", "d1-scrivi-vuoto");
        await ev(() => { const w = window.finestra("Giulia"), c = w.document.querySelector(".pn-input"); c.value = "il tè freddo alla pesca"; c.dispatchEvent(new w.Event("input", { bubbles: true })); });
        await dorme(300);
        await due("Giulia", "d1-scrive", true);
      }
      if (giro === 2 && !tardi) {
        tardi = true;
        const c = await ev(() => window.__C);
        await ev(([c, p]) => window.apriTel("Tom", { hash: "gioco=pecoranera&stanza=" + c, x: 1500, prima: PN.prima(p) }), [c, { tempo: 90, durata: "corta", domande: null }]);
        await ev(([c, p]) => window.apriTel("Dina", { hash: "gioco=pecoranera&stanza=" + c + "&guarda=1", x: 1650, prima: PN.prima(p) }), [c, { tempo: 90, durata: "corta", domande: null }]);
        await dorme(5000);
        await due("Tom", "d2-arriva-tardi");
        await due("Dina", "d2-guarda-col-link");
      }
      if (giro === 3 && tardi) chi = NOMI.concat(["Tom"]);
      const k = Math.max(2, Math.ceil(chi.length / 2.5));
      const risp = chi.map((n, i) => i < chi.length - 1 ? PAROLE[(i * 3 + giro) % k] : "boh " + giro);
      for (let i = 0; i < chi.length - 1; i++) await ev(([n, r]) => PN.scrivi(window.finestra(n), r), [chi[i], risp[i]]);
      await dorme(900);
      await due("Paky", "d" + giro + "-hanno-scritto");
      await ev(([n, r]) => PN.scrivi(window.finestra(n), r), [chi[chi.length - 1], risp[chi.length - 1]]);
      v = await finoA(v => v.passo === "rivela", 20000);
      if (!v) { scriviD("❗ niente rivelazione"); break; }
      await dorme(1500 + 1150 * 1.5);
      await due("Paky", "d" + giro + "-rivela");
      v = await finoA(v => v.passo === "gruppi", 30000);
      await dorme(700);
      await due("Paky", "d" + giro + "-gruppi-host");
      await due(AMICI[0], "d" + giro + "-gruppi-amico");
      // un'unione: Giulia tocca le due carte di chi è da solo (se ci sono)
      const unito = await ev(() => { const w = window.finestra("Giulia"), c = [].filter.call(w.document.querySelectorAll(".pn-g.solo"), x => x.offsetParent); if (c.length < 2) return false; c[0].click(); c[1].click(); return true; });
      if (unito) { await dorme(1200); await due("Luca", "d" + giro + "-unite-da-giulia"); }
      if (giro === 2) await due("Dina", "d2-guarda-gruppi");
      if (giro === 2) await due("Tom", "d2-tardi-gruppi");
      await ev(() => { const b = window.finestra("Paky").document.querySelector(".pn-vai"); if (b) b.click(); });
      await dorme(1200);
      if (giro === 1) await due("Paky", "d2-punti-appena-presi");
    }
    // il resto della partita senza foto (tutti uguali tranne l'ultimo: si arriva presto al traguardo)
    for (let g = 0; g < 30; g++) {
      const v = await vm(); if (v.fase === "fine") break;
      if (v.passo === "scrivi") { for (let i = 0; i < chi.length; i++) await ev(([n, r]) => PN.scrivi(window.finestra(n), r), [chi[i], i === chi.length - 1 ? "solo" + g : i % 2 ? "pari" + v.n : "dispari" + v.n]); await finoA(v2 => v2.passo !== "scrivi", 20000); }
      else if (v.passo === "gruppi") { await ev(() => { const b = window.finestra("Paky").document.querySelector(".pn-vai"); if (b) b.click(); }); await dorme(800); }
      else await dorme(400);
    }
    await finoA(v => v.fase === "fine", 30000);
    await dorme(2500);
    await due("Paky", "fine-host");
    await due(AMICI[0], "fine-amico");
    await due("Tom", "fine-tardi");
    await due("Dina", "fine-guarda");
    const sp = await ev(() => { clearInterval(window.__spia); return window.__spoiler.length; });
    scriviD(sp ? "⚠️ RISPOSTE NELLA FOTO MENTRE SI SCRIVE: " + sp : "✅ nessuna risposta nella foto mentre si scrive");
    scriviD("✅ fine");
  } catch (e) { scriviD("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

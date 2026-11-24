// LE FOTO DI «😂 MEMATA» (caccia ai difetti, 24 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\memata\foto.js --porta 8983 --dove D:\SG-memata-prove\prima --n 4
//      [--pre prefisso] [--solo 360|412] [--giri 2]
// (il server della copia acceso sulla porta). Partita online in N dalla stanza; al round 2 arriva Tom (tardi) e Dina guarda col link.
// Ogni foto su due telefoni: basso 360x640 e alto 412x915 (più 360x340 con la tastiera aperta). Scrive diario.txt con le cose
// che escono dallo schermo, la pagina che scorre, i numeri senza il punto e chi ha scritto il meme nella foto della partita prima del tempo.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8983), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario-" + (arg.n || 4) + ".txt");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-memata");
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
      await window.COPIONE.carica("preferiti/memata.js");
      window.COPIONE.aiuti.pulisci();
    });
    const ev = (f, a) => page.evaluate(f, a);
    const dorme = ms => page.waitForTimeout(ms);
    const N = +(arg.n || 4), GIRI = +(arg.giri || 2), PRE = arg.pre || "n" + N + "-";
    let nf = 0;
    async function scatta(nome, file, L, H, tastiera) {
      await ev(([n, L, H, tk]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); if (!f) return;
        f.__vec = f.__vec || f.style.cssText;
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 9999;
        const w = f.contentWindow;
        if (tk) { const c = w.document.querySelector(".me-campo"); if (c && c.offsetParent) c.focus(); w.document.documentElement.classList.add("tastiera"); }
        w.dispatchEvent(new w.Event("resize"));
      }, [nome, L, H, !!tastiera]);
      await dorme(700);
      const ok = await ev(n => !!document.getElementById("tel-" + n), nome);
      if (ok) await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      const info = await ev(n => {
        const w = window.finestra(n); if (!w) return "(niente)";
        const d = w.document, tx = (d.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 260);
        const fuori = [];
        d.querySelectorAll(".me-scena button, .me-titolo, .me-nota, .me-giro, .me-tempo, .me-quadro, .me-rivchi, .me-vchip, .me-pchip, .me-aspetta, .me-chiaro, .me-conto, .classifica li, .me-serata-tit span, .fine-tasti button, .sl-targa, .me-cred").forEach(e => {
          if (!e.offsetParent || !e.childElementCount && !e.textContent.trim() && !/quadro/.test(e.className)) return;
          const r = e.getBoundingClientRect();
          if (r.width && (r.right > w.innerWidth + 1 || r.left < -1 || r.bottom > w.innerHeight + 1 || r.top < -1)) fuori.push((e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
          else if (e.scrollWidth > e.clientWidth + 2 && /hidden|clip|auto|scroll/.test(getComputedStyle(e).overflow + getComputedStyle(e).textOverflow)) fuori.push("tagliato " + (e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 24) + "»");
        });
        const q = d.querySelector(".me-quadro"), qa = q && q.offsetParent ? Math.round(q.getBoundingClientRect().height) + "px" : "-";
        const im = d.querySelector(".me-img"), imOk = im && im.offsetParent ? (im.complete && im.naturalWidth ? "img ok" : "⚠️ img NON arrivata") : "";
        const scL = [].filter.call(d.querySelectorAll(".schermata, .schermata .contenuto, .me-scena"), c => c.offsetParent && c.scrollHeight > c.clientHeight + 2).map(c => { const cr = c.getBoundingClientRect(); let peggio = null, pb = 0; [].forEach.call(c.querySelectorAll("*"), e => { if (!e.offsetParent && getComputedStyle(e).position !== "fixed") return; const r = e.getBoundingClientRect(), mb = parseFloat(getComputedStyle(e).marginBottom) || 0; if (r.height && r.bottom + mb > pb) { pb = r.bottom + mb; peggio = (e.className || e.tagName) + "@" + Math.round(r.bottom - cr.bottom) + "/" + mb; } }); return c.className.split(" ").slice(0,2).join(".") + "+" + (c.scrollHeight - c.clientHeight) + "(" + peggio + ")"; });
        if (d.scrollingElement && d.scrollingElement.scrollHeight > w.innerHeight + 2) scL.push("pagina+" + (d.scrollingElement.scrollHeight - w.innerHeight));
        const sc = scL.length ? " · ⚠️ SCORRE " + scL.join(",") : "";
        const num = (tx.match(/\b\d{4,}\b/g) || []).filter(x => !/^20\d\d$/.test(x));
        return "[meme " + qa + " " + imOk + "] " + tx + sc + (fuori.length ? " · ⚠️ FUORI: " + fuori.slice(0, 6).join(" | ") : "") + (num.length ? " · ⚠️ NUMERI SENZA PUNTO: " + num.join(",") : "");
      }, nome);
      // lo spoiler: chi ha scritto il meme che si vota, nella foto della partita
      const spoiler = await ev(() => { const v = window.__C ? COPIONE.aiuti.vm(window.__C) : null; if (!v || v.stato !== "vota" || !v.voto) return ""; const s = JSON.stringify(v.voto); return /"id"|"nome"|autore/.test(s) ? " · ⚠️ AUTORE NELLA FOTO" : ""; });
      await ev(() => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; const w = f.contentWindow; if (w) { w.document.documentElement.classList.remove("tastiera"); const c = w.document.querySelector(".me-campo"); if (c) c.blur(); w.dispatchEvent(new w.Event("resize")); } } }); });
      await dorme(250);
      scriviD("📸 " + file + " · " + nome + " · " + info + spoiler);
    }
    async function due(n, f, tk) {
      if (!n) return;
      const k = String(++nf).padStart(2, "0");
      if (arg.solo !== "412") await scatta(n, PRE + k + "-" + f + "-360", 360, 640);
      if (arg.solo !== "360") await scatta(n, PRE + k + "-" + f + "-412", 412, 915);
      if (tk && arg.solo !== "412") await scatta(n, PRE + k + "-" + f + "-tastiera", 360, 340, true);
    }
    fs.writeFileSync(DIARIO, "Memata in " + N + " · " + new Date().toISOString() + "\n");
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia"].slice(0, N - 1), NOMI = ["Paky"].concat(AMICI);
    const vm = () => ev(() => COPIONE.aiuti.vm(window.__C) || {});
    const nomeId = id => ev(id => { const p = (COPIONE.aiuti.vm(window.__C).players || []).filter(x => x.id === id)[0]; return p ? p.nome : null; }, id);
    const finoA = async (cond, ms) => { const t = Date.now() + (ms || 60000); while (Date.now() < t) { const v = await vm(); if (cond(v)) return v; await dorme(200); } return null; };
    await ev(([a, g]) => (async () => { const Z = await MM.stanza(a, { fermo: true, imp: { tempo: 90, giri: g, cambi: 3 } }); window.__C = Z.C; })(), [AMICI, GIRI]);
    await dorme(1200);
    await due("Paky", "saletta-host");
    await due(AMICI[0], "saletta-amico");
    await ev(() => window.clicca(window.finestra("Paky"), /Comincia/));
    let tardi = false;
    for (let giro = 1; giro <= GIRI; giro++) {
      let v = await finoA(v => v.fase === "gioco" && v.stato === "scrivi" && v.giro === giro, 30000);
      if (!v) { scriviD("❗ niente round " + giro); break; }
      await dorme(3500);   // il meme arriva da imgflip
      if (giro === 1) {
        await due("Paky", "r1-scrivi-vuoto");
        // Giulia scrive un testo lungo nel primo riquadro e lascia il campo aperto (la tastiera)
        await ev(() => { const w = window.finestra("Giulia"), c = w.document.querySelector(".me-campo"); c.value = "quando il prof dice che la verifica è facile e poi"; c.dispatchEvent(new w.Event("input", { bubbles: true })); });
        await dorme(500);
        await due("Giulia", "r1-scrive-testo-lungo", true);
      }
      if (giro === 2 && !tardi) {
        tardi = true;
        await ev(c => window.apriTel("Tom", { hash: "gioco=memata&stanza=" + c, x: 1500 }), await ev(() => window.__C));
        await ev(c => window.apriTel("Dina", { hash: "gioco=memata&stanza=" + c + "&guarda=1", x: 1650 }), await ev(() => window.__C));
        await dorme(5000);
        await due("Tom", "r2-arriva-tardi");
        await due("Dina", "r2-guarda-col-link");
      }
      // tutti scrivono tranne l'ultimo, foto di chi ha consegnato, poi l'ultimo
      for (let i = 0; i < NOMI.length - 1; i++) await ev(([n, g]) => MM.scrivi(window.finestra(n), g === 1 && n === "Luca" ? ["😂", "io dopo 5 minuti di palestra che penso di essere un atleta olimpico"] : null, true), [NOMI[i], giro]);
      await dorme(900);
      await due("Paky", "r" + giro + "-consegnato");
      await ev(n => MM.scrivi(window.finestra(n), null, true), NOMI[NOMI.length - 1]);
      v = await finoA(v => v.stato === "vota", 20000);
      if (!v) { scriviD("❗ niente voto"); break; }
      await dorme(1500);
      // chi vede «è il tuo»
      const mio = await ev(nomi => nomi.filter(n => { const w = window.finestra(n); return w && /È il tuo/.test(w.document.body.innerText); })[0] || null, NOMI);
      await due(NOMI.filter(n => n !== mio)[0], "r" + giro + "-vota");
      if (mio) await due(mio, "r" + giro + "-vota-autore");
      if (giro === 2) await due("Dina", "r2-guarda-vota");
      if (giro === 2) await due("Tom", "r2-tardi-vota");
      // tutti votano fino alla rivelazione
      let visti = {};
      for (let k = 0; k < 400; k++) {
        v = await vm();
        if (v.stato === "rivela") break;
        if (v.stato === "vota" && v.voto) await ev(([nomi, kk]) => nomi.forEach((n, i) => MM.vota(window.finestra(n), (i + kk) % 3 === 0 ? 1 : 2)), [NOMI.concat(giro > 1 ? ["Tom"] : []), v.voto.k]);
        await dorme(300);
      }
      await finoA(v => v.stato === "rivela" && v.riv && v.riv.passo === 0, 10000);
      await dorme(400); await due("Paky", "r" + giro + "-rivela-rullo");
      await finoA(v => v.stato === "rivela" && v.riv && v.riv.passo === 1, 10000);
      await dorme(500); await due("Paky", "r" + giro + "-rivela-chi");
      await finoA(v => v.stato === "rivela" && v.riv && v.riv.finito, 40000);
      await dorme(900);
      await due("Paky", "r" + giro + "-fine-round-host");
      await due(AMICI[0], "r" + giro + "-fine-round-amico");
      if (giro === 2) await due("Dina", "r2-guarda-fine-round");
      await ev(() => { const b = window.finestra("Paky").document.querySelector(".me-vai"); if (b) b.click(); });
    }
    await finoA(v => v.fase === "fine", 30000);
    await dorme(2500);
    await due("Paky", "fine-host");
    await due(AMICI[0], "fine-amico");
    await due("Tom", "fine-tardi");
    await due("Dina", "fine-guarda");
    scriviD("✅ fine");
  } catch (e) { scriviD("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

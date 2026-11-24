// LE FOTO DI «✏️ SCARABOCCHIO» (caccia ai difetti, 24 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\scarabocchio-foto\foto.js --porta 8991 --dove D:\SG-scarabocchio-prove\prima --n 4
//      [--pre prefisso] [--solo 360|412] [--secondi 30]
// (il server della copia acceso sulla porta). Partita online in N (1 giro); al 2° turno arriva Tom (tardi) e Dina guarda col link.
// Ogni foto su due telefoni: basso 360x640 e alto 412x915 (più 360x340 con la tastiera aperta). Scrive diario-N.txt con le cose
// che escono dallo schermo, la lavagna coperta, la pagina che scorre, i numeri senza il punto e la parola nella foto della partita.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8991), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario-" + (arg.n || 4) + ".txt");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-scarabocchio");
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
      await window.COPIONE.carica("migliora/scarabocchio-ncc.js");
      window.COPIONE.aiuti.pulisci();
    });
    const ev = (f, a) => page.evaluate(f, a);
    const dorme = ms => page.waitForTimeout(ms);
    const N = +(arg.n || 4), PRE = arg.pre || "n" + N + "-", SEC = +(arg.secondi || 30);
    let nf = 0;
    async function scatta(nome, file, L, H, tastiera) {
      await ev(([n, L, H, tk]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); if (!f) return;
        f.__vec = f.__vec || f.style.cssText;
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 9999;
        const w = f.contentWindow;
        if (tk) { const c = w.document.querySelector(".sb-inp"); if (c && c.offsetParent) c.focus(); w.document.documentElement.classList.add("tastiera"); }
        w.dispatchEvent(new w.Event("resize"));
      }, [nome, L, H, !!tastiera]);
      await dorme(700);
      const ok = await ev(n => !!document.getElementById("tel-" + n), nome);
      if (ok) await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      const info = await ev(n => {
        const w = window.finestra(n); if (!w) return "(niente)";
        const d = w.document, tx = (d.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 240);
        const fuori = [];
        const cv = d.querySelector(".sb-cv"), cr = cv && cv.offsetParent ? cv.getBoundingClientRect() : null;
        d.querySelectorAll(".sb-scena button, .sb-scena input, .sb-centro, .sb-giro, .sb-tempo, .sb-sopra, .sb-gente, .sb-basso, .sb-chat, .classifica li, .fine-tasti button, .sl-targa, .sb-scelte button").forEach(e => {
          if (!e.offsetParent) return;
          const r = e.getBoundingClientRect();
          if (!r.width) return;
          if (r.right > w.innerWidth + 1 || r.left < -1 || r.bottom > w.innerHeight + 1 || r.top < -1) fuori.push((e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
          else if (e.scrollWidth > e.clientWidth + 2 && /hidden|clip/.test(getComputedStyle(e).overflow + getComputedStyle(e).textOverflow)) fuori.push("tagliato " + (e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 24) + "»");
        });
        // cose che coprono la lavagna (tranne quelle che ci stanno sopra apposta)
        const copre = [];
        if (cr) d.querySelectorAll(".sb-strumenti, .sb-gente, .sb-chat, .sb-scrivi, .sb-basso, .sl-targa, .sb-barra").forEach(e => {
          if (!e.offsetParent) return; const r = e.getBoundingClientRect();
          const ix = Math.min(r.right, cr.right) - Math.max(r.left, cr.left), iy = Math.min(r.bottom, cr.bottom) - Math.max(r.top, cr.top);
          if (ix > 4 && iy > 4) copre.push(e.className.split(" ")[0] + " " + Math.round(iy) + "px");
        });
        const scL = [].filter.call(d.querySelectorAll(".schermata, .schermata .contenuto, .sb-scena"), c => c.offsetParent && c.scrollHeight > c.clientHeight + 2).map(c => c.className.split(" ").slice(0, 2).join(".") + "+" + (c.scrollHeight - c.clientHeight));
        if (d.scrollingElement && d.scrollingElement.scrollHeight > w.innerHeight + 2) scL.push("pagina+" + (d.scrollingElement.scrollHeight - w.innerHeight));
        const num = (tx.match(/\b\d{4,}\b/g) || []).filter(x => !/^20\d\d$/.test(x));
        return "[lavagna " + (cr ? Math.round(cr.width) + "x" + Math.round(cr.height) : "-") + "] " + tx + (scL.length ? " · ⚠️ SCORRE " + scL.join(",") : "") + (copre.length ? " · ⚠️ COPRE LA LAVAGNA: " + copre.join(", ") : "") + (fuori.length ? " · ⚠️ FUORI: " + fuori.slice(0, 6).join(" | ") : "") + (num.length ? " · ⚠️ NUMERI SENZA PUNTO: " + num.join(",") : "");
      }, nome);
      await ev(() => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; const w = f.contentWindow; if (w) { w.document.documentElement.classList.remove("tastiera"); const c = w.document.querySelector(".sb-inp"); if (c) c.blur(); w.dispatchEvent(new w.Event("resize")); } } }); });
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
    fs.writeFileSync(DIARIO, "Scarabocchio in " + N + " · " + new Date().toISOString() + "\n");
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia"].slice(0, N - 1), NOMI = ["Paky"].concat(AMICI);
    const vm = () => ev(() => COPIONE.aiuti.vm(window.__C) || {});
    const finoA = async (cond, ms) => { const t = Date.now() + (ms || 60000); while (Date.now() < t) { const v = await vm(); if (cond(v)) return v; await dorme(200); } return null; };
    const nomeDi = id => ev(id => { if (id === "host") return "Paky"; const nn = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia", "Tom"]; for (const n of nn) if (COPIONE.aiuti.mioId(n) === id) return n; return null; }, id);
    // la stanza, con le regole della prova
    await ev(([a, sec]) => (async () => {
      const W = window, A = COPIONE.aiuti;
      const P = await W.apriTel("Paky", { x: 0, fintiM: true, prima: w => { w.__imp = { giri: 1, secondi: sec }; } });
      const C = await W.apriStanza(P, "Scarabocchio");
      for (let i = 0; i < a.length; i++) { await W.apriTel(a[i], { hash: "gioco=scarabocchio&stanza=" + C, x: 160 * (i + 1), fintiM: true }); const n = a[i]; await W.aspetta(() => (A.vm(C).players || []).some(p => p.nome === n), 8000); }
      window.__C = C;
    })(), [AMICI, SEC]);
    await dorme(1200);
    await due("Paky", "saletta-host");
    await due(AMICI[0], "saletta-amico");
    await ev(() => window.clicca(window.finestra("Paky"), /Comincia/));
    const indovina = (n, x) => ev(([n, x]) => { const w = window.finestra(n); if (!w) return; const inp = w.document.querySelector(".sb-inp"), f = w.document.querySelector(".sb-scrivi"); if (!inp || inp.disabled) return; inp.value = x; f.dispatchEvent(new w.Event("submit", { cancelable: true, bubbles: true })); }, [n, x]);
    const gesto = (n, punti) => ev(([n, punti]) => (async () => {
      const w = window.finestra(n), cv = w.document.querySelector(".sb-cv"), r = cv.getBoundingClientRect(), Ev = w.PointerEvent || w.MouseEvent;
      const e = (tipo, p) => cv.dispatchEvent(new Ev(tipo, { bubbles: true, cancelable: true, pointerId: 7, pointerType: "touch", isPrimary: true, clientX: r.left + p[0] / 1000 * r.width, clientY: r.top + p[1] / 1200 * r.height }));
      e("pointerdown", punti[0]); for (let i = 1; i < punti.length; i++) { e("pointermove", punti[i]); await new Promise(q => setTimeout(q, 15)); } e("pointerup", punti[punti.length - 1]);
    })(), [n, punti]);
    let turni = 0, tardi = false, giocano = NOMI.slice();
    for (;;) {
      const v = await finoA(v => v.fase === "scelta" || v.fase === "fine", 40000);
      if (!v || v.fase === "fine") break;
      turni++;
      const dis = await nomeDi(v.disegnatore);
      await dorme(600);
      if (turni === 1) { await due(dis, "t1-sceglie-chi-disegna"); await due(giocano.filter(n => n !== dis)[0], "t1-sceglie-altro"); }
      await ev(n => { const w = window.finestra(n), b = w.document.querySelectorAll(".sb-scelte button")[0]; if (b) { const Ev = w.PointerEvent || w.MouseEvent; ["pointerdown", "pointerup"].forEach(t => b.dispatchEvent(new Ev(t, { bubbles: true, cancelable: true }))); b.click(); } }, dis);
      if (!await finoA(v => v.fase === "disegno", 15000)) { scriviD("❗ niente disegno al turno " + turni); break; }
      await dorme(500);
      const parola = await ev(n => { const e = window.finestra(n).document.querySelector(".sb-centro b"); return e ? e.textContent : null; }, dis);
      // la parola nella foto che vedono tutti?
      const sp = await ev(p => { const v = COPIONE.aiuti.vm(window.__C); const s = JSON.stringify(v).toLowerCase(); return p && s.indexOf('"' + p.toLowerCase() + '"') >= 0 ? "⚠️ LA PAROLA «" + p + "» NELLA FOTO DELLA PARTITA" : ""; }, parola);
      scriviD("— turno " + turni + ": disegna " + dis + " «" + parola + "» " + sp);
      // un disegno: una casetta e un sole
      await gesto(dis, [[200, 700], [200, 1000], [700, 1000], [700, 700], [450, 450], [200, 700], [700, 700]]);
      await gesto(dis, [[820, 220], [880, 260], [900, 330], [860, 400], [790, 410], [740, 350], [750, 270], [820, 220]]);
      await dorme(800);
      const altri = giocano.filter(n => n !== dis);
      if (turni === 2 && !tardi) {
        tardi = true;
        await ev(c => window.apriTel("Tom", { hash: "gioco=scarabocchio&stanza=" + c, x: 1500, fintiM: true }), await ev(() => window.__C));
        await ev(c => window.apriTel("Dina", { hash: "gioco=scarabocchio&stanza=" + c + "&guarda=1", x: 1650 }), await ev(() => window.__C));
        await dorme(5000);
        await due("Tom", "t2-arriva-tardi");
        await due("Dina", "t2-guarda-col-link");
        const tt = await ev(p => { const out = []; ["Tom", "Dina"].forEach(n => { const w = window.finestra(n); if (w && p && (w.document.body.innerText || "").toLowerCase().indexOf(p.toLowerCase()) >= 0) out.push(n); }); return out.join(","); }, parola);
        if (tt) scriviD("⚠️ LA PAROLA SI VEDE A: " + tt);
      }
      if (turni === 1) {
        await indovina(altri[0], "casa"); await dorme(200);
        await indovina(altri[0], parola && parola.length > 3 ? parola.slice(0, -1) + "x" : "boh"); await dorme(400);
        await due(dis, "t1-disegna");
        await due(altri[0], "t1-indovina", true);
        await finoA(v => /_/.test(v.indizio || "") && (v.indizio.match(/[^_ ]/g) || []).length > 0, SEC * 1000 * 0.6);
        await dorme(600);
        await due(altri[0], "t1-con-lettera");
        const ind = await ev(() => COPIONE.aiuti.vm(window.__C).indizio);
        scriviD("   indizio: «" + ind + "» per «" + parola + "»");
      }
      // il primo indovina, foto, poi gli altri
      await indovina(altri[0], parola); await dorme(900);
      if (turni <= 2) { await due(altri[0], "t" + turni + "-ha-indovinato"); if (altri[1]) await due(altri[1], "t" + turni + "-non-ancora"); await due(dis, "t" + turni + "-disegna-dopo-primo"); }
      for (const n of altri.slice(1).concat(tardi ? ["Tom"] : [])) await indovina(n, parola);
      const vp = await finoA(v => v.fase === "punti" || v.fase === "fine", SEC * 1000 + 5000);
      await dorme(700);
      if (vp && turni <= 2) { await due("Paky", "t" + turni + "-punti"); if (turni === 2) { await due("Dina", "t2-punti-guarda"); await due("Tom", "t2-punti-tardi"); } }
      if (turni === 2 && tardi && giocano.indexOf("Tom") < 0) giocano.push("Tom");
      if (turni > 14) break;
    }
    await finoA(v => v.fase === "fine", 30000);
    await dorme(2500);
    await due("Paky", "fine-host");
    await due(AMICI[0], "fine-amico");
    await due("Tom", "fine-tardi");
    await due("Dina", "fine-guarda");
    scriviD("✅ fine, turni: " + turni);
  } catch (e) { scriviD("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

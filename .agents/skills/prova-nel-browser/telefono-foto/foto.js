// LE FOTO DEL «📞 TELEFONO DISEGNATO» (27 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\telefono-foto\foto.js --porta 8996 --dove D:\SG-telefono-prove\partite --n 6
//      [--solo 360|412]
// (il server della copia acceso sulla porta). Partita online in N dalla stanza: frasi vere, disegni fatti col dito finto (una
// casa, un sole, un pesce…), frasi indovinate; al passo 2 arriva Tom (tardi) e Dina guarda col link. Ogni foto su due
// telefoni: basso 360x640 e alto 412x915 (più 360x340 con la tastiera aperta quando si scrive).
// Scrive diario-N.txt con le cose che escono dallo schermo, la pagina che scorre e le frasi che finiscono nella foto della
// partita mentre si gioca (spoiler). La foto per WhatsApp di un libretto finisce in whatsapp-N.png.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const N = +(arg.n || 6), BASE = "http://localhost:" + (arg.porta || 8996), DOVE = path.join(arg.dove || path.join(__dirname, "foto"), "n" + N);
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario-" + N + ".txt");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-telefono");
  let detto = false;
  for (;;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ in fila dietro: " + vivi[0]); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}
// le frasi di partenza e quelle «capite» (per le foto: frasi vere, come le scriverebbe la gente)
const FRASI = ["Un gatto che fa surf su una pizza", "Una nonna in skateboard in cucina", "Un dinosauro al supermercato col carrello", "Un pinguino che prende il sole",
  "Un astronauta che pesca sulla luna", "Un cane che suona la chitarra", "Una mucca in mongolfiera", "Un robot che fa la pizza", "Un elefante su un monopattino",
  "Una giraffa con la sciarpa", "Un polpo che fa il barbiere", "Un fantasma al mare"];
const CAPITE = ["Una casa col sole", "Un pesce che vola", "Un uomo che corre sotto la pioggia", "Una torta con le candeline", "Un treno nel deserto", "Un ombrello rotto",
  "Un mostro con tre occhi", "Una barca in tempesta", "Un albero di Natale", "Un serpente con il cappello", "Una macchina volante", "Un panino gigante"];
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
      await window.COPIONE.carica("preferiti/telefono.js");
      window.COPIONE.aiuti.pulisci();
      // un disegno vero col dito finto: forme in coordinate da 0 a 1, col colore scelto toccando la tavolozza
      window.TD.disegnoBello = function (w, quale) {
        const d = w.document, cv = d.querySelector(".td-cv.matita"); if (!cv) return false;
        const r = cv.getBoundingClientRect();
        function col(i) { const b = d.querySelectorAll(".td-col")[i]; if (b) b.click(); }
        function sp(i) { const b = d.querySelectorAll(".td-spess")[i]; if (b) b.click(); }
        function riga(pts) {
          const ev = (t, p) => cv.dispatchEvent(new w.PointerEvent(t, { bubbles: true, cancelable: true, pointerId: 1, clientX: r.left + p[0] * r.width, clientY: r.top + p[1] * r.height, pointerType: "touch", isPrimary: true }));
          ev("pointerdown", pts[0]); for (let k = 1; k < pts.length; k++) { const a = pts[k - 1], b = pts[k]; for (let s = 1; s <= 6; s++) ev("pointermove", [a[0] + (b[0] - a[0]) * s / 6, a[1] + (b[1] - a[1]) * s / 6]); } ev("pointerup", pts[pts.length - 1]);
        }
        function tondo(cx, cy, rx, ry) { const p = []; for (let k = 0; k <= 28; k++) { const a = k / 28 * Math.PI * 2; p.push([cx + rx * Math.cos(a), cy + ry * Math.sin(a)]); } riga(p); }
        const q = quale % 3;
        if (q === 0) {   // una casa col sole
          sp(2); col(8); riga([[0.25, 0.85], [0.25, 0.55], [0.7, 0.55], [0.7, 0.85], [0.25, 0.85]]);
          col(3); riga([[0.2, 0.57], [0.475, 0.33], [0.75, 0.57]]);
          col(2); riga([[0.42, 0.85], [0.42, 0.7], [0.53, 0.7], [0.53, 0.85]]);
          col(5); sp(3); tondo(0.82, 0.18, 0.08, 0.065);
          sp(1); [[0.82, 0.06, 0.82, 0.0], [0.95, 0.18, 1, 0.18], [0.7, 0.18, 0.64, 0.18], [0.92, 0.07, 0.97, 0.03]].forEach(x => riga([[x[0], x[1]], [x[2], x[3]]]));
          col(6); sp(2); riga([[0.05, 0.86], [0.95, 0.86]]);
        } else if (q === 1) {   // un pesce con le ali
          sp(2); col(4); tondo(0.48, 0.5, 0.25, 0.14);
          riga([[0.24, 0.5], [0.08, 0.38], [0.08, 0.62], [0.24, 0.5]]);
          col(0); sp(3); tondo(0.62, 0.46, 0.02, 0.016);
          col(7); sp(2); riga([[0.42, 0.38], [0.36, 0.14], [0.56, 0.37]]); riga([[0.45, 0.62], [0.4, 0.84], [0.58, 0.63]]);
          col(8); sp(1); [[0.15, 0.2], [0.8, 0.8], [0.85, 0.25]].forEach(c => tondo(c[0], c[1], 0.03, 0.025));
        } else {   // un omino sotto la pioggia
          sp(2); col(0); tondo(0.5, 0.42, 0.06, 0.05);
          riga([[0.5, 0.47], [0.5, 0.68]]); riga([[0.38, 0.55], [0.5, 0.52], [0.62, 0.58]]); riga([[0.42, 0.85], [0.5, 0.68], [0.6, 0.84]]);
          col(1); sp(3); tondo(0.35, 0.14, 0.14, 0.06); tondo(0.62, 0.12, 0.16, 0.07);
          col(8); sp(1); for (let k = 0; k < 9; k++) { const x = 0.2 + k * 0.07; riga([[x, 0.24 + (k % 3) * 0.05], [x - 0.02, 0.32 + (k % 3) * 0.05]]); }
        }
        return true;
      };
    });
    const ev = (f, a) => page.evaluate(f, a);
    const dorme = ms => page.waitForTimeout(ms);
    let nf = 0;
    async function scatta(nome, file, L, H, tastiera) {
      await ev(([n, L, H, tk]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); if (!f) return;
        f.__vec = f.__vec || f.style.cssText;
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 9999;
        const w = f.contentWindow;
        if (tk) { const c = w.document.querySelector(".td-campo"); if (c && c.offsetParent) c.focus(); w.document.documentElement.classList.add("tastiera"); }
        w.dispatchEvent(new w.Event("resize"));
      }, [nome, L, H, !!tastiera]);
      await dorme(800);
      const ok = await ev(n => !!document.getElementById("tel-" + n), nome);
      if (ok) await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      const info = await ev(n => {
        const w = window.finestra(n); if (!w) return "(niente)";
        const d = w.document, tx = (d.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 240);
        const fuori = [];
        d.querySelectorAll(".td-scena button, .td-centro, .td-tempo, .td-foglietto, .td-campo, .td-cv, .td-persona, .td-pronti, .td-premio, .td-gal-lib, .classifica li, .fine-tasti button, .sl-targa").forEach(e => {
          if (!e.offsetParent || e.closest(".td-feed") || e.closest(".td-gal-in")) return;
          const r = e.getBoundingClientRect();
          if (r.width && (r.right > w.innerWidth + 1 || r.left < -1 || r.bottom > w.innerHeight + 1 || r.top < -1)) fuori.push((e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
          else if (e.scrollWidth > e.clientWidth + 2 && /td-centro|td-persona|td-premio/.test(e.className)) fuori.push("tagliato " + e.className + "«" + e.textContent.trim().slice(0, 24) + "»");
        });
        const scL = [].filter.call(d.querySelectorAll(".td-scena, .td-corpo, .td-mezzo"), c => c.offsetParent && c.scrollHeight > c.clientHeight + 2).map(c => c.className.split(" ").slice(0, 2).join(".") + "+" + (c.scrollHeight - c.clientHeight));
        if (d.scrollingElement && d.scrollingElement.scrollHeight > w.innerHeight + 2) scL.push("pagina+" + (d.scrollingElement.scrollHeight - w.innerHeight));
        return tx + (scL.length ? " · ⚠️ SCORRE " + scL.join(",") : "") + (fuori.length ? " · ⚠️ FUORI: " + fuori.slice(0, 6).join(" | ") : "");
      }, nome);
      await ev(() => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; const w = f.contentWindow; if (w) { w.document.documentElement.classList.remove("tastiera"); const c = w.document.querySelector(".td-campo"); if (c) c.blur(); w.dispatchEvent(new w.Event("resize")); } } }); });
      await dorme(250);
      scriviD("📸 " + file + " · " + nome + " · " + info);
    }
    async function due(n, f, tk) {
      if (!n) return;
      const k = String(++nf).padStart(2, "0");
      if (arg.solo !== "412") await scatta(n, k + "-" + f + "-360", 360, 640);
      if (arg.solo !== "360") await scatta(n, k + "-" + f + "-412", 412, 915);
      if (tk && arg.solo !== "412") await scatta(n, k + "-" + f + "-tastiera", 360, 340, true);
    }
    fs.writeFileSync(DIARIO, "Telefono Disegnato in " + N + " · " + new Date().toISOString() + "\n");
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia"].slice(0, N - 1), NOMI = ["Paky"].concat(AMICI);
    const vm = () => ev(() => COPIONE.aiuti.vm(window.__C) || {});
    const finoA = async (cond, ms) => { const t = Date.now() + (ms || 60000); while (Date.now() < t) { const v = await vm(); if (cond(v)) return v; await dorme(150); } return null; };
    const PROVA = { ritmo: { s0: 120, d: 150, s: 120 }, riv: { s: 25, d: 25, f: 30 }, ridisegno: 2600 };
    await ev(([a, p]) => (async () => { const Z = await TD.stanza(a, { fermo: true, prova: p }); window.__C = Z.C; })(), [AMICI, PROVA]);
    await dorme(1200);
    await due("Paky", "saletta-host");
    await due(AMICI[0], "saletta-amico");
    await ev(() => window.clicca(window.finestra("Paky"), /Comincia/));
    // lo spoiler: frasi o disegni nella foto della partita mentre si gioca
    await ev(() => { window.__spoiler = []; window.__spia = setInterval(() => { const v = COPIONE.aiuti.vm(window.__C); if (!v || v.fase !== "gioco" || v.passo !== "giro" && v.passo !== "ripresa") return; const s = JSON.stringify(v); if (/surf|skateboard|supermercato|casa col sole|pesce che vola|pioggia/i.test(s) || /"d":"\d+\.\d/.test(s)) window.__spoiler.push(v.giro); }, 100); });
    const fai = (n, i, g) => ev(([n, i, g, F, Cp]) => {
      const w = window.finestra(n), c = TD.cosa(w); if (!c) return false;
      if (c === "disegno") TD.disegnoBello(w, i + g); else TD.scrivi(w, g === 0 ? F[i % F.length] : Cp[(i + g) % Cp.length]);
      return true;
    }, [n, i, g, FRASI, CAPITE]);
    const fatto = n => ev(n => { const w = window.finestra(n), b = [].find.call(w.document.querySelectorAll(".td-piede .td-tasto"), x => x.offsetParent && /Fatto/.test(x.textContent)); if (b && !b.disabled) { b.click(); return true; } return false; }, n);
    let tardi = false;
    const L = ((await finoA(v => v.fase === "gioco" && v.L > 0, 15000)) || {}).L || 0;
    for (let g = 0; g < L; g++) {
      let v = await finoA(v => v.fase === "gioco" && v.passo === "giro" && v.giro === g, 30000);
      if (!v) { const vv = await vm(); scriviD("❗ niente passo " + (g + 1) + " (passo " + vv.passo + ")"); break; }
      await dorme(900);
      const conFoto = g <= 2 || g === L - 1;
      if (g === 0) await due("Paky", "p1-frase-vuota");
      for (let i = 0; i < NOMI.length; i++) await fai(NOMI[i], i, g);
      if (conFoto) await due("Giulia", "p" + (g + 1) + (g % 2 ? "-disegna" : g ? "-indovina" : "-frase"), g % 2 === 0);
      // tutti tranne l'ultimo: «Fatto!» e si aspetta
      for (let i = 0; i < NOMI.length - 1; i++) await fatto(NOMI[i]);
      await dorme(900);
      if (conFoto) await due("Giulia", "p" + (g + 1) + "-aspetta");
      if (g === 1 && !tardi) {
        tardi = true;
        const c = await ev(() => window.__C);
        await ev(([c, p]) => window.apriTel("Tom", { hash: "gioco=telefono&stanza=" + c, x: 1500, prima: TD.prima(p) }), [c, PROVA]);
        await ev(([c, p]) => window.apriTel("Dina", { hash: "gioco=telefono&stanza=" + c + "&guarda=1", x: 1650, prima: TD.prima(p) }), [c, PROVA]);
        await dorme(5000);
        await due("Tom", "p2-arriva-tardi");
        await due("Dina", "p2-guarda-col-link");
      }
      await fatto(NOMI[NOMI.length - 1]);
    }
    let v = await finoA(v => v.passo === "rivela", 20000);
    if (!v) scriviD("❗ niente rivelazione");
    // la rivelazione: il primo libretto con le foto di ogni pagina, poi gli altri di corsa
    const avanti = () => ev(() => { const w = window.finestra("Paky"), b = [].find.call(w.document.querySelectorAll(".td-avanti .td-tasto"), x => x.offsetParent && !x.classList.contains("v")); if (b) { b.click(); return true; } return false; });
    for (let passo = 0; passo < 200; passo++) {
      v = await vm(); if (v.fase === "fine" || !v.riv) break;
      const rv = v.riv, primo = rv.i === 0, pg = rv.pag[Math.min(rv.p, rv.pag.length - 1)];
      await dorme(primo ? 3200 : 250);
      if (primo) {
        // qualche reazione dagli amici
        if (rv.p >= 1) await ev(() => { ["Luca", "Sara", "Giulia"].forEach((n, i) => { const w = window.finestra(n); if (!w) return; const b = w.document.querySelectorAll(".td-r")[i % 2 ? 0 : 2]; if (b) b.click(); }); });
        await dorme(300);
        await due(rv.fin ? "Giulia" : "Paky", "r1-" + (rv.fin ? "fine-libretto" : "pagina-" + (rv.p + 1) + (pg.t === "d" ? "-disegno" : "-frase")));
        if (rv.fin) {
          await ev(() => { ["Giulia", "Luca", "Sara", "Marco"].forEach(n => { const w = window.finestra(n); if (!w) return; const m = [].find.call(w.document.querySelectorAll(".td-m"), x => !x.disabled); if (m) m.click(); }); });
          await dorme(900);
          await due("Giulia", "r1-fine-con-stelle");
          await due("Tom", "r1-tardi");
          await due("Dina", "r1-guarda");
        }
      } else if (rv.i === 1 && rv.p === 3) await due("Luca", "r2-pagina-4");
      if (!await avanti()) await dorme(500);
    }
    await finoA(v => v.fase === "fine", 30000);
    await dorme(2500);
    await due("Paky", "fine-host");
    await due("Giulia", "fine-amico");
    await due("Tom", "fine-tardi");
    await due("Dina", "fine-guarda");
    // la galleria e la foto per WhatsApp (Giulia)
    await ev(() => window.clicca(window.finestra("Giulia"), /Rivedi i libretti/));
    await dorme(800);
    await due("Giulia", "fine-galleria");
    await ev(() => { const w = window.finestra("Giulia"), b = w.document.querySelector(".td-gal-lib"); if (b) b.click(); });
    await dorme(1200);
    await due("Giulia", "fine-galleria-libretto");
    const url = await ev(() => { const w = window.finestra("Giulia"); w.__foto = null; try { Object.defineProperty(w.navigator, "canShare", { configurable: true, value: function () { return false; } }); } catch (e) {} w.HTMLAnchorElement.prototype.click = function () { w.__foto = this.href; }; window.clicca(w, /Manda su WhatsApp/); return new Promise(r => setTimeout(() => r(w.__foto), 1500)); });
    if (url && /^data:image\/png/.test(url)) { fs.writeFileSync(path.join(DOVE, "whatsapp-" + N + ".png"), Buffer.from(url.split(",")[1], "base64")); scriviD("📸 whatsapp-" + N + ".png"); }
    else scriviD("❗ la foto per WhatsApp non è uscita");
    const sp = await ev(() => { clearInterval(window.__spia); return window.__spoiler.length; });
    scriviD(sp ? "⚠️ FRASI O DISEGNI NELLA FOTO MENTRE SI GIOCA: " + sp : "✅ niente frasi né disegni nella foto mentre si gioca");
    const err = await ev(() => window.erroriTel());
    scriviD(err.length ? "⚠️ errori: " + err.slice(0, 5).join(" / ") : "✅ nessun errore");
    scriviD("✅ fine");
  } catch (e) { scriviD("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

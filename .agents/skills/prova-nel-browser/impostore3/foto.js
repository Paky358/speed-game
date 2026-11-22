// LE FOTO DELL'IMPOSTORE (caccia ai difetti, 22 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\impostore3\foto.js --porta 8931 --dove D:\SG-impostore-prove\foto\prima
//      [--copione online|blocco|elim|locale] [--n 4] [--voce 1] [--spia sa|nonsa] [--aiuto simile|categoria|buio] [--pre prefisso]
// (il server della copia acceso sulla porta). Ogni foto su due telefoni: basso 360x640 e alto 412x915. Scrive anche diario.txt.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) arg[process.argv[i].slice(2)] = process.argv[i + 1];
const BASE = "http://localhost:" + (arg.porta || 8931), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario.txt");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-impostore");
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
    const ctx = await browser.newContext({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const page = await ctx.newPage();
    page.on("pageerror", e => scriviD("❗ errore pagina: " + e.message));
    page.on("console", m => { if (m.type() === "error") scriviD("❗ console: " + m.text().slice(0, 200)); });
    await page.goto(BASE + "/sw.js", { waitUntil: "load" });
    await page.evaluate(async () => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("impostore3/scene.js");
      window.COPIONE.aiuti.pulisci();
    });
    const ev = (f, a) => page.evaluate(f, a);
    const dorme = ms => page.waitForTimeout(ms);
    const PRE = arg.pre || (arg.copione || "online") + (arg.n || "") + "-";
    let nf = 0;
    // la foto di un telefono: l'iframe a grandezza vera in alto a sinistra, sopra gli altri
    async function scatta(nome, file, L, H, prima) {
      await ev(([n, L, H]) => {
        document.querySelectorAll("iframe").forEach(f => { f.style.visibility = f.id === "tel-" + n ? "visible" : "hidden"; });
        const f = document.getElementById("tel-" + n); if (!f) return;
        f.__vec = f.__vec || f.style.cssText;
        f.style.left = "0px"; f.style.top = "0px"; f.style.transform = "none"; f.style.width = L + "px"; f.style.height = H + "px"; f.style.zIndex = 9999;
        const w = f.contentWindow; w.dispatchEvent(new w.Event("resize"));
      }, [nome, L, H]);
      if (prima) await ev(prima, nome);
      await dorme(650);
      const ok = await ev(n => !!document.getElementById("tel-" + n), nome);
      if (ok) await page.screenshot({ path: path.join(DOVE, file + ".png"), clip: { x: 0, y: 0, width: L, height: H } });
      const tx = await ev(n => { const w = window.finestra(n); return w ? (w.document.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 260) : "(niente)"; }, nome);
      await ev(n => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; } }); }, nome);
      scriviD("📸 " + file + " · " + nome + " · " + tx);
    }
    // due telefoni: basso e alto
    async function due(n, f, prima) { const k = String(++nf).padStart(2, "0"); await scatta(n, PRE + k + "-" + f + "-360", 360, 640, prima); await scatta(n, PRE + k + "-" + f + "-412", 412, 915, prima); }
    const tieni = n => { const w = window.finestra(n), c = w.document.querySelector(".im-carta"); if (c) c.dispatchEvent(new w.PointerEvent("pointerdown", { bubbles: true, pointerId: 1 })); };
    const lascia = n => { const w = window.finestra(n), c = w.document.querySelector(".im-carta"); if (c) c.dispatchEvent(new w.PointerEvent("pointerup", { bubbles: true, pointerId: 1 })); };
    const spoiler = async (dove) => { const s = await ev(() => I3.spoiler()); if (s.length) scriviD("⚠️ SPOILER " + dove + ": " + s.join(" / ")); };
    const quale = arg.copione || "online";
    const N = +(arg.n || 4);
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia"].slice(0, N - 1);
    const reg = { mani: 2, giri: 2, indizi: arg.voce ? "voce" : "scritti", spia: arg.spia || "no", aiuto: arg.aiuto || "simile", voto: quale === "elim" ? "elim" : "una", nimp: +(arg.nimp || 1) };
    fs.writeFileSync(DIARIO, "Copione " + quale + " in " + N + " · regole " + JSON.stringify(reg) + "\n");
    if (quale === "online" || quale === "elim" || quale === "blocco") {
      await ev(([a, r]) => I3.apri(a, r), [AMICI, reg]);
      await due("Paky", "saletta-host"); await due(AMICI[0], "saletta-amico");
      await ev(() => I3.comincia());
      const r = await ev(() => I3.ruoli()); scriviD("ruoli: " + JSON.stringify(r));
      const imp = Object.keys(r).filter(k => r[k] === "imp")[0], civ = Object.keys(r).filter(k => r[k] === "civ" && k !== "Paky")[0] || Object.keys(r).filter(k => r[k] === "civ")[0];
      const spia = Object.keys(r).filter(k => r[k] === "spia")[0];
      await spoiler("all'inizio");
      if (!arg.voce) {
        await due(civ, "indizi-civile");
        await due(civ, "indizi-civile-tiene-premuto", tieni); await ev(lascia, civ);
        await due(imp, "indizi-impostore-tiene-premuto", tieni); await ev(lascia, imp);
        if (spia) { await due(spia, "indizi-spia-tiene-premuto", tieni); await ev(lascia, spia); }
        // scrivono tutti tranne l'impostore: chi ha scritto aspetta
        await ev(i => I3.scrivi([i], false), imp);
        await dorme(800);
        await due(civ, "indizi-ho-scritto");
        await due(imp, "indizi-manca-solo-lui");
        // arriva tardi Bea, Dina guarda col link
        await ev(() => I3.tardi("Bea"));
        await due("Bea", "arriva-tardi");
        await ev(() => I3.guarda("Dina"));
        await due("Dina", "guarda-col-link");
        await due("Dina", "guarda-col-link-tiene-premuto", tieni); await ev(lascia, "Dina");
        await ev(() => I3.scrivi());
        if (await ev(() => I3.vm().passo === "indizi")) {
          await spoiler("al giro 2");
          await due(civ, "giro2-indizi-svelati");
          await due("Bea", "giro2-arrivata-tardi");
          await ev(() => I3.scrivi());
        }
      }
      await ev(() => I3.passo("discuti"));
      await dorme(600);
      if (quale === "blocco") { await ev(n => I3.blocca(n), AMICI[1]); scriviD("📱 blocca " + AMICI[1]); await dorme(26000); }
      await due(civ, "discutete");
      await due("Dina", "discutete-guarda");
      if (quale === "blocco") await due("Paky", "discutete-uno-bloccato");
      await ev(() => I3.pronti(I3.ora().slice(0, Math.ceil(I3.ora().length / 2))));
      await dorme(500);
      await due(civ, "discutete-pronti-a-meta");
      await ev(() => I3.pronti());
      await ev(() => I3.passo("voto"));
      await dorme(500);
      await due(civ, "voto");
      await due("Dina", "voto-guarda");
      // tutti votano l'impostore (lui vota il primo civile); chi è bloccato no
      const blo = quale === "blocco" ? [AMICI[1]] : [];
      await ev(([i, c, b]) => I3.vota(n => n === i ? c : i, b), [imp, civ, blo]);
      await dorme(400);
      if (quale === "blocco") { await dorme(41000); await due(civ, "voto-aspettiamo-bloccato"); await ev(n => I3.sblocca(n), AMICI[1]); await dorme(3000); await due(AMICI[1], "voto-riaperto"); await ev(([b, i]) => I3.vota(n => n === b ? i : null), [AMICI[1], imp]); }
      await ev(() => I3.passo("spoglio", 15000));
      await dorme(300);
      await due(civ, "spoglio-inizio");
      await dorme(2200);
      await due(civ, "spoglio-fine");
      if (quale === "elim") {
        await dorme(4000);
        await due(civ, "dopo-spoglio-elim");
        await due(imp, "dopo-spoglio-elim-imp");
      }
      const ul = await ev(() => I3.passo("ultima", 15000));
      if (ul) {
        await dorme(800);
        await due(imp, "ultima-impostore");
        await due(civ, "ultima-civile");
        await due("Dina", "ultima-guarda");
        await ev(() => I3.indovina(false));
        await dorme(1500);
        await due(civ, "ultima-dopo");
      }
      await ev(() => I3.passo("esito", 20000));
      await dorme(1500);
      await due(civ, "esito-civile");
      await due(imp, "esito-impostore");
      await due("Bea", "esito-arrivata-tardi");
      await due("Dina", "esito-guarda");
      await ev(() => I3.pronti());
      // seconda mano: entra Bea?
      await ev(v => I3.passo(v ? "discuti" : "indizi", 20000), !!arg.voce);
      await dorme(1500);
      await due("Bea", "mano2-arrivata-tardi");
      await due(civ, "mano2-civile");
      await spoiler("mano 2");
      if (!arg.voce) { await ev(() => I3.scrivi()); if (await ev(() => I3.vm().passo === "indizi")) await ev(() => I3.scrivi()); }
      await ev(() => I3.passo("discuti")); await ev(() => I3.pronti());
      const r2 = await ev(() => I3.ruoli()); const imp2 = Object.keys(r2).filter(k => r2[k] === "imp")[0];
      // si vota uno a caso che non è l'impostore: lui la fa franca
      const inn = Object.keys(r2).filter(k => r2[k] !== "imp")[0];
      await ev(([i, x]) => I3.vota(n => n === x ? i : x), [imp2, inn]);
      await ev(() => I3.passo("esito", 25000));
      await dorme(1500);
      await due(inn, "mano2-esito-innocente");
      await ev(() => I3.pronti());
      await ev(() => window.aspetta(() => I3.vm().fase === "fine", 20000));
      await dorme(2500);
      await due("Paky", "classifica-host");
      await due(AMICI[0], "classifica-amico");
      await due("Dina", "classifica-guarda");
    }
    // DUE IMPOSTORI che si conoscono, in 7 a eliminazione: la carta coperta di un impostore e di un cittadino, senza toccarla
    if (quale === "due") {
      await ev(([a]) => I3.apri(a, { mani: 1, giri: 1, voto: "elim", nimp: 2, conosce: "si", spia: "no", aiuto: "categoria" }), [["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita"]]);
      await ev(() => I3.comincia());
      const r = await ev(() => I3.ruoli()); scriviD("ruoli: " + JSON.stringify(r));
      const imp = Object.keys(r).filter(k => r[k] === "imp")[0], civ = Object.keys(r).filter(k => r[k] === "civ")[0];
      await ev(() => I3.scrivi());
      await ev(() => I3.passo("discuti")); await dorme(1500);
      await scatta(imp, PRE + "impostore-360", 360, 640); await scatta(civ, PRE + "cittadino-360", 360, 640);
    }
    // LE SCELTE (proposte, NON nel gioco): la schermata vera e, sopra, la proposta disegnata solo per la foto
    if (quale === "scelte") {
      const una = async (n, f, prima) => { await scatta(n, PRE + f, 412, 915, prima); };
      const css = (n, testo) => { const w = window.finestra(n), d = w.document; let s = d.getElementById("prop-css"); if (!s) { s = d.createElement("style"); s.id = "prop-css"; d.head.appendChild(s); } s.textContent = testo; };
      const via = n => { const s = window.finestra(n).document.getElementById("prop-css"); if (s) s.remove(); window.finestra(n).document.querySelectorAll(".prop").forEach(x => x.remove()); };
      const CENTRO = ".im-corpo>:first-child{margin-top:auto!important}.im-corpo>:last-child{margin-bottom:auto!important}";
      await ev(([a, r]) => I3.apri(a, r), [AMICI, Object.assign({}, reg, { mani: 1, giri: 1 })]);
      await ev(() => I3.comincia());
      const r = await ev(() => I3.ruoli()); scriviD("ruoli: " + JSON.stringify(r));
      const imp = Object.keys(r).filter(k => r[k] === "imp")[0], civ = Object.keys(r).filter(k => r[k] === "civ" && k !== "Paky")[0];
      // H: chi arriva tardi, tenendo premuto, vede anche chi è l'impostore (e potrebbe dirlo a voce)
      await ev(() => I3.tardi("Bea"));
      await una("Bea", "H-arrivata-tardi-tiene-premuto", tieni); await ev(lascia, "Bea");
      await ev(() => I3.scrivi());
      await ev(() => I3.passo("discuti")); await dorme(1500);
      await una(civ, "A-discutete-prima");
      await una(civ, "A-discutete-dopo", n => { const w = window.finestra(n), d = w.document; const s = d.createElement("style"); s.id = "prop-css"; s.textContent = ".im-corpo>:first-child{margin-top:auto!important}.im-corpo>:last-child{margin-bottom:auto!important}"; d.head.appendChild(s); });
      await ev(via, civ);
      // F: il tasto «🎯 So la parola!» dell'impostore durante la discussione
      await una(imp, "F-so-la-parola-dopo", n => { const w = window.finestra(n), d = w.document, p = d.querySelector(".im-piede"); const b = d.createElement("button"); b.className = "btn prop"; b.textContent = "🎯 So la parola! (se sbagli, perdi)"; b.style.cssText = "font-weight:800"; p.insertBefore(b, p.firstChild); });
      await ev(via, imp);
      await ev(() => I3.pronti());
      await ev(([i, c]) => I3.vota(n => n === i ? c : i), [imp, civ]);
      await ev(() => I3.passo("spoglio", 15000)); await dorme(3200);
      await una(civ, "E-spoglio-prima");
      // E: chi ha votato chi, già nello spoglio (i voti li sa chi tiene la partita)
      await una(civ, "E-spoglio-dopo", n => {
        const P = window.finestra("Paky"), H = P.__impHost.H(), w = window.finestra(n), d = w.document;
        const nome = id => (H.players.filter(p => p.id === id)[0] || {}).nome;
        d.querySelectorAll(".im-sp-r").forEach(riga => {
          const chi = riga.querySelector(".im-nome").textContent, p = H.players.filter(x => x.nome === chi || (chi === "Tu" && x.nome === n))[0]; if (!p) return;
          const da = Object.keys(H.voti).filter(k => H.voti[k] === p.id).map(nome);
          if (!da.length) return;
          const s = d.createElement("small"); s.className = "prop"; s.textContent = "← " + da.join(", "); s.style.cssText = "flex:1;text-align:right;opacity:.75;font-size:.8rem;margin-right:8px";
          riga.insertBefore(s, riga.lastChild);
        });
      });
      await ev(via, civ);
      if (await ev(() => I3.passo("ultima", 8000))) { await dorme(900); await una(civ, "ultima-civile"); await ev(() => I3.indovina(false)); }
      await ev(() => I3.passo("esito", 40000)); await dorme(1500);
      await una(civ, "A-esito-prima");
      await una(civ, "A-esito-dopo", n => { const w = window.finestra(n), d = w.document; const s = d.createElement("style"); s.id = "prop-css"; s.textContent = ".im-corpo>:first-child{margin-top:auto!important}.im-corpo>:last-child{margin-bottom:auto!important}"; d.head.appendChild(s); });
      await ev(via, civ);
      // G: perché la spia prende quei punti (una riga sotto i punti)
      await una(civ, "G-punti-spia-dopo", n => { const w = window.finestra(n), d = w.document, l = d.querySelector(".im-es"); const p = d.createElement("p"); p.className = "im-conto prop"; p.style.cssText = "margin:6px 0 0;font-size:.85rem;text-align:center"; p.textContent = "Punti: impostore votato +2 · 🎭 spia votata +1 · 🕵️ salvo +3 · 🎭 salva +2"; l.parentNode.insertBefore(p, l.nextSibling); });
      await ev(via, civ);
      scriviD("(CENTRO = " + CENTRO + ")");
    }
    if (arg.fine) await dorme(+arg.fine);
  } finally { await browser.close(); }
})().catch(e => { scriviD("ERRORE " + (e && e.stack || e)); process.exit(1); });

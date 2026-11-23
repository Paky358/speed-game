// LE FOTO DI «STESSA LUNGHEZZA D'ONDA» (caccia ai difetti, 23 nov 2026). Edge invisibile, uno strumento alla volta (stessa fila di prova.js).
// Uso: "C:\Program Files\nodejs\node.exe" .agents\skills\prova-nel-browser\lunghezza-foto\foto.js --porta 8996 --dove D:\SG-lunghezza-prove\prima
//      [--copione solo|squadre|insieme|locale|locale-insieme] [--n 4] [--pre prefisso] [--solo 360|412] [--domande cosa|classico|misto]
// (il server della copia acceso sulla porta). Ogni foto su due telefoni: basso 360x640 e alto 412x915. Scrive anche diario.txt,
// con le cose che escono dallo schermo, la pagina che scorre, i numeri senza il punto e il bersaglio nella foto della partita prima del tempo.
const path = require("path"), fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const arg = {}; for (let i = 2; i < process.argv.length; i++) if (process.argv[i].startsWith("--")) { const v = process.argv[i + 1]; arg[process.argv[i].slice(2)] = (v === undefined || v.startsWith("--")) ? "1" : v; }
const BASE = "http://localhost:" + (arg.porta || 8996), DOVE = arg.dove || path.join(__dirname, "foto");
fs.mkdirSync(DOVE, { recursive: true });
const DIARIO = path.join(DOVE, "diario.txt");
function scriviD(r) { fs.appendFileSync(DIARIO, r + "\n"); console.log(r); }
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, "foto-lunghezza");
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
      await window.COPIONE.carica("passo2/lunghezza.js");
      window.COPIONE.aiuti.pulisci();
    });
    const ev = (f, a) => page.evaluate(f, a);
    const dorme = ms => page.waitForTimeout(ms);
    const quale = arg.copione || "solo", N = +(arg.n || 4), DOM = arg.domande || "misto";
    const PRE = arg.pre || quale + (/locale/.test(quale) ? "" : N) + "-";
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
        const d = w.document, tx = (d.body.innerText || "").replace(/\s+/g, " ").trim().slice(0, 240);
        const fuori = [];
        d.querySelectorAll(".lu button, .lu-box, .lu-chi b, .lu-chi span, .lu-est, .lu-parola, .lu-nota, .lu-p, .lu-esito b, .lu-esito span, .lu-pop.vis, .lu-tag.vis, .lu-mk, .lu-banner.vis, .classifica li, .lu-fin-sq>div, .lu-premi div").forEach(e => {
          if (!e.offsetParent || !e.childElementCount && !e.textContent.trim()) return;
          const r = e.getBoundingClientRect();
          if (r.width && (r.right > w.innerWidth + 1 || r.left < -1 || r.bottom > w.innerHeight + 1 || r.top < -1)) fuori.push((e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
          else if (e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== "visible") fuori.push("tagliato " + (e.className || e.tagName) + "«" + e.textContent.trim().slice(0, 20) + "»");
        });
        const sc = [].filter.call(d.querySelectorAll(".schermata, .schermata .contenuto"), c => c.offsetParent && c.scrollHeight > c.clientHeight + 2).length || (d.scrollingElement && d.scrollingElement.scrollHeight > w.innerHeight + 2) ? " · ⚠️ SCORRE" : "";
        const num = (tx.match(/\b\d{4,}\b/g) || []).filter(x => !/^20\d\d$/.test(x));
        return tx + sc + (fuori.length ? " · ⚠️ FUORI: " + fuori.slice(0, 6).join(" | ") : "") + (num.length ? " · ⚠️ NUMERI SENZA PUNTO: " + num.join(",") : "");
      }, nome);
      // lo spoiler: il bersaglio nella foto della partita prima della rivelazione
      const spoiler = await ev(() => { const v = window.__C ? COPIONE.aiuti.vm(window.__C) : null; if (!v || v.passo === "rivela") return ""; const s = JSON.stringify(v); return /"bers"|"bozza"/.test(s) ? " · ⚠️ BERSAGLIO NELLA FOTO" : ""; });
      await ev(() => { document.querySelectorAll("iframe").forEach(f => { f.style.visibility = "visible"; if (f.__vec) { f.style.cssText = f.__vec; delete f.__vec; const w = f.contentWindow; if (w) w.dispatchEvent(new w.Event("resize")); } }); });
      await dorme(250);
      scriviD("📸 " + file + " · " + nome + " · " + info + spoiler);
    }
    async function due(n, f) {
      if (!n) return;
      const k = String(++nf).padStart(2, "0");
      if (arg.solo !== "412") await scatta(n, PRE + k + "-" + f + "-360", 360, 640);
      if (arg.solo !== "360") await scatta(n, PRE + k + "-" + f + "-412", 412, 915);
    }
    fs.writeFileSync(DIARIO, "Copione " + quale + " in " + N + " (" + DOM + ") · " + new Date().toISOString() + "\n");
    const AMICI = ["Giulia", "Luca", "Sara", "Marco", "Ugo", "Rita", "Teo", "Nina", "Elia"].slice(0, N - 1);
    const vm = () => ev(() => COPIONE.aiuti.vm(window.__C) || {});
    const nomeId = id => ev(id => { const p = (COPIONE.aiuti.vm(window.__C).players || []).filter(x => x.id === id)[0]; return p ? p.nome : null; }, id);
    const passo = (opz) => ev(o => COPIONE.lu.giocaPasso(window.__C, o || { veloce: true }), opz || null);
    const finoA = async (cond, ms) => { const t = Date.now() + (ms || 60000); while (Date.now() < t) { const v = await vm(); if (v.fase !== "gioco" && v.fase !== undefined && cond(v) !== true) { if (v.fase === "fine") return false; } if (cond(v)) return true; await passo(); } return false; };
    const trascina = (nome, val, su) => ev(([n, v, s]) => COPIONE.lu.trascina(window.finestra(n), v, s), [nome, val, su === undefined ? true : su]);

    if (quale === "solo" || quale === "squadre" || quale === "insieme") {
      await ev(([a, f, d]) => (async () => {
        const L = COPIONE.lu, Z = await L.salaECominci(a); window.__C = Z.C;
        const P = window.finestra("Paky");
        if (f === "solo") await L.regola(P, /Ognuno per sé/); else if (f === "insieme") await L.regola(P, /Tutti insieme/);
        await L.regola(P, d === "cosa" ? /Cosa ne pensi/ : d === "classico" ? /^🎯 Classico/ : /Misto/);
        if (f !== "squadre") await L.regola(P, /^1 giro$/);
      })(), [AMICI, quale, DOM]);
      await dorme(800);
      await due("Paky", "saletta-host");
      await due(AMICI[0], "saletta-amico");
      await ev(() => COPIONE.lu.comincia(window.__C));
      await dorme(1500);
      let v = await vm(), visti = {}, tardi = false, guarda = false;
      for (let giro = 0; giro < 200 && v.fase === "gioco"; giro++) {
        v = await vm();
        if (v.fase !== "gioco") break;
        const sens = await nomeId(v.sens), squadra = v.formula === "squadre";
        const altri = (v.players || []).filter(p => !p.via && p.id !== v.sens);
        const compagno = altri.filter(p => !squadra || p.sq === v.sensSq)[0], avversario = squadra ? altri.filter(p => p.sq !== v.sensSq)[0] : null;
        const k = v.passo + "/" + (v.sub || "") + "/" + v.modo;
        if (!visti[k]) {
          visti[k] = 1;
          if (v.passo === "sceglie") {
            await dorme(600);
            await due(sens, "sceglie-" + v.modo + "-" + v.sub + "-sensitivo");
            if (v.sub === "parola" || v.sub === "scala") await due(compagno && await nomeId(compagno.id), "sceglie-" + v.modo + "-aspetta");
            if (v.sub === "piazza") { await trascina(sens, 22, false); await dorme(400); await due(sens, "piazza-col-dito"); await trascina(sens, 22, "muovi"); }
            if (v.sub === "indizio") await ev(n => { const w = window.finestra(n), c = w.document.querySelector(".lu-campo"); if (c) { c.focus(); c.value = "Pasta al sugo"; } }, sens), await dorme(300), await due(sens, "indizio-scrive");
          } else if (v.passo === "indovina") {
            const nc = compagno && await nomeId(compagno.id);
            await dorme(500);
            await due(nc, "indovina-" + v.formula + "-prima");
            if (nc) { await trascina(nc, 70, false); await dorme(500); await due(nc, "indovina-dito-sulla-lancetta"); await trascina(nc, 70, "muovi"); await dorme(300); }
            const altro = altri.filter(p => p.id !== (compagno && compagno.id))[0];
            if (altro && !squadra) { await trascina(await nomeId(altro.id), 30); await ev(n => COPIONE.lu.tocca(window.finestra(n), /Blocca/), await nomeId(altro.id)); await dorme(600); await due(await nomeId(altro.id), "indovina-bloccato-vede-gli-altri"); }
            if (squadra && altri[1]) { await dorme(300); await due(await nomeId(altri.filter(p => p.sq === v.sensSq && p.id !== compagno.id)[0] ? altri.filter(p => p.sq === v.sensSq && p.id !== compagno.id)[0].id : altri[1].id), "indovina-compagno-vede-la-mano"); }
            await due(sens, "indovina-sensitivo-muto");
            if (avversario) await due(await nomeId(avversario.id), "indovina-altra-squadra");
          } else if (v.passo === "scommette") {
            await dorme(400);
            await due(avversario && await nomeId(avversario.id), "scommessa-chi-scommette");
            await due(compagno && await nomeId(compagno.id), "scommessa-aspetta");
          } else if (v.passo === "rivela") {
            await dorme(900); await due("Paky", "rivela-rullo");
            await dorme(1600); await due("Paky", "rivela-esito");
            await due(sens, "rivela-sensitivo");
          }
        }
        // chi arriva tardi e chi guarda, al secondo turno
        if (!tardi && v.turno >= 2 && v.passo === "sceglie") {
          tardi = true;
          await ev(c => window.apriTel("Tom", { hash: "gioco=lunghezza&stanza=" + c, x: 1500, salaSempre: true }), await ev(() => window.__C));
          await dorme(4500);
          await due("Tom", "arriva-tardi");
          await ev(c => window.apriTel("Dina", { hash: "gioco=lunghezza&stanza=" + c + "&guarda=1", x: 1650, salaSempre: true }), await ev(() => window.__C));
          await dorme(4500);
          await due("Dina", "guarda-col-link");
          visti = {};   // le foto del turno dopo, con Tom dentro
        }
        if (tardi && !guarda && v.turno >= 3 && v.passo === "indovina") { guarda = true; await due("Tom", "tardi-gia-dentro"); await due("Dina", "guarda-indovina"); }
        await passo();
        if (v.formula === "squadre" && v.turno > 6) break;
      }
      if ((await vm()).fase === "gioco") await ev(() => COPIONE.lu.finoAllaFine(window.__C, 300000, { veloce: true }));
      await dorme(1500);
      await due("Paky", "fine-host");
      await due(AMICI[0], "fine-amico");
      await due("Dina", "fine-guarda");
    } else if (/^locale/.test(quale)) {
      await ev(async ([ins, d]) => {
        const w = await window.apriTel("Paky", { x: 0 }), A = COPIONE.aiuti;
        const tess = await window.aspetta(function () { return A.tessera(w, "Stessa Lunghezza d'Onda"); }, 6000); tess.click(); await window.dorme(600);
        window.clicca(w, /Sullo stesso telefono/, ".modo-grande, button, [role=button]"); await window.dorme(600);
        while (w.document.querySelectorAll("input[placeholder^='Giocatore']").length < 4) { window.clicca(w, /Aggiungi giocatore/); await window.dorme(120); }
        ["Paky", "Giulia", "Luca", "Sara"].forEach(function (n, i) { var inp = w.document.querySelectorAll("input[placeholder^='Giocatore']")[i]; if (inp) { inp.value = n; inp.dispatchEvent(new w.Event("input", { bubbles: true })); } });
        window.clicca(w, /Avanti/); await window.dorme(600);
        window.clicca(w, ins ? /Tutti insieme/ : /Due squadre/, ".modo-chip"); window.clicca(w, d === "cosa" ? /Cosa ne pensi/ : d === "classico" ? /Classico/ : /Misto/, ".modo-chip"); await window.dorme(200);
      }, [quale === "locale-insieme", DOM]);
      await due("Paky", "impostazioni");
      await ev(() => { const w = window.finestra("Paky"); window.clicca(w, /Comincia/); });
      await dorme(800);
      for (let k = 0; k < 60; k++) {
        const t = await ev(() => window.testo(window.finestra("Paky")));
        if (/Fine partita|Classifica finale|vince|Pareggio|voto alla compagnia/i.test(t) && /Rivincita|Cambia gioco|Esci/.test(t)) break;
        await due("Paky", "passo");
        const fatto = await ev(async () => {
          const w = window.finestra("Paky"), d = w.document, tt = window.testo(w), lu = COPIONE.lu;
          if (/Passa il telefono/.test(tt) && window.clicca(w, /^Sono /)) return "passa";
          if (/Le squadre/.test(tt) && window.clicca(w, /^Via/)) return "via";
          const p = d.querySelector(".lu-btn.parola"); if (p) { p.click(); return "parola"; }
          const c = d.querySelector(".lu-carta"); if (c) { c.click(); return "carta"; }
          const campo = d.querySelector(".lu-campo"); if (campo && !campo.value) { campo.value = "Pasta al sugo"; campo.dispatchEvent(new w.Event("input", { bubbles: true })); }
          if (lu.tocca(w, /Fatto: telefono/)) return "fatto";
          const lm = [].filter.call(d.querySelectorAll(".lu-pan button"), b => /Lo metto qui/.test(b.textContent))[0];
          if (lm) { await lu.trascina(w, 30); await window.dorme(100); lm.click(); return "piazza"; }
          if (/Ci siamo/.test(tt)) { await lu.trascina(w, 60); lu.tocca(w, /Ci siamo/); return "ok"; }
          if (lu.tocca(w, /Più a sinistra/)) return "scom";
          if (lu.tocca(w, /Svela/)) { await window.dorme(2400); return "svela"; }
          if (lu.tocca(w, /Avanti|Classifica/)) return "avanti";
          return "?";
        });
        scriviD("   tocco: " + fatto);
        await dorme(500);
      }
      await dorme(1200);
      await due("Paky", "fine");
    }
    scriviD("✅ fine");
  } catch (e) { scriviD("❗ " + (e && e.stack || e)); }
  finally { await browser.close(); lascia(); }
})();

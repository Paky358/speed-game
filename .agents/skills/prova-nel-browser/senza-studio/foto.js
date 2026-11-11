// 📸 FOTO DEI GIOCHI SENZA LO STUDIO (11 nov 2026, chat «📺 I giochi senza lo studio»): una partita online in 3 (Paky tiene la
// partita, Luca e Sara entrano dal link; o Paky coi Bot), e una foto del telefono di Paky ogni tanto, alla misura scelta.
// Gli amici (e Paky, se serve) giocano da soli con una «guida» per gioco (scrivono, votano, girano…).
// Uso (server della copia acceso; un solo strumento alla volta sul PC, come prova.js):
//   "C:\Program Files\nodejs\node.exe" foto.js <porta> <gioco> <cartella> [360x640,412x915] [secondi=60] [ogni=3] [chi=Paky]
// Le foto: <cartella>/<gioco>-<misura>-<secondi>.png
const fs = require("fs"), path = require("path");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const [PORTA, GIOCO, DOVE] = [+(process.argv[2] || 8962), process.argv[3] || "balla", process.argv[4] || "foto"];
const MISURE = (process.argv[5] || "360x640,412x915").split(",").map(m => m.split("x").map(Number));
const DURATA = +(process.argv[6] || 60), OGNI = +(process.argv[7] || 3), CHI = process.argv[8] || "Paky";
fs.mkdirSync(DOVE, { recursive: true });

const GIOCHI = {
  // (carica: il file di prova del gioco, per le sue spie; tel: le opzioni dei telefoni; imp: le regole dell'host, se il file di prova le legge da w.__imp)
  balla: { nome: "La Balla Colossale", id: "balla", carica: "migliora/balla.js", tel: { spiaBalla: true }, imp: { round: 2, amici: "no", ride: false, sceglie: false } },
  ruota: { nome: "La Ruota della Fortuna", id: "ruota" },
  prezzo: { nome: "Il Prezzo è Giusto!", id: "prezzo" },
  timeline: { nome: "La linea del tempo", id: "timeline" },
  nomicose: { nome: "Nomi, Cose e Città", id: "nomicose" },
  patata: { nome: "La Patata Bollente", id: "patata" },
  ordine: { nome: "Parola d'ordine", id: "ordine", amici: ["Luca", "Sara", "Giulia"] },
};
const G = GIOCHI[GIOCO]; if (!G) { console.log("gioco sconosciuto"); process.exit(2); }

// la fila di prova.js: un Edge alla volta su tutto il PC
const CODA = "C:/Users/joetr/sg-strumenti/coda"; let mioLock = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mioLock) { try { fs.unlinkSync(mioLock); } catch (e) {} mioLock = null; } }
process.on("exit", lascia); process.on("SIGINT", () => { lascia(); process.exit(130); });
async function turno() {
  try { fs.mkdirSync(CODA, { recursive: true }); } catch (e) {}
  mioLock = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mioLock, String(process.pid));
  for (let detto = false; ;) {
    const vivi = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; });
    if (vivi[0] === path.basename(mioLock)) return;
    if (!detto) { console.log("⏳ aspetto il mio turno…"); detto = true; }
    await new Promise(r => setTimeout(r, 2000));
  }
}

// le guide: a ogni giro (ogni 0,4 s) fanno giocare i telefoni (w = finestra, v = foto della partita)
const GUIDA = `
  window.__guida = function (n, w, v, k) {
    var d = w.document;
    function vis(e) { if (!e) return false; var r = e.getBoundingClientRect(); return r.width > 2 && r.height > 2; }
    function tocca(e) { if (e && vis(e) && !e.disabled) { e.click(); return true; } return false; }
    var g = ${JSON.stringify(GIOCO)};
    if (g === "balla") {
      var velo = d.querySelector(".bc-velo.on:not(.via)");
      if (v.fase === "categoria") { tocca(d.querySelector(".bc-cat-c:not(:disabled)")); return; }
      if (velo && velo.querySelector(".bc-penna") && !w.__scritto) {
        if (k % 8 !== 3) return;   // (si aspetta un po': così si vede il foglio)
        [].forEach.call(velo.querySelectorAll(".bc-penna"), function (t, i) { t.value = "balla di " + n + (i ? " due" : ""); t.dispatchEvent(new w.Event("input", { bubbles: true })); });
        w.__scritto = v.giro + "|" + (v.rif || 0); tocca(velo.querySelector(".bc-ok")); return;
      }
      if (velo && velo.querySelector(".bc-scelta")) { var b = [].filter.call(velo.querySelectorAll(".bc-scelta"), function (x) { return !x.disabled; })[0]; if (b && k % 6 === 2) { b.click(); tocca(velo.querySelector(".bc-ok")); } return; }
      if (w.__scritto && w.__scritto !== v.giro + "|" + (v.rif || 0)) w.__scritto = null;
      if (v.fase === "punti" && k % 10 === 5) { var av = [].filter.call(d.querySelectorAll("button"), function (x) { return /Avanti/.test(x.textContent) && vis(x); })[0]; tocca(av); }
    }
    if (g === "ruota") {   // chi è di turno: gira, poi chiama una consonante (due tocchi), ogni tanto compra una vocale
      var mio = (v.giocatori || []).filter(function (p) { return p.nome === n; })[0];
      if (!mio || v.turno !== mio.id || k % 4 !== 1) return;
      var lib = function (voc) { return [].filter.call(d.querySelectorAll(".ru-qwerty .ru-btn.lettera"), function (b) { return !b.disabled && (voc ? b.classList.contains("voc") : !b.classList.contains("voc")) && vis(b); }); };
      if (v.fase === "gira") { var bg = d.querySelector(".ru-btn.gira"); if (bg && !bg.disabled) bg.click(); return; }
      if (v.fase === "consonante" || v.fase === "vocale" || v.fase === "express") { var l = lib(v.fase === "vocale"); if (l.length) { var b2 = l[(k * 7) % l.length]; b2.click(); setTimeout(function () { b2.click(); }, 900); } return; }
    }
  };
`;

const SCEN = `
  var W = window, no = function (p) { throw new Error(p); };
  ${GUIDA}
  COPIONE.aggiungi("foto", { nome: "foto", fai: async function () {
    var TEL = ${JSON.stringify(G.tel || {})};
    var P = await W.apriTel("Paky", Object.assign({ x: 0, prima: function (w) { w.__imp = ${JSON.stringify(G.imp || null)}; } }, TEL)), C = await W.apriStanza(P, ${JSON.stringify(G.nome)});
    var amici = ${JSON.stringify(G.amici || ["Luca", "Sara"])};
    for (var n of amici) await W.apriTel(n, Object.assign({ hash: "gioco=${G.id}&stanza=" + C, x: 1200 }, TEL));
    function vmC() { var s = W.statoStanza(C); return (s && s.vm) || {}; }
    if (!await W.aspetta(function () { var v = vmC(); return (v.players || v.giocatori || []).length >= amici.length + 1; }, 15000)) no("nella saletta non ci sono tutti");
    await W.dorme(1200);
    W.__pronto = 1; await W.aspetta(function () { return W.__misura; }, 60000);
    if (!W.clicca(P, /Comincia/)) no("non trovo Comincia");
    var t0 = Date.now(), k = 0, ult = -1;
    while (Date.now() - t0 < W.__durata * 1000) {
      var v = vmC();
      ["Paky"].concat(amici).forEach(function (n) { var w = W.finestra(n); if (w && (n !== "Paky" || W.__guidaPaky)) try { W.__guida(n, w, v, k); } catch (e) {} });
      var sec = Math.floor((Date.now() - t0) / 1000);
      if (sec % W.__ogni === 0 && sec !== ult) { ult = sec; W.__scatta = sec; await W.aspetta(function () { return W.__scattato === sec; }, 8000); }
      k++; await W.dorme(400);
    }
    return "fatto";
  } });
`;

(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--autoplay-policy=no-user-gesture-required"] });
  try {
    for (const [L, A] of MISURE) {
      const ctx = await b.newContext({ viewport: { width: 1700, height: 1000 }, deviceScaleFactor: 2, serviceWorkers: "block" });
      const p = await ctx.newPage(); p.on("pageerror", e => console.log("errore: " + e.message));
      await p.goto("http://localhost:" + PORTA + "/sw.js");
      await p.evaluate(async ([scen, dur, ogni, chi, carica]) => {
        const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
        if (carica) await window.COPIONE.carica(carica);
        (0, eval)(scen); window.__guidaTutti = !!(window.__guida + "").match(/ruota/); window.__durata = dur; window.__ogni = ogni; window.__guidaPaky = chi !== "Paky" || window.__guidaTutti;
        window.__esito = null; window.COPIONE.prova("foto").then(r => { window.__esito = r; }, e => { window.__esito = "ERRORE " + e; });
      }, [SCEN, DURATA, OGNI, CHI, G.carica || null]);
      await p.waitForFunction(() => window.__pronto || window.__esito, null, { timeout: 90000 });
      await p.evaluate(([L, A, chi]) => {
        document.querySelectorAll("iframe").forEach((f, i) => { f.style.transform = "none"; f.style.width = L + "px"; f.style.height = A + "px"; f.style.left = (i * (L + 10)) + "px"; });
        const f = document.getElementById("tel-" + chi); if (f) f.contentWindow.dispatchEvent(new f.contentWindow.Event("resize"));
        window.__misura = 1;
      }, [L, A, CHI]);
      let fatte = 0;
      while (true) {
        const st = await p.evaluate(() => ({ s: window.__scatta, e: window.__esito }));
        if (st.e) { console.log(L + "x" + A + ": " + st.e); break; }
        if (st.s != null && st.s !== -1) {
          await p.waitForTimeout(60);
          await p.locator("#tel-" + CHI).screenshot({ path: path.join(DOVE, GIOCO + "-" + L + "x" + A + "-" + String(st.s).padStart(3, "0") + ".png") });
          await p.evaluate(s => { window.__scattato = s; window.__scatta = -1; }, st.s); fatte++;
        }
        await p.waitForTimeout(100);
      }
      console.log("foto: " + fatte);
      await ctx.close();
    }
  } finally { await b.close().catch(() => {}); lascia(); }
})();

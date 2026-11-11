// ⏱️ QUANTO CI METTE UNA PARTITA ONLINE A PARTIRE (11 nov 2026, chat «📺 I giochi senza lo studio»).
// Online in 3 (Paky tiene la partita, Luca e Sara entrano dal link), computer rallentato (di partenza 4 volte, come un telefono medio).
// Si misura sul telefono di Paky (gli altri due telefoni restano nascosti: girano ma non si disegnano):
//   - «parte»: dal tocco su «Comincia» a quando si vede la prima cosa da giocare (la prima domanda, la ruota da girare…);
//   - gli scatti nei primi 40 secondi: fotogrammi più lunghi di 50 ms (lo schermo si ferma) e il più lungo;
//   - il lavoro pesante del processore (lavori più lunghi di 50 ms, in tutto).
// Uso (il server della copia da misurare deve essere acceso; un solo strumento alla volta sul PC, come prova.js):
//   "C:\Program Files\nodejs\node.exe" avvio.js <porta> <gioco> [rallenta=4] [volte=2]
//   gioco = balla | ruota | prezzo | timeline | nomicose | patata | ordine
const fs = require("fs"), path = require("path");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const PORTA = +(process.argv[2] || 8962), GIOCO = process.argv[3] || "balla", RATE = +(process.argv[4] || 4), VOLTE = +(process.argv[5] || 2);

// la prima cosa da giocare, gioco per gioco (w = la finestra di Paky, v = la foto della partita)
const GIOCHI = {
  balla:    { nome: "La Balla Colossale", id: "balla", pronto: "(v.fase === 'categoria' || v.fase === 'notizia') && vis(w, '.bc-cat-c, .bc-occhio')" },
  ruota:    { nome: "La Ruota della Fortuna", id: "ruota", pronto: "v.fase !== 'lobby' && !v.sigla && vis(w, '.ru-tab') && !w.document.querySelector('.ru-sopra.sigla, .ru-sopra.via')" },
  prezzo:   { nome: "Il Prezzo è Giusto!", id: "prezzo", pronto: "v.fase === 'offerta' && vis(w, '.pz-sch')" },
  timeline: { nome: "La linea del tempo", id: "timeline", pronto: "v.fase && v.fase !== 'lobby' && vis(w, '.tl-card, .tl-ev, .tl-mano')" },
  nomicose: { nome: "Nomi, Cose e Città", id: "nomicose", pronto: "v.fase && v.fase !== 'lobby' && vis(w, '.ncc-lettera, .nc-lettera, .ncc-rullo')" },
  patata:   { nome: "La Patata Bollente", id: "patata", pronto: "v.fase && v.fase !== 'lobby' && vis(w, '.pt-cat, .pt-bomba, .pa-cat')" },
  ordine:   { nome: "Parola d'ordine", id: "ordine", pronto: "v.fase && v.fase !== 'lobby' && vis(w, '.po-carta, .or-carta, .od-carta')" },
};
const G = GIOCHI[GIOCO]; if (!G) { console.log("gioco sconosciuto: " + GIOCO); process.exit(2); }

// un Edge di prova alla volta su tutto il PC (la stessa fila di prova.js)
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mioLock = null;
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

const SCEN = (g) => `
  var W = window, no = function (p) { throw new Error(p); };
  COPIONE.aggiungi("avvio", { nome: "avvio", fai: async function () {
    window.vis = function (w, sel) { var l = w.document.querySelectorAll(sel); for (var i = 0; i < l.length; i++) { var r = l[i].getBoundingClientRect(); if (r.width > 4 && r.height > 4 && r.bottom > 0 && r.top < w.innerHeight) return true; } return false; };
    var P = await W.apriTel("Paky", { x: 0 }), C = await W.apriStanza(P, ${JSON.stringify(g.nome)});
    for (var n of ["Luca", "Sara"]) await W.apriTel(n, { hash: "gioco=${g.id}&stanza=" + C, x: 400 });
    ["Luca", "Sara"].forEach(function (n) { var f = document.getElementById("tel-" + n); if (f) f.style.visibility = "hidden"; });
    var f0 = document.getElementById("tel-Paky"); f0.style.transform = "none";   // Paky a grandezza vera (360x740)
    function vmC() { var s = W.statoStanza(C); return (s && s.vm) || {}; }
    if (!await W.aspetta(function () { var v = vmC(); return (v.players || v.giocatori || []).length >= 3; }, 15000)) no("nella saletta non ci sono in 3");
    await W.dorme(1500);
    window.__pronto = 1; await W.aspetta(function () { return window.__via; }, 30000);
    var lt = [], fr = [], ult = 0, reg = true, fasi = [], uf = "";
    try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { lt.push(Math.round(e.duration)); }); }).observe({ entryTypes: ["longtask"] }); } catch (e) {}
    (function f(t) { if (!reg) return; if (ult) fr.push(t - ult); ult = t; requestAnimationFrame(f); })(0);
    var t0 = performance.now();
    if (!W.clicca(P, /Comincia/)) no("non trovo Comincia");
    var parte = 0, v, visto = {};
    while (performance.now() - t0 < 40000) {
      v = vmC(); var fa = (v.fase || "") + (v.sigla ? "+sigla" : ""); if (fa !== uf) { uf = fa; fasi.push(Math.round(performance.now() - t0) + " " + fa); }
      if (!parte) { var w = P; try { if (${g.pronto}) parte = Math.round(performance.now() - t0); } catch (e) {} }
      [".st-vista", ".bc-cat-c", ".bc-occhio", ".ru-tab", ".stp-vista"].forEach(function (q) { if (!visto[q] && P.document.querySelector(q)) { visto[q] = 1; fasi.push(Math.round(performance.now() - t0) + " c'è " + q); } });
      await W.dorme(50);
    }
    reg = false;
    var lunghi = fr.filter(function (d) { return d > 50; });
    return JSON.stringify({ parte: parte, frame: fr.length, scatti: lunghi.length, maxFrame: Math.round(Math.max.apply(null, fr.concat([0]))),
      fermo: Math.round(lunghi.reduce(function (a, b) { return a + b; }, 0)), lavoroPesante: lt.reduce(function (a, b) { return a + b; }, 0), lavoriLunghi: lt.length, fasi: fasi, errori: W.erroriTel() });
  } });
`;

(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--autoplay-policy=no-user-gesture-required"] });
  const esiti = [];
  try {
    for (let k = 0; k < VOLTE; k++) {
      const ctx = await b.newContext({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2, serviceWorkers: "block" });
      const p = await ctx.newPage(); p.on("pageerror", e => console.log("errore: " + e.message));
      await p.goto("http://localhost:" + PORTA + "/sw.js");
      const cdp = await ctx.newCDPSession(p);
      await p.evaluate(async (scen) => {
        const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
        (0, eval)(scen);
        window.__esito = null; window.COPIONE.prova("avvio").then(r => { window.__esito = r; }, e => { window.__esito = "ERRORE " + e; });
      }, SCEN(G));
      await p.waitForFunction(() => window.__pronto || window.__esito, null, { timeout: 90000 });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: RATE });
      await p.evaluate(() => { window.__via = 1; });
      await p.waitForFunction(() => window.__esito, null, { timeout: 180000 });
      await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
      const r = await p.evaluate(() => { const e = window.__esito; const m = JSON.stringify(e).match(/\{\\?"parte.*\}/); return typeof e === "string" ? e : JSON.stringify(e); });
      console.log("giro " + (k + 1) + ": " + r);
      esiti.push(r);
      await ctx.close();
    }
  } finally { await b.close().catch(() => {}); lascia(); }
})();

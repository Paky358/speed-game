// 🎞️ SCATTI DEI RILANCI (26 nov 2026, il proprietario da ospite: «lagga un pochino durante i rilanci, giusto un po' più che per l'host»).
// Mini Asta online (asta normale a rilancio, senza giornata) in N telefoni (Paky tiene la partita), computer rallentato (di partenza 4
// volte), rilanci fitti per DUR secondi: tutti (anche chi tiene la partita) toccano il loro tasto «+1» a turno, ogni tanto lo stesso due volte di fila (il rialzo
// da solo), anche più tocchi al secondo. Per ogni telefono: quanti messaggi e quanto lavoro (il codice e la misura della pagina) per ogni
// messaggio, quanti byte; per tutti: i fotogrammi lunghi e dove va il tempo (profilo).
// Uso (server della copia acceso, un solo strumento alla volta sul PC):
//   PORTA=8995 node scatti-rilanci.js [telefoni=3] [rallenta=4] [secondi=10] [tocchi al secondo=4]
//   PRIMA=D:/…/asta-vecchio.js …   la stessa misura con un altro file del gioco (per il prima e dopo)
// Risultati anche in %TEMP%/scatti-rilanci (rilanci-N.json).
const DOVE = require("path").join(require("os").tmpdir(), "scatti-rilanci"); require("fs").mkdirSync(DOVE, { recursive: true });
const fs = require("fs"), path = require("path");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const N = +(process.argv[2] || 3), RATE = +(process.argv[3] || 4), DUR = +(process.argv[4] || 10), TPS = +(process.argv[5] || 4), PORTA = +(process.env.PORTA || 8995);
const CODA = "C:/Users/joetr/sg-strumenti/coda";
let mio = null;
function vivo(pid) { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } }
function lascia() { if (mio) { try { fs.unlinkSync(mio); } catch (e) {} mio = null; } }
process.on("exit", lascia);
async function turno() {
  fs.mkdirSync(CODA, { recursive: true }); mio = path.join(CODA, Date.now() + "-" + process.pid + ".lock"); fs.writeFileSync(mio, "rilanci");
  for (;;) { const v = fs.readdirSync(CODA).filter(f => f.endsWith(".lock")).sort().filter(f => { const pid = +f.split("-")[1].split(".")[0]; if (vivo(pid)) return true; try { fs.unlinkSync(path.join(CODA, f)); } catch (e) {} return false; }); if (v[0] === path.basename(mio)) return; await new Promise(r => setTimeout(r, 2000)); }
}
const SCEN = `
  COPIONE.aggiungi("misr", { nome: "misura rilanci", fai: async function () {
    var N = W.__misN, NOMI = ["Paky", "Giulia", "Luca", "Sara", "Bea", "Ugo", "Dino", "Lia"].slice(0, N), imp = { formato: "fanta", giornata: false };
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < N; i++) await W.apriTel(NOMI[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    NOMI.forEach(function (n, i) { var f = document.getElementById("tel-" + n); if (f) { f.style.left = (185 * (i % 4)) + "px"; f.style.top = (375 * Math.floor(i / 4)) + "px"; } });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === N; }, 15000)) no("non sono entrati in " + N);
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase === "asta"; }, 15000)) no("l'asta non comincia");
    await W.dorme(3000);
    function win(n) { return n === "Paky" ? P : W.finestra(n); }
    // il lavoro di ogni telefono per ogni messaggio che riceve: il codice che lo tratta e la misura della pagina che ne segue
    var S = {}; NOMI.forEach(function (n) { S[n] = { msg: 0, ms: 0, max: 0, byte: 0, foto: 0, fotoMs: 0, grandi: 0, tipi: {}, tap: 0, tapMs: 0 }; });
    function spia() {
      NOMI.forEach(function (n) {
        (W.BR.perNome[n] || []).forEach(function (c) {
          if (c.__mis) return; c.__mis = 1; var em = c.emit;
          c.emit = function (ev, topic, pl) {
            if (ev !== "message" || !W.__misOn) return em.apply(this, arguments);
            var w = win(n), t0 = performance.now(), r = em.apply(this, arguments);
            try { w.document.body.getBoundingClientRect(); } catch (e) {}
            var dt = performance.now() - t0, s = S[n], tx = String(pl), len = tx.length, tipo = "?";
            try { var j = JSON.parse(tx); tipo = (j && (j.t || (j.m && j.m.t) || (j.vm ? "vm" : ""))) || "?"; } catch (e) {}
            tipo = String(topic).split("/").pop() + ":" + tipo;
            s.msg++; s.ms += dt; if (dt > s.max) s.max = dt; s.byte += len; if (len > 8000) s.grandi++;
            var ti = s.tipi[tipo] = s.tipi[tipo] || { n: 0, ms: 0, byte: 0 }; ti.n++; ti.ms += dt; ti.byte += len;
            return r;
          };
        });
      });
    }
    spia();
    W.__misPronto = 1; await W.aspetta(function () { return W.__misVia; }, 30000);
    var fr = [], ult = 0, reg = true; (function f(t) { if (!reg) return; if (ult) fr.push(t - ult); ult = t; requestAnimationFrame(f); })(0);
    var lt = []; try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { if (reg) lt.push(Math.round(e.duration)); }); }).observe({ entryTypes: ["longtask"] }); } catch (e) {}
    W.__misOn = 1;
    var t0 = Date.now(), k = 0, tocchi = 0, fasi = {}, ospiti = NOMI.slice(), prima = null;   // (rilanciano tutti, anche chi tiene la partita: così host e ospiti si confrontano alla pari)
    while (Date.now() - t0 < W.__misDur * 1000) {
      spia();
      var v = vm(C); fasi[v.fase] = (fasi[v.fase] || 0) + 1;
      if (v.fase === "asta") {
        var chi = k % 4 === 3 && prima ? prima : ospiti[k % ospiti.length]; prima = chi;   // (ogni 4 tocchi lo stesso di prima: il rialzo da solo)
        var w = win(chi), b = [].slice.call(w.document.querySelectorAll(".st-piede .btn")).filter(function (x) { return !x.disabled && !/Passo/.test(x.textContent) && x.getClientRects().length; })[0];
        if (b) { var tt = performance.now(); b.click(); try { w.document.body.getBoundingClientRect(); } catch (e) {} S[chi].tap++; S[chi].tapMs += performance.now() - tt; tocchi++; }   // (il tocco: il telefono di chi tocca si ridisegna subito)
        k++;
      }
      await W.dorme(1000 / W.__misTps);
    }
    reg = false; W.__misOn = 0;
    var lenti = fr.filter(function (x) { return x > 34; }).length, persi = fr.reduce(function (s, x) { return s + Math.max(0, Math.round(x / 16.7) - 1); }, 0);
    var out = { N: N, tocchi: tocchi, fasi: fasi, fotogrammi: fr.length, lenti: lenti, persi: persi, peggio: fr.slice().sort(function (a, b) { return b - a; }).slice(0, 6).map(Math.round), longtask: lt.length, ltMs: lt.reduce(function (s, x) { return s + x; }, 0), tel: {} };
    NOMI.forEach(function (n) { var s = S[n]; out.tel[n] = { msg: s.msg, msPerMsg: s.msg ? +(s.ms / s.msg).toFixed(1) : 0, ms: Math.round(s.ms), max: Math.round(s.max), kB: Math.round(s.byte / 1024), grandi: s.grandi, tipi: s.tipi, tap: s.tap, msPerTap: s.tap ? +(s.tapMs / s.tap).toFixed(1) : 0 }; });
    W.__misFine = 1;
    return JSON.stringify(out);
  } });
`;
(async () => {
  await turno();
  const b = await chromium.launch({ channel: "msedge", headless: true, args: ["--disable-gpu", "--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--autoplay-policy=no-user-gesture-required"] });
  try {
    const ctx = await b.newContext({ viewport: { width: 760, height: 760 }, deviceScaleFactor: 1, serviceWorkers: "block" });
    const p = await ctx.newPage(); p.on("pageerror", e => console.log("errore: " + e.message));
    if (process.env.PRIMA) await p.route(u => new URL(u).pathname === "/js/games/asta.js", r => r.fulfill({ status: 200, contentType: "application/javascript; charset=utf-8", body: fs.readFileSync(process.env.PRIMA, "utf8") }));   // (PRIMA=file: il gioco di prima, per il confronto)
    await p.goto("http://localhost:" + PORTA + "/sw.js");
    const cdp = await ctx.newCDPSession(p);
    await p.evaluate(async ([scen, n, dur, tps]) => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/asta.js"); let a = await (await fetch("/.agents/skills/prova-nel-browser/preferiti/asta.js?" + Date.now())).text();
      const k = a.lastIndexOf("})();"); a = a.slice(0, k) + scen + a.slice(k); (0, eval)(a);
      window.__misN = n; window.__misDur = dur; window.__misTps = tps;
      window.__ris = null; window.COPIONE.prova("misr").then(r => (window.__ris = r), e => (window.__ris = "NO " + e.message));
    }, [SCEN, N, DUR, TPS]);
    let profilo = null;
    for (let i = 0; i < 4000; i++) {
      const s = await p.evaluate(() => ({ pronto: window.__misPronto, fine: window.__misFine, ris: window.__ris }));
      if (s.pronto) {
        await p.evaluate(() => { window.__misPronto = 0; });
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: RATE });
        await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 300 }); await cdp.send("Profiler.start");
        await p.evaluate(() => { window.__misVia = 1; });
      }
      if (s.fine && !profilo) { profilo = (await cdp.send("Profiler.stop")).profile; await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 }); }
      if (s.ris) break;
      await p.waitForTimeout(100);
    }
    const ris = await p.evaluate(() => window.__ris), m = /(\{[\s\S]*\})/.exec(String(ris));
    let d = null; try { d = JSON.parse(m[1]); } catch (e) { console.log("risultato: " + String(ris).slice(0, 600)); return; }
    fs.writeFileSync(DOVE + "/rilanci-" + N + ".json", JSON.stringify({ d, profilo }));
    console.log(`=== in ${N}, rallentato ×${RATE}, ${DUR} s, ${TPS} tocchi al secondo: ${d.tocchi} tocchi · fasi ${JSON.stringify(d.fasi)}`);
    console.log(`fotogrammi ${d.fotogrammi}, lenti (>34 ms) ${d.lenti}, persi ${d.persi}, i più lunghi ${d.peggio.join(" ")} ms · long task ${d.longtask} (${d.ltMs} ms)`);
    Object.keys(d.tel).forEach(n => { const t = d.tel[n]; console.log(`${n.padEnd(6)} ${String(t.msg).padStart(4)} messaggi · ${String(t.msPerMsg).padStart(5)} ms l'uno · ${String(t.ms).padStart(5)} ms in tutto · max ${t.max} · ${t.kB} kB (${t.grandi} grandi) · tocchi ${t.tap}×${t.msPerTap}ms · ` + Object.keys(t.tipi).sort((a, b) => t.tipi[b].ms - t.tipi[a].ms).slice(0, 5).map(k => `${k} ${t.tipi[k].n}×${(t.tipi[k].ms / t.tipi[k].n).toFixed(1)}ms ${Math.round(t.tipi[k].byte / t.tipi[k].n)}B`).join(", ")); });
    if (profilo && profilo.nodes) {
      const nodi = {}; profilo.nodes.forEach(n => (nodi[n.id] = n));
      const self = {}; for (let j = 0; j < profilo.samples.length; j++) { const id = profilo.samples[j], dt = (profilo.timeDeltas[j + 1] || 0) / 1000; self[id] = (self[id] || 0) + dt; }
      const padre = {}; profilo.nodes.forEach(n => (n.children || []).forEach(c => (padre[c] = n.id)));
      const tot = {}, proprio = {};
      Object.keys(self).forEach(id => {
        const n = nodi[id], f = n.callFrame, key = (f.functionName || "(anonima)") + ":" + (f.lineNumber + 1) + " " + f.url.split("/").pop().split("?")[0];
        proprio[key] = (proprio[key] || 0) + self[id];
        const visti = {}; let x = +id; while (x != null && nodi[x]) { const c = nodi[x].callFrame, k2 = (c.functionName || "(anonima)") + ":" + (c.lineNumber + 1) + " " + c.url.split("/").pop().split("?")[0]; if (!visti[k2] && /\/js\//.test(c.url)) { visti[k2] = 1; tot[k2] = (tot[k2] || 0) + self[id]; } x = padre[x]; }
      });
      const top = (o, k) => Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, k).map(x => x + " " + Math.round(o[x]) + "ms").join(" · ");
      console.log("tempo proprio: " + top(proprio, 18));
      console.log("totale (codice del gioco): " + top(tot, 26));
    }
  } finally { await b.close().catch(() => {}); lascia(); }
})().catch(e => { console.log("NO " + (e && e.stack || e)); process.exit(1); });

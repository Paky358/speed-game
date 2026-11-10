// 🎞️ SCATTI DELLE BUSTE (10 nov 2026, novità v327): quanto si blocca lo schermo quando si aprono le buste e all'«AGGIUDICATO!» subito dopo.
// Asta a buste online in 3 (Paky host, Giulia e Luca), computer rallentato (di partenza 4 volte), N buste misurate una dopo l'altra.
// Uso (server della copia acceso sulla porta 8991, un solo strumento alla volta sul PC):
//   node scatti-buste.js [rallenta=4] [buste=3] [tutti|Paky|Giulia]      fotogrammi persi per fase + dove va il tempo (profilo)
//   TRACCIA=1 node scatti-buste.js 4 2                                       traccia completa (poi analizzala in Edge: about:tracing)
//   AB=1 / AB2=1                                                            a ogni busta un pezzo spento (faccine, ombre, buio, animazioni, stadio)
// Riferimento: prima della v327 l'apertura perdeva ~330 fotogrammi su 7,7 s (la scheda video piena), dopo 10-50. Risultati nella cartella scatti-buste dentro %TEMP%.
const DOVE = require("path").join(require("os").tmpdir(), "scatti-buste"); require("fs").mkdirSync(DOVE, { recursive: true });
const fs = require("fs");
const { chromium } = require("C:/Users/joetr/sg-strumenti/node_modules/playwright-core");
const RATE = +(process.argv[2] || 4), QUANTE = +(process.argv[3] || 3), SOLO = process.argv[4] || "tutti";
const VARIANTI = process.env.AB2 ? [["base", ""], ["senza faccine", ".st-tavolo img{visibility:hidden!important}"], ["senza stadio sotto", ".st-stadio:has(.st-apri)>:not(.st-apri){visibility:hidden!important}"], ["senza animazioni", ".st-tavolo,.st-tavolo *,.st-tavolo *::before{animation:none!important;transition:none!important}"], ["base", ""], ["base", ""]] : process.env.AB ? [["base", ""], ["senza faccine", ".st-tavolo img{visibility:hidden!important}"], ["senza ombre e filtri", ".st-tavolo *,.st-tavolo *::before,.st-tavolo *::after{box-shadow:none!important;filter:none!important;text-shadow:none!important;clip-path:none!important}"], ["senza buio", ".st-tavolo .buio{display:none!important}"], ["senza animazioni", ".st-tavolo,.st-tavolo *,.st-tavolo *::before{animation:none!important;transition:none!important}"], ["senza stadio sotto", ".st-stadio:has(.st-apri)>:not(.st-apri){visibility:hidden!important}"], ["base", ""]] : [["base", ""]];
const SCEN = `
  COPIONE.aggiungi("mis", { nome: "misura", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], o = await telefoniOnline({ formato: "fanta", compra: "buste", giornata: false }, NOMI), P = o.P, C = o.C, vistoN = 0, fatte = 0, out = [];
    function win(n) { return n === "Paky" ? P : W.finestra(n); }
    var SOLO = W.__misSolo;
    if (SOLO !== "tutti") NOMI.forEach(function (n) { if (n !== SOLO) { var fr = [].slice.call(document.querySelectorAll("iframe")).filter(function (f) { return f.contentWindow === win(n); })[0]; if (fr) fr.style.visibility = "hidden"; } });
    var lt = []; try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { lt.push([Math.round(e.startTime), Math.round(e.duration)]); }); }).observe({ entryTypes: ["longtask"] }); } catch (e) {}
    var fr = [], ult = 0, reg = false; (function f(t) { if (reg && ult) fr.push([Math.round(ult), Math.round(t - ult)]); ult = t; requestAnimationFrame(f); })(0);
    while (fatte < W.__misQuante && Date.now() < Date.now() + 1) {
      var v = vm(C); if (v.fase !== W.__uf) { W.__uf = v.fase; (W.__log = W.__log || []).push("MIS fase " + v.fase + " " + JSON.stringify(v.busta || null).slice(0, 120) + " q=" + W.__misQuante); }
      if (v.fase === "fine") break;
      if (v.fase !== "busta" || !v.busta || v.busta.n === vistoN) { await W.dorme(120); continue; }
      var b = v.busta, gara = b.gara.map(function (id) { return nomeDiId(C, id); }); vistoN = b.n; (W.__log = W.__log || []).push("MIS busta " + b.n + " gara " + JSON.stringify(gara) + " sp " + b.sp);
      if (gara.length < 3 || b.sp) { gara.forEach(function (n, j) { if (n !== "Paky") manda(n, { t: "bustaF", n: b.n, q: j === 0 ? 1 : 0 }); }); if (gara.indexOf("Paky") >= 0) { var ps = await W.aspetta(function () { return bott(P, ".st-bf-tasti .btn", /Passo|Resto a/); }, 4000); if (ps) ps.click(); } continue; }
      var carta = (v.busta.carta || {}).nome || "?";
      var vi = fatte % 2 ? "Luca" : "Giulia", pe = fatte % 2 ? "Giulia" : "Luca"; manda(vi, { t: "bustaF", n: b.n, q: 3 + (fatte >> 1) }); manda(pe, { t: "bustaF", n: b.n, q: 2 });
      var pa = await W.aspetta(function () { return bott(P, ".st-bf-tasti .btn", /Passo/); }, 4000);
      await W.dorme(fatte === 0 ? 4000 : 1500);
      W.__misPronto = 1; await W.aspetta(function () { return W.__misVia; }, 20000); W.__misVia = 0;
      var stili = NOMI.map(function (n) { var w = win(n), e = w.document.createElement("style"); e.textContent = W.__misCss || ""; w.document.head.appendChild(e); return e; });
      fr.length = 0; lt.length = 0; reg = true;
      var t0 = performance.now(), m = { carta: carta };
      console.timeStamp("misT0"); pa.click();
      await W.aspetta(function () { return vm(C).fase === "apri"; }, 6000); m.apri = Math.round(performance.now() - t0);
      await W.aspetta(function () { return vm(C).fase === "esito"; }, 15000); m.esito = Math.round(performance.now() - t0); console.timeStamp("misEsito");
      m.oro = !!q(P, ".st-fig.oro");
      await W.dorme(3600); reg = false;
      await W.aspetta(function () { return q(P, ".st-fig.oro") ? (m.oro = true) : false; }, 10);
      m.fr = fr.map(function (x) { return [x[0] - Math.round(t0), x[1]]; }); m.lt = lt.map(function (x) { return [x[0] - Math.round(t0), x[1]]; });
      stili.forEach(function (e) { if (e.parentNode) e.parentNode.removeChild(e); }); m.var = W.__misNome;
      out.push(m); fatte++;
      W.__misFine = 1; await W.aspetta(function () { return W.__misAvanti; }, 30000); W.__misAvanti = 0;
    }
    return JSON.stringify(out);
  } });
`;
(async () => {
  const b = await chromium.launch({ channel: "msedge", args: ["--disable-background-timer-throttling", "--disable-renderer-backgrounding", "--disable-backgrounding-occluded-windows", "--autoplay-policy=no-user-gesture-required"] });
  try {
    const ctx = await b.newContext({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2, serviceWorkers: "block" });
    const p = await ctx.newPage(); p.on("pageerror", e => console.log("errore: " + e.message));
    await p.goto("http://localhost:8991/sw.js");
    const cdp = await ctx.newCDPSession(p);
    await p.evaluate(async ([scen, q, solo]) => {
      const s = await (await fetch("/.agents/skills/prova-nel-browser/copione-prova.js?" + Date.now())).text(); (0, eval)(s);
      await window.COPIONE.carica("preferiti/asta.js"); let a = await (await fetch("/.agents/skills/prova-nel-browser/preferiti/asta.js?" + Date.now())).text();
      const k = a.lastIndexOf("})();"); a = a.slice(0, k) + scen + a.slice(k); (0, eval)(a);
      window.__misQuante = q; window.__misSolo = solo;
      window.__ris = null; window.COPIONE.prova("mis").then(r => (window.__ris = r), e => (window.__ris = "NO " + e.message));
    }, [SCEN, QUANTE, SOLO]);
    const profili = [];
    for (let i = 0; i < 4000; i++) {
      const s = await p.evaluate(() => ({ pronto: window.__misPronto, fine: window.__misFine, ris: window.__ris, log: (window.__log || []).splice(0) }));
      s.log.forEach(x => console.log(x));
      if (s.ris) { console.log(String(s.ris).slice(0, 200).startsWith("[") || String(s.ris).indexOf("mis OK") >= 0 ? "" : s.ris); break; }
      if (s.pronto) {
        await p.evaluate(() => { window.__misPronto = 0; });
        console.log("pronto: rallento"); await cdp.send("Emulation.setCPUThrottlingRate", { rate: RATE }); console.log("profilo");
        if (process.env.TRACCIA) await b.startTracing(p, { path: DOVE + "/lag-traccia-" + profili.length + ".json", categories: ["devtools.timeline", "disabled-by-default-devtools.timeline", "blink", "cc", "gpu", "viz", "benchmark", "rail", "toplevel"] }); else { await cdp.send("Profiler.enable"); await cdp.send("Profiler.setSamplingInterval", { interval: 200 }); await cdp.send("Profiler.start"); }
        const V = VARIANTI[profili.length % VARIANTI.length]; await p.evaluate(v => { window.__misCss = v[1]; window.__misNome = v[0]; window.__misVia = 1; }, V);
      }
      if (s.fine) {
        if (process.env.TRACCIA) { await b.stopTracing(); profili.push({}); } else { const { profile } = await cdp.send("Profiler.stop"); profili.push(profile); }
        await cdp.send("Emulation.setCPUThrottlingRate", { rate: 1 });
        await p.evaluate(() => { window.__misFine = 0; window.__misAvanti = 1; });
      }
      await p.waitForTimeout(80);
    }
    let ris = await p.evaluate(() => window.__ris);
    fs.writeFileSync(DOVE + "/lag-ris.txt", String(ris)); const m = /(\[\{[\s\S]*\}\])/.exec(String(ris)); let dati = [];
    try { dati = JSON.parse(m ? m[1] : ris); } catch (e) { console.log("risultato: " + String(ris).slice(0, 400)); }
    if (!process.env.TRACCIA) fs.writeFileSync(DOVE + "/lag-profili.json", JSON.stringify(profili));
    dati.forEach((d, i) => {
      const scatti = d.fr.filter(x => x[1] > 50), peggio = d.fr.slice().sort((a, b) => b[1] - a[1]).slice(0, 8);
      const fase = t => t < d.apri ? "prima" : t < d.esito ? "apertura" : "aggiudicato";
      const per = {}; d.fr.forEach(x => { const f = fase(x[0]); per[f] = per[f] || { n: 0, lenti: 0, persi: 0 }; per[f].n++; if (x[1] > 34) per[f].lenti++; per[f].persi += Math.max(0, Math.round(x[1] / 16.7) - 1); });
      console.log(`\n=== busta ${i + 1} [${d.var}]: ${d.carta}${d.oro ? " (oro)" : ""} · apertura a ${d.apri} ms, aggiudicato a ${d.esito} ms`);
      console.log("fotogrammi per fase: " + JSON.stringify(per));
      console.log("i più lunghi [quando, ms]: " + peggio.map(x => `[${x[0]} ${fase(x[0])}, ${x[1]}]`).join(" "));
      console.log("long task [quando, ms]: " + d.lt.map(x => `[${x[0]} ${fase(x[0])}, ${x[1]}]`).join(" "));
      // il profilo: tempo per funzione (proprio e totale)
      const pr = profili[i]; if (!pr || !pr.nodes) return;
      const nodi = {}; pr.nodes.forEach(n => (nodi[n.id] = n));
      const self = {}; for (let j = 0; j < pr.samples.length; j++) { const id = pr.samples[j], dt = (pr.timeDeltas[j + 1] || 0) / 1000; self[id] = (self[id] || 0) + dt; }
      const padre = {}; pr.nodes.forEach(n => (n.children || []).forEach(c => (padre[c] = n.id)));
      const tot = {}, proprio = {};
      Object.keys(self).forEach(id => {
        const n = nodi[id], nome = n.callFrame.functionName || "(anonima)", key = nome + ":" + (n.callFrame.lineNumber + 1) + (n.callFrame.url.indexOf("asta.js") >= 0 ? "" : " " + n.callFrame.url.split("/").pop());
        proprio[key] = (proprio[key] || 0) + self[id];
        const visti = {}; let x = +id; while (x != null && nodi[x]) { const c = nodi[x].callFrame, k2 = (c.functionName || "(anonima)") + ":" + (c.lineNumber + 1); if (!visti[k2] && c.url.indexOf("asta.js") >= 0) { visti[k2] = 1; tot[k2] = (tot[k2] || 0) + self[id]; } x = padre[x]; }
      });
      const top = (o, n) => Object.keys(o).sort((a, b) => o[b] - o[a]).slice(0, n).map(k => k + " " + Math.round(o[k]) + "ms").join(" · ");
      console.log("tempo proprio: " + top(proprio, 16));
      console.log("totale (asta.js): " + top(tot, 22));
    });
    fs.writeFileSync(DOVE + "/lag-ultimo.json", JSON.stringify(dati));
  } finally { await b.close().catch(() => {}); }
})().catch(e => { console.log("NO " + (e && e.stack || e)); process.exit(1); });

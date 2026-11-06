// PROVE DELLA PORTA INVIOLATA DA SUBITO (6 nov 2026, il proprietario: «tutti partono con la porta inviolata, non che si aggiunge
// alla fine»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-porta.js"); await COPIONE.prova("pi1")
// Con Edge invisibile: prova.js --porta 8981 --carica preferiti/asta.js,preferiti/asta-porta.js --prova pi1,pi2 --timeout 900
//
// pi1 Il motore e il conto dei quadretti, 600 giornate con rose a caso da 2 a 10: i dati della giornata sono quelli di sempre (il 🔒 +1
//     di fine partita solo ai portieri che non prendono gol, niente momenti nuovi: la foto per il vice e la ripresa non crescono);
//     rifacendo il conto come i quadretti (+1 a ogni portiere dal fischio d'inizio, −1 in più al suo primo 🥅) si arriva sempre
//     ai fantavoti veri, e la porta si perde solo con un gol subito.
// pi2 Online in 2 (Paky tiene la partita, Giulia), col ⏩: al fischio d'inizio su tutti e due i telefoni i quadretti dicono 6 a
//     calciatore + 1 per ogni portiere, col 🔒; il 🔒 sparisce da un quadretto SOLO mentre sul campo c'è un gol (mai prima: niente
//     spoiler), con la scritta «🧤 Porta inviolata persa»; dopo il fischio nessuna «🔒 PORTA INVIOLATA»; alla prima pagella i
//     quadretti dicono già i punti veri.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function num(x) { return String(Math.round(x * 2) / 2).replace(".", ","); }
  async function motore(w) {   // il file del gioco con le funzioni di dentro portate fuori (solo per la prova), dentro il telefono w
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");   // (dal 4 nov i giochi e i loro dati arrivano quando servono)
    if (!w.SG_FANTA_CALCIATORI) no("il listone del fanta non arriva");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {};
    var aggancio = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(aggancio) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(aggancio, "FUORI.mazzo = costruisciMazzoFanta; FUORI.giornata = giornataSerieA; FUORI.chiave = chiaveCalc; " + aggancio);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    return fuori;
  }

  COPIONE.aggiungi("pi1", { nome: "Fanta, la giornata: la porta inviolata c'è dal fischio d'inizio e si perde al primo gol subito (motore e conto dei quadretti)", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), ko = [], portieri = 0, persi = 0, giornate = 600;
    for (var i = 0; i < giornate && ko.length < 20; i++) {
      var n = 2 + (i % 9), m = M.mazzo(n), righe = [], per = { P: [], D: [], C: [], A: [] };
      m.forEach(function (c) { c.valore = 4 + (i * 7 + c.nome.length) % 20; (per[c.ruolo] = per[c.ruolo] || []).push(c); });
      for (var k = 0; k < n; k++) righe.push({ id: "g" + k, nome: "G" + k, kit: [per.P[k], per.D[k], per.C[2 * k], per.C[2 * k + 1], per.A[k]].filter(Boolean), totale: 50, crediti: 0 });
      M.giornata(righe, {});
      righe.forEach(function (r) {
        var b = 0, v = 0;
        r.gio.cal.forEach(function (c, k) {
          var cp = r.kit[k], dove = "giornata " + i + " " + cp.nome + " (" + cp.ruolo + ")", inv = c.ev.filter(function (e) { return e.t === "inv"; }), sub = c.ev.filter(function (e) { return e.t === "sub"; });
          v += c.v; c.ev.forEach(function (e) { b += e.d; if (e.t === "invP" || e.e === -2) ko.push(dove + ": un momento nuovo nei dati (" + e.t + ")"); });
          if (cp.ruolo !== "P") { if (inv.length) ko.push(dove + ": porta inviolata a chi non è portiere"); return; }
          portieri++;
          if (sub.length ? inv.length : inv.length !== 1 || inv[0].e !== -1 || inv[0].d !== 1) ko.push(dove + ": il 🔒 di fine partita non è come prima (" + JSON.stringify(inv) + ", gol subiti " + sub.length + ")");
          // il conto dei quadretti: +1 dal fischio d'inizio, poi i momenti in ordine; al primo 🥅 −1 in più; il 🔒 di fine partita non si mostra
          var bon = 1, ha = true;
          c.ev.forEach(function (e) { if (e.e < 0) return; var d = e.d; if (e.t === "sub" && ha) { ha = false; d -= 1; persi++; } bon += d; });
          if (Math.abs(c.v + bon - c.fv) > 1e-9) ko.push(dove + ": i quadretti arrivano a " + (c.v + bon) + " ma il fantavoto è " + c.fv);
          if (ha !== !sub.length) ko.push(dove + ": porta persa senza gol (o tenuta coi gol)");
        });
        if (Math.abs(r.gio.punti - (v + b)) > 1e-9) ko.push("giornata " + i + " " + r.nome + ": punti " + r.gio.punti + " invece di " + (v + b));
      });
    }
    if (ko.length) no(ko.length + " errori: " + ko.slice(0, 5).join(" · "));
    if (!portieri || !persi || persi === portieri) no("i casi non ci sono tutti: " + portieri + " portieri, " + persi + " porte perse");
    return giornate + " giornate da 2 a 10: dati come prima; " + portieri + " portieri col 🔒 +1 dal fischio d'inizio, " + persi + " porte perse al primo gol subito (" + Math.round(100 * persi / portieri) + "%); il conto dei quadretti arriva sempre ai fantavoti veri";
  } });

  COPIONE.aggiungi("pi2", { nome: "Fanta online in 2: i quadretti partono col 🔒 +1 dei portieri e lo perdono solo quando il gol si vede", fai: async function () {
    var NOMI = ["Paky", "Giulia"], imp = { formato: "fanta" }, x = [], ko = [], fino = Date.now() + 300000, visti = {};
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }); if (P.SG && P.SG.scaricaGioco) await P.SG.scaricaGioco("asta"); var C = await W.apriStanza(P, "L'Asta");
    await W.apriTel("Giulia", { hash: "gioco=asta&stanza=" + C, x: 185 });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 2; }, 12000)) no("Giulia non entra");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    while (Date.now() < fino && vm(C).fase !== "fine") {   // l'asta veloce (come pg1)
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(250); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      if (!a.leaderId) { var pr = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; })[0]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if ((n === "Paky" ? "host" : A.mioId(n)) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(300);
    }
    if (vm(C).fase !== "fine") no("il fanta online non finisce");
    var G = W.finestra("Giulia"), tutti = [P, G], cl = vm(C).classifica || [];
    if (!cl.length || !cl[0].gio) no("nella foto non c'è la giornata");
    for (var i = 0; i < tutti.length; i++) { var w = tutti[i]; if (!await W.aspetta(function () { return q(w, ".st-rivela"); }, 15000)) no("niente classifica delle rose"); W.clicca(w, /Salta/); }
    if (!await W.aspetta(function () { return tutti.every(function (w) { return q(w, ".st-gio-riga"); }); }, 10000)) no("la giornata non parte su tutti i telefoni");
    // al fischio d'inizio: 6 a calciatore + 1 per portiere, col 🔒
    await W.dorme(300);
    tutti.forEach(function (w, j) {
      qa(w, ".st-gio-riga").forEach(function (z) {
        var nome = z.querySelector(".st-gio-nome").textContent, r = cl.filter(function (y) { return y.nome === nome; })[0]; if (!r) return;
        var por = r.kit.filter(function (c) { return c.ruolo === "P"; }).length, atteso = num(6 * r.kit.length + por), lucch = z.querySelectorAll(".st-gio-ev span.inv").length;
        if (z.querySelector(".st-gio-pt").textContent !== atteso) ko.push(NOMI[j] + ": all'inizio il quadretto di " + nome + " dice " + z.querySelector(".st-gio-pt").textContent + " invece di " + atteso);
        if (lucch !== por) ko.push(NOMI[j] + ": all'inizio " + lucch + " 🔒 nel quadretto di " + nome + " invece di " + por);
      });
    });
    var m0 = q(P, ".st-msg.on"); x.push("inizio: «" + (m0 ? m0.textContent : "") + "»");
    tutti.forEach(function (w) { var b = q(w, ".st-bar-vel"); if (b && !b.classList.contains("on")) b.click(); });
    // durante: il 🔒 sparisce solo mentre sul campo c'è un gol con «🧤 Porta inviolata persa»
    var prima = tutti.map(function (w) { var o = {}; qa(w, ".st-gio-riga").forEach(function (z) { o[z.querySelector(".st-gio-nome").textContent] = z.querySelectorAll(".st-gio-ev span.inv").length; }); return o; });
    var persi = 0, dopoFischio = [], pagOk = null, t0 = Date.now();
    while (Date.now() - t0 < 240000) {
      tutti.forEach(function (w, j) {
        var m = q(w, ".st-msg.on"), mt = m ? m.textContent : "";
        if (/FISCHIO FINALE/.test(mt)) w.__fischio = 1;
        if (w.__fischio && /PORTA INVIOLATA!/.test(mt) && dopoFischio.indexOf(NOMI[j]) < 0) dopoFischio.push(NOMI[j]);
        qa(w, ".st-gio-riga").forEach(function (z) {
          var nome = z.querySelector(".st-gio-nome").textContent, n = z.querySelectorAll(".st-gio-ev span.inv").length;
          if (n < prima[j][nome]) {
            if (!/GOL|AUTOGOL|RIGORE/.test(mt) || !/Porta inviolata persa/.test(mt)) ko.push(NOMI[j] + ": il 🔒 di " + nome + " sparisce senza il gol sul campo («" + mt + "»)");
            else if (j === 0) persi++;
          }
          if (n > prima[j][nome]) ko.push(NOMI[j] + ": il 🔒 di " + nome + " torna");
          prima[j][nome] = n;
        });
      });
      var pg = q(P, ".st-pag.on:not(.live) .st-pag-tit");
      if (pg && /pagella/i.test(pg.textContent) && !/primo tempo/.test(pg.textContent) && !pagOk) {
        pagOk = [];
        qa(P, ".st-gio-riga").forEach(function (z) { var nome = z.querySelector(".st-gio-nome").textContent, r = cl.filter(function (y) { return y.nome === nome; })[0]; if (r && z.querySelector(".st-gio-pt").textContent !== num(r.gio.punti)) pagOk.push(nome + " " + z.querySelector(".st-gio-pt").textContent + " invece di " + num(r.gio.punti)); });
        break;
      }
      await W.dorme(60);
    }
    if (!pagOk) no("le pagelle finali non arrivano");
    if (pagOk.length) ko.push("alla prima pagella i quadretti non dicono i punti veri: " + pagOk.join(", "));
    if (dopoFischio.length) ko.push("dopo il fischio c'è ancora «🔒 PORTA INVIOLATA» per " + dopoFischio.join(", "));
    if (ko.length) no(ko.slice(0, 6).join(" · "));
    var tot = 0; cl.forEach(function (r) { r.gio.cal.forEach(function (c) { if (c.ev.some(function (e) { return e.t === "sub"; })) tot++; }); });
    x.push("porte perse viste sul campo da Paky: " + persi + " su " + tot + " (le altre si vedono «di colpo» o restano); alla prima pagella i punti veri");
    return x.join(" · ");
  } });
})();

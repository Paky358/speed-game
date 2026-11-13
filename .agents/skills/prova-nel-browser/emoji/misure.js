// MISURE per «😀 Emoji 3D al posto degli avatar» (13 nov 2026): prima e dopo, con la misura.js (processore rallentato ×4).
// emm1: apertura dell'app (un telefono, fino alle tessere della home), Sala in 8, Mini Asta online: «pronto» di 7 amici
//       (fotogrammi lunghi sul telefono dell'host mentre arrivano le spunte) e partenza (da «Comincia» a tutti fuori dalla saletta).
// I numeri escono nella riga dell'esito: «apertura X ms · pronto: fotogrammi > 50 ms N, il più lungo M ms · partenza P ms».
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  // i fotogrammi di un telefono: quanto dura ognuno (requestAnimationFrame) per ms millisecondi
  function fotogrammi(w, ms) {
    return new Promise(function (ok) {
      var l = [], prima = null, fine = w.performance.now() + ms;
      function f(t) { if (prima != null) l.push(t - prima); prima = t; if (t < fine) w.requestAnimationFrame(f); else ok(l); }
      w.requestAnimationFrame(f);
    });
  }
  COPIONE.aggiungi("emm1", { nome: "Misure: apertura, pronto in 8, partenza della Mini Asta online", fai: async function () {
    var t0 = performance.now();
    var P = await W.apriTel("Paky", { x: 0, salaSempre: true });
    if (!await W.aspetta(function () { return P.document.querySelector(".tessera"); }, 60000)) no("la home non arriva");
    var apertura = Math.round(performance.now() - t0);
    var amici = ["Giulia", "Luca", "Sara", "Marco", "Anna", "Pino", "Ugo"], w = { Paky: P };
    var S = await A.apriSalaNuova("Paky");
    for (var i = 0; i < amici.length; i++) w[amici[i]] = await W.apriTel(amici[i], { hash: "sala=" + S, x: 185 * (i + 1), salaSempre: true });
    if (!await W.aspetta(function () { return ((vm(S).membri) || []).length === 8; }, 60000)) no("nella Sala non siamo in 8 (" + ((vm(S).membri) || []).length + ")");
    // (come A.lanciaDallaSala, ma coi tempi lunghi: col processore rallentato ×4 tutto va più piano)
    if (!await W.aspetta(function () { return W.clicca(P, /Scegli (un|il primo) gioco|Prossimo gioco/); }, 30000)) no("non trovo «Scegli un gioco» nella Sala");
    var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 30000); if (!tess) no("non trovo la Mini Asta");
    tess.click();
    var C = await W.aspetta(function () { var c = A.codiceSaletta(P); return P.document.querySelector(".saletta-schermo") && c && c !== S ? c : null; }, 90000);
    if (!C) no("l'host non arriva nella saletta della Mini Asta");
    // tutti nella saletta del gioco
    if (!await W.aspetta(function () { return amici.every(function (n) { var f = W.finestra(n); return f && f.document.querySelector(".saletta-schermo"); }); }, 120000)) no("non tutti arrivano nella saletta");
    await W.dorme(2500);
    // «pronto»: i 7 amici toccano insieme, sul telefono dell'host si contano i fotogrammi lunghi per 3 s
    var spia = fotogrammi(P, 3000);
    amici.forEach(function (n) { W.clicca(W.finestra(n), /Sono pronto/); });
    var fr = await spia;
    var lunghi = fr.filter(function (x) { return x > 50; }).length, max = Math.round(Math.max.apply(null, fr.concat([0])));
    var media = Math.round(fr.reduce(function (a, b) { return a + b; }, 0) / Math.max(1, fr.length));
    // partenza: «Comincia» dell'host, fino a quando nessuno è più nella saletta
    await W.dorme(1000);
    var t1 = performance.now(), tutti = ["Paky"].concat(amici), arrivati = {};
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 8000)) no("l'host non ha «Comincia»");
    await W.aspetta(function () {
      var ora = Math.round(performance.now() - t1);
      tutti.forEach(function (n) { var f = W.finestra(n); if (!arrivati[n] && f && !f.document.querySelector(".saletta-schermo")) arrivati[n] = ora; });
      return Object.keys(arrivati).length === tutti.length;
    }, 150000);
    var tempi = tutti.map(function (n) { return arrivati[n]; }).filter(function (x) { return x != null; });
    var partenza = tempi.length ? Math.max.apply(null, tempi) + " ms per " + tempi.length + " su 8 (il primo " + Math.min.apply(null, tempi) + " ms)" : "nessuno è partito in 150 s («" + A.T(P).slice(0, 80) + "»)";
    return "apertura " + apertura + " ms · pronto: " + fr.length + " fotogrammi in 3 s, " + lunghi + " più lunghi di 50 ms, il più lungo " + max + " ms, media " + media + " ms · partenza " + partenza + " (3-2-1 compreso)";
  } });
})();

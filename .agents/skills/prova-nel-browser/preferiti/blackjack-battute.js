// PROVE DELLE BATTUTE DEL BANCO (3 nov 2026, chat «🃏 Battute del banco»). Si carica DOPO preferiti/blackjack.js.
// bb1 Da solo: Paky sballa a 22 → nel fumetto del banco una battuta col suo nome (della lista «22»), che non copre carte,
//     punteggi, fiches, nomi né tasti, e sparisce da sola entro 5 s; la mano dopo (anche se sballa di nuovo) niente battuta.
// bb2 Interruttore «😏 Battute del banco» su No: sballa a 22 e nessuna battuta. Nelle regole la riga delle battute.
// bb3 Online in 3: Giulia sballa a 22 → la stessa battuta (col nome di Giulia) su tutti e tre i telefoni; nella foto c'è.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no, T = A.T;
  function q(w, s) { return w.document.querySelector(s); }
  function fum(w) { var f = q(w, ".bjr-fum.batt"); return f ? f.textContent : ""; }
  // il fumetto non deve stare sopra niente che conta
  function copre(w) {
    var f = q(w, ".bjr-fum.batt"); if (!f) return "";
    var a = f.getBoundingClientRect(), fuori = [];
    [].forEach.call(w.document.querySelectorAll(".bjr-carta, .bjr-punti, .bjr-fiche, .bjr-pila, .bjr-fval, .bjr-nome, .bjr-cc, .bj-hero button, .bj-hero, .bjr-matt-carte, .bjr-matt-nome"), function (e) {
      var b = e.getBoundingClientRect(); if (!b.width || !b.height) return;
      var x = Math.min(a.right, b.right) - Math.max(a.left, b.left), y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
      if (x > 2 && y > 2) fuori.push(String(e.className).split(" ")[0]);
    });
    return fuori.join(",");
  }
  COPIONE.aiuti.bjCopre = copre; COPIONE.aiuti.bjFum = fum;
  var VENTIDUE = /22|punto|righello|carta giusta|altro gioco|quasi ti pagavo/;
  function tasto(P, re) { return [].find.call(P.document.querySelectorAll(".bj-hero button"), function (x) { return re.test(x.textContent) && !x.disabled; }); }
  async function apriDaSolo(P) {
    var tess = await W.aspetta(function () { return A.tessera(P, "Black Jack"); }, 6000); if (!tess) no("non trovo il Black Jack");
    tess.click(); await W.dorme(300);
    W.clicca(P, /Su questo telefono/, ".modo-grande");
    for (var k = 0; k < 8 && !q(P, ".bj-wrap"); k++) { await W.dorme(300); W.clicca(P, /Avanti|Comincia/); }
    await W.dorme(600); var sala = q(P, ".bj-sala"); if (sala) sala.click(); await W.dorme(300);
    if (!await W.aspetta(function () { return W.clicca(P, /^Punta /); }, 6000)) no("non si riesce a puntare");
  }
  async function sballaA22(P, nome) {
    var c = await W.aspetta(function () { return tasto(P, /^Carta$/); }, 12000);
    if (!c) no("non arriva il turno di " + nome);
    c.click();
  }
  COPIONE.aggiungi("bb1", { nome: "Black Jack: battuta del banco quando sballi a 22 (col nome, non copre niente, sparisce da sola, non a ogni mano)", fai: async function () {
    var x = [];
    var P = await W.apriTel("Paky", { x: 0, prima: function (w) { COPIONE.aiuti.bjTrucca(w, ["10♠", "9♥", "6♣", "8♦", "6♠"]); } });
    await apriDaSolo(P);
    await sballaA22(P, "Paky");
    var b = await W.aspetta(function () { return fum(P); }, 8000), t0 = Date.now();
    if (!b) no("nessuna battuta dopo il 22 (fumetto: «" + ((q(P, ".bjr-fum") || {}).textContent || "") + "»)");
    if (!/Paky/.test(b) || !VENTIDUE.test(b)) no("la battuta non è quella del 22 col nome: «" + b + "»");
    x.push("«" + b + "»");
    var c = copre(P); if (c) no("il fumetto copre: " + c);
    if (!await W.aspetta(function () { return !fum(P); }, 6000)) no("la battuta non sparisce da sola");
    var dur = Date.now() - t0; if (dur > 4500) no("la battuta resta " + dur + " ms");
    x.push("sparisce in " + (dur / 1000).toFixed(1) + " s");
    // la mano dopo (carte a caso: il mazzo è già fatto): si chiede carta finché si può, e la battuta non torna subito
    if (!await W.aspetta(function () { if (W.clicca(P, /^Punta /)) return true; W.clicca(P, /Nuova mano|Prossima mano/); return false; }, 15000)) no("la seconda mano non parte («" + T(P).slice(-80) + "»)");
    var vista = false, sball = false, fine = Date.now() + 12000;
    while (Date.now() < fine) { var cb = tasto(P, /^Carta$/) || tasto(P, /^No$/); if (cb) { cb.click(); sball = true; } if (fum(P)) vista = true; await W.dorme(100); }
    if (!sball && !/Fine mano|Nuova mano/.test(T(P))) no("la seconda mano non finisce («" + T(P).slice(-80) + "»)");
    if (vista) no("battuta anche alla mano subito dopo: «" + fum(P) + "»");
    x.push("mano dopo: niente battuta");
    if ((P.__err || []).length) no("errori: " + P.__err.join(" | "));
    return x.join(" · ");
  } });
  COPIONE.aggiungi("bb2", { nome: "Black Jack: «😏 Battute del banco» su No → niente battute; riga nelle regole", fai: async function () {
    if (!W.__prepCH) await COPIONE.carica("migliora/casino-horto.js");
    var src = await (await fetch("/js/games/blackjack.js?" + Date.now())).text();
    if (!/Battute del banco<\/b>/.test(src)) no("nelle regole non c'è la riga delle battute");
    if (src.indexOf('gruppo("😏 Battute del banco", "battute"') < 0) no("nelle impostazioni non c'è l'interruttore");
    var P = await W.apriTel("Bea", { x: 0, ch: true, prima: function (w) { COPIONE.aiuti.bjTrucca(w, ["10♠", "9♥", "6♣", "8♦", "6♠"]); } });
    P.__imp = { battute: false };
    await apriDaSolo(P);
    await sballaA22(P, "Bea");
    var vista = false, fine = Date.now() + 7000; while (Date.now() < fine) { if (fum(P)) vista = true; await W.dorme(100); }
    if (vista) no("con le battute spente è uscita lo stesso");
    if (!/Fine mano|Nuova mano/.test(T(P))) no("la mano non è finita («" + T(P).slice(-80) + "»)");
    return "spente: niente battuta dopo il 22; interruttore e riga nelle regole ci sono";
  } });
  COPIONE.aggiungi("bb3", { nome: "Black Jack online in 3: la battuta su Giulia (22) uguale su tutti i telefoni", fai: async function () {
    if (!W.__prepCH) await COPIONE.carica("migliora/casino-horto.js");
    var x = [], C = null, vmC = function () { return W.vmDi(C) || {}; };
    var P = await W.apriTel("Paky", { x: 0, ch: true, prima: function (w) { COPIONE.aiuti.bjTrucca(w, ["10♠", "10♥", "10♦", "9♣", "8♠", "6♣", "7♥", "8♦", "6♠"]); } });
    C = await W.apriStanza(P, "Black Jack");
    var G = await W.apriTel("Giulia", { x: 185, ch: true, hash: "gioco=blackjack&stanza=" + C });
    if (!await W.aspetta(function () { return /Giulia/.test(T(P)); }, 8000)) no("in saletta non arriva Giulia");
    var L = await W.apriTel("Luca", { x: 370, ch: true, hash: "gioco=blackjack&stanza=" + C });
    if (!await W.aspetta(function () { return /Luca/.test(T(P)); }, 8000)) no("in saletta non arriva Luca");
    if (!await W.aspetta(function () { return W.clicca(P, /Comincia/); }, 5000)) no("non trovo «Comincia»");
    var v = await W.aspetta(function () { var v = vmC(); return v.fase === "punta" ? v : null; }, 15000); if (!v) no("la partita non parte");
    var nomi = v.giocatori.map(function (g) { return g.nome; }).join(",");
    if (nomi !== "Paky,Giulia,Luca") no("posti in un altro ordine (" + nomi + "): il mazzo truccato non torna");
    W.reteDi("Giulia").invia({ t: "mossa", kind: "punta", val: 10 }); W.reteDi("Luca").invia({ t: "mossa", kind: "punta", val: 10 });
    await W.aspetta(function () { return W.clicca(P, /^Punta /); }, 6000);
    var fatto = {}, fino = Date.now() + 40000;
    while (Date.now() < fino && vmC().fase !== "esito") {
      v = vmC(); var gt = v.giocatori[v.turno], kk = v.fase + v.turno + "|" + (gt ? gt.mani.map(function (m) { return m.carte.length; }).join() : "");
      if (v.fase === "assic" && !fatto[kk]) { fatto[kk] = 1; W.clicca(P, /^No$/); ["Giulia", "Luca"].forEach(function (n) { W.reteDi(n).invia({ t: "mossa", kind: "assic", si: false }); }); }
      if (v.fase === "gioca" && !fatto[kk]) { fatto[kk] = 1;
        if (gt.nome === "Paky") { if (!W.clicca(P, /^Stai$/)) fatto[kk] = 0; }
        else W.reteDi(gt.nome).invia({ t: "mossa", kind: "azione", mossa: gt.nome === "Giulia" ? "carta" : "stai", h: 0, n: gt.mani[0].carte.length }); }
      await W.dorme(150);
    }
    v = vmC();
    if (!v.battuta) no("nella foto non c'è la battuta (" + v.giocatori.map(function (g) { return g.nome + ":" + g.mani.map(function (m) { return m.esito; }); }).join(" ") + ")");
    if (!/Giulia/.test(v.battuta.testo) || !VENTIDUE.test(v.battuta.testo)) no("battuta sbagliata: «" + v.battuta.testo + "»");
    var tutti = await W.aspetta(function () { var a = fum(P), b = fum(G), c = fum(L); return a && a === b && b === c ? a : null; }, 6000);
    if (!tutti) no("la battuta non è uguale sui tre telefoni: «" + fum(P) + "» «" + fum(G) + "» «" + fum(L) + "»");
    x.push("«" + tutti + "» su tutti e tre");
    [P, G, L].forEach(function (w, i) { var c = copre(w); if (c) no("sul telefono " + i + " il fumetto copre: " + c); });
    var err = (P.__err || []).concat(G.__err || [], L.__err || []); if (err.length) no("errori: " + err.join(" | "));
    return x.join(" · ");
  } });
  // bb4 La mano piena a 360x640 e 412x915: 90.000 monete, si divide l'8 e si perdono tutte e due → battuta «divise»
  //     che non copre niente. Il telefono resta aperto a misura vera (scala 1) per la foto: COPIONE.prova("bb4", { w: 412, h: 915 }).
  COPIONE.aggiungi("bb4", { nome: "Black Jack: battuta con la mano piena (Dividi, fiches alte) a 360x640 e 412x915, non copre niente", fai: async function (opz) {
    var misure = opz && opz.w ? [[opz.w, opz.h]] : [[360, 640], [412, 915]], x = [];
    for (var i = 0; i < misure.length; i++) {
      var nome = i ? "Bea" : "Paky", wv = misure[i][0], hv = misure[i][1];
      W.__portafogli = W.__portafogli || {}; W.__portafogli[nome] = 90000; W.__salvate = W.__salvate || {};
      var P = await W.apriTel(nome, { x: 0, prima: function (w) {
        w.SGNube.fiches = function () { return W.__portafogli[nome]; };
        w.SGNube.salvaFiches = function (id, v) { W.__portafogli[nome] = v; };
        COPIONE.aiuti.bjTrucca(w, ["8♠", "6♥", "8♥", "10♦", "10♣", "9♣", "5♠"]);
      } });
      var f = document.getElementById("tel-" + nome); f.style.width = wv + "px"; f.style.height = hv + "px"; f.style.transform = "none"; f.style.zIndex = 50;
      await W.dorme(400);
      await apriDaSolo(P);
      var d = await W.aspetta(function () { return tasto(P, /^Dividi$/); }, 12000); if (!d) no(wv + "x" + hv + ": non c'è «Dividi»");
      d.click();
      var fine = Date.now() + 15000, b = "";
      while (Date.now() < fine && !(b = fum(P))) { var s = tasto(P, /^Stai$/); if (s) s.click(); await W.dorme(150); }
      if (!/due|diviso|dividi|doppi/i.test(b)) no(wv + "x" + hv + ": non arriva la battuta delle due mani perse («" + b + "», " + T(P).slice(-60) + ")");
      var c = copre(P); if (c) no(wv + "x" + hv + ": il fumetto copre " + c);
      x.push(wv + "x" + hv + " «" + b + "» ok");
      if (i < misure.length - 1) { f.style.transform = "scale(.5)"; f.style.zIndex = ""; }
    }
    return x.join(" · ");
  } });
})();

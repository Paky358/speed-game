// PROVE DEL PORTIERE UNICO E DELLE SCRITTE DEI TIRATORI (2 nov 2026, decise dal proprietario il 30 ott e il 2 nov).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta-portiere.js"); await COPIONE.prova("pu1")
//
// pu1 All'asta del fanta esce UN SOLO portiere per squadra (Inter e Napoli ne hanno due nel listone): 3.000 mazzi da 2 a 10
//     giocatori, sempre un portiere a testa, mai due della stessa squadra; e i portieri escono tutti, prima o poi.
// pu2 Sul maxischermo «🎯 1° RIGORISTA», «🦶 2° PUNIZIONI», «🚩 1° ANGOLI»: sempre il numero e la scritta per intero, piccole, una
//     sotto l'altra a destra in basso; la maglia grande come senza scritte; nome, squadra e prezzo interi e mai sotto le scritte
//     (360x640, 320x568, 412x915, 390x844).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  async function motore(w) {   // il file del gioco con tre funzioni di dentro portate fuori (solo per la prova), dentro il telefono w
    if (w.SG && w.SG.scaricaGioco) await w.SG.scaricaGioco("asta");   // (dal 4 nov 2026 il listone arriva col gioco)
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), fuori = {};
    var aggancio = "function costruisciMazzoFanta(n) {";
    if (src.indexOf(aggancio) < 0) no("non trovo il mazzo del fanta nel file del gioco");
    src = src.replace(aggancio, "FUORI.mazzo = costruisciMazzoFanta; FUORI.etichette = etichetteTiri; FUORI.maxischermo = maxischermo; " + aggancio);
    new w.Function("SG", "FUORI", src)({ registra: function () {}, bot: w.SG && w.SG.bot }, fuori);
    return fuori;
  }
  COPIONE.aggiungi("pu1", { nome: "Mini Asta Fantacalcio: un solo portiere per squadra all'asta", fai: async function () {
    var w = await W.apriTel("Paky", { x: 0 }), M = await motore(w), db = w.SG_FANTA_CALCIATORI.P, perSq = {}, visti = {}, x = [];
    ["A", "B", "C"].forEach(function (t) { (db[t] || []).forEach(function (s) { var sq = /\(([^)]+)\)/.exec(s)[1]; perSq[sq] = (perSq[sq] || 0) + 1; }); });
    var doppie = Object.keys(perSq).filter(function (k) { return perSq[k] > 1; });
    if (doppie.length < 2) no("nel listone non ci sono più squadre con due portieri (" + doppie.join(", ") + "): la prova non serve più così");
    for (var i = 0; i < 3000; i++) {
      var n = 2 + (i % 9), m = M.mazzo(n), P = m.filter(function (c) { return c.ruolo === "P"; }), sq = {};
      if (P.length !== n) no("con " + n + " giocatori i portieri sono " + P.length);
      P.forEach(function (c) { if (sq[c.squadra]) no("due portieri del " + c.squadra + " nello stesso mazzo: " + P.map(function (y) { return y.nome; }).join(", ")); sq[c.squadra] = 1; visti[c.nome] = 1; });
    }
    var tutti = 0; ["A", "B", "C"].forEach(function (t) { tutti += (db[t] || []).length; });
    if (Object.keys(visti).length !== tutti) no("escono solo " + Object.keys(visti).length + " portieri su " + tutti);
    try { Object.keys(w.localStorage).forEach(function (k) { if (/fanta_/.test(k)) w.localStorage.removeItem(k); }); } catch (e) {}
    x.push("3.000 mazzi da 2 a 10: sempre un portiere a testa, mai due della stessa squadra (" + doppie.join(", ") + " ne hanno due); escono tutti i " + tutti);
    return x.join("; ");
  } });
  COPIONE.aggiungi("pu2", { nome: "Mini Asta Fantacalcio: rigorista, punizioni e angoli sempre col numero e la scritta intera", fai: async function () {
    // lo stadio vero (stesso telefono, in 3): accanto al maxischermo vero se ne mette uno uguale fatto dal gioco e lo si riempie coi casi
    var P = await W.apriTel("Paky", { x: 0, pa: true }), x = [], ko = [];
    var tess = await W.aspetta(function () { return A.tessera(P, "Mini Asta Fantacalcio"); }, 6000); if (!tess) no("non trovo la tessera del fanta");
    tess.click(); await W.dorme(400);
    if (!W.clicca(P, /Su questo telefono/, ".modo-grande")) no("non c'è «Su questo telefono»");
    await W.aspetta(function () { return P.document.querySelector(".sala-riga input"); }, 3000);
    while (P.document.querySelectorAll(".sala-riga input").length < 3) { if (!W.clicca(P, /Aggiungi giocatore/)) break; await W.dorme(80); }
    [].forEach.call(P.document.querySelectorAll(".sala-riga input"), function (c, k) { c.value = ["Paky", "Giulia", "Luca"][k] || ""; c.dispatchEvent(new P.Event("input", { bubbles: true })); });
    if (!await W.aspetta(function () { if (P.document.querySelector(".st-stadio .st-board")) return true; W.clicca(P, /Comincia|Avanti|Gioca|Inizia/); return false; }, 10000)) no("non arrivo allo stadio");
    var M = await motore(P), document = P.document, f = window.document.getElementById("tel-Paky");
    var el = function (tag, a, figli) { var e = document.createElement(tag); a = a || {}; Object.keys(a).forEach(function (k) { if (k === "class") e.className = a[k]; else if (k === "style") e.style.cssText = a[k]; else e.setAttribute(k, a[k]); }); (figli || []).forEach(function (c) { if (c) e.appendChild(typeof c === "string" ? document.createTextNode(c) : c); }); return e; };
    var casi = [[0, 0, 0], [1, 1, 1], [2, 3, 1], [3, 3, 3], [1, 0, 2], [0, 2, 0]], parole = ["RIGORISTA", "PUNIZIONI", "ANGOLI"], nomi = ["Mastantuono", "Calhanoglu", "Kean"];
    var misure = [[360, 640], [320, 568], [412, 915], [390, 844]];
    for (var i = 0; i < misure.length; i++) {
      f.style.width = misure[i][0] + "px"; f.style.height = misure[i][1] + "px"; void document.documentElement.offsetHeight; P.dispatchEvent(new P.Event("resize")); await W.dorme(400);
      var vero = document.querySelector(".st-stadio .st-board"), base = null;   // (base: dove stanno nome e prezzo senza scritte, su questo telefono)
      casi.forEach(function (cs, k) {
        var S = {}, b2 = M.maxischermo(el, S, true); vero.parentNode.insertBefore(b2, vero); vero.style.display = "none";
        S.schermo.classList.remove("vuoto"); S.ruolo.textContent = "CEN"; S.ruolo.className = "st-ruolo as-rb-C"; S.squadra.textContent = "FIORENTINA"; S.nome.textContent = nomi[k % 3];
        S.magliaImg.src = vero.querySelector(".st-maglia").src || "carte/giochi/astafanta.jpg";
        M.etichette(S, cs[0], cs[1], cs[2]);   // (come nel gioco: il prezzo e chi offre arrivano subito dopo)
        S.prezzoN.textContent = "12 💰"; S.chi.textContent = S.corto ? "di IL PAPPONE" : "offerta di IL PAPPONE";
        var d = S.schermo.querySelector(".st-dati").getBoundingClientRect(), sc = S.schermo.getBoundingClientRect(), dove = misure[i].join("x") + " " + cs.join("/") + " " + S.nome.textContent;
        function testo(n) { var r = document.createRange(); r.selectNodeContents(n); return r.getBoundingClientRect(); }   // (dove sta davvero la scritta)
        function sopra(a, b) { return a.width && b.width && a.left < b.right - 1 && b.left < a.right - 1 && a.top < b.bottom - 1 && b.top < a.bottom - 1; }
        var occupati = [["il nome", testo(S.nome)], ["il prezzo", testo(S.prezzoN)], ["chi offre", S.chi.getBoundingClientRect()], ["il ruolo", S.ruolo.getBoundingClientRect()], ["la squadra", testo(S.squadra)]];
        [S.rig, S.pun, S.ang].forEach(function (b, j) {
          var atteso = cs[j] ? (["🎯 ", "🦶 ", "🚩 "][j] + cs[j] + "° " + parole[j]) : "";
          if (b.textContent !== atteso) ko.push(dove + ": «" + b.textContent + "» invece di «" + atteso + "»");
          if (!atteso) return;
          var r = b.getBoundingClientRect();
          if (b.scrollWidth > b.clientWidth + 1 || r.right > d.right + 1 || r.bottom > d.bottom + 1 || r.top < d.top - 1 || r.width < 20 || r.left < d.left + d.width * 0.4) ko.push(dove + ": «" + atteso + "» tagliata, fuori dal tabellone o non a destra");
          occupati.forEach(function (o) { if (sopra(r, o[1])) ko.push(dove + ": «" + atteso + "» copre " + o[0]); });
        });
        var n = S.nome.getBoundingClientRect(), sq = S.squadra.getBoundingClientRect(), pz = S.prezzoN.getBoundingClientRect(), mh = S.magliaImg.getBoundingClientRect().height;
        if (!base) base = { n: n.bottom, pz: pz.bottom, mh: mh };
        if (n.bottom > base.n + 1 || pz.bottom > base.pz + 1 || sq.width < 30 || mh < base.mh - 1 || testo(S.nome).width > S.nome.clientWidth - parseFloat(P.getComputedStyle(S.nome).paddingLeft) - parseFloat(P.getComputedStyle(S.nome).paddingRight) + 1 || parseFloat(P.getComputedStyle(S.nome).fontSize) < 12) ko.push(dove + ": il nome, la squadra o il prezzo non si vedono più (" + Math.round(n.bottom) + "/" + Math.round(pz.bottom) + " invece di " + Math.round(base.n) + "/" + Math.round(base.pz) + ", maglia " + Math.round(mh) + " px, squadra " + Math.round(sq.width) + " px)");
        if (misure[i][0] >= 390 && S.corto && S.chi.scrollWidth > S.chi.clientWidth + 1) ko.push(dove + ": «" + S.chi.textContent + "» tagliato (" + S.chi.clientWidth + " su " + S.chi.scrollWidth + " px)");
        b2.remove(); vero.style.display = "";
      });
    }
    f.style.width = "360px"; f.style.height = "740px"; P.dispatchEvent(new P.Event("resize"));
    if (ko.length) no(ko.slice(0, 6).join(" · ") + (ko.length > 6 ? " … (" + ko.length + ")" : ""));
    x.push("5 casi su 4 telefoni (360x640, 320x568, 412x915, 390x844) nello stadio vero: numero e scritta sempre interi, a destra in basso; maglia grande come prima; nome, squadra e prezzo interi e scoperti");
    return x.join("; ");
  } });
})();

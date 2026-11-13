// PROVA DELLA MINI ASTA FANTACALCIO IN 12 (13 nov 2026 sera, il proprietario: «portiamo la mini asta a 12»; «i punteggi sopra, al posto di
// rimpicciolirli tutti… all'ottavo posto c'è scritto gli altri, che per aprirli basta cliccarci sopra»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-dodici.js");
// Con Edge invisibile: prova.js --porta 8991 --carica preferiti/asta.js,preferiti/asta-dodici.js --prova dz1 --timeout 1500
//
// dz1 Online in 12 con gli scambi e le 🏆 3 giornate: entrano tutti e 12 (il tredicesimo guarda), l'asta veloce fino in fondo (60 calciatori,
//     un portiere per squadra), il mercato con tutte e 12 le rose (la mia per prima, si scorre), poi la giornata: in alto 8 quadretti, 7 +
//     «👥 Gli altri» (5 altri), il mio quadretto sempre in vista, toccando «Gli altri» la classifica di tutti e 12; la copia per il vice
//     non diventa mai troppo grande (niente «troppo grande» nella console di chi tiene la partita); quanto pesa la foto della partita.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  var NOMI = ["Paky", "Giulia", "Luca", "Sara", "Bea", "Ugo", "Marta", "Tommi", "Anna", "Pino", "Ale", "Nina"];

  COPIONE.aggiungi("dz1", { nome: "Mini Asta Fantacalcio online in 12 (scambi, 3 giornate): entrano in 12, asta fino in fondo, mercato con 12 rose, quadretti 7 + «Gli altri», la copia per il vice", fai: async function () {
    var IMP = { formato: "fanta", scambi: true, giornate: 3 }, x = [], avvisi = [];
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = IMP; var cw = w.console.warn; w.console.warn = function (m) { avvisi.push(String(m)); return cw.apply(w.console, arguments); }; } });
    var C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < NOMI.length; i++) await W.apriTel(NOMI[i], { hash: "gioco=astafanta&stanza=" + C, x: 60 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 12; }, 30000)) no("non entrano tutti e 12 (" + (vm(C).giocatori || []).length + ")");
    var T = await W.apriTel("Teo", { hash: "gioco=astafanta&stanza=" + C, x: 60 * 12 });
    await W.dorme(2500);
    if ((vm(C).giocatori || []).length !== 12) no("il tredicesimo entra a giocare (" + (vm(C).giocatori || []).length + ")");
    x.push("entrano in 12, il tredicesimo no");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 10000)) no("la partita non comincia");
    // l'asta veloce: chi può lo prende, gli altri passano
    var fino = Date.now() + 900000, visti = {}, carte = {};
    while (Date.now() < fino && vm(C).fase !== "scambi" && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(200); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1; carte[a.nCarta] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      var poss = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; });
      if (!a.leaderId) { var pr = poss[a.nCarta % Math.max(1, poss.length)]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(250);
    }
    if (vm(C).fase !== "scambi") no("finita l'asta non arrivano gli scambi (fase «" + vm(C).fase + "»)");
    var gio = vm(C).giocatori, pieni = gio.filter(function (g) { return (g.kit || []).length === 5; }).length;
    var portieri = {}; gio.forEach(function (g) { (g.kit || []).forEach(function (c) { if (c.ruolo === "P") portieri[c.squadra] = (portieri[c.squadra] || 0) + 1; }); });
    if (pieni !== 12) no("a fine asta le rose piene sono " + pieni + " su 12");
    if (Object.keys(portieri).some(function (k) { return portieri[k] > 1; })) no("due portieri della stessa squadra");
    x.push("asta: " + Object.keys(carte).length + " calciatori, 12 rose da 5, 12 portieri di 12 squadre diverse");
    // il mercato: 12 rose, la mia per prima, si scorre
    var G = W.finestra("Giulia");
    if (!await W.aspetta(function () { return qa(G, ".mc-rosa").length === 12; }, 10000)) no("nel mercato non ci sono 12 rose (" + qa(G, ".mc-rosa").length + ")");
    if (!qa(G, ".mc-rosa")[0].classList.contains("mc-mia")) no("nel mercato la prima rosa non è la mia");
    var hC = q(G, ".mc-campo").getBoundingClientRect().height;
    if (hC < 103.5) no("nel mercato in 12 le rose sono più piccole del minimo (" + Math.round(hC) + " px)");
    x.push("mercato: 12 rose" + (q(G, ".mc-rose.scorre") ? " (si scorre)" : "") + ", campi alti " + Math.round(hC) + " px");
    W.clicca(P, /⏹ Fine/); await W.dorme(400); W.clicca(P, /⏹ Chiudi/);
    // la giornata: 7 quadretti + «Gli altri», il mio sempre in vista
    if (!await W.aspetta(function () { return q(G, ".st-gio-altri") && visibile(q(G, ".st-gio-altri")); }, 20000)) no("nella giornata non c'è il quadretto «Gli altri»");
    await W.dorme(1500);
    [P, G].forEach(function (w) {
      var vis = qa(w, ".st-gio-riga").filter(function (r) { return !r.classList.contains("fuori") && getComputedStyle(r).visibility !== "hidden"; });
      if (vis.length !== 8) no("si vedono " + vis.length + " quadretti invece di 8");
      var mio = q(w, ".st-gio-riga.mio"); if (!mio || mio.classList.contains("fuori")) no("il mio quadretto non si vede");
      var al = q(w, ".st-gio-altri"); if (!/5 altri/.test(al.textContent)) no("«Gli altri» non dice 5 altri («" + al.textContent + "»)");
      var tab = q(w, ".st-gio-tab").getBoundingClientRect(), fuoriTab = vis.filter(function (r) { var b = r.getBoundingClientRect(); return b.bottom > tab.bottom + 1 || b.right > tab.right + 1; });
      if (fuoriTab.length) no("dei quadretti escono dal loro spazio");
    });
    x.push("giornata: 7 quadretti + «👥 Gli altri» (5 altri), il mio sempre in vista");
    q(G, ".st-gio-altri").click(); await W.dorme(700);
    var righe = qa(G, ".st-pag.tutti .st-tl-r");
    if (righe.length !== 12) no("toccando «Gli altri» la classifica ha " + righe.length + " righe invece di 12");
    if (!q(G, ".st-pag.tutti .st-tl-r.mio")) no("nella classifica di tutti non sono segnato");
    x.push("«Gli altri» toccato: la classifica di tutti e 12");
    var peso = JSON.stringify(vm(C)).length;
    await W.dorme(3000);
    var grande = avvisi.filter(function (m) { return /troppo grande/.test(m); });
    if (grande.length) no("la copia per il vice è troppo grande: " + grande[0]);
    x.push("copia per il vice sotto il limite · foto della partita " + Math.round(peso / 1000) + " mila caratteri");
    return x.join(" · ");
  } });

  // dz2 Quando la copia per il vice è grande gli avatar ne escono (in 12 con le 3 giornate): qui si forza con __astaCopiaMax su tutti i
  //     telefoni, in 3. A giornata cominciata chi tiene la partita si spegne: un vice la prende e tutti hanno ancora il LORO avatar (quello di
  //     Paky, sparito, il vice lo aveva dalle foto), niente avatar a caso.
  COPIONE.aggiungi("dz2", { nome: "Mini Asta Fantacalcio online in 3: la copia per il vice senza avatar (troppo grande), chi tiene la partita si spegne, un vice la prende e gli avatar restano quelli", fai: async function () {
    var IMP = { formato: "fanta" }, NOMI3 = ["Paky", "Giulia", "Luca"];
    function forza(w) { w.__astaCopiaMax = 500; }
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = IMP; forza(w); } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio");
    for (var i = 1; i < 3; i++) await W.apriTel(NOMI3[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i, prima: forza });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 15000)) no("non entrano in 3");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    var fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(200); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      var poss = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; });
      if (!a.leaderId) { var pr = poss[a.nCarta % Math.max(1, poss.length)]; if (pr) { if (pr.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(250);
    }
    if (vm(C).fase !== "fine") no("l'asta non arriva in fondo");
    var prima = {}; vm(C).giocatori.forEach(function (g) { prima[g.id] = JSON.stringify(g.omino); });
    if (Object.keys(prima).some(function (k) { return prima[k] === "null" || prima[k] === undefined; })) no("già prima del cambio qualcuno non ha l'avatar");
    if (!await W.aspetta(function () { return q(P, ".st-gio-riga"); }, 30000)) no("la giornata non parte");
    await W.dorme(2500);   // (la copia ai vice: al massimo una al secondo)
    A.muore("Paky");
    if (!await W.aspetta(function () { var c = A.chiTiene(C); return c.g === 2 && c.h && c.h !== "host"; }, 15000)) no("la partita non la prende un vice (" + JSON.stringify(A.chiTiene(C)) + ")");
    var vice = (vm(C).giocatori || []).filter(function (g) { return g.id === A.chiTiene(C).h; })[0];
    if (!await W.aspetta(function () { var l = vm(C).giocatori || []; return l.length === 3 && l.every(function (g) { return g.omino; }); }, 10000)) no("dopo il cambio qualcuno è rimasto senza avatar");
    var cambiati = vm(C).giocatori.filter(function (g) { return JSON.stringify(g.omino) !== prima[g.id]; }).map(function (g) { return g.nome; });
    if (cambiati.length) no("dopo il cambio hanno un altro avatar: " + cambiati.join(", "));
    return "copia senza avatar, " + (vice ? vice.nome : "il vice") + " prende la partita: tutti e 3 con il loro avatar (anche Paky, che è sparito)";
  } });
})();

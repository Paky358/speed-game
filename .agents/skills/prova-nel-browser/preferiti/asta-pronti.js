// PROVE DEI «✅ PRONTI» NEGLI SCAMBI A FINE ASTA DELLA MINI ASTA FANTACALCIO (27 nov 2026, il proprietario: «le scritte "si gioca" e
// "aggiungere tempo" sono sovrapposte, è brutto da vedere; poi aggiungiamo un contatore di quante persone premono "si gioca", così si capisce chi
// non vuole più scambiare: deve essere visibile anche per gli ospiti; il tempo aggiuntivo invece solo per l'host»).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-scambi.js");
// await COPIONE.carica("preferiti/asta-pronti.js"); await COPIONE.prova("sp6")
// Con Edge invisibile: prova.js --porta 8995 --carica preferiti/asta.js,preferiti/asta-pronti.js --prova sp6,sp7
//
// sp6 Online in 3 (Paky tiene la partita, Giulia e Luca) e Dina che guarda col link: nella testata niente si tocca, «⏱ +1 minuto» solo a Paky;
//     in fondo Paky ha «⚽ Inizia la giornata», Giulia e Luca «⚽ Si gioca», Dina niente. Il conto conta chi non tiene la partita («0 su 2
//     pronti», anche per Dina) e sotto i nomi di chi è pronto; il ✅ sulla rosa; ci ripenso. Tutti pronti: il tasto di Paky si accende («✅ Tutti
//     pronti: ⚽ Si gioca!») ma la giornata NON parte da sola. Chi propone non è più pronto. «📋 Le proposte» (col tasto e i puntini, e indietro):
//     in corso, rifiutato, ritirato, accettato su tutti i telefoni, «Tu ➜…» e «…➜ te»; Paky ricarica: pronti e proposte restano. «Inizia la
//     giornata» senza tutti pronti chiede conferma (chi manca), «Resta». Luca esce: non conta più, il tasto si accende, Paky lo tocca: si gioca.
// sp7 Senza asta: il mercato in 2, 3, 5, 8 e 12 su 360×640, 360×780 e 412×915, per chi tiene la partita e per un ospite, con e senza una
//     proposta in attesa: nella testata niente si tocca e niente esce; la riga dei pronti dentro lo schermo, il conto («N su M pronti», chi tiene
//     la partita non conta) e la riga sotto mai tagliati, il tasto intero; la proposta in attesa sopra la riga dei pronti e mai sulle rose; le rose
//     larghe quanto lo schermo; «📋 Proposte ▶» c'è; nella pagina «Le proposte» ci sono tutte, nell'ordine (le più recenti in alto), col loro
//     stato, niente esce dal riquadro né si tocca. Tutti pronti: il tasto di chi tiene la partita «✅ Tutti pronti: ⚽ Si gioca!» su tutta la riga.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function vm(C) { return W.vmDi(C) || {}; }
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function visibile(e) { return !!e && e.getClientRects().length > 0; }
  function bott(w, sel, re) { return qa(w, sel).filter(function (b) { return re.test(b.textContent) && visibile(b); })[0] || null; }
  function idDi(nome) { return nome === "Paky" ? "host" : A.mioId(nome); }
  function testata(w) {   // nella testata del mercato niente si tocca e niente esce
    var T = q(w, ".sc-testa"); if (!T) return "manca la testata";
    var tb = T.getBoundingClientRect(), l = qa(w, ".sc-testa>b,.sc-testa .mc-capo>*,.sc-testa .sc-tempo").filter(visibile).map(function (e) { return [e.textContent.trim(), e.getBoundingClientRect()]; });
    for (var i = 0; i < l.length; i++) {
      var a = l[i][1]; if (a.left < tb.left - 1 || a.right > tb.right + 1) return "«" + l[i][0] + "» esce dalla testata";
      for (var j = i + 1; j < l.length; j++) { var b = l[j][1]; if (a.left < b.right - 1 && b.left < a.right - 1) return "«" + l[i][0] + "» e «" + l[j][0] + "» si toccano" + " [" + l.map(function (z) { return Math.round(z[1].left) + "-" + Math.round(z[1].right); }).join(" ") + " T " + Math.round(tb.left) + "-" + Math.round(tb.right) + " " + T.className + " w" + w.innerWidth + "]"; }
    }
    return null;
  }
  function riga(w, h) {   // la riga dei pronti: dentro lo schermo, scritte intere, tasto intero (con tutti pronti chi tiene la partita ha solo il tasto, su tutta la riga)
    var R = q(w, ".mc-pronti"); if (!visibile(R)) return "manca la riga dei pronti";
    var r = R.getBoundingClientRect(); if (r.bottom > h + 1 || r.top < 0) return "la riga dei pronti esce dallo schermo";
    var n = q(w, ".mc-pr-n"), hh = q(w, ".mc-pr-h"), b = q(w, ".mc-si");
    if (R.classList.contains("tutti")) { var bt = b.getBoundingClientRect(); return bt.left < r.left - 1 || bt.right > r.right + 1 || b.scrollWidth > b.clientWidth + 1 ? "il tasto acceso «" + b.textContent + "» non è intero" : null; }
    if (!n.textContent || n.getBoundingClientRect().right > (b && visibile(b) ? b.getBoundingClientRect().left : r.right) + 1) return "il conto «" + n.textContent + "» va sotto il tasto";
    if (!hh.textContent || hh.scrollWidth > hh.clientWidth + 1) return "la riga sotto è tagliata («" + hh.textContent + "»)";
    if (b && visibile(b)) { var bb = b.getBoundingClientRect(); if (bb.right > r.right + 1 || bb.left < r.left - 1 || b.scrollWidth > b.clientWidth + 1) return "il tasto «" + b.textContent + "» non è intero"; }
    var f = q(w, ".mc-pr-f"); if (f && f.getBoundingClientRect().right > (b && visibile(b) ? b.getBoundingClientRect().left : r.right) + 1) return "le faccine dei pronti vanno sotto il tasto";
    return null;
  }

  COPIONE.aggiungi("sp6", { nome: "Mini Asta Fantacalcio online in 3 + chi guarda, gli scambi: «⚽ Si gioca» per chi non tiene la partita col conto dei pronti visibile a tutti, chi tiene la partita ha «Inizia la giornata» (si accende con tutti pronti, mai partenza da sola) e «+1 minuto»; ci ripenso; «📋 Le proposte» con tutti gli stati su tutti i telefoni, anche dopo la ricarica; chi esce non conta", fai: async function () {
    var NOMI = ["Paky", "Giulia", "Luca"], imp = { formato: "fanta", scambi: true };
    var P = await W.apriTel("Paky", { x: 0, pa: true, prima: function (w) { w.__imp = imp; } }), C = await W.apriStanza(P, "Mini Asta Fantacalcio"), x = [];
    for (var i = 1; i < NOMI.length; i++) await W.apriTel(NOMI[i], { hash: "gioco=astafanta&stanza=" + C, x: 185 * i });
    if (!await W.aspetta(function () { return (vm(C).giocatori || []).length === 3; }, 15000)) no("non entrano tutti");
    W.clicca(P, /Comincia/);
    if (!await W.aspetta(function () { return vm(C).fase && vm(C).fase !== "lobby"; }, 8000)) no("la partita non comincia");
    // l'asta veloce (come in asta-scambi.js: chi può lo prende, gli altri passano), fino agli scambi
    var fino = Date.now() + 300000, visti = {};
    while (Date.now() < fino && vm(C).fase !== "scambi" && vm(C).fase !== "fine") {
      var v = vm(C), a = v.asta;
      if (v.fase !== "asta" || !a || visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId]) { await W.dorme(200); continue; }
      visti[a.nCarta + "|" + a.offerta + "|" + a.leaderId] = 1;
      var elegg = v.giocatori.filter(function (g) { return (g.conta[a.ruolo] || 0) < { P: 1, D: 1, C: 2, A: 1 }[a.ruolo]; }).map(function (g) { return g.nome; });
      var poss = v.giocatori.filter(function (g) { return elegg.indexOf(g.nome) >= 0 && g.max >= a.offerta; });
      if (!a.leaderId) { var pr0 = poss[a.nCarta % Math.max(1, poss.length)]; if (pr0) { if (pr0.nome === "Paky") { var bt = bott(P, ".st-piede .btn", /Lo prendo a/); if (bt) bt.click(); } else W.reteDi(pr0.nome).invia({ t: "rilancia", n: a.nCarta, prezzo: a.offerta, vista: a.offerta }); } }
      else elegg.forEach(function (n) { if (idDi(n) === a.leaderId) return; if (n === "Paky") { var bp = bott(P, ".st-piede .btn", /^Passo$/); if (bp) bp.click(); } else W.reteDi(n).invia({ t: "passa", n: a.nCarta }); });
      await W.dorme(250);
    }
    if (vm(C).fase !== "scambi") no("l'asta non arriva agli scambi (" + vm(C).fase + ")");
    var G = W.finestra("Giulia"), L = W.finestra("Luca"), tutti = [P, G, L], iG = idDi("Giulia"), iL = idDi("Luca");
    if (!await W.aspetta(function () { return tutti.every(function (w) { return q(w, ".mc-mia .mc-p") && visibile(q(w, ".mc-pronti")); }); }, 8000)) no("il mercato (con la riga dei pronti) non arriva su tutti");
    var D = await W.apriTel("Dina", { hash: "gioco=astafanta&stanza=" + C + "&guarda=1", x: 555 }), conD = tutti.concat([D]);
    await W.dorme(1600);   // (la testata si rimisura col carattere vero)
    tutti.forEach(function (w, k) { var e = testata(w) || riga(w, w.innerHeight); if (e) no(NOMI[k] + ": " + e); });
    if (!visibile(q(P, ".mc-piu")) || q(G, ".mc-piu") || q(L, ".mc-piu")) no("«⏱ +1 minuto» deve averlo solo chi tiene la partita");
    function tasto(w) { var b = q(w, ".mc-si"); return visibile(b) ? b : null; }
    if (!tasto(P) || !/Inizia la giornata/.test(tasto(P).textContent)) no("chi tiene la partita non ha «⚽ Inizia la giornata» in fondo (" + (tasto(P) ? tasto(P).textContent : "niente") + ")");
    if (!tasto(G) || !/Si gioca/.test(tasto(G).textContent) || !tasto(L)) no("Giulia e Luca non hanno «⚽ Si gioca»");
    if (tasto(D)) no("Dina guarda ma ha un tasto in fondo");
    x.push("testata senza sovrapposizioni; Paky: «+1 minuto» in alto e «Inizia la giornata» in fondo; gli altri «⚽ Si gioca»");
    function conto(w) { var n = q(w, ".mc-pr-n"); return n ? n.textContent : ""; }
    function sotto(w) { var n = q(w, ".mc-pr-h"); return n ? n.textContent : ""; }
    async function dicono(lista, re, cosa) { if (!await W.aspetta(function () { return lista.every(function (w) { return re.test(conto(w)); }); }, 6000)) no(cosa + " (" + lista.map(conto).join(" | ") + ")"); }
    await dicono(conD, /0 su 2 pronti/, "all'inizio non tutti (anche chi guarda) leggono «0 su 2 pronti» (chi tiene la partita non conta)");
    // Giulia pronta, ci ripensa, di nuovo pronta
    W.clicca(G, /Si gioca/, ".mc-si");
    await dicono(conD, /1 su 2 pronti/, "Giulia tocca «⚽ Si gioca» ma non tutti leggono «1 su 2»");
    if (!/Pronto/.test(tasto(G).textContent)) no("il tasto di Giulia non dice «✅ Pronto»");
    if (!/Giulia/.test(sotto(P)) || !/Giulia/.test(sotto(D)) || !/^tu$/i.test(sotto(G).trim())) no("sotto il conto non c'è chi è pronto (Paky «" + sotto(P) + "», Giulia «" + sotto(G) + "», Dina «" + sotto(D) + "»)");
    if (!await W.aspetta(function () { return conD.every(function (w) { var r = q(w, '.mc-rosa[data-g="' + iG + '"]'); return r && r.classList.contains("pronto") && visibile(r.querySelector(".mc-pr-b")); }); }, 4000)) no("la rosa di Giulia non ha il ✅ su tutti i telefoni");
    W.clicca(G, /Pronto/, ".mc-si");
    await dicono(tutti, /0 su 2 pronti/, "Giulia ci ripensa ma il conto non torna a 0");
    W.clicca(G, /Si gioca/, ".mc-si");
    await dicono(tutti, /1 su 2 pronti/, "Giulia di nuovo pronta, ma il conto non sale");
    x.push("Giulia pronta: «1 su 2» col suo nome e il ✅ sulla rosa su tutti; ci ripensa e torna pronta");
    // tutti pronti: il tasto di Paky si accende, ma la giornata non parte da sola
    W.clicca(L, /Si gioca/, ".mc-si");
    await dicono(conD, /2 su 2 pronti/, "Luca pronto ma il conto non è «2 su 2»");
    if (!await W.aspetta(function () { var b = tasto(P); return b && b.classList.contains("tutti") && /Tutti pronti/.test(b.textContent); }, 4000)) no("tutti pronti ma il tasto di Paky non si accende («Tutti pronti: ⚽ Si gioca!»)");
    await W.dorme(4500);
    if (vm(C).fase !== "scambi") no("con tutti pronti la giornata è partita da sola (decide chi tiene la partita)");
    x.push("tutti pronti: il tasto di Paky si accende, la giornata non parte da sola");
    // 📋 Luca propone uno scambio a Giulia: non è più pronto; la proposta in «Le proposte» su tutti
    var kP = (vm(C).giocatori.filter(function (g) { return g.nome === "Giulia"; })[0].kit.filter(function (c) { return c.ruolo === "P"; })[0]), kGP = kP.nome + "|" + kP.squadra;
    async function proponi() {
      var pill = qa(L, '.mc-rosa[data-g="' + iG + '"] .mc-p').filter(function (b) { return b.getAttribute("data-k") === kGP; })[0]; if (!pill) no("Luca non trova il portiere di Giulia");
      pill.click(); await W.dorme(400);
      var pr = bott(L, ".mc-barra .sc-ok", /Proponi/); if (!pr || pr.disabled) no("Luca non può proporre lo scambio dei portieri"); pr.click();
      if (!await W.aspetta(function () { return q(G, ".mc-pop"); }, 6000)) no("la proposta di Luca non arriva a Giulia");
    }
    await proponi();
    await dicono(conD, /1 su 2 pronti/, "Luca propone uno scambio ma resta tra i pronti");
    if (tasto(P).classList.contains("tutti")) no("con Luca che propone il tasto di Paky resta acceso");
    function voci(w) { return qa(w, ".mc-prop .mc-pr-it").map(function (e) { return e.textContent; }); }
    async function proposte(re, n, cosa) { if (!await W.aspetta(function () { return conD.every(function (w) { var l = voci(w); return l.length === n && re.test(l[0]); }); }, 6000)) no(cosa + " (" + conD.map(function (w) { return voci(w)[0] || "niente"; }).join(" | ") + ")"); }
    await proposte(/In corso/, 1, "la proposta di Luca non è «⏳ In corso» in «Le proposte» su tutti");
    if (!/^Luca ➜ te/.test(voci(G)[0]) || !/^Tu ➜ Giulia/.test(voci(L)[0]) || !/^Luca ➜ Giulia/.test(voci(D)[0])) no("chi propone a chi non è scritto bene (" + [voci(G)[0], voci(L)[0], voci(D)[0]].join(" | ") + ")");
    if (!/dà/.test(voci(P)[0]) || !/chiede/.test(voci(P)[0]) || voci(P)[0].indexOf(nomeC(kP.nome)) < 0) no("nella proposta non ci sono «dà», «chiede» e il portiere chiesto (" + voci(P)[0] + ")");
    function nomeC(n) { return String(n).split(" ")[0]; }
    // si passa col tasto e si torna indietro; i puntini dicono dove si è
    if (!W.clicca(G, /Proposte/, ".mc-vai")) no("Giulia non ha il tasto «📋 Proposte ▶»");
    if (!await W.aspetta(function () { var pg = q(G, ".mc-pagine"); return pg && pg.scrollLeft > pg.clientWidth * 0.9; }, 3000)) no("«📋 Proposte ▶» non porta alla pagina delle proposte");
    await W.dorme(300);
    if (!qa(G, ".mc-dots i:last-child.on").length) no("i puntini non dicono che si è sulla seconda pagina");
    W.clicca(G, /Rose/, ".mc-vai");
    if (!await W.aspetta(function () { var pg = q(G, ".mc-pagine"); return pg && pg.scrollLeft < 5; }, 3000)) no("«◀ Rose» non torna alle rose");
    x.push("«📋 Le proposte»: «Luca ➜ Giulia ⏳ In corso» su tutti («Tu ➜…», «…➜ te»), avanti e indietro coi tasti e i puntini");
    // rifiutata, ritirata, accettata, non più valida
    W.clicca(G, /Rifiuta/);
    await proposte(/Rifiutato/, 1, "rifiutata ma non è «❌ Rifiutato» su tutti");
    await proponi(); var bR = bott(L, ".mc-barra .sc-chiudi", /Ritira/); if (!bR) no("Luca non ha «✕ Ritira»"); bR.click();
    await proposte(/Ritirato/, 2, "ritirata ma non è «↩️ Ritirato» su tutti");
    await proponi(); W.clicca(G, /Accetta/);
    await proposte(/Accettato/, 3, "accettata ma non è «✅ Accettato» su tutti");
    if (!(vm(C).scambi.storia || []).length) no("le proposte non sono nella foto");
    x.push("rifiutato, ritirato e accettato su tutti, le più recenti in alto");
    // chi tiene la partita ricarica: pronti e proposte restano
    W.clicca(G, /Pronto/, ".mc-si"); await W.dorme(300); W.clicca(G, /Si gioca/, ".mc-si");   // (Giulia resta pronta)
    await dicono(tutti, /1 su 2 pronti/, "prima della ricarica Giulia non è pronta");
    await W.ricarica("Paky", { pa: true, prima: function (w) { w.__imp = imp; } }); P = W.finestra("Paky"); tutti = [P, G, L]; conD = tutti.concat([D]);
    if (!await W.aspetta(function () { return P && visibile(q(P, ".mc-pronti")) && /1 su 2 pronti/.test(conto(P)) && voci(P).length === 3; }, 25000)) no("dopo la ricarica di Paky pronti e proposte non tornano (" + conto(P) + ", " + voci(P).length + " proposte)");
    x.push("Paky ricarica: «1 su 2» e le 3 proposte restano");
    // chi esce non conta: Luca esce, Giulia è pronta → tutti pronti
    clearInterval(W.__autoConferma); W.__autoConferma = null; W.__siFermo = true;   // (le domande le tocca la prova)
    W.clicca(P, /Inizia la giornata/, ".mc-si");
    if (!await W.aspetta(function () { return q(P, ".conferma-sfondo"); }, 3000)) no("con Luca non pronto «Inizia la giornata» non chiede conferma");
    if (!/Luca/.test(q(P, ".conferma-sfondo").textContent)) no("la domanda non dice chi non è pronto («" + q(P, ".conferma-sfondo").textContent + "»)");
    await W.dorme(800); q(P, ".conferma-sfondo .btn-primario").click(); await W.dorme(500);
    if (vm(C).fase !== "scambi") no("«Resta» ma la giornata è partita");
    var t0 = Date.now(); W.spegni("Luca");
    if (!await W.aspetta(function () { return /1 su 1 pronto/.test(conto(P)) && tasto(P).classList.contains("tutti"); }, 45000)) no("Luca è uscito ma non conta ancora («" + conto(P) + "»)");
    x.push("«Inizia la giornata» senza tutti pronti: la domanda (chi manca), «Resta»; Luca esce: dopo " + Math.round((Date.now() - t0) / 1000) + " s non conta più, il tasto si accende");
    W.clicca(P, /Tutti pronti/, ".mc-si");
    if (!await W.aspetta(function () { return vm(C).fase === "fine"; }, 5000)) no("tutti pronti, Paky tocca il tasto acceso ma la giornata non parte");
    if (q(P, ".conferma-sfondo")) no("con tutti pronti non doveva chiedere conferma");
    x.push("Paky tocca «Tutti pronti: ⚽ Si gioca!»: si gioca subito");
    return x.join(" · ");
  } });

  COPIONE.aggiungi("sp7", { nome: "Mini Asta Fantacalcio, gli scambi su 3 telefoni in 2-12, chi tiene la partita e un ospite: testata senza sovrapposizioni, riga dei pronti intera e dentro lo schermo, la proposta in attesa sopra la riga", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }), x = [], prove = 0;
    P.SGCuore.precarica("astafanta");
    if (!await W.aspetta(function () { return P.SG_FANTA_CALCIATORI && P.SG_FANTA_SQUADRE && P.SG_FANTA_QUOTAZIONI; }, 20000)) no("i dati del fanta non arrivano");
    var src = await (await fetch("/js/games/asta.js?" + Date.now())).text(), F = {}, ag = "  var MERC = null;";
    if (src.indexOf(ag) < 0) no("non trovo il mercato nel file del gioco");
    new P.Function("SG", "FUORI", src.replace(ag, "FUORI.mercatoVM = mercatoVM; FUORI.sorteggio = sorteggioCoppie;" + ag))({ registra: function () {}, bot: P.SG && P.SG.bot }, F);
    var el = P.SGCuore.el, app = P.document.getElementById("app"), CA = P.SG_FANTA_CALCIATORI;
    var t = { el: el, guarda: false, conferma: function () {},
      schermata: function () { var s = el("div", { class: "schermata oro senza-testa g-astafanta" }, [ el("div", { class: "testa" }), el("div", { class: "contenuto" }), el("div", { class: "piede" }) ]); s._contenuto = s.children[1]; s._piede = s.children[2]; return s; },
      mostra: function (s) { while (app.firstChild) app.removeChild(app.firstChild); app.appendChild(s); } };
    var NOMI = ["Paky", "Giulia", "Luca", "Sara", "Bea", "Massimiliano", "Maria Antonietta", "Gianfrancesco", "Ale", "Ugo", "Rocco", "Teresa"];
    function rose(n, seme) {
      var usati = {}; function rnd() { seme = (seme * 9301 + 49297) % 233280; return seme / 233280; }
      function tutti(r) { var l = []; Object.keys(CA[r]).forEach(function (f) { if (f !== "X") l = l.concat(CA[r][f]); }); return l; }
      function prendi(r) { var l = tutti(r); for (;;) { var s = l[Math.floor(rnd() * l.length)]; if (usati[s]) continue; usati[s] = 1; var m = /^(.*) \((.*)\)$/.exec(s); return { nome: m[1], squadra: m[2], ruolo: r, prezzo: 1 + Math.floor(rnd() * 20) }; } }
      return NOMI.slice(0, n).map(function (nm, i) { return { id: i ? "g" + i : "host", nome: nm, omino: null, crediti: 3, kit: ["P", "D", "C", "C", "A"].map(prendi) }; });
    }
    function k(c) { return c.nome + "|" + c.squadra; }
    var fr = document.getElementById("tel-Paky"), giro = 0;
    for (var ti = 0; ti < 3; ti++) {
      var wh = [[360, 640], [360, 780], [412, 915]][ti];
      fr.style.cssText = "position:absolute;top:0;left:0;width:" + wh[0] + "px;height:" + wh[1] + "px;border:0;background:#000;transform:none;z-index:9";
      P.dispatchEvent(new P.Event("resize")); await W.dorme(300);
      for (var ni = 0; ni < 5; ni++) for (var ci = 0; ci < 4; ci++) {
        var n = [2, 3, 5, 8, 12][ni], ospite = ci % 2 === 1, prop = ci >= 2, gio = rose(n, 11 + n * 7 + ti); giro++;
        var S = { resta: 132000, prop: [], esiti: [], nf: 0, coppie: [F.sorteggio()], pronti: gio.slice(1).filter(function (g, j) { return j % 2 === 0; }).map(function (g) { return g.id; }), h: "host", storia: [] };
        var STATI = ["in", "ok", "no", "rit", "via"], quante = n === 2 ? 4 : n * 2;
        for (var si = 0; si < quante; si++) { var ga = gio[si % n], gb = gio[(si + 1) % n], r0 = [1, 4, 0, 2][si % 4], due = si % 5 === 3; S.storia.unshift({ n: si + 1, da: ga.id, a: gb.id, dai: due ? [k(ga.kit[2]), k(ga.kit[3])] : [k(ga.kit[r0])], vuoi: due ? [k(gb.kit[2]), k(gb.kit[3])] : [k(gb.kit[r0])], s: STATI[si % 5] }); }
        if (prop) S.prop.push(ospite ? { n: 1, da: "g1", a: "host", dai: [k(gio[1].kit[4])], vuoi: [k(gio[0].kit[4])] } : { n: 1, da: "host", a: "g1", dai: [k(gio[0].kit[1])], vuoi: [k(gio[1].kit[1])] });
        F.mercatoVM(t, { codice: "SP7" + giro, sessione: giro, fase: "scambi", giocatori: gio, scambi: S }, { myId: ospite ? "g1" : "host", sonoHost: !ospite, onScambio: function () {} });
        await W.dorme(giro === 1 ? 1600 : 450);
        var dove = wh.join("×") + " in " + n + (ospite ? ", ospite" : ", chi tiene la partita") + (prop ? ", proposta in attesa" : "") + ": ";
        var e = testata(P) || riga(P, wh[1]); if (e) no(dove + e);
        if (!ospite !== !!q(P, ".mc-piu")) no(dove + "«+1 minuto» " + (ospite ? "c'è anche per l'ospite" : "manca"));
        var conto = q(P, ".mc-pr-n").textContent, attesi = S.pronti.length; if (conto.indexOf(attesi + " su " + (n - 1) + " pront") < 0) no(dove + "il conto dice «" + conto + "» (pronti " + attesi + " su " + (n - 1) + ": chi tiene la partita non conta)");
        var gr = q(P, ".mc-griglia"), pgn = q(P, ".mc-pagine"); if (Math.abs(gr.getBoundingClientRect().width - pgn.getBoundingClientRect().width) > 2) no(dove + "le rose non prendono tutta la larghezza (" + Math.round(gr.getBoundingClientRect().width) + " su " + Math.round(pgn.getBoundingClientRect().width) + ")");
        if (!visibile(q(P, ".mc-vai"))) no(dove + "manca il tasto «📋 Proposte ▶»");
        var tP = q(P, ".mc-part-t"); if (tP && tP.scrollWidth > tP.clientWidth + 1) no(dove + "la riga delle partite col tasto delle proposte esce");
        pgn.scrollLeft = pgn.clientWidth; pgn.dispatchEvent(new P.Event("scroll")); await W.dorme(250);
        var it = qa(P, ".mc-prop .mc-pr-it"); if (it.length !== quante) no(dove + "«Le proposte» ne mostra " + it.length + " su " + quante);
        it.forEach(function (e) { if (e.scrollWidth > e.clientWidth + 1) no(dove + "una proposta esce dal suo riquadro («" + e.textContent + "»)"); var b0 = e.querySelector(".ri b"), st0 = e.querySelector(".st"); if (b0.getBoundingClientRect().right > st0.getBoundingClientRect().left + 1 && b0.getBoundingClientRect().top === st0.getBoundingClientRect().top) no(dove + "chi a chi va sopra lo stato («" + b0.textContent + "»)"); });
        var pt = q(P, ".mc-prop-t"), ptl = [].slice.call(pt.children).map(function (z) { return z.getBoundingClientRect(); }); for (var z1 = 0; z1 < ptl.length; z1++) for (var z2 = z1 + 1; z2 < ptl.length; z2++) if (ptl[z1].right > ptl[z2].left + 1) no(dove + "nella testata delle proposte qualcosa si tocca");
        var ETI = { "in": "In corso", ok: "Accettato", no: "Rifiutato", rit: "Ritirato", via: "Non più valido" };
        it.forEach(function (e, j) { if (e.textContent.indexOf(ETI[S.storia[j].s]) < 0) no(dove + "la proposta " + (j + 1) + " non è nell'ordine giusto o non dice «" + ETI[S.storia[j].s] + "» («" + e.textContent + "»)"); });
        pgn.scrollLeft = 0; pgn.dispatchEvent(new P.Event("scroll")); await W.dorme(150);
        if (prop) { var b = q(P, ".mc-barra.su"), r = q(P, ".mc-pronti"); if (!b) no(dove + "la proposta in attesa non sale"); else if (b.getBoundingClientRect().bottom > r.getBoundingClientRect().top + 1) no(dove + "la proposta in attesa copre la riga dei pronti"); else if (!q(P, ".mc-rose.scorre") && b.getBoundingClientRect().top < qa(P, ".mc-rosa").pop().getBoundingClientRect().bottom - 1) no(dove + "la proposta in attesa copre le rose"); }
        prove++;
      }
    }
    // tutti pronti (tranne chi tiene la partita): il suo tasto acceso su tutta la riga
    var g2 = rose(5, 99);
    F.mercatoVM(t, { codice: "SP7z", sessione: 999, fase: "scambi", giocatori: g2, scambi: { resta: 90000, prop: [], esiti: [], nf: 0, coppie: [F.sorteggio()], pronti: g2.slice(1).map(function (g) { return g.id; }), h: "host", storia: [] } }, { myId: "host", sonoHost: true, onScambio: function () {} });
    await W.dorme(500);
    var e2 = riga(P, 915); if (e2) no("tutti pronti: " + e2);
    if (!/Tutti pronti: ⚽ Si gioca!/.test(q(P, ".mc-si").textContent) || !q(P, ".mc-pronti.tutti")) no("tutti pronti ma il tasto di chi tiene la partita dice «" + q(P, ".mc-si").textContent + "»");
    x.push(prove + " schermate (3 telefoni, 2-12, chi tiene la partita e ospite, con e senza proposta): testata, riga dei pronti, rose larghe e «📋 Le proposte» a posto; tutti pronti: «" + q(P, ".mc-si").textContent + "»");
    return x.join(" · ");
  } });
})();

// PROVE DEL #31 PARTE 2: I GIOCHI SI SCARICANO QUANDO SERVONO (4 nov 2026). Profili finti, mai account veri.
// Uso (dopo copione-prova.js): await COPIONE.carica("passo7/scarica.js"); await COPIONE.prova("dl1")
// Il «telefono lento» si fa trattenendo i file dei giochi che il telefono chiede (trattieni(w): .lascia() li fa arrivare,
// .giu() = la rete non c'è, i file non arrivano; .su() = la rete torna, col segnale «online» del browser).
// el1 le schede dell'elenco (js/elenco-giochi.js) sono uguali ai giochi veri: tutti i giochi arrivano e nessuna scheda è vecchia.
// dl1 home: «Come giocate?» si vede subito anche col gioco che non è arrivato; scelto il modo, «Arriva il gioco…» e poi le
//     impostazioni (due tocchi); col gioco già arrivato niente schermata d'attesa.
// dl2 Sala: il gioco non è ancora arrivato sul telefono di Luca → la saletta dell'host lo aspetta («Aspettiamo Luca…», sagoma),
//     Luca vede «Arriva il gioco…» e non è tra i giocatori; quando arriva Luca entra da solo e l'host non lo aspetta più.
// dl3 Sala con la rete che non c'è: Luca legge «Il gioco non arriva» con «↻ Riprova»; la rete torna → entra da solo.
// dl4 link di una stanza (#gioco=…&stanza=…) aperto da Bea col gioco che arriva tardi: «Arriva il gioco…», poi è nella saletta.
// dl5 chi guarda col link (#…&guarda=1) a partita cominciata, col gioco che arriva tardi: guarda appena arriva (targhetta
//     «👀 Guardi»), senza entrare tra i giocatori e senza mandare «join».
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti;
  var aggiungi = COPIONE.aggiungi.bind(COPIONE);
  function no(p) { throw new Error(p); }
  var GIOCO = "La Patata Bollente", GID = "patata";
  function arriva(w) { return w && w.document.querySelector(".schermata.arriva-gioco"); }
  function nonArriva(w) { var a = arriva(w); return !!(a && a.querySelector(".ag-ico.ferma")); }
  // trattiene i file dei giochi che il telefono chiede (i <script> dei pezzi, segnati _sgPezzo da js/cuore/scarica.js)
  function trattieni(w) {
    var h = w.document.head, orig = h.appendChild, tenuti = [], rete = true, chiesti = 0;
    h.appendChild = function (n) {
      if (!(n && n._sgPezzo)) return orig.call(h, n);
      chiesti++;
      if (!rete) { setTimeout(function () { if (n.onerror) n.onerror(new w.Event("error")); }, 30); return n; }
      tenuti.push(n); return n;
    };
    return {
      quanti: function () { return tenuti.length; }, chiesti: function () { return chiesti; },
      lascia: function () { h.appendChild = orig; tenuti.splice(0).forEach(function (n) { orig.call(h, n); }); },
      giu: function () { rete = false; tenuti.splice(0).forEach(function (n) { setTimeout(function () { if (n.onerror) n.onerror(new w.Event("error")); }, 30); }); },
      su: function () { h.appendChild = orig; rete = true; w.dispatchEvent(new w.Event("online")); }
    };
  }
  function pronto(w, id) { return !!(w.SGCuore && w.SGCuore.giocoPronto(w.SGCuore.giocoDa(id))); }
  function nota(w) { var x = w.document.querySelector(".sl-nota"); return x ? x.textContent : ""; }

  aggiungi("el1", { nome: "Elenco dei giochi: tutti arrivano e le schede sono uguali ai giochi veri", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return P.document.querySelector(".home .tessera"); }, 8000)) no("la home non si apre");
    var n = P.SGCuore.giochi.length, prima = P.SGCuore.giochi.filter(function (g) { return P.SGCuore.giocoPronto(g); }).length;
    if (prima > 2) no("all'apertura " + prima + " giochi su " + n + " sono già arrivati (dovrebbero arrivare solo quando servono)");
    var vecchie = await P.SG.scaricaTutti();
    var manca = P.SGCuore.giochi.filter(function (g) { return !P.SGCuore.giocoPronto(g); }).map(function (g) { return g.id; });
    if (manca.length) no("non sono arrivati: " + manca.join(", "));
    if (vecchie.length) no("schede vecchie (rifare l'elenco con elenco-giochi.js): " + vecchie.join(", "));
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return n + " giochi: all'apertura " + prima + " arrivati, poi tutti; schede uguali ai giochi veri";
  } });

  aggiungi("dl1", { nome: "Home: «Come giocate?» subito, «Arriva il gioco…» se serve, poi le impostazioni", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 });
    if (!await W.aspetta(function () { return A.tessera(P, "Tris"); }, 8000)) no("la home non ha la tessera di Tris");
    if (pronto(P, "tris")) no("Tris è già arrivato all'apertura");
    var tr = trattieni(P);
    A.tessera(P, "Tris").click();
    if (!await W.aspetta(function () { return /Come giocate/.test(A.T(P)) && /Contro il Bot/.test(A.T(P)); }, 1500)) no("«Come giocate?» non si vede subito («" + A.T(P).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return tr.chiesti() > 0; }, 2000)) no("toccata la tessera il gioco non comincia ad arrivare");
    W.clicca(P, /Contro il Bot/);
    if (!await W.aspetta(function () { return arriva(P) && /Arriva il gioco/.test(A.T(P)); }, 2000)) no("scelto il modo, non c'è «Arriva il gioco…» («" + A.T(P).slice(0, 80) + "»)");
    tr.lascia();
    if (!await W.aspetta(function () { return !arriva(P) && /Comincia/.test(A.T(P)); }, 6000)) no("arrivato il gioco, non ci sono le impostazioni («" + A.T(P).slice(0, 80) + "»)");
    // ‹ indietro e di nuovo: il gioco c'è, niente attesa
    var visto = false, t = setInterval(function () { if (arriva(P)) visto = true; }, 20);
    P.SGCuore.schermataHome(); await W.dorme(300);
    if (!await W.aspetta(function () { return A.tessera(P, "Tris"); }, 4000)) { clearInterval(t); no("non torno alla home"); }
    A.tessera(P, "Tris").click(); await W.dorme(200); W.clicca(P, /Contro il Bot/);
    var ok = await W.aspetta(function () { return /Comincia/.test(A.T(P)); }, 3000); clearInterval(t);
    if (!ok) no("la seconda volta non ci sono le impostazioni");
    if (visto) no("la seconda volta si vede «Arriva il gioco…» (il gioco era già sul telefono)");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "«Come giocate?» subito, «Arriva il gioco…», poi le impostazioni; la seconda volta niente attesa";
  } });

  aggiungi("dl2", { nome: "Sala: il gioco arriva tardi su un telefono, la saletta lo aspetta", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = W.finestra("Paky"), L = W.finestra("Luca"), G = W.finestra("Giulia");
    var tr = trattieni(L);
    var C = await A.lanciaDallaSala("Paky", S, GIOCO);
    if (!await W.aspetta(function () { return A.dentro(G); }, 10000)) no("Giulia non arriva nella saletta");
    if (!await W.aspetta(function () { return arriva(L); }, 4000)) no("Luca non vede «Arriva il gioco…» («" + A.T(L).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return /Luca/.test(A.sagome(P)) || /Aspettiamo Luca/.test(nota(P)); }, 6000)) no("la saletta dell'host non aspetta Luca (sagome «" + A.sagome(P) + "», nota «" + nota(P) + "»)");
    await W.dorme(2500);
    var ids = (A.vm(C).players || A.vm(C).giocatori || []).map(function (p) { return p.id; });
    if (ids.indexOf(A.mioId("Luca")) >= 0) no("Luca è tra i giocatori senza avere il gioco");
    if (A.vm(C).fase !== "lobby") no("la partita è partita senza Luca (fase " + A.vm(C).fase + ")");
    tr.lascia();
    if (!await W.aspetta(function () { return A.dentro(L); }, 10000)) no("arrivato il gioco, Luca non entra da solo («" + A.T(L).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return !/Luca/.test(A.sagome(P)); }, 6000)) no("l'host aspetta ancora Luca (sagome «" + A.sagome(P) + "»)");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Luca: «Arriva il gioco…», la saletta lo aspetta (" + (A.sagome(P) || nota(P) || "ok") + "); arrivato, entra da solo";
  } });

  aggiungi("dl3", { nome: "Sala: la rete non c'è mentre arriva il gioco, poi torna", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = W.finestra("Paky"), L = W.finestra("Luca");
    var tr = trattieni(L); tr.giu();
    var C = await A.lanciaDallaSala("Paky", S, GIOCO);
    if (!await W.aspetta(function () { return nonArriva(L) && /Riprova/.test(A.T(L)); }, 8000)) no("senza rete Luca non legge «Il gioco non arriva» con «↻ Riprova» («" + A.T(L).slice(0, 100) + "»)");
    if (A.vm(C).fase !== "lobby") no("la partita è partita senza Luca");
    W.clicca(L, /Riprova/);   // (ancora senza rete: resta lì, senza errori)
    await W.dorme(800);
    if (!nonArriva(L)) no("«↻ Riprova» senza rete: non resta «Il gioco non arriva»");
    tr.su();
    if (!await W.aspetta(function () { return A.dentro(L); }, 12000)) no("tornata la rete, Luca non entra da solo («" + A.T(L).slice(0, 80) + "»)");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "senza rete «Il gioco non arriva» + «↻ Riprova»; tornata la rete Luca entra da solo";
  } });

  aggiungi("dl4", { nome: "Link della stanza col gioco che arriva tardi", fai: async function () {
    var X = await A.salaConAmici(["Giulia"]), S = X.S, P = W.finestra("Paky");
    var C = await A.lanciaDallaSala("Paky", S, GIOCO);
    // (Bea apre il link: i file del gioco si trattengono da prima che parta l'app)
    var tr = null;
    var B = await W.apriTel("Bea", { x: 555, hash: "gioco=" + GID + "&stanza=" + C, prima: function (w) { tr = trattieni(w); } });
    if (!await W.aspetta(function () { return arriva(B); }, 6000)) no("Bea non vede «Arriva il gioco…» («" + A.T(B).slice(0, 80) + "»)");
    if (A.dentro(B)) no("Bea è nella saletta senza il gioco");
    await W.dorme(1500);
    if ((A.vm(C).players || A.vm(C).giocatori || []).some(function (p) { return p.nome === "Bea"; })) no("Bea è tra i giocatori senza il gioco");
    tr.lascia();
    if (!await W.aspetta(function () { return A.dentro(B); }, 10000)) no("Bea non arriva nella saletta («" + A.T(B).slice(0, 80) + "»)");
    if (!await W.aspetta(function () { return (A.vm(C).players || A.vm(C).giocatori || []).some(function (p) { return p.nome === "Bea"; }); }, 6000)) no("Bea non è tra i giocatori");
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Bea col link: «Arriva il gioco…» e poi nella saletta, tra i giocatori";
  } });

  aggiungi("dl5", { nome: "Chi guarda col link, col gioco che arriva tardi", fai: async function () {
    var X = await A.salaConAmici(["Giulia", "Luca"]), S = X.S, P = W.finestra("Paky");
    var C = await A.lanciaDallaSala("Paky", S, GIOCO);
    if (!await W.aspetta(function () { return A.dentro(W.finestra("Giulia")) && A.dentro(W.finestra("Luca")); }, 10000)) no("gli amici non arrivano nella saletta");
    await W.dorme(600);
    if (!await W.aspetta(function () { W.clicca(P, /Comincia|Via ▶|Continua ▶/); return A.vm(C).fase && A.vm(C).fase !== "lobby"; }, 12000)) no("la partita non parte");
    var tr = null;
    var B = await W.apriTel("Bea", { x: 555, hash: "gioco=" + GID + "&stanza=" + C + "&guarda=1", prima: function (w) { tr = trattieni(w); } });
    if (!await W.aspetta(function () { return arriva(B); }, 6000)) no("Bea non vede «Arriva il gioco…» («" + A.T(B).slice(0, 80) + "»)");
    tr.lascia();
    if (!await W.aspetta(function () { return B.document.querySelector(".sg-guardo") && !arriva(B); }, 10000)) no("arrivato il gioco, Bea non guarda («" + A.T(B).slice(0, 80) + "»)");
    if ((A.vm(C).players || A.vm(C).giocatori || []).some(function (p) { return p.nome === "Bea"; })) no("Bea è tra i giocatori");
    var join = W.BR.log.filter(function (l) { return l.indexOf("Bea → " + C + "/") === 0 && l.indexOf('"join"') >= 0; });
    if (join.length) no("Bea ha mandato un join: " + join[0]);
    var e = W.erroriTel(); if (e.length) no("errori: " + e.slice(0, 3).join(" / "));
    return "Bea col link per guardare: «Arriva il gioco…», poi «👀 Guardi», niente join";
  } });
})();

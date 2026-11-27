// PROVE DELL'ALBUM DELLE FIGURINE DELLA MINI ASTA (27 nov 2026; scelte del proprietario in D:/SG-album-prove/LEGGIMI.md).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-album.js"); await COPIONE.prova("al1")
// Con Edge invisibile: prova.js --porta 8998 --carica preferiti/asta.js,preferiti/asta-album.js --prova al1,al2
//
// al1 La partita online di tf1 (preferiti/asta-trofei.js: in 3 + Bea che guarda col link) guardando anche l'album: i numeri «con te»
//     (stat.astafanta.al_oggi.<calciatore>) si salvano SOLO sul podio, una volta, uno per calciatore della rosa (16 numeri, una partita,
//     comprato all'asta o d'ufficio, i d'ufficio quanti dice il gioco); Bea niente; dopo il podio l'avviso «📒 Nell'album».
// al2 L'album aperto dai Trofei («🏆 Trofei · 📒 Album») con numeri finti: il conto in cima, le squadre, la pagina dell'Inter (le figurine
//     prese disegnate, le altre con la sagoma), la scheda «con te» (prezzo in media con il più basso e il più alto, d'ufficio a parte,
//     «In tutte le stagioni» solo per chi è in due stagioni), la scheda di uno mai preso (solo la sagoma), lo scaffale, la 2017-18 che
//     arriva; la riga «Il tuo album» nella prima schermata della Mini Asta; niente scorre di lato su 360x640.
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function testo(w, s) { var e = q(w, s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; }

  COPIONE.aggiungi("al1", { nome: "Album: i numeri «con te» salvati solo sul podio, una volta, uno per calciatore; Bea niente; l'avviso «📒 Nell'album»", fai: async function () {
    var cap = {}, orig = COPIONE.aggiungi, salvati = {}, avvisi = {}, interno = null;
    COPIONE.aggiungi = function (n, s) { cap[n] = s; return orig(n, s); };
    try { await COPIONE.carica("preferiti/asta-trofei.js"); } finally { COPIONE.aggiungi = orig; }
    if (!cap.tf1) no("non trovo la prova tf1");
    // la spia di tf1 resta la sua: qui si guardano in più i salvataggi dell'album (e chi li fa)
    Object.defineProperty(W, "__spiaProgressi", { configurable: true, get: function () { return interno && function (nome, a, w) {
      [].slice.call(a[4] || []).forEach(function (kv) { if (/^al_/.test(kv[0])) { (salvati[nome] = salvati[nome] || []).push({ k: kv[0], x: kv[1], podio: !!(w && w.document && w.document.querySelector(".st-gradini")) }); } });
      return interno(nome, a, w);
    }; }, set: function (f) { interno = f; } });
    var guarda = setInterval(function () { ["Paky", "Giulia", "Luca"].forEach(function (n) { var w = W.finestra(n); if (!w) return; qa(w, ".avviso-trofeo").forEach(function (b) { if (/Nell'album/.test(b.textContent)) avvisi[n] = b.textContent.replace(/\s+/g, " ").trim(); }); }); }, 150);
    var x = [];
    try {
      var r = await cap.tf1.fai();
      await W.dorme(14000);   // (gli avvisi dei trofei vengono prima; poi «📒 Nell'album»)
      ["Paky", "Giulia", "Luca"].forEach(function (n) {
        var l = salvati[n] || [];
        if (l.length !== 5) no(n + ": figurine salvate " + l.length + " (voluto 5, una per calciatore)");
        l.forEach(function (s) {
          if (!s.podio) no(n + ": album salvato prima del podio (" + s.k + ")");
          if (!/^al_oggi\.(fc\d+|k[A-Za-z]+)$/.test(s.k)) no(n + ": chiave strana " + s.k);
          if (!s.x || s.x.length !== 16) no(n + ": la voce " + s.k + " non ha 16 numeri");
          else { if (s.x[6] !== 1) no(n + ": " + s.k + " partite " + s.x[6]); if (s.x[0] + s.x[4] + s.x[5] !== 1) no(n + ": " + s.k + " comprato/ufficio/scambio " + s.x.slice(0, 6)); if (s.x[0] && (s.x[2] !== s.x[1] || s.x[3] !== s.x[1])) no(n + ": " + s.k + " prezzo più basso e più alto sbagliati " + s.x.slice(0, 4)); }
        });
        if (!avvisi[n] && n !== "Giulia") no(n + ": niente avviso «📒 Nell'album» dopo il podio");   // (Giulia in tf1 ricarica sul podio prima del suo avviso: le figurine restano salvate una volta, l'avviso non torna)
      });
      if (salvati.Bea) no("Bea guarda e salva l'album");
      var uff = 0; ["Paky", "Giulia", "Luca"].forEach(function (n) { (salvati[n] || []).forEach(function (s) { uff += s.x[4]; }); });
      if (uff < 3) no("d'ufficio nell'album " + uff + " (tf1 ne conta almeno uno per ruolo)");
      x.push("tf1: " + String(r).slice(0, 90) + "…");
      x.push("album: 5 figurine a testa sul podio, d'ufficio " + uff + "; Paky «" + (avvisi.Paky || "").slice(0, 60) + "»");
      var ese = (salvati.Paky || [])[0]; if (ese) x.push("es. " + ese.k + " = " + JSON.stringify(ese.x));
    } finally { clearInterval(guarda); delete W.__spiaProgressi; W.__spiaProgressi = null; }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("al2", { nome: "Album: dai Trofei, il conto, le squadre, la pagina, la scheda «con te», chi manca, lo scaffale e la 2017-18", fai: async function () {
    var x = [], stat = {};
    W.__statFinte = function (nome, g) { return g === "astafanta" ? stat : {}; };
    try {
      var P = await W.apriTel("Paky", { x: 0 });
      var I = null;
      // i numeri finti (come li salverebbe il podio): Martinez L. comprato 2 volte (9 e 19) + 1 d'ufficio, in campo 3 volte; Dimarco 1 volta;
      // Thuram d'ufficio; Martinez L. anche nella 2017-18? no: lì c'era Icardi; Higuain nella 2017-18 (Napoli) e Dzeko di oggi? Si usa
      // un calciatore che c'è in tutte e due: si cerca dai numeri di Fantacalcio.it
      var ids = P.SG_FANTA_IDS;
      if (!ids) { await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); }); ids = P.SG_FANTA_IDS; }
      function id(k) { return "fc" + ids[k]; }
      stat.al_oggi = {};
      stat.al_oggi[id("Martinez L. (Inter)")] = [2, 28, 9, 19, 1, 0, 3, 192, 231, 1, 1, 0, 0, 1, 105, "2026-11-12|Cagliari|1"];
      stat.al_oggi[id("Barella (Inter)")] = [1, 14, 14, 14, 0, 0, 1, 65, 75, 0, 1, 0, 0, 0, 75, "2026-11-20|Lecce|0"];
      stat.al_oggi[id("Thuram (Inter)")] = [0, 0, 0, 0, 1, 0, 1, 60, 60, 0, 0, 0, 0, 0, 60, "2026-11-21|Torino|0"];
      stat.al_201718 = {}; stat.al_201718[id("Barella (Inter)")] = [1, 3, 3, 3, 0, 0, 2, 120, 126, 0, 0, 1, 0, 1, 66, "2026-11-18|Genoa|0"];
      // 1. la prima schermata della Mini Asta: «📒 Il tuo album · 3 figurine»
      var g = P.SGCuore.giochi.filter(function (y) { return y.id === "astafanta"; })[0]; P.SGCuore.schermataModo(g); await W.dorme(300);
      if (!/Il tuo album/.test(testo(P, ".alb-entra")) || !/3 figurine/.test(testo(P, ".alb-entra"))) no("nella prima schermata della Mini Asta: «" + testo(P, ".alb-entra") + "»");
      // 2. dai Trofei: le linguette, poi l'album
      P.SGCuore.schermataSfide(); await W.dorme(300);
      var tab = qa(P, ".alb-tab button"); if (tab.length !== 2 || !/Trofei/.test(tab[0].textContent) || !/Album/.test(tab[1].textContent)) no("non ci sono le linguette «Trofei · Album»");
      tab[1].click();
      if (!await W.aspetta(function () { return q(P, ".alb-sq .alb-tess"); }, 20000)) no("l'album non si apre (" + testo(P, ".schermata h1") + ")");
      var tot = testo(P, ".alb-tot b"); if (!/^3 \/ \d{3}$/.test(tot)) no("il conto in cima dice «" + tot + "»");
      if (qa(P, ".alb-tess").length !== 20) no("squadre nell'album " + qa(P, ".alb-tess").length);
      if (!q(P, ".alb-tab button.on") || !/Album/.test(testo(P, ".alb-tab button.on"))) no("nell'album la linguetta accesa non è «Album»");
      x.push("Trofei → Album: «" + tot + "», " + qa(P, ".alb-tess").length + " squadre, " + testo(P, ".alb-met"));
      // 3. la pagina dell'Inter
      var inter = qa(P, ".alb-tess").filter(function (b) { return /Inter/.test(b.textContent); })[0]; inter.click();
      await W.dorme(400); var primaVista = qa(P, ".alb-slot canvas").length, sotto = qa(P, ".alb-slot").filter(function (b) { return b.__c && b.__c.x && b.getBoundingClientRect().top > P.innerHeight + 200; }).length;
      if (sotto && primaVista >= 3) no("si disegnano anche le figurine che non si vedono");
      qa(P, ".alb-slot").forEach(function (b) { if (b.__c && b.__c.x) b.scrollIntoView({ block: "center" }); });
      if (!await W.aspetta(function () { return qa(P, ".alb-slot canvas").length >= 3; }, 8000)) no("le 3 figurine prese dell'Inter non si disegnano scorrendo (" + qa(P, ".alb-slot canvas").length + ")");
      var vuote = qa(P, ".alb-vuota").length, slot = qa(P, ".alb-slot").length;
      if (vuote !== slot - 3) no("sagome " + vuote + " su " + slot + " (voluto " + (slot - 3) + ")");
      if (P.document.documentElement.scrollWidth > P.innerWidth + 1) no("la pagina scorre di lato");
      x.push("Inter: " + (slot - vuote) + " figurine e " + vuote + " sagome, «" + testo(P, ".alb-pag-t span") + "»");
      // 4. la scheda «con te» di Martinez L.
      var mart = qa(P, ".alb-slot").filter(function (b) { return b.__c && b.__c.nome === "Martinez L."; })[0]; mart.click(); await W.dorme(300);
      var sk = testo(P, ".alb-foglio");
      ["Con te nella Serie A di oggi", "6,4", "voto · 3 partite", "7,7", "Comprato all'asta", "2 volte", "pagato in media 14 · da 9 a 19", "📋 1 volta d'ufficio", "10,5", "contro Cagliari", "12 nov"].forEach(function (t) { if (sk.indexOf(t) < 0) no("nella scheda di Martinez L. manca «" + t + "»: " + sk.slice(0, 200)); });
      if (/In tutte le stagioni/.test(sk)) no("Martinez L. ha «In tutte le stagioni» ma è in una stagione sola");
      if (!q(P, ".alb-foglio .fig canvas")) no("nella scheda non c'è la figurina");
      q(P, ".alb-foglio .chiudi").click(); await W.dorme(200);
      // Barella: in due stagioni (2017-18 al Cagliari, stesso numero di Fantacalcio.it) → il riquadro; comprato una volta sola → «pagato 14»
      qa(P, ".alb-slot").filter(function (b) { return b.__c && b.__c.nome === "Barella"; })[0].click(); await W.dorme(300);
      sk = testo(P, ".alb-foglio");
      if (!/In tutte le stagioni/.test(sk) || !/2 · Oggi, 2017-18/.test(sk)) no("Barella non ha «In tutte le stagioni · 2 · Oggi, 2017-18»: " + sk.slice(-200));
      if (!/pagato 14/.test(sk) || /in media 14 · da/.test(sk)) no("Barella comprato una volta: «pagato 14»");
      q(P, ".alb-foglio .chiudi").click(); await W.dorme(200);
      // uno mai preso: solo la sagoma e la frase
      qa(P, ".alb-slot").filter(function (b) { return b.__c && !b.__c.x; })[0].click(); await W.dorme(300);
      sk = testo(P, ".alb-foglio");
      if (!/Non l'hai ancora preso/.test(sk) || /Comprato|Prezzo|partita migliore|In tutte/.test(sk)) no("la scheda di uno mai preso: " + sk.slice(0, 160));
      q(P, ".alb-foglio .chiudi").click(); await W.dorme(200);
      x.push("schede: Martinez L. (prezzo «da 9 a 19», 📋 d'ufficio), Barella (2 stagioni), mai preso (solo sagoma)");
      // 5. lo scaffale e la 2017-18
      P.document.querySelector(".schermata .testa button").click(); await W.dorme(300);   // ‹ all'indice
      q(P, ".alb-stag").click(); await W.dorme(300);
      var cop = qa(P, ".alb-cop"); if (cop.length !== 12) no("album sullo scaffale " + cop.length + " (voluto 12)");
      var c17 = cop.filter(function (b) { return /2017-18/.test(b.textContent); })[0];
      if (!c17 || c17.classList.contains("chiuso")) no("la 2017-18 (con una figurina) è spenta");
      if (qa(P, ".alb-cop.chiuso").length !== 10) no("album spenti " + qa(P, ".alb-cop.chiuso").length + " (voluto 10)");
      c17.click();
      if (!await W.aspetta(function () { return q(P, ".alb-sq .alb-tess") && /2017-18/.test(testo(P, ".alb-stag")); }, 20000)) no("la 2017-18 non si apre");
      var t17 = testo(P, ".alb-tot b"); if (!/^1 \/ \d{3}$/.test(t17)) no("2017-18: il conto dice «" + t17 + "»");
      x.push("scaffale 12 album (10 spenti), 2017-18 «" + t17 + "» con " + qa(P, ".alb-tess").length + " squadre");
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    } finally { W.__statFinte = null; }
    return x.join(" · ");
  } });
})();

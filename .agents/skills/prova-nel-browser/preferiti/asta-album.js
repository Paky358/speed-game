// PROVE DELL'ALBUM DELLE FIGURINE DELLA MINI ASTA (27 nov 2026; scelte del proprietario in D:/SG-album-prove/LEGGIMI.md).
// Uso (dopo copione-prova.js): await COPIONE.carica("preferiti/asta.js"); await COPIONE.carica("preferiti/asta-album.js"); await COPIONE.prova("al1")
// Con Edge invisibile: prova.js --porta 8998 --carica preferiti/asta.js,preferiti/asta-album.js --prova al1,al2,al3,al4,al5,al6,al7,al8,al9
//
// al1 La partita online di tf1 (preferiti/asta-trofei.js: in 3 + Bea che guarda col link) guardando anche l'album: i numeri «con te»
//     (stat.astafanta.al_oggi.<calciatore>) si salvano SOLO sul podio, una volta, uno per calciatore della rosa (18 numeri: dal 28 nov 2026 anche il metallo preso e i pacchetti; una partita,
//     comprato all'asta o d'ufficio, i d'ufficio quanti dice il gioco); 📦 +1 pacchetto sul podio (pk.oggi); Bea niente; dopo il podio l'avviso «📒 Nell'album».
// al2 (il libro, 28 nov 2026, novità v463) Dai Trofei la copertina («3 / N figurine»), l'indice sul campo coi 20 scudetti, le due pagine
//     dell'Inter (1ª portieri e difensori, 2ª con le 3 prese e le sagome, tutto dentro la pagina), la scheda «con te» (Martinez L., Barella
//     in due stagioni), il fumetto di chi manca, ‹ indietro, lo scaffale dalla copertina, la 2017-18; la prima volta niente voli; la riga
//     «Il tuo album» nella prima schermata della Mini Asta; niente scorre di lato.
// al3 (il libro) La figurina nuova vola una volta sola e la squadra appena completa (il Lecce) si accende; «+1» nell'indice; il dito
//     sfoglia avanti e indietro (il tiro corto torna); col telefono girato le due pagine affiancate.
// al5 (i pacchetti, 29 nov 2026) i due tasti, si striscia (un tocco non basta), 3 carte salvate PRIMA dell'animazione, il mazzetto si gira
//     e si butta, il riassunto; «Aprili tutti» con 60 pacchetti (al massimo 6 in fila, un tocco salta alla fine, il nastro, il riassunto);
//     l'ordine a caso (la migliore al 1°, 2° o 3° posto); i doppioni ×4 e il filtro; il metallo preso resta, quando sale «⬆ Oro!».
// al6 sullo stesso telefono (tf2) niente figurine, numeri e pacchetti; la riga «📒 Figurine e pacchetti si vincono online».
// al7 la pagina si ricarica a metà apertura: riaprendo lo stesso pacchetto, niente perso né rimescolato.
// al8 due telefoni con lo stesso profilo aprono insieme: nessun pacchetto aperto due volte né perso (la scrittura sicura).
// al9 il tetto del giorno (10), poi «torna domani».
// al4 (l'album fisso) L'ordine per ruolo e numero di maglia; chi esce dal listone resta al suo posto («💎 Introvabile» se preso,
//     «📦 Solo nei pacchetti» se no, e non conta più nel totale); chi entra dopo va negli «🆕 Aggiornamenti» col numero dopo l'ultimo;
//     la città di una squadra presa da un file (carte/album/citta/<Squadra>.webp; qui l'immagine di prova in album/citta-prova/).
(function () {
  "use strict";
  var W = window, A = COPIONE.aiuti, no = A.no;
  function q(w, s) { return w.document.querySelector(s); }
  function qa(w, s) { return [].slice.call(w.document.querySelectorAll(s)); }
  function testo(w, s) { var e = q(w, s); return e ? e.textContent.replace(/\s+/g, " ").trim() : ""; }

  COPIONE.aggiungi("al1", { nome: "Album: i numeri «con te» salvati solo sul podio, una volta, uno per calciatore; Bea niente; l'avviso «📒 Nell'album»", fai: async function () {
    var cap = {}, orig = COPIONE.aggiungi, salvati = {}, pacchi = {}, avvisi = {}, interno = null;
    COPIONE.aggiungi = function (n, s) { cap[n] = s; return orig(n, s); };
    try { await COPIONE.carica("preferiti/asta-trofei.js"); } finally { COPIONE.aggiungi = orig; }
    if (!cap.tf1) no("non trovo la prova tf1");
    // la spia di tf1 resta la sua: qui si guardano in più i salvataggi dell'album (e chi li fa)
    Object.defineProperty(W, "__spiaProgressi", { configurable: true, get: function () { return interno && function (nome, a, w) {
      [].slice.call(a[2] || []).forEach(function (kv) { if (kv[0] === "pk.oggi") (pacchi[nome] = pacchi[nome] || []).push({ n: kv[1], podio: !!(w && w.document && w.document.querySelector(".st-gradini")) }); });
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
          if (!s.x || s.x.length !== 18) no(n + ": la voce " + s.k + " non ha 18 numeri");
          else if ([0, 1, 2].indexOf(s.x[16]) < 0 || s.x[17] !== 0) no(n + ": la voce " + s.k + " ha metallo/pacchetti " + s.x[16] + "/" + s.x[17]);
          else { if (s.x[6] !== 1) no(n + ": " + s.k + " partite " + s.x[6]); if (s.x[0] + s.x[4] + s.x[5] !== 1) no(n + ": " + s.k + " comprato/ufficio/scambio " + s.x.slice(0, 6)); if (s.x[0] && (s.x[2] !== s.x[1] || s.x[3] !== s.x[1])) no(n + ": " + s.k + " prezzo più basso e più alto sbagliati " + s.x.slice(0, 4)); }
        });
        var pk = pacchi[n] || []; if (pk.length !== 1 || pk[0].n !== 1 || !pk[0].podio) no(n + ": pacchetti salvati " + JSON.stringify(pk) + " (voluto uno, +1, sul podio)");
        if (!avvisi[n] && n !== "Giulia") no(n + ": niente avviso «📒 Nell'album» dopo il podio");   // (Giulia in tf1 ricarica sul podio prima del suo avviso: le figurine restano salvate una volta, l'avviso non torna)
      });
      if (salvati.Bea) no("Bea guarda e salva l'album");
      if (pacchi.Bea) no("Bea guarda e prende un pacchetto");
      var uff = 0; ["Paky", "Giulia", "Luca"].forEach(function (n) { (salvati[n] || []).forEach(function (s) { uff += s.x[4]; }); });
      if (uff < 3) no("d'ufficio nell'album " + uff + " (tf1 ne conta almeno uno per ruolo)");
      x.push("tf1: " + String(r).slice(0, 90) + "…");
      x.push("album: 5 figurine a testa sul podio, d'ufficio " + uff + "; Paky «" + (avvisi.Paky || "").slice(0, 60) + "»");
      var ese = (salvati.Paky || [])[0]; if (ese) x.push("es. " + ese.k + " = " + JSON.stringify(ese.x));
    } finally { clearInterval(guarda); delete W.__spiaProgressi; W.__spiaProgressi = null; }
    return x.join(" · ");
  } });


  // (28 nov 2026, novità v463: l'album è un LIBRO da sfogliare; al2 riscritta, al3 nuova)
  function vista(w) { return qa(w, ".lb-scena > .lb-foglio").filter(function (f) { return f.style.visibility === "visible" && !f.style.transform; })[0] || null; }
  function sqVista(w) { var f = vista(w); return f ? (f.__sq ? f.__sq + " " + f.__pag : (f.classList.contains("lb-ind") ? "indice" : "?")) : "niente"; }
  async function apriCopertina(P) {
    var r = q(P, ".lb-cop").getBoundingClientRect();
    q(P, ".lb-cop").dispatchEvent(new P.MouseEvent("click", { bubbles: true, clientX: r.left + r.width / 2, clientY: r.bottom - 30 }));
    if (!await W.aspetta(function () { return !q(P, ".lb-cop") && sqVista(P) === "indice"; }, 8000)) no("la copertina non si apre sull'indice (" + sqVista(P) + ")");
  }
  function libro(P) { var g = P.SGCuore.giochi.filter(function (y) { return y.id === "astafanta"; })[0]; return g && g.libro ? g.libro() : {}; }
  function fermo(P, voluto) { return sqVista(P) === voluto && !libro(P).giro && !P.document.querySelector(".lb-vola"); }
  async function vai(P, sel, voluto) { var b = q(P, sel); if (!b) no("non trovo " + sel); b.click(); if (!await W.aspetta(function () { return fermo(P, voluto); }, 8000)) no("dopo " + sel + " si vede «" + sqVista(P) + "» (voluto «" + voluto + "»)"); await W.dorme(300); }
  function datiFinti(P) {
    var ids = P.SG_FANTA_IDS; function id(k) { return "fc" + ids[k]; }
    var st = { al_oggi: {}, al_201718: {} };
    st.al_oggi[id("Martinez L. (Inter)")] = [2, 28, 9, 19, 1, 0, 3, 192, 231, 1, 1, 0, 0, 1, 105, "2026-11-12|Cagliari|1"];
    st.al_oggi[id("Barella (Inter)")] = [1, 14, 14, 14, 0, 0, 1, 65, 75, 0, 1, 0, 0, 0, 75, "2026-11-20|Lecce|0"];
    st.al_oggi[id("Thuram (Inter)")] = [0, 0, 0, 0, 1, 0, 1, 60, 60, 0, 0, 0, 0, 0, 60, "2026-11-21|Torino|0"];
    st.al_201718[id("Barella (Inter)")] = [1, 3, 3, 3, 0, 0, 2, 120, 126, 0, 0, 1, 0, 1, 66, "2026-11-18|Genoa|0"];
    return { st: st, id: id };
  }
  function pulisciViste(P) { Object.keys(P.localStorage).filter(function (k) { return /^sg-alb-viste/.test(k); }).forEach(function (k) { P.localStorage.removeItem(k); }); }

  COPIONE.aggiungi("al2", { nome: "Album (il libro): dai Trofei la copertina, l'indice sul campo, le due pagine dell'Inter, la scheda «con te», chi manca, lo scaffale e la 2017-18", fai: async function () {
    var x = [], stat = {};
    W.__statFinte = function (nome, g) { return g === "astafanta" ? stat : {}; };
    try {
      var P = await W.apriTel("Paky", { x: 0 });
      if (!P.SG_FANTA_IDS) await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); });
      var d = datiFinti(P); stat.al_oggi = d.st.al_oggi; stat.al_201718 = d.st.al_201718; pulisciViste(P);
      // 1. la prima schermata della Mini Asta: «📒 Il tuo album · 3 figurine»
      var g = P.SGCuore.giochi.filter(function (y) { return y.id === "astafanta"; })[0]; P.SGCuore.schermataModo(g); await W.dorme(300);
      if (!/Il tuo album/.test(testo(P, ".alb-entra")) || !/3 figurine/.test(testo(P, ".alb-entra"))) no("nella prima schermata della Mini Asta: «" + testo(P, ".alb-entra") + "»");
      // 2. dai Trofei: le linguette, poi la copertina
      P.SGCuore.schermataSfide(); await W.dorme(300);
      var tab = qa(P, ".alb-tab button"); if (tab.length !== 2 || !/Trofei/.test(tab[0].textContent) || !/Album/.test(tab[1].textContent)) no("non ci sono le linguette «Trofei · Album»");
      tab[1].click();
      if (!await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 20000)) no("la copertina non arriva (" + testo(P, ".schermata h1") + ")");
      if (!/^3 \/ \d{3} figurine$/.test(testo(P, ".lb-cop .pc"))) no("la copertina dice «" + testo(P, ".lb-cop .pc") + "»");
      if (q(P, ".schermata.lb .alb-tab") || !/Album/.test(testo(P, ".lb-riga")) || !q(P, ".lb-riga .tr")) no("in cima all'album non c'è la riga sottile «‹ Album … 🏆 Trofei» (o ci sono ancora le linguette): «" + testo(P, ".lb-riga") + "»");
      x.push("copertina «" + testo(P, ".lb-cop .pc") + "»");
      await apriCopertina(P);
      var sq = qa(P, ".lb-ig button[data-sq]"); if (sq.length !== 20) no("squadre nell'indice " + sq.length);
      if (!/^3 \/ \d{3}$/.test(testo(P, ".lb-ind .lb-it .n"))) no("l'indice dice «" + testo(P, ".lb-ind .lb-it .n") + "»");
      if (!q(P, ".lb-ig .scudetto")) no("niente scudetti nell'indice");
      if (q(P, ".lb-ig .nuove")) no("la prima volta l'indice segna figurine «nuove»");
      x.push("indice: " + sq.length + " squadre, «" + testo(P, ".lb-ind .lb-it .n") + "»");
      // 3. l'Inter: due pagine da 16 posti (4×4), la rosa in ordine di ruolo e maglia, poi i posti liberi; in cima «‹ 🛡 Inter 3 / 21»
      await vai(P, ".lb-ig button[data-sq=Inter]", "Inter 1");
      var f1 = vista(P); if (f1.querySelectorAll(".lb-cas").length !== 16) no("la 1ª pagina dell'Inter ha " + f1.querySelectorAll(".lb-cas").length + " posti (voluti 16)");
      if (f1.querySelectorAll(".lb-fig").length) no("nella 1ª pagina dell'Inter ci sono figurine (Martinez L., Barella e Thuram sono dal 17° posto)");
      if (!f1.querySelector(".lb-sf") || !q(P, ".lb-riga .scudetto") || !/Inter/.test(testo(P, ".lb-riga")) || !/3 \/ 21/.test(testo(P, ".lb-riga"))) no("la riga in cima: «" + testo(P, ".lb-riga") + "»");
      var nums = qa(P, ".lb-cas").filter(function (b) { return f1.contains(b); }).map(function (b) { return b.__c.num; }); if (nums[0] !== 225 || nums[15] !== 240) no("i numeri della 1ª pagina dell'Inter: " + nums[0] + "…" + nums[15] + " (voluti 225…240: l'Inter è l'8ª squadra, 32 posti a testa)");
      await vai(P, ".lb-fr.giu", "Inter 2");
      var f2 = vista(P);
      if (!await W.aspetta(function () { return f2.querySelectorAll(".lb-fig canvas").length >= 3; }, 8000)) no("le 3 figurine prese dell'Inter non si disegnano (" + f2.querySelectorAll(".lb-fig canvas").length + ")");
      var vuote = f2.querySelectorAll(".lb-vuoto").length, slot = f2.querySelectorAll(".lb-cas:not(.libero)").length, liberi = f2.querySelectorAll(".lb-cas.libero").length;
      if (vuote !== slot - 3) no("sagome " + vuote + " su " + slot + " (voluto " + (slot - 3) + ")");
      if (slot !== 5 || liberi !== 11) no("la 2ª pagina dell'Inter: " + slot + " calciatori e " + liberi + " posti liberi (voluti 5 e 11)");
      if (P.document.documentElement.scrollWidth > P.innerWidth + 1) no("la pagina scorre di lato");
      var cas = qa(P, ".lb-cas:not(.libero)").filter(function (b) { return f2.contains(b); });
      cas.forEach(function (b) { var r = b.getBoundingClientRect(), rf = f2.getBoundingClientRect(); if (r.bottom > rf.bottom - 20 || r.right > rf.right + 1 || r.left < rf.left - 1) no("la casella di " + b.__c.nome + " esce dalla pagina"); });
      x.push("Inter: 1ª pagina " + f1.querySelectorAll(".lb-cas").length + " caselle, 2ª " + (slot - vuote) + " figurine e " + vuote + " sagome");
      // 4. la scheda «con te» di Martinez L.
      cas.filter(function (b) { return b.__c.nome === "Martinez L."; })[0].click(); await W.dorme(300);
      var sk = testo(P, ".alb-foglio");
      ["Con te nella Serie A di oggi", "6,4", "voto · 3 partite", "7,7", "Comprato all'asta", "2 volte", "pagato in media 14 · da 9 a 19", "📋 1 volta d'ufficio", "10,5", "contro Cagliari", "12 nov"].forEach(function (t) { if (sk.indexOf(t) < 0) no("nella scheda di Martinez L. manca «" + t + "»"); });
      if (/In tutte le stagioni/.test(sk)) no("Martinez L. ha «In tutte le stagioni» ma è in una stagione sola");
      q(P, ".alb-foglio .chiudi").click(); await W.dorme(200);
      cas.filter(function (b) { return b.__c.nome === "Barella"; })[0].click(); await W.dorme(300);
      sk = testo(P, ".alb-foglio");
      if (!/In tutte le stagioni/.test(sk) || !/2 · Oggi, 2017-18/.test(sk)) no("Barella non ha «In tutte le stagioni · 2 · Oggi, 2017-18»");
      if (!/pagato 14/.test(sk) || /in media 14 · da/.test(sk)) no("Barella comprato una volta: «pagato 14»");
      q(P, ".alb-foglio .chiudi").click(); await W.dorme(200);
      // uno mai preso: il fumetto, niente scheda
      cas.filter(function (b) { return !b.__c.x; })[0].click(); await W.dorme(300);
      if (q(P, ".alb-velo")) no("toccando uno mai preso si apre la scheda");
      if (!/Non l'hai ancora preso/.test(testo(P, ".lb-fum"))) no("toccando uno mai preso non c'è «Non l'hai ancora preso…»");
      x.push("schede: Martinez L. e Barella; mai preso: il fumetto");
      // 5. indietro con ‹ fino all'indice
      await vai(P, ".lb-fr.su", "Inter 1");
      // 6. lo scaffale (dalla copertina) e la 2017-18
      P.SGCuore.apriAlbum(); if (!await W.aspetta(function () { return q(P, ".lb-cop .scaf"); }, 8000)) no("la copertina non torna");
      q(P, ".lb-cop .scaf").click(); await W.dorme(300);
      var cop = qa(P, ".alb-cop"); if (cop.length !== 12) no("album sullo scaffale " + cop.length + " (voluto 12)");
      var c17 = cop.filter(function (b) { return /2017-18/.test(b.textContent); })[0];
      if (!c17 || c17.classList.contains("chiuso")) no("la 2017-18 (con una figurina) è spenta");
      c17.click();
      if (!await W.aspetta(function () { return q(P, ".lb-cop") && /2017-18/.test(testo(P, ".lb-cop .st")); }, 20000)) no("la copertina della 2017-18 non arriva");
      if (!/^1 \/ \d{3} figurine$/.test(testo(P, ".lb-cop .pc"))) no("2017-18: la copertina dice «" + testo(P, ".lb-cop .pc") + "»");
      await apriCopertina(P);
      x.push("scaffale 12 album, 2017-18 «" + testo(P, ".lb-ind .lb-it .n") + "» con " + qa(P, ".lb-ig button[data-sq]").length + " squadre");
      if (q(P, ".lb-vola")) no("la prima volta vola una figurina (dovevano contare tutte come già viste)");
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    } finally { W.__statFinte = null; }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("al3", { nome: "Album (il libro): la figurina nuova vola una volta sola, la squadra appena completa si accende, il dito sfoglia, col telefono girato due pagine", fai: async function () {
    var x = [], stat = {};
    W.__statFinte = function (nome, g) { return g === "astafanta" ? stat : {}; };
    try {
      var P = await W.apriTel("Paky", { x: 0 });
      if (!P.SG_FANTA_IDS) await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); });
      var d = datiFinti(P); stat.al_oggi = d.st.al_oggi; pulisciViste(P);
      var gA = P.SGCuore.giochi.filter(function (y) { return y.id === "astafanta"; })[0], lecce = gA.provaAlbum.lista(null).per.Lecce;   // (tutta la rosa del Lecce, come nell'album)
      lecce.slice(1).forEach(function (c) { stat.al_oggi[c.id] = [1, 5, 5, 5, 0, 0, 1, 60, 60, 0, 0, 0, 0, 0, 60, "2026-11-20|Inter|0"]; });   // (al Lecce manca solo il portiere)
      // 1. la prima volta: niente voli
      P.SGCuore.apriAlbum(); if (!await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 20000)) no("la copertina non arriva");
      await apriCopertina(P);
      if (q(P, ".lb-ig .nuove")) no("la prima volta ci sono «nuove» nell'indice");
      // 2. dopo una partita: il portiere del Lecce (la completa) e Dimarco
      stat.al_oggi[lecce[0].id] = [1, 3, 3, 3, 0, 0, 1, 60, 60, 0, 0, 0, 0, 0, 60, "2026-11-28|Inter|0"];
      stat.al_oggi[d.id("Dimarco (Inter)")] = [1, 12, 12, 12, 0, 0, 1, 70, 80, 0, 1, 0, 0, 1, 80, "2026-11-28|Lecce|0"];
      P.SGCuore.apriAlbum(); if (!await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 8000)) no("la copertina non torna");
      await apriCopertina(P);
      var nu = qa(P, ".lb-ig button[data-sq]").filter(function (b) { return b.querySelector(".nuove"); }).map(function (b) { return b.dataset.sq + " " + b.querySelector(".nuove").textContent; });
      if (nu.join(",") !== "Inter +1,Lecce +1") no("nell'indice le nuove sono «" + nu.join(", ") + "» (voluto Inter +1, Lecce +1)");
      // 3. il Lecce: vola il portiere, si attacca, poi la festa (lo scudetto d'oro, «Lecce completa!»)
      q(P, ".lb-ig button[data-sq=Lecce]").click();
      var volo = await W.aspetta(function () { return q(P, ".lb-vola"); }, 6000); if (!volo) no("la figurina nuova del Lecce non vola");
      var festa = await W.aspetta(function () { return /Lecce completa/.test(testo(P, ".lb-banda")); }, 8000); if (!festa) no("niente «⭐ Lecce completa!»");
      await W.aspetta(function () { return !q(P, ".lb-banda"); }, 6000);
      var f = vista(P); if (!f || f.__sq !== "Lecce" || f.querySelectorAll(".lb-vuoto").length) no("dopo il volo la 1ª pagina del Lecce ha ancora caselle vuote");
      x.push("Lecce: vola il portiere, poi «Lecce completa!»");
      // 4. di nuovo: niente voli né feste
      P.SGCuore.apriAlbum(); await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 8000); await apriCopertina(P);
      nu = qa(P, ".lb-ig .nuove").length; if (nu !== 1) no("riaprendo, «nuove» nell'indice " + nu + " (voluto 1: Dimarco non ancora visto)");
      q(P, ".lb-ig button[data-sq=Lecce]").click(); await W.aspetta(function () { return fermo(P, "Lecce 1"); }, 5000); await W.dorme(1500);
      if (q(P, ".lb-vola") || q(P, ".lb-banda")) no("riaprendo il Lecce vola o festeggia di nuovo");
      // 5. il dito: si trascina la pagina a sinistra (Lecce 1 → Lecce 2) e poi a destra (torna)
      var sc = q(P, ".lb-scena"), r = sc.getBoundingClientRect();
      async function tira(da, a) { var id = 7; sc.dispatchEvent(new P.PointerEvent("pointerdown", { bubbles: true, pointerId: id, clientX: r.left + r.width * da, clientY: r.top + r.height * 0.5, button: 0 }));
        for (var k = 1; k <= 8; k++) { await W.dorme(30); sc.dispatchEvent(new P.PointerEvent("pointermove", { bubbles: true, pointerId: id, clientX: r.left + r.width * (da + (a - da) * k / 8), clientY: r.top + r.height * 0.5 })); }
        await W.dorme(120);
        sc.dispatchEvent(new P.PointerEvent("pointerup", { bubbles: true, pointerId: id, clientX: r.left + r.width * a, clientY: r.top + r.height * 0.5 })); }
      await tira(0.85, 0.2); if (!await W.aspetta(function () { return fermo(P, "Lecce 2"); }, 4000)) no("trascinando a sinistra non si va alla 2ª pagina (" + sqVista(P) + ")");
      await tira(0.15, 0.9); if (!await W.aspetta(function () { return fermo(P, "Lecce 1"); }, 4000)) no("trascinando a destra non si torna (" + sqVista(P) + ")");
      await tira(0.85, 0.75); await W.dorme(900); if (sqVista(P) !== "Lecce 1") no("un tiro corto gira la pagina (" + sqVista(P) + ")");
      x.push("il dito: avanti, indietro, il tiro corto torna");
      // 6. il telefono girato: le due pagine affiancate; dritto di nuovo: una
      var fr = W.document.getElementById("tel-Paky"), w0 = fr.style.width, h0 = fr.style.height;
      fr.style.width = "640px"; fr.style.height = "360px";
      if (!await W.aspetta(function () { return q(P, ".lb-aperto .due") && q(P, ".lb-aperto .due").querySelectorAll(".lb-foglio").length === 2; }, 4000)) no("col telefono girato non ci sono le due pagine");
      x.push("girato: «" + testo(P, ".lb-aperto .bar span") + "»");
      fr.style.width = w0; fr.style.height = h0;
      if (!await W.aspetta(function () { return !q(P, ".lb-aperto") && vista(P); }, 4000)) no("rigirando il telefono il libro non torna a una pagina");
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    } finally { W.__statFinte = null; }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("al4", { nome: "Album fisso: ordine per ruolo e numero di maglia, chi esce resta (💎 Introvabile o 📦 Solo nei pacchetti), chi entra va nel primo posto libero della sua squadra, la città da un file", fai: async function () {
    var x = [], stat = {};
    W.__statFinte = function (nome, g) { return g === "astafanta" ? stat : {}; };
    try {
      var P = await W.apriTel("Paky", { x: 0 });
      if (!P.SG_FANTA_IDS) await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); });
      var d = datiFinti(P); stat.al_oggi = d.st.al_oggi; pulisciViste(P);
      var FIS = P.SG_ALBUM_OGGI, DAT = P.SG_FANTA_CALCIATORI, NUM = Object.assign({}, P.SG_FANTA_NUMERI || {}); Object.keys((P.SG_FANTA_CAMPO || {}).calciatori || {}).forEach(function (k) { if (NUM[k] == null) NUM[k] = P.SG_FANTA_CAMPO.calciatori[k][2]; });   // (anche i numeri dei «solo per il campo»)
      if (!FIS || Object.keys(FIS).length !== 20) no("non c'è l'album fisso di oggi (data/album-oggi.js)");
      // 1. l'ordine: in ogni squadra P, D, C, A e dentro il ruolo per numero di maglia (chi non l'ha in fondo)
      var male = [];
      Object.keys(FIS).forEach(function (sq) { var l = FIS[sq], ru = "PDCA";
        for (var i = 1; i < l.length; i++) { var a = l[i - 1].split("|"), b = l[i].split("|"); if (ru.indexOf(a[0]) > ru.indexOf(b[0])) male.push(sq + ": " + l[i]); else if (a[0] === b[0]) { var na = NUM[a[1] + " (" + sq + ")"], nb = NUM[b[1] + " (" + sq + ")"]; na = na == null ? 1e4 : (na[0] != null ? na[0] : na); nb = nb == null ? 1e4 : (nb[0] != null ? nb[0] : nb); if (na > nb) male.push(sq + ": " + a[1] + " (" + na + ") prima di " + b[1] + " (" + nb + ")"); } } });
      if (male.length) no("ordine dell'album: " + male.slice(0, 4).join(" · "));
      // 2. cambia il listone (come se arrivasse quello nuovo): escono Martinez L. (che hai: 💎) e Bisseck (che non hai: 🔒); Barella «entra dopo»
      function togli(k) { ["P", "D", "C", "A"].forEach(function (r) { ["A", "B", "C"].forEach(function (f) { var l = (DAT[r] || {})[f]; if (l) { var j = l.indexOf(k); if (j >= 0) l.splice(j, 1); } }); }); }
      var salvaD = JSON.stringify(DAT), salvaF = JSON.stringify(FIS);
      togli("Martinez L. (Inter)"); togli("Bisseck (Inter)");
      FIS.Inter = FIS.Inter.filter(function (v) { return v !== "C|Barella"; });
      P.L2S.CITTA_FILE.push("Napoli"); P.L2S.CARTELLA = "/.agents/skills/prova-nel-browser/album/citta-prova/";
      try {
        P.SGCuore.apriAlbum(); if (!await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 20000)) no("la copertina non arriva");
        await apriCopertina(P);
        if (q(P, ".lb-ig button.agg")) no("ci sono gli «🆕 Aggiornamenti»: Barella doveva andare nel posto libero dell'Inter");
        // la 1ª pagina dell'Inter: Bisseck 📦 al suo posto; la 2ª: Martinez L. 💎 al suo posto e Barella nel primo posto libero (n. 245)
        await vai(P, ".lb-ig button[data-sq=Inter]", "Inter 1");
        var bis = qa(P, ".lb-cas").filter(function (b) { return vista(P).contains(b) && b.__c.nome === "Bisseck"; })[0];
        if (!bis || !/Solo nei pacchetti/.test(bis.textContent)) no("Bisseck (uscito, non preso) non dice «📦 Solo nei pacchetti»");
        bis.click(); await W.dorme(200); if (!/Solo nei pacchetti/.test(testo(P, ".lb-fum"))) no("il fumetto di Bisseck non dice «Solo nei pacchetti»");
        var nI = testo(P, ".lb-riga .lb-conto .n"); x.push("Inter «" + nI + "» (Bisseck conta: si trova nei pacchetti)");
        await vai(P, ".lb-fr.giu", "Inter 2");
        var f2 = vista(P), mar = qa(P, ".lb-cas").filter(function (b) { return f2.contains(b) && b.__c.nome === "Martinez L."; })[0];
        if (!mar || !mar.querySelector(".lb-fig") || !/Introvabile/.test(mar.textContent)) no("Martinez L. (uscito, preso) non ha «💎 Introvabile»");
        var bar = qa(P, ".lb-cas").filter(function (b) { return f2.contains(b) && b.__c.nome === "Barella"; })[0];
        if (!bar || !bar.__c.arrivo || bar.__c.num !== 245) no("Barella (arrivato dopo) non è nel primo posto libero dell'Inter (n. " + (bar && bar.__c.num) + ", voluto 245)");
        var lib = qa(P, ".lb-cas.libero").filter(function (b) { return f2.contains(b); }).map(function (b) { return b.__c.num; }); if (lib[0] !== 246) no("il primo posto libero dopo Barella è " + lib[0]);
        x.push("Barella arrivato dopo: n. " + (bar && bar.__c.num) + " nel posto libero dell'Inter; Martinez L. 💎, Bisseck 📦");
        // la città del Napoli dal file: la pagina si disegna con l'immagine
        P.SGCuore.apriAlbum(); await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 8000); await apriCopertina(P);
        await vai(P, ".lb-ig button[data-sq=Napoli]", "Napoli 1");
        if (!await W.aspetta(function () { var c = libro(P).citta; return c && c.Napoli && c.Napoli.ok; }, 6000)) no("la città del Napoli dal file non arriva");
        x.push("città da file: il Napoli prende l'immagine (" + libro(P).citta.Napoli.img.naturalWidth + "x" + libro(P).citta.Napoli.img.naturalHeight + ")");
      } finally { var D0 = JSON.parse(salvaD), F0 = JSON.parse(salvaF); Object.keys(D0).forEach(function (k) { DAT[k] = D0[k]; }); Object.keys(F0).forEach(function (k) { FIS[k] = F0[k]; }); P.L2S.CITTA_FILE.length = 0; P.L2S.CARTELLA = "carte/album/citta/"; }
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    } finally { W.__statFinte = null; }
    return x.join(" · ");
  } });

  // ---- 📦 i pacchetti (29 nov 2026): aiuti delle prove ----
  function statConSpia(stat, salvate) {
    function metti(kv, somma) { var k = kv[0].split("."), o = stat; for (var i = 0; i < k.length - 1; i++) o = o[k[i]] = o[k[i]] || {}; o[k[k.length - 1]] = somma ? (o[k[k.length - 1]] || 0) + kv[1] : kv[1]; }
    W.__statFinte = function (nome, g) { return g === "astafanta" ? stat : {}; };
    W.__spiaProgressi = function (nome, a) { if (salvate) salvate.push({ nome: nome, incr: a[2] || [], set: a[4] || [] }); (a[2] || []).forEach(function (kv) { metti(kv, true); }); (a[4] || []).forEach(function (kv) { metti(kv, false); }); };
  }
  async function gesto(P, el, da, a, passi) {   // il dito: da [x,y] a [x,y] in frazioni del rettangolo di el, sulla scena dei pacchetti
    var sc = q(P, ".pk-scena"), r = el.getBoundingClientRect(), id = 9, n = passi || 8;
    function ev(t, k) { var x = r.left + r.width * (da[0] + (a[0] - da[0]) * k), y = r.top + r.height * (da[1] + (a[1] - da[1]) * k); (document.elementFromPoint ? sc : sc).dispatchEvent(new P.PointerEvent(t, { bubbles: true, pointerId: id, clientX: x, clientY: y, button: 0 })); }
    ev("pointerdown", 0); for (var k = 1; k <= n; k++) { await W.dorme(25); ev("pointermove", k / n); } await W.dorme(60); ev("pointerup", 1);
  }
  async function apriPacchetti(P) { P.SGCuore.apriAlbum(); if (!await W.aspetta(function () { return q(P, ".lb-cop .pk-apri"); }, 20000)) no("sulla copertina non c'è «Apri i pacchetti»"); q(P, ".lb-cop .pk-apri").click(); if (!await W.aspetta(function () { return q(P, ".lb-pk .pk-piede button") || q(P, ".pk-mazzo") || q(P, ".pk-nastro"); }, 5000)) no("la schermata dei pacchetti non si apre"); }
  function tasto(P, re) { return qa(P, ".pk-piede button").filter(function (b) { return re.test(b.textContent); })[0]; }

  COPIONE.aggiungi("al5", { nome: "Pacchetti: i due tasti, si striscia (il tocco non basta), 3 carte salvate prima dell'animazione, il mazzetto si gira e si butta, «Aprili tutti» a onda, l'ordine a caso, i doppioni ×N, il metallo che sale", fai: async function () {
    var x = [], stat = { al_oggi: {}, pk: { oggi: 3 } }, salvate = [], migliori = [0, 0, 0, 0, 0];
    statConSpia(stat, salvate);
    try {
      var P = await W.apriTel("Paky", { x: 0 });
      if (!P.SG_FANTA_IDS) await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); });
      pulisciViste(P); try { P.localStorage.removeItem("sg-pk-visto"); } catch (e) {}
      var id = function (k) { return "fc" + P.SG_FANTA_IDS[k]; };
      var oro = null; P.SG_ALBUM_OGGI.Inter.forEach(function (v) { var c = { nome: v.slice(2), squadra: "Inter", ruolo: v[0] }; if (!oro && P.__FASCIA(c) === "oro") oro = c; });
      stat.al_oggi[id(oro.nome + " (Inter)")] = [1, 20, 20, 20, 0, 0, 1, 60, 60, 0, 0, 0, 0, 0, 60, "2026-11-20|Lecce|0", 0, 0];
      stat.al_oggi[id("Thuram (Inter)")] = [0, 0, 0, 0, 1, 0, 1, 60, 60, 0, 0, 0, 0, 0, 60, "2026-11-21|Torino|0"];
      stat.al_oggi[id("Barella (Inter)")] = [1, 14, 14, 14, 0, 0, 1, 65, 75, 0, 1, 0, 0, 0, 75, "2026-11-20|Lecce|0", 1, 3];   // (×4: 1 all'asta + 3 nei pacchetti)
      P.SG_PROVA_PACCO = function (pacchi) { pacchi.forEach(function (l) { var m = l.map(function (o) { return ["bronzo", "argento", "oro"].indexOf(o.met); }), best = Math.max.apply(null, m); if (m.filter(function (y) { return y === best; }).length === 1) migliori[m.indexOf(best)]++; }); return pacchi; };
      // 1. il pallino sui Trofei, la copertina, ⬆ ora è oro, i doppioni ×4 e il filtro
      P.SGCuore.schermataSfide(); await W.dorme(300);
      if (testo(P, ".alb-tab .alb-pallino") !== "3") no("il pallino dei pacchetti sui Trofei dice «" + testo(P, ".alb-tab .alb-pallino") + "»");
      P.SGCuore.apriAlbum(); if (!await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 20000)) no("la copertina non arriva");
      if (testo(P, ".lb-cop .pk-n") !== "3") no("sulla copertina: «" + testo(P, ".lb-cop .pk-apri") + "»");
      await apriCopertina(P); await vai(P, ".lb-ig button[data-sq=Inter]", "Inter 1"); await vai(P, ".lb-fr.giu", "Inter 2");
      var trova = function (nome) { return qa(P, ".lb-cas").filter(function (b) { return vista(P) && vista(P).contains(b) && b.__c.nome === nome; })[0]; };
      if (oro.ruolo === "C" || oro.ruolo === "A") { var co = trova(oro.nome); if (!co || co.__c.metFisso !== "bronzo" || !/ora è oro/.test(co.textContent)) no(oro.nome + ": la carta non è bronzo con «⬆ ora è oro»"); }
      var ba = trova("Barella"); if (!ba || !ba.querySelector(".lb-copie") || ba.querySelector(".lb-copie").textContent !== "×4") no("Barella non ha «×4» (" + (ba && ba.textContent) + ")");
      x.push("Barella ×4");
      // 2. la schermata dei pacchetti: i due tasti
      await apriPacchetti(P);
      if (!tasto(P, /Apri 1/) || !tasto(P, /Aprili tutti \(3\)/)) no("i due tasti: " + qa(P, ".pk-piede button").map(function (b) { return b.textContent; }).join(" | "));
      // 3. «Apri 1»: si salva SUBITO (prima della striscia): 3 carte, i pacchetti a 2, l'ultimo aperto
      var prima = salvate.length; tasto(P, /Apri 1/).click();
      if (!await W.aspetta(function () { return q(P, ".pk-busta"); }, 5000)) no("il pacchetto non arriva");
      var sv = salvate.slice(prima); if (sv.length !== 1) no("salvataggi prima della striscia: " + sv.length + " (voluto 1)");
      if (stat.pk.oggi !== 2 || !stat.pkUltimo || stat.pkUltimo.p.length !== 1 || stat.pkUltimo.p[0].length !== 5) no("dopo «Apri 1»: pacchetti " + stat.pk.oggi + ", ultimo " + JSON.stringify(stat.pkUltimo).slice(0, 80));
      // 4. un tocco non basta; la striscia sì
      var b = q(P, ".pk-busta"); await gesto(P, b, [0.5, 0.5], [0.5, 0.5], 1); await W.dorme(400);
      if (q(P, ".pk-mazzo")) no("un tocco ha aperto il pacchetto");
      await gesto(P, b, [0.05, 0.14], [0.95, 0.14]);
      if (!await W.aspetta(function () { return qa(P, ".pk-mazzo .pk-carta").length === 5; }, 5000)) no("strisciando non escono le 5 carte");
      if (!q(P, ".pk-mazzo .pk-carta.girata")) no("la prima carta non si vede subito");
      // 5. il mazzetto di faccia: trascinando piano si sbircia (non si butta), strisciando si butta; 5 volte; poi il riassunto
      var mz0 = q(P, ".pk-mazzo"); await W.dorme(400); var prima5 = qa(P, ".pk-mazzo .pk-carta").length; await gesto(P, mz0, [0.4, 0.5], [0.62, 0.5], 14); await W.dorme(500);
      if (qa(P, ".pk-mazzo .pk-carta").length !== prima5) no("sbirciando piano la carta è volata via");
      for (var k = 0; k < 5; k++) {
        var mz = q(P, ".pk-mazzo"); await W.dorme(450);
        if (!await W.aspetta(function () { return q(P, ".pk-mazzo .pk-carta.girata"); }, 3000)) no("la carta " + (k + 1) + " non si vede");
        await gesto(P, mz, [0.3, 0.5], [1.1, 0.5]); await W.dorme(600);
      }
      if (!await W.aspetta(function () { return q(P, ".pk-somma"); }, 4000)) no("niente riassunto dopo le 5 carte");
      if (!/5 figurine/.test(testo(P, ".pk-somma")) || qa(P, ".pk-griglia .pk-carta").length !== 5) no("il riassunto: «" + testo(P, ".pk-somma") + "»");
      if (!qa(P, ".pk-griglia .pk-carta.nuova").length) no("nel pacchetto nessuna «NUOVA!» (la 1ª scelta è sempre nuova)");
      x.push("Apri 1: " + testo(P, ".pk-somma"));
      // 6. «Aprili tutti» con 60 pacchetti in più: una striscia, l'onda (un tocco salta alla fine), il nastro, il riassunto
      stat.pk.oggi += 60; var tt = tasto(P, /Aprili tutti/); if (!tt) no("dopo il riassunto non c'è «Aprili tutti»"); tt.click();
      if (!await W.aspetta(function () { return q(P, ".pk-fila"); }, 6000)) no("la fila dei pacchetti non arriva");
      if (qa(P, ".pk-fila .pk-busta").length > 6) no("in fila più di 6 pacchetti: " + qa(P, ".pk-fila .pk-busta").length);
      await gesto(P, q(P, ".pk-fila"), [0.05, 0.14], [1.1, 0.14]); await W.dorme(700);
      await gesto(P, q(P, ".pk-scena"), [0.5, 0.5], [0.5, 0.5], 1);   // (un tocco: alla fine dell'onda)
      if (!await W.aspetta(function () { return q(P, ".pk-nastro"); }, 6000)) no("dopo l'onda non si scorrono le carte");
      await gesto(P, q(P, ".pk-nastro"), [0.8, 0.5], [0.2, 0.5]); await W.dorme(500);
      if (!/^2 \/ 310/.test(testo(P, ".pk-scena .pk-dito"))) no("scorrendo: «" + testo(P, ".pk-scena .pk-dito") + "»");
      tasto(P, /riassunto/).click(); if (!await W.aspetta(function () { return /310 figurine/.test(testo(P, ".pk-somma")); }, 4000)) no("il riassunto di tutti: «" + testo(P, ".pk-somma") + "»");
      if (stat.pk.oggi !== 0) no("pacchetti alla fine: " + stat.pk.oggi);
      x.push("Aprili tutti: " + testo(P, ".pk-somma"));
      // 7. l'ordine a caso: la carta migliore (quando ce n'è una sola) sta al 1°, 2° o 3° posto
      var tot = migliori.reduce(function (a, b) { return a + b; }, 0);
      if (tot < 20 || migliori.some(function (y) { return y < tot * 0.09; })) no("dove sta la carta migliore nei pacchetti: " + migliori.join("/"));
      x.push("la migliore al 1°…5° posto: " + migliori.join("/"));
      // 8. il metallo che sale (come ricomprato): «⬆ Oro!» una volta
      qa(P, ".pk-piede button").pop().click(); await W.dorme(600);
      stat.al_oggi[id(oro.nome + " (Inter)")][16] = 2;
      P.SGCuore.apriAlbum(); await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 8000); await apriCopertina(P);
      q(P, ".lb-ig button[data-sq=Inter]").click(); await W.aspetta(function () { return fermo(P, "Inter 1"); }, 6000);
      if (oro.ruolo === "C" || oro.ruolo === "A") { await W.dorme(3500); await vai(P, ".lb-fr.giu", "Inter 2"); }
      if (!await W.aspetta(function () { return /Oro!/.test(testo(P, ".lb-su")); }, 45000)) no("niente festa «⬆ Oro!» quando il metallo sale");   // (prima volano le figurine nuove dei 60 pacchetti)
      // 9. il filtro doppioni: le carte restano al loro posto, si spengono le altre
      P.SGCuore.apriAlbum(); await W.aspetta(function () { return q(P, ".lb-cop canvas"); }, 8000); await apriCopertina(P);
      q(P, ".lb-it .lb-doppi").click(); await W.dorme(200); if (!q(P, ".lb-scena.doppi") || !q(P, ".lb-filtro")) no("il filtro «🔁 Doppioni» non si accende");
      x.push("filtro doppioni");
      var err = W.erroriTel(); if (err.length) no("errori: " + err.slice(0, 3).join(" | "));
    } finally { W.__statFinte = null; W.__spiaProgressi = null; }
    return x.join(" · ");
  } });

  COPIONE.aggiungi("al6", { nome: "Sullo stesso telefono niente figurine, niente numeri e niente pacchetti (solo online); la riga «si vincono online»", fai: async function () {
    var cap = {}, orig = COPIONE.aggiungi, album = [], pacchi = [], interno = null, riga = false;
    COPIONE.aggiungi = function (n, s) { cap[n] = s; return orig(n, s); };
    try { await COPIONE.carica("preferiti/asta-trofei.js"); } finally { COPIONE.aggiungi = orig; }
    if (!cap.tf2) no("non trovo la prova tf2");
    Object.defineProperty(W, "__spiaProgressi", { configurable: true, get: function () { return interno && function (nome, a, w) {
      [].slice.call(a[2] || []).forEach(function (kv) { if (/^pk\./.test(kv[0])) pacchi.push(kv); });
      [].slice.call(a[4] || []).forEach(function (kv) { if (/^al_|^pk/.test(kv[0])) album.push(kv[0]); });
      return interno(nome, a, w);
    }; }, set: function (f) { interno = f; } });
    try { localStorage.removeItem("sg-alb-solo-online"); } catch (e) {}
    var guarda = setInterval(function () { var w = W.finestra("Paky"); if (w && !w.__pulito) { w.__pulito = 1; try { w.localStorage.removeItem("sg-alb-solo-online"); } catch (e) {} } if (w && [].some.call(w.document.querySelectorAll(".avviso-trofeo"), function (b) { return /si vincono online/.test(b.textContent); })) riga = true; }, 200);
    try {
      var r = await cap.tf2.fai(); await W.aspetta(function () { return riga; }, 20000);
      if (album.length) no("sullo stesso telefono salvati nell'album: " + album.slice(0, 3).join(", "));
      if (pacchi.length) no("sullo stesso telefono un pacchetto: " + JSON.stringify(pacchi));
      if (!riga) no("niente riga «📒 Figurine e pacchetti si vincono online»");
      return "tf2: " + String(r).slice(0, 80) + "… · niente album né pacchetti, la riga «si vincono online»";
    } finally { clearInterval(guarda); delete W.__spiaProgressi; W.__spiaProgressi = null; }
  } });

  COPIONE.aggiungi("al7", { nome: "Pacchetti: la pagina si ricarica a metà apertura → riaprendo, lo stesso pacchetto («Ecco il pacchetto che stavi aprendo»), niente perso né rimescolato", fai: async function () {
    var stat = { al_oggi: {}, pk: { oggi: 2 } }; statConSpia(stat);
    try {
      var P = await W.apriTel("Paky", { x: 0 });
      if (!P.SG_FANTA_IDS) await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); });
      pulisciViste(P); try { P.localStorage.removeItem("sg-pk-visto"); } catch (e) {}
      await apriPacchetti(P); tasto(P, /Apri 1/).click(); if (!await W.aspetta(function () { return q(P, ".pk-busta"); }, 5000)) no("il pacchetto non arriva");
      var ids = stat.pkUltimo.p[0].map(function (q0) { return q0[0]; }).join(","); if (stat.pk.oggi !== 1) no("pacchetti dopo «Apri 1»: " + stat.pk.oggi);
      // la pagina si ricarica (un telefono nuovo con lo stesso profilo e la stessa memoria)
      P = await W.apriTel("Paky", { x: 0 }); if (!P.SG_FANTA_IDS) await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); });
      await apriPacchetti(P);
      if (!/stavi aprendo/.test(testo(P, ".pk-ritrovato"))) no("riaprendo non c'è «Ecco il pacchetto che stavi aprendo»");
      var vis = qa(P, ".pk-mazzo .pk-carta").map(function (n) { return n.__o.id; }).join(",");
      if (vis !== ids) no("le carte ritrovate («" + vis + "») non sono quelle salvate («" + ids + "»)");
      if (stat.pk.oggi !== 1) no("ricaricando i pacchetti sono " + stat.pk.oggi + " (voluto 1)");
      return "dopo la ricarica: lo stesso pacchetto (" + ids.split(",").length + " carte), pacchetti " + stat.pk.oggi;
    } finally { W.__statFinte = null; W.__spiaProgressi = null; }
  } });

  COPIONE.aggiungi("al8", { nome: "Pacchetti: due telefoni con lo stesso profilo aprono insieme → nessun pacchetto aperto due volte né perso", fai: async function () {
    var stat = { al_oggi: {}, pk: { oggi: 5 } }, salvate = []; statConSpia(stat, salvate);
    try {
      var A1 = await W.apriTel("Paky", { x: 0 }), A2 = await W.apriTel("Paky2", { x: 1 });
      [A1, A2].forEach(function (P) { pulisciViste(P); });
      for (var P of [A1, A2]) { if (!P.SG_FANTA_IDS) await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); }); await apriPacchetti(P); }
      var t1 = tasto(A1, /Aprili tutti/), t2 = tasto(A2, /Aprili tutti/); if (!t1 || !t2) no("«Aprili tutti» non c'è su tutti e due");
      t1.click(); t2.click(); await W.dorme(1500);
      var aperti = salvate.map(function (s) { var p = s.set.filter(function (kv) { return kv[0] === "pkUltimo"; })[0]; return p ? p[1].p.length : 0; }), somma = aperti.reduce(function (a, b) { return a + b; }, 0);
      if (somma !== 5) no("pacchetti aperti in tutto " + somma + " (" + aperti.join(" + ") + ", voluto 5)");
      if (stat.pk.oggi !== 0) no("pacchetti rimasti " + stat.pk.oggi);
      var secondo = A2.document.querySelector(".pk-fila") ? "l'onda" : testo(A2, ".pk-scena");
      return "aperti " + aperti.join(" + ") + " = 5, rimasti 0; sul secondo telefono: «" + secondo.slice(0, 60) + "»";
    } finally { W.__statFinte = null; W.__spiaProgressi = null; }
  } });

  COPIONE.aggiungi("al9", { nome: "Pacchetti: il tetto del giorno (10), poi «torna domani»; il giorno dopo si riparte", fai: async function () {
    var P = await W.apriTel("Paky", { x: 0 }); if (!P.SG_FANTA_IDS) await new Promise(function (ok) { P.SGCuore.caricaPezzo("asta").then(ok, ok); });
    var g = P.SGCuore.giochi.filter(function (y) { return y.id === "astafanta"; })[0], pr = g.provaAlbum, oggi = pr.dataOggi();
    var a = pr.pacchettoDiOggi({}), b = pr.pacchettoDiOggi({ pkGiorno: oggi + "|9" }), c = pr.pacchettoDiOggi({ pkGiorno: oggi + "|10" }), d = pr.pacchettoDiOggi({ pkGiorno: "2020-1-1|10" });
    if (!a.ok || a.set[0][1] !== oggi + "|1") no("il primo pacchetto del giorno: " + JSON.stringify(a));
    if (!b.ok || b.set[0][1] !== oggi + "|10") no("il decimo: " + JSON.stringify(b));
    if (c.ok) no("l'undicesimo dovrebbe essere «torna domani»: " + JSON.stringify(c));
    if (!d.ok) no("il giorno dopo si deve ripartire: " + JSON.stringify(d));
    return "tetto " + pr.PK_GIORNO + " al giorno: 1°, 10° sì, 11° no, il giorno dopo sì";
  } });
})();

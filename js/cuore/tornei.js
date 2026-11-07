/* =========================================================
   PEZZO DEL CUORE — ⚔️ I TORNEI
   Il torneo a eliminazione nei giochi a due (gironi, «🎲 A caso» o «✋ Scegliete voi», il Bot che
   gioca davvero, chi passa il turno, il tabellone, chi guarda le partite), il torneino dentro la
   Sala della serata, e il torneo a punti sullo stesso telefono («🏆 Serata a punti»).
   GIOCHI_ELIMINAZIONE, MAX_ELIM e giocoDa restano nel cuore (li usano tutti).
   Pezzo del cuore (js/core.js): prende gli aiuti dal cuore all'inizio («dal cuore»)
   e in fondo gli lascia quello che usano gli altri («al cuore»). Vedi AGENTS.md.
   ========================================================= */
(function () {
  "use strict";
  var cuore = window.SGCuore;
  // ---- dal cuore: gli aiuti che questo pezzo usa (non cambiano mai, si prendono una volta) ----
  var giochi = cuore.giochi, el = cuore.el, svuota = cuore.svuota, mischia = cuore.mischia, schermata = cuore.schermata, mostra = cuore.mostra,
      tesseraGioco = cuore.tesseraGioco, pillola = cuore.pillola, schermataHome = cuore.schermataHome, profiloAttivo = cuore.profiloAttivo,
      gruppo = cuore.gruppo, nomiGruppo = cuore.nomiGruppo, schermataSala = cuore.schermataSala, schermataPreGioco = cuore.schermataPreGioco,
      MAX_ELIM = cuore.MAX_ELIM, giocoDa = cuore.giocoDa, medaglieAPari = cuore.medaglieAPari, classificaFitta = cuore.classificaFitta,
      cifre = cuore.cifre, stessoNome = cuore.stessoNome, lasciaPartita = cuore.lasciaPartita, avviaPartita = cuore.avviaPartita;

  // =========================================================
  //  TORNEO A ELIMINAZIONE (giochi a due: Tris, Drop 4…)
  //  Un link solo: si sorteggiano le coppie, chi vince va avanti.
  //  Primo turno con un numero dispari: chi resta gioca col Bot (un partecipante vero: se vince va avanti
  //  anche lui, fino alla finale) oppure passa il turno, come sceglie l'host (E.resto: "bot" / "passa").
  //  Nei turni dopo, chi resta senza avversario passa il turno (a sorte, mai due volte lo stesso se si può).
  //  Ogni partita è una stanza a parte tra i due: il primo la apre, l'altro
  //  entra da solo; chi l'ha aperta (o chi gioca col bot) dice chi ha vinto.
  //  L'host della sala può decidere a mano una partita bloccata.
  //  Il TORNEINO (E.torneino) è lo stesso torneo dentro la Sala della serata: stessi id, e alla fine si torna nella Sala.
  // =========================================================
  function nomeElim(E, id) { return id === "bot" ? "🤖 " + ((E.bot && E.bot.nome) || "Bot") : ((E.nomi && E.nomi[id]) || "…"); }
  function livelloElim(E) { var l = E && E.livello; return l === "facile" || l === "difficile" ? l : "medio"; }
  // il Bot del torneo per la partita (aiuti.bot del gioco): quello del gruppo fisso, col nome che c'è nel tabellone
  function botDelTorneo(E) {
    var b = (E && E.bot && cuore.botDaId(E.bot.id)) || cuore.botPrendi(1, { livello: livelloElim(E) })[0] || null;
    if (b && E && E.bot && E.bot.nome) b.nome = E.bot.nome;
    if (b) b.livello = livelloElim(E);   // (la bravura scelta all'inizio, uguale per tutto il torneo)
    return b;
  }
  // è già passato al turno dopo senza giocare
  function favoritoElim(E, id) {
    return E.turni.some(function (tu) { return tu.some(function (p) { return p.a === id && !p.b; }); });
  }
  // un turno dopo il primo: chi resta senza avversario passa il turno (a sorte tra chi non è ancora passato);
  // nella partita col Bot lui è sempre il secondo (la gioca il telefono di chi gli sta davanti)
  function creaTurnoElim(E, ids) {
    var r = E.turni.length, tu = [], solo = null;
    ids = ids.slice();
    if (ids.length % 2) {
      var liberi = ids.filter(function (id) { return !favoritoElim(E, id); }), tra = liberi.length ? liberi : ids;
      solo = tra[Math.floor(Math.random() * tra.length)];
      ids.splice(ids.indexOf(solo), 1);
    }
    for (var i = 0; i + 1 < ids.length; i += 2) {
      var a = ids[i], b = ids[i + 1];
      if (a === "bot") { a = b; b = "bot"; }
      tu.push({ a: a, b: b, stanza: SGNet.nuovoCodice(), vince: null });
    }
    if (solo) tu.push({ a: solo, b: null, vince: solo });
    tu.forEach(function (p, j) { p.k = r + "-" + j; });
    E.turni.push(tu);
  }
  // ---- i gironi: prima di partire ognuno sceglie dove sedersi (all'inizio sono tutti in panchina) ----
  var N_GIRONI = MAX_ELIM / 2;   // 5 gironi da 2 posti
  function chiNelGirone(E, n) { return Object.keys(E.gironi || {}).filter(function (id) { return E.gironi[id] === n; }); }
  function scegliGironeElim(id, n) {   // n = 1..5, 0 = panchina
    var E = cuore.sala && cuore.sala.elim; if (!E || E.iniziato) return;
    if (!cuore.sala.membri.some(function (m) { return m.id === id; })) return;
    n = Math.floor(+n) || 0; if (n < 0 || n > cuore.partiteCoppie(E, cuore.sala.membri.length)) return;
    E.gironi = E.gironi || {};
    if (n && E.gironi[id] !== n && chiNelGirone(E, n).length >= 2) return;   // girone pieno
    delete E.gironi[id];   // (così chi si risiede va in fondo al girone)
    if (n) E.gironi[id] = n;
    cuore.sala._bcast(); seguiHost();
  }
  // i gironi alla partenza: chi è in panchina va a caso nei posti liberi (prima accanto a chi è solo),
  // due rimasti soli si sfidano tra loro, e se ne resta uno solo gioca col bot. Al massimo 10: gli altri guardano.
  function gironiElim(E) {
    var dentro = {}; cuore.sala.membri.forEach(function (m) { dentro[m.id] = 1; });
    var G = [];
    for (var n = 1; n <= N_GIRONI; n++) { var g = chiNelGirone(E, n).filter(function (id) { return dentro[id]; }).slice(0, 2); g.n = n; G.push(g); }
    var panca = mischia(cuore.sala.membri.map(function (m) { return m.id; }).filter(function (id) { return !(E.gironi && E.gironi[id]); }));
    G.forEach(function (g) { if (g.length === 1 && panca.length) g.push(panca.shift()); });
    G.forEach(function (g) { while (g.length < 2 && panca.length) g.push(panca.shift()); });
    var soli = G.filter(function (g) { return g.length === 1; });
    for (var i = 0; i + 1 < soli.length; i += 2) soli[i].push(soli[i + 1].pop());
    return G.filter(function (g) { return g.length; });
  }
  function avviaElim() {
    var E = cuore.sala && cuore.sala.elim; if (!E || (E.iniziato && !E.finito) || cuore.sala.membri.length < 2) return;
    var G = gironiElim(E), nomi = {};
    cuore.sala.membri.forEach(function (m) { nomi[m.id] = m.nome; });
    E.nomi = {}; G.forEach(function (g) { g.forEach(function (id) { E.nomi[id] = nomi[id]; }); });
    E.turni = []; E.campione = null; E.iniziato = true; E.finito = false; E.contato = false; delete E.attesi; delete E.scade;
    clearTimeout(cuore.sala.tCoppie); cuore.sala.tCoppie = null;
    E.k = SGNet.nuovoCodice();   // (questo torneo: i punti alla Sala si danno una volta sola)
    cuore.sala.inPartitaK = null; cuore.sala.fuoriK = null; cuore.sala.guardaK = null;
    // il Bot del torneo: uno del gruppo fisso (della bravura scelta), a sorte, e resta lui per tutto il torneo (nome nel tabellone e in partita).
    // Con "⏭️ passa il turno" niente Bot: chi resta solo passa
    var conBot = E.resto !== "passa";
    var bt = conBot ? cuore.botPrendi(1, { livello: livelloElim(E), caso: true, escludi: cuore.sala.membri.map(function (m) { return m.nome; }) })[0] : null;
    E.bot = bt ? { id: bt.id, nome: bt.nome } : null;
    // primo turno: un girone = una partita (chi è rimasto solo gioca col Bot o passa); poi chi vince il girone 1 sfida chi vince il 2, ecc.
    var tu = G.map(function (g, j) {
      var p = { k: "0-" + j, girone: g.n, a: g[0], b: g[1] || (conBot ? "bot" : null), vince: null };
      if (p.b) p.stanza = SGNet.nuovoCodice(); else p.vince = p.a;
      return p;
    });
    E.turni.push(tu);
    if (tu.every(function (p) { return p.vince; })) return avanzaElim();   // (in due e uno solo seduto: niente da giocare)
    cuore.sala._bcast(); seguiHost();
  }
  function nuovoElim() {
    var E = cuore.sala && cuore.sala.elim; if (!E) return;
    E.iniziato = false; E.finito = false; E.turni = []; E.campione = null; cuore.sala.inPartitaK = null; cuore.sala.fuoriK = null; cuore.sala.guardaK = null;
    cuore.sala._bcast(); seguiHost();
  }
  function trovaPartitaElim(E, k) {
    for (var r = 0; r < E.turni.length; r++) for (var j = 0; j < E.turni[r].length; j++) if (E.turni[r][j].k === k) return E.turni[r][j];
    return null;
  }
  // com'è finita una partita: lo dice chi l'ha aperta (o chi giocava col bot), oppure l'host a mano
  function esitoPartita(k, vinto, daId) {
    var E = cuore.sala && cuore.sala.elim; if (!E || !E.iniziato || E.finito) return;
    var p = trovaPartitaElim(E, k); if (!p || p.vince) return;
    if (daId !== p.a && daId !== "host") return;
    p.vince = vinto ? p.a : p.b;
    avanzaElim();
  }
  function avanzaElim() {
    var E = cuore.sala.elim, tu = E.turni[E.turni.length - 1];
    // (un turno in cui passano tutti senza giocare non c'è: si va avanti finché resta una partita vera o il campione)
    while (tu && tu.every(function (p) { return p.vince; })) {
      var dentro = {}; cuore.sala.membri.forEach(function (m) { dentro[m.id] = 1; });
      // il Bot va avanti come tutti; chi è uscito dalla Sala no
      var avanti = tu.map(function (p) { return p.vince; }).filter(function (v) { return v === "bot" || dentro[v]; });
      if (avanti.length <= 1) { E.finito = true; E.campione = avanti[0] || null; break; }
      creaTurnoElim(E, avanti);
      tu = E.turni[E.turni.length - 1];
    }
    if (E.finito) puntiTorneino(E);
    cuore.sala._bcast(); seguiHost();
  }
  // la classifica del torneo per i punti della Sala: chi è uscito più tardi sta più in alto (il campione primo,
  // chi ha perso la finale secondo, chi ha perso le semifinali terzo a pari merito…). Il Bot ha la sua riga (bot: true)
  function classificaElim(E) {
    var fuoriA = {}, ids = Object.keys(E.nomi || {});
    if (E.bot && E.turni.some(function (tu) { return tu.some(function (p) { return p.b === "bot" || p.a === "bot"; }); })) ids.push("bot");
    E.turni.forEach(function (tu, r) { tu.forEach(function (p) { if (p.vince && p.b) { var perde = p.vince === p.a ? p.b : p.a; if (fuoriA[perde] == null) fuoriA[perde] = r; } }); });
    var giro = function (id) { return id === E.campione ? 999 : (fuoriA[id] != null ? fuoriA[id] : -1); };
    ids.sort(function (x, y) { return giro(y) - giro(x); });
    return ids.map(function (id) {
      var pos = 1 + ids.filter(function (o) { return giro(o) > giro(id); }).length;
      var r = { nome: id === "bot" ? ((E.bot && E.bot.nome) || "Bot") : E.nomi[id], pos: pos };
      if (id === "bot") r.bot = true;
      return r;
    });
  }
  // il torneino è finito: con "🏆 Contiamo i punti" acceso, i punti nella classifica della serata (una volta sola)
  function puntiTorneino(E) {
    if (!E || !E.torneino || E.contato || !cuore.sala) return;
    E.contato = true;
    var g = giocoDa(E.gioco); if (!g) return;
    cuore.salaRisultato(g, classificaElim(E), { stanza: "torneino-" + (E.k || ""), giro: 0 });
  }
  // chi esce dalla sala a torneo iniziato: se stava giocando, vince l'altro (contro il bot, vince il bot)
  function elimUscito(id) {
    var E = cuore.sala.elim; if (!E || !E.iniziato || E.finito) return;
    var tu = E.turni[E.turni.length - 1] || [], cambiato = false;
    tu.forEach(function (p) { if (!p.vince && (p.a === id || p.b === id)) { p.vince = (p.a === id) ? (p.b || "bot") : p.a; cambiato = true; } });
    if (cambiato) avanzaElim();
  }
  function miaPartitaElim(E, mioId) {
    if (!E || !E.iniziato || E.finito) return null;
    var tu = E.turni[E.turni.length - 1] || [];
    for (var j = 0; j < tu.length; j++) { var p = tu[j]; if (!p.vince && p.b && (p.a === mioId || p.b === mioId)) return p; }
    return null;
  }
  function eliminatoElim(E, id) {
    return E.turni.some(function (tu) { return tu.some(function (p) { return p.vince && p.vince !== id && (p.a === id || p.b === id); }); });
  }
  // su ogni telefono: se tocca a me si apre da sola la mia partita; quando è decisa, si torna al tabellone
  function seguiTabellone(S, mioId, mioNome, mostraSala, diEsito) {
    S._mostra = mostraSala; S._mioId = mioId;
    aggiornaTabelloneElim();   // il tabellone aperto sopra una partita si aggiorna da solo
    var p = miaPartitaElim(S.elim, mioId);
    if (S.tProssima) return;   // (sto ancora vedendo com'è finita la mia partita: la prossima si apre tra poco)
    if (p && S.inPartitaK && S.inPartitaK !== p.k && S.fuoriK !== S.inPartitaK) {
      // ho appena vinto e tocca già a me (l'avversario mi aspettava): prima si vede chi ha vinto e la stanza
      // manda a tutti la fine, poi si apre la partita dopo
      clearTimeout(S.tTorna); S.tTorna = null;
      S.tProssima = setTimeout(function () {
        S.tProssima = null; S.inPartitaK = null; S.fuoriK = null;
        if (S.elim) seguiTabellone(S, mioId, mioNome, mostraSala, diEsito);
      }, 2500);
      return;
    }
    if (p) {
      if (S.inPartitaK !== p.k) { clearTimeout(S.tTorna); S.tTorna = null; S.guardaK = null; S.inPartitaK = p.k; S.fuoriK = null; giocaPartitaElim(S, p, mioId, mioNome, mostraSala, diEsito); }
      else if (S.fuoriK === p.k) mostraSala();   // è uscito dalla sua partita: vede il tabellone, col tasto per rientrare
      return;
    }
    if (S.inPartitaK) {   // la mia partita è appena decisa: si vede chi ha vinto, poi si torna al tabellone
      var giaFuori = S.fuoriK === S.inPartitaK;   // (se ero già uscito dalla partita, si aggiorna subito)
      S.inPartitaK = null; S.fuoriK = null;
      if (giaFuori) return tornaTabelloneElim(S);
      S.tTorna = setTimeout(function () { S.tTorna = null; tornaTabelloneElim(S, 2500); }, 2500);
      return;
    }
    if (S.guardaK) {   // sto guardando una partita: resto lì finché non è decisa, poi si torna al tabellone
      var w = S.elim && S.elim.iniziato ? trovaPartitaElim(S.elim, S.guardaK) : null;
      if (w && !w.vince && w.stanza === S.guardaStanza) return;
      S.guardaK = null;
      S.tTorna = setTimeout(function () { S.tTorna = null; tornaTabelloneElim(S); }, 2500);
      return;
    }
    if (S.tTorna) return;
    tornaTabelloneElim(S);
  }
  // si torna al tabellone: la partita lasciata non può più disegnare. ritardo: chi aveva aperto la stanza
  // la chiude un po' dopo, così l'avversario e chi guardava tornano al tabellone prima (niente "collegamento perso")
  function tornaTabelloneElim(S, ritardo) {
    lasciaPartita(); chiudiTabelloneElim(); SGNet.chiudiGiochi(ritardo || 0);
    if (window.SGMusica && SGMusica.ferma) SGMusica.ferma();   // la musica della Scopa
    if (S._mostra) S._mostra();
  }
  // il torneo (o il torneino) non c'è più: niente partita del torneo, niente tabellone, niente ritorni in sospeso
  function lasciaTorneo(S) {
    clearTimeout(S.tTorna); S.tTorna = null; clearTimeout(S.tProssima); S.tProssima = null;
    var P = cuore.partitaCorrente;
    if (P && P.viva() && P.salaCtx && P.salaCtx.tabellone) {
      lasciaPartita(); SGNet.chiudiGiochi();
      if (window.SGMusica && SGMusica.ferma) SGMusica.ferma();
      pillola("sala", "👥 Si torna nella Sala", "verde", 2500);
    }
    chiudiTabelloneElim();
    S.inPartitaK = null; S.guardaK = null; S.fuoriK = null; S._boxE = null;
  }
  // il torneino finisce (o l'host lo ferma): tutti di nuovo nella Sala della serata, con gli stessi amici
  function fineTorneino() {
    if (!cuore.sala || !cuore.sala.elim) return;
    lasciaTorneo(cuore.sala);
    cuore.sala.elim = null; cuore.sala.regoleElim = null; cuore.sala._regoleBox = null;
    cuore.sala.gioco = null; cuore.sala.stanza = null; cuore.sala.inGioco = false; cuore.sala.fase = null; cuore.sala.fuori = {}; cuore.sala.ctx = null; cuore.sala.duello = null; cuore.sala.sceglie = false;
    cuore.sala._bcast();
    SGNet.chiudiGiochi(1500);   // (le stanze delle partite: prima gli amici tornano nella Sala, poi si chiudono)
    cuore.disegnaSalaHost();
  }
  // il torneino nato da una stanza: si parte appena sono arrivati tutti quelli che c'erano (true = partito)
  function torneinoArrivati() {
    var E = cuore.sala && cuore.sala.elim;
    if (!E || !E.torneino || E.iniziato || !E.attesi) return false;
    var dentro = {}; cuore.sala.membri.forEach(function (m) { dentro[m.id] = 1; });
    if (!E.attesi.every(function (id) { return dentro[id]; })) return false;
    cuore.partiTorneino(E);
    return !!E.iniziato;
  }
  function seguiHost() { if (cuore.sala && cuore.sala.elim) seguiTabellone(cuore.sala, "host", cuore.sala.membri[0].nome, cuore.disegnaSalaHost, function (k, v) { esitoPartita(k, v, "host"); }); }
  function seguiOspite() { if (cuore.salaG && cuore.salaG.elim) seguiTabellone(cuore.salaG, cuore.salaG.myId, cuore.salaG.nome, cuore.disegnaSalaOspite, function (k, v) { if (cuore.salaG && cuore.salaG.rete) cuore.salaG.rete.invia({ t: "esito", k: k, vinto: v }); }); }
  // ⚙️ Regole del torneo: le impostazioni del gioco (es. i punti da raggiungere nella Scopa), uguali per tutte le partite.
  // Il riquadro resta sul telefono dell'host; i valori (E.imp) viaggiano con la sala.
  // In cima le regole del torneo (chi resta in più: Bot o passa il turno; la bravura del Bot): si vedono prima di partire
  // e a torneo finito (per il prossimo). Il torneino della Sala porta le regole del gioco già scelte (sala._regoleBox, E.imp)
  var SCARICA_ELIM = null;   // (📦 il torneo il cui gioco sta arrivando)
  function regoleElim() {
    var E = cuore.sala && cuore.sala.elim, g = E && giocoDa(E.gioco);
    if (!g) return null;
    // 📦 le regole le disegna il gioco: se non è ancora arrivato si scarica e la Sala si ridisegna (intanto senza riquadro)
    if (!cuore.giocoPronto(g)) {
      // (uno scaricamento solo per volta; il segno sta qui fuori, MAI in E: E va nella foto della Sala)
      if (SCARICA_ELIM !== E) {
        SCARICA_ELIM = E;
        var giu = function () { if (SCARICA_ELIM === E) SCARICA_ELIM = null; if (cuore.sala && cuore.sala.elim === E && !cuore.sala.inGioco && document.querySelector(".saletta-schermo")) cuore.disegnaSalaHost(); };
        cuore.scaricaGioco(g).then(giu, function () { setTimeout(giu, 8000); });   // (senza rete si riprova dopo 8 s, al prossimo disegno)
      }
      return null;
    }
    if (!cuore.sala.regoleElim || cuore.sala.regoleElim.E !== E) {
      var gbox = cuore.sala._regoleBox || null, imp = E.imp || {};
      cuore.sala._regoleBox = null;
      if (!gbox && g.impostazioni) {
        if (!E.torneino) imp = {};   // (il torneino riaperto dopo una ricarica tiene le regole che aveva)
        gbox = el("div", { class: "sg-dal-gioco" });   // (🤍 roba del gioco: le sue emoji restano emoji)
        g.impostazioni(gbox, imp, { el: el, sala: true, modo: "online", giocatori: cuore.sala.membri.map(function (m) { return m.nome; }) });
      }
      delete imp.scelti; imp.modo = "online"; E.imp = imp;
      var opz = opzioniTorneino(E, function () {
        if (!cuore.sala || cuore.sala.elim !== E) return;
        if (cuore.SL.ultimo) cuore.SL.ultimo.regR = null;   // (la riga "📜 Si gioca così" si rilegge)
        if (E.torneino) cuore.sala.optTorneino = { resto: E.resto, livello: E.livello, coppie: E.coppie };   // (la prossima volta si parte da qui)
        cuore.sala._bcast(); cuore.disegnaSalaHost();
      }, true);
      cuore.sala.regoleElim = { box: el("div", {}, [opz, gbox]), imp: imp, E: E, opz: opz };
    }
    var R = cuore.sala.regoleElim;
    R.opz.hidden = !!(E.iniziato && !E.finito);   // (a torneo in corso non cambiano: valgono dall'inizio alla fine)
    return cuore.haRegole(R.box) ? R : null;
  }
  // le scelte del torneo: "Chi resta in più" (🤖 Gioca col Bot / ⏭️ Passa il turno) e la bravura del Bot.
  // T = { resto, livello } (si cambia lì dentro); poi() dopo ogni tocco. Tasti come quelli delle regole dei giochi
  function opzioniTorneino(T, poi, sempre, dispari) {
    var box = el("div", { class: "tn-opz" });
    if (T.resto !== "passa") T.resto = "bot";
    if (T.coppie !== "scelte") T.coppie = "caso";
    T.livello = livelloElim(T);
    function riga(titolo, chiave, voci) {
      var et = el("div", { class: "etichetta", text: titolo });
      var g = el("div", { class: "modo-griglia tn-chips", style: "grid-template-columns:repeat(" + voci.length + ",minmax(0,1fr))" });
      voci.forEach(function (v) {
        var b = el("button", { class: "modo-chip" + (T[chiave] === v[0] ? " attiva" : ""), type: "button", "aria-pressed": T[chiave] === v[0] ? "true" : "false",
          onclick: function () {
            if (T[chiave] === v[0]) return;
            T[chiave] = v[0];
            [].forEach.call(g.children, function (c) { c.classList.toggle("attiva", c === b); c.setAttribute("aria-pressed", c === b ? "true" : "false"); });
            if (!liv._sempreNascosto) liv.hidden = T.resto === "passa";
            if (poi) poi();
          } }, [ el("span", { class: "mi", text: v[1] }), el("div", { class: "mt", text: v[2] }) ]);
        g.appendChild(b);
      });
      return el("div", {}, [et, g]);
    }
    box.appendChild(riga("Le coppie", "coppie", [["caso", "🎲", "A caso"], ["scelte", "✋", "Scegliete voi"]]));
    var resto = riga(sempre ? "Se siete dispari, chi resta in più" : "Chi resta in più", "resto", [["bot", "🤖", "Gioca col Bot"], ["passa", "⏭️", "Passa il turno"]]);
    var liv = riga("Bravura del Bot", "livello", [["facile", "🙂", "Facile"], ["medio", "😐", "Medio"], ["difficile", "😠", "Difficile"]]);
    liv.hidden = T.resto === "passa";
    if (!sempre && !dispari) { resto.hidden = true; liv.hidden = true; liv._sempreNascosto = true; }
    box.appendChild(resto); box.appendChild(liv);
    return box;
  }
  function giocaPartitaElim(S, p, mioId, mioNome, mostraSala, diEsito) {
    var g = giocoDa(S.elim.gioco); if (!g) return mostraSala();
    chiudiTabelloneElim(); SGNet.chiudiGiochi();
    function fuori() { S.fuoriK = p.k; tornaTabelloneElim(S); }
    var ctx = {
      esci: fuori, fine: fuori,
      tabellone: function (s) { tastoTabellone(s, S); },
      // la partita dice chi ha vinto: lo riferisce solo chi l'ha aperta (o chi gioca col bot). Pari = si rigioca
      risultato: function (g2, cl) {
        if (p.a !== mioId) return;
        var primi = (cl || []).filter(function (r) { return (r.pos || 1) === 1; });
        if (primi.length === 1) diEsito(p.k, primi[0].nome === mioNome);
      }
    };
    // (il link vale per una partita sola: avviaPartita lo prende e lo azzera)
    if (p.b === "bot") {
      // la partita col bot la possono guardare anche gli altri: questo telefono la trasmette nella stanza della partita
      var rete = null, ultimo = null;
      ctx.trasmetti = function (msg) {
        ultimo = msg;
        if (!rete && p.stanza) { SGNet._forza = p.stanza; rete = SGNet.ospita(g.id, { onConnesso: function () { if (rete && ultimo) rete.invia(ultimo); } }); }
        if (rete) rete.invia(msg);
      };
      cuore.linkParams = {}; avviaPartita(g, [mioNome], Object.assign({}, S.elim.imp || {}, { modo: "bot", difficolta: livelloElim(S.elim), bot: botDelTorneo(S.elim) }), null, ctx);
    }
    else if (p.a === mioId) { cuore.linkParams = {}; SGNet._forza = p.stanza; avviaPartita(g, [mioNome], Object.assign({}, S.elim.imp || {}, { modo: "online" }), null, ctx); }
    else { cuore.linkParams = { gioco: g.id, stanza: p.stanza }; avviaPartita(g, [], {}, null, ctx); }
  }
  // chi non sta giocando guarda in diretta la partita di altri (anche quella col bot), senza poter toccare
  function guardaPartitaElim(S, p) {
    var g = giocoDa(S.elim && S.elim.gioco); if (!g || !p.stanza) return;
    chiudiTabelloneElim(); SGNet.chiudiGiochi();
    clearTimeout(S.tTorna); S.tTorna = null;
    S.guardaK = p.k; S.guardaStanza = p.stanza;
    var attivo = true;
    function via() { if (!attivo) return; attivo = false; if (S.guardaK === p.k) S.guardaK = null; clearTimeout(S.tTorna); S.tTorna = null; tornaTabelloneElim(S); }
    var ctx = { esci: via, fine: via, risultato: function () {}, tabellone: function (s) { tastoTabellone(s, S); } };
    cuore.linkParams = { gioco: g.id, stanza: p.stanza, guarda: 1 };
    avviaPartita(g, [], {}, null, ctx);
  }
  // il tabellone sopra la partita (tasto 🏆 in alto): si aggiorna da solo finché resta aperto
  var FT = null;
  function tastoTabellone(s, S) {
    if (!s || s.querySelector(".tab-elim")) return;
    var b = el("button", { class: "tab-elim", "aria-label": "Tabellone del torneo", text: "⚔️", onclick: function () { apriTabelloneElim(S); } });
    var testa = s.querySelector(".testa");
    if (testa && !s.classList.contains("senza-testa")) { b.classList.add("in-testa"); b.textContent = "🏆 Tabellone"; testa.appendChild(b); }
    else s.appendChild(b);   // nei giochi (senza titolo): piccolo, nell'angolo in alto a destra
  }
  function apriTabelloneElim(S) {
    if (FT || !S.elim) return;
    var corpo = el("div", { class: "sl-foglio-corpo" });
    var velo = el("div", { class: "sl-velo", onclick: function (e) { if (e.target === velo) chiudiTabelloneElim(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "🏆 Tabellone" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudiTabelloneElim }) ]),
        corpo,
        el("button", { class: "btn btn-primario", text: "Torna alla partita", onclick: chiudiTabelloneElim })
      ])
    ]);
    FT = { S: S, corpo: corpo, velo: velo };
    aggiornaTabelloneElim();
    if (FT) document.body.appendChild(velo);
  }
  function chiudiTabelloneElim() { if (!FT) return; if (FT.velo.parentNode) FT.velo.parentNode.removeChild(FT.velo); FT = null; }
  function aggiornaTabelloneElim() {
    if (!FT) return;
    var S = FT.S; if (!S.elim || !S.elim.iniziato) return chiudiTabelloneElim();
    svuota(FT.corpo);
    FT.corpo.appendChild(boxElim(S.elim, S._mioId, S === cuore.sala, S, S === cuore.sala ? seguiHost : seguiOspite));
  }
  function nomeTurnoElim(nGioc) { return nGioc <= 2 ? "Finale" : (nGioc <= 4 ? "Semifinali" : (nGioc <= 8 ? "Quarti di finale" : "Primo turno")); }
  function giocatoriTurno(tu) { var n = 0; tu.forEach(function (p) { n += p.b ? 2 : 1; }); return n; }
  // il tabellone nella saletta: lo stesso nodo finché non cambia niente (niente lampeggio)
  function boxElimSala(E, mioId, host, S, segui) {
    var k = "";
    try { k = JSON.stringify([E, mioId, host, S.guardaK || null, S.fuoriK || null, (S.membri || []).map(function (m) { return m.id + ":" + m.nome; })]); } catch (e) {}
    if (k && S._boxE && S._boxE.k === k) return S._boxE.nodo;
    var nodo = boxElim(E, mioId, host, S, segui);
    S._boxE = { k: k, nodo: nodo };
    return nodo;
  }
  // il tabellone (nella saletta e nel foglio 🏆 sopra la partita), in uno schermo anche in 10: in cima il mio stato
  // ("▶️ Tocca a te contro Sara", "🏆 Ha vinto Matt! 🤖"), poi il turno di adesso a carte su due colonne (chi gioca con chi,
  // ✅ chi ha vinto, chi passa il turno, "👀 Guarda" sulle partite degli altri), sotto i turni di prima in una riga ciascuno
  function boxElim(E, mioId, host, S, segui) {
    var box = el("div", { class: "sl-torneo sl-tab" });
    var gE = giocoDa(E.gioco), nomeG = gE ? gE.nome : "";
    if (!E.iniziato && E.torneino && !E.scade) {   // il torneino nato da una stanza: si aspetta che arrivino tutti (pochi secondi)
      var qui = ((S && S.membri) || []).length, tot = Math.max(qui, (E.attesi ? E.attesi.length : 0) + 1);
      box.appendChild(el("div", { class: "sl-elim-stato", text: "⚔️ Torneo " + cuore.aGioco(nomeG) }));
      box.appendChild(el("p", { class: "modulo-nota tb-nota", text: (E.attesi ? "Arrivano gli amici: " + qui + " su " + tot + "… " : "") + "Si comincia appena ci siete tutti: " + (E.coppie === "scelte" ? "poi ognuno sceglie dove sedersi." : "coppie a sorte, tutte le partite insieme.") }));
      return box;
    }
    if (!E.iniziato && E.torneino) return boxCoppie(E, mioId, host, S, box);
    if (!E.iniziato) {   // prima di partire: ognuno sceglie il suo girone (all'inizio sono tutti in panchina)
      var membri = (S && S.membri) || [], gir = E.gironi || {};
      function chiamo(m) { return m.id === mioId ? "Tu" : m.nome; }
      function siedi(n) { if (host) scegliGironeElim(mioId, n); else if (S && S.rete) S.rete.invia({ t: "girone", g: n }); }
      box.appendChild(el("div", { class: "etichetta", text: "🏆 Scegli il tuo girone" }));
      var griglia = el("div", { class: "sl-gironi" });
      for (var gN = 1; gN <= N_GIRONI; gN++) (function (n) {
        var chi = membri.filter(function (m) { return gir[m.id] === n; }), mio = gir[mioId] === n;
        var b = el("button", { class: "sl-girone" + (mio ? " mio" : ""), onclick: function () { siedi(mio ? 0 : n); } }, [
          el("b", { text: "Girone " + n }),
          el("span", { class: chi[0] ? "" : "libero", text: chi[0] ? chiamo(chi[0]) : "posto libero" }),
          el("span", { class: chi[1] ? "" : "libero", text: chi[1] ? chiamo(chi[1]) : "posto libero" }) ]);
        if (chi.length >= 2 && !mio) { b.disabled = true; b.classList.add("pieno"); }
        griglia.appendChild(b);
      })(gN);
      var panca = membri.filter(function (m) { return !gir[m.id]; });
      griglia.appendChild(el("button", { class: "sl-girone panca" + (!gir[mioId] ? " mio" : ""), onclick: function () { siedi(0); } }, [
        el("b", { text: "🪑 Panchina" }), el("span", { class: panca.length ? "" : "libero", text: panca.length ? panca.map(chiamo).join(", ") : "nessuno" }) ]));
      box.appendChild(griglia);
      box.appendChild(el("p", { class: "modulo-nota", text: "Tocca un girone per sederti: chi vince il girone 1 sfida chi vince il 2, e così via fino alla finale. Chi resta in panchina viene messo a caso nei posti liberi; se uno resta solo, " +
        (E.resto === "passa" ? "passa il turno." : "gioca contro il Bot (" + livelloElim(E) + ").") }));
      if (membri.length > MAX_ELIM) box.appendChild(el("p", { class: "modulo-nota", text: "Siete in " + membri.length + ": i posti sono " + MAX_ELIM + ", chi resta in panchina guarda le partite 👀" }));
      return box;
    }
    var mia = miaPartitaElim(E, mioId), stato, ult = E.turni.length - 1;
    if (E.finito) stato = !E.campione ? "Torneo finito" : (E.campione === mioId ? "🏆 Hai vinto tu! Sei il campione"
      : (E.campione === "bot" ? "🏆 Ha vinto " + ((E.bot && E.bot.nome) || "il Bot") + "! 🤖" : "🏆 Ha vinto " + nomeElim(E, E.campione) + "!"));
    else if (mia) stato = "▶️ Tocca a te contro " + nomeElim(E, mia.a === mioId ? mia.b : mia.a);
    else if (!(E.nomi && E.nomi[mioId])) stato = "👀 Guardi il torneo: tocca «Guarda» su una partita";
    else if (eliminatoElim(E, mioId)) stato = "Sei fuori: puoi guardare le partite 👀";
    else stato = "✅ Passi al turno dopo: intanto guarda gli altri ⏳";
    box.appendChild(el("div", { class: "sl-elim-stato" + (E.finito && E.campione ? " campione" : ""), text: stato }));
    if (mia && S.fuoriK === mia.k) box.appendChild(el("button", { class: "btn btn-primario tb-rientra", text: "🔁 Rientra nella tua partita", onclick: function () { S.inPartitaK = null; S.fuoriK = null; segui(); } }));
    if (ult >= 0) {
      var tu = E.turni[ult];
      box.appendChild(el("div", { class: "etichetta tb-et", text: nomeTurnoElim(giocatoriTurno(tu)) + (E.finito ? "" : " · si gioca ora") }));
      var gr = el("div", { class: "tb-griglia" + (tu.length === 1 ? " una" : "") });
      tu.forEach(function (p) { gr.appendChild(cartaElim(E, p, mioId, host, S, mia)); });
      box.appendChild(gr);
    }
    // i turni di prima: chi è andato avanti
    for (var r = ult - 1; r >= 0; r--) {
      var vinti = E.turni[r].map(function (p) { return nomeElim(E, p.vince); });
      box.appendChild(el("div", { class: "tb-prima" }, [ el("b", { text: nomeTurnoElim(giocatoriTurno(E.turni[r])) }), el("span", { text: "✅ " + vinti.join(" · ") }) ]));
    }
    // a torneino finito l'host lo può rifare subito (stessi amici, coppie nuove); il tasto in fondo riporta tutti nella Sala
    if (host && E.finito && E.torneino) box.appendChild(el("button", { class: "btn btn-fantasma tb-rifai", type: "button", text: "↻ Rifacciamo il torneo",
      onclick: function () { if (cuore.sala && cuore.sala.elim === E) { if (E.coppie === "scelte") cuore.partiTorneino(E); else avviaElim(); } } }));
    return box;
  }
  // "✋ Scegliete voi": le partite del primo turno coi posti vuoti ("Partita 1: [posto libero] contro [posto libero]");
  // un tocco su un posto libero e ti siedi lì (si vede in diretta chi si siede dove), un tocco sul tuo posto e ti alzi.
  // L'host vede "Seduti 5 su 6" e parte quando vuole (tasto della saletta); il conto alla rovescia fa partire da soli
  function boxCoppie(E, mioId, host, S, box) {
    var membri = ((S && S.membri) || []).slice(0, Math.max(MAX_ELIM, 0)), gir = E.gironi || {};
    var nP = cuore.partiteCoppie(E, ((S && S.membri) || []).length);
    function chiamo(m) { return m.id === mioId ? "Tu" : m.nome; }
    function siedi(n) { if (host) scegliGironeElim(mioId, n); else if (S && S.rete) S.rete.invia({ t: "girone", g: n }); }
    var seduti = membri.filter(function (m) { return gir[m.id] >= 1 && gir[m.id] <= nP; }).length, tot = ((S && S.membri) || []).length;
    box.appendChild(el("div", { class: "sl-elim-stato", text: gir[mioId] ? "✅ Sei seduto nella Partita " + gir[mioId] : "✋ Scegli dove sederti" }));
    box.appendChild(el("div", { class: "tb-coppie-riga" }, [
      el("b", { class: "tb-seduti", text: "Seduti " + seduti + " su " + tot }),
      E.scade ? el("span", { class: "tb-conto", "data-scade": String(E.scade), text: "⏱️ Si parte da soli tra " + Math.max(0, Math.ceil((E.scade - Date.now()) / 1000)) + " s" }) : null ]));
    var gr = el("div", { class: "tb-griglia una tb-coppie" });
    for (var n = 1; n <= nP; n++) (function (n) {
      var chi = membri.filter(function (m) { return gir[m.id] === n; }), mio = gir[mioId] === n;
      var c = el("div", { class: "tb-p tb-posti" + (mio ? " mia" : "") }, [ el("span", { class: "tb-stato tb-pn", text: "Partita " + n }) ]);
      [0, 1].forEach(function (i) {
        var m = chi[i], mioPosto = m && m.id === mioId;
        if (i === 1) c.appendChild(el("span", { class: "tb-contro", text: "contro" }));
        c.appendChild(el("button", { class: "tb-posto" + (m ? " preso" : "") + (mioPosto ? " mio" : ""), type: "button", disabled: m && !mioPosto ? "disabled" : null,
          text: m ? chiamo(m) : "＋ libero", "aria-label": m ? null : "Posto libero nella Partita " + n, onclick: function () { siedi(mioPosto ? 0 : n); } }));
      });
      gr.appendChild(c);
    })(n);
    box.appendChild(gr);
    var piedi = membri.filter(function (m) { return !(gir[m.id] >= 1 && gir[m.id] <= nP); });
    if (piedi.length) box.appendChild(el("p", { class: "modulo-nota tb-nota", text: "In piedi: " + piedi.map(chiamo).join(", ") + (host ? ". Se parti ora vanno a caso nei posti liberi." : ".") }));
    if (tot % 2 && tot <= MAX_ELIM) box.appendChild(el("p", { class: "modulo-nota tb-nota", text: E.resto === "passa" ? "Chi resta da solo passa il turno." : "Chi resta da solo gioca col Bot." }));
    if (E.scade) cuore.contoCoppie();
    return box;
  }
  // una partita del turno: i due nomi (✅ chi ha vinto, barrato chi ha perso) e sotto com'è messa:
  // "👀 Guarda" per chi non gioca, "⏳ in corso", "⏭️ passa il turno". L'host ha "⋯" per decidere una partita bloccata
  function cartaElim(E, p, mioId, host, S, mia) {
    var mio = p.a === mioId || p.b === mioId;
    var c = el("div", { class: "tb-p" + (mio ? " mia" : "") + (p.vince ? " decisa" : ""), "data-k": p.k });
    function nome(id) { return el("span", { class: "tb-n" + (p.vince === id ? " vince" : (p.vince ? " perde" : "")), text: nomeElim(E, id) }); }
    if (!p.b) { c.appendChild(el("span", { class: "tb-n", text: nomeElim(E, p.a) })); c.appendChild(el("span", { class: "tb-stato", text: "⏭️ passa il turno" })); return c; }
    c.appendChild(nome(p.a)); c.appendChild(nome(p.b));
    if (!p.vince) {
      if (S && S.guardaK === p.k) c.appendChild(el("span", { class: "tb-stato", text: "👀 la stai guardando" }));
      else if (!mia && !E.finito && p.stanza && !mio) c.appendChild(el("button", { class: "tb-guarda", type: "button", "aria-label": "Guarda " + nomeElim(E, p.a) + "–" + nomeElim(E, p.b), text: "👀 Guarda",
        onclick: function () { guardaPartitaElim(S, p); } }));
      else c.appendChild(el("span", { class: "tb-stato", text: mio ? "▶️ tocca a te" : "⏳ in corso" }));
      if (host && !E.finito) c.appendChild(el("button", { class: "tb-decidi", type: "button", "aria-label": "Partita bloccata? Decidi chi passa", text: "⋯", onclick: function () { decidiElim(E, p); } }));
    }
    return c;
  }
  // l'host decide una partita bloccata: chi passa al turno dopo
  function decidiElim(E, p) {
    if (document.querySelector(".tb-velo")) return;
    var velo;
    function chiudi() { if (velo.parentNode) velo.parentNode.removeChild(velo); }
    function passa(vA) { chiudi(); if (cuore.sala && cuore.sala.elim === E && !p.vince) esitoPartita(p.k, vA, "host"); }
    velo = el("div", { class: "sl-velo tb-velo", onclick: function (e) { if (e.target === velo) chiudi(); } }, [
      el("div", { class: "sl-foglio" }, [
        el("div", { class: "sl-foglio-testa" }, [ el("b", { text: "⚖️ Partita bloccata?" }), el("button", { class: "sl-foglio-x", "aria-label": "Chiudi", text: "✕", onclick: chiudi }) ]),
        el("div", { class: "sl-foglio-corpo" }, [
          el("p", { class: "modulo-nota", text: nomeElim(E, p.a) + " contro " + nomeElim(E, p.b) + ": se la partita non va avanti, scegli tu chi passa al turno dopo." }),
          el("div", { class: "tb-decidi-tasti" }, [
            el("button", { class: "btn btn-primario", type: "button", text: "✅ Passa " + nomeElim(E, p.a), onclick: function () { passa(true); } }),
            el("button", { class: "btn btn-primario", type: "button", text: "✅ Passa " + nomeElim(E, p.b), onclick: function () { passa(false); } }) ]) ]),
        el("button", { class: "btn btn-fantasma", type: "button", text: "Lasciali giocare", onclick: chiudi })
      ])
    ]);
    document.body.appendChild(velo);
  }
  // =========================================================
  //  TORNEO — più partite di fila con gli stessi giocatori.
  //  Ogni gioco dichiara una "difficolta" (1 facile, 2 media,
  //  3 difficile): più è difficile, più vale vincerlo. A ogni
  //  partita si assegnano punti dal 1° al 10° posto.
  // =========================================================
  var torneo = null; // { giocatori:[nomi], emoji:{}, punti:{nome:n}, storia:[], n }
  var CURVA_TORNEO = [100, 78, 62, 50, 40, 32, 25, 19, 14, 10]; // % del 1° posto, per posizione 1..10

  function pesoGioco(g) { var d = g && g.difficolta; return (d === 1 || d === 3) ? d : 2; }
  function nomeDifficolta(d) { return d === 3 ? "Difficile" : d === 1 ? "Facile" : "Media"; }
  // dentro la tessera, nella scelta del gioco del torneo: quanto vale ("🏅 Difficile · 300 al 1°")
  function rigaPuntiTorneo(g) { var d = pesoGioco(g); return el("div", { class: "tess-punti", text: "🏅 " + nomeDifficolta(d) + " · " + cifre(CURVA_TORNEO[0] * d) + " al 1°" }); }

  function puntiDaClassifica(g, classifica) {
    var peso = pesoGioco(g);
    return classifica.map(function (r, i) {
      var k = (r.pos ? r.pos : i + 1) - 1;   // pos = il posto (a pari merito lo stesso posto, gli stessi punti)
      var perc = k < CURVA_TORNEO.length ? CURVA_TORNEO[k] : 6;
      return { nome: r.nome, punti: Math.round(perc * peso), pos: k + 1 };
    });
  }

  // sullo stesso telefono, senza aprire la "Serata a punti": ogni partita con almeno due persone del gruppo somma i punti
  // da sola nella Classifica della serata (torneo.auto). Se il gruppo cambia, la classifica riparte con il gruppo nuovo.
  function serataLocale(g, classifica) {
    if (!classifica || !g) return;
    var nomi = nomiGruppo(), umani = classifica.filter(function (r) { return r && !r.bot && r.nome; });
    if (umani.length < 2 || nomi.length < 2) return;
    if (!umani.every(function (r) { return nomi.some(function (n) { return stessoNome(n, r.nome); }); })) return;   // (non è il gruppo di stasera)
    var stesso = torneo && torneo.giocatori.length === nomi.length && nomi.every(function (n) { return torneo.giocatori.indexOf(n) >= 0; });
    if (!stesso) {
      torneo = { giocatori: nomi, emoji: {}, punti: {}, storia: [], n: 0, auto: true };
      gruppo.forEach(function (p, i) { if (nomi[i]) torneo.emoji[nomi[i]] = p.emoji || "🙂"; });
      nomi.forEach(function (n) { torneo.punti[n] = 0; });
    }
    var ass = puntiDaClassifica(g, classifica).filter(function (r) { return torneo.giocatori.indexOf(r.nome) >= 0; });
    ass.forEach(function (r) { torneo.punti[r.nome] = (torneo.punti[r.nome] || 0) + r.punti; });
    torneo.n += 1; torneo.storia.push({ gioco: g.nome, assegnati: ass });
    torneo._fine = classifica;
  }

  function classificaTorneo() {
    return torneo.giocatori.map(function (n) { return { nome: n, punti: torneo.punti[n] || 0 }; })
      .sort(function (a, b) { return b.punti - a.punti; });
  }

  function podio(cl, evidenziaPrimo) {
    var ol = el("ol", { class: "classifica" + (classificaFitta(cl.length) ? " fitta" : "") });
    // a pari punti lo stesso posto e la stessa medaglia (prima della prima partita sono tutti a 0: i posti in fila)
    var posti = [], medaglie;
    cl.forEach(function (r, i) { posti.push(evidenziaPrimo && i && r.punti === cl[i - 1].punti ? posti[i - 1] : i + 1); });
    medaglie = medaglieAPari(posti);
    cl.forEach(function (r, i) {
      ol.appendChild(el("li", { class: (posti[i] === 1 && evidenziaPrimo) ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] }),
        el("span", { class: "nome", text: (torneo && torneo.emoji[r.nome] ? torneo.emoji[r.nome] + " " : "") + r.nome }),
        el("span", { class: "punti", text: cifre(r.punti) })
      ]));
    });
    return ol;
  }

  function apriTorneo() {
    if (cuore.sala && cuore.sala.torneo) return cuore.disegnaSalaHost();   // torneo online in corso
    if (torneo) return schermataTorneoHub();
    if (!profiloAttivo()) return cuore.schermataAccesso(apriTorneo);
    schermataTorneoModo();
  }
  // prima cosa: come giocate il torneo? Online = UN link solo per tutti i giochi
  function schermataTorneoModo() {
    var s = schermata({ icona: "🏆", titolo: "Serata a punti", sotto: "Come giocate?", indietro: schermataHome });
    var griglia = el("div", { class: "modo-scelta" });
    [{ icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono: prima aggiungi chi gioca", via: function () { schermataSala(null, { torneo: true }); } },
     { icona: "🔗", nome: "Online", sotto: "La Sala con la Classifica della serata: ognuno dal suo telefono", online: true, via: function () { cuore.creaSala({ torneo: true }); } }
    ].forEach(function (m) {
      griglia.appendChild(el("button", { class: "modo-grande" + (m.online ? " online" : ""), onclick: m.via }, [
        el("div", { class: "mg-ico", text: m.icona }),
        el("div", { class: "mg-testo" }, [ el("div", { class: "mg-tit", text: m.nome }), el("div", { class: "mg-sotto", text: m.sotto }) ]),
        el("div", { class: "mg-freccia", text: "›" })
      ]));
    });
    s._contenuto.appendChild(griglia);
    s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Più giochi di fila, i punti si sommano: più il gioco è difficile, più punti vale." }));
    mostra(s);
  }

  function iniziaTorneo() {
    var nomi = nomiGruppo();
    torneo = { giocatori: nomi, emoji: {}, punti: {}, storia: [], n: 0 };
    gruppo.forEach(function (p, i) { torneo.emoji[nomi[i]] = p.emoji || "🙂"; });
    nomi.forEach(function (n) { torneo.punti[n] = 0; });
    schermataTorneoHub();
  }

  function schermataTorneoHub() {
    var s = schermata({ icona: "🏆", titolo: "Classifica della serata", indietro: schermataHome,
      sotto: torneo.n === 0 ? "Nessuna partita ancora" : (torneo.n + (torneo.n === 1 ? " partita giocata" : " partite giocate")) });
    s._contenuto.appendChild(podio(classificaTorneo(), torneo.n > 0));
    s._piede.appendChild(el("button", { class: "btn btn-primario",
      text: torneo.n === 0 ? "▶ Gioca la prima partita" : "▶ Gioca un'altra partita", onclick: torneoScegliGioco }));
    var azioni = el("div", { class: "home-azioni" });
    if (torneo.n > 0) azioni.appendChild(el("button", { class: "azione", text: "🏁 Chiudi e premia", onclick: schermataTorneoFine }));
    azioni.appendChild(el("button", { class: "azione", text: "🏠 Home", onclick: schermataHome }));
    s._piede.appendChild(azioni);
    mostra(s);
  }

  function torneoScegliGioco() {
    var s = schermata({ icona: "🎮", titolo: "Quale gioco?", sotto: "Più è difficile, più punti vale",
      indietro: schermataTorneoHub });
    s.classList.add("scelta-giochi");   // (📱 le tessere come in home: due per riga, senza descrizione)
    var griglia = el("div", { class: "griglia-giochi compatta tess-due" }), n = torneo.giocatori.length, tolti = 0;
    // sullo stesso telefono: niente giochi solo online, e solo i giochi dove giocate TUTTI (in 3 niente giochi a due:
    // giocherebbero solo i primi due della lista e gli altri resterebbero senza punti)
    giochi.forEach(function (g) {
      if (g.soloOnline) return;
      if ((g.giocatoriMax || 10) < n || (g.giocatoriMin || 1) > n) { tolti++; return; }
      // (i giochi a due, postiOnline: 2: nel torneo si fa una partita sola, es. il Tris "chi vince resta" vale solo fuori dal torneo)
      if (g.postiOnline && g.postiOnline < n) { tolti++; return; }
      var tess = tesseraGioco(g, function () { schermataPreGioco(g, { torneo: true }); }, true);
      tess.querySelector(".info").appendChild(rigaPuntiTorneo(g));
      griglia.appendChild(tess);
    });
    if (tolti) s._contenuto.appendChild(el("p", { class: "modulo-nota", text: "Qui trovi i giochi dove giocate tutti e " + n + " insieme." }));
    s._contenuto.appendChild(griglia);
    mostra(s);
  }

  function torneoRisultato(g, classifica) {
    var assegnati = puntiDaClassifica(g, classifica);
    assegnati.forEach(function (r) { torneo.punti[r.nome] = (torneo.punti[r.nome] || 0) + r.punti; });
    torneo.n += 1;
    torneo.storia.push({ gioco: g.nome, assegnati: assegnati });

    var s = schermata({ icona: g.icona, titolo: "Punti di questa partita", sotto: g.nome + " · " + nomeDifficolta(pesoGioco(g)) });
    var ol = el("ol", { class: "classifica" + (classificaFitta(assegnati.length) ? " fitta" : "") });
    var medaglie = medaglieAPari(assegnati.map(function (r) { return r.pos; }));   // a pari merito (r.pos uguale) la stessa medaglia
    assegnati.forEach(function (r, i) {
      ol.appendChild(el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        el("span", { class: "pos", text: medaglie[i] }),
        el("span", { class: "nome", text: r.nome }),
        el("span", { class: "punti", text: "+" + cifre(r.punti) })
      ]));
    });
    s._contenuto.appendChild(ol);
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "🏆 Classifica della serata", onclick: schermataTorneoHub }));
    mostra(s);
  }

  function schermataTorneoFine() {
    var s = schermata({ icona: "🏆", titolo: "Fine della serata!", sotto: torneo.n + (torneo.n === 1 ? " partita" : " partite") });
    s._contenuto.appendChild(podio(classificaTorneo(), true));
    s._piede.appendChild(el("button", { class: "btn btn-primario", text: "↻ Nuova serata (stessi giocatori)",
      onclick: function () { torneo.punti = {}; torneo.storia = []; torneo.n = 0; torneo.giocatori.forEach(function (n) { torneo.punti[n] = 0; }); schermataTorneoHub(); } }));
    var azioni = el("div", { class: "home-azioni" });
    azioni.appendChild(el("button", { class: "azione", text: "🏠 Home", onclick: function () { torneo = null; schermataHome(); } }));
    s._piede.appendChild(azioni);
    mostra(s);
  }


  // ---- al cuore: quello di questo pezzo che usano il cuore e gli altri pezzi ----
  cuore.apriTorneo = apriTorneo; cuore.avviaElim = avviaElim; cuore.boxElimSala = boxElimSala; cuore.chiudiTabelloneElim = chiudiTabelloneElim;
  cuore.classificaTorneo = classificaTorneo; cuore.elimUscito = elimUscito; cuore.esitoPartita = esitoPartita; cuore.fineTorneino = fineTorneino;
  cuore.iniziaTorneo = iniziaTorneo; cuore.lasciaTorneo = lasciaTorneo; cuore.livelloElim = livelloElim; cuore.nomeDifficolta = nomeDifficolta;
  cuore.nuovoElim = nuovoElim; cuore.opzioniTorneino = opzioniTorneino; cuore.pesoGioco = pesoGioco; cuore.puntiDaClassifica = puntiDaClassifica;
  cuore.regoleElim = regoleElim; cuore.rigaPuntiTorneo = rigaPuntiTorneo; cuore.scegliGironeElim = scegliGironeElim;
  cuore.schermataTorneoHub = schermataTorneoHub; cuore.seguiHost = seguiHost; cuore.seguiOspite = seguiOspite; cuore.serataLocale = serataLocale;
  cuore.torneinoArrivati = torneinoArrivati; cuore.torneoRisultato = torneoRisultato;
  Object.defineProperty(cuore, "N_GIRONI", { get: function () { return N_GIRONI; }, configurable: true });
  Object.defineProperty(cuore, "torneo", { get: function () { return torneo; }, configurable: true });
})();

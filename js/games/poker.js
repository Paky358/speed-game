/* =========================================================
   POKER con le carte francesi: Texas Hold'em e Poker all'italiana.
   Contro i Bot (i bot fissi di SG.bot, sempre gli stessi) oppure online, ognuno dal suo telefono
   (i posti vuoti l'host li può dare ai bot).
   Si gioca con le Speed Coins del profilo (al tavolo sono le fiches, come al Black Jack): ci si siede
   con al massimo 1.000 e nel profilo si salva sempre "monete fuori dal tavolo + fiches sul tavolo".
   Online l'host tiene la partita (motore qui sotto) e manda a tutti la foto (vm) SENZA le carte
   coperte; ognuno riceve le sue carte a parte (inviaVeloce + to).
   ========================================================= */
(function () {
  "use strict";

  var ID = "poker";
  var MIN = 2, MAX = { he: 10, it: 6 };
  var BUYIN = 1000;                    // con quante fiches ci si siede, al massimo
  var PICCOLO = 10, GRANDE = 20;       // Texas Hold'em: i bui
  var INVITO = 10, PUNTA_IT = 20;      // all'italiana: l'invito di tutti e la puntata più piccola
  var T_MOSSA = 30000;                 // online: tempo per decidere, poi passa (o lascia) da solo
  var T_PAUSA = 5000;                  // chi è in pausa (non c'era al giro prima): si aspetta poco
  var NOMI_BOT = ["Bot", "Rosa", "Peppe", "Gina", "Tonio", "Lia", "Dino", "Pina", "Ciro", "Nina", "Totò", "Lella"];
  // le battute dei bot (ogni tanto, nella nuvoletta sopra l'avatar)
  var FRASI_BOT = {
    passa: ["Passo, per ora", "Vediamo che succede", "Busso!", "Tocca a voi", "Non mi sbilancio", "Calma e gesso", "Io aspetto", "Piano piano…", "Niente da dire", "Faccio il furbo", "Vado avanti gratis", "Aspetto le vostre mosse", "Prima voi, prego", "Mi godo lo spettacolo", "Zitto zitto…", "Tocco il tavolo"],
    chiama: ["Vedo!", "Ci sto", "Non mi spaventi", "Voglio vedere", "Pago, va'", "Vediamo 'ste carte", "Ti seguo", "Non mi fai paura", "E va bene…", "Chi ha paura?", "Ci credo", "Secondo me bluffi", "Sono curioso", "Non mi freghi", "Pago e guardo", "Ti vengo dietro", "Hai la faccia di chi bluffa"],
    punta: ["Ci provo!", "Alziamo un po'", "Chi mi segue?", "Si fa sul serio", "Mi sento fortunato", "Questa è mia", "Coraggio, venite", "Un pensierino…", "Dai che si gioca", "Facciamo sul serio", "Assaggiate questa", "Un caffè e rilancio", "Si alza la posta!", "Pronti? Via!", "Vediamo chi ci crede", "Offro io", "Mettiamo pepe"],
    allin: ["Tutto dentro!", "O la va o la spacca", "Mi gioco la casa!", "Tutto su questa", "Adesso si balla", "Vediamo chi ha fegato", "Tutto o niente!", "Che Dio me la mandi buona", "Sbanco o torno a casa", "Si va fino in fondo!", "Chi mi ama mi segua", "Ora o mai più", "Tenetevi forte!"],
    lascia: ["Troppo per me", "Me ne vado, ciao", "Non è serata", "Lascio, per stavolta", "Mi ritiro con onore", "Carte da buttare", "La prossima è mia", "Mannaggia…", "Che mani mi date?", "Tengo famiglia", "Chi mescola, stasera?", "Vado a prendere un gelato", "Le carte non mi amano", "Ritirata strategica", "Meglio vivo che eroe"],
    cambia: ["Speriamo bene", "Dammi qualcosa di buono", "Cambio tutto!", "Mazzo, aiutami", "Proviamo così", "Vediamo cosa esce", "Fuori le brutte!", "Tentar non nuoce", "Pesco e prego", "Avanti le belle"],
    servito: ["Servito!", "Mi tengo queste", "Sto bene così", "Non tocco niente", "Mi piacciono queste", "Squadra che vince…", "Non cambio niente, eh", "Le tengo strette"]
  };
  var SEMI = ["♠", "♥", "♦", "♣"], ROSSO = { 1: 1, 2: 1 };
  var FORZA_SEME = [1, 4, 3, 2];       // all'italiana, a parità: cuori, quadri, fiori, picche
  var FIGURE = { 1: "A", 11: "J", 12: "Q", 13: "K" };
  var NOME_VAR = { he: "Texas Hold'em", it: "Poker all'italiana" };
  var PUNTATE = { preflop: 1, flop: 1, turn: 1, river: 1, puntata1: 1, puntata2: 1 };

  function BJ() { return window.__BJ || null; }
  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function mischia(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function rango(c) { return c.v === 1 ? 14 : c.v; }
  function testoCarta(c) { return (FIGURE[c.v] || String(c.v)) + SEMI[c.s]; }
  function conProfilo() { return !!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo()); }
  function portafoglio() { var f = conProfilo() && SGNube.fiches ? SGNube.fiches("blackjack") : null; return f == null ? 0 : f; }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }

  // Un solo salvataggio per mano conclusa. L'id della sessione e il numero della mano
  // restano nel profilo, così un messaggio online ripetuto o ricevuto al rientro non conta due volte.
  function salvaTrofeiMano(vm, cb) {
    if (cb.guarda || !vm || vm.stato !== "finemano" || !vm.manoStat || !conProfilo() || !SGNube.salvaProgressi) return;
    var mio = null;
    vm.manoStat.forEach(function (p) { if (p.id === cb.myId) mio = p; });
    if (!mio || !mio.partecipa) return;
    var chiave = String(vm.partitaId || "poker") + ":" + vm.n + ":" + cb.myId;
    var st = (SGNube.statGioco && SGNube.statGioco(ID)) || {};
    if (st.ultimaManoTrofei === chiave) return;
    var x = { maniGiocate: 1 };
    if (vm.variante === "it") x.maniItaliane = 1;
    if (mio.vinta) x.maniVinte = 1;
    if (mio.vinta && vm.variante === "he") x.vittorieTexas = 1;
    if (mio.vinta && vm.variante === "it") x.vittorieItaliana = 1;
    if (mio.showdown) x.maniMostrate = 1;
    if (mio.vinta && mio.showdown) x.maniVinteShowdown = 1;
    if (mio.vinta && !mio.showdown) x.maniVinteSenzaShowdown = 1;
    x.rilanci = mio.rilanci || 0;
    x.rilanciVeri = mio.rilanciVeri || 0;
    x.carteCambiate = mio.carteCambiate || 0;
    if (mio.vinta && mio.mano === "doppia") x.vittorieDoppia = 1;
    if (mio.vinta && ["tris", "scala", "colore", "full", "poker", "scalacolore"].indexOf(mio.mano) >= 0) x.vittorieTrisPlus = 1;
    if (mio.vinta && ["full", "poker", "scalacolore"].indexOf(mio.mano) >= 0) x.vittorieFullPlus = 1;
    if (mio.vinta && mio.mano === "poker") x.vittoriePoker = 1;
    if (mio.vinta && mio.mano === "scala") x.vittorieScala = 1;
    if (mio.vinta && mio.mano === "colore") x.vittorieColore = 1;
    if (mio.vinta && mio.rilanciVeri > 0) x.vittorieRilancio = 1;
    if (mio.vinta && mio.carteCambiate > 0) x.vittorieCambio = 1;
    if (mio.vinta && !vm.online && vm.difficolta === "difficile") x.vittorieDifficile = 1;
    if (mio.controUmani) x.maniOnline = 1;
    if (mio.vinta && mio.controUmani) x.vittorieOnline = 1;
    var serieDiff = st.serieDifficileOra || 0, serieOnline = st.serieOnlineOra || 0;
    if (!vm.online && vm.difficolta === "difficile") serieDiff = mio.vinta ? serieDiff + 1 : 0;
    else serieDiff = 0;
    if (mio.controUmani) serieOnline = mio.vinta ? serieOnline + 1 : 0;
    else serieOnline = 0;
    var incrs = []; Object.keys(x).forEach(function (k) { if (x[k]) incrs.push([k, x[k]]); });
    SGNube.salvaProgressi(null, ID, incrs,
      [["serieDifficileMax", serieDiff], ["serieOnlineMax", serieOnline]],
      [["ultimaManoTrofei", chiave], ["serieDifficileOra", serieDiff], ["serieOnlineOra", serieOnline]]);
  }

  // =========================================================
  //  CARTE E PUNTI
  // =========================================================
  // all'italiana il mazzo si accorcia: dal (11 − giocatori) in su (in 4: dal 7, 32 carte)
  function bassoIt(n) { return Math.max(2, 11 - n); }
  function creaMazzo(variante, n) {
    var basso = variante === "it" ? bassoIt(n) : 2, m = [];
    for (var s = 0; s < 4; s++) { m.push({ v: 1, s: s }); for (var v = basso; v <= 13; v++) m.push({ v: v, s: s }); }
    return mischia(m);
  }
  // dal più basso al più alto; all'italiana il colore batte il full (col mazzo corto è più raro)
  var ORDINE = { he: ["alta", "coppia", "doppia", "tris", "scala", "colore", "full", "poker", "scalacolore"],
                 it: ["alta", "coppia", "doppia", "tris", "scala", "full", "colore", "poker", "scalacolore"] };
  var NOMI_MANO = { alta: "Carta alta", coppia: "Coppia", doppia: "Doppia coppia", tris: "Tris", scala: "Scala", colore: "Colore", full: "Full", poker: "Poker", scalacolore: "Scala colore" };
  // valuta fino a 5 carte: { v: [tipo, poi le carte che decidono a parità], tipo, nome }
  function valuta5(cc, variante, basso) {
    var r = cc.map(rango).sort(function (a, b) { return b - a; });
    var conta = {}; r.forEach(function (x) { conta[x] = (conta[x] || 0) + 1; });
    var gruppi = Object.keys(conta).map(Number).sort(function (a, b) { return conta[b] - conta[a] || b - a; });
    var colore = cc.length === 5 && cc.every(function (c) { return c.s === cc[0].s; });
    var scala = 0;
    if (cc.length === 5 && gruppi.length === 5) {
      if (r[0] - r[4] === 4) scala = r[0];
      else if (r[0] === 14 && r[1] === basso + 3 && r[4] === basso) scala = basso + 3;   // l'asso sotto: 5-4-3-2-A (all'italiana A-7-8-9-10 col mazzo dal 7)
    }
    var c0 = conta[gruppi[0]], c1 = conta[gruppi[1]], tipo, dopo;
    if (scala && colore) { tipo = "scalacolore"; dopo = [scala]; }
    else if (c0 === 4) { tipo = "poker"; dopo = gruppi; }
    else if (c0 === 3 && c1 === 2) { tipo = "full"; dopo = gruppi; }
    else if (colore) { tipo = "colore"; dopo = r; }
    else if (scala) { tipo = "scala"; dopo = [scala]; }
    else if (c0 === 3) { tipo = "tris"; dopo = gruppi; }
    else if (c0 === 2 && c1 === 2) { tipo = "doppia"; dopo = gruppi; }
    else if (c0 === 2) { tipo = "coppia"; dopo = gruppi; }
    else { tipo = "alta"; dopo = r; }
    var v = [ORDINE[variante].indexOf(tipo)].concat(dopo);
    if (variante === "it") {   // a parità decide il seme della carta più importante (cuori, quadri, fiori, picche)
      var semeTop = 0;
      cc.forEach(function (c) { if (rango(c) === dopo[0]) semeTop = Math.max(semeTop, FORZA_SEME[c.s]); });
      v.push(semeTop);
    }
    return { v: v, tipo: tipo, nome: NOMI_MANO[tipo], carte: cc };
  }
  function confronta(a, b) {
    for (var i = 0; i < Math.max(a.length, b.length); i++) { var x = a[i] || 0, y = b[i] || 0; if (x !== y) return x - y; }
    return 0;
  }
  // la mano migliore: con 6 o 7 carte (Hold'em) prova tutte le combinazioni da 5
  function miglioreMano(carte, variante, basso) {
    if (carte.length <= 5) return valuta5(carte, variante, basso);
    var best = null, n = carte.length, i, j;
    function prova(cinque) { var x = valuta5(cinque, variante, basso); if (!best || confronta(x.v, best.v) > 0) best = x; }
    if (n === 6) for (i = 0; i < 6; i++) prova(carte.filter(function (c, k) { return k !== i; }));
    else for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) prova(carte.filter(function (c, k) { return k !== i && k !== j; }));
    return best;
  }

  // =========================================================
  //  MOTORE DELLA PARTITA (uguale contro il computer e online)
  // =========================================================
  function creaMotore(variante) {
    var M = { variante: variante, giocatori: [], dealer: -1, mazzo: [], scarti: [], tavolo: [], piatto: 0, daChiamare: 0, rilMin: 0,
      turno: -1, stato: "attesa", n: 0, esito: null, basso: 2, corsa: false, scadenza: null };
    function minimo() { return M.variante === "he" ? GRANDE : PUNTA_IT; }
    function attivi() { return M.giocatori.filter(function (p) { return p.seduto && !p.via && !p.pausa && p.stack > 0; }); }
    function inMano() { return M.giocatori.filter(function (p) { return p.inMano && !p.lascia; }); }
    function puoMuovere(p) { return p.inMano && !p.lascia && !p.allin; }
    function deveParlare(p) { return puoMuovere(p) && (!p.agito || p.inGiro < M.daChiamare); }
    function dopo(i, ok) { var n = M.giocatori.length; for (var k = 1; k <= n; k++) { var j = ((i + k) % n + n) % n; if (ok(M.giocatori[j])) return j; } return -1; }
    function metti(p, x) { x = Math.max(0, Math.min(Math.floor(x), p.stack)); p.stack -= x; p.inGiro += x; p.messo += x; if (p.stack === 0) p.allin = true; return x; }
    function pesca() { if (!M.mazzo.length) { M.mazzo = mischia(M.scarti); M.scarti = []; } return M.mazzo.pop(); }
    // la puntata in più che nessuno ha pareggiato torna a chi l'ha messa (non è una vincita)
    function rendi() {
      var ord = M.giocatori.slice().sort(function (a, b) { return b.messo - a.messo; }), p = ord[0];
      if (!p || p.messo <= 0) return;
      var d = p.messo - (ord[1] ? ord[1].messo : 0); if (d <= 0) return;
      var daGiro = Math.min(d, p.inGiro);
      p.inGiro -= daGiro; M.piatto -= d - daGiro; p.messo -= d; p.stack += d;
      if (p.stack > 0) p.allin = false;
      if (p.azione === "All-in" && p.stack > 0) p.azione = "Punta";
    }

    M.siedi = function (o) {
      var st = Math.max(0, Math.floor(o.stack || 0));
      var p = { id: o.id, nome: o.nome, omino: o.omino || null, bot: !!o.bot, stack: st, buyin: st, seduto: st > 0, via: false, pausa: false,
        inMano: false, lascia: false, allin: false, inGiro: 0, messo: 0, mano: [], agito: false, chiuso: false, azione: "", frase: "", mostra: false, cambio: null, valut: null,
        rilanciMano: 0, rilanciVeriMano: 0, carteCambiateMano: 0 };
      M.giocatori.push(p); return p;
    };
    M.trova = function (id) { for (var i = 0; i < M.giocatori.length; i++) if (M.giocatori[i].id === id) return i; return -1; };
    M.piattoTot = function () { var s = M.piatto; M.giocatori.forEach(function (p) { s += p.inGiro; }); return s; };
    M.inCorso = function () { return M.stato !== "attesa" && M.stato !== "finemano"; };

    // tavolo pulito, nessuna mano in corso
    M.azzera = function () {
      M.giocatori.forEach(function (p) { p.inMano = false; p.lascia = false; p.allin = false; p.inGiro = 0; p.messo = 0; p.mano = []; p.agito = false; p.chiuso = false; p.azione = ""; p.frase = ""; p.mostra = false; p.cambio = null; p.valut = null; p.rilanciMano = 0; p.rilanciVeriMano = 0; p.carteCambiateMano = 0; });
      M.esito = null; M.tavolo = []; M.piatto = 0; M.scarti = []; M.corsa = false; M.turno = -1; M.stato = "attesa";
    };
    M.nuovaMano = function () {
      M.azzera();
      var gioc = attivi();
      if (gioc.length < MIN) { M.stato = "attesa"; return false; }
      M.n++;
      gioc.forEach(function (p) { p.inMano = true; });
      function siMano(p) { return p.inMano; }
      M.dealer = dopo(M.dealer, siMano);
      M.basso = M.variante === "it" ? bassoIt(gioc.length) : 2;
      M.mazzo = creaMazzo(M.variante, gioc.length);
      if (M.variante === "he") {
        var sb = gioc.length === 2 ? M.dealer : dopo(M.dealer, siMano), bb = dopo(sb, siMano);   // in due il mazziere mette il buio piccolo
        metti(M.giocatori[sb], PICCOLO); M.giocatori[sb].azione = "Buio " + PICCOLO;
        metti(M.giocatori[bb], GRANDE); M.giocatori[bb].azione = "Buio " + GRANDE;
        gioc.forEach(function (p) { p.mano = [pesca(), pesca()]; });
        M.daChiamare = GRANDE; M.rilMin = GRANDE; M.stato = "preflop";
        M.turno = dopo(bb, puoMuovere);
      } else {
        gioc.forEach(function (p) {   // l'invito va nel piatto (non è una puntata del giro)
          var x = Math.min(INVITO, p.stack); p.stack -= x; p.messo += x; M.piatto += x; if (p.stack === 0) p.allin = true;
          p.azione = "Invito"; p.mano = [pesca(), pesca(), pesca(), pesca(), pesca()];
        });
        M.daChiamare = 0; M.rilMin = PUNTA_IT; M.stato = "puntata1";
        M.turno = dopo(M.dealer, puoMuovere);
      }
      controlla();
      return true;
    };
    // chi deve ancora parlare? Se nessuno, il giro di puntate è chiuso
    function controlla() {
      if (!PUNTATE[M.stato]) return;
      var rest = inMano();
      if (rest.length <= 1) return vinceSolo(rest[0]);
      if (M.turno >= 0 && deveParlare(M.giocatori[M.turno])) return;
      var j = dopo(M.turno, deveParlare);
      if (j >= 0) { M.turno = j; return; }
      chiudiGiro();
    }
    M.possibili = function (i) {
      var p = M.giocatori[i];
      if (i !== M.turno || !p || !puoMuovere(p) || !PUNTATE[M.stato]) return null;
      var serve = Math.max(0, M.daChiamare - p.inGiro), tutto = p.inGiro + p.stack;
      return { passa: serve === 0, chiama: serve > 0 ? Math.min(serve, p.stack) : 0,
        punta: tutto > M.daChiamare && !p.chiuso ? { min: Math.min(M.daChiamare + M.rilMin, tutto), max: tutto } : null };
    };
    // tipo: lascia | passa | chiama | punta (tot = a quanto arriva la mia puntata in questo giro)
    M.azione = function (i, tipo, tot) {
      var pos = M.possibili(i); if (!pos) return false;
      var p = M.giocatori[i], prima = M.daChiamare;
      if (tipo === "lascia") { p.lascia = true; p.azione = "Lascia"; }
      else if (tipo === "passa") { if (!pos.passa) return false; p.azione = "Passa"; }
      else if (tipo === "chiama") { if (!pos.chiama) return false; metti(p, pos.chiama); p.azione = p.allin ? "All-in" : "Chiama"; }
      else if (tipo === "punta") {
        if (!pos.punta) return false;
        tot = Math.max(pos.punta.min, Math.min(pos.punta.max, Math.floor(+tot || 0)));
        metti(p, tot - p.inGiro);
        if (tot > prima) {
          var pieno = tot - prima >= M.rilMin;
          if (pieno) M.rilMin = tot - prima;
          M.daChiamare = tot;
          // gli altri devono rispondere; un all-in più piccolo di un rilancio vero non riapre i rilanci a chi ha già parlato
          M.giocatori.forEach(function (q) { if (q === p) return; if (pieno || prima === 0) { q.agito = false; q.chiuso = false; } else if (q.agito) q.chiuso = true; });
        }
        p.azione = p.allin ? "All-in" : (prima === 0 ? "Punta" : "Rilancia");
      } else return false;
      if (tipo === "punta") { p.rilanciMano++; if (prima > 0 && tot > prima) p.rilanciVeriMano++; }
      p.agito = true;
      controlla();
      return true;
    };
    function chiudiGiro() {
      rendi();
      M.giocatori.forEach(function (q) { M.piatto += q.inGiro; q.inGiro = 0; q.agito = false; q.chiuso = false; });
      M.daChiamare = 0; M.rilMin = minimo(); M.turno = -1;
      var conFiches = inMano().filter(function (q) { return !q.allin; }).length;
      if (M.variante === "he") {
        if (M.stato === "river") return showdown();
        if (conFiches <= 1) { M.corsa = true; scopri(); return; }   // tutti all-in (o quasi): carte girate subito, poi escono da sole una strada alla volta
        prossimaStrada();
        M.giocatori.forEach(function (q) { if (puoMuovere(q)) q.azione = ""; });
        M.turno = dopo(M.dealer, puoMuovere);
        controlla();
      } else {
        if (M.stato === "puntata1") {
          M.stato = "cambio";
          inMano().forEach(function (q) { q.cambio = null; if (!q.allin) q.azione = ""; });
          return;
        }
        showdown();
      }
    }
    function prossimaStrada() {
      M.stato = M.stato === "preflop" ? "flop" : M.stato === "flop" ? "turn" : "river";
      var k = M.stato === "flop" ? 3 : 1;
      while (k--) M.tavolo.push(pesca());
    }
    M.corsaPasso = function () {
      if (!M.corsa) return;
      if (M.stato === "river") { M.corsa = false; return showdown(); }
      prossimaStrada(); scopri();
    };
    // all-in: le carte di chi è rimasto si vedono subito, col nome della mano aggiornato a ogni strada
    function scopri() { inMano().forEach(function (q) { q.mostra = true; q.valut = miglioreMano(q.mano.concat(M.tavolo), "he", 2); }); }
    // all'italiana: si cambiano da 0 a 4 carte (quali = posizioni nella mano)
    M.cambia = function (i, quali) {
      var p = M.giocatori[i];
      if (M.stato !== "cambio" || !p || !p.inMano || p.lascia || p.cambio != null) return false;
      var visti = {};
      quali = (quali || []).map(Number).filter(function (k) { if (k >= 0 && k < 5 && !visti[k]) { visti[k] = 1; return true; } return false; }).slice(0, 4);
      // le carte buttate vanno negli scarti DOPO aver pescato: se il mazzo finisce non si ripesca le sue
      var buttate = quali.map(function (k) { return p.mano[k]; });
      quali.forEach(function (k) { p.mano[k] = pesca(); });
      buttate.forEach(function (c) { M.scarti.push(c); });
      p.carteCambiateMano += quali.length;
      p.cambio = quali.length; p.azione = quali.length ? "Cambia " + quali.length : "Servito";
      forseFineCambio();
      return true;
    };
    function forseFineCambio() {
      var rest = inMano();
      if (rest.length <= 1) return vinceSolo(rest[0]);
      if (!rest.every(function (q) { return q.cambio != null; })) return;
      M.stato = "puntata2";
      M.giocatori.forEach(function (q) { q.agito = false; });
      if (rest.filter(function (q) { return !q.allin; }).length <= 1) return showdown();
      M.turno = dopo(M.dealer, puoMuovere);
      controlla();
    }
    // chi se ne va: lascia la mano (le fiches puntate restano nel piatto)
    M.esce = function (i) {
      var p = M.giocatori[i]; if (!p) return;
      p.via = true; p.seduto = false;
      if (!M.inCorso() || !p.inMano || p.lascia) return;
      p.lascia = true; p.azione = "Uscito";
      if (M.stato === "cambio") forseFineCambio();
      else if (M.corsa) { if (inMano().length <= 1) vinceSolo(inMano()[0]); }
      else controlla();
    };
    // i piatti: chi è all-in vince solo fino a quanto ha messo (piatti laterali per gli altri)
    function calcolaPiatti() {
      var livelli = [];
      M.giocatori.forEach(function (p) { if (p.messo > 0 && livelli.indexOf(p.messo) < 0) livelli.push(p.messo); });
      livelli.sort(function (a, b) { return a - b; });
      var res = [], prec = 0;
      livelli.forEach(function (L) {
        var quota = 0;
        M.giocatori.forEach(function (p) { quota += Math.max(0, Math.min(p.messo, L) - prec); });
        var aventi = M.giocatori.filter(function (p) { return p.inMano && !p.lascia && p.messo >= L; });
        var ultimo = res[res.length - 1];
        if (quota > 0) {
          if (ultimo && ultimo.aventi.length === aventi.length && ultimo.aventi.every(function (q) { return aventi.indexOf(q) >= 0; })) ultimo.importo += quota;
          else if (aventi.length) res.push({ importo: quota, aventi: aventi });
          else if (ultimo) ultimo.importo += quota;
        }
        prec = L;
      });
      return res;
    }
    function showdown() {
      M.turno = -1; M.corsa = false;
      rendi();
      M.giocatori.forEach(function (q) { M.piatto += q.inGiro; q.inGiro = 0; });
      var rest = inMano(), n = M.giocatori.length, vinti = {}, vincenti = {};
      function dist(q) { var d = (M.giocatori.indexOf(q) - M.dealer + n) % n; return d === 0 ? n : d; }   // il primo alla sinistra del mazziere
      rest.forEach(function (q) { q.valut = miglioreMano(M.variante === "he" ? q.mano.concat(M.tavolo) : q.mano, M.variante, M.basso); q.mostra = true; });
      calcolaPiatti().forEach(function (pt) {
        var best = null, chi = [];
        pt.aventi.forEach(function (q) { var c = best ? confronta(q.valut.v, best.valut.v) : 1; if (c > 0) { best = q; chi = [q]; } else if (c === 0) chi.push(q); });
        chi.sort(function (a, b) { return dist(a) - dist(b); });
        var quota = Math.floor(pt.importo / chi.length), resto = pt.importo - quota * chi.length;
        chi.forEach(function (q, k) { var x = quota + (k < resto ? 1 : 0); q.stack += x; vinti[q.id] = (vinti[q.id] || 0) + x; });
        chi.forEach(function (q) { q.valut.carte.forEach(function (c) { vincenti[c.v + "-" + c.s] = 1; }); });   // le carte che hanno vinto
      });
      M.piatto = 0; M.stato = "finemano"; M.esito = { vinti: vinti, confronto: true, vincenti: Object.keys(vincenti) };
    }
    function vinceSolo(p) {   // gli altri hanno lasciato: prende tutto senza far vedere le carte
      rendi();
      M.giocatori.forEach(function (q) { M.piatto += q.inGiro; q.inGiro = 0; });
      var tot = M.piatto, vinti = {}; M.piatto = 0;
      M.giocatori.forEach(function (q) { q.mostra = false; q.valut = null; });   // (anche se erano state girate durante un all-in)
      if (p) { p.stack += tot; vinti[p.id] = tot; }
      M.turno = -1; M.corsa = false; M.stato = "finemano"; M.esito = { vinti: vinti, confronto: false };
    }
    // fine partita a metà mano: le fiches messe in questa mano tornano a chi le ha messe
    M.annulla = function () {
      if (!M.inCorso()) return;
      M.giocatori.forEach(function (q) { q.stack += q.messo; q.messo = 0; q.inGiro = 0; q.inMano = false; q.mano = []; q.allin = false; });
      M.piatto = 0; M.turno = -1; M.corsa = false; M.stato = "attesa"; M.esito = null; M.tavolo = [];
    };
    return M;
  }

  // =========================================================
  //  BOT
  // =========================================================
  // Hold'em: quante volte vincerei, provando a caso le carte che mancano (pari = metà)
  function equita(mie, tavolo, nAvv, prove) {
    nAvv = Math.max(1, Math.min(nAvv, 5));
    var usate = {}; mie.concat(tavolo).forEach(function (c) { usate[c.v + "-" + c.s] = 1; });
    var resto = [];
    for (var s = 0; s < 4; s++) for (var v = 1; v <= 13; v++) if (!usate[v + "-" + s]) resto.push({ v: v, s: s });
    var serve = 5 - tavolo.length + nAvv * 2, vinte = 0;
    for (var k = 0; k < prove; k++) {
      for (var a = 0; a < serve; a++) { var j = a + Math.floor(Math.random() * (resto.length - a)), x = resto[a]; resto[a] = resto[j]; resto[j] = x; }
      var tav = tavolo.concat(resto.slice(0, 5 - tavolo.length)), pos = 5 - tavolo.length;
      var mio = miglioreMano(mie.concat(tav), "he", 2).v, perso = false, pari = 0;
      for (var o = 0; o < nAvv; o++) {
        var c = confronta(mio, miglioreMano([resto[pos], resto[pos + 1]].concat(tav), "he", 2).v); pos += 2;
        if (c < 0) { perso = true; break; }
        if (c === 0) pari++;
      }
      if (!perso) vinte += 1 / (pari + 1);
    }
    return vinte / prove;
  }
  // all'italiana: una stima dal tipo di mano (contro più avversari vale meno)
  function forzaIt(mano, basso, nAvv) {
    var v = valuta5(mano, "it", basso), base;
    switch (v.tipo) {
      case "alta": base = 0.18 + (v.v[1] - 10) * 0.02; break;
      case "coppia": base = 0.42 + (v.v[1] - 7) * 0.025; break;
      case "doppia": base = 0.7; break;
      case "tris": base = 0.84; break;
      case "scala": base = 0.9; break;
      case "full": base = 0.95; break;
      case "colore": base = 0.97; break;
      default: base = 0.995;
    }
    return Math.pow(Math.max(0.05, Math.min(0.995, base)), Math.sqrt(Math.max(1, nAvv)));
  }
  function decidiBot(M, i, liv) {
    var p = M.giocatori[i], pos = M.possibili(i); if (!pos) return null;
    var avv = M.giocatori.filter(function (q) { return q !== p && q.inMano && !q.lascia; }).length || 1;
    var forza = M.variante === "he" ? equita(p.mano, M.tavolo, avv, 110) : forzaIt(p.mano, M.basso, avv);
    var rumore = { facile: 0.2, medio: 0.08, difficile: 0.03 }[liv]; if (rumore == null) rumore = 0.08;
    forza = Math.max(0, Math.min(1, forza + (Math.random() * 2 - 1) * rumore));
    var piatto = M.piattoTot(), chiama = pos.chiama || 0;
    // chi punta forte di solito ha qualcosa: contro una puntata grande la mia mano vale meno (non a Facile)
    if (liv !== "facile" && chiama > 0 && chiama > (piatto - chiama) * 0.5) forza *= liv === "difficile" ? 0.82 : 0.9;
    var rel = forza * (avv + 1);   // 1 = una mano qualsiasi; 2 = il doppio della media
    // ultimo a parlare e tutti hanno passato: un bluff ha più senso
    var ultimo = !M.giocatori.some(function (q) { return q !== p && q.inMano && !q.lascia && !q.allin && !q.agito; });
    var bluff = Math.random() < (liv === "facile" ? 0.02 : liv === "difficile" ? (ultimo && pos.passa ? 0.14 : 0.06) : 0.04);
    function punta(fraz) {
      if (!pos.punta) return chiama ? { tipo: "chiama" } : { tipo: "passa" };
      var tot = M.daChiamare + Math.max(M.rilMin, Math.round(piatto * fraz / 10) * 10);
      return { tipo: "punta", tot: Math.min(pos.punta.max, Math.max(pos.punta.min, tot)) };
    }
    if (pos.passa) {
      // a Difficile, se parla per ultimo (la posizione migliore) punta anche con mani un po' meno forti
      if (rel > (liv === "difficile" && ultimo ? 1.3 : 1.5) || bluff) return punta(rel > 2 ? 0.8 : 0.6);
      if (rel > 1.15 && Math.random() < 0.5) return punta(0.5);
      return { tipo: "passa" };
    }
    var quota = chiama / (piatto + chiama);
    if (rel > 1.9 && Math.random() < 0.6) return punta(0.9);
    if (bluff && Math.random() < 0.4 && chiama < p.stack * 0.2) return punta(1);
    // un all-in grande non si chiama con una mano media (a Medio e Difficile)
    if (liv !== "facile" && chiama >= p.stack * 0.6 && rel < 1.6 && forza < quota * 1.3) return { tipo: "lascia" };
    if (forza >= quota * (liv === "facile" ? 0.7 : 1.15) || (chiama <= M.rilMin && rel > 0.9)) return { tipo: "chiama" };
    return { tipo: "lascia" };
  }
  // all'italiana: quali carte cambiare (tiene coppie, tris, e 4 carte a colore o a scala)
  function cambioBot(mano, basso) {
    var v = valuta5(mano, "it", basso), r = mano.map(rango), k;
    if (["scala", "colore", "full", "poker", "scalacolore"].indexOf(v.tipo) >= 0) return [];
    var conta = {}; r.forEach(function (x) { conta[x] = (conta[x] || 0) + 1; });
    if (v.tipo !== "alta") { var q = []; for (k = 0; k < 5; k++) if (conta[r[k]] === 1) q.push(k); return q; }
    var semi = {}; mano.forEach(function (c) { semi[c.s] = (semi[c.s] || 0) + 1; });
    for (var s in semi) if (semi[s] === 4) { for (k = 0; k < 5; k++) if (String(mano[k].s) !== s) return [k]; }
    var ord = r.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) { return a.x - b.x; });
    if (ord[3].x - ord[0].x === 3) return [ord[4].i];   // le 4 più basse in fila
    if (ord[4].x - ord[1].x === 3) return [ord[0].i];   // le 4 più alte in fila
    return ord.slice(0, 4).map(function (o) { return o.i; });   // tiene solo la carta più alta
  }

  // =========================================================
  //  SUONI (niente vibrazione: vibra solo quando tocchi tu)
  // =========================================================
  function suono(tipo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    if (tipo === "vinci" || tipo === "grande") {   // fiches che arrivano: tre (o cinque, se il piatto è grande) tintinnii che salgono
      [0, 1, 2, 3, 4].slice(0, tipo === "grande" ? 5 : 3).forEach(function (k) {
        try {
          var t1 = ctx.currentTime + k * 0.07, o1 = ctx.createOscillator(), g1 = ctx.createGain();
          o1.type = "triangle"; o1.frequency.setValueAtTime(880 * Math.pow(1.19, k), t1);
          g1.gain.setValueAtTime(0.0001, t1); g1.gain.exponentialRampToValueAtTime(0.07, t1 + 0.01); g1.gain.exponentialRampToValueAtTime(0.0001, t1 + 0.16);
          o1.connect(g1); g1.connect(ctx.destination); o1.start(t1); o1.stop(t1 + 0.18);
        } catch (e) {}
      });
      return;
    }
    try {
      var t0 = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
      o.type = tipo === "carta" ? "triangle" : "square";
      o.frequency.setValueAtTime(tipo === "carta" ? 520 : 1400, t0);
      o.frequency.exponentialRampToValueAtTime(tipo === "carta" ? 260 : 900, t0 + 0.07);
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(tipo === "carta" ? 0.08 : 0.05, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.09);
      o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.1);
    } catch (e) {}
  }

  // =========================================================
  //  LA PARTITA SU QUESTO TELEFONO: contro il computer, oppure host online
  // =========================================================
  function partita(t, online) {
    if (online && !(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var V = { variante: variante(imp.variante), liv: imp.difficolta || "medio" };
    var prof = conProfilo();
    var nome = (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Tu";
    var W = prof ? portafoglio() : BUYIN;   // il mio portafoglio (le Speed Coins del profilo); senza profilo 1.000 per giocare
    if (prof && W < GRANDE) return senzaFiches(t, function () { partita(t, online); });
    var partitaId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    var M = creaMotore(V.variante);
    var io = M.siedi({ id: "host", nome: nome, omino: t.mioOmino ? t.mioOmino(nome) : null, stack: Math.min(W, BUYIN) });
    var fuori = W - io.stack;   // quello che resta nel portafoglio, fuori dal tavolo
    var H = { fase: online ? "lobby" : "gioco", codice: "…", pronta: !online, classifica: null, omini: { host: io.omino }, guardano: {},
      soloGuarda: {} };   // chi non è tra chi gioca (scelti nella Sala): guarda e non si siede
    var rete = null, tBot = null, tTempo = null, tMano = null, tSalva = null, salvato = W;

    function salvaMio(subito) {   // nel profilo: fiches fuori + fiches sul tavolo
      if (!prof) return;
      clearTimeout(tSalva);
      var fai = function () { var tot = fuori + io.stack; if (tot !== salvato) { salvato = tot; SGNube.salvaFiches("blackjack", tot); } };
      if (subito) fai(); else tSalva = setTimeout(fai, 1500);
    }
    // un bot al tavolo: uno dei bot fissi (SG.bot, scelto col livello del tavolo), mai col nome di chi è seduto;
    // prima quelli che non sono ancora passati da questo tavolo (chi ha finito le fiches non si risiede subito)
    function aggiungiBot() {
      var tutti = M.giocatori.map(function (p) { return p.nome; }), seduti = M.giocatori.filter(function (p) { return !p.via; }).map(function (p) { return p.nome; });
      var b = null;
      if (window.SG && SG.bot) {
        b = SG.bot.prendi(1, { livello: V.liv, escludi: tutti })[0];
        if (!b || !SG.bot.daId(b.id)) b = SG.bot.prendi(1, { livello: V.liv, escludi: seduti })[0] || b;   // finiti quelli nuovi: torna uno di prima
      }
      var nomeB = b ? b.nome : (NOMI_BOT.filter(function (n) { return seduti.indexOf(n) < 0; })[0] || ("Bot " + (M.giocatori.length + 1)));
      var p = M.siedi({ id: "bot" + Math.random().toString(36).slice(2, 7), nome: nomeB, bot: true, stack: BUYIN,
        omino: b && b.omino ? b.omino : (window.SGOmino ? SGOmino.casuale(nomeB) : null) });
      H.omini[p.id] = p.omino; mandaOmini();   // il suo avatar a tutti (gli ospiti non lo inventano)
      return p;
    }
    function seduti() { return M.giocatori.filter(function (p) { return !p.via; }); }
    function ferma() { clearTimeout(tBot); clearTimeout(tTempo); tBot = tTempo = null; M.scadenza = null; }

    // ---- la foto per tutti: MAI le carte coperte (quelle vanno con privato) ----
    function vm() {
      var tp = M.turno >= 0 ? M.giocatori[M.turno] : null;
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, variante: M.variante, stato: M.stato, n: M.n,
        partitaId: partitaId, online: online, difficolta: V.liv,
        manoStat: M.stato === "finemano" && M.esito ? M.giocatori.filter(function (p) { return p.inMano; }).map(function (p) {
          return { id: p.id, partecipa: true, vinta: !!(M.esito.vinti && M.esito.vinti[p.id]), showdown: !!p.mostra,
            mano: p.valut ? p.valut.tipo : null, altezza: p.valut && p.valut.v ? p.valut.v[1] : 0,
            rilanci: p.rilanciMano || 0, rilanciVeri: p.rilanciVeriMano || 0, carteCambiate: p.carteCambiateMano || 0,
            controUmani: online && M.giocatori.some(function (q) { return q !== p && q.inMano && !q.bot; }) };
        }) : null,
        corsa: M.corsa, tavolo: M.tavolo.slice(), piatto: M.piattoTot(), daChiamare: M.daChiamare, rilMin: M.rilMin, basso: M.basso,
        turno: tp ? tp.id : null, dealer: M.dealer >= 0 && M.giocatori[M.dealer] ? M.giocatori[M.dealer].id : null,
        tempo: M.scadenza ? Math.max(0, M.scadenza - Date.now()) : null, tempoTot: M.durata || T_MOSSA,   // quanto manca per decidere (online)
        vinti: M.esito ? M.esito.vinti : null, vincenti: M.esito && M.esito.vincenti ? M.esito.vincenti : null, classifica: H.classifica,
        guardano: Object.keys(H.guardano),   // chi è entrato a tavolo pieno e guarda
        soloGuarda: Object.keys(H.soloGuarda),   // (di questi, chi non è tra chi gioca: non si siede)
        players: seduti().map(function (p) {
          return { id: p.id, nome: p.nome, bot: p.bot, stack: p.stack, buyin: p.buyin, inGiro: p.inGiro, lascia: p.lascia, allin: p.allin, azione: p.azione, frase: p.frase || "",
            inMano: p.inMano, nCarte: p.mano.length, seduto: p.seduto, pausa: !!p.pausa, chiuso: !!p.chiuso, cambio: p.cambio,
            carte: p.mostra ? p.mano.slice() : null, nomeMano: p.mostra && p.valut ? p.valut.nome : null };
        }) };
    }
    function mandaCarte(soloId) {   // a ognuno le sue carte, a parte
      if (!rete) return;
      M.giocatori.forEach(function (p) {
        if (p.bot || p.id === "host" || p.via || (soloId && p.id !== soloId)) return;
        rete.inviaVeloce({ t: "mie", to: p.id, n: M.n, carte: p.inMano ? p.mano.slice() : [] });
      });
    }
    function mandaOmini() { if (rete) rete.inviaVeloce({ t: "omini", omini: H.omini }); }
    function bd() { var v = vm(); if (rete) rete.invia({ t: "vm", vm: v }); disegna(t, v, cb); }

    // ---- il giro: bot, tempo per decidere, carte che escono da sole, mano finita ----
    function ciclo() {
      ferma();
      if (H.fase !== "gioco") return;
      if (M.stato === "finemano") { salvaMio(true); if (!tMano) tMano = setTimeout(function () { tMano = null; prossimaMano(); }, 4300); return; }
      if (M.stato === "attesa") return;
      if (M.corsa) { tBot = setTimeout(function () { M.corsaPasso(); suono("carta"); ciclo(); bd(); }, 1300); return; }
      if (M.stato === "cambio") {
        var bots = M.giocatori.filter(function (p) { return p.bot && p.inMano && !p.lascia && p.cambio == null; });
        if (bots.length) { tBot = setTimeout(function () { bots.forEach(function (p) { M.cambia(M.giocatori.indexOf(p), cambioBot(p.mano, M.basso)); frase(p, p.cambio ? "cambia" : "servito"); }); dopoMossa(); }, 900); return; }
        if (online) {
          var manca = M.giocatori.filter(function (p) { return p.inMano && !p.lascia && p.cambio == null; });
          var durC = manca.length && manca.every(function (p) { return p.pausa; }) ? T_PAUSA : T_MOSSA;
          M.scadenza = Date.now() + durC; M.durata = durC;
          tTempo = setTimeout(function () {   // chi non ha cambiato in tempo si tiene le sue carte e va in pausa
            M.giocatori.forEach(function (p, i) { if (p.inMano && !p.lascia && p.cambio == null) { M.cambia(i, []); p.pausa = true; } });
            mandaCarte(); dopoMossa();
          }, durC);
        }
        return;
      }
      if (M.turno < 0) return;
      var i = M.turno, p = M.giocatori[i];
      if (p.bot) tBot = setTimeout(function () {
        var d = decidiBot(M, i, V.liv);
        if (M.azione(i, d ? d.tipo : "lascia", d && d.tot)) frase(p, p.allin && d && d.tipo !== "lascia" ? "allin" : d ? d.tipo : "lascia");
        dopoMossa();
      }, 700 + Math.random() * 900);
      else if (online) {
        var dur = p.pausa ? T_PAUSA : T_MOSSA;   // chi è già in pausa non fa aspettare tutti mezzo minuto
        M.scadenza = Date.now() + dur; M.durata = dur;
        tTempo = setTimeout(function () {   // tempo scaduto: passa (o lascia) da solo e va in pausa finché non torna
          var pos = M.possibili(i); if (pos) M.azione(i, pos.passa ? "passa" : "lascia");
          p.pausa = true; dopoMossa();
        }, dur);
      }
    }
    // ogni tanto un bot dice qualcosa (si vede nella nuvoletta sopra il suo avatar)
    function frase(p, tipo) {
      var l = FRASI_BOT[tipo]; p.frase = "";
      if (p.bot && l && Math.random() < 0.35) p.frase = l[Math.floor(Math.random() * l.length)];
    }
    function dopoMossa() { ciclo(); bd(); }   // prima il giro (che fissa il tempo per decidere), poi la foto
    function prossimaMano() {
      if (H.fase !== "gioco") return;
      M.giocatori.forEach(function (p) {
        if (p.via) return;
        if (p.bot && p.stack <= 0) { p.via = true; delete H.omini[p.id]; if (!online || seduti().length < MAX[M.variante]) aggiungiBot(); }   // un bot nuovo al posto di chi ha finito
        else if (!p.bot && p.stack <= 0) p.seduto = false;                                                          // chi è senza fiches aspetta di rientrare
      });
      // contro il computer, se hai finito le fiches i bot si fermano e aspettano te
      if (!online && !io.seduto) { M.azzera(); salvaMio(true); ciclo(); bd(); return; }
      if (M.nuovaMano()) { suono("carta"); mandaCarte(); }
      salvaMio(true); ciclo(); bd();
    }
    // la mossa vale solo se è per la mano, il momento e la puntata che si vedevano quando si è toccato
    function attuale(rif) { return !rif || (rif.n === M.n && rif.st === M.stato && rif.dc === M.daChiamare); }

    // ---- le mie mosse (host o chi gioca contro il computer) ----
    var cb = { sonoHost: true, online: online, myId: "host",
      mie: function () { return { n: M.n, carte: io.inMano ? io.mano.slice() : [] }; },
      omini: function () { return H.omini; },
      fuori: function () { return fuori; },
      puoRientrare: function () { return prof ? Math.min(fuori, BUYIN - io.stack) : BUYIN - io.stack; },   // senza profilo le fiches sono per finta
      rientroInCorso: function () { return false; },
      onAzione: function (tipo, tot, rif) { if (attuale(rif) && M.azione(M.trova("host"), tipo, tot)) { io.pausa = false; if (tipo !== "lascia" && tipo !== "passa") suono("fiche"); dopoMossa(); } },
      onCambio: function (quali, rif) { if ((!rif || rif.n === M.n) && M.cambia(M.trova("host"), quali)) { io.pausa = false; suono("carta"); dopoMossa(); } },
      onCiSono: function () { io.pausa = false; if (H.fase === "gioco" && M.stato === "attesa") prossimaMano(); else bd(); },
      onRientra: function () {   // si risiede con altre fiches del portafoglio
        var x = cb.puoRientrare(); if (x < GRANDE || io.stack >= GRANDE || (M.inCorso() && io.inMano && !io.lascia)) return;
        if (prof) fuori -= x;
        io.stack += x; io.buyin += x; io.seduto = true; io.pausa = false; salvaMio(true);
        if (M.stato === "attesa" && H.fase === "gioco") prossimaMano(); else bd();
      },
      onBonus: function (nuovo, piu) { var b = piu || 0; fuori += b; salvato += b; bd(); },   // monete della ruota del giorno: già aggiunte al profilo
      onBot: function (piu) {
        if (H.fase !== "lobby") return;
        if (piu && seduti().length < MAX[M.variante]) aggiungiBot();
        else if (!piu) { var ult = seduti().filter(function (p) { return p.bot; }).pop(); if (ult) { M.giocatori.splice(M.giocatori.indexOf(ult), 1); if (M.dealer >= M.giocatori.length) M.dealer = -1; delete H.omini[ult.id]; } }   // (in saletta: via del tutto, così il "+" lo rimette)
        bd();
      },
      onComincia: function () {
        if (H.fase !== "lobby" || seduti().length < MIN || seduti().length > MAX[M.variante]) return;
        H.fase = "gioco"; H.classifica = null; mandaOmini(); prossimaMano();
      },
      onFine: function (ok) {   // solo online: chiude la partita e fa la classifica (fiches guadagnate)
        if (ok !== true) return t.conferma("Chiudere il tavolo e vedere la classifica?", null, "Sì", function () { cb.onFine(true); });   // la finestra dell'app
        if (H.fase !== "gioco") return;
        ferma(); clearTimeout(tMano); tMano = null; M.annulla();
        var umani = M.giocatori.filter(function (p) { return !p.bot; });
        var ord = umani.map(function (p) { return { id: p.id, nome: p.nome, punti: p.stack - p.buyin }; }).sort(function (a, b) { return b.punti - a.punti; });
        ord.forEach(function (r) { r.pos = 1 + ord.filter(function (q) { return q.punti > r.punti; }).length; });
        H.classifica = ord; H.fase = "fine"; salvaMio(true); bd();
        if (t.risultato) t.risultato(ord.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
      },
      onNuova: function () {   // stessa stanza, stessi amici: si torna nella saletta con le fiches che ognuno ha
        M.giocatori = M.giocatori.filter(function (p) { return !p.via; });
        M.giocatori.forEach(function (p) { p.buyin = p.stack; p.seduto = p.stack > 0; p.pausa = false; });
        M.azzera(); M.dealer = -1; H.fase = "lobby"; H.classifica = null; bd();
      },
      onEsci: function (ok) {   // (ok === true: già confermato nella finestra dell'app)
        if (ok !== true && online && H.fase === "gioco") return t.conferma("Chiudere il tavolo per tutti?", null, "Esci", function () { cb.onEsci(true); });
        if (ok !== true && !online && M.inCorso() && io.inMano && !io.lascia) return t.conferma("Lasciare il tavolo? Le fiches già puntate in questa mano restano sul tavolo.", null, "Esci", function () { cb.onEsci(true); });
        ferma(); clearTimeout(tMano); tMano = null;
        // online: la mano a metà si annulla (ognuno si riprende le fiches puntate) e tutti ricevono il conto giusto prima della chiusura
        if (online && M.inCorso()) { M.annulla(); if (rete) rete.invia({ t: "vm", vm: vm() }); }
        salvaMio(true);
        // contro il computer: alzandoti dal tavolo dopo almeno una mano prendi gli XP (hai vinto se ti alzi con più fiches)
        if (!online && M.n > 0 && t.risultato) t.risultato([{ nome: io.nome, pos: io.stack - io.buyin > 0 ? 1 : 2 }]);
        if (rete) rete.chiudi();
        t.esci();
      } };

    // "⚙️ Regole" nella saletta: l'host cambia variante e bravura dei bot quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; M.variante = variante(im.variante); V.liv = im.difficolta || V.liv; bd(); };
    // la Rivincita (online, dalla classifica): stessi amici di nuovo nella saletta, ognuno con le sue fiches
    if (online) t.onRivincita = function () { if (H.fase === "fine") cb.onNuova(); };

    if (online) {
      rete = SGNet.ospita(ID, {
        onCodice: function (c) { H.codice = c; bd(); },
        onConnesso: function () { H.pronta = true; bd(); },
        onAddio: function (id) {
          delete H.guardano[id]; delete H.soloGuarda[id];
          var i = M.trova(id); if (i < 0) { bd(); return; }
          if (H.fase === "lobby") { M.giocatori.splice(i, 1); if (M.dealer >= M.giocatori.length) M.dealer = -1; bd(); return; }
          M.esce(i); dopoMossa();
        },
        onMsg: function (id, m) {
          if (!m || !m.t) return;
          var i = M.trova(id), p = i >= 0 ? M.giocatori[i] : null;
          if (m.t === "join") {
            if (i < 0 && t.puoSedersi && !t.puoSedersi(id, m.nome)) {   // non è tra chi gioca: guarda il tavolo
              H.guardano[id] = String(m.nome || "Amico").slice(0, 16); H.soloGuarda[id] = 1;
              mandaOmini(); bd(); return;
            }
            var pieno = seduti().length >= MAX[M.variante];
            if (p && p.via && pieno) p = null;   // era uscito e intanto il suo posto è stato preso: guarda
            if (p) { p.via = false; p.pausa = false; if (p.stack > 0) p.seduto = true; delete H.guardano[id]; }   // si era perso: torna al suo posto e gioca dalla prossima mano
            else if (i < 0 && H.fase !== "fine" && !pieno) {
              var nomeG = String(m.nome || "Amico").slice(0, 16), st = Math.max(0, Math.min(BUYIN, Math.floor(+m.fiches || 0)));
              p = M.siedi({ id: id, nome: nomeG, omino: avatarValido(m.omino), stack: st });
              H.omini[id] = p.omino; delete H.guardano[id];
            } else if (!p) H.guardano[id] = String(m.nome || "Amico").slice(0, 16);   // tavolo pieno: guarda finché non si libera un posto
            mandaOmini();
            if (p && H.fase === "gioco" && M.stato === "attesa") prossimaMano(); else bd();
            if (p) mandaCarte(id);
            return;
          }
          if (!p || p.via) return;
          if (m.t === "azione" && H.fase === "gioco") { if (attuale(m.n != null ? { n: m.n, st: m.st, dc: m.dc } : null) && M.azione(i, m.tipo, m.tot)) { p.pausa = false; if (m.tipo !== "lascia" && m.tipo !== "passa") suono("fiche"); dopoMossa(); } }
          else if (m.t === "cambio" && H.fase === "gioco") { if ((m.n == null || m.n === M.n) && M.cambia(i, m.quali)) { p.pausa = false; mandaCarte(id); dopoMossa(); } }
          else if (m.t === "cisono") { p.pausa = false; if (H.fase === "gioco" && M.stato === "attesa") prossimaMano(); else bd(); }
          else if (m.t === "rientra") {   // si risiede con altre fiches (finite quelle di prima, o in saletta)
            if (p.stack >= GRANDE || (M.inCorso() && p.inMano && !p.lascia)) return;
            var x = Math.max(0, Math.min(BUYIN - p.stack, Math.floor(+m.fiches || 0)));
            if (!x) return;
            p.stack += x; p.buyin += x; p.seduto = true; p.pausa = false;
            if (H.fase === "gioco" && M.stato === "attesa") prossimaMano(); else bd();
          }
        },
        onErrore: function () { ferma(); clearTimeout(tMano); tMano = null; errore(t, "Problema di collegamento: la stanza non si apre. Riprova."); }   // (solo se il primo collegamento non riesce)
      });
      bd();
    } else {
      var nBot = Math.max(1, Math.min(MAX[M.variante] - 1, Math.floor(+imp.avversari || 3)));
      for (var b = 0; b < nBot; b++) aggiungiBot();
      prossimaMano();
    }
  }

  // =========================================================
  //  OSPITE ONLINE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var prof = conProfilo();
    var S = { rete: null, myId: null, nome: "", vm: null, mie: null, omini: {}, fuori: 0, tSalva: null, salvato: null, attesaRientro: null };
    var W = prof ? portafoglio() : BUYIN, buyin = Math.min(W, BUYIN);
    S.fuori = W - buyin;
    // le monete "fuori dal tavolo" restano scritte su questo telefono (per stanza): chi ricarica la pagina le ritrova giuste
    function chiave() { return "sg-poker-fuori-" + String(codice).toLowerCase() + "-" + S.myId; }   // per stanza e per giocatore
    function ricorda() {
      if (!prof || S.salvato == null) return;
      try { localStorage.setItem(chiave(), JSON.stringify({ fuori: S.fuori, salvato: S.salvato, t: Date.now() })); } catch (e) {}
    }
    try {   // via i ricordi vecchi delle altre stanze (più di 6 ore)
      Object.keys(localStorage).forEach(function (k) {
        if (k.indexOf("sg-poker-fuori-") !== 0) return;
        var x = null; try { x = JSON.parse(localStorage.getItem(k)); } catch (e) {}
        if (!x || !(Date.now() - x.t < 6 * 3600000)) localStorage.removeItem(k);
      });
    } catch (e) {}
    function ricordato() {
      try { var r = JSON.parse(localStorage.getItem(chiave()) || "null"); if (r && Date.now() - r.t < 6 * 3600000 && isFinite(r.fuori) && isFinite(r.salvato)) return r; } catch (e) {}
      return null;
    }
    function me() { if (!S.vm) return null; for (var i = 0; i < S.vm.players.length; i++) if (S.vm.players[i].id === S.myId) return S.vm.players[i]; return null; }
    // la prima volta che mi vedo al tavolo: se ero già qui (pagina ricaricata) riprendo le monete fuori che avevo,
    // più quello che nel frattempo è cambiato nel profilo; se no, fuori = portafoglio − quelle sul tavolo
    function allinea() {
      var m = me(); if (S.allineato || !prof || !m) return; S.allineato = true;
      var r = ricordato();
      // appena entrato (l'host mi ha seduto con le fiches che ho portato): fuori resta W − buyin anche se ho già pagato un buio
      var nuovo = m.buyin === buyin && m.stack + (m.inGiro || 0) + GRANDE >= buyin;
      S.fuori = r ? Math.max(0, r.fuori + (W - r.salvato)) : Math.max(0, W - (nuovo ? buyin : m.stack));
      S.salvato = W; ricorda();
    }
    function salva(subito) {   // nel profilo: fiches fuori + fiches sul tavolo (solo quando sono seduto)
      if (!prof || !me()) return;
      clearTimeout(S.tSalva);
      var fai = function () { var m = me(); if (!m) return; var tot = S.fuori + m.stack; if (tot !== S.salvato) { S.salvato = tot; SGNube.salvaFiches("blackjack", tot); } ricorda(); };
      if (subito) fai(); else S.tSalva = setTimeout(fai, 1500);
    }
    // mi risiedo: le monete escono dal portafoglio solo quando l'host me le ha messe davvero sul tavolo
    function controllaRientro() {
      var R = S.attesaRientro, m = me(); if (!R || !m) return;
      // quante fiches ha messo davvero l'host: si guarda il totale portato al tavolo (buyin), non lo stack
      // (se la mano parte subito, il buio è già stato tolto dallo stack)
      var messe = m.buyin != null && R.primaB != null ? m.buyin - R.primaB : m.stack - R.prima;
      if (messe <= 0) return;
      clearTimeout(R.tm); S.attesaRientro = null;
      if (prof) { S.fuori = Math.max(0, S.fuori - Math.min(R.x, messe)); ricorda(); }
    }
    function rif() { return S.vm ? { n: S.vm.n, st: S.vm.stato, dc: S.vm.daChiamare } : {}; }
    var cb = { sonoHost: false, online: true, myId: null,
      mie: function () { return S.mie && S.vm && S.mie.n === S.vm.n ? S.mie : null; },
      omini: function () { return S.omini; },
      fuori: function () { return S.fuori; },
      puoRientrare: function () { var m = me(); return m ? (prof ? Math.min(S.fuori, BUYIN - m.stack) : BUYIN - m.stack) : 0; },
      rientroInCorso: function () { return !!(S.attesaRientro && !S.attesaRientro.libero); },
      onAzione: function (tipo, tot, r) { r = r || rif(); if (S.rete) S.rete.invia({ t: "azione", tipo: tipo, tot: tot, n: r.n, st: r.st, dc: r.dc }); },
      onCambio: function (quali) { if (S.rete) S.rete.invia({ t: "cambio", quali: quali, n: S.vm ? S.vm.n : null }); },
      onCiSono: function () { if (S.rete) S.rete.invia({ t: "cisono" }); },
      onSiediti: function () { if (S.rete) S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null, fiches: buyin }); },
      onRientra: function () {
        var m = me(), x = cb.puoRientrare(); if (!m || x < GRANDE || !S.rete || cb.rientroInCorso()) return;
        // dopo 6 secondi senza risposta il tasto torna, ma la richiesta resta: se la foto arriva tardi le monete si tolgono lo stesso (una volta sola)
        var R = S.attesaRientro || { prima: m.stack, primaB: m.buyin };
        clearTimeout(R.tm); R.x = x; R.libero = false;
        R.tm = setTimeout(function () { R.libero = true; if (S.vm) disegna(t, S.vm, cb); }, 6000);
        S.attesaRientro = R;
        S.rete.invia({ t: "rientra", fiches: x });
        disegna(t, S.vm, cb);
      },
      onBonus: function (nuovo, piu) { var b = piu || 0; S.fuori += b; if (S.salvato != null) S.salvato += b; ricorda(); if (S.vm) disegna(t, S.vm, cb); },   // monete della ruota già aggiunte al profilo
      onEsci: function (ok) {
        if (ok !== true && S.vm && S.vm.fase === "gioco") return t.conferma("Lasciare il tavolo? Le fiches già puntate in questa mano restano sul tavolo.", null, "Esci", function () { cb.onEsci(true); });
        salva(true); if (S.rete) S.rete.chiudi(); t.esci();
      } };
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🃏", titolo: "Entra al tavolo", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null, fiches: buyin }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;   // era per un altro telefono
          if (m.t === "vm") { S.vm = m.vm; allinea(); controllaRientro(); salva(); disegna(t, m.vm, cb); }
          else if (m.t === "mie") { S.mie = { n: m.n, carte: m.carte || [] }; if (S.vm) disegna(t, S.vm, cb); }
          else if (m.t === "omini") { S.omini = m.omini || {}; if (S.vm) disegna(t, S.vm, cb); }
        },
        onChiuso: function () {
          salva(true);
          // sulla classifica finale la classifica resta: cambia solo la scritta
          if (S.vm && S.vm.fase === "fine" && FINE && document.body.contains(FINE.s)) { if (cb._notaFine && document.body.contains(cb._notaFine)) cb._notaFine.textContent = "🚪 L'host ha chiuso il tavolo."; return; }
          errore(t, "Il tavolo è stato chiuso dall'host.");
        },   // (chiuso apposta: se l'host sparisce, "La stanza è chiusa" lo dice il core)
        onErrore: function () { errore(t, "Problema di collegamento. Riprova."); }   // (solo se il primo collegamento non riesce)
      });
    }
    function attesa() {
      var s = t.schermata({ icona: "🃏", titolo: "⏳ Sto entrando…", sotto: "Poker · stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per tutti): saletta, tavolo, classifica
  // =========================================================
  var UI = null;   // la schermata del tavolo si costruisce UNA volta e poi si aggiorna a pezzi
  var FINE = null;   // la classifica sullo schermo: { k, s } (la stessa foto non la rifà: niente lampeggio)
  function disegna(t, vm, cb) {
    salvaTrofeiMano(vm, cb);
    if (vm.fase === "lobby") { UI = null; FINE = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      UI = null;
      var k = vm.partitaId + "|" + cb.myId + "|" + JSON.stringify(vm.classifica || []);
      if (FINE && FINE.k === k && document.body.contains(FINE.s)) return;
      FINE = { k: k, s: finale(t, vm, cb) }; return;
    }
    FINE = null;
    if (!UI || !document.body.contains(UI.s)) UI = creaSchermo(t, cb);
    UI.cb = cb;
    aggiorna(UI, vm);
  }
  function faccia(cb, p) {
    var cfg = (cb.omini() || {})[p.id] || (window.SGOmino ? SGOmino.casuale(p.nome) : null);
    return cfg && window.SGOmino ? SGOmino.svg(cfg, { busto: true }) : "<div style='font-size:1.6rem;line-height:46px'>🙂</div>";
  }
  function lobby(t, vm, cb) {
    var el = t.el, extra = [], umani = vm.players.filter(function (p) { return !p.bot; }).length;
    extra.push(el("p", { class: "modulo-nota", text: NOME_VAR[vm.variante] + " · da 2 a " + MAX[vm.variante] + " giocatori. Ognuno si siede con le sue Speed Coins, che al tavolo diventano fiches (al massimo " + fmtN(BUYIN) + ")." }));
    if (vm.players.length > MAX[vm.variante]) extra.push(el("p", { class: "modulo-nota", style: "color:#ffa94d", text: "Siete troppi per questa variante: togli qualche Bot." }));
    if (cb.sonoHost) {
      var nb = vm.players.length - umani;
      extra.push(el("div", { class: "pk-bot-riga" }, [
        el("span", { text: "🤖 Bot al tavolo: " + nb }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "−", disabled: nb ? null : "disabled", onclick: function () { cb.onBot(false); } }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "+", disabled: vm.players.length < MAX[vm.variante] ? null : "disabled", onclick: function () { cb.onBot(true); } }) ]));
      // l'host vede chi non ha fiches (non entra nelle mani finché non si risiede)
      var senza = vm.players.filter(function (p) { return !p.bot && p.stack < GRANDE; }).map(function (p) { return p.id === cb.myId ? "tu" : p.nome; });
      if (senza.length) extra.push(el("p", { class: "modulo-nota", style: "color:#ffa94d", text: "Senza fiches: " + senza.join(", ") + ". Non giocano finché non si siedono con delle monete." }));
    }
    var io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    if (io) extra.push(fichesBox(t, cb, io, true));
    else if ((vm.guardano || []).indexOf(cb.myId) >= 0) extra.push(boxPieno(t, cb, vm));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN, puoiDaSolo: vm.players.length >= MIN,
      puoComincia: vm.players.length >= MIN && vm.players.length <= MAX[vm.variante],
      vuoti: Math.max(0, MIN - vm.players.length),
      giocatori: vm.players.map(function (p) {
        return { id: p.id, nome: p.nome, omino: (cb.omini() || {})[p.id] || (p.bot && window.SGOmino ? SGOmino.casuale(p.nome) : null), host: p.id === "host", tu: p.id === cb.myId, bot: p.bot };
      }),
      extra: extra, attesa: "Aspetta che l'host cominci: si gioca a " + NOME_VAR[vm.variante] + "! 🃏", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  // chi è entrato a tavolo pieno: guarda, e si siede appena si libera un posto
  function boxPieno(t, cb, vm) {
    var el = t.el, box = el("div", { class: "pk-fiches" });
    if ((vm.soloGuarda || []).indexOf(cb.myId) >= 0) { box.appendChild(el("div", { text: "👀 Guardi la partita: questa volta giocano gli altri." })); return box; }
    box.appendChild(el("div", { text: "🪑 Il tavolo è pieno: guardi la partita e ti siedi quando si libera un posto." }));
    if (vm.players.length < MAX[vm.variante] && cb.onSiediti) box.appendChild(el("button", { class: "btn btn-primario", text: "🪑 Siediti, c'è un posto!", onclick: cb.onSiediti }));
    return box;
  }
  // le mie fiches (e, se sono finite, il modo per risedersi con altre monete o la ruota del giorno)
  function fichesBox(t, cb, io, inSaletta) {
    var el = t.el, box = el("div", { class: "pk-fiches" });
    if (io.stack >= GRANDE) {
      box.appendChild(el("div", { text: "🎰 Ti siedi con " + fmtN(io.stack) + " fiches" + (io.stack > BUYIN ? " (le vincite restano sul tavolo)" : "") }));
      return box;
    }
    var x = cb.puoRientrare ? cb.puoRientrare() : 0;
    if (x >= GRANDE) {
      var aspetta = cb.rientroInCorso && cb.rientroInCorso();
      box.appendChild(el("button", { class: "btn btn-primario", text: aspetta ? "⏳ Ti sto facendo sedere…" : "🎰 Siediti con " + fmtN(x) + " fiches", disabled: aspetta ? "disabled" : null, onclick: function () { if (!aspetta) cb.onRientra(); } }));
    } else {
      box.appendChild(el("div", { text: inSaletta ? "Ti servono delle monete per sederti al tavolo." : "Non hai più monete da mettere sul tavolo." }));
      if (conProfilo() && BJ() && BJ().riquadroBonus) box.appendChild(BJ().riquadroBonus(el, function (nuovo, piu) { cb.onBonus(nuovo, piu); }));
    }
    if (!cb.online) box.appendChild(el("button", { class: "btn btn-fantasma", text: "🏠 Alzati dal tavolo", onclick: cb.onEsci }));
    return box;
  }
  function creaSchermo(t, cb) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("pk-piena");
    var ui = { t: t, s: s, el: el, cb: cb, posti: {}, chiaveMie: "", chiaveAz: "", sel: {}, rialzo: null, nSel: -1, kCom: ["", "", "", "", ""], slotCom: [], nodiMie: [], blocco: 0, chiaveFine: "", kTempo: "", tempoFine: 0 };
    ui.info = el("div", { class: "pk-info" });
    var barra = el("div", { class: "pk-barra" }, [ el("button", { class: "pk-tastino", text: "‹", "aria-label": "Esci", onclick: function () { ui.cb.onEsci(); } }), ui.info,
      el("button", { class: "pk-tastino", text: "?", "aria-label": "Le combinazioni", onclick: function () { guida(ui); } }),
      cb.sonoHost && cb.online ? el("button", { class: "pk-tastino", text: "🏁", "aria-label": "Fine partita", onclick: function () { ui.cb.onFine(); } }) : null ]);
    ui.tavolo = el("div", { class: "pk-tavolo" }, [ el("div", { class: "pk-feltro" }) ]);
    ui.comuni = el("div", { class: "pk-comuni" });
    for (var c = 0; c < 5; c++) { ui.slotCom.push(el("div", { class: "pk-slot" })); ui.comuni.appendChild(ui.slotCom[c]); }   // i 5 posti delle carte in mezzo, fatti una volta
    ui.piatto = el("div", { class: "pk-piatto" });
    ui.msg = el("div", { class: "pk-msg" });
    ui.tavolo.appendChild(el("div", { class: "pk-centro" }, [ ui.comuni, ui.piatto, ui.msg ]));
    ui.tempo = el("div", { class: "pk-tempo" }, [ el("i") ]);
    ui.mioInfo = el("div", { class: "pk-mio-info" });
    ui.mie = el("div", { class: "pk-mie" });
    ui.azioni = el("div", { class: "pk-azioni" });
    ui.scena = el("div", { class: "pk-scena" }, [ barra, ui.tavolo, el("div", { class: "pk-io" }, [ ui.tempo, ui.mioInfo, ui.mie, ui.azioni ]) ]);
    s._contenuto.appendChild(ui.scena);
    t.mostra(s);
    return ui;
  }
  function cartaPiccola(el, c) {   // carta semplice e leggibile anche piccola
    return el("div", { class: "pk-cs" + (ROSSO[c.s] ? " rossa" : "") }, [ el("b", { text: FIGURE[c.v] || String(c.v) }), el("i", { text: SEMI[c.s] }) ]);
  }
  function cartaGrande(el, c) {   // le mie carte: quelle disegnate del Black Jack
    var b = BJ();
    if (b && b.cartaHTML) return el("div", { class: "pk-carta", html: b.cartaHTML(c, false) });
    var d = cartaPiccola(el, c); d.classList.add("grande"); return d;
  }
  // la barretta del tempo: parte piena e si svuota da sola (anima solo transform)
  function barraTempo(box, fine, tot, chiave) {
    if (box._k === chiave) return; box._k = chiave;
    var i = box.firstChild;
    if (!fine) { box.style.visibility = "hidden"; i.style.transition = "none"; return; }
    var resta = Math.max(0, fine - Date.now());
    box.style.visibility = "visible";
    i.style.transition = "none"; i.style.transform = "scaleX(" + Math.min(1, resta / (tot || T_MOSSA)).toFixed(3) + ")";
    void i.offsetWidth;
    i.style.transition = "transform " + resta + "ms linear"; i.style.transform = "scaleX(0)";
  }
  function aggiorna(ui, vm) {
    ui.vm = vm;
    var cb = ui.cb, el = ui.el, io = null;
    vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    ui.io = io;
    ui.info.textContent = NOME_VAR[vm.variante] + (vm.variante === "he" ? " · bui " + PICCOLO + "/" + GRANDE : " · invito " + INVITO) + (vm.n ? " · mano " + vm.n : "");
    var fine = vm.stato === "finemano" && vm.vinti, vincenti = {};
    if (fine && vm.vincenti) vm.vincenti.forEach(function (k) { vincenti[k] = 1; });
    var evidenzia = !!(fine && vm.vincenti && vm.vincenti.length);
    var mioTurno = !!(io && vm.turno === io.id && PUNTATE[vm.stato]);
    var inCambio = vm.stato === "cambio" && io && io.inMano && !io.lascia && io.cambio == null;

    // il tempo per decidere (online): ricomincia solo quando cambia di chi è il turno
    var kt = vm.tempo != null ? [vm.n, vm.stato, vm.turno, vm.daChiamare].join("|") : "";
    if (kt !== ui.kTempo) { ui.kTempo = kt; ui.tempoFine = vm.tempo != null ? Date.now() + vm.tempo : 0; }

    // ---- gli altri intorno al tavolo (io sono in basso: le mie cose stanno sotto) ----
    var k0 = 0; vm.players.forEach(function (p, k) { if (p.id === cb.myId) k0 = k; });
    var altri = vm.players.slice(k0 + 1).concat(vm.players.slice(0, k0)).filter(function (p) { return p.id !== cb.myId; });
    var n = altri.length, arco = n <= 1 ? 0 : Math.min(300, 64 * (n - 1)), visti = {};
    ui.tavolo.classList.toggle("stretto", n >= 6);
    altri.forEach(function (p, k) {
      // da sinistra, passando per l'alto, fino a destra; con tanti giocatori si scende anche ai lati (libero solo il centro in basso)
      var ang = n <= 1 ? 270 : 270 - arco / 2 + k * arco / (n - 1), a = ang * Math.PI / 180;
      var P = ui.posti[p.id];
      if (!P) { P = ui.posti[p.id] = creaPosto(ui, p); ui.tavolo.appendChild(P.nodo); }
      P.nodo.style.left = (50 + (n >= 6 ? 41 : 39) * Math.cos(a)).toFixed(1) + "%";
      P.nodo.style.top = (50 + (n >= 6 ? 40 : 36) * Math.sin(a)).toFixed(1) + "%";
      aggiornaPosto(ui, P, p, vm, vincenti, kt);
      visti[p.id] = 1;
    });
    Object.keys(ui.posti).forEach(function (id) { if (!visti[id]) { var nd = ui.posti[id].nodo; if (nd.parentNode) nd.parentNode.removeChild(nd); delete ui.posti[id]; } });

    // ---- centro: carte comuni (Hold'em), piatto, cosa succede. Cambia solo il posto della carta nuova ----
    ui.comuni.style.display = vm.variante === "he" ? "" : "none";
    for (var c = 0; c < 5; c++) {
      var cc = vm.variante === "he" ? vm.tavolo[c] : null, kc = cc ? testoCarta(cc) : "";
      if (kc !== ui.kCom[c]) {
        var nuovo = cc ? cartaPiccola(el, cc) : el("div", { class: "pk-slot" });
        ui.comuni.replaceChild(nuovo, ui.slotCom[c]); ui.slotCom[c] = nuovo; ui.kCom[c] = kc;
      }
      ui.slotCom[c].classList.toggle("conta", !!(evidenzia && cc && vincenti[cc.v + "-" + cc.s]));
      ui.slotCom[c].classList.toggle("spenta", !!(evidenzia && cc && !vincenti[cc.v + "-" + cc.s]));
    }
    ui.piatto.textContent = vm.piatto > 0 ? "Piatto " + fmtN(vm.piatto) : "";
    ui.msg.textContent = messaggio(vm, cb);

    // ---- le mie carte (nel cambio, toccarle sposta solo quella toccata) ----
    var mie = cb.mie();
    if (ui.nSel !== vm.n || !inCambio) { if (ui.nSel !== vm.n) ui.rialzo = null; ui.sel = {}; ui.nSel = vm.n; }
    var km = mie ? vm.n + JSON.stringify(mie.carte) + (inCambio ? "c" : "") + (io && io.lascia ? "L" : "") : "";
    if (km !== ui.chiaveMie) {
      ui.chiaveMie = km; svuota(ui.mie); ui.nodiMie = [];
      ui.mie.classList.toggle("cinque", !!(mie && mie.carte.length > 2));
      ui.mie.classList.toggle("lascia", !!(io && io.lascia));
      if (mie) mie.carte.forEach(function (cc, k) {
        var d = cartaGrande(el, cc); d._k = cc.v + "-" + cc.s;
        if (inCambio) {
          d.classList.add("tocca"); if (ui.sel[k]) d.classList.add("via");
          d.addEventListener("click", function () {
            if (ui.sel[k]) delete ui.sel[k]; else if (Object.keys(ui.sel).length < 4) ui.sel[k] = 1; else return;
            d.classList.toggle("via", !!ui.sel[k]);
            disegnaAzioni(ui, ui.vm, ui.io);
          });
        }
        ui.mie.appendChild(d); ui.nodiMie.push(d);
      });
    }
    ui.nodiMie.forEach(function (d) { d.classList.toggle("conta", !!(evidenzia && vincenti[d._k])); });
    // la mia riga: fiches, puntata, che mano ho
    var testo = io ? "Tu · " + fmtN(io.stack) + " fiches" : "👀 Guardi il tavolo";   // (chi guarda non ha fiches al tavolo)
    if (io && io.inGiro > 0) testo += " · puntata " + fmtN(io.inGiro);
    if (vm.dealer === cb.myId) testo += " · Ⓓ";
    var nomeMano = "";
    if (mie && mie.carte.length && io && io.inMano && !io.lascia) nomeMano = miglioreMano(vm.variante === "he" ? mie.carte.concat(vm.tavolo) : mie.carte, vm.variante, vm.variante === "it" ? (vm.basso || bassoIt(vm.players.filter(function (p) { return p.inMano; }).length)) : 2).nome;
    if (vm.vinti && vm.vinti[cb.myId]) nomeMano = "+" + fmtN(vm.vinti[cb.myId]) + " 🎉";
    var ki = testo + "|" + nomeMano;
    if (ki !== ui.kInfo) {
      ui.kInfo = ki; svuota(ui.mioInfo);
      ui.mioInfo.appendChild(el("span", { text: testo }));
      ui.mioInfo.appendChild(el("span", { class: "pk-mano-nome", text: nomeMano }));
    }
    barraTempo(ui.tempo, ui.tempoFine && (mioTurno || inCambio) ? ui.tempoFine : 0, vm.tempoTot, kt + (mioTurno || inCambio ? "|io" : ""));

    disegnaAzioni(ui, vm, io);

    // fine mano: le fiches volano dal piatto a chi ha vinto
    if (fine) { var kf = vm.n + "|" + Object.keys(vm.vinti).join(","); if (kf !== ui.chiaveFine) { ui.chiaveFine = kf; festa(ui, vm); } }
  }
  function festa(ui, vm) {
    var cb = ui.cb, ids = Object.keys(vm.vinti || {}); if (!ids.length) return;
    var mio = vm.vinti[cb.myId];
    if (mio) suono(mio >= 400 ? "grande" : "vinci");
    var base = ui.scena.getBoundingClientRect(), da = ui.piatto.getBoundingClientRect();
    if (!base.width) return;
    var x0 = da.left + da.width / 2 - base.left, y0 = da.top + da.height / 2 - base.top;
    ids.forEach(function (id, j) {
      var dove = id === cb.myId ? ui.mioInfo : ui.posti[id] && ui.posti[id].av; if (!dove) return;
      var r = dove.getBoundingClientRect(), dx = r.left + r.width / 2 - base.left - x0, dy = r.top + r.height / 2 - base.top - y0;
      var quante = vm.vinti[id] >= 400 ? 6 : 4;
      for (var k = 0; k < quante; k++) (function (k) {
        var f = ui.el("div", { class: "pk-volo" });
        f.style.left = (x0 + (k % 3 - 1) * 6) + "px"; f.style.top = y0 + "px"; f.style.transitionDelay = (j * 150 + k * 70) + "ms";
        ui.scena.appendChild(f);
        setTimeout(function () { f.style.transform = "translate(" + dx.toFixed(0) + "px," + dy.toFixed(0) + "px) scale(.75)"; f.style.opacity = "0"; }, 30);
        setTimeout(function () { if (f.parentNode) f.parentNode.removeChild(f); }, 1600);
      })(k);
    });
  }
  function creaPosto(ui, p) {
    var el = ui.el, P = { kn: null };
    P.av = el("div", { class: "pk-av", html: faccia(ui.cb, p) });
    P.d = el("span", { class: "pk-d", text: "D" });
    P.nuv = el("div", { class: "pk-nuv" });
    P.tempo = el("div", { class: "pk-tempo piccolo" }, [ el("i") ]);
    P.carte = el("div", { class: "pk-dorsi" });
    P.nome = el("div", { class: "pk-nome", text: p.nome });
    P.stack = el("div", { class: "pk-stack" });
    P.az = el("div", { class: "pk-az" });
    P.nodo = el("div", { class: "pk-posto" }, [ el("div", { class: "pk-av-box" }, [ P.av, P.d, P.nuv, P.tempo ]), P.carte, P.nome, P.stack, P.az ]);
    return P;
  }
  // che tipo di mossa è (per il colore della nuvoletta)
  function tipoAz(a) { return /^Lascia|^Uscito/.test(a) ? "lascia" : /^Passa/.test(a) ? "passa" : /^Chiama/.test(a) ? "chiama" : /^(Punta|Rilancia|All-in)/.test(a) ? "punta" : "cambia"; }
  function aggiornaPosto(ui, P, p, vm, vincenti, kt) {
    var vinto = vm.vinti && vm.vinti[p.id];
    P.nodo.classList.toggle("turno", vm.turno === p.id);
    P.nodo.classList.toggle("fuori", !!(p.lascia || !p.inMano));
    P.nodo.classList.toggle("vince", !!vinto);
    P.d.style.display = vm.dealer === p.id ? "" : "none";
    P.stack.textContent = p.seduto === false && !p.stack ? "senza fiches" : fmtN(p.stack);
    var az = "", cls = "pk-az";
    if (vinto) { az = "+" + fmtN(vinto); cls += " vinto"; }
    else if (p.carte && p.nomeMano) az = p.nomeMano;
    else if (vm.turno === p.id) az = "🤔";
    else if (p.inGiro > 0) { az = fmtN(p.inGiro); cls += " punta"; }
    else if (p.pausa && !p.inMano) az = "💤 in pausa";
    else az = p.azione || "";
    if (P.az.textContent !== az) P.az.textContent = az;
    if (P.az.className !== cls) P.az.className = cls;
    barraTempo(P.tempo, vm.turno === p.id && ui.tempoFine ? ui.tempoFine : 0, vm.tempoTot, kt + "|" + (vm.turno === p.id));
    // la nuvoletta con l'ultima mossa (e ogni tanto una battuta del bot)
    var kn = vm.n + "|" + p.azione + "|" + p.inGiro + "|" + (p.frase || "");
    if (P.kn === null) P.kn = kn;
    else if (kn !== P.kn) {
      P.kn = kn;
      if (p.azione && !/^(Buio|Invito)/.test(p.azione) && vm.stato !== "finemano") {
        svuota(P.nuv);
        P.nuv.appendChild(ui.el("span", { text: p.azione + (p.inGiro > 0 && /^(Chiama|Punta|Rilancia|All-in)/.test(p.azione) ? " " + fmtN(p.inGiro) : "") }));
        if (p.frase) P.nuv.appendChild(ui.el("small", { text: "«" + p.frase + "»" }));
        P.nuv.className = "pk-nuv " + tipoAz(p.azione) + (p.frase ? " lunga" : "");
        void P.nuv.offsetWidth; P.nuv.classList.add("su");
      }
    }
    // le carte: coperte durante la mano, scoperte alla fine (scritte, così si leggono)
    var kc = p.carte ? p.carte.map(testoCarta).join(" ") : (p.inMano && !p.lascia ? "x" + Math.min(p.nCarte, 5) : "");
    if (P.kc !== kc) {
      P.kc = kc; svuota(P.carte); P.carte.className = "pk-dorsi" + (p.carte ? " scoperte" : "");
      if (p.carte) p.carte.forEach(function (c) { P.carte.appendChild(ui.el("span", { class: "pk-cartina" + (ROSSO[c.s] ? " rossa" : "") + (vincenti[c.v + "-" + c.s] ? " conta" : ""), text: testoCarta(c) })); });
      else if (p.inMano && !p.lascia) for (var k = 0; k < Math.min(p.nCarte, 5); k++) P.carte.appendChild(ui.el("span", { class: "pk-dorso" }));
    }
  }
  function nomeDi(vm, cb, id) { if (id === cb.myId) return "Tu"; for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return vm.players[i].nome; return "?"; }
  function messaggio(vm, cb) {
    if (vm.stato === "attesa") return vm.players.filter(function (p) { return p.stack > 0 && p.seduto !== false && !p.pausa; }).length < MIN ? "Aspettiamo altri giocatori con le fiches…" : "";
    if (vm.stato === "cambio") return "🔄 Cambio delle carte…";
    if (vm.corsa) return "🔥 All-in! Carte scoperte, le altre escono da sole…";
    if (vm.stato === "finemano" && vm.vinti) {
      var ids = Object.keys(vm.vinti); if (!ids.length) return "";
      var chi = ids.map(function (id) { return nomeDi(vm, cb, id); });
      var mano = ""; vm.players.forEach(function (p) { if (p.id === ids[0] && p.nomeMano) mano = p.nomeMano; });
      if (ids.length === 1) return (chi[0] === "Tu" ? "Hai vinto " : chi[0] + " vince ") + fmtN(vm.vinti[ids[0]]) + (mano ? " con " + mano : "");
      var uguali = ids.every(function (id) { return vm.vinti[id] === vm.vinti[ids[0]]; });
      return (uguali ? "Piatto diviso: " : "Vincono: ") + ids.map(function (id, k) { return chi[k] + " +" + fmtN(vm.vinti[id]); }).join(" · ");
    }
    return "";
  }
  function mossePer(vm, io) {   // le stesse regole del motore, viste dal mio telefono
    var serve = Math.max(0, vm.daChiamare - io.inGiro), tutto = io.inGiro + io.stack;
    return { passa: serve === 0, chiama: serve > 0 ? Math.min(serve, io.stack) : 0,
      punta: tutto > vm.daChiamare && !io.chiuso ? { min: Math.min(vm.daChiamare + vm.rilMin, tutto), max: tutto } : null };
  }
  function disegnaAzioni(ui, vm, io) {
    var cb = ui.cb, el = ui.el;
    var mioTurno = io && vm.turno === io.id && PUNTATE[vm.stato];
    var inCambio = vm.stato === "cambio" && io && io.inMano && !io.lascia && io.cambio == null;
    var chiave = [vm.stato, vm.turno, vm.daChiamare, vm.rilMin, vm.n, io ? [io.inGiro, io.stack, io.seduto, io.lascia, io.cambio, io.inMano, io.pausa, io.chiuso, io.allin].join("/") : "-",
      ui.rialzo ? "R" : "", inCambio ? Object.keys(ui.sel).length : "", cb.fuori(), cb.rientroInCorso && cb.rientroInCorso() ? "A" : "",
      io ? "" : (vm.guardano || []).indexOf(cb.myId) + "/" + vm.players.length].join("|");
    if (chiave === ui.chiaveAz) return;
    ui.chiaveAz = chiave; svuota(ui.azioni);
    var rif = { n: vm.n, st: vm.stato, dc: vm.daChiamare };
    function stato(txt) { ui.azioni.appendChild(el("div", { class: "pk-stato", text: txt })); }
    function bottone(cls, txt, fn) { return el("button", { class: "pk-btn " + cls, text: txt, onclick: fn }); }
    // una mossa: dopo il tocco i tasti restano fermi un attimo (un doppio tocco non vale per il giro dopo)
    function mossa(fn) { return function () { if (Date.now() < ui.blocco) return; ui.blocco = Date.now() + 600; fn(); }; }
    if (!io) {
      if ((vm.guardano || []).indexOf(cb.myId) >= 0) ui.azioni.appendChild(boxPieno(ui.t, cb, vm));
      else stato("Stai guardando il tavolo");
      if (ui.fac === undefined) ui.fac = (ui.t.faccine && ui.t.faccine()) || null;   // chi guarda manda le faccine a chi gioca
      if (ui.fac) ui.azioni.appendChild(ui.fac);
      return;
    }
    if (!io.inMano && io.stack < GRANDE && vm.stato !== "finemano") {   // fiches finite: ci si risiede col portafoglio o col bonus
      stato("Hai finito le fiches sul tavolo.");
      ui.azioni.appendChild(fichesBox(ui.t, cb, io));
      return;
    }
    if (io.pausa && !mioTurno && !inCambio) {   // tempo scaduto: salta le mani finché non dice "ci sono"
      stato("💤 Sei in pausa: salti le mani finché non torni.");
      ui.azioni.appendChild(el("div", { class: "pk-riga" }, [ bottone("ok", "✋ Ci sono!", mossa(function () { cb.onCiSono(); })) ]));
      return;
    }
    if (inCambio) {
      var n = Object.keys(ui.sel).length;
      stato(n ? "Cambi " + n + (n === 1 ? " carta" : " carte") + " (massimo 4)" : "Tocca le carte da cambiare (massimo 4)");
      ui.azioni.appendChild(el("div", { class: "pk-riga" }, [
        bottone("passa", "✋ Servito", mossa(function () { cb.onCambio([], rif); })),
        bottone("ok", n ? "🔄 Cambia " + n : "🔄 Cambia", mossa(function () { if (n) cb.onCambio(Object.keys(ui.sel).map(Number), rif); })) ]));
      return;
    }
    if (!mioTurno) {
      ui.rialzo = null;
      if (vm.stato === "finemano") return stato("Prossima mano tra poco…");
      if (vm.stato === "attesa") return stato(messaggio(vm, cb) || "Si comincia…");
      if (vm.stato === "cambio") return stato("Aspetta che gli altri cambino le carte…");
      if (io.lascia) return stato("Hai lasciato: aspetta la prossima mano");
      if (!io.inMano) return stato("Entri alla prossima mano");
      if (io.allin) return stato("Sei all-in: vediamo come va…");
      return stato(vm.turno ? "Tocca a " + nomeDi(vm, cb, vm.turno) + "…" : "…");
    }
    var pos = mossePer(vm, io);
    if (ui.rialzo && pos.punta) return pannelloRialzo(ui, vm, pos, io, rif);
    ui.rialzo = null;
    var riga = el("div", { class: "pk-riga" });
    riga.appendChild(bottone("lascia", "Lascia", mossa(function () { cb.onAzione("lascia", 0, rif); })));
    if (pos.passa) riga.appendChild(bottone("passa", "Passa", mossa(function () { cb.onAzione("passa", 0, rif); })));
    else riga.appendChild(bottone("passa", (pos.chiama >= io.stack ? "All-in " : "Chiama ") + fmtN(pos.chiama), mossa(function () { cb.onAzione("chiama", 0, rif); })));
    if (pos.punta) {
      if (pos.punta.min >= pos.punta.max) riga.appendChild(bottone("punta", "All-in " + fmtN(pos.punta.max - io.inGiro), mossa(function () { cb.onAzione("punta", pos.punta.max, rif); })));
      else riga.appendChild(bottone("punta", vm.daChiamare ? "Rilancia…" : "Punta…", function () { if (Date.now() < ui.blocco) return; ui.rialzo = { tot: pos.punta.min }; ui.chiaveAz = ""; aggiorna(ui, ui.vm); }));
    }
    ui.azioni.appendChild(riga);
  }
  function pannelloRialzo(ui, vm, pos, io, rif) {
    var el = ui.el, cb = ui.cb, R = ui.rialzo, min = pos.punta.min, max = pos.punta.max, passo = 10;
    R.tot = Math.max(min, Math.min(max, R.tot));
    var etichetta = el("div", { class: "pk-stato pk-rialzo-tot" });
    var ok = el("button", { class: "pk-btn ok" });
    function giusto(v) { v = Math.round(v / passo) * passo; return v >= max || max - v < passo ? max : Math.max(min, v); }   // a passi di 10
    function mostra() {
      etichetta.textContent = (vm.daChiamare ? "Rilanci a " : "Punti ") + fmtN(R.tot) + (R.tot >= max ? " (all-in)" : "");
      ok.textContent = "✓ " + (R.tot >= max ? "All-in" : (vm.daChiamare ? "Rilancia" : "Punta"));
      cursore.value = String(R.tot);
    }
    var cursore = el("input", { type: "range", class: "pk-slider", min: String(min), max: String(max), step: "1", value: String(R.tot) });
    cursore.addEventListener("input", function () { R.tot = giusto(+cursore.value); mostra(); });
    // come nel poker vero: prima pareggio, poi aggiungo metà (o tutto) il piatto che c'è dopo il mio pareggio
    var dopoChiamata = vm.piatto + Math.max(0, vm.daChiamare - io.inGiro);
    function scelta(txt, val) { return el("button", { class: "pk-btn piccolo", text: txt, onclick: function () { R.tot = giusto(val); mostra(); } }); }
    ok.addEventListener("click", function () { if (Date.now() < ui.blocco) return; ui.blocco = Date.now() + 600; ui.rialzo = null; cb.onAzione("punta", R.tot, rif); });
    ui.azioni.appendChild(etichetta);
    ui.azioni.appendChild(cursore);
    ui.azioni.appendChild(el("div", { class: "pk-riga" }, [ scelta("Minimo", min), scelta("½ piatto", vm.daChiamare + dopoChiamata / 2), scelta("Piatto", vm.daChiamare + dopoChiamata), scelta("All-in", max) ]));
    ui.azioni.appendChild(el("div", { class: "pk-riga" }, [ el("button", { class: "pk-btn lascia", text: "Annulla", onclick: function () { ui.rialzo = null; ui.chiaveAz = ""; aggiorna(ui, ui.vm); } }), ok ]));
    mostra();
  }
  // la mini-guida delle combinazioni (tasto "?"): un esempio disegnato per ognuna
  var ESEMPI = { scalacolore: "9♥ 10♥ J♥ Q♥ K♥", poker: "9♠ 9♥ 9♦ 9♣ K♠", full: "Q♠ Q♥ Q♦ 8♣ 8♥", colore: "8♦ 9♦ J♦ Q♦ A♦", scala: "7♣ 8♦ 9♠ 10♥ J♣",
    tris: "8♠ 8♥ 8♦ K♣ 10♠", doppia: "J♠ J♦ 9♣ 9♥ A♠", coppia: "10♥ 10♣ K♠ 8♦ 7♣", alta: "A♠ J♦ 10♣ 9♥ 7♦" };
  function guida(ui) {
    if (ui.guida && ui.guida.parentNode) { ui.guida.parentNode.removeChild(ui.guida); ui.guida = null; return; }
    var el = ui.el, v = (ui.vm && ui.vm.variante) || "he";
    var righe = ORDINE[v].slice().reverse().map(function (tipo, k) {
      return el("div", { class: "pk-g-riga" }, [ el("b", { text: (k + 1) + ". " + NOMI_MANO[tipo] }),
        el("span", { class: "pk-g-carte" }, ESEMPI[tipo].split(" ").map(function (x) { return el("span", { class: "pk-cartina" + (/[♥♦]/.test(x) ? " rossa" : ""), text: x }); })) ]);
    });
    var nota = v === "it" ? "All'italiana il colore batte il full; a parità vince il seme più forte: cuori, quadri, fiori, picche."
      : "Conta la combinazione migliore di 5 carte tra le tue 2 e le 5 in mezzo.";
    ui.guida = el("div", { class: "pk-guida", onclick: function () { guida(ui); } }, [
      el("div", { class: "pk-g-foglio" }, [ el("div", { class: "pk-g-titolo", text: "Le combinazioni, dalla più forte" }) ].concat(righe).concat([ el("div", { class: "pk-g-nota", text: nota + " Tocca per chiudere." }) ])) ]);
    ui.scena.appendChild(ui.guida);
  }
  function finale(t, vm, cb) {
    var s = t.schermata({ icona: "🏆", titolo: "Classifica del tavolo", sotto: "Fiches guadagnate o perse" });
    var ol = t.el("ol", { class: "classifica" + ((vm.classifica || []).length > 4 ? " fitta" : "") }), med = ["🥇", "🥈", "🥉"];   // (fitta: righe basse su due colonne, così fino a 10 giocatori sta nello schermo)
    (vm.classifica || []).forEach(function (r) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[r.pos - 1] || (r.pos + "°") }),
        t.el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        t.el("span", { class: "punti", text: (r.punti > 0 ? "+" : "") + fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    var fac = t.faccine && t.faccine(); if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }   // le faccine anche sulla classifica
    // i tasti di fine uguali per tutti (Rivincita, Cambia gioco, Ci sto…) li mette il core; se no quelli di sempre
    if (!(t.tastiFine && t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci }))) {
      if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(cb._notaFine = t.el("p", { class: "modulo-nota", style: "text-align:center", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
    return s;
  }
  function senzaFiches(t, riprova) {
    var s = t.schermata({ icona: "🪙", titolo: "Ti servono delle monete", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Il Poker si gioca con le tue Speed Coins e adesso non ne hai abbastanza. Gira la ruota del giorno (monete o XP), poi siediti al tavolo." }));
    if (BJ() && BJ().riquadroBonus) s._contenuto.appendChild(BJ().riquadroBonus(t.el, function () {}));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🃏 Siediti al tavolo", onclick: riprova }));
    t.mostra(s);
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Il poker online funziona quando l'app è aperta dal sito pubblicato. Intanto puoi giocare contro i Bot." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.pk-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#0b1912}",
      ".schermata.pk-piena>.testa,.schermata.pk-piena>.piede{display:none}",
      ".schermata.pk-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".pk-scena{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;padding:calc(6px + env(safe-area-inset-top)) 8px calc(8px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none;color:#fff;background:radial-gradient(120% 80% at 50% 40%,#1d3b2c,#0b1912)}",
      ".pk-barra{display:flex;align-items:center;gap:8px;min-height:36px;flex:none}",
      ".pk-tastino{width:36px;height:36px;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.1rem;font-weight:900;cursor:pointer;flex:none}",
      ".pk-info{flex:1;min-width:0;font-size:.78rem;font-weight:800;opacity:.85;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".pk-tavolo{position:relative;flex:1 1 auto;min-height:0}",
      ".pk-feltro{position:absolute;left:3%;right:3%;top:5%;bottom:5%;border-radius:50%;background:radial-gradient(ellipse at 50% 40%,#2e8b57,#1b5e3a 70%,#14472c);box-shadow:inset 0 0 0 6px #6b3e1f,inset 0 0 0 9px #3d220f,0 10px 24px rgba(0,0,0,.5)}",
      ".pk-centro{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:52%;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}",
      ".pk-comuni{display:flex;gap:3px;justify-content:center}",
      ".pk-cs{width:34px;height:48px;flex:none;border-radius:5px;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;box-shadow:0 2px 4px rgba(0,0,0,.4);animation:pkArriva .25s ease-out}",
      ".pk-cs b{font-size:1rem;font-weight:900}.pk-cs i{font-style:normal;font-size:1.05rem}.pk-cs.rossa{color:#d21c24}",
      ".pk-cs.grande{width:64px;height:90px}.pk-cs.grande b{font-size:1.7rem}.pk-cs.grande i{font-size:1.8rem}",
      "@keyframes pkArriva{from{opacity:0;transform:translateY(-8px) scale(.9)}to{opacity:1;transform:none}}",
      ".pk-slot{width:34px;height:48px;flex:none;border-radius:5px;border:1.5px dashed rgba(255,255,255,.2)}",
      ".pk-piatto{font-weight:900;font-size:.95rem;color:#ffe066;min-height:1.2em}",
      ".pk-msg{font-size:.78rem;font-weight:800;min-height:1.1em;line-height:1.25}",
      ".pk-posto{position:absolute;transform:translate(-50%,-50%);width:76px;display:flex;flex-direction:column;align-items:center;text-align:center;transition:opacity .2s}",
      ".pk-av-box{position:relative;width:44px;height:44px}",
      ".pk-av{width:44px;height:44px;border-radius:50%;overflow:hidden;background:#24443a;box-shadow:0 0 0 2px rgba(255,255,255,.25)}",
      ".pk-av svg{width:100%;height:100%;display:block}",
      ".pk-posto.turno .pk-av{box-shadow:0 0 0 3px #ffe066,0 0 14px #ffe066}",
      ".pk-posto.fuori{opacity:.45}.pk-posto.vince{opacity:1}",
      ".pk-posto.vince .pk-av{box-shadow:0 0 0 3px #69db7c,0 0 14px #69db7c}",
      ".pk-d{position:absolute;left:-6px;top:-4px;width:18px;height:18px;border-radius:50%;background:#fff;color:#111;font-size:.62rem;font-weight:900;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 3px rgba(0,0,0,.5)}",
      ".pk-dorsi{display:flex;justify-content:center;min-height:10px;margin-top:-8px;position:relative}",
      ".pk-dorso{width:12px;height:17px;border-radius:2px;background:linear-gradient(135deg,#c92a2a,#7a1414);border:1px solid #fff;margin-left:-5px;box-shadow:0 1px 2px rgba(0,0,0,.4)}",
      ".pk-dorsi.scoperte{flex-wrap:wrap;gap:2px;margin-top:2px}",
      ".pk-cartina{background:#fff;color:#111;border-radius:3px;padding:0 2px;font-size:.66rem;font-weight:900;line-height:1.3}.pk-cartina.rossa{color:#d21c24}",
      ".pk-nome{font-size:.68rem;font-weight:800;max-width:76px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:1px}",
      ".pk-stack{font-size:.66rem;font-weight:800;color:#ffe066}",
      ".pk-az{font-size:.64rem;font-weight:800;min-height:1.1em;white-space:nowrap}.pk-az.punta{color:#ffd8a8}.pk-az.punta:before{content:\"\";display:inline-block;width:8px;height:8px;border-radius:50%;background:#e67700;border:2px dotted #fff;margin-right:3px;vertical-align:-1px}.pk-az.vinto{color:#69db7c;font-size:.76rem}",
      ".pk-io{flex:none;display:flex;flex-direction:column;gap:6px;padding-top:4px}",
      ".pk-mio-info{display:flex;justify-content:space-between;align-items:center;font-size:.8rem;font-weight:800;gap:8px;min-height:1.2em}",
      ".pk-mano-nome{color:#69db7c}",
      ".pk-mie{display:flex;justify-content:center;gap:6px;min-height:90px;align-items:flex-end}",
      ".pk-mie.lascia{opacity:.4}",
      ".pk-carta{width:64px;flex:none;filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));transition:transform .15s,opacity .15s}",
      ".pk-carta svg{display:block;width:100%;height:auto}",
      ".pk-mie.cinque .pk-carta,.pk-mie.cinque .pk-cs.grande{width:58px}",
      ".pk-mie .tocca{cursor:pointer}.pk-mie .via{transform:translateY(-12px);opacity:.5}",
      ".pk-azioni{display:flex;flex-direction:column;gap:6px;min-height:52px;justify-content:flex-end}",
      ".pk-riga{display:flex;gap:6px}",
      ".pk-btn{flex:1;min-height:46px;border:0;border-radius:14px;font:inherit;font-weight:900;font-size:.95rem;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
      ".pk-btn.lascia{background:#495057}.pk-btn.passa{background:#1c7ed6}.pk-btn.punta{background:#e67700}.pk-btn.ok{background:#2f9e44}",
      ".pk-btn.piccolo{min-height:34px;font-size:.78rem;background:rgba(255,255,255,.14)}",
      ".pk-slider{width:100%;accent-color:#e67700;margin:0}",
      ".pk-stato{text-align:center;font-size:.9rem;font-weight:800;opacity:.85;padding:6px 0}",
      ".pk-rialzo-tot{opacity:1;color:#ffd8a8;padding:0}",
      ".pk-fiches{display:flex;flex-direction:column;gap:8px;align-items:stretch;text-align:center;font-weight:800}",
      ".pk-bot-riga{display:flex;align-items:center;gap:8px;justify-content:center;font-weight:800}",
      // il tempo per decidere
      ".pk-tempo{height:4px;border-radius:2px;background:rgba(255,255,255,.12);overflow:hidden;visibility:hidden;flex:none}.pk-tempo i{display:block;height:100%;background:#ffe066;transform-origin:left center;transform:scaleX(1)}",
      ".pk-tempo.piccolo{position:absolute;left:3px;right:3px;bottom:-6px;height:3px;z-index:1}",
      // la nuvoletta con l'ultima mossa
      ".pk-nuv{position:absolute;left:50%;bottom:100%;margin-bottom:4px;transform:translate(-50%,4px) scale(.9);opacity:0;pointer-events:none;z-index:4;background:#fff;color:#111;border-radius:10px;padding:3px 7px;font-size:.68rem;font-weight:900;line-height:1.2;white-space:nowrap;text-align:center;box-shadow:0 2px 6px rgba(0,0,0,.45)}",
      ".pk-nuv small{display:block;font-size:.62rem;font-weight:700;font-style:italic;opacity:.8;max-width:130px;white-space:normal}",
      ".pk-nuv.passa{background:#d0ebff}.pk-nuv.chiama{background:#d3f9d8}.pk-nuv.punta{background:#ffe8cc}.pk-nuv.lascia{background:#dee2e6;color:#495057}.pk-nuv.cambia{background:#e5dbff}",
      ".pk-nuv.su{animation:pkNuv 1.8s ease-out forwards}.pk-nuv.su.lunga{animation-duration:2.8s}",
      "@keyframes pkNuv{0%{opacity:0;transform:translate(-50%,4px) scale(.9)}10%{opacity:1;transform:translate(-50%,0) scale(1)}80%{opacity:1;transform:translate(-50%,0) scale(1)}100%{opacity:0;transform:translate(-50%,-4px) scale(1)}}",
      // le carte che hanno vinto
      ".pk-cs.conta{transform:translateY(-4px);box-shadow:0 0 0 2px #ffe066,0 4px 10px rgba(0,0,0,.5)}.pk-cs.spenta{opacity:.4}",
      ".pk-mie .conta{transform:translateY(-8px)}.pk-cartina.conta{box-shadow:0 0 0 2px #ffe066}",
      // le fiches che volano dal piatto
      ".pk-volo{position:absolute;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;background:#e67700;border:3px dotted #fff;box-sizing:border-box;z-index:6;pointer-events:none;transition:transform .75s cubic-bezier(.3,.7,.3,1),opacity .75s ease-in}",
      // con tanti giocatori i posti si fanno più piccoli
      ".pk-tavolo:not(.stretto) .pk-centro{top:57%}",
      ".pk-tavolo.stretto .pk-posto{width:62px}.pk-tavolo.stretto .pk-av-box,.pk-tavolo.stretto .pk-av{width:34px;height:34px}",
      ".pk-tavolo.stretto .pk-nome{font-size:.6rem;max-width:62px}.pk-tavolo.stretto .pk-stack,.pk-tavolo.stretto .pk-az{font-size:.58rem}.pk-tavolo.stretto .pk-dorso{width:10px;height:14px}",
      // la mini-guida delle combinazioni
      ".pk-guida{position:absolute;inset:0;z-index:8;background:rgba(0,0,0,.72);display:flex;align-items:center;justify-content:center;padding:12px}",
      ".pk-g-foglio{width:100%;max-width:380px;background:#14301f;border:2px solid #6b3e1f;border-radius:16px;padding:12px;display:flex;flex-direction:column;gap:5px}",
      ".pk-g-titolo{font-weight:900;text-align:center;margin-bottom:2px}.pk-g-riga{display:flex;justify-content:space-between;align-items:center;gap:6px;font-size:.78rem}",
      ".pk-g-carte{display:flex;gap:2px}.pk-g-carte .pk-cartina{font-size:.72rem}.pk-g-nota{font-size:.72rem;opacity:.8;text-align:center;margin-top:4px;line-height:1.3}"
    ].join("");
    document.head.appendChild(st);
  }
  function variante(v) { return v === "it" ? "it" : "he"; }

  SG.registra({
    id: ID, nome: "Poker", icona: "♠️",
    descrizione: "Texas Hold'em o Poker all'italiana con le carte francesi, contro i Bot o online. Si gioca con le tue Speed Coins.",
    giocatoriMin: 1, giocatoriMax: 1, difficolta: 3, etichettaGiocatori: "👥 2–10 giocatori",
    postiOnline: 10,   // posti online (all'italiana il tavolo ne fa sedere 6: la regola resta del gioco)
    // le regole in una riga, per la saletta: "Texas Hold'em · fino a 10 al tavolo · Bot medi"
    riassunto: function (imp) {
      imp = imp || {};
      var liv = { facile: "Bot facili", medio: "Bot medi", difficile: "Bot difficili" }[imp.difficolta] || "Bot medi";
      return NOME_VAR[variante(imp.variante)] + " · fino a " + MAX[variante(imp.variante)] + " al tavolo · " + liv;
    },
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro i Bot", sotto: "Tu e i Bot al tavolo" }],
    regole: [
      "<b>Texas Hold'em</b>: hai 2 carte tue e ne escono 5 in mezzo per tutti (3, poi 1, poi 1). Vince la migliore combinazione di 5 carte.",
      "Prima di ogni mano due giocatori mettono i <b>bui</b> (" + PICCOLO + " e " + GRANDE + "). Quando tocca a te: <b>Passa</b>, <b>Chiama</b>, <b>Punta/Rilancia</b> o <b>Lascia</b>.",
      "<b>Poker all'italiana</b>: tutti mettono l'invito (" + INVITO + "), hai 5 carte, si punta, poi ognuno <b>cambia</b> fino a 4 carte e si punta di nuovo. Il mazzo è corto (in 4 si gioca dal 7 in su), il <b>colore batte il full</b> e a parità decide il seme: cuori, quadri, fiori, picche.",
      "Dalla più bassa: carta alta, coppia, doppia coppia, tris, scala, colore, full, poker, scala colore (all'italiana colore e full si scambiano).",
      "Si gioca con le tue <b>Speed Coins</b>: ti siedi con al massimo " + fmtN(BUYIN) + " e quello che vinci o perdi resta nelle tue monete."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.variante = "he"; dove.avversari = 3; dove.difficolta = "medio";
      box.appendChild(el("div", { class: "etichetta", text: "Che poker?" }));
      var bHe, bIt;
      function selV(v) {
        dove.variante = v; dove.avversari = Math.min(dove.avversari, MAX[v] - 1);
        bHe.className = "modo-chip" + (v === "he" ? " attiva" : ""); bIt.className = "modo-chip" + (v === "it" ? " attiva" : "");
        if (contaAvv) contaAvv.textContent = dove.avversari;
      }
      bHe = el("button", { class: "modo-chip attiva", onclick: function () { selV("he"); } }, [ el("span", { class: "mi", text: "🤠" }), el("div", {}, [ el("div", { class: "mt", text: "Texas Hold'em" }), el("div", { class: "ms", text: "2 carte tue + 5 in mezzo" }) ]) ]);
      bIt = el("button", { class: "modo-chip", onclick: function () { selV("it"); } }, [ el("span", { class: "mi", text: "🇮🇹" }), el("div", {}, [ el("div", { class: "mt", text: "All'italiana" }), el("div", { class: "ms", text: "5 carte, poi le cambi" }) ]) ]);
      box.appendChild(el("div", { class: "modo-griglia", style: "grid-template-columns:1fr 1fr" }, [bHe, bIt]));
      var contaAvv = null;
      if (aiuti.modo !== "online") {   // contro il computer: quanti bot al tavolo
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Quanti avversari" }));
        contaAvv = el("b", { text: String(dove.avversari), style: "min-width:2em;text-align:center;font-size:1.2rem" });
        box.appendChild(el("div", { style: "display:flex;align-items:center;gap:10px" }, [
          el("button", { class: "modo-chip", style: "flex:1;justify-content:center", onclick: function () { dove.avversari = Math.max(1, dove.avversari - 1); contaAvv.textContent = dove.avversari; } }, [ el("div", { class: "mt", text: "−" }) ]),
          contaAvv,
          el("button", { class: "modo-chip", style: "flex:1;justify-content:center", onclick: function () { dove.avversari = Math.min(MAX[dove.variante] - 1, dove.avversari + 1); contaAvv.textContent = dove.avversari; } }, [ el("div", { class: "mt", text: "+" }) ]) ]));
      }
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei Bot" }));
      var dg = el("div", { style: "display:flex;gap:8px" });
      [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
        var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
          dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [ el("div", { class: "mt", text: d[1] }) ]);
        b.style.flex = "1"; dg.appendChild(b);
      });
      box.appendChild(dg);
      if (conProfilo() && BJ() && BJ().riquadroBonus) { var f = BJ().riquadroBonus(el); f.style.marginTop = "12px"; box.appendChild(f); }
      box.appendChild(el("p", { class: "modulo-nota", style: "margin-top:8px", text: "Si gioca con le tue Speed Coins: ti siedi con al massimo " + fmtN(BUYIN) + " e quello che vinci o perdi resta nelle tue monete." }));
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return partita(t, (t.impostazioni || {}).modo === "online");
    }
  });

  // per le prove (motore e punti), senza toccare la partita
  window.__POKER = { creaMotore: creaMotore, valuta5: valuta5, miglioreMano: miglioreMano, confronta: confronta, equita: equita, cambioBot: cambioBot, decidiBot: decidiBot };
})();

/* =========================================================
   PAROLA D'ORDINE — il gioco delle spie a parole, ognuno dal suo telefono.
   2 o 3 squadre (o in 2-3 contro il Bot), 25 parole sul tabellone. Il capo di ogni squadra vede di chi è ogni parola
   (e qual è la parola NERA) e dà un indizio di una parola sola più un numero.
   La squadra propone (sulla parola compare l'avatar di chi la propone) e la gira.
   Vince la squadra che gira per prima tutte le sue parole; chi gira la parola nera perde
   (a 3 squadre esce, e le altre due continuano).
   Online l'host tiene la partita: la "chiave" (di chi è ogni parola) va SOLO ai capi.
   Chi esce e rientra torna nella sua squadra; chi arriva a metà entra nella squadra più piccola.
   Le parole stanno in data/ordine-parole.js (window.SG_ORDINE_PAROLE).
   Partito dal modello .agents/skills/nuovo-gioco/modello-gioco-online.js
   ========================================================= */
(function () {
  "use strict";

  var ID = "ordine";
  var MIN = 4, MAX = 12;
  var BOT_ID = "botsq";   // 🤖 il Bot dei Blu nella partita «contro il Bot»
  var SQ = [
    { nome: "Rossi", em: "🔴", col: "#e03131", chiaro: "#ffe3e3" },
    { nome: "Blu", em: "🔵", col: "#1c7ed6", chiaro: "#d0ebff" },
    { nome: "Verdi", em: "🟢", col: "#2f9e44", chiaro: "#d3f9d8" }
  ];
  // quante parole per squadra: chi comincia ne ha una in più
  // (25 = il classico 5x5; 20 = 5x4: caselle più grandi e partite più corte)
  var DIVISIONE = {
    25: { 2: { sq: [9, 8], neutre: 7 }, 3: { sq: [7, 6, 6], neutre: 5 } },
    20: { 2: { sq: [8, 7], neutre: 4 }, 3: { sq: [6, 5, 5], neutre: 3 } }
  };
  // quante parole del gruppo finiscono in un tabellone: 5, 10, metà o tutte (il resto dal mazzo)
  function quanteDa(x) { return x === "meta" || x === "tutte" ? x : +x === 10 ? 10 : 5; }
  function nomeQuante(q) { return q === "meta" ? "metà tabellone" : q === "tutte" ? "tutte" : q + " per tabellone"; }
  function quanteN(q, tot) { return q === "meta" ? Math.floor(tot / 2) : q === "tutte" ? tot : Math.min(tot, q); }
  var MAX_AMICO = 30;   // le parole che ogni amico porta da casa (dal suo profilo) quando entra
  function ritmoDa(x) { return x === "veloce" ? "veloce" : "show"; }
  function tempoIndDa(x) { x = +x; return x === 60 || x === 120 ? x : 0; }   // ⏳ secondi per indovinare (0 = senza tempo)
  function testoSec(s) { return s === 120 ? "2 minuti" : s === 60 ? "1 minuto" : s + " secondi"; }
  // gli indizi dei bot della prova da solo (a caso: servono solo a far vedere come va il gioco)
  var PAROLE_BOT = ("CALDO FREDDO GRANDE PICCOLO VELOCE LENTO ANTICO MODERNO DOLCE AMARO GIALLO VERDE AZZURRO BIANCO MORBIDO DURO " +
    "RUMOROSO LUMINOSO BAGNATO SECCO PERICOLOSO ITALIANO ESTIVO MAGICO PICCANTE ROTONDO ALTO PESANTE LEGGERO FAMOSO").split(" ");
  var RISERVA = ("RETE PIANTA CARTA LINGUA SPINA BANCO CAMPO CHIAVE PESCA POSTA TAVOLA BOTTONE STELLA PONTE CORONA " +
    "SOLE LUNA MARE NAVE TRENO AEREO RUOTA PALLA CANE GATTO LEONE TOPO RAGNO PIPISTRELLO ORSO BALENA " +
    "PIZZA PANE LATTE MELA LIMONE TORTA GELATO CAFFÈ VINO SALE ROMA NAPOLI VENEZIA EGITTO MARTE " +
    "MEDICO CUOCO PIRATA FANTASMA DRAGO ROBOT CAVALIERE RE REGINA PRINCIPE CASTELLO TORRE PIRAMIDE " +
    "SCUOLA OSPEDALE BANCA CINEMA TEATRO STADIO PORTA FINESTRA LETTO SPECCHIO OROLOGIO TELEFONO " +
    "COMPUTER LIBRO PENNA MATITA COLLA FORBICI ANELLO SCARPA CAPPELLO GUANTO OMBRELLO NEVE FUOCO " +
    "VENTO TUONO ISOLA MONTAGNA FIUME DESERTO BOSCO RADICE FOGLIA FIORE ROSA ERBA SEME OSSO CUORE " +
    "MANO OCCHIO DENTE NASO TESTA PIEDE BRACCIO SPADA ARCO FRECCIA SCUDO BOMBA MINA RAZZO MOTORE").split(" ");

  // i mazzi a tema (data/ordine-parole.js, window.SG_ORDINE_MAZZI): si scelgono nelle regole
  var MAZZI = [["classico", "Classico"], ["cinema", "🎬 Film e TV"], ["sport", "⚽ Sport"], ["fanta", "⚽ Serie A e Fanta"], ["napoli", "🌋 Napoli"], ["anni90", "📼 Anni 80-90"], ["serata", "🌶️ Serata"]];
  function nomeMazzo(id) { for (var i = 0; i < MAZZI.length; i++) if (MAZZI[i][0] === id) return MAZZI[i][1]; return "Classico"; }
  function tempoDa(x) { x = +x; return x === 60 || x === 90 || x === 120 ? x : 0; }   // ⏳ secondi per l'indizio (0 = senza tempo)
  function mmss(ms) { var s = Math.max(0, Math.ceil(ms / 1000)); return Math.floor(s / 60) + ":" + ("0" + (s % 60)).slice(-2); }
  var PARTITE_SALVATE = {};
  function salvaProgressiOrdine(idPartita, giocatoreId, progressi, players, spettatore) {
    try {
      if (spettatore || !progressi || !giocatoreId || !window.SGNube || !SGNube.disponibile || !SGNube.disponibile() || !SGNube.profilo || !SGNube.salvaProgressi) return;
      var profilo = SGNube.profilo(), nome = String((profilo && profilo.nome) || "").trim();
      var player = (players || []).filter(function (p) { return p.id === giocatoreId; })[0];
      if (!player || !nome || nome.toLowerCase() !== String(player.nome || "").trim().toLowerCase()) return;
      var idProfilo = String((profilo && profilo.uid) || nome).trim().toLowerCase();
      var chiave = "ordine|" + idPartita + "|" + idProfilo;
      if (PARTITE_SALVATE[chiave]) return;
      try { if (window.localStorage && localStorage.getItem("sg-progressi-" + chiave)) { PARTITE_SALVATE[chiave] = 1; return; } } catch (e) {}
      var x = progressi[giocatoreId] || {}, incrs = [];
      ["partite", "partiteOnline", "vittorie", "vittorieCapo", "indizi", "paroleGiuste", "paroleOro"].forEach(function (k) {
        if (+x[k] > 0) incrs.push([k, +x[k]]);
      });
      if (!incrs.length) return;
      PARTITE_SALVATE[chiave] = 1;
      try { if (window.localStorage) localStorage.setItem("sg-progressi-" + chiave, "1"); } catch (e) {}
      SGNube.salvaProgressi(null, ID, incrs, [], []);
    } catch (e) {}
  }
  // 🔁 niente parole ripetute nella serata: il telefono di chi tiene la partita ricorda le parole uscite nelle ultime 24 ore
  // e le rimette solo quando il mazzo è quasi finito (meno di un tabellone di parole mai uscite: quel mazzo ricomincia da capo)
  var USCITE = "sg-ordine-uscite", GIORNO = 24 * 3600 * 1000;
  function leggiUscite() {
    var u = {}; try { u = JSON.parse(localStorage.getItem(USCITE) || "{}") || {}; } catch (e) { u = {}; }
    var ora = Date.now(); Object.keys(u).forEach(function (k) { if (!(ora - u[k] < GIORNO)) delete u[k]; });
    return u;
  }
  function salvaUscite(u) {
    try {
      var k = Object.keys(u);
      if (k.length > 2000) k.sort(function (a, b) { return u[a] - u[b]; }).slice(0, k.length - 2000).forEach(function (x) { delete u[x]; });
      localStorage.setItem(USCITE, JSON.stringify(u));
    } catch (e) {}
  }
  function primaLeNuove(lista, u, quante) {   // prima quelle mai uscite (a caso), poi le altre
    var nuove = [], viste = [];
    lista.forEach(function (w) { (u[norm(w)] ? viste : nuove).push(w); });
    if (nuove.length < quante) { viste.forEach(function (w) { delete u[norm(w)]; }); return mescola(lista); }
    return mescola(nuove).concat(mescola(viste));
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function mescola(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  var ACC = { "À": "A", "Á": "A", "È": "E", "É": "E", "Ì": "I", "Í": "I", "Ò": "O", "Ó": "O", "Ù": "U", "Ú": "U" };
  function norm(w) { return String(w || "").toUpperCase().split("").map(function (c) { return ACC[c] || c; }).join("").replace(/[^A-Z]/g, ""); }
  // la radice: GATTO/GATTI, MANO/MANI, OCA/OCHE, OCCHIO/OCCHI, LAGO/LAGHI hanno la stessa
  function radice(w) {
    var n = norm(w); if (n.length < 3) return n;
    var r = n.replace(/[AEIOU]$/, "");
    if (r.length >= 4 && /I$/.test(r)) r = r.slice(0, -1);   // OCCHIO → OCCHI → OCCH
    return r.replace(/([CG])H$/, "$1");                        // OCHE → OCH → OC
  }
  function elenco() { var f = window.SG_ORDINE_PAROLE; return f && f.length >= 60 ? f : RISERVA; }
  function mazzo(id) { var m = window.SG_ORDINE_MAZZI && window.SG_ORDINE_MAZZI[id]; return id !== "classico" && m && m.length >= 40 ? m : null; }
  // le parole del gruppo: lettere (anche accentate), apostrofo e al massimo uno spazio in mezzo ("ZIO GINO"); fino a 12 caratteri
  var MAX_LISTA = 150;
  function pulisciParola(w) {
    w = String(w || "").trim().replace(/\s+/g, " ").toUpperCase();
    if (!w || w.length > 12 || !/^[A-ZÀÈÉÌÒÙ']+( [A-ZÀÈÉÌÒÙ']+)?$/.test(w) || norm(w).length < 2) return "";
    return w;
  }
  // la lista salvata (array) o un testo scritto di fila: "Peppe, Ibiza, Kebab"
  function leggiGruppo(x) {
    var visti = {}, out = [];
    (Array.isArray(x) ? x : String(x || "").split(/[,;\n]+/)).forEach(function (w) {
      w = pulisciParola(w); if (!w || visti[norm(w)]) return;
      visti[norm(w)] = 1; out.push(w);
    });
    return out.slice(0, MAX_LISTA);
  }
  // un indizio è buono se è UNA parola e non è (quasi) una parola ancora coperta sul tabellone
  function erroreIndizio(parola, tab) {
    var p = String(parola || "").trim();
    if (!p) return "Scrivi l'indizio.";
    if (/\s/.test(p)) return "Una parola sola, senza spazi.";
    if (!/^[A-Za-zÀ-ÖØ-öø-ÿ]+$/.test(p)) return "Solo lettere, niente numeri o simboli.";
    if (p.length < 2) return "Troppo corto.";
    var n = norm(p), r = radice(p), err = "";
    // MARE → MAREA, GATTO → GATTINO: la parola corta all'inizio di quella lunga (CORSO con ORSO invece va bene)
    function simile(a, b) {
      var corta = a.length <= b.length ? a : b, lunga = a.length <= b.length ? b : a;
      if (corta.length >= 4 && lunga.indexOf(corta) === 0) return true;
      var rc = radice(corta);
      return rc.length >= 4 && lunga.length - corta.length >= 2 && lunga.indexOf(rc) === 0 && lunga.length - rc.length <= 4;
    }
    (tab || []).forEach(function (c) {
      if (err || c.g) return;
      var m = norm(c.w);
      // le parole con lo spazio o l'apostrofo ("ZIO GINO"): vale anche ogni pezzo
      var pezzi = [m].concat(String(c.w).split(/[\s']+/).map(norm).filter(function (x) { return x.length >= 2 && x !== m; }));
      pezzi.forEach(function (x) {
        if (err) return;
        if (x === n || radice(x) === r) err = "«" + c.w + "» è sul tabellone: non vale!";
        else if (simile(x, n)) err = "Assomiglia troppo a «" + c.w + "», che è sul tabellone.";
      });
    });
    return err;
  }

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  // LA PARTITA NON SI PERDE (Passo 5, lo fa il core: riprende + riserva in SG.registra). L'host ricorda la partita a ogni
  // foto (t.ricorda, senza gli avatar e con la chiave del tabellone, che resta sul suo telefono e su quello dei vice):
  // - se gli si ricarica la pagina o si chiude l'app, riaprendo la partita riprende da lui, stesso tabellone (t.ripresa);
  // - se sparisce del tutto, dopo pochi secondi un amico (vice) la porta avanti dal suo telefono con la stessa copia
  //   (t.ripresa.daRiserva, t.mioId = il suo id); quando l'host torna rientra come giocatore, nella sua squadra.
  function host(t) {
    var imp = t.impostazioni || {};
    var prova = imp.modo === "prova";   // 🧪 prova da solo (solo per il proprietario): tu e un bot contro due bot, senza rete
    if (!prova && !(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var IO = t.mioId || "host";   // il mio id nella partita ("host", o l'amico che ha preso il posto dell'host)
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    // la partita di prima (solo a tabellone aperto o sulla classifica: in saletta si riparte dalla saletta)
    var R0 = !prova && t.ripresa && t.ripresa.stato;
    var ripresa = !!(R0 && Array.isArray(R0.players) && R0.tab && (R0.fase === "gioco" || R0.fase === "fine"));
    var attesi = {}, tAttesi = null;   // dopo la ripresa: gli amici che devono ancora rientrare (rientrano da soli col loro "join")
    var H = ripresa ? (function (r) {
      var h = JSON.parse(JSON.stringify(r)), ora = t.ripresa.ora, vecchio = t.ripresa.daRiserva ? t.ripresa.vecchioHost : null, adesso = Date.now();
      h.codice = "…"; h.pronta = false; h.hostId = IO; h.msg = "";
      h.progressi = h.progressi || {}; h.prossimi = h.prossimi || []; h.salta = h.salta || {}; h.nTurni = h.nTurni || 0; h.guarda = h.guarda || [];
      h.prop = h.prop || {}; h.storia = h.storia || []; h.fuori = h.fuori || []; h.capo = h.capo || [null, null, null];
      h.players.forEach(function (p) {
        if (p.id === IO) { p.via = false; p.omino = t.mioOmino(p.nome); }
        else if (p.id === vecchio) { p.via = true; delete h.prop[p.id]; }   // l'host di prima è sparito: se torna, rientra come giocatore
        else if (!p.via && !p.bot) attesi[p.id] = 1;
      });
      // le scadenze erano ore dell'host di prima: nell'orologio di questo telefono, e almeno 10 secondi di respiro
      if (h.attesa && h.attesa.fino) h.attesa.fino = Math.max(ora(h.attesa.fino), adesso + 10000);
      if (h.cless && h.cless.fino) h.cless.fino = Math.max(ora(h.cless.fino), adesso + 10000);
      if (h.rivedi && h.rivedi.fino) h.rivedi.fino = Math.max(ora(h.rivedi.fino), adesso + 10000);   // 🤔 «Cosa intendevi?» a fine partita
      h.ind = h.ind || [];   // 🤔 gli indizi con le parole pensate dai capi (sono nella partita ricordata: non si perdono)
      h.serie = h.serie || { v: [0, 0, 0], n: 0 }; h.ritmo = ritmoDa(h.ritmo); h.tempoInd = tempoIndDa(h.tempoInd); h.quante = quanteDa(h.quante);
      return h;
    })(R0) : { fase: "lobby", codice: "…", pronta: false, nsq: +imp.squadre === 3 ? 3 : 2, vsBot: imp.squadre === "bot", nparole: +imp.parole === 20 ? 20 : 25,
      usaMie: imp.usaMie !== false, gruppoNome: nomeHost, gruppo: imp.usaMie === false ? [] : leggiGruppo(imp.gruppo), quante: quanteDa(imp.quante), oro: imp.oro !== false, tempo: tempoDa(imp.tempo), mazzo: imp.mazzo || "classico",
      ritmo: ritmoDa(imp.ritmo), tempoInd: tempoIndDa(imp.tempoInd),   // 🎬/⚡ il ritmo, ⏳ il tempo per indovinare
      serie: { v: [0, 0, 0], n: 0 }, rivModo: "capo", regSquadre: String(imp.squadre || 2),   // 🏆 la serata a squadre («Rossi 2 – 1 Blu») e come si rifanno le squadre alla rivincita
      intendi: imp.intendi !== false, ind: [], cosa: null, rivedi: null,   // 🤔 «Cosa intendevi?»
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), team: 0 }], capo: [null, null, null],
      tab: null, bid: 0, turno: 0, passo: "indizio", indizio: null, tentativi: 0, girate: 0, prop: {}, storia: [], fuori: [],
      vince: -1, classifica: null, msg: "", ultima: null, nGirate: 0, hostId: IO, progressi: {}, prossimi: [], salta: {}, nTurni: 0,
      guarda: [] };   // guarda: nella Sala, chi non è stato scelto per giocare (guarda soltanto, col suo id nella foto)
    if (prova) {   // i bot fissi del gruppo (SG.bot): il primo in squadra con te, gli altri due nell'altra. Giocano a caso: livello facile
      H.vsBot = false;
      H.nsq = 2;
      var cast = window.SG && SG.bot ? SG.bot.prendi(3, { livello: "facile", escludi: [nomeHost] }) : [];
      ["bot1", "bot2", "bot3"].forEach(function (id, i) {
        var b = cast[i] || { nome: "Bot " + (i + 1), omino: window.SGOmino ? SGOmino.casuale("Bot " + (i + 1)) : null };
        H.players.push({ id: id, nome: b.nome, team: i ? 1 : 0, bot: true, omino: avatarValido(b.omino) });
      });
      H.capo = [imp.capoIo === false ? "bot1" : IO, "bot2", null];
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function membri(k) { return H.players.filter(function (p) { return p.team === k && !p.via; }); }
    function piuPiccola() { if (H.vsBot) return 0; var best = 0, n = 1e9; for (var k = 0; k < H.nsq; k++) { var m = membri(k).length; if (m < n) { n = m; best = k; } } return best; }
    function capoVivo(k) { var c = pById(H.capo[k]); return !!(c && !c.via && c.team === k); }
    // ogni squadra ha un capo: se manca (o ha cambiato squadra) lo diventa il primo della squadra
    function sistemaCapi() {
      for (var k = 0; k < 3; k++) {
        if (k >= H.nsq) { H.capo[k] = null; continue; }
        if (H.vsBot && k === 1) { H.capo[1] = BOT_ID; continue; }   // 🤖 contro il Bot: i Blu sono lui
        var c = pById(H.capo[k]);
        if (!c || c.team !== k || (H.fase === "lobby" && c.via)) { var m = membri(k); H.capo[k] = m.length ? m[0].id : null; }
      }
    }
    function resto(k) { var n = 0; (H.tab || []).forEach(function (c) { if (c.c === k && !c.g) n++; }); return n; }
    // la "chat" della partita: gli indizi dei capi e le parole girate (con chi le ha girate); ogni voce ha il suo numero
    function scrivi(e) { H.log = H.log || []; H.logN = (H.logN || 0) + 1; e.n = H.logN; H.log.push(e); if (H.log.length > 60) H.log.shift(); }
    function vive() { var v = []; for (var k = 0; k < H.nsq; k++) if (H.fuori.indexOf(k) < 0) v.push(k); return v; }
    function omini() { var o = {}; H.players.forEach(function (p) { o[p.id] = p.omino || null; }); return o; }
    function umani() { return H.players.filter(function (p) { return !p.bot; }); }
    // 🤖 in 2-3 (o anche di più) contro il Bot: tutti nei Rossi, i Blu sono un Bot fisso del gruppo (sempre lo stesso: si riconosce).
    // Dopo ogni vostro turno il Bot scopre da solo una sua parola: dovete trovare le vostre prima che lui finisca le sue
    function mettiBot(si) {
      var era = !!H.vsBot;
      H.vsBot = !!si && !prova;
      H.players = H.players.filter(function (p) { return p.id !== BOT_ID; });
      if (H.vsBot) {
        H.nsq = 2;
        var b = (window.SG && SG.bot ? SG.bot.prendi(1, { escludi: H.players.map(function (p) { return p.nome; }) }) : [])[0] || { nome: "Bot", omino: null };
        H.players.forEach(function (p) { p.team = 0; });
        H.players.push({ id: BOT_ID, nome: b.nome, team: 1, bot: true, omino: avatarValido(b.omino) });
      } else if (era) {   // si torna alle squadre: metà e metà (il capo dei Rossi resta)
        var tutti = H.players.slice().sort(function (a, b) { return (b.id === H.capo[0]) - (a.id === H.capo[0]); });
        tutti.forEach(function (p, i) { p.team = i % H.nsq; });
        H.capo[1] = null;
      }
      if (era !== H.vsBot) azzeraSerie();
      sistemaCapi();
      if (t.impostazioni) t.impostazioni.squadre = H.vsBot ? "bot" : H.nsq;   // (così le regole della Sala lo sanno)
      if (H.codice !== "…") rete.inviaVeloce({ t: "omini", omini: omini() });
      bd();
    }
    // 🏆 la serata a squadre: quante partite ha vinto ogni colore («Rossi 2 – 1 Blu»). Riparte se cambiano le squadre
    function azzeraSerie() { H.serie = { v: [0, 0, 0], n: 0 }; }

    // 📝 le parole vostre: quelle dell'host (dalle regole) più quelle che ogni amico porta dal suo profilo quando entra, senza doppioni
    function poolGruppo() {
      var l = [], visti = {}, da = [];
      if (H.usaMie === false) return { l: l, da: da };
      function metti(lista, nome) {
        var n = 0;
        (lista || []).forEach(function (w) { var k = norm(w); if (!k || visti[k]) return; visti[k] = 1; l.push(w); n++; });
        if (n && nome && da.indexOf(nome) < 0) da.push(nome);
      }
      metti(H.gruppo, H.gruppoNome || nomeHost);
      H.players.forEach(function (p) { if (p.id !== IO && !p.via && !p.bot) metti(p.parole, p.nome); });
      return { l: l, da: da };
    }
    // "⚙️ Regole" nella saletta: squadre e parole del gruppo
    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      var nsq0 = H.nsq, bot0 = !!H.vsBot;
      H.nsq = +im.squadre === 3 ? 3 : 2; H.nparole = +im.parole === 20 ? 20 : 25; H.usaMie = im.usaMie !== false; H.gruppo = im.usaMie === false ? [] : leggiGruppo(im.gruppo); H.oro = im.oro !== false; H.tempo = tempoDa(im.tempo); H.mazzo = im.mazzo || "classico"; H.intendi = im.intendi !== false;
      H.quante = quanteDa(im.quante); H.ritmo = ritmoDa(im.ritmo); H.tempoInd = tempoIndDa(im.tempoInd);
      // «contro il Bot» cambia solo se nelle regole è cambiata la scelta delle squadre (il tasto 🤖 della saletta non si perde
      // quando l'host cambia un'altra regola)
      var sq = String(im.squadre), cambiata = sq !== String(H.regSquadre); H.regSquadre = sq;
      if (cambiata && (sq === "bot") !== bot0) return mettiBot(sq === "bot");
      if (!cambiata && bot0) { H.nsq = 2; sistemaCapi(); return bd(); }
      if (H.vsBot) { sistemaCapi(); return bd(); }
      if (H.nsq !== nsq0) azzeraSerie();   // squadre diverse: il conto della serata riparte
      H.players.forEach(function (p) { if (p.team >= H.nsq) p.team = -1; });
      H.players.forEach(function (p) { if (p.team < 0) p.team = piuPiccola(); });
      // passando a 3 squadre i Verdi sarebbero vuoti: ci vanno gli ultimi arrivati delle squadre più grandi (non i capi)
      for (var giri = 0; giri < MAX; giri++) {
        var k0 = piuPiccola(), grande = -1, n = 0;
        for (var k = 0; k < H.nsq; k++) if (membri(k).length > n) { n = membri(k).length; grande = k; }
        if (membri(k0).length >= 2 || n <= 2 || n - membri(k0).length < 2) break;
        var chi = membri(grande).filter(function (p) { return p.id !== H.capo[grande]; }).pop();
        if (!chi) break;
        chi.team = k0;
      }
      sistemaCapi(); bd();
    };

    var ripresaFatta = !ripresa, ceduto = false;
    var callbacks = {
      onCodice: function (c) { H.codice = c; if (SGNet.ricordaId) SGNet.ricordaId(c, IO); bd(); },   // se rientro come ospite, torno la stessa persona
      onConnesso: function () {
        H.pronta = true;
        if (!ripresaFatta) {   // la partita è appena ripresa: le chiavi ai capi, e chi non rientra entro 10 secondi è uscito
          ripresaFatta = true; mandaChiavi();
          if (H.sospeso) { clearTimeout(tSosp); tSosp = setTimeout(rivela, 1500); }   // c'era una parola in sospeso: la scopro io
          if (H.rivedi) oraRivedi();   // c'era «🤔 Cosa intendevi?» a schermo: il conto lo tengo io
          clearTimeout(tAttesi);
          tAttesi = setTimeout(function () {
            if (spento()) return;
            var cambia = false;
            Object.keys(attesi).forEach(function (id) { var p = pById(id); if (p && !p.via) { p.via = true; delete H.prop[id]; cambia = true; } });
            attesi = {};
            if (!cambia) return;
            if (H.fase === "gioco") controllaTurno();
            bd();
          }, 10000);
          if (H.fase === "gioco") controllaTurno();
        }
        bd();
      },
      onAddio: function (id) {
        delete attesi[id];
        var np = (H.prossimi || []).length;
        H.prossimi = (H.prossimi || []).filter(function (x) { return x.id !== id; });
        var ng = H.guarda.length; H.guarda = H.guarda.filter(function (x) { return x !== id; });
        var p = pById(id); if (!p) { if (H.prossimi.length !== np || H.guarda.length !== ng) bd(); return; }
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); sistemaCapi(); bd(); return; }
        p.via = true; delete H.prop[id];   // a partita iniziata resta nella sua squadra: se torna, rientra
        if (H.fase === "gioco") controllaTurno();
        if (H.fase === "fine" && H.rivedi && votiRivedi() >= servonoRivedi()) return chiudiRivedi();   // chi resta ha già detto «Avanti»
        bd();
      },
      onMsg: function (id, m) { azione(id, m); }
    };
    // (codice imposto, host di riserva e foto di chi tiene la partita: li fa il core. { ripresa: true } = gli amici non
    // tornano in saletta)
    var rete = prova ? { invia: function () {}, inviaVeloce: function () {}, chiudi: function () {}, lascia: function () {} }
      : SGNet.ospita(ID, callbacks, { ripresa: ripresa, keepalive: 10 });
    if (prova) setTimeout(function () { H.codice = "PROVA"; H.pronta = true; comincia(); }, 0);   // in prova niente saletta: si comincia subito
    // la mia stanza non c'è più (sono uscito, o il core mi ha fatto rientrare come giocatore perché la partita la tiene un
    // altro): da qui niente foto, niente timer, niente schermate
    function spento() {
      if (!ceduto && rete && rete._chiusa) { ceduto = true; clearTimeout(tAttesa); clearTimeout(tSosp); clearTimeout(tCless); clearTimeout(tAttesi); clearTimeout(tRiv); clearTimeout(tBotSq); }
      return ceduto;
    }
    // la partita com'è adesso, per riprenderla (t.ricorda): tutto H tranne gli avatar (li rimanda ognuno rientrando).
    // C'è anche la chiave del tabellone: resta sul mio telefono e va solo ai vice (mai nella foto). In saletta niente
    var ricordata = !!t.ripresa;   // (una ripresa vecchia che non vale più si scorda alla prima foto)
    function ricorda() {
      if (prova) return;
      if (H.fase !== "gioco" && H.fase !== "fine") { if (ricordata) { ricordata = false; t.ricorda(null); } return; }
      ricordata = true;
      t.ricorda(JSON.parse(JSON.stringify(H, function (k, v) { return k === "omino" ? undefined : v; })));
    }
    // la "foto" per tutti: SEMPRE con gli id; la chiave del tabellone MAI (va solo ai capi)
    function vm() {
      var fine = H.fase === "fine", r = [];
      for (var k = 0; k < H.nsq; k++) r.push(resto(k));
      var ora = Date.now(), att = null, cl = null;
      if (H.fase === "gioco" && H.attesa) att = { k: H.attesa.k, chi: H.attesa.chi || "", ms: Math.max(0, H.attesa.fino - ora), capo: H.attesa.capo ? 1 : 0, scad: H.attesa.scaduta ? 1 : 0 };
      if (H.fase === "gioco" && H.cless && !H.attesa) cl = { ms: Math.max(0, H.cless.fino - ora), p: H.cless.p, doppio: H.cless.doppio ? 1 : 0 };
      var pg = poolGruppo();
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, nsq: H.nsq, gruppoN: pg.l.length, gruppoDa: pg.da, quante: H.quante, tempo: H.tempo || 0, tempoInd: H.tempoInd || 0, mazzo: H.mazzo || "classico",
        ritmo: H.ritmo, vsBot: !!H.vsBot, serie: H.serie && H.serie.n ? { v: H.serie.v.slice(0, H.nsq), n: H.serie.n } : null, rivModo: H.rivModo || "capo",
        attesa: att, cless: cl, prossimi: (H.prossimi || []).map(function (p) { return { id: p.id, nome: p.nome }; }),
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, team: p.team, via: !!p.via, bot: p.bot ? 1 : undefined, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }),
        capo: H.capo.slice(0, H.nsq),
        tab: H.tab ? H.tab.map(function (c) { return { w: c.w, g: c.g, c: (c.g || fine) ? c.c : null, oro: (c.g || fine) && c.oro ? 1 : 0 }; }) : null, oro: H.oro,
        bid: H.bid, turno: H.turno, passo: H.passo, indizio: H.indizio, tentativi: H.tentativi, girate: H.girate, prop: H.prop,
        storia: H.storia.slice(-8), log: (H.log || []).slice(-40), fuori: H.fuori.slice(), vince: H.vince, classifica: H.classifica, msg: H.msg, ultima: H.ultima, resto: r,
        hostId: H.hostId, sospeso: H.sospeso || null, guarda: (H.guarda || []).slice(),
        // 🤔 le parole pensate dai capi: MAI durante la partita (nemmeno all'altro capo), solo a partita finita
        intendi: !!H.intendi, cosa: fine ? H.cosa || null : null,
        rivedi: fine && H.rivedi ? { ms: Math.max(0, H.rivedi.fino - ora), av: H.rivedi.av.filter(function (id) { var p = pById(id); return p && !p.via; }), servono: servonoRivedi() } : null,
        progressiFine: fine ? H.progressi : null };
    }
    function progresso(id) {
      if (!H.progressi[id]) H.progressi[id] = { indizi: 0, paroleGiuste: 0, paroleOro: 0 };
      return H.progressi[id];
    }
    function privato(id, m) {
      if (id === IO) { if (m.t === "avviso") avviso(m.testo); return; }
      m.to = id; rete.inviaVeloce(m);
    }
    var chiaveHost = null;
    function chiave() { return H.tab ? H.tab.map(function (c) { return c.c; }) : null; }
    function mandaChiave(id) {
      if (!id || id === BOT_ID || H.fase !== "gioco") return;
      if (id === IO) { chiaveHost = { bid: H.bid, col: chiave() }; return; }
      // int = gli indizi di questo capo per cui ha già detto (o saltato) le parole che intendeva: chi rientra non se lo vede richiedere
      var int = []; (H.ind || []).forEach(function (I, x) { if (I.id === id && I.pensate) int.push(x); });
      privato(id, { t: "chiave", bid: H.bid, col: chiave(), int: int });
    }
    function mandaChiavi() { for (var k = 0; k < H.nsq; k++) mandaChiave(H.capo[k]); }
    function bd() { if (spento()) return; var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); ricorda(); if (prova) pianificaBot(); }

    // ----- le mosse (dell'host e degli ospiti passano tutte da qui) -----
    function azione(id, m) {
      if (!m || !m.t) return;
      var p = pById(id);
      if (m.t === "join") {
        var nuovo = { id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino) };
        if (m.parole) nuovo.parole = leggiGruppo(m.parole).slice(0, MAX_AMICO);   // 📝 le parole che porta dal suo profilo (le vede solo l'host)
        var gia = (H.prossimi || []).some(function (x) { return x.id === id; });
        delete attesi[id];   // (dopo una ripresa: è rientrato)
        if (p) { if (p.via) delete H.salta[p.team]; p.via = false; if (!p.omino && nuovo.omino) p.omino = nuovo.omino; if (nuovo.parole) p.parole = nuovo.parole; }   // rientra: è di nuovo nella sua squadra (col suo avatar e le sue parole)
        else if (gia) {}   // aspetta già la prossima partita
        else if (H.guarda.indexOf(id) >= 0 || (t.puoSedersi && !t.puoSedersi(id, nuovo.nome))) {   // nella Sala gioca solo chi è stato scelto: gli altri guardano
          if (H.guarda.indexOf(id) < 0) H.guarda.push(id);
          rete.inviaVeloce({ t: "omini", omini: omini() }); bd(); return;
        }
        else if (H.players.length + H.prossimi.length >= MAX) { privato(id, { t: "piena" }); return; }   // la stanza è piena: glielo dico
        else if (H.fase === "fine") H.prossimi.push(nuovo);   // partita appena finita: entra nella prossima
        else {
          p = nuovo; p.team = piuPiccola();
          H.players.push(p);
        }
        sistemaCapi();
        if (H.fase === "gioco") controllaTurno();
        rete.inviaVeloce({ t: "omini", omini: omini() });
        bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
        if (p && H.fase === "gioco" && H.capo.indexOf(id) >= 0) mandaChiave(id);
        return;
      }
      if (!p) return;
      if (m.t === "chiedi_chiave") { if (H.fase === "gioco" && H.capo[p.team] === id) mandaChiave(id); return; }
      if (H.fase === "lobby") {
        if (p.bot) return;
        if (m.t === "squadra" && +m.s >= 0 && +m.s < H.nsq && !H.vsBot) { p.team = +m.s; sistemaCapi(); bd(); }
        else if (m.t === "capo" && !(H.vsBot && p.team !== 0)) { H.capo[p.team] = id; bd(); }
        else if (m.t === "mischia" && id === IO && !H.vsBot) mischia();
        else if (m.t === "vsbot" && id === IO && !prova) mettiBot(!!m.si);   // 🤖 «Siete in 3: giocate contro il Bot» (o di nuovo a squadre)
        return;
      }
      // a fine partita l'host sceglie come si rifanno le squadre alla rivincita
      if (m.t === "rivmodo") {
        if (id !== IO || H.fase !== "fine" || ["capo", "stessi", "caso"].indexOf(m.v) < 0) return;
        H.rivModo = m.v; bd(); return;
      }
      // «⏩ Avanti» sotto «🤔 Cosa intendevi?»: se lo tocca più di metà di chi gioca, si va subito ai tasti di fine
      if (m.t === "rivisto") {
        if (H.fase !== "fine" || !H.rivedi || p.via || p.bot) return;
        if (H.rivedi.av.indexOf(id) < 0) H.rivedi.av.push(id);
        if (votiRivedi() >= servonoRivedi()) return chiudiRivedi();
        bd(); return;
      }
      if (H.fase !== "gioco" || p.via) return;
      if (m.t === "chiudi" && id === IO) return chiudiPartita();   // 🏁 solo l'host: finisce qui, vince chi ha meno parole da trovare
      // 🤔 il capo dice (di nascosto) quali parole intendeva col suo indizio: le tiene solo l'host, si scoprono a fine partita
      if (m.t === "intendo") {
        var I = (H.ind || [])[Math.floor(+m.x)];
        if (!H.intendi || !I || I.id !== id || I.pensate) return;   // una volta sola per indizio
        if (m.salta) I.pensate = [];
        else {
          var max = I.n > 0 ? I.n : 9, l = [];
          [].concat(m.l || []).forEach(function (i) { i = Math.floor(+i); if (H.tab[i] && H.tab[i].c === I.k && (!H.tab[i].g || I.tocchi.some(function (x) { return x.i === i; })) && l.indexOf(i) < 0 && l.length < max) l.push(i); });
          if (!l.length) return;
          I.pensate = l;
        }
        ricorda(); return;   // (la foto non cambia: le parole pensate non ci vanno, ma la partita da ricordare sì)
      }
      var miaSquadra = p.team === H.turno, sonoCapo = H.capo[p.team] === id;
      if (m.t === "capo") {   // a partita iniziata: solo se il capo della squadra non c'è più e la squadra l'ha aspettato 3 minuti
        if (capoVivo(p.team) || H.fuori.indexOf(p.team) >= 0) return;
        if (!(H.attesa && H.attesa.k === p.team && H.attesa.capo && H.attesa.scaduta)) return;
        H.capo[p.team] = id; mandaChiave(id); H.msg = p.nome + " fa il capo dei " + SQ[p.team].nome + ".";
        scrivi({ t: "sis", testo: "👑 " + p.nome + " fa il capo dei " + SQ[p.team].nome });
        controllaTurno(); bd(); return;
      }
      if (m.t === "indizio") {
        if (!miaSquadra || !sonoCapo || H.passo !== "indizio") return;
        var n = Math.floor(+m.n); if (!(n >= 0 && n <= 9)) return;
        var err = erroreIndizio(m.parola, H.tab);
        if (err) { privato(id, { t: "avviso", testo: err }); return; }
        var parola = String(m.parola).trim().toUpperCase();
        H.ind = H.ind || [];
        H.indizio = { parola: parola, n: n, k: H.turno, id: id, nome: p.nome, giuste: 0, x: H.ind.length };
        H.ind.push({ k: H.turno, p: parola, n: n, id: id, nome: p.nome, tocchi: [], pensate: null });
        H.cless = null; clearTimeout(tCless);
        progresso(id).indizi++;
        H.tentativi = n === 0 ? 99 : n + 1; H.girate = 0; H.passo = "indovina"; H.prop = {}; H.msg = "";
        H.storia.push({ k: H.turno, parola: parola, n: n }); oraClessidra();   // ⏳ (se accesa) la clessidra di chi indovina
        scrivi({ t: "ind", k: H.turno, id: id, nome: p.nome, p: parola, num: n });
        bd(); return;
      }
      if (!miaSquadra || sonoCapo || H.passo !== "indovina" || H.sospeso) return;   // mentre una parola è in sospeso non si tocca niente
      if (m.t === "proponi") {
        var i = Math.floor(+m.i);
        if (i === -1) delete H.prop[id];   // (togli tutti i miei segni)
        else if (H.tab[i] && !H.tab[i].g) {   // ognuno può segnare più parole: si aggiungono (al massimo 9)
          var mie = (H.prop[id] || []).filter(function (x) { return x !== i && H.tab[x] && !H.tab[x].g; });
          mie.push(i); H.prop[id] = mie.slice(-9);
        }
        bd(); return;
      }
      if (m.t === "gira") { sospendi(Math.floor(+m.i), id); return; }
      if (m.t === "passo" && H.girate >= 1) { H.msg = p.nome + " passa la mano."; scrivi({ t: "passo", k: p.team, id: id, nome: p.nome }); fineTurno(); }
    }
    function mischia(zitto) {
      var tutti = mescola(H.players.filter(function (p) { return !p.via; }));
      tutti.forEach(function (p, i) { p.team = i % H.nsq; });
      H.capo = [null, null, null]; sistemaCapi(); azzeraSerie();   // squadre nuove: la serata a squadre riparte da 0 – 0
      if (!zitto) bd();
    }

    // ----- la partita -----
    function pronti() {
      if (H.vsBot) return membri(0).length >= 2;   // 🤖 contro il Bot: basta un capo e uno che indovina
      if (presenti().length < (H.nsq === 3 ? 6 : MIN)) return false;
      for (var k = 0; k < H.nsq; k++) if (membri(k).length < 2) return false;
      return true;
    }
    function comincia() {
      if (H.fase !== "lobby" || !pronti()) return;
      sistemaCapi();
      H.progressi = {};
      // 25 parole: qualcuna del gruppo (se ci sono) e le altre dal mazzo scelto (se non bastano, dal classico),
      // senza doppioni e senza due parole con la stessa radice (PESCA e PESCE, BANCO e BANCA)
      var usate = {}, parole = [], tot = H.nparole || 25;
      function metti(w) {
        w = String(w).toUpperCase(); var r = radice(w);
        if (parole.length >= tot || usate[norm(w)] || usate["r" + r]) return;
        usate[norm(w)] = 1; usate["r" + r] = 1; parole.push(w);
      }
      var u = leggiUscite(), pg = poolGruppo().l;
      mescola(pg).slice(0, quanteN(H.quante, tot)).forEach(metti);   // 📝 le parole vostre: 5, 10, metà o tutte
      var nGruppo = parole.length;
      primaLeNuove(mazzo(H.mazzo) || [], u, tot).forEach(metti);   // 🔁 prima quelle che stasera non sono ancora uscite
      primaLeNuove(elenco(), u, tot).forEach(metti);
      var ora = Date.now(); parole.slice(nGruppo).forEach(function (w) { u[norm(w)] = ora; });
      salvaUscite(u);
      parole = mescola(parole);
      var d = DIVISIONE[H.nparole || 25][H.nsq], primo = H.vsBot ? 0 : Math.floor(Math.random() * H.nsq), colori = [];
      d.sq.forEach(function (q, j) { var k = (primo + j) % H.nsq; for (var x = 0; x < q; x++) colori.push(k); });
      for (var x = 0; x < d.neutre; x++) colori.push("n");
      colori.push("x");
      colori = mescola(colori);
      H.tab = parole.map(function (w, i) { return { w: w, c: colori[i], g: false }; });
      if (H.oro) {   // la parola d'oro: una di nessuno, segreta a tutti (anche ai capi)
        var neutre = []; H.tab.forEach(function (c, i) { if (c.c === "n") neutre.push(i); });
        if (neutre.length) H.tab[neutre[Math.floor(Math.random() * neutre.length)]].oro = true;
      }
      H.bid = 1 + Math.floor(Math.random() * 1e9); H.turno = primo; H.passo = "indizio"; H.indizio = null; H.tentativi = 0; H.girate = 0;
      H.prop = {}; H.storia = []; H.fuori = []; H.vince = -1; H.classifica = null; H.ultima = null; H.nGirate = 0;
      H.salta = {}; H.nTurni = 0; H.attesa = null; H.cless = null; H.migliore = null; H.ind = []; H.cosa = null; H.rivedi = null;
      H.msg = "Cominciano i " + SQ[primo].nome + "!";
      H.log = []; H.logN = 0; scrivi({ t: "via", k: primo });
      H.fase = "gioco"; chiaveHost = null;
      mandaChiavi(); controllaTurno(); bd();
    }
    // la suspense: la parola scelta resta "in sospeso" qualche secondo (sui telefoni: vignetta di chi la dice, casella che trema,
    // il pubblico che fa "ooooh"), poi si scopre. La decide l'host, così il colore non viaggia prima del tempo.
    // 🎬 Show: la suspense lunga solo sulle parole che contano (la prima di ogni indizio, l'ultimo tentativo, l'ultima parola che
    // manca per vincere); sulle altre un attimo, così quando la squadra è sicura il ritmo non cala. ⚡ Veloce: sempre un attimo.
    // (Non dipende MAI dal colore della parola: una suspense lunga non deve far capire niente)
    var SOSPENSE_MS = 2300, SOSPENSE_BREVE = 800, SOSPENSE_VELOCE = 650, tSosp = null;
    function sospendi(i, id) {
      var c = H.tab[i]; if (!c || c.g || H.sospeso) return;
      H.nSosp = (H.nSosp || 0) + 1;
      var lungo = H.ritmo !== "veloce" && (H.girate === 0 || (H.tentativi > 0 && H.tentativi < 99 && H.tentativi === 1) || resto(H.turno) === 1);
      if (id === BOT_ID) lungo = H.ritmo !== "veloce" && resto(1) <= 2;   // 🤖 il Bot: suspense solo quando sta per vincere
      var ms = lungo ? SOSPENSE_MS : H.ritmo === "veloce" ? SOSPENSE_VELOCE : SOSPENSE_BREVE;
      H.sospeso = { i: i, id: id, k: H.turno, n: H.nSosp, lungo: lungo ? 1 : 0 };   // gli altri segni restano: si può continuare con quelle
      bd();
      clearTimeout(tSosp); tSosp = setTimeout(rivela, ms);
    }
    function rivela() {
      var s = H.sospeso; if (!s || spento()) return;
      H.sospeso = null;
      if (H.fase !== "gioco" || H.turno !== s.k) return bd();
      gira(s.i, s.id);
    }
    function togliSegno(i) {   // la parola girata non è più segnata da nessuno (le altre restano)
      Object.keys(H.prop).forEach(function (id) { var l = (H.prop[id] || []).filter(function (x) { return x !== i; }); if (l.length) H.prop[id] = l; else delete H.prop[id]; });
    }
    function gira(i, id) {
      var c = H.tab[i]; if (!c || c.g) return;
      var k = H.turno, p = pById(id);
      c.g = true; H.girate++; togliSegno(i);
      var I = H.indizio && H.indizio.k === k && H.ind ? H.ind[H.indizio.x] : null;
      if (I) I.tocchi.push({ i: i, c: c.c, oro: c.oro ? 1 : 0 });   // 🤔 le parole toccate con questo indizio (per «Cosa intendevi?»)
      if (p) {   // per i trofei: le parole della propria squadra e la parola d'oro
        var pg = progresso(id);
        if (c.c === p.team) pg.paroleGiuste++;
        if (c.oro) pg.paroleOro++;
      }
      if (c.c === k && H.indizio) {   // per il riepilogo finale: l'indizio che ha fatto trovare più parole
        H.indizio.giuste = (H.indizio.giuste || 0) + 1;
        if (!H.migliore || H.indizio.giuste > H.migliore.giuste) H.migliore = { nome: H.indizio.nome, p: H.indizio.parola, n: H.indizio.n, giuste: H.indizio.giuste };
      }
      H.ultima = { i: i, k: k, c: c.c, oro: c.oro ? 1 : 0, n: ++H.nGirate };
      var chi = p ? p.nome : SQ[k].nome;
      scrivi({ t: "gira", k: k, id: id, nome: chi, w: c.w, c: c.c, oro: c.oro ? 1 : 0 });
      if (c.c === "x") {   // la parola nera
        H.fuori.push(k);
        H.msg = "💣 " + chi + " ha girato la parola nera: i " + SQ[k].nome + " " + (H.nsq === 2 ? "perdono!" : "sono fuori!");
        var v = vive();
        if (v.length === 1) return fine(v[0]);
        return fineTurno();
      }
      if (typeof c.c === "number" && H.fuori.indexOf(c.c) < 0 && resto(c.c) === 0) return fine(c.c);   // girata l'ultima parola di una squadra: vince lei
      if (H.vsBot && k === 1) { H.msg = "🤖 " + chi + " scopre " + c.w + ": gliene mancano " + resto(1) + "."; return fineTurno(); }   // il Bot ha fatto la sua mossa
      if (c.c === k) {
        H.tentativi--; H.msg = "✅ " + c.w + ": giusta!";
        if (H.tentativi <= 0) { H.msg = "✅ " + c.w + ": giusta! Finiti i tentativi."; return fineTurno(); }
        bd(); return;
      }
      if (c.oro) { H.msg = "⭐ " + c.w + ": la parola d'oro! I " + SQ[k].nome + " continuano a indovinare."; bd(); return; }   // si va avanti con lo stesso indizio, senza perdere un tentativo
      H.msg = c.c === "n" ? "😐 " + c.w + ": di nessuno. Tocca agli altri." : "😬 " + c.w + ": era dei " + SQ[c.c].nome + "!";
      fineTurno();
    }
    function nuovoTurno(k2) {   // tocca alla squadra k2: si riparte dall'indizio
      H.indizio = null; H.prop = {}; H.passo = H.vsBot && k2 === 1 ? "bot" : "indizio"; H.girate = 0; H.tentativi = 0;
      H.turno = k2; H.nTurni = (H.nTurni || 0) + 1; H.attesa = null;
    }
    // 💭 a fine turno: le parole a cui pensava il capo e che la squadra ha trovato («Paky pensava a: ONDA ✅ SALE ✅ · 1 🤫»).
    // Quelle non trovate restano segrete (sono parole della squadra ancora coperte): si scoprono a fine partita in «Cosa intendevi?»
    function pensavaA() {
      var I = H.intendi && H.indizio && H.ind ? H.ind[H.indizio.x] : null;
      if (!I || !I.pensate || !I.pensate.length || I.detto || H.fase !== "gioco") return;
      I.detto = 1;
      var ok = I.pensate.filter(function (i) { return I.tocchi.some(function (x) { return x.i === i; }); });
      scrivi({ t: "pens", k: I.k, id: I.id, nome: I.nome, p: I.p, ok: ok.map(function (i) { return H.tab[i].w; }), nasc: I.pensate.length - ok.length });
    }
    // 🤖 il turno del Bot (contro il Bot): un attimo, poi scopre una sua parola a caso
    var tBotSq = null;
    function turnoBot() {
      clearTimeout(tBotSq); tBotSq = null;
      if (spento() || !H.vsBot || H.fase !== "gioco" || H.turno !== 1 || H.passo !== "bot" || H.sospeso) return;
      tBotSq = setTimeout(function () {
        tBotSq = null;
        if (spento() || H.fase !== "gioco" || H.turno !== 1 || H.passo !== "bot" || H.sospeso) return;
        var sue = []; H.tab.forEach(function (c, i) { if (c.c === 1 && !c.g) sue.push(i); });
        if (!sue.length) return fine(1);
        sospendi(sue[Math.floor(Math.random() * sue.length)], BOT_ID);
      }, H.ritmo === "veloce" ? 1200 : 2200);
    }
    function fineTurno() {
      pensavaA();
      var k2 = H.turno;
      for (var s = 1; s <= H.nsq; s++) { var x = (H.turno + s) % H.nsq; if (H.fuori.indexOf(x) < 0) { k2 = x; break; } }
      nuovoTurno(k2);
      controllaTurno(); bd();
    }
    // Chi serve alla squadra di turno per andare avanti ADESSO ("" = c'è tutto):
    // per l'indizio servono il capo e almeno uno che poi indovini; per indovinare basta uno che indovina
    // (il capo non serve più: l'indizio l'ha già dato).
    function manca(k) {
      var m = membri(k), altri = m.filter(function (p) { return p.id !== H.capo[k]; }).length;
      if (H.passo === "indovina") return altri >= 1 ? "" : "indovino";
      if (!capoVivo(k)) return "capo";
      return altri >= 1 ? "" : "indovino";
    }
    function chiManca(k, cosa) {   // i nomi di chi aspettiamo (per la scritta "Aspettiamo Giulia…")
      if (cosa === "capo") { var c = pById(H.capo[k]); return c ? c.nome : "il capo"; }
      var via = H.players.filter(function (p) { return p.team === k && p.via && p.id !== H.capo[k]; }).map(function (p) { return p.nome; });
      return via.length ? via.slice(0, 2).join(" e ") : "i compagni";
    }
    // Se manca qualcuno (es. è andato su WhatsApp) si aspetta, e tutti vedono chi e per quanto ("⏳ Aspettiamo Giulia… 0:45").
    // Se manca il CAPO lo si aspetta e basta (deciso dal proprietario il 20 ott 2026: «non ha senso che il capo diventi un altro»):
    // niente capo nuovo da solo. Dopo 3 minuti, se non è tornato, i compagni vedono «👑 Faccio io il capo» (lo decidono loro);
    // se in squadra non c'è nessuno che possa prendere il suo posto, tocca alla squadra dopo.
    // Se manca chi indovina, scaduto il tempo tocca alla squadra dopo, e da lì in poi i turni di quella squadra si saltano subito
    // finché non torna qualcuno (niente attese a ogni giro). La scadenza sta nella partita, così vale anche se intanto cambia l'host.
    var ATTESA_SQUADRA = 60000, ATTESA_INDOVINO = 30000, ATTESA_CAPO = 180000, tAttesa = null;
    function controllaTurno() {
      clearTimeout(tAttesa); tAttesa = null;
      if (H.fase !== "gioco") { H.attesa = null; H.cless = null; clearTimeout(tCless); return; }
      if (H.vsBot && H.turno === 1) { H.attesa = null; H.cless = null; clearTimeout(tCless); return turnoBot(); }   // 🤖 tocca al Bot: non aspetta nessuno
      var k = H.turno, cosa = manca(k);
      if (!cosa) { H.attesa = null; return oraClessidra(); }
      H.cless = null; clearTimeout(tCless);   // la clessidra riparte da capo quando la squadra è di nuovo al completo
      var m = membri(k), puoCapo = cosa === "capo" && m.length >= 2;
      if (H.salta[k] && !puoCapo) return salta(k);
      if (!H.attesa || H.attesa.k !== k || H.attesa.passo !== H.passo || H.attesa.n !== H.nTurni || !!H.attesa.capo !== (cosa === "capo"))
        H.attesa = { k: k, passo: H.passo, n: H.nTurni, capo: cosa === "capo" ? 1 : 0,
          fino: Date.now() + (cosa === "capo" ? ATTESA_CAPO : cosa === "indovino" && H.passo === "indovina" ? ATTESA_INDOVINO : ATTESA_SQUADRA) };
      H.attesa.chi = chiManca(k, cosa);
      function riprova(ms) { tAttesa = setTimeout(function () { if (!spento()) { controllaTurno(); bd(); } }, ms); }
      if (Date.now() < H.attesa.fino) { riprova(H.attesa.fino - Date.now() + 50); return; }
      if (puoCapo) { H.attesa.scaduta = 1; return; }   // il capo non torna: si aspetta ancora, i compagni possono fare loro il capo
      H.salta[k] = 1;
      salta(k);
    }
    function salta(k) {   // la squadra k non può giocare: tocca alla prossima che può
      for (var s = 1; s < H.nsq; s++) {
        var k2 = (k + s) % H.nsq;
        if (H.fuori.indexOf(k2) >= 0 || membri(k2).length < 2) continue;
        pensavaA();
        H.msg = "⏭️ Ai " + SQ[k].nome + " manca qualcuno: tocca ai " + SQ[k2].nome + ".";
        scrivi({ t: "sis", testo: "⏭️ Ai " + SQ[k].nome + " manca qualcuno: tocca ai " + SQ[k2].nome });
        nuovoTurno(k2);
        return controllaTurno();
      }
      // nessuna squadra può giocare: si aspetta ancora (l'host può chiudere la partita)
      if (!H.attesa) H.attesa = { k: k, passo: H.passo, n: H.nTurni, chi: chiManca(k, manca(k)) };
      H.attesa.fino = Date.now() + 30000;
      tAttesa = setTimeout(function () { if (!spento()) { controllaTurno(); bd(); } }, 30050);
    }
    // ⏳ le clessidre (se l'host le ha accese): quella del capo per l'indizio e quella della squadra per indovinare.
    // Il primo indizio della partita ha il tempo doppio (anche per chi indovina). Allo scadere il turno passa da solo
    var tCless = null;
    function oraClessidra() {
      clearTimeout(tCless); tCless = null;
      var p = H.passo, sec = p === "indizio" ? H.tempo : p === "indovina" ? H.tempoInd : 0;
      if (!sec || H.fase !== "gioco") { H.cless = null; return; }
      var doppio = H.storia.length === (p === "indizio" ? 0 : 1);
      var key = H.turno + "|" + H.nTurni + "|" + p;
      if (!H.cless || H.cless.key !== key) H.cless = { key: key, p: p, doppio: doppio, fino: Date.now() + sec * (doppio ? 2 : 1) * 1000 };
      tCless = setTimeout(function scade() {
        tCless = null;
        if (spento() || H.fase !== "gioco" || !H.cless || H.cless.key !== H.turno + "|" + H.nTurni + "|" + H.passo) return;
        if (H.sospeso) { tCless = setTimeout(scade, 300); return; }   // c'è una parola in sospeso: prima si scopre
        if (H.passo === "indizio") {
          H.msg = "⏳ Tempo scaduto per i " + SQ[H.turno].nome + "!";
          scrivi({ t: "sis", testo: "⏳ Tempo scaduto per il capo dei " + SQ[H.turno].nome });
        } else {
          H.msg = "⏳ Tempo scaduto: i " + SQ[H.turno].nome + " si fermano qui!";
          scrivi({ t: "sis", testo: "⏳ Tempo scaduto per i " + SQ[H.turno].nome });
        }
        fineTurno();
      }, Math.max(0, H.cless.fino - Date.now()) + 50);
    }
    // 🏁 l'host chiude la partita (es. una squadra non c'è più): vince chi ha meno parole da trovare
    function chiudiPartita() {
      var v = vive(); if (!v.length) return;
      v.sort(function (a, b) { return resto(a) - resto(b) || membri(b).length - membri(a).length; });
      scrivi({ t: "sis", testo: "🏁 L'host ha chiuso la partita" });
      fine(v[0], "🏁 Partita chiusa: vincono i " + SQ[v[0]].nome + " (meno parole da trovare)!");
    }
    function fine(k, motivo) {
      pensavaA();
      H.fase = "fine"; H.vince = k; H.prop = {}; H.indizio = null; H.attesa = null; H.cless = null;
      clearTimeout(tAttesa); clearTimeout(tCless); clearTimeout(tBotSq);
      // posti: 1 chi vince, 2 chi era ancora in gioco, 3 chi è uscito con la parola nera (il Bot non è in classifica)
      var restaAltro = vive().some(function (x) { return x !== k; });
      H.classifica = H.players.filter(function (p) { return p.id !== BOT_ID; }).map(function (p) {
        return { id: p.id, nome: p.nome, team: p.team, pos: p.team === k ? 1 : H.fuori.indexOf(p.team) >= 0 && restaAltro ? 3 : 2 };
      }).sort(function (a, b) { return a.pos - b.pos; });
      // 🏆 la serata a squadre: un punto al colore che vince (contro il Bot: voi o lui)
      H.serie = H.serie || { v: [0, 0, 0], n: 0 };
      if (k >= 0 && k < 3) { H.serie.v[k]++; H.serie.n++; }
      var bot = H.vsBot ? pById(BOT_ID) : null;
      if (bot && !motivo) motivo = k === 0 ? "🎉 Avete battuto " + bot.nome + "!" : "🤖 Vince " + bot.nome + (H.fuori.indexOf(0) >= 0 ? ": avete girato la parola nera!" : ": ha scoperto tutte le sue parole!");
      H.msg = motivo || "🎉 Vincono i " + SQ[k].nome + "!"; scrivi({ t: "fine", k: k, testo: bot ? H.msg : undefined });
      // il riepilogo nella chat: il miglior indizio, chi ha trovato più parole, la parola nera
      if (H.migliore && H.migliore.giuste >= 2) scrivi({ t: "sis", testo: "🏅 Miglior indizio: " + H.migliore.p + " " + (H.migliore.n === 0 ? "∞" : H.migliore.n) + " di " + H.migliore.nome + " (" + H.migliore.giuste + " parole)" });
      var top = null;
      H.players.forEach(function (p) { var g = (H.progressi[p.id] || {}).paroleGiuste || 0; if (g > 0 && (!top || g > top.g)) top = { nome: p.nome, g: g }; });
      if (top) scrivi({ t: "sis", testo: "🔎 Più parole trovate: " + top.nome + " (" + top.g + ")" });
      var nera = (H.tab || []).filter(function (c) { return c.c === "x"; })[0];
      if (nera) scrivi({ t: "sis", testo: "💣 La parola nera era " + nera.w });
      H.players.forEach(function (p) {
        if (p.bot && !prova) return;
        var pg = progresso(p.id);
        pg.partite = 1; pg.partiteOnline = 1;
        pg.vittorie = p.team === k ? 1 : 0;
        pg.vittorieCapo = p.team === k && H.capo[k] === p.id ? 1 : 0;
      });
      preparaCosa();
      if (!prova && !t.guarda) salvaProgressiOrdine(H.codice + "|" + H.bid, IO, vm().progressiFine, H.players, t.guarda);
      bd();
      // torneo online: i NOMI dei giocatori; a squadre chi vince al posto 1, gli altri dopo
      if (t.risultato && !prova) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // 🤔 «Cosa intendevi?» a fine partita: per ogni indizio di cui il capo ha detto le parole pensate, cosa pensava e cosa ha
    // toccato la squadra. Premio «🧠 Più in sintonia» alla squadra con più parole pensate e poi trovate (a pari, la più precisa).
    var tRiv = null;
    function preparaCosa() {
      H.cosa = null; H.rivedi = null; clearTimeout(tRiv);
      if (!H.intendi) return;
      var l = [], per = {};
      (H.ind || []).forEach(function (I) {
        if (!I.pensate || !I.pensate.length) return;
        function w(i) { return (H.tab[i] || {}).w || "?"; }
        var toccata = function (i) { return I.tocchi.some(function (x) { return x.i === i; }); };
        var trovate = I.pensate.filter(toccata).length;
        l.push({ k: I.k, p: I.p, n: I.n, nome: I.nome,
          pen: I.pensate.map(function (i) { return { w: w(i), ok: toccata(i) ? 1 : 0 }; }),
          toc: I.tocchi.map(function (x) { return { w: w(x.i), c: x.c, oro: x.oro, pen: I.pensate.indexOf(x.i) >= 0 ? 1 : 0 }; }) });
        var s = per[I.k] || (per[I.k] = { k: I.k, t: 0, p: 0, nomi: [] });
        s.t += trovate; s.p += I.pensate.length;
        if (s.nomi.indexOf(I.nome) < 0) s.nomi.push(I.nome);
      });
      if (!l.length) return;
      var sq = Object.keys(per).map(function (k) { return per[k]; }).filter(function (s) { return s.t > 0; });
      sq.sort(function (a, b) { return b.t - a.t || b.t / b.p - a.t / a.p; });
      var primi = sq.filter(function (s) { return sq.length && s.t === sq[0].t && s.t / s.p === sq[0].t / sq[0].p; });
      H.cosa = { l: l, premio: primi };
      // il conto: un po' per ogni indizio (si può andare avanti prima con «⏩ Avanti» a maggioranza); prima i coriandoli della vittoria
      H.rivedi = { fino: Date.now() + Math.min(60, 22 + 6 * l.length) * 1000, av: [] };
      oraRivedi();
    }
    function oraRivedi() {
      clearTimeout(tRiv);
      if (!H.rivedi) return;
      tRiv = setTimeout(function () { if (!spento()) chiudiRivedi(); }, Math.max(0, H.rivedi.fino - Date.now()) + 50);
    }
    function chiudiRivedi() { clearTimeout(tRiv); if (!H.rivedi) return; H.rivedi = null; bd(); }
    function umaniPresenti() { return presenti().filter(function (p) { return !p.bot; }); }
    function servonoRivedi() { return Math.floor(umaniPresenti().length / 2) + 1; }
    function votiRivedi() { return H.rivedi ? H.rivedi.av.filter(function (id) { var p = pById(id); return p && !p.via && !p.bot; }).length : 0; }
    // "Nuova partita": stessa stanza, stessi amici, stesse squadre; il capo passa al prossimo della squadra.
    // Chi era arrivato a partita finita entra adesso, nella squadra più piccola.
    // Alla rivincita l'host sceglie (a fine partita): «👑 Capo nuovo» (stesse squadre, il capo passa al prossimo: come sempre),
    // «Stessi capi» o «🔀 Squadre a caso» (e allora la serata a squadre riparte da 0 – 0)
    function nuova() {
      H.fase = "lobby"; H.classifica = null; H.tab = null; H.players = presenti(); H.msg = ""; chiaveHost = null;
      H.cosa = null; H.rivedi = null; H.ind = []; clearTimeout(tRiv); clearTimeout(tBotSq);
      var modo = H.rivModo || "capo";
      if (modo === "capo") for (var k = 0; k < H.nsq; k++) {
        if (H.vsBot && k === 1) continue;
        var m = membri(k), i = -1;
        m.forEach(function (p, j) { if (p.id === H.capo[k]) i = j; });
        H.capo[k] = m.length ? m[(i + 1) % m.length].id : null;
      }
      (H.prossimi || []).forEach(function (p) { if (H.players.length < MAX && !pById(p.id)) { p.team = piuPiccola(); H.players.push(p); } });
      H.prossimi = [];
      if (modo === "caso" && !H.vsBot && !prova) mischia(true);
      if (prova) { H.capo = [imp.capoIo === false ? "bot1" : IO, "bot2", null]; return comincia(); }   // in prova si ricomincia subito
      sistemaCapi(); rete.inviaVeloce({ t: "omini", omini: omini() }); bd();
    }

    // ----- 🧪 i bot della prova da solo: danno indizi a caso e indovinano un po' a naso (sbirciano la chiave 7 volte su 10) -----
    var tBot = null;
    function pianificaBot() {
      clearTimeout(tBot); tBot = null;
      if (H.fase !== "gioco") return;
      var k = H.turno, capo = pById(H.capo[k]);
      if (H.sospeso) return;   // c'è una parola in sospeso: i bot aspettano
      if (H.passo === "indizio") { if (capo && capo.bot) tBot = setTimeout(function () { botIndizio(k); }, 2600); return; }   // prima la telecamera passa dal capo
      var umani = membri(k).filter(function (p) { return !p.bot && p.id !== H.capo[k]; });
      var bot = membri(k).filter(function (p) { return p.bot && p.id !== H.capo[k]; })[0];
      if (umani.length || !bot) return;   // se in squadra indovini tu, il bot ti lascia fare
      var segnate = H.prop[bot.id] || [];
      if (segnate.length) tBot = setTimeout(function () { azione(bot.id, { t: "gira", i: segnate[segnate.length - 1] }); }, 1000);
      else tBot = setTimeout(function () { botScegli(k, bot.id); }, H.girate ? 1800 : 3600);   // dopo l'indizio, prima la vignetta del capo
    }
    function botIndizio(k) {
      if (H.fase !== "gioco" || H.turno !== k || H.passo !== "indizio") return;
      var lista = mescola(PAROLE_BOT), parola = "BOH";
      for (var i = 0; i < lista.length; i++) if (!erroreIndizio(lista[i], H.tab)) { parola = lista[i]; break; }
      azione(H.capo[k], { t: "indizio", parola: parola, n: Math.random() < 0.5 ? 1 : 2 });
      // 🤔 anche il capo bot dice (di nascosto) quali parole intendeva: a caso tra le sue, così a fine prova c'è «Cosa intendevi?»
      var I = H.indizio && H.indizio.k === k ? (H.ind || [])[H.indizio.x] : null;
      if (I && H.intendi && !I.pensate) {
        var sue = []; H.tab.forEach(function (c, i) { if (c.c === k && !c.g) sue.push(i); });
        azione(H.capo[k], { t: "intendo", x: H.indizio.x, l: mescola(sue).slice(0, I.n || 2) });
      }
    }
    function botScegli(k, id) {
      if (H.fase !== "gioco" || H.turno !== k || H.passo !== "indovina") return;
      if (H.girate >= 1 && Math.random() < 0.35) return azione(id, { t: "passo" });
      var coperte = []; H.tab.forEach(function (c, i) { if (!c.g) coperte.push(i); });
      var mie = coperte.filter(function (i) { return H.tab[i].c === k; });
      var i = mie.length && Math.random() < 0.7 ? mie[Math.floor(Math.random() * mie.length)] : coperte[Math.floor(Math.random() * coperte.length)];
      azione(id, { t: "proponi", i: i });   // prima l'avatar sulla parola, poi la gira
    }

    var cbHost = { sonoHost: true, myId: IO, onComincia: comincia, onNuova: nuova,
      pronti: pronti,
      omini: omini,
      chiave: function () { return chiaveHost && chiaveHost.bid === H.bid && H.fase === "gioco" && H.capo.indexOf(IO) >= 0 ? chiaveHost.col : null; },
      manda: function (m) { azione(IO, m); },
      onEsci: function (gia) {   // gia = l'ha già confermato il tasto ‹ dello studio
        function via() {
          clearTimeout(tBot); clearTimeout(tAttesa); clearTimeout(tCless); clearTimeout(tSosp); clearTimeout(tAttesi); clearTimeout(tRiv); clearTimeout(tBotSq);
          ceduto = true;   // da qui niente più foto né schermate
          rete.chiudi(); t.esci();
        }
        // un tocco sbagliato non chiude il gioco a tutti (la finestra al centro dell'app)
        if (H.fase === "gioco" && !gia) return t.conferma(prova ? "Uscire dalla prova?" : "Chiudere la partita per tutti?", prova ? null : "La partita finisce anche per gli amici.", prova ? "Esci" : "Chiudi", via);
        via();
      } };
    // la Rivincita dei tasti di fine comuni: tutti di nuovo nella saletta, stesse squadre (il core fa il 3-2-1).
    // Vale anche per l'amico che porta avanti la partita al posto dell'host (host di riserva)
    if (!prova) t.onRivincita = function () { if (H.fase === "fine" && !spento()) nuova(); };
    if (ripresa) mandaChiave(IO);   // (se sono capo: la chiave del tabellone è nella partita ripresa)
    if (!prova) { if (H.vsBot && !ripresa) mettiBot(true); else bd(); }   // (🤖 contro il Bot: il Bot si siede subito nei Blu)
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null, omini: {}, chiave: null, chiesta: 0 };
    var cb = { sonoHost: false, myId: null,
      omini: function () { return S.omini; },
      chiave: function () { return S.chiave && S.vm && S.vm.fase === "gioco" && S.chiave.bid === S.vm.bid ? S.chiave.col : null; },
      manda: function (m) { if (S.rete) S.rete.invia(m); },
      onEsci: function (gia) {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (S.vm && S.vm.fase === "gioco" && !gia) return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "🕵️", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    // se sono capo e non ho la chiave di questo tabellone, la chiedo (il messaggio può perdersi)
    function controllaChiave() {
      var v = S.vm; if (!v || v.fase !== "gioco" || !S.myId) return;
      var io = null; v.players.forEach(function (p) { if (p.id === S.myId) io = p; });
      if (!io || v.capo[io.team] !== S.myId || (S.chiave && S.chiave.bid === v.bid)) return;
      if (Date.now() - S.chiesta < 2500) return;
      S.chiesta = Date.now(); S.rete.invia({ t: "chiedi_chiave" });
    }
    function collega() {
      attesa();
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) {
          S.myId = id; cb.myId = id;
          // 📝 porto le mie parole (quelle del mio profilo, al massimo 30): l'host le mescola a quelle del gruppo
          var mie = []; try { mie = leggiGruppo(window.SG && SG.listaProfilo ? SG.listaProfilo("ordine") : []).slice(0, MAX_AMICO); } catch (e) {}
          S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome), parole: mie.length ? mie : undefined });
        },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") {
            var faseDi = S.vm ? S.vm.fase : null;
            S.vm = m.vm;
            if (m.vm.fase === "fine" && !t.guarda) salvaProgressiOrdine(m.vm.codice + "|" + m.vm.bid, S.myId, m.vm.progressiFine, m.vm.players, t.guarda);
            // com'è finita, anche da chi gioca senza tenere la stanza (una volta, solo se la fine l'ha vista arrivare: non
            // rientrando a partita finita). Nella Sala, se l'host è sparito e la partita l'ha finita un amico (host di riserva),
            // i punti della serata li conta chi ha preso la Sala, che qui è un giocatore. (Gli XP non raddoppiano: il core
            // tiene una volta sola la stessa partita detta due volte)
            if (m.vm.fase === "fine" && faseDi === "gioco" && m.vm.classifica && !t.guarda && t.risultato && trova(m.vm, S.myId)) {
              t.risultato(m.vm.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
            }
            disegna(t, m.vm, cb); controllaChiave();
          }
          else if (m.t === "chiave") {
            S.chiave = { bid: m.bid, col: m.col };
            (m.int || []).forEach(function (x) { INTESI[m.bid + "|" + x] = 1; });   // 🤔 indizi per cui ho già detto cosa intendevo
            if (S.vm) disegna(t, S.vm, cb);
          }
          // gli avatar: si tengono quelli che ho già (dopo una ripresa arrivano man mano che gli amici rientrano)
          else if (m.t === "omini") { var om = m.omini || {}; Object.keys(om).forEach(function (k) { if (om[k] || !(k in S.omini)) S.omini[k] = om[k]; }); if (S.vm) disegna(t, S.vm, cb); }
          else if (m.t === "avviso") avviso(m.testo);
          else if (m.t === "piena" && S.rete) {   // la stanza ha già 12 giocatori: esco e lo dico
            var r = S.rete; S.rete = null; try { r.chiudi(); } catch (e) {}
            UI = null;
            errore(t, "La stanza è piena: ci sono già " + MAX + " giocatori.");
          }
        },
        onChiuso: function () { errore(t, "La partita è stata chiusa dall'host."); },
        onErrore: function () { errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function attesa() {
      var s = t.schermata({ icona: "🕵️", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per host e ospiti): saletta, tabellone, fine
  // =========================================================
  var UI = null;   // la schermata di gioco si costruisce UNA volta per tabellone e poi si aggiorna a pezzi
  function disegna(t, vm, cb) {
    if (vm.fase === "lobby" || !vm.tab) { UI = null; return lobby(t, vm, cb); }
    // (da capo anche se il tavolo è un altro: l'amico che prende il posto dell'host sparito, Passo 5, non usa la schermata di quando era ospite)
    if (!UI || UI.t !== t || UI.bid !== vm.bid || !UI.S || !UI.S.vivo()) UI = creaSchermo(t, vm, cb);
    UI.cb = cb; UI.vm = vm;
    aggiorna(UI, vm, cb);
  }
  // quanti avatar ci sono (le chiavi dei pezzi da ridisegnare: cambiano anche quando un avatar arriva dopo, es. dopo una ripresa)
  function nAvatar(om) { var n = 0; for (var k in om || {}) if (om[k]) n++; return n; }
  function trova(vm, id) { for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return vm.players[i]; return null; }
  function nomeBot(vm) { var b = (vm.players || []).filter(function (p) { return p.id === BOT_ID; })[0]; return b ? b.nome : "Bot"; }
  function nomeSq(vm, k) { return vm.vsBot && k === 1 ? nomeBot(vm) : SQ[k].nome; }   // contro il Bot i Blu si chiamano col suo nome
  function minVm(vm) { return vm.vsBot ? 2 : vm.nsq === 3 ? 6 : MIN; }
  // 🏆 «🔴 Rossi 2 – 1 Blu 🔵» (contro il Bot: «Voi 2 – 1 Matt»)
  function testoSerie(vm) {
    var s = vm.serie; if (!s || !s.n) return "";
    if (vm.vsBot) return "🏆 Voi " + s.v[0] + " – " + s.v[1] + " " + nomeBot(vm);
    if (vm.nsq === 2) return "🏆 " + SQ[0].em + " " + SQ[0].nome + " " + s.v[0] + " – " + s.v[1] + " " + SQ[1].nome + " " + SQ[1].em;
    return "🏆 " + [0, 1, 2].map(function (k) { return SQ[k].em + " " + SQ[k].nome + " " + s.v[k]; }).join(" · ");
  }
  function prontiVm(vm) {
    var vivi = vm.players.filter(function (p) { return !p.via; });
    if (vm.vsBot) return vivi.filter(function (p) { return p.team === 0 && !p.bot; }).length >= 2;
    if (vivi.length < (vm.nsq === 3 ? 6 : MIN)) return false;
    for (var k = 0; k < vm.nsq; k++) if (vivi.filter(function (p) { return p.team === k; }).length < 2) return false;
    return true;
  }
  function lobby(t, vm, cb) {
    stile();
    var el = t.el, io = trova(vm, cb.myId), box = el("div", { class: "or-squadre" });
    var umani = vm.players.filter(function (p) { return !p.bot; }), presenti = umani.filter(function (p) { return !p.via; }).length;
    var serie = testoSerie(vm);
    if (serie) box.appendChild(el("div", { class: "or-serie", text: serie }));   // 🏆 com'è andata finora stasera
    for (var k = 0; k < vm.nsq; k++) (function (k) {
      var mem = vm.players.filter(function (p) { return p.team === k; });
      if (vm.vsBot && k === 1) return;   // (🤖 l'avversario sta nella testa della vostra squadra: «Voi contro Matt (Bot)»)
      box.appendChild(el("div", { class: "or-sq", style: "--c:" + SQ[k].col }, [
        el("div", { class: "or-sq-testa" }, [
          el("b", { text: SQ[k].em + " " + (vm.vsBot ? "Voi contro 🤖 " + nomeBot(vm) + " (Bot)" : SQ[k].nome) }),
          io && io.team !== k && !vm.vsBot ? el("button", { class: "btn btn-fantasma btn-piccolo", text: "Vengo qui", onclick: function () { cb.manda({ t: "squadra", s: k }); } }) : null ]),
        el("div", { class: "or-sq-membri" }, mem.length ? mem.map(function (p) {
          return el("span", { class: "or-membro" + (p.id === cb.myId ? " tu" : ""), text: (vm.capo[k] === p.id ? "👑 " : "") + p.nome + (p.id === cb.myId ? " (tu)" : "") });
        }) : [ el("span", { class: "or-vuota", text: "Nessuno: servono almeno 2" }) ]),
        io && io.team === k && vm.capo[k] !== cb.myId ? el("button", { class: "btn btn-fantasma btn-piccolo", text: "👑 Faccio io il capo", onclick: function () { cb.manda({ t: "capo" }); } }) : null ]));
    })(k);
    if (cb.sonoHost && !vm.vsBot) box.appendChild(el("button", { class: "btn btn-fantasma btn-piccolo", text: "🔀 Squadre a caso", onclick: function () { cb.manda({ t: "mischia" }); } }));
    // 🤖 in pochi: un tocco e si gioca contro il Bot (e se arrivano gli amici, un tocco e si torna alle squadre)
    if (cb.sonoHost && !vm.vsBot && vm.nsq === 2 && presenti >= 2 && presenti < MIN)
      box.appendChild(el("button", { class: "btn btn-primario btn-piccolo or-vsbot", text: "🤖 Siete in " + presenti + ": giocate contro il Bot", onclick: function () { cb.manda({ t: "vsbot", si: 1 }); } }));
    if (cb.sonoHost && vm.vsBot && presenti >= MIN)
      box.appendChild(el("button", { class: "btn btn-fantasma btn-piccolo or-vsbot", text: "👥 Siete in " + presenti + ": fate 2 squadre", onclick: function () { cb.manda({ t: "vsbot", si: 0 }); } }));
    var ok = prontiVm(vm), min = minVm(vm);
    var nota = vm.vsBot ? "Contro il Bot: almeno 2 giocatori (un capo e chi indovina). Dopo ogni vostro turno il Bot scopre da solo una sua parola." : vm.nsq === 3 ? "A 3 squadre: almeno 6 giocatori, 2 per squadra." : "Almeno 4 giocatori, 2 per squadra (in 2 o 3 si gioca contro il Bot).";
    var info = [];
    if (vm.mazzo && vm.mazzo !== "classico") info.push("Mazzo " + nomeMazzo(vm.mazzo));
    if (vm.ritmo === "veloce") info.push("⚡ Ritmo veloce");
    if (vm.oro) info.push("⭐ Parola d'oro accesa");
    if (vm.intendi) info.push("🤔 Cosa intendevi?");
    if (vm.tempo) info.push("⏳ " + testoSec(vm.tempo) + " per l'indizio");
    if (vm.tempoInd) info.push("⏳ " + testoSec(vm.tempoInd) + " per indovinare");
    if (vm.gruppoN) info.push("📝 " + vm.gruppoN + (vm.gruppoN === 1 ? " parola vostra" : " parole vostre") + ((vm.gruppoDa || []).length ? " (di " + vm.gruppoDa.slice(0, 4).join(", ") + (vm.gruppoDa.length > 4 ? "…" : "") + ")" : "") + ", " + nomeQuante(vm.quante || 5));
    if (info.length) nota += " " + info.join(" · ") + ".";
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: min,
      vuoti: Math.max(0, min - umani.length),   // solo i posti che mancano per cominciare
      giocatori: umani.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.hostId ? p.id === vm.hostId : i === 0, tu: p.id === cb.myId }; }),
      extra: [ box ], puoComincia: ok,
      spettatore: !cb.sonoHost && !io && (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta guardi" : null,   // nella Sala: non scelto, guarda
      nota: ok ? (vm.vsBot ? "Tutti insieme contro " + nomeBot(vm) + ": dopo ogni vostro turno scopre da solo una sua parola. Il capo ha la 👑." : "Ognuno sceglie la sua squadra; il capo ha la 👑.") + (info.length ? " " + info.join(" · ") + "." : "") : nota, testoComincia: "Comincia ▶",
      attesa: "Scegli la tua squadra e aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  // Lo schermo di gioco nello STUDIO TV (come gli altri giochi di Quiz & parole):
  // - in alto, ai lati del maxischermo, i capi sui loro podi (del colore della squadra);
  // - sul maxischermo il tabellone nello stile pulito e moderno: squadre con le faccine, indizio, caselle, chat della partita;
  // - in basso un bancone grande per squadra, con tutti i giocatori dietro;
  // - quando il capo dà l'indizio la telecamera va su di lui, l'indizio esce da una vignetta sopra la sua testa, poi torna al tabellone.
  var ST = null;
  function postiCapi(S, n) {   // i podi dei capi: in alto a sinistra e a destra (il terzo sotto a sinistra)
    var VW = S.VW, VH = S.VH, w = 0.34 * VW;
    var p = [{ cx: 0.245 * VW, top: 0.12 * VH, w: w, fila: 0 }, { cx: 1.755 * VW, top: 0.12 * VH, w: w, fila: 0 }, { cx: 0.245 * VW, top: 0.6 * VH, w: 0.3 * VW, fila: 0 }];
    return p.slice(0, Math.max(1, n));
  }
  function capiDi(ui, vm, cb) {   // chi sta sui podi (e se uno di loro sono io)
    var om = (cb.omini && cb.omini()) || {}, lista = [], io = -1, k2 = [];
    for (var k = 0; k < vm.nsq; k++) {
      var p = trova(vm, vm.capo[k]);
      lista.push({ nome: p ? p.nome : SQ[k].nome, omino: p ? (om[p.id] || null) : null, col: SQ[k].col });
      if (p && p.id === cb.myId) io = k;
      k2.push(p ? p.id : "");
    }
    return { lista: lista, io: io, k: k2.join(",") + "|" + nAvatar(om) + "|" + cb.myId };
  }
  function posizionaBanchi(ui, S) {   // i banconi delle squadre, in basso (si risistemano se cambia la misura dello schermo)
    if (!ui.banchi || !ui.banchi.length) return;
    var n = ui.banchi.length, VW = S.VW, VH = S.VH, larg = 1.92 * VW / n;
    ui.banchi.forEach(function (B, k) {
      var w = larg - 0.05 * VW, x = 0.04 * VW + k * larg + 0.025 * VW, top = 1.24 * VH, h = 0.52 * VH, s = B.el.style;
      if (n === 1) { w = 1.3 * VW; x = VW - w / 2; }   // (contro il Bot: un bancone solo, al centro)
      B.box = { x: x, y: top, w: w, h: h };
      s.left = x + "px"; s.top = top + "px"; s.width = w + "px"; s.height = h + "px"; s.fontSize = (Math.min(w, 0.92 * VW) * 0.045).toFixed(1) + "px";
    });
  }
  function srcAvatarBanco(ui, id, nome, faccia) {   // l'avatar di chi sta al bancone (anche con la faccia contenta o triste), come immagine
    var om = (ui.cb.omini && ui.cb.omini()) || {}, k = id + "|" + (faccia || "") + "|" + (om[id] ? 1 : 0);
    ui.facceB = ui.facceB || {};
    if (!ui.facceB[k]) { var svg = ST.avatarDi({ nome: nome, omino: om[id] || null }, faccia); ui.facceB[k] = svg ? "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) : ""; }
    return ui.facceB[k];
  }
  function aggiornaBanchi(ui, vm) {
    var om = (ui.cb.omini && ui.cb.omini()) || {};
    ui.banchi.forEach(function (B, k) {
      var mem = vm.players.filter(function (p) { return p.team === k && p.id !== vm.capo[k]; });
      var key = mem.map(function (p) { return p.id + (p.via ? "-" : "") + (B.facce[p.id] || ""); }).join(",") + "|" + nAvatar(om);
      if (key === B.k) return;
      B.k = key;
      while (B.gente.firstChild) B.gente.removeChild(B.gente.firstChild);
      mem.forEach(function (p) {
        B.gente.appendChild(ui.el("div", { class: "or-persona" + (p.via ? " via" : "") + (B.facce[p.id] === "evviva" ? " evviva" : ""), "data-id": p.id }, [
          ui.el("img", { src: srcAvatarBanco(ui, p.id, p.nome, B.facce[p.id]), alt: "" }), ui.el("span", { text: p.nome }) ]));
      });
    });
  }
  // la regia: le scene della telecamera una dopo l'altra, senza accavallarsi (se ne arrivano troppe, le vecchie si saltano)
  function scena(ui, passi, subito) {   // subito = taglia la scena in corso (es. la suspense di una parola, la fine)
    if (subito) {
      (ui.tScena || []).forEach(clearTimeout); ui.tScena = []; ui.coda = []; ui.inScena = false; if (ui.vignetta) ui.vignetta.classList.remove("su");
      try { ST.viaTerzo(ui.S); } catch (e) {}   // (una presentazione tagliata a metà non lascia la scritta «Il capo dei Blu» sopra tutto)
    }
    ui.coda.push(passi);
    while (ui.coda.length > 2) ui.coda.shift();
    if (!ui.inScena) prossimaScena(ui);
  }
  function prossimaScena(ui) {
    var passi = ui.coda.shift(); if (!passi || !ui.S.vivo()) { ui.inScena = false; return; }
    ui.inScena = true; var t0 = 0; ui.tScena = [];
    var f = ui.veloce ? 0.6 : 1;   // ⚡ ritmo veloce: le scene della telecamera durano meno
    passi.forEach(function (p) { t0 += Math.round(p[0] * f); ui.tScena.push(setTimeout(function () { if (ui.S.vivo()) p[1](); }, t0)); });
    ui.tScena.push(setTimeout(function () { prossimaScena(ui); }, t0 + 60));
  }
  function scenaSospeso(ui, vm, s) {   // chi gira la parola la dice: vignetta sopra la sua testa al bancone; poi la casella trema e il pubblico fa "ooooh"
    var S = ui.S, B = ui.banchi[s.k], parola = (vm.tab[s.i] || {}).w || "", passi = [];
    if (s.id === BOT_ID) {   // 🤖 il Bot dal suo podio dice la parola che scopre
      scena(ui, [[0, function () { ST.suLeggio(S, s.k, 450); ST.faccia(S, s.k, "pensa"); }],
        [450, function () { fumettoCapo(ui, s.k, "🤖 " + parola + "!"); suona("indizio"); }],
        [s.lungo ? 1100 : 500, function () { ui.vignetta.classList.remove("su"); ST.faccia(S, s.k, null); ST.suSchermo(S, 400); }],
        [400, function () { if (s.lungo) ST.FX.ohh(); }], [200, function () {}]], true);
      return;
    }
    if (!s.lungo) {   // 🎬 una parola "normale" (la squadra va sicura): resta il tabellone, la casella trema un attimo
      scena(ui, [[0, function () { ST.suSchermo(S, 250); }], [250, function () {}]], true);
      return;
    }
    var persona = B ? B.gente.querySelector("[data-id='" + s.id + "']") : null;
    function dove() { var b = B.box; return { x: b.x + persona.offsetLeft + persona.offsetWidth / 2, y: b.y + persona.offsetTop, b: b }; }
    if (B && persona) {
      passi.push([0, function () {
        var d = dove(), w = Math.min(d.b.w * 1.05, S.VW * 0.95), h = w * S.VH / S.VW;
        ST.inquadra(S, function () { return { x: d.x - w / 2, y: d.b.y + d.b.h * 0.42 - h / 2, w: w, h: h }; }, 450);
      }]);
      passi.push([450, function () {
        var d = dove(), V = ui.vignetta;
        V.style.left = d.x + "px"; V.style.top = (d.y + 2) + "px"; V.style.fontSize = (d.b.w * 0.07).toFixed(1) + "px";
        while (V.firstChild) V.removeChild(V.firstChild);
        V.appendChild(document.createTextNode(parola + "!")); V.style.setProperty("--c", SQ[s.k].col);
        V.classList.add("su"); suona("indizio");
      }]);
      passi.push([750, function () { ui.vignetta.classList.remove("su"); ST.suSchermo(S, 400); }]);
    } else passi.push([0, function () { ST.suSchermo(S, 300); }]);
    passi.push([400, function () { ST.FX.ohh(); }]);   // intanto la casella trema (classe "sospesa")
    passi.push([300, function () {}]);
    scena(ui, passi, true);
  }
  function scenaTurno(ui, k) {   // tocca a una squadra: un attimo sul suo capo che ci pensa, poi il tabellone
    var S = ui.S;
    scena(ui, [[0, function () { ST.suLeggio(S, k, 650); ST.faccia(S, k, "pensa"); }],
      [1350, function () { ST.faccia(S, k, null); ST.suSchermo(S, 650); }], [650, function () {}]]);
  }
  function scenaIndizio(ui, k, testo, n) {   // il capo dà l'indizio: telecamera su di lui, l'indizio esce dalla vignetta, poi il tabellone
    var S = ui.S;
    scena(ui, [[0, function () { ST.suLeggio(S, k, 650); }],
      [650, function () {
        var p = S.posti[k] || S.posti[0], V = ui.vignetta;
        V.style.left = p.cx + "px"; V.style.top = (p.top + p.w * 0.04) + "px"; V.style.fontSize = (p.w * 0.13).toFixed(1) + "px";
        while (V.firstChild) V.removeChild(V.firstChild);
        V.appendChild(document.createTextNode(testo)); V.appendChild(ui.el("span", { class: "n", text: n === 0 ? "∞" : String(n) }));
        V.style.setProperty("--c", SQ[k] ? SQ[k].col : "#1f1f1f");
        V.classList.add("su"); ST.faccia(S, k, "esulta"); suona("indizio");
      }],
      [1900, function () { ui.vignetta.classList.remove("su"); ST.faccia(S, k, null); ST.suSchermo(S, 650); }], [650, function () {}]]);
  }
  function scenaFine(ui, k) {   // chi vince: coriandoli, applausi e telecamera sul bancone della squadra (tutti contenti), poi il tabellone svelato
    var S = ui.S, B = ui.banchi[k];
    if (ui.vm && ui.vm.vsBot && k === 1) {   // 🤖 ha vinto il Bot: niente coriandoli, lui esulta sul podio e voi vi disperate
      scena(ui, [[0, function () {
          ST.suLeggio(S, 1, 700); ST.faccia(S, 1, "esulta"); try { ST.FX.ohh(); } catch (e) {}
          var B0 = ui.banchi[0];
          if (B0) { B0.facce = {}; (ui.vm.players || []).forEach(function (p) { if (p.team === 0) B0.facce[p.id] = "triste"; }); aggiornaBanchi(ui, ui.vm); }
        }],
        [900, function () { fumettoCapo(ui, 1, "🤖 Ho vinto io!"); }],
        [1900, function () { ui.vignetta.classList.remove("su"); ST.suSchermo(S, 900); }], [900, function () {}]], true);
      return;
    }
    scena(ui, [[0, function () {
        ST.coriandoli(); ST.FX.applauso("forte"); ST.faccia(S, k, "esulta");
        if (B) {
          (ui.vm.players || []).forEach(function (p) { if (p.team === k) B.facce[p.id] = "esulta"; });
          aggiornaBanchi(ui, ui.vm);
          ST.inquadra(S, function () { var b = B.box, w = b.w * 1.15, h = w * S.VH / S.VW; return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w: w, h: h }; }, 900);
        }
      }],
      [2800, function () { ST.suSchermo(S, 900); }], [900, function () {}]], true);
  }
  // la telecamera sul bancone di una squadra (tutti i giocatori dentro l'inquadratura)
  function suBanco(ui, k, ms) {
    var S = ui.S, B = ui.banchi[k]; if (!B) return;
    ST.inquadra(S, function () { var b = B.box, w = b.w * 1.15, h = w * S.VH / S.VW; return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w: w, h: h }; }, ms);
  }
  function festaBanco(ui, k, si) {   // la squadra al bancone esulta col braccio alzato (o torna normale)
    var B = ui.banchi[k], vm = ui.vm; if (!B) return;
    B.facce = {};
    if (si) (vm.players || []).forEach(function (p) { if (p.team === k && p.id !== vm.capo[k]) B.facce[p.id] = "evviva"; });
    aggiornaBanchi(ui, vm);
  }
  function fumettoCapo(ui, k, testo) {   // il capo dice qualcosa dal suo podio (la stessa vignetta dell'indizio)
    var S = ui.S, p = S.posti[k] || S.posti[0], V = ui.vignetta;
    V.style.left = p.cx + "px"; V.style.top = (p.top + p.w * 0.04) + "px"; V.style.fontSize = (p.w * 0.12).toFixed(1) + "px";
    while (V.firstChild) V.removeChild(V.firstChild);
    V.appendChild(document.createTextNode(testo)); V.style.setProperty("--c", SQ[k] ? SQ[k].col : "#1f1f1f");
    V.classList.remove("su"); void V.offsetWidth; V.classList.add("su");
  }
  // 💭 a fine turno, sopra il tabellone: «Paky pensava a: ONDA ✓ SALE ✓ +1 🤫» con la battuta dello studio (dopo la reazione
  // della squadra; a fine partita no: lì c'è «🤔 Cosa intendevi?» con tutto)
  function mostraPensava(ui, e) {
    if (!ui.vm || ui.vm.fase !== "gioco") return;
    var el = ui.el, ok = e.ok || [], n = e.nasc || 0, sq = SQ[e.k] || SQ[0];
    var battuta = !ok.length ? "🤫 Nessuna trovata: si scopre a fine partita!" : !n ? (ok.length >= 2 ? "🧠 Sintonia perfetta!" : "🧠 Proprio quella!") : "🤝 Quasi! " + (n === 1 ? "Una resta segreta" : n + " restano segrete") + " fino alla fine";
    if (!ui.pensEl) { ui.pensEl = el("div", { class: "or-pens" }); ui.S.vista.appendChild(ui.pensEl); }
    var P = ui.pensEl;
    clearTimeout(ui.tPens); clearTimeout(ui.tPens2);
    ui.tPens = setTimeout(function () {
      if (!ui.S.vivo() || !ui.vm || ui.vm.fase !== "gioco") return;
      while (P.firstChild) P.removeChild(P.firstChild);
      P.style.setProperty("--c", sq.col);
      P.appendChild(el("div", { class: "or-pens-tit" }, [ faccia(ui, e.id, e.nome), el("b", { text: "💭 " + e.nome + " pensava a:" }) ]));
      P.appendChild(el("div", { class: "or-pens-w" }, ok.map(function (w) { return el("span", { class: "or-pens-c", text: w + " ✓" }); })
        .concat(n ? [ el("span", { class: "or-pens-c segreta", text: (ok.length ? "+" : "") + n + " 🤫" }) ] : [])));
      P.appendChild(el("div", { class: "or-pens-bat", text: battuta }));
      P.classList.add("su"); suona(ok.length && !n ? "giusta" : "indizio");
      if (ok.length && !n) { var io = trova(ui.vm, ui.cb.myId); if (io && io.team === e.k) try { if (navigator.vibrate) navigator.vibrate(30); } catch (x) {} }   // sintonia perfetta: un colpetto alla squadra
      ui.tPens2 = setTimeout(function () { P.classList.remove("su"); }, ui.veloce ? 2600 : 3600);
    }, ui.veloce ? 700 : 1500);
  }
  // una parola girata. Giusta (o d'oro): la telecamera va sul bancone della squadra, che esulta col braccio alzato.
  // Sbagliata: la telecamera va sul capo, che si arrabbia (con la parola nera esplode). Poi si torna al tabellone.
  function reazione(ui, vm, e) {
    var S = ui.S, giusta = e.oro || e.c === e.k, nera = e.c === "x", B = ui.banchi[e.k];
    // una parola giusta ma il turno continua: si resta sul tabellone (lampo e applauso), così il ritmo non cala;
    // la scena intera solo per l'ultima del turno, la parola d'oro e gli sbagli
    if (giusta && !e.oro && vm.fase === "gioco" && vm.turno === e.k && vm.passo === "indovina") return;
    if (giusta) {
      scena(ui, [[0, function () { ST.faccia(S, e.k, "esulta"); festaBanco(ui, e.k, true); suBanco(ui, e.k, 550); }],
        [1700, function () { ST.faccia(S, e.k, null); festaBanco(ui, e.k, false); ST.suSchermo(S, 550); }], [550, function () {}]]);
      return;
    }
    scena(ui, [[0, function () {
        if (B && e.id !== ui.vm.capo[e.k]) { B.facce = {}; B.facce[e.id] = nera ? "esploso" : "triste"; aggiornaBanchi(ui, ui.vm); }
        ST.suLeggio(S, e.k, 550); ST.faccia(S, e.k, nera ? "esploso" : "arrabbiato");
      }],
      [600, function () { fumettoCapo(ui, e.k, nera ? "💣 Noooo!" : ["💢 Ma no!", "💢 Uffa!", "💢 Nooo!", "💢 Ma dai!"][Math.floor(Math.random() * 4)]); }],
      [1300, function () { ui.vignetta.classList.remove("su"); ST.faccia(S, e.k, null); if (B) { B.facce = {}; aggiornaBanchi(ui, ui.vm); } ST.suSchermo(S, 550); }],
      [550, function () {}]]);
  }
  // all'inizio della partita: tutto lo studio, poi ogni squadra al suo bancone (esultano), poi i capi sui podi,
  // uno per uno; dopo, la telecamera va sul capo che comincia (scenaTurno)
  function presentazione(ui) {
    var S = ui.S, vm = ui.vm, passi = [[0, function () { ST.largo(S, 0); }], [1100, function () {}]];
    ui.banchi.forEach(function (B, k) {
      var nomi = (vm.players || []).filter(function (p) { return p.team === k && p.id !== vm.capo[k] && !p.via; }).map(function (p) { return p.nome; });
      if (!nomi.length) return;
      passi.push([0, function () { festaBanco(ui, k, true); suBanco(ui, k, 700); ST.terzo(S, null, "I " + SQ[k].nome + "!", nomi.join(" · "), "👥"); ST.FX.applauso("piano"); }]);
      passi.push([1800, function () { festaBanco(ui, k, false); }]);
    });
    for (var k = 0; k < vm.nsq; k++) (function (k) {
      var capo = trova(vm, vm.capo[k]); if (!capo) return;
      passi.push([0, function () { ST.suLeggio(S, k, 700); ST.faccia(S, k, "esulta"); if (vm.vsBot && k === 1) ST.terzo(S, k, capo.nome, "Il vostro avversario (Bot)", "🤖"); else ST.terzo(S, k, capo.nome, "Il capo dei " + SQ[k].nome, "👑"); }]);
      passi.push([1600, function () { ST.faccia(S, k, null); }]);
    })(k);
    passi.push([0, function () { ST.viaTerzo(S); }], [100, function () {}]);
    scena(ui, passi, true);
  }
  function creaSchermo(t, vm, cb) {
    stile(); ST = window.SGStudio;
    var el = t.el;
    var ui = { t: t, el: el, bid: vm.bid, cb: cb, vm: vm, carte: [], kSotto: "", pan: [], ultimaN: vm.ultima ? vm.ultima.n : 0, facce: {}, logN: 0,
      nsq: vm.nsq, banchi: [], coda: [], inScena: false, avviato: false, turnoVisto: null, veloce: vm.ritmo === "veloce" };
    var capi = capiDi(ui, vm, cb);
    ui.kCapi = capi.k;
    if (window.__ORDINE) window.__ORDINE.ui = ui;   // (per le prove)
    ui.S = ST.crea(t, capi.lista, { io: capi.io, esci: function () { ui.cb.onEsci(true); }, titolo: "Parola d'ordine", logo: ["PAROLA", "D'ORDINE"],
      posti: function (S) { return postiCapi(S, ui.nsq); }, dopoLayout: function (S) { posizionaBanchi(ui, S); adattaScritte(ui); } });
    var S = ui.S;
    S.vista.classList.add("or-studio");
    if (t.guarda && !t.eliminazione) S.vista.classList.add("st-con-targa");   // chi guarda soltanto: il posto della targhetta del core in basso
    // il tabellone finisce sopra la barra dei tasti anche quando la barra cresce da sola (es. «👥 Avete giocato con» che arriva dopo)
    try { if (window.ResizeObserver && S.barraEl) new ResizeObserver(function () { if (S.barraEl.offsetHeight) S.vista.style.setProperty("--or-barra", (S.barraEl.offsetHeight + 6) + "px"); }).observe(S.barraEl); } catch (e) {}
    for (var k = 0; k < vm.nsq; k++) ST.testoLeggio(S, k, nomeSq(vm, k).toUpperCase());
    // il maxischermo: squadre con le faccine, indizio, tabellone, chat
    var pannelli = el("div", { class: "or-pannelli" });
    for (k = 0; k < vm.nsq; k++) {
      var P = { n: el("b", { class: "or-pan-n" }), facce: el("div", { class: "or-facce" }), kf: "" };
      P.el = el("div", { class: "or-pan", style: "--c:" + SQ[k].col }, [ el("div", { class: "or-pan-testa" }, [ el("span", { text: (vm.vsBot && k === 1 ? "🤖 " : "") + nomeSq(vm, k) }), P.n ]), P.facce ]);
      ui.pan.push(P); pannelli.appendChild(P.el);
    }
    ui.ind = el("div", { class: "or-ind" });
    ui.tab = el("div", { class: "or-tab" + (vm.tab.length <= 20 ? " venti" : "") });
    vm.tab.forEach(function (c, i) {
      var w = el("span", { class: "or-w", text: c.w }), pr = el("span", { class: "or-pr" }), hint = el("span", { class: "or-hint", text: "tocca ancora" });
      var b = el("button", { class: "or-carta" }, [ w, pr, hint ]);
      var L = c.w.length; w.style.fontSize = L <= 6 ? "clamp(10px,3.1vw,14px)" : L <= 8 ? "clamp(9px,2.7vw,13px)" : "clamp(8px,2.3vw,11.5px)";   // (poi adattaScritte la misura giusta)
      b.addEventListener("click", function () { tocca(ui, i); });
      ui.carte.push({ b: b, pr: pr, w: w, parola: c.w, cls: "" }); ui.tab.appendChild(b);
    });
    ui.log = el("div", { class: "or-log" });
    ST.vuota(S.sch);
    S.sch.appendChild(el("div", { class: "or-sch" }, [ pannelli, ui.ind, ui.tab, ui.log ]));
    // i banconi delle squadre e la vignetta del capo, nello studio
    ui.banchiEl = el("div", { class: "or-banchi" }); S.mondo.appendChild(ui.banchiEl);
    for (k = 0; k < vm.nsq; k++) {
      if (vm.vsBot && k === 1) continue;   // (il Bot non ha un bancone: sta sul suo podio)
      var B = { gente: el("div", { class: "or-banco-gente" }), facce: {}, k: "" };
      B.el = el("div", { class: "or-banco", style: "--c:" + SQ[k].col }, [ B.gente, el("div", { class: "or-banco-fronte" }, [ el("span", { text: SQ[k].nome.toUpperCase() }) ]) ]);
      ui.banchiEl.appendChild(B.el); ui.banchi.push(B);
    }
    posizionaBanchi(ui, S);
    ui.vignetta = el("div", { class: "or-vignetta" }); S.mondo.appendChild(ui.vignetta);
    // in basso i tasti (nella barra dello studio), e un avviso che compare sopra
    ui.sotto = el("div", { class: "or-sotto" });
    ST.barra(S, [ ui.sotto ]);
    ui.msg = el("div", { class: "or-toast" }); S.vista.appendChild(ui.msg);
    // i conti alla rovescia (attesa di chi manca, clessidra del capo): cambia solo il numero, una volta al secondo
    ui.conti = {};
    ui.tConti = setInterval(function () {
      if (!S.vivo()) { clearInterval(ui.tConti); return; }
      Object.keys(ui.conti).forEach(function (k) {
        var c = ui.conti[k]; if (!c.el.isConnected) return; var resta = c.fino - Date.now(), tx = mmss(resta); if (c.el.textContent !== tx) c.el.textContent = tx;
        if (k === "cless") {   // ⏳ gli ultimi 10 secondi: rossa, e il tic a chi ha la clessidra
          var rosso = resta <= 10000 && resta > 0, box = c.el.parentNode;
          if (box && box.classList.contains("or-cless") && box.classList.contains("rosso") !== rosso) box.classList.toggle("rosso", rosso);
          if (rosso && ui.ticMio) suona("tic");
        }
      });
    }, 1000);
    // all'inizio di una partita uno sguardo a tutto lo studio, poi il tabellone
    ST.suSchermo(S, 0);
    adattaScritte(ui); setTimeout(function () { adattaScritte(ui); }, 80);   // (appena lo schermo ha le sue misure)
    if ((vm.log || []).length <= 1 && vm.fase === "gioco") presentazione(ui);   // all'inizio: si presentano tutti
    return ui;
  }
  // la scritta di ogni casella: la più grande che ci sta (misurata davvero), da 9 a 14,5 px
  var misuratore = null;
  function adattaScritte(ui) {
    if (!ui.carte || !ui.carte.length) return;
    var w0 = ui.carte[0].b.clientWidth - 6; if (w0 <= 0) return;
    if (!misuratore) misuratore = document.createElement("canvas").getContext("2d");
    var cs = getComputedStyle(ui.carte[0].w);
    misuratore.font = "800 100px " + cs.fontFamily;
    ui.carte.forEach(function (C) {
      var largo = 0;
      String(C.parola).split(" ").forEach(function (p) { largo = Math.max(largo, misuratore.measureText(p).width * 0.98 / 100); });   // (lettere un po' strette)
      var fs = Math.max(9, Math.min(14.5, (C.b.clientWidth - 6) / (largo || 1)));
      C.w.style.fontSize = fs.toFixed(1) + "px";
    });
  }
  // un conto alla rovescia che si aggiorna da solo (ms = quanto manca adesso)
  function conto(ui, nome, ms) {
    var c = ui.conti[nome];
    if (!c) c = ui.conti[nome] = { el: ui.el("b", { class: "or-conto" }) };
    c.fino = Date.now() + ms; c.el.textContent = mmss(ms);
    return c.el;
  }
  // chi sono io in questa partita
  function ruolo(vm, cb) {
    var io = trova(vm, cb.myId), team = io ? io.team : -1;
    var capo = team >= 0 && vm.capo[team] === cb.myId;
    var capoVia = team >= 0 && vm.fase === "gioco" && vm.fuori.indexOf(team) < 0 && (function () { var c = trova(vm, vm.capo[team]); return !c || c.via; })();
    // altri = in squadra c'è ancora qualcuno oltre a me che può indovinare (se no fare il capo non serve)
    var altri = team >= 0 && vm.players.some(function (p) { return p.team === team && !p.via && p.id !== cb.myId && p.id !== vm.capo[team]; });
    var prossimo = (vm.prossimi || []).some(function (p) { return p.id === cb.myId; });
    // 🤔 io capo ho appena dato l'indizio: posso dire (di nascosto) quali parole intendevo, finché la squadra cerca
    var ind = vm.indizio, intendo = vm.fase === "gioco" && !!vm.intendi && capo && team === vm.turno && vm.passo === "indovina" &&
      !!ind && ind.id === cb.myId && ind.x != null && !INTESI[vm.bid + "|" + ind.x];
    // 👑 posso fare io il capo: solo se la mia squadra l'ha aspettato 3 minuti e non è tornato
    var prendi = capoVia && altri && !!vm.attesa && vm.attesa.k === team && !!vm.attesa.capo && !!vm.attesa.scad;
    return { io: io, team: team, capo: capo, capoVia: capoVia, altri: altri, prendi: prendi, prossimo: prossimo, mioTurno: vm.fase === "gioco" && team === vm.turno,
      indovino: vm.fase === "gioco" && team === vm.turno && !capo && vm.passo === "indovina", intendo: intendo };
  }
  function segnata(vm, id, i) { var l = vm.prop && vm.prop[id]; return l != null && [].concat(l).indexOf(i) >= 0; }   // la parola i è tra quelle segnate da id?
  // 🤔 le parole che il capo sta segnando come "intese" (solo sul suo telefono, finché non tocca «Fatto»)
  var INTESI = {}, SEL = { k: "", l: [] };
  function selDi(vm) { var k = vm.bid + "|" + (vm.indizio ? vm.indizio.x : ""); if (SEL.k !== k) SEL = { k: k, l: [] }; return SEL.l; }
  function maxSel(vm) { return vm.indizio && vm.indizio.n > 0 ? vm.indizio.n : 9; }
  function tocca(ui, i) {
    var vm = ui.vm, r = ruolo(vm, ui.cb), c = vm.tab[i];
    if (r.intendo && c) {
      var key = ui.cb.chiave(), col = c.c != null ? c.c : key ? key[i] : null;
      if (col !== r.team) { avviso("Tocca le parole della tua squadra (" + SQ[r.team].nome + ")"); return; }
      if (c.g) {   // una parola già girata vale solo se l'ha girata la squadra con questo indizio
        var log = vm.log || [], da = -1;
        log.forEach(function (e, j) { if (e.t === "ind") da = j; });
        if (!log.slice(da + 1).some(function (e) { return e.t === "gira" && e.w === c.w; })) { avviso("Quella era già girata prima: tocca quelle ancora coperte"); return; }
      }
      var l = selDi(vm), j = l.indexOf(i), max = maxSel(vm);
      if (j >= 0) l.splice(j, 1);
      else if (l.length >= max) { avviso("Al massimo " + max + (max === 1 ? " parola: togli prima l'altra" : " parole: togline una")); return; }
      else l.push(i);
      aggiorna(ui, vm, ui.cb);   // (cambia solo il bordo delle caselle e il numero sul tasto)
      return;
    }
    if (!r.indovino || !c || c.g) return;
    if (segnata(vm, ui.cb.myId, i)) ui.cb.manda({ t: "gira", i: i });   // secondo tocco su una parola che ho già segnato: si gira
    else ui.cb.manda({ t: "proponi", i: i });
  }
  // la faccina di un giocatore: l'avatar diventa un'immagine una volta sola e poi si riusa ovunque (squadre, chat, caselle)
  function srcFaccia(ui, id) {
    var cfg = (ui.cb.omini && ui.cb.omini() || {})[id];
    if (!cfg || !window.SGOmino) return null;
    var k = id + "|" + JSON.stringify(cfg).length;
    if (!ui.facce[k]) ui.facce[k] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(cfg, { busto: true }));
    return ui.facce[k];
  }
  function faccia(ui, id, nome, cls) {
    var src = srcFaccia(ui, id);
    return ui.el("span", { class: "or-f" + (cls ? " " + cls : "") }, [ src ? ui.el("img", { src: src, alt: nome || "" }) : ui.el("b", { text: String(nome || "?").charAt(0).toUpperCase() }) ]);
  }
  function testaAvatar(ui, id, nome, team) {   // le faccine sulle caselle proposte: si vede chi vorrebbe girare la parola
    var src = srcFaccia(ui, id);
    return "<span class='or-av' style='--c:" + (SQ[team] ? SQ[team].col : "#888") + "'>" + (src ? "<img src='" + src + "' alt=''>" : "<b>" + String(nome || "?").charAt(0).toUpperCase() + "</b>") + "</span>";
  }
  // una riga della chat della partita
  function rigaLog(ui, vm, e) {
    var el = ui.el, col = SQ[e.k] ? SQ[e.k].col : "#888";
    if (e.t === "via") return el("div", { class: "or-l sis" }, [ el("span", { text: "Cominciano i " + SQ[e.k].nome }) ]);
    if (e.t === "fine") return el("div", { class: "or-l sis fine" }, [ el("span", { text: e.testo || "🎉 Vincono i " + SQ[e.k].nome + "!" }) ]);
    if (e.t === "pens") {   // 💭 a fine turno: le parole a cui pensava il capo (quelle trovate; le altre restano segrete)
      return el("div", { class: "or-l or-l-pens" }, [ faccia(ui, e.id, e.nome), el("span", { class: "or-l-nome", style: "color:" + col, text: e.nome }), el("span", { class: "or-l-txt", text: "💭 pensava a" }) ]
        .concat((e.ok || []).map(function (w) { return el("span", { class: "or-l-w c" + e.k, text: w + " ✓" }); }))
        .concat(e.nasc ? [ el("span", { class: "or-l-nasc", text: (e.ok && e.ok.length ? "+" : "") + e.nasc + " 🤫" }) ] : []));
    }
    if (e.t === "sis") return el("div", { class: "or-l sis" }, [ el("span", { text: e.testo || "" }) ]);   // avvisi: capo nuovo, turno saltato, tempo scaduto, riepilogo
    var testa = [ faccia(ui, e.id, e.nome), el("span", { class: "or-l-nome", style: "color:" + col, text: e.nome }) ];
    if (e.t === "ind") return el("div", { class: "or-l" }, testa.concat([ el("span", { class: "or-l-txt", text: "👑" }), el("span", { class: "or-l-ind", text: e.p + " " + (e.num === 0 ? "∞" : e.num) }) ]));
    if (e.t === "passo") return el("div", { class: "or-l" }, testa.concat([ el("span", { class: "or-l-txt", text: "passa" }) ]));
    var esito = e.oro ? "⭐ d'oro: si continua!" : e.c === "x" ? "💣 la parola nera!" : e.c === e.k ? "✓" : e.c === "n" ? "di nessuno" : "era dei " + SQ[e.c].nome;
    return el("div", { class: "or-l" }, testa.concat([ el("span", { class: "or-l-w c" + e.c + (e.oro ? " oro" : ""), text: e.w }), el("span", { class: "or-l-esito" + (e.c === e.k && !e.oro ? " ok" : ""), text: esito }) ]));
  }
  function aggiorna(ui, vm, cb) {
    var S = ui.S, r = ruolo(vm, cb), key = vm.fase === "gioco" && r.capo ? cb.chiave() : null, fine = vm.fase === "fine";
    // ---- i capi sui podi (se cambia un capo, o arrivano gli avatar, si rifanno i podi) ----
    var capi = capiDi(ui, vm, cb);
    if (capi.k !== ui.kCapi) { ui.kCapi = capi.k; S.impostaGiocatori(capi.lista, capi.io); for (var kk = 0; kk < vm.nsq; kk++) ST.testoLeggio(S, kk, nomeSq(vm, kk).toUpperCase()); }
    for (var kc = 0; kc < vm.nsq; kc++) { var pc = trova(vm, vm.capo[kc]); ST.fuori(S, kc, !pc || !!pc.via || vm.fuori.indexOf(kc) >= 0); }
    ST.accendiSolo(S, fine ? vm.vince : vm.turno);
    aggiornaBanchi(ui, vm);
    // ---- sul maxischermo, in alto: le squadre, quante parole mancano, le faccine (il capo con la corona) ----
    ui.pan.forEach(function (P, k) {
      var tx = String(vm.resto[k] != null ? vm.resto[k] : "");
      if (P.n.textContent !== tx) P.n.textContent = tx;
      P.el.classList.toggle("turno", !fine && vm.turno === k);
      P.el.classList.toggle("vince", fine && vm.vince === k);
      P.el.classList.toggle("fuori", vm.fuori.indexOf(k) >= 0);
      var mem = vm.players.filter(function (p) { return p.team === k; });
      mem.sort(function (a, b) { return (b.id === vm.capo[k]) - (a.id === vm.capo[k]); });   // il capo per primo
      var kf = mem.map(function (p) { return p.id + (p.via ? "-" : "") + (p.id === vm.capo[k] ? "*" : ""); }).join(",") + "|" + cb.myId + "|" + nAvatar(cb.omini && cb.omini());
      if (P.kf !== kf) {
        P.kf = kf;
        while (P.facce.firstChild) P.facce.removeChild(P.facce.firstChild);
        mem.forEach(function (p) { P.facce.appendChild(faccia(ui, p.id, p.nome, (p.id === vm.capo[k] ? "capo" : "") + (p.via ? " via" : "") + (p.id === cb.myId ? " tu" : ""))); });
      }
    });
    // ---- l'indizio, grande ----
    var ki;
    ui.veloce = vm.ritmo === "veloce";
    if (fine) ki = "f|" + vm.vince;
    else if (vm.passo === "bot") ki = "b|" + vm.turno;
    else if (vm.passo === "indizio") ki = "a|" + vm.turno + "|" + (r.mioTurno && r.capo) + "|" + !!vm.cless + "|" + (vm.cless ? vm.cless.doppio : "");
    else ki = "i|" + vm.turno + "|" + vm.indizio.parola + "|" + vm.indizio.n + "|" + vm.tentativi + "|" + !!vm.cless + "|" + (vm.cless ? vm.cless.doppio : "");
    if (ui.kInd !== ki) {
      ui.kInd = ki; var el = ui.el, I = ui.ind;
      while (I.firstChild) I.removeChild(I.firstChild);
      I.style.setProperty("--c", fine ? (SQ[vm.vince] || SQ[0]).col : SQ[vm.turno].col);
      // ⏳ la clessidra (del capo o di chi indovina): gli ultimi 10 secondi diventa rossa e fa tic
      var cl = function () { return el("span", { class: "or-cless" }, [ document.createTextNode((vm.cless.doppio ? "⏳ tempo doppio " : "⏳ ")), conto(ui, "cless", vm.cless.ms) ]); };
      if (fine) I.appendChild(el("div", { class: "or-ind-stato", text: vm.vince >= 0 ? (vm.vsBot ? (vm.vince === 0 ? "🎉 Avete battuto " + nomeBot(vm) + "!" : "🤖 Vince " + nomeBot(vm) + "!") : "🎉 Vincono i " + SQ[vm.vince].nome + "!") : "Partita finita" }));
      else if (vm.passo === "bot") I.appendChild(el("div", { class: "or-ind-stato", text: "🤖 " + nomeBot(vm) + " scopre una sua parola…" }));
      else if (vm.passo === "indizio") {
        I.appendChild(el("div", { class: "or-ind-stato", text: r.mioTurno && r.capo ? "👑 Tocca a te: dai l'indizio" : "Il capo dei " + SQ[vm.turno].nome + " pensa all'indizio…" }));
        if (vm.cless) I.appendChild(el("div", { class: "or-ind-tent" }, [ cl() ]));
      }
      else {
        I.appendChild(el("small", { text: "INDIZIO DEI " + SQ[vm.turno].nome.toUpperCase() }));
        I.appendChild(el("b", {}, [ document.createTextNode(vm.indizio.parola), el("span", { class: "n", text: vm.indizio.n === 0 ? "∞" : String(vm.indizio.n) }) ]));
        I.appendChild(el("div", { class: "or-ind-tent" }, [ document.createTextNode(vm.tentativi >= 99 ? "tentativi liberi" : "ancora " + vm.tentativi + (vm.tentativi === 1 ? " tentativo" : " tentativi")) ].concat(vm.cless ? [ document.createTextNode(" · "), cl() ] : [])));
      }
    }
    if (vm.cless && !fine) conto(ui, "cless", vm.cless.ms);   // il tempo giusto a ogni foto
    ui.ticMio = !fine && !!vm.cless && r.mioTurno && (vm.passo === "indizio" ? r.capo : !r.capo);   // (il tic lo sente chi ha la clessidra)
    if (vm.attesa && !fine) conto(ui, "attesa", vm.attesa.ms);
    // ---- il tabellone (solo le carte che cambiano) ----
    var chi = {};   // parola -> chi la propone
    Object.keys(vm.prop || {}).forEach(function (id) { [].concat(vm.prop[id]).forEach(function (i) { (chi[i] = chi[i] || []).push(id); }); });
    var sel = r.intendo ? selDi(vm) : null;   // 🤔 le parole che sto segnando come "intese"
    vm.tab.forEach(function (c, i) {
      var C = ui.carte[i], col = c.c != null ? c.c : (key ? key[i] : null);
      var cls = "or-carta" + (c.g ? " g" : "") + (col != null ? " c" + col : "") + (!c.g && key ? " chiave" : "") + (fine && !c.g ? " svelata" : "") + (c.oro ? " oro" : "") + (vm.sospeso && vm.sospeso.i === i && !c.g ? " sospesa" : "") +
        (r.indovino && !c.g && !vm.sospeso ? " attiva" : "") + (segnata(vm, cb.myId, i) && r.indovino ? " mia" : "") +
        (sel && col === r.team && !c.g ? " attiva" : "") + (sel && sel.indexOf(i) >= 0 ? " pensata" : "");
      if (C.cls !== cls) { C.b.className = cls; C.cls = cls; }
      var kp = (chi[i] || []).join(",") + "|" + nAvatar(cb.omini && cb.omini());   // si ridisegna anche quando arrivano gli avatar
      if (C.kp !== kp) {
        C.kp = kp;
        C.pr.innerHTML = (chi[i] || []).slice(0, 4).map(function (id) { var p = trova(vm, id); return testaAvatar(ui, id, p && p.nome, p ? p.team : -1); }).join("");
      }
    });
    // la parola appena girata: un piccolo scatto e il suo suono (uguale su tutti i telefoni)
    if (vm.ultima && vm.ultima.n !== ui.ultimaN) {
      ui.ultimaN = vm.ultima.n;
      var C = ui.carte[vm.ultima.i]; if (C) { C.b.classList.remove("appena"); void C.b.offsetWidth; C.b.classList.add("appena"); }
      suona(vm.ultima.oro ? "oro" : vm.ultima.c === "x" ? "nera" : vm.ultima.c === vm.ultima.k ? "giusta" : vm.ultima.c === "n" ? "neutra" : "sbagliata");
      if (ui.avviato && (vm.ultima.oro || vm.ultima.c === vm.ultima.k)) ST.FX.applauso("piano");   // giusta: il pubblico applaude
      if (ui.avviato && vm.ultima.c === "x") ST.scossa(ui.S);
    }
    // una parola appena scelta: la suspense (uguale su tutti i telefoni)
    if (vm.sospeso && vm.sospeso.n !== ui.sospN) { ui.sospN = vm.sospeso.n; if (ui.avviato) scenaSospeso(ui, vm, vm.sospeso); }
    // ---- la chat: si aggiungono solo le righe nuove, e si scende in fondo; con le righe nuove partono anche le scene ----
    // (se arrivano gli avatar dopo le righe, es. chi rientra, le righe già scritte si rifanno una volta con le facce giuste)
    var nOm = nAvatar(cb.omini && cb.omini());
    if (ui.logOm !== nOm) {
      if (ui.logOm != null && ui.logN) {
        while (ui.log.firstChild) ui.log.removeChild(ui.log.firstChild);
        (vm.log || []).forEach(function (e) { if (e.n <= ui.logN) ui.log.appendChild(rigaLog(ui, vm, e)); });
        ui.log.scrollTop = ui.log.scrollHeight;
      }
      ui.logOm = nOm;
    }
    var nuove = (vm.log || []).filter(function (e) { return e.n > ui.logN; });
    if (nuove.length) {
      nuove.forEach(function (e) {
        ui.log.appendChild(rigaLog(ui, vm, e)); ui.logN = e.n;
        if (!ui.avviato) return;   // aprendo lo schermo a partita iniziata (es. rientro) non si rifanno le scene vecchie
        if (e.t === "ind") scenaIndizio(ui, e.k, e.p, e.num);
        else if (e.t === "gira") reazione(ui, vm, e);
        else if (e.t === "fine") { ui.finita = true; ui.fineOra = Date.now(); scenaFine(ui, e.k); }
        else if (e.t === "pens") mostraPensava(ui, e);
      });
      while (ui.log.children.length > 60) ui.log.removeChild(ui.log.firstChild);
      ui.log.scrollTop = ui.log.scrollHeight;
    }
    // tocca a una squadra nuova: un attimo sul suo capo
    if (vm.fase === "gioco" && vm.passo === "indizio" && ui.turnoVisto !== vm.turno + "|" + vm.storia.length) {
      var primaVolta = ui.turnoVisto === null; ui.turnoVisto = vm.turno + "|" + vm.storia.length;
      if (!primaVolta || (vm.log || []).length <= 1) { var tc = trova(vm, vm.capo[vm.turno]); if (tc && !tc.via) scenaTurno(ui, vm.turno); }
    }
    ui.avviato = true;
    // ---- in basso: cosa posso fare io (si ricostruisce solo se cambia il mio ruolo o la fase) ----
    // (mentre il capo segna le parole che intendeva, la sua barra resta quella: niente lampeggi a ogni parola girata)
    var ks = r.intendo ? ["int", vm.bid, vm.indizio.x, vm.attesa ? vm.attesa.k + "/" + vm.attesa.chi + (vm.attesa.scad ? "/s" : "") : "", r.prendi, cb.sonoHost && puoChiudere(vm), !!cb.sonoHost].join("|")
      : [vm.fase, vm.passo, vm.turno, r.team, r.capo, vm.girate > 0, vm.fuori.join(""), !!vm.sospeso, r.prendi,
      vm.attesa ? vm.attesa.k + "/" + vm.attesa.chi + (vm.attesa.scad ? "/s" : "") : "", r.prossimo, cb.sonoHost && puoChiudere(vm), !!cb.sonoHost, !!vm.rivedi, !!vm.cosa].join("|");   // (sonoHost: l'amico che prende il posto dell'host ha i tasti giusti)
    if (ks !== ui.kSotto) { ui.kSotto = ks; disegnaSotto(ui, vm, cb, r); }
    if (r.intendo) aggiornaSel(ui, vm);
    if (vm.fase === "fine" && vm.rivedi && ui.bAv) aggAvanti(ui, vm, cb);
    cosaIntendevi(ui, vm, cb);
    S.vista.classList.toggle("or-fine-v", vm.fase === "fine");   // (a fine partita la barra è alta: la chat lascia il posto al tabellone)
    S.vista.style.setProperty("--or-barra", (S.barraEl.offsetHeight + 6) + "px");   // il tabellone sul maxischermo finisce sopra la barra dei tasti
  }
  // 🤔 il tasto «Fatto» del capo dice quante parole ha segnato
  function aggiornaSel(ui, vm) {
    if (!ui.selOk) return;
    var n = selDi(vm).length, max = maxSel(vm), t = "✅ Fatto · " + n + (vm.indizio && vm.indizio.n > 0 ? "/" + max : "");
    if (ui.selOk.textContent !== t) ui.selOk.textContent = t;
    ui.selOk.disabled = !n;
  }
  // «⏩ Avanti» sotto «Cosa intendevi?»: il mio tocco resta («✅ Avanti»), cambia solo il numero
  function aggAvanti(ui, vm, cb) {
    var R = vm.rivedi, l = R.av || [], mio = ui.mioAv === vm.bid || l.indexOf(cb.myId) >= 0, n = l.length + (mio && l.indexOf(cb.myId) < 0 ? 1 : 0);
    var tx = mio ? "✅ Avanti" : "⏩ Avanti", q = Math.min(n, R.servono || 1) + " su " + (R.servono || 1);
    if (ui.bAvTx.textContent !== tx) ui.bAvTx.textContent = tx;
    if (ui.bAvN.textContent !== q) ui.bAvN.textContent = q;
    ui.bAv.disabled = mio;
  }
  // 🤔 «Cosa intendevi?»: a fine partita, sopra il tabellone, un indizio alla volta (‹ ›). Si apre da sola (dopo la festa di chi vince)
  // finché c'è il conto; dopo si riapre col tasto «🤔 Rivedi» della barra
  function cosaIntendevi(ui, vm, cb) {
    var c = vm.fase === "fine" ? vm.cosa : null, R = ui.riv;
    if (!c || !c.l || !c.l.length) { if (R) R.el.classList.remove("su"); return; }
    if (!R) {
      R = ui.riv = creaRivedi(ui, c);
      var passati = ui.fineOra ? Date.now() - ui.fineOra : 1e9;   // appena finita: prima i coriandoli e la squadra che esulta
      R.pronta = passati > 3000;
      if (!R.pronta) setTimeout(function () { R.pronta = true; if (ui.vm) cosaIntendevi(ui, ui.vm, ui.cb); }, 3200 - passati);
    }
    var aperta = R.pronta && (!!vm.rivedi || R.aperta);
    if (aperta) try { ui.S.vista.style.setProperty("--or-barra", (ui.S.barraEl.offsetHeight + 6) + "px"); } catch (e) {}   // (la barra può essere cresciuta coi tasti di fine)
    if (aperta && !R.el.classList.contains("su")) {
      if (vm.rivedi && !R.vibrato) { R.vibrato = true; try { if (navigator.vibrate) navigator.vibrate(25); } catch (e) {} }   // la rivelazione: un colpetto
      suona("indizio");
    }
    R.el.classList.toggle("su", aperta);
    R.chiudi.style.display = vm.rivedi ? "none" : "";
  }
  function creaRivedi(ui, c) {
    var el = ui.el, R = { c: c, i: 0, aperta: false };
    R.num = el("small", { class: "or-riv-num" });
    R.prec = el("button", { class: "or-riv-fr", "aria-label": "Indizio prima", text: "‹", onclick: function () { if (R.i > 0) { R.i--; paginaRivedi(ui, R); } } });
    R.succ = el("button", { class: "or-riv-fr", "aria-label": "Indizio dopo", text: "›", onclick: function () { if (R.i < R.c.l.length - 1) { R.i++; paginaRivedi(ui, R); } } });
    R.chiudi = el("button", { class: "or-riv-x", "aria-label": "Chiudi", text: "✕", onclick: function () { R.aperta = false; R.el.classList.remove("su"); } });
    R.corpo = el("div", { class: "or-riv-corpo" });
    var pr = c.premio || [], prTx;
    if (pr.length) {
      var s0 = pr[0];
      prTx = "🧠 Più in sintonia: " + pr.map(function (s) { return SQ[s.k].em + " " + SQ[s.k].nome + " (" + s.nomi.join(", ") + ")"; }).join(" e ") +
        (pr.length > 1 ? ", a pari" : "") + " · " + s0.t + " su " + s0.p + (s0.p === 1 ? " parola pensata trovata" : " parole pensate trovate");
    } else prTx = "🧠 Più in sintonia: nessuno, questa volta! Le parole pensate non le ha trovate nessuno.";
    R.el = el("div", { class: "or-riv" }, [
      el("div", { class: "or-riv-testa" }, [ R.prec, el("div", { class: "or-riv-tit" }, [ el("b", { text: "🤔 Cosa intendevi?" }), R.num ]), R.succ, R.chiudi ]),
      R.corpo,
      el("div", { class: "or-riv-premio", text: prTx }) ]);
    ui.S.vista.appendChild(R.el);
    paginaRivedi(ui, R);
    return R;
  }
  function paginaRivedi(ui, R) {
    var el = ui.el, e = R.c.l[R.i], sq = SQ[e.k] || SQ[0], B = R.corpo;
    while (B.firstChild) B.removeChild(B.firstChild);
    R.num.textContent = (R.i + 1) + " di " + R.c.l.length;
    R.prec.disabled = R.i === 0; R.succ.disabled = R.i === R.c.l.length - 1;
    B.appendChild(el("div", { class: "or-riv-ind", style: "--c:" + sq.col }, [ el("span", { text: sq.em }), el("b", { text: e.p }), el("span", { class: "n", text: e.n === 0 ? "∞" : String(e.n) }) ]));
    B.appendChild(el("div", { class: "or-riv-et", text: "👑 " + e.nome + " pensava:" }));
    B.appendChild(el("div", { class: "or-riv-w" }, e.pen.map(function (x) { return el("span", { class: "or-riv-c " + (x.ok ? "si" : "manca"), text: x.w + (x.ok ? " ✅" : "") }); })));
    B.appendChild(el("div", { class: "or-riv-et", text: "La squadra ha toccato:" }));
    var usati = {};   // la legenda dice solo i segni che ci sono
    B.appendChild(e.toc.length ? el("div", { class: "or-riv-w" }, e.toc.map(function (x) {
      var segno = x.pen ? "✅" : x.oro ? "⭐" : x.c === e.k ? "🍀" : x.c === "x" ? "💣" : "❌";
      usati[segno] = 1;
      return el("span", { class: "or-riv-c t c" + x.c + (x.pen ? " si" : ""), text: x.w + " " + segno });
    })) : el("div", { class: "or-riv-vuoto", text: "Nessuna parola toccata con questo indizio." }));
    var t = e.pen.filter(function (x) { return x.ok; }).length;
    B.appendChild(el("div", { class: "or-riv-esito", text: t === e.pen.length ? "🧠 Tutte trovate: in perfetta sintonia!" : t ? "🤝 " + t + " su " + e.pen.length + " trovate" : "😅 Nessuna di quelle che pensava" }));
    var LEG = [["✅", "quella che intendeva"], ["🍀", "giusta per fortuna"], ["⭐", "la parola d'oro"], ["❌", "sbagliata"], ["💣", "la parola nera"]];
    if (Object.keys(usati).some(function (s) { return s !== "✅"; })) B.appendChild(el("div", { class: "or-riv-leg", text: LEG.filter(function (l) { return usati[l[0]] || l[0] === "✅"; }).map(function (l) { return l[0] + " " + l[1]; }).join(" · ") }));
  }
  // l'host può chiudere la partita quando qualcuno manca (si aspetta, o una squadra non ha più abbastanza persone)
  function puoChiudere(vm) {
    if (vm.fase !== "gioco") return false;
    if (vm.attesa) return true;
    for (var k = 0; k < vm.nsq; k++) {
      if (vm.fuori.indexOf(k) >= 0 || (vm.vsBot && k === 1)) continue;
      if (vm.players.filter(function (p) { return p.team === k && !p.via; }).length < 2) return true;
    }
    return false;
  }
  // chi guarda soltanto (link con guarda=1): in basso la targhetta del core "👀 Guardi · 😂 · ✕": faccine e uscita le dà lei
  function conTarga(t) { return !!(t && t.guarda && !t.eliminazione); }
  function disegnaSotto(ui, vm, cb, r) {
    var el = ui.el, box = ui.sotto;
    while (box.firstChild) box.removeChild(box.firstChild);
    function stato(tx) { var d = el("div", { class: "or-stato", text: tx }); box.appendChild(d); return d; }
    // la fila delle faccine (online), dove si aspetta: il turno degli altri, la squadra fuori, la fine
    function faccine() { if (conTarga(ui.t)) return; var f = ui.t.faccine ? ui.t.faccine() : null; if (f) { f.classList.add("or-faccine"); box.appendChild(f); } }
    ui.bAv = ui.selOk = null;
    // 🤔 «Cosa intendevi?» a schermo: il conto per tutti e «⏩ Avanti» a chi ha giocato (più di metà = si va subito ai tasti di fine)
    if (vm.fase === "fine" && vm.rivedi && vm.cosa) {
      stato(r.team === vm.vince ? "🎉 Avete vinto! Ora: cosa intendevano i capi?" : "🤔 Cosa intendevano i capi? Sfogliate gli indizi con ‹ ›");
      var contoAv = el("div", { class: "or-stato or-conto-av" });
      box.appendChild(contoAv);
      ui.t.contoAvanti(contoAv, Math.max(1, Math.ceil(vm.rivedi.ms / 1000)), null, "or-riv|" + vm.bid);
      if (r.io && !r.io.via && r.team >= 0) {
        ui.bAvTx = el("span", { class: "tx" }); ui.bAvN = el("span", { class: "or-quanti" });
        ui.bAv = el("button", { class: "or-btn", onclick: function () {
          if (ui.bAv.disabled) return;
          ui.mioAv = vm.bid; aggAvanti(ui, ui.vm, cb); cb.manda({ t: "rivisto" });
        } }, [ ui.bAvTx, ui.bAvN ]);
        box.appendChild(el("div", { class: "or-riga" }, [ ui.bAv ]));
        aggAvanti(ui, vm, cb);
      }
      faccine();
      return;
    }
    if (vm.fase === "fine") {
      var vinti = vm.players.filter(function (p) { return p.team === vm.vince; }).map(function (p) { return p.nome; }).join(", ");
      var st0;
      if (r.prossimo) st0 = stato("Sei dentro! Giochi dalla prossima partita, appena l'host la fa partire.");
      else if (vm.vsBot) st0 = stato(vm.vince === 0 ? "🎉 Avete battuto " + nomeBot(vm) + "!" : "🤖 Questa volta vince " + nomeBot(vm) + ". Rivincita?");
      else if (r.team === vm.vince) st0 = stato("🎉 Avete vinto! Ora vedete di chi era ogni parola.");
      else if (r.team >= 0) st0 = stato("Peccato! La prossima è vostra. Vincono: " + vinti + ".");
      else st0 = stato("Vincono: " + vinti + ". Ora vedete di chi era ogni parola.");
      if (testoSerie(vm)) st0.appendChild(el("span", { class: "or-serie-fine", text: testoSerie(vm) }));   // 🏆 «Rossi 2 – 1 Blu»
      if (vm.cosa && vm.cosa.l && vm.cosa.l.length) st0.appendChild(el("button", { class: "or-mini", text: "🤔 Rivedi", onclick: function () {   // riapre «Cosa intendevi?»
        if (ui.riv) { ui.riv.aperta = true; cosaIntendevi(ui, ui.vm, ui.cb); }
      } }));
      faccine();
      // all'host: come si rifanno le squadre alla rivincita (si sceglie prima di toccare «Rivincita»)
      var prova = ui.t.impostazioni && ui.t.impostazioni.modo === "prova";
      if (cb.sonoHost && !prova) {
        var modi = vm.vsBot ? [["capo", "👑 Capo nuovo"], ["stessi", "👑 Stesso capo"]] : [["capo", "👑 Capo nuovo"], ["stessi", "Stessi capi"], ["caso", "🔀 Squadre a caso"]];
        var rm = el("div", { class: "or-riv-modo" }, [ el("span", { class: "or-rm-et", text: "Rivincita:" }) ]);
        modi.forEach(function (m) {
          rm.appendChild(el("button", { class: "or-rm" + ((vm.rivModo || "capo") === m[0] ? " on" : ""), "data-v": m[0], text: m[1], onclick: function () {
            [].forEach.call(rm.querySelectorAll(".or-rm"), function (b) { b.classList.toggle("on", b === this); }, this);
            cb.manda({ t: "rivmodo", v: m[0] });
          } }));
        });
        box.appendChild(rm);
      }
      var riga = el("div", { class: "or-riga" });
      box.appendChild(riga);
      // i tasti di fine comuni (all'host del momento, anche se è l'amico che ha preso il posto dell'host, e a chi ha giocato):
      // se li disegna il core nella riga, niente tasti nostri. In prova (da solo) restano i nostri
      var tf = ui.t.tastiFine && !(ui.t.impostazioni && ui.t.impostazioni.modo === "prova") && (cb.sonoHost || r.team >= 0 || conTarga(ui.t))
        ? (cb.sonoHost ? { host: true, nuova: cb.onNuova, esci: function () { cb.onEsci(); } } : { host: false, esci: function () { cb.onEsci(); } }) : null;
      if (tf && ui.t.tastiFine(riga, tf)) { riga.classList.add("or-fine"); return; }   // (in colonna: sopra i tasti il core può mettere «👥 Avete giocato con»)
      if (conTarga(ui.t)) { stato("👀 Hai guardato: se l'host fa un'altra partita, entri anche tu."); return; }   // (si esce dalla targhetta)
      if (cb.sonoHost) riga.appendChild(el("button", { class: "or-btn", text: "↻ Nuova partita", onclick: cb.onNuova }));
      riga.appendChild(el("button", { class: "or-btn chiaro", text: "🏠 Esci", onclick: function () { cb.onEsci(); } }));
      if (!cb.sonoHost && !r.prossimo) stato(r.team < 0 && (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta hai guardato." : "Se l'host fa un'altra partita, tornate da soli nella saletta.");
      return;
    }
    // i tasti "di servizio": fare il capo al posto di chi è uscito, e (solo l'host) chiudere la partita
    var servizio = el("div", { class: "or-riga" });
    if (r.prendi) servizio.appendChild(el("button", { class: "or-btn", text: "👑 Faccio io il capo", onclick: function () { cb.manda({ t: "capo" }); } }));
    if (cb.sonoHost && puoChiudere(vm)) servizio.appendChild(el("button", { class: "or-btn chiaro", text: "🏁 Chiudi la partita", onclick: function () {
      ui.t.conferma("Chiudere la partita?", "Vince la squadra che ha meno parole da trovare.", "🏁 Chiudi", function () { cb.manda({ t: "chiudi" }); });
    } }));
    function fineServizio() { if (servizio.firstChild) box.appendChild(servizio); }
    if (r.team >= 0 && vm.fuori.indexOf(r.team) >= 0) { stato("La vostra squadra è fuori: guardate come va a finire."); faccine(); return fineServizio(); }
    // 🤔 ho appena dato l'indizio: quali parole intendevo? (facoltativo: il gioco intanto va avanti, la clessidra non si ferma)
    if (r.intendo && !vm.attesa) {
      var x = vm.indizio.x, kk = vm.bid + "|" + x;
      stato("🤔 Quali parole intendevi con «" + vm.indizio.parola + "»? Toccale sul tabellone: si scopre a fine partita.");
      var chiudiSel = function (msg) { INTESI[kk] = 1; cb.manda(msg); ui.kSotto = ""; aggiorna(ui, ui.vm, cb); };
      ui.selOk = el("button", { class: "or-btn", disabled: "disabled", onclick: function () {
        var l = selDi(ui.vm); if (!l.length || INTESI[kk]) return;
        chiudiSel({ t: "intendo", x: x, l: l.slice() });
      } });
      box.appendChild(el("div", { class: "or-riga" }, [ ui.selOk, el("button", { class: "or-btn chiaro corto", text: "Salta", onclick: function () {
        if (!INTESI[kk]) chiudiSel({ t: "intendo", x: x, salta: 1 });
      } }) ]));
      aggiornaSel(ui, vm);
      return fineServizio();
    }
    if (vm.sospeso) { stato("🥁 Vediamo se è giusta…"); return; }
    // manca qualcuno: tutti vedono chi aspettiamo e per quanto
    if (vm.attesa) {
      // (il capo: lo si aspetta; passati i 3 minuti niente più conto, e i suoi compagni possono fare loro il capo)
      var d = stato("⏳ " + (vm.attesa.k === r.team ? "" : "I " + SQ[vm.attesa.k].nome + ": ") + "aspettiamo " + (vm.attesa.capo ? "il capo, " : "") + vm.attesa.chi + "… ");
      if (!vm.attesa.scad) d.appendChild(conto(ui, "attesa", vm.attesa.ms));
      if (r.prendi) stato("Il vostro capo non è ancora tornato: se volete, uno di voi può prendere il suo posto.");
      return fineServizio();
    }
    if (vm.passo === "bot") { stato("🤖 Tocca a " + nomeBot(vm) + ": scopre una sua parola…" + (r.capo ? " Intanto pensa al prossimo indizio." : "")); faccine(); return fineServizio(); }
    if (!r.mioTurno) { stato("Tocca ai " + SQ[vm.turno].nome + "…" + (r.capo ? " Intanto pensa al prossimo indizio." : "")); faccine(); return fineServizio(); }
    if (vm.passo === "indizio") {
      if (!r.capo) { stato("Il vostro capo sta pensando all'indizio…"); return fineServizio(); }
      var input = el("input", { type: "text", class: "or-input", placeholder: "Una parola sola", maxlength: "20", autocomplete: "off", autocapitalize: "characters" });
      var numeri = el("div", { class: "or-numeri" }), scelto = { n: 1 }, errore = el("div", { class: "or-err" });
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 0].forEach(function (n) {
        var b = el("button", { class: "or-num" + (n === 1 ? " on" : ""), text: n === 0 ? "∞" : String(n), onclick: function () {
          scelto.n = n; [].forEach.call(numeri.children, function (x) { x.classList.remove("on"); }); b.classList.add("on");
        } });
        numeri.appendChild(b);
      });
      input.addEventListener("input", function () { errore.textContent = ""; });
      function manda() {
        var err = erroreIndizio(input.value, vm.tab);
        if (err) { errore.textContent = err; return; }
        cb.manda({ t: "indizio", parola: input.value.trim(), n: scelto.n });
        input.blur();
      }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") manda(); });
      box.appendChild(el("div", { class: "or-riga" }, [ input, el("button", { class: "or-btn corto", text: "Invia", onclick: manda }) ]));
      box.appendChild(numeri); box.appendChild(errore);
      return fineServizio();
    }
    if (r.capo) { stato("La tua squadra sta cercando… Tu non puoi aiutarli!"); return fineServizio(); }
    stato("Tocca le parole per segnarle (anche più di una); tocca di nuovo una parola segnata per girarla.");
    box.appendChild(el("div", { class: "or-riga" }, [
      el("button", { class: "or-btn", text: "✋ Basta così, passo", disabled: vm.girate > 0 ? null : "disabled", onclick: function () { cb.manda({ t: "passo" }); } }) ]));
    fineServizio();
  }
  // un avviso breve (es. indizio non valido): compare sopra i tasti e sparisce da solo
  function avviso(testo) {
    if (!UI || !testo) return;
    UI.msg.textContent = testo; UI.msg.classList.add("su");
    clearTimeout(UI.tMsg); UI.tMsg = setTimeout(function () { if (UI) UI.msg.classList.remove("su"); }, 2600);
  }
  // suoni brevi (niente vibrazione qui: vibra solo il tasto che tocchi tu)
  function suona(tipo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    var note = { tic: [[1400, 0]], indizio: [[660, 0], [990, 0.07]], oro: [[784, 0], [988, 0.09], [1175, 0.18], [1568, 0.27]], giusta: [[784, 0], [1046, 0.1]], neutra: [[392, 0]], sbagliata: [[311, 0], [233, 0.14]], nera: [[160, 0], [110, 0.18], [70, 0.36]] }[tipo] || [];
    note.forEach(function (x) {
      try {
        var t0 = ctx.currentTime + x[1], o = ctx.createOscillator(), g = ctx.createGain();
        o.type = tipo === "nera" ? "sawtooth" : "triangle"; o.frequency.setValueAtTime(x[0], t0);
        var dur = tipo === "tic" ? 0.06 : 0.28;   // (il tic della clessidra: corto e piano)
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(tipo === "tic" ? 0.05 : 0.09, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
        o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + 0.3);
      } catch (e) {}
    });
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Questo gioco si gioca online: funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      // ---- lo schermo di gioco: stile "pulito e moderno" (chiaro, tessere bianche, colori pieni) ----
      ".schermata.or-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#f7f5ef}",
      ".schermata.or-piena>.testa,.schermata.or-piena>.piede{display:none}",
      ".schermata.or-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".or-scena{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:7px;padding:calc(8px + env(safe-area-inset-top)) 9px calc(9px + env(safe-area-inset-bottom));overflow:hidden;color:#1f1f1f;background:#f7f5ef;user-select:none;-webkit-user-select:none}",
      // in alto: le squadre con le faccine
      ".or-alto{display:flex;gap:7px;align-items:stretch;flex:none}",
      ".or-esci{width:34px;height:34px;flex:none;align-self:center;border-radius:50%;border:0;background:#ebe7da;color:#1f1f1f;font:inherit;font-size:1.2rem;font-weight:900;cursor:pointer}",
      ".or-pannelli{flex:1;display:flex;gap:6px;min-width:0}",
      ".or-pan{flex:1;min-width:0;border-radius:14px;padding:5px 7px 7px;background:#fff;box-shadow:0 0 0 1px #ebe7da;display:flex;flex-direction:column;gap:4px;transition:background .25s}",
      ".or-pan-testa{display:flex;justify-content:space-between;align-items:baseline;gap:4px;font-weight:900;font-size:.78rem;color:var(--c)}",
      ".or-pan-n{font-size:1.3rem;line-height:1}",
      ".or-pan.turno,.or-pan.vince{background:var(--c);box-shadow:none}.or-pan.turno .or-pan-testa,.or-pan.vince .or-pan-testa{color:#fff}",
      ".or-pan.fuori{opacity:.4}",
      ".or-facce{display:flex;flex-wrap:wrap;gap:4px;min-height:26px;align-items:center}",
      ".or-f{position:relative;flex:none;width:26px;height:26px;border-radius:50%;background:#f1efe8;box-shadow:0 0 0 2px #fff;display:flex;align-items:center;justify-content:center;font-size:.7rem;color:#6b6658}",
      ".or-f img{width:100%;height:100%;border-radius:50%;display:block}",
      ".or-f.capo{margin-top:6px}.or-f.capo:after{content:'👑';position:absolute;top:-11px;left:50%;transform:translateX(-50%);font-size:11px;line-height:1}",
      ".or-f.via{opacity:.35}",
      ".or-f.tu{box-shadow:0 0 0 2px #1f1f1f}",
      // l'indizio, grande al centro
      ".or-ind{flex:none;text-align:center;min-height:44px;display:flex;flex-direction:column;justify-content:center}",
      ".or-ind small{font-size:.6rem;letter-spacing:.14em;color:#8a8576;font-weight:800}",
      ".or-ind b{font-size:1.4rem;font-weight:900;line-height:1.1;color:var(--c)}",
      ".or-ind b .n{display:inline-block;margin-left:7px;min-width:24px;border-radius:8px;background:#1f1f1f;color:#fff;font-size:1rem;padding:1px 6px;vertical-align:3px}",
      ".or-ind-tent{font-size:.7rem;color:#8a8576;font-weight:700}",
      ".or-ind-stato{font-weight:900;font-size:1rem;color:var(--c)}",
      // il tabellone: caselle basse, non stirate
      ".or-tab{flex:none;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-auto-rows:clamp(38px,6.4vh,52px);gap:4px}.or-tab.venti{grid-auto-rows:clamp(44px,7.6vh,60px)}",
      ".or-conto{font-variant-numeric:tabular-nums;font-weight:900}.or-cless{color:#e67700;font-size:.8rem}",
      ".or-carta{position:relative;min-width:0;min-height:0;border:0;border-radius:10px;padding:2px;background:#fff;color:#2b2b2b;font:inherit;font-weight:800;display:flex;align-items:center;justify-content:center;cursor:default;-webkit-tap-highlight-color:transparent;touch-action:manipulation;overflow:hidden;box-shadow:0 1px 0 #e4e0d4,0 0 0 1px #ebe7da}",
      ".or-w{display:block;max-width:100%;line-height:1.05;letter-spacing:-.02em;overflow-wrap:anywhere;text-align:center}",
      ".or-carta.attiva{cursor:pointer}.or-carta.attiva:active{transform:scale(.96)}",
      ".or-carta.mia{box-shadow:0 0 0 2.5px #1f1f1f}",
      ".or-hint{display:none;position:absolute;left:0;right:0;bottom:1px;font-size:7.5px;font-weight:800;color:#e67700;text-transform:uppercase}.or-carta.mia .or-hint{display:block}",
      // le faccine di chi propone la parola (si vede bene chi la vorrebbe girare)
      ".or-pr{position:absolute;top:2px;right:2px;display:flex;gap:1px}",
      ".or-av{width:22px;height:22px;border-radius:50%;overflow:hidden;background:var(--c);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;box-shadow:0 0 0 1.5px #fff,0 0 0 3px var(--c)}.or-av img{width:100%;height:100%;display:block}",
      // la chiave del capo: le parole ancora coperte con il colore chiaro e una riga sotto
      ".or-carta.chiave.c0{background:#ffe3e3;box-shadow:inset 0 -4px #fa5252}.or-carta.chiave.c1{background:#e7f5ff;box-shadow:inset 0 -4px #339af0}.or-carta.chiave.c2{background:#ebfbee;box-shadow:inset 0 -4px #40c057}",
      ".or-carta.chiave.cn{background:#f4efe2}.or-carta.chiave.cx{background:#1f1f1f;color:#fff}",
      // le parole girate: colori pieni
      ".or-carta.g{color:#fff;box-shadow:none}",
      ".or-carta.g.c0{background:#fa5252}.or-carta.g.c1{background:#339af0}.or-carta.g.c2{background:#40c057}.or-carta.g.cn{background:#e9e4d6;color:#a39c88}.or-carta.g.cx{background:#1f1f1f;box-shadow:0 0 0 2px #fa5252}",
      // fine partita: si vede di chi era ogni parola che nessuno aveva girato
      ".or-carta.svelata.c0{background:#ffe3e3}.or-carta.svelata.c1{background:#e7f5ff}.or-carta.svelata.c2{background:#ebfbee}.or-carta.svelata.cn{background:#f4efe2}.or-carta.svelata.cx{background:#1f1f1f;color:#fff}",
      // la parola d'oro (girata, o svelata a fine partita)
      ".or-carta.g.oro{background:#fcc419;color:#5c3d00}.or-carta.g.oro:before{content:'⭐';position:absolute;top:1px;left:3px;font-size:10px}",
      ".or-carta.svelata.oro{background:#fff3bf}",
      ".or-carta.appena{animation:orGira .45s ease-out}",
      "@keyframes orGira{0%{transform:scale(1.12)}100%{transform:none}}",
      // al centro: la chat della partita (indizi e parole girate)
      ".or-log{flex:1 1 auto;min-height:56px;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;background:#fff;border-radius:14px;box-shadow:0 0 0 1px #ebe7da;padding:7px 9px;display:flex;flex-direction:column;gap:5px}",
      ".or-l{display:flex;align-items:center;gap:6px;font-size:.8rem;line-height:1.2;min-width:0}",
      ".or-l .or-f{width:22px;height:22px;box-shadow:none}",
      ".or-l-nome{font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:34%}",
      ".or-l-txt{color:#8a8576;font-weight:700}",
      ".or-l-ind{font-weight:900;background:#1f1f1f;color:#fff;border-radius:7px;padding:2px 8px;letter-spacing:.02em}",
      ".or-l-w{font-weight:900;border-radius:6px;padding:2px 7px;background:#e9e4d6;color:#6b6658}",
      ".or-l-w.c0{background:#fa5252;color:#fff}.or-l-w.c1{background:#339af0;color:#fff}.or-l-w.c2{background:#40c057;color:#fff}.or-l-w.cx{background:#1f1f1f;color:#fff}.or-l-w.oro{background:#fcc419;color:#5c3d00}",
      ".or-l-esito{color:#8a8576;font-size:.74rem;font-weight:700}.or-l-esito.ok{color:#2f9e44;font-weight:900;font-size:.9rem}",
      ".or-l.sis{justify-content:center;color:#8a8576;font-weight:800;font-size:.74rem}.or-l.fine{color:#1f1f1f;font-size:.92rem}",
      // in fondo: i tasti
      ".or-sotto{flex:none;display:flex;flex-direction:column;gap:6px}",
      ".or-stato{text-align:center;font-weight:800;font-size:.85rem;line-height:1.3;padding:2px 0;color:#6b6658}",
      ".or-riga{display:flex;gap:6px}.or-riga.or-fine{flex-direction:column;align-items:stretch}",
      ".or-fine-v .or-log{min-height:0}@media(max-height:760px){.or-fine-v .or-log{display:none}}",
      ".or-sotto .or-faccine{flex:none}",
      ".or-btn{flex:1;min-height:46px;border:0;border-radius:14px;font:inherit;font-weight:900;font-size:.92rem;color:#fff;background:#1f1f1f;cursor:pointer;touch-action:manipulation}.or-btn.chiaro{background:#ebe7da;color:#1f1f1f}.or-btn.corto{flex:0 0 auto;padding:0 18px}.or-btn:disabled{opacity:.3}",
      ".or-input{flex:1;min-width:0;height:46px;border:1.5px solid #e4e0d4;border-radius:14px;padding:0 14px;font:inherit;font-size:1.05rem;font-weight:800;text-transform:uppercase;color:#1f1f1f;background:#fff}",
      ".or-numeri{display:grid;grid-template-columns:repeat(10,1fr);gap:4px}",
      ".or-num{height:36px;border:0;border-radius:10px;font:inherit;font-weight:900;font-size:1rem;color:#1f1f1f;background:#ebe7da;cursor:pointer;touch-action:manipulation}.or-num.on{background:#1f1f1f;color:#fff}",
      ".or-err{min-height:1.1em;text-align:center;font-size:.8rem;font-weight:800;color:#e03131}",
      ".or-toast{position:absolute;left:50%;bottom:calc(118px + env(safe-area-inset-bottom));transform:translateX(-50%);max-width:88%;text-align:center;background:#1f1f1f;color:#fff;border-radius:999px;padding:8px 14px;font-weight:800;font-size:.82rem;opacity:0;pointer-events:none;transition:opacity .25s;z-index:5}.or-toast.su{opacity:1}",
      // ---- nello studio: il tabellone sta sul maxischermo (chiaro), i tasti nella barra in basso ----
      ".or-studio .st-sch-in{padding:calc(46px + env(safe-area-inset-top)) 8px var(--or-barra,110px)!important;background:#f7f5ef}",
      ".or-sch{flex:1;min-height:0;display:flex;flex-direction:column;gap:6px;color:#1f1f1f}",
      ".or-sch .or-pannelli{flex:none}.or-sch .or-ind{min-height:40px}",
      ".or-studio .st-barra{gap:6px;padding:10px 10px calc(10px + env(safe-area-inset-bottom))}",
      ".or-studio.st-con-targa .st-barra{padding-bottom:calc(64px + env(safe-area-inset-bottom))}",   // chi guarda: il posto della targhetta
      ".or-studio .or-btn{background:#fff;color:#1f1f1f}.or-studio .or-btn.chiaro{background:rgba(255,255,255,.18);color:#fff}",
      ".or-studio .or-stato{color:#e6e9ff}",
      ".or-studio .or-num{background:rgba(255,255,255,.18);color:#fff}.or-studio .or-num.on{background:#fff;color:#1f1f1f}",
      ".or-studio .or-err{color:#ffa8a8}",
      ".or-studio .or-toast{bottom:calc(var(--or-barra,110px) + 8px)}",
      // la casella scelta trema finché non si scopre (solo transform)
      ".or-carta.sospesa{animation:orTrema .14s linear infinite;box-shadow:0 0 0 3px #fcc419;z-index:2}",
      "@keyframes orTrema{0%,100%{transform:translate(0,0) rotate(0)}25%{transform:translate(-1.5px,.5px) rotate(-1.5deg)}50%{transform:translate(1px,-1px) rotate(1deg)}75%{transform:translate(1.5px,.5px) rotate(1.5deg)}}",
      // i banconi delle squadre, in basso nello studio: tutti i giocatori dietro un bancone unico
      ".or-banchi{left:0;top:0;width:0;height:0}",
      ".or-banco{position:absolute;display:flex;flex-direction:column}",
      ".or-banco-gente{flex:1 1 auto;min-height:0;display:flex;justify-content:center;align-items:flex-end;gap:3%;padding:0 4%}",
      ".or-persona{position:relative;flex:0 1 auto;min-width:0;max-width:31%;height:100%;display:flex;flex-direction:column;align-items:center;justify-content:flex-end}",
      ".or-persona.evviva img{animation:orSalta .5s ease-in-out 3}@keyframes orSalta{50%{transform:translateY(-9%)}}",   // chi esulta fa due saltelli (solo transform)
      ".st-vista .st-terzo{bottom:calc(var(--or-barra, 98px) + 8px + env(safe-area-inset-bottom))}",   // la scritta di chi è (presentazione) sopra i tasti, non sotto
      ".or-persona img{height:84%;width:auto;max-width:100%;object-fit:contain;display:block}",
      ".or-persona span{font-size:.8em;font-weight:900;color:#fff;margin-top:-.2em;text-shadow:0 .1em .2em rgba(0,0,0,.6);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}",
      ".or-persona.via{opacity:.3}",
      ".or-banco-fronte{flex:0 0 38%;position:relative;border-radius:.7em .7em .35em .35em;background:linear-gradient(#36268a,#1b1152 55%,#0d0730);border-top:.45em solid #d8d2ff;display:flex;align-items:center;justify-content:center;box-shadow:0 .4em 1em rgba(0,0,0,.45)}",
      ".or-banco-fronte:after{content:'';position:absolute;left:5%;right:5%;bottom:.35em;height:.4em;border-radius:.3em;background:var(--c);box-shadow:0 0 .9em var(--c)}",
      ".or-banco-fronte span{font-weight:900;color:#fff;font-size:2em;letter-spacing:.08em;text-shadow:0 .08em 0 rgba(0,0,0,.45)}",
      // la vignetta: l'indizio del capo, o la parola che dice chi la gira
      ".or-vignetta{position:absolute;z-index:8;transform:translate(-50%,-110%) scale(.3);transform-origin:50% 100%;opacity:0;pointer-events:none;background:#fff;color:#1f1f1f;border-radius:1em;padding:.35em .75em;font-weight:900;white-space:nowrap;box-shadow:0 .3em 1em rgba(0,0,0,.4),0 0 0 .15em var(--c,#1f1f1f);transition:transform .35s cubic-bezier(.3,1.5,.5,1),opacity .2s}",
      ".or-vignetta.su{opacity:1;transform:translate(-50%,-110%) scale(1)}",
      ".or-vignetta:after{content:'';position:absolute;left:50%;bottom:-.55em;margin-left:-.55em;border:.55em solid transparent;border-bottom:0;border-top-color:#fff}",
      ".or-vignetta .n{display:inline-block;margin-left:.35em;border-radius:.4em;background:#1f1f1f;color:#fff;padding:0 .35em}",
      // ---- saletta (nello stile scuro dell'app): le squadre ----
      ".or-squadre{display:flex;flex-direction:column;gap:8px;margin:6px 0}",
      ".or-sq{border-radius:14px;padding:8px 10px;background:rgba(255,255,255,.06);box-shadow:inset 4px 0 var(--c)}",
      ".or-sq-testa{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}",
      ".or-sq-membri{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px}",
      ".or-membro{padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800;font-size:.85rem}.or-membro.tu{box-shadow:inset 0 0 0 2px var(--c)}",
      ".or-vuota{font-size:.8rem;opacity:.7}",
      // ---- le tue parole nelle impostazioni: una alla volta, ognuna con la sua ✕ ----
      ".or-aggiungi{display:flex;gap:6px;align-items:center}.or-aggiungi .link-campo{flex:1;min-width:0;margin:0}",
      ".or-esito{min-height:1.2em;margin:4px 0 0}",
      ".or-conta{font-size:.8rem;font-weight:800;opacity:.8;margin:6px 0 4px}",
      ".or-lista{display:flex;flex-wrap:wrap;gap:6px}",
      ".or-parola{display:inline-flex;align-items:center;gap:4px;padding:4px 4px 4px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800;font-size:.85rem}",
      ".or-x{width:24px;height:24px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font:inherit;font-size:.75rem;font-weight:900;cursor:pointer;touch-action:manipulation}",
      ".or-lista-tasti{display:flex;gap:6px;margin-top:8px}",
      // ---- 🤔 «Cosa intendevi?»: il capo segna le parole che intendeva (bordo arancio e 🤔 sulla casella) ----
      ".or-carta.pensata{outline:3px solid #f59f00;outline-offset:-3px;z-index:1}.or-carta.pensata:after{content:'🤔';position:absolute;top:1px;left:3px;font-size:11px;line-height:1}",
      // a fine partita: un indizio alla volta, sopra il tabellone (si muovono solo opacità e transform)
      ".or-riv{position:absolute;left:8px;right:8px;top:calc(46px + env(safe-area-inset-top));bottom:var(--or-barra,110px);z-index:7;display:flex;flex-direction:column;gap:8px;padding:10px 10px 12px;border-radius:18px;background:#f7f5ef;color:#1f1f1f;box-shadow:0 10px 30px rgba(0,0,0,.45);opacity:0;visibility:hidden;transform:translateY(12px) scale(.97);pointer-events:none;transition:opacity .25s,transform .25s,visibility 0s .25s;overflow:hidden}",
      ".or-riv.su{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:opacity .25s,transform .25s}",
      ".or-riv-testa{display:flex;align-items:center;gap:6px;flex:none}",
      ".or-riv-fr{width:40px;height:40px;flex:none;border:0;border-radius:50%;background:#1f1f1f;color:#fff;font:inherit;font-size:1.5rem;font-weight:900;line-height:1;cursor:pointer;touch-action:manipulation}.or-riv-fr:disabled{opacity:.18}",
      ".or-riv-tit{flex:1;min-width:0;text-align:center;display:flex;flex-direction:column;line-height:1.15}.or-riv-tit b{font-size:1.05rem;font-weight:900}.or-riv-num{font-size:.72rem;font-weight:800;color:#8a8576}",
      ".or-riv-x{width:32px;height:32px;flex:none;border:0;border-radius:50%;background:#ebe7da;color:#1f1f1f;font:inherit;font-weight:900;cursor:pointer}",
      ".or-riv-corpo{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;justify-content:center;gap:7px;overflow:hidden}",
      ".or-riv-ind{flex:none;display:flex;align-items:center;justify-content:center;gap:8px;padding:8px;border-radius:14px;background:#fff;box-shadow:inset 0 -4px var(--c)}.or-riv-ind b{font-size:1.45rem;font-weight:900;color:var(--c);letter-spacing:.02em;overflow-wrap:anywhere}",
      ".or-riv-ind .n{border-radius:8px;background:#1f1f1f;color:#fff;font-weight:900;padding:1px 8px}",
      ".or-riv-et{font-size:.78rem;font-weight:900;color:#6b6658;margin-top:2px}",
      ".or-riv-w{display:flex;flex-wrap:wrap;gap:5px}",
      ".or-riv-c{padding:5px 10px;border-radius:999px;font-weight:900;font-size:.86rem;background:#fff;box-shadow:0 0 0 1.5px #e4e0d4}",
      ".or-riv-c.si{background:#d3f9d8;box-shadow:0 0 0 2px #2f9e44;color:#1b5e20}.or-riv-c.manca{background:transparent;box-shadow:none;border:1.5px dashed #a39c88;color:#8a8576}",
      ".or-riv-c.t.c0{background:#ffe3e3;color:#c92a2a}.or-riv-c.t.c1{background:#e7f5ff;color:#1864ab}.or-riv-c.t.c2{background:#ebfbee;color:#2b8a3e}.or-riv-c.t.cn{background:#f1efe8;color:#6b6658}.or-riv-c.t.cx{background:#1f1f1f;color:#fff}",
      ".or-riv-c.t.si{background:#d3f9d8;color:#1b5e20;box-shadow:0 0 0 2px #2f9e44}",
      ".or-riv-vuoto{font-size:.85rem;font-weight:700;color:#8a8576}",
      ".or-riv-esito{margin-top:8px;text-align:center;font-weight:900;font-size:1rem}",
      ".or-riv-leg{text-align:center;font-size:.7rem;font-weight:700;color:#8a8576}",
      ".or-riv-premio{flex:none;border-radius:14px;padding:8px 10px;background:#1f1f1f;color:#fff;font-weight:900;font-size:.8rem;line-height:1.3;text-align:center}",
      ".or-mini{margin-left:8px;border:0;border-radius:999px;padding:3px 10px;background:rgba(255,255,255,.2);color:#fff;font:inherit;font-size:.78rem;font-weight:900;cursor:pointer;vertical-align:1px;touch-action:manipulation}",
      ".or-quanti{margin-left:8px;font-size:.8rem;opacity:.65}.or-conto-av{font-size:.78rem;opacity:.85;padding:0}",
      // ⏳ la clessidra: gli ultimi 10 secondi rossa e col battito (solo transform)
      ".or-cless.rosso{color:#e03131;display:inline-block;animation:orBatti 1s ease-in-out infinite}@keyframes orBatti{50%{transform:scale(1.15)}}",
      // 💭 a fine turno: le parole a cui pensava il capo (si muovono solo opacità e transform)
      ".or-pens{position:absolute;left:14px;right:14px;top:calc(104px + env(safe-area-inset-top));z-index:6;padding:9px 12px 10px;border-radius:16px;background:#fff;color:#1f1f1f;text-align:center;box-shadow:0 8px 24px rgba(0,0,0,.35),inset 0 -4px var(--c,#1f1f1f);opacity:0;transform:translateY(-8px) scale(.97);pointer-events:none;transition:opacity .25s,transform .25s}",
      ".or-pens.su{opacity:1;transform:none}",
      ".or-pens-tit{display:flex;align-items:center;justify-content:center;gap:6px;font-size:.9rem}.or-pens-tit .or-f{width:24px;height:24px;box-shadow:none}",
      ".or-pens-w{display:flex;flex-wrap:wrap;justify-content:center;gap:5px;margin:6px 0 5px}",
      ".or-pens-c{padding:4px 10px;border-radius:999px;font-weight:900;font-size:.9rem;background:var(--c,#1f1f1f);color:#fff}.or-pens-c.segreta{background:#ebe7da;color:#6b6658}",
      ".or-pens-bat{font-weight:900;font-size:.85rem;color:#6b6658}",
      ".or-l-pens{flex-wrap:wrap;row-gap:3px}.or-l-nasc{font-weight:800;color:#8a8576;font-size:.74rem}",
      // 🏆 la serata a squadre e 🤖 contro il Bot (saletta), la scelta della rivincita (fine partita)
      ".or-serie{text-align:center;font-weight:900;font-size:1rem;padding:7px 10px;border-radius:12px;background:rgba(255,255,255,.1)}",
      ".or-serie-fine{display:block;margin-top:2px;font-weight:900;color:#fff}",
      ".or-vsbot{align-self:stretch}",
      ".or-riv-modo{display:flex;gap:5px;align-items:center}.or-rm-et{flex:none;font-size:.72rem;font-weight:800;color:#e6e9ff;opacity:.85}",
      ".or-rm{flex:1;min-width:0;min-height:32px;border:0;border-radius:10px;padding:2px 4px;font:inherit;font-weight:800;font-size:.72rem;line-height:1.1;background:rgba(255,255,255,.14);color:#fff;cursor:pointer;touch-action:manipulation}.or-rm.on{background:#fff;color:#1f1f1f}",
      "@media(max-height:700px){.or-riv{gap:5px;padding:8px 8px 9px}.or-riv-fr{width:36px;height:36px}.or-riv-ind{padding:5px}.or-riv-ind b{font-size:1.25rem}.or-riv-c{padding:4px 9px;font-size:.8rem}}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Parola d'ordine", icona: "🕵️",
    descrizione: "Il capo dà un indizio di una parola sola, la squadra trova le sue parole sul tabellone. Occhio alla parola nera! A 2 o 3 squadre, o in pochi contro il Bot, ognuno dal suo telefono.",
    giocatoriMin: 2, giocatoriMax: MAX, difficolta: 2, etichettaGiocatori: "👥 2–12 giocatori",   // (in 2-3 si gioca contro il Bot)
    postiOnline: MAX,   // posti online (12)
    ritardatari: "turno",   // chi arriva a partita cominciata entra subito nella squadra più piccola e gioca dal prossimo turno
    // "Prova da solo" la vede solo il proprietario (account IL PAPPONE): per vedere com'è il gioco anche senza amici
    modi: [ { modo: "prova", icona: "🧪", nome: "Prova da solo", sotto: "Solo per te: tu e un Bot contro due Bot", soloPer: "IL PAPPONE" } ], soloOnline: true,
    // se all'host si ricarica la pagina la partita riprende da lui; se sparisce del tutto, un amico la porta avanti (il core)
    riprende: true, riserva: true,
    regole: [
      "Si gioca a <b>2 o 3 squadre</b>. Sul tabellone ci sono 25 parole (o 20, se l'host sceglie così): alcune sono di una squadra, alcune di nessuno e una è la <b>parola nera</b>.",
      "Solo il <b>capo</b> di ogni squadra (👑) vede di chi è ogni parola. Nel suo turno dà un <b>indizio di una parola sola</b> e un numero: quante parole sue c'entrano (es. «Caldo, 2»).",
      "La squadra ne discute e le gira una alla volta: si possono girare fino al numero dell'indizio <b>più una</b>. Se giri una parola di un'altra squadra o di nessuno, il turno passa.",
      "Chi gira la <b>parola nera</b> perde (a 3 squadre esce dalla partita). Vince la squadra che trova per prima tutte le sue parole.",
      "L'indizio non può essere una parola del tabellone (né quasi uguale: niente plurali o parole che ci cominciano). Il capo può dare anche «∞»: tentativi liberi.",
      "🤖 <b>In 2 o 3? Contro il Bot.</b> Siete tutti nella stessa squadra (uno fa il capo, gli altri indovinano) e dall'altra parte c'è un Bot: dopo ogni vostro turno scopre da solo una sua parola. Trovate tutte le vostre prima che lui finisca le sue!",
      "⏳ <b>Clessidre</b> (se l'host le accende): il capo ha 90 secondi o 2 minuti per l'indizio, la squadra 1 o 2 minuti per indovinare. Il primo indizio della partita ha il <b>tempo doppio</b>; negli ultimi 10 secondi la clessidra diventa rossa. Allo zero il turno passa. Se il capo esce (WhatsApp, telefono bloccato…) la sua squadra lo aspetta; se dopo 3 minuti non è tornato, un compagno può prendere il suo posto (👑 Faccio io il capo).",
      "🎬 <b>Ritmo</b>: con «Show» la suspense lunga c'è sulle parole che contano (la prima di ogni indizio, l'ultimo tentativo, l'ultima parola che manca); con «⚡ Veloce» si scopre tutto in un attimo.",
      "⭐ <b>Parola d'oro</b> (se l'host la lascia accesa): tra le parole di nessuno una è d'oro, e non lo sa nessuno, nemmeno i capi. Chi la gira non perde il turno: la squadra continua a indovinare con lo stesso indizio, senza consumare un tentativo.",
      "🤔 <b>Cosa intendevi?</b> (se l'host lo lascia acceso): dopo l'indizio il capo può toccare, di nascosto, le parole che intendeva (o «Salta»). A fine turno si vede «💭 Paky pensava a…» con le parole già trovate (le altre restano segrete). A fine partita si rivedono gli indizi uno per uno («Paky pensava: ONDA, SALE · la squadra ha toccato: ONDA ✅, PESCE ❌») e la squadra che ha trovato più parole pensate vince il premio <b>🧠 Più in sintonia</b>.",
      "📝 <b>Le parole vostre</b>: ognuno porta le parole del suo profilo (i nomi degli amici, i posti, le battute del gruppo) e finiscono sul tabellone insieme a quelle del mazzo: 5, 10, metà o tutte, lo sceglie l'host. In una serata le parole del mazzo non si ripetono.",
      "🏆 Tra una partita e l'altra si tiene il conto della serata («Rossi 2 – 1 Blu»); alla rivincita l'host sceglie se cambiare capo, tenere gli stessi capi o rifare le squadre a caso."
    ],
    // la riga «📜 Si gioca così» che leggono gli amici nella Sala
    riassunto: function (imp) {
      imp = imp || {};
      var x = [imp.squadre === "bot" ? "🤖 contro il Bot" : +imp.squadre === 3 ? "3 squadre" : "2 squadre", (+imp.parole === 20 ? "20" : "25") + " parole"];
      if (imp.mazzo && imp.mazzo !== "classico") x.push("mazzo " + nomeMazzo(imp.mazzo));
      if (ritmoDa(imp.ritmo) === "veloce") x.push("⚡ ritmo veloce");
      var tp = tempoDa(imp.tempo); if (tp) x.push("⏳ " + testoSec(tp) + " per l'indizio");
      var ti = tempoIndDa(imp.tempoInd); if (ti) x.push("⏳ " + testoSec(ti) + " per indovinare");
      if (imp.oro !== false) x.push("⭐ parola d'oro");
      if (imp.intendi !== false) x.push("🤔 Cosa intendevi?");
      var n = leggiGruppo(imp.gruppo).length;
      if (imp.usaMie !== false && (n || quanteDa(imp.quante) !== 5)) {   // (di partenza, senza parole dell'host, non lo dice: è la solita regola)
        x.push("📝 parole vostre: " + nomeQuante(quanteDa(imp.quante)) + (n ? " (" + n + " dell'host + quelle di chi entra)" : ""));
      }
      return x.join(" · ");
    },
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      stile();
      var prova = aiuti.modo === "prova";
      dove.squadre = 2; dove.parole = 25; dove.oro = true; dove.usaMie = true; dove.capoIo = true; dove.mazzo = "classico"; dove.tempo = 0; dove.intendi = true;
      dove.ritmo = "show"; dove.tempoInd = 0; dove.quante = 5;
      // in 2 o 3 si parte già «contro il Bot» (con gli amici della serata che si conoscono già)
      var quanti = aiuti.giocatori ? aiuti.giocatori.length : 0;
      if (!prova && quanti >= 2 && quanti < MIN) dove.squadre = "bot";
      // le scelte con bottoni .modo-chip: così l'host le ritrova in "⚙️ Regole" nella saletta
      function chips(titolo, valori, chiave, nota) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + (valori.length === 4 ? 4 : Math.min(3, valori.length)) + ",1fr)" });
        valori.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v[0] ? " attiva" : ""), style: "justify-content:center", onclick: function () {
            dove[chiave] = v[0]; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [ el("div", { class: "mt", text: v[1] }) ]);
          g.appendChild(b);
        });
        box.appendChild(g);
        if (nota) box.appendChild(el("p", { class: "modulo-nota", text: nota }));
      }
      if (prova) chips("Nella tua squadra il capo è…", [[true, "Io"], [false, "Bot"]], "capoIo", "I bot danno indizi a caso e indovinano un po' a naso: la prova serve a vedere come funziona il gioco.");
      else chips("Quante squadre", [[2, "2 squadre"], [3, "3 squadre (da 6)"], ["bot", "🤖 Contro il Bot (da 2)"]], "squadre", "Contro il Bot: tutti nella stessa squadra; dopo ogni vostro turno il Bot scopre da solo una sua parola.");
      chips("Quante parole sul tabellone", [[25, "25 (classico)"], [20, "20 (più grandi)"]], "parole", "Con 20 le caselle sono più grandi e la partita dura un po' meno.");
      chips("🃏 Il mazzo delle parole", MAZZI, "mazzo", "Con un mazzo a tema le parole sono tutte su quell'argomento (se non bastano, si aggiungono quelle classiche). 🌶️ Serata è per le serate tra adulti: maliziosa, ma senza volgarità.");
      chips("🎬 Ritmo", [["show", "🎬 Show"], ["veloce", "⚡ Veloce"]], "ritmo", "Show: la suspense lunga sulle parole che contano. Veloce: ogni parola si scopre in un attimo.");
      chips("⏳ Tempo per l'indizio", [[0, "Senza"], [90, "90 secondi"], [120, "2 minuti"]], "tempo", "Se il capo non dà l'indizio in tempo, il turno passa all'altra squadra. Il primo indizio della partita ha il tempo doppio.");
      chips("⏳ Tempo per indovinare", [[0, "Senza"], [60, "1 minuto"], [120, "2 minuti"]], "tempoInd", "Dopo l'indizio la squadra ha questo tempo per girare le parole (doppio al primo indizio), poi il turno passa.");
      chips("⭐ Parola d'oro", [[true, "Sì"], [false, "No"]], "oro", "Una parola di nessuno è d'oro, e non lo sa nessuno: chi la gira continua a indovinare con lo stesso indizio.");
      chips("🤔 Cosa intendevi?", [[true, "Sì"], [false, "No"]], "intendi", "Dopo l'indizio il capo può segnare di nascosto le parole che intendeva: a fine partita si scopre chi era più in sintonia.");
      // 📝 le TUE parole: restano salvate sul profilo. Si scrivono di fila ("Peppe, Ibiza, Kebab"), così gli amici se le passano;
      // dopo si vedono una alla volta, ognuna con la sua ✕
      var lista = leggiGruppo(window.SG && SG.listaProfilo ? SG.listaProfilo("ordine") : []);
      dove.gruppo = lista.slice();
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:14px", text: "📝 Le tue parole" }));
      box.appendChild(el("p", { class: "modulo-nota", text: "Restano salvate sul tuo profilo. Scrivile di fila, separate da virgola e spazio (es. Peppe, Ibiza, Kebab): così le puoi copiare e passare agli amici." }));
      var input = el("input", { type: "text", class: "link-campo", maxlength: "2000", placeholder: "Peppe, Ibiza, Kebab", autocomplete: "off" });
      var esito = el("p", { class: "modulo-nota or-esito" });
      var elenco = el("div", { class: "or-lista" });
      var conta = el("div", { class: "or-conta" });
      var bCopia = el("button", { class: "btn btn-fantasma btn-piccolo", text: "📋 Copia tutte", onclick: function () {
        var tx = lista.map(function (w) { return w.charAt(0) + w.slice(1).toLowerCase(); }).join(", ");
        function fatto() { bCopia.textContent = "✅ Copiate!"; setTimeout(function () { bCopia.textContent = "📋 Copia tutte"; }, 1600); }
        try { navigator.clipboard.writeText(tx).then(fatto, function () { window.prompt("Copia le tue parole:", tx); }); } catch (e) { window.prompt("Copia le tue parole:", tx); }
      } });
      var bSvuota = el("button", { class: "btn btn-fantasma btn-piccolo", text: "🗑️ Cancella tutte", onclick: function () {
        if (!lista.length) return;
        function via() { lista = []; salva(); disegnaLista(); }
        if (window.SG && SG.conferma) SG.conferma("Cancellare tutte le tue " + lista.length + " parole?", "Si cancellano anche dal tuo profilo.", "🗑️ Cancella", via);
        else via();
      } });
      function salva() {
        if (window.SG && SG.salvaListaProfilo) SG.salvaListaProfilo("ordine", lista.slice());
        dove.gruppo = lista.slice();   // così anche "⚙️ Regole" in saletta se ne accorge
      }
      function disegnaLista() {
        while (elenco.firstChild) elenco.removeChild(elenco.firstChild);
        lista.forEach(function (w, i) {
          elenco.appendChild(el("span", { class: "or-parola" }, [ el("span", { text: w }),
            el("button", { class: "or-x", "aria-label": "Cancella " + w, text: "✕", onclick: function () { lista.splice(i, 1); salva(); disegnaLista(); } }) ]));
        });
        conta.textContent = lista.length ? (lista.length === 1 ? "1 parola" : lista.length + " parole") + " · insieme a quelle degli amici" : "Ancora nessuna parola.";
        bCopia.style.display = bSvuota.style.display = lista.length ? "" : "none";
      }
      function aggiungi() {
        var nuove = String(input.value || "").split(/[,;\n]+/), messe = 0, scartate = [];
        nuove.forEach(function (w) {
          if (!w.trim()) return;
          var p = pulisciParola(w);
          if (!p) { scartate.push(w.trim()); return; }
          if (lista.some(function (x) { return norm(x) === norm(p); })) return;   // c'è già
          if (lista.length >= MAX_LISTA) { scartate.push(w.trim()); return; }
          lista.push(p); messe++;
        });
        input.value = "";
        if (messe) { salva(); disegnaLista(); }
        esito.textContent = (messe ? "✅ Aggiunte: " + messe + ". " : "") + (scartate.length ? "Non valgono (max 12 lettere, niente numeri): " + scartate.slice(0, 5).join(", ") + (scartate.length > 5 ? "…" : "") : "");
      }
      input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); aggiungi(); } });
      box.appendChild(el("div", { class: "or-aggiungi" }, [ input, el("button", { class: "btn btn-primario btn-piccolo", text: "➕ Aggiungi", onclick: aggiungi }) ]));
      box.appendChild(esito);
      box.appendChild(conta);
      box.appendChild(elenco);
      box.appendChild(el("div", { class: "or-lista-tasti" }, [ bCopia, bSvuota ]));
      disegnaLista();
      chips("Le parole vostre nel tabellone", [[true, "Sì"], [false, "No"]], "usaMie", "Anche gli amici portano le parole del loro profilo quando entrano.");
      chips("📝 Quante parole vostre in un tabellone", [[5, "5"], [10, "10"], ["meta", "Metà"], ["tutte", "Tutte"]], "quante", "Le altre si prendono dal mazzo. Se le parole vostre sono poche, si usano tutte quelle che ci sono.");
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
  window.__ORDINE = { erroreIndizio: erroreIndizio, leggiGruppo: leggiGruppo, radice: radice };
})();

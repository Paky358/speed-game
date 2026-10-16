/* =========================================================
   PAROLA D'ORDINE — come Codenames, ognuno dal suo telefono.
   2 o 3 squadre, 25 parole sul tabellone. Il capo di ogni squadra vede di chi è ogni parola
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
  var SQ = [
    { nome: "Rossi", em: "🔴", col: "#e03131", chiaro: "#ffe3e3" },
    { nome: "Blu", em: "🔵", col: "#1c7ed6", chiaro: "#d0ebff" },
    { nome: "Verdi", em: "🟢", col: "#2f9e44", chiaro: "#d3f9d8" }
  ];
  // quante parole per squadra: chi comincia ne ha una in più
  // (25 = il classico 5x5; 20 = 5x4 come Codenames Pictures: caselle più grandi e partite più corte)
  var DIVISIONE = {
    25: { 2: { sq: [9, 8], neutre: 7 }, 3: { sq: [7, 6, 6], neutre: 5 } },
    20: { 2: { sq: [8, 7], neutre: 4 }, 3: { sq: [6, 5, 5], neutre: 3 } }
  };
  var MAX_GRUPPO = 5;   // parole del gruppo che finiscono in un tabellone
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
  var MAZZI = [["classico", "Classico"], ["cinema", "🎬 Film e TV"], ["sport", "⚽ Sport"], ["napoli", "🌋 Napoli"], ["anni90", "📼 Anni 80-90"]];
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
  // HOST DI RISERVA: mentre si gioca l'host passa di nascosto tutta la partita a due "vice" (i primi due giocatori collegati).
  // Se l'host sparisce (schermo bloccato, WhatsApp, app chiusa) dopo pochi secondi il vice prende il suo posto
  // e la partita va avanti dal suo telefono; quando l'host torna rientra come giocatore normale, nella sua squadra.
  // "gen" conta i cambi di host: le foto di un host vecchio (gen più basso) non contano più.
  var SUBENTRO_MS = 6000;   // quanto aspetta il vice prima di prendere il posto (se l'host torna prima, niente cambia)
  // ripresa (solo per il vice che prende il posto): { codice, stato (la copia della partita), io (il suo id), omini }
  function host(t, ripresa) {
    var imp = t.impostazioni || {};
    var prova = !ripresa && imp.modo === "prova";   // 🧪 prova da solo (solo per il proprietario): tu e un bot contro due bot, senza rete
    if (!prova && !(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var IO = ripresa ? ripresa.io : "host";   // il mio id nella partita
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = ripresa ? (function (r) {   // la partita come l'aveva l'host di prima
      var h = JSON.parse(JSON.stringify(r.stato)), vecchio = h.hostId, io = null;
      h.codice = r.codice; h.pronta = false; h.gen = (h.gen || 1) + 1; h.hostId = IO; h.vici = []; h.prop = {};
      h.players.forEach(function (p) {
        p.omino = avatarValido((r.omini || {})[p.id]);
        if (p.id === vecchio) p.via = true;   // l'host di prima è sparito: se torna, rientra come giocatore
        if (p.id === IO) { p.via = false; io = p; }
      });
      h.msg = ""; h.progressi = h.progressi || {}; h.prossimi = h.prossimi || []; h.salta = h.salta || {}; h.nTurni = h.nTurni || 0; h.guarda = h.guarda || [];
      h.ind = h.ind || [];   // 🤔 gli indizi con le parole pensate dai capi (arrivano con la copia di riserva: non si perdono)
      if (h.rivedi) h.rivedi.fino = Date.now() + 15000;   // «Cosa intendevi?» a fine partita: riparte il conto (l'ora era del telefono di prima)
      return h;
    })(ripresa) : { fase: "lobby", codice: "…", pronta: false, nsq: +imp.squadre === 3 ? 3 : 2, nparole: +imp.parole === 20 ? 20 : 25, gruppo: imp.usaMie === false ? [] : leggiGruppo(imp.gruppo), oro: imp.oro !== false, tempo: tempoDa(imp.tempo), mazzo: imp.mazzo || "classico",
      intendi: imp.intendi !== false, ind: [], cosa: null, rivedi: null,   // 🤔 «Cosa intendevi?»
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), team: 0 }], capo: [null, null, null],
      tab: null, bid: 0, turno: 0, passo: "indizio", indizio: null, tentativi: 0, girate: 0, prop: {}, storia: [], fuori: [],
      vince: -1, classifica: null, msg: "", ultima: null, nGirate: 0, gen: 1, hostId: IO, vici: [], progressi: {}, prossimi: [], salta: {}, nTurni: 0,
      guarda: [] };   // guarda: nella Sala, chi non è stato scelto per giocare (guarda soltanto, col suo id nella foto)
    if (prova) {   // i bot fissi del gruppo (SG.bot): il primo in squadra con te, gli altri due nell'altra. Giocano a caso: livello facile
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
    function piuPiccola() { var best = 0, n = 1e9; for (var k = 0; k < H.nsq; k++) { var m = membri(k).length; if (m < n) { n = m; best = k; } } return best; }
    function capoVivo(k) { var c = pById(H.capo[k]); return !!(c && !c.via && c.team === k); }
    // ogni squadra ha un capo: se manca (o ha cambiato squadra) lo diventa il primo della squadra
    function sistemaCapi() {
      for (var k = 0; k < 3; k++) {
        if (k >= H.nsq) { H.capo[k] = null; continue; }
        var c = pById(H.capo[k]);
        if (!c || c.team !== k || (H.fase === "lobby" && c.via)) { var m = membri(k); H.capo[k] = m.length ? m[0].id : null; }
      }
    }
    function resto(k) { var n = 0; (H.tab || []).forEach(function (c) { if (c.c === k && !c.g) n++; }); return n; }
    // la "chat" della partita: gli indizi dei capi e le parole girate (con chi le ha girate); ogni voce ha il suo numero
    function scrivi(e) { H.log = H.log || []; H.logN = (H.logN || 0) + 1; e.n = H.logN; H.log.push(e); if (H.log.length > 60) H.log.shift(); }
    function vive() { var v = []; for (var k = 0; k < H.nsq; k++) if (H.fuori.indexOf(k) < 0) v.push(k); return v; }
    function omini() { var o = {}; H.players.forEach(function (p) { o[p.id] = p.omino || null; }); return o; }

    // "⚙️ Regole" nella saletta: squadre e parole del gruppo
    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      H.nsq = +im.squadre === 3 ? 3 : 2; H.nparole = +im.parole === 20 ? 20 : 25; H.gruppo = im.usaMie === false ? [] : leggiGruppo(im.gruppo); H.oro = im.oro !== false; H.tempo = tempoDa(im.tempo); H.mazzo = im.mazzo || "classico"; H.intendi = im.intendi !== false;
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
        if (!ripresaFatta) {   // il vice ha appena preso il posto: le chiavi ai capi e l'appello (chi non risponde è uscito anche lui)
          ripresaFatta = true; mandaChiavi();
          if (H.sospeso) { clearTimeout(tSosp); tSosp = setTimeout(rivela, 1500); }   // c'era una parola in sospeso: la scopro io
          if (H.rivedi) oraRivedi();   // c'era «🤔 Cosa intendevi?» a schermo: il conto lo tengo io
          H.appello = {}; rete.inviaVeloce({ t: "appello", gen: H.gen });
          setTimeout(function () {
            if (ceduto || !H.appello) return;
            H.players.forEach(function (p) { if (p.id !== IO && !p.via && !H.appello[p.id]) { p.via = true; delete H.prop[p.id]; } });
            H.appello = null;
            if (H.fase === "gioco") controllaTurno();
            bd();
          }, 5000);
          controllaTurno();
        }
        bd();
      },
      // le foto degli host: se un altro ha preso il mio posto (gen più alto) torno giocatore;
      // se arriva una foto vecchia (un host che non sa ancora di essere stato sostituito) rimetto la mia
      onStato: function (s) {
        if (ceduto || !s || s.t !== "vm" || !s.vm || s.vm.gen == null) return;
        if (s.vm.gen > H.gen && s.vm.hostId !== IO) return cediPosto();
        if (s.vm.gen === H.gen && s.vm.hostId && s.vm.hostId !== IO && s.vm.hostId < IO) return cediPosto();   // due vice partiti insieme: ne resta uno solo
        if (s.vm.gen < H.gen) bd();
      },
      onAddio: function (id) {
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
    var rete = prova ? { invia: function () {}, inviaVeloce: function () {}, chiudi: function () {}, lascia: function () {} }
      : SGNet.ospita(ID, callbacks, { codice: ripresa ? ripresa.codice : null, ascoltaStato: true, keepalive: 10 });
    if (prova) setTimeout(function () { H.codice = "PROVA"; H.pronta = true; comincia(); }, 0);   // in prova niente saletta: si comincia subito
    // un altro telefono ha preso il posto di host (io ero sparito): esco in silenzio e rientro come giocatore normale
    function cediPosto() {
      if (ceduto) return; ceduto = true; clearTimeout(tAttesa); clearTimeout(tSosp); clearTimeout(tCless); clearTimeout(tRis); clearTimeout(tRiv);
      try { rete.lascia(); } catch (e) {}
      if (SGNet.ricordaId) SGNet.ricordaId(H.codice, IO);
      ospite(t, H.codice);
    }
    // i vice: i primi due giocatori collegati dopo di me (se uno esce, lo sostituisce il prossimo). Gli mando di nascosto tutta la partita
    // (senza gli avatar, li hanno già). Due, così se escono l'host e il primo vice quasi insieme c'è ancora chi prende il posto.
    function scegliVice() {
      var tenuti = (H.vici || []).filter(function (id) { var p = pById(id); return p && !p.via && id !== IO; });
      H.players.forEach(function (p) { if (tenuti.length < 2 && !p.via && !p.bot && p.id !== IO && tenuti.indexOf(p.id) < 0) tenuti.push(p.id); });
      H.vici = tenuti;
    }
    // la copia parte subito quando cambia qualcosa di importante (turno, parola girata, capi, fine…);
    // per il resto (es. le parole segnate) al massimo una volta ogni 3 secondi
    var tRis = null, oraRis = 0, kRis = "";
    function mandaRiserva() {
      if (!H.vici.length || (H.fase !== "gioco" && H.fase !== "fine")) return;
      var k = [H.fase, H.turno, H.passo, H.nGirate, H.storia.length, H.capo.join(","), H.players.length, H.vici.join(","), !!H.sospeso, H.fuori.join("")].join("|"), ora = Date.now();
      k += "|" + (H.ind || []).filter(function (x) { return x.pensate; }).length + "|" + (H.rivedi ? H.rivedi.av.length : "-");   // (anche le parole pensate dai capi)
      if (k === kRis && ora - oraRis < 3000) {
        if (!tRis) tRis = setTimeout(function () { tRis = null; if (!ceduto) { kRis = ""; mandaRiserva(); } }, 3000 - (ora - oraRis));
        return;
      }
      clearTimeout(tRis); tRis = null; kRis = k; oraRis = ora;
      var copia = JSON.parse(JSON.stringify(H));
      copia.players.forEach(function (p) { p.omino = null; });
      H.vici.forEach(function (id) { rete.inviaVeloce({ t: "riserva", to: id, gen: H.gen, stato: copia }); });
    }
    // la "foto" per tutti: SEMPRE con gli id; la chiave del tabellone MAI (va solo ai capi)
    function vm() {
      var fine = H.fase === "fine", r = [];
      for (var k = 0; k < H.nsq; k++) r.push(resto(k));
      var ora = Date.now(), att = null, cl = null;
      if (H.fase === "gioco" && H.attesa) att = { k: H.attesa.k, chi: H.attesa.chi || "", ms: Math.max(0, H.attesa.fino - ora) };
      if (H.fase === "gioco" && H.cless && H.passo === "indizio" && !H.attesa) cl = { ms: Math.max(0, H.cless.fino - ora) };
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, nsq: H.nsq, gruppoN: H.gruppo.length, tempo: H.tempo || 0, mazzo: H.mazzo || "classico",
        attesa: att, cless: cl, prossimi: (H.prossimi || []).map(function (p) { return { id: p.id, nome: p.nome }; }),
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, team: p.team, via: !!p.via, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }),
        capo: H.capo.slice(0, H.nsq),
        tab: H.tab ? H.tab.map(function (c) { return { w: c.w, g: c.g, c: (c.g || fine) ? c.c : null, oro: (c.g || fine) && c.oro ? 1 : 0 }; }) : null, oro: H.oro,
        bid: H.bid, turno: H.turno, passo: H.passo, indizio: H.indizio, tentativi: H.tentativi, girate: H.girate, prop: H.prop,
        storia: H.storia.slice(-8), log: (H.log || []).slice(-40), fuori: H.fuori.slice(), vince: H.vince, classifica: H.classifica, msg: H.msg, ultima: H.ultima, resto: r,
        gen: H.gen, hostId: H.hostId, vici: H.vici.slice(), sospeso: H.sospeso || null, guarda: (H.guarda || []).slice(),
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
      if (!id || H.fase !== "gioco") return;
      if (id === IO) { chiaveHost = { bid: H.bid, col: chiave() }; return; }
      // int = gli indizi di questo capo per cui ha già detto (o saltato) le parole che intendeva: chi rientra non se lo vede richiedere
      var int = []; (H.ind || []).forEach(function (I, x) { if (I.id === id && I.pensate) int.push(x); });
      privato(id, { t: "chiave", bid: H.bid, col: chiave(), int: int });
    }
    function mandaChiavi() { for (var k = 0; k < H.nsq; k++) mandaChiave(H.capo[k]); }
    function bd() { if (ceduto) return; scegliVice(); var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); mandaRiserva(); if (prova) pianificaBot(); }

    // ----- le mosse (dell'host e degli ospiti passano tutte da qui) -----
    function azione(id, m) {
      if (!m || !m.t) return;
      var p = pById(id);
      if (m.t === "join") {
        var nuovo = { id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino) };
        var gia = (H.prossimi || []).some(function (x) { return x.id === id; });
        if (p) { if (p.via) delete H.salta[p.team]; p.via = false; }   // rientra: è di nuovo nella sua squadra
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
      if (m.t === "presente") {   // risponde all'appello del nuovo host (se l'avevo già segnato uscito, rientra)
        if (H.appello) H.appello[id] = 1;
        if (p.via) { p.via = false; delete H.salta[p.team]; if (H.fase === "gioco") controllaTurno(); bd(); if (H.capo.indexOf(id) >= 0) mandaChiave(id); }
        return;
      }
      if (H.fase === "lobby") {
        if (m.t === "squadra" && +m.s >= 0 && +m.s < H.nsq) { p.team = +m.s; sistemaCapi(); bd(); }
        else if (m.t === "capo") { H.capo[p.team] = id; bd(); }
        else if (m.t === "mischia" && id === IO) mischia();
        return;
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
          [].concat(m.l || []).forEach(function (i) { i = Math.floor(+i); if (H.tab[i] && H.tab[i].c === I.k && l.indexOf(i) < 0 && l.length < max) l.push(i); });
          if (!l.length) return;
          I.pensate = l;
        }
        mandaRiserva(); return;   // (la foto non cambia: le parole pensate non ci vanno)
      }
      var miaSquadra = p.team === H.turno, sonoCapo = H.capo[p.team] === id;
      if (m.t === "capo") {   // a partita iniziata: solo se il capo della squadra non c'è più
        if (capoVivo(p.team) || H.fuori.indexOf(p.team) >= 0) return;
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
        H.storia.push({ k: H.turno, parola: parola, n: n });
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
    function mischia() {
      var tutti = mescola(H.players.filter(function (p) { return !p.via; }));
      tutti.forEach(function (p, i) { p.team = i % H.nsq; });
      H.capo = [null, null, null]; sistemaCapi(); bd();
    }

    // ----- la partita -----
    function pronti() {
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
      mescola(H.gruppo).slice(0, MAX_GRUPPO).forEach(metti);
      mescola(mazzo(H.mazzo) || []).forEach(metti);
      mescola(elenco()).forEach(metti);
      parole = mescola(parole);
      var d = DIVISIONE[H.nparole || 25][H.nsq], primo = Math.floor(Math.random() * H.nsq), colori = [];
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
    var SOSPENSE_MS = 2300, tSosp = null;
    function sospendi(i, id) {
      var c = H.tab[i]; if (!c || c.g || H.sospeso) return;
      H.nSosp = (H.nSosp || 0) + 1;
      H.sospeso = { i: i, id: id, k: H.turno, n: H.nSosp };   // gli altri segni restano: si può continuare con quelle
      bd();
      clearTimeout(tSosp); tSosp = setTimeout(rivela, SOSPENSE_MS);
    }
    function rivela() {
      var s = H.sospeso; if (!s || ceduto) return;
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
      H.indizio = null; H.prop = {}; H.passo = "indizio"; H.girate = 0; H.tentativi = 0;
      H.turno = k2; H.nTurni = (H.nTurni || 0) + 1; H.attesa = null;
    }
    function fineTurno() {
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
    // Scaduto il tempo: se manca il capo e la squadra ha ancora due persone, il capo lo fa un compagno; se no tocca alla squadra dopo,
    // e da lì in poi i turni di quella squadra si saltano subito finché non torna qualcuno (niente attese a ogni giro).
    // La scadenza sta nella partita, così vale anche se intanto cambia l'host.
    var ATTESA_SQUADRA = 60000, ATTESA_INDOVINO = 30000, tAttesa = null;
    function controllaTurno() {
      clearTimeout(tAttesa); tAttesa = null;
      if (H.fase !== "gioco") { H.attesa = null; H.cless = null; clearTimeout(tCless); return; }
      var k = H.turno, cosa = manca(k);
      if (!cosa) { H.attesa = null; return oraClessidra(); }
      H.cless = null; clearTimeout(tCless);   // la clessidra riparte da capo quando la squadra è di nuovo al completo
      var m = membri(k), puoCapo = cosa === "capo" && m.length >= 2;
      if (H.salta[k] && !puoCapo) return salta(k);
      if (!H.attesa || H.attesa.k !== k || H.attesa.passo !== H.passo || H.attesa.n !== H.nTurni)
        H.attesa = { k: k, passo: H.passo, n: H.nTurni, fino: Date.now() + (cosa === "indovino" && H.passo === "indovina" ? ATTESA_INDOVINO : ATTESA_SQUADRA) };
      H.attesa.chi = chiManca(k, cosa);
      function riprova(ms) { tAttesa = setTimeout(function () { if (!ceduto) { controllaTurno(); bd(); } }, ms); }
      if (Date.now() < H.attesa.fino) { riprova(H.attesa.fino - Date.now() + 50); return; }
      if (puoCapo) {
        H.capo[k] = m[0].id; mandaChiave(m[0].id); H.attesa = null;
        scrivi({ t: "sis", testo: "👑 Ora il capo dei " + SQ[k].nome + " è " + m[0].nome });
        return controllaTurno();
      }
      H.salta[k] = 1;
      salta(k);
    }
    function salta(k) {   // la squadra k non può giocare: tocca alla prossima che può
      for (var s = 1; s < H.nsq; s++) {
        var k2 = (k + s) % H.nsq;
        if (H.fuori.indexOf(k2) >= 0 || membri(k2).length < 2) continue;
        H.msg = "⏭️ Ai " + SQ[k].nome + " manca qualcuno: tocca ai " + SQ[k2].nome + ".";
        scrivi({ t: "sis", testo: "⏭️ Ai " + SQ[k].nome + " manca qualcuno: tocca ai " + SQ[k2].nome });
        nuovoTurno(k2);
        return controllaTurno();
      }
      // nessuna squadra può giocare: si aspetta ancora (l'host può chiudere la partita)
      if (!H.attesa) H.attesa = { k: k, passo: H.passo, n: H.nTurni, chi: chiManca(k, manca(k)) };
      H.attesa.fino = Date.now() + 30000;
      tAttesa = setTimeout(function () { if (!ceduto) { controllaTurno(); bd(); } }, 30050);
    }
    // ⏳ la clessidra del capo (se l'host l'ha accesa): allo scadere il turno passa
    var tCless = null;
    function oraClessidra() {
      clearTimeout(tCless); tCless = null;
      if (!H.tempo || H.passo !== "indizio" || H.fase !== "gioco") { H.cless = null; return; }
      var key = H.turno + "|" + H.nTurni;
      if (!H.cless || H.cless.key !== key) H.cless = { key: key, fino: Date.now() + H.tempo * 1000 };
      tCless = setTimeout(function () {
        if (ceduto || H.fase !== "gioco" || H.passo !== "indizio" || !H.cless || H.cless.key !== H.turno + "|" + H.nTurni) return;
        H.msg = "⏳ Tempo scaduto per i " + SQ[H.turno].nome + "!";
        scrivi({ t: "sis", testo: "⏳ Tempo scaduto per il capo dei " + SQ[H.turno].nome });
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
      H.fase = "fine"; H.vince = k; H.prop = {}; H.indizio = null; H.attesa = null; H.cless = null;
      clearTimeout(tAttesa); clearTimeout(tCless);
      // posti: 1 chi vince, 2 chi era ancora in gioco, 3 chi è uscito con la parola nera
      var restaAltro = vive().some(function (x) { return x !== k; });
      H.classifica = H.players.map(function (p) {
        return { id: p.id, nome: p.nome, team: p.team, pos: p.team === k ? 1 : H.fuori.indexOf(p.team) >= 0 && restaAltro ? 3 : 2 };
      }).sort(function (a, b) { return a.pos - b.pos; });
      H.msg = motivo || "🎉 Vincono i " + SQ[k].nome + "!"; scrivi({ t: "fine", k: k });
      // il riepilogo nella chat: il miglior indizio, chi ha trovato più parole, la parola nera
      if (H.migliore && H.migliore.giuste >= 2) scrivi({ t: "sis", testo: "🏅 Miglior indizio: " + H.migliore.p + " " + (H.migliore.n === 0 ? "∞" : H.migliore.n) + " di " + H.migliore.nome + " (" + H.migliore.giuste + " parole)" });
      var top = null;
      H.players.forEach(function (p) { var g = (H.progressi[p.id] || {}).paroleGiuste || 0; if (g > 0 && (!top || g > top.g)) top = { nome: p.nome, g: g }; });
      if (top) scrivi({ t: "sis", testo: "🔎 Più parole trovate: " + top.nome + " (" + top.g + ")" });
      var nera = (H.tab || []).filter(function (c) { return c.c === "x"; })[0];
      if (nera) scrivi({ t: "sis", testo: "💣 La parola nera era " + nera.w });
      H.players.forEach(function (p) {
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
      tRiv = setTimeout(function () { if (!ceduto) chiudiRivedi(); }, Math.max(0, H.rivedi.fino - Date.now()) + 50);
    }
    function chiudiRivedi() { clearTimeout(tRiv); if (!H.rivedi) return; H.rivedi = null; bd(); }
    function umaniPresenti() { return presenti().filter(function (p) { return !p.bot; }); }
    function servonoRivedi() { return Math.floor(umaniPresenti().length / 2) + 1; }
    function votiRivedi() { return H.rivedi ? H.rivedi.av.filter(function (id) { var p = pById(id); return p && !p.via && !p.bot; }).length : 0; }
    // "Nuova partita": stessa stanza, stessi amici, stesse squadre; il capo passa al prossimo della squadra.
    // Chi era arrivato a partita finita entra adesso, nella squadra più piccola.
    function nuova() {
      H.fase = "lobby"; H.classifica = null; H.tab = null; H.players = presenti(); H.msg = ""; chiaveHost = null;
      H.cosa = null; H.rivedi = null; H.ind = []; clearTimeout(tRiv);
      for (var k = 0; k < H.nsq; k++) {
        var m = membri(k), i = -1;
        m.forEach(function (p, j) { if (p.id === H.capo[k]) i = j; });
        H.capo[k] = m.length ? m[(i + 1) % m.length].id : null;
      }
      (H.prossimi || []).forEach(function (p) { if (H.players.length < MAX && !pById(p.id)) { p.team = piuPiccola(); H.players.push(p); } });
      H.prossimi = [];
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
          clearTimeout(tBot); clearTimeout(tAttesa); clearTimeout(tCless); clearTimeout(tSosp); clearTimeout(tRis); clearTimeout(tRiv);
          ceduto = true;   // da qui niente più foto né schermate
          rete.chiudi(); t.esci();
        }
        // un tocco sbagliato non chiude il gioco a tutti (la finestra al centro dell'app)
        if (H.fase === "gioco" && !gia) return t.conferma(prova ? "Uscire dalla prova?" : "Chiudere la partita per tutti?", prova ? null : "Gli amici tornano alla saletta.", prova ? "Esci" : "Chiudi", via);
        via();
      } };
    // la Rivincita dei tasti di fine comuni: tutti di nuovo nella saletta, stesse squadre (il core fa il 3-2-1).
    // Vale anche per l'amico che porta avanti la partita al posto dell'host (host di riserva)
    if (!prova) t.onRivincita = function () { if (H.fase === "fine" && !ceduto) nuova(); };
    if (!prova) bd();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null, omini: {}, chiave: null, chiesta: 0, gen: 0, copia: null, tVice: null };
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
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;          // era per un altro telefono
          if (m.t === "vm") {
            if (m.vm.gen != null) { if (m.vm.gen < S.gen) return; S.gen = m.vm.gen; }   // la foto di un host vecchio (sostituito): non conta
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
          else if (m.t === "omini") { S.omini = m.omini || {}; if (S.vm) disegna(t, S.vm, cb); }
          else if (m.t === "riserva") { if (m.gen >= S.gen) S.copia = m.stato; }   // sono il vice: tengo la copia della partita
          else if (m.t === "appello") { if (S.rete) S.rete.invia({ t: "presente" }); }   // il nuovo host chiede chi c'è
          else if (m.t === "avviso") avviso(m.testo);
          else if (m.t === "piena" && S.rete) {   // la stanza ha già 12 giocatori: esco e lo dico
            var r = S.rete; S.rete = null; try { r.chiudi(); } catch (e) {}
            UI = null;
            errore(t, "La stanza è piena: ci sono già " + MAX + " giocatori.");
          }
        },
        // l'host è sparito (o è tornato): se sono un vice, dopo un attimo prendo il suo posto (il secondo vice aspetta il doppio)
        onHostVia: function (via) {
          clearTimeout(S.tVice); S.tVice = null;
          if (!via) return;
          var v = S.vm, pos = v && v.vici ? v.vici.indexOf(S.myId) : -1;
          if (!v || (v.fase !== "gioco" && v.fase !== "fine") || pos < 0 || !S.copia || S.copia.gen !== v.gen) return;
          S.tVice = setTimeout(subentra, SUBENTRO_MS * (pos + 1));
        },
        onChiuso: function () { errore(t, "La partita è stata chiusa dall'host."); },
        onErrore: function () { errore(t, "Problema di collegamento. Riprova."); }
      });
    }
    function subentra() {
      S.tVice = null;
      var v = S.vm; if (!v || !v.vici || v.vici.indexOf(S.myId) < 0 || !S.copia || !S.rete || S.copia.gen !== S.gen) return;   // se un altro vice ha già preso il posto, niente
      var copia = S.copia, rete = S.rete;
      S.copia = null; S.rete = null;
      try { rete.lascia(); } catch (e) {}
      host(t, { codice: codice, stato: copia, io: S.myId, omini: S.omini });
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
    if (!UI || UI.bid !== vm.bid || !UI.S || !UI.S.vivo()) UI = creaSchermo(t, vm, cb);
    UI.cb = cb; UI.vm = vm;
    aggiorna(UI, vm, cb);
  }
  function trova(vm, id) { for (var i = 0; i < vm.players.length; i++) if (vm.players[i].id === id) return vm.players[i]; return null; }
  function prontiVm(vm) {
    var vivi = vm.players.filter(function (p) { return !p.via; });
    if (vivi.length < (vm.nsq === 3 ? 6 : MIN)) return false;
    for (var k = 0; k < vm.nsq; k++) if (vivi.filter(function (p) { return p.team === k; }).length < 2) return false;
    return true;
  }
  function lobby(t, vm, cb) {
    stile();
    var el = t.el, io = trova(vm, cb.myId), box = el("div", { class: "or-squadre" });
    for (var k = 0; k < vm.nsq; k++) (function (k) {
      var mem = vm.players.filter(function (p) { return p.team === k; });
      box.appendChild(el("div", { class: "or-sq", style: "--c:" + SQ[k].col }, [
        el("div", { class: "or-sq-testa" }, [
          el("b", { text: SQ[k].em + " " + SQ[k].nome }),
          io && io.team !== k ? el("button", { class: "btn btn-fantasma btn-piccolo", text: "Vengo qui", onclick: function () { cb.manda({ t: "squadra", s: k }); } }) : null ]),
        el("div", { class: "or-sq-membri" }, mem.length ? mem.map(function (p) {
          return el("span", { class: "or-membro" + (p.id === cb.myId ? " tu" : ""), text: (vm.capo[k] === p.id ? "👑 " : "") + p.nome + (p.id === cb.myId ? " (tu)" : "") });
        }) : [ el("span", { class: "or-vuota", text: "Nessuno: servono almeno 2" }) ]),
        io && io.team === k && vm.capo[k] !== cb.myId ? el("button", { class: "btn btn-fantasma btn-piccolo", text: "👑 Faccio io il capo", onclick: function () { cb.manda({ t: "capo" }); } }) : null ]));
    })(k);
    if (cb.sonoHost) box.appendChild(el("button", { class: "btn btn-fantasma btn-piccolo", text: "🔀 Squadre a caso", onclick: function () { cb.manda({ t: "mischia" }); } }));
    var ok = prontiVm(vm);
    var nota = vm.nsq === 3 ? "A 3 squadre: almeno 6 giocatori, 2 per squadra." : "Almeno 4 giocatori, 2 per squadra.";
    var info = [];
    if (vm.mazzo && vm.mazzo !== "classico") info.push("Mazzo " + nomeMazzo(vm.mazzo));
    if (vm.oro) info.push("⭐ Parola d'oro accesa");
    if (vm.intendi) info.push("🤔 Cosa intendevi?");
    if (vm.tempo) info.push("⏳ " + (vm.tempo % 60 ? vm.tempo + " secondi" : vm.tempo === 60 ? "1 minuto" : vm.tempo / 60 + " minuti") + " per l'indizio");
    if (vm.gruppoN) info.push("📝 " + vm.gruppoN + (vm.gruppoN === 1 ? " parola vostra" : " parole vostre") + " nel mazzo");
    if (info.length) nota += " " + info.join(" · ") + ".";
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: vm.nsq === 3 ? 6 : MIN,
      vuoti: Math.max(0, (vm.nsq === 3 ? 6 : MIN) - vm.players.length),   // solo i posti che mancano per cominciare
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.hostId ? p.id === vm.hostId : i === 0, tu: p.id === cb.myId }; }),
      extra: [ box ], puoComincia: ok,
      spettatore: !cb.sonoHost && !io && (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta guardi" : null,   // nella Sala: non scelto, guarda
      nota: ok ? "Ognuno sceglie la sua squadra; il capo ha la 👑." + (info.length ? " " + info.join(" · ") + "." : "") : nota, testoComincia: "Comincia ▶",
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
    return { lista: lista, io: io, k: k2.join(",") + "|" + Object.keys(om).length + "|" + cb.myId };
  }
  function posizionaBanchi(ui, S) {   // i banconi delle squadre, in basso (si risistemano se cambia la misura dello schermo)
    if (!ui.banchi || !ui.banchi.length) return;
    var n = ui.banchi.length, VW = S.VW, VH = S.VH, larg = 1.92 * VW / n;
    ui.banchi.forEach(function (B, k) {
      var w = larg - 0.05 * VW, x = 0.04 * VW + k * larg + 0.025 * VW, top = 1.24 * VH, h = 0.52 * VH, s = B.el.style;
      B.box = { x: x, y: top, w: w, h: h };
      s.left = x + "px"; s.top = top + "px"; s.width = w + "px"; s.height = h + "px"; s.fontSize = (w * 0.045).toFixed(1) + "px";
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
      var key = mem.map(function (p) { return p.id + (p.via ? "-" : "") + (B.facce[p.id] || ""); }).join(",") + "|" + Object.keys(om).length;
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
    passi.forEach(function (p) { t0 += p[0]; ui.tScena.push(setTimeout(function () { if (ui.S.vivo()) p[1](); }, t0)); });
    ui.tScena.push(setTimeout(function () { prossimaScena(ui); }, t0 + 60));
  }
  function scenaSospeso(ui, vm, s) {   // chi gira la parola la dice: vignetta sopra la sua testa al bancone; poi la casella trema e il pubblico fa "ooooh"
    var S = ui.S, B = ui.banchi[s.k], parola = (vm.tab[s.i] || {}).w || "", passi = [];
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
      passi.push([0, function () { ST.suLeggio(S, k, 700); ST.faccia(S, k, "esulta"); ST.terzo(S, k, capo.nome, "Il capo dei " + SQ[k].nome, "👑"); }]);
      passi.push([1600, function () { ST.faccia(S, k, null); }]);
    })(k);
    passi.push([0, function () { ST.viaTerzo(S); }], [100, function () {}]);
    scena(ui, passi, true);
  }
  function creaSchermo(t, vm, cb) {
    stile(); ST = window.SGStudio;
    var el = t.el;
    var ui = { t: t, el: el, bid: vm.bid, cb: cb, vm: vm, carte: [], kSotto: "", pan: [], ultimaN: vm.ultima ? vm.ultima.n : 0, facce: {}, logN: 0,
      nsq: vm.nsq, banchi: [], coda: [], inScena: false, avviato: false, turnoVisto: null };
    var capi = capiDi(ui, vm, cb);
    ui.kCapi = capi.k;
    if (window.__ORDINE) window.__ORDINE.ui = ui;   // (per le prove)
    ui.S = ST.crea(t, capi.lista, { io: capi.io, esci: function () { ui.cb.onEsci(true); }, titolo: "Parola d'ordine", logo: ["PAROLA", "D'ORDINE"],
      posti: function (S) { return postiCapi(S, ui.nsq); }, dopoLayout: function (S) { posizionaBanchi(ui, S); adattaScritte(ui); } });
    var S = ui.S;
    S.vista.classList.add("or-studio");
    // il tabellone finisce sopra la barra dei tasti anche quando la barra cresce da sola (es. «👥 Avete giocato con» che arriva dopo)
    try { if (window.ResizeObserver && S.barraEl) new ResizeObserver(function () { if (S.barraEl.offsetHeight) S.vista.style.setProperty("--or-barra", (S.barraEl.offsetHeight + 6) + "px"); }).observe(S.barraEl); } catch (e) {}
    for (var k = 0; k < vm.nsq; k++) ST.testoLeggio(S, k, SQ[k].nome.toUpperCase());
    // il maxischermo: squadre con le faccine, indizio, tabellone, chat
    var pannelli = el("div", { class: "or-pannelli" });
    for (k = 0; k < vm.nsq; k++) {
      var P = { n: el("b", { class: "or-pan-n" }), facce: el("div", { class: "or-facce" }), kf: "" };
      P.el = el("div", { class: "or-pan", style: "--c:" + SQ[k].col }, [ el("div", { class: "or-pan-testa" }, [ el("span", { text: SQ[k].nome }), P.n ]), P.facce ]);
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
      Object.keys(ui.conti).forEach(function (k) { var c = ui.conti[k]; if (!c.el.isConnected) return; var tx = mmss(c.fino - Date.now()); if (c.el.textContent !== tx) c.el.textContent = tx; });
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
    return { io: io, team: team, capo: capo, capoVia: capoVia, altri: altri, prossimo: prossimo, mioTurno: vm.fase === "gioco" && team === vm.turno,
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
    if (e.t === "fine") return el("div", { class: "or-l sis fine" }, [ el("span", { text: "🎉 Vincono i " + SQ[e.k].nome + "!" }) ]);
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
    if (capi.k !== ui.kCapi) { ui.kCapi = capi.k; S.impostaGiocatori(capi.lista, capi.io); for (var kk = 0; kk < vm.nsq; kk++) ST.testoLeggio(S, kk, SQ[kk].nome.toUpperCase()); }
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
      var kf = mem.map(function (p) { return p.id + (p.via ? "-" : "") + (p.id === vm.capo[k] ? "*" : ""); }).join(",") + "|" + cb.myId + "|" + Object.keys((cb.omini && cb.omini()) || {}).length;
      if (P.kf !== kf) {
        P.kf = kf;
        while (P.facce.firstChild) P.facce.removeChild(P.facce.firstChild);
        mem.forEach(function (p) { P.facce.appendChild(faccia(ui, p.id, p.nome, (p.id === vm.capo[k] ? "capo" : "") + (p.via ? " via" : "") + (p.id === cb.myId ? " tu" : ""))); });
      }
    });
    // ---- l'indizio, grande ----
    var ki;
    if (fine) ki = "f|" + vm.vince;
    else if (vm.passo === "indizio") ki = "a|" + vm.turno + "|" + (r.mioTurno && r.capo) + "|" + !!vm.cless;
    else ki = "i|" + vm.turno + "|" + vm.indizio.parola + "|" + vm.indizio.n + "|" + vm.tentativi;
    if (ui.kInd !== ki) {
      ui.kInd = ki; var el = ui.el, I = ui.ind;
      while (I.firstChild) I.removeChild(I.firstChild);
      I.style.setProperty("--c", fine ? (SQ[vm.vince] || SQ[0]).col : SQ[vm.turno].col);
      if (fine) I.appendChild(el("div", { class: "or-ind-stato", text: vm.vince >= 0 ? "🎉 Vincono i " + SQ[vm.vince].nome + "!" : "Partita finita" }));
      else if (vm.passo === "indizio") {
        I.appendChild(el("div", { class: "or-ind-stato", text: r.mioTurno && r.capo ? "👑 Tocca a te: dai l'indizio" : "Il capo dei " + SQ[vm.turno].nome + " pensa all'indizio…" }));
        if (vm.cless) I.appendChild(el("div", { class: "or-ind-tent or-cless" }, [ document.createTextNode("⏳ "), conto(ui, "cless", vm.cless.ms) ]));
      }
      else {
        I.appendChild(el("small", { text: "INDIZIO DEI " + SQ[vm.turno].nome.toUpperCase() }));
        I.appendChild(el("b", {}, [ document.createTextNode(vm.indizio.parola), el("span", { class: "n", text: vm.indizio.n === 0 ? "∞" : String(vm.indizio.n) }) ]));
        I.appendChild(el("div", { class: "or-ind-tent", text: vm.tentativi >= 99 ? "tentativi liberi" : "ancora " + vm.tentativi + (vm.tentativi === 1 ? " tentativo" : " tentativi") }));
      }
    }
    if (vm.cless && !fine) conto(ui, "cless", vm.cless.ms);   // il tempo giusto a ogni foto
    if (vm.attesa && !fine) conto(ui, "attesa", vm.attesa.ms);
    // ---- il tabellone (solo le carte che cambiano) ----
    var chi = {};   // parola -> chi la propone
    Object.keys(vm.prop || {}).forEach(function (id) { [].concat(vm.prop[id]).forEach(function (i) { (chi[i] = chi[i] || []).push(id); }); });
    var sel = r.intendo ? selDi(vm) : null;   // 🤔 le parole che sto segnando come "intese"
    vm.tab.forEach(function (c, i) {
      var C = ui.carte[i], col = c.c != null ? c.c : (key ? key[i] : null);
      var cls = "or-carta" + (c.g ? " g" : "") + (col != null ? " c" + col : "") + (!c.g && key ? " chiave" : "") + (fine && !c.g ? " svelata" : "") + (c.oro ? " oro" : "") + (vm.sospeso && vm.sospeso.i === i && !c.g ? " sospesa" : "") +
        (r.indovino && !c.g && !vm.sospeso ? " attiva" : "") + (segnata(vm, cb.myId, i) && r.indovino ? " mia" : "") +
        (sel && col === r.team ? " attiva" : "") + (sel && sel.indexOf(i) >= 0 ? " pensata" : "");
      if (C.cls !== cls) { C.b.className = cls; C.cls = cls; }
      var kp = (chi[i] || []).join(",") + "|" + Object.keys((cb.omini && cb.omini()) || {}).length;   // si ridisegna anche quando arrivano gli avatar
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
    var nOm = Object.keys((cb.omini && cb.omini()) || {}).length;
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
    var ks = r.intendo ? ["int", vm.bid, vm.indizio.x, vm.attesa ? vm.attesa.k + "/" + vm.attesa.chi : "", r.capoVia && r.altri, cb.sonoHost && puoChiudere(vm), !!cb.sonoHost].join("|")
      : [vm.fase, vm.passo, vm.turno, r.team, r.capo, vm.girate > 0, vm.fuori.join(""), !!vm.sospeso, r.capoVia && r.altri,
      vm.attesa ? vm.attesa.k + "/" + vm.attesa.chi : "", r.prossimo, cb.sonoHost && puoChiudere(vm), !!cb.sonoHost, !!vm.rivedi, !!vm.cosa].join("|");   // (sonoHost: l'amico che prende il posto dell'host ha i tasti giusti)
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
      if (vm.fuori.indexOf(k) >= 0) continue;
      if (vm.players.filter(function (p) { return p.team === k && !p.via; }).length < 2) return true;
    }
    return false;
  }
  function disegnaSotto(ui, vm, cb, r) {
    var el = ui.el, box = ui.sotto;
    while (box.firstChild) box.removeChild(box.firstChild);
    function stato(tx) { var d = el("div", { class: "or-stato", text: tx }); box.appendChild(d); return d; }
    // la fila delle faccine (online), dove si aspetta: il turno degli altri, la squadra fuori, la fine
    function faccine() { var f = ui.t.faccine ? ui.t.faccine() : null; if (f) { f.classList.add("or-faccine"); box.appendChild(f); } }
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
      else if (r.team === vm.vince) st0 = stato("🎉 Avete vinto! Ora vedete di chi era ogni parola.");
      else if (r.team >= 0) st0 = stato("Peccato! La prossima è vostra. Vincono: " + vinti + ".");
      else st0 = stato("Vincono: " + vinti + ". Ora vedete di chi era ogni parola.");
      if (vm.cosa && vm.cosa.l && vm.cosa.l.length) st0.appendChild(el("button", { class: "or-mini", text: "🤔 Rivedi", onclick: function () {   // riapre «Cosa intendevi?»
        if (ui.riv) { ui.riv.aperta = true; cosaIntendevi(ui, ui.vm, ui.cb); }
      } }));
      faccine();
      var riga = el("div", { class: "or-riga" });
      box.appendChild(riga);
      // i tasti di fine comuni (all'host del momento, anche se è l'amico che ha preso il posto dell'host, e a chi ha giocato):
      // se li disegna il core nella riga, niente tasti nostri. In prova (da solo) restano i nostri
      var tf = ui.t.tastiFine && !(ui.t.impostazioni && ui.t.impostazioni.modo === "prova") && (cb.sonoHost || r.team >= 0)
        ? (cb.sonoHost ? { host: true, nuova: cb.onNuova, esci: function () { cb.onEsci(); } } : { host: false, esci: function () { cb.onEsci(); } }) : null;
      if (tf && ui.t.tastiFine(riga, tf)) { riga.classList.add("or-fine"); return; }   // (in colonna: sopra i tasti il core può mettere «👥 Avete giocato con»)
      if (cb.sonoHost) riga.appendChild(el("button", { class: "or-btn", text: "↻ Nuova partita", onclick: cb.onNuova }));
      riga.appendChild(el("button", { class: "or-btn chiaro", text: "🏠 Esci", onclick: function () { cb.onEsci(); } }));
      if (!cb.sonoHost && !r.prossimo) stato(r.team < 0 && (vm.guarda || []).indexOf(cb.myId) >= 0 ? "👀 Questa volta hai guardato." : "Se l'host fa un'altra partita, tornate da soli nella saletta.");
      return;
    }
    // i tasti "di servizio": fare il capo al posto di chi è uscito, e (solo l'host) chiudere la partita
    var servizio = el("div", { class: "or-riga" });
    if (r.capoVia && r.altri) servizio.appendChild(el("button", { class: "or-btn", text: "👑 Faccio io il capo", onclick: function () { cb.manda({ t: "capo" }); } }));
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
      var d = stato("⏳ " + (vm.attesa.k === r.team ? "" : "I " + SQ[vm.attesa.k].nome + ": ") + "aspettiamo " + vm.attesa.chi + "… ");
      d.appendChild(conto(ui, "attesa", vm.attesa.ms));
      if (r.capoVia && r.altri) stato("Il vostro capo è uscito: uno di voi può prendere il suo posto.");
      return fineServizio();
    }
    if (r.capoVia && r.altri) { stato("Il vostro capo è uscito: uno di voi può prendere il suo posto."); return fineServizio(); }
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
    var note = { indizio: [[660, 0], [990, 0.07]], oro: [[784, 0], [988, 0.09], [1175, 0.18], [1568, 0.27]], giusta: [[784, 0], [1046, 0.1]], neutra: [[392, 0]], sbagliata: [[311, 0], [233, 0.14]], nera: [[160, 0], [110, 0.18], [70, 0.36]] }[tipo] || [];
    note.forEach(function (x) {
      try {
        var t0 = ctx.currentTime + x[1], o = ctx.createOscillator(), g = ctx.createGain();
        o.type = tipo === "nera" ? "sawtooth" : "triangle"; o.frequency.setValueAtTime(x[0], t0);
        g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.09, t0 + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
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
      "@media(max-height:700px){.or-riv{gap:5px;padding:8px 8px 9px}.or-riv-fr{width:36px;height:36px}.or-riv-ind{padding:5px}.or-riv-ind b{font-size:1.25rem}.or-riv-c{padding:4px 9px;font-size:.8rem}}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Parola d'ordine", icona: "🕵️",
    descrizione: "Come Codenames: il capo dà un indizio di una parola, la squadra trova le sue parole sul tabellone. Occhio alla parola nera! A 2 o 3 squadre, ognuno dal suo telefono.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 2, etichettaGiocatori: "👥 4–12 giocatori",
    postiOnline: MAX,   // posti online (12)
    // "Prova da solo" la vede solo il proprietario (account IL PAPPONE): per vedere com'è il gioco anche senza amici
    modi: [ { modo: "prova", icona: "🧪", nome: "Prova da solo", sotto: "Solo per te: tu e un Bot contro due Bot", soloPer: "IL PAPPONE" } ], soloOnline: true,
    hostDiRiserva: true,   // se l'host sparisce, un amico porta avanti la partita (il core non la riavvia)
    regole: [
      "Si gioca a <b>2 o 3 squadre</b>. Sul tabellone ci sono 25 parole (o 20, se l'host sceglie così): alcune sono di una squadra, alcune di nessuno e una è la <b>parola nera</b>.",
      "Solo il <b>capo</b> di ogni squadra (👑) vede di chi è ogni parola. Nel suo turno dà un <b>indizio di una parola sola</b> e un numero: quante parole sue c'entrano (es. «Caldo, 2»).",
      "La squadra ne discute e le gira una alla volta: si possono girare fino al numero dell'indizio <b>più una</b>. Se giri una parola di un'altra squadra o di nessuno, il turno passa.",
      "Chi gira la <b>parola nera</b> perde (a 3 squadre esce dalla partita). Vince la squadra che trova per prima tutte le sue parole.",
      "L'indizio non può essere una parola del tabellone (né quasi uguale: niente plurali o parole che ci cominciano). Il capo può dare anche «∞»: tentativi liberi.",
      "⏳ Se l'host accende la <b>clessidra</b>, il capo ha 90 secondi (o 2 minuti) per l'indizio: poi il turno passa. Se il capo esce, un compagno può prendere il suo posto (👑 Faccio io il capo).",
      "⭐ <b>Parola d'oro</b> (se l'host la lascia accesa): tra le parole di nessuno una è d'oro, e non lo sa nessuno, nemmeno i capi. Chi la gira non perde il turno: la squadra continua a indovinare con lo stesso indizio, senza consumare un tentativo.",
      "🤔 <b>Cosa intendevi?</b> (se l'host lo lascia acceso): dopo l'indizio il capo può toccare, di nascosto, le parole che intendeva (o «Salta»). Non le vede nessuno, nemmeno l'altro capo. A fine partita si rivedono gli indizi uno per uno («Paky pensava: ONDA, SALE · la squadra ha toccato: ONDA ✅, PESCE ❌») e la squadra che ha trovato più parole pensate vince il premio <b>🧠 Più in sintonia</b>."
    ],
    // la riga «📜 Si gioca così» che leggono gli amici nella Sala
    riassunto: function (imp) {
      imp = imp || {};
      var x = [+imp.squadre === 3 ? "3 squadre" : "2 squadre", (+imp.parole === 20 ? "20" : "25") + " parole"];
      if (imp.mazzo && imp.mazzo !== "classico") x.push("mazzo " + nomeMazzo(imp.mazzo));
      var tp = tempoDa(imp.tempo); if (tp) x.push("⏳ " + (tp === 120 ? "2 minuti" : tp + " secondi") + " per l'indizio");
      if (imp.oro !== false) x.push("⭐ parola d'oro");
      if (imp.intendi !== false) x.push("🤔 Cosa intendevi?");
      var n = imp.usaMie === false ? 0 : leggiGruppo(imp.gruppo).length;
      if (n) x.push("📝 " + n + (n === 1 ? " parola vostra" : " parole vostre"));
      return x.join(" · ");
    },
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      stile();
      var prova = aiuti.modo === "prova";
      dove.squadre = 2; dove.parole = 25; dove.oro = true; dove.usaMie = true; dove.capoIo = true; dove.mazzo = "classico"; dove.tempo = 0; dove.intendi = true;
      // le scelte con bottoni .modo-chip: così l'host le ritrova in "⚙️ Regole" nella saletta
      function chips(titolo, valori, chiave, nota) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + Math.min(3, valori.length) + ",1fr)" });
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
      else chips("Quante squadre", [[2, "2 squadre"], [3, "3 squadre (da 6)"]], "squadre");
      chips("Quante parole sul tabellone", [[25, "25 (classico)"], [20, "20 (più grandi)"]], "parole", "Con 20 le caselle sono più grandi e la partita dura un po' meno.");
      chips("🃏 Il mazzo delle parole", MAZZI, "mazzo", "Con un mazzo a tema le parole sono tutte su quell'argomento (se non bastano, si aggiungono quelle classiche).");
      chips("⏳ Tempo per l'indizio", [[0, "Senza"], [90, "90 secondi"], [120, "2 minuti"]], "tempo", "Se il capo non dà l'indizio in tempo, il turno passa all'altra squadra.");
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
        conta.textContent = lista.length ? (lista.length === 1 ? "1 parola" : lista.length + " parole") + " · ne finiscono fino a " + MAX_GRUPPO + " in ogni tabellone" : "Ancora nessuna parola.";
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
      chips("Le tue parole nel tabellone", [[true, "Sì"], [false, "No"]], "usaMie");
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      return host(t);
    }
  });
  window.__ORDINE = { erroreIndizio: erroreIndizio, leggiGruppo: leggiGruppo, radice: radice };
})();

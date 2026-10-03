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
  var DIVISIONE = { 2: { sq: [9, 8], neutre: 7 }, 3: { sq: [7, 6, 6], neutre: 5 } };
  var MAX_GRUPPO = 5;   // parole del gruppo che finiscono in un tabellone
  var RISERVA = ("RETE PIANTA CARTA LINGUA SPINA BANCO CAMPO CHIAVE PESCA POSTA TAVOLA BOTTONE STELLA PONTE CORONA " +
    "SOLE LUNA MARE NAVE TRENO AEREO RUOTA PALLA CANE GATTO LEONE TOPO RAGNO PIPISTRELLO ORSO BALENA " +
    "PIZZA PANE LATTE MELA LIMONE TORTA GELATO CAFFÈ VINO SALE ROMA NAPOLI VENEZIA EGITTO MARTE " +
    "MEDICO CUOCO PIRATA FANTASMA DRAGO ROBOT CAVALIERE RE REGINA PRINCIPE CASTELLO TORRE PIRAMIDE " +
    "SCUOLA OSPEDALE BANCA CINEMA TEATRO STADIO PORTA FINESTRA LETTO SPECCHIO OROLOGIO TELEFONO " +
    "COMPUTER LIBRO PENNA MATITA COLLA FORBICI ANELLO SCARPA CAPPELLO GUANTO OMBRELLO NEVE FUOCO " +
    "VENTO TUONO ISOLA MONTAGNA FIUME DESERTO BOSCO RADICE FOGLIA FIORE ROSA ERBA SEME OSSO CUORE " +
    "MANO OCCHIO DENTE NASO TESTA PIEDE BRACCIO SPADA ARCO FRECCIA SCUDO BOMBA MINA RAZZO MOTORE").split(" ");

  function fmtN(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }   // 1.000
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function mescola(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  var ACC = { "À": "A", "Á": "A", "È": "E", "É": "E", "Ì": "I", "Í": "I", "Ò": "O", "Ó": "O", "Ù": "U", "Ú": "U" };
  function norm(w) { return String(w || "").toUpperCase().split("").map(function (c) { return ACC[c] || c; }).join("").replace(/[^A-Z]/g, ""); }
  function radice(w) { var n = norm(w); return n.length > 4 ? n.replace(/[AEIOU]+$/, "") : n; }   // GATTO e GATTI hanno la stessa radice
  function elenco() { var f = window.SG_ORDINE_PAROLE; return f && f.length >= 60 ? f : RISERVA; }
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
    if (!/^[A-Za-zÀ-ÿ]+$/.test(p)) return "Solo lettere, niente numeri o simboli.";
    if (p.length < 2) return "Troppo corto.";
    var n = norm(p), r = radice(p), err = "";
    (tab || []).forEach(function (c) {
      if (err || c.g) return;
      var m = norm(c.w);
      if (m === n || radice(c.w) === r) err = "«" + c.w + "» è sul tabellone: non vale!";
      else if (m.length >= 4 && n.length >= 4 && (m.indexOf(n) >= 0 || n.indexOf(m) >= 0)) err = "Assomiglia troppo a «" + c.w + "», che è sul tabellone.";
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
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
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
      h.msg = "👑 " + (io ? io.nome : "Un amico") + " tiene la partita: l'host è uscito. Se torna, rientra nella sua squadra.";
      return h;
    })(ripresa) : { fase: "lobby", codice: "…", pronta: false, nsq: +imp.squadre === 3 ? 3 : 2, gruppo: imp.usaMie === false ? [] : leggiGruppo(imp.gruppo), oro: imp.oro !== false,
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), team: 0 }], capo: [null, null, null],
      tab: null, bid: 0, turno: 0, passo: "indizio", indizio: null, tentativi: 0, girate: 0, prop: {}, storia: [], fuori: [],
      vince: -1, classifica: null, msg: "", ultima: null, nGirate: 0, gen: 1, hostId: IO, vici: [] };
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
    function vive() { var v = []; for (var k = 0; k < H.nsq; k++) if (H.fuori.indexOf(k) < 0) v.push(k); return v; }
    function omini() { var o = {}; H.players.forEach(function (p) { o[p.id] = p.omino || null; }); return o; }

    // "⚙️ Regole" nella saletta: squadre e parole del gruppo
    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      H.nsq = +im.squadre === 3 ? 3 : 2; H.gruppo = im.usaMie === false ? [] : leggiGruppo(im.gruppo); H.oro = im.oro !== false;
      H.players.forEach(function (p) { if (p.team >= H.nsq) p.team = -1; });
      H.players.forEach(function (p) { if (p.team < 0) p.team = piuPiccola(); });
      sistemaCapi(); bd();
    };

    var ripresaFatta = !ripresa, ceduto = false;
    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; if (SGNet.ricordaId) SGNet.ricordaId(c, IO); bd(); },   // se rientro come ospite, torno la stessa persona
      onConnesso: function () {
        H.pronta = true;
        if (!ripresaFatta) {   // il vice ha appena preso il posto: le chiavi ai capi e l'appello (chi non risponde è uscito anche lui)
          ripresaFatta = true; mandaChiavi();
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
        var p = pById(id); if (!p) return;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); sistemaCapi(); bd(); return; }
        p.via = true; delete H.prop[id];   // a partita iniziata resta nella sua squadra: se torna, rientra
        if (H.fase === "gioco") controllaTurno();
        bd();
      },
      onMsg: function (id, m) { azione(id, m); }
    }, { codice: ripresa ? ripresa.codice : null, ascoltaStato: true, keepalive: 10 });
    // un altro telefono ha preso il posto di host (io ero sparito): esco in silenzio e rientro come giocatore normale
    function cediPosto() {
      if (ceduto) return; ceduto = true; clearTimeout(tAttesa);
      try { rete.lascia(); } catch (e) {}
      if (SGNet.ricordaId) SGNet.ricordaId(H.codice, IO);
      ospite(t, H.codice);
    }
    // i vice: i primi due giocatori collegati dopo di me (se uno esce, lo sostituisce il prossimo). Gli mando di nascosto tutta la partita
    // (senza gli avatar, li hanno già). Due, così se escono l'host e il primo vice quasi insieme c'è ancora chi prende il posto.
    function scegliVice() {
      var tenuti = (H.vici || []).filter(function (id) { var p = pById(id); return p && !p.via && id !== IO; });
      H.players.forEach(function (p) { if (tenuti.length < 2 && !p.via && p.id !== IO && tenuti.indexOf(p.id) < 0) tenuti.push(p.id); });
      H.vici = tenuti;
    }
    function mandaRiserva() {
      if (!H.vici.length || (H.fase !== "gioco" && H.fase !== "fine")) return;
      var copia = JSON.parse(JSON.stringify(H));
      copia.players.forEach(function (p) { p.omino = null; });
      H.vici.forEach(function (id) { rete.inviaVeloce({ t: "riserva", to: id, gen: H.gen, stato: copia }); });
    }
    // la "foto" per tutti: SEMPRE con gli id; la chiave del tabellone MAI (va solo ai capi)
    function vm() {
      var fine = H.fase === "fine", r = [];
      for (var k = 0; k < H.nsq; k++) r.push(resto(k));
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, nsq: H.nsq, gruppoN: H.gruppo.length,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, team: p.team, via: !!p.via, omino: H.fase === "lobby" ? (p.omino || null) : undefined }; }),
        capo: H.capo.slice(0, H.nsq),
        tab: H.tab ? H.tab.map(function (c) { return { w: c.w, g: c.g, c: (c.g || fine) ? c.c : null, oro: (c.g || fine) && c.oro ? 1 : 0 }; }) : null, oro: H.oro,
        bid: H.bid, turno: H.turno, passo: H.passo, indizio: H.indizio, tentativi: H.tentativi, girate: H.girate, prop: H.prop,
        storia: H.storia.slice(-8), fuori: H.fuori.slice(), vince: H.vince, classifica: H.classifica, msg: H.msg, ultima: H.ultima, resto: r,
        gen: H.gen, hostId: H.hostId, vici: H.vici.slice() };
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
      privato(id, { t: "chiave", bid: H.bid, col: chiave() });
    }
    function mandaChiavi() { for (var k = 0; k < H.nsq; k++) mandaChiave(H.capo[k]); }
    function bd() { if (ceduto) return; scegliVice(); var v = vm(); rete.invia({ t: "vm", vm: v }); disegna(t, v, cbHost); mandaRiserva(); }

    // ----- le mosse (dell'host e degli ospiti passano tutte da qui) -----
    function azione(id, m) {
      if (!m || !m.t) return;
      var p = pById(id);
      if (m.t === "join") {
        if (p) p.via = false;   // rientra: è di nuovo nella sua squadra
        else if (H.players.length < MAX && H.fase !== "fine") {
          p = { id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino), team: piuPiccola() };
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
        if (p.via) { p.via = false; if (H.fase === "gioco") controllaTurno(); bd(); if (H.capo.indexOf(id) >= 0) mandaChiave(id); }
        return;
      }
      if (H.fase === "lobby") {
        if (m.t === "squadra" && +m.s >= 0 && +m.s < H.nsq) { p.team = +m.s; sistemaCapi(); bd(); }
        else if (m.t === "capo") { H.capo[p.team] = id; bd(); }
        else if (m.t === "mischia" && id === IO) mischia();
        return;
      }
      if (H.fase !== "gioco" || p.via) return;
      var miaSquadra = p.team === H.turno, sonoCapo = H.capo[p.team] === id;
      if (m.t === "capo") {   // a partita iniziata: solo se il capo della squadra non c'è più
        if (capoVivo(p.team)) return;
        H.capo[p.team] = id; mandaChiave(id); H.msg = p.nome + " fa il capo dei " + SQ[p.team].nome + "."; controllaTurno(); bd(); return;
      }
      if (m.t === "indizio") {
        if (!miaSquadra || !sonoCapo || H.passo !== "indizio") return;
        var n = Math.floor(+m.n); if (!(n >= 0 && n <= 9)) return;
        var err = erroreIndizio(m.parola, H.tab);
        if (err) { privato(id, { t: "avviso", testo: err }); return; }
        var parola = String(m.parola).trim().toUpperCase();
        H.indizio = { parola: parola, n: n, k: H.turno };
        H.tentativi = n === 0 ? 99 : n + 1; H.girate = 0; H.passo = "indovina"; H.prop = {}; H.msg = "";
        H.storia.push({ k: H.turno, parola: parola, n: n });
        bd(); return;
      }
      if (!miaSquadra || sonoCapo || H.passo !== "indovina") return;
      if (m.t === "proponi") {
        var i = Math.floor(+m.i);
        if (i === -1) delete H.prop[id];
        else if (H.tab[i] && !H.tab[i].g) H.prop[id] = i;
        bd(); return;
      }
      if (m.t === "gira") { gira(Math.floor(+m.i), id); return; }
      if (m.t === "passo" && H.girate >= 1) { H.msg = p.nome + " passa la mano."; fineTurno(); }
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
      // 25 parole: qualcuna del gruppo (se ci sono) e le altre dall'elenco, senza doppioni
      var usate = {}, parole = [];
      mescola(H.gruppo).slice(0, MAX_GRUPPO).forEach(function (w) { usate[norm(w)] = 1; parole.push(w); });
      mescola(elenco()).forEach(function (w) { if (parole.length < 25 && !usate[norm(w)]) { usate[norm(w)] = 1; parole.push(String(w).toUpperCase()); } });
      parole = mescola(parole);
      var d = DIVISIONE[H.nsq], primo = Math.floor(Math.random() * H.nsq), colori = [];
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
      H.msg = "Cominciano i " + SQ[primo].nome + "!";
      H.fase = "gioco"; chiaveHost = null;
      mandaChiavi(); controllaTurno(); bd();
    }
    function gira(i, id) {
      var c = H.tab[i]; if (!c || c.g) return;
      var k = H.turno, p = pById(id);
      c.g = true; H.girate++; H.prop = {};
      H.ultima = { i: i, k: k, c: c.c, oro: c.oro ? 1 : 0, n: ++H.nGirate };
      var chi = p ? p.nome : SQ[k].nome;
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
      if (c.oro) { H.msg = "⭐ " + c.w + ": la parola d'oro! I " + SQ[k].nome + " giocano un altro turno."; return fineTurno(true); }
      H.msg = c.c === "n" ? "😐 " + c.w + ": di nessuno. Tocca agli altri." : "😬 " + c.w + ": era dei " + SQ[c.c].nome + "!";
      fineTurno();
    }
    function fineTurno(ancora) {   // ancora = la stessa squadra gioca un altro turno (parola d'oro)
      H.indizio = null; H.prop = {}; H.passo = "indizio"; H.girate = 0; H.tentativi = 0;
      if (!ancora) for (var s = 1; s <= H.nsq; s++) { var k2 = (H.turno + s) % H.nsq; if (H.fuori.indexOf(k2) < 0) { H.turno = k2; break; } }
      controllaTurno(); bd();
    }
    // Chi serve alla squadra di turno per andare avanti ADESSO ("" = c'è tutto):
    // per l'indizio serve il capo (se è uscito, un altro dei presenti può prendere il suo posto) e almeno uno che poi indovini;
    // per indovinare basta uno che indovina (il capo non serve più: l'indizio l'ha già dato).
    function manca(k) {
      var m = membri(k), altri = m.filter(function (p) { return p.id !== H.capo[k]; }).length;
      if (H.passo === "indovina") return altri >= 1 ? "" : "indovino";
      if (capoVivo(k)) return altri >= 1 ? "" : "indovino";
      return m.length >= 2 ? "" : "capo";
    }
    // Se manca qualcuno NON si salta subito il turno: si aspetta che torni (fino a 2 minuti, es. è andato su WhatsApp).
    // Solo dopo si passa alla squadra dopo. La scadenza sta nella partita, così vale anche se intanto cambia l'host.
    var ATTESA_SQUADRA = 120000, tAttesa = null;
    function controllaTurno() {
      clearTimeout(tAttesa); tAttesa = null;
      if (H.fase !== "gioco") { H.attesa = null; return; }
      var k = H.turno;
      if (!manca(k)) {
        if (H.attesa) { H.attesa = null; H.msg = "👋 Si riprende!"; }
        return;
      }
      if (!H.attesa || H.attesa.k !== k || H.attesa.passo !== H.passo) H.attesa = { k: k, passo: H.passo, fino: Date.now() + ATTESA_SQUADRA };
      function riprova(ms) { tAttesa = setTimeout(function () { if (!ceduto) { controllaTurno(); bd(); } }, ms); }
      if (Date.now() < H.attesa.fino) {
        var assenti = H.players.filter(function (p) { return p.team === k && p.via; }).map(function (p) { return p.nome; });
        H.msg = "⏳ I " + SQ[k].nome + " aspettano che torni " + (assenti.length === 1 ? assenti[0] : "qualcuno della squadra") + "…";
        riprova(H.attesa.fino - Date.now() + 50);
        return;
      }
      // passati i 2 minuti: tocca alla prossima squadra che può giocare
      for (var s = 1; s < H.nsq; s++) {
        var k2 = (k + s) % H.nsq;
        if (H.fuori.indexOf(k2) >= 0 || membri(k2).length < 2) continue;
        H.msg = "I " + SQ[k].nome + " non sono tornati: si salta il loro turno.";
        H.indizio = null; H.passo = "indizio"; H.prop = {}; H.girate = 0; H.tentativi = 0;
        H.turno = k2; H.attesa = null;
        return controllaTurno();
      }
      // nessuna squadra può giocare: si aspetta ancora che qualcuno rientri
      H.msg = "⏳ Si aspetta che torni qualcuno…";
      H.attesa.fino = Date.now() + 30000; riprova(30050);
    }
    function fine(k) {
      H.fase = "fine"; H.vince = k; H.prop = {}; H.indizio = null;
      H.classifica = H.players.map(function (p) { return { id: p.id, nome: p.nome, team: p.team, pos: p.team === k ? 1 : 2 }; })
        .sort(function (a, b) { return a.pos - b.pos; });
      H.msg = "🎉 Vincono i " + SQ[k].nome + "!";
      bd();
      // torneo online: i NOMI dei giocatori; a squadre chi vince al posto 1, gli altri dopo
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, stesse squadre; il capo passa al prossimo della squadra
    function nuova() {
      H.fase = "lobby"; H.classifica = null; H.tab = null; H.players = presenti(); H.msg = ""; chiaveHost = null;
      for (var k = 0; k < H.nsq; k++) {
        var m = membri(k), i = -1;
        m.forEach(function (p, j) { if (p.id === H.capo[k]) i = j; });
        H.capo[k] = m.length ? m[(i + 1) % m.length].id : null;
      }
      sistemaCapi(); bd();
    }

    var cbHost = { sonoHost: true, myId: IO, onComincia: comincia, onNuova: nuova,
      pronti: pronti,
      omini: omini,
      chiave: function () { return chiaveHost && chiaveHost.bid === H.bid && H.fase === "gioco" && H.capo.indexOf(IO) >= 0 ? chiaveHost.col : null; },
      manda: function (m) { azione(IO, m); },
      onEsci: function () {
        if (H.fase === "gioco" && !window.confirm("Chiudere la partita per tutti?")) return;   // un tocco sbagliato non chiude il gioco a tutti
        rete.chiudi(); t.esci();
      } };
    bd();
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
      onEsci: function () {
        if (S.vm && S.vm.fase === "gioco" && !window.confirm("Uscire dalla partita?")) return;
        if (S.rete) S.rete.chiudi(); t.esci();
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
            S.vm = m.vm; disegna(t, m.vm, cb); controllaChiave();
          }
          else if (m.t === "chiave") { S.chiave = { bid: m.bid, col: m.col }; if (S.vm) disegna(t, S.vm, cb); }
          else if (m.t === "omini") { S.omini = m.omini || {}; if (S.vm) disegna(t, S.vm, cb); }
          else if (m.t === "riserva") { if (m.gen >= S.gen) S.copia = m.stato; }   // sono il vice: tengo la copia della partita
          else if (m.t === "appello") { if (S.rete) S.rete.invia({ t: "presente" }); }   // il nuovo host chiede chi c'è
          else if (m.t === "avviso") avviso(m.testo);
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
    if (!UI || UI.bid !== vm.bid || !UI.s.isConnected) UI = creaSchermo(t, vm, cb);
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
    if (vm.oro) info.push("⭐ Parola d'oro accesa");
    if (vm.gruppoN) info.push("📝 " + vm.gruppoN + (vm.gruppoN === 1 ? " parola vostra" : " parole vostre") + " nel mazzo");
    if (info.length) nota += " " + info.join(" · ") + ".";
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: vm.nsq === 3 ? 6 : MIN,
      vuoti: Math.max(0, (vm.nsq === 3 ? 6 : MIN) - vm.players.length),   // solo i posti che mancano per cominciare
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.hostId ? p.id === vm.hostId : i === 0, tu: p.id === cb.myId }; }),
      extra: [ box ], puoComincia: ok, nota: ok ? "Ognuno sceglie la sua squadra; il capo ha la 👑." + (info.length ? " " + info.join(" · ") + "." : "") : nota, testoComincia: "Comincia ▶",
      attesa: "Scegli la tua squadra e aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function creaSchermo(t, vm, cb) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("or-piena");   // schermo intero: niente titolo, niente scorrimento
    var ui = { t: t, el: el, s: s, bid: vm.bid, cb: cb, carte: [], kSotto: "", kProp: [], chip: [], ultimaN: vm.ultima ? vm.ultima.n : 0, avCache: {} };
    ui.chips = el("div", { class: "or-chips" });
    for (var k = 0; k < vm.nsq; k++) { var c = el("div", { class: "or-chip", style: "--c:" + SQ[k].col }); ui.chip.push(c); ui.chips.appendChild(c); }
    var esci = el("button", { class: "or-esci", "aria-label": "Esci", text: "‹", onclick: function () { ui.cb.onEsci(); } });
    ui.ind = el("div", { class: "or-ind" });
    ui.storia = el("div", { class: "or-storia" });
    ui.tab = el("div", { class: "or-tab" });
    vm.tab.forEach(function (c, i) {
      var w = el("span", { class: "or-w", text: c.w }), pr = el("span", { class: "or-pr" }), hint = el("span", { class: "or-hint", text: "tocca ancora" });
      var b = el("button", { class: "or-carta" }, [ w, pr, hint ]);
      var L = c.w.length; w.style.fontSize = L <= 6 ? "clamp(10px,3.2vw,15px)" : L <= 8 ? "clamp(9px,2.75vw,13.5px)" : "clamp(8px,2.35vw,12px)";
      b.addEventListener("click", function () { tocca(ui, i); });
      ui.carte.push({ b: b, pr: pr, cls: "" }); ui.tab.appendChild(b);
    });
    ui.msg = el("div", { class: "or-msg" });
    ui.sotto = el("div", { class: "or-sotto" });
    s._contenuto.appendChild(el("div", { class: "or-scena" }, [ el("div", { class: "or-barra" }, [ esci, ui.chips ]), ui.ind, ui.storia, ui.tab, ui.msg, ui.sotto ]));
    t.mostra(s);
    return ui;
  }
  // chi sono io in questa partita
  function ruolo(vm, cb) {
    var io = trova(vm, cb.myId), team = io ? io.team : -1;
    var capo = team >= 0 && vm.capo[team] === cb.myId;
    var capoVia = team >= 0 && (function () { var c = trova(vm, vm.capo[team]); return !c || c.via; })();
    return { io: io, team: team, capo: capo, capoVia: capoVia, mioTurno: vm.fase === "gioco" && team === vm.turno,
      indovino: vm.fase === "gioco" && team === vm.turno && !capo && vm.passo === "indovina" };
  }
  function tocca(ui, i) {
    var vm = ui.vm, r = ruolo(vm, ui.cb), c = vm.tab[i];
    if (!r.indovino || !c || c.g) return;
    if (vm.prop[ui.cb.myId] === i) ui.cb.manda({ t: "gira", i: i });   // secondo tocco sulla stessa parola: si gira
    else ui.cb.manda({ t: "proponi", i: i });
  }
  function testaAvatar(ui, id, nome, team) {
    var cfg = (ui.cb.omini && ui.cb.omini() || {})[id];
    var k = id + "|" + (cfg ? 1 : 0);
    if (!ui.avCache[k]) ui.avCache[k] = cfg && window.SGOmino ? SGOmino.svg(cfg, { busto: true }) : "<b>" + String(nome || "?").charAt(0).toUpperCase() + "</b>";
    return "<span class='or-av' style='--c:" + (SQ[team] ? SQ[team].col : "#888") + "'>" + ui.avCache[k] + "</span>";
  }
  function aggiorna(ui, vm, cb) {
    var r = ruolo(vm, cb), key = vm.fase === "gioco" && r.capo ? cb.chiave() : null, fine = vm.fase === "fine";
    // ---- in alto: quante parole mancano a ogni squadra, di chi è il turno ----
    ui.chip.forEach(function (c, k) {
      var tx = SQ[k].em + " " + SQ[k].nome + " " + (vm.resto[k] != null ? vm.resto[k] : "");
      if (c.textContent !== tx) c.textContent = tx;
      c.classList.toggle("turno", !fine && vm.turno === k);
      c.classList.toggle("fuori", vm.fuori.indexOf(k) >= 0);
      c.classList.toggle("mia", r.team === k);
    });
    // ---- l'indizio ----
    var ind;
    if (fine) ind = vm.vince >= 0 ? "🎉 Vincono i " + SQ[vm.vince].nome + "!" : "Partita finita";
    else if (vm.passo === "indizio") ind = r.mioTurno && r.capo ? "👑 Tocca a te: dai l'indizio" : "👑 Il capo dei " + SQ[vm.turno].nome + " pensa all'indizio…";
    else ind = SQ[vm.turno].em + " «" + vm.indizio.parola + "» " + (vm.indizio.n === 0 ? "∞" : vm.indizio.n);
    if (ui.ind.textContent !== ind) ui.ind.textContent = ind;
    ui.ind.style.setProperty("--c", fine ? (SQ[vm.vince] || SQ[0]).col : SQ[vm.turno].col);
    var st = vm.passo === "indovina" && !fine ? (vm.tentativi >= 99 ? "tentativi liberi" : "ancora " + vm.tentativi + (vm.tentativi === 1 ? " tentativo" : " tentativi")) : "";
    var prima = vm.storia.filter(function (x) { return !vm.indizio || x !== vm.storia[vm.storia.length - 1]; }).slice(-4).reverse()
      .map(function (x) { return SQ[x.k].em + " " + x.parola + " " + (x.n === 0 ? "∞" : x.n); }).join("  ·  ");
    var stx = [st, prima].filter(Boolean).join("   |   ");
    if (ui.storia.textContent !== stx) ui.storia.textContent = stx;
    // ---- il tabellone (solo le carte che cambiano) ----
    var chi = {};   // parola -> chi la propone
    Object.keys(vm.prop || {}).forEach(function (id) { var i = vm.prop[id]; (chi[i] = chi[i] || []).push(id); });
    vm.tab.forEach(function (c, i) {
      var C = ui.carte[i], col = c.c != null ? c.c : (key ? key[i] : null);
      var cls = "or-carta" + (c.g ? " g" : "") + (col != null ? " c" + col : "") + (!c.g && key ? " chiave" : "") + (fine && !c.g ? " svelata" : "") + (c.oro ? " oro" : "") +
        (r.indovino && !c.g ? " attiva" : "") + (vm.prop[cb.myId] === i && r.indovino ? " mia" : "");
      if (C.cls !== cls) { C.b.className = cls; C.cls = cls; }
      var kp = (chi[i] || []).join(",");
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
    }
    if (ui.msg.textContent !== (vm.msg || "")) ui.msg.textContent = vm.msg || "";
    // ---- in basso: cosa posso fare io (si ricostruisce solo se cambia il mio ruolo o la fase) ----
    var ks = [vm.fase, vm.passo, vm.turno, r.team, r.capo, r.capoVia, vm.girate > 0, vm.fuori.join(""), vm.players.filter(function (p) { return p.team === r.team && !p.via; }).length].join("|");
    if (ks !== ui.kSotto) { ui.kSotto = ks; disegnaSotto(ui, vm, cb, r); }
  }
  function disegnaSotto(ui, vm, cb, r) {
    var el = ui.el, box = ui.sotto;
    while (box.firstChild) box.removeChild(box.firstChild);
    function stato(tx) { box.appendChild(el("div", { class: "or-stato", text: tx })); }
    if (vm.fase === "fine") {
      var vinti = vm.players.filter(function (p) { return p.team === vm.vince; }).map(function (p) { return p.nome; }).join(", ");
      stato((r.team === vm.vince ? "Avete vinto! " : "") + "Vincono: " + vinti + ". Sul tabellone ora vedete di chi era ogni parola.");
      var riga = el("div", { class: "or-riga" });
      if (cb.sonoHost) riga.appendChild(el("button", { class: "or-btn ok", text: "↻ Nuova partita", onclick: cb.onNuova }));
      riga.appendChild(el("button", { class: "or-btn", text: "🏠 Esci", onclick: function () { cb.onEsci(); } }));
      box.appendChild(riga);
      if (!cb.sonoHost) stato("Se l'host fa un'altra partita, tornate da soli nella saletta.");
      return;
    }
    if (r.team >= 0 && vm.fuori.indexOf(r.team) >= 0) { stato("La vostra squadra è fuori: guardate come va a finire."); return; }
    // "faccio io il capo": solo quando serve davvero (tocca a noi dare l'indizio) e resta qualcun altro per indovinare
    var presentiSq = r.team >= 0 ? vm.players.filter(function (p) { return p.team === r.team && !p.via; }).length : 0;
    if (r.capoVia && !r.capo && r.team >= 0 && r.mioTurno && vm.passo === "indizio" && presentiSq >= 2) {
      box.appendChild(el("button", { class: "or-btn ok", text: "👑 Il vostro capo è uscito: faccio io il capo", onclick: function () { cb.manda({ t: "capo" }); } }));
    }
    if (!r.mioTurno) { stato("Tocca ai " + SQ[vm.turno].nome + "…" + (r.capo ? " Intanto pensa al prossimo indizio." : "")); return; }
    if (vm.passo === "indizio") {
      if (!r.capo) { stato("Il vostro capo sta pensando all'indizio…"); return; }
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
      box.appendChild(el("div", { class: "or-riga" }, [ input, el("button", { class: "or-btn ok corto", text: "Invia", onclick: manda }) ]));
      box.appendChild(numeri); box.appendChild(errore);
      return;
    }
    if (r.capo) { stato("La tua squadra sta cercando… Tu non puoi aiutarli!"); return; }
    stato("Tocca una parola per proporla, tocca di nuovo per girarla.");
    box.appendChild(el("div", { class: "or-riga" }, [
      el("button", { class: "or-btn", text: "✋ Basta così, passo", disabled: vm.girate > 0 ? null : "disabled", onclick: function () { cb.manda({ t: "passo" }); } }) ]));
  }
  function avviso(testo) {
    if (!UI || !testo) return;
    UI.msg.textContent = testo; UI.msg.classList.remove("su"); void UI.msg.offsetWidth; UI.msg.classList.add("su");
  }
  // suoni brevi (niente vibrazione qui: vibra solo il tasto che tocchi tu)
  function suona(tipo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    var note = { oro: [[784, 0], [988, 0.09], [1175, 0.18], [1568, 0.27]], giusta: [[784, 0], [1046, 0.1]], neutra: [[392, 0]], sbagliata: [[311, 0], [233, 0.14]], nera: [[160, 0], [110, 0.18], [70, 0.36]] }[tipo] || [];
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
      ".schermata.or-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:#15123a}",
      ".schermata.or-piena>.testa,.schermata.or-piena>.piede{display:none}",
      ".schermata.or-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".or-scena{height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:6px;padding:calc(6px + env(safe-area-inset-top)) 8px calc(8px + env(safe-area-inset-bottom));overflow:hidden;color:#fff;user-select:none;-webkit-user-select:none}",
      ".or-barra{display:flex;align-items:center;gap:8px;flex:none}",
      ".or-esci{width:34px;height:34px;flex:none;border-radius:50%;border:0;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:1.2rem;font-weight:900;cursor:pointer}",
      ".or-chips{flex:1;display:flex;gap:5px;min-width:0}",
      ".or-chip{flex:1;min-width:0;text-align:center;font-weight:900;font-size:.8rem;padding:6px 4px;border-radius:10px;background:rgba(255,255,255,.08);box-shadow:inset 0 -3px var(--c);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".or-chip.turno{background:var(--c)}.or-chip.mia:after{content:' (voi)';font-weight:700;font-size:.7rem}.or-chip.fuori{opacity:.35;text-decoration:line-through}",
      ".or-ind{flex:none;text-align:center;font-weight:900;font-size:1.05rem;padding:7px 8px;border-radius:12px;background:rgba(255,255,255,.08);box-shadow:inset 0 0 0 2px var(--c,#888);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".or-storia{flex:none;text-align:center;font-size:.72rem;font-weight:700;opacity:.75;min-height:1.1em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".or-tab{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:repeat(5,minmax(0,1fr));grid-template-rows:repeat(5,minmax(0,1fr));gap:4px}",
      ".or-carta{position:relative;min-width:0;min-height:0;border:0;border-radius:9px;padding:2px;background:#f1f3f5;color:#14113a;font:inherit;font-weight:900;display:flex;align-items:center;justify-content:center;cursor:default;-webkit-tap-highlight-color:transparent;touch-action:manipulation;overflow:hidden}",
      ".or-w{display:block;max-width:100%;line-height:1.05;letter-spacing:-.02em;overflow-wrap:anywhere;text-align:center}",
      ".or-carta.attiva{cursor:pointer}.or-carta.attiva:active{transform:scale(.96)}",
      ".or-carta.mia{box-shadow:inset 0 0 0 3px #fab005}",
      ".or-hint{display:none;position:absolute;left:0;right:0;bottom:2px;font-size:8px;font-weight:800;color:#e67700;text-transform:uppercase}.or-carta.mia .or-hint{display:block}",
      ".or-pr{position:absolute;top:2px;right:2px;display:flex;gap:1px}",
      ".or-av{width:17px;height:17px;border-radius:50%;overflow:hidden;background:var(--c);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;box-shadow:0 0 0 1.5px #fff}.or-av svg{width:100%;height:100%;display:block}",
      // la chiave del capo: colori pieni ma più chiari sulle parole ancora coperte
      ".or-carta.chiave.c0{background:#ffc9c9;box-shadow:inset 0 -5px #e03131}.or-carta.chiave.c1{background:#a5d8ff;box-shadow:inset 0 -5px #1c7ed6}.or-carta.chiave.c2{background:#b2f2bb;box-shadow:inset 0 -5px #2f9e44}",
      ".or-carta.chiave.cn{background:#efe3c8}.or-carta.chiave.cx{background:#212529;color:#fff}",
      // le parole girate
      ".or-carta.g{color:#fff}.or-carta.g .or-w{opacity:.85}",
      ".or-carta.g.c0{background:#e03131}.or-carta.g.c1{background:#1c7ed6}.or-carta.g.c2{background:#2f9e44}.or-carta.g.cn{background:#c9b48a;color:#3d2f12}.or-carta.g.cx{background:#000;box-shadow:inset 0 0 0 2px #fa5252}",
      // fine partita: si vede la chiave di tutte le parole che nessuno aveva girato
      ".or-carta.svelata{opacity:.8}.or-carta.svelata.c0{background:#ffc9c9}.or-carta.svelata.c1{background:#a5d8ff}.or-carta.svelata.c2{background:#b2f2bb}.or-carta.svelata.cn{background:#efe3c8}.or-carta.svelata.cx{background:#212529;color:#fff}",
      ".or-carta.appena{animation:orGira .45s ease-out}",
      "@keyframes orGira{0%{transform:scale(1.12)}100%{transform:none}}",
      ".or-msg{flex:none;text-align:center;font-weight:800;font-size:.82rem;min-height:1.2em;line-height:1.2}.or-msg.su{animation:orMsg 1.2s ease}",
      "@keyframes orMsg{0%{color:#ffd43b;transform:scale(1.06)}100%{color:#fff;transform:none}}",
      ".or-sotto{flex:none;display:flex;flex-direction:column;gap:6px}",
      ".or-stato{text-align:center;font-weight:800;font-size:.88rem;line-height:1.3;padding:2px 0}",
      ".or-riga{display:flex;gap:6px}",
      ".or-btn{flex:1;min-height:46px;border:0;border-radius:14px;font:inherit;font-weight:900;font-size:.92rem;color:#fff;background:#495057;cursor:pointer;touch-action:manipulation}.or-btn.ok{background:#2f9e44}.or-btn.corto{flex:0 0 auto;padding:0 18px}.or-btn:disabled{opacity:.35}",
      ".or-input{flex:1;min-width:0;height:46px;border:0;border-radius:14px;padding:0 14px;font:inherit;font-size:1.05rem;font-weight:800;text-transform:uppercase;color:#14113a;background:#fff}",
      ".or-numeri{display:grid;grid-template-columns:repeat(10,1fr);gap:4px}",
      ".or-num{height:38px;border:0;border-radius:10px;font:inherit;font-weight:900;font-size:1rem;color:#14113a;background:#dee2e6;cursor:pointer;touch-action:manipulation}.or-num.on{background:#fab005}",
      ".or-err{min-height:1.1em;text-align:center;font-size:.8rem;font-weight:800;color:#ffa8a8}",
      // saletta: le squadre
      ".or-squadre{display:flex;flex-direction:column;gap:8px;margin:6px 0}",
      ".or-sq{border-radius:14px;padding:8px 10px;background:rgba(255,255,255,.06);box-shadow:inset 4px 0 var(--c)}",
      ".or-sq-testa{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px}",
      ".or-sq-membri{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:4px}",
      ".or-membro{padding:4px 9px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800;font-size:.85rem}.or-membro.tu{box-shadow:inset 0 0 0 2px var(--c)}",
      ".or-vuota{font-size:.8rem;opacity:.7}",
      // la parola d'oro (girata, o svelata a fine partita)
      ".or-carta.g.oro{background:#fab005;color:#3d2a00;box-shadow:inset 0 0 0 2px #fff3bf}.or-carta.g.oro .or-w{opacity:1}.or-carta.g.oro:before{content:'⭐';position:absolute;top:1px;left:3px;font-size:10px}",
      ".or-carta.svelata.oro{background:#ffe066}",
      // le tue parole nelle impostazioni: una alla volta, ognuna con la sua ✕
      ".or-aggiungi{display:flex;gap:6px;align-items:center}.or-aggiungi .link-campo{flex:1;min-width:0;margin:0}",
      ".or-esito{min-height:1.2em;margin:4px 0 0}",
      ".or-conta{font-size:.8rem;font-weight:800;opacity:.8;margin:6px 0 4px}",
      ".or-lista{display:flex;flex-wrap:wrap;gap:6px}",
      ".or-parola{display:inline-flex;align-items:center;gap:4px;padding:4px 4px 4px 10px;border-radius:999px;background:rgba(255,255,255,.12);font-weight:800;font-size:.85rem}",
      ".or-x{width:24px;height:24px;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font:inherit;font-size:.75rem;font-weight:900;cursor:pointer;touch-action:manipulation}",
      ".or-lista-tasti{display:flex;gap:6px;margin-top:8px}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Parola d'ordine", icona: "🕵️",
    descrizione: "Come Codenames: il capo dà un indizio di una parola, la squadra trova le sue parole sul tabellone. Occhio alla parola nera! A 2 o 3 squadre, ognuno dal suo telefono.",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 2, etichettaGiocatori: "👥 4–12 giocatori",
    modi: [], soloOnline: true,
    regole: [
      "Si gioca a <b>2 o 3 squadre</b>. Sul tabellone ci sono 25 parole: alcune sono di una squadra, alcune di nessuno e una è la <b>parola nera</b>.",
      "Solo il <b>capo</b> di ogni squadra (👑) vede di chi è ogni parola. Nel suo turno dà un <b>indizio di una parola sola</b> e un numero: quante parole sue c'entrano (es. «Caldo, 2»).",
      "La squadra ne discute e le gira una alla volta: si possono girare fino al numero dell'indizio <b>più una</b>. Se giri una parola di un'altra squadra o di nessuno, il turno passa.",
      "Chi gira la <b>parola nera</b> perde (a 3 squadre esce dalla partita). Vince la squadra che trova per prima tutte le sue parole.",
      "L'indizio non può essere una parola del tabellone (né quasi uguale). Il capo può dare anche «∞»: tentativi liberi.",
      "⭐ <b>Parola d'oro</b> (se l'host la lascia accesa): tra le parole di nessuno una è d'oro, e non lo sa nessuno, nemmeno i capi. Chi la gira, invece di perdere il turno, gioca un altro turno."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      stile();
      dove.squadre = 2; dove.oro = true; dove.usaMie = true;
      // le scelte con bottoni .modo-chip: così l'host le ritrova in "⚙️ Regole" nella saletta
      function chips(titolo, valori, chiave, nota) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + valori.length + ",1fr)" });
        valori.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v[0] ? " attiva" : ""), style: "justify-content:center", onclick: function () {
            dove[chiave] = v[0]; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
          } }, [ el("div", { class: "mt", text: v[1] }) ]);
          g.appendChild(b);
        });
        box.appendChild(g);
        if (nota) box.appendChild(el("p", { class: "modulo-nota", text: nota }));
      }
      chips("Quante squadre", [[2, "2 squadre"], [3, "3 squadre (da 6)"]], "squadre");
      chips("⭐ Parola d'oro", [[true, "Sì"], [false, "No"]], "oro", "Una parola di nessuno è d'oro, e non lo sa nessuno: chi la gira gioca un altro turno.");
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
        if (!lista.length || !window.confirm("Cancellare tutte le tue " + lista.length + " parole?")) return;
        lista = []; salva(); disegnaLista();
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

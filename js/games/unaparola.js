/* =========================================================
   ☝️ UNA PAROLA SOLA — il nostro Just One (2019), fatto dal modello dei giochi online.
   A turno uno indovina. Gli altri vedono la parola misteriosa e scrivono DI NASCOSTO un indizio di una parola sola
   (in 3 due a testa). Gli indizi uguali (anche al plurale o al femminile) e quelli che contengono la parola si
   cancellano da soli; per i quasi uguali (pane/panino) chi ha scritto ha 15 secondi per toccarne due. Poi gli indizi
   si girano uno alla volta (i doppioni esplodono 💥) e chi indovina ha un tentativo solo, o passa.
   - 🏆 A punti (di partenza): giusta +3 a chi indovina, +1 a ogni indizio rimasto, ⭐ +2 all'indizio che ha aiutato di
     più (lo sceglie chi ha indovinato). Sbagliata o Passo: 0 a tutti. Niente punti negativi. 1, 2 o 3 giri.
   - 🤝 Tutti insieme (come l'originale): 13 parole, una squadra; sbagliata = si perde anche la parola dopo.
   Online la parola e gli indizi NON passano mai nella foto per tutti prima del momento giusto: vanno a chi scrive con
   messaggi privati ("seg" con "to"). Sullo stesso telefono ci si passa il telefono ("Luca, non guardare!").
   ========================================================= */
(function () {
  "use strict";

  var ID = "unaparola";
  var MIN = 3, MAX = 10;
  var RESPIRO = 5;               // i secondi di respiro quando la partita riprende (gli amici intanto rientrano)
  var RITARDATARI = "turno";     // chi arriva a partita cominciata entra dal turno dopo, con 0 punti
  var T_SCRIVI = 60, T_CONTROLLO = 15, T_INDOVINA = 45, T_STELLA = 10, T_ESITO = 14, T_RISPOSTA = 3.4;
  var CARTE_COOP = 13;
  var LUNGO = 20;                // lettere massime di un indizio
  var CHIAVE_REGOLE = "sg-unaparola-regole", CHIAVE_USATE = "sg-unaparola-usate";

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function leggi(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p || 25); } catch (e) {} }

  // ---- suoni (piccoli, col motore audio comune) ----
  function nota(f, dur, dopo, tipo, vol) {
    var c = SG.audioCtx && SG.audioCtx(); if (!c) return;
    try {
      var o = c.createOscillator(), g = c.createGain(), n = c.currentTime + (dopo || 0);
      o.type = tipo || "triangle"; o.frequency.setValueAtTime(f, n);
      g.gain.setValueAtTime(0.0001, n); g.gain.exponentialRampToValueAtTime(vol || 0.1, n + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, n + dur);
      o.connect(g); g.connect(c.destination); o.start(n); o.stop(n + dur + 0.02);
    } catch (e) {}
  }
  function tic(f) { nota(f || 700, 0.06, 0, "square", 0.04); }
  function puf() { nota(140, 0.18, 0, "sawtooth", 0.07); nota(90, 0.22, 0.05, "square", 0.05); }
  function rullo() { for (var k = 0; k < 12; k++) nota(180 + (k % 2) * 30, 0.05, k * 0.09, "square", 0.035 + k * 0.003); }
  function fanfara(bella) {
    var seq = bella ? [523, 659, 784, 1047] : [440, 392, 349, 262];
    seq.forEach(function (f, k) { nota(f, bella ? 0.22 : 0.3, k * (bella ? 0.12 : 0.2), "triangle", 0.12); });
  }

  // =========================================================
  //  LE REGOLE (senza grafica: si provano da sole, window.__unaparola)
  // =========================================================
  // minuscole, senza accenti né segni: «Caffè!» → "caffe"
  function norma(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  function compatta(s) { return norma(s).replace(/ /g, ""); }
  // la radice per i doppioni: via l'ultima vocale (gatto, gatti, gatta → gatt; orologio, orologi → orolog; banca, banche → banc)
  function radice(s) {
    var w = compatta(s);
    if (w.length >= 4) { w = w.replace(/[aeiou]$/, ""); if (w.length >= 4) w = w.replace(/i$/, ""); }
    return w.replace(/([cg])h$/, "$1");
  }
  // le forme al singolare di una parola (per il plurale: gatti → gatto, porte → porta, laghi → lago, arance → arancia)
  function forme(s) {
    var w = compatta(s), f = [w], b;
    function add(x) { if (x && f.indexOf(x) < 0) f.push(x); }
    if (w.length >= 3 && /i$/.test(w)) {
      b = w.slice(0, -1); add(b + "o"); add(b + "e"); add(b + "a"); add(b + "io");
      if (/[cg]hi$/.test(w)) add(w.slice(0, -2) + "o");
    }
    if (w.length >= 3 && /e$/.test(w)) {
      b = w.slice(0, -1); add(b + "a");
      if (/[cg]he$/.test(w)) add(w.slice(0, -2) + "a");
      if (/[cg]e$/.test(w)) add(b + "ia");
    }
    return f;
  }
  function stesseForme(a, b) { var fa = forme(a), fb = forme(b); return fa.some(function (x) { return !!x && fb.indexOf(x) >= 0; }); }
  // due indizi uguali per il gioco: stessa parola, anche al plurale, al femminile, con le maiuscole o l'accento
  function stessoIndizio(a, b) { var ra = radice(a); return !!ra && (ra === radice(b) || stesseForme(a, b)); }
  // un indizio è una parola sola? (niente spazi, apostrofi o frasi)
  function unaParola(s) { var x = String(s == null ? "" : s).trim(); return !!x && x.length <= LUNGO && !/[\s'’`"“”.,;:!?()]/.test(x) && compatta(x).length > 0; }
  function pulisci(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, LUNGO); }
  // l'indizio non vale: è la parola misteriosa (anche al plurale) o la contiene o ne è un pezzo (MARE → marea, GATTO → gattino)
  function nonVale(ind, parola) {
    var n = compatta(ind), p = compatta(parola);
    if (!n) return true;
    if (stessoIndizio(n, p)) return true;
    function dentro(corto, lungo) {
      if (corto.length < 3 || corto.length >= lungo.length) return false;
      return lungo.indexOf(corto) === 0 || lungo.slice(-corto.length) === corto || (corto.length >= 5 && lungo.indexOf(corto) >= 0);
    }
    if (dentro(p, n) || dentro(n, p)) return true;
    var rp = radice(p), rn = radice(n);
    if (rp.length >= 4 && n.indexOf(rp) === 0) return true;
    if (rn.length >= 4 && p.indexOf(rn) === 0) return true;
    return false;
  }
  function lev(a, b) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > 1) return 2;
    var prec = [], i, j;
    for (j = 0; j <= b.length; j++) prec.push(j);
    for (i = 1; i <= a.length; i++) {
      var cur = [i];
      for (j = 1; j <= b.length; j++) cur.push(Math.min(prec[j] + 1, cur[j - 1] + 1, prec[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)));
      prec = cur;
    }
    return prec[b.length];
  }
  // la risposta è giusta? stesse regole (maiuscole, accenti, plurale), l'articolo non conta,
  // e dalle 6 lettere in su va bene anche un errore di battitura
  function giusta(r, parola) {
    var a = compatta(norma(r).replace(/^(il|lo|la|i|gli|le|l|un|uno|una) /, "")), p = compatta(parola);
    if (!a || !p) return false;
    if (a === p || stesseForme(a, p)) return true;
    return p.length >= 6 && lev(a, p) <= 1;
  }
  // 🏆 i punti di un turno: giusta = +3 a chi indovina, +1 a ogni indizio rimasto, ⭐ +2 all'indizio scelto.
  // Sbagliata o Passo: 0 a tutti (niente punti negativi). o = { giusta, chi, indizi: [{ id, canc }], stella: posto o null }
  function puntiTurno(o) {
    var r = {};
    if (!o || !o.giusta) return r;
    function d(id, n) { r[id] = (r[id] || 0) + n; }
    d(o.chi, 3);
    (o.indizi || []).forEach(function (x) { if (x && !x.canc && x.id != null) d(x.id, 1); });
    var s = o.stella != null ? (o.indizi || [])[o.stella] : null;
    if (s && !s.canc && s.id != null) d(s.id, 2);
    return r;
  }
  // 🤝 tutti insieme: 13 parole; giusta = +1, Passo = parola persa, sbagliata = persa anche la parola dopo (se c'è)
  function coopPasso(c, esito) {
    var f = (c.fatte || 0) + 1, p = c.punti || 0, persa = false;
    if (esito === "giusta") p++;
    else if (esito === "sbagliata" && f < CARTE_COOP) { f++; persa = true; }
    return { fatte: Math.min(CARTE_COOP, f), punti: p, persa: persa };
  }
  function fraseCoop(p) {
    if (p >= 13) return "Perfetto! 🏆 Tutte e 13!";
    if (p === 12) return "Incredibile! 🤩";
    if (p === 11) return "Fantastici! 🎉";
    if (p >= 9) return "Che squadra! 💪";
    if (p >= 7) return "Bravi, niente male 👍";
    if (p >= 4) return "Si può fare di meglio 🙂";
    return "Ritentate, andrà meglio! 🍀";
  }
  // gli indizi che si cancellano da soli: «non vale» e i doppioni (gr = il gruppo dei doppioni, per i nomi)
  function cancellaDaSoli(indizi, parola) {
    var g = 0;
    indizi.forEach(function (x) { x.canc = nonVale(x.testo, parola) ? "nonvale" : null; x.gr = null; });
    for (var a = 0; a < indizi.length; a++) {
      if (indizi[a].canc === "nonvale") continue;
      for (var b = a + 1; b < indizi.length; b++) {
        if (indizi[b].canc === "nonvale" || indizi[b].gr != null) continue;
        if (!stessoIndizio(indizi[a].testo, indizi[b].testo)) continue;
        if (indizi[a].gr == null) { indizi[a].gr = ++g; indizi[a].canc = "doppio"; }
        indizi[b].gr = indizi[a].gr; indizi[b].canc = "doppio";
      }
    }
    return indizi;
  }
  // i «si somigliano» toccati da chi ha scritto (coppie di posti): si cancellano, a gruppi
  function applicaSimili(indizi, coppie) {
    var maxG = 0;
    indizi.forEach(function (x) { if (x.canc === "simile") { x.canc = null; x.gr = null; } if (x.gr != null && x.gr > maxG) maxG = x.gr; });
    var capo = indizi.map(function (x, i) { return i; });
    function su(i) { while (capo[i] !== i) i = capo[i] = capo[capo[i]]; return i; }
    var tocca = {};
    (coppie || []).forEach(function (c) {
      var a = c[0], b = c[1];
      if (!indizi[a] || !indizi[b] || a === b || indizi[a].canc || indizi[b].canc) return;
      capo[su(a)] = su(b); tocca[a] = tocca[b] = 1;
    });
    var gruppi = {};
    Object.keys(tocca).forEach(function (k) { var r = su(+k); if (!gruppi[r]) gruppi[r] = ++maxG; indizi[+k].canc = "simile"; indizi[+k].gr = gruppi[r]; });
    return indizi;
  }
  function regoleDa(imp) {
    imp = imp || {};
    var mazzi = Array.isArray(imp.mazzi) ? imp.mazzi.filter(function (id) { return mazzoDi(id); }) : null;
    return { stile: imp.stile === "insieme" ? "insieme" : "punti", giri: [1, 2, 3].indexOf(+imp.giri) >= 0 ? +imp.giri : 2,
      mazzi: mazzi && mazzi.length ? mazzi : ["facile", "media"] };
  }
  function mazzi() { return (window.SG_UNAPAROLA || []).filter(function (m) { return m && m.id && m.parole; }); }
  function mazzoDi(id) { return mazzi().filter(function (m) { return m.id === id; })[0] || null; }
  function paroleDi(id) { var m = mazzoDi(id); return m ? m.parole.split("|").filter(Boolean) : []; }
  // pesca una parola dai mazzi scelti: mai una già uscita in questa partita, e quelle uscite di recente su questo telefono no
  function pesca(R, usate) {
    var pool = [];
    R.mazzi.forEach(function (id) { pool = pool.concat(paroleDi(id)); });
    if (!pool.length) mazzi().forEach(function (m) { pool = pool.concat(paroleDi(m.id)); });
    if (!pool.length) pool = ["GATTO"];
    var rec = leggi(CHIAVE_USATE); if (!Array.isArray(rec)) rec = [];
    var l = pool.filter(function (w) { return usate.indexOf(w) < 0 && rec.indexOf(w) < 0; });
    if (!l.length) l = pool.filter(function (w) { return usate.indexOf(w) < 0; });
    if (!l.length) l = pool;
    var w = l[rnd(l.length)];
    usate.push(w);
    rec = rec.filter(function (x) { return x !== w; }); rec.push(w);
    scrivi(CHIAVE_USATE, rec.slice(-Math.min(300, Math.max(10, pool.length - 20))));
    return w;
  }
  // i nomi di un gruppo di doppioni: «Paky e Luca»
  function nomiGruppo(lista, gr, nomeDi) {
    var n = [];
    lista.forEach(function (x) { if (x.gr === gr) { var q = nomeDi(x.id); if (n.indexOf(q) < 0) n.push(q); } });
    return n.length > 1 ? n.slice(0, -1).join(", ") + " e " + n[n.length - 1] : n[0] || "";
  }
  // per le prove (.agents/skills/prova-nel-browser/unaparola/base.js)
  window.__unaparola = { norma: norma, radice: radice, forme: forme, stessoIndizio: stessoIndizio, unaParola: unaParola, nonVale: nonVale, giusta: giusta,
    puntiTurno: puntiTurno, coopPasso: coopPasso, fraseCoop: fraseCoop, cancellaDaSoli: cancellaDaSoli, applicaSimili: applicaSimili, regoleDa: regoleDa, pesca: pesca };

  // =========================================================
  //  HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    // io che tengo la partita: "host", oppure (host di riserva) l'id da amico di chi ha preso il posto. MAI "host" fisso
    var IO = t.mioId || "host";
    var H = { fase: "lobby", codice: "…", pronta: false, partita: 0, rip: 0, respiro: 0, R: regoleDa(t.impostazioni),
      players: [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0, piu: 0 }],
      guarda: [],     // nella Sala: chi non è stato scelto (guarda, col suo id nella foto): { id, nome }
      prossimi: [],   // arrivati a partita cominciata: entrano all'inizio del turno dopo, con 0 punti: { id, nome, omino }
      turno: 0, giro: 1, fatti: [], chi: null, scrittori: [], doppio: false, parola: null,
      cor: {},        // gli indizi mentre si scrivono: { id: [testo, testo] }
      indizi: [],     // dopo: [{ id, n, testo, canc, gr }]
      coppie: [], fattoCtrl: [], risposta: null, giusta: false, passato: false, saltato: false, stella: null, punteggi: null,
      coop: { fatte: 0, punti: 0 }, persa: null, passo: null, pronti: [], scadenza: 0, usate: [], classifica: null, to: null };
    // ----- la partita di prima (t.ripresa): l'host ha ricaricato o riaperto l'app, oppure (daRiserva) l'host è sparito e
    // la porto avanti io. Chi giocava resta dentro "atteso" (rientra da solo col suo join, stesso id: lì gli rimando il
    // segreto); chi non torna in 15 secondi esce. L'host sparito (se la porto avanti io) è fuori subito
    var R0 = t.ripresa, riprendo = !!(R0 && R0.stato && R0.stato.fase && R0.stato.fase !== "lobby" && R0.stato.players), attesi = {}, tAttesi = null, tRespiro = null, uscito = false;
    if (riprendo) {
      H = R0.stato;
      H.to = null; H.pronta = false; H.rip = H.rip || 0; H.guarda = H.guarda || []; H.prossimi = []; H.usate = H.usate || [];
      H.R = regoleDa(H.R); H.coop = H.coop || { fatte: 0, punti: 0 };
      H.players.forEach(function (p) {
        p.forse = false;
        if (p.id === IO) { p.via = false; p.omino = t.mioOmino(p.nome); return; }
        if (R0.daRiserva && p.id === R0.vecchioHost) { p.via = true; return; }
        if (!p.via) attesi[p.id] = 1;
      });
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function nomeDi(id) { var p = pById(id); return p ? p.nome : "?"; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function guardaId(id) { return H.guarda.some(function (x) { return x.id === id; }); }
    function inProssimi(id) { return H.prossimi.some(function (x) { return x.id === id; }); }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    function dopo(ms, fn) { ferma(); H.to = setTimeout(function () { H.to = null; if (!uscito) fn(); }, ms); }
    function scade(sec) { H.scadenza = Date.now() + Math.round(sec * 1000); }
    function chiave() { return H.partita + "|" + H.turno + "|" + H.passo; }
    function segK() { return H.partita + "|" + H.turno; }
    function attiviScr() { return H.scrittori.filter(function (id) { var p = pById(id); return p && !p.via; }); }
    function quanti() { return H.doppio ? 2 : 1; }
    function servono() { return Math.floor(presenti().length / 2) + 1; }
    function prontiVeri() { return H.pronti.filter(function (id) { var p = pById(id); return p && !p.via; }); }
    function validiIdx() { var l = []; H.indizi.forEach(function (x, k) { if (!x.canc) l.push(k); }); return l; }
    // all'inizio di un turno chi aspettava entra, con 0 punti
    function entrano() {
      H.prossimi.forEach(function (x) { if (!pById(x.id) && presenti().length < MAX) H.players.push({ id: x.id, nome: x.nome, omino: x.omino, punti: 0, piu: 0 }); });
      H.prossimi = [];
    }

    // "⚙️ Regole" nella saletta: l'host cambia le impostazioni quando vuole
    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.R = regoleDa(im); bd(); };

    // chi se ne va (uscito apposta, sparito da più di 20 secondi o, dopo una ripresa, non tornato in tempo)
    function addio(id) {
      delete attesi[id];
      if (guardaId(id)) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
      if (inProssimi(id)) { H.prossimi = H.prossimi.filter(function (x) { return x.id !== id; }); bd(); return; }
      var p = pById(id); if (!p || (p.via && H.fase !== "lobby")) return;
      p.forse = false;
      if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
      p.via = true;   // a partita iniziata resta in classifica, ma non gioca più (se torna riprende il suo posto)
      if (H.fase === "gioco") {
        if (presenti().length < MIN) return fine();
        // se ne va chi indovina: il turno salta (nessun punto); se stava scegliendo la stella, i punti restano
        if (id === H.chi && ["scrivi", "controllo", "svela", "indovina"].indexOf(H.passo) >= 0) return saltaTurno();
        if (id === H.chi && H.passo === "stella") return chiudiStella(null);
        controlla();
      }
      bd();
    }
    var rete = SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      // la stanza non si è proprio aperta (primo collegamento): si riprova da capo. Dopo, la rete che salta la gestisce il core
      onErrore: function () {
        if (H.pronta) return;
        ferma(); clearTimeout(tAttesi); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
      onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
      onAddio: addio,
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          delete attesi[id];   // (dopo una ripresa: è tornato)
          var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
          // nella Sala, se siete più dei posti, gioca chi ha scelto l'host: gli altri guardano (col loro id nella foto)
          if (!p && (guardaId(id) || !t.puoSedersi(id, nome))) {
            if (!guardaId(id)) H.guarda.push({ id: id, nome: nome });
            bd(); privato(id, segretoDi(id)); return;
          }
          // arrivato a partita cominciata: aspetta in "prossimi" (il suo id nella foto) ed entra al turno dopo, con 0 punti
          if (!p && H.fase === "gioco") {
            if (!inProssimi(id)) {
              if (presenti().length + H.prossimi.length < MAX) H.prossimi.push({ id: id, nome: nome, omino: avatarValido(m.omino) });
              else if (!guardaId(id)) H.guarda.push({ id: id, nome: nome });   // (pieno: guarda)
            }
            bd(); privato(id, segretoDi(id)); return;
          }
          if (!p && H.fase === "lobby") {
            if (H.players.length < MAX) H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino), punti: 0, piu: 0 });
            else if (!guardaId(id)) H.guarda.push({ id: id, nome: nome });
          }
          // chi rientra (pagina ricaricata, telefono riacceso, partita ripresa) ha lo STESSO id: ritrova posto, punti e parola
          if (p) { p.forse = false; if (!p.omino) p.omino = avatarValido(m.omino); if (p.via && H.fase === "gioco") p.via = false; }
          bd();
          if (p && H.fase === "gioco") { privato(id, segretoDi(id)); controlla(); }
          return;
        }
        if (H.fase !== "gioco") return;
        if (m.t === "chiedi") { privato(id, segretoDi(id)); return; }   // la mia parola non è arrivata: la rimando
        var q = pById(id); if (!q || q.via) return;   // chi guarda soltanto non fa mosse
        if (m.t === "indizio") indizio(id, m.n, m.testo);
        else if (m.t === "simili") simili(id, m.a, m.b, m.k);
        else if (m.t === "ripristina") ripristina(id, m.i, m.k);
        else if (m.t === "ok") okCtrl(id, m.k);
        else if (m.t === "risposta") risposta(id, m.w, m.k);
        else if (m.t === "stella") stella(id, m.i, m.k);
        else if (m.t === "avanti") avanti(id, m.k);
      }
    }, { ripresa: riprendo });   // con la partita ripresa gli amici NON tornano in saletta
    if (!rete) return senzaRete(t);
    if (riprendo && rete.codice) H.codice = rete.codice;

    // ----- i segreti: a un telefono solo (mai a chi indovina) -----
    function segretoDi(id) {
      if (H.fase !== "gioco" || !H.parola || !H.passo) return null;
      var m = { t: "seg", k: segK() };
      if (id === H.chi) { m.indovino = true; return m; }   // a chi indovina NIENTE parola
      m.parola = H.parola;
      if (H.scrittori.indexOf(id) >= 0) m.mie = (H.cor[id] || []).slice();
      if (H.passo === "controllo") m.testi = H.indizi.map(function (x) { return x.testo; });
      return m;
    }
    function privato(id, m) {
      if (!m) return;
      if (id === IO) { riceviPrivato(cbHost, m); return; }
      m.to = id; rete.inviaVeloce(m);   // (con "to": non resta in stanza e gli altri telefoni lo ignorano)
    }
    function mandaSegreti() {
      var fatti = {};
      presenti().map(function (p) { return p.id; }).concat(H.guarda.map(function (x) { return x.id; }), H.prossimi.map(function (x) { return x.id; }))
        .forEach(function (id) { if (fatti[id] || id === H.chi) return; fatti[id] = 1; privato(id, segretoDi(id)); });
    }
    // la "foto" per tutti: SEMPRE con gli id e con "fase"; la parola e i testi degli indizi solo dal momento giusto
    function vm() {
      var p = H.passo, svelati = ["svela", "indovina", "risposta", "stella", "esito"].indexOf(p) >= 0, dopoR = ["risposta", "stella", "esito"].indexOf(p) >= 0;
      var scritto = {};
      if (p === "scrivi") H.scrittori.forEach(function (id) { scritto[id] = (H.cor[id] || []).filter(Boolean).length; });
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, rip: H.rip, tiene: IO,
        stile: H.R.stile, giri: H.R.giri, giro: H.giro, turno: H.turno, passo: p, k: chiave(), sk: segK(),
        resta: H.fase === "gioco" && H.scadenza ? Math.max(0, Math.ceil((H.scadenza - Date.now()) / 1000)) : 0,   // i secondi che mancano (non l'ora)
        chi: H.chi, scrittori: H.scrittori, doppio: H.doppio, scritto: scritto, fattoCtrl: p === "controllo" ? H.fattoCtrl : [],
        indizi: p === "controllo" ? H.indizi.map(function (x) { return { id: x.id, canc: x.canc, gr: x.gr }; })
          : svelati ? H.indizi.map(function (x) { return { id: x.id, canc: x.canc, gr: x.gr, testo: p === "esito" || !x.canc ? x.testo : null }; }) : null,
        risposta: dopoR ? H.risposta : null, giusta: dopoR ? H.giusta : null, passato: dopoR ? H.passato : null, saltato: dopoR ? H.saltato : null,
        parola: dopoR ? H.parola : null,
        stella: p === "esito" ? H.stella : null, punteggi: p === "esito" ? H.punteggi : null,
        coop: H.R.stile === "insieme" ? { fatte: H.coop.fatte, punti: H.coop.punti, tot: CARTE_COOP } : null, persa: p === "esito" ? H.persa : null,
        pronti: prontiVeri(), servono: servono(), classifica: H.classifica,
        players: H.players.map(function (q) { return { id: q.id, nome: q.nome, punti: q.punti, piu: q.piu || 0, via: !!q.via, forse: !!q.forse, omino: H.fase === "lobby" ? (q.omino || null) : undefined }; }),
        guarda: H.guarda, prossimi: H.prossimi.map(function (x) { return { id: x.id, nome: x.nome }; }) };
    }
    function bd() { var v = vm(); rete.invia({ t: "vm", vm: v }); ricorda(); disegna(t, v, cbHost); vici(); }
    // la partita da ricordare: tutto H tranne il timer, senza avatar, con le scadenze come ORE. La parola e gli indizi
    // ci sono: restano su questo telefono e nella copia per il vice, mai nella foto per tutti. In saletta niente
    function ricorda() {
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {};
      Object.keys(H).forEach(function (k) { if (k !== "to" && k !== "prossimi") s[k] = H[k]; });
      s.players = H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, piu: p.piu || 0, via: !!p.via }; });
      t.ricorda(s);
    }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda e chi aspetta il turno dopo
    var viciK = "";
    function vici() {
      if (!t.vici) return;
      var l = H.guarda.map(function (x) { return x.id; }).concat(H.prossimi.map(function (x) { return x.id; })).filter(function (id, i, a) { return id !== IO && a.indexOf(id) === i; });
      var k = l.join(","); if (k === viciK) return;
      viciK = k; t.vici(l.length ? l : null);
    }
    function aCheSiamo() {
      if (H.R.stile === "insieme") t.aCheSiamo("Parola " + Math.min(CARTE_COOP, H.coop.fatte + 1) + " di " + CARTE_COOP + " · " + H.coop.punti + " punti");
      else t.aCheSiamo("Giro " + H.giro + " di " + H.R.giri + " · indovina " + nomeDi(H.chi));
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MIN) return;
      H.fase = "gioco"; H.partita++; H.turno = 0; H.giro = 1; H.fatti = []; H.classifica = null; H.usate = [];
      H.coop = { fatte: 0, punti: 0 };
      H.players.forEach(function (p) { p.punti = 0; p.piu = 0; });
      nuovoTurno();
    }
    // chi indovina adesso: a punti, ognuno lo stesso numero di volte (i giri); tutti insieme, a giro finché ci sono parole
    function prossimoIndovino() {
      var pres = presenti(); if (!pres.length) return null;
      for (var guard = 0; guard < 10; guard++) {
        var c = pres.filter(function (p) { return H.fatti.indexOf(p.id) < 0; });
        if (c.length) return c[0].id;
        if (H.R.stile !== "insieme" && H.giro >= H.R.giri) return null;
        if (H.R.stile !== "insieme") H.giro++;
        H.fatti = [];
      }
      return null;
    }
    function nuovoTurno() {
      ferma();
      entrano();
      if (presenti().length < MIN) return fine();
      if (H.R.stile === "insieme" && H.coop.fatte >= CARTE_COOP) return fine();
      var chi = prossimoIndovino(); if (!chi) return fine();
      H.turno++; H.chi = chi;
      H.scrittori = presenti().filter(function (p) { return p.id !== chi; }).map(function (p) { return p.id; });
      H.doppio = H.scrittori.length === 2;   // in 3: due indizi a testa
      H.parola = pesca(H.R, H.usate);
      H.cor = {}; H.indizi = []; H.coppie = []; H.fattoCtrl = []; H.risposta = null; H.giusta = false; H.passato = false; H.saltato = false;
      H.stella = null; H.punteggi = null; H.persa = null; H.pronti = [];
      H.players.forEach(function (p) { p.piu = 0; });
      H.passo = "scrivi"; scade(T_SCRIVI); dopo(T_SCRIVI * 1000, chiudiScrivi);
      aCheSiamo();
      bd(); mandaSegreti();
    }
    function indizio(id, n, testo) {
      if (H.passo !== "scrivi" || H.scrittori.indexOf(id) < 0) return;
      n = H.doppio && +n === 1 ? 1 : 0;
      var w = pulisci(testo);
      if (!unaParola(w)) { privato(id, { t: "no", testo: "☝️ Una parola sola!" }); return; }
      var l = (H.cor[id] || []).slice(); l[n] = w; H.cor[id] = l;
      controlla(); bd();
    }
    function tuttiScritto() { return attiviScr().every(function (id) { return (H.cor[id] || []).filter(Boolean).length >= quanti(); }); }
    function chiudiScrivi() {
      if (H.passo !== "scrivi") return;
      ferma();
      H.indizi = [];
      H.scrittori.forEach(function (id) { (H.cor[id] || []).forEach(function (w, n) { if (w) H.indizi.push({ id: id, n: n, testo: w }); }); });
      cancellaDaSoli(H.indizi, H.parola);
      // i quasi uguali: 15 secondi per chi ha scritto (solo se ci sono almeno 2 indizi rimasti)
      if (validiIdx().length >= 2 && attiviScr().length) {
        H.passo = "controllo"; H.fattoCtrl = []; H.coppie = []; scade(T_CONTROLLO); dopo(T_CONTROLLO * 1000, chiudiControllo);
        bd(); mandaSegreti(); return;
      }
      svela();
    }
    function simili(id, a, b, k) {
      if (H.passo !== "controllo" || (k && k !== chiave()) || H.scrittori.indexOf(id) < 0) return;
      a = +a; b = +b;
      if (!H.indizi[a] || !H.indizi[b] || a === b) return;
      if (H.indizi[a].canc && H.indizi[a].canc !== "simile" || H.indizi[b].canc && H.indizi[b].canc !== "simile") return;
      if (H.coppie.some(function (c) { return c[0] === a && c[1] === b || c[0] === b && c[1] === a; })) return;
      H.coppie.push([a, b]); applicaSimili(H.indizi, H.coppie); bd();
    }
    function ripristina(id, i, k) {
      if (H.passo !== "controllo" || (k && k !== chiave()) || H.scrittori.indexOf(id) < 0) return;
      i = +i;
      H.coppie = H.coppie.filter(function (c) { return c[0] !== i && c[1] !== i; });
      applicaSimili(H.indizi, H.coppie); bd();
    }
    function okCtrl(id, k) {
      if (H.passo !== "controllo" || (k && k !== chiave()) || H.scrittori.indexOf(id) < 0) return;
      if (H.fattoCtrl.indexOf(id) < 0) H.fattoCtrl.push(id);
      controlla(); bd();
    }
    function chiudiControllo() { if (H.passo === "controllo") svela(); }
    function durataSvela() { return 1300 + 850 * H.indizi.length; }
    function svela() {
      ferma(); H.passo = "svela"; var ms = durataSvela(); scade(ms / 1000); dopo(ms, iniziaIndovina); bd();
    }
    function iniziaIndovina() {
      ferma(); H.passo = "indovina"; scade(T_INDOVINA); dopo(T_INDOVINA * 1000, function () { risposta(H.chi, null, null, true); }); bd();
    }
    // un tentativo solo (o Passo); a tempo scaduto è un Passo
    function risposta(id, w, k, forza) {
      if (H.passo !== "indovina" || id !== H.chi) return;
      if (!forza && k && k !== chiave()) return;
      ferma();
      var x = w == null ? "" : String(w).replace(/\s+/g, " ").trim().slice(0, 24);
      H.risposta = x || null; H.passato = !x; H.giusta = !!x && giusta(x, H.parola);
      H.passo = "risposta"; scade(T_RISPOSTA); dopo(T_RISPOSTA * 1000, dopoRisposta); bd();
    }
    function dopoRisposta() {
      if (H.passo !== "risposta") return;
      ferma();
      var v = validiIdx(), cp = pById(H.chi);
      if (H.R.stile !== "insieme" && H.giusta && v.length >= 2 && cp && !cp.via) {
        H.passo = "stella"; scade(T_STELLA); dopo(T_STELLA * 1000, function () { chiudiStella(null); }); bd(); return;
      }
      if (H.R.stile !== "insieme" && H.giusta && v.length === 1) H.stella = v[0];   // un indizio solo: la stella va da sola a lui
      esito();
    }
    function stella(id, i, k) {
      if (H.passo !== "stella" || id !== H.chi || (k && k !== chiave())) return;
      i = +i; if (validiIdx().indexOf(i) < 0) return;
      chiudiStella(i);
    }
    function chiudiStella(i) { if (H.passo !== "stella") return; ferma(); H.stella = i; esito(); }
    function saltaTurno() { H.risposta = null; H.giusta = false; H.passato = true; H.saltato = true; H.stella = null; esito(); }
    // i punti si danno SOLO qui (una volta per turno): dopo una ripresa sull'esito non si ridanno
    function esito() {
      ferma();
      if (H.R.stile === "insieme") {
        var c = coopPasso(H.coop, H.giusta ? "giusta" : H.passato ? "passo" : "sbagliata");
        H.coop = { fatte: c.fatte, punti: c.punti }; H.persa = c.persa ? pesca(H.R, H.usate) : null; H.punteggi = null;
      } else {
        var pt = puntiTurno({ giusta: H.giusta, chi: H.chi, indizi: H.indizi, stella: H.stella });
        H.players.forEach(function (p) { p.piu = pt[p.id] || 0; p.punti += p.piu; });
        H.punteggi = pt;
      }
      if (H.fatti.indexOf(H.chi) < 0) H.fatti.push(H.chi);
      H.passo = "esito"; H.pronti = []; scade(T_ESITO); dopo(T_ESITO * 1000, avantiEsito); bd();
    }
    // «⏩ Avanti»: si va avanti subito se lo tocca più di metà (k = il momento giusto: un tocco vecchio non vale)
    function avanti(id, k) {
      if (H.passo !== "esito" || (k && k !== chiave())) return;
      if (H.pronti.indexOf(id) < 0) H.pronti.push(id);
      if (prontiVeri().length >= servono()) { if (Date.now() >= H.respiro) return avantiEsito(); controlla(); }   // (nel respiro: dopo)
      bd();
    }
    function avantiEsito() { if (H.fase === "gioco" && H.passo === "esito") nuovoTurno(); }
    // qualcuno ha finito (o è uscito): se ci sono tutti si va avanti senza aspettare il tempo
    // (dopo una ripresa, nei primi secondi di respiro nessun momento si chiude: si ricontrolla quando il respiro finisce)
    function controlla() {
      if (H.fase !== "gioco") return;
      var presto = (H.respiro || 0) - Date.now();
      if (presto > 0) { clearTimeout(tRespiro); tRespiro = setTimeout(function () { tRespiro = null; if (!uscito) controlla(); }, presto + 60); return; }
      if (H.passo === "scrivi" && tuttiScritto()) { scade(1); dopo(900, chiudiScrivi); }
      else if (H.passo === "controllo" && attiviScr().every(function (id) { return H.fattoCtrl.indexOf(id) >= 0; })) { scade(1); dopo(700, chiudiControllo); }
      else if (H.passo === "esito" && prontiVeri().length >= servono()) avantiEsito();
    }
    function fine() {
      ferma();
      var coop = H.R.stile === "insieme", ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      H.classifica = coop ? H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: H.coop.punti, pos: 1 }; })
        : ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
      H.fase = "fine"; H.passo = null; H.scadenza = 0; bd();
      // classifica della serata e XP: i NOMI col loro posto (tutti insieme: tutti primi, si vince o si perde insieme)
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // "Nuova partita": stessa stanza, stessi amici, tutti nella saletta (chi guardava nella Sala resta a guardare)
    function nuova() {
      if (H.fase !== "fine") return;
      ferma(); H.fase = "lobby"; H.passo = null; H.classifica = null; H.turno = 0; H.chi = null; H.parola = null;
      H.indizi = []; H.cor = {}; H.coppie = []; H.scadenza = 0; H.pronti = []; H.fatti = []; H.giro = 1;
      H.players = presenti(); entrano();
      // chi tiene la partita c'è sempre; se l'ha presa guardando (host di riserva), si siede
      if (!pById(IO)) {
        var g0 = H.guarda.filter(function (x) { return x.id === IO; })[0];
        H.guarda = H.guarda.filter(function (x) { return x.id !== IO; });
        var nm = (g0 && g0.nome) || t.nomeProfilo() || nomeHost;
        H.players.push({ id: IO, nome: nm, omino: t.mioOmino(nm), punti: 0, piu: 0 });
      }
      H.players.sort(function (a, b) { return (b.id === IO) - (a.id === IO); });
      H.players.forEach(function (p) { p.punti = 0; p.piu = 0; });
      bd();   // (in saletta bd() fa t.ricorda(null))
    }
    t.onRivincita = nuova;

    // ----- la ripresa: ogni momento continua col tempo che restava (mai troppo poco), con 5 secondi di respiro.
    // I punti si danno solo in esito(): un turno già chiuso resta chiuso; sulla classifica finale si resta lì
    function riprendi() {
      tAttesi = setTimeout(function () { tAttesi = null; if (!uscito) Object.keys(attesi).forEach(addio); }, 15000);
      if (H.fase !== "gioco") { H.scadenza = 0; return bd(); }
      var ora = Date.now(), resta = H.scadenza ? R0.ora(H.scadenza) - ora : 0, p = H.passo, ms, fn;
      function almeno(sec) { return Math.max(resta, sec * 1000); }
      H.rip++; H.respiro = ora + RESPIRO * 1000;
      if (p === "scrivi") { ms = almeno(15); fn = chiudiScrivi; }
      else if (p === "controllo") { ms = almeno(8); fn = chiudiControllo; }
      else if (p === "svela") { ms = Math.max(RESPIRO * 1000, durataSvela()); fn = iniziaIndovina; }   // (gli indizi si rigirano su tutti i telefoni)
      else if (p === "indovina") { ms = almeno(15); fn = function () { risposta(H.chi, null, null, true); }; }
      else if (p === "risposta") { ms = RESPIRO * 1000; fn = dopoRisposta; }
      else if (p === "stella") { ms = almeno(8); fn = function () { chiudiStella(null); }; }
      else if (p === "esito") { ms = almeno(6); fn = avantiEsito; }
      else { ms = RESPIRO * 1000; fn = nuovoTurno; }   // (un momento che non c'è: si passa al turno dopo, nessun punto dato)
      H.scadenza = ora + ms; dopo(ms, fn);
      bd(); mandaSegreti();
      controlla();
    }

    var cbHost = { sonoHost: true, myId: IO, seg: null, mie: {}, vm: null,
      onComincia: comincia, onNuova: nuova,
      onIndizio: function (n, w) { indizio(IO, n, w); },
      onSimili: function (a, b, k) { simili(IO, a, b, k); },
      onRipristina: function (i, k) { ripristina(IO, i, k); },
      onOk: function (k) { okCtrl(IO, k); },
      onRisposta: function (w, k) { risposta(IO, w, k); },
      onStella: function (i, k) { stella(IO, i, k); },
      onAvanti: function (k) { avanti(IO, k); },
      chiedi: function () {},
      onEsci: function () {
        // uscito apposta: niente da riprendere (t.ricorda(null)), poi si chiude la stanza
        function via() { uscito = true; ferma(); clearTimeout(tAttesi); clearTimeout(tRespiro); t.ricorda(null); rete.chiudi(); t.esci(); }
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);
        via();
      } };
    window.__upHost = { H: function () { return H; }, io: IO };   // (per le prove)
    if (riprendo) riprendi(); else bd();
  }

  // =========================================================
  //  OSPITE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, nome: "", chiesto: 0 };
    function invia(m) { if (S.rete) S.rete.invia(m); }
    var cb = { sonoHost: false, myId: null, seg: null, mie: {}, vm: null,
      onIndizio: function (n, w) { invia({ t: "indizio", n: n, testo: w }); },
      onSimili: function (a, b, k) { invia({ t: "simili", a: a, b: b, k: k }); },
      onRipristina: function (i, k) { invia({ t: "ripristina", i: i, k: k }); },
      onOk: function (k) { invia({ t: "ok", k: k }); },
      onRisposta: function (w, k) { invia({ t: "risposta", w: w, k: k }); },
      onStella: function (i, k) { invia({ t: "stella", i: i, k: k }); },
      onAvanti: function (k) { invia({ t: "avanti", k: k }); },
      // la parola non è arrivata (pagina ricaricata, messaggio perso): la richiedo all'host, al massimo ogni 2,5 secondi
      chiedi: function () { if (!S.rete || Date.now() - S.chiesto < 2500) return; S.chiesto = Date.now(); invia({ t: "chiedi" }); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (t.guarda) return t.conferma("Smetti di guardare?", null, "Esci", via);
        if (cb.vm && cb.vm.fase === "gioco" && trova(cb.vm, cb.myId)) return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "☝️", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
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
        // il "join" lo ripete il collegamento finché il mio id non compare nella foto dell'host
        onAperto: function (id) { cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== cb.myId) return;   // era per un altro telefono
          if (m.t === "vm") { disegna(t, m.vm, cb); if (serveSeg(m.vm, cb)) cb.chiedi(); }
          else if (m.t === "seg" || m.t === "no") riceviPrivato(cb, m);
        },
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        // SOLO se il primo collegamento non è riuscito: si riprova (dopo, la rete che salta la gestisce il core)
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "☝️", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }
  // mi serve il segreto (la parola, o i testi degli indizi da controllare)? Mai a chi indovina
  function dentroVm(vm, cb) { return !!trova(vm, cb.myId) || (vm.guarda || []).some(function (x) { return x.id === cb.myId; }) || (vm.prossimi || []).some(function (x) { return x.id === cb.myId; }); }
  function serveSeg(vm, cb) {
    if (vm.fase !== "gioco" || !vm.passo || vm.chi === cb.myId || vm.passo === "esito") return false;
    if (!dentroVm(vm, cb)) return false;
    if (!cb.seg || cb.seg.k !== vm.sk) return true;
    return vm.passo === "controllo" && !cb.seg.testi;
  }
  function riceviPrivato(cb, m) {
    if (m.t === "seg") {
      cb.seg = m;
      if (m.mie && m.mie.length) {   // (rientrato: i miei indizi già scritti)
        var l = cb.mie[m.k] || (cb.mie[m.k] = []);
        m.mie.forEach(function (w, n) { if (w && !l[n]) l[n] = w; });
      }
      if (UI && UI.cb === cb && UI.cur && UI.cur.agg && cb.vm) UI.cur.agg(cb.vm);
    } else if (m.t === "no") avviso(m.testo);
  }
  function trova(vm, id) { var l = vm.players || []; for (var i = 0; i < l.length; i++) if (l[i].id === id) return l[i]; return null; }
  function nomeVm(vm, id, cb) { var p = trova(vm, id); return p ? (cb && p.id === cb.myId ? "Tu" : p.nome) : "?"; }

  // =========================================================
  //  DISEGNO ONLINE (uguale per host e ospiti): saletta, gioco, fine
  // =========================================================
  var UI = null;   // la schermata di gioco si costruisce UNA volta e poi si aggiorna a pezzi
  var FIN = null;  // la classifica finale già a schermo: le foto dopo non la ridisegnano
  function disegna(t, vm, cb) {
    cb.vm = vm;
    if (vm.fase === "lobby") { UI = FIN = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      UI = null;
      var kf = "fine|" + vm.partita;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: finale(t, vm, cb) };
      return;
    }
    FIN = null;
    if (!UI || UI.t !== t || UI.cb !== cb || !document.body.contains(UI.s)) UI = creaSchermo(t, cb);
    aggiorna(UI, vm, cb);
  }
  function lobby(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    var extra = [];
    if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
      extra: extra,
      spettatore: t.guarda ? "👀 Guardi soltanto" : guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  // il mio ruolo in questo turno: chi indovina, chi scrive, chi guarda
  function ruoloDi(vm, cb) {
    if (vm.chi === cb.myId) return "indovina";
    var me = trova(vm, cb.myId);
    if (me && !me.via && (vm.scrittori || []).indexOf(cb.myId) >= 0) return "scrive";
    return "guarda";
  }
  function segOk(cb, vm) { return cb && cb.seg && cb.seg.k === vm.sk && cb.seg.parola ? cb.seg : null; }
  // la parola sulla carta: a chi la può vedere (arriva col segreto), «🤫» a chi guarda col link (non la riceve mai)
  function parolaPer(cb, vm, senza) { var s = segOk(cb, vm); return s ? s.parola : cb && cb.myId != null && !dentroVm(vm, cb) ? "🤫" : senza; }
  function creaSchermo(t, cb) {
    var ui = scena(t, { esci: cb.onEsci, targa: !!t.guarda && !t.eliminazione });
    ui.cb = cb; ui.kFase = null; ui.cur = null;
    return ui;
  }
  function aggiorna(ui, vm, cb) {
    var ruolo = ruoloDi(vm, cb), coop = vm.stile === "insieme";
    var aspetto = (vm.prossimi || []).some(function (p) { return p.id === cb.myId; });
    var info = (aspetto ? "✋ Entri al prossimo turno · " : ruolo === "guarda" && !trova(vm, cb.myId) ? "👀 Guardi · " : "") +
      (coop ? "🤝 Parola " + Math.min(vm.coop.tot, vm.coop.fatte + (vm.passo === "esito" ? 0 : 1)) + " di " + vm.coop.tot + " · ⭐ " + vm.coop.punti
        : "Giro " + vm.giro + " di " + vm.giri) + " · 🎯 " + nomeVm(vm, vm.chi, cb);
    setTx(ui.info, info);
    chips(ui, vm, cb, coop);
    // la parte del turno si ricostruisce solo quando cambia il momento (o il mio ruolo, o dopo una ripresa)
    var k = vm.k + "|" + (vm.rip || 0) + "|" + ruolo;
    if (k !== ui.kFase) {
      ui.kFase = k; pulisciTimer(ui);
      ui.t.svuota(ui.palco); ui.t.svuota(ui.carte); ui.t.svuota(ui.azione);
      ui.palco.className = "up-palco"; ui.carte.className = "up-carte";
      var f = FASI[vm.passo];
      ui.cur = f ? f(ui, vm, cb, ruolo) : null;
      faccineSe(ui, ruolo, vm.passo);
    } else if (ui.cur && ui.cur.agg) ui.cur.agg(vm);
  }
  // le faccine a chi aspetta senza fare niente (chi indovina mentre gli altri scrivono, chi guarda)
  function faccineSe(ui, ruolo, passo) {
    var serve = !ui.targa && (ruolo === "guarda" || (ruolo === "indovina" && (passo === "scrivi" || passo === "controllo")) ||
      (ruolo === "scrive" && (passo === "indovina" || passo === "stella")));
    if (serve && !ui.faccine) { ui.faccine = ui.t.faccine(); if (ui.faccine) ui.fac.appendChild(ui.faccine); }
    ui.fac.style.display = serve && ui.faccine ? "" : "none";
  }
  function chips(ui, vm, cb, coop) {
    vm.players.forEach(function (p) {
      var c = ui.chip[p.id];
      if (!c) { c = ui.chip[p.id] = ui.t.el("div", { class: "up-chip" }); ui.punti.appendChild(c); }
      var tx = (p.forse ? "📶 " : "") + (p.id === vm.chi ? "🎯 " : "") + (p.id === cb.myId ? "Tu" : p.nome) + (coop ? "" : " " + fmtN(p.punti)) +
        (vm.passo === "esito" && p.piu ? " +" + p.piu : "");
      setTx(c, tx);
      c.classList.toggle("via", !!p.via || !!p.forse);
      c.classList.toggle("chi", p.id === vm.chi);
      c.classList.toggle("piu", vm.passo === "esito" && p.piu > 0);
    });
  }

  // ---- i pezzi comuni: la carta della parola e le carte degli indizi ----
  function parolaCarta(ui, testo, sotto, piccola) {
    var el = ui.t.el, w = el("div", { class: "up-parola" + (piccola ? " piccola" : ""), text: testo });
    ui.palco.appendChild(w);
    var s = el("div", { class: "up-sotto", text: sotto || "" });
    ui.palco.appendChild(s);
    return { w: w, s: s };
  }
  function colonne(ui, n) { ui.carte.style.setProperty("--col", n <= 4 ? 2 : 3); ui.carte.classList.toggle("tante", n > 6); }
  function nuovaCarta(ui, onTocco) {
    var el = ui.t.el, c = el("div", { class: "up-carta coperta" }, [el("span", { class: "w" }), el("span", { class: "a" }), el("span", { class: "b" })]);
    if (onTocco) c.addEventListener("pointerdown", function (e) { e.preventDefault(); onTocco(); });
    ui.carte.appendChild(c);
    return c;
  }
  function setCarta(c, o) {
    var cl = "up-carta " + (o.stato || "coperta") + (o.tocca ? " tocca" : "") + (o.sel ? " sel" : "") + (o.stella ? " stella" : "") + (o.extra ? " " + o.extra : "");
    if (c.className.replace(/ (gira|boom)/g, "") !== cl) c.className = cl + (/ gira/.test(c.className) ? " gira" : "") + (/ boom/.test(c.className) ? " boom" : "");
    setTx(c.children[0], o.w || ""); setTx(c.children[1], o.a || ""); setTx(c.children[2], o.b || "");
  }
  // com'è una carta indizio già girata (x: { id, canc, gr, testo })
  function infoCarta(vm, lista, x, cb, tutto) {
    var nomeDi = function (id) { return nomeVm(vm, id, cb); };
    if (!x.canc) return { stato: "aperta", w: x.testo || "", a: nomeDi(x.id) };
    var nota = x.canc === "nonvale" ? "🚫 non vale" : x.canc === "simile" ? "🤝 si somigliano" : "💥 doppione";
    return { stato: "canc", w: tutto && x.testo ? x.testo : (x.canc === "nonvale" ? "🚫" : "💥"), a: tutto && x.testo ? nomeDi(x.id) + " · " + nota : nomeDi(x.id) + " · " + nota };
  }
  function dopoUi(ui, ms, fn) {
    var k = ui.kFase, tm = setTimeout(function () { if (ui.kFase === k && document.body.contains(ui.s)) fn(); }, ms);
    ui.timers.push(tm);
  }
  function pulisciTimer(ui) { (ui.timers || []).forEach(clearTimeout); ui.timers = []; }
  // gli indizi si girano uno alla volta; i doppioni esplodono 💥 con «Paky e Luca: stessa idea!»
  function giraTutte(ui, vm, cb, carte, lista, passo, dopoFn) {
    var detti = {};
    lista.forEach(function (x, i) {
      dopoUi(ui, 500 + i * passo, function () {
        var c = carte[i], inf = infoCarta(vm, lista, x, cb, false);
        c.classList.remove("gira"); void c.offsetWidth; c.classList.add("gira");
        setTimeout(function () { setCarta(c, inf); }, 180);
        if (x.canc) {
          setTimeout(function () { c.classList.remove("boom"); void c.offsetWidth; c.classList.add("boom"); }, 200);
          puf();
          if (x.gr != null && !detti[x.canc + x.gr]) {
            detti[x.canc + x.gr] = 1;
            var nomi = nomiGruppo(lista, x.gr, function (id) { return nomeVm(vm, id, cb); });
            avviso(x.canc === "simile" ? "🤝 " + nomi + ": quasi uguali!" : /,| e /.test(nomi) ? "💥 " + nomi + ": stessa idea!" : "💥 " + nomi + ": due volte uguale!");
          } else if (x.canc === "nonvale") avviso("🚫 " + nomeVm(vm, x.id, cb) + ": non vale!");
        } else tic(620 + i * 40);
      });
    });
    if (dopoFn) dopoUi(ui, 500 + lista.length * passo + 200, dopoFn);
  }
  function contoRip(ui, nodo, vm, def, pre, testo) {
    return ui.t.contoAvanti(nodo, vm.resta || def, null, pre + "|" + vm.k + "|" + (vm.rip || 0), testo);
  }

  // ---- le fasi del turno: ognuna costruisce palco, carte e azione, e torna { agg(vm) } per i pezzi che cambiano ----
  var FASI = {};
  // ✍️ si scrive l'indizio (chi indovina aspetta)
  FASI.scrivi = function (ui, vm, cb, ruolo) {
    var el = ui.t.el, nomeChi = nomeVm(vm, vm.chi, cb), q = vm.doppio ? 2 : 1, pal;
    if (ruolo === "indovina") pal = parolaCarta(ui, "❓", "Indovini tu! Gli altri scrivono un indizio di una parola sola…");
    else pal = parolaCarta(ui, "…", ruolo === "scrive" ? (vm.doppio ? "Scrivi DUE indizi per " + nomeChi + " (una parola ciascuno)" : "Scrivi un indizio per " + nomeChi + ": una parola sola") : "👀 La parola che deve indovinare " + nomeChi);
    var slots = [];
    (vm.scrittori || []).forEach(function (id) { for (var n = 0; n < q; n++) slots.push({ id: id, n: n }); });
    colonne(ui, slots.length);
    var carte = slots.map(function () { return nuovaCarta(ui); });
    var zona = el("div", { class: "up-zona" }), conto = el("p", { class: "up-conto" });
    if (ruolo === "scrive") ui.azione.appendChild(zona);
    ui.azione.appendChild(conto);
    contoRip(ui, conto, vm, T_SCRIVI, "sc", "⏱ Mancano ");
    var righe = [], stati = [];
    function mie() { return cb.mie[vm.sk] || []; }
    function zonaScrivi() {
      if (ruolo !== "scrive") return;
      var sg = segOk(cb, vm);
      for (var n = 0; n < q; n++) {
        var w = mie()[n], st = w ? "m:" + w : "s";
        if (stati[n] === st) continue;
        stati[n] = st;
        if (righe[n]) zona.removeChild(righe[n]);
        var r = rigaScrivi(n, w, sg);
        if (righe[n + 1] && righe[n + 1].parentNode === zona) zona.insertBefore(r, righe[n + 1]); else zona.appendChild(r);
        righe[n] = r;
      }
    }
    function rigaScrivi(n, w, sg) {
      if (w) {
        return el("div", { class: "up-fatto" }, [el("span", { text: "✅ «" + w + "»" }),
          el("button", { class: "up-cambia", type: "button", text: "✏️ Cambia", onclick: function () { var l = cb.mie[vm.sk] || []; l[n] = null; stati[n] = null; cb.cambia = n; zonaScrivi(); } })]);
      }
      var inp = el("input", { type: "text", class: "up-input", maxlength: String(LUNGO), placeholder: q > 1 ? (n ? "Secondo indizio" : "Primo indizio") : "Il tuo indizio", autocomplete: "off", autocapitalize: "characters", enterkeyhint: "send", spellcheck: "false" });
      var b = el("button", { class: "btn btn-primario up-invia", type: "button", text: "Invia" });
      var hint = el("div", { class: "up-hint" });
      function controllaHint() {
        var s = segOk(cb, vm), v = inp.value.trim();
        setTx(hint, !v ? "" : !unaParola(v) ? "☝️ Una parola sola, senza spazi" : s && nonVale(v, s.parola) ? "⚠️ Contiene la parola: verrà cancellato" : "");
      }
      function manda() {
        var v = pulisci(inp.value);
        if (!v) { inp.focus(); return; }
        if (!unaParola(v)) { avviso("☝️ Una parola sola!"); vibra(30); return; }
        var l = cb.mie[vm.sk] || (cb.mie[vm.sk] = []); l[n] = v; cb.mieT = Date.now();
        try { inp.blur(); } catch (e) {}
        cb.onIndizio(n, v); zonaScrivi();
      }
      inp.addEventListener("input", controllaHint);
      b.addEventListener("click", manda);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); manda(); } });
      if (cb.cambia === n) { cb.cambia = null; setTimeout(function () { try { inp.focus(); } catch (e) {} }, 30); }
      return el("div", { class: "up-rigainp" }, [el("div", { class: "up-riga" }, [inp, b]), hint]);
    }
    function agg(v) {
      vm = v;
      var sg = segOk(cb, v);
      if (ruolo !== "indovina") setTx(pal.w, parolaPer(cb, v, "…"));
      slots.forEach(function (s, i) {
        var fatto = (v.scritto && v.scritto[s.id] || 0) > s.n;
        setCarta(carte[i], { stato: fatto ? "fatta" : "coperta", w: fatto ? "✅" : "✍️", a: nomeVm(v, s.id, cb) });
      });
      zonaScrivi();
      // l'indizio non è arrivato all'host (rete saltata): lo rimando
      var l = mie().filter(Boolean).length;
      if (ruolo === "scrive" && l > (v.scritto && v.scritto[cb.myId] || 0) && Date.now() - (cb.mieT || 0) > 3000) {
        cb.mieT = Date.now(); mie().forEach(function (w, n) { if (w) cb.onIndizio(n, w); });
      }
    }
    agg(vm);
    return { agg: agg };
  };
  // 🔍 i quasi uguali: solo chi ha scritto vede tutti gli indizi e ne tocca due
  FASI.controllo = function (ui, vm, cb, ruolo) {
    var el = ui.t.el, sel = null, pal;
    var vede = ruolo !== "indovina";
    if (!vede) pal = parolaCarta(ui, "❓", "🔍 Gli altri controllano gli indizi…");
    else pal = parolaCarta(ui, "…", ruolo === "scrive" ? "🔍 Si somigliano? Tocca due indizi quasi uguali (pane e panino): si cancellano" : "🔍 Controllano gli indizi", true);
    var lista = vm.indizi || [];
    colonne(ui, lista.length);
    var carte = lista.map(function (x, i) { return nuovaCarta(ui, ruolo === "scrive" ? function () { tocca(i); } : null); });
    var conto = el("p", { class: "up-conto" }), tasto = null;
    if (ruolo === "scrive") {
      tasto = el("button", { class: "btn btn-primario up-ok", type: "button", text: "✅ Va bene così", onclick: function () {
        if (tasto.disabled) return; cb.okK = vm.k; tasto.disabled = true; setTx(tasto, "✅ Fatto · aspetto gli altri"); cb.onOk(vm.k);
      } });
      ui.azione.appendChild(tasto);
    }
    ui.azione.appendChild(conto);
    contoRip(ui, conto, vm, T_CONTROLLO, "ct", "🔍 Si va avanti tra ");
    function tocca(i) {
      var x = (cb.vm.indizi || [])[i]; if (!x) return;
      if (x.canc === "simile") { sel = null; cb.onRipristina(i, vm.k); tic(500); return; }
      if (x.canc) return;
      if (sel === null) { sel = i; agg(cb.vm); tic(800); return; }
      if (sel === i) { sel = null; agg(cb.vm); return; }
      var a = sel; sel = null; cb.onSimili(a, i, vm.k); tic(900); agg(cb.vm);
    }
    function agg(v) {
      vm = v;
      var sg = segOk(cb, v), testi = sg && sg.testi;
      if (vede) setTx(pal.w, parolaPer(cb, v, "…"));
      (v.indizi || []).forEach(function (x, i) {
        if (!carte[i]) return;
        if (!vede || !testi) { setCarta(carte[i], { stato: "coperta", w: "🔍", a: nomeVm(v, x.id, cb) }); return; }
        var o = { stato: x.canc ? "canc" : "aperta", w: testi[i] || "", a: nomeVm(v, x.id, cb) + (x.canc === "nonvale" ? " · 🚫 non vale" : x.canc === "doppio" ? " · 💥 doppione" : x.canc === "simile" ? " · 🤝 simili" : ""),
          tocca: ruolo === "scrive" && (!x.canc || x.canc === "simile"), sel: sel === i };
        setCarta(carte[i], o);
      });
      if (tasto && (v.fattoCtrl || []).indexOf(cb.myId) >= 0 && !tasto.disabled) { tasto.disabled = true; setTx(tasto, "✅ Fatto · aspetto gli altri"); }
    }
    agg(vm);
    return { agg: agg };
  };
  // 🃏 gli indizi si girano uno alla volta
  FASI.svela = function (ui, vm, cb, ruolo) {
    var sg = segOk(cb, vm), nomeChi = nomeVm(vm, vm.chi, cb), pal;
    if (ruolo === "indovina") pal = parolaCarta(ui, "❓", "Ecco i tuoi indizi!");
    else pal = parolaCarta(ui, sg ? sg.parola : "🎯 " + nomeChi, sg ? "Ecco cosa vede " + nomeChi : "Ecco gli indizi per " + nomeChi, true);
    var lista = vm.indizi || [];
    colonne(ui, lista.length);
    var carte = lista.map(function (x) { var c = nuovaCarta(ui); setCarta(c, { stato: "coperta", w: "?", a: nomeVm(vm, x.id, cb) }); return c; });
    ui.azione.appendChild(ui.t.el("p", { class: "up-conto", text: lista.length ? "🃏 Si girano gli indizi…" : "😶 Nessun indizio!" }));
    var passo = vm.resta && vm.resta * 1000 < 500 + lista.length * 850 ? 300 : 850;   // (arrivato a metà: si girano più in fretta)
    giraTutte(ui, vm, cb, carte, lista, passo, null);
    return { agg: function (v) { vm = v; if (ruolo !== "indovina") { var s = segOk(cb, v); if (s) setTx(pal.w, s.parola); } } };
  };
  function carteAperte(ui, vm, cb, tutto, onTocco) {
    var lista = vm.indizi || [];
    colonne(ui, lista.length);
    return lista.map(function (x, i) {
      var c = nuovaCarta(ui, onTocco ? function () { onTocco(i); } : null);
      setCarta(c, infoCarta(vm, lista, x, cb, tutto));
      return c;
    });
  }
  // 🤔 chi indovina ha un tentativo solo (o passa)
  FASI.indovina = function (ui, vm, cb, ruolo) {
    var el = ui.t.el, nomeChi = nomeVm(vm, vm.chi, cb), sg = segOk(cb, vm), pal;
    if (ruolo === "indovina") pal = parolaCarta(ui, "❓", "Che parola è? Hai un tentativo solo", true);
    else pal = parolaCarta(ui, sg ? sg.parola : "🤔", "🤔 " + nomeChi + " ci pensa…", true);
    carteAperte(ui, vm, cb, false);
    var conto = el("p", { class: "up-conto" });
    if (ruolo === "indovina") {
      var mia = cb.risp && cb.risp.k === vm.k ? cb.risp : null;
      var inp = el("input", { type: "text", class: "up-input", maxlength: "24", placeholder: "La tua risposta", autocomplete: "off", autocapitalize: "characters", enterkeyhint: "send", spellcheck: "false" });
      var b = el("button", { class: "btn btn-primario up-invia", type: "button", text: "Rispondi" });
      var pas = el("button", { class: "btn btn-fantasma up-passo", type: "button", text: "🤷 Passo" });
      var detto = el("p", { class: "up-detto" });
      function manda(w) {
        if (cb.risp && cb.risp.k === vm.k) return;
        cb.risp = { k: vm.k, w: w, quando: Date.now() };
        try { inp.blur(); } catch (e) {}
        cb.onRisposta(w, vm.k); stato();
      }
      function stato() {
        var r = cb.risp && cb.risp.k === vm.k ? cb.risp : null;
        inp.disabled = b.disabled = pas.disabled = !!r;
        setTx(detto, r ? (r.w ? "🗣️ Hai detto «" + r.w + "»…" : "🤷 Hai passato…") : "");
      }
      b.addEventListener("click", function () { var w = inp.value.trim(); if (!w) { inp.focus(); return; } manda(w); });
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); var w = inp.value.trim(); if (w) manda(w); } });
      pas.addEventListener("click", function () { manda(null); });
      ui.azione.appendChild(el("div", { class: "up-riga" }, [inp, b]));
      ui.azione.appendChild(el("div", { class: "up-riga" }, [pas, detto]));
      if (mia) stato();
    }
    ui.azione.appendChild(conto);
    contoRip(ui, conto, vm, T_INDOVINA, "in", "⏱ Mancano ");
    return { agg: function (v) {
      vm = v;
      if (ruolo !== "indovina") { var s = segOk(cb, v); if (s) setTx(pal.w, s.parola); }
      // la risposta non è arrivata (rete saltata): la rimando
      if (ruolo === "indovina" && cb.risp && cb.risp.k === v.k && Date.now() - cb.risp.quando > 3000) { cb.risp.quando = Date.now(); cb.onRisposta(cb.risp.w, v.k); }
    } };
  };
  // 🥁 la risposta, con un attimo di suspense
  FASI.risposta = function (ui, vm, cb, ruolo) {
    var el = ui.t.el, nomeChi = ruolo === "indovina" ? "Tu" : nomeVm(vm, vm.chi, cb);
    ui.palco.classList.add("suspense");
    var bolla = el("div", { class: "up-bolla", text: vm.passato ? (vm.saltato ? "📶 Turno saltato" : "🤷 " + (ruolo === "indovina" ? "Hai passato" : nomeChi + " passa")) : "🗣️ «" + (vm.risposta || "") + "»" });
    var esito = el("div", { class: "up-verdetto" });
    var w = el("div", { class: "up-parola piccola nascosta", text: vm.parola || "" });
    ui.palco.appendChild(el("div", { class: "up-sotto", text: vm.passato ? "" : (ruolo === "indovina" ? "Hai detto:" : nomeChi + " dice:") }));
    ui.palco.appendChild(bolla); ui.palco.appendChild(esito); ui.palco.appendChild(w);
    carteAperte(ui, vm, cb, false);
    if (!vm.passato) rullo();
    dopoUi(ui, vm.passato ? 500 : 1500, function () {
      setTx(esito, vm.giusta ? "✅ Giusto!" : vm.passato ? "La parola era:" : "❌ No! Era:");
      esito.className = "up-verdetto " + (vm.giusta ? "si" : "no");
      w.classList.remove("nascosta");
      if (vm.giusta) { fanfara(true); vibra(40); } else if (!vm.passato) fanfara(false);
    });
    return { agg: function () {} };
  };
  // ⭐ chi ha indovinato sceglie l'indizio che l'ha aiutato di più
  FASI.stella = function (ui, vm, cb, ruolo) {
    var el = ui.t.el, scelto = null;
    parolaCarta(ui, "✅ " + (vm.parola || ""), ruolo === "indovina" ? "⭐ Quale indizio ti ha aiutato di più? Toccalo: +2 a chi l'ha scritto" : "⭐ " + nomeVm(vm, vm.chi, cb) + " sceglie l'indizio migliore…", true);
    var lista = vm.indizi || [];
    var carte = carteAperte(ui, vm, cb, false, ruolo === "indovina" ? function (i) {
      if (scelto !== null || !lista[i] || lista[i].canc) return;
      scelto = i; cb.stellaK = { k: vm.k, i: i, quando: Date.now() };
      setCarta(carte[i], Object.assign(infoCarta(vm, lista, lista[i], cb, false), { stella: true, b: "⭐" }));
      vibra(25); cb.onStella(i, vm.k);
    } : null);
    if (ruolo === "indovina") lista.forEach(function (x, i) { if (!x.canc) carte[i].classList.add("tocca"); });
    var conto = el("p", { class: "up-conto" });
    ui.azione.appendChild(conto);
    contoRip(ui, conto, vm, T_STELLA, "st", "⭐ Si va avanti tra ");
    return { agg: function (v) {
      if (ruolo === "indovina" && cb.stellaK && cb.stellaK.k === v.k && Date.now() - cb.stellaK.quando > 3000) { cb.stellaK.quando = Date.now(); cb.onStella(cb.stellaK.i, v.k); }
    } };
  };
  // 📋 com'è andata: la parola, tutti gli indizi (anche quelli cancellati) e i punti; «⏩ Avanti» a maggioranza
  FASI.esito = function (ui, vm, cb, ruolo) {
    var el = ui.t.el, coop = vm.stile === "insieme", nomeChi = nomeVm(vm, vm.chi, cb), tu = ruolo === "indovina";
    var testa = vm.saltato ? "📶 " + nomeChi + " è uscito: turno saltato" : vm.giusta ? "✅ " + (tu ? "Hai indovinato!" : nomeChi + " ha indovinato!")
      : vm.passato ? "🤷 " + (tu ? "Hai passato" : nomeChi + " ha passato") : "❌ " + (tu ? "Hai detto" : nomeChi + " ha detto") + " «" + (vm.risposta || "") + "»";
    var sotto = coop ? "🤝 Squadra: " + vm.coop.punti + " punti · " + Math.max(0, vm.coop.tot - vm.coop.fatte) + " parole rimaste" + (vm.persa ? " · 💸 persa anche «" + vm.persa + "»" : "")
      : vm.giusta ? "+3 a " + (tu ? "te" : nomeChi) + " · +1 a ogni indizio rimasto" + (vm.stella != null ? " · ⭐ +2" : "") : "Nessun punto questa volta";
    ui.palco.appendChild(el("div", { class: "up-testa " + (vm.giusta ? "si" : "no"), text: testa }));
    parolaCarta(ui, vm.parola || "", sotto, true);
    var lista = vm.indizi || [], pt = vm.punteggi || {};
    var carte = carteAperte(ui, vm, cb, true);
    lista.forEach(function (x, i) {
      var st = vm.stella === i, b = !coop && vm.giusta && !x.canc ? "+1" + (st ? " ⭐+2" : "") : "";
      setCarta(carte[i], Object.assign(infoCarta(vm, lista, x, cb, true), { stella: st, b: b }));
    });
    if (vm.stella != null && lista[vm.stella] && (lista[vm.stella].id === cb.myId || tu)) { vibra(30); fanfara(true); }
    var me = trova(vm, cb.myId), tasto = null;
    if (me && !me.via) {
      var tx = el("span", { class: "tx", text: "⏩ Avanti" }), qq = el("span", { class: "quanti" });
      tasto = el("button", { class: "btn btn-primario up-ok", type: "button", onclick: function () {
        if (tasto.disabled) return; cb.prontoK = vm.k; agg(cb.vm); cb.onAvanti(vm.k);
      } }, [tx, qq]);
      tasto._tx = tx; tasto._q = qq;
      ui.azione.appendChild(tasto);
    }
    var conto = el("p", { class: "up-conto" });
    ui.azione.appendChild(conto);
    contoRip(ui, conto, vm, T_ESITO, "es");
    function agg(v) {
      if (!tasto) return;
      var l = v.pronti || [], mio = cb.prontoK === v.k || l.indexOf(cb.myId) >= 0, n = l.length + (mio && l.indexOf(cb.myId) < 0 ? 1 : 0);
      setTx(tasto._q, " · " + Math.min(n, v.servono || 1) + " su " + (v.servono || 1));
      setTx(tasto._tx, mio ? "✅ Pronto" : "⏩ Avanti");
      tasto.disabled = mio;
    }
    agg(vm);
    return { agg: agg };
  };

  function setTx(n, tx) { if (n && n.textContent !== tx) n.textContent = tx; }
  function avviso(testo) {
    if (!UI || !testo) return;
    UI.avviso.textContent = testo; UI.avviso.classList.remove("su"); void UI.avviso.offsetWidth; UI.avviso.classList.add("su");
  }
  // medaglie a pari merito: oro, oro, poi argento (posti 1, 1, 3 → 🥇🥇🥈)
  function medaglie(posti) {
    var gruppi = 0, prec = null;
    return posti.map(function (p) { if (p !== prec) { gruppi++; prec = p; } return ["🥇", "🥈", "🥉"][gruppi - 1] || p + "°"; });
  }
  function finale(t, vm, cb) {
    var coop = vm.stile === "insieme", cl = vm.classifica || [];
    var s = t.schermata(coop ? { icona: "🤝", titolo: (cl[0] ? cl[0].punti : 0) + " su " + CARTE_COOP, sotto: fraseCoop(cl[0] ? cl[0].punti : 0) } : { icona: "🏆", titolo: "Classifica finale" });
    var targa = !!t.guarda && !t.eliminazione, fac = targa ? null : t.faccine();
    if (targa) s.classList.add("up-fine-targa");
    var fitta = cl.length > 6 || cl.length * 71 + 300 + (fac ? 56 : 0) > (window.innerHeight || 640);
    var ol = t.el("ol", { class: "classifica" + (fitta ? " fitta" : "") }), med = medaglie(cl.map(function (r) { return r.pos; }));
    cl.forEach(function (r, i) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: coop ? "🤝" : med[i] }),
        t.el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        coop ? null : t.el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    var io = cl.filter(function (r) { return r.id === cb.myId; })[0];
    if (!io) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
    else if (io.pos === 1) { vibra(60); fanfara(true); }
    // I TASTI DI FINE LI METTE IL CORE (t.tastiFine); se torna false, quelli di sempre
    if (!t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci })) {
      if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }));
      else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: targa ? "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." : "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      if (!targa) s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci }));
    }
    t.mostra(s);
    return s;
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function erroreRete(t, testo, riprova) {
    var s = t.schermata({ icona: "📶", titolo: "Niente rete?", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo + " Controlla la connessione e riprova." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "↻ Riprova", onclick: riprova }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  // la scena a tutto schermo (uguale online e sullo stesso telefono): barra, palco, carte, azione, faccine, punti
  function scena(t, opz) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("up-piena");
    var ui = { t: t, s: s, info: el("div", { class: "up-info" }), palco: el("div", { class: "up-palco" }), carte: el("div", { class: "up-carte" }),
      azione: el("div", { class: "up-azione" }), fac: el("div", { class: "up-fac" }), punti: el("div", { class: "up-punti" }), avviso: el("div", { class: "up-avviso" }),
      chip: {}, timers: [], faccine: null, targa: !!opz.targa };
    var esci = el("button", { class: "up-esci", type: "button", "aria-label": "Esci", text: "‹", onclick: opz.esci });
    ui.fac.style.display = "none";
    s._contenuto.appendChild(el("div", { class: "up-scena" + (ui.targa ? " up-con-targa" : "") }, [el("div", { class: "up-barra" }, [esci, ui.info]), ui.palco, ui.carte, ui.azione, ui.fac, ui.punti, ui.avviso]));
    t.mostra(s);
    return ui;
  }

  // =========================================================
  //  SULLO STESSO TELEFONO: ci si passa il telefono («Luca, non guardare!»)
  // =========================================================
  function locale(t) {
    var st = { R: regoleDa(t.impostazioni), g: t.giocatori.map(function (n) { return { nome: n, punti: 0, piu: 0 }; }),
      giro: 1, fatti: [], turno: 0, coop: { fatte: 0, punti: 0 }, usate: [] };
    var esci = function () { t.conferma("Uscire dalla partita?", "I punti di questa partita si perdono.", "Esci", t.esci); };
    function chipsL(ui) {
      st.g.forEach(function (p, i) {
        ui.punti.appendChild(t.el("div", { class: "up-chip" + (i === st.chi ? " chi" : "") + (p.piu ? " piu" : ""),
          text: (i === st.chi ? "🎯 " : "") + p.nome + (st.R.stile === "insieme" ? "" : " " + fmtN(p.punti)) + (p.piu ? " +" + p.piu : "") }));
      });
    }
    function infoL() {
      return st.R.stile === "insieme" ? "🤝 Parola " + Math.min(CARTE_COOP, st.coop.fatte + 1) + " di " + CARTE_COOP + " · ⭐ " + st.coop.punti
        : "Giro " + st.giro + " di " + st.R.giri;
    }
    function nuovaScena() { var ui = scena(t, { esci: esci }); ui.cb = null; ui.kFase = "loc" + Math.random(); UI = ui; setTx(ui.info, infoL()); chipsL(ui); return ui; }
    function tasto(ui, testo, fn, classe) {
      var nato = Date.now(), b = t.el("button", { class: "btn " + (classe || "btn-primario"), type: "button", text: testo, onclick: function () { if (Date.now() - nato < 450) return; fn(); } });
      ui.azione.appendChild(b); return b;
    }
    function prossimo() {
      for (var guard = 0; guard < 10; guard++) {
        for (var i = 0; i < st.g.length; i++) if (st.fatti.indexOf(i) < 0) return i;
        if (st.R.stile !== "insieme" && st.giro >= st.R.giri) return -1;
        if (st.R.stile !== "insieme") st.giro++;
        st.fatti = [];
      }
      return -1;
    }
    function turno() {
      if (st.R.stile === "insieme" && st.coop.fatte >= CARTE_COOP) return fineL();
      var chi = prossimo(); if (chi < 0) return fineL();
      st.turno++; st.chi = chi;
      st.scrittori = st.g.map(function (p, i) { return i; }).filter(function (i) { return i !== chi; });
      st.doppio = st.scrittori.length === 2;
      st.parola = pesca(st.R, st.usate); st.cor = {}; st.indizi = []; st.coppie = []; st.stella = null;
      st.g.forEach(function (p) { p.piu = 0; });
      var ui = nuovaScena(), nc = st.g[chi].nome;
      ui.palco.classList.add("centro");
      ui.palco.appendChild(t.el("div", { class: "up-emoji", text: "☝️" }));
      parolaCarta(ui, "🎯 " + nc, "Tocca a " + nc + " indovinare! " + nc + ", non guardare: gli altri scrivono " + (st.doppio ? "due indizi a testa" : "un indizio a testa") + ", una parola sola.");
      tasto(ui, "✍️ Si comincia a scrivere ▶", function () { scriviL(0); });
    }
    function passaL(nome, nota, poi) {
      var ui = nuovaScena();
      ui.palco.classList.add("centro");
      ui.palco.appendChild(t.el("div", { class: "up-emoji", text: "🤝" }));
      ui.palco.appendChild(t.el("div", { class: "up-sotto", text: "Passa il telefono a" }));
      ui.palco.appendChild(t.el("div", { class: "up-parola", text: nome }));
      ui.palco.appendChild(t.el("div", { class: "up-sotto forte", text: nota }));
      tasto(ui, "Sono " + nome + " ▶", poi);
    }
    function scriviL(k) {
      if (k >= st.scrittori.length) return dopoScritti();
      var i = st.scrittori[k], nc = st.g[st.chi].nome;
      passaL(st.g[i].nome, "🙈 " + nc + ", non guardare!", function () { schermoScrivi(k, i); });
    }
    function schermoScrivi(k, i) {
      var ui = nuovaScena(), el = t.el, q = st.doppio ? 2 : 1, nc = st.g[st.chi].nome, inps = [];
      ui.palco.classList.add("centro");
      parolaCarta(ui, st.parola, st.doppio ? "Scrivi DUE indizi per " + nc + " (una parola ciascuno)" : "Scrivi un indizio per " + nc + ": una parola sola");
      for (var n = 0; n < q; n++) (function (n) {
        var inp = el("input", { type: "text", class: "up-input", maxlength: String(LUNGO), placeholder: q > 1 ? (n ? "Secondo indizio" : "Primo indizio") : "Il tuo indizio", autocomplete: "off", autocapitalize: "characters", spellcheck: "false" });
        var hint = el("div", { class: "up-hint" });
        inp.addEventListener("input", function () { var v = inp.value.trim(); setTx(hint, !v ? "" : !unaParola(v) ? "☝️ Una parola sola, senza spazi" : nonVale(v, st.parola) ? "⚠️ Contiene la parola: verrà cancellato" : ""); });
        inps.push(inp);
        ui.azione.appendChild(el("div", { class: "up-rigainp" }, [el("div", { class: "up-riga" }, [inp]), hint]));
      })(n);
      tasto(ui, "Fatto ▶", function () {
        var l = inps.map(function (x) { return pulisci(x.value); });
        if (l.some(function (w) { return w && !unaParola(w); })) { avviso("☝️ Una parola sola!"); vibra(30); return; }
        if (!l.some(Boolean)) { avviso("✍️ Scrivi un indizio (o tocca «Non mi viene niente»)"); return; }
        st.cor[i] = l; scriviL(k + 1);
      });
      tasto(ui, "🤷 Non mi viene niente", function () { st.cor[i] = []; scriviL(k + 1); }, "btn-fantasma");
    }
    function dopoScritti() {
      st.indizi = [];
      st.scrittori.forEach(function (i) { (st.cor[i] || []).forEach(function (w, n) { if (w) st.indizi.push({ id: i, n: n, testo: w }); }); });
      cancellaDaSoli(st.indizi, st.parola);
      var nc = st.g[st.chi].nome;
      if (st.indizi.filter(function (x) { return !x.canc; }).length < 2) return passaL(nc, "👀 Ora puoi guardare!", svelaL);
      // l'ultimo che ha scritto controlla i quasi uguali (pane e panino)
      var ui = nuovaScena(), sel = null;
      parolaCarta(ui, st.parola, "🔍 Ci sono indizi quasi uguali (pane e panino)? Tocca i due: si cancellano. Poi passa il telefono a " + nc, true);
      colonne(ui, st.indizi.length);
      var carte = st.indizi.map(function (x, i) { return nuovaCarta(ui, function () { tocca(i); }); });
      function tocca(i) {
        var x = st.indizi[i];
        if (x.canc === "simile") { st.coppie = st.coppie.filter(function (c) { return c[0] !== i && c[1] !== i; }); applicaSimili(st.indizi, st.coppie); sel = null; return disegnaC(); }
        if (x.canc) return;
        if (sel === null || sel === i) { sel = sel === i ? null : i; return disegnaC(); }
        st.coppie.push([sel, i]); sel = null; applicaSimili(st.indizi, st.coppie); tic(900); disegnaC();
      }
      function disegnaC() {
        st.indizi.forEach(function (x, i) {
          setCarta(carte[i], { stato: x.canc ? "canc" : "aperta", w: x.testo, a: st.g[x.id].nome + (x.canc === "nonvale" ? " · 🚫 non vale" : x.canc === "doppio" ? " · 💥 doppione" : x.canc === "simile" ? " · 🤝 simili" : ""),
            tocca: !x.canc || x.canc === "simile", sel: sel === i });
        });
      }
      disegnaC();
      tasto(ui, "✅ Fatto ▶", function () { passaL(nc, "👀 Ora puoi guardare!", svelaL); });
    }
    function vmL() {   // (le carte locali col disegno dell'online)
      return { indizi: st.indizi, players: st.g.map(function (p, i) { return { id: i, nome: p.nome }; }) };
    }
    function svelaL() {
      var ui = nuovaScena(), el = t.el, v = vmL();
      parolaCarta(ui, "❓", "Ecco i tuoi indizi!", true);
      colonne(ui, st.indizi.length);
      var carte = st.indizi.map(function (x) { var c = nuovaCarta(ui); setCarta(c, { stato: "coperta", w: "?", a: st.g[x.id].nome }); return c; });
      var nota = el("p", { class: "up-conto", text: st.indizi.length ? "🃏 Si girano gli indizi…" : "😶 Nessun indizio!" });
      ui.azione.appendChild(nota);
      giraTutte(ui, v, null, carte, st.indizi, 850, function () {
        ui.t.svuota(ui.azione);
        setTx(ui.palco.children[1], "Che parola è? Hai un tentativo solo");
        var inp = el("input", { type: "text", class: "up-input", maxlength: "24", placeholder: "La tua risposta", autocomplete: "off", autocapitalize: "characters", spellcheck: "false" });
        var b = el("button", { class: "btn btn-primario up-invia", type: "button", text: "Rispondi" });
        var fatto = false;
        function manda(w) { if (fatto) return; fatto = true; try { inp.blur(); } catch (e) {} rispostaL(w); }
        b.addEventListener("click", function () { var w = inp.value.trim(); if (!w) { inp.focus(); return; } manda(w); });
        inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); var w = inp.value.trim(); if (w) manda(w); } });
        ui.azione.appendChild(el("div", { class: "up-riga" }, [inp, b]));
        tasto(ui, "🤷 Passo", function () { manda(null); }, "btn-fantasma");
      });
    }
    function rispostaL(w) {
      st.risposta = w ? pulisci(w) : null; st.passato = !w; st.giusta = !!w && giusta(w, st.parola);
      var ui = nuovaScena(), v = vmL();
      // la stessa suspense dell'online
      ui.kFase = "locR" + st.turno;
      FASI.risposta(ui, { passato: st.passato, saltato: false, risposta: st.risposta, giusta: st.giusta, parola: st.parola, indizi: st.indizi, players: v.players, chi: st.chi }, { myId: -1 }, "indovina");
      var validi = []; st.indizi.forEach(function (x, i) { if (!x.canc) validi.push(i); });
      dopoUi(ui, (st.passato ? 500 : 1500) + 1400, function () {
        if (st.R.stile !== "insieme" && st.giusta && validi.length >= 2) return stellaL();
        if (st.R.stile !== "insieme" && st.giusta && validi.length === 1) st.stella = validi[0];
        esitoL();
      });
    }
    function stellaL() {
      var ui = nuovaScena(), v = vmL();
      parolaCarta(ui, "✅ " + st.parola, "⭐ Quale indizio ti ha aiutato di più? Toccalo: +2 a chi l'ha scritto", true);
      var carte = carteAperte(ui, v, { myId: -1 }, false, function (i) {
        if (st.indizi[i].canc || st.stella != null) return;
        st.stella = i; carte[i].classList.add("stella"); vibra(25);
        setTimeout(esitoL, 500);
      });
      st.indizi.forEach(function (x, i) { if (!x.canc) carte[i].classList.add("tocca"); });
      tasto(ui, "Nessuna stella ▶", esitoL, "btn-fantasma");
    }
    function esitoL() {
      if (st.R.stile === "insieme") {
        var c = coopPasso(st.coop, st.giusta ? "giusta" : st.passato ? "passo" : "sbagliata");
        st.coop = { fatte: c.fatte, punti: c.punti }; st.persa = c.persa ? pesca(st.R, st.usate) : null;
      } else {
        var pt = puntiTurno({ giusta: st.giusta, chi: st.chi, indizi: st.indizi, stella: st.stella });
        st.g.forEach(function (p, i) { p.piu = pt[i] || 0; p.punti += p.piu; });
      }
      if (st.fatti.indexOf(st.chi) < 0) st.fatti.push(st.chi);
      var ui = nuovaScena(), v = vmL();
      UI.kFase = "locE" + st.turno;
      FASI.esito(ui, Object.assign(v, { stile: st.R.stile, chi: st.chi, saltato: false, giusta: st.giusta, passato: st.passato, risposta: st.risposta, parola: st.parola,
        coop: { fatte: st.coop.fatte, punti: st.coop.punti, tot: CARTE_COOP }, persa: st.persa, stella: st.stella, punteggi: null, k: "l", resta: 0 }), { myId: -1 }, "guarda");
      ui.t.svuota(ui.azione);
      tasto(ui, "Avanti ▶", turno);
    }
    function fineL() {
      if (st.R.stile === "insieme") {
        var p = st.coop.punti;
        var ui = nuovaScena();
        ui.palco.classList.add("centro");
        ui.palco.appendChild(t.el("div", { class: "up-emoji", text: p >= 9 ? "🏆" : "🤝" }));
        parolaCarta(ui, p + " su " + CARTE_COOP, fraseCoop(p));
        if (p >= 9) { vibra(60); fanfara(true); }
        tasto(ui, "Fine partita ▶", function () { t.fine(st.g.map(function (x) { return { nome: x.nome, punti: p, pos: 1 }; })); });
        return;
      }
      var ord = st.g.slice().sort(function (a, b) { return b.punti - a.punti; });
      vibra(60);
      t.fine(ord.map(function (x) { return { nome: x.nome, punti: x.punti, pos: 1 + ord.filter(function (q) { return q.punti > x.punti; }).length }; }));
    }
    turno();
  }

  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      // 🤍 Bianco e oro: il gioco è tutto chiaro (tema: "oro"); i colori stanno solo nelle variabili --o-*.
      // La parola misteriosa è un cartiglio avorio col doppio filetto oro; le carte degli indizi sono avorio, tutte con il filetto oro:
      // crema se ancora coperte, bianche con la parola in carattere elegante quando sono girate.
      ".schermata.up-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:transparent;color:var(--o-testo)}",
      ".schermata.up-piena>.testa,.schermata.up-piena>.piede{display:none}",
      ".schermata.up-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".up-scena{position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 12px calc(10px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".up-barra{display:flex;align-items:center;gap:8px;font-weight:700;font-size:.88rem;flex:none}",
      ".up-esci{flex:none;width:36px;height:36px;border-radius:50%;border:0;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra);font:inherit;font-size:1.3rem;font-weight:700;cursor:pointer}",
      ".up-info{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--o-tenue)}",
      ".up-palco{flex:none;display:flex;flex-direction:column;align-items:center;gap:5px;text-align:center}",
      ".up-palco.centro{flex:1 1 auto;min-height:0;justify-content:center;gap:10px}.up-palco.centro .up-parola{font-size:clamp(2rem,11vw,3rem)}.up-palco.centro .up-sotto{font-size:.95rem}",
      ".up-emoji{font-size:3.2rem;line-height:1;animation:upPop .4s ease}",
      ".up-parola{position:relative;max-width:100%;box-sizing:border-box;background:var(--o-carta-viva);color:var(--o-testo);border-radius:16px;padding:10px 24px;font-family:var(--o-tit);font-size:clamp(1.7rem,9vw,2.6rem);font-weight:700;letter-spacing:.07em;line-height:1.1;box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra-alta);overflow-wrap:anywhere;transition:opacity .3s,transform .3s}",
      ".up-parola::before{content:'';position:absolute;inset:4px;border:1px solid var(--o-oro-chiaro);border-radius:12px;pointer-events:none}",
      ".up-parola.piccola{font-size:clamp(1.3rem,6.8vw,1.85rem);padding:7px 18px;border-radius:14px;box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra)}.up-parola.piccola::before{inset:3px;border-radius:11px}",
      ".up-parola.nascosta{opacity:0;transform:scale(.7)}",
      ".up-sotto{font-size:.86rem;font-weight:600;color:var(--o-tenue);line-height:1.3;max-width:34em}.up-sotto.forte{font-size:1.05rem;font-weight:700;color:var(--o-oro-testo)}",
      ".up-testa{font-size:1.05rem;font-weight:800}.up-testa.si{color:var(--o-verde)}.up-testa.no{color:var(--o-rosso)}",
      ".up-bolla{background:var(--o-carta);color:var(--o-testo);border-radius:18px;padding:8px 18px;box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra);font-family:var(--o-tit);font-size:clamp(1.4rem,7.5vw,1.95rem);font-weight:700;animation:upPop .35s ease}",
      ".up-verdetto{min-height:1.4em;font-size:1.25rem;font-weight:800}.up-verdetto.si{color:var(--o-verde);animation:upPop .4s ease}.up-verdetto.no{color:var(--o-rosso);animation:upPop .4s ease}",
      ".up-carte{flex:1 1 auto;min-height:0;display:grid;grid-template-columns:repeat(var(--col,2),minmax(0,1fr));gap:8px;align-content:center;overflow:hidden;box-sizing:border-box;margin:0 -5px;padding:9px 5px 0}",   // (il padding lascia vedere i bollini +1 e ⭐ sul bordo delle carte)
      ".up-carta{position:relative;box-sizing:border-box;min-height:56px;max-height:92px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:6px 5px;text-align:center;touch-action:manipulation;-webkit-tap-highlight-color:transparent}",
      ".up-carte.tante .up-carta{min-height:48px}.up-palco.centro~.up-carte:empty{display:none}",
      ".up-carta .w{font-weight:800;font-size:1.02rem;line-height:1.1;overflow-wrap:anywhere;text-transform:uppercase}",
      ".up-carta .a{font-size:.7rem;font-weight:650;opacity:.85;margin-top:3px;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".up-carta .b{position:absolute;top:-7px;right:-4px;font-size:.72rem;font-weight:800;background:var(--o-tasto);color:var(--o-tasto-testo);border-radius:999px;padding:1px 6px;box-shadow:0 1px 3px rgba(62,55,42,.25)}.up-carta .b:empty{display:none}",
      ".up-carta.coperta{background:var(--o-crema);color:var(--o-oro-testo);box-shadow:inset 0 0 0 1px var(--o-oro),var(--o-ombra)}",
      ".up-carta.coperta::before{content:'';position:absolute;inset:3px;border:1px solid var(--o-oro-chiaro);border-radius:10px;pointer-events:none}",
      ".up-carta.fatta{background:var(--o-verde-tenue);color:var(--o-verde);box-shadow:inset 0 0 0 1px var(--o-verde)}",
      ".up-carta.aperta{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra)}.up-carta.aperta .w{font-family:var(--o-tit);font-size:1.18rem;font-weight:700;letter-spacing:.05em}.up-carta.aperta .a{color:var(--o-tenue)}",
      ".up-carta.canc{background:var(--o-fondo-2);color:var(--o-tenue);box-shadow:inset 0 0 0 1px var(--o-filo)}.up-carta.canc .w{text-decoration:line-through;opacity:.8}",
      ".up-carta.tocca{cursor:pointer}.up-carta.sel,.up-carta.stella{background:var(--o-carta-viva);box-shadow:inset 0 0 0 2.5px var(--o-oro),var(--o-ombra)}",
      ".up-carta.gira{animation:upGira .42s ease}.up-carta.boom::after{content:'💥';position:absolute;left:50%;top:50%;font-size:2.4rem;pointer-events:none;animation:upBoom .7s ease forwards}",
      "@keyframes upGira{0%{transform:scaleX(1)}45%{transform:scaleX(0)}100%{transform:scaleX(1)}}",
      "@keyframes upBoom{0%{transform:translate(-50%,-50%) scale(.3);opacity:0}30%{transform:translate(-50%,-50%) scale(1.4);opacity:1}100%{transform:translate(-50%,-50%) scale(1.9);opacity:0}}",
      "@keyframes upPop{0%{transform:scale(.6);opacity:0}70%{transform:scale(1.08);opacity:1}100%{transform:scale(1)}}",
      ".up-azione{flex:none;display:flex;flex-direction:column;gap:6px}",
      ".up-zona{display:flex;flex-direction:column;gap:6px}.up-rigainp{display:flex;flex-direction:column;gap:2px}",
      ".up-riga{display:flex;gap:8px;align-items:center}",
      ".up-input{flex:1;min-width:0;height:46px;box-sizing:border-box;border-radius:14px;border:1.5px solid var(--o-filo-oro);background:var(--o-carta);box-shadow:inset 0 1px 2px rgba(62,55,42,.05);color:var(--o-testo);font:inherit;font-size:1.1rem;font-weight:700;padding:0 12px;text-transform:uppercase}",
      ".up-input:focus{outline:none;border-color:var(--o-oro);box-shadow:0 0 0 3px rgba(197,151,41,.18)}.up-input:disabled{opacity:.5}",
      ".up-invia{width:auto;margin:0;flex:none;min-width:92px}.up-passo{width:auto;margin:0;flex:none}.up-ok{margin:0}",
      ".up-hint{min-height:1em;font-size:.75rem;font-weight:700;color:var(--o-ambra);padding-left:4px}",
      ".up-fatto{display:flex;align-items:center;justify-content:space-between;gap:8px;background:var(--o-verde-tenue);color:var(--o-verde);border-radius:12px;padding:8px 10px;font-weight:800}",
      ".up-cambia{border:0;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro);font:inherit;font-weight:700;border-radius:10px;padding:6px 10px;cursor:pointer}",
      ".up-detto{margin:0;flex:1;font-weight:700;color:var(--o-tenue);text-align:center}",
      ".up-conto{margin:0;text-align:center;font-weight:700;color:var(--o-tenue);font-size:.88rem;min-height:1.2em}",
      ".up-fac{flex:none;display:flex;justify-content:center}",
      ".up-punti{flex:none;display:flex;flex-wrap:wrap;gap:5px;justify-content:center}",
      ".up-chip{padding:4px 9px;border-radius:999px;background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo);font-weight:700;font-size:.76rem;transition:background .3s}",
      ".up-chip.chi{background:var(--o-scuro);color:var(--o-scuro-testo);box-shadow:none}.up-chip.piu{background:var(--o-verde);color:#fff;box-shadow:none}.up-chip.via{opacity:.45}",
      ".up-avviso{position:absolute;left:12px;right:12px;top:30%;box-sizing:border-box;padding:10px 12px;border-radius:16px;background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra-alta);text-align:center;font-weight:800;font-size:1.1rem;color:var(--o-oro-testo);opacity:0;pointer-events:none}",
      ".up-avviso.su{animation:upAvviso 1.9s ease}",
      "@keyframes upAvviso{0%{opacity:0;transform:scale(.8)}12%{opacity:1;transform:scale(1.06)}80%{opacity:1}100%{opacity:0}}",
      ".up-scena.up-con-targa{padding-bottom:calc(62px + env(safe-area-inset-bottom))}",
      ".schermata.up-fine-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
      "@media (max-height:680px){.up-parola{font-size:clamp(1.3rem,7vw,1.9rem);padding:8px 16px}.up-carta{min-height:46px}.up-sotto{font-size:.8rem}.up-input{height:42px}}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Una parola sola", icona: "☝️", tema: "oro",   // 🤍 tutto il gioco è chiaro (Bianco e oro)
    descrizione: "Uno indovina, gli altri scrivono di nascosto un indizio di una parola sola. Ma gli indizi uguali si cancellano!",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono: chi indovina non guarda", amici: true, min: MIN }],
    postiOnline: MAX,
    ritardatari: RITARDATARI,
    riprende: true,
    riserva: true,
    riassunto: function (imp) {
      var r = regoleDa(imp), mz = r.mazzi.map(function (id) { var m = mazzoDi(id); return m ? m.icona + " " + m.nome : ""; }).filter(Boolean).join(", ");
      return (r.stile === "insieme" ? "🤝 Tutti insieme · " + CARTE_COOP + " parole" : "🏆 A punti · " + r.giri + (r.giri === 1 ? " giro" : " giri")) + " · " + mz;
    },
    regole: [
      "A turno uno di voi <b>indovina</b>. Gli altri vedono la parola misteriosa e scrivono <b>di nascosto</b> un indizio di <b>una parola sola</b> (in 3 giocatori, due a testa).",
      "Prima di mostrarli, gli indizi <b>uguali</b> si cancellano 💥 (anche al plurale: «gatto» e «gatti» sono uguali), e anche quelli che contengono la parola (per MARE, «marea» non vale). Poi chi ha scritto ha 15 secondi per cancellare i <b>quasi uguali</b> (pane e panino): tocca i due indizi.",
      "Gli indizi rimasti si girano uno alla volta. Chi indovina ha <b>un tentativo solo</b>, oppure tocca «Passo».",
      "<b>🏆 A punti</b>: risposta giusta <b>+3</b> a chi indovina e <b>+1</b> a ogni indizio rimasto. Poi chi ha indovinato dà la <b>⭐ stella</b> all'indizio che l'ha aiutato di più: <b>+2</b> a chi l'ha scritto. Sbagliata o Passo: nessun punto. Ognuno indovina lo stesso numero di volte (1, 2 o 3 giri).",
      "<b>🤝 Tutti insieme</b> (se l'host lo sceglie): siete una squadra sola e avete <b>13 parole</b>. Giusta +1; Passo = parola persa; sbagliata = si perde anche la parola dopo. Quante ne indovinate su 13?",
      "Sullo stesso telefono ve lo passate: chi indovina non guarda finché non tocca a lui."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el, r = regoleDa(Object.assign({}, leggi(CHIAVE_REGOLE) || {}, dove));
      dove.stile = r.stile; dove.giri = r.giri; dove.mazzi = r.mazzi.slice();
      function salva() { scrivi(CHIAVE_REGOLE, { stile: dove.stile, giri: dove.giri, mazzi: dove.mazzi }); }
      box.appendChild(el("div", { class: "etichetta", text: "Come si gioca" }));
      var gs = el("div", { class: "modo-griglia" }), bs = {};
      [["punti", "🏆", "A punti", "Chi indovina +3, gli indizi buoni +1, la ⭐ +2"], ["insieme", "🤝", "Tutti insieme", "Una squadra sola: quante parole su 13?"]].forEach(function (o) {
        var b = bs[o[0]] = el("button", { class: "modo-chip", type: "button", onclick: function () { dove.stile = o[0]; aggiorna(); salva(); } },
          [el("span", { class: "mi", text: o[1] }), el("div", {}, [el("div", { class: "mt", text: o[2] }), el("div", { class: "ms", text: o[3] })])]);
        gs.appendChild(b);
      });
      box.appendChild(gs);
      var etG = el("div", { class: "etichetta", text: "Quante volte indovina ognuno" });
      var gg = el("div", { class: "modo-griglia", style: "display:grid;grid-template-columns:repeat(3,1fr)" }), bg = {};
      [1, 2, 3].forEach(function (n) {
        var b = bg[n] = el("button", { class: "modo-chip", type: "button", style: "justify-content:center", onclick: function () { dove.giri = n; aggiorna(); salva(); } },
          [el("div", { class: "mt", text: n + (n === 1 ? " volta" : " volte") })]);
        gg.appendChild(b);
      });
      box.appendChild(etG); box.appendChild(gg);
      box.appendChild(el("div", { class: "etichetta", text: "Le parole" }));
      var gm = el("div", { style: "display:flex;flex-wrap:wrap;gap:8px" }), bm = {};
      mazzi().forEach(function (m) {
        var n = paroleDi(m.id).length;
        var b = bm[m.id] = el("button", { class: "cat-chip", type: "button", onclick: function () {
          var i = dove.mazzi.indexOf(m.id);
          if (i >= 0) { if (dove.mazzi.length > 1) dove.mazzi.splice(i, 1); } else dove.mazzi.push(m.id);
          aggiorna(); salva();
        } }, [el("span", { text: m.icona }), el("span", { text: m.nome + " (" + fmtN(n) + ")" })]);
        gm.appendChild(b);
      });
      box.appendChild(gm);
      function aggiorna() {
        Object.keys(bs).forEach(function (k) { bs[k].className = "modo-chip" + (dove.stile === k ? " attiva" : ""); });
        Object.keys(bg).forEach(function (k) { bg[k].className = "modo-chip" + (dove.giri === +k ? " attiva" : ""); });
        Object.keys(bm).forEach(function (k) { bm[k].className = "cat-chip" + (dove.mazzi.indexOf(k) >= 0 ? " attiva" : ""); });
        etG.style.display = gg.style.display = dove.stile === "insieme" ? "none" : "";
      }
      aggiorna();
    },
    avvia: function (t) {
      if (!mazzi().length) {
        var s = t.schermata({ icona: "☝️", titolo: "Mancano le parole", indietro: t.esci });
        s._contenuto.appendChild(t.el("p", { text: "Le parole del gioco non sono state caricate." }));
        s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
        return t.mostra(s);
      }
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito (o dalla Sala)
      if (t.impostazioni && t.impostazioni.modo === "online") return host(t);
      locale(t);
    }
  });
})();

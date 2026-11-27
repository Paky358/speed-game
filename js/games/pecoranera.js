/* =========================================================
   🐑 PECORA NERA — il gioco del gregge (nome di lavoro «Holy Sheep»; il gioco di scatola più vicino è Herd Mentality),
   fatto dal modello dei giochi online.
   Tutti leggono la STESSA domanda («Una bibita estiva», «Se dico Gian, voi dite…») e scrivono di nascosto la risposta
   più scontata. Ognuno prende tanti punti quante persone (lui compreso) hanno scritto la sua stessa risposta: in 3
   uguali = 3 punti a testa; chi resta da solo 0. Vince il primo che arriva al traguardo.
   - Le risposte uguali le unisce il gioco da solo (maiuscole, accenti, articolo, plurale, numeri in lettere, piccoli
     errori). Due risposte che sono la stessa cosa («Coca» e «Coca-Cola»): chiunque gioca tocca le due carte e si
     uniscono; chiunque le può separare (✂️). Niente tempo: va avanti chi tiene la partita (deciso dal proprietario
     il 26 nov 2026: «l'host va avanti quanto vuole»).
   - La rivelazione: i gruppi escono uno alla volta in ORDINE A CASO, tutti con lo stesso tempo (regola anti-spoiler:
     dal più piccolo al più grande il primo saprebbe subito di essere da solo).
   - Il traguardo dipende da quanti si è e dalla durata scelta (traguardo()): in 3 si prendono pochi punti a domanda,
     in 10 tanti.
   - Arrivano in più al traguardo con la stessa domanda: vince chi ha più punti; a pari punti un'altra domanda.
   - Online (la priorità) e sullo stesso telefono passandoselo. Niente Bot.
   Le risposte NON passano mai nella foto prima della rivelazione: nella foto c'è solo CHI ha scritto.
   ========================================================= */
(function () {
  "use strict";

  var ID = "pecoranera";
  var MIN = 3, MAX = 10;
  var RESPIRO = 5;               // i secondi di respiro quando la partita riprende (gli amici intanto rientrano)
  var RITARDATARI = "turno";     // chi arriva a partita cominciata entra dalla domanda dopo, con 0 punti
  var PROVA = window.__PN_PROVA || {};   // (solo per le prove: { tempo, durata, domande: [...] })
  var T_SCRIVI = PROVA.tempo || 30;      // secondi per scrivere (si chiude prima se hanno scritto tutti)
  var GRAZIA = 1200;             // ms in più dopo la fine della barra: la risposta dell'ultimo istante arriva in tempo
  var T_INTRO = 1500, T_GRUPPO = 1150, T_CODA = 700;   // la rivelazione: uguale per ogni gruppo (anti-spoiler)
  var LUNGO = 30;                // lettere massime di una risposta
  var DURATE = { corta: 6, normale: 10, lunga: 15 };   // quante domande più o meno
  var PESO = 0.3;                // quanto si somigliano di solito le risposte (per il traguardo: punti medi = 1 + (n − 1) × PESO)
  var CHIAVE_USCITE = "sg-pecoranera-uscite";

  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function piccolo(o) { return o && typeof o === "object" && JSON.stringify(o).length <= 400 ? o : null; }   // (i gettoni: nella foto sempre)
  function leggi(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }
  function scrivi(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function rnd(n) { return Math.floor(Math.random() * n); }
  function mescola(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(i + 1), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p || 25); } catch (e) {} }
  function setTx(n, s) { if (n && n.textContent !== s) n.textContent = s; }
  function elenco(l) { return l.length < 2 ? l.join("") : l.slice(0, -1).join(", ") + " e " + l[l.length - 1]; }   // «Paky, Marco e Nina»

  // ---- suoni piccoli, col motore audio comune ----
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
  var FX = {
    pop: function (k) { nota(420 + 60 * Math.min(k, 8), 0.12, 0, "triangle", 0.09); nota(840 + 120 * Math.min(k, 8), 0.08, 0.05, "sine", 0.05); },
    rullo: function () { for (var i = 0; i < 6; i++) nota(140 + i * 8, 0.05, i * 0.07, "square", 0.03); },
    unisci: function () { nota(523, 0.09, 0, "sine", 0.08); nota(784, 0.12, 0.07, "sine", 0.08); },
    separa: function () { nota(600, 0.08, 0, "triangle", 0.07); nota(400, 0.1, 0.06, "triangle", 0.07); },
    invio: function () { nota(660, 0.07, 0, "sine", 0.07); nota(990, 0.09, 0.05, "sine", 0.06); },
    festa: function () { [523, 659, 784, 1046].forEach(function (f, i) { nota(f, 0.18, i * 0.11, "triangle", 0.09); }); }
  };

  // =========================================================
  //  LE REGOLE (senza grafica): quando due risposte sono uguali, i gruppi, i punti, il traguardo
  // =========================================================
  var NUMERI = { zero: 0, uno: 1, una: 1, due: 2, tre: 3, quattro: 4, cinque: 5, sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
    undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15, sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19,
    venti: 20, trenta: 30, quaranta: 40, cinquanta: 50, cento: 100, mille: 1000 };
  function norma(s) { return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim(); }
  // la forma che conta: senza maiuscole, accenti, spazi e segni, senza l'articolo davanti, coi numeri in cifre
  function chiave(s) {
    var w = norma(s);
    w = w.replace(/^(il|lo|la|i|gli|le|l|un|uno|una|del|dello|della|dei|degli|delle) (?=\S)/, "");
    if (Object.prototype.hasOwnProperty.call(NUMERI, w)) w = String(NUMERI[w]);
    return w.replace(/ /g, "");
  }
  // le forme al singolare (gatti → gatto, porte → porta, laghi → lago, arance → arancia)
  function forme(w) {
    var f = [w], b;
    function add(x) { if (x && f.indexOf(x) < 0) f.push(x); }
    if (w.length >= 3 && /i$/.test(w)) {
      b = w.slice(0, -1); add(b + "o"); add(b + "e"); add(b + "a"); add(b + "io");
      if (/[cg]hi$/.test(w)) add(w.slice(0, -2) + "o");
    }
    if (w.length >= 3 && /e$/.test(w)) {
      b = w.slice(0, -1);
      if (!/[cg]e$/.test(w)) add(b + "a");   // (mele → mela; ma «pesce» non è il plurale di «pesca»: -ca fa -che)
      if (/[cg]he$/.test(w)) add(w.slice(0, -2) + "a");
      if (/[cg]e$/.test(w)) add(b + "ia");
    }
    return f;
  }
  function stesseForme(a, b) { var fa = forme(a), fb = forme(b); return fa.some(function (x) { return !!x && fb.indexOf(x) >= 0; }); }
  // quante lettere cambiano tra due parole (si ferma a max + 1)
  function lev(a, b, max) {
    if (a === b) return 0;
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prec = [], i, j;
    for (j = 0; j <= b.length; j++) prec.push(j);
    for (i = 1; i <= a.length; i++) {
      var cur = [i], min = i;
      for (j = 1; j <= b.length; j++) {
        var v = Math.min(prec[j] + 1, cur[j - 1] + 1, prec[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        cur.push(v); if (v < min) min = v;
      }
      if (min > max) return max + 1;
      prec = cur;
    }
    return prec[b.length];
  }
  // due risposte uguali per il gioco: stessa forma, anche al plurale; dalle 6 lettere un errore di battitura, dalle 10 due
  function uguali(a, b) {
    var ka = chiave(a), kb = chiave(b);
    if (!ka || !kb) return false;
    if (ka === kb || stesseForme(ka, kb)) return true;
    if (ka.replace(/[^0-9]/g, "") !== kb.replace(/[^0-9]/g, "")) return false;   // (cifre diverse: mai uguali per un errore di battitura)
    var l = Math.min(ka.length, kb.length);
    if (l >= 10) return lev(ka, kb, 2) <= 2;
    if (l >= 6) return lev(ka, kb, 1) <= 1;
    return false;
  }
  function pulisci(s) { return String(s == null ? "" : s).replace(/\s+/g, " ").trim().slice(0, LUNGO); }
  // i gruppi delle risposte uguali: [{ ids, t (la scritta più usata), alt (le altre scritte diverse) }], nell'ordine di ids
  // i gruppi delle risposte UGUALI DAVVERO (stessa forma: maiuscole, accenti, articolo, numeri in lettere): [{ ids, t }]
  function raggruppa(risp, ids) {
    var per = {}, ord = [];
    ids.forEach(function (id) { var k = chiave(risp[id]); if (!k) return; if (!per[k]) { per[k] = { ids: [], t: pulisci(risp[id]) }; ord.push(k); } per[k].ids.push(id); });
    return ord.map(function (k) { return per[k]; });
  }
  // le unioni che propone il gioco (plurale, un errore di battitura): unite subito, ma si separano con ✂️ come quelle a mano
  // («Conti» e «Conte», «Martina» e «Marina»: il gioco non può sapere se sono la stessa cosa)
  function unioniGioco(gruppi) {
    var u = [];
    for (var i = 0; i < gruppi.length; i++) for (var j = i + 1; j < gruppi.length; j++)
      if (uguali(gruppi[i].t, gruppi[j].t)) u.push([i, j, "gioco"]);
    return u;
  }
  // i gruppi uniti a mano: unioni = [[a, b, chi], …] (posti nei gruppi). Ogni «mucchio» = { g: [posti], ids, t, alt, chi }
  function mucchi(gruppi, unioni) {
    gruppi = gruppi || []; var pad = gruppi.map(function (x, i) { return i; });
    function su(i) { while (pad[i] !== i) { pad[i] = pad[pad[i]]; i = pad[i]; } return i; }
    var chi = {};
    (unioni || []).forEach(function (u) {
      var a = +u[0], b = +u[1];
      if (!gruppi[a] || !gruppi[b]) return;
      var ra = su(a), rb = su(b); if (ra === rb) return;
      if (rb < ra) { var x = ra; ra = rb; rb = x; }
      pad[rb] = ra; chi[ra] = u[2] !== "gioco" && u[2] || chi[rb] !== "gioco" && chi[rb] || chi[ra] || u[2] || null;
    });
    var per = {}, ord = [];
    gruppi.forEach(function (g, i) { var r = su(i); if (!per[r]) { per[r] = []; ord.push(r); } per[r].push(i); });
    return ord.map(function (r) {
      var gs = per[r], ids = [], testi = [];
      gs.forEach(function (i) { ids = ids.concat(gruppi[i].ids); });
      var grande = gs.slice().sort(function (a, b) { return gruppi[b].ids.length - gruppi[a].ids.length || a - b; })[0];
      testi.push(gruppi[grande].t);
      gs.forEach(function (i) { if (testi.indexOf(gruppi[i].t) < 0) testi.push(gruppi[i].t); });
      return { g: gs, ids: ids, t: testi[0], alt: testi.slice(1), chi: gs.length > 1 ? (chi[r] || null) : null };
    });
  }
  // i punti di una domanda: ognuno prende quanti sono nel suo mucchio (lui compreso); da solo 0
  function puntiDi(ms) { var p = {}; ms.forEach(function (m) { var n = m.ids.length; m.ids.forEach(function (id) { p[id] = n >= 2 ? n : 0; }); }); return p; }
  // il traguardo: più si è, più punti si prendono a domanda. Se ognuno scrive come un altro con probabilità PESO, i punti medi
  // sono 1 + (n − 1) × PESO meno il punto che non prende chi resta da solo ((1 − PESO)^(n − 1)); arrotondato a 5
  function traguardo(n, durata) {
    n = Math.max(MIN, n);
    var q = DURATE[durata] || DURATE.normale, v = (1 + (n - 1) * PESO - Math.pow(1 - PESO, n - 1)) * q;
    return Math.max(5, Math.round(v / 5) * 5);
  }
  // le domande: mai ripetute finché non sono uscite tutte (memoria sul telefono di chi tiene la partita)
  function pescaDomanda(giaQui) {
    if (PROVA.domande && PROVA.domande.length) return PROVA.domande[giaQui.length % PROVA.domande.length];
    var tutte = window.SG_PN_DOMANDE || [["Una bibita estiva", "cibo"]];
    var uscite = leggi(CHIAVE_USCITE); if (!Array.isArray(uscite)) uscite = [];
    var liberi = [];
    tutte.forEach(function (d, i) { if (uscite.indexOf(d[0]) < 0 && giaQui.indexOf(d[0]) < 0) liberi.push(i); });
    if (!liberi.length) {   // finite: si ricomincia (tranne quelle di questa partita)
      uscite = [];
      tutte.forEach(function (d, i) { if (giaQui.indexOf(d[0]) < 0) liberi.push(i); });
      if (!liberi.length) tutte.forEach(function (d, i) { liberi.push(i); });
    }
    var d = tutte[liberi[rnd(liberi.length)]];
    uscite.push(d[0]); if (uscite.length > 3000) uscite = uscite.slice(-3000);
    scrivi(CHIAVE_USCITE, uscite);
    return d[0];
  }

  // =========================================================
  //  CHI TIENE LA PARTITA (online l'host, sullo stesso telefono il telefono): tiene lo stato e manda la «foto» (vm)
  // =========================================================
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    motore(t, null);
  }
  function locale(t) { motore(t, { invia: function () {}, inviaVeloce: function () {}, chiudi: function () {} }); }

  function motore(t, reteFinta) {
    var LOC = !!reteFinta;
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var IO = LOC ? null : (t.mioId || "host");   // io che tengo la partita (dopo un subentro: l'id da amico del vice). MAI "host" fisso
    // il proprietario (IL PAPPONE) può far partire la partita online anche da solo o in due, per vedere com'è (26 nov 2026)
    var PROVA_PROP = !LOC && String(t.nomeProfilo() || "").trim().toUpperCase() === "IL PAPPONE";
    var MINIMO = PROVA_PROP ? 1 : MIN, VIVI = PROVA_PROP ? 1 : 2;   // per cominciare / per andare avanti
    var H = { fase: "lobby", codice: "…", pronta: LOC, partita: 0, n: 0, passo: "scrivi", durata: DURATE[PROVA.durata || imp.durata] ? PROVA.durata || imp.durata : "normale",
      meta: 0, dom: "", fatte: [], scade: 0, rivFine: 0, gruppi: null, unioni: [], muti: [], ultimi: {}, pari: null, vincitore: null,
      classifica: null, to: null, rip: 0, prima: null,
      players: LOC ? [] : [{ id: IO, nome: nomeHost, omino: t.mioOmino(nomeHost), punti: 0 }],
      guarda: [], prossimi: [] };
    var risp = {};   // le risposte di questa domanda: id → testo. MAI nella foto prima della rivelazione (e nella copia per il vice no)
    if (LOC) (t.giocatori || []).forEach(function (n, i) {
      var om = i === 0 && n === t.nomeProfilo() ? t.mioOmino(n) : window.SGOmino ? SGOmino.casuale(n) : null;
      H.players.push({ id: "g" + i, nome: n, omino: om, punti: 0 });
    });
    // ----- la partita di prima (t.ripresa): l'host ha ricaricato o riaperto l'app, o (daRiserva) la porto avanti io
    var R = LOC ? null : t.ripresa, riprendo = !!(R && R.stato && R.stato.fase && R.stato.fase !== "lobby" && R.stato.players), respiroMs = 0, attesi = [];
    if (riprendo) {
      H = R.stato;
      H.to = null; H.pronta = false; H.rip = H.rip || 0; H.prossimi = []; H.guarda = H.guarda || [];
      risp = (R.soloQui && R.soloQui.risp) || {};   // (il vice non le ha: la domanda si riscrive)
      H.players.forEach(function (p) {
        if (p.id !== IO && !p.via && p.id !== (R.daRiserva && R.vecchioHost)) attesi.push(p.id);
        p.forse = false; p.via = p.id !== IO; if (p.id === IO) p.omino = t.mioOmino(p.nome);
      });
      if (H.fase === "gioco") {
        // la domanda a metà si riscrive (le risposte già date restano); rivelazione e gruppi tornano ai gruppi (i punti
        // si danno SOLO col tasto «Avanti»: mai due volte)
        if (H.passo !== "ripresa") H.prima = H.passo;
        if (H.prima === "rivela") H.prima = "gruppi";
        H.passo = "ripresa";
        respiroMs = RESPIRO * 1000;
      }
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function presenti() { return H.players.filter(function (p) { return !p.via; }); }
    function inProssimi(id) { return H.prossimi.some(function (x) { return x.id === id; }); }
    function entrano() {
      H.prossimi.forEach(function (x) { if (!pById(x.id) && presenti().length < MAX) H.players.push({ id: x.id, nome: x.nome, omino: x.omino, punti: 0 }); });
      H.prossimi = [];
    }
    function ferma() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    function k() { return H.partita + "|" + H.n; }

    t.onRegole = function (im) { if (H.fase !== "lobby") return; H.durata = DURATE[im.durata] ? im.durata : "normale"; bd(); };

    var rete = reteFinta || SGNet.ospita(ID, {
      onCodice: function (c) { H.codice = c; bd(); },
      onConnesso: function () { H.pronta = true; bd(); },
      onErrore: function () {
        if (H.pronta) return;
        ferma(); if (rete) rete.chiudi();
        erroreRete(t, "Non riesco ad aprire la stanza.", function () { host(t); });
      },
      onForse: function (id) { var p = pById(id); if (p && !p.forse) { p.forse = true; bd(); } },
      onTornato: function (id) { var p = pById(id); if (p && p.forse) { p.forse = false; bd(); } },
      onAddio: function (id) {
        if (H.guarda.some(function (x) { return x.id === id; })) { H.guarda = H.guarda.filter(function (x) { return x.id !== id; }); bd(); return; }
        if (inProssimi(id)) { H.prossimi = H.prossimi.filter(function (x) { return x.id !== id; }); bd(); return; }
        var p = pById(id); if (!p) return;
        p.forse = false;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); bd(); return; }
        p.via = true;
        if (H.fase === "gioco" && H.passo !== "ripresa" && presenti().length < VIVI) return fine();
        if (H.fase === "gioco" && H.passo === "scrivi") controllaTutti();
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (m.t === "join") {
          var p = pById(id), nome = String(m.nome || "Amico").slice(0, 16);
          if (!p && !t.puoSedersi(id, nome)) {
            if (!H.guarda.some(function (x) { return x.id === id; })) H.guarda.push({ id: id, nome: nome });
            bd(); return;
          }
          // chi arriva a partita cominciata entra dalla domanda dopo, con 0 punti (mai a metà domanda)
          if (!p && H.fase === "gioco") {
            if (!inProssimi(id) && presenti().length + H.prossimi.length < MAX) H.prossimi.push({ id: id, nome: nome, omino: avatarValido(m.omino) });
            // la partita è piena: guarda (col suo id nella foto, se no il suo telefono ripete il join per sempre)
            else if (!inProssimi(id) && !H.guarda.some(function (x) { return x.id === id; })) H.guarda.push({ id: id, nome: nome });
            bd(); return;
          }
          if (!p && H.fase === "lobby" && H.players.length < MAX)
            H.players.push({ id: id, nome: nome, omino: avatarValido(m.omino), punti: 0 });
          if (p) { p.forse = false; if (p.via && H.fase !== "lobby") p.via = false; if (!p.omino) p.omino = avatarValido(m.omino); }
          bd();
          // chi rientra mentre si scrive (o nel respiro della ripresa) ritrova la sua risposta
          if (p && H.fase === "gioco" && (H.passo === "scrivi" || H.passo === "ripresa") && risp[id]) privato(id, { t: "tua", testo: risp[id], k: k() });
          return;
        }
        var q = pById(id);
        if (H.fase !== "gioco" || !q || q.via) return;   // chi guarda soltanto non fa mosse
        if (m.t === "risp") risposta(id, m.testo, m.k);
        else if (m.t === "unisci") unisci(id, m.a, m.b, m.k);
        else if (m.t === "separa") separa(id, m.g, m.k);
      }
    }, { ripresa: riprendo });
    if (!rete) return senzaRete(t);
    if (riprendo && rete.codice) H.codice = rete.codice;

    function vm() {
      var adesso = Date.now(), scritto = {};
      if (H.passo === "scrivi") Object.keys(risp).forEach(function (id) { if (risp[id]) scritto[id] = 1; });
      return { fase: H.fase, codice: H.codice, pronta: H.pronta, partita: H.partita, n: H.n, passo: H.passo, durata: H.durata, meta: H.meta,
        k: k(), dom: H.dom, tiene: IO, rip: H.rip, pari: H.pari, vincitore: H.vincitore, classifica: H.classifica, ultimi: H.ultimi,
        // i secondi che mancano (non l'ora: gli orologi dei telefoni sono diversi)
        resta: H.passo === "scrivi" && H.scade ? Math.max(0, Math.ceil((H.scade - adesso) / 1000)) : H.passo === "ripresa" ? Math.max(1, Math.ceil((H.scade - adesso) / 1000)) : 0,
        restaMs: H.passo === "rivela" ? Math.max(0, H.rivFine - adesso) : 0,
        ordine: H.passo === "rivela" || H.passo === "gruppi" ? H.ordine : null,
        scritto: scritto,
        gruppi: H.passo === "rivela" || H.passo === "gruppi" ? H.gruppi : null,
        unioni: H.passo === "rivela" || H.passo === "gruppi" ? H.unioni : null,
        muti: H.passo === "rivela" || H.passo === "gruppi" ? H.muti : null,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, forse: !!p.forse, omino: H.fase === "lobby" ? (p.omino || null) : piccolo(p.omino) }; }),
        guarda: H.guarda,
        prossimi: H.prossimi.map(function (x) { return { id: x.id, nome: x.nome }; }) };
    }
    function privato(id, m) {
      if (LOC) return;
      if (id === IO) { if (m.t === "tua") cbHost.mia = { k: m.k, testo: m.testo, id: IO }; return; }
      m.to = id; rete.inviaVeloce(m);
    }
    // la partita da ricordare: le risposte (segrete fino alla rivelazione) restano su questo telefono (soloQui), il vice non le ha
    function ricorda() {
      if (LOC) return;
      if (H.fase === "lobby") return t.ricorda(null);
      var s = {};
      Object.keys(H).forEach(function (x) { if (x !== "to" && x !== "prossimi") s[x] = H[x]; });
      s.players = H.players.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, via: !!p.via, omino: piccolo(p.omino) }; });
      t.ricorda(s, { risp: risp });
    }
    function bd() { var v = vm(); if (!LOC) rete.invia({ t: "vm", vm: v }); ricorda(); disegna(t, v, cbHost); }

    // ----- la ripresa: qualche secondo di respiro, poi si torna dove si era -----
    function riprendi() {
      if (H.fase !== "gioco") return bd();
      respiro(respiroMs);
    }
    var nRespiri = 0;
    function respiro(ms) { ferma(); H.rip++; H.passo = "ripresa"; H.scade = Date.now() + ms; bd(); H.to = setTimeout(dopoRespiro, ms); }
    function dopoRespiro() {
      H.to = null;
      var tutti = attesi.every(function (id) { var p = pById(id); return !p || !p.via; });
      if (!(tutti && presenti().length >= VIVI) && ++nRespiri < 4) return respiro(RESPIRO * 1000);
      if (presenti().length < VIVI) return fine();
      if (H.prima === "gruppi" && H.gruppi) { H.passo = "gruppi"; return bd(); }
      apriScrivi();   // la domanda a metà: si riscrive con tutto il tempo (le risposte arrivate restano)
    }

    // ----- la partita -----
    function comincia() {
      if (H.fase !== "lobby" || presenti().length < MINIMO) return;
      H.fase = "gioco"; H.n = 0; H.partita++; H.classifica = null; H.vincitore = null; H.pari = null; H.ultimi = {}; H.fatte = [];
      H.players.forEach(function (p) { p.punti = 0; });
      H.meta = traguardo(presenti().length, H.durata);
      nuovaDomanda();
    }
    function nuovaDomanda() {
      ferma();
      entrano();
      // chi entra a metà allunga il traguardo (più si è, più punti a domanda); non si accorcia mai
      H.meta = Math.max(H.meta, traguardo(presenti().length, H.durata));
      H.n++; H.dom = pescaDomanda(H.fatte); H.fatte.push(H.dom);
      risp = {}; H.gruppi = null; H.unioni = []; H.muti = [];
      if (t.aCheSiamo) t.aCheSiamo("Domanda " + H.n + " · si vince a " + H.meta);
      apriScrivi();
    }
    function apriScrivi() {
      ferma(); H.passo = "scrivi";
      if (LOC) { H.scade = 0; bd(); return controllaTutti(); }   // sullo stesso telefono niente tempo: ci si passa il telefono
      H.scade = Date.now() + T_SCRIVI * 1000;
      bd();
      H.to = setTimeout(chiudiScrivi, T_SCRIVI * 1000 + GRAZIA);
      // dopo una ripresa chi aveva già scritto ritrova la sua risposta (il messaggio «tua» del join può essere arrivato prima)
      Object.keys(risp).forEach(function (id) { if (pById(id)) privato(id, { t: "tua", testo: risp[id], k: k() }); });
      controllaTutti();
    }
    function risposta(id, testo, kk) {
      if (H.fase !== "gioco" || H.passo !== "scrivi" || (kk && kk !== k())) return;
      var w = pulisci(testo);
      if (w && chiave(w)) risp[id] = w; else delete risp[id];
      bd();
      controllaTutti();
    }
    var chiusura = null;
    function controllaTutti() {
      if (H.passo !== "scrivi") return;
      var pr = presenti();
      if (!pr.length || !pr.every(function (p) { return !!risp[p.id]; })) { if (chiusura) { clearTimeout(chiusura); chiusura = null; } return; }
      if (chiusura) return;
      // hanno scritto tutti: un attimo (si vede l'ultima ✅) e si scopre
      chiusura = setTimeout(function () { chiusura = null; if (H.passo === "scrivi" && presenti().every(function (p) { return !!risp[p.id]; })) chiudiScrivi(); }, LOC ? 300 : 800);
    }
    function chiudiScrivi() {
      if (H.passo !== "scrivi") return;
      ferma(); if (chiusura) { clearTimeout(chiusura); chiusura = null; }
      var ids = H.players.map(function (p) { return p.id; }).filter(function (id) { return !!risp[id]; });
      // la rivelazione: una persona alla volta, IN ORDINE A CASO, tutte con lo stesso tempo (anti-spoiler: la durata dipende
      // solo da quanti hanno scritto, mai da quanti gruppi ci sono). L'ordine è nella foto: uguale su tutti i telefoni
      H.ordine = mescola(ids);
      H.gruppi = raggruppa(risp, H.ordine);
      H.unioni = unioniGioco(H.gruppi);
      H.muti = presenti().filter(function (p) { return !risp[p.id]; }).map(function (p) { return p.id; });
      H.passo = "rivela"; H.rivFine = Date.now() + durataRivela(ids.length);
      bd();
      H.to = setTimeout(function () { H.to = null; if (H.passo === "rivela") { H.passo = "gruppi"; bd(); } }, durataRivela(ids.length));
    }
    function unisci(id, a, b, kk) {
      if (H.passo !== "gruppi" || (kk && kk !== k())) return;
      a = +a; b = +b;
      if (!H.gruppi || !H.gruppi[a] || !H.gruppi[b] || a === b) return;
      var ms = mucchi(H.gruppi, H.unioni), ma = null, mb = null;
      ms.forEach(function (m) { if (m.g.indexOf(a) >= 0) ma = m; if (m.g.indexOf(b) >= 0) mb = m; });
      if (!ma || ma === mb) return;
      H.unioni.push([a, b, id]); bd();
    }
    function separa(id, g, kk) {
      if (H.passo !== "gruppi" || (kk && kk !== k())) return;
      g = +g;
      var ms = mucchi(H.gruppi, H.unioni), m = null;
      ms.forEach(function (x) { if (x.g.indexOf(g) >= 0) m = x; });
      if (!m || m.g.length < 2) return;
      H.unioni = H.unioni.filter(function (u) { return m.g.indexOf(+u[0]) < 0 && m.g.indexOf(+u[1]) < 0; });
      bd();
    }
    // «Avanti» di chi tiene la partita: i punti (UNA volta per domanda), poi chi vince o la domanda dopo
    function avanti() {
      if (H.fase !== "gioco" || H.passo !== "gruppi") return;
      ferma();
      var pt = puntiDi(mucchi(H.gruppi, H.unioni));
      H.ultimi = {};
      H.players.forEach(function (p) { var n = pt[p.id] || 0; p.punti += n; if (n) H.ultimi[p.id] = n; });
      H.passo = "punti";   // (nessuna foto in questo stato: si decide subito)
      var arrivati = H.players.filter(function (p) { return p.punti >= H.meta; });
      if (arrivati.length) {
        var max = Math.max.apply(null, arrivati.map(function (p) { return p.punti; }));
        var primi = arrivati.filter(function (p) { return p.punti === max; });
        if (primi.length === 1) { H.vincitore = primi[0].id; return fine(); }
        // in 2 la differenza non cambia più (prendono 2 tutti e due o 0 tutti e due): vincono insieme
        if (presenti().length < MIN) { H.vincitore = null; return fine(); }
        H.pari = { ids: primi.map(function (p) { return p.id; }), punti: max };   // a pari punti: un'altra domanda
      } else H.pari = null;
      nuovaDomanda();
    }
    function fine() {
      ferma(); if (chiusura) { clearTimeout(chiusura); chiusura = null; }
      var ord = H.players.slice().sort(function (a, b) { return b.punti - a.punti; });
      // il vincitore c'è solo se qualcuno ha passato il traguardo da solo (se la partita si chiude prima, o a pari, niente nome)
      H.classifica = ord.map(function (p) { return { id: p.id, nome: p.nome, punti: p.punti, pos: 1 + ord.filter(function (q) { return q.punti > p.punti; }).length }; });
      H.fase = "fine"; H.passo = "fine";
      if (LOC) { if (H.classifica.length) FX.festa(); return t.fine(H.classifica.map(function (r) { return { nome: r.nome, punti: r.punti, pos: r.pos }; })); }
      bd();
      if (t.risultato) t.risultato(H.classifica.map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    function nuova() { if (H.fase !== "fine") return; ferma(); H.fase = "lobby"; H.passo = "scrivi"; H.classifica = null; H.vincitore = null; H.players = presenti(); entrano(); H.players.forEach(function (p) { p.punti = 0; }); bd(); }
    t.onRivincita = nuova;

    var cbHost = { sonoHost: true, locale: LOC, myId: IO, mia: null, minimo: MINIMO, onComincia: comincia, onNuova: nuova, onAvanti: avanti,
      onRisposta: function (testo, kk) { risposta(LOC ? cbHost.myId : IO, testo, kk); },
      onUnisci: function (a, b, kk) { unisci(LOC ? null : IO, a, b, kk); },
      onSepara: function (g, kk) { separa(LOC ? null : IO, g, kk); },
      onEsci: function () {
        function via() { ferma(); if (chiusura) clearTimeout(chiusura); if (!LOC) { t.ricorda(null); rete.chiudi(); } t.esci(); }
        if (LOC) return t.conferma("Uscire dalla partita?", null, "Esci", via);
        if (H.fase === "gioco") return t.conferma("Chiudere la partita per tutti?", "Gli amici tornano alla home.", "Chiudi", via);
        via();
      } };
    if (riprendo && risp[IO]) cbHost.mia = { k: k(), testo: risp[IO] };   // (l'host che ricarica ritrova la sua risposta)
    if (LOC) return comincia_locale();
    if (riprendo) riprendi(); else bd();
    function comincia_locale() { H.fase = "lobby"; comincia(); }
  }

  // la rivelazione: un battito per ogni risposta (più si è, più è veloce); dipende SOLO da quante risposte ci sono
  function battito(n) { return n <= 4 ? T_GRUPPO : n <= 7 ? 950 : 800; }
  function durataRivela(n) { return T_INTRO + Math.max(1, n) * battito(n) + T_CODA; }

  // =========================================================
  //  OSPITE: disegna le foto e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null };
    function manda(m) { if (S.rete) S.rete.invia(m); }
    var cb = { sonoHost: false, myId: null, mia: null,
      onRisposta: function (testo, kk) { manda({ t: "risp", testo: testo, k: kk }); },
      onUnisci: function (a, b, kk) { manda({ t: "unisci", a: a, b: b, k: kk }); },
      onSepara: function (g, kk) { manda({ t: "separa", g: g, k: kk }); },
      onEsci: function () {
        function via() { if (S.rete) S.rete.chiudi(); t.esci(); }
        if (t.guarda) return t.conferma("Smetti di guardare?", null, "Esci", via);
        if (S.vm && S.vm.fase === "gioco") return t.conferma("Uscire dalla partita?", null, "Esci", via);
        via();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();
    function chiediNome() {
      var s = t.schermata({ icona: "🐑", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
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
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
          else if (m.t === "tua") { if (!cb.mia || cb.mia.k !== m.k) { cb.mia = { k: m.k, testo: m.testo }; if (S.vm) disegna(t, S.vm, cb); } }
        },
        onChiuso: function (perche) { errore(t, perche && perche.sparito ? "L'host non è tornato: la stanza è chiusa." : "L'host ha chiuso la partita."); },
        onErrore: function () { if (S.rete) S.rete.chiudi(); erroreRete(t, "Non riesco a entrare nella stanza.", collega); }
      });
      if (!S.rete) senzaRete(t);
    }
    function attesa() {
      var s = t.schermata({ icona: "🐑", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
    }
  }

  // =========================================================
  //  DISEGNO (uguale per tutti): saletta, gioco, fine
  // =========================================================
  var UI = null, FIN = null;
  // lascio la schermata di gioco: i suoi timer (rivelazione, barra del tempo) si fermano, se no suonano sulla home
  function lasciaUI() { if (UI) fermaTimer(UI); UI = null; }
  function disegna(t, vm, cb) {
    cb.vm = vm;
    if (vm.fase === "lobby") { lasciaUI(); FIN = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      lasciaUI();
      var kf = "fine|" + vm.partita;
      if (FIN && FIN.k === kf && FIN.t === t && document.body.contains(FIN.s)) return;
      FIN = { k: kf, t: t, s: finale(t, vm, cb) };
      return;
    }
    FIN = null;
    if (cb.locale && passaggio(t, vm, cb)) return;
    if (!UI || UI.t !== t || !document.body.contains(UI.s)) { lasciaUI(); UI = creaSchermo(t, cb); }
    aggiorna(UI, vm, cb);
  }
  // sullo stesso telefono, mentre si scrive: il telefono passa a chi non ha ancora scritto («Passa a Luca»)
  function passaggio(t, vm, cb) {
    if (vm.passo !== "scrivi") { cb.myId = null; cb.turno = null; return false; }
    var dopo = null;
    vm.players.forEach(function (p) { if (!dopo && !p.via && !(vm.scritto || {})[p.id]) dopo = p; });
    if (!dopo) { cb.myId = null; return false; }
    var kt = vm.k + "|" + dopo.id;
    if (cb.turno === kt) { cb.myId = dopo.id; return false; }
    cb.turno = kt; cb.myId = null; lasciaUI();
    t.passaA(dopo.nome, function () { if (cb.turno === kt) { cb.myId = dopo.id; lasciaUI(); disegna(t, cb.vm, cb); } });
    return true;
  }
  function lobby(t, vm, cb) {
    var dentro = vm.players.some(function (p) { return p.id === cb.myId; });
    var guardano = vm.guarda || [], guardo = guardano.some(function (p) { return p.id === cb.myId; });
    var extra = [];
    var n = Math.max(MIN, vm.players.length);
    extra.push(t.el("p", { class: "modulo-nota", style: "text-align:center", text: "🏁 In " + n + " si vince a " + traguardo(n, vm.durata) + " punti" }));
    if (guardano.length) extra.push(t.el("p", { class: "modulo-nota", text: "👀 Guardano: " + guardano.map(function (p) { return p.id === cb.myId ? "tu" : p.nome; }).join(", ") }));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: cb.minimo || MIN,
      vuoti: Math.max(0, (cb.minimo || MIN) - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: vm.tiene ? p.id === vm.tiene : i === 0, tu: p.id === cb.myId }; }),
      extra: extra,
      spettatore: t.guarda ? "👀 Guardi soltanto" : guardo ? "👀 Questa volta guardi" : !cb.sonoHost && !dentro && vm.players.length >= MAX ? "👀 La stanza è piena: guardi la partita" : false,
      attesa: "Aspetta che l'host cominci!", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  // il nome da scrivere: io sono «Tu» all'inizio, «tu» dentro una frase (minuscolo = "tu"), «te» dopo «da» (minuscolo = "te")
  function nomeDi(vm, id, cb, minuscolo) {
    var p = null; (vm.players || []).forEach(function (x) { if (x.id === id) p = x; });
    if (!p) return "Qualcuno";
    return id === cb.myId && !cb.locale ? (minuscolo || "Tu") : p.nome;
  }
  var FIG = {};   // le faccine già disegnate (id|gettone → svg)
  function figura(p) {
    var cfg = p.omino || (window.SGOmino ? SGOmino.casuale(p.nome || "?") : null);
    if (!cfg || !window.SGOmino) return "";
    var kk = p.id + "|" + JSON.stringify(cfg);
    if (!FIG[kk]) { try { FIG[kk] = SGOmino.svg(cfg, { quadrato: true }); } catch (e) { FIG[kk] = ""; } }
    return FIG[kk];
  }
  function creaSchermo(t, cb) {
    stile();
    var el = t.el, s = t.schermata({}); s.classList.add("pn-piena");
    var ui = { t: t, s: s, cb: cb, info: el("div", { class: "pn-info" }), chips: el("div", { class: "pn-chips" }), corpo: el("div", { class: "pn-corpo" }),
      chip: {}, kCorpo: null, fase: null, sel: null, timer: [] };
    var esci = el("button", { class: "pn-esci", "aria-label": "Esci", text: "‹", onclick: cb.onEsci });
    ui.targa = !!t.guarda && !t.eliminazione;
    s._contenuto.appendChild(el("div", { class: "pn-scena" + (ui.targa ? " pn-con-targa" : "") }, [el("div", { class: "pn-barra" }, [esci, ui.info]), ui.chips, ui.corpo]));
    t.mostra(s);
    return ui;
  }
  function svuota(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function fermaTimer(ui) { ui.timer.forEach(function (x) { clearTimeout(x); clearInterval(x); }); ui.timer = []; }
  function aggiorna(ui, vm, cb) {
    var io = null; vm.players.forEach(function (p) { if (p.id === cb.myId) io = p; });
    ui.guardo = !cb.locale && (!io || io.via);
    ui.aspetto = (vm.prossimi || []).some(function (p) { return p.id === cb.myId; });
    // (chi entra alla prossima lo legge già sotto la domanda: qui niente, se no la riga si taglia)
    setTx(ui.info, (ui.guardo && !ui.aspetto ? "👀 Guardi · " : "") + "Domanda " + vm.n + " · 🏁 si vince a " + vm.meta);
    chips(ui, vm, cb);
    var kc = vm.passo + "|" + vm.k + "|" + (vm.passo === "ripresa" ? vm.rip : "") + "|" + (cb.locale ? cb.myId : "");
    if (kc !== ui.kCorpo) {
      ui.kCorpo = kc; fermaTimer(ui); ui.sel = null; svuota(ui.corpo);
      ui.s.querySelector(".pn-scena").setAttribute("data-passo", vm.passo);
      ui.fase = (FASI[vm.passo] || FASI.ripresa)(ui, vm, cb);
    } else if (ui.fase && ui.fase.agg) ui.fase.agg(vm);
  }
  // i punteggi in alto: faccina, nome, punti (una fila fino a 5, poi due)
  function chips(ui, vm, cb) {
    var el = ui.t.el, lista = vm.players, n = lista.length;
    ui.chips.style.gridTemplateColumns = "repeat(" + (n <= 5 ? Math.max(n, 1) : Math.ceil(n / 2)) + ",minmax(0,1fr))";
    ui.chips.classList.toggle("tanti", n > 5);
    var visti = {};
    lista.forEach(function (p, i) {
      visti[p.id] = 1;
      var c = ui.chip[p.id];
      if (!c) {
        c = ui.chip[p.id] = { box: el("div", { class: "pn-chip" }), fig: el("div", { class: "pn-chip-fig" }), nm: el("span", { class: "pn-chip-nm" }), pt: el("b", { class: "pn-chip-pt" }), piu: el("i", { class: "pn-piu" }), figK: null, piuK: null };
        c.box.appendChild(c.fig); c.box.appendChild(el("div", { class: "pn-chip-tx" }, [c.nm, c.pt])); c.box.appendChild(c.piu);
      }
      if (ui.chips.children[i] !== c.box) ui.chips.insertBefore(c.box, ui.chips.children[i] || null);
      var fk = JSON.stringify(p.omino || p.nome);
      if (c.figK !== fk) { c.figK = fk; c.fig.innerHTML = figura(p); }
      setTx(c.nm, (p.forse ? "📶 " : "") + (p.id === cb.myId && !cb.locale ? "Tu" : p.nome));
      setTx(c.pt, fmtN(p.punti));
      c.box.classList.toggle("via", !!p.via || !!p.forse);
      c.box.classList.toggle("tu", p.id === cb.myId && !cb.locale);
      c.box.classList.toggle("fatto", vm.passo === "scrivi" && !!(vm.scritto || {})[p.id]);
      c.box.classList.toggle("pari", !!(vm.pari && vm.pari.ids.indexOf(p.id) >= 0));
      // i punti appena presi: «+3» che sale una volta sola, all'inizio della domanda dopo
      var piu = vm.passo === "scrivi" && vm.ultimi && vm.ultimi[p.id] ? vm.ultimi[p.id] : 0, pk = vm.k + "|" + piu;
      if (piu && c.piuK !== pk) { c.piuK = pk; c.piu.textContent = "+" + piu; c.piu.classList.remove("su"); void c.piu.offsetWidth; c.piu.classList.add("su"); }
    });
    Object.keys(ui.chip).forEach(function (id) { if (!visti[id] && ui.chip[id].box.parentNode) ui.chip[id].box.parentNode.removeChild(ui.chip[id].box); });
  }
  function cartaDomanda(ui, vm, piccola) {
    var el = ui.t.el, tx = el("div", { class: "pn-dtx", text: vm.dom || "" });
    var c = el("div", { class: "pn-domanda" + (piccola ? " piccola" : "") }, [tx]);
    var l = (vm.dom || "").length;
    c.style.setProperty("--pn-df", l > 44 ? ".78" : l > 30 ? ".88" : "1");
    ui.corpo.appendChild(c);
    return tx;
  }
  // il tempo: la barra si accorcia da sola (solo transform) e il numero conta. rifai(fine): una foto più giusta (chi ha
  // ricaricato riceve prima la foto trattenuta, vecchia) accorcia la barra già aperta
  function tempo(ui, vm, box) {
    var el = ui.t.el, bar = el("i"), num = el("b"), tot = T_SCRIVI * 1000, T = { fine: 0 }, iv = null;
    box.appendChild(el("div", { class: "pn-barra-t" }, [bar])); box.appendChild(num);
    function tic() {
      if (!document.body.contains(num)) { clearInterval(iv); return; }
      var s = Math.max(0, Math.ceil((T.fine - Date.now()) / 1000));
      setTx(num, "⏱ " + s); num.classList.toggle("poco", s <= 5);
    }
    T.rifai = function (fine) {
      T.fine = fine;
      var rest = Math.max(0, fine - Date.now());
      bar.style.transition = "none"; bar.style.transform = "scaleX(" + Math.min(1, rest / tot) + ")";
      void bar.offsetWidth;
      requestAnimationFrame(function () { bar.style.transition = "transform " + rest + "ms linear"; bar.style.transform = "scaleX(0)"; });
      tic();
    };
    T.rifai(Date.now() + (vm.resta || 0) * 1000);
    iv = setInterval(tic, 250); ui.timer.push(iv);
    return T;
  }

  var FASI = {};
  // ✍️ tutti scrivono la stessa domanda
  FASI.scrivi = function (ui, vm, cb) {
    var el = ui.t.el;
    cartaDomanda(ui, vm, false);
    if (vm.pari) {
      var nomi = vm.pari.ids.map(function (id) { return nomeDi(vm, id, cb, "tu"); });
      ui.corpo.appendChild(el("p", { class: "pn-pari", text: "⚔️ Pari a " + vm.pari.punti + ": " + elenco(nomi) + ". Un'altra domanda!" }));
    }
    var zona = el("div", { class: "pn-zona" }), stato = el("p", { class: "pn-stato" }), conto = el("div", { class: "pn-tempo" });
    ui.corpo.appendChild(zona); ui.corpo.appendChild(stato);
    if (!cb.locale) ui.corpo.appendChild(conto);
    var gioco = cb.locale ? !!cb.myId : !ui.guardo && !ui.aspetto;
    var modifica = false, kz = null, mieT = 0, rimandata = false, orologio = null;
    function mia() { return cb.mia && cb.mia.k === vm.k && (cb.mia.id == null || cb.mia.id === cb.myId) ? cb.mia.testo : null; }
    function zonaAgg() {
      if (!gioco) {
        var tz = cb.locale ? "✅ Hanno scritto tutti: vediamo!" : ui.aspetto ? "✋ Entri dalla prossima domanda: intanto pensaci anche tu!" : "👀 Gli altri scrivono la loro risposta…";
        if (kz !== tz) { kz = tz; svuota(zona); zona.appendChild(el("p", { class: "pn-guardo", text: tz })); }
        return;
      }
      var w = mia(), st = w && !modifica ? "m:" + w : "s";
      if (kz === st) return;
      kz = st; svuota(zona);
      if (w && !modifica) {
        zona.appendChild(el("div", { class: "pn-fatto" }, [el("span", { text: "✅ «" + w + "»" }),
          el("button", { class: "pn-cambia", type: "button", text: "✏️ Cambia", onclick: function () { modifica = true; zonaAgg(); } })]));
        return;
      }
      var inp = el("input", { type: "text", class: "pn-input", maxlength: String(LUNGO), placeholder: cb.locale ? "La risposta di " + nomeDi(vm, cb.myId, cb) + "…" : "La risposta di tutti…",
        autocomplete: "off", autocapitalize: "sentences", enterkeyhint: "send", spellcheck: "false" });
      if (w) inp.value = w;
      var b = el("button", { class: "btn btn-primario pn-invia", type: "button", text: "Invia" });
      function invia() {
        var v = pulisci(inp.value);
        if (!v || !chiave(v)) { try { inp.focus(); } catch (e) {} return; }
        cb.mia = { k: vm.k, testo: v, id: cb.myId }; mieT = Date.now(); modifica = false;
        try { inp.blur(); } catch (e) {}
        FX.invio(); vibra(15);
        cb.onRisposta(v, vm.k); zonaAgg();
      }
      b.addEventListener("click", invia);
      inp.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); invia(); } });
      zona.appendChild(el("div", { class: "pn-riga" }, [inp, b]));
      if (modifica || cb.locale) setTimeout(function () { try { inp.focus(); } catch (e) {} }, 60);
    }
    function agg(v) {
      vm = v;
      zonaAgg();
      var sc = v.scritto || {}, chi = v.players.filter(function (p) { return !p.via; }), fatti = chi.filter(function (p) { return sc[p.id]; }).length;
      setTx(stato, cb.locale ? !cb.myId ? "" : "✍️ Scrive " + nomeDi(v, cb.myId, cb) + " · gli altri non guardano!" : gioco ? (mia() ? "Hanno scritto in " + fatti + " su " + chi.length + "…" : "Scrivi la risposta che daranno gli altri") : "Hanno scritto in " + fatti + " su " + chi.length);
      if (!cb.locale && gioco && mia()) {
        // la mia risposta non è arrivata (rete saltata) → la rimando; e una volta sempre quando la schermata rinasce (dopo una
        // ripresa l'host può avere quella di prima, se l'ho cambiata mentre lui ricaricava)
        if (!rimandata || !sc[cb.myId] && Date.now() - mieT > 3000) { rimandata = true; mieT = Date.now(); cb.onRisposta(mia(), v.k); }
      }
      // una foto più giusta accorcia la barra (mai la allunga)
      if (orologio && v.resta != null) { var f2 = Date.now() + v.resta * 1000; if (f2 < orologio.fine - 1500) orologio.rifai(f2); }
    }
    if (!cb.locale) orologio = tempo(ui, vm, conto);
    agg(vm);
    return { agg: agg };
  };

  // le carte dei gruppi: una griglia che riempie lo spazio, mai da scorrere. Se le carte non ci stanno si stringono da sole
  // (via i nomi, poi via anche le faccine)
  function griglia(ui, n) {
    var g = ui.t.el("div", { class: "pn-griglia" }), col = n <= 3 ? 1 : 2, righe = Math.max(1, Math.ceil(n / col));
    g.style.gridTemplateColumns = "repeat(" + col + ",minmax(0,1fr))";
    g.style.gridTemplateRows = "repeat(" + righe + ",minmax(0,1fr))";
    g.style.setProperty("--pn-gf", righe >= 5 ? ".74" : righe >= 4 ? ".84" : righe >= 3 ? ".92" : "1");
    if (righe >= 4) g.classList.add("fitta");
    return g;
  }
  function adatta(g) {
    function troppo() { return [].some.call(g.children, function (c) { return c.offsetParent && c.scrollHeight > c.clientHeight + 1; }); }
    requestAnimationFrame(function () {
      if (!g.offsetParent) return;
      if (troppo()) g.classList.add("fitta");
      if (troppo()) g.classList.add("fittissima");
    });
  }
  function faccina(ui, vm, id) {
    var p = null; vm.players.forEach(function (x) { if (x.id === id) p = x; });
    return ui.t.el("span", { class: "pn-gfi", title: p ? p.nome : "", html: p ? figura(p) : "" });
  }
  // una carta: la risposta, le faccine di chi l'ha scritta, i nomi, quanti sono (o i punti)
  function cartaGruppo(ui, vm, cb, m, ids, opz) {
    var el = ui.t.el, n = ids.length, mia = ids.indexOf(cb.myId) >= 0 && !cb.locale;
    var figs = el("div", { class: "pn-gf" });
    ids.forEach(function (id) { figs.appendChild(faccina(ui, vm, id)); });
    var c = el("div", { class: "pn-g" + (mia ? " mia" : "") + (n < 2 ? " solo" : " gregge") + (opz.su ? " su" : "") }, [
      el("div", { class: "pn-gt", text: m.t }),
      m.alt && m.alt.length ? el("div", { class: "pn-ga", text: "= " + m.alt.join(" = ") }) : null,
      figs,
      el("div", { class: "pn-gn", text: ids.map(function (id) { return nomeDi(vm, id, cb); }).join(", ") }),
      el("div", { class: "pn-gp", text: opz.punti ? (n >= 2 ? "+" + n + " a testa" : "da solo · 0") : n >= 2 ? "×" + n : "da solo" })
    ].filter(Boolean));
    return c;
  }
  // 🥁 la rivelazione: una persona alla volta, IN ORDINE A CASO, tutte con lo stesso tempo. Se la sua risposta è già uscita
  // la sua faccina salta dentro quella carta (×2, ×3…), se no nasce una carta nuova nel posto libero dopo. La griglia ha un
  // posto per ogni risposta: dalla misura delle carte non si capisce quante risposte diverse ci sono
  FASI.rivela = function (ui, vm, cb) {
    var el = ui.t.el, ord = vm.ordine || [], ms = mucchi(vm.gruppi, vm.unioni);
    cartaDomanda(ui, vm, true);
    var tit = el("p", { class: "pn-tit", text: ord.length ? "🥁 Ecco le risposte…" : "😶 Nessuno ha risposto!" });
    ui.corpo.appendChild(tit);
    var g = griglia(ui, ord.length), posti = ord.map(function () { var x = el("div", { class: "pn-posto" }); g.appendChild(x); return x; });
    ui.corpo.appendChild(g);
    var di = {}, tx = {}; ms.forEach(function (m, i) { m.ids.forEach(function (id) { di[id] = i; }); });
    (vm.gruppi || []).forEach(function (gr) { gr.ids.forEach(function (id) { tx[id] = gr.t; }); });
    var stato = { visti: {}, carta: {}, libero: 0 }, bat = battito(ord.length), tot = durataRivela(ord.length), timer = [];
    var inizio = Date.now() - Math.max(0, tot - (vm.restaMs || 0));
    function passo(i, suoni) {
      var id = ord[i], mi = di[id]; if (mi == null) return;
      var visti = stato.visti[mi] = (stato.visti[mi] || []).concat([id]), testi = [];
      visti.forEach(function (x) { if (testi.indexOf(tx[x]) < 0) testi.push(tx[x]); });   // (solo le scritte già uscite)
      var nuova = cartaGruppo(ui, vm, cb, { t: testi[0], alt: testi.slice(1) }, visti, { su: true });
      if (stato.carta[mi]) { nuova.classList.add("salta"); stato.carta[mi].parentNode.replaceChild(nuova, stato.carta[mi]); }
      else { var p = posti[stato.libero++]; if (!p) return; p.appendChild(nuova); nuova.classList.add("nasce"); }
      stato.carta[mi] = nuova;
      if (!suoni || !document.body.contains(nuova)) return;
      FX.pop(visti.length);
      if (id === cb.myId && !cb.locale) vibra(visti.length >= 2 ? [20, 40, 20] : 40);
      else if (visti.indexOf(cb.myId) >= 0 && !cb.locale) vibra(25);   // qualcuno ha scritto come me
    }
    var fatti = 0;
    function programma(suoni) {
      timer.forEach(clearTimeout); timer = [];
      var passato = Date.now() - inizio;
      while (fatti < ord.length && T_INTRO + fatti * bat <= passato) passo(fatti++, false);
      for (var i = fatti; i < ord.length; i++) (function (i) {
        var x = setTimeout(function () { if (i === fatti) passo(fatti++, suoni); }, T_INTRO + i * bat - passato);
        timer.push(x); ui.timer.push(x);
      })(i);
    }
    var tardi = Date.now() - inizio > 400;
    if (!tardi && ord.length) FX.rullo();
    programma(true);
    return { agg: function (v) {
      // una foto più giusta (chi ha ricaricato riceve prima quella trattenuta): si rimette in pari, in silenzio
      var i2 = Date.now() - Math.max(0, tot - (v.restaMs || 0));
      if (v.restaMs && i2 < inizio - 400) { inizio = i2; programma(false); }
    } };
  };
  // 🔗 i gruppi: chi gioca unisce due carte che sono la stessa cosa (o le separa); va avanti chi tiene la partita
  FASI.gruppi = function (ui, vm, cb) {
    var el = ui.t.el;
    cartaDomanda(ui, vm, true);
    var tit = el("p", { class: "pn-tit" }), box = el("div", { class: "pn-gbox" }), muti = el("p", { class: "pn-muti" }), piede = el("div", { class: "pn-piede" });
    ui.corpo.appendChild(tit); ui.corpo.appendChild(box); ui.corpo.appendChild(muti); ui.corpo.appendChild(piede);
    var puo = cb.locale || !ui.guardo, kg = null, carte = [];
    function scritta() {
      setTx(tit, !carte.length ? "😶 Nessuno ha risposto!" : !puo ? "🔗 Le risposte uguali stanno insieme" : ui.sel !== null ? "👆 Tocca l'altra carta da unire (o di nuovo questa per lasciarla)" : "🔗 Due risposte sono la stessa cosa? Tocca tutte e due le carte");
    }
    function segna() { carte.forEach(function (x) { x.c.classList.toggle("sel", ui.sel !== null && x.m.g.indexOf(ui.sel) >= 0); }); scritta(); }
    // un tocco sceglie (solo la classe: niente ridisegno), il secondo unisce
    function tocca(m) {
      if (!puo) return;
      var a = m.g[0];
      if (ui.sel === null) { ui.sel = a; vibra(10); return segna(); }
      if (m.g.indexOf(ui.sel) >= 0) { ui.sel = null; return segna(); }
      var b = ui.sel; ui.sel = null; segna(); FX.unisci(); vibra(20);
      cb.onUnisci(b, a, vm.k);
    }
    function disegnaG() {
      var ms = mucchi(vm.gruppi, vm.unioni);
      var kk = JSON.stringify(ms.map(function (m) { return [m.g, m.chi]; }));
      if (kk === kg) return;
      kg = kk; svuota(box); carte = [];
      if (ui.sel !== null && !ms.some(function (m) { return m.g.length === 1 && m.g[0] === ui.sel; })) ui.sel = null;
      var g = griglia(ui, ms.length);
      ms.forEach(function (m) {
        var c = cartaGruppo(ui, vm, cb, m, m.ids, { su: true, punti: true });
        if (puo) { c.classList.add("tocca"); c.addEventListener("click", function () { tocca(m); }); }
        if (m.g.length > 1) {
          c.classList.add("unito");
          c.appendChild(el("div", { class: "pn-gu", text: "🔗 " + (m.chi === "gioco" ? "unite dal gioco" : m.chi && !cb.locale ? "unite da " + nomeDi(vm, m.chi, cb, "te") : "unite") }));
          if (puo) c.appendChild(el("button", { class: "pn-sep", type: "button", "aria-label": "Separa", text: "✂️", onclick: function (e) { e.stopPropagation(); ui.sel = null; FX.separa(); cb.onSepara(m.g[0], vm.k); } }));
        }
        carte.push({ c: c, m: m });
        g.appendChild(c);
      });
      box.appendChild(g);
      adatta(g);
      segna();
    }
    function agg(v) {
      vm = v; disegnaG();
      var m = (v.muti || []).map(function (id) { return nomeDi(v, id, cb, "tu"); });
      setTx(muti, !m.length ? "" : m.length === 1 && m[0] === "tu" ? "🙊 Non hai scritto in tempo" : "🙊 Non " + (m.length > 1 ? "hanno" : "ha") + " scritto: " + m.join(", "));
    }
    // il tasto di chi tiene la partita (sullo stesso telefono, chi ha il telefono): niente tempo, si va avanti quando si è d'accordo
    if (cb.sonoHost) piede.appendChild(el("button", { class: "btn btn-primario pn-vai", type: "button", text: "▶ Avanti: i punti", onclick: function (e) { e.currentTarget.disabled = true; cb.onAvanti(); } }));
    else piede.appendChild(el("p", { class: "pn-aspetta", text: "⏳ Quando siete d'accordo, va avanti " + nomeDi(vm, vm.tiene, cb) }));
    agg(vm);
    return { agg: agg };
  };
  FASI.ripresa = function (ui, vm, cb) {
    var el = ui.t.el;
    cartaDomanda(ui, vm, false);
    var p = el("p", { class: "pn-tit", text: "🔁 Si riprende…" }), c = el("p", { class: "pn-aspetta" });
    ui.corpo.appendChild(p); ui.corpo.appendChild(c);
    ui.t.contoAvanti(c, vm.resta || RESPIRO, null, "pnr|" + vm.partita + "|" + vm.rip);
    return { agg: function () {} };
  };

  // medaglie per POSTO (come il core, v421): 1° oro, 2° argento, 3° bronzo, poi «4°»; a pari merito lo stesso posto
  function medaglia(pos) { return ["🥇", "🥈", "🥉"][pos - 1] || pos + "°"; }
  function finale(t, vm, cb) {
    var cl = vm.classifica || [], vinc = null, primi = cl.filter(function (r) { return r.pos === 1; });
    cl.forEach(function (r) { if (r.id === vm.vincitore) vinc = r; });
    // la scritta dice il vero: primo al traguardo da solo, pari merito, oppure partita chiusa prima (sono rimasti in pochi)
    var sotto = vinc && vinc.punti >= vm.meta ? "🐑 " + (vinc.id === cb.myId ? "Hai" : vinc.nome + " ha") + " pensato come il gregge: primo a " + fmtN(vm.meta) + "!"
      : primi.length > 1 && primi[0].punti >= vm.meta ? "🐑 " + elenco(primi.map(function (r) { return r.id === cb.myId ? "tu" : r.nome; })).replace(/^tu/, "Tu") + " al traguardo a pari merito!"
      : "🏁 Partita finita prima del traguardo: siete rimasti in pochi";
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: sotto });
    var targa = !!t.guarda && !t.eliminazione, fac = targa ? null : t.faccine();
    if (targa) s.classList.add("pn-fine-targa");
    var fitta = cl.length > 6 || cl.length * 71 + 300 + (fac ? 56 : 0) > (window.innerHeight || 640);
    var ol = t.el("ol", { class: "classifica" + (fitta ? " fitta" : "") });
    cl.forEach(function (r) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: medaglia(r.pos) }),
        t.el("span", { class: "nome", text: r.id === cb.myId ? r.nome + " (tu)" : r.nome }),
        t.el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    if (fac) { fac.classList.add("fine-faccine"); s._contenuto.appendChild(fac); }
    if (!cl.some(function (r) { return r.id === cb.myId; })) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:10px", text: "Questa partita l'hai guardata." }));
    else if (primi.some(function (r) { return r.id === cb.myId; }) && primi[0].punti >= vm.meta) { FX.festa(); vibra([40, 60, 40, 60, 80]); }
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
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online questo gioco funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.pn-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:var(--o-fondo,#0d1020)}",
      ".schermata.pn-piena>.testa,.schermata.pn-piena>.piede{display:none}",
      ".schermata.pn-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".pn-scena{height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;gap:8px;padding:calc(8px + env(safe-area-inset-top)) 10px calc(10px + env(safe-area-inset-bottom));overflow:hidden;color:var(--o-testo,#f4f5fb);user-select:none;-webkit-user-select:none;background:radial-gradient(120% 60% at 50% 0%,rgba(224,34,90,.16),transparent 60%),radial-gradient(90% 50% at 100% 100%,rgba(79,216,255,.08),transparent 70%)}",
      ".pn-scena.pn-con-targa{padding-bottom:calc(62px + env(safe-area-inset-bottom))}",
      ".schermata.pn-fine-targa{padding-bottom:calc(58px + env(safe-area-inset-bottom))}",
      ".pn-barra{display:flex;align-items:center;gap:10px;flex:none}",
      ".pn-esci{width:36px;height:36px;flex:none;border-radius:50%;border:1px solid var(--o-filo,rgba(255,255,255,.09));background:var(--o-carta,rgba(30,36,62,.58));color:inherit;font:inherit;font-size:1.3rem;font-weight:900;cursor:pointer}",
      ".pn-info{flex:1;min-width:0;font-weight:800;font-size:.86rem;color:var(--o-testo-2,#a6acc8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      // i punteggi
      ".pn-chips{display:grid;gap:5px;flex:none}",
      ".pn-chip{position:relative;display:flex;align-items:center;gap:6px;min-width:0;padding:4px 6px;border-radius:12px;background:var(--o-carta,rgba(30,36,62,.58));border:1px solid var(--o-filo,rgba(255,255,255,.09));box-shadow:inset 0 1px 0 rgba(255,255,255,.05)}",
      ".pn-chip.tu{border-color:rgba(224,34,90,.7)}.pn-chip.via{opacity:.45}.pn-chip.pari{box-shadow:0 0 0 2px #ffc247}",
      ".pn-chip.fatto:after{content:'✅';position:absolute;right:-3px;top:-6px;font-size:.78rem}",
      ".pn-chip-fig{flex:none;width:28px;height:28px}.pn-chip-fig svg{width:100%;height:100%;display:block}",
      ".pn-chip-tx{min-width:0;display:flex;flex-direction:column;line-height:1.1}",
      ".pn-chip-nm{font-size:.74rem;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".pn-chip-pt{font-size:1rem;font-weight:900}",
      ".pn-chips.tanti .pn-chip{padding:3px 4px;gap:4px}.pn-chips.tanti .pn-chip-fig{width:22px;height:22px}.pn-chips.tanti .pn-chip-nm{font-size:.66rem}.pn-chips.tanti .pn-chip-pt{font-size:.86rem}",
      ".pn-piu{position:absolute;right:4px;top:2px;font-style:normal;font-weight:900;font-size:.8rem;color:#3ee0a8;opacity:0;pointer-events:none}",
      ".pn-piu.su{animation:pnPiu 2.2s ease-out}",
      "@keyframes pnPiu{0%{opacity:0;transform:translateY(6px) scale(.7)}15%{opacity:1;transform:translateY(0) scale(1.15)}75%{opacity:1;transform:translateY(-4px)}100%{opacity:0;transform:translateY(-10px)}}",
      // il corpo
      ".pn-corpo{flex:1 1 auto;min-height:0;display:flex;flex-direction:column;gap:8px}",
      ".pn-domanda{flex:none;padding:18px 16px;border-radius:20px;text-align:center;background:linear-gradient(160deg,rgba(48,56,92,.75),rgba(21,26,46,.9));border:1px solid var(--o-filo-oro,rgba(255,255,255,.16));box-shadow:var(--o-ombra-alta,0 22px 48px -16px rgba(0,0,0,.85))}",
      ".pn-dtx{font-weight:900;font-size:calc(clamp(1.45rem,6.6vw,2.2rem) * var(--pn-df,1));line-height:1.15;letter-spacing:-.01em}",
      ".pn-domanda.piccola{padding:9px 12px;border-radius:16px}.pn-domanda.piccola .pn-dtx{font-size:calc(clamp(1.05rem,4.6vw,1.4rem) * var(--pn-df,1))}",
      ".pn-pari{margin:0;text-align:center;font-weight:800;color:#ffc247}",
      ".pn-zona{flex:none}",
      ".pn-riga{display:flex;gap:8px}",
      ".pn-input{flex:1;min-width:0;height:52px;box-sizing:border-box;padding:0 14px;border-radius:14px;border:2px solid rgba(224,34,90,.55);background:#151a2e;color:#f4f5fb;font:inherit;font-size:1.15rem;font-weight:700;outline:none}",
      ".pn-input:focus{border-color:#e0225a;box-shadow:0 0 0 3px rgba(224,34,90,.25)}",
      ".pn-invia{width:auto!important;margin:0!important;flex:none;height:52px;padding:0 18px}",
      ".pn-fatto{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:14px;background:rgba(62,224,168,.12);border:1px solid rgba(62,224,168,.45);font-weight:800;font-size:1.1rem}",
      ".pn-fatto span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}",
      ".pn-cambia{flex:none;border:0;border-radius:10px;padding:7px 10px;background:rgba(255,255,255,.1);color:inherit;font:inherit;font-weight:700;cursor:pointer}",
      ".pn-guardo{margin:6px 0;text-align:center;font-weight:700;color:var(--o-testo-2,#a6acc8)}",
      ".pn-stato{margin:0;text-align:center;font-size:.9rem;font-weight:700;color:var(--o-testo-2,#a6acc8)}",
      ".pn-tempo{display:flex;align-items:center;gap:10px;flex:none}",
      ".pn-barra-t{flex:1;height:8px;border-radius:99px;background:rgba(255,255,255,.08);overflow:hidden}",
      ".pn-barra-t i{display:block;height:100%;background:linear-gradient(90deg,#e0225a,#ff6d97);transform-origin:left center}",
      ".pn-tempo b{min-width:48px;text-align:right;font-weight:900}.pn-tempo b.poco{color:#ff6d97}",
      // le carte dei gruppi
      ".pn-tit{margin:0;text-align:center;font-weight:800;font-size:.95rem;flex:none}",
      ".pn-gbox{flex:1 1 auto;min-height:0;display:flex}",
      ".pn-griglia{flex:1 1 auto;min-height:0;display:grid;gap:7px}",
      ".pn-corpo>.pn-griglia{flex:1 1 auto}",
      ".pn-g{position:relative;min-height:0;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 8px;border-radius:16px;text-align:center;background:var(--o-carta,rgba(30,36,62,.58));border:1px solid var(--o-filo,rgba(255,255,255,.09));box-shadow:var(--o-ombra,0 10px 26px -12px rgba(0,0,0,.75));opacity:0;transform:scale(.6)}",
      ".pn-g.su{opacity:1;transform:none;transition:opacity .35s ease,transform .45s cubic-bezier(.2,1.4,.4,1)}",
      ".pn-g.gregge{background:linear-gradient(160deg,rgba(62,224,168,.16),rgba(30,36,62,.6));border-color:rgba(62,224,168,.4)}",
      ".pn-g.solo{background:linear-gradient(160deg,rgba(10,12,24,.9),rgba(30,36,62,.5))}",
      ".pn-g.mia{box-shadow:0 0 0 2px #e0225a,var(--o-ombra,0 10px 26px -12px rgba(0,0,0,.75))}",
      ".pn-g.tocca{cursor:pointer}.pn-g.sel{box-shadow:0 0 0 3px #ffc247;transform:scale(1.02)}",
      ".pn-g.unito{border-style:dashed}",
      ".pn-gt{font-weight:900;font-size:calc(1.3rem * var(--pn-gf,1));line-height:1.1;max-width:100%;overflow:hidden;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}",
      ".pn-ga{font-size:calc(.78rem * var(--pn-gf,1));color:var(--o-testo-2,#a6acc8);font-weight:700;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".pn-gf{display:flex;flex-wrap:wrap;justify-content:center;gap:2px;max-height:calc(30px * var(--pn-gf,1));overflow:hidden}",
      ".pn-gfi{width:calc(26px * var(--pn-gf,1));height:calc(26px * var(--pn-gf,1))}.pn-gfi svg{width:100%;height:100%;display:block}",
      ".pn-gn{font-size:calc(.72rem * var(--pn-gf,1));font-weight:700;color:var(--o-testo-2,#a6acc8);max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".pn-gp{font-weight:900;font-size:calc(.86rem * var(--pn-gf,1));padding:1px 9px;border-radius:99px;background:rgba(255,255,255,.08)}",
      ".pn-g.gregge .pn-gp{background:rgba(62,224,168,.2);color:#7ff0c6}",
      ".pn-gu{font-size:calc(.68rem * var(--pn-gf,1));font-weight:700;color:#ffc247}",
      ".pn-sep{position:absolute;top:4px;right:4px;width:30px;height:30px;border-radius:50%;border:0;background:rgba(255,255,255,.12);color:inherit;font-size:.95rem;cursor:pointer}",
      ".pn-griglia.fitta .pn-gn,.pn-griglia.fitta .pn-ga{display:none}",
      ".pn-griglia.fittissima .pn-gf{display:none}.pn-griglia.fittissima .pn-g{gap:1px;padding:3px 6px}",
      ".pn-posto{min-height:0;min-width:0;display:flex}.pn-posto>.pn-g{flex:1}",
      ".pn-g.nasce{animation:pnNasce .45s cubic-bezier(.2,1.4,.4,1)}.pn-g.salta{animation:pnSalta .4s ease-out}",
      "@keyframes pnNasce{0%{opacity:0;transform:scale(.6)}100%{opacity:1;transform:none}}",
      "@keyframes pnSalta{0%{transform:scale(1)}40%{transform:scale(1.07)}100%{transform:scale(1)}}",
      ".pn-muti{margin:0;text-align:center;font-size:.82rem;font-weight:700;color:var(--o-testo-2,#a6acc8);flex:none}.pn-muti:empty{display:none}",
      ".pn-piede{flex:none;min-height:48px;display:flex;align-items:center;justify-content:center}",
      ".pn-vai{width:auto!important;min-width:70%;margin:0!important}",
      ".pn-aspetta{margin:0;text-align:center;font-weight:700;color:var(--o-testo-2,#a6acc8)}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Tutti d'Accordo", icona: "🐑", tema: "oro",
    descrizione: "Tutti rispondono alla stessa domanda: vince chi scrive la cosa più scontata, come il resto del gregge!",
    giocatoriMin: MIN, giocatoriMax: MAX, difficolta: 1,
    provaDaSolo: true,   // il proprietario (IL PAPPONE) la prova anche da solo o in due: sullo stesso telefono (minDi del core) e online (MINIMO)
    modi: [{ modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "Vi passate il telefono: ognuno scrive di nascosto", amici: true, min: MIN }],
    postiOnline: MAX,
    ritardatari: RITARDATARI,
    riprende: true,
    riserva: true,
    riassunto: function (imp) { return "Partita " + ({ corta: "corta", normale: "normale", lunga: "lunga" }[imp.durata] || "normale") + " · traguardo secondo quanti siete"; },
    regole: [
      "Tutti leggono la <b>stessa domanda</b> e scrivono di nascosto la risposta <b>più scontata</b>: vince chi pensa come gli altri.",
      "Prendi tanti punti quante persone hanno scritto <b>la tua stessa risposta</b>, te compreso: in 3 uguali, 3 punti a testa. Chi resta <b>da solo</b> prende 0.",
      "Maiuscole, accenti, articoli, plurali e piccoli errori non contano. Due risposte che sono la stessa cosa (Coca e Coca-Cola)? <b>Toccatele tutte e due</b> e si uniscono.",
      "Vince il <b>primo che arriva al traguardo</b>: più siete, più è lontano."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.durata = "normale";
      box.appendChild(el("div", { class: "etichetta", text: "Quanto dura" }));
      var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(3,1fr)" });
      [["corta", "Corta", "circa 6 domande"], ["normale", "Normale", "circa 10 domande"], ["lunga", "Lunga", "circa 15 domande"]].forEach(function (x) {
        var b = el("button", { class: "modo-chip" + (x[0] === "normale" ? " attiva" : ""), style: "justify-content:center;flex-direction:column", onclick: function () {
          dove.durata = x[0]; [].forEach.call(g.children, function (c) { c.className = "modo-chip"; }); b.className = "modo-chip attiva";
        } }, [el("div", { class: "mt", text: x[1] }), el("div", { class: "ms", text: x[2] })]);
        g.appendChild(b);
      });
      box.appendChild(g);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);
      if ((t.impostazioni || {}).modo === "online") return host(t);
      return locale(t);
    }
  });
  // per le prove: le regole senza grafica
  window.SG_PN_PROVA = { chiave: chiave, uguali: uguali, raggruppa: raggruppa, unioniGioco: unioniGioco, durataRivela: durataRivela, mucchi: mucchi, puntiDi: puntiDi, traguardo: traguardo };
})();

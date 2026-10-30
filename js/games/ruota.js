/* =========================================================
   LA RUOTA DELLA FORTUNA — come il quiz della TV.
   Si gira la ruota, si chiama una consonante (lo spicchio vale per ogni lettera trovata),
   si comprano le vocali, si risolve la frase. Bancarotta, Passa e Jolly come in TV.
   Vince chi accumula di più in tutte le manche.
   I round speciali del programma vero (si accendono e si spengono nelle regole, accesi di base):
   - "Prenota", la frase lampo in apertura di ogni manche: le lettere compaiono da sole, chi la sa prenota;
   - lo spicchio "Express": niente più giri, 1.000 a consonante, ma un errore è Bancarotta;
   - l'ultimo round veloce: la ruota gira una volta sola, una lettera a testa e 5 secondi per risolvere;
   - la finale del campione: busta con le Speed Coins, R S T L N E, 3 consonanti + 1 vocale, 10 secondi;
   - ❓ lo spicchio Mistero nelle ultime due manche normali (+10.000 o Bancarotta, lo decide l'host solo quando si apre).
   ✍️ Le frasi degli amici: quelle scritte nel ⚙️ (restano sul telefono dell'host) e quelle mandate da chi guarda
   (vanno solo all'host, mai nella foto). Online, a fine manche «⏩ Avanti» a maggioranza.
   Modi: contro i Bot (tu + i bot del gruppo fisso, SG.bot), sullo stesso telefono (da 2 a 4,
   tutti davanti allo stesso schermo), online (fino a 4, l'host può aggiungere bot).
   Online l'host tiene la partita e manda a tutti la foto (vm) con la frase COPERTA:
   la frase vera non viaggia mai finché non è risolta.
   Le frasi stanno in data/ruota-frasi.js (window.SG_RUOTA_FRASI).
   ========================================================= */
(function () {
  "use strict";

  var ID = "ruota";
  var MAX = 4;
  var COSTO_VOCALE = 300, MINIMO_RISOLVI = 1000;   // chi risolve prende almeno 1.000
  var T_MOSSA = 15000, T_RISOLVI = 45000;          // online: tempo per decidere (poi perde il turno)
  var T_GIRO = 3400;                               // quanto gira la ruota
  var SIGLA_CORTA = 2600;                          // quando si rigioca: niente presentazione lunga
  // ---- i round speciali ----
  var PREMIO_LAMPO = 1000;                         // la frase lampo (Prenota): premio fisso, nel totale della partita
  var LAMPO_PRIMA = 1600, LAMPO_PASSO = 1800;      // la prima lettera, poi una ogni 1,8 secondi
  var LAMPO_FINESTRA = 500;                        // online: dal primo "Prenoto!" arrivato si aspettano gli altri per mezzo secondo
  var LAMPO_RIFLESSI = 150;                        // nessuno è più veloce di così (un tempo più basso non vale)
  var T_LAMPO_RISOLVI = 20000, LAMPO_ULTIMA = 5000;   // tempo per scriverla; uscite tutte le lettere, quanto si aspetta ancora
  var TRI_BONUS = 2000, CRUCI_PAROLA = 500;           // il Triplete (tutte e 3 alla stessa persona) e ogni parola del CruciRuota
  var LAMPO_PRIMA_TEMA = 3400, CRUCI_PASSO = 1100;  // i giochi a tema: un attimo in più per leggere cosa sono; il CruciRuota ha tante lettere
  var SCALETTA = ["classica", "tempo", "mondo", "triplete", "cruci"];
  var EXPRESS_V = 1000;                            // l'Express: ogni consonante vale 1.000
  var BONUS_VELOCE = 1000;                         // il round veloce: lo spicchio + 1.000 a consonante
  var T_VEL_LETTERA = 12000, T_VEL_DECIDI = 5000, T_VEL_RISOLVI = 20000;
  var FIN_DATE = ["R", "S", "T", "L", "N", "E"], FIN_CONS = 3, FIN_VOC = 1;   // la finale: lettere regalate e da scegliere
  var T_FIN_BUSTA = 20000, T_FIN_LETTERE = 30000, T_FIN_RISOLVI = 10000;
  var FIN_GRAZIA = 1500;
  // 🏆 la finale «delle meraviglie» (come quella di adesso in TV): 60 secondi in tutto per 3 tabelloni.
  // 1) le lettere date + quelle scelte; 2) Testacoda: si vedono la prima e l'ultima lettera di ogni parola;
  // 3) Rubasecondi: si chiamano lettere a volontà (una vocale sola), ma ogni lettera che non c'è toglie 3 secondi.
  // Per ogni frase risolta si sceglie una busta (al massimo 3): si vince la più ricca.
  var FIN_TOT = 60000, FIN_RUBA = 3000, FIN_TABELLONI = 3;
  var FIN_NOMI = ["Le tue lettere", "Testacoda", "Rubasecondi"];                           // online: la soluzione arriva un po' dopo, non la si perde per la rete
  var BUSTE = [500, 1000, 1000, 2000, 5000];       // le buste della finale, in Speed Coins (contro il computer un decimo)
  var PREMIO_MAX = 5000;
  // i momenti che vanno avanti da soli (l'host aspetta tanto così)
  var DURATE = { girando: T_GIRO, finemanche: 4500, lampofine: 3800, vgiro: 3000, fintro: 6000, frivela: 2600, fcambio: 2800, fesito: 7500, mapre: 1800, mrivela: 3200 };
  var FASI_FIN = ["fintro", "fbusta", "flettere", "frivela", "ftempo", "fcambio", "fesito"];
  var VOCALI = ["A", "E", "I", "O", "U"];
  var CONSONANTI = "BCDFGHJKLMNPQRSTVWXYZ".split("");
  var FREQ_C = "NRTLSCDMPVGBFZHQKJWXY".split("");   // consonanti dalla più frequente in italiano
  var FREQ_V = ["E", "A", "I", "O", "U"];
  // i bot: quelli del gruppo fisso (SG.bot: sempre gli stessi nomi e avatar in tutti i giochi), scelti per la bravura;
  // escludi = i nomi di chi gioca e gli id dei bot già alla ruota
  function prendiBot(livello, escludi) {
    var b = null;
    try { if (window.SG && SG.bot && SG.bot.prendi) b = SG.bot.prendi(1, { livello: livello, escludi: escludi })[0]; } catch (e) {}
    return b || null;
  }
  var COL = 12, RIGHE = 4;
  var PARTITE_SALVATE = {}, INCASSI = {};
  // la ruota: 24 spicchi (valori, 2 Bancarotta, 1 Passa, 1 Jolly, 1 Raddoppia (i soldi della manche × 2); con l'Express uno dei 300 diventa "Express")
  var SPICCHI = [
    { v: 500 }, { s: "raddoppia" }, { s: "bancarotta" }, { v: 700 }, { v: 400 }, { v: 250 },
    { v: 800 }, { s: "passa" }, { v: 350 }, { v: 600 }, { v: 1000 }, { v: 300 },
    { s: "jolly" }, { v: 450 }, { v: 200 }, { v: 900 }, { s: "bancarotta" }, { v: 500 },
    { v: 650 }, { v: 2000 }, { v: 400 }, { v: 550 }, { v: 300 }, { v: 750 }
  ];
  var POSTO_EXPRESS = 11;
  // ❓ lo spicchio Mistero (nelle ultime due manche normali): un 300 diventa Mistero; si gioca come un 1.000 e,
  // se la consonante c'è, si può aprire: metà delle volte +10.000, metà Bancarotta. Aperto, torna un 1.000 normale.
  var POSTO_MISTERO = 22, MIST_V = 1000, MIST_PREMIO = 10000;
  // 🔒 «La so!»: chi aspetta il suo turno blocca in segreto la soluzione; se era giusta, quando la manche finisce prende
  // un premio tanto più grande quanto meno lettere c'erano (da SEG_MIN a SEG_MAX), una volta per manche, mai nei giochi veloci
  var SEG_MAX = 1500, SEG_MIN = 200;
  var FASI_SEG = ["gira", "girando", "consonante", "vocale", "risolvi", "sceltaexp", "express", "mistero", "mapre", "mrivela", "vgiro", "vlettera", "vdecidi"];
  var T_RIEPILOGO = 10000;                         // online: il riepilogo di fine manche (o subito, se più di metà tocca «⏩ Avanti»)
  // mist: null (niente Mistero), "on" (da aprire), "aperto" (già aperto: vale 1.000)
  function spicchiDi(express, mist) {
    return SPICCHI.map(function (s, i) {
      if (express && i === POSTO_EXPRESS) return { s: "express", v: EXPRESS_V };
      if (mist && i === POSTO_MISTERO) return mist === "aperto" ? { v: MIST_V } : { s: "mistero", v: MIST_V };
      return s;
    });
  }
  // ✍️ le frasi degli amici: devono stare nel tabellone come quelle del gioco
  var NOSTRE_KEY = "sg-ruota-nostre", NOSTRE_MAX = 5, CODA_MAX = 8, MIN_LETTERE = 8, CAT_MAX = 24;
  var SOSTITUISCI = { "’": "'", "‘": "'", "`": "'", "´": "'", "Á": "À", "Í": "Ì", "Ó": "Ò", "Ú": "Ù", "Ê": "E", "Ë": "E", "Î": "I", "Ô": "O", "Û": "U", "Â": "A", "Ä": "A", "Ö": "O", "Ü": "U", "Ï": "I" };
  // controlla una frase scritta da un amico: { ok: true, c, f } oppure { err: "perché non va" }
  function controllaFrase(cat, frase) {
    var c = String(cat || "").replace(/[\u0000-\u001f<>]/g, "").replace(/\s+/g, " ").trim();
    var f = String(frase || "").toUpperCase().replace(/[’‘`´ÁÍÓÚÊËÎÔÛÂÄÖÜÏ]/g, function (x) { return SOSTITUISCI[x] || x; }).replace(/\s+/g, " ").trim();
    if (!c) return { err: "Scrivi la categoria (es. «Il motto di Paky»)" };
    if (c.length > CAT_MAX) return { err: "Categoria troppo lunga: al massimo " + CAT_MAX + " caratteri" };
    if (!f) return { err: "Scrivi la frase" };
    var strano = f.replace(/[A-ZÀÈÉÌÒÙ' !?,.\-]/g, "");
    if (strano) return { err: "Il tabellone non sa mostrare «" + strano.charAt(0) + "»: solo lettere, spazi e ' ! ? , . -" };
    var lunga = f.split(" ").filter(function (w) { return w.length > COL; })[0];
    if (lunga) return { err: "«" + lunga + "» è troppo lunga: ogni parola al massimo " + COL + " lettere" };
    if (righe(f).length > RIGHE) return { err: "Non sta nel tabellone: al massimo " + RIGHE + " righe da " + COL + " caselle. Accorciala un po'" };
    if (solo(f).length < MIN_LETTERE) return { err: "Troppo corta: servono almeno " + MIN_LETTERE + " lettere" };
    return { ok: true, c: c, f: f };
  }
  function leggiNostre() {
    var l = [];
    try { l = JSON.parse(localStorage.getItem(NOSTRE_KEY) || "[]") || []; } catch (e) {}
    return (Array.isArray(l) ? l : []).map(function (x) { return x && controllaFrase(x.c, x.f); }).filter(function (x) { return x && x.ok; }).slice(0, NOSTRE_MAX).map(function (x) { return { c: x.c, f: x.f }; });
  }
  function salvaNostre(l) { try { localStorage.setItem(NOSTRE_KEY, JSON.stringify(l.slice(0, NOSTRE_MAX))); } catch (e) {} }
  var COLORI = ["#d81c57", "#d4621c", "#e3a21a", "#17936a", "#1783b3", "#6644cc"];   // notte: lampone, arancio, oro, verde notte, ciano, viola (spicchi un po' più profondi del cartone di prima)
  var COLORI_TESTO = { "#e3a21a": "#1a1226" };   // sull'oro la scritta è scura (sennò non si legge)
  var ACC = { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" };
  var FRASI_RISERVA = [
    { c: "Proverbi", f: "CHI DORME NON PIGLIA PESCI" }, { c: "Proverbi", f: "TRA IL DIRE E IL FARE C'È DI MEZZO IL MARE" },
    { c: "Modi di dire", f: "AVERE LE MANI IN PASTA" }, { c: "Cibo e cucina", f: "SPAGHETTI ALLA CARBONARA" },
    { c: "Luoghi", f: "LA TORRE DI PISA" }, { c: "Cose di casa", f: "LA LAVATRICE NUOVA" },
    { c: "Sport", f: "CALCIO DI RIGORE" }, { c: "In vacanza", f: "OMBRELLONE IN SPIAGGIA" },
    { c: "Animali", f: "IL GATTO NERO" }, { c: "Cose di casa", f: "IL CUSCINO" }
  ];

  function base(ch) { return ACC[ch] || ch; }
  // la firma della frase degli amici: "" = scritta nel ⚙️ (da voi), se no il nome di chi l'ha mandata
  function firmaTesto(f) { return f ? "✍️ di " + f : "✍️ scritta da voi"; }
  function eLettera(ch) { return /^[A-ZÀÈÉÌÒÙ]$/.test(ch); }
  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function mischiaArr(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }
  function stessoNome(a, b) { return String(a || "").trim().toLowerCase() === String(b || "").trim().toLowerCase(); }
  function profiloAttivo() {
    try { if (window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo) return SGNube.profilo() || null; } catch (e) {}
    return null;
  }
  // i trofei: si salvano quando la classifica è pronta (anche se poi c'è la finale), una volta per partita
  function salvaTrofei(vm, giocatoreId, modo, liv) {
    try {
      if (modo === "prova" || !vm || !vm.classifica || !vm.statFine || !vm.gameId) return;
      var profilo = profiloAttivo(); if (!profilo || !SGNube.salvaProgressi) return;
      var lista = vm.giocatori || [];
      // giocatoreId = il giocatore di questo telefono (host o amico online, tu contro i bot).
      // Sullo stesso telefono si cerca il nome del profilo; se non c'è, si conta almeno la partita giocata.
      var giocatore = giocatoreId ? lista.filter(function (p) { return p.id === giocatoreId; })[0] :
        lista.filter(function (p) { return stessoNome(p.nome, profilo.nome); })[0];
      if (!giocatore && giocatoreId) return;
      var idGiocatore = giocatore ? giocatore.id : null;
      var chiave = "ruota|" + vm.gameId + "|" + String(profilo.uid || profilo.nome).trim().toLowerCase();
      if (PARTITE_SALVATE[chiave]) return;
      var chiaveSalvataggio = "sg-ruota-ultima-partita-" + String(profilo.uid || profilo.nome).trim().toLowerCase();
      try { if (window.localStorage && localStorage.getItem(chiaveSalvataggio) === String(vm.gameId)) { PARTITE_SALVATE[chiave] = 1; return; } } catch (e) {}
      var s = (vm.statFine || {})[idGiocatore] || {}, esito = (vm.classifica || []).filter(function (r) { return r.id === idGiocatore; })[0], vinta = !!(esito && esito.pos === 1);
      var incrs = [["partite", 1]], record = [];
      ["giri", "consonantiIndovinate", "vocaliIndovinate", "frasiRisolte"].forEach(function (k) {
        if (+s[k] > 0) incrs.push([k, +s[k]]);
      });
      if ((modo !== "bot" || liv !== "facile") && +s.mancheDa5000 > 0) incrs.push(["mancheDa5000", +s.mancheDa5000]);
      if (vinta) {
        if (modo !== "bot" || liv !== "facile") incrs.push(["vittorieSfida", 1]);
        if (modo === "bot" && liv === "medio") incrs.push(["vittorieMedio", 1]);
        if (modo === "bot" && liv === "difficile") {
          incrs.push(["vittorieDifficile", 1]);
          if (!s.bancarotte) incrs.push(["vittorieDifficileSenzaBancarotta", 1]);
          if (s.mancheVinte === vm.mancheTot && vm.mancheTot >= 3) incrs.push(["vittorieDifficileTutteLeManche", 1]);
        }
      }
      PARTITE_SALVATE[chiave] = 1;
      try { if (window.localStorage) localStorage.setItem(chiaveSalvataggio, String(vm.gameId)); } catch (e) {}
      SGNube.salvaProgressi(null, ID, incrs, record, []);
    } catch (e) {}
  }
  // la finale vinta: le Speed Coins vanno a chi ha un profilo, sul SUO telefono, una volta sola per partita.
  // Restituisce "ok" (incassate), "gia" (già incassate), "noprofilo".
  function incassa(gameId, premio) {
    premio = Math.max(0, Math.min(PREMIO_MAX, Math.round(+premio || 0)));
    if (!gameId || !premio) return null;
    if (INCASSI[gameId]) return INCASSI[gameId];
    var p = profiloAttivo();
    if (!p || !SGNube.cambiaMonete) return (INCASSI[gameId] = "noprofilo");
    var k = "sg-ruota-premio|" + gameId;
    try { if (localStorage.getItem(k)) return (INCASSI[gameId] = "ok"); localStorage.setItem(k, "1"); } catch (e) {}
    INCASSI[gameId] = "ok";
    try { SGNube.cambiaMonete(premio); } catch (e) {}
    return "ok";
  }
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function frasi() { var f = window.SG_RUOTA_FRASI; return f && f.length ? f : FRASI_RISERVA; }
  function solo(testo) { return String(testo || "").toUpperCase().split("").map(base).filter(function (c) { return /[A-Z]/.test(c); }).join(""); }
  // le frasi giuste per la finale (le più corte: si devono poter risolvere in 10 secondi) e per la frase lampo
  function corta(x) { var s = solo(x.f); return s.length >= 8 && s.length <= 13 && String(x.f).split(" ").length <= 3 && !/[JKWXY]/.test(s); }
  function media(x) { var n = solo(x.f).length; return n >= 10 && n <= 20; }
  function lampoOk(x) { return !!x.l || media(x); }   // le frasi lampo: quelle medie, più le famose e corte (l: 1) che nelle manche si indovinerebbero subito
  // i contenuti dei giochi a tema (data/ruota-speciali.js) e la frase che finisce sul tabellone
  function listaSp(tipo) { var l = tipo === "tempo" ? window.SG_RUOTA_TEMPO : tipo === "mondo" ? window.SG_RUOTA_MONDO : tipo === "cruci" ? window.SG_RUOTA_CRUCI : null; return Array.isArray(l) ? l : []; }
  function chiaveSp(tipo, it) { return tipo === "cruci" ? it.p.join("|").toUpperCase() : String(it.f).toUpperCase(); }
  function annoTesto(a) { a = Math.round(+a || 0); return a < 0 ? -a + " a.C." : String(a); }   // (gli anni senza il punto delle migliaia)
  // il tabellone: righe da 12 caselle, a capo tra una parola e l'altra
  function righe(frase) {
    var out = [], riga = "";
    frase.split(" ").forEach(function (w) {
      if (!riga) riga = w;
      else if ((riga + " " + w).length <= COL) riga += " " + w;
      else { out.push(riga); riga = w; }
    });
    if (riga) out.push(riga);
    return out;
  }
  // le stesse righe, come pezzi della frase (da dove partono e quanto sono lunghe): così ogni casella sa che lettera è
  function righeIdx(frase) {
    var out = [], i = 0, cur = null;
    if (frase.indexOf("|") >= 0) { frase.split("|").forEach(function (w) { out.push({ start: i, len: w.length }); i += w.length + 1; }); return out; }   // il CruciRuota: una parola per riga
    frase.split(" ").forEach(function (w) {
      if (cur && cur.len + 1 + w.length <= COL) cur.len += 1 + w.length;
      else { if (cur) out.push(cur); cur = { start: i, len: w.length }; }
      i += w.length + 1;
    });
    if (cur) out.push(cur);
    return out;
  }
  // la frase con le lettere non ancora uscite al posto "_" (è questa che viaggia online)
  function coperta(frase, rivelate) {
    return frase.split("").map(function (ch) { return eLettera(ch) && !rivelate[base(ch)] ? "_" : ch; }).join("");
  }
  // le ultime frasi uscite su questo telefono: tra una partita e l'altra non tornano subito
  // (30 ott 2026: si ricordano TUTTE, fino a 5.000, come impronte corte; online anche quelle viste dagli amici che giocano)
  var VISTE_KEY = "sg-ruota-viste", VISTE_MAX = 5000, VISTE_AMICI = 800;
  function impronta(frase) {   // 6-7 caratteri al posto della frase intera (le frasi vecchie salvate intere si convertono da sole)
    var s = String(frase || "").toUpperCase(), h = 2166136261;
    for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    return (h >>> 0).toString(36);
  }
  function listaViste() {
    try { return (JSON.parse(localStorage.getItem(VISTE_KEY) || "[]") || []).map(function (f) { return String(f).length > 8 ? impronta(f) : String(f); }); } catch (e) { return []; }
  }
  function frasiViste() { var o = {}; listaViste().forEach(function (h) { o[h] = 1; }); return o; }
  function segnaVista(frase) {
    try {
      var h = impronta(frase), l = listaViste().filter(function (x) { return x !== h; });
      l.push(h); localStorage.setItem(VISTE_KEY, JSON.stringify(l.slice(-VISTE_MAX)));
    } catch (e) {}
  }

  // =========================================================
  //  MOTORE (uguale contro il computer, sullo stesso telefono e per l'host online)
  // =========================================================
  function creaPartita(giocatori, mancheTot, regole) {
    var cfg = regole || {};
    var RG = { prenota: !!cfg.prenota, express: !!cfg.express, veloce: !!cfg.veloce && mancheTot >= 2, finale: !!cfg.finale, mistero: !!cfg.mistero, frasi: cfg.frasi === "nostre" ? "nostre" : "gioco" };
    var P = { giocatori: giocatori.map(function (g) { return { id: g.id, nome: g.nome, bot: !!g.bot, omino: g.omino || null, totale: 0, soldi: 0, jolly: 0, via: false,
      stat: { giri: 0, consonantiIndovinate: 0, vocaliIndovinate: 0, frasiRisolte: 0, mancheVinte: 0, mancheDa5000: 0, bancarotte: 0, lampo: 0, finali: 0 } }; }),
      modo: cfg.modo || "bot", difficolta: cfg.difficolta || "medio", regole: RG, spicchi: spicchiDi(RG.express), decimo: !!cfg.decimo,
      mancheTot: mancheTot, manche: 0, turno: 0, fase: "pronti", frase: "", cat: "", rivelate: {}, chiamate: {},
      spicchio: -1, angolo: 0, giroN: 0, msg: "", ultime: [], usate: {}, catUsate: {}, vince: null, classifica: null, ev: null,
      lampo: null, exp: false, expTot: 0, veloce: false, velValore: 0, fin: null,
      mist: null, mres: null, firma: null, ultimaAmica: false, amiche: 0, segrete: {},
      // la scaletta dei giochi veloci: in ordine sparso, solo quelli che hanno i contenuti
      scaletta: window.__RUOTA_SCALETTA ? window.__RUOTA_SCALETTA.slice() : mischiaArr(SCALETTA.filter(function (t) { return t === "classica" || t === "triplete" || listaSp(t).length; })) };
    // il Mistero: chi lo apre vince o va in Bancarotta, a sorte (lo decide l'host solo quando viene aperto). Per le prove si può forzare.
    P.sorteMistero = function () { return Math.random() < 0.5; };
    function g() { return P.giocatori[P.turno]; }
    function trova(id) { for (var i = 0; i < P.giocatori.length; i++) if (P.giocatori[i].id === id) return P.giocatori[i]; return null; }
    P.trova = trova;
    function ev(t, id) { P.ev = { n: (P.ev ? P.ev.n : 0) + 1, t: t, id: id || null }; }   // un fatto da far vedere e sentire a tutti
    function occ(L) { var n = 0; P.frase.split("").forEach(function (ch) { if (eLettera(ch) && base(ch) === L) n++; }); return n; }
    function nascoste(lista) { var n = 0; P.frase.split("").forEach(function (ch) { var b = base(ch); if (eLettera(ch) && !P.rivelate[b] && lista.indexOf(b) >= 0) n++; }); return n; }
    P.consonantiNascoste = function () { return nascoste(CONSONANTI); };
    P.vocaliNascoste = function () { return nascoste(VOCALI); };
    P.tutteFuori = function () { return P.consonantiNascoste() + P.vocaliNascoste() === 0; };
    P.occ = occ;
    function attivi() { return P.giocatori.filter(function (x) { return !x.via; }); }
    // una frase dalla lista (filtro: le corte per la finale, le medie per la frase lampo); mai due volte nella stessa partita
    // le frasi già viste: su questo telefono e (online) da chi gioca con me
    function giaVista() {
      var v = frasiViste(), a = cfg.visteAmici ? cfg.visteAmici() || {} : {};
      return function (testo) { var h = impronta(testo); return !!(v[h] || a[h]); };
    }
    function pesca(filtro) {
      var lista = frasi(), cand = [], vista = giaVista();
      function ok(x, i) { return !P.usate[i] && (!filtro || filtro(x)); }
      // meglio una categoria nuova per ogni manche (se ce ne sono ancora)
      lista.forEach(function (x, i) { if (ok(x, i) && !vista(x.f) && !P.catUsate[x.c]) cand.push(i); });
      if (!cand.length) lista.forEach(function (x, i) { if (ok(x, i) && !vista(x.f)) cand.push(i); });
      if (!cand.length) lista.forEach(function (x, i) { if (ok(x, i)) cand.push(i); });   // viste tutte: si riparte
      if (!cand.length) lista.forEach(function (x, i) { if (!filtro || filtro(x)) cand.push(i); });
      if (!cand.length) cand = lista.map(function (x, i) { return i; });
      var i = cand[Math.floor(Math.random() * cand.length)]; P.usate[i] = 1; P.catUsate[lista[i].c] = 1;
      var f = String(lista[i].f).toUpperCase();
      segnaVista(f);
      return { f: f, c: lista[i].c };
    }
    // ---- i giochi veloci della scaletta (uno prima di ogni manche, come in TV) ----
    // i contenuti dei giochi a tema (data/ruota-speciali.js): mai due volte nella stessa partita, meglio se mai visti
    function pescaSp(tipo) {
      var l = listaSp(tipo), cand = [], vista = giaVista();
      P.usateSp = P.usateSp || {};
      l.forEach(function (it, i) { if (!P.usateSp[tipo + i] && !vista(chiaveSp(tipo, it))) cand.push(i); });
      if (!cand.length) l.forEach(function (it, i) { if (!P.usateSp[tipo + i]) cand.push(i); });
      if (!cand.length) return null;
      var i = cand[Math.floor(Math.random() * cand.length)]; P.usateSp[tipo + i] = 1;
      segnaVista(chiaveSp(tipo, l[i]));
      return l[i];
    }
    // il Triplete: un argomento con almeno 3 frasi lampo ancora libere (meglio uno non ancora uscito)
    function catTriplete() {
      var lista = frasi(), vista = giaVista(), n = {}, nuove = [], tutte = [];
      lista.forEach(function (x, i) { if (!P.usate[i] && lampoOk(x) && !vista(x.f)) n[x.c] = (n[x.c] || 0) + 1; });
      Object.keys(n).forEach(function (c) { if (n[c] >= 3) { tutte.push(c); if (!P.catUsate[c]) nuove.push(c); } });
      var l = nuove.length ? nuove : tutte;
      return l.length ? l[Math.floor(Math.random() * l.length)] : null;
    }
    function nuovoLampo(tipo, tri) {
      var fr = null, cat = "", it, x;
      if (tipo === "tempo" && (it = pescaSp("tempo"))) { fr = String(it.f).toUpperCase(); cat = annoTesto(it.anno); }
      else if (tipo === "mondo" && (it = pescaSp("mondo"))) { fr = String(it.f).toUpperCase(); cat = it.paese + ": " + String(it.parola).toUpperCase(); }
      else if (tipo === "cruci" && (it = pescaSp("cruci"))) { fr = chiaveSp("cruci", it); cat = it.c; }
      else if (tipo === "triplete") {
        var c = tri ? tri.c : catTriplete();
        if (c) { x = pesca(function (y) { return lampoOk(y) && y.c === c; }); fr = x.f; cat = x.c; tri = tri || { n: 0, di: 3, c: c, vinti: {}, ultimo: null }; tri.n++; }
      }
      if (!fr) { x = pesca(lampoOk); fr = x.f; cat = x.c; tipo = "classica"; tri = null; }
      var pos = [];
      fr.split("").forEach(function (ch, k) { if (eLettera(ch)) pos.push(k); });
      var L = { tipo: tipo, frase: fr, cat: cat, pos: mischiaArr(pos), n: 0, T: [Date.now()], fuori: {}, chi: null, cand: [], prove: 0, vince: null };
      if (tri) L.tri = tri;
      if (tipo === "cruci") { L.ok = [0, 0, 0, 0]; L.parole = {}; }
      return L;
    }
    function apriLampo(L) {
      P.lampo = L; P.fase = "lampo";
      P.msg = L.tipo === "tempo" ? "⏳ La ruota del tempo! Cosa è successo nel " + L.cat + "? Vale " + fmtN(PREMIO_LAMPO) :
        L.tipo === "mondo" ? "🌍 GiraMondo! Cosa vuol dire " + L.cat.split(": ")[1] + "? Vale " + fmtN(PREMIO_LAMPO) :
        L.tipo === "cruci" ? "🧩 CruciRuota! Quattro parole sul tema: " + fmtN(CRUCI_PAROLA) + " l'una" :
        L.tipo === "triplete" ? "🎯 Triplete, frase " + L.tri.n + " di 3: " + fmtN(PREMIO_LAMPO) + (L.tri.n === 1 ? " l'una, tutte e 3 alla stessa persona +" + fmtN(TRI_BONUS) : "") :
        "🔔 Frase lampo! Chi la sa prenota: vale " + fmtN(PREMIO_LAMPO) + " e comincia la manche";
    }
    function avantiTurno() {
      var n = P.giocatori.length;
      for (var k = 1; k <= n; k++) { var j = (P.turno + k) % n; if (!P.giocatori[j].via) { P.turno = j; return; } }
    }
    function prossimo() { avantiTurno(); P.exp = false; P.annullato = false; P.fase = P.veloce ? "vlettera" : "gira"; }
    // lettera sbagliata, Passa o soluzione sbagliata: il Jolly fa giocare ancora (non salva da Bancarotta e tempo scaduto)
    function perdeTurno(msg) {
      var p = g();
      if (p.jolly > 0 && !P.veloce) { p.jolly--; P.msg = msg + " Ma c'è il Jolly: " + p.nome + " gioca ancora!"; P.fase = "gira"; return; }
      P.msg = msg; prossimo();
    }
    // l'Express è finito male: Bancarotta (il Jolly non salva)
    function bancarottaExpress(msg) {
      var p = g(); p.soldi = 0; p.stat.bancarotte++;
      ev("bancarotta", p.id);
      P.msg = msg + " 💥 Bancarotta per " + p.nome + "!"; prossimo();
    }
    function giraVerso(i) {
      var meta = (360 - ((i + 0.5) * 15 + (Math.random() * 9 - 4.5)) % 360) % 360;   // lo spicchio i sotto la freccia (in alto)
      var giri = 4 + Math.floor(Math.random() * 2);
      P.angolo = P.angolo + giri * 360 + ((meta - (P.angolo % 360)) + 720) % 360;
      P.spicchio = i; P.giroN++; P.fase = "girando"; P.ultime = [];
    }
    P.nuovaManche = function () {
      P.manche++;
      // ✍️ una manche su due al massimo con una frase degli amici (se ce ne sono)
      var fr = RG.frasi === "nostre" && !P.ultimaAmica && cfg.amica ? cfg.amica(P) : null;
      P.ultimaAmica = !!fr; if (fr) P.amiche++;
      if (!fr) fr = pesca(function (x) { return !x.l; });   // (le frasi famose e corte, l: 1, solo nei giochi veloci)
      P.frase = fr.f; P.cat = fr.c; P.firma = fr.firma != null ? fr.firma : null;
      P.rivelate = {}; P.chiamate = {}; P.ultime = []; P.vince = null; P.spicchio = -1; P.annullato = false; P.exp = false; P.expTot = 0; P.segrete = {};
      P.veloce = RG.veloce && P.manche === P.mancheTot; P.velValore = 0;
      // ❓ il Mistero nelle ultime due manche normali (mai nel round veloce né nella finale)
      var ultimaN = RG.veloce ? P.mancheTot - 1 : P.mancheTot;
      P.mist = RG.mistero && !P.veloce && P.manche >= ultimaN - 1 && P.manche <= ultimaN ? "on" : null; P.mres = null;
      P.spicchi = spicchiDi(RG.express, P.mist);
      P.giocatori.forEach(function (x) { x.soldi = 0; x.jolly = 0; });
      P.turno = (P.manche - 1) % P.giocatori.length; if (P.giocatori[P.turno].via) avantiTurno();
      if (RG.prenota) apriLampo(nuovoLampo(P.scaletta[(P.manche - 1) % P.scaletta.length], null));
      else iniziaManche();
    };
    function iniziaManche() {
      P.lampo = null;
      if (P.giocatori[P.turno].via) avantiTurno();
      if (P.veloce) { P.fase = "vgiro"; P.msg = "⚡ Ultimo round, veloce! La ruota gira una volta sola…"; }
      else { P.fase = "gira"; P.msg = "Manche " + P.manche + " di " + P.mancheTot + ": " + P.cat + (P.firma != null ? " · " + firmaTesto(P.firma) : "") + (P.mist ? " · ❓ c'è il Mistero!" : ""); }
    }

    // ---- PRENOTA, la frase lampo ----
    P.lampoTab = function () {
      var L = P.lampo, vis = {}, tutta = P.fase === "lampofine";
      for (var k = 0; k < L.n; k++) vis[L.pos[k]] = 1;
      if (L.ok) { var rg = 0; L.frase.split("").forEach(function (ch, i) { if (ch === "|") rg++; else if (L.ok[rg]) vis[i] = 1; }); }
      return L.frase.split("").map(function (ch, i) { return eLettera(ch) && !vis[i] && !tutta ? "_" : ch; }).join("");
    };
    P.lampoRivela = function () {   // compare una lettera (in un posto a caso)
      var L = P.lampo;
      if (P.fase !== "lampo" || !L || L.chi || L.cand.length || L.n >= L.pos.length) return false;
      L.n++; L.T[L.n] = Date.now(); return true;
    };
    // "Prenoto!": n = l'ultima lettera che quel telefono ha visto, ms = quanto ci ha messo da quando l'ha vista
    // (misurato lì): così vince il più veloce di riflessi, non chi ha internet più veloce
    P.prenota = function (id, n, ms) {
      var L = P.lampo, p = trova(id), ora = Date.now();
      if (P.fase !== "lampo" || !L || L.chi || !p || p.via || L.fuori[id]) return false;
      if (L.cand.some(function (c) { return c.id === id; })) return false;
      n = Math.max(0, Math.min(L.n, Math.floor(+n || 0)));
      var t0 = L.T[n] || L.T[0], quanto = Math.max(LAMPO_RIFLESSI, Math.min(+ms || 0, ora - t0));
      L.cand.push({ id: id, a: t0 + quanto });
      return true;
    };
    P.lampoAssegna = function () {   // tra quelli arrivati, il più veloce
      var L = P.lampo; if (P.fase !== "lampo" || !L || L.chi || !L.cand.length) return null;
      var primo = L.cand.slice().sort(function (a, b) { return a.a - b.a; })[0];
      L.cand = []; L.chi = primo.id;
      var p = trova(primo.id);
      ev("prenota", p.id);
      P.msg = "🔔 " + p.nome + " prenota! Scrive la soluzione…";
      return primo.id;
    };
    function lampoFuori(id, pre) {
      var L = P.lampo, p = trova(id);
      L.fuori[id] = 1; L.chi = null; L.prove++;
      L.cand = L.cand.filter(function (c) { return c.id !== id; });
      ev("lampono", id);
      if (!attivi().some(function (x) { return !L.fuori[x.id]; })) { lampoChiudi(null, pre + " Nessuno l'ha indovinata: si gioca senza premio."); return; }
      P.msg = pre + " " + (p ? p.nome : "") + " è fuori da questa frase: le lettere ripartono!";
    }
    P.lampoSoluzione = function (id, testo) {
      var L = P.lampo; if (P.fase !== "lampo" || !L || L.chi !== id) return false;
      var p = trova(id);
      if (L.tipo === "cruci") { cruciSoluzione(p, testo); return true; }
      if (solo(testo) === solo(L.frase)) lampoChiudi(p, "🎉 " + p.nome + (L.tri ? " indovina la frase " + L.tri.n + " del Triplete! +" : L.tipo === "tempo" || L.tipo === "mondo" ? " indovina! +" : " indovina la frase lampo! +") + fmtN(PREMIO_LAMPO) + (L.tri && L.tri.n < L.tri.di ? "" : " e comincia la manche"));
      else lampoFuori(id, "❌ Sbagliato!");
      return true;
    };
    // 🧩 il CruciRuota: chi prenota scrive le parole che sa (anche una sola). Ogni parola giusta vale CRUCI_PAROLA e resta
    // scoperta; una parola scritta tutta e sbagliata (o nessuna parola) = fuori dal CruciRuota, come nella frase lampo
    function cruciSoluzione(p, testo) {
      var L = P.lampo, vere = L.frase.split("|"), scritte = String(testo || "").split("|"), nuove = [], sbagliata = false;
      vere.forEach(function (w, r) {
        if (L.ok[r]) return;
        var x = scritte[r] || "";
        if (x.indexOf("?") >= 0 || x.indexOf("_") >= 0 || solo(x).length !== solo(w).length) return;   // (parola lasciata vuota o a metà)
        if (solo(x) === solo(w)) nuove.push(r); else sbagliata = true;
      });
      if (sbagliata || !nuove.length) { lampoFuori(p.id, sbagliata ? "❌ Sbagliato!" : "🏳️ Nessuna parola!"); return; }
      nuove.forEach(function (r) { L.ok[r] = p.id; });
      // le lettere di quelle parole non escono più una per una
      var riga = []; var rg = 0; L.frase.split("").forEach(function (ch) { riga.push(rg); if (ch === "|") rg++; });
      L.pos = L.pos.slice(0, L.n).concat(L.pos.slice(L.n).filter(function (k) { return !L.ok[riga[k]]; }));
      var premio = CRUCI_PAROLA * nuove.length;
      p.totale += premio; p.stat.lampo++; L.parole[p.id] = (L.parole[p.id] || 0) + nuove.length; L.ultimo = p.id;
      L.chi = null; L.cand = []; L.prove++;
      ev("cruci", p.id);
      var dette = nuove.map(function (r) { return vere[r]; }), dette1 = dette.pop(); dette = dette.length ? dette.join(", ") + " e " + dette1 : dette1;
      if (L.ok.every(function (x) { return x; })) { lampoChiudi(null, "🧩 " + p.nome + " trova " + dette + "! +" + fmtN(premio) + " · CruciRuota finito!"); return; }
      P.msg = "✅ " + p.nome + " trova " + dette + "! +" + fmtN(premio) + " · le lettere ripartono";
    }
    P.lampoTempo = function () { var L = P.lampo; if (P.fase !== "lampo" || !L || !L.chi) return false; lampoFuori(L.chi, "⏰ Tempo scaduto!"); return true; };
    P.lampoRinuncia = function () { var L = P.lampo; if (P.fase !== "lampo" || !L || !L.chi) return false; lampoFuori(L.chi, "🏳️ Rinuncia!"); return true; };
    P.lampoNessuno = function () {
      var L = P.lampo; if (P.fase !== "lampo" || !L || L.chi || L.cand.length) return false;
      lampoChiudi(null, "Nessuno ha prenotato: si gioca senza premio."); return true;
    };
    function lampoChiudi(p, msg) {
      var L = P.lampo; L.chi = null; L.cand = [];
      if (L.tipo === "cruci") {   // comincia la manche chi ha trovato più parole (a pari merito chi ne ha trovata una per ultimo)
        var best = null;
        P.giocatori.forEach(function (x) { var n = L.parole[x.id] || 0; if (n && !x.via && (!best || n > (L.parole[best.id] || 0) || (n === (L.parole[best.id] || 0) && x.id === L.ultimo))) best = x; });
        if (best) { L.vince = best.id; P.turno = P.giocatori.indexOf(best); }
        P.fase = "lampofine"; P.msg = msg + (best ? " Comincia la manche " + best.nome + "." : "");
        return;
      }
      if (p) { p.totale += PREMIO_LAMPO; p.stat.lampo++; L.vince = p.id; P.turno = P.giocatori.indexOf(p); }
      var T = L.tri;
      if (T) {
        if (p) { T.vinti[p.id] = (T.vinti[p.id] || 0) + 1; T.ultimo = p.id; }
        if (T.n >= T.di) {   // l'ultima frase: tutte e 3 alla stessa persona = il bonus; comincia chi ne ha fatte di più
          var tutte = p && T.vinti[p.id] === T.di;
          if (tutte) { p.totale += TRI_BONUS; ev("triplete", p.id); msg += " 🎯 TRIPLETE! +" + fmtN(TRI_BONUS); }
          var mx = null;
          P.giocatori.forEach(function (x) { var n = T.vinti[x.id] || 0; if (n && !x.via && (!mx || n > (T.vinti[mx.id] || 0) || (n === (T.vinti[mx.id] || 0) && x.id === T.ultimo))) mx = x; });
          if (mx) { P.turno = P.giocatori.indexOf(mx); if (!p || mx !== p) msg += " Comincia la manche " + mx.nome + "."; }
        }
      }
      P.fase = "lampofine"; P.msg = msg;
    }
    P.dopoLampo = function () {
      if (P.fase !== "lampofine") return;
      var L = P.lampo;
      if (L && L.tri && L.tri.n < L.tri.di) return apriLampo(nuovoLampo("triplete", L.tri));   // 🎯 la prossima frase del Triplete
      iniziaManche();
    };

    P.puo = function () {   // cosa può fare chi è di turno
      var p = g(), f = P.fase;
      return { gira: f === "gira" && P.consonantiNascoste() > 0,
        compra: (f === "gira" || f === "express") && p.soldi >= COSTO_VOCALE && P.vocaliNascoste() > 0,
        risolvi: f === "gira" || f === "express" };
    };
    P.gira = function () {
      if (!P.puo().gira) return false;
      giraVerso(Math.floor(Math.random() * P.spicchi.length));
      g().stat.giri++; P.msg = g().nome + " gira la ruota…";
      return true;
    };
    // il round veloce: la ruota la gira il gioco, una volta sola, e si ferma sempre su una cifra
    P.giraVeloce = function () {
      if (P.fase !== "vgiro") return false;
      var vals = []; P.spicchi.forEach(function (s, i) { if (!s.s && s.v) vals.push(i); });
      giraVerso(vals[Math.floor(Math.random() * vals.length)]);
      P.msg = "⚡ La ruota gira una volta sola…";
      return true;
    };
    P.dopoGiro = function () {   // la ruota si è fermata
      if (P.fase !== "girando") return;
      var s = P.spicchi[P.spicchio], p = g();
      if (P.veloce) {
        P.velValore = (s.v || 500) + BONUS_VELOCE;
        if (p.via) avantiTurno();
        P.fase = "vlettera"; P.msg = "⚡ Ogni consonante vale " + fmtN(P.velValore) + "! " + g().nome + ": chiama una lettera";
        return;
      }
      if (p.via) { P.msg = "👋 " + p.nome + " ha lasciato la partita."; prossimo(); return; }   // ha girato ed è uscito: tocca al prossimo
      if (s.s === "express") { P.fase = "sceltaexp"; P.msg = "🚂 Express! " + p.nome + ": lo prendi o giochi " + fmtN(EXPRESS_V) + " a lettera?"; }
      else if (s.s === "mistero") { P.fase = "consonante"; P.msg = "❓ Mistero! " + p.nome + ": " + fmtN(MIST_V) + " a lettera. Se la consonante c'è, puoi aprirlo!"; }
      else if (s.v) { P.fase = "consonante"; P.msg = p.nome + ": " + fmtN(s.v) + " a lettera, scegli una consonante"; }
      else if (s.s === "bancarotta") { p.soldi = 0; p.stat.bancarotte++; P.msg = "💥 Bancarotta! " + p.nome + " perde i soldi della manche."; prossimo(); }
      else if (s.s === "passa") perdeTurno("⏭️ Passa! " + p.nome + " perde il turno.");
      else if (s.s === "raddoppia") {   // ✖️2 i soldi della manche raddoppiano (e si gira ancora)
        P.fase = "gira";
        if (p.soldi > 0) { p.soldi *= 2; ev("raddoppia", p.id); P.msg = "✖️2 Raddoppia! " + p.nome + " ora ha " + fmtN(p.soldi) + " nella manche e gira ancora!"; }
        else P.msg = "✖️2 Raddoppia… ma zero per due fa zero! " + p.nome + " gira ancora.";
      }
      else { p.jolly++; P.fase = "gira"; P.msg = "🃏 Jolly per " + p.nome + "! Lo tiene e gira ancora."; }
    };
    // ---- l'Express: lo prendi o giochi lo spicchio come uno normale ----
    P.sceltaExpress = function (si) {
      if (P.fase !== "sceltaexp") return false;
      var p = g();
      if (si) {
        P.exp = true; P.expTot = 0; P.fase = "express"; ev("express", p.id);
        P.msg = "🚂 " + p.nome + " sale sull'Express! " + fmtN(EXPRESS_V) + " a consonante senza girare. Un errore: Bancarotta!";
      } else { P.fase = "consonante"; P.msg = p.nome + ": " + fmtN(EXPRESS_V) + " a lettera, scegli una consonante"; }
      return true;
    };
    // ---- ❓ il Mistero: tenersi i soldi o aprirlo ----
    P.mistero = function (apri) {
      if (P.fase !== "mistero") return false;
      var p = g();
      if (!apri) { P.fase = "gira"; P.msg = "💰 " + p.nome + " si tiene i soldi: il Mistero resta chiuso."; return true; }
      P.fase = "mapre"; P.msg = "❓ " + p.nome + " apre il Mistero… +" + fmtN(MIST_PREMIO) + " o Bancarotta?"; ev("mapre", p.id);
      return true;
    };
    // si apre: l'host decide adesso (prima non lo sa nessuno, nemmeno la foto)
    P.mistRivela = function () {
      if (P.fase !== "mapre") return false;
      var p = g(), vinto = !!P.sorteMistero();
      P.mist = "aperto"; P.spicchi = spicchiDi(RG.express, P.mist);
      P.mres = { id: p.id, vinto: vinto };
      if (vinto) { p.soldi += MIST_PREMIO; P.msg = "❓ Mistero: +" + fmtN(MIST_PREMIO) + " per " + p.nome + "! 🎉"; ev("mvinto", p.id); }
      else { p.soldi = 0; p.stat.bancarotte++; P.msg = "❓ Mistero: Bancarotta per " + p.nome + "! 💥"; ev("mbanca", p.id); }
      P.fase = "mrivela";
      return true;
    };
    P.dopoMistero = function () {
      if (P.fase !== "mrivela") return;
      var p = g(), r = P.mres;
      if (p.via) { P.msg = "👋 " + p.nome + " ha lasciato la partita."; prossimo(); return; }
      if (r && r.vinto) { P.fase = "gira"; P.msg = "🎉 " + p.nome + " ha " + fmtN(p.soldi) + " nella manche e gira ancora!"; }
      else { P.msg = "💥 " + p.nome + " perde i soldi della manche."; prossimo(); }
    };
    P.consonante = function (L) {
      var inExp = P.fase === "express";
      if ((P.fase !== "consonante" && !inExp) || CONSONANTI.indexOf(L) < 0 || P.chiamate[L]) return false;
      var p = g(), n = occ(L), val = inExp ? EXPRESS_V : P.spicchi[P.spicchio].v;
      P.chiamate[L] = 1;
      if (n > 0) {
        P.rivelate[L] = 1; P.ultime = [L];
        if (P.modo !== "bot" || P.difficolta !== "facile") p.stat.consonantiIndovinate++;
        p.soldi += val * n; if (inExp) P.expTot += val * n;
        P.msg = p.nome + ": " + (n === 1 ? "c'è una " + L : "ci sono " + n + " " + L) + "! +" + fmtN(val * n) + (inExp ? " · Express: +" + fmtN(P.expTot) : "");
        if (P.tutteFuori()) return vinceManche(p), true;
        P.fase = inExp ? "express" : "gira";
        if (!inExp && (P.spicchi[P.spicchio] || {}).s === "mistero") {   // ❓ ora può aprire il Mistero
          P.fase = "mistero"; P.msg += " · ❓ Ti tieni i soldi o apri il Mistero?";
        }
      } else if (inExp) bancarottaExpress("Nessuna " + L + "!");
      else { ev("no", p.id); perdeTurno("Nessuna " + L + " per " + p.nome + "."); }
      return true;
    };
    P.compra = function () { if (!P.puo().compra) return false; g().soldi -= COSTO_VOCALE; P.fase = "vocale"; P.msg = g().nome + " compra una vocale…"; return true; };
    P.vocale = function (V) {
      if (P.fase !== "vocale" || VOCALI.indexOf(V) < 0 || P.chiamate[V]) return false;
      var p = g(), n = occ(V);
      P.chiamate[V] = 1;
      if (n > 0) {
        P.rivelate[V] = 1; P.ultime = [V];
        if (P.modo !== "bot" || P.difficolta !== "facile") p.stat.vocaliIndovinate++;
        P.msg = p.nome + ": " + (n === 1 ? "c'è una " + V : "ci sono " + n + " " + V) + "!";
        if (P.tutteFuori()) return vinceManche(p), true;
        P.fase = P.exp ? "express" : "gira";
      } else if (P.exp) bancarottaExpress("Nessuna " + V + "!");
      else { ev("no", p.id); perdeTurno("Nessuna " + V + " per " + p.nome + "."); }
      return true;
    };
    P.risolvi = function () { if (!P.puo().risolvi) return false; P.fase = "risolvi"; P.msg = g().nome + (P.exp ? " si ferma e prova a risolvere…" : " prova a risolvere…"); return true; };
    P.soluzione = function (testo) {
      if (P.fase !== "risolvi") return false;
      var p = g();
      if (solo(testo) === solo(P.frase)) { if (P.modo !== "bot" || P.difficolta !== "facile") p.stat.frasiRisolte++; vinceManche(p); }
      else if (P.exp) bancarottaExpress("❌ Soluzione sbagliata!");
      else if (P.veloce) { ev("no", p.id); P.msg = "❌ " + p.nome + " sbaglia la soluzione."; prossimo(); }
      else { ev("no", p.id); perdeTurno("❌ " + p.nome + " sbaglia la soluzione."); }
      return true;
    };
    // "Annulla" senza aver scritto niente: si torna a scegliere (una volta per turno), senza perdere il turno (non nel round veloce)
    P.annullaRisolvi = function () {
      if (P.fase !== "risolvi" || P.annullato || P.veloce) return false;
      P.annullato = true; P.fase = P.exp ? "express" : "gira"; P.msg = g().nome + " ci ripensa."; return true;
    };
    P.rinuncia = function (tempo) {   // tempo scaduto o rinuncia: perde il turno (sull'Express: Bancarotta)
      var f = P.fase, p = g();
      if (f === "sceltaexp") return P.sceltaExpress(false);   // nessuna scelta: si gioca lo spicchio normale
      if (f === "mistero") return P.mistero(false);           // nessuna scelta: si tiene i soldi
      if (P.exp && ["express", "vocale", "risolvi"].indexOf(f) >= 0) { bancarottaExpress(tempo ? "⏰ Tempo scaduto sull'Express!" : "🏳️ " + p.nome + " scende dall'Express."); return true; }
      if (P.veloce && ["vlettera", "vdecidi", "risolvi"].indexOf(f) >= 0) { P.msg = (tempo ? "⏰ Tempo scaduto: " : "🏳️ ") + p.nome + " passa la mano."; prossimo(); return true; }
      if (["gira", "consonante", "vocale", "risolvi"].indexOf(f) < 0) return false;
      P.msg = (tempo ? "⏰ Tempo scaduto: " : "🏳️ ") + p.nome + " perde il turno."; prossimo(); return true;
    };
    // ---- il round veloce: una lettera a testa (consonanti col valore della ruota, vocali gratis), poi 5 secondi per risolvere ----
    P.velLettera = function (L) {
      if (P.fase !== "vlettera" || !/^[A-Z]$/.test(L || "") || P.chiamate[L]) return false;
      var p = g(), n = occ(L), cons = CONSONANTI.indexOf(L) >= 0;
      P.chiamate[L] = 1;
      if (n > 0) {
        P.rivelate[L] = 1; P.ultime = [L];
        if (cons) { p.soldi += P.velValore * n; if (P.modo !== "bot" || P.difficolta !== "facile") p.stat.consonantiIndovinate++; }
        else if (P.modo !== "bot" || P.difficolta !== "facile") p.stat.vocaliIndovinate++;
        if (P.tutteFuori()) return vinceManche(p), true;
        P.fase = "vdecidi";
        P.msg = p.nome + ": " + (n === 1 ? "c'è una " + L : "ci sono " + n + " " + L) + "!" + (cons ? " +" + fmtN(P.velValore * n) : "") + " Risolve?";
      } else { ev("no", p.id); P.msg = "Nessuna " + L + " per " + p.nome + "."; prossimo(); }
      return true;
    };
    P.velRisolvi = function () { if (P.fase !== "vdecidi") return false; P.fase = "risolvi"; P.msg = g().nome + " prova a risolvere…"; return true; };
    P.velPassa = function (tempo) { if (P.fase !== "vdecidi") return false; P.msg = (tempo ? "⏰ " : "⏭️ ") + g().nome + " passa."; prossimo(); return true; };
    // 🔒 una soluzione bloccata in segreto (da chi non è di turno): resta solo all'host, nella foto va solo CHI l'ha bloccata
    P.puoSegreta = function (id) {
      var p = trova(id), tp = g();
      return !!p && !p.via && FASI_SEG.indexOf(P.fase) >= 0 && (!tp || tp.id !== id) && !P.segrete[id] && P.consonantiNascoste() + P.vocaliNascoste() > 0;
    };
    P.segreta = function (id, testo) {
      if (!P.puoSegreta(id)) return false;
      var t = String(testo || "").toUpperCase().slice(0, 80);
      if (solo(t).length !== solo(P.frase).length) return false;
      P.segrete[id] = { t: t, q: Math.round(quotaNota(P) * 100) / 100 };
      ev("segreta", id);
      return true;
    };
    function vinceManche(p) {
      // 🔒 prima di scoprire tutto: chi aveva bloccato la soluzione giusta
      var seg = [];
      Object.keys(P.segrete || {}).forEach(function (id) {
        var x = trova(id), s = P.segrete[id]; if (!x || !s) return;
        if (solo(s.t) === solo(P.frase)) {
          var b = Math.max(SEG_MIN, Math.round(SEG_MAX * (1 - s.q) / 50) * 50);
          x.totale += b; seg.push({ id: id, b: b, pct: Math.round(s.q * 100) });
        } else seg.push({ id: id, no: 1 });
      });
      CONSONANTI.concat(VOCALI).forEach(function (L) { P.rivelate[L] = 1; });
      var vincita = Math.max(p.soldi, MINIMO_RISOLVI);
      p.totale += vincita;
      p.stat.mancheVinte++;
      if (vincita >= 5000) p.stat.mancheDa5000++;
      P.giocatori.forEach(function (x) { if (x !== p) x.soldi = 0; });
      p.soldi = vincita; P.exp = false;
      P.vince = { id: p.id, vincita: vincita, frase: P.frase, seg: seg.length ? seg : undefined };
      P.fase = "finemanche"; P.msg = "🎉 " + p.nome + " risolve! +" + fmtN(vincita) + seg.filter(function (s) { return s.b; }).map(function (s) { return " · 🔒 " + trova(s.id).nome + " l'aveva capita: +" + fmtN(s.b); }).join("");
    }
    P.dopoManche = function () {
      if (P.fase !== "finemanche") return;
      if (P.manche >= P.mancheTot) {
        // chi è uscito a metà va in fondo, segnato "uscito"
        var dentro = P.giocatori.filter(function (x) { return !x.via; }).sort(function (a, b) { return b.totale - a.totale; });
        var fuori = P.giocatori.filter(function (x) { return x.via; });
        P.classifica = dentro.map(function (x) { return { id: x.id, nome: x.nome, punti: x.totale, pos: 1 + dentro.filter(function (q) { return q.totale > x.totale; }).length }; })
          .concat(fuori.map(function (x, k) { return { id: x.id, nome: x.nome, punti: x.totale, pos: dentro.length + 1 + k, uscito: true }; }));
        var primo = dentro[0];
        if (RG.finale && primo && !primo.bot) iniziaFinale(primo);   // se vince un bot, niente finale
        else { P.fase = "fine"; P.msg = ""; }
      } else P.nuovaManche();
    };
    // ---- la finale del campione ----
    function iniziaFinale(p) {
      P.lampo = null; P.exp = false; P.veloce = false; P.firma = null; P.mist = null; P.mres = null; P.vince = null;
      P.turno = P.giocatori.indexOf(p);
      P.fin = { id: p.id, nome: p.nome, premi: mischiaArr(BUSTE.map(function (v) { return P.decimo ? Math.round(v / 10) : v; })), buste: [], scelte: [], prove: 0,
        vinto: null, premio: 0, b: 1, risolte: 0, esiti: [], resta: FIN_TOT, da: 0, pen: 0, voc: 0, vis: null };
      nuovoTabellone();
      P.fase = "fintro"; P.msg = "🏆 " + p.nome + " vince la partita e gioca la finale: 60 secondi, 3 frasi!";
    }
    // la frase del tabellone di adesso (1: corta; 2, Testacoda: anche più lunga; 3: corta)
    function nuovoTabellone() {
      var F = P.fin, fr = pesca(F.b === 2 ? function (x) { return !x.l && media(x); } : corta);
      P.frase = fr.f; P.cat = fr.c; P.rivelate = {}; P.chiamate = {}; P.ultime = []; F.prove = 0; F.vis = null;
      if (F.b === 2) {   // Testacoda: la prima e l'ultima lettera di ogni parola
        F.vis = {}; var inizio = -1;
        P.frase.split("").concat([" "]).forEach(function (ch, k) {
          if (eLettera(ch)) { if (inizio < 0) inizio = k; return; }
          if (inizio >= 0) { F.vis[inizio] = 1; F.vis[k - 1] = 1; inizio = -1; }
        });
      }
    }
    P.finResta = function () { var F = P.fin; return !F ? 0 : P.fase === "ftempo" ? Math.max(0, F.resta - (Date.now() - F.da)) : F.resta; };
    P.finInizia = function () {
      if (P.fase !== "fintro") return false;
      FIN_DATE.forEach(function (L) { P.chiamate[L] = 1; if (occ(L)) P.rivelate[L] = 1; });
      P.ultime = FIN_DATE.slice();
      P.fase = "flettere"; P.msg = "Tabellone 1: ecco R S T L N E! " + P.fin.nome + ": scegli " + FIN_CONS + " consonanti e " + FIN_VOC + " vocale";
      return true;
    };
    function applicaScelte(lista) {
      P.fin.scelte = lista;
      lista.forEach(function (L) { P.chiamate[L] = 1; if (occ(L)) P.rivelate[L] = 1; });
      P.ultime = lista.slice();
      P.fase = "frivela"; P.msg = "Vediamo… " + lista.join(" ");
    }
    P.finLettere = function (lista) {
      if (P.fase !== "flettere" || !Array.isArray(lista)) return false;
      var c = [], v = [];
      lista.forEach(function (L) {
        L = String(L || "").toUpperCase();
        if (P.chiamate[L] || c.indexOf(L) >= 0 || v.indexOf(L) >= 0) return;
        if (CONSONANTI.indexOf(L) >= 0) c.push(L); else if (VOCALI.indexOf(L) >= 0) v.push(L);
      });
      if (c.length !== FIN_CONS || v.length !== FIN_VOC) return false;
      applicaScelte(c.concat(v)); return true;
    };
    P.finAuto = function () {   // tempo scaduto mentre sceglie: lettere più frequenti, buste a caso
      if (P.fase === "fbusta") {
        var libere = P.fin.premi.map(function (x, k) { return k; }).filter(function (k) { return P.fin.buste.indexOf(k) < 0; });
        return P.finBusta(libere[Math.floor(Math.random() * libere.length)]);
      }
      if (P.fase !== "flettere") return false;
      var c = FREQ_C.filter(function (L) { return !P.chiamate[L]; }).slice(0, FIN_CONS), v = FREQ_V.filter(function (L) { return !P.chiamate[L]; }).slice(0, FIN_VOC);
      applicaScelte(c.concat(v)); return true;
    };
    P.finVia = function () {   // il tempo comincia a scorrere (e si ferma solo tra un tabellone e l'altro)
      if (P.fase !== "frivela") return false;
      P.fase = "ftempo"; P.fin.da = Date.now();
      P.msg = "⏱️ " + P.fin.nome + ": " + Math.ceil(P.fin.resta / 1000) + " secondi per 3 frasi. Via!";
      return true;
    };
    function finTabelloneFatto(ok) {
      var F = P.fin;
      F.resta = P.finResta(); F.esiti.push(ok ? 1 : 0); if (ok) F.risolte++;
      CONSONANTI.concat(VOCALI).forEach(function (L) { P.rivelate[L] = 1; });
      if (F.b < FIN_TABELLONI && F.resta > 0) {
        P.fase = "fcambio";
        P.msg = (ok ? "✅ Risolta! " : "⏭️ Passata. ") + "Tabellone " + (F.b + 1) + ": " + FIN_NOMI[F.b] + "! Restano " + Math.ceil(F.resta / 1000) + " secondi";
        return;
      }
      finFineTabelloni(ok ? "✅ Risolta!" : F.resta > 0 ? "⏭️ Passata." : "⏰ Tempo scaduto!");
    }
    P.dopoCambio = function () {
      if (P.fase !== "fcambio") return;
      var F = P.fin; F.b++; nuovoTabellone();
      P.fase = "ftempo"; F.da = Date.now();
      P.msg = F.b === 2 ? "🔤 Testacoda: la prima e l'ultima lettera di ogni parola. Risolvi!" : "🕵️ Rubasecondi: chiama le lettere che vuoi (una vocale), ma ogni lettera che non c'è costa 3 secondi!";
    };
    function finFineTabelloni(pre) {
      var F = P.fin;
      CONSONANTI.concat(VOCALI).forEach(function (L) { P.rivelate[L] = 1; });
      if (!F.risolte) { finChiudi(false, pre + " Nessuna frase risolta: niente buste."); return; }
      P.fase = "fbusta";
      P.msg = pre + " " + F.nome + " ha risolto " + F.risolte + (F.risolte === 1 ? " frase: sceglie 1 busta!" : " frasi: sceglie " + Math.min(F.risolte, 3) + " buste, vince la più ricca!");
    }
    P.finSoluzione = function (testo) {
      if (P.fase !== "ftempo") return false;
      if (solo(testo) === solo(P.frase)) finTabelloneFatto(true);
      else { P.fin.prove++; ev("fino", P.fin.id); P.msg = "❌ No! Riprova, " + P.fin.nome + "!"; }
      return true;
    };
    P.finPassa = function () { if (P.fase !== "ftempo") return false; finTabelloneFatto(false); return true; };
    P.finTempo = function () {
      if (P.fase !== "ftempo") return false;
      var F = P.fin; F.resta = 0; F.esiti.push(0);
      finFineTabelloni("⏰ Tempo scaduto!"); return true;
    };
    // 🕵️ Rubasecondi: si chiamano lettere (consonanti a volontà, una vocale); una lettera che non c'è toglie 3 secondi
    P.finLettera = function (L) {
      var F = P.fin; L = String(L || "").toUpperCase();
      if (P.fase !== "ftempo" || F.b !== FIN_TABELLONI || P.chiamate[L] || !/^[A-Z]$/.test(L)) return false;
      var voc = VOCALI.indexOf(L) >= 0; if (voc && F.voc >= 1) return false;
      if (voc) F.voc++;
      P.chiamate[L] = 1;
      if (occ(L)) { P.rivelate[L] = 1; P.ultime = [L]; P.msg = "✅ C'è la " + L + "!"; if (P.tutteFuori()) finTabelloneFatto(true); return true; }
      F.resta = P.finResta() - FIN_RUBA; F.da = Date.now(); F.pen++; ev("ruba", F.id);
      P.msg = "❌ Niente " + L + ": −3 secondi!";
      if (F.resta <= 0) P.finTempo();
      return true;
    };
    P.finBusta = function (k) {
      k = Math.floor(+k); var F = P.fin;
      if (P.fase !== "fbusta" || !(k >= 0 && k < F.premi.length) || F.buste.indexOf(k) >= 0) return false;
      F.buste.push(k);
      if (F.buste.length >= Math.min(F.risolte, 3)) finChiudi(true, "🏆 " + F.nome + " apre " + (F.buste.length === 1 ? "la busta…" : "le buste…"));
      else P.msg = F.nome + ": ancora " + (Math.min(F.risolte, 3) - F.buste.length) + (Math.min(F.risolte, 3) - F.buste.length === 1 ? " busta" : " buste");
      return true;
    };
    function finChiudi(vinto, msg) {
      CONSONANTI.concat(VOCALI).forEach(function (L) { P.rivelate[L] = 1; });
      var F = P.fin;
      F.vinto = vinto; F.premio = vinto ? Math.max.apply(null, F.buste.map(function (k) { return F.premi[k] || 0; }).concat([0])) : 0;
      if (vinto) { F.busta = F.buste.filter(function (k) { return F.premi[k] === F.premio; })[0]; var pv = trova(F.id); if (pv) pv.stat.finali++; }   // (la busta che vince)
      P.fase = "fesito"; P.msg = msg;
    }
    P.dopoFinale = function () { if (P.fase === "fesito") { P.fase = "fine"; P.msg = ""; } };

    P.esce = function (id) {
      P.giocatori.forEach(function (x, i) {
        if (x.id !== id || x.via) return;
        x.via = true; x.soldi = 0; x.jolly = 0;
        var L = P.lampo;
        if (P.fase === "lampo" && L) {   // la frase lampo: chi esce non conta più
          L.cand = L.cand.filter(function (c) { return c.id !== id; });
          if (L.chi === id) lampoFuori(id, "👋 " + x.nome + " ha lasciato la partita.");
          else if (!attivi().some(function (y) { return !L.fuori[y.id]; })) lampoChiudi(null, "Nessuno l'ha indovinata: si gioca senza premio.");
          return;
        }
        if (P.fin && P.fin.id === id && FASI_FIN.indexOf(P.fase) >= 0 && P.fase !== "fesito") { P.fin.via = true; finChiudi(false, "👋 " + x.nome + " ha lasciato la finale."); return; }
        if (i === P.turno && ["gira", "consonante", "vocale", "risolvi", "sceltaexp", "express", "vlettera", "vdecidi", "mistero"].indexOf(P.fase) >= 0) { P.msg = "👋 " + x.nome + " ha lasciato la partita."; prossimo(); }
        // (se esce mentre la ruota gira, il turno passa quando si ferma: vedi dopoGiro)
      });
    };
    // chi era stato tolto (telefono spento più di 20 secondi) e torna: tiene il totale e rientra nel giro
    P.torna = function (id) {
      var ok = false;
      P.giocatori.forEach(function (x) { if (x.id === id && x.via) { x.via = false; x.soldi = 0; x.jolly = 0; ok = true; if (["finemanche", "lampofine"].indexOf(P.fase) < 0 && FASI_FIN.indexOf(P.fase) < 0) P.msg = "👋 " + x.nome + " è di nuovo in gioco!"; } });
      return ok;
    };
    // la foto: MAI la frase vera (solo coperta), finché non è risolta
    P.vista = function () {
      var tp = P.giocatori[P.turno], f = P.fase, L = P.lampo, inLampo = !!L && (f === "lampo" || f === "lampofine");
      var piena = f === "finemanche" || f === "fine" || f === "fesito";
      var v = { fase: f, manche: P.manche, mancheTot: P.mancheTot, cat: inLampo ? L.cat : P.cat,
        tab: inLampo ? P.lampoTab() : piena ? P.frase : P.fin && P.fin.vis ? P.frase.split("").map(function (ch, k) { return eLettera(ch) && !P.rivelate[base(ch)] && !P.fin.vis[k] ? "_" : ch; }).join("") : coperta(P.frase, P.rivelate),
        chiamate: inLampo ? [] : Object.keys(P.chiamate), ultime: inLampo ? [] : P.ultime.slice(), turno: tp ? tp.id : null, spicchio: P.spicchio, angolo: P.angolo, giroN: P.giroN, msg: P.msg, ev: P.ev,
        puo: tp ? P.puo() : null, indietro: f === "risolvi" && !P.annullato && !P.veloce, cons: P.consonantiNascoste(), voc: P.vocaliNascoste(), vince: P.vince, classifica: P.classifica,
        statFine: P.classifica ? P.giocatori.reduce(function (a, x) { a[x.id] = x.stat; return a; }, {}) : null,
        regole: RG, veloce: P.veloce || undefined, velValore: P.velValore || undefined, exp: P.exp || undefined, expTot: P.exp ? P.expTot : undefined, decimo: P.decimo || undefined,
        lock: Object.keys(P.segrete || {}).length ? Object.keys(P.segrete) : undefined,
        mist: P.mist || undefined, mres: f === "mrivela" && P.mres ? { id: P.mres.id, vinto: P.mres.vinto } : undefined, firma: inLampo || P.firma == null ? undefined : P.firma,
        giocatori: P.giocatori.map(function (x) { return { id: x.id, nome: x.nome, bot: x.bot, totale: x.totale, soldi: x.soldi, jolly: x.jolly, via: x.via || undefined }; }) };
      if (inLampo) v.lampo = { n: L.n, tot: L.pos.length, chi: L.chi, fuori: Object.keys(L.fuori), vince: L.vince, prove: L.prove, k: P.manche + (L.tri ? "t" + L.tri.n : ""),
        tipo: L.tipo || "classica", tri: L.tri ? { n: L.tri.n, di: L.tri.di } : undefined, ok: L.ok ? L.ok.slice() : undefined, parole: L.parole || undefined };
      if (P.fin) {
        var F = P.fin, aperta = f === "fesito" || f === "fine";
        v.fin = { id: F.id, nome: F.nome, busta: F.busta, buste: (F.buste || []).slice(), scelte: F.scelte.slice(), prove: F.prove, vinto: F.vinto, via: F.via || undefined, n: F.premi.length,
          b: F.b || 1, risolte: F.risolte || 0, esiti: (F.esiti || []).slice(), voc: F.voc || 0, pen: F.pen || 0, resta: Math.round(P.finResta ? P.finResta() : 0),
          premio: aperta ? F.premio : undefined, premi: aperta ? F.premi.slice() : undefined };
      }
      return v;
    };
    return P;
  }

  // =========================================================
  //  BOT
  // =========================================================
  // I bot NON sbirciano la frase: vedono il tabellone come tutti e "conoscono" una parte delle frasi
  // (il Facile poche, il Difficile quasi tutte). Con quello che vedono cercano le frasi che ci stanno.
  var CONOSCE = { facile: 30, medio: 50, difficile: 70 };
  function conosce(nomeBot, frase, liv) {
    var s = nomeBot + "|" + frase, h = 7;
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h) % 100 < (CONOSCE[liv] || 50);
  }
  function candidati(P, nomeBot, liv) {
    var tab = coperta(P.frase, P.rivelate), n = tab.length;
    // con il tabellone quasi vuoto non si riconosce niente (servono un po' di lettere)
    var tot = solo(P.frase).length, noti = solo(tab.replace(/_/g, "")).length;
    if (!tot || noti / tot < ({ facile: 0.35, medio: 0.25, difficile: 0.15 }[liv] || 0.25)) return [];
    return frasi().filter(function (x) {
      var f = String(x.f).toUpperCase();
      if (x.c !== P.cat || f.length !== n) return false;
      for (var i = 0; i < n; i++) {
        var a = tab.charAt(i), b = f.charAt(i);
        if (a === "_") { if (!eLettera(b) || P.chiamate[base(b)]) return false; }
        else if (a !== b) return false;
      }
      return conosce(nomeBot, f, liv);
    });
  }
  function quotaNota(P) { var tot = solo(P.frase).length, noti = solo(coperta(P.frase, P.rivelate).replace(/_/g, "")).length; return tot ? noti / tot : 0; }
  var BASTA = { facile: 0.65, medio: 0.5, difficile: 0.4 }, SOGLIA = { facile: 0.85, medio: 0.75, difficile: 0.65 }, LEGGE = { facile: 0.7, medio: 0.85, difficile: 0.95 };
  function provaBot(P, cand, liv) {   // la soluzione che il bot scrive quando ci prova
    if (cand.length) return cand[Math.floor(Math.random() * cand.length)].f;
    return Math.random() < (LEGGE[liv] || 0.85) ? P.frase : "SBAGLIATA";
  }
  function decidiBot(P, liv) {
    var p = P.giocatori[P.turno], puo = P.puo(), quota = quotaNota(P);
    var cand = candidati(P, p.nome, liv);
    // sa la frase (ne conosce una sola che ci sta): risolve quando ha visto abbastanza
    if (cand.length === 1 && (quota >= (BASTA[liv] || 0.5) || (!puo.gira && !puo.compra))) return { a: "risolvi", testo: cand[0].f };
    // tabellone quasi pieno: ci prova lo stesso (si legge quasi tutto, come farebbe chiunque)
    if (quota >= (SOGLIA[liv] || 0.75) || (!puo.gira && !puo.compra)) return { a: "risolvi", testo: provaBot(P, cand, liv) };
    if (puo.compra && (!puo.gira || (p.soldi >= 1500 && Math.random() < 0.35))) return { a: "compra" };
    if (puo.gira) return { a: "gira" };
    return { a: "risolvi", testo: "SBAGLIATA" };
  }
  // l'Express: lo prende chi ha coraggio (e solo se restano consonanti)
  function prendeExpress(P, liv) { return P.consonantiNascoste() >= 2 && Math.random() < ({ facile: 0.3, medio: 0.5, difficile: 0.65 }[liv] || 0.5); }
  function decidiExpress(P, liv) {
    var p = P.giocatori[P.turno], quota = quotaNota(P), cand = candidati(P, p.nome, liv);
    if (cand.length === 1 && quota >= (BASTA[liv] || 0.5) - 0.1) return { a: "risolvi", testo: cand[0].f };
    if (quota >= (SOGLIA[liv] || 0.75)) return { a: "risolvi", testo: provaBot(P, cand, liv) };
    if (P.consonantiNascoste() > 0) { var L = letteraBot(P, liv, CONSONANTI, FREQ_C); if (L) return { a: "lettera", L: L }; }
    if (P.puo().compra) return { a: "compra" };
    return { a: "risolvi", testo: provaBot(P, cand, liv) };
  }
  // ❓ il Mistero: il Bot lo apre solo se è indietro in classifica (qualcuno ha un totale più alto del suo)
  function apreMistero(P) {
    var p = P.giocatori[P.turno];
    return P.giocatori.some(function (x) { return x !== p && !x.via && x.totale > p.totale; });
  }
  // il round veloce: nei 5 secondi risolve solo se la sa o se si legge quasi tutto
  function decidiVeloce(P, liv) {
    var p = P.giocatori[P.turno], quota = quotaNota(P), cand = candidati(P, p.nome, liv);
    if (cand.length === 1 && quota >= (BASTA[liv] || 0.5) - 0.1) return cand[0].f;
    if (quota >= (SOGLIA[liv] || 0.75)) return provaBot(P, cand, liv);
    return null;
  }
  // la lettera: chi ragiona sceglie quella che sta nelle frasi possibili, se no va per frequenza in italiano
  function letteraBot(P, liv, lista, freq) {
    var p = P.giocatori[P.turno];
    var libere = freq.filter(function (L) { return lista.indexOf(L) >= 0 && !P.chiamate[L]; });
    if (!libere.length) return null;
    var ragiona = { facile: 0.3, medio: 0.65, difficile: 0.9 }[liv] || 0.65;
    if (Math.random() < ragiona) {
      var cand = candidati(P, p.nome, liv), meglio = null, max = 0;
      libere.forEach(function (L) {
        var n = cand.filter(function (x) { return solo(x.f).indexOf(L) >= 0; }).length;
        if (n > max) { max = n; meglio = L; }
      });
      if (meglio) return meglio;
    }
    if (liv === "facile") return libere[Math.floor(Math.random() * Math.min(libere.length, 8))];
    if (liv === "medio") return libere[Math.floor(Math.random() * Math.min(libere.length, 3))];
    return libere[0];
  }

  // =========================================================
  //  SUONI (niente vibrazione: vibra solo quando tocchi tu)
  // =========================================================
  function bip(f, dur, tipo, vol, ritardo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime + (ritardo || 0), o = ctx.createOscillator(), gg = ctx.createGain();
      o.type = tipo || "triangle"; o.frequency.setValueAtTime(f, t0);
      gg.gain.setValueAtTime(0.0001, t0); gg.gain.exponentialRampToValueAtTime(vol || 0.08, t0 + 0.01); gg.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(gg); gg.connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.02);
    } catch (e) {}
  }
  function suonoGiro() { for (var k = 0; k < 18; k++) bip(900, 0.03, "square", 0.025, k * 0.06 + k * k * 0.004); }
  // la curva con cui la ruota rallenta (la stessa della transizione: cubic-bezier(.12,.7,.18,1))
  function curvaGiro(x) {
    var a = 0, b = 1, s = x;
    function bx(t) { return 3 * (1 - t) * (1 - t) * t * 0.12 + 3 * (1 - t) * t * t * 0.18 + t * t * t; }
    for (var k = 0; k < 22; k++) { s = (a + b) / 2; if (bx(s) < x) a = s; else b = s; }
    return 3 * (1 - s) * (1 - s) * s * 0.7 + 3 * (1 - s) * s * s + s * s * s;
  }
  function suonoGiroVero(da, a, dur) {
    var ultimo = null, tPrec = -1000, n = 0;
    for (var ms = 0; ms <= dur && n < 90; ms += 6) {
      var k = Math.floor((da + (a - da) * curvaGiro(ms / dur)) / 15);
      if (ultimo === null) { ultimo = k; continue; }
      if (k !== ultimo) { ultimo = k; if (ms - tPrec >= 42) { bip(1650, 0.022, "square", 0.028, ms / 1000); tPrec = ms; n++; } }
    }
  }
  function suonoLettera(n) { for (var k = 0; k < Math.min(n, 10); k++) bip(1046, 0.18, "triangle", 0.08, k * 0.16); }   // un "ding" per casella
  function suonoNo() { bip(220, 0.35, "sawtooth", 0.05); }
  function suonoVinto() { [523, 659, 784, 1046].forEach(function (f, k) { bip(f, 0.25, "triangle", 0.09, k * 0.12); }); }
  function suonoCampanella() { [1568, 2093, 1568, 2093].forEach(function (f, k) { bip(f, 0.22, "triangle", 0.07, k * 0.11); }); }   // din-din-din: frase lampo!
  function suonoTic() { bip(1760, 0.06, "triangle", 0.04); }   // una lettera della frase lampo
  function suonoBuzzer() { bip(155, 0.45, "sawtooth", 0.09); bip(207, 0.45, "square", 0.05); }   // "Prenoto!"
  function suonoTreno() { bip(587, 0.32, "triangle", 0.08); bip(740, 0.32, "triangle", 0.08); bip(880, 0.45, "triangle", 0.08, 0.34); bip(1109, 0.45, "triangle", 0.06, 0.34); }   // il fischio dell'Express
  function suonoMistero() { [784, 740, 698, 659].forEach(function (f, k) { bip(f, 0.22, "sine", 0.07, k * 0.14); }); }   // ❓ la musichetta del Mistero
  function suonoVeloce() { for (var k = 0; k < 8; k++) bip(500 + k * 120, 0.06, "square", 0.03, k * 0.05); }

  // =========================================================
  //  LA PARTITA SU QUESTO TELEFONO: contro il computer, sullo stesso telefono, oppure host online
  // =========================================================
  function regoleDa(im) { im = im || {}; return { prenota: im.prenota !== false, express: im.express !== false, veloce: im.veloce !== false, finale: im.finale !== false,
    mistero: im.mistero !== false, frasi: im.frasi === "nostre" ? "nostre" : "gioco" }; }
  function partita(t, modo) {
    var online = modo === "online";
    if (online && !(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {}, liv = imp.difficolta || "medio", mancheTot = Math.max(1, Math.min(6, Math.floor(+imp.manche || 4))), reg = regoleDa(imp);
    var nome = (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Tu";
    var IO = t.mioId || "host";   // io che tengo la partita ("host", o l'amico che ha preso il posto dell'host)
    var posti = [];   // chi gioca: { id, nome, bot, omino }
    var guarda = [];  // nella Sala: chi non è stato scelto per giocare ({ id, nome }): guarda la partita
    var H = { fase: online ? "lobby" : "gioco", codice: "…", pronta: !online, omini: {}, gameId: "" };
    // un bot del gruppo fisso col suo nome e il suo avatar (va anche in H.omini: così lo vedono uguale tutti i telefoni)
    function nuovoBot(salta) {
      var escludi = posti.filter(function (p) { return p !== salta; }).map(function (p) { return p.bot ? p.botId : p.nome; })
        .concat(guarda.map(function (g) { return g.nome; }));
      var b = prendiBot(liv, escludi), n = b ? b.nome : "Bot " + (posti.length + 1);
      var p = { id: "bot-" + (b ? b.id : Math.random().toString(36).slice(2, 7)), botId: b ? b.id : null, nome: n, bot: true,
        omino: (b && b.omino) || (window.SGOmino ? SGOmino.casuale(n) : null) };
      H.omini[p.id] = p.omino;
      return p;
    }
    function aggiungiBot() { posti.push(nuovoBot(null)); }
    // cambiata la bravura in saletta: alla ruota vanno i bot di quel livello (stessi posti)
    function rifaiBot() {
      posti.forEach(function (p, i) { if (!p.bot) return; delete H.omini[p.id]; posti[i] = nuovoBot(p); });
      if (rete) rete.inviaVeloce({ t: "omini", omini: H.omini });
    }
    if (modo === "telefono") {
      (t.giocatori || []).slice(0, MAX).forEach(function (n, i) { posti.push({ id: "p" + i, nome: n, omino: window.SGOmino ? SGOmino.casuale(n) : null }); });
      while (posti.length < 2) aggiungiBot();
    } else {
      posti.push({ id: IO, nome: nome, omino: t.mioOmino ? t.mioOmino(nome) : null });
      if (!online) { var nb = Math.max(1, Math.min(MAX - 1, Math.floor(+imp.avversari || 2))); for (var b = 0; b < nb; b++) aggiungiBot(); }
    }
    H.omini[posti[0].id] = posti[0].omino;
    var P = null, rete = null, tBot = null, tTempo = null, tFase = null, tLampo = null, tWin = null, tBotL = [];
    // online, la partita di prima (l'host ha ricaricato la pagina o riaperto l'app: t.ripresa): stessa frase, stesse
    // lettere, stessi soldi, tocca a chi toccava (vedi riprendi). Gli amici si aspettano ("attesi") e rientrano da soli;
    // chi non torna entro 10 secondi esce
    var R0 = online && t.ripresa && t.ripresa.stato, ripresa = !!(R0 && R0.P && (R0.fase === "gioco" || R0.fase === "fine")), attesi = {}, tAttesi = null;
    if (ripresa) {
      mancheTot = R0.mancheTot || mancheTot; liv = R0.liv || liv; reg = R0.reg || reg; guarda = R0.guarda || [];
      H.omini = R0.omini || H.omini;
      posti = (R0.posti || []).map(function (p) { return Object.assign({}, p, { omino: H.omini[p.id] || null }); });
      P = creaPartita(posti, mancheTot, { modo: modo, difficolta: liv, prenota: reg.prenota, express: reg.express, veloce: reg.veloce, finale: reg.finale, decimo: !!R0.P.decimo,
        mistero: reg.mistero, frasi: reg.frasi, amica: amica, visteAmici: function () { return H.visteAmici; } });
      Object.keys(R0.P).forEach(function (k) { if (typeof P[k] !== "function" && k !== "regole" && k !== "spicchi") P[k] = R0.P[k]; });
      P.spicchi = spicchiDi(P.regole.express, P.mist);   // (❓ lo spicchio Mistero c'è ancora, o è già stato aperto)
      P.giocatori.forEach(function (g) { g.omino = H.omini[g.id] || null; if (!g.bot && g.id !== IO && !g.via) attesi[g.id] = 1; });
      H.fase = R0.fase; H.gameId = R0.gameId || ""; H.giocate = R0.giocate || 1; H.risultato = !!R0.risultato; H.pagato = !!R0.pagato;
    }
    H.mosse = 0;        // cresce a ogni mossa vera: il tempo per decidere riparte solo allora
    H.kFase = "";       // per quale momento è partito il timer dei momenti che vanno avanti da soli
    H.kTempo = ""; H.scade = 0;   // il tempo per decidere: per chi e fino a quando
    H.kLampo = ""; H.risposta = {}; H.botSoglia = {}; H.segVisto = {};
    H.visteAmici = {};   // le frasi già viste da chi gioca con me (online: le manda ognuno quando entra; solo qui, mai nella foto)   // frase lampo: il timer della prossima lettera, cosa scrivono i bot
    H.pronti = { k: "", ids: [] }; H.fineFase = 0;   // «⏩ Avanti» a fine manche: chi l'ha toccato (per quella manche)
    // ✍️ le frasi mandate da chi guarda: restano SOLO qui (mai nella foto) finché non escono; { id, nome, c, f }
    H.coda = []; H.nomi = {}; H.nostreUsate = {};
    if (ripresa) {   // ✍️ ⏩ le frasi degli amici (solo su questo telefono: mai al vice) e chi aveva già toccato «Avanti»
      var Q = t.ripresa.soloQui || {};
      H.coda = Q.coda || []; H.nomi = Q.nomi || {}; H.nostreUsate = Q.nostreUsate || {}; H.visteAmici = Q.visteAmici || {};
      if (P) P.segrete = Q.segrete || {};   // (il vice che prende la partita non le ha: le segrete di questa manche si perdono)
      H.nostre = reg.frasi === "nostre" ? leggiNostre() : [];
      if (R0.pronti) H.pronti = R0.pronti;
    }

    function fermaTempo() { clearTimeout(tTempo); tTempo = null; H.scade = 0; H.kTempo = ""; }
    function fermaBotLampo() { tBotL.forEach(clearTimeout); tBotL = []; H.botAspetta = {}; }
    function fermaLampo() { clearTimeout(tLampo); clearTimeout(tWin); tLampo = tWin = null; H.kLampo = ""; fermaBotLampo(); }
    function ferma() { clearTimeout(tBot); clearTimeout(tFase); tBot = tFase = null; H.kFase = ""; fermaTempo(); fermaLampo(); }
    function vm() {
      if (H.fase !== "gioco" && H.fase !== "fine") return { fase: H.fase, codice: H.codice, pronta: H.pronta, mancheTot: mancheTot, gameId: H.gameId, modo: modo, difficolta: liv, regole: reg,
        giocatori: posti.map(function (p) { return { id: p.id, nome: p.nome, bot: !!p.bot }; }), guarda: guarda.slice(), piuBot: posti.length + mancano() < MAX };
      var v = P.vista(); v.guarda = guarda.slice(); v.fase = H.fase === "fine" ? "fine" : v.fase; v.codice = H.codice; v.giocoFase = H.fase; v.sigla = H.sigla || false;
      v.gameId = H.gameId; v.modo = modo; v.difficolta = liv;
      // il riepilogo di fine manche: quanto manca (in millisecondi) e chi ha toccato «⏩ Avanti»
      if (online && H.fase === "gioco" && P.fase === "finemanche") { v.kAv = kAv(); v.pronti = prontiVeri(); v.servono = servono(); v.restaFase = Math.max(0, H.fineFase - Date.now()); }
      if (reg.frasi === "nostre") v.coda = H.coda.map(function (x) { return x.id; });   // (solo CHI ha una frase in coda, mai la frase)
      // il tempo che resta a chi deve toccare (in millisecondi: gli orologi dei telefoni non sono uguali) e quanto era in tutto
      if (H.scade && H.fase === "gioco") { v.resta = Math.max(0, H.scade - Date.now()); v.tempoTot = H.tempoTot; v.kTempo = H.kTempo; if (online && P.fase === "ftempo") v.grazia = FIN_GRAZIA; }
      return v;
    }
    function bd() {
      var v = vm(); if (rete) { rete.invia({ t: "vm", vm: v }); ricordaPosti(); ricorda(); vici(); }
      if (rete && t.aCheSiamo && H.fase === "gioco" && P) t.aCheSiamo(P.fin ? "la finale" : "manche " + Math.max(1, P.manche || 0) + " di " + mancheTot);   // (nella Sala: a che punto è, per chi è fuori)
      disegna(t, v, cb);
    }
    // (host di riserva) chi porta avanti la partita se sparisco: prima chi guarda (non gioca: non ha niente da perdere)
    var viciK = "";
    function vici() {
      var l = guarda.map(function (g) { return g.id; }), k = l.join(",");
      if (k !== viciK && t.vici) { viciK = k; t.vici(l.length ? l : null); }
    }
    // online: la partita com'è adesso, per riprenderla se ricarico la pagina (in saletta niente). Gli avatar una volta sola
    // (in omini), non anche nei posti e nei giocatori
    function senzaOmino(o) { var x = Object.assign({}, o); delete x.omino; return x; }
    function ricorda() {
      if (H.fase !== "gioco" && H.fase !== "fine" || !P) return t.ricorda(null);
      var p = {};
      Object.keys(P).forEach(function (k) { if (typeof P[k] !== "function" && k !== "regole" && k !== "spicchi" && k !== "segrete") p[k] = P[k]; });
      p.giocatori = P.giocatori.map(senzaOmino);
      t.ricorda({ fase: H.fase, P: p, posti: posti.map(senzaOmino), guarda: guarda, mancheTot: mancheTot, liv: liv, reg: reg, omini: H.omini,
        gameId: H.gameId, giocate: H.giocate, risultato: !!H.risultato, pagato: !!H.pagato, risposta: H.risposta, pronti: H.pronti },
        { coda: H.coda, nomi: H.nomi, nostreUsate: H.nostreUsate, segrete: P.segrete || {}, visteAmici: H.visteAmici });   // (le ✍️ frasi degli amici restano segrete: solo su questo telefono)
    }
    // online: se l'host ricarica (la stanza si riapre con lo stesso codice), per 15 secondi i posti alla ruota restano
    // a chi stava giocando, non a chi guardava ed è stato più svelto a rientrare (come il Tris)
    var riserva = null, scritti = "", tScritti = 0;   // riserva: { ids: chi giocava, fino }
    function ricordaPosti() {
      if (!online || !H.codice || H.codice === "…" || (riserva && Date.now() < riserva.fino)) return;
      var ids = posti.filter(function (p) { return !p.bot && p.id !== IO; }).map(function (p) { return p.id; });
      var k = H.codice + "|" + ids.join(",");
      if (k === scritti && Date.now() - tScritti < 60000) return;   // (si riscrive solo se cambia, o una volta al minuto)
      scritti = k; tScritti = Date.now();
      try { localStorage.setItem("sg-ruota-posti", JSON.stringify({ c: H.codice, ids: ids, t: Date.now() })); } catch (e) {}
    }
    function leggiRiserva(c) {
      try { var x = JSON.parse(localStorage.getItem("sg-ruota-posti") || "null"); if (x && x.c === c && x.ids && x.ids.length && Date.now() - x.t < 20 * 60000) return { ids: x.ids, fino: Date.now() + 15000 }; } catch (e) {}
      return null;
    }
    // c'è posto per chi entra adesso? (i posti tenuti per chi giocava e non è ancora tornato non sono liberi)
    function postoPer(id) {
      if (posti.length >= MAX) return false;
      if (!riserva || Date.now() >= riserva.fino || riserva.ids.indexOf(id) >= 0) return true;
      var attesi = riserva.ids.filter(function (x) { return !posti.some(function (p) { return p.id === x; }); }).length;
      if (posti.length + attesi < MAX) return true;
      clearTimeout(riserva.tm); riserva.tm = setTimeout(bd, riserva.fino - Date.now() + 200);   // finito il tempo, chi aspetta chiede di nuovo
      return false;
    }
    // nella Sala: quanti degli scelti non sono ancora arrivati (i loro posti non vanno ai bot)
    function mancano() {
      var sc = online && t.scelti; if (!sc || !sc.length) return 0;
      return sc.filter(function (x) {
        var id = x && typeof x === "object" ? x.id : x, nm = x && typeof x === "object" ? x.nome : x;
        return id !== IO && !posti.some(function (p) { return !p.bot && (p.id === id || (!!nm && stessoNome(p.nome, nm))); });
      }).length;
    }
    function attoreHost() {
      var f = P.fase;
      if (f === "lampo") return P.lampo && P.lampo.chi;
      if (FASI_FIN.indexOf(f) >= 0) return P.fin && P.fin.id;
      var p = P.giocatori[P.turno]; return p && p.id;
    }
    // quanto tempo ha chi deve toccare (0 = senza limite: le mosse normali contro il computer e sullo stesso telefono)
    function tempoPer() {
      var f = P.fase;
      if (f === "vlettera") return T_VEL_LETTERA;
      if (f === "vdecidi") return T_VEL_DECIDI;
      if (f === "risolvi" && P.veloce) return T_VEL_RISOLVI;
      if (f === "fbusta") return T_FIN_BUSTA;
      if (f === "flettere") return T_FIN_LETTERE;
      if (f === "ftempo") return Math.max(1, P.finResta()) + (online ? FIN_GRAZIA : 0);
      if (f === "lampo") return P.lampo && P.lampo.chi ? T_LAMPO_RISOLVI : 0;
      if (!online) return 0;
      if (f === "risolvi") return T_RISOLVI;
      return ["gira", "consonante", "vocale", "express", "sceltaexp", "mistero"].indexOf(f) >= 0 ? T_MOSSA : 0;
    }
    function scaduto() {
      var f = P.fase;
      if (f === "lampo") return P.lampoTempo();
      if (f === "vdecidi") return P.velPassa(true);
      if (f === "fbusta" || f === "flettere") return P.finAuto();
      if (f === "ftempo") return P.finTempo();
      return P.rinuncia(true);
    }
    // il giro: i momenti che vanno avanti da soli, i bot, la frase lampo, il tempo per decidere.
    // Se ciclo() viene richiamato senza che sia successo niente di nuovo (es. un amico esce), i timer già partiti restano come sono.
    function ciclo() {
      clearTimeout(tBot); tBot = null;
      if (H.fase !== "gioco" || !P || H.sigla) { fermaTempo(); fermaLampo(); return; }
      var f = P.fase;
      if (f !== "lampo") fermaLampo();
      if (DURATE[f]) {
        fermaTempo();
        var kf = f + ":" + P.manche + ":" + P.giroN;
        if (H.kFase === kf && tFase) return;   // già in corso
        clearTimeout(tFase); H.kFase = kf;
        var dur = durata(f); H.fineFase = Date.now() + dur;
        tFase = setTimeout(function () { tFase = null; H.kFase = ""; avanza(f); }, dur);
        return;
      }
      if (f === "fine") return;
      if (f === "lampo" && !P.lampo.chi) { fermaTempo(); return cicloLampo(); }
      var chi = attoreHost(), p = P.trova(chi);
      if (!p) { fermaTempo(); return; }
      var nuovo = H.ultimoTurno !== P.turno + ":" + P.manche; H.ultimoTurno = P.turno + ":" + P.manche;
      if (p.bot) {   // il bot aspetta un po' di più a inizio turno: prima la telecamera arriva al suo leggio
        fermaTempo();
        if (f === "lampo") { tBot = setTimeout(rispostaLampoBot, 2200); return; }
        var att = f === "risolvi" ? 1800 : f === "vdecidi" ? 1300 + Math.random() * 1300 : 1100 + Math.random() * 700;
        tBot = setTimeout(mossaBot, att + (nuovo && f !== "vdecidi" ? 1700 : 0));
        return;
      }
      var ms = tempoPer();
      if (!ms) { fermaTempo(); return; }
      var kt = f === "ftempo" ? "ft:" + P.manche + ":" + P.fin.b + ":" + P.fin.pen : f === "lampo" ? "l:" + P.manche + ":" + chi + ":" + P.lampo.prove : P.manche + ":" + f + ":" + chi + ":" + H.mosse;
      if (H.kTempo === kt && tTempo) return;   // stesso momento: il tempo non riparte da capo
      clearTimeout(tTempo); H.kTempo = kt;
      H.tempoTot = f === "ftempo" ? FIN_TOT + (online ? FIN_GRAZIA : 0) : ms; H.scade = Date.now() + ms;   // (la barretta della finale misura tutti i 60 secondi)
      tTempo = setTimeout(function () { tTempo = null; H.scade = 0; if (scaduto()) { H.mosse++; dopo(); } }, ms);
    }
    // online il riepilogo di fine manche dura di più: si legge la frase e i totali (o si va avanti a maggioranza)
    function durata(f) { return online && f === "finemanche" ? T_RIEPILOGO : DURATE[f]; }
    // ---- «⏩ Avanti» sul riepilogo di fine manche: si parte subito se lo tocca più di metà di chi gioca ed è presente ----
    function kAv() { return "fm:" + String(H.gameId).slice(-6) + ":" + P.manche; }
    function umaniPresenti() { return P.giocatori.filter(function (x) { return !x.bot && !x.via; }); }
    function servono() { return Math.floor(umaniPresenti().length / 2) + 1; }
    function prontiVeri() {
      if (!P || H.pronti.k !== kAv()) return [];
      return H.pronti.ids.filter(function (id) { var p = P.trova(id); return p && !p.bot && !p.via; });
    }
    function maggioranza() { return online && P && P.fase === "finemanche" && prontiVeri().length > 0 && prontiVeri().length >= servono(); }
    function avantiDa(id, k) {
      if (!online || !P || P.fase !== "finemanche" || k !== kAv()) return;   // un tocco vecchio (di un'altra manche) non vale
      var p = P.trova(id); if (!p || p.bot || p.via) return;                    // chi guarda e i Bot non contano
      if (H.pronti.k !== k) H.pronti = { k: k, ids: [] };
      if (H.pronti.ids.indexOf(id) < 0) H.pronti.ids.push(id);
      if (maggioranza()) { clearTimeout(tFase); tFase = null; H.kFase = ""; return avanza("finemanche"); }
      bd();
    }
    function avanza(f) {
      if (f === "girando") P.dopoGiro();
      else if (f === "finemanche") P.dopoManche();
      else if (f === "lampofine") P.dopoLampo();
      else if (f === "vgiro") P.giraVeloce();
      else if (f === "fintro") P.finInizia();
      else if (f === "frivela") P.finVia();
      else if (f === "fcambio") P.dopoCambio();
      else if (f === "fesito") P.dopoFinale();
      else if (f === "mapre") P.mistRivela();
      else if (f === "mrivela") P.dopoMistero();
      H.mosse++; dopo();
    }
    // ---- la frase lampo: le lettere compaiono da sole; il primo "Prenoto!" apre la finestra, poi vince il più veloce ----
    function cicloLampo() {
      var L = P.lampo;
      if (L.cand.length) return;   // la finestra è aperta: decide lei
      var kl = P.manche + ":" + L.n + ":" + L.prove;
      if (H.kLampo === kl && tLampo) return;
      clearTimeout(tLampo); H.kLampo = kl;
      // (i giochi a tema aspettano un attimo in più all'inizio: si legge cosa sono; il CruciRuota va più svelto, ha tante lettere)
      var prima = !L.tipo || L.tipo === "classica" || (L.tri && L.tri.n > 1) ? LAMPO_PRIMA : LAMPO_PRIMA_TEMA;
      if (L.n < L.pos.length) tLampo = setTimeout(function () { tLampo = null; if (P.lampoRivela()) botLampo(); dopo(); }, L.n === 0 && !L.prove ? prima : L.tipo === "cruci" ? CRUCI_PASSO : LAMPO_PASSO);
      else tLampo = setTimeout(function () { tLampo = null; if (P.lampoNessuno()) { H.mosse++; dopo(); } }, LAMPO_ULTIMA);
    }
    function prenotaDa(id, n, ms) {
      if (!P || H.fase !== "gioco" || P.fase !== "lampo") return;
      if (!P.prenota(id, n, ms)) return;
      if (P.lampo.cand.length > 1) return;   // la finestra è già aperta
      clearTimeout(tLampo); tLampo = null; H.kLampo = "";
      function chiudi() { tWin = null; if (P.lampoAssegna()) { fermaBotLampo(); H.mosse++; } dopo(); }
      if (online) { clearTimeout(tWin); tWin = setTimeout(chiudi, LAMPO_FINESTRA); } else chiudi();
    }
    // i bot e la frase lampo: prenotano quando ne hanno viste abbastanza (prima chi la conosce), con i loro riflessi
    function botLampo() {
      var L = P.lampo; if (!L || P.fase !== "lampo" || L.chi) return;
      var tot = solo(L.frase).length, noti = solo(P.lampoTab().replace(/_/g, "")).length, q = tot ? noti / tot : 0, tutte = L.n >= L.pos.length;
      H.botAspetta = H.botAspetta || {};
      if (L.tipo === "cruci") return botCruci();
      P.giocatori.forEach(function (b) {
        if (!b.bot || b.via || L.fuori[b.id] || H.botAspetta[b.id]) return;
        var sa = conosce(b.nome, L.frase, liv), soglia = ({ facile: 0.72, medio: 0.58, difficile: 0.45 }[liv] || 0.58) + (sa ? 0 : 0.2) + Math.random() * 0.12;
        if (!tutte && q < soglia) return;
        if (tutte && Math.random() < 0.3) return;
        var r = { facile: [1100, 2400], medio: [800, 1800], difficile: [550, 1300] }[liv] || [800, 1800], d = r[0] + Math.random() * (r[1] - r[0]), n = L.n;
        H.risposta[b.id] = (sa || Math.random() < 0.5 + q * 0.45) ? L.frase : "SBAGLIATA";
        H.botAspetta[b.id] = true;
        tBotL.push(setTimeout(function () { H.botAspetta[b.id] = false; prenotaDa(b.id, n, d); }, d));
      });
    }
    function rispostaLampoBot() {
      var L = P && P.lampo; if (!L || P.fase !== "lampo" || !L.chi) return;
      P.lampoSoluzione(L.chi, L.tipo === "cruci" ? (cruciBot(P.trova(L.chi)) || "") : H.risposta[L.chi] || "SBAGLIATA"); H.mosse++; dopo();
    }
    // 🧩 le parole che un bot sa scrivere adesso (le altre restano "?"): null se non ne riconosce nessuna
    function cruciBot(b) {
      var L = P.lampo; if (!b || !L || !L.ok) return null;
      var vere = L.frase.split("|"), viste = P.lampoTab().split("|"), sa = false;
      var out = vere.map(function (w, r) {
        if (L.ok[r]) return w;
        var noti = viste[r].replace(/_/g, "").length, q = noti / w.length;
        if (conosce(b.nome, w, liv) && q >= ({ facile: 0.55, medio: 0.4, difficile: 0.28 }[liv] || 0.4) + (H.botSoglia[b.id + r] || 0)) { sa = true; return w; }
        return viste[r].replace(/_/g, "?");
      });
      return sa ? out.join("|") : null;
    }
    function botCruci() {
      var L = P.lampo; H.botSoglia = H.botSoglia || {};
      P.giocatori.forEach(function (b) {
        if (!b.bot || b.via || L.fuori[b.id] || H.botAspetta[b.id]) return;
        L.frase.split("|").forEach(function (w, r) { if (H.botSoglia[b.id + r] == null) H.botSoglia[b.id + r] = Math.random() * 0.15; });
        if (!cruciBot(b)) return;
        var rr = { facile: [1100, 2400], medio: [800, 1800], difficile: [550, 1300] }[liv] || [800, 1800], d = rr[0] + Math.random() * (rr[1] - rr[0]), n = L.n;
        H.botAspetta[b.id] = true;
        tBotL.push(setTimeout(function () { H.botAspetta[b.id] = false; prenotaDa(b.id, n, d); }, d));
      });
    }
    function segreteBot() {
      if (!P || FASI_SEG.indexOf(P.fase) < 0) return;
      P.giocatori.forEach(function (b) {
        if (!b.bot || !P.puoSegreta(b.id) || H.segVisto[b.id + ":" + P.manche + ":" + P.giroN]) return;
        H.segVisto[b.id + ":" + P.manche + ":" + P.giroN] = 1;   // (ci pensa una volta per giro di ruota)
        var c = candidati(P, b.nome, liv), q = quotaNota(P);
        if (c.length === 1 && q >= ({ facile: 0.5, medio: 0.38, difficile: 0.28 }[liv] || 0.38) && Math.random() < 0.45) P.segreta(b.id, c[0].f);
      });
    }
    function dopo() {
      segreteBot();
      // (qualcuno è uscito durante il riepilogo: se ora più di metà ha toccato «⏩ Avanti», si va avanti)
      if (H.fase === "gioco" && !H.sigla && maggioranza()) { clearTimeout(tFase); tFase = null; H.kFase = ""; return avanza("finemanche"); }
      if (P && P.classifica && !H.risultato) { H.risultato = true; risultato(); }
      if (P && P.fase === "fesito" && !H.pagato) { H.pagato = true; pagaQui(); }
      if (P && P.fase === "fine" && H.fase === "gioco") return finePartita();
      ciclo(); bd();
    }
    function mossaBot() {
      var p = P.giocatori[P.turno], f = P.fase; if (!p || !p.bot) return;
      if (f === "gira") {
        var d = decidiBot(P, liv);
        if (d.a === "gira") P.gira();
        else if (d.a === "compra") P.compra();
        else { P.risolvi(); p._testo = d.testo; }
      } else if (f === "sceltaexp") P.sceltaExpress(prendeExpress(P, liv));
      else if (f === "express") {
        var de = decidiExpress(P, liv);
        if (de.a === "lettera") P.consonante(de.L);
        else if (de.a === "compra") P.compra();
        else { P.risolvi(); p._testo = de.testo; }
      }
      else if (f === "consonante") { var L = letteraBot(P, liv, CONSONANTI, FREQ_C); if (L) P.consonante(L); else P.rinuncia(); }
      else if (f === "vocale") { var V = letteraBot(P, liv, VOCALI, FREQ_V); if (V) P.vocale(V); else P.rinuncia(); }
      else if (f === "risolvi") P.soluzione(p._testo || "SBAGLIATA");
      else if (f === "vlettera") { var X = letteraBot(P, liv, CONSONANTI, FREQ_C) || letteraBot(P, liv, VOCALI, FREQ_V); if (X) P.velLettera(X); else P.rinuncia(); }
      else if (f === "vdecidi") { var dv = decidiVeloce(P, liv); if (dv) { P.velRisolvi(); p._testo = dv; } else P.velPassa(); }
      else if (f === "mistero") P.mistero(apreMistero(P));
      H.mosse++;
      dopo();   // (i suoni li fa il disegno, uguale su tutti i telefoni)
    }
    // la classifica è pronta (anche se poi c'è la finale): trofei, XP e torneo
    function risultato() {
      var v = vm();
      salvaTrofei(v, modo === "telefono" ? null : IO, modo, liv);
      if (t.risultato && P.classifica) t.risultato(P.classifica.filter(function (r) { var x = posti.filter(function (p) { return p.id === r.id; })[0]; return x && !x.bot && !r.uscito; }).map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // la finale vinta da chi gioca su questo telefono: le Speed Coins (sullo stesso telefono solo se il campione ha il nome del profilo)
    function pagaQui() {
      var F = P.fin; if (!F || !F.vinto || !F.premio) return;
      var pr = profiloAttivo();
      var mio = modo === "telefono" ? !!(pr && stessoNome(pr.nome, F.nome)) : F.id === IO;
      if (mio) incassa(H.gameId, F.premio);
    }
    function finePartita() {
      if (H.fase === "fine") return;   // una volta sola
      ferma();
      H.fase = "fine";
      bd();
    }
    // ✍️ la frase degli amici per la prossima manche: prima quelle mandate da chi guarda (non a chi l'ha scritta, se gioca:
    // resta in coda per un'altra partita), poi quelle scritte nel ⚙️ (mai due volte nella stessa partita)
    function amica(Pp) {
      var giocano = Pp.giocatori.filter(function (x) { return !x.bot; });
      for (var i = 0; i < H.coda.length; i++) {
        var x = H.coda[i];
        if (giocano.some(function (g) { return g.id === x.id || stessoNome(g.nome, x.nome); })) continue;
        H.coda.splice(i, 1);
        return { f: x.f, c: x.c, firma: x.nome };
      }
      var lista = (H.nostre || []).filter(function (n) { return !H.nostreUsate[n.f]; });
      if (!lista.length) return null;
      var n = lista[Math.floor(Math.random() * lista.length)]; H.nostreUsate[n.f] = 1;
      return { f: n.f, c: n.c, firma: "" };
    }
    // una frase mandata da chi guarda: va solo all'host (il controllo è lo stesso del ⚙️); la risposta solo a lui
    function riceviFrase(id, m) {
      function rispondi(ok, msg) { if (rete) rete.inviaVeloce({ t: "frasemsg", to: id, ok: ok, msg: msg }); }
      if (reg.frasi !== "nostre") return rispondi(false, "Questa volta l'host gioca solo con le frasi del gioco.");
      if (posti.some(function (p) { return p.id === id; }) && (!P || P.giocatori.some(function (g) { return g.id === id && !g.via; }))) return rispondi(false, "Chi gioca non può scrivere frasi: le scrive chi guarda.");
      if (H.coda.some(function (x) { return x.id === id; })) return rispondi(false, "Hai già una frase in coda: aspetta che esca.");
      if (H.coda.length >= CODA_MAX) return rispondi(false, "Ci sono già tante frasi in coda: riprova più tardi.");
      var c = controllaFrase(m && m.c, m && m.f);
      if (!c.ok) return rispondi(false, c.err);
      var g0 = guarda.filter(function (g) { return g.id === id; })[0];
      var nome = String((g0 && g0.nome) || H.nomi[id] || (m && m.nome) || "un amico").slice(0, 16);
      H.coda.push({ id: id, nome: nome, c: c.c, f: c.f });
      rispondi(true, "✅ Frase arrivata! Uscirà in una delle prossime manche, con la tua firma.");
      bd();
    }
    function comincia() {
      if (posti.length < 2) return;
      ferma();
      H.gameId = (online ? H.codice : modo) + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      var umani = posti.filter(function (p) { return !p.bot; }).length;
      // la finale vale tutta solo online con almeno un amico vero; contro il computer o sullo stesso telefono un decimo
      H.nostre = reg.frasi === "nostre" ? leggiNostre() : []; H.nostreUsate = {}; H.pronti = { k: "", ids: [] };
      P = creaPartita(posti, mancheTot, { modo: modo, difficolta: liv, prenota: reg.prenota, express: reg.express, veloce: reg.veloce, finale: reg.finale, decimo: !(online && umani >= 2),
        mistero: reg.mistero, frasi: reg.frasi, amica: amica, visteAmici: function () { return H.visteAmici; } });
      if (window.__RUOTA) { window.__RUOTA.ultima = P; window.__RUOTA.H = H; }   // (per le prove: la partita di questo telefono)
      P.nuovaManche(); H.fase = "gioco"; H.ultimoTurno = null; H.mosse = 0; H.risultato = false; H.pagato = false; H.risposta = {};
      // prima la sigla dello studio (presenta i concorrenti), poi si gioca. Quando si rigioca, una sigla corta.
      H.sigla = H.giocate ? "corta" : "intera"; H.giocate = (H.giocate || 0) + 1; bd();
      var dur = !window.SGStudio ? 0 : H.sigla === "corta" ? SIGLA_CORTA : SGStudio.durataApertura(posti.length) + 1200;   // (+1,2 s: i telefoni lenti finiscono la presentazione dopo)
      function via() { if (!H.sigla) return; clearTimeout(tFase); tFase = null; H.sigla = false; if (P && P.lampo) P.lampo.T[0] = Date.now(); dopo(); }
      tFase = setTimeout(via, online ? dur : dur + 15000);
      H.siglaVia = online ? null : via;
    }
    // le mosse di chi è di turno su questo telefono (o, sullo stesso telefono, di chiunque sia di turno)
    function mia(id) {
      var p = P.giocatori[P.turno];
      return p && !p.bot && (modo === "telefono" || p.id === id);
    }
    function azione(id, a, x) {
      if (!P || H.fase !== "gioco" || H.sigla) return;
      var f = P.fase, ok = false, L = P.lampo;
      if (a === "avanti") return avantiDa(id, x);   // «⏩ Avanti» sul riepilogo (online)
      if (a === "segreta") {   // 🔒 «La so!»: chi aspetta blocca in segreto la soluzione (non sullo stesso telefono: lì si vede tutto)
        if (modo === "telefono") return;
        var ps = P.trova(id); if (!ps || ps.bot) return;
        if (P.segreta(id, x)) { H.mosse++; dopo(); }
        return;
      }
      if (a === "prenoto") {   // la frase lampo: prenotano tutti (sullo stesso telefono x.p dice chi ha toccato)
        if (f !== "lampo") return;
        var chi = modo === "telefono" ? String((x && x.p) || "") : id, pc = P.trova(chi);
        if (!pc || pc.bot) return;
        prenotaDa(chi, x && x.n, x && x.ms);
        return;
      }
      if (f === "lampo") {
        if (!L || !L.chi) return;
        var lc = P.trova(L.chi);
        if (!lc || lc.bot || (modo !== "telefono" && L.chi !== id)) return;
        if (a === "soluzione") ok = P.lampoSoluzione(L.chi, x);
        else if (a === "annulla") ok = P.lampoRinuncia();
      } else if (FASI_FIN.indexOf(f) >= 0) {
        if (!P.fin || (modo !== "telefono" && P.fin.id !== id)) return;
        if (a === "busta") ok = P.finBusta(x);
        else if (a === "passa") ok = P.finPassa();
        else if (a === "lettera") ok = P.finLettera(x);
        else if (a === "lettere") ok = P.finLettere(x);
        else if (a === "soluzione") ok = P.finSoluzione(x);
      } else {
        if (!mia(id)) return;
        if (a === "gira") ok = P.gira();
        else if (a === "compra") ok = P.compra();
        else if (a === "risolvi") ok = f === "vdecidi" ? P.velRisolvi() : P.risolvi();
        else if (a === "express") ok = P.sceltaExpress(!!x);
        else if (a === "mistero") ok = P.mistero(!!x);
        else if (a === "passa") ok = P.velPassa(false);
        else if (a === "lettera") { var Lt = String(x || "").toUpperCase(); ok = f === "vocale" ? P.vocale(Lt) : f === "vlettera" ? P.velLettera(Lt) : P.consonante(Lt); }
        else if (a === "soluzione") ok = P.soluzione(x);
        else if (a === "annulla") ok = f === "risolvi" && (x === "vuoto" && P.annullaRisolvi() || P.rinuncia());   // senza aver scritto niente si torna indietro
      }
      if (ok) { H.mosse++; dopo(); }
    }
    var cb = { sonoHost: true, online: online, telefono: modo === "telefono", myId: IO,
      onSiglaFinita: function () { if (H.siglaVia) { var f = H.siglaVia; H.siglaVia = null; f(); } },   // (subito: i tasti compaiono adesso, un tocco non va perso)
      omini: function () { return H.omini; },
      onAzione: function (a, x) { azione(IO, a, x); },
      onComincia: comincia,
      onBot: function (piu) {
        if (H.fase !== "lobby") return;
        if (piu && posti.length + mancano() < MAX) { aggiungiBot(); if (rete) rete.inviaVeloce({ t: "omini", omini: H.omini }); }   // (prima l'avatar, poi la foto)
        else if (!piu) { for (var i = posti.length - 1; i > 0; i--) if (posti[i].bot) { delete H.omini[posti[i].id]; posti.splice(i, 1); break; } }
        bd();
      },
      onNuova: function () {
        ferma();
        // chi è uscito e non è tornato lascia il posto (se torna dopo, rientra dalla saletta)
        if (online) { posti = posti.filter(function (p) { return !P || !P.giocatori.some(function (g) { return g.id === p.id && g.via; }); });
          // chi tiene la partita è il primo (in saletta ha la corona); se l'ha presa guardando (host di riserva), si siede (se c'è posto)
          if (!posti.some(function (p) { return p.id === IO; }) && posti.length < MAX) {
            guarda = guarda.filter(function (g) { return g.id !== IO; });
            posti.push({ id: IO, nome: nome, omino: t.mioOmino ? t.mioOmino(nome) : null }); H.omini[IO] = posti[posti.length - 1].omino;
          }
          posti.sort(function (a, b) { return (b.id === IO) - (a.id === IO); }); H.fase = "lobby"; P = null; bd(); }
        else { P = null; comincia(); }
      },
      onEsci: function (gia) {   // gia = l'ha già confermato il tasto ‹ dello studio
        var via = function () { ferma(); clearTimeout(tAttesi); if (rete) { t.ricorda(null); rete.chiudi(); } t.esci(); };
        if (H.fase === "gioco" && !gia) return t.conferma(online ? "Chiudere la partita per tutti?" : "Uscire dalla partita?", null, "Esci", via);   // la finestra dell'app
        via();
      } };
    if (online) t.onRivincita = cb.onNuova;   // la Rivincita della Sala
    // "⚙️ Regole" nella saletta: quante manche, bravura dei bot, round speciali
    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      im = im || {};
      var prima = liv;
      mancheTot = Math.max(1, Math.min(6, Math.floor(+im.manche || mancheTot))); liv = im.difficolta || liv; reg = regoleDa(im);
      if (liv !== prima) rifaiBot();
      bd();
    };

    // la ripresa: stessa frase e stesse lettere, tocca a chi toccava col suo tempo intero. La ruota non gira da sola:
    // se stava girando, chi l'aveva girata la rigira; se due avevano appena prenotato la frase lampo, vince il più veloce
    function riprendi() {
      tAttesi = setTimeout(function () { Object.keys(attesi).forEach(function (id) { cbRete.onAddio(id); }); }, 10000);
      H.risposta = R0.risposta || {};
      if (H.fase === "fine") return bd();
      H.sigla = false;
      var f = P.fase, g = P.giocatori[P.turno];
      if (f === "girando") {
        if (P.veloce) P.fase = "vgiro";   // (nel round veloce la ruota la gira il gioco)
        else { P.fase = "gira"; if (g) { if (g.stat.giri) g.stat.giri--; P.msg = "🔁 La partita è ripresa: " + g.nome + ", gira di nuovo la ruota!"; } }
      }
      if (P.fase === "ftempo" && P.fin && P.fin.da) P.fin.da = t.ripresa.ora(P.fin.da);   // (la finale: il tempo che restava resta quello)
      var L = P.lampo;
      if (L && P.fase === "lampo") {
        L.T = (L.T || []).map(function (x) { return t.ripresa.ora(x); });
        if (L.cand && L.cand.length) P.lampoAssegna();
      }
      H.mosse++; dopo();
    }
    if (online) {
      var cbRete = {
        onCodice: function (c) { H.codice = c; if (!riserva) riserva = leggiRiserva(c); bd(); },
        onConnesso: function () { H.pronta = true; bd(); },
        onAddio: function (id) {
          delete attesi[id];
          var g0 = guarda.length; guarda = guarda.filter(function (g) { return g.id !== id; });
          if (H.fase === "lobby") { posti = posti.filter(function (p) { return p.id !== id; }); bd(); return; }
          if (guarda.length !== g0) return bd();
          if (P) { P.esce(id); dopo(); }
        },
        onMsg: function (id, m) {
          if (!m || !m.t) return;
          if (m.t === "frase") return riceviFrase(id, m);   // ✍️ una frase da chi guarda
          if (m.t === "join") {
            delete attesi[id];   // (dopo una ripresa: è tornato)
            var gia = posti.some(function (p) { return p.id === id; }), nomeJ = String(m.nome || "Amico").slice(0, 16);
            H.nomi[id] = nomeJ;
            if (Array.isArray(m.viste)) m.viste.slice(-VISTE_AMICI).forEach(function (h) { if (typeof h === "string" && h.length <= 8) H.visteAmici[h] = 1; });
            if (!gia && t.puoSedersi && !t.puoSedersi(id, nomeJ)) {   // nella Sala non è tra gli scelti: questa volta guarda
              if (!guarda.some(function (g) { return g.id === id; }) && guarda.length < 12) guarda.push({ id: id, nome: nomeJ });
              H.omini[id] = avatarValido(m.omino);
            }
            else if (!gia && H.fase === "lobby" && postoPer(id)) {
              var p = { id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino) };
              posti.push(p); H.omini[id] = p.omino;
              if (posti.some(function (q) { return q.bot && stessoNome(q.nome, p.nome); })) rifaiBot();   // un bot col suo stesso nome: cambia bot
            }
            // era stato tolto (telefono spento più di 20 secondi) e torna: rientra nella partita
            if (gia && P && H.fase === "gioco" && P.torna(id)) { ciclo(); }
            rete.inviaVeloce({ t: "omini", omini: H.omini });
            bd();   // anche a chi rientra: si rivede la partita al suo posto
            return;
          }
          if (m.t === "azione") azione(id, m.a, m.x);
        },
        // (con la rete nuova arriva solo se la stanza non si apre proprio: a partita cominciata ci pensa il core)
        onErrore: function () { ferma(); clearTimeout(tAttesi); t.ricorda(null); errore(t, "Non riesco ad aprire la stanza. Controlla internet e riprova."); }
      };
      rete = SGNet.ospita(ID, cbRete, { ripresa: ripresa });   // (con la ripresa gli amici non tornano in saletta)
      if (ripresa) { if (rete && rete.codice) H.codice = rete.codice; riprendi(); } else bd();
    } else comincia();
  }

  // =========================================================
  //  OSPITE ONLINE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null, omini: {}, ultimoJoin: 0 };
    // guardo soltanto (link con guarda=1): lo studio come chi guarda, niente tasti, niente join, niente trofei; in basso la targhetta del core
    var GUARDA = !!t.guarda;
    var cb = { sonoHost: false, online: true, myId: null, guarda: GUARDA, targa: GUARDA && !t.eliminazione,
      omini: function () { return S.omini; },
      onAzione: function (a, x) { if (S.rete) S.rete.invia({ t: "azione", a: a, x: x }); },
      onFrase: function (c, f) { if (S.rete) S.rete.invia({ t: "frase", c: c, f: f, nome: S.nome }); },   // ✍️ va solo all'host
      onEsci: function (gia) {
        var via = function () { if (S.rete) S.rete.chiudi(); t.esci(); };
        if (GUARDA && !gia) return t.conferma("Smetti di guardare?", "Torni dove eri prima.", "Esci", via);
        if (S.vm && S.vm.giocoFase === "gioco" && !gia) return t.conferma("Uscire dalla partita?", null, "Esci", via);   // la finestra dell'app
        via();
      } };
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();
    function chiediNome() {
      var s = t.schermata({ chiara: true, icona: "🎡", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function join() { S.ultimoJoin = Date.now(); S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null, viste: listaViste().slice(-VISTE_AMICI) }); }
    function collega() {
      var s = t.schermata({ chiara: true, icona: GUARDA ? "👀" : "🎡", titolo: GUARDA ? "Guardo la partita…" : "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; join(); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;
          if (m.t === "vm") {
            var v = S.vm = m.vm;
            // non sono (più) tra i giocatori ma c'è posto, oppure l'host mi aveva tolto: ripeto "join"
            var me = (v.giocatori || []).filter(function (p) { return p.id === S.myId; })[0];
            var guardo = GUARDA || (v.guarda || []).some(function (g) { return g.id === S.myId; });   // (nella Sala: non sono tra gli scelti; o guardo soltanto)
            if (S.myId && !guardo && (v.fase === "lobby" ? !me && v.giocatori.length < MAX : me && me.via && v.giocoFase === "gioco") && Date.now() - S.ultimoJoin > 2500) join();
            if (v.classifica && v.statFine && !GUARDA) salvaTrofei(v, S.myId, v.modo, v.difficolta);
            if (v.tab && v.tab.indexOf("_") < 0 && ["finemanche", "lampofine", "fesito"].indexOf(v.fase) >= 0 && S.vistaK !== v.tab) { S.vistaK = v.tab; segnaVista(v.tab); }
            if (v.fin && v.fin.vinto && v.fin.id === S.myId && (v.fase === "fesito" || v.fase === "fine")) incassa(v.gameId, v.fin.premio);
            disegna(t, v, cb);
          }
          else if (m.t === "omini") { S.omini = m.omini || {}; if (S.vm) disegna(t, S.vm, cb); }
          else if (m.t === "frasemsg" && m.to === S.myId && R && R.cb === cb) rispostaFrase(R, !!m.ok, String(m.msg || ""));
        },
        // chiusa apposta dall'host: sulla classifica finale la classifica resta (cambia solo la scritta), se no si avvisa
        onChiuso: function () {
          if (S.vm && S.vm.fase === "fine" && cb._notaFine && document.body.contains(cb._notaFine)) { cb._notaFine.textContent = "🚪 L'host ha chiuso la stanza."; return; }
          errore(t, "La partita è stata chiusa dall'host.");
        },
        // (arriva solo se il primo collegamento non riesce: a partita cominciata la rete si ricollega da sola)
        onErrore: function () { errore(t, "Problema di collegamento. Riprova."); }
      });
    }
  }

  // =========================================================
  //  DISEGNO: la saletta, poi lo STUDIO TV (come gli altri giochi di quiz).
  //  Il tabellone sta fisso in alto (sempre visibile, non si muove con la telecamera), la ruota sul maxischermo
  //  (al suo posto la campanella della frase lampo e le buste della finale), i concorrenti ai leggii, i tasti in basso.
  //  Suoni, facce e telecamera nascono dalle differenze tra una foto e l'altra: uguali su tutti i telefoni.
  // =========================================================
  var ST = null;   // lo studio del game show (js/studio.js)
  var R = null;    // la regia della partita in corso su questo telefono
  function disegna(t, vm, cb) {
    ST = window.SGStudio;
    if (vm.fase === "lobby") { R = null; return lobby(t, vm, cb); }
    if (vm.fase === "fine") {
      if (R && R.finita) return;   // la chiusura della puntata è già partita
      if (R && R.S.vivo() && !R.sigla) {   // "Fine della puntata!": telecamera sul vincitore, poi la classifica
        var ui = R; ui.finita = true; ui.cb = cb; fermaRegia(ui); ritmo(ui, null);
        ui.sopra.classList.add("via");
        var vinc = vm.classifica && vm.classifica.length ? ui.ids.indexOf(vm.classifica[0].id) : -1;
        // con la finale il campione l'abbiamo già festeggiato: basta un saluto
        var chiusura = vm.fin ? fineCorta(ui.S) : ST.finale(ui.S, vinc, "Ha vinto La Ruota della Fortuna! 🎡");
        Promise.resolve(chiusura).catch(function () {}).then(function () {
          if (R === ui && ui.S.vivo()) { R = null; finale(t, vm, ui.cb); }
        });
        return;
      }
      R = null; return finale(t, vm, cb);
    }
    // (da capo anche se il tavolo è un altro: l'amico che prende il posto dell'host sparito, Passo 5, non usa lo studio di quando era ospite)
    if (R && R.t !== t) { try { fermaRegia(R); } catch (e) {} R = null; }
    if (!R || !R.S.vivo()) R = creaStudioRuota(t, vm, cb);
    R.cb = cb; R.vm = vm;
    if (R.sigla && !vm.sigla && vm.fase !== "lampo" || R.sigla && vm.lampo && vm.lampo.n > 0) R.taglia();   // (la partita è già andata avanti)
    if (!R.sigla) aggiorna(R, vm);
  }
  function fineCorta(S) {
    ST.viaBarra(S); ST.logoSchermo(S); ST.cartelliGiu(S);
    ST.largo(S, 1000);
    ST.terzo(S, null, "Fine della puntata!", "Grazie a tutti e alla prossima!", "🎡");
    ST.pubblico(S, "applauso");
    return new Promise(function (fatto) { setTimeout(function () { ST.viaTerzo(S); fatto(); }, 2600); });
  }
  function nomiRound(r) {
    if (!r) return "";
    return [r.prenota ? "🔔" : "", r.express ? "🚂" : "", r.veloce ? "⚡" : "", r.finale ? "🏆" : "", r.mistero ? "❓" : ""].join("");
  }
  function lobby(t, vm, cb) {
    var el = t.el, sp = nomiRound(vm.regole);
    var extra = [el("p", { class: "modulo-nota", text: "Da 2 a 4 alla ruota · " + vm.mancheTot + " manche" + (sp ? " · round speciali " + sp : "") + (vm.regole && vm.regole.frasi === "nostre" ? " · ✍️ anche le vostre frasi" : "") + ". I posti vuoti li possono prendere i bot." })];
    var dentro = vm.giocatori.some(function (p) { return p.id === cb.myId; });
    if (cb.sonoHost) {
      var nb = vm.giocatori.filter(function (p) { return p.bot; }).length;
      extra.push(el("div", { class: "ru-bot-riga" }, [
        el("span", { text: "🤖 Bot alla ruota: " + nb }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "−", disabled: nb ? null : "disabled", onclick: function () { cb.onBot(false); } }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "+", disabled: vm.giocatori.length < MAX && vm.piuBot !== false ? null : "disabled", onclick: function () { cb.onBot(true); } }) ]));
    }
    var guardo = !dentro && (vm.guarda || []).some(function (g) { return g.id === cb.myId; });   // nella Sala: non sono tra gli scelti
    var piena = !cb.sonoHost && !dentro && !guardo && !cb.guarda && vm.giocatori.length >= MAX;
    if (vm.guarda && vm.guarda.length) extra.push(el("p", { class: "modulo-nota", text: "👀 Guardano: " + vm.guarda.map(function (g) { return g.id === cb.myId ? "tu" : g.nome; }).join(", ") }));
    var s = t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, puoiDaSolo: vm.giocatori.length >= 2, vuoti: Math.max(0, 2 - vm.giocatori.length),
      giocatori: vm.giocatori.map(function (p, i) { return { id: p.id, nome: p.nome, omino: (cb.omini() || {})[p.id] || (p.bot && window.SGOmino ? SGOmino.casuale(p.nome) : null), host: i === 0, tu: p.id === cb.myId, bot: p.bot }; }),
      extra: extra, attesa: cb.guarda ? "Guardi la partita: si gira la ruota tra poco! 🎡" : cb.sonoHost || dentro ? "Aspetta che l'host cominci: si gira la ruota! 🎡" :
        guardo ? "Questa partita la guardi: si gira la ruota tra poco! 👀" : piena ? "Quando comincia, guarderai la partita. 👀" : "Un attimo: ti metto alla ruota…",
      // "Sei dentro!" e "Sto entrando…" li scrive il core; la ruota piena (4 posti) la sa solo il gioco
      spettatore: cb.guarda ? "👀 Guardi la partita" : guardo ? "👀 Questa volta guardi" : piena ? "👀 La ruota è piena: guarderai la partita" : null,
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function creaStudioRuota(t, vm, cb) {
    stile();
    var el = t.el, ids = vm.giocatori.map(function (p) { return p.id; });
    var ui = { t: t, el: el, cb: cb, vm: vm, ids: ids, kTab: "", kTast: "", giroN: -1, scritto: [], cur: 0, prec: null, mostrati: {}, inq: "", barraH: -1, timer: [],
      fuori: {}, jolly: {}, kTempo: "", tabPrec: "", nuove: {}, lampoVisto: {}, schTipo: "", kOrol: "", finSel: [], finSelK: "" };
    ui.S = ST.crea(t, vm.giocatori.map(function (p) { return { nome: p.nome, omino: (cb.omini() || {})[p.id] || (window.SGOmino ? SGOmino.casuale(p.nome) : null) }; }),
      { io: cb.telefono ? -1 : ids.indexOf(cb.myId), esci: function () { fermaRegia(ui); ritmo(ui, null); ui.cb.onEsci(true); }, titolo: "La Ruota della Fortuna", logo: ["LA RUOTA", "DELLA FORTUNA"] });
    var S = ui.S;
    S.sopraLibero = 0.6;   // la telecamera può salire sopra lo studio: lassù c'è il tabellone
    S.vista.classList.add("ru-studio");
    if (cb.targa) S.vista.classList.add("ru-targa");   // chi guarda soltanto: la barra in basso lascia il posto alla targhetta del core
    // in alto, fisso: categoria, tabellone, cosa succede (e l'orologio dei momenti col fiato sospeso)
    ui.cat = el("div", { class: "ru-cat" });
    ui.tab = el("div", { class: "ru-tab" }); ui.celle = [];
    for (var r = 0; r < RIGHE; r++) for (var c = 0; c < COL; c++) {
      var d = el("div", { class: "ru-cella vuota" }); ui.celle.push(d); ui.tab.appendChild(d);
      // mentre risolvi: tocchi una casella coperta per scriverci
      d.addEventListener("click", function (e) { var b = e.currentTarget._buco; if (ui.scrivi && b != null) { ui.cur = b; ui.ridisegna(); } });
    }
    ui.msg = el("div", { class: "ru-msg" });
    ui.orolN = el("b");
    ui.orol = el("div", { class: "ru-orol" }, [ ui.orolN ]);
    ui.punti = el("div", { class: "ru-punti" }); ui.chip = {};
    vm.giocatori.forEach(function (p, i) {
      var v = el("b"), c = el("span", { class: "ru-chip" }, [ el("i", { style: "background:" + ((ST.COLORI || [])[i % 10] || "#ffc247") }), el("span", { class: "n", text: p.nome }), v ]);
      c._v = v; ui.chip[p.id] = c; ui.punti.appendChild(c);
    });
    ui.sopra = el("div", { class: "ru-sopra" }, [ ui.cat, ui.tab, ui.msg, ui.punti, ui.orol ]);
    S.vista.appendChild(ui.sopra);
    // la ruota (va sul maxischermo) e i tasti (nella barra in basso)
    ui.canvas = el("canvas", { class: "ru-disco", width: "440", height: "440" });
    ui.kRuota = (vm.regole && vm.regole.express ? "e" : "") + ":" + (vm.mist || "");
    disegnaRuota(ui.canvas, spicchiDi(vm.regole && vm.regole.express, vm.mist));
    // ❓ la scritta grande del Mistero (si apre… / +10.000! / BANCAROTTA!)
    ui.mistIco = el("div", { class: "ico", text: "❓" }); ui.mistTx = el("div", { class: "tx" }); ui.mistSub = el("div", { class: "sub" });
    ui.mist = el("div", { class: "ru-mist" }, [ ui.mistIco, ui.mistTx, ui.mistSub ]);
    S.vista.appendChild(ui.mist);
    // ✍️ chi guarda può mandare una frase all'host (online, con «Frasi: Anche le nostre»)
    ui.scriviNota = el("div", { class: "ru-scrivi-nota" });
    ui.scriviBtn = el("button", { class: "ru-btn scrivi", type: "button", text: "✍️ Scrivi una frase", onclick: function () { apriFormFrase(ui); } });
    ui.scriviR = el("div", { class: "ru-scrivi-riga" }, [ ui.scriviNota, ui.scriviBtn ]);
    ui.scriviR.hidden = true;
    ui.ruota = el("div", { class: "ru-ruota-sch" }, [ ui.canvas,
      el("div", { class: "ru-freccia", html: "<svg viewBox='0 0 10 10'><polygon points='0,0 10,0 5,10' fill='#ffc247' stroke='#7a4a00' stroke-width='.6'/></svg>" }),
      el("div", { class: "ru-centro" }), ui.oro = el("div", { class: "ru-oro" }) ]);
    // la frase lampo sul maxischermo: la campanella
    ui.campana = el("div", { class: "ru-campana", text: "🔔" });
    ui.lampoSub = el("div", { class: "ru-sch-sub" });
    ui.lampoTit = el("div", { class: "ru-sch-tit", text: "PRENOTA!" });
    ui.panLampo = el("div", { class: "ru-quadro ru-lampo-sch" }, [ ui.campana, ui.lampoTit, ui.lampoSub ]);
    // la finale sul maxischermo: le buste
    ui.busteTit = el("div", { class: "ru-sch-tit piccolo" });
    ui.busteRiga = el("div", { class: "ru-buste" }); ui.buste = [];
    for (var k = 0; k < BUSTE.length; k++) {
      var bv = el("b", { class: "v" }), bu = el("div", { class: "ru-busta" }, [ el("span", { class: "n", text: String(k + 1) }), bv ]);
      bu._v = bv; ui.buste.push(bu); ui.busteRiga.appendChild(bu);
    }
    ui.busteSub = el("div", { class: "ru-sch-sub" });
    ui.panBuste = el("div", { class: "ru-quadro ru-buste-sch" }, [ ui.busteTit, ui.busteRiga, ui.busteSub ]);
    ui.azioni = el("div", { class: "ru-azioni" });
    // la barretta del tempo che resta a chi deve toccare (si accorcia da sola, senza ridisegnare i tasti)
    ui.tempoBar = el("i"); ui.tempo = el("div", { class: "ru-tempo" }, [ ui.tempoBar ]);
    // il Jolly sul leggio di chi ce l'ha
    ui.jb = S.L.map(function (X) { var j = el("div", { class: "ru-jolly" }); X.el.appendChild(j); return j; });
    ui.lk = S.L.map(function (X) { var j = el("div", { class: "ru-lock", text: "🔒" }); X.el.appendChild(j); return j; });
    vm.giocatori.forEach(function (p, i) { ST.puntiLeggio(S, i, p.soldi); ui.mostrati[p.id] = p.soldi; });
    function via() { ui.schTipo = ""; schermo(ui, ui.vm); ST.barra(S, ui.cb.guarda ? [ ui.tempo, ui.azioni ] : [ ui.tempo, ui.azioni, ui.scriviR ]); ui.sopra.classList.remove("via"); }   // (chi guarda col link non scrive frasi: la riga non c’è proprio)
    if (vm.sigla) {   // a inizio partita la sigla dello studio (il tabellone compare dopo); quando si rigioca, una corta
      ui.sigla = true; ui.sopra.classList.add("via");
      Promise.resolve(vm.sigla === "corta" ? siglaCorta(S) : ST.apertura(S)).catch(function () {}).then(function () {
        if (ui.cb.onSiglaFinita) ui.cb.onSiglaFinita();
        if (ui.tagliata) return;
        ui.sigla = false;
        if (!S.vivo() || R !== ui || ui.finita) return;
        via(); aggiorna(ui, ui.vm);
      });
    } else via();
    ui.taglia = function () { if (!ui.sigla) return; ui.sigla = false; ui.tagliata = true; ST.viaTerzo(S); via(); };
    return ui;
  }
  // quando si rigioca: un saluto veloce invece della presentazione dei concorrenti
  function siglaCorta(S) {
    ST.viaBarra(S); ST.logoSchermo(S);
    ST.largo(S, 0);
    ST.terzo(S, null, "Si gioca ancora!", "La Ruota della Fortuna", "🎡");
    ST.pubblico(S, "applauso");
    return new Promise(function (fatto) { setTimeout(function () { ST.viaTerzo(S); fatto(); }, SIGLA_CORTA); });
  }
  // la ruota disegnata una volta sola; poi si fa girare tutta (transform), senza ridisegnarla
  function disegnaRuota(cv, spicchi) {
    var c = cv.getContext("2d"), Rr = 220, Rs = Rr - 15, passo = Math.PI * 2 / spicchi.length, k;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, cv.width, cv.height);   // (si ridisegna quando arriva o si apre il Mistero)
    c.translate(Rr, Rr);
    // il bordo: anello blu notte con le lampadine calde, filo d'oro fuori
    c.beginPath(); c.arc(0, 0, Rr - 1, 0, Math.PI * 2); c.fillStyle = "#171230"; c.fill();
    c.beginPath(); c.arc(0, 0, Rr - 2, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = "#ffc247"; c.stroke();
    var lamp = Math.max(24, spicchi.length * 2);
    for (k = 0; k < lamp; k++) {
      var al = -Math.PI / 2 + (k + 0.5) * Math.PI * 2 / lamp, lx = Math.cos(al) * (Rr - 8.5), ly = Math.sin(al) * (Rr - 8.5);
      c.beginPath(); c.arc(lx, ly, 6.5, 0, Math.PI * 2); c.fillStyle = "rgba(255,194,71,.18)"; c.fill();
      c.beginPath(); c.arc(lx, ly, 3.1, 0, Math.PI * 2); c.fillStyle = k % 2 ? "#ffe3a1" : "#ffc247"; c.fill();
    }
    spicchi.forEach(function (sp, i) {
      var a0 = -Math.PI / 2 + i * passo, a1 = a0 + passo, col = sp.s === "bancarotta" ? "#08080f" : sp.s === "passa" ? "#eceffa" : sp.s === "jolly" ? "#7a3fe0" : sp.s === "express" ? "#a0126b" : sp.s === "mistero" ? "#12153a" : sp.s === "raddoppia" ? "#ffc247" : COLORI[i % COLORI.length];
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, Rs, a0, a1); c.closePath();
      c.fillStyle = col; c.fill();
      // luce morbida: più scuro vicino al perno, pieno verso il bordo
      var g = c.createRadialGradient(0, 0, 10, 0, 0, Rs); g.addColorStop(0, "rgba(8,8,20,.5)"); g.addColorStop(.6, "rgba(8,8,20,.08)"); g.addColorStop(1, "rgba(8,8,20,0)");
      c.fillStyle = g; c.fill();
      c.strokeStyle = "rgba(255,255,255,.3)"; c.lineWidth = 2; c.stroke();
      c.save(); c.rotate(a0 + passo / 2); c.textAlign = "right"; c.textBaseline = "middle";
      c.fillStyle = sp.s === "passa" || sp.s === "raddoppia" ? "#1b1f3a" : sp.s === "express" ? "#ffe9a8" : sp.s === "mistero" ? "#ffc247" : sp.s === "bancarotta" ? "#ff8ea8" : (COLORI_TESTO[col] || "#fff"); c.font = "900 " + (sp.s ? 19 : 26) + "px system-ui, sans-serif";
      c.fillText(sp.s === "bancarotta" ? "BANCAROTTA" : sp.s === "passa" ? "PASSA" : sp.s === "jolly" ? "JOLLY" : sp.s === "express" ? "EXPRESS" : sp.s === "mistero" ? "? MISTERO ?" : sp.s === "raddoppia" ? "RADDOPPIA ×2" : fmtN(sp.v), Rs - 12, 0);
      c.restore();
    });
    c.beginPath(); c.arc(0, 0, Rs, 0, Math.PI * 2); c.lineWidth = 3; c.strokeStyle = "rgba(255,194,71,.85)"; c.stroke();
  }

  // ---- la telecamera: la parte di studio che si vede sta tra il tabellone (sopra) e la barra dei tasti (sotto) ----
  function banda(ui) {
    var S = ui.S, top = ui.sopra.offsetTop + ui.sopra.offsetHeight + 4;
    var bar = S.barraEl.classList.contains("on") ? S.barraEl.offsetHeight : 0, bot = S.VH - bar - 2;
    if (bot - top < S.VH * 0.22) { top = S.VH * 0.32; bot = S.VH * 0.72; }
    return { top: top, bot: bot };
  }
  // l'inquadratura che mette il soggetto (centro cx,cy; largo w, alto h, in misure dello studio) al centro di quella parte
  function nellaBanda(ui, cx, cy, w, h) {
    var S = ui.S, b = banda(ui), s = Math.min(S.VW * 0.96 / w, (b.bot - b.top) * 0.94 / h);
    var W = S.VW / s, HH = S.VH / s, ccy = cy - ((b.top + b.bot) / 2 - S.VH / 2) / s;
    return { x: cx - W / 2, y: ccy - HH / 2, w: W, h: HH };
  }
  function shotRuota(ui) { var q = ui.S.R.schermo, lato = Math.min(q.w, q.h) * 0.94; return nellaBanda(ui, q.x + q.w / 2, q.y + q.h / 2, lato * 1.06, lato * 1.06); }
  function shotLeggio(ui, i) { var S = ui.S, p = S.posti[i] || S.posti[0]; return nellaBanda(ui, p.cx, p.top + p.w * 0.62, Math.max(0.6 * S.VW, p.w * 1.3), p.w * 1.34); }
  function shotTutti(ui) {   // tutti i concorrenti insieme (la frase lampo: si vede chi prenota)
    var S = ui.S, x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    S.posti.forEach(function (p) { x0 = Math.min(x0, p.cx - p.w * 0.62); x1 = Math.max(x1, p.cx + p.w * 0.62); y0 = Math.min(y0, p.top - p.w * 0.05); y1 = Math.max(y1, p.top + p.w * 1.3); });
    return nellaBanda(ui, (x0 + x1) / 2, (y0 + y1) / 2, x1 - x0, y1 - y0);
  }
  function inquadra(ui, cosa, i, ms) {
    if (cosa === "leggio" && !(i >= 0)) return;
    var k = cosa + ":" + (i == null ? "" : i);
    if (k === ui.inq) return;
    ui.inq = k;
    ST.inquadra(ui.S, cosa === "ruota" ? function () { return shotRuota(ui); } : cosa === "tutti" ? function () { return shotTutti(ui); } : function () { return shotLeggio(ui, i); }, ms == null ? 700 : ms);
  }
  // dove guarda la telecamera in ogni momento della partita
  function inquadraFase(ui, vm, ms) {
    var f = vm.fase, ids = ui.ids, L = vm.lampo;
    if (f === "girando" || f === "finemanche" || f === "fintro") return;   // (ci pensano la ruota, la festa e lo spettacolo)
    if (f === "vgiro" || f === "fbusta" || f === "fesito" || f === "fcambio") return inquadra(ui, "ruota", null, ms);
    if (f === "lampo") return L && L.chi ? inquadra(ui, "leggio", ids.indexOf(L.chi), ms) : inquadra(ui, "tutti", null, ms);
    if (f === "lampofine") return L && L.vince ? inquadra(ui, "leggio", ids.indexOf(L.vince), ms) : inquadra(ui, "tutti", null, ms);
    if (FASI_FIN.indexOf(f) >= 0) return inquadra(ui, "leggio", ids.indexOf(vm.fin && vm.fin.id), ms);
    inquadra(ui, "leggio", ids.indexOf(vm.turno), ms);
  }
  function dopo(ui, ms, fn) { ui.timer.push(setTimeout(function () { if (ui.S.vivo() && !ui.finita) fn(); }, ms)); }
  function fermaRegia(ui) { ui.timer.forEach(clearTimeout); ui.timer = []; ui.show = false; }
  function facciaPerUnPo(ui, i, f) {
    if (!(i >= 0)) return;
    ST.faccia(ui.S, i, f);
    clearTimeout(ui["tf" + i]); ui["tf" + i] = setTimeout(function () { if (ui.S.vivo()) ST.faccia(ui.S, i, null); }, 1900);
  }
  function rianima(n, cls) { if (!n) return; n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); }
  function trovaG(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return vm.giocatori[i]; return null; }
  function conta(tab, L) { var n = 0; tab.split("").forEach(function (ch) { if (eLettera(ch) && base(ch) === L) n++; }); return n; }
  // chi deve toccare adesso (la frase lampo: chi ha prenotato; la finale: il campione)
  var GIOCHI_VELOCI = {
    classica: { ico: "🔔", tit: "PRENOTA!", nome: "Frase lampo!", sotto: "Chi la sa prenota: vale " + fmtN(PREMIO_LAMPO) },
    tempo: { ico: "⏳", tit: "LA RUOTA DEL TEMPO", nome: "La ruota del tempo!", sotto: "Cosa è successo in quell'anno? Chi la sa prenota: " + fmtN(PREMIO_LAMPO) },
    mondo: { ico: "🌍", tit: "GIRAMONDO", nome: "GiraMondo!", sotto: "Cosa vuol dire questa parola straniera? Chi la sa prenota: " + fmtN(PREMIO_LAMPO) },
    triplete: { ico: "🎯", tit: "TRIPLETE", nome: "Triplete!", sotto: "3 frasi sullo stesso tema: " + fmtN(PREMIO_LAMPO) + " l'una, tutte e 3 +" + fmtN(TRI_BONUS) },
    cruci: { ico: "🧩", tit: "CRUCIRUOTA", nome: "CruciRuota!", sotto: "4 parole sul tema, " + fmtN(CRUCI_PAROLA) + " l'una: prenota e scrivi quelle che sai" }
  };
  // la riga sopra il tabellone nei giochi veloci
  function titoloLampo(L, cat) {
    var t = L && L.tipo;
    if (t === "tempo") return "⏳ LA RUOTA DEL TEMPO · " + cat;
    if (t === "mondo") return "🌍 " + cat + " VUOL DIRE…";
    if (t === "cruci") return "🧩 CRUCIRUOTA · " + cat;
    if (t === "triplete") return "🎯 TRIPLETE " + (L.tri ? L.tri.n + "/" + L.tri.di : "") + " · " + cat;
    return "🔔 " + cat + " · frase lampo";
  }
  function attore(vm) {
    if (vm.fase === "lampo") return vm.lampo && vm.lampo.chi;
    if (FASI_FIN.indexOf(vm.fase) >= 0) return vm.fin && vm.fin.id;
    return vm.turno;
  }
  // sui leggii i totali della partita (non i soldi della manche) in questi momenti
  function totali(f) { return f === "finemanche" || f === "lampo" || f === "lampofine" || FASI_FIN.indexOf(f) >= 0; }
  var ACCESI = ["gira", "consonante", "vocale", "risolvi", "girando", "sceltaexp", "express", "vlettera", "vdecidi", "lampo", "fintro", "fbusta", "flettere", "frivela", "ftempo", "fcambio", "fesito", "mistero", "mapre", "mrivela"];

  function aggiorna(ui, vm) {
    var S = ui.S, cb = ui.cb, prec = ui.prec || {}, f = vm.fase, ids = ui.ids, L = vm.lampo, F = vm.fin;
    var att = attore(vm), ia = ids.indexOf(att), it = ids.indexOf(vm.turno), ip = ids.indexOf(prec.turno);
    var mioTurno = !!att && (cb.telefono ? !isBot(vm, att) : att === cb.myId);
    // 🔒 «La so!»: si scrive in segreto mentre gioca un altro (si chiude da solo quando tocca a me o finisce la manche)
    if (ui.segreto && (ui.segreto !== segK(vm) || mioTurno || !puoSegretaQui(ui, vm))) { ui.segreto = null; ui.kTast = ""; ui.scritto = []; ui.cur = 0; }
    if (ui.segreto || mioTurno && f === "ftempo") rimappaSegreto(ui, vm);   // (anche nel Rubasecondi escono lettere mentre si scrive)
    var chiama = f === "ftempo" && F && F.b === 3 && ui.finScrivi !== (vm.gameId || "") + ":rs";   // (Rubasecondi: sto chiamando lettere)
    var inRisolvi = mioTurno && (f === "risolvi" || f === "ftempo" && !chiama || (f === "lampo" && !!(L && L.chi))) || !!ui.segreto;
    if (!inRisolvi) { ui.scritto = []; ui.cur = 0; }
    ui.sopra.classList.toggle("scrivi", inRisolvi);
    ui.sopra.classList.toggle("express", !!vm.exp);
    ui.sopra.classList.toggle("veloce", !!vm.veloce && f !== "finemanche");
    ui.sopra.classList.toggle("finale", FASI_FIN.indexOf(f) >= 0);
    ui.sopra.classList.toggle("lampo", f === "lampo" || f === "lampofine");
    var cat = (vm.cat || "").toUpperCase();
    var firma = vm.firma != null ? "  " + firmaTesto(vm.firma) : "";   // ✍️ la frase degli amici: la firma accanto alla categoria
    var tc = f === "lampo" || f === "lampofine" ? titoloLampo(L, cat) : FASI_FIN.indexOf(f) >= 0 ? "🏆 " + cat + " · finale" + (F && f !== "fintro" ? " " + (F.b || 1) + "/3 · " + FIN_NOMI[(F.b || 1) - 1].toUpperCase() : "") :
      vm.veloce ? "⚡ " + cat + firma + " · ultimo round" : cat + firma + "  ·  " + (firma ? "" : "manche ") + vm.manche + "/" + vm.mancheTot;
    if (ui.cat.textContent !== tc) ui.cat.textContent = tc;
    // ❓ la ruota si ridisegna solo quando cambia (Mistero che arriva o che viene aperto)
    var kr = (vm.regole && vm.regole.express ? "e" : "") + ":" + (vm.mist || "");
    if (kr !== ui.kRuota) { ui.kRuota = kr; disegnaRuota(ui.canvas, spicchiDi(vm.regole && vm.regole.express, vm.mist)); }
    misteroGrande(ui, vm);
    scriviRiga(ui, vm);
    // la frase lampo: quando questo telefono ha visto comparire ogni lettera (serve a misurare i riflessi)
    if (f === "lampo" && L) { var kv = L.k + ":" + L.n; if (!ui.lampoVisto[kv]) ui.lampoVisto[kv] = performance.now(); }
    tabellone(ui, vm, inRisolvi);
    if (ui.msg.textContent !== (vm.msg || "")) ui.msg.textContent = vm.msg || "";
    tempo(ui, vm);
    orologio(ui, vm);
    ritmo(ui, vm.exp && ["express", "vocale", "risolvi"].indexOf(f) >= 0 ? "express" : vm.veloce && ["vlettera", "vdecidi", "risolvi"].indexOf(f) >= 0 ? "veloce" : null);
    schermo(ui, vm);
    // ---- i leggii: i soldi della manche (nella frase lampo, a fine manche e nella finale il totale), chi è uscito, il Jolly ----
    var tot = totali(f);
    ids.forEach(function (id, i) {
      var p = trovaG(vm, id), fu = !p || !!p.via;
      if (!!ui.fuori[id] !== fu) { ui.fuori[id] = fu; ST.fuori(S, i, fu); }
      var nj = p && !fu ? p.jolly || 0 : 0;
      if (ui.jb[i] && ui.jolly[id] !== nj) {
        ui.jolly[id] = nj; ui.jb[i].textContent = nj > 1 ? "🃏×" + nj : "🃏"; ui.jb[i].classList.toggle("on", nj > 0);
      }
      var lkOn = !fu && !!vm.lock && vm.lock.indexOf(id) >= 0 && FASI_SEG.indexOf(f) >= 0;
      if (ui.lk[i] && ui.lk[i]._on !== lkOn) { ui.lk[i]._on = lkOn; ui.lk[i].classList.toggle("on", lkOn); }
      var ch = ui.chip[id];
      if (ch) {
        var cv = fu ? "🚪" : fmtN(tot ? p.totale : p.soldi) + (lkOn ? " 🔒" : "");
        if (ch._v.textContent !== cv) ch._v.textContent = cv;
        var on = id === att && !tot; if (ch._on !== on) { ch._on = on; ch.classList.toggle("on", on); }
      }
      if (fu) return;
      var val = tot ? p.totale : p.soldi;
      if (ui.mostrati[id] === val && ui.modoLeggii === tot) return;
      var d = 0;
      if (f === "finemanche" && prec.fase && prec.fase !== "finemanche") d = vm.vince && vm.vince.id === id ? vm.vince.vincita : 0;
      else if ((f === "lampofine" || f === "lampo") && ui.modoLeggii === tot && prec.manche === vm.manche) d = val - (ui.mostrati[id] || 0);
      else if (!tot && prec.manche === vm.manche && ui.modoLeggii === tot) d = val - (ui.mostrati[id] || 0);
      ST.puntiLeggio(S, i, val, d);
      ui.mostrati[id] = val;
    });
    ui.modoLeggii = tot;
    // le luci: nella frase lampo restano accese tutte quelle di chi può ancora prenotare
    if (!ui.show) {
      if (f === "lampo" && L && !L.chi) ids.forEach(function (id, i) { var p = trovaG(vm, id); ST.accendi(S, i, !!p && !p.via && L.fuori.indexOf(id) < 0); });
      else ST.accendiSolo(S, ACCESI.indexOf(f) >= 0 ? (f === "girando" ? it : ia) : -1);
    }
    // ---- cosa è successo: telecamera, suoni e facce (uguali su tutti i telefoni) ----
    var tieni = 0;   // per quanto la telecamera resta su un momento prima di tornare a chi è di turno
    if (vm.giroN !== ui.giroN) {   // un giro nuovo: la telecamera va sulla ruota e la ruota gira
      var primoGiro = ui.giroN === -1; ui.giroN = vm.giroN;
      if (!primoGiro && f === "girando") {
        fermaRegia(ui); ui.inq = ""; inquadra(ui, "ruota", null, 600);
        var ang = vm.angolo, da = ui.ang == null ? ang - 1440 : ui.ang;
        ui.canvas.style.transition = "none"; ui.ang = ang;
        dopo(ui, 600, function () {
          ui.canvas.style.transition = "transform " + (T_GIRO - 900) + "ms cubic-bezier(.12,.7,.18,1)";
          ui.canvas.style.transform = "rotate(" + ang + "deg)";
          suonoGiroVero(da, ang, T_GIRO - 900);
        });
      } else { ui.canvas.style.transition = "none"; ui.canvas.style.transform = "rotate(" + vm.angolo + "deg)"; ui.ang = vm.angolo; }
    }
    if (prec.fase) {
      if (prec.fase === "girando" && f !== "girando") {   // la ruota si è fermata: un attimo sulla ruota
        var sp = spicchiDi(vm.regole && vm.regole.express, vm.mist)[vm.spicchio] || {};
        tieni = 650;
        if (sp.s === "mistero") { rianima(ui.oro, "on"); suonoMistero(); tieni = 900; }
        if (sp.s === "bancarotta" || sp.s === "passa") {   // poi sul concorrente sfortunato, poi su chi tocca
          if (sp.s === "bancarotta") { ST.FX.ohh(); ST.scossa(S); }
          dopo(ui, 650, function () { inquadra(ui, "leggio", ip, 600); facciaPerUnPo(ui, ip, sp.s === "bancarotta" ? "esploso" : "triste"); });
          if (ip !== it) tieni = 2300;
        } else if (sp.s === "jolly") ST.FX.applauso("piano");
        else if (sp.s === "raddoppia") { rianima(ui.oro, "on"); tieni = 900; }
        else if (sp.s === "express") { rianima(ui.oro, "on"); suonoTreno(); ST.FX.applauso("piano"); tieni = 900; }
        else if (sp.v >= 2000 || (vm.veloce && sp.v)) {   // lo spicchio d'oro (e il valore del round veloce): luce dorata sulla ruota e applauso
          rianima(ui.oro, "on");
          ST.FX.applauso("piano"); bip(1318, 0.3, "triangle", 0.07); bip(1760, 0.4, "triangle", 0.07, 0.12);
          if (vm.veloce) tieni = 1300;
        }
      }
      if (vm.ultime.length && vm.ultime.join("") !== (prec.ultime || []).join("")) {   // una lettera trovata
        var n = 0; vm.ultime.forEach(function (x) { n += conta(vm.tab, x); });
        if (n) { suonoLettera(n); facciaPerUnPo(ui, ia >= 0 ? ia : ip, "esulta"); }
        if (n >= 3) ST.FX.applauso("piano");
      }
      if (vm.ev && (!prec.ev || prec.ev.n !== vm.ev.n)) effetto(ui, vm, vm.ev);
      if (f === "finemanche" && prec.fase !== "finemanche" && vm.vince && vm.vince.seg) {
        vm.vince.seg.forEach(function (s, k) {
          var is = ids.indexOf(s.id); if (is < 0) return;
          dopo(ui, 1600 + k * 900, function () { facciaPerUnPo(ui, is, s.b ? "evviva" : "triste"); if (s.b) { ST.puntiLeggio(S, is, ui.mostrati[s.id] || 0, s.b); bip(1318, 0.2, "triangle", 0.06); if (s.id === cb.myId) vibra([25, 35, 25]); } });
        });
      }
      if (f === "finemanche" && prec.fase !== "finemanche") {   // qualcuno ha risolto
        var iv = ids.indexOf(vm.vince && vm.vince.id);
        fermaRegia(ui); ST.FX.applauso("forte"); ST.coriandoli(); suonoVinto();
        if (iv >= 0) { ST.lampo(S); ST.accendiSolo(S, iv); ST.faccia(S, iv, "esulta"); inquadra(ui, "leggio", iv, 800); }
      }
      // ---- i round speciali: i loro momenti di spettacolo ----
      if (f === "lampo" && prec.fase !== "lampo" && L) {   // si apre un gioco veloce
        suonoCampanella(); rianima(ui.campana, "suona");
        var gv0 = GIOCHI_VELOCI[L.tipo] || GIOCHI_VELOCI.classica;
        if (!L.tri || L.tri.n === 1) {
          ST.terzo(S, null, gv0.nome, gv0.sotto, gv0.ico);
          dopo(ui, L.tipo && L.tipo !== "classica" ? 3200 : 2400, function () { ST.viaTerzo(S); });
        }
      }
      if (f === "lampo" && L && prec.lampoN != null && L.n > prec.lampoN && prec.lampoK === L.k) suonoTic();
      if (f === "lampofine" && prec.fase !== "lampofine") {
        var il = ids.indexOf(L && L.vince);
        fermaRegia(ui);
        if (il >= 0) { suonoVinto(); ST.FX.applauso("forte"); ST.lampo(S); ST.accendiSolo(S, il); ST.faccia(S, il, "evviva"); setTimeout(function () { if (S.vivo()) ST.faccia(S, il, null); }, 3000); }
        else ST.FX.ohh();
      }
      if (f === "vgiro" && prec.fase !== "vgiro") {
        suonoCampanella(); suonoVeloce(); ST.lampo(S); rianima(ui.oro, "on");
        ST.terzo(S, null, "🔔 Giro finale!", "La ruota gira una volta sola: ogni consonante vale la cifra + " + fmtN(BONUS_VELOCE), "⚡");
        dopo(ui, 2800, function () { ST.viaTerzo(S); });
      }
      if (f === "fintro" && prec.fase !== "fintro" && F) showCampione(ui, vm);
      if (f === "fcambio" && prec.fase !== "fcambio" && F) {
        var ic = F.esiti[F.esiti.length - 1] ? "✅" : "⏭️";
        if (F.esiti[F.esiti.length - 1]) { suonoVinto(); ST.FX.applauso("forte"); } else ST.FX.ohh();
        ST.terzo(S, null, ic + " Tabellone " + (F.b + 1) + " di 3", FIN_NOMI[F.b] + " · restano " + Math.ceil((F.resta || 0) / 1000) + " secondi", "🏆");
        dopo(ui, 2500, function () { ST.viaTerzo(S); });
      }
      if (f === "fbusta" && prec.fase !== "fbusta" && F) { suonoVinto(); ST.FX.applauso("forte"); ST.coriandoli(); }
      if (f === "fesito" && prec.fase !== "fesito" && F) showEsito(ui);
      if (vm.manche !== prec.manche) ST.tutteNormali(S);
    } else if (f === "fesito") ui.bustaAperta = true;   // arrivato adesso (es. pagina ricaricata): la busta è già aperta
    // ---- poi la telecamera va su chi deve toccare ----
    if (!ui.show && f !== "girando" && f !== "finemanche") {
      if (tieni) dopo(ui, tieni, function () { inquadraFase(ui, ui.vm, 700); });
      else inquadraFase(ui, vm, prec.fase ? 700 : 0);
    }
    ui.prec = { fase: f, turno: vm.turno, manche: vm.manche, ultime: vm.ultime.slice(), msg: vm.msg, ev: vm.ev, lampoN: L ? L.n : null, lampoK: L ? L.k : null };
    disegnaAzioni(ui, vm, mioTurno, att);
    // la barra ha cambiato altezza (es. è comparsa la tastiera): rimetto a fuoco l'inquadratura
    var bh = S.barraEl.offsetHeight;
    if (bh !== ui.barraH) { var primaB = ui.barraH === -1; ui.barraH = bh; if (!primaB && S.shot) ST.camera(S, S.shot(), 350); }
  }
  // i fatti della partita (vm.ev): uguali su tutti i telefoni
  function effetto(ui, vm, e) {
    var S = ui.S, i = ui.ids.indexOf(e.id);
    if (e.t === "no") { suonoNo(); facciaPerUnPo(ui, i, "triste"); }
    else if (e.t === "bancarotta") { suonoNo(); ST.FX.ohh(); ST.scossa(S); facciaPerUnPo(ui, i, "esploso"); }
    else if (e.t === "prenota") { suonoBuzzer(); ST.lampo(S); rianima(ui.campana, "suona"); facciaPerUnPo(ui, i, "pensa"); }
    else if (e.t === "lampono") { suonoNo(); ST.FX.ohh(); facciaPerUnPo(ui, i, "triste"); }
    else if (e.t === "segreta") { bip(660, 0.08, "square", 0.05); bip(990, 0.12, "triangle", 0.05, 0.08); facciaPerUnPo(ui, i, "pensa"); if (ui.lk[i]) rianima(ui.lk[i], "scatta"); }
    else if (e.t === "cruci") { suonoLettera(3); ST.FX.applauso("forte"); ST.lampo(S); facciaPerUnPo(ui, i, "evviva"); vibra(40); }
    else if (e.t === "triplete") { suonoVinto(); ST.pubblico(S, "ovazione"); ST.coriandoli(); facciaPerUnPo(ui, i, "evviva"); vibra([30, 40, 70]); }
    else if (e.t === "raddoppia") { suonoVinto(); ST.FX.applauso("forte"); ST.lampo(S); facciaPerUnPo(ui, i, "evviva"); vibra([25, 35, 25]); }
    else if (e.t === "express") { suonoTreno(); ST.FX.applauso("piano"); facciaPerUnPo(ui, i, "esulta"); }
    else if (e.t === "ruba") { suonoNo(); rianima(ui.orol, "no"); facciaPerUnPo(ui, i, "paura"); vibra(60); }
    else if (e.t === "fino") { suonoNo(); rianima(ui.tab, "no"); facciaPerUnPo(ui, i, "paura"); }
    // ❓ il Mistero: il rullo mentre si apre, poi l'applauso o «Ahi!» (e una vibrazione breve)
    else if (e.t === "mapre") { ST.FX.rullo(1.6); suonoMistero(); facciaPerUnPo(ui, i, "paura"); }
    else if (e.t === "mvinto") { suonoVinto(); ST.lampo(S); ST.pubblico(S, "ovazione"); ST.coriandoli(); facciaPerUnPo(ui, i, "evviva"); vibra([30, 40, 70]); }
    else if (e.t === "mbanca") { suonoNo(); ST.pubblico(S, "ohh"); ST.scossa(S); facciaPerUnPo(ui, i, "esploso"); vibra(90); }
  }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  // la scritta grande del Mistero: si vede finché si apre e quando si scopre (anche a chi rientra in quel momento)
  function misteroGrande(ui, vm) {
    var f = vm.fase, k = f === "mapre" ? "apre" : f === "mrivela" && vm.mres ? (vm.mres.vinto ? "vinto" : "banca") : "";
    if (k === ui.kMist) return;
    ui.kMist = k;
    var n = ui.mist;
    n.classList.toggle("on", !!k); n.classList.toggle("apre", k === "apre"); n.classList.toggle("vinto", k === "vinto"); n.classList.toggle("banca", k === "banca");
    if (!k) return;
    var chi = nomeDi(vm, ui.cb, vm.mres ? vm.mres.id : vm.turno, true);
    ui.mistIco.textContent = k === "apre" ? "❓" : k === "vinto" ? "💰" : "💥";
    ui.mistTx.textContent = k === "apre" ? "MISTERO…" : k === "vinto" ? "+" + fmtN(MIST_PREMIO) + "!" : "BANCAROTTA!";
    ui.mistSub.textContent = k === "apre" ? chi + " apre il Mistero" : k === "vinto" ? "Che colpo, " + chi + "!" : "Ahi! " + chi + " perde i soldi della manche";
    if (k !== "apre") rianima(n, "rivela");
  }
  // ✍️ la riga di chi guarda: «Scrivi una frase» (o «la tua frase è in coda»)
  function guardoIo(ui, vm) { var cb = ui.cb; return !!cb.online && !cb.telefono && !cb.sonoHost && !cb.guarda && !trovaG(vm, cb.myId); }   // (chi guarda soltanto col link no: le sue mosse il core le butta)
  function scriviRiga(ui, vm) {
    var si = guardoIo(ui, vm) && !!(vm.regole && vm.regole.frasi === "nostre");
    if (ui.scriviR.hidden === si) ui.scriviR.hidden = !si;
    if (!si) { if (ui.form) ui.form.classList.remove("on"); return; }
    var coda = (vm.coda || []).indexOf(ui.cb.myId) >= 0;
    var nota = coda ? "✅ La tua frase è in coda: esce in una prossima manche" : ui.notaFrase || "Chi guarda può dare una frase alla ruota";
    if (ui.scriviNota.textContent !== nota) ui.scriviNota.textContent = nota;
    if (ui.scriviBtn.hidden !== coda) ui.scriviBtn.hidden = coda;
    if (coda && ui.form) ui.form.classList.remove("on");
  }
  // il foglio per scrivere la frase (in alto, sopra al tabellone: la tastiera del telefono non lo copre)
  function apriFormFrase(ui) {
    var el = ui.el;
    if (!ui.form) {
      ui.fCat = el("input", { type: "text", class: "ru-f-in", maxlength: String(CAT_MAX), placeholder: "Categoria (es. Il motto di Paky)", autocomplete: "off" });
      ui.fFr = el("input", { type: "text", class: "ru-f-in maiu", maxlength: "48", placeholder: "La frase (es. CHI DORME NON PIGLIA PESCI)", autocomplete: "off", autocapitalize: "characters" });
      ui.fNota = el("div", { class: "ru-f-nota", text: "Solo lettere, spazi e ' ! ? , . — al massimo 4 righe da 12. Va solo all'host: nessuno la vede prima." });
      ui.fManda = el("button", { class: "ru-btn risolvi", type: "button", text: "📨 Manda all'host", onclick: function () {
        var c = controllaFrase(ui.fCat.value, ui.fFr.value);
        if (!c.ok) { ui.fNota.textContent = "⚠️ " + c.err; ui.fNota.classList.add("err"); rianima(ui.fNota, "no"); return; }
        ui.fNota.textContent = "📨 La mando all'host…"; ui.fNota.classList.remove("err");
        ui.cb.onFrase(c.c, c.f);
      } });
      ui.form = el("div", { class: "ru-form" }, [ el("b", { text: "✍️ Una frase per la ruota" }), ui.fCat, ui.fFr, ui.fNota,
        el("div", { class: "ru-riga" }, [ el("button", { class: "ru-btn annulla", type: "button", text: "Annulla", onclick: function () { ui.form.classList.remove("on"); } }), ui.fManda ]) ]);
      ui.S.vista.appendChild(ui.form);
    }
    ui.fNota.classList.remove("err");
    ui.form.classList.add("on");
  }
  // la risposta dell'host (solo a chi l'ha mandata)
  function rispostaFrase(ui, ok, msg) {
    if (!ui.S.vivo()) return;
    if (ok) {
      if (ui.form) { ui.form.classList.remove("on"); ui.fCat.value = ""; ui.fFr.value = ""; }
      ui.notaFrase = msg;
    } else if (ui.form && ui.form.classList.contains("on")) { ui.fNota.textContent = "⚠️ " + msg; ui.fNota.classList.add("err"); rianima(ui.fNota, "no"); }
    else ui.notaFrase = "⚠️ " + msg;
    if (ui.vm) scriviRiga(ui, ui.vm);
  }
  // «⏩ Avanti» sul riepilogo: il mio tocco resta «✅ Avanti», cambia solo il numero
  function tastoAvanti(ui, vm) {
    var el = ui.el, k = vm.kAv, tx = el("span", { class: "tx" }), q = el("span", { class: "quanti" });
    var b = el("button", { class: "ru-btn avanti", type: "button", onclick: function () {
      if (b.disabled) return;
      ui.mioAv = k; agg(ui.vm || vm); ui.cb.onAzione("avanti", k);
    } }, [ tx, q ]);
    function setTx(n, s) { if (n.textContent !== s) n.textContent = s; }
    function agg(v) {
      if (!v || v.kAv !== k) return;
      var l = v.pronti || [], io = ui.cb.myId, mio = ui.mioAv === k || l.indexOf(io) >= 0, n = l.length + (mio && l.indexOf(io) < 0 ? 1 : 0), s = v.servono || 1;
      setTx(tx, mio ? "✅ Avanti" : "⏩ Avanti");
      setTx(q, " · " + Math.min(n, s) + " su " + s);
      b.disabled = mio;
    }
    agg(vm); ui.avAgg = agg;
    ui.azioni.appendChild(el("div", { class: "ru-riga" }, [ b ]));
  }
  // la finale: il campione festeggiato, poi si va alle buste
  function showCampione(ui, vm) {
    var S = ui.S, iv = ui.ids.indexOf(vm.fin.id);
    fermaRegia(ui); ui.show = true;
    ST.accendiSolo(S, -1); ui.inq = ""; inquadra(ui, "tutti", null, 800);
    ST.FX.rullo(1.2);
    dopo(ui, 1300, function () {
      ST.lampo(S); ST.accendiSolo(S, iv); inquadra(ui, "leggio", iv, 900); ST.faccia(S, iv, "evviva");
      ST.terzo(S, iv, vm.fin.nome + " vince la partita!", "E ora la finale, per un premio vero", "🏆");
      ST.pubblico(S, "ovazione"); ST.coriandoli(); ST.FX.fanfara();
    });
    dopo(ui, 5400, function () { ST.viaTerzo(S); ST.faccia(S, iv, null); ui.show = false; });
  }
  function showEsito(ui) {
    var S = ui.S;
    fermaRegia(ui); ui.bustaAperta = false; ui.inq = ""; inquadra(ui, "ruota", null, 700);
    aggiornaBuste(ui, ui.vm);
    ST.FX.rullo(1.4);
    dopo(ui, 1500, function () {
      var F = ui.vm.fin, iv = ui.ids.indexOf(F.id);
      ui.bustaAperta = true; aggiornaBuste(ui, ui.vm);
      if (F.vinto) { ST.lampo(S); ST.pubblico(S, "ovazione"); ST.coriandoli(); ST.FX.fanfara(); ST.faccia(S, iv, "evviva"); }
      else { ST.FX.ohh(); ST.faccia(S, iv, "triste"); }
    });
  }
  // il tabellone: 4 righe da 12, la frase al centro. Le caselle appena scoperte si girano una dopo l'altra.
  function tabellone(ui, vm, inRisolvi) {
    var kt = vm.tab + "|" + (inRisolvi ? ui.scritto.join(",") + "|" + ui.cur : "");
    if (kt === ui.kTab) return;
    ui.kTab = kt;
    if (vm.tab !== ui.tabPrec) {   // quali caselle si sono appena scoperte (solo se è la stessa frase di prima)
      var a = ui.tabPrec, b = vm.tab, nu = {};
      var stessa = !!a && a.length === b.length && a.split("").every(function (ch, k) { return ch === "_" ? b.charAt(k) !== " " : ch === b.charAt(k); });
      if (stessa) for (var k = 0; k < b.length; k++) if (a.charAt(k) === "_" && b.charAt(k) !== "_") nu[k] = 1;
      ui.nuove = nu; ui.tabPrec = b;
    }
    var nn = Object.keys(ui.nuove).length, passo = nn > 8 ? 0.06 : 0.16, nuove = 0, buco = 0;
    var rr = righeIdx(vm.tab), su = Math.floor((RIGHE - Math.min(RIGHE, rr.length)) / 2);
    ui.celle.forEach(function (d) { if (d.className !== "ru-cella vuota") d.className = "ru-cella vuota"; if (d.textContent) d.textContent = ""; d._buco = null; });
    rr.slice(0, RIGHE).forEach(function (riga, r) {
      var x0 = Math.floor((COL - riga.len) / 2);
      for (var j = 0; j < riga.len; j++) {
        var k = riga.start + j, ch = vm.tab.charAt(k), d = ui.celle[(su + r) * COL + x0 + j];
        if (!d || ch === " ") continue;
        if (ch === "_") {
          var sc = inRisolvi && ui.scritto[buco];
          d.className = "ru-cella " + (sc ? "scritta" : "coperta") + (inRisolvi && buco === ui.cur ? " cursore" : ""); d.textContent = sc || "";
          d._buco = inRisolvi ? buco : null; buco++;
        } else {
          var nu2 = !!ui.nuove[k];
          d.className = "ru-cella" + (nu2 ? " nuova" : "");
          // come in TV: le caselle della lettera si girano una dopo l'altra
          var rit = nu2 ? (nuove++ * passo).toFixed(2) + "s" : "";
          if (d.style.animationDelay !== rit) d.style.animationDelay = rit;
          d.textContent = ch;
        }
      }
    });
  }
  // il maxischermo: la ruota, la campanella della frase lampo o le buste della finale
  function schermo(ui, vm) {
    var f = vm.fase, tipo = f === "lampo" || f === "lampofine" ? "lampo" : FASI_FIN.indexOf(f) >= 0 && f !== "fintro" ? "buste" : "ruota";
    if (tipo !== ui.schTipo) {
      ui.schTipo = tipo; ST.vuota(ui.S.sch);
      ui.S.sch.appendChild(tipo === "lampo" ? ui.panLampo : tipo === "buste" ? ui.panBuste : ui.ruota);
    }
    if (tipo === "lampo") {
      var L = vm.lampo, gv = L ? GIOCHI_VELOCI[L.tipo] || GIOCHI_VELOCI.classica : null, cruci = L && L.tipo === "cruci";
      var tit = !L ? "PRENOTA!" : L.tri ? "TRIPLETE " + L.tri.n + "/" + L.tri.di : gv.tit;
      if (ui.lampoTit.textContent !== tit) ui.lampoTit.textContent = tit;
      var ic = gv ? gv.ico : "🔔"; if (ui.campana.textContent !== ic) ui.campana.textContent = ic;
      var trovate = cruci && L.ok ? L.ok.filter(function (x) { return x; }).length : 0;
      var tx = !L ? "" : f === "lampofine" ? (cruci ? (L.vince ? "🧩 " + nomeDi(vm, ui.cb, L.vince, true) + " comincia la manche" : "Nessuna parola trovata") :
          L.vince ? "🎉 " + nomeDi(vm, ui.cb, L.vince, true) + " +" + fmtN(PREMIO_LAMPO) : "Nessuno l'ha indovinata") :
        L.chi ? "✍️ " + nomeDi(vm, ui.cb, L.chi, true) + " risponde…" :
        cruci ? fmtN(CRUCI_PAROLA) + " a parola · trovate " + trovate + " di 4" : "Vale " + fmtN(PREMIO_LAMPO) + " · lettera " + L.n + " di " + L.tot;
      if (ui.lampoSub.textContent !== tx) ui.lampoSub.textContent = tx;
    } else if (tipo === "buste") aggiornaBuste(ui, vm);
  }
  function aggiornaBuste(ui, vm) {
    var F = vm.fin; if (!F) return;
    var aperta = vm.fase === "fesito" && ui.bustaAperta && F.premi, sc = F.buste || [];
    var tit = aperta ? (F.vinto ? "🎉 HA VINTO!" : "PECCATO…") : vm.fase === "fbusta" ? "✉️ LE BUSTE" : "🏆 TABELLONE " + (F.b || 1) + " DI 3";
    if (ui.busteTit.textContent !== tit) ui.busteTit.textContent = tit;
    ui.buste.forEach(function (b, k) {
      var cls = "ru-busta" + (k >= (F.n || BUSTE.length) ? " via" : "") + (sc.indexOf(k) >= 0 ? " scelta" : sc.length ? " spenta" : "") + (aperta ? " aperta" : "") + (aperta && F.vinto && F.busta === k ? " vince" : "");
      if (b.className !== cls) b.className = cls;
      var v = aperta && F.premi[k] != null ? fmtN(F.premi[k]) : "";
      if (b._v.textContent !== v) b._v.textContent = v;
    });
    var es = (F.esiti || []).map(function (x) { return x ? "✅" : "❌"; }).join(" ");
    var sub = aperta ? (F.vinto ? "+" + fmtN(F.premio) + " Speed Coins per " + F.nome + " 🪙" : "Nessuna frase risolta: le buste restano chiuse") :
      vm.fase === "fbusta" ? "Frasi risolte: " + (F.risolte || 0) + " · una busta per ogni frase, vince la più ricca" :
      FIN_NOMI[(F.b || 1) - 1] + (es ? " · " + es : "") + " · ogni frase risolta = una busta";
    if (ui.busteSub.textContent !== sub) ui.busteSub.textContent = sub;
  }
  function isBot(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return vm.giocatori[i].bot; return false; }
  function nomeDi(vm, cb, id, terza) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return id === cb.myId && !cb.telefono && !terza ? "te" : vm.giocatori[i].nome; return "?"; }
  // la barretta del tempo: parte solo quando l'host dà un tempo nuovo, poi si accorcia da sola (CSS)
  function tempo(ui, vm) {
    var k = vm.resta && vm.kTempo ? vm.kTempo : "";
    if (k === ui.kTempo) return;
    ui.kTempo = k;
    var b = ui.tempoBar;
    b.style.animation = "none";
    ui.tempo.classList.toggle("on", !!k);
    if (!k) return;
    var tot = Math.max(vm.tempoTot || 0, vm.resta);
    void b.offsetWidth;
    b.style.animation = "ruTempo " + tot + "ms linear -" + Math.max(0, tot - vm.resta) + "ms forwards";
  }
  // l'orologio grande dei momenti col fiato sospeso (5 secondi del round veloce, 10 della finale): ticchetta
  function orologio(ui, vm) {
    var k = (vm.fase === "vdecidi" || vm.fase === "ftempo") && vm.resta && vm.kTempo ? vm.kTempo : "";
    if (k === ui.kOrol) return;
    ui.kOrol = k; clearInterval(ui.tOrol); ui.tOrol = null;
    ui.orol.classList.toggle("on", !!k);
    if (!k) return;
    var fine = Date.now() + vm.resta - (vm.grazia || 0), ultimo = -1;
    function tic() {
      if (!ui.S.vivo() || ui.kOrol !== k || ui.finita) { clearInterval(ui.tOrol); return; }
      var s = Math.max(0, Math.ceil((fine - Date.now()) / 1000));
      if (s === ultimo) return;
      ultimo = s; ui.orolN.textContent = String(s);
      ui.orol.classList.toggle("urgente", s <= 3);
      rianima(ui.orol, "tic");
      if (s > 0) bip(s <= 3 ? 1480 : 1150, 0.07, "square", 0.04);
    }
    tic(); ui.tOrol = setInterval(tic, 200);
  }
  // il sottofondo dei momenti speciali: il cuore che batte sull'Express, il ticchettio del round veloce
  function ritmo(ui, tipo) {
    if (ui.ritmoTipo === tipo) return;
    ui.ritmoTipo = tipo; clearInterval(ui.tRitmo); ui.tRitmo = null;
    if (!tipo) return;
    var k = 0;
    ui.tRitmo = setInterval(function () {
      if (!ui.S.vivo() || ui.finita) { clearInterval(ui.tRitmo); ui.tRitmo = null; return; }
      k++;
      if (tipo === "express") { bip(98, 0.13, "triangle", 0.14); bip(82, 0.12, "triangle", 0.1, 0.19); }
      else bip(k % 2 ? 1900 : 1450, 0.025, "square", 0.016);
    }, tipo === "express" ? 950 : 460);
  }
  // scrivere la soluzione: la lettera va nella casella col cursore, poi il cursore va alla prossima vuota
  function scriviLettera(ui, L) {
    var buchi = (ui.vm.tab.match(/_/g) || []).length;
    if (!buchi || ui.vm.chiamate.indexOf(L) >= 0) return;
    ui.scritto[ui.cur] = L;
    for (var k = 1; k <= buchi; k++) { var j = (ui.cur + k) % buchi; if (!ui.scritto[j]) { ui.cur = j; break; } }
    ui.ridisegna();
  }
  function cancellaLettera(ui) {
    if (ui.scritto[ui.cur]) ui.scritto[ui.cur] = "";
    else if (ui.cur > 0) { ui.cur--; ui.scritto[ui.cur] = ""; }
    ui.ridisegna();
  }
  // su computer si può scrivere anche con la tastiera vera
  var tastieraPronta = false;
  function tastiera() {
    if (tastieraPronta) return; tastieraPronta = true;
    document.addEventListener("keydown", function (e) {
      var ui = R;
      if (!ui || !ui.scrivi || !ui.S.vivo() || e.ctrlKey || e.metaKey || e.altKey) return;
      var k = String(e.key || "").toUpperCase();
      if (/^[A-Z]$/.test(k)) scriviLettera(ui, k);
      else if (e.key === "Backspace") cancellaLettera(ui);
      else if (e.key === "ArrowLeft") { ui.cur = Math.max(0, ui.cur - 1); ui.ridisegna(); }
      else if (e.key === "ArrowRight") { ui.cur = Math.min((ui.vm.tab.match(/_/g) || []).length - 1, ui.cur + 1); ui.ridisegna(); }
      else if (e.key === "Enter") { if (ui.okBtn && !ui.okBtn.disabled) ui.okBtn.click(); }
      else return;
      e.preventDefault();
    });
  }
  // il conto alla rovescia sul tasto di chi deve toccare (quello del core): conta il tempo che dà l'host
  function contoSu(ui, vm, nodo) {
    if (!nodo || !vm.resta || !vm.kTempo || !ui.t.contoAvanti) return;
    var sec = Math.max(1, Math.ceil((vm.resta - (vm.grazia || 0)) / 1000));
    ui.t.contoAvanti(nodo, sec, null, "ruota|" + (vm.gameId || "") + "|" + vm.kTempo);
  }
  // "Prenoto!": quanto ci ho messo da quando ho visto l'ultima lettera (misurato qui, così la rete lenta non conta)
  function prenoto(ui, pid) {
    var vm = ui.vm, L = vm && vm.lampo;
    if (!L || L.chi || vm.fase !== "lampo") return;
    var t0 = ui.lampoVisto[L.k + ":" + L.n], ms = t0 ? Math.round(performance.now() - t0) : 0;
    if (!ui.cb.telefono) { ui.premuto = L.k + ":" + L.prove; ui.kTast = ""; disegnaAzioni(ui, vm, false, null); }
    ui.cb.onAzione("prenoto", { n: L.n, ms: ms, p: pid || null });
  }
  // un tasto che risponde appena il dito tocca (conta per i riflessi), una volta sola per tocco
  function tastoSubito(el, cls, html, fn) {
    var b = el("button", { class: "ru-btn " + cls, html: html }), ult = 0;
    function via(e) { if (b.disabled || Date.now() - ult < 600) return; ult = Date.now(); if (e && e.cancelable && e.type === "pointerdown") e.preventDefault(); fn(); }
    b.addEventListener("pointerdown", via);
    b.addEventListener("click", via);
    return b;
  }
  function disegnaAzioni(ui, vm, mioTurno, att) {
    var cb = ui.cb, el = ui.el, f = vm.fase, L = vm.lampo, F = vm.fin;
    var me = trovaG(vm, cb.myId);
    var chiave = [f, att, vm.turno, vm.chiamate.join(""), mioTurno, JSON.stringify(vm.puo), f === "lampo" ? "" : vm.tab, me ? (me.via ? "via" : "in") : "no", vm.kTempo || "", vm.cons,
      L ? [L.chi, L.fuori.join(","), L.prove, L.k].join("/") : "", ui.segreto || "", (vm.lock || []).join(","), F ? [F.busta, (F.buste || []).join(","), F.b, F.voc, F.scelte.join(""), ui.finScrivi || ""].join("/") : "", ui.premuto || "", vm.kAv || "", vm.mres ? vm.mres.vinto : ""].join("|");
    ui.scrivi = mioTurno && (f === "risolvi" || f === "ftempo" || (f === "lampo" && !!(L && L.chi))) || !!ui.segreto;
    if (chiave === ui.kTast) { if (ui.scrivi) statoScritto(ui); if (ui.avAgg) ui.avAgg(vm); return; }   // (cambia solo il numero di «⏩ Avanti»)
    ui.kTast = chiave; svuota(ui.azioni); ui.okBtn = null; ui.annBtn = null; ui.rsStato = null; ui.avAgg = null;
    if (ui.facc === undefined) ui.facc = cb.online && !cb.telefono && !cb.targa && ui.t.faccine ? ui.t.faccine() : null;   // la fila delle faccine (online)
    function stato(txt, cls) { var d = el("div", { class: "ru-stato" + (cls ? " " + cls : ""), text: txt }); ui.azioni.appendChild(d); return d; }
    function aspetta(txt) { stato(txt); if (ui.facc) ui.azioni.appendChild(ui.facc); }   // chi guarda: cosa succede e le faccine
    function btn(cls, txt, fn, off) { var b = el("button", { class: "ru-btn " + cls, text: txt, onclick: fn }); if (off) b.disabled = true; return b; }
    function riga(n) { ui.azioni.appendChild(el("div", { class: "ru-riga" }, n)); }
    ui.ridisegna = function () { ui.kTab = ""; aggiorna(ui, ui.vm); };
    var chi = cb.telefono && att ? nomeDi(vm, cb, att) + ", " : "", nAtt = att ? nomeDi(vm, cb, att, true) : "";
    if (!mioTurno && ui.segreto) return tastiSegreto(ui, vm);   // 🔒 si scrive in segreto anche mentre la ruota gira
    if (f === "girando") return stato(vm.veloce ? "⚡ La ruota gira una volta sola…" : "🎡 La ruota gira…");
    if (f === "vgiro") return aspetta("🔔 Giro finale: la ruota gira una volta sola!");
    if (f === "mapre") return aspetta("❓ " + nAtt + " apre il Mistero… +" + fmtN(MIST_PREMIO) + " o Bancarotta?");
    if (f === "mrivela") return aspetta(vm.mres && vm.mres.vinto ? "💰 Mistero: +" + fmtN(MIST_PREMIO) + " per " + nAtt + "!" : "💥 Mistero: Bancarotta per " + nAtt + "!");
    if (f === "finemanche") {
      if (!cb.online || cb.telefono || !vm.kAv) return aspetta(vm.manche >= vm.mancheTot ? "Ultima manche finita!" : "Tra poco la manche " + (vm.manche + 1) + "… (sui leggii i totali)");
      // online: il riepilogo col conto alla rovescia (lo tiene l'host) e «⏩ Avanti» per chi gioca
      var vv = vm.vince;
      stato((vv ? "🎉 " + nomeDi(vm, cb, vv.id, true) + " risolve: +" + fmtN(vv.vincita) + " · " : "") + (vm.manche >= vm.mancheTot ? "ultima manche finita!" : "poi la manche " + (vm.manche + 1)), "piccolo");
      var conto = el("div", { class: "ru-conto" }); ui.azioni.appendChild(conto);
      if (ui.t.contoAvanti) ui.t.contoAvanti(conto, Math.max(1, Math.ceil((vm.restaFase != null ? vm.restaFase : T_RIEPILOGO) / 1000)), null, "ruota-fm|" + vm.kAv);
      if (me && !me.via) tastoAvanti(ui, vm);
      if (ui.facc) ui.azioni.appendChild(ui.facc);
      return;
    }
    if (f === "lampofine") return aspetta(L && L.vince ? "🎉 " + nomeDi(vm, cb, L.vince, true) + " comincia la manche!" : "Si gioca senza premio: comincia la manche…");
    // ---- PRENOTA ----
    if (f === "lampo" && L && !L.chi) {
      if (cb.telefono) {   // un tasto per ognuno, col suo colore
        stato(L.tipo === "cruci" ? "Chi ne sa una prenota! " + fmtN(CRUCI_PAROLA) + " a parola" : "Chi la sa prenota! Vale " + fmtN(PREMIO_LAMPO), "piccolo");
        var gr = el("div", { class: "ru-prenoti" + (vm.giocatori.filter(function (p) { return !p.bot; }).length > 2 ? " quattro" : "") });
        vm.giocatori.forEach(function (p, i) {
          if (p.bot) return;
          var fu = p.via || L.fuori.indexOf(p.id) >= 0;
          var b = tastoSubito(el, "prenoto", "🔔 " + escapeHtml(p.nome), function () { prenoto(ui, p.id); });
          b.style.background = (ST.COLORI || [])[i % ((ST.COLORI || []).length || 1)] || "#ff6b6b";
          if (fu) { b.disabled = true; b.textContent = "❌ " + p.nome; }
          gr.appendChild(b);
        });
        ui.azioni.appendChild(gr);
        return;
      }
      if (!me) return aspetta("👀 Frase lampo: chi la sa prenota!");
      if (me.via) return aspetta("Rientro nella partita…");
      if (L.fuori.indexOf(cb.myId) >= 0) return aspetta("❌ Sei fuori da questa frase: tocca agli altri");
      if (ui.premuto === L.k + ":" + L.prove) { stato("⏳ Prenotato! Vediamo chi è stato più veloce…"); return; }
      stato(L.tipo === "cruci" ? "Ne sai una? Prenota! " + fmtN(CRUCI_PAROLA) + " a parola" : "La sai? Prenota! Vale " + fmtN(PREMIO_LAMPO), "piccolo");
      ui.azioni.appendChild(tastoSubito(el, "prenoto grande", "🔔 PRENOTO!", function () { prenoto(ui, null); }));
      return;
    }
    // ---- LA FINALE ----
    if (f === "fintro") return aspetta("🏆 " + nAtt + " gioca la finale!");
    if (f === "fesito") return aspetta(F && F.vinto ? "🎉 " + F.nome + " vince " + fmtN(F.premio || 0) + " Speed Coins!" : "Peccato! La frase era sul tabellone");
    if (f === "frivela") return aspetta("🥁 Ecco le lettere scelte…");
    if (FASI_FIN.indexOf(f) >= 0 && !mioTurno) {
      return aspetta(f === "fbusta" ? "✉️ " + nAtt + " sceglie le buste…" : f === "flettere" ? "🔤 " + nAtt + " sceglie 3 consonanti e 1 vocale…" :
        f === "fcambio" ? "🏆 Arriva il tabellone " + ((F.b || 1) + 1) + ": " + FIN_NOMI[F.b || 1] + "…" : "⏱️ " + nAtt + ": tabellone " + (F.b || 1) + " di 3, " + FIN_NOMI[(F.b || 1) - 1] + "! Forza!");
    }
    if (f === "fcambio") return aspetta("🏆 Arriva il tabellone " + ((F.b || 1) + 1) + ": " + FIN_NOMI[F.b || 1] + "…");
    if (f === "fbusta") {
      var quante = Math.min(F.risolte || 1, 3), ancora = quante - (F.buste || []).length;
      stato(chi + (quante === 1 ? "scegli una busta" : "scegli ancora " + ancora + (ancora === 1 ? " busta" : " buste") + ": vinci la più ricca") + (vm.decimo ? " (qui valgono un decimo)" : ""), "piccolo");
      var rb = el("div", { class: "ru-riga ru-buste-tasti" });
      for (var k = 0; k < (F.n || BUSTE.length); k++) (function (k) { rb.appendChild(btn("busta", "✉️ " + (k + 1), function () { cb.onAzione("busta", k); }, (F.buste || []).indexOf(k) >= 0)); })(k);
      ui.azioni.appendChild(rb);
      var caso = btn("annulla", "🎲 Scegli tu per me", function () {
        var lib = []; for (var j = 0; j < (F.n || BUSTE.length); j++) if ((F.buste || []).indexOf(j) < 0) lib.push(j);
        cb.onAzione("busta", lib[Math.floor(Math.random() * lib.length)]);
      });
      riga([caso]); contoSu(ui, vm, caso);
      return;
    }
    // 🕵️ Rubasecondi: si chiamano le lettere (ogni lettera che non c'è costa 3 secondi), poi si passa a scrivere
    if (f === "ftempo" && F && F.b === 3 && ui.finScrivi !== (vm.gameId || "") + ":rs") {
      stato(chi + "chiama una lettera: se non c'è perdi 3 secondi" + (F.voc ? " (vocale già usata)" : " · una vocale sola"), "piccolo");
      var gr = el("div", { class: "ru-lettere" });
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (Lt) {
        var voc = VOCALI.indexOf(Lt) >= 0;
        gr.appendChild(btn("lettera" + (voc ? " voc" : ""), Lt, function () { cb.onAzione("lettera", Lt); }, vm.chiamate.indexOf(Lt) >= 0 || (voc && F.voc >= 1)));
      });
      ui.azioni.appendChild(gr);
      var bs = btn("risolvi", "💡 La so: scrivo", function () { ui.finScrivi = (vm.gameId || "") + ":rs"; ui.kTast = ""; ui.ridisegna(); });
      riga([ btn("annulla", "⏭️ Basta così", function () { cb.onAzione("passa"); }), bs ]);
      return;
    }
    if (f === "flettere") return letterePerFinale(ui, vm, chi);
    if (!mioTurno) {
      var guarda = !cb.telefono && !cb.sonoHost && !me;   // stanza piena o partita già cominciata
      if (puoSegretaQui(ui, vm)) {
        var txs = f === "sceltaexp" ? "🚂 " + nAtt + " decide: Express o no?" : vm.exp ? "🚂 " + nAtt + " è sull'Express…" : "Tocca a " + nomeDi(vm, cb, att) + "…";
        stato(txs + " · La sai già? Bloccala in segreto: prima la blocchi, più vale", "piccolo");
        riga([ btn("segreta", "🔒 La so!", function () { ui.segreto = segK(vm); ui.segTab = vm.tab; ui.scritto = []; ui.cur = 0; ui.kTast = ""; ui.ridisegna(); }) ]);
        if (ui.facc) ui.azioni.appendChild(ui.facc);
        return;
      }
      if (me && !cb.telefono && vm.lock && vm.lock.indexOf(cb.myId) >= 0 && FASI_SEG.indexOf(f) >= 0)
        return aspetta("🔒 Soluzione bloccata! Se è giusta, a fine manche prendi il premio · Tocca a " + nomeDi(vm, cb, att) + "…");
      if (f === "lampo" && L && L.chi) return aspetta("✍️ " + nAtt + " prova a risolvere la frase lampo…");
      if (me && me.via) return aspetta("Rientro nella partita…");
      var tx = f === "sceltaexp" ? "🚂 " + nAtt + " decide: Express o no?" : f === "mistero" ? "❓ " + nAtt + " decide: apre il Mistero?" :
        vm.exp ? "🚂 " + nAtt + " è sull'Express: +" + fmtN(vm.expTot || 0) + "… si ferma?" :
        f === "vdecidi" ? "⏱️ " + nAtt + ": risolve o passa?" : vm.veloce ? "⚡ Tocca a " + nomeDi(vm, cb, att) + "…" : "Tocca a " + nomeDi(vm, cb, att) + "…";
      return aspetta(guarda ? "👀 Stai guardando · " + tx : tx);
    }
    var tp = trovaG(vm, att), jolly = tp && tp.jolly ? " · 🃏 hai " + (tp.jolly > 1 ? tp.jolly + " Jolly" : "un Jolly") : "";
    if (f === "gira") {
      stato((chi ? chi + "tocca a te!" : "Tocca a te!") + jolly, "piccolo");
      var bg = btn("gira", vm.cons ? "🎡 Gira" : "🎡 Finite", function () { cb.onAzione("gira"); }, !(vm.puo && vm.puo.gira));
      riga([ bg,
        btn("vocale", "🅰️ Vocale " + COSTO_VOCALE, function () { cb.onAzione("compra"); }, !(vm.puo && vm.puo.compra)),
        btn("risolvi", "💡 Risolvi", function () { cb.onAzione("risolvi"); }) ]);
      contoSu(ui, vm, vm.puo && vm.puo.gira ? bg : null);
      return;
    }
    if (f === "sceltaexp") {   // "Mi fermo o rischio?" comincia qui
      stato(chi + "🚂 Express! Niente più giri: " + fmtN(EXPRESS_V) + " a consonante. Ma un errore è Bancarotta!", "piccolo");
      var bn = btn("vocale", "🎡 Gioco " + fmtN(EXPRESS_V) + " e basta", function () { cb.onAzione("express", false); });
      riga([ btn("express", "🚂 Prendo l'Express!", function () { cb.onAzione("express", true); }), bn ]);
      contoSu(ui, vm, bn);
      return;
    }
    if (f === "mistero") {   // ❓ tenersi i soldi o aprire il Mistero
      stato((chi ? chi + "ti" : "Ti") + " tieni i soldi o apri il Mistero? Metà delle volte +" + fmtN(MIST_PREMIO) + ", metà Bancarotta!", "piccolo");
      var bt = btn("vocale", "💰 Mi tengo i soldi", function () { cb.onAzione("mistero", false); });
      riga([ btn("mistero", "❓ Apri il Mistero", function () { cb.onAzione("mistero", true); }), bt ]);
      contoSu(ui, vm, bt);
      return;
    }
    if (f === "express") {
      stato(chi + "🚂 Express: +" + fmtN(vm.expTot || 0) + " finora. Sbagli una lettera: Bancarotta!", "piccolo rosso");
      if (vm.cons) {
        var ge = el("div", { class: "ru-lettere" });
        CONSONANTI.forEach(function (Lt) { ge.appendChild(btn("lettera", Lt, function () { cb.onAzione("lettera", Lt); }, vm.chiamate.indexOf(Lt) >= 0)); });
        ui.azioni.appendChild(ge);
      } else stato("Consonanti finite: compra una vocale o risolvi", "piccolo");
      var bf = btn("risolvi", "✋ Mi fermo e risolvo", function () { cb.onAzione("risolvi"); });
      riga([ btn("vocale", "🅰️ Vocale " + COSTO_VOCALE, function () { cb.onAzione("compra"); }, !(vm.puo && vm.puo.compra)), bf ]);
      contoSu(ui, vm, bf);
      return;
    }
    if (f === "consonante" || f === "vocale" || f === "vlettera") {
      var lista = f === "vocale" ? VOCALI : f === "vlettera" ? "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("") : CONSONANTI;
      stato(chi + (f === "vocale" ? "scegli una vocale" + (vm.exp ? " (se non c'è: Bancarotta!)" : "") :
        f === "vlettera" ? "chiama una lettera: consonante " + fmtN(vm.velValore || 0) + ", vocale gratis" : "scegli una consonante"), "piccolo");
      var gri = el("div", { class: "ru-lettere" + (f === "vocale" ? " vocali" : "") });
      lista.forEach(function (Lt) { gri.appendChild(btn("lettera" + (f === "vlettera" && VOCALI.indexOf(Lt) >= 0 ? " voc" : ""), Lt, function () { cb.onAzione("lettera", Lt); }, vm.chiamate.indexOf(Lt) >= 0)); });
      ui.azioni.appendChild(gri);
      return;
    }
    if (f === "vdecidi") {
      stato((chi ? chi + "c'è" : "C'è") + "! Hai 5 secondi: risolvi?", "piccolo");
      var br = btn("risolvi", "💡 Risolvo!", function () { cb.onAzione("risolvi"); });
      riga([ btn("annulla", "⏭️ Passo", function () { cb.onAzione("passa"); }), br ]);
      contoSu(ui, vm, br);
      return;
    }
    if (f === "risolvi" || f === "ftempo" || (f === "lampo" && L && L.chi)) {
      tastiera();
      ui.rsChi = chi;
      ui.rsStato = stato("", "piccolo");
      // le lettere già chiamate non possono stare nelle caselle coperte: sono grigie
      var tast = el("div", { class: "ru-lettere" });
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (Lt) {
        tast.appendChild(btn("lettera", Lt, function () { scriviLettera(ui, Lt); }, vm.chiamate.indexOf(Lt) >= 0));
      });
      tast.appendChild(btn("lettera canc", "⌫", function () { cancellaLettera(ui); }));
      ui.azioni.appendChild(tast);
      ui.azioni.appendChild(ui.rsStato);   // la scritta va sotto la tastiera: sopra toccava il nome sul leggio
      if (f !== "ftempo") ui.annBtn = btn("annulla", "↩ Indietro", function () {
        var vuoto = !ui.scritto.some(function (x) { return x; });
        ui.scritto = []; ui.cur = 0; cb.onAzione("annulla", vuoto ? "vuoto" : "");
      });
      if (f === "ftempo") ui.passaBtn = F && F.b === 3 ? btn("annulla", "↩ Chiamo lettere", function () { ui.finScrivi = null; ui.kTast = ""; ui.ridisegna(); }) :
        btn("annulla", F && F.b < 3 ? "⏭️ Passo" : "⏭️ Basta così", function () { cb.onAzione("passa"); });
      ui.okBtn = btn("gira", "✓ Risolvi", function () {
        var k = 0, testo = ui.vm.tab.replace(/_/g, function () { return ui.scritto[k++] || "?"; });
        if (ui.vm.fase !== "ftempo") { ui.scritto = []; ui.cur = 0; }   // nella finale le lettere restano: se è sbagliata si correggono
        cb.onAzione("soluzione", testo);
      }, true);
      riga(ui.annBtn ? [ ui.annBtn, ui.okBtn ] : f === "ftempo" ? [ ui.passaBtn, ui.okBtn ] : [ ui.okBtn ]);
      contoSu(ui, vm, ui.okBtn);
      statoScritto(ui);
    }
  }
  function escapeHtml(s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
  // la finale: 3 consonanti e 1 vocale da scegliere (si cambiano solo i tasti toccati, niente ridisegno)
  function letterePerFinale(ui, vm, chi) {
    var el = ui.el, cb = ui.cb, key = (vm.gameId || "") + ":" + vm.manche;
    if (ui.finSelK !== key) { ui.finSelK = key; ui.finSel = []; }
    var st = el("div", { class: "ru-stato piccolo" }); ui.azioni.appendChild(st);
    var gri = el("div", { class: "ru-lettere" }), tasti = {};
    var ok = el("button", { class: "ru-btn gira", text: "✓ Ecco le mie lettere", onclick: function () { cb.onAzione("lettere", ui.finSel.slice()); } });
    function nc() { return ui.finSel.filter(function (x) { return VOCALI.indexOf(x) < 0; }).length; }
    function nv() { return ui.finSel.length - nc(); }
    function rifai() {
      var tx = chi + "scegli " + FIN_CONS + " consonanti (" + nc() + "/" + FIN_CONS + ") e " + FIN_VOC + " vocale (" + nv() + "/" + FIN_VOC + ")";
      if (st.textContent !== tx) st.textContent = tx;
      Object.keys(tasti).forEach(function (Lt) { tasti[Lt].classList.toggle("scelta", ui.finSel.indexOf(Lt) >= 0); });
      ok.disabled = !(nc() === FIN_CONS && nv() === FIN_VOC);
    }
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (Lt) {
      var voc = VOCALI.indexOf(Lt) >= 0;
      var b = el("button", { class: "ru-btn lettera" + (voc ? " voc" : ""), text: Lt, onclick: function () {
        var i = ui.finSel.indexOf(Lt);
        if (i >= 0) ui.finSel.splice(i, 1);
        else if (voc) { ui.finSel = ui.finSel.filter(function (x) { return VOCALI.indexOf(x) < 0; }); ui.finSel.push(Lt); }   // la vocale si cambia con un tocco
        else if (nc() < FIN_CONS) ui.finSel.push(Lt);
        else { rianima(st, "no"); return; }
        rifai();
      } });
      if (vm.chiamate.indexOf(Lt) >= 0) b.disabled = true;
      tasti[Lt] = b; gri.appendChild(b);
    });
    ui.azioni.appendChild(gri);
    ui.azioni.appendChild(el("div", { class: "ru-riga" }, [ ok ]));
    rifai();
    contoSu(ui, vm, ok);
  }
  // mentre scrivi la soluzione cambiano solo il contatore e i due tasti (la tastiera resta com'è)
  function statoScritto(ui) {
    if (!ui.rsStato) return;
    var buchi = (ui.vm.tab.match(/_/g) || []).length, pieni = ui.scritto.filter(function (x) { return x; }).length;
    var cruci = ui.vm.fase === "lampo" && ui.vm.lampo && ui.vm.lampo.tipo === "cruci", intere = cruci ? paroleIntere(ui) : 0;
    var tx = ui.rsChi + (cruci ? "scrivi le parole che sai, anche una sola (" + intere + (intere === 1 ? " parola pronta)" : " parole pronte)") :
      (ui.vm.fase === "ftempo" ? "presto! " : "") + "scrivi le lettere che mancano (" + pieni + " di " + buchi + ")");
    if (ui.rsStato.textContent !== tx) ui.rsStato.textContent = tx;
    ui.okBtn.disabled = cruci ? !intere : pieni < buchi;
    if (!ui.annBtn) return;
    // senza aver scritto niente si torna indietro (una volta per turno); se no si rinuncia e si perde il turno
    var tb = !pieni && ui.vm.indietro ? "↩ Indietro" : ui.vm.exp ? "🏳️ Scendo (Bancarotta)" : "🏳️ Rinuncio";
    if (ui.annBtn.textContent !== tb) ui.annBtn.textContent = tb;
  }
  // 🔒 «La so!»: si può bloccare la soluzione? (online e contro i Bot, non sullo stesso telefono; una volta per manche)
  function segK(vm) { return (vm.gameId || "") + ":" + vm.manche; }
  function puoSegretaQui(ui, vm) {
    var cb = ui.cb, me = trovaG(vm, cb.myId);
    return !cb.telefono && !cb.guarda && !!me && !me.via && FASI_SEG.indexOf(vm.fase) >= 0 && vm.turno !== cb.myId &&
      !(vm.lock && vm.lock.indexOf(cb.myId) >= 0) && (vm.cons + vm.voc) > 0;
  }
  // mentre scrivo in segreto escono altre lettere: le mie restano nelle caselle giuste
  function rimappaSegreto(ui, vm) {
    if (ui.segTab === vm.tab) return;
    var prima = [], dopo2 = [], k;
    for (k = 0; k < (ui.segTab || "").length; k++) if (ui.segTab.charAt(k) === "_") prima.push(k);
    for (k = 0; k < vm.tab.length; k++) if (vm.tab.charAt(k) === "_") dopo2.push(k);
    ui.scritto = dopo2.map(function (p) { var j = prima.indexOf(p); return j >= 0 ? ui.scritto[j] || "" : ""; });
    ui.cur = Math.max(0, ui.scritto.indexOf("")); if (ui.cur >= dopo2.length) ui.cur = 0;
    ui.segTab = vm.tab; ui.kTab = "";
  }
  function tastiSegreto(ui, vm) {
    var el = ui.el, cb = ui.cb;
    tastiera();
    ui.rsChi = "🔒 In segreto: ";
    ui.rsStato = el("div", { class: "ru-stato piccolo" });
    var tast = el("div", { class: "ru-lettere" });
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (Lt) {
      var b = el("button", { class: "ru-btn lettera", text: Lt, onclick: function () { scriviLettera(ui, Lt); } });
      if (vm.chiamate.indexOf(Lt) >= 0) b.disabled = true;
      tast.appendChild(b);
    });
    tast.appendChild(el("button", { class: "ru-btn lettera canc", text: "⌫", onclick: function () { cancellaLettera(ui); } }));
    ui.azioni.appendChild(tast);
    ui.azioni.appendChild(ui.rsStato);
    ui.annBtn = null;
    var ann = el("button", { class: "ru-btn annulla", text: "↩ Lascia stare", onclick: function () { ui.segreto = null; ui.scritto = []; ui.cur = 0; ui.kTast = ""; ui.ridisegna(); } });
    ui.okBtn = el("button", { class: "ru-btn segreta", text: "🔒 Blocca", onclick: function () {
      var k = 0, testo = ui.vm.tab.replace(/_/g, function () { return ui.scritto[k++] || "?"; });
      ui.segreto = null; ui.scritto = []; ui.cur = 0; ui.kTast = "";
      cb.onAzione("segreta", testo); vibra(20);
      ui.ridisegna();
    } });
    ui.azioni.appendChild(el("div", { class: "ru-riga" }, [ ann, ui.okBtn ]));
    statoScritto(ui);
  }
  // 🧩 quante parole del CruciRuota sono scritte tutte (le caselle coperte di una riga piene)
  function paroleIntere(ui) {
    var tab = ui.vm.tab, b = 0, rg = 0, righe = {};
    for (var i = 0; i < tab.length; i++) {
      var ch = tab.charAt(i);
      if (ch === "|") { rg++; continue; }
      if (ch !== "_") continue;
      var r = righe[rg] || (righe[rg] = { tot: 0, pieni: 0 });
      r.tot++; if (ui.scritto[b]) r.pieni++; b++;
    }
    return Object.keys(righe).filter(function (k) { return righe[k].pieni === righe[k].tot; }).length;
  }
  function finale(t, vm, cb) {
    stile();   // (chi arriva proprio alla fine non ha mai aperto lo studio: il riquadro della finale ha bisogno delle regole di stile)
    var s = t.schermata({ chiara: true, icona: "🏆", titolo: "Classifica finale", sotto: "La Ruota della Fortuna" });
    var ol = t.el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    (vm.classifica || []).forEach(function (r) {
      ol.appendChild(t.el("li", { class: r.pos === 1 && !r.uscito ? "vincitore" : "", style: r.uscito ? "opacity:.55" : null }, [
        t.el("span", { class: "pos", text: r.uscito ? "🚪" : med[r.pos - 1] || (r.pos + "°") }),
        t.el("span", { class: "nome", text: (r.id === cb.myId && !cb.telefono ? r.nome + " (tu)" : r.nome) + (r.uscito ? " · uscito" : "") }),
        t.el("span", { class: "punti", text: fmtN(r.punti) }) ]));
    });
    s._contenuto.appendChild(ol);
    // com'è andata la finale (e, per il campione, dove sono finite le Speed Coins)
    var F = vm.fin;
    if (F) {
      var righeF = [ F.vinto ? "🏆 Finale vinta da " + F.nome + ": " + fmtN(F.premio || 0) + " Speed Coins! 🪙" :
        "🏆 Finale: " + F.nome + (F.via ? " è uscito" : " non ha risolto nessuna frase") ];
      if (F.esiti && F.esiti.length) righeF.push("Tabelloni: " + F.esiti.map(function (x, k) { return FIN_NOMI[k] + " " + (x ? "✅" : "❌"); }).join(" · "));
      var es = INCASSI[vm.gameId];
      if (F.vinto && es === "ok" && (cb.telefono || F.id === cb.myId)) righeF.push("Sono già nel tuo salvadanaio!");
      else if (F.vinto && es === "noprofilo") righeF.push("Per incassare le Speed Coins serve un profilo.");
      else if (F.vinto && cb.telefono && !es) {
        var pr = profiloAttivo();
        righeF.push(pr && pr.nome ? "Le Speed Coins vanno solo a " + pr.nome + ", che ha il profilo su questo telefono." : "Per incassare le Speed Coins serve un profilo.");
      }
      if (vm.decimo) righeF.push("(Contro i Bot e sullo stesso telefono le buste valgono un decimo.)");
      s._contenuto.appendChild(t.el("div", { class: "ru-fin-box" + (F.vinto ? " vinto" : "") }, righeF.map(function (x, i) { return t.el(i ? "small" : "b", { text: x }); })));
    }
    var fac = cb.online && !cb.telefono && !cb.targa && t.faccine ? t.faccine() : null;   // online: le faccine mentre si guarda la classifica
    if (fac) s._contenuto.appendChild(t.el("div", { class: "ru-fac-fine" }, [ fac ]));
    // online: i tasti di fine uguali per tutti i giochi (Rivincita, Ci sto…); se il core non li mette, quelli di sempre
    if (cb.online && !cb.telefono && t.tastiFine && t.tastiFine(s._piede, { host: cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: function () { cb.onEsci(true); } })) cb._notaFine = null;
    else {
      if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: cb.online ? "↻ Nuova partita (stessi amici)" : "↻ Gioca ancora", onclick: cb.onNuova }));
      else s._contenuto.appendChild(cb._notaFine = t.el("p", { class: "modulo-nota", style: "text-align:center", text: cb.guarda ? "👀 Se l'host fa un'altra partita, entri anche tu nella saletta." : "Se l'host fa un'altra partita, torni da solo nella saletta." }));
      if (cb.targa) s._piede.style.paddingBottom = "calc(62px + env(safe-area-inset-bottom))";   // chi guarda soltanto: una sola uscita (il ✕ della targhetta) e il suo posto in basso
      else s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: function () { cb.onEsci(true); } }));
    }
    t.mostra(s);
  }
  // ⚙️ «Frasi: Del gioco / Anche le nostre»: con «Anche le nostre» si scrivono fino a 5 frasi della compagnia, con la categoria.
  // Restano su QUESTO telefono (mai nelle regole: quelle le vedono anche gli amici). Funziona anche col box fuori dalla pagina.
  function frasiNostreBox(box, dove, aiuti) {
    var el = aiuti.el;
    stile();
    if (dove.frasi !== "nostre") dove.frasi = "gioco";
    box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Frasi" }));
    var gf = el("div", { style: "display:flex;gap:8px" });
    var corpo = el("div", { class: "ru-nostre" });
    [["gioco", "📖 Del gioco"], ["nostre", "✍️ Anche le nostre"]].forEach(function (v) {
      var b = el("button", { class: "modo-chip" + (dove.frasi === v[0] ? " attiva" : ""), type: "button", style: "flex:1;justify-content:center;text-align:center", onclick: function () {
        dove.frasi = v[0];
        [].forEach.call(gf.children, function (c) { c.classList.toggle("attiva", c === b); });
        corpo.hidden = v[0] !== "nostre";
      } }, [ el("div", { class: "mt", text: v[1] }) ]);
      gf.appendChild(b);
    });
    box.appendChild(gf);
    corpo.hidden = dove.frasi !== "nostre";
    var lista = el("div", { class: "ru-n-lista" });
    var cat = el("input", { type: "text", class: "ru-n-in", maxlength: String(CAT_MAX), placeholder: "Categoria (es. Il motto di Paky)", autocomplete: "off" });
    var fr = el("input", { type: "text", class: "ru-n-in maiu", maxlength: "48", placeholder: "Frase (es. CHI DORME NON PIGLIA PESCI)", autocomplete: "off", autocapitalize: "characters" });
    var nota = el("div", { class: "ru-n-nota" });
    var agg = el("button", { class: "btn btn-primario", type: "button", style: "width:100%;margin:0", text: "➕ Aggiungi la frase", onclick: function () {
      var l = leggiNostre(), c = controllaFrase(cat.value, fr.value);
      if (!c.ok) return avviso("⚠️ " + c.err, true);
      if (l.some(function (x) { return x.f === c.f; })) return avviso("⚠️ Questa frase c'è già", true);
      if (l.length >= NOSTRE_MAX) return avviso("⚠️ Al massimo " + NOSTRE_MAX + " frasi: togline una con ✕", true);
      l.push({ c: c.c, f: c.f }); salvaNostre(l);
      cat.value = ""; fr.value = "";
      rifai(); avviso(l.length >= NOSTRE_MAX ? "✅ Aggiunta! Sono " + NOSTRE_MAX + ", il massimo: per cambiarne una, toglila con ✕." : "✅ Aggiunta! Esce in una manche su due (mai due di fila).", false);
    } });
    function avviso(tx, err) { nota.textContent = tx; nota.classList.toggle("err", !!err); }
    function coperta2(f) { return f.replace(/[A-ZÀÈÉÌÒÙ]/g, "•"); }
    function rifai() {
      var l = leggiNostre();
      svuota(lista);
      if (!l.length) lista.appendChild(el("div", { class: "ru-n-vuota", text: "Nessuna frase ancora: scrivi la prima qui sotto." }));
      l.forEach(function (x, k) {
        var testo = el("span", { class: "f", text: coperta2(x.f) }), vista = false;
        lista.appendChild(el("div", { class: "ru-n-riga" }, [
          el("div", { class: "ru-n-tx" }, [ el("b", { text: x.c }), testo ]),
          // la frase resta coperta (sullo stesso telefono la vedrebbero tutti): 👁 per controllarla
          el("button", { class: "ru-n-tasto", type: "button", text: "👁", "aria-label": "Mostra la frase", onclick: function () { vista = !vista; testo.textContent = vista ? x.f : coperta2(x.f); } }),
          el("button", { class: "ru-n-tasto", type: "button", text: "✕", "aria-label": "Togli la frase", onclick: function () {
            var m = leggiNostre().filter(function (y) { return y.f !== x.f; }); salvaNostre(m); rifai(); avviso("Tolta.", false);
          } }) ]));
      });
      conta.textContent = l.length + " di " + NOSTRE_MAX;
      agg.disabled = l.length >= NOSTRE_MAX;
    }
    var conta = el("span", { class: "ru-n-conta" });
    corpo.appendChild(el("div", { class: "ru-n-tit" }, [ el("span", { text: "✍️ Le frasi della compagnia" }), conta ]));
    corpo.appendChild(lista);
    corpo.appendChild(cat); corpo.appendChild(fr); corpo.appendChild(agg); corpo.appendChild(nota);
    corpo.appendChild(el("p", { class: "modulo-nota", style: "margin:4px 0 0", text: "Restano su questo telefono. Escono al massimo una manche su due, con «✍️» accanto alla categoria. Online anche chi guarda può mandarne una dal suo telefono." }));
    rifai();
    box.appendChild(corpo);
  }
  function errore(t, testo) {
    var s = t.schermata({ chiara: true, icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ chiara: true, icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "La Ruota online funziona quando l'app è aperta dal sito pubblicato. Intanto puoi giocare contro i Bot o sullo stesso telefono." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      // il tabellone: in alto, fisso sopra lo studio (sotto ai tasti ‹ e 🎵 dello studio)
      ".ru-sopra{position:absolute;left:8px;right:8px;top:calc(48px + env(safe-area-inset-top));z-index:21;display:flex;flex-direction:column;gap:4px;pointer-events:none;transition:opacity .5s}",
      ".ru-sopra.via{opacity:0}",
      ".ru-cat{text-align:center;font-weight:900;font-size:.82rem;letter-spacing:.05em;color:var(--o-oro-testo);text-shadow:0 0 6px rgba(13,16,32,.95),0 2px 4px rgba(0,0,0,.9);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".ru-tab{position:relative;display:grid;grid-template-columns:repeat(12,1fr);gap:3px;padding:5px;border-radius:12px;background:#0b5e3c;box-shadow:inset 0 0 0 3px #12804f,0 6px 18px rgba(0,0,0,.55)}",
      // i round speciali colorano la cornice del tabellone (una luce che pulsa: solo trasparenza)
      ".ru-tab:after{content:'';position:absolute;inset:-4px;border-radius:15px;pointer-events:none;opacity:0;transition:opacity .4s}",
      ".ru-sopra.express .ru-tab:after{box-shadow:0 0 0 3px #ff3b5c,0 0 22px 4px rgba(255,59,92,.75);animation:ruPulsa .95s ease-in-out infinite alternate}",
      ".ru-sopra.veloce .ru-tab:after{box-shadow:0 0 0 3px #ffd43b,0 0 20px 3px rgba(255,212,59,.6);animation:ruPulsa .46s ease-in-out infinite alternate}",
      ".ru-sopra.finale .ru-tab:after{opacity:1;box-shadow:0 0 0 3px #ffe066,0 0 26px 6px rgba(255,200,40,.55)}",
      ".ru-sopra.lampo .ru-tab:after{opacity:1;box-shadow:0 0 0 3px #4dabf7,0 0 18px 3px rgba(77,171,247,.55)}",
      "@keyframes ruPulsa{from{opacity:.35}to{opacity:1}}",
      ".ru-tab.no{animation:ruNo .45s ease-in-out}",
      "@keyframes ruNo{0%,100%{transform:none}20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(3px)}}",
      ".ru-cella{aspect-ratio:1/1.08;border-radius:4px;background:#fff;color:#14113a;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:clamp(.78rem,4.4vw,1.2rem);line-height:1}",
      ".ru-cella.vuota{background:#118a54;box-shadow:inset 0 0 0 1px rgba(0,0,0,.15)}",
      ".ru-cella.coperta{background:#f8f9fa}",
      ".ru-cella.scritta{background:#d0ebff;color:#1864ab}",
      // la casella della lettera trovata: prima si accende di blu (vuota), poi compare la lettera; una dopo l'altra (animation-delay)
      ".ru-cella.nuova{animation:ruNuova .9s ease-out backwards}",
      "@keyframes ruNuova{0%{background:#4dabf7;color:transparent;transform:scale(1.15)}30%{color:transparent}45%{color:#14113a}100%{background:#fff;transform:none}}",
      // mentre risolvi: le caselle coperte si toccano, quella col cursore pulsa piano
      ".ru-sopra.scrivi .ru-tab{pointer-events:auto}.ru-sopra.scrivi .ru-cella.coperta,.ru-sopra.scrivi .ru-cella.scritta{cursor:pointer}",
      ".ru-cella.cursore{position:relative;box-shadow:inset 0 0 0 2px #fab005}",
      ".ru-cella.cursore:after{content:'';position:absolute;inset:0;border-radius:4px;background:#ffe066;animation:ruCursore 1.1s ease-in-out infinite alternate}",
      "@keyframes ruCursore{from{opacity:.15}to{opacity:.45}}",
      // l'orologio grande (5 secondi del round veloce, 10 della finale)
      ".ru-orol{position:absolute;right:2px;top:100%;margin-top:6px;width:54px;height:54px;border-radius:50%;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 35% 30%,#3b2f8f,#14113a);box-shadow:0 0 0 3px #ffd43b,0 6px 14px rgba(0,0,0,.6);color:#fff;font-size:1.6rem;font-weight:900;opacity:0;transform:scale(.6);transition:opacity .25s,transform .25s;font-variant-numeric:tabular-nums}",
      ".ru-orol.on{opacity:1;transform:none}.ru-orol.urgente{box-shadow:0 0 0 3px #ff4d6d,0 0 18px rgba(255,77,109,.8)}",
      ".ru-orol.on.tic b{animation:ruTic .35s ease-out}",
      "@keyframes ruTic{from{transform:scale(1.45)}to{transform:none}}",
      // la luce dorata sulla ruota (spicchio da 2.000, Express, round veloce)
      ".ru-oro{position:absolute;inset:-8%;border-radius:50%;background:radial-gradient(circle,rgba(255,224,102,0) 45%,rgba(255,212,59,.85) 62%,rgba(255,212,59,0) 74%);opacity:0;pointer-events:none}",
      ".ru-oro.on{animation:ruOro 1.8s ease-out}",
      "@keyframes ruOro{0%,100%{opacity:0}15%,45%{opacity:1}30%{opacity:.5}}",
      // il Jolly sul leggio
      ".st-leggio .ru-jolly{position:absolute;z-index:6;right:-4%;top:2%;padding:.15em .4em;border-radius:.6em;background:#7048e8;color:#fff;font-weight:900;font-size:1.5em;line-height:1.2;box-shadow:0 .1em .3em rgba(0,0,0,.5);opacity:0;transform:scale(.3);transition:opacity .3s,transform .35s cubic-bezier(.3,1.6,.5,1);pointer-events:none}",
      ".st-leggio .ru-jolly.on{opacity:1;transform:none}",
      // la barretta del tempo
      ".ru-tempo{height:5px;border-radius:3px;background:rgba(255,255,255,.15);overflow:hidden;opacity:0;transition:opacity .3s}.ru-tempo.on{opacity:1}",
      ".ru-tempo i{display:block;height:100%;background:#69db7c;transform-origin:left center}",
      "@keyframes ruTempo{0%{transform:scaleX(1);background:#69db7c}60%{background:#ffd43b}100%{transform:scaleX(0);background:#ff6b6b}}",
      ".ru-msg{align-self:center;max-width:100%;text-align:center;font-weight:800;font-size:.8rem;line-height:1.2;padding:3px 10px;border-radius:99px;background:rgba(7,4,26,.75);color:#fff}",
      ".ru-msg:empty{display:none}",
      ".ru-punti{display:flex;justify-content:center;flex-wrap:wrap;gap:4px 6px}",
      ".ru-chip{display:inline-flex;align-items:center;gap:4px;max-width:46%;padding:1px 8px 1px 6px;border-radius:99px;background:rgba(7,4,26,.72);color:#dfe2f5;font-size:.72rem;font-weight:700;line-height:1.5;border:1px solid transparent;transition:border-color .25s,background .25s}",
      ".ru-chip i{flex:none;width:7px;height:7px;border-radius:50%}",
      ".ru-chip .n{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;min-width:0}",
      ".ru-chip b{flex:none;color:#fff;font-weight:900;font-variant-numeric:tabular-nums}",
      ".ru-chip.on{border-color:var(--o-oro);background:rgba(40,24,70,.9)}",
      ".st-leggio .ru-lock{position:absolute;z-index:6;left:-4%;top:2%;padding:.1em .3em;border-radius:.6em;background:#1b1f3a;font-size:1.5em;line-height:1.2;box-shadow:0 0 0 .08em #ffc247,0 .1em .3em rgba(0,0,0,.5);opacity:0;transform:scale(.3);transition:opacity .3s,transform .35s cubic-bezier(.3,1.6,.5,1);pointer-events:none}",
      ".st-leggio .ru-lock.on{opacity:1;transform:scale(1)}",
      ".st-leggio .ru-lock.scatta{animation:ruScatta .5s ease-out}",
      "@keyframes ruScatta{0%{transform:scale(1.6)}100%{transform:scale(1)}}",
      ".ru-btn.segreta{background:#1b1f3a;color:#ffd77a;box-shadow:inset 0 0 0 2px #ffc247}",
      // la ruota sul maxischermo (senza il margine che lo studio lascia per la barra)
      ".ru-studio .st-sch-in{padding:0!important}",
      ".ru-ruota-sch{position:absolute;left:3%;right:3%;top:50%;aspect-ratio:1;transform:translateY(-50%)}",
      ".ru-disco{display:block;width:100%;height:100%;border-radius:50%;box-shadow:0 8px 28px rgba(0,0,0,.55),0 0 34px rgba(255,194,71,.16);will-change:transform}",
      ".ru-freccia{position:absolute;left:50%;top:-5%;width:12%;height:12%;transform:translateX(-50%)}.ru-freccia svg{display:block;width:100%;height:100%}",
      ".ru-centro{position:absolute;left:50%;top:50%;width:18%;height:18%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle at 35% 30%,#ffe9a8,#e0a020 70%,#a86d00);box-shadow:0 0 0 3px #171230,0 3px 8px rgba(0,0,0,.6)}",
      // i quadri del maxischermo (la campanella della frase lampo, le buste della finale): nel quadrato al centro, come la ruota
      ".ru-quadro{position:absolute;left:4%;right:4%;top:50%;aspect-ratio:1;transform:translateY(-50%);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center;color:#fff}",
      ".ru-campana{font-size:110px;line-height:1;filter:drop-shadow(0 6px 10px rgba(0,0,0,.5));transform-origin:50% 12%}",
      ".ru-campana.suona{animation:ruCampana .9s ease-in-out}",
      "@keyframes ruCampana{0%,100%{transform:none}15%{transform:rotate(18deg)}30%{transform:rotate(-15deg)}45%{transform:rotate(11deg)}60%{transform:rotate(-7deg)}75%{transform:rotate(3deg)}}",
      ".ru-sch-tit{font-size:50px;font-weight:900;letter-spacing:.04em;color:#ffd43b;text-shadow:0 4px 0 #a85c00,0 0 22px rgba(255,160,40,.55);line-height:1}",
      ".ru-sch-tit.piccolo{font-size:38px}",
      ".ru-sch-sub{font-size:20px;font-weight:800;color:#e7ecff;max-width:94%;line-height:1.25;min-height:1.25em}",
      ".ru-buste{display:flex;flex-wrap:wrap;justify-content:center;gap:12px;width:96%}",
      ".ru-busta{position:relative;width:29%;aspect-ratio:1.45;border-radius:10px;background:linear-gradient(160deg,#fff4d6,#f2d48a);box-shadow:0 6px 14px rgba(0,0,0,.45);display:flex;align-items:center;justify-content:center;color:#7a4b00;transition:transform .35s,opacity .35s}",
      ".ru-busta:before{content:'';position:absolute;left:0;right:0;top:0;height:55%;background:linear-gradient(to bottom right,transparent 49%,rgba(122,75,0,.25) 50%) left/50% 100% no-repeat,linear-gradient(to bottom left,transparent 49%,rgba(122,75,0,.25) 50%) right/50% 100% no-repeat}",
      ".ru-busta .n{position:relative;font-size:30px;font-weight:900}",
      ".ru-busta .v{position:absolute;left:0;right:0;bottom:6px;font-size:15px;font-weight:900;color:#2b8a3e;opacity:0;transition:opacity .4s}",
      ".ru-busta.via{display:none}.ru-busta.spenta{opacity:.38;transform:scale(.9)}",
      ".ru-busta.scelta{transform:translateY(-8px) scale(1.12);box-shadow:0 0 0 4px #ffd43b,0 0 26px rgba(255,212,59,.85)}",
      ".ru-busta.aperta .v{opacity:1}.ru-busta.aperta.spenta{opacity:.7}",
      ".ru-busta.aperta.scelta .v{font-size:20px}",
      ".ru-busta.aperta.vince{box-shadow:0 0 0 4px #51cf66,0 0 30px rgba(81,207,102,.9)}",
      // i tasti, nella barra dello studio
      ".ru-studio .st-barra{gap:6px;padding:10px 8px calc(10px + env(safe-area-inset-bottom))}",
      ".ru-azioni{display:flex;flex-direction:column;gap:6px;color:#fff}",
      ".ru-targa .st-barra{padding-bottom:calc(64px + env(safe-area-inset-bottom))}",
      ".ru-stato{text-align:center;font-weight:800;font-size:.92rem;padding:4px 0}.ru-stato.piccolo{padding:0;font-size:.85rem}.ru-stato.rosso{color:#ffa8b8}",
      ".ru-stato.no{animation:ruNo .45s ease-in-out}",
      ".ru-riga{display:flex;gap:6px}",
      ".ru-btn{flex:1;min-height:48px;border:0;border-radius:14px;font:inherit;font-weight:900;font-size:.88rem;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
      ".ru-btn:disabled{opacity:.35}",
      ".ru-btn.gira{background:var(--o-tasto);color:var(--o-tasto-testo)}.ru-btn.vocale{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta-piena);box-shadow:inset 0 0 0 1.5px var(--n-sfida)}.ru-btn.risolvi{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta-piena);box-shadow:inset 0 0 0 1.5px var(--o-verde)}.ru-btn.annulla{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta-piena);box-shadow:inset 0 0 0 1px var(--o-filo)}",
      ".ru-btn.express{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta-piena);box-shadow:inset 0 0 0 1.5px #d6338f}",
      ".ru-btn.busta{background:linear-gradient(160deg,#fff4d6,#f2d48a);color:#7a4b00;min-height:52px;font-size:.95rem;padding:0}",
      ".ru-btn.prenoto{background:var(--o-tasto);min-height:56px;font-size:1.05rem;color:var(--o-tasto-testo);letter-spacing:.02em}",
      ".ru-btn.prenoto.grande{min-height:72px;font-size:1.45rem;color:#fff;border-radius:999px;background:var(--o-tasto);box-shadow:0 6px 0 #7a0f33,0 0 0 2px rgba(255,255,255,.28) inset}",
      ".ru-btn.prenoto.grande:active{transform:translateY(4px);box-shadow:0 2px 0 #7a0f33,0 0 0 2px rgba(255,255,255,.28) inset}",
      ".ru-prenoti{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ru-prenoti .ru-btn{min-height:64px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px}",
      ".ru-prenoti.quattro .ru-btn{min-height:54px}",
      ".ru-lettere{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.ru-lettere.vocali{grid-template-columns:repeat(5,1fr)}",
      ".ru-btn.lettera{min-height:38px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta-piena);box-shadow:inset 0 0 0 1px var(--o-filo-oro);color:var(--o-testo);font-size:1.02rem}.ru-btn.lettera:disabled{opacity:.25}",
      ".ru-btn.lettera.voc{box-shadow:inset 0 0 0 1.5px var(--n-sfida)}",
      ".ru-btn.lettera.scelta{background:var(--o-tasto);color:var(--o-tasto-testo);box-shadow:0 0 0 2px #fff inset}",
      ".ru-btn.canc{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta-piena);box-shadow:inset 0 0 0 1.5px var(--o-rosso);color:var(--o-rosso-testo)}",
      ".ru-bot-riga{display:flex;align-items:center;gap:8px;justify-content:center;font-weight:800}",
      // la classifica: com'è andata la finale e le faccine
      ".ru-fin-box{display:flex;flex-direction:column;gap:3px;margin-top:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.07);text-align:center;line-height:1.3}",
      ".ru-fin-box.vinto{background:rgba(255,212,59,.14);box-shadow:inset 0 0 0 1.5px rgba(255,212,59,.45)}",
      ".ru-fin-box small{opacity:.8}",
      ".ru-fac-fine{display:flex;justify-content:center;margin-top:10px}",
      // 🌙 Notte vivace: la classifica finale è una schermata dell'app (lo studio con la ruota resta com'è).
      // Il riquadro «com'è andata la finale» è vetro scuro; se la finale è vinta ha il filo d'oro come il primo della classifica
      // (la sfumatura gialla sul blu notte veniva marrone)
      ".oro .ru-fin-box{background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo),inset 0 1px 0 rgba(255,255,255,.06),0 10px 24px -14px rgba(0,0,0,.8)}",
      ".oro .ru-fin-box.vinto{background:radial-gradient(120% 160% at 0% 0%,color-mix(in srgb,var(--n-monete) 13%,transparent),color-mix(in srgb,var(--n-monete) 0%,transparent) 58%),linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta);box-shadow:inset 0 0 0 1.5px var(--n-monete),inset 0 1px 0 rgba(255,255,255,.08),0 12px 26px -12px color-mix(in srgb,var(--n-monete) 50%,transparent)}",
      ".oro .ru-fin-box small{color:var(--o-tenue);opacity:1}",
      // ❓ il Mistero: la scritta grande in mezzo allo studio (solo trasformazioni e trasparenza)
      ".ru-mist{position:absolute;left:50%;top:58%;z-index:22;width:86%;max-width:360px;padding:14px 12px 16px;border-radius:22px;text-align:center;color:#fff;pointer-events:none;background:radial-gradient(circle at 50% 30%,#3b3f9e,#1b1f5e);box-shadow:0 0 0 3px #ffd43b,0 10px 30px rgba(0,0,0,.6);opacity:0;transform:translate(-50%,-50%) scale(.4);transition:opacity .3s,transform .35s cubic-bezier(.3,1.5,.5,1)}",
      ".ru-mist.on{opacity:1;transform:translate(-50%,-50%) scale(1)}",
      ".ru-mist .ico{font-size:64px;line-height:1.05}.ru-mist .tx{font-size:38px;font-weight:900;letter-spacing:.03em;line-height:1.1;color:#ffd43b;text-shadow:0 3px 0 #a85c00}",
      ".ru-mist .sub{font-size:15px;font-weight:800;margin-top:4px;opacity:.92}",
      ".ru-mist.apre .ico{animation:ruMistero .55s ease-in-out infinite alternate}",
      "@keyframes ruMistero{from{transform:scale(.88) rotate(-8deg)}to{transform:scale(1.12) rotate(8deg)}}",
      ".ru-mist.vinto{background:radial-gradient(circle at 50% 30%,#2f9e44,#0b5e3c);box-shadow:0 0 0 3px #ffe066,0 0 40px 8px rgba(255,212,59,.6)}",
      ".ru-mist.banca{background:radial-gradient(circle at 50% 30%,#495057,#111);box-shadow:0 0 0 3px #ff6b6b,0 10px 30px rgba(0,0,0,.7)}.ru-mist.banca .tx{color:#ff8787;text-shadow:0 3px 0 #5c0b0b;font-size:34px}",
      ".ru-mist.rivela{animation:ruRivela .5s cubic-bezier(.3,1.6,.5,1)}",
      "@keyframes ruRivela{from{transform:translate(-50%,-50%) scale(.6)}to{transform:translate(-50%,-50%) scale(1)}}",
      ".ru-btn.mistero{background:linear-gradient(135deg,#3b3f9e,#1b1f5e);box-shadow:0 0 0 2px #ffd43b inset;color:#ffd43b}",
      // «⏩ Avanti» sul riepilogo (il mio tocco resta «✅ Avanti») e il conto
      ".ru-btn.avanti{background:var(--o-tasto)}.ru-btn.avanti:disabled{opacity:.85;background:var(--o-tasto)}.ru-btn.avanti .quanti{font-weight:800;opacity:.9}",
      ".ru-conto{text-align:center;font-size:.8rem;font-weight:800;opacity:.85;min-height:1.2em}",
      // ✍️ chi guarda: scrivere una frase
      ".ru-scrivi-riga{display:flex;align-items:center;gap:8px;margin-top:2px}.ru-scrivi-riga[hidden]{display:none}",
      ".ru-scrivi-nota{flex:1;font-size:.76rem;font-weight:700;line-height:1.2;color:#e7ecff;opacity:.9}",
      ".ru-btn.scrivi{flex:0 0 auto;min-height:40px;padding:0 12px;background:linear-gradient(180deg,rgba(255,255,255,.035),rgba(255,255,255,0)),var(--o-carta-piena);box-shadow:inset 0 0 0 1.5px var(--n-sfida);font-size:.82rem}.ru-btn.scrivi[hidden]{display:none}",
      ".ru-form{position:absolute;left:8px;right:8px;top:calc(48px + env(safe-area-inset-top));z-index:30;display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:16px;background:var(--o-carta-piena);box-shadow:0 0 0 2px var(--o-oro),0 12px 30px rgba(0,0,0,.7);color:#fff;opacity:0;transform:translateY(-12px);pointer-events:none;transition:opacity .25s,transform .25s}",
      ".ru-form.on{opacity:1;transform:none;pointer-events:auto}",
      ".ru-f-in{width:100%;box-sizing:border-box;min-height:44px;padding:0 12px;border-radius:12px;border:0;font:inherit;font-size:16px;font-weight:700;color:#14113a;background:#fff}",
      ".ru-f-in.maiu{text-transform:uppercase}",
      ".ru-f-nota{font-size:.78rem;font-weight:700;line-height:1.25;opacity:.85}.ru-f-nota.err{color:#ffc9c9;opacity:1}.ru-f-nota.no{animation:ruNo .45s ease-in-out}",
      // ⚙️ le frasi della compagnia
      ".ru-nostre{display:flex;flex-direction:column;gap:8px;margin-top:8px;padding:10px;border-radius:14px;background:rgba(127,127,127,.12)}.ru-nostre[hidden]{display:none}",
      ".ru-n-tit{display:flex;justify-content:space-between;align-items:center;font-weight:800;font-size:.9rem}.ru-n-conta{font-size:.8rem;opacity:.7}",
      ".ru-n-lista{display:flex;flex-direction:column;gap:6px}.ru-n-vuota{font-size:.82rem;opacity:.7}",
      ".ru-n-riga{display:flex;align-items:center;gap:6px;padding:6px 8px;border-radius:10px;background:rgba(127,127,127,.14)}",
      ".ru-n-tx{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.2}.ru-n-tx b{font-size:.82rem}.ru-n-tx .f{font-size:.78rem;font-weight:800;letter-spacing:.04em;overflow-wrap:anywhere}",
      ".ru-n-tasto{flex:0 0 auto;width:38px;height:38px;border:0;border-radius:10px;background:rgba(127,127,127,.25);font-size:1rem;cursor:pointer;color:inherit}",
      ".ru-n-in{width:100%;box-sizing:border-box;min-height:44px;padding:0 12px;border-radius:12px;border:1px solid rgba(127,127,127,.4);font:inherit;font-size:16px;font-weight:700;background:#fff;color:#14113a}",
      ".ru-n-in.maiu{text-transform:uppercase}",
      ".ru-n-nota{font-size:.82rem;font-weight:700;min-height:1.2em}.ru-n-nota.err{color:#e03131}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "La Ruota della Fortuna", icona: "🎡",
    descrizione: "Gira la ruota, chiama le consonanti, compra le vocali e indovina la frase! Come in TV: prima di ogni manche un gioco veloce (frase lampo, Ruota del tempo, GiraMondo, Triplete, CruciRuota), Raddoppia, Express, Mistero, il giro finale e la finale con 3 tabelloni per le Speed Coins. Mentre aspetti puoi bloccare la soluzione in segreto. Più di 3.000 frasi, e potete metterci le vostre!",
    giocatoriMin: 1, giocatoriMax: MAX, difficolta: 2, etichettaGiocatori: "👥 1–4 giocatori",
    postiOnline: MAX,   // 4 alla ruota: nella Sala, se siete di più, gioca chi sceglie l'host e gli altri guardano
    riprende: true,     // online: se l'host ricarica a metà partita, la partita riprende (stessa frase, tocca a chi toccava)
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    riserva: true,   // online: se l'host sparisce del tutto (telefono spento), un amico porta avanti la partita
    modi: [
      { modo: "bot", icona: "🤖", nome: "Contro i Bot", sotto: "Tu contro i Bot, come in TV" },
      { modo: "telefono", icona: "📱", nome: "Sullo stesso telefono", sotto: "Da 2 a 4, tutti davanti allo stesso schermo", amici: true }
    ],
    regole: [
      "Si indovina una <b>frase nascosta</b>: si sa solo la categoria.",
      "Nel tuo turno <b>giri la ruota</b> e chiami una <b>consonante</b>: guadagni quello che dice lo spicchio per ogni lettera che c'è. Se la lettera non c'è, il turno passa.",
      "<b>Bancarotta</b>: perdi i soldi della manche. <b>Passa</b>: perdi il turno. <b>Raddoppia</b>: i soldi della manche diventano il doppio e giri ancora. <b>Jolly</b>: lo tieni (lo vedi sul tuo leggio); se chiami una lettera che non c'è, sbagli la soluzione o esce Passa, ti fa giocare ancora.",
      "Con almeno " + COSTO_VOCALE + " puoi <b>comprare una vocale</b>. Quando pensi di saperla, <b>risolvi</b>: scrivi le lettere che mancano (tocca una casella per scriverci).",
      "Chi risolve si tiene i soldi della manche (almeno " + fmtN(MINIMO_RISOLVI) + "). Vince chi alla fine ne ha di più.",
      "🔔 <b>Giochi veloci</b>: ogni manche si apre con un gioco senza ruota, ogni volta diverso. Le lettere compaiono da sole: chi la sa tocca <b>Prenoto!</b> e la scrive; chi sbaglia è fuori da quel gioco. Online vince chi ha i riflessi più pronti, non chi ha internet più veloce.",
      "I giochi veloci: 🔔 <b>Frase lampo</b> (vale " + fmtN(PREMIO_LAMPO) + "); ⏳ <b>La ruota del tempo</b> (vedi un anno: cosa è successo?); 🌍 <b>GiraMondo</b> (una parola straniera curiosa: cosa vuol dire?); 🎯 <b>Triplete</b> (3 frasi sullo stesso tema, " + fmtN(PREMIO_LAMPO) + " l'una, tutte e 3 alla stessa persona +" + fmtN(TRI_BONUS) + "); 🧩 <b>CruciRuota</b> (4 parole sul tema, una per riga: prenoti e scrivi quelle che sai, " + fmtN(CRUCI_PAROLA) + " l'una). Comincia la manche chi ha vinto il gioco veloce.",
      "🔒 <b>La so!</b> Mentre gioca un altro puoi scrivere la soluzione in segreto e bloccarla (una volta per manche). Nessuno la vede: se era giusta, quando la manche finisce prendi un premio, più grande quanto meno lettere c'erano (fino a " + fmtN(SEG_MAX) + "). Online e contro i Bot, non sullo stesso telefono.",
      "🚂 <b>Express</b>: se la ruota si ferma lì, puoi salire sull'Express. Chiami consonanti senza girare (" + fmtN(EXPRESS_V) + " l'una), compri vocali e quando vuoi ti fermi e risolvi. Ma se sbagli una lettera o la soluzione: <b>Bancarotta</b>! Oppure giochi lo spicchio come uno normale.",
      "🔔 <b>Giro finale</b>: nell'ultima manche la ruota gira una volta sola. Ogni consonante vale quella cifra più " + fmtN(BONUS_VELOCE) + ", le vocali sono gratis ma non valgono niente. A turno si chiama una lettera e, se c'è, hai 5 secondi per decidere se risolvere.",
      "🏆 <b>Finale</b>: chi vince la partita ha 60 secondi per 3 tabelloni. 1) vede R S T L N E e sceglie 3 consonanti e una vocale; 2) <b>Testacoda</b>: vede la prima e l'ultima lettera di ogni parola; 3) <b>Rubasecondi</b>: chiama le lettere che vuole (una vocale sola), ma ogni lettera che non c'è costa 3 secondi. Si può passare al tabellone dopo. Per ogni frase risolta sceglie una busta (al massimo 3) e vince la più ricca, da 500 a 5.000 Speed Coins. Le Speed Coins vanno a chi ha un profilo; contro i Bot e sullo stesso telefono le buste valgono un decimo.",
      "❓ <b>Mistero</b>: nelle ultime due manche (non nel round veloce) uno spicchio è il Mistero. Ci cadi e chiami una consonante da " + fmtN(MIST_V) + ": se c'è, scegli se tenerti i soldi o <b>aprire il Mistero</b>. Metà delle volte vale " + fmtN(MIST_PREMIO) + " in più, metà delle volte è <b>Bancarotta</b>! Aperto una volta, torna uno spicchio da " + fmtN(MIST_V) + ".",
      "✍️ <b>Le vostre frasi</b>: con «Frasi: Anche le nostre» l'host scrive nelle impostazioni fino a 5 frasi della compagnia (restano sul suo telefono). Online anche chi guarda può mandarne una con «✍️ Scrivi una frase»: nessuno la vede prima e, se gioca, chi l'ha scritta non la riceve. Escono al massimo una manche su due, con la firma accanto alla categoria.",
      "Online hai " + (T_MOSSA / 1000) + " secondi per ogni mossa e " + (T_RISOLVI / 1000) + " per risolvere: la barretta sopra i tasti ti dice quanto tempo resta. A fine manche si riparte da soli dopo 10 secondi, o subito se più di metà di chi gioca tocca «⏩ Avanti». I round speciali si accendono e si spengono nelle impostazioni."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      // torneo sullo stesso telefono: giocano tutti quelli del torneo (niente bot che prendono il posto degli amici)
      if (aiuti.torneo) { aiuti = Object.assign({}, aiuti, { modo: "telefono" }); dove.modo = "telefono"; }
      dove.manche = 4; dove.difficolta = "medio"; dove.avversari = 2;
      box.appendChild(el("div", { class: "etichetta", text: "Quante manche" }));
      var gm = el("div", { style: "display:flex;gap:8px" });
      [3, 4, 5].forEach(function (n) {
        var b = el("button", { class: "modo-chip" + (n === 4 ? " attiva" : ""), style: "flex:1;justify-content:center;min-width:0;padding-left:6px;padding-right:6px", onclick: function () {
          dove.manche = n; [].forEach.call(gm.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [ el("div", { class: "mt", text: n + " manche" }) ]);
        b.style.flex = "1"; gm.appendChild(b);
      });
      box.appendChild(gm);
      if (aiuti.modo === "bot" || !aiuti.modo) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Quanti avversari" }));
        var ga = el("div", { style: "display:flex;gap:8px" });
        [1, 2, 3].forEach(function (n) {
          var b = el("button", { class: "modo-chip" + (n === 2 ? " attiva" : ""), style: "flex:1;justify-content:center;min-width:0;padding-left:6px;padding-right:6px", onclick: function () {
            dove.avversari = n; [].forEach.call(ga.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
          } }, [ el("div", { class: "mt", text: n === 1 ? "1 bot" : n + " bot" }) ]);
          b.style.flex = "1"; ga.appendChild(b);
        });
        box.appendChild(ga);
      }
      if (aiuti.modo !== "telefono") {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei Bot" }));
        var dg = el("div", { style: "display:flex;gap:8px" });
        [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
          var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center;min-width:0;padding-left:6px;padding-right:6px", onclick: function () {
            dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
          } }, [ el("div", { class: "mt", text: d[1] }) ]);
          b.style.flex = "1"; dg.appendChild(b);
        });
        box.appendChild(dg);
      }
      // i round speciali del programma vero: si accendono e si spengono uno per uno (accesi di base)
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Round speciali, come in TV" }));
      var gs = el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px" });
      [["prenota", "🔔 Giochi veloci"], ["express", "🚂 Express"], ["veloce", "⚡ Giro finale"], ["finale", "🏆 Finale"], ["mistero", "❓ Mistero"]].forEach(function (r) {
        dove[r[0]] = true;
        var b = el("button", { class: "modo-chip attiva", style: "justify-content:center;text-align:center", onclick: function () {
          dove[r[0]] = !dove[r[0]]; b.className = "modo-chip" + (dove[r[0]] ? " attiva" : "");
        } }, [ el("div", { class: "mt", text: r[1] }) ]);
        gs.appendChild(b);
      });
      box.appendChild(gs);
      frasiNostreBox(box, dove, aiuti);
    },
    // la riga "📜 Si gioca così" che leggono gli amici in saletta
    riassunto: function (imp) {
      imp = imp || {};
      var r = regoleDa(imp), sp = nomiRound(r);
      return Math.max(1, Math.min(6, Math.floor(+imp.manche || 4))) + " manche" + (sp ? " · " + sp : "") + (r.frasi === "nostre" ? " · ✍️ anche le vostre frasi" : "");
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      var modo = (t.impostazioni || {}).modo;
      return partita(t, modo === "online" ? "online" : modo === "telefono" ? "telefono" : "bot");
    }
  });

  // per le prove
  window.__RUOTA = { creaPartita: creaPartita, controllaFrase: controllaFrase, spicchiDi: spicchiDi, apreMistero: apreMistero, leggiNostre: leggiNostre, righe: righe, righeIdx: righeIdx, coperta: coperta, solo: solo, corta: corta, decidiBot: decidiBot, letteraBot: letteraBot, SPICCHI: SPICCHI, BUSTE: BUSTE, INCASSI: INCASSI };
})();

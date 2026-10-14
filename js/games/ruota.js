/* =========================================================
   LA RUOTA DELLA FORTUNA — come il quiz della TV.
   Si gira la ruota, si chiama una consonante (lo spicchio vale per ogni lettera trovata),
   si comprano le vocali, si risolve la frase. Bancarotta, Passa e Jolly come in TV.
   Vince chi accumula di più in tutte le manche.
   I round speciali del programma vero (si accendono e si spengono nelle regole, accesi di base):
   - "Prenota", la frase lampo in apertura di ogni manche: le lettere compaiono da sole, chi la sa prenota;
   - lo spicchio "Express": niente più giri, 1.000 a consonante, ma un errore è Bancarotta;
   - l'ultimo round veloce: la ruota gira una volta sola, una lettera a testa e 5 secondi per risolvere;
   - la finale del campione: busta con le Speed Coins, R S T L N E, 3 consonanti + 1 vocale, 10 secondi.
   Modi: contro il computer (tu + bot, il primo è Bot), sullo stesso telefono (da 2 a 4,
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
  var T_MOSSA = 30000, T_RISOLVI = 60000;          // online: tempo per decidere (poi perde il turno)
  var T_GIRO = 3400;                               // quanto gira la ruota
  var SIGLA_CORTA = 2600;                          // quando si rigioca: niente presentazione lunga
  // ---- i round speciali ----
  var PREMIO_LAMPO = 1000;                         // la frase lampo (Prenota): premio fisso, nel totale della partita
  var LAMPO_PRIMA = 1600, LAMPO_PASSO = 1800;      // la prima lettera, poi una ogni 1,8 secondi
  var LAMPO_FINESTRA = 500;                        // online: dal primo "Prenoto!" arrivato si aspettano gli altri per mezzo secondo
  var LAMPO_RIFLESSI = 150;                        // nessuno è più veloce di così (un tempo più basso non vale)
  var T_LAMPO_RISOLVI = 20000, LAMPO_ULTIMA = 5000;   // tempo per scriverla; uscite tutte le lettere, quanto si aspetta ancora
  var EXPRESS_V = 1000;                            // l'Express: ogni consonante vale 1.000
  var BONUS_VELOCE = 1000;                         // il round veloce: lo spicchio + 1.000 a consonante
  var T_VEL_LETTERA = 12000, T_VEL_DECIDI = 5000, T_VEL_RISOLVI = 20000;
  var FIN_DATE = ["R", "S", "T", "L", "N", "E"], FIN_CONS = 3, FIN_VOC = 1;   // la finale: lettere regalate e da scegliere
  var T_FIN_BUSTA = 20000, T_FIN_LETTERE = 30000, T_FIN_RISOLVI = 10000;
  var FIN_GRAZIA = 1500;                           // online: la soluzione arriva un po' dopo, non la si perde per la rete
  var BUSTE = [500, 1000, 1000, 2000, 5000];       // le buste della finale, in Speed Coins (contro il computer un decimo)
  var PREMIO_MAX = 5000;
  // i momenti che vanno avanti da soli (l'host aspetta tanto così)
  var DURATE = { girando: T_GIRO, finemanche: 4500, lampofine: 3800, vgiro: 3000, fintro: 6000, frivela: 2600, fesito: 7500 };
  var FASI_FIN = ["fintro", "fbusta", "flettere", "frivela", "ftempo", "fesito"];
  var VOCALI = ["A", "E", "I", "O", "U"];
  var CONSONANTI = "BCDFGHJKLMNPQRSTVWXYZ".split("");
  var FREQ_C = "NRTLSCDMPVGBFZHQKJWXY".split("");   // consonanti dalla più frequente in italiano
  var FREQ_V = ["E", "A", "I", "O", "U"];
  var NOMI_BOT = ["Bot", "Rosa", "Peppe", "Gina"];
  var COL = 12, RIGHE = 4;
  var PARTITE_SALVATE = {}, INCASSI = {};
  // la ruota: 24 spicchi (valori, 2 Bancarotta, 1 Passa, 1 Jolly; con l'Express uno dei 300 diventa "Express")
  var SPICCHI = [
    { v: 500 }, { v: 300 }, { s: "bancarotta" }, { v: 700 }, { v: 400 }, { v: 250 },
    { v: 800 }, { s: "passa" }, { v: 350 }, { v: 600 }, { v: 1000 }, { v: 300 },
    { s: "jolly" }, { v: 450 }, { v: 200 }, { v: 900 }, { s: "bancarotta" }, { v: 500 },
    { v: 650 }, { v: 2000 }, { v: 400 }, { v: 550 }, { v: 300 }, { v: 750 }
  ];
  var POSTO_EXPRESS = 11;
  function spicchiDi(express) { return SPICCHI.map(function (s, i) { return express && i === POSTO_EXPRESS ? { s: "express", v: EXPRESS_V } : s; }); }
  var COLORI = ["#e03131", "#f08c00", "#fab005", "#2f9e44", "#1971c2", "#9c36b5"];
  var ACC = { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" };
  var FRASI_RISERVA = [
    { c: "Proverbi", f: "CHI DORME NON PIGLIA PESCI" }, { c: "Proverbi", f: "TRA IL DIRE E IL FARE C'È DI MEZZO IL MARE" },
    { c: "Modi di dire", f: "AVERE LE MANI IN PASTA" }, { c: "Cibo e cucina", f: "SPAGHETTI ALLA CARBONARA" },
    { c: "Luoghi", f: "LA TORRE DI PISA" }, { c: "Cose di casa", f: "LA LAVATRICE NUOVA" },
    { c: "Sport", f: "CALCIO DI RIGORE" }, { c: "In vacanza", f: "OMBRELLONE IN SPIAGGIA" },
    { c: "Animali", f: "IL GATTO NERO" }, { c: "Cose di casa", f: "IL CUSCINO" }
  ];

  function base(ch) { return ACC[ch] || ch; }
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
  var VISTE_KEY = "sg-ruota-viste", VISTE_MAX = 150;
  function frasiViste() {
    var o = {};
    try { (JSON.parse(localStorage.getItem(VISTE_KEY) || "[]") || []).forEach(function (f) { o[f] = 1; }); } catch (e) {}
    return o;
  }
  function segnaVista(frase) {
    try {
      var l = (JSON.parse(localStorage.getItem(VISTE_KEY) || "[]") || []).filter(function (f) { return f !== frase; });
      l.push(frase); localStorage.setItem(VISTE_KEY, JSON.stringify(l.slice(-VISTE_MAX)));
    } catch (e) {}
  }

  // =========================================================
  //  MOTORE (uguale contro il computer, sullo stesso telefono e per l'host online)
  // =========================================================
  function creaPartita(giocatori, mancheTot, regole) {
    var cfg = regole || {};
    var RG = { prenota: !!cfg.prenota, express: !!cfg.express, veloce: !!cfg.veloce && mancheTot >= 2, finale: !!cfg.finale };
    var P = { giocatori: giocatori.map(function (g) { return { id: g.id, nome: g.nome, bot: !!g.bot, omino: g.omino || null, totale: 0, soldi: 0, jolly: 0, via: false,
      stat: { giri: 0, consonantiIndovinate: 0, vocaliIndovinate: 0, frasiRisolte: 0, mancheVinte: 0, mancheDa5000: 0, bancarotte: 0, lampo: 0, finali: 0 } }; }),
      modo: cfg.modo || "bot", difficolta: cfg.difficolta || "medio", regole: RG, spicchi: spicchiDi(RG.express), decimo: !!cfg.decimo,
      mancheTot: mancheTot, manche: 0, turno: 0, fase: "pronti", frase: "", cat: "", rivelate: {}, chiamate: {},
      spicchio: -1, angolo: 0, giroN: 0, msg: "", ultime: [], usate: {}, catUsate: {}, vince: null, classifica: null, ev: null,
      lampo: null, exp: false, expTot: 0, veloce: false, velValore: 0, fin: null };
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
    function pesca(filtro) {
      var lista = frasi(), cand = [], viste = frasiViste();
      function ok(x, i) { return !P.usate[i] && (!filtro || filtro(x)); }
      // meglio una categoria nuova per ogni manche (se ce ne sono ancora)
      lista.forEach(function (x, i) { if (ok(x, i) && !viste[String(x.f).toUpperCase()] && !P.catUsate[x.c]) cand.push(i); });
      if (!cand.length) lista.forEach(function (x, i) { if (ok(x, i) && !viste[String(x.f).toUpperCase()]) cand.push(i); });
      if (!cand.length) lista.forEach(function (x, i) { if (ok(x, i)) cand.push(i); });   // viste tutte: si riparte
      if (!cand.length) lista.forEach(function (x, i) { if (!filtro || filtro(x)) cand.push(i); });
      if (!cand.length) cand = lista.map(function (x, i) { return i; });
      var i = cand[Math.floor(Math.random() * cand.length)]; P.usate[i] = 1; P.catUsate[lista[i].c] = 1;
      var f = String(lista[i].f).toUpperCase();
      segnaVista(f);
      return { f: f, c: lista[i].c };
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
      var fr = pesca(null);
      P.frase = fr.f; P.cat = fr.c;
      P.rivelate = {}; P.chiamate = {}; P.ultime = []; P.vince = null; P.spicchio = -1; P.annullato = false; P.exp = false; P.expTot = 0;
      P.veloce = RG.veloce && P.manche === P.mancheTot; P.velValore = 0;
      P.giocatori.forEach(function (x) { x.soldi = 0; x.jolly = 0; });
      P.turno = (P.manche - 1) % P.giocatori.length; if (P.giocatori[P.turno].via) avantiTurno();
      if (RG.prenota) {
        var fl = pesca(media), pos = [];
        fl.f.split("").forEach(function (ch, k) { if (eLettera(ch)) pos.push(k); });
        P.lampo = { frase: fl.f, cat: fl.c, pos: mischiaArr(pos), n: 0, T: [Date.now()], fuori: {}, chi: null, cand: [], prove: 0, vince: null };
        P.fase = "lampo"; P.msg = "🔔 Frase lampo! Chi la sa prenota: vale " + fmtN(PREMIO_LAMPO) + " e comincia la manche";
      } else iniziaManche();
    };
    function iniziaManche() {
      P.lampo = null;
      if (P.giocatori[P.turno].via) avantiTurno();
      if (P.veloce) { P.fase = "vgiro"; P.msg = "⚡ Ultimo round, veloce! La ruota gira una volta sola…"; }
      else { P.fase = "gira"; P.msg = "Manche " + P.manche + " di " + P.mancheTot + ": " + P.cat; }
    }

    // ---- PRENOTA, la frase lampo ----
    P.lampoTab = function () {
      var L = P.lampo, vis = {}, tutta = P.fase === "lampofine";
      for (var k = 0; k < L.n; k++) vis[L.pos[k]] = 1;
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
      if (solo(testo) === solo(L.frase)) lampoChiudi(p, "🎉 " + p.nome + " indovina la frase lampo! +" + fmtN(PREMIO_LAMPO) + " e comincia la manche");
      else lampoFuori(id, "❌ Sbagliato!");
      return true;
    };
    P.lampoTempo = function () { var L = P.lampo; if (P.fase !== "lampo" || !L || !L.chi) return false; lampoFuori(L.chi, "⏰ Tempo scaduto!"); return true; };
    P.lampoRinuncia = function () { var L = P.lampo; if (P.fase !== "lampo" || !L || !L.chi) return false; lampoFuori(L.chi, "🏳️ Rinuncia!"); return true; };
    P.lampoNessuno = function () {
      var L = P.lampo; if (P.fase !== "lampo" || !L || L.chi || L.cand.length) return false;
      lampoChiudi(null, "Nessuno ha prenotato: si gioca senza premio."); return true;
    };
    function lampoChiudi(p, msg) {
      var L = P.lampo; L.chi = null; L.cand = [];
      if (p) { p.totale += PREMIO_LAMPO; p.stat.lampo++; L.vince = p.id; P.turno = P.giocatori.indexOf(p); }
      P.fase = "lampofine"; P.msg = msg;
    }
    P.dopoLampo = function () { if (P.fase === "lampofine") iniziaManche(); };

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
      else if (s.v) { P.fase = "consonante"; P.msg = p.nome + ": " + fmtN(s.v) + " a lettera, scegli una consonante"; }
      else if (s.s === "bancarotta") { p.soldi = 0; p.stat.bancarotte++; P.msg = "💥 Bancarotta! " + p.nome + " perde i soldi della manche."; prossimo(); }
      else if (s.s === "passa") perdeTurno("⏭️ Passa! " + p.nome + " perde il turno.");
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
    function vinceManche(p) {
      CONSONANTI.concat(VOCALI).forEach(function (L) { P.rivelate[L] = 1; });
      var vincita = Math.max(p.soldi, MINIMO_RISOLVI);
      p.totale += vincita;
      p.stat.mancheVinte++;
      if (vincita >= 5000) p.stat.mancheDa5000++;
      P.giocatori.forEach(function (x) { if (x !== p) x.soldi = 0; });
      p.soldi = vincita; P.exp = false;
      P.vince = { id: p.id, vincita: vincita, frase: P.frase };
      P.fase = "finemanche"; P.msg = "🎉 " + p.nome + " risolve! +" + fmtN(vincita);
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
      var fr = pesca(corta);
      P.frase = fr.f; P.cat = fr.c; P.rivelate = {}; P.chiamate = {}; P.ultime = []; P.vince = null; P.lampo = null; P.exp = false; P.veloce = false;
      P.turno = P.giocatori.indexOf(p);
      P.fin = { id: p.id, nome: p.nome, premi: mischiaArr(BUSTE.map(function (v) { return P.decimo ? Math.round(v / 10) : v; })), busta: -1, scelte: [], prove: 0, vinto: null, premio: 0 };
      P.fase = "fintro"; P.msg = "🏆 " + p.nome + " vince la partita e gioca la finale!";
    }
    P.finInizia = function () { if (P.fase !== "fintro") return false; P.fase = "fbusta"; P.msg = P.fin.nome + ": scegli una busta. Dentro c'è il premio in Speed Coins!"; return true; };
    P.finBusta = function (k) {
      k = Math.floor(+k);
      if (P.fase !== "fbusta" || !(k >= 0 && k < P.fin.premi.length)) return false;
      P.fin.busta = k;
      FIN_DATE.forEach(function (L) { P.chiamate[L] = 1; if (occ(L)) P.rivelate[L] = 1; });
      P.ultime = FIN_DATE.slice();
      P.fase = "flettere"; P.msg = "Ecco R S T L N E! " + P.fin.nome + ": scegli " + FIN_CONS + " consonanti e " + FIN_VOC + " vocale";
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
    P.finAuto = function () {   // tempo scaduto mentre sceglie: busta a caso, lettere più frequenti
      if (P.fase === "fbusta") return P.finBusta(Math.floor(Math.random() * P.fin.premi.length));
      if (P.fase !== "flettere") return false;
      var c = FREQ_C.filter(function (L) { return !P.chiamate[L]; }).slice(0, FIN_CONS), v = FREQ_V.filter(function (L) { return !P.chiamate[L]; }).slice(0, FIN_VOC);
      applicaScelte(c.concat(v)); return true;
    };
    P.finVia = function () { if (P.fase !== "frivela") return false; P.fase = "ftempo"; P.msg = "⏱️ " + P.fin.nome + ": " + (T_FIN_RISOLVI / 1000) + " secondi per risolvere!"; return true; };
    P.finSoluzione = function (testo) {
      if (P.fase !== "ftempo") return false;
      if (solo(testo) === solo(P.frase)) finChiudi(true, "🏆 " + P.fin.nome + " risolve la finale!");
      else { P.fin.prove++; ev("fino", P.fin.id); P.msg = "❌ No! Riprova, " + P.fin.nome + "!"; }
      return true;
    };
    P.finTempo = function () { if (P.fase !== "ftempo") return false; finChiudi(false, "⏰ Tempo scaduto! La frase era…"); return true; };
    function finChiudi(vinto, msg) {
      CONSONANTI.concat(VOCALI).forEach(function (L) { P.rivelate[L] = 1; });
      var F = P.fin, p = trova(F.id);
      F.vinto = vinto; F.premio = vinto && F.busta >= 0 ? F.premi[F.busta] : 0;
      if (vinto && p) p.stat.finali++;
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
        if (i === P.turno && ["gira", "consonante", "vocale", "risolvi", "sceltaexp", "express", "vlettera", "vdecidi"].indexOf(P.fase) >= 0) { P.msg = "👋 " + x.nome + " ha lasciato la partita."; prossimo(); }
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
        tab: inLampo ? P.lampoTab() : piena ? P.frase : coperta(P.frase, P.rivelate),
        chiamate: inLampo ? [] : Object.keys(P.chiamate), ultime: inLampo ? [] : P.ultime.slice(), turno: tp ? tp.id : null, spicchio: P.spicchio, angolo: P.angolo, giroN: P.giroN, msg: P.msg, ev: P.ev,
        puo: tp ? P.puo() : null, indietro: f === "risolvi" && !P.annullato && !P.veloce, cons: P.consonantiNascoste(), voc: P.vocaliNascoste(), vince: P.vince, classifica: P.classifica,
        statFine: P.classifica ? P.giocatori.reduce(function (a, x) { a[x.id] = x.stat; return a; }, {}) : null,
        regole: RG, veloce: P.veloce || undefined, velValore: P.velValore || undefined, exp: P.exp || undefined, expTot: P.exp ? P.expTot : undefined, decimo: P.decimo || undefined,
        giocatori: P.giocatori.map(function (x) { return { id: x.id, nome: x.nome, bot: x.bot, totale: x.totale, soldi: x.soldi, jolly: x.jolly, via: x.via || undefined }; }) };
      if (inLampo) v.lampo = { n: L.n, tot: L.pos.length, chi: L.chi, fuori: Object.keys(L.fuori), vince: L.vince, prove: L.prove, k: P.manche };
      if (P.fin) {
        var F = P.fin, aperta = f === "fesito" || f === "fine";
        v.fin = { id: F.id, nome: F.nome, busta: F.busta, scelte: F.scelte.slice(), prove: F.prove, vinto: F.vinto, via: F.via || undefined, n: F.premi.length,
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
  function suonoLettera(n) { for (var k = 0; k < Math.min(n, 10); k++) bip(1046, 0.18, "triangle", 0.08, k * 0.16); }   // un "ding" per casella
  function suonoNo() { bip(220, 0.35, "sawtooth", 0.05); }
  function suonoVinto() { [523, 659, 784, 1046].forEach(function (f, k) { bip(f, 0.25, "triangle", 0.09, k * 0.12); }); }
  function suonoCampanella() { [1568, 2093, 1568, 2093].forEach(function (f, k) { bip(f, 0.22, "triangle", 0.07, k * 0.11); }); }   // din-din-din: frase lampo!
  function suonoTic() { bip(1760, 0.06, "triangle", 0.04); }   // una lettera della frase lampo
  function suonoBuzzer() { bip(155, 0.45, "sawtooth", 0.09); bip(207, 0.45, "square", 0.05); }   // "Prenoto!"
  function suonoTreno() { bip(587, 0.32, "triangle", 0.08); bip(740, 0.32, "triangle", 0.08); bip(880, 0.45, "triangle", 0.08, 0.34); bip(1109, 0.45, "triangle", 0.06, 0.34); }   // il fischio dell'Express
  function suonoVeloce() { for (var k = 0; k < 8; k++) bip(500 + k * 120, 0.06, "square", 0.03, k * 0.05); }

  // =========================================================
  //  LA PARTITA SU QUESTO TELEFONO: contro il computer, sullo stesso telefono, oppure host online
  // =========================================================
  function regoleDa(im) { im = im || {}; return { prenota: im.prenota !== false, express: im.express !== false, veloce: im.veloce !== false, finale: im.finale !== false }; }
  function partita(t, modo) {
    var online = modo === "online";
    if (online && !(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {}, liv = imp.difficolta || "medio", mancheTot = Math.max(1, Math.min(6, Math.floor(+imp.manche || 4))), reg = regoleDa(imp);
    var nome = (t.giocatori && t.giocatori[0]) || (t.nomeProfilo && t.nomeProfilo()) || "Tu";
    var posti = [];   // chi gioca: { id, nome, bot, omino }
    var H = { fase: online ? "lobby" : "gioco", codice: "…", pronta: !online, omini: {}, gameId: "" };
    function aggiungiBot() {
      var usati = {}; posti.forEach(function (p) { usati[p.nome] = 1; });
      var n = NOMI_BOT.filter(function (x) { return !usati[x]; })[0] || ("Bot " + (posti.length + 1));
      posti.push({ id: "bot" + Math.random().toString(36).slice(2, 7), nome: n, bot: true, omino: window.SGOmino ? SGOmino.casuale(n) : null });
    }
    if (modo === "telefono") {
      (t.giocatori || []).slice(0, MAX).forEach(function (n, i) { posti.push({ id: "p" + i, nome: n, omino: window.SGOmino ? SGOmino.casuale(n) : null }); });
      while (posti.length < 2) aggiungiBot();
    } else {
      posti.push({ id: "host", nome: nome, omino: t.mioOmino ? t.mioOmino(nome) : null });
      if (!online) { var nb = Math.max(1, Math.min(MAX - 1, Math.floor(+imp.avversari || 2))); for (var b = 0; b < nb; b++) aggiungiBot(); }
    }
    H.omini.host = posti[0].omino;
    var P = null, rete = null, tBot = null, tTempo = null, tFase = null, tLampo = null, tWin = null, tBotL = [];
    H.mosse = 0;        // cresce a ogni mossa vera: il tempo per decidere riparte solo allora
    H.kFase = "";       // per quale momento è partito il timer dei momenti che vanno avanti da soli
    H.kTempo = ""; H.scade = 0;   // il tempo per decidere: per chi e fino a quando
    H.kLampo = ""; H.risposta = {};   // frase lampo: il timer della prossima lettera, cosa scrivono i bot

    function fermaTempo() { clearTimeout(tTempo); tTempo = null; H.scade = 0; H.kTempo = ""; }
    function fermaBotLampo() { tBotL.forEach(clearTimeout); tBotL = []; H.botAspetta = {}; }
    function fermaLampo() { clearTimeout(tLampo); clearTimeout(tWin); tLampo = tWin = null; H.kLampo = ""; fermaBotLampo(); }
    function ferma() { clearTimeout(tBot); clearTimeout(tFase); tBot = tFase = null; H.kFase = ""; fermaTempo(); fermaLampo(); }
    function vm() {
      if (H.fase !== "gioco" && H.fase !== "fine") return { fase: H.fase, codice: H.codice, pronta: H.pronta, mancheTot: mancheTot, gameId: H.gameId, modo: modo, difficolta: liv, regole: reg,
        giocatori: posti.map(function (p) { return { id: p.id, nome: p.nome, bot: !!p.bot }; }) };
      var v = P.vista(); v.fase = H.fase === "fine" ? "fine" : v.fase; v.codice = H.codice; v.giocoFase = H.fase; v.sigla = H.sigla || false;
      v.gameId = H.gameId; v.modo = modo; v.difficolta = liv;
      // il tempo che resta a chi deve toccare (in millisecondi: gli orologi dei telefoni non sono uguali) e quanto era in tutto
      if (H.scade && H.fase === "gioco") { v.resta = Math.max(0, H.scade - Date.now()); v.tempoTot = H.tempoTot; v.kTempo = H.kTempo; if (online && P.fase === "ftempo") v.grazia = FIN_GRAZIA; }
      return v;
    }
    function bd() { var v = vm(); if (rete) { rete.invia({ t: "vm", vm: v }); ricordaPosti(); } disegna(t, v, cb); }
    // online: se l'host ricarica (la stanza si riapre con lo stesso codice), per 15 secondi i posti alla ruota restano
    // a chi stava giocando, non a chi guardava ed è stato più svelto a rientrare (come il Tris)
    var riserva = null, scritti = "", tScritti = 0;   // riserva: { ids: chi giocava, fino }
    function ricordaPosti() {
      if (!online || !H.codice || H.codice === "…" || (riserva && Date.now() < riserva.fino)) return;
      var ids = posti.filter(function (p) { return !p.bot && p.id !== "host"; }).map(function (p) { return p.id; });
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
      if (f === "ftempo") return T_FIN_RISOLVI + (online ? FIN_GRAZIA : 0);
      if (f === "lampo") return P.lampo && P.lampo.chi ? T_LAMPO_RISOLVI : 0;
      if (!online) return 0;
      if (f === "risolvi") return T_RISOLVI;
      return ["gira", "consonante", "vocale", "express", "sceltaexp"].indexOf(f) >= 0 ? T_MOSSA : 0;
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
        tFase = setTimeout(function () { tFase = null; H.kFase = ""; avanza(f); }, DURATE[f]);
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
      var kt = f === "ftempo" ? "ft:" + P.manche : f === "lampo" ? "l:" + P.manche + ":" + chi + ":" + P.lampo.prove : P.manche + ":" + f + ":" + chi + ":" + H.mosse;
      if (H.kTempo === kt && tTempo) return;   // stesso momento: il tempo non riparte da capo
      clearTimeout(tTempo); H.kTempo = kt;
      H.tempoTot = ms; H.scade = Date.now() + ms;
      tTempo = setTimeout(function () { tTempo = null; H.scade = 0; if (scaduto()) { H.mosse++; dopo(); } }, ms);
    }
    function avanza(f) {
      if (f === "girando") P.dopoGiro();
      else if (f === "finemanche") P.dopoManche();
      else if (f === "lampofine") P.dopoLampo();
      else if (f === "vgiro") P.giraVeloce();
      else if (f === "fintro") P.finInizia();
      else if (f === "frivela") P.finVia();
      else if (f === "fesito") P.dopoFinale();
      H.mosse++; dopo();
    }
    // ---- la frase lampo: le lettere compaiono da sole; il primo "Prenoto!" apre la finestra, poi vince il più veloce ----
    function cicloLampo() {
      var L = P.lampo;
      if (L.cand.length) return;   // la finestra è aperta: decide lei
      var kl = P.manche + ":" + L.n + ":" + L.prove;
      if (H.kLampo === kl && tLampo) return;
      clearTimeout(tLampo); H.kLampo = kl;
      if (L.n < L.pos.length) tLampo = setTimeout(function () { tLampo = null; if (P.lampoRivela()) botLampo(); dopo(); }, L.n === 0 && !L.prove ? LAMPO_PRIMA : LAMPO_PASSO);
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
      P.lampoSoluzione(L.chi, H.risposta[L.chi] || "SBAGLIATA"); H.mosse++; dopo();
    }
    function dopo() {
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
      H.mosse++;
      dopo();   // (i suoni li fa il disegno, uguale su tutti i telefoni)
    }
    // la classifica è pronta (anche se poi c'è la finale): trofei, XP e torneo
    function risultato() {
      var v = vm();
      salvaTrofei(v, modo === "telefono" ? null : "host", modo, liv);
      if (t.risultato && P.classifica) t.risultato(P.classifica.filter(function (r) { var x = posti.filter(function (p) { return p.id === r.id; })[0]; return x && !x.bot && !r.uscito; }).map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    // la finale vinta da chi gioca su questo telefono: le Speed Coins (sullo stesso telefono solo se il campione ha il nome del profilo)
    function pagaQui() {
      var F = P.fin; if (!F || !F.vinto || !F.premio) return;
      var pr = profiloAttivo();
      var mio = modo === "telefono" ? !!(pr && stessoNome(pr.nome, F.nome)) : F.id === "host";
      if (mio) incassa(H.gameId, F.premio);
    }
    function finePartita() {
      if (H.fase === "fine") return;   // una volta sola
      ferma();
      H.fase = "fine";
      bd();
    }
    function comincia() {
      if (posti.length < 2) return;
      ferma();
      H.gameId = (online ? H.codice : modo) + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      var umani = posti.filter(function (p) { return !p.bot; }).length;
      // la finale vale tutta solo online con almeno un amico vero; contro il computer o sullo stesso telefono un decimo
      P = creaPartita(posti, mancheTot, { modo: modo, difficolta: liv, prenota: reg.prenota, express: reg.express, veloce: reg.veloce, finale: reg.finale, decimo: !(online && umani >= 2) });
      P.nuovaManche(); H.fase = "gioco"; H.ultimoTurno = null; H.mosse = 0; H.risultato = false; H.pagato = false; H.risposta = {};
      // prima la sigla dello studio (presenta i concorrenti), poi si gioca. Quando si rigioca, una sigla corta.
      H.sigla = H.giocate ? "corta" : "intera"; H.giocate = (H.giocate || 0) + 1; bd();
      var dur = !window.SGStudio ? 0 : H.sigla === "corta" ? SIGLA_CORTA : SGStudio.durataApertura(posti.length);
      tFase = setTimeout(function () { tFase = null; H.sigla = false; if (P && P.lampo) P.lampo.T[0] = Date.now(); dopo(); }, dur);
    }
    // le mosse di chi è di turno su questo telefono (o, sullo stesso telefono, di chiunque sia di turno)
    function mia(id) {
      var p = P.giocatori[P.turno];
      return p && !p.bot && (modo === "telefono" || p.id === id);
    }
    function azione(id, a, x) {
      if (!P || H.fase !== "gioco" || H.sigla) return;
      var f = P.fase, ok = false, L = P.lampo;
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
        else if (a === "lettere") ok = P.finLettere(x);
        else if (a === "soluzione") ok = P.finSoluzione(x);
      } else {
        if (!mia(id)) return;
        if (a === "gira") ok = P.gira();
        else if (a === "compra") ok = P.compra();
        else if (a === "risolvi") ok = f === "vdecidi" ? P.velRisolvi() : P.risolvi();
        else if (a === "express") ok = P.sceltaExpress(!!x);
        else if (a === "passa") ok = P.velPassa(false);
        else if (a === "lettera") { var Lt = String(x || "").toUpperCase(); ok = f === "vocale" ? P.vocale(Lt) : f === "vlettera" ? P.velLettera(Lt) : P.consonante(Lt); }
        else if (a === "soluzione") ok = P.soluzione(x);
        else if (a === "annulla") ok = f === "risolvi" && (x === "vuoto" && P.annullaRisolvi() || P.rinuncia());   // senza aver scritto niente si torna indietro
      }
      if (ok) { H.mosse++; dopo(); }
    }
    var cb = { sonoHost: true, online: online, telefono: modo === "telefono", myId: "host",
      omini: function () { return H.omini; },
      onAzione: function (a, x) { azione("host", a, x); },
      onComincia: comincia,
      onBot: function (piu) { if (H.fase !== "lobby") return; if (piu && posti.length < MAX) aggiungiBot(); else if (!piu) { for (var i = posti.length - 1; i > 0; i--) if (posti[i].bot) { posti.splice(i, 1); break; } } bd(); },
      onNuova: function () {
        ferma();
        // chi è uscito e non è tornato lascia il posto (se torna dopo, rientra dalla saletta)
        if (online) { posti = posti.filter(function (p) { return !P || !P.giocatori.some(function (g) { return g.id === p.id && g.via; }); }); H.fase = "lobby"; P = null; bd(); }
        else { P = null; comincia(); }
      },
      onEsci: function (gia) {   // gia = l'ha già confermato il tasto ‹ dello studio
        var via = function () { ferma(); if (rete) rete.chiudi(); t.esci(); };
        if (H.fase === "gioco" && !gia) return t.conferma(online ? "Chiudere la partita per tutti?" : "Uscire dalla partita?", null, "Esci", via);   // la finestra dell'app
        via();
      } };
    // "⚙️ Regole" nella saletta: quante manche, bravura dei bot, round speciali
    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      im = im || {};
      mancheTot = Math.max(1, Math.min(6, Math.floor(+im.manche || mancheTot))); liv = im.difficolta || liv; reg = regoleDa(im);
      bd();
    };

    if (online) {
      rete = SGNet.ospita(ID, {
        onCodice: function (c) { H.codice = c; if (!riserva) riserva = leggiRiserva(c); bd(); },
        onConnesso: function () { H.pronta = true; bd(); },
        onAddio: function (id) {
          if (H.fase === "lobby") { posti = posti.filter(function (p) { return p.id !== id; }); bd(); return; }
          if (P) { P.esce(id); dopo(); }
        },
        onMsg: function (id, m) {
          if (!m || !m.t) return;
          if (m.t === "join") {
            var gia = posti.some(function (p) { return p.id === id; });
            if (!gia && H.fase === "lobby" && postoPer(id)) {
              var p = { id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino) };
              posti.push(p); H.omini[id] = p.omino;
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
        onErrore: function () { ferma(); errore(t, "Non riesco ad aprire la stanza. Controlla internet e riprova."); }
      });
      bd();
    } else comincia();
  }

  // =========================================================
  //  OSPITE ONLINE: disegna le foto dell'host e manda solo le sue mosse
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null, omini: {}, ultimoJoin: 0 };
    var cb = { sonoHost: false, online: true, myId: null,
      omini: function () { return S.omini; },
      onAzione: function (a, x) { if (S.rete) S.rete.invia({ t: "azione", a: a, x: x }); },
      onEsci: function (gia) {
        var via = function () { if (S.rete) S.rete.chiudi(); t.esci(); };
        if (S.vm && S.vm.giocoFase === "gioco" && !gia) return t.conferma("Uscire dalla partita?", null, "Esci", via);   // la finestra dell'app
        via();
      } };
    if (t.nomeProfilo && t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();
    function chiediNome() {
      var s = t.schermata({ icona: "🎡", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function join() { S.ultimoJoin = Date.now(); S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null }); }
    function collega() {
      var s = t.schermata({ icona: "🎡", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
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
            if (S.myId && (v.fase === "lobby" ? !me && v.giocatori.length < MAX : me && me.via && v.giocoFase === "gioco") && Date.now() - S.ultimoJoin > 2500) join();
            if (v.classifica && v.statFine) salvaTrofei(v, S.myId, v.modo, v.difficolta);
            if (v.fin && v.fin.vinto && v.fin.id === S.myId && (v.fase === "fesito" || v.fase === "fine")) incassa(v.gameId, v.fin.premio);
            disegna(t, v, cb);
          }
          else if (m.t === "omini") { S.omini = m.omini || {}; if (S.vm) disegna(t, S.vm, cb); }
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
    if (!R || !R.S.vivo()) R = creaStudioRuota(t, vm, cb);
    R.cb = cb; R.vm = vm;
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
    return [r.prenota ? "🔔" : "", r.express ? "🚂" : "", r.veloce ? "⚡" : "", r.finale ? "🏆" : ""].join("");
  }
  function lobby(t, vm, cb) {
    var el = t.el, sp = nomiRound(vm.regole);
    var extra = [el("p", { class: "modulo-nota", text: "Da 2 a 4 alla ruota · " + vm.mancheTot + " manche" + (sp ? " · round speciali " + sp : "") + ". I posti vuoti li possono prendere i bot." })];
    var dentro = vm.giocatori.some(function (p) { return p.id === cb.myId; });
    if (cb.sonoHost) {
      var nb = vm.giocatori.filter(function (p) { return p.bot; }).length;
      extra.push(el("div", { class: "ru-bot-riga" }, [
        el("span", { text: "🤖 Bot alla ruota: " + nb }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "−", disabled: nb ? null : "disabled", onclick: function () { cb.onBot(false); } }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "+", disabled: vm.giocatori.length < MAX ? null : "disabled", onclick: function () { cb.onBot(true); } }) ]));
    }
    var piena = !cb.sonoHost && !dentro && vm.giocatori.length >= MAX;
    var s = t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, puoiDaSolo: vm.giocatori.length >= 2, vuoti: Math.max(0, 2 - vm.giocatori.length),
      giocatori: vm.giocatori.map(function (p) { return { id: p.id, nome: p.nome, omino: (cb.omini() || {})[p.id] || (p.bot && window.SGOmino ? SGOmino.casuale(p.nome) : null), host: p.id === "host", tu: p.id === cb.myId, bot: p.bot }; }),
      extra: extra, attesa: cb.sonoHost || dentro ? "Aspetta che l'host cominci: si gira la ruota! 🎡" :
        piena ? "Quando comincia, guarderai la partita. 👀" : "Un attimo: ti metto alla ruota…",
      // "Sei dentro!" e "Sto entrando…" li scrive il core; la ruota piena (4 posti) la sa solo il gioco
      spettatore: piena ? "👀 La ruota è piena: guarderai la partita" : null,
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
    ui.sopra = el("div", { class: "ru-sopra" }, [ ui.cat, ui.tab, ui.msg, ui.orol ]);
    S.vista.appendChild(ui.sopra);
    // la ruota (va sul maxischermo) e i tasti (nella barra in basso)
    ui.canvas = el("canvas", { class: "ru-disco", width: "440", height: "440" });
    disegnaRuota(ui.canvas, spicchiDi(vm.regole && vm.regole.express));
    ui.ruota = el("div", { class: "ru-ruota-sch" }, [ ui.canvas,
      el("div", { class: "ru-freccia", html: "<svg viewBox='0 0 10 10'><polygon points='0,0 10,0 5,10' fill='#ffd43b' stroke='#a85c00' stroke-width='.6'/></svg>" }),
      el("div", { class: "ru-centro" }), ui.oro = el("div", { class: "ru-oro" }) ]);
    // la frase lampo sul maxischermo: la campanella
    ui.campana = el("div", { class: "ru-campana", text: "🔔" });
    ui.lampoSub = el("div", { class: "ru-sch-sub" });
    ui.panLampo = el("div", { class: "ru-quadro ru-lampo-sch" }, [ ui.campana, el("div", { class: "ru-sch-tit", text: "PRENOTA!" }), ui.lampoSub ]);
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
    vm.giocatori.forEach(function (p, i) { ST.puntiLeggio(S, i, p.soldi); ui.mostrati[p.id] = p.soldi; });
    function via() { ui.schTipo = ""; schermo(ui, ui.vm); ST.barra(S, [ ui.tempo, ui.azioni ]); ui.sopra.classList.remove("via"); }
    if (vm.sigla) {   // a inizio partita la sigla dello studio (il tabellone compare dopo); quando si rigioca, una corta
      ui.sigla = true; ui.sopra.classList.add("via");
      Promise.resolve(vm.sigla === "corta" ? siglaCorta(S) : ST.apertura(S)).catch(function () {}).then(function () {
        ui.sigla = false;
        if (!S.vivo() || R !== ui || ui.finita) return;
        via(); aggiorna(ui, ui.vm);
      });
    } else via();
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
    var c = cv.getContext("2d"), Rr = 220, passo = Math.PI * 2 / spicchi.length;
    c.translate(Rr, Rr);
    spicchi.forEach(function (sp, i) {
      var a0 = -Math.PI / 2 + i * passo, a1 = a0 + passo;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, Rr - 4, a0, a1); c.closePath();
      c.fillStyle = sp.s === "bancarotta" ? "#111" : sp.s === "passa" ? "#f1f3f5" : sp.s === "jolly" ? "#7048e8" : sp.s === "express" ? "#d6336c" : COLORI[i % COLORI.length];
      c.fill(); c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 2; c.stroke();
      c.save(); c.rotate(a0 + passo / 2); c.textAlign = "right"; c.textBaseline = "middle";
      c.fillStyle = sp.s === "passa" ? "#222" : sp.s === "express" ? "#fff3bf" : "#fff"; c.font = "900 " + (sp.s ? 19 : 26) + "px system-ui, sans-serif";
      c.fillText(sp.s === "bancarotta" ? "BANCAROTTA" : sp.s === "passa" ? "PASSA" : sp.s === "jolly" ? "JOLLY" : sp.s === "express" ? "EXPRESS" : fmtN(sp.v), Rr - 16, 0);
      c.restore();
    });
    c.beginPath(); c.arc(0, 0, Rr - 3, 0, Math.PI * 2); c.lineWidth = 6; c.strokeStyle = "#ffd43b"; c.stroke();
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
    if (f === "vgiro" || f === "fbusta" || f === "fesito") return inquadra(ui, "ruota", null, ms);
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
  function attore(vm) {
    if (vm.fase === "lampo") return vm.lampo && vm.lampo.chi;
    if (FASI_FIN.indexOf(vm.fase) >= 0) return vm.fin && vm.fin.id;
    return vm.turno;
  }
  // sui leggii i totali della partita (non i soldi della manche) in questi momenti
  function totali(f) { return f === "finemanche" || f === "lampo" || f === "lampofine" || FASI_FIN.indexOf(f) >= 0; }
  var ACCESI = ["gira", "consonante", "vocale", "risolvi", "girando", "sceltaexp", "express", "vlettera", "vdecidi", "lampo", "fintro", "fbusta", "flettere", "frivela", "ftempo", "fesito"];

  function aggiorna(ui, vm) {
    var S = ui.S, cb = ui.cb, prec = ui.prec || {}, f = vm.fase, ids = ui.ids, L = vm.lampo, F = vm.fin;
    var att = attore(vm), ia = ids.indexOf(att), it = ids.indexOf(vm.turno), ip = ids.indexOf(prec.turno);
    var mioTurno = !!att && (cb.telefono ? !isBot(vm, att) : att === cb.myId);
    var inRisolvi = mioTurno && (f === "risolvi" || f === "ftempo" || (f === "lampo" && !!(L && L.chi)));
    if (!inRisolvi) { ui.scritto = []; ui.cur = 0; }
    ui.sopra.classList.toggle("scrivi", inRisolvi);
    ui.sopra.classList.toggle("express", !!vm.exp);
    ui.sopra.classList.toggle("veloce", !!vm.veloce && f !== "finemanche");
    ui.sopra.classList.toggle("finale", FASI_FIN.indexOf(f) >= 0);
    ui.sopra.classList.toggle("lampo", f === "lampo" || f === "lampofine");
    var cat = (vm.cat || "").toUpperCase();
    var tc = f === "lampo" || f === "lampofine" ? "🔔 " + cat + " · frase lampo" : FASI_FIN.indexOf(f) >= 0 ? "🏆 " + cat + " · finale" :
      vm.veloce ? "⚡ " + cat + " · ultimo round" : cat + "  ·  manche " + vm.manche + "/" + vm.mancheTot;
    if (ui.cat.textContent !== tc) ui.cat.textContent = tc;
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
      if (fu) return;
      var val = tot ? p.totale : p.soldi;
      if (ui.mostrati[id] === val && ui.modoLeggii === tot) return;
      var d = 0;
      if (f === "finemanche" && prec.fase && prec.fase !== "finemanche") d = vm.vince && vm.vince.id === id ? vm.vince.vincita : 0;
      else if (f === "lampofine" && prec.fase === "lampo") d = L && L.vince === id ? PREMIO_LAMPO : 0;
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
        var ang = vm.angolo;
        ui.canvas.style.transition = "none";
        dopo(ui, 600, function () {
          ui.canvas.style.transition = "transform " + (T_GIRO - 900) + "ms cubic-bezier(.12,.7,.18,1)";
          ui.canvas.style.transform = "rotate(" + ang + "deg)";
          suonoGiro();
        });
      } else { ui.canvas.style.transition = "none"; ui.canvas.style.transform = "rotate(" + vm.angolo + "deg)"; }
    }
    if (prec.fase) {
      if (prec.fase === "girando" && f !== "girando") {   // la ruota si è fermata: un attimo sulla ruota
        var sp = spicchiDi(vm.regole && vm.regole.express)[vm.spicchio] || {};
        tieni = 650;
        if (sp.s === "bancarotta" || sp.s === "passa") {   // poi sul concorrente sfortunato, poi su chi tocca
          if (sp.s === "bancarotta") { ST.FX.ohh(); ST.scossa(S); }
          dopo(ui, 650, function () { inquadra(ui, "leggio", ip, 600); facciaPerUnPo(ui, ip, sp.s === "bancarotta" ? "esploso" : "triste"); });
          if (ip !== it) tieni = 2300;
        } else if (sp.s === "jolly") ST.FX.applauso("piano");
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
      if (f === "finemanche" && prec.fase !== "finemanche") {   // qualcuno ha risolto
        var iv = ids.indexOf(vm.vince && vm.vince.id);
        fermaRegia(ui); ST.FX.applauso("forte"); ST.coriandoli(); suonoVinto();
        if (iv >= 0) { ST.lampo(S); ST.accendiSolo(S, iv); ST.faccia(S, iv, "esulta"); inquadra(ui, "leggio", iv, 800); }
      }
      // ---- i round speciali: i loro momenti di spettacolo ----
      if (f === "lampo" && prec.fase !== "lampo") {   // si apre la frase lampo
        suonoCampanella(); rianima(ui.campana, "suona");
        ST.terzo(S, null, "Frase lampo!", "Chi la sa prenota: vale " + fmtN(PREMIO_LAMPO), "🔔");
        dopo(ui, 2400, function () { ST.viaTerzo(S); });
      }
      if (f === "lampo" && L && prec.lampoN != null && L.n > prec.lampoN && prec.lampoK === L.k) suonoTic();
      if (f === "lampofine" && prec.fase !== "lampofine") {
        var il = ids.indexOf(L && L.vince);
        fermaRegia(ui);
        if (il >= 0) { suonoVinto(); ST.FX.applauso("forte"); ST.lampo(S); ST.accendiSolo(S, il); ST.faccia(S, il, "evviva"); setTimeout(function () { if (S.vivo()) ST.faccia(S, il, null); }, 3000); }
        else ST.FX.ohh();
      }
      if (f === "vgiro" && prec.fase !== "vgiro") {
        suonoVeloce(); ST.lampo(S);
        ST.terzo(S, null, "Ultimo round, veloce!", "La ruota gira una volta sola: ogni consonante vale la cifra + " + fmtN(BONUS_VELOCE), "⚡");
        dopo(ui, 2800, function () { ST.viaTerzo(S); });
      }
      if (f === "fintro" && prec.fase !== "fintro" && F) showCampione(ui, vm);
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
    else if (e.t === "express") { suonoTreno(); ST.FX.applauso("piano"); facciaPerUnPo(ui, i, "esulta"); }
    else if (e.t === "fino") { suonoNo(); rianima(ui.tab, "no"); facciaPerUnPo(ui, i, "paura"); }
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
      var L = vm.lampo, tx = !L ? "" : f === "lampofine" ? (L.vince ? "🎉 " + nomeDi(vm, ui.cb, L.vince, true) + " +" + fmtN(PREMIO_LAMPO) : "Nessuno l'ha indovinata") :
        L.chi ? "✍️ " + nomeDi(vm, ui.cb, L.chi, true) + " risponde…" : "Vale " + fmtN(PREMIO_LAMPO) + " · lettera " + L.n + " di " + L.tot;
      if (ui.lampoSub.textContent !== tx) ui.lampoSub.textContent = tx;
    } else if (tipo === "buste") aggiornaBuste(ui, vm);
  }
  function aggiornaBuste(ui, vm) {
    var F = vm.fin; if (!F) return;
    var aperta = vm.fase === "fesito" && ui.bustaAperta && F.premi;
    var tit = aperta ? (F.vinto ? "🎉 HA VINTO!" : "PECCATO…") : "🏆 LA FINALE";
    if (ui.busteTit.textContent !== tit) ui.busteTit.textContent = tit;
    ui.buste.forEach(function (b, k) {
      var cls = "ru-busta" + (k >= (F.n || BUSTE.length) ? " via" : "") + (F.busta === k ? " scelta" : F.busta >= 0 ? " spenta" : "") + (aperta ? " aperta" : "");
      if (b.className !== cls) b.className = cls;
      var v = aperta && F.premi[k] != null ? fmtN(F.premi[k]) : "";
      if (b._v.textContent !== v) b._v.textContent = v;
    });
    var sub = aperta ? (F.vinto ? "+" + fmtN(F.premio) + " Speed Coins per " + F.nome + " 🪙" : "Nella busta c'erano " + fmtN(F.premi[F.busta] || 0) + " Speed Coins") :
      F.busta >= 0 ? "Busta " + (F.busta + 1) + ": si apre alla fine!" : "Una busta con le Speed Coins: quale?";
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
      L ? [L.chi, L.fuori.join(","), L.prove, L.k].join("/") : "", F ? [F.busta, F.scelte.join("")].join("/") : "", ui.premuto || ""].join("|");
    ui.scrivi = mioTurno && (f === "risolvi" || f === "ftempo" || (f === "lampo" && !!(L && L.chi)));
    if (chiave === ui.kTast) { if (ui.scrivi) statoScritto(ui); return; }
    ui.kTast = chiave; svuota(ui.azioni); ui.okBtn = null; ui.annBtn = null; ui.rsStato = null;
    if (ui.facc === undefined) ui.facc = cb.online && !cb.telefono && ui.t.faccine ? ui.t.faccine() : null;   // la fila delle faccine (online)
    function stato(txt, cls) { var d = el("div", { class: "ru-stato" + (cls ? " " + cls : ""), text: txt }); ui.azioni.appendChild(d); return d; }
    function aspetta(txt) { stato(txt); if (ui.facc) ui.azioni.appendChild(ui.facc); }   // chi guarda: cosa succede e le faccine
    function btn(cls, txt, fn, off) { var b = el("button", { class: "ru-btn " + cls, text: txt, onclick: fn }); if (off) b.disabled = true; return b; }
    function riga(n) { ui.azioni.appendChild(el("div", { class: "ru-riga" }, n)); }
    ui.ridisegna = function () { ui.kTab = ""; aggiorna(ui, ui.vm); };
    var chi = cb.telefono && att ? nomeDi(vm, cb, att) + ", " : "", nAtt = att ? nomeDi(vm, cb, att, true) : "";
    if (f === "girando") return stato(vm.veloce ? "⚡ La ruota gira una volta sola…" : "🎡 La ruota gira…");
    if (f === "vgiro") return aspetta("⚡ Ultimo round, veloce: si gira la ruota!");
    if (f === "finemanche") return aspetta(vm.manche >= vm.mancheTot ? "Ultima manche finita!" : "Tra poco la manche " + (vm.manche + 1) + "… (sui leggii i totali)");
    if (f === "lampofine") return aspetta(L && L.vince ? "🎉 " + nomeDi(vm, cb, L.vince, true) + " comincia la manche!" : "Si gioca senza premio: comincia la manche…");
    // ---- PRENOTA ----
    if (f === "lampo" && L && !L.chi) {
      if (cb.telefono) {   // un tasto per ognuno, col suo colore
        stato("Chi la sa prenota! Vale " + fmtN(PREMIO_LAMPO), "piccolo");
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
      stato("La sai? Prenota! Vale " + fmtN(PREMIO_LAMPO), "piccolo");
      ui.azioni.appendChild(tastoSubito(el, "prenoto grande", "🔔 PRENOTO!", function () { prenoto(ui, null); }));
      return;
    }
    // ---- LA FINALE ----
    if (f === "fintro") return aspetta("🏆 " + nAtt + " gioca la finale!");
    if (f === "fesito") return aspetta(F && F.vinto ? "🎉 " + F.nome + " vince " + fmtN(F.premio || 0) + " Speed Coins!" : "Peccato! La frase era sul tabellone");
    if (f === "frivela") return aspetta("🥁 Ecco le lettere scelte…");
    if (FASI_FIN.indexOf(f) >= 0 && !mioTurno) {
      return aspetta(f === "fbusta" ? "✉️ " + nAtt + " sceglie una busta…" : f === "flettere" ? "🔤 " + nAtt + " sceglie 3 consonanti e 1 vocale…" : "⏱️ " + nAtt + " ha " + (T_FIN_RISOLVI / 1000) + " secondi! Forza!");
    }
    if (f === "fbusta") {
      stato(chi + "scegli una busta: dentro c'è il premio in Speed Coins" + (vm.decimo ? " (qui vale un decimo)" : ""), "piccolo");
      var rb = el("div", { class: "ru-riga ru-buste-tasti" });
      for (var k = 0; k < (F.n || BUSTE.length); k++) (function (k) { rb.appendChild(btn("busta", "✉️ " + (k + 1), function () { cb.onAzione("busta", k); })); })(k);
      ui.azioni.appendChild(rb);
      var caso = btn("annulla", "🎲 Scegli tu per me", function () { cb.onAzione("busta", Math.floor(Math.random() * (F.n || BUSTE.length))); });
      riga([caso]); contoSu(ui, vm, caso);
      return;
    }
    if (f === "flettere") return letterePerFinale(ui, vm, chi);
    if (!mioTurno) {
      var guarda = !cb.telefono && !cb.sonoHost && !me;   // stanza piena o partita già cominciata
      if (f === "lampo" && L && L.chi) return aspetta("✍️ " + nAtt + " prova a risolvere la frase lampo…");
      if (me && me.via) return aspetta("Rientro nella partita…");
      var tx = f === "sceltaexp" ? "🚂 " + nAtt + " decide: Express o no?" : vm.exp ? "🚂 " + nAtt + " è sull'Express: +" + fmtN(vm.expTot || 0) + "… si ferma?" :
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
      stato(chi + "c'è! Hai 5 secondi: risolvi?", "piccolo");
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
      if (f !== "ftempo") ui.annBtn = btn("annulla", "↩ Indietro", function () {
        var vuoto = !ui.scritto.some(function (x) { return x; });
        ui.scritto = []; ui.cur = 0; cb.onAzione("annulla", vuoto ? "vuoto" : "");
      });
      ui.okBtn = btn("gira", "✓ Risolvi", function () {
        var k = 0, testo = ui.vm.tab.replace(/_/g, function () { return ui.scritto[k++] || "?"; });
        if (ui.vm.fase !== "ftempo") { ui.scritto = []; ui.cur = 0; }   // nella finale le lettere restano: se è sbagliata si correggono
        cb.onAzione("soluzione", testo);
      }, true);
      riga(ui.annBtn ? [ ui.annBtn, ui.okBtn ] : [ ui.okBtn ]);
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
    var tx = ui.rsChi + (ui.vm.fase === "ftempo" ? "presto! " : "") + "scrivi le lettere che mancano (" + pieni + " di " + buchi + ")";
    if (ui.rsStato.textContent !== tx) ui.rsStato.textContent = tx;
    ui.okBtn.disabled = pieni < buchi;
    if (!ui.annBtn) return;
    // senza aver scritto niente si torna indietro (una volta per turno); se no si rinuncia e si perde il turno
    var tb = !pieni && ui.vm.indietro ? "↩ Indietro" : ui.vm.exp ? "🏳️ Scendo (Bancarotta)" : "🏳️ Rinuncio";
    if (ui.annBtn.textContent !== tb) ui.annBtn.textContent = tb;
  }
  function finale(t, vm, cb) {
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: "La Ruota della Fortuna" });
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
        "🏆 Finale: " + F.nome + (F.via ? " è uscito" : " non ce l'ha fatta") + (F.premi && F.busta >= 0 ? " (nella busta c'erano " + fmtN(F.premi[F.busta]) + " Speed Coins)" : "") ];
      var es = INCASSI[vm.gameId];
      if (F.vinto && es === "ok" && (cb.telefono || F.id === cb.myId)) righeF.push("Sono già nel tuo salvadanaio!");
      else if (F.vinto && es === "noprofilo") righeF.push("Per incassare le Speed Coins serve un profilo.");
      else if (F.vinto && cb.telefono && !es) {
        var pr = profiloAttivo();
        righeF.push(pr && pr.nome ? "Le Speed Coins vanno solo a " + pr.nome + ", che ha il profilo su questo telefono." : "Per incassare le Speed Coins serve un profilo.");
      }
      if (vm.decimo) righeF.push("(Contro il computer e sullo stesso telefono le buste valgono un decimo.)");
      s._contenuto.appendChild(t.el("div", { class: "ru-fin-box" + (F.vinto ? " vinto" : "") }, righeF.map(function (x, i) { return t.el(i ? "small" : "b", { text: x }); })));
    }
    var fac = cb.online && !cb.telefono && t.faccine ? t.faccine() : null;   // online: le faccine mentre si guarda la classifica
    if (fac) s._contenuto.appendChild(t.el("div", { class: "ru-fac-fine" }, [ fac ]));
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: cb.online ? "↻ Nuova partita (stessi amici)" : "↻ Gioca ancora", onclick: cb.onNuova }));
    else s._contenuto.appendChild(cb._notaFine = t.el("p", { class: "modulo-nota", style: "text-align:center", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: function () { cb.onEsci(true); } }));
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
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "La Ruota online funziona quando l'app è aperta dal sito pubblicato. Intanto puoi giocare contro il computer o sullo stesso telefono." }));
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
      ".ru-cat{text-align:center;font-weight:900;font-size:.82rem;letter-spacing:.05em;color:#ffe066;text-shadow:0 2px 4px rgba(0,0,0,.8);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
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
      // la ruota sul maxischermo (senza il margine che lo studio lascia per la barra)
      ".ru-studio .st-sch-in{padding:0!important}",
      ".ru-ruota-sch{position:absolute;left:3%;right:3%;top:50%;aspect-ratio:1;transform:translateY(-50%)}",
      ".ru-disco{display:block;width:100%;height:100%;border-radius:50%;box-shadow:0 8px 24px rgba(0,0,0,.5);will-change:transform}",
      ".ru-freccia{position:absolute;left:50%;top:-5%;width:12%;height:12%;transform:translateX(-50%)}.ru-freccia svg{display:block;width:100%;height:100%}",
      ".ru-centro{position:absolute;left:50%;top:50%;width:18%;height:18%;transform:translate(-50%,-50%);border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff3bf,#f59f00);box-shadow:0 2px 6px rgba(0,0,0,.5)}",
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
      // i tasti, nella barra dello studio
      ".ru-studio .st-barra{gap:6px;padding:10px 8px calc(10px + env(safe-area-inset-bottom))}",
      ".ru-azioni{display:flex;flex-direction:column;gap:6px;color:#fff}",
      ".ru-stato{text-align:center;font-weight:800;font-size:.92rem;padding:4px 0}.ru-stato.piccolo{padding:0;font-size:.85rem}.ru-stato.rosso{color:#ffa8b8}",
      ".ru-stato.no{animation:ruNo .45s ease-in-out}",
      ".ru-riga{display:flex;gap:6px}",
      ".ru-btn{flex:1;min-height:48px;border:0;border-radius:14px;font:inherit;font-weight:900;font-size:.88rem;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
      ".ru-btn:disabled{opacity:.35}",
      ".ru-btn.gira{background:#e8590c}.ru-btn.vocale{background:#1c7ed6}.ru-btn.risolvi{background:#2f9e44}.ru-btn.annulla{background:#495057}",
      ".ru-btn.express{background:linear-gradient(135deg,#d6336c,#a61e4d);box-shadow:0 0 0 2px #ffd8e4 inset}",
      ".ru-btn.busta{background:linear-gradient(160deg,#fff4d6,#f2d48a);color:#7a4b00;min-height:52px;font-size:.95rem;padding:0}",
      ".ru-btn.prenoto{background:#e03131;min-height:56px;font-size:1.05rem;color:#14113a;letter-spacing:.02em}",
      ".ru-btn.prenoto.grande{min-height:72px;font-size:1.45rem;color:#fff;border-radius:999px;background:radial-gradient(circle at 50% 30%,#ff6b6b,#c92a2a);box-shadow:0 6px 0 #7a1010,0 0 0 3px #ffc9c9 inset}",
      ".ru-btn.prenoto.grande:active{transform:translateY(4px);box-shadow:0 2px 0 #7a1010,0 0 0 3px #ffc9c9 inset}",
      ".ru-prenoti{display:grid;grid-template-columns:1fr 1fr;gap:8px}.ru-prenoti .ru-btn{min-height:64px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 6px}",
      ".ru-prenoti.quattro .ru-btn{min-height:54px}",
      ".ru-lettere{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.ru-lettere.vocali{grid-template-columns:repeat(5,1fr)}",
      ".ru-btn.lettera{min-height:38px;background:#f8f9fa;color:#14113a;font-size:1.02rem}.ru-btn.lettera:disabled{opacity:.25}",
      ".ru-btn.lettera.voc{background:#d0ebff}",
      ".ru-btn.lettera.scelta{background:#ffd43b;box-shadow:0 0 0 2px #fff inset}",
      ".ru-btn.canc{background:#ffc9c9;color:#c92a2a}",
      ".ru-bot-riga{display:flex;align-items:center;gap:8px;justify-content:center;font-weight:800}",
      // la classifica: com'è andata la finale e le faccine
      ".ru-fin-box{display:flex;flex-direction:column;gap:3px;margin-top:10px;padding:10px 12px;border-radius:14px;background:rgba(255,255,255,.07);text-align:center;line-height:1.3}",
      ".ru-fin-box.vinto{background:rgba(255,212,59,.14);box-shadow:inset 0 0 0 1.5px rgba(255,212,59,.45)}",
      ".ru-fin-box small{opacity:.8}",
      ".ru-fac-fine{display:flex;justify-content:center;margin-top:10px}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "La Ruota della Fortuna", icona: "🎡",
    descrizione: "Gira la ruota, chiama le consonanti, compra le vocali e indovina la frase! Come in TV: Bancarotta, Passa, Jolly, la frase lampo da prenotare, l'Express, l'ultimo round veloce e la finale per le Speed Coins.",
    giocatoriMin: 1, giocatoriMax: MAX, difficolta: 2, etichettaGiocatori: "👥 1–4 giocatori",
    modi: [
      { modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Tu contro i bot, come in TV (il primo è Bot)" },
      { modo: "telefono", icona: "📱", nome: "Sullo stesso telefono", sotto: "Da 2 a 4, tutti davanti allo stesso schermo", amici: true }
    ],
    regole: [
      "Si indovina una <b>frase nascosta</b>: si sa solo la categoria.",
      "Nel tuo turno <b>giri la ruota</b> e chiami una <b>consonante</b>: guadagni quello che dice lo spicchio per ogni lettera che c'è. Se la lettera non c'è, il turno passa.",
      "<b>Bancarotta</b>: perdi i soldi della manche. <b>Passa</b>: perdi il turno. <b>Jolly</b>: lo tieni (lo vedi sul tuo leggio); se chiami una lettera che non c'è, sbagli la soluzione o esce Passa, ti fa giocare ancora.",
      "Con almeno " + COSTO_VOCALE + " puoi <b>comprare una vocale</b>. Quando pensi di saperla, <b>risolvi</b>: scrivi le lettere che mancano (tocca una casella per scriverci).",
      "Chi risolve si tiene i soldi della manche (almeno " + fmtN(MINIMO_RISOLVI) + "). Vince chi alla fine ne ha di più.",
      "🔔 <b>Prenota</b>: ogni manche si apre con una frase lampo. Le lettere compaiono da sole: chi la sa tocca <b>Prenoto!</b> e la scrive. Vale " + fmtN(PREMIO_LAMPO) + " e chi la indovina comincia la manche; chi sbaglia è fuori da quella frase. Online vince chi ha i riflessi più pronti, non chi ha internet più veloce.",
      "🚂 <b>Express</b>: se la ruota si ferma lì, puoi salire sull'Express. Chiami consonanti senza girare (" + fmtN(EXPRESS_V) + " l'una), compri vocali e quando vuoi ti fermi e risolvi. Ma se sbagli una lettera o la soluzione: <b>Bancarotta</b>! Oppure giochi lo spicchio come uno normale.",
      "⚡ <b>Ultimo round veloce</b>: la ruota gira una volta sola. Ogni consonante vale quella cifra più " + fmtN(BONUS_VELOCE) + ", le vocali sono gratis ma non valgono niente. A turno si chiama una lettera e, se c'è, hai 5 secondi per decidere se risolvere.",
      "🏆 <b>Finale</b>: chi vince la partita sceglie una busta con un premio in Speed Coins (da 500 a 5.000), vede R S T L N E, sceglie 3 consonanti e una vocale e ha 10 secondi per risolvere. Le Speed Coins vanno a chi ha un profilo; contro il computer e sullo stesso telefono le buste valgono un decimo.",
      "Online hai 30 secondi per ogni mossa e 60 per risolvere: la barretta sopra i tasti ti dice quanto tempo resta. I round speciali si accendono e si spengono nelle impostazioni."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      // torneo sullo stesso telefono: giocano tutti quelli del torneo (niente bot che prendono il posto degli amici)
      if (aiuti.torneo) { aiuti = Object.assign({}, aiuti, { modo: "telefono" }); dove.modo = "telefono"; }
      dove.manche = 4; dove.difficolta = "medio"; dove.avversari = 2;
      box.appendChild(el("div", { class: "etichetta", text: "Quante manche" }));
      var gm = el("div", { style: "display:flex;gap:8px" });
      [3, 4, 5].forEach(function (n) {
        var b = el("button", { class: "modo-chip" + (n === 4 ? " attiva" : ""), style: "flex:1;justify-content:center", onclick: function () {
          dove.manche = n; [].forEach.call(gm.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
        } }, [ el("div", { class: "mt", text: n + " manche" }) ]);
        b.style.flex = "1"; gm.appendChild(b);
      });
      box.appendChild(gm);
      if (aiuti.modo === "bot" || !aiuti.modo) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Quanti avversari" }));
        var ga = el("div", { style: "display:flex;gap:8px" });
        [1, 2, 3].forEach(function (n) {
          var b = el("button", { class: "modo-chip" + (n === 2 ? " attiva" : ""), style: "flex:1;justify-content:center", onclick: function () {
            dove.avversari = n; [].forEach.call(ga.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
          } }, [ el("div", { class: "mt", text: n === 1 ? "1 bot" : n + " bot" }) ]);
          b.style.flex = "1"; ga.appendChild(b);
        });
        box.appendChild(ga);
      }
      if (aiuti.modo !== "telefono") {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Bravura dei bot" }));
        var dg = el("div", { style: "display:flex;gap:8px" });
        [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]].forEach(function (d) {
          var b = el("button", { class: "modo-chip" + (d[0] === "medio" ? " attiva" : ""), style: "flex:1;justify-content:center;text-align:center", onclick: function () {
            dove.difficolta = d[0]; [].forEach.call(dg.children, function (c) { c.className = "modo-chip"; c.style.flex = "1"; }); b.className = "modo-chip attiva";
          } }, [ el("div", { class: "mt", text: d[1] }) ]);
          b.style.flex = "1"; dg.appendChild(b);
        });
        box.appendChild(dg);
      }
      // i round speciali del programma vero: si accendono e si spengono uno per uno (accesi di base)
      box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: "Round speciali, come in TV" }));
      var gs = el("div", { style: "display:grid;grid-template-columns:1fr 1fr;gap:8px" });
      [["prenota", "🔔 Prenota"], ["express", "🚂 Express"], ["veloce", "⚡ Round veloce"], ["finale", "🏆 Finale"]].forEach(function (r) {
        dove[r[0]] = true;
        var b = el("button", { class: "modo-chip attiva", style: "justify-content:center;text-align:center", onclick: function () {
          dove[r[0]] = !dove[r[0]]; b.className = "modo-chip" + (dove[r[0]] ? " attiva" : "");
        } }, [ el("div", { class: "mt", text: r[1] }) ]);
        gs.appendChild(b);
      });
      box.appendChild(gs);
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      var modo = (t.impostazioni || {}).modo;
      return partita(t, modo === "online" ? "online" : modo === "telefono" ? "telefono" : "bot");
    }
  });

  // per le prove
  window.__RUOTA = { creaPartita: creaPartita, righe: righe, righeIdx: righeIdx, coperta: coperta, solo: solo, corta: corta, decidiBot: decidiBot, letteraBot: letteraBot, SPICCHI: SPICCHI, BUSTE: BUSTE, INCASSI: INCASSI };
})();

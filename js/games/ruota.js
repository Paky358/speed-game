/* =========================================================
   LA RUOTA DELLA FORTUNA — come il quiz della TV.
   Si gira la ruota, si chiama una consonante (lo spicchio vale per ogni lettera trovata),
   si comprano le vocali, si risolve la frase. Bancarotta, Passa e Jolly come in TV.
   Vince chi accumula di più in tutte le manche.
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
  var VOCALI = ["A", "E", "I", "O", "U"];
  var CONSONANTI = "BCDFGHJKLMNPQRSTVWXYZ".split("");
  var FREQ_C = "NRTLSCDMPVGBFZHQKJWXY".split("");   // consonanti dalla più frequente in italiano
  var FREQ_V = ["E", "A", "I", "O", "U"];
  var NOMI_BOT = ["Bot", "Rosa", "Peppe", "Gina"];
  var COL = 12, RIGHE = 4;
  var PARTITE_SALVATE = {};
  // la ruota: 24 spicchi (valori, 2 Bancarotta, 1 Passa, 1 Jolly)
  var SPICCHI = [
    { v: 500 }, { v: 300 }, { s: "bancarotta" }, { v: 700 }, { v: 400 }, { v: 250 },
    { v: 800 }, { s: "passa" }, { v: 350 }, { v: 600 }, { v: 1000 }, { v: 300 },
    { s: "jolly" }, { v: 450 }, { v: 200 }, { v: 900 }, { s: "bancarotta" }, { v: 500 },
    { v: 650 }, { v: 2000 }, { v: 400 }, { v: 550 }, { v: 300 }, { v: 750 }
  ];
  var COLORI = ["#e03131", "#f08c00", "#fab005", "#2f9e44", "#1971c2", "#9c36b5"];
  var ACC = { "À": "A", "È": "E", "É": "E", "Ì": "I", "Ò": "O", "Ù": "U" };
  var FRASI_RISERVA = [
    { c: "Proverbi", f: "CHI DORME NON PIGLIA PESCI" }, { c: "Proverbi", f: "TRA IL DIRE E IL FARE C'È DI MEZZO IL MARE" },
    { c: "Modi di dire", f: "AVERE LE MANI IN PASTA" }, { c: "Cibo e cucina", f: "SPAGHETTI ALLA CARBONARA" },
    { c: "Luoghi", f: "LA TORRE DI PISA" }, { c: "Cose di casa", f: "LA LAVATRICE NUOVA" },
    { c: "Sport", f: "CALCIO DI RIGORE" }, { c: "In vacanza", f: "OMBRELLONE IN SPIAGGIA" }
  ];

  function base(ch) { return ACC[ch] || ch; }
  function eLettera(ch) { return /^[A-ZÀÈÉÌÒÙ]$/.test(ch); }
  function fmtN(n) { var s = String(Math.round(Math.abs(n || 0))).replace(/\B(?=(\d{3})+(?!\d))/g, "."); return (n < 0 ? "−" : "") + s; }
  function salvaTrofei(vm, giocatoreId, modo, liv, nomeProfilo, spettatore) {
    try {
      if (spettatore || modo === "prova" || !vm || vm.fase !== "fine" || !(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      var profilo = SGNube.profilo(), lista = vm.giocatori || [];
      // giocatoreId = il giocatore di questo telefono (host o amico online, tu contro i bot).
      // Sullo stesso telefono si cerca il nome del profilo; se non c'è, si conta almeno la partita giocata.
      var giocatore = giocatoreId ? lista.filter(function (p) { return p.id === giocatoreId; })[0] :
        lista.filter(function (p) { return String(p.nome || "").trim().toLowerCase() === String(profilo.nome || "").trim().toLowerCase(); })[0];
      if (!vm.gameId) return;
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
  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  function svuota(n) { while (n && n.firstChild) n.removeChild(n.firstChild); }
  function frasi() { var f = window.SG_RUOTA_FRASI; return f && f.length ? f : FRASI_RISERVA; }
  function solo(testo) { return String(testo || "").toUpperCase().split("").map(base).filter(function (c) { return /[A-Z]/.test(c); }).join(""); }
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
    var P = { giocatori: giocatori.map(function (g) { return { id: g.id, nome: g.nome, bot: !!g.bot, omino: g.omino || null, totale: 0, soldi: 0, jolly: 0, via: false,
      stat: { giri: 0, consonantiIndovinate: 0, vocaliIndovinate: 0, frasiRisolte: 0, mancheVinte: 0, mancheDa5000: 0, bancarotte: 0 } }; }),
      modo: cfg.modo || "bot", difficolta: cfg.difficolta || "medio",
      mancheTot: mancheTot, manche: 0, turno: 0, fase: "pronti", frase: "", cat: "", rivelate: {}, chiamate: {},
      spicchio: -1, angolo: 0, giroN: 0, msg: "", ultime: [], usate: {}, vince: null, classifica: null };
    function g() { return P.giocatori[P.turno]; }
    function occ(L) { var n = 0; P.frase.split("").forEach(function (ch) { if (eLettera(ch) && base(ch) === L) n++; }); return n; }
    function nascoste(lista) { var n = 0; P.frase.split("").forEach(function (ch) { var b = base(ch); if (eLettera(ch) && !P.rivelate[b] && lista.indexOf(b) >= 0) n++; }); return n; }
    P.consonantiNascoste = function () { return nascoste(CONSONANTI); };
    P.vocaliNascoste = function () { return nascoste(VOCALI); };
    P.tutteFuori = function () { return P.consonantiNascoste() + P.vocaliNascoste() === 0; };
    P.occ = occ;
    function prossimo() {
      var n = P.giocatori.length;
      for (var k = 1; k <= n; k++) { var j = (P.turno + k) % n; if (!P.giocatori[j].via) { P.turno = j; break; } }
      P.fase = "gira"; P.annullato = false;
    }
    // lettera sbagliata, Passa o soluzione sbagliata: il Jolly fa giocare ancora (non salva da Bancarotta e tempo scaduto)
    function perdeTurno(msg) {
      var p = g();
      if (p.jolly > 0) { p.jolly--; P.msg = msg + " Ma c'è il Jolly: " + p.nome + " gioca ancora!"; P.fase = "gira"; return; }
      P.msg = msg; prossimo();
    }
    P.nuovaManche = function () {
      P.manche++;
      var lista = frasi(), cand = [], viste = frasiViste();
      lista.forEach(function (x, i) { if (!P.usate[i] && !viste[String(x.f).toUpperCase()]) cand.push(i); });
      if (!cand.length) lista.forEach(function (x, i) { if (!P.usate[i]) cand.push(i); });   // viste tutte: si riparte
      if (!cand.length) { P.usate = {}; cand = lista.map(function (x, i) { return i; }); }
      var i = cand[Math.floor(Math.random() * cand.length)]; P.usate[i] = 1;
      P.frase = String(lista[i].f).toUpperCase(); P.cat = lista[i].c;
      segnaVista(P.frase);
      P.rivelate = {}; P.chiamate = {}; P.ultime = []; P.vince = null; P.spicchio = -1; P.annullato = false;
      P.giocatori.forEach(function (x) { x.soldi = 0; x.jolly = 0; });
      P.turno = (P.manche - 1) % P.giocatori.length; if (P.giocatori[P.turno].via) prossimo();
      P.fase = "gira"; P.msg = "Manche " + P.manche + " di " + P.mancheTot + ": " + P.cat;
    };
    P.puo = function () {   // cosa può fare chi è di turno
      var p = g();
      return { gira: P.fase === "gira" && P.consonantiNascoste() > 0, compra: P.fase === "gira" && p.soldi >= COSTO_VOCALE && P.vocaliNascoste() > 0, risolvi: P.fase === "gira" };
    };
    P.gira = function () {
      if (!P.puo().gira) return false;
      var i = Math.floor(Math.random() * SPICCHI.length);
      var meta = (360 - ((i + 0.5) * 15 + (Math.random() * 9 - 4.5)) % 360) % 360;   // lo spicchio i sotto la freccia (in alto)
      var giri = 4 + Math.floor(Math.random() * 2);
      P.angolo = P.angolo + giri * 360 + ((meta - (P.angolo % 360)) + 720) % 360;
      P.spicchio = i; P.giroN++; g().stat.giri++; P.fase = "girando"; P.ultime = []; P.msg = g().nome + " gira la ruota…";
      return true;
    };
    P.dopoGiro = function () {   // la ruota si è fermata
      if (P.fase !== "girando") return;
      var s = SPICCHI[P.spicchio], p = g();
      if (p.via) { P.msg = "👋 " + p.nome + " ha lasciato la partita."; prossimo(); return; }   // ha girato ed è uscito: tocca al prossimo
      if (s.v) { P.fase = "consonante"; P.msg = p.nome + ": " + fmtN(s.v) + " a lettera, scegli una consonante"; }
      else if (s.s === "bancarotta") { p.soldi = 0; p.stat.bancarotte++; P.msg = "💥 Bancarotta! " + p.nome + " perde i soldi della manche."; prossimo(); }
      else if (s.s === "passa") perdeTurno("⏭️ Passa! " + p.nome + " perde il turno.");
      else { p.jolly++; P.fase = "gira"; P.msg = "🃏 Jolly per " + p.nome + "! Lo tiene e gira ancora."; }
    };
    P.consonante = function (L) {
      if (P.fase !== "consonante" || CONSONANTI.indexOf(L) < 0 || P.chiamate[L]) return false;
      var p = g(), n = occ(L), val = SPICCHI[P.spicchio].v;
      P.chiamate[L] = 1;
      if (n > 0) {
        P.rivelate[L] = 1; P.ultime = [L];
        if (P.modo !== "bot" || P.difficolta !== "facile") p.stat.consonantiIndovinate++;
        p.soldi += val * n;
        P.msg = p.nome + ": " + (n === 1 ? "c'è una " + L : "ci sono " + n + " " + L) + "! +" + fmtN(val * n);
        if (P.tutteFuori()) return vinceManche(p), true;
        P.fase = "gira";
      } else perdeTurno("Nessuna " + L + " per " + p.nome + ".");
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
        P.fase = "gira";
      } else perdeTurno("Nessuna " + V + " per " + p.nome + ".");
      return true;
    };
    P.risolvi = function () { if (!P.puo().risolvi) return false; P.fase = "risolvi"; P.msg = g().nome + " prova a risolvere…"; return true; };
    P.soluzione = function (testo) {
      if (P.fase !== "risolvi") return false;
      if (solo(testo) === solo(P.frase)) { if (P.modo !== "bot" || P.difficolta !== "facile") g().stat.frasiRisolte++; vinceManche(g()); }
      else perdeTurno("❌ " + g().nome + " sbaglia la soluzione.");
      return true;
    };
    // "Annulla" senza aver scritto niente: si torna a scegliere (una volta per turno), senza perdere il turno
    P.annullaRisolvi = function () {
      if (P.fase !== "risolvi" || P.annullato) return false;
      P.annullato = true; P.fase = "gira"; P.msg = g().nome + " ci ripensa."; return true;
    };
    P.rinuncia = function (tempo) {   // tempo scaduto o rinuncia: perde il turno
      if (["gira", "consonante", "vocale", "risolvi"].indexOf(P.fase) < 0) return false;
      P.msg = (tempo ? "⏰ Tempo scaduto: " : "🏳️ ") + g().nome + " perde il turno."; prossimo(); return true;
    };
    function vinceManche(p) {
      CONSONANTI.concat(VOCALI).forEach(function (L) { P.rivelate[L] = 1; });
      var vincita = Math.max(p.soldi, MINIMO_RISOLVI);
      p.totale += vincita;
      p.stat.mancheVinte++;
      if (vincita >= 5000) p.stat.mancheDa5000++;
      P.giocatori.forEach(function (x) { if (x !== p) x.soldi = 0; });
      p.soldi = vincita;
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
        P.fase = "fine"; P.msg = "";
      } else P.nuovaManche();
    };
    P.esce = function (id) {
      P.giocatori.forEach(function (x, i) {
        if (x.id !== id || x.via) return;
        x.via = true; x.soldi = 0; x.jolly = 0;
        if (i === P.turno && ["gira", "consonante", "vocale", "risolvi"].indexOf(P.fase) >= 0) { P.msg = "👋 " + x.nome + " ha lasciato la partita."; prossimo(); }
        // (se esce mentre la ruota gira, il turno passa quando si ferma: vedi dopoGiro)
      });
    };
    // chi era stato tolto (telefono spento più di 20 secondi) e torna: tiene il totale e rientra nel giro
    P.torna = function (id) {
      var ok = false;
      P.giocatori.forEach(function (x) { if (x.id === id && x.via) { x.via = false; x.soldi = 0; x.jolly = 0; ok = true; if (P.fase !== "finemanche") P.msg = "👋 " + x.nome + " è di nuovo in gioco!"; } });
      return ok;
    };
    // la foto: MAI la frase vera (solo coperta), finché non è risolta
    P.vista = function () {
      var tp = P.giocatori[P.turno];
      return { fase: P.fase, manche: P.manche, mancheTot: P.mancheTot, cat: P.cat, tab: P.fase === "finemanche" || P.fase === "fine" ? P.frase : coperta(P.frase, P.rivelate),
        chiamate: Object.keys(P.chiamate), ultime: P.ultime.slice(), turno: tp ? tp.id : null, spicchio: P.spicchio, angolo: P.angolo, giroN: P.giroN, msg: P.msg,
        puo: tp ? P.puo() : null, indietro: P.fase === "risolvi" && !P.annullato, cons: P.consonantiNascoste(), voc: P.vocaliNascoste(), vince: P.vince, classifica: P.classifica,
        statFine: P.fase === "fine" ? P.giocatori.reduce(function (a, x) { a[x.id] = x.stat; return a; }, {}) : null,
        giocatori: P.giocatori.map(function (x) { return { id: x.id, nome: x.nome, bot: x.bot, totale: x.totale, soldi: x.soldi, jolly: x.jolly, via: x.via || undefined }; }) };
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
  function decidiBot(P, liv) {
    var p = P.giocatori[P.turno], puo = P.puo();
    var tot = solo(P.frase).length, noti = solo(coperta(P.frase, P.rivelate).replace(/_/g, "")).length, quota = tot ? noti / tot : 0;
    var cand = candidati(P, p.nome, liv);
    // sa la frase (ne conosce una sola che ci sta): risolve quando ha visto abbastanza
    var basta = { facile: 0.65, medio: 0.5, difficile: 0.4 }[liv] || 0.5;
    if (cand.length === 1 && (quota >= basta || (!puo.gira && !puo.compra))) return { a: "risolvi", testo: cand[0].f };
    // tabellone quasi pieno: ci prova lo stesso (si legge quasi tutto, come farebbe chiunque)
    var soglia = { facile: 0.85, medio: 0.75, difficile: 0.65 }[liv] || 0.75;
    if (quota >= soglia || (!puo.gira && !puo.compra)) {
      if (cand.length) return { a: "risolvi", testo: cand[Math.floor(Math.random() * cand.length)].f };
      var leggi = { facile: 0.7, medio: 0.85, difficile: 0.95 }[liv] || 0.85;
      return { a: "risolvi", testo: Math.random() < leggi ? P.frase : "SBAGLIATA" };
    }
    if (puo.compra && (!puo.gira || (p.soldi >= 1500 && Math.random() < 0.35))) return { a: "compra" };
    if (puo.gira) return { a: "gira" };
    return { a: "risolvi", testo: "SBAGLIATA" };
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

  // =========================================================
  //  LA PARTITA SU QUESTO TELEFONO: contro il computer, sullo stesso telefono, oppure host online
  // =========================================================
  function partita(t, modo) {
    var online = modo === "online";
    if (online && !(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {}, liv = imp.difficolta || "medio", mancheTot = Math.max(1, Math.min(6, Math.floor(+imp.manche || 4)));
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
    var P = null, rete = null, tBot = null, tTempo = null, tFase = null;
    H.mosse = 0;        // cresce a ogni mossa vera: il tempo per decidere riparte solo allora
    H.kFase = "";       // per quale momento è partito il timer della ruota / della fine manche
    H.kTempo = ""; H.scade = 0;   // il tempo per decidere (online): per chi e fino a quando

    function ferma() { clearTimeout(tBot); clearTimeout(tTempo); clearTimeout(tFase); tBot = tTempo = tFase = null; H.kFase = H.kTempo = ""; H.scade = 0; }
    function vm() {
      if (H.fase !== "gioco" && H.fase !== "fine") return { fase: H.fase, codice: H.codice, pronta: H.pronta, mancheTot: mancheTot, gameId: H.gameId, modo: modo, difficolta: liv,
        giocatori: posti.map(function (p) { return { id: p.id, nome: p.nome, bot: !!p.bot }; }) };
      var v = P.vista(); v.fase = H.fase === "fine" ? "fine" : v.fase; v.codice = H.codice; v.giocoFase = H.fase; v.sigla = H.sigla || false;
      v.gameId = H.gameId; v.modo = modo; v.difficolta = liv;
      // il tempo che resta a chi è di turno (in millisecondi: gli orologi dei telefoni non sono uguali) e quanto era in tutto
      if (H.scade && H.fase === "gioco") { v.resta = Math.max(0, H.scade - Date.now()); v.tempoTot = H.tempoTot; v.kTempo = H.kTempo; }
      return v;
    }
    function bd() { var v = vm(); if (rete) rete.invia({ t: "vm", vm: v }); disegna(t, v, cb); }
    // il giro: bot, la ruota che si ferma, fine manche, tempo per decidere (online).
    // Se ciclo() viene richiamato senza che sia successo niente di nuovo (es. un amico esce), i timer già partiti restano come sono.
    function ciclo() {
      clearTimeout(tBot); tBot = null;
      if (H.fase !== "gioco" || !P || H.sigla) { clearTimeout(tTempo); tTempo = null; H.scade = 0; return; }
      if (P.fase === "girando" || P.fase === "finemanche") {
        clearTimeout(tTempo); tTempo = null; H.scade = 0; H.kTempo = "";
        var kf = P.fase + ":" + P.manche + ":" + P.giroN;
        if (H.kFase === kf && tFase) return;   // già in corso
        clearTimeout(tFase); H.kFase = kf;
        if (P.fase === "girando") tFase = setTimeout(function () { tFase = null; P.dopoGiro(); dopo(); }, T_GIRO);
        else tFase = setTimeout(function () { tFase = null; P.dopoManche(); if (P.fase === "fine") finePartita(); else dopo(); }, 4500);
        return;
      }
      if (P.fase === "fine") return;
      var p = P.giocatori[P.turno];
      var nuovo = H.ultimoTurno !== P.turno + ":" + P.manche; H.ultimoTurno = P.turno + ":" + P.manche;
      // il bot aspetta un po' di più a inizio turno: prima la telecamera arriva al suo leggio
      if (p.bot) { clearTimeout(tTempo); tTempo = null; H.scade = 0; H.kTempo = ""; tBot = setTimeout(mossaBot, (P.fase === "risolvi" ? 1800 : 1100 + Math.random() * 700) + (nuovo ? 1700 : 0)); return; }
      if (online) {
        var kt = P.manche + ":" + P.turno + ":" + H.mosse;
        if (H.kTempo === kt && tTempo) return;   // stesso momento: il tempo non riparte da capo
        clearTimeout(tTempo); H.kTempo = kt;
        H.tempoTot = P.fase === "risolvi" ? T_RISOLVI : T_MOSSA; H.scade = Date.now() + H.tempoTot;
        tTempo = setTimeout(function () { tTempo = null; H.scade = 0; if (P.rinuncia(true)) { H.mosse++; dopo(); } }, H.tempoTot);
      }
    }
    function dopo() { ciclo(); bd(); }
    function mossaBot() {
      var p = P.giocatori[P.turno]; if (!p || !p.bot) return;
      if (P.fase === "gira") {
        var d = decidiBot(P, liv);
        if (d.a === "gira") P.gira();
        else if (d.a === "compra") P.compra();
        else { P.risolvi(); p._testo = d.testo; }
      } else if (P.fase === "consonante") { var L = letteraBot(P, liv, CONSONANTI, FREQ_C); if (L) P.consonante(L); else P.rinuncia(); }
      else if (P.fase === "vocale") { var V = letteraBot(P, liv, VOCALI, FREQ_V); if (V) P.vocale(V); else P.rinuncia(); }
      else if (P.fase === "risolvi") P.soluzione(p._testo || "SBAGLIATA");
      H.mosse++;
      dopo();   // (i suoni li fa il disegno, uguale su tutti i telefoni)
    }
    function finePartita() {
      if (H.fase === "fine") return;   // una volta sola (il risultato vale per XP e torneo)
      ferma();
      H.fase = "fine";
      salvaTrofei(vm(), modo === "telefono" ? null : "host", modo, liv, nome, false);
      bd();
      if (t.risultato && P.classifica) t.risultato(P.classifica.filter(function (r) { var x = posti.filter(function (p) { return p.id === r.id; })[0]; return x && !x.bot && !r.uscito; }).map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    function comincia() {
      if (posti.length < 2) return;
      ferma();
      H.gameId = (online ? H.codice : modo) + "-" + Date.now() + "-" + Math.random().toString(36).slice(2, 8);
      P = creaPartita(posti, mancheTot, { modo: modo, difficolta: liv }); P.nuovaManche(); H.fase = "gioco"; H.ultimoTurno = null; H.mosse = 0;
      // prima la sigla dello studio (presenta i concorrenti), poi si gioca. Quando si rigioca, una sigla corta.
      H.sigla = H.giocate ? "corta" : "intera"; H.giocate = (H.giocate || 0) + 1; bd();
      var dur = !window.SGStudio ? 0 : H.sigla === "corta" ? SIGLA_CORTA : SGStudio.durataApertura(posti.length);
      tFase = setTimeout(function () { tFase = null; H.sigla = false; dopo(); }, dur);
    }
    // le mosse di chi è di turno su questo telefono (o, sullo stesso telefono, di chiunque sia di turno)
    function mia(id) {
      if (!P || H.fase !== "gioco" || H.sigla) return false;
      var p = P.giocatori[P.turno];
      return p && !p.bot && (modo === "telefono" || p.id === id);
    }
    function azione(id, a, x) {
      if (!mia(id)) return;
      var ok = false;
      if (a === "gira") ok = P.gira();
      else if (a === "compra") ok = P.compra();
      else if (a === "risolvi") ok = P.risolvi();
      else if (a === "lettera") { var L = String(x || "").toUpperCase(); ok = P.fase === "vocale" ? P.vocale(L) : P.consonante(L); }
      else if (a === "soluzione") ok = P.soluzione(x);
      else if (a === "annulla") ok = P.fase === "risolvi" && (x === "vuoto" && P.annullaRisolvi() || P.rinuncia());   // senza aver scritto niente si torna indietro
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
        if (H.fase === "gioco" && !gia && !window.confirm(online ? "Chiudere la partita per tutti?" : "Uscire dalla partita?")) return;
        ferma(); if (rete) rete.chiudi(); t.esci();
      } };
    // "⚙️ Regole" nella saletta: quante manche e bravura dei bot
    t.onRegole = function (im) { if (H.fase !== "lobby") return; mancheTot = Math.max(1, Math.min(6, Math.floor(+im.manche || mancheTot))); liv = im.difficolta || liv; bd(); };

    if (online) {
      rete = SGNet.ospita(ID, {
        onCodice: function (c) { H.codice = c; bd(); },
        onConnesso: function () { H.pronta = true; bd(); },
        onAddio: function (id) {
          if (H.fase === "lobby") { posti = posti.filter(function (p) { return p.id !== id; }); bd(); return; }
          if (P) { P.esce(id); dopo(); }
        },
        onMsg: function (id, m) {
          if (!m || !m.t) return;
          if (m.t === "join") {
            var gia = posti.some(function (p) { return p.id === id; });
            if (!gia && H.fase === "lobby" && posti.length < MAX) {
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
        onErrore: function () { senzaRete(t); }
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
        if (S.vm && S.vm.giocoFase === "gioco" && !gia && !window.confirm("Uscire dalla partita?")) return;
        if (S.rete) S.rete.chiudi(); t.esci();
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
            S.vm = m.vm;
            // non sono (più) tra i giocatori ma c'è posto, oppure l'host mi aveva tolto: ripeto "join"
            var me = (m.vm.giocatori || []).filter(function (p) { return p.id === S.myId; })[0];
            if (S.myId && (m.vm.fase === "lobby" ? !me && m.vm.giocatori.length < MAX : me && me.via && m.vm.giocoFase === "gioco") && Date.now() - S.ultimoJoin > 2500) join();
            if (m.vm.fase === "fine") salvaTrofei(m.vm, S.myId, m.vm.modo, m.vm.difficolta, S.nome, false);
            disegna(t, m.vm, cb);
          }
          else if (m.t === "omini") { S.omini = m.omini || {}; if (S.vm) disegna(t, S.vm, cb); }
        },
        onChiuso: function () { errore(t, "La partita è stata chiusa dall'host."); },
        onErrore: function () { errore(t, "Problema di collegamento. Riprova."); }
      });
    }
  }

  // =========================================================
  //  DISEGNO: la saletta, poi lo STUDIO TV (come gli altri giochi di quiz).
  //  Il tabellone sta fisso in alto (sempre visibile, non si muove con la telecamera), la ruota sul maxischermo,
  //  i concorrenti ai leggii (sul display i soldi della manche), i tasti nella barra in basso.
  //  La telecamera va sulla ruota quando gira e sul concorrente di turno quando deve scegliere.
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
        var ui = R; ui.finita = true; ui.cb = cb; fermaRegia(ui);
        ui.sopra.classList.add("via");
        var vinc = vm.classifica && vm.classifica.length ? ui.ids.indexOf(vm.classifica[0].id) : -1;
        Promise.resolve(ST.finale(ui.S, vinc, "Ha vinto La Ruota della Fortuna! 🎡")).catch(function () {}).then(function () {
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
  function lobby(t, vm, cb) {
    var el = t.el, extra = [el("p", { class: "modulo-nota", text: "Da 2 a 4 alla ruota · " + vm.mancheTot + " manche. I posti vuoti li possono prendere i bot." })];
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
      onComincia: cb.onComincia, onEsci: cb.onEsci });
    // il titolo della saletta comune dice sempre "Sei dentro!": per chi non è (ancora) alla ruota lo cambio
    var tit = !cb.sonoHost && s && s.querySelector ? s.querySelector(".sl-att-tit") : null;
    if (tit) {
      var tx = dentro ? "✅ Sei dentro!" : piena ? "👀 La stanza è piena (" + MAX + " alla ruota)" : "⏳ Sto entrando…";
      if (tit.textContent !== tx) tit.textContent = tx;
      tit.style.color = dentro ? "" : "#ffd43b";
    }
  }
  function creaStudioRuota(t, vm, cb) {
    stile();
    var el = t.el, ids = vm.giocatori.map(function (p) { return p.id; });
    var ui = { t: t, el: el, cb: cb, vm: vm, ids: ids, kTab: "", kTast: "", giroN: -1, scritto: [], cur: 0, prec: null, mostrati: {}, inq: "", barraH: -1, timer: [],
      fuori: {}, jolly: {}, kTempo: "" };
    ui.S = ST.crea(t, vm.giocatori.map(function (p) { return { nome: p.nome, omino: (cb.omini() || {})[p.id] || (window.SGOmino ? SGOmino.casuale(p.nome) : null) }; }),
      { io: cb.telefono ? -1 : ids.indexOf(cb.myId), esci: function () { fermaRegia(ui); ui.cb.onEsci(true); }, titolo: "La Ruota della Fortuna", logo: ["LA RUOTA", "DELLA FORTUNA"] });
    var S = ui.S;
    S.sopraLibero = 0.6;   // la telecamera può salire sopra lo studio: lassù c'è il tabellone
    S.vista.classList.add("ru-studio");
    // in alto, fisso: categoria, tabellone, cosa succede
    ui.cat = el("div", { class: "ru-cat" });
    ui.tab = el("div", { class: "ru-tab" }); ui.celle = [];
    for (var r = 0; r < RIGHE; r++) for (var c = 0; c < COL; c++) {
      var d = el("div", { class: "ru-cella vuota" }); ui.celle.push(d); ui.tab.appendChild(d);
      // mentre risolvi: tocchi una casella coperta per scriverci
      d.addEventListener("click", function (e) { var b = e.currentTarget._buco; if (ui.scrivi && b != null) { ui.cur = b; ui.ridisegna(); } });
    }
    ui.msg = el("div", { class: "ru-msg" });
    ui.sopra = el("div", { class: "ru-sopra" }, [ ui.cat, ui.tab, ui.msg ]);
    S.vista.appendChild(ui.sopra);
    // la ruota (va sul maxischermo) e i tasti (nella barra in basso)
    ui.canvas = el("canvas", { class: "ru-disco", width: "440", height: "440" });
    disegnaRuota(ui.canvas);
    ui.ruota = el("div", { class: "ru-ruota-sch" }, [ ui.canvas,
      el("div", { class: "ru-freccia", html: "<svg viewBox='0 0 10 10'><polygon points='0,0 10,0 5,10' fill='#ffd43b' stroke='#a85c00' stroke-width='.6'/></svg>" }),
      el("div", { class: "ru-centro" }), ui.oro = el("div", { class: "ru-oro" }) ]);
    ui.azioni = el("div", { class: "ru-azioni" });
    // online: la barretta del tempo che resta a chi è di turno (si accorcia da sola, senza ridisegnare i tasti)
    if (cb.online) { ui.tempoBar = el("i"); ui.tempo = el("div", { class: "ru-tempo" }, [ ui.tempoBar ]); }
    // il Jolly sul leggio di chi ce l'ha
    ui.jb = S.L.map(function (X) { var j = el("div", { class: "ru-jolly" }); X.el.appendChild(j); return j; });
    vm.giocatori.forEach(function (p, i) { ST.puntiLeggio(S, i, p.soldi); ui.mostrati[p.id] = p.soldi; });
    function via() { ST.vuota(S.sch); S.sch.appendChild(ui.ruota); ST.barra(S, [ ui.tempo, ui.azioni ]); ui.sopra.classList.remove("via"); }
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
  function disegnaRuota(cv) {
    var c = cv.getContext("2d"), Rr = 220, passo = Math.PI * 2 / SPICCHI.length;
    c.translate(Rr, Rr);
    SPICCHI.forEach(function (sp, i) {
      var a0 = -Math.PI / 2 + i * passo, a1 = a0 + passo;
      c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, Rr - 4, a0, a1); c.closePath();
      c.fillStyle = sp.s === "bancarotta" ? "#111" : sp.s === "passa" ? "#f1f3f5" : sp.s === "jolly" ? "#7048e8" : COLORI[i % COLORI.length];
      c.fill(); c.strokeStyle = "rgba(255,255,255,.85)"; c.lineWidth = 2; c.stroke();
      c.save(); c.rotate(a0 + passo / 2); c.textAlign = "right"; c.textBaseline = "middle";
      c.fillStyle = sp.s === "passa" ? "#222" : "#fff"; c.font = "900 " + (sp.s ? 19 : 26) + "px system-ui, sans-serif";
      c.fillText(sp.s === "bancarotta" ? "BANCAROTTA" : sp.s === "passa" ? "PASSA" : sp.s === "jolly" ? "JOLLY" : fmtN(sp.v), Rr - 16, 0);
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
  function inquadra(ui, cosa, i, ms) {
    var k = cosa + ":" + (i == null ? "" : i);
    if (k === ui.inq) return;
    ui.inq = k;
    ST.inquadra(ui.S, cosa === "ruota" ? function () { return shotRuota(ui); } : function () { return shotLeggio(ui, i); }, ms == null ? 700 : ms);
  }
  function dopo(ui, ms, fn) { ui.timer.push(setTimeout(function () { if (ui.S.vivo() && !ui.finita) fn(); }, ms)); }
  function fermaRegia(ui) { ui.timer.forEach(clearTimeout); ui.timer = []; }
  function facciaPerUnPo(ui, i, f) {
    if (i < 0) return;
    ST.faccia(ui.S, i, f);
    clearTimeout(ui["tf" + i]); ui["tf" + i] = setTimeout(function () { if (ui.S.vivo()) ST.faccia(ui.S, i, null); }, 1900);
  }
  function trovaG(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return vm.giocatori[i]; return null; }
  function conta(tab, L) { var n = 0; tab.split("").forEach(function (ch) { if (eLettera(ch) && base(ch) === L) n++; }); return n; }

  function aggiorna(ui, vm) {
    var S = ui.S, cb = ui.cb, prec = ui.prec || {}, it = ui.ids.indexOf(vm.turno), ip = ui.ids.indexOf(prec.turno);
    var mioTurno = !!vm.turno && (cb.telefono ? !isBot(vm, vm.turno) : vm.turno === cb.myId);
    var inRisolvi = vm.fase === "risolvi" && mioTurno;
    if (!inRisolvi) { ui.scritto = []; ui.cur = 0; }
    ui.sopra.classList.toggle("scrivi", inRisolvi);
    ui.cat.textContent = (vm.cat || "") + "  ·  manche " + vm.manche + "/" + vm.mancheTot;
    // ---- tabellone: 4 righe da 12, la frase al centro ----
    var kt = vm.tab + "|" + (inRisolvi ? ui.scritto.join(",") + "|" + ui.cur : "") + "|" + vm.ultime.join("");
    if (kt !== ui.kTab) {
      var primaVolta = !ui.kTab; ui.kTab = kt;
      var rr = righe(vm.tab), su = Math.floor((RIGHE - Math.min(RIGHE, rr.length)) / 2), buco = 0, nuove = 0;
      ui.celle.forEach(function (d) { if (d.className !== "ru-cella vuota") d.className = "ru-cella vuota"; if (d.textContent) d.textContent = ""; d._buco = null; });
      rr.slice(0, RIGHE).forEach(function (riga, r) {
        var x0 = Math.floor((COL - riga.length) / 2);
        riga.split("").forEach(function (ch, k) {
          var d = ui.celle[(su + r) * COL + x0 + k]; if (!d || ch === " ") return;
          if (ch === "_") {
            var sc = inRisolvi && ui.scritto[buco];
            d.className = "ru-cella " + (sc ? "scritta" : "coperta") + (inRisolvi && buco === ui.cur ? " cursore" : ""); d.textContent = sc || "";
            d._buco = inRisolvi ? buco : null; buco++;
          } else {
            var nu = !primaVolta && vm.ultime.indexOf(base(ch)) >= 0;
            d.className = "ru-cella" + (nu ? " nuova" : "");
            // come in TV: le caselle della lettera si girano una dopo l'altra
            var rit = nu ? (nuove++ * 0.16).toFixed(2) + "s" : "";
            if (d.style.animationDelay !== rit) d.style.animationDelay = rit;
            d.textContent = ch;
          }
        });
      });
    }
    ui.msg.textContent = vm.msg || "";
    tempo(ui, vm);
    // ---- i leggii: i soldi della manche (a fine manche il totale di tutta la partita), chi è uscito, il Jolly ----
    var fineM = vm.fase === "finemanche";
    ui.ids.forEach(function (id, i) {
      var p = trovaG(vm, id), fu = !p || !!p.via;
      if (!!ui.fuori[id] !== fu) { ui.fuori[id] = fu; ST.fuori(S, i, fu); }
      var nj = p && !fu ? p.jolly || 0 : 0;
      if (ui.jb[i] && ui.jolly[id] !== nj) {
        ui.jolly[id] = nj; ui.jb[i].textContent = nj > 1 ? "🃏×" + nj : "🃏"; ui.jb[i].classList.toggle("on", nj > 0);
      }
      if (fu) return;
      var val = fineM ? p.totale : p.soldi;
      if (ui.mostrati[id] === val && ui.modoLeggii === fineM) return;
      var d = 0;
      if (fineM && prec.fase && prec.fase !== "finemanche") d = vm.vince && vm.vince.id === id ? vm.vince.vincita : 0;
      else if (!fineM && prec.manche === vm.manche && ui.modoLeggii === fineM) d = val - (ui.mostrati[id] || 0);
      ST.puntiLeggio(S, i, val, d);
      ui.mostrati[id] = val;
    });
    ui.modoLeggii = fineM;
    ST.accendiSolo(S, ["gira", "consonante", "vocale", "risolvi", "girando"].indexOf(vm.fase) >= 0 ? it : -1);
    // ---- cosa è successo: telecamera, suoni e facce (uguali su tutti i telefoni) ----
    var tieni = 0;   // per quanto la telecamera resta su un momento prima di tornare a chi è di turno
    if (vm.giroN !== ui.giroN) {   // un giro nuovo: la telecamera va sulla ruota e la ruota gira
      var primoGiro = ui.giroN === -1; ui.giroN = vm.giroN;
      if (!primoGiro && vm.fase === "girando") {
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
      if (prec.fase === "girando" && vm.fase !== "girando") {   // la ruota si è fermata: un attimo sulla ruota
        var sp = SPICCHI[vm.spicchio] || {};
        tieni = 650;
        if (sp.s === "bancarotta" || sp.s === "passa") {   // poi sul concorrente sfortunato, poi su chi tocca
          if (sp.s === "bancarotta") { ST.FX.ohh(); ST.scossa(S); }
          dopo(ui, 650, function () { inquadra(ui, "leggio", ip, 600); facciaPerUnPo(ui, ip, sp.s === "bancarotta" ? "esploso" : "triste"); });
          if (ip !== it) tieni = 2300;
        } else if (sp.s === "jolly") ST.FX.applauso("piano");
        else if (sp.v >= 2000) {   // lo spicchio d'oro: luce dorata sulla ruota e applauso
          ui.oro.classList.remove("on"); void ui.oro.offsetWidth; ui.oro.classList.add("on");
          ST.FX.applauso("piano"); bip(1318, 0.3, "triangle", 0.07); bip(1760, 0.4, "triangle", 0.07, 0.12);
        }
      }
      if (vm.ultime.length && vm.ultime.join("") !== (prec.ultime || []).join("")) {   // una lettera trovata
        var n = conta(vm.tab, vm.ultime[0]); suonoLettera(n); facciaPerUnPo(ui, it >= 0 ? it : ip, "esulta");
        if (n >= 3) ST.FX.applauso("piano");
      } else if (vm.msg !== prec.msg && /^Nessuna |sbaglia/.test(vm.msg || "")) { suonoNo(); facciaPerUnPo(ui, ip, "triste"); }
      if (fineM && prec.fase !== "finemanche") {   // qualcuno ha risolto
        var iv = ui.ids.indexOf(vm.vince && vm.vince.id);
        fermaRegia(ui); ST.FX.applauso("forte"); ST.coriandoli(); suonoVinto();
        if (iv >= 0) { ST.lampo(S); ST.accendiSolo(S, iv); ST.faccia(S, iv, "esulta"); inquadra(ui, "leggio", iv, 800); }
      }
      if (vm.manche !== prec.manche) ST.tutteNormali(S);
    }
    // ---- poi la telecamera va sul concorrente di turno ----
    if (vm.fase !== "girando" && !fineM && it >= 0) {
      if (tieni) dopo(ui, tieni, function () { inquadra(ui, "leggio", it, 700); });
      else inquadra(ui, "leggio", it, prec.fase ? 700 : 0);
    }
    ui.prec = { fase: vm.fase, turno: vm.turno, manche: vm.manche, ultime: vm.ultime.slice(), msg: vm.msg };
    disegnaAzioni(ui, vm, mioTurno);
    // la barra ha cambiato altezza (es. è comparsa la tastiera): rimetto a fuoco l'inquadratura
    var bh = S.barraEl.offsetHeight;
    if (bh !== ui.barraH) { var primaB = ui.barraH === -1; ui.barraH = bh; if (!primaB && S.shot) ST.camera(S, S.shot(), 350); }
  }
  function isBot(vm, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return vm.giocatori[i].bot; return false; }
  function nomeDi(vm, cb, id) { for (var i = 0; i < vm.giocatori.length; i++) if (vm.giocatori[i].id === id) return id === cb.myId && !cb.telefono ? "te" : vm.giocatori[i].nome; return "?"; }
  // la barretta del tempo (online): parte solo quando l'host dà un tempo nuovo, poi si accorcia da sola (CSS)
  function tempo(ui, vm) {
    if (!ui.tempo) return;
    var k = vm.resta && vm.kTempo && ["gira", "consonante", "vocale", "risolvi"].indexOf(vm.fase) >= 0 ? vm.kTempo : "";
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
  function disegnaAzioni(ui, vm, mioTurno) {
    var cb = ui.cb, el = ui.el;
    var io = trovaG(vm, cb.myId);
    var chiave = [vm.fase, vm.turno, vm.chiamate.join(""), mioTurno, JSON.stringify(vm.puo), vm.tab, io ? (io.via ? "via" : "in") : "no"].join("|");
    ui.scrivi = vm.fase === "risolvi" && mioTurno;
    if (chiave === ui.kTast) { if (ui.scrivi) statoScritto(ui); return; }
    ui.kTast = chiave; svuota(ui.azioni); ui.okBtn = null; ui.rsStato = null;
    function stato(txt, cls) { var d = el("div", { class: "ru-stato" + (cls ? " " + cls : ""), text: txt }); ui.azioni.appendChild(d); return d; }
    function btn(cls, txt, fn, off) { var b = el("button", { class: "ru-btn " + cls, text: txt, onclick: fn }); if (off) b.disabled = true; return b; }
    ui.ridisegna = function () { ui.kTab = ""; aggiorna(ui, ui.vm); };
    var me = trovaG(vm, cb.myId);
    if (vm.fase === "girando") return stato("🎡 La ruota gira…");
    if (vm.fase === "finemanche") return stato(vm.manche >= vm.mancheTot ? "Ultima manche finita!" : "Tra poco la manche " + (vm.manche + 1) + "… (sui leggii i totali)");
    if (!mioTurno) {
      var guarda = !cb.telefono && !cb.sonoHost && !me;   // stanza piena o partita già cominciata
      return stato(guarda ? "👀 Partita in corso: stai guardando · tocca a " + nomeDi(vm, cb, vm.turno) :
        me && me.via ? "Rientro nella partita…" : "Tocca a " + nomeDi(vm, cb, vm.turno) + "…");
    }
    var chi = cb.telefono ? nomeDi(vm, cb, vm.turno) + ", " : "";
    var tp = trovaG(vm, vm.turno), jolly = tp && tp.jolly ? " · 🃏 hai " + (tp.jolly > 1 ? tp.jolly + " Jolly" : "un Jolly") : "";
    if (vm.fase === "gira") {
      stato((chi ? chi + "tocca a te!" : "Tocca a te!") + jolly, "piccolo");
      ui.azioni.appendChild(el("div", { class: "ru-riga" }, [
        btn("gira", vm.cons ? "🎡 Gira" : "🎡 Finite", function () { cb.onAzione("gira"); }, !(vm.puo && vm.puo.gira)),
        btn("vocale", "🅰️ Vocale " + COSTO_VOCALE, function () { cb.onAzione("compra"); }, !(vm.puo && vm.puo.compra)),
        btn("risolvi", "💡 Risolvi", function () { cb.onAzione("risolvi"); }) ]));
      return;
    }
    if (vm.fase === "consonante" || vm.fase === "vocale") {
      var lista = vm.fase === "vocale" ? VOCALI : CONSONANTI;
      stato(chi + (vm.fase === "vocale" ? "scegli una vocale" : "scegli una consonante"), "piccolo");
      var gri = el("div", { class: "ru-lettere" + (vm.fase === "vocale" ? " vocali" : "") });
      lista.forEach(function (L) { gri.appendChild(btn("lettera", L, function () { cb.onAzione("lettera", L); }, vm.chiamate.indexOf(L) >= 0)); });
      ui.azioni.appendChild(gri);
      return;
    }
    if (vm.fase === "risolvi") {
      tastiera();
      ui.rsChi = chi;
      ui.rsStato = stato("", "piccolo");
      // le lettere già chiamate non possono stare nelle caselle coperte: sono grigie
      var tast = el("div", { class: "ru-lettere" });
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (L) {
        tast.appendChild(btn("lettera", L, function () { scriviLettera(ui, L); }, vm.chiamate.indexOf(L) >= 0));
      });
      tast.appendChild(btn("lettera canc", "⌫", function () { cancellaLettera(ui); }));
      ui.azioni.appendChild(tast);
      ui.annBtn = btn("annulla", "↩ Indietro", function () {
        var vuoto = !ui.scritto.some(function (x) { return x; });
        ui.scritto = []; ui.cur = 0; cb.onAzione("annulla", vuoto ? "vuoto" : "");
      });
      ui.okBtn = btn("gira", "✓ Risolvi", function () {
        var k = 0, testo = ui.vm.tab.replace(/_/g, function () { return ui.scritto[k++] || "?"; });
        ui.scritto = []; ui.cur = 0; cb.onAzione("soluzione", testo);
      }, true);
      ui.azioni.appendChild(el("div", { class: "ru-riga" }, [ ui.annBtn, ui.okBtn ]));
      statoScritto(ui);
    }
  }
  // mentre scrivi la soluzione cambiano solo il contatore e i due tasti (la tastiera resta com'è)
  function statoScritto(ui) {
    if (!ui.rsStato) return;
    var buchi = (ui.vm.tab.match(/_/g) || []).length, pieni = ui.scritto.filter(function (x) { return x; }).length;
    var tx = ui.rsChi + "scrivi le lettere che mancano (" + pieni + " di " + buchi + ")";
    if (ui.rsStato.textContent !== tx) ui.rsStato.textContent = tx;
    ui.okBtn.disabled = pieni < buchi;
    // senza aver scritto niente si torna indietro (una volta per turno); se no si rinuncia e si perde il turno
    var tb = !pieni && ui.vm.indietro ? "↩ Indietro" : "🏳️ Rinuncio";
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
    if (cb.sonoHost) s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: cb.online ? "↻ Nuova partita (stessi amici)" : "↻ Gioca ancora", onclick: cb.onNuova }));
    else s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center", text: "Se l'host fa un'altra partita, torni da solo nella saletta." }));
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
      ".ru-cat{text-align:center;font-weight:900;font-size:.82rem;letter-spacing:.05em;color:#ffe066;text-transform:uppercase;text-shadow:0 2px 4px rgba(0,0,0,.8)}",
      ".ru-tab{display:grid;grid-template-columns:repeat(12,1fr);gap:3px;padding:5px;border-radius:12px;background:#0b5e3c;box-shadow:inset 0 0 0 3px #12804f,0 6px 18px rgba(0,0,0,.55)}",
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
      // la luce dorata sulla ruota (spicchio da 2.000)
      ".ru-oro{position:absolute;inset:-8%;border-radius:50%;background:radial-gradient(circle,rgba(255,224,102,0) 45%,rgba(255,212,59,.85) 62%,rgba(255,212,59,0) 74%);opacity:0;pointer-events:none}",
      ".ru-oro.on{animation:ruOro 1.8s ease-out}",
      "@keyframes ruOro{0%,100%{opacity:0}15%,45%{opacity:1}30%{opacity:.5}}",
      // il Jolly sul leggio
      ".st-leggio .ru-jolly{position:absolute;z-index:6;right:-4%;top:2%;padding:.15em .4em;border-radius:.6em;background:#7048e8;color:#fff;font-weight:900;font-size:1.5em;line-height:1.2;box-shadow:0 .1em .3em rgba(0,0,0,.5);opacity:0;transform:scale(.3);transition:opacity .3s,transform .35s cubic-bezier(.3,1.6,.5,1);pointer-events:none}",
      ".st-leggio .ru-jolly.on{opacity:1;transform:none}",
      // la barretta del tempo (online)
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
      // i tasti, nella barra dello studio
      ".ru-studio .st-barra{gap:6px;padding:10px 8px calc(10px + env(safe-area-inset-bottom))}",
      ".ru-azioni{display:flex;flex-direction:column;gap:6px;color:#fff}",
      ".ru-stato{text-align:center;font-weight:800;font-size:.92rem;padding:4px 0}.ru-stato.piccolo{padding:0;font-size:.85rem}",
      ".ru-riga{display:flex;gap:6px}",
      ".ru-btn{flex:1;min-height:48px;border:0;border-radius:14px;font:inherit;font-weight:900;font-size:.88rem;color:#fff;cursor:pointer;-webkit-tap-highlight-color:transparent;touch-action:manipulation}",
      ".ru-btn:disabled{opacity:.35}",
      ".ru-btn.gira{background:#e8590c}.ru-btn.vocale{background:#1c7ed6}.ru-btn.risolvi{background:#2f9e44}.ru-btn.annulla{background:#495057}",
      ".ru-lettere{display:grid;grid-template-columns:repeat(7,1fr);gap:5px}.ru-lettere.vocali{grid-template-columns:repeat(5,1fr)}",
      ".ru-btn.lettera{min-height:38px;background:#f8f9fa;color:#14113a;font-size:1.02rem}.ru-btn.lettera:disabled{opacity:.25}",
      ".ru-btn.canc{background:#ffc9c9;color:#c92a2a}",
      ".ru-bot-riga{display:flex;align-items:center;gap:8px;justify-content:center;font-weight:800}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "La Ruota della Fortuna", icona: "🎡",
    descrizione: "Gira la ruota, chiama le consonanti, compra le vocali e indovina la frase! Come in TV: Bancarotta, Passa e Jolly. Da soli contro i bot, in compagnia sullo stesso telefono o online.",
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
      "Online hai 30 secondi per ogni mossa e 60 per risolvere: la barretta sopra i tasti ti dice quanto tempo resta.",
      "Chi risolve si tiene i soldi della manche (almeno " + fmtN(MINIMO_RISOLVI) + "). Vince chi alla fine ne ha di più."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
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
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return ospite(t, t.linkParams.stanza);   // entrato da un invito
      var modo = (t.impostazioni || {}).modo;
      return partita(t, modo === "online" ? "online" : modo === "telefono" ? "telefono" : "bot");
    }
  });

  // per le prove
  window.__RUOTA = { creaPartita: creaPartita, righe: righe, coperta: coperta, solo: solo, decidiBot: decidiBot, letteraBot: letteraBot, SPICCHI: SPICCHI };
})();

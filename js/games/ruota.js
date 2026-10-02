/* =========================================================
   LA RUOTA DELLA FORTUNA — come il quiz della TV.
   Si gira la ruota, si chiama una consonante (lo spicchio vale per ogni lettera trovata),
   si comprano le vocali, si risolve la frase. Bancarotta, Passa e Jolly come in TV.
   Vince chi accumula di più in tutte le manche.
   Modi: contro il computer (tu + bot, il primo è Matt), sullo stesso telefono (da 2 a 4,
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
  var VOCALI = ["A", "E", "I", "O", "U"];
  var CONSONANTI = "BCDFGHJKLMNPQRSTVWXYZ".split("");
  var FREQ_C = "NRTLSCDMPVGBFZHQKJWXY".split("");   // consonanti dalla più frequente in italiano
  var FREQ_V = ["E", "A", "I", "O", "U"];
  var NOMI_BOT = ["Matt", "Rosa", "Peppe", "Gina"];
  var COL = 12, RIGHE = 4;
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

  // =========================================================
  //  MOTORE (uguale contro il computer, sullo stesso telefono e per l'host online)
  // =========================================================
  function creaPartita(giocatori, mancheTot) {
    var P = { giocatori: giocatori.map(function (g) { return { id: g.id, nome: g.nome, bot: !!g.bot, omino: g.omino || null, totale: 0, soldi: 0, jolly: 0, via: false }; }),
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
      P.fase = "gira";
    }
    function perdeTurno(msg) {
      var p = g();
      if (p.jolly > 0) { p.jolly--; P.msg = msg + " Ma c'è il Jolly: tocca ancora a " + p.nome + "!"; P.fase = "gira"; return; }
      P.msg = msg; prossimo();
    }
    P.nuovaManche = function () {
      P.manche++;
      var lista = frasi(), cand = [];
      lista.forEach(function (x, i) { if (!P.usate[i]) cand.push(i); });
      if (!cand.length) { P.usate = {}; cand = lista.map(function (x, i) { return i; }); }
      var i = cand[Math.floor(Math.random() * cand.length)]; P.usate[i] = 1;
      P.frase = String(lista[i].f).toUpperCase(); P.cat = lista[i].c;
      P.rivelate = {}; P.chiamate = {}; P.ultime = []; P.vince = null; P.spicchio = -1;
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
      P.spicchio = i; P.giroN++; P.fase = "girando"; P.ultime = []; P.msg = g().nome + " gira la ruota…";
      return true;
    };
    P.dopoGiro = function () {   // la ruota si è fermata
      if (P.fase !== "girando") return;
      var s = SPICCHI[P.spicchio], p = g();
      if (s.v) { P.fase = "consonante"; P.msg = p.nome + ": " + fmtN(s.v) + " a lettera, scegli una consonante"; }
      else if (s.s === "bancarotta") { p.soldi = 0; P.msg = "💥 Bancarotta! " + p.nome + " perde i soldi della manche."; prossimo(); }
      else if (s.s === "passa") perdeTurno("⏭️ Passa!");
      else { p.jolly++; P.fase = "gira"; P.msg = "🃏 Jolly per " + p.nome + "! Gira ancora."; }
    };
    P.consonante = function (L) {
      if (P.fase !== "consonante" || CONSONANTI.indexOf(L) < 0 || P.chiamate[L]) return false;
      var p = g(), n = occ(L), val = SPICCHI[P.spicchio].v;
      P.chiamate[L] = 1;
      if (n > 0) {
        P.rivelate[L] = 1; P.ultime = [L]; p.soldi += val * n;
        P.msg = p.nome + ": " + (n === 1 ? "c'è una " + L : "ci sono " + n + " " + L) + "! +" + fmtN(val * n);
        if (P.tutteFuori()) return vinceManche(p), true;
        P.fase = "gira";
      } else perdeTurno("Nessuna " + L + ".");
      return true;
    };
    P.compra = function () { if (!P.puo().compra) return false; g().soldi -= COSTO_VOCALE; P.fase = "vocale"; P.msg = g().nome + " compra una vocale…"; return true; };
    P.vocale = function (V) {
      if (P.fase !== "vocale" || VOCALI.indexOf(V) < 0 || P.chiamate[V]) return false;
      var p = g(), n = occ(V);
      P.chiamate[V] = 1;
      if (n > 0) {
        P.rivelate[V] = 1; P.ultime = [V];
        P.msg = p.nome + ": " + (n === 1 ? "c'è una " + V : "ci sono " + n + " " + V) + "!";
        if (P.tutteFuori()) return vinceManche(p), true;
        P.fase = "gira";
      } else perdeTurno("Nessuna " + V + ".");
      return true;
    };
    P.risolvi = function () { if (!P.puo().risolvi) return false; P.fase = "risolvi"; P.msg = g().nome + " prova a risolvere…"; return true; };
    P.soluzione = function (testo) {
      if (P.fase !== "risolvi") return false;
      if (solo(testo) === solo(P.frase)) vinceManche(g());
      else { P.msg = "❌ " + g().nome + " sbaglia la soluzione."; prossimo(); }
      return true;
    };
    P.rinuncia = function () {   // tempo scaduto o annulla: perde il turno
      if (["gira", "consonante", "vocale", "risolvi"].indexOf(P.fase) < 0) return false;
      P.msg = "⏰ " + g().nome + " perde il turno."; prossimo(); return true;
    };
    function vinceManche(p) {
      CONSONANTI.concat(VOCALI).forEach(function (L) { P.rivelate[L] = 1; });
      var vincita = Math.max(p.soldi, MINIMO_RISOLVI);
      p.totale += vincita;
      P.giocatori.forEach(function (x) { if (x !== p) x.soldi = 0; });
      p.soldi = vincita;
      P.vince = { id: p.id, vincita: vincita, frase: P.frase };
      P.fase = "finemanche"; P.msg = "🎉 " + p.nome + " risolve! +" + fmtN(vincita);
    }
    P.dopoManche = function () {
      if (P.fase !== "finemanche") return;
      if (P.manche >= P.mancheTot) {
        var ord = P.giocatori.slice().sort(function (a, b) { return b.totale - a.totale; });
        P.classifica = ord.map(function (x) { return { id: x.id, nome: x.nome, punti: x.totale, pos: 1 + ord.filter(function (q) { return q.totale > x.totale; }).length }; });
        P.fase = "fine"; P.msg = "";
      } else P.nuovaManche();
    };
    P.esce = function (id) {
      P.giocatori.forEach(function (x, i) {
        if (x.id !== id || x.via) return;
        x.via = true;
        if (i === P.turno && ["gira", "consonante", "vocale", "risolvi"].indexOf(P.fase) >= 0) { P.msg = x.nome + " è uscito."; prossimo(); }
      });
    };
    // la foto: MAI la frase vera (solo coperta), finché non è risolta
    P.vista = function () {
      var tp = P.giocatori[P.turno];
      return { fase: P.fase, manche: P.manche, mancheTot: P.mancheTot, cat: P.cat, tab: P.fase === "finemanche" || P.fase === "fine" ? P.frase : coperta(P.frase, P.rivelate),
        chiamate: Object.keys(P.chiamate), ultime: P.ultime.slice(), turno: tp ? tp.id : null, spicchio: P.spicchio, angolo: P.angolo, giroN: P.giroN, msg: P.msg,
        puo: tp ? P.puo() : null, cons: P.consonantiNascoste(), voc: P.vocaliNascoste(), vince: P.vince, classifica: P.classifica,
        giocatori: P.giocatori.filter(function (x) { return !x.via; }).map(function (x) { return { id: x.id, nome: x.nome, bot: x.bot, totale: x.totale, soldi: x.soldi, jolly: x.jolly }; }) };
    };
    return P;
  }

  // =========================================================
  //  BOT
  // =========================================================
  function decidiBot(P, liv) {
    var p = P.giocatori[P.turno], puo = P.puo();
    var tot = solo(P.frase).length, noti = solo(coperta(P.frase, P.rivelate).replace(/_/g, "")).length, quota = tot ? noti / tot : 0;
    var soglia = { facile: 0.85, medio: 0.72, difficile: 0.58 }[liv] || 0.72;
    if (quota >= soglia || (!puo.gira && !puo.compra)) return { a: "risolvi", giusta: Math.random() < (liv === "facile" ? 0.75 : liv === "difficile" ? 0.98 : 0.9) };
    if (puo.compra && (!puo.gira || (p.soldi >= 1500 && Math.random() < 0.35))) return { a: "compra" };
    if (puo.gira) return { a: "gira" };
    return { a: "risolvi", giusta: Math.random() < 0.6 };
  }
  // la lettera: i bot bravi "sentono" quelle che ci sono, quelli facili vanno più a caso
  function letteraBot(P, liv, lista, freq) {
    var libere = freq.filter(function (L) { return lista.indexOf(L) >= 0 && !P.chiamate[L]; });
    if (!libere.length) return null;
    var buone = libere.filter(function (L) { return P.occ(L) > 0; });
    var fiuto = { facile: 0.35, medio: 0.6, difficile: 0.85 }[liv] || 0.6;
    if (buone.length && Math.random() < fiuto) return buone[0];
    if (liv === "facile") return libere[Math.floor(Math.random() * Math.min(libere.length, 8))];
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
  function suonoLettera(n) { for (var k = 0; k < Math.min(n, 6); k++) bip(1046, 0.18, "triangle", 0.08, k * 0.16); }
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
    var H = { fase: online ? "lobby" : "gioco", codice: "…", pronta: !online, omini: {} };
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

    function ferma() { clearTimeout(tBot); clearTimeout(tTempo); tBot = tTempo = null; }
    function vm() {
      if (H.fase !== "gioco" && H.fase !== "fine") return { fase: H.fase, codice: H.codice, pronta: H.pronta, mancheTot: mancheTot,
        giocatori: posti.map(function (p) { return { id: p.id, nome: p.nome, bot: !!p.bot }; }) };
      var v = P.vista(); v.fase = H.fase === "fine" ? "fine" : v.fase; v.codice = H.codice; v.giocoFase = H.fase; v.sigla = !!H.sigla; return v;
    }
    function bd() { var v = vm(); if (rete) rete.invia({ t: "vm", vm: v }); disegna(t, v, cb); }
    // il giro: bot, la ruota che si ferma, fine manche, tempo per decidere (online)
    function ciclo() {
      ferma();
      if (H.fase !== "gioco" || !P || H.sigla) return;
      if (P.fase === "girando") { tFase = setTimeout(function () { P.dopoGiro(); dopo(); }, T_GIRO); return; }
      if (P.fase === "finemanche") { tFase = setTimeout(function () { P.dopoManche(); if (P.fase === "fine") finePartita(); else dopo(); }, 4500); return; }
      if (P.fase === "fine") return;
      var p = P.giocatori[P.turno];
      var nuovo = H.ultimoTurno !== P.turno + ":" + P.manche; H.ultimoTurno = P.turno + ":" + P.manche;
      // il bot aspetta un po' di più a inizio turno: prima la telecamera arriva al suo leggio
      if (p.bot) { tBot = setTimeout(mossaBot, (P.fase === "risolvi" ? 1800 : 1100 + Math.random() * 700) + (nuovo ? 1700 : 0)); return; }
      if (online && !(modo === "telefono")) tTempo = setTimeout(function () { if (P.rinuncia()) dopo(); }, P.fase === "risolvi" ? T_RISOLVI : T_MOSSA);
    }
    function dopo() { bd(); ciclo(); }
    function mossaBot() {
      var p = P.giocatori[P.turno]; if (!p || !p.bot) return;
      if (P.fase === "gira") {
        var d = decidiBot(P, liv);
        if (d.a === "gira") P.gira();
        else if (d.a === "compra") P.compra();
        else { P.risolvi(); p._giusta = d.giusta; }
      } else if (P.fase === "consonante") { var L = letteraBot(P, liv, CONSONANTI, FREQ_C); if (L) P.consonante(L); else P.rinuncia(); }
      else if (P.fase === "vocale") { var V = letteraBot(P, liv, VOCALI, FREQ_V); if (V) P.vocale(V); else P.rinuncia(); }
      else if (P.fase === "risolvi") P.soluzione(p._giusta ? P.frase : "SBAGLIATA");
      dopo();   // (i suoni li fa il disegno, uguale su tutti i telefoni)
    }
    function finePartita() {
      H.fase = "fine"; bd();
      if (t.risultato && P.classifica) t.risultato(P.classifica.filter(function (r) { var x = posti.filter(function (p) { return p.id === r.id; })[0]; return x && !x.bot; }).map(function (r) { return { nome: r.nome, pos: r.pos }; }));
    }
    function comincia() {
      if (posti.length < 2) return;
      P = creaPartita(posti, mancheTot); P.nuovaManche(); H.fase = "gioco"; H.ultimoTurno = null;
      // prima la sigla dello studio (presenta i concorrenti), poi si gioca
      H.sigla = true; bd();
      clearTimeout(tFase); tFase = setTimeout(function () { H.sigla = false; dopo(); }, window.SGStudio ? SGStudio.durataApertura(posti.length) : 0);
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
      else if (a === "annulla") ok = P.fase === "risolvi" && P.rinuncia();
      if (ok) dopo();
    }
    var cb = { sonoHost: true, online: online, telefono: modo === "telefono", myId: "host",
      omini: function () { return H.omini; },
      onAzione: function (a, x) { azione("host", a, x); },
      onComincia: comincia,
      onBot: function (piu) { if (H.fase !== "lobby") return; if (piu && posti.length < MAX) aggiungiBot(); else if (!piu) { for (var i = posti.length - 1; i > 0; i--) if (posti[i].bot) { posti.splice(i, 1); break; } } bd(); },
      onNuova: function () {
        clearTimeout(tFase); ferma();
        if (online) { posti = posti.filter(function (p) { return !P || !P.giocatori.some(function (g) { return g.id === p.id && g.via; }); }); H.fase = "lobby"; P = null; bd(); }
        else { P = null; comincia(); }
      },
      onEsci: function (gia) {   // gia = l'ha già confermato il tasto ‹ dello studio
        if (H.fase === "gioco" && !gia && !window.confirm(online ? "Chiudere la partita per tutti?" : "Uscire dalla partita?")) return;
        clearTimeout(tFase); ferma(); if (rete) rete.chiudi(); t.esci();
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
    var S = { rete: null, myId: null, nome: "", vm: null, omini: {} };
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
    function collega() {
      var s = t.schermata({ icona: "🎡", titolo: "Entro nella partita…", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
      t.mostra(s);
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino ? t.mioOmino(S.nome) : null }); },
        onMsg: function (m) {
          if (!m || !m.t) return;
          if (m.to && m.to !== S.myId) return;
          if (m.t === "vm") { S.vm = m.vm; disegna(t, m.vm, cb); }
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
    if (cb.sonoHost) {
      var nb = vm.giocatori.filter(function (p) { return p.bot; }).length;
      extra.push(el("div", { class: "ru-bot-riga" }, [
        el("span", { text: "🤖 Bot alla ruota: " + nb }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "−", disabled: nb ? null : "disabled", onclick: function () { cb.onBot(false); } }),
        el("button", { class: "btn btn-fantasma btn-piccolo", text: "+", disabled: vm.giocatori.length < MAX ? null : "disabled", onclick: function () { cb.onBot(true); } }) ]));
    }
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, puoiDaSolo: vm.giocatori.length >= 2, vuoti: Math.max(0, 2 - vm.giocatori.length),
      giocatori: vm.giocatori.map(function (p) { return { id: p.id, nome: p.nome, omino: (cb.omini() || {})[p.id] || (p.bot && window.SGOmino ? SGOmino.casuale(p.nome) : null), host: p.id === "host", tu: p.id === cb.myId, bot: p.bot }; }),
      extra: extra, attesa: "Aspetta che l'host cominci: si gira la ruota! 🎡", onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function creaStudioRuota(t, vm, cb) {
    stile();
    var el = t.el, ids = vm.giocatori.map(function (p) { return p.id; });
    var ui = { t: t, el: el, cb: cb, vm: vm, ids: ids, kTab: "", kTast: "", giroN: -1, scritto: [], prec: null, mostrati: {}, inq: "", barraH: -1, timer: [] };
    ui.S = ST.crea(t, vm.giocatori.map(function (p) { return { nome: p.nome, omino: (cb.omini() || {})[p.id] || (window.SGOmino ? SGOmino.casuale(p.nome) : null) }; }),
      { io: cb.telefono ? -1 : ids.indexOf(cb.myId), esci: function () { fermaRegia(ui); ui.cb.onEsci(true); }, titolo: "La Ruota della Fortuna", logo: ["LA RUOTA", "DELLA FORTUNA"] });
    var S = ui.S;
    S.sopraLibero = 0.6;   // la telecamera può salire sopra lo studio: lassù c'è il tabellone
    S.vista.classList.add("ru-studio");
    // in alto, fisso: categoria, tabellone, cosa succede
    ui.cat = el("div", { class: "ru-cat" });
    ui.tab = el("div", { class: "ru-tab" }); ui.celle = [];
    for (var r = 0; r < RIGHE; r++) for (var c = 0; c < COL; c++) { var d = el("div", { class: "ru-cella vuota" }); ui.celle.push(d); ui.tab.appendChild(d); }
    ui.msg = el("div", { class: "ru-msg" });
    ui.sopra = el("div", { class: "ru-sopra" }, [ ui.cat, ui.tab, ui.msg ]);
    S.vista.appendChild(ui.sopra);
    // la ruota (va sul maxischermo) e i tasti (nella barra in basso)
    ui.canvas = el("canvas", { class: "ru-disco", width: "440", height: "440" });
    disegnaRuota(ui.canvas);
    ui.ruota = el("div", { class: "ru-ruota-sch" }, [ ui.canvas,
      el("div", { class: "ru-freccia", html: "<svg viewBox='0 0 10 10'><polygon points='0,0 10,0 5,10' fill='#ffd43b' stroke='#a85c00' stroke-width='.6'/></svg>" }),
      el("div", { class: "ru-centro" }) ]);
    ui.azioni = el("div", { class: "ru-azioni" });
    vm.giocatori.forEach(function (p, i) { ST.puntiLeggio(S, i, p.soldi); ui.mostrati[p.id] = p.soldi; });
    function via() { ST.vuota(S.sch); S.sch.appendChild(ui.ruota); ST.barra(S, [ ui.azioni ]); ui.sopra.classList.remove("via"); }
    if (vm.sigla) {   // a inizio partita la sigla dello studio (il tabellone compare dopo)
      ui.sigla = true; ui.sopra.classList.add("via");
      Promise.resolve(ST.apertura(S)).catch(function () {}).then(function () {
        ui.sigla = false;
        if (!S.vivo() || R !== ui || ui.finita) return;
        via(); aggiorna(ui, ui.vm);
      });
    } else via();
    return ui;
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
    if (!inRisolvi) ui.scritto = [];
    ui.cat.textContent = (vm.cat || "") + "  ·  manche " + vm.manche + "/" + vm.mancheTot;
    // ---- tabellone: 4 righe da 12, la frase al centro ----
    var kt = vm.tab + "|" + (inRisolvi ? ui.scritto.join("") : "") + "|" + vm.ultime.join("");
    if (kt !== ui.kTab) {
      var primaVolta = !ui.kTab; ui.kTab = kt;
      var rr = righe(vm.tab), su = Math.floor((RIGHE - Math.min(RIGHE, rr.length)) / 2), buco = 0;
      ui.celle.forEach(function (d) { if (d.className !== "ru-cella vuota") d.className = "ru-cella vuota"; if (d.textContent) d.textContent = ""; });
      rr.slice(0, RIGHE).forEach(function (riga, r) {
        var x0 = Math.floor((COL - riga.length) / 2);
        riga.split("").forEach(function (ch, k) {
          var d = ui.celle[(su + r) * COL + x0 + k]; if (!d || ch === " ") return;
          if (ch === "_") {
            var sc = inRisolvi && ui.scritto[buco];
            d.className = "ru-cella " + (sc ? "scritta" : "coperta"); d.textContent = sc || ""; buco++;
          } else { d.className = "ru-cella" + (!primaVolta && vm.ultime.indexOf(base(ch)) >= 0 ? " nuova" : ""); d.textContent = ch; }
        });
      });
    }
    ui.msg.textContent = vm.msg || "";
    // ---- i leggii: i soldi della manche (a fine manche il totale di tutta la partita), chi è uscito ----
    var fineM = vm.fase === "finemanche";
    ui.ids.forEach(function (id, i) {
      var p = trovaG(vm, id);
      if (!p) { ST.fuori(S, i, true); return; }
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
  function disegnaAzioni(ui, vm, mioTurno) {
    var cb = ui.cb, el = ui.el;
    var chiave = [vm.fase, vm.turno, vm.chiamate.join(""), mioTurno, JSON.stringify(vm.puo), vm.fase === "risolvi" ? ui.scritto.join("") : ""].join("|");
    if (chiave === ui.kTast) return;
    ui.kTast = chiave; svuota(ui.azioni);
    function stato(txt, cls) { ui.azioni.appendChild(el("div", { class: "ru-stato" + (cls ? " " + cls : ""), text: txt })); }
    function btn(cls, txt, fn, off) { var b = el("button", { class: "ru-btn " + cls, text: txt, onclick: fn }); if (off) b.disabled = true; return b; }
    function riscrivi() { ui.kTab = ""; aggiorna(ui, ui.vm); }
    if (vm.fase === "girando") return stato("🎡 La ruota gira…");
    if (vm.fase === "finemanche") return stato(vm.manche >= vm.mancheTot ? "Ultima manche finita!" : "Tra poco la manche " + (vm.manche + 1) + "… (sui leggii i totali)");
    if (!mioTurno) return stato("Tocca a " + nomeDi(vm, cb, vm.turno) + "…");
    var chi = cb.telefono ? nomeDi(vm, cb, vm.turno) + ", " : "";
    if (vm.fase === "gira") {
      stato(chi ? chi + "tocca a te!" : "Tocca a te!", "piccolo");
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
      var buchi = (vm.tab.match(/_/g) || []).length, pieni = ui.scritto.length;
      stato(chi + "scrivi le lettere che mancano (" + pieni + " di " + buchi + ")", "piccolo");
      var tast = el("div", { class: "ru-lettere" });
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").forEach(function (L) {
        tast.appendChild(btn("lettera", L, function () { if (ui.scritto.length < buchi) { ui.scritto.push(L); riscrivi(); } }));
      });
      tast.appendChild(btn("lettera canc", "⌫", function () { ui.scritto.pop(); riscrivi(); }));
      ui.azioni.appendChild(tast);
      ui.azioni.appendChild(el("div", { class: "ru-riga" }, [
        btn("annulla", "Rinuncio", function () { ui.scritto = []; cb.onAzione("annulla"); }),
        btn("gira", "✓ Risolvi", function () {
          var k = 0, testo = vm.tab.replace(/_/g, function () { return ui.scritto[k++] || "?"; });
          ui.scritto = []; cb.onAzione("soluzione", testo);
        }, pieni < buchi) ]));
    }
  }
  function finale(t, vm, cb) {
    var s = t.schermata({ icona: "🏆", titolo: "Classifica finale", sotto: "La Ruota della Fortuna" });
    var ol = t.el("ol", { class: "classifica" }), med = ["🥇", "🥈", "🥉"];
    (vm.classifica || []).forEach(function (r) {
      ol.appendChild(t.el("li", { class: r.pos === 1 ? "vincitore" : "" }, [
        t.el("span", { class: "pos", text: med[r.pos - 1] || (r.pos + "°") }),
        t.el("span", { class: "nome", text: r.id === cb.myId && !cb.telefono ? r.nome + " (tu)" : r.nome }),
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
      ".ru-cella.nuova{animation:ruNuova .9s ease-out}",
      "@keyframes ruNuova{0%{background:#4dabf7;transform:scale(1.15)}100%{background:#fff;transform:none}}",
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
      { modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Tu contro i bot, come in TV (il primo è Matt)" },
      { modo: "telefono", icona: "📱", nome: "Sullo stesso telefono", sotto: "Da 2 a 4, tutti davanti allo stesso schermo", amici: true }
    ],
    regole: [
      "Si indovina una <b>frase nascosta</b>: si sa solo la categoria.",
      "Nel tuo turno <b>giri la ruota</b> e chiami una <b>consonante</b>: guadagni quello che dice lo spicchio per ogni lettera che c'è. Se la lettera non c'è, il turno passa.",
      "<b>Bancarotta</b>: perdi i soldi della manche. <b>Passa</b>: perdi il turno. <b>Jolly</b>: lo tieni, e la prossima volta che perderesti il turno ti salva.",
      "Con almeno " + COSTO_VOCALE + " puoi <b>comprare una vocale</b>. Quando pensi di saperla, <b>risolvi</b>: scrivi le lettere che mancano.",
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

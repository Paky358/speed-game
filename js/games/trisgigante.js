/* =========================================================
   GIOCO — "Tris Gigante" (Ultimate Tic-Tac-Toe)
   Un tris grande fatto di 9 tris piccoli (i "campi"): 81 caselle, in due, X e O.
   Due modalità (⚙️ regole):
     • 🧠 Classica: la casella in cui giochi decide il campo dell'altro
       (campo già vinto o pieno = l'altro gioca dove vuole).
     • 🎲 Campo a caso: dopo ogni mossa il gioco sceglie a caso il campo dell'altro,
       tra quelli ancora aperti (una luce passa sui campi e si ferma; online la decide
       chi tiene la partita e la luce fa la stessa strada su tutti i telefoni).
   Chi fa tris in un campo lo vince; vince chi fa tris di campi, se no chi ha più campi
   (a pari campi è pareggio).
   Modi: contro il Bot (Facile / Medio / Difficile), in due sullo stesso telefono
   (con più amici: chi vince resta) e online (l'host è X, l'altro è O, gli altri guardano).
   La struttura dei modi (online, chi guarda, torneo a eliminazione, ripresa) è la stessa
   del Tris (js/games/tris.js), già provata.
   ========================================================= */
(function () {
  "use strict";

  var ID = "trisgigante";
  var LINEE = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  // X azzurro e O ambra: la coppia che si distingue meglio anche per chi vede male i colori
  // (e comunque la forma è diversa: croce e cerchio). Niente lampone (è il colore guida dell'app).
  var CX = "#52b6ff", CO = "#ffb340";
  function col(s) { return s === "X" ? CX : CO; }
  function altro(s) { return s === "X" ? "O" : "X"; }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  function aCaso(l) { return l[Math.floor(Math.random() * l.length)]; }
  function ora() { return (window.performance && performance.now) ? performance.now() : Date.now(); }
  function vibra(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }
  var LIVELLI = { facile: "Facile", medio: "Medio", difficile: "Difficile" };
  function livOk(l) { return l === "facile" || l === "difficile" ? l : (l === "impossibile" ? "difficile" : "medio"); }
  function botDi(imp, liv, escludi) {
    if (imp && imp.bot && imp.bot.nome) return imp.bot;
    var b = SG.bot && SG.bot.prendi ? SG.bot.prendi(1, { livello: liv, escludi: escludi })[0] : null;
    return b || { nome: "Bot", omino: null, bot: true };
  }

  // =========================================================
  //  LE REGOLE (uguali in tutti i modi)
  //  st = { c:[81] null|"X"|"O", v:[9] null|"X"|"O"|"=", campo: -1 (dove vuoi) | 0..8, turno, ultima, manda,
  //         fine: null | { vincitore, linea, campi:{X,O}, conti }, mosse:{X,O}, k (mosse fatte), modalita }
  //  casella i = campo b * 9 + posto k (0 in alto a sinistra … 8 in basso a destra)
  // =========================================================
  function nuovaPartita(primo, modalita) {
    var c = [], v = [];
    for (var i = 0; i < 81; i++) c.push(null);
    for (var b = 0; b < 9; b++) v.push(null);
    return { c: c, v: v, campo: -1, turno: primo || "X", ultima: -1, manda: -1, fine: null, mosse: { X: 0, O: 0 }, k: 0, modalita: modalita === "caso" ? "caso" : "classica" };
  }
  function trisIn(get, p) {
    for (var j = 0; j < 8; j++) { var l = LINEE[j]; if (get(l[0]) === p && get(l[1]) === p && get(l[2]) === p) return l; }
    return null;
  }
  function aperti(st) { var o = []; for (var b = 0; b < 9; b++) if (!st.v[b]) o.push(b); return o; }
  function contaCampi(v) { var x = 0, o = 0; for (var b = 0; b < 9; b++) { if (v[b] === "X") x++; else if (v[b] === "O") o++; } return { X: x, O: o }; }
  function lecita(st, i) {
    if (st.fine || typeof i !== "number" || (i | 0) !== i || i < 0 || i > 80 || st.c[i]) return false;
    var b = (i / 9) | 0;
    return !st.v[b] && (st.campo < 0 || st.campo === b);
  }
  function legali(st) {
    var o = []; if (st.fine) return o;
    for (var b = 0; b < 9; b++) if (!st.v[b] && (st.campo < 0 || st.campo === b)) for (var k = 0; k < 9; k++) if (!st.c[b * 9 + k]) o.push(b * 9 + k);
    return o;
  }
  // mette il segno di chi è di turno; sorte(n) = un numero da 0 a n-1 (il campo a caso: lo decide chi tiene la partita)
  function metti(st, i, sorte) {
    if (!lecita(st, i)) return false;
    var p = st.turno, b = (i / 9) | 0, k = i % 9;
    st.c[i] = p; st.mosse[p]++; st.k++; st.ultima = i;
    if (trisIn(function (j) { return st.c[b * 9 + j]; }, p)) st.v[b] = p;
    else { var pieno = true; for (var j = 0; j < 9; j++) if (!st.c[b * 9 + j]) { pieno = false; break; } if (pieno) st.v[b] = "="; }
    var lg = trisIn(function (j) { return st.v[j]; }, p);
    if (lg) { st.fine = { vincitore: p, linea: lg, campi: contaCampi(st.v), conti: false }; st.campo = -1; st.manda = -1; return true; }
    var ap = aperti(st);
    if (!ap.length) {   // nessun tris di campi: vince chi ne ha di più (a pari, pareggio)
      var cc = contaCampi(st.v);
      st.fine = { vincitore: cc.X > cc.O ? "X" : (cc.O > cc.X ? "O" : null), linea: null, campi: cc, conti: true };
      st.campo = -1; st.manda = -1; return true;
    }
    if (st.modalita === "caso") {
      var n = sorte ? sorte(ap.length) : Math.floor(Math.random() * ap.length);
      st.campo = ap[Math.max(0, Math.min(ap.length - 1, n | 0))]; st.manda = st.campo;
    } else { st.manda = k; st.campo = st.v[k] ? -1 : k; }
    st.turno = altro(p);
    return true;
  }
  function copiaPartita(st) {
    return { c: st.c.slice(), v: st.v.slice(), campo: st.campo, turno: st.turno, ultima: st.ultima, manda: st.manda, fine: st.fine, mosse: { X: st.mosse.X, O: st.mosse.O }, k: st.k, modalita: st.modalita };
  }
  // chi comincia la prossima: "turno" = a turno, "perso" = chi ha appena perso, "caso" = a sorte
  function scegliPrimo(regola, primoPrima, fine) {
    if (regola === "caso") return Math.random() < 0.5 ? "X" : "O";
    if (regola === "perso" && fine && fine.vincitore) return altro(fine.vincitore);
    return altro(primoPrima || "O");
  }
  // la foto della partita: le caselle e i campi in due righe di testo ("." = vuoto)
  function righe(st) {
    var c = "", v = "";
    for (var i = 0; i < 81; i++) c += st.c[i] || ".";
    for (var b = 0; b < 9; b++) v += st.v[b] || ".";
    return { c: c, v: v };
  }
  function partitaVm(st) {
    var r = righe(st);
    return { c: r.c, v: r.v, campo: st.campo, turno: st.turno, ultima: st.ultima, manda: st.manda, fine: st.fine, mosse: st.mosse, k: st.k, modalita: st.modalita };
  }

  // =========================================================
  //  IL BOT: ricerca ad albero con partite simulate (Monte Carlo), sulle caselle in bit (veloce).
  //  Facile: prende i tris quando li vede (non sempre), per il resto a caso.
  //  Medio: poche centinaia di partite simulate. Difficile: tutto il tempo che ha (al massimo ~0,4 s).
  //  Si pensa a pezzetti (10 ms alla volta): la pagina non si blocca mai.
  // =========================================================
  var WIN = new Uint8Array(512), POP = new Uint8Array(512), BITS = [];
  (function () {
    var LM = LINEE.map(function (l) { return (1 << l[0]) | (1 << l[1]) | (1 << l[2]); });
    for (var m = 0; m < 512; m++) {
      var lst = [];
      for (var k = 0; k < 9; k++) if (m & (1 << k)) lst.push(k);
      BITS.push(lst); POP[m] = lst.length;
      for (var j = 0; j < 8; j++) if ((m & LM[j]) === LM[j]) { WIN[m] = 1; break; }
    }
  })();
  // S = { x[9], o[9] (bit delle caselle), bx, bo (campi vinti), ch (campi chiusi), campo, tu (1 = X, 2 = O), fin (0, 1, 2, 3 = pari), caso }
  function simNuova() { return { x: new Int32Array(9), o: new Int32Array(9), bx: 0, bo: 0, ch: 0, campo: -1, tu: 1, fin: 0, caso: false }; }
  function simDa(st) {
    var S = simNuova();
    for (var i = 0; i < 81; i++) { var b = (i / 9) | 0, k = i % 9; if (st.c[i] === "X") S.x[b] |= 1 << k; else if (st.c[i] === "O") S.o[b] |= 1 << k; }
    for (var b2 = 0; b2 < 9; b2++) { if (st.v[b2]) S.ch |= 1 << b2; if (st.v[b2] === "X") S.bx |= 1 << b2; else if (st.v[b2] === "O") S.bo |= 1 << b2; }
    S.campo = st.campo; S.tu = st.turno === "X" ? 1 : 2; S.caso = st.modalita === "caso";
    S.fin = st.fine ? (st.fine.vincitore === "X" ? 1 : st.fine.vincitore === "O" ? 2 : 3) : 0;
    return S;
  }
  function simCopia(D, S) {
    for (var b = 0; b < 9; b++) { D.x[b] = S.x[b]; D.o[b] = S.o[b]; }
    D.bx = S.bx; D.bo = S.bo; D.ch = S.ch; D.campo = S.campo; D.tu = S.tu; D.fin = S.fin; D.caso = S.caso;
  }
  function simMetti(S, m) {
    var b = (m / 9) | 0, k = m - b * 9, bb = 1 << b;
    if (S.tu === 1) {
      var xm = (S.x[b] |= 1 << k);
      if (WIN[xm]) { S.bx |= bb; S.ch |= bb; if (WIN[S.bx]) { S.fin = 1; return; } }
      else if ((xm | S.o[b]) === 511) S.ch |= bb;
    } else {
      var om = (S.o[b] |= 1 << k);
      if (WIN[om]) { S.bo |= bb; S.ch |= bb; if (WIN[S.bo]) { S.fin = 2; return; } }
      else if ((om | S.x[b]) === 511) S.ch |= bb;
    }
    if (S.ch === 511) { var a = POP[S.bx], c = POP[S.bo]; S.fin = a > c ? 1 : (c > a ? 2 : 3); return; }
    if (S.caso) { var ap = BITS[511 & ~S.ch]; S.campo = ap[(Math.random() * ap.length) | 0]; }
    else S.campo = (S.ch >> k) & 1 ? -1 : k;
    S.tu = 3 - S.tu;
  }
  function simLegali(S) {
    var o = [];
    if (S.campo >= 0) { var f = BITS[511 & ~(S.x[S.campo] | S.o[S.campo])]; for (var j = 0; j < f.length; j++) o.push(S.campo * 9 + f[j]); return o; }
    for (var b = 0; b < 9; b++) if (!((S.ch >> b) & 1)) { var g = BITS[511 & ~(S.x[b] | S.o[b])]; for (var q = 0; q < g.length; q++) o.push(b * 9 + g[q]); }
    return o;
  }
  function simCaso(S) {
    if (S.campo >= 0) { var f = BITS[511 & ~(S.x[S.campo] | S.o[S.campo])]; return S.campo * 9 + f[(Math.random() * f.length) | 0]; }
    var tot = 0, b;
    for (b = 0; b < 9; b++) if (!((S.ch >> b) & 1)) tot += POP[511 & ~(S.x[b] | S.o[b])];
    var r = (Math.random() * tot) | 0;
    for (b = 0; b < 9; b++) if (!((S.ch >> b) & 1)) { var lib = 511 & ~(S.x[b] | S.o[b]), n = POP[lib]; if (r < n) return b * 9 + BITS[lib][r]; r -= n; }
    return -1;
  }
  // la mossa m fa vincere subito la partita a chi è di turno?
  function simVince(S, m, T) { simCopia(T, S); var tu = T.tu; simMetti(T, m); return T.fin === tu; }
  function Punto() { this.f = []; this.d = null; this.n = 0; }
  function Ramo(m, chi) { this.m = m; this.chi = chi; this.n = 0; this.w = 0; this.dopo = null; }
  var UCT = 1.1;
  function Ricerca(st) { this.base = simDa(st); this.S = simNuova(); this.rad = new Punto(); this.it = 0; this.via = []; this.punti = []; }
  Ricerca.prototype.passo = function () {
    var S = this.S, P = this.rad, via = this.via, punti = this.punti, r, j;
    simCopia(S, this.base); via.length = 0; punti.length = 0; punti.push(P);
    while (!S.fin) {
      if (P.d === null) { P.d = simLegali(S); for (j = P.d.length - 1; j > 0; j--) { var q = (Math.random() * (j + 1)) | 0, tmp = P.d[j]; P.d[j] = P.d[q]; P.d[q] = tmp; } }
      if (P.d.length) { r = new Ramo(P.d.pop(), S.tu); P.f.push(r); simMetti(S, r.m); via.push(r); break; }
      var best = null, bv = -1, ln = Math.log(P.n + 1);
      for (j = 0; j < P.f.length; j++) { var x = P.f[j], u = x.w / x.n + UCT * Math.sqrt(ln / x.n); if (u > bv) { bv = u; best = x; } }
      if (!best) break;
      simMetti(S, best.m); via.push(best);
      if (S.fin) break;
      if (S.caso) { if (!best.dopo) best.dopo = []; P = best.dopo[S.campo] || (best.dopo[S.campo] = new Punto()); }
      else P = best.dopo || (best.dopo = new Punto());
      punti.push(P);
    }
    while (!S.fin) simMetti(S, simCaso(S));
    var w = S.fin;
    for (j = 0; j < via.length; j++) { r = via[j]; r.n++; r.w += w === r.chi ? 1 : (w === 3 ? 0.5 : 0); }
    for (j = 0; j < punti.length; j++) punti[j].n++;
    this.it++;
  };
  Ricerca.prototype.scegli = function () {
    var f = this.rad.f, best = null;
    for (var j = 0; j < f.length; j++) if (!best || f[j].n > best.n || (f[j].n === best.n && f[j].w > best.w)) best = f[j];
    return best ? best.m : null;
  };
  // le mosse "ovvie" che non serve pensare: una sola possibile, o una che vince subito la partita
  function ovvia(st) {
    var L = legali(st); if (!L.length) return null;
    if (L.length === 1) return L[0];
    var S = simDa(st), T = simNuova();
    for (var j = 0; j < L.length; j++) if (simVince(S, L[j], T)) return L[j];
    return null;
  }
  function vinceCampo(st, i) { var b = (i / 9) | 0, p = st.turno; return !!trisIn(function (j) { return b * 9 + j === i ? p : st.c[b * 9 + j]; }, p); }
  function mossaFacile(st) {
    var L = legali(st); if (!L.length) return null;
    var S = simDa(st), T = simNuova();
    var vinci = L.filter(function (i) { return simVince(S, i, T); });
    if (vinci.length && Math.random() < 0.8) return aCaso(vinci);
    var campo = L.filter(function (i) { return vinceCampo(st, i); });
    if (campo.length && Math.random() < 0.5) return aCaso(campo);
    return aCaso(L);
  }
  var PENSA = { medio: { ms: 120, max: 220 }, difficile: { ms: 400, max: 400000 } };
  // pensa a pezzetti e alla fine chiama fatto(mossa, giri). Torna { ferma() }
  function pensa(st, liv, fatto) {
    var fermo = false, h = { ferma: function () { fermo = true; } };
    liv = livOk(liv);
    var subito = liv === "facile" ? mossaFacile(st) : ovvia(st);
    if (subito != null) { setTimeout(function () { if (!fermo) fatto(subito, 0); }, 0); return h; }
    var R = new Ricerca(st), P = PENSA[liv], t0 = ora();
    (function giro() {
      if (fermo) return;
      var t1 = ora();
      do { for (var j = 0; j < 24 && R.it < P.max; j++) R.passo(); } while (R.it < P.max && ora() - t1 < 10);
      if (R.it >= P.max || ora() - t0 >= P.ms) { var m = R.scegli(); if (m == null) m = aCaso(legali(st)); return fatto(m, R.it); }
      setTimeout(giro, 0);
    })();
    return h;
  }
  // per le prove (Node e browser): lo stesso motore, senza grafica
  function pensaSubito(st, liv, giri) {
    liv = livOk(liv);
    var s = liv === "facile" ? mossaFacile(st) : ovvia(st); if (s != null) return s;
    var R = new Ricerca(st), n = giri || PENSA[liv].max; while (R.it < n) R.passo();
    return R.scegli();
  }
  window.SG_TRISG = { nuovaPartita: nuovaPartita, metti: metti, legali: legali, copia: copiaPartita, pensa: pensa, pensaSubito: pensaSubito, PENSA: PENSA };

  // le battute del Bot (nella nuvoletta sopra il suo avatar)
  var BATTUTE = {
    inizio: ["81 caselle, un vincitore: io 😎", "Scaldo i circuiti… 🔌", "Nove tris in uno? Facile.", "Ti mando dove dico io 😏", "Ho fatto stretching ai bit."],
    campo: ["Questo campo è mio!", "Preso! 🤖", "E questo lo coloro io.", "Uno in più per me 😏", "Campo conquistato."],
    perdeCampo: ["Va bene, te lo lascio. Per ora.", "Hmm… non l'avevo visto.", "Bel colpo, lo ammetto.", "Me lo riprendo in un altro."],
    vince: ["Tris Gigante! 🤖🏆", "Calcolato al millimetro.", "Rivincita? Tanto vinco ancora.", "Bip bop: ho vinto!", "Grazie per la partita 😇"],
    perde: ["Non è possibile… 😵", "Mi si è impallato il cervello 🥴", "Chiedo la rivincita!", "Hai avuto fortuna!", "Va bene, sei più bravo tu. Per ora."],
    pari: ["Pari! Ci conosciamo troppo bene.", "Muro contro muro!", "Nessuno passa, nessuno vince 🤝", "Pari e patta, la prossima è mia."]
  };
  var ultimaBattuta = "";
  function battuta(tipo) {
    var l = (BATTUTE[tipo] || []).filter(function (x) { return x !== ultimaBattuta; });
    if (!l.length) return ""; ultimaBattuta = aCaso(l); return ultimaBattuta;
  }

  // ---- suoni (sul computer di prova sono spenti) ----
  function nota(ctx, f, t0, dur, vol, tipo) {
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = tipo || "sine"; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(vol, t0 + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(ctx.destination); o.start(t0); o.stop(t0 + dur + 0.03);
  }
  function suono(tipo) {
    var ctx = SG.audioCtx && SG.audioCtx(); if (!ctx) return;
    try {
      var t = ctx.currentTime;
      if (tipo === "segno") { nota(ctx, 660, t, 0.07, 0.035, "triangle"); }
      else if (tipo === "turno") { nota(ctx, 988, t, 0.12, 0.05); nota(ctx, 1319, t + 0.09, 0.16, 0.04); }
      else if (tipo === "campo") { nota(ctx, 784, t, 0.12, 0.06, "triangle"); nota(ctx, 1175, t + 0.08, 0.22, 0.05, "triangle"); }
      else if (tipo === "luce") { nota(ctx, 1480, t, 0.04, 0.025); }
      else if (tipo === "ferma") { nota(ctx, 880, t, 0.1, 0.05, "triangle"); nota(ctx, 1320, t + 0.06, 0.18, 0.04, "triangle"); }
      else if (tipo === "vinci") [523, 659, 784, 1047].forEach(function (f, k) { nota(ctx, f, t + k * 0.09, 0.24, 0.08, "triangle"); });
      else if (tipo === "perdi") { nota(ctx, 392, t, 0.22, 0.07, "triangle"); nota(ctx, 311, t + 0.18, 0.34, 0.06, "triangle"); }
      else if (tipo === "pari") { nota(ctx, 587, t, 0.16, 0.06, "triangle"); nota(ctx, 587, t + 0.15, 0.22, 0.05, "triangle"); }
    } catch (e) {}
  }

  SG.registra({
    id: ID,
    tema: "oro",   // 🌙 il vestito della notte in tutto il gioco
    nome: "Tris Gigante",
    icona: "❌",
    descrizione: "Nove tris dentro un tris: la casella che scegli decide dove gioca l'altro. Contro il Bot, in due sullo stesso telefono o online.",
    giocatoriMin: 1, giocatoriMax: 6, difficolta: 2,
    postiOnline: 2,   // online si gioca in due: gli altri guardano
    riprende: true,   // se l'host ricarica la pagina, la partita riprende dalla stessa mossa (t.ripresa)
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il Bot", sotto: "Giochi da solo" },
      { modo: "telefono", icona: "📱", nome: "Su questo telefono", sotto: "In due (o di più: chi vince resta)", amici: true }],
    regole: [
      "Il tabellone è un <b>tris grande</b> fatto di <b>9 tris piccoli</b> (i campi): 81 caselle. Si gioca in due, X e O; la prima mossa va dove si vuole.",
      "<b>🧠 Classica</b>: la casella in cui giochi decide il campo dell'altro. Metti la X nella casella in alto a destra di un campo? L'altro deve giocare nel campo in alto a destra. Se quel campo è già vinto o pieno, gioca dove vuole.",
      "<b>🎲 Campo a caso</b>: dopo ogni mossa è il gioco a scegliere a caso il campo dell'altro, tra quelli ancora aperti.",
      "Chi fa tris in un campo piccolo lo <b>vince</b>: il campo si copre con la sua X o la sua O grande. Un campo pieno senza tris non è di nessuno.",
      "Vince chi fa <b>tris di campi</b> sul tabellone grande. Se non ci riesce nessuno, vince chi ha vinto <b>più campi</b>; a pari campi è pareggio.",
      "Il campo dove si deve giocare è acceso; la freccia parte dall'ultima mossa e mostra dove ti manda.",
      "Modalità: <b>contro il Bot</b> (Facile / Medio / Difficile), <b>sullo stesso telefono</b> (se siete più di due, chi vince resta) oppure <b>online</b> (si gioca in due, gli altri guardano)."
    ],
    riassunto: function (imp) {
      return (imp && imp.modalita === "caso" ? "🎲 Campo a caso: il campo dell'altro lo sceglie il gioco" : "🧠 Classica: la casella che scegli decide il campo dell'altro")
        + ({ turno: " · comincia uno a testa", perso: " · comincia chi perde", caso: " · chi comincia a sorte" })[(imp && imp.inizia) || "turno"];
    },

    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = aiuti.torneo ? "telefono" : (aiuti.modo || (aiuti.sala ? "online" : "bot"));
      dove.torneo = !!aiuti.torneo;
      dove.difficolta = livOk(dove.difficolta); dove.modalita = dove.modalita === "caso" ? "caso" : "classica"; dove.inizia = dove.inizia || "turno";
      function scelta(titolo, chiave, voci, colonne) {
        box.appendChild(el("div", { class: "etichetta", style: "margin-top:10px", text: titolo }));
        var g = el("div", { class: "modo-griglia", style: "display:grid;gap:8px;grid-template-columns:repeat(" + colonne + ",minmax(0,1fr))" });
        voci.forEach(function (v) {
          var b = el("button", { class: "modo-chip" + (dove[chiave] === v[0] ? " attiva" : ""), style: "flex-direction:column;gap:2px;padding:10px 6px;justify-content:center;text-align:center;min-width:0",
            onclick: function () { dove[chiave] = v[0]; [].forEach.call(g.children, function (c) { c.classList.remove("attiva"); }); b.classList.add("attiva"); } },
            [el("span", { class: "mi", style: "font-size:1.5rem", text: v[1] }), el("div", { class: "mt", style: "font-size:.98rem", text: v[2] }), v[3] ? el("div", { class: "ms", style: "font-size:.78rem", text: v[3] }) : null]);
          g.appendChild(b);
        });
        box.appendChild(g);
      }
      if (dove.modo === "bot") scelta("Bravura del Bot", "difficolta", [["facile", "🙂", "Facile"], ["medio", "😐", "Medio"], ["difficile", "😠", "Difficile"]], 3);
      scelta("Modalità", "modalita", [["classica", "🧠", "Classica", "La casella decide il campo"], ["caso", "🎲", "Campo a caso", "Il campo lo sceglie il gioco"]], 2);
      if (!aiuti.torneo) scelta("Chi comincia", "inizia", [["turno", "🔁", "A turno"], ["perso", "😤", "Chi perde"], ["caso", "🎲", "A sorte"]], 3);
      if (dove.modo === "online" && !aiuti.sala) {
        box.appendChild(el("div", { class: "link-avviso", text: (window.SGNet && SGNet.disponibile())
          ? "Apri la stanza e invita l'altro col tasto 📤: entra dal suo telefono (gli altri guardano)."
          : "Qui il collegamento non è disponibile: funziona quando il gioco è aperto dal sito pubblicato online." }));
      }
    },

    avvia: function (t) {
      var imp = t.impostazioni || {};
      if (t.linkParams && t.linkParams.stanza) return t.linkParams.guarda ? guardaG(t, t.linkParams.stanza) : ospiteG(t, t.linkParams.stanza);
      if (imp.modo === "online") return hostG(t);
      return localeG(t, imp.modo === "telefono" ? "telefono" : "bot", livOk(imp.difficolta), !!imp.torneo, imp);
    }
  });

  // =========================================================
  //  STILE (una volta sola). Misure del tabellone: campo = 31,6% del lato, spazio tra i campi 2,6%,
  //  margine dentro il campo 2% (le stesse misure servono alla freccia e alla luce: G, S, PAD qui sotto)
  // =========================================================
  var G = 0.026, S = (1 - 2 * G) / 3, PAD = 0.02;
  function centroCampo(b) { return { x: ((b % 3) * (S + G) + S / 2) * 300, y: (((b / 3) | 0) * (S + G) + S / 2) * 300 }; }
  function centroCasella(i) {
    var b = (i / 9) | 0, k = i % 9, q = (S - 2 * PAD) / 3;
    return { x: ((b % 3) * (S + G) + PAD + ((k % 3) + 0.5) * q) * 300, y: (((b / 3) | 0) * (S + G) + PAD + (((k / 3) | 0) + 0.5) * q) * 300 };
  }
  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var passo = ((S + G) / S * 100).toFixed(3) + "%";
    var st = document.createElement("style");
    st.id = "sg-trisg-css";
    st.textContent = [
      ".schermata.tg-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden}",
      ".schermata.tg-piena>.piede{display:none}",
      ".schermata.tg-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".oro.g-" + ID + ".senza-testa>.testa .btn-piccolo{background:var(--o-carta);color:var(--o-testo);box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra)}",
      ".tg-scena{--tgw:min(calc(100vw - 14px),calc(var(--alt,100dvh) - 205px),560px);--tgl:rgba(255,255,255,.2);position:relative;height:var(--alt,100dvh);box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;padding:calc(8px + env(safe-area-inset-top)) 7px calc(10px + env(safe-area-inset-bottom));overflow:hidden;user-select:none;-webkit-user-select:none}",
      ".tg-scena.con-targa{padding-bottom:calc(62px + env(safe-area-inset-bottom));--tgw:min(calc(100vw - 14px),calc(var(--alt,100dvh) - 262px),560px)}",
      ".tg-scena.con-fa{--tgw:min(calc(100vw - 14px),calc(var(--alt,100dvh) - 250px),560px)}",
      // i due giocatori, col conto delle vittorie in mezzo
      ".tg-gioc{width:var(--tgw);max-width:100%;display:flex;align-items:flex-start;justify-content:center;gap:4px;padding:0 36px;box-sizing:border-box}",
      ".tg-g{flex:1 1 0;min-width:0;display:flex;flex-direction:column;align-items:center;gap:1px;opacity:.7;transform:scale(.92);transition:opacity .25s,transform .25s;position:relative}",
      ".tg-g.turno,.tg-g.vince{opacity:1;transform:none}",
      ".tg-avw{position:relative;width:46px;height:46px}",
      ".tg-av{width:100%;height:100%;box-sizing:border-box;border-radius:50%;background:var(--o-carta-2);border:2.5px solid;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:1.6rem;line-height:1;box-shadow:var(--o-ombra)}",
      ".tg-av svg{width:100%;height:100%;display:block;align-self:flex-end}",
      ".tg-g.X .tg-av{border-color:" + CX + "}.tg-g.O .tg-av{border-color:" + CO + "}",
      ".tg-g.vince .tg-av{box-shadow:0 0 0 2px var(--o-carta-piena),0 0 0 4.5px #fff}",
      ".tg-sim{position:absolute;right:-6px;bottom:-4px;width:22px;height:22px;border-radius:50%;background:var(--o-carta-piena);box-shadow:0 0 0 2px var(--o-carta-piena),0 1px 4px rgba(0,0,0,.5)}",
      ".tg-sim svg{position:absolute;left:3px;top:3px;width:16px;height:16px;overflow:visible}",
      ".tg-nome{font-weight:800;font-size:.84rem;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--o-testo);margin-top:2px}",
      ".tg-sotto{font-size:.7rem;font-weight:700;color:var(--o-tenue);min-height:1.1em;line-height:1.15;white-space:nowrap}",
      ".tg-sotto b{color:var(--o-testo)}",
      ".tg-punti{flex:0 0 auto;align-self:center;font-family:var(--o-tit);font-weight:700;font-size:1.7rem;white-space:nowrap;margin-bottom:10px;font-variant-numeric:lining-nums tabular-nums;text-align:center;line-height:1.05;color:var(--o-testo)}",
      ".tg-punti small{display:block;font-size:.62rem;font-weight:700;color:var(--o-tenue);letter-spacing:.02em}",
      ".tg-fumetto{position:absolute;bottom:calc(100% + 4px);z-index:6;width:max-content;max-width:150px;background:var(--o-carta-piena);color:var(--o-testo);border:1px solid var(--o-filo-oro);font-weight:800;font-size:.8rem;line-height:1.25;padding:6px 9px;border-radius:12px;box-shadow:var(--o-ombra-alta);opacity:0;transform:translateY(-4px) scale(.9);transition:opacity .2s,transform .2s;pointer-events:none;text-align:center;white-space:normal}",
      ".tg-g.X .tg-fumetto{left:0}.tg-g.O .tg-fumetto{right:0}",
      ".tg-fumetto.on{opacity:1;transform:none}",
      ".tg-stato{font-family:var(--o-tit);font-weight:700;font-size:1.1rem;min-height:1.35em;line-height:1.35;text-align:center;color:var(--o-testo);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:var(--tgw)}",
      ".tg-stato small{font-size:.8em;color:var(--o-tenue);font-weight:700}",
      ".tg-stato.pop{animation:tgPopS .45s ease-out}",
      "@keyframes tgPopS{0%{transform:scale(.7);opacity:.3}60%{transform:scale(1.1);opacity:1}100%{transform:none}}",
      // il tabellone: 9 campi di vetro, ognuno col suo cancelletto
      ".tg-tab{--tgc:#fff;--tgu:#fff;position:relative;flex:0 0 auto;width:var(--tgw);height:var(--tgw);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));gap:calc(var(--tgw)*" + G + ")}",
      ".tg-campo{position:relative;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(3,minmax(0,1fr));padding:calc(var(--tgw)*" + PAD + ");border-radius:calc(var(--tgw)*.028);background:var(--o-carta);box-shadow:inset 0 0 0 1px var(--o-filo-oro);min-width:0;min-height:0}",
      ".tg-campo::before{content:'';position:absolute;inset:0;border-radius:inherit;background:rgba(255,255,255,.07);opacity:0;transition:opacity .25s;pointer-events:none}",
      ".tg-campo::after{content:'';position:absolute;inset:-1px;border-radius:inherit;box-shadow:0 0 0 2.5px var(--tgc),0 0 16px -3px var(--tgc);opacity:0;transition:opacity .25s;pointer-events:none;z-index:3}",
      ".tg-campo.gioca::before,.tg-campo.gioca::after{opacity:1}",
      ".tg-tab.tuo .tg-campo.gioca::after{animation:tgRespira 1.4s ease-in-out infinite alternate}",
      "@keyframes tgRespira{0%{opacity:.45}100%{opacity:1}}",
      ".tg-tab.fine .tg-campo.suo::after{opacity:1;--tgc:#fff}",
      ".tg-c{position:relative;display:block;border:0;padding:0;margin:0;min-width:0;min-height:0;border-radius:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent;color:inherit;font:inherit;transition:opacity .25s}",
      ".tg-c:disabled{cursor:default;opacity:1;color:inherit}",
      ".tg-c:nth-child(1),.tg-c:nth-child(2),.tg-c:nth-child(4),.tg-c:nth-child(5){box-shadow:1px 0 0 0 var(--tgl),0 1px 0 0 var(--tgl)}",
      ".tg-c:nth-child(3),.tg-c:nth-child(6){box-shadow:0 1px 0 0 var(--tgl)}",
      ".tg-c:nth-child(7),.tg-c:nth-child(8){box-shadow:1px 0 0 0 var(--tgl)}",
      ".tg-campo.spento .tg-c{opacity:.4}",
      ".tg-campo.chiuso .tg-c{opacity:.22}",
      ".tg-c::before{content:'';position:absolute;inset:9%;border-radius:22%;background:#fff;opacity:0;pointer-events:none}",
      ".tg-c:not(:disabled):active::before{opacity:.16}",
      "@media (hover:hover){.tg-c:not(:disabled):hover::before{opacity:.09}}",
      ".tg-c.ultima::before{background:var(--tgu);opacity:.3}",
      ".tg-c svg{position:absolute;left:16%;top:16%;width:68%;height:68%;overflow:visible;z-index:1;transform-origin:50% 50%}",
      ".tg-seg{fill:none;stroke-width:13;stroke-linecap:round}",
      ".tg-seg.x{stroke:" + CX + "}.tg-seg.o{stroke:" + CO + "}.tg-seg.p{stroke:rgba(255,255,255,.4);stroke-width:7}",
      ".tg-c svg.nuovo{animation:tgPop .28s cubic-bezier(.3,1.6,.5,1) both}",
      "@keyframes tgPop{0%{transform:scale(.3);opacity:0}100%{transform:none;opacity:1}}",
      ".tg-c svg.prova{opacity:.45}",
      // il campo vinto: la X o la O grande sopra
      ".tg-vinto{position:absolute;inset:7%;pointer-events:none;opacity:0;transform:scale(.55);transition:opacity .3s,transform .4s cubic-bezier(.3,1.5,.5,1);z-index:2}",
      ".tg-vinto.on{opacity:1;transform:none}",
      ".tg-vinto.subito{transition:none}",
      ".tg-vinto svg{width:100%;height:100%;overflow:visible;display:block}",
      ".tg-vinto .tg-seg{stroke-width:10}",
      // la freccia dall'ultima mossa al campo dove manda, e la luce del campo a caso
      ".tg-fr{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:5;opacity:0}",
      ".tg-fr.on{animation:tgFr 2.9s ease-out forwards}",
      "@keyframes tgFr{0%{opacity:0}10%{opacity:1}74%{opacity:1}100%{opacity:0}}",
      ".tg-fr .ombra{fill:none;stroke:rgba(5,7,16,.6);stroke-width:7;stroke-linecap:round;stroke-linejoin:round}",
      ".tg-fr .riga{fill:none;stroke:var(--tgf,#fff);stroke-width:3.4;stroke-linecap:round;stroke-linejoin:round}",
      ".tg-fr .punta{fill:var(--tgf,#fff);stroke:rgba(5,7,16,.6);stroke-width:1.5}",
      ".tg-fr .via{fill:var(--tgf,#fff)}",
      ".tg-luce{position:absolute;left:0;top:0;width:calc(var(--tgw)*" + S.toFixed(5) + ");height:calc(var(--tgw)*" + S.toFixed(5) + ");border-radius:calc(var(--tgw)*.028);pointer-events:none;z-index:4;opacity:0;background:rgba(255,255,255,.14);box-shadow:0 0 0 3px #fff,0 0 26px 6px rgba(255,255,255,.45);transition:transform .08s ease-out,opacity .15s}",
      ".tg-luce.on{opacity:1}",
      ".tg-luce.ferma{animation:tgFerma .42s ease-out}",
      "@keyframes tgFerma{0%{transform:var(--tgp) scale(1)}45%{transform:var(--tgp) scale(1.07)}100%{transform:var(--tgp) scale(1)}}",
      ".tg-linea{position:absolute;left:0;top:0;width:100%;height:100%;pointer-events:none;overflow:visible;z-index:6;opacity:0;transition:opacity .45s .25s}",
      ".tg-linea.on{opacity:1}",
      ".tg-linea .ombra{stroke:rgba(5,7,16,.6);stroke-width:11;stroke-linecap:round}",
      ".tg-linea .riga{stroke:#fff;stroke-width:5.5;stroke-linecap:round}",
      // in fondo: tasti e note
      ".tg-piede{width:var(--tgw);max-width:100%;min-height:48px;display:flex;gap:8px;align-items:center;justify-content:center;flex-wrap:wrap}",
      ".tg-piede .btn{flex:1 1 0;min-width:0;margin:0}",
      ".tg-piede .sl-faccine{flex:1 1 100%}",
      ".tg-nota{flex:1 1 0;min-width:0;margin:0;text-align:center;font-weight:700;font-size:.86rem;color:var(--o-tenue);line-height:1.3}",
      ".tg-aiuto{flex:0 0 auto;width:40px;height:40px;border-radius:50%;border:0;padding:0;margin:0;background:var(--o-carta);color:var(--o-testo);font-weight:800;font-size:1.05rem;box-shadow:inset 0 0 0 1px var(--o-filo-oro),var(--o-ombra);cursor:pointer}",
      ".tg-cor{position:absolute;left:50%;top:45%;width:9px;height:14px;border-radius:2px;pointer-events:none;z-index:8;will-change:transform,opacity}",
      ".tg-attesa{font-size:1.1rem;line-height:1.5;text-align:center;margin:30vh 0 0}",
      // la spiegazione del primo avvio (si salta con un tocco)
      ".tg-sp{position:absolute;inset:0;z-index:30;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;background:rgba(9,11,22,.8);opacity:0;transition:opacity .25s}",
      ".tg-sp.on{opacity:1}",
      ".tg-spc{width:100%;max-width:370px;max-height:100%;overflow:hidden;box-sizing:border-box;background:var(--o-carta-piena);border:1px solid var(--o-filo-oro);border-radius:22px;box-shadow:var(--o-ombra-alta);padding:16px 16px 14px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;color:var(--o-testo)}",
      ".tg-spt{font-family:var(--o-tit);font-weight:800;font-size:1.25rem;line-height:1.2}",
      ".tg-spm{width:min(190px,34vh);height:min(190px,34vh);flex:0 0 auto}",
      ".tg-spm .r{fill:rgba(255,255,255,.07);stroke:rgba(255,255,255,.14);stroke-width:1}",
      ".tg-spm .l{stroke:rgba(255,255,255,.22);stroke-width:1.2}",
      ".tg-spm .d{opacity:0;transform-box:fill-box;transform-origin:center}",
      ".tg-spl{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px;font-size:.92rem;line-height:1.35;text-align:left}",
      ".tg-spl li{display:flex;gap:8px;align-items:flex-start}",
      ".tg-spl li>span{flex:0 0 auto}",
      ".tg-spc .btn{width:100%;margin:2px 0 0}",
      ".tg-spn{font-size:.74rem;color:var(--o-tenue);font-weight:700}",
      // telefoni bassi: avatar e scritte un po' più piccoli
      "@media (max-height:680px){.tg-scena{gap:5px}.tg-avw{width:40px;height:40px}.tg-punti{font-size:1.45rem;margin-bottom:6px}.tg-stato{font-size:1rem}.tg-nome{font-size:.78rem}}",
      // telefoni alti: avatar e scritte più grandi
      "@media (min-height:800px){.tg-scena{gap:12px}.tg-avw{width:62px;height:62px}.tg-av{font-size:2.2rem}.tg-nome{font-size:.98rem}.tg-sotto{font-size:.78rem}.tg-punti{font-size:2.1rem}.tg-stato{font-size:1.25rem}}"
    ].join("") + "\n.tg-luce{--tgpasso:" + passo + "}";
    document.head.appendChild(st);
  }

  function segnoSvg(s, cls) {
    return s === "X"
      ? "<svg viewBox='0 0 100 100'" + (cls ? " class='" + cls + "'" : "") + " aria-hidden='true'><path class='tg-seg x' d='M20 20L80 80M80 20L20 80'/></svg>"
      : "<svg viewBox='0 0 100 100'" + (cls ? " class='" + cls + "'" : "") + " aria-hidden='true'><circle class='tg-seg o' cx='50' cy='50' r='31'/></svg>";
  }
  function pariSvg() { return "<svg viewBox='0 0 100 100' aria-hidden='true'><path class='tg-seg p' d='M28 42H72M28 58H72'/></svg>"; }
  function avatarHtml(om) {
    if (typeof om === "string") return esc(om);
    if (om && window.SGOmino) { try { return SGOmino.svg(om, { busto: true }); } catch (e) {} }
    return "🙂";
  }

  // =========================================================
  //  IL CAMPO (uguale per tutte le modalità): si costruisce UNA volta e poi si aggiorna a pezzi
  //  vm = { fase:"gioco"|"fine", c (81 lettere), v (9 lettere), campo, turno, ultima, manda, fine, mosse, k, modalita,
  //         nomi:{X,O}, omini:{X,O}, punti:{X,O,pari}, n }
  //  cb = { mio:"X"|"O"|"-"|null, bot, liv, locale, sonoHost, guarda, spettatore, torneo, prova, hostVia,
  //         notaGioco, testoRivincita, notaFine, onCella(i), onRivincita, onEsci, onAvanti, onSpareggio, onSaletta }
  //  M  = { ui, fase } (uno per partita: la schermata e l'ultima fase vista)
  // =========================================================
  function nomeCol(vm, k) { return "<span style='color:" + col(k) + "'>" + esc(vm.nomi[k]) + "</span>"; }
  function statoHtml(ui, vm, cb) {
    if (vm.fase === "fine") {
      var f = vm.fine || {}, cc = f.campi || { X: 0, O: 0 };
      var conti = f.conti ? " <small>" + (f.vincitore ? cc[f.vincitore] + " campi a " + cc[altro(f.vincitore)] : cc.X + " campi a " + cc.O) + "</small>" : "";
      if (f.vincitore) {
        if (cb.mio === f.vincitore) return "🏆 Hai vinto!" + conti;
        if (cb.bot && f.vincitore === "O") return "🤖 Vince " + nomeCol(vm, "O") + "!" + conti;
        return "🏆 Vince " + nomeCol(vm, f.vincitore) + "!" + conti;
      }
      return "🤝 Pareggio!" + conti;
    }
    if (cb.hostVia) return "⏳ Aspettiamo " + esc(vm.nomi.X) + "…";
    if (ui.luceFino > Date.now()) return "🎲 Il gioco sceglie il campo…";
    var libero = vm.campo < 0 ? (vm.ultima < 0 ? " · dove vuoi" : " · campo chiuso: dove vuoi!") : "";
    if (cb.mio && cb.mio === vm.turno) return "Tocca a <b>te</b>" + libero;
    if (cb.bot && vm.turno === "O") return "🤖 " + nomeCol(vm, "O") + " sta pensando…";
    return "Tocca a " + nomeCol(vm, vm.turno) + (libero ? libero.replace("vuoi", "vuole") : "");
  }
  function puoi(ui) {
    var vm = ui.vm, cb = ui.cb;
    return !!(vm && cb && vm.fase === "gioco" && !cb.guarda && !cb.hostVia && ui.prova == null && !(ui.luceFino > Date.now()) && (cb.mio == null || cb.mio === vm.turno));
  }
  function lecitaVm(vm, i) {
    var b = (i / 9) | 0;
    return vm.c.charAt(i) === "." && vm.v.charAt(b) === "." && (vm.campo < 0 || vm.campo === b);
  }

  function campo(t, M, vm, cb, rifai) {
    if (M.ui && !document.body.contains(M.ui.s)) { if (!rifai) return; fermaLuce(M.ui); M.ui = null; }
    if (!M.ui) M.ui = creaCampo(t);
    var era = M.fase; M.fase = vm.fase;
    aggiorna(M.ui, vm, cb, era);
  }
  function creaCampo(t) {
    stile();
    var el = t.el, ui = { t: t, celle: [], v: [], campi: [], vinti: [], vv: [], vm: null, cb: null, gio: {}, firmaPiede: null, firmaStato: "", firmaLinea: "", prova: null, luceFino: 0, luceTo: [] };
    ui.s = t.schermata({ indietro: function () { indietro(ui); } });
    ui.s.classList.add("tg-piena");
    ui.scena = el("div", { class: "tg-scena" });
    ui.barra = el("div", { class: "tg-gioc" });
    ["X", "O"].forEach(function (k) {
      var g = { box: el("div", { class: "tg-g " + k }), av: el("div", { class: "tg-av" }), nome: el("div", { class: "tg-nome" }), sotto: el("div", { class: "tg-sotto" }), fum: el("div", { class: "tg-fumetto" }), firma: "", firmaS: "" };
      var sim = el("div", { class: "tg-sim" }); sim.innerHTML = segnoSvg(k, "");
      g.box.appendChild(el("div", { class: "tg-avw" }, [g.av, sim]));
      g.box.appendChild(g.nome); g.box.appendChild(g.sotto); g.box.appendChild(g.fum);
      ui.gio[k] = g;
    });
    ui.punti = el("div", { class: "tg-punti" });
    ui.barra.appendChild(ui.gio.X.box); ui.barra.appendChild(ui.punti); ui.barra.appendChild(ui.gio.O.box);
    ui.stato = el("div", { class: "tg-stato" });
    ui.tab = el("div", { class: "tg-tab" });
    for (var b = 0; b < 9; b++) (function (b) {
      var cp = el("div", { class: "tg-campo", "data-b": String(b) });
      for (var k = 0; k < 9; k++) (function (i) {
        var c = el("button", { class: "tg-c", "aria-label": "Campo " + (b + 1) + ", casella " + (k + 1), onclick: function () { tocca(ui, i); } });
        ui.celle[i] = c; ui.v[i] = "."; cp.appendChild(c);
      })(b * 9 + k);
      var vi = el("div", { class: "tg-vinto" }); cp.appendChild(vi);
      ui.campi.push(cp); ui.vinti.push(vi); ui.vv.push("."); ui.tab.appendChild(cp);
    })(b);
    ui.tab.insertAdjacentHTML("beforeend", "<svg class='tg-fr' viewBox='0 0 300 300' preserveAspectRatio='none' aria-hidden='true'></svg>"
      + "<svg class='tg-linea' viewBox='0 0 300 300' preserveAspectRatio='none' aria-hidden='true'><line class='ombra' x1='0' y1='0' x2='0' y2='0'/><line class='riga' x1='0' y1='0' x2='0' y2='0'/></svg>");
    ui.fr = ui.tab.querySelector(".tg-fr"); ui.linea = ui.tab.querySelector(".tg-linea");
    ui.luce = el("div", { class: "tg-luce" }); ui.tab.appendChild(ui.luce);
    ui.piede = el("div", { class: "tg-piede" });
    [ui.barra, ui.stato, ui.tab, ui.piede].forEach(function (n) { ui.scena.appendChild(n); });
    ui.s._contenuto.appendChild(ui.scena);
    t.mostra(ui.s);
    return ui;
  }
  function indietro(ui) {
    var cb = ui.cb; if (!cb) return;
    if (cb.guarda || !ui.vm || ui.vm.fase !== "gioco") return cb.onEsci();
    if (ui.t.conferma) ui.t.conferma("Uscire dalla partita?", cb.onEsci); else if (window.confirm("Uscire dalla partita?")) cb.onEsci();
  }
  function tocca(ui, i) {
    if (!puoi(ui) || !lecitaVm(ui.vm, i)) return;
    if (ui.cb.prova) {   // online: il segno compare subito (chiaro) finché non arriva la conferma dell'host
      ui.prova = i; ui.v[i] = "?";
      ui.celle[i].innerHTML = segnoSvg(ui.cb.mio, "prova");
      ui.celle.forEach(function (c) { c.disabled = true; });
      ui.tab.classList.remove("tuo");
      clearTimeout(ui.tProva);
      ui.tProva = setTimeout(function () { togliProva(ui); if (ui.vm) aggiorna(ui, ui.vm, ui.cb, ui.vm.fase); }, 4000);   // l'host non ha risposto: si può ritoccare
    }
    ui.cb.onCella(i);
  }
  function togliProva(ui) {
    if (ui.prova == null) return;
    var p = ui.prova; ui.prova = null; clearTimeout(ui.tProva);
    if (ui.v[p] === "?") { ui.v[p] = "."; ui.celle[p].innerHTML = ""; }
  }

  // ---- la luce del campo a caso: passa su qualche campo aperto e si ferma su quello scelto.
  // La strada viene dai numeri della partita (mossa, campo scelto, partita): uguale su tutti i telefoni ----
  function semeRnd(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function stradaLuce(vm) {
    var ap = []; for (var b = 0; b < 9; b++) if (vm.v.charAt(b) === ".") ap.push(b);
    if (ap.length <= 1) return [vm.campo];
    var r = semeRnd(vm.k * 7919 + vm.campo * 131 + (vm.n || 0) * 104729), n = 6 + ((r() * 2) | 0), via = [], prima = -1;
    for (var j = 0; j < n - 1; j++) {
      var scelta = ap.filter(function (x) { return x !== prima && (j < n - 2 || x !== vm.campo); });
      if (!scelta.length) scelta = ap.filter(function (x) { return x !== prima; });
      prima = scelta[(r() * scelta.length) | 0]; via.push(prima);
    }
    via.push(vm.campo);
    return via;
  }
  function posLuce(ui, b) {
    var p = "translate(calc(var(--tgpasso) * " + (b % 3) + "),calc(var(--tgpasso) * " + ((b / 3) | 0) + "))";
    ui.luce.style.setProperty("--tgp", p); ui.luce.style.transform = p;
  }
  function fermaLuce(ui) {
    if (!ui) return;
    ui.luceTo.forEach(clearTimeout); ui.luceTo = []; ui.luceFino = 0;
    if (ui.luce) ui.luce.classList.remove("on", "ferma");
  }
  function avviaLuce(ui, vm, muto) {
    fermaLuce(ui);
    var via = stradaLuce(vm), t = 0, durate = [];
    for (var j = 0; j < via.length; j++) durate.push(j === 0 ? 0 : 62 + 24 * (j - 1));
    ui.luce.style.transition = "none"; posLuce(ui, via[0]); void ui.luce.offsetWidth; ui.luce.style.transition = "";
    ui.luce.classList.add("on");
    via.forEach(function (b, j) {
      t += durate[j];
      ui.luceTo.push(setTimeout(function () {
        if (j) posLuce(ui, b);
        if (!muto) suono(j === via.length - 1 ? "ferma" : "luce");
        if (j === via.length - 1) { ui.luce.classList.remove("ferma"); void ui.luce.offsetWidth; ui.luce.classList.add("ferma"); }
      }, t));
    });
    var fine = t + 380;
    ui.luceFino = Date.now() + fine;
    ui.luceTo.push(setTimeout(function () { ui.luce.classList.remove("on"); }, fine));
    ui.luceTo.push(setTimeout(function () { ui.luceFino = 0; if (ui.vm && document.body.contains(ui.s)) aggiorna(ui, ui.vm, ui.cb, ui.vm.fase); }, fine + 10));
    return fine;
  }
  // ---- la freccia: dall'ultima casella giocata al campo dove manda l'altro (solo nella Classica) ----
  function freccia(ui, da, a, colore) {
    var p0 = centroCasella(da), c = centroCampo(a);
    var dx = c.x - p0.x, dy = c.y - p0.y, d = Math.sqrt(dx * dx + dy * dy);
    ui.fr.classList.remove("on");
    if (d < 30) { ui.fr.innerHTML = ""; return; }   // (manda nel suo stesso campo: lo dice già la luce del campo)
    var stop = Math.min(d * 0.45, 300 * S * 0.3), ux = dx / d, uy = dy / d;
    var e = { x: c.x - ux * stop, y: c.y - uy * stop };
    var curva = Math.min(26, d * 0.16), mx = (p0.x + e.x) / 2 - uy * curva, my = (p0.y + e.y) / 2 + ux * curva;
    // la punta va nella direzione dell'ultimo tratto della curva
    var tx = e.x - mx, ty = e.y - my, tl = Math.sqrt(tx * tx + ty * ty) || 1; tx /= tl; ty /= tl;
    var L = 13, W = 8, bx = e.x - tx * L, by = e.y - ty * L;
    var punta = "M" + e.x.toFixed(1) + " " + e.y.toFixed(1) + "L" + (bx - ty * W).toFixed(1) + " " + (by + tx * W).toFixed(1) + "L" + (bx + ty * W).toFixed(1) + " " + (by - tx * W).toFixed(1) + "Z";
    var path = "M" + p0.x.toFixed(1) + " " + p0.y.toFixed(1) + "Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + bx.toFixed(1) + " " + by.toFixed(1);
    ui.fr.style.setProperty("--tgf", colore);
    ui.fr.innerHTML = "<path class='ombra' d='" + path + "'/><path class='riga' d='" + path + "'/><path class='punta' d='" + punta + "'/><circle class='via' cx='" + p0.x.toFixed(1) + "' cy='" + p0.y.toFixed(1) + "' r='3.6'/>";
    void ui.fr.getBoundingClientRect(); ui.fr.classList.add("on");
  }

  function aggiorna(ui, vm, cb, era) {
    var prima = ui.vm, primaVolta = !prima;
    ui.vm = vm; ui.cb = cb;
    if (ui.prova != null && (vm.c.charAt(ui.prova) !== "." || vm.fase !== "gioco" || vm.turno !== cb.mio)) togliProva(ui);
    var nuova = !!prima && prima.n !== vm.n;   // è cominciata un'altra partita (rivincita)
    var mossaNuova = !!prima && !nuova && vm.k === prima.k + 1 && vm.ultima >= 0;
    var muto = !!cb.guarda;
    if (nuova || (prima && vm.k < prima.k)) { fermaLuce(ui); ui.fr.classList.remove("on"); }
    if (mossaNuova && vm.modalita === "caso" && vm.fase === "gioco" && vm.campo >= 0) avviaLuce(ui, vm, muto);
    var anim = ui.luceFino > Date.now();
    // ---- i giocatori e il conto ----
    var cc = { X: 0, O: 0 }; for (var b0 = 0; b0 < 9; b0++) { var o0 = vm.v.charAt(b0); if (o0 === "X" || o0 === "O") cc[o0]++; }
    ["X", "O"].forEach(function (k) {
      var g = ui.gio[k], om = vm.omini && vm.omini[k], f = (typeof om === "string" ? om : JSON.stringify(om || null)) + "|" + vm.nomi[k];
      if (g.firma !== f) { g.firma = f; g.av.innerHTML = avatarHtml(om); g.nome.textContent = vm.nomi[k] || ""; }
      var chi = cb.mio === k ? "tu" : (cb.bot && k === "O" && cb.liv ? LIVELLI[cb.liv] || "" : "");
      var sh = (chi ? chi + " · " : "") + "<b>" + cc[k] + "</b> " + (cc[k] === 1 ? "campo" : "campi");
      if (g.firmaS !== sh) { g.firmaS = sh; g.sotto.innerHTML = sh; }
      var c = "tg-g " + k + (vm.fase === "gioco" && vm.turno === k ? " turno" : "") + (vm.fase === "fine" && vm.fine && (vm.fine.vincitore === k || !vm.fine.vincitore) ? " vince" : "");
      if (vm.fase === "fine" && vm.fine && !vm.fine.vincitore) c = c.replace(" vince", " turno");
      if (g.box.className !== c) g.box.className = c;
    });
    var p = vm.punti || { X: 0, O: 0, pari: 0 };
    var ph = cifre(p.X) + " – " + cifre(p.O) + (p.pari ? "<small>" + cifre(p.pari) + " pari</small>" : "<small>&nbsp;</small>");
    if (ui.firmaPunti !== ph) { ui.firmaPunti = ph; ui.punti.innerHTML = ph; }
    // ---- la scritta del turno ----
    var sth = statoHtml(ui, vm, cb);
    if (sth !== ui.firmaStato) {
      ui.firmaStato = sth; ui.stato.innerHTML = sth;
      if (vm.fase === "fine") { ui.stato.classList.remove("pop"); void ui.stato.offsetWidth; ui.stato.classList.add("pop"); } else ui.stato.classList.remove("pop");
    }
    // ---- le caselle: si cambia solo quella che cambia ----
    var posso = puoi(ui), segnoNuovo = false, ult = vm.ultima;
    for (var i = 0; i < 81; i++) {
      var c = ui.celle[i], v = vm.c.charAt(i);
      if (ui.v[i] !== v && !(ui.prova === i && v === ".")) {
        ui.v[i] = v;
        if (v === ".") c.innerHTML = "";
        else { c.innerHTML = segnoSvg(v, primaVolta || nuova ? "" : "nuovo"); if (!primaVolta && !nuova) segnoNuovo = true; }
      }
      var u = i === ult;
      if (c.classList.contains("ultima") !== u) c.classList.toggle("ultima", u);
      var dis = !(posso && lecitaVm(vm, i));
      if (c.disabled !== dis) c.disabled = dis;
    }
    if (ult >= 0) ui.tab.style.setProperty("--tgu", col(vm.c.charAt(ult) === "O" ? "O" : "X"));
    if (segnoNuovo && !muto) suono("segno");
    // ---- i campi: vinti, chiusi, accesi o spenti ----
    var w = vm.fine && vm.fine.vincitore;
    for (var b = 0; b < 9; b++) {
      var cp = ui.campi[b], ow = vm.v.charAt(b);
      if (ui.vv[b] !== ow) {
        var vecchio = ui.vv[b]; ui.vv[b] = ow;
        var vi = ui.vinti[b];
        if (ow === ".") { vi.className = "tg-vinto"; vi.innerHTML = ""; }
        else {
          vi.innerHTML = ow === "=" ? pariSvg() : segnoSvg(ow, "");
          vi.className = "tg-vinto subito"; void vi.offsetWidth;
          if (primaVolta || nuova || vecchio !== ".") vi.className = "tg-vinto subito on";
          else { vi.className = "tg-vinto on"; if (ow !== "=") campoVinto(ui, ow, cb); }
        }
      }
      var chiuso = ow !== ".";
      var gioca = vm.fase === "gioco" && !anim && !chiuso && (vm.campo < 0 || vm.campo === b);
      var spento = vm.fase === "gioco" && !chiuso && !gioca;
      var suo = vm.fase === "fine" && !!w && ow === w && !!(vm.fine && vm.fine.conti);
      var cls = "tg-campo" + (chiuso ? " chiuso" : "") + (gioca ? " gioca" : "") + (spento ? " spento" : "") + (suo ? " suo" : "");
      if (cp.className !== cls) cp.className = cls;
    }
    var tuo = posso && !anim;
    if (ui.tab.classList.contains("tuo") !== tuo) ui.tab.classList.toggle("tuo", tuo);
    var fin = vm.fase === "fine";
    if (ui.tab.classList.contains("fine") !== fin) ui.tab.classList.toggle("fine", fin);
    var tgc = col(vm.turno);
    if (ui.tgc !== tgc) { ui.tgc = tgc; ui.tab.style.setProperty("--tgc", tgc); }
    // ---- la freccia (Classica): da dove si è giocato al campo dove si manda l'altro ----
    if (mossaNuova && vm.modalita !== "caso" && vm.fase === "gioco" && vm.manda >= 0) freccia(ui, ult, vm.manda, col(vm.turno));
    else if (vm.fase !== "gioco" && ui.fr.classList.contains("on")) ui.fr.classList.remove("on");
    // ---- la linea della vittoria sul tabellone grande ----
    var lin = (vm.fine && vm.fine.linea) || [], fl = lin.join(",");
    if (fl !== ui.firmaLinea) {
      ui.firmaLinea = fl; ui.linea.classList.remove("on");
      if (lin.length) {
        var a0 = centroCampo(lin[0]), z0 = centroCampo(lin[2]), dx = z0.x - a0.x, dy = z0.y - a0.y, len = Math.sqrt(dx * dx + dy * dy) || 1, ext = 34;
        [].forEach.call(ui.linea.querySelectorAll("line"), function (l) {
          l.setAttribute("x1", (a0.x - dx / len * ext).toFixed(1)); l.setAttribute("y1", (a0.y - dy / len * ext).toFixed(1));
          l.setAttribute("x2", (z0.x + dx / len * ext).toFixed(1)); l.setAttribute("y2", (z0.y + dy / len * ext).toFixed(1));
        });
        void ui.linea.getBoundingClientRect(); ui.linea.classList.add("on");
      }
    }
    // ---- in fondo: tasti e note ----
    piede(ui, vm, cb);
    // ---- la spiegazione del primo avvio (una volta per modalità, su questo telefono) ----
    if (vm.fase === "gioco" && !cb.guarda && !cb.spettatore && !ui.spiegata) { ui.spiegata = true; if (!vista(vm.modalita)) spiegazione(ui, vm.modalita); }
    // ---- "tocca a te" online: un ding leggero (solo se il telefono è in primo piano) ----
    if (!cb.locale && !cb.guarda && prima && vm.fase === "gioco" && cb.mio === vm.turno && (prima.turno !== vm.turno || prima.fase !== "gioco") && document.visibilityState !== "hidden")
      setTimeout(function () { suono("turno"); }, anim ? Math.max(260, ui.luceFino - Date.now()) : 260);
    // ---- fine partita vista coi propri occhi: festa e suoni (non dopo una pagina ricaricata) ----
    if (era === "gioco" && vm.fase === "fine" && vm.fine) fineEffetti(ui, vm, cb);
  }
  // un campo vinto davanti ai propri occhi: piccolo suono e vibrazione breve (a chi l'ha vinto; sullo stesso telefono sempre)
  function campoVinto(ui, ow, cb) {
    if (cb.guarda) return;
    suono("campo");
    if (cb.locale ? !(cb.bot && ow === "O") : cb.mio === ow) vibra(28);
  }
  function piede(ui, vm, cb) {
    var el = ui.t.el, voci = [];   // [tipo, testo, azione]; "fa" = la fila delle faccine (solo online); "?" = il tasto della spiegazione
    var targa = !!(ui.t.guarda && !ui.t.eliminazione);
    var fa = !cb.locale && ui.t.faccine && !targa ? ["fa", ""] : null;
    var tf = vm.fase === "fine" && !cb.locale && !cb.torneo && ui.t.tastiFine && (!cb.guarda || ui.t.guarda || (cb.spettatore && !!ui.t.scelti))
      ? { host: !!cb.sonoHost && !cb.guarda, nuova: cb.sonoHost && !cb.guarda ? cb.onSaletta : null, esci: cb.onEsci } : null;
    var notaModo = vm.modalita === "caso" ? "🎲 Campo a caso: il campo dell'altro lo sceglie il gioco" : "🧠 La casella che scegli manda l'altro in quel campo";
    if (vm.fase === "gioco") {
      if (cb.spettatore) { if (fa) voci.push(fa); voci.push(["f", "🏠 Esci", cb.onEsci]); }
      else if (cb.guarda) { if (fa) voci.push(fa); }
      else { voci.push(["?", "?"]); voci.push(["n", cb.notaGioco || notaModo]); }
    } else if (cb.guarda && !cb.spettatore) {
      voci.push(["n", !ui.t.eliminazione ? "👀 Aspettiamo la prossima partita…" : (vm.fine && vm.fine.vincitore ? "Tra poco si torna al tabellone…" : "Pareggio: si rigioca!")]);
      if (fa) voci.push(fa);
    } else if (cb.spettatore) {
      if (fa) voci.push(fa); voci.push(["f", "🏠 Esci", cb.onEsci]);
    } else if (cb.torneo) {
      if (vm.fine && vm.fine.vincitore) voci.push(["p", "Avanti ▶", cb.onAvanti]);
      else { voci.push(["p", "🔄 Spareggio", cb.onSpareggio]); voci.push(["f", "🤝 Pari, avanti", cb.onAvanti]); }
    } else if (cb.locale || cb.sonoHost) {
      if (fa) voci.push(fa);
      voci.push(["p", cb.testoRivincita || "🔄 Rivincita", cb.onRivincita]); voci.push(["f", "🏠 Esci", cb.onEsci]);
      if (cb.notaFine) voci.push(["n", cb.notaFine]);
    } else {
      voci.push(["n", "Aspetta: la rivincita la fa partire " + (vm.nomi.X || "l'host") + "."]); if (fa) voci.push(fa); voci.push(["f", "🏠 Esci", cb.onEsci]);
    }
    var firma = (tf ? "tf|" + vm.n + "|" : "") + voci.map(function (v) { return v[0] + v[1]; }).join("|");
    ui.azioni = voci.map(function (v) { return v[2]; });
    if (firma === ui.firmaPiede) return;
    ui.firmaPiede = firma;
    ui.piede.innerHTML = "";
    var conFa = false;
    if (tf && ui.t.tastiFine(ui.piede, tf)) {   // li ha messi il core: sopra, le faccine
      var f0 = fa ? ui.t.faccine() : null;
      if (f0) { ui.piede.insertBefore(f0, ui.piede.firstChild); conFa = true; }
      voci = [];
    }
    voci.forEach(function (v, k) {
      if (v[0] === "fa") { var f = ui.t.faccine(); if (f) { ui.piede.appendChild(f); conFa = true; } return; }
      if (v[0] === "?") { ui.piede.appendChild(el("button", { class: "tg-aiuto", "aria-label": "Come si gioca", text: "?", onclick: function () { if (ui.vm) spiegazione(ui, ui.vm.modalita); } })); return; }
      if (v[0] === "n") ui.piede.appendChild(el("p", { class: "tg-nota", text: v[1] }));
      else {
        var bt = el("button", { class: "btn " + (v[0] === "p" ? "btn-primario" : "btn-fantasma"), text: v[1], onclick: function () { var f = ui.azioni[k]; if (f) f(); } });
        ui.piede.appendChild(bt);
        // torneo a eliminazione: col pareggio si rigioca da soli (la rivincita ha il conto)
        if (v[0] === "p" && ui.t.eliminazione && vm.fase === "fine" && vm.fine && !vm.fine.vincitore && (cb.locale || cb.sonoHost) && ui.t.contoAvanti)
          ui.t.contoAvanti(bt, 8, function () { var f = ui.azioni[k]; if (f) f(); });
      }
    });
    if (ui.scena.classList.contains("con-fa") !== conFa) ui.scena.classList.toggle("con-fa", conFa);
    if (ui.scena.classList.contains("con-targa") !== targa) ui.scena.classList.toggle("con-targa", targa);
  }
  function fineEffetti(ui, vm, cb) {
    var w = vm.fine.vincitore;
    fermaLuce(ui);
    if (!w) { if (!cb.guarda) suono("pari"); return; }
    var mia = cb.mio === w || (cb.locale && !cb.bot), persa = !!cb.mio && cb.mio !== "-" && cb.mio !== w;
    if (persa) {
      if (!cb.guarda) suono("perdi");
      if (ui.tab.animate) try { ui.tab.animate([{ transform: "translateX(0)" }, { transform: "translateX(-9px)" }, { transform: "translateX(8px)" }, { transform: "translateX(-5px)" }, { transform: "translateX(0)" }], { duration: 380, delay: 300 }); } catch (e) {}
      return;
    }
    if (mia || cb.guarda) {
      if (!cb.guarda) { suono("vinci"); vibra([60, 50, 140]); }
      coriandoli(ui, col(w));
    }
  }
  function coriandoli(ui, colore) {
    if (!ui.scena.animate) return;
    var colori = [colore, "#fff", "var(--o-oro-chiaro)", colore, "var(--o-tenue)"];
    for (var k = 0; k < 24; k++) (function (k) {
      var p = document.createElement("div"); p.className = "tg-cor"; p.style.background = colori[k % colori.length];
      ui.scena.appendChild(p);
      var ang = Math.random() * Math.PI * 2, dist = 90 + Math.random() * 150, dx = Math.cos(ang) * dist, dy = Math.sin(ang) * dist - 60;
      try {
        var an = p.animate([{ transform: "translate(-50%,-50%) rotate(0) scale(.6)", opacity: 1 },
          { transform: "translate(calc(-50% + " + dx.toFixed(0) + "px),calc(-50% + " + dy.toFixed(0) + "px)) rotate(" + (Math.random() * 540 - 270).toFixed(0) + "deg) scale(1)", opacity: 1, offset: 0.6 },
          { transform: "translate(calc(-50% + " + (dx * 1.15).toFixed(0) + "px),calc(-50% + " + (dy + 140).toFixed(0) + "px)) rotate(" + (Math.random() * 720 - 360).toFixed(0) + "deg) scale(.9)", opacity: 0 }],
          { duration: 1300 + Math.random() * 400, delay: 200 + k * 12, easing: "cubic-bezier(.2,.7,.4,1)", fill: "forwards" });
        an.onfinish = function () { if (p.parentNode) p.parentNode.removeChild(p); };
      } catch (e) {}
      setTimeout(function () { if (p.parentNode) p.parentNode.removeChild(p); }, 2400);
    })(k);
  }
  function fumetto(ui, k, testo) {
    if (!ui || !testo) return;
    var g = ui.gio[k]; g.fum.textContent = testo; g.fum.classList.add("on");
    clearTimeout(g.tFum); g.tFum = setTimeout(function () { g.fum.classList.remove("on"); }, 2600);
  }

  // ---- la spiegazione del primo avvio: corta, con un esempio che si muove; si chiude con un tocco ----
  function vista(modalita) { try { return !!(JSON.parse(localStorage.getItem("sg-trisg-visto") || "{}") || {})[modalita]; } catch (e) { return false; } }
  function segnaVista(modalita) { try { var o = JSON.parse(localStorage.getItem("sg-trisg-visto") || "{}") || {}; o[modalita] = 1; localStorage.setItem("sg-trisg-visto", JSON.stringify(o)); } catch (e) {} }
  var kfFatti = {};
  // un pezzo dell'esempio che compare da "da" a "a" (in % del giro di 6,5 s), solo opacità (e un po' di scala per i segni)
  function kf(nome, da, a, scala, rampa) {
    if (kfFatti[nome]) return nome; kfFatti[nome] = 1;
    var r = rampa || 3, s0 = scala ? "transform:scale(.3);" : "", s1 = scala ? "transform:none;" : "";
    var st = document.createElement("style");
    st.textContent = "@keyframes " + nome + "{0%," + da + "%{opacity:0;" + s0 + "}" + (da + r) + "%," + a + "%{opacity:1;" + s1 + "}" + Math.min(100, a + r) + "%,100%{opacity:0;" + s1 + "}}";
    document.head.appendChild(st);
    return nome;
  }
  function esempioSvg(modalita) {
    var s = S * 300, pass = (S + G) * 300, q = (S - 2 * PAD) / 3 * 300, pad = PAD * 300, h = "";
    for (var b = 0; b < 9; b++) {
      var x = (b % 3) * pass, y = ((b / 3) | 0) * pass;
      h += "<rect class='r' x='" + x.toFixed(1) + "' y='" + y.toFixed(1) + "' width='" + s.toFixed(1) + "' height='" + s.toFixed(1) + "' rx='8'/>";
      for (var j = 1; j < 3; j++) {
        h += "<line class='l' x1='" + (x + pad + j * q).toFixed(1) + "' y1='" + (y + pad).toFixed(1) + "' x2='" + (x + pad + j * q).toFixed(1) + "' y2='" + (y + s - pad).toFixed(1) + "'/>";
        h += "<line class='l' x1='" + (x + pad).toFixed(1) + "' y1='" + (y + pad + j * q).toFixed(1) + "' x2='" + (x + s - pad).toFixed(1) + "' y2='" + (y + pad + j * q).toFixed(1) + "'/>";
      }
    }
    function anel(b, colore, nome, da, a) {
      var x = (b % 3) * pass, y = ((b / 3) | 0) * pass;
      return "<rect class='d' style='animation:" + kf(nome, da, a) + " 6.5s infinite' x='" + (x - 1).toFixed(1) + "' y='" + (y - 1).toFixed(1) + "' width='" + (s + 2).toFixed(1) + "' height='" + (s + 2).toFixed(1) + "' rx='9' fill='rgba(255,255,255,.08)' stroke='" + colore + "' stroke-width='4'/>";
    }
    function segno(i, k, nome, da) {
      var c = centroCasella(i), r = q * 0.3;
      var dentro = k === "X" ? "<path d='M" + (c.x - r) + " " + (c.y - r) + "L" + (c.x + r) + " " + (c.y + r) + "M" + (c.x + r) + " " + (c.y - r) + "L" + (c.x - r) + " " + (c.y + r) + "' stroke='" + CX + "' stroke-width='5' stroke-linecap='round' fill='none'/>"
        : "<circle cx='" + c.x + "' cy='" + c.y + "' r='" + r + "' stroke='" + CO + "' stroke-width='5' fill='none'/>";
      return "<g class='d' style='animation:" + kf(nome, da, 93, true) + " 6.5s infinite'>" + dentro + "</g>";
    }
    function frec(i, b, colore, nome, da) {
      var p0 = centroCasella(i), c = centroCampo(b), dx = c.x - p0.x, dy = c.y - p0.y, d = Math.sqrt(dx * dx + dy * dy), ux = dx / d, uy = dy / d;
      var e = { x: c.x - ux * 26, y: c.y - uy * 26 }, mx = (p0.x + e.x) / 2 - uy * 22, my = (p0.y + e.y) / 2 + ux * 22;
      var tx = e.x - mx, ty = e.y - my, tl = Math.sqrt(tx * tx + ty * ty); tx /= tl; ty /= tl;
      var bx = e.x - tx * 14, by = e.y - ty * 14;
      return "<g class='d' style='animation:" + kf(nome, da, 93) + " 6.5s infinite'><path d='M" + p0.x.toFixed(1) + " " + p0.y.toFixed(1) + "Q" + mx.toFixed(1) + " " + my.toFixed(1) + " " + bx.toFixed(1) + " " + by.toFixed(1) + "' stroke='" + colore + "' stroke-width='4' fill='none' stroke-linecap='round'/>"
        + "<path d='M" + e.x.toFixed(1) + " " + e.y.toFixed(1) + "L" + (bx - ty * 9).toFixed(1) + " " + (by + tx * 9).toFixed(1) + "L" + (bx + ty * 9).toFixed(1) + " " + (by - tx * 9).toFixed(1) + "Z' fill='" + colore + "'/></g>";
    }
    if (modalita === "caso") {
      h += segno(6 * 9 + 2, "X", "tgE1", 6);
      [1, 5, 3, 8, 0, 7].forEach(function (b, j) {
        var x = (b % 3) * pass, y = ((b / 3) | 0) * pass, da = 20 + j * 4;
        h += "<rect class='d' style='animation:" + kf("tgEh" + j, da, da + 2.4, false, 0.6) + " 6.5s infinite' x='" + x.toFixed(1) + "' y='" + y.toFixed(1) + "' width='" + s.toFixed(1) + "' height='" + s.toFixed(1) + "' rx='8' fill='rgba(255,255,255,.18)' stroke='#fff' stroke-width='3'/>";
      });
      h += anel(4, CO, "tgE3", 46, 93) + segno(4 * 9 + 0, "O", "tgE4", 62);
    } else {
      h += segno(6 * 9 + 2, "X", "tgE1", 6) + frec(6 * 9 + 2, 2, CO, "tgE2", 20) + anel(2, CO, "tgE3", 30, 93)
        + segno(2 * 9 + 6, "O", "tgE4", 50) + frec(2 * 9 + 6, 6, CX, "tgE5", 62) + anel(6, CX, "tgE6", 72, 93);
    }
    return "<svg class='tg-spm' viewBox='-4 -4 308 308' aria-hidden='true'>" + h + "</svg>";
  }
  function spiegazione(ui, modalita) {
    if (!ui || ui.sp) return;
    var el = ui.t.el;
    var righe = [["🔲", "<b>9 tris piccoli</b> dentro un tris grande. Fai tris in un campo per <b>vincerlo</b>."],
      modalita === "caso" ? ["🎲", "Dopo ogni mossa il gioco <b>sceglie a caso</b> il campo dove gioca l'altro."]
        : ["➡️", "La casella dove giochi <b>manda l'altro</b> nel campo nello stesso posto. X in alto a destra? L'altro gioca nel campo in alto a destra."],
      modalita === "caso" ? null : ["✋", "Campo già chiuso? Si gioca dove si vuole."],
      ["🏆", "Vince chi fa <b>tris di campi</b>. Se nessuno ci riesce, chi ne ha vinti di più."]].filter(Boolean);
    var lista = el("ul", { class: "tg-spl" });
    righe.forEach(function (r) { var li = el("li", {}); li.innerHTML = "<span>" + r[0] + "</span><div>" + r[1] + "</div>"; lista.appendChild(li); });
    var mini = el("div", {}); mini.innerHTML = esempioSvg(modalita);
    var carta = el("div", { class: "tg-spc" }, [el("div", { class: "tg-spt", text: modalita === "caso" ? "🎲 Tris Gigante · Campo a caso" : "⭕ Tris Gigante" }), mini.firstChild, lista,
      el("button", { class: "btn btn-primario", text: "Ho capito ▶" }), el("div", { class: "tg-spn", text: "Tocca dove vuoi per chiudere" })]);
    var velo = el("div", { class: "tg-sp", role: "dialog", "aria-label": "Come si gioca" }, [carta]);
    function chiudi() { if (ui.sp !== velo) return; ui.sp = null; segnaVista(modalita); velo.classList.remove("on"); setTimeout(function () { if (velo.parentNode) velo.parentNode.removeChild(velo); }, 260); }
    velo.addEventListener("click", chiudi);
    ui.sp = velo; ui.scena.appendChild(velo);
    void velo.offsetWidth; velo.classList.add("on");
  }

  // com'è finita, per il core (XP, torneo): chi vince 1°, chi perde 2°; pari = tutti e due 1° (nel torneo a eliminazione si rigioca)
  function classificaDi(nomi, fine, botK) {
    var r = !fine.vincitore ? [{ nome: nomi.X, pos: 1, pari: true }, { nome: nomi.O, pos: 1, pari: true }]
      : [{ nome: nomi[fine.vincitore], pos: 1 }, { nome: nomi[altro(fine.vincitore)], pos: 2 }];
    if (botK) r.forEach(function (x) { if (x.nome === nomi[botK]) x.bot = true; });
    return r;
  }

  // =========================================================
  //  LOCALE — contro il Bot oppure sullo stesso telefono
  // =========================================================
  function localeG(t, modo, liv, torneo, imp) {
    var bot = modo === "bot", modalita = imp.modalita === "caso" ? "caso" : "classica", inizia = imp.inizia || "turno";
    var lista = (t.giocatori || []).map(function (s) { return String(s || "").trim(); }).filter(Boolean);
    var ilBot = bot ? botDi(imp, liv, [lista[0] || "Tu", t.nomeProfilo && t.nomeProfilo()]) : null;
    var gente = bot ? [lista[0] || "Tu", ilBot.nome] : (torneo ? lista.slice(0, 2) : lista.slice());
    if (!bot) {
      if (!gente[0]) gente[0] = "Giocatore 1";
      if (!gente[1]) gente[1] = gente[0] === "Giocatore 2" ? "Giocatore 1" : "Giocatore 2";
      gente = gente.map(function (n, i) { return gente.indexOf(n) < i ? n + " " + (i + 1) : n; });
    }
    var sedia = { X: gente[0], O: gente[1] }, coda = gente.slice(2);   // chi vince resta: gli altri aspettano in fila
    var vittorie = {}, pari = {}, omini = {};
    var st = null, primo = "X", ultimaFine = null, n = 0, timer = null, mente = null, chiuso = false, M = { ui: null, fase: null };
    var profilo = String((t.nomeProfilo && t.nomeProfilo()) || "").trim().toLowerCase();
    function ominoDi(nome) {
      if (!omini[nome]) omini[nome] = (bot || String(nome).toLowerCase() === profilo) && t.mioOmino ? t.mioOmino(nome) : (window.SGOmino ? SGOmino.casuale(nome) : "🙂");
      return omini[nome];
    }
    function coppia() { return [sedia.X, sedia.O].sort().join("|"); }
    function fermaBot() { clearTimeout(timer); timer = null; if (mente) { mente.ferma(); mente = null; } }
    function esci() { if (chiuso) return; chiuso = true; fermaBot(); fermaLuce(M.ui); t.esci(); }
    function vivo() { return !chiuso && (!M.ui || document.body.contains(M.ui.s)); }
    function vm() {
      var v = partitaVm(st);
      v.fase = st.fine ? "fine" : "gioco";
      v.nomi = { X: sedia.X, O: sedia.O }; v.omini = { X: ominoDi(sedia.X), O: bot ? (ilBot.omino || "🤖") : ominoDi(sedia.O) };
      v.punti = { X: vittorie[sedia.X] || 0, O: vittorie[sedia.O] || 0, pari: pari[coppia()] || 0 }; v.n = n;
      return v;
    }
    var cb = { locale: true, bot: bot, mio: bot ? "X" : null, liv: liv, torneo: torneo,
      onCella: function (i) { if (st && !st.fine && (!bot || st.turno === "X")) gioca(i); },
      onRivincita: rivincita, onEsci: esci,
      onSpareggio: function () { if (st && st.fine) nuova(); },
      onAvanti: function () { if (st && st.fine && !chiuso) { chiuso = true; fermaBot(); t.fine(classificaDi(sedia, st.fine, bot && "O")); } } };
    function render() {
      if (!vivo()) { chiuso = true; fermaBot(); return false; }
      var v = vm();
      if (t.trasmetti) t.trasmetti({ t: "vm", vm: v });   // torneo a eliminazione: gli altri guardano la partita col Bot
      var poi = coda.length ? "Chi vince resta · poi tocca a " + coda[0] : "";
      cb.notaGioco = poi;
      cb.testoRivincita = coda.length ? "▶ Avanti " + coda[0] : null;
      cb.notaFine = coda.length && st.fine ? (st.fine.vincitore ? sedia[st.fine.vincitore] + " resta, " + sedia[altro(st.fine.vincitore)] + " lascia il posto" : sedia[primo] + " (che aveva cominciato) lascia il posto") : "";
      campo(t, M, v, cb, false);
      return true;
    }
    function parla(tipo, prob) { if (bot && M.ui && Math.random() < (prob == null ? 1 : prob)) fumetto(M.ui, "O", battuta(tipo)); }
    function gioca(i) {
      var vPrima = st.v.slice();
      if (!metti(st, i)) return;
      if (st.fine) finePartita();
      if (!render()) return;
      if (st.fine) { if (bot) parla(st.fine.vincitore === "O" ? "vince" : st.fine.vincitore ? "perde" : "pari"); return; }
      if (bot) {
        var b = (i / 9) | 0;
        if (!vPrima[b] && st.v[b] === "O") parla("campo", 0.5);
        else if (!vPrima[b] && st.v[b] === "X") parla("perdeCampo", 0.4);
        if (st.turno === "O") pensaBot();
      }
    }
    function finePartita() {
      var w = st.fine.vincitore; ultimaFine = st.fine;
      if (w) vittorie[sedia[w]] = (vittorie[sedia[w]] || 0) + 1; else pari[coppia()] = (pari[coppia()] || 0) + 1;
      if (!torneo && t.risultato) t.risultato(classificaDi(sedia, st.fine, bot && "O"));
    }
    // il Bot pensa (a pezzetti, al massimo ~0,4 s) mentre la luce del campo a caso gira, e muove dopo una pausa naturale
    function pensaBot() {
      fermaBot();
      var questa = st, k0 = st.k, t0 = Date.now(), pausa = 380 + Math.random() * 160;
      mente = pensa(copiaPartita(st), liv, function (m) {
        mente = null;
        if (!vivo() || st !== questa || st.k !== k0 || st.fine || st.turno !== "O") return;
        var luce = M.ui && M.ui.luceFino > Date.now() ? M.ui.luceFino - Date.now() + 260 : 0;
        var resta = Math.max(t0 + pausa - Date.now(), luce, 0);
        timer = setTimeout(function () { timer = null; if (vivo() && st === questa && st.k === k0 && !st.fine && st.turno === "O") gioca(m); }, resta);
      });
    }
    function nuova(prima) {
      fermaBot();
      primo = prima ? (inizia === "caso" ? scegliPrimo("caso") : "X") : scegliPrimo(inizia, primo, ultimaFine);
      st = nuovaPartita(primo, modalita); n++;
      if (!render()) return;
      if (bot && st.turno === "O") { pensaBot(); parla("inizio", 0.45); }
      else if (bot) parla("inizio", 0.2);
    }
    function rivincita() {
      if (!st || !st.fine) return;
      if (coda.length) {   // chi vince resta; a pari esce chi aveva cominciato
        var esce = st.fine.vincitore ? altro(st.fine.vincitore) : primo;
        coda.push(sedia[esce]); sedia[esce] = coda.shift();
      }
      nuova(false);
    }
    nuova(true);
  }

  // =========================================================
  //  ONLINE — host è X, ospite è O (host-autoritativo, a turni). Come il Tris.
  // =========================================================
  function hostG(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var st = {
      fase: "lobby", codice: "…", pronta: false, p: nuovaPartita("X", imp.modalita), primo: "X", n: 0,
      modalita: imp.modalita === "caso" ? "caso" : "classica", inizia: imp.inizia || "turno",
      nomiX: (t.giocatori && t.giocatori[0]) || "Host", nomiO: null, avvId: null, ominoX: t.mioOmino ? t.mioOmino() : null, ominoO: null,
      punti: { X: 0, O: 0, pari: 0 }, ultimoO: "", sospesa: false, avviso: ""
    };
    var M = { ui: null, fase: null }, chiuso = false, rete = null;
    // ---- la ripresa: l'host ha ricaricato la pagina a metà partita → si continua dalla stessa mossa.
    // L'avversario è "via" finché non si rifà vivo (rientra da solo in un attimo); se in 30 s non torna è come se fosse uscito
    var CAMPI = ["fase", "p", "primo", "n", "modalita", "inizia", "nomiO", "avvId", "ominoO", "punti", "ultimoO", "sospesa", "avviso", "uscito", "uscitoId", "uscitoT"];
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.tg, ricordata = !!RIP;
    if (RIP) {
      CAMPI.forEach(function (k) { if (RIP[k] !== undefined) st[k] = RIP[k]; });
      if (st.avvId) { st.avvVia = true; setTimeout(function () { if (!chiuso && st.avvVia && st.avvId) avvUscito(st.avvId); }, 30000); }
    }
    function ricorda() {
      if (!t.ricorda) return;
      if (st.fase === "lobby") { if (ricordata) { ricordata = false; t.ricorda(null); } return; }
      var o = {}; CAMPI.forEach(function (k) { o[k] = st[k]; });
      ricordata = true; t.ricorda({ tg: o });
    }
    function avvUscito(id) {
      if (id !== st.avvId) return;
      st.avvVia = false;
      st.uscito = st.nomiO || ""; st.uscitoId = id; st.uscitoT = Date.now(); st.avvId = null; st.avviso = "😕 " + (st.nomiO || "L'avversario") + " è uscito.";
      if (st.fase === "gioco") st.sospesa = true;   // la partita a metà resta lì: si può riprendere
      st.fase = "lobby"; st.nomiO = null; bd();
    }
    // "⚙️ Regole" nella saletta: valgono dalla prossima partita
    t.onRegole = function (im) { st.modalita = im.modalita === "caso" ? "caso" : "classica"; st.inizia = im.inizia || "turno"; if (st.fase === "lobby") bd(); };
    var bRicomincia = t.el("button", { class: "btn btn-fantasma", text: "🔄 Ricomincia da capo", onclick: function () { if (st.fase === "lobby" && st.avvId) nuovaGara(); } });
    rete = SGNet.ospita(ID, {
      onCodice: function (c) { st.codice = c; st.riserva = riservaAvv(c); bd(); },
      onConnesso: function () { st.pronta = true; bd(); },
      onAddio: avvUscito,
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        if (st.avvVia && id === st.avvId) st.avvVia = false;
        if (m.t === "join") {
          var tienePosto = st.sospesa && st.uscitoId && id !== st.uscitoId && Date.now() - (st.uscitoT || 0) < 90000;
          var nome = String(m.nome || "Avversario").trim().slice(0, 16) || "Avversario";
          if (!st.avvId && !tienePosto && !postoRiservato(st.riserva, id) && (!t.puoSedersi || t.puoSedersi(id, nome))) {
            if (nome !== st.ultimoO) st.punti = { X: 0, O: 0, pari: 0 };   // un avversario nuovo: il conto riparte
            st.avviso = st.uscito && st.uscito !== nome ? "🔄 " + st.uscito + " è uscito: ora gioca " + nome + "." : "";
            st.avvId = id; st.nomiO = nome; st.ultimoO = nome; st.ominoO = avatarOk(m.omino); st.uscito = ""; st.uscitoId = null;
          }
          bd();   // (chi rientra o chi guarda riceve la foto)
        }
        else if (m.t === "mossa") { if (st.fase === "gioco" && st.p.turno === "O" && id === st.avvId) applica(+m.i); }
      },
      onErrore: function () { if (!chiuso && !st.pronta) { chiuso = true; errore(t, "Problema di collegamento. Controlla la connessione e riprova."); } }
    }, { ripresa: !!RIP });
    function vm() {
      var v = partitaVm(st.p);
      v.fase = st.fase; v.codice = st.codice; v.pronta = st.pronta;
      v.nomi = { X: st.nomiX, O: st.nomiO || st.ultimoO || "Avversario" }; v.avversario = !!st.avvId; v.avvId = st.avvId;
      v.omini = { X: st.ominoX, O: st.ominoO }; v.punti = st.punti; v.n = st.n; v.sospesa = st.sospesa; v.avviso = st.avviso; v.prossima = st.modalita;
      return v;
    }
    function bd() {
      if (chiuso) return;
      ricordaAvv(st.codice, st.avvId || (st.riserva && Date.now() < st.riserva.fino ? st.riserva.id : null));
      ricorda();
      if (rete) rete.invia({ t: "vm", vm: vm() }); disegna();
      if (t.aCheSiamo && st.fase === "gioco") { var cc = contaCampi(st.p.v); t.aCheSiamo("Campi " + cc.X + " a " + cc.O); }
    }
    function applica(i) {
      if (st.fase !== "gioco" || !metti(st.p, i)) return;
      if (st.p.fine) {
        st.fase = "fine";
        var w = st.p.fine.vincitore; if (w) st.punti[w]++; else st.punti.pari++;
        if (t.risultato) t.risultato(classificaDi({ X: st.nomiX, O: st.nomiO }, st.p.fine));
      }
      bd();
    }
    function nuovaGara() {
      st.primo = st.n ? scegliPrimo(st.inizia, st.primo, st.p.fine) : (st.inizia === "caso" ? scegliPrimo("caso") : "X");
      st.p = nuovaPartita(st.primo, st.modalita); st.n++; st.sospesa = false; st.avviso = ""; st.fase = "gioco"; bd();
    }
    var cb = {
      sonoHost: true, mio: "X", ricomincia: bRicomincia,
      onCella: function (i) { if (st.fase === "gioco" && st.p.turno === "X") applica(i); },
      onComincia: function () {
        if (st.fase !== "lobby" || !st.avvId) return;
        if (st.sospesa && !st.p.fine) { st.sospesa = false; st.avviso = ""; st.fase = "gioco"; return bd(); }   // si riprende da dove era rimasta
        nuovaGara();
      },
      onRivincita: function () { if (st.fase === "fine" && st.avvId) nuovaGara(); },
      // la rivincita dei tasti di fine comuni: si torna nella saletta con lo stesso avversario (il core fa il 3-2-1)
      onSaletta: function () { if (st.fase === "fine" && st.avvId) { st.fase = "lobby"; st.avviso = ""; bd(); } },
      onEsci: function () { if (chiuso) return; if (t.ricorda) t.ricorda(null); chiuso = true; fermaLuce(M.ui); if (rete) rete.chiudi(); t.esci(); }
    };
    t.onRivincita = cb.onSaletta;
    function disegna() {
      if (chiuso) return;
      var v = vm();
      if (v.fase === "lobby") { M.fase = "lobby"; return lobbyG(t, v, cb); }
      campo(t, M, v, cb, true);
    }
    disegna();
  }

  function ospiteG(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var el = t.el, Sx = { myId: null, vm: null, rete: null, nome: "", msg: null, chiuso: false }, M = { ui: null, fase: null };
    function esci() { if (Sx.chiuso) return; Sx.chiuso = true; fermaLuce(M.ui); if (Sx.rete) Sx.rete.chiudi(); t.esci(); }
    // gioca solo l'avversario vero (il suo id è nella foto dell'host): chi è in più guarda, senza "Tu" né "Tocca a te"
    var cbG = { sonoHost: false, mio: "O", prova: true, onCella: function (i) { if (Sx.rete) Sx.rete.invia({ t: "mossa", i: i }); }, onComincia: function () {}, onEsci: esci };
    var cbS = { spettatore: true, guarda: true, sonoHost: false, mio: "-", onCella: function () {}, onEsci: esci };
    function disegna() {
      if (Sx.chiuso || !Sx.vm) return;
      var vm = Sx.vm, cb = (!vm.avvId || vm.avvId === Sx.myId) ? cbG : cbS;
      cbG.myId = cbS.myId = Sx.myId;
      if (vm.fase === "lobby") { M.fase = "lobby"; return lobbyG(t, vm, cb); }
      campo(t, M, vm, cb, true);
    }
    schermaNome();
    function schermaNome() {
      var s = t.schermata({ icona: "⭕", titolo: "Entra nel Tris Gigante", sotto: "Stanza " + codice.toUpperCase(), indietro: t.esci });
      var input = el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      Sx.msg = el("div", { class: "link-avviso" });
      s._contenuto.appendChild(input); s._contenuto.appendChild(Sx.msg);
      var bEntra = el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        if (Sx.rete) return;
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        Sx.nome = (input.value || "Amico").trim() || "Amico"; Sx.msg.textContent = "Collegamento in corso…"; collega();
      } });
      s._piede.appendChild(bEntra);
      t.mostra(s);
      if (t.nomeProfilo && t.nomeProfilo()) { input.value = t.nomeProfilo(); bEntra.click(); }   // entra da solo col nome del profilo
    }
    function collega() {
      Sx.rete = SGNet.entra(codice, {
        onAperto: function (id) { Sx.myId = id; Sx.rete.invia({ t: "join", nome: Sx.nome, omino: t.mioOmino ? t.mioOmino(Sx.nome) : null });
          setTimeout(function () { if (!Sx.vm && Sx.msg) Sx.msg.textContent = "Non trovo la partita: controlla il codice, o l'host non ha ancora aperto la stanza…"; }, 8000); },
        onMsg: function (m) {
          if (Sx.chiuso || !m || m.t !== "vm" || !m.vm || typeof m.vm.c !== "string") return;
          Sx.vm = m.vm; disegna();
        },
        onHostVia: function (sparito) { cbG.hostVia = cbS.hostVia = !!sparito; disegna(); },
        onChiuso: function () { if (Sx.chiuso) return; Sx.chiuso = true; fermaLuce(M.ui); if (Sx.rete) Sx.rete.chiudi(); chiusa(t, Sx.vm, cbG.hostVia); },
        onErrore: function () { if (!Sx.chiuso && !Sx.vm) errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
      });
    }
  }

  // chi guarda soltanto (torneo a eliminazione, duello della Sala, "👀 Guarda"): la vede in diretta, senza poter toccare
  function guardaG(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var rete = null, Sx = { scritta: null, chiuso: false }, M = { ui: null, fase: null };
    var cb = { guarda: true, sonoHost: false, mio: "-", onCella: function () {}, onRivincita: function () {},
      onEsci: function () { if (Sx.chiuso) return; Sx.chiuso = true; fermaLuce(M.ui); if (rete) rete.chiudi(); t.esci(); } };
    attesa(t, Sx, "👀 Mi collego alla partita…", cb.onEsci);
    rete = SGNet.entra(codice, {
      onMsg: function (m) {
        if (Sx.chiuso || !m || m.t !== "vm" || !m.vm || typeof m.vm.c !== "string") return;
        if (m.vm.fase === "lobby") { M.fase = "lobby"; return attesa(t, Sx, "👀 La partita sta per cominciare…", cb.onEsci); }
        Sx.scritta = null;
        campo(t, M, m.vm, cb, true);
      },
      onChiuso: function () { cb.onEsci(); },
      onErrore: function () { if (!Sx.chiuso) errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
    });
  }

  function avatarOk(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // l'avversario di questa stanza, ricordato sul telefono dell'host: se la pagina dell'host si ricarica (la stanza si
  // riapre con lo stesso codice), per 15 secondi il posto resta a chi giocava, non a chi guardava ed è stato più svelto
  function ricordaAvv(codice, id) { try { if (codice && codice !== "…") localStorage.setItem("sg-avv-" + ID, JSON.stringify({ c: codice, id: id || null, t: Date.now() })); } catch (e) {} }
  function riservaAvv(codice) {
    try { var x = JSON.parse(localStorage.getItem("sg-avv-" + ID) || "null"); if (x && x.c === codice && x.id && Date.now() - x.t < 20 * 60000) return { id: x.id, fino: Date.now() + 15000 }; } catch (e) {}
    return null;
  }
  function postoRiservato(r, id) { return !!(r && r.id !== id && Date.now() < r.fino); }
  // la saletta d'attesa (uguale per tutti i giochi): tu e il tuo avversario
  function lobbyG(t, vm, cb) {
    var io = !cb.sonoHost && !!cb.myId && vm.avvId === cb.myId, guardo = !cb.sonoHost && !!vm.avvId && !io;
    var om = vm.omini || {}, gio = [{ id: "X", nome: vm.nomi.X, omino: om.X || null, host: true, tu: !!cb.sonoHost }];
    if (vm.avversario) gio.push({ id: vm.avvId || "O", nome: vm.nomi.O, omino: om.O || null, tu: io });
    var nota = null, extra = [], caso = (vm.sospesa ? vm.modalita : vm.prossima) === "caso";
    if (cb.sonoHost) {
      nota = vm.avviso ? vm.avviso + " " : "";
      if (vm.sospesa) nota += vm.avversario ? "La partita era a metà: riprendila da dove era rimasta, o ricomincia da capo." : "Quando rientra (o entra un altro), la partita riprende da dove era rimasta.";
      else nota += vm.avversario ? "✅ Avversario collegato! Quando vuoi, comincia." : "Invita il tuo avversario col tasto 📤.";
      if (vm.sospesa && vm.avversario && cb.ricomincia) extra.push(cb.ricomincia);
    }
    var att = guardo ? "👀 Giocano " + vm.nomi.X + " e " + vm.nomi.O + ": tu guardi."
      : (!cb.sonoHost && !io) ? "⏳ Entro nella partita…"
      : (vm.sospesa ? "La partita era a metà: aspetta che " + vm.nomi.X + " la riprenda." : "Aspetta che " + vm.nomi.X + " cominci: tu giochi con la O.");
    att += caso ? " Si gioca a 🎲 Campo a caso." : " Si gioca alla 🧠 Classica.";
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: 2, vuoti: vm.avversario ? 0 : 1, giocatori: gio, extra: extra,
      testoComincia: vm.sospesa ? "▶ Riprendi la partita" : null,
      nota: nota, attesa: att, onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function attesa(t, Sx, txt, onEsci) {
    if (Sx.scritta === txt) return; Sx.scritta = txt;
    stile();
    var s = t.schermata({ indietro: onEsci });
    s._contenuto.appendChild(t.el("p", { class: "modulo-nota guarda-attesa tg-attesa", text: txt }));
    if (!t.linkParams || !t.linkParams.guarda) s._piede.appendChild(t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: onEsci }));
    else if (t.eliminazione && t.faccine) { var fa = t.faccine(); if (fa) s._piede.appendChild(fa); }
    t.mostra(s);
  }
  function chiusa(t, vm, sparito) {
    var host = (vm && vm.nomi && vm.nomi.X) || "L'host";
    var s = t.schermata({ icona: "🏁", titolo: "Partita chiusa" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.1rem;line-height:1.5;text-align:center", text: sparito ? host + " non risponde più: la partita è finita." : host + " ha chiuso la partita." }));
    if (vm && vm.punti && vm.n) {
      var p = vm.punti;
      s._contenuto.appendChild(t.el("p", { style: "font-size:1.35rem;font-weight:900;text-align:center;margin-top:10px",
        html: "<span style='color:" + CX + "'>" + esc(vm.nomi.X) + "</span> " + cifre(p.X) + " – " + cifre(p.O) + " <span style='color:" + CO + "'>" + esc(vm.nomi.O) + "</span>" + (p.pari ? "<br><small style='font-size:.85rem;opacity:.75'>" + cifre(p.pari) + " pareggi</small>" : "") }));
    }
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function errore(t, txt) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { text: txt, style: "font-size:1.05rem;line-height:1.5" }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna all'inizio", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5",
      text: "La modalità online funziona quando il gioco è aperto dal sito pubblicato. Da un file locale non è disponibile: intanto gioca contro il Bot o in due sullo stesso telefono." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }
})();

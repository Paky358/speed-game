/* =========================================================
   CALCIO BILIARDO — il calcio coi dischi, come il biliardo
   Ognuno ha 5 calciatori (dischi). A turno se ne tira uno: lo tocchi,
   tiri indietro il dito come una fionda e lasci. I dischi colpiscono la
   palla e gli altri dischi e rimbalzano sui bordi: fai gol nella porta
   avversaria. Vince chi arriva per primo ai gol scelti.
   Modi: contro il computer (Bot), in due sullo stesso telefono (uno per
   lato, il telefono in mezzo), online (ognuno dal suo: l'host decide il
   tiro vero, gli altri lo rivedono uguale e poi si allineano alla sua foto).
   La fisica sta in funzioni a parte (passo/simula): la usa anche Bot,
   che prova tanti tiri "per finta" e sceglie il migliore.
   ========================================================= */
(function () {
  "use strict";

  var ID = "calciobiliardo";
  var MIN = 2, MAX = 2;          // online: in due
  // le domande ("Uscire dalla partita?") con la finestra al centro dell'app, mai quella del browser
  function chiedi(t, dom, fn) { if (t && t.conferma) t.conferma(dom, fn); else if (window.confirm(dom)) fn(); }

  // ---------- il campo (misure in "larghezze di campo") ----------
  var W = 1, L = 1.55, PORTA = 0.38, FONDO = 0.07;
  var PL = (W - PORTA) / 2, PR = (W + PORTA) / 2;              // i pali
  var R = 0.05, RP = 0.031, MD = 1, MP = 0.55;                 // raggio e peso: calciatori e palla (la palla un po' pesante: parte meno sparata)
  var DT = 1 / 240, VMAX = 2.6, TIRA = 0.22;                   // TIRA = quanto si tira indietro il dito per la forza piena
  // attrito dell'erba: una parte che rallenta sempre e una che frena forte alla fine (niente palla che striscia piano piano)
  var ATT_D = Math.exp(-1.2 * DT), ATT_P = Math.exp(-0.85 * DT), DEC = 0.8 * DT;
  var E_URTO = 0.82, E_MURO = 0.72;                            // urti più morbidi del biliardo
  var MAX_SEC = 8;                                             // un tiro dura al massimo 8 secondi
  var TEMPO = 30;                                              // online: secondi per tirare
  var GIALLO = "#ffcc1f", BLU = "#2f7dff", NOTTE = "#0d1533";   // le due squadre: gialli (sotto) e blu (sopra)
  function colore(q) { return q === 0 ? GIALLO : BLU; }
  // ---- faccine e frasi durante la partita (il pezzo comune è in scopa.js: window.SGChiacchiere) ----
  function CH() { return window.SGChiacchiere || null; }
  // l'host: una chiacchiera arrivata da un telefono (chi gioca coi blu: frasi e faccine; chi guarda: solo faccine)
  function chiacDaOspite(ch, acceso, filtra, id, m, giocatore) {
    if (!ch || !acceso || !filtra(id)) return null;
    var c = String(m.c || ""); if (!ch.valido(ID, c, !giocatore)) return null;
    var x = { t: "chiac", k: giocatore ? 1 : "g", id: id, c: c };
    if (!giocatore) x.n = ch.nomeDi(m.n);
    return x;
  }
  // le formazioni: [x, distanza dalla PROPRIA linea di fondo]; il primo è il portiere,
  // l'ultimo è l'attaccante (si mette a centrocampo e ha la faccia di chi gioca)
  var FORMAZIONI = {
    classica:   { nome: "Classica",    icona: "⚽", pos: [[0.5, 0.075], [0.2, 0.36], [0.5, 0.42], [0.8, 0.36], [0.5, 0]] },
    catenaccio: { nome: "Catenaccio",  icona: "🛡️", pos: [[0.5, 0.075], [0.28, 0.22], [0.72, 0.22], [0.5, 0.38], [0.5, 0]] },
    attacco:    { nome: "All'attacco", icona: "⚔️", pos: [[0.5, 0.075], [0.5, 0.33], [0.2, 0.58], [0.8, 0.58], [0.5, 0]] },
    rombo:      { nome: "Rombo",       icona: "💎", pos: [[0.5, 0.075], [0.5, 0.22], [0.22, 0.42], [0.78, 0.42], [0.5, 0]] },
    muro:       { nome: "Muro",        icona: "🧱", pos: [[0.5, 0.075], [0.25, 0.21], [0.5, 0.21], [0.75, 0.21], [0.5, 0]] }
  };
  var NOMI_FORM = ["classica", "catenaccio", "attacco", "rombo", "muro"];
  function nomeForm(f) { var F = FORMAZIONI[formOk(f)]; return F.icona + " " + F.nome; }
  function formOk(f) { return FORMAZIONI[f] ? f : "classica"; }
  function attaccante(q) { return q === 0 ? 5 : 10; }   // il corpo dell'attaccante di ogni squadra
  function portiere(q) { return q === 0 ? 1 : 6; }
  var RIGORI = 3;   // rigori a testa (poi a oltranza)

  function avatarValido(o) { return o && typeof o === "object" && JSON.stringify(o).length < 3000 ? o : null; }
  // l'avversario di questa stanza, ricordato sul telefono dell'host: se la pagina dell'host si ricarica (la stanza si
  // riapre con lo stesso codice), per 15 secondi il posto resta a chi giocava, non a chi guardava ed è stato più svelto
  function ricordaAvv(gioco, codice, id) { try { if (codice && codice !== "…") localStorage.setItem("sg-avv-" + gioco, JSON.stringify({ c: codice, id: id || null, t: Date.now() })); } catch (e) {} }
  function riservaAvv(gioco, codice) {
    try { var x = JSON.parse(localStorage.getItem("sg-avv-" + gioco) || "null"); if (x && x.c === codice && x.id && Date.now() - x.t < 20 * 60000) return { id: x.id, fino: Date.now() + 15000 }; } catch (e) {}
    return null;
  }
  function postoRiservato(r, id) { return !!(r && r.id !== id && Date.now() < r.fino); }   // true = questo posto non è (ancora) per lui
  function r4(v) { return Math.round(v * 10000) / 10000; }

  // =========================================================
  //  FISICA (pura: niente disegno). Corpo 0 = palla, 1-5 gialli (sotto), 6-10 blu (sopra)
  // =========================================================
  // batte = la squadra che dà il calcio d'inizio (il suo attaccante sta vicino alla palla); form = [formazione gialli, formazione blu]
  function nuovoStato(batte, form) {
    var s = { x: [W / 2], y: [L / 2], vx: [0], vy: [0] };
    for (var q = 0; q < 2; q++) for (var k = 0; k < 5; k++) {
      var f = FORMAZIONI[formOk(form && form[q])].pos[k], d = k === 4 ? L / 2 - (q === batte ? 0.1 : 0.21) : f[1];
      s.x.push(q === 0 ? f[0] : W - f[0]); s.y.push(q === 0 ? L - d : d); s.vx.push(0); s.vy.push(0);
    }
    return s;
  }
  // un rigore: tira l'attaccante di q, in porta c'è il portiere dell'altra squadra (in un punto a caso della porta),
  // gli altri guardano dai bordi del campo
  function statoRigore(q, form) {
    var s = nuovoStato(q, form), att = attaccante(q), gk = portiere(1 - q);
    var porta = q === 0 ? 0 : L, dir = q === 0 ? 1 : -1, k = 0;
    s.x[0] = W / 2; s.y[0] = porta + dir * 0.27;
    s.x[att] = W / 2; s.y[att] = porta + dir * 0.41;
    s.x[gk] = PL + R + Math.random() * (PORTA - 2 * R); s.y[gk] = porta + dir * 0.075;
    for (var i = 1; i <= 10; i++) {
      if (i === att || i === gk) continue;
      s.x[i] = squadraDi(i) === 0 ? R + 0.01 : W - R - 0.01; s.y[i] = L / 2 - 0.36 + (k % 4) * 0.24; k++;
    }
    return s;
  }
  function copia(s) { return { x: s.x.slice(), y: s.y.slice(), vx: s.vx.slice(), vy: s.vy.slice() }; }
  function daFoto(f) { var n = f.x.length, z = []; for (var i = 0; i < n; i++) z.push(0); return { x: f.x.slice(), y: f.y.slice(), vx: z.slice(), vy: z.slice() }; }
  function rag(i) { return i === 0 ? RP : R; }
  function mas(i) { return i === 0 ? MP : MD; }
  function squadraDi(i) { return i === 0 ? -1 : (i <= 5 ? 0 : 1); }
  function fermo(s) { for (var i = 0; i < 11; i++) if (s.vx[i] || s.vy[i]) return false; return true; }
  function ferma(s) { for (var i = 0; i < 11; i++) { s.vx[i] = 0; s.vy[i] = 0; } }
  function palo(s, px, py, ev) {   // i pali: la palla ci rimbalza come su un punto
    var dx = s.x[0] - px, dy = s.y[0] - py, d2 = dx * dx + dy * dy;
    if (d2 >= RP * RP || d2 === 0) return;
    var d = Math.sqrt(d2), nx = dx / d, ny = dy / d, vn = s.vx[0] * nx + s.vy[0] * ny;
    s.x[0] = px + nx * RP; s.y[0] = py + ny * RP; s.pa = 1;   // la palla ha preso il palo (per l'esultanza e i trofei)
    if (vn < 0) { s.vx[0] -= (1 + E_MURO) * vn * nx; s.vy[0] -= (1 + E_MURO) * vn * ny; if (ev) ev.palo = Math.max(ev.palo || 0, -vn); }
  }
  function muri(s, i, ev) {
    var r = rag(i), x = s.x[i], y = s.y[i], v;
    if (i === 0 && (y < 0 || y > L)) {   // la palla dentro una porta: la rete ai lati e in fondo
      if (x < PL + r) { s.x[0] = PL + r; s.vx[0] = Math.abs(s.vx[0]) * 0.4; }
      if (x > PR - r) { s.x[0] = PR - r; s.vx[0] = -Math.abs(s.vx[0]) * 0.4; }
      if (y < -FONDO + r) { s.y[0] = -FONDO + r; s.vy[0] = Math.abs(s.vy[0]) * 0.25; }
      if (y > L + FONDO - r) { s.y[0] = L + FONDO - r; s.vy[0] = -Math.abs(s.vy[0]) * 0.25; }
      return;
    }
    if (x < r) { v = -s.vx[i]; s.x[i] = r; if (v > 0) { s.vx[i] = v * E_MURO; if (ev) ev.muro = Math.max(ev.muro, v); if (i === 0) s.sp = 1; } }
    if (x > W - r) { v = s.vx[i]; s.x[i] = W - r; if (v > 0) { s.vx[i] = -v * E_MURO; if (ev) ev.muro = Math.max(ev.muro, v); if (i === 0) s.sp = 1; } }
    var bocca = i === 0 && x > PL && x < PR;   // davanti alla porta passa solo la palla
    if (y < r && !bocca) { v = -s.vy[i]; s.y[i] = r; if (v > 0) { s.vy[i] = v * E_MURO; if (ev) ev.muro = Math.max(ev.muro, v); if (i === 0) s.sp = 1; } }
    if (y > L - r && !bocca) { v = s.vy[i]; s.y[i] = L - r; if (v > 0) { s.vy[i] = -v * E_MURO; if (ev) ev.muro = Math.max(ev.muro, v); if (i === 0) s.sp = 1; } }
    if (i === 0) { palo(s, PL, 0, ev); palo(s, PR, 0, ev); palo(s, PL, L, ev); palo(s, PR, L, ev); }
  }
  function urto(s, i, j, ev) {
    var dx = s.x[j] - s.x[i], dy = s.y[j] - s.y[i], rr = rag(i) + rag(j), d2 = dx * dx + dy * dy;
    if (d2 >= rr * rr) return;
    if (i === 0) s.lt = j; else if (j === 0) s.lt = i;   // l'ultimo calciatore che ha toccato la palla
    var d = Math.sqrt(d2) || 1e-6, nx = dx / d, ny = dy / d, mi = mas(i), mj = mas(j), mt = mi + mj, sov = rr - d;
    s.x[i] -= nx * sov * mj / mt; s.y[i] -= ny * sov * mj / mt; s.x[j] += nx * sov * mi / mt; s.y[j] += ny * sov * mi / mt;
    var rv = (s.vx[j] - s.vx[i]) * nx + (s.vy[j] - s.vy[i]) * ny;
    if (rv >= 0) return;
    var J = -(1 + E_URTO) * rv / (1 / mi + 1 / mj);
    s.vx[i] -= J * nx / mi; s.vy[i] -= J * ny / mi; s.vx[j] += J * nx / mj; s.vy[j] += J * ny / mj;
    if (ev) { var k2 = (i === 0 || j === 0) ? "calcio" : "dischi"; ev[k2] = Math.max(ev[k2] || 0, -rv); }   // calcio alla palla o scontro tra calciatori
  }
  // un passo di fisica; ritorna la squadra che ha segnato (0 = gialli nella porta in alto, 1 = blu in quella in basso) o -1
  function passo(s, ev) {
    var i, j;
    for (i = 0; i < 11; i++) {
      var vx = s.vx[i], vy = s.vy[i];
      if (!vx && !vy) continue;
      var a = i === 0 ? ATT_P : ATT_D; vx *= a; vy *= a;
      var v = Math.sqrt(vx * vx + vy * vy);
      if (v <= DEC) { vx = 0; vy = 0; } else { var k = (v - DEC) / v; vx *= k; vy *= k; }
      s.vx[i] = vx; s.vy[i] = vy; s.x[i] += vx * DT; s.y[i] += vy * DT;
    }
    for (i = 0; i < 11; i++) muri(s, i, ev);
    for (i = 0; i < 11; i++) for (j = i + 1; j < 11; j++) urto(s, i, j, ev);
    for (i = 0; i < 11; i++) muri(s, i, null);
    if (s.y[0] < -RP) return 0;
    if (s.y[0] > L + RP) return 1;
    // la palla si è fermata col centro oltre la linea (dentro la porta): è gol lo stesso, "sulla linea"
    if (!s.vx[0] && !s.vy[0]) { if (s.y[0] < 0) { s.li = 1; return 0; } if (s.y[0] > L) { s.li = 1; return 1; } }
    return -1;
  }
  function simula(s, sec) {   // fa andare il tiro fino alla fine (per Bot e per le prove); s.passi = quanti passi è durato
    var n = Math.round((sec || MAX_SEC) / DT);
    for (var k = 0; k < n; k++) { var g = passo(s, null); if (g >= 0) { s.passi = k + 1; return g; } if (fermo(s)) { s.passi = k + 1; return -1; } }
    s.passi = n; ferma(s); return -1;
  }

  // =========================================================
  //  BOT: prova tanti tiri per finta e sceglie quello che gli conviene
  // =========================================================
  function valuta(t, gol, q, prima) {
    if (gol === q) return 100000;
    if (gol === 1 - q) return -100000;
    var v = (q === 1 ? t.y[0] : L - t.y[0]) * 100;                      // palla lontana dalla mia porta
    var miaPorta = q === 1 ? 0 : L;
    if (Math.hypot(t.x[0] - W / 2, t.y[0] - miaPorta) < 0.4) v -= 250;  // pericolo sotto la mia porta
    if (Math.hypot(t.x[0] - prima.x[0], t.y[0] - prima.y[0]) < 0.01) v -= 150;   // non ho toccato la palla
    var gk = q === 0 ? 1 : 6;
    v -= Math.abs(t.y[gk] - (q === 0 ? L - 0.075 : 0.075)) * 60;         // il portiere resta in porta
    return v;
  }
  // fatto(scelta): Bot pensa a pezzetti (12 ms per volta) così lo schermo non si blocca; senza fatto ritorna subito la scelta
  function sceltaBot(s, q, liv, solo, fatto) {   // solo = un calciatore preciso (nei rigori tira l'attaccante)
    var gy = q === 1 ? L + 0.05 : -0.05, cand = [];
    var bersagli = liv === "facile" ? [W / 2] : [W / 2, PL + 0.06, PR - 0.06];
    var forze = liv === "facile" ? [0.75] : (liv === "medio" ? [0.6, 0.9] : [0.5, 0.75, 1]);
    for (var i = 1; i <= 10; i++) {
      if (solo && i !== solo) continue;
      if (squadraDi(i) !== q) continue;
      bersagli.forEach(function (tx) {
        var dx = tx - s.x[0], dy = gy - s.y[0], d = Math.hypot(dx, dy) || 1;
        var gx = s.x[0] - dx / d * (R + RP), gyy = s.y[0] - dy / d * (R + RP);   // "palla fantasma": dove colpirla per mandarla in porta
        var a = Math.atan2(gyy - s.y[i], gx - s.x[i]);
        forze.forEach(function (p) {
          cand.push({ i: i, a: a, p: p });
          if (liv === "difficile") { cand.push({ i: i, a: a + 0.035, p: p }); cand.push({ i: i, a: a - 0.035, p: p }); }
        });
      });
      cand.push({ i: i, a: Math.atan2(s.y[0] - s.y[i], s.x[0] - s.x[i]), p: 1 });   // dritto sulla palla, per spazzarla via
    }
    function prova(i, a, p) { var t = copia(s); t.vx[i] = Math.cos(a) * VMAX * p; t.vy[i] = Math.sin(a) * VMAX * p; return valuta(t, simula(t, 6), q, s); }
    var rum = { facile: 0.16, medio: 0.06, difficile: 0.015 }[liv] || 0.06;
    // i lavori da fare, in ordine: prima ogni tiro una volta, poi i 6 migliori con un po' di errore di mira
    var k = 0, top = null, best = null, bv = -Infinity;
    function unLavoro() {
      if (k < cand.length) { var c = cand[k++]; c.v = prova(c.i, c.a, c.p); return true; }
      if (!top) { cand.sort(function (a, b) { return b.v - a.v; }); top = cand.slice(0, 6); best = cand[0]; }
      // se sbagliando di poco finirebbero in autogol, valgono quanto il caso peggiore (così Bot è prudente)
      var c2 = top.shift(); if (!c2) return false;
      var v = Math.min(c2.v, prova(c2.i, c2.a + rum, c2.p), prova(c2.i, c2.a - rum, c2.p));
      if (v > bv) { bv = v; best = c2; }
      return true;
    }
    function scelta() { return { i: best.i, a: best.a + (Math.random() * 2 - 1) * rum, p: Math.max(0.3, Math.min(1, best.p + (Math.random() * 2 - 1) * rum)) }; }
    if (!fatto) { while (unLavoro()) {} return scelta(); }
    (function pezzo() {
      var t0 = Date.now(), ancora = true;
      while (ancora && Date.now() - t0 < 12) ancora = unLavoro();
      if (ancora) setTimeout(pezzo, 0); else fatto(scelta());
    })();
  }

  // =========================================================
  //  SUONI DA STADIO: registrazioni vere (Mixkit, uso libero anche nelle app) in suoni/calcio/:
  //  la folla coi cori sotto la partita, le urla al gol, il calcio al pallone, il colpo sul palo.
  //  Fatti col codice restano solo il "clac" dei calciatori e il tonfo sulle sponde.
  //  Si scaricano solo quando si gioca a Calcio Biliardo. Si spengono col tasto 🔊 (resta ricordato).
  //  Vibrazione solo quando prendi un calciatore.
  // =========================================================
  var CHIAVE_SUONI = "sg-cb-suoni";
  var REGISTRAZIONI = { folla: "suoni/calcio/folla.mp3", gol: "suoni/calcio/gol.mp3", palo: "suoni/calcio/palo.mp3", calcio: "suoni/calcio/calcio.mp3",
    uuuh: "suoni/calcio/uuuh.mp3" };   // uuuh: Pixabay ("Crowd Disappointment Reaction", uso libero)
  var BUF = {}, caricati = false, FOLLA = null, follaVoluta = false;
  function suoniOn() { try { return localStorage.getItem(CHIAVE_SUONI) !== "0"; } catch (e) { return true; } }
  function ac() { if (MUTO || !suoniOn()) return null; try { return (window.SG && SG.audioCtx && SG.audioCtx()) || null; } catch (e) { return null; } }
  function caricaSuoni() {
    var c = ac(); if (!c || caricati || !window.fetch) return; caricati = true;
    Object.keys(REGISTRAZIONI).forEach(function (k) {
      fetch(REGISTRAZIONI[k]).then(function (r) { if (!r.ok) throw new Error("manca"); return r.arrayBuffer(); })
        .then(function (dati) { return new Promise(function (ok, no) { c.decodeAudioData(dati, ok, no); }); })
        .then(function (b) { BUF[k] = b; if (k === "folla" && follaVoluta) follaAvvia(); })
        .catch(function () {});
    });
  }
  function suona(k, vol, vel) {   // fa partire una registrazione (vol 0-1, vel = velocità per non sentirla sempre uguale)
    var c = ac(), b = BUF[k]; if (!c || !b) return null;
    try {
      var s = c.createBufferSource(), g = c.createGain(); s.buffer = b; if (vel) s.playbackRate.value = vel;
      g.gain.value = vol; s.connect(g); g.connect(c.destination); s.start(); return { s: s, g: g, c: c };
    } catch (e) { return null; }
  }
  var ultimi = {};
  function presto(k, ms) { var n = Date.now(); if (n - (ultimi[k] || 0) < ms) return true; ultimi[k] = n; return false; }
  function nota(c, t0, tipo, f0, f1, picco, durata) {   // un suono corto fatto col codice (per clac e tonfi)
    var o = c.createOscillator(), g = c.createGain(); o.type = tipo;
    o.frequency.setValueAtTime(f0, t0); o.frequency.exponentialRampToValueAtTime(f1, t0 + durata);
    g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(picco, t0 + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t0 + durata);
    o.connect(g); g.connect(c.destination); o.start(t0); o.stop(t0 + durata + 0.05);
  }
  function sCalcio(f) {   // il calcio al pallone (registrazione vera), più forte se il colpo è forte
    if (presto("calcio", 70)) return; var k = Math.min(1, f);
    suona("calcio", 0.25 + 0.75 * k, 0.94 + Math.random() * 0.12);
  }
  function sDischi(f) {   // due calciatori che si scontrano: "clac"
    var c = ac(); if (!c || presto("dischi", 50)) return; var k = Math.min(1, f);
    try { nota(c, c.currentTime, "triangle", 1100, 500, 0.04 + 0.12 * k, 0.05); } catch (e) {}
  }
  function sSponda(f) {   // contro il bordo: un tonfo
    var c = ac(); if (!c || presto("sponda", 70)) return; var k = Math.min(1, f);
    try { nota(c, c.currentTime, "sine", 120, 58, 0.06 + 0.2 * k, 0.12); } catch (e) {}
  }
  function sPalo(f) {   // il palo: colpo sul metallo (registrazione vera)
    if (presto("palo", 300)) return;
    suona("palo", 0.35 + 0.6 * Math.min(1, f), 0.9 + Math.random() * 0.1);
    if (f > 0.25) setTimeout(sUuuh, 120);   // e la folla fa "uuuh"
  }
  function sUuuh() { if (!presto("uuuh", 1500)) suona("uuuh", 0.85); }   // occasione sprecata (palo, rigore sbagliato)
  function sGol() {   // le urla dei tifosi e la folla che si alza per un momento
    suona("gol", 1);
    if (FOLLA) { try { var t = FOLLA.c.currentTime; FOLLA.g.gain.cancelScheduledValues(t); FOLLA.g.gain.setValueAtTime(0.5, t); FOLLA.g.gain.linearRampToValueAtTime(0.22, t + 6); } catch (e) {} }
  }
  // la folla coi cori, sempre sotto la partita (piano), in giro continuo
  function follaAvvia() {
    follaVoluta = true;
    var c = ac(); if (!c || FOLLA) return;
    if (!BUF.folla) { caricaSuoni(); return; }   // parte appena è scaricata
    var f = suona("folla", 0.0001); if (!f) return;
    f.s.loop = true;
    try { f.g.gain.setValueAtTime(0.0001, c.currentTime); f.g.gain.exponentialRampToValueAtTime(0.22, c.currentTime + 1.5); } catch (e) {}
    FOLLA = f;
  }
  function follaFerma() {
    follaVoluta = false;
    var F = FOLLA; FOLLA = null; if (!F) return;
    try { var t = F.c.currentTime; F.g.gain.cancelScheduledValues(t); F.g.gain.setValueAtTime(0.2, t); F.g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6); F.s.stop(t + 0.7); } catch (e) {}
  }
  function vibra(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  // =========================================================
  //  LO SCHERMO DI GIOCO (uguale per tutti i modi): campo su tela, il resto a pezzi
  //  o = { flip: la mia squadra è la blu (la giro in basso), ruota: in due sullo stesso telefono,
  //        nomi: [gialli, blu], omini: [gialli, blu], muto: chi guarda (niente suoni),
  //        targa: chi guarda soltanto fuori dal torneo (in basso c'è la targhetta del core: il campo le lascia il posto),
  //        fila: chi guarda il torneo a eliminazione (funzione che dà la fila delle faccine del core: la apre il 😂) }
  //  cb = { onTiro(i, vx, vy), onEsci() }
  // =========================================================
  var MUTO = false;   // chi guarda la partita di altri non sente niente (farebbe solo confusione nella stanza)
  function creaSchermo(t, cb, o) {
    stile();
    MUTO = !!o.muto;
    var el = t.el, s = t.schermata({}); s.classList.add("cb-piena");
    var ui = { t: t, cb: cb, o: o, st: null, anim: null, mira: null, zoom: 1, turno: 0, fase: "mira", puoi: false, mie: [], solo: null,
      eventoVisto: null, scadenza: null, fineTempo: null, testo: { giu: "", su: "" }, facce: [null, null], avviso: null, stDopo: null };
    var scena = el("div", { class: "cb-scena" + (o.ruota ? " ruota" : "") + (o.targa ? " con-targa" : "") });
    ui.basso = o.targa ? 54 : 0;   // (il posto della targhetta di chi guarda, sotto la targhetta in basso)
    ui.cv = el("canvas", { class: "cb-campo" }); ui.ctx = ui.cv.getContext("2d");
    var esci = el("button", { class: "cb-esci", "aria-label": "Esci", text: "‹", onclick: function () { cb.onEsci(); if (!vivo()) follaFerma(); } });
    var audio = el("button", { class: "cb-audio", "aria-label": "Suoni", text: suoniOn() ? "🔊" : "🔇", onclick: function () {
      var on = !suoniOn(); try { localStorage.setItem(CHIAVE_SUONI, on ? "1" : "0"); } catch (e) {}
      audio.textContent = on ? "🔊" : "🔇";
      if (on) follaAvvia(); else follaFerma();
    } });
    if (o.muto) audio.style.display = "none";
    ui.orologio = el("div", { class: "cb-orologio", hidden: "hidden" });
    // in due sullo stesso telefono l'orologio c'è anche girato, per chi sta in alto (nel suo angolo in alto a destra)
    ui.orologio2 = o.ruota ? el("div", { class: "cb-orologio girato", hidden: "hidden" }) : null;
    // la targhetta di ognuno, vicino alla sua porta: avatar piccolo, nome, "tocca a te" e i suoi gol
    function targa(cls, q) {
      var av = el("div", { class: "cb-av" }), msg = el("div", { class: "cb-msg" }), gol = el("div", { class: "cb-golnum", text: "0" });
      var box = el("div", { class: "cb-targa " + cls }, [av, el("div", { class: "cb-testi" }, [el("div", { class: "cb-nome", text: (o.nomi && o.nomi[q]) || "" }), msg]), gol]);
      box.style.setProperty("--sq", colore(q));
      var cfg = o.omini && o.omini[q];
      if (cfg && window.SGOmino) {
        var svg = SGOmino.svg(cfg, { busto: true });
        av.innerHTML = svg;
        var im = new Image(); im.onload = function () { ui.facce[q] = im; if (ui.S) sprites(ui); if (!ui.anim) disegna(ui); };   // la faccia sull'attaccante
        im.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
      }
      return { box: box, msg: msg, gol: gol };
    }
    var qGiu = o.flip ? 1 : 0;
    ui.giu = targa("giu", qGiu); ui.su = targa("su" + (o.ruota ? " ruota" : ""), 1 - qGiu);
    ui.festa = el("div", { class: "cb-festa" });   // l'esultanza: avatar, scritta, coriandoli
    // 💬 faccine e frasi, in basso a destra (contro il Bot; online se l'host le ha lasciate accese; chi guarda il torneo: faccine)
    ui.bChiac = o.chiac && CH() ? CH().tasto({ gioco: ID, soloFaccine: !!o.soloFaccine, onScegli: o.chiac }) : null;
    if (ui.bChiac) { ui.bChiac.classList.add("cb-chiac"); ui.bChiac.hidden = !o.chiacSubito; }
    // chi guarda il torneo a eliminazione: al posto del 💬 un 😂 che apre (e chiude) la fila delle faccine del core
    ui.bFa = null; ui.fila = null;
    if (o.fila) {
      ui.bFa = el("button", { class: "cb-fa cb-chiac", type: "button", "aria-label": "Faccine", "aria-expanded": "false", text: "😂" });
      ui.bFa.addEventListener("click", function () {
        if (ui.fila) { if (ui.fila.parentNode) ui.fila.parentNode.removeChild(ui.fila); ui.fila = null; ui.bFa.setAttribute("aria-expanded", "false"); return; }
        var f = o.fila(); if (!f) return;
        ui.fila = el("div", { class: "cb-fila" }, [f]); scena.appendChild(ui.fila); ui.bFa.setAttribute("aria-expanded", "true");
      });
    }
    [ui.cv, ui.su.box, ui.giu.box, esci, audio, ui.orologio, ui.orologio2, ui.festa, ui.bChiac, ui.bFa].forEach(function (n) { if (n) scena.appendChild(n); });
    s._contenuto.appendChild(scena);
    t.mostra(s);
    if (s.querySelector(".tab-elim")) ui.orologio.classList.add("sotto");   // nel torneo in alto a destra c'è il tasto 🏆
    if (!o.muto) follaAvvia();   // la folla dello stadio, piano, sotto la partita

    function vivo() { return document.body.contains(ui.cv); }
    function misura() {
      if (!vivo()) { window.removeEventListener("resize", misura); return; }
      var cw = scena.clientWidth || 360, ch = scena.clientHeight || 640, dpr = Math.min(2, window.devicePixelRatio || 1);
      ui.cv.width = Math.round(cw * dpr); ui.cv.height = Math.round(ch * dpr); ui.cw = cw; ui.ch = ch; ui.dpr = dpr;
      ui.S = Math.min((cw - 20) / W, (ch - ui.basso - 2 * 62) / (L + 2 * FONDO));   // il campo più grande possibile: restano solo le targhette
      ui.ox = (cw - ui.S * W) / 2; ui.oy = (ch - ui.basso - ui.S * L) / 2;
      sfondo(ui); sprites(ui); disegna(ui);
    }
    window.addEventListener("resize", misura);
    misura();

    // dal dito allo schermo e al campo (anche col campo girato e con la telecamera alzata)
    function alDito(e) { var r = ui.cv.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; }
    function alCampo(e) {
      var p = alDito(e), z = ui.zoom || 1;
      var sx = ui.cw / 2 + (p.x - ui.cw / 2) / z, sy = ui.ch / 2 + (p.y - ui.ch / 2) / z;
      var x = (sx - ui.ox) / ui.S, y = (sy - ui.oy) / ui.S;
      return o.flip ? { x: W - x, y: L - y } : { x: x, y: y };
    }
    ui.cv.addEventListener("pointerdown", function (e) {
      if (!ui.puoi || ui.anim || !ui.st) return;
      var p = alCampo(e), best = -1, bd = R * 1.7;
      for (var i = 1; i <= 10; i++) {
        var q = squadraDi(i); if (q !== ui.turno || ui.mie.indexOf(q) < 0 || (ui.solo && i !== ui.solo)) continue;
        var d = Math.hypot(ui.st.x[i] - p.x, ui.st.y[i] - p.y); if (d < bd) { bd = d; best = i; }
      }
      if (best < 0) return;
      e.preventDefault(); try { ui.cv.setPointerCapture(e.pointerId); } catch (er) {}
      var f = alDito(e);
      ui.mira = { i: best, x0: f.x, y0: f.y, x: f.x, y: f.y, id: e.pointerId };
      vibra(8); try { if (window.SG && SG.audioCtx) SG.audioCtx(); } catch (er2) {}
      follaAvvia();
      gira();
    });
    ui.cv.addEventListener("pointermove", function (e) {
      if (!ui.mira || e.pointerId !== ui.mira.id) return;
      var f = alDito(e); ui.mira.x = f.x; ui.mira.y = f.y;
    });
    function lascia(e) {
      var m = ui.mira; if (!m || e.pointerId !== m.id) return;
      var fz = forza(ui); ui.mira = null;
      if (e.type === "pointerup" && fz.p >= 0.07 && ui.puoi) { cb.onTiro(m.i, fz.ux * VMAX * fz.p, fz.uy * VMAX * fz.p); }
      gira();
    }
    ui.cv.addEventListener("pointerup", lascia);
    ui.cv.addEventListener("pointercancel", lascia);

    // il giro di disegno: gira solo mentre si mira, mentre un tiro corre o mentre la telecamera torna giù
    function gira() { if (!ui.raf) ui.raf = requestAnimationFrame(loop); }
    function loop(now) {
      ui.raf = null;
      if (!vivo()) return;
      // la telecamera: più tiri forte, più si alza (il campo si rimpicciolisce e c'è più posto per il dito)
      var zMira = ui.mira ? 1 - ZOOM_MAX * forza(ui).p : 1;
      ui.zoom += (zMira - ui.zoom) * 0.22; if (Math.abs(zMira - ui.zoom) < 0.002) ui.zoom = zMira;
      var A = ui.anim;
      if (A) {
        var dt = A.ult ? Math.min(0.05, (now - A.ult) / 1000) : 0; A.ult = now; A.acc += dt;
        var ev = { calcio: 0, dischi: 0, muro: 0, palo: 0 }, g = -1, fine = false;
        while (A.acc >= DT) {
          A.acc -= DT; A.passi++; g = passo(A.s, ev);
          if (g >= 0 || fermo(A.s) || A.passi > MAX_SEC / DT) { fine = true; break; }
        }
        if (ev.calcio > 0.06) sCalcio(ev.calcio / 2.4);
        if (ev.dischi > 0.06) sDischi(ev.dischi / 2.4);
        if (ev.muro > 0.25) sSponda(ev.muro / 2.4);
        if (ev.palo > 0.2) sPalo(ev.palo / 2.4);
        if (fine) {
          if (g < 0) ferma(A.s);
          ui.anim = null; ui.st = ui.stDopo ? daFoto(ui.stDopo) : A.s; ui.stDopo = null; disegna(ui);   // se la foto vera è già arrivata, vale quella
          A.fatto(g, A.s);
          if (ui.zoom !== 1) gira();
          return;
        }
      }
      disegna(ui);
      if (ui.anim || ui.mira || ui.zoom !== 1) ui.raf = requestAnimationFrame(loop);
    }
    // un tiro: tutti lo rivedono uguale, partendo dalla stessa foto (extra = il portiere che si tuffa nei rigori)
    ui.anima = function (tiro, fatto) {
      var s0 = daFoto(tiro.st);
      s0.vx[tiro.i] = tiro.vx; s0.vy[tiro.i] = tiro.vy;
      (tiro.extra || []).forEach(function (x) { s0.vx[x[0]] = x[1]; s0.vy[x[0]] = x[2]; });
      ui.mira = null; ui.stDopo = null; ui.anim = { s: s0, acc: 0, passi: 0, fatto: fatto || function () {} };
      gira();
    };
    // aggiorna solo quello che cambia (testi, punti, orologio, posizioni da ferme)
    ui.aggiorna = function (d, testi) {
      if (d.st) { if (!ui.anim) ui.st = daFoto(d.st); else ui.stDopo = d.st; }   // durante un tiro la foto si tiene per dopo
      ui.turno = d.turno; ui.fase = d.fase; ui.puoi = !!d.puoi; ui.mie = d.mie || []; ui.solo = d.solo || null;
      if (!ui.puoi) ui.mira = null;
      var g = d.gol || [0, 0];
      if (ui.giu.gol.textContent !== String(g[qGiu])) ui.giu.gol.textContent = g[qGiu];
      if (ui.su.gol.textContent !== String(g[1 - qGiu])) ui.su.gol.textContent = g[1 - qGiu];
      ui.testo = testi || { giu: "", su: "" };
      ui.scadenza = d.restoTurno != null ? Date.now() + d.restoTurno * 1000 : null;
      ui.fineTempo = d.restoPartita != null ? Date.now() + d.restoPartita * 1000 : null;
      ui.orologio.hidden = ui.fineTempo == null; if (ui.orologio2) ui.orologio2.hidden = ui.fineTempo == null;
      scena.classList.toggle("tempo", ui.fineTempo != null);
      scriviTesti(); scriviOrologio();
      ui.giu.box.classList.toggle("turno", d.fase === "mira" && d.turno === qGiu);
      ui.su.box.classList.toggle("turno", d.fase === "mira" && d.turno === 1 - qGiu);
      // la prima foto (anche di chi rientra a metà partita) non rifà festa per un avvenimento già passato
      if (d.evento && ui.eventoVisto !== d.evento.k) { var vecchio = !ui.giaVista; ui.eventoVisto = d.evento.k; if (!vecchio) ui.festeggia(d.evento); }
      ui.giaVista = true;
      if (!ui.anim) disegna(ui);
    };
    function scriviTesti() {
      var giu = ui.testo.giu || "", su = ui.testo.su || "", resto = ui.scadenza ? Math.ceil((ui.scadenza - Date.now()) / 1000) : null;
      if (resto != null && resto <= 10 && resto >= 0 && ui.fase === "mira" && ui.puoi) giu += " · " + resto;
      var av = ui.avviso; if (av && Date.now() >= av.fino) av = ui.avviso = null;   // un avviso che dura poco (tempo scaduto, la formazione di Bot)
      if (av) { if (av.q === qGiu) giu = av.txt; else su = av.txt; }
      if (ui.giu.msg.textContent !== giu) ui.giu.msg.textContent = giu;
      if (ui.su.msg.textContent !== su) ui.su.msg.textContent = su;
    }
    ui.avvisa = function (q, txt, ms) { ui.avviso = { q: q, txt: txt, fino: Date.now() + (ms || 2500) }; scriviTesti(); };
    // 💬 il tasto si vede o no; un fumetto: chi gioca (0 gialli, 1 blu) vicino alla sua targhetta, chi guarda in basso a sinistra
    ui.chiacOn = function (on) { if (ui.bChiac && ui.bChiac.hidden === !!on) ui.bChiac.hidden = !on; };
    ui.chiac = function (q, c, nome) {
      var X = CH(); if (!X || !vivo()) return;
      if (q === 0 || q === 1) X.bolla(q === qGiu ? ui.giu.box : ui.su.box, ID, c, { sotto: q !== qGiu, muto: !!o.muto });
      else X.volante(ID, c, nome, !!o.muto);
    };
    function scriviOrologio() {
      if (ui.fineTempo == null) return;
      var sec = Math.max(0, Math.ceil((ui.fineTempo - Date.now()) / 1000)), txt = "⏱ " + Math.floor(sec / 60) + ":" + ("0" + sec % 60).slice(-2);
      [ui.orologio, ui.orologio2].forEach(function (n) {
        if (!n) return;
        if (n.textContent !== txt) n.textContent = txt;
        n.classList.toggle("ultimi", sec <= 10);
      });
    }
    ui.timer = setInterval(function () {
      if (!vivo()) { clearInterval(ui.timer); follaFerma(); return; }   // finita la partita: lo stadio si spegne
      if (ui.scadenza || ui.avviso) scriviTesti();
      scriviOrologio();
      if (cb.ogniSecondo) cb.ogniSecondo();   // la partita a tempo controlla se è finito il tempo
    }, 1000);
    // gli avvenimenti grandi: gol (con l'avatar che esulta e i coriandoli), rigore parato o fuori, rigori, fine tempo
    ui.festeggia = function (e) {
      if (e.tipo === "scaduto") { ui.avvisa(e.q, "⏰ Tempo scaduto!", 2500); return; }   // il turno è passato per tempo: basta la targhetta
      var f = ui.festa, col = e.q != null ? colore(e.q) : "#ffffff";
      while (f.firstChild) f.removeChild(f.firstChild);
      f.className = "cb-festa" + (o.ruota ? " doppia" : "");
      var testo = { gol: "⚡ GOL! ⚡", parato: "PARATO!", fuori: "FUORI!", rigori: "RIGORI!", tempo: "FINE TEMPO" }[e.tipo] || "";
      var sotto = e.tipo === "gol" && e.li ? "sulla linea!" : "";
      var cfg = e.tipo === "gol" && e.q != null && o.omini && o.omini[e.q] && window.SGOmino ? SGOmino.svg(o.omini[e.q], { busto: true }) : null;
      // in due sullo stesso telefono la scritta c'è due volte: una dritta e una girata per chi sta in alto
      (o.ruota ? [true, false] : [false]).forEach(function (girata) {
        var b = el("div", { class: "cb-festa-blocco" + (girata ? " girata" : "") });
        if (cfg) b.appendChild(el("div", { class: "cb-festa-av", html: cfg }));
        var scritta = el("div", { class: "cb-festa-txt", text: testo });
        scritta.style.color = col; scritta.style.textShadow = "0 4px 0 " + NOTTE + ", 0 0 28px " + col;
        b.appendChild(scritta);
        if (sotto) b.appendChild(el("div", { class: "cb-festa-sotto", text: sotto }));
        f.appendChild(b);
      });
      if (e.tipo === "gol" && e.q != null) {
        for (var k = 0; k < 26; k++) {   // i coriandoli del colore della squadra
          var c = el("i", { class: "cb-cor" });
          c.style.left = Math.round(Math.random() * 100) + "%";
          c.style.background = k % 3 ? col : "#ffffff";
          c.style.animationDelay = Math.round(Math.random() * 400) + "ms";
          c.style.setProperty("--dx", Math.round((Math.random() - 0.5) * 120) + "px");
          c.style.setProperty("--rot", Math.round(Math.random() * 720 - 360) + "deg");
          f.appendChild(c);
        }
        sGol();
      } else if (e.tipo === "parato" || e.tipo === "fuori") sUuuh();
      void f.offsetWidth; f.classList.add("su");
    };
    return ui;
  }
  // la forza del tiro: si conta da dove hai appoggiato il dito. Vicino al bordo dello schermo la forza piena
  // arriva prima (prima che il dito esca dallo schermo), così si tira forte anche dai lati
  var ZOOM_MAX = 0.18;   // a tutta forza il campo si rimpicciolisce del 18% (la telecamera "si alza")
  function forza(ui) {
    var m = ui.mira; if (!m) return { p: 0, ux: 0, uy: 0 };
    var dx = m.x0 - m.x, dy = m.y0 - m.y, len = Math.hypot(dx, dy);
    if (len < 1) return { p: 0, ux: 0, uy: 0 };
    var fx = -dx / len, fy = -dy / len, posto = Infinity;   // dove va il dito e quanto posto ha
    if (fx > 0.01) posto = Math.min(posto, (ui.cw - m.x0) / fx); else if (fx < -0.01) posto = Math.min(posto, m.x0 / -fx);
    if (fy > 0.01) posto = Math.min(posto, (ui.ch - m.y0) / fy); else if (fy < -0.01) posto = Math.min(posto, m.y0 / -fy);
    var pieno = Math.max(24, Math.min(TIRA * ui.S, posto - 8));
    var ux = dx / len, uy = dy / len; if (ui.o.flip) { ux = -ux; uy = -uy; }
    return { p: Math.min(1, len / pieno), ux: ux, uy: uy };
  }

  // il campo, le righe e le porte: disegnati una volta (per ogni misura) su una tela a parte
  function sfondo(ui) {
    var c = document.createElement("canvas"); c.width = ui.cv.width; c.height = ui.cv.height;
    var g = c.getContext("2d"); g.setTransform(ui.dpr, 0, 0, ui.dpr, 0, 0);
    var S = ui.S, ox = ui.ox, oy = ui.oy, B = Math.max(4, 0.022 * S), fw = W * S, fh = L * S, pw = PORTA * S, pd = FONDO * S, px = ox + PL * S;
    var qSu = ui.o.flip ? 0 : 1;   // la squadra che difende la porta in alto (la porta ha il suo colore)
    // bordo luminoso: giallo da una parte, blu dall'altra
    var gb = g.createLinearGradient(0, oy - pd, 0, oy + fh + pd);
    gb.addColorStop(0, colore(qSu)); gb.addColorStop(0.5, "#ffffff"); gb.addColorStop(1, colore(1 - qSu));
    g.shadowColor = "rgba(0,0,0,.45)"; g.shadowBlur = 18;
    g.fillStyle = gb; tondoRett(g, ox - B, oy - B, fw + 2 * B, fh + 2 * B, 14); g.fill();
    g.shadowBlur = 0;
    tondoRett(g, px - B, oy - pd - B, pw + 2 * B, pd + B + 4, 8); g.fill();
    tondoRett(g, px - B, oy + fh - 4, pw + 2 * B, pd + B + 4, 8); g.fill();
    rete(g, px, oy - pd, pw, pd, colore(qSu)); rete(g, px, oy + fh, pw, pd, colore(1 - qSu));
    // erba tagliata a scacchi
    g.save(); tondoRett(g, ox, oy, fw, fh, 10); g.clip();
    var nx = 6, ny = 9;
    for (var i = 0; i < nx; i++) for (var j = 0; j < ny; j++) { g.fillStyle = (i + j) % 2 ? "#3f9e3a" : "#48ab42"; g.fillRect(ox + fw * i / nx, oy + fh * j / ny, fw / nx + 1, fh / ny + 1); }
    // righe bianche
    g.strokeStyle = "rgba(255,255,255,.92)"; g.lineWidth = Math.max(2.5, 0.014 * S);
    g.beginPath(); g.moveTo(ox, oy + fh / 2); g.lineTo(ox + fw, oy + fh / 2); g.stroke();
    g.beginPath(); g.arc(ox + fw / 2, oy + fh / 2, 0.13 * S, 0, Math.PI * 2); g.stroke();
    var aw = 0.56 * S, ad = 0.18 * S;
    tondoRett(g, ox + (fw - aw) / 2, oy - 6, aw, ad + 6, 10); g.stroke();
    tondoRett(g, ox + (fw - aw) / 2, oy + fh - ad, aw, ad + 6, 10); g.stroke();
    g.restore();
    // il fulmine di SPeeD GAME in mezzo al campo
    g.save(); g.globalAlpha = 0.22; fulmine(g, ox + fw / 2, oy + fh / 2, 0.1 * S, "#ffffff"); g.restore();
    ui.bg = c;
  }
  function tondoRett(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h - r);
    g.quadraticCurveTo(x + w, y + h, x + w - r, y + h); g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function rete(g, x, y, w, h, col) {   // la rete della porta, del colore di chi la difende
    g.fillStyle = NOTTE; g.fillRect(x, y, w, h);
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.globalAlpha = 0.55; g.strokeStyle = col; g.lineWidth = 1;
    for (var k = 0; k < w + h; k += 6) { g.beginPath(); g.moveTo(x + k, y); g.lineTo(x + k, y + h); g.stroke(); }
    for (var k2 = 0; k2 < h; k2 += 6) { g.beginPath(); g.moveTo(x, y + k2); g.lineTo(x + w, y + k2); g.stroke(); }
    g.restore();
  }
  function fulmine(g, x, y, r, col) {   // il fulmine (come nel logo), centrato in x,y, alto 2r
    var P = [[-0.05, -1], [0.5, -1], [0.12, -0.18], [0.48, -0.18], [-0.2, 1], [0.02, 0.12], [-0.45, 0.12]];
    g.fillStyle = col; g.beginPath();
    P.forEach(function (p, k) { var px = x + p[0] * r, py = y + p[1] * r; if (k) g.lineTo(px, py); else g.moveTo(px, py); });
    g.closePath(); g.fill();
  }
  // i calciatori disegnati una volta (per ogni misura) su piccole tele: nel giro di disegno basta incollarli
  function sprites(ui) {
    var r = R * ui.S, d = ui.dpr, lato = Math.ceil(r * 2.5), px = Math.ceil(lato * d);
    function disco(q, faccia) {
      var c = document.createElement("canvas"); c.width = px; c.height = px;
      var g = c.getContext("2d"); g.setTransform(px / lato, 0, 0, px / lato, 0, 0);
      var x = lato / 2, y = lato / 2;
      g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.arc(x + r * 0.12, y + r * 0.2, r, 0, Math.PI * 2); g.fill();
      g.fillStyle = NOTTE; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      var gd = g.createRadialGradient(x - r * 0.3, y - r * 0.35, r * 0.1, x, y, r * 0.86);
      gd.addColorStop(0, "#ffffff"); gd.addColorStop(0.28, colore(q)); gd.addColorStop(1, q === 0 ? "#d99a00" : "#1c4fc4");
      g.fillStyle = gd; g.beginPath(); g.arc(x, y, r * 0.84, 0, Math.PI * 2); g.fill();
      if (faccia) {   // l'attaccante ha la faccia di chi gioca
        g.save(); g.beginPath(); g.arc(x, y, r * 0.8, 0, Math.PI * 2); g.clip();
        var fw = r * 1.75; try { g.drawImage(faccia, x - fw / 2, y - fw * 0.52, fw, fw * 1.022); } catch (e) {}
        g.restore();
      } else fulmine(g, x, y, r * 0.5, q === 0 ? NOTTE : "#ffffff");
      return c;
    }
    var dischi = [disco(0, null), disco(1, null)];
    ui.sp = { lato: lato, disco: dischi, att: [ui.facce[0] ? disco(0, ui.facce[0]) : dischi[0], ui.facce[1] ? disco(1, ui.facce[1]) : dischi[1]] };
  }
  function disegna(ui) {
    var g = ui.ctx; if (!g || !ui.S) return;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, ui.cv.width, ui.cv.height);
    // la telecamera: tutto rimpicciolito intorno al centro dello schermo quando si tira forte
    var z = ui.zoom || 1, d0 = ui.dpr, mx = ui.cw / 2, my = ui.ch / 2;
    g.setTransform(d0 * z, 0, 0, d0 * z, d0 * mx * (1 - z), d0 * my * (1 - z));
    if (ui.bg) g.drawImage(ui.bg, 0, 0, ui.cw, ui.ch);
    var s = ui.anim ? ui.anim.s : ui.st; if (!s) return;
    var S = ui.S, flip = ui.o.flip, i;
    function X(x) { return ui.ox + S * (flip ? W - x : x); }
    function Y(y) { return ui.oy + S * (flip ? L - y : y); }
    // la mira: l'elastico fino al dito e la freccia a puntini (più lunga, più forte)
    var m = ui.mira, pm = 0;
    if (m) {
      var cx = X(s.x[m.i]), cy = Y(s.y[m.i]), qm = squadraDi(m.i), fz = forza(ui);
      pm = fz.p;
      var fxs = mx + (m.x - mx) / z, fys = my + (m.y - my) / z;   // il dito, nello spazio della telecamera
      g.strokeStyle = colore(qm); g.globalAlpha = 0.55; g.lineWidth = 3; g.setLineDash([2, 5]);
      g.beginPath(); g.moveTo(cx, cy); g.lineTo(fxs, fys); g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
      if (pm > 0) {
        var ux = fz.ux, uy = fz.uy; if (flip) { ux = -ux; uy = -uy; }   // dal campo allo schermo
        var lun = (0.3 + 1.0 * pm) * S, k;
        g.fillStyle = "#ffffff";
        for (k = R * S * 1.6; k < lun; k += 11) { g.globalAlpha = 0.95 - 0.7 * k / lun; g.beginPath(); g.arc(cx + ux * k, cy + uy * k, 3.2, 0, Math.PI * 2); g.fill(); }
        g.globalAlpha = 1;
        var ax = cx + ux * lun, ay = cy + uy * lun, nx = -uy, ny = ux, t0 = 10;
        g.fillStyle = colore(qm); g.strokeStyle = NOTTE; g.lineWidth = 2;
        g.beginPath(); g.moveTo(ax + ux * t0, ay + uy * t0); g.lineTo(ax + nx * t0 * 0.8, ay + ny * t0 * 0.8); g.lineTo(ax - nx * t0 * 0.8, ay - ny * t0 * 0.8); g.closePath(); g.fill(); g.stroke();
      }
    }
    // i calciatori: immagini pronte (disco del colore della squadra col fulmine; l'attaccante con la faccia)
    var sp = ui.sp, lato = sp ? sp.lato : 0;
    for (i = 1; i <= 10; i++) {
      var x = X(s.x[i]), y = Y(s.y[i]), r = R * S, q = squadraDi(i);
      if (sp) g.drawImage(i === attaccante(q) ? sp.att[q] : sp.disco[q], x - lato / 2, y - lato / 2, lato, lato);
      if (ui.fase === "mira" && q === ui.turno && !ui.anim && (!ui.solo || i === ui.solo)) {   // chi deve tirare: un anello che gira intorno
        g.strokeStyle = colore(q); g.lineWidth = 2.5; g.setLineDash([5, 4]);
        g.beginPath(); g.arc(x, y, r + 5, 0, Math.PI * 2); g.stroke(); g.setLineDash([]);
      }
      if (m && m.i === i) {   // la forza: un anello che si riempie (verde, giallo, rosso)
        g.strokeStyle = "rgba(255,255,255,.25)"; g.lineWidth = 6;
        g.beginPath(); g.arc(x, y, r + 9, 0, Math.PI * 2); g.stroke();
        g.strokeStyle = "hsl(" + Math.round(120 - 120 * pm) + ",90%,55%)"; g.lineCap = "round";
        g.beginPath(); g.arc(x, y, r + 9, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * Math.max(0.02, pm)); g.stroke(); g.lineCap = "butt";
      }
    }
    // la palla
    var bx = X(s.x[0]), by = Y(s.y[0]), br = RP * S;
    if (!ui.anim) { var al = g.createRadialGradient(bx, by, br, bx, by, br * 2.6); al.addColorStop(0, "rgba(255,240,120,.45)"); al.addColorStop(1, "rgba(255,240,120,0)"); g.fillStyle = al; g.beginPath(); g.arc(bx, by, br * 2.6, 0, Math.PI * 2); g.fill(); }
    g.fillStyle = "rgba(0,0,0,.25)"; g.beginPath(); g.arc(bx + br * 0.2, by + br * 0.28, br, 0, Math.PI * 2); g.fill();
    g.fillStyle = "#ffffff"; g.beginPath(); g.arc(bx, by, br, 0, Math.PI * 2); g.fill();
    g.strokeStyle = "#151515"; g.lineWidth = 1.6; g.stroke();
    g.fillStyle = "#151515"; g.beginPath();
    for (var k = 0; k < 5; k++) { var a = -Math.PI / 2 + k * 2 * Math.PI / 5; g.lineTo(bx + Math.cos(a) * br * 0.38, by + Math.sin(a) * br * 0.38); }
    g.closePath(); g.fill();
  }

  // =========================================================
  //  LE REGOLE DELLA PARTITA (uguali in tutti i modi): turni, gol, partita a tempo, rigori,
  //  e i contatori per i trofei. Le usa chi tiene la partita: il telefono (contro Bot o in due)
  //  oppure l'host online. Gli altri ricevono solo la "foto" (vm) e i tiri.
  // =========================================================
  function statoVuoto() {
    return { golFatti: 0, golSubiti: 0, autogol: 0, golAttaccante: 0, golSponda: 0, golPalo: 0, golLontano: 0, golPrimoTiro: 0,
      pali: 0, rigoriSegnati: 0, rigoriParati: 0, maxSotto: 0 };
  }
  function somma(a) { var n = 0; a.forEach(function (x) { n += x; }); return n; }
  function decisoRigori(t) {   // -1 = non ancora deciso, altrimenti la squadra che vince
    var a = t[0], b = t[1], na = a.length, nb = b.length, ga = somma(a), gb = somma(b);
    if (na <= RIGORI && nb <= RIGORI) {
      if (ga > gb + (RIGORI - nb)) return 0;
      if (gb > ga + (RIGORI - na)) return 1;
      if (na === RIGORI && nb === RIGORI && ga !== gb) return ga > gb ? 0 : 1;
      return -1;
    }
    return na === nb && ga !== gb ? (ga > gb ? 0 : 1) : -1;   // a oltranza
  }
  // o = { vince: "gol" | "tempo", gol, minuti, form: [gialli, blu], primo: chi batte per primo }
  function creaMotore(o) {
    var P = { vince: o.vince === "tempo" ? "tempo" : "gol", golMax: o.gol || 3, minuti: o.minuti || 3, form: [formOk(o.form && o.form[0]), formOk(o.form && o.form[1])],
      primo: o.primo || 0, gol: [0, 0], turno: o.primo || 0, fase: "gioco", stato: "mira", n: 0, s: null, fineTempo: null, rig: null,
      vincitore: null, rigVinto: false, evento: null, kEv: 0, golDi: 0, inizioAzione: true, ultimoTiro: null, stat: [statoVuoto(), statoVuoto()] };
    P.s = nuovoStato(P.turno, P.form);
    if (P.vince === "tempo") P.fineTempo = Date.now() + P.minuti * 60000;
    var M = { P: P };
    function evento(tipo, q, li) { P.evento = { k: ++P.kEv, tipo: tipo, q: q }; if (li) P.evento.li = 1; }
    function chiudi(v, aiRigori) { P.fase = "fine"; P.stato = "fine"; P.vincitore = v; P.rigVinto = !!aiRigori; }
    function tempoFinito() { return P.vince === "tempo" && P.fase === "gioco" && P.fineTempo && Date.now() >= P.fineTempo; }
    function fineTempo() {   // finito il tempo: vince chi ha più gol, se è pari si va ai rigori (ritorna quanto aspettare)
      evento("tempo", null);
      if (P.gol[0] !== P.gol[1]) { chiudi(P.gol[0] > P.gol[1] ? 0 : 1); return 0; }
      P.fase = "rigori"; P.rig = { tiri: [[], []], primo: P.primo, via: false }; P.stato = "pausa";
      return 1800;   // prima si vede "FINE TEMPO", poi (in M.continua) "RIGORI!"
    }
    function prossimoRigore() {
      var a = P.rig.tiri[0].length, b = P.rig.tiri[1].length, q = (a + b) % 2 === 0 ? P.rig.primo : 1 - P.rig.primo;
      P.s = statoRigore(q, P.form); P.turno = q; P.stato = "mira";
    }
    M.solo = function () { return P.fase === "rigori" ? attaccante(P.turno) : null; };   // nei rigori tira solo l'attaccante
    // un tiro: se si può, ritorna il messaggio del tiro (uguale per tutti i telefoni), altrimenti null
    M.tira = function (q, i, vx, vy) {
      if (P.fase === "fine" || P.stato !== "mira" || P.turno !== q || squadraDi(i) !== q) return null;
      if (P.fase === "rigori" && i !== attaccante(q)) return null;
      var v = Math.hypot(vx, vy); if (!(v > 0)) return null;
      if (v > VMAX) { vx *= VMAX / v; vy *= VMAX / v; }
      P.stato = "moto"; P.n++;
      P.ultimoTiro = { q: q, lontano: q === 0 ? P.s.y[0] > L / 2 : P.s.y[0] < L / 2, primo: P.inizioAzione };
      var tiro = { t: "tiro", n: P.n, i: i, vx: vx, vy: vy, st: { x: P.s.x.slice(), y: P.s.y.slice() } };
      if (P.fase === "rigori") {   // il portiere si tuffa a caso: a sinistra, a destra o resta fermo
        var dir = [-1, 0, 1][Math.floor(Math.random() * 3)];
        if (dir) tiro.extra = [[portiere(1 - q), dir * (0.55 + Math.random() * 0.5), 0]];
      }
      return tiro;
    };
    // finito il tiro: gol? tocca all'altro? ritorna quanto aspettare (ms) prima di M.continua()
    M.dopo = function (g, fin) {
      var u = P.ultimoTiro || { q: P.turno }, q = u.q;
      P.s = { x: fin.x.slice(), y: fin.y.slice(), vx: fin.vx.slice(), vy: fin.vy.slice() };
      if (fin.pa) P.stat[q].pali++;
      if (P.fase === "rigori") {
        var dentro = g === q;
        P.rig.tiri[q].push(dentro ? 1 : 0);
        if (dentro) { P.stat[q].rigoriSegnati++; evento("gol", q); }
        else {
          var parato = fin.lt === portiere(1 - q);   // parato solo se l'ha toccata il portiere; se no è fuori
          if (parato) P.stat[1 - q].rigoriParati++;
          evento(parato ? "parato" : "fuori", 1 - q);
        }
        P.stato = "pausa"; return 1700;
      }
      P.inizioAzione = false;
      if (g >= 0) {
        P.gol[g]++;
        var st = P.stat[g]; st.golFatti++; P.stat[1 - g].golSubiti++;
        if (g !== q) P.stat[q].autogol++;
        else {
          if (fin.lt === attaccante(q)) st.golAttaccante++;
          if (fin.sp) st.golSponda++;
          if (fin.pa) st.golPalo++;
          if (u.lontano) st.golLontano++;
          if (u.primo) st.golPrimoTiro++;
        }
        for (var k = 0; k < 2; k++) P.stat[k].maxSotto = Math.max(P.stat[k].maxSotto, P.gol[1 - k] - P.gol[k]);
        P.golDi = g; evento("gol", g, fin.li); P.stato = "pausa";
        return 1800;
      }
      ferma(P.s); P.turno = 1 - P.turno; P.stato = "mira";
      return tempoFinito() ? fineTempo() : 0;
    };
    // dopo la pausa (gol, rigore, inizio dei rigori): si riparte o si chiude. Ritorna altra attesa (ms) o 0
    M.continua = function () {
      if (P.fase === "fine") return 0;
      if (P.fase === "rigori") {
        if (!P.rig.via) { P.rig.via = true; evento("rigori", null); return 1800; }   // dopo "FINE TEMPO": si annunciano i rigori
        var v = decisoRigori(P.rig.tiri);
        if (v >= 0) { chiudi(v, true); return 0; }
        prossimoRigore(); return 0;
      }
      if (P.stato !== "pausa") return 0;
      var g = P.golDi;
      if (P.vince === "gol" && P.gol[g] >= P.golMax) { chiudi(g); return 0; }
      if (tempoFinito()) return fineTempo();
      P.s = nuovoStato(1 - g, P.form); P.turno = 1 - g; P.stato = "mira"; P.inizioAzione = true;   // batte chi ha preso gol
      return 0;
    };
    // online: tempo scaduto per tirare. In partita tocca all'altro; nei rigori conta come sbagliato
    M.passa = function () {
      if (P.stato !== "mira") return 0;
      if (P.fase === "rigori") { P.rig.tiri[P.turno].push(0); evento("fuori", 1 - P.turno); P.stato = "pausa"; return 1700; }
      evento("scaduto", P.turno);   // un avviso piccolo nella targhetta di chi non ha tirato
      P.turno = 1 - P.turno; return tempoFinito() ? fineTempo() : 0;
    };
    // ogni secondo: è finito il tempo mentre si mira? (0 = niente, -1 = chiusa, >0 = attesa prima dei rigori)
    M.controllaTempo = function () {
      if (P.stato !== "mira" || !tempoFinito()) return 0;
      return fineTempo() || -1;
    };
    // la "foto" della partita
    M.vm = function () {
      return { fase: P.fase === "fine" ? "fine" : "gioco", stato: P.stato, vince: P.vince, golMax: P.golMax, minuti: P.minuti, form: P.form.slice(),
        gol: P.gol.slice(), turno: P.turno, n: P.n, solo: M.solo(), evento: P.evento, vincitore: P.vincitore, rigVinto: P.rigVinto,
        rig: P.rig ? { tiri: [P.rig.tiri[0].slice(), P.rig.tiri[1].slice()] } : null,
        restoPartita: P.fase === "gioco" && P.vince === "tempo" ? Math.max(0, Math.round((P.fineTempo - Date.now()) / 1000)) : null,
        st: { x: P.s.x.map(r4), y: P.s.y.map(r4) }, stat: P.fase === "fine" ? P.stat : null };
    };
    // la ripresa (l'host ha ricaricato la pagina): la partita com'è (un oggetto semplice, fineTempo è un'ora assoluta) e
    // di nuovo dentro il motore
    M.esporta = function () { return JSON.parse(JSON.stringify(P)); };
    M.importa = function (x) { if (x && typeof x === "object") Object.keys(x).forEach(function (k) { P[k] = x[k]; }); };
    return M;
  }
  // il messaggio nella targhetta della squadra q (chi = { mie: squadre di questo telefono, bot: squadra del Bot o -1, botNome: il suo nome })
  function riga(vm, q, chi) {
    var parti = [];
    if (vm.rig && vm.rig.tiri[q].length) parti.push("Rigori " + vm.rig.tiri[q].map(function (x) { return x ? "✓" : "✗"; }).join(""));
    if (vm.stato === "mira" && vm.turno === q) {
      if (chi.bot === q) parti.push((chi.botNome || "Bot") + " pensa…");
      else if (chi.mie.indexOf(q) >= 0) parti.push(vm.rig ? "Tira il rigore!" : "Tocca a te! Tira e lascia");
      else parti.push("Sta mirando…");
    }
    return parti.join(" · ");
  }
  // i contatori dei trofei, a fine partita, per chi ha il profilo su questo telefono (q = la sua squadra)
  // P = { stat, vincitore, gol, form, vince, rigVinto, ritiro }; c = { modo: "bot" | "telefono" | "online", liv }
  function salvaStat(P, q, c) {
    try {
      if (!(window.SGNube && SGNube.disponibile && SGNube.disponibile() && SGNube.profilo && SGNube.profilo() && SGNube.salvaProgressi)) return;
      if (!P || !P.stat || !P.stat[q] || P.vincitore == null) return;
      // in due sullo stesso telefono si potrebbe giocare da soli per tutte e due le squadre: conta solo la partita giocata
      if (c.modo === "telefono") { SGNube.salvaProgressi(null, ID, [["partite", 1]]); return; }
      var st = P.stat[q], vinto = P.vincitore === q, mie = P.gol[q], loro = P.gol[1 - q], x = { partite: 1 };
      // l'avversario è uscito: è una vittoria vera solo se eri avanti (niente trofei "a tavolino"); la serie non si rompe
      var aTavolino = !!P.ritiro && vinto && mie <= loro;
      if (aTavolino) vinto = false;
      ["golFatti", "golSubiti", "autogol", "golAttaccante", "golSponda", "golPalo", "golLontano", "golPrimoTiro", "pali", "rigoriSegnati", "rigoriParati"].forEach(function (k) { x[k] = st[k] || 0; });
      if (vinto) {
        x.vittorie = 1;
        if (c.modo === "bot") x["vinte_" + (c.liv || "medio")] = 1;
        if (c.modo === "online") x.vinteOnline = 1;
        x["vinte_" + formOk(P.form && P.form[q])] = 1;
        if (P.vince === "tempo") x.vinteTempo = 1;
        if (P.rigVinto) x.vinteRigori = 1;
        if (loro === 0 && mie >= 3) x.cappotti = 1;
        if (loro === 0 && mie >= 5) x.manite = 1;
        if (st.maxSotto >= 2) x.rimonte = 1;
        if (c.modo === "bot" && c.liv === "difficile" && loro === 0 && mie >= 3) x.cappotti_difficile = 1;
      }
      var s0 = (SGNube.statGioco && SGNube.statGioco(ID)) || {}, serie = vinto ? (s0.serieOra || 0) + 1 : (aTavolino ? (s0.serieOra || 0) : 0);
      var incrs = []; for (var k in x) if (x[k]) incrs.push([k, x[k]]);
      SGNube.salvaProgressi(null, ID, incrs, [["serieMax", serie], ["golPartitaMax", mie]], [["serieOra", serie]]);
    } catch (e) {}
  }

  // =========================================================
  //  CONTRO IL COMPUTER / IN DUE SULLO STESSO TELEFONO
  // =========================================================
  function locale(t, modo) {
    var imp = t.impostazioni || {}, bot = modo === "bot", liv = imp.difficolta || "medio";
    var g0 = t.giocatori || [];
    // il Bot: quello deciso dal core (torneo a eliminazione) o uno dei bot fissi, scelto dalla bravura (nei tasti si dice "Bot")
    var ilBot = !bot ? null : (imp.bot && imp.bot.nome) ? imp.bot
      : ((SG.bot && SG.bot.prendi && SG.bot.prendi(1, { livello: liv, escludi: [g0[0] || "Tu", t.nomeProfilo && t.nomeProfilo()] })[0]) || { nome: "Bot", omino: null });
    var nomi = bot ? [g0[0] || "Tu", ilBot.nome] : [g0[0] || "Giocatore 1", g0[1] || "Giocatore 2"];
    var omini = [t.mioOmino ? t.mioOmino(nomi[0]) : null, bot && ilBot.omino ? ilBot.omino : (window.SGOmino ? SGOmino.casuale(nomi[1]) : null)];
    var chi = { mie: bot ? [0] : [0, 1], bot: bot ? 1 : -1, botNome: bot ? ilBot.nome : null };
    var primo = 0, M = null, ui = null, tm = null, pensa = 0;
    var tx = CH() ? CH().trasmettitore(t) : null;   // torneo a eliminazione: le chiacchiere arrivano anche a chi guarda
    // 💬 contro il Bot: il mio fumetto, e ogni tanto Bot risponde
    function chiacMia(c) {
      if (!ui || !M || M.P.fase === "fine" || !CH() || !CH().valido(ID, c)) return;
      ui.chiac(0, c); if (tx) tx({ t: "chiac", k: 0, id: "io", c: c });
      var M0 = M;
      CH().rispondeBot(function (r) { if (M !== M0 || M.P.fase === "fine" || !document.body.contains(ui.cv)) return; ui.chiac(1, r); if (tx) tx({ t: "chiac", k: 1, id: "bot", c: r }); });
    }
    function via() { if (tm) { clearTimeout(tm); tm = null; } pensa++; }   // pensa++: se Bot stava pensando, la sua scelta non vale più
    window.__CB.locale = function () { return M && M.P; };   // per le prove
    var cb = {
      onTiro: function (i, vx, vy) { if (M && (!bot || M.P.turno === 0)) tira(i, vx, vy); },
      onEsci: function () { function e() { via(); follaFerma(); t.esci(); } if (M && M.P.fase !== "fine") chiedi(t, "Uscire dalla partita?", e); else e(); },
      ogniSecondo: function () { if (!M || tm) return; var r = M.controllaTempo(); if (r) avanti(r > 0 ? r : 0); }
    };
    // la foto anche per chi guarda (torneo a eliminazione: gli altri vedono la partita col bot)
    function vmPubblico(v) { v.players = [{ id: "g0", nome: nomi[0], omino: omini[0] }, { id: "g1", nome: nomi[1], omino: omini[1] }]; v.spett = []; return v; }
    function aggiorna() {
      var vm = M.vm();
      ui.aggiorna({ st: vm.st, gol: vm.gol, turno: vm.turno, fase: vm.stato, mie: chi.mie, solo: vm.solo, restoPartita: vm.restoPartita, evento: vm.evento,
        puoi: vm.fase !== "fine" && vm.stato === "mira" && chi.bot !== vm.turno }, { giu: riga(vm, 0, chi), su: riga(vm, 1, chi) });
      if (t.trasmetti) t.trasmetti({ t: "vm", vm: vmPubblico(vm) });
    }
    function inizia() {
      var form = [imp.form || "classica", bot ? NOMI_FORM[Math.floor(Math.random() * NOMI_FORM.length)] : (imp.form2 || "classica")];   // Bot sceglie a caso
      M = creaMotore({ vince: imp.vince, gol: imp.gol, minuti: imp.minuti, form: form, primo: primo });
      ui = creaSchermo(t, cb, { flip: false, ruota: !bot, nomi: nomi, omini: omini, chiac: bot ? chiacMia : null, chiacSubito: bot });
      aggiorna();
      if (bot) ui.avvisa(1, "Formazione: " + nomeForm(form[1]), 4000);   // la formazione che ha scelto Bot
      segui();
    }
    function tira(i, vx, vy) {
      var tiro = M.tira(M.P.turno, i, vx, vy); if (!tiro) return;
      aggiorna();
      if (t.trasmetti) t.trasmetti(tiro);
      ui.anima(tiro, function (g, fin) { avanti(M.dopo(g, fin)); });
    }
    function avanti(ms) {   // dopo un tiro (o una pausa): si aspetta, poi la partita va avanti
      aggiorna();
      if (ms > 0) { via(); tm = setTimeout(function () { tm = null; avanti(M.continua() || 0); }, ms); return; }
      segui();
    }
    function segui() {
      if (M.P.fase === "fine") return fine();
      if (bot && M.P.turno === 1 && M.P.stato === "mira") {
        via();
        var mio = pensa, Mb = M;
        tm = setTimeout(function () {
          tm = null;
          if (M.P.stato !== "mira" || M.P.turno !== 1) return;
          sceltaBot(copia(M.P.s), 1, liv, M.solo(), function (c) {   // Bot pensa a pezzetti: lo schermo non si blocca
            if (mio !== pensa || Mb !== M || M.P.stato !== "mira" || M.P.turno !== 1 || !document.body.contains(ui.cv)) return;
            tira(c.i, Math.cos(c.a) * VMAX * c.p, Math.sin(c.a) * VMAX * c.p);
          });
        }, 900);
      }
    }
    function fine() {
      via();
      var P = M.P, v = P.vincitore, cl = [{ nome: nomi[v], pos: 1 }, { nome: nomi[1 - v], pos: 2 }];
      if (bot) cl[v === 1 ? 0 : 1].bot = true;   // la riga del Bot (squadra 1): bot: true
      // i trofei: contro Bot conta chi gioca; in due sullo stesso telefono conta chi ha il nome del profilo
      var prof = window.SGNube && SGNube.profilo && SGNube.profilo(), mio = bot ? 0 : (prof && nomi[1] === prof.nome ? 1 : (prof && nomi[0] === prof.nome ? 0 : -1));
      if (mio >= 0) salvaStat(P, mio, { modo: bot ? "bot" : "telefono", liv: liv });
      if (t.risultato) t.risultato(cl);
      if (imp.torneo) return t.fine(cl);
      tm = setTimeout(function () {   // si vede ancora un attimo il campo, poi il risultato
        tm = null;
        finale(t, { vincitore: v, nomi: nomi, gol: P.gol, mia: bot ? 0 : null, rig: P.rig, rigVinto: P.rigVinto }, [
          t.el("button", { class: "btn btn-primario", text: "🔄 Rivincita", onclick: function () { primo = 1 - primo; inizia(); } }),
          t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: t.esci })]);
      }, P.evento && P.evento.tipo === "tempo" ? 1700 : 700);   // il fischio finale si vede tutto
    }
    inizia();
  }

  // la schermata finale: chi ha vinto e il risultato (con i rigori, se ci sono stati)
  // comuni: online, i tasti di fine uguali per tutti (li disegna il core: se torna true, dei tasti resta solo la fila delle faccine)
  function finale(t, d, tasti, nota, comuni, fa) {
    stile();
    var tu = d.mia, vinto = tu != null && d.vincitore === tu;
    var tit = tu == null ? "Ha vinto " + d.nomi[d.vincitore] + "!" : (vinto ? "Hai vinto!" : "Ha vinto " + d.nomi[d.vincitore]);
    var s = t.schermata({ icona: vinto || tu == null ? "🏆" : "⚽", titolo: tit });
    s._contenuto.appendChild(t.el("div", { class: "cb-fine" }, [
      t.el("div", { class: "cb-fine-riga" }, [ t.el("span", { style: "color:" + GIALLO, text: d.nomi[0] }), t.el("b", { html: "<span style='color:" + GIALLO + "'>" + d.gol[0] + "</span> : <span style='color:" + BLU + "'>" + d.gol[1] + "</span>" }), t.el("span", { style: "color:" + BLU, text: d.nomi[1] }) ])
    ]));
    if (d.rigVinto && d.rig) s._contenuto.appendChild(t.el("p", { class: "cb-fine-rig", text: "Ai rigori: " + somma(d.rig.tiri[0]) + " a " + somma(d.rig.tiri[1]) }));
    if (nota) s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center", text: nota }));
    if (comuni && comuni(s._piede)) { if (fa) s._piede.insertBefore(fa, s._piede.firstChild); }
    else tasti.forEach(function (b) { if (b) s._piede.appendChild(b); });
    t.mostra(s);
    return s;
  }

  // =========================================================
  //  ONLINE — HOST: tiene la partita vera e manda a tutti la "foto" (vm)
  //  Chi entra quando i due posti sono presi (o a partita iniziata) guarda in diretta.
  // =========================================================
  var UI = null;   // lo schermo di gioco online si costruisce UNA volta e poi si aggiorna a pezzi
  var FINE = { k: null, s: null };   // la schermata finale online già mostrata (si rifà solo se cambia)
  function host(t) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var imp = t.impostazioni || {};
    var nomeHost = (t.giocatori && t.giocatori[0]) || t.nomeProfilo() || "Host";
    var H = { fase: "lobby", codice: "…", pronta: false, primo: 0, M: null, ritiro: false, scade: 0, to: null, tiroN: 0, partita: "", formDi: null,
      opz: { vince: imp.vince === "tempo" ? "tempo" : "gol", gol: imp.gol || 3, minuti: imp.minuti || 3 }, form: [formOk(imp.form), "classica"], formImp: imp.form,
      players: [{ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost) }], spett: [] };
    var ch = CH(), filtra = ch ? ch.filtro() : null;   // 💬 le faccine e le frasi (accese o spente dall'host nel ⚙️)
    H.ch = !!ch && ch.attive(imp);
    // ---- la ripresa: se l'host ricarica la pagina (o l'app si chiude) la partita riprende: stessi gol, stesse pedine,
    // stesso turno. Un tiro che era a metà si annulla e chi tirava rifà la mira. Si ricorda a ogni foto (bd)
    var RIP = t.ripresa && t.ripresa.stato && t.ripresa.stato.calcio, ricordata = !!RIP;
    function ricorda() {
      if (!t.ricorda) return;
      if (H.fase === "lobby" || !H.M) { if (ricordata) { ricordata = false; t.ricorda(null); } return; }
      ricordata = true;
      t.ricorda({ calcio: { H: { fase: H.fase, primo: H.primo, ritiro: H.ritiro, partita: H.partita, opz: H.opz, form: H.form, formImp: H.formImp, formDi: H.formDi, fischio: !!H.fischio,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, omino: p.omino || null }; }) }, P: H.M.esporta() } });
    }
    function pById(id) { for (var i = 0; i < H.players.length; i++) if (H.players[i].id === id) return H.players[i]; return null; }
    function guarda(id) { return H.spett.some(function (x) { return x.id === id; }); }
    function fermaTimer() { if (H.to) { clearTimeout(H.to); H.to = null; } }
    // in saletta, se un posto è libero, il primo che guardava diventa giocatore
    // (nella Sala gioca solo chi è stato scelto: gli altri guardano)
    function puo(id, nome) { return !t.puoSedersi || t.puoSedersi(id, nome); }
    function riempi() {
      while (H.fase === "lobby" && H.players.length < MAX && H.spett.length) {
        var k = -1;   // (la stanza appena riaperta: il posto resta per un po' a chi giocava)
        if (H.riserva && Date.now() < H.riserva.fino) { for (var j = 0; j < H.spett.length; j++) if (H.spett[j].id === H.riserva.id) k = j; if (k < 0) break; }
        else for (var q = 0; q < H.spett.length && k < 0; q++) if (puo(H.spett[q].id, H.spett[q].nome)) k = q;
        if (k < 0) break;
        var x = H.spett.splice(k, 1)[0]; H.players.push({ id: x.id, nome: x.nome, omino: x.omino || null });
      }
    }

    t.onRegole = function (im) {
      if (H.fase !== "lobby") return;
      H.opz = { vince: im.vince === "tempo" ? "tempo" : "gol", gol: im.gol || 3, minuti: im.minuti || 3 };
      // la formazione delle regole vale solo se l'host l'ha cambiata lì (se no resta quella scelta in saletta)
      if (im.form && im.form !== H.formImp) { H.formImp = im.form; H.form[0] = formOk(im.form); }
      H.ch = !!ch && ch.attive(im);
      bd();
    };
    var rete = SGNet.ospita(ID, {
      onCodice: function (c) {
        H.codice = c; H.riserva = riservaAvv(ID, c);
        if (H.riserva) setTimeout(function () { if (H.fase === "lobby") { riempi(); bd(); } }, 15100);   // non è tornato: tocca a chi guardava
        bd();
      },
      onConnesso: function () { H.pronta = true; bd(); },
      onErrore: function () { if (!H.pronta) errore(t, "Problema di collegamento. Controlla la connessione e riprova."); },   // (solo se il primo collegamento non riesce)
      onAddio: function (id) {
        if (guarda(id)) { H.spett = H.spett.filter(function (x) { return x.id !== id; }); bd(); return; }
        var p = pById(id); if (!p) return;
        if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); riempi(); bd(); return; }
        p.via = true;
        // a metà partita (telefono spento, app chiusa): il posto resta suo per un altro minuto (i suoi turni passano da
        // soli col tempo); se torna (stesso id) riprende a giocare, se no vince l'host
        if (H.fase === "gioco") { clearTimeout(p.viaT); p.viaT = setTimeout(function () { if (p.via && H.fase === "gioco" && pById(id) === p) fineRitiro(); }, 60000); }
        bd();
      },
      onMsg: function (id, m) {
        if (!m || !m.t) return;
        var pt = pById(id);
        if (pt && pt.via && m.t !== "esco") { pt.via = false; clearTimeout(pt.viaT); if (m.t !== "join") bd(); }   // è tornato in tempo
        if (m.t === "esco") {   // uscito apposta (tasto Esci): niente minuto di attesa
          if (guarda(id)) { H.spett = H.spett.filter(function (x) { return x.id !== id; }); bd(); return; }
          if (!pt || pt.id === "host") return;
          if (H.fase === "lobby") { H.players = H.players.filter(function (x) { return x.id !== id; }); riempi(); bd(); return; }
          pt.via = true; clearTimeout(pt.viaT);
          if (H.fase === "gioco") return fineRitiro();
          bd(); return;
        }
        if (m.t === "join") {
          if (!pById(id) && !guarda(id)) {
            if (H.fase === "lobby" && H.players.length < MAX && !postoRiservato(H.riserva, id) && puo(id, String(m.nome || "Amico").slice(0, 16))) H.players.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino) });
            else if (H.spett.length < 12) H.spett.push({ id: id, nome: String(m.nome || "Amico").slice(0, 16), omino: avatarValido(m.omino) });   // posti presi: guarda
          }
          riempi();   // chi guardava e trova un posto libero in saletta, gioca
          bd();   // anche se c'era già: rimanda la foto (serve a chi si ricollega)
          return;
        }
        var avv = H.players[1];
        if (m.t === "chiac") {   // 💬 dall'avversario (o una faccina da chi guarda): a tutti
          if (H.fase !== "gioco") return;
          var x = chiacDaOspite(ch, H.ch, filtra, id, m, !!avv && avv.id === id);
          if (x) { rete.inviaVeloce(x); if (UI && document.body.contains(UI.cv)) UI.chiac(x.k, x.c, x.n); }
          return;
        }
        if (m.t === "form" && H.fase === "lobby" && avv && avv.id === id) { H.form[1] = formOk(m.f); bd(); return; }
        if (H.fase !== "gioco" || !avv || avv.id !== id) return;
        if (m.t === "tiro") tira(1, m.i | 0, +m.vx || 0, +m.vy || 0);
      }
    }, { ripresa: !!(RIP && RIP.H && RIP.P) });   // (ripresa: chi gioca resta sul campo, non torna in saletta)
    function vm() {
      var v = { fase: H.fase, codice: H.codice, pronta: H.pronta, opz: H.opz, form: H.form.slice(), ritiro: H.ritiro, partita: H.partita, ch: H.ch ? 1 : 0,
        players: H.players.map(function (p) { return { id: p.id, nome: p.nome, via: !!p.via, omino: p.omino || null }; }),
        spett: H.spett.map(function (x) { return { id: x.id, nome: x.nome }; }) };
      if (H.M && H.fase !== "lobby") {
        var g = H.M.vm(), k;
        for (k in g) v[k] = g[k];
        v.fase = H.fase === "fine" ? "fine" : "gioco";
        v.restoTurno = H.fase === "gioco" && g.stato === "mira" && H.scade ? Math.max(0, Math.round((H.scade - Date.now()) / 1000)) : null;
      }
      return v;
    }
    function bd() {
      // è cambiato chi ha i blu (uno è uscito, uno che guardava ha preso il posto): riparte dalla formazione Classica
      var blu = H.players[1] ? H.players[1].id : null;
      ricordaAvv(ID, H.codice, blu || (H.riserva && Date.now() < H.riserva.fino ? H.riserva.id : null));
      if (blu !== H.formDi) { H.formDi = blu; H.form[1] = "classica"; }
      ricorda();
      var v = vm(); rete.invia({ t: "vm", vm: v }); disegnaOnline(t, v, cbHost); }

    function comincia() {
      if (H.fase !== "lobby" || H.players.length < MIN) return;
      H.M = creaMotore({ vince: H.opz.vince, gol: H.opz.gol, minuti: H.opz.minuti, form: H.form, primo: H.primo });
      H.fase = "gioco"; H.ritiro = false; H.fischio = false;
      H.partita = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);   // un nome che non si ripete: i trofei si salvano una volta sola
      nuovoTurno();
    }
    function nuovoTurno() {   // tocca a qualcuno: 30 secondi per tirare
      fermaTimer();
      if (H.M.P.fase === "fine") {
        var ev = H.M.P.evento;   // finita col fischio: prima si vede "FINE TEMPO", poi il risultato
        if (ev && ev.tipo === "tempo" && !H.fischio) { H.fischio = true; bd(); H.to = setTimeout(function () { H.to = null; if (H.fase === "gioco") fine(); }, 1700); return; }
        return fine();
      }
      if (H.M.P.stato === "mira") {
        H.scade = Date.now() + TEMPO * 1000;
        H.to = setTimeout(function () { H.to = null; if (H.fase === "gioco" && H.M.P.stato === "mira") avanti(H.M.passa()); }, TEMPO * 1000);
      }
      bd();
    }
    function tira(q, i, vx, vy) {
      if (H.fase !== "gioco") return;
      var tiro = H.M.tira(q, i, vx, vy); if (!tiro) return;
      fermaTimer();
      rete.inviaVeloce(tiro);   // tutti rivedono lo stesso tiro
      bd();
      // il risultato vero si calcola subito (anche se l'app va in sottofondo, la partita non si ferma);
      // l'animazione è solo da guardare. Vale il primo che arriva: la fine dell'animazione o il tempo del tiro
      var s1 = daFoto(tiro.st); s1.vx[i] = tiro.vx; s1.vy[i] = tiro.vy;
      (tiro.extra || []).forEach(function (x) { s1.vx[x[0]] = x[1]; s1.vy[x[0]] = x[2]; });
      var g1 = simula(s1), n = ++H.tiroN, fatto = false, Mt = H.M;
      function finito() { if (fatto || n !== H.tiroN || Mt !== H.M || H.fase !== "gioco") return; fatto = true; avanti(H.M.dopo(g1, s1)); }
      if (UI && document.body.contains(UI.cv)) UI.anima(tiro, finito);
      setTimeout(finito, Math.round(s1.passi * DT * 1000) + 250);
    }
    function avanti(ms) {
      if (ms > 0) { fermaTimer(); bd(); H.to = setTimeout(function () { H.to = null; avanti(H.M.continua() || 0); }, ms); return; }
      nuovoTurno();
    }
    function fine() {
      fermaTimer(); H.fase = "fine"; bd();
      var P = H.M.P, a = H.players[P.vincitore], b = H.players[1 - P.vincitore];
      salvaStat(P, 0, { modo: "online" });
      if (t.risultato && a && b) t.risultato([{ nome: a.nome, pos: 1 }, { nome: b.nome, pos: 2 }]);
    }
    function fineRitiro() {
      fermaTimer(); if (!H.M) return;
      var P = H.M.P;
      if (P.fase !== "fine") { P.fase = "fine"; P.stato = "fine"; P.vincitore = 0; P.ritiro = true; H.ritiro = true; }   // se era già finita (fischio), vale il risultato vero
      fine();
    }
    // "Nuova partita": stessa stanza, stessi amici, si torna nella saletta (batte l'altro); chi guardava prende il posto libero
    function nuova() { fermaTimer(); H.fase = "lobby"; H.primo = 1 - H.primo; H.M = null; H.players = H.players.filter(function (p) { return !p.via; }); riempi(); bd(); }
    // la rivincita dei tasti di fine comuni (è la stessa "Nuova partita": si torna nella saletta, il core fa il 3-2-1)
    t.onRivincita = function () { if (H.fase === "fine") nuova(); };

    var cbHost = { sonoHost: true, myId: "host", onComincia: comincia, onNuova: nuova,
      onChiac: function (c) { if (!H.ch || H.fase !== "gioco" || !ch.valido(ID, c)) return; if (UI) UI.chiac(0, c); rete.inviaVeloce({ t: "chiac", k: 0, id: "host", c: c }); },
      onForm: function (f) { if (H.fase === "lobby") { H.form[0] = formOk(f); bd(); } },
      onTiro: function (i, vx, vy) { tira(0, i, vx, vy); },
      ogniSecondo: function () { if (H.fase !== "gioco" || !H.M || H.to && H.M.P.stato !== "mira") return; var r = H.M.controllaTempo(); if (r) avanti(r > 0 ? r : 0); },
      onEsci: function () {
        if (H.fase === "gioco" && !H._siChiude) return chiedi(t, "Chiudere la partita per tutti?", function () { H._siChiude = true; cbHost.onEsci(); });
        if (t.ricorda) t.ricorda(null);   // (uscito apposta: niente da riprendere)
        fermaTimer(); H.tiroN++; follaFerma(); rete.chiudi(); t.esci();
      } };
    // (ripresa) la partita com'era. L'avversario rientra da solo; se non torna entro un minuto, vince l'host (come quando
    // perde la rete). Il tempo della partita a tempo è un'ora assoluta: si porta sull'orologio di questo telefono
    if (RIP && RIP.H && RIP.P) {
      var h = RIP.H;
      H.fase = h.fase === "fine" ? "fine" : "gioco"; H.primo = h.primo || 0; H.ritiro = !!h.ritiro; H.partita = h.partita || ""; H.fischio = !!h.fischio;
      if (h.opz) H.opz = h.opz;
      if (h.form) H.form = h.form;
      H.formImp = h.formImp; H.formDi = h.formDi || null;
      H.players = (h.players || []).map(function (p) { return { id: p.id, nome: p.nome, omino: p.id === "host" ? H.players[0].omino : avatarValido(p.omino) }; });
      if (!H.players.length || H.players[0].id !== "host") H.players.unshift({ id: "host", nome: nomeHost, omino: t.mioOmino(nomeHost) });
      H.M = creaMotore({ vince: H.opz.vince, gol: H.opz.gol, minuti: H.opz.minuti, form: H.form, primo: RIP.P.primo || 0 });
      H.M.importa(RIP.P);
      var P0 = H.M.P;
      if (P0.fineTempo && t.ripresa.ora) P0.fineTempo = t.ripresa.ora(P0.fineTempo);
      if (H.fase === "gioco") {
        H.players.forEach(function (p) {
          if (p.id === "host") return;
          p.via = true;
          p.viaT = setTimeout(function () { if (p.via && H.fase === "gioco" && pById(p.id) === p) fineRitiro(); }, 60000);
        });
        if (P0.stato === "moto" && P0.fase !== "fine") P0.stato = "mira";   // il tiro in volo non vale: si rifà la mira
        if (P0.stato === "pausa") { bd(); H.to = setTimeout(function () { H.to = null; if (H.fase === "gioco") avanti(H.M.continua() || 0); }, 1500); }
        else nuovoTurno();
        return;
      }
    }
    bd();
  }

  // =========================================================
  //  ONLINE — OSPITE: rivede i tiri, disegna le foto dell'host, manda solo i suoi tiri
  //  (se i posti sono presi guarda e basta)
  // =========================================================
  function ospite(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, nome: "", vm: null, anim: false, attesa: null, ultimoN: 0 };
    var cb = { sonoHost: false, myId: null,
      onTiro: function (i, vx, vy) { if (S.rete) S.rete.invia({ t: "tiro", i: i, vx: vx, vy: vy }); },
      onForm: function (f) { if (S.rete) S.rete.invia({ t: "form", f: f }); },
      // 💬 il mio fumetto subito, poi lo manda l'host a tutti (chi guarda: solo faccine, col suo nome)
      onChiac: function (c) {
        var me = S.vm ? miaSquadra(S.vm, cb) : -1;
        if (!S.rete || !CH() || !CH().valido(ID, c, me < 0)) return;
        if (me >= 0) { if (UI) UI.chiac(me, c); S.rete.invia({ t: "chiac", c: c }); }
        else { var n = CH().nomeDi(S.nome); if (UI) UI.chiac("g", c, n); S.rete.invia({ t: "chiac", c: c, n: n }); }
      },
      onEsci: function () {
        if (S.vm && S.vm.fase === "gioco" && miaSquadra(S.vm, cb) >= 0 && !S._siEsce) return chiedi(t, "Uscire dalla partita?", function () { S._siEsce = true; cb.onEsci(); });
        follaFerma();
        if (S.rete) { try { S.rete.invia({ t: "esco" }); } catch (e) {} S.rete.chiudi(); }   // (l'host sa che sono uscito apposta)
        t.esci();
      } };
    if (t.nomeProfilo()) { S.nome = t.nomeProfilo(); collega(); } else chiediNome();   // col profilo si entra da soli
    function chiediNome() {
      var s = t.schermata({ icona: "⚽", titolo: "Entra nella partita", sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
      var input = t.el("input", { type: "text", placeholder: "Il tuo nome", maxlength: "16", class: "link-campo" });
      s._contenuto.appendChild(input);
      s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Entra ▶", onclick: function () {
        try { SG.audioCtx && SG.audioCtx(); } catch (e) {}
        S.nome = (input.value || "").trim().slice(0, 16) || "Amico"; collega();
      } }));
      t.mostra(s);
    }
    function collega() {
      attesaSchermo(t, "Entro nella partita…", codice);
      S.rete = SGNet.entra(codice, {
        onAperto: function (id) { S.myId = id; cb.myId = id; S.rete.invia({ t: "join", nome: S.nome, omino: t.mioOmino(S.nome) }); },
        onMsg: function (m) { riceviOnline(t, S, cb, m); },
        onChiuso: function () { errore(t, "La partita è stata chiusa dall'host."); },
        onErrore: function () { if (!S.vm) errore(t, "Problema di collegamento. Riprova."); }   // (solo se il primo collegamento non riesce)
      });
    }
  }
  // chi guarda una partita del torneo a eliminazione: la vede in diretta, senza poter toccare e senza suoni
  // (anche il duello della Sala e "👀 Guarda"). Le faccine passano dal core (le sue mosse il core le butta)
  function guarda(t, codice) {
    if (!(window.SGNet && SGNet.disponibile())) return senzaRete(t);
    var S = { rete: null, myId: null, vm: null, anim: false, attesa: null, ultimoN: 0 };
    var cb = { sonoHost: false, myId: null, guarda: true, onTiro: function () {},
      onEsci: function () { follaFerma(); if (S.rete) S.rete.chiudi(); t.esci(); } };
    function faNel() { return t.eliminazione && t.faccine ? t.faccine() : null; }   // (fuori dal torneo le faccine sono nella targhetta)
    attesaSchermo(t, "👀 Mi collego alla partita…", codice, faNel());
    S.rete = SGNet.entra(codice, {
      onMsg: function (m) {
        if (m && m.t === "vm" && m.vm && m.vm.fase === "lobby") return attesaSchermo(t, "👀 La partita sta per cominciare…", codice, faNel());
        riceviOnline(t, S, cb, m);
      },
      onChiuso: function () { cb.onEsci(); },   // partita finita e chiusa: si torna al tabellone
      onErrore: function () { errore(t, "Problema di collegamento. Controlla la connessione e riprova."); }
    });
  }
  // i messaggi dell'host (per chi gioca da ospite e per chi guarda): la foto e i tiri da rivedere
  function riceviOnline(t, S, cb, m) {
    if (!m || !m.t) return;
    if (m.to && m.to !== S.myId) return;
    if (m.t === "chiac") {   // 💬 di un altro (il mio l'ho già visto)
      if (m.id !== (S.myId || (S.rete && S.rete.mioId)) && UI && document.body.contains(UI.cv)) UI.chiac(m.k, m.c, m.n);
      return;
    }
    if (m.t === "vm" && m.vm) {
      if (S.anim) S.attesa = m.vm;
      else { S.vm = m.vm; disegnaOnline(t, m.vm, cb); }
    } else if (m.t === "tiro" && m.n > S.ultimoN && UI && document.body.contains(UI.cv) && S.vm && S.vm.fase === "gioco") {
      S.ultimoN = m.n;
      // il tiro è partito: via "Tocca a te" dalle targhette (prima di animare, così il campo non salta indietro)
      if (S.vm.stato === "mira") { var vt = {}, k; for (k in S.vm) vt[k] = S.vm[k]; vt.stato = "moto"; vt.st = m.st; disegnaOnline(t, vt, cb); }
      S.anim = true;
      UI.anima(m, function () {   // finito il tiro: mi allineo alla foto dell'host
        S.anim = false;
        if (!S.attesa) return;
        var v = S.attesa; S.attesa = null; S.vm = v;
        // la foto di quando il tiro era appena partito non serve: aspetto quella col risultato (niente salto indietro)
        if (v.fase === "gioco" && v.stato === "moto" && v.n === m.n) return;
        disegnaOnline(t, v, cb);
      });
    }
  }
  function attesaSchermo(t, testo, codice, fa) {
    var s = t.schermata({ icona: "⚽", titolo: testo, sotto: "Stanza " + String(codice).toUpperCase(), indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { class: "modulo-nota", style: "text-align:center;margin-top:24px", text: "Collegamento in corso…" }));
    if (fa) s._piede.appendChild(fa);
    t.mostra(s);
  }

  // =========================================================
  //  DISEGNO ONLINE (host, ospiti e chi guarda): saletta, gioco, fine
  // =========================================================
  function miaSquadra(vm, cb) { var p = vm.players || []; for (var k = 0; k < p.length && k < 2; k++) if (p[k].id === cb.myId) return k; return -1; }
  function disegnaOnline(t, vm, cb) {
    if (vm.fase === "lobby") { UI = null; return lobby(t, vm, cb); }
    var me = miaSquadra(vm, cb), pl = vm.players || [], nomi = [(pl[0] || {}).nome || "Gialli", (pl[1] || {}).nome || "Blu"];
    if (vm.fase === "fine") {
      UI = null;
      var chiave = codiceDi(vm);
      if (me >= 0 && !cb.sonoHost && vm.stat && !giaSalvata(chiave)) salvaStat(vm, me, { modo: "online" });   // i miei trofei (una volta sola, anche se ricarico la pagina)
      var nota = vm.ritiro ? (me >= 0 ? "L'avversario ha lasciato la partita." : (nomi[1 - (vm.vincitore || 0)] || "L'avversario") + " ha lasciato la partita.")
        : (cb.guarda ? (t.eliminazione ? "Tra poco si torna al tabellone…" : "👀 Aspettiamo la prossima partita…") : (cb.sonoHost ? "" : "Se l'host fa un'altra partita, torni da solo nella saletta."));
      // la stessa fine è già sullo schermo (es. è entrato uno a guardare): niente da rifare, niente lampeggio
      var kFine = chiave + "|" + me + "|" + !!cb.sonoHost + "|" + nota;
      if (FINE.k === kFine && FINE.s && document.body.contains(FINE.s)) return;
      // chi guarda soltanto fuori dal torneo ha la targhetta del core in basso: faccine e uscita sono lì
      var targa = !!(cb.guarda && t.guarda && !t.eliminazione);
      var fa = t.faccine && !targa ? t.faccine() : null;   // la fila delle faccine (stanza online)
      if (fa) fa.style.margin = "0 0 8px";
      // online, chi ha giocato (host o avversario): i tasti di fine uguali per tutti, se li disegna il core. Anche chi guarda
      // soltanto, se il core li ha per lui (es. "Chi vince resta"), e chi è in più nella stanza solo nella Sala con "Chi gioca?"
      var gioca = !cb.guarda && (cb.sonoHost || me >= 0), guarda = cb.guarda ? !!t.guarda : (!cb.sonoHost && me < 0 && !!t.scelti);
      var comuni = (gioca || guarda) && t.tastiFine
        ? function (piede) { return t.tastiFine(piede, gioca ? { host: !!cb.sonoHost, nuova: cb.sonoHost ? cb.onNuova : null, esci: cb.onEsci } : { host: false, esci: cb.onEsci }); } : null;
      FINE.k = kFine;
      FINE.s = finale(t, { vincitore: vm.vincitore, nomi: nomi, gol: vm.gol, mia: me >= 0 ? me : null, rig: vm.rig, rigVinto: vm.rigVinto }, [
        fa,
        cb.sonoHost ? t.el("button", { class: "btn btn-primario", text: "↻ Nuova partita (stessi amici)", onclick: cb.onNuova }) : null,
        targa ? null : t.el("button", { class: "btn btn-fantasma", text: "🏠 Esci", onclick: cb.onEsci })], nota, comuni, fa);
      if (targa) FINE.s._piede.style.paddingBottom = "calc(58px + env(safe-area-inset-bottom))";   // (il posto della targhetta)
      return FINE.s;
    }
    FINE.k = null;
    if (!UI || !document.body.contains(UI.cv))
      UI = creaSchermo(t, cb, { flip: me === 1, ruota: false, nomi: nomi, omini: [(pl[0] || {}).omino || null, (pl[1] || {}).omino || null], muto: me < 0,
        // 💬 a chi gioca; a chi è in più nella stanza solo le faccine; chi guarda soltanto ha quelle del core
        chiac: cb.onChiac || null, soloFaccine: me < 0,
        targa: !!(cb.guarda && t.guarda && !t.eliminazione), fila: cb.guarda && t.eliminazione && t.faccine ? function () { return t.faccine(); } : null });
    UI.chiacOn(vm.ch === 1 && vm.fase === "gioco");
    var chi = { mie: me >= 0 ? [me] : [], bot: -1 }, qGiu = me === 1 ? 1 : 0;
    UI.aggiorna({ st: vm.st, gol: vm.gol, turno: vm.turno, fase: vm.stato, mie: chi.mie, solo: vm.solo, restoTurno: vm.restoTurno, restoPartita: vm.restoPartita,
      evento: vm.evento, puoi: me >= 0 && vm.stato === "mira" && vm.turno === me }, { giu: riga(vm, qGiu, chi), su: riga(vm, 1 - qGiu, chi) });
  }
  function codiceDi(vm) { return (vm.codice || "") + "-" + (vm.partita || "") + "-" + vm.n + "-" + (vm.gol || []).join(":"); }
  // le partite online già salvate da questo telefono (le ultime 30): ricaricando la pagina sulla fine non si contano due volte
  var CHIAVE_SALVATE = "sg-cb-salvate", salvateQui = [];
  function giaSalvata(k) {
    var l = salvateQui;
    try { l = JSON.parse(localStorage.getItem(CHIAVE_SALVATE) || "[]"); if (!Array.isArray(l)) l = []; } catch (e) { l = salvateQui; }
    if (l.indexOf(k) >= 0 || salvateQui.indexOf(k) >= 0) return true;
    l.push(k); salvateQui.push(k); l = l.slice(-30);
    try { localStorage.setItem(CHIAVE_SALVATE, JSON.stringify(l)); } catch (e) {}
    return false;
  }
  function lobby(t, vm, cb) {
    // (compatto: con la saletta e i tasti deve stare tutto in uno schermo da 360x640, senza scorrere)
    var el = t.el, me = miaSquadra(vm, cb), o = vm.opz || {}, extra = [], piccola = "margin:0 0 4px;text-align:center;font-size:.82rem;line-height:1.35";
    extra.push(el("p", { class: "modulo-nota", style: piccola, text: "🟡 Gialli chi apre la stanza, 🔵 blu chi entra · " +
      (o.vince === "tempo" ? "si gioca " + o.minuti + " minuti (se è pari, rigori)" : "vince chi arriva per primo a " + (o.gol || 3) + " gol") }));
    if (me >= 0) {   // ognuno sceglie la sua formazione: cinque tasti piccoli su una riga
      extra.push(el("div", { class: "etichetta", style: "margin:2px 0 3px", text: "La tua formazione" }));
      var g = el("div", { style: "display:flex;gap:4px;margin:0 0 4px" });
      NOMI_FORM.forEach(function (k) {
        var F = FORMAZIONI[k];
        g.appendChild(el("button", { class: "modo-chip" + ((vm.form || [])[me] === k ? " attiva" : ""), "aria-label": F.nome,
          style: "flex:1 1 0;min-width:0;width:auto;min-height:0;padding:5px 2px;gap:1px;flex-direction:column;justify-content:center;text-align:center;font-size:.64rem;line-height:1.15;border-radius:10px",
          onclick: function () { if (cb.onForm) cb.onForm(k); } },
          [el("span", { style: "font-size:1.15rem", text: F.icona }), el("span", { style: "font-weight:800", text: F.nome })]));
      });
      extra.push(g);
    }
    var info = [];
    if (vm.players[1] && vm.form) info.push(vm.players[0].nome + " " + FORMAZIONI[formOk(vm.form[0])].icona + " " + FORMAZIONI[formOk(vm.form[0])].nome + " · " + vm.players[1].nome + " " + FORMAZIONI[formOk(vm.form[1])].icona + " " + FORMAZIONI[formOk(vm.form[1])].nome);
    if (vm.spett && vm.spett.length) info.push("👀 Guardano: " + vm.spett.map(function (x) { return x.nome; }).join(", "));
    if (info.length) extra.push(el("p", { class: "modulo-nota", style: piccola + ";white-space:pre-line", text: info.join("\n") }));
    t.lobby({ host: cb.sonoHost, codice: vm.codice, pronta: vm.pronta, min: MIN,
      vuoti: Math.max(0, MIN - vm.players.length),
      giocatori: vm.players.map(function (p, i) { return { id: p.id, nome: p.nome, omino: p.omino || null, host: i === 0, tu: p.id === cb.myId }; }),
      extra: extra, attesa: me >= 0 ? "Aspetta che l'host cominci!" : (vm.players.length >= MAX ? "👀 Giocano " + vm.players[0].nome + " e " + vm.players[1].nome + ": tu guardi." : "Entro nella partita…"),
      onComincia: cb.onComincia, onEsci: cb.onEsci });
  }
  function errore(t, testo) {
    var s = t.schermata({ icona: "⚠️", titolo: "Ops" });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: testo }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "🏠 Torna alla home", onclick: t.esci }));
    t.mostra(s);
  }
  function senzaRete(t) {
    var s = t.schermata({ icona: "🔗", titolo: "Serve il sito pubblicato", indietro: t.esci });
    s._contenuto.appendChild(t.el("p", { style: "font-size:1.05rem;line-height:1.5", text: "Online funziona quando l'app è aperta dal sito pubblicato." }));
    s._piede.appendChild(t.el("button", { class: "btn btn-primario", text: "Ok", onclick: t.esci }));
    t.mostra(s);
  }

  var cssFatto = false;
  function stile() {
    if (cssFatto) return; cssFatto = true;
    var st = document.createElement("style");
    st.textContent = [
      ".schermata.cb-piena{padding:0!important;min-height:0;height:var(--alt,100dvh);overflow:hidden;background:radial-gradient(120% 75% at 50% 50%,#1c2d6e 0%,#0d1533 72%)}",
      ".schermata.cb-piena>.testa,.schermata.cb-piena>.piede{display:none}",
      ".schermata.cb-piena>.contenuto{height:100%;margin:0;padding:0}",
      ".cb-scena{position:relative;height:var(--alt,100dvh);overflow:hidden;user-select:none;-webkit-user-select:none;-webkit-tap-highlight-color:transparent}",
      ".cb-campo{position:absolute;inset:0;width:100%;height:100%;touch-action:none}",
      // il tasto per uscire: piccolo, nell'angolo (come negli altri giochi)
      ".cb-esci{position:absolute;top:calc(10px + env(safe-area-inset-top));left:10px;z-index:3;width:36px;height:36px;border:0;border-radius:12px;padding:0 0 3px;cursor:pointer;font:inherit;font-size:1.4rem;font-weight:900;line-height:1;color:#fff;background:rgba(255,255,255,.14)}",
      ".cb-audio{position:absolute;top:calc(10px + env(safe-area-inset-top));left:52px;z-index:3;width:36px;height:36px;border:0;border-radius:12px;padding:0;cursor:pointer;font:inherit;font-size:1.05rem;line-height:1;background:rgba(255,255,255,.14)}",
      ".cb-scena .cb-chiac{position:absolute;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));z-index:3}",   // il tasto 💬
      // chi guarda il torneo: il 😂 e la fila delle faccine del core (sopra la targhetta in basso)
      ".cb-fa{width:38px;height:38px;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.16);color:#fff;font-size:1.15rem;line-height:1;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.3);-webkit-tap-highlight-color:transparent}",
      ".cb-fila{position:absolute;left:50%;bottom:calc(58px + env(safe-area-inset-bottom));transform:translateX(-50%);z-index:5;width:min(340px,calc(100% - 24px));border-radius:999px;background:rgba(12,16,44,.92);box-shadow:0 6px 16px rgba(0,0,0,.4)}",
      // chi guarda soltanto: in basso c'è la targhetta del core (alta 44 px + 10): la targhetta della squadra sale sopra
      ".cb-scena.con-targa .cb-targa.giu{bottom:calc(64px + env(safe-area-inset-bottom))}",
      // l'orologio della partita a tempo (in alto a destra; nel torneo scende sotto il tasto 🏆)
      ".cb-orologio{position:absolute;top:calc(10px + env(safe-area-inset-top));right:10px;z-index:3;height:36px;padding:0 10px;border-radius:12px;display:flex;align-items:center;font-weight:900;font-size:.95rem;color:#fff;background:rgba(8,13,36,.82);box-shadow:0 0 0 2px rgba(255,255,255,.12);pointer-events:none}",
      ".cb-orologio[hidden]{display:none}",
      ".cb-orologio.sotto{top:calc(50px + env(safe-area-inset-top))}",
      ".cb-orologio.ultimi{color:#ffcc1f;box-shadow:0 0 0 2px #ffcc1f,0 0 14px 2px rgba(255,204,31,.6);animation:cbBatte 1s ease infinite}",
      "@keyframes cbBatte{50%{transform:scale(1.08)}}",
      // l'orologio girato per chi sta in alto (in due sullo stesso telefono): nel suo angolo in alto a destra
      ".cb-orologio.girato{top:auto;right:auto;bottom:calc(10px + env(safe-area-inset-bottom));left:10px;transform:rotate(180deg)}",
      ".cb-orologio.girato.ultimi{animation-name:cbBatte2}",
      "@keyframes cbBatte2{0%,100%{transform:rotate(180deg)}50%{transform:rotate(180deg) scale(1.08)}}",
      // con l'orologio le targhette lasciano posto ai lati
      ".cb-scena.tempo .cb-targa.su,.cb-scena.tempo.ruota .cb-targa{max-width:calc(100% - 196px)}",
      // la targhetta di ognuno: avatar piccolo, nome, messaggio e i suoi gol
      ".cb-targa{position:absolute;left:50%;transform:translateX(-50%);max-width:calc(100% - 112px);display:flex;align-items:center;gap:8px;padding:3px 4px 3px 3px;border-radius:999px;pointer-events:none;",
      "background:rgba(8,13,36,.82);box-shadow:0 0 0 2px rgba(255,255,255,.12);transition:box-shadow .25s}",
      ".cb-targa.giu{bottom:calc(10px + env(safe-area-inset-bottom))}",
      ".cb-targa.su{top:calc(10px + env(safe-area-inset-top))}",
      ".cb-targa.ruota{transform:translateX(-50%) rotate(180deg)}",
      ".cb-targa.turno{box-shadow:0 0 0 2px var(--sq),0 0 16px 2px var(--sq)}",
      ".cb-av{width:30px;height:30px;flex:none;border-radius:50%;overflow:hidden;background:rgba(255,255,255,.18)}",
      ".cb-av svg{width:100%;height:100%;display:block}",
      ".cb-testi{min-width:0;flex:1}",
      ".cb-nome{font-weight:900;font-size:.8rem;line-height:1.15;color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cb-msg{font-weight:800;font-size:.68rem;line-height:1.2;color:var(--sq);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
      ".cb-msg:empty{display:none}",
      ".cb-golnum{flex:none;min-width:1.5em;padding:0 8px;border-radius:999px;text-align:center;font-weight:900;font-size:1.35rem;line-height:30px;color:#0d1533;background:var(--sq)}",
      // l'esultanza: l'avatar che salta, la scritta e i coriandoli (solo transform e opacity)
      ".cb-festa{position:absolute;inset:0;z-index:4;pointer-events:none;overflow:hidden;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0}",
      ".cb-festa.su{animation:cbFesta 1.9s ease forwards}",
      "@keyframes cbFesta{0%{opacity:0}10%{opacity:1}82%{opacity:1}100%{opacity:0}}",
      ".cb-festa-blocco{display:flex;flex-direction:column;align-items:center;justify-content:center}",
      ".cb-festa.doppia{justify-content:space-around}",
      ".cb-festa.doppia .cb-festa-blocco{flex:1;min-height:0}",
      ".cb-festa-blocco.girata{transform:rotate(180deg)}",
      ".cb-festa.doppia .cb-festa-av{width:84px;height:86px}",
      ".cb-festa.doppia .cb-festa-txt{font-size:clamp(2rem,10vw,3.4rem)}",
      ".cb-festa-sotto{font-weight:900;font-size:1.3rem;color:#fff;text-shadow:0 3px 0 #0d1533;animation:cbScritta .5s cubic-bezier(.2,1.6,.4,1)}",
      ".cb-festa-av{width:120px;height:122px;border-radius:50%;overflow:hidden;background:radial-gradient(circle,rgba(255,255,255,.35),rgba(255,255,255,0) 70%);animation:cbSalta .5s ease-in-out 3 alternate}",
      ".cb-festa-av svg{width:100%;height:100%;display:block}",
      "@keyframes cbSalta{from{transform:translateY(0) scale(1)}to{transform:translateY(-26px) scale(1.06)}}",
      ".cb-festa-txt{font-weight:900;font-size:clamp(2.4rem,13vw,4.4rem);line-height:1.15;text-align:center;animation:cbScritta .5s cubic-bezier(.2,1.6,.4,1)}",
      "@keyframes cbScritta{from{transform:scale(.4)}to{transform:scale(1)}}",
      ".cb-cor{position:absolute;top:-14px;width:9px;height:14px;border-radius:2px;opacity:0;animation:cbCade 1.6s ease-in forwards}",
      "@keyframes cbCade{0%{opacity:1;transform:translate(0,0) rotate(0)}100%{opacity:0;transform:translate(var(--dx),105vh) rotate(var(--rot))}}",
      ".cb-fine{text-align:center;margin:18px 0 8px}",
      ".cb-fine-riga{display:flex;align-items:center;justify-content:center;gap:14px;font-weight:900;font-size:1.05rem}",
      ".cb-fine-riga b{font-size:2.6rem;color:#fff}",
      ".cb-fine-rig{text-align:center;font-weight:800;color:#ffcc1f;margin:0 0 8px}"
    ].join("");
    document.head.appendChild(st);
  }

  SG.registra({
    id: ID, nome: "Calcio Biliardo", icona: "⚽",
    descrizione: "Il calcio coi dischi: tiri indietro un calciatore come una fionda, colpisci la palla e fai gol. Contro il Bot, in due sullo stesso telefono o online.",
    giocatoriMin: 1, giocatoriMax: 2, difficolta: 2,
    postiOnline: 2,   // online si gioca in due: gli altri guardano
    riprende: true,   // se l'host ricarica la pagina, la partita riprende (stessi gol; un tiro a metà si rifà)
    ritardatari: "partita",   // chi arriva a partita cominciata la guarda ed entra alla prossima
    modi: [{ modo: "bot", icona: "🤖", nome: "Contro il computer", sotto: "Giochi da solo contro il Bot" },
      { modo: "telefono", icona: "📱", nome: "In due su questo telefono", sotto: "Uno per lato, il telefono in mezzo", amici: true }],
    regole: [
      "Ognuno ha <b>5 calciatori</b>. A turno se ne tira <b>uno</b>: toccalo, tira indietro il dito come una <b>fionda</b> e lascia. Più tiri indietro, più forte parte.",
      "I calciatori colpiscono la palla e gli altri calciatori e <b>rimbalzano sui bordi</b>. Fai entrare la palla nella porta avversaria! L'<b>attaccante</b> ha la tua faccia.",
      "Dopo un gol si riparte dal centro: batte chi ha preso gol. Si vince arrivando per primi ai <b>gol scelti</b>, oppure nella <b>partita a tempo</b> con più gol allo scadere.",
      "Se la partita a tempo finisce pari si va ai <b>rigori</b>: 3 a testa (poi a oltranza). Tira solo l'attaccante, il portiere si tuffa a caso.",
      "Se la palla si ferma <b>oltre la linea di porta</b> (per più di metà), è gol lo stesso: gol sulla linea!",
      "Prima di cominciare scegli la <b>formazione</b>: Classica, Catenaccio (più difesa), All'attacco, Rombo o Muro (tre difensori in fila davanti alla porta).",
      "Online hai <b>30 secondi</b> per tirare, poi tocca all'altro. Chi entra quando i due posti sono presi guarda la partita in diretta (e gioca la prossima, se si libera un posto)."
    ],
    impostazioni: function (box, dove, aiuti) {
      var el = aiuti.el;
      dove.modo = aiuti.modo || "bot"; dove.vince = "gol"; dove.gol = 3; dove.minuti = 3; dove.difficolta = "medio";
      dove.form = "classica"; dove.form2 = "classica"; dove.torneo = !!aiuti.torneo;
      if (aiuti.torneo) { dove.modo = "telefono"; return; }
      function chips(etichetta, scelte, chiave, val, colonne) {
        var w = el("div", {});
        w.appendChild(el("div", { class: "etichetta", style: "margin-top:8px", text: etichetta }));
        var g = el("div", { class: "modo-griglia", style: "grid-template-columns:repeat(" + (colonne || scelte.length) + ",1fr)" });
        scelte.forEach(function (c) {
          var b = el("button", { class: "modo-chip" + (c[0] === val ? " attiva" : ""), style: "justify-content:center;text-align:center", onclick: function () {
            dove[chiave] = c[0]; [].forEach.call(g.children, function (x) { x.className = "modo-chip"; }); b.className = "modo-chip attiva";
            if (c[2]) c[2]();
          } }, [el("div", { class: "mt", text: c[1] })]);
          g.appendChild(b);
        });
        w.appendChild(g); box.appendChild(w);
        return w;
      }
      var aGol, aTempo;
      chips("Come si vince", [["gol", "⚽ A gol", function () { aGol.hidden = false; aTempo.hidden = true; }], ["tempo", "⏱ A tempo", function () { aGol.hidden = true; aTempo.hidden = false; }]], "vince", "gol");
      aGol = chips("Si gioca fino a", [[1, "1 gol"], [3, "3 gol"], [5, "5 gol"]], "gol", 3);
      aTempo = chips("Quanto dura (se è pari, rigori)", [[2, "2 minuti"], [3, "3 minuti"], [5, "5 minuti"]], "minuti", 3);
      aTempo.hidden = true;
      var forme = NOMI_FORM.map(function (k) { return [k, nomeForm(k)]; });
      if (dove.modo === "telefono") {   // il primo della lista ha i gialli (sotto), il secondo i blu (in alto)
        chips("🟡 Gialli: il primo della lista (sta sotto)", forme, "form", "classica", 3);
        chips("🔵 Blu: il secondo della lista (sta in alto)", forme, "form2", "classica", 3);
      }
      else if (!aiuti.sala) chips(dove.modo === "online" ? "La tua formazione (la cambi anche in saletta)" : "La tua formazione", forme, "form", "classica", 3);
      if (dove.modo === "bot") chips("Bravura del Bot", [["facile", "Facile"], ["medio", "Medio"], ["difficile", "Difficile"]], "difficolta", "medio");
      if (dove.modo === "online" && CH()) CH().regola(el, box, dove);   // 💬 faccine e frasi durante la partita (l'host le può spegnere)
    },
    avvia: function (t) {
      if (t.linkParams && t.linkParams.stanza) return t.linkParams.guarda ? guarda(t, t.linkParams.stanza) : ospite(t, t.linkParams.stanza);   // invito o chi guarda (torneo)
      var m = (t.impostazioni || {}).modo;
      if (m === "online") return host(t);
      return locale(t, m === "telefono" ? "telefono" : "bot");
    }
  });

  // per le prove: la fisica e Bot, senza disegno
  window.__CB = { nuovoStato: nuovoStato, statoRigore: statoRigore, simula: simula, sceltaBot: sceltaBot, copia: copia, passo: passo, fermo: fermo, decisoRigori: decisoRigori, VMAX: VMAX };
})();

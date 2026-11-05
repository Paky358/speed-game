/* =========================================================
   SPeeD GAME — AVATAR «ILLUSTRATO» (strada A, 5 nov 2026)
   Lo stesso avatar di ognuno (stessa configurazione salvata), disegnato come un'illustrazione vera:
   proporzioni di una persona, occhi naso e bocca veri, capelli a ciocche, luce morbida e volumi
   (braccia e gambe come cilindri: luce a sinistra, ombra a destra). SVG col codice, niente immagini.
   Si accende con SGOmino.stile("illustrato") (lo decide core.js, interruttore AVATAR_A).
   Il disegno sta nello stesso riquadro di sempre (200×264, piedi a y 252): i giochi non cambiano.
   Le pose che non sono ancora ridisegnate (seduto, di spalle) le fa ancora il disegno di prima.

   I PEZZI (capelli, cappelli, vestiti, scarpe, bocche, barbe…) si registrano qui sotto e nei file
   dei pezzi con SGOminoA.pezzo("capelli", "corti", function (K) { … }). K = tutto quello che serve
   per disegnare (colori, misure del corpo e della testa, aiuti). Un pezzo che non c'è ancora prende
   quello «simile» (SGOminoA.SIMILI), così ognuno resta riconoscibile finché non arriva il suo.

   PIÙ LEGGERO (5 nov 2026): stesso disegno scritto con meno testo e meno elementi (−22% di testo, schermata −11%).
   - K.cr / K.limb / K.liscio scrivono la prima curva assoluta e le altre RELATIVE («c», «s» quando il punto di controllo
     è il riflesso del precedente): stessi punti di prima. Nei pezzi: non spostare i numeri di quei percorsi con un replace.
   - K.soft(col, op) è un segnaposto: dentro K.El / K.ElR diventa un gradiente per colore + fill-opacity (un gradiente solo
     per colore invece di uno per colore e intensità). Usato altrove funziona lo stesso (si aggiunge il gradiente di prima).
   - stroke-linejoin='round' sta UNA volta sull'<svg> (si eredita): K.St non lo ripete (stroke-linecap='round' sì).
     Un tratto che vuole spigoli vivi lo scrive: stroke-linejoin='miter'.
   - ritagli e gradienti uguali si scrivono una volta sola; numeri corti (".5", "10-4"); un pezzo solo di dipingi = un elemento.
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGOminoA = { capelli: {}, cappelli: {}, capo: {}, sotto: {}, scarpe: {}, bocca: {}, barba: {}, segno: {}, stampa: {}, extra: {}, inmano: {},
    occhiali: {}, orecchini: {}, collo: {}, borsa: {}, mano: {}, schiena: {}, animale: {}, pittura: {} };
  A.pezzo = function (tipo, nome, fn) { (A[tipo] = A[tipo] || {})[nome] = fn; };

  // ---------- aiuti ----------
  var H2R = {}, HEX = [];
  for (var i0 = 0; i0 < 256; i0++) HEX.push(("0" + i0.toString(16)).slice(-2));
  function h2r(h) { var k = H2R[h]; if (k) return k; var h0 = h; h = String(h).replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return (H2R[h0] = [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]); }   // (non modificare l'array: è in memoria)
  function hx(v) { v = Math.round(v); return v >= 0 && v <= 255 ? HEX[v] : ("0" + Math.max(0, Math.min(255, v)).toString(16)).slice(-2); }
  function r2h(r) { return "#" + hx(r[0]) + hx(r[1]) + hx(r[2]); }
  function mix(a, b, t) { var X = h2r(a), Y = h2r(b); return "#" + hx(X[0] + (Y[0] - X[0]) * t) + hx(X[1] + (Y[1] - X[1]) * t) + hx(X[2] + (Y[2] - X[2]) * t); }
  function lum(h) { var c = h2r(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function rnd(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function n1(v) { return Math.round(v * 10) / 10; }
  // (leggero, 5 nov 2026) gli stessi numeri di n1 scritti corti: ".5" invece di "0.5", "-.5" invece di "-0.5";
  // N(v) li mette in fila nei percorsi con lo spazio solo dove serve ("10-4", "1.5.5"); N(v, 1) = il primo dopo una lettera
  // (con i numeri interi: più veloce che scrivere un numero con la virgola)
  function q(v) { var k = Math.round(v * 10), neg = k < 0, a = neg ? -k : k, r = a % 10, i = (a - r) / 10; return r ? (neg ? "-" : "") + (i ? i : "") + "." + r : (neg ? "-" : "") + i; }
  var qP = false;   // l ultimo numero scritto da N aveva il punto
  function T(k, primo) { var neg = k < 0, a = neg ? -k : k, r = a % 10, i = (a - r) / 10, sp = primo || neg || (!i && r && qP) ? "" : " "; qP = r !== 0; return sp + (r ? (neg ? "-" : "") + (i ? i : "") + "." + r : (neg ? "-" : "") + i); }   // k = decimi interi
  function N(v, primo) { return T(Math.round(v * 10), primo); }
  // curva liscia che passa per i punti (Catmull-Rom → Bézier)
  function cr(p) {
    var s = "", px = 0, py = 0, qx = 0, qy = 0;   // (in decimi) il punto dove si è e l'ultimo punto di controllo
    for (var i = 0; i < p.length - 1; i++) {
      var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c;
      var x1 = Math.round((b[0] + (c[0] - a[0]) / 6) * 10), y1 = Math.round((b[1] + (c[1] - a[1]) / 6) * 10), x2 = Math.round((c[0] - (d[0] - b[0]) / 6) * 10), y2 = Math.round((c[1] - (d[1] - b[1]) / 6) * 10), x = Math.round(c[0] * 10), y = Math.round(c[1] * 10);
      if (!i) s += "C" + T(x1, 1) + T(y1) + T(x2) + T(y2) + T(x) + T(y);
      else if (2 * px - qx === x1 && 2 * py - qy === y1) s += "s" + T(x2 - px, 1) + T(y2 - py) + T(x - px) + T(y - py);
      else s += "c" + T(x1 - px, 1) + T(y1 - py) + T(x2 - px) + T(y2 - py) + T(x - px) + T(y - py);
      px = x; py = y; qx = x2; qy = y2;
    }
    return s;
  }
  // forma rastremata lungo una linea: n = [[x, y, larghezza], …]; bulge = punta arrotondata
  function limb(n, bulge) {
    var L = [], R = [];
    for (var i = 0; i < n.length; i++) {
      var a = n[Math.max(0, i - 1)], b = n[Math.min(n.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = n[i][2] / 2;
      L.push([n[i][0] + nx * w, n[i][1] + ny * w]); R.push([n[i][0] - nx * w, n[i][1] - ny * w]);
    }
    var Rr = R.slice().reverse(), e = L.length - 1;
    var s0 = "M" + N(L[0][0], 1) + N(L[0][1]) + cr(L);   // (in ordine: N ricorda l'ultimo numero scritto)
    s0 += bulge ? "Q" + N((L[e][0] + Rr[0][0]) / 2 + (n[e][0] - n[e - 1][0]) * bulge, 1) + N((L[e][1] + Rr[0][1]) / 2 + (n[e][1] - n[e - 1][1]) * bulge) + N(Rr[0][0]) : "L" + N(Rr[0][0], 1);
    return s0 + N(Rr[0][1]) + cr(Rr) + "Z";
  }
  function poli(p) { var s = "M", px = 0, py = 0; for (var i = 0; i < p.length; i++) { var x = Math.round(p[i][0] * 10), y = Math.round(p[i][1] * 10); s += i ? "l" + T(x - px, 1) + T(y - py) : T(x, 1) + T(y); px = x; py = y; } return s + "Z"; }
  function liscio(p) { return "M" + N(p[0][0], 1) + N(p[0][1]) + cr(p); }   // linea liscia aperta
  function lisciaChiusa(p) { var z = p.concat([p[0]]); return "M" + N(p[0][0], 1) + N(p[0][1]) + cr(z) + "Z"; }
  var DEG = Math.PI / 180;

  // ---------- le tabelle (stesse voci dell'editor di sempre) ----------
  // corporature (mezze larghezze, mondo 400×1000): collo, attaccatura delle spalle, spalla, ascella, petto, vita, fianchi; braccio [spalla, gomito, avambraccio, polso]; lw = gambe
  var BUILD = {
    uomo: { snello: { nk: 26, shx: 72, sho: 94, ap: 76, ch: 72, wt: 63, hp: 68, aw: [40, 33, 35, 27], lw: 0.86 },
            medio: { nk: 29, shx: 80, sho: 104, ap: 84, ch: 82, wt: 73, hp: 77, aw: [46, 38, 40, 30], lw: 1 },
            robusto: { nk: 34, shx: 90, sho: 118, ap: 98, ch: 100, wt: 99, hp: 98, aw: [54, 45, 46, 35], lw: 1.2, pancia: 1 } },
    donna: { snello: { nk: 19, shx: 58, sho: 80, ap: 64, ch: 64, wt: 49, hp: 73, aw: [32, 26, 28, 22], lw: 0.88, seno: 0.8 },
             medio: { nk: 21, shx: 64, sho: 88, ap: 70, ch: 72, wt: 55, hp: 83, aw: [36, 30, 31, 25], lw: 1, seno: 1 },
             robusto: { nk: 25, shx: 72, sho: 96, ap: 82, ch: 90, wt: 72, hp: 105, aw: [44, 37, 38, 30], lw: 1.22, seno: 1.3, pancia: 0.5 } }
  };
  ["uomo", "donna"].forEach(function (s) { for (var k in BUILD[s]) { var a = BUILD[s][k].aw; BUILD[s][k].aw = [a[0] * 1.1, a[1] * 1.1, a[2] * 1.1, a[3] * 1.15]; } });   // (secondo tempo) braccia più piene
  // gambe: [y, distanza del centro della gamba dal centro, mezza larghezza fuori, mezza larghezza dentro]
  var GAMBA = {
    uomo: [[548, 35, 45, 36], [610, 35, 43, 34], [670, 36, 37, 29], [722, 37, 30, 25], [748, 38, 28, 24], [790, 39, 31, 27], [834, 40, 28, 28], [884, 42, 21, 20], [938, 44, 17, 16]],
    donna: [[548, 38, 48, 36], [610, 37, 45, 33], [670, 35, 38, 27], [722, 34, 28, 23], [748, 34, 26, 22], [790, 35, 29, 25], [834, 36, 26, 24], [884, 38, 19, 18], [938, 40, 15, 14]]
  };
  // forme del viso (testa: origine al mento, guance a y -78): cw guance, jx/jy angolo della mascella, cx mento, L altezza della fronte
  var FACCIA = {
    tondo: { cw: 56, jx: 48, jy: -27, cx: 23, L: 0.95 }, ovale: { cw: 53, jx: 42, jy: -23, cx: 16, L: 1 },
    squadrato: { cw: 55, jx: 51, jy: -19, cx: 25, L: 0.98, k1: 4 }, cuore: { cw: 57, jx: 35, jy: -21, cx: 9, L: 1.02 },
    lungo: { cw: 50, jx: 42, jy: -20, cx: 16, L: 1.1 }, paffuto: { cw: 59, jx: 54, jy: -30, cx: 28, L: 0.94 }
  };
  // occhi: sx/sy misura, tilt gradi (in su verso fuori), lid palpebra (0-0.6), lower = palpebra sotto
  var OCCHI = {
    tondi: { sx: 0.97, sy: 1.22 }, dolci: { sx: 1, sy: 1.08, tilt: -5, lid: 0.08 }, grandi: { sx: 1.16, sy: 1.3 },
    mandorla: { sx: 1.1, sy: 0.82, tilt: 7 }, felici: { felice: 1 }, furbi: { sx: 1.04, sy: 0.74, tilt: 5, lid: 0.26 },
    assonnati: { lid: 0.48, sy: 1 }, puntini: { sx: 0.8, sy: 0.86, piccola: 1 }, occhiolino: { occhiolino: 1 },
    ciglia: { ciglia: 2, sy: 1.08 }, felini: { tilt: 13, sy: 0.84, sx: 1.08, linea: 1 }, tristi: { tilt: -11, lid: 0.12 },
    stelline: { sx: 1.08, sy: 1.18, stelle: 1 }, chiusi: { chiusi: 1 }
  };
  // sopracciglia: w spessore, arc arco, dy alzate, iu interno in su (+) o in giù (-), picco (0-1)
  var SOPRA = {
    morbide: { w: 6, arc: 6 }, decise: { w: 8.4, arc: 5, iu: -1 }, alzate: { w: 6, arc: 9, dy: -6 }, sottili: { w: 3.6, arc: 6 },
    folte: { w: 11, arc: 4 }, arcuate: { w: 5.4, arc: 11, picco: 0.66 }, preoccupate: { w: 6.4, arc: 2, iu: 8 }, dritte: { w: 7, arc: 1 },
    unite: { w: 7.6, arc: 4, unite: 1 }, fini: { w: 2.4, arc: 7 }, arrabbiate: { w: 7.6, arc: 1, iu: -9 }, tagliate: { w: 7.4, arc: 5, taglio: 1 }
  };
  // naso: w larghezza, l lunghezza, punta, insu, gobba
  var NASO = {
    piccolo: { w: 0.86, l: 0.86, punta: 0.9 }, tondo: { w: 1.05, punta: 1.35 }, punta: { w: 0.86, l: 1.04, punta: 0.75, aguzzo: 1 },
    largo: { w: 1.3, punta: 1.15 }, insu: { insu: 1, l: 0.9 }, aquilino: { gobba: 1, l: 1.08 }, puntino: { w: 0.66, l: 0.62, punta: 0.7 },
    patata: { w: 1.24, punta: 1.6 }, lungo: { l: 1.22, w: 0.95 }, dritto: {}
  };

  // i pezzi non ancora ridisegnati: quello più simile (si aggiorna man mano che arrivano i pezzi veri)
  A.SIMILI = {
    capelli: { trecce: "treccia", codebasse: "codini", chignondoppio: "chignon", frangialunghi: "frangia", bobfrangia: "frangia", cresta: "undercut", surfista: "mossi", spike: "spettinati", banana: "ciuffo", treccine: "riccicorti", afroalto: "afrocorto", riccioletti: "riccicorti", ricciciuffo: "riccicorti",
      spazzola: "sfumato", caesar: "corti", codinouomo: "indietro", scodella: "corti", mullet: "spettinati",
      emo: "ciuffo", codinobasso: "indietro", anime: "spettinati", arruffati: "spettinati", dread: "riccicorti", rocker: "spettinati", afrocorto: "riccicorti",
      tendina: "caschetto", caschettolungo: "caschetto", ciuffolaterale: "pixie", scalati: "mossi", boccolimedi: "riccilunghi",
      riccibob: "caschetto", riccifrangia: "riccilunghi", bobasimmetrico: "caschetto", sfilato: "pixie",
      mezzacoda: "lunghi", chignonspettinato: "chignon", ricci: "riccilunghi", afro: "riccilunghi", lunghissimi: "lunghi", codalaterale: "coda",
      boccoli: "riccilunghi", rigalato: "lunghi", hime: "lunghi", tendinalunghi: "lunghi" },
    // vestiti
    capo: { lunga: "maglietta", felpa: "lunga", camicia: "lunga", canotta: "maglietta", polo: "maglietta", dolcevita: "lunga", giacca: "lunga", bomber: "lunga",
      calcio: "maglietta", gilet: "lunga", sportiva: "lunga", cappotto: "lunga", grembiule: "maglietta", supereroe: "lunga", crop: "maglietta", top: "maglietta",
      camicetta: "maglietta", cardigan: "lunga", maglione: "lunga", vestito: "maglietta", vestitolungo: "maglietta" },
    sotto: { strappati: "jeans", cargo: "pantaloni", mimetici: "pantaloni", tuta: "pantaloni", pantaloncini: "jeans", bermuda: "jeans", gonna: "jeans", gonnalunga: "jeans",
      leggings: "pantaloni", zampa: "jeans", shortsjeans: "jeans", minigonna: "jeans", gonnapieghe: "jeans", gonnatubino: "pantaloni" },
    scarpe: {}, cappelli: { tiara: "cerchietto", mago: "festa" }, bocca: {}, barba: {}
  };
  // il pezzo da disegnare per quella voce (il suo, o il più simile; per le scarpe e le bocche si ripiega sulla prima)
  var RIPIEGO = { capelli: "corti", capo: "maglietta", sotto: "jeans", scarpe: "sneakers", bocca: "neutro", barba: "accenno" };
  function pezzoDi(tipo, v) {
    var T = A[tipo] || {};
    if (T[v]) return { fn: T[v], nome: v };
    var s = (A.SIMILI[tipo] || {})[v], giri = 0;
    while (s && !T[s] && giri++ < 4) s = (A.SIMILI[tipo] || {})[s];
    if (s && T[s]) return { fn: T[s], nome: s };
    return RIPIEGO[tipo] && T[RIPIEGO[tipo]] ? { fn: T[RIPIEGO[tipo]], nome: RIPIEGO[tipo] } : null;
  }
  A.pezzoDi = pezzoDi;
  // c'è il disegno vero di questa voce? (l'editor nasconde quelle che non ci sono ancora)
  var VOCE_TIPO = { capelli: "capelli", capo: "capo", sotto: "sotto", modScarpe: "scarpe", cappello: "cappelli", bocca: "bocca", barba: "barba", segno: "segno", stampa: "stampa",
    occhiali: "occhiali", orecchini: "orecchini", collo: "collo", borsa: "borsa", mano: "inmano", schiena: "schiena", animale: "animale", pittura: "pittura" };
  A.disegnato = function (voce, v) {
    var t = VOCE_TIPO[voce]; if (!t) return true;
    if (v === "nessuno" || v === "nessuna" || v === "no") return true;
    if (voce === "capelli" && v === "calvo") return !!A.capelli.calvo;
    return !!(A[t] && A[t][v]);
  };
  // pose che il disegno nuovo sa fare (le altre: disegno di prima)
  A.puo = function (opts) { return true; };

  // ---------- i gesti (secondo tempo): dove va la mano, quanto si accorcia il braccio che viene avanti, che mano ----------
  // t(G) = [distanza dal centro dalla parte del braccio, quota] del polso; f = accorciamento (braccio e avambraccio che vengono
  // verso chi guarda); davanti = il braccio passa davanti al corpo. «uno» = solo il braccio di opts.lato (1 = a destra nel
  // disegno, di partenza), «due» = tutte e due.
  var GESTI = {
    // (le mani restano dentro il taglio «vita»: dalla testa alla vita, viewBox 46 11 108 118)
    saluta:   { uno: { t: function (G) { return [G.Jd + 56, G.Jy - 128]; }, mano: "aperta" } },
    applaude: { due: { t: function (G) { return [9, G.Y.petto - 10]; }, f: [0.96, 0.84], mano: "aperta", davanti: 1, dirMano: 172 } },
    esulta:   { due: { t: function (G) { return [G.Jd + 56, G.Jy - 168]; }, mano: "pugno" } },
    posa:     { uno: { t: function (G) { return [24, G.Y.vita - 10]; }, f: [0.88, 0.76], mano: "tiene", davanti: 1 } },
    preme:    { uno: { t: function (G) { return [G.Jd * 0.42, G.Y.vita - 16]; }, f: [0.88, 0.8], mano: "indica", davanti: 1, dirMano: 8 } },
    leva:     { uno: { t: function (G) { return [G.Jd + 48, G.Y.petto - 6]; }, f: [0.96, 0.9], mano: "pugno" } },   // il pugno di lato, all altezza del petto: tira una leva o gira una ruota
    batte:    { uno: { t: function (G) { return [G.Jd * 0.62, G.Y.vita - 30]; }, f: [0.9, 0.7], mano: "pugno", davanti: 1, dirMano: 0 } },
    // al tavolo (il tavolo copre dalla vita in giù): le due mani appoggiate davanti, e le carte tenute davanti al petto
    tavolo:   { due: { t: function (G) { return [G.Jd * 0.9, G.Y.vita - 24]; }, f: [0.94, 0.62], mano: "piatta", davanti: 1, dirMano: -16, schiaccia: 0.72 } },
    carte:    { due: { t: function (G) { return [24, G.Y.petto + 34]; }, f: [0.94, 0.76], mano: "pugno", davanti: 1, dirMano: 160, carte: 1 } }
  };
  A.GESTI = GESTI;
  // SEDUTO (front): il busto scende di dy; le cosce (da yAB a yBC) si accorciano (vengono verso chi guarda), gli stinchi pure,
  // i piedi restano a terra. Il sedere tocca la seduta a y 784 del mondo (198 nel riquadro, come prima).
  var SED = { dy: 188, yAB: 596, yBC: 748, sB: 0.4, yCD: 930, kx: 1 };
  SED.yA = SED.yAB + SED.dy; SED.yK = SED.yA + (SED.yBC - SED.yAB) * SED.sB; SED.sC = (SED.yCD - SED.yK) / (SED.yCD - SED.yBC);
  A.SEDUTO = SED;
  // due ossa (braccio e avambraccio) che portano il polso su T: il gomito sta verso fuori
  function ik(J, T, l1, l2, lato) {
    var dx = T[0] - J[0], dy = T[1] - J[1], d = Math.hypot(dx, dy) || 1, dd = Math.max(Math.abs(l1 - l2) + 2, Math.min(l1 + l2 - 2, d));
    var W = [J[0] + dx / d * dd, J[1] + dy / d * dd], ca = (l1 * l1 + dd * dd - l2 * l2) / (2 * l1 * dd), An = Math.acos(Math.max(-1, Math.min(1, ca))), b = Math.atan2(dy, dx);
    var E1 = [J[0] + l1 * Math.cos(b + An), J[1] + l1 * Math.sin(b + An)], E2 = [J[0] + l1 * Math.cos(b - An), J[1] + l1 * Math.sin(b - An)];
    return { E: (E1[0] - J[0]) * lato > (E2[0] - J[0]) * lato ? E1 : E2, W: W };
  }
  // la geometria del corpo (la usano il disegno, A.mano e i giochi): misure, gambe, braccia nella posa chiesta
  A.geometria = function (c, opts) {
    opts = opts || {};
    var m = c.forma !== "donna", B = BUILD[m ? "uomo" : "donna"][c.corpo] || BUILD[m ? "uomo" : "donna"].medio, C = 200;
    var Y = { collo: 246, spalla: 268, delt: 296, ascella: 336, petto: m ? 372 : 382, vita: m ? 452 : 442, fianchi: 528, cavallo: 572 };
    var lw = B.lw, GN = GAMBA[m ? "uomo" : "donna"].map(function (q) { return [q[0], q[1] * (1 + (lw - 1) * 0.75), q[2] * lw, q[3] * lw]; });
    function gIn(y) {
      if (y <= GN[0][0]) return [GN[0][1], GN[0][2], GN[0][3]];
      for (var i = 1; i < GN.length; i++) if (y <= GN[i][0]) { var a = GN[i - 1], b = GN[i], t = (y - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; }
      var z = GN[GN.length - 1]; return [z[1], z[2], z[3]];
    }
    var pancia = B.pancia ? (m ? 4 : 3) : 0, rc = B.aw[0] * 0.56, Jd = B.sho - rc, Jy = Y.delt - 4, kb = m ? 1 : 0.94, L1 = 142 * kb, L2 = 126 * kb;
    // mezza larghezza del corpo a quella quota (per tenere le braccia un po' staccate dal fianco)
    var LT = [[Y.ascella, B.ap], [Y.petto, B.ch], [Y.vita, B.wt + pancia], [Y.fianchi, B.hp], [560, gIn(560)[0] + gIn(560)[1]], [640, gIn(640)[0] + gIn(640)[1]]];
    function largTronco(y) { if (y <= LT[0][0]) return LT[0][1]; for (var i = 1; i < LT.length; i++) if (y <= LT[i][0]) { var t = (y - LT[i - 1][0]) / (LT[i][0] - LT[i - 1][0]); return LT[i - 1][1] + (LT[i][1] - LT[i - 1][1]) * t; } return LT[LT.length - 1][1]; }
    var gesto = opts.gesto && GESTI[opts.gesto], latoG = opts.lato === -1 ? -1 : 1, GG = { Jd: Jd, Jy: Jy, Y: Y, B: B, C: C, m: m };
    function cl(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function braccio(lato) {
      var J = [C + lato * Jd, Jy], br = opts.braccia, E, W, mano = "rilassata", polso = 0, davanti = false, dirMano = null, schiaccia = 1;
      var su = br === "su" || (br === "uno" && lato === -1), canna = br === "canna" && lato === 1;
      var gd = gesto && !su && !canna ? (gesto.due || (lato === latoG ? gesto.uno : null)) : null;
      if (su || canna) {
        var a1, a2;
        if (su) { a1 = 128; a2 = 152; mano = "aperta"; } else { var an = cl(+opts.angolo || 0, -30, 175); a1 = Math.max(4, an - 14); a2 = Math.max(10, an + 10); mano = "pugno"; }
        E = [J[0] + lato * L1 * Math.sin(a1 * DEG), J[1] + L1 * Math.cos(a1 * DEG)]; W = [E[0] + lato * L2 * Math.sin(a2 * DEG), E[1] + L2 * Math.cos(a2 * DEG)];
      } else if (gd) {
        var f = gd.f || [1, 1], T = gd.t(GG), r = ik(J, [C + lato * T[0], T[1]], L1 * f[0], L2 * f[1], lato);
        E = r.E; W = r.W; mano = gd.mano || mano; polso = gd.polso || 0; davanti = !!gd.davanti; dirMano = gd.dirMano; schiaccia = gd.schiaccia || 1;
      } else if (opts.seduto) {   // seduto: le mani appoggiate sulle cosce, vicino alle ginocchia
        var g7 = gIn(690), rs = ik(J, [C + lato * (g7[0] * SED.kx + 6), SED.yK - SED.dy - 18], L1, L2 * 0.72, lato);
        E = rs.E; W = rs.W; mano = "piatta"; davanti = true;
      } else {   // a riposo: le braccia un po' staccate dal fianco
        var yE = J[1] + L1 * 0.99, ar = Math.asin(cl((largTronco(yE) + 9 + B.aw[1] / 2 - Jd) / L1, 0.03, 0.55));
        E = [J[0] + lato * L1 * Math.sin(ar), J[1] + L1 * Math.cos(ar)];
        var yW = E[1] + L2 * 0.98, aw2 = Math.max(ar * 0.6, Math.asin(cl((largTronco(yW) + 9 + B.aw[3] / 2 - (E[0] - C) * lato) / L2, 0.02, 0.55)));
        W = [E[0] + lato * L2 * Math.sin(aw2), E[1] + L2 * Math.cos(aw2)];
      }
      var l1 = Math.hypot(E[0] - J[0], E[1] - J[1]), l2 = Math.hypot(W[0] - E[0], W[1] - E[1]);
      var d1 = [(E[0] - J[0]) / l1, (E[1] - J[1]) / l1], aw = B.aw, S0 = [J[0] - d1[0] * 16, J[1] - d1[1] * 16];
      function at(P, Q, t) { return [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]; }
      var nodi = [[S0[0], S0[1], aw[0] * 0.86], [J[0], J[1], aw[0]], at(J, E, 0.14).concat([aw[0]]), at(J, E, 0.5).concat([aw[0] * 0.9]), [E[0], E[1], aw[1]], at(E, W, 0.22).concat([aw[2]]), at(E, W, 0.6).concat([aw[2] * 0.86]), [W[0], W[1], aw[3]]];
      return { lato: lato, J: J, E: E, W: W, l1: l1, l2: l2, a1: Math.atan2(lato * (E[0] - J[0]), E[1] - J[1]) / DEG, a2: Math.atan2(lato * (W[0] - E[0]), W[1] - E[1]) / DEG,
        su: su, canna: canna, nodi: nodi, mano: mano, polso: polso, davanti: davanti, dirMano: dirMano, schiaccia: schiaccia };
    }
    return { m: m, B: B, Y: Y, C: C, GN: GN, gIn: gIn, pancia: pancia, rc: rc, Jd: Jd, Jy: Jy, L1: L1, L2: L2, largTronco: largTronco, BR: { "-1": braccio(-1), "1": braccio(1) } };
  };

  var cnt = 0, PREF = "oa" + Math.random().toString(36).slice(2, 5);

  // =========================================================
  //  IL DISEGNO
  // =========================================================
  A.svg = function (c, opts, OPZ) {
    opts = opts || {};
    var m = c.forma !== "donna";
    var p = PREF + (cnt++).toString(36) + "_";
    var D = [];   // definizioni (gradienti, ritagli)
    function col(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }
    function stops(st) { return st.map(function (s) { return "<stop" + (+s[0] ? " offset='" + s[0] + "'" : "") + " stop-color='" + s[1] + "'" + (s[2] != null && +s[2] !== 1 ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join(""); }
    var gradC = {}, gradA = {};
    function gradUno(id, t) { var sp = t.indexOf(" "), k = t.slice(1, sp) + t.slice(sp + p.length + id.length + 6); if (gradC[k]) { gradA[id] = gradC[k]; return gradC[k]; } D.push(t); return (gradC[k] = "url(#" + p + id + ")"); }
    function LG(id, x1, y1, x2, y2, st, us) { return gradUno(id, "<linearGradient id='" + p + id + "'" + (us || +x1 ? " x1='" + x1 + "'" : "") + (us || +y1 ? " y1='" + y1 + "'" : "") + (us || +x2 !== 1 ? " x2='" + x2 + "'" : "") + (us || +y2 ? " y2='" + y2 + "'" : "") + (us ? " gradientUnits='userSpaceOnUse'" : "") + ">" + stops(st) + "</linearGradient>"); }
    function RG(id, st, extra) { return gradUno(id, "<radialGradient id='" + p + id + "' " + (extra || "") + ">" + stops(st) + "</radialGradient>"); }
    var nSoft = 0;
    var softC = {};
    // (leggero, 5 nov 2026) K.soft dà un segnaposto; El/ElR lo scrivono come gradiente del colore (uno per colore) + fill-opacity:
    // stesso disegno, molti meno gradienti. Se un segnaposto finisce altrove, fine() aggiunge il gradiente di prima.
    var softI = {}, softB = {}, nSB = 0, nSC = 0, nSR = 0;   // nSC = ombre chieste, nSR = ombre scritte da El/ElR
    function soft(col, op) { nSC++; op = Math.round(op * 100) / 100; var k = col + op; if (softC[k]) return softC[k]; var id = p + "z" + (nSoft++).toString(36); softI["url(#" + id + ")"] = [col, op, id]; return (softC[k] = "url(#" + id + ")"); }
    function opz(v) { var t = "" + v; return v > 0 && v < 1 ? t.slice(1) : t; }
    function fine(sv) {
      if (nSR >= nSC || sv.indexOf("url(#" + p + "z") < 0) return sv;   // (se ogni K.soft è finita in un'ellisse non serve cercare)
      var g = ""; for (var k in softI) if (sv.indexOf(k) >= 0) { var si = softI[k]; g += "<radialGradient id='" + si[2] + "'><stop stop-color='" + si[0] + "' stop-opacity='" + opz(si[1]) + "'/><stop offset='1' stop-color='" + si[0] + "' stop-opacity='0'/></radialGradient>"; }
      var i = sv.indexOf("<defs>"); return i < 0 ? sv : sv.slice(0, i + 6) + g + sv.slice(i + 6);
    }
    function U(id) { return gradA[id] || "url(#" + p + id + ")"; }
    function Pa(d, f, x) { return "<path d='" + d + "' fill='" + f + "'" + (x || "") + "/>"; }
    function St(d, c2, w, op, x) { return "<path d='" + d + "' fill='none' stroke='" + c2 + "' stroke-width='" + w + "' stroke-linecap='round'" + (op != null ? " opacity='" + op + "'" : "") + (x ? tolto(x) : "") + "/>"; }
    // (un pezzo che passa ancora stroke-linecap/linejoin in x: valeva già il round scritto prima (la seconda copia è ignorata);
    //  la si toglie perché un attributo doppio rompe l'SVG come immagine)
    var RX_TOLTO = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
    function tolto(x) { return x.indexOf("stroke-line") < 0 ? x : x.replace(RX_TOLTO, ""); }
    function El(cx, cy, rx, ry, f, x) { return "<ellipse cx='" + q(cx) + "' cy='" + q(cy) + "' rx='" + q(rx) + "' ry='" + q(ry) + "' " + riempi(f) + (x || "") + "/>"; }
    function riempi(f) {
      var si = softI[f]; if (!si) return "fill='" + f + "'"; nSR++;
      var b = softB[si[0]]; if (!b) { b = softB[si[0]] = p + "b" + (nSB++).toString(36); D.push("<radialGradient id='" + b + "'><stop stop-color='" + si[0] + "'/><stop offset='1' stop-color='" + si[0] + "' stop-opacity='0'/></radialGradient>"); }
      return "fill='url(#" + b + ")' fill-opacity='" + opz(si[1]) + "'";
    }
    var nClip = 0;
    var clipC = {};
    function clip(d) { var kc = Array.isArray(d) ? d.join("|") : d; if (clipC[kc]) return clipC[kc]; return (clipC[kc] = clip0(d)); }
    function clip0(d) { var id = "c" + (nClip++); D.push("<clipPath id='" + p + id + "'>" + (Array.isArray(d) ? d : [d]).map(function (x) { return "<path d='" + x + "'/>"; }).join("") + "</clipPath>"); return "url(#" + p + id + ")"; }
    // un cilindro: luce a sinistra, ombra a destra (sulla forma intera: braccia, gambe, maniche)
    var cilCache = {};
    function cil(colore, forza) {
      forza = forza == null ? 1 : forza;
      var k = colore + "|" + forza; if (cilCache[k]) return cilCache[k];
      var L = lum(colore), chiaro = mix(colore, "#ffffff", (0.22 + 0.16 * (1 - L)) * forza), scuro = mix(colore, "#1a0c14", (0.28 + 0.1 * L) * forza), bordo = mix(colore, "#12060c", (0.46 + 0.1 * L) * forza);
      return (cilCache[k] = LG("cy" + Object.keys(cilCache).length, 0, 0, 1, 0, [[0, mix(colore, scuro, 0.35)], [0.12, mix(colore, chiaro, 0.7)], [0.3, chiaro], [0.55, colore], [0.82, scuro], [1, bordo]]));
    }

    // ---------- colori ----------
    var sk = col(OPZ.pelle, c.pelle), Lsk = lum(sk);
    var skL = mix(sk, "#fff3e8", 0.2 + 0.22 * Lsk), skD = mix(sk, Lsk < 0.35 ? "#3a160c" : "#b4583a", Lsk < 0.35 ? 0.3 : 0.3), skDD = mix(sk, "#4a1a10", Lsk < 0.35 ? 0.42 : 0.55);
    var hc = col(OPZ.colCap, c.colCap), Lh = lum(hc);
    var hL = mix(hc, Lh < 0.18 ? "#8a7a70" : (Lh > 0.7 ? "#ffffff" : "#fff1dc"), Lh < 0.18 ? 0.3 : 0.36), hD = mix(hc, "#120a05", 0.45), hDD = mix(hc, "#0a0503", Lh < 0.18 ? 0.5 : 0.7);
    var iris = col(OPZ.iride, c.iride);
    var mg = col(OPZ.maglia, c.maglia), pt = col(OPZ.pantaloni, c.pantaloni), sc = col(OPZ.scarpe, c.scarpe), ac = col(OPZ.colAcc, c.colAcc == null ? c.maglia : c.colAcc);
    var cc = col(OPZ.colCollo, c.colCollo);
    var labbro = m ? mix(sk, "#b5594f", Lsk < 0.35 ? 0.3 : 0.48) : mix(sk, "#c4566a", Lsk < 0.35 ? 0.35 : 0.55);
    var rossetto = c.rossetto && c.rossetto !== "nessuno" ? col(OPZ.colRossetto, c.colRossetto) : null;
    if (rossetto) labbro = mix(labbro, rossetto, c.rossetto === "tinta" ? 0.5 : 0.88);

    // ---------- misure ----------
    var B = BUILD[m ? "uomo" : "donna"][c.corpo] || BUILD[m ? "uomo" : "donna"].medio;
    var C = 200, Y = { collo: 246, spalla: 268, delt: 296, ascella: 336, petto: m ? 372 : 382, vita: m ? 452 : 442, fianchi: 528, cavallo: 572 };
    var HT = "translate(200 214) rotate(-1.5) scale(.9)";
    var F = FACCIA[c.viso] || FACCIA.ovale;
    F = { cw: F.cw, jx: F.jx * (m ? 1 : 0.88), jy: F.jy, cx: F.cx * (m ? 1 : 0.8), L: F.L, k1: F.k1 || 0 };
    var top = -(78 + 70 * F.L);
    var faceD = "M" + (-F.cw) + " -78C" + (-F.cw - 1) + " " + n1(-78 - 40 * F.L) + " " + n1(-F.cw * 0.63) + " " + n1(top + 2) + " 0 " + n1(top) +
      "C" + n1(F.cw * 0.63) + " " + n1(top + 2) + " " + (F.cw + 1) + " " + n1(-78 - 40 * F.L) + " " + F.cw + " -78" +
      "C" + F.cw + " -56 " + (F.cw - 2) + " -40 " + n1(F.jx) + " " + n1(F.jy) +
      "C" + n1(F.jx - 10 + F.k1 * 1.5) + " " + n1(F.jy + 14 + F.k1) + " " + n1(F.cx) + " 0 0 0" +
      "C" + n1(-F.cx) + " 0 " + n1(-F.jx + 10 - F.k1 * 1.5) + " " + n1(F.jy + 14 + F.k1) + " " + n1(-F.jx) + " " + n1(F.jy) +
      "C" + (-F.cw + 2) + " -40 " + (-F.cw) + " -56 " + (-F.cw) + " -78Z";

    // gambe: i punti veri di questa corporatura
    var lw = B.lw, GN = GAMBA[m ? "uomo" : "donna"].map(function (q) { return [q[0], q[1] * (1 + (lw - 1) * 0.75), q[2] * lw, q[3] * lw]; });
    function gIn(y) {   // [cx, fuori, dentro] alla quota y
      if (y <= GN[0][0]) return [GN[0][1], GN[0][2], GN[0][3]];
      for (var i = 1; i < GN.length; i++) if (y <= GN[i][0]) { var a = GN[i - 1], b = GN[i], t = (y - a[0]) / (b[0] - a[0]); return [a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t, a[3] + (b[3] - a[3]) * t]; }
      var z = GN[GN.length - 1]; return [z[1], z[2], z[3]];
    }
    // il contorno di una gamba (lato -1 sinistra, 1 destra) da y0 a y1, con agio (stoffa larga) e opzioni dei pantaloni
    function gamba(lato, o) {
      o = o || {};
      var e = o.agio || 0, ei = o.agioI != null ? o.agioI : e * 0.75, y0 = o.da != null ? o.da : GN[0][0] - 8, y1 = o.a != null ? o.a : 940;
      var ys = [y0]; GN.forEach(function (q) { if (q[0] > y0 + 6 && q[0] < y1 - 6) ys.push(q[0]); }); ys.push(y1);
      var dr = o.dritto, rif = dr ? gIn(dr) : null;
      var pts = ys.map(function (y) {
        var g = gIn(y), cx = g[0], fo = g[1] + e, di = g[2] + ei;
        if (dr && y > dr) { var t = Math.min(1, (y - dr) / Math.max(1, (o.orlo || 940) - dr)), fo2 = rif[1] + e + ((o.orloL != null ? o.orloL : rif[1] + e) - (rif[1] + e)) * t, di2 = rif[2] + ei + ((o.orloL != null ? o.orloL * 0.85 : rif[2] + ei) - (rif[2] + ei)) * t; fo = Math.max(fo * (o.segue ? 1 : 0), fo2); di = Math.max(di * (o.segue ? 1 : 0), di2); }
        if (o.svasa && y > 760) { var s2 = (y - 760) / 180 * o.svasa; fo += s2; di += s2 * 0.8; }
        return [y, cx, fo, di];
      });
      var out = pts.map(function (q) { return [C + lato * (q[1] + q[2]), q[0]]; }), inn = pts.map(function (q) { return [C + lato * (q[1] - q[3]), q[0]]; }).reverse();
      var ol = out[out.length - 1], ir = inn[0], cv = o.curvaOrlo != null ? o.curvaOrlo : 5;
      return "M" + q(out[0][0]) + " " + q(out[0][1]) + cr(out) + "Q" + q((ol[0] + ir[0]) / 2) + " " + q((ol[1] + ir[1]) / 2 + cv) + " " + q(ir[0]) + " " + q(ir[1]) + cr(inn) + "Z";
    }
    // il bacino (la parte dei pantaloni o della gonna dalla vita al cavallo)
    function bacino(o) {
      o = o || {}; var e = o.agio || 4, v = o.vita || (m ? 456 : 448), wv = Math.max(B.wt, m ? B.wt : B.wt) + e, wh = B.hp + e, yc = o.cavallo || 600;
      var gl = gIn(560);
      return "M" + q(C - wv) + " " + v + "L" + q(C + wv) + " " + v + "C" + q(C + wv + 4) + " " + (v + 30) + " " + q(C + wh + 2) + " " + (Y.fianchi - 30) + " " + q(C + wh) + " " + Y.fianchi +
        "L" + q(C + gl[0] + gl[1] + e) + " 566L" + q(C + 4) + " " + yc + "L" + q(C - 4) + " " + yc + "L" + q(C - gl[0] - gl[1] - e) + " 566L" + q(C - wh) + " " + Y.fianchi +
        "C" + q(C - wh - 2) + " " + (Y.fianchi - 30) + " " + q(C - wv - 4) + " " + (v + 30) + " " + q(C - wv) + " " + v + "Z";
    }
    // =========================================================
    //  IL CORPO COME UN PEZZO UNICO (secondo tempo, 5 nov 2026)
    //  Una sagoma sola: collo → trapezio → spalla tonda (il deltoide) → fianco → anca → gambe.
    //  Le braccia sono UN contorno (spalla tonda, braccio, gomito tondo, avambraccio) che parte dentro la
    //  spalla tonda: con qualunque angolo la spalla resta piena, senza buchi né «palline».
    //  Pelle e vestiti si colorano a tinta unita su tutta la sagoma e si ombreggiano SOPRA (luci e ombre
    //  morbide ritagliate sulla sagoma intera): le giunture non si vedono. I vestiti sono la stessa linea
    //  allargata (agio) e tagliata per zona: la stoffa non sporge mai.
    // =========================================================
    var G = A.geometria(c, opts), rc = G.rc, Jd = G.Jd, Jy = G.Jy, pancia = G.pancia, BR = G.BR;   // (pancia: vedi geometria)
    function dist(P, Q) { return Math.hypot(Q[0] - P[0], Q[1] - P[1]); }
    // punto di tangenza (in alto, lato destro, x = distanza dal centro) della retta da F alla spalla tonda di raggio r
    function tang(F, r) {
      var vx = F[0] - Jd, vy = F[1] - Jy, d = Math.max(r + 0.5, Math.hypot(vx, vy)), b = Math.atan2(vy, vx), a = Math.acos(r / d);
      var t1 = b - a, t2 = b + a, t = Math.sin(t1) < Math.sin(t2) ? t1 : t2;
      return { p: [Jd + r * Math.cos(t), Jy + r * Math.sin(t)], a: t };
    }
    function arcoPts(r, a0, a1, n, cx, cy) { var o = []; for (var i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } return o; }
    function fuoriGamba(y) { var g = gIn(y); return g[0] + g[1]; }
    // il fianco destro del tronco (x = distanza dal centro) dalla spalla in giù, allargato di e
    function lato(e, o) {
      var R = [], pz = o.pancia != null ? o.pancia : pancia;
      R.push([B.ap + e, Y.ascella + 6], [B.ch + e, Y.petto], [B.wt + e * 1.1 + pz, Y.vita], [B.hp + e, Y.fianchi]);
      R.push([fuoriGamba(560) + e, 560], [fuoriGamba(600) + e * 0.9, 600]);
      return R;
    }
    // la spalla: dal punto F (fine del collo o della spallina) la retta tangente alla spalla tonda e l'arco fino sotto
    function spalla(F, e) {
      var r = rc + e * 0.55, T = tang(F, r), aF = 54 * DEG, R = [[(F[0] + T.p[0]) / 2, (F[1] + T.p[1]) / 2], T.p];
      return R.concat(arcoPts(r, T.a + (aF - T.a) / 4, aF, 3, Jd, Jy));
    }
    // il tronco. Pelle: { pelle: true }. Vestito: { agio, orlo, scollo: {tipo, prof, larg}, smanicato, spallina, svasa, curvaOrlo, pancia }
    function tronco(o) {
      o = o || {};
      var e = o.agio != null ? o.agio : (o.pelle ? 0 : 5), nk = B.nk, R;
      if (o.pelle) {
        R = [[nk - 3, 194], [nk - 1.5, 222], [nk + 2.5, 238], [nk + 13, 249]].concat(spalla([nk + 13, 249], 0)).concat(lato(0, o));
        var g6 = gIn(604);
        R.push([g6[0], 606]);
        var Rabs = R.map(function (p) { return [C + p[0], p[1]]; }), Labs = R.map(function (p) { return [C - p[0], p[1]]; }).reverse();
        return "M" + q(Labs[Labs.length - 1][0]) + " " + q(Labs[Labs.length - 1][1]) + "L" + q(Rabs[0][0]) + " " + q(Rabs[0][1]) + cr(Rabs) +
          "L" + q(C + 7) + " " + (Y.cavallo + 6) + "Q" + C + " " + (Y.cavallo + 12) + " " + q(C - 7) + " " + (Y.cavallo + 6) + "L" + q(Labs[0][0]) + " " + q(Labs[0][1]) + cr(Labs) + "Z";
      }
      var orlo = o.orlo || 508, sc2 = o.scollo || {}, prof = sc2.prof != null ? sc2.prof : 16, larg = sc2.larg != null ? sc2.larg : 3, sv = o.svasa || 0;
      var nl = B.nk + larg, ny = 240;
      R = [[nl, ny]];
      if (o.smanicato) {
        var sp = o.spallina != null ? o.spallina : 14;
        R.push([nl + sp, ny + 2], [B.ap - 6 + e * 0.3, Y.ascella - 20]);
      } else {
        var F = [nk + 13 + e * 0.3, 249 - e * 0.6];
        if (nl < F[0] - 4) R.push(F); else F = [nl + 2, ny + 3];
        R = R.concat(spalla(F, e));
      }
      // il fianco fino all'orlo (o oltre: cappotti e vestiti lunghi)
      var Ls = lato(e, o);
      if (o.smanicato) Ls[0] = [B.ap + e - 2, Y.ascella + 8];
      var tagliato = false;
      for (var i = 0; i < Ls.length; i++) {
        if (Ls[i][1] < orlo - 6) { R.push(Ls[i]); continue; }
        var P = i ? Ls[i - 1] : R[R.length - 1], Q = Ls[i], t = (orlo - P[1]) / Math.max(1, Q[1] - P[1]);
        R.push([P[0] + (Q[0] - P[0]) * Math.max(0, Math.min(1, t)) + sv, orlo]); tagliato = true; break;
      }
      if (!tagliato) {   // oltre le cosce: la stoffa scende e si allarga (svasa)
        var base = R[R.length - 1];
        if (orlo > 680) R.push([B.hp + e + sv * 0.6 + (orlo - Y.fianchi) * 0.05, (orlo + 600) / 2]);
        R.push([Math.max(base[0], B.hp + e) + sv + (orlo - Y.fianchi) * (orlo > 700 ? 0.1 : 0.04), orlo]);
      }
      var Rabs2 = R.map(function (p) { return [C + p[0], p[1]]; }), Labs2 = R.map(function (p) { return [C - p[0], p[1]]; }).reverse();
      var sc3 = sc2.tipo === "v" ? "L" + C + " " + (ny + prof) + "L" + q(C + nl) + " " + ny
        : (sc2.tipo === "quadro" ? "L" + q(C - nl + 4) + " " + (ny + prof) + "L" + q(C + nl - 4) + " " + (ny + prof) + "L" + q(C + nl) + " " + ny
        : "C" + q(C - nl + 2) + " " + q(ny + prof * 0.9) + " " + q(C - nl * 0.45) + " " + (ny + prof) + " " + C + " " + (ny + prof) + "C" + q(C + nl * 0.45) + " " + (ny + prof) + " " + q(C + nl - 2) + " " + q(ny + prof * 0.9) + " " + q(C + nl) + " " + ny);
      var hl = Labs2[0];
      return "M" + q(C - nl) + " " + ny + sc3 + cr(Rabs2) + "Q" + C + " " + q(orlo + (o.curvaOrlo != null ? o.curvaOrlo : 6)) + " " + q(hl[0]) + " " + q(hl[1]) + cr(Labs2) + "Z";
    }
    function busto(o) { return tronco(o); }   // (nome di prima: lo usano i pezzi)

    // ---------- le braccia: un contorno solo ----------
    // larghezze intere lungo il braccio (s = distanza dalla spalla lungo braccio + avambraccio)
    function larghezze(b) {
      var aw = B.aw, l1 = b.l1, l2 = b.l2, tot = l1 + l2;
      var alz = Math.max(0, Math.min(1, (b.a1 - 50) / 80));
      return [[0, rc * 2], [l1 * 0.2, aw[0] * (1 + 0.28 * alz)], [l1 * 0.48, aw[0] * (m ? 0.98 : 0.94) * (1 + 0.1 * alz)], [l1 * 0.8, aw[1] * 1.02], [l1, aw[1] * 0.9], [l1 + l2 * 0.2, aw[2] * 1.08], [l1 + l2 * 0.45, aw[2] * 1.0], [l1 + l2 * 0.78, aw[2] * 0.8], [tot, aw[3]]];
    }
    function wAt(WS, s) { if (s <= 0) return WS[0][1]; for (var i = 1; i < WS.length; i++) if (s <= WS[i][0]) { var a = WS[i - 1], z = WS[i], t = (s - a[0]) / Math.max(0.01, z[0] - a[0]); return a[1] + (z[1] - a[1]) * t; } return WS[WS.length - 1][1]; }
    function ptAt(b, s) { if (s <= b.l1) { var t = s / b.l1; return [b.J[0] + (b.E[0] - b.J[0]) * t, b.J[1] + (b.E[1] - b.J[1]) * t]; } var u = Math.min(1, (s - b.l1) / b.l2); return [b.E[0] + (b.W[0] - b.E[0]) * u, b.E[1] + (b.W[1] - b.E[1]) * u]; }
    // il contorno chiuso del braccio fino a «fino» (0-1 della lunghezza), allargato di e (su tutta la larghezza: e/2 per lato);
    // svasa = stoffa in più all'orlo, curva = orlo curvo (maniche)
    var ultimiLati = null, manicaFino = {};
    // da (facoltativo, 0-1) = comincia lì con un taglio dritto, senza la spalla tonda (per ridisegnare l avambraccio che passa davanti)
    function contornoBraccio(lato2, e, fino, svasa, curva, da) {
      var b = BR[lato2], WS = larghezze(b), h = (e || 0) / 2, tot = b.l1 + b.l2, fin = tot * Math.max(0.03, Math.min(1, fino == null ? 1 : fino)), s0 = da ? tot * da : 0;
      var d1 = [(b.E[0] - b.J[0]) / b.l1, (b.E[1] - b.J[1]) / b.l1], d2 = [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2];
      var cosB = Math.max(-1, Math.min(1, d1[0] * d2[0] + d1[1] * d2[1])), bend = Math.acos(cosB);
      var S = larghezze(b).map(function (q) { return q[0]; }).filter(function (s) { return s > s0 + 3 && s < fin - 4; });
      S.unshift(s0); S.push(fin);
      var lati = [1, -1].map(function (sg) {
        var n1v = [-d1[1] * sg, d1[0] * sg], n2v = [-d2[1] * sg, d2[0] * sg], dentro = n1v[0] * d2[0] + n1v[1] * d2[1] > 0;
        var wE = wAt(WS, b.l1) / 2 + h, taglio = dentro && bend > 0.14 ? wE * Math.tan(bend / 2) + 2 : 0, P = [];
        S.forEach(function (s) {
          var w = wAt(WS, s) / 2 + h + (s === fin && svasa ? svasa / 2 : 0);
          if (s === 0 && !da) w = rc + h * 0.7;
          if (Math.abs(s - b.l1) < 0.5 && bend > 0.14) {   // il gomito
            if (dentro) { var bx = n1v[0] + n2v[0], by = n1v[1] + n2v[1], bl = Math.hypot(bx, by) || 1, md = Math.min(w / Math.cos(bend / 2), w * 1.7); P.push([b.E[0] + bx / bl * md, b.E[1] + by / bl * md]); }
            else { var a0 = Math.atan2(n1v[1], n1v[0]), a1 = Math.atan2(n2v[1], n2v[0]); while (a1 - a0 > Math.PI) a1 -= 2 * Math.PI; while (a0 - a1 > Math.PI) a1 += 2 * Math.PI; for (var k = 0; k <= 3; k++) { var a = a0 + (a1 - a0) * k / 3; P.push([b.E[0] + Math.cos(a) * w, b.E[1] + Math.sin(a) * w]); } }
            return;
          }
          if (taglio && Math.abs(s - b.l1) < taglio) return;
          var p = ptAt(b, s), n = s < b.l1 ? n1v : n2v;
          if (Math.abs(s - b.l1) < 0.5) n = [(n1v[0] + n2v[0]) / 2, (n1v[1] + n2v[1]) / 2];
          P.push([p[0] + n[0] * w, p[1] + n[1] * w]);
        });
        return P;
      });
      var A1 = lati[0], B1 = lati[1].slice().reverse();
      ultimiLati = { A: A1, B: B1 };
      if (da) { var fA0 = A1[A1.length - 1], fB0 = B1[0]; return "M" + q(A1[0][0]) + " " + q(A1[0][1]) + cr(A1) + "L" + q(fB0[0]) + " " + q(fB0[1]) + cr(B1) + "Z"; }
      // la spalla tonda dietro al perno (da B1 al primo punto di A1, girando dalla parte opposta al braccio)
      var r = rc + h * 0.7, aA = Math.atan2(-d1[0], d1[1]) /* normale +1 */, cap = [];
      var na = Math.atan2(A1[0][1] - b.J[1], A1[0][0] - b.J[0]), nb = Math.atan2(B1[B1.length - 1][1] - b.J[1], B1[B1.length - 1][0] - b.J[0]), back = Math.atan2(-d1[1], -d1[0]);
      // da nb a na passando per «back»
      var x0 = nb, x1 = na; while (x1 < x0) x1 += 2 * Math.PI; var passa = back; while (passa < x0) passa += 2 * Math.PI;
      if (passa > x1) { x1 = na; while (x1 > x0) x1 -= 2 * Math.PI; }
      for (var k2 = 1; k2 < 5; k2++) { var a2 = x0 + (x1 - x0) * k2 / 5; cap.push([b.J[0] + Math.cos(a2) * r, b.J[1] + Math.sin(a2) * r]); }
      var fA = A1[A1.length - 1], fB = B1[0], fd = s2p(fin), cv = curva != null ? curva : 0;
      function s2p(s) { return fin >= tot - 0.5 ? d2 : (s < b.l1 ? d1 : d2); }
      var orloD = cv ? "Q" + q((fA[0] + fB[0]) / 2 + fd[0] * cv) + " " + q((fA[1] + fB[1]) / 2 + fd[1] * cv) + " " + q(fB[0]) + " " + q(fB[1]) : "L" + q(fB[0]) + " " + q(fB[1]);
      return "M" + q(A1[0][0]) + " " + q(A1[0][1]) + cr(A1) + orloD + cr(B1.concat(cap).concat([A1[0]])) + "Z";
    }
    // (nomi di prima, li usano i pezzi) una manica: fino alla frazione lung del braccio, agio sulla larghezza, svasa all'orlo
    function manica(lato2, o) { o = o || {}; manicaFino[lato2] = Math.max(manicaFino[lato2] || 0, o.lung != null ? o.lung : 1); return contornoBraccio(lato2, o.agio != null ? o.agio : 8, o.lung != null ? o.lung : 1, o.svasa || 0, o.tonda ? 6 : 0); }
    // dove finisce la manica: punto, direzione, larghezza (intera) del braccio lì
    function fineManica(lato2, lung) {
      var b = BR[lato2], tot = b.l1 + b.l2, s = tot * Math.max(0.03, Math.min(1, lung)), p = ptAt(b, s), d = s < b.l1 ? [(b.E[0] - b.J[0]) / b.l1, (b.E[1] - b.J[1]) / b.l1] : [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2];
      return { x: p[0], y: p[1], dx: d[0], dy: d[1], w: wAt(larghezze(b), s) };
    }

    // ---------- colorare una sagoma fatta di pezzi, senza giunture ----------
    // le scene grandi: «corpo» = l avatar senza il braccio LP, «braccio» = solo quel braccio (pelle, manica, mano), da far ruotare sulla spalla
    var SPALLE = !!opts.spalle;   // di spalle: niente viso, capelli che coprono la nuca, vestiti a tinta unita (il retro), tacchi delle scarpe
    var PARTE = opts.parte, LP = opts.latoParte === 0 ? 0 : (opts.latoParte === -1 ? -1 : 1);
    function tieni(lato2) { return !PARTE || (PARTE === "corpo" ? LP !== 0 && lato2 !== LP : LP === 0 || lato2 === LP); }
    // un ornamento che sta SOLO sulla manica (polsini, righe, toppe): nei pezzi va passato di qui, così segue il braccio staccato
    function suManica(lato2, svg) { return tieni(lato2) ? svg || "" : ""; }
    var luceG = null;
    function luceGlobale() {   // la luce da sinistra su tutta la figura (stessa per pelle e vestiti)
      if (!luceG) luceG = LG("luceG", C - B.sho - 24, 0, C + B.sho + 24, 0, [[0, "#ffffff", 0.18], [0.3, "#ffffff", 0.04], [0.52, "#ffffff", 0], [0.74, "#000000", 0.04], [1, "#000000", 0.17]], true);
      return luceG;
    }
    function ElR(cx, cy, rx, ry, ang, f) { return "<ellipse cx='" + q(cx) + "' cy='" + q(cy) + "' rx='" + q(rx) + "' ry='" + q(ry) + "' " + riempi(f) + " transform='rotate(" + q(ang) + " " + q(cx) + " " + q(cy) + ")'/>"; }
    // il volume di un tratto (P→Q, larghezza w): luce sul lato verso sinistra-alto, ombra dall'altro (ellissi morbide: niente bordi)
    function cilindro(P, Q, w, chiaro, scuro, forza) {
      var dx = Q[0] - P[0], dy = Q[1] - P[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
      if (nx * -0.8 + ny * -0.6 < 0) { nx = -nx; ny = -ny; }   // la normale verso la luce
      var cx = (P[0] + Q[0]) / 2, cy = (P[1] + Q[1]) / 2, ang = Math.atan2(dy, dx) / DEG - 90, f = forza == null ? 1 : forza;
      return ElR(cx + nx * w * 0.24, cy + ny * w * 0.24, w * 0.2, l * 0.56, ang, soft(chiaro, 0.34 * f)) +
        ElR(cx - nx * w * 0.42, cy - ny * w * 0.42, w * 0.3, l * 0.62, ang, soft(scuro, 0.4 * f));
    }
    // il volume del braccio fino a «fino»
    function volumeBraccio(lato2, fino, chiaro, scuro, e, forza) {
      var b = BR[lato2], tot = b.l1 + b.l2, fin = tot * (fino == null ? 1 : fino), WS = larghezze(b), s = "", h = e || 0;
      var a1 = Math.min(fin, b.l1), p1 = ptAt(b, a1 * 0.08);
      s += cilindro(p1, ptAt(b, a1), wAt(WS, a1 * 0.4) + h, chiaro, scuro, forza);
      if (fin > b.l1 + 6) s += cilindro(ptAt(b, b.l1), ptAt(b, fin), wAt(WS, b.l1 + (fin - b.l1) * 0.4) + h, chiaro, scuro, forza);
      return s;
    }
    var nNoSpalla = 0;
    function senzaSpalla(lato2, r) {   // tutto tranne il disco della spalla (per il bordo delle braccia)
      var J = BR[lato2].J, id = "ns" + (nNoSpalla++);
      D.push("<clipPath id='" + p + id + "'><path clip-rule='evenodd' d='M0 0H400V1000H0Z" + "M" + q(J[0] - r) + " " + q(J[1]) + "a" + q(r) + " " + q(r) + " 0 1 0 " + q(2 * r) + " 0a" + q(r) + " " + q(r) + " 0 1 0 " + q(-2 * r) + " 0Z'/></clipPath>");
      return "url(#" + p + id + ")";
    }
    // pz = { tronco: [d, …], braccia: [{ d, lato, fino, e }, …], altro: [d, …] (gambe…) }
    // o = { bordo: colore del bordo (scuro), chiaro, scuro: colori delle luci e delle ombre, volume: false (niente ombre sopra), dentro: svg in più ritagliato (pieghe, stampe) }
    function dipingi(pz, colore, o) {
      o = o || {};
      var tr = pz.tronco || [], br = pz.braccia || [], al = pz.altro || [];
      br = br.filter(function (q) { return tieni(q.lato); });
      if (PARTE === "braccio") { tr = []; al = []; }
      if (!tr.length && !al.length && !br.length) return { svg: "", clip: "none" };
      var tutti = tr.concat(al).concat(br.map(function (q) { return q.d; }));
      var bordo = o.bordo || mix(colore, "#12060c", 0.5), chiaro = o.chiaro || "#ffffff", scuro = o.scuro || mix(colore, "#14080c", 0.6);
      var bL = mix(colore, bordo, 0.45), rimG = LG("rim" + (nRim++), C - B.sho - 20, 0, C + B.sho + 20, 0, [[0, bL], [0.5, mix(bL, bordo, 0.5)], [1, bordo]], true);
      var s = "";
      if (tr.length + al.length === 1) s += "<path d='" + tr.concat(al)[0] + "' fill='" + colore + "' stroke='" + rimG + "' stroke-width='4.4' paint-order='stroke'/>";
      else {
        tr.concat(al).forEach(function (d) { s += "<path d='" + d + "' fill='none' stroke='" + rimG + "' stroke-width='4.4'/>"; });
        al.forEach(function (d) { s += Pa(d, colore); });
        tr.forEach(function (d) { s += Pa(d, colore); });
      }
      br.forEach(function (q) { s += Pa(q.d, colore); });
      br.forEach(function (q) { s += "<path d='" + q.d + "' fill='none' stroke='" + rimG + "' stroke-width='2.2' clip-path='" + senzaSpalla(q.lato, rc + (q.e || 0) / 2 + 1.5) + "'/>"; });
      var cl = clip(tutti);
      if (o.volume !== false) {
        s += "<g clip-path='" + cl + "'><rect x='-200' y='-200' width='800' height='1400' fill='" + luceGlobale() + "'" + (o.luce != null ? " opacity='" + opz(n1(o.luce * 100) / 100) + "'" : "") + "/>";
        br.forEach(function (q) { s += volumeBraccio(q.lato, q.fino, chiaro, scuro, q.e, o.forza); });
        if (o.dentro) s += o.dentro;
        s += "</g>";
      } else if (o.dentro) s += "<g clip-path='" + cl + "'>" + o.dentro + "</g>";
      return { svg: s, clip: cl };
    }
    var nRim = 0;


    // ---------- il contesto per i pezzi ----------
    var K = {
      m: m, donna: !m, c: c, opts: opts, C: C, Y: Y, B: B, HT: HT, F: F, faceD: faceD, top: top, GN: GN, BR: BR,
      pelle: sk, skL: skL, skD: skD, skDD: skDD, capelli: hc, hL: hL, hD: hD, hDD: hDD, iride: iris, maglia: mg, pantaloni: pt, scarpe: sc, acc: ac, collo: cc, labbro: labbro, rossetto: rossetto,
      mix: mix, lum: lum, rnd: rnd, n1: n1, cr: cr, limb: limb, poli: poli, liscio: liscio, lisciaChiusa: lisciaChiusa,
      LG: LG, RG: RG, soft: soft, U: U, Pa: Pa, St: St, El: El, clip: clip, cil: cil, D: D, id: p,
      gamba: gamba, gIn: gIn, bacino: bacino, busto: busto, manica: manica, fineManica: fineManica,
      scuro: function (c2, t) { return mix(c2, "#14080c", t == null ? 0.35 : t); }, chiaro: function (c2, t) { return mix(c2, "#ffffff", t == null ? 0.3 : t); }
    };
    K.suManica = suManica; K.parte = PARTE; K.spalle = SPALLE;
    K.dipingi = dipingi; K.tronco = tronco; K.braccio = contornoBraccio; K.volumeBraccio = volumeBraccio; K.cilindro = cilindro; K.ElR = ElR; K.rc = rc; K.G = G; K.luce = luceGlobale;
    // i capelli in tre toni (gradiente obliquo) e le ciocche
    LG("hg1", 0, 0, 1, 1, [[0, hL], [0.45, hc], [1, hD]]);
    LG("hg2", 0, 0, 1, 1, [[0, mix(hL, hc, 0.45)], [0.5, mix(hc, hD, 0.35)], [1, hDD]]);
    LG("hg3", 0, 0, 1, 1, [[0, hc], [1, hDD]]);
    K.ciocche = function (list, ids, luce) {
      ids = ids || ["hg1", "hg2"];
      return list.map(function (Lc, i) {
        var g = ids[i % ids.length];
        return Pa(limb(Lc), U(g)) + (luce === false ? "" : Pa(limb(Lc.map(function (q, j) { return [q[0] - 1.5, q[1] - 2.5, Math.max(0.6, q[2] * 0.2) * (j === Lc.length - 1 ? 0.3 : 1)]; })), hL, " opacity='.5'"));
      }).join("");
    };
    // capelli corti «rasati»: una trama di puntini dentro un contorno (testa)
    K.rasatura = function (d, densita, op) {
      var R = rnd(11), s = "";
      for (var i = 0; i < (densita || 360); i++) { var x = (R() * 2 - 1) * 64, y = top - 10 + R() * 120; s += "M" + N(x, 1) + N(y) + "h.3"; }
      return "<g clip-path='" + clip(d) + "'>" + Pa(d, hc, " opacity='" + (op || 0.55) + "'") + "<path d='" + s + "' stroke='" + hDD + "' stroke-width='1.6' stroke-linecap='round' opacity='.35' fill='none'/></g>";
    };

    // ---------- la pelle: tronco e gambe in un pezzo solo; le braccia sopra (dopo i pantaloni), stesse luci ----------
    var luceSk = 0.35 + 0.65 * Math.min(1, Lsk * 1.15);   // pelle scura: meno luce bianca (se no diventa grigia)
    function luciSpalla(l) { var J = BR[l].J; return El(J[0] - 8, J[1] - 9, rc * 0.62, rc * 0.5, soft(skL, 0.3)) + El(J[0] + l * 3, J[1] + rc * 0.75, rc * 0.8, rc * 0.42, soft(skDD, 0.16)); }
    function pelleBraccio(l) {
      var b = BR[l], d = contornoBraccio(l, 0, 1), dx = (b.W[0] - b.E[0]) / b.l2, dy2 = (b.W[1] - b.E[1]) / b.l2, wE = B.aw[1] * 0.45, inn = -l;
      var dentro = luciSpalla(l) + St(liscio([[b.E[0] + inn * wE * 0.15 - dx * 6, b.E[1] - dy2 * 6], [b.E[0] + inn * wE * 0.55 + dx * 2, b.E[1] + dy2 * 3], [b.E[0] + inn * wE * 0.85 + dx * 7, b.E[1] + dy2 * 6]]), skD, 2, 0.45) +
        El(b.E[0] - inn * wE * 0.55, b.E[1] - 2, wE * 0.35, wE * 0.5, soft(skL, 0.25));
      return dipingi({ braccia: [{ d: d, lato: l, fino: 1, e: 0 }] }, sk, { bordo: mix(sk, skDD, 0.8), chiaro: skL, scuro: skDD, dentro: dentro, forza: 0.85, luce: luceSk }).svg;
    }
    // l avambraccio che passa DAVANTI al corpo (gesti): si ridisegna sopra il vestito, dalla fine della manica (o da sopra il gomito)
    function pelleAvanti(l) {
      var b = BR[l], da = manicaFino[l] != null ? manicaFino[l] : 0.06;
      if (da > 0.97) return "";
      var d = contornoBraccio(l, 0, 1, 0, 0, da), L = ultimiLati, bordo = mix(sk, skDD, 0.8);
      return "<path d='" + d + "' fill='#000000' opacity='.2' transform='translate(5 9)'/>" + Pa(d, sk) + "<g clip-path='" + clip(d) + "'><rect x='-200' y='-200' width='800' height='1400' fill='" + luceGlobale() + "' opacity='" + n1(luceSk * 100) / 100 + "'/>" +
        volumeBraccio(l, 1, skL, skDD, 0, 0.85) + "</g>" + St(liscio(L.A), bordo, 2.2, 0.9) + St(liscio(L.B), bordo, 2.2, 0.9);
    }
    function pelleCorpo(soloSu) {
      var nk = B.nk, tr = tronco({ pelle: true }), gl = soloSu ? [] : [gamba(-1, { da: 540, a: 948, curvaOrlo: 2 }), gamba(1, { da: 540, a: 948, curvaOrlo: 2 })];
      var br = [];
      var dentro = luciSpalla(-1) + luciSpalla(1);
      // collo: ombra del mento, lato in ombra, clavicole
      dentro += El(C + 4, 224, nk * 1.25, 18, soft(skDD, 0.5)) + El(C + nk * 0.7, 232, nk * 0.5, 24, soft(skDD, 0.3));
      dentro += St("M" + n1(C - nk - 4) + " 252C" + n1(C - nk - 22) + " 256 " + n1(C - Jd + 30) + " 258 " + n1(C - Jd + 6) + " 262", skD, 2.6, 0.32) + St("M" + n1(C + nk + 4) + " 252C" + n1(C + nk + 22) + " 256 " + n1(C + Jd - 30) + " 258 " + n1(C + Jd - 6) + " 262", skD, 2.6, 0.36);
      dentro += El(C, 266, nk * 0.5, 7, soft(skDD, 0.35));
      if (m) dentro += St("M" + (C - B.ch + 14) + " " + (Y.petto + 6) + "C" + (C - 40) + " " + (Y.petto + 18) + " " + (C - 14) + " " + (Y.petto + 14) + " " + (C - 2) + " " + (Y.petto - 2), skD, 3, 0.35) + St("M" + (C + B.ch - 14) + " " + (Y.petto + 6) + "C" + (C + 40) + " " + (Y.petto + 18) + " " + (C + 14) + " " + (Y.petto + 14) + " " + (C + 2) + " " + (Y.petto - 2), skD, 3, 0.4) +
        El(C - 32, Y.petto - 18, 26, 16, soft("#ffffff", 0.14)) + St("M" + C + " " + (Y.petto + 30) + "L" + C + " " + (Y.vita - 10), skD, 2, 0.2) + El(C, Y.vita + 4, 4, 3, skDD, " opacity='.35'");
      else { var bs = B.seno || 1; dentro += El(C - 30 * bs, Y.petto + 8, 24 * bs, 22 * bs, soft("#ffffff", 0.12)) + St("M" + (C - B.ch + 10) + " " + (Y.petto + 18 * bs) + "C" + (C - 40) + " " + (Y.petto + 30 * bs) + " " + (C - 14) + " " + (Y.petto + 30 * bs) + " " + (C - 4) + " " + (Y.petto + 12), skD, 3, 0.3) + St("M" + (C + B.ch - 10) + " " + (Y.petto + 18 * bs) + "C" + (C + 40) + " " + (Y.petto + 30 * bs) + " " + (C + 14) + " " + (Y.petto + 30 * bs) + " " + (C + 4) + " " + (Y.petto + 12), skD, 3, 0.35) + St("M" + C + " " + (Y.petto - 10) + "L" + C + " " + (Y.petto + 8), skD, 2.2, 0.3) + El(C, Y.vita + 10, 3.4, 2.6, skDD, " opacity='.35'"); }
      if (SPALLE) {
        dentro = luciSpalla(-1) + luciSpalla(1) + El(C, 238, nk * 1.15, 14, soft(skDD, 0.28)) + St("M" + C + " 266C" + (C - 1) + " 330 " + (C + 1) + " 400 " + C + " " + (Y.vita + 12), skD, 2.4, 0.28);
        [-1, 1].forEach(function (l) { dentro += El(C + l * B.ch * 0.46, Y.ascella + 6, B.ch * 0.3, 36, soft(l < 0 ? "#ffffff" : skDD, l < 0 ? 0.12 : 0.22)) + St("M" + (C + l * 16) + " 300C" + (C + l * 30) + " 318 " + (C + l * 40) + " 340 " + (C + l * 36) + " 362", skD, 2.2, 0.22); });
      }
      // ascelle e fianchi
      dentro += El(C - B.ap + 4, Y.ascella + 4, 10, 18, soft(skDD, 0.3)) + El(C + B.ap - 4, Y.ascella + 4, 10, 18, soft(skDD, 0.36)) + El(C + B.wt - 6, Y.vita + 10, 16, 80, soft(skDD, 0.18));
      // le gambe: coscia, ginocchio, polpaccio
      if (!soloSu) [-1, 1].forEach(function (l) {
        var g0 = gIn(560), g1 = gIn(748), g2 = gIn(930), k0 = [C + l * g0[0], 560], k1 = [C + l * g1[0], 748], k2 = [C + l * g2[0], 930];
        dentro += cilindro(k0, k1, g0[1] + g0[2], skL, skDD, 0.8) + cilindro(k1, k2, g1[1] + g1[2], skL, skDD, 0.8);
        dentro += El(k1[0] - 4, 742, 14, 11, soft("#ffffff", 0.1)) + St("M" + (k1[0] - 12) + " 764C" + (k1[0] - 4) + " 770 " + (k1[0] + 6) + " 770 " + (k1[0] + 12) + " 762", skD, 1.8, 0.2);
      });
      dentro += El(C, Y.cavallo - 4, 30, 22, soft(skDD, 0.3));
      if (!SPALLE) dentro += El(C - B.wt * 0.42, Y.vita - 6, B.wt * 0.34, 46, soft("#ffffff", 0.09)) + El(C + B.wt * 0.62, Y.vita, B.wt * 0.3, 52, soft(skDD, 0.16));   // la pancia non piatta
      return dipingi({ tronco: [tr], altro: gl, braccia: br }, sk, { bordo: mix(sk, skDD, 0.8), chiaro: skL, scuro: skDD, dentro: dentro, forza: 0.85, luce: luceSk }).svg;
    }

    // ---------- le mani ----------
    // forme in coordinate della mano: polso in (0, 0), dita verso +y, +x = verso il corpo (col braccio giù)
    var MANI = {
      rilassata: { p: ["M-14.5 -6C-15.5 6 -16.5 18 -16.5 29C-16.5 38 -15.5 46 -13.5 51C-12.8 55 -10.5 57.5 -8.5 56.8C-7.8 59.5 -5 62.5 -2.5 62C-0.8 64.5 3 65 4.5 62.5C7 63 9.6 60.5 9.2 57C8.8 53.5 7.2 50.5 7.8 46C9 40 12.5 35 13.5 28C14.5 20 14.5 8 14.5 -6Z",
          "M9 9C15 12 20 20 20.5 30C21 36 19.5 41 16.5 41.5C14 42 13 39.5 13.2 36C13.6 30 12 24 6.5 19Z"],
        l: ["M-8.5 56.8C-8.5 50 -9.5 44 -10.5 40", "M-2.5 62C-2.8 54 -3.5 47 -4.5 42", "M4.5 62.5C4.2 55 3.5 49 2.6 44", "M-14 33C-8 36.5 0 36 6 33"] },
      pugno: { p: ["M-14.5 -6C-15.5 6 -16.5 17 -15.5 28C-14.5 38 -8.5 45 0.5 45C8.5 45 14.5 40 15.5 30C16.5 20 15 8 14.5 -6Z",
          "M12.5 11C19 15 20.5 25.5 15.5 32C11.5 35 6 33 4 28.5C8 26.5 10.5 22 10.5 17.5Z"],
        l: ["M-13 24C-6 27 3 27 9 24", "M-12.5 31.5C-6 34.5 2 34.5 7 32", "M-10 38.5C-5 41 1 41 5 39.5"] },
      aperta: { p: ["M-15 -6C-16 6 -16.5 18 -16 30L16 30C16.5 18 15.5 6 15 -6Z",
          "M-16 28L-19 50C-19.5 54.5 -13 55.5 -12 51L-8.5 31Z", "M-9 30L-9.5 59C-9.5 64 -2.5 64 -2 59L-1 30Z", "M-1.5 30L0 61C0 66 7 66 7 61L6.5 30Z", "M6 29L9.5 55C10 59.5 16.5 59 16.5 54.5L14.5 28Z",
          "M-14 9C-21 13 -26 21 -28 30C-29 34.5 -23.5 36.5 -21.5 32.5C-19 26 -16 22 -11.5 20Z"],
        l: ["M-11 27C-4 29 4 29 11 27"] },
      batti: { p: ["M-14 -6C-15 8 -15.5 22 -14.5 36C-14 48 -11 58 -6 64C-3 67.5 2 67.5 3.5 63C5 56 5.5 46 6.5 36C7.5 24 9 10 10 -6Z",
          "M8 8C14 12 18 22 17 32C16.5 37 13 39 10.5 36C9.5 30 8 22 4.5 16Z"],
        l: ["M-11 38C-9 48 -6.5 56 -3.5 61"] },
      tiene: { p: ["M-14.5 -6C-15.5 6 -16.5 17 -16 28C-15.5 40 -11 50 -4 55C1 58.5 7 57.5 9.5 53C11.5 49 10 45 7.5 43C10.5 38 13.5 33 14.5 26C15 18 14.8 7 14.5 -6Z",
          "M9.5 9C16 13 21 23 21 34C21 40 17.5 44.5 13 43C11 37 9 27 5 20Z"],
        l: ["M-12.5 30C-5 33.5 3 33 9 30", "M-8 43C-3 47.5 2 48.5 6 47"] },
      indica: { p: ["M-14.5 -6C-15.5 6 -16.5 17 -15.5 28C-14.5 38 -8.5 45 0.5 45C8.5 45 14.5 40 15.5 30C16.5 20 15 8 14.5 -6Z",
          "M-3.5 32L-4.5 72C-4.5 78.5 5.5 78.5 5.5 72L6.5 32Z", "M12.5 11C19 15 20.5 25.5 15.5 32C11.5 35 6 33 4 28.5C8 26.5 10.5 22 10.5 17.5Z"],
        l: ["M-13 24C-6 27 0 27 3 25", "M-12 32C-8 34.5 -4 35 -2 34"] },
      piatta: { p: ["M-16 -6C-17 6 -18 18 -17.5 30C-17 42 -16 51 -13.5 57C-12.5 60.5 -9 61.5 -7.5 59.5C-6.5 63 -2.5 64 -1 61.5C0.5 64.5 4.5 64 5.5 61C7 63.5 10.5 62.5 11 59C13.5 55 16 47 17 38C17.8 28 17 10 16 -6Z",
          "M14 6C21 9 26 16 27 24C27.5 28.5 22.5 30 21 26C19.5 21.5 17 18 13 16Z"],
        l: ["M-7.5 59.5C-7.8 52 -8.3 46 -9 41", "M-1 61.5C-1 54 -1 48 -1.2 42", "M5.5 61C5.6 54 5.3 48 4.8 42"] }
    };
    var tipiMano = {};
    function manoSvg(lato2) {
      var b = BR[lato2], k = B.aw[3] / (m ? 28.6 : 27.4) * (b.davanti ? 1.12 : 1) * (b.mano === "pugno" ? 1.14 : 1.04), forma = MANI[b.mano] || MANI.rilassata;
      if (SPALLE && forma === MANI.rilassata) forma = { p: [MANI.rilassata.p[0]], l: MANI.rilassata.l.slice(0, 2) };   // il polso della mano largo come il polso del braccio
      var rot = -lato2 * (b.dirMano != null ? b.dirMano : b.a2) + (b.polso || 0) * -lato2, mir = -lato2;
      var tr = "translate(" + n1(b.W[0]) + " " + n1(b.W[1]) + ") rotate(" + n1(rot) + ") scale(" + n1(mir * k) + " " + n1(k * (b.schiaccia || 1)) + ")";
      var bordo = mix(sk, skDD, 0.8), s = "<g transform='" + tr + "'>";
      // il bordo dietro (solo il contorno esterno, non al polso), poi la pelle, poi luci e pieghe
      forma.p.forEach(function (d) { s += "<path d='" + d.replace(/Z$/, "") + "' fill='none' stroke='" + bordo + "' stroke-width='" + n1(3.2 / k) + "' stroke-linecap='butt'/>"; });
      forma.p.forEach(function (d) { s += Pa(d, sk); });
      var cm = clip(forma.p);
      
      forma.l.forEach(function (d) { s += St(d, mix(skDD, "#2a0f08", 0.25), 1.35, 0.62); });
      var idc = "c" + (nClip++);
      D.push("<clipPath id='" + p + idc + "'>" + forma.p.map(function (d) { return "<path d='" + d + "' transform='" + tr + "'/>"; }).join("") + "</clipPath>");
      // le luci della mano sono quelle del braccio (luce da sinistra e volume lungo la mano), in coordinate del mondo: niente salto al polso
      var ar = (rot + 90) * DEG, dm = [Math.cos(ar), Math.sin(ar)], Hm = [b.W[0] + dm[0] * 60 * k, b.W[1] + dm[1] * 60 * k];
      return s + "</g><g clip-path='url(#" + p + idc + ")'><rect x='" + n1(b.W[0] - 90) + "' y='" + n1(b.W[1] - 90) + "' width='180' height='180' fill='" + luceGlobale() + "' opacity='" + n1(luceSk * 100) / 100 + "'/>" +
        cilindro([b.W[0] - dm[0] * 8, b.W[1] - dm[1] * 8], Hm, 30 * k, skL, skDD, 0.7) + "</g>";
    }


    function ventaglio() {
      var a = BR["-1"].W, b2 = BR["1"].W, cx = (a[0] + b2[0]) / 2, cy = Math.min(a[1], b2[1]) - 26, s = "<g transform='translate(" + n1(cx) + " " + n1(cy) + ") scale(1.25) translate(" + n1(-cx) + " " + n1(-cy) + ")'>";
      var dorso = LG("cdorso", 0, 0, 1, 1, [[0, "#e04a4a"], [1, "#9c1f2c"]]);
      [-30, -15, 0, 15, 30].forEach(function (g) {
        s += "<g transform='rotate(" + g + " " + n1(cx) + " " + n1(cy + 40) + ")'><rect x='" + n1(cx - 26) + "' y='" + n1(cy - 62) + "' width='52' height='78' rx='6' fill='#fbf7ef' stroke='#7a6a5a' stroke-width='1.6'/>" +
          "<rect x='" + n1(cx - 21) + "' y='" + n1(cy - 57) + "' width='42' height='68' rx='4' fill='" + dorso + "'/><path d='M" + n1(cx - 21) + " " + n1(cy - 23) + "L" + n1(cx) + " " + n1(cy - 50) + "L" + n1(cx + 21) + " " + n1(cy - 23) + "L" + n1(cx) + " " + n1(cy + 4) + "Z' fill='#ffffff' opacity='.22'/></g>";
      });
      return s + "</g>";
    }
    // ---------- la testa ----------
    var OC = OCCHI[c.occhi] || OCCHI.tondi, kOcc = 1 + 0.07 * (+c.occG || 0), dxOcc = 26 + 2 * (+c.occD || 0), yOcc = -72 - 2.5 * (+c.occA || 0);
    K.occhiPos = { dx: dxOcc, y: yOcc, k: kOcc };   // dove stanno gli occhi (per gli occhiali)
    function occhio(side, chiuso) {
      // side: -1 a sinistra nel disegno, 1 a destra; dentro il gruppo x positivo = verso l'esterno
      var o = OC, sx = (o.sx || 1) * kOcc * (m ? 1 : 1.02), sy = (o.sy || 1) * kOcc, tilt = o.tilt || 0, lid = o.lid || 0;
      var ht = 8.2 * sy, hb = 5.2 * sy, Ix = -12.5 * sx, Ox = 12.5 * sx;
      var s = "<g transform='translate(" + n1(side * dxOcc) + " " + n1(yOcc) + ") scale(" + side + " 1) rotate(" + (-tilt) + ")'>";
      var linea = m ? hDD : "#1a0e0a", lw2 = m ? 2.1 : 2.4;
      if (o.chiusi || chiuso) {
        var d = chiuso === "felice" ? "M" + n1(Ix) + " 2C" + n1(Ix + 7) + " -6 " + n1(Ox - 8) + " -7 " + n1(Ox) + " 0" : "M" + n1(Ix) + " -1C" + n1(Ix + 7) + " 5 " + n1(Ox - 7) + " 5 " + n1(Ox) + " -2";
        s += St("M" + n1(Ix) + " -6C" + n1(Ix + 7) + " -12 " + n1(Ox - 5) + " -13 " + n1(Ox + 2) + " -8", skDD, 1, 0.4) + St(d, linea, lw2);
        if (!m || o.ciglia) for (var q = 0; q < 4; q++) { var tx = Ix + 6 + q * 5.4 * sx; s += St("M" + n1(tx) + " " + (chiuso === "felice" ? -4 : 3) + "l" + n1(1 + q * 0.6) + " " + (chiuso === "felice" ? -3 : 3.6), linea, 1); }
        return s + "</g>";
      }
      var felice = !!o.felice;
      var htv = ht * (1 - lid), eye = "M" + n1(Ix) + " 1C" + n1(Ix + 5.5) + " " + n1(1 - htv - 0.2) + " " + n1(Ox - 8.5) + " " + n1(-2 - htv * 0.8) + " " + n1(Ox) + " -2" +
        (felice ? "C" + n1(Ox - 6) + " " + n1(-2 - ht * 0.15) + " " + n1(Ix + 7) + " " + n1(1 - ht * 0.15) + " " + n1(Ix) + " 1Z"
                : "C" + n1(Ox - 6.5) + " " + n1(-2 + hb + 0.8) + " " + n1(Ix + 7.5) + " " + n1(1 + hb) + " " + n1(Ix) + " 1Z");
      var top0 = "M" + n1(Ix - 0.3) + " 1.2C" + n1(Ix + 5.5) + " " + n1(1 - htv - 0.4) + " " + n1(Ox - 8.5) + " " + n1(-2 - htv * 0.8 - 0.2) + " " + n1(Ox + 0.3) + " -2.2";
      var ce = clip(eye), rI = 5.4 * Math.min(1.25, Math.max(sx, sy)) * (o.piccola ? 0.92 : 1) * (felice ? 0.95 : 1), iy = felice ? -2.2 : -1.2 - lid * 2;
      s += "<g clip-path='" + ce + "'>" + Pa(eye, U("scl")) +
        "<circle cx='.6' cy='" + n1(iy) + "' r='" + n1(rI) + "' fill='" + U("iri") + "'/><circle cx='.6' cy='" + n1(iy) + "' r='" + n1(rI * 0.46) + "' fill='#120a08'/>" +
        (o.stelle ? Pa("M-1.4 " + n1(iy - 5) + "l1 2.4 2.4 1-2.4 1-1 2.4-1-2.4-2.4-1 2.4-1z", "#ffffff") + "<circle cx='3.6' cy='" + n1(iy + 2.4) + "' r='1.1' fill='#fff' opacity='.9'/>"
                  : "<circle cx='-1.5' cy='" + n1(iy - 2) + "' r='1.8' fill='#fff' opacity='.95'/><circle cx='2.9' cy='" + n1(iy + 2.1) + "' r='.9' fill='#fff' opacity='.45'/>") +
        Pa("M" + n1(Ix - 1) + " 3C-7 " + n1(-3 - htv * 0.4) + " 4 " + n1(-5 - htv * 0.4) + " " + n1(Ox + 1) + " -.8L" + n1(Ox + 1) + " -6C4 -12 -7 -12 " + n1(Ix - 1) + " -1Z", "#1a0f0c", " opacity='.26'") + "</g>";
      // piega della palpebra, palpebra sotto, riga delle ciglia
      s += St("M" + n1(Ix) + " " + n1(-1.5 - ht * 0.35 - lid * 2) + "C" + n1(Ix + 6.5) + " " + n1(-10 - ht * 0.2) + " " + n1(Ox - 7) + " " + n1(-11.5 - ht * 0.15) + " " + n1(Ox + 2.5) + " " + n1(-5 - ht * 0.1), skDD, 1.1, 0.5);
      s += St(felice ? "M" + n1(Ix + 1) + " 5C-4 " + n1(1 - ht * 0.1) + " 6 " + n1(-0.5 - ht * 0.1) + " " + n1(Ox - 1) + " 1" : "M" + n1(Ix + 1) + " 4C-4 " + n1(4 + hb * 0.62) + " 6 " + n1(3 + hb * 0.55) + " " + n1(Ox - 0.5) + " -.4", skDD, 0.9, felice ? 0.45 : 0.3);
      // trucco: ombretto (sopra l'occhio), eyeliner, ciglia
      if (c.ombretto && c.ombretto !== "nessuno") {
        var co = col(OPZ.colOmbretto, c.colOmbretto), opo = { leggero: 0.32, sfumato: 0.42, intenso: 0.62, glitter: 0.5 }[c.ombretto] || 0.4;
        s += Pa("M" + n1(Ix - 1) + " 0C" + n1(Ix + 3) + " -13 " + n1(Ox - 4) + " -16 " + n1(Ox + 5) + " -6C" + n1(Ox - 4) + " " + n1(-3 - htv) + " " + n1(Ix + 6) + " " + n1(-2 - htv) + " " + n1(Ix - 1) + " 0Z", co, " opacity='" + opo + "'");
        if (c.ombretto === "glitter") s += "<circle cx='-4' cy='-7' r='.9' fill='#fff'/><circle cx='4' cy='-8.5' r='.7' fill='#fff'/><circle cx='9' cy='-6' r='.8' fill='#fff'/>";
      }
      s += St(top0, linea, lw2);
      var elC = c.eyeliner && c.eyeliner !== "nessuno" ? col(OPZ.colEyeliner, c.colEyeliner) : null;
      if (elC && c.eyeliner !== "matita") s += St(top0, elC, c.eyeliner === "grafico" ? 3.6 : 2.8) + (c.eyeliner !== "sottile" ? St("M" + n1(Ox - 1) + " -2.4C" + n1(Ox + 2) + " -4 " + n1(Ox + 4.5) + " -6 " + n1(Ox + 6) + " -9", elC, 2) : "");
      if (elC && c.eyeliner === "matita") s += St("M" + n1(Ix + 2) + " 4C-4 " + n1(4 + hb * 0.6) + " 6 " + n1(3 + hb * 0.5) + " " + n1(Ox - 0.5) + " -.4", elC, 1.5, 0.85);
      if (o.linea && !elC) s += St("M" + n1(Ox - 1) + " -2.4C" + n1(Ox + 2) + " -4 " + n1(Ox + 4) + " -6 " + n1(Ox + 5) + " -8", linea, 1.6);
      var nC = (!m ? 1 : 0) + (o.ciglia ? 1 : 0) + (c.mascara === "volume" || c.mascara === "finte" ? 1 : 0), lungC = 1 + (o.ciglia ? 0.4 : 0) + (c.mascara === "finte" ? 0.5 : (c.mascara === "volume" ? 0.25 : (c.mascara === "naturale" ? 0.1 : 0)));
      if (nC || (c.mascara && c.mascara !== "nessuno")) {
        s += St("M" + n1(Ox - 1.5) + " -2.4C" + n1(Ox + 1.1) + " -3.8 " + n1(Ox + 3.1) + " -5.6 " + n1(Ox + 3.9) + " -8", "#1a0e0a", 1.4);
        [[-0.5, -0.3], [-0.15, -0.55], [0.2, -0.6], [0.5, -0.45], [0.78, -0.3]].forEach(function (f) {
          var x = Ox * f[0] * 1.6 * 0.5 + (Ix + Ox) / 2 + f[0] * 4, y = -2 - htv * (1 + f[1]) * 0.75 + 0.6, lx = x + (f[0] + 0.3) * 3 * lungC, ly = y - 3.2 * lungC;
          s += St("M" + n1(x) + " " + n1(y) + "Q" + n1(lx - 1) + " " + n1(ly + 2) + " " + n1(lx) + " " + n1(ly), "#1a0e0a", 1 + (nC > 1 ? 0.3 : 0));
        });
      }
      return s + "</g>";
    }
    function sopracciglio(side) {
      var o = SOPRA[c.sopracc] || SOPRA.morbide, w = o.w * (m ? 1 : 0.8), arc = o.arc, dy = (o.dy || 0) - 2.5 * (+c.soprA || 0) + (OC.felice ? -2 : 0), iu = o.iu || 0, pk = o.picco || 0.55;
      var x0 = o.unite ? 2 : 10, x1 = 46, yb = -89 + dy;
      var pts = [[x0, yb - iu * 0.5, w * 0.95], [x0 + (x1 - x0) * 0.28, yb - arc * 0.75 - iu * 0.25, w], [x0 + (x1 - x0) * pk, yb - arc, w * 0.88], [x1 - 4, yb - arc * 0.35 + 1.5, w * 0.5], [x1 + 1, yb + 2.5, w * 0.2]];
      var colS = m || o.w > 9 ? U("hg3") : mix(hc, "#000000", 0.25);
      var s = "<g transform='scale(" + side + " 1)'>" + Pa(limb(pts), colS);
      if (w > 5) s += St(liscio(pts.slice(0, 4).map(function (q) { return [q[0] + 2, q[1] - w * 0.15]; })), hL, 0.8, 0.3);
      if (o.taglio) s += Pa("M" + n1(x0 + (x1 - x0) * 0.62) + " " + n1(yb - arc - w) + "l3 0 -2 " + n1(w * 2.2) + "-3 0z", sk);
      return s + "</g>";
    }
    function naso() {
      var o = NASO[c.naso] || NASO.dritto, w = (o.w || 1) * (1 + 0.1 * (+c.nasoG || 0)), l = (o.l || 1) * (1 + 0.06 * (+c.nasoG || 0)), pu = (o.punta || 1);
      var s = "<g transform='translate(0 -40) scale(" + n1(w) + " " + n1(l) + ") translate(0 40)'>";
      if (o.gobba) s += St("M6 -84C9 -74 12 -66 10 -60C9 -56 11 -52 12.5 -49", skDD, 3.6, 0.26);
      else s += St("M6 -84C8.5 -70 10 -58 12.5 -49", skDD, 3.4, 0.22);
      s += St("M-5 -82C-8 -70 -9 -58 -11.5 -49", "#ffffff", 2, 0.12);
      var ty = o.insu ? -46.5 : -44.5;
      s += El(0, ty, 10.5 * pu, 7.5 * pu, soft(skL, 0.55));
      if (o.aguzzo) s += St("M-2 -49C0 -46 2 -46 3.5 -48", skDD, 1.1, 0.45);
      var wx = 11.5;
      s += St("M-" + wx + " -47C-" + (wx + 2.5) + " -41 -9 -37.4 -5 -39.6", skDD, 1.5, 0.6) + St("M" + wx + " -47C" + (wx + 2.5) + " -41 9 -37.4 5 -39.6", skDD, 1.5, 0.6);
      var nr = o.insu ? 1.8 : 1.3;
      s += El(-4.6, -39.6, 2.3, nr, "#5a2418", " opacity='.55'") + El(4.6, -39.6, 2.3, nr, "#5a2418", " opacity='.55'");
      s += El(0, -36, 11, 3.6, soft(skDD, 0.3)) + El(-2.2, ty - 2.9, 3 * pu, 1.8 * pu, "#ffffff", " opacity='.4'");
      return s + "</g>";
    }
    function orecchie() {
      var t = c.orecchie, k = t === "piccole" ? 0.82 : (t === "grandi" ? 1.22 : 1), px = F.cw - 5;
      var e = "M0 -6C13 -13 22 0 18 14C16 24 10 31 1 33Z";
      if (t === "punta") e = "M0 -6C10 -16 26 -34 30 -36C26 -20 22 2 18 14C16 24 10 31 1 33Z";
      var one = "<g transform='translate(" + px + " -78) scale(" + k + ")'>" + Pa(e, mix(sk, skD, 0.3)) +
        St("M5 0C12 -2.5 14.5 7 12.5 14.5C11.5 19.5 8.5 22 5 23", skD, 1.6, 0.75) + Pa("M8 12C11 10 12.5 14 11 17C9 17 8 15 8 12Z", skDD, " opacity='.35'") + "</g>";
      return one + "<g transform='scale(-1 1)'>" + one + "</g>";
    }
    var CALVI = { calvo: 1 }, RASATI = { rasato: 1, sfumato: 1 }, PELATI_SOPRA = { stempiato: 1, chierica: 1 };
    function testaDietro(capF, capD) {
      var nkH = B.nk / 0.9 * 1.08, cw = F.cw;
      var nuca = "M" + (-cw) + " -78C" + (-cw - 1) + " " + n1(-78 - 40 * F.L) + " " + n1(-cw * 0.63) + " " + n1(top + 2) + " 0 " + n1(top) + "C" + n1(cw * 0.63) + " " + n1(top + 2) + " " + (cw + 1) + " " + n1(-78 - 40 * F.L) + " " + cw + " -78" +
        "C" + cw + " -50 " + n1(cw * 0.82) + " -24 " + n1(nkH) + " -4L" + n1(-nkH) + " -4C" + n1(-cw * 0.82) + " -24 " + (-cw) + " -50 " + (-cw) + " -78Z";
      var s = orecchie(), nome = pcap ? pcap.nome : "calvo";
      if (capF && !CALVI[nome]) s += "<g transform='scale(-1 1)'>" + capF + "</g>";   // il volume dei capelli intorno alla testa (girato: di spalle destra e sinistra si scambiano)
      var cn = clip(nuca);
      if (CALVI[nome] || RASATI[nome] || PELATI_SOPRA[nome] || !pcap) {
        s += Pa(nuca, U("face")) + "<g clip-path='" + cn + "'>" + El(-14, top + 30, 26, 20, soft("#ffffff", 0.22)) + El(cw * 0.5, -40, cw * 0.6, 50, soft(skDD, 0.3));
        if (RASATI[nome]) s += K.rasatura(nuca, 900, 0.6);
        if (PELATI_SOPRA[nome]) s += Pa("M-80 -96C-40 -84 40 -84 80 -96L80 20L-80 20Z", U("hg3")) + K.ciocche([[[-40, -92, 3], [-42, -60, 10], [-36, -20, 3]], [[0, -88, 3], [0, -50, 12], [0, -10, 3]], [[40, -92, 3], [42, -60, 10], [36, -20, 3]]], ["hg1", "hg2"]);
        s += "</g>";
      } else {
        s += Pa(nuca, U("hg3")) + "<g clip-path='" + cn + "'>";
        var str = [];
        for (var i = -3; i <= 3; i++) { var x0 = i * cw / 3.6; str.push([[x0 * 0.5, top + 10, 4], [x0 * 1.05, -112, 15], [x0 * 1.1, -60, 14], [x0 * 0.92, -14, 6], [x0 * 0.8, 0, 2]]); }
        s += K.ciocche(str, ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2", "hg1"]) + El(cw * 0.45, -40, cw * 0.7, 70, soft(hDD, 0.35)) + El(-cw * 0.3, top + 30, cw * 0.6, 26, soft(hL, 0.25)) + "</g>";
      }
      if (capD) s += "<g transform='scale(-1 1)'>" + capD + "</g>";   // i capelli lunghi che scendono sulla schiena: di spalle stanno davanti
      return s;
    }
    function testa(capFronte, barba, ombraFronte) {
      var s = orecchie();
      s += Pa(faceD, U("face"));
      var fc = clip(faceD);
      s += "<g clip-path='" + fc + "'>";
      s += "<rect x='14' y='-160' width='52' height='164' fill='" + LG("rs", 0, 0, 1, 0, [[0, skD, 0], [1, skD, 0.55]]) + "'/>";
      s += El(0, -3, 40, 12, soft(skDD, 0.3));
      s += El(-dxOcc, yOcc, 20, 12, soft(skDD, 0.2)) + El(dxOcc, yOcc, 20, 12, soft(skDD, 0.24));
      var gC = m ? "#e0806a" : "#ec7f8a", gO = m ? 0.2 : 0.3;
      if (c.guance === "rosse") { gC = "#f0606e"; gO = 0.45; } else if (c.guance === "leggere") gO += 0.1;
      if (c.blush && c.blush !== "nessuno") { gC = col(OPZ.colBlush, c.colBlush); gO = c.blush === "intenso" ? 0.55 : 0.38; }
      s += El(-34, -42, 17, 12, soft(gC, gO)) + El(34, -42, 17, 12, soft(gC, gO * 0.9));
      s += El(-30, -62, 13, 8, soft("#ffffff", 0.2)) + El(-10, top + 32, 30, 16, soft("#ffffff", 0.16));
      if (ombraFronte !== false) s += El(0, top + 24, 44, 6, soft(hDD, m ? 0.16 : 0.08));
      if (barba && barba.dentro) s += barba.dentro;
      if (pittura) s += pittura;
      if (c.guance === "lentiggini") { var R = rnd(5); for (var i = 0; i < 26; i++) { var x = (i % 2 ? 1 : -1) * (14 + R() * 26), y = -58 + R() * 18; s += "<circle cx='" + n1(x) + "' cy='" + n1(y) + "' r='" + n1(0.8 + R() * 0.8) + "' fill='" + skDD + "' opacity='.45'/>"; } }
      s += "</g>";
      s += naso();
      // bocca
      var pb = pezzoDi("bocca", c.bocca);
      var yb = -2.2 * (+c.boccaA || 0);
      s += "<g transform='translate(0 " + n1(yb) + ")'>" + (pb ? pb.fn(K) : "") + "</g>";
      if (barba && barba.sopra) s += barba.sopra;
      // occhi e sopracciglia
      var occh = c.occhi === "occhiolino";
      s += "<g class='om-occhi'>" + occhio(-1) + occhio(1, occh ? "felice" : null) + "</g>" + sopracciglio(-1) + sopracciglio(1);
      if (SOPRA[c.sopracc] && SOPRA[c.sopracc].unite) s += Pa("M-12 " + n1(-90 + (SOPRA[c.sopracc].dy || 0)) + "C-5 -93 5 -93 12 " + n1(-90 + (SOPRA[c.sopracc].dy || 0)) + "L12 -85C5 -88 -5 -88 -12 -85Z", U("hg3"), " opacity='.85'");
      // segni sul viso
      var sg = A.segno[c.segno]; if (sg) s += sg(K);
      return s;
    }

    // ---------- i pezzi di questa configurazione ----------
    LG("face", 0.2, 0, 0.85, 1, [[0, mix(skL, sk, 0.35)], [0.4, sk], [0.8, mix(sk, skD, 0.6)], [1, skD]]);
    LG("scl", 0, 0, 0, 1, [[0, "#c9bfb8"], [0.35, "#f7f2ed"], [1, "#e4dbd4"]]);
    RG("iri", [[0, mix(iris, "#ffffff", 0.35)], [0.55, iris], [1, mix(iris, "#000000", 0.55)]], "cx='.5' cy='.6' r='.55'");
    var capTipo = c.capelli, pcap = capTipo === "calvo" && !A.capelli.calvo ? null : pezzoDi("capelli", capTipo);
    var cap = pcap ? (pcap.fn(K) || {}) : {};
    var pCapp = c.cappello && c.cappello !== "nessuno" ? pezzoDi("cappelli", c.cappello) : null, capp = pCapp ? (pCapp.fn(K) || {}) : null;
    // ---------- gli extra (secondo tempo): al collo, sulla schiena, la borsa, in mano, l'animaletto, la pittura sul viso ----------
    // collo: { sopra, dietro } · schiena: { dietro, sopra (spallacci) } · borsa: { sotto (la borsa, prima delle braccia), sopra (la tracolla) }
    // inmano: { dietro (prima della mano: il manico dentro il pugno), davanti } · animale: svg (a terra, accanto) · pittura: svg in coordinate della testa (ritagliata sul viso)
    function extra(tipo, v, vuoto) { var f = v && v !== vuoto && A[tipo] ? A[tipo][v] : null; return f ? f(K) : null; }
    var bR = BR["1"], dR = [(bR.W[0] - bR.E[0]) / bR.l2, (bR.W[1] - bR.E[1]) / bR.l2], kM = B.aw[3] / (m ? 28.6 : 27.4) / 1.06;
    var conOgg = !!(c.mano && c.mano !== "nessuno" && !bR.davanti && !bR.canna && !opts.busto && !opts.viso && A.inmano[c.mano]);   // nei tondini niente cose in mano (si vedevano a pezzi sul bordo)
    if (conOgg) bR.mano = "pugno";
    K.presa = { x: bR.W[0] + dR[0] * 20 * kM, y: bR.W[1] + dR[1] * 20 * kM, ang: Math.atan2(dR[0], dR[1]) / DEG, k: kM };   // dove stringe il pugno a destra nel disegno (mondo); ang = la direzione dell'avambraccio
    var xCollo = extra("collo", c.collo, "nessuno"), xSch = extra("schiena", c.schiena, "nessuna"), xBor = extra("borsa", c.borsa, "nessuna"), xAni = soloSu ? null : extra("animale", c.animale, "nessuno"), xOgg = conOgg ? A.inmano[c.mano](K) : null;
    var pittura = extra("pittura", c.pittura, "nessuna");
    if (typeof xOgg === "string") xOgg = { davanti: xOgg }; if (typeof xCollo === "string") xCollo = { sopra: xCollo }; if (typeof xSch === "string") xSch = { dietro: xSch }; if (typeof xBor === "string") xBor = { sopra: xBor };
    xOgg = xOgg || {}; xCollo = xCollo || {}; xSch = xSch || {}; xBor = xBor || {};
    var pBarba = m && c.barba && c.barba !== "no" ? pezzoDi("barba", c.barba) : null, barba = pBarba ? (pBarba.fn(K) || {}) : null;
    if (typeof barba === "string") barba = { dentro: barba };
    function chiama(pz) {
      if (!pz) return null;
      if (!SPALLE) return pz.fn(K);
      var rec = [], vero = K.dipingi, r2;
      K.dipingi = function (q, col2, o2) { rec.push([q, col2, o2 || {}]); return { svg: "", clip: "none" }; };
      try { r2 = pz.fn(K); } finally { K.dipingi = vero; }
      if (!rec.length) return r2;
      var s2 = rec.map(function (x) { var o3 = x[2]; return dipingi(x[0], x[1], { bordo: o3.bordo, chiaro: o3.chiaro, scuro: o3.scuro, forza: o3.forza, volume: o3.volume,
        dentro: El(C - B.ch * 0.4, Y.ascella + 20, B.ch * 0.36, 60, soft("#ffffff", 0.12)) + St("M" + (C - 30) + " " + (Y.petto + 10) + "C" + (C - 10) + " " + (Y.petto + 26) + " " + (C + 10) + " " + (Y.petto + 26) + " " + (C + 30) + " " + (Y.petto + 10), mix(x[1], "#000000", 0.4), 3, 0.14) }).svg; }).join("");
      return { corpo: s2 };
    }
    var pCapo = pezzoDi("capo", c.capo), capo = pCapo ? (chiama(pCapo) || {}) : {};
    if (typeof capo === "string") capo = { corpo: capo };
    var intero = /^(vestito|vestitolungo)$/.test(c.capo) && !/^(leggings|jeans|pantaloni|strappati|zampa|tuta|cargo|mimetici)$/.test(c.sotto);   // l'abito copre gonne e pantaloncini
    var soloSu = !!(opts.busto || opts.viso);   // primo piano: gambe, pantaloni e scarpe non si vedono (non si disegnano: l'avatar pesa meno)
    var pSotto = intero || soloSu ? null : pezzoDi("sotto", c.sotto), sotto = pSotto ? chiama(pSotto) : "";
    if (typeof sotto === "string") sotto = { corpo: sotto };
    var alte = /^(stivali|anfibi|pattini|stivaletti|stivalialti)$/.test(c.modScarpe);
    var pScarpe = soloSu ? null : pezzoDi("scarpe", c.modScarpe), scarpe = pScarpe ? pScarpe.fn(K) : "";
    if (typeof scarpe === "string") scarpe = { corpo: scarpe };

    // col cappello i capelli si vedono solo sotto la sua linea (coordinate della testa)
    function sottoCappello(sv) {
      if (!sv || !capp || capp.linea == null) return sv || "";
      return "<g clip-path='" + clip("M-200 " + capp.linea + "L200 " + capp.linea + "L200 400L-200 400Z") + "'>" + sv + "</g>";
    }

    // ---------- composizione ----------
    var vb = opts.busto ? "66 13 68 69.6" : (opts.vita ? "46 11 108 118" : (opts.gambe ? "40 110 120 146" : (opts.viso ? "82 14 36 36" : "0 0 200 264")));
    var px = opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * (opts.busto ? 182 / 178 : (opts.vita ? 118 / 108 : 1.32))) + "'" : "";
    var seduto = !!opts.seduto && !opts.busto && !opts.viso && !opts.gambe && PARTE !== "braccio" ? seduto : null;
    var body = "";
    var piedi = opts.busto || opts.viso ? "" : El(200, 996, 120, 13, soft("#000000", 0.38));
    body += piedi;
    if (!SPALLE) body += (xSch.dietro || "");
    if (!SPALLE) body += (capo.dietro || "") + (xCollo.dietro || "");
    if (!SPALLE) body += "<g transform='" + HT + "'>" + sottoCappello(cap.dietro) + (capp && capp.dietro ? capp.dietro : "") + "</g>";
    if (SPALLE && scarpe.corpo) { var gT = gIn(938); scarpe.corpo = "<g clip-path='" + clip(["M" + n1(C - gT[0] - 30) + " 880H" + n1(C - gT[0] + 30) + "V1010H" + n1(C - gT[0] - 30) + "Z", "M" + n1(C + gT[0] - 30) + " 880H" + n1(C + gT[0] + 30) + "V1010H" + n1(C + gT[0] - 30) + "Z"]) + "'>" + scarpe.corpo + "</g>"; }
    var cam = opts.cammina && !opts.busto;
    if (PARTE === "braccio") {
      var zona = clip(contornoBraccio(LP, 46, 1, 30));
      var sB = pelleBraccio(LP) + "<g clip-path='" + zona + "'>" + (capo.corpo || "") + "</g>" + (BR[LP].davanti ? pelleAvanti(LP) : "") + (LP === 1 ? xOgg.dietro || "" : "") + manoSvg(LP) + (LP === 1 ? xOgg.davanti || "" : "");
      return fine("<svg xmlns='http://www.w3.org/2000/svg' stroke-linejoin='round' viewBox='0 0 200 264'" + (opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * 1.32) + "'" : "") + " class='omino omino-a omino-braccio'><defs>" + D.join("") + "</defs><g transform='matrix(.25 0 0 .25 50 2)'>" + sB + "</g></svg>");
    }
    if (PARTE === "corpo") opts = (function () { var o = {}; for (var k in opts) o[k] = opts[k]; o.senzaBraccio = LP; return o; })();
    if (seduto) return fine(seduto());
    body += pelleCorpo(soloSu);
    if (!alte) body += "<g class='om-scarpe'>" + (scarpe.corpo || "") + "</g>";
    body += sotto.corpo || "";
    if (alte) body += "<g class='om-scarpe'>" + (scarpe.corpo || "") + "</g>";
    if (sotto.sopra) body += sotto.sopra;
    body += (xBor.sotto || "") + (xAni || "");
    var bS = function (lato) { return opts.senzaBraccio === lato ? "" : "<g class='" + (cam ? (lato === -1 ? "om-b1" : "om-b2") : "") + "'>" + pelleBraccio(lato) + "</g>"; };
    body += bS(-1) + bS(1);
    body += capo.corpo || "";
    [-1, 1].forEach(function (l) { if (BR[l].davanti && opts.senzaBraccio !== l && !SPALLE) body += pelleAvanti(l); });
    if (opts.gesto === "carte" && !SPALLE) body += ventaglio();
    body += (opts.senzaBraccio === -1 ? "" : manoSvg(-1)) + (opts.senzaBraccio === 1 ? "" : (xOgg.dietro || "") + manoSvg(1) + (xOgg.davanti || ""));
    if (capo.sopra && !SPALLE) body += capo.sopra;
    if (!SPALLE) body += (xCollo.sopra || "") + (xSch.sopra || "") + (xBor.sopra || "");
    else body += (xSch.dietro || "") + (xCollo.spalle || xCollo.dietro || "");   // di spalle lo zaino, le ali e il mantello stanno davanti; al collo la sciarpa vista da dietro
    if (SPALLE) {
      var pOreS = c.orecchini && c.orecchini !== "nessuno" ? A.orecchini[c.orecchini] : null;
      body += "<g transform='" + HT + "'>" + testaDietro(sottoCappello(cap.fronte), sottoCappello(cap.dietro)) + (pOreS ? pOreS(K) : "") + (capp && capp.dietro ? capp.dietro : "") + (capp ? capp.svg || "" : "") + "</g>";
      return fine(avvolgi(body));
    }
    // occhiali e orecchini (coordinate della testa): gli orecchini sotto i capelli, gli occhiali sopra i capelli e sotto il cappello
    var pOcc = c.occhiali && c.occhiali !== "nessuno" ? A.occhiali[c.occhiali] : null, pOre = c.orecchini && c.orecchini !== "nessuno" ? A.orecchini[c.orecchini] : null;
    body += "<g transform='" + HT + "'>" + testa(cap.fronte, barba, cap.ombraFronte) + (pOre ? pOre(K) : "") + sottoCappello(cap.fronte) + (pOcc ? pOcc(K) : "") + (capp ? capp.svg || "" : "") + "</g>";
    if (A.extra.dopo) body += A.extra.dopo(K);

    function avvolgi(b2) { return "<svg xmlns='http://www.w3.org/2000/svg' stroke-linejoin='round' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='" + vb + "'" + px + " class='omino omino-a'><defs>" + D.join("") + "</defs><g transform='matrix(.25 0 0 .25 50 2)'><g class='om-tutto'>" + b2 + "</g></g></svg>"; }
    // seduto: il corpo (pelle, pantaloni, scarpe, tronco del vestito) si disegna una volta e si usa 4 volte a fasce: busto spostato giù,
    // cosce e stinchi accorciati, piedi fermi a terra. Braccia, maniche, mani e testa solo spostati giù.
    function seduto() {
      var nB = "sd" + (cnt++), dy = SED.dy, ini = PARTE, ilp = LP;
      PARTE = "corpo"; LP = 0; var cC = pCapo ? (chiama(pCapo) || {}) : {}; if (typeof cC === "string") cC = { corpo: cC };
      PARTE = "braccio"; LP = 0; var cB = pCapo ? (chiama(pCapo) || {}) : {}; if (typeof cB === "string") cB = { corpo: cB };
      PARTE = ini; LP = ilp;
      var giu = pelleCorpo(false) + (!alte ? scarpe.corpo || "" : "") + (sotto.corpo || "") + (alte ? scarpe.corpo || "" : "") + (sotto.sopra || "") + (cC.corpo || "");
      D.push("<g id='" + p + nB + "'>" + giu + "</g>");
      var u = function (tr2) { return "<use href='#" + p + nB + "' xlink:href='#" + p + nB + "' transform='" + tr2 + "'/>"; };
      var fascia = function (y0, y1) { return clip("M-200 " + n1(y0) + "H600V" + n1(y1) + "H-200Z"); };
      var o = piedi + (xAni || "");
      if (!SPALLE) o += "<g transform='translate(0 " + dy + ")'>" + (xSch.dietro || "") + (capo.dietro || "") + (xCollo.dietro || "") + "<g transform='" + HT + "'>" + sottoCappello(cap.dietro) + (capp && capp.dietro ? capp.dietro : "") + "</g></g>";
      o += "<g clip-path='" + fascia(-400, SED.yA + 0.6) + "'>" + u("translate(0 " + dy + ")") + "</g>";
      var kx = SED.kx, tx = n1(200 * (1 - kx));
      o += "<g clip-path='" + fascia(SED.yA - 0.6, SED.yK + 0.6) + "'>" + u("matrix(" + kx + " 0 0 " + SED.sB + " " + tx + " " + n1(SED.yA - SED.yAB * SED.sB) + ")") + "</g>";
      o += "<g clip-path='" + fascia(SED.yK - 0.6, SED.yCD + 0.6) + "'>" + u("matrix(" + kx + " 0 0 " + n1(SED.sC * 1000) / 1000 + " " + tx + " " + n1(SED.yK - SED.yBC * SED.sC) + ")") + "</g>";
      o += "<g clip-path='" + fascia(SED.yCD - 0.6, 1400) + "'>" + u("matrix(" + kx + " 0 0 1 " + tx + " 0)") + "</g>";
      // il grembo: ombra sotto la pancia, luce sopra le ginocchia, ombra sotto (gli stinchi vanno indietro)
      var gK = gIn(748);
      o += El(C, SED.yA + 5, B.hp * 0.95, 8, soft("#000000", 0.24));
      [-1, 1].forEach(function (l) { var kx2 = C + l * gK[0] * SED.kx; o += El(kx2 - 3, SED.yK - 10, gK[1] * 0.8, 10, soft("#ffffff", 0.22)) + El(kx2 + l * 2, SED.yK + 14, gK[1] * 1.05, 13, soft("#000000", 0.38)); });
      var su = xBor.sotto || "";
      [-1, 1].forEach(function (l) { if (opts.senzaBraccio !== l) su += pelleBraccio(l); });
      su += cB.corpo || "";
      [-1, 1].forEach(function (l) { if (BR[l].davanti && opts.senzaBraccio !== l && !SPALLE) su += pelleAvanti(l); });
      su += (opts.senzaBraccio === -1 ? "" : manoSvg(-1)) + (opts.senzaBraccio === 1 ? "" : (xOgg.dietro || "") + manoSvg(1) + (xOgg.davanti || ""));
      su += cC.sopra || "";
      su += SPALLE ? xSch.dietro || "" : (xCollo.sopra || "") + (xSch.sopra || "") + (xBor.sopra || "");
      var pOcc2 = c.occhiali && c.occhiali !== "nessuno" ? A.occhiali[c.occhiali] : null, pOre2 = c.orecchini && c.orecchini !== "nessuno" ? A.orecchini[c.orecchini] : null;
      su += "<g transform='" + HT + "'>" + (SPALLE ? testaDietro(sottoCappello(cap.fronte), sottoCappello(cap.dietro)) + (pOre2 ? pOre2(K) : "") + (capp && capp.dietro ? capp.dietro : "") + (capp ? capp.svg || "" : "")
        : testa(cap.fronte, barba, cap.ombraFronte) + (pOre2 ? pOre2(K) : "") + sottoCappello(cap.fronte) + (pOcc2 ? pOcc2(K) : "") + (capp ? capp.svg || "" : "")) + "</g>";
      if (A.extra.dopo) su += A.extra.dopo(K);
      return avvolgi(o + "<g transform='translate(0 " + dy + ")'>" + su + "</g>");
    }
    // inquadrature (coordinate del riquadro 200×264)
    var passo = "";
    if (cam) {
      var jx = BR["-1"].J;
      passo = "<style>.om-b1{transform-origin:" + n1(jx[0] * 0.25 + 50) + "px " + n1(jx[1] * 0.25 + 2) + "px;animation:omBr .42s ease-in-out infinite alternate}" +
        ".om-b2{transform-origin:" + n1(400 - jx[0]) * 0.25 + 50 + "px " + n1(jx[1] * 0.25 + 2) + "px;animation:omBr .42s ease-in-out infinite alternate-reverse}@keyframes omBr{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}</style>";
    }
    return fine("<svg xmlns='http://www.w3.org/2000/svg' stroke-linejoin='round' viewBox='" + vb + "'" + px + " class='omino omino-a'>" + passo + "<defs>" + D.join("") + "</defs><g transform='matrix(.25 0 0 .25 50 2)'><g class='om-tutto'>" + body + "</g></g></svg>");
  };

  // dove sta la mano a destra nel disegno (coordinate 200×264): per la canna il centro del pugno
  // dove sta la spalla (perno del braccio) nel riquadro 200×264
  A.perno = function (c, opts) { var G = A.geometria(c, opts || {}), J = G.BR[(opts && opts.latoParte === -1) ? "-1" : "1"].J; return { x: +(J[0] * 0.25 + 50).toFixed(2), y: +(J[1] * 0.25 + 2).toFixed(2) }; };
  A.mano = function (c, opts) {
    opts = opts || {};
    var G = A.geometria(c, opts), b = G.BR["1"], d = [(b.W[0] - b.E[0]) / b.l2, (b.W[1] - b.E[1]) / b.l2], k = opts.braccia === "canna" ? 20 : 16;
    var sy = opts.seduto && !opts.busto ? SED.dy : 0;
    return { x: +((b.W[0] + d[0] * k) * 0.25 + 50).toFixed(2), y: +((b.W[1] + d[1] * k + sy) * 0.25 + 2).toFixed(2) };
  };

  // =========================================================
  //  I PEZZI DI BASE (dalla prova A che il proprietario ha visto)
  // =========================================================
  // ---- bocche: neutra e sorriso (le altre nei pezzi) ----
  A.pezzo("bocca", "neutro", function (K) {
    var lip = K.labbro, mw = K.m ? 15 : 14.5, s = "";
    s += K.St("M-4 -36C-4 -33 -3.5 -31 -3 -30", K.skDD, 1, 0.22) + K.St("M4 -36C4 -33 3.5 -31 3 -30", K.skDD, 1, 0.22);
    s += K.Pa("M-" + mw + " -24.2C-9 -30 -4.5 -32 0 -29.6C4.5 -32 9 -30 " + mw + " -24.2C8 -22.6 -8 -22.6 -" + mw + " -24.2Z", K.mix(lip, "#000000", 0.12));
    s += K.Pa("M-" + (mw - 2) + " -23.4C-6 -21.2 6 -21.2 " + (mw - 2) + " -23.4C10 -14 -10 -14 -" + (mw - 2) + " -23.4Z", lip);
    s += K.El(-1, -18.8, 5.5, 1.6, "#ffffff", " opacity='" + (K.rossetto && K.c.rossetto === "lucido" ? 0.75 : (K.m ? 0.22 : 0.45)) + "'");
    s += K.St("M-" + (mw + 0.5) + " -24.6C-6 -22.2 6 -22.2 " + (mw + 0.5) + " -24.6", K.mix(lip, "#2a0c0a", 0.62), 1.2);
    s += K.St("M" + (mw + 0.5) + " -24.6C" + (mw + 2) + " -26 " + (mw + 2.6) + " -26.6 " + (mw + 3) + " -27", K.skDD, 1, 0.45) + K.St("M-" + (mw + 0.5) + " -24.6C-" + (mw + 2) + " -26 -" + (mw + 2.6) + " -26.6 -" + (mw + 3) + " -27", K.skDD, 1, 0.45);
    s += K.El(0, -10.6, 9, 2.6, K.soft(K.skDD, 0.3));
    return s;
  });
  A.pezzo("bocca", "sorriso", function (K) {
    var lip = K.labbro, mw = K.m ? 16 : 15.5, s = "";
    s += K.St("M-4 -36C-4 -33 -3.5 -31 -3 -30", K.skDD, 1, 0.22) + K.St("M4 -36C4 -33 3.5 -31 3 -30", K.skDD, 1, 0.22);
    s += K.Pa("M-" + mw + " -27C-9 -30.5 -4.5 -32 0 -30C4.5 -32 9 -30.5 " + mw + " -27C8 -23.5 -8 -23.5 -" + mw + " -27Z", K.mix(lip, "#000000", 0.12));
    s += K.Pa("M-" + (mw - 1.5) + " -25.6C-6 -22.6 6 -22.6 " + (mw - 1.5) + " -25.6C10 -15 -10 -15 -" + (mw - 1.5) + " -25.6Z", lip);
    s += K.El(-1, -19.2, 5.5, 1.5, "#ffffff", " opacity='" + (K.rossetto && K.c.rossetto === "lucido" ? 0.75 : (K.m ? 0.22 : 0.45)) + "'");
    s += K.St("M-" + (mw + 1) + " -27.6C-8 -22.6 8 -22.6 " + (mw + 1) + " -27.6", K.mix(lip, "#2a0c0a", 0.62), 1.3);
    s += K.St("M" + (mw + 1) + " -27.6C" + (mw + 3) + " -29.4 " + (mw + 4) + " -30.6 " + (mw + 4.4) + " -31.6", K.skDD, 1.1, 0.5) + K.St("M-" + (mw + 1) + " -27.6C-" + (mw + 3) + " -29.4 -" + (mw + 4) + " -30.6 -" + (mw + 4.4) + " -31.6", K.skDD, 1.1, 0.5);
    s += K.St("M" + (mw + 8) + " -44C" + (mw + 11) + " -36 " + (mw + 10) + " -30 " + (mw + 7) + " -25", K.skD, 1.6, 0.25) + K.St("M-" + (mw + 8) + " -44C-" + (mw + 11) + " -36 -" + (mw + 10) + " -30 -" + (mw + 7) + " -25", K.skD, 1.6, 0.22);
    s += K.El(0, -10.6, 9, 2.6, K.soft(K.skDD, 0.3));
    return s;
  });
  // ---- barba di un giorno ----
  A.pezzo("barba", "accenno", function (K) {
    var hDD = K.hDD;
    var clipB = K.clip("M-62 -66L-46 -62C-36 -53 -25 -46 -13 -46C-6 -49 6 -49 13 -46C25 -46 36 -53 46 -62L62 -66L62 10L-62 10Z");
    var R = K.rnd(7), d = "";
    for (var i = 0; i < 380; i++) { var x = (R() * 2 - 1) * 56, y = -60 + Math.pow(R(), 0.55) * 66; d += "M" + K.n1(x) + " " + K.n1(y) + "h.2"; }
    return { dentro: "<g clip-path='" + clipB + "'><rect x='-60' y='-70' width='120' height='80' fill='" + K.LG("bdg", 0, 0, 0, 1, [[0, hDD, 0], [0.3, hDD, 0.12], [0.6, hDD, 0.24], [1, hDD, 0.36]]) + "'/>" +
      "<path d='" + d + "' stroke='" + hDD + "' stroke-width='1.25' stroke-linecap='round' opacity='.4' fill='none'/></g>" };
  });
  // ---- capelli: corti col ciuffo (uomo) e lunghi mossi (donna) ----
  A.pezzo("capelli", "corti", function (K) {
    var s = K.Pa("M-55 -84C-66 -118 -58 -160 -22 -171C8 -181 46 -174 60 -148C68 -128 62 -104 56 -84L53 -100C44 -118 22 -128 -2 -126C-26 -125 -44 -114 -53 -98Z", K.U("hg3"));
    s += "<g clip-path='" + K.clip("M-55 -84C-66 -118 -58 -160 -22 -171C8 -181 46 -174 60 -148C68 -128 62 -104 56 -84L53 -100C44 -118 22 -128 -2 -126C-26 -125 -44 -114 -53 -98Z") + "'>";
    s += K.ciocche([
      [[-50, -98, 14], [-55, -128, 18], [-42, -156, 16], [-14, -170, 10], [14, -174, 2]],
      [[-38, -114, 14], [-38, -142, 18], [-18, -162, 16], [14, -173, 10], [42, -170, 2]],
      [[-20, -122, 14], [-12, -146, 18], [8, -164, 16], [34, -172, 10], [58, -160, 2]],
      [[2, -124, 14], [12, -146, 18], [30, -160, 14], [52, -161, 8], [64, -148, 2]],
      [[26, -120, 12], [40, -134, 14], [55, -144, 10], [64, -132, 2]],
      [[-8, -128, 6], [4, -144, 6], [18, -154, 4], [30, -158, 1]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1", "hg1"]) + "</g>";
    s += K.Pa(K.limb([[51, -106, 9], [56, -98, 9], [56, -82, 5]]), K.U("hg2")) + K.Pa(K.limb([[-51, -106, 9], [-56, -98, 9], [-56, -82, 5]]), K.U("hg2"));
    return { fronte: s };
  });
  A.pezzo("capelli", "lunghi", function (K) {
    var back = "M-58 -92C-76 -40 -86 30 -90 90C-93 124 -88 146 -80 158C-70 166 -62 152 -50 160C-34 166 -22 150 0 154C22 150 34 166 50 160C62 152 70 166 80 158C88 146 93 124 90 90C86 30 76 -40 58 -92C48 -150 -52 -150 -58 -92Z";
    var dietro = K.Pa(back, K.U("hg3")) + K.Pa("M-70 20C-72 70 -76 110 -74 150C-60 160 -52 152 -40 158L-40 40Z", K.hD, " opacity='.45'");
    var s = K.Pa("M-57 -80C-68 -130 -50 -170 -6 -174C42 -178 68 -140 60 -84L56 -96C48 -118 30 -134 -12 -142C-36 -128 -50 -112 -54 -92Z", K.U("hg3"));
    var LA = [[-14, -150, 8], [-34, -148, 16], [-50, -128, 20], [-57, -98, 22], [-60, -60, 24], [-66, -14, 26], [-60, 34, 28], [-70, 84, 26], [-62, 126, 20], [-70, 160, 10], [-66, 176, 3]];
    var LB = [[-16, -156, 8], [-32, -162, 14], [-52, -150, 20], [-64, -122, 22], [-68, -84, 24], [-72, -30, 26], [-80, 26, 28], [-70, 84, 26], [-82, 130, 20], [-72, 162, 10], [-78, 178, 3]];
    var RA = [[-12, -152, 8], [10, -154, 16], [36, -144, 20], [52, -122, 22], [58, -96, 16], [60, -84, 6]];
    var RB = [[54, -112, 12], [70, -86, 18], [76, -34, 22], [70, 18, 26], [78, 70, 28], [68, 120, 22], [76, 160, 10], [72, 176, 3]];
    var RC = [[56, -104, 8], [76, -70, 14], [82, -20, 18], [76, 40, 22], [86, 100, 18], [78, 150, 8], [84, 172, 2]];
    s += K.ciocche([LB, LA, RC, RB, RA, [[-12, -152, 8], [-26, -170, 14], [-46, -164, 16], [-62, -140, 12]]], ["hg2", "hg1", "hg2", "hg1", "hg2", "hg1"]);
    return { dietro: dietro, fronte: s };
  });
  // ---- vestiti: maglietta e maniche lunghe; jeans; sneakers ----
  function maglia(K, lung) {
    var mg = K.maglia, mdd = K.scuro(mg, 0.5), C = K.C, B = K.B, Y = K.Y, ea = lung < 0.5 ? 10 : 7;
    // la stoffa è la sagoma del corpo allargata: tronco + maniche colorati insieme (K.dipingi), niente giunture alla spalla
    var T = K.busto({ agio: 6, orlo: 512, scollo: { prof: 18, larg: 4 }, pancia: B.pancia ? 6 : 0 });
    var br = [-1, 1].map(function (l) { return { d: K.manica(l, { lung: lung, agio: ea }), lato: l, fino: lung, e: ea }; });
    var p = K.El(C - 40, Y.petto - 30, 30, 40, K.soft("#ffffff", 0.16)) + K.El(C, 272, 40, 14, K.soft(mdd, 0.3));
    if (K.donna) { var bs = B.seno || 1; p += K.El(C - 22 * bs, Y.petto + 24 * bs, 30 * bs, 8, K.soft(mdd, 0.2)) + K.El(C + 22 * bs, Y.petto + 24 * bs, 30 * bs, 8, K.soft(mdd, 0.24)) + K.El(C - 26 * bs, Y.petto - 2, 20 * bs, 15 * bs, K.soft("#ffffff", 0.16)); }
    if (B.pancia) p += K.St("M" + (C - B.wt + 10) + " " + (Y.vita + 26) + "C" + (C - 30) + " " + (Y.vita + 44) + " " + (C + 30) + " " + (Y.vita + 44) + " " + (C + B.wt - 10) + " " + (Y.vita + 26), mdd, 4, 0.25);
    p += K.St("M" + (C - B.wt + 4) + " 470C" + (C - B.wt + 24) + " 478 " + (C - B.wt + 44) + " 472 " + (C - B.wt + 64) + " 482", mdd, 5, 0.13);
    p += K.St("M" + (C + B.wt - 6) + " 442C" + (C + B.wt - 26) + " 454 " + (C + B.wt - 40) + " 452 " + (C + B.wt - 62) + " 464", mdd, 4, 0.15);
    p += K.St("M" + (C - 24) + " 420C" + (C - 12) + " 440 " + (C - 10) + " 470 " + (C - 18) + " 498", mdd, 4, 0.1);
    p += K.St("M" + (C - B.hp + 2) + " 502C" + (C - 20) + " 510 " + (C + 20) + " 510 " + (C + B.hp - 2) + " 502", mdd, 2, 0.35);
    // le pieghe dove la manica si attacca (ombra morbida sotto la spalla)
    [-1, 1].forEach(function (l) { var J = K.BR[l].J; p += K.El(J[0] + l * 4, J[1] + K.rc + 10, 14, 20, K.soft(mdd, 0.22)); });
    var V = K.dipingi({ tronco: [T], braccia: br }, mg, { dentro: p });
    var s = V.svg;
    // l orlo delle maniche e lo scollo a costine
    [-1, 1].forEach(function (lato) {
      var f = K.fineManica(lato, lung), w = (f.w + ea) * 0.5 - 1.5;
      s += K.St("M" + K.n1(f.x - f.dy * w - f.dx * 6) + " " + K.n1(f.y + f.dx * w - f.dy * 6) + "L" + K.n1(f.x + f.dy * w - f.dx * 6) + " " + K.n1(f.y - f.dx * w - f.dy * 6), mdd, 1.4, 0.4);
    });
    var nk = B.nk;
    s += K.St("M" + (C - nk - 5) + " 241C" + (C - nk + 2) + " 263 " + (C + nk - 2) + " 263 " + (C + nk + 5) + " 241", K.mix(mg, "#000000", 0.22), 7, 0.95);
    s += K.St("M" + (C - nk - 3) + " 238C" + (C - nk + 4) + " 259 " + (C + nk - 4) + " 259 " + (C + nk + 3) + " 238", K.chiaro(mg, 0.35), 1.8, 0.45);
    if (lung > 0.9) [-1, 1].forEach(function (lato) { var f = K.fineManica(lato, lung); s += K.Pa(K.limb([[f.x - f.dx * 14, f.y - f.dy * 14, f.w + ea * 0.8], [f.x, f.y, f.w + ea * 0.75]]), K.scuro(mg, 0.15), " opacity='.9'"); });
    // la stampa sulla maglia (solo sul tronco)
    var st = A.stampa[K.c.stampa]; if (st) s += "<g clip-path='" + K.clip(T) + "'>" + st(K, T) + "</g>";
    return { corpo: s };
  }
  A.pezzo("capo", "maglietta", function (K) { return maglia(K, 0.3); });
  A.pezzo("capo", "lunga", function (K) { return maglia(K, 1); });
  A.maglia = maglia;   // per i pezzi che partono da una maglietta
  function jeans(K, classici) {
    var jn = K.pantaloni, jl = K.chiaro(jn, K.m ? 0.2 : 0.26), jd = K.scuro(jn, 0.38), C = K.C, B = K.B;
    var x0 = C - B.hp - 10, x1 = C + B.hp + 10;
    var jg = K.LG("jg", x0, 0, x1, 0, [[0, jl], [0.45, jn], [1, K.mix(jn, jd, 0.7)]], true);
    var Ln = K.gamba(-1, { agio: 7, agioI: 5, da: 548, a: 944, dritto: 760, orlo: 944, orloL: classici ? 30 : 27, segue: true });
    var Rn = K.gamba(1, { agio: 7, agioI: 5, da: 548, a: 944, dritto: 760, orlo: 944, orloL: classici ? 30 : 27, segue: true });
    var wp = K.bacino({ agio: 5 });
    var s = K.Pa(Ln, jg) + K.Pa(Rn, jg) + K.Pa(wp, jg);
    s += "<g clip-path='" + K.clip([Ln, Rn, wp]) + "'>";
    s += "<rect x='198' y='575' width='4' height='130' fill='" + K.LG("cr", 0, 0, 0, 1, [[0, "#000000", 0.45], [1, "#000000", 0]]) + "'/>";
    s += K.El(200, 588, 22, 26, K.soft("#000000", 0.4));
    [-1, 1].forEach(function (l) {
      var g = K.gIn(700), cx = C + l * g[0];
      s += K.El(cx - l * 4 - g[1] * 0.3, 700, 15, 150, K.soft("#ffffff", K.m ? 0.2 : 0.24)) + K.El(cx + g[1] * 0.8, 720, 12, 190, K.soft("#000000", 0.3)) + K.El(cx - g[2] * 0.85, 700, 8, 170, K.soft("#000000", 0.26));
      var k = K.gIn(748), kx = C + l * k[0];
      s += K.St("M" + (kx - 26) + " 742C" + (kx - 12) + " 750 " + (kx + 10) + " 750 " + (kx + 24) + " 740", jd, 3, 0.25) + K.St("M" + (kx - 22) + " 754C" + (kx - 10) + " 760 " + (kx + 10) + " 760 " + (kx + 22) + " 752", jl, 1.5, 0.22);
      if (!classici) s += K.St("M" + (kx - 26) + " 908C" + (kx - 12) + " 916 " + (kx + 10) + " 918 " + (kx + 26) + " 908", jd, 3, 0.28) + K.St("M" + (kx - 24) + " 924C" + (kx - 10) + " 930 " + (kx + 10) + " 930 " + (kx + 24) + " 922", jd, 2.4, 0.3);
      s += K.St("M" + (cx - l * 3) + " 606C" + (cx + 8 * l) + " 612 " + (cx + 22 * l) + " 610 " + (cx + 32 * l) + " 602", jd, 3, 0.2);
    });
    var st = " stroke-dasharray='3.5 3'", scu = classici ? K.scuro(jn, 0.2) : K.mix(jn, "#e8c070", 0.75);
    var wl = C - B.wt - 5, wr = C + B.wt + 5, v = K.m ? 456 : 448;
    if (!classici) {
      s += K.St("M" + (wl + 2) + " " + (v + 4) + "C" + (wl + 8) + " " + (v + 42) + " " + (wl + 24) + " " + (v + 58) + " " + (wl + 46) + " " + (v + 64), scu, 1.1, 0.8, st) + K.St("M" + (wr - 2) + " " + (v + 4) + "C" + (wr - 8) + " " + (v + 42) + " " + (wr - 24) + " " + (v + 58) + " " + (wr - 46) + " " + (v + 64), scu, 1.1, 0.8, st);
      s += K.St("M205 " + (v + 12) + "L205 " + (v + 62) + "C205 " + (v + 68) + " 198 " + (v + 70) + " 193 " + (v + 66), scu, 1.1, 0.8, st);
      [-1, 1].forEach(function (l) { var g = K.gIn(760); s += K.St("M" + K.n1(C + l * (g[0] + g[1] + 2)) + " 620L" + K.n1(C + l * (g[0] + 26)) + " 930", scu, 1, 0.4, st); });
    } else {
      [-1, 1].forEach(function (l) { var g = K.gIn(700); s += K.St("M" + K.n1(C + l * g[0]) + " 590L" + K.n1(C + l * (g[0] + 1)) + " 930", K.chiaro(jn, 0.25), 1.6, 0.35) + K.St("M" + K.n1(C + l * (g[0] + 2)) + " 590L" + K.n1(C + l * (g[0] + 3)) + " 930", jd, 1.4, 0.3); });
      s += K.St("M" + (wl + 6) + " " + (v + 12) + "C" + (wl + 14) + " " + (v + 40) + " " + (wl + 18) + " " + (v + 50) + " " + (wl + 22) + " " + (v + 60), jd, 1.4, 0.45) + K.St("M" + (wr - 6) + " " + (v + 12) + "C" + (wr - 14) + " " + (v + 40) + " " + (wr - 18) + " " + (v + 50) + " " + (wr - 22) + " " + (v + 60), jd, 1.4, 0.45);
    }
    s += K.Pa("M" + wl + " " + v + "L" + wr + " " + v + "L" + (wr + 1) + " " + (v + 16) + "L" + (wl - 1) + " " + (v + 16) + "Z", K.mix(jn, "#000000", 0.18), " opacity='.55'");
    s += K.St("M" + wl + " " + (v + 16) + "L" + wr + " " + (v + 16), scu, 1, 0.7, classici ? "" : st);
    [wl + 14, wr - 14, C - 16, C + 16].forEach(function (b) { s += "<rect x='" + (b - 3) + "' y='" + v + "' width='6' height='20' rx='1.5' fill='" + K.mix(jn, "#000000", 0.2) + "' opacity='.55'/>"; });
    s += "</g>";
    if (!classici) s += "<circle cx='200' cy='" + (v + 13) + "' r='4.4' fill='#c9ccd2' stroke='#6e7078' stroke-width='1'/><circle cx='199' cy='" + (v + 12) + "' r='1.5' fill='#ffffff' opacity='.8'/>";
    else s += K.Pa("M196 " + (v + 4) + "h8v14h-8z", K.mix(jn, "#000", 0.3), " opacity='.6'");
    return s;
  }
  A.pezzo("sotto", "jeans", function (K) { return jeans(K, false); });
  A.pezzo("sotto", "pantaloni", function (K) { return jeans(K, true); });
  A.pantaloni = jeans;
  A.pezzo("scarpe", "sneakers", function (K) {
    var sc = K.scarpe, s = "";
    var sl = K.LG("shoe", 0, 0, 1, 1, [[0, K.chiaro(sc, 0.5)], [0.5, sc], [1, K.scuro(sc, 0.25)]]);
    var so = K.LG("sole", 0, 0, 0, 1, [[0, "#f6f6f2"], [0.6, "#dcdcd8"], [1, "#a4a4a1"]]);
    var sd = "M140 926L190 926C193 944 196 954 204 962C210 970 209 984 200 988L150 990C130 990 116 986 114 976C113 966 124 960 136 958C142 954 142 940 140 926Z";
    var cs = K.clip(sd);
    var lacci = K.lum(sc) > 0.7 ? "#8c8c8a" : "#ffffff";
    var one = K.Pa(sd, sl) + "<g clip-path='" + cs + "'>" + K.El(196, 960, 16, 34, K.soft("#000000", 0.22)) + K.El(130, 972, 16, 10, K.soft("#ffffff", 0.5)) + "</g>" +
      K.Pa("M142 927C150 935 182 935 190 927C190 931 184 937 166 937C148 937 142 931 142 927Z", K.scuro(sc, 0.4), " opacity='.55'") +
      K.St("M118 980C120 970 132 964 144 966C150 968 152 976 150 989", K.scuro(sc, 0.25), 1.3, 0.75) +
      K.St("M147 941L174 948M145 948L178 955M145 955L181 962", lacci, 1.6, 0.9) +
      K.St("M190 944C198 951 203 960 205 972", K.scuro(sc, 0.3), 3, 0.45) +
      K.Pa("M114 978C112 991 124 999 146 999L200 999C212 999 214 988 208 979C206 985 202 989 196 989L148 991C130 991 118 987 114 978Z", so);
    return A.duePiedi(K, one);
  });
  // ---- le stampe sulla maglia (dentro il ritaglio del busto: si piegano coi volumi della maglia) ----
  function inchiostro(K) { return K.lum(K.maglia) > 0.6 ? K.scuro(K.maglia, 0.55) : K.chiaro(K.maglia, 0.8); }
  A.pezzo("stampa", "righe", function (K) { var s = "", col = inchiostro(K); for (var y = 262; y < 560; y += 26) s += "<rect x='60' y='" + y + "' width='280' height='11' fill='" + col + "' opacity='.75'/>"; return s; });
  A.pezzo("stampa", "pois", function (K) { var s = "", col = inchiostro(K); for (var y = 270, r = 0; y < 560; y += 24, r++) for (var x = 70 + (r % 2) * 12; x < 340; x += 24) s += "<circle cx='" + x + "' cy='" + y + "' r='4.6' fill='" + col + "' opacity='.8'/>"; return s; });
  A.pezzo("stampa", "quadri", function (K) { var s = "", col = inchiostro(K); for (var y = 250; y < 560; y += 30) s += "<rect x='60' y='" + y + "' width='280' height='12' fill='" + col + "' opacity='.35'/>"; for (var x = 64; x < 340; x += 30) s += "<rect x='" + x + "' y='240' width='12' height='330' fill='" + col + "' opacity='.35'/>"; return s; });
  function alPetto(K, d, col) { return "<g transform='translate(" + K.C + " " + (K.Y.petto + 14) + ") scale(1.55)'>" + K.Pa(d, col, " opacity='.92'") + "</g>"; }
  A.pezzo("stampa", "stella", function (K) { return alPetto(K, "M0 -26L7.6 -9.5 25.6 -8.3 11.8 3.6 16 21.2 0 11.6 -16 21.2 -11.8 3.6 -25.6 -8.3 -7.6 -9.5Z", inchiostro(K)); });
  A.pezzo("stampa", "cuore", function (K) { return alPetto(K, "M0 20C-6 14 -26 2 -26 -10C-26 -20 -18 -26 -10 -26C-5 -26 -2 -23 0 -19C2 -23 5 -26 10 -26C18 -26 26 -20 26 -10C26 2 6 14 0 20Z", K.lum(K.maglia) > 0.6 ? "#e03158" : inchiostro(K)); });
  A.pezzo("stampa", "fulmine", function (K) { return alPetto(K, "M6 -28L-14 4H-1L-8 28L16 -6H3L12 -28Z", K.lum(K.maglia) > 0.6 ? "#f5b80f" : inchiostro(K)); });
  A.pezzo("stampa", "numero", function (K) { return "<text x='" + K.C + "' y='" + (K.Y.petto + 30) + "' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='58' fill='" + inchiostro(K) + "' opacity='.92'>10</text>"; });
  // due scarpe disegnate di lato (tacco a sinistra x 114, caviglia x 140-190, punta a destra x 210, suola a y 999):
  // messe sotto le caviglie con la punta un po' in fuori e accorciate (si vedono di tre quarti)
  A.duePiedi = function (K, one) {
    var gl = K.gIn(938), s = "";
    [-1, 1].forEach(function (l) { s += "<g transform='translate(" + K.n1(K.C + l * (gl[0] + 3)) + " 935) rotate(" + (l * 8) + ") scale(" + (l * 0.6) + " 1.04) translate(-163 -935)'>" + one + "</g>"; });
    return s;
  };
  // ---- il cappellino (dalla prova A) ----
  A.pezzo("cappelli", "cappellino", function (K) {
    var capC = K.acc, cl = K.mix(capC, "#ffffff", 0.3), cd = K.mix(capC, "#000000", 0.45);
    var cp = K.LG("cp", 0.05, 0, 0.95, 1, [[0, cl], [0.38, capC], [1, cd]]), cb = K.LG("cb", 0, 0, 0, 1, [[0, cl], [0.55, capC], [1, K.mix(capC, "#000000", 0.22)]]);
    var s = "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(0, -92, 50, 12, K.soft("#000000", 0.5)) + "</g><g transform='translate(0 -16)'>";
    var dome = "M-58 -104C-60 -134 -42 -160 0 -162C42 -160 60 -134 58 -104C38 -98 -38 -98 -58 -104Z";
    s += K.Pa(dome, cp) + "<g clip-path='" + K.clip(dome) + "'>";
    s += K.St("M0 -162L0 -96", cd, 1.5, 0.5) + K.St("M-2 -167C-20 -152 -32 -128 -34 -98", cd, 1.4, 0.5) + K.St("M2 -167C20 -152 32 -128 34 -98", cd, 1.4, 0.5);
    s += K.St("M-26 -148C-34 -156 -28 -162 -12 -164", "#ffffff", 6, 0.25) + K.El(32, -132, 22, 46, K.soft("#000000", 0.35)) + "</g>";
    s += "<circle cx='0' cy='-162' r='4.4' fill='" + cp + "'/>" + K.St("M-56 -101C-36 -95 36 -95 56 -101", cl, 0.9, 0.55, " stroke-dasharray='2.4 2.4'");
    var brim = "M-58 -104C-36 -97 36 -97 58 -104C70 -100 72 -88 54 -84C26 -74 -26 -74 -54 -84C-72 -88 -70 -100 -58 -104Z";
    s += K.Pa(brim, cb) + "<g clip-path='" + K.clip(brim) + "'>" + K.El(36, -90, 40, 10, K.soft("#000000", 0.35)) + K.Pa("M-54 -84C-26 -74 26 -74 54 -84C54 -81 26 -69 0 -69C-26 -69 -54 -81 -54 -84Z", cd, " opacity='.8'") + "</g>";
    s += K.St("M-52 -88C-26 -80 26 -80 52 -88", cl, 0.9, 0.6, " stroke-dasharray='2.4 2.4'");
    return { linea: -112, svg: s + "</g>" };
  });
})();

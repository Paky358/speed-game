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
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGOminoA = { capelli: {}, cappelli: {}, capo: {}, sotto: {}, scarpe: {}, bocca: {}, barba: {}, segno: {}, stampa: {}, extra: {},
    occhiali: {}, orecchini: {}, collo: {}, borsa: {}, mano: {}, schiena: {}, animale: {}, pittura: {} };
  A.pezzo = function (tipo, nome, fn) { (A[tipo] = A[tipo] || {})[nome] = fn; };

  // ---------- aiuti ----------
  function h2r(h) { h = String(h).replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)]; }
  function r2h(r) { return "#" + r.map(function (v) { return ("0" + Math.max(0, Math.min(255, Math.round(v))).toString(16)).slice(-2); }).join(""); }
  function mix(a, b, t) { var X = h2r(a), Y = h2r(b); return r2h(X.map(function (v, i) { return v + (Y[i] - v) * t; })); }
  function lum(h) { var c = h2r(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255; }
  function rnd(s) { return function () { s |= 0; s = s + 0x6D2B79F5 | 0; var t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function n1(v) { return Math.round(v * 10) / 10; }
  // curva liscia che passa per i punti (Catmull-Rom → Bézier)
  function cr(p) { var s = ""; for (var i = 0; i < p.length - 1; i++) { var a = p[i - 1] || p[i], b = p[i], c = p[i + 1], d = p[i + 2] || c; s += "C" + n1(b[0] + (c[0] - a[0]) / 6) + " " + n1(b[1] + (c[1] - a[1]) / 6) + " " + n1(c[0] - (d[0] - b[0]) / 6) + " " + n1(c[1] - (d[1] - b[1]) / 6) + " " + n1(c[0]) + " " + n1(c[1]); } return s; }
  // forma rastremata lungo una linea: n = [[x, y, larghezza], …]; bulge = punta arrotondata
  function limb(n, bulge) {
    var L = [], R = [];
    for (var i = 0; i < n.length; i++) {
      var a = n[Math.max(0, i - 1)], b = n[Math.min(n.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l, w = n[i][2] / 2;
      L.push([n[i][0] + nx * w, n[i][1] + ny * w]); R.push([n[i][0] - nx * w, n[i][1] - ny * w]);
    }
    var Rr = R.slice().reverse(), e = L.length - 1;
    var fine = bulge ? "Q" + n1((L[e][0] + Rr[0][0]) / 2 + (n[e][0] - n[e - 1][0]) * bulge) + " " + n1((L[e][1] + Rr[0][1]) / 2 + (n[e][1] - n[e - 1][1]) * bulge) + " " : "L";
    return "M" + n1(L[0][0]) + " " + n1(L[0][1]) + cr(L) + fine + n1(Rr[0][0]) + " " + n1(Rr[0][1]) + cr(Rr) + "Z";
  }
  function poli(p) { return "M" + p.map(function (q) { return n1(q[0]) + " " + n1(q[1]); }).join("L") + "Z"; }
  function liscio(p) { return "M" + n1(p[0][0]) + " " + n1(p[0][1]) + cr(p); }   // linea liscia aperta
  function lisciaChiusa(p) { var q = p.concat([p[0]]); return "M" + n1(p[0][0]) + " " + n1(p[0][1]) + cr(q) + "Z"; }
  var DEG = Math.PI / 180;

  // ---------- le tabelle (stesse voci dell'editor di sempre) ----------
  // corporature (mezze larghezze, mondo 400×1000): collo, attaccatura delle spalle, spalla, ascella, petto, vita, fianchi; braccio [spalla, gomito, avambraccio, polso]; lw = gambe
  var BUILD = {
    uomo: { snello: { nk: 26, shx: 72, sho: 94, ap: 76, ch: 72, wt: 63, hp: 68, aw: [40, 33, 35, 27], lw: 0.86 },
            medio: { nk: 29, shx: 80, sho: 104, ap: 84, ch: 82, wt: 73, hp: 77, aw: [46, 38, 40, 30], lw: 1 },
            robusto: { nk: 34, shx: 90, sho: 118, ap: 98, ch: 98, wt: 102, hp: 94, aw: [54, 45, 46, 35], lw: 1.2, pancia: 1 } },
    donna: { snello: { nk: 19, shx: 58, sho: 80, ap: 64, ch: 64, wt: 49, hp: 73, aw: [32, 26, 28, 22], lw: 0.88, seno: 0.8 },
             medio: { nk: 21, shx: 64, sho: 88, ap: 70, ch: 72, wt: 55, hp: 83, aw: [36, 30, 31, 25], lw: 1, seno: 1 },
             robusto: { nk: 25, shx: 74, sho: 100, ap: 84, ch: 88, wt: 75, hp: 101, aw: [44, 37, 38, 30], lw: 1.22, seno: 1.3, pancia: 0.5 } }
  };
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
    occhiali: "occhiali", orecchini: "orecchini", collo: "collo", borsa: "borsa", mano: "mano", schiena: "schiena", animale: "animale", pittura: "pittura" };
  A.disegnato = function (voce, v) {
    var t = VOCE_TIPO[voce]; if (!t) return true;
    if (v === "nessuno" || v === "nessuna" || v === "no") return true;
    if (voce === "capelli" && v === "calvo") return !!A.capelli.calvo;
    return !!(A[t] && A[t][v]);
  };
  // pose che il disegno nuovo sa fare (le altre: disegno di prima)
  A.puo = function (opts) { opts = opts || {}; return !opts.spalle && !opts.seduto; };

  var cnt = 0, PREF = "oa" + Math.random().toString(36).slice(2, 6);

  // =========================================================
  //  IL DISEGNO
  // =========================================================
  A.svg = function (c, opts, OPZ) {
    opts = opts || {};
    var m = c.forma !== "donna";
    var p = PREF + (cnt++) + "_";
    var D = [];   // definizioni (gradienti, ritagli)
    function col(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }
    function stops(st) { return st.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join(""); }
    function LG(id, x1, y1, x2, y2, st, us) { D.push("<linearGradient id='" + p + id + "' x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "'" + (us ? " gradientUnits='userSpaceOnUse'" : "") + ">" + stops(st) + "</linearGradient>"); return "url(#" + p + id + ")"; }
    function RG(id, st, extra) { D.push("<radialGradient id='" + p + id + "' " + (extra || "") + ">" + stops(st) + "</radialGradient>"); return "url(#" + p + id + ")"; }
    var nSoft = 0;
    function soft(col, op) { return RG("s" + (nSoft++), [[0, col, op], [1, col, 0]]); }
    function U(id) { return "url(#" + p + id + ")"; }
    function Pa(d, f, x) { return "<path d='" + d + "' fill='" + f + "'" + (x || "") + "/>"; }
    function St(d, c2, w, op, x) { return "<path d='" + d + "' fill='none' stroke='" + c2 + "' stroke-width='" + w + "' stroke-linecap='round' stroke-linejoin='round'" + (op != null ? " opacity='" + op + "'" : "") + (x || "") + "/>"; }
    function El(cx, cy, rx, ry, f, x) { return "<ellipse cx='" + n1(cx) + "' cy='" + n1(cy) + "' rx='" + n1(rx) + "' ry='" + n1(ry) + "' fill='" + f + "'" + (x || "") + "/>"; }
    var nClip = 0;
    function clip(d) { var id = "c" + (nClip++); D.push("<clipPath id='" + p + id + "'>" + (Array.isArray(d) ? d : [d]).map(function (x) { return "<path d='" + x + "'/>"; }).join("") + "</clipPath>"); return "url(#" + p + id + ")"; }
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
      return "M" + n1(out[0][0]) + " " + n1(out[0][1]) + cr(out) + "Q" + n1((ol[0] + ir[0]) / 2) + " " + n1((ol[1] + ir[1]) / 2 + cv) + " " + n1(ir[0]) + " " + n1(ir[1]) + cr(inn) + "Z";
    }
    // il bacino (la parte dei pantaloni o della gonna dalla vita al cavallo)
    function bacino(o) {
      o = o || {}; var e = o.agio || 4, v = o.vita || (m ? 456 : 448), wv = Math.max(B.wt, m ? B.wt : B.wt) + e, wh = B.hp + e, yc = o.cavallo || 600;
      var gl = gIn(560);
      return "M" + n1(C - wv) + " " + v + "L" + n1(C + wv) + " " + v + "C" + n1(C + wv + 4) + " " + (v + 30) + " " + n1(C + wh + 2) + " " + (Y.fianchi - 30) + " " + n1(C + wh) + " " + Y.fianchi +
        "L" + n1(C + gl[0] + gl[1] + e) + " 566L" + n1(C + 4) + " " + yc + "L" + n1(C - 4) + " " + yc + "L" + n1(C - gl[0] - gl[1] - e) + " 566L" + n1(C - wh) + " " + Y.fianchi +
        "C" + n1(C - wh - 2) + " " + (Y.fianchi - 30) + " " + n1(C - wv - 4) + " " + (v + 30) + " " + n1(C - wv) + " " + v + "Z";
    }
    // il busto di un vestito (dal collo all'orlo): agio, orlo, scollo {tipo, prof, larg}, smanicato, svasa (orlo più largo)
    function busto(o) {
      o = o || {};
      var e = o.agio != null ? o.agio : 5, orlo = o.orlo || 508, sc2 = o.scollo || {}, prof = sc2.prof != null ? sc2.prof : 16, larg = sc2.larg != null ? sc2.larg : 3;
      var nl = B.nk + larg, ny = 240, sv = o.svasa || 0;
      var lato = function (s) {
        var pts = [];
        if (o.smanicato) {
          var sp = o.spallina != null ? o.spallina : 14;
          pts.push([C + s * (nl + sp), ny + 2], [C + s * (B.ap - 6), Y.ascella - 20], [C + s * (B.ap + e - 2), Y.ascella + 8]);
        } else pts.push([C + s * (B.shx + e * 0.6), Y.spalla], [C + s * (B.sho - 4 + e), Y.delt], [C + s * (B.ap + e), Y.ascella]);
        pts.push([C + s * (B.ch + e), Y.petto], [C + s * (B.wt + e * 1.1 + (o.pancia || 0)), Y.vita]);
        if (orlo > Y.vita + 30) pts.push([C + s * (Math.max(B.wt, B.hp) + e + sv * 0.4), Math.min(orlo - 8, Y.fianchi)]);
        if (orlo > Y.fianchi + 40) pts.push([C + s * (B.hp + e + sv * 0.8 + (orlo - Y.fianchi) * 0.06), (orlo + Y.fianchi) / 2]);
        pts.push([C + s * (Math.max(B.wt, B.hp * (orlo > Y.vita + 20 ? 1 : 0.9)) + e + sv + (orlo > 700 ? (orlo - Y.fianchi) * 0.1 : 0)), orlo]);
        return pts;
      };
      var R = lato(1), L = lato(-1).reverse();
      var neckR = o.smanicato ? [C + nl, ny] : [C + nl, ny];
      var sc3 = sc2.tipo === "v" ? "L" + C + " " + (ny + prof) + "L" + n1(neckR[0]) + " " + ny
        : (sc2.tipo === "quadro" ? "L" + n1(C - nl + 4) + " " + (ny + prof) + "L" + n1(C + nl - 4) + " " + (ny + prof) + "L" + n1(neckR[0]) + " " + ny
        : "C" + n1(C - nl + 2) + " " + n1(ny + prof * 0.9) + " " + n1(C - nl * 0.45) + " " + (ny + prof) + " " + C + " " + (ny + prof) + "C" + n1(C + nl * 0.45) + " " + (ny + prof) + " " + n1(C + nl - 2) + " " + n1(ny + prof * 0.9) + " " + n1(neckR[0]) + " " + ny);
      var orloD = "Q" + C + " " + (orlo + (o.curvaOrlo != null ? o.curvaOrlo : 6)) + " " + n1(L[0][0]) + " " + n1(L[0][1]);
      return "M" + n1(C - nl) + " " + ny + sc3 + "C" + n1(C + nl + 10) + " " + (ny + 2) + " " + n1(R[0][0] - 8) + " " + n1(R[0][1] - 4) + " " + n1(R[0][0]) + " " + n1(R[0][1]) + cr(R) +
        orloD + cr(L) + "C" + n1(L[L.length - 1][0] + 8) + " " + n1(L[L.length - 1][1] - 4) + " " + n1(C - nl - 10) + " " + (ny + 2) + " " + n1(C - nl) + " " + ny + "Z";
    }

    // braccia: spalla (giunto), gomito, polso con gli angoli (da giù, positivi verso fuori)
    var kb = m ? 1 : 0.94, L1 = 142 * kb, L2 = 126 * kb;
    function braccio(lato) {
      var J = [C + lato * (B.sho - B.aw[0] * 0.55), Y.delt - 4], a1, a2, br = opts.braccia;
      var su = br === "su" || (br === "uno" && lato === -1), canna = br === "canna" && lato === 1;
      if (su) { a1 = 128; a2 = 152; }
      else if (canna) { var ang = Math.max(-30, Math.min(175, +opts.angolo || 0)); a1 = Math.max(6, ang); a2 = Math.max(6, ang); }
      else {
        a1 = Math.asin(Math.max(0.05, Math.min(0.5, (B.wt + B.aw[1] / 2 + 3 - (J[0] - C) * lato) / L1))) / DEG;
        var Ex = (J[0] - C) * lato + L1 * Math.sin(a1 * DEG);
        a2 = Math.asin(Math.max(0.03, Math.min(0.5, (B.hp + B.aw[3] / 2 + 5 - Ex) / L2))) / DEG;
      }
      var E = [J[0] + lato * L1 * Math.sin(a1 * DEG), J[1] + L1 * Math.cos(a1 * DEG)], W = [E[0] + lato * L2 * Math.sin(a2 * DEG), E[1] + L2 * Math.cos(a2 * DEG)];
      function at(P, Q, t) { return [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t]; }
      var d1 = [(E[0] - J[0]) / L1, (E[1] - J[1]) / L1], aw = B.aw;
      var S0 = [J[0] - d1[0] * 16, J[1] - d1[1] * 16];
      var nodi = [[S0[0], S0[1], aw[0] * 0.86], [J[0], J[1], aw[0]], at(J, E, 0.14).concat([aw[0] * 1.0]), at(J, E, 0.5).concat([aw[0] * 0.9]), [E[0], E[1], aw[1]], at(E, W, 0.22).concat([aw[2]]), at(E, W, 0.6).concat([aw[2] * 0.86]), [W[0], W[1], aw[3]]];
      return { lato: lato, J: J, E: E, W: W, a1: a1, a2: a2, su: su, canna: canna, nodi: nodi };
    }
    var BR = { "-1": braccio(-1), "1": braccio(1) };
    // una manica: fino alla frazione lung del braccio (0.25 corta, 1 al polso), agio, svasa
    function manica(lato, o) {
      o = o || {}; var b = BR[lato], e = o.agio != null ? o.agio : 8, lung = o.lung != null ? o.lung : 1;
      var N = b.nodi, tot = [], acc = [0];
      for (var i = 1; i < N.length; i++) acc.push(acc[i - 1] + Math.hypot(N[i][0] - N[i - 1][0], N[i][1] - N[i - 1][1]));
      var fine = acc[acc.length - 1] * (0.06 + 0.94 * lung);
      for (i = 0; i < N.length; i++) {
        if (acc[i] <= fine) tot.push([N[i][0], N[i][1], N[i][2] + e * (i < 3 ? 1.25 : 1)]);
        else { var a = N[i - 1], z = N[i], t = (fine - acc[i - 1]) / (acc[i] - acc[i - 1]); tot.push([a[0] + (z[0] - a[0]) * t, a[1] + (z[1] - a[1]) * t, (a[2] + (z[2] - a[2]) * t) + e + (o.svasa || 0)]); break; }
      }
      if (tot.length < 2) tot.push([N[1][0], N[1][1], N[1][2] + e]);
      tot[0][2] += e * 0.6;
      return limb(tot, o.tonda ? 0.12 : 0);
    }
    // dove finisce la manica (per polsini, risvolti): punto e direzione
    function fineManica(lato, lung) {
      var b = BR[lato], N = b.nodi, acc = [0];
      for (var i = 1; i < N.length; i++) acc.push(acc[i - 1] + Math.hypot(N[i][0] - N[i - 1][0], N[i][1] - N[i - 1][1]));
      var fine = acc[acc.length - 1] * (0.06 + 0.94 * lung);
      for (i = 1; i < N.length; i++) if (acc[i] >= fine) { var a = N[i - 1], z = N[i], t = (fine - acc[i - 1]) / (acc[i] - acc[i - 1]), l = Math.hypot(z[0] - a[0], z[1] - a[1]) || 1; return { x: a[0] + (z[0] - a[0]) * t, y: a[1] + (z[1] - a[1]) * t, dx: (z[0] - a[0]) / l, dy: (z[1] - a[1]) / l, w: a[2] + (z[2] - a[2]) * t }; }
      var u = N[N.length - 1]; return { x: u[0], y: u[1], dx: 0, dy: 1, w: u[2] };
    }

    // ---------- il contesto per i pezzi ----------
    var K = {
      m: m, donna: !m, c: c, opts: opts, C: C, Y: Y, B: B, HT: HT, F: F, faceD: faceD, top: top, GN: GN, BR: BR,
      pelle: sk, skL: skL, skD: skD, skDD: skDD, capelli: hc, hL: hL, hD: hD, hDD: hDD, iride: iris, maglia: mg, pantaloni: pt, scarpe: sc, acc: ac, collo: cc, labbro: labbro, rossetto: rossetto,
      mix: mix, lum: lum, rnd: rnd, n1: n1, cr: cr, limb: limb, poli: poli, liscio: liscio, lisciaChiusa: lisciaChiusa,
      LG: LG, RG: RG, soft: soft, U: U, Pa: Pa, St: St, El: El, clip: clip, cil: cil, D: D, id: p,
      gamba: gamba, gIn: gIn, bacino: bacino, busto: busto, manica: manica, fineManica: fineManica,
      scuro: function (c2, t) { return mix(c2, "#14080c", t == null ? 0.35 : t); }, chiaro: function (c2, t) { return mix(c2, "#ffffff", t == null ? 0.3 : t); }
    };
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
      for (var i = 0; i < (densita || 360); i++) { var x = (R() * 2 - 1) * 64, y = top - 10 + R() * 120; s += "M" + n1(x) + " " + n1(y) + "h.3"; }
      return "<g clip-path='" + clip(d) + "'>" + Pa(d, hc, " opacity='" + (op || 0.55) + "'") + "<path d='" + s + "' stroke='" + hDD + "' stroke-width='1.6' stroke-linecap='round' opacity='.35' fill='none'/></g>";
    };

    // ---------- pelle: collo, busto, braccia, mani, gambe ----------
    function pelleCorpo() {
      var s = "", nk = B.nk;
      // collo
      var neck = "M" + (C - nk + 2) + " 186L" + (C + nk - 2) + " 186L" + (C + nk + 3) + " " + (Y.collo + 4) + "L" + (C - nk - 3) + " " + (Y.collo + 4) + "Z";
      s += Pa(neck, cil(sk, 0.8));
      s += Pa("M" + (C - nk + 2) + " 190L" + (C + nk - 2) + " 190L" + (C + nk) + " 236L" + (C - nk) + " 236Z", LG("nsh", 0, 0, 0, 1, [[0, skDD, 0.7], [1, skDD, 0]]));
      // busto nudo (si vede negli scolli e dove non c'è maglia)
      var t = function (s2) { return [[C + s2 * nk, Y.collo - 8], [C + s2 * (nk + (B.shx - nk) * 0.55), Y.collo + 6], [C + s2 * (B.shx + 2), Y.spalla + 2], [C + s2 * (B.sho - 9), Y.delt - 12], [C + s2 * (B.sho - 4), Y.delt + 8], [C + s2 * B.ap, Y.ascella], [C + s2 * B.ch, Y.petto], [C + s2 * B.wt, Y.vita], [C + s2 * B.hp, Y.fianchi], [C + s2 * B.hp, Y.cavallo]]; };
      var R = t(1), L = t(-1).reverse();
      var tor = "M" + n1(L[L.length - 1][0]) + " " + n1(L[L.length - 1][1]) + "L" + n1(R[0][0]) + " " + n1(R[0][1]) + cr(R) + "L" + n1(L[0][0]) + " " + n1(L[0][1]) + cr(L) + "Z";
      s += Pa(tor, cil(sk, 0.7));
      var ct = clip(tor);
      s += "<g clip-path='" + ct + "'>" + El(C, Y.collo + 4, nk * 1.6, 12, soft(skDD, 0.45));
      if (m) s += St("M" + (C - B.ch + 14) + " " + (Y.petto + 6) + "C" + (C - 40) + " " + (Y.petto + 18) + " " + (C - 14) + " " + (Y.petto + 14) + " " + (C - 2) + " " + (Y.petto - 2), skD, 3, 0.35) + St("M" + (C + B.ch - 14) + " " + (Y.petto + 6) + "C" + (C + 40) + " " + (Y.petto + 18) + " " + (C + 14) + " " + (Y.petto + 14) + " " + (C + 2) + " " + (Y.petto - 2), skD, 3, 0.4) +
        El(C - 32, Y.petto - 18, 26, 16, soft("#ffffff", 0.14)) + St("M" + C + " " + (Y.petto + 30) + "L" + C + " " + (Y.vita - 10), skD, 2, 0.2) + El(C, Y.vita + 4, 4, 3, skDD, " opacity='.35'");
      else { var bs = B.seno || 1; s += El(C - 30 * bs, Y.petto + 8, 24 * bs, 22 * bs, soft("#ffffff", 0.12)) + St("M" + (C - B.ch + 10) + " " + (Y.petto + 18 * bs) + "C" + (C - 40) + " " + (Y.petto + 30 * bs) + " " + (C - 14) + " " + (Y.petto + 30 * bs) + " " + (C - 4) + " " + (Y.petto + 12), skD, 3, 0.3) + St("M" + (C + B.ch - 10) + " " + (Y.petto + 18 * bs) + "C" + (C + 40) + " " + (Y.petto + 30 * bs) + " " + (C + 14) + " " + (Y.petto + 30 * bs) + " " + (C + 4) + " " + (Y.petto + 12), skD, 3, 0.35) + St("M" + C + " " + (Y.petto - 10) + "L" + C + " " + (Y.petto + 8), skD, 2.2, 0.3) + El(C, Y.vita + 10, 3.4, 2.6, skDD, " opacity='.35'"); }
      s += "</g>";
      return s;
    }
    function bracciaPelle(lato) {
      var b = BR[lato];
      var aw = B.aw[0];
      return "<path d='" + limb(b.nodi, 0.1) + "' fill='" + cil(sk, 0.85) + "'/>" + El(b.J[0] + lato * 2, b.J[1] - 2, aw * 0.56, aw * 0.66, cil(sk, 0.8)) +
        St(liscio([b.E.map(function (v, i) { return v + (i ? -6 : lato * 4); }), [b.E[0] + lato * 9, b.E[1] + 4]]), skD, 1.6, 0.35);
    }
    function manoSvg(lato) {
      var b = BR[lato], k = (m ? 1.18 : 1.02) * (B.aw[3] / (m ? 30 : 25)) * (m ? 1 : 1);
      var rot = -lato * b.a2, mir = -lato;
      if (b.canna) {   // pugno chiuso
        return "<g transform='translate(" + n1(b.W[0]) + " " + n1(b.W[1]) + ") rotate(" + n1(rot) + ") scale(" + n1(mir * k) + " " + n1(k) + ")'>" +
          Pa("M-13 -2C-15 10 -14 24 -10 32C-4 38 8 38 13 32C16 24 15 10 13 -2Z", cil(sk, 0.8)) + St("M-10 14C-4 17 4 17 10 14M-10 22C-4 25 4 25 10 22", skDD, 1, 0.45) + Pa("M10 4C17 8 20 18 16 26C13 27 11 24 11 20Z", cil(sk, 0.8)) + "</g>";
      }
      var h = "M-12 0C-15 14 -15 28 -14 34L-14 50C-14 56 -8 56 -7.5 50L-7 56C-7 62 -1 62 -.5 56L0 60C0 66 6 66 7 60L7 54C7 60 13 60 14 53L14 34C15 24 14 12 12 0Z";
      return "<g transform='translate(" + n1(b.W[0] - lato * Math.sin(b.a2 * DEG) * 5) + " " + n1(b.W[1] - Math.cos(b.a2 * DEG) * 5) + ") rotate(" + n1(rot) + ") scale(" + n1(mir * k) + " " + n1(k) + ")'>" +
        Pa("M11 6C18 12 23 26 21 38C20 42 16 42 15 38C14 30 12 22 9 14Z", cil(sk, 0.7)) + Pa(h, cil(sk, 0.75)) +
        St("M-7 38L-7.2 50", skDD, 0.8, 0.5) + St("M0 40L-.3 56", skDD, 0.8, 0.5) + St("M7 38L7.2 52", skDD, 0.8, 0.5) +
        St("M-6 30C-2 33 4 33 8 30", skDD, 0.8, 0.3) + St("M-12 4C-11 14 -12 24 -12 32", "#ffffff", 1.4, 0.22) + "</g>";
    }
    function gambePelle(lato) {
      var d = gamba(lato, { da: 540, a: 948, curvaOrlo: 2 });
      var g = gIn(748), kx = C + lato * g[0], s = Pa(d, cil(sk, 0.85));
      s += "<g clip-path='" + clip(d) + "'>" + El(kx - 4, 742, 15, 13, soft("#ffffff", 0.2)) + St("M" + (kx - 12) + " 764C" + (kx - 4) + " 770 " + (kx + 6) + " 770 " + (kx + 12) + " 762", skD, 2, 0.3) +
        El(kx + lato * 18, 800, 10, 40, soft(skDD, 0.25)) + El(kx, 600, 30, 46, soft(skDD, 0.1)) + "</g>";
      return s;
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
      s += occhio(-1) + occhio(1, occh ? "felice" : null) + sopracciglio(-1) + sopracciglio(1);
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
    var pBarba = m && c.barba && c.barba !== "no" ? pezzoDi("barba", c.barba) : null, barba = pBarba ? (pBarba.fn(K) || {}) : null;
    if (typeof barba === "string") barba = { dentro: barba };
    var pCapo = pezzoDi("capo", c.capo), capo = pCapo ? (pCapo.fn(K) || {}) : {};
    if (typeof capo === "string") capo = { corpo: capo };
    var intero = /^(vestito|vestitolungo)$/.test(c.capo) && !/^(leggings|jeans|pantaloni|strappati|zampa|tuta|cargo|mimetici)$/.test(c.sotto);   // l'abito copre gonne e pantaloncini
    var soloSu = !!(opts.busto || opts.viso);   // primo piano: gambe, pantaloni e scarpe non si vedono (non si disegnano: l'avatar pesa meno)
    var pSotto = intero || soloSu ? null : pezzoDi("sotto", c.sotto), sotto = pSotto ? pSotto.fn(K) : "";
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
    var body = "";
    var piedi = opts.busto || opts.viso ? "" : El(200, 996, 120, 13, soft("#000000", 0.38));
    body += piedi;
    if (capo.dietro) body += capo.dietro;
    body += "<g transform='" + HT + "'>" + sottoCappello(cap.dietro) + (capp && capp.dietro ? capp.dietro : "") + "</g>";
    var cam = opts.cammina && !opts.busto;
    body += pelleCorpo();
    if (!soloSu) body += gambePelle(-1) + gambePelle(1);
    if (!alte) body += "<g class='om-scarpe'>" + (scarpe.corpo || "") + "</g>";
    body += sotto.corpo || "";
    if (alte) body += "<g class='om-scarpe'>" + (scarpe.corpo || "") + "</g>";
    if (sotto.sopra) body += sotto.sopra;
    var bS = function (lato) { return "<g class='" + (cam ? (lato === -1 ? "om-b1" : "om-b2") : "") + "'>" + bracciaPelle(lato) + "</g>"; };
    body += bS(-1) + bS(1);
    body += capo.corpo || "";
    body += manoSvg(-1) + manoSvg(1);
    if (capo.sopra) body += capo.sopra;
    // occhiali e orecchini (coordinate della testa): gli orecchini sotto i capelli, gli occhiali sopra i capelli e sotto il cappello
    var pOcc = c.occhiali && c.occhiali !== "nessuno" ? A.occhiali[c.occhiali] : null, pOre = c.orecchini && c.orecchini !== "nessuno" ? A.orecchini[c.orecchini] : null;
    body += "<g transform='" + HT + "'>" + testa(cap.fronte, barba, cap.ombraFronte) + (pOre ? pOre(K) : "") + sottoCappello(cap.fronte) + (pOcc ? pOcc(K) : "") + (capp ? capp.svg || "" : "") + "</g>";
    if (A.extra.dopo) body += A.extra.dopo(K);

    // inquadrature (coordinate del riquadro 200×264)
    var vb = opts.busto ? "74 10.5 52 53.2" : (opts.gambe ? "40 110 120 146" : (opts.viso ? "82 14 36 36" : "0 0 200 264"));
    var px = opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * (opts.busto ? 182 / 178 : 1.32)) + "'" : "";
    var passo = "";
    if (cam) {
      var jx = BR["-1"].J;
      passo = "<style>.om-b1{transform-origin:" + n1(jx[0] * 0.25 + 50) + "px " + n1(jx[1] * 0.25 + 2) + "px;animation:omBr .42s ease-in-out infinite alternate}" +
        ".om-b2{transform-origin:" + n1(400 - jx[0]) * 0.25 + 50 + "px " + n1(jx[1] * 0.25 + 2) + "px;animation:omBr .42s ease-in-out infinite alternate-reverse}@keyframes omBr{from{transform:rotate(-8deg)}to{transform:rotate(8deg)}}</style>";
    }
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='" + vb + "'" + px + " class='omino omino-a'>" + passo + "<defs>" + D.join("") + "</defs><g transform='matrix(.25 0 0 .25 50 2)'>" + body + "</g></svg>";
  };

  // dove sta la mano a destra nel disegno (coordinate 200×264): per la canna il centro del pugno
  A.mano = function (c, opts) {
    opts = opts || {};
    var m = c.forma !== "donna", B = BUILD[m ? "uomo" : "donna"][c.corpo] || BUILD[m ? "uomo" : "donna"].medio, kb = m ? 1 : 0.94, L1 = 142 * kb, L2 = 126 * kb;
    var J = [200 + (B.sho - B.aw[0] * 0.55), 292], a1, a2;
    if (opts.braccia === "canna") { var ang = Math.max(-30, Math.min(175, +opts.angolo || 0)); a1 = a2 = Math.max(6, ang); }
    else if (opts.braccia === "su") { a1 = 128; a2 = 152; }
    else { a1 = Math.asin(Math.max(0.05, Math.min(0.5, (B.wt + B.aw[1] / 2 + 3 - (J[0] - 200)) / L1))) / DEG; var Ex = J[0] - 200 + L1 * Math.sin(a1 * DEG); a2 = Math.asin(Math.max(0.03, Math.min(0.5, (B.hp + B.aw[3] / 2 + 5 - Ex) / L2))) / DEG; }
    var E = [J[0] + L1 * Math.sin(a1 * DEG), J[1] + L1 * Math.cos(a1 * DEG)], W = [E[0] + (L2 + 16) * Math.sin(a2 * DEG), E[1] + (L2 + 16) * Math.cos(a2 * DEG)];
    return { x: +(W[0] * 0.25 + 50).toFixed(2), y: +(W[1] * 0.25 + 2).toFixed(2) };
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
    var mg = K.maglia, md = K.scuro(mg, 0.3), mdd = K.scuro(mg, 0.5), C = K.C, B = K.B, Y = K.Y;
    var T = K.busto({ agio: 6, orlo: 512, scollo: { prof: 18, larg: 4 }, pancia: B.pancia ? 6 : 0 });
    var sL = K.manica(-1, { lung: lung, agio: lung < 0.5 ? 10 : 7 }), sR = K.manica(1, { lung: lung, agio: lung < 0.5 ? 10 : 7 });
    var s = K.Pa(sL, K.cil(mg)) + K.Pa(sR, K.cil(mg)) + K.Pa(T, K.cil(mg, 0.75));
    s += "<g clip-path='" + K.clip(T) + "'>";
    s += K.El(C - 40, Y.petto - 30, 30, 40, K.soft("#ffffff", 0.2)) + K.El(C, 272, 40, 14, K.soft(mdd, 0.35));
    if (K.donna) { var bs = B.seno || 1; s += K.El(C - 24 * bs, Y.petto + 22 * bs, 24 * bs, 9, K.soft(mdd, 0.42)) + K.El(C + 24 * bs, Y.petto + 22 * bs, 24 * bs, 9, K.soft(mdd, 0.48)) + K.El(C - 26 * bs, Y.petto - 2, 18 * bs, 14 * bs, K.soft("#ffffff", 0.18)); }
    if (B.pancia) s += K.St("M" + (C - B.wt + 10) + " " + (Y.vita + 26) + "C" + (C - 30) + " " + (Y.vita + 44) + " " + (C + 30) + " " + (Y.vita + 44) + " " + (C + B.wt - 10) + " " + (Y.vita + 26), mdd, 4, 0.25);
    s += K.St("M" + (C - B.wt + 4) + " 470C" + (C - B.wt + 24) + " 478 " + (C - B.wt + 44) + " 472 " + (C - B.wt + 64) + " 482", mdd, 5, 0.13);
    s += K.St("M" + (C + B.wt - 6) + " 442C" + (C + B.wt - 26) + " 454 " + (C + B.wt - 40) + " 452 " + (C + B.wt - 62) + " 464", mdd, 4, 0.15);
    s += K.St("M" + (C - 24) + " 420C" + (C - 12) + " 440 " + (C - 10) + " 470 " + (C - 18) + " 498", mdd, 4, 0.1);
    s += K.St("M" + (C - B.hp + 2) + " 502C" + (C - 20) + " 510 " + (C + 20) + " 510 " + (C + B.hp - 2) + " 502", mdd, 2, 0.35);
    s += "</g>";
    // pieghe delle maniche e scollo a costine
    [-1, 1].forEach(function (lato) {
      var f = K.fineManica(lato, lung);
      s += K.St("M" + K.n1(f.x - f.dy * f.w * 0.55 - f.dx * 6) + " " + K.n1(f.y + f.dx * f.w * 0.55 - f.dy * 6) + "L" + K.n1(f.x + f.dy * f.w * 0.55 - f.dx * 6) + " " + K.n1(f.y - f.dx * f.w * 0.55 - f.dy * 6), mdd, 1.4, 0.4);
      var J = K.BR[lato].J; s += K.El(J[0] + lato * 6, J[1] + 40, 12, 22, K.soft(mdd, 0.25));
    });
    var nk = B.nk;
    s += K.St("M" + (C - nk - 5) + " 241C" + (C - nk + 2) + " 263 " + (C + nk - 2) + " 263 " + (C + nk + 5) + " 241", K.mix(mg, "#000000", 0.22), 7, 0.95);
    s += K.St("M" + (C - nk - 3) + " 238C" + (C - nk + 4) + " 259 " + (C + nk - 4) + " 259 " + (C + nk + 3) + " 238", K.chiaro(mg, 0.35), 1.8, 0.45);
    if (lung > 0.9) [-1, 1].forEach(function (lato) { var f = K.fineManica(lato, lung); s += K.Pa(K.limb([[f.x - f.dx * 14, f.y - f.dy * 14, f.w + 1], [f.x, f.y, f.w]]), K.scuro(mg, 0.15), " opacity='.9'"); });
    // la stampa sulla maglia
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
    var gl = K.gIn(938), x = K.C - gl[0], k = " scale(.82 1.08)";
    return "<g transform='translate(" + K.n1(x + 2) + " 999)" + k + " scale(-1 1) translate(-165 -999)'>" + one + "</g>" +
      "<g transform='translate(" + K.n1(400 - x - 2) + " 999)" + k + " translate(-165 -999)'>" + one + "</g>";
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

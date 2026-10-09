/* =========================================================
   SPeeD GAME — GLI INTERNI IN PRIMA PERSONA: il Casinò e il Circolo
   - Le scene (il salone del Casinò, l'atrio del Circolo con le porte, la Sala
     delle Carte e la Sala dei Giochi da Tavolo) si guardano in prima persona:
     toccando un tavolo o una porta, core.js (schermataInterno) "cammina" fin lì.
   - Le sale: una per gioco, il primo piano del suo tavolo con la gente che gioca;
     ognuna ha una cosa sua (il quadro, le bandierine, la lavagna, il neon…).
   Ogni disegno è fermo (SVG dentro un'immagine) e si fa una volta sola:
   leggero anche sui telefoni lenti.
   Prospettiva centrale: x = destra/sinistra, y = altezza, z = profondità (in metri).
   ========================================================= */
(function () {
  "use strict";
  var W = 360, H = 640, CX = 180, HY = 205, F = 380, EYE = 2.85;   // telecamera più in alto di una persona, così si vede bene il piano del tavolo
  var ZB = 7, XW = 2.0, YT = 4.1;                                     // parete di fondo, mezza larghezza della sala, soffitto

  // ---- le sale, nell'ordine in cui si scorrono ----
  var SALE = [
    { id: "blackjack", nome: "Black Jack",   insegna: "BLACK JACK",   stile: "bj" },
    { id: "scopa",     nome: "Scopa",        insegna: "SCOPA",        stile: "sc" },
    { id: "scopa2v2",  nome: "Scopa 2 vs 2", insegna: "SCOPA 2 VS 2", stile: "s2" },
    { id: "scopone",   nome: "Scopone",      insegna: "SCOPONE",      stile: "so" },
    { id: "poker",     nome: "Poker",        insegna: "POKER",        stile: "pk" },
    { id: "tris",      nome: "Tris",         insegna: "TRIS",         stile: "tr" },
    { id: "drop4",     nome: "Drop 4",       insegna: "DROP 4",       stile: "f4" },
    { id: "navale",    nome: "Battaglia Navale", insegna: "BATTAGLIA NAVALE", stile: "nv" }
  ];

  // ---- prospettiva e pezzi di disegno ----
  var CP = 1, SP = 0;   // la telecamera può guardare un po' in giù (il salone): coseno e seno dell'inclinazione
  function P(x, y, z) {
    if (!SP) return [CX + F * x / z, HY + F * (EYE - y) / z];
    var dy = y - EYE, prof = z * CP - dy * SP, alto = dy * CP + z * SP;
    return [CX + F * x / prof, HY - F * alto / prof];
  }
  function r1(v) { return Math.round(v * 10) / 10; }
  function pts(a) { return a.map(function (p) { return r1(p[0]) + "," + r1(p[1]); }).join(" "); }
  function poly(a, fill, extra) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + (extra ? " " + extra : "") + "/>"; }
  function linea(a, b, col, w, extra) { return "<line x1='" + r1(a[0]) + "' y1='" + r1(a[1]) + "' x2='" + r1(b[0]) + "' y2='" + r1(b[1]) + "' stroke='" + col + "' stroke-width='" + w + "'" + (extra ? " " + extra : "") + "/>"; }
  function ell(c, rx, ry, fill, extra) { return "<ellipse cx='" + r1(c[0]) + "' cy='" + r1(c[1]) + "' rx='" + r1(rx) + "' ry='" + r1(ry) + "' fill='" + fill + "'" + (extra ? " " + extra : "") + "/>"; }
  // pezzi di piano: parete di fondo (z fisso), piani orizzontali (y fisso), pareti di lato (x fisso)
  function qFondo(x0, x1, y0, y1, z) { return [P(x0, y1, z), P(x1, y1, z), P(x1, y0, z), P(x0, y0, z)]; }
  function qPiano(x0, x1, z0, z1, y) { return [P(x0, y, z1), P(x1, y, z1), P(x1, y, z0), P(x0, y, z0)]; }
  function qLato(x, z0, z1, y0, y1) { return [P(x, y1, z0), P(x, y1, z1), P(x, y0, z1), P(x, y0, z0)]; }
  // un cerchio steso in orizzontale (fiches, tappetini…): centro e raggi visti dalla telecamera
  function tondo(x, y, z, r) { var c = P(x, y, z); return { c: c, rx: (P(x + r, y, z)[0] - P(x - r, y, z)[0]) / 2, ry: (P(x, y, z - r)[1] - P(x, y, z + r)[1]) / 2 }; }
  // un ovale steso (tavoli): punti da t0 a t1 (radianti); t = 90° è il punto più lontano
  function ovale(rx, rz, y, z0, t0, t1, n, cx) {   // cx = spostato di lato (i tavoli del salone)
    cx = cx || 0;
    var a = []; for (var i = 0; i <= n; i++) { var t = t0 + (t1 - t0) * i / n; a.push(P(cx + rx * Math.cos(t), y, z0 + rz * Math.sin(t))); } return a;
  }
  function tono(c, k) {   // schiarisce (k > 0) o scurisce (k < 0) un colore #rrggbb
    var n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); }
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }

  // ---- la stanza: soffitto, pareti (con le righe della tappezzeria), zoccolo di legno, pavimento a quadri ----
  function stanza(c) {
    var o = [], x, z, i, j;
    o.push(poly(qPiano(-XW, XW, 0.9, ZB, YT), "url(#gSoff)"));
    o.push(poly(qLato(-XW, 0.9, ZB, 0, YT), c.lato), poly(qLato(XW, 0.9, ZB, 0, YT), c.lato));
    o.push(poly(qFondo(-XW, XW, 0, YT, ZB), c.parete));
    if (c.righe) {
      for (x = -XW + 0.1; x < XW - 0.05; x += 0.42) o.push(poly(qFondo(x, x + 0.2, 0, YT, ZB), c.righe));
      for (z = ZB - 0.2; z > 1.2; z -= 0.6) { o.push(poly(qLato(-XW, z - 0.28, z, 0, YT), c.righeLato), poly(qLato(XW, z - 0.28, z, 0, YT), c.righeLato)); }
    }
    if (c.extraPareti) o.push(c.extraPareti);
    var hz = c.zoccoloH || 1.05, zs = tono(c.zoccolo, -0.28), cs = tono(c.cornice, -0.32);
    o.push(poly(qFondo(-XW, XW, 0, hz, ZB), c.zoccolo), poly(qLato(-XW, 0.9, ZB, 0, hz), zs), poly(qLato(XW, 0.9, ZB, 0, hz), zs));
    for (x = -XW + 0.12; x < XW - 0.4; x += 0.8) o.push(poly(qFondo(x, x + 0.66, 0.16, hz - 0.14, ZB), "none", "stroke='" + tono(c.zoccolo, 0.2) + "' stroke-width='1'"));
    o.push(poly(qFondo(-XW, XW, hz, hz + 0.07, ZB), c.cornice), poly(qLato(-XW, 0.9, ZB, hz, hz + 0.07), cs), poly(qLato(XW, 0.9, ZB, hz, hz + 0.07), cs));
    o.push(poly(qFondo(-XW, XW, YT - 0.16, YT, ZB), c.cornice), poly(qLato(-XW, 0.9, ZB, YT - 0.16, YT), cs), poly(qLato(XW, 0.9, ZB, YT - 0.16, YT), cs));
    // pavimento: moquette o mattonelle a quadri, che si stringono verso il fondo
    var q = c.quadro || 0.5;
    o.push(poly(qPiano(-XW, XW, 0.9, ZB, 0), c.pav1));
    for (z = ZB, i = 0; z > 1.6; z -= q, i++) for (x = -XW, j = 0; x < XW - 0.01; x += q, j++) if ((i + j) % 2) o.push(poly(qPiano(x, x + q, z - q, z, 0), c.pav2));
    if (c.fughe) for (x = -XW; x <= XW + 0.01; x += q) o.push(linea(P(x, 0, ZB), P(x, 0, 1.2), c.fughe, 0.8));
    // ombra dove le pareti toccano il pavimento
    o.push(poly(qFondo(-XW, XW, 0, 0.3, ZB - 0.01), "url(#gOmbraMuro)"));
    return o.join("");
  }

  // ---- luci ----
  function lampada(x, z, yb, paralume, larga) {   // lampada che pende dal soffitto, con la luce sotto
    var w = (larga || 0.3) * F / z, top = P(x, YT, z), a = P(x, yb + 0.26, z), b = P(x, yb, z);
    return linea(top, a, "#0c0c0c", 1.3) +
      "<ellipse cx='" + r1(b[0]) + "' cy='" + r1(b[1] + w * 0.25) + "' rx='" + r1(w * 2.6) + "' ry='" + r1(w * 1.6) + "' fill='url(#gAlone)'/>" +
      "<path d='M" + r1(a[0] - w * 0.32) + "," + r1(a[1]) + " L" + r1(a[0] + w * 0.32) + "," + r1(a[1]) + " L" + r1(b[0] + w) + "," + r1(b[1]) + " L" + r1(b[0] - w) + "," + r1(b[1]) + " Z' fill='" + paralume + "'/>" +
      "<path d='M" + r1(a[0] - w * 0.32) + "," + r1(a[1]) + " L" + r1(a[0] - w * 0.05) + "," + r1(a[1]) + " L" + r1(b[0] - w * 0.55) + "," + r1(b[1]) + " L" + r1(b[0] - w) + "," + r1(b[1]) + " Z' fill='#ffffff' opacity='.16'/>" +
      ell(b, w, w * 0.24, "#fff4c9");
  }
  function pozza(x, y, z, r) { var t = tondo(x, y, z, r); return ell(t.c, t.rx, t.ry, "url(#gPozza)"); }   // la luce che cade sul tavolo
  function applique(x, y, z) {   // lampada da parete
    var p = P(x, y, z), k = F / z;
    return ell(p, k * 0.42, k * 0.42, "url(#gAlone)") + "<rect x='" + r1(p[0] - k * 0.03) + "' y='" + r1(p[1]) + "' width='" + r1(k * 0.06) + "' height='" + r1(k * 0.16) + "' fill='#b0812d'/>" +
      ell([p[0], p[1] - k * 0.02], k * 0.07, k * 0.09, "#fff1bf");
  }

  // ---- gente al tavolo: si vede da metà petto in su (sotto la copre il tavolo) ----
  function busto(nome, x, z, k) {
    if (!window.SGOmino) return "";
    var prof = z * CP - (0.52 - EYE) * SP;   // la distanza vera (col salone che guarda in giù)
    var cfg = SGOmino.casuale(nome), w = (k || 1.1) * KB / 1.1 * F / prof, h = w * 1.022, b = P(x, 0.52, z);
    var svg = SGOmino.svg(cfg, { busto: true });
    return "<image xlink:href=\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg) + "\" x='" + r1(b[0] - w / 2) + "' y='" + r1(b[1] - h) + "' width='" + r1(w) + "' height='" + r1(h) + "'/>";
  }

  // ---- fiches, carte ----
  var FICHE = ["#e03131", "#1c7ed6", "#2b8a3e", "#212529", "#f08c00", "#7048e8"];
  function pila(x, z, n, col, yT) {   // una pila di fiches coi segnetti bianchi sul bordo
    var t = tondo(x, yT, z, 0.075), h = Math.max(1.5, 0.028 * F / z), o = [];
    for (var i = 0; i < n; i++) {
      var y = t.c[1] - i * h;
      o.push(ell([t.c[0], y + h * 0.6], t.rx, t.ry, tono(col, -0.38)));
      o.push(ell([t.c[0], y], t.rx, t.ry, col, "stroke='#ffffff' stroke-width='" + r1(Math.max(0.7, t.rx * 0.17)) + "' stroke-dasharray='" + r1(t.rx * 0.42) + " " + r1(t.rx * 0.5) + "'"));
    }
    return o.join("");
  }
  // una carta stesa sul tavolo: (x, z) centro, ang = girata in pianta (gradi);
  // seme: "c" "q" "p" "f" (francesi), "denari" "coppe" "spade" "bastoni" (napoletane), niente = coperta
  function carta(x, z, ang, yT, seme, dorso, k) {
    k = k || 1;
    var a = ang * Math.PI / 180, cw = 0.062 * k, ch = 0.09 * k, ca = Math.cos(a), sa = Math.sin(a);
    function q(dx, dz) { return P(x + dx * ca - dz * sa, yT, z + dx * sa + dz * ca); }
    var o = poly([q(-cw, ch), q(cw, ch), q(cw, -ch), q(-cw, -ch)], seme ? "#fbf7ee" : (dorso || "#1d4ed8"), "stroke='" + (seme ? "#a59c8c" : "#f1f3f5") + "' stroke-width='.7' stroke-linejoin='round'");
    if (!seme) return o + poly([q(-cw * 0.6, ch * 0.72), q(cw * 0.6, ch * 0.72), q(cw * 0.6, -ch * 0.72), q(-cw * 0.6, -ch * 0.72)], "none", "stroke='#ffffff' stroke-opacity='.55' stroke-width='.6'");
    var c = P(x, yT, z), s = Math.max(1.6, 0.03 * k * F / z);
    if (seme === "c" || seme === "q") return o + "<path d='M" + r1(c[0]) + "," + r1(c[1] - s) + " L" + r1(c[0] + s * 0.8) + "," + r1(c[1]) + " L" + r1(c[0]) + "," + r1(c[1] + s) + " L" + r1(c[0] - s * 0.8) + "," + r1(c[1]) + " Z' fill='#d6336c'/>";
    if (seme === "p" || seme === "f") return o + ell(c, s * 0.75, s * 0.75, "#212529");
    if (seme === "denari") return o + ell(c, s * 0.95, s * 0.95, "#f2b705", "stroke='#c92a2a' stroke-width='.7'");
    if (seme === "coppe") return o + "<path d='M" + r1(c[0] - s) + "," + r1(c[1] - s * 0.7) + " L" + r1(c[0] + s) + "," + r1(c[1] - s * 0.7) + " L" + r1(c[0] + s * 0.35) + "," + r1(c[1] + s * 0.3) + " L" + r1(c[0] + s * 0.35) + "," + r1(c[1] + s) + " L" + r1(c[0] - s * 0.35) + "," + r1(c[1] + s) + " L" + r1(c[0] - s * 0.35) + "," + r1(c[1] + s * 0.3) + " Z' fill='#e8590c'/>";
    if (seme === "spade") return o + linea([c[0] - s * 0.6, c[1] + s], [c[0] + s * 0.6, c[1] - s], "#1971c2", Math.max(0.9, s * 0.35));
    return o + linea([c[0] - s * 0.5, c[1] + s], [c[0] + s * 0.5, c[1] - s], "#2b8a3e", Math.max(1.2, s * 0.6), "stroke-linecap='round'");   // bastoni
  }

  // ---- quadri e cose appese alla parete di fondo ----
  function cornice(x0, x1, y0, y1, legno, dentro) {
    var b = 0.07;
    return poly(qFondo(x0 - b, x1 + b, y0 - b, y1 + b, ZB - 0.02), legno) + poly(qFondo(x0, x1, y0, y1, ZB - 0.02), dentro);
  }
  function cartaParete(x, y, w, h, ang, seme, scritta, colScritta) {   // una carta grande in un quadro (Black Jack, Scopa)
    var c = P(x, y, ZB - 0.03), k = F / ZB, ww = w * k, hh = h * k;
    var o = "<g transform='translate(" + r1(c[0]) + "," + r1(c[1]) + ") rotate(" + ang + ")'>" +
      "<rect x='" + r1(-ww / 2) + "' y='" + r1(-hh / 2) + "' width='" + r1(ww) + "' height='" + r1(hh) + "' rx='" + r1(ww * 0.1) + "' fill='#fbf7ee' stroke='#c9bfa9' stroke-width='.8'/>";
    if (scritta) o += "<text x='" + r1(-ww * 0.3) + "' y='" + r1(-hh * 0.22) + "' font-family='Georgia,serif' font-weight='700' font-size='" + r1(ww * 0.3) + "' fill='" + colScritta + "' text-anchor='middle'>" + scritta + "</text>";
    o += seme + "</g>";
    return o;
  }

  // =========================================================
  //  LE SALE
  // =========================================================
  function salaBJ() {
    var z0 = 2.9, R = 1.2, yT = 0.87, o = [];
    o.push(stanza({ parete: "#6d1426", righe: "#7b1b2f", lato: "#4a0d19", righeLato: "#531022", zoccolo: "#3b1e12", cornice: "#d4a240",
      pav1: "#7a1220", pav2: "#62101b" }));
    // il quadro: Asso di picche e Jack di cuori incrociati, in cornice d'oro
    o.push(cornice(-0.62, 0.62, 1.95, 3.15, "#c8962e", "#2a0710"));
    var k = F / ZB;
    o.push(cartaParete(-0.18, 2.55, 0.5, 0.74, -14, "<path d='M0," + r1(-k * 0.13) + " C" + r1(k * 0.16) + "," + r1(-k * 0.02) + " " + r1(k * 0.12) + "," + r1(k * 0.12) + " 0," + r1(k * 0.06) + " C" + r1(-k * 0.12) + "," + r1(k * 0.12) + " " + r1(-k * 0.16) + "," + r1(-k * 0.02) + " 0," + r1(-k * 0.13) + " Z' fill='#212529'/>", "A", "#212529"));
    o.push(cartaParete(0.2, 2.55, 0.5, 0.74, 12, "<path d='M0," + r1(k * 0.12) + " C" + r1(-k * 0.2) + "," + r1(-k * 0.02) + " " + r1(-k * 0.06) + "," + r1(-k * 0.16) + " 0," + r1(-k * 0.06) + " C" + r1(k * 0.06) + "," + r1(-k * 0.16) + " " + r1(k * 0.2) + "," + r1(-k * 0.02) + " 0," + r1(k * 0.12) + " Z' fill='#d6336c'/>", "J", "#d6336c"));
    o.push(applique(-XW + 0.02, 2.5, 5.6), applique(XW - 0.02, 2.5, 5.6));
    // la gente seduta dall'altra parte del tavolo (prima: il tavolo le copre le gambe)
    var posti = [140, 106, 74, 40], nomi = ["Rosa", "Peppe", "Lina", "Tonio"];
    posti.forEach(function (a, i) { var t = a * Math.PI / 180, r = R + 0.32; o.push(busto(nomi[i], r * Math.cos(t), z0 + r * Math.sin(t))); });
    // il tavolo a mezzaluna: ombra e piedistallo sotto, bordo di legno davanti, bordo imbottito, panno verde
    var om = tondo(0, 0, z0 + 0.4, 0.95);
    o.push(ell(om.c, om.rx, om.ry, "#000000", "opacity='.22'"));
    o.push(poly(qFondo(-0.28, 0.28, 0, yT - 0.08, z0 + 0.4), "#2a140b"), poly(qFondo(-0.55, 0.55, 0, 0.06, z0 + 0.4), "#2a140b"));
    o.push(poly(qFondo(-R - 0.14, R + 0.14, yT - 0.1, yT + 0.02, z0), "url(#gLegno)"));
    o.push(poly(ovale(R + 0.14, R + 0.14, yT + 0.02, z0, 0, Math.PI, 48), "#2a160d"));
    o.push(poly(ovale(R + 0.14, R + 0.14, yT + 0.02, z0, 0, Math.PI, 48), "none", "stroke='#6b4a33' stroke-width='1.2'"));
    o.push(poly(ovale(R, R, yT, z0, 0, Math.PI, 48), "url(#gFeltro)"));
    o.push(pozza(-0.6, yT, z0 + 0.55, 0.7), pozza(0.6, yT, z0 + 0.55, 0.7));
    // la scritta sul panno, ad arco
    var arco = ovale(0.8, 0.8, yT, z0, Math.PI * 0.94, Math.PI * 0.06, 28);
    o.push("<path id='arcoBJ' d='M" + arco.map(function (p) { return r1(p[0]) + "," + r1(p[1]); }).join(" L") + "' fill='none'/>");
    o.push("<text font-family='Georgia,serif' font-weight='700' font-size='8.5' letter-spacing='1' fill='#e9c46a' opacity='.9'><textPath xlink:href='#arcoBJ' startOffset='50%' text-anchor='middle'>BLACK JACK PAGA 3 A 2</textPath></text>");
    // per ogni giocatore: il cerchio della puntata con le fiches e le sue due carte
    posti.forEach(function (a, i) {
      var t = a * Math.PI / 180, cerchio = tondo(1.0 * Math.cos(t), yT, z0 + 1.0 * Math.sin(t), 0.12);
      o.push(ell(cerchio.c, cerchio.rx, cerchio.ry, "none", "stroke='#f8f0d8' stroke-opacity='.75' stroke-width='1'"));
      o.push(pila(1.0 * Math.cos(t), z0 + 1.0 * Math.sin(t), 3 + (i * 2) % 4, FICHE[i % FICHE.length], yT));
      o.push(pila(1.0 * Math.cos(t) + 0.16, z0 + 1.0 * Math.sin(t) - 0.04, 2 + i % 3, FICHE[(i + 3) % FICHE.length], yT));
      o.push(carta(0.7 * Math.cos(t) - 0.04, z0 + 0.7 * Math.sin(t), a - 90 + 8, yT, ["c", "p", "q", "f"][i]), carta(0.7 * Math.cos(t) + 0.05, z0 + 0.7 * Math.sin(t) - 0.02, a - 90 - 6, yT, ["p", "q", "f", "c"][i]));
    });
    // il banco: le carte del mazziere, la cassetta delle fiches e lo sabot
    o.push(carta(-0.08, z0 + 0.38, 4, yT, "c"), carta(0.08, z0 + 0.38, -3, yT, null, "#b02a37"));
    o.push(poly(qPiano(-0.42, 0.42, z0 + 0.05, z0 + 0.24, yT + 0.01), "#1b1b1b"));
    for (var s = 0; s < 8; s++) { var x0 = -0.4 + s * 0.1; o.push(poly(qPiano(x0 + 0.012, x0 + 0.088, z0 + 0.07, z0 + 0.22, yT + 0.02), FICHE[s % FICHE.length])); }
    o.push(poly(qPiano(0.6, 0.84, z0 + 0.08, z0 + 0.3, yT + 0.13), "#7a1622"), poly(qFondo(0.6, 0.84, yT, yT + 0.13, z0 + 0.08), "#4f0c14"));
    o.push(lampada(-0.72, z0 + 0.4, 2.75, "#7a1222"), lampada(0.72, z0 + 0.4, 2.75, "#7a1222"));
    return { o: o.join(""), feltro: ["#1d9a57", "#0d6136"], legno: ["#5a2f17", "#2b140a"], pozza: "#fff3c4" };
  }

  // tavolo di legno con la tovaglia a quadretti (Scopa e Scopa 2 vs 2)
  function tavoloTovaglia(o, z0, hw, hd, col1, col2, cx) {   // cx = spostato di lato (le sale del Circolo)
    cx = cx || 0;
    var yT = 0.8, nx = Math.round(hw * 8), nz = 6, i, j, drop = 0.3;
    o.push(poly(qFondo(cx - hw + 0.06, cx - hw + 0.15, 0, yT - drop, z0 - hd + 0.08), "#3d2416"), poly(qFondo(cx + hw - 0.15, cx + hw - 0.06, 0, yT - drop, z0 - hd + 0.08), "#3d2416"));
    o.push(poly(qPiano(cx - hw, cx + hw, z0 - hd, z0 + hd, yT), col1));
    for (i = 0; i < nx; i++) for (j = 0; j < nz; j++) if ((i + j) % 2) o.push(poly(qPiano(cx - hw + 2 * hw * i / nx, cx - hw + 2 * hw * (i + 1) / nx, z0 - hd + 2 * hd * j / nz, z0 - hd + 2 * hd * (j + 1) / nz, yT), col2));
    o.push(poly(qFondo(cx - hw, cx + hw, yT - drop, yT, z0 - hd), col1));
    for (i = 0; i < nx; i++) for (j = 0; j < 2; j++) if ((i + j) % 2) o.push(poly(qFondo(cx - hw + 2 * hw * i / nx, cx - hw + 2 * hw * (i + 1) / nx, yT - drop * (j + 1) / 2, yT - drop * j / 2, z0 - hd), col2));
    o.push(poly(qFondo(cx - hw, cx + hw, yT - drop, yT, z0 - hd), "#000000", "opacity='.16'"));
    return yT;
  }
  // tavolo di legno nudo (Tris, Forza 4, Battaglia Navale): piano, bordo davanti e gambe
  function tavoloLegno(o, cx, z0, hw, hd, legno) {
    var yT = 0.8, l = legno || "#8a5a34";
    o.push(poly(qFondo(cx - hw + 0.05, cx - hw + 0.13, 0, yT - 0.06, z0 - hd + 0.06), tono(l, -0.45)), poly(qFondo(cx + hw - 0.13, cx + hw - 0.05, 0, yT - 0.06, z0 - hd + 0.06), tono(l, -0.45)));
    o.push(poly(qPiano(cx - hw, cx + hw, z0 - hd, z0 + hd, yT), l));
    for (var x = cx - hw + 0.18; x < cx + hw; x += 0.18) o.push(linea(P(x, yT, z0 - hd), P(x, yT, z0 + hd), tono(l, -0.15), 0.6, "opacity='.6'"));   // le assi
    o.push(poly(qFondo(cx - hw, cx + hw, yT - 0.07, yT, z0 - hd), tono(l, -0.3)));
    return yT;
  }
  // il Tris sul foglio: la griglia a matita, le X rosse e i cerchi blu, la matita
  function tris(o, cx, z0, yT, k) {
    var s = 0.17 * k, y = yT + 0.002, i;
    o.push(poly(qPiano(cx - s * 1.9, cx + s * 1.9, z0 - s * 1.75, z0 + s * 1.75, y), "#fbfaf4", "stroke='#d6d0c0' stroke-width='.6'"));
    for (i = -1; i <= 1; i += 2) {
      o.push(linea(P(cx + i * s * 0.5, y, z0 - s * 1.45), P(cx + i * s * 0.5, y, z0 + s * 1.45), "#495057", Math.max(0.8, 1.6 * k)));
      o.push(linea(P(cx - s * 1.5, y, z0 + i * s * 0.5), P(cx + s * 1.5, y, z0 + i * s * 0.5), "#495057", Math.max(0.8, 1.6 * k)));
    }
    [[-1, 1, "x"], [0, 0, "x"], [1, -1, "o"], [1, 1, "o"], [-1, -1, "x"], [0, 1, "o"]].forEach(function (m) {
      var c = [cx + m[0] * s, z0 + m[1] * s], r = s * 0.32;
      if (m[2] === "x") { o.push(linea(P(c[0] - r, y, c[1] - r), P(c[0] + r, y, c[1] + r), "#e03131", Math.max(1, 2.2 * k), "stroke-linecap='round'"), linea(P(c[0] - r, y, c[1] + r), P(c[0] + r, y, c[1] - r), "#e03131", Math.max(1, 2.2 * k), "stroke-linecap='round'")); }
      else { var t = tondo(c[0], y, c[1], r); o.push(ell(t.c, t.rx, t.ry, "none", "stroke='#1c7ed6' stroke-width='" + r1(Math.max(1, 2.2 * k)) + "'")); }
    });
    o.push(poly([P(cx + s * 2.1, y, z0 - s * 0.6), P(cx + s * 2.25, y, z0 - s * 0.6), P(cx + s * 1.7, y, z0 + s * 1.3), P(cx + s * 1.58, y, z0 + s * 1.26)], "#fcc419"));   // la matita
  }
  // la griglia di Forza 4 in piedi sul tavolo, coi gettoni rossi e gialli
  function forza4(o, cx, z0, yT, k) {
    var w = 0.5 * k, h = 0.44 * k, y0 = yT + 0.03, r, c;
    o.push(poly(qFondo(cx - w - 0.04 * k, cx - w + 0.02 * k, yT, y0 + h + 0.03 * k, z0), "#1849a9"), poly(qFondo(cx + w - 0.02 * k, cx + w + 0.04 * k, yT, y0 + h + 0.03 * k, z0), "#1849a9"));   // i piedi
    o.push(poly(qFondo(cx - w, cx + w, y0, y0 + h, z0), "#1c62d6", "stroke='#103a8a' stroke-width='1'"));
    var col = ["", "", "r", "", "", "", "",  "", "g", "r", "", "", "", "",  "g", "r", "g", "r", "", "", "",  "r", "g", "g", "r", "g", "", "r"];   // dal basso
    for (r = 0; r < 6; r++) for (c = 0; c < 7; c++) {
      var x = cx - w + (c + 0.5) * 2 * w / 7, yy = y0 + (r + 0.5) * h / 6, p = P(x, yy, z0 - 0.005), rr = Math.max(0.8, 0.026 * k * F / z0), v = col[(5 - r) * 7 + c] || "";
      o.push(ell(p, rr, rr, v === "r" ? "#e03131" : v === "g" ? "#fcc419" : "#0d2d6b"));
    }
  }
  // Battaglia Navale: due valigette aperte, col mare a quadretti, le navi grigie e i pioli
  function navale(o, cx, z0, yT, k) {
    [-1, 1].forEach(function (lato) {
      var x0 = cx + lato * 0.06 * k + (lato < 0 ? -0.62 * k : 0), x1 = x0 + 0.56 * k, z1 = z0 - 0.3 * k, z2 = z0 + 0.22 * k, y = yT + 0.01, i, j;
      o.push(poly(qPiano(x0, x1, z1, z2, y), lato < 0 ? "#868e96" : "#a3a8ad"));
      o.push(poly(qPiano(x0 + 0.03 * k, x1 - 0.03 * k, z1 + 0.03 * k, z2 - 0.03 * k, y + 0.002), "#1c7ed6"));
      for (i = 1; i < 8; i++) o.push(linea(P(x0 + 0.03 * k + i * (x1 - x0 - 0.06 * k) / 8, y + 0.003, z1 + 0.03 * k), P(x0 + 0.03 * k + i * (x1 - x0 - 0.06 * k) / 8, y + 0.003, z2 - 0.03 * k), "#74c0fc", 0.5));
      for (j = 1; j < 8; j++) o.push(linea(P(x0 + 0.03 * k, y + 0.003, z1 + 0.03 * k + j * (z2 - z1 - 0.06 * k) / 8), P(x1 - 0.03 * k, y + 0.003, z1 + 0.03 * k + j * (z2 - z1 - 0.06 * k) / 8), "#74c0fc", 0.5));
      var dx = (x1 - x0 - 0.06 * k) / 8, dz = (z2 - z1 - 0.06 * k) / 8, bx = x0 + 0.03 * k, bz = z1 + 0.03 * k;
      [[1, 1, 4, 0], [5, 3, 0, 3], [2, 5, 3, 0]].forEach(function (n) {   // le navi: [colonna, riga, lunga in x, lunga in z]
        o.push(poly(qPiano(bx + n[0] * dx + dx * 0.15, bx + (n[0] + Math.max(1, n[2])) * dx - dx * 0.15, bz + n[1] * dz + dz * 0.15, bz + (n[1] + Math.max(1, n[3])) * dz - dz * 0.15, y + 0.02), "#ced4da", "stroke='#495057' stroke-width='.5'"));
      });
      [[0, 6, 1], [3, 2, 0], [6, 6, 1], [2, 1, 1], [7, 0, 0]].forEach(function (pp) {   // i pioli: rossi colpito, bianchi acqua
        var c = P(bx + (pp[0] + 0.5) * dx, y + 0.03, bz + (pp[1] + 0.5) * dz);
        o.push(ell(c, Math.max(0.7, dx * 0.22 * F / z0), Math.max(0.6, dz * 0.18 * F / z0), pp[2] ? "#e03131" : "#f8f9fa"));
      });
      o.push(poly(qFondo(x0, x1, y, y + 0.17 * k, z2), lato < 0 ? "#6c737a" : "#868e96"), poly(qFondo(x0 + 0.04 * k, x1 - 0.04 * k, y + 0.035 * k, y + 0.14 * k, z2 - 0.001), "#0b4a8b"));   // il coperchio in piedi
    });
  }
  // la sala della Scopa: osteria con le mattonelle di cotto e la luce calda; niente fiches
  function stanzaOsteria(parete, extra) {
    return stanza({ parete: parete, righe: null, lato: tono(parete, -0.3), zoccolo: "#6b4226", cornice: "#4a2c18", zoccoloH: 1.0,
      pav1: "#b4552e", pav2: "#9c4626", fughe: "#7d3a1f", quadro: 0.45, extraPareti: extra });
  }
  function mattoni(x0, x1, y0, y1) {   // un pezzo di muro senza intonaco, coi mattoni
    var o = [], h = 0.12, w = 0.26, r = 0;
    for (var y = y0; y < y1 - 0.01; y += h, r++) for (var x = x0 - (r % 2) * w / 2; x < x1 - 0.01; x += w) {
      var a = Math.max(x, x0), b = Math.min(x + w - 0.025, x1);
      if (b > a + 0.03) o.push(poly(qFondo(a, b, y + 0.02, Math.min(y + h, y1), ZB - 0.01), r % 3 ? "#a2482a" : "#b8583a"));
    }
    return o.join("");
  }
  function salaScopa() {
    var z0 = 3.25, hw = 1.05, hd = 0.55, o = [];
    o.push(stanzaOsteria("#d89a5f", mattoni(-1.8, -0.95, 1.3, 2.1) + mattoni(-1.7, -1.05, 2.9, 3.5)));
    // il quadro: il Settebello (il 7 di denari)
    o.push(cornice(0.82, 1.5, 1.75, 2.85, "#4a2c18", "#f3ead2"));
    [[-0.17, 2.6], [0.17, 2.6], [0, 2.4], [-0.17, 2.2], [0.17, 2.2], [-0.17, 1.98], [0.17, 1.98]].forEach(function (p) {   // il Settebello: 7 monete
      p = [p[0] + 1.16, p[1]];
      var c = P(p[0], p[1], ZB - 0.03), rr = 0.075 * F / ZB;
      o.push(ell(c, rr, rr, "#f2b705", "stroke='#c92a2a' stroke-width='1'"), ell(c, rr * 0.4, rr * 0.4, "#c92a2a"));
    });
    o.push(applique(-XW + 0.02, 2.4, 5.4), applique(XW - 0.02, 2.4, 5.4));
    // i due giocatori
    o.push(busto("Ciccio", -0.5, z0 + hd + 0.36), busto("Carmela", 0.5, z0 + hd + 0.36));
    var yT = tavoloTovaglia(o, z0, hw, hd, "#f4ede1", "#d33a3a");
    o.push(pozza(0, yT, z0 + 0.1, 0.9));
    // le carte: quattro in tavola, le carte in mano coperte, i mazzetti delle prese
    [["denari", -0.3, 8], ["coppe", -0.1, -6], ["spade", 0.1, 5], ["bastoni", 0.3, -9]].forEach(function (c) { o.push(carta(c[1], z0 + 0.02, c[2], yT, c[0], null, 1.25)); });
    [-0.5, 0.5].forEach(function (x, i) {
      for (var n = 0; n < 3; n++) o.push(carta(x - 0.08 + n * 0.08, z0 + hd - 0.18, (n - 1) * 10, yT, null, "#8c1c13", 1.2));
      for (n = 0; n < 4; n++) o.push(carta(x + (i ? 0.28 : -0.28), z0 + hd - 0.2, 4, yT + n * 0.006, null, "#8c1c13", 1.2));
    });
    o.push(lampada(0, z0 + 0.1, 2.55, "#2f6b4f", 0.36));
    return { o: o.join(""), feltro: ["#1d9a57", "#0d6136"], legno: ["#6b4226", "#3d2416"], pozza: "#ffe6b0" };
  }
  function bandierine(y, z, colori) {   // il festone di bandierine da una parete all'altra
    var o = [], n = 12;
    var A = P(-XW, y, z), B = P(XW, y, z);
    o.push("<path d='M" + r1(A[0]) + "," + r1(A[1]) + " Q" + r1(CX) + "," + r1(A[1] + 26) + " " + r1(B[0]) + "," + r1(B[1]) + "' stroke='#3b2a1d' stroke-width='1' fill='none'/>");
    for (var i = 1; i < n; i++) {
      var t = i / n, x = (1 - t) * (1 - t) * A[0] + 2 * t * (1 - t) * CX + t * t * B[0], yy = (1 - t) * (1 - t) * A[1] + 2 * t * (1 - t) * (A[1] + 26) + t * t * B[1], s = 0.11 * F / z;
      o.push("<path d='M" + r1(x - s * 0.55) + "," + r1(yy) + " L" + r1(x + s * 0.55) + "," + r1(yy) + " L" + r1(x) + "," + r1(yy + s * 1.1) + " Z' fill='" + colori[i % colori.length] + "'/>");
    }
    return o.join("");
  }
  function salaScopa2() {
    var z0 = 3.25, hw = 1.45, hd = 0.55, o = [];
    o.push(stanzaOsteria("#d0905a", mattoni(-1.75, -1.0, 2.5, 3.3)));
    // le due squadre: bandiere blu e rossa incrociate e il festone di bandierine
    var k = F / ZB, c = P(0, 2.45, ZB - 0.02);
    o.push(linea([c[0] - k * 0.5, c[1] + k * 0.5], [c[0] + k * 0.5, c[1] - k * 0.6], "#5c3b22", 2), linea([c[0] + k * 0.5, c[1] + k * 0.5], [c[0] - k * 0.5, c[1] - k * 0.6], "#5c3b22", 2));
    o.push("<path d='M" + r1(c[0] - k * 0.5) + "," + r1(c[1] - k * 0.6) + " L" + r1(c[0] - k * 0.05) + "," + r1(c[1] - k * 0.47) + " L" + r1(c[0] - k * 0.38) + "," + r1(c[1] - k * 0.22) + " Z' fill='#1c7ed6'/>");
    o.push("<path d='M" + r1(c[0] + k * 0.5) + "," + r1(c[1] - k * 0.6) + " L" + r1(c[0] + k * 0.05) + "," + r1(c[1] - k * 0.47) + " L" + r1(c[0] + k * 0.38) + "," + r1(c[1] - k * 0.22) + " Z' fill='#e03131'/>");
    o.push(bandierine(3.55, ZB - 0.05, ["#1c7ed6", "#e03131", "#ffd43b"]));
    o.push(applique(-XW + 0.02, 2.4, 5.4), applique(XW - 0.02, 2.4, 5.4));
    // quattro giocatori: Noi (blu) e Loro (rossi)
    var xs = [-1.08, -0.36, 0.36, 1.08], nomi = ["Gino", "Teresa", "Sasà", "Nina"];
    xs.forEach(function (x, i) { o.push(busto(nomi[i], x, z0 + hd + 0.36, 0.98)); });
    var yT = tavoloTovaglia(o, z0, hw, hd, "#f4ede1", "#d33a3a");
    o.push(pozza(-0.5, yT, z0 + 0.1, 0.8), pozza(0.5, yT, z0 + 0.1, 0.8));
    // le tovagliette delle due squadre e le carte
    xs.forEach(function (x, i) {
      o.push(poly(qPiano(x - 0.24, x + 0.24, z0 + hd - 0.36, z0 + hd - 0.04, yT + 0.003), i % 2 ? "#e03131" : "#1c7ed6", "opacity='.85'"));
      for (var n = 0; n < 3; n++) o.push(carta(x - 0.08 + n * 0.08, z0 + hd - 0.2, (n - 1) * 10, yT + 0.005, null, "#8c1c13", 1.1));
    });
    [["denari", -0.35, 6], ["spade", -0.12, -8], ["coppe", 0.12, 4], ["bastoni", 0.35, -5]].forEach(function (c) { o.push(carta(c[1], z0 - 0.05, c[2], yT, c[0], null, 1.25)); });
    o.push(lampada(-0.6, z0 + 0.1, 2.6, "#2f6b4f", 0.32), lampada(0.6, z0 + 0.1, 2.6, "#2f6b4f", 0.32));
    return { o: o.join(""), feltro: ["#1d9a57", "#0d6136"], legno: ["#6b4226", "#3d2416"], pozza: "#ffe6b0" };
  }
  function salaScopone() {
    var z0 = 3.2, hw = 1.4, hd = 0.62, yT = 0.82, o = [];
    o.push(stanza({ parete: "#3f5a4a", righe: "#466353", lato: "#2c4034", righeLato: "#31473a", zoccolo: "#5a3a22", cornice: "#c79a4b",
      pav1: "#6e4a2c", pav2: "#5c3d24", quadro: 0.42, fughe: "#4a301b" }));
    // la lavagna coi punti di Noi e Loro
    var k = F / ZB;
    o.push(cornice(-0.85, 0.85, 1.9, 3.1, "#8a5a32", "#22312a"));
    var a = P(-0.6, 2.85, ZB - 0.03), b = P(0.25, 2.85, ZB - 0.03), m = P(0, 3.0, ZB - 0.03), m2 = P(0, 2.0, ZB - 0.03);
    o.push(linea(m, m2, "#e9ecef", 1.1, "opacity='.8'"));
    o.push("<text x='" + r1(a[0] + k * 0.25) + "' y='" + r1(a[1]) + "' font-family='Comic Sans MS,Segoe Print,cursive' font-size='" + r1(k * 0.2) + "' fill='#f1f3f5' opacity='.92' text-anchor='middle'>NOI</text>");
    o.push("<text x='" + r1(b[0] + k * 0.17) + "' y='" + r1(b[1]) + "' font-family='Comic Sans MS,Segoe Print,cursive' font-size='" + r1(k * 0.2) + "' fill='#f1f3f5' opacity='.92' text-anchor='middle'>LORO</text>");
    [[-0.62, 6], [0.12, 4]].forEach(function (g) {   // i segnetti col gesso, a gruppi di cinque
      for (var i = 0; i < g[1]; i++) {
        var gx = g[0] + (i % 5) * 0.075 + Math.floor(i / 5) * 0.45, p1 = P(gx, 2.55, ZB - 0.03), p2 = P(gx, 2.25, ZB - 0.03);
        o.push(linea(p1, p2, "#f8f9fa", 1.2, "opacity='.85' stroke-linecap='round'"));
      }
      if (g[1] >= 5) { var s1 = P(g[0] - 0.03, 2.3, ZB - 0.03), s2 = P(g[0] + 0.33, 2.5, ZB - 0.03); o.push(linea(s1, s2, "#f8f9fa", 1.2, "opacity='.85' stroke-linecap='round'")); }
    });
    o.push(applique(-XW + 0.02, 2.4, 5.4), applique(XW - 0.02, 2.4, 5.4));
    var xs = [-1.05, -0.35, 0.35, 1.05], nomi = ["Pino", "Mena", "Totò", "Lia"];
    xs.forEach(function (x, i) { o.push(busto(nomi[i], x, z0 + hd + 0.36, 0.98)); });
    // il tavolo da gioco: bordo di legno e panno verde
    o.push(poly(qFondo(-hw + 0.08, -hw + 0.18, 0, yT, z0 - hd + 0.1), "#3d2416"), poly(qFondo(hw - 0.18, hw - 0.08, 0, yT, z0 - hd + 0.1), "#3d2416"));
    o.push(poly(qFondo(-hw, hw, yT - 0.12, yT + 0.02, z0 - hd), "url(#gLegno)"));
    o.push(poly(qPiano(-hw, hw, z0 - hd, z0 + hd, yT + 0.02), "#6b4226"));
    o.push(poly(qPiano(-hw + 0.1, hw - 0.1, z0 - hd + 0.1, z0 + hd - 0.08, yT + 0.021), "url(#gFeltro)"));
    o.push(pozza(0, yT, z0, 1.1));
    xs.forEach(function (x, i) {
      for (var n = 0; n < 4; n++) o.push(carta(x - 0.1 + n * 0.065, z0 + hd - 0.24, (n - 1.5) * 9, yT + 0.03, null, "#8c1c13", 1.05));
      o.push(carta(x + 0.02, z0 + 0.12, (i - 1.5) * 7, yT + 0.03, ["denari", "coppe", "spade", "bastoni"][i], null, 1.15));
    });
    o.push(lampada(-0.8, z0 + 0.15, 2.6, "#e8dcc0", 0.34), lampada(0.8, z0 + 0.15, 2.6, "#e8dcc0", 0.34));   // due lampade: la lavagna in mezzo resta libera
    return { o: o.join(""), feltro: ["#2f9e5f", "#16653b"], legno: ["#6b4226", "#2b170c"], pozza: "#fff3c4" };
  }
  function salaPoker() {
    var z0 = 3.4, yT = 0.86, o = [];
    o.push(stanza({ parete: "#14243a", righe: "#182b45", lato: "#0d1a2b", righeLato: "#102034", zoccolo: "#2e1c12", cornice: "#7c5a2e",
      pav1: "#103327", pav2: "#0d2a20" }));
    // l'insegna al neon "ALL IN"
    var a = P(0, 2.45, ZB - 0.03), k = F / ZB;
    o.push("<text x='" + r1(a[0]) + "' y='" + r1(a[1]) + "' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='" + r1(k * 0.5) + "' fill='none' stroke='#ff4fd8' stroke-width='3' opacity='.35' text-anchor='middle' filter='url(#fNeon)'>ALL IN</text>");
    o.push("<text x='" + r1(a[0]) + "' y='" + r1(a[1]) + "' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='" + r1(k * 0.5) + "' fill='none' stroke='#ffd6f5' stroke-width='1.2' text-anchor='middle'>ALL IN</text>");
    o.push(applique(-XW + 0.02, 2.4, 5.4), applique(XW - 0.02, 2.4, 5.4));
    var posti = [146, 116, 90, 64, 34], nomi = ["Matt", "Giada", "Bruno", "Sofia", "Leo"];
    posti.forEach(function (g, i) { var t = g * Math.PI / 180; o.push(busto(nomi[i], 1.7 * Math.cos(t), z0 + 1.08 * Math.sin(t), 1.0)); });
    // il tavolo ovale: bordo imbottito nero, legno, panno verde
    o.push(poly(qFondo(-0.6, 0.6, 0, 0.6, z0 - 0.2), "#0c0c0c"));
    var vicino = ovale(1.62, 0.9, yT, z0, Math.PI, 2 * Math.PI, 30), sotto = ovale(1.62, 0.9, yT - 0.12, z0, 2 * Math.PI, Math.PI, 30);
    o.push(poly(vicino.concat(sotto), "#0f0f0f"));
    o.push(poly(ovale(1.62, 0.9, yT, z0, 0, 2 * Math.PI, 60), "#1b1b1b"));
    o.push(poly(ovale(1.62, 0.9, yT, z0, Math.PI * 1.08, Math.PI * 1.92, 30), "none", "stroke='#4a4a4a' stroke-width='1.2'"));
    o.push(poly(ovale(1.46, 0.79, yT + 0.005, z0, 0, 2 * Math.PI, 60), "#6b3f1e"));
    o.push(poly(ovale(1.38, 0.73, yT + 0.006, z0, 0, 2 * Math.PI, 60), "url(#gFeltro)"));
    o.push(pozza(0, yT, z0, 1.1));
    // le cinque carte in mezzo, il piatto, il bottone del mazziere
    ["c", "p", "q", "f", "c"].forEach(function (s, i) { o.push(carta(-0.3 + i * 0.15, z0 + 0.12, 0, yT + 0.01, i < 4 ? s : null, "#1d4ed8", 1.15)); });
    o.push(pila(-0.12, z0 - 0.22, 6, "#e03131", yT), pila(0.05, z0 - 0.26, 4, "#212529", yT), pila(0.2, z0 - 0.2, 5, "#1c7ed6", yT));
    var bt = tondo(0.55, yT + 0.01, z0 + 0.45, 0.07);
    o.push(ell(bt.c, bt.rx, bt.ry, "#f8f9fa", "stroke='#adb5bd' stroke-width='.6'"), "<text x='" + r1(bt.c[0]) + "' y='" + r1(bt.c[1] + bt.ry * 0.5) + "' font-family='Arial,sans-serif' font-weight='900' font-size='" + r1(bt.ry * 1.5) + "' fill='#212529' text-anchor='middle'>D</text>");
    // davanti a ognuno: due carte coperte e le sue fiches
    posti.forEach(function (g, i) {
      var t = g * Math.PI / 180, x = 1.12 * Math.cos(t), z = z0 + 0.58 * Math.sin(t);
      o.push(carta(x - 0.05, z, -8, yT + 0.01, null, "#1d4ed8"), carta(x + 0.05, z - 0.01, 7, yT + 0.01, null, "#1d4ed8"));
      o.push(pila(x + (x < 0 ? 0.24 : -0.24), z - 0.12, 3 + i % 4, FICHE[i % FICHE.length], yT));
    });
    // la lampada lunga da tavolo da poker
    var w1 = P(-0.95, 2.62, z0), w2 = P(0.95, 2.62, z0), w3 = P(1.12, 2.45, z0), w4 = P(-1.12, 2.45, z0);
    o.push(linea(P(-0.7, YT, z0), P(-0.7, 2.62, z0), "#0c0c0c", 1.2), linea(P(0.7, YT, z0), P(0.7, 2.62, z0), "#0c0c0c", 1.2));
    o.push("<ellipse cx='" + r1(CX) + "' cy='" + r1(w3[1] + 6) + "' rx='" + r1((w3[0] - w4[0]) * 0.75) + "' ry='26' fill='url(#gAlone)'/>");
    o.push(poly([w1, w2, w3, w4], "#1f6f43"), poly([w4, w3, [w3[0], w3[1] + 3], [w4[0], w4[1] + 3]], "#fff1bf"));
    o.push(linea(w1, w2, "#c9a24a", 1.4));
    return { o: o.join(""), feltro: ["#1f8a55", "#0e5233"], legno: ["#141414", "#050505"], pozza: "#fff6d8" };
  }

  // ---- le sale del Circolo per i giochi da tavolo ----
  function lavagnetta(x0, x1, y0, y1, fn) {   // una lavagna appesa alla parete di fondo, col gesso
    return cornice(x0, x1, y0, y1, "#8a5a32", "#22312a") + (fn ? fn() : "");
  }
  function salaTris() {   // lo studio: carta da parati, la lavagnetta col tris, il foglio sul tavolo
    var z0 = 3.2, o = [];
    o.push(stanza({ parete: "#e3cf9f", righe: "#dcc490", lato: "#b9a36f", righeLato: "#c2ab78", zoccolo: "#6b4226", cornice: "#4a2c18",
      pav1: "#9a6a42", pav2: "#8a5d38", quadro: 0.34, fughe: "#6e4a2c" }));
    var k = F / ZB;
    o.push(lavagnetta(-0.75, 0.75, 1.9, 3.05, function () {
      var s = "", a, b;
      for (var i = -1; i <= 1; i += 2) {
        a = P(i * 0.17, 2.95, ZB - 0.03); b = P(i * 0.17, 2.0, ZB - 0.03); s += linea(a, b, "#f1f3f5", 1.4, "opacity='.85'");
        a = P(-0.5, 2.475 + i * 0.16, ZB - 0.03); b = P(0.5, 2.475 + i * 0.16, ZB - 0.03); s += linea(a, b, "#f1f3f5", 1.4, "opacity='.85'");
      }
      [[-0.34, 2.79, "X"], [0, 2.475, "O"], [0.34, 2.16, "X"], [0.34, 2.79, "O"]].forEach(function (m) {
        var p = P(m[0], m[1], ZB - 0.03);
        s += "<text x='" + r1(p[0]) + "' y='" + r1(p[1] + k * 0.08) + "' font-family='Comic Sans MS,Segoe Print,cursive' font-size='" + r1(k * 0.24) + "' fill='" + (m[2] === "X" ? "#ffa8a8" : "#a5d8ff") + "' text-anchor='middle'>" + m[2] + "</text>";
      });
      return s;
    }));
    o.push(applique(-XW + 0.02, 2.4, 5.4), applique(XW - 0.02, 2.4, 5.4));
    o.push(busto("Ninni", -0.5, z0 + 0.82), busto("Peppino", 0.5, z0 + 0.82));
    var yT = tavoloLegno(o, 0, z0, 0.95, 0.5, "#9c6b3f");
    o.push(pozza(0, yT, z0 + 0.1, 0.8));
    tris(o, 0, z0 + 0.05, yT, 1.25);
    o.push(lampada(-0.62, z0 + 0.1, 2.6, "#2f6b4f", 0.28), lampada(0.62, z0 + 0.1, 2.6, "#2f6b4f", 0.28));   // due lampade: la lavagnetta in mezzo resta libera
    return { o: o.join(""), feltro: ["#1d9a57", "#0d6136"], legno: ["#6b4226", "#3d2416"], pozza: "#ffe6b0" };
  }
  function salaForza4() {   // la sala blu: il poster coi gettoni, la griglia gigante sul tavolo
    var z0 = 3.3, o = [];
    o.push(stanza({ parete: "#2b4c7e", righe: "#2f548a", lato: "#1d3456", righeLato: "#213a5f", zoccolo: "#5a3a22", cornice: "#c79a4b",
      pav1: "#7a5233", pav2: "#6b472c", quadro: 0.42, fughe: "#4a301b" }));
    var c = P(0, 2.5, ZB - 0.03), kk = F / ZB;
    o.push(cornice(-0.62, 0.62, 2.0, 3.0, "#c79a4b", "#fff3bf"));
    [[-0.3, 2.3, "#e03131"], [0, 2.3, "#fcc419"], [0.3, 2.3, "#e03131"], [-0.15, 2.62, "#fcc419"], [0.15, 2.62, "#e03131"], [0, 2.86, "#fcc419"]].forEach(function (g) {
      var p = P(g[0], g[1], ZB - 0.03); o.push(ell(p, kk * 0.12, kk * 0.12, g[2], "stroke='" + tono(g[2], -0.3) + "' stroke-width='1'"));
    });
    o.push(applique(-XW + 0.02, 2.4, 5.4), applique(XW - 0.02, 2.4, 5.4));
    o.push(busto("Totò", -0.98, z0 + 0.72), busto("Mimma", 0.98, z0 + 0.72));
    var yT = tavoloLegno(o, 0, z0, 1.15, 0.5, "#8a5a34");
    o.push(pozza(0, yT, z0 + 0.1, 0.9));
    forza4(o, 0, z0 + 0.12, yT, 1.08);
    // i gettoni sparsi davanti ai due giocatori
    [[-0.7, "#e03131"], [-0.58, "#e03131"], [0.6, "#fcc419"], [0.72, "#fcc419"]].forEach(function (g, i) { var t = tondo(g[0], yT + 0.01, z0 - 0.15 + (i % 2) * 0.1, 0.05); o.push(ell(t.c, t.rx, t.ry, g[1], "stroke='" + tono(g[1], -0.3) + "' stroke-width='.8'")); });
    o.push(lampada(-0.6, z0 + 0.2, 2.6, "#e8dcc0", 0.3), lampada(0.6, z0 + 0.2, 2.6, "#e8dcc0", 0.3));
    return { o: o.join(""), feltro: ["#1d9a57", "#0d6136"], legno: ["#6b4226", "#3d2416"], pozza: "#fff3c4" };
  }
  function salaNavale() {   // la sala del mare: l'oblò, il timone, le due valigette sul tavolo
    var z0 = 3.25, o = [];
    o.push(stanza({ parete: "#1f3b57", righe: "#23425f", lato: "#142a40", righeLato: "#183049", zoccolo: "#6b4226", cornice: "#d9b36c",
      pav1: "#8a5d38", pav2: "#7a5230", quadro: 0.36, fughe: "#5c3d24" }));
    var kk = F / ZB, ob = P(-0.95, 2.55, ZB - 0.03), tm = P(0.95, 2.55, ZB - 0.03), i;
    o.push(ell(ob, kk * 0.42, kk * 0.42, "#b08436"), ell(ob, kk * 0.34, kk * 0.34, "#7fc8f8"), ell([ob[0] - kk * 0.1, ob[1] - kk * 0.1], kk * 0.12, kk * 0.08, "#ffffff", "opacity='.5'"));   // l'oblò col cielo
    for (i = 0; i < 8; i++) { var a = i * Math.PI / 4; o.push(linea(tm, [tm[0] + Math.cos(a) * kk * 0.5, tm[1] + Math.sin(a) * kk * 0.5], "#8a5a32", Math.max(1.4, kk * 0.05), "stroke-linecap='round'")); }   // il timone
    o.push(ell(tm, kk * 0.36, kk * 0.36, "none", "stroke='#a0652b' stroke-width='" + r1(kk * 0.07) + "'"), ell(tm, kk * 0.08, kk * 0.08, "#a0652b"));
    o.push(applique(-XW + 0.02, 2.4, 5.4), applique(XW - 0.02, 2.4, 5.4));
    o.push(busto("Capitano", -0.62, z0 + 0.82), busto("Marina", 0.62, z0 + 0.82));
    var yT = tavoloLegno(o, 0, z0, 1.2, 0.52, "#9c6b3f");
    o.push(pozza(0, yT, z0 + 0.1, 0.95));
    navale(o, 0, z0 + 0.02, yT, 1.35);
    o.push(lampada(0, z0 + 0.1, 2.6, "#d9b36c", 0.4));
    return { o: o.join(""), feltro: ["#1d9a57", "#0d6136"], legno: ["#6b4226", "#3d2416"], pozza: "#fff3c4" };
  }

  var DISEGNI = { blackjack: salaBJ, scopa: salaScopa, scopa2v2: salaScopa2, scopone: salaScopone, poker: salaPoker, tris: salaTris, drop4: salaForza4, navale: salaNavale };

  // =========================================================
  //  IL SALONE: entri e lo guardi in prima persona, all'altezza degli occhi.
  //  In fondo il bar con l'insegna, ai lati le slot, in alto i lampadari;
  //  a sinistra il tavolo del Black Jack, a destra quello del Poker.
  //  Toccando un tavolo ci si avvicina (in core.js) fino alla sua sala qui sopra.
  // =========================================================
  // si entra da una scalinata: gli occhi più in alto del pavimento della sala, lo sguardo un po' in giù
  var CAM_SALONE = { HY: 335, F: 300, EYE: 2.6, PITCH: 14, XW: 4.4, ZB: 14, YT: 5.0 };
  var TAVOLI = [
    { id: "blackjack", nome: "Black Jack", insegna: "BLACK JACK", stile: "bj", x: -1.2, z: 3.5 },
    { id: "poker",     nome: "Poker",      insegna: "POKER",      stile: "pk", x: 1.4, z: 4.2 }
  ];
  // dietro ai due tavoli principali, altri tavoli dello stesso gioco: la sala è piena e profonda
  var TAVOLI_FONDO = [
    { id: "blackjack", x: -2.15, z: 6.7,  nomi: ["Ugo", "Bice", "Nello", "Tina"] },
    { id: "blackjack", x: -2.0,  z: 10.0, nomi: ["Ezio", "Pia", "Dino", "Lucia"] },
    { id: "poker",     x: 2.2,   z: 7.5,  nomi: ["Raffa", "Olga", "Ciro", "Nadia"] },
    { id: "poker",     x: 2.05,  z: 10.8, nomi: ["Aldo", "Ines", "Toto", "Vera"] }
  ];
  var KB = 1.1;   // grandezza delle persone al tavolo (nel salone un po' più piccole)
  // disegna con la telecamera del salone, poi rimette quella delle sale
  function conCamera(c, fn) {
    var v = [HY, F, EYE, XW, ZB, YT, CP, SP, KB], a = (c.PITCH || 0) * Math.PI / 180;
    HY = c.HY; F = c.F; EYE = c.EYE; XW = c.XW; ZB = c.ZB; YT = c.YT; CP = Math.cos(a); SP = Math.sin(a); KB = 0.86;
    try { return fn(); } finally { HY = v[0]; F = v[1]; EYE = v[2]; XW = v[3]; ZB = v[4]; YT = v[5]; CP = v[6]; SP = v[7]; KB = v[8]; }
  }
  // una persona in piedi, tutta intera (i piedi a terra in x, z)
  function inPiedi(nome, x, z) {
    if (!window.SGOmino) return "";
    var h = 2.05 * F / (z * CP + EYE * SP), w = h * 200 / 264, p = P(x, 0, z);
    return "<image xlink:href=\"data:image/svg+xml;charset=utf-8," + encodeURIComponent(SGOmino.svg(SGOmino.casuale(nome), {})) + "\" x='" + r1(p[0] - w / 2) + "' y='" + r1(p[1] - h * 253 / 264) + "' width='" + r1(w) + "' height='" + r1(h) + "'/>";
  }
  function slot(lato, z, n) {   // una slot machine contro la parete (lato -1 sinistra, 1 destra), girata verso il corridoio
    var xo = lato * XW, xi = lato * (XW - 0.62), x0 = Math.min(xo, xi), x1 = Math.max(xo, xi), d = 0.7, h = 1.5, o = [];
    var luci = ["#ff4fd8", "#ffd43b", "#4dabf7", "#69db7c"];
    o.push(poly(qFondo(x0, x1, 0, h, z), "#2b2b35"));
    o.push(poly(qLato(xi, z, z + d, 0, h), "#1d1d26"));
    o.push(poly(qPiano(x0, x1, z, z + d, h), "#3f3f4c"));
    o.push(poly(qLato(xi, z + 0.06, z + d - 0.06, 1.3, 1.46), luci[n % luci.length]));   // la luce in cima
    o.push(poly(qLato(xi, z + 0.09, z + d - 0.09, 0.86, 1.22), "#0b1f3a"));              // lo schermo coi rulli
    for (var r = 0; r < 3; r++) {
      var zz = z + 0.13 + r * 0.155;
      o.push(poly(qLato(xi, zz, zz + 0.13, 0.92, 1.16), "#fff8e1"));
      var c = P(xi, 1.04, zz + 0.065);
      o.push(ell(c, Math.max(0.8, 0.035 * F / (zz + 0.065)), Math.max(0.8, 0.04 * F / (zz + 0.065)), ["#e03131", "#f2b705", "#2b8a3e"][(n + r) % 3]));
    }
    o.push(poly(qLato(xi, z + 0.08, z + d - 0.08, 0.72, 0.8), "#c9a24a"));
    var xs = xi - lato * 0.42, sg = tondo(xs, 0.7, z + d / 2, 0.17);   // lo sgabello
    o.push(linea(P(xs, 0, z + d / 2), P(xs, 0.7, z + d / 2), "#8a6a2c", Math.max(1, 0.04 * F / (z + d / 2))));
    o.push(ell(sg.c, sg.rx, sg.ry * 1.6, "#7a1220", "stroke='#4a0a12' stroke-width='1'"));
    return o.join("");
  }
  function lampadario(x, z, y) {   // il lampadario di cristallo, coi pendagli e la luce intorno
    var c = P(x, y, z), k = F / z, o = [];
    o.push(linea(P(x, YT, z), P(x, y + 0.35, z), "#b08a3a", Math.max(1, k * 0.015)));
    o.push(ell([c[0], c[1] + k * 0.1], k * 1.5, k * 1.0, "url(#gAlone)"));
    [[0.62, 0.0], [0.44, 0.2], [0.24, 0.38]].forEach(function (g, i) {
      var t = tondo(x, y + g[1], z, g[0]);
      o.push(ell(t.c, t.rx, t.ry, "none", "stroke='#e9c46a' stroke-width='" + r1(Math.max(1, k * 0.02)) + "'"));
      for (var a = 0; a < 14 - i * 3; a++) {   // i pendagli lungo l'anello
        var an = a / (14 - i * 3) * Math.PI * 2, px = t.c[0] + t.rx * Math.cos(an), py = t.c[1] + t.ry * Math.sin(an);
        o.push(linea([px, py], [px, py + k * 0.12], "#fff4d6", Math.max(0.6, k * 0.012), "opacity='.85'"));
        o.push(ell([px, py + k * 0.13], k * 0.022, k * 0.032, "#fffbe8"));
      }
    });
    o.push(ell(c, k * 0.16, k * 0.1, "#e9c46a"), ell([c[0], c[1] - k * 0.03], k * 0.08, k * 0.05, "#fff7d6"));
    return o.join("");
  }
  // il tavolo del Black Jack a mezzaluna (come nella sua sala), spostato di lato
  function tavoloBJ(cx, z0, nomi) {
    var R = 1.0, yT = 0.87, o = [], posti = [150, 110, 70, 32]; nomi = nomi || ["Rosa", "Peppe", "Lina", "Tonio"];
    posti.forEach(function (a, i) { var t = a * Math.PI / 180, r = R + 0.32; o.push(busto(nomi[i], cx + r * Math.cos(t), z0 + r * Math.sin(t))); });
    var om = tondo(cx, 0, z0 + 0.4, 0.95);
    o.push(ell(om.c, om.rx, om.ry, "#000000", "opacity='.3'"));
    o.push(poly(qFondo(cx - 0.26, cx + 0.26, 0, yT - 0.08, z0 + 0.4), "#2a140b"), poly(qFondo(cx - 0.52, cx + 0.52, 0, 0.06, z0 + 0.4), "#2a140b"));
    o.push(poly(qFondo(cx - R - 0.14, cx + R + 0.14, yT - 0.1, yT + 0.02, z0), "url(#gLegno)"));
    o.push(poly(ovale(R + 0.14, R + 0.14, yT + 0.02, z0, 0, Math.PI, 40, cx), "#2a160d"));
    o.push(poly(ovale(R, R, yT, z0, 0, Math.PI, 40, cx), "url(#gFeltro)"));
    o.push(pozza(cx - 0.5, yT, z0 + 0.5, 0.65), pozza(cx + 0.5, yT, z0 + 0.5, 0.65));
    posti.forEach(function (a, i) {
      var t = a * Math.PI / 180;
      o.push(pila(cx + 0.95 * Math.cos(t), z0 + 0.95 * Math.sin(t), 3 + (i * 2) % 4, FICHE[i % FICHE.length], yT));
      o.push(carta(cx + 0.66 * Math.cos(t) - 0.04, z0 + 0.66 * Math.sin(t), a - 82, yT, ["c", "p", "q", "f"][i]), carta(cx + 0.66 * Math.cos(t) + 0.05, z0 + 0.66 * Math.sin(t) - 0.02, a - 96, yT, ["p", "q", "f", "c"][i]));
    });
    o.push(carta(cx - 0.08, z0 + 0.36, 4, yT, "c"), carta(cx + 0.08, z0 + 0.36, -3, yT, null, "#b02a37"));
    o.push(poly(qPiano(cx - 0.4, cx + 0.4, z0 + 0.05, z0 + 0.22, yT + 0.01), "#1b1b1b"));
    for (var s = 0; s < 8; s++) { var x0 = cx - 0.38 + s * 0.095; o.push(poly(qPiano(x0 + 0.012, x0 + 0.083, z0 + 0.07, z0 + 0.2, yT + 0.02), FICHE[s % FICHE.length])); }
    o.push(lampada(cx - 0.5, z0 + 0.45, 2.75, "#7a1222"), lampada(cx + 0.5, z0 + 0.45, 2.75, "#7a1222"));
    return o.join("");
  }
  // il tavolo ovale del Poker (come nella sua sala), spostato di lato
  function tavoloPoker(cx, z0, nomi) {
    var rx = 1.3, rz = 0.72, yT = 0.86, o = [], posti = [150, 116, 82, 48]; nomi = nomi || ["Matt", "Giada", "Bruno", "Sofia"];
    posti.forEach(function (g, i) { var t = g * Math.PI / 180; o.push(busto(nomi[i], cx + 1.55 * Math.cos(t), z0 + 0.95 * Math.sin(t), 1.0)); });
    o.push(ell(tondo(cx, 0, z0, 1.2).c, 1.2 * F / z0, 0.35 * F / z0, "#000000", "opacity='.3'"));
    o.push(poly(qFondo(cx - 0.5, cx + 0.5, 0, 0.6, z0 - 0.2), "#0c0c0c"));
    var vicino = ovale(rx, rz, yT, z0, Math.PI, 2 * Math.PI, 30, cx), sotto = ovale(rx, rz, yT - 0.12, z0, 2 * Math.PI, Math.PI, 30, cx);
    o.push(poly(vicino.concat(sotto), "#0f0f0f"));
    o.push(poly(ovale(rx, rz, yT, z0, 0, 2 * Math.PI, 60, cx), "#1b1b1b"));
    o.push(poly(ovale(rx - 0.14, rz - 0.1, yT + 0.005, z0, 0, 2 * Math.PI, 60, cx), "#6b3f1e"));
    o.push(poly(ovale(rx - 0.21, rz - 0.15, yT + 0.006, z0, 0, 2 * Math.PI, 60, cx), "url(#gFeltro2)"));
    o.push(pozza(cx, yT, z0, 0.95));
    ["c", "p", "q", "f", "c"].forEach(function (s, i) { o.push(carta(cx - 0.28 + i * 0.14, z0 + 0.1, 0, yT + 0.01, i < 4 ? s : null, "#1d4ed8", 1.1)); });
    o.push(pila(cx - 0.1, z0 - 0.2, 6, "#e03131", yT), pila(cx + 0.06, z0 - 0.24, 4, "#212529", yT), pila(cx + 0.2, z0 - 0.18, 5, "#1c7ed6", yT));
    posti.forEach(function (g, i) {
      var t = g * Math.PI / 180, x = cx + 0.9 * Math.cos(t), z = z0 + 0.48 * Math.sin(t);
      o.push(carta(x - 0.05, z, -8, yT + 0.01, null, "#1d4ed8"), carta(x + 0.05, z - 0.01, 7, yT + 0.01, null, "#1d4ed8"));
    });
    var w1 = P(cx - 0.8, 2.62, z0), w2 = P(cx + 0.8, 2.62, z0), w3 = P(cx + 0.95, 2.45, z0), w4 = P(cx - 0.95, 2.45, z0);
    o.push(linea(P(cx - 0.6, YT, z0), P(cx - 0.6, 2.62, z0), "#0c0c0c", 1.2), linea(P(cx + 0.6, YT, z0), P(cx + 0.6, 2.62, z0), "#0c0c0c", 1.2));
    o.push("<ellipse cx='" + r1((w3[0] + w4[0]) / 2) + "' cy='" + r1(w3[1] + 5) + "' rx='" + r1((w3[0] - w4[0]) * 0.75) + "' ry='" + r1(F / z0 * 0.4) + "' fill='url(#gAlone)'/>");
    o.push(poly([w1, w2, w3, w4], "#1f6f43"), poly([w4, w3, [w3[0], w3[1] + 2.5], [w4[0], w4[1] + 2.5]], "#fff1bf"));
    return o.join("");
  }
  // la scalinata di marmo da cui si entra (in primo piano), con la passatoia rossa e i bordi d'oro
  function scalinata() {
    var o = [], gradini = [[0.6, 0.4, 1.3], [0.4, 1.3, 1.62], [0.2, 1.62, 1.94]];   // [altezza, da z, a z]
    gradini.forEach(function (g, i) {
      o.push(poly(qPiano(-XW, XW, g[1], g[2], g[0]), i % 2 ? "#b9a581" : "#c7b48f"));
      for (var x = -XW + 0.3; x < XW; x += 0.9) o.push(linea(P(x, g[0], g[1]), P(x + 0.35, g[0], g[2]), "#9c8763", 0.8, "opacity='.6'"));   // le venature
      o.push(poly(qPiano(-0.62, 0.62, g[1], g[2], g[0] + 0.002), "#8c1022"), poly(qPiano(-0.55, 0.55, g[1], g[2], g[0] + 0.003), "#a3132a"));
      o.push(poly(qPiano(-XW, XW, g[2] - 0.05, g[2], g[0] + 0.004), "#c9a24a"));   // il bordo d'oro del gradino
      o.push(poly(qPiano(-0.66, 0.66, g[2] - 0.05, g[2], g[0] + 0.005), "#e9c46a"));
    });
    return o.join("");
  }
  function disegnoSalone() {
    var o = [], x, z, i, k;
    // il soffitto a cassettoni
    o.push(poly(qPiano(-XW, XW, 1, ZB, YT), "url(#gSoff)"));
    for (x = -XW + 1.1; x < XW; x += 1.1) o.push(linea(P(x, YT, 2.4), P(x, YT, ZB), "#8a6a2c", 1, "opacity='.45'"));
    for (z = 3.2; z < ZB; z += 1.4) o.push(linea(P(-XW, YT, z), P(XW, YT, z), "#8a6a2c", 1, "opacity='.45'"));
    // le pareti: tappezzeria rossa, zoccolo scuro, cornice d'oro, lesene dorate
    o.push(poly(qFondo(-XW, XW, 0, YT, ZB), "#4b0b17"));
    for (x = -XW + 0.12; x < XW; x += 0.46) o.push(poly(qFondo(x, x + 0.2, 0, YT, ZB), "#560e1b"));
    o.push(poly(qLato(-XW, 1, ZB, 0, YT), "#3a0812"), poly(qLato(XW, 1, ZB, 0, YT), "#3a0812"));
    for (z = 2; z < ZB; z += 0.62) o.push(poly(qLato(-XW, z, z + 0.28, 0, YT), "#420a15"), poly(qLato(XW, z, z + 0.28, 0, YT), "#420a15"));
    o.push(poly(qLato(-XW, 1, ZB, 0, 0.95), "#22050a"), poly(qLato(XW, 1, ZB, 0, 0.95), "#22050a"), poly(qFondo(-XW, XW, 0, 0.95, ZB), "#2a060d"));
    o.push(poly(qLato(-XW, 1, ZB, YT - 0.22, YT), "#8a6424"), poly(qLato(XW, 1, ZB, YT - 0.22, YT), "#8a6424"), poly(qFondo(-XW, XW, YT - 0.22, YT, ZB), "#9c7330"));
    for (z = 4; z < ZB; z += 2.5) [-XW, XW].forEach(function (xx) {
      o.push(poly(qLato(xx, z - 0.2, z + 0.2, 0, YT), "#7a5520"), poly(qLato(xx, z - 0.13, z + 0.13, 0.35, YT - 0.35), "#b08436"));
    });
    for (z = 5.25; z < ZB; z += 2.5) o.push(applique(-XW + 0.02, 2.75, z), applique(XW - 0.02, 2.75, z));
    // in fondo il bar: le mensole con le bottiglie illuminate, l'insegna, il barista, il banco e gli sgabelli
    var zb = ZB - 0.02, cb = P(0, 2.1, zb);
    o.push(ell(cb, 2.6 * F / ZB, 1.4 * F / ZB, "url(#gAlone)"));
    o.push(poly(qFondo(-2.3, 2.3, 1.25, 2.95, zb), "#1c0b07"));
    var colB = ["#2b8a3e", "#c92a2a", "#f2b705", "#1c7ed6", "#e8590c", "#ced4da", "#862e9c"];
    [1.32, 2.06].forEach(function (y, r) {
      for (x = -2.15, i = 0; x < 2.1; x += 0.17, i++) {
        var hb = 0.26 + ((i * 7 + r * 3) % 5) * 0.04;
        o.push(poly(qFondo(x, x + 0.1, y, y + hb, zb - 0.01), colB[(i + r * 2) % colB.length], "opacity='.92'"));
        o.push(poly(qFondo(x + 0.035, x + 0.065, y + hb, y + hb + 0.1, zb - 0.01), colB[(i + r * 2) % colB.length]));
      }
      o.push(poly(qFondo(-2.3, 2.3, y - 0.05, y, zb - 0.01), "#c9a24a"));
    });
    o.push(poly(qFondo(-2.45, 2.45, 2.95, 3.05, zb), "#c9a24a"));
    var ins = P(0, 3.55, zb), kb = F / ZB;
    ["#ff4fd8", "#ffe3fa"].forEach(function (col, j) {
      o.push("<text x='" + r1(ins[0]) + "' y='" + r1(ins[1]) + "' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='" + r1(kb * 0.52) + "' letter-spacing='" + r1(kb * 0.05) + "' fill='none' stroke='" + col + "' stroke-width='" + (j ? 0.9 : 2.6) + "' text-anchor='middle'" + (j ? "" : " opacity='.5' filter='url(#fNeon)'") + ">SPeeD CASINÒ</text>");
    });
    o.push(busto("Nando", 0.5, ZB - 0.5, 1.15), busto("Ivana", -1.3, ZB - 0.5, 1.15));
    o.push(poly(qPiano(-2.5, 2.5, ZB - 1.3, ZB - 0.75, 1.12), "#5a2a12"), poly(qFondo(-2.5, 2.5, 0, 1.12, ZB - 1.3), "#3a1a0c"));
    o.push(linea(P(-2.5, 1.12, ZB - 1.3), P(2.5, 1.12, ZB - 1.3), "#e9c46a", 1.2));
    for (x = -2.1; x < 2.2; x += 0.7) o.push(poly(qFondo(x, x + 0.48, 0.15, 0.95, ZB - 1.31), "none", "stroke='#7a4a22' stroke-width='.8'"));
    // il pavimento: moquette rossa coi rombi d'oro e la passatoia fino al bar
    o.push(poly(qPiano(-XW, XW, 1, ZB, 0), "#5a0c19"));
    for (z = 1.6, i = 0; z < ZB; z += 0.75, i++) for (x = -XW + (i % 2) * 0.375; x < XW; x += 0.75)
      o.push(poly([P(x, 0, z - 0.13), P(x + 0.13, 0, z), P(x, 0, z + 0.13), P(x - 0.13, 0, z)], "#8c2a1c", "opacity='.75'"));
    o.push(poly(qPiano(-0.6, 0.6, 1, ZB - 1.4, 0), "#2b0610"));
    [-0.6, -0.5, 0.5, 0.6].forEach(function (xx) { o.push(linea(P(xx, 0, 1), P(xx, 0, ZB - 1.4), "#c9a24a", 1, "opacity='.8'")); });
    o.push(pozza(0, 0, 3.4, 1.7), pozza(0, 0, 8, 1.8), pozza(0, 0, 12, 1.6));
    o.push(poly(qFondo(-XW, XW, 0, 0.3, ZB - 0.01), "url(#gOmbraMuro)"));
    // le slot machine lungo le pareti (dalle più lontane)
    for (z = 12.6, k = 0; z > 6.2; z -= 0.92, k++) o.push(slot(-1, z, k), slot(1, z, k + 2));
    // chi passeggia
    o.push(inPiedi("Mimì", -0.3, 11.6), inPiedi("Gegè", 1.0, 9.6), inPiedi("Fefè", -1.0, 8.7));
    // i lampadari
    o.push(lampadario(0, 8.2, 4.15));
    // i tavoli: prima il più lontano
    var tv = TAVOLI.concat(TAVOLI_FONDO).sort(function (a, b) { return b.z - a.z; });   // prima i più lontani
    tv.forEach(function (t) { o.push(t.id === "poker" ? tavoloPoker(t.x, t.z, t.nomi) : tavoloBJ(t.x, t.z, t.nomi)); });
    o.push(lampadario(0, 4.6, 4.25));
    o.push(scalinata());
    return o.join("");
  }
  // =========================================================
  //  IL CIRCOLO: l'atrio con le porte aperte (si intravedono le sale), la Sala delle Carte
  //  e la Sala dei Giochi da Tavolo. Stesse regole del salone del Casinò.
  // =========================================================
  var CAM_ATRIO = { HY: 330, F: 290, EYE: 1.65, PITCH: 0, XW: 2.9, ZB: 4, YT: 3.4 };
  var CAM_SALA = { HY: 330, F: 318, EYE: 2.3, PITCH: 12, XW: 3.6, ZB: 9, YT: 3.4 };
  var PORTE = { carte: [-2.0, -0.85], giardino: [-0.45, 0.45], tavolo: [0.85, 2.0] }, HP = 2.4;
  function giocatori(o, nomi, cx, z, passo, k) {   // le persone sedute dall'altra parte del tavolo
    nomi.forEach(function (n, i) { o.push(busto(n, cx + (i - (nomi.length - 1) / 2) * passo, z, k)); });
  }
  function carteInTavola(o, cx, z0, yT, k) {   // la Scopa in corso: quattro carte in tavola e le carte in mano coperte
    [["denari", -0.3, 8], ["coppe", -0.1, -6], ["spade", 0.1, 5], ["bastoni", 0.3, -9]].forEach(function (c) { o.push(carta(cx + c[1] * k, z0, c[2], yT, c[0], null, 1.15 * k)); });
  }
  // una stanzetta dietro una porta dell'atrio (si vede solo dal vano della porta)
  function stanzetta(o, x0, x1, muro, pav1, pav2, q) {
    var z0 = ZB + 0.12, z1 = ZB + 4.4, yS = 3.0, x, z, i, j;
    o.push(poly(qPiano(x0, x1, z0, z1, yS), "#2a1a10"));
    o.push(poly(qFondo(x0, x1, 0, yS, z1), muro), poly(qFondo(x0, x1, 0, 0.9, z1), tono(muro, -0.35)));
    o.push(poly(qPiano(x0, x1, z0, z1, 0), pav1));
    for (z = z1, i = 0; z > z0; z -= q, i++) for (x = x0, j = 0; x < x1 - 0.01; x += q, j++) if ((i + j) % 2) o.push(poly(qPiano(x, x + q, Math.max(z0, z - q), z, 0), pav2));
    o.push(ell(P((x0 + x1) / 2, 2.2, z1 - 1.5), 2.4 * F / z1, 1.6 * F / z1, "url(#gAlone)"));   // la luce calda della sala
  }
  function disegnoAtrio() {
    var o = [], x, z, i, k = F / ZB;
    // 1) le sale dietro le porte: a sinistra le carte, a destra i giochi da tavolo
    stanzetta(o, -5.2, -0.6, "#cf8f52", "#b4552e", "#9c4626", 0.45);
    var lc = -2.05, zc = ZB + 2.3, yT;
    giocatori(o, ["Ciccio", "Carmela"], lc, zc + 0.8, 0.78);
    yT = tavoloTovaglia(o, zc, 0.72, 0.42, "#f4ede1", "#d33a3a", lc);
    carteInTavola(o, lc, zc, yT, 1);
    o.push(inPiedi("Gegè", -3.3, ZB + 3.4), lampada(lc, zc + 0.1, 2.2, "#2f6b4f", 0.3));
    stanzetta(o, 0.6, 5.2, "#35607a", "#9a6a42", "#8d613b", 0.3);
    var rc = 2.05;
    for (i = 0; i < 3; i++) for (x = 2.2; x < 4.6; x += 0.32) o.push(poly(qFondo(x, x + 0.26, 1.2 + i * 0.5, 1.2 + i * 0.5 + 0.22 + ((x * 7 + i) % 3) * 0.05, ZB + 4.39), ["#e03131", "#fcc419", "#1c7ed6", "#2b8a3e", "#f08c00", "#7048e8"][Math.floor(x * 3 + i) % 6]));   // lo scaffale dei giochi
    giocatori(o, ["Totò", "Mimma"], rc, zc + 0.8, 1.15);
    yT = tavoloLegno(o, rc, zc, 0.75, 0.42, "#8a5a34");
    forza4(o, rc, zc + 0.05, yT, 0.72);
    o.push(lampada(rc, zc + 0.1, 2.2, "#e8dcc0", 0.3));
    // 2) il soffitto con le travi e il pavimento di legno col tappeto
    o.push(poly(qPiano(-XW, XW, 1, ZB, YT), "#efe2c4"));
    [1.9, 2.7, 3.5].forEach(function (zt) { o.push(poly(qPiano(-XW, XW, zt - 0.11, zt + 0.11, YT - 0.2), "#4a2c18"), poly(qFondo(-XW, XW, YT - 0.2, YT, zt - 0.11), "#6b4226")); });
    o.push(poly(qPiano(-XW, XW, 1, ZB, 0), "#8a5a34"));
    for (x = -XW; x < XW; x += 0.24) { o.push(linea(P(x, 0, 1), P(x, 0, ZB), "#6e4528", 0.7)); for (z = 1 + ((x * 10) % 3) * 0.3; z < ZB; z += 0.95) o.push(linea(P(x, 0, z), P(x + 0.24, 0, z), "#6e4528", 0.6)); }
    o.push(poly(qPiano(-1.15, 1.15, 1.6, 3.5, 0.002), "#7a1f2b"), poly(qPiano(-1.0, 1.0, 1.75, 3.35, 0.003), "#c9a24a"), poly(qPiano(-0.94, 0.94, 1.81, 3.29, 0.004), "#8c2a33"));
    o.push(poly([P(0, 0.005, 1.95), P(0.55, 0.005, 2.55), P(0, 0.005, 3.15), P(-0.55, 0.005, 2.55)], "#1f3b57"), poly([P(0, 0.006, 2.15), P(0.3, 0.006, 2.55), P(0, 0.006, 2.95), P(-0.3, 0.006, 2.55)], "#c9a24a"));
    // 3) la parete di fondo coi vani delle porte: in alto verde, in basso la boiserie di noce
    var pieni = [[-XW, PORTE.carte[0]], [PORTE.carte[1], PORTE.giardino[0]], [PORTE.giardino[1], PORTE.tavolo[0]], [PORTE.tavolo[1], XW]];
    function muro(a, b, y0, y1) {
      o.push(poly(qFondo(a, b, Math.max(y0, 1.0), y1, ZB), "#2f5d4a"));
      for (x = a + 0.08; x < b - 0.05; x += 0.36) o.push(poly(qFondo(x, Math.min(b, x + 0.16), Math.max(y0, 1.0), y1, ZB - 0.001), "#33654f"));
      if (y0 < 1.0) { o.push(poly(qFondo(a, b, y0, 1.0, ZB), "#5a3a22")); for (x = a + 0.06; x < b - 0.2; x += 0.55) o.push(poly(qFondo(x, Math.min(b - 0.06, x + 0.45), 0.14, 0.86, ZB - 0.002), "none", "stroke='#7a5230' stroke-width='1'")); o.push(poly(qFondo(a, b, 0.98, 1.05, ZB - 0.003), "#c9a24a")); }
    }
    pieni.forEach(function (p) { muro(p[0], p[1], 0, YT); });
    ["carte", "giardino", "tavolo"].forEach(function (kp) { var p = PORTE[kp]; muro(p[0], p[1], HP, YT); });
    o.push(poly(qFondo(-XW, XW, YT - 0.16, YT, ZB - 0.004), "#c9a24a"));
    // le porte: cornice di noce, lo spessore del muro, la soglia di marmo
    ["carte", "tavolo"].forEach(function (kp) {
      var a = PORTE[kp][0], b = PORTE[kp][1], esterno = kp === "carte" ? a : b;
      o.push(poly(qLato(esterno, ZB, ZB + 0.25, 0, HP), "#4a2c18"), poly(qPiano(a, b, ZB, ZB + 0.25, HP), "#3a2214"), poly(qPiano(a, b, ZB, ZB + 0.25, 0.004), "#d8cbb0"));
      o.push(poly(qFondo(a - 0.1, a, 0, HP + 0.1, ZB - 0.005), "#7a4f2a"), poly(qFondo(b, b + 0.1, 0, HP + 0.1, ZB - 0.005), "#7a4f2a"), poly(qFondo(a - 0.14, b + 0.14, HP + 0.08, HP + 0.2, ZB - 0.006), "#8a5a32"));
    });
    // la porta del giardino: chiusa, a vetri, con la luce verde dietro
    var g0 = PORTE.giardino[0], g1 = PORTE.giardino[1], zg = ZB + 0.08;
    o.push(poly(qFondo(g0, g1, 0, HP, zg), "#5a3a22"));
    [g0 + 0.06, (g0 + g1) / 2 + 0.03].forEach(function (a) {
      for (i = 0; i < 3; i++) {
        var y0 = 0.95 + i * 0.47;
        o.push(poly(qFondo(a, a + 0.36, y0, y0 + 0.4, zg - 0.001), "#9fd38a"), poly(qFondo(a + 0.04, a + 0.17, y0 + 0.2, y0 + 0.38, zg - 0.002), "#d8f5c4", "opacity='.6'"));
      }
      o.push(poly(qFondo(a + 0.03, a + 0.33, 0.12, 0.82, zg - 0.001), "none", "stroke='#7a5230' stroke-width='1'"));
    });
    o.push(linea(P(0, 0, zg - 0.003), P(0, HP, zg - 0.003), "#3a2214", 1.5), ell(P(-0.07, 1.05, zg - 0.004), 2.2, 2.2, "#e9c46a"), ell(P(0.07, 1.05, zg - 0.004), 2.2, 2.2, "#e9c46a"));
    o.push(poly(qFondo(g0 - 0.1, g0, 0, HP + 0.1, ZB - 0.005), "#7a4f2a"), poly(qFondo(g1, g1 + 0.1, 0, HP + 0.1, ZB - 0.005), "#7a4f2a"), poly(qFondo(g0 - 0.14, g1 + 0.14, HP + 0.08, HP + 0.2, ZB - 0.006), "#8a5a32"));
    // l'orologio sopra la porta del giardino e le applique
    var ck = P(0, 2.95, ZB - 0.01);
    o.push(ell(ck, k * 0.24, k * 0.24, "#f8f1df", "stroke='#8a5a32' stroke-width='" + r1(k * 0.04) + "'"), linea(ck, [ck[0], ck[1] - k * 0.15], "#212529", 1.4), linea(ck, [ck[0] + k * 0.1, ck[1] + k * 0.04], "#212529", 1.4));
    o.push(applique(-0.65, 1.9, ZB - 0.01), applique(0.65, 1.9, ZB - 0.01), applique(-2.55, 1.9, ZB - 0.01), applique(2.55, 1.9, ZB - 0.01));
    o.push(lampada(0, 1.9, 2.8, "#c79a4b", 0.26));
    return o.join("");
  }
  // la Sala delle Carte: osteria calda, col cotto, i mattoni, il Settebello e la lavagna dei punti
  function disegnoCarte() {
    var o = [], yT;
    o.push(stanza({ parete: "#d39a5e", righe: null, lato: "#a3703f", zoccolo: "#6b4226", cornice: "#4a2c18", zoccoloH: 1.0,
      pav1: "#b4552e", pav2: "#9c4626", fughe: "#7d3a1f", quadro: 0.5, extraPareti: mattoni(-3.3, -2.2, 1.3, 2.3) + mattoni(2.4, 3.3, 2.4, 3.1) }));
    o.push(poly(qPiano(-XW, XW, 0.9, ZB, YT), "#e6d2ac"));   // il soffitto chiaro, con le travi
    [2.4, 4.2, 6.0, 7.8].forEach(function (zt) { o.push(poly(qPiano(-XW, XW, zt - 0.12, zt + 0.12, YT - 0.18), "#4a2c18"), poly(qFondo(-XW, XW, YT - 0.18, YT, zt - 0.12), "#6b4226")); });
    // il Settebello in cornice e la lavagna dei punti di Noi e Loro
    o.push(cornice(-2.0, -1.2, 1.7, 2.75, "#4a2c18", "#f3ead2"));
    [[-0.17, 2.6], [0.17, 2.6], [0, 2.4], [-0.17, 2.2], [0.17, 2.2], [-0.17, 1.98], [0.17, 1.98]].forEach(function (p) {
      var c = P(p[0] - 1.6, p[1] - 0.08, ZB - 0.03), rr = 0.075 * F / ZB;
      o.push(ell(c, rr, rr, "#f2b705", "stroke='#c92a2a' stroke-width='1'"), ell(c, rr * 0.4, rr * 0.4, "#c92a2a"));
    });
    var kk = F / ZB;
    o.push(lavagnetta(-0.7, 0.7, 1.75, 2.75, function () {
      var a = P(-0.35, 2.5, ZB - 0.03), b = P(0.35, 2.5, ZB - 0.03), s = linea(P(0, 2.7, ZB - 0.03), P(0, 1.85, ZB - 0.03), "#e9ecef", 1, "opacity='.8'");
      s += "<text x='" + r1(a[0]) + "' y='" + r1(a[1]) + "' font-family='Comic Sans MS,Segoe Print,cursive' font-size='" + r1(kk * 0.2) + "' fill='#f1f3f5' text-anchor='middle'>NOI</text>";
      s += "<text x='" + r1(b[0]) + "' y='" + r1(b[1]) + "' font-family='Comic Sans MS,Segoe Print,cursive' font-size='" + r1(kk * 0.2) + "' fill='#f1f3f5' text-anchor='middle'>LORO</text>";
      for (var i = 0; i < 5; i++) { s += linea(P(-0.5 + i * 0.07, 2.3, ZB - 0.03), P(-0.5 + i * 0.07, 2.05, ZB - 0.03), "#f8f9fa", 1, "opacity='.85'"); if (i < 3) s += linea(P(0.2 + i * 0.07, 2.3, ZB - 0.03), P(0.2 + i * 0.07, 2.05, ZB - 0.03), "#f8f9fa", 1, "opacity='.85'"); }
      return s;
    }));
    o.push(applique(-XW + 0.02, 2.2, 6.6), applique(XW - 0.02, 2.2, 6.6));
    // lo Scopone in fondo: tavolo col panno verde
    var zs = 6.9;
    giocatori(o, ["Pino", "Mena", "Totò", "Lia"], 0, zs + 0.92, 0.66, 0.98);
    o.push(poly(qFondo(-1.1, -1.0, 0, 0.8, zs - 0.45), "#3d2416"), poly(qFondo(1.0, 1.1, 0, 0.8, zs - 0.45), "#3d2416"));
    o.push(poly(qPiano(-1.2, 1.2, zs - 0.55, zs + 0.55, 0.82), "#6b4226"), poly(qPiano(-1.1, 1.1, zs - 0.47, zs + 0.47, 0.821), "url(#gFeltro)"), poly(qFondo(-1.2, 1.2, 0.7, 0.82, zs - 0.55), "url(#gLegno)"));
    [-0.3, -0.1, 0.1, 0.3].forEach(function (x, i) { o.push(carta(x, zs, (i - 1.5) * 8, 0.83, ["denari", "coppe", "spade", "bastoni"][i], null, 1.1)); });
    o.push(lampada(0, zs + 0.1, 2.5, "#e8dcc0", 0.32));
    // la Scopa 2 contro 2 a destra: il festone delle squadre, le tovagliette blu e rosse
    var x2 = 1.55, z2 = 4.4;
    o.push(bandierine(3.0, z2 + 0.4, ["#1c7ed6", "#e03131", "#ffd43b"]));
    giocatori(o, ["Gino", "Teresa", "Sasà", "Nina"], x2, z2 + 0.86, 0.52, 0.95);
    yT = tavoloTovaglia(o, z2, 1.05, 0.48, "#f4ede1", "#d33a3a", x2);
    [0, 1, 2, 3].forEach(function (i) { var x = x2 + (i - 1.5) * 0.52; o.push(poly(qPiano(x - 0.2, x + 0.2, z2 + 0.12, z2 + 0.42, yT + 0.003), i % 2 ? "#e03131" : "#1c7ed6", "opacity='.85'")); });
    carteInTavola(o, x2, z2 - 0.08, yT, 1);
    o.push(lampada(x2 - 0.5, z2 + 0.1, 2.45, "#2f6b4f", 0.28), lampada(x2 + 0.5, z2 + 0.1, 2.45, "#2f6b4f", 0.28));
    // la Scopa a sinistra, in due
    var x1 = -1.5, z1 = 3.7;
    giocatori(o, ["Ciccio", "Carmela"], x1, z1 + 0.82, 0.8);
    yT = tavoloTovaglia(o, z1, 0.75, 0.45, "#f4ede1", "#d33a3a", x1);
    carteInTavola(o, x1, z1, yT, 1);
    o.push(lampada(x1, z1 + 0.1, 2.45, "#2f6b4f", 0.32));
    return o.join("");
  }
  // la Sala dei Giochi da Tavolo: azzurra, col parquet e lo scaffale pieno di scatole di giochi
  function disegnoTavolo() {
    var o = [], yT, x, i;
    o.push(stanza({ parete: "#3f6e8c", righe: "#447595", lato: "#2c5068", righeLato: "#305670", zoccolo: "#6b4226", cornice: "#d9b36c",
      pav1: "#9a6a42", pav2: "#8d613b", quadro: 0.32, fughe: "#6e4a2c" }));
    o.push(poly(qPiano(-XW, XW, 0.9, ZB, YT), "#e8ecef"));   // il soffitto chiaro, con le travi
    [2.4, 4.2, 6.0, 7.8].forEach(function (zt) { o.push(poly(qPiano(-XW, XW, zt - 0.11, zt + 0.11, YT - 0.16), "#5a3a22"), poly(qFondo(-XW, XW, YT - 0.16, YT, zt - 0.11), "#6b4226")); });
    // lo scaffale dei giochi sulla parete di fondo
    var cols = ["#e03131", "#fcc419", "#1c7ed6", "#2b8a3e", "#f08c00", "#7048e8", "#d6336c", "#15aabf"];
    o.push(poly(qFondo(-2.9, -1.0, 0.9, 2.95, ZB - 0.05), "#5a3a22"), poly(qFondo(1.0, 2.9, 0.9, 2.95, ZB - 0.05), "#5a3a22"));
    [[-2.9, -1.0], [1.0, 2.9]].forEach(function (sc, si) {
      for (i = 0; i < 4; i++) {
        var y0 = 1.0 + i * 0.5;
        o.push(poly(qFondo(sc[0], sc[1], y0 - 0.04, y0, ZB - 0.06), "#8a5a32"));
        for (x = sc[0] + 0.06; x < sc[1] - 0.1; x += 0.16) {
          var h = 0.28 + ((x * 13 + i * 5 + si) % 4) * 0.04, c = cols[Math.floor(x * 7 + i * 3 + si * 5 + 40) % cols.length];
          if ((Math.floor(x * 11) + i) % 5 === 0) o.push(poly(qFondo(x, x + 0.4, y0, y0 + 0.09, ZB - 0.07), c), poly(qFondo(x, x + 0.4, y0 + 0.09, y0 + 0.17, ZB - 0.07), cols[(Math.floor(x * 5) + i) % cols.length]));   // scatole sdraiate
          else o.push(poly(qFondo(x, x + 0.13, y0, y0 + h, ZB - 0.07), c), poly(qFondo(x + 0.02, x + 0.11, y0 + h * 0.55, y0 + h * 0.7, ZB - 0.071), "#ffffff", "opacity='.55'"));
        }
      }
    });
    // il quadro col Tris in mezzo
    o.push(cornice(-0.55, 0.55, 1.75, 2.75, "#d9b36c", "#fbfaf4"));
    var kk = F / ZB;
    [[-0.28, 2.45, "X", "#e03131"], [0, 2.18, "O", "#1c7ed6"], [0.28, 2.45, "X", "#e03131"]].forEach(function (m) { var p = P(m[0], m[1], ZB - 0.03); o.push("<text x='" + r1(p[0]) + "' y='" + r1(p[1]) + "' font-family='Arial Black,Arial,sans-serif' font-size='" + r1(kk * 0.32) + "' fill='" + m[3] + "' text-anchor='middle'>" + m[2] + "</text>"); });
    o.push(applique(-XW + 0.02, 2.2, 6.6), applique(XW - 0.02, 2.2, 6.6));
    // la Battaglia Navale in fondo
    var zn = 6.9;
    giocatori(o, ["Capitano", "Marina"], 0, zn + 0.9, 1.0);
    yT = tavoloLegno(o, 0, zn, 1.1, 0.5, "#9c6b3f");
    navale(o, 0, zn + 0.02, yT, 1.15);
    o.push(lampada(0, zn + 0.1, 2.5, "#d9b36c", 0.34));
    // Drop 4 a destra
    var x2 = 1.55, z2 = 4.4;
    giocatori(o, ["Totò", "Mimma"], x2, z2 + 0.8, 1.15);
    yT = tavoloLegno(o, x2, z2, 0.95, 0.45, "#8a5a34");
    forza4(o, x2, z2 + 0.02, yT, 0.85);
    o.push(lampada(x2, z2 + 0.1, 2.45, "#e8dcc0", 0.3));
    // il Tris a sinistra
    var x1 = -1.5, z1 = 3.7;
    giocatori(o, ["Ninni", "Peppino"], x1, z1 + 0.8, 0.8);
    yT = tavoloLegno(o, x1, z1, 0.72, 0.44, "#9c6b3f");
    tris(o, x1, z1 + 0.02, yT, 1.0);
    o.push(lampada(x1, z1 + 0.1, 2.45, "#2f6b4f", 0.3));
    return o.join("");
  }

  // ---- le scene in prima persona: telecamera, disegno, luci e punti da toccare ----
  //      va: { gioco: id } (si entra nella sua sala) | { scena: id } (si passa la porta) | { presto: "testo" }
  function datiSala(id) { return SALE.filter(function (q) { return q.id === id; })[0] || { nome: id, insegna: String(id).toUpperCase(), stile: "bj" }; }
  function puntoTavolo(id, x, z, w, zf, yCart) {
    var s = datiSala(id);
    return { id: id, nome: s.nome, insegna: s.insegna, stile: s.stile, x: x, z: z, w: w, yTop: yCart, yBot: 0.15, zf: zf, fuoco: [x, 0.95, z + 0.35], cartello: [x, yCart, z], va: { gioco: id } };
  }
  function puntoPorta(kp, nome, insegna, stile, va) {
    var a = PORTE[kp][0], b = PORTE[kp][1], x = (a + b) / 2;
    return { id: kp, nome: nome, insegna: insegna, stile: stile, x: x, z: ZB, w: (b - a) / 2 + 0.1, yTop: HP + 0.2, yBot: 0, zf: ZB, fuoco: [x, 1.25, ZB + 0.6], cartello: kp === "giardino" ? [x, 1.95, ZB] : [x, HP + 0.25, ZB], muro: true, va: va };
  }
  var COLORI_SCENA = { feltro: ["#1d9a57", "#0d6136"], feltro2: ["#1f8a55", "#0e5233"], legno: ["#5a2f17", "#2b140a"], pozza: "#ffd98a" };
  var SCENE = {
    salone: { cam: CAM_SALONE, disegno: disegnoSalone, luci: [[0, 4.25, 4.6], [0, 4.15, 8.2]],
      punti: function () { return TAVOLI.map(function (t) { return puntoTavolo(t.id, t.x, t.z, t.id === "poker" ? 1.45 : 1.2, t.z - (t.id === "poker" ? 0.75 : 0.05), 3.25); }); } },
    circolo: { cam: CAM_ATRIO, disegno: disegnoAtrio, luci: [],
      punti: function () { return [
        puntoPorta("carte", "Sala delle Carte", "SALA CARTE", "cr-carte", { scena: "carte" }),
        puntoPorta("giardino", "Giardino", "GIARDINO", "cr-giardino", { presto: "Il giardino apre presto: bocce, freccette e calcio balilla 🌳" }),
        puntoPorta("tavolo", "Giochi da Tavolo", "GIOCHI DA TAVOLO", "cr-tavolo", { scena: "tavolo" }) ]; } },
    carte: { cam: CAM_SALA, disegno: disegnoCarte, luci: [],
      punti: function () { return [puntoTavolo("scopa", -1.5, 3.7, 0.95, 3.25, 2.7), puntoTavolo("scopa2v2", 1.55, 4.4, 1.25, 3.92, 2.8), puntoTavolo("scopone", 0, 6.9, 1.3, 6.35, 2.95)]; } },
    tavolo: { cam: CAM_SALA, disegno: disegnoTavolo, luci: [],
      punti: function () { return [puntoTavolo("tris", -1.5, 3.7, 0.92, 3.26, 2.7), puntoTavolo("drop4", 1.55, 4.4, 1.15, 3.95, 2.8), puntoTavolo("navale", 0, 6.9, 1.25, 6.4, 2.95)]; } }
  };
  // dove stanno sullo schermo (disegno 360×640) i punti, le loro insegne e i luccichii
  function geometria(sc) {
    var punti = sc.punti().map(function (p) {
      var c = [P(p.x - p.w, p.yBot, p.zf), P(p.x + p.w, p.yBot, p.zf), P(p.x - p.w, p.yTop, p.z), P(p.x + p.w, p.yTop, p.z)];
      var xs = c.map(function (q) { return q[0]; }), ys = c.map(function (q) { return q[1]; });
      var cart = p.cartello ? P(p.cartello[0], p.cartello[1], p.cartello[2]) : null, m = Math.min(100, 34 + p.insegna.length * 5.6);   // l'insegna resta dentro lo schermo
      return { id: p.id, nome: p.nome, insegna: p.insegna, stile: p.stile, va: p.va, muro: !!p.muro,
        box: [Math.max(0, Math.min.apply(null, xs)), Math.max(0, Math.min.apply(null, ys) - (cart && !p.muro ? 34 : 0)), Math.min(W, Math.max.apply(null, xs)), Math.min(H, Math.max.apply(null, ys))],
        fuoco: P(p.fuoco[0], p.fuoco[1], p.fuoco[2]), cartello: cart ? [Math.max(m, Math.min(W - m, cart[0])), cart[1]] : null };
    });
    var luci = (sc.luci || []).map(function (l) { var c = P(l[0], l[1], l[2]); return [c[0], c[1], F / l[2]]; });
    return { punti: punti, luci: luci };
  }
  var cacheScene = {}, cachePunti = {};
  // solo dove stanno le cose da toccare (leggero: niente disegno), es. per sapere quali giochi ci sono dietro le porte
  function punti(id) {
    var sc = SCENE[id]; if (!sc) return null;
    if (!cachePunti[id]) cachePunti[id] = conCamera(sc.cam, function () { return geometria(sc); });
    return cachePunti[id];
  }
  // la scena intera, col disegno pronto da mettere in un'immagine
  function scena(id) {
    if (cacheScene[id]) return cacheScene[id];
    var sc = SCENE[id]; if (!sc) return null;
    var o = conCamera(sc.cam, function () { return sc.disegno(); }), g = punti(id);
    var svg = svgCon({ o: o, feltro: COLORI_SCENA.feltro, feltro2: COLORI_SCENA.feltro2, legno: COLORI_SCENA.legno, pozza: COLORI_SCENA.pozza });
    cacheScene[id] = { img: "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg), punti: g.punti, luci: g.luci };
    return cacheScene[id];
  }

  // la sala intera, pronta da mettere in un'immagine
  function svgSala(id) { return svgCon((DISEGNI[id] || salaBJ)()); }
  function svgCon(d) {
    var defs = "<defs>" +
      "<radialGradient id='gFeltro2' cx='.5' cy='.45' r='.65'><stop offset='0' stop-color='" + (d.feltro2 || d.feltro)[0] + "'/><stop offset='1' stop-color='" + (d.feltro2 || d.feltro)[1] + "'/></radialGradient>" +
      "<linearGradient id='gSoff' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#050304'/><stop offset='1' stop-color='#1d1216'/></linearGradient>" +
      "<radialGradient id='gFeltro' cx='.5' cy='.45' r='.65'><stop offset='0' stop-color='" + d.feltro[0] + "'/><stop offset='1' stop-color='" + d.feltro[1] + "'/></radialGradient>" +
      "<linearGradient id='gLegno' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='" + d.legno[0] + "'/><stop offset='1' stop-color='" + d.legno[1] + "'/></linearGradient>" +
      "<radialGradient id='gPozza'><stop offset='0' stop-color='" + d.pozza + "' stop-opacity='.38'/><stop offset='1' stop-color='" + d.pozza + "' stop-opacity='0'/></radialGradient>" +
      "<radialGradient id='gAlone'><stop offset='0' stop-color='#ffe9a8' stop-opacity='.55'/><stop offset='1' stop-color='#ffe9a8' stop-opacity='0'/></radialGradient>" +
      "<linearGradient id='gOmbraMuro' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#000' stop-opacity='.45'/><stop offset='1' stop-color='#000' stop-opacity='0'/></linearGradient>" +
      "<radialGradient id='gVign' cx='.5' cy='.55' r='.75'><stop offset='.55' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.6'/></radialGradient>" +
      "<linearGradient id='gFondo' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='0'/><stop offset='1' stop-color='#000' stop-opacity='.55'/></linearGradient>" +
      "<filter id='fNeon' x='-20%' y='-40%' width='140%' height='180%'><feGaussianBlur stdDeviation='3'/></filter>" +
      "</defs>";
    return "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 " + W + " " + H + "' width='" + W + "' height='" + H + "'>" + defs + d.o +
      "<rect width='" + W + "' height='" + H + "' fill='url(#gVign)'/><rect y='" + (H - 120) + "' width='" + W + "' height='120' fill='url(#gFondo)'/></svg>";
  }
  var cache = {};
  function immagine(id) {
    if (!cache[id]) cache[id] = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgSala(id));
    return cache[id];
  }

  // SALE: le sale di ogni gioco (primo piano); scena(id): le scene in prima persona (salone del Casinò, atrio e sale del Circolo)
  window.SGCasino = { SALE: SALE, TAVOLI: TAVOLI, immagine: immagine, svg: svgSala, scena: scena, punti: punti };
})();

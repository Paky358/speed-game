/* =========================================================
   SPeeD GAME — IL CASINÒ DENTRO: una sala per ogni gioco di carte
   Entri e sei nella sala del Black Jack: in fondo il tavolo con la gente
   che gioca con le fiches. Scorrendo: Scopa (niente fiches), Scopa 2 vs 2,
   Scopone e Poker; ogni sala ha una cosa sua (il quadro, le bandierine,
   la lavagna, l'insegna al neon…).
   Ogni sala è un disegno fermo (SVG dentro un'immagine): si disegna una volta
   sola, così scorrere da una sala all'altra è leggero anche sui telefoni lenti.
   Il nome grande del gioco, le frecce e i tocchi stanno in core.js (schermataCasino).
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
    { id: "poker",     nome: "Poker",        insegna: "POKER",        stile: "pk" }
  ];

  // ---- prospettiva e pezzi di disegno ----
  function P(x, y, z) { return [CX + F * x / z, HY + F * (EYE - y) / z]; }
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
  function ovale(rx, rz, y, z0, t0, t1, n) {
    var a = []; for (var i = 0; i <= n; i++) { var t = t0 + (t1 - t0) * i / n; a.push(P(rx * Math.cos(t), y, z0 + rz * Math.sin(t))); } return a;
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
    var cfg = SGOmino.casuale(nome), w = (k || 1.1) * F / z, h = w * 1.022, b = P(x, 0.52, z);
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
  function tavoloTovaglia(o, z0, hw, hd, col1, col2) {
    var yT = 0.8, nx = Math.round(hw * 8), nz = 6, i, j, drop = 0.3;
    o.push(poly(qFondo(-hw + 0.06, -hw + 0.15, 0, yT - drop, z0 - hd + 0.08), "#3d2416"), poly(qFondo(hw - 0.15, hw - 0.06, 0, yT - drop, z0 - hd + 0.08), "#3d2416"));
    o.push(poly(qPiano(-hw, hw, z0 - hd, z0 + hd, yT), col1));
    for (i = 0; i < nx; i++) for (j = 0; j < nz; j++) if ((i + j) % 2) o.push(poly(qPiano(-hw + 2 * hw * i / nx, -hw + 2 * hw * (i + 1) / nx, z0 - hd + 2 * hd * j / nz, z0 - hd + 2 * hd * (j + 1) / nz, yT), col2));
    o.push(poly(qFondo(-hw, hw, yT - drop, yT, z0 - hd), col1));
    for (i = 0; i < nx; i++) for (j = 0; j < 2; j++) if ((i + j) % 2) o.push(poly(qFondo(-hw + 2 * hw * i / nx, -hw + 2 * hw * (i + 1) / nx, yT - drop * (j + 1) / 2, yT - drop * j / 2, z0 - hd), col2));
    o.push(poly(qFondo(-hw, hw, yT - drop, yT, z0 - hd), "#000000", "opacity='.16'"));
    return yT;
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

  var DISEGNI = { blackjack: salaBJ, scopa: salaScopa, scopa2v2: salaScopa2, scopone: salaScopone, poker: salaPoker };

  // la sala intera, pronta da mettere in un'immagine
  function svgSala(id) {
    var d = (DISEGNI[id] || salaBJ)();
    var defs = "<defs>" +
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

  window.SGCasino = { SALE: SALE, immagine: immagine, svg: svgSala };
})();

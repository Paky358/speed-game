/* =========================================================
   SPeeD GAME — LA CASA: tre stanze da arredare (Soggiorno con l'angolo cottura, Camera, Bagno)
   - La stanza si guarda di fronte, un po' dall'alto, con la profondità vera:
     un mobile portato verso di te diventa più grande, spinto in fondo più piccolo.
   - Si sposta tutto col dito: i mobili sul pavimento, i quadri sul muro, le cose piccole
     (carta igienica, sveglia, TV…) sul pavimento o sopra i mobili (e poi si muovono con loro).
   - Si parte con roba scadente (divano con la toppa, cassetta della frutta…); il bello si compra.
   Ogni oggetto è un disegno SVG fermo (un'immagine): si disegna una volta sola, leggero.
   Misure in metri (x = destra/sinistra, y = altezza, z = profondità); disegni in centimetri.
   ========================================================= */
(function () {
  "use strict";

  // ---------- la telecamera: un po' alta e che guarda un po' in giù ----------
  var W = 360, H = 640, CX = 180, HY = 250, F = 330, EYE = 2.2, INC = 16 * Math.PI / 180, CP = Math.cos(INC), SP = Math.sin(INC);
  var XW = 2.3, ZB = 4.65, YT = 2.75, ZMIN = 1.45, ZVICINO = 0.5;
  // le misure della stanza (larghezza): la piccola sta tutta nello schermo, le altre si comprano e la stanza scorre di lato
  var MISURE = [
    { xw: 2.3, nome: "Piccola" },
    { xw: 2.95, nome: "Media", prezzo: 2500 },
    { xw: 3.6, nome: "Grande", prezzo: 6000 },
    { xw: 4.25, nome: "Enorme", prezzo: 10000 }
  ];
  function larghezza(xw) {   // cambia la larghezza: il palco si allarga quanto la parete di fondo
    XW = xw; W = Math.round(460 + (xw - 2.3) * 2 * F / (ZB * CP - (YT - EYE) * SP)); CX = W / 2;   // (+50 per lato: scorrendo si vedono anche le pareti di lato)
  }
  function P(x, y, z) { var dy = y - EYE, prof = z * CP - dy * SP, alto = dy * CP + z * SP; return [CX + F * x / prof, HY - F * alto / prof]; }
  function scala(y, z) { return F / (z * CP - (y - EYE) * SP); }   // pixel per metro a quella distanza
  function daSchermo(sx, sy, y) {   // dallo schermo a un piano orizzontale (pavimento o ripiano) alto y
    var dy = (y || 0) - EYE, k = (HY - sy) / F, den = k * CP - SP;
    if (den >= -1e-6) return null;   // sopra l'orizzonte: il pavimento non c'è
    var z = dy * (CP + k * SP) / den, prof = z * CP - dy * SP;
    return { x: (sx - CX) * prof / F, z: z };
  }
  function daMuro(sx, sy) {   // dallo schermo alla parete di fondo
    var k = (HY - sy) / F, dy = ZB * (k * CP - SP) / (CP + k * SP), prof = ZB * CP - dy * SP;
    return { x: (sx - CX) * prof / F, y: dy + EYE };
  }

  function daParete(sx, sy, X) {   // dallo schermo a una parete di lato (x = X): { z, y } oppure null
    var dx = sx - CX; if (!dx || (dx < 0) !== (X < 0)) return null;
    var prof = F * X / dx, A = (HY - sy) * prof / F;
    return { z: prof * CP + A * SP, y: A * CP - prof * SP + EYE };
  }
  function quadParete(d, m) {   // i quattro angoli sullo schermo di un quadro appeso a una parete di lato (in alto a sx, in alto a dx, in basso a dx, in basso a sx)
    var X = d.parete === "sx" ? -XW : XW, s = d.parete === "sx" ? 1 : -1, w = m.w / 200, h = m.h / 200;
    return [P(X, d.y + h, d.z - s * w), P(X, d.y + h, d.z + s * w), P(X, d.y - h, d.z + s * w), P(X, d.y - h, d.z - s * w)];
  }
  function omografia(q, W, H) {   // la trasformazione che stende un'immagine W×H sui quattro angoli q (in prospettiva vera)
    var p0 = q[0], p1 = q[1], p2 = q[2], p3 = q[3], sx = p0[0] - p1[0] + p2[0] - p3[0], sy = p0[1] - p1[1] + p2[1] - p3[1], a, b, d, e, g = 0, h = 0;
    if (Math.abs(sx) < 1e-6 && Math.abs(sy) < 1e-6) { a = p1[0] - p0[0]; b = p3[0] - p0[0]; d = p1[1] - p0[1]; e = p3[1] - p0[1]; }
    else {
      var dx1 = p1[0] - p2[0], dx2 = p3[0] - p2[0], dy1 = p1[1] - p2[1], dy2 = p3[1] - p2[1], den = dx1 * dy2 - dx2 * dy1;
      g = (sx * dy2 - dx2 * sy) / den; h = (dx1 * sy - sx * dy1) / den;
      a = p1[0] - p0[0] + g * p1[0]; b = p3[0] - p0[0] + h * p3[0]; d = p1[1] - p0[1] + g * p1[1]; e = p3[1] - p0[1] + h * p3[1];
    }
    return "matrix3d(" + [a, d, 0, g, b, e, 0, h, 0, 0, 1, 0, p0[0], p0[1], 0, 1].map(function (v) { return +v.toFixed(6); }).join(",") + ") scale(" + (1 / W).toFixed(6) + "," + (1 / H).toFixed(6) + ")";
  }

  // ---------- attrezzi per disegnare ----------
  function r1(v) { return Math.round(v * 10) / 10; }
  function pts(a) { return a.map(function (p) { return r1(p[0]) + "," + r1(p[1]); }).join(" "); }
  function poly(a, fill, extra) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + (extra ? " " + extra : "") + "/>"; }
  function tono(c, k) {
    var n = parseInt(c.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    function f(v) { return Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))); }
    return "#" + ((1 << 24) | (f(r) << 16) | (f(g) << 8) | f(b)).toString(16).slice(1);
  }
  var LINEA = "#3b2b22";
  function lin(id, c1, c2, vert) { return "<linearGradient id='" + id + "' x1='0' y1='0' x2='" + (vert ? 0 : 1) + "' y2='" + (vert ? 1 : 0) + "'><stop offset='0' stop-color='" + c1 + "'/><stop offset='1' stop-color='" + c2 + "'/></linearGradient>"; }
  function morbido(id, c) { return lin(id, tono(c, 0.18), tono(c, -0.16), true); }   // un colore con la luce che viene dall'alto
  function svg(w, h, defs, corpo) {
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " " + h + "' width='" + w + "' height='" + h + "'><defs>" + defs + "</defs>" + corpo + "</svg>";
  }
  function R(x, y, w, h, fill, rx, extra) { return "<rect x='" + x + "' y='" + y + "' width='" + w + "' height='" + h + "'" + (rx ? " rx='" + rx + "'" : "") + " fill='" + fill + "'" + (extra ? " " + extra : "") + "/>"; }
  function C(x, y, r, fill, extra) { return "<circle cx='" + x + "' cy='" + y + "' r='" + r + "' fill='" + fill + "'" + (extra ? " " + extra : "") + "/>"; }
  function E(x, y, rx, ry, fill, extra) { return "<ellipse cx='" + x + "' cy='" + y + "' rx='" + rx + "' ry='" + ry + "' fill='" + fill + "'" + (extra ? " " + extra : "") + "/>"; }
  function Pth(d, fill, extra) { return "<path d='" + d + "' fill='" + fill + "'" + (extra ? " " + extra : "") + "/>"; }
  function bordo(w) { return "stroke='" + LINEA + "' stroke-width='" + (w || 2.2) + "' stroke-linejoin='round' stroke-linecap='round'"; }

  // =========================================================
  //  GLI OGGETTI (centimetri: w × h è il disegno; misura vera = w/100 metri)
  //  tipo: "pav" (sul pavimento), "acc" (piccolo: pavimento o sopra un mobile), "muro" (parete di fondo), "tappeto"
  //  piano: altezza del ripiano (cm) dove si appoggiano le cose piccole
  // =========================================================
  var OGG = {};
  function ogg(id, d) { d.id = id; OGG[id] = d; }

  // ---- SOGGIORNO, roba di partenza ----
  ogg("divano_toppa", { nome: "Divano con la toppa", stanza: "soggiorno", tipo: "pav", w: 196, h: 92, prof: 0.85, qual: 0, azione: "siedi", seduta: 52, posti: [64, 134], disegno: function () {
    var c = "#8b6a4f";
    return svg(196, 92, morbido("a", c) + morbido("b", tono(c, -0.12)) + morbido("t", "#b8863b") +
      "<pattern id='q' width='8' height='8' patternUnits='userSpaceOnUse'><rect width='8' height='8' fill='#c9a24a'/><rect width='4' height='8' fill='#b5462f' opacity='.55'/><rect width='8' height='4' fill='#b5462f' opacity='.35'/></pattern>",
      R(14, 8, 168, 50, "url(#a)", 16, bordo()) +                                   // lo schienale
      Pth("M30 20 Q60 26 92 18 Q120 12 150 20 Q168 24 172 30", "none", "stroke='" + tono(c, -0.3) + "' stroke-width='1.6' opacity='.6'") +   // le pieghe del tessuto lento
      R(118, 16, 30, 26, "url(#q)", 3, bordo(1.6)) +                                // la toppa a quadri
      Pth("M121 19 l4 4 M125 19 l-4 4 M141 19 l4 4 M145 19 l-4 4 M121 35 l4 4 M125 35 l-4 4 M141 35 l4 4 M145 35 l-4 4", "none", "stroke='#3b2b22' stroke-width='1.2'") +
      R(4, 32, 30, 50, "url(#b)", 12, bordo()) + R(162, 32, 30, 50, "url(#b)", 12, bordo()) +   // i braccioli
      Pth("M30 52 Q60 46 98 52 Q100 50 102 52 Q138 47 168 52 L168 74 L30 74 Z", "url(#a)", bordo()) +   // i cuscini sformati
      Pth("M98 52 L100 74", "none", "stroke='" + tono(c, -0.35) + "' stroke-width='2'") +
      E(64, 58, 18, 3, "#fff", "opacity='.12'") + E(136, 58, 18, 3, "#fff", "opacity='.12'") +
      R(10, 72, 176, 12, tono(c, -0.25), 4, bordo()) +
      R(18, 83, 9, 8, "url(#t)", 1, bordo(1.6)) + R(169, 83, 9, 8, "url(#t)", 1, bordo(1.6)) +
      C(150, 45, 2.2, tono(c, -0.4), "opacity='.5'") + C(60, 40, 3, tono(c, 0.2), "opacity='.5'"));   // macchiette
  } });
  ogg("tavolino_cassetta", { nome: "Cassetta della frutta", stanza: "soggiorno", tipo: "pav", w: 78, h: 44, prof: 0.45, piano: 44, qual: 0, disegno: function () {
    var c = "#c9995b";
    return svg(78, 44, morbido("a", c),
      R(2, 2, 74, 40, tono(c, -0.45), 2, bordo()) +
      R(5, 5, 68, 9, "url(#a)", 1.5, bordo(1.4)) + R(5, 17, 68, 9, "url(#a)", 1.5, bordo(1.4)) + R(5, 29, 68, 10, "url(#a)", 1.5, bordo(1.4)) +
      "<text x='39' y='24' text-anchor='middle' font-family='Georgia,serif' font-weight='700' font-size='7' fill='#7a3b1d' opacity='.55' transform='rotate(-3 39 24)'>FRUTTA</text>" +
      C(9, 9.5, 1, "#555") + C(69, 9.5, 1, "#555") + C(9, 34, 1, "#555") + C(69, 34, 1, "#555") +
      Pth("M50 30 l6 5", "none", "stroke='#7a4a22' stroke-width='1'"));   // una scheggia
  } });
  ogg("tv_tubo", { nome: "TV a tubo", stanza: "soggiorno", tipo: "acc", w: 54, h: 78, qual: 0, stati: "accendi", luce: { x: 0.43, y: 0.62, r: 1.6, c: "#9fd8ff" }, disegno: function (on) {
    return svg(54, 78, morbido("a", "#c9bfa8") + lin("s", on ? "#7fd0c8" : "#5b6b63", on ? "#3d7aa8" : "#2f3a35", true),
      Pth("M27 30 L10 4 M27 30 L44 2", "none", "stroke='#444' stroke-width='1.6'") + C(10, 4, 2, "#888") + C(44, 2, 2, "#888") +   // le antenne a orecchie di coniglio
      R(2, 28, 50, 46, "url(#a)", 7, bordo()) + R(6, 32, 34, 32, "url(#s)", 7, bordo(1.6)) +
      (on ? Pth("M9 44 L37 44 M9 50 L37 50 M9 56 L37 56", "none", "stroke='#fff' stroke-width='1' opacity='.25'") + C(17, 47, 5, "#ffd43b", "opacity='.85'") + Pth("M24 58 Q30 44 37 52 L37 61 L24 61 Z", "#69db7c", "opacity='.8'") : "") +   // accesa: un cartone animato un po' sgranato
      Pth("M10 36 Q18 34 22 40", "none", "stroke='#fff' stroke-width='2' opacity='.35'") +
      C(46, 38, 2.6, "#7d725d", bordo(1)) + C(46, 47, 2.6, "#7d725d", bordo(1)) + R(43, 54, 6, 6, "#7d725d", 1) +
      R(8, 74, 8, 3, "#555") + R(38, 74, 8, 3, "#555"));
  } });
  ogg("sedia_plastica", { nome: "Sedia di plastica", stanza: "soggiorno", tipo: "pav", w: 46, h: 84, prof: 0.45, piano: 44, qual: 0, azione: "siedi", seduta: 40, posti: [23], disegno: function () {
    var c = "#ece9df";
    return svg(46, 84, morbido("a", c),
      Pth("M8 4 Q23 0 38 4 L36 40 L10 40 Z", "url(#a)", bordo()) + Pth("M14 10 L32 10 M14 18 L32 18", "none", "stroke='#cfcabb' stroke-width='3'") +
      R(4, 40, 38, 8, "url(#a)", 3, bordo()) + Pth("M7 48 L4 82 M39 48 L42 82 M13 48 L15 74 M33 48 L31 74", "none", "stroke='" + LINEA + "' stroke-width='5'") +
      Pth("M7 48 L4 82 M39 48 L42 82", "none", "stroke='" + c + "' stroke-width='3'") + E(30, 30, 4, 3, "#a89e84", "opacity='.35'"));   // una macchia
  } });
  ogg("pianta_secca", { nome: "Pianta un po' secca", stanza: "tutte", tipo: "acc", w: 34, h: 54, qual: 0, disegno: function () {
    return svg(34, 54, morbido("v", "#e05a3a"),
      Pth("M17 34 C10 26 4 26 2 30", "none", "stroke='#8a7a3a' stroke-width='3'") + Pth("M17 34 C16 20 20 12 26 10", "none", "stroke='#8a7a3a' stroke-width='3'") +
      E(4, 30, 4, 2.5, "#a08a40") + E(26, 9, 5, 3, "#9c9a46", "transform='rotate(-20 26 9)'") + E(22, 20, 4, 2, "#b5a24e", "transform='rotate(30 22 20)'") +
      Pth("M17 34 C22 30 28 32 31 38", "none", "stroke='#8a7a3a' stroke-width='3'") + E(31, 39, 3, 2, "#a3833c") +
      Pth("M7 34 L27 34 L24 53 L10 53 Z", "url(#v)", bordo()) + R(6, 32, 22, 5, "#c94a2c", 1.5, bordo(1.4)));
  } });
  ogg("frigo_ammaccato", { nome: "Frigo ammaccato", stanza: "soggiorno", tipo: "pav", w: 62, h: 146, prof: 0.6, piano: 146, qual: 0, stati: "apri", lato: -1, corpo: [16, 74], luce: { x: 0.45, y: 0.62, r: 1.1, c: "#fff6cf" }, disegno: function (on) {
    var c = "#ece4c9", s;
    s = R(2, 2, 58, 140, "url(#a)", 8, bordo()) + Pth("M2 52 L60 52", "none", bordo());
    if (!on) s += R(48, 20, 5, 24, "#bdb49a", 2, bordo(1.2)) + R(48, 62, 5, 30, "#bdb49a", 2, bordo(1.2)) +
      Pth("M14 96 Q20 102 16 110 Q12 104 14 96 Z", tono(c, -0.12)) +   // l'ammaccatura
      C(40, 128, 5, "#b0703a", "opacity='.45'") + C(42, 130, 2, "#8a4d22", "opacity='.5'") +   // un po' di ruggine
      R(12, 70, 10, 10, "#ff6b6b", 2, "transform='rotate(-8 17 75)'") + R(26, 66, 9, 12, "#ffd43b", 2, "transform='rotate(6 30 72)'");   // le calamite
    else s += R(6, 56, 50, 82, "url(#dentro)", 4, bordo(1.4)) + R(6, 80, 50, 2.5, "#cfd8dc") + R(6, 108, 50, 2.5, "#cfd8dc") +   // aperto: la luce dentro e i ripiani
      R(10, 62, 9, 17, "#fff", 2, bordo(1)) + R(11, 60, 7, 4, "#4dabf7", 1) +                 // il latte
      C(28, 75, 4.5, "#e03131", bordo(1)) + Pth("M28 70 l1 -3", "none", "stroke='#2b8a3e' stroke-width='1.4'") +   // la mela
      Pth("M36 79 L50 79 L46 71 Z", "#ffd43b", bordo(1)) + C(41, 76, 1, "#e9b10a") + C(45, 77, 0.8, "#e9b10a") +   // il formaggio
      R(12, 98, 30, 9, "#adb5bd", 3, bordo(1)) + R(36, 88, 8, 19, "#69db7c", 2, bordo(1)) + E(30, 126, 14, 5, "#ffa94d", bordo(1)) +   // avanzi
      Pth("M60 52 L74 58 L74 136 L60 142 Z", "url(#a)", bordo()) + R(66, 74, 4, 40, "#bdb49a", 1.5);   // l'anta aperta verso di noi
    return svg(90, 146, morbido("a", c) + "<radialGradient id='dentro' cx='.5' cy='.2' r='.9'><stop offset='0' stop-color='#fffbe6'/><stop offset='1' stop-color='#e9edf0'/></radialGradient>",
      "<g transform='translate(14 0)'>" + s + R(6, 142, 10, 4, "#555") + R(46, 142, 10, 4, "#555") + "</g>");   // più largo: l'anta aperta sta a destra
  } });
  ogg("fornello_vecchio", { nome: "Fornello vecchio", stanza: "soggiorno", tipo: "pav", w: 62, h: 90, prof: 0.6, piano: 86, qual: 0, stati: "accendi", disegno: function (on) {
    var c = "#d9cfb6", fiamma = function (x) { return Pth("M" + (x - 6) + " 8 Q" + (x - 5) + " 2 " + (x - 3) + " 5 Q" + (x - 2) + " -1 " + x + " 3 Q" + (x + 2) + " -1 " + (x + 3) + " 5 Q" + (x + 5) + " 2 " + (x + 6) + " 8 Z", "#4dabf7", "opacity='.9'") + Pth("M" + (x - 3) + " 8 Q" + x + " 1 " + (x + 3) + " 8 Z", "#d0ebff"); };
    return svg(62, 90, morbido("a", c) + morbido("l", "#9b7650"),
      R(2, 30, 58, 58, "url(#l)", 3, bordo()) + R(8, 38, 21, 44, tono("#9b7650", 0.1), 2, bordo(1.4)) + R(33, 38, 21, 44, tono("#9b7650", 0.1), 2, bordo(1.4) + " transform='rotate(3 43 40)'") +
      R(1, 8, 60, 24, "url(#a)", 3, bordo()) + E(17, 8, 11, 3, "#3b3b3b") + E(45, 8, 11, 3, "#3b3b3b") + E(17, 8, 6, 1.6, "#6a6a6a") + E(45, 8, 6, 1.6, "#6a6a6a") +
      (on ? fiamma(17) + fiamma(45) : "") +   // acceso: le fiammelle blu
      C(12, 20, 3, on ? "#e03131" : "#555", bordo(1)) + C(24, 20, 3, "#555", bordo(1)) + C(38, 20, 3, "none", "stroke='#555' stroke-width='1.4' stroke-dasharray='2 2'") + C(50, 20, 3, on ? "#e03131" : "#555", bordo(1)) +   // una manopola manca
      C(25, 50, 1.6, "#3b2b22") + C(40, 52, 1.6, "#3b2b22"));
  } });
  ogg("tappeto_liso", { nome: "Tappeto liso", stanza: "tutte", tipo: "tappeto", w: 170, h: 46, qual: 0, disegno: function () {
    return svg(170, 46, "",
      E(85, 23, 82, 21, "#9a8f86", bordo(1.8)) + E(85, 23, 68, 15, "none", "stroke='#b8ada2' stroke-width='3' stroke-dasharray='6 4'") +
      E(60, 20, 18, 6, "#857a71", "opacity='.6'") + E(115, 27, 12, 5, "#aaa094", "opacity='.6'") +
      Pth("M4 23 l-3 -2 M5 27 l-3 2 M166 21 l3 -2 M165 26 l3 2", "none", "stroke='#7d726a' stroke-width='1.4'"));   // le frange sfilacciate
  } });
  ogg("quadro_storto", { nome: "Quadretto storto", stanza: "tutte", tipo: "muro", w: 42, h: 34, qual: 0, disegno: function () {
    return svg(44, 40, lin("c", "#bfd3dc", "#e6dcc0", true),
      "<g transform='rotate(-5 22 20)'>" + R(3, 5, 38, 30, "#8a5a32", 2, bordo(1.8)) + R(7, 9, 30, 22, "url(#c)") +
      Pth("M7 26 Q15 18 22 24 Q28 19 37 25 L37 31 L7 31 Z", "#a8b58a", "opacity='.7'") + C(30, 14, 3, "#f0d58a", "opacity='.7'") + "</g>" +
      Pth("M22 0 L13 7 M22 0 L31 7", "none", "stroke='#555' stroke-width='1'"));
  } });
  ogg("lampadina", { nome: "Lampadina appesa", stanza: "tutte", tipo: "muro", w: 22, h: 70, alto: true, qual: 0, stati: "accendi", luce: { x: 0.5, y: 0.81, r: 2.2, c: "#ffe9a8" }, disegno: function (on) {
    return svg(22, 70, "<radialGradient id='l'><stop offset='0' stop-color='" + (on ? "#ffffff" : "#f1efe6") + "'/><stop offset='1' stop-color='" + (on ? "#ffe066" : "#cfcab8") + "'/></radialGradient>",
      Pth("M11 0 L11 44", "none", "stroke='#333' stroke-width='1.6'") + R(7, 42, 8, 7, "#666", 1.5, bordo(1.2)) +
      E(11, 57, 8, 10, "url(#l)", bordo(1.4)) + Pth("M8 54 Q11 60 14 54", "none", "stroke='" + (on ? "#ff922b" : "#9a9482") + "' stroke-width='1.2'"));
  } });

  // ---- CAMERA, roba di partenza ----
  ogg("letto_semplice", { nome: "Letto di legno semplice", stanza: "camera", tipo: "pav", w: 200, h: 82, prof: 1.0, qual: 0, azione: "dormi", cuscino: [49, 45], disegno: function (on, parte) {
    var coperta = Pth("M60 34 Q120 30 190 38 L194 62 L58 62 Z", "url(#q)", bordo()),   // la coperta a quadri
      davanti = R(12, 60, 186, 10, "url(#l)", 2, bordo()) + R(16, 70, 8, 10, tono("#b88b5c", -0.3), 1, bordo(1.4)) + R(184, 70, 8, 10, tono("#b88b5c", -0.3), 1, bordo(1.4)) +
      Pth("M100 64 l10 2", "none", "stroke='#7a5230' stroke-width='1'");
    return svg(200, 82, morbido("l", "#b88b5c") + "<pattern id='q' width='14' height='14' patternUnits='userSpaceOnUse'><rect width='14' height='14' fill='#5d7fa3'/><rect width='7' height='14' fill='#8aa6c4' opacity='.6'/><rect width='14' height='7' fill='#3e5f82' opacity='.4'/></pattern>",
      parte === "coperta" ? Pth("M14 47 Q30 43 52 45 Q62 30 98 31 Q150 28 190 38 L194 62 L14 62 Z", "url(#q)", bordo()) + R(2, 4, 16, 74, "url(#l)", 3, bordo()) + davanti :   // chi dorme: la coperta fin sotto il mento, col corpo sotto che fa la gobba
      R(2, 4, 16, 74, "url(#l)", 3, bordo()) +                 // la testiera, una tavola sola
      R(14, 40, 182, 22, "#efe7d4", 6, bordo()) +              // il materasso
      Pth("M20 30 Q40 24 52 32 L52 44 L20 44 Z", "#f6f1e3", bordo(1.6)) +   // il cuscino schiacciato
      coperta + davanti);
  } });
  ogg("comodino_cartone", { nome: "Scatola di cartone", stanza: "camera", tipo: "pav", w: 46, h: 44, prof: 0.45, piano: 44, qual: 0, disegno: function () {
    var c = "#c99a62";
    return svg(46, 44, morbido("a", c),
      R(2, 4, 42, 38, "url(#a)", 2, bordo()) + R(18, 4, 10, 38, "#d9c58f", 0, "opacity='.8'") +   // lo scotch
      Pth("M2 4 L8 0 L38 0 L44 4", tono(c, 0.12), bordo(1.6)) +
      "<text x='23' y='32' text-anchor='middle' font-family='Arial Black,Arial' font-size='6' fill='#a33' opacity='.7'>FRAGILE</text>" +
      Pth("M8 14 l4 3 m-1 -4 l3 3", "none", "stroke='#8a5a32' stroke-width='1'"));
  } });
  ogg("armadio_storto", { nome: "Armadio con l'anta storta", stanza: "camera", tipo: "pav", w: 100, h: 186, prof: 0.6, qual: 0, stati: "apri", vestiti: true, corpo: [22, 120], disegno: function (on) {
    var c = "#a87b52", s = R(4, 6, 94, 172, "url(#a)", 3, bordo()) + R(2, 2, 98, 8, tono(c, -0.2), 2, bordo());
    if (!on) s += R(9, 14, 41, 156, "url(#b)", 2, bordo(1.8)) +
      "<g transform='rotate(3 56 20)'>" + R(53, 14, 41, 156, "url(#b)", 2, bordo(1.8)) + "</g>" +   // l'anta storta
      C(44, 90, 2.4, "#e0c070", bordo(1)) + C(62, 92, 2.4, "none", "stroke='#7a5230' stroke-width='1' stroke-dasharray='1.5 1.5'");   // un pomello manca
    else {   // aperto: i vestiti appesi, le maglie piegate in alto, le scarpe in basso; le ante girate verso di noi
      var gruccia = function (x, col, lungo) { return Pth("M" + x + " 36 l0 -4 q0 -3 3 -3", "none", "stroke='#888' stroke-width='1.2'") + Pth("M" + (x - 9) + " 40 L" + x + " 35 L" + (x + 9) + " 40 L" + (x + 8) + " " + (40 + lungo) + " L" + (x - 8) + " " + (40 + lungo) + " Z", col, bordo(1.3)) + Pth("M" + (x - 3) + " 36 L" + x + " 42 L" + (x + 3) + " 36", "none", "stroke='" + tono(col, -0.3) + "' stroke-width='1.2'"); };
      s += R(9, 14, 86, 156, tono(c, -0.5), 2, bordo(1.6)) + R(9, 14, 86, 156, "url(#ombra)", 2) +
        R(10, 20, 84, 4, "#ccc", 2) + R(10, 120, 84, 4, tono(c, -0.15), 1) +
        gruccia(22, "#e03131", 52) + gruccia(38, "#4dabf7", 60) + gruccia(54, "#ffd43b", 46) + gruccia(70, "#51cf66", 64) + gruccia(84, "#be4bdb", 50) +
        R(16, 108, 22, 6, "#74c0fc", 2, bordo(1)) + R(18, 102, 18, 6, "#ff8787", 2, bordo(1)) + R(56, 108, 26, 6, "#ffe066", 2, bordo(1)) +
        R(16, 150, 18, 10, "#5c3a21", 4, bordo(1.2)) + R(36, 150, 18, 10, "#5c3a21", 4, bordo(1.2)) + R(62, 152, 24, 8, "#f1f3f5", 3, bordo(1.2)) +
        Pth("M9 14 L-6 20 L-6 166 L9 170 Z", "url(#b)", bordo(1.6)) + Pth("M95 14 L112 22 L112 168 L95 170 Z", "url(#b)", bordo(1.6)) +   // le ante aperte
        C(-2, 90, 2, "#e0c070", bordo(1));
    }
    return svg(142, 186, morbido("a", c) + morbido("b", tono(c, 0.08)) + lin("ombra", "rgba(0,0,0,.35)", "rgba(0,0,0,0)", true),
      "<g transform='translate(20 0)'>" + s + R(8, 178, 10, 8, tono(c, -0.4), 1) + R(84, 178, 10, 8, tono(c, -0.4), 1) + "</g>");
  } });
  ogg("sveglia", { nome: "Sveglia", stanza: "tutte", tipo: "acc", w: 16, h: 18, qual: 0, uso: "suona", disegno: function () {
    return svg(16, 18, "",
      C(4, 4, 3, "#c9a24a", bordo(1)) + C(12, 4, 3, "#c9a24a", bordo(1)) + C(8, 10, 6.5, "#e03131", bordo(1.2)) + C(8, 10, 4.8, "#fff8e8") +
      Pth("M8 10 L8 7 M8 10 L10 11", "none", "stroke='#333' stroke-width='1'") + Pth("M4 16 L3 18 M12 16 L13 18", "none", "stroke='#333' stroke-width='1.4'"));
  } });
  ogg("lampada_storta", { nome: "Lampada col paralume storto", stanza: "camera", tipo: "acc", w: 26, h: 44, qual: 0, stati: "accendi", luce: { x: 0.5, y: 0.3, r: 1.5, c: "#ffe3a3" }, disegno: function (on) {
    return svg(28, 44, on ? lin("p", "#fff8dc", "#ffd77a", true) : morbido("p", "#e8d6a8"),
      Pth("M14 18 L14 38", "none", "stroke='#7a6a52' stroke-width='2.4'") + (on ? E(14, 19, 6, 2.4, "#fff3b0") : "") +
      "<g transform='rotate(-9 14 12)'>" + Pth("M5 18 L9 4 L19 4 L23 18 Z", "url(#p)", bordo(1.4)) + "</g>" +
      E(14, 40, 9, 3, "#7a6a52", bordo(1.2)) + C(20, 37, 1.4, on ? "#e03131" : "#555"));
  } });
  ogg("poster_strappato", { nome: "Poster strappato", stanza: "camera", tipo: "muro", w: 40, h: 54, qual: 0, disegno: function () {
    return svg(42, 56, lin("c", "#6c5ce7", "#e84393", true),
      Pth("M3 3 L39 3 L39 44 L32 53 L3 53 Z", "url(#c)", bordo(1.4)) + Pth("M39 44 L32 44 L32 53", "#b8a6d9", bordo(1)) +
      C(21, 22, 8, "#ffd43b", "opacity='.85'") + Pth("M10 46 L32 46", "none", "stroke='#fff' stroke-width='3' opacity='.7'") +
      R(1, 1, 7, 4, "#e9e3c9", 0, "opacity='.85' transform='rotate(-20 4 3)'") + R(34, 1, 7, 4, "#e9e3c9", 0, "opacity='.85' transform='rotate(20 37 3)'"));
  } });

  // ---- BAGNO, roba di partenza ----
  function sciacquone(x, y) {   // l'acqua che gira nel gabinetto (un attimo, quando si tira l'acqua)
    return E(x, y, 13, 3.4, "#74c0fc", bordo(1)) + Pth("M" + (x - 9) + " " + (y - 1) + " Q" + x + " " + (y - 6) + " " + (x + 9) + " " + (y - 1), "none", "stroke='#fff' stroke-width='1.4'") +
      C(x - 6, y - 8, 1.6, "#a5d8ff") + C(x + 4, y - 11, 1.3, "#a5d8ff") + C(x + 9, y - 7, 1.1, "#a5d8ff");
  }
  ogg("wc_vecchio", { nome: "Gabinetto vecchio", stanza: "bagno", tipo: "pav", w: 44, h: 82, prof: 0.65, qual: 0, uso: "wc", disegno: function (on) {
    var c = "#f1ecd8";
    return svg(48, 82, morbido("a", c),
      R(8, 2, 32, 30, "url(#a)", 4, bordo()) + R(14, on ? 7 : 6, 8, on ? 3 : 4, on ? "#bfb48a" : "#d9cfa8", 2, bordo(1)) +      // la cassetta col tasto (premuto quando si tira l'acqua)
      Pth("M6 34 L42 34 Q44 48 34 56 L32 74 L16 74 L14 56 Q4 48 6 34 Z", "url(#a)", bordo()) +
      Pth("M4 32 L44 32 L44 37 L4 37 Z", "#e8dfb8", bordo(1.6)) +   // la tavoletta un po' ingiallita
      (on ? sciacquone(24, 33) : "") +
      R(12, 74, 24, 6, tono(c, -0.1), 2, bordo(1.6)) + E(30, 50, 3, 5, "#d9c98a", "opacity='.5'"));
  } });
  ogg("lavandino_colonna", { nome: "Lavandino scheggiato", stanza: "bagno", tipo: "pav", w: 54, h: 88, prof: 0.45, piano: 80, qual: 0, uso: "acqua", disegno: function (on) {
    var c = "#f3efe3";
    return svg(56, 88, morbido("a", c),
      Pth("M22 8 L22 1.5 L33 1.5 L33 4", "none", "stroke='#9aa' stroke-width='3'") + C(18, 8, 2.4, "#bbb", bordo(1)) + C(38, 8, 2.4, on ? "#4dabf7" : "#bbb", bordo(1)) +
      (on ? R(31.2, 3.5, 3.6, 8, "#4dabf7", 1.8) + R(32.2, 4, 1.2, 6, "#fff", 0.6, "opacity='.8'") : "") +   // l'acqua che scende
      Pth("M2 10 L54 10 Q54 26 42 28 L14 28 Q2 26 2 10 Z", "url(#a)", bordo()) + Pth("M44 10 l4 3 l3 -3", "#e3dccb", bordo(1)) +   // la scheggiatura
      (on ? E(33, 10.5, 9, 2.2, "#74c0fc") + C(25, 6, 1.3, "#4dabf7") + C(42, 5, 1.5, "#4dabf7") + C(28, 3, 1, "#74c0fc") + C(40, 2, 1, "#74c0fc") : "") +
      Pth("M20 28 L36 28 L34 84 L22 84 Z", "url(#a)", bordo()) + R(18, 82, 20, 5, tono(c, -0.1), 2, bordo(1.4)));
  } });
  ogg("specchio_scheggiato", { nome: "Specchio scheggiato", stanza: "bagno", tipo: "muro", w: 40, h: 50, qual: 0, disegno: function () {
    return svg(42, 52, lin("v", "#cfe6ee", "#9fc2cf", true),
      R(2, 2, 38, 48, "#9a8f7a", 3, bordo(1.6)) + R(5, 5, 32, 42, "url(#v)") +
      Pth("M28 5 L24 16 L30 22 L26 34", "none", "stroke='#fff' stroke-width='1.2' opacity='.9'") + Pth("M9 12 L15 9", "none", "stroke='#fff' stroke-width='2' opacity='.6'") +
      Pth("M37 40 L33 47 L37 47 Z", "#9a8f7a"));
  } });
  ogg("doccia_tenda", { nome: "Doccia con la tenda", stanza: "bagno", tipo: "pav", w: 88, h: 200, prof: 0.85, qual: 0, uso: "doccia", disegno: function (on) {
    var s = Pth("M80 0 L80 14 Q80 18 74 18 L66 18", "none", "stroke='#9aa4a8' stroke-width='3'") + Pth("M60 15 L70 15 L68 22 L62 22 Z", "#c3cdd1", bordo(1.2)) +   // il tubo e il soffione
      Pth("M4 26 L86 26", "none", "stroke='#9aa4a8' stroke-width='3'");
    if (on) s += C(50, 70, 13, "#4f6a75") + E(50, 112, 17, 28, "#4f6a75") + E(36, 98, 5, 16, "#4f6a75", "transform='rotate(30 36 98)'") + E(64, 96, 5, 16, "#4f6a75", "transform='rotate(-40 64 96)'") + E(50, 158, 13, 26, "#4f6a75");   // dentro c'è qualcuno: l'ombra dietro la tenda
    s += Pth("M6 28 Q14 110 8 186 L46 186 Q42 110 46 28 Z", "url(#t)", bordo(1.6) + (on ? " opacity='.8'" : "")) + Pth("M46 28 Q50 110 46 186 L84 186 Q88 110 84 28 Z", "url(#t)", bordo(1.6) + (on ? " opacity='.8'" : "")) +
      Pth("M18 28 Q24 110 18 186 M32 28 Q36 110 32 186 M58 28 Q62 110 58 186 M72 28 Q76 110 72 186", "none", "stroke='#b5c4c9' stroke-width='1.4'") +
      C(20, 150, 4, "#7d8f5a", "opacity='.35'") + C(26, 160, 2.5, "#7d8f5a", "opacity='.35'") + C(66, 172, 3, "#7d8f5a", "opacity='.35'");   // un po' di muffa
    if (on) s += Pth("M60 24 L56 34 M65 24 L65 36 M70 24 L74 34", "none", "stroke='#74c0fc' stroke-width='1.6' stroke-linecap='round'") +   // l'acqua che scende
      E(30, 14, 14, 8, "#fff", "opacity='.75'") + E(50, 8, 16, 8, "#fff", "opacity='.7'") + E(70, 30, 12, 7, "#fff", "opacity='.6'") + E(16, 32, 9, 6, "#fff", "opacity='.6'") +   // il vapore
      C(34, 184, 1.6, "#74c0fc") + C(60, 185, 1.4, "#74c0fc") + C(48, 183, 1.2, "#74c0fc");
    return svg(90, 200, lin("t", "#e8eef0", "#c9d6da"), s + R(2, 186, 86, 12, "#e9e5da", 2, bordo()));
  } });
  ogg("carta_igienica", { nome: "Carta igienica", stanza: "bagno", tipo: "acc", w: 12, h: 12, qual: 0, disegno: function () {
    return svg(14, 14, morbido("a", "#fbfbf6"),
      R(1, 2, 12, 11, "url(#a)", 2, bordo(1)) + E(7, 2.5, 6, 1.8, "#f3f1e6", bordo(0.8)) + E(7, 2.5, 2, 0.8, "#c9bfa8") + Pth("M2 10 L1 14", "none", "stroke='#ddd' stroke-width='1'"));
  } });
  ogg("bicchiere_spazzolino", { nome: "Bicchiere con lo spazzolino", stanza: "bagno", tipo: "acc", w: 10, h: 20, qual: 0, disegno: function () {
    return svg(12, 22, "",
      Pth("M7 1 L5 12", "none", "stroke='#4dabf7' stroke-width='2'") + R(5, 0, 4, 3, "#fff", 1, bordo(0.6)) +
      Pth("M1 9 L11 9 L10 21 L2 21 Z", "#cfe6ee", bordo(1)) + Pth("M3 11 L3 19", "none", "stroke='#fff' stroke-width='1' opacity='.7'"));
  } });
  ogg("tappetino", { nome: "Tappetino", stanza: "bagno", tipo: "tappeto", w: 70, h: 24, qual: 0, disegno: function () {
    return svg(70, 24, "", R(2, 2, 66, 20, "#8fb8c4", 9, bordo(1.6)) + R(8, 6, 54, 12, "none", 6, "stroke='#b9d6de' stroke-width='2' stroke-dasharray='3 3'") + E(40, 12, 9, 4, "#7aa1ad", "opacity='.5'"));
  } });

  // ---- dal negozio (anteprima): le cose belle ----
  ogg("divano_velluto", { nome: "Divano di velluto", stanza: "soggiorno", tipo: "pav", w: 204, h: 94, prof: 0.9, qual: 2, prezzo: 1800, azione: "siedi", seduta: 50, posti: [66, 138], disegno: function () {
    var c = "#1f8a8a";
    return svg(204, 94, morbido("a", c) + morbido("b", tono(c, -0.1)) + lin("o", "#f6d77a", "#c9962e", true) + morbido("k", "#f2c14e"),
      R(16, 6, 172, 50, "url(#a)", 22, bordo()) + Pth("M60 10 L60 52 M102 8 L102 52 M144 10 L144 52", "none", "stroke='" + tono(c, -0.25) + "' stroke-width='1.6'") +
      C(40, 30, 2, tono(c, -0.35)) + C(81, 30, 2, tono(c, -0.35)) + C(123, 30, 2, tono(c, -0.35)) + C(164, 30, 2, tono(c, -0.35)) +   // i bottoni capitonné
      R(4, 34, 28, 48, "url(#b)", 14, bordo()) + R(172, 34, 28, 48, "url(#b)", 14, bordo()) +
      R(30, 50, 72, 22, "url(#a)", 8, bordo()) + R(102, 50, 72, 22, "url(#a)", 8, bordo()) +
      Pth("M40 34 Q50 26 62 34 L60 50 L38 50 Z", "url(#k)", bordo(1.6)) + Pth("M142 34 Q154 26 166 34 L164 50 L142 50 Z", "url(#k)", bordo(1.6)) +   // i cuscini gialli
      R(10, 72, 184, 10, tono(c, -0.3), 4, bordo()) + Pth("M22 82 L18 93 M182 82 L186 93", "none", "stroke='url(#o)' stroke-width='5' stroke-linecap='round'") + Pth("M22 82 L18 93 M182 82 L186 93", "none", "stroke='" + LINEA + "' stroke-width='1' opacity='.4'"));
  } });
  ogg("poltrona_gialla", { nome: "Poltrona gialla", stanza: "soggiorno", tipo: "pav", w: 80, h: 92, prof: 0.8, qual: 2, prezzo: 900, azione: "siedi", seduta: 52, posti: [40], disegno: function () {
    var c = "#f2b134";
    return svg(80, 92, morbido("a", c) + morbido("b", tono(c, -0.1)),
      R(12, 4, 56, 54, "url(#a)", 20, bordo()) + R(2, 36, 18, 44, "url(#b)", 9, bordo()) + R(60, 36, 18, 44, "url(#b)", 9, bordo()) +
      R(18, 52, 44, 20, "url(#a)", 7, bordo()) + R(8, 72, 64, 8, tono(c, -0.3), 3, bordo()) +
      Pth("M16 80 L13 91 M64 80 L67 91", "none", "stroke='#5a3a22' stroke-width='4' stroke-linecap='round'"));
  } });
  ogg("tv_piatta", { nome: "TV a schermo piatto", stanza: "soggiorno", tipo: "acc", w: 84, h: 54, qual: 2, prezzo: 1500, stati: "accendi", luce: { x: 0.5, y: 0.45, r: 2.2, c: "#a5c8ff" }, disegno: function (on) {
    return svg(86, 56, on ? lin("s", "#8fd3f4", "#4dabf7", true) + lin("p", "#69db7c", "#2b8a3e", true) : lin("s", "#3a4a8a", "#121a3a", true),
      R(2, 2, 82, 46, "#1b1b1f", 3, bordo(1.6)) + R(5, 5, 76, 40, "url(#s)", 1) +
      (on ? R(5, 32, 76, 13, "url(#p)") + C(62, 14, 5, "#ffe066") + E(24, 14, 8, 3, "#fff", "opacity='.85'") + E(30, 12, 6, 3, "#fff", "opacity='.85'") +   // una partita di calcio
        Pth("M43 32 L43 45 M5 38 L81 38", "none", "stroke='#fff' stroke-width='.7' opacity='.6'") + C(40, 30, 1.6, "#fff", bordo(0.5)) + R(30, 26, 2.4, 5, "#e03131", 1) + R(50, 25, 2.4, 5, "#1c7ed6", 1) +
        R(8, 7, 14, 4, "#000", 1, "opacity='.5'") + R(9.5, 8, 3, 2, "#fff") + R(15, 8, 5, 2, "#ffe066") : "") +
      Pth("M8 8 L30 8 L14 40 L8 40 Z", "#fff", "opacity='.08'") + R(36, 48, 14, 4, "#2b2b30") + R(28, 52, 30, 3, "#2b2b30", 1.5) + C(80, 47, 0.9, on ? "#51cf66" : "#e03131"));
  } });
  ogg("mobile_tv", { nome: "Mobile basso di legno", stanza: "soggiorno", tipo: "pav", w: 130, h: 48, prof: 0.45, piano: 46, qual: 2, prezzo: 800, disegno: function () {
    var c = "#a8754a";
    return svg(130, 48, morbido("a", c),
      R(2, 2, 126, 38, "url(#a)", 4, bordo()) + R(8, 8, 36, 26, tono(c, 0.1), 3, bordo(1.4)) + R(47, 8, 36, 26, tono(c, 0.1), 3, bordo(1.4)) + R(86, 8, 36, 26, tono(c, 0.1), 3, bordo(1.4)) +
      R(22, 18, 8, 2.4, "#e0c070", 1) + R(61, 18, 8, 2.4, "#e0c070", 1) + R(100, 18, 8, 2.4, "#e0c070", 1) +
      R(10, 40, 6, 8, "#5a3a22") + R(114, 40, 6, 8, "#5a3a22"));
  } });
  ogg("monstera", { nome: "Monstera", stanza: "tutte", tipo: "pav", w: 70, h: 130, prof: 0.5, qual: 2, prezzo: 700, disegno: function () {
    var f = function (x, y, r, a, c) { return "<g transform='translate(" + x + " " + y + ") rotate(" + a + ")'>" + Pth("M0 0 C-" + r + " -" + r * 0.2 + " -" + r + " -" + r * 1.4 + " 0 -" + r * 1.6 + " C" + r + " -" + r * 1.4 + " " + r + " -" + r * 0.2 + " 0 0 Z", c, bordo(1.4)) +
      Pth("M0 0 L0 -" + r * 1.5 + " M0 -" + r * 0.6 + " L-" + r * 0.6 + " -" + r * 0.9 + " M0 -" + r + " L" + r * 0.6 + " -" + r * 1.3, "none", "stroke='" + tono(c, -0.3) + "' stroke-width='1.2'") + "</g>"; };
    return svg(70, 130, morbido("v", "#e9e4da"),
      f(35, 84, 18, -40, "#2f9e44") + f(35, 84, 20, 30, "#37b24d") + f(35, 84, 22, -8, "#40c057") + f(35, 84, 16, 70, "#2b8a3e") + f(35, 84, 15, -75, "#2f9e44") +
      Pth("M14 84 L56 84 L50 128 L20 128 Z", "url(#v)", bordo()) + R(12, 80, 46, 8, "#d9d3c4", 3, bordo(1.6)));
  } });
  ogg("quadro_mare", { nome: "Quadro del mare", stanza: "tutte", tipo: "muro", w: 64, h: 46, qual: 2, prezzo: 500, disegno: function () {
    return svg(66, 48, lin("c", "#8fd3f4", "#fbe7a1", true) + lin("m", "#2f80c4", "#1b5d96", true),
      R(2, 2, 62, 44, "#c9962e", 3, bordo(1.8)) + R(6, 6, 54, 36, "url(#c)") + R(6, 28, 54, 14, "url(#m)") +
      Pth("M6 30 Q16 26 26 30 Q36 34 46 29 Q54 26 60 29", "none", "stroke='#fff' stroke-width='1.4' opacity='.7'") + C(46, 16, 5, "#ffd43b") +
      Pth("M14 28 L20 18 L22 28 Z", "#fff", bordo(0.8)));
  } });
  ogg("letto_matrimoniale", { nome: "Letto con la trapunta", stanza: "camera", tipo: "pav", w: 204, h: 96, prof: 1.6, qual: 2, prezzo: 2000, azione: "dormi", cuscino: [54, 50], disegno: function (on, parte) {
    var trapunta = function (x0) { return Pth("M" + x0 + " " + (x0 < 60 ? 36 : 40) + " Q120 30 180 44 L182 70 L" + (x0 - 2) + " 70 Z", "url(#t)", bordo()) + Pth("M90 42 L90 70 M120 38 L120 70 M150 40 L150 70", "none", "stroke='" + tono("#e8789a", -0.2) + "' stroke-width='1.2' stroke-dasharray='3 3'"); },
      davanti = R(176, 40, 26, 52, "url(#l)", 6, bordo()) + R(18, 68, 170, 12, "url(#l)", 3, bordo());
    return svg(206, 96, morbido("l", "#8a5a3a") + morbido("t", "#e8789a"),
      parte === "coperta" ? Pth("M22 52 Q40 47 62 50 Q74 34 110 36 Q150 32 180 44 L182 70 L20 70 Z", "url(#t)", bordo()) + Pth("M120 38 L120 70 M150 40 L150 70", "none", "stroke='" + tono("#e8789a", -0.2) + "' stroke-width='1.2' stroke-dasharray='3 3'") + R(2, 2, 26, 90, "url(#l)", 8, bordo()) + davanti :
      R(2, 2, 26, 90, "url(#l)", 8, bordo()) +
      R(20, 46, 166, 24, "#fbf6ec", 8, bordo()) +
      Pth("M30 26 Q44 18 58 26 Q60 36 56 44 L30 44 Q26 36 30 26 Z", "#fff", bordo(1.6)) + Pth("M34 32 Q48 24 62 32 Q64 42 60 48 L34 48 Q30 40 34 32 Z", "#f6eadb", bordo(1.6)) +
      trapunta(64) + davanti);
  } });
  ogg("wc_moderno", { nome: "Gabinetto moderno", stanza: "bagno", tipo: "pav", w: 42, h: 74, prof: 0.6, qual: 2, prezzo: 900, uso: "wc", disegno: function (on) {
    return svg(44, 74, morbido("a", "#ffffff"),
      R(8, 2, 28, 26, "url(#a)", 6, bordo()) + R(18, 6, 8, 3, on ? "#4dabf7" : "#c0c8cc", 1.5) +
      Pth("M4 30 L40 30 Q42 46 32 52 L30 68 L14 68 Q14 60 12 52 Q2 46 4 30 Z", "url(#a)", bordo()) + R(3, 28, 38, 5, "#f4f6f7", 2.5, bordo(1.4)) + (on ? sciacquone(22, 29) : "") +
      Pth("M8 34 Q10 44 16 48", "none", "stroke='#fff' stroke-width='2' opacity='.9'"));
  } });
  ogg("specchio_tondo", { nome: "Specchio tondo dorato", stanza: "tutte", tipo: "muro", w: 46, h: 46, qual: 2, prezzo: 600, disegno: function () {
    return svg(48, 48, lin("o", "#f6d77a", "#c9962e", true) + lin("v", "#e3f4f8", "#a9d3df", true),
      C(24, 24, 22, "url(#o)", bordo(1.6)) + C(24, 24, 17, "url(#v)") + Pth("M14 18 Q18 11 25 10", "none", "stroke='#fff' stroke-width='2.4' opacity='.8'"));
  } });


  // ---- dal negozio: soggiorno ----
  ogg("libreria", { nome: "Libreria piena di libri", stanza: "tutte", reparto: "soggiorno", tipo: "pav", w: 92, h: 188, prof: 0.4, piano: 186, qual: 2, prezzo: 1200, disegno: function () {
    var c = "#9a6b45", s = R(2, 2, 88, 184, "url(#a)", 3, bordo()) + R(8, 8, 76, 168, tono(c, -0.45), 2);
    var libri = ["#e03131", "#1c7ed6", "#2f9e44", "#f08c00", "#7048e8", "#e64980", "#0c8599", "#fab005"], i = 0, x, r, h, w, base;
    for (r = 0; r < 4; r++) {
      base = 50 + r * 42; x = 11;
      while (true) {
        h = 24 + ((i * 7) % 12); w = 5 + ((i * 3) % 4); if (x + w > 81) break;
        if (r === 1 && x > 52 && x < 70) { s += Pth("M58 " + base + " Q64 " + (base - 18) + " 70 " + base + " Z", "#40c057", bordo(1)) + R(59, base - 7, 10, 7, "#e8590c", 1.5, bordo(1)); x = 72; continue; }   // una piantina
        s += R(x, base - h, w, h, libri[i % 8], 1, "stroke='" + LINEA + "' stroke-width='0.8'") + R(x + 1, base - h + 4, w - 2, 1.4, "#fff", 0, "opacity='.5'");
        x += w + 0.6; i++; if (i % 6 === 5) x += 5;
      }
      s += R(8, base, 76, 4, tono(c, 0.08), 0, bordo(0.8));   // il ripiano
    }
    return svg(92, 188, morbido("a", c), s + R(4, 180, 84, 6, tono(c, -0.3), 1));
  } });
  ogg("lampada_stelo", { nome: "Lampada a stelo", stanza: "tutte", reparto: "soggiorno", tipo: "pav", w: 44, h: 172, prof: 0.35, qual: 2, prezzo: 700, stati: "accendi", luce: { x: 0.5, y: 0.12, r: 2.6, c: "#ffe3a3" }, disegno: function (on) {
    return svg(44, 172, on ? lin("p", "#fff8dc", "#ffd77a", true) : morbido("p", "#f1e3c2"),
      Pth("M22 34 L22 164", "none", "stroke='#3b3b3b' stroke-width='3'") + E(22, 166, 14, 4, "#3b3b3b", bordo(1.2)) + C(28, 118, 2, on ? "#e03131" : "#777") +
      (on ? E(22, 36, 12, 3, "#fff3b0") : "") + Pth("M6 36 L12 4 L32 4 L38 36 Z", "url(#p)", bordo(1.6)) + Pth("M9 20 L35 20", "none", "stroke='" + (on ? "#f6c84c" : "#d9c79f") + "' stroke-width='1.2'"));
  } });
  ogg("tavolino_legno", { nome: "Tavolino di legno", stanza: "tutte", reparto: "soggiorno", tipo: "pav", w: 110, h: 46, prof: 0.6, piano: 44, qual: 2, prezzo: 600, disegno: function () {
    var c = "#b07a4a";
    return svg(110, 46, morbido("a", c),
      R(2, 2, 106, 10, "url(#a)", 4, bordo()) + R(28, 5, 26, 2, "#fff", 1, "opacity='.3'") +
      R(10, 12, 7, 32, tono(c, -0.25), 2, bordo(1.4)) + R(93, 12, 7, 32, tono(c, -0.25), 2, bordo(1.4)) + R(16, 28, 78, 4, tono(c, -0.15), 1, bordo(1)));
  } });

  // ---- dal negozio: cucina ----
  ogg("frigo_moderno", { nome: "Frigo d'acciaio", stanza: "soggiorno", reparto: "cucina", tipo: "pav", w: 72, h: 184, prof: 0.65, piano: 182, qual: 2, prezzo: 2200, stati: "apri", lato: -1, corpo: [16, 86], luce: { x: 0.43, y: 0.62, r: 1.2, c: "#eef8ff" }, disegno: function (on) {
    var s = R(2, 2, 70, 178, "url(#a)", 6, bordo()) + Pth("M2 62 L72 62", "none", bordo(1.8));
    s += R(10, 14, 14, 20, "#2b3a42", 2, bordo(1)) + R(13, 18, 8, 3, "#69db7c", 1) + R(13, 24, 8, 6, "#4dabf7", 1, "opacity='.7'");   // il display e il ghiaccio
    s += R(60, 12, 5, 42, "url(#m)", 2.5, bordo(1.2));
    if (!on) s += R(60, 72, 5, 64, "url(#m)", 2.5, bordo(1.2)) + Pth("M10 70 L10 172", "none", "stroke='#fff' stroke-width='2' opacity='.45'");
    else s += R(6, 66, 62, 110, "url(#dentro)", 4, bordo(1.4)) + R(6, 94, 62, 2.5, "#cfd8dc") + R(6, 124, 62, 2.5, "#cfd8dc") + R(6, 152, 62, 2.5, "#cfd8dc") +   // aperto: pieno di roba buona
      R(10, 72, 8, 21, "#f1f8ff", 2, bordo(1)) + R(11, 69, 6, 4, "#1c7ed6", 1) + R(21, 76, 7, 17, "#ffd8a8", 2, bordo(1)) + R(22, 74, 5, 3, "#f08c00", 1) +
      C(36, 88, 5, "#e03131", bordo(1)) + C(46, 89, 4.5, "#82c91e", bordo(1)) + Pth("M52 93 L64 93 L60 80 Z", "#ffd43b", bordo(1)) +
      R(10, 108, 24, 15, "#fff0f6", 3, bordo(1)) + Pth("M10 113 Q22 104 34 113", "#f783ac", bordo(0.8)) + C(22, 105, 2.2, "#e03131") +   // la torta con la ciliegina
      E(46, 118, 6.5, 5, "#fff9db", bordo(1)) + E(57, 118, 6.5, 5, "#fff9db", bordo(1)) +
      Pth("M12 150 Q15 136 20 150 Z", "#ff922b", bordo(1)) + Pth("M23 150 Q26 134 31 150 Z", "#ff922b", bordo(1)) + C(43, 144, 6, "#94d82d", bordo(1)) + R(52, 136, 12, 14, "#a5d8ff", 3, bordo(1)) +
      R(10, 160, 54, 14, "#e9ecef", 3, bordo(1)) + C(22, 167, 3, "#ff8787") + C(32, 167, 3, "#ffa94d") + C(42, 167, 3, "#ffe066") +
      Pth("M72 64 L88 70 L88 172 L72 178 Z", "url(#a)", bordo()) + R(78, 88, 4, 56, "url(#m)", 2);
    return svg(102, 186, lin("a", "#f1f3f5", "#b9c2ca") + lin("m", "#f8f9fa", "#868e96", true) + "<radialGradient id='dentro' cx='.5' cy='.2' r='.9'><stop offset='0' stop-color='#ffffff'/><stop offset='1' stop-color='#e3eef5'/></radialGradient>",
      "<g transform='translate(14 0)'>" + s + R(6, 180, 8, 5, "#555") + R(60, 180, 8, 5, "#555") + "</g>");
  } });
  ogg("cucina_moderna", { nome: "Cucina col forno", stanza: "soggiorno", reparto: "cucina", tipo: "pav", w: 72, h: 92, prof: 0.62, piano: 90, qual: 2, prezzo: 1600, stati: "accendi", luce: { x: 0.5, y: 0.55, r: 1.1, c: "#ffb36b" }, disegno: function (on) {
    var piastra = function (x, r) { return E(x, 6, r, r * 0.3, "#2b2b2b") + E(x, 6, r * 0.7, r * 0.2, "none", "stroke='" + (on ? "#ff4d2e" : "#5c5c5c") + "' stroke-width='1.4'") + (on ? E(x, 6, r * 0.38, r * 0.11, "#ff8a3d") : ""); };
    return svg(72, 92, morbido("a", "#f8f9fa") + lin("v", on ? "#ffc078" : "#3b3b3b", on ? "#e8590c" : "#1f1f1f", true),
      R(2, 8, 68, 82, "url(#a)", 3, bordo()) + R(1, 3, 70, 7, "#343a40", 2, bordo(1.4)) + piastra(19, 11) + piastra(53, 11) +
      R(6, 15, 60, 9, "#e9ecef", 2, bordo(1)) + C(14, 19.5, 2.4, "#495057") + C(24, 19.5, 2.4, "#495057") + C(48, 19.5, 2.4, "#495057") + C(58, 19.5, 2.4, "#495057") +
      R(31, 16, 10, 7, "#212529", 1) + R(32.5, 17.5, 7, 4, on ? "#69db7c" : "#343a40", 0.5) +
      R(8, 28, 56, 50, "#dee2e6", 3, bordo(1.4)) + R(14, 35, 44, 30, "url(#v)", 3, bordo(1.2)) +
      (on ? R(22, 55, 28, 3, "#7a3e1d", 1) + Pth("M26 55 Q36 44 46 55 Z", "#c97b3a", bordo(1)) : Pth("M18 38 L30 38 L18 52 Z", "#fff", "opacity='.12'")) +   // acceso: c'è una torta che cuoce
      R(14, 70, 44, 3, "#adb5bd", 1.5) + R(8, 84, 8, 6, "#343a40") + R(56, 84, 8, 6, "#343a40"));
  } });
  ogg("tavolo_pranzo", { nome: "Tavolo con la tovaglia", stanza: "soggiorno", reparto: "cucina", tipo: "pav", w: 140, h: 78, prof: 0.85, piano: 76, qual: 2, prezzo: 1100, disegno: function () {
    var c = "#a8754a";
    return svg(140, 78, morbido("a", c) + "<pattern id='q' width='10' height='10' patternUnits='userSpaceOnUse'><rect width='10' height='10' fill='#fff'/><rect width='5' height='5' fill='#ff6b6b'/><rect x='5' y='5' width='5' height='5' fill='#ff6b6b'/></pattern>",
      R(12, 14, 7, 62, tono(c, -0.2), 2, bordo(1.4)) + R(121, 14, 7, 62, tono(c, -0.2), 2, bordo(1.4)) +
      R(2, 2, 136, 8, "url(#a)", 3, bordo()) + Pth("M6 6 L134 6 L134 24 L126 22 L118 25 L110 22 L102 25 L94 22 L86 25 L78 22 L70 25 L62 22 L54 25 L46 22 L38 25 L30 22 L22 25 L14 22 L6 24 Z", "url(#q)", bordo(1.2)) +
      C(40, 4, 3, "#fff", bordo(0.8)) + Pth("M98 0 L104 0 L102 6 L100 6 Z", "#74c0fc", bordo(0.8)));
  } });
  ogg("sedia_legno", { nome: "Sedia di legno", stanza: "tutte", reparto: "cucina", tipo: "pav", w: 46, h: 92, prof: 0.45, piano: 46, qual: 2, prezzo: 350, azione: "siedi", seduta: 44, posti: [23], disegno: function () {
    var c = "#b07a4a";
    return svg(46, 92, morbido("a", c),
      R(8, 2, 30, 7, "url(#a)", 2, bordo(1.4)) + R(10, 9, 4, 36, tono(c, -0.15), 1, bordo(1)) + R(32, 9, 4, 36, tono(c, -0.15), 1, bordo(1)) + R(14, 16, 18, 4, tono(c, -0.08), 1) + R(14, 26, 18, 4, tono(c, -0.08), 1) +
      R(3, 44, 40, 7, "url(#a)", 2, bordo()) + R(5, 51, 5, 40, tono(c, -0.25), 1.5, bordo(1.2)) + R(36, 51, 5, 40, tono(c, -0.25), 1.5, bordo(1.2)) + R(10, 72, 26, 3, tono(c, -0.3), 1));
  } });

  // ---- dal negozio: camera ----
  ogg("armadio_bianco", { nome: "Armadio bianco a tre ante", stanza: "camera", reparto: "camera", tipo: "pav", w: 120, h: 194, prof: 0.6, qual: 2, prezzo: 2400, stati: "apri", vestiti: true, corpo: [22, 142], disegno: function (on) {
    var s = R(4, 8, 116, 178, "url(#a)", 3, bordo()) + R(2, 2, 120, 9, "#f4efe6", 2, bordo());
    if (!on) s += R(9, 15, 34, 148, "url(#b)", 2, bordo(1.6)) + R(45, 15, 34, 148, "url(#b)", 2, bordo(1.6)) + R(81, 15, 34, 148, "url(#b)", 2, bordo(1.6)) +
      R(37, 78, 3, 22, "#d4a72c", 1.5) + R(48, 78, 3, 22, "#d4a72c", 1.5) + R(109, 78, 3, 22, "#d4a72c", 1.5);
    else {   // aperto: maglie, giacche e un vestito, le scatole in alto, le scarpe in basso
      var appeso = function (x, col, lungo, largo) { return Pth("M" + x + " 34 l0 -4 q0 -3 3 -3", "none", "stroke='#999' stroke-width='1.2'") + Pth("M" + (x - largo) + " 39 L" + x + " 34 L" + (x + largo) + " 39 L" + (x + largo - 1) + " " + (39 + lungo) + " L" + (x - largo + 1) + " " + (39 + lungo) + " Z", col, bordo(1.3)) + Pth("M" + (x - 3) + " 35 L" + x + " 41 L" + (x + 3) + " 35", "none", "stroke='" + tono(col, -0.3) + "' stroke-width='1.2'"); };
      var vestito = function (x, col) { return Pth("M" + x + " 34 l0 -4 q0 -3 3 -3", "none", "stroke='#999' stroke-width='1.2'") + Pth("M" + (x - 6) + " 38 L" + x + " 34 L" + (x + 6) + " 38 L" + (x + 4) + " 56 L" + (x + 12) + " 104 L" + (x - 12) + " 104 L" + (x - 4) + " 56 Z", col, bordo(1.3)) + Pth("M" + (x - 5) + " 56 L" + (x + 5) + " 56", "none", "stroke='#fff' stroke-width='2'"); };
      s += R(9, 15, 106, 148, "#ddd3c6", 2, bordo(1.4)) + R(9, 15, 106, 148, "url(#ombra)", 2) + R(10, 22, 104, 3.5, "#c9c9c9", 2) +
        R(14, 17, 18, 8, "#f4d35e", 1.5, bordo(1)) + R(36, 17, 22, 8, "#9bd1e5", 1.5, bordo(1)) +   // le scatole sopra
        appeso(22, "#1971c2", 56, 9) + appeso(40, "#f76707", 46, 9) + vestito(60, "#e64980") + appeso(80, "#2b8a3e", 60, 9) + appeso(98, "#495057", 66, 10) +
        R(9, 128, 106, 3, tono("#c8b9a6", -0.1)) + R(14, 140, 16, 10, "#c92a2a", 4, bordo(1.2)) + R(32, 140, 16, 10, "#c92a2a", 4, bordo(1.2)) + R(56, 142, 22, 8, "#f8f9fa", 3, bordo(1.2)) + R(84, 140, 22, 10, "#5c3a21", 4, bordo(1.2)) +
        Pth("M9 15 L-8 22 L-8 158 L9 163 Z", "url(#b)", bordo(1.6)) + Pth("M115 15 L134 23 L134 156 L115 163 Z", "url(#b)", bordo(1.6)) + R(-4, 80, 3, 18, "#d4a72c", 1.5) + R(127, 80, 3, 18, "#d4a72c", 1.5);
    }
    s += R(9, 166, 106, 18, "url(#b)", 2, bordo(1.6)) + R(54, 173, 16, 3, "#d4a72c", 1.5) + R(8, 186, 10, 7, "#c8b9a6", 1) + R(106, 186, 10, 7, "#c8b9a6", 1);
    return svg(164, 194, morbido("a", "#f4efe6") + morbido("b", "#ffffff") + lin("ombra", "rgba(0,0,0,.3)", "rgba(0,0,0,0)", true), "<g transform='translate(20 0)'>" + s + "</g>");
  } });
  ogg("comodino_legno", { nome: "Comodino coi cassetti", stanza: "camera", reparto: "camera", tipo: "pav", w: 50, h: 58, prof: 0.45, piano: 56, qual: 2, prezzo: 400, disegno: function () {
    var c = "#c08a55";
    return svg(50, 58, morbido("a", c),
      R(2, 3, 46, 47, "url(#a)", 3, bordo()) + R(1, 1, 48, 5, tono(c, -0.15), 2, bordo(1.2)) + R(6, 9, 38, 17, tono(c, 0.08), 2, bordo(1.2)) + R(6, 29, 38, 17, tono(c, 0.08), 2, bordo(1.2)) +
      C(25, 17.5, 2.2, "#e0c070", bordo(0.8)) + C(25, 37.5, 2.2, "#e0c070", bordo(0.8)) + R(5, 50, 5, 7, tono(c, -0.35)) + R(40, 50, 5, 7, tono(c, -0.35)));
  } });
  ogg("lampada_comodino", { nome: "Lampada da comodino", stanza: "camera", reparto: "camera", tipo: "acc", w: 24, h: 38, qual: 2, prezzo: 350, stati: "accendi", luce: { x: 0.5, y: 0.3, r: 1.5, c: "#ffe3a3" }, disegno: function (on) {
    return svg(26, 40, (on ? lin("p", "#fff8dc", "#ffd77a", true) : morbido("p", "#f8f0e3")) + morbido("b", "#4dabf7"),
      (on ? E(13, 17, 6, 2.2, "#fff3b0") : "") + R(12, 16, 2, 7, "#888") + Pth("M4 17 L7 3 L19 3 L22 17 Z", "url(#p)", bordo(1.3)) + E(13, 30, 8, 8.5, "url(#b)", bordo(1.3)) + R(6, 36, 14, 3.5, "#2f6fa8", 1.5, bordo(1)));
  } });

  // ---- dal negozio: bagno ----
  ogg("vasca", { nome: "Vasca da bagno coi piedini", stanza: "bagno", reparto: "bagno", tipo: "pav", w: 170, h: 66, prof: 0.8, qual: 2, prezzo: 2500, azione: "bagno", cuscino: [46, 19], disegno: function (on, parte) {
    var schiuma = "", i;
    for (i = 0; i < 15; i++) schiuma += C(12 + i * 10.5 + (i % 2) * 3, 17 - (i % 3) * 3, 6.5 + (i % 3) * 1.5, "#fff", "stroke='#cfe8f3' stroke-width='1'");
    var corpo = Pth("M4 16 L166 16 Q166 50 140 56 L30 56 Q4 50 4 16 Z", "url(#a)", bordo()) + R(2, 13, 166, 7, "#f8f9fa", 3.5, bordo(1.6)) + Pth("M16 26 Q22 44 40 48", "none", "stroke='#fff' stroke-width='3' opacity='.9'");
    var piedi = Pth("M30 54 q-6 6 -10 10 l8 0 q4 -4 8 -8 Z M140 54 q6 6 10 10 l-8 0 q-4 -4 -8 -8 Z", "#d4a72c", bordo(1.2));
    var rubinetto = Pth("M152 14 L152 3 L162 3 L162 6", "none", "stroke='#adb5bd' stroke-width='3'") + C(147, 7, 2.2, "#ced4da", bordo(0.8));
    return svg(170, 66, morbido("a", "#ffffff"), parte === "coperta" ? schiuma + corpo + piedi : rubinetto + corpo + piedi);   // chi fa il bagno sta tra la vasca e la schiuma
  } });
  ogg("lavandino_mobile", { nome: "Lavandino col mobiletto", stanza: "bagno", reparto: "bagno", tipo: "pav", w: 80, h: 92, prof: 0.5, piano: 78, qual: 2, prezzo: 1200, uso: "acqua", disegno: function (on) {
    var c = "#6c8ea0";
    return svg(80, 92, morbido("a", c) + morbido("b", "#ffffff"),
      Pth("M40 12 L40 4 Q40 1 44 1 L52 1 L52 3", "none", "stroke='#adb5bd' stroke-width='3' stroke-linecap='round'") + R(35, 10, 10, 4, "#ced4da", 1.5, bordo(0.8)) +
      (on ? R(50.2, 3, 3.6, 11, "#4dabf7", 1.8) + R(51.2, 4, 1.2, 9, "#fff", 0.6, "opacity='.8'") + C(46, 11, 1.2, "#4dabf7") + C(57, 10, 1.4, "#4dabf7") + C(60, 7, 1, "#74c0fc") : "") +
      Pth("M5 14 L75 14 L72 24 L8 24 Z", "url(#b)", bordo()) +
      R(5, 24, 70, 62, "url(#a)", 3, bordo()) + R(10, 30, 28, 50, tono(c, 0.1), 2, bordo(1.2)) + R(42, 30, 28, 50, tono(c, 0.1), 2, bordo(1.2)) + R(31, 48, 3, 14, "#e9ecef", 1.5) + R(46, 48, 3, 14, "#e9ecef", 1.5) +
      R(7, 86, 66, 5, tono(c, -0.35), 2));
  } });

  // ---- dal negozio: decorazioni ----
  ogg("orologio_muro", { nome: "Orologio da parete", stanza: "tutte", reparto: "deco", tipo: "muro", w: 38, h: 38, qual: 2, prezzo: 300, disegno: function () {
    var s = C(20, 20, 18, "#c92a2a", bordo(1.6)) + C(20, 20, 14.5, "url(#o)"), i, a;
    for (i = 0; i < 12; i++) { a = i * Math.PI / 6; s += Pth("M" + r1(20 + Math.sin(a) * 11.5) + " " + r1(20 - Math.cos(a) * 11.5) + " L" + r1(20 + Math.sin(a) * 13.5) + " " + r1(20 - Math.cos(a) * 13.5), "none", "stroke='#495057' stroke-width='" + (i % 3 ? 1 : 2) + "'"); }
    return svg(40, 40, lin("o", "#ffffff", "#e9ecef", true), s + Pth("M20 20 L14 14 M20 20 L27 13", "none", "stroke='#212529' stroke-width='2' stroke-linecap='round'") + Pth("M20 20 L20 30", "none", "stroke='#e03131' stroke-width='1'") + C(20, 20, 1.8, "#212529"));
  } });
  ogg("poster_concerto", { nome: "Poster del concerto", stanza: "tutte", reparto: "deco", tipo: "muro", w: 40, h: 56, qual: 2, prezzo: 250, disegno: function () {
    return svg(42, 58, lin("c", "#212529", "#5f3dc4", true),
      R(2, 2, 38, 54, "url(#c)", 2, bordo(1.4)) + C(12, 12, 1.2, "#ffe066") + C(32, 8, 1, "#ffe066") + C(28, 18, 0.8, "#fff") + C(8, 26, 0.9, "#fff") +
      Pth("M14 40 L28 18 L31 20 L18 42 Z", "#f08c00", bordo(1)) + E(14, 41, 6, 5, "#e8590c", bordo(1)) + C(14, 41, 1.6, "#212529") + Pth("M28 18 L31 13 L34 15 L31 20", "#adb5bd", bordo(0.8)) +   // la chitarra
      "<text x='21' y='53' text-anchor='middle' font-family='Arial Black,Arial' font-weight='900' font-size='8' fill='#ffd43b'>ROCK!</text>");
  } });
  ogg("tappeto_persiano", { nome: "Tappeto persiano", stanza: "tutte", reparto: "deco", tipo: "tappeto", w: 190, h: 52, qual: 2, prezzo: 900, disegno: function () {
    return svg(190, 52, "",
      E(95, 26, 92, 24, "#8f2d2d", bordo(1.8)) + E(95, 26, 81, 19, "none", "stroke='#e8c27a' stroke-width='3'") + E(95, 26, 66, 14.5, "#1f4e79") +
      E(95, 26, 52, 10.5, "none", "stroke='#e8c27a' stroke-width='2' stroke-dasharray='5 3'") + E(95, 26, 24, 6, "#c0392b") + E(95, 26, 11, 3, "#e8c27a") +
      E(40, 26, 7, 3, "#e8c27a", "opacity='.8'") + E(150, 26, 7, 3, "#e8c27a", "opacity='.8'") +
      Pth("M3 25 l-3 -1 M3 27 l-3 2 M187 25 l3 -1 M187 27 l3 2", "none", "stroke='#e8c27a' stroke-width='1.4'"));
  } });
  ogg("cactus", { nome: "Cactus col fiore", stanza: "tutte", reparto: "deco", tipo: "acc", w: 18, h: 30, qual: 2, prezzo: 150, disegno: function () {
    var braccio = function (d) { return Pth(d, "none", "stroke='" + LINEA + "' stroke-width='5.4' stroke-linecap='round'") + Pth(d, "none", "stroke='#51cf66' stroke-width='3.4' stroke-linecap='round'"); };
    return svg(20, 32, morbido("v", "#e8590c") + morbido("c", "#51cf66"),
      braccio("M8 17 L4 17 Q2.5 17 2.5 14 L2.5 10") + braccio("M14 13 L16 13 Q17.5 13 17.5 10 L17.5 7") +
      R(7.5, 4, 7, 20, "url(#c)", 3.5, bordo(1.2)) + Pth("M11 7 L11 22", "none", "stroke='#2f9e44' stroke-width='0.8'") + C(11, 3.5, 2.4, "#f783ac", bordo(0.8)) + C(11, 3.5, 0.9, "#ffe066") +
      Pth("M5 22 L17 22 L15 31 L7 31 Z", "url(#v)", bordo(1.2)) + R(4.5, 21, 13, 3, "#d9480f", 1, bordo(0.8)));
  } });
  ogg("acquario", { nome: "Acquario coi pesciolini", stanza: "tutte", reparto: "deco", tipo: "acc", w: 56, h: 42, qual: 2, prezzo: 1300, disegno: function () {
    var pesce = function (x, y, c, dur) { return "<g><animateTransform attributeName='transform' type='translate' values='0 0;13 1;0 0' dur='" + dur + "s' repeatCount='indefinite'/>" + E(x, y, 4, 2.6, c, bordo(0.6)) + Pth("M" + (x - 3.6) + " " + y + " l-3 -2.6 l0 5.2 Z", c, bordo(0.6)) + C(x + 2, y - 0.6, 0.6, "#000") + "</g>"; };   // nuotano avanti e indietro
    return svg(56, 42, lin("w", "#a5d8ff", "#339af0", true),
      R(2, 4, 52, 32, "url(#w)", 3, bordo(1.4)) + R(2, 2, 52, 4, "#343a40", 1.5) + R(4, 30, 48, 5, "#e9c46a", 1) +
      Pth("M7 31 Q11 22 8 13 M13 31 Q16 25 14 18 M46 31 Q44 23 47 15", "none", "stroke='#2f9e44' stroke-width='2.2' stroke-linecap='round'") +
      pesce(20, 15, "#ff922b", 6) + pesce(29, 24, "#f06595", 8) + C(40, 12, 1.2, "#fff", "opacity='.8'") + C(41, 8, 0.9, "#fff", "opacity='.8'") +
      R(5, 7, 3, 22, "#fff", 1.5, "opacity='.35'") + R(3, 36, 50, 5, "#495057", 1.5, bordo(1)));
  } });

  // la roba di partenza si trova anche al Mercatino dell'usato del negozio, a poco
  var PREZZI_USATO = { divano_toppa: 400, tavolino_cassetta: 50, tv_tubo: 300, sedia_plastica: 80, pianta_secca: 60, frigo_ammaccato: 500, fornello_vecchio: 350,
    tappeto_liso: 120, quadro_storto: 60, lampadina: 40, letto_semplice: 450, comodino_cartone: 30, armadio_storto: 400, sveglia: 50, lampada_storta: 90,
    poster_strappato: 40, wc_vecchio: 250, lavandino_colonna: 200, specchio_scheggiato: 80, doccia_tenda: 500, carta_igienica: 10, bicchiere_spazzolino: 20, tappetino: 60 };
  Object.keys(PREZZI_USATO).forEach(function (t) { if (OGG[t]) OGG[t].prezzo = PREZZI_USATO[t]; });
  // ---- gli oggetti speciali del negozio: una frase in più nella scheda per comprarli (gli altri no: il negozio resta pulito) ----
  var FRASI = {
    vasca: "Una vasca vera, coi piedini dorati: ci entri, ti riempi di schiuma e le bolle volano per tutto il bagno. Il massimo del relax.",
    acquario: "Due pesciolini che nuotano avanti e indietro tutto il giorno. E non c'è nemmeno da dargli da mangiare!",
    frigo_moderno: "Il frigo dei sogni: dentro c'è di tutto, dalla torta con la ciliegina alle carote. Aprilo e scegli cosa mangiare.",
    cucina_moderna: "Accendila e nel forno si cuoce una torta. Il profumo arriva fino in camera.",
    armadio_bianco: "Tre ante piene di vestiti, scarpe e scatole. Aprilo e cambi look quando vuoi.",
    letto_matrimoniale: "Una trapunta rosa morbidissima e due cuscini belli gonfi: qui si dorme come re.",
    divano_velluto: "Velluto verde acqua, bottoni come nei salotti eleganti e due cuscini gialli. Il pezzo forte del soggiorno.",
    libreria: "Piena di libri colorati, con una piantina in mezzo: la stanza sembra subito più intelligente.",
    tv_piatta: "Lo schermo piatto con la partita sempre in onda. Accendila e la stanza si illumina di blu.",
    lampada_stelo: "Accendila la sera: fa una luce calda che riempie l'angolo."
  };
  Object.keys(FRASI).forEach(function (t) { if (OGG[t]) OGG[t].frase = FRASI[t]; });

  // ---- di fianco (in Arreda il tasto "Gira": davanti → di fianco → di fianco dall'altra parte) ----
  //      solo i mobili dove ha senso; letti e vasca visti dai piedi (ci si dorme e ci si fa il bagno anche così)
  OGG.divano_toppa.fianco = function () {
    var c = "#8b6a4f";
    return svg(92, 92, morbido("a", c) + morbido("b", tono(c, -0.12)) + morbido("t", "#b8863b"),
      R(4, 8, 26, 50, "url(#a)", 12, bordo()) + R(2, 34, 88, 42, "url(#b)", 14, bordo()) +   // lo schienale dietro e il bracciolo di fianco
      Pth("M14 46 Q46 40 80 46", "none", "stroke='" + tono(c, -0.3) + "' stroke-width='1.4' opacity='.6'") + C(70, 56, 2.6, tono(c, -0.4), "opacity='.5'") +
      R(6, 72, 80, 12, tono(c, -0.25), 4, bordo()) + R(12, 83, 9, 8, "url(#t)", 1, bordo(1.6)) + R(70, 83, 9, 8, "url(#t)", 1, bordo(1.6)));
  };
  OGG.divano_velluto.fianco = function () {
    var c = "#1f8a8a";
    return svg(94, 94, morbido("a", c) + morbido("b", tono(c, -0.1)) + lin("o", "#f6d77a", "#c9962e", true) + morbido("k", "#f2c14e"),
      R(4, 6, 28, 52, "url(#a)", 14, bordo()) + C(18, 22, 2, tono(c, -0.35)) + Pth("M28 30 Q40 20 54 30 L52 44 L28 44 Z", "url(#k)", bordo(1.6)) +
      R(2, 36, 90, 40, "url(#b)", 18, bordo()) + R(8, 72, 78, 10, tono(c, -0.3), 4, bordo()) +
      Pth("M16 82 L12 93 M78 82 L82 93", "none", "stroke='url(#o)' stroke-width='5' stroke-linecap='round'"));
  };
  OGG.poltrona_gialla.fianco = function () {
    var c = "#f2b134";
    return svg(80, 92, morbido("a", c) + morbido("b", tono(c, -0.1)),
      R(4, 4, 26, 56, "url(#a)", 13, bordo()) + R(2, 36, 76, 40, "url(#b)", 16, bordo()) + R(6, 72, 68, 8, tono(c, -0.3), 3, bordo()) +
      Pth("M14 80 L11 91 M66 80 L69 91", "none", "stroke='#5a3a22' stroke-width='4' stroke-linecap='round'"));
  };
  OGG.letto_semplice.fiancoCuscino = [52, 41];
  OGG.letto_semplice.fianco = function (on, parte) {
    var defs = morbido("l", "#b88b5c") + "<pattern id='q' width='14' height='14' patternUnits='userSpaceOnUse'><rect width='14' height='14' fill='#5d7fa3'/><rect width='7' height='14' fill='#8aa6c4' opacity='.6'/><rect width='14' height='7' fill='#3e5f82' opacity='.4'/></pattern>";
    var davanti = R(0, 62, 104, 9, "url(#l)", 2, bordo()) + R(4, 70, 8, 10, tono("#b88b5c", -0.3), 1, bordo(1.4)) + R(92, 70, 8, 10, tono("#b88b5c", -0.3), 1, bordo(1.4));
    if (parte === "coperta") return svg(104, 82, defs, Pth("M2 44 Q26 36 52 42 Q78 36 102 44 L102 66 L2 66 Z", "url(#q)", bordo()) + davanti);
    return svg(104, 82, defs,
      R(8, 2, 88, 46, "url(#l)", 4, bordo()) + R(4, 32, 96, 14, "#efe7d4", 6, bordo()) +   // la testiera in fondo e il materasso
      Pth("M30 32 Q52 20 74 32 L74 38 L30 38 Z", "#f6f1e3", bordo(1.6)) +                    // il cuscino
      Pth("M2 40 Q52 34 102 40 L102 66 L2 66 Z", "url(#q)", bordo()) + davanti);             // la coperta che pende davanti
  };
  OGG.letto_matrimoniale.fiancoCuscino = [82, 44];
  OGG.letto_matrimoniale.fianco = function (on, parte) {
    var defs = morbido("l", "#8a5a3a") + morbido("t", "#e8789a");
    var piedi = R(2, 44, 160, 48, "url(#l)", 6, bordo()) + R(10, 52, 144, 4, tono("#8a5a3a", 0.15), 2);   // la pediera
    if (parte === "coperta") return svg(164, 96, defs, Pth("M10 46 Q40 34 82 40 Q124 34 154 46 L154 52 L10 52 Z", "url(#t)", bordo()) + piedi);
    return svg(164, 96, defs,
      R(6, 2, 152, 56, "url(#l)", 8, bordo()) +                                             // la testiera in fondo
      Pth("M24 26 Q44 16 64 26 L64 42 L24 42 Z", "#fff", bordo(1.6)) + Pth("M100 26 Q120 16 140 26 L140 42 L100 42 Z", "#fff", bordo(1.6)) +
      Pth("M8 42 Q82 34 156 42 L156 52 L8 52 Z", "url(#t)", bordo()) + piedi);
  };
  OGG.sedia_plastica.fianco = function () {
    var c = "#ece9df";
    return svg(46, 84, morbido("a", c),
      Pth("M6 4 Q10 2 13 4 L13 42 L6 42 Z", "url(#a)", bordo()) + R(4, 40, 38, 7, "url(#a)", 3, bordo()) +
      Pth("M8 47 L4 82 M38 47 L42 82", "none", "stroke='" + LINEA + "' stroke-width='5'") + Pth("M8 47 L4 82 M38 47 L42 82", "none", "stroke='" + c + "' stroke-width='3'"));
  };
  OGG.sedia_legno.fianco = function () {
    var c = "#b07a4a";
    return svg(46, 92, morbido("a", c),
      R(6, 2, 7, 44, "url(#a)", 2, bordo(1.4)) + R(3, 44, 40, 7, "url(#a)", 2, bordo()) + R(5, 51, 5, 40, tono(c, -0.25), 1.5, bordo(1.2)) + R(36, 51, 5, 40, tono(c, -0.25), 1.5, bordo(1.2)) + R(10, 72, 26, 3, tono(c, -0.3), 1));
  };
  OGG.wc_vecchio.fianco = function (on) {
    var c = "#f1ecd8";
    return svg(66, 82, morbido("a", c),
      R(2, 2, 18, 32, "url(#a)", 4, bordo()) + R(6, on ? 5 : 4, 8, 3, on ? "#bfb48a" : "#d9cfa8", 1.5) +
      Pth("M14 34 L60 34 Q64 48 48 56 L40 74 L20 74 L18 56 Q12 48 14 34 Z", "url(#a)", bordo()) + Pth("M12 31 L62 31 L62 37 L12 37 Z", "#e8dfb8", bordo(1.6)) +
      (on ? sciacquone(38, 32) : "") + R(16, 74, 28, 6, tono(c, -0.1), 2, bordo(1.6)));
  };
  OGG.wc_moderno.fianco = function (on) {
    return svg(62, 74, morbido("a", "#ffffff"),
      R(2, 2, 16, 28, "url(#a)", 6, bordo()) + R(5, 5, 8, 3, on ? "#4dabf7" : "#c0c8cc", 1.5) +
      Pth("M12 30 L56 30 Q60 46 44 52 L36 68 L18 68 Q18 58 16 52 Q10 46 12 30 Z", "url(#a)", bordo()) + R(10, 28, 48, 5, "#f4f6f7", 2.5, bordo(1.4)) + (on ? sciacquone(34, 29) : ""));
  };
  OGG.vasca.fiancoCuscino = [42, 19];
  OGG.vasca.fianco = function (on, parte) {
    var schiuma = "", i;
    for (i = 0; i < 7; i++) schiuma += C(10 + i * 11 + (i % 2) * 2, 17 - (i % 3) * 3, 6.5 + (i % 3) * 1.4, "#fff", "stroke='#cfe8f3' stroke-width='1'");
    var corpo = Pth("M4 16 L80 16 Q80 52 60 56 L24 56 Q4 52 4 16 Z", "url(#a)", bordo()) + R(2, 13, 80, 7, "#f8f9fa", 3.5, bordo(1.6)) + Pth("M12 24 Q14 44 28 48", "none", "stroke='#fff' stroke-width='3' opacity='.9'");
    var piedi = Pth("M20 54 q-5 6 -8 10 l8 0 q3 -4 6 -8 Z M64 54 q5 6 8 10 l-8 0 q-3 -4 -6 -8 Z", "#d4a72c", bordo(1.2));
    return svg(84, 66, morbido("a", "#ffffff"), parte === "coperta" ? schiuma + corpo + piedi : Pth("M42 14 L42 4 L49 4", "none", "stroke='#adb5bd' stroke-width='3'") + corpo + piedi);
  };

  // =========================================================
  //  PARETI E PAVIMENTI (quello che c'è all'inizio è sciupato; il resto si compra)
  // =========================================================
  var CARTE = {
    sbiadita:   { nome: "Carta sbiadita", base: "#d8c8a2", qual: 0, motivo: function (s) { return "<pattern id='" + s + "' width='34' height='34' patternUnits='userSpaceOnUse'><rect width='34' height='34' fill='#d8c8a2'/><circle cx='8' cy='9' r='3' fill='#c7b183' opacity='.7'/><circle cx='25' cy='26' r='3' fill='#c7b183' opacity='.7'/><path d='M8 12 l0 5 M25 29 l0 5' stroke='#b9a676' stroke-width='1'/></pattern>"; }, macchie: true },
    crepata:    { nome: "Intonaco crepato", base: "#e3d9c2", qual: 0, motivo: function (s) { return "<pattern id='" + s + "' width='60' height='60' patternUnits='userSpaceOnUse'><rect width='60' height='60' fill='#e3d9c2'/><circle cx='12' cy='40' r='1' fill='#cfc3a6'/><circle cx='44' cy='14' r='1.4' fill='#cfc3a6'/></pattern>"; }, crepe: true },
    piastrelle: { nome: "Piastrelle ingiallite", base: "#ece6cf", qual: 0, motivo: function (s) { return "<pattern id='" + s + "' width='18' height='18' patternUnits='userSpaceOnUse'><rect width='18' height='18' fill='#c9c2a4'/><rect x='1' y='1' width='16' height='16' rx='1' fill='#efe9d3'/></pattern>"; }, macchie: true },
    righe:      { nome: "Righe verdi", base: "#d9ead3", qual: 2, prezzo: 600, motivo: function (s) { return "<pattern id='" + s + "' width='24' height='24' patternUnits='userSpaceOnUse'><rect width='24' height='24' fill='#e6f2df'/><rect width='10' height='24' fill='#9ccb8c'/><rect x='11' width='1.5' height='24' fill='#c7e2bc'/></pattern>"; } },
    fiori:      { nome: "Fiori blu", base: "#eef3fb", qual: 2, prezzo: 700, motivo: function (s) { return "<pattern id='" + s + "' width='30' height='30' patternUnits='userSpaceOnUse'><rect width='30' height='30' fill='#f3f6fc'/><g fill='#5b8bd6'><circle cx='8' cy='8' r='2.4'/><circle cx='5' cy='5' r='2'/><circle cx='11' cy='5' r='2'/><circle cx='5' cy='11' r='2'/><circle cx='11' cy='11' r='2'/></g><circle cx='8' cy='8' r='1.6' fill='#ffd43b'/><circle cx='23' cy='23' r='2' fill='#9ab8e8'/></pattern>"; } },
    azzurre:    { nome: "Piastrelle azzurre", base: "#d7eef5", qual: 2, prezzo: 650, motivo: function (s) { return "<pattern id='" + s + "' width='18' height='18' patternUnits='userSpaceOnUse'><rect width='18' height='18' fill='#9fc9d6'/><rect x='1' y='1' width='16' height='16' rx='1.5' fill='#d3ecf3'/><rect x='3' y='3' width='6' height='2' rx='1' fill='#fff' opacity='.6'/></pattern>"; } },
    mattoni:    { nome: "Mattoncini", base: "#e2b49a", qual: 2, prezzo: 750, motivo: function (s) { return "<pattern id='" + s + "' width='40' height='20' patternUnits='userSpaceOnUse'><rect width='40' height='20' fill='#f1e6dc'/><rect x='1' y='1' width='18' height='8' rx='1' fill='#d9825b'/><rect x='21' y='1' width='18' height='8' rx='1' fill='#cf7550'/><rect x='-9' y='11' width='18' height='8' rx='1' fill='#cf7550'/><rect x='11' y='11' width='18' height='8' rx='1' fill='#e08e66'/><rect x='31' y='11' width='18' height='8' rx='1' fill='#cf7550'/></pattern>"; } },
    stelle:     { nome: "Cielo stellato", base: "#2b3a67", qual: 2, prezzo: 900, motivo: function (s) { return "<pattern id='" + s + "' width='40' height='40' patternUnits='userSpaceOnUse'><rect width='40' height='40' fill='#2b3a67'/><circle cx='8' cy='10' r='1.4' fill='#ffe066'/><circle cx='30' cy='6' r='1' fill='#fff'/><circle cx='22' cy='26' r='1.8' fill='#ffe066'/><circle cx='4' cy='32' r='0.9' fill='#fff'/><path d='M34 30 q2 -1 2 -4 q0 3 2 4 q-2 1 -2 4 q0 -3 -2 -4z' fill='#fff'/></pattern>"; } },
  };
  var PAVIMENTI = {
    laminato:   { nome: "Laminato graffiato", qual: 0, tipo: "assi", c1: "#a4774e", c2: "#946a43", righe: "#7d5735", graffi: true },
    linoleum:   { nome: "Linoleum consumato", qual: 0, tipo: "scacchi", c1: "#d9d2bd", c2: "#a9a28e", righe: "#8f8975", graffi: true },
    parquet:    { nome: "Parquet di rovere", qual: 2, prezzo: 800, tipo: "assi", c1: "#d6a86a", c2: "#c99a5c", righe: "#a8793e" },
    marmo:      { nome: "Marmo bianco", qual: 2, prezzo: 900, tipo: "scacchi", c1: "#f4f2ee", c2: "#e2ded6", righe: "#c9c3b8" },
    moquette:   { nome: "Moquette blu", qual: 2, prezzo: 700, tipo: "scacchi", c1: "#5c7cfa", c2: "#566fe8", righe: "#4c63d2" },
    cotto:      { nome: "Cotto toscano", qual: 2, prezzo: 850, tipo: "scacchi", c1: "#c8693f", c2: "#b85d36", righe: "#9a4b2a" }
  };

  // =========================================================
  //  LE TRE STANZE: com'è la casa all'inizio (uguale per tutti)
  // =========================================================
  var STANZE = [
    { id: "soggiorno", nome: "Soggiorno", carta: "sbiadita", pav: "laminato", finestra: "sx", porta: "dx" },
    { id: "camera",    nome: "Camera",    carta: "crepata",  pav: "laminato", finestra: "dx", porta: "sx" },
    { id: "bagno",     nome: "Bagno",     carta: "piastrelle", pav: "linoleum", finestra: "sx", porta: "dx" }
  ];
  function casaIniziale() {
    function o(t, x, z, extra) { var d = { t: t, x: x, z: z, y: 0, flip: false }; for (var k in (extra || {})) d[k] = extra[k]; return d; }
    var casa = {
      v: 1,
      stanze: {
        soggiorno: { carta: "sbiadita", pav: "laminato", oggetti: [
          o("tappeto_liso", 0, 2.75), o("divano_toppa", -0.35, 4.05), o("tavolino_cassetta", -0.3, 2.85), o("tv_tubo", -0.3, 2.84, { y: 0.44, su: 2 }),
          o("frigo_ammaccato", 1.75, 4.2), o("fornello_vecchio", 1.05, 4.2), o("sedia_plastica", 1.2, 2.45), o("pianta_secca", -1.85, 3.85),
          o("quadro_storto", -0.4, ZB, { y: 1.8 }), o("lampadina", 0.25, ZB, { y: 2.45 }) ] },
        camera: { carta: "crepata", pav: "laminato", oggetti: [
          o("tappeto_liso", 0.1, 2.65), o("letto_semplice", -0.6, 3.75), o("comodino_cartone", 0.65, 4.05), o("sveglia", 0.62, 4.04, { y: 0.44, su: 2 }),
          o("lampada_storta", 0.74, 4.03, { y: 0.44, su: 2 }), o("armadio_storto", 1.55, 4.15), o("poster_strappato", -0.6, ZB, { y: 1.75 }), o("lampadina", 0.2, ZB, { y: 2.45 }) ] },
        bagno: { carta: "piastrelle", pav: "linoleum", oggetti: [
          o("tappetino", -0.2, 2.75), o("doccia_tenda", 1.55, 4.1), o("wc_vecchio", -1.2, 4), o("carta_igienica", -0.82, 3.9),
          o("lavandino_colonna", 0.2, 4.2), o("bicchiere_spazzolino", 0.3, 4.19, { y: 0.8, su: 4 }), o("specchio_scheggiato", 0.2, ZB, { y: 1.55 }), o("lampadina", -0.6, ZB, { y: 2.45 }) ] }
      },
      baule: [],           // gli oggetti comprati o messi via (si rimettono dall'Arreda)
      carte: ["sbiadita", "crepata", "piastrelle"], pavimenti: ["laminato", "linoleum"],
      monete: 10000   // anteprima: monete finte per provare il negozio
    };
    // ogni oggetto ha un numero suo (u); "su" = il numero del mobile su cui è appoggiato
    Object.keys(casa.stanze).forEach(function (k) {
      casa.stanze[k].oggetti.forEach(function (d, i) { d.u = i + 1; if (d.su != null) d.su = d.su + 1; });
      casa.stanze[k].prossimo = casa.stanze[k].oggetti.length + 1;
    });
    return casa;
  }

  // =========================================================
  //  IL DISEGNO DELLA STANZA (muri e pavimento: due immagini, così si cambiano una alla volta)
  // =========================================================
  function quadP(a, b, c, d) { return [a, b, c, d]; }
  function disegnoMuri(st, cartaId) {
    var c = CARTE[cartaId] || CARTE.sbiadita, o = [], zN = ZVICINO, base = c.base, i;
    var BL = P(-XW, 0, ZB), BR = P(XW, 0, ZB), TL = P(-XW, YT, ZB), TR = P(XW, YT, ZB);
    // il soffitto
    o.push(poly([P(-XW, YT, zN), P(XW, YT, zN), TR, TL], "#efe6d4"), poly([P(-XW, YT, zN), P(XW, YT, zN), TR, TL], "url(#ombraSoff)"));
    // le pareti di lato (più scure) e quella di fondo con la carta da parati
    o.push(poly([P(-XW, 0, zN), P(-XW, YT, zN), TL, BL], tono(base, -0.22)), poly([P(XW, 0, zN), P(XW, YT, zN), TR, BR], tono(base, -0.14)));
    for (i = 1; i < 9; i++) {   // le righe della carta sui lati, in prospettiva
      var z = ZB - i * (ZB - zN) / 9;
      o.push("<line x1='" + r1(P(-XW, 0, z)[0]) + "' y1='" + r1(P(-XW, 0, z)[1]) + "' x2='" + r1(P(-XW, YT, z)[0]) + "' y2='" + r1(P(-XW, YT, z)[1]) + "' stroke='" + tono(base, -0.3) + "' stroke-width='1' opacity='.35'/>");
      o.push("<line x1='" + r1(P(XW, 0, z)[0]) + "' y1='" + r1(P(XW, 0, z)[1]) + "' x2='" + r1(P(XW, YT, z)[0]) + "' y2='" + r1(P(XW, YT, z)[1]) + "' stroke='" + tono(base, -0.25) + "' stroke-width='1' opacity='.3'/>");
    }
    o.push(poly([TL, TR, BR, BL], "url(#carta)"));
    if (c.macchie) o.push(E(r1(TL[0] + 50), r1(TL[1] + 30), 18, 12, "#a8955f", "opacity='.18'"), E(r1(TR[0] - 40), r1(BR[1] - 34), 14, 10, "#a8955f", "opacity='.16'"));
    if (c.crepe) o.push(Pth("M" + r1(TL[0] + 30) + " " + r1(TL[1] + 4) + " l8 14 l-5 10 l10 16 l-4 12", "none", "stroke='#9c8f72' stroke-width='1.2' opacity='.7'"), Pth("M" + r1(TR[0] - 24) + " " + r1(TR[1] + 20) + " l-6 10 l4 8 l-8 12", "none", "stroke='#9c8f72' stroke-width='1' opacity='.6'"));
    // battiscopa e cornice
    var zh = 0.12;
    o.push(poly([P(-XW, zh, ZB), P(XW, zh, ZB), BR, BL], "#f3ede0", "stroke='#cfc6b3' stroke-width='1'"));
    o.push(poly([P(-XW, zh, zN), P(-XW, zh, ZB), BL, P(-XW, 0, zN)], "#ddd5c4"), poly([P(XW, zh, zN), P(XW, zh, ZB), BR, P(XW, 0, zN)], "#e6dfcf"));
    o.push(poly([P(-XW, YT, ZB), P(XW, YT, ZB), P(XW, YT - 0.08, ZB), P(-XW, YT - 0.08, ZB)], "#f6f0e2"));
    // la finestra (su una parete di lato) con la luce che entra, e la porta sull'altra
    // la finestra sul muro di fondo: cornice, cielo, la croce, il davanzale e una tendina un po' storta
    function finestraFondo(lato) {
      var cx = lato * (XW - 1.05), x0 = cx - 0.55, x1 = cx + 0.55, y0 = 1.0, y1 = 2.15, z = ZB - 0.01, s = "";
      var a = P(x0, y1, z), b = P(x1, y0, z), w = b[0] - a[0], h = b[1] - a[1], k = scala(1.5, ZB);
      s += R(r1(a[0] - 0.06 * k), r1(a[1] - 0.06 * k), r1(w + 0.12 * k), r1(h + 0.12 * k), "#f5efe0", 3, "stroke='#cbbfa6' stroke-width='2'");
      s += R(r1(a[0]), r1(a[1]), r1(w), r1(h), "url(#cielo)");
      s += E(r1(a[0] + w * 0.7), r1(a[1] + h * 0.3), r1(w * 0.18), r1(h * 0.08), "#fff", "opacity='.9'") + E(r1(a[0] + w * 0.6), r1(a[1] + h * 0.33), r1(w * 0.12), r1(h * 0.07), "#fff", "opacity='.9'");   // una nuvola
      s += R(r1(a[0] + w / 2 - 2), r1(a[1]), 4, r1(h), "#f5efe0") + R(r1(a[0]), r1(a[1] + h / 2 - 2), r1(w), 4, "#f5efe0");
      s += R(r1(a[0] - 0.1 * k), r1(b[1]), r1(w + 0.2 * k), r1(0.07 * k), "#efe6d2", 2, "stroke='#cbbfa6' stroke-width='1'");   // il davanzale
      s += Pth("M" + r1(a[0] - 0.08 * k) + " " + r1(a[1] - 0.1 * k) + " L" + r1(a[0] + w * 0.36) + " " + r1(a[1] - 0.1 * k) + " Q" + r1(a[0] + w * 0.3) + " " + r1(a[1] + h * 0.5) + " " + r1(a[0] + w * 0.4) + " " + r1(b[1] + 0.02 * k) + " L" + r1(a[0] - 0.08 * k) + " " + r1(b[1] + 0.06 * k) + " Z", "#c96a5a", "opacity='.85'");   // la tendina
      s += Pth("M" + r1(a[0] - 0.12 * k) + " " + r1(a[1] - 0.1 * k) + " L" + r1(b[0] + 0.12 * k) + " " + r1(a[1] - 0.13 * k), "none", "stroke='#7a5a3a' stroke-width='2.4'");   // il bastone, un filo storto
      s += "<ellipse cx='" + r1(a[0] + w / 2) + "' cy='" + r1(a[1] + h / 2) + "' rx='" + r1(w * 1.1) + "' ry='" + r1(h * 1.0) + "' fill='url(#alone)'/>";
      return s;
    }
    function finestra(lato) {
      var x = lato * XW, z0 = ZB - 2.2, z1 = ZB - 0.9, y0 = 0.95, y1 = 2.2, q = [P(x, y1, z0), P(x, y1, z1), P(x, y0, z1), P(x, y0, z0)];
      var s = "";
      s += poly(q, "#f5efe0", "stroke='#cbbfa6' stroke-width='2'");
      var m = 0.07, q2 = [P(x, y1 - m, z0 + m), P(x, y1 - m, z1 - m), P(x, y0 + m, z1 - m), P(x, y0 + m, z0 + m)];
      s += poly(q2, "url(#cielo)") + "<line x1='" + r1((q2[0][0] + q2[1][0]) / 2) + "' y1='" + r1((q2[0][1] + q2[1][1]) / 2) + "' x2='" + r1((q2[2][0] + q2[3][0]) / 2) + "' y2='" + r1((q2[2][1] + q2[3][1]) / 2) + "' stroke='#f5efe0' stroke-width='3'/>";
      s += poly([P(x, y0, z0 - 0.05), P(x, y0, z1 + 0.05), P(x - lato * 0.12, y0 - 0.04, z1 + 0.05), P(x - lato * 0.12, y0 - 0.04, z0 - 0.05)], "#efe6d2");   // il davanzale
      return s;
    }
    function porta(lato) {
      var x = lato * XW, z0 = ZB - 1.15, z1 = ZB - 0.25, y1 = 2.1, q = [P(x, y1, z0), P(x, y1, z1), P(x, 0, z1), P(x, 0, z0)];
      return poly(q, "#b38a5e", "stroke='#7a5a3a' stroke-width='2'") + poly([P(x, y1 - 0.1, z0 + 0.08), P(x, y1 - 0.1, z1 - 0.08), P(x, 1.15, z1 - 0.08), P(x, 1.15, z0 + 0.08)], "#c39a6c") +
        "<circle cx='" + r1(P(x, 1.0, z0 + 0.12)[0]) + "' cy='" + r1(P(x, 1.0, z0 + 0.12)[1]) + "' r='2.6' fill='#e0c070' stroke='#7a5a3a' stroke-width='1'/>";
    }
    o.push(finestraFondo(st.finestra === "dx" ? 1 : -1));
    var defs = c.motivo("carta") +
      "<linearGradient id='ombraSoff' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='.25'/><stop offset='1' stop-color='#000' stop-opacity='0'/></linearGradient>" +
      "<linearGradient id='cielo' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#8fd0f2'/><stop offset='1' stop-color='#dff3fb'/></linearGradient>" +
      "<radialGradient id='alone'><stop offset='0' stop-color='#fff8e0' stop-opacity='.35'/><stop offset='1' stop-color='#fff8e0' stop-opacity='0'/></radialGradient>";
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + W + " " + H + "' width='" + W + "' height='" + H + "'><defs>" + defs + "</defs>" + o.join("") + "</svg>";
  }
  function disegnoPavimento(st, pavId) {
    var p = PAVIMENTI[pavId] || PAVIMENTI.laminato, o = [], zN = ZVICINO, x, z, i, j;
    o.push(poly([P(-XW, 0, zN), P(XW, 0, zN), P(XW, 0, ZB), P(-XW, 0, ZB)], p.c1));
    if (p.tipo === "assi") {
      var la = 0.2;
      for (x = -XW, i = 0; x < XW - 0.01; x += la, i++) {
        if (i % 2) o.push(poly([P(x, 0, zN), P(x + la, 0, zN), P(x + la, 0, ZB), P(x, 0, ZB)], p.c2));
        o.push("<line x1='" + r1(P(x, 0, zN)[0]) + "' y1='" + r1(P(x, 0, zN)[1]) + "' x2='" + r1(P(x, 0, ZB)[0]) + "' y2='" + r1(P(x, 0, ZB)[1]) + "' stroke='" + p.righe + "' stroke-width='1' opacity='.7'/>");
        for (z = ZB - ((i * 0.37) % 1.1); z > zN; z -= 1.3) o.push("<line x1='" + r1(P(x, 0, z)[0]) + "' y1='" + r1(P(x, 0, z)[1]) + "' x2='" + r1(P(x + la, 0, z)[0]) + "' y2='" + r1(P(x + la, 0, z)[1]) + "' stroke='" + p.righe + "' stroke-width='1' opacity='.6'/>");
      }
    } else {
      var q = 0.4;
      for (z = ZB, i = 0; z > zN; z -= q, i++) for (x = -XW, j = 0; x < XW - 0.01; x += q, j++) if ((i + j) % 2) o.push(poly([P(x, 0, z - q), P(x + q, 0, z - q), P(x + q, 0, z), P(x, 0, z)], p.c2));
      for (x = -XW; x <= XW + 0.01; x += q) o.push("<line x1='" + r1(P(x, 0, zN)[0]) + "' y1='" + r1(P(x, 0, zN)[1]) + "' x2='" + r1(P(x, 0, ZB)[0]) + "' y2='" + r1(P(x, 0, ZB)[1]) + "' stroke='" + p.righe + "' stroke-width='.8' opacity='.6'/>");
    }
    if (p.graffi) for (i = 0; i < Math.round(9 * XW / 2.3); i++) { var gx = -XW + 0.5 + (i * 0.47) % (2 * XW - 1), gz = 1.4 + (i * 0.83) % 3.4, a = P(gx, 0, gz), b = P(gx + 0.25, 0, gz + 0.05); o.push("<line x1='" + r1(a[0]) + "' y1='" + r1(a[1]) + "' x2='" + r1(b[0]) + "' y2='" + r1(b[1]) + "' stroke='#fff' stroke-width='1' opacity='.35'/>"); }
    // la luce della finestra sul pavimento e l'ombra lungo il muro di fondo
    var lx = (st.finestra === "dx" ? 1 : -1) * (XW - 1.05), lc = P(lx, 0, ZB - 1.0);   // la luce della finestra sul pavimento
    o.push("<ellipse cx='" + r1(lc[0]) + "' cy='" + r1(lc[1]) + "' rx='" + r1(1.1 * scala(0, ZB - 1.5)) + "' ry='" + r1(0.5 * scala(0, ZB - 1.5)) + "' fill='url(#luce)'/>");
    o.push(poly([P(-XW, 0, ZB), P(XW, 0, ZB), P(XW, 0, ZB - 0.5), P(-XW, 0, ZB - 0.5)], "url(#ombraMuro)"));
    var defs = "<radialGradient id='luce'><stop offset='0' stop-color='#fff6d0' stop-opacity='.35'/><stop offset='1' stop-color='#fff6d0' stop-opacity='0'/></radialGradient>" +
      "<linearGradient id='ombraMuro' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='.22'/><stop offset='1' stop-color='#000' stop-opacity='0'/></linearGradient>";
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + W + " " + H + "' width='" + W + "' height='" + H + "'><defs>" + defs + "</defs>" + o.join("") + "</svg>";
  }

  var cacheImg = {};
  function datauri(s) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); }
  function imgOggetto(t, on, parte, vista) {   // vista "fianco": il mobile girato di fianco (se ha quel disegno)
    var d = OGG[t]; if (!d) return ""; var f = vista === "fianco" && d.fianco ? d.fianco : d.disegno, k = t + (on ? "|on" : "") + (parte ? "|" + parte : "") + (f === d.fianco ? "|fianco" : "");
    if (!cacheImg[k]) cacheImg[k] = datauri(f(!!on, parte)); return cacheImg[k];
  }
  function imgMuri(st, carta) { var k = "m|" + st.id + "|" + carta + "|" + XW; if (!cacheImg[k]) cacheImg[k] = datauri(disegnoMuri(st, carta)); return cacheImg[k]; }
  function imgPav(st, pav) { var k = "p|" + st.id + "|" + pav + "|" + XW; if (!cacheImg[k]) cacheImg[k] = datauri(disegnoPavimento(st, pav)); return cacheImg[k]; }
  function campioneCarta(id) { var c = CARTE[id]; return datauri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='60' height='60'><defs>" + c.motivo("m") + "</defs><rect width='60' height='60' fill='url(#m)'/></svg>"); }
  function campionePav(id) { var p = PAVIMENTI[id]; var s = "<rect width='60' height='60' fill='" + p.c1 + "'/>"; for (var i = 0; i < 6; i++) s += p.tipo === "assi" ? (i % 2 ? "<rect x='" + i * 10 + "' width='10' height='60' fill='" + p.c2 + "'/>" : "") + "<line x1='" + i * 10 + "' y1='0' x2='" + i * 10 + "' y2='60' stroke='" + p.righe + "'/>" : ""; if (p.tipo !== "assi") for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) if ((a + b) % 2) s += "<rect x='" + a * 15 + "' y='" + b * 15 + "' width='15' height='15' fill='" + p.c2 + "'/>"; return datauri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='60' height='60'>" + s + "</svg>"); }

  function campioneMisura(i) {   // la stanzetta disegnata nella scheda "Stanza": più larga a ogni misura
    var w = 16 + i * 9, l = 30 - w / 2, r = 30 + w / 2;
    var s = "<rect width='60' height='60' fill='#f6efe2'/>" +
      "<polygon points='" + (l - 10) + ",4 " + l + ",14 " + l + ",36 " + (l - 10) + ",50' fill='#d9c9a6'/>" + "<polygon points='" + (r + 10) + ",4 " + r + ",14 " + r + ",36 " + (r + 10) + ",50' fill='#e0d2b2'/>" +
      "<rect x='" + l + "' y='14' width='" + w + "' height='22' fill='#efe3c8' stroke='#cbbb98'/>" + "<polygon points='" + l + ",36 " + r + ",36 " + (r + 10) + ",50 " + (l - 10) + ",50' fill='#c79a66'/>" +
      "<path d='M" + (l - 6) + " 56 L" + (r + 6) + " 56 M" + (l - 6) + " 56 l4 -3 m-4 3 l4 3 M" + (r + 6) + " 56 l-4 -3 m4 3 l-4 3' stroke='#3b2b22' stroke-width='1.6' fill='none' stroke-linecap='round'/>";
    return datauri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='60' height='60'>" + s + "</svg>");
  }

  // misure del disegno di un oggetto (dal suo viewBox, in centimetri)
  var misure = {};
  function misura(t, vista) {   // (vista "fianco": le misure del mobile girato di fianco)
    var fi = vista === "fianco" && OGG[t] && OGG[t].fianco, k = t + (fi ? "|fianco" : "");
    if (!misure[k]) { var s = OGG[t] ? (cacheImg["s|" + k] || (cacheImg["s|" + k] = fi ? OGG[t].fianco() : OGG[t].disegno())) : ""; var m = /viewBox='0 0 ([\d.]+) ([\d.]+)'/.exec(s); misure[k] = m ? { w: +m[1], h: +m[2] } : { w: 50, h: 50 }; }
    return misure[k];
  }

  // ---------- piccoli attrezzi comuni a casa e negozio ----------
  function el(tag, cls, testo) { var e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e; }
  function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
  // ---- i suoni (corti, fatti al volo: niente file) ----
  var bufRumore = null;
  function rumore(ctx, a, dur, f0, f1, vol, filtro) {   // un fruscio (acqua, sciacquone, doccia)
    if (!bufRumore) { bufRumore = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate); var dd = bufRumore.getChannelData(0); for (var i = 0; i < dd.length; i++) dd[i] = Math.random() * 2 - 1; }
    var src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = bufRumore; src.loop = true; fl.type = filtro || "lowpass"; fl.frequency.setValueAtTime(f0, a); fl.frequency.exponentialRampToValueAtTime(f1, a + dur);
    g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(vol, a + 0.08); g.gain.setValueAtTime(vol, a + dur * 0.7); g.gain.exponentialRampToValueAtTime(0.0001, a + dur);
    src.connect(fl); fl.connect(g); g.connect(ctx.destination); src.start(a); src.stop(a + dur + 0.05);
  }
  function suonaCasa(audio, tipo) {   // (la casa e il negozio)
    var ctx = audio && audio(); if (!ctx) return;
    try {
      var t0 = ctx.currentTime, dring = [], i;
      for (i = 0; i < 12; i++) dring.push([i % 2 ? 2100 : 1900, i * 0.055, 0.045, "square", 0.025]);
      var note = {   // [frequenza, quando, quanto dura, tipo, volume, frequenza finale]
        su: [[520, 0, .07, "triangle", .07], [780, .04, .08, "triangle", .06]],
        giu: [[150, 0, .12, "sine", .2, 70], [900, 0, .03, "square", .03]],
        clink: [[1500, 0, .09, "triangle", .07], [2200, .05, .12, "triangle", .05]],
        baule: [[600, 0, .08, "sine", .08], [300, .06, .14, "sine", .08]],
        carta: [[300, 0, .3, "sawtooth", .025], [600, .08, .25, "sawtooth", .02]],
        compra: [[988, 0, .1, "triangle", .08], [1319, .08, .1, "triangle", .08], [1760, .16, .22, "triangle", .08]],
        gira: [[700, 0, .06, "triangle", .06], [500, .05, .08, "triangle", .05]],
        accendi: [[1800, 0, .025, "square", .035], [1300, .03, .03, "square", .03], [660, .06, .12, "sine", .04, 880]],
        spegni: [[1300, 0, .025, "square", .03], [800, .03, .03, "square", .03], [520, .06, .1, "sine", .03, 330]],
        apri: [[200, 0, .22, "sawtooth", .02, 310], [90, .02, .1, "sine", .12, 60]],
        chiudi: [[120, 0, .12, "sine", .2, 55], [600, 0, .02, "square", .02]],
        molla: [[200, 0, .22, "sine", .12, 480], [480, .12, .24, "sine", .06, 240]],
        dring: dring,
        sciacquone: [[140, .1, .9, "sine", .05, 60]],
        bolla: [[600, 0, .08, "sine", .05, 1200]]
      }[tipo] || [];
      if (tipo === "acqua") rumore(ctx, t0, 2.1, 1500, 1100, 0.11);
      if (tipo === "sciacquone") rumore(ctx, t0, 1.7, 2600, 300, 0.16);
      if (tipo === "doccia") rumore(ctx, t0, 4, 3200, 2600, 0.07, "bandpass");
      if (tipo === "apri") rumore(ctx, t0, 0.25, 900, 400, 0.04);
      note.forEach(function (n) {
        var o = ctx.createOscillator(), g = ctx.createGain(), a = t0 + n[1];
        o.type = n[3]; o.frequency.setValueAtTime(n[0], a); if (n[5]) o.frequency.exponentialRampToValueAtTime(n[5], a + n[2]);
        g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(n[4], a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + n[2]);
        o.connect(g); g.connect(ctx.destination); o.start(a); o.stop(a + n[2] + 0.05);
      });
    } catch (e) {}
  }
  

  // =========================================================
  //  LA SCHERMATA DELLA CASA
  //  opts: { avatar, nome, dati (la casa salvata o null), salva(dati), indietro(), audio() }
  // =========================================================
  function crea(opts) {
    var casa = opts.dati && opts.dati.v ? opts.dati : casaIniziale();
    var stanzaId = opts.stanza || "soggiorno", arreda = false, sel = null, palcoS = 1, avTimer = null, avAnim = null;
    var tSalva = null;
    function salva() { clearTimeout(tSalva); tSalva = setTimeout(function () { if (opts.salva) opts.salva(casa); }, 400); }
    function esci(poi) {   // uscendo (indietro, negozio, armadio): smette tutto e salva subito
      lasciaStare(); fermaAvatar(); cancelAnimationFrame(inerzia); clearTimeout(tSalva); if (opts.salva) opts.salva(casa); poi();
    }

    function suono(tipo) { suonaCasa(opts.audio, tipo); }

    // ---- la struttura ----
    var s = el("div", "schermata casa-vista");
    var scena = el("div", "ca-scena"), palco = el("div", "ca-palco");
    var pavA = el("img", "ca-strato"), pavB = el("img", "ca-strato ca-nuovo"), muriA = el("img", "ca-strato"), muriB = el("img", "ca-strato ca-nuovo");
    [pavA, pavB, muriA, muriB].forEach(function (i) { i.alt = ""; i.draggable = false; });
    var strato = el("div", "ca-oggetti");
    palco.appendChild(pavA); palco.appendChild(pavB); palco.appendChild(muriA); palco.appendChild(muriB); palco.appendChild(strato);
    scena.appendChild(palco); s.appendChild(scena);
    var testa = el("div", "ca-testa"), indietro = el("button", "ca-indietro", "‹"), titolo = el("div", "ca-titolo"), monete = el("div", "ca-monete");
    indietro.onclick = function () { if (arreda) return esciArreda(); esci(function () { if (opts.indietro) opts.indietro(); }); };
    testa.appendChild(indietro); testa.appendChild(titolo); testa.appendChild(monete); s.appendChild(testa);
    var giu = el("div", "ca-giu"), tabs = el("div", "ca-stanze"), bArreda = el("button", "ca-arreda", "✏️ Arreda");
    STANZE.forEach(function (st) { var b = el("button", "ca-tab", st.nome); b.onclick = function () { if (st.id !== stanzaId) vaiStanza(st.id); }; b.dataset.id = st.id; tabs.appendChild(b); });
    bArreda.onclick = function () { if (arreda) esciArreda(); else entraArreda(); };
    giu.appendChild(tabs); giu.appendChild(bArreda); s.appendChild(giu);
    var cassetto = el("div", "ca-cassetto"), cTabs = el("div", "ca-ctabs"), cLista = el("div", "ca-clista");
    var schede = [["baule", "🧳 Baule"], ["pareti", "🖼️ Pareti"], ["pavimenti", "🟫 Pavimento"], ["misura", "📐 Stanza"], ["negozio", "🛍️ Negozio"]], scheda = "baule";
    schede.forEach(function (sc) { var b = el("button", "ca-ctab", sc[1]); b.dataset.id = sc[0]; b.onclick = function () { if (sc[0] === "negozio" && opts.negozio) return esci(function () { opts.negozio(stanzaId); }); scheda = sc[0]; disegnaCassetto(); }; cTabs.appendChild(b); });   // "Negozio" porta al negozio vero
    var fatto = el("button", "ca-fatto", "✓ Fatto"); fatto.onclick = esciArreda;
    var cTesta = el("div", "ca-ctesta"); cTesta.appendChild(cTabs); cTesta.appendChild(fatto);
    cassetto.appendChild(cTesta); cassetto.appendChild(cLista); s.appendChild(cassetto);
    var tool = el("div", "ca-tool"), tGira = el("button", null, "🔄"), tVia = el("button", null, "📦");
    tGira.title = "Gira"; tVia.title = "Metti nel baule";
    tool.appendChild(tGira); tool.appendChild(tVia); palco.appendChild(tool);
    var avviso = el("div", "ca-avviso"); s.appendChild(avviso);
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }

    function stanza() { return casa.stanze[stanzaId]; }
    function datiStanza() { return STANZE.filter(function (x) { return x.id === stanzaId; })[0]; }
    function soldi() { return opts.monete ? opts.monete() : casa.monete; }   // le Speed Coins del profilo (senza profilo: quelle di prova)
    function aggMonete() { monete.textContent = "🪙 " + cifre(soldi()) + (opts.monete ? "" : " · prova"); }
    function spendi(n) {   // paga: false se non bastano
      if (soldi() < n) { dimmi("Non hai abbastanza monete 🪙"); return false; }
      if (opts.spendi) opts.spendi(n); else casa.monete -= n;
      aggMonete(); monete.classList.remove("pulsa"); void monete.offsetWidth; monete.classList.add("pulsa"); suono("compra"); return true;
    }

    // ---- il palco 360×640 steso sullo schermo (largo quanto lo schermo, la stanza in alto) ----
    //      (le stanze più larghe dello schermo scorrono di lato col dito)
    var tx = null, ty = 0, inerzia = 0;
    function stendi() {
      var cw = scena.clientWidth, ch = scena.clientHeight; if (!cw || !ch) return false;
      palcoS = Math.max(cw / 360, ch / H); ty = (ch - H * palcoS) * 0.35;
      if (tx == null) tx = (cw - W * palcoS) / 2;
      applica(); return true;
    }
    function zoomScena() { return arreda ? 0.78 : 1; }   // in Arreda la stanza si allontana un po'
    function bordiTx() {   // fin dove può scorrere, senza mai lasciare vuoti ai lati
      var cw = scena.clientWidth, L = W * palcoS;   // (anche in Arreda: la stanza rimpicciolita resta dentro il suo riquadro)
      return L <= cw ? [(cw - L) / 2, (cw - L) / 2] : [cw - L, 0];
    }
    function applica() {
      if (tx == null) return;
      var b = bordiTx(); tx = Math.max(b[0], Math.min(b[1], tx));
      palco.style.transform = "translate(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px) scale(" + palcoS.toFixed(4) + ")";
    }
    function lancia(v) {   // lasciando il dito la stanza scorre ancora un attimo, rallentando
      var t0 = performance.now(); cancelAnimationFrame(inerzia);
      inerzia = requestAnimationFrame(function passo(t) {
        var dt = Math.min(40, t - t0); t0 = t; v *= Math.pow(0.93, dt / 16); if (Math.abs(v) < 0.02) return;
        var prima = tx; tx += v * dt / zoomScena(); applica(); if (Math.abs(tx - prima) < 0.01) return;
        inerzia = requestAnimationFrame(passo);
      });
    }
    function segui() {   // quando lo mandi verso il bordo, la stanza lo segue
      if (tx == null) return;
      var cw = scena.clientWidth, sx = tx + P(avPos.x, 0, avPos.z)[0] * palcoS, m = cw * 0.28;
      if (sx < m) tx += (m - sx) * 0.12; else if (sx > cw - m) tx -= (sx - (cw - m)) * 0.12; else return;
      applica();
    }
    function puntoPalco(e) { var r = palco.getBoundingClientRect(), k = r.width / W; return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }; }   // (anche con la stanza rimpicciolita dell'Arreda)

    // ---- dove sta un oggetto sullo schermo ----
    function geo(d) {
      var o = OGG[d.t], m = misura(d.t, d.vista), wM = m.w / 100, hM = m.h / 100, a, k, w, h;
      if (o.tipo === "muro" && d.parete) {   // su una parete di lato: storto in prospettiva
        var q = quadParete(d, m), xs = q.map(function (p) { return p[0]; }), ys = q.map(function (p) { return p[1]; }), l = Math.min.apply(0, xs), t = Math.min.apply(0, ys), c = P(d.x, d.y, d.z);
        return { l: l, t: t, w: Math.max.apply(0, xs) - l, h: Math.max.apply(0, ys) - t, zi: 20, ax: c[0], ay: c[1], quad: q };
      }
      if (o.tipo === "muro") { a = P(d.x, d.y, ZB); k = scala(d.y, ZB); w = wM * k; h = hM * k; return { l: a[0] - w / 2, t: a[1] - h / 2, w: w, h: h, zi: 20, ax: a[0], ay: a[1] }; }
      a = P(d.x, d.y || 0, d.z); k = scala(d.y || 0, d.z); w = wM * k; h = hM * k;
      if (o.tipo === "tappeto") {   // steso sul pavimento: schiacciato quanto il pavimento a quella distanza
        var dz = Math.abs(P(d.x, 0, d.z - 0.5)[1] - P(d.x, 0, d.z + 0.5)[1]) / k;
        h = hM * k * dz * 2.2; return { l: a[0] - w / 2, t: a[1] - h / 2, w: w, h: h, zi: 10, ax: a[0], ay: a[1] };
      }
      return { l: a[0] - w / 2, t: a[1] - h, w: w, h: h, zi: 100 + Math.round((ZB - d.z) * 100) + (d.su ? 1 : 0), ax: a[0], ay: a[1] };
    }
    var nodi = {};   // u -> elemento
    function nodo(d) {
      var n = nodi[d.u];
      if (!n) {
        n = el("div", "ca-ogg"); n.dataset.t = d.t; var im = el("img"); im.alt = ""; im.draggable = false; im.src = imgOggetto(d.t, false, null, d.vista); n.appendChild(im); n._img = im;
        n.addEventListener("pointerdown", function (e) { tocco(e, d); });
        nodi[d.u] = n; strato.appendChild(n);
      }
      return n;
    }
    function posa(d) {
      var n = nodo(d), g = geo(d), o = OGG[d.t], on = !!d.on;
      var kk = (on ? 1 : 0) + "|" + (d.vista || ""); if (n._k !== kk) { n._k = kk; n._on = on; n._img.src = imgOggetto(d.t, on, null, d.vista); }   // acceso/spento, aperto/chiuso: cambia solo il disegno
      n.style.left = g.l.toFixed(1) + "px"; n.style.top = g.t.toFixed(1) + "px"; n.style.width = g.w.toFixed(1) + "px"; n.style.height = g.h.toFixed(1) + "px"; n.style.zIndex = g.zi;
      if (g.quad) {   // sulla parete di lato l'immagine si stende sui quattro angoli
        var mq = misura(d.t); n.classList.add("lato");
        n._img.style.cssText = "position:absolute;left:0;top:0;width:" + mq.w + "px;height:" + mq.h + "px;transform-origin:0 0;transform:translate(" + (-g.l).toFixed(1) + "px," + (-g.t).toFixed(1) + "px) " + omografia(g.quad, mq.w, mq.h) + (d.flip ? " translate(" + mq.w + "px,0) scale(-1,1)" : "");
      } else { if (n.classList.contains("lato")) { n._img.style.cssText = ""; n.classList.remove("lato"); } n._img.style.transform = d.flip ? "scaleX(-1)" : ""; }
      n.classList.toggle("tappeto", o.tipo === "tappeto"); n.classList.toggle("muro", o.tipo === "muro");
      if (o.corpo && d.vista) { n.style.removeProperty("--ol"); n.style.removeProperty("--or"); }
      else if (o.corpo) { var m = misura(d.t); n.style.setProperty("--ol", (o.corpo[0] / m.w * 100 + 3).toFixed(1) + "%"); n.style.setProperty("--or", ((m.w - o.corpo[1]) / m.w * 100 + 3).toFixed(1) + "%"); }   // l'ombra solo sotto il mobile, non sotto l'anta aperta
      luce(d, n, g);
    }
    function luce(d, n, g) {   // il chiarore delle lampade e delle TV accese (e del frigo aperto)
      var L = OGG[d.t].luce;
      if (!L || !d.on) { if (n._luce) { if (n._luce.parentNode) n._luce.parentNode.removeChild(n._luce); n._luce = null; } return; }
      if (!n._luce) {
        n._luce = el("i", "ca-luce" + (/^tv/.test(d.t) ? " tv" : "")); var cc = [1, 3, 5].map(function (i) { return parseInt(L.c.substr(i, 2), 16); }).join(",");
        n._luce.style.background = "radial-gradient(closest-side, rgba(" + cc + ",.75) 0%, rgba(" + cc + ",.4) 35%, rgba(" + cc + ",0) 100%)"; strato.appendChild(n._luce);
      }
      var r = L.r * g.w / (misura(d.t, d.vista).w / 100) / 2, x = g.l + (d.flip ? 1 - L.x : L.x) * g.w, y = g.t + L.y * g.h;
      n._luce.style.left = (x - r).toFixed(1) + "px"; n._luce.style.top = (y - r).toFixed(1) + "px"; n._luce.style.width = n._luce.style.height = (2 * r).toFixed(1) + "px";
      n._luce.style.zIndex = g.zi + (/^frigo/.test(d.t) ? 1 : -1);
    }
    function togliNodo(u) { var n = nodi[u]; if (!n) return; if (n.parentNode) n.parentNode.removeChild(n); if (n._luce && n._luce.parentNode) n._luce.parentNode.removeChild(n._luce); delete nodi[u]; }
    function disegnaStanza() {
      var st = datiStanza(), sz = stanza();
      lasciaStare(); fermaAvatar();
      larghezza(MISURE[sz.mis || 0].xw); [palco, strato, pavA, pavB, muriA, muriB].forEach(function (x) { x.style.width = W + "px"; });   // la larghezza di questa stanza
      tx = null; stendi();
      Object.keys(nodi).forEach(togliNodo); nodi = {};
      muriA.src = imgMuri(st, sz.carta); pavA.src = imgPav(st, sz.pav);
      sz.oggetti.forEach(function (d) { var o = OGG[d.t]; if (o.stati === "apri" || o.uso) d.on = false; });   // frigo, armadio e bagno si ritrovano chiusi
      sz.oggetti.forEach(posa);
      titolo.textContent = st.nome;
      [].forEach.call(tabs.children, function (b) { b.classList.toggle("on", b.dataset.id === stanzaId); });
      if (av) { strato.appendChild(av); avPos.x = 0.3; avPos.z = 3.0; posaAv(); aspetta(); }
      deseleziona();
    }
    function vaiStanza(id) {
      palco.classList.add("cambia");
      setTimeout(function () { stanzaId = id; disegnaStanza(); palco.classList.remove("cambia"); if (arreda) disegnaCassetto(); }, 180);
    }

    // ---- l'avatar che vive in casa: va dove tocchi, si siede, dorme, usa le cose ----
    var av = null, avPos = { x: 0.3, z: 3.0 }, avDir = 1, imgAv = "", imgDorme = "";
    var avStato = "libero", avSu = null, avUso = null, zTimer = null, copertaN = null;
    if (opts.avatar && window.SGOmino) {
      av = el("div", "ca-av"); var avImg = el("img"); avImg.alt = ""; avImg.draggable = false;
      imgAv = datauri(SGOmino.svg(opts.avatar, {})); avImg.src = imgAv; av.appendChild(avImg); av._img = avImg; av.appendChild(el("b"));
      var avPasso = el("img", "ca-av-passo"); avPasso.alt = ""; avPasso.draggable = false;   // lo stesso avatar che fa i passi (piedi e braccia): si vede mentre cammina
      try { avPasso.src = datauri(SGOmino.svg(opts.avatar, { cammina: true })); av.insertBefore(avPasso, avImg.nextSibling); } catch (e) {}
      avImg.className = "ca-av-fermo";
      av.addEventListener("pointerdown", function () { if (!arreda) toccoAv = true; });   // il tocco vero lo decide su(): se il dito non si è mosso
    }
    function toccaAvatar() {
      if (avStato === "dorme" || avStato === "seduto") { lasciaStare(); aspetta(); return; }   // toccandolo si alza
      saluta(); suono("su");
    }
    function imgAvFaccia(occhi, bocca) {   // a letto (o nella vasca) si vede solo dalle spalle in su, con la faccia giusta
      var k = occhi + "|" + bocca; imgDorme = imgDorme || {};
      if (!imgDorme[k]) {
        var c = {}, n, sv = ""; for (n in opts.avatar) c[n] = opts.avatar[n]; c.occhi = occhi; c.bocca = bocca;
        try { sv = SGOmino.svg(c, { busto: true }); } catch (e) {}
        var vb = /viewBox='([^']+)'/.exec(sv); imgDorme[k] = { src: datauri(sv), vb: vb ? vb[1].split(" ").map(Number) : [24, 17, 151, 155] };
      }
      return imgDorme[k];
    }
    function misureAv(z) { var k = scala(0, z), h = 1.5 * k * 264 / 230; return { k: k, h: h, w: h * 200 / 264 }; }   // alto circa un metro e mezzo
    function posaAv() {
      if (!av || avStato === "dorme" || avStato === "seduto") return;
      var a = P(avPos.x, 0, avPos.z), m = misureAv(avPos.z);
      av.style.left = (a[0] - m.w / 2).toFixed(1) + "px"; av.style.top = (a[1] - m.h * 0.96).toFixed(1) + "px"; av.style.width = m.w.toFixed(1) + "px"; av.style.height = m.h.toFixed(1) + "px";
      av.style.zIndex = 100 + Math.round((ZB - avPos.z) * 100);
      av.style.transform = avDir < 0 ? "scaleX(-1)" : "";   // girato verso dove cammina (l'immagine dentro fa i passi)
    }
    function saluta() { if (!av) return; av.classList.remove("saluta"); void av.offsetWidth; av.classList.add("saluta"); }
    function vaiA(x, z, poi, lento) {   // cammina fino a lì, poi fa "poi"
      if (!av) { if (poi) poi(); return; }
      lasciaStare(); fermaAvatar();
      x = Math.max(-XW + 0.3, Math.min(XW - 0.3, x)); z = Math.max(ZMIN, Math.min(ZB - 0.3, z));
      var da = { x: avPos.x, z: avPos.z }, dist = Math.sqrt(Math.pow(x - da.x, 2) + Math.pow(z - da.z, 2)), dur = Math.max(250, dist * (lento ? 1100 : 750)), t0 = performance.now();
      if (dist < 0.04) { posaAv(); if (poi) poi(); else aspetta(); return; }
      avDir = x >= da.x ? 1 : -1; av.classList.add("cammina"); avStato = "cammina";
      (function passo(t) {
        if (!document.body.contains(s) || arreda) { av.classList.remove("cammina"); avStato = "libero"; return; }
        var p = Math.min(1, (t - t0) / dur), e = 0.6 * p + 0.4 * p * p * (3 - 2 * p);
        avPos.x = da.x + (x - da.x) * e; avPos.z = da.z + (z - da.z) * e; posaAv(); if (!lento && !gesto) segui();
        if (p < 1) avAnim = requestAnimationFrame(passo);
        else { av.classList.remove("cammina"); avStato = "libero"; if (poi) poi(); else aspetta(); }
      })(t0);
    }
    function aspetta() { clearTimeout(avTimer); if (!arreda) avTimer = setTimeout(passeggia, 10000 + Math.random() * 6000); }   // dopo un po' che non lo comandi, gira da solo
    function xVisibili(z) {   // da che x a che x (in metri) si vede la stanza a quella profondità
      var cw = scena.clientWidth, k = scala(0, z), a = ((0 - tx) / palcoS - CX) / k + 0.45, b = ((cw - tx) / palcoS - CX) / k - 0.45;
      return [Math.max(-XW + 0.4, a), Math.min(XW - 0.4, Math.max(a + 0.1, b))];
    }
    function passeggia() {
      if (!av || arreda || avStato !== "libero" || !document.body.contains(s)) return;
      var z = ZMIN + 0.4 + Math.random() * (ZB - 1 - ZMIN), v = xVisibili(z);   // da solo gira nella parte di stanza che si vede
      vaiA(v[0] + Math.random() * (v[1] - v[0]), z, function () { avTimer = setTimeout(passeggia, 2500 + Math.random() * 3500); }, true);
    }
    function fermaAvatar() { clearTimeout(avTimer); cancelAnimationFrame(avAnim); if (av) av.classList.remove("cammina"); if (avStato === "cammina") avStato = "libero"; }
    function lasciaStare() {   // smette quello che sta facendo: si alza, chiude il frigo, esce dalla doccia...
      if (avUso) { var u = avUso; avUso = null; clearTimeout(u.timer); if (u.fine) u.fine(); }
      if (avStato === "dorme" || avStato === "seduto") alzati();
    }
    function alzati() {
      var d = avSu; avSu = null; clearInterval(zTimer);
      if (copertaN) { if (copertaN.parentNode) copertaN.parentNode.removeChild(copertaN); copertaN = null; }
      av.classList.remove("sdraiato", "seduto"); av._img.src = imgAv; av.style.transformOrigin = ""; avStato = "libero";
      if (d) avPos.z = Math.max(ZMIN, d.z - (OGG[d.t].prof || 0.4) / 2 - 0.2);
      posaAv();
    }
    function sulMobile(d, ux, uy, m) {   // un punto del disegno (in centimetri) sullo schermo
      var g = geo(d), mm = misura(d.t, d.vista), px = g.w / mm.w;
      return { x: g.l + (d.flip ? mm.w - ux : ux) * px, y: g.t + uy * px, g: g, px: px };
    }
    function dormi(d) {
      var o = OGG[d.t], cu = d.vista && o.fiancoCuscino ? o.fiancoCuscino : o.cuscino, q = sulMobile(d, cu[0], cu[1]), m = misureAv(d.z), dir = d.flip ? -1 : 1;   // (di fianco: la testa sul cuscino in fondo)
      var bagno = o.azione === "bagno", im = bagno ? imgAvFaccia("felici", "sorrisone") : imgAvFaccia("chiusi", "o"), vb = im.vb, k = m.h / 264 * 0.9, MX = 100, MY = 148;   // MX, MY: il mento nel disegno dell'avatar
      avStato = "dorme"; avSu = d; av.classList.add("sdraiato"); av._img.src = im.src;   // la testa sul cuscino, il resto sotto la coperta
      av.style.left = (q.x - (MX - vb[0]) * k).toFixed(1) + "px"; av.style.top = (q.y - (MY - vb[1]) * k).toFixed(1) + "px"; av.style.width = (vb[2] * k).toFixed(1) + "px"; av.style.height = (vb[3] * k).toFixed(1) + "px";
      av.style.transformOrigin = ((MX - vb[0]) / vb[2] * 100).toFixed(1) + "% " + ((MY - vb[1]) / vb[3] * 100).toFixed(1) + "%"; av.style.transform = "rotate(" + ((bagno ? -5 : -9) * dir) + "deg)"; av.style.zIndex = q.g.zi + 1;
      copertaN = el("img", "ca-coperta"); copertaN.alt = ""; copertaN.src = imgOggetto(d.t, false, "coperta", d.vista);   // la coperta rimboccata sopra
      copertaN.style.left = q.g.l.toFixed(1) + "px"; copertaN.style.top = q.g.t.toFixed(1) + "px"; copertaN.style.width = q.g.w.toFixed(1) + "px"; copertaN.style.height = q.g.h.toFixed(1) + "px";
      copertaN.style.zIndex = q.g.zi + 2; copertaN.style.transform = d.flip ? "scaleX(-1)" : ""; strato.appendChild(copertaN);
      suono(bagno ? "acqua" : "molla");
      var zx = q.x + dir * 40 * k, zy = q.y - (bagno ? 70 : 120) * k;   // le "z" di chi dorme, le bolle di sapone di chi fa il bagno
      zTimer = setInterval(function () { zeta(zx, zy, dir, bagno); }, bagno ? 700 : 1300); setTimeout(function () { if (avStato === "dorme") zeta(zx, zy, dir, bagno); }, 500);
    }
    function zeta(x, y, dir, bolla) { var z = bolla ? el("i", "ca-bolla") : el("i", "ca-zzz", "z"); if (bolla) { x += (Math.random() - 0.5) * 40; z.style.width = z.style.height = (6 + Math.random() * 8).toFixed(1) + "px"; } z.style.left = x.toFixed(1) + "px"; z.style.top = y.toFixed(1) + "px"; z.style.setProperty("--dx", (dir * 22) + "px"); strato.appendChild(z); setTimeout(function () { if (z.parentNode) z.parentNode.removeChild(z); }, 2300); }
    function siedi(d, posto) {
      var o = OGG[d.t], q = sulMobile(d, posto, o.seduta), m = misureAv(d.z);
      avStato = "seduto"; avSu = d; av.classList.add("seduto");
      av.style.left = (q.x - m.w / 2).toFixed(1) + "px"; av.style.top = (q.y - m.h * 0.74).toFixed(1) + "px"; av.style.width = m.w.toFixed(1) + "px"; av.style.height = m.h.toFixed(1) + "px";   // il sedere sul cuscino, i piedi penzoloni
      av.style.transform = ""; av.style.zIndex = q.g.zi + 1;
      suono("molla");
    }
    function limiti(mezzo) {   // da dove a dove si vede la stanza sullo schermo (in unità del palco), lasciando "mezzo" ai bordi
      var sc = scena.getBoundingClientRect(), pr = palco.getBoundingClientRect(), k = pr.width / W;
      return [(sc.left - pr.left) / k + mezzo, (sc.right - pr.left) / k - mezzo];
    }
    function nuvoletta(t, dopo) {   // una nuvoletta sopra la testa (cosa prende dal frigo, le note della doccia...)
      setTimeout(function () {
        if (!av || !document.body.contains(s)) return;
        var r = av.getBoundingClientRect(), p = puntoPalco({ clientX: r.left + r.width / 2, clientY: r.top }), lim = limiti(26);
        var b = el("i", "ca-nuvola", t); b.style.left = Math.max(lim[0], Math.min(lim[1], p.x)).toFixed(1) + "px"; b.style.top = p.y.toFixed(1) + "px"; strato.appendChild(b);
        setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1700);
      }, dopo || 0);
    }
    var bLook = el("button", "ca-bottone", "👕 Cambia look");   // davanti all'armadio aperto
    bLook.addEventListener("pointerdown", function (e) { e.stopPropagation(); });
    bLook.onclick = function () { if (opts.vestiti) esci(opts.vestiti); };
    function davantiA(d, accanto) {   // dove si mette l'avatar per usare un oggetto: di solito di fianco, così si vede cosa succede
      var o = OGG[d.t], base = d, lato, mezzo;
      if (o.tipo === "tappeto") return { x: d.x, z: d.z };
      if (o.tipo === "muro" && d.parete) return { x: d.parete === "sx" ? -XW + 0.65 : XW - 0.65, z: d.z - 0.15 };   // sotto il quadro sulla parete di lato
      if (o.tipo === "muro") {
        mezzo = misura(d.t).w / 200 + 0.4; lato = avPos.x < d.x ? -1 : 1; if (Math.abs(d.x + lato * mezzo) > XW - 0.3) lato = -lato;
        return { x: d.x + lato * mezzo, z: ZB - 0.5 };
      }
      if (d.su) stanza().oggetti.forEach(function (x) { if (x.u === d.su) base = x; });
      var pr = (OGG[base.t].prof || 0.3) / 2;
      if (!accanto) return { x: d.x, z: base.z - pr - 0.22 };
      mezzo = largo(base.t, base.vista) / 2 + 0.5; lato = o.lato ? o.lato * (base.flip ? -1 : 1) : avPos.x < base.x ? -1 : 1;
      if (Math.abs(base.x + lato * mezzo) > XW - 0.3) lato = -lato;
      if (Math.abs(base.x + lato * mezzo) > XW - 0.3) return { x: d.x, z: base.z - pr - 0.22 };   // non c'è spazio ai lati: davanti
      return { x: base.x + lato * mezzo, z: base.z - pr + 0.08 };
    }
    function interagisci(d, p) {
      var o = OGG[d.t], dv = davantiA(d), m = misura(d.t, d.vista), sgn = d.flip ? -1 : 1;
      if (!av) { var n0 = nodi[d.u]; n0.classList.remove("rimbalza"); void n0.offsetWidth; n0.classList.add("rimbalza"); return; }
      if (avSu === d) { lasciaStare(); aspetta(); return; }   // tocchi il letto (o il divano) dove sta già: si alza
      if ((o.azione === "dormi" || o.azione === "bagno") && d.vista) { var dl = davantiA(d, true); return vaiA(dl.x, dl.z, function () { dormi(d); }); }   // di fianco: ci sale da un lato
      if (o.azione === "dormi" || o.azione === "bagno") return vaiA(d.x + sgn * (o.cuscino[0] + 30 - m.w / 2) / 100, dv.z, function () { dormi(d); });
      if (o.azione === "siedi" && !d.vista) {   // (di fianco ci si siede solo girandolo di nuovo davanti)
        var posto = o.posti[0];
        o.posti.forEach(function (ps) { if (Math.abs(sulMobile(d, ps, 0).x - p.x) < Math.abs(sulMobile(d, posto, 0).x - p.x)) posto = ps; });   // il posto più vicino a dove hai toccato
        return vaiA(d.x + sgn * (posto - m.w / 2) / 100, dv.z, function () { siedi(d, posto); });
      }
      dv = davantiA(d, o.uso !== "doccia");
      vaiA(dv.x, dv.z, function () { avDir = d.x >= avPos.x ? 1 : -1; posaAv(); usa(d); });   // arrivato, si gira verso l'oggetto
    }
    function usa(d) {
      var o = OGG[d.t], n = nodi[d.u]; if (!n) return aspetta();
      function spegni() { d.on = false; if (nodi[d.u]) posa(d); }
      function finche(ms, fine) { avUso = { fine: fine, timer: setTimeout(function () { avUso = null; fine(); aspetta(); }, ms) }; }
      if (o.stati === "accendi") { d.on = !d.on; posa(d); suono(d.on ? "accendi" : "spegni"); salva(); aspetta(); return; }
      if (o.stati === "apri") {
        d.on = true; posa(d); suono("apri");
        if (/^frigo/.test(d.t)) nuvoletta(["🥛", "🍎", "🧀", "🍕", "🥕", "🍦"][Math.floor(Math.random() * 6)], 700);
        if (o.vestiti && opts.vestiti) {
          var g = geo(d);
          strato.appendChild(bLook); var lim = limiti(bLook.offsetWidth / 2 + 8);   // dentro lo schermo, anche se l'armadio è tutto di lato
          bLook.style.left = Math.max(lim[0], Math.min(lim[1], g.ax)).toFixed(1) + "px"; bLook.style.top = (g.t + g.h * 0.3).toFixed(1) + "px";
          bLook.classList.remove("su"); void bLook.offsetWidth; bLook.classList.add("su");
        }
        finche(o.vestiti ? 7000 : 2600, function () { spegni(); suono("chiudi"); if (bLook.parentNode) bLook.parentNode.removeChild(bLook); });
        return;
      }
      if (o.uso === "doccia") {   // entra, la tenda si chiude, canta sotto l'acqua, poi esce pulito
        av.classList.add("dentro"); d.on = true; posa(d); suono("doccia"); nuvoletta("🎵", 900); nuvoletta("🎶", 2200);
        finche(4200, function () { spegni(); av.classList.remove("dentro"); nuvoletta("✨", 200); saluta(); });
        return;
      }
      if (o.uso === "wc" || o.uso === "acqua") { d.on = true; posa(d); suono(o.uso === "wc" ? "sciacquone" : "acqua"); finche(o.uso === "wc" ? 1500 : 2100, spegni); return; }
      if (o.uso === "suona") { n.classList.remove("trema"); void n.offsetWidth; n.classList.add("trema"); suono("dring"); aspetta(); return; }
      n.classList.remove("rimbalza"); void n.offsetWidth; n.classList.add("rimbalza"); saluta(); aspetta();   // il resto: lo tocca e lo guarda
    }
    var meta = el("i", "ca-meta");   // il segno sul pavimento dove hai toccato
    function segno(x, z) {
      var a = P(x, 0, z), k = scala(0, z), w = 0.6 * k, h = Math.abs(P(x, 0, z - 0.3)[1] - P(x, 0, z + 0.3)[1]);
      meta.style.left = (a[0] - w / 2).toFixed(1) + "px"; meta.style.top = (a[1] - h / 2).toFixed(1) + "px"; meta.style.width = w.toFixed(1) + "px"; meta.style.height = h.toFixed(1) + "px";
      if (meta.parentNode !== strato) strato.appendChild(meta);
      meta.classList.remove("su"); void meta.offsetWidth; meta.classList.add("su");
    }
    function toccaPavimento(p) {
      var f = daSchermo(p.x, p.y, 0), x, z;
      if (!f || f.z > ZB - 0.3) { x = daMuro(p.x, p.y).x; z = ZB - 0.35; } else { x = f.x; z = f.z; }   // toccando la parete va lì sotto
      x = Math.max(-XW + 0.3, Math.min(XW - 0.3, x)); z = Math.max(ZMIN, Math.min(ZB - 0.3, z));
      segno(x, z); vaiA(x, z);
    }

    // ---- toccare e trascinare ----
    var drag = null;
    function largo(t, vista) { var o = OGG[t]; return o.corpo && !vista ? (o.corpo[1] - o.corpo[0]) / 100 : misura(t, vista).w / 100; }   // quanto è largo il mobile (senza le ante aperte)
    function figliDi(d) { return stanza().oggetti.filter(function (x) { return x.su === d.u; }); }
    function deseleziona() { sel = null; tool.classList.remove("su"); [].forEach.call(strato.children, function (n) { n.classList.remove("scelto"); }); }
    function seleziona(d) {
      deseleziona(); sel = d; var n = nodi[d.u]; if (!n) return; n.classList.add("scelto");
      var g = geo(d); tool.style.left = g.ax.toFixed(1) + "px"; tool.style.top = Math.max(18, g.t - 8).toFixed(1) + "px"; tool.classList.add("su");
    }
    tGira.onclick = function () {   // gira: i mobili che hanno il fianco fanno davanti → di fianco → di fianco dall'altra parte; gli altri si specchiano
      if (!sel) return;
      if (OGG[sel.t].fianco) { if (!sel.vista) { sel.vista = "fianco"; sel.flip = false; } else if (!sel.flip) sel.flip = true; else { sel.vista = null; sel.flip = false; } }
      else sel.flip = !sel.flip;
      var mz = largo(sel.t, sel.vista) / 2; sel.x = Math.max(-XW + mz, Math.min(XW - mz, sel.x));
      figliDi(sel).forEach(function (f) { f.x = Math.max(sel.x - mz + 0.05, Math.min(sel.x + mz - 0.05, f.x)); posa(f); });   // le cose appoggiate restano sopra
      var n = nodi[sel.u]; posa(sel); seleziona(sel); n.classList.remove("rimbalza"); void n.offsetWidth; n.classList.add("rimbalza"); suono("gira"); salva(); };
    tVia.onclick = function () { if (!sel) return; metiVia(sel); };
    function metiVia(d) {
      var lista = [d].concat(figliDi(d)), sz = stanza();
      lista.forEach(function (x) {
        var n = nodi[x.u]; if (n) { n.classList.add("via"); if (n._luce && n._luce.parentNode) n._luce.parentNode.removeChild(n._luce); (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 320); })(n); delete nodi[x.u]; }
        sz.oggetti = sz.oggetti.filter(function (y) { return y !== x; }); casa.baule.push(x.t);
      });
      deseleziona(); suono("baule"); dimmi("Messo nel baule 🧳"); salva(); if (arreda) disegnaCassetto();
      var tb = cTabs.querySelector("[data-id='baule']"); if (tb) { tb.classList.remove("pulsa"); void tb.offsetWidth; tb.classList.add("pulsa"); }
    }
    function tocco(e, d) {
      if (!arreda) { toccoD = d; return; }   // fuori dall'Arreda: se il dito non si muove, l'avatar ci va e lo usa (vedi su())
      e.preventDefault(); e.stopPropagation();
      var p = puntoPalco(e), g = geo(d);
      drag = { d: d, id: e.pointerId, sx: p.x, sy: p.y, ox: p.x - g.ax, oy: p.y - g.ay, mosso: false, vx: 0, ult: p, figli: figliDi(d).map(function (f) { return { f: f, dx: f.x - d.x }; }), su0: d.su };
      try { palco.setPointerCapture(e.pointerId); } catch (er) {}
    }
    function sopraUnMobile(d, ax, ay) {   // un oggetto piccolo appoggiato sopra un mobile col ripiano?
      var trovato = null;
      stanza().oggetti.forEach(function (m) {
        var o = OGG[m.t]; if (!o.piano || m === d || o.tipo !== "pav") return;
        var yP = o.piano / 100, a = P(m.x, yP, m.z), w = largo(m.t, m.vista) * scala(yP, m.z);
        if (ax > a[0] - w / 2 && ax < a[0] + w / 2 && ay > a[1] - 30 && ay < a[1] + 16) { if (!trovato || m.z < trovato.z) trovato = m; }
      });
      return trovato;
    }
    function scorriAlBordo() {   // portando un mobile verso il bordo, la stanza scorre da sola
      if (!drag || !drag.dir) { if (drag) drag.anim = 0; return; }
      var ora = performance.now(), dt = Math.min(50, ora - (drag.tBordo || ora - 16)); drag.tBordo = ora;   // a tempo: uguale anche sui telefoni lenti
      var prima = tx; tx += drag.dir * 0.28 * dt; applica();
      if (Math.abs(tx - prima) > 0.01) muovi(drag.ev);
      drag.anim = requestAnimationFrame(scorriAlBordo);
    }
    function muovi(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var sc = scena.getBoundingClientRect();
      drag.ev = { clientX: e.clientX, clientY: e.clientY, pointerId: e.pointerId };
      drag.dir = drag.mosso ? (e.clientX < sc.left + 34 ? 1 : e.clientX > sc.right - 34 ? -1 : 0) : 0;
      if (drag.dir && !drag.anim) { drag.tBordo = 0; drag.anim = requestAnimationFrame(scorriAlBordo); }
      var p = puntoPalco(e), d = drag.d, o = OGG[d.t];
      if (!drag.mosso) { if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) < 6) return; drag.mosso = true; deseleziona(); nodi[d.u].classList.add("su"); suono("su"); try { if (navigator.vibrate) navigator.vibrate(8); } catch (er) {} }
      drag.vx = drag.vx * 0.7 + (p.x - drag.ult.x) * 0.3; drag.ult = p;
      var ax = p.x - drag.ox, ay = p.y - drag.oy, m = misura(d.t, d.vista), wM = m.w / 100, hM = m.h / 100, f;
      if (o.tipo === "muro") {   // sul muro di fondo; portato oltre l'angolo passa sulla parete di lato
        f = daMuro(ax, ay);
        var lato = f.x < -XW + wM / 2 - 0.03 ? "sx" : f.x > XW - wM / 2 + 0.03 ? "dx" : null, fl = lato ? daParete(ax, ay, lato === "sx" ? -XW : XW) : null;
        if (fl && fl.z < ZB - wM / 2) {
          d.parete = lato; d.x = lato === "sx" ? -XW : XW; d.z = Math.max(ZB - 3 + wM / 2, fl.z); f = fl;
          for (var gi = 0; gi < 60 && d.z < ZB - wM / 2; gi++) {   // resta dentro la stanza disegnata
            var xs = quadParete(d, m).map(function (pp) { return pp[0]; }); if (lato === "sx" ? Math.min.apply(0, xs) >= 4 : Math.max.apply(0, xs) <= W - 4) break; d.z += 0.04;
          }
        }
        else { d.parete = null; d.z = ZB; d.x = Math.max(-XW + wM / 2, Math.min(XW - wM / 2, f.x)); }
        d.y = Math.max(hM / 2 + 0.2, Math.min(YT - hM / 2 - 0.04, f.y));
      } else {
        var mob = o.tipo === "acc" ? sopraUnMobile(d, p.x, p.y) : null;
        if (drag.bersaglio && drag.bersaglio !== mob && nodi[drag.bersaglio.u]) nodi[drag.bersaglio.u].classList.remove("bersaglio");
        if (mob && nodi[mob.u]) nodi[mob.u].classList.add("bersaglio"); drag.bersaglio = mob;   // il mobile su cui si appoggia si illumina
        if (mob) {
          var yP = OGG[mob.t].piano / 100, wm = largo(mob.t, mob.vista), ks = scala(yP, mob.z), aa = P(mob.x, yP, mob.z);
          d.su = mob.u; d.y = yP; d.z = mob.z - 0.01; d.x = Math.max(mob.x - wm / 2 + wM / 2, Math.min(mob.x + wm / 2 - wM / 2, mob.x + (ax - aa[0]) / ks));
        } else {
          f = daSchermo(ax, ay, 0); d.su = null; d.y = 0;
          if (f) { var pr = (o.prof || 0.3) / 2; d.x = Math.max(-XW + largo(d.t, d.vista) / 2, Math.min(XW - largo(d.t, d.vista) / 2, f.x)); d.z = Math.max(ZMIN, Math.min(ZB - pr, f.z)); }
        }
      }
      posa(d);
      drag.figli.forEach(function (c) { c.f.x = d.x + c.dx; c.f.z = d.z - 0.01; posa(c.f); });
      var n = nodi[d.u]; n.style.zIndex = 900;   // mentre lo porti sta davanti a tutto
      if (!d.parete) n._img.style.transform = (d.flip ? "scaleX(-1) " : "") + "rotate(" + Math.max(-10, Math.min(10, drag.vx * 1.6)).toFixed(1) + "deg)";   // (sulle pareti di lato niente dondolio)
      var sopraCassetto = cassetto.classList.contains("su") && e.clientY > cassetto.getBoundingClientRect().top;
      cassetto.classList.toggle("bersaglio", sopraCassetto); drag.via = sopraCassetto;
    }
    function lascia(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag.d, n = nodi[d.u], era = drag; drag = null; cassetto.classList.remove("bersaglio"); cancelAnimationFrame(era.anim);
      if (era.bersaglio && nodi[era.bersaglio.u]) nodi[era.bersaglio.u].classList.remove("bersaglio");
      if (!era.mosso) { seleziona(d); suono("su"); return; }
      n.classList.remove("su");
      if (era.via) { metiVia(d); return; }
      posa(d); era.figli.forEach(function (c) { posa(c.f); });
      n.classList.remove("cade"); void n.offsetWidth; n.classList.add("cade");
      polvere(d);
      suono(d.su ? "clink" : OGG[d.t].tipo === "muro" ? "clink" : "giu");
      salva();
    }
    // il dito sulla stanza: se si muove la fa scorrere di lato, se tocca e basta l'avatar va lì (o usa l'oggetto toccato)
    var gesto = null, toccoD = null, toccoAv = false;
    function premi(e) {
      var d = toccoD, a = toccoAv; toccoD = null; toccoAv = false;
      if (drag || e.target.closest(".ca-tool, .ca-bottone")) return;
      cancelAnimationFrame(inerzia);
      gesto = { id: e.pointerId, x0: e.clientX, y0: e.clientY, tx0: tx, mosso: false, d: d, av: a, p: puntoPalco(e), ux: e.clientX, ut: performance.now(), v: 0 };
      try { palco.setPointerCapture(e.pointerId); } catch (er) {}
      if (d && !arreda) { var g0 = gesto; g0.lungo = setTimeout(function () { tienePremuto(g0); }, 450); }   // tenuto premuto su un mobile: si apre l'Arreda e lo prendi
    }
    function tienePremuto(g0) {
      if (gesto !== g0 || g0.mosso || !nodi[g0.d.u]) return;
      gesto = null; var d = g0.d, p = g0.p, gg = geo(d), n = nodi[d.u];
      entraArreda();
      drag = { d: d, id: g0.id, sx: p.x, sy: p.y, ox: p.x - gg.ax, oy: p.y - gg.ay, mosso: false, vx: 0, ult: p, figli: figliDi(d).map(function (f) { return { f: f, dx: f.x - d.x }; }), su0: d.su };
      seleziona(d); n.classList.remove("rimbalza"); void n.offsetWidth; n.classList.add("rimbalza"); suono("su");
      try { if (navigator.vibrate) navigator.vibrate(15); } catch (er) {}
    }
    function trascina(e) {
      if (!gesto || e.pointerId !== gesto.id) return;
      var dx = e.clientX - gesto.x0, dy = e.clientY - gesto.y0, t = performance.now();
      if (!gesto.mosso) { if (Math.abs(dx) + Math.abs(dy) < 9) return; gesto.mosso = true; clearTimeout(gesto.lungo); }
      gesto.v = 0.6 * gesto.v + 0.4 * (e.clientX - gesto.ux) / Math.max(1, t - gesto.ut); gesto.ux = e.clientX; gesto.ut = t;
      tx = gesto.tx0 + dx / zoomScena(); applica();
    }
    function su(e) {
      if (!gesto || e.pointerId !== gesto.id) return;
      var g = gesto; gesto = null; clearTimeout(g.lungo);
      if (e.type === "pointercancel") return;
      if (g.mosso) { if (performance.now() - g.ut < 80) lancia(g.v); return; }
      if (arreda) { deseleziona(); return; }
      if (g.d) interagisci(g.d, g.p);
      else if (g.av) toccaAvatar();
      else if (av) toccaPavimento(g.p);
    }
    palco.addEventListener("pointerdown", premi);
    palco.addEventListener("pointermove", function (e) { muovi(e); trascina(e); });
    ["pointerup", "pointercancel"].forEach(function (k) { palco.addEventListener(k, function (e) { lascia(e); su(e); }); });
    function polvere(d) {   // uno sbuffo di polvere quando si posa (solo transform e opacity)
      var g = geo(d), n = OGG[d.t].tipo === "muro" ? 4 : 7;
      for (var i = 0; i < n; i++) {
        var b = el("i", "ca-sbuffo"); b.style.left = (g.ax + (i - (n - 1) / 2) * g.w / n).toFixed(1) + "px"; b.style.top = (OGG[d.t].tipo === "muro" ? g.t + g.h : g.ay).toFixed(1) + "px";
        b.style.setProperty("--dx", ((i - (n - 1) / 2) * 7) + "px"); b.style.animationDelay = (i * 18) + "ms"; strato.appendChild(b);
        (function (b) { setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 700); })(b);
      }
    }

    // ---- l'Arreda: il cassetto in basso col baule, le pareti, i pavimenti e il negozio ----
    function entraArreda() {
      arreda = true; s.classList.add("arreda"); lasciaStare(); fermaAvatar(); applica(); cassetto.classList.add("su"); bArreda.textContent = "✓ Fatto";
      disegnaCassetto(); dimmi("Trascina i mobili dove vuoi ✨");
    }
    function esciArreda() {
      arreda = false; s.classList.remove("arreda"); applica(); deseleziona(); cassetto.classList.remove("su"); bArreda.textContent = "✏️ Arreda";
      salva(); avTimer = setTimeout(passeggia, 800);
    }
    function scheda1(img, nome, sotto, cls, onclick) {
      var b = el("button", "ca-pezzo" + (cls ? " " + cls : "")), im = el("img"); im.src = img; im.alt = ""; im.draggable = false;
      b.appendChild(im); b.appendChild(el("b", null, nome)); if (sotto) b.appendChild(el("small", null, sotto)); b.onclick = onclick; return b;
    }
    function disegnaCassetto() {
      [].forEach.call(cTabs.children, function (b) { b.classList.toggle("on", b.dataset.id === scheda); });
      while (cLista.firstChild) cLista.removeChild(cLista.firstChild);
      var sz = stanza(), st = datiStanza();
      if (scheda === "baule") {
        var conta = {}; casa.baule.forEach(function (t) { conta[t] = (conta[t] || 0) + 1; });
        var tipi = Object.keys(conta);
        if (!tipi.length) cLista.appendChild(el("div", "ca-vuoto", "Il baule è vuoto. Trascina qui un mobile per metterlo via, o compra qualcosa nel negozio."));
        tipi.forEach(function (t) { cLista.appendChild(scheda1(imgOggetto(t), OGG[t].nome, conta[t] > 1 ? "× " + conta[t] : "", OGG[t].qual ? "bello" : "", function () { tira(t); })); });
      } else if (scheda === "pareti") {
        casa.carte.forEach(function (c) { cLista.appendChild(scheda1(campioneCarta(c), CARTE[c].nome, sz.carta === c ? "messa" : "", sz.carta === c ? "messo" : "", function () { cambiaCarta(c); })); });
      } else if (scheda === "pavimenti") {
        casa.pavimenti.forEach(function (c) { cLista.appendChild(scheda1(campionePav(c), PAVIMENTI[c].nome, sz.pav === c ? "messo" : "", sz.pav === c ? "messo" : "", function () { cambiaPav(c); })); });
      } else if (scheda === "misura") {   // la stanza più larga: si paga la differenza con la misura che hai già
        MISURE.forEach(function (m, i) {
          var mia = i <= (sz.misMax || 0), costo = (m.prezzo || 0) - (MISURE[sz.misMax || 0].prezzo || 0);
          var sotto = (sz.mis || 0) === i ? "in uso" : mia ? "tua" : "🪙 " + cifre(costo);
          cLista.appendChild(scheda1(campioneMisura(i), m.nome + " · " + String(Math.round(m.xw * 20) / 10).replace(".", ",") + " m", sotto, (sz.mis || 0) === i ? "messo" : mia ? "" : "negozio", function () { cambiaMisura(i, mia ? 0 : costo); }));
        });
      } else {
        Object.keys(OGG).forEach(function (t) { if (OGG[t].prezzo) cLista.appendChild(scheda1(imgOggetto(t), OGG[t].nome, "🪙 " + cifre(OGG[t].prezzo), "negozio", function () { compra("ogg", t, OGG[t].prezzo); })); });
        Object.keys(CARTE).forEach(function (c) { if (CARTE[c].prezzo && casa.carte.indexOf(c) < 0) cLista.appendChild(scheda1(campioneCarta(c), CARTE[c].nome, "🪙 " + cifre(CARTE[c].prezzo), "negozio", function () { compra("carta", c, CARTE[c].prezzo); })); });
        Object.keys(PAVIMENTI).forEach(function (c) { if (PAVIMENTI[c].prezzo && casa.pavimenti.indexOf(c) < 0) cLista.appendChild(scheda1(campionePav(c), PAVIMENTI[c].nome, "🪙 " + cifre(PAVIMENTI[c].prezzo), "negozio", function () { compra("pav", c, PAVIMENTI[c].prezzo); })); });
      }
    }
    function tira(t) {   // dal baule alla stanza: cade dall'alto e rimbalza
      var o = OGG[t], sz = stanza(), m = misura(t), i = casa.baule.indexOf(t); if (i < 0) return;
      casa.baule.splice(i, 1);
      var d = { u: sz.prossimo++, t: t, x: 0, z: 3.2, y: 0, flip: false };
      if (o.tipo === "muro") { d.z = ZB; d.y = Math.min(YT - m.h / 200 - 0.05, 1.7); }
      sz.oggetti.push(d); posa(d);
      var n = nodi[d.u]; n.classList.add("arriva"); setTimeout(function () { n.classList.remove("arriva"); polvere(d); suono("giu"); }, 420);
      salva(); disegnaCassetto(); seleziona(d);
    }
    function cambia(strato1, strato2, src) {   // la carta nuova "passa" sulla vecchia, da sinistra a destra
      strato2.src = src; strato2.classList.remove("passa"); void strato2.offsetWidth; strato2.classList.add("passa");
      setTimeout(function () { strato1.src = src; strato2.classList.remove("passa"); }, 620);
    }
    function cambiaCarta(c) { var sz = stanza(); if (sz.carta === c) return; sz.carta = c; cambia(muriA, muriB, imgMuri(datiStanza(), c)); suono("carta"); salva(); disegnaCassetto(); }
    function cambiaPav(c) { var sz = stanza(); if (sz.pav === c) return; sz.pav = c; cambia(pavA, pavB, imgPav(datiStanza(), c)); suono("carta"); salva(); disegnaCassetto(); }
    function cambiaMisura(i, costo) {   // allarga (o stringe) la stanza: i mobili rimasti fuori rientrano
      var sz = stanza(); if ((sz.mis || 0) === i) return;
      if (costo > 0) { if (!spendi(costo)) return; sz.misMax = i; dimmi("Stanza allargata! Scorri col dito per vederla tutta ↔️"); }
      sz.mis = i; var xw = MISURE[i].xw;
      sz.oggetti.forEach(function (d) {
        if (d.su) return;
        if (d.parete) { d.x = (d.parete === "sx" ? -1 : 1) * xw; return; }   // i quadri sulle pareti di lato seguono la parete
        var mezzo = OGG[d.t].tipo === "muro" ? misura(d.t).w / 200 : largo(d.t, d.vista) / 2, nx = Math.max(-xw + mezzo, Math.min(xw - mezzo, d.x)), dx = nx - d.x;
        if (dx) { d.x = nx; figliDi(d).forEach(function (f) { f.x += dx; }); }
      });
      suono("carta"); salva();
      palco.classList.add("cambia");
      setTimeout(function () { disegnaStanza(); palco.classList.remove("cambia"); disegnaCassetto(); }, 180);
    }
    function compra(tipo, id, prezzo) {
      if (!spendi(prezzo)) return;
      if (tipo === "ogg") casa.baule.push(id); else if (tipo === "carta") casa.carte.push(id); else casa.pavimenti.push(id);
      dimmi(tipo === "ogg" ? "Comprato! È nel baule 🧳" : "Comprato! Lo trovi in " + (tipo === "carta" ? "Pareti" : "Pavimento")); salva(); disegnaCassetto();
      var tb = cTabs.querySelector("[data-id='" + (tipo === "ogg" ? "baule" : tipo === "carta" ? "pareti" : "pavimenti") + "']"); if (tb) { tb.classList.remove("pulsa"); void tb.offsetWidth; tb.classList.add("pulsa"); }
    }

    // ---- partenza ----
    s._monta = function () {
      (function prova() { if (!document.body.contains(s)) return; if (!stendi()) return requestAnimationFrame(prova); })();
      disegnaStanza(); aggMonete(); if (av) { posaAv(); clearTimeout(avTimer); avTimer = setTimeout(passeggia, 1200); }
      window.addEventListener("resize", function ridim() { if (!document.body.contains(s)) return window.removeEventListener("resize", ridim); stendi(); });
    };
    return s;
  }

  // =========================================================
  //  IL NEGOZIO: un negozio lungo che si scorre col dito, diviso in reparti;
  //  gli oggetti sono in vetrina, grandi, col cartellino del prezzo sotto. Si tocca per comprare:
  //  i mobili finiscono nel baule di casa, carte da parati e pavimenti tra quelli da mettere.
  //  opts: { dati (la casa), salva(dati), monete(), spendi(n), indietro(), aCasa(), audio(), reparto }
  // =========================================================
  var REPARTI = [
    { id: "soggiorno", nome: "Soggiorno", ico: "🛋️", muro: "#f6e4c8", riga: "#efd8b6" },
    { id: "cucina", nome: "Cucina", ico: "🍳", muro: "#e2f2e4", riga: "#d2eadb" },
    { id: "camera", nome: "Camera", ico: "🛏️", muro: "#ece3f7", riga: "#e0d4f1" },
    { id: "bagno", nome: "Bagno", ico: "🛁", muro: "#dcf0f7", riga: "#cce7f1" },
    { id: "deco", nome: "Decorazioni", ico: "🖼️", muro: "#f9e4e2", riga: "#f2d3d0" },
    { id: "pareti", nome: "Pareti e pavimenti", ico: "🎨", muro: "#f2ede3", riga: "#e8e0cf" },
    { id: "usato", nome: "Mercatino dell'usato", ico: "♻️", muro: "#e8e0cf", riga: "#ddd2bb" }
  ];
  function repartoDi(t) {
    var o = OGG[t]; if (!o.qual) return "usato"; if (o.reparto) return o.reparto;
    if (/^(frigo|fornello|cucina)/.test(t)) return "cucina";
    if (o.tipo === "muro" || o.tipo === "tappeto" || o.stanza === "tutte") return "deco";
    return o.stanza;
  }
  function cosaFa(o) {   // una riga sotto il nome: cosa ci si fa
    if (o.azione === "dormi") return "Ci si dorme 😴";
    if (o.azione === "siedi") return "Ci si siede";
    if (o.azione === "bagno") return "Ci si fa il bagno con la schiuma 🫧";
    if (o.vestiti) return "Si apre: dentro cambi look 👕";
    if (o.stati === "apri") return "Si apre e dentro c'è da mangiare";
    if (o.stati === "accendi") return "Si accende e si spegne 💡";
    if (o.uso === "doccia") return "Ci si fa la doccia 🚿";
    if (o.uso === "wc") return "Si tira l'acqua";
    if (o.uso === "acqua") return "Esce l'acqua 💧";
    if (o.uso === "suona") return "Suona! ⏰";
    if (o.piano) return "Ci si appoggiano sopra le cose";
    if (o.tipo === "muro") return "Si appende al muro";
    if (o.tipo === "tappeto") return "Si stende sul pavimento";
    return "Per fare bella la casa ✨";
  }
  function rotoloCarta(id) {   // la carta da parati in vetrina: un rotolo srotolato
    var c = CARTE[id];
    return datauri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 64 124' width='64' height='124'><defs>" + c.motivo("m") +
      "<linearGradient id='l' x1='0' x2='1' y1='0' y2='0'><stop offset='0' stop-color='#000' stop-opacity='.12'/><stop offset='.5' stop-color='#fff' stop-opacity='.15'/><stop offset='1' stop-color='#000' stop-opacity='.12'/></linearGradient></defs>" +
      "<rect x='5' y='9' width='54' height='113' fill='url(#m)' stroke='" + LINEA + "' stroke-width='1.6'/><rect x='5' y='9' width='54' height='113' fill='url(#l)'/>" +
      "<rect x='1' y='2' width='62' height='13' rx='6.5' fill='url(#m)' stroke='" + LINEA + "' stroke-width='1.6'/><rect x='1' y='2' width='62' height='13' rx='6.5' fill='url(#l)'/></svg>");
  }

  function negozio(opts) {
    var casa = opts.dati && opts.dati.v ? opts.dati : casaIniziale(), tSalva = null, sezioni = [], pezzi = [];
    function salva() { clearTimeout(tSalva); tSalva = setTimeout(function () { if (opts.salva) opts.salva(casa); }, 300); }
    function suono(t) { suonaCasa(opts.audio, t); }
    var s = el("div", "schermata ne-vista"), strada = el("div", "ne-strada"), dentro = el("div", "ne-dentro");
    strada.appendChild(dentro); s.appendChild(strada);
    // in alto: indietro, il nome, le monete
    var testa = el("div", "ca-testa"), indietro = el("button", "ca-indietro", "‹"), titolo = el("div", "ca-titolo", "Negozio"), monete = el("div", "ca-monete");
    indietro.onclick = function () { chiudi(); if (opts.indietro) opts.indietro(); };
    testa.appendChild(indietro); testa.appendChild(titolo); testa.appendChild(monete); s.appendChild(testa);
    // in basso: i reparti (toccandone uno ci si va) e la strada di casa
    var giu = el("div", "ne-giu"), chips = el("div", "ne-reparti");
    REPARTI.forEach(function (rp) {
      var b = el("button", "ne-chip"); b.dataset.id = rp.id; b.appendChild(el("span", null, rp.ico)); b.appendChild(el("b", null, rp.nome.split(" ")[0]));
      b.onclick = function () { vaiReparto(rp.id, true); }; chips.appendChild(b);
    });
    giu.appendChild(chips);
    if (opts.aCasa) { var bCasa = el("button", "ne-acasa", "🏠 Casa"); bCasa.onclick = function () { chiudi(); opts.aCasa(); }; giu.appendChild(bCasa); }
    s.appendChild(giu);
    var avviso = el("div", "ca-avviso"); s.appendChild(avviso);
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }
    function soldi() { return opts.monete ? opts.monete() : casa.monete; }
    function aggMonete() { monete.textContent = "🪙 " + cifre(soldi()) + (opts.monete ? "" : " · prova"); }
    function nelBaule(t) { return casa.baule.filter(function (x) { return x === t; }).length; }
    function mia(pz) { return pz.tipo === "carta" ? casa.carte.indexOf(pz.id) >= 0 : pz.tipo === "pavim" ? casa.pavimenti.indexOf(pz.id) >= 0 : false; }

    // ---- cosa c'è in ogni reparto (dal meno caro) ----
    function pezziDel(rp) {
      var l = [];
      if (rp === "pareti") {
        Object.keys(CARTE).forEach(function (c) { if (CARTE[c].prezzo) l.push({ tipo: "carta", id: c, nome: CARTE[c].nome, prezzo: CARTE[c].prezzo, img: rotoloCarta(c), w: 64, h: 124, cosa: "Carta da parati: si mette dall'Arreda" }); });
        Object.keys(PAVIMENTI).forEach(function (c) { if (PAVIMENTI[c].prezzo) l.push({ tipo: "pavim", id: c, nome: PAVIMENTI[c].nome, prezzo: PAVIMENTI[c].prezzo, img: campionePav(c), w: 60, h: 60, cosa: "Pavimento: si mette dall'Arreda" }); });
        return l;
      }
      Object.keys(OGG).forEach(function (t) { if (OGG[t].prezzo && repartoDi(t) === rp) l.push({ tipo: "ogg", id: t, o: OGG[t], nome: OGG[t].nome, prezzo: OGG[t].prezzo, img: imgOggetto(t), cosa: cosaFa(OGG[t]) }); });
      return l.sort(function (a, b) { return a.prezzo - b.prezzo; });
    }

    // ---- il negozio disegnato: le pareti dei reparti, il pavimento, le vetrine coi cartellini ----
    function costruisci() {
      var h = strada.clientHeight, cw = strada.clientWidth; if (!h || !cw) return false;
      while (dentro.firstChild) dentro.removeChild(dentro.firstChild); sezioni = []; pezzi = [];
      var pav = Math.round(h * 0.7), k = Math.max(0.75, Math.min(1.35, (pav - 120) / 200)), x = 0;
      dentro.style.height = h + "px";
      function metti(cls, l, t, w, hh, testo) { var e = el(cls === "img" ? "img" : "i", cls === "img" ? null : cls, testo); if (cls === "img") e.draggable = false; e.style.left = l.toFixed(1) + "px"; e.style.top = t.toFixed(1) + "px"; if (w != null) e.style.width = w.toFixed(1) + "px"; if (hh != null) e.style.height = hh.toFixed(1) + "px"; dentro.appendChild(e); return e; }
      // l'ingresso: il bancone con la commessa che saluta
      var lIng = Math.max(250, cw * 0.8), muroIng = metti("ne-sezione", 0, 0, lIng, pav); muroIng.style.background = "repeating-linear-gradient(90deg,#fff1d6 0 26px,#fbe7c2 26px 52px)";
      metti("ne-insegna grande", lIng / 2, Math.max(70, pav * 0.16), null, null, "🛍️ Negozio");
      if (window.SGOmino) {
        var cfg = SGOmino.casuale("commessa del negozio"), bw = 150 * k, im = metti("img", lIng / 2 - bw / 2 - 20 * k, pav - 92 * k - bw * 0.97, bw, bw); im.className = "ne-commessa";
        try { im.src = datauri(SGOmino.svg(cfg, { busto: true })); } catch (e) {}
      }
      metti("ne-banco", lIng / 2 - 110 * k, pav - 92 * k, 220 * k, 92 * k + 6);
      metti("ne-cassa", lIng / 2 + 40 * k, pav - 92 * k - 30 * k, 44 * k, 30 * k);
      metti("ne-fumetto", lIng / 2 + 50 * k, pav - 92 * k - 150 * k, null, null, "Ciao! Scorri per vedere tutto ➜");
      x = lIng;
      REPARTI.forEach(function (rp) {
        var lista = pezziDel(rp.id); if (!lista.length) return;
        var x0 = x, muro = metti("ne-sezione", x0, 0, 10, pav);
        muro.style.background = "repeating-linear-gradient(90deg," + rp.muro + " 0 26px," + rp.riga + " 26px 52px)";
        x += 40;
        lista.forEach(function (pz) { x = vetrina(pz, x, pav, k) + 34; });
        x += 6; muro.style.width = (x - x0) + "px";
        metti("ne-insegna", x0 + Math.min((x - x0) / 2, cw * 0.45), Math.max(70, pav * 0.16), null, null, rp.ico + " " + rp.nome);
        metti("ne-colonnina", x - 8, 0, 16, pav);   // il pilastro tra un reparto e l'altro
        sezioni.push({ id: rp.id, x: x0 });
      });
      x += 30;
      metti("ne-pavimento", 0, pav, x, h - pav); metti("ne-battiscopa", 0, pav - 10, x, 10);
      dentro.style.width = x + "px";
      return true;
    }
    function vetrina(pz, x, pav, k) {   // mette in vetrina un oggetto (col suo cartellino) e dice dove finisce
      var tipo = pz.tipo === "ogg" ? pz.o.tipo : pz.tipo, m = pz.tipo === "ogg" ? misura(pz.id) : { w: pz.w, h: pz.h };
      var sc = k * (tipo === "acc" ? 1.7 : tipo === "muro" ? 1.35 : tipo === "pavim" ? 1.4 : 1);   // le cose piccole un po' più grandi, come in vetrina
      var w = m.w * sc, hh = m.h * sc, col = Math.max(w, 104), cx = x + col / 2, base, yCart;
      if (tipo === "muro") { base = pav - 120 * k; yCart = base + 8; }
      else if (tipo === "acc") { base = pav - 70 * k; yCart = pav + 14; }
      else if (tipo === "tappeto") { base = pav + 38; yCart = base + 8; }
      else { base = pav + 6; yCart = pav + 20; }
      if (tipo === "acc") { var col2 = el("i", "ne-piedistallo"), pw = Math.max(44, w + 18); col2.style.cssText = "left:" + (cx - pw / 2).toFixed(1) + "px;top:" + (base - 2).toFixed(1) + "px;width:" + pw.toFixed(1) + "px;height:" + (pav - base + 10).toFixed(1) + "px"; dentro.appendChild(col2); }
      else if (tipo !== "muro" && tipo !== "tappeto") { var ped = el("i", "ne-pedana"), dw = w + 22; ped.style.cssText = "left:" + (cx - dw / 2).toFixed(1) + "px;top:" + (base - 6).toFixed(1) + "px;width:" + dw.toFixed(1) + "px"; dentro.appendChild(ped); }
      var im = el("img", "ne-ogg" + (tipo === "pavim" ? " campione" : "")); im.src = pz.img; im.alt = pz.nome; im.draggable = false;
      im.style.cssText = "left:" + (cx - w / 2).toFixed(1) + "px;top:" + (base - hh).toFixed(1) + "px;width:" + w.toFixed(1) + "px;height:" + hh.toFixed(1) + "px";
      var cart = el("button", "ne-cartellino"); cart.style.left = cx.toFixed(1) + "px"; cart.style.top = yCart.toFixed(1) + "px";
      cart.appendChild(el("b", null, pz.nome)); var pr = el("i"); cart.appendChild(pr);
      pz.img0 = im; pz.cart = cart; pz.pr = pr; aggCartellino(pz);
      im.onclick = cart.onclick = function () { apri(pz); };
      dentro.appendChild(im); dentro.appendChild(cart); pezzi.push(pz);
      return x + col;
    }
    function aggCartellino(pz) { var tua = mia(pz); pz.pr.textContent = tua ? "✓ Già tua" : "🪙 " + cifre(pz.prezzo); pz.cart.classList.toggle("tua", tua); }

    // ---- la scheda per comprare (si apre toccando un oggetto o il suo cartellino) ----
    var velo = el("div", "ne-velo"), scheda = el("div", "ne-scheda"), aperto = null;
    velo.onclick = chiudi; s.appendChild(velo); s.appendChild(scheda);
    function chiudi() { aperto = null; velo.classList.remove("su"); scheda.classList.remove("su"); }
    function apri(pz) {
      aperto = pz; while (scheda.firstChild) scheda.removeChild(scheda.firstChild);
      var x = el("button", "ne-x", "✕"); x.onclick = chiudi; scheda.appendChild(x);
      var im = el("img"); im.src = pz.img; im.alt = ""; scheda.appendChild(im);
      scheda.appendChild(el("h3", null, pz.nome));
      if (pz.o && pz.o.frase) { scheda.appendChild(el("span", "ne-speciale", "✨ Speciale")); scheda.appendChild(el("p", "ne-frase", pz.o.frase)); }   // solo gli oggetti speciali
      scheda.appendChild(el("p", null, pz.cosa));
      var nota = el("p", "ne-nota"), b = el("button", "ne-compra"); scheda.appendChild(nota); scheda.appendChild(b);
      function agg() {
        var tua = mia(pz), n = pz.tipo === "ogg" ? nelBaule(pz.id) : 0, manca = pz.prezzo - soldi();
        nota.textContent = tua ? "Ce l'hai già: la trovi nell'Arreda" : n ? "Nel baule di casa ne hai " + n : "";
        b.disabled = tua || manca > 0;
        b.textContent = tua ? "✓ Già tua" : manca > 0 ? "Ti mancano 🪙 " + cifre(manca) : (n ? "Comprane un altro · 🪙 " : "Compra · 🪙 ") + cifre(pz.prezzo);
      }
      b.onclick = function () {
        if (mia(pz) || soldi() < pz.prezzo) return;
        if (opts.spendi) opts.spendi(pz.prezzo); else casa.monete -= pz.prezzo;
        if (pz.tipo === "ogg") casa.baule.push(pz.id); else if (pz.tipo === "carta") casa.carte.push(pz.id); else casa.pavimenti.push(pz.id);
        salva(); suono("compra"); aggMonete(); monete.classList.remove("pulsa"); void monete.offsetWidth; monete.classList.add("pulsa");
        pz.img0.classList.remove("salta"); void pz.img0.offsetWidth; pz.img0.classList.add("salta"); aggCartellino(pz);
        dimmi(pz.tipo === "ogg" ? "Comprato! È nel baule di casa 🧳" : "Comprato! La metti dall'Arreda 🎨");
        agg(); try { if (navigator.vibrate) navigator.vibrate(12); } catch (e) {}
      };
      agg(); velo.classList.add("su"); scheda.classList.add("su"); suono("su");
    }

    // ---- i reparti: si va col tasto, e mentre scorri si accende quello in cui sei ----
    function vaiReparto(id, liscio) {
      var sz = sezioni.filter(function (x) { return x.id === id; })[0]; if (!sz) return;
      try { strada.scrollTo({ left: sz.x - 6, behavior: liscio ? "smooth" : "auto" }); } catch (e) { strada.scrollLeft = sz.x - 6; }
    }
    var tScroll = 0;
    function doveSei() {
      tScroll = 0; var c = strada.scrollLeft + strada.clientWidth * 0.4, id = null;
      sezioni.forEach(function (x) { if (x.x <= c) id = x.id; });
      [].forEach.call(chips.children, function (b) { b.classList.toggle("on", b.dataset.id === id); });
      var on = chips.querySelector(".on"); if (on && on !== chips._ultimo) { chips._ultimo = on; var r = on.offsetLeft - chips.clientWidth / 2 + on.offsetWidth / 2; try { chips.scrollTo({ left: r, behavior: "smooth" }); } catch (e) {} }
    }
    strada.addEventListener("scroll", function () { if (!tScroll) tScroll = requestAnimationFrame(doveSei); }, { passive: true });
    strada.addEventListener("wheel", function (e) { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { strada.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });   // col computer: la rotellina scorre di lato

    s._monta = function () {
      aggMonete();
      (function prova() { if (!document.body.contains(s)) return; if (!costruisci()) return requestAnimationFrame(prova); if (opts.reparto) vaiReparto(opts.reparto); doveSei(); })();
      var lw = 0, lh = 0;
      window.addEventListener("resize", function ridim() {
        if (!document.body.contains(s)) return window.removeEventListener("resize", ridim);
        if (strada.clientWidth === lw && strada.clientHeight === lh) return; lw = strada.clientWidth; lh = strada.clientHeight;
        var quota = strada.scrollLeft / Math.max(1, dentro.scrollWidth); costruisci(); strada.scrollLeft = quota * dentro.scrollWidth;
      });
    };
    return s;
  }

  window.SGCasa = {
    OGG: OGG, CARTE: CARTE, PAVIMENTI: PAVIMENTI, STANZE: STANZE, casaIniziale: casaIniziale,
    P: P, scala: scala, daSchermo: daSchermo, daMuro: daMuro, daParete: daParete, larghezza: larghezza, W: W, H: H, XW: XW, ZB: ZB, YT: YT, ZMIN: ZMIN,
    imgOggetto: imgOggetto, imgMuri: imgMuri, imgPav: imgPav, campioneCarta: campioneCarta, campionePav: campionePav,
    crea: crea,   // la schermata della casa
    negozio: negozio   // il negozio
  };
})();

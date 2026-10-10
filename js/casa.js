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
  ogg("divano_toppa", { nome: "Divano con la toppa", stanza: "soggiorno", tipo: "pav", w: 196, h: 92, prof: 0.85, qual: 0, disegno: function () {
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
  ogg("tv_tubo", { nome: "TV a tubo", stanza: "soggiorno", tipo: "acc", w: 54, h: 78, qual: 0, disegno: function () {
    return svg(54, 78, morbido("a", "#c9bfa8") + lin("s", "#5b6b63", "#2f3a35", true),
      Pth("M27 30 L10 4 M27 30 L44 2", "none", "stroke='#444' stroke-width='1.6'") + C(10, 4, 2, "#888") + C(44, 2, 2, "#888") +   // le antenne a orecchie di coniglio
      R(2, 28, 50, 46, "url(#a)", 7, bordo()) + R(6, 32, 34, 32, "url(#s)", 7, bordo(1.6)) +
      Pth("M10 36 Q18 34 22 40", "none", "stroke='#fff' stroke-width='2' opacity='.35'") +
      C(46, 38, 2.6, "#7d725d", bordo(1)) + C(46, 47, 2.6, "#7d725d", bordo(1)) + R(43, 54, 6, 6, "#7d725d", 1) +
      R(8, 74, 8, 3, "#555") + R(38, 74, 8, 3, "#555"));
  } });
  ogg("sedia_plastica", { nome: "Sedia di plastica", stanza: "soggiorno", tipo: "pav", w: 46, h: 84, prof: 0.45, piano: 44, qual: 0, disegno: function () {
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
  ogg("frigo_ammaccato", { nome: "Frigo ammaccato", stanza: "soggiorno", tipo: "pav", w: 62, h: 146, prof: 0.6, piano: 146, qual: 0, disegno: function () {
    var c = "#ece4c9";
    return svg(62, 146, morbido("a", c),
      R(2, 2, 58, 140, "url(#a)", 8, bordo()) + Pth("M2 52 L60 52", "none", bordo()) +
      R(48, 20, 5, 24, "#bdb49a", 2, bordo(1.2)) + R(48, 62, 5, 30, "#bdb49a", 2, bordo(1.2)) +
      Pth("M14 96 Q20 102 16 110 Q12 104 14 96 Z", tono(c, -0.12)) +   // l'ammaccatura
      C(40, 128, 5, "#b0703a", "opacity='.45'") + C(42, 130, 2, "#8a4d22", "opacity='.5'") +   // un po' di ruggine
      R(12, 70, 10, 10, "#ff6b6b", 2, "transform='rotate(-8 17 75)'") + R(26, 66, 9, 12, "#ffd43b", 2, "transform='rotate(6 30 72)'") +   // le calamite
      R(6, 142, 10, 4, "#555") + R(46, 142, 10, 4, "#555"));
  } });
  ogg("fornello_vecchio", { nome: "Fornello vecchio", stanza: "soggiorno", tipo: "pav", w: 62, h: 90, prof: 0.6, piano: 86, qual: 0, disegno: function () {
    var c = "#d9cfb6";
    return svg(62, 90, morbido("a", c) + morbido("l", "#9b7650"),
      R(2, 30, 58, 58, "url(#l)", 3, bordo()) + R(8, 38, 21, 44, tono("#9b7650", 0.1), 2, bordo(1.4)) + R(33, 38, 21, 44, tono("#9b7650", 0.1), 2, bordo(1.4) + " transform='rotate(3 43 40)'") +
      R(1, 8, 60, 24, "url(#a)", 3, bordo()) + E(17, 8, 11, 3, "#3b3b3b") + E(45, 8, 11, 3, "#3b3b3b") + E(17, 8, 6, 1.6, "#6a6a6a") + E(45, 8, 6, 1.6, "#6a6a6a") +
      C(12, 20, 3, "#555", bordo(1)) + C(24, 20, 3, "#555", bordo(1)) + C(38, 20, 3, "none", "stroke='#555' stroke-width='1.4' stroke-dasharray='2 2'") + C(50, 20, 3, "#555", bordo(1)) +   // una manopola manca
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
  ogg("lampadina", { nome: "Lampadina appesa", stanza: "tutte", tipo: "muro", w: 22, h: 70, alto: true, qual: 0, disegno: function () {
    return svg(22, 70, "<radialGradient id='l'><stop offset='0' stop-color='#fff8d6'/><stop offset='1' stop-color='#ffd76a'/></radialGradient>",
      Pth("M11 0 L11 44", "none", "stroke='#333' stroke-width='1.6'") + R(7, 42, 8, 7, "#666", 1.5, bordo(1.2)) +
      E(11, 57, 8, 10, "url(#l)", bordo(1.4)) + Pth("M8 54 Q11 60 14 54", "none", "stroke='#c9a24a' stroke-width='1'"));
  } });

  // ---- CAMERA, roba di partenza ----
  ogg("letto_semplice", { nome: "Letto di legno semplice", stanza: "camera", tipo: "pav", w: 200, h: 82, prof: 1.0, qual: 0, disegno: function () {
    return svg(200, 82, morbido("l", "#b88b5c") + "<pattern id='q' width='14' height='14' patternUnits='userSpaceOnUse'><rect width='14' height='14' fill='#5d7fa3'/><rect width='7' height='14' fill='#8aa6c4' opacity='.6'/><rect width='14' height='7' fill='#3e5f82' opacity='.4'/></pattern>",
      R(2, 4, 16, 74, "url(#l)", 3, bordo()) +                 // la testiera, una tavola sola
      R(14, 40, 182, 22, "#efe7d4", 6, bordo()) +              // il materasso
      Pth("M20 30 Q40 24 52 32 L52 44 L20 44 Z", "#f6f1e3", bordo(1.6)) +   // il cuscino schiacciato
      Pth("M60 34 Q120 30 190 38 L194 62 L58 62 Z", "url(#q)", bordo()) +  // la coperta a quadri
      R(12, 60, 186, 10, "url(#l)", 2, bordo()) + R(16, 70, 8, 10, tono("#b88b5c", -0.3), 1, bordo(1.4)) + R(184, 70, 8, 10, tono("#b88b5c", -0.3), 1, bordo(1.4)) +
      Pth("M100 64 l10 2", "none", "stroke='#7a5230' stroke-width='1'"));
  } });
  ogg("comodino_cartone", { nome: "Scatola di cartone", stanza: "camera", tipo: "pav", w: 46, h: 44, prof: 0.45, piano: 44, qual: 0, disegno: function () {
    var c = "#c99a62";
    return svg(46, 44, morbido("a", c),
      R(2, 4, 42, 38, "url(#a)", 2, bordo()) + R(18, 4, 10, 38, "#d9c58f", 0, "opacity='.8'") +   // lo scotch
      Pth("M2 4 L8 0 L38 0 L44 4", tono(c, 0.12), bordo(1.6)) +
      "<text x='23' y='32' text-anchor='middle' font-family='Arial Black,Arial' font-size='6' fill='#a33' opacity='.7'>FRAGILE</text>" +
      Pth("M8 14 l4 3 m-1 -4 l3 3", "none", "stroke='#8a5a32' stroke-width='1'"));
  } });
  ogg("armadio_storto", { nome: "Armadio con l'anta storta", stanza: "camera", tipo: "pav", w: 100, h: 186, prof: 0.6, qual: 0, disegno: function () {
    var c = "#a87b52";
    return svg(104, 186, morbido("a", c) + morbido("b", tono(c, 0.08)),
      R(4, 6, 94, 172, "url(#a)", 3, bordo()) + R(2, 2, 98, 8, tono(c, -0.2), 2, bordo()) +
      R(9, 14, 41, 156, "url(#b)", 2, bordo(1.8)) +
      "<g transform='rotate(3 56 20)'>" + R(53, 14, 41, 156, "url(#b)", 2, bordo(1.8)) + "</g>" +   // l'anta storta
      C(44, 90, 2.4, "#e0c070", bordo(1)) + C(62, 92, 2.4, "none", "stroke='#7a5230' stroke-width='1' stroke-dasharray='1.5 1.5'") +   // un pomello manca
      R(8, 178, 10, 8, tono(c, -0.4), 1) + R(84, 178, 10, 8, tono(c, -0.4), 1));
  } });
  ogg("sveglia", { nome: "Sveglia", stanza: "tutte", tipo: "acc", w: 16, h: 18, qual: 0, disegno: function () {
    return svg(16, 18, "",
      C(4, 4, 3, "#c9a24a", bordo(1)) + C(12, 4, 3, "#c9a24a", bordo(1)) + C(8, 10, 6.5, "#e03131", bordo(1.2)) + C(8, 10, 4.8, "#fff8e8") +
      Pth("M8 10 L8 7 M8 10 L10 11", "none", "stroke='#333' stroke-width='1'") + Pth("M4 16 L3 18 M12 16 L13 18", "none", "stroke='#333' stroke-width='1.4'"));
  } });
  ogg("lampada_storta", { nome: "Lampada col paralume storto", stanza: "camera", tipo: "acc", w: 26, h: 44, qual: 0, disegno: function () {
    return svg(28, 44, morbido("p", "#e8d6a8"),
      "<g transform='rotate(-9 14 12)'>" + Pth("M5 18 L9 4 L19 4 L23 18 Z", "url(#p)", bordo(1.4)) + "</g>" + Pth("M14 18 L14 38", "none", "stroke='#7a6a52' stroke-width='2.4'") +
      E(14, 40, 9, 3, "#7a6a52", bordo(1.2)));
  } });
  ogg("poster_strappato", { nome: "Poster strappato", stanza: "camera", tipo: "muro", w: 40, h: 54, qual: 0, disegno: function () {
    return svg(42, 56, lin("c", "#6c5ce7", "#e84393", true),
      Pth("M3 3 L39 3 L39 44 L32 53 L3 53 Z", "url(#c)", bordo(1.4)) + Pth("M39 44 L32 44 L32 53", "#b8a6d9", bordo(1)) +
      C(21, 22, 8, "#ffd43b", "opacity='.85'") + Pth("M10 46 L32 46", "none", "stroke='#fff' stroke-width='3' opacity='.7'") +
      R(1, 1, 7, 4, "#e9e3c9", 0, "opacity='.85' transform='rotate(-20 4 3)'") + R(34, 1, 7, 4, "#e9e3c9", 0, "opacity='.85' transform='rotate(20 37 3)'"));
  } });

  // ---- BAGNO, roba di partenza ----
  ogg("wc_vecchio", { nome: "Gabinetto vecchio", stanza: "bagno", tipo: "pav", w: 44, h: 82, prof: 0.65, qual: 0, disegno: function () {
    var c = "#f1ecd8";
    return svg(48, 82, morbido("a", c),
      R(8, 2, 32, 30, "url(#a)", 4, bordo()) + R(14, 6, 8, 4, "#d9cfa8", 2, bordo(1)) +      // la cassetta col tasto
      Pth("M6 34 L42 34 Q44 48 34 56 L32 74 L16 74 L14 56 Q4 48 6 34 Z", "url(#a)", bordo()) +
      Pth("M4 32 L44 32 L44 37 L4 37 Z", "#e8dfb8", bordo(1.6)) +   // la tavoletta un po' ingiallita
      R(12, 74, 24, 6, tono(c, -0.1), 2, bordo(1.6)) + E(30, 50, 3, 5, "#d9c98a", "opacity='.5'"));
  } });
  ogg("lavandino_colonna", { nome: "Lavandino scheggiato", stanza: "bagno", tipo: "pav", w: 54, h: 88, prof: 0.45, piano: 80, qual: 0, disegno: function () {
    var c = "#f3efe3";
    return svg(56, 88, morbido("a", c),
      Pth("M22 6 L22 2 L32 2 L32 4", "none", "stroke='#9aa' stroke-width='3'") + C(20, 8, 2.4, "#bbb", bordo(1)) + C(34, 8, 2.4, "#bbb", bordo(1)) +
      Pth("M2 10 L54 10 Q54 26 42 28 L14 28 Q2 26 2 10 Z", "url(#a)", bordo()) + Pth("M44 10 l4 3 l3 -3", "#e3dccb", bordo(1)) +   // la scheggiatura
      Pth("M20 28 L36 28 L34 84 L22 84 Z", "url(#a)", bordo()) + R(18, 82, 20, 5, tono(c, -0.1), 2, bordo(1.4)));
  } });
  ogg("specchio_scheggiato", { nome: "Specchio scheggiato", stanza: "bagno", tipo: "muro", w: 40, h: 50, qual: 0, disegno: function () {
    return svg(42, 52, lin("v", "#cfe6ee", "#9fc2cf", true),
      R(2, 2, 38, 48, "#9a8f7a", 3, bordo(1.6)) + R(5, 5, 32, 42, "url(#v)") +
      Pth("M28 5 L24 16 L30 22 L26 34", "none", "stroke='#fff' stroke-width='1.2' opacity='.9'") + Pth("M9 12 L15 9", "none", "stroke='#fff' stroke-width='2' opacity='.6'") +
      Pth("M37 40 L33 47 L37 47 Z", "#9a8f7a"));
  } });
  ogg("doccia_tenda", { nome: "Doccia con la tenda", stanza: "bagno", tipo: "pav", w: 88, h: 200, prof: 0.85, qual: 0, disegno: function () {
    return svg(90, 200, lin("t", "#e8eef0", "#c9d6da"),
      Pth("M4 6 L86 6", "none", "stroke='#9aa4a8' stroke-width='3'") +
      Pth("M6 8 Q14 100 8 186 L46 186 Q42 100 46 8 Z", "url(#t)", bordo(1.6)) + Pth("M46 8 Q50 100 46 186 L84 186 Q88 100 84 8 Z", "url(#t)", bordo(1.6)) +
      Pth("M18 8 Q24 100 18 186 M32 8 Q36 100 32 186 M58 8 Q62 100 58 186 M72 8 Q76 100 72 186", "none", "stroke='#b5c4c9' stroke-width='1.4'") +
      C(20, 150, 4, "#7d8f5a", "opacity='.35'") + C(26, 160, 2.5, "#7d8f5a", "opacity='.35'") + C(66, 172, 3, "#7d8f5a", "opacity='.35'") +   // un po' di muffa
      R(2, 186, 86, 12, "#e9e5da", 2, bordo()));
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
  ogg("divano_velluto", { nome: "Divano di velluto", stanza: "soggiorno", tipo: "pav", w: 204, h: 94, prof: 0.9, qual: 2, prezzo: 1800, disegno: function () {
    var c = "#1f8a8a";
    return svg(204, 94, morbido("a", c) + morbido("b", tono(c, -0.1)) + lin("o", "#f6d77a", "#c9962e", true) + morbido("k", "#f2c14e"),
      R(16, 6, 172, 50, "url(#a)", 22, bordo()) + Pth("M60 10 L60 52 M102 8 L102 52 M144 10 L144 52", "none", "stroke='" + tono(c, -0.25) + "' stroke-width='1.6'") +
      C(40, 30, 2, tono(c, -0.35)) + C(81, 30, 2, tono(c, -0.35)) + C(123, 30, 2, tono(c, -0.35)) + C(164, 30, 2, tono(c, -0.35)) +   // i bottoni capitonné
      R(4, 34, 28, 48, "url(#b)", 14, bordo()) + R(172, 34, 28, 48, "url(#b)", 14, bordo()) +
      R(30, 50, 72, 22, "url(#a)", 8, bordo()) + R(102, 50, 72, 22, "url(#a)", 8, bordo()) +
      Pth("M40 34 Q50 26 62 34 L60 50 L38 50 Z", "url(#k)", bordo(1.6)) + Pth("M142 34 Q154 26 166 34 L164 50 L142 50 Z", "url(#k)", bordo(1.6)) +   // i cuscini gialli
      R(10, 72, 184, 10, tono(c, -0.3), 4, bordo()) + Pth("M22 82 L18 93 M182 82 L186 93", "none", "stroke='url(#o)' stroke-width='5' stroke-linecap='round'") + Pth("M22 82 L18 93 M182 82 L186 93", "none", "stroke='" + LINEA + "' stroke-width='1' opacity='.4'"));
  } });
  ogg("poltrona_gialla", { nome: "Poltrona gialla", stanza: "soggiorno", tipo: "pav", w: 80, h: 92, prof: 0.8, qual: 2, prezzo: 900, disegno: function () {
    var c = "#f2b134";
    return svg(80, 92, morbido("a", c) + morbido("b", tono(c, -0.1)),
      R(12, 4, 56, 54, "url(#a)", 20, bordo()) + R(2, 36, 18, 44, "url(#b)", 9, bordo()) + R(60, 36, 18, 44, "url(#b)", 9, bordo()) +
      R(18, 52, 44, 20, "url(#a)", 7, bordo()) + R(8, 72, 64, 8, tono(c, -0.3), 3, bordo()) +
      Pth("M16 80 L13 91 M64 80 L67 91", "none", "stroke='#5a3a22' stroke-width='4' stroke-linecap='round'"));
  } });
  ogg("tv_piatta", { nome: "TV a schermo piatto", stanza: "soggiorno", tipo: "acc", w: 84, h: 54, qual: 2, prezzo: 1500, disegno: function () {
    return svg(86, 56, lin("s", "#3a4a8a", "#121a3a", true),
      R(2, 2, 82, 46, "#1b1b1f", 3, bordo(1.6)) + R(5, 5, 76, 40, "url(#s)", 1) +
      Pth("M8 8 L30 8 L14 40 L8 40 Z", "#fff", "opacity='.08'") + R(36, 48, 14, 4, "#2b2b30") + R(28, 52, 30, 3, "#2b2b30", 1.5));
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
  ogg("letto_matrimoniale", { nome: "Letto con la trapunta", stanza: "camera", tipo: "pav", w: 204, h: 96, prof: 1.6, qual: 2, prezzo: 2000, disegno: function () {
    return svg(206, 96, morbido("l", "#8a5a3a") + morbido("t", "#e8789a"),
      R(2, 2, 26, 90, "url(#l)", 8, bordo()) + R(176, 40, 26, 52, "url(#l)", 6, bordo()) +
      R(20, 46, 166, 24, "#fbf6ec", 8, bordo()) +
      Pth("M30 26 Q44 18 58 26 Q60 36 56 44 L30 44 Q26 36 30 26 Z", "#fff", bordo(1.6)) + Pth("M34 32 Q48 24 62 32 Q64 42 60 48 L34 48 Q30 40 34 32 Z", "#f6eadb", bordo(1.6)) +
      Pth("M64 40 Q120 30 180 44 L182 70 L62 70 Z", "url(#t)", bordo()) + Pth("M90 42 L90 70 M120 38 L120 70 M150 40 L150 70", "none", "stroke='" + tono("#e8789a", -0.2) + "' stroke-width='1.2' stroke-dasharray='3 3'") +
      R(18, 68, 170, 12, "url(#l)", 3, bordo()));
  } });
  ogg("wc_moderno", { nome: "Gabinetto moderno", stanza: "bagno", tipo: "pav", w: 42, h: 74, prof: 0.6, qual: 2, prezzo: 900, disegno: function () {
    return svg(44, 74, morbido("a", "#ffffff"),
      R(8, 2, 28, 26, "url(#a)", 6, bordo()) + R(18, 6, 8, 3, "#c0c8cc", 1.5) +
      Pth("M4 30 L40 30 Q42 46 32 52 L30 68 L14 68 Q14 60 12 52 Q2 46 4 30 Z", "url(#a)", bordo()) + R(3, 28, 38, 5, "#f4f6f7", 2.5, bordo(1.4)) +
      Pth("M8 34 Q10 44 16 48", "none", "stroke='#fff' stroke-width='2' opacity='.9'"));
  } });
  ogg("specchio_tondo", { nome: "Specchio tondo dorato", stanza: "tutte", tipo: "muro", w: 46, h: 46, qual: 2, prezzo: 600, disegno: function () {
    return svg(48, 48, lin("o", "#f6d77a", "#c9962e", true) + lin("v", "#e3f4f8", "#a9d3df", true),
      C(24, 24, 22, "url(#o)", bordo(1.6)) + C(24, 24, 17, "url(#v)") + Pth("M14 18 Q18 11 25 10", "none", "stroke='#fff' stroke-width='2.4' opacity='.8'"));
  } });

  // =========================================================
  //  PARETI E PAVIMENTI (quello che c'è all'inizio è sciupato; il resto si compra)
  // =========================================================
  var CARTE = {
    sbiadita:   { nome: "Carta sbiadita", base: "#d8c8a2", qual: 0, motivo: function (s) { return "<pattern id='" + s + "' width='34' height='34' patternUnits='userSpaceOnUse'><rect width='34' height='34' fill='#d8c8a2'/><circle cx='8' cy='9' r='3' fill='#c7b183' opacity='.7'/><circle cx='25' cy='26' r='3' fill='#c7b183' opacity='.7'/><path d='M8 12 l0 5 M25 29 l0 5' stroke='#b9a676' stroke-width='1'/></pattern>"; }, macchie: true },
    crepata:    { nome: "Intonaco crepato", base: "#e3d9c2", qual: 0, motivo: function (s) { return "<pattern id='" + s + "' width='60' height='60' patternUnits='userSpaceOnUse'><rect width='60' height='60' fill='#e3d9c2'/><circle cx='12' cy='40' r='1' fill='#cfc3a6'/><circle cx='44' cy='14' r='1.4' fill='#cfc3a6'/></pattern>"; }, crepe: true },
    piastrelle: { nome: "Piastrelle ingiallite", base: "#ece6cf", qual: 0, motivo: function (s) { return "<pattern id='" + s + "' width='18' height='18' patternUnits='userSpaceOnUse'><rect width='18' height='18' fill='#c9c2a4'/><rect x='1' y='1' width='16' height='16' rx='1' fill='#efe9d3'/></pattern>"; }, macchie: true },
    righe:      { nome: "Righe verdi", base: "#d9ead3", qual: 2, prezzo: 600, motivo: function (s) { return "<pattern id='" + s + "' width='24' height='24' patternUnits='userSpaceOnUse'><rect width='24' height='24' fill='#e6f2df'/><rect width='10' height='24' fill='#9ccb8c'/><rect x='11' width='1.5' height='24' fill='#c7e2bc'/></pattern>"; } },
    fiori:      { nome: "Fiori blu", base: "#eef3fb", qual: 2, prezzo: 700, motivo: function (s) { return "<pattern id='" + s + "' width='30' height='30' patternUnits='userSpaceOnUse'><rect width='30' height='30' fill='#f3f6fc'/><g fill='#5b8bd6'><circle cx='8' cy='8' r='2.4'/><circle cx='5' cy='5' r='2'/><circle cx='11' cy='5' r='2'/><circle cx='5' cy='11' r='2'/><circle cx='11' cy='11' r='2'/></g><circle cx='8' cy='8' r='1.6' fill='#ffd43b'/><circle cx='23' cy='23' r='2' fill='#9ab8e8'/></pattern>"; } },
    azzurre:    { nome: "Piastrelle azzurre", base: "#d7eef5", qual: 2, prezzo: 650, motivo: function (s) { return "<pattern id='" + s + "' width='18' height='18' patternUnits='userSpaceOnUse'><rect width='18' height='18' fill='#9fc9d6'/><rect x='1' y='1' width='16' height='16' rx='1.5' fill='#d3ecf3'/><rect x='3' y='3' width='6' height='2' rx='1' fill='#fff' opacity='.6'/></pattern>"; } }
  };
  var PAVIMENTI = {
    laminato:   { nome: "Laminato graffiato", qual: 0, tipo: "assi", c1: "#a4774e", c2: "#946a43", righe: "#7d5735", graffi: true },
    linoleum:   { nome: "Linoleum consumato", qual: 0, tipo: "scacchi", c1: "#d9d2bd", c2: "#a9a28e", righe: "#8f8975", graffi: true },
    parquet:    { nome: "Parquet di rovere", qual: 2, prezzo: 800, tipo: "assi", c1: "#d6a86a", c2: "#c99a5c", righe: "#a8793e" },
    marmo:      { nome: "Marmo bianco", qual: 2, prezzo: 900, tipo: "scacchi", c1: "#f4f2ee", c2: "#e2ded6", righe: "#c9c3b8" }
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
      var cx = lato * 1.25, x0 = cx - 0.55, x1 = cx + 0.55, y0 = 1.0, y1 = 2.15, z = ZB - 0.01, s = "";
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
    if (p.graffi) for (i = 0; i < 9; i++) { var gx = -1.8 + (i * 0.47) % 3.6, gz = 1.4 + (i * 0.83) % 3.4, a = P(gx, 0, gz), b = P(gx + 0.25, 0, gz + 0.05); o.push("<line x1='" + r1(a[0]) + "' y1='" + r1(a[1]) + "' x2='" + r1(b[0]) + "' y2='" + r1(b[1]) + "' stroke='#fff' stroke-width='1' opacity='.35'/>"); }
    // la luce della finestra sul pavimento e l'ombra lungo il muro di fondo
    var lx = (st.finestra === "dx" ? 1 : -1) * 1.25, lc = P(lx, 0, ZB - 1.0);   // la luce della finestra sul pavimento
    o.push("<ellipse cx='" + r1(lc[0]) + "' cy='" + r1(lc[1]) + "' rx='" + r1(1.1 * scala(0, ZB - 1.5)) + "' ry='" + r1(0.5 * scala(0, ZB - 1.5)) + "' fill='url(#luce)'/>");
    o.push(poly([P(-XW, 0, ZB), P(XW, 0, ZB), P(XW, 0, ZB - 0.5), P(-XW, 0, ZB - 0.5)], "url(#ombraMuro)"));
    var defs = "<radialGradient id='luce'><stop offset='0' stop-color='#fff6d0' stop-opacity='.35'/><stop offset='1' stop-color='#fff6d0' stop-opacity='0'/></radialGradient>" +
      "<linearGradient id='ombraMuro' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#000' stop-opacity='.22'/><stop offset='1' stop-color='#000' stop-opacity='0'/></linearGradient>";
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + W + " " + H + "' width='" + W + "' height='" + H + "'><defs>" + defs + "</defs>" + o.join("") + "</svg>";
  }

  var cacheImg = {};
  function datauri(s) { return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(s); }
  function imgOggetto(t) { var d = OGG[t]; if (!d) return ""; if (!cacheImg[t]) cacheImg[t] = datauri(d.disegno()); return cacheImg[t]; }
  function imgMuri(st, carta) { var k = "m|" + st.id + "|" + carta; if (!cacheImg[k]) cacheImg[k] = datauri(disegnoMuri(st, carta)); return cacheImg[k]; }
  function imgPav(st, pav) { var k = "p|" + st.id + "|" + pav; if (!cacheImg[k]) cacheImg[k] = datauri(disegnoPavimento(st, pav)); return cacheImg[k]; }
  function campioneCarta(id) { var c = CARTE[id]; return datauri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='60' height='60'><defs>" + c.motivo("m") + "</defs><rect width='60' height='60' fill='url(#m)'/></svg>"); }
  function campionePav(id) { var p = PAVIMENTI[id]; var s = "<rect width='60' height='60' fill='" + p.c1 + "'/>"; for (var i = 0; i < 6; i++) s += p.tipo === "assi" ? (i % 2 ? "<rect x='" + i * 10 + "' width='10' height='60' fill='" + p.c2 + "'/>" : "") + "<line x1='" + i * 10 + "' y1='0' x2='" + i * 10 + "' y2='60' stroke='" + p.righe + "'/>" : ""; if (p.tipo !== "assi") for (var a = 0; a < 4; a++) for (var b = 0; b < 4; b++) if ((a + b) % 2) s += "<rect x='" + a * 15 + "' y='" + b * 15 + "' width='15' height='15' fill='" + p.c2 + "'/>"; return datauri("<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 60 60' width='60' height='60'>" + s + "</svg>"); }

  // misure del disegno di un oggetto (dal suo viewBox, in centimetri)
  var misure = {};
  function misura(t) {
    if (!misure[t]) { var s = OGG[t] ? (cacheImg["s|" + t] || (cacheImg["s|" + t] = OGG[t].disegno())) : ""; var m = /viewBox='0 0 ([\d.]+) ([\d.]+)'/.exec(s); misure[t] = m ? { w: +m[1], h: +m[2] } : { w: 50, h: 50 }; }
    return misure[t];
  }

  // =========================================================
  //  LA SCHERMATA DELLA CASA
  //  opts: { avatar, nome, dati (la casa salvata o null), salva(dati), indietro(), audio() }
  // =========================================================
  function crea(opts) {
    var casa = opts.dati && opts.dati.v ? opts.dati : casaIniziale();
    var stanzaId = "soggiorno", arreda = false, sel = null, palcoS = 1, avTimer = null, avAnim = null;
    function el(tag, cls, testo) { var e = document.createElement(tag); if (cls) e.className = cls; if (testo != null) e.textContent = testo; return e; }
    function cifre(n) { return String(Math.round(n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, "."); }
    var tSalva = null;
    function salva() { clearTimeout(tSalva); tSalva = setTimeout(function () { if (opts.salva) opts.salva(casa); }, 400); }

    // ---- i suoni (corti, fatti al volo: niente file) ----
    function suono(tipo) {
      var ctx = opts.audio && opts.audio(); if (!ctx) return;
      try {
        var t0 = ctx.currentTime, note = {
          su: [[520, 0, .07, "triangle", .07], [780, .04, .08, "triangle", .06]],
          giu: [[150, 0, .12, "sine", .2], [900, 0, .03, "square", .03]],
          clink: [[1500, 0, .09, "triangle", .07], [2200, .05, .12, "triangle", .05]],
          baule: [[600, 0, .08, "sine", .08], [300, .06, .14, "sine", .08]],
          carta: [[300, 0, .3, "sawtooth", .025], [600, .08, .25, "sawtooth", .02]],
          compra: [[988, 0, .1, "triangle", .08], [1319, .08, .1, "triangle", .08], [1760, .16, .22, "triangle", .08]],
          gira: [[700, 0, .06, "triangle", .06], [500, .05, .08, "triangle", .05]]
        }[tipo] || [];
        note.forEach(function (n) {
          var o = ctx.createOscillator(), g = ctx.createGain(), a = t0 + n[1];
          o.type = n[3]; o.frequency.setValueAtTime(n[0], a); if (tipo === "giu") o.frequency.exponentialRampToValueAtTime(70, a + n[2]);
          g.gain.setValueAtTime(0.0001, a); g.gain.exponentialRampToValueAtTime(n[4], a + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, a + n[2]);
          o.connect(g); g.connect(ctx.destination); o.start(a); o.stop(a + n[2] + 0.05);
        });
      } catch (e) {}
    }

    // ---- la struttura ----
    var s = el("div", "schermata casa-vista");
    var scena = el("div", "ca-scena"), palco = el("div", "ca-palco");
    var pavA = el("img", "ca-strato"), pavB = el("img", "ca-strato ca-nuovo"), muriA = el("img", "ca-strato"), muriB = el("img", "ca-strato ca-nuovo");
    [pavA, pavB, muriA, muriB].forEach(function (i) { i.alt = ""; i.draggable = false; });
    var strato = el("div", "ca-oggetti");
    palco.appendChild(pavA); palco.appendChild(pavB); palco.appendChild(muriA); palco.appendChild(muriB); palco.appendChild(strato);
    scena.appendChild(palco); s.appendChild(scena);
    var testa = el("div", "ca-testa"), indietro = el("button", "ca-indietro", "‹"), titolo = el("div", "ca-titolo"), monete = el("div", "ca-monete");
    indietro.onclick = function () { if (arreda) return esciArreda(); fermaAvatar(); if (opts.indietro) opts.indietro(); };
    testa.appendChild(indietro); testa.appendChild(titolo); testa.appendChild(monete); s.appendChild(testa);
    var giu = el("div", "ca-giu"), tabs = el("div", "ca-stanze"), bArreda = el("button", "ca-arreda", "✏️ Arreda");
    STANZE.forEach(function (st) { var b = el("button", "ca-tab", st.nome); b.onclick = function () { if (st.id !== stanzaId) vaiStanza(st.id); }; b.dataset.id = st.id; tabs.appendChild(b); });
    bArreda.onclick = function () { if (arreda) esciArreda(); else entraArreda(); };
    giu.appendChild(tabs); giu.appendChild(bArreda); s.appendChild(giu);
    var cassetto = el("div", "ca-cassetto"), cTabs = el("div", "ca-ctabs"), cLista = el("div", "ca-clista");
    var schede = [["baule", "🧳 Baule"], ["pareti", "🖼️ Pareti"], ["pavimenti", "🟫 Pavimento"], ["negozio", "🛍️ Negozio"]], scheda = "baule";
    schede.forEach(function (sc) { var b = el("button", "ca-ctab", sc[1]); b.dataset.id = sc[0]; b.onclick = function () { scheda = sc[0]; disegnaCassetto(); }; cTabs.appendChild(b); });
    var fatto = el("button", "ca-fatto", "✓ Fatto"); fatto.onclick = esciArreda;
    var cTesta = el("div", "ca-ctesta"); cTesta.appendChild(cTabs); cTesta.appendChild(fatto);
    cassetto.appendChild(cTesta); cassetto.appendChild(cLista); s.appendChild(cassetto);
    var tool = el("div", "ca-tool"), tGira = el("button", null, "↔️"), tVia = el("button", null, "📦");
    tGira.title = "Gira"; tVia.title = "Metti nel baule";
    tool.appendChild(tGira); tool.appendChild(tVia); palco.appendChild(tool);
    var avviso = el("div", "ca-avviso"); s.appendChild(avviso);
    function dimmi(t) { avviso.textContent = t; avviso.classList.remove("su"); void avviso.offsetWidth; avviso.classList.add("su"); }

    function stanza() { return casa.stanze[stanzaId]; }
    function datiStanza() { return STANZE.filter(function (x) { return x.id === stanzaId; })[0]; }
    function aggMonete() { monete.textContent = "🪙 " + cifre(casa.monete) + " · prova"; }

    // ---- il palco 360×640 steso sullo schermo (largo quanto lo schermo, la stanza in alto) ----
    function stendi() {
      var cw = scena.clientWidth, ch = scena.clientHeight; if (!cw || !ch) return false;
      palcoS = Math.max(cw / W, ch / H);
      palco.style.transform = "translate(" + ((cw - W * palcoS) / 2).toFixed(1) + "px," + ((ch - H * palcoS) * 0.35).toFixed(1) + "px) scale(" + palcoS.toFixed(4) + ")";
      return true;
    }
    function puntoPalco(e) { var r = palco.getBoundingClientRect(), k = r.width / W; return { x: (e.clientX - r.left) / k, y: (e.clientY - r.top) / k }; }   // (anche con la stanza rimpicciolita dell'Arreda)

    // ---- dove sta un oggetto sullo schermo ----
    function geo(d) {
      var o = OGG[d.t], m = misura(d.t), wM = m.w / 100, hM = m.h / 100, a, k, w, h;
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
        n = el("div", "ca-ogg"); n.dataset.t = d.t; var im = el("img"); im.alt = ""; im.draggable = false; im.src = imgOggetto(d.t); n.appendChild(im); n._img = im;
        n.addEventListener("pointerdown", function (e) { tocco(e, d); });
        nodi[d.u] = n; strato.appendChild(n);
      }
      return n;
    }
    function posa(d) {
      var n = nodo(d), g = geo(d);
      n.style.left = g.l.toFixed(1) + "px"; n.style.top = g.t.toFixed(1) + "px"; n.style.width = g.w.toFixed(1) + "px"; n.style.height = g.h.toFixed(1) + "px"; n.style.zIndex = g.zi;
      n._img.style.transform = d.flip ? "scaleX(-1)" : "";
      n.classList.toggle("tappeto", OGG[d.t].tipo === "tappeto"); n.classList.toggle("muro", OGG[d.t].tipo === "muro");
    }
    function disegnaStanza() {
      var st = datiStanza(), sz = stanza();
      Object.keys(nodi).forEach(function (u) { if (nodi[u].parentNode) nodi[u].parentNode.removeChild(nodi[u]); }); nodi = {};
      muriA.src = imgMuri(st, sz.carta); pavA.src = imgPav(st, sz.pav);
      sz.oggetti.forEach(posa);
      titolo.textContent = st.nome;
      [].forEach.call(tabs.children, function (b) { b.classList.toggle("on", b.dataset.id === stanzaId); });
      if (av) { strato.appendChild(av); avPos.x = 0.3; avPos.z = 3.0; posaAv(); }
      deseleziona();
    }
    function vaiStanza(id) {
      palco.classList.add("cambia");
      setTimeout(function () { stanzaId = id; disegnaStanza(); palco.classList.remove("cambia"); if (arreda) disegnaCassetto(); }, 180);
    }

    // ---- l'avatar che gira per casa (solo transform-free: un elemento solo) ----
    var av = null, avPos = { x: 0.3, z: 3.0 }, avDir = 1;
    if (opts.avatar && window.SGOmino) {
      av = el("div", "ca-av"); var avImg = el("img"); avImg.alt = ""; avImg.draggable = false;
      avImg.src = datauri(SGOmino.svg(opts.avatar, {})); av.appendChild(avImg); av._img = avImg;
      av.addEventListener("pointerdown", function () { if (arreda) return; av.classList.remove("saluta"); void av.offsetWidth; av.classList.add("saluta"); suono("su"); });
    }
    function posaAv() {
      if (!av) return;
      var a = P(avPos.x, 0, avPos.z), k = scala(0, avPos.z), h = 1.5 * k * 264 / 230, w = h * 200 / 264;   // alto circa un metro e mezzo
      av.style.left = (a[0] - w / 2).toFixed(1) + "px"; av.style.top = (a[1] - h * 0.96).toFixed(1) + "px"; av.style.width = w.toFixed(1) + "px"; av.style.height = h.toFixed(1) + "px";
      av.style.zIndex = 100 + Math.round((ZB - avPos.z) * 100);
      av.style.transform = avDir < 0 ? "scaleX(-1)" : "";   // girato verso dove cammina (l'immagine dentro fa i passi)
    }
    function passeggia() {
      if (!av || arreda || !document.body.contains(s)) return;
      var da = { x: avPos.x, z: avPos.z }, a = { x: -1.7 + Math.random() * 3.4, z: ZMIN + 0.4 + Math.random() * (ZB - 0.6 - ZMIN - 0.4) }, t0 = performance.now();
      var dist = Math.sqrt(Math.pow(a.x - da.x, 2) + Math.pow(a.z - da.z, 2)), dur = Math.max(900, dist * 1100);
      avDir = a.x >= da.x ? 1 : -1; av.classList.add("cammina");
      (function passo(t) {
        if (!document.body.contains(s) || arreda) { av.classList.remove("cammina"); return; }
        var p = Math.min(1, (t - t0) / dur), e = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        avPos.x = da.x + (a.x - da.x) * e; avPos.z = da.z + (a.z - da.z) * e; posaAv();
        if (p < 1) avAnim = requestAnimationFrame(passo); else { av.classList.remove("cammina"); avTimer = setTimeout(passeggia, 2500 + Math.random() * 3500); }
      })(t0);
    }
    function fermaAvatar() { clearTimeout(avTimer); cancelAnimationFrame(avAnim); if (av) av.classList.remove("cammina"); }

    // ---- toccare e trascinare ----
    var drag = null;
    function figliDi(d) { return stanza().oggetti.filter(function (x) { return x.su === d.u; }); }
    function deseleziona() { sel = null; tool.classList.remove("su"); [].forEach.call(strato.children, function (n) { n.classList.remove("scelto"); }); }
    function seleziona(d) {
      deseleziona(); sel = d; var n = nodi[d.u]; if (!n) return; n.classList.add("scelto");
      var g = geo(d); tool.style.left = g.ax.toFixed(1) + "px"; tool.style.top = Math.max(18, g.t - 8).toFixed(1) + "px"; tool.classList.add("su");
    }
    tGira.onclick = function () { if (!sel) return; sel.flip = !sel.flip; var n = nodi[sel.u]; posa(sel); n.classList.remove("rimbalza"); void n.offsetWidth; n.classList.add("rimbalza"); suono("gira"); salva(); };
    tVia.onclick = function () { if (!sel) return; metiVia(sel); };
    function metiVia(d) {
      var lista = [d].concat(figliDi(d)), sz = stanza();
      lista.forEach(function (x) {
        var n = nodi[x.u]; if (n) { n.classList.add("via"); (function (n) { setTimeout(function () { if (n.parentNode) n.parentNode.removeChild(n); }, 320); })(n); delete nodi[x.u]; }
        sz.oggetti = sz.oggetti.filter(function (y) { return y !== x; }); casa.baule.push(x.t);
      });
      deseleziona(); suono("baule"); dimmi("Messo nel baule 🧳"); salva(); if (arreda) disegnaCassetto();
      var tb = cTabs.querySelector("[data-id='baule']"); if (tb) { tb.classList.remove("pulsa"); void tb.offsetWidth; tb.classList.add("pulsa"); }
    }
    function tocco(e, d) {
      if (!arreda) { var n0 = nodi[d.u]; n0.classList.remove("rimbalza"); void n0.offsetWidth; n0.classList.add("rimbalza"); return; }
      e.preventDefault(); e.stopPropagation();
      var p = puntoPalco(e), g = geo(d);
      drag = { d: d, id: e.pointerId, sx: p.x, sy: p.y, ox: p.x - g.ax, oy: p.y - g.ay, mosso: false, vx: 0, ult: p, figli: figliDi(d).map(function (f) { return { f: f, dx: f.x - d.x }; }), su0: d.su };
      try { palco.setPointerCapture(e.pointerId); } catch (er) {}
    }
    function sopraUnMobile(d, ax, ay) {   // un oggetto piccolo appoggiato sopra un mobile col ripiano?
      var trovato = null;
      stanza().oggetti.forEach(function (m) {
        var o = OGG[m.t]; if (!o.piano || m === d || OGG[m.t].tipo !== "pav") return;
        var yP = o.piano / 100, a = P(m.x, yP, m.z), w = misura(m.t).w / 100 * scala(yP, m.z);
        if (ax > a[0] - w / 2 && ax < a[0] + w / 2 && ay > a[1] - 30 && ay < a[1] + 16) { if (!trovato || m.z < trovato.z) trovato = m; }
      });
      return trovato;
    }
    function muovi(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var p = puntoPalco(e), d = drag.d, o = OGG[d.t];
      if (!drag.mosso) { if (Math.abs(p.x - drag.sx) + Math.abs(p.y - drag.sy) < 6) return; drag.mosso = true; deseleziona(); nodi[d.u].classList.add("su"); suono("su"); try { if (navigator.vibrate) navigator.vibrate(8); } catch (er) {} }
      drag.vx = drag.vx * 0.7 + (p.x - drag.ult.x) * 0.3; drag.ult = p;
      var ax = p.x - drag.ox, ay = p.y - drag.oy, m = misura(d.t), wM = m.w / 100, hM = m.h / 100, f;
      if (o.tipo === "muro") {
        f = daMuro(ax, ay);
        d.x = Math.max(-XW + wM / 2, Math.min(XW - wM / 2, f.x)); d.y = Math.max(hM / 2 + 0.2, Math.min(YT - hM / 2 - 0.04, f.y));
      } else {
        var mob = o.tipo === "acc" ? sopraUnMobile(d, p.x, p.y) : null;
        if (drag.bersaglio && drag.bersaglio !== mob && nodi[drag.bersaglio.u]) nodi[drag.bersaglio.u].classList.remove("bersaglio");
        if (mob && nodi[mob.u]) nodi[mob.u].classList.add("bersaglio"); drag.bersaglio = mob;   // il mobile su cui si appoggia si illumina
        if (mob) {
          var yP = OGG[mob.t].piano / 100, wm = misura(mob.t).w / 100, ks = scala(yP, mob.z), aa = P(mob.x, yP, mob.z);
          d.su = mob.u; d.y = yP; d.z = mob.z - 0.01; d.x = Math.max(mob.x - wm / 2 + wM / 2, Math.min(mob.x + wm / 2 - wM / 2, mob.x + (ax - aa[0]) / ks));
        } else {
          f = daSchermo(ax, ay, 0); d.su = null; d.y = 0;
          if (f) { var pr = (o.prof || 0.3) / 2; d.x = Math.max(-XW + wM / 2, Math.min(XW - wM / 2, f.x)); d.z = Math.max(ZMIN, Math.min(ZB - pr, f.z)); }
        }
      }
      posa(d);
      drag.figli.forEach(function (c) { c.f.x = d.x + c.dx; c.f.z = d.z - 0.01; posa(c.f); });
      var n = nodi[d.u]; n.style.zIndex = 900;   // mentre lo porti sta davanti a tutto
      n._img.style.transform = (d.flip ? "scaleX(-1) " : "") + "rotate(" + Math.max(-10, Math.min(10, drag.vx * 1.6)).toFixed(1) + "deg)";
      var sopraCassetto = cassetto.classList.contains("su") && e.clientY > cassetto.getBoundingClientRect().top;
      cassetto.classList.toggle("bersaglio", sopraCassetto); drag.via = sopraCassetto;
    }
    function lascia(e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag.d, n = nodi[d.u], era = drag; drag = null; cassetto.classList.remove("bersaglio");
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
    palco.addEventListener("pointermove", muovi);
    palco.addEventListener("pointerup", lascia); palco.addEventListener("pointercancel", lascia);
    palco.addEventListener("pointerdown", function (e) { if (arreda && !e.target.closest(".ca-ogg") && !e.target.closest(".ca-tool")) deseleziona(); });
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
      arreda = true; s.classList.add("arreda"); fermaAvatar(); cassetto.classList.add("su"); bArreda.textContent = "✓ Fatto";
      disegnaCassetto(); dimmi("Trascina i mobili dove vuoi ✨");
    }
    function esciArreda() {
      arreda = false; s.classList.remove("arreda"); deseleziona(); cassetto.classList.remove("su"); bArreda.textContent = "✏️ Arreda";
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
    function compra(tipo, id, prezzo) {
      if (casa.monete < prezzo) { dimmi("Non hai abbastanza monete 🪙"); return; }
      casa.monete -= prezzo; aggMonete(); monete.classList.remove("pulsa"); void monete.offsetWidth; monete.classList.add("pulsa");
      if (tipo === "ogg") casa.baule.push(id); else if (tipo === "carta") casa.carte.push(id); else casa.pavimenti.push(id);
      suono("compra"); dimmi(tipo === "ogg" ? "Comprato! È nel baule 🧳" : "Comprato! Lo trovi in " + (tipo === "carta" ? "Pareti" : "Pavimento")); salva(); disegnaCassetto();
      var tb = cTabs.querySelector("[data-id='" + (tipo === "ogg" ? "baule" : tipo === "carta" ? "pareti" : "pavimenti") + "']"); if (tb) { tb.classList.remove("pulsa"); void tb.offsetWidth; tb.classList.add("pulsa"); }
    }

    // ---- partenza ----
    s._monta = function () {
      (function prova() { if (!document.body.contains(s)) return; if (!stendi()) return requestAnimationFrame(prova); })();
      disegnaStanza(); aggMonete(); if (av) { posaAv(); avTimer = setTimeout(passeggia, 1200); }
      window.addEventListener("resize", function ridim() { if (!document.body.contains(s)) return window.removeEventListener("resize", ridim); stendi(); });
    };
    return s;
  }

  window.SGCasa = {
    OGG: OGG, CARTE: CARTE, PAVIMENTI: PAVIMENTI, STANZE: STANZE, casaIniziale: casaIniziale,
    P: P, scala: scala, daSchermo: daSchermo, daMuro: daMuro, W: W, H: H, XW: XW, ZB: ZB, YT: YT, ZMIN: ZMIN,
    imgOggetto: imgOggetto, imgMuri: imgMuri, imgPav: imgPav, campioneCarta: campioneCarta, campionePav: campionePav,
    crea: crea   // la schermata della casa
  };
})();

/* =========================================================
   SPeeD GAME — QUADRI, SPECCHI, MENSOLE E LUCI DA MURO (casa vista dall'alto, come il bagno di js/mobili-arte.js)
   Tutte cose "parete": disegno piatto, di fronte, in un pezzo di muro largo 62 e alto 200 (y = 0 il soffitto,
   y = 200 il pavimento); quelle larghe (mappa, insegna, lucine) stanno su due pezzi vicini: 124 × 200, fp [2, 1].
   Sono gli stessi oggetti della casa vista di lato (casa.js): stessi nomi, prezzi e colori, ma curati come roba bella.
   Le cose che fanno luce hanno luce: [x, y, raggio, colore]; con { notte: true } si disegnano accese.
   Si aggiunge a SGMobiliArte con SGMobiliArte.aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte) return;

  // ---------- attrezzi (come nel bagno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; NOTTE = luci accese
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 100) / 100; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(o) { return "opacity='" + f2(o) + "'"; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f2(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f2(rx) + "' ry='" + f2(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f1(x) + "' y='" + f1(y) + "' width='" + f1(w) + "' height='" + f1(h) + "'" + (r ? " rx='" + f1(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + f2(w || 2.4) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f2(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function chiuso(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function aperto(a) { return "M" + a.map(function (x) { return q(x); }).join(" L"); }
  function sp(dx, dy) { return "transform='translate(" + f1(dx) + " " + f1(dy) + ")'"; }
  function gira(a, x, y) { return "transform='rotate(" + f1(a) + " " + f1(x) + " " + f1(y) + ")'"; }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  // sfumature e ritagli (gli id col prefisso del disegno; quelle "sul posto" hanno anche un numero, perché cambiano a ogni forma)
  function sfum(tag, nome, stops, a) {
    var id = p + nome;
    if (!FATTI[id]) {
      FATTI[id] = 1;
      DEFS.push("<" + tag + " id='" + id + "' " + a + ">" + stops.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join("") + "</" + tag + ">");
    }
    return "url(#" + id + ")";
  }
  function lin(nome, stops, x1, y1, x2, y2, user) { return sfum("linearGradient", user ? nome + (++nC) : nome, stops, "x1='" + f2(x1) + "' y1='" + f2(y1) + "' x2='" + f2(x2) + "' y2='" + f2(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function rad(nome, stops, cx, cy, r, user) { return sfum("radialGradient", user ? nome + (++nC) : nome, stops, "cx='" + f2(cx) + "' cy='" + f2(cy) + "' r='" + f2(r) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function dentro(forma, corpo, pari) {   // corpo ritagliato dentro la forma (un tracciato "d"); pari = la forma ha dei buchi
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'" + (pari ? " clip-rule='evenodd'" : "") + "/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  // le forme come tracciati (per ritagli e ombre)
  function rettD(x, y, w, h, r) {
    if (!r) return "M" + q(x, y) + " H" + f1(x + w) + " V" + f1(y + h) + " H" + f1(x) + " Z";
    return "M" + q(x + r, y) + " H" + f1(x + w - r) + " Q" + q(x + w, y) + " " + q(x + w, y + r) + " V" + f1(y + h - r) + " Q" + q(x + w, y + h) + " " + q(x + w - r, y + h) + " H" + f1(x + r) + " Q" + q(x, y + h) + " " + q(x, y + h - r) + " V" + f1(y + r) + " Q" + q(x, y) + " " + q(x + r, y) + " Z";
  }
  function ellD(x, y, rx, ry) { return "M" + q(x - rx, y) + " A" + f2(rx) + "," + f2(ry) + " 0 1,0 " + q(x + rx, y) + " A" + f2(rx) + "," + f2(ry) + " 0 1,0 " + q(x - rx, y) + " Z"; }
  function cerD(x, y, r) { return ellD(x, y, r, r); }
  function arco(x, y, r, a0, a1) {   // un pezzo di cerchio (gradi, 0 = a destra, in senso orario)
    var t0 = a0 * Math.PI / 180, t1 = a1 * Math.PI / 180;
    return "M" + q(x + Math.cos(t0) * r, y + Math.sin(t0) * r) + " A" + f2(r) + "," + f2(r) + " 0 " + (Math.abs(a1 - a0) > 180 ? 1 : 0) + ",1 " + q(x + Math.cos(t1) * r, y + Math.sin(t1) * r);
  }
  // l'ombra sul muro: la stessa forma spostata in basso a destra (la luce viene da in alto a sinistra), in due velature morbide
  function ombraD(d, dx, dy, k) {
    k = k == null ? 1 : k;
    return pth(d, "#000", op(.06 * k) + " " + sp(dx * 1.7, dy * 1.7)) + pth(d, "#000", op(.12 * k) + " " + sp(dx, dy));
  }
  function scintilla(x, y, r, c, k) {   // il luccichio a stella (vetro, cristallo, oro)
    var a = r * .2;
    return pth("M" + q(x, y - r) + " Q" + q(x + a, y - a) + " " + q(x + r, y) + " Q" + q(x + a, y + a) + " " + q(x, y + r) + " Q" + q(x - a, y + a) + " " + q(x - r, y) + " Q" + q(x - a, y - a) + " " + q(x, y - r) + " Z", c || "#ffffff", op(k == null ? .95 : k));
  }
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];      // il cromo
  var ORO = [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]];                         // l'ottone
  function vite(x, y, r) { return cer(x, y, r, lin("vt", CROMO, 0, 0, 1, 1), bordo(L, .45)) + tratto("M" + q(x - r * .55, y + r * .25) + " L" + q(x + r * .55, y - r * .25), "#5b6870", .35); }   // una vite cromata
  function chiodo(x, y) { return cer(x + .6, y + .8, 1.1, "#000", op(.18)) + cer(x, y, 1.1, rad("ch", [[0, "#ffffff"], [.5, "#b9c2c8"], [1, "#5b6870"]], .35, .3, .8), bordo(L, .45)); }

  // ---------- le cornici dei quadri ----------
  // i colori del listello: [luce, medio, ombra, buio]
  var C_ORO = ["#fff3c2", "#f0c548", "#b8861f", "#7a5410"], C_NOCE = ["#b98456", "#7c4b2a", "#56321a", "#36200f"], C_NERO = ["#8a8f98", "#3a3d44", "#1f2125", "#0d0e10"];
  var C_BIANCO = ["#ffffff", "#f3f5f7", "#d3dade", "#aeb8bf"], C_ARGENTO = ["#ffffff", "#dde3e7", "#9ba7af", "#66717a"];
  // quattro listelli tagliati a 45°: sopra e a sinistra alla luce, sotto e a destra in ombra; dentro il listello è bombato (la riga di luce)
  // o = { perle: la fila di perline sul bordo di dentro, angoli: le rosette agli angoli, vena: le venature del legno, filo: il filetto d'oro dentro }
  function cornice(x, y, w, h, t, k, o) {
    o = o || {};
    var X = x + w, Y = y + h, a = x + t, b = y + t, A = X - t, B = Y - t, s = "";
    var luce = [[0, k[1]], [.3, k[0]], [.62, k[1]], [1, k[2]]], ombr = [[0, k[2]], [.3, k[1]], [.62, k[2]], [1, k[3]]];
    var su = [[x, y], [X, y], [A, b], [a, b]], sx = [[x, y], [a, b], [a, B], [x, Y]], dx = [[X, y], [X, Y], [A, B], [A, b]], gi = [[x, Y], [a, B], [A, B], [X, Y]];
    s += poly(su, lin("cs", luce, 0, y, 0, b, true)) + poly(sx, lin("cl", luce, x, 0, a, 0, true)) + poly(dx, lin("cr", ombr, X, 0, A, 0, true)) + poly(gi, lin("cg", ombr, 0, Y, 0, B, true));
    if (o.vena) {   // le venature: righe sottili lungo ogni listello
      var r = rnd(o.vena), v = "", i;
      for (i = 0; i < 4; i++) {
        var f = .2 + i * .2 + r() * .06, ln = "M" + q(x + t * f, y + t * f) + " L" + q(X - t * f, y + t * f) + " M" + q(x + t * f, y + t * f) + " L" + q(x + t * f, Y - t * f) + " M" + q(X - t * f, y + t * f) + " L" + q(X - t * f, Y - t * f) + " M" + q(x + t * f, Y - t * f) + " L" + q(X - t * f, Y - t * f);
        v += tratto(ln, i % 2 ? k[3] : k[0], .25, op(.35));
      }
      s += v;
    }
    s += tratto("M" + q(x, y) + " L" + q(a, b) + " M" + q(X, y) + " L" + q(A, b) + " M" + q(x, Y) + " L" + q(a, B) + " M" + q(X, Y) + " L" + q(A, B), k[3], .35, op(.55));   // i tagli a 45°
    if (o.perle) {   // la fila di perline (un tratteggio di puntini, un po' in rilievo)
      var e = t * .26, d = rettD(a - e, b - e, A - a + 2 * e, B - b + 2 * e, 0);
      s += pth(d, "none", "stroke='" + k[3] + "' stroke-width='" + f2(t * .19) + "' stroke-dasharray='0 " + f2(t * .3) + "' stroke-linecap='round' " + sp(.2, .25)) +
        pth(d, "none", "stroke='" + k[0] + "' stroke-width='" + f2(t * .19) + "' stroke-dasharray='0 " + f2(t * .3) + "' stroke-linecap='round'");
    }
    if (o.angoli) [[x, y], [X, y], [x, Y], [X, Y]].forEach(function (c, i) {   // le rosette agli angoli
      var cx = c[0] + (i % 2 ? -1 : 1) * t * .5, cy = c[1] + (i < 2 ? 1 : -1) * t * .5;
      s += cer(cx, cy, t * .36, i === 0 ? k[0] : k[1], bordo(k[3], .3)) + cer(cx - t * .08, cy - t * .08, t * .14, "#ffffff", op(.75));
    });
    if (o.filo) s += rett(a - .7, b - .7, A - a + 1.4, B - b + 1.4, 0, "none", "stroke='" + o.filo + "' stroke-width='.7'");   // il filetto
    s += rett(a, b, A - a, B - b, 0, "none", "stroke='" + k[3] + "' stroke-width='.6'");
    return s + rett(x, y, w, h, .6, "none", bordo(L, 1.5));
  }
  // la luce che la cornice toglie alla tela in alto a sinistra, e la vernice lucida
  function velature(a, b, W, H, k) {
    return tratto("M" + q(a, b + H) + " L" + q(a, b) + " L" + q(a + W, b), "#000", 1.6, op(.2)) + poly([[a, b], [a + W * .4, b], [a, b + H * .62]], "#ffffff", op((k || 1) * .1)) + poly([[a + W * .46, b], [a + W * .52, b], [a, b + H * .92], [a, b + H * .8]], "#ffffff", op((k || 1) * .07));
  }

  // ---------- le scritte: lettere a tratti alte 10 (per il neon e i poster) ----------
  var LETTERE = {
    B: ["M0,10 V0 H3.6 Q6,0 6,2.45 Q6,4.9 3.6,4.9 H0 M3.6,4.9 H3.9 Q6.6,4.9 6.6,7.45 Q6.6,10 3.9,10 H0", 6.6],
    A: ["M0,10 L3.2,0 L6.4,10 M1.1,6.6 H5.3", 6.4],
    R: ["M0,10 V0 H3.8 Q6.4,0 6.4,2.6 Q6.4,5.2 3.8,5.2 H0 M3.4,5.2 L6.4,10", 6.4],
    O: ["M3.2,0 C7.5,0 7.5,10 3.2,10 C-1.1,10 -1.1,0 3.2,0 Z", 6.4],
    C: ["M6.2,1.8 C5.4,.5 4.4,0 3.3,0 C-1,0 -1,10 3.3,10 C4.4,10 5.4,9.5 6.2,8.2", 6.2],
    K: ["M0,0 V10 M6.2,0 L.4,6.2 M2.3,4.2 L6.4,10", 6.4],
    "!": ["M1,0 V6.6 M1,9.7 V9.8", 2]
  };
  function trasla(d, dx, dy, k) {   // un tracciato spostato e ingrandito
    return d.replace(/([MLHVQCZ])([^MLHVQCZ]*)/g, function (_, c, nn) {
      var v = nn.trim() ? nn.trim().split(/[\s,]+/).map(Number) : [];
      if (c === "H") return "H" + v.map(function (x) { return f1(dx + x * k); }).join(" ") + " ";
      if (c === "V") return "V" + v.map(function (y) { return f1(dy + y * k); }).join(" ") + " ";
      return c + v.map(function (n, i) { return f1(i % 2 ? dy + n * k : dx + n * k); }).join(" ") + " ";
    });
  }
  function scritta(testo, x, y, alt, spazio) {   // x, y = in alto a sinistra; alt = altezza delle lettere
    var k = alt / 10, d = "", px = x;
    testo.split("").forEach(function (ch) { var l = LETTERE[ch]; if (l) { d += trasla(l[0], px, y, k); px += (l[1] + (spazio == null ? 2.2 : spazio)) * k; } });
    return d;
  }
  function larghezza(testo, alt, spazio) { var k = alt / 10, w = 0; testo.split("").forEach(function (ch, i) { var l = LETTERE[ch]; if (l) w += l[1] * k + (i ? (spazio == null ? 2.2 : spazio) * k : 0); }); return w; }
  // un tubo al neon: di giorno è vetro spento (il colore appena accennato), di notte acceso (bianco dentro, colore e alone fuori)
  function neon(d, c, w, ombraMuro) {
    w = w || 1.8;
    if (NOTTE) return tratto(d, c, w * 4.4, op(.14)) + tratto(d, c, w * 2.5, op(.36)) + tratto(d, chiaro(c, .3), w * 1.3) + tratto(d, chiaro(c, .82), w * .55);
    return (ombraMuro ? tratto(d, "#000", w * 1.1, op(.16) + " " + sp(1.2, 1.7)) : "") + tratto(d, scuro(mix(c, "#8e8a96", .45), .2), w * 1.3) + tratto(d, mix(c, "#f3eef4", .48), w * .85) + tratto(d, "#ffffff", w * .3, op(.85) + " " + sp(-.25, -.3));
  }

  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  QUADRO DEL MARE: la cornice dorata con le perline, il cielo che si scalda verso l'orizzonte, il sole,
  //  le nuvole, il faro sul promontorio, la barca a vela bianca e rossa, il luccichio sull'acqua
  // =========================================================
  def("quadro_mare", { nome: "Quadro del mare", prezzo: 500, reparto: "quadri", giu: 8 }, function () {
    var x = 6, y = 61, w = 50, h = 37, t = 4.6, s = "", r = rnd(31), i;
    var a = x + t, b = y + t, W = w - 2 * t, H = h - 2 * t, oz = b + H * .56, sx = a + W * .77, sy = b + H * .27, c = "";
    s += ombraD(rettD(x, y, w, h, .6), 2.2, 3);
    c += rett(a, b, W, oz - b + .5, 0, lin("ci", [[0, "#57a9e3"], [.55, "#9fd3f1"], [.85, "#d9ecdf"], [1, "#fbe3a0"]], 0, 0, 0, 1));   // il cielo, più caldo verso l'orizzonte
    c += cer(sx, sy, 8, rad("al", [[0, "#fff6c9", .95], [.45, "#ffeeb0", .4], [1, "#ffeeb0", 0]], .5, .5, .5)) + cer(sx, sy, 3.3, rad("so", [[0, "#fffbe8"], [.55, "#ffe066"], [1, "#f5b82e"]], .4, .38, .7));   // il sole
    function nuvola(cx, cy, k) { return ell(cx + .5 * k, cy + 1.1 * k, 4.7 * k, 1.1 * k, "#b9d8ea", op(.9)) + cer(cx - 2.5 * k, cy + .2 * k, 1.7 * k, "#ffffff") + cer(cx - .2 * k, cy - .9 * k, 2.4 * k, "#ffffff") + cer(cx + 2.5 * k, cy + .1 * k, 1.6 * k, "#f7fbfd") + ell(cx, cy + .7 * k, 4.4 * k, 1 * k, "#ffffff"); }
    c += nuvola(a + W * .3, b + H * .22, 1) + nuvola(a + W * .56, b + H * .1, .62);
    [[a + W * .58, b + H * .33], [a + W * .63, b + H * .4]].forEach(function (g) { c += tratto("M" + q(g[0] - 1.1, g[1]) + " Q" + q(g[0] - .55, g[1] - .7) + " " + q(g[0], g[1]) + " Q" + q(g[0] + .55, g[1] - .7) + " " + q(g[0] + 1.1, g[1]), "#4a5866", .35); });   // i gabbiani
    // il promontorio col faro, a sinistra
    c += pth("M" + q(a - 1, oz + 1) + " L" + q(a - 1, oz - 6) + " Q" + q(a + 2.2, oz - 7.6) + " " + q(a + 4, oz - 6.4) + " Q" + q(a + 6.6, oz - 4.6) + " " + q(a + 8.4, oz - 1.4) + " Q" + q(a + 9.6, oz + .2) + " " + q(a + 11, oz + 1) + " Z", lin("pr", [[0, "#8faa7c"], [.5, "#6d8a62"], [1, "#55705a"]], 0, 0, 1, 1), bordo("#3f5a48", .4));
    c += pth("M" + q(a - 1, oz - 1.6) + " Q" + q(a + 4, oz - 3.6) + " " + q(a + 9.6, oz + .4) + " L" + q(a + 11, oz + 1) + " L" + q(a - 1, oz + 1) + " Z", "#8a7d6c", op(.85));
    var fx = a + 3.1, fy = oz - 6.8;
    c += pth("M" + q(fx - .9, fy) + " L" + q(fx + .9, fy) + " L" + q(fx + .7, fy - 4.6) + " L" + q(fx - .7, fy - 4.6) + " Z", "#ffffff", bordo("#4a4a4a", .25)) + rett(fx - .82, fy - 1.6, 1.64, .7, 0, "#e03131") + rett(fx - .76, fy - 3.3, 1.52, .7, 0, "#e03131") +
      rett(fx - .55, fy - 5.6, 1.1, 1, .2, "#fff3bf", bordo("#4a4a4a", .2)) + pth("M" + q(fx - .8, fy - 5.6) + " L" + q(fx, fy - 6.5) + " L" + q(fx + .8, fy - 5.6) + " Z", "#c92a2a");
    // il mare
    c += rett(a, oz, W, b + H - oz, 0, lin("ma", [[0, "#5cc2e6"], [.2, "#3a98d8"], [.55, "#2470b0"], [1, "#16508a"]], 0, 0, 0, 1)) + rett(a, oz, W, .5, 0, "#dff1fa", op(.75));
    for (i = 0; i < 9; i++) { var gy = oz + 1 + i * 1.22, gw = 1.1 + i * .62; c += rett(sx - gw / 2 + (r() - .5) * 1.6, gy, gw, .42, .2, i < 3 ? "#fff6cf" : "#ffe9a8", op(.92 - i * .07)); }   // il luccichio del sole
    for (i = 0; i < 18; i++) { var wx = a + 1 + r() * (W - 2), wy = oz + 1.6 + r() * (b + H - oz - 4.5); c += tratto("M" + q(wx - 1.5, wy) + " Q" + q(wx, wy - .65) + " " + q(wx + 1.5, wy), r() < .7 ? "#8fd0f5" : "#ffffff", .38, op(.75)); }   // le onde
    // la barca a vela: lo scafo rosso, l'albero, le due vele bianche, il guidone; sotto il riflesso
    var bx = a + W * .36, by = oz + 3.4;
    c += ell(bx + .4, by + 2.1, 3.6, .7, "#16508a", op(.7)) + pth("M" + q(bx - 2.3, by + 2) + " L" + q(bx + 2.5, by + 2) + " L" + q(bx + 2.1, by + 4.4) + " L" + q(bx - 1.9, by + 4.4) + " Z", "#ffffff", op(.18));
    c += pth("M" + q(bx - 3.6, by) + " L" + q(bx + 3.8, by) + " Q" + q(bx + 3.1, by + 1.5) + " " + q(bx + 2.3, by + 1.6) + " L" + q(bx - 2.5, by + 1.6) + " Q" + q(bx - 3.2, by + 1.1) + " " + q(bx - 3.6, by) + " Z", lin("sc", [[0, "#ff6b6b"], [1, "#b02525"]], 0, 0, 0, 1), bordo(L, .35)) + rett(bx - 3.3, by + .25, 7, .35, 0, "#ffffff", op(.9));
    c += tratto("M" + q(bx + .1, by) + " L" + q(bx + .1, by - 8), "#5a4630", .35);
    c += pth("M" + q(bx + .45, by - 7.7) + " Q" + q(bx + 3.9, by - 3.6) + " " + q(bx + 4.4, by - .6) + " L" + q(bx + .45, by - .55) + " Z", lin("vb", [[0, "#ffffff"], [1, "#d6e2ea"]], 0, 0, 1, 1), bordo(L, .3));
    c += pth("M" + q(bx - .25, by - 7) + " L" + q(bx - .25, by - .7) + " L" + q(bx - 3.4, by - .8) + " Q" + q(bx - 2.2, by - 3.8) + " " + q(bx - .25, by - 7) + " Z", "#f8fbfd", bordo(L, .3));
    c += pth("M" + q(bx + .1, by - 8) + " L" + q(bx + 1.8, by - 7.6) + " L" + q(bx + .1, by - 7.1) + " Z", "#e03131");
    // l'onda davanti con la schiuma
    var ond = "M" + q(a, b + H - 2.6) + " Q" + q(a + W * .22, b + H - 5) + " " + q(a + W * .46, b + H - 3) + " Q" + q(a + W * .7, b + H - 1.4) + " " + q(a + W, b + H - 4.2);
    c += tratto("M" + q(a, b + H - 7.4) + " Q" + q(a + W * .3, b + H - 9) + " " + q(a + W * .56, b + H - 7.4) + " Q" + q(a + W * .8, b + H - 6.2) + " " + q(a + W, b + H - 8), "#7cc8f0", .5, op(.8));   // un'onda più lontana
    c += pth(ond + " L" + q(a + W, b + H) + " L" + q(a, b + H) + " Z", lin("od", [[0, "#3a92d2"], [1, "#1a5c98"]], 0, 0, 0, 1)) + tratto(ond, "#a6dcf7", 1.2, sp(0, .7)) + tratto(ond, "#ffffff", .85);
    c += tratto("M" + q(a + W * .13, b + H - 4.2) + " q" + q(1.2, -1.6) + " " + q(2.7, -.5) + " q" + q(-.9, -.1) + " " + q(-1.1, .8), "#ffffff", .55);   // il ricciolo dell'onda
    for (i = 0; i < 10; i++) c += cer(a + 2 + r() * (W - 4), b + H - 2.6 - r() * 1.4, .25 + r() * .3, "#ffffff", op(.8));
    for (i = 0; i < 60; i++) { var px = a + r() * W, py = b + r() * H, an = (r() - .5) * .8; c += tratto("M" + q(px, py) + " l" + q(Math.cos(an) * 1.3, Math.sin(an) * 1.3), r() < .5 ? "#ffffff" : "#0b2f52", .3, op(.08)); }   // le pennellate
    c += velature(a, b, W, H);
    s += dentro(rettD(a, b, W, H, 0), c);
    s += cornice(x, y, w, h, t, C_ORO, { perle: true, angoli: true });
    return s;
  });

  // =========================================================
  //  SPECCHIO TONDO DORATO: l'anello d'oro bombato con le perline, il fiocco in cima, il vetro azzurrino
  //  col bordo molato e i riflessi
  // =========================================================
  def("specchio_tondo", { nome: "Specchio tondo dorato", prezzo: 600, reparto: "quadri", giu: 6 }, function () {
    var cx = 31, cy = 83, R = 20, ri = 14.8, s = "";
    s += ombraD(cerD(cx, cy, R) + " " + rettD(cx - 5, cy - R - 6, 10, 6, 2), 2.4, 3.2);
    // l'anello: bombato (sfumatura tonda) e poi la luce da in alto a sinistra
    var anello = cerD(cx, cy, R) + " " + cerD(cx, cy, ri);
    s += pth(anello, rad("an", [[0, "#7a5410"], [.72, "#7a5410"], [.75, "#a8781a"], [.8, "#e9bd47"], [.86, "#fff3c2"], [.92, "#f0c548"], [.97, "#d9a530"], [1, "#b8861f"]], .5, .5, .5), "fill-rule='evenodd'");
    s += pth(anello, lin("al", [[0, "#ffffff", .5], [.42, "#ffffff", 0], [.58, "#000000", 0], [1, "#000000", .35]], .15, .1, .85, .9), "fill-rule='evenodd'");
    s += "<circle cx='" + cx + "' cy='" + cy + "' r='" + f2(ri + 1.15) + "' fill='none' stroke='#7a5410' stroke-width='1' stroke-dasharray='0 1.75' stroke-linecap='round' " + sp(.2, .25) + "/>" +
      "<circle cx='" + cx + "' cy='" + cy + "' r='" + f2(ri + 1.15) + "' fill='none' stroke='#fff1b8' stroke-width='1' stroke-dasharray='0 1.75' stroke-linecap='round'/>";   // le perline
    s += "<circle cx='" + cx + "' cy='" + cy + "' r='" + f2(R - 1.3) + "' fill='none' stroke='#7a5410' stroke-width='.4' " + op(.6) + "/>";   // la gola di fuori
    var tc = "";
    for (var j = 0; j < 40; j++) { var ta = j * Math.PI / 20, ca = Math.cos(ta), sa = Math.sin(ta); tc += "M" + q(cx + ca * (ri + 2.4), cy + sa * (ri + 2.4)) + " L" + q(cx + ca * (R - 2) + sa * .5, cy + sa * (R - 2) - ca * .5) + " "; }
    s += tratto(tc, "#9a6b12", .3, op(.55));   // il cesello a corda
    s += tratto(arco(cx, cy, R - 2.6, 200, 290), "#ffffff", .9, op(.7));   // il riflesso sull'oro
    // il fiocco in cima, intagliato nell'oro
    var fy = cy - R - 1.6;
    s += pth("M" + q(cx - .8, fy + 1) + " L" + q(cx - 3.4, fy + 6.2) + " L" + q(cx - 2.2, fy + 5.6) + " L" + q(cx - 1.6, fy + 7) + " L" + q(cx + .2, fy + 1.4) + " Z", lin("cd", ORO, 0, 0, 1, 1), bordo(L, .5)) +
      pth("M" + q(cx + .8, fy + 1) + " L" + q(cx + 3.4, fy + 6.2) + " L" + q(cx + 2.2, fy + 5.6) + " L" + q(cx + 1.6, fy + 7) + " L" + q(cx - .2, fy + 1.4) + " Z", lin("cd2", [[0, "#f2c94c"], [1, "#8a6014"]], 0, 0, 1, 1), bordo(L, .5));
    s += pth("M" + q(cx, fy + .4) + " C" + q(cx - 2.6, fy - 3.6) + " " + q(cx - 7.4, fy - 2.6) + " " + q(cx - 6.2, fy + .6) + " C" + q(cx - 5.4, fy + 2.6) + " " + q(cx - 2.4, fy + 2) + " " + q(cx, fy + .4) + " Z", lin("ca", ORO, 0, 0, 1, 1), bordo(L, .6)) +
      pth("M" + q(cx, fy + .4) + " C" + q(cx + 2.6, fy - 3.6) + " " + q(cx + 7.4, fy - 2.6) + " " + q(cx + 6.2, fy + .6) + " C" + q(cx + 5.4, fy + 2.6) + " " + q(cx + 2.4, fy + 2) + " " + q(cx, fy + .4) + " Z", lin("cb", [[0, "#f6d77a"], [.6, "#d9a530"], [1, "#8a6014"]], 0, 0, 1, 1), bordo(L, .6));
    s += tratto("M" + q(cx - 1.6, fy - .2) + " Q" + q(cx - 4.4, fy - 2) + " " + q(cx - 5.2, fy + .2) + " M" + q(cx + 1.6, fy - .2) + " Q" + q(cx + 4.4, fy - 2) + " " + q(cx + 5.2, fy + .2), "#7a5410", .4, op(.7));
    s += ell(cx, fy + .5, 1.7, 1.5, lin("cn", ORO, 0, 0, 1, 1), bordo(L, .55)) + cer(cx - .5, fy, .45, "#ffffff", op(.85)) + scintilla(cx - 4.8, fy - 1.4, 1.4, "#ffffff", .85);
    // il vetro: azzurrino, più chiaro in alto a sinistra; il bordo molato, l'ombra della cornice e i riflessi
    var v = cerD(cx, cy, ri - .1);
    s += pth(v, rad("ve", [[0, "#f6fcfe"], [.45, "#d4ecf3"], [.85, "#a9d3df"], [1, "#86bccd"]], .36, .32, .8));
    s += dentro(v, ell(cx + 4, cy + 9.5, 10, 4.5, "#6fa6bb", op(.22)) +
      tratto(arco(cx, cy, ri - .5, 160, 300), "#2a4a55", 1.6, op(.16)) +
      poly([[cx - 8, cy - 12], [cx - 3.5, cy - 14], [cx - 14, cy + 1], [cx - 14.5, cy - 4]], "#ffffff", op(.6)) + poly([[cx - 1.6, cy - 14.4], [cx + .4, cy - 14.4], [cx - 14.4, cy + 3.4], [cx - 14.4, cy + 1.2]], "#ffffff", op(.42)) +
      poly([[cx + 13.6, cy + 2], [cx + 14, cy + 4.5], [cx + 4, cy + 14], [cx + 1.6, cy + 14.2]], "#ffffff", op(.22)));
    s += "<circle cx='" + cx + "' cy='" + cy + "' r='" + f2(ri - 1.3) + "' fill='none' stroke='#ffffff' stroke-width='.6' " + op(.55) + "/>";   // il bordo molato
    s += scintilla(cx - 9.5, cy - 8.5, 2, "#ffffff", .9);
    return s + pth(cerD(cx, cy, R), "none", bordo(L, 1.4)) + pth(cerD(cx, cy, ri), "none", bordo(L, .8));
  });

  // =========================================================
  //  OROLOGIO DA PARETE: la cassa rossa laccata (si vede lo spessore), la ghiera cromata, il quadrante coi numeri,
  //  le lancette alle 10 e 10 e quella rossa dei secondi, il vetro col riflesso
  // =========================================================
  def("orologio_muro", { nome: "Orologio da parete", prezzo: 300, reparto: "deco", giu: 4 }, function () {
    var cx = 31, cy = 80, R = 15.8, rq = R - 4, s = "", i;
    function pol(a, r) { var t = a * Math.PI / 180; return [cx + Math.sin(t) * r, cy - Math.cos(t) * r]; }   // a = gradi da mezzogiorno
    s += ombraD(cerD(cx + .8, cy + 1.1, R), 2.2, 3);
    s += cer(cx + .9, cy + 1.2, R, lin("cp", [[0, "#b52222"], [1, "#6e1010"]], 0, 0, 1, 1), bordo(L, 1.6));   // lo spessore della cassa
    s += cer(cx, cy, R, lin("cs", [[0, "#ff8a8a"], [.38, "#e03131"], [1, "#9c1a1a"]], .15, .1, .85, .9), bordo(L, 1.7));
    s += tratto(arco(cx, cy, R - 1.1, 195, 285), "#ffffff", 1, op(.6)) + tratto(arco(cx, cy, R - 1.1, 20, 80), "#5a0d0d", .8, op(.35));
    s += cer(cx, cy, R - 2.9, lin("bz", CROMO, .1, .1, .9, .9), bordo(L, .55));   // la ghiera cromata
    s += cer(cx, cy, rq, rad("qd", [[0, "#ffffff"], [.72, "#fbf9f3"], [1, "#e2ddd0"]], .42, .4, .72)) + tratto(arco(cx, cy, rq - .55, 170, 300), "#000", 1.1, op(.12));   // il quadrante, con l'ombra della ghiera
    var tk = "";
    for (i = 0; i < 60; i++) { if (i % 5) { var m0 = pol(i * 6, rq - 1.3), m1 = pol(i * 6, rq - .6); tk += "M" + q(m0) + " L" + q(m1) + " "; } }
    s += tratto(tk, "#5c636a", .25);
    for (i = 0; i < 12; i++) { var h0 = pol(i * 30, rq - (i % 3 ? 2.4 : 2.9)), h1 = pol(i * 30, rq - .6); s += tratto("M" + q(h0) + " L" + q(h1), "#2b2f33", i % 3 ? .65 : 1); }
    [["12", 0], ["3", 90], ["6", 180], ["9", 270]].forEach(function (n) { var c = pol(n[1], rq - 5.1); s += "<text x='" + f1(c[0]) + "' y='" + f1(c[1] + 1.15) + "' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-weight='700' font-size='3.2' fill='#2b2f33'>" + n[0] + "</text>"; });
    s += "<text x='" + cx + "' y='" + f1(cy - 3.4) + "' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='1.5' fill='#c92a2a'>SPeeD</text>";
    function lancetta(a, l, lw, c) {   // una lancetta affusolata con la codina
      var tp = pol(a, l), cd = pol(a + 180, 2.2), s1 = pol(a + 90, lw / 2), s2 = pol(a - 90, lw / 2);
      return pth("M" + q(cd) + " L" + q(s1) + " L" + q(tp) + " L" + q(s2) + " Z", c, bordo(scuro(c, .4), .25)) + tratto("M" + q(cx, cy) + " L" + q(pol(a, l * .82)), "#ffffff", .22, op(.35));
    }
    s += pth("M" + q(cx + .6, cy + .9) + " L" + q(pol(305, 6.6)[0] + .6, pol(305, 6.6)[1] + .9) + " M" + q(cx + .6, cy + .9) + " L" + q(pol(60, 9.8)[0] + .6, pol(60, 9.8)[1] + .9), "none", "stroke='#000' stroke-width='1.1' " + op(.14) + " stroke-linecap='round'");   // l'ombra delle lancette
    s += lancetta(305, 6.6, 1.7, "#23272b") + lancetta(60, 9.9, 1.15, "#23272b");
    var s0 = pol(180, 10.6), s1 = pol(0, 3.2);
    s += tratto("M" + q(s1) + " L" + q(s0), "#e03131", .32) + cer(s1[0], s1[1], .55, "#e03131") + cer(cx, cy, 1.25, "#23272b") + cer(cx, cy, .55, "#e03131") + cer(cx - .35, cy - .4, .25, "#ffffff", op(.8));
    // il vetro: una velatura chiara e il riflesso a mezzaluna
    s += pth(cerD(cx, cy, rq), lin("vg", [[0, "#ffffff", .38], [.45, "#ffffff", 0], [1, "#ffffff", 0]], .1, 0, .7, .8));
    s += pth("M" + q(pol(282, rq - 1.2)) + " A" + f2(rq - 1.2) + "," + f2(rq - 1.2) + " 0 0,1 " + q(pol(352, rq - 1.2)) + " Q" + q(cx - 4, cy - 6) + " " + q(pol(282, rq - 1.2)) + " Z", "#ffffff", op(.55));
    return s + scintilla(pol(320, rq - 3)[0], pol(320, rq - 3)[1], 1.3, "#ffffff", .9);
  });

  // =========================================================
  //  QUADRO DEL TRAMONTO: cornice di noce lucido col filetto d'oro; il cielo arancio che diventa giallo, il sole
  //  mezzo tuffato nel mare, le montagne viola e indaco col bordo acceso dal sole, la scia d'oro sull'acqua
  // =========================================================
  def("quadro_tramonto", { nome: "Quadro del tramonto", prezzo: 600, reparto: "quadri", giu: 8 }, function () {
    var x = 5, y = 61, w = 52, h = 37, t = 4.4, s = "", r = rnd(47), i;
    var a = x + t, b = y + t, W = w - 2 * t, H = h - 2 * t, oz = b + H * .62, sx = a + W * .5, c = "";
    s += ombraD(rettD(x, y, w, h, .6), 2.2, 3);
    c += rett(a, b, W, oz - b + .5, 0, lin("ci", [[0, "#b8367a"], [.28, "#f0603a"], [.6, "#ff9a2e"], [.86, "#ffd43b"], [1, "#fff0b0"]], 0, 0, 0, 1));
    c += cer(sx, oz, 15, rad("al", [[0, "#fff6c9", .95], [.35, "#ffe8a0", .55], [1, "#ffd43b", 0]], .5, .5, .5));   // l'alone
    c += cer(sx, oz, 6.4, rad("so", [[0, "#fffdf0"], [.6, "#fff3bf"], [1, "#ffd96b"]], .5, .45, .6));   // il sole
    [[.04, .2, .5, "#9c36b5"], [.5, .3, .42, "#e8789a"], [.08, .44, .28, "#f783ac"], [.64, .12, .32, "#9c36b5"]].forEach(function (n) {   // le nuvole a strisce, accese di sotto
      var nx = a + W * n[0], ny = b + H * n[1], nw = W * n[2];
      c += pth("M" + q(nx, ny) + " Q" + q(nx + nw * .45, ny - 1.7) + " " + q(nx + nw, ny) + " Q" + q(nx + nw * .5, ny + 1.1) + " " + q(nx, ny) + " Z", n[3], op(.6)) + tratto("M" + q(nx + nw * .14, ny + .35) + " Q" + q(nx + nw * .5, ny + 1.15) + " " + q(nx + nw * .86, ny + .35), "#ffd8a8", .45, op(.85));
    });
    [[.24, .3], [.3, .37], [.19, .4]].forEach(function (g) { var gx = a + W * g[0], gy = b + H * g[1]; c += tratto("M" + q(gx - 1, gy - .3) + " Q" + q(gx - .5, gy - .8) + " " + q(gx, gy) + " Q" + q(gx + .5, gy - .8) + " " + q(gx + 1, gy - .3), "#4a2040", .35); });   // gli uccelli
    // le montagne: a sinistra viola, a destra indaco; il fianco verso il sole è acceso, in cima la neve
    var m1 = "M" + q(a - 1, oz + .3) + " L" + q(a - 1, oz - 6) + " L" + q(a + W * .1, oz - 8.5) + " L" + q(a + W * .19, oz - 11.5) + " L" + q(a + W * .28, oz - 7.5) + " L" + q(a + W * .34, oz - 8.6) + " L" + q(a + W * .44, oz + .3) + " Z";
    var m2 = "M" + q(a + W * .56, oz + .3) + " L" + q(a + W * .66, oz - 7) + " L" + q(a + W * .72, oz - 6) + " L" + q(a + W * .8, oz - 13) + " L" + q(a + W * .9, oz - 8) + " L" + q(a + W + 1, oz - 9.5) + " L" + q(a + W + 1, oz + .3) + " Z";
    c += pth(m1, lin("m1", [[0, "#a33fb0"], [1, "#6a1f80"]], 0, 0, 1, 1)) + pth(m2, lin("m2", [[0, "#5b46c9"], [1, "#3b2a8f"]], 1, 0, 0, 1));
    c += tratto("M" + q(a + W * .19, oz - 11.5) + " L" + q(a + W * .28, oz - 7.5) + " L" + q(a + W * .34, oz - 8.6) + " L" + q(a + W * .44, oz + .3), "#ff9a5a", .5, op(.9)) +
      tratto("M" + q(a + W * .56, oz + .3) + " L" + q(a + W * .66, oz - 7) + " L" + q(a + W * .72, oz - 6) + " L" + q(a + W * .8, oz - 13), "#ff9a5a", .5, op(.9));
    c += pth("M" + q(a + W * .14, oz - 9.6) + " L" + q(a + W * .19, oz - 11.5) + " L" + q(a + W * .23, oz - 9.7) + " L" + q(a + W * .2, oz - 10.2) + " Z", "#f3d9fa", op(.85)) +
      pth("M" + q(a + W * .76, oz - 10.7) + " L" + q(a + W * .8, oz - 13) + " L" + q(a + W * .85, oz - 10.6) + " L" + q(a + W * .81, oz - 11.2) + " Z", "#e5dbff", op(.85));
    // il mare: arancio vivo, più scuro in basso; il riflesso delle montagne e la scia d'oro del sole
    c += rett(a, oz, W, b + H - oz, 0, lin("ma", [[0, "#ff8a2a"], [.4, "#e8590c"], [1, "#9a3412"]], 0, 0, 0, 1));
    c += pth(m1, "#5a1a6a", op(.14) + " transform='translate(0 " + f1(2 * oz) + ") scale(1 -1)'") + pth(m2, "#2d2070", op(.14) + " transform='translate(0 " + f1(2 * oz) + ") scale(1 -1)'");
    c += rett(a, oz, W, .55, 0, "#fff3bf", op(.85));
    for (i = 0; i < 11; i++) { var gy = oz + 1 + i * 1.02, gw = 9 - i * .35 + (r() - .5) * 2.4; c += rett(sx - gw / 2 + (r() - .5) * 1.4, gy, gw, .5, .25, i < 4 ? "#fff3bf" : "#ffd43b", op(.95 - i * .055)); }
    for (i = 0; i < 16; i++) { var wx = a + 1 + r() * (W - 2), wy = oz + 1.5 + r() * (b + H - oz - 2); if (Math.abs(wx - sx) < 5) continue; c += tratto("M" + q(wx - 1.4, wy) + " L" + q(wx + 1.4, wy), r() < .5 ? "#7a2a10" : "#ffb070", .35, op(.6)); }
    for (i = 0; i < 60; i++) { var px = a + r() * W, py = b + r() * H, an = (r() - .5) * .8; c += tratto("M" + q(px, py) + " l" + q(Math.cos(an) * 1.3, Math.sin(an) * 1.3), r() < .5 ? "#ffffff" : "#4a1020", .3, op(.08)); }   // le pennellate
    c += velature(a, b, W, H);
    s += dentro(rettD(a, b, W, H, 0), c);
    s += cornice(x, y, w, h, t, C_NOCE, { vena: 7, filo: "#e0b54a" });
    return s;
  });

  // =========================================================
  //  RITRATTO DEL GATTO: cornice d'oro lavorata con la targhetta; il gatto rosso tigrato col musetto bianco,
  //  gli occhi verdi, il collare rosso col campanellino d'oro, su fondo azzurro
  // =========================================================
  def("quadro_gatto", { nome: "Ritratto del gatto", prezzo: 450, reparto: "quadri", giu: 7 }, function () {
    var x = 12, y = 56, w = 38, h = 48, t = 4.6, s = "";
    var a = x + t, b = y + t, W = w - 2 * t, H = h - 2 * t, cx = a + W / 2, hy = b + H * .42, c = "";
    function spec(l) { return l.map(function (v) { return [2 * cx - v[0], v[1]]; }); }   // lo stesso, dall'altra parte del muso
    s += ombraD(rettD(x, y, w, h, .6), 2.2, 3);
    c += rett(a, b, W, H, 0, rad("fo", [[0, "#f1f9ff"], [.55, "#cfe8fb"], [1, "#8fc3ea"]], .5, .38, .75));
    // il corpo, con le strisce e il petto bianco
    var corpo = "M" + q(a + 1.5, b + H + 1) + " Q" + q(a + 2.5, b + H * .66) + " " + q(cx - 5, b + H * .6) + " L" + q(cx + 5, b + H * .6) + " Q" + q(a + W - 2.5, b + H * .66) + " " + q(a + W - 1.5, b + H + 1) + " Z";
    c += pth(corpo, lin("co", [[0, "#ffb366"], [.5, "#ff922b"], [1, "#d9480f"]], 0, 0, 1, 1), bordo(L, .6));
    c += dentro(corpo, tratto("M" + q(a + 2.6, b + H * .8) + " Q" + q(a + 4.6, b + H * .73) + " " + q(a + 6.8, b + H * .77) + " M" + q(a + 2.2, b + H * .9) + " Q" + q(a + 4.4, b + H * .83) + " " + q(a + 6.4, b + H * .87) +
      " M" + q(a + W - 2.6, b + H * .8) + " Q" + q(a + W - 4.6, b + H * .73) + " " + q(a + W - 6.8, b + H * .77) + " M" + q(a + W - 2.2, b + H * .9) + " Q" + q(a + W - 4.4, b + H * .83) + " " + q(a + W - 6.4, b + H * .87), "#c2410c", .9, op(.8)) +
      ell(cx, b + H * .9, 6, 7.4, "#fffaf2") + tratto("M" + q(cx - 4.2, b + H * .78) + " l.7,-1 l.7,1 l.7,-1 l.7,1 l.7,-1 l.7,1 l.7,-1 l.7,1 l.7,-1 l.7,1 l.7,-1 l.7,1", "#fffaf2", .7) + ell(cx, hy + 8.4, 7.4, 1.9, "#a8400a", op(.4)));
    // il collare rosso (la testa lo copre in alto)
    var col = "M" + q(cx - 7, hy + 7.2) + " Q" + q(cx, hy + 10.2) + " " + q(cx + 7, hy + 7.2);
    c += tratto(col, L, 2.6) + tratto(col, "#e03131", 1.9) + tratto(col, "#ff8787", .5, sp(0, -.5));
    // le orecchie (prima della testa)
    var or = [[cx - 8.8, hy - 3.2], [cx - 8.7, hy - 11.6], [cx - 8.2, hy - 12.7], [cx - 7.5, hy - 12.5], [cx - 2.8, hy - 7.4]], dentroOr = [[cx - 7.9, hy - 4.6], [cx - 7.8, hy - 10.8], [cx - 4, hy - 7.3]];
    [or, spec(or)].forEach(function (o2, k) { c += pth(chiuso(o2), k ? "#e8590c" : "#ff922b", bordo(L, .6)); });
    [dentroOr, spec(dentroOr)].forEach(function (o2) { c += pth(chiuso(o2), lin("oi", [[0, "#ffc2d4"], [1, "#f783ac"]], 0, 0, 0, 1)) + tratto("M" + q(o2[0][0] + (o2[2][0] - o2[0][0]) * .2, o2[0][1] - .6) + " L" + q(o2[1][0] + (o2[2][0] - o2[1][0]) * .35, o2[1][1] + 2), "#ffffff", .3, op(.8)); });
    // la testa tonda col musetto
    var testa = "M" + q(cx - 9.6, hy + 1.2) + " C" + q(cx - 9.8, hy - 5.6) + " " + q(cx - 5.4, hy - 8) + " " + q(cx, hy - 8) + " C" + q(cx + 5.4, hy - 8) + " " + q(cx + 9.8, hy - 5.6) + " " + q(cx + 9.6, hy + 1.2) +
      " C" + q(cx + 9.4, hy + 5.6) + " " + q(cx + 5, hy + 7.6) + " " + q(cx, hy + 7.6) + " C" + q(cx - 5, hy + 7.6) + " " + q(cx - 9.4, hy + 5.6) + " " + q(cx - 9.6, hy + 1.2) + " Z";
    var ciuffo = [[cx - 9.2, hy + 1.2], [cx - 11, hy + 3.1], [cx - 9.3, hy + 3.5], [cx - 10.5, hy + 5.3], [cx - 8.2, hy + 5]];
    c += pth(chiuso(ciuffo), "#ff922b", bordo(L, .5)) + pth(chiuso(spec(ciuffo)), "#e8590c", bordo(L, .5));
    c += pth(testa, rad("te", [[0, "#ffc285"], [.55, "#ff922b"], [1, "#e0600e"]], .4, .35, .75), bordo(L, .7));
    c += dentro(testa, tratto("M" + q(cx, hy - 7.8) + " L" + q(cx, hy - 4.6) + " M" + q(cx - 2.3, hy - 7.4) + " Q" + q(cx - 2.8, hy - 5.6) + " " + q(cx - 1.6, hy - 4.3) + " M" + q(cx + 2.3, hy - 7.4) + " Q" + q(cx + 2.8, hy - 5.6) + " " + q(cx + 1.6, hy - 4.3) +
      " M" + q(cx - 9.8, hy - 1.2) + " L" + q(cx - 6.8, hy - .5) + " M" + q(cx - 9.9, hy + 1.3) + " L" + q(cx - 7, hy + 1.4) + " M" + q(cx + 9.8, hy - 1.2) + " L" + q(cx + 6.8, hy - .5) + " M" + q(cx + 9.9, hy + 1.3) + " L" + q(cx + 7, hy + 1.4), "#c2410c", .75, op(.85)) +
      pth("M" + q(cx - 1.1, hy - .8) + " L" + q(cx + 1.1, hy - .8) + " L" + q(cx + 2.2, hy + 2) + " L" + q(cx - 2.2, hy + 2) + " Z", "#fffaf2") +
      ell(cx - 2.1, hy + 3.3, 2.8, 2.1, "#fffaf2") + ell(cx + 2.1, hy + 3.3, 2.8, 2.1, "#fffaf2") + ell(cx, hy + 5.6, 2.5, 1.6, "#fffaf2") +
      ell(cx - 4, hy - 4.6, 3, 1.6, "#ffffff", op(.25)));
    // gli occhi verdi a mandorla, la pupilla a fessura, il luccichio
    [-1, 1].forEach(function (sg) {
      var ex = cx + sg * 3.9, ey = hy - 1.3, oc = "M" + q(ex - 2.4, ey) + " Q" + q(ex, ey - 2.4) + " " + q(ex + 2.4, ey) + " Q" + q(ex, ey + 2.1) + " " + q(ex - 2.4, ey) + " Z";
      c += "<g " + gira(sg * -9, ex, ey) + ">" + pth(oc, rad("oc", [[0, "#d8f5a2"], [.45, "#82c91e"], [1, "#2b8a3e"]], .5, .5, .55), bordo(L, .45)) + ell(ex, ey, .6, 1.7, "#141414") + cer(ex - .75, ey - .7, .45, "#ffffff") + cer(ex + .6, ey + .6, .2, "#ffffff", op(.8)) +
        tratto("M" + q(ex - 2.5, ey - .1) + " Q" + q(ex, ey - 2.5) + " " + q(ex + 2.5, ey - .1), L, .55) + "</g>";
    });
    c += pth("M" + q(cx - 1.35, hy + 1.1) + " Q" + q(cx, hy + .7) + " " + q(cx + 1.35, hy + 1.1) + " L" + q(cx, hy + 2.5) + " Z", "#f06595", bordo("#a61e4d", .3)) + cer(cx - .4, hy + 1.2, .25, "#ffffff", op(.8));   // il naso
    c += tratto("M" + q(cx, hy + 2.5) + " L" + q(cx, hy + 3.4) + " M" + q(cx - 1.9, hy + 3.7) + " Q" + q(cx - .9, hy + 4.5) + " " + q(cx, hy + 3.4) + " Q" + q(cx + .9, hy + 4.5) + " " + q(cx + 1.9, hy + 3.7), "#7a3a20", .35);
    [-1, 1].forEach(function (sg) {   // i baffi
      c += tratto("M" + q(cx + sg * 3.2, hy + 3) + " Q" + q(cx + sg * 8, hy + 1.8) + " " + q(cx + sg * 12.4, hy + 1.6) + " M" + q(cx + sg * 3.2, hy + 3.5) + " Q" + q(cx + sg * 8, hy + 3.4) + " " + q(cx + sg * 12.6, hy + 3.8) + " M" + q(cx + sg * 3.2, hy + 4) + " Q" + q(cx + sg * 7.6, hy + 4.8) + " " + q(cx + sg * 11.6, hy + 6), "#ffffff", .3, op(.95));
    });
    // il campanellino d'oro
    var by = hy + 10.2;
    c += cer(cx + .5, by + .6, 1.6, "#000", op(.2)) + cer(cx, by, 1.6, rad("ca", [[0, "#fff3c2"], [.5, "#f0c548"], [1, "#9a6b12"]], .38, .35, .7), bordo(L, .45)) + tratto("M" + q(cx - 1.4, by + .1) + " L" + q(cx + 1.4, by + .1), "#7a5410", .3) + cer(cx, by + .9, .35, "#5a3d10") + cer(cx - .55, by - .6, .35, "#ffffff", op(.9));
    c += velature(a, b, W, H);
    s += dentro(rettD(a, b, W, H, 0), c);
    s += cornice(x, y, w, h, t, C_ORO, { perle: true, angoli: true });
    // la targhetta col nome
    var ty = y + h - t * .78;
    s += rett(cx - 5.4, ty - 1.25, 10.8, 2.5, .4, lin("tg", ORO, 0, 0, 0, 1), bordo(L, .4)) + "<text x='" + f1(cx) + "' y='" + f1(ty + .62) + "' text-anchor='middle' font-family='Georgia,Times New Roman,serif' font-weight='700' font-size='1.75' fill='#5a3d10' letter-spacing='.15'>MICIO</text>";
    return s;
  });

  // =========================================================
  //  QUADRO MODERNO: una composizione alla Mondrian (rosso grande, giallo, blu, un tassello nero, le righe nere),
  //  la tela che "galleggia" dentro la cornice nera laccata
  // =========================================================
  def("quadro_astratto", { nome: "Quadro moderno", prezzo: 700, reparto: "quadri", giu: 8 }, function () {
    var x = 9, y = 58, w = 44, h = 44, t = 2.6, s = "", r = rnd(53), i;
    var a = x + t + .9, b = y + t + .9, W = w - 2 * t - 1.8, H = h - 2 * t - 1.8, c = "", lw = 1.75;
    function X(u) { return a + u * W; }
    function Y(v) { return b + v * H; }
    s += ombraD(rettD(x, y, w, h, .4), 2, 2.8);
    s += cornice(x, y, w, h, t, C_NERO) + rett(x + t, y + t, w - 2 * t, h - 2 * t, 0, "#111214");   // la fessura tra cornice e tela
    c += rett(a, b, W, H, 0, lin("te", [[0, "#f7f4ec"], [1, "#e9e3d4"]], 0, 0, 1, 1));
    c += rett(X(0), Y(0), X(.52) - X(0), Y(.62) - Y(0), 0, lin("ro", [[0, "#f03e3e"], [1, "#c92a2a"]], 0, 0, 1, 1));
    c += rett(X(.78), Y(0), X(1) - X(.78), Y(.34) - Y(0), 0, lin("gi", [[0, "#ffd84d"], [1, "#f2b705"]], 0, 0, 1, 1));
    c += rett(X(.62), Y(.62), X(1) - X(.62), Y(1) - Y(.62), 0, lin("bl", [[0, "#2f8ee8"], [1, "#1864ab"]], 0, 0, 1, 1));
    c += rett(X(0), Y(.86), X(.2) - X(0), Y(1) - Y(.86), 0, "#1d1d20");
    for (i = 0; i < 80; i++) { var px = a + r() * W, py = b + r() * H; c += rett(px, py, 1.5 + r() * 2.5, .3, .15, r() < .5 ? "#ffffff" : "#000000", op(.07)); }   // le pennellate
    [[.52, 0, .52, 1], [0, .62, 1, .62], [.78, 0, .78, .62], [.78, .34, 1, .34], [.62, .62, .62, 1], [0, .86, .52, .86], [.2, .86, .2, 1]].forEach(function (n) {   // le righe nere
      var vert = n[0] === n[2];
      c += rett(X(n[0]) - (vert ? lw / 2 : 0), Y(n[1]) - (vert ? 0 : lw / 2), vert ? lw : X(n[2]) - X(n[0]), vert ? Y(n[3]) - Y(n[1]) : lw, 0, "#1d1d20");
    });
    c += velature(a, b, W, H, .8);
    s += dentro(rettD(a, b, W, H, 0), c) + rett(a, b, W, H, 0, "none", "stroke='#000' stroke-width='.3' " + op(.4));
    return s;
  });

  // =========================================================
  //  POSTER DELLO SPAZIO: cornice d'alluminio sottile; il cielo nero e viola con le nebulose e le stelle,
  //  Saturno arancio con l'anello (dietro e davanti), la luna coi crateri, il razzo che parte col fuoco e il fumo
  // =========================================================
  def("poster_spazio", { nome: "Poster dello spazio", prezzo: 350, reparto: "quadri", giu: 8 }, function () {
    var x = 13, y = 54, w = 36, h = 51, t = 1.9, s = "", r = rnd(71), i;
    var a = x + t, b = y + t, W = w - 2 * t, H = h - 2 * t, c = "";
    s += ombraD(rettD(x, y, w, h, .4), 1.8, 2.6);
    c += rett(a, b, W, H, 0, lin("sp", [[0, "#0d0e2a"], [.5, "#1b1b3a"], [1, "#5f3dc4"]], 0, 0, 0, 1));
    c += cer(a + W * .22, b + H * .62, 14, rad("n1", [[0, "#f06595", .45], [1, "#f06595", 0]], .5, .5, .5)) + cer(a + W * .85, b + H * .8, 11, rad("n2", [[0, "#22b8cf", .35], [1, "#22b8cf", 0]], .5, .5, .5)) +
      cer(a + W * .6, b + H * .42, 10, rad("n3", [[0, "#9775fa", .4], [1, "#9775fa", 0]], .5, .5, .5));   // le nebulose
    for (i = 0; i < 55; i++) c += cer(a + r() * W, b + r() * H, .15 + r() * .35, r() < .8 ? "#ffffff" : "#ffe066", op(.4 + r() * .6));
    c += scintilla(a + W * .12, b + H * .42, 1.4) + scintilla(a + W * .9, b + H * .1, 1.1) + scintilla(a + W * .84, b + H * .56, .9);
    var mx = a + W * .2, my = b + H * .14;   // la luna
    c += cer(mx, my, 3.4, rad("lu", [[0, "#f8f9fa"], [.7, "#ced4da"], [1, "#868e96"]], .38, .35, .75)) + cer(mx + 1, my + .6, .8, "#adb5bd") + cer(mx - 1.2, my - .6, .55, "#adb5bd") + cer(mx - .2, my + 1.8, .45, "#adb5bd");
    // Saturno: l'anello dietro, il pianeta a fasce, l'anello davanti
    var px = a + W * .66, py = b + H * .3, pr = 6, an = -18;
    function anello() { return ell(px, py, 11.4, 3, "none", "stroke='#9a6b12' stroke-width='2.3'") + ell(px, py, 11.4, 3, "none", "stroke='#ffd43b' stroke-width='1.4'") + ell(px, py, 9.5, 2.35, "none", "stroke='#fff3bf' stroke-width='.45' " + op(.85)); }
    c += cer(px, py, 11, rad("sh", [[0, "#ffb070", .4], [.55, "#ff922b", .12], [1, "#ff922b", 0]], .5, .5, .5));   // il bagliore intorno al pianeta
    c += "<g " + gira(an, px, py) + ">" + anello() + "</g>";
    var pi = cerD(px, py, pr);
    c += pth(pi, rad("pl", [[0, "#ffd8a8"], [.5, "#ff922b"], [1, "#c2410c"]], .35, .32, .8));
    c += dentro(pi, "<g " + gira(an, px, py) + ">" + rett(px - pr, py - 3, 2 * pr, 1.1, 0, "#e8590c", op(.5)) + rett(px - pr, py - .5, 2 * pr, 1.6, 0, "#ffc078", op(.55)) + rett(px - pr, py + 2.3, 2 * pr, 1, 0, "#d9480f", op(.5)) + "</g>" + cer(px + 2.6, py + 2.6, pr, "#3b0a45", op(.3)));
    c += "<g " + gira(an, px, py) + ">" + dentro(rettD(px - 13, py, 26, 5, 0), anello()) + "</g>";
    // il razzo che parte, col fumo
    var rx = a + W * .3, ry = b + H * .72, ra = 28, dx = -Math.sin(ra * Math.PI / 180), dy = Math.cos(ra * Math.PI / 180);
    for (i = 0; i < 8; i++) { var d = 9 + i * 2.6; c += cer(rx + dx * d + (r() - .5) * 2, ry + dy * d, 1.3 + i * .38, i % 2 ? "#dee2e6" : "#ffffff", op(.75 - i * .05)); }
    var rz = pth("M-1.3,6.6 Q0,13.5 1.3,6.6 Z", "#ff922b") + pth("M-.75,6.6 Q0,11 .75,6.6 Z", "#ffe066") + pth("M-.3,6.6 Q0,8.6 .3,6.6 Z", "#ffffff") +
      pth("M-2,2.2 L-4.2,5.6 L-4,7 L-1.9,5.5 Z", "#e03131", bordo(L, .4)) + pth("M2,2.2 L4.2,5.6 L4,7 L1.9,5.5 Z", "#b52222", bordo(L, .4)) +
      pth("M0,-7.5 C2.6,-5 2.6,2 2,5.6 L-2,5.6 C-2.6,2 -2.6,-5 0,-7.5 Z", lin("rb", [[0, "#ffffff"], [.6, "#e9ecef"], [1, "#a5afb8"]], 0, 0, 1, 0), bordo(L, .45)) +
      pth("M0,-7.5 C1.4,-6.2 2,-5 2.2,-4 L-2.2,-4 C-2,-5 -1.4,-6.2 0,-7.5 Z", "#e03131", bordo(L, .4)) + rett(-1.5, 5.5, 3, 1, .3, "#868e96", bordo(L, .35)) +
      cer(0, -1, 1.3, rad("fi", [[0, "#d0ebff"], [.6, "#4dabf7"], [1, "#1864ab"]], .35, .35, .7), bordo(L, .45)) + cer(-.4, -1.4, .35, "#ffffff") + rett(-1.6, -6.2, .5, 9.5, .25, "#ffffff", op(.7));
    c += "<g transform='translate(" + f1(rx) + " " + f1(ry) + ") rotate(" + ra + ")'>" + rz + "</g>";
    c += rett(a + 1.2, b + 1.2, W - 2.4, H - 2.4, 0, "none", "stroke='#ffffff' stroke-width='.3' " + op(.45));
    c += "<text x='" + f1(a + W / 2) + "' y='" + f1(b + H - 3) + "' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='3.4' fill='#ffffff' letter-spacing='.7' " + op(.92) + ">SPAZIO</text>";
    c += poly([[a, b], [a + W * .5, b], [a, b + H * .55]], "#ffffff", op(.09)) + poly([[a + W * .58, b], [a + W * .64, b], [a, b + H * .92], [a, b + H * .82]], "#ffffff", op(.07));   // il vetro
    s += dentro(rettD(a, b, W, H, 0), c);
    s += cornice(x, y, w, h, t, C_ARGENTO);
    return s;
  });

  // =========================================================
  //  POSTER DEL CONCERTO: appeso con quattro puntine colorate; il palco viola coi fari, la chitarra elettrica
  //  arancio col battipenna bianco, i fulmini, la scritta ROCK! gialla e l'ora del concerto
  // =========================================================
  def("poster_concerto", { nome: "Poster del concerto", prezzo: 250, reparto: "quadri", giu: 8 }, function () {
    var x = 13, y = 54, w = 36, h = 52, s = "", r = rnd(83), i, c = "";
    var carta = rettD(x, y, w, h, .5);
    function puntina(px, py, k) { return cer(px + .7, py + 1, 1.2, "#000", op(.22)) + cer(px, py, 1.3, rad("pu" + k.slice(1), [[0, chiaro(k, .6)], [.55, k], [1, scuro(k, .35)]], .35, .32, .75), bordo(L, .35)) + cer(px - .42, py - .42, .36, "#ffffff", op(.9)); }
    function fulmine(fx, fy, k) { return pth("M" + q(fx, fy) + " l" + q(2.4 * k, 0) + " l" + q(-1.4 * k, 2.6 * k) + " l" + q(1.8 * k, 0) + " l" + q(-3.4 * k, 4.8 * k) + " l" + q(1.2 * k, -3.6 * k) + " l" + q(-1.8 * k, 0) + " Z", "#ffd43b", bordo(L, .35)); }
    s += ombraD(carta, 1.6, 2.2, .9);
    c += rett(x, y, w, h, 0, lin("fo", [[0, "#1c1d22"], [.5, "#3b2a7a"], [1, "#6741d9"]], 0, 0, 0, 1));
    c += pth("M" + q(x + w * .3, y) + " L" + q(x + w * .5, y) + " L" + q(x + w * .98, y + h * .8) + " L" + q(x + w * .26, y + h * .8) + " Z", lin("fa", [[0, "#e5dbff", .32], [1, "#e5dbff", 0]], 0, 0, 0, 1)) +
      pth("M" + q(x + w * .62, y) + " L" + q(x + w * .76, y) + " L" + q(x + w * .58, y + h * .72) + " L" + q(x, y + h * .64) + " Z", lin("fb", [[0, "#ffd8f0", .26], [1, "#ffd8f0", 0]], 0, 0, 0, 1));   // i fari del palco
    for (i = 0; i < 18; i++) c += cer(x + 1 + r() * (w - 2), y + 1 + r() * h * .5, .2 + r() * .4, r() < .6 ? "#ffe066" : "#ffffff", op(.6 + r() * .4));
    c += fulmine(x + w * .12, y + h * .16, 1.1) + fulmine(x + w * .8, y + h * .46, .9);
    // la chitarra elettrica (dritta, poi girata): il corpo sfumato, il battipenna, i pickup, il manico d'acero, la paletta con le chiavette
    var gt = "";
    var cpo = "M-4.2,1 C-6.4,-1.6 -6.8,-4.4 -5.4,-5.2 C-4.4,-5.8 -3.4,-4.2 -2.2,-2.6 C-1,-1.8 1,-1.8 2.2,-2.6 C3,-4 4,-6.6 5.4,-5.8 C6.6,-5 5.8,-1.6 4.6,1 C6.4,3.6 6.6,7.6 5.2,10.2 C3.6,12.8 -3.6,12.8 -5.2,10.2 C-6.6,7.6 -6.2,3.6 -4.2,1 Z";
    gt += pth(cpo, "#000", op(.25) + " " + sp(.9, 1.2)) + pth(cpo, rad("gc", [[0, "#ffe066"], [.45, "#f59f00"], [.8, "#d9480f"], [1, "#7a2a0a"]], .5, .55, .6), bordo(L, .5));
    gt += pth("M-3.8,1.6 C-2,0 2.5,0 3.6,1.4 C4.4,3 3.8,5 2,6 L3.4,9 C1,10.4 -2.4,10.2 -4,8.6 C-5,6.4 -5,3.4 -3.8,1.6 Z", "#fff8f0", bordo(L, .3));
    gt += rett(-1.7, 1.3, 3.4, .95, .3, "#1a1a1a") + rett(-1.7, 3.3, 3.4, .95, .3, "#1a1a1a") + rett(-1.7, 5.3, 3.4, .95, .3, "#1a1a1a") + rett(-1.9, 7.3, 3.8, 1.2, .3, lin("pt", CROMO, 0, 0, 0, 1), bordo(L, .25));
    gt += cer(2.4, 7.4, .5, "#dee2e6", bordo(L, .2)) + cer(3, 8.8, .5, "#dee2e6", bordo(L, .2));
    gt += rett(-1, -17.5, 2, 18.6, .3, lin("ma", [[0, "#ffe4b8"], [1, "#d99a50"]], 0, 0, 1, 0), bordo(L, .35));
    for (i = 0; i < 11; i++) gt += tratto("M-.95," + f1(-16.4 + i * 1.45) + " H.95", "#8a6a3a", .2);
    gt += pth("M-1.1,-17.5 L-1.5,-22.6 Q-.5,-23.7 1.8,-22.4 L1.2,-17.5 Z", lin("pa", [[0, "#ffd8a0"], [1, "#d98c3a"]], 0, 0, 1, 0), bordo(L, .35));
    for (i = 0; i < 6; i++) gt += cer(-1.9, -18.3 - i * .78, .32, "#e9ecef", bordo(L, .15));
    gt += tratto("M-.55,7.4 L-.5,-17.5 M-.18,7.4 L-.17,-17.5 M.18,7.4 L.17,-17.5 M.55,7.4 L.5,-17.5", "#f1f3f5", .1, op(.9));
    c += "<g transform='translate(" + f1(x + w * .45) + " " + f1(y + h * .43) + ") rotate(36)'>" + gt + "</g>";
    // ROCK! e l'ora
    var tw = larghezza("ROCK!", 7.4, 2), tx = x + (w - tw) / 2, ty = y + h - 13.4, dR = scritta("ROCK!", tx, ty, 7.4, 2);
    c += tratto(dR, "#1a1033", 3.6) + tratto(dR, "#ff8a00", 2.3) + tratto(dR, "#ffe066", 1.2, sp(-.15, -.2));
    var folla = "";   // il pubblico sotto il palco: teste e mani alzate
    for (i = 0; i < 11; i++) { var fx = x + 1 + i * 3.2 + (r() - .5), fy = y + h - 1.6 - r() * .8; folla += cer(fx, fy - 1.6, 1.25 + r() * .35, "#140c2a") + rett(fx - 1.6, fy - .6, 3.2, 3, 1.2, "#140c2a"); if (i % 3 === 1) folla += tratto("M" + q(fx + 1, fy - 1) + " L" + q(fx + 2 + r(), fy - 6.2) + " M" + q(fx - 1, fy - 1) + " L" + q(fx - 1.8, fy - 5.6), "#140c2a", .8) + cer(fx + 2.2, fy - 6.5, .55, "#140c2a") + cer(fx - 1.9, fy - 5.9, .55, "#140c2a"); }
    c += pth("M" + q(x, y + h - 5) + " L" + q(x + w, y + h - 5) + " L" + q(x + w, y + h) + " L" + q(x, y + h) + " Z", lin("pb", [[0, "#ff4fb8", 0], [1, "#ff4fb8", .25]], 0, 0, 0, 1)) + folla;
    c += "<text x='" + f1(x + w / 2) + "' y='" + f1(y + h - 2.6) + "' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-weight='700' font-size='2.4' fill='#ffffff' letter-spacing='.3'>LIVE · 21:00</text>";
    c += poly([[x, y], [x + w * .55, y], [x, y + h * .5]], "#ffffff", op(.06));
    s += dentro(carta, c) + pth(carta, "none", bordo(L, 1));
    [[x + 2.2, y + 2.2, "#e03131"], [x + w - 2.2, y + 2.2, "#fcc419"], [x + 2.2, y + h - 2.2, "#4dabf7"], [x + w - 2.2, y + h - 2.2, "#40c057"]].forEach(function (pp) { s += puntina(pp[0], pp[1], pp[2]); });
    return s;
  });

  // =========================================================
  //  LE MENSOLE: il ripiano visto un po' da sopra (la faccia di sopra e lo spessore davanti), le squadrette,
  //  l'ombra sul muro sotto
  // =========================================================
  function ripiano(x0, x1, Y, legno, o) {   // Y = lo spigolo davanti in alto; legno = [sopra, davanti]
    o = o || {};
    var s = "", r = rnd(o.seme || 5), i, g = "";
    s += rett(x0, Y - 2.4, x1 - x0, 2.4, .5, lin("rs", [[0, chiaro(legno[0], .22)], [1, legno[0]]], 0, 0, 0, 1), bordo(L, .8));
    s += rett(x0, Y, x1 - x0, 3.8, .6, lin("rd", [[0, legno[1]], [1, scuro(legno[1], .3)]], 0, 0, 0, 1), bordo(L, 1.2));
    for (i = 0; i < 5; i++) { var gy = Y + .7 + i * .65 + r() * .2; g += "M" + q(x0 + 1 + r() * 4, gy) + " Q" + q((x0 + x1) / 2 + (r() - .5) * 10, gy + (r() - .5) * .5) + " " + q(x1 - 1 - r() * 4, gy + (r() - .5) * .3) + " "; }
    s += tratto(g, scuro(legno[1], .35), .25, op(.55));   // le venature
    s += tratto("M" + q(x0 + 1, Y + .45) + " L" + q(x1 - 1, Y + .45), "#ffffff", .5, op(o.lucido ? .75 : .45)) + tratto("M" + q(x0 + 1.5, Y - 1.9) + " L" + q(x1 - 1.5, Y - 1.9), "#ffffff", .35, op(.35));
    return s;
  }
  function squadretta(bx, Y, verso, k) {   // la squadretta di ferro battuto (o d'ottone) col ricciolo; verso 1 = il braccio va a destra
    var v = verso, d = "M" + q(bx, Y + 3.6) + " L" + q(bx, Y + 12.4) + " M" + q(bx, Y + 3.9) + " L" + q(bx + v * 5.4, Y + 3.9) + " M" + q(bx + v * 5, Y + 4.1) + " Q" + q(bx + v * 1.2, Y + 5.2) + " " + q(bx + .1 * v, Y + 11.4);
    var ric = "M" + q(bx + v * 2.6, Y + 6.2) + " a1.3,1.3 0 1," + (v > 0 ? 1 : 0) + " " + q(v * 1.4, 1.6) + " a.7,.7 0 1," + (v > 0 ? 1 : 0) + " " + q(-v * .8, -.6);
    return tratto(d, "#000", 1.5, op(.12) + " " + sp(1.4, 1.8)) + tratto(d, L, 1.7) + tratto(d, k[1], 1) + tratto(ric, L, 1.1) + tratto(ric, k[1], .55) + tratto("M" + q(bx - .25, Y + 4.4) + " L" + q(bx - .25, Y + 11.8), k[0], .35, op(.8)) + cer(bx, Y + 12.4, .8, k[1], bordo(L, .4));
  }
  var FERRO = ["#7a7f88", "#2f3136"], OTTONE = ["#fff1b8", "#d9a530"];

  // MENSOLA CON I LIBRI: libri rosso, blu e giallo in piedi, quello verde appoggiato, due libri sdraiati
  // con l'uccellino di ceramica, il vasetto arancio con la piantina grassa
  def("mensola_muro", { nome: "Mensola con i libri", prezzo: 250, reparto: "mobili", giu: 6 }, function () {
    var Y = 98, x0 = 5, x1 = 57, yb = Y - 1.1, s = "";
    function libro(bx, w, hh, c, fasce) {   // un libro in piedi: il dorso col titolo e le fasce
      var t = rett(bx, yb - hh, w, hh, .5, lin("lb" + c.slice(1), [[0, chiaro(c, .25)], [.45, c], [1, scuro(c, .3)]], 0, 0, 1, 0), bordo(L, .55));
      t += rett(bx + .4, yb - hh + 1.3, w - .8, .55, 0, "#ffe9a8", op(.9)) + rett(bx + .4, yb - 2.2, w - .8, .55, 0, "#ffe9a8", op(.9));
      if (fasce) t += rett(bx + .9, yb - hh * .62, w - 1.8, hh * .22, .2, scuro(c, .25)) + tratto("M" + q(bx + w / 2, yb - hh * .6) + " L" + q(bx + w / 2, yb - hh * .44), "#ffe9a8", .35);
      return t + tratto("M" + q(bx + .7, yb - hh + .6) + " L" + q(bx + .7, yb - .6), "#ffffff", .35, op(.5));
    }
    // l'ombra sul muro: sotto il ripiano e dietro le cose
    s += pth("M" + q(x0 + 1.5, Y + 3.6) + " L" + q(x1 + 1, Y + 3.6) + " L" + q(x1 + 3.6, Y + 9.5) + " L" + q(x0 + 4, Y + 9.5) + " Z", "#000", op(.08)) + pth("M" + q(x0 + 1.5, Y + 3.6) + " L" + q(x1 + 1, Y + 3.6) + " L" + q(x1 + 2.4, Y + 6.5) + " L" + q(x0 + 2.8, Y + 6.5) + " Z", "#000", op(.08));
    s += rett(9.4, yb - 17.5, 14, 17, 1, "#000", op(.09)) + rett(44.5, yb - 15, 9, 15, 3, "#000", op(.08));
    s += squadretta(13, Y, -1, FERRO) + squadretta(49, Y, 1, FERRO);
    s += ripiano(x0, x1, Y, ["#c07a3a", "#a0652b"], { seme: 9 });
    s += libro(8, 4.4, 16, "#e03131", true) + libro(12.4, 4, 14, "#1c7ed6", false) + libro(16.4, 5, 17.5, "#ffd43b", true);
    s += tratto("M" + q(19.8, yb - 17.6) + " Q" + q(20.4, yb - 15.4) + " " + q(19.9, yb - 12.6), L, 1.1) + tratto("M" + q(19.8, yb - 17.6) + " Q" + q(20.4, yb - 15.4) + " " + q(19.9, yb - 12.6), "#e03131", .6);   // il segnalibro
    s += "<g transform='translate(25.7 " + f1(yb) + ") rotate(-16)'>" + rett(0, -15.5, 4, 15.5, .5, lin("lv", [[0, "#51cf66"], [.45, "#2f9e44"], [1, "#1f6f31"]], 0, 0, 1, 0), bordo(L, .55)) + rett(.4, -14.2, 3.2, .5, 0, "#ffe9a8", op(.9)) + rett(.4, -2.2, 3.2, .5, 0, "#ffe9a8", op(.9)) + rett(.9, -10, 2.2, 3.6, .2, "#1f6f31") + "</g>";
    // i due libri sdraiati e l'uccellino bianco
    s += rett(30.4, yb - 2.7, 9.6, 2.7, .5, lin("ls1", [[0, "#9775fa"], [1, "#5f3dc4"]], 0, 0, 0, 1), bordo(L, .5)) + rett(31.1, yb - 2.2, 8.4, .4, 0, "#f3f0ff", op(.8));
    s += rett(31, yb - 5, 8.4, 2.3, .5, lin("ls2", [[0, "#22b8cf"], [1, "#0b7285"]], 0, 0, 0, 1), bordo(L, .5)) + rett(31.6, yb - 4.4, 7.2, .35, 0, "#e3fafc", op(.8));
    var ux = 35.2, uy = yb - 5;
    s += pth("M" + q(ux - 3.2, uy - 2.4) + " L" + q(ux - 4.6, uy - 3.6) + " L" + q(ux - 2.4, uy - 2.9) + " Z", "#e9ecef", bordo(L, .4)) + ell(ux, uy - 2, 2.9, 2, rad("uc", [[0, "#ffffff"], [.7, "#eef1f3"], [1, "#c5ccd2"]], .38, .3, .8), bordo(L, .5)) +
      cer(ux + 2.1, uy - 4, 1.4, rad("uc", [[0, "#ffffff"], [.7, "#eef1f3"], [1, "#c5ccd2"]], .38, .3, .8), bordo(L, .5)) + pth("M" + q(ux + 3.4, uy - 4.3) + " L" + q(ux + 4.6, uy - 3.9) + " L" + q(ux + 3.3, uy - 3.6) + " Z", "#fcc419", bordo(L, .3)) + cer(ux + 2.4, uy - 4.3, .3, L) + tratto("M" + q(ux - 1.2, uy - 2.4) + " Q" + q(ux, uy - 1.2) + " " + q(ux + 1, uy - 2.2), "#adb5bd", .35);
    // il vasetto arancio con la piantina grassa
    var px = 47.5, pt = yb - 7.2;
    var fg = [[-3.4, -3.2, -50, 3.6], [3.4, -3.4, 50, 3.6], [-1.6, -5.6, -18, 3.8], [1.8, -5.8, 20, 3.8], [0, -7.6, 0, 3.6], [-4.4, -.8, -78, 3], [4.6, -1, 80, 3], [-2.6, -1.6, -38, 3.2], [2.6, -1.8, 38, 3.2]];
    fg.forEach(function (f, k) {   // le foglie carnose, dalle più lontane
      var fx = px + f[0], fy = pt + f[1];
      s += "<g " + gira(f[2], fx, fy + f[3] * .5) + ">" + ell(fx, fy, f[3] * .42, f[3] * .62, lin("fg", [[0, "#8ce99a"], [.5, "#40c057"], [1, "#2b8a3e"]], 0, 0, 1, 1), bordo(L, .45)) + ell(fx - f[3] * .12, fy - f[3] * .2, f[3] * .12, f[3] * .3, "#ffffff", op(.45)) + "</g>";
    });
    s += pth("M" + q(px - 4.6, pt) + " L" + q(px + 4.6, pt) + " L" + q(px + 3.5, yb) + " L" + q(px - 3.5, yb) + " Z", lin("va", [[0, "#ff9a4d"], [.5, "#e8590c"], [1, "#a63c06"]], 0, 0, 1, 0), bordo(L, .6));
    s += rett(px - 5.1, pt - .4, 10.2, 1.9, .6, lin("vb", [[0, "#ffa86a"], [1, "#d9480f"]], 0, 0, 1, 0), bordo(L, .55)) + tratto("M" + q(px - 3.4, pt + 2.6) + " L" + q(px - 2.8, yb - .9), "#ffffff", .5, op(.55));
    return s;
  });

  // MENSOLA DEI TROFEI: noce scuro lucido coi tappi d'ottone, le squadrette d'ottone; la coppa d'oro grande
  // con la stella, quella d'argento e quella di bronzo sui piedistalli di marmo, e la medaglia col nastro tricolore
  def("mensola_trofei", { nome: "Mensola dei trofei", prezzo: 900, reparto: "quadri", giu: 5 }, function () {
    var Y = 101, x0 = 5, x1 = 57, yb = Y - 1.1, s = "";
    var OROk = ["#fff6cc", "#f5c842", "#c08a1c", "#7a5410"], ARGk = ["#ffffff", "#dfe5e9", "#98a4ac", "#5c6770"], BRONk = ["#ffd9b0", "#e08a45", "#a8521c", "#5e2a0c"];
    function coppa(cx, k, z, stella, n) {   // z = grandezza; n = il posto sul podio; il marmo nero con la targhetta, il piede, la coppa coi manici, il riflesso
      var t = "", ry = yb - 18.5 * z, met = lin("m" + k[1].slice(1), [[0, k[0]], [.35, k[1]], [.75, k[2]], [1, k[3]]], 0, 0, 1, 0);
      t += rett(cx - 4.6 * z + 1.3, yb - 17 * z, 9 * z, 17 * z, 2, "#000", op(.08));   // l'ombra sul muro
      t += rett(cx - 4.6 * z, yb - 3.4 * z, 9.2 * z, 3.4 * z, .5, lin("mn", [[0, "#5a606a"], [1, "#1f2226"]], 0, 0, 0, 1), bordo(L, .45)) + rett(cx - 4.2 * z, yb - 3.2 * z, 8.4 * z, .5, 0, "#ffffff", op(.25));
      t += rett(cx - 2.6 * z, yb - 2.5 * z, 5.2 * z, 1.5 * z, .2, lin("tg", ORO, 0, 0, 0, 1), bordo(L, .25)) + "<text x='" + f1(cx) + "' y='" + f1(yb - 1.25 * z) + "' text-anchor='middle' font-family='Arial,Helvetica,sans-serif' font-weight='900' font-size='" + f2(1.25 * z) + "' fill='#5a3d10'>" + n + "°</text>";
      t += rett(cx - 3.1 * z, yb - 4.5 * z, 6.2 * z, 1.15 * z, .4, met, bordo(L, .4));
      t += pth("M" + q(cx - 1.1 * z, yb - 4.5 * z) + " L" + q(cx - .45 * z, yb - 7.2 * z) + " L" + q(cx + .45 * z, yb - 7.2 * z) + " L" + q(cx + 1.1 * z, yb - 4.5 * z) + " Z", met, bordo(L, .4)) + ell(cx, yb - 7.6 * z, 1.3 * z, .7 * z, met, bordo(L, .4));
      t += pth("M" + q(cx - .5 * z, yb - 8 * z) + " L" + q(cx - 1.6 * z, yb - 9.8 * z) + " L" + q(cx + 1.6 * z, yb - 9.8 * z) + " L" + q(cx + .5 * z, yb - 8 * z) + " Z", met, bordo(L, .4));
      var man = "M" + q(cx - 4.8 * z, ry + 1.6 * z) + " C" + q(cx - 8.4 * z, ry + 1.2 * z) + " " + q(cx - 8 * z, ry + 6.6 * z) + " " + q(cx - 3.4 * z, ry + 7.4 * z) + " M" + q(cx + 4.8 * z, ry + 1.6 * z) + " C" + q(cx + 8.4 * z, ry + 1.2 * z) + " " + q(cx + 8 * z, ry + 6.6 * z) + " " + q(cx + 3.4 * z, ry + 7.4 * z);
      t += tratto(man, L, 1.9 * z) + tratto(man, k[1], 1.05 * z) + tratto(man, k[0], .35 * z, op(.8) + " " + sp(-.2, -.2));   // i manici
      var cup = "M" + q(cx - 5.2 * z, ry) + " Q" + q(cx - 5.2 * z, ry + 7.6 * z) + " " + q(cx, ry + 8.8 * z) + " Q" + q(cx + 5.2 * z, ry + 7.6 * z) + " " + q(cx + 5.2 * z, ry) + " Z";
      t += pth(cup, met, bordo(L, .55));
      if (stella) { var sx2 = cx - .2 * z, sy2 = ry + 4.2 * z, st = ""; for (var j = 0; j < 10; j++) { var rr = j % 2 ? 1 * z : 2.2 * z, aa = -Math.PI / 2 + j * Math.PI / 5; st += (j ? " L" : "M") + q(sx2 + Math.cos(aa) * rr, sy2 + Math.sin(aa) * rr); } t += pth(st + " Z", lin("st", [[0, "#fffbe6"], [1, "#e0a92a"]], 0, 0, 1, 1), bordo(scuro(k[2], .3), .35)); }
      else t += tratto("M" + q(cx - 4.6 * z, ry + 2.6 * z) + " Q" + q(cx, ry + 3.4 * z) + " " + q(cx + 4.6 * z, ry + 2.6 * z), k[3], .35, op(.6));
      t += ell(cx, ry, 5.2 * z, 1.1 * z, lin("bo" + k[1].slice(1), [[0, k[3]], [.6, k[2]], [1, k[1]]], 0, 0, 0, 1), bordo(L, .5)) + tratto("M" + q(cx - 4.6 * z, ry - .5 * z) + " Q" + q(cx, ry - 1.3 * z) + " " + q(cx + 4.6 * z, ry - .5 * z), "#ffffff", .3, op(.7));   // la bocca della coppa
      t += pth("M" + q(cx - 3.9 * z, ry + 1.4 * z) + " Q" + q(cx - 3.8 * z, ry + 5.4 * z) + " " + q(cx - 1.6 * z, ry + 7.3 * z) + " Q" + q(cx - 3 * z, ry + 4.6 * z) + " " + q(cx - 3.1 * z, ry + 1.4 * z) + " Z", "#ffffff", op(.75));   // il riflesso
      return t;
    }
    s += pth("M" + q(x0 + 1.5, Y + 3.6) + " L" + q(x1 + 1, Y + 3.6) + " L" + q(x1 + 3.6, Y + 9.5) + " L" + q(x0 + 4, Y + 9.5) + " Z", "#000", op(.08)) + pth("M" + q(x0 + 1.5, Y + 3.6) + " L" + q(x1 + 1, Y + 3.6) + " L" + q(x1 + 2.4, Y + 6.5) + " L" + q(x0 + 2.8, Y + 6.5) + " Z", "#000", op(.08));
    s += squadretta(13, Y, -1, OTTONE) + squadretta(49, Y, 1, OTTONE);
    s += ripiano(x0, x1, Y, ["#8a5530", "#5e3519"], { seme: 13, lucido: true });
    s += rett(x0 - .3, Y - .2, 2.2, 4.2, .5, lin("tp", ORO, 0, 0, 1, 0), bordo(L, .45)) + rett(x1 - 1.9, Y - .2, 2.2, 4.2, .5, lin("tp", ORO, 0, 0, 1, 0), bordo(L, .45));   // i tappi d'ottone
    s += coppa(13.8, ARGk, 1, false, 2) + coppa(47.8, BRONk, .84, false, 3) + coppa(31, OROk, 1.24, true, 1);
    s += scintilla(26.6, yb - 21.4, 1.8, "#ffffff", .95) + scintilla(36.4, yb - 13, 1.1, "#ffffff", .8) + scintilla(11.2, yb - 15.4, 1.1, "#ffffff", .8);
    // la medaglia col nastro tricolore, appesa al bordo
    var mx = 9.6, my = Y + 9.6;
    s += pth("M" + q(mx - 2.2, Y + .6) + " L" + q(mx - .7, Y + .6) + " L" + q(mx + .5, my - 2) + " L" + q(mx - .8, my - 2) + " Z", "#2f9e44", bordo(L, .3)) + pth("M" + q(mx - .7, Y + .6) + " L" + q(mx + .7, Y + .6) + " L" + q(mx + .6, my - 2) + " L" + q(mx - .6, my - 2) + " Z", "#ffffff", bordo(L, .3)) +
      pth("M" + q(mx + .7, Y + .6) + " L" + q(mx + 2.2, Y + .6) + " L" + q(mx + .8, my - 2) + " L" + q(mx - .5, my - 2) + " Z", "#e03131", bordo(L, .3));
    s += cer(mx + .6, my + .8, 2.5, "#000", op(.15)) + cer(mx, my, 2.5, rad("me", [[0, "#fff6cc"], [.5, "#f5c842"], [1, "#9a6b12"]], .38, .35, .72), bordo(L, .5)) + cer(mx, my, 1.7, "none", "stroke='#b8861f' stroke-width='.35'") + scintilla(mx, my, 1.2, "#fffbe6", .95);
    return s;
  });

  // =========================================================
  //  SPECCHIO CON LE LUCI (da camerino): la cornice bianca laccata, il vetro incassato, cinque lampadine
  //  tonde per parte negli anelli cromati; di notte le lampadine accese e il vetro che riflette la luce calda
  // =========================================================
  def("specchio_luci", { nome: "Specchio con le luci", prezzo: 1100, reparto: "quadri", giu: 7, luce: [31, 80, 105, "#fff3c4"] }, function () {
    var x = 8, y = 50, w = 46, h = 60, gx = 15.4, gy = 56.2, gw = 31.2, gh = 47.6, s = "", i;
    function lampadina(bx, by) {
      var r = 2.25, t = cer(bx + .5, by + .7, r + .7, "#000", op(.12)) + cer(bx, by, r + .8, lin("ps", CROMO, 0, 0, 1, 1), bordo(L, .4));
      if (NOTTE) return t + cer(bx, by, r + 5.2, rad("hl", [[0, "#fffbe8", .95], [.35, "#ffeeb0", .55], [1, "#ffeeb0", 0]], .5, .5, .5)) + cer(bx, by, r, rad("ln", [[0, "#ffffff"], [.6, "#fffdf2"], [1, "#ffe7a3"]], .45, .42, .6), bordo("#c9a34a", .35));
      return t + cer(bx, by, r, rad("lb", [[0, "#ffffff"], [.55, "#f3f0e8"], [1, "#c9c2b4"]], .38, .35, .75), bordo(L, .4)) + cer(bx - .75, by - .75, .55, "#ffffff", op(.95)) + tratto("M" + q(bx - .6, by + .2) + " L" + q(bx + .6, by + .2), "#b9b09d", .25, op(.8));
    }
    s += ombraD(rettD(x, y, w, h, 4.5), 2.2, 3);
    s += pth(rettD(x, y, w, h, 4.5), lin("fr", [[0, "#ffffff"], [.5, "#f2f4f6"], [1, "#c9d1d7"]], 0, 0, 1, 1), bordo(L, 1.5));
    s += pth(rettD(x + 1.1, y + 1.1, w - 2.2, h - 2.2, 3.6), "none", "stroke='#ffffff' stroke-width='.8' " + op(.95)) + pth(rettD(x + 1.1, y + 1.1, w - 2.2, h - 2.2, 3.6), "none", "stroke='#a9b4bc' stroke-width='.4' " + op(.6) + " " + sp(.5, .6));
    if (NOTTE) s += pth(rettD(x, y, w, h, 4.5), "#ffe2a0", op(.22));   // di notte la cornice prende la luce calda
    s += pth(rettD(gx - .9, gy - .9, gw + 1.8, gh + 1.8, 2.8), lin("in", [[0, "#a9b4bc"], [1, "#ffffff"]], 0, 0, 1, 1));   // il bordo incassato
    var vetro = rettD(gx, gy, gw, gh, 2.2);
    s += pth(vetro, NOTTE ? lin("vn", [[0, "#fff8e6"], [.5, "#f1dcb6"], [1, "#d2b184"]], 0, 0, .4, 1) : lin("vg", [[0, "#eef8fc"], [.5, "#c6e2ee"], [1, "#9ac8d8"]], 0, 0, .4, 1), bordo(L, .8));
    s += dentro(vetro, rett(gx, gy + gh * .72, gw, gh * .28, 0, NOTTE ? "#c9a67a" : "#7fb3c6", op(.22)) + tratto("M" + q(gx, gy + gh) + " L" + q(gx, gy) + " L" + q(gx + gw, gy), "#2a4a55", 1.6, op(.16)) +
      poly([[gx + 6, gy], [gx + 14, gy], [gx, gy + 20], [gx, gy + 8]], "#ffffff", op(.6)) + poly([[gx + 18, gy], [gx + 21, gy], [gx, gy + 31], [gx, gy + 26.5]], "#ffffff", op(.4)) + poly([[gx + gw, gy + gh - 16], [gx + gw, gy + gh - 10], [gx + gw - 9, gy + gh], [gx + gw - 15, gy + gh]], "#ffffff", op(.25)));
    for (i = 0; i < 5; i++) { var by = gy + 2.4 + i * (gh - 4.8) / 4; s += lampadina(x + 3.7, by) + lampadina(x + w - 3.7, by); }
    return s;
  });

  // =========================================================
  //  PIANTA APPESA: il gancio al soffitto, la corda col cerchio di legno, la rete di macramè coi nodi, il vaso
  //  arancio smaltato, il pothos con le foglie a cuore che ricadono e la nappa di fili sotto
  // =========================================================
  def("pianta_appesa", { nome: "Pianta appesa", prezzo: 450, reparto: "piante" }, function () {
    var cx = 31, s = "", r = rnd(101), i, pt = 70.5, pb = 88, C = "#efe3c8", CS = "#b9a684";
    function corda(d, w) { return tratto(d, L, (w || .8) + .7) + tratto(d, C, w || .8) + tratto(d, CS, (w || .8) * .5, "stroke-dasharray='.5 .7' " + op(.8)); }
    function nodo(x, y, k) { k = k || 1; return ell(x, y, 1.15 * k, 1.5 * k, lin("nd", [[0, "#fff8e8"], [1, "#cdbb98"]], 0, 0, 1, 1), bordo(L, .45)) + tratto("M" + q(x - .8 * k, y - .4 * k) + " L" + q(x + .8 * k, y + .2 * k) + " M" + q(x - .8 * k, y + .4 * k) + " L" + q(x + .8 * k, y + 1 * k), CS, .3); }
    function foglia(fx, fy, l, ang, k) {   // la foglia a cuore del pothos (k = un po' di giallo)
      var d = "M0," + f1(-.12 * l) + " C" + f1(-.25 * l) + "," + f1(.08 * l) + " " + f1(-.62 * l) + "," + f1(-.2 * l) + " " + f1(-.5 * l) + "," + f1(-.55 * l) + " C" + f1(-.4 * l) + "," + f1(-.85 * l) + " " + f1(-.1 * l) + "," + f1(-.95 * l) + " 0," + f1(-l) +
        " C" + f1(.1 * l) + "," + f1(-.95 * l) + " " + f1(.4 * l) + "," + f1(-.85 * l) + " " + f1(.5 * l) + "," + f1(-.55 * l) + " C" + f1(.62 * l) + "," + f1(-.2 * l) + " " + f1(.25 * l) + "," + f1(.08 * l) + " 0," + f1(-.12 * l) + " Z";
      return "<g transform='translate(" + f1(fx) + " " + f1(fy) + ") rotate(" + f1(ang) + ")'>" + pth(d, lin("fo", [[0, "#8ce99a"], [.5, "#40c057"], [1, "#2b8a3e"]], 0, 0, 1, 1), bordo(L, .45)) +
        (k ? pth("M0," + f1(-.3 * l) + " Q" + f1(-.28 * l) + "," + f1(-.5 * l) + " " + f1(-.2 * l) + "," + f1(-.75 * l), "none", "stroke='#e9fac8' stroke-width='" + f2(.12 * l) + "' stroke-linecap='round' " + op(.7)) : "") +
        tratto("M0," + f1(-.14 * l) + " L0," + f1(-.86 * l), "#d3f9d8", .3, op(.85)) + "</g>";
    }
    function tralcio(x0, y0, x1, y1, curva, n, seme) {   // un ramo che ricade, con le foglie alterne sempre più piccole
      var rr = rnd(seme), d = "M" + q(x0, y0) + " Q" + q(x0 + curva, (y0 + y1) / 2) + " " + q(x1, y1), t = tratto(d, "#2b8a3e", .7) + tratto(d, "#69db7c", .3, op(.8)), j;
      for (j = 1; j <= n; j++) {
        var u = j / (n + .3), px2 = (1 - u) * (1 - u) * x0 + 2 * (1 - u) * u * (x0 + curva) + u * u * x1, py2 = (1 - u) * (1 - u) * y0 + 2 * (1 - u) * u * (y0 + y1) / 2 + u * u * y1, lato = j % 2 ? -1 : 1;
        t += foglia(px2, py2, 5.4 - u * 2.6, 180 + lato * (55 + rr() * 25), rr() < .4);
      }
      return t;
    }
    // il gancio al soffitto e la corda (tutto il resto è appeso 5 più in basso)
    var gancio = ell(cx, 0, 3, 1.5, lin("pl", CROMO, 0, 0, 1, 1), bordo(L, .5)) + tratto("M" + q(cx, 1.2) + " L" + q(cx, 3) + " Q" + q(cx, 4.6) + " " + q(cx - 1.4, 4.4), L, 1.3) + tratto("M" + q(cx, 1.2) + " L" + q(cx, 3) + " Q" + q(cx, 4.6) + " " + q(cx - 1.4, 4.4), "#9aa6ae", .6) + corda("M" + q(cx - .3, 4.2) + " L" + q(cx, 44.6), 1);
    // l'ombra sul muro (il vaso sta un po' staccato)
    s += pth("M" + q(cx - 10.8, pt) + " L" + q(cx + 10.8, pt) + " C" + q(cx + 10.8, pt + 9) + " " + q(cx + 7, pb) + " " + q(cx, pb) + " C" + q(cx - 7, pb) + " " + q(cx - 10.8, pt + 9) + " " + q(cx - 10.8, pt) + " Z", "#000", op(.1) + " " + sp(3.2, 5));
    // il cerchio di legno e la legatura
    s += cer(cx, 41.4, 2.1, "none", "stroke='" + L + "' stroke-width='1.6'") + cer(cx, 41.4, 2.1, "none", "stroke='#c99a5c' stroke-width='.95'") + tratto(arco(cx, 41.4, 2.1, 200, 280), "#f1d3a3", .4);
    s += rett(cx - 1.5, 43.2, 3, 4.2, 1.2, lin("lg", [[0, "#fff8e8"], [1, "#cdbb98"]], 0, 0, 1, 0), bordo(L, .45)) + tratto("M" + q(cx - 1.4, 44.4) + " H" + f1(cx + 1.4) + " M" + q(cx - 1.4, 45.6) + " H" + f1(cx + 1.4) + " M" + q(cx - 1.4, 46.8) + " H" + f1(cx + 1.4), CS, .3);
    // le corde della rete: dietro il vaso quelle di lato, davanti le due che si incrociano
    var cL = "M" + q(cx - 1, 47.3) + " Q" + q(cx - 7, 58) + " " + q(cx - 10.3, pt), cR = "M" + q(cx + 1, 47.3) + " Q" + q(cx + 7, 58) + " " + q(cx + 10.3, pt);
    var cFL = "M" + q(cx - .4, 47.4) + " Q" + q(cx - 2.6, 59) + " " + q(cx - 3.6, pt), cFR = "M" + q(cx + .4, 47.4) + " Q" + q(cx + 2.6, 59) + " " + q(cx + 3.6, pt);
    s += corda(cL) + corda(cR) + corda(cFL) + corda(cFR) + nodo(cx - 5.3, 57.5) + nodo(cx + 5.3, 57.5) + nodo(cx - 2.4, 58.4, .85) + nodo(cx + 2.4, 58.4, .85);
    // le foglie dietro, che spuntano dal vaso
    s += foglia(cx - 7, pt - .5, 6.2, -58, false) + foglia(cx + 7.4, pt - .6, 6.2, 60, true) + foglia(cx - 3, pt - 1.4, 6.6, -22, false) + foglia(cx + 3.2, pt - 1.6, 6.8, 18, false) + foglia(cx, pt - 1.2, 7.2, -2, true);
    // il vaso smaltato con la fascia a puntini
    var vaso = "M" + q(cx - 10.8, pt) + " L" + q(cx + 10.8, pt) + " C" + q(cx + 10.8, pt + 9) + " " + q(cx + 7, pb) + " " + q(cx, pb) + " C" + q(cx - 7, pb) + " " + q(cx - 10.8, pt + 9) + " " + q(cx - 10.8, pt) + " Z";
    s += pth(vaso, lin("va", [[0, "#ffa060"], [.45, "#e8590c"], [1, "#9c3505"]], 0, 0, 1, 0), bordo(L, .9));
    s += dentro(vaso, rett(cx - 11, pt + 5.2, 22, 2.6, 0, "#fff3e0") + tratto("M" + q(cx - 11, pt + 6.5) + " H" + f1(cx + 11), "#e8590c", .9, "stroke-dasharray='0 1.8'") + ell(cx - 6.4, pt + 7, 1.3, 5, "#ffffff", op(.35)) + ell(cx + 4, pb - 1, 7, 2.6, "#000", op(.12)));
    s += rett(cx - 11.6, pt - 1.6, 23.2, 2.6, 1.3, lin("vb", [[0, "#ffb27a"], [1, "#c94a08"]], 0, 0, 1, 0), bordo(L, .7)) + tratto("M" + q(cx - 10.4, pt - 1) + " H" + f1(cx + 9), "#ffffff", .4, op(.6));
    // davanti al vaso: le due corde incrociate, i nodi, la legatura sotto e la nappa
    s += corda("M" + q(cx - 3.6, pt + .6) + " Q" + q(cx - 1.5, pt + 9) + " " + q(cx + 2.4, pb - .6)) + corda("M" + q(cx + 3.6, pt + .6) + " Q" + q(cx + 1.5, pt + 9) + " " + q(cx - 2.4, pb - .6)) + nodo(cx, pt + 9.4, .9);
    s += corda("M" + q(cx - 10.4, pt + .6) + " Q" + q(cx - 9.5, pt + 12) + " " + q(cx - 1.2, pb + 1.4)) + corda("M" + q(cx + 10.4, pt + .6) + " Q" + q(cx + 9.5, pt + 12) + " " + q(cx + 1.2, pb + 1.4));
    var fr = "";
    for (i = 0; i < 11; i++) { var fx = cx - 2.6 + i * .52, ex = cx - 4.6 + i * .92 + (r() - .5) * .6, ey = pb + 15 + (r() - .5) * 2.4; fr += "M" + q(fx, pb + 4) + " Q" + q(fx + (ex - fx) * .3, pb + 9) + " " + q(ex, ey) + " "; }
    s += tratto(fr, L, 1.05) + tratto(fr, C, .55);
    s += rett(cx - 1.9, pb - .4, 3.8, 4.8, 1.4, lin("lg", [[0, "#fff8e8"], [1, "#cdbb98"]], 0, 0, 1, 0), bordo(L, .5)) + tratto("M" + q(cx - 1.8, pb + 1) + " H" + f1(cx + 1.8) + " M" + q(cx - 1.8, pb + 2.4) + " H" + f1(cx + 1.8), CS, .3);
    // le foglie davanti al bordo e i tralci che ricadono
    s += tralcio(cx - 9, pt + .2, cx - 18, 121, -6, 7, 3) + tralcio(cx - 5, pt + .6, cx - 10, 132, 2, 8, 5) + tralcio(cx + 6, pt + .6, cx + 11, 127, -1, 8, 7) + tralcio(cx + 9.6, pt + .2, cx + 18, 114, 5, 6, 11);
    s += foglia(cx - 9.6, pt + .4, 5.6, -112, false) + foglia(cx + 9.8, pt + .4, 5.6, 115, true) + foglia(cx - 4.6, pt + .6, 5.4, -160, false) + foglia(cx + 4.4, pt + .8, 5.2, 165, false);
    return gancio + "<g transform='translate(0 5)'>" + s + "</g>";
  });

  // =========================================================
  //  CUORE AL NEON: il tubo a forma di cuore su una lastra di plexiglas trasparente con quattro distanziali
  //  cromati; di giorno vetro rosa spento, di notte rosa acceso con l'alone
  // =========================================================
  def("neon_cuore", { nome: "Cuore al neon", prezzo: 900, reparto: "luci", giu: 6, luce: [31, 80, 100, "#ff6b9d"] }, function () {
    var x = 8.5, y = 58, w = 45, h = 42, s = "", c = "#ff4d8d", lastra = rettD(x, y, w, h, 3);
    s += pth(lastra, "#000", op(.07) + " " + sp(1.8, 2.6));   // l'ombra leggera della lastra
    if (NOTTE) s += cer(31, 80, 24, rad("ag", [[0, "#ff4d8d", .28], [1, "#ff4d8d", 0]], .5, .5, .5));
    s += pth(lastra, NOTTE ? "#ffd6e8" : "#ffffff", op(NOTTE ? .16 : .22)) + pth(lastra, "none", "stroke='#ffffff' stroke-width='.8' " + op(.85)) + pth(lastra, "none", bordo(L, .45) + " " + op(.35));
    s += tratto("M" + q(x + 1.3, y + h - 5) + " L" + q(x + 1.3, y + 3) + " Q" + q(x + 1.3, y + 1.3) + " " + q(x + 3, y + 1.3) + " L" + q(x + w - 7, y + 1.3), "#ffffff", .55, op(.95));   // il filo di luce sul bordo
    [[x + 3, y + 3], [x + w - 3, y + 3], [x + 3, y + h - 3], [x + w - 3, y + h - 3]].forEach(function (v) { s += cer(v[0] + .5, v[1] + .7, 1.3, "#000", op(.15)) + cer(v[0], v[1], 1.25, lin("vt", CROMO, 0, 0, 1, 1), bordo(L, .4)) + cer(v[0] - .35, v[1] - .35, .35, "#ffffff"); });
    var d = "M" + q(31.7, 95) + " C" + q(41, 89) + " " + q(48.6, 82) + " " + q(48.2, 74.4) + " C" + q(47.8, 67.4) + " " + q(42, 63.6) + " " + q(37.2, 64.6) + " C" + q(34, 65.3) + " " + q(32, 67.6) + " " + q(31, 70) +
      " C" + q(30, 67.6) + " " + q(28, 65.3) + " " + q(24.8, 64.6) + " C" + q(20, 63.6) + " " + q(14.2, 67.4) + " " + q(13.8, 74.4) + " C" + q(13.4, 82) + " " + q(21, 89) + " " + q(30.3, 95);
    s += neon(d, c, 2.1, true);
    s += rett(29.3, 94.6, 1.5, 2.4, .4, "#3b3b44", bordo(L, .3)) + rett(31.2, 94.6, 1.5, 2.4, .4, "#3b3b44", bordo(L, .3));   // gli elettrodi
    [[13.9, 74.4, 0], [48.1, 74.4, 0], [21.6, 88.6, 40], [40.4, 88.6, -40], [31, 69.4, 90]].forEach(function (g) { s += "<g " + gira(g[2], g[0], g[1]) + ">" + rett(g[0] - 1.6, g[1] - .7, 3.2, 1.4, .5, "#ffffff", op(.5) + " " + bordo(L, .25)) + "</g>"; });   // le mollette che tengono il tubo
    return s;
  });

  // =========================================================
  //  INSEGNA AL NEON "BAR" (larga due pezzi di muro): il pannello nero col bordo d'acciaio e le viti, la scritta
  //  BAR rosa, il bicchiere da cocktail azzurro con l'oliva verde, lo svolazzo giallo e le stelline
  // =========================================================
  def("insegna_bar", { nome: "Insegna al neon BAR", prezzo: 1200, reparto: "bar", largo: 2, giu: 4, luce: [62, 73, 135, "#ff8fd8"] }, function () {
    var x = 8, y = 50, w = 108, h = 46, t = 2.3, s = "", r = rnd(131), i;
    var pann = rettD(x, y, w, h, 4.5), dent = rettD(x + t, y + t, w - 2 * t, h - 2 * t, 3);
    s += ombraD(pann, 2.2, 3);
    s += pth(pann, lin("cr", [[0, "#ffffff"], [.25, "#dfe4e8"], [.6, "#a3aeb6"], [1, "#6d7882"]], 0, 0, .3, 1), bordo(L, 1.5));
    s += pth(dent, lin("pn", [[0, "#2c2e35"], [1, "#0f1013"]], 0, 0, 0, 1)) + pth(dent, "none", bordo("#000", .6));
    var sp2 = "";
    for (i = 0; i < 22; i++) { var yy = y + t + 1 + i * 1.9; sp2 += "M" + q(x + t + 1, yy) + " L" + q(x + w - t - 1, yy + (r() - .5) * .3) + " "; }
    s += dentro(dent, tratto(sp2, "#ffffff", .2, op(.035)) + tratto("M" + q(x + t, y + t + .6) + " H" + f1(x + w - t), "#000", 1.4, op(.4)) + (NOTTE ? ell(48, 72, 40, 18, rad("ri", [[0, "#ff4fb8", .22], [1, "#ff4fb8", 0]], .5, .5, .5)) + ell(97, 72, 16, 16, rad("rc", [[0, "#3bc9db", .2], [1, "#3bc9db", 0]], .5, .5, .5)) : ""));
    [[x + 3.6, y + 3.6], [x + w - 3.6, y + 3.6], [x + 3.6, y + h - 3.6], [x + w - 3.6, y + h - 3.6]].forEach(function (v) { s += vite(v[0], v[1], .95); });
    var dB = scritta("BAR", 18, 58.6, 24, 2.6);
    s += neon(dB, "#ff4fb8", 2.4);
    s += neon("M" + q(19, 89) + " Q" + q(36, 92.6) + " " + q(52, 89.6) + " Q" + q(66, 87.2) + " " + q(79.5, 88.6), "#ffd43b", 1.5);   // lo svolazzo
    var gl = "M" + q(86.2, 61) + " L" + q(107.8, 61) + " L" + q(97, 74.2) + " Z M" + q(97, 74.2) + " L" + q(97, 85.6) + " M" + q(91, 86.2) + " L" + q(103, 86.2);
    s += neon(gl, "#3bc9db", 2) + neon("M" + q(89.6, 65.2) + " L" + q(104.4, 65.2), "#3bc9db", 1.2) + neon("M" + q(94.6, 59.4) + " L" + q(104.6, 70.4), "#ff4fb8", 1.1) + neon(cerD(101.8, 67.4, 1.75), "#94d82d", 1.4);
    [[84, 78.6, 2.8], [110.2, 57.4, 2.1], [13, 57.2, 1.9]].forEach(function (st) { var sx = st[0], sy = st[1], k = st[2], a = k * .16; s += neon("M" + q(sx, sy - k) + " Q" + q(sx + a, sy - a) + " " + q(sx + k, sy) + " Q" + q(sx + a, sy + a) + " " + q(sx, sy + k) + " Q" + q(sx - a, sy + a) + " " + q(sx - k, sy) + " Q" + q(sx - a, sy - a) + " " + q(sx, sy - k) + " Z", "#ffd43b", .85); });   // le stelline
    s += tratto("M" + q(x + 2, y + 1.6) + " Q" + q(x + 1.4, y + 1.4) + " " + q(x + 1.4, y + 4) + " L" + q(x + 1.4, y + h - 6), "#ffffff", .6, op(.9));
    return s;
  });

  // =========================================================
  //  FILO DI LUCINE (largo due pezzi di muro): il filo verde attaccato a tre chiodini, due festoni, le lampadine
  //  colorate a goccia (rosso, giallo, verde, azzurro, rosa); di notte accese, ognuna col suo alone
  // =========================================================
  def("lucine", { nome: "Filo di lucine", prezzo: 350, reparto: "luci", largo: 2, luce: [62, 52, 125, "#ffe066"] }, function () {
    var s = "", cols = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#f783ac"], k = 0, i;
    var A = [5, 39], B = [62, 35.5], C = [119, 39], c1 = [33.5, 80], c2 = [91, 77];
    function punto(P0, P1, P2, u) { return [(1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * P1[0] + u * u * P2[0], (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * P1[1] + u * u * P2[1]]; }
    function bulbo(bx, by, c) {   // il portalampada verde e la lampadina a goccia
      var b0 = by + 2.7, g = "M" + q(bx - 1.9, b0) + " C" + q(bx - 2.25, b0 + 2.6) + " " + q(bx - .8, b0 + 4.9) + " " + q(bx, b0 + 5.9) + " C" + q(bx + .8, b0 + 4.9) + " " + q(bx + 2.25, b0 + 2.6) + " " + q(bx + 1.9, b0) + " Z", t = "";
      if (NOTTE) t += cer(bx, b0 + 3, 8, rad("al" + c.slice(1), [[0, chiaro(c, .5), .9], [.3, c, .5], [1, c, 0]], .5, .5, .5));
      else t += pth(g, "#000", op(.13) + " " + sp(1.4, 2.4));
      t += rett(bx - 1.05, by - .4, 2.1, 3.4, .6, lin("zo", [[0, "#5a9a63"], [1, "#1f4a26"]], 0, 0, 1, 0), bordo(L, .35)) + tratto("M" + q(bx - 1, by + .8) + " H" + f1(bx + 1) + " M" + q(bx - 1, by + 1.8) + " H" + f1(bx + 1), "#163a1c", .25);
      t += pth(g, NOTTE ? rad("bn" + c.slice(1), [[0, "#ffffff"], [.38, chiaro(c, .5)], [1, c]], .45, .35, .7) : lin("bg" + c.slice(1), [[0, chiaro(c, .45)], [.5, c], [1, scuro(c, .3)]], 0, 0, 1, 0), bordo(NOTTE ? scuro(c, .15) : L, .45));
      return t + ell(bx - .75, b0 + 1.6, .45, 1.4, "#ffffff", op(NOTTE ? .95 : .8));
    }
    var filo = "M" + q(A) + " Q" + q(c1) + " " + q(B) + " Q" + q(c2) + " " + q(C);
    if (!NOTTE) s += tratto(filo, "#000", 1, op(.13) + " " + sp(1.6, 2.6));
    s += tratto(filo, L, 1.6) + tratto(filo, "#2f5a34", .95) + tratto(filo, "#86c98d", .28, op(.6) + " " + sp(-.15, -.2));
    s += chiodo(A[0], A[1]) + chiodo(B[0], B[1]) + chiodo(C[0], C[1]);
    [[A, c1, B], [B, c2, C]].forEach(function (sg) { for (i = 1; i <= 7; i++) { var pp = punto(sg[0], sg[1], sg[2], i / 8); s += bulbo(pp[0], pp[1], cols[k++ % 5]); } });
    return s;
  });

  // =========================================================
  //  LAMPADARIO DI CRISTALLO (appeso al soffitto): la coppa al soffitto e la catena d'oro lunga, la corona,
  //  la "tenda" di fili di perline intorno alla colonna col vaso di cristallo, sei bracci a ricciolo con le candele
  //  e le lampadine a fiamma, i festoni di perline, le gocce a prisma, il "sacchetto" di perline e la grande sfera
  //  sfaccettata in fondo; di notte tutto acceso e scintillante
  // =========================================================
  def("lampadario", { nome: "Lampadario di cristallo", prezzo: 1800, reparto: "luci", luce: [31, 70, 140, "#fff3c4"] }, function () {
    var cx = 31, s = "", c = "", i, Y0 = 44, YN = 50, K = 1.1, ORO2 = NOTTE ? [[0, "#fff8d8"], [.4, "#ffd75e"], [1, "#b8861f"]] : ORO;   // il corpo è disegnato da Y0, poi ingrandito K volte e appeso a YN
    var oro = lin("or", ORO2, 0, 0, 1, 1), oroH = lin("oh", ORO2, 0, 0, 1, 0), cri = lin("cr", NOTTE ? [[0, "#ffffff"], [.5, "#fffbea"], [1, "#e9dcc0"]] : [[0, "#ffffff"], [.45, "#e3f3fb"], [1, "#a9cfe0"]], 0, 0, 1, 1);
    function tubo(d, w) { return tratto(d, L, w + 1) + tratto(d, NOTTE ? "#f2c94c" : "#d9a530", w) + tratto(d, "#fff6cc", w * .35, op(.85) + " " + sp(-.2, -.25)); }
    function goccia(gx, gy, l) { return pth("M" + q(gx, gy) + " L" + q(gx + .7 * l / 3, gy + l * .45) + " L" + q(gx, gy + l) + " L" + q(gx - .7 * l / 3, gy + l * .45) + " Z", cri, bordo("#6f9fb5", .25)) + tratto("M" + q(gx, gy + .3) + " L" + q(gx, gy + l - .3), "#ffffff", .2, op(.8)); }
    function perline(P0, P1, P2, n, k) {   // un filo di perline di cristallo (k = grandezza)
      var t = "", j; k = k || 1;
      for (j = 0; j <= n; j++) { var u = j / n, px = (1 - u) * (1 - u) * P0[0] + 2 * (1 - u) * u * P1[0] + u * u * P2[0], py = (1 - u) * (1 - u) * P0[1] + 2 * (1 - u) * u * P1[1] + u * u * P2[1], gr = k >= 1 && j % 4 === 2; t += cer(px, py, (gr ? .78 : .5) * k, NOTTE ? "#fffdf2" : "#eef8ff", "stroke='#5a8fa8' stroke-width='.2'") + (gr ? cer(px - .25, py - .25, .22, "#ffffff") : ""); }
      return t;
    }
    function candela(px, py, z) {   // la coppetta, le gocce sotto, la candela e la lampadina a fiamma (z = grandezza)
      var t = ell(px, py + .8 * z, 2.3 * z, .7 * z, scuro("#b8861f", .1), bordo(L, .35)) + ell(px, py, 3 * z, .95 * z, oroH, bordo(L, .45));
      [-2.4, 0, 2.4].forEach(function (o) { t += goccia(px + o * z, py + .6 * z, 3.2 * z); });
      t += rett(px - 1.05 * z, py - 5.6 * z, 2.1 * z, 5.6 * z, .5, lin("cd", [[0, "#ffffff"], [1, "#e6d9bb"]], 0, 0, 1, 0), bordo(L, .35)) + pth("M" + q(px - 1.05 * z, py - 5.2 * z) + " Q" + q(px - .6 * z, py - 3.8 * z) + " " + q(px - .3 * z, py - 5.1 * z) + " Z", "#ffffff");
      var fl = "M" + q(px, py - 10.4 * z) + " C" + q(px + 1.5 * z, py - 8.6 * z) + " " + q(px + 1.6 * z, py - 6.8 * z) + " " + q(px, py - 5.7 * z) + " C" + q(px - 1.6 * z, py - 6.8 * z) + " " + q(px - 1.5 * z, py - 8.6 * z) + " " + q(px, py - 10.4 * z) + " Z";
      if (NOTTE) t += cer(px, py - 7.8 * z, 5.6 * z, rad("ha", [[0, "#fffbe6", .95], [.35, "#ffe9a0", .5], [1, "#ffe9a0", 0]], .5, .5, .5)) + pth(fl, rad("fn", [[0, "#ffffff"], [.5, "#fff6cf"], [1, "#ffd27a"]], .5, .6, .6), bordo("#d9a530", .3));
      else t += pth(fl, lin("fv", [[0, "#ffffff"], [.6, "#f6f1e4"], [1, "#d9cfb6"]], 0, 0, 1, 0), bordo(L, .35)) + tratto("M" + q(px, py - 6 * z) + " L" + q(px, py - 8.2 * z), "#c9a86a", .25) + ell(px - .45 * z, py - 8.3 * z, .3 * z, .8 * z, "#ffffff", op(.95));
      return t;
    }
    // la coppa al soffitto e la catena
    s += pth("M" + q(cx - 5.5, 0) + " Q" + q(cx - 5.5, 3.6) + " " + q(cx, 3.8) + " Q" + q(cx + 5.5, 3.6) + " " + q(cx + 5.5, 0) + " Z", oro, bordo(L, .6)) + tratto("M" + q(cx - 4, 1.2) + " Q" + q(cx - 3.4, 2.6) + " " + q(cx - 1.2, 2.9), "#ffffff", .4, op(.8));
    for (i = 0; i < 18; i++) { var yy = 4.2 + i * 2.6; s += i % 2 ? rett(cx - .45, yy, .9, 2.6, .4, oroH, bordo(L, .3)) : ell(cx, yy + 1.3, .95, 1.45, "none", "stroke='" + L + "' stroke-width='.9'") + ell(cx, yy + 1.3, .95, 1.45, "none", "stroke='#e0b54a' stroke-width='.45'"); }
    // la corona in cima, con le punte e le perline
    for (i = 0; i < 5; i++) { var kx = cx - 4 + i * 2; c += pth("M" + q(kx - .7, 47) + " L" + q(kx, 44.6) + " L" + q(kx + .7, 47) + " Z", oro, bordo(L, .3)) + cer(kx, 44.4, .45, "#eef8ff", "stroke='#7fb0c6' stroke-width='.2'"); }
    c += ell(cx, 47.6, 5, 1.3, oroH, bordo(L, .5));
    // i bracci di dietro (più in alto e più piccoli), con le loro candele
    c += tubo("M" + q(cx - 3, 66.6) + " C" + q(cx - 6, 66) + " " + q(cx - 8.8, 65.4) + " " + q(cx - 8.6, 62.8), 1) + tubo("M" + q(cx + 3, 66.6) + " C" + q(cx + 6, 66) + " " + q(cx + 8.8, 65.4) + " " + q(cx + 8.6, 62.8), 1);
    c += candela(cx - 8.6, 62.2, .85) + candela(cx + 8.6, 62.2, .85);
    // la colonna: pomello, collo, il vaso di cristallo, pomello, collo
    c += ell(cx, 50.2, 2, 1.3, oro, bordo(L, .45)) + rett(cx - .8, 50.8, 1.6, 2.6, .3, oroH, bordo(L, .35));
    var urna = "M" + q(cx - 2.8, 53.4) + " C" + q(cx - 3.8, 56) + " " + q(cx - 3.6, 59.6) + " " + q(cx - 1.6, 61) + " L" + q(cx + 1.6, 61) + " C" + q(cx + 3.6, 59.6) + " " + q(cx + 3.8, 56) + " " + q(cx + 2.8, 53.4) + " Z";
    c += pth(urna, cri, bordo("#6f9fb5", .4) + " fill-opacity='.92'") + tratto("M" + q(cx - 1.2, 53.8) + " L" + q(cx - 1.5, 60.4) + " M" + q(cx + 1.2, 53.8) + " L" + q(cx + 1.5, 60.4), "#7fb0c6", .2) + tratto("M" + q(cx - 2.3, 54.6) + " Q" + q(cx - 2.9, 57.6) + " " + q(cx - 1.6, 59.8), "#ffffff", .45, op(.9));
    c += ell(cx, 61.6, 2.4, 1.2, oro, bordo(L, .45)) + rett(cx - .7, 62.2, 1.4, 3.2, .3, oroH, bordo(L, .35));
    // la tenda di perline dalla corona al piatto
    [-4, -2, 0, 2, 4].forEach(function (o) { c += perline([cx + o, 48.6], [cx + o * 1.9, 57.5], [cx + o * 1.5, 66.2], 13, .8); });
    // il piatto dei bracci
    c += ell(cx, 68.3, 6.4, 2, scuro("#b8861f", .2), bordo(L, .5)) + ell(cx, 67.5, 6.4, 2, oroH, bordo(L, .5)) + tratto("M" + q(cx - 5.2, 66.9) + " Q" + q(cx, 65.5) + " " + q(cx + 5.2, 66.9), "#fff6cc", .4, op(.8));
    // i bracci di fuori e quelli davanti, a ricciolo, ognuno con la sua goccia
    var bracci = [[cx - 5.6, 68.2, cx - 12, 75.6, cx - 20.6, 74.2, cx - 22.2, 66.4], [cx + 5.6, 68.2, cx + 12, 75.6, cx + 20.6, 74.2, cx + 22.2, 66.4], [cx - 3.8, 69, cx - 6.6, 77, cx - 11.4, 76, cx - 12.2, 70], [cx + 3.8, 69, cx + 6.6, 77, cx + 11.4, 76, cx + 12.2, 70]];
    bracci.forEach(function (b) {
      c += tubo("M" + q(b[0], b[1]) + " C" + q(b[2], b[3]) + " " + q(b[4], b[5]) + " " + q(b[6], b[7]), 1.3);
      var mxx = (b[2] + b[4]) / 2, myy = (b[3] + b[5]) / 2 + 1.2, v = b[0] < cx ? -1 : 1;
      c += tratto("M" + q(mxx, myy - 1) + " a1,1 0 1,1 " + q(v * 1.2, 1.6), L, 1) + tratto("M" + q(mxx, myy - 1) + " a1,1 0 1,1 " + q(v * 1.2, 1.6), "#e0b54a", .5) + goccia(mxx + v * .6, myy + 1.2, 3.4);
    });
    // i festoni di perline: dai bracci di fuori a quelli davanti, e da quelli davanti alla colonna
    c += perline([cx - 22.2, 67.2], [cx - 17.4, 79], [cx - 12.2, 70.8], 12) + perline([cx + 22.2, 67.2], [cx + 17.4, 79], [cx + 12.2, 70.8], 12);
    c += perline([cx - 12.2, 70.8], [cx - 8, 81], [cx - 3.2, 76.4], 10) + perline([cx + 12.2, 70.8], [cx + 8, 81], [cx + 3.2, 76.4], 10);
    c += candela(cx - 22.2, 65.8, 1.05) + candela(cx + 22.2, 65.8, 1.05) + candela(cx - 12.2, 69.4, 1.12) + candela(cx + 12.2, 69.4, 1.12);
    // la pancia sotto il piatto, le gocce tutt'intorno, il sacchetto di perline
    c += pth("M" + q(cx - 4.4, 69) + " C" + q(cx - 4.4, 74) + " " + q(cx - 1.6, 78) + " " + q(cx, 80.5) + " C" + q(cx + 1.6, 78) + " " + q(cx + 4.4, 74) + " " + q(cx + 4.4, 69) + " Z", oroH, bordo(L, .5)) + tratto("M" + q(cx - 3.6, 72) + " Q" + q(cx, 73.4) + " " + q(cx + 3.6, 72), "#7a5410", .35) + tratto("M" + q(cx - 3.2, 70) + " Q" + q(cx - 3, 74) + " " + q(cx - 1, 77.4), "#fff6cc", .45, op(.8));
    [-5.6, -3.8, -1.9, 0, 1.9, 3.8, 5.6].forEach(function (o) { c += goccia(cx + o, 69.4 - Math.abs(o) * .12, Math.abs(o) > 4 ? 3.4 : 4.2); });
    [[-5.6, 69.4], [-2.8, 70], [2.8, 70], [5.6, 69.4]].forEach(function (o) { c += perline([cx + o[0], o[1] + 3], [cx + o[0] * 1.15, 78], [cx + o[0] * .1, 81.4], 8, .75); });
    // il festone grande davanti, la sfera e l'ultima goccia
    c += perline([cx - 12.2, 70.8], [cx, 96.5], [cx + 12.2, 70.8], 22);
    c += cer(cx, 81.6, 1.1, oro, bordo(L, .35)) + tratto("M" + q(cx, 82.6) + " L" + q(cx, 83.4), "#9cc7dd", .3);
    var sf = cerD(cx, 86.6, 3.3);
    c += pth(sf, rad("sf", NOTTE ? [[0, "#ffffff"], [.6, "#fff8e6"], [1, "#e6d3a8"]] : [[0, "#ffffff"], [.55, "#e3f3fb"], [1, "#94c2d6"]], .38, .32, .78), bordo("#5f8fa5", .45));
    c += dentro(sf, tratto("M" + q(cx - 3.3, 86.6) + " L" + q(cx + 3.3, 86.6) + " M" + q(cx, 83.3) + " L" + q(cx, 89.9) + " M" + q(cx - 2.3, 84.3) + " L" + q(cx + 2.3, 88.9) + " M" + q(cx + 2.3, 84.3) + " L" + q(cx - 2.3, 88.9), "#7fb0c6", .22, op(.8)) + ell(cx - 1.2, 85.2, 1, 1.4, "#ffffff", op(.85)));
    c += goccia(cx, 89.8, 6.4);
    // i luccichii (di notte di più, con un po' d'arcobaleno)
    var gl = [[cx - 1.2, 85.2, 1.8], [cx - 17, 76.6, 1.2], [cx + 9, 80, 1.1], [cx - 2.4, 56.4, 1.3], [cx + 22, 70.6, 1], [cx + 4.6, 60, 1]];
    if (NOTTE) gl = gl.concat([[cx + 4, 92, 1.4], [cx - 9, 79.4, 1.1], [cx + 17.6, 77.4, 1.3], [cx - 22, 70.4, 1.1], [cx + 3, 75.6, 1], [cx - 5.4, 63, 1]]);
    gl.forEach(function (g) { c += scintilla(g[0], g[1], g[2], "#ffffff", .95); });
    if (NOTTE) [["#ff8fd8", cx - 6, 88], ["#74e0ff", cx + 7.4, 86], ["#ffe066", cx - 14, 82], ["#b2f2bb", cx + 14.6, 81], ["#d0bfff", cx + 2, 64]].forEach(function (g) { c += cer(g[1], g[2], .6, g[0], op(.9)); });
    s += "<g transform='translate(" + cx + " " + YN + ") scale(" + K + ") translate(" + (-cx) + " " + (-Y0) + ")'>" + c + "</g>";
    return s;
  });

  // =========================================================
  //  MAPPA DEL MONDO (larga due pezzi di muro): cornice di noce col filetto d'oro, la carta color crema col bordo
  //  a scacchi dei gradi, i continenti coi loro colori (contorni semplificati ma veri, proiezione di Miller),
  //  i meridiani e i paralleli, l'equatore, le montagne, la rosa dei venti, il veliero e la puntina sull'Italia
  // =========================================================
  // le terre: [longitudine, latitudine, …]
  var TERRE = {
    na: [-168, 65.6, -166, 68.9, -162, 70.3, -156.8, 71.3, -150, 70.5, -141, 69.7, -134, 69.5, -128, 70.2, -120, 69.2, -112, 67.8, -104, 68.2, -97, 67.8, -93, 69.3, -88, 68.6, -84.5, 69.8, -81.5, 67.3, -85.5, 66.3, -88, 64.2, -93.5, 61.5, -94.5, 58.8, -92, 57.1, -88.5, 56.6, -84.5, 55.2, -82.3, 52.9,
      -79.5, 51.4, -78.8, 54.5, -76.7, 56.6, -77.6, 60.3, -78, 62.4, -73.5, 62.2, -70, 61, -69.5, 59, -66.5, 58.6, -64.7, 60.3, -61.8, 56.5, -57.5, 54.5, -55.8, 52.2, -57.5, 51.2, -60.5, 50.2, -66.5, 50.2, -70.5, 47.2, -65, 48.8, -64.6, 47, -61.2, 45.6, -60, 46.1, -63.6, 44.5, -65.8, 43.5, -66.5, 45.1,
      -70.2, 43.6, -70.6, 41.7, -74, 40.6, -75.9, 37.1, -75.5, 35.2, -78.5, 33.8, -81, 31.8, -80.2, 27.3, -80.4, 25.2, -81.8, 26.1, -82.7, 27.6, -84.3, 30, -86.5, 30.4, -89.1, 30.3, -89.3, 29.1, -91.5, 29.5, -94.2, 29.6, -97.2, 27.6, -97.6, 24.5, -97.4, 21.9, -96.1, 19.2, -94.5, 18.2, -91.2, 18.6,
      -90.4, 21, -87.2, 21.5, -87.6, 19.4, -88.3, 18, -88.4, 15.9, -85, 15.9, -83.3, 15, -83.6, 11.2, -81.8, 9, -79.6, 9.6, -77.5, 8.7, -77.9, 7.2, -80.1, 7.3, -80.4, 8.3, -82.8, 8.3, -85.8, 10.2, -85.7, 11.2, -87.6, 13.1, -90.5, 13.9, -93.5, 15.8, -96.5, 15.7, -100, 17.1, -103.5, 18.3, -105.5, 20.4,
      -105.6, 22.8, -108.5, 25.6, -110.6, 27.9, -112.2, 29.6, -114.8, 31.8, -113, 29, -111, 25.6, -109.9, 23.1, -112, 24.8, -114.2, 27.8, -115.8, 30.4, -117.1, 32.5, -118.5, 34, -120.6, 34.6, -122.5, 37.6, -124.2, 40.4, -124.1, 43.5, -124, 46.3, -124.7, 48.4, -123, 49, -125, 50.3, -127.5, 51,
      -130.3, 54.5, -133, 57, -136.5, 58.5, -140, 59.8, -144, 60.1, -146.5, 61, -149.5, 59.5, -151.8, 59.2, -154, 57.5, -156.5, 56.3, -159.5, 55.2, -164, 54.6, -160, 55.9, -157.5, 57.6, -158.5, 58.8, -162, 58.6, -162, 59.9, -165, 60.9, -165.2, 62.5, -164.7, 63.4, -161, 63.6, -161.5, 64.4, -165, 64.5, -166.5, 65.2],
    sa: [-77.5, 8.7, -76.8, 8.6, -75.5, 10.6, -74.2, 11.2, -72, 12.3, -71, 11, -69.8, 11.6, -68.2, 10.5, -66, 10.6, -64, 10.5, -61.9, 10.7, -61.6, 9.6, -60, 8.5, -58.5, 7, -56.5, 5.9, -54, 5.8, -52, 4.9, -51.1, 3.8, -50, 1.8, -49.8, .3, -48.4, -1.1, -46.5, -.9, -44.2, -2.4, -41.5, -2.9, -39, -3.6,
      -37.2, -4.9, -35.3, -5.4, -34.8, -7.1, -35.1, -8.9, -37, -11, -38.8, -13.2, -39.1, -17.6, -40.3, -20.4, -41, -22, -42, -22.9, -44.6, -23.1, -46.4, -24, -48.5, -25.9, -48.7, -28.6, -50.3, -30.6, -52.2, -32.2, -53.4, -33.8, -54.9, -34.9, -56.8, -34.7, -58.4, -34.4, -57.1, -36.4, -57.6, -38.2,
      -61.5, -38.9, -62.3, -39.6, -62.2, -40.7, -65.2, -41, -64.8, -42.2, -63.6, -42.6, -65, -43.3, -65.5, -45, -67.6, -46.4, -65.9, -47.9, -67.8, -49.5, -69, -50.9, -68.4, -52.4, -66.5, -54.6, -68.2, -55.4, -70.5, -55.2, -72.5, -53.8, -74.6, -52.5, -75.4, -50, -75.6, -47.5, -74.5, -45, -74.1, -43.2,
      -73.7, -41.7, -73.5, -39, -73.6, -37.2, -72.8, -35.6, -71.6, -33, -71.5, -30, -71.2, -27.6, -70.4, -23.6, -70.1, -21.4, -70.3, -18.4, -71.4, -17.6, -75.2, -15.5, -76.3, -13.8, -77.2, -12, -78.6, -9.4, -79.6, -7.2, -81.2, -6.1, -81.3, -4.5, -80.3, -3.4, -80.9, -2.2, -80.4, -.7, -80, .9,
      -78.8, 1.7, -77.8, 2.6, -77.4, 4.2, -77.4, 6.5, -77.9, 7.2],
    gr: [-73, 78.2, -66, 80.5, -60, 82, -50, 82.6, -40, 83.4, -30, 83.5, -22, 82.5, -18, 81, -18, 77.5, -20, 75, -22, 72.5, -24, 70.5, -27, 68.5, -32, 68, -36, 65.8, -40, 65, -42, 62.5, -43.5, 60, -46, 60.8, -49, 62.5, -51, 64.5, -53, 66.5, -54, 69, -52, 70.8, -55, 72, -57, 74.5, -60, 76, -66, 76.5, -71, 77.2],
    eu: [65.5, 69, 60.5, 69.7, 57, 68.6, 54, 68.6, 50, 67.9, 44, 68.4, 43.5, 66.4, 40.8, 65.2, 37.5, 64.2, 34.5, 64.6, 33.6, 66.6, 37, 66.3, 41, 66.6, 40, 68, 36, 69, 33, 69.4, 30, 69.8, 28.5, 70.9, 25.8, 71.1, 21, 70.2, 18, 69.6, 14, 68.3, 12.3, 65.5, 9.5, 63.6, 5, 62, 5, 60, 5.6, 58.8, 7, 58, 8.5, 58.3,
      10.5, 59.4, 11.2, 58.4, 12.5, 56.6, 12.9, 55.4, 14.2, 55.4, 15.8, 56.1, 16.6, 57.8, 18.8, 59.4, 17.2, 61.5, 17.8, 63, 20.3, 63.8, 22.2, 65.6, 25.2, 65.4, 25, 64.1, 21.6, 63, 21.3, 60.8, 23, 59.9, 26, 60.4, 29.8, 60.2, 28.5, 59.6, 25.2, 59.5, 23.4, 59.1, 23.5, 58.2, 24.4, 57.5, 24.1, 57.1, 21.6, 57.4,
      21, 56.2, 21.2, 55.2, 19.6, 54.5, 18.6, 54.5, 16.5, 54.5, 14.2, 53.9, 12, 54.3, 10.8, 54.2, 10.2, 55.2, 10.6, 56.4, 10.6, 57.7, 8.6, 57.1, 8.1, 55.5, 8.9, 53.9, 7, 53.6, 4.8, 53, 4.2, 52, 3.3, 51.4, 1.9, 51, .2, 49.7, -1.3, 49.6, -1.9, 49.7, -1.6, 48.6, -3.1, 48.8, -4.7, 48.4, -4.4, 47.8,
      -2.3, 47.2, -1.2, 46.2, -1.2, 44.7, -1.6, 43.4, -3.8, 43.5, -7.5, 43.8, -9.3, 43.1, -8.9, 42.1, -8.7, 40.6, -9.5, 38.8, -8.8, 38.1, -8.9, 37, -7.4, 37.2, -6.2, 36.5, -5.6, 36, -4.4, 36.7, -2.2, 36.7, -.6, 37.6, .2, 38.8, -.3, 39.5, .9, 40.8, 3.2, 41.9, 3.1, 43.1, 4.6, 43.4, 6.4, 43.1, 7.6, 43.8,
      8.8, 44.4, 10.2, 43.9, 10.6, 42.9, 11.8, 42.1, 12.6, 41.4, 13.9, 41.2, 14.3, 40.7, 15.6, 40.1, 15.8, 39.2, 15.7, 38.2, 16.1, 38, 16.6, 38.6, 17.1, 39.2, 16.6, 40, 17.2, 40.5, 18, 40.2, 18.4, 39.8, 18.5, 40.2, 17.9, 40.7, 16.9, 41.1, 15.9, 41.5, 16.2, 41.9, 15.2, 41.9, 14.2, 42.5, 13.6, 43.5,
      12.4, 44.3, 12.3, 45.2, 13.1, 45.7, 13.8, 45.6, 13.6, 45.1, 14.3, 45.2, 15.1, 44.4, 15.9, 43.6, 17.1, 43.1, 18.5, 42.4, 19.4, 41.8, 19.5, 40.4, 20.1, 39.6, 20.7, 38.8, 21.1, 37.8, 21.7, 36.8, 22.5, 36.4, 23.2, 36.4, 22.8, 37.5, 24, 38, 23, 38.9, 22.9, 39.4, 22.6, 40.4, 23.7, 40.2, 24.4, 40.9,
      26, 40.8, 26.3, 40.3, 26.7, 40.5, 28.9, 41.05, 28.2, 41.6, 27.9, 42.6, 28.6, 43.8, 29.7, 45.2, 30.6, 46.4, 31.8, 46.5, 33.6, 46.1, 32.5, 45.4, 33.6, 44.5, 35, 44.8, 36.6, 45.4, 37.4, 44.7, 38.6, 44.3, 39.7, 43.6, 42.4, 43.3, 44.5, 42.7, 46.5, 41.9, 48.6, 41.8, 47.5, 43, 46.8, 44.5, 47.6, 45.6,
      49.2, 46.4, 51.5, 47.1, 51.4, 49.3, 51.4, 51.2, 55, 51.8, 57.5, 51.2, 59, 52.5, 59, 54.5, 59.3, 57, 59.4, 60, 59.6, 63, 61, 65, 64, 67],
    as: [65.5, 69, 66.8, 70.6, 68.5, 71.6, 69.5, 72.9, 72.5, 72.8, 74.5, 72.6, 78, 72.3, 80.5, 73.6, 86.5, 74.4, 90, 75.5, 98, 76.2, 104.3, 77.7, 107, 76.8, 113.5, 73.5, 118, 73.3, 123, 73.1, 127, 73.3, 129, 71.8, 132, 71.3, 139, 72.1, 140, 72.8, 146, 72.3, 150, 71.5, 152.5, 70.8, 159, 70.7,
      161, 69.6, 166, 69.6, 170, 70, 176, 69.8, 180, 68.9, 180, 65.3, 177, 64.7, 178.5, 63, 174, 61.8, 170.5, 60, 166, 60.1, 163.7, 59.9, 162.5, 56.4, 160, 53, 156.7, 51, 156, 53.5, 155.6, 56, 157.5, 58, 160.5, 61, 157, 61.7, 154, 59.2, 151, 59.3, 147, 59.4, 143, 59.3, 141, 58.6, 138, 56.5,
      137.5, 54.3, 139.6, 54.1, 141.4, 52.6, 141, 51, 140.5, 48.5, 138.5, 46.8, 135.7, 44, 133, 42.8, 131.8, 43.1, 130.7, 42.3, 129.7, 41, 129.4, 37.2, 129.3, 35.3, 127.5, 34.6, 126.4, 34.4, 126.6, 35.9, 126.6, 37.4, 125.2, 37.8, 125.1, 39.3, 124.4, 39.9, 121.2, 38.8, 122.2, 40.5, 121, 40.8,
      120, 40.2, 119.2, 39.4, 118, 39.1, 117.7, 38.4, 118.8, 37.6, 119.6, 37.1, 120.7, 37.8, 122.5, 37.4, 120.4, 36.1, 119.2, 34.8, 120.3, 34.3, 120.9, 32.3, 121.9, 31.1, 121.9, 29.9, 121.5, 28.4, 119.7, 25.9, 118, 24.5, 116.6, 23.2, 114.2, 22.3, 111.8, 21.6, 110.4, 21.3, 110.2, 20.3, 109.7, 21.6,
      108, 21.5, 106.7, 20.6, 105.8, 18.9, 106.6, 17.5, 108.4, 15.5, 109.3, 13.2, 109.2, 11.6, 107.9, 10.7, 106.6, 9.8, 104.8, 8.6, 104.9, 10.3, 103.5, 10.6, 102.9, 11.8, 101.3, 12.7, 100.3, 13.4, 99.9, 12.4, 99.2, 10.5, 100.2, 8.7, 100.4, 7.2, 101.3, 6.9, 102.2, 6.2, 103.4, 4.8, 103.4, 3.2,
      104.2, 1.5, 103.5, 1.3, 102.3, 2.2, 101.3, 2.9, 100.5, 4.6, 100.3, 5.9, 99.4, 7.5, 98.3, 8, 98.4, 9.8, 98.6, 12.3, 97.7, 15.9, 97.3, 16.6, 95.5, 15.8, 94.3, 16, 94.2, 18.7, 93.5, 19.9, 92.4, 20.7, 91.8, 22.3, 90.7, 22.1, 89.1, 21.7, 87.1, 20.9, 86.4, 19.9, 85, 19.3, 83.5, 18, 82.3, 16.6,
      81.3, 15.9, 80.2, 15.4, 80.3, 13.4, 79.9, 11.3, 79.8, 10.3, 78.9, 9.3, 77.6, 8.1, 76.6, 8.8, 76.1, 10.4, 75.4, 11.9, 74.8, 12.9, 74.1, 14.8, 73.5, 16, 72.9, 18.9, 72.7, 20.8, 72.6, 21.4, 72.2, 21.9, 71, 20.8, 70, 21, 68.9, 22.3, 69.9, 22.9, 68.6, 23.4, 67.4, 23.9, 66.9, 24.9, 64.5, 25.2,
      61.6, 25.2, 59.3, 25.4, 57.3, 25.7, 56.4, 27.1, 54.7, 26.5, 52.6, 27.3, 51.4, 28, 50.3, 29.8, 48.6, 30, 47.9, 29.4, 48.5, 28, 49.6, 26.9, 50.2, 25.8, 51.2, 26.1, 51.6, 25.2, 51.4, 24.4, 52.6, 24.2, 54.2, 24.1, 55.6, 25.1, 56.3, 26.3, 56.4, 24.8, 57.3, 23.9, 58.6, 23.6, 59.8, 22.4, 58.6, 20.6,
      57.8, 19.5, 56.6, 18.4, 55, 17, 52.3, 15.9, 49.1, 14.5, 47.4, 13.6, 45, 12.8, 43.4, 12.7, 42.8, 14.6, 42.6, 16.5, 41.2, 18.5, 39.4, 20.9, 38.7, 22.6, 37.2, 25.4, 35.6, 27.6, 34.9, 29.5, 34.3, 27.9, 32.6, 29.9, 32.3, 31.2, 34.2, 31.3, 34.9, 32.8, 35.5, 34.2, 35.9, 35.6, 36.2, 36.6, 34.7, 36.8,
      33.6, 36.2, 32.3, 36.1, 30.6, 36.8, 29.6, 36.2, 28.2, 36.7, 27.4, 37.3, 26.5, 38.4, 26.8, 39.3, 26.1, 39.9, 27.5, 40.35, 29.9, 40.7, 29.1, 41.1, 30.4, 41.2, 31.6, 41.3, 33.3, 42, 35.1, 42, 36.4, 41.3, 38.4, 40.9, 40, 41, 41.5, 41.5, 41.7, 42.4, 40.3, 43.1, 39.7, 43.6, 42.4, 43.3, 44.5, 42.7,
      46.5, 41.9, 48.6, 41.8, 47.5, 43, 46.8, 44.5, 47.6, 45.6, 49.2, 46.4, 51.5, 47.1, 51.4, 49.3, 51.4, 51.2, 55, 51.8, 57.5, 51.2, 59, 52.5, 59, 54.5, 59.3, 57, 59.4, 60, 59.6, 63, 61, 65, 64, 67],
    af: [32.3, 31.2, 31, 31.6, 29.9, 31.2, 28, 31.1, 25.2, 31.6, 23.2, 32.2, 21, 32.8, 20.1, 32.2, 19.9, 31, 18.6, 30.4, 17, 31, 15.5, 31.5, 15.2, 32.3, 13.2, 32.9, 11.5, 33.2, 10.2, 33.7, 10.9, 34.8, 11.1, 35.6, 10.6, 36.5, 11.1, 37, 10.2, 37.2, 9.2, 37.3, 8.5, 36.9, 6.4, 37.1, 5, 36.8, 3.1, 36.8,
      1.3, 36.5, 0, 35.9, -1.2, 35.4, -2.2, 35.1, -3.2, 35.3, -5.3, 35.9, -6, 35.8, -6.4, 35, -6.8, 34, -7.6, 33.6, -8.6, 33.2, -9.3, 32.3, -9.8, 31.3, -9.6, 30.4, -10.2, 29.5, -11.4, 28.2, -12.9, 27.9, -13.6, 26.8, -14.5, 25.8, -15.4, 24.5, -16.1, 23.7, -16.9, 21.9, -17.1, 20.8, -16.3, 19.5,
      -16.1, 18, -16.3, 16.6, -16.8, 15.6, -17.5, 14.7, -16.8, 13.6, -16.7, 12.4, -15.4, 11.3, -14.7, 10.6, -13.3, 9.5, -12.5, 7.6, -11.4, 6.9, -10.3, 6.3, -9, 5.1, -7.5, 4.4, -6, 4.9, -4, 5.2, -2, 4.8, 0, 5.6, 1.6, 6.2, 3.4, 6.4, 4.6, 6.2, 5.6, 5.3, 6.4, 4.3, 7.4, 4.4, 8.5, 4.5, 9.2, 3.9,
      9.8, 2.9, 9.8, 1.2, 9.3, 0, 8.8, -1.2, 9.6, -2.5, 10.9, -3.6, 11.8, -4.8, 12.3, -6.1, 12.9, -7.6, 13.3, -8.8, 13.6, -10.4, 13.7, -11.9, 12.4, -13.5, 11.8, -16, 11.7, -17.5, 12.6, -19, 13.4, -20.8, 14.4, -22.5, 14.6, -25.2, 15.2, -27, 16.4, -28.6, 17.2, -30.5, 17.9, -31.5, 18.3, -33,
      18.4, -34.1, 19.4, -34.6, 20, -34.8, 21.8, -34.4, 22.8, -33.9, 25, -34, 25.7, -33.9, 26.9, -33.6, 28.3, -32.6, 29.6, -31.3, 31, -29.9, 32.4, -28.6, 32.9, -26.3, 32.6, -25.9, 33.6, -25.3, 35.4, -24.2, 35.5, -22, 35.3, -21.3, 34.7, -19.8, 36.2, -18.8, 37.4, -17.6, 39.5, -16.5, 40.7, -14.6,
      40.5, -12.6, 40.4, -10.4, 39.6, -8.2, 39.3, -6.8, 38.9, -5.1, 39.7, -4, 40.2, -2.6, 41.5, -1.7, 42.8, -.3, 44.1, 1.4, 45.6, 2.3, 46.9, 3.5, 48, 5, 49.1, 6.9, 50.2, 9.2, 50.8, 10.6, 51.3, 11.8, 49.3, 11.3, 47.6, 11.1, 45.1, 10.5, 43.6, 11.6, 43.2, 11.5, 42.4, 12.5, 41.6, 13.5, 40.6, 14.8,
      39.5, 15.6, 38.6, 17.5, 37.4, 18.9, 37.2, 20.8, 36.6, 22.4, 35.6, 23.9, 35.2, 24.6, 34.4, 26.4, 33.6, 27.6, 32.6, 29.9],
    oc: [113.5, -22, 114, -26.5, 115, -29.5, 115.7, -32, 115, -34.3, 118, -35, 123.5, -33.9, 126, -32.3, 129, -31.6, 131.2, -31.5, 134.2, -32.8, 135.6, -34.8, 137.6, -33, 137.5, -35.2, 138.5, -35.6, 140, -37.9, 143.5, -38.8, 146.4, -39.1, 150, -37.5, 151.2, -33.9, 153.6, -28.2, 153, -25.3,
      150.8, -22.5, 149, -20.5, 146, -18, 145.4, -15, 143.5, -14, 142.5, -10.7, 141.6, -13, 141.5, -16.8, 140.5, -17.5, 139, -17, 136.8, -15.8, 136.5, -12.2, 132.5, -11.5, 130.8, -12.5, 129.5, -14.8, 128, -14.9, 126, -13.8, 125, -14.6, 123.6, -17, 122.2, -18, 118.8, -20.3, 116.7, -20.6]
  };
  var ISOLE = [
    ["na", [-78, 73.5, -71, 71.4, -67, 69.6, -62.5, 67, -64.2, 64.8, -65.5, 63, -68.5, 62.5, -72.5, 64.2, -77.5, 64.4, -74.5, 67.4, -80, 69.6, -85.5, 70.2, -89.5, 71.5, -85.5, 73.5]],
    ["na", [-95, 76.5, -88, 75.6, -80, 76.4, -77.5, 78, -73, 79, -68, 80.3, -62, 82, -70, 83, -84, 82.8, -92, 81.2, -96, 79.8, -93, 78, -96, 77.2]],
    ["na", [-118, 70.5, -114, 73, -106, 73.2, -102, 72, -101.5, 69.8, -106, 68.9, -113, 68.5, -117, 69.4]],
    ["na", [-125.5, 71.8, -123.5, 74.2, -116.5, 73.6, -119, 71.4]],
    ["na", [-101.5, 73.6, -93, 74.1, -90.5, 73.4, -94.5, 71.9, -99.5, 71.4]],
    ["na", [-116, 75.6, -106, 76.3, -98, 76.4, -99.5, 75.2, -110, 74.9]],
    ["na", [-87.5, 64.2, -86, 65.8, -82, 65, -80.8, 63.9, -84.3, 62.9]],
    ["na", [-59.4, 47.6, -56, 51.6, -55.4, 49.5, -52.7, 47.6, -53.6, 46.6, -56, 47.6]],
    ["na", [-85, 21.8, -82, 23.2, -77.5, 21.8, -74.2, 20.2, -77.7, 19.9, -81.7, 22.2]],
    ["na", [-74.5, 18.5, -72.8, 19.9, -68.4, 19, -68.7, 18.2, -71.5, 17.6, -72.8, 18.2]],
    ["eu", [-5.7, 50, -3, 50.6, 1.4, 51.2, 1.7, 52.7, .3, 53.5, -.2, 54.5, -1.6, 55.6, -2, 57.6, -3.3, 58.6, -5, 58.6, -6.2, 57.5, -5.6, 56.3, -4.9, 55, -3.1, 54.9, -3.3, 54, -3, 53.3, -4.6, 53.2, -4.2, 52.5, -5.3, 51.8, -3.2, 51.4]],
    ["eu", [-6, 52.2, -6.2, 53.5, -5.6, 54.6, -7.3, 55.4, -8.5, 54.5, -10.2, 54, -9.5, 52.6, -10.4, 51.8, -8.4, 51.6]],
    ["eu", [-24, 64.9, -22, 66.4, -16, 66.5, -13.6, 65.2, -15, 64.3, -18.8, 63.4, -22.7, 63.8]],
    ["eu", [12.4, 38, 15.6, 38.3, 15.1, 36.7, 12.6, 37.6]],
    ["eu", [8.2, 41, 9.7, 41, 9.6, 39.1, 8.4, 39]],
    ["eu", [9.4, 43, 9.5, 42, 9.2, 41.4, 8.6, 41.9]],
    ["eu", [23.5, 35.6, 26.3, 35.3, 24.5, 34.9]],
    ["eu", [11, 79.5, 16, 80, 22, 80.3, 27, 80, 21, 78.3, 16.5, 77, 14, 77.8]],
    ["eu", [52, 71.5, 55.5, 73.3, 60, 75.5, 68.5, 76.8, 64, 75, 57, 71, 53.5, 70.6]],
    ["as", [32.3, 35, 34.6, 35.6, 33.9, 34.6]],
    ["as", [142, 54.2, 143.2, 51.5, 143.5, 49, 142, 46, 141.8, 49.5]],
    ["as", [130.9, 34, 132.5, 35.4, 135.5, 35.6, 136.8, 37.4, 139.5, 38.2, 140, 40.5, 141.5, 41.4, 142, 39.5, 141, 38.3, 140.9, 36, 140, 35, 138.8, 34.6, 137, 34.6, 135.2, 33.8, 133, 34.3]],
    ["as", [129.8, 33.7, 131, 33.9, 131.9, 32.7, 131.1, 31.4, 130.2, 31.3, 129.6, 32.5]],
    ["as", [140, 41.5, 141.2, 42.4, 143.3, 42, 145.5, 43.3, 144.2, 44, 141.9, 45.4, 141.6, 43.5, 140.3, 43.2]],
    ["as", [121, 25.2, 122, 25, 121, 22, 120.2, 23]],
    ["as", [108.6, 19.2, 110.5, 20.1, 111, 19.6, 109.6, 18.2]],
    ["as", [120.6, 18.5, 122.2, 18.5, 122, 16.5, 121.6, 15, 122, 14, 124, 12.6, 123.3, 13, 120.6, 14.3, 120, 16]],
    ["as", [122, 11.8, 125.5, 12.4, 125.5, 10, 123.5, 9.4, 122, 10.6]],
    ["as", [122, 7, 123.8, 8.3, 126.2, 9.3, 126.5, 7, 125.4, 5.6, 124, 6.3]],
    ["as", [79.9, 9.8, 81.9, 7.5, 81.2, 6.1, 80.1, 6.2]],
    ["as", [95.3, 5.6, 97.5, 5.2, 100.5, 2, 104, -1, 106, -3.2, 105.8, -5.8, 102.3, -4, 100.3, -.9, 98.7, 1.7]],
    ["as", [105.2, -6.8, 106, -5.9, 108.3, -6.3, 111, -6.4, 112.6, -6.9, 114.5, -7.7, 114.4, -8.6, 110, -8.1, 106.5, -7.4]],
    ["as", [109, 1.5, 109.6, -1, 110.2, -2.9, 114.6, -4, 116.5, -2.5, 117.7, .7, 119, 1, 117.8, 4.1, 119.2, 5.3, 117, 7, 115.4, 5, 113, 3.2, 111, 1.6]],
    ["as", [119.4, -5.5, 118.8, -3, 119.6, -.5, 120.3, .9, 124.8, 1.5, 121, .6, 120.5, -1.2, 123.4, -.9, 121.5, -1.9, 122, -4.8, 120.9, -3.5, 120.4, -5.6]],
    ["as", [124, -9.3, 127.2, -8.4, 125, -10.3]],
    ["oc", [131, -1.4, 134, -.9, 138, -1.6, 141, -2.6, 144.5, -3.8, 146, -5.5, 147.8, -6.3, 150.5, -10.5, 147.5, -10, 145.3, -7.9, 143.3, -9, 141, -9.1, 138.5, -8.3, 137.8, -5.3, 135, -4.4, 132.8, -4.1, 131.9, -2.8]],
    ["oc", [144.6, -40.7, 148.3, -41, 148, -43.2, 146.5, -43.6, 145.2, -42.2]],
    ["oc", [172.7, -34.4, 175.5, -37, 178.5, -37.7, 176.8, -39.6, 175.2, -41.5, 174.5, -39.8, 173.8, -39.2, 174.6, -36.8]],
    ["oc", [172.7, -40.5, 174.3, -41.7, 173, -43.8, 171.2, -44.4, 169, -46.6, 166.5, -46, 168.5, -44, 171.5, -41.8]],
    ["af", [49.3, -12, 50.5, -15.5, 49.7, -17, 47.5, -24.5, 45.2, -25.5, 43.5, -22, 44.4, -16.5, 46.5, -15.5]]
  ];
  var LAGHI = [   // il Caspio e i Grandi Laghi
    [48.6, 41.8, 47.5, 43, 46.8, 44.5, 47.6, 45.6, 49.2, 46.4, 51.5, 47.1, 53.2, 46.7, 53, 45.3, 51.3, 45, 50.4, 44.4, 51.3, 43.2, 52.7, 41.8, 53, 40, 53.9, 38.9, 53.9, 37.4, 51.8, 36.6, 50.2, 37.4, 49, 38.4, 49.3, 39.5, 49.5, 40.2, 50.3, 40.4, 49.6, 40.6],
    [-92, 46.7, -89, 48.2, -86, 48.7, -84.6, 47, -87, 46.5], [-87.8, 42, -87, 45.6, -85.4, 45.9, -86.4, 43.5, -86.6, 42.2], [-84.4, 45.9, -81.4, 45.5, -80.2, 44.6, -81.7, 43.2, -82.6, 44.1, -83.4, 45],
    [-83.4, 41.7, -79, 42.9, -79.6, 42.5, -82, 41.4], [-79.8, 43.3, -76.3, 44.1, -76.6, 43.3, -79, 43.2]
  ];
  var MONTI = [[-116, 49], [-110, 43], [-107, 37], [-121, 56], [-77, -2], [-70, -16], [-70, -27], [-72, -38], [78, 34], [84, 29.6], [90, 28.6], [96, 31], [9.5, 46.2], [44, 42.8], [-5, 31.6], [38, 9], [37, -3], [148, -32]];
  var COLT = { na: "#8ce99a", sa: "#8ce99a", gr: "#eef6fa", eu: "#ffe680", af: "#ffd43b", as: "#ffc4c4", oc: "#d0bfff" };
  def("mappa_mondo", { nome: "Mappa del mondo", prezzo: 800, reparto: "quadri", largo: 2, giu: 5 }, function () {
    var x = 7, y = 49, w = 110, h = 61, t = 3.6, s = "", r = rnd(141), i, c = "";
    var a = x + t, b = y + t, W = w - 2 * t, H = h - 2 * t, mx0 = a + 3, my0 = b + 3, MW = W - 6, MH = H - 6;
    function mil(lat) { var f = lat * Math.PI / 180; return 1.25 * Math.log(Math.tan(Math.PI / 4 + .4 * f)); }
    var YA = mil(83), YB = mil(-58);
    function mp(lo, la) { return [mx0 + (lo + 180) / 360 * MW, my0 + (YA - mil(la)) / (YA - YB) * MH]; }
    function terra(l) { var d = ""; for (var j = 0; j < l.length; j += 2) d += (j ? " L" : "M") + q(mp(l[j], l[j + 1])); return d + " Z"; }
    s += ombraD(rettD(x, y, w, h, .6), 2.2, 3);
    s += rett(a, b, W, H, 0, lin("ca", [[0, "#fbf3dc"], [1, "#eedfb6"]], 0, 0, 1, 1));   // la carta
    // il bordo a scacchi dei gradi
    var sc = "";
    for (i = 0; i < 24; i++) if (i % 2) { var u0 = mp(-180 + i * 15, 0)[0], u1 = mp(-165 + i * 15, 0)[0]; sc += rett(u0, my0 - 1.2, u1 - u0, 1.2, 0, "#4a3a28") + rett(u0, my0 + MH, u1 - u0, 1.2, 0, "#4a3a28"); }
    var lats = [83, 75, 60, 45, 30, 15, 0, -15, -30, -45, -58];
    for (i = 0; i < lats.length - 1; i++) if (i % 2) { var v0 = mp(0, lats[i])[1], v1 = mp(0, lats[i + 1])[1]; sc += rett(mx0 - 1.2, v0, 1.2, v1 - v0, 0, "#4a3a28") + rett(mx0 + MW, v0, 1.2, v1 - v0, 0, "#4a3a28"); }
    s += sc + rett(mx0 - 1.2, my0 - 1.2, MW + 2.4, MH + 2.4, 0, "none", "stroke='#4a3a28' stroke-width='.3'");
    // il mare, i meridiani e i paralleli, l'equatore e i tropici
    c += rett(mx0, my0, MW, MH, 0, lin("oc", [[0, "#a3d2ee"], [.5, "#bde1f5"], [1, "#9fcbe8"]], 0, 0, 0, 1));
    var gr = "", lo;
    for (lo = -150; lo <= 150; lo += 30) gr += "M" + q(mp(lo, 83)) + " L" + q(mp(lo, -58)) + " ";
    [60, 30, -30].forEach(function (la) { gr += "M" + q(mp(-180, la)) + " L" + q(mp(180, la)) + " "; });
    c += tratto(gr, "#4f86b0", .22, op(.4)) + tratto("M" + q(mp(-180, 23.4)) + " L" + q(mp(180, 23.4)) + " M" + q(mp(-180, -23.4)) + " L" + q(mp(180, -23.4)), "#4f86b0", .2, "stroke-dasharray='.4 .8' " + op(.55)) +
      tratto("M" + q(mp(-180, 0)) + " L" + q(mp(180, 0)), "#c0504d", .3, "stroke-dasharray='1.2 .8' " + op(.65));
    // le terre: prima l'acqua chiara lungo le coste, poi i colori, poi i laghi e le montagne
    var tutte = [], k;
    for (k in TERRE) tutte.push([k, TERRE[k]]);
    tutte = tutte.concat(ISOLE);
    c += pth(tutte.map(function (tt) { return terra(tt[1]); }).join(" "), "none", "stroke='#e8f6fe' stroke-width='1.8' stroke-linejoin='round'");
    tutte.forEach(function (tt) { var col = COLT[tt[0]]; c += pth(terra(tt[1]), col, "stroke='" + scuro(col, .5) + "' stroke-width='.3' stroke-linejoin='round'"); });
    LAGHI.forEach(function (lg) { c += pth(terra(lg), "#b4dcf3", "stroke='#3f6f94' stroke-width='.25' stroke-linejoin='round'"); });
    MONTI.forEach(function (m) { var pm = mp(m[0], m[1]); c += pth("M" + q(pm[0] - 1, pm[1] + .6) + " L" + q(pm[0], pm[1] - .9) + " L" + q(pm[0] + 1, pm[1] + .6) + " Z", "#a8805a", bordo("#6b4a2a", .2)) + pth("M" + q(pm[0], pm[1] - .9) + " L" + q(pm[0] + 1, pm[1] + .6) + " L" + q(pm[0] + .2, pm[1] + .6) + " Z", "#7a5638") + pth("M" + q(pm[0] - .36, pm[1] - .36) + " L" + q(pm[0], pm[1] - .9) + " L" + q(pm[0] + .36, pm[1] - .36) + " Z", "#ffffff"); });
    // la rosa dei venti nel Pacifico
    var rp = mp(-128, -36), rx = rp[0], ry = rp[1], R = 4.2;
    c += cer(rx, ry, R * .62, "none", "stroke='#5a4630' stroke-width='.25'");
    for (i = 0; i < 8; i++) {
      var aa = i * Math.PI / 4, lung = i % 2 ? R * .62 : R, lar = i % 2 ? R * .12 : R * .2, tip = [rx + Math.sin(aa) * lung, ry - Math.cos(aa) * lung], lf = [rx + Math.sin(aa - Math.PI / 2) * lar, ry - Math.cos(aa - Math.PI / 2) * lar], rg = [rx + Math.sin(aa + Math.PI / 2) * lar, ry - Math.cos(aa + Math.PI / 2) * lar];
      c += poly([[rx, ry], tip, lf], i % 2 ? "#8a6a48" : "#4a3a28") + poly([[rx, ry], tip, rg], "#fbf3dc", "stroke='#4a3a28' stroke-width='.18'");
    }
    c += cer(rx, ry, .45, "#c0504d") + "<text x='" + f1(rx) + "' y='" + f1(ry - R - .5) + "' text-anchor='middle' font-family='Georgia,serif' font-weight='700' font-size='1.9' fill='#4a3a28'>N</text>";
    // il veliero nell'Atlantico
    var vp = mp(-40, 27), vx = vp[0], vy = vp[1];
    c += pth("M" + q(vx - 2.2, vy) + " L" + q(vx + 2.4, vy) + " Q" + q(vx + 1.8, vy + 1.2) + " " + q(vx + 1.2, vy + 1.2) + " L" + q(vx - 1.6, vy + 1.2) + " Q" + q(vx - 2, vy + .8) + " " + q(vx - 2.2, vy) + " Z", "#8a5a32", bordo("#4a3a28", .2)) +
      tratto("M" + q(vx - .7, vy) + " L" + q(vx - .7, vy - 3.4) + " M" + q(vx + 1, vy) + " L" + q(vx + 1, vy - 2.8), "#4a3a28", .2) + pth("M" + q(vx - 1.8, vy - 3) + " Q" + q(vx - .7, vy - 2.6) + " " + q(vx + .3, vy - 3) + " L" + q(vx + .1, vy - .6) + " Q" + q(vx - .7, vy - .3) + " " + q(vx - 1.6, vy - .6) + " Z", "#ffffff", bordo("#4a3a28", .15)) +
      pth("M" + q(vx + .3, vy - 2.5) + " Q" + q(vx + 1, vy - 2.2) + " " + q(vx + 1.8, vy - 2.5) + " L" + q(vx + 1.7, vy - .6) + " Q" + q(vx + 1, vy - .4) + " " + q(vx + .4, vy - .6) + " Z", "#ffffff", bordo("#4a3a28", .15)) + pth("M" + q(vx - .7, vy - 3.4) + " L" + q(vx + .5, vy - 3.1) + " L" + q(vx - .7, vy - 2.8) + " Z", "#e03131") +
      tratto("M" + q(vx - 3.6, vy + 1.6) + " Q" + q(vx - 2.8, vy + 1.1) + " " + q(vx - 2, vy + 1.6) + " M" + q(vx + 2, vy + 1.7) + " Q" + q(vx + 2.8, vy + 1.2) + " " + q(vx + 3.6, vy + 1.7), "#4f86b0", .2);
    c += rett(mx0, my0, MW, MH, 0, lin("vl", [[0, "#ffffff", .16], [.5, "#ffffff", 0], [1, "#000000", .1]], 0, 0, 1, 1));   // un po' di volume: luce da in alto a sinistra
    c += poly([[mx0, my0], [mx0 + MW * .3, my0], [mx0, my0 + MH * .5]], "#ffffff", op(.06));
    s += dentro(rettD(mx0, my0, MW, MH, 0), c) + rett(mx0, my0, MW, MH, 0, "none", "stroke='#4a3a28' stroke-width='.35'");
    // la puntina rossa sull'Italia
    var pi2 = mp(12.5, 42.4);
    s += ell(pi2[0] + .9, pi2[1] + .2, 1.1, .4, "#000", op(.25)) + tratto("M" + q(pi2) + " L" + q(pi2[0] + 1.5, pi2[1] - 3), "#5c636a", .35) + cer(pi2[0] + 1.7, pi2[1] - 3.4, 1.35, rad("pn", [[0, "#ff8787"], [.5, "#e03131"], [1, "#8f1d1d"]], .35, .3, .75), bordo(L, .35)) + cer(pi2[0] + 1.25, pi2[1] - 3.85, .38, "#ffffff", op(.9));
    for (i = 0; i < 4; i++) s += ell(a + 4 + r() * (W - 8), b + 3 + r() * (H - 6), 2 + r() * 3, 1.4 + r() * 2, "#a0783a", op(.05));   // la carta un po' ingiallita
    s += poly([[a, b], [a + W * .26, b], [a, b + H * .74]], "#ffffff", op(.08)) + poly([[a + W * .3, b], [a + W * .33, b], [a, b + H * .98], [a, b + H * .86]], "#ffffff", op(.06));   // il vetro
    s += cornice(x, y, w, h, t, C_NOCE, { vena: 11, filo: "#e0b54a" });
    return s;
  });

  // =========================================================
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var n = d.largo || 1, o = { tipo: "parete", nome: d.nome, stanza: "tutte", reparto: d.reparto, w: 62 * n, h: 200, fp: [n, 1], prezzo: d.prezzo, qual: 2 };
      if (d.luce) { o.luce = d.luce.slice(); o.luce[1] += d.giu || 0; }
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var w = 62 * (d.largo || 1);
      p = "mqu" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; NOTTE = !!(opz.notte && d.luce);
      var c; try { c = d.fn(opz); } finally { NOTTE = false; }
      if (d.giu) c = "<g transform='translate(0 " + d.giu + ")'>" + c + "</g>";   // appeso un po' più in basso
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " 200' width='" + w + "' height='200'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + c + "</svg>";
    }
  });
})();

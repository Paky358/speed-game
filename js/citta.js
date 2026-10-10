/* =========================================================
   SPeeD GAME — LA CITTÀ
   La futura home: una città isometrica dove ogni edificio è
   una categoria di giochi. Edifici, piazza e bar si toccano
   (gruppi con data-vai): core.js apre l'interno giusto.
   Disegnata in SVG col codice (niente immagini, niente 3D vero).
   Di giorno, al tramonto o di notte secondo il sole vero in Italia.
   SGCitta.svg({ fase, io, sopra }) -> stringa SVG (300 x 600, più "sopra" di spazio libero in alto)
   SGCitta.fase(data)         -> "giorno" | "tramonto" | "notte"
   ========================================================= */
(function () {
  "use strict";

  var A = 25, uid = 0, nf = 0;
  var ALTO = 790;   // quanto è lunga la città (si scorre col dito): quattro file di edifici
  var P, S, ET;   // proiezione, luce ed etichette del disegno in corso

  // ---------- attrezzi ----------
  function f1(n) { return Math.round(n * 10) / 10; }
  function pts(a) { return a.map(function (p) { return f1(p[0]) + "," + f1(p[1]); }).join(" "); }
  function poly(a, fill, extra) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + (extra || "") + "/>"; }
  function linea(a, b, col, w, extra) { return "<line x1='" + f1(a[0]) + "' y1='" + f1(a[1]) + "' x2='" + f1(b[0]) + "' y2='" + f1(b[1]) + "' stroke='" + col + "' stroke-width='" + w + "'" + (extra || "") + "/>"; }
  function pallino(p, r, fill, extra) { return "<circle cx='" + f1(p[0]) + "' cy='" + f1(p[1]) + "' r='" + r + "' fill='" + fill + "'" + (extra || "") + "/>"; }
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function proiezione(ox, oy) { return function (u, v, z) { return [ox + (u - v) * A, oy + (u + v) * A / 2 - (z || 0)]; }; }
  function su(p, z) { return [p[0], p[1] - z]; }
  function nuovoId(k) { return "ct" + k + (++uid); }

  // ---------- la luce del momento ----------
  var FASI = {
    giorno:   { id: "g", top: .22, dx: .17, linea: .4 },
    tramonto: { id: "t", top: .14, dx: .22, linea: .42, luci: true, tramonto: true, tinta: ["#e0704f", .24] },
    notte:    { id: "n", top: .06, dx: .28, linea: .45, luci: true, notte: true, tinta: ["#1f2547", .52] }
  };
  function T(c) { return S.tinta ? mix(c, S.tinta[0], S.tinta[1]) : c; }
  function F(c, f) { var b = T(c); return f === "t" ? mix(b, "#ffffff", S.top) : f === "r" ? mix(b, "#000000", S.dx) : b; }
  function L(c) { return " stroke='" + mix(T(c), "#000000", S.linea) + "' stroke-width='.8' stroke-linejoin='round'"; }
  function G() { return S.luci ? " filter='url(#ctbl" + S.id + ")'" : ""; }
  function defs() {
    var id = S.id;
    return "<defs><filter id='ctbl" + id + "' x='-60%' y='-60%' width='220%' height='220%'><feGaussianBlur stdDeviation='2.2' result='b'/><feMerge><feMergeNode in='b'/><feMergeNode in='SourceGraphic'/></feMerge></filter>" +
      "<filter id='ctnp" + id + "'><feColorMatrix type='matrix' values='.68 0 0 0 0 0 .7 0 0 0 0 0 .86 0 .03 0 0 0 1 0'/></filter>" +
      "<radialGradient id='ctpozza" + id + "'><stop offset='0' stop-color='#ffe8a3' stop-opacity='.5'/><stop offset='1' stop-color='#ffe8a3' stop-opacity='0'/></radialGradient>" +
      "<radialGradient id='ctalone" + id + "'><stop offset='0' stop-color='#fff3bf' stop-opacity='.95'/><stop offset='1' stop-color='#fff3bf' stop-opacity='0'/></radialGradient>" +
      "<radialGradient id='ctvig" + id + "' cx='.5' cy='.45' r='.75'><stop offset='.5' stop-color='#090b1e' stop-opacity='0'/><stop offset='1' stop-color='#090b1e' stop-opacity='.6'/></radialGradient>" +
      "<linearGradient id='ctcaldo" + id + "' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#ff8a4c' stop-opacity='.32'/><stop offset='.55' stop-color='#ff8a4c' stop-opacity='.06'/><stop offset='1' stop-color='#7048e8' stop-opacity='.16'/></linearGradient>" +
      "<linearGradient id='ctfascio" + id + "' x1='0' y1='1' x2='0' y2='0'><stop offset='0' stop-color='#fff3bf' stop-opacity='.42'/><stop offset='1' stop-color='#fff3bf' stop-opacity='0'/></linearGradient>" +
      "<pattern id='ctstrisce" + id + "' width='6' height='6' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'><rect width='3' height='6' fill='#ffd43b'/><rect x='3' width='3' height='6' fill='#212529'/></pattern></defs>";
  }

  // ---------- forme in 3D ----------
  function box(u, v, w, d, z, h, c, o) {
    o = o || {};
    var t1 = P(u, v, z + h), t2 = P(u + w, v, z + h), t3 = P(u + w, v + d, z + h), t4 = P(u, v + d, z + h);
    var b2 = P(u + w, v, z), b3 = P(u + w, v + d, z), b4 = P(u, v + d, z), l = L(c);
    return poly([b4, b3, t3, t4], o.cl || F(c, "l"), l) + poly([b3, b2, t2, t3], o.cr || F(c, "r"), l) + poly([t1, t2, t3, t4], o.ct || F(c, "t"), l);
  }
  function qL(v, u1, u2, z1, z2, fill, extra) { return poly([P(u1, v, z1), P(u2, v, z1), P(u2, v, z2), P(u1, v, z2)], fill, extra); }
  function qR(u, v1, v2, z1, z2, fill, extra) { return poly([P(u, v1, z1), P(u, v2, z1), P(u, v2, z2), P(u, v1, z2)], fill, extra); }
  function qT(u1, v1, u2, v2, z, fill, extra) { return poly([P(u1, v1, z), P(u2, v1, z), P(u2, v2, z), P(u1, v2, z)], fill, extra); }
  function txt(p, m, t, size, fill, extra) { return "<text transform='matrix(" + m + "," + f1(p[0]) + "," + f1(p[1]) + ")' text-anchor='middle' font-family='Nunito, Arial, sans-serif' font-weight='900' font-size='" + size + "' fill='" + fill + "'" + (extra || "") + ">" + t + "</text>"; }
  function txL(v, u, z, t, size, fill, extra) { return txt(P(u, v, z), ".894,.447,0,1", t, size, fill, extra); }
  function txR(u, v, z, t, size, fill, extra) { return txt(P(u, v, z), ".894,-.447,0,1", t, size, fill, extra); }
  function vetro(sempre) { nf++; if (S.notte) return sempre || nf % 4 ? "#ffd75e" : "#30365e"; if (S.luci) return sempre || nf % 3 === 0 ? "#ffd75e" : T("#a5d8ff"); return "#a5d8ff"; }
  function finL(v, u1, u2, z1, z2, cornice) {
    var du = Math.min(.05, (u2 - u1) * .15), dz = Math.min(2, (z2 - z1) * .15), s = qL(v, u1, u2, z1, z2, F(cornice || "#ffffff", "l"));
    s += qL(v, u1 + du, u2 - du, z1 + dz, z2 - dz, vetro());
    if (!S.notte) s += poly([P(u1 + du, v, z2 - dz), P(u1 + (u2 - u1) * .55, v, z2 - dz), P(u1 + du, v, z1 + (z2 - z1) * .4)], "rgba(255,255,255,.5)");
    return s;
  }
  function finR(u, v1, v2, z1, z2, cornice) {
    var dv = Math.min(.05, (v1 - v2) * .15), dz = Math.min(2, (z2 - z1) * .15), s = qR(u, v1, v2, z1, z2, F(cornice || "#ffffff", "r"));
    s += qR(u, v1 - dv, v2 + dv, z1 + dz, z2 - dz, vetro());
    if (!S.notte) s += poly([P(u, v1 - dv, z2 - dz), P(u, v1 - (v1 - v2) * .55, z2 - dz), P(u, v1 - dv, z1 + (z2 - z1) * .4)], "rgba(255,255,255,.42)");
    return s;
  }
  function ell(u, v, z, r, fill, extra) { var C = P(u, v, z), rx = r * A * Math.SQRT2; return "<ellipse cx='" + f1(C[0]) + "' cy='" + f1(C[1]) + "' rx='" + f1(rx) + "' ry='" + f1(rx / 2) + "' fill='" + fill + "'" + (extra || "") + "/>"; }
  function cil(u, v, r, z, h, c, o) {
    o = o || {};
    var C0 = P(u, v, z), C1 = P(u, v, z + h), rx = r * A * Math.SQRT2, ry = rx / 2, id = nuovoId("cg");
    var s = "<linearGradient id='" + id + "'><stop offset='0' stop-color='" + F(c, "l") + "'/><stop offset='1' stop-color='" + F(c, "r") + "'/></linearGradient>";
    s += "<path d='M" + f1(C0[0] - rx) + "," + f1(C0[1]) + " A" + f1(rx) + " " + f1(ry) + " 0 0 0 " + f1(C0[0] + rx) + "," + f1(C0[1]) + " L" + f1(C1[0] + rx) + "," + f1(C1[1]) + " A" + f1(rx) + " " + f1(ry) + " 0 0 1 " + f1(C1[0] - rx) + "," + f1(C1[1]) + " Z' fill='url(#" + id + ")'" + L(c) + "/>";
    if (!o.noTop) s += ell(u, v, z + h, r, o.ct || F(c, "t"), L(c));
    return s;
  }
  function sfera(x, y, r, c) {
    var id = nuovoId("sg"), b = T(c);
    return "<radialGradient id='" + id + "' cx='.36' cy='.32' r='.78'><stop offset='0' stop-color='" + mix(b, "#ffffff", S.notte ? .12 : .5) + "'/><stop offset='.55' stop-color='" + b + "'/><stop offset='1' stop-color='" + mix(b, "#000000", .32) + "'/></radialGradient>" +
      "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f1(r) + "' fill='url(#" + id + ")' stroke='" + mix(b, "#000000", S.linea) + "' stroke-width='.8'/>";
  }
  function arco(uc, vc, r, z, a1, a2, n) { var C = P(uc, vc, z), rx = r * A * Math.SQRT2, ry = rx / 2, p = []; for (var i = 0; i <= n; i++) { var t = Math.PI * (a1 + (a2 - a1) * i / n); p.push([C[0] - rx * Math.cos(t), C[1] + ry * Math.sin(t)]); } return p; }
  function fasciaCil(uc, vc, r, z1, z2, a1, a2, fill) { return poly(arco(uc, vc, r, z1, a1, a2, 12).concat(arco(uc, vc, r, z2, a1, a2, 12).reverse()), fill); }
  function cono(uc, vc, r, z, h, c1, c2, n) {   // tetti tondi e ombrelloni a spicchi
    var C = P(uc, vc, z), ap = P(uc, vc, z + h), rx = r * A * Math.SQRT2, ry = rx / 2, s = "", pass, i;
    function e(t) { return [C[0] - rx * Math.cos(t), C[1] + ry * Math.sin(t)]; }
    for (pass = 0; pass < 2; pass++) for (i = 0; i < n; i++) {
      var t1 = (pass ? 0 : Math.PI) + Math.PI * i / n, c = i % 2 ? c2 : c1;
      s += poly([ap, e(t1), e(t1 + Math.PI / n)], pass ? (i < n / 2 ? F(c, "l") : F(c, "r")) : F(c, "t"), L(c));
    }
    return s;
  }
  function tenda(v, u1, u2, z, out, n, c1, c2) {
    var s = "", w = (u2 - u1) / n;
    for (var i = 0; i < n; i++) {
      var a = u1 + i * w, b = a + w, c = i % 2 ? c2 : c1;
      s += poly([P(a, v, z), P(b, v, z), P(b, v + out, z - 6), P(a, v + out, z - 6)], F(c, "t"), L(c));
      s += poly([P(a, v + out, z - 6), P(b, v + out, z - 6), P(b, v + out, z - 9.5), P(a, v + out, z - 9.5)], F(c, "l"), L(c));
    }
    return s;
  }
  function tettoV(u1, u2, v1, v2, z, h, c, muro) {   // colmo lungo v, frontone sul davanti
    var um = (u1 + u2) / 2, r1 = P(um, v1, z + h), r2 = P(um, v2, z + h);
    return poly([P(u1, v1, z), P(u1, v2, z), r2, r1], F(c, "t"), L(c)) + poly([P(u2, v1, z), P(u2, v2, z), r2, r1], F(c, "r"), L(c)) + poly([P(u1, v2, z), P(u2, v2, z), r2], F(muro, "l"), L(muro));
  }
  function stellina(x, y, r, fill) { var k = r * .3; return "<path d='M" + f1(x) + "," + f1(y - r) + " L" + f1(x + k) + "," + f1(y - k) + " L" + f1(x + r) + "," + f1(y) + " L" + f1(x + k) + "," + f1(y + k) + " L" + f1(x) + "," + f1(y + r) + " L" + f1(x - k) + "," + f1(y + k) + " L" + f1(x - r) + "," + f1(y) + " L" + f1(x - k) + "," + f1(y - k) + " Z' fill='" + (fill || "#ffffff") + "'/>"; }
  function coppa(x, y, k) {
    var g = nuovoId("cp");
    return "<linearGradient id='" + g + "' x1='0' x2='1'><stop offset='0' stop-color='" + T("#fff3bf") + "'/><stop offset='.45' stop-color='" + T("#fcc419") + "'/><stop offset='1' stop-color='" + T("#d9770b") + "'/></linearGradient>" +
      "<g transform='translate(" + f1(x) + "," + f1(y) + ") scale(" + k + ")'><path d='M-8,-21 c-6,0 -6,8 -1,8 M8,-21 c6,0 6,8 1,8' fill='none' stroke='" + T("#fcc419") + "' stroke-width='1.8'/>" +
      "<g fill='url(#" + g + ")' stroke='" + T("#b7791f") + "' stroke-width='.7'><rect x='-6' y='-4' width='12' height='4' rx='1'/><rect x='-4' y='-6.5' width='8' height='2.8' rx='1'/><path d='M-1.6,-6.5 h3.2 l-.6,-4 h-2 z'/><path d='M-8,-24 C-8,-14 -4,-10 0,-10 C4,-10 8,-14 8,-24 Z'/><ellipse cx='0' cy='-24' rx='8' ry='2'/></g></g>";
  }

  // ---------- arredo ----------
  function ombra(p, rx) { return "<ellipse cx='" + f1(p[0]) + "' cy='" + f1(p[1]) + "' rx='" + rx + "' ry='" + rx / 2 + "' fill='rgba(0,0,0," + (S.notte ? .3 : .16) + ")'/>"; }
  function albero(u, v, k) {
    k = k || 1;
    var b = P(u, v, 0), s = ombra(b, 12 * k);
    s += "<path d='M" + f1(b[0] - 2.5 * k) + "," + f1(b[1]) + " l" + f1(k) + "," + f1(-15 * k) + " h" + f1(3 * k) + " l" + f1(k) + "," + f1(15 * k) + " z' fill='" + F("#8b5a2b", "l") + "'/>";
    return s + sfera(b[0] - 6 * k, b[1] - 21 * k, 9 * k, "#40c057") + sfera(b[0] + 6 * k, b[1] - 22 * k, 9 * k, "#37b24d") + sfera(b[0], b[1] - 30 * k, 10.5 * k, "#51cf66");
  }
  function pino(u, v, k) {
    k = k || 1;
    var b = P(u, v, 0), s = ombra(b, 10 * k) + "<rect x='" + f1(b[0] - 2 * k) + "' y='" + f1(b[1] - 8 * k) + "' width='" + f1(4 * k) + "' height='" + f1(8 * k) + "' fill='" + F("#8b5a2b", "l") + "'/>";
    for (var i = 0; i < 3; i++) {
      var y0 = b[1] - (6 + i * 9) * k, w = (12 - i * 3) * k, ap = y0 - 15 * k;
      s += poly([[b[0] - w, y0], [b[0], ap], [b[0], y0 + 3 * k]], F("#2f9e44", "l"), L("#2f9e44")) + poly([[b[0], ap], [b[0] + w, y0], [b[0], y0 + 3 * k]], F("#2f9e44", "r"), L("#2f9e44"));
    }
    return s;
  }
  function fiori(u, v) {
    var s = ell(u, v, 0, .32, F("#8ce99a", "t"), L("#69db7c")), C = P(u, v, 0), col = ["#ff6b6b", "#ffd43b", "#f783ac", "#ffffff", "#748ffc"];
    for (var i = 0; i < 9; i++) { var a = i * 2.39, rr = 4 + (i % 3) * 3; s += pallino([C[0] + Math.cos(a) * rr * 1.6, C[1] + Math.sin(a) * rr * .8], 1.7, T(col[i % 5])); }
    return s;
  }
  function lampione(u, v) {
    var b = P(u, v, 0), t = P(u, v, 30), s = "";
    if (S.luci) s += "<ellipse cx='" + f1(b[0]) + "' cy='" + f1(b[1]) + "' rx='" + (S.notte ? 30 : 20) + "' ry='" + (S.notte ? 15 : 10) + "' fill='url(#ctpozza" + S.id + ")'/>";
    s += ombra(b, 4) + linea(b, t, F("#495057", "l"), 2.2) + pallino([t[0], t[1] - 2], 3.6, S.luci ? "#fff3bf" : "#f8f9fa", " stroke='" + F("#495057", "l") + "' stroke-width='1'");
    if (S.luci) s += pallino([t[0], t[1] - 2], S.notte ? 13 : 9, "url(#ctalone" + S.id + ")");
    return s;
  }
  function auto(u, v, c) {   // macchinina in strada, lunga lungo u
    var s = ombra(P(u + .41, v + .21, 0), 15);
    s += box(u, v, .82, .42, 2.5, 6.5, c) + box(u + .2, v + .04, .42, .34, 9, 6, "#d0ebff", { ct: F(c, "t") });
    [[u + .18, v + .42], [u + .64, v + .42]].forEach(function (r) { s += pallino(P(r[0], r[1], 2.5), 2.6, "#212529"); });
    if (S.luci) s += pallino(P(u + .82, v + .21, 6), 7, "url(#ctalone" + S.id + ")");
    return s;
  }
  function vaso(u, v) { var b = P(u, v, 3); return cil(u, v, .07, 3, 5, "#c97b3c") + sfera(b[0], b[1] - 10, 5, "#40c057"); }
  function panchina(u, v) {   // la panchina di legno del parco
    return ombra(P(u + .35, v + .1, 0), 12) + box(u, v, .05, .05, 0, 4, "#495057") + box(u + .65, v, .05, .05, 0, 4, "#495057") + box(u - .05, v - .08, .8, .22, 4, 1.5, "#c97b3c") + box(u - .05, v - .1, .8, .05, 5.5, 5, "#a0652b");
  }
  function figura(cfg, x, y, w) { var h = w * 1.32; return window.SGOmino.svg(cfg).replace("<svg ", "<svg x='" + f1(x - w / 2) + "' y='" + f1(y - h * .96) + "' width='" + f1(w) + "' height='" + f1(h) + "' "); }
  function gente(cfg, u, v, w) { var b = P(u, v, 0), g = figura(cfg, b[0], b[1], w); return S.notte ? "<g filter='url(#ctnp" + S.id + ")'>" + g + "</g>" : g; }
  // un pezzo della città che si può toccare (edificio, piazza, bar): porta a "vai"
  function tocco(vai, s) { return "<g class='ct-tocco' role='button' data-vai='" + vai + "'>" + s + "</g>"; }
  function etichetta(x, y, testo, col, badge, vai) {
    var w = 20 + testo.length * 6.3, s = "<rect x='" + f1(x - w / 2) + "' y='" + f1(y - 10) + "' width='" + f1(w) + "' height='20' rx='10' fill='" + (S.notte ? "rgba(22,24,48,.9)" : "#ffffff") + "' stroke='" + col + "' stroke-width='2'/>" +
      "<text x='" + f1(x) + "' y='" + f1(y + 4) + "' text-anchor='middle' font-family='Nunito, Arial, sans-serif' font-weight='900' font-size='11.5' fill='" + (S.notte ? "#ffffff" : "#2b2b3a") + "'>" + testo + "</text>";
    if (badge) s += pallino([x + w / 2 - 2, y - 9], 7, "#fa5252", " stroke='#ffffff' stroke-width='1.5'") + "<text x='" + f1(x + w / 2 - 2) + "' y='" + f1(y - 6) + "' text-anchor='middle' font-family='Nunito, Arial, sans-serif' font-weight='900' font-size='8.5' fill='#ffffff'>" + badge + "</text>";
    ET.push(vai ? tocco(vai, s) : s);
  }
  function tu(x, y) { return "<rect x='" + f1(x - 13) + "' y='" + f1(y - 10) + "' width='26' height='18' rx='9' fill='#4c6ef5'/><text x='" + f1(x) + "' y='" + f1(y + 3.5) + "' text-anchor='middle' font-family='Nunito, Arial, sans-serif' font-weight='900' font-size='11' fill='#ffffff'>Tu</text>"; }

  // ---------- il cantiere: transenne, birilli e la gru ----------
  function transenna(u, v, lungoU) {
    var a = P(u, v, 0), b = lungoU ? P(u + .7, v, 0) : P(u, v + .7, 0);
    return ombra([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], 14) + linea(a, su(a, 12), F("#495057", "l"), 1.6) + linea(b, su(b, 12), F("#495057", "l"), 1.6) +
      poly([su(a, 6.5), su(b, 6.5), su(b, 12.5), su(a, 12.5)], "url(#ctstrisce" + S.id + ")", " stroke='#212529' stroke-width='.6'") +
      (S.luci ? pallino(su(a, 14), 1.8, "#ff8787", G()) + pallino(su(b, 14), 1.8, "#ff8787", G()) : "");
  }
  function birillo(u, v) {
    var b = P(u, v, 0);
    return ombra(b, 4) + "<path d='M" + f1(b[0] - 4) + "," + f1(b[1]) + " L" + f1(b[0]) + "," + f1(b[1] - 11) + " L" + f1(b[0] + 4) + "," + f1(b[1]) + " Z' fill='" + T("#fd7e14") + "'/>" +
      "<path d='M" + f1(b[0] - 2.7) + "," + f1(b[1] - 3.8) + " L" + f1(b[0] + 2.7) + "," + f1(b[1] - 3.8) + " L" + f1(b[0] + 1.8) + "," + f1(b[1] - 6.5) + " L" + f1(b[0] - 1.8) + "," + f1(b[1] - 6.5) + " Z' fill='#ffffff'/>" +
      "<rect x='" + f1(b[0] - 5) + "' y='" + f1(b[1] - 1.2) + "' width='10' height='2.2' rx='1' fill='" + T("#e8590c") + "'/>";
  }
  function gru(u, v) {   // gru gialla da cantiere, col braccio sopra la città
    var b = P(u, v, 0), h = 118, x = b[0], y0 = b[1], top = y0 - h, giallo = T("#fab005"), scuro = mix(giallo, "#000000", .35), s = ombra(b, 16), i;
    s += box(u - .25, v - .25, .5, .5, 0, 6, "#868e96");
    s += linea([x - 4, y0 - 6], [x - 4, top], giallo, 2) + linea([x + 4, y0 - 6], [x + 4, top], giallo, 2);
    for (i = 0; i < 12; i++) { var ya = y0 - 6 - i * (h - 6) / 12, yb = ya - (h - 6) / 12; s += linea([x - 4, ya], [x + 4, yb], scuro, .9); }
    s += linea([x - 70, top], [x + 26, top], giallo, 2.4) + linea([x - 70, top + 5], [x + 26, top + 5], giallo, 1.2);
    for (i = 0; i < 12; i++) { var xa = x - 70 + i * 8; s += linea([xa, top + 5], [xa + 4, top], scuro, .8); }
    s += linea([x, top], [x, top - 12], giallo, 2) + linea([x, top - 12], [x - 66, top], scuro, .8) + linea([x, top - 12], [x + 22, top], scuro, .8);
    s += "<rect x='" + f1(x + 14) + "' y='" + f1(top + 2) + "' width='12' height='9' fill='" + T("#495057") + "'/>";
    s += "<rect x='" + f1(x - 7) + "' y='" + f1(top + 4) + "' width='10' height='8' rx='1.5' fill='" + scuro + "'/>";
    s += linea([x - 50, top + 5], [x - 50, top + 40], T("#343a40"), .8) + "<rect x='" + f1(x - 56) + "' y='" + f1(top + 40) + "' width='12' height='7' fill='" + T("#c92a2a") + "'/>";
    if (S.luci) s += pallino([x - 70, top - 1], 2, "#ff6b6b", G()) + pallino([x, top - 13], 2, "#ff6b6b", G());
    return s;
  }

  // ---------- gli edifici (u, v = angolo dietro del lotto 2,5 x 2,5) ----------
  var PIETRA = "#dee2e6";
  function basamento(u, v) { return box(u + .05, v + .05, 2.4, 2.4, 0, 3, PIETRA); }
  function lampadine(a, b, n, z1, z2, fn) { var s = ""; for (var i = 0; i < n; i++) { var x = a + (b - a) * (i + .5) / n; [z1, z2].forEach(function (z) { if (z != null) s += pallino(fn(x, z), 1.25, S.luci ? "#fff3bf" : "#ffe8a3", G()); }); } return s; }

  function casino(u, v) {
    var R = "#e03131", Go = "#fcc419", s = basamento(u, v), vf = v + 2, uf = u + 2.2;
    s += box(u + .3, v + .25, 1.9, 1.75, 3, 44, "#fff4e6");
    s += qL(vf, u + .3, uf, 3, 10, F(R, "l")) + qR(uf, vf, v + .25, 3, 10, F(R, "r"));
    s += finL(vf, u + .42, u + .74, 14, 38, Go) + finL(vf, u + 1.76, u + 2.08, 14, 38, Go);
    [[1.82, 1.52], [1.28, .98], [.74, .44]].forEach(function (k) { s += finR(uf, v + k[0], v + k[1], 14, 38, Go); });
    s += qL(vf, u + .98, u + 1.52, 3, 26, F(Go, "l")) + qL(vf, u + 1.03, u + 1.47, 3, 23.5, S.luci ? "#ffe8a3" : "#343a40") + qL(vf, u + 1.243, u + 1.257, 3, 23.5, F(Go, "l"));
    s += txL(vf, u + 1.25, 40.5, "♠︎ ♥︎ ♦︎ ♣︎", 6.5, F(R, "l"));
    s += box(u + .25, v + .2, 2, 1.85, 47, 4, Go) + box(u + .55, v + .45, 1.4, 1.3, 51, 14, R);
    [.7, 1.12, 1.54].forEach(function (k) { s += finL(v + 1.75, u + k, u + k + .22, 55, 62.5, Go); });
    [[1.5, 1.28], [1.08, .86], [.66, .44]].forEach(function (k) { s += finR(u + 1.95, v + k[0], v + k[1], 55, 62.5, Go); });
    s += box(u + .5, v + .4, 1.5, 1.4, 65, 3, Go);
    s += box(u + .72, v + 1, .05, .05, 68, 7, "#495057") + box(u + 1.75, v + 1, .05, .05, 68, 7, "#495057") + box(u + .5, v + .98, 1.5, .1, 75, 17, "#212529");
    s += lampadine(u + .52, u + 1.98, 14, 77, 90, function (x, z) { return P(x, v + 1.08, z); });
    s += txL(v + 1.08, u + 1.25, 80.5, "CASINÒ", 9, S.luci ? "#ffe066" : Go, G());
    s += qT(u + 1.05, vf, u + 1.45, v + 2.44, 3.05, F(R, "t"));
    s += box(u + .86, vf, .08, .1, 3, 30, Go) + box(u + 1.56, vf, .08, .1, 3, 30, Go) + box(u + .78, vf, .94, .38, 30, 3.5, R);
    s += lampadine(u + .8, u + 1.7, 10, 30.6, null, function (x, z) { return P(x, vf + .38, z); });
    return s + vaso(u + .66, vf + .2) + vaso(u + 1.86, vf + .2);
  }
  function studio(u, v) {
    var Pu = "#7048e8", W = "#f3f0ff", s = basamento(u, v), vf = v + 2.1, uf = u + 2.2, i;
    s += box(u + .3, v + .3, 1.9, 1.8, 3, 50, W);
    s += qL(vf, u + .3, uf, 3, 6.5, F(Pu, "l")) + qR(uf, vf, v + .3, 3, 6.5, F(Pu, "r")) + qL(vf, u + .3, uf, 46, 53, F(Pu, "l")) + qR(uf, vf, v + .3, 46, 53, F(Pu, "r"));
    s += qL(vf, u + .42, u + 2.08, 19, 43.5, "#212529") + qL(vf, u + .48, u + 2.02, 20.5, 42, S.luci ? "#5c7cfa" : "#4263eb", G()) + txL(vf, u + 1.25, 29.5, "?", 15, "#ffd43b");
    ["#fa5252", "#fcc419", "#40c057", "#4dabf7"].forEach(function (c, k) { s += qL(vf, u + .6 + k * .36, u + .9 + k * .36, 22.5, 25.5, c); });
    s += qL(vf, u + 1, u + 1.5, 6.5, 17, "#343a40") + qL(vf, u + 1.04, u + 1.46, 6.5, 16, S.luci ? "#ffe8a3" : "#a5d8ff") + box(u + .9, vf, .7, .3, 17, 2.5, Pu);
    s += qL(vf, u + .44, u + .82, 9, 14.5, S.luci ? "#ff8787" : "#e03131", G()) + txL(vf, u + .63, 10.4, "ON AIR", 4.2, "#ffffff");
    [[11, 19], [28, 36]].forEach(function (z) {
      s += qR(uf, v + 1.96, v + .44, z[0], z[1], F("#ffffff", "r")) + qR(uf, v + 1.93, v + .47, z[0] + 1.2, z[1] - 1.2, vetro(true));
      for (var k = 1; k < 5; k++) s += linea(P(uf, v + 1.93 - k * .292, z[0] + 1.2), P(uf, v + 1.93 - k * .292, z[1] - 1.2), F("#ffffff", "r"), 1);
    });
    s += qT(u + .42, v + .42, u + 2.08, v + 1.98, 53, F(mix(W, "#868e96", .45), "t")) + box(u + 1.45, v + 1.3, .35, .3, 53, 7, "#ced4da");
    var pb = P(u + .85, v + .95, 53);
    s += linea(pb, [pb[0], pb[1] - 9], F("#868e96", "l"), 2) + "<ellipse cx='" + f1(pb[0]) + "' cy='" + f1(pb[1] - 13) + "' rx='10' ry='6.5' fill='" + F("#f8f9fa", "l") + "' stroke='" + F("#868e96", "l") + "' stroke-width='1' transform='rotate(-28 " + f1(pb[0]) + " " + f1(pb[1] - 13) + ")'/>" +
      linea([pb[0], pb[1] - 13], [pb[0] + 7, pb[1] - 20], F("#868e96", "l"), 1.2) + pallino([pb[0] + 7, pb[1] - 20], 1.6, F("#495057", "l"));
    var a0 = P(u + 1.8, v + .65, 53), h = 42, cima = [a0[0], a0[1] - h];
    s += linea([a0[0] - 5, a0[1]], cima, F("#868e96", "l"), 1.4) + linea([a0[0] + 5, a0[1]], cima, F("#868e96", "r"), 1.4);
    for (i = 1; i < 6; i++) s += linea([a0[0] - 5 * (1 - (i - 1) / 6), a0[1] - (i - 1) * h / 6], [a0[0] + 5 * (1 - i / 6), a0[1] - i * h / 6], F("#868e96", "l"), .8);
    s += pallino(cima, 2.6, "#ff6b6b", G());
    [[u + .55, v + 1.85], [u + 1.95, v + .5]].forEach(function (q) {
      var p = P(q[0], q[1], 53);
      if (S.notte) s += poly([[p[0] - 2, p[1] - 6], [p[0] + 2, p[1] - 6], [p[0] + 26, p[1] - 150], [p[0] - 8, p[1] - 150]], "url(#ctfascio" + S.id + ")");
      s += cil(q[0], q[1], .06, 53, 5, "#495057");
    });
    return s;
  }
  var INV = ["..X.....X..", "...X...X...", "..XXXXXXX..", ".XX.XXX.XX.", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.X.....X.X", "...XX.XX..."];
  function invasore(u, v1, v2, z1, z2, c) {
    var s = "", dv = (v1 - v2) / 11, dz = (z2 - z1) / 8;
    INV.forEach(function (riga, r) { for (var i = 0; i < 11; i++) if (riga[i] === "X") { var va = v1 - i * dv, zb = z2 - (r + 1) * dz; s += qR(u, va, va - dv, zb, zb + dz, F(c, "r")); } });
    return s;
  }
  function arcade(u, v) {
    var Or = "#f76707", s = basamento(u, v), vf = v + 2.1, uf = u + 2.2, i, SC = ["#22d3ee", "#ff6bd6", "#69db7c", "#ffd43b"];
    s += box(u + .3, v + .3, 1.9, 1.8, 3, 38, "#fff9db") + qL(vf, u + .3, uf, 34, 41, F(Or, "l")) + qR(uf, vf, v + .3, 34, 41, F(Or, "r"));
    s += qL(vf, u + .38, u + 2.12, 3, 22, F("#343a40", "l")) + qL(vf, u + .42, u + 2.08, 4, 21, S.luci ? "#3b2a66" : "#1c1c3c");
    for (i = 0; i < 4; i++) { var a = u + .55 + i * .39; s += qL(vf, a, a + .25, 4, 17.5, "#495057") + qL(vf, a + .04, a + .21, 12, 16.5, SC[i], G()); }
    s += tenda(vf, u + .32, u + 2.18, 25, .32, 8, Or, "#ffffff") + qL(vf, u + .55, u + 1.95, 26.5, 33.5, "#212529") + txL(vf, u + 1.25, 32, "GIOCHI", 7.5, "#ff6bd6", G());
    s += invasore(uf, v + 1.85, v + .6, 8, 31, S.luci ? "#69db7c" : "#40c057");
    s += box(u + .8, v + .85, .85, .55, 41, 6, "#212529") + cil(u + 1.45, v + .98, .07, 47, 2, "#fa5252") + cil(u + 1.45, v + 1.22, .07, 47, 2, "#4dabf7");
    var b = P(u + 1.02, v + 1.12, 47), t = [b[0], b[1] - 22];
    return s + linea(b, t, F("#868e96", "l"), 3.4) + sfera(t[0], t[1] - 2, 7.5, "#fa5252");
  }
  function faro(u, v) {
    var b = P(u, v, 0), h = 62, s = linea(b, [b[0], b[1] - h], F("#868e96", "l"), 2.2);
    s += box(u - .13, v - .07, .26, .14, h - 2, 9, "#495057", { cl: S.luci ? "#fff9db" : "#f1f3f5" });
    if (S.luci) s += pallino([b[0], b[1] - h - 2], S.notte ? 16 : 11, "url(#ctalone" + S.id + ")");
    return s;
  }
  function arena(uc, vc) {
    var B = "#1c7ed6", r = 1.18, i, s = ell(uc, vc, 0, 1.3, F(PIETRA, "t"), L(PIETRA));
    s += faro(uc - 1, vc - .75) + faro(uc + 1, vc - 1) + faro(uc - 1, vc + 1);
    var C0 = P(uc, vc, 0), rx = r * A * Math.SQRT2, ry = rx / 2;
    s += cil(uc, vc, r, 0, 24, B, { noTop: true });
    for (i = 1; i < 12; i++) { var an = Math.PI * i / 12, x = C0[0] - rx * Math.cos(an), y = C0[1] + ry * Math.sin(an); s += linea([x, y - 1], [x, y - 23], "rgba(255,255,255,.45)", 1.6); }
    [.36, .5, .64].forEach(function (k) { var an = Math.PI * k, x = C0[0] - rx * Math.cos(an), y = C0[1] + ry * Math.sin(an); s += "<path d='M" + f1(x - 3.5) + "," + f1(y) + " v-7 a3.5 3.5 0 0 1 7 0 v7 z' fill='" + F("#1b1f3a", "l") + "'/>"; });
    s += "<text x='" + f1(C0[0]) + "' y='" + f1(C0[1] + ry - 12) + "' text-anchor='middle' font-family='Nunito, Arial, sans-serif' font-weight='900' font-size='7.5' fill='#ffffff'>ARENA</text>";
    s += ell(uc, vc, 24, r, F(B, "t"), L(B));
    [[1.07, 21.5, "#e7f5ff"], [.96, 19, "#a5d8ff"], [.85, 16.5, "#e7f5ff"], [.74, 14, "#a5d8ff"]].forEach(function (g) { s += ell(uc, vc, g[1], g[0], F(g[2], "t")); });
    var COL = ["#ff6b6b", "#ffd43b", "#ffffff", "#748ffc", "#f783ac", "#63e6be"];
    for (i = 0; i < 46; i++) { var ph = Math.PI * (.78 + .94 * ((i * 37) % 46) / 46), rr = .8 + ((i * 13) % 5) * .065, zz = 14 + (rr - .74) / .11 * 2.5; s += pallino(P(uc + rr * Math.cos(ph), vc + rr * Math.sin(ph), zz + 1.2), 1.25, T(COL[i % 6])); }
    s += ell(uc, vc, 12, .62, F("#51cf66", "t")) + ell(uc, vc, 12, .5, "none", " stroke='rgba(255,255,255,.3)' stroke-width='5'");
    return s + linea(P(uc - .62, vc + .62, 12), P(uc + .62, vc - .62, 12), "#ffffff", 1.1) + ell(uc, vc, 12, .18, "none", " stroke='#ffffff' stroke-width='1.1'");
  }
  function locale(u, v) {
    var Pk = "#f06595", s = basamento(u, v), vf = v + 2.1, uf = u + 2.2, i, LC = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#f783ac"];
    s += box(u + .3, v + .3, 1.9, 1.8, 3, 36, "#3b2a4f") + qL(vf, u + .3, uf, 33, 39, F(Pk, "l")) + qR(uf, vf, v + .3, 33, 39, F(Pk, "r"));
    s += qL(vf, u + .45, u + .75, 10, 18, S.luci ? "#66d9e8" : "#3bc9db") + qL(vf, u + 1.75, u + 2.05, 10, 18, S.luci ? "#faa2c1" : "#f783ac");
    s += txL(vf, u + 1.25, 24.5, "PARTY", 9.5, S.luci ? "#ffc9f0" : "#ff6bd6", G() || " stroke='#ffffff' stroke-width='.4'");
    s += qL(vf, u + 1, u + 1.5, 3, 18, F("#fcc419", "l")) + qL(vf, u + 1.04, u + 1.46, 3, 17, "#1a1a1a");
    s += box(u + .82, vf + .3, .06, .06, 3, 7, "#fcc419") + box(u + 1.62, vf + .3, .06, .06, 3, 7, "#fcc419");
    var c1 = P(u + .85, vf + .33, 9.5), c2 = P(u + 1.65, vf + .33, 9.5);
    s += "<path d='M" + f1(c1[0]) + "," + f1(c1[1]) + " Q" + f1((c1[0] + c2[0]) / 2) + "," + f1((c1[1] + c2[1]) / 2 + 6) + " " + f1(c2[0]) + "," + f1(c2[1]) + "' stroke='" + T("#c92a2a") + "' stroke-width='2' fill='none'/>";
    s += qR(uf, v + 1.85, v + 1.35, 8, 26, F("#ffd43b", "r")) + txR(uf, v + 1.6, 15, "DJ", 7, "#3b2a4f") + qR(uf, v + 1.1, v + .6, 8, 26, F("#22d3ee", "r")) + txR(uf, v + .85, 14, "♪", 9, "#3b2a4f");
    for (i = 0; i < 11; i++) s += pallino(P(u + .35 + i * .17, vf, 38 - (i % 2) * 2), 1.5, LC[i % 5], G());
    for (i = 0; i < 10; i++) s += pallino(P(uf, vf - .1 - i * .17, 38 - (i % 2) * 2), 1.5, LC[(i + 2) % 5], G());
    var pd = P(u + 1.25, v + 1.2, 39), cb = [pd[0], pd[1] - 21];
    s += linea(pd, [pd[0], pd[1] - 12], F("#868e96", "l"), 1.6) + sfera(cb[0], cb[1], 9.5, "#ced4da");
    s += "<g stroke='rgba(80,80,100,.35)' stroke-width='.7' fill='none'><ellipse cx='" + f1(cb[0]) + "' cy='" + f1(cb[1]) + "' rx='9.5' ry='3.2'/><ellipse cx='" + f1(cb[0]) + "' cy='" + f1(cb[1]) + "' rx='3.6' ry='9.5'/><line x1='" + f1(cb[0] - 9.5) + "' y1='" + f1(cb[1]) + "' x2='" + f1(cb[0] + 9.5) + "' y2='" + f1(cb[1]) + "'/></g>" + stellina(cb[0] - 3, cb[1] - 4, 3);
    if (S.notte) ["#ff6bd6", "#22d3ee", "#ffd43b", "#69db7c"].forEach(function (c, k) { var an = -2.6 + k * .55; s += poly([cb, [cb[0] + Math.cos(an) * 70 - 4, cb[1] + Math.sin(an) * 70], [cb[0] + Math.cos(an) * 70 + 4, cb[1] + Math.sin(an) * 70]], c, " opacity='.22'"); });
    [["#f783ac", -.25, 26], ["#b197fc", -.1, 30], ["#ffd43b", .05, 25]].forEach(function (b) {
      var base = P(u + .55, vf + .32, 3), x = base[0] + b[1] * 40, y = base[1] - b[2];
      s += linea(base, [x, y + 5], "rgba(80,80,80,.6)", .6) + "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='4.2' ry='5.2' fill='" + T(b[0]) + "'/><ellipse cx='" + f1(x - 1.4) + "' cy='" + f1(y - 1.8) + "' rx='1.2' ry='1.6' fill='rgba(255,255,255,.6)'/>";
    });
    return s;
  }
  // Sala Trofei: tempio di marmo con le colonne, il tappeto rosso e la coppa d'oro in cima
  function trofei(u, v) {
    var M = "#f1f3f5", Go = "#fcc419", R = "#c92a2a", s = box(u + .05, v + .05, 2.4, 2.4, 0, 3, "#e9ecef"), vf = v + 1.95, uf = u + 2.1;
    s += box(u + .25, v + .25, 2, 2.2, 3, 4, M) + box(u + .4, v + .35, 1.7, 1.6, 7, 32, "#e9ecef");
    s += qL(vf, u + .98, u + 1.52, 7, 28, F(Go, "l")) + qL(vf, u + 1.03, u + 1.47, 7, 26, S.luci ? "#ffe8a3" : "#6b4423");
    s += qL(vf, u + .58, u + .78, 13, 34, F(R, "l")) + qL(vf, u + 1.72, u + 1.92, 13, 34, F(R, "l")) + pallino(P(u + .68, vf, 29), 1.7, F(Go, "l")) + pallino(P(u + 1.82, vf, 29), 1.7, F(Go, "l"));
    [[1.72, 1.47], [1.25, 1.0], [.8, .55]].forEach(function (k) { s += finR(uf, v + k[0], v + k[1], 14, 32, Go); });
    s += qT(u + 1.05, vf, u + 1.45, v + 2.45, 7.02, F(R, "t"));
    [.5, .95, 1.55, 2].forEach(function (k) { s += cil(u + k, v + 2.28, .075, 7, 32, M) + box(u + k - .1, v + 2.18, .2, .2, 39, 2, M); });
    s += box(u + .3, v + .3, 1.9, 2.2, 41, 6, M) + txL(v + 2.5, u + 1.25, 42.6, "TROFEI", 4.8, F("#a16207", "l"));
    s += tettoV(u + .25, u + 2.25, v + .25, v + 2.58, 47, 17, "#ced4da", M);
    var med = P(u + 1.25, v + 2.58, 52.5), cima = P(u + 1.25, v + 2.58, 64);
    s += pallino(med, 3.6, F(Go, "l"), " stroke='" + F("#b7791f", "l") + "' stroke-width='.6'") + stellina(med[0], med[1], 2.2);
    if (S.luci) s += pallino([cima[0], cima[1] - 12], S.notte ? 18 : 12, "url(#ctalone" + S.id + ")");
    s += coppa(cima[0], cima[1] + 1, .95);
    if (!S.notte) s += stellina(cima[0] - 12, cima[1] - 21, 2.6) + stellina(cima[0] + 11, cima[1] - 13, 2);
    return s;
  }
  // il Bar: chiosco tondo nella rotonda, con gli ombrelloni (qui ci si troverà con gli amici)
  function ombrellone(u, v, c1, c2) { return ombra(P(u, v, 0), 10) + cil(u, v, .09, 0, 7, "#a0652b") + linea(P(u, v, 7), P(u, v, 24), F("#868e96", "l"), 1.4) + cono(u, v, .3, 21, 5, c1, c2, 8); }
  function bar(uc, vc) {
    var s = ell(uc, vc, 0, 1.05, F("#f1e7d0", "t"), " stroke='" + F("#cbbd9c", "l") + "' stroke-width='2.5'") + ell(uc, vc, 0, .9, "none", " stroke='" + F("#e2d3b0", "l") + "' stroke-width='1.4' stroke-dasharray='4 4'");
    s += ombrellone(uc - .85, vc, "#4c6ef5", "#ffffff") + ombrellone(uc, vc - .85, "#4c6ef5", "#ffffff");
    s += cil(uc, vc, .34, 0, 19, "#fff4e6") + fasciaCil(uc, vc, .34, 8.5, 15.5, .2, .8, S.luci ? "#ffd75e" : "#5c3d2e") + fasciaCil(uc, vc, .36, 7.2, 8.8, .18, .82, F("#a0652b", "l"));
    s += cono(uc, vc, .48, 19, 14, "#e03131", "#ffffff", 12);
    var cima = P(uc, vc, 33);
    s += linea(cima, [cima[0], cima[1] - 5], F("#868e96", "l"), 1.2) + pallino([cima[0], cima[1] - 9], 5, "#ffffff", " stroke='" + F("#e03131", "l") + "' stroke-width='1'") + "<text x='" + f1(cima[0]) + "' y='" + f1(cima[1] - 6.6) + "' text-anchor='middle' font-size='6.5'>☕</text>";
    if (S.luci) s += arco(uc, vc, .5, 19.5, .02, .98, 10).map(function (p, k) { return pallino(p, 1.3, ["#ffd43b", "#ff6b6b", "#69db7c", "#4dabf7"][k % 4], G()); }).join("");
    return s + ombrellone(uc, vc + .85, "#fab005", "#ffffff") + ombrellone(uc + .85, vc, "#fab005", "#ffffff");
  }
  // la bacheca delle novità in piazza
  function bacheca(u, v) {
    var s = box(u + .02, v - .03, .05, .05, 0, 27, "#8b5a2b") + box(u + .73, v - .03, .05, .05, 0, 27, "#8b5a2b"), vf = v + .01;
    s += box(u - .04, v - .05, .88, .06, 8, 14, "#a0652b") + qL(vf, u + .04, u + .36, 10, 20.5, T("#ffffff")) + qL(vf, u + .42, u + .76, 11, 21, T("#fff3bf"));
    [12.5, 14.5, 16.5].forEach(function (z) { s += linea(P(u + .08, vf, z), P(u + .32, vf, z), "#adb5bd", .6) + linea(P(u + .46, vf, z + .5), P(u + .72, vf, z + .5), "#d9a400", .6); });
    s += pallino(P(u + .2, vf, 19.5), 1, "#fa5252") + pallino(P(u + .59, vf, 20), 1, "#4c6ef5");
    return s + qL(vf, u + .12, u + .68, 22, 26.5, F("#e03131", "l")) + txL(vf, u + .4, 23.2, "NOVITÀ", 3.4, "#ffffff");
  }
  function fontana(uc, vc) {
    var s = cil(uc, vc, .6, 0, 6, "#ced4da");
    s += ell(uc, vc, 6, .5, S.notte ? "#4dabf7" : T("#74c0fc")) + ell(uc, vc, 6, .5, "none", " stroke='rgba(255,255,255,.5)' stroke-width='1' stroke-dasharray='3 4'");
    s += cil(uc, vc, .1, 6, 15, "#e9ecef") + cil(uc, vc, .32, 21, 3, "#e9ecef") + ell(uc, vc, 24, .26, T("#a5d8ff"));
    var t = P(uc, vc, 24), rx = .3 * A * Math.SQRT2;
    s += "<path d='M" + f1(t[0] - rx) + "," + f1(t[1] + 1) + " q-7,4 -9,17 M" + f1(t[0] + rx) + "," + f1(t[1] + 1) + " q7,4 9,17 M" + f1(t[0] - 4) + "," + f1(t[1] + 5) + " q-3,6 -4,14 M" + f1(t[0] + 4) + "," + f1(t[1] + 5) + " q3,6 4,14' stroke='" + T("#a5d8ff") + "' stroke-width='2.2' fill='none' stroke-linecap='round' opacity='.9'/>";
    return s + linea(t, [t[0], t[1] - 8], T("#d0ebff"), 2.4) + pallino([t[0], t[1] - 9], 2.2, T("#e7f5ff"));
  }

  // il Circolo: palazzo all'italiana coi muri gialli, le persiane verdi, il tetto di coppi,
  // l'insegna di legno sopra la porta, la tenda a righe e il tavolino fuori con la tovaglia a quadri
  function persiane(lato, a, b, z1, z2, x) {   // una finestra con le due ante verdi aperte
    var V = "#2f9e44", w = Math.abs(b - a) * .32;
    if (lato === "L") return qL(x, a - w, a, z1, z2, F(V, "l")) + finL(x, a, b, z1, z2, "#ffffff") + qL(x, b, b + w, z1, z2, F(V, "l"));
    return qR(x, a + w, a, z1, z2, F(V, "r")) + finR(x, a, b, z1, z2, "#ffffff") + qR(x, b, b - w, z1, z2, F(V, "r"));
  }
  function circolo(u, v) {
    var M = "#f2c46d", s = basamento(u, v), vf = v + 2, uf = u + 2.2;
    s += box(u + .3, v + .25, 1.9, 1.75, 3, 38, M);
    s += qL(vf, u + .3, uf, 3, 6, F("#c9a24a", "l")) + qR(uf, vf, v + .25, 3, 6, F("#c9a24a", "r"));   // lo zoccolo
    s += qL(vf, u + .3, uf, 22.5, 24, F("#fff4e6", "l")) + qR(uf, vf, v + .25, 22.5, 24, F("#fff4e6", "r"));   // la fascia tra i piani
    // pianterreno: la porta a vetri in mezzo, una finestra per parte; di lato due finestre
    s += qL(vf, u + .98, u + 1.52, 3, 19.5, F("#6b4226", "l")) + qL(vf, u + 1.04, u + 1.46, 9, 18.5, S.luci ? "#ffd75e" : T("#a5d8ff")) + qL(vf, u + 1.243, u + 1.257, 3, 19.5, F("#4a2c18", "l"));
    s += persiane("L", u + .5, u + .76, 9, 18.5, vf) + persiane("L", u + 1.76, u + 2.02, 9, 18.5, vf);
    s += persiane("R", v + 1.72, v + 1.46, 9, 18.5, uf) + persiane("R", v + .98, v + .72, 9, 18.5, uf);
    // primo piano
    [[.5, .76], [1.12, 1.38], [1.76, 2.02]].forEach(function (k) { s += persiane("L", u + k[0], u + k[1], 26, 34.5, vf); });
    s += persiane("R", v + 1.72, v + 1.46, 26, 34.5, uf) + persiane("R", v + .98, v + .72, 26, 34.5, uf);
    // l'insegna di legno e la tenda a righe verdi
    s += qL(vf + .01, u + .62, u + 1.88, 19.8, 23.3, F("#5a3a22", "l")) + txL(vf + .01, u + 1.25, 20.5, "CIRCOLO", 5.4, S.luci ? "#ffe066" : "#ffe8a3", G());   // l'insegna sopra la porta, verso la piazza
    s += tenda(vf, u + .9, u + 1.6, 19.4, .3, 4, "#2f9e44", "#ffffff");
    // il tetto di coppi
    s += tettoV(u + .18, u + 2.32, v + .12, v + 2.12, 41, 15, "#c0522b", M);
    for (var i = 1; i < 6; i++) { var t = i / 6; s += linea(P(u + .18 + t * 1.07, v + .12, 41 + t * 15), P(u + .18 + t * 1.07, v + 2.12, 41 + t * 15), F("#a8441f", "t"), .7); }
    s += box(u + 1.6, v + .8, .22, .22, 48, 12, "#c0522b");   // il comignolo
    // fuori: il tavolino con la tovaglia a quadri, due sedie e due vasi
    s += box(u + .32, vf + .22, .38, .3, 0, 7.5, "#ffffff", { ct: T("#e03131") }) + box(u + .26, vf + .6, .14, .14, 0, 4.5, "#a0652b") + box(u + .62, vf + .6, .14, .14, 0, 4.5, "#a0652b");
    return s + vaso(u + .82, vf + .2) + vaso(u + 1.68, vf + .2);
  }

  // ---------- la città ----------
  var LOTTI = { casino: [4.15, 6.95], studio: [6.95, 4.15], circolo: [23.35, 26.15], giochi: [10.55, 13.35], arena: [13.35, 10.55], locale: [16.95, 19.75], trofei: [19.75, 16.95] };
  // i nomi: subito sopra il tetto di ogni edificio (altezza scelta a mano, così toccano l'edificio)
  var NOMI = { casino: ["🃏 Casinò", "#e03131", 95, 0], studio: ["📺 Studio TV", "#7048e8", 76, 0], circolo: ["🎲 Circolo", "#2f9e44", 70, 0], giochi: ["🕹️ Sala giochi", "#f08c00", 78, -4], arena: ["⚔️ Arena", "#1c7ed6", 46, 0], locale: ["🎉 Locale", "#d6336c", 64, 0], trofei: ["🏆 Trofei", "#f59f00", 74, 0] };
  var DISEGNA = { casino: casino, studio: studio, circolo: circolo, giochi: arcade, locale: locale, trofei: trofei };
  function edificio(k) {
    var u = LOTTI[k][0], v = LOTTI[k][1], c = [u + 1.25, v + 1.25], n = NOMI[k], p = P(c[0], c[1], n[2]);
    etichetta(p[0] + n[3], p[1] - 14, n[0], n[1], null, k);
    return { d: c[0] + c[1], s: tocco(k, k === "arena" ? arena(c[0], c[1]) : DISEGNA[k](u, v)) };
  }
  function strade(lista, w) {
    function banda(lungoV, c, ww) { return lungoV ? [P(c - ww, -14, 0), P(c + ww, -14, 0), P(c + ww, 52, 0), P(c - ww, 52, 0)] : [P(-14, c - ww, 0), P(52, c - ww, 0), P(52, c + ww, 0), P(-14, c + ww, 0)]; }
    var s = "";
    lista.forEach(function (r) { s += poly(banda(r[0], r[1], w + .1), T("#cbbd9c")); });
    lista.forEach(function (r) { s += poly(banda(r[0], r[1], w), T("#efe7d4")); });
    lista.forEach(function (r) { var m = r[0] ? [P(r[1], -14, 0), P(r[1], 52, 0)] : [P(-14, r[1], 0), P(52, r[1], 0)]; s += linea(m[0], m[1], S.notte ? "#8f94ad" : T("#ffffff"), 2.2, " stroke-dasharray='9 9'"); });
    return s;
  }
  var NOMI_GENTE = ["Sara", "Marco", "Giulia", "Luca", "Chiara", "Dario"];
  function disegna(fase, io) {
    S = FASI[fase] || FASI.giorno; P = proiezione(150, 0); ET = []; nf = 0;
    var AM = NOMI_GENTE.map(function (n) { return window.SGOmino.casuale(n); }), og = [], i;
    var s = defs() + "<rect x='-200' y='-200' width='700' height='1300' fill='" + T("#9bd36d") + "'/>";
    for (i = 0; i < 110; i++) s += "<path d='M" + ((i * 67) % 300) + "," + ((i * 113) % ALTO) + " l2,-5 l2,5' stroke='" + T("#86c25a") + "' stroke-width='1.5' fill='none'/>";
    s += strade([[true, 10], [true, 16.4], [true, 22.8], [false, 10], [false, 16.4], [false, 22.8]], .54);
    s += tocco("piazza", ell(10, 10, 0, 1.4, F("#f1e7d0", "t"), " stroke='" + F("#cbbd9c", "l") + "' stroke-width='2.5'") + ell(10, 10, 0, 1.1, "none", " stroke='" + F("#e2d3b0", "l") + "' stroke-width='1.6' stroke-dasharray='5 4'"));
    s += fiori(8.4, 12.9) + fiori(12.9, 8.4) + fiori(21.2, 25.6) + fiori(25.6, 21.2);
    s += ell(22.8, 22.8, 0, 1.0, F("#8ce99a", "t"), L("#69db7c")) + ell(22.8, 22.8, 0, .72, "none", " stroke='" + F("#ffffff", "t") + "' stroke-width='1.4' stroke-dasharray='4 4'");   // l'aiuola della rotonda in basso
    Object.keys(LOTTI).forEach(function (k) { og.push(edificio(k)); });
    og.push({ d: 20, s: tocco("piazza", fontana(10, 10)) }, { d: 19.4, s: tocco("piazza", bacheca(10, 9)) }, { d: 32.8, s: tocco("bar", bar(16.4, 16.4)) });
    [[7.6, 12.4, 1], [12.4, 7.6, 1], [2.6, 7.4, .9], [4.9, 4.6, 1.1], [3.6, 5.6, .9], [5.7, 3.5, .95], [26.4, 23.8, 1.15], [27.9, 24.9, 1], [26.9, 25.6, .9], [24.2, 20.9, .9], [20.9, 24.2, .9]].forEach(function (t) { og.push({ d: t[0] + t[1], s: albero(t[0], t[1], t[2]) }); });
    [[14.2, 18.6], [18.6, 14.2], [20.9, 20.9]].forEach(function (t) { og.push({ d: t[0] + t[1], s: pino(t[0], t[1], 1) }); });
    [[7.5, 10.55], [10.55, 7.5], [20.3, 23.35], [23.35, 20.3]].forEach(function (l) { og.push({ d: l[0] + l[1], s: lampione(l[0], l[1]) }); });
    og.push({ d: 51.4, s: panchina(25.8, 25.6) });   // il parco accanto al Circolo
    og.push({ d: 23.2, s: auto(12.6, 9.55, "#fa5252") }, { d: 29, s: auto(12.4, 15.98, "#4dabf7") }, { d: 41.6, s: auto(18.9, 22.38, "#fcc419") });
    // (il cantiere dell'anteprima, gru, transenne e birilli, è finito: la città è aperta; le funzioni restano per i lavori futuri)
    // la gente: in piazza a leggere le novità, al bar, per strada
    [[AM[0], 10.85, 9.6], [AM[1], 11.3, 10.2], [AM[4], 9.4, 10.65], [AM[2], 16.95, 17.35], [AM[3], 17.35, 16.95], [AM[5], 16.6, 13.6]].forEach(function (g) { og.push({ d: g[1] + g[2] + .2, s: gente(g[0], g[1], g[2], 22) }); });
    if (io) og.push({ d: 21.8, s: gente(io, 10.7, 10.9, 28) });
    og.sort(function (x, y) { return x.d - y.d; });
    og.forEach(function (o) { s += o.s; });
    if (S.notte) s += "<rect x='-200' y='-200' width='700' height='1300' fill='url(#ctvig" + S.id + ")' pointer-events='none'/>";   // (la sera e la notte: il velo non deve coprire gli edifici al tocco)
    else if (S.tramonto) s += "<rect x='-200' y='-200' width='700' height='1300' fill='url(#ctcaldo" + S.id + ")' pointer-events='none'/>";
    var pb = P(16.4, 16.4, 40);
    etichetta(pb[0], pb[1] - 12, "☕ Bar", "#e03131", null, "bar");
    etichetta(150, 292, "📰 Novità", "#4c6ef5", null, "piazza");
    s += ET.join("");
    return io ? s + tu(145, 222) : s;
  }

  // ---------- il sole vero in Italia (Roma), con l'ora legale ----------
  function italia(d) {
    var y = d.getUTCFullYear();
    function ultimaDomenica(m) { var x = new Date(Date.UTC(y, m + 1, 0, 1)); x.setUTCDate(x.getUTCDate() - x.getUTCDay()); return x; }
    var off = d >= ultimaDomenica(2) && d < ultimaDomenica(9) ? 120 : 60;
    return { min: (d.getUTCHours() * 60 + d.getUTCMinutes() + off) % 1440, off: off };
  }
  function sole(d) {
    var rad = Math.PI / 180, lat = 41.9, lon = 12.5;
    var n = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / 864e5);
    var B = rad * 360 / 365 * (n - 81), decl = 23.44 * Math.sin(B), eqt = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B);
    var cosH = (Math.sin(-.833 * rad) - Math.sin(lat * rad) * Math.sin(decl * rad)) / (Math.cos(lat * rad) * Math.cos(decl * rad));
    var H = Math.acos(Math.max(-1, Math.min(1, cosH))) / rad, mezzodi = 720 - 4 * lon - eqt + italia(d).off;
    return { alba: mezzodi - 4 * H, tramonto: mezzodi + 4 * H };
  }
  // tramonto e alba: mezz'ora prima e dopo; di giorno tra l'alba e il tramonto; il resto è notte
  function fase(d) {
    d = d || new Date();
    var s = sole(d), m = italia(d).min;
    if (Math.abs(m - s.tramonto) < 30 || Math.abs(m - s.alba) < 30) return "tramonto";
    return m > s.alba && m < s.tramonto ? "giorno" : "notte";
  }

  window.SGCitta = {
    svg: function (opz) {
      opz = opz || {};
      var corpo = disegna(opz.fase || fase(new Date()), opz.io || null), m = opz.sopra || 0;
      return "<svg viewBox='0 " + (-m) + " 300 " + (ALTO + m) + "' width='300' height='" + (ALTO + m) + "' preserveAspectRatio='xMidYMid meet' xmlns='http://www.w3.org/2000/svg'>" + corpo + "</svg>";
    },
    fase: fase,
    colorePrato: function (f) { S = FASI[f] || FASI.giorno; return T("#9bd36d"); }
  };
})();

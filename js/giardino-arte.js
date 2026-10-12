/* =========================================================
   SPeeD GAME — I DISEGNI DEL GIARDINO (SGGiardinoArte)
   Alberi da frutto, orto, fiori, decorazioni, vialetti, staccionata e una casa semplice di riserva.
   Visti dall'alto e inclinati come la città: una mattonella è un rombo largo 100 e alto 50.
   Stile dei reperti degli scavi: sfumature (chiaro in alto a sinistra, scuro in basso a destra), contorno caldo scuro,
   ombra morbida a terra, riflessi, dettagli dentro la sagoma (clipPath), trame con un seme fisso (mai Math.random).
   SGGiardinoArte = { nomi(), info(nome) -> { w, h, ax, ay, fp, dietro? }, svg(nome, opz) }
   opz.notte: finestre e lampade accese; opz.dietro: l'oggetto girato di mezzo giro (solo per chi ha info().dietro: panchina,
   nano, casetta degli uccellini, cassetta della posta, barbecue). Gli altri due versi il motore li fa con lo specchio.
   ========================================================= */
(function () {
  "use strict";

  // ---------- attrezzi ----------
  var nId = 0, p = "", DEFS = [], FATTI = {};   // il disegno in corso: prefisso degli id e definizioni (sfumature, ritagli)
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  // dal terreno allo schermo: u = colonne (in basso a destra), v = righe (in basso a sinistra), z = altezza; (0,0,0) = centro dell'impronta
  function P(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f1(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f1(rx) + "' ry='" + f1(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + (w || 2.5) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f1(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q(a) + " L" + q(b); }
  function giro(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function ruota(a, x, y) { return "transform='rotate(" + f1(a) + " " + f1(x) + " " + f1(y) + ")'"; }
  function sposta(a, dx, dy) { return a.map(function (x) { return [x[0] + dx, x[1] + dy]; }); }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  // le sfumature e i ritagli: tornano già pronti da usare ("url(#...)" o "clip-path=...")
  function sfum(tag, nome, stops, a) {
    var id = p + nome;
    if (!FATTI[id]) {
      FATTI[id] = 1;
      DEFS.push("<" + tag + " id='" + id + "' " + a + ">" + stops.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join("") + "</" + tag + ">");
    }
    return "url(#" + id + ")";
  }
  function lin(nome, stops, x1, y1, x2, y2, user) { return sfum("linearGradient", nome, stops, "x1='" + f1(x1) + "' y1='" + f1(y1) + "' x2='" + f1(x2) + "' y2='" + f1(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function rad(nome, stops, cx, cy, r) { return sfum("radialGradient", nome, stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function tre(c, a, b) { return [[0, chiaro(c, a == null ? .3 : a)], [.5, c], [1, scuro(c, b == null ? .3 : b)]]; }
  // sfumatura su una faccia inclinata: va dal lato a-b al lato opposto (dove sta c), con le righe parallele ai lati
  function linPiano(nome, stops, a, b, c) {
    var dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, k = (c[0] - a[0]) * nx + (c[1] - a[1]) * ny;
    return lin(nome, stops, a[0], a[1], a[0] + nx * k, a[1] + ny * k, true);
  }
  function clip(nome, forme) { var id = p + nome; if (!FATTI[id]) { FATTI[id] = 1; DEFS.push("<clipPath id='" + id + "'>" + forme + "</clipPath>"); } return "clip-path='url(#" + id + ")'"; }
  function dentro(nome, forma, corpo) { return "<g " + clip(nome, forma) + ">" + corpo + "</g>"; }   // corpo ritagliato dentro la forma
  function ombra(x, y, rx, ry, k) {   // l'ombra morbida a terra (la luce viene da in alto a sinistra)
    return ell(x, y, rx, ry, rad("om", [[0, "#000", .2], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5), k ? "opacity='" + k + "'" : "");
  }
  // una scatola: c = [sopra, faccia davanti a sinistra, faccia davanti a destra]
  function scatola(u, v, du, dv, z, h, c, L, lw) {
    var t1 = P(u, v, z + h), t2 = P(u + du, v, z + h), t3 = P(u + du, v + dv, z + h), t4 = P(u, v + dv, z + h),
      b2 = P(u + du, v, z), b3 = P(u + du, v + dv, z), b4 = P(u, v + dv, z), st = bordo(L, lw || 1.5);
    return poly([b4, b3, t3, t4], c[1], st) + poly([b3, b2, t2, t3], c[2], st) + poly([t1, t2, t3, t4], c[0], st);
  }
  function palo(a, b, w, c, L) {   // un palo tondo (legno o ferro): il bordo scuro sotto, il colore, il filo di luce a sinistra
    var d = linea(a, b);
    return tratto(d, L || "#4a2c17", w + 3) + tratto(d, c, w) + tratto(d, chiaro(c, .4), Math.max(1, w * .28), "opacity='.75' transform='translate(" + f1(-w * .22) + " 0)'");
  }
  function riccio(cx, cy, rx, ry, n, amp, rot) {   // un ovale col bordo a smerli (foglie arricciate, nuvolette)
    var d = "", i, a0 = rot || 0;
    for (i = 0; i <= n; i++) {
      var t = a0 + i / n * 6.2832, x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry;
      if (!i) { d = "M" + q(x, y); continue; }
      var tm = a0 + (i - .5) / n * 6.2832;
      d += " Q" + q(cx + Math.cos(tm) * rx * (1 + amp), cy + Math.sin(tm) * ry * (1 + amp)) + " " + q(x, y);
    }
    return d + " Z";
  }
  function foglia(x, y, ang, L, W, fill, lc, lw) {   // una foglia a punta (base in x,y, girata di ang gradi)
    var d = "M0,0 C" + q(W, -L * .2) + " " + q(W * .85, -L * .75) + " " + q(0, -L) + " C" + q(-W * .85, -L * .75) + " " + q(-W, -L * .2) + " 0,0 Z";
    return "<g transform='translate(" + f1(x) + " " + f1(y) + ") rotate(" + f1(ang) + ")'>" + pth(d, fill, bordo(lc, lw || 1.3)) + tratto("M0,-1 L0," + f1(-L * .8), lc, .7, "opacity='.55'") + "</g>";
  }

  // il registro dei disegni: box = [x0, y0, x1, y1] attorno al punto d'appoggio (centro dell'impronta)
  var DIS = {};
  function def(nome, box, fp, fn, dietro) { DIS[nome] = { box: box, fp: fp, fn: fn, dietro: !!dietro }; }   // dietro: ha anche il disegno girato di mezzo giro (svg(nome, { dietro: true }))
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }

  // =========================================================
  //  LA CHIOMA (alberi e cespugli): tanti ciuffi tondi con un contorno solo tutto intorno,
  //  la luce da in alto a sinistra e le foglioline dentro
  // =========================================================
  function giroChioma(cs) { var b = [1e9, 1e9, -1e9, -1e9]; cs.forEach(function (c) { b[0] = Math.min(b[0], c[0] - c[2]); b[1] = Math.min(b[1], c[1] - c[2]); b[2] = Math.max(b[2], c[0] + c[2]); b[3] = Math.max(b[3], c[1] + c[2]); }); return b; }
  function chioma(cs, col, lc, seme, o) {
    o = o || {};
    var r = rnd(seme), s = "", lw = o.lw || 2.6, sc = o.sc || 1, nome = o.nome || "ch", i, j, B = giroChioma(cs), x0 = B[0], y0 = B[1], x1 = B[2], y1 = B[3];
    // ogni ciuffo ha il bordo a smerli (le foglie che spuntano), girato a caso ma sempre uguale
    var giri = cs.map(function (b) { return [Math.max(6, Math.round(b[2] / 3.6)), r() * 6.28]; });
    function ciuffo(b, i, piu) { return riccio(b[0], b[1], b[2] + piu, b[2] + piu, giri[i][0], .09, giri[i][1]); }
    var forme = cs.map(function (b, i) { return pth(ciuffo(b, i, 0), "#000"); }).join("");
    cs.forEach(function (b, i) { s += pth(ciuffo(b, i, lw), lc); });   // il contorno (tutti i ciuffi un po' più grandi, sotto)
    var g = rad(nome + "g", [[0, mix(col[1], col[0], .75)], [.6, col[1]], [1, mix(col[1], col[2], .55)]], .36, .3, .8);
    cs.forEach(function (b, i) {   // il ciuffo e, sul suo lato in basso a destra, l'ombra che lo stacca da quelli dietro
      var a0 = -.2, a1 = 2.5, rr = b[2] * .93;
      s += pth(ciuffo(b, i, 0), g) + tratto("M" + q(b[0] + Math.cos(a0) * rr, b[1] + Math.sin(a0) * rr) + " A" + f1(rr) + " " + f1(rr) + " 0 0 1 " + q(b[0] + Math.cos(a1) * rr, b[1] + Math.sin(a1) * rr), col[2], 2.2 * sc, "opacity='.5'");
    });
    var t = "<rect x='" + f1(x0) + "' y='" + f1(y0) + "' width='" + f1(x1 - x0) + "' height='" + f1(y1 - y0) + "' fill='" +
      lin(nome + "l", [[0, "#ffffff", .22], [.42, "#ffffff", 0], [.58, "#000000", 0], [1, "#000000", .3]], x0, y0, x1, y1, true) + "'/>";
    t += ell((x0 + x1) / 2 + (x1 - x0) * .08, y1, (x1 - x0) * .42, (y1 - y0) * .2, col[2], "opacity='.45'");   // l'ombra sotto la chioma
    var aree = cs.map(function (b) { return b[2] * b[2]; }), tot = 0; aree.forEach(function (a) { tot += a; });
    var n = o.n || Math.round(tot / 60);
    for (i = 0; i < n; i++) {   // le foglioline: chiare in alto a sinistra, scure in basso a destra
      var u = r() * tot; j = 0; while (j < cs.length - 1 && u > aree[j]) { u -= aree[j]; j++; }
      var b = cs[j], an = r() * 6.2832, dd = Math.sqrt(r()) * b[2] * .9, x = b[0] + Math.cos(an) * dd, y = b[1] + Math.sin(an) * dd;
      var lum = (y - y0) / (y1 - y0) * .55 + (x - x0) / (x1 - x0) * .45 + (r() - .5) * .45;
      var ch = r() < .12 ? 2 : lum < .5 ? 0 : 1;   // ogni tanto una foglia più scura e più grande
      t += ell(x, y, (ch === 2 ? 4 : 3.3) * sc, (ch === 2 ? 1.8 : 1.5) * sc, ch ? col[2] : col[0], "opacity='" + (ch === 0 ? .65 : ch === 1 ? .45 : .6) + "' " + ruota(r() * 180, x, y));
    }
    for (i = 0; i < (o.lucido || 0); i++) {   // le foglie lucide (arancio): puntini di luce
      var x2 = x0 + r() * (x1 - x0) * .7, y2 = y0 + r() * (y1 - y0) * .8;
      t += ell(x2, y2, 1.8 * sc, .9 * sc, "#ffffff", "opacity='.7' " + ruota(-30 + r() * 60, x2, y2));
    }
    s += dentro(nome + "c", forme, t);
    cs.forEach(function (b) {   // i riflessi sui ciuffi in alto a sinistra
      if (b[1] > y0 + (y1 - y0) * .42 || b[0] > (x0 + x1) / 2 + 15) return;
      s += tratto("M" + q(b[0] - b[2] * .66, b[1] - b[2] * .05) + " Q" + q(b[0] - b[2] * .6, b[1] - b[2] * .62) + " " + q(b[0] - b[2] * .05, b[1] - b[2] * .7), "#ffffff", 2.4 * sc, "opacity='.42'");
    });
    return s;
  }

  // =========================================================
  //  ALBERI DA FRUTTO: 4 specie × 4 stadi (0 germoglio, 1 alberello, 2 adulto, 3 coi frutti)
  // =========================================================
  var SPECIE = {
    melo: { seme: 11, foglia: ["#a6da6c", "#5c9d39", "#2a5e20"], linea: "#21401a", fogliaW: .42,
      corteccia: ["#a99178", "#7a6450", "#4c3c2e"], lineaT: "#33261a", alto: 64, largo: 23, centro: [0, -172],
      ciuffi: [[-34, -216, 30], [8, -224, 32], [46, -206, 28], [-64, -184, 28], [-28, -190, 34], [16, -194, 34], [58, -178, 30],
        [-52, -152, 30], [-12, -156, 34], [30, -154, 32], [64, -148, 22], [-30, -126, 26], [10, -124, 28], [44, -128, 22]],
      rami: [[-5, -58, -22, -82, -46, -122, 10], [5, -58, 24, -84, 44, -124, 9], [0, -60, 3, -96, -4, -146, 8]],
      frutto: "mela", nFr: 10, distFr: 17 },
    arancio: { seme: 23, foglia: ["#74b24c", "#2e7a2c", "#134416"], linea: "#0f3311", fogliaW: .38, lucido: 30,
      corteccia: ["#a3967c", "#716650", "#463f30"], lineaT: "#2c271c", alto: 70, largo: 17, centro: [0, -150],
      ciuffi: [[-20, -202, 22], [16, -204, 22], [-42, -180, 22], [-2, -186, 26], [36, -180, 22], [-54, -152, 22], [-18, -158, 26], [18, -156, 26],
        [52, -148, 20], [-42, -126, 22], [-2, -124, 26], [36, -124, 22], [-28, -100, 17], [2, -96, 19], [28, -100, 16]],
      rami: [[-2, -66, -14, -92, -28, -118, 7], [2, -68, 14, -94, 24, -116, 6]],
      frutto: "arancia", nFr: 11, distFr: 16 },
    limone: { seme: 37, foglia: ["#d2ec7c", "#8fc044", "#4c7d22"], linea: "#33561a", fogliaW: .28,
      corteccia: ["#ab9878", "#7a6a4f", "#4c412f"], lineaT: "#30291c", alto: 60, largo: 17, centro: [0, -166],
      ciuffi: [[-44, -216, 20], [-6, -228, 24], [32, -212, 22], [66, -198, 15], [-72, -180, 17], [-38, -186, 26], [6, -192, 28], [46, -174, 24],
        [-58, -150, 21], [-20, -152, 27], [24, -144, 25], [60, -138, 15], [-36, -120, 17], [4, -116, 21], [38, -114, 13]],
      rami: [[-4, -56, -20, -80, -40, -116, 7], [4, -56, 20, -82, 40, -112, 7], [0, -58, 1, -96, 4, -150, 6]],
      rametti: [[-70, -152, -88, -160, -100, -158], [70, -194, 84, -206, 92, -220], [-12, -246, -16, -256, -24, -264]],
      frutto: "limone", nFr: 9, distFr: 18 },
    ciliegio: { seme: 41, foglia: ["#9fd56b", "#4f9b3f", "#245c22"], linea: "#1d3e17", fogliaW: .36, righe: true,
      corteccia: ["#b0715f", "#7e4337", "#4f2620"], lineaT: "#3a1b15", alto: 92, largo: 18, centro: [0, -180],
      ciuffi: [[-52, -212, 24], [-14, -220, 27], [24, -218, 27], [58, -208, 22], [-84, -188, 20], [-48, -192, 28], [-4, -196, 30], [42, -192, 28],
        [80, -182, 20], [-70, -164, 22], [-30, -166, 26], [12, -168, 28], [52, -162, 24], [84, -158, 14], [-36, -146, 18], [24, -146, 20]],
      rami: [[-4, -88, -30, -112, -62, -148, 8], [-2, -90, -10, -126, -22, -168, 7], [3, -90, 14, -126, 28, -168, 7], [5, -88, 34, -112, 66, -146, 8]],
      frutto: "ciliegie", nFr: 9, distFr: 19 }
  };
  function chiomaDi(sp, st) {   // i ciuffi giusti per lo stadio (l'alberello ha la chioma piccola, stessa forma)
    if (st >= 2) return sp.ciuffi;
    var k = .4, c = sp.centro;
    return sp.ciuffi.map(function (b) { return [(b[0] - c[0]) * k, -112 + (b[1] - c[1]) * k, b[2] * k + 1.6]; });
  }
  function ombraAlbero(sp, st) { var B = giroChioma(chiomaDi(sp, st)), rx = st >= 2 ? (B[2] - B[0]) * .36 : 32; return [st >= 2 ? 16 : 10, st >= 2 ? 6 : 5, rx, rx * .36]; }
  function paletto(x, y0, y1) {   // il paletto di sostegno (legno chiaro, la punta smussata in alto)
    return poly([[x - 2.3, y0], [x + 2.3, y0], [x + 2.3, y1 + 2.5], [x, y1], [x - 2.3, y1 + 2.5]], lin("pal", [[0, "#e6c592"], [1, "#a8783f"]], 0, 0, 1, 0), bordo("#5a3a1e", 1.6));
  }
  function laccio(x0, x1, y) { return tratto("M" + q(x0, y) + " Q" + q((x0 + x1) / 2, y + 3) + " " + q(x1, y - 1), "#5a3a1e", 2.6) + tratto("M" + q(x0, y) + " Q" + q((x0 + x1) / 2, y + 3) + " " + q(x1, y - 1), "#d8c08a", 1.4); }
  function tronco(sp, alto, largo, giovane) {   // il fusto: si allarga alle radici, sfumato da sinistra (luce) a destra
    var w = largo / 2, t = w * .6, r = rnd(sp.seme + 3), i, s = "";
    var d = "M" + q(-w * 1.75, 4) + " C" + q(-w * 1.05, 2) + " " + q(-w * .95, -alto * .1) + " " + q(-w * .9, -alto * .3) + " L" + q(-t, -alto) +
      " L" + q(t, -alto) + " L" + q(w * .9, -alto * .3) + " C" + q(w * .95, -alto * .1) + " " + q(w * 1.05, 2) + " " + q(w * 1.85, 4) + " Q" + q(0, 8) + " " + q(-w * 1.75, 4) + " Z";
    s += pth(d, lin("tr", [[0, sp.corteccia[0]], [.45, sp.corteccia[1]], [1, sp.corteccia[2]]], 0, 0, 1, 0));
    // il contorno solo sui fianchi e sotto: in cima il tronco continua nei rami senza riga
    s += tratto("M" + q(t, -alto) + " L" + q(w * .9, -alto * .3) + " C" + q(w * .95, -alto * .1) + " " + q(w * 1.05, 2) + " " + q(w * 1.85, 4) + " Q" + q(0, 8) + " " + q(-w * 1.75, 4) +
      " C" + q(-w * 1.05, 2) + " " + q(-w * .95, -alto * .1) + " " + q(-w * .9, -alto * .3) + " L" + q(-t, -alto), sp.lineaT, giovane ? 1.8 : 2.6);
    var t2 = "";
    if (sp.righe) {   // il ciliegio: la corteccia lucida a righe orizzontali (le lenticelle)
      for (i = 0; i < alto / 6; i++) { var y = -3 - i * 6 - r() * 2, x = -w + r() * w * .8, l = 3 + r() * w; t2 += tratto(linea([x, y], [x + l, y + .4]), i % 3 ? "#e8c4ad" : "#3a1b15", giovane ? .9 : 1.4, "opacity='" + (i % 3 ? .75 : .5) + "'"); }
    } else {   // gli altri: crepe lunghe in verticale
      for (i = 0; i < (giovane ? 2 : 5); i++) { var xx = -w * .7 + r() * w * 1.4, y1 = -4 - r() * alto * .3, y2 = y1 - alto * (.25 + r() * .35); t2 += tratto("M" + q(xx, y1) + " Q" + q(xx + (r() - .5) * 4, (y1 + y2) / 2) + " " + q(xx + (r() - .5) * 3, y2), sp.lineaT, giovane ? .8 : 1.2, "opacity='.5'"); }
    }
    t2 += tratto(linea([-w * .55, 0], [-t * .6, -alto]), sp.corteccia[0], giovane ? 1.2 : 2.2, "opacity='.6'");   // la luce sul lato sinistro
    return s + dentro("trc", "<path d='" + d + "'/>", t2);
  }
  function ramo(a, sp) { var d = "M" + q(a[0], a[1]) + " Q" + q(a[2], a[3]) + " " + q(a[4], a[5]); return tratto(d, sp.lineaT, a[6] + 3.4) + tratto(d, sp.corteccia[1], a[6]) + tratto(d, sp.corteccia[0], Math.max(1.2, a[6] * .3), "opacity='.55' transform='translate(-1 -.5)'"); }
  function rametto(a, sp) {   // un rametto che esce dalla chioma con tre foglie (limone)
    var d = "M" + q(a[0], a[1]) + " Q" + q(a[2], a[3]) + " " + q(a[4], a[5]), g = lin("fr", tre(sp.foglia[1], .35, .25), 0, 0, 1, 1), s = tratto(d, sp.lineaT, 4) + tratto(d, sp.corteccia[1], 2);
    s += foglia(a[2], a[3], a[4] > a[0] ? 40 : -40, 11, 11 * sp.fogliaW, g, sp.linea) + foglia(a[4], a[5], a[4] > a[0] ? 70 : -70, 12, 12 * sp.fogliaW, g, sp.linea) + foglia(a[4], a[5], a[4] > a[0] ? 10 : -10, 10, 10 * sp.fogliaW, g, sp.linea);
    return s;
  }
  // i frutti
  var FRUTTO = {
    mela: function (x, y) {
      var r = 7.6, d = "M" + q(x, y - r * .72) + " C" + q(x + r * .55, y - r * 1.12) + " " + q(x + r * 1.08, y - r * .55) + " " + q(x + r, y + r * .05) + " C" + q(x + r * .92, y + r * .8) + " " + q(x + r * .38, y + r * 1.02) + " " + q(x, y + r * .92) +
        " C" + q(x - r * .38, y + r * 1.02) + " " + q(x - r * .92, y + r * .8) + " " + q(x - r, y + r * .05) + " C" + q(x - r * 1.08, y - r * .55) + " " + q(x - r * .55, y - r * 1.12) + " " + q(x, y - r * .72) + " Z";
      return pth(d, rad("mela", [[0, "#ff9e8c"], [.42, "#e5383b"], [1, "#8a1515"]], .36, .32, .78), bordo("#561010", 1.5)) +
        tratto("M" + q(x, y - r * .62) + " Q" + q(x + .6, y - r * 1.05) + " " + q(x + 2.4, y - r * 1.3), "#5a3a1c", 1.5) +
        foglia(x + 2.2, y - r * 1.22, 62, 6, 2.6, "#5c9d39", "#21401a", .9) +
        ell(x - r * .4, y - r * .22, r * .27, r * .17, "#ffffff", "opacity='.75' " + ruota(-35, x - r * .4, y - r * .22));
    },
    arancia: function (x, y) {
      var r = 7.4, s = cer(x, y, r, rad("ara", [[0, "#ffd391"], [.45, "#fd8a14"], [1, "#b04606"]], .36, .32, .78), bordo("#5e2a06", 1.5));
      s += cer(x + 2.6, y + 2.2, .7, "#b04606", "opacity='.6'") + cer(x - 1.2, y + 3.6, .6, "#b04606", "opacity='.6'") + cer(x + 4, y - 1.4, .6, "#b04606", "opacity='.5'");   // la buccia a puntini
      s += pth("M" + q(x + .5, y - r + .6) + " l1.6,-1.2 l.2,1.6 l1.5,.3 l-1.4,.9 Z", "#3c7a2a", bordo("#163d12", .6));   // il picciolo a stellina
      return s + ell(x - r * .38, y - r * .32, r * .3, r * .18, "#ffffff", "opacity='.7' " + ruota(-35, x - r * .38, y - r * .32));
    },
    limone: function (x, y, i) {   // ovale con la punta (il "capezzolo") da una parte
      var a = [-18, 22, -8, 30, -26, 12][i % 6], rx = 7.6, ry = 6.3, d = "M" + q(-rx - 1.4, 0) + " C" + q(-rx, -ry * 1.12) + " " + q(rx * .7, -ry * 1.18) + " " + q(rx + .4, -ry * .38) +
        " L" + q(rx + 3.2, 0) + " L" + q(rx + .4, ry * .38) + " C" + q(rx * .7, ry * 1.18) + " " + q(-rx, ry * 1.12) + " " + q(-rx - 1.4, 0) + " Z";
      return "<g transform='translate(" + f1(x) + " " + f1(y) + ") rotate(" + a + ")'>" + pth(d, rad("lim", [[0, "#fffbd0"], [.4, "#ffe14d"], [.8, "#f2b705"], [1, "#a87b00"]], .36, .3, .8), bordo("#5e4604", 1.5)) +
        ell(-2.8, -2.6, 2.8, 1.3, "#ffffff", "opacity='.8'") + cer(1.6, 2, .5, "#b88a04", "opacity='.6'") + cer(4, .4, .5, "#b88a04", "opacity='.6'") + cer(-1.4, 3, .5, "#b88a04", "opacity='.5'") +
        tratto("M" + q(-rx - 1.2, 0) + " l-2.4,-1.4", "#4c7d22", 1.4) + "</g>";
    },
    ciliegie: function (x, y) {   // le ciliegie a coppie, coi piccioli uniti in alto
      var g = rad("cil", [[0, "#ff8a8a"], [.4, "#d4142f"], [1, "#5c0612"]], .36, .32, .78), s = "";
      s += tratto("M" + q(x - 3.6, y - 3) + " Q" + q(x - 2.5, y - 9) + " " + q(x + 1.4, y - 12.5), "#4a5a1c", 1.5) + tratto("M" + q(x + 4, y - 2) + " Q" + q(x + 3.6, y - 8) + " " + q(x + 1.4, y - 12.5), "#4a5a1c", 1.5);
      s += foglia(x + 1.4, y - 12.4, 55, 7, 3, "#4f9b3f", "#1d3e17", .9);
      s += cer(x - 3.8, y + 1.2, 4.6, g, bordo("#3d040c", 1.3)) + cer(x + 4.2, y + 2.2, 4.6, g, bordo("#3d040c", 1.3));
      return s + ell(x - 5.2, y - .3, 1.3, .8, "#ffffff", "opacity='.8'") + ell(x + 2.8, y + .7, 1.3, .8, "#ffffff", "opacity='.8'");
    }
  };
  function postiFrutti(sp) {   // dove stanno i frutti: nei ciuffi di mezzo e davanti, non troppo vicini tra loro
    var r = rnd(sp.seme + 9), out = [], tent = 0, cs = sp.ciuffi, cy = sp.centro[1];
    while (out.length < sp.nFr && tent++ < 4000) {
      var b = cs[Math.floor(r() * cs.length)]; if (b[1] < cy - 28) continue;
      var a = r() * 6.2832, d = Math.sqrt(r()) * (b[2] - 8), x = b[0] + Math.cos(a) * d, y = b[1] + Math.sin(a) * d * .9;
      if (out.some(function (o) { return Math.hypot(o[0] - x, o[1] - y) < sp.distFr; })) continue;
      out.push([x, y]);
    }
    return out.sort(function (a, b) { return a[1] - b[1]; });
  }
  function germoglio(sp) {   // stadio 0: appena piantato, la terra smossa, il paletto e la piantina legata
    var s = ombra(5, 4, 30, 11), r = rnd(sp.seme + 5), i, t = "";
    var d = "M-30,2 C-29,-5 -14,-9 0,-9 C15,-9 29,-5 30,1 C28,8 14,11 0,11 C-15,11 -29,8 -30,2 Z";
    s += pth(d, lin("tm", [[0, "#946640"], [1, "#4f321d"]], 0, 0, .5, 1), bordo("#3b2412", 2.2));
    for (i = 0; i < 18; i++) t += ell(-24 + r() * 48, -7 + r() * 16, 1.5 + r() * 2.5, 1 + r() * 1.4, r() < .5 ? "#b08458" : "#3a2312", "opacity='.8'");
    s += dentro("tmc", "<path d='" + d + "'/>", t);
    s += paletto(11, 5, -62);
    var st = "M0,1 C1,-12 -2,-26 0,-42";
    s += tratto(st, sp.lineaT, 4.4) + tratto(st, "#7d8f45", 2.4);
    var g = lin("fg", tre(sp.foglia[1], .35, .25), 0, 0, 1, 1), W = sp.fogliaW;
    [[-1, -15, -62, 14], [1, -22, 58, 15], [-1, -31, -48, 13], [1, -36, 62, 10], [0, -41, 8, 12]].forEach(function (f) { s += foglia(f[0], f[1], f[2], f[3], f[3] * W, g, sp.linea, 1.2); });
    return s + laccio(0, 11, -28);
  }
  function alberello(sp) {   // stadio 1: alberello giovane legato al paletto
    var s = ombra(10, 5, 32, 11.5);
    s += ell(0, 2, 21, 8.5, lin("cn", [[0, "#8a5d39"], [1, "#4f321d"]], 0, 0, .4, 1), bordo("#3b2412", 1.8)) + ell(1, 2.6, 13, 4.8, "#3e2614", "opacity='.55'");   // la conca per l'acqua
    s += paletto(13, 4, -100) + tronco(sp, 86, 8, true);
    s += chioma(chiomaDi(sp, 1), sp.foglia, sp.linea, sp.seme + 1, { lw: 2.2, sc: .75, nome: "cg" });
    return s + laccio(2.5, 13, -60);
  }
  function alberoAdulto(sp, frutti) {
    var o = ombraAlbero(sp, 2), s = ombra(o[0], o[1], o[2], o[3]);
    sp.rami.forEach(function (a) { s += ramo(a, sp); });
    s += tronco(sp, sp.alto, sp.largo);
    (sp.rametti || []).forEach(function (a) { s += rametto(a, sp); });
    s += chioma(sp.ciuffi, sp.foglia, sp.linea, sp.seme, { lucido: sp.lucido });
    if (frutti) postiFrutti(sp).forEach(function (a, i) { s += FRUTTO[sp.frutto](a[0], a[1], i); });
    return s;
  }
  Object.keys(SPECIE).forEach(function (k) {
    var sp = SPECIE[k];
    def("albero_" + k + "_0", [-36, -70, 40, 18], [1, 1], function () { return germoglio(sp); });
    [1, 2, 3].forEach(function (st) {
      var B = giroChioma(chiomaDi(sp, st)), o = ombraAlbero(sp, st), lw = 4;
      if (sp.rametti && st >= 2) sp.rametti.forEach(function (a) { B[0] = Math.min(B[0], a[4] - 10); B[1] = Math.min(B[1], a[5] - 12); B[2] = Math.max(B[2], a[4] + 10); });
      def("albero_" + k + "_" + st, [Math.floor(Math.min(B[0] - lw, -30)), Math.floor(B[1] - lw - 2), Math.ceil(Math.max(B[2] + lw, o[0] + o[2] + 2)), Math.ceil(o[1] + o[3] + 4)], [1, 1],
        function () { return st === 1 ? alberello(sp) : alberoAdulto(sp, st === 3); });
    });
  });

  // =========================================================
  //  ORTO: l'aiuola col bordino di legno e i solchi; poi le piante (0 germogli, 1 crescono, 2 pronte)
  // =========================================================
  var OO = .45, OI = .37, OH = 12, OT = 8;   // bordo fuori, bordo dentro, altezza del bordo, altezza della terra
  function aiuolaOrto() {
    var L = "#4a2c17", s = "", r = rnd(77), i, t = "";
    var piede = [P(-OO, -OO, 0), P(OO, -OO, 0), P(OO, OO, 0), P(-OO, OO, 0)];
    s += poly(sposta(piede, 4, 2), "#000", "opacity='.08'") + poly(sposta(piede, 8, 4), "#000", "opacity='.08'");   // l'ombra
    var fs = [P(-OO, OO, 0), P(OO, OO, 0), P(OO, OO, OH), P(-OO, OO, OH)], fd = [P(OO, OO, 0), P(OO, -OO, 0), P(OO, -OO, OH), P(OO, OO, OH)];
    s += poly(fs, lin("as", [[0, "#ddaa6c"], [1, "#b07a42"]], 0, 0, 1, 1), bordo(L, 2)) + poly(fd, lin("ad", [[0, "#a06c3a"], [1, "#6e4624"]], 0, 0, 1, 1), bordo(L, 2));
    s += tratto(linea(P(-OO, OO, OH * .5), P(OO, OO, OH * .5)), "#7a4e28", 1, "opacity='.6'") + tratto(linea(P(OO, OO, OH * .5), P(OO, -OO, OH * .5)), "#4a2c17", 1, "opacity='.5'");   // le due assi
    [[-OO + .05, OO], [OO - .05, OO]].forEach(function (a) { var c = P(a[0], a[1], OH * .5); s += cer(c[0], c[1] - 2.6, .9, "#3a2a1c") + cer(c[0], c[1] + 2.6, .9, "#3a2a1c"); });   // i chiodi
    s += poly([P(-OO, -OO, OH), P(OO, -OO, OH), P(OO, OO, OH), P(-OO, OO, OH)], lin("at", [[0, "#f0c690"], [1, "#c99a60"]], 0, 0, 1, 1), bordo(L, 2));
    [[-OO, -OO, -OI, -OI], [OO, -OO, OI, -OI], [OO, OO, OI, OI], [-OO, OO, -OI, OI]].forEach(function (a) { s += tratto(linea(P(a[0], a[1], OH), P(a[2], a[3], OH)), "#8a5a30", 1, "opacity='.7'"); });   // le giunture agli angoli
    var buco = [P(-OI, -OI, OH), P(OI, -OI, OH), P(OI, OI, OH), P(-OI, OI, OH)];
    s += poly(buco, "#6a4526");
    t += poly([P(-OI, -OI, OT), P(OI, -OI, OT), P(OI, OI, OT), P(-OI, OI, OT)], lin("te", [[0, "#80573a"], [1, "#4d301b"]], 0, 0, .5, 1));
    [-.24, 0, .24].forEach(function (v) {   // i solchi, lungo le colonne
      t += poly([P(-.5, v - .075, OT + 2), P(.5, v - .075, OT + 2), P(.5, v + .075, OT + 2), P(-.5, v + .075, OT + 2)], "#8e623d");
      t += tratto(linea(P(-.5, v - .07, OT + 2), P(.5, v - .07, OT + 2)), "#b88c5e", 1.4, "opacity='.85'");
      t += tratto(linea(P(-.5, v + .12, OT), P(.5, v + .12, OT)), "#2e1b0d", 1.6, "opacity='.55'");
    });
    for (i = 0; i < 28; i++) { var c = P(-OI + r() * 2 * OI, -OI + r() * 2 * OI, OT + 1); t += ell(c[0], c[1], .8 + r() * 1.4, .5 + r() * .8, r() < .5 ? "#a77c52" : "#3a2412", "opacity='.75'"); }
    s += dentro("bu", "<polygon points='" + pts(buco) + "'/>", t);
    return s + poly(buco, "none", bordo(L, 1.6));
  }
  var POSTI9 = [];
  [-.24, 0, .24].forEach(function (v) { [-.24, 0, .24].forEach(function (u) { POSTI9.push([u, v]); }); });
  var POSTI4 = [[0, -.27], [-.27, 0], [.27, 0], [0, .27]];   // due file di due, viste di fronte
  function inOrdine(l) { return l.slice().sort(function (a, b) { return (a[0] + a[1]) - (b[0] + b[1]) || (a[0] - b[0]); }); }
  function germoglino(x, y, filo) {   // un germoglio appena spuntato
    var s = ell(x, y + 1, 3.4, 1.4, "#2e1b0d", "opacity='.5'");
    if (filo) [[-3, -7], [0, -9], [3, -7]].forEach(function (a) { var d = "M" + q(x, y) + " Q" + q(x + a[0] * .2, y + a[1] * .5) + " " + q(x + a[0], y + a[1]); s += tratto(d, "#24451a", 2.6) + tratto(d, "#8fd14f", 1.2); });
    else {
      s += tratto(linea([x, y], [x, y - 5]), "#24451a", 2.4) + tratto(linea([x, y], [x, y - 5]), "#7fbf4a", 1.1);
      s += ell(x - 2.9, y - 6, 3.1, 1.7, "#93d455", bordo("#24451a", .9) + " " + ruota(-25, x - 2.9, y - 6)) + ell(x + 2.9, y - 6.4, 3.1, 1.7, "#93d455", bordo("#24451a", .9) + " " + ruota(25, x + 2.9, y - 6.4));
    }
    return s;
  }
  function puntoQ(a, c, b, t) { var u = 1 - t; return [u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]; }
  var PIANTE = {
    carota: function (x, y, st) {   // il ciuffo piumoso (foglie fini, divise); quando è pronta spunta la testa arancione
      var s = "", h = st === 2 ? 23 : 14, n = st === 2 ? 5 : 4, i, fr = [];
      if (st === 2) {
        s += ell(x, y + 1.8, 7, 2.8, "#2e1b0d", "opacity='.55'");
        s += pth("M" + q(x - 5.4, y + 1.2) + " C" + q(x - 5.4, y - 3.2) + " " + q(x + 5.4, y - 3.2) + " " + q(x + 5.4, y + 1.2) + " C" + q(x + 4.2, y + 4) + " " + q(x - 4.2, y + 4) + " " + q(x - 5.4, y + 1.2) + " Z", lin("car", [[0, "#ffbd6b"], [.5, "#f76707"], [1, "#b8400a"]], 0, 0, 1, 1), bordo("#6e2a08", 1.3));
        s += tratto("M" + q(x - 3.6, y + .8) + " Q" + q(x, y + 2.2) + " " + q(x + 3.6, y + .8), "#b8400a", .9, "opacity='.7'") + ell(x - 2.4, y - .9, 1.7, .7, "#ffffff", "opacity='.55'");
      }
      for (i = 0; i < n; i++) { var a = -1 + 2 * i / (n - 1) + (i % 2 ? .08 : -.08); fr.push([[x, y - 1], [x + a * h * .1, y - h * .55], [x + a * h * .4, y - h * (1 - .25 * Math.abs(a))]]); }
      [0, 1].forEach(function (pass) {   // prima tutto in scuro (il contorno), poi il verde sopra
        fr.forEach(function (f, k) {
          s += tratto("M" + q(f[0]) + " Q" + q(f[1]) + " " + q(f[2]), pass ? "#4ea53a" : "#1f4013", pass ? 1.1 : 2.6);
          [.36, .52, .68, .84, 1].forEach(function (t, j) {   // le foglioline fini, a coppie lungo il gambo
            var c = puntoQ(f[0], f[1], f[2], t), dx = 2 * (1 - t) * (f[1][0] - f[0][0]) + 2 * t * (f[2][0] - f[1][0]), dy = 2 * (1 - t) * (f[1][1] - f[0][1]) + 2 * t * (f[2][1] - f[1][1]), l = Math.hypot(dx, dy) || 1, nx = -dy / l * 2.3, ny = dx / l * 2.3;
            [[nx, ny], [-nx, -ny]].forEach(function (o, m) { if (t === 1 && m) return; var px = c[0] + (t === 1 ? 0 : o[0]), py = c[1] + (t === 1 ? -.6 : o[1] - .8); s += cer(px, py, pass ? 1.35 : 2.05, pass ? ((j + k + m) % 3 ? "#5fb446" : "#93d45c") : "#1f4013"); });
          });
        });
      });
      return s;
    },
    pomodoro: function (x, y, st) {   // la pianta legata al tutore; quando è pronta, grappoli di pomodori rossi
      var s = "", H = st === 2 ? 56 : 30;
      s += ell(x + 2, y + 1, 7.5, 2.6, "#2e1b0d", "opacity='.45'");
      s += poly([[x + 3.4, y + 2], [x + 6, y + 2], [x + 6, y - H - 4], [x + 4.7, y - H - 7], [x + 3.4, y - H - 4]], lin("tut", [[0, "#e2c08e"], [1, "#a8783f"]], 0, 0, 1, 0), bordo("#5a3a1e", 1.2));
      var gamba = "M" + q(x, y) + " C" + q(x - 2.5, y - H * .3) + " " + q(x + 2.5, y - H * .6) + " " + q(x + 1, y - H);
      s += tratto(gamba, "#1f4013", 3.4) + tratto(gamba, "#5c9a35", 1.8);
      var gf = rad("pfo", [[0, "#7cc04f"], [.6, "#3f8a2c"], [1, "#22531a"]], .35, .3, .8);
      var ciuffi = st === 2 ? [[.18, -1], [.34, 1], [.5, -1], [.66, 1], [.82, -1], [.96, .4]] : [[.3, -1], [.6, 1], [.9, 0]];
      ciuffi.forEach(function (c, i) {   // i ciuffi di foglie seghettate
        var cx = x + c[1] * 7.5, cy = y - H * c[0];
        [[-4, .5, -20], [0, -2.6, 0], [4, .5, 20], [-1.8, 2.4, -8], [2.2, 2.2, 12]].forEach(function (f) { s += ell(cx + f[0], cy + f[1], 4, 2.5, gf, bordo("#1a3f12", .9) + " " + ruota(f[2], cx + f[0], cy + f[1])); });
      });
      for (var j = 0; j < (st === 2 ? 2 : 1); j++) s += laccio(x - .5, x + 4.7, y - H * (.3 + j * .38));
      if (st === 2) {
        [[x - 9.5, y - H * .26], [x - 6, y - H * .26 + 7], [x + 11, y - H * .46], [x + 8.5, y - H * .46 + 7.5], [x - 9, y - H * .7], [x + 10, y - H * .86]].forEach(function (a, i) {
          var g = i === 5 ? rad("pmv", [[0, "#ffd08a"], [.5, "#f59f00"], [1, "#a85d00"]], .36, .32, .8) : rad("pmr", [[0, "#ff9a8a"], [.45, "#e8321f"], [1, "#8f1b0f"]], .36, .32, .8);
          s += cer(a[0], a[1], 4.7, g, bordo("#5c1208", 1.2)) + pth("M" + q(a[0] - 2.2, a[1] - 4) + " l2.2,1.4 l2.2,-1.4 l-1,2 l-1.2,-.6 l-1.2,.6 Z", "#2f7a22", bordo("#163d12", .5)) + ell(a[0] - 1.6, a[1] - 1.4, 1.4, .8, "#ffffff", "opacity='.75'");
        });
      } else [[x - 6, y - H * .62], [x + 7, y - H * .86]].forEach(function (a) { s += pth("M" + q(a[0], a[1] - 2.6) + " l.8,1.8 l1.9,.2 l-1.4,1.2 l.5,1.9 l-1.8,-1 l-1.8,1 l.5,-1.9 l-1.4,-1.2 l1.9,-.2 Z", "#ffd43b", bordo("#8a6d00", .6)); });
      return s;
    },
    insalata: function (x, y, st) {   // il cespo aperto visto un po' dall'alto: foglie fuori grandi e arricciate, il cuore chiaro
      var R = st === 2 ? 15 : 9, s = ell(x + 1, y + R * .15, R * 1.15, R * .48, "#2e1b0d", "opacity='.4'"), i, fu = [], fi = [];
      var gf = rad("ins", [[0, "#c2ec86"], [.55, "#6dbf46"], [1, "#347a24"]], .4, .3, .8), gi = rad("ins2", [[0, "#ecfab8"], [.6, "#a6dc62"], [1, "#5fa436"]], .4, .3, .8);
      for (i = 0; i < 8; i++) { var a = i / 8 * 6.2832 + .2; fu.push([x + Math.cos(a) * R * .62, y - R * .2 + Math.sin(a) * R * .3, a]); }
      fu.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (f) {
        s += pth(riccio(f[0], f[1], R * .5, R * .33, 9, .26, f[2]), gf, bordo("#1f4517", 1.1)) + tratto(linea([f[0], f[1]], [f[0] + (x - f[0]) * .6, f[1] + (y - R * .3 - f[1]) * .6]), "#e9f8c9", .9, "opacity='.6'");
      });
      for (i = 0; i < 6; i++) { var b = i / 6 * 6.2832 + .7; fi.push([x + Math.cos(b) * R * .3, y - R * .4 + Math.sin(b) * R * .15, b]); }
      fi.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (f) { s += pth(riccio(f[0], f[1], R * .34, R * .24, 7, .24, f[2]), gi, bordo("#2f6a20", 1)); });
      s += pth(riccio(x, y - R * .48, R * .2, R * .15, 6, .2, 0), "#f2fcc8", bordo("#4f8a2a", .9));
      return s + tratto("M" + q(x - R * .62, y - R * .32) + " Q" + q(x - R * .4, y - R * .56) + " " + q(x - R * .12, y - R * .58), "#ffffff", 1.1, "opacity='.45'");
    },
    zucca: function (x, y, st) {   // le foglie larghe sul terreno; quando è pronta, una zucca grande arancione
      var s = "";
      function fogliaZ(fx, fy, k, rot) { return pth(riccio(fx, fy, 12 * k, 8 * k, 5, .32, rot), rad("zf", [[0, "#7cc04f"], [.6, "#3d872c"], [1, "#1f5218"]], .4, .3, .8), bordo("#173d12", 1.3)) + tratto("M" + q(fx, fy + 6 * k) + " L" + q(fx - 7 * k, fy - 3 * k) + " M" + q(fx, fy + 6 * k) + " L" + q(fx, fy - 6 * k) + " M" + q(fx, fy + 6 * k) + " L" + q(fx + 7 * k, fy - 3 * k), "#b9e38c", .9, "opacity='.6'"); }
      function fiore(fx, fy) { return pth("M" + q(fx, fy - 5) + " L" + q(fx + 2, fy - 1.5) + " L" + q(fx + 5, fy - 1) + " L" + q(fx + 2.6, fy + 1.6) + " L" + q(fx + 3, fy + 4.6) + " L" + q(fx, fy + 3) + " L" + q(fx - 3, fy + 4.6) + " L" + q(fx - 2.6, fy + 1.6) + " L" + q(fx - 5, fy - 1) + " L" + q(fx - 2, fy - 1.5) + " Z", "#ffd43b", bordo("#a66f00", 1)) + cer(fx, fy + .5, 1.6, "#f08c00"); }
      var tralcio = "M" + q(x - 26, y + 4) + " C" + q(x - 12, y - 6) + " " + q(x + 8, y + 8) + " " + q(x + 26, y - 2);
      s += tratto(tralcio, "#1f4013", 3.6) + tratto(tralcio, "#5c9a35", 2) + tratto("M" + q(x + 18, y + 1) + " c3,-4 7,-2 5,1 c-1.5,2 -4,0 -2,-1.5", "#5c9a35", 1, "");
      if (st === 1) return s + fogliaZ(x - 16, y - 5, 1, -.3) + fogliaZ(x + 14, y - 6, .95, .4) + fogliaZ(x - 2, y + 4, 1.05, 0) + fiore(x + 20, y + 4) + cer(x - 24, y + 2, 4, "#7cb342", bordo("#2f5a1c", 1.1));
      s += fogliaZ(x - 20, y - 8, 1, -.3) + fogliaZ(x + 21, y - 6, .95, .4);
      var cy = y - 12, g = rad("zu", [[0, "#ffc078"], [.5, "#f76707"], [1, "#a63c06"]], .38, .3, .8), gs = rad("zu2", [[0, "#ffa94d"], [.5, "#e8590c"], [1, "#8f3305"]], .38, .3, .8);
      [[-15, 9, 12.5, gs], [15, 9, 12.5, gs], [-8, 10, 15, g], [8, 10, 15, g], [0, 10, 16, g]].forEach(function (l) { s += ell(x + l[0], cy, l[1], l[2], l[3], bordo("#5e2205", 1.6)); });
      s += ell(x - 5, cy - 7, 3, 4.5, "#ffffff", "opacity='.35' " + ruota(-20, x - 5, cy - 7));
      var gambo = "M" + q(x - 1, cy - 14) + " C" + q(x - 1, cy - 19) + " " + q(x + 2, cy - 22) + " " + q(x + 6, cy - 23);
      s += tratto(gambo, "#2c3a12", 6.6) + tratto(gambo, "#6b8e23", 4) + tratto("M" + q(x - 1.6, cy - 15) + " Q" + q(x - 1.6, cy - 19) + " " + q(x + 1, cy - 21), "#a9c46a", 1.2, "opacity='.8'");
      return s + fogliaZ(x - 14, y + 7, .8, .1) + fiore(x + 22, y + 6);
    },
    fragola: function (x, y, st) {   // le foglie a tre a tre; fiorellini bianchi, poi le fragole rosse che pendono
      var s = ell(x + 1, y + 1, 9, 3.4, "#2e1b0d", "opacity='.4'"), k = st === 2 ? 1 : .8, i, g = rad("frf", [[0, "#8fd164"], [.6, "#3f962f"], [1, "#215a1a"]], .4, .3, .8);
      [[-7, -6, -1], [7, -6, 1], [0, -10, 0], [-4, -2, -1], [5, -2, 1]].forEach(function (f) {   // ogni foglia: tre foglioline seghettate
        var fx = x + f[0] * k, fy = y + f[1] * k;
        s += tratto(linea([x, y], [fx, fy + 2]), "#2f5a1c", 1.2);
        [[-2.6, 0, -30], [0, -2.4, 0], [2.6, 0, 30]].forEach(function (l) { s += pth(riccio(fx + l[0] * k, fy + l[1] * k, 2.9 * k, 2.1 * k, 7, .18, l[2] / 57), g, bordo("#173d12", .8)); });
      });
      if (st === 2) {
        [[-8, 2], [8, 3], [1, 5]].forEach(function (b) {
          var bx = x + b[0], by = y + b[1], d = "M" + q(bx - 4.4, by - 3) + " C" + q(bx - 4.8, by + 1) + " " + q(bx - 1.6, by + 5.2) + " " + q(bx, by + 6.2) + " C" + q(bx + 1.6, by + 5.2) + " " + q(bx + 4.8, by + 1) + " " + q(bx + 4.4, by - 3) + " C" + q(bx + 2.6, by - 4.8) + " " + q(bx - 2.6, by - 4.8) + " " + q(bx - 4.4, by - 3) + " Z";
          s += pth(d, rad("fra", [[0, "#ff8f8f"], [.45, "#e0182d"], [1, "#82091a"]], .36, .3, .8), bordo("#4a0610", 1.1));
          [[-2, -.5], [1.4, -1], [-.6, 2], [2.4, 1.6], [-2.6, 2.4], [.4, 4.2]].forEach(function (z) { s += ell(bx + z[0], by + z[1], .45, .65, "#ffe066"); });
          s += pth("M" + q(bx - 4, by - 3.4) + " l2,-1.6 l1,1.2 l1,-2 l1,2 l1,-1.2 l2,1.6 l-2.4,.6 l-1.6,-.4 l-1.6,.4 Z", "#3f962f", bordo("#173d12", .6));
          s += ell(bx - 2.2, by - .8, 1.1, .7, "#ffffff", "opacity='.75'");
        });
      } else [[-5, -3], [6, -4]].forEach(function (b) { var bx = x + b[0], by = y + b[1]; for (i = 0; i < 5; i++) { var a = i / 5 * 6.2832; s += cer(bx + Math.cos(a) * 1.9, by + Math.sin(a) * 1.5, 1.6, "#ffffff", bordo("#8a8f95", .5)); } s += cer(bx, by, 1.1, "#fcc419"); });
      return s;
    }
  };
  function dalloSchermo(x, y) { return [(x / 50 + y / 25) / 2, (y / 25 - x / 50) / 2]; }   // da un punto sullo schermo (rispetto al centro) alla mattonella
  var POSTI_CAROTE = [[-21, -6], [0, -6], [21, -6], [-31, 1], [31, 1], [-10.5, 7], [10.5, 7]].map(function (a) { return dalloSchermo(a[0], a[1]); });   // sfalsate: le teste arancioni si vedono tutte
  var POSTI3 = [[-.3, .02], [.02, -.3], [.2, .2]];   // tre piante a triangolo (due dietro, una davanti in mezzo)
  var POSTI = { carota: POSTI_CAROTE, pomodoro: POSTI3, insalata: POSTI4, zucca: [[0, 0]], fragola: POSTI4 };
  var ALTO_ORTO = { carota: 42, pomodoro: 84, insalata: 40, zucca: 54, fragola: 40 };
  function orto(pianta, st) {
    var s = aiuolaOrto();
    if (!pianta) return s;
    if (st === 0) { inOrdine(POSTI9).forEach(function (a) { var b = P(a[0], a[1], OT + 2); s += germoglino(b[0], b[1], pianta === "carota"); }); return s; }
    inOrdine(POSTI[pianta]).forEach(function (a) { var b = P(a[0], a[1], OT + 2); s += PIANTE[pianta](b[0], b[1], st); });
    return s;
  }
  def("orto", [-54, -38, 60, 34], [1, 1], function () { return orto(null); });
  Object.keys(PIANTE).forEach(function (k) { [0, 1, 2].forEach(function (st) { def("orto_" + k + "_" + st, [-54, -ALTO_ORTO[k], 60, 34], [1, 1], function () { return orto(k, st); }); }); });

  // =========================================================
  //  FIORI E VERDE
  // =========================================================
  var FIORI = {
    rosso: { seme: 31, verde: ["#9ad468", "#4f9a35", "#255a1a"], c: ["#ff9a9a", "#e03131", "#8a1212"], lc: "#560c0c", alto: [12, 20], tipo: "tulipano" },
    giallo: { seme: 32, verde: ["#9ad468", "#4f9a35", "#255a1a"], c: ["#fff4a3", "#fcc419", "#d98e04"], lc: "#7a4a05", alto: [10, 22], tipo: "girasole" },
    viola: { seme: 33, verde: ["#c3d6a6", "#7f9c6a", "#4a6140"], c: ["#e0d0ff", "#9775fa", "#5730b8"], lc: "#33207a", alto: [14, 24], tipo: "lavanda" },
    bianco: { seme: 34, verde: ["#9ad468", "#4f9a35", "#255a1a"], c: ["#ffffff", "#f1f3f5", "#c5ccd3"], lc: "#6c757d", alto: [9, 18], tipo: "margherita" }
  };
  var TESTE = {
    tulipano: function (x, y, F) {
      var d = "M" + q(x - 4.6, y - 1) + " C" + q(x - 5.8, y - 6.5) + " " + q(x - 4, y - 10) + " " + q(x - 2.3, y - 10.6) + " L" + q(x - 1, y - 7.4) + " L" + q(x, y - 11.2) + " L" + q(x + 1, y - 7.4) + " L" + q(x + 2.3, y - 10.6) + " C" + q(x + 4, y - 10) + " " + q(x + 5.8, y - 6.5) + " " + q(x + 4.6, y - 1) + " C" + q(x + 3, y + 2) + " " + q(x - 3, y + 2) + " " + q(x - 4.6, y - 1) + " Z";
      return pth(d, rad("tu", [[0, F.c[0]], [.5, F.c[1]], [1, F.c[2]]], .35, .3, .85), bordo(F.lc, 1.3)) + tratto("M" + q(x - 1, y - 7) + " Q" + q(x - .6, y - 2) + " " + q(x, y + .8), F.c[2], .9, "opacity='.7'") + ell(x - 2.6, y - 5.5, .9, 2.2, "#ffffff", "opacity='.55'");
    },
    girasole: function (x, y, F) {
      var s = "", i;
      for (i = 0; i < 10; i++) { var a = i / 10 * 360, rr = a * Math.PI / 180, px = x + Math.cos(rr) * 4.4, py = y + Math.sin(rr) * 4; s += ell(px, py, 3, 1.5, i % 2 ? F.c[1] : chiaro(F.c[1], .25), bordo(F.lc, .8) + " " + ruota(a, px, py)); }
      return s + cer(x, y, 2.8, rad("gc", [[0, "#a0612a"], [1, "#4a2a10"]], .4, .35, .7), bordo("#3a200c", .8)) + cer(x - .8, y - .8, .7, "#d9a066", "opacity='.8'");
    },
    lavanda: function (x, y, F) {
      var s = "", i, g = rad("lv", [[0, F.c[0]], [.5, F.c[1]], [1, F.c[2]]], .35, .3, .8);
      for (i = 0; i < 6; i++) { var yy = y + 6 - i * 2.4, xx = x + (i % 2 ? .9 : -.9) * (1 - i / 7); s += ell(xx, yy, 2.2 - i * .18, 1.7 - i * .1, g, bordo(F.lc, .7)); }
      return s;
    },
    margherita: function (x, y, F) {
      var s = "", i;
      for (i = 0; i < 12; i++) { var a = i / 12 * 360, rr = a * Math.PI / 180, px = x + Math.cos(rr) * 3.8, py = y + Math.sin(rr) * 3.3; s += ell(px, py, 2.8, 1.1, "#ffffff", bordo("#9aa3ab", .6) + " " + ruota(a, px, py)); }
      return s + cer(x, y, 2.1, rad("mg", [[0, "#fff3a3"], [1, "#f59f00"]], .4, .35, .7), bordo("#a86b00", .7));
    }
  };
  function aiuolaFiori(F) {
    var r = rnd(F.seme), s = ombra(7, 5, 42, 15), i, j, t = "";
    var d = "M-42,2 C-41,-8 -22,-14 0,-14 C22,-14 41,-8 42,1 C40,11 22,17 0,17 C-22,17 -40,11 -42,2 Z";
    s += pth(d, lin("tf", [[0, "#865c3a"], [1, "#4a2f1b"]], 0, 0, .4, 1), bordo("#3b2412", 2));
    for (i = 0; i < 20; i++) t += ell(-36 + r() * 72, -10 + r() * 24, .8 + r() * 1.4, .5 + r() * .8, r() < .5 ? "#a77c52" : "#2e1b0d", "opacity='.7'");
    s += dentro("tfc", "<path d='" + d + "'/>", t);
    for (i = 0; i < 9; i++) { var a = .25 + i / 8 * 2.64, sx = Math.cos(a) * 40, sy = 2 + Math.sin(a) * 14.5; s += ell(sx, sy, 3.6, 2.2, i % 2 ? "#d8d2c4" : "#bdb4a3", bordo("#5b5045", 1)); }   // i sassolini davanti
    var cf = [];
    for (i = 0; i < 26; i++) { var an = r() * 6.2832, dd = Math.sqrt(r()); cf.push([Math.cos(an) * dd * 31, -2 + Math.sin(an) * dd * 10, 4.5 + r() * 3]); }
    cf.sort(function (a, b) { return a[1] - b[1]; });
    s += chioma(cf, F.verde, "#1f3d15", F.seme + 1, { lw: 1.6, sc: .5, nome: "fv", n: 70 });
    var fi = [], tent = 0;
    while (fi.length < 12 && tent++ < 800) { var a2 = r() * 6.2832, d2 = Math.sqrt(r()), x = Math.cos(a2) * d2 * 32, y = -4 + Math.sin(a2) * d2 * 11; if (fi.some(function (f) { return Math.hypot(f[0] - x, (f[1] - y) * 1.6) < 10; })) continue; fi.push([x, y, F.alto[0] + r() * (F.alto[1] - F.alto[0])]); }
    fi.sort(function (a, b) { return a[1] - b[1]; });
    fi.forEach(function (f) {
      var x = f[0], y = f[1], h = f[2], gambo = "M" + q(x, y) + " Q" + q(x + 1.5, y - h * .5) + " " + q(x, y - h);
      if (F.tipo === "tulipano") s += pth("M" + q(x - 1, y + 1) + " C" + q(x - 6, y - 4) + " " + q(x - 6, y - h * .5) + " " + q(x - 4, y - h * .62) + " C" + q(x - 2, y - h * .4) + " " + q(x, y - 3) + " " + q(x + 1, y + 1) + " Z", lin("tul", tre("#5ea83a", .3, .3), 0, 0, 1, 1), bordo("#1f3d15", 1));
      s += tratto(gambo, "#1f3d15", 2.8) + tratto(gambo, F.tipo === "lavanda" ? "#7f9c6a" : "#4f9a35", 1.4);
      s += TESTE[F.tipo](x, y - h, F);
    });
    return s;
  }
  Object.keys(FIORI).forEach(function (k) { def("fiori_" + k, [-48, -58, 52, 26], [1, 1], function () { return aiuolaFiori(FIORI[k]); }); });

  var CESPUGLIO = [[-14, -52, 11], [6, -55, 12], [24, -47, 10], [-30, -40, 10], [-12, -42, 13], [9, -43, 13], [29, -35, 10], [-36, -24, 10], [-20, -28, 12],
    [0, -30, 13], [20, -28, 12], [36, -20, 8], [-26, -12, 10], [-8, -13, 12], [12, -12, 12], [28, -10, 9]];   // tanti ciuffi piccoli: un cespuglio fitto
  def("cespuglio", [-52, -72, 56, 22], [1, 1], function () {
    return ombra(10, 4, 42, 15) + chioma(CESPUGLIO, ["#93d063", "#4c9634", "#22561a"], "#1c3a14", 51, { lw: 2.4, sc: .8 });
  });

  // la siepe: un blocco squadrato che riempie la mattonella; senza contorni sui lati che toccano le altre siepi,
  // così più siepi in fila fanno un muro verde unico
  def("siepe", [-58, -76, 62, 32], [1, 1], function () {
    var r = rnd(61), H = 40, s = "", i, piede = [P(-.5, -.5, 0), P(.5, -.5, 0), P(.5, .5, 0), P(-.5, .5, 0)];
    s += poly(sposta(piede, 5, 2.5), "#000", "opacity='.08'") + poly(sposta(piede, 10, 5), "#000", "opacity='.08'");
    var sx = [P(-.5, .5, 0), P(.5, .5, 0), P(.5, .5, H), P(-.5, .5, H)], dx = [P(.5, .5, 0), P(.5, -.5, 0), P(.5, -.5, H), P(.5, .5, H)], so = [P(-.5, -.5, H), P(.5, -.5, H), P(.5, .5, H), P(-.5, .5, H)];
    s += poly(sx, linPiano("ssx", [[0, "#5fa33f"], [.7, "#4a8c32"], [1, "#2c5f20"]], sx[3], sx[2], sx[0]));
    s += poly(dx, linPiano("sdx", [[0, "#447f2e"], [.7, "#36702a"], [1, "#204a18"]], dx[3], dx[2], dx[0]));
    function foglie(nome, forma, n, chiari, scuri, uMin, uMax, vMin, vMax, zMin, zMax) {
      var t = "";
      for (var j = 0; j < n; j++) { var c = P(uMin + r() * (uMax - uMin), vMin + r() * (vMax - vMin), zMin + r() * (zMax - zMin)), ch = r() < .5; t += ell(c[0], c[1], 3, 1.6, ch ? chiari : scuri, "opacity='" + (ch ? .55 : .5) + "' " + ruota(r() * 180, c[0], c[1])); }
      return dentro(nome, "<polygon points='" + pts(forma) + "'/>", t);
    }
    s += foglie("fsx", sx, 70, "#8ccf5c", "#24521a", -.5, .5, .5, .5, 0, H) + foglie("fdx", dx, 70, "#6aa846", "#183f13", .5, .5, -.5, .5, 0, H);
    for (i = 0; i < 12; i++) { var a = P(-.5 + i / 11, -.5, H), b = P(-.5, -.5 + i / 11, H); s += cer(a[0], a[1], 4.2 + r() * 1.4, "#7cbd4a") + cer(b[0], b[1], 4.2 + r() * 1.4, "#7cbd4a"); }   // i bordi dietro, frastagliati
    s += poly(so, "#7cbd4a") + foglie("fso", so, 60, "#b5e07e", "#4f8f33", -.5, .5, -.5, .5, H, H);
    for (i = 0; i < 12; i++) { var c = P(-.5 + i / 11, .5, H - 1.5), d = P(.5, .5 - i / 11, H - 1.5); s += cer(c[0], c[1], 4 + r(), "#6fb043") + cer(d[0], d[1], 4 + r(), "#5e9c3a"); }   // le foglie che sporgono sul davanti
    return s + tratto(linea(P(-.5, .5, 0), P(.5, .5, 0)) + " L" + q(P(.5, -.5, 0)), "#1c3a14", 2.2, "opacity='.8'");
  });

  // =========================================================
  //  DECORAZIONI
  // =========================================================
  def("fontana", [-82, -120, 98, 52], [2, 2], function () {   // vasca tonda di pietra con l'acqua, la coppa in alto e lo zampillo
    var s = "", L = "#4f453b", Rx = 68, Ry = 34, rx = 56, ry = 28, H = 22, A = 15, r = rnd(91), i, t = "";
    s += ombra(10, 8, 84, 40);
    var muro = "M" + q(-Rx, -H) + " A" + Rx + " " + Ry + " 0 0 0 " + q(Rx, -H) + " L" + q(Rx, 0) + " A" + Rx + " " + Ry + " 0 0 1 " + q(-Rx, 0) + " Z";
    s += pth(muro, lin("vm", [[0, "#ece5d8"], [.5, "#cbc1b0"], [1, "#958a78"]], 0, 0, 1, 0), bordo(L, 2.6));
    [.32, .82, 1.32, 1.82, 2.32, 2.82].forEach(function (a) { var x = Math.cos(a) * Rx, y = Math.sin(a) * Ry; t += tratto(linea([x, y - H], [x, y]), "#7d7262", 1.2, "opacity='.7'"); });   // le pietre della vasca
    for (i = 0; i < 30; i++) { var a = .1 + r() * 2.94, x = Math.cos(a) * Rx * .98, y = Math.sin(a) * Ry - r() * H; t += cer(x, y, .6 + r() * .9, r() < .5 ? "#fffaf0" : "#6e6455", "opacity='.5'"); }
    s += dentro("vmc", "<path d='" + muro + "'/>", t);
    var anello = "M" + q(-Rx, -H) + " A" + Rx + " " + Ry + " 0 1 0 " + q(Rx, -H) + " A" + Rx + " " + Ry + " 0 1 0 " + q(-Rx, -H) + " Z M" + q(-rx, -H) + " A" + rx + " " + ry + " 0 1 1 " + q(rx, -H) + " A" + rx + " " + ry + " 0 1 1 " + q(-rx, -H) + " Z";
    s += pth(anello, lin("va", [[0, "#faf6ee"], [1, "#cfc5b4"]], 0, 0, 1, 1), "fill-rule='evenodd' " + bordo(L, 2.2));
    var bocca = ell(0, -H, rx, ry, "#000");
    s += ell(0, -H, rx, ry, "#8e8474");   // la parete dentro
    var w = ell(0, -A, rx, ry, rad("ac", [[0, "#d3efff"], [.5, "#6cbcf2"], [1, "#2b7fc2"]], .4, .3, .8));
    [[14, 7, .55], [26, 13, .4], [40, 20, .28]].forEach(function (c) { w += ell(0, -A + 1, c[0], c[1], "none", "stroke='#ffffff' stroke-width='1.4' opacity='" + c[2] + "'"); });   // le onde dove cade l'acqua
    w += tratto("M" + q(-44, -A - 6) + " Q" + q(-30, -A - 14) + " " + q(-12, -A - 16), "#ffffff", 2, "opacity='.55'") + tratto("M" + q(20, -A + 14) + " Q" + q(34, -A + 12) + " " + q(44, -A + 6), "#ffffff", 1.6, "opacity='.4'");
    s += dentro("vb", bocca, w);
    // la colonna in mezzo
    s += ell(0, -A - 2, 12, 6, "#bfb5a3", bordo(L, 1.8));
    var col = "M-6.5,-66 L-7,-" + (A + 2) + " A7 3.5 0 0 0 7,-" + (A + 2) + " L6.5,-66 Z";
    s += pth(col, lin("co", [[0, "#f1ebe0"], [.5, "#cdc3b2"], [1, "#8f8473"]], 0, 0, 1, 0), bordo(L, 2));
    s += ell(0, -42, 8.5, 4, "#d8cfbf", bordo(L, 1.6));
    // la coppa in alto
    var coppa = "M-30,-72 C-30,-56 -14,-50 0,-50 C14,-50 30,-56 30,-72 Z";
    s += pth(coppa, lin("cp", [[0, "#efe8dc"], [.55, "#c9bfae"], [1, "#8c8170"]], 0, 0, 1, .4), bordo(L, 2.2));
    s += tratto("M-24,-62 Q-16,-55 -4,-54", "#ffffff", 1.6, "opacity='.45'");
    s += pth("M-31,-72 A31 15.5 0 1 0 31,-72 A31 15.5 0 1 0 -31,-72 Z M-25,-72 A25 12.5 0 1 1 25,-72 A25 12.5 0 1 1 -25,-72 Z", lin("cr", [[0, "#faf6ee"], [1, "#cfc5b4"]], 0, 0, 1, 1), "fill-rule='evenodd' " + bordo(L, 1.8));
    s += dentro("cpb", ell(0, -72, 25, 12.5, "#000"), ell(0, -72, 25, 12.5, "#8e8474") + ell(0, -69, 25, 12.5, rad("ac2", [[0, "#d3efff"], [.6, "#6cbcf2"], [1, "#2b7fc2"]], .4, .3, .8)) + ell(0, -68, 10, 5, "none", "stroke='#ffffff' stroke-width='1.2' opacity='.5'"));
    // la cima e lo zampillo che ricade nella coppa
    s += pth("M-3.5,-70 L-3,-84 Q0,-90 3,-84 L3.5,-70 Z", lin("ci", [[0, "#efe8dc"], [1, "#9c917f"]], 0, 0, 1, 0), bordo(L, 1.6));
    var acqua = "#e3f5ff";
    s += tratto("M0,-88 L0,-106", "#9fd3f7", 4.4, "opacity='.8'") + tratto("M0,-88 L0,-106", acqua, 2, "");
    [[-1, 1], [1, 1], [-1, .6], [1, .6]].forEach(function (z) { var d = "M0,-104 C" + q(z[0] * 10 * z[1], -112) + " " + q(z[0] * 20 * z[1], -98) + " " + q(z[0] * 24 * z[1], -74); s += tratto(d, "#9fd3f7", 3, "opacity='.7'") + tratto(d, acqua, 1.3, "opacity='.95'"); });
    // l'acqua che scende dalla coppa nella vasca
    [-22, -12, 0, 12, 22].forEach(function (x, j) { var y0 = -72 + Math.sqrt(Math.max(0, 1 - (x * x) / (31 * 31))) * 15.5, d = "M" + q(x * 1.02, y0) + " C" + q(x * 1.12, y0 + 10) + " " + q(x * 1.25, y0 + 22) + " " + q(x * 1.3, -A + 6 + Math.abs(x) * .1); s += tratto(d, "#9fd3f7", 3, "opacity='.55'") + tratto(d, acqua, 1.2, "opacity='.85'"); });
    for (i = 0; i < 9; i++) s += cer(-30 + r() * 60, -A - 4 - r() * 10, .9 + r() * .8, "#ffffff", "opacity='.8'");
    return s;
  });

  def("panchina", [-54, -66, 60, 28], [1, 1], function (o) {   // panchina di legno (lunga e bassa) con i fianchi di ferro battuto; da dietro lo schienale sta davanti
    var g = o.dietro ? -1 : 1, s = ombra(8, 6, 48, 16), L = "#3b2615", U0 = -.48, U1 = .48, Z = 17, i;
    function fianco(u) {   // il fianco di ferro: due gambe, il bracciolo col ricciolo, lo schienale (g: davanti o girato)
      var d = "M" + q(P(u, .13 * g, 0)) + " Q" + q(P(u, .16 * g, 9)) + " " + q(P(u, .12 * g, Z)) + " M" + q(P(u, -.2 * g, 0)) + " Q" + q(P(u, -.14 * g, 10)) + " " + q(P(u, -.16 * g, Z)) + " L" + q(P(u, -.2 * g, 44)) +
        " M" + q(P(u, -.17 * g, 30)) + " Q" + q(P(u, 0, 33)) + " " + q(P(u, .15 * g, 27)) + " M" + q(P(u, .12 * g, Z)) + " L" + q(P(u, -.16 * g, Z));
      var cur = P(u, .15 * g, 27), ric = g > 0 ? " c-1,3 2,5 4,3 c1.6,-1.6 0,-3.6 -1.6,-2.6" : " c1,-3 -2,-5 -4,-3 c-1.6,1.6 0,3.6 1.6,2.6";
      return tratto(d, "#141210", 5) + tratto(d, "#3a3634", 3) + tratto(d, "#7a746e", .9, "opacity='.7' transform='translate(-.8 -.6)'") +
        tratto("M" + q(cur) + ric, "#141210", 2.6) + tratto("M" + q(cur) + ric, "#3a3634", 1.4);
    }
    var lg = [lin("ls", [[0, "#e8b37a"], [1, "#c48a50"]], 0, 0, 1, 1), lin("lf", [[0, "#b77a40"], [1, "#8a5528"]], 0, 0, 1, 1), lin("ld", [[0, "#8a5a30"], [1, "#5e3a1c"]], 0, 0, 1, 1)], schienale = "", seduta = "";
    [24, 33].forEach(function (z, j) {   // lo schienale: due assi lunghe (da dietro se ne vede la schiena, un po' più scura)
      var v = g * (-.18 - j * .006), a = [P(U0, v, z), P(U1, v, z), P(U1, v, z + 7), P(U0, v, z + 7)];
      schienale += poly(a, g > 0 ? lg[1] : lin("lr", [[0, "#a86e38"], [1, "#7a4a22"]], 0, 0, 1, 1), bordo(L, 1.5)) + poly([a[3], a[2], P(U1, v - g * .03, z + 7), P(U0, v - g * .03, z + 7)], lg[0], bordo(L, 1.2)) + tratto(linea(P(U0 + .03, v, z + 3.5), P(U1 - .03, v, z + 3.5)), "#7a4a22", .7, "opacity='.5'");
    });
    var vs = g > 0 ? [-.15, -.06, .03] : [-.115, -.025, .065];
    vs.forEach(function (v) { seduta += scatola(U0, v, U1 - U0, .085, Z - 3.5, 3.5, lg, L, 1.4); });   // la seduta: tre assi
    for (i = 0; i < 3; i++) { var vv = g * (-.11 + i * .09), c = P(U0 + .06, vv, Z), c2 = P(U1 - .06, vv, Z); seduta += cer(c[0], c[1], .7, "#3a2a1c") + cer(c2[0], c2[1], .7, "#3a2a1c"); }   // le viti
    seduta += tratto(linea(P(U0 + .04, vs[0] + .01, Z), P(U1 - .04, vs[0] + .01, Z)), "#fff6e0", 1, "opacity='.45'");
    s += fianco(U0 + .05) + (g > 0 ? schienale + seduta : seduta + schienale);
    return s + fianco(U1 - .05);
  }, true);

  def("lampione", [-26, -184, 36, 16], [1, 1], function (o) {   // lampione da giardino in ferro con la lanterna di vetro
    var notte = o && o.notte, s = ombra(8, 4, 20, 7.5), L = "#141a17", fe = ["#56685e", "#2c3832", "#161d19"], i;
    s += scatola(-.08, -.08, .16, .16, 0, 9, [fe[0], fe[1], fe[2]], L, 1.6) + scatola(-.055, -.055, .11, .11, 9, 5, [fe[0], fe[1], fe[2]], L, 1.4);
    var palo = lin("pl", [[0, "#6f8379"], [.4, "#34423b"], [1, "#121815"]], 0, 0, 1, 0);
    s += "<rect x='-3.4' y='-134' width='6.8' height='122' rx='1.5' fill='" + palo + "' " + bordo(L, 1.8) + "/>";
    [-34, -100, -126].forEach(function (y) { s += ell(0, y, 5.4, 2.4, fe[1], bordo(L, 1.4)); });
    s += tratto("M-3,-112 c-5,-2 -8,-8 -5,-12 c2,-2 4,0 3,2 M3,-112 c5,-2 8,-8 5,-12 c-2,-2 -4,0 -3,2", L, 1.6);   // i riccioli
    // la lanterna: base, due vetri, il tetto a punta
    var a = .095, z0 = 138, z1 = 162;
    s += scatola(-a - .02, -a - .02, 2 * a + .04, 2 * a + .04, z0 - 5, 5, fe, L, 1.5);
    var vs = [P(-a, a, z0), P(a, a, z0), P(a, a, z1), P(-a, a, z1)], vd = [P(a, a, z0), P(a, -a, z0), P(a, -a, z1), P(a, a, z1)];
    var gv = notte ? lin("vn", [[0, "#ffffff"], [.45, "#fff0a0"], [1, "#ffc61a"]], 0, 0, .4, 1) : lin("vg", [[0, "#f3fbff"], [1, "#a9cbe0"]], 0, 0, .4, 1);
    s += poly(vs, gv, bordo(L, 1.8)) + poly(vd, notte ? lin("vn2", [[0, "#fff3b8"], [1, "#f5a300"]], 0, 0, .4, 1) : lin("vg2", [[0, "#cfe2ee"], [1, "#86a8bd"]], 0, 0, .4, 1), bordo(L, 1.8));
    if (notte) { var c = P(0, 0, (z0 + z1) / 2); s += cer(c[0], c[1] + 2, 16, rad("al", [[0, "#fff8d6", .9], [.4, "#ffe680", .5], [1, "#ffd43b", 0]], .5, .5, .5)) + cer(c[0], c[1] + 2, 4.5, "#ffffff"); }
    else s += tratto(linea(P(-a * .5, a, z1 - 3), P(-a * .1, a, z0 + 8)), "#ffffff", 1.6, "opacity='.75'");
    s += tratto(linea(P(0, a, z0), P(0, a, z1)), L, 1.2) + tratto(linea(P(a, 0, z0), P(a, 0, z1)), L, 1.2);
    var t1 = P(-a - .03, -a - .03, z1), t2 = P(a + .03, -a - .03, z1), t3 = P(a + .03, a + .03, z1), t4 = P(-a - .03, a + .03, z1), ap = P(0, 0, z1 + 15);
    s += poly([t4, t3, ap], fe[0], bordo(L, 1.6)) + poly([t3, t2, ap], fe[2], bordo(L, 1.6)) + cer(ap[0], ap[1] - 2, 2.6, fe[1], bordo(L, 1.4));
    for (i = 0; i < 1; i++) s += tratto(linea([t4[0] + 3, t4[1] - 2], [ap[0] - 1, ap[1] + 3]), "#ffffff", 1, "opacity='.35'");
    return s;
  });

  def("altalena", [-88, -188, 98, 46], [2, 1], function () {   // altalena di legno: due cavalletti e la trave lungo le colonne, due seggiolini
    var s = ombra(14, 8, 82, 26, .8), L = "#4a2c17", legno = "#c08a50", Z = 150, i;
    function seggiolino(u) {
      var d = tratto(linea(P(u - .15, 0, Z - 2), P(u - .15, 0, 41)), "#4a3a22", 3) + tratto(linea(P(u - .15, 0, Z - 2), P(u - .15, 0, 41)), "#d9c39a", 1.4) +
        tratto(linea(P(u + .15, 0, Z - 2), P(u + .15, 0, 41)), "#4a3a22", 3) + tratto(linea(P(u + .15, 0, Z - 2), P(u + .15, 0, 41)), "#d9c39a", 1.4);
      return d + scatola(u - .19, -.08, .38, .16, 37, 4, [lin("sg0", [[0, "#ff8a5c"], [1, "#e8590c"]], 0, 0, 1, 1), "#c4470a", "#94360a"], "#5a1e04", 1.5);
    }
    function cavalletto(u, davanti) { var top = P(u, 0, Z - 2); return davanti ? palo(top, P(u, .42, 0), 6, legno, L) : palo(top, P(u, -.42, 0), 6, legno, L); }
    s += cavalletto(-.86, false) + cavalletto(-.86, true);
    s += seggiolino(-.42) + seggiolino(.42);
    s += cavalletto(.86, false);
    var a = P(-.98, 0, Z), b = P(.98, 0, Z);
    s += tratto(linea(a, b), L, 12) + tratto(linea(a, b), legno, 9) + tratto(linea(a, b), "#e8bb86", 2.5, "transform='translate(0 -2.6)' opacity='.8'");
    s += ell(b[0] + 1, b[1], 3.2, 4.5, "#e6c08e", bordo(L, 1.4)) + ell(b[0] + 1, b[1], 1.5, 2.1, "none", "stroke='#a0703e' stroke-width='.8'");   // il taglio del tronco
    for (i = 0; i < 2; i++) { var g = P(i ? .42 : -.42, 0, Z); s += cer(g[0] - 7, g[1] - 3.5 + 1.5, 1.6, "#5a5550", bordo("#222", .6)) + cer(g[0] + 7, g[1] + 3.5 + 1.5, 1.6, "#5a5550", bordo("#222", .6)); }   // i ganci
    return s + cavalletto(.86, true);
  });

  def("casetta_uccelli", [-28, -176, 36, 14], [1, 1], function (o) {   // palo con la casetta per gli uccellini (e un uccellino sul tetto); da dietro: niente buco
    var g = o.dietro ? -1 : 1, s = ombra(7, 4, 18, 6.5), L = "#4a2c17", lg = [lin("cu0", [[0, "#f0c690"], [1, "#d39f62"]], 0, 0, 1, 1), lin("cu1", [[0, "#d9a466"], [1, "#b07a42"]], 0, 0, 1, 1), lin("cu2", [[0, "#a06c3a"], [1, "#734a25"]], 0, 0, 1, 1)];
    var pu = linea(P(-.03 * g, .04 * g, 84), P(-.03 * g, .12 * g, 102)), puntello = tratto(pu, L, 3.4) + tratto(pu, "#b07a42", 1.8);
    if (g < 0) s += puntello;   // da dietro il puntello sta dietro al palo
    s += scatola(-.04, -.04, .08, .08, 0, 102, lg, L, 1.6);
    if (g > 0) s += puntello;
    var a = .13, z0 = 102, z1 = 130, zc = 146, i;
    s += scatola(-a - .02, -a - .02, 2 * a + .04, 2 * a + .04, z0 - 4, 4, lg, L, 1.5);
    s += poly([P(a, a, z0), P(a, -a, z0), P(a, -a, z1), P(a, a, z1)], lg[2], bordo(L, 1.8));
    var fr = [P(-a, a, z0), P(a, a, z0), P(a, a, z1), P(0, a, zc), P(-a, a, z1)];
    s += poly(fr, lg[1], bordo(L, 1.8));
    if (g > 0) {   // il buco tondo e il posatoio
      var buco = []; for (i = 0; i < 14; i++) { var t = i / 14 * 6.2832; buco.push(P(Math.cos(t) * .05, a, 120 + Math.sin(t) * 5.5)); }
      s += poly(buco, "#2a1a0e", bordo(L, 1.2)) + tratto(linea(P(0, a, 109), P(0, a + .08, 109)), L, 3) + tratto(linea(P(0, a, 109), P(0, a + .08, 109)), "#d9a466", 1.4);
    } else [110, 118, 126].forEach(function (z) { s += tratto(linea(P(-a + .01, a, z), P(a - .01, a, z)), "#7a4e28", 1, "opacity='.6'"); });   // da dietro: le assi della parete
    var e = .03, r1 = [P(-a - e, a + e + .02, z1 - 1), P(0, a + e + .02, zc + 2), P(0, -a - e, zc + 2), P(-a - e, -a - e, z1 - 1)], r2 = [P(0, a + e + .02, zc + 2), P(a + e, a + e + .02, z1 - 1), P(a + e, -a - e, z1 - 1), P(0, -a - e, zc + 2)];
    s += poly(r2, lin("tt", [[0, "#e8664a"], [1, "#a33b26"]], 0, 0, 1, 1), bordo("#4a1a10", 1.8));
    s += tratto(linea(P(a * .5, a + .03, (z1 + zc) / 2 + 1), P(a * .5, -a - e, (z1 + zc) / 2 + 1)), "#7a2a1a", 1, "opacity='.6'");
    s += poly([r1[0], r1[1], P(0, a + e + .02, zc - 2), P(-a - e, a + e + .02, z1 - 5)], "#c4553a", bordo("#4a1a10", 1.4)) + poly([r2[0], r2[1], P(a + e, a + e + .02, z1 - 5), P(0, a + e + .02, zc - 2)], "#9c3c26", bordo("#4a1a10", 1.4));
    // l'uccellino (una cinciallegra) sul colmo: si gira insieme alla casetta
    var b = P(0, -.02 * g, zc + 4), u = "";
    u += pth("M" + q(b[0] + 4, b[1] - 3) + " l7,-2 l-1,4 Z", "#3f5f8a", bordo("#1c2a3d", 1));
    u += ell(b[0], b[1] - 4, 5.6, 4.4, lin("uc", [[0, "#fff176"], [1, "#e0b800"]], 0, 0, .5, 1), bordo("#3d3410", 1.2));
    u += pth("M" + q(b[0] - 1, b[1] - 6.5) + " q4,-2 6,2 q-3,2 -6,-2 Z", "#5b86c4", bordo("#1c2a3d", .8));
    u += cer(b[0] - 4.2, b[1] - 9, 3.4, "#2b3a55", bordo("#111a28", 1)) + ell(b[0] - 4.8, b[1] - 8.4, 1.9, 1.3, "#ffffff");
    u += cer(b[0] - 5.4, b[1] - 9.6, .8, "#111") + pth("M" + q(b[0] - 7.4, b[1] - 9) + " l-2.4,.8 l2.3,.8 Z", "#f08c00", bordo("#6b3a00", .5));
    return s + (g > 0 ? u : "<g transform='translate(" + f1(2 * b[0]) + " 0) scale(-1 1)'>" + u + "</g>");
  }, true);

  def("gnomo", [-24, -78, 30, 12], [1, 1], function (o) {   // il nano da giardino: cappello rosso a punta, barba bianca, giacca blu, una paletta
    var s = ombra(4, 3, 17, 6.5), L = "#3b2414", gs = lin("st", [[0, "#8a5a32"], [1, "#4a2c16"]], 0, 0, 1, 1), giacca = "M-12,-4 C-13,-14 -11,-24 -8,-30 L8,-30 C11,-24 13,-14 12,-4 C6,-1 -6,-1 -12,-4 Z";
    function braccio(d, c, mx, my) { return pth(d, "none", bordo(L, 5.4)) + pth(d, "none", "stroke='" + c + "' stroke-width='3.4' stroke-linecap='round'") + cer(mx, my, 2.6, "#ffcfb0", bordo(L, 1.2)); }
    var cintura = pth("M-12.4,-11 C-6,-8.4 6,-8.4 12.4,-11 L12.6,-14.6 C6,-12 -6,-12 -12.6,-14.6 Z", "#5a3a1e", bordo(L, 1.2)), tesa = pth("M-11,-39.5 C-4,-36.6 4,-36.6 11,-39.5 L10.6,-42.4 C4,-40 -4,-40 -10.6,-42.4 Z", "#b71c1c", bordo(L, 1.2));
    if (o.dietro) {   // da dietro: la schiena della giacca, i capelli bianchi sotto il cappello, la paletta dall'altra parte
      s += palo([-15, -4], [-12, -30], 2, "#a0703e", L) + pth("M-10,-34 L-16,-34 L-17,-27 Q-13,-24 -9,-27 Z", "#adb5bd", bordo(L, 1.4));
      s += ell(5, -2.6, 6, 3.4, gs, bordo(L, 1.8)) + ell(-6, -1.6, 6, 3.4, gs, bordo(L, 1.8));   // i talloni
      s += pth(giacca, lin("gi", tre("#3b5bdb", .2, .4), 0, 0, 1, 1), bordo(L, 2.2)) + tratto("M0,-29 L0,-8", "#22348a", 1.2, "opacity='.7'") + tratto("M-2.6,-3 L0,-8 L2.6,-3", "#22348a", 1.1);   // la cucitura e lo spacco
      s += cintura + braccio("M-11,-24 C-14,-22 -14,-18 -12,-17", "#3b5bdb", -12.4, -17.5) + braccio("M11,-24 C15,-20 15,-14 12,-12", "#2f4ac4", 11.5, -11.5);
      var bi = lin("ba", [[0, "#ffffff"], [1, "#ced4da"]], 0, 0, .6, 1);
      s += pth("M-9.6,-32 C-12.4,-27 -11.4,-22 -8.4,-19.6 C-8.6,-24 -7.6,-28 -6,-30.6 Z", bi, bordo(L, 1.3)) + pth("M9.6,-32 C12.4,-27 11.4,-22 8.4,-19.6 C8.6,-24 7.6,-28 6,-30.6 Z", bi, bordo(L, 1.3));   // la barba che spunta ai lati
      s += ell(-7.8, -36, 1.7, 2.5, "#ffc4a3", bordo(L, 1)) + ell(7.8, -36, 1.7, 2.5, "#ffc4a3", bordo(L, 1));   // le orecchie
      s += pth("M-8.6,-39 C-9.6,-33 -6,-29.4 0,-29 C6,-29.4 9.6,-33 8.6,-39 Z", bi, bordo(L, 1.5)) + tratto("M-4,-37 Q-3,-33 -1,-31 M3,-37 Q3,-33 1,-31", "#adb5bd", .9, "opacity='.8'");   // i capelli
      s += pth("M10,-39 C8,-51 2,-63 -8,-72 C-6,-61 -7,-49 -10,-39 C-4,-37 4,-37 10,-39 Z", lin("ca", tre("#e03131", .3, .35), 0, 0, 1, .6), bordo(L, 2.2)) + tratto("M-7,-42 C-6.4,-50 -6,-56 -6.6,-63", "#ffffff", 1.4, "opacity='.4'");
      return s + tesa;
    }
    s += palo([15, -4], [12, -30], 2, "#a0703e", L) + pth("M10,-34 L16,-34 L17,-27 Q13,-24 9,-27 Z", "#adb5bd", bordo(L, 1.4));   // la paletta
    s += ell(-5, -2, 6.2, 3.5, gs, bordo(L, 1.8)) + ell(6, -1, 6.2, 3.5, gs, bordo(L, 1.8));
    s += pth(giacca, lin("gi", tre("#3b5bdb", .25, .35), 0, 0, 1, 1), bordo(L, 2.2));
    s += cintura + "<rect x='-2.6' y='-13.2' width='5.2' height='4.6' rx='1' fill='none' stroke='#fcc419' stroke-width='1.4'/>";
    s += braccio("M-11,-24 C-15,-20 -15,-14 -12,-12", "#3b5bdb", -11.5, -11.5) + braccio("M11,-24 C14,-22 14,-18 12,-17", "#2f4ac4", 12.4, -17.5);
    var barba = "M-9.5,-33 C-11,-25 -7,-16 0,-11 C7,-16 11,-25 9.5,-33 Z";
    s += pth(barba, lin("ba", [[0, "#ffffff"], [1, "#ced4da"]], 0, 0, .6, 1), bordo(L, 1.6)) + tratto("M-5,-26 Q-3,-21 -1,-17 M4,-27 Q3,-21 1,-16", "#adb5bd", 1, "opacity='.8'");
    s += ell(0, -36, 7.4, 5.8, "#ffd2b4", bordo(L, 1.6)) + ell(-4.6, -34.6, 1.8, 1.1, "#ff9f9f", "opacity='.7'") + ell(4.6, -34.6, 1.8, 1.1, "#ff9f9f", "opacity='.7'");
    s += cer(-3, -37.4, 1, "#2b1d14") + cer(3, -37.4, 1, "#2b1d14");
    s += pth("M-6,-32 Q-3,-34.6 0,-32.6 Q3,-34.6 6,-32 Q3,-29.6 0,-31 Q-3,-29.6 -6,-32 Z", "#f8f9fa", bordo(L, 1));   // i baffi
    s += cer(0, -34.6, 2.7, rad("na", [[0, "#ffb3a3"], [1, "#e8726a"]], .35, .3, .8), bordo(L, 1));
    var cap = "M-10,-39 C-8,-51 -2,-63 8,-72 C6,-61 7,-49 10,-39 C4,-37 -4,-37 -10,-39 Z";
    s += pth(cap, lin("ca", tre("#e03131", .3, .35), 0, 0, 1, .6), bordo(L, 2.2)) + tratto("M-6,-42 C-4,-52 0,-60 5,-66", "#ffffff", 1.4, "opacity='.4'");
    return s + tesa;
  }, true);

  def("barbecue", [-34, -98, 40, 18], [1, 1], function (o) {   // il barbecue tondo: la griglia con salsicce e hamburger, il fumo; da dietro le ruote stanno dietro
    var g = o.dietro ? -1 : 1, s = ombra(5, 4, 26, 9), L = "#1a1414", i;
    function gamba(a, b, ruota) { return palo(a, b, 2.4, "#4a4a52", L) + (ruota ? cer(b[0], b[1], 3.6, "#2a2a2e", bordo(L, 1.4)) + cer(b[0], b[1], 1.3, "#9a9aa2") : ""); }
    if (g > 0) s += palo([3, -30], [3, -9], 2.2, "#3a3a40", L);   // la gamba dietro
    else s += gamba([12, -36], [17, -10], true) + gamba([-12, -37], [-18, -11], true);   // girato: le due gambe con le ruote sono dietro
    s += ell(2 * g, -14, 14, 5, "#2e2e33", bordo(L, 1.4)) + ell(2 * g, -15, 10, 3.2, "#47474e");   // il ripiano in basso
    if (g > 0) s += gamba([-12, -34], [-17, 0], true) + gamba([14, -33], [18, 1], true);
    else s += palo([-3, -30], [-3, -1], 2.4, "#4a4a52", L);   // ... e quella sola davanti
    var conca = "M-23,-46 C-23,-30 -11,-23 0,-23 C11,-23 23,-30 23,-46 Z";
    s += pth(conca, lin("cb", [[0, "#ff6b5b"], [.45, "#c92a2a"], [1, "#6e1010"]], 0, 0, 1, .5), bordo(L, 2.2));
    s += tratto("M-17,-38 Q-12,-30 -3,-28", "#ffffff", 2, "opacity='.4'") + ell(18 * g, -36, 2.6, 1.6, "#9a9aa2", bordo(L, 1));   // il riflesso e la maniglia
    if (g > 0) s += ell(0, -28, 3, 1.4, "#9a9aa2", bordo(L, .8));   // lo sfiato (sta davanti)
    s += ell(0, -46, 23, 10.5, "#9e1f1f", bordo(L, 2));
    var bocca = ell(0, -46, 20.5, 8.6, "#000"), t = ell(0, -46, 20.5, 8.6, "#1c1210") + ell(0, -44, 15, 5, rad("br", [[0, "#ffb347"], [.5, "#e8590c", .8], [1, "#e8590c", 0]], .5, .5, .5));
    for (i = -4; i <= 4; i++) t += tratto(linea([i * 5 - 4, -53], [i * 5 + 4, -39]), "#c9c9cf", 1, "opacity='.9'");
    s += dentro("bo", bocca, t);
    // la griglia, girata di mezzo giro intorno al centro (0,-46) quando si guarda da dietro
    [[-10, -48], [-6, -43]].forEach(function (z) { var x = z[0] * g, y = -46 + (z[1] + 46) * g; s += "<rect x='" + f1(x - 5) + "' y='" + f1(y - 1.8) + "' width='11' height='3.6' rx='1.8' fill='" + lin("sa", [[0, "#d2774a"], [1, "#7a3214"]], 0, 0, 0, 1) + "' " + bordo("#3a1408", .9) + " " + ruota(20, x, y) + "/>"; });   // le salsicce
    var hx2 = 9 * g, hy = -46 + (-47 + 46) * g;
    s += ell(hx2, hy, 6.4, 3.2, lin("ha", [[0, "#a0643c"], [1, "#4a2412"]], 0, 0, 0, 1), bordo("#2a1208", .9)) + tratto("M" + q(hx2 - 4, hy) + " L" + q(hx2 + 4, hy) + " M" + q(hx2 - 3, hy + 2) + " L" + q(hx2 + 3, hy + 2), "#2a1208", .7, "opacity='.7'");   // l'hamburger
    [[-3, -64, 4.5, .6], [3, -76, 6, .5], [-2, -90, 7.5, .38]].forEach(function (f) { s += cer(f[0], f[1], f[2], rad("fu", [[0, "#ffffff", .95], [.7, "#dee2e6", .7], [1, "#ced4da", 0]], .4, .4, .6), "opacity='" + f[3] + "'"); });   // il fumo
    return s;
  }, true);

  def("vaso", [-26, -72, 32, 14], [1, 1], function () {   // vaso di terracotta con un geranio rosso
    var s = ombra(5, 3, 21, 8), L = "#5a2a16", r = rnd(23), i;
    var corpo = "M-16,-28 L-12,-1 A12 6 0 0 0 12,-1 L16,-28 A16 8 0 0 1 -16,-28 Z";
    s += pth(corpo, lin("vt", [[0, "#f0a070"], [.45, "#cf6a3a"], [1, "#8a3a18"]], 0, 0, 1, 0), bordo(L, 2.2));
    s += tratto("M-9,-24 L-7,-6", "#ffd7b8", 2, "opacity='.45'");
    s += pth("M-19,-34 L-19,-27 A19 9 0 0 0 19,-27 L19,-34 A19 9 0 0 1 -19,-34 Z", lin("vb", [[0, "#f4ad80"], [.45, "#d97a4a"], [1, "#954420"]], 0, 0, 1, 0), bordo(L, 2));
    s += ell(0, -34, 19, 9, "#e89a6c", bordo(L, 2)) + ell(0, -34, 15.5, 7, "#4a2c18", bordo(L, 1.2));
    var cf = [[-10, -40, 7], [4, -43, 7.5], [13, -38, 6], [-4, -36, 6.5], [8, -34, 5.5], [-13, -34, 5]];
    s += chioma(cf, ["#93d063", "#4c9634", "#22561a"], "#1c3a14", 29, { lw: 1.6, sc: .55, nome: "vg", n: 18 });
    [[-9, -52], [5, -57], [14, -48]].forEach(function (f) {   // i fiori: palline di petali rossi
      s += tratto(linea([f[0] * .6, -40], f), "#2f5a1c", 1.4);
      for (i = 0; i < 9; i++) { var a = r() * 6.2832, d = Math.sqrt(r()) * 4.4; s += cer(f[0] + Math.cos(a) * d, f[1] + Math.sin(a) * d * .85, 2.1, i % 3 ? "#e8322f" : "#ff6b6b", bordo("#7a0f0f", .7)); }
      s += cer(f[0] - 1.6, f[1] - 1.6, 1, "#ffffff", "opacity='.6'");
    });
    return s;
  });

  def("cassetta_posta", [-30, -112, 38, 16], [1, 1], function (o) {   // cassetta della posta rossa su un palo, con la bandierina e una lettera; da dietro: il fondo chiuso
    var g = o.dietro ? -1 : 1, s = ombra(7, 4, 18, 6.5), L = "#4a1414", lg = [lin("cp0", [[0, "#f0c690"], [1, "#d39f62"]], 0, 0, 1, 1), lin("cp1", [[0, "#d9a466"], [1, "#b07a42"]], 0, 0, 1, 1), lin("cp2", [[0, "#a06c3a"], [1, "#734a25"]], 0, 0, 1, 1)], i;
    var U = .22, V = .1, z0 = 66, z1 = 80, n = 8, arco = [], fv = (V + .01) * g;
    var bandiera = tratto(linea(P(-.1 * g, fv, z0 + 6), P(-.1 * g, fv, z1 + 22)), "#2b2b2b", 1.8) + poly([P(-.1 * g, fv, z1 + 22), P(.06 * g, fv, z1 + 22), P(.06 * g, fv, z1 + 14), P(-.1 * g, fv, z1 + 14)], "#fcc419", bordo("#7a5a00", 1.2));
    if (g < 0) s += bandiera;   // da dietro la bandierina è dall'altra parte: se ne vede la cima, dietro alla cassetta
    s += scatola(-.045, -.045, .09, .09, 0, 66, lg, "#4a2c17", 1.6);
    for (i = 0; i <= n; i++) { var t = Math.PI * i / n; arco.push([-Math.cos(t) * V, z1 + Math.sin(t) * 13]); }   // il tetto tondo: da v=-V a v=+V passando in alto
    s += poly([P(-U, V, z0), P(U, V, z0), P(U, V, z1), P(-U, V, z1)], lin("cs", [[0, "#ff6b6b"], [1, "#c92a2a"]], 0, 0, 1, 1), bordo(L, 1.8));
    for (i = 0; i < n; i++) {   // il tetto tondo a strisce, ognuna con la sua luce
      var a = arco[i], b = arco[i + 1], lum = .5 + .5 * Math.cos((i + .5) / n * Math.PI - 1.1);
      s += poly([P(-U, a[0], a[1]), P(U, a[0], a[1]), P(U, b[0], b[1]), P(-U, b[0], b[1])], mix("#9c1c1c", "#ff8a8a", lum), "stroke='" + mix("#9c1c1c", "#ff8a8a", lum) + "' stroke-width='.6'");
    }
    s += tratto("M" + arco.map(function (a) { return q(P(-U, a[0], a[1])); }).join(" L") + " L" + arco.slice().reverse().map(function (a) { return q(P(U, a[0], a[1])); }).join(" L"), L, 1.8);
    var fondo = [P(U, -V, z0)].concat(arco.map(function (a) { return P(U, a[0], a[1]); })).concat([P(U, V, z0)]);
    if (g > 0) {   // lo sportello, la maniglia e la lettera che spunta
      s += poly(fondo, lin("cd", [[0, "#d63a3a"], [1, "#8f1b1b"]], 0, 0, 1, 1), bordo(L, 1.8));
      var lp = [P(U, .05, z1 + 2), P(U, -.06, z1 + 2), P(U, -.06, z1 + 13), P(U, .05, z1 + 13)];
      s += poly(sposta(lp, 3, -2), "#ffffff", bordo("#6c757d", 1)) + tratto(linea(P(U, .05, z1 + 13), P(U, -.005, z1 + 8)) + " L" + q(P(U, -.06, z1 + 13)), "#adb5bd", .8);
      s += cer(P(U, 0, z1 - 4)[0], P(U, 0, z1 - 4)[1], 1.6, "#ffe066", bordo(L, .8));
    } else {   // il fondo chiuso, con due ribattini
      s += poly(fondo, lin("cf", [[0, "#c92a2a"], [1, "#7a1414"]], 0, 0, 1, 1), bordo(L, 1.8));
      [[-.05, z1 - 6], [.05, z1 - 6]].forEach(function (c) { var pp = P(U, c[0], c[1]); s += cer(pp[0], pp[1], 1, "#5c1010"); });
    }
    if (g > 0) s += bandiera;
    return s + tratto(linea(P(-U + .03, V, z1 + 1), P(U - .03, V, z1 + 1)), "#ffffff", 1.2, "opacity='.4'");
  }, true);

  // =========================================================
  //  TERRENO: vialetto di lastre e ghiaia. Le trame si ripetono uguali in ogni mattonella,
  //  così le mattonelle vicine combaciano e un vialetto lungo sembra fatto in un pezzo solo
  // =========================================================
  function taglia(pl, mx, my, nx, ny) {   // tiene la parte del poligono dove (punto - m)·n <= 0
    var out = [];
    for (var i = 0; i < pl.length; i++) {
      var a = pl[i], b = pl[(i + 1) % pl.length], da = (a[0] - mx) * nx + (a[1] - my) * ny, db = (b[0] - mx) * nx + (b[1] - my) * ny;
      if (da <= 0) out.push(a);
      if ((da <= 0) !== (db <= 0)) { var t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  }
  function lastre(semi, fuga) {   // le celle attorno ai semi, ripetute in tutte le mattonelle (fuga = lo spazio tra una lastra e l'altra)
    var tutti = [], ox, oy;
    for (ox = -2; ox <= 2; ox++) for (oy = -2; oy <= 2; oy++) semi.forEach(function (s, i) { if (ox || oy) tutti.push([s[0] + ox, s[1] + oy]); else tutti.push([s[0], s[1], i]); });
    return semi.map(function (s, i) {
      var pl = [[s[0] - 1.2, s[1] - 1.2], [s[0] + 1.2, s[1] - 1.2], [s[0] + 1.2, s[1] + 1.2], [s[0] - 1.2, s[1] + 1.2]];
      tutti.forEach(function (t) {
        if (t[2] === i) return;
        var nx = t[0] - s[0], ny = t[1] - s[1], l = Math.hypot(nx, ny); if (l > 1.6 || l < 1e-9) return;
        nx /= l; ny /= l; pl = taglia(pl, (s[0] + t[0]) / 2 - nx * fuga / 2, (s[1] + t[1]) / 2 - ny * fuga / 2, nx, ny);
      });
      return pl;
    });
  }
  function tondo(pl) {   // un poligono con gli angoli smussati
    var n = pl.length, d = "", i;
    for (i = 0; i < n; i++) {
      var a = pl[i], b = pl[(i + 1) % n], c = pl[(i + 2) % n];
      var b0 = [a[0] + (b[0] - a[0]) * .72, a[1] + (b[1] - a[1]) * .72], b1 = [b[0] + (c[0] - b[0]) * .28, b[1] + (c[1] - b[1]) * .28];
      d += (i ? " L" : "M") + q(b0) + " Q" + q(b) + " " + q(b1);
    }
    return d + " Z";
  }
  var ROMBO = [[-51.5, 0], [0, -26], [51.5, 0], [0, 26]];   // la mattonella, un filo più grande perché i pezzi vicini si sovrappongano senza righe
  def("vialetto", [-52, -27, 52, 27], [1, 1], function () {
    var r = rnd(303), semi = [], tent = 0, i;
    while (semi.length < 7 && tent++ < 2000) {   // 7 lastre per mattonella, sparse bene (anche guardando oltre il bordo)
      var c = [r() - .5, r() - .5];
      if (semi.some(function (s) { var dx = Math.abs(s[0] - c[0]), dy = Math.abs(s[1] - c[1]); dx = Math.min(dx, 1 - dx); dy = Math.min(dy, 1 - dy); return Math.hypot(dx, dy) < .3; })) continue;
      semi.push(c);
    }
    var celle = lastre(semi, .045), COL = ["#d6cebf", "#c4baa8", "#cfc3ad", "#bdb5a8", "#d9d0c0", "#c8bca5", "#c2b8a6"];
    var t = poly(ROMBO, "#9b8d74");
    for (i = 0; i < 40; i++) { var g = P(r() - .5, r() - .5, 0); t += cer(g[0], g[1], .8 + r(), r() < .6 ? "#7a6c55" : "#6f8f45", "opacity='.6'"); }
    var macchie = semi.map(function () { var m = []; for (var j = 0; j < 7; j++) m.push([(r() - .5) * .22, (r() - .5) * .22, .5 + r() * 1.1, r() < .5]); return m; });
    var lista = [];
    celle.forEach(function (pl, i) { for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) {
      var qq = pl.map(function (a) { return [a[0] + ox, a[1] + oy]; });
      if (qq.every(function (a) { return a[0] < -.56; }) || qq.every(function (a) { return a[0] > .56; }) || qq.every(function (a) { return a[1] < -.56; }) || qq.every(function (a) { return a[1] > .56; })) continue;
      lista.push({ pl: qq.map(function (a) { return P(a[0], a[1], 0); }), i: i, c: [semi[i][0] + ox, semi[i][1] + oy] });
    } });
    lista.forEach(function (o) { t += pth(tondo(sposta(o.pl, .6, 1.8)), "#6e6252", "opacity='.8'"); });   // lo spessore della lastra
    lista.forEach(function (o) {
      var c = COL[o.i % COL.length], d = tondo(o.pl);
      t += pth(d, lin("la" + (o.i % COL.length), [[0, chiaro(c, .25)], [.55, c], [1, scuro(c, .14)]], 0, 0, 1, 1));
      macchie[o.i].forEach(function (m) { var g2 = P(o.c[0] + m[0], o.c[1] + m[1], 0); t += cer(g2[0], g2[1], m[2], m[3] ? "#fffaf0" : "#8a7e6a", "opacity='.45'"); });
      t += pth(d, "none", "stroke='#fffaf0' stroke-width='.8' opacity='.35' transform='translate(-.4 -.6)'");
    });
    return dentro("vr", "<polygon points='" + pts(ROMBO) + "'/>", t);
  });
  def("ghiaia", [-52, -27, 52, 27], [1, 1], function () {
    var r = rnd(404), i, sassi = [], t = poly(ROMBO, "#cfc6b2"), COL = ["#e9e3d5", "#bdb39d", "#a69b84", "#dbd2bd", "#8f8571", "#f2eee4", "#c9bea6"];
    for (i = 0; i < 150; i++) sassi.push([r() - .5, r() - .5, 1.3 + r() * 1.9, Math.floor(r() * COL.length), r() * 180]);
    var lista = [];
    sassi.forEach(function (s) { for (var ox = -1; ox <= 1; ox++) for (var oy = -1; oy <= 1; oy++) { var u = s[0] + ox, v = s[1] + oy; if (Math.abs(u) > .56 || Math.abs(v) > .56) continue; var g = P(u, v, 0); lista.push([g[0], g[1], s[2], s[3], s[4]]); } });
    lista.sort(function (a, b) { return a[1] - b[1]; });
    lista.forEach(function (g) { t += ell(g[0] + .5, g[1] + .9, g[2], g[2] * .62, "#5e5545", "opacity='.45' " + ruota(g[4], g[0] + .5, g[1] + .9)); });
    lista.forEach(function (g) { t += ell(g[0], g[1], g[2], g[2] * .62, COL[g[3]], ruota(g[4], g[0], g[1])) + cer(g[0] - g[2] * .3, g[1] - g[2] * .25, g[2] * .28, "#ffffff", "opacity='.45'"); });
    return dentro("gr", "<polygon points='" + pts(ROMBO) + "'/>", t);
  });

  // =========================================================
  //  STACCIONATA bianca: "a" lungo il bordo in alto a sinistra della mattonella (dall'angolo sinistro a quello in alto),
  //  "b" lungo il bordo in alto a destra (dall'angolo in alto a quello destro). Ai due capi un palo: i pezzi vicini
  //  hanno il palo nello stesso punto, così si attaccano puliti (anche all'angolo dove a e b si incontrano)
  // =========================================================
  function staccionata(lato) {
    var L = "#6b5a44", s = "", i, e = .035, AB = lato === "a";
    function Q(t, z, d) { return AB ? P(-.5 + (d || 0), .5 - t, z) : P(-.5 + t, -.5 + (d || 0), z); }   // t = 0 davanti … 1 in fondo (a), 0 in fondo … 1 a destra (b)
    var lu = AB ? ["#f6f0e2", "#e0d6c0"] : ["#fffbf0", "#efe6d2"], fianco = AB ? "#fffaf0" : "#d8ccb2";
    s += poly([Q(0, 0), Q(1, 0), sposta([Q(1, 0)], 7, 3.5)[0], sposta([Q(0, 0)], 7, 3.5)[0]], "#000", "opacity='.1'");   // l'ombra a terra
    [11, 26].forEach(function (z) {   // le due traverse (dietro alle assi)
      s += poly([Q(0, z, -.015), Q(1, z, -.015), Q(1, z + 5, -.015), Q(0, z + 5, -.015)], AB ? "#ddd2bb" : "#ece3cf", bordo(L, 1.2));
    });
    function paletto(t) {   // il palo quadrato col cappuccio a punta
      var c = AB ? [-.5, .5 - t] : [-.5 + t, -.5], u = c[0] - e, v = c[1] - e, H = 42;
      var o = scatola(u, v, 2 * e, 2 * e, 0, H, ["#fffaf0", "#f4ecda", "#d6c9ad"], L, 1.4), ap = P(c[0], c[1], H + 7);
      return o + poly([P(u, v + 2 * e, H), P(u + 2 * e, v + 2 * e, H), ap], "#fbf5e8", bordo(L, 1.3)) + poly([P(u + 2 * e, v + 2 * e, H), P(u + 2 * e, v, H), ap], "#d6c9ad", bordo(L, 1.3));
    }
    var ordine = AB ? [1, 0] : [0, 1];   // prima il palo in fondo, per ultimo quello davanti
    s += paletto(ordine[0]);
    var n = 5, lst = [];
    for (i = 0; i < n; i++) lst.push(.13 + i * (.74 / (n - 1)));
    if (AB) lst.reverse();
    lst.forEach(function (t) {   // le assi a punta
      var w = .045, a = Q(t - w, 0, .012), b = Q(t + w, 0, .012), c = Q(t + w, 34, .012), d = Q(t, 40, .012), f = Q(t - w, 34, .012);
      var lato2 = AB ? [Q(t - w, 0, .012), Q(t - w, 0, .035), Q(t - w, 34, .035), Q(t - w, 34, .012)] : [Q(t + w, 0, .012), Q(t + w, 0, .035), Q(t + w, 34, .035), Q(t + w, 34, .012)];
      s += poly(lato2, fianco, bordo(L, 1));
      s += poly([a, b, c, d, f], lin("as" + lato, [[0, lu[0]], [1, lu[1]]], 0, 0, 1, 1), bordo(L, 1.4));
      s += tratto(linea(Q(t, 3, .012), Q(t, 30, .012)), "#c9bb9c", .7, "opacity='.6'");
    });
    return s + paletto(ordine[1]);
  }
  def("staccionata_a", [-60, -82, 14, 12], [1, 1], function () { return staccionata("a"); });
  def("staccionata_b", [-12, -82, 62, 12], [1, 1], function () { return staccionata("b"); });

  // =========================================================
  //  LA CASA (semplice, di riserva: quella vera la disegna js/case-arte.js)
  //  fp 4×4; la porta al centro della faccia davanti a sinistra, con la base in (ax−100, ay+50)
  // =========================================================
  def("casa", [-222, -414, 256, 122], [4, 4], function (o) {
    var notte = !!(o && o.notte), s = "", W = 2, O = 2.15, E = 175, R = 300, L = "#5a3a22", i;
    function zr(v) { return R - Math.abs(v) / O * (R - E); }
    var zt = zr(W) - 2;
    s += ell(36, 14, 218, 106, rad("oc", [[0, "#000", .22], [.75, "#000", .14], [1, "#000", 0]], .5, .5, .5));
    var muroD = [P(W, W, 0), P(W, -W, 0), P(W, -W, zt), P(W, 0, R - 2), P(W, W, zt)], muroF = [P(-W, W, 0), P(W, W, 0), P(W, W, zt), P(-W, W, zt)];
    s += poly(muroD, lin("md", [[0, "#e8d2a8"], [1, "#c9ab7e"]], 0, 0, 1, 1), bordo(L, 2.6)) + poly(muroF, lin("mf", [[0, "#fcf1da"], [1, "#efd8ae"]], 0, 0, 1, 1), bordo(L, 2.6));
    s += poly([P(W, W, 0), P(W, -W, 0), P(W, -W, 16), P(W, W, 16)], "#9c8466", bordo(L, 2)) + poly([P(-W, W, 0), P(W, W, 0), P(W, W, 16), P(-W, W, 16)], "#b9a184", bordo(L, 2));   // lo zoccolo di pietra
    function fin(Q, a0, a1, z0, z1, k) {   // una finestra: cornice di legno, vetro (acceso di notte), la croce, il davanzale
      var f = "", c = function (a, z, d) { return Q(a, z, d || 0); };
      f += poly([c(a0 - .06, z0 - 5), c(a1 + .06, z0 - 5), c(a1 + .06, z1 + 5), c(a0 - .06, z1 + 5)], scuro("#a8682f", k), bordo(L, 2));
      f += poly([c(a0, z0), c(a1, z0), c(a1, z1), c(a0, z1)], notte ? lin("fn", [[0, "#fffdf0"], [.45, "#ffe680"], [1, "#ffb81f"]], 0, 0, .3, 1) : lin("fg", [[0, "#dcefff"], [1, "#7eaed8"]], 0, 0, .3, 1));
      f += poly([c(a0, z1), c(a0 + (a1 - a0) * .28, z1), c(a0 + (a1 - a0) * .1, z0 + (z1 - z0) * .35), c(a0, z0 + 6)], notte ? "#f5a742" : "#e58f7a", "opacity='.75'") + poly([c(a1, z1), c(a1 - (a1 - a0) * .28, z1), c(a1 - (a1 - a0) * .1, z0 + (z1 - z0) * .35), c(a1, z0 + 6)], notte ? "#f5a742" : "#e58f7a", "opacity='.75'");
      if (!notte) f += poly([c(a0 + (a1 - a0) * .5, z1), c(a0 + (a1 - a0) * .68, z1), c(a0 + (a1 - a0) * .4, z0), c(a0 + (a1 - a0) * .22, z0)], "#ffffff", "opacity='.3'");
      f += tratto(linea(c((a0 + a1) / 2, z0), c((a0 + a1) / 2, z1)), scuro("#8a5428", k), 3) + tratto(linea(c(a0, z0 + (z1 - z0) * .6), c(a1, z0 + (z1 - z0) * .6)), scuro("#8a5428", k), 3);
      f += poly([c(a0, z0), c(a1, z0), c(a1, z1), c(a0, z1)], "none", bordo(L, 1.6));
      return f + poly([c(a0 - .1, z0 - 4, .08), c(a1 + .1, z0 - 4, .08), c(a1 + .1, z0 - 4), c(a0 - .1, z0 - 4)], "#f6efe2", bordo(L, 1.4)) + poly([c(a0 - .1, z0 - 9, .08), c(a1 + .1, z0 - 9, .08), c(a1 + .1, z0 - 4, .08), c(a0 - .1, z0 - 4, .08)], scuro("#e2d4bb", k), bordo(L, 1.4));
    }
    var QF = function (a, z, d) { return P(a, W + d, z); }, QD = function (a, z, d) { return P(W + d, a, z); };
    s += fin(QD, .7, 1.3, 52, 118, .12) + fin(QD, -1.3, -.7, 52, 118, .12) + fin(QF, -1.6, -1, 52, 118, 0) + fin(QF, 1, 1.6, 52, 118, 0);
    // la porta, al centro della faccia: cornice di pietra, legno a doghe, la maniglia, il vetrino
    function arco(a0, a1, zs, ra) { var l = [QF(a0, 0, 0)], k; for (k = 0; k <= 10; k++) { var t = Math.PI - k / 10 * Math.PI; l.push(QF((a0 + a1) / 2 + Math.cos(t) * (a1 - a0) / 2, zs + Math.sin(t) * ra, 0)); } l.push(QF(a1, 0, 0)); return l; }
    s += poly(arco(-.5, .5, 112, 24), "#e3d6bf", bordo(L, 2.2)) + poly(arco(-.42, .42, 112, 18), lin("po", [[0, "#a8642f"], [1, "#6a3a1a"]], 0, 0, 1, 1), bordo(L, 2));
    [-.21, 0, .21].forEach(function (a) { s += tratto(linea(QF(a, 3, 0), QF(a, 118, 0)), "#4a2812", 1, "opacity='.55'"); });
    s += poly([QF(-.16, 82, 0), QF(.16, 82, 0), QF(.16, 104, 0), QF(-.16, 104, 0)], notte ? "#ffd166" : "#3d4f5c", bordo(L, 1.4));
    [24, 74].forEach(function (z) { s += tratto(linea(QF(-.4, z, 0), QF(-.18, z, 0)), "#2b2018", 3); });
    var mn = QF(.3, 58, .02); s += cer(mn[0], mn[1], 2.6, "#fcc419", bordo("#6b4a00", 1));
    s += scatola(-.58, W, 1.16, .22, 0, 9, ["#ddd2bf", "#c4b69e", "#a8987e"], L, 2);   // il gradino
    s += poly([P(-.38, W + .27, .5), P(.38, W + .27, .5), P(.38, W + .55, .5), P(-.38, W + .55, .5)], "#b08a52", bordo("#6e5230", 1.5)) + poly([P(-.32, W + .31, .6), P(.32, W + .31, .6), P(.32, W + .51, .6), P(-.32, W + .51, .6)], "none", "stroke='#8a6234' stroke-width='1.2'");   // lo zerbino
    // la lampada accanto alla porta
    s += tratto(linea(QF(-.68, 124, 0), QF(-.68, 124, .12)), "#2b2018", 3);
    var la = [P(-.74, W + .12, 98), P(-.62, W + .12, 98), P(-.62, W + .12, 116), P(-.74, W + .12, 116)], lb = [P(-.62, W + .12, 98), P(-.62, W + .02, 98), P(-.62, W + .02, 116), P(-.62, W + .12, 116)];
    s += poly(la, notte ? "#ffe066" : "#e7f1f6", bordo("#1a1410", 1.6)) + poly(lb, notte ? "#f5b400" : "#b6c8d2", bordo("#1a1410", 1.6)) + poly([P(-.76, W + .14, 116), P(-.6, W + .14, 116), P(-.68, W + .07, 124)], "#2b2018", bordo("#1a1410", 1.2));
    // il comignolo (dietro al colmo)
    s += scatola(-1.32, -.82, .4, .4, 240, 105, ["#d97a5a", "#c0583b", "#94402a"], L, 2) + scatola(-1.37, -.87, .5, .5, 345, 7, ["#cfc5b4", "#b3a893", "#8f8471"], L, 1.8);
    // il tetto: bordo sul lato, falda davanti a tegole, colmo
    s += poly([P(O, O, E), P(O, 0, R), P(O, -O, E), P(O, -O, E - 10), P(O, 0, R - 10), P(O, O, E - 10)], "#8a5530", bordo(L, 2));
    var falda = [P(-O, 0, R), P(O, 0, R), P(O, O, E), P(-O, O, E)], t = poly(falda, "#c8553a");
    for (i = 0; i < 9; i++) { var v = O - i * O / 9 - .05; t += tratto(linea(P(-O, v, zr(v)), P(O, v, zr(v))), "#7a2e18", 1.4) + tratto(linea(P(-O, v - .04, zr(v - .04)), P(O, v - .04, zr(v - .04))), "#ef9a72", 1, "opacity='.6'"); }
    s += dentro("fa", "<polygon points='" + pts(falda) + "'/>", t) + poly(falda, "none", bordo(L, 2.4));
    s += poly([P(-O, O, E), P(O, O, E), P(O, O, E - 10), P(-O, O, E - 10)], "#a8683a", bordo(L, 2));
    return s + tratto(linea(P(-O - .02, 0, R + 1), P(O + .02, 0, R + 1)), L, 12) + tratto(linea(P(-O - .02, 0, R + 1), P(O + .02, 0, R + 1)), "#b84a30", 8);
  });

  // =========================================================
  window.SGGiardinoArte = {
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) { var d = DIS[nome]; if (!d) return null; var m = misure(d), o = { w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice() }; if (d.dietro) o.dietro = true; return o; },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      var m = misure(d);
      p = "ga" + (++nId) + "_"; DEFS = []; FATTI = {};
      var corpo = d.fn(opz || {});
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + corpo + "</g></svg>";
    }
  };
})();

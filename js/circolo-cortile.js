/* =========================================================
   SPeeD GAME — IL CIRCOLO: IL CORTILE (visto dall'alto, come i mobili della casa)
   Il cortile del circolo di paese, d'estate: il campo da bocce di terra battuta con le sponde di legno,
   la pergola coperta dalla vite con l'uva e le lucine colorate, il tavolo da osteria con la tovaglia a quadri,
   il fiasco e il pane, la panca di legno, il vaso di gerani rossi, il lampione di ferro battuto e il "nasone".
   Una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Tipi: "terra" (il campo da bocce: 100 × 100 visto da sopra; lungo x si ripete senza giunte),
   "sospeso" (la pergola: in alto, sotto si cammina), "piedi" (gli altri: il davanti guarda in basso a sinistra,
   con { dietro: true } lo stesso pezzo girato). Con { notte: true } le lucine e il lampione accesi.
   Il tavolo ha i "posti" (le mattonelle dove ci si siede, relative all'angolo dell'impronta nel disegno davanti).
   Non si vendono nel negozio: reparto "circolo", prezzo 0. Si aggiungono con SGMobiliArte.aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte || !window.SGMobiliArte.aggiungi) return;

  // ---------- attrezzi (gli stessi degli altri mobili) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato; NOTTE = luce accesa
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 100) / 100; }
  function f2(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(k) { return "opacity='" + f2(k) + "'"; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f2(x) + "' cy='" + f2(y) + "' r='" + f2(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f2(x) + "' cy='" + f2(y) + "' rx='" + f2(rx) + "' ry='" + f2(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f2(x) + "' y='" + f2(y) + "' width='" + f2(w) + "' height='" + f2(h) + "'" + (r ? " rx='" + f2(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + f2(w == null ? 2.4 : w) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f2(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q(a) + " L" + q(b); }
  function chiuso(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function aperto(a) { return "M" + a.map(function (x) { return q(x); }).join(" L"); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function gruppo(t, c) { return "<g transform='" + t + "'>" + c + "</g>"; }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  // sfumature, motivi e ritagli (gli id col prefisso del disegno)
  function sfum(tag, nome, stops, a) {
    var id = p + nome;
    if (!FATTI[id]) {
      FATTI[id] = 1;
      DEFS.push("<" + tag + " id='" + id + "' " + a + ">" + stops.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join("") + "</" + tag + ">");
    }
    return "url(#" + id + ")";
  }
  function lin(nome, stops, x1, y1, x2, y2, user) { return sfum("linearGradient", user ? nome + (++nC) : nome, stops, "x1='" + f2(x1) + "' y1='" + f2(y1) + "' x2='" + f2(x2) + "' y2='" + f2(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function rad(nome, stops, cx, cy, r) { return sfum("radialGradient", nome, stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function nuova(stops, x1, y1, x2, y2, user) { return sfum("linearGradient", "g" + (++nC), stops, "x1='" + f2(x1) + "' y1='" + f2(y1) + "' x2='" + f2(x2) + "' y2='" + f2(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function nuovaR(stops, cx, cy, r) { return sfum("radialGradient", "g" + (++nC), stops, "cx='" + f2(cx) + "' cy='" + f2(cy) + "' r='" + f2(r) + "'"); }
  function motivo(nome, w, h, corpo) {   // un motivo che si ripete (la tovaglia, il dorso delle carte)
    var id = p + nome;
    if (!FATTI[id]) { FATTI[id] = 1; DEFS.push("<pattern id='" + id + "' patternUnits='userSpaceOnUse' width='" + f2(w) + "' height='" + f2(h) + "'>" + corpo + "</pattern>"); }
    return "url(#" + id + ")";
  }
  function dentro(forma, corpo, pari) {   // corpo ritagliato dentro la forma (un tracciato "d"); pari = la forma ha dei buchi
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'" + (pari ? " clip-rule='evenodd'" : "") + "/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  // ---------- i blocchi squadrati (come nel bagno) ----------
  function faccia(o, dir, c) { return "<g transform='matrix(.8197 " + (dir > 0 ? ".4098" : "-.4098") + " 0 1 " + f1(o[0]) + " " + f1(o[1]) + ")'>" + c + "</g>"; }
  function tinte(c) {   // i tre colori: sopra, la faccia di sinistra (alla luce), quella di destra (in ombra)
    if (typeof c !== "string") return c;
    var k = c.slice(1);
    return [lin("ts" + k, [[0, chiaro(c, .32)], [1, chiaro(c, .1)]], 0, 0, 1, 1), lin("tl" + k, [[0, chiaro(c, .12)], [1, scuro(c, .06)]], 0, 0, 0, 1), lin("td" + k, [[0, scuro(c, .2)], [1, scuro(c, .34)]], 0, 0, 0, 1)];
  }
  // un blocco da a0..a1, b0..b1 (b1 = davanti), z0..z1; f = { davanti, dietro, fianco, sopra }: disegni piatti (W, H) per le facce
  function blocco(a0, a1, b0, b1, z0, z1, col, f, lw) {
    f = f || {};
    var u0 = G > 0 ? a0 : -a1, u1 = G > 0 ? a1 : -a0, v0 = G > 0 ? b0 : -b1, v1 = G > 0 ? b1 : -b0, c = tinte(col);
    var A = Puv(u0, v0, z1), B = Puv(u1, v0, z1), C = Puv(u1, v1, z1), D = Puv(u0, v1, z1), Bb = Puv(u1, v0, z0), Cb = Puv(u1, v1, z0), Db = Puv(u0, v1, z0);
    var Ws = (u1 - u0) * 61, Wd = (v1 - v0) * 61, H = z1 - z0, fs = G > 0 ? f.davanti : f.dietro;
    var s = faccia(D, 1, rett(0, 0, Ws, H, 0, c[1]) + (fs ? fs(Ws, H) : "")) + faccia(C, -1, rett(0, 0, Wd, H, 0, c[2]) + (f.fianco ? f.fianco(Wd, H) : "")) + poly([A, B, C, D], c[0]);
    if (f.sopra) s += f.sopra(A, B, C, D, (u1 - u0) * 100, (v1 - v0) * 100);
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), L, .7, "opacity='.7'");   // gli spigoli di dentro, sottili
    if (H > 4) s += tratto("M" + q(D[0] + 1, D[1] + .9) + " L" + q(C[0] - .5, C[1] + .8), "#ffffff", .8, "opacity='.5'");   // il filo di luce sullo spigolo davanti
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, lw || 1.6));
  }
  // un disegno piatto steso in pianta all'altezza z (X = a·61, Y = b·61)
  function mat(m, c) { return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>"; }
  function suZ(z, c) { return mat([.8197 * G, .4098 * G, -.8197 * G, .4098 * G, 0, -z], c); }

  // ---------- i pezzi torniti (gambe, bicchieri, birilli): il profilo [[z, raggio in mattonelle], ...] ----------
  function dTornito(a, b, prof) {
    var c = P(a, b, 0), n = prof.length, sx = [], dx = [], i;
    for (i = 0; i < n; i++) { var rx = prof[i][1] * 70.71, y = c[1] - prof[i][0]; sx.push([c[0] - rx, y]); dx.push([c[0] + rx, y]); }
    var rt = prof[n - 1][1] * 70.71, rb = prof[0][1] * 70.71;
    var d = "M" + sx.map(function (x) { return q(x); }).join(" L") + " A" + f1(rt) + "," + f1(rt / 2) + " 0 0,1 " + q(dx[n - 1]);
    for (i = n - 2; i >= 0; i--) d += " L" + q(dx[i]);
    return d + " A" + f1(rb) + "," + f1(rb / 2) + " 0 0,1 " + q(sx[0]) + " Z";
  }
  function tornito(a, b, prof, stops, lw, anelli, luce) {   // anelli = i livelli dove si vede un anello; luce = il filo chiaro a sinistra
    var c = P(a, b, 0), n = prof.length, rm = 0;
    prof.forEach(function (x) { rm = Math.max(rm, x[1] * 70.71); });
    var o = pth(dTornito(a, b, prof), lin("tn", stops, c[0] - rm, 0, c[0] + rm, 0, true), lw ? bordo(L, lw) : "");
    (anelli || []).forEach(function (k) { var rx = prof[k][1] * 70.71, y = c[1] - prof[k][0]; o += pth("M" + q(c[0] - rx, y) + " A" + f1(rx) + "," + f1(rx / 2) + " 0 0,0 " + q(c[0] + rx, y), "none", "stroke='" + L + "' stroke-width='.5' opacity='.5'"); });
    if (luce) o += tratto("M" + prof.slice(1, n - 1).map(function (x) { return q(c[0] - x[1] * 70.71 * .5, c[1] - x[0]); }).join(" L"), "#ffffff", luce, "opacity='.5'");
    return o;
  }
  function anello(a, b, z, r) { var c = P(a, b, z); return { x: c[0], y: c[1], rx: r * 70.71, ry: r * 35.36 }; }   // un cerchio in pianta, visto (un'ellisse)

  // ---------- le ombre a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra) ----------
  function aTerra(c) { return "<g transform='matrix(50 25 -50 25 0 0)'>" + c + "</g>"; }
  function ombraPianta(a0, a1, b0, b1, k, pad) {
    pad = pad == null ? .1 : pad;
    var cu = G * (a0 + a1) / 2 + .05, cv = G * (b0 + b1) / 2 - .01;
    return aTerra("<ellipse cx='" + f2(cu) + "' cy='" + f2(cv) + "' rx='" + f2((a1 - a0) / 2 + pad) + "' ry='" + f2((b1 - b0) / 2 + pad) + "' fill='" + rad("omp", [[0, "#000", .26], [.6, "#000", .17], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>");
  }
  function ombraForma(pp, k) {   // l'ombra morbida sotto un tavolo: la sua forma, a strati sempre più scuri verso il centro
    k = k || 1;
    var bb = limiti(pp), m = Math.min(1, Math.min(bb[2] - bb[0], bb[3] - bb[1]) / 1.6);   // sotto i tavoli piccoli gli strati di dentro si stringono meno
    function g2(d) { return chiuso(allarga(pp, d < 0 ? d * m : d).map(function (x) { return Puv(G * x[0] + .06, G * x[1] - .02, 0); })); }
    return pth(g2(.13), "#000", op(.05 * k)) + pth(g2(.06), "#000", op(.06 * k)) + pth(g2(-.02), "#000", op(.07 * k)) + pth(g2(-.14), "#000", op(.08 * k)) + pth(g2(-.3), "#000", op(.06 * k));
  }

  // ---------- le forme in pianta (punti [a, b], tutte girate nello stesso verso) ----------
  function pulisci(a) { return a.filter(function (x, i) { var y = a[(i + a.length - 1) % a.length]; return Math.abs(x[0] - y[0]) > 1e-4 || Math.abs(x[1] - y[1]) > 1e-4; }); }
  function nrm(A, B) { var dx = B[0] - A[0], dy = B[1] - A[1], l = Math.sqrt(dx * dx + dy * dy) || 1; return [dy / l, -dx / l]; }   // la normale verso fuori di un lato
  function allarga(pp, d) {   // la stessa forma spostata in fuori di d (in dentro se d < 0)
    var n = pp.length, out = [], i;
    for (i = 0; i < n; i++) {
      var n1 = nrm(pp[(i + n - 1) % n], pp[i]), n2 = nrm(pp[i], pp[(i + 1) % n]), m = [n1[0] + n2[0], n1[1] + n2[1]], lm = Math.sqrt(m[0] * m[0] + m[1] * m[1]) || 1;
      m = [m[0] / lm, m[1] / lm];
      var k = 1 / Math.max(.5, m[0] * n1[0] + m[1] * n1[1]);
      out.push([pp[i][0] + m[0] * d * k, pp[i][1] + m[1] * d * k]);
    }
    return out;
  }
  function pRett(a0, a1, b0, b1, r, n) {   // un rettangolo con gli angoli tondi
    n = n || 6; var o = [], cs = [[a1 - r, b1 - r], [a0 + r, b1 - r], [a0 + r, b0 + r], [a1 - r, b0 + r]], k, i;
    for (k = 0; k < 4; k++) for (i = 0; i <= n; i++) { var t = (k + i / n) * Math.PI / 2; o.push([cs[k][0] + r * Math.cos(t), cs[k][1] + r * Math.sin(t)]); }
    return pulisci(o);
  }

  // ---------- i legni del circolo ----------
  var CASTAGNO = "#9a6036";   // il castagno dei tavoli del circolo
  function legno(c) { return [[0, chiaro(c, .42)], [.3, chiaro(c, .14)], [.65, scuro(c, .26)], [1, scuro(c, .58)]]; }   // il legno tondo, girato verso la luce
  // la gamba squadrata che si stringe in basso: s0 = mezzo lato in basso, s1 in alto
  function gambaQuadra(a, b, s0, s1, z0, z1, col) {
    var u = a * G, v = b * G;
    function Q(du, dv, s, z) { return Puv(u + du * s, v + dv * s, z); }
    var sx = [Q(-1, 1, s0, z0), Q(1, 1, s0, z0), Q(1, 1, s1, z1), Q(-1, 1, s1, z1)], dx = [Q(1, 1, s0, z0), Q(1, -1, s0, z0), Q(1, -1, s1, z1), Q(1, 1, s1, z1)];
    var c = Q(0, 0, 0, z0);
    var o = z0 < .5 ? ell(c[0] + 1.2, c[1] + .6, s0 * 90 + 2, s0 * 45 + 1.2, "#000", op(.24)) : "";
    o += poly(sx, nuova([[0, chiaro(col, .14)], [1, scuro(col, .06)]], 0, sx[3][1], 0, sx[0][1], true)) + poly(dx, nuova([[0, scuro(col, .2)], [1, scuro(col, .36)]], 0, dx[3][1], 0, dx[0][1], true));
    o += tratto(linea(lerp(sx[0], sx[1], .25), lerp(sx[3], sx[2], .25)), "#ffffff", .5, op(.3)) + tratto(linea(sx[1], sx[2]), "#fff3df", .5, op(.45));   // il lucido sullo spigolo
    return o + poly([sx[0], sx[1], dx[1], dx[2], sx[2], sx[3]], "none", bordo(L, 1.1)) + tratto(linea(sx[1], sx[2]), L, .5, op(.6));
  }
  // il bicchiere da osteria (vetro spesso, un po' svasato) col rosso fino a "pieno"
  var VETRO = [[0, "#ffffff", .62], [.3, "#eef8fb", .2], [.75, "#d6ebf2", .24], [1, "#86b3c4", .6]];
  function bicchiere(a, b, z, pieno) {
    var r0 = .042, r1 = .052, h = 9.5, s = "", c = P(a, b, z), zv = z + 1.2 + (h - 1.6) * pieno, rv = r0 + (r1 - r0) * (zv - z) / h - .005;
    s += ell(c[0] + 2.3, c[1] + 1, r1 * 70.71 + 1.6, r1 * 35.36 + .9, "#000", op(.24)) + ell(c[0] + 3.6, c[1] + 1.6, 3, 1.3, "#b0202f", op(.22));   // l'ombra, e il riflesso rosso del vino sul panno
    s += tornito(a, b, [[z + 1.2, r0 - .005], [zv, rv]], [[0, "#a3263a"], [.45, "#7d1023"], [1, "#3d0510"]], 0);
    s += tornito(a, b, [[z, r0], [z + 1.2, r0], [z + h, r1]], VETRO, .8);
    var w = anello(a, b, zv, rv), t = anello(a, b, z + h, r1);
    s += ell(w.x, w.y, w.rx, w.ry, nuovaR([[0, "#c94a5c"], [1, "#6e0c1d"]], .4, .35, .8)) + ell(w.x - w.rx * .3, w.y - w.ry * .3, w.rx * .3, w.ry * .3, "#ffffff", op(.35));
    s += ell(t.x, t.y, t.rx, t.ry, "none", "stroke='#ffffff' stroke-width='.9' opacity='.85'") + ell(t.x, t.y, t.rx, t.ry, "none", bordo(L, .5));
    return s + tratto(linea([t.x - t.rx * .55, t.y + 1.5], [c[0] - r0 * 70.71 * .55, c[1] - 1.6]), "#ffffff", .9, op(.75)) + ell(c[0], c[1], r0 * 70.71 * .85, r0 * 35.36 * .85, "none", "stroke='#ffffff' stroke-width='.6' opacity='.5'");
  }

  // =========================================================
  //  IL CORTILE: i materiali
  // =========================================================
  var LEGNO_P = "#8e5a34", LEGNO_PANCA = "#a96d3e", TRAV = "#e2d6b6", GHISA = "#2f6343", COTTO = "#c66b3c";
  var COTTO_ST = [[0, "#f4ad7e"], [.3, "#dc834e"], [.68, "#b25b2c"], [1, "#6f3015"]];   // la terracotta, girata verso la luce
  var FE_ST = [[0, "#8c8688"], [.28, "#4e4749"], [.66, "#252022"], [1, "#0b0909"]];      // il ferro battuto
  var GH_ST = [[0, "#86bb93"], [.26, "#4c8b5d"], [.62, "#2a5b3b"], [1, "#0e2818"]];      // la ghisa verde del nasone
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  function liscio(pp) {   // un tracciato morbido che passa per tutti i punti (sullo schermo)
    var d = "M" + q(pp[0]), i;
    for (i = 0; i < pp.length - 1; i++) {
      var p0 = pp[Math.max(0, i - 1)], p1 = pp[i], p2 = pp[i + 1], p3 = pp[Math.min(pp.length - 1, i + 2)];
      d += " C" + q(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6) + " " + q(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6) + " " + q(p2);
    }
    return d;
  }
  function usa(id, t, x) { return "<use xlink:href='#" + p + id + "' transform='" + t + "'" + attr(x) + "/>"; }
  function simbolo(id, corpo) { var k = p + id; if (!FATTI[k]) { FATTI[k] = 1; DEFS.push("<g id='" + k + "'>" + corpo + "</g>"); } }

  // =========================================================
  //  CAMPO DA BOCCE (a terra, 100 × 100 visto da sopra): x lungo il campo, y di traverso.
  //  La terra battuta chiara, lisciata per il lungo, coi granelli e qualche sassolino; le sponde di legno in alto
  //  e in basso (la cima dell'asse, il fianco di dentro in ombra, le viti). Lungo x tutto si ripete con passo 100:
  //  messi in fila (anche girati di 90°) fanno un campo lungo senza giunte
  // =========================================================
  var T0 = 15, T1 = 85;   // la terra tra le due sponde
  function ondaX(y, amp, k, fase) {   // una riga lungo x, mossa ma uguale a x = 0 e a x = 100
    var d = "", i;
    for (i = -1; i <= 21; i++) { var x = i * 5; d += (i > -1 ? " L" : "M") + f1(x) + "," + f1(y + amp * Math.sin(x / 100 * 2 * Math.PI * k + fase)); }
    return d;
  }
  function granelli(lista) {   // tanti puntini in un tracciato solo; quelli vicino ai bordi si ripetono dall'altra parte
    var d = "";
    lista.forEach(function (g) {
      [0, 100, -100].forEach(function (dx) {
        var x = g[0] + dx; if (x < -g[2] || x > 100 + g[2]) return;
        d += "M" + q(x - g[2], g[1]) + " a" + f2(g[2]) + "," + f2(g[2]) + " 0 1,0 " + f2(2 * g[2]) + ",0 a" + f2(g[2]) + "," + f2(g[2]) + " 0 1,0 " + f2(-2 * g[2]) + ",0 ";
      });
    });
    return d;
  }
  function sassolino(x, y, rx, ry, ang, c) {
    return "<g transform='translate(" + f2(x) + " " + f2(y) + ") rotate(" + f1(ang) + ")'>" + ell(0, 0, rx * 1.35, ry * 1.4, "#5a4228", op(.16)) +
      ell(0, 0, rx, ry, lin("ss" + c.slice(1), [[0, chiaro(c, .5)], [1, scuro(c, .28)]], 0, 0, 1, 1), "stroke='#5e4a33' stroke-width='.3'") + ell(-rx * .28, -ry * .34, rx * .36, ry * .26, "#ffffff", op(.6)) + "</g>";
  }
  function sponda(alto) {   // la sponda di legno: alto = quella in alto (da y = 0), se no quella in basso (fino a 100)
    var s = "", d = alto ? 1 : -1, y0 = alto ? 0 : 100, LG = "#b57c45", k = alto ? 0 : 1;
    function Y(t) { return y0 + d * t; }
    function fascia(t0, t1, fill, x) { var a = Y(t0), b = Y(t1); return rett(-1, Math.min(a, b), 102, Math.abs(b - a), 0, fill, x); }
    s += fascia(14.6, 23, lin("om", [[0, "#4a2c12", .36], [.4, "#4a2c12", .13], [1, "#4a2c12", 0]], 0, Y(14.6), 0, Y(23), true));   // l'ombra della sponda sulla terra
    s += fascia(10, 14.8, lin("fi", [[0, "#7c4e2b"], [.6, "#64401f"], [1, "#4e3018"]], 0, Y(10), 0, Y(14.8), true));                // il fianco di dentro, in ombra
    s += fascia(2.2, 10.2, lin("so", [[0, chiaro(LG, .02)], [.45, chiaro(LG, .2)], [1, chiaro(LG, .08)]], 0, Y(2.2), 0, Y(10.2), true));   // la cima dell'asse
    s += fascia(.9, 2.3, "#8a5a32");   // lo spigolo di fuori
    s += tratto(ondaX(Y(3.6), .3, 1, .4 + k * 2) + " " + ondaX(Y(5.8), .35, 2, 1.9 + k) + " " + ondaX(Y(7.9), .3, 1, 3.1 + k * .7), scuro(LG, .4), .4, op(.5));   // le venature
    s += tratto(ondaX(Y(4.7), .3, 3, .8 + k * 1.6) + " " + ondaX(Y(6.9), .25, 2, 2.6 + k), scuro(LG, .25), .28, op(.45));
    s += tratto("M-1," + f2(Y(2.5)) + " H101", "#fff1d6", .5, op(.45)) + tratto("M-1," + f2(Y(9.4)) + " H101", "#fff1d6", .7, op(.65)) + tratto("M-1," + f2(Y(10.2)) + " H101", "#3d2414", .6, op(.7)) + tratto("M-1," + f2(Y(14.75)) + " H101", L, .6, op(.55));
    [12.5, 37.5, 62.5, 87.5].forEach(function (x) { s += cer(x, Y(6), .8, "#4a3424") + cer(x - .25, Y(6) - .25, .32, "#e2cfae", op(.85)); });   // le viti
    return s + fascia(0, 1, L);
  }
  function campo() {
    var r = rnd(731), s = "", i, y;
    s += rett(-1, -1, 102, 102, 0, lin("ter", [[0, "#bb9a68"], [.2, "#cfb07f"], [.5, "#dbc193"], [.8, "#cfb07f"], [1, "#bb9a68"]], 0, 0, 0, 1));
    var mac = [];   // le zone più battute (più scure) e quelle più asciutte (più chiare), morbide
    for (i = 0; i < 9; i++) mac.push([r() * 100, T0 + 8 + r() * (T1 - T0 - 16), 6 + r() * 10, 2.5 + r() * 4, i % 2]);
    mac.forEach(function (m) { [0, 100, -100].forEach(function (dx) { if (m[0] + dx > -m[2] && m[0] + dx < 100 + m[2]) s += ell(m[0] + dx, m[1], m[2], m[3], rad(m[4] ? "mcc" : "mcs", [[0, m[4] ? "#f1e0b8" : "#9c7e50", .34], [1, m[4] ? "#f1e0b8" : "#9c7e50", 0]], .5, .5, .5)); }); });
    var scure = "", chiare = "";   // la terra lisciata per il lungo: righe appena accennate
    for (y = T0 + 5; y < T1 - 4; y += 4.6) { var k = 1 + Math.floor(r() * 3), f = r() * 6.28, a = .22 + r() * .25; scure += ondaX(y, a, k, f) + " "; chiare += ondaX(y + .8, a, k, f) + " "; }
    s += tratto(scure, "#8c6e44", .5, op(.13)) + tratto(chiare, "#fff8e6", .45, op(.18));
    var cl = [["#a0814f", .55], ["#b8996a", .5], ["#f3e5c4", .65], ["#7f6238", .5], ["#fff2d6", .5], ["#6e5330", .45]], gg = cl.map(function () { return []; });   // i granelli
    for (i = 0; i < 460; i++) gg[Math.floor(r() * cl.length)].push([r() * 100, T0 + 2 + r() * (T1 - T0 - 4), .16 + r() * .32]);
    cl.forEach(function (c, j) { s += pth(granelli(gg[j]), c[0], op(c[1])); });
    var buche = "", bordi = "";   // le piccole buche lasciate dalle bocce cadute: l'ombra dentro e il bordino chiaro
    for (i = 0; i < 6; i++) { var bx = 6 + r() * 88, by = T0 + 9 + r() * (T1 - T0 - 18), br = 1.6 + r() * 1.2; buche += "M" + q(bx - br, by) + " a" + f2(br) + "," + f2(br * .8) + " 0 0,1 " + f2(2 * br) + ",0"; bordi += "M" + q(bx - br, by + .4) + " a" + f2(br) + "," + f2(br * .8) + " 0 0,0 " + f2(2 * br) + ",0"; }
    s += tratto(buche, "#6e5330", .8, op(.4)) + tratto(bordi, "#fff4dc", .6, op(.5));
    var SAS = ["#d9d2c3", "#bfb3a0", "#ebe3d3", "#a89a86", "#d3c3a6"];   // i sassolini
    for (i = 0; i < 15; i++) {
      var x = r() * 100, yy = T0 + 4 + r() * (T1 - T0 - 8), rx = .7 + r() * 1.1, ry = rx * (.6 + r() * .3), an = r() * 180, c = SAS[Math.floor(r() * SAS.length)];
      [0, 100, -100].forEach(function (dx) { if (x + dx > -3 && x + dx < 103) s += sassolino(x + dx, yy, rx, ry, an, c); });
    }
    return s + sponda(true) + sponda(false);
  }
  def("campo_bocce", { tipo: "terra", nome: "Campo da bocce", w: 100, h: 100 }, function () { return campo(); });

  // =========================================================
  //  BOCCE IN PARTITA: lo stesso pezzo di campo, con le bocce rosse e verdi strette attorno al pallino bianco
  //  (lisce e rigate, per distinguere i due giocatori della coppia), le scie lasciate rotolando e i segni dove sono cadute
  // =========================================================
  function boccia(x, y, R, col, rigata) {
    var s = cer(x, y, R * 1.55, rad("ob", [[0, "#3a2410", .38], [.6, "#3a2410", .14], [1, "#3a2410", 0]], .5, .5, .5));   // l'ombra tutto intorno (il sole è alto)
    s += cer(x, y, R, rad("bc" + col.slice(1), [[0, chiaro(col, .62)], [.28, chiaro(col, .16)], [.7, col], [1, scuro(col, .52)]], .4, .38, .68), bordo(L, .6));
    if (rigata) s += tratto("M" + q(x - R * .8, y - R * .12) + " Q" + q(x, y + R * .62) + " " + q(x + R * .8, y - R * .12) + " M" + q(x - R * .66, y - R * .46) + " Q" + q(x, y + R * .2) + " " + q(x + R * .66, y - R * .46), scuro(col, .55), .38, op(.7));
    return s + ell(x - R * .28, y - R * .32, R * .36, R * .24, "#ffffff", op(.85)) + cer(x - R * .5, y - R * .5, R * .1, "#ffffff");
  }
  function scia(x, y, R, lung) {   // la scia nella terra (la boccia è arrivata da sinistra): sfuma all'indietro
    var x0 = x - lung;
    return pth("M" + q(x0, y - R * .2) + " L" + q(x - R * .5, y - R * .72) + " L" + q(x - R * .5, y + R * .72) + " L" + q(x0, y + R * .2) + " Z", lin("sc", [[0, "#7a5c34", 0], [1, "#7a5c34", .2]], x0, 0, x, 0, true)) +
      tratto("M" + q(x0 + lung * .3, y - R * .62) + " L" + q(x - R * .6, y - R * .82), "#fff6e0", .45, op(.4)) + tratto("M" + q(x0 + lung * .3, y + R * .62) + " L" + q(x - R * .6, y + R * .82), "#fff6e0", .45, op(.4));
  }
  def("bocce_partita", { tipo: "terra", nome: "Bocce in partita", w: 100, h: 100 }, function () {
    var R = 7, ROSSA = "#d8322c", VERDE_B = "#2e9a4c", s = campo();   // (un po' più grandi del vero: si devono vedere da lontano)
    var BB = [[22, 45, ROSSA, 0], [52, 32, VERDE_B, 1], [46, 57, ROSSA, 1], [66, 42, VERDE_B, 0], [73, 64, ROSSA, 0], [85, 31, VERDE_B, 1]];
    BB.forEach(function (b) { s += scia(b[0], b[1], R, b[0] > 60 ? 22 : 16); });
    s += ell(57.5, 48.5, 3.8, 2.6, "#8a6a3e", op(.16)) + scia(57, 48.5, 3.1, 10);   // dove è caduto il pallino
    BB.forEach(function (b) { s += boccia(b[0], b[1], R, b[2], b[3]); });
    return s + boccia(57, 48.5, 3.1, "#f6f1e2", 0);
  });

  // =========================================================
  //  PERGOLA (sospesa: in alto, sotto si cammina): i pali di castagno (si vedono in alto e sfumano scendendo),
  //  le due travi lunghe, i sette travicelli e i fili di ferro; sopra la vite fitta con le foglie a cinque lobi,
  //  qualche foglia che ingiallisce, i grappoli neri (e qualcuno di uva bianca) che pendono dai bordi e dai buchi tra le foglie,
  //  il tronco nodoso che sale da un palo; sotto i bordi davanti il filo delle lucine colorate (di notte accese)
  // =========================================================
  var FOGLIA_VITE = (function () {   // la foglia della vite: cinque lobi dentellati, il seno del picciolo in basso; centrata, la punta in su
    var pts = [], v = "M0,.4 L0,.98 ", i;
    function g(t, m, w) { var d = (t - m) / w; return Math.exp(-d * d); }
    function R(t) { var at = Math.abs(t), k = (at / 9.5) % 1; return .5 + .5 * g(at, 0, 17) + .42 * g(at, 50, 15) + .27 * g(at, 103, 16) + .08 * g(at, 145, 12) + .065 * (k < .72 ? k / .72 : (1 - k) / .28); }
    for (i = 0; i <= 120; i++) { var t = -160 + 320 * i / 120, a = t * Math.PI / 180, r = R(t); pts.push(f2(Math.sin(a) * r) + "," + f2(-Math.cos(a) * r)); }
    [0, 50, -50, 103, -103].forEach(function (t) { var a = t * Math.PI / 180, r = R(t) * .84, x = Math.sin(a) * r, y = -Math.cos(a) * r; v += "M0,.4 Q" + f2(x * .42) + "," + f2(.4 + (y - .4) * .5) + " " + f2(x) + "," + f2(y) + " "; });
    return { d: "M0,.4 L" + pts.join(" L") + " Z", v: v };
  })();
  var VERDI = [   // le foglie della vite: [chiaro, scuro, nervature]
    ["#2f5d25", "#1c3b16", "#163010"],   // sotto, in ombra
    ["#4f8b30", "#2f6121", "#224a16"],
    ["#79b23e", "#4b8a2a", "#376a1e"],
    ["#a7cf57", "#6ca237", "#4c7c25"],   // in cima, al sole
    ["#dcc24e", "#a7842a", "#76591a"]    // qualche foglia che ingiallisce
  ];
  function d1(v) { return Math.round(v * 10) / 10; }
  function matrice(x, y, sq, ang, sx, sy) {   // = translate(x y) scale(1 sq) rotate(ang) scale(sx sy), scritto corto
    var c = Math.cos(ang * Math.PI / 180), s = Math.sin(ang * Math.PI / 180);
    return "matrix(" + [c * sx, sq * s * sx, -s * sy, sq * c * sy].map(function (v) { return Math.round(v * 100) / 100; }).join(" ") + " " + d1(x) + " " + d1(y) + ")";
  }
  function fogliaVite(x, y, sc, sq, ang, cl, flip) {   // (una foglia per colore: il disegno sta una volta sola nelle definizioni)
    var V = VERDI[cl];
    simbolo("fv" + cl, "<path d='" + FOGLIA_VITE.d + "' fill='" + lin("fg" + cl, [[0, V[0]], [1, V[1]]], 0, 0, 1, 1) + "' stroke='" + L + "' stroke-width='.08' stroke-linejoin='round'/><path d='" + FOGLIA_VITE.v + "' fill='none' stroke='" + V[2] + "' stroke-width='.07' stroke-linecap='round' opacity='.85'/>");
    return usa("fv" + cl, matrice(x, y, sq, ang, flip ? -sc : sc, sc));
  }
  function grappolo(x, y, k, seme, bianca) {   // un grappolo che pende da (x, y): il raspo, gli acini a cono
    var r = rnd(seme), s = "", ac = [], righe = [4, 5, 5, 4, 4, 3, 3, 2, 1], i, j;
    for (i = 0; i < righe.length; i++) {
      var n = righe[i], w = (n - 1) * 1.6 * k;
      for (j = 0; j < n; j++) ac.push([x - w / 2 + j * 1.6 * k + (i % 2 ? .45 : -.2) * k + (r() - .5) * .7 * k, y + 2.6 * k + i * 2.05 * k + (r() - .5) * .6 * k, (1.25 + r() * .3) * k]);
    }
    var fa = bianca ? rad("acb", [[0, "#fffbd2"], [.3, "#e5d47c"], [.75, "#b49b36"], [1, "#6f5c16"]], .36, .3, .75) : rad("acn", [[0, "#bba6de"], [.25, "#6d4b9a"], [.7, "#3a1d5a"], [1, "#1c0a2c"]], .36, .3, .75);
    s += tratto("M" + q(x, y) + " Q" + q(x + 1.3 * k, y + 1.4 * k) + " " + q(x + .2 * k, y + 3 * k), "#5f4a22", .9 * k);
    var g = "", lu = "";
    ac.forEach(function (a, n) { g += "<circle cx='" + f1(a[0]) + "' cy='" + f1(a[1]) + "' r='" + f2(a[2]) + "'/>"; if (n % 3 === 0) lu += "M" + q(a[0] - a[2] * .57, a[1] - a[2] * .38) + "a" + f2(a[2] * .22) + "," + f2(a[2] * .22) + " 0 1,0 " + f2(a[2] * .44) + ",0a" + f2(a[2] * .22) + "," + f2(a[2] * .22) + " 0 1,0 " + f2(-a[2] * .44) + ",0"; });
    return s + "<g fill='" + fa + "' stroke='" + (bianca ? "#5a4a12" : "#170722") + "' stroke-width='" + f2(.3 * k) + "'>" + g + "</g>" + pth(lu, "#ffffff", op(bianca ? .75 : .5));   // gli acini e i riflessi
  }
  var LUCI_COL = ["#ff5544", "#ffd23a", "#4fc46a", "#4f8ff2", "#ff9a2a"];
  function lampadina(x, y, c) {   // la lampadina a goccia col portalampada nero
    var s = rett(x - .75, y - 1.5, 1.5, 1.5, .3, "#2a2321");
    if (NOTTE) return cer(x, y + 1.5, 11, rad("la" + c.slice(1), [[0, chiaro(c, .45), .95], [.3, c, .42], [1, c, 0]], .5, .5, .5)) + s + ell(x, y + 1.5, 2, 2.4, rad("ln" + c.slice(1), [[0, "#ffffff"], [.5, chiaro(c, .7)], [1, chiaro(c, .2)]], .45, .4, .75));
    return s + ell(x, y + 1.5, 1.42, 1.78, rad("lg" + c.slice(1), [[0, chiaro(c, .72)], [.55, c], [1, scuro(c, .35)]], .38, .32, .8), bordo(L, .35)) + cer(x - .45, y + .9, .38, "#ffffff", op(.9));
  }
  function filoLucine(pp, pancia, ogni, k0) {   // il filo appeso ai punti pp (sullo schermo) con la pancia in mezzo; una lampadina ogni "ogni"
    var s = "", lamp = "", k = k0 || 0, i, j;
    for (i = 0; i < pp.length - 1; i++) {
      var A = pp[i], B = pp[i + 1], C = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2 + pancia * 2];
      s += tratto("M" + q(A) + " Q" + q(C) + " " + q(B), "#241c1a", .7);
      var lun = Math.sqrt((B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1])), n = Math.max(1, Math.round(lun / ogni));
      for (j = 0; j < n; j++) { var t = (j + .5) / n, x = (1 - t) * (1 - t) * A[0] + 2 * t * (1 - t) * C[0] + t * t * B[0], y = (1 - t) * (1 - t) * A[1] + 2 * t * (1 - t) * C[1] + t * t * B[1]; lamp += lampadina(x, y + .3, LUCI_COL[k++ % LUCI_COL.length]); }
    }
    pp.forEach(function (a) { s += cer(a[0], a[1], .75, "#3a3434"); });   // i gancetti
    return s + lamp;
  }
  def("pergola", { tipo: "sospeso", nome: "Pergola con la vite", fp: [3, 2], box: [-143, -290, 140, -50], luce: [.2, 1, 184, 165, "#ffd98a"] }, function () {
    var r = rnd(1958), s = "", i, PA = 1.36, PB = .86, Z0 = 191, Z1 = 200, ZR = 207, W = .045, WR = .03, col = LEGNO_P, RA = [];
    for (i = 0; i < 7; i++) RA.push(-PA + i * PA / 3);
    // i pali: pieni in alto, poi sfumano (sotto si cammina e si vede chi passa)
    function palo(a, b, vite) {
      var c = P(a, b, 0), gid = p + "sg" + (++nC), mid = p + "sm" + nC, x0 = c[0] - 30, y0 = c[1] - Z1 - 6, hh = Z1 - 96;
      DEFS.push("<linearGradient id='" + gid + "' gradientUnits='userSpaceOnUse' x1='0' y1='" + f1(c[1] - 162) + "' x2='0' y2='" + f1(c[1] - 108) + "'><stop offset='0' stop-color='#fff'/><stop offset='1' stop-color='#000'/></linearGradient>");
      DEFS.push("<mask id='" + mid + "' maskUnits='userSpaceOnUse' x='" + f1(x0) + "' y='" + f1(y0) + "' width='60' height='" + f1(hh) + "'><rect x='" + f1(x0) + "' y='" + f1(y0) + "' width='60' height='" + f1(hh) + "' fill='url(#" + gid + ")'/></mask>");
      var o = blocco(a - .05, a + .05, b - .05, b + .05, 104, Z0, col, null, 1.3);
      o += tratto(linea(P(a - .05, b + .05, Z0 - 6), P(a - .05, b + .05, 112)), "#fff1dc", .6, op(.35));
      if (vite) {   // il tronco della vite, nodoso, che sale girando attorno al palo
        var tr = [P(a - .03, b + .07, 104), P(a + .06, b + .06, 122), P(a - .05, b + .075, 140), P(a + .04, b + .07, 156), P(a - .04, b + .07, 172), P(a + .02, b + .065, 186), P(a - .08, b + .04, Z0 + 3)];
        var dT = liscio(tr);
        o += tratto(dT, "#2a1d14", 5.2) + tratto(dT, "#6c5240", 3.8) + tratto(dT, "#a88a6c", 1.1, "transform='translate(-.8 -.3)' opacity='.7'") + tratto(dT, "#3a2a1e", .5, "transform='translate(.9 .2)' stroke-dasharray='2 3' opacity='.7'");
        [[1, 0], [3, 1], [5, 0]].forEach(function (k) { var n = tr[k[0]]; o += ell(n[0] + (k[1] ? 1.4 : -1.2), n[1], 1.7, 1.3, "#5a4232", bordo("#2a1d14", .5)); });   // i nodi
      }
      return "<g mask='url(#" + mid + ")'>" + o + "</g>";
    }
    s += palo(-PA, -PB) + palo(PA, -PB) + palo(-PA, PB) + palo(PA, PB, true);
    // le due travi lunghe (sui pali) e i travicelli di traverso (sulle travi)
    s += blocco(-1.54, 1.54, -PB - W, -PB + W, Z0, Z1, col, null, 1.3) + blocco(-1.54, 1.54, PB - W, PB + W, Z0, Z1, col, null, 1.3);
    RA.forEach(function (a) { s += blocco(a - WR, a + WR, -1.07, 1.07, Z1, ZR, col, null, 1.1); var e = P(a - WR, 1.07, ZR - 1.5); s += tratto(linea(e, P(a + WR, 1.07, ZR - 1.5)), "#fff1dc", .5, op(.4)); });
    [-.43, 0, .43].forEach(function (b) { s += tratto(linea(P(-1.5, b, ZR + .4), P(1.5, b, ZR + .4)), "#6d6a66", .55, op(.85)); });   // i fili di ferro per la vite
    // la vite: le foglie lungo i travicelli e in mezzo (con qualche buco da cui si vede sotto), quelle che pendono dai bordi davanti
    var BUCHI = [[-.62, -.32, .17], [.52, .36, .14], [-.12, .64, .11], [.98, -.5, .14], [-1.02, .46, .12], [.1, -.62, .1]], FO = [];
    function buco(a, b) { for (var k = 0; k < BUCHI.length; k++) { var h = BUCHI[k], da = a - h[0], db = b - h[1]; if (da * da + db * db < h[2] * h[2]) return true; } return false; }
    function tinta5(z, ombra) { var x = r(); if (x < .025) return 4; if (ombra) return x < .4 ? 0 : (x < .85 ? 1 : 2); return z > ZR + 6.5 ? (x < .5 ? 3 : 2) : (x < .3 ? 1 : (x < .75 ? 2 : 3)); }
    RA.forEach(function (a0) {
      for (var b = -1.04; b <= 1.05; b += .085 + r() * .05) {
        var a = a0 + (r() < .5 ? -1 : 1) * (.03 + r() * .15), bb = b + (r() - .5) * .05, z = ZR + 1.5 + r() * 8;
        if (buco(a, bb) && r() < .9) continue;
        FO.push({ a: a, b: bb, z: z, sc: 7.2 + r() * 2.8, ang: r() * 360, cl: tinta5(z), f: r() < .5 });
      }
    });
    for (i = 0; i < 170; i++) { var a1 = -1.52 + r() * 3.04, b1 = -1.05 + r() * 2.1, z1 = ZR + 1 + r() * 9; if (buco(a1, b1)) continue; FO.push({ a: a1, b: b1, z: z1, sc: 7 + r() * 3, ang: r() * 360, cl: tinta5(z1), f: r() < .5 }); }
    var a2, b2;
    for (a2 = -1.55; a2 <= 1.5; a2 += .13 + r() * .1) FO.push({ a: a2, b: -1.1 - r() * .05, z: ZR + 2 + r() * 6, sc: 6.5 + r() * 2.5, ang: r() * 360, cl: tinta5(ZR + 7), f: r() < .5 });   // quelle che sporgono dietro e a sinistra
    for (b2 = -1.05; b2 <= 1.05; b2 += .13 + r() * .1) FO.push({ a: -1.58 - r() * .05, b: b2, z: ZR + 2 + r() * 6, sc: 6.5 + r() * 2.5, ang: r() * 360, cl: tinta5(ZR + 7), f: r() < .5 });
    for (a2 = -1.52; a2 <= 1.5; a2 += .12 + r() * .1) FO.push({ a: a2, b: 1.06 + r() * .05, z: Z1 + 3 - r() * 13, sc: 6 + r() * 2.2, ang: 180 + (r() - .5) * 80, cl: tinta5(0, true), f: r() < .5, giu: true });
    for (b2 = -1.04; b2 <= 1.04; b2 += .13 + r() * .1) FO.push({ a: 1.53 + r() * .05, b: b2, z: Z1 + 3 - r() * 13, sc: 6 + r() * 2.2, ang: 180 + (r() - .5) * 80, cl: tinta5(0, true), f: r() < .5, giu: true });
    // i grappoli: sotto i bordi davanti e dentro i buchi
    [[-1.14, PB + .06, 0, 1], [-.6, PB + .07, 1, 1.05], [.08, PB + .06, 0, .95], [.6, PB + .07, 0, 1.1], [1.13, PB + .06, 1, 1], [1.43, .42, 0, 1], [1.43, -.36, 0, .95], [-.54, -.38, 0, .85], [.46, .3, 1, .85], [-1.0, .4, 0, .8], [.94, -.56, 0, .85]].forEach(function (g, k) {
      FO.push({ a: g[0], b: g[1], z: k < 7 ? Z0 + 1 : ZR - 2, uva: g, k: k });
    });
    FO.sort(function (m, n) { return (m.a + m.b + (m.z - ZR) / 40) - (n.a + n.b + (n.z - ZR) / 40); });
    var sotto = "", foglie = "";
    FO.forEach(function (f) {
      var c = P(f.a, f.b, f.z);
      if (f.uva) { foglie += grappolo(c[0], c[1], f.uva[3] * .95, 300 + f.k * 17, f.uva[2]); return; }
      if (!f.giu) { var rx = d1(f.sc * .78), ry = d1(f.sc * .44); sotto += "M" + d1(c[0] - rx) + "," + d1(c[1] + 2.6) + "a" + rx + "," + ry + " 0 1,0 " + d1(2 * rx) + ",0a" + rx + "," + ry + " 0 1,0 " + d1(-2 * rx) + ",0"; }   // il verde scuro sotto le foglie
      foglie += f.giu ? fogliaVite(c[0], c[1] + f.sc * .55, f.sc, .92, f.ang, f.cl, f.f) : fogliaVite(c[0], c[1], f.sc, .62, f.ang, f.cl, f.f);
    });
    s += pth(sotto, "#1b3313", op(.9)) + foglie;
    // qualche viticcio arricciato
    [[-1.3, .95], [.35, 1.02], [1.5, .1], [-.2, -.9]].forEach(function (v) { var c = P(v[0], v[1], ZR + 4); s += tratto("M" + q(c) + " c2,-3 5,-2 4,1 c-1,2 -3,1 -2,-1", "#6f8d2c", .6); });
    // le lucine sotto i bordi davanti: lungo la trave lunga e poi sotto l'ultimo travicello
    var pp = RA.map(function (a) { return P(a, PB + W + .005, Z0 - .5); });
    pp.push(P(PA + WR + .005, 0, Z1 - .5), P(PA + WR + .005, -PB, Z1 - .5));
    s += filoLucine(pp, 4.2, 6.2, 0);
    return s;
  });

  // =========================================================
  //  TAVOLO DA OSTERIA all'aperto: le gambe squadrate di castagno col traverso basso ad H, la tovaglia a quadri
  //  rossi e bianchi che cade sui lati con le pieghe e l'orlo cucito; sopra il fiasco impagliato, il tagliere
  //  con la pagnotta e due fette, il piatto col salame e il formaggio, quattro bicchieri di rosso (uno per posto)
  // =========================================================
  function tovagliaQ(HA, HB, Z, cad) {   // la tovaglia (nella vista: è uguale girata di mezzo giro)
    var Q = .095 * 61, X0 = HA * 61, Y0 = HB * 61, s = "", i;
    var pat = motivo("vichy", 2 * Q, 2 * Q, rett(0, 0, 2 * Q, 2 * Q, 0, "#fbf7ee") + rett(0, 0, Q, 2 * Q, 0, "#d22f2b", op(.62)) + rett(0, 0, 2 * Q, Q, 0, "#d22f2b", op(.62)) + rett(0, 0, Q, Q, 0, "#a81a1a", op(.2)));
    function lato(o, dir, Lf, fase, buio) {   // un lato che cade (piatto: x lungo il bordo, y in giù), piegato sul suo piano
      var np = Math.max(2, Math.round(Lf / 16));
      function caduta(x) { var e = Math.max(0, 1 - x / 12), f = Math.max(0, 1 - (Lf - x) / 12); return cad + 1.1 * Math.sin(x / Lf * Math.PI * np * 2 + fase) + 7.5 * (e * e + f * f); }
      var d = "M0,0 H" + f1(Lf), giu = "", orlo = "", n = 44;
      for (i = n; i >= 0; i--) d += " L" + q(Lf * i / n, caduta(Lf * i / n));
      for (i = 0; i <= n; i++) { var x2 = Lf * i / n; giu += (i ? " L" : "M") + q(x2, caduta(x2)); orlo += (i ? " L" : "M") + q(x2, caduta(x2) - 1.5); }
      var st = [], k, ns = np * 2;
      for (k = 0; k <= ns; k++) st.push([k / ns, k % 2 ? "#000000" : "#ffffff", k % 2 ? .14 : .13]);   // le pieghe morbide
      var c = rett(-2, -2, Lf + 4, cad + 22, 0, pat) + rett(-1, 0, Lf + 2, cad + 22, 0, lin("pg", st, 0, 0, Lf, 0, true)) +
        rett(-1, 0, Lf + 2, 3, 0, lin("bt", [[0, "#000", .2], [1, "#000", 0]], 0, 0, 0, 1)) + (buio ? rett(-1, 0, Lf + 2, cad + 22, 0, "#000", op(buio)) : "") +
        tratto(orlo, "#ffffff", .4, "stroke-dasharray='1 .9' opacity='.55'");
      return faccia(o, dir, dentro(d + " Z", c) + tratto(giu, L, 1.2) + tratto("M0,.4 H" + f1(Lf), "#ffffff", .7, op(.5)));
    }
    s += lato(Puv(-HA, HB, Z), 1, 2 * HA * 61, 0, 0) + lato(Puv(HA, HB, Z), -1, 2 * HB * 61, 1.3, .17);
    var sp = pRett(-HA, HA, -HB, HB, .015, 2).map(function (x) { return Puv(x[0], x[1], Z); }), d = chiuso(sp), b = limiti(sp);
    var c = suZ(Z, rett(-X0 - 3, -Y0 - 3, 2 * X0 + 6, 2 * Y0 + 6, 0, pat) +
      "<path d='M" + q(-X0, 0) + " H" + f1(X0) + " M" + q(0, -Y0) + " V" + f1(Y0) + "' stroke='#000' stroke-width='.9' opacity='.08'/><path d='M" + q(-X0, .7) + " H" + f1(X0) + " M" + q(.7, -Y0) + " V" + f1(Y0) + "' stroke='#ffffff' stroke-width='.7' opacity='.35'/>");
    c += ell(b[0] + (b[2] - b[0]) * .4, b[1] + (b[3] - b[1]) * .38, (b[2] - b[0]) * .34, (b[3] - b[1]) * .3, nuovaR([[0, "#ffffff", .2], [1, "#ffffff", 0]], .5, .5, .5));
    c += pth(d, nuova([[0, "#000", 0], [.6, "#000", 0], [1, "#000", .1]], b[0], b[1], b[2], b[3], true));
    s += pth(d, "#fbfaf3") + dentro(d, c);
    var A = Puv(-HA, -HB, Z), B = Puv(HA, -HB, Z), Cc = Puv(HA, HB, Z), D = Puv(-HA, HB, Z);
    return s + tratto("M" + q(D) + " L" + q(A) + " L" + q(B), L, 1.4) + tratto("M" + q(D[0] + 1, D[1] + .4) + " L" + q(Cc[0], Cc[1] - .3) + " L" + q(B[0] - 1, B[1] + .4), "#ffffff", .9, op(.7));
  }
  function fiasco(a, b, z) {   // il fiasco di Chianti: la pancia vestita di paglia intrecciata, il collo lungo di vetro verde, la capsula rossa
    var c = P(a, b, 0), s = "", j, K = 1.22;   // un po' più grande del vero, come tutte le cose sui tavoli
    s += ell(c[0] + 4.4, c[1] - z + 1.8, 11, 5.2, "#000", op(.22));
    var pan = [[0, .058], [1.6, .082], [4.2, .098], [7.5, .101], [10.5, .092], [12.8, .072], [14.4, .05], [15.4, .036]].map(function (x) { return [z + x[0] * K, x[1] * K]; });
    s += tornito(a, b, pan, [[0, "#f8e5ab"], [.28, "#e7c674"], [.65, "#c09345"], [1, "#7d5622"]], 1.1);
    var fili = "", scuri = "";   // la paglia: i fili in verticale (la metà davanti) e i due giri che la legano
    for (j = 1; j < 20; j++) {
      var t = j / 20 * Math.PI, d = "";
      pan.forEach(function (x, k) { d += (k ? " L" : "M") + q(c[0] + 70.71 * x[1] * Math.cos(t), c[1] - x[0] + 35.36 * x[1] * Math.sin(t)); });
      if (j % 2) fili += d + " "; else scuri += d + " ";
    }
    s += tratto(scuri, "#8a6228", .55, op(.55)) + tratto(fili, "#fff3c8", .45, op(.5));
    [[2.4, .086], [13.2, .068]].forEach(function (g) {
      var d = "", k, zz = z + g[0] * K, rr = g[1] * K;
      for (k = 0; k <= 16; k++) { var t = k / 16 * Math.PI; d += (k ? " L" : "M") + q(c[0] + 70.71 * rr * Math.cos(t), c[1] - zz + 35.36 * rr * Math.sin(t)); }
      s += tratto(d, "#6e4a1c", 2.5) + tratto(d, "#d9ad5c", 1.6) + tratto(d, "#fff0c0", .5, "transform='translate(0 -.45)' opacity='.8'");
    });
    s += tornito(a, b, [[14.8, .034], [17.5, .025], [26, .021], [27, .023]].map(function (x) { return [z + x[0] * K, x[1] * K]; }), [[0, "#d6efc8", .95], [.35, "#5ea35b", .9], [1, "#1d4a22", .95]], .8);
    s += tornito(a, b, [[25.6, .025], [30, .025], [30.8, .021], [31.2, .012]].map(function (x) { return [z + x[0] * K, x[1] * K]; }), [[0, "#ff8c80"], [.4, "#c81f2b"], [1, "#650812"]], .7);
    return s + tratto(linea([c[0] - .9, c[1] - z - 25 * K], [c[0] - 1.1, c[1] - z - 17.5 * K]), "#ffffff", .8, op(.8));
  }
  function tagliere(a, b, z) {   // il tagliere di legno con la pagnotta (la croce incisa e la farina), due fette e il coltello
    var s = "", c = P(a, b, 0), k;
    s += ell(c[0] + 3.4, c[1] - z + 1.6, 19, 7.6, "#000", op(.17));
    s += blocco(a - .2, a + .2, b - .12, b + .12, z, z + 1.8, "#c99257", null, .9);
    var zt = z + 1.8;
    s += suZ(zt, gruppo("translate(" + f2(a * 61) + " " + f2(b * 61) + ")",   // sul tagliere: le venature, due fette e il coltello
      "<path d='M-11.5,-5 H11.5 M-11.5,-1.6 H11.5 M-11.5,2 H11.5 M-11.5,5.2 H11.5' stroke='#8a5a2c' stroke-width='.35' opacity='.4'/>" +
      [[6.4, -2.4, 20], [8, 2.6, -12]].map(function (f) {
        return "<g transform='translate(" + f[0] + " " + f[1] + ") rotate(" + f[2] + ")'>" + ell(.5, .6, 4.6, 3.6, "#000", op(.18)) + ell(0, 0, 4.6, 3.6, "#a8642a", bordo(L, .45)) + ell(-.2, -.1, 3.7, 2.8, "#f6e3b8") +
          cer(-1.1, -.7, .5, "#d9be8c") + cer(.9, .5, .4, "#d9be8c") + cer(-.2, 1.1, .35, "#d9be8c") + cer(1.6, -.9, .35, "#d9be8c") + cer(-2, .5, .3, "#d9be8c") + "</g>";
      }).join("") +
      "<g transform='translate(-2.4 5.6) rotate(-6)'>" + rett(-1, -.8, 9, 1.6, .7, lin("lama", [[0, "#ffffff"], [.5, "#c9d0d6"], [1, "#7d878f"]], 0, 0, 0, 1), bordo(L, .35)) + rett(-7.2, -1, 6.2, 2, .9, "#5a3420", bordo(L, .4)) + cer(-5.8, 0, .32, "#e2c27a") + cer(-2.9, 0, .32, "#e2c27a") + "</g>"));
    // la pagnotta di pane casereccio: bassa e larga, la crosta dorata, la croce aperta, la farina
    var pa = a - .07, pb = b - .012;
    s += tornito(pa, pb, [[zt, .1], [zt + 1.4, .11], [zt + 3.6, .106], [zt + 5.6, .09], [zt + 7.1, .064], [zt + 7.9, .034], [zt + 8.2, .006]], [[0, "#f2cd8a"], [.3, "#d29848"], [.72, "#97561f"], [1, "#5b2f10"]], .95);
    var cp = P(pa, pb, 0), cx = cp[0], cy = cp[1] - zt - 7.1, r = rnd(55);
    [[-1, 1], [1, 1]].forEach(function (v) {   // la croce: due tagli che seguono la cupola
      var d = "M" + q(cx - 4.6 * v[0], cy - 2.2) + " Q" + q(cx, cy - 1.4) + " " + q(cx + 4.6 * v[0], cy + 2.4);
      s += tratto(d, "#5e2e0e", 2.2, op(.55)) + tratto(d, "#f4d79c", 1.2) + tratto(d, "#fff2d0", .4, "transform='translate(0 -.35)'");
    });
    for (k = 0; k < 18; k++) s += cer(cx - 6 + r() * 11, cy - 2.4 + r() * 5.8, .25 + r() * .35, "#fffaf0", op(.45 + r() * .4));   // la farina
    for (k = 0; k < 10; k++) s += cer(cx - 7 + r() * 13, cy + 1 + r() * 5, .3, "#5e2e0e", op(.35));   // la crosta che scrocchia
    return s + ell(cx - 3.2, cy - .6, 2.4, 1, "#ffffff", op(.25));
  }
  function piattoSalame(a, b, z) {   // il piatto bianco col salame a fette (il grasso a puntini) e i pezzi di formaggio
    var o = anello(a, b, z + .5, .125), s = ell(o.x + 2.2, o.y + 1.1, o.rx + .8, o.ry + .7, "#000", op(.18)), r = rnd(91), k;
    s += ell(o.x, o.y, o.rx, o.ry, "#f4f1e8", bordo(L, .8)) + ell(o.x + .3, o.y + .4, o.rx * .7, o.ry * .66, "#e2ddcf") + ell(o.x - o.rx * .45, o.y - o.ry * .4, o.rx * .3, o.ry * .2, "#ffffff", op(.7));
    var fette = "";
    [[-3, -1.6], [.7, -3], [3.3, -.5], [-.7, 1.5], [-3.7, 1.8]].forEach(function (f) {
      fette += "<g transform='translate(" + f[0] + " " + f[1] + ")'>" + cer(.35, .4, 2.45, "#000", op(.2)) + cer(0, 0, 2.45, "#b3303d", bordo("#5a1018", .4));
      for (k = 0; k < 7; k++) fette += cer(-1.5 + r() * 3, -1.5 + r() * 3, .28 + r() * .22, "#f6dfe0");
      fette += cer(0, 0, 2.45, "none", "stroke='#e8c9a8' stroke-width='.4' opacity='.6'") + "</g>";
    });
    fette += "<path d='M2.8,1.8 L6.7,3 L3.5,5.3 Z' fill='#f3d27a' stroke='#8a6a1c' stroke-width='.4' stroke-linejoin='round'/><path d='M2.8,1.8 L6.7,3' stroke='#c9a04a' stroke-width='.9'/>" +
      "<path d='M-1.8,3.4 L1.9,3.8 L.2,6.4 Z' fill='#f6dc8c' stroke='#8a6a1c' stroke-width='.4' stroke-linejoin='round'/>";
    return s + suZ(z + 1, gruppo("translate(" + f2(a * 61) + " " + f2(b * 61) + ")", fette));
  }
  def("tavolo_esterno", { nome: "Tavolo da osteria", fp: [2, 1], box: [-78, -96, 86, 44], dietro: true, piano: 48, posti: [[0, -1], [1, -1], [0, 1], [1, 1]] }, function () {
    var col = CASTAGNO, HA = .92, HB = .4, ZT = 47, ZS = 43.4, GA = .79, GB = .28, RS = .052, ZP = ZT + .6, g0 = G, s = "";
    G = 1;   // le gambe e la tovaglia sono uguali girate di mezzo giro: si disegnano sempre nello stesso verso
    s += ombraForma(pRett(-HA, HA, -HB, HB, 0), 1.1);
    function gamba(a, b) { return gambaQuadra(a, b, RS * .8, RS, 0, ZS, col); }
    s += gamba(-GA, -GB) + gamba(GA, -GB);
    s += blocco(-GA - .022, -GA + .022, -GB, GB, 8, 11.5, col, null, 1) + blocco(-GA, GA, -.024, .024, 9.5, 13, col, null, 1) + blocco(GA - .022, GA + .022, -GB, GB, 8, 11.5, col, null, 1);
    s += gamba(-GA, GB) + gamba(GA, GB);
    s += tovagliaQ(HA + .05, HB + .05, ZP, 10.5);
    G = g0;
    var cose = [];   // sopra: ognuno al suo posto, dal più lontano al più vicino
    cose.push([vicino(-.14, -.06), fiasco(-.14, -.06, ZP)]);
    cose.push([vicino(.34, .02), tagliere(.34, .02, ZP)]);
    cose.push([vicino(-.58, .02), piattoSalame(-.58, .02, ZP)]);
    [[-.5, .27, .7], [.5, .28, .45], [-.5, -.27, .55], [.52, -.26, .8]].forEach(function (g) { cose.push([vicino(g[0], g[1]), bicchiere(g[0], g[1], ZP, g[2])]); });
    var mc = P(.12, .25, ZP);   // una macchia di vino sulla tovaglia
    s += ell(mc[0], mc[1], 3.6, 1.7, "none", "stroke='#8a1426' stroke-width='.6' opacity='.35'");
    return s + ordina(cose);
  });

  // =========================================================
  //  PANCA DI LEGNO da giardino: castagno chiaro a olio, cinque stecche nella seduta, lo schienale con due assi
  //  e la traversa curva in cima, i montanti col pomolo, i braccioli larghi, la gamba di mezzo (è lunga due metri)
  // =========================================================
  def("panca_legno", { nome: "Panca di legno", fp: [2, 1], box: [-71, -102, 79, 41], dietro: true, azione: "siedi", seduta: 28 }, function () {
    var col = LEGNO_PANCA, A = .86, BF = .14, BP = -.29, W = .034, ZS = 28, t = tinte(col);
    var s = ombraForma(pRett(-.92, .92, -.34, .2, .03, 3), 1);
    function trave(a0, a1, b0, b1, z0, z1, lw) { return blocco(a0, a1, b0, b1, z0, z1, col, null, lw || 1.1); }
    function arco(a0, a1, bA, bB, z0, z1, fr) {   // la traversa in cima allo schienale, curva verso l'alto in mezzo
      var n = 16, fa = [], top = [], i, bn = G > 0 ? bB : bA, bf = G > 0 ? bA : bB;
      function zt(a) { var k = (a - (a0 + a1) / 2) / ((a1 - a0) / 2); return z1 + fr * (1 - k * k); }
      for (i = 0; i <= n; i++) { var a = a0 + (a1 - a0) * i / n; fa.push(P(a, bn, zt(a))); top.push(P(a, bf, zt(a))); }
      return poly(fa.concat(top.slice().reverse()), t[0], bordo(L, .9)) + poly(fa.concat([P(a1, bn, z0), P(a0, bn, z0)]), t[1], bordo(L, 1.1)) + tratto(aperto(fa), "#fff3df", .6, op(.55));
    }
    function stecca(b0, b1) {   // un'asse della seduta con le venature e il filo di luce davanti
      var bm = (b0 + b1) / 2, bv = G > 0 ? b1 : b0;
      return trave(-A + W, A - W, b0, b1, 25, ZS, 1) + tratto(linea(P(-A + W + .03, bm - .012, ZS), P(A - W - .03, bm + .006, ZS)), scuro(col, .45), .4, op(.4)) +
        tratto(linea(P(-A + W + .02, bv - G * .006, ZS), P(A - W - .02, bv - G * .006, ZS)), "#fff1d8", .55, op(.55));
    }
    function pomolo(a) { return tornito(a, BP, [[63, .03], [64.4, .037], [66.4, .031], [67.8, .016], [68.3, 0]], legno(col), .8); }
    function bullone(a, b, z) { var c = P(a, b, z); return cer(c[0], c[1], .9, "#2d2420") + cer(c[0] - .25, c[1] - .25, .35, "#cfc4b4", op(.8)); }
    var montanti = trave(-A - W, -A + W, BP - W, BP + W, 0, 63) + trave(A - W, A + W, BP - W, BP + W, 0, 63) + pomolo(-A) + pomolo(A);
    var bf = BP + G * .017, vena = "";   // le venature sulle assi dello schienale (sulla faccia che si vede)
    [[34, 39.5], [43.5, 49]].forEach(function (z, j) { vena += tratto(linea(P(-A + W + .04, bf, z[0] + 1.8), P(A - W - .05, bf, z[0] + 2.3 - j * .4)) + " " + linea(P(-A + W + .2, bf, z[0] + 3.7), P(A - W - .3, bf, z[0] + 3.4)), scuro(col, .42), .35, op(.4)); });
    vena += tratto(linea(P(-A + W + .1, bf - G * .004, 55.2), P(0, bf - G * .004, 58.6)) + " " + linea(P(0, bf - G * .004, 58.6), P(A - W - .1, bf - G * .004, 55.4)), scuro(col, .42), .35, op(.35));
    var schienale = trave(-A + W, A - W, BP - .016, BP + .016, 34, 39.5, 1) + trave(-A + W, A - W, BP - .016, BP + .016, 43.5, 49, 1) + arco(-A + W, A - W, BP - .02, BP + .02, 53, 58.5, 4) + vena;
    [-A, A].forEach(function (a) { var bv = BP + G * .04; [36.7, 46.2, 56].forEach(function (z) { schienale += bullone(a, bv, z); }); });
    var gambeDav = trave(-A - W, -A + W, BF - W, BF + W, 0, 41) + trave(A - W, A + W, BF - W, BF + W, 0, 41);
    var centro = trave(-W, W, BP - W, BP + W, 0, 23) + trave(-W, W, BF - W, BF + W, 0, 23);
    var telaio = trave(-A - .024, -A + .024, BP, BF, 20.5, 25) + trave(A - .024, A + .024, BP, BF, 20.5, 25) + trave(-A + W, A - W, BP - .018, BP + .018, 19.5, 25) + trave(-A + W, A - W, BF - .02, BF + .02, 19.5, 25);
    var SL = [[-.285, -.2], [-.19, -.105], [-.095, -.01], [0, .085], [.095, .175]], stecche = SL.map(function (b) { return stecca(b[0], b[1]); });
    var braccioli = "";
    [-A, A].forEach(function (a) { braccioli += trave(a - .045, a + .045, BP - .02, BF + .05, 41, 44.6) + tratto(linea(P(a - .012, BP + .01, 44.6), P(a - .006, BF + .03, 44.6)), scuro(col, .4), .35, op(.4)) + tratto(linea(P(a + G * .03, BP, 44.6), P(a + G * .03, BF + .04, 44.6)), "#fff1d8", .5, op(.5)); });
    if (G > 0) s += montanti + schienale + centro + telaio + stecche.join("") + gambeDav + braccioli;
    else s += gambeDav + centro + telaio + stecche.reverse().join("") + braccioli + schienale + montanti;
    return s;
  });

  // =========================================================
  //  VASO DI GERANI: il vaso di terracotta a campana (quello dell'Impruneta) col festone in rilievo e le rosette,
  //  l'orlo arrotolato e il sottovaso; dentro il geranio fitto: le foglie tonde e smerlate col cerchio scuro,
  //  i mazzetti di fiori rossi tondi come palline sui gambi
  // =========================================================
  var FOGLIA_GER = (function () {   // tonda e smerlata, il seno del picciolo in basso; il cerchio scuro e le nervature a ventaglio
    var pts = [], i, zona, v = "";
    for (i = 0; i <= 96; i++) { var t = -162 + 324 * i / 96, a = t * Math.PI / 180, k = (Math.abs(t) / 27) % 1, r = .88 + .12 * Math.sin(k * Math.PI); pts.push(f2(Math.sin(a) * r) + "," + f2(-Math.cos(a) * r)); }
    var z0 = -138 * Math.PI / 180, z1 = 138 * Math.PI / 180;
    zona = "M" + f2(Math.sin(z0) * .58) + "," + f2(-Math.cos(z0) * .58) + " A.58,.58 0 1,1 " + f2(Math.sin(z1) * .58) + "," + f2(-Math.cos(z1) * .58);
    [-135, -90, -45, 0, 45, 90, 135].forEach(function (t) { var a = t * Math.PI / 180; v += "M0,.42 L" + f2(Math.sin(a) * .8) + "," + f2(-Math.cos(a) * .8) + " "; });
    return { d: "M0,.45 L" + pts.join(" L") + " Z", z: zona, v: v };
  })();
  var VERDI_G = [["#5c9a3e", "#386e26"], ["#78b14f", "#4a8431"], ["#93c560", "#5c9a3a"], ["#46803a", "#285a1e"]];
  var FIORE = (function () { var d = "", i; for (i = 0; i < 5; i++) { var a = (i * 72 - 90) * Math.PI / 180, x = Math.cos(a) * .56, y = Math.sin(a) * .56; d += "M" + f2(x - .52) + "," + f2(y) + " a.52,.52 0 1,0 1.04,0 a.52,.52 0 1,0 -1.04,0 "; } return d; })();
  var ROSSI = ["#ff6b5d", "#e8232e", "#b0121e"];
  function ombrella(x, y, k, seme) {   // il mazzetto di fiori del geranio: tanti fiorellini a cinque petali, tondo come una pallina
    var r = rnd(seme), s = "", fl = [], i;
    for (i = 0; i < 13; i++) { var t = r() * 6.283, rr = Math.sqrt(r()) * 3.7 * k; fl.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr * .82 - (1 - rr / (3.7 * k)) * 1.3 * k]); }
    fl.sort(function (m, n) { return m[1] - n[1]; });
    s += cer(x + .4, y + .6, 3.9 * k, "#6e0a14", op(.35));   // l'ombra dentro il mazzetto
    fl.forEach(function (f) { var dd = (f[0] - x) + (f[1] - y), cl = dd < -1.4 * k ? 0 : (dd > 1.6 * k ? 2 : 1); s += usa("fi", "translate(" + f1(f[0]) + " " + f1(f[1]) + ") rotate(" + f1(r() * 72) + ") scale(" + f2(1.3 * k) + ")", "fill='" + ROSSI[cl] + "' stroke='#6e0a14' stroke-width='.1'"); });
    [[-3.4, 2.8], [3.6, 2.2]].forEach(function (b) { if (r() < .7) s += tratto("M" + q(x + b[0] * .6 * k, y + b[1] * .5 * k) + " L" + q(x + b[0] * k, y + b[1] * k), "#4d7f2b", .5) + ell(x + b[0] * k, y + b[1] * k + .6, .75 * k, 1.05 * k, "#9a1420", bordo("#5a0810", .3)); });   // i boccioli
    return s;
  }
  function festone(prof) {   // le ghirlande in rilievo sulla pancia del vaso e le rosette (la metà davanti)
    function raggio(z) { for (var i = 1; i < prof.length; i++) if (z <= prof[i][0]) { var a = prof[i - 1], b = prof[i]; return a[1] + (b[1] - a[1]) * (z - a[0]) / (b[0] - a[0]); } return prof[prof.length - 1][1]; }
    var c = P(0, 0, 0), s = "", i, j, n = 6, sc = scuro(COTTO, .42);
    function pt(t, z, dr) { var rr = raggio(z) + (dr || 0); return [c[0] + 70.71 * rr * Math.cos(t), c[1] - z + 35.36 * rr * Math.sin(t)]; }
    var anelli = "";
    [[31.2, .006], [17.5, .004]].forEach(function (g) { var d = ""; for (j = 0; j <= 24; j++) d += (j ? " L" : "M") + q(pt(j / 24 * Math.PI, g[0], g[1])); anelli += d + " "; });
    s += tratto(anelli, sc, 1.6, op(.5)) + tratto(anelli, "#f0a777", .7, "transform='translate(0 -.6)' opacity='.8'");
    for (i = 0; i < n; i++) {
      var t0 = i / n * Math.PI, t1 = (i + 1) / n * Math.PI, d = "";
      for (j = 0; j <= 12; j++) { var k = j / 12; d += (j ? " L" : "M") + q(pt(t0 + (t1 - t0) * k, 28.2 - 5.2 * Math.sin(Math.PI * k), .012)); }
      s += tratto(d, sc, 3.3, op(.5)) + tratto(d, "#d98a55", 2.2) + tratto(d, "#c66b3c", .5, "stroke-dasharray='.8 1.1'") + tratto(d, "#f8c096", .7, "transform='translate(-.3 -.65)' opacity='.75'");
    }
    for (i = 0; i <= n; i++) { var ro = pt(i / n * Math.PI, 28.6, .015); s += cer(ro[0] + .3, ro[1] + .4, 1.6, sc, op(.45)) + cer(ro[0], ro[1], 1.55, "#dd8f5a", bordo(sc, .45)) + cer(ro[0] - .45, ro[1] - .45, .55, "#ffd6b3"); }
    return s;
  }
  def("vaso_gerani", { nome: "Vaso di gerani", fp: [1, 1], box: [-33, -80, 32, 15] }, function () {
    var r = rnd(4242), s = ombraPianta(-.27, .27, -.27, .27, 1, .04), i;
    simbolo("fg", "<path d='" + FOGLIA_GER.d + "'/><path d='" + FOGLIA_GER.z + "' fill='none' stroke='#5a3f12' stroke-width='.17' opacity='.32'/><path d='" + FOGLIA_GER.v + "' fill='none' stroke='#2a5a1c' stroke-width='.05' opacity='.5'/>");
    simbolo("fi", "<path d='" + FIORE + "'/><circle r='.2' fill='#ffe3cf'/>");
    s += tornito(0, 0, [[0, .205], [2.6, .23], [3.4, .226]], COTTO_ST, 1.2);   // il sottovaso
    var prof = [[3, .148], [5.5, .156], [12, .17], [20, .188], [27, .204], [32, .213], [33.4, .232], [36, .24], [38.6, .236], [40, .224]];
    s += tornito(0, 0, prof, COTTO_ST, 1.6, [1, 6], .7);
    s += festone(prof);
    var o = anello(0, 0, 40, .232), t = anello(0, 0, 39.6, .196);
    s += ell(o.x, o.y, o.rx, o.ry, "#e59a68", bordo(L, 1.1)) + ell(t.x, t.y + .5, t.rx, t.ry, "#4a2f1c", bordo(scuro(COTTO, .5), .5));
    for (i = 0; i < 9; i++) s += cer(o.x - o.rx * .8 + r() * o.rx * 1.6, o.y + o.ry * (.75 + r() * .2), .3, "#fff3e6", op(.35));   // il calcare sull'orlo
    // la pianta: foglie (a cupola) e fiori, dal fondo al davanti
    var FG = [];
    for (i = 0; i < 78; i++) { var tt = r() * 6.283, rr = Math.pow(r(), .45) * .34, a = Math.cos(tt) * rr, b = Math.sin(tt) * rr; FG.push({ a: a, b: b, z: 38.5 + (1 - Math.pow(rr / .34, 2)) * 17 + r() * 4, sc: 4.6 + r() * 1.8, ang: (r() - .5) * 120 + (Math.atan2(b - a, a + b) * 57.3 + 90) * .4, cl: Math.floor(r() * 3), f: r() < .5 }); }
    for (i = 0; i < 11; i++) { var t2 = i / 10 * 6.283 + r() * .4, r2 = i === 10 ? .02 : .1 + r() * .15; FG.push({ a: Math.cos(t2) * r2, b: Math.sin(t2) * r2, z: 61 + r() * 7 + (i === 10 ? 6 : 0), fiore: true, k: .95 + r() * .22, seme: 600 + i * 31 }); }
    FG.sort(function (m, n) { return (m.a + m.b) * 25 + m.z * .3 - ((n.a + n.b) * 25 + n.z * .3); });
    FG.forEach(function (f) {
      var c = P(f.a, f.b, f.z);
      if (f.fiore) { var gb = P(f.a * .45, f.b * .45, 51), dg = "M" + q(gb) + " Q" + q(gb[0] + (c[0] - gb[0]) * .2, (gb[1] + c[1]) / 2) + " " + q(c[0], c[1] + 3); s += tratto(dg, "#3e6e22", 1.6) + tratto(dg, "#79a845", .7); s += ombrella(c[0], c[1], f.k, f.seme); return; }
      var V = VERDI_G[f.b + f.a < -.12 ? 2 : f.cl];
      s += usa("fg", "translate(" + f1(c[0]) + " " + f1(c[1]) + ") scale(1 .74) rotate(" + f1(f.ang) + ") scale(" + f2(f.f ? -f.sc : f.sc) + " " + f2(f.sc) + ")", "fill='" + lin("fg" + f.cl + (f.b + f.a < -.12 ? "s" : ""), [[0, V[0]], [1, V[1]]], 0, 0, 1, 1) + "' stroke='" + L + "' stroke-width='" + f2(.55 / f.sc) + "'");
    });
    return s;
  });

  // =========================================================
  //  LAMPIONE DI FERRO BATTUTO: il plinto di pietra, il piede a gradini, il palo col tortiglione e gli anelli,
  //  la punta di lancia in cima; il braccio a pastorale col ricciolo e la staffa a ricci, la lanterna quadrata
  //  appesa (vetri, tetto a punta col pomolo). Il braccio va verso il davanti; di notte la lanterna è accesa
  // =========================================================
  function ferro(d, w) { return tratto(d, "#0d0b0b", w + 1.3) + tratto(d, "#3a3436", w) + tratto(d, "#9a9496", w * .3, "transform='translate(-.35 -.45)' opacity='.7'"); }
  function lanterna(a, b, zA) {   // appesa al gancio in zA: quadrata, più larga in alto (nella vista: è uguale girata)
    var o = P(a, b, 0), s = "";
    function V(du, dv, z) { return [o[0] + (du - dv) * 50, o[1] + (du + dv) * 25 - z]; }
    var z1 = zA - 14, z0 = z1 - 23, r0 = .052, r1 = .074, re = .098, zc = z1 + 11;
    // il fondo a punta col pallino
    s += poly([V(-r0, r0, z0), V(r0, r0, z0), V(0, 0, z0 - 5.5)], "#4a4446", bordo("#0d0b0b", .8)) + poly([V(r0, r0, z0), V(r0, -r0, z0), V(0, 0, z0 - 5.5)], "#1e1a1b", bordo("#0d0b0b", .8));
    var pb = V(0, 0, z0 - 6.2); s += cer(pb[0], pb[1], 1.3, "#2a2526", bordo("#0d0b0b", .5));
    // i due vetri che si vedono, col telaio
    var F = [V(-r0, r0, z0), V(r0, r0, z0), V(r1, r1, z1), V(-r1, r1, z1)], E = [V(r0, r0, z0), V(r0, -r0, z0), V(r1, -r1, z1), V(r1, r1, z1)];
    function dentroF(q4, k) { var cx = (q4[0][0] + q4[1][0] + q4[2][0] + q4[3][0]) / 4, cy = (q4[0][1] + q4[1][1] + q4[2][1] + q4[3][1]) / 4; return q4.map(function (x) { return [cx + (x[0] - cx) * k, cy + (x[1] - cy) * k]; }); }
    var vF = dentroF(F, .78), vE = dentroF(E, .78), bF = limiti(F);
    s += poly(F, "#3a3436") + poly(E, "#1c1819");
    if (NOTTE) {
      s += poly(vF, nuova([[0, "#fffdf0"], [.45, "#ffe9a0"], [1, "#ffb84a"]], 0, bF[1], 0, bF[3], true)) + poly(vE, nuova([[0, "#fff3c4"], [.5, "#ffcf6a"], [1, "#f09a2e"]], 0, bF[1], 0, bF[3], true));
      var cl = V(0, 0, (z0 + z1) / 2 + 1); s += ell(cl[0] - 1.4, cl[1], 2.6, 3.4, "#ffffff", op(.9)) + cer(cl[0] - 1.4, cl[1], 6, nuovaR([[0, "#fff8d8", .7], [1, "#ffd27a", 0]], .5, .5, .5));
    } else {
      s += poly(vF, nuova([[0, "#f2f8fb"], [1, "#a9c2cf"]], 0, bF[1], 0, bF[3], true)) + poly(vE, nuova([[0, "#c9dbe4"], [1, "#7f9aa8"]], 0, bF[1], 0, bF[3], true));
      s += pth(chiuso([lerp(vF[3], vF[2], .18), lerp(vF[3], vF[2], .42), lerp(vF[0], vF[1], .3), lerp(vF[0], vF[1], .1)]), "#ffffff", op(.55));   // il riflesso sul vetro
    }
    var mF = [lerp(F[0], F[3], .5), lerp(F[1], F[2], .5)], mE = [lerp(E[0], E[3], .5), lerp(E[1], E[2], .5)];
    s += tratto(linea(mF[0], mF[1]) + " " + linea(mE[0], mE[1]), "#1a1617", .8) + tratto(linea(F[1], F[2]), "#0d0b0b", 1.1);
    s += poly([F[0], F[1], E[1], E[2], F[2], F[3]], "none", bordo("#0d0b0b", 1.1));
    // il tetto: la gronda, la piramide, il pomolo e l'anello
    var g = [V(-re, re, z1), V(re, re, z1), V(re, -re, z1)], g2 = [V(-re, re, z1 + 1.6), V(re, re, z1 + 1.6), V(re, -re, z1 + 1.6)], ap = V(0, 0, zc);
    s += poly([g[0], g[1], g2[1], g2[0]], "#2e292a", bordo("#0d0b0b", .7)) + poly([g[1], g[2], g2[2], g2[1]], "#161314", bordo("#0d0b0b", .7));
    s += poly([g2[0], g2[1], ap], nuova([[0, "#6a6466"], [1, "#2c2729"]], ap[0], ap[1], ap[0], g2[0][1], true), bordo("#0d0b0b", .9)) + poly([g2[1], g2[2], ap], "#1d191a", bordo("#0d0b0b", .9));
    s += tratto(linea([g2[0][0] + 2, g2[0][1] - 1.2], [ap[0] - .6, ap[1] + 2.6]), "#b8b2b4", .5, op(.6));
    s += cer(ap[0], ap[1] - 1.2, 1.5, nuovaR([[0, "#9a9496"], [.5, "#3a3436"], [1, "#0d0b0b"]], .35, .3, .8), bordo("#0d0b0b", .5));
    var an = V(0, 0, zA - .5); s += ell(an[0], an[1] + 1.8, 1.3, 2, "none", "stroke='#0d0b0b' stroke-width='1.6'") + ell(an[0], an[1] + 1.8, 1.3, 2, "none", "stroke='#5a5456' stroke-width='.6'");
    return s;
  }
  def("lampione_cortile", { nome: "Lampione di ferro battuto", fp: [1, 1], box: [-32, -197, 32, 12], dietro: true, luce: [0, .17, 142, 125, "#ffd27a"] }, function () {   // (la luce a metà tra il palo e la lanterna: il gioco usa lo stesso punto anche girato)
    var BL = .34, s = ombraPianta(-.17, .17, -.17, .17, .95, .05);
    s += blocco(-.15, .15, -.15, .15, 0, 8, TRAV, null, 1.3);   // il plinto di pietra
    var palo = tornito(0, 0, [[8, .102], [10, .102], [11, .09], [14, .075], [17.5, .06], [20.5, .048], [23.5, .04], [25.5, .036]], FE_ST, 1.3, [1, 2, 4]);   // il piede a campana
    palo += tornito(0, 0, [[25, .034], [176, .029]], FE_ST, 1.2, null, .6);
    [[29, .048, 3.4], [62, .045, 3], [110, .045, 3], [152, .047, 3.4]].forEach(function (g) { palo += tornito(0, 0, [[g[0] - g[2] / 2, .03], [g[0] - g[2] / 4, g[1]], [g[0] + g[2] / 4, g[1]], [g[0] + g[2] / 2, .03]], FE_ST, .8); });
    var c = P(0, 0, 0), k;   // il tortiglione: la sbarra ritorta
    for (k = 66; k < 107; k += 3.4) palo += tratto(linea([c[0] - 2.2, c[1] - k + 1.4], [c[0] + 2.2, c[1] - k - 1.4]), "#a8a2a4", .6, op(.6)) + tratto(linea([c[0] - 2.2, c[1] - k - .4], [c[0] + 2.2, c[1] - k - 3.2]), "#000000", .55, op(.6));
    palo += tornito(0, 0, [[175, .034], [177, .048], [179.5, .05], [182, .034], [186.5, .019], [192, .004]], FE_ST, .9);   // la punta di lancia
    function pz(l) { return l.map(function (x) { return P(0, x[0] * 1.1, x[1]); }); }
    var braccio = ferro(liscio(pz([[.01, 162], [.05, 168.5], [.12, 172.2], [.2, 173.6], [.27, 172.4], [.33, 169.6], [.375, 171.4], [.372, 175], [.34, 176], [.326, 173.8], [.344, 172.6]])), 2.6);   // il pastorale col ricciolo
    braccio += ferro(liscio(pz([[.02, 141], [.024, 148], [.05, 155], [.1, 161], [.15, 166.5], [.19, 172.4]])), 1.6) + ferro(liscio(pz([[.02, 141], [.05, 138.4], [.074, 140.6], [.062, 143.6], [.045, 141.6]])), 1.4);   // la staffa a ricci
    braccio += ferro(liscio(pz([[.1, 161], [.14, 158.4], [.165, 160.6], [.15, 163.2]])), 1.1);
    var gancio = P(0, BL, 171.8); braccio += tratto(linea(gancio, [gancio[0], gancio[1] + 3]), "#0d0b0b", 1.4);
    var lant = lanterna(0, BL, 168.2);
    s += vicino(0, BL) > 0 ? palo + braccio + lant : lant + braccio + palo;
    return s;
  });

  // =========================================================
  //  FONTANELLA (il "nasone" romano): la colonnina di ghisa verde col basamento modanato, il collare e la cupoletta
  //  col pomolo, lo stemma in rilievo, il "naso" ricurvo col buchino sopra; l'acqua che scende sempre nella grata,
  //  la lastra di travertino coi buchetti e la pietra bagnata intorno
  // =========================================================
  def("fontanella", { nome: "Fontanella (il nasone)", fp: [1, 1], box: [-42, -81, 42, 24], dietro: true }, function () {
    var BC = -.08, ZL = 3.6, GR = .2, r = rnd(1874), s = ombraPianta(-.34, .34, -.37, .41, 1, .03), k;
    s += blocco(-.33, .33, -.37, .41, 0, ZL, TRAV, null, 1.4);   // la lastra di travertino
    var buchi = "";
    for (k = 0; k < 22; k++) { var x = (-.3 + r() * .6) * 61, y = (-.34 + r() * .72) * 61; if (Math.abs(x) < 8 && Math.abs(y - GR * 61) < 8) continue; buchi += ell(x, y, .5 + r() * 1.1, .3 + r() * .5, "#9d8d6c", op(.55)); }
    var grata = rett(-6.4, GR * 61 - 6.4, 12.8, 12.8, .8, "#5a5050", bordo("#1a1514", .6)) + rett(-5.4, GR * 61 - 5.4, 10.8, 10.8, .4, "#16110f");
    for (k = 0; k < 5; k++) grata += rett(-5.4, GR * 61 - 4.6 + k * 2.2, 10.8, .9, 0, "#6b6363") + rett(-5.4, GR * 61 - 4.6 + k * 2.2, 10.8, .3, 0, "#a39a96", op(.8));
    var bagnato = ell(0, GR * 61 + .5, 11, 9.5, "#5a4a30", op(.18)) + ell(1.5, GR * 61 + 1.5, 8.5, 7, "#4a3a22", op(.16)) + ell(-6, GR * 61 + 7, 2.4, 1.6, "#4a3a22", op(.14));
    s += suZ(ZL, bagnato + buchi + grata);
    // l'acqua: esce dal naso e cade nella grata, con gli spruzzi
    var acqua = "", w0 = P(0, BC + .272, 42.8), w1 = P(0, BC + .279, 25), w2 = P(0, GR - .005, ZL + .3), dA = "M" + q(w0) + " Q" + q(w1) + " " + q(w2);
    acqua += tratto(dA, "#2f7fb0", 2.4, op(.35)) + tratto(dA, "#9fd8f6", 1.7, op(.75)) + tratto(dA, "#ffffff", .6, op(.9));
    acqua += ell(w2[0], w2[1], 4, 1.8, "none", "stroke='#d8f2ff' stroke-width='.6' opacity='.8'") + ell(w2[0], w2[1], 6.4, 2.9, "none", "stroke='#d8f2ff' stroke-width='.45' opacity='.45'");
    [[-2.4, -2.6], [2, -3.4], [-3.6, -1], [3.2, -1.2], [.4, -4.4]].forEach(function (g) { acqua += cer(w2[0] + g[0], w2[1] + g[1], .45, "#e8f8ff", op(.9)); });
    // il naso: il tubo ricurvo che esce dalla colonna e piega in giù, col buchino sopra la curva
    var nas = [[BC + .13, 50], [BC + .2, 50.4], [BC + .246, 49.2], [BC + .268, 46.4], [BC + .272, 43.4]].map(function (x) { return P(0, x[0], x[1]); }), dN = liscio(nas);
    var naso = tratto(dN, "#0c2214", 6.4) + tratto(dN, "#2f6343", 4.9) + tratto(dN, "#8cc49a", 1.3, "transform='translate(-.45 -.7)' opacity='.8'");
    var bo = P(0, BC + .272, 43.2), bu = P(0, BC + .242, 51);
    naso += ell(bo[0], bo[1], 2.3, 1.15, "#0c1a10", bordo("#0c2214", .4)) + ell(bu[0], bu[1], .75, .42, "#0a140c");
    // la colonnina di ghisa: tozza, col basamento, il collare e la cupoletta bassa col pomolo
    var prof = [[ZL, .19], [6.4, .19], [7.4, .176], [9.4, .166], [11, .16], [54, .15], [55.5, .158], [58, .162], [59.6, .153], [61, .146], [63.5, .13], [66, .1], [67.8, .062], [68.8, .03], [69.2, .022]];
    var col = tornito(0, BC, prof, GH_ST, 1.6, [1, 3, 6, 8], .9) + tornito(0, BC, [[69, .022], [70.2, .031], [72, .029], [73.2, .016], [73.6, .002]], GH_ST, .9);
    var ci = P(0, BC, 0);
    col += tratto(linea([ci[0] - 4.8, ci[1] - 14], [ci[0] - 4.5, ci[1] - 50]), "#c5e6cc", 1, op(.35));   // la luce lunga sulla ghisa
    if (G > 0) {   // lo stemma in rilievo, sul davanti sotto il naso
      var sm = P(0, BC + .15, 31);
      col += "<g transform='translate(" + f2(sm[0] + 1.2) + " " + f2(sm[1]) + ") scale(.85 1.1)'>" + pth("M-3.4,-4.6 H3.4 V.8 Q3.4,4.4 0,6 Q-3.4,4.4 -3.4,.8 Z", "#3d7a52", bordo("#0c2214", .7)) +
        pth("M-2.2,-3.4 H2.2 V.6 Q2.2,3 0,4.2 Q-2.2,3 -2.2,.6 Z", "none", "stroke='#8cc49a' stroke-width='.5' opacity='.7'") + tratto("M-1.8,2.4 L1.8,-2.6", "#8cc49a", .7, op(.8)) +
        pth("M-2.6,-4.6 L-2.6,-6.6 L-1.3,-5.4 L0,-7.2 L1.3,-5.4 L2.6,-6.6 L2.6,-4.6 Z", "#4c8b5d", bordo("#0c2214", .5)) + "</g>";
    }
    s += G > 0 ? col + naso + acqua : acqua + naso + col;
    return s;
  });

  // =========================================================
  function misure(d) { if (d.tipo === "terra") return { w: d.w, h: d.h }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), tipo = d.tipo || "piedi", o = { tipo: tipo, nome: d.nome, stanza: "circolo", reparto: "circolo", w: m.w, h: m.h, fp: (d.fp || [1, 1]).slice(), prezzo: 0, qual: 2 };
      if (tipo !== "terra") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.piano) o.piano = d.piano;
      if (d.posti) o.posti = d.posti.map(function (x) { return x.slice(); });
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      if (d.luce) { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "ccor" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!(opz.notte && d.luce);
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      var testa = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "");
      if (d.tipo === "terra") return testa + c + "</svg>";
      return testa + "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

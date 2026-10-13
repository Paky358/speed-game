/* =========================================================
   SPeeD GAME — I TAVOLI DEL CASINÒ, VISTI DALL'ALTO (come i mobili della casa, js/mobili-arte.js)
   Il Casinò è una sala enorme vista dall'alto (lo stesso motore della casa, js/giardino.js).
   Stile Monte-Carlo: mogano laccato, ottone e oro, panni verdi, cuoio imbottito, velluto rosso.
   Una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   - Tavoli (bassi, il panno a 45): roulette, Black Jack, poker, baccarat (sala VIP), craps (i dadi), Sic Bo.
     In info "posti" = le mattonelle dove si siedono i giocatori, "croupier" = dove sta chi tiene il banco
     (relative all'angolo dell'impronta nel disegno davanti; il croupier sta dalla parte della schiena).
   - La ruota della fortuna (Big Six) in piedi con le lampadine, la sedia di velluto, la colonnina col cordone.
   Sul panno niente lettere (il motore specchia i disegni): solo caselle, numeri, dadi, semi delle carte e colori.
   Il davanti guarda in basso a sinistra; con { dietro: true } lo stesso oggetto girato; con { notte: true } le luci accese.
   Non si vendono nel negozio: reparto "casino", prezzo 0. Si aggiungono con SGMobiliArte.aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte || !window.SGMobiliArte.aggiungi) return;

  // ---------- attrezzi (gli stessi degli altri mobili) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function q2(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f2(x) + "," + f2(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(k) { return "opacity='" + k + "'"; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f2(x) + "' cy='" + f2(y) + "' r='" + f2(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f1(rx) + "' ry='" + f1(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f2(x) + "' y='" + f2(y) + "' width='" + f2(w) + "' height='" + f2(h) + "'" + (r ? " rx='" + f2(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + (w || 2.4) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f2(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q(a) + " L" + q(b); }
  function chiuso(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function aperto(a) { return "M" + a.map(function (x) { return q(x); }).join(" L"); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function dEll(cx, cy, rx, ry) { return "M" + q(cx - rx, cy) + " A" + f1(rx) + "," + f1(ry) + " 0 1,0 " + q(cx + rx, cy) + " A" + f1(rx) + "," + f1(ry) + " 0 1,0 " + q(cx - rx, cy) + " Z"; }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  function tono(c, t) { return t >= 0 ? chiaro(c, Math.min(.85, t)) : scuro(c, Math.min(.85, -t)); }
  // sfumature e ritagli (gli id col prefisso del disegno)
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
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  var OTTONE = [[0, "#fff6cf"], [.3, "#f3d27a"], [.62, "#c99a36"], [1, "#7a5614"]];
  var DORATO = [[0, "#fff3c2"], [.25, "#f6d572"], [.55, "#d9a83a"], [.8, "#a97720"], [1, "#6e4a10"]];   // il legno dorato (foglia d'oro)
  var ORO = "#e2b444", ORO_C = "#f8de8a", ORO_S = "#9c6f1c";
  function ottone(d, w) { return tratto(d, L, w + 2) + tratto(d, "#d9a83a", w) + tratto(d, "#fff3c4", Math.max(.5, w * .36), "opacity='.95' transform='translate(-.3 -.45)'"); }   // un tubo d'ottone

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf == null ? ra : rf, rr: rr == null ? (rf == null ? ra : rf) : rr, e: e || 2 }; }
  function giro(F, z, k, n, db) {
    var ka = k == null ? 1 : (k.length ? k[0] : k), kb = k == null ? 1 : (k.length ? k[1] : k), out = [], i; n = n || 60;
    for (i = 0; i < n; i++) {
      var t = i / n * 6.2832, c = Math.cos(t), s = Math.sin(t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / F.e), y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / F.e);
      out.push(P(F.ca + x * F.ra * ka, F.cb + (db || 0) + y * (y > 0 ? F.rf : F.rr) * kb, z));
    }
    return out;
  }
  function inviluppo(pp) {   // il contorno esterno di tanti punti
    var a = pp.slice().sort(function (m, n) { return m[0] - n[0] || m[1] - n[1]; }), lo = [], hi = [], i;
    function cr(o, m, n) { return (m[0] - o[0]) * (n[1] - o[1]) - (m[1] - o[1]) * (n[0] - o[0]); }
    for (i = 0; i < a.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], a[i]) <= 0) lo.pop(); lo.push(a[i]); }
    for (i = a.length - 1; i >= 0; i--) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], a[i]) <= 0) hi.pop(); hi.push(a[i]); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  function corpo(livelli, stops, lw) {   // un pezzo tondo pieno: la sagoma sfumata da sinistra a destra
    var pp = inviluppo([].concat.apply([], livelli)), b = limiti(pp);
    return pth(chiuso(pp), lin("cx", stops, b[0], 0, b[2], 0, true), bordo(L, lw || 2.4));
  }
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
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), L, .9, "opacity='.75'");   // gli spigoli di dentro, sottili
    if (H > 5) s += tratto("M" + q(D[0] + 1.4, D[1] + 1.2) + " L" + q(C[0] - .6, C[1] + 1), "#ffffff", 1, "opacity='.55'");   // il filo di luce sullo spigolo davanti
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, lw || 2));
  }
  function piano(O, X, Y, W, H, c) {   // un disegno piatto W × H steso su un piano qualsiasi: O = il suo angolo in alto a sinistra, X = la fine della riga di sopra, Y = la fine del lato di sinistra
    var m = [(X[0] - O[0]) / W, (X[1] - O[1]) / W, (Y[0] - O[0]) / H, (Y[1] - O[1]) / H, O[0], O[1]];
    return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>";
  }
  // un disegno piatto steso su un piano dritto: sul piano a z fisso (X = a·61, Y = b·61: la pianta, coi suoi disegni),
  // e sul piano a b fisso (X = a·61, Y = −z)
  function mat(m, c) { return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>"; }
  function suZ(z, c) { return mat([.8197 * G, .4098 * G, -.8197 * G, .4098 * G, 0, -z], c); }
  function suB(b, c) { return mat([.8197 * G, .4098 * G, 0, 1, -50 * G * b, 25 * G * b], c); }

  // ---------- la luce: viene da in alto a sinistra ----------
  function norma(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  var LUCE = norma([-.3, .5, .8]), VISTA = norma([1, 1, .82]), MEZZO = norma([LUCE[0] + VISTA[0], LUCE[1] + VISTA[1], LUCE[2] + VISTA[2]]);
  function tinta(c, n, m) {   // il colore di una superficie con la normale n (nella vista: u, v, z) fatta del materiale m
    m = m || {};
    var B = dot(n, LUCE), t = B >= .5 ? (B - .5) / .3 * .2 : (B - .5) / .8 * .27;
    var col = tono(c, t * (m.forza || 1));
    if (m.lucido) { var sp = Math.pow(Math.max(0, dot(n, MEZZO)), m.esp || 24) * m.lucido; if (sp > .01) col = mix(col, m.riflesso ? chiaro(c, m.riflesso) : "#fff8ec", Math.min(.85, sp)); }
    return col;
  }
  var LACCA = { lucido: .55, esp: 5 }, GOMMA = { forza: .8 };

  // ---------- i pezzi torniti (gambe, colonnine, perni): il profilo [[z, raggio in mattonelle], ...] ----------
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
    var o = pth(dTornito(a, b, prof), lin("tn", stops, c[0] - rm, 0, c[0] + rm, 0, true), bordo(L, lw || 1.3));
    (anelli || []).forEach(function (k) { var rx = prof[k][1] * 70.71, y = c[1] - prof[k][0]; o += pth("M" + q(c[0] - rx, y) + " A" + f1(rx) + "," + f1(rx / 2) + " 0 0,0 " + q(c[0] + rx, y), "none", "stroke='" + L + "' stroke-width='.55' opacity='.5'"); });
    if (luce) o += tratto("M" + prof.slice(1, n - 1).map(function (x) { return q(c[0] - x[1] * 70.71 * .5, c[1] - x[0]); }).join(" L"), "#ffffff", luce, "opacity='.5'");
    return o;
  }
  function pallina(c, r, col, k) {   // una pallina lucida: c = il centro sullo schermo
    return cer(c[0], c[1], r, nuovaR([[0, chiaro(col, .7)], [.35, col], [1, scuro(col, .5)]], .35, .3, .8), bordo(L, k || .6)) + ell(c[0] - r * .32, c[1] - r * .38, r * .34, r * .22, "#ffffff", op(.85));
  }

  // ---------- le ombre a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra) ----------
  function aTerra(c) { return "<g transform='matrix(50 25 -50 25 0 0)'>" + c + "</g>"; }
  function ombraPianta(a0, a1, b0, b1, k, pad) {
    pad = pad == null ? .1 : pad;
    var cu = G * (a0 + a1) / 2 + .05, cv = G * (b0 + b1) / 2 - .01;
    return aTerra("<ellipse cx='" + f2(cu) + "' cy='" + f2(cv) + "' rx='" + f2((a1 - a0) / 2 + pad) + "' ry='" + f2((b1 - b0) / 2 + pad) + "' fill='" + rad("omp", [[0, "#000", .24], [.6, "#000", .16], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>");
  }
  function ombraForma(pp, k) {   // l'ombra morbida sotto un tavolo: la sua forma, a strati sempre più scuri verso il centro
    k = k || 1;
    function g2(d) { return chiuso(allarga(pp, d).map(function (x) { return Puv(G * x[0] + .06, G * x[1] - .02, 0); })); }
    return pth(g2(.13), "#000", op(f2(.05 * k))) + pth(g2(.06), "#000", op(f2(.06 * k))) + pth(g2(-.02), "#000", op(f2(.07 * k))) + pth(g2(-.14), "#000", op(f2(.08 * k))) + pth(g2(-.3), "#000", op(f2(.06 * k)));
  }

  // ---------- le forme in pianta (punti [a, b], giro antiorario) ----------
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
  function pOvale(ca, cb, ra, rb, e, n, rbd) {   // un ovale (e = 2 ellisse, di più = più squadrato); rbd = la mezza profondità dietro
    var o = [], i; n = n || 96;
    for (i = 0; i < n; i++) {
      var t = i / n * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / e), y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / e);
      o.push([ca + x * ra, cb + y * (s < 0 && rbd != null ? rbd : rb)]);
    }
    return o;
  }
  function pMezzaluna(a0, a1, b0, bc, b1, rc, e) {   // la mezzaluna del Black Jack: dritta dietro (b0), tonda davanti fino a b1; .dorso = dove comincia il lato del croupier
    var o = [], i, ra = (a1 - a0) / 2, ac = (a0 + a1) / 2, rb = b1 - bc, n = 56; e = e || 2.2;
    o.push([a1, b0 + rc]);
    for (i = 0; i <= n; i++) { var t = i / n * Math.PI, c = Math.cos(t), s = Math.sin(t); o.push([ac + ra * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / e), bc + rb * Math.pow(Math.max(0, s), 2 / e)]); }
    o.push([a0, b0 + rc]);
    var dorso = o.length - 1;
    for (i = 1; i <= 4; i++) { var t2 = Math.PI + i / 5 * Math.PI / 2; o.push([a0 + rc + rc * Math.cos(t2), b0 + rc + rc * Math.sin(t2)]); }
    o.push([a0 + rc, b0]); o.push([a1 - rc, b0]);
    for (i = 1; i <= 4; i++) { var t3 = 1.5 * Math.PI + i / 5 * Math.PI / 2; o.push([a1 - rc + rc * Math.cos(t3), b0 + rc + rc * Math.sin(t3)]); }
    o.dorso = dorso;
    return o;
  }
  function pRene(ra, rb, rbd, e, dente, largo, n) {   // l'ovale del baccarat con l'incavo dietro per il croupier
    return pOvale(0, 0, ra, rb, e, n, rbd).map(function (x) {
      if (x[1] < 0 && Math.abs(x[0]) < largo) { var c = Math.cos(Math.PI / 2 * x[0] / largo); return [x[0], x[1] + dente * c * c]; }
      return x;
    });
  }
  function aSchermo(pp, z) { return pp.map(function (x) { return P(x[0], x[1], z); }); }
  function chiusoP(pp) { return "M" + pp.map(function (x) { return q2(x[0] * 61, x[1] * 61); }).join(" L") + " Z"; }   // un tracciato in pianta (dentro suZ)
  function lungoCorsa(vv, passo, fn) {   // dei punti lungo una fila di vertici (in pianta), ogni "passo" mattonelle
    var o = "", acc = passo / 2, i;
    for (i = 0; i < vv.length - 1; i++) {
      var A = vv[i], B = vv[i + 1], l = Math.sqrt((B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1]));
      while (acc <= l) { var t = acc / l; o += fn(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t); acc += passo; }
      acc -= l;
    }
    return o;
  }

  // ---------- i pezzi dei tavoli ----------
  // il fianco dritto di una forma (da z0 a z1): si vedono solo i pezzi girati verso chi guarda, ognuno col colore della sua luce.
  // o = { dentro (la faccia di dentro: le pareti della vasca dei dadi), filtro(i), righe: [[z, colore, spessore, opacità]], extra(fila), cima, lw }
  function fianco(pp, z0, z1, col, m, o) {
    o = o || {};
    var n = pp.length, s = "", vis = [], i, k, verso = o.dentro ? -1 : 1;
    function nv(i) { var nn = nrm(pp[i], pp[(i + 1) % n]); return [G * nn[0] * verso, G * nn[1] * verso, 0]; }
    for (i = 0; i < n; i++) vis.push(dot(nv(i), VISTA) > .003 && (!o.filtro || o.filtro(i)));
    var file = [], parti = -1, cur = null;
    for (i = 0; i < n; i++) if (!vis[i]) { parti = i; break; }
    if (parti < 0) { cur = []; for (i = 0; i < n; i++) cur.push(i); file.push(cur); }
    else for (k = 1; k <= n; k++) { i = (parti + k) % n; if (vis[i]) { if (!cur) { cur = [i]; file.push(cur); } else cur.push(i); } else cur = null; }
    file.forEach(function (fl) {
      fl.forEach(function (i) {
        var A = pp[i], B = pp[(i + 1) % n], c = tinta(col, nv(i), m);
        s += poly([P(A[0], A[1], z1), P(B[0], B[1], z1), P(B[0], B[1], z0), P(A[0], A[1], z0)], c, "stroke='" + c + "' stroke-width='.7' stroke-linejoin='round'");
      });
      var vv = fl.map(function (i) { return pp[i]; }).concat([pp[(fl[fl.length - 1] + 1) % n]]);
      if (o.extra) s += o.extra(vv);
      (o.righe || []).forEach(function (r) { s += tratto(aperto(vv.map(function (x) { return P(x[0], x[1], r[0]); })), r[1], r[2], r[3] ? op(r[3]) : ""); });
      var lw = o.lw || 1.6;
      s += tratto(aperto(vv.map(function (x) { return P(x[0], x[1], z0); })), L, lw);
      if (o.cima) s += tratto(aperto(vv.map(function (x) { return P(x[0], x[1], z1); })), L, o.cima);
      if (o.lati !== false) [vv[0], vv[vv.length - 1]].forEach(function (x) { s += tratto(linea(P(x[0], x[1], z0), P(x[0], x[1], z1)), L, lw * .8); });
    });
    return s;
  }
  function lesene(z1) {   // sulla base piena: le righe d'oro in piedi che la dividono in pannelli
    return function (vv) { return lungoCorsa(vv, .32, function (a, b) { return tratto(linea(P(a, b, 4), P(a, b, z1 - 3.5)), ORO_S, 1.4, op(.9)) + tratto(linea(P(a, b, 4), P(a, b, z1 - 3.5)), ORO_C, .5, "transform='translate(-.4 0)' opacity='.9'"); }); };
  }
  // la fascia sotto il piano: legno laccato col filo d'oro in alto e in basso e le perline dorate in mezzo
  function grembiule(pp, z0, z1, col, o) {
    o = o || {};
    var zb = z0 + (z1 - z0) * .45;
    return fianco(pp, z0, z1, col, LACCA, {
      righe: [[z1 - 1.5, ORO_S, 1.6, .9], [z1 - 1.6, ORO, 1, 1], [z1 - 1.9, ORO_C, .4, .9], [z0 + 1.3, ORO_S, 1.2, .85], [z0 + 1.4, ORO, .6, .9]],
      extra: o.perline === false ? null : function (vv) {
        return lungoCorsa(vv, o.passo || .06, function (a, b) { var c = P(a, b, zb); return cer(c[0], c[1], .9, ORO, "stroke='" + ORO_S + "' stroke-width='.35'") + cer(c[0] - .25, c[1] - .3, .32, "#fff7d6"); });
      }
    });
  }
  // il bordo imbottito: un tubo morbido lungo il contorno (in pianta) all'altezza zc; r = mezzo spessore sullo schermo.
  // o = { aperto (un pezzo e non tutto il giro), cucitura, oro (il cordoncino d'oro), lucido }
  function tubo(pp, zc, r, col, o) {
    o = o || {};
    var sp = aSchermo(pp, zc), n = sp.length, chiudi = !o.aperto, b = limiti(sp);
    function D(a) { return chiudi ? chiuso(a) : aperto(a); }
    function sposta(k) {   // la stessa linea spostata verso la luce (in alto a sinistra sullo schermo), di più dove il tubo le si gira
      return sp.map(function (pt, i) {
        var a = sp[chiudi ? (i + n - 1) % n : Math.max(0, i - 1)], c = sp[chiudi ? (i + 1) % n : Math.min(n - 1, i + 1)];
        var tx = c[0] - a[0], ty = c[1] - a[1], l = Math.sqrt(tx * tx + ty * ty) || 1, nx = -ty / l, ny = tx / l, d = nx * -.42 + ny * -.91;
        return [pt[0] + nx * d * k, pt[1] + ny * d * k];
      });
    }
    var s = tratto(D(sp), L, 2 * r + 2.3);
    s += tratto(D(sp), nuova([[0, chiaro(col, .1)], [.5, col], [1, scuro(col, .45)]], b[0], 0, b[2], 0, true), 2 * r);
    s += tratto(D(sposta(r * .36)), nuova([[0, chiaro(col, .24)], [.5, chiaro(col, .11)], [1, chiaro(col, .02)]], b[0], 0, b[2], 0, true), r * 1.0, op(.9));
    s += tratto(D(sposta(r * .64)), "#ffffff", r * .22, op(o.lucido || .3));
    if (o.cucitura) s += tratto(D(sposta(-r * .52)), chiaro(col, .32), .45, "stroke-dasharray='1.3 1.1' opacity='.7'");
    if (o.oro) s += tratto(D(sposta(-r * .78)), ORO, .8, op(.95));
    return s;
  }
  // il panno teso dentro il bordo, col disegno del gioco (in pianta) e la pozza di luce del lampadario
  function panno(pp, z, col, disegno) {
    var sp = aSchermo(pp, z), d = chiuso(sp), b = limiti(sp), w = b[2] - b[0], h = b[3] - b[1];
    var s = pth(d, nuova([[0, chiaro(col, .16)], [.5, col], [1, scuro(col, .26)]], b[0], b[1], b[2], b[3], true));
    var c = (disegno ? suZ(z, disegno) : "") +
      ell(b[0] + w * .45, b[1] + h * .44, w * .36, h * .36, nuovaR([[0, "#fff3cf", .2], [.55, "#fff3cf", .07], [1, "#fff3cf", 0]], .5, .5, .5)) +   // la luce dall'alto
      tratto(d, "#000000", 7, op(.12)) + tratto(d, "#000000", 2.6, op(.16));   // l'ombra del bordo sul panno
    return s + dentro(d, c);
  }
  function anelloP(est, int, z, fill, x) {   // un anello piatto tra due contorni (in pianta), all'altezza z
    return pth(chiuso(aSchermo(est, z)) + " " + chiuso(aSchermo(int, z).reverse()), fill, "fill-rule='evenodd'" + attr(x));
  }
  // una gamba tornita di mogano col piedino d'ottone (da terra a z1)
  function gambaTornita(a, b, z1, col) {
    col = col || "#7d3519";
    var st = [[0, chiaro(col, .45)], [.3, chiaro(col, .12)], [.65, scuro(col, .3)], [1, scuro(col, .62)]];
    var piede = tornito(a, b, [[0, .056], [2.4, .056], [3, .044]], OTTONE, 1, null, .6);
    var k = z1 / 33, pr = [[2.8, .04], [4.6, .035], [7 * k, .05], [10 * k, .058], [13 * k, .05], [16 * k, .036], [22 * k, .031], [26 * k, .039], [28.5 * k, .05], [30.5 * k, .042], [z1, .042]];
    return piede + tornito(a, b, pr, st, 1.2, [3, 8], .7);
  }
  // una gamba a cabriolè dorata (il ginocchio in fuori, la caviglia stretta, il piedino a ricciolo): in (a, b) da z1 a terra, va in fuori verso (da, db)
  function cabriole(a, b, z1, da, db, k, w0) {
    var n = 18, c = [], i, sx = [], dx = [];
    w0 = w0 || 3.2;
    for (i = 0; i <= n; i++) {
      var t = i / n, z = z1 * (1 - t), f = k * (Math.sin(Math.PI * Math.min(1, t * 1.3)) * .85 - t * .5 + Math.pow(t, 6) * .75);
      c.push(P(a + da * f, b + db * f, z));
    }
    for (i = 0; i <= n; i++) {
      var t2 = i / n, A = c[Math.max(0, i - 1)], B = c[Math.min(n, i + 1)], tx = B[0] - A[0], ty = B[1] - A[1], l = Math.sqrt(tx * tx + ty * ty) || 1, nx = -ty / l, ny = tx / l;
      if (nx > 0) { nx = -nx; ny = -ny; }
      var w = w0 * (1 - .62 * Math.sin(Math.PI / 2 * Math.min(1, t2 / .88))) + (t2 > .88 ? (t2 - .88) * w0 * 4.5 : 0);
      sx.push([c[i][0] + nx * w, c[i][1] + ny * w]); dx.push([c[i][0] - nx * w, c[i][1] - ny * w]);
    }
    var pp = sx.concat(dx.reverse()), b2 = limiti(pp), fondo = c[n];
    var s = ell(fondo[0] + .8, fondo[1] + .4, w0 * 1.1, w0 * .45, "#000", op(.25));
    s += pth(chiuso(pp), lin("cb", DORATO, b2[0], 0, b2[2], 0, true), bordo(L, 1));
    s += tratto(aperto(sx.slice(1, n - 1).map(function (x, j) { return lerp(x, c[j + 1], .45); })), "#fffbe6", .7, op(.75));   // il filo di luce
    var gin = c[3];
    s += tratto("M" + q(gin[0] - w0 * .5, gin[1] - 1.2) + " q" + q(w0 * .5, -1.6) + " " + q(w0, 0) + " q" + q(-.2, 1.2) + " " + q(-1, .8), ORO_S, .6, op(.8));   // la foglia intagliata sul ginocchio
    return s + ell(fondo[0], fondo[1] - .3, w0 * .75, w0 * .38, nuovaR(DORATO, .35, .3, .8), bordo(L, .8));   // il piedino
  }

  // ---------- le cose sul tavolo ----------
  var FICHE = { rossa: "#e03131", verde: "#2f9e44", nera: "#2b2c33", blu: "#1c7ed6", viola: "#7048e8", gialla: "#f5b30a", bianca: "#f4f4f0", rosa: "#f06595", arancio: "#fd7e14", azzurra: "#22b8cf" };
  // una pila di n fiches del colore c, appoggiata in (a, b) all'altezza z: il fianco coi segni bianchi, sopra l'anello tratteggiato
  function fiches(a, b, z, n, c, r) {
    r = r || .042;
    var F = forma(a, b, r), h = 1.3, top = z + n * h, s = "", k, j, macchia = c === FICHE.bianca ? "#1c7ed6" : "#ffffff", cb = P(a, b, z);
    s += ell(cb[0] + 1.3, cb[1] + .5, r * 70.71 + 1.2, r * 35.36 + .7, "#000000", op(.3));   // l'ombra sul panno
    s += corpo([giro(F, z, 1, 24), giro(F, top, 1, 24)], [[0, chiaro(c, .35)], [.5, c], [1, scuro(c, .45)]], .7);
    var th0 = Math.PI / 4;   // il punto del fianco che guarda chi guarda (girato col mobile da G)
    for (k = 0; k < n; k++) {
      var zz = z + k * h + h * .5;
      for (j = -2; j <= 2; j++) {
        var th = th0 + j * .62, pt = P(a + r * Math.cos(th) * G, b + r * Math.sin(th) * G, zz);
        s += tratto("M" + q(pt[0], pt[1] - .35) + " L" + q(pt[0], pt[1] + .35), macchia, .75, op(Math.abs(j) === 2 ? .45 : .9));
      }
      if (k) { var e = []; for (j = 0; j <= 10; j++) { var t = th0 - 1.57 + j * .314; e.push(P(a + r * Math.cos(t) * G, b + r * Math.sin(t) * G, z + k * h)); } s += tratto(aperto(e), scuro(c, .5), .35, op(.6)); }
    }
    var tp = giro(F, top, 1, 24);
    s += pth(chiuso(tp), nuovaR([[0, chiaro(c, .45)], [.6, c], [1, scuro(c, .15)]], .4, .35, .8), bordo(L, .6));
    s += tratto(chiuso(giro(F, top, .7, 18)), macchia, .55, "stroke-dasharray='.9 .9' opacity='.9'");
    return s + pth(chiuso(giro(F, top, .42, 14)), chiaro(c, .25), "stroke='" + scuro(c, .3) + "' stroke-width='.25'");
  }
  // i semi delle carte (uguali allo specchio): centrati in (x, y), grandi k (1 = alti circa 4)
  var SEMI = {
    cuori: "M0,1.9C-.5,1.3 -2.2,.1 -2.2,-.9C-2.2,-2 -.7,-2.3 0,-1.1C.7,-2.3 2.2,-2 2.2,-.9C2.2,.1 .5,1.3 0,1.9Z",
    quadri: "M0,-2.1L1.5,0 0,2.1 -1.5,0Z",
    picche: "M0,-2.1C-.6,-1.3 -2.2,-.4 -2.2,.6C-2.2,1.5 -1,1.8 -.3,1.1C-.35,1.6 -.6,1.95 -1,2.15H1C.6,1.95 .35,1.6 .3,1.1C1,1.8 2.2,1.5 2.2,.6C2.2,-.4 .6,-1.3 0,-2.1Z"
  };
  function seme(tipo, x, y, k) {
    var c = tipo === "cuori" || tipo === "quadri" ? "#d6283b" : "#1d1d22", t = "translate(" + f2(x) + " " + f2(y) + ") scale(" + f2(k) + ")";
    if (tipo === "fiori") return "<g transform='" + t + "' fill='" + c + "'><circle cx='0' cy='-1.05' r='.95'/><circle cx='-1.05' cy='.45' r='.95'/><circle cx='1.05' cy='.45' r='.95'/><path d='M-.3,.2H.3L.65,2.1H-.65Z'/></g>";
    return "<path d='" + SEMI[tipo] + "' transform='" + t + "' fill='" + c + "'/>";
  }
  // una carta stesa sul panno (in pianta: X = a·61): scoperta col seme, coperta col dorso rosso
  function cartaP(a, b, ang, tipo, scoperta) {
    var w = .085 * 61, h = .12 * 61, o = "<g transform='translate(" + f2(a * 61) + " " + f2(b * 61) + ") rotate(" + ang + ")'>";
    o += rett(-w / 2 + .5, -h / 2 + .7, w, h, .9, "#000000", op(.3));
    o += rett(-w / 2, -h / 2, w, h, .9, "#fbfaf5", "stroke='#8f897e' stroke-width='.3'");
    if (scoperta) o += seme(tipo, 0, 0, .78) + seme(tipo, -w / 2 + 1.1, -h / 2 + 1.4, .27) + seme(tipo, w / 2 - 1.1, h / 2 - 1.4, .27);
    else o += rett(-w / 2 + .55, -h / 2 + .55, w - 1.1, h - 1.1, .5, "#b3202f") + rett(-w / 2 + 1.15, -h / 2 + 1.15, w - 2.3, h - 2.3, .3, "none", "stroke='#f5c6cb' stroke-width='.3'") + pth("M0,-1.6L1.2,0 0,1.6 -1.2,0Z", "none", "stroke='#f5c6cb' stroke-width='.3'");
    return o + "</g>";
  }
  // i numeri (in pianta o su una faccia): centrati in (x, y), alti h, col tratto largo w
  var CIFRE = {
    "0": "M2,0C3.9,0 4,2 4,3S3.9,6 2,6S0,4 0,3S.1,0 2,0Z", "1": "M.9,1.3L2.5,0V6", "2": "M.3,1.3C.6,-.3 3.7,-.4 3.7,1.6C3.7,3.2 .9,4.2 .2,6H3.8",
    "3": "M.4,.6C1.4,-.3 3.6,0 3.5,1.5C3.4,2.6 2.4,2.8 1.5,2.8C2.6,2.8 3.9,3.2 3.8,4.5C3.6,6.3 1,6.4 .2,5.3", "4": "M3,6V0L.1,4.3H3.9",
    "5": "M3.6,0H.9L.6,2.6C1.6,2 3.8,2.2 3.8,4.1C3.8,6.3 1,6.4 .3,5.2", "6": "M3.4,.6C1.6,-.6 .2,1.4 .3,3.6C.4,6.3 3.7,6.4 3.7,4.1C3.7,2.3 1,2 .4,3.6",
    "7": "M.2,0H3.8L1.5,6", "8": "M2,2.9C.5,2.9 .4,0 2,0S3.5,2.9 2,2.9C.2,2.9 .1,6 2,6S3.8,2.9 2,2.9Z", "9": "M3.6,2.4C3,4 .3,3.8 .3,1.9S1.3,0 2,0S3.7,.4 3.7,2.4C3.7,4.4 2.8,6.6 .6,5.6"
  };
  function numero(str, x, y, h, col, w) {
    var k = h / 6, cw = 4 * k, gap = 1.2 * k, n = str.length, tot = n * cw + (n - 1) * gap, o = "", i;
    for (i = 0; i < n; i++) o += "<path d='" + CIFRE[str[i]] + "' transform='translate(" + f2(x - tot / 2 + i * (cw + gap)) + " " + f2(y - h / 2) + ") scale(" + f2(k) + ")' fill='none' stroke='" + col + "' stroke-width='" + f2(w / k) + "' stroke-linecap='round' stroke-linejoin='round'/>";
    return o;
  }
  // una "scritta" finta: trattini come lettere viste da lontano (niente lettere vere, che allo specchio verrebbero al contrario)
  function scritta(x, y, w, h, col, seme2) {
    var r = rnd(seme2 || 7), o = "", xx = x - w / 2, fine = x + w / 2;
    while (xx < fine - h * .4) { var l = Math.min(fine - xx, h * (.5 + r() * 1.6)); o += rett(xx, y - h / 2, l, h, h / 2, col); xx += l + h * (.45 + r() * .5); }
    return o;
  }
  // i dadi: la faccia (centro x, y, lato s) e il dado in piedi
  var PUNTI = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  function facciaDado(n, x, y, s, fondo, punto, cinese, bordino) {   // cinese: l'uno e il quattro coi puntini rossi (come i dadi del Sic Bo)
    var o = rett(x - s / 2, y - s / 2, s, s, s * .2, fondo, bordino ? "stroke='" + bordino + "' stroke-width='" + f2(s * .06) + "'" : ""), d = s * .26, r = s * .095;
    PUNTI[n].forEach(function (v) { o += cer(x + v[0] * d, y + v[1] * d, n === 1 ? r * 1.6 : r, cinese && (n === 1 || n === 4) ? "#d6283b" : punto); });
    return o;
  }
  function dado(a, b, z, s, col, punto, facce, cinese) {   // facce = [sopra, davanti, fianco]
    function f(n) { return function (W, H) { return facciaDado(n, W / 2, H / 2, Math.min(W, H) * .92, "none", punto, cinese); }; }
    var o = blocco(a - s / 2, a + s / 2, b - s / 2, b + s / 2, z, z + s * 61, col, { davanti: f(facce[1]), dietro: f(7 - facce[1]), fianco: f(facce[2]),
      sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, facciaDado(facce[0], W / 2, H / 2, Math.min(W, H) * .92, "none", punto, cinese)); } }, .8);
    var t = P(a - s * .3, b - s * .3, z + s * 61);
    return o + ell(t[0] - .4, t[1] + .2, s * 9, s * 4, "#ffffff", op(.35));
  }
  // il vassoio delle fiches del croupier, incassato nel panno (in pianta): le file di fiches coricate, una per colore
  function vassoioP(a0, a1, b0, b1, colori) {
    var X0 = a0 * 61, X1 = a1 * 61, Y0 = b0 * 61, Y1 = b1 * 61, n = colori.length, w = (X1 - X0) / n, o = "", i, y;
    o += rett(X0 - 1.4, Y0 - 1.4, X1 - X0 + 2.8, Y1 - Y0 + 2.8, 1.6, "#1a1210", "stroke='" + L + "' stroke-width='.6'");
    o += rett(X0 - .7, Y0 - .7, X1 - X0 + 1.4, Y1 - Y0 + 1.4, 1, "#0d0b0c");
    for (i = 0; i < n; i++) {
      var c = colori[i], x = X0 + i * w + .3, ww = w - .6;
      o += rett(x, Y0, ww, Y1 - Y0, ww / 2, nuova([[0, chiaro(c, .5)], [.35, c], [1, scuro(c, .5)]], 0, 0, 1, 0));
      for (y = Y0 + 1.3; y < Y1 - .8; y += 1.25) o += "<path d='M" + f2(x + .2) + "," + f2(y) + " H" + f2(x + ww - .2) + "' stroke='" + scuro(c, .55) + "' stroke-width='.22' opacity='.6'/>";
      o += "<path d='M" + f2(x + ww * .5) + "," + f2(Y0 + .9) + " V" + f2(Y1 - .9) + "' stroke='" + (c === FICHE.bianca ? "#1c7ed6" : "#ffffff") + "' stroke-width='.45' stroke-dasharray='.5 .75' opacity='.85'/>";
    }
    return o + rett(X0 - .7, Y0 - .7, X1 - X0 + 1.4, 1.2, .6, "#000000", op(.35));
  }
  // il sabot: la scatola delle carte (plastica rossa scura), piena di carte, con la carta che esce davanti
  function sabot(a, b, z) {
    var s = blocco(a - .07, a + .07, b - .12, b + .09, z, z + 6.5, "#7a1424", {
      sopra: function (A, B, C, D, W, H) { var o = rett(W * .12, H * .1, W * .76, H * .78, 1, "#f4f1ea"), i; for (i = 1; i < 9; i++) o += rett(W * .12, H * .1 + i * H * .085, W * .76, .5, 0, "#c9c2b5", op(.8)); return piano(A, B, D, W, H, o + rett(0, 0, W, H, 0, "#ffffff", op(.12))); },
      davanti: function (W, H) { return rett(W * .15, H * .2, W * .7, H * .5, 1, "#1c1416") + rett(W * .25, H * .35, W * .5, H * .12, .5, "#f4f1ea"); },
      dietro: function (W, H) { return rett(0, H * .15, W, 1, 0, "#ffffff", op(.25)); }
    }, 1.2);
    var c1 = P(a - .04, b + .1, z + .4), c2 = P(a + .04, b + .1, z + .4), c3 = P(a + .04, b + .16, z + .2), c4 = P(a - .04, b + .16, z + .2);
    return s + poly([c1, c2, c3, c4], "#fbfaf5", bordo("#8f897e", .4));
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  var VERDE = "#177a47", CUOIO_NERO = "#2b2427", CUOIO_BRUNO = "#41231a", CUOIO_ROSSO = "#6d1a29", MOGANO = "#7d3519";
  function colori8() { return [FICHE.viola, FICHE.nera, FICHE.nera, FICHE.verde, FICHE.verde, FICHE.rossa, FICHE.rossa, FICHE.rossa, FICHE.bianca, FICHE.bianca]; }

  // =========================================================
  //  ROULETTE (il simbolo di Monte-Carlo): il tavolo lungo sulle sei gambe tornite, la fascia di mogano con l'oro,
  //  il bordo di cuoio; sul panno verde la griglia dei numeri rossi e neri con lo zero verde, le dozzine e le chance,
  //  il rastrello del croupier; il cilindro di mogano con l'ottone, i 37 numeri, la croce d'ottone e la pallina
  // =========================================================
  var ROSSI = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var RUOTA = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var ROSSO = "#d42a2a", NERO = "#1f1f25", VERDE0 = "#1fa35a", BIANCO = "#f6f1e3";
  function colNum(n) { return n === 0 ? VERDE0 : (ROSSI.indexOf(n) >= 0 ? ROSSO : NERO); }
  var RL = { W: .108, A0: .135, B: [-.2, -.035, .13, .295, .45, .605] };   // la griglia: larghezza di una colonna, dove comincia (vicino allo zero), le righe (da dietro)
  function cellaRoulette(n) { var k = Math.floor((n - 1) / 3), r = 2 - (n - 1) % 3; return [RL.A0 - (k + .5) * RL.W, (RL.B[r] + RL.B[r + 1]) / 2]; }
  function tappetoRoulette() {
    var o = "", W = RL.W, A0 = RL.A0, B = RL.B, k, r, M = 61, lw = "stroke='" + BIANCO + "' stroke-width='.55'";
    function R(a0, b0, a1, b1, fill) { return rett(Math.min(a0, a1) * M, Math.min(b0, b1) * M, Math.abs(a1 - a0) * M, Math.abs(b1 - b0) * M, 0, fill, lw); }
    for (k = 0; k < 12; k++) for (r = 0; r < 3; r++) {   // i numeri: rossi e neri, col numero bianco
      var n = 3 * k + 3 - r, a1 = A0 - k * W, a0 = a1 - W;
      o += R(a0, B[r], a1, B[r + 1], colNum(n)) + numero(String(n), (a0 + a1) / 2 * M, (B[r] + B[r + 1]) / 2 * M, 3.4, BIANCO, .5);
    }
    o += pth(chiusoP([[A0, B[0]], [A0 + .1, B[0]], [A0 + .16, (B[0] + B[3]) / 2], [A0 + .1, B[3]], [A0, B[3]]]), VERDE0, lw) + numero("0", (A0 + .07) * M, (B[0] + B[3]) / 2 * M, 3.8, BIANCO, .55);   // lo zero, a punta verso il cilindro
    var AE = A0 - 12 * W;
    for (r = 0; r < 3; r++) o += R(AE - .13, B[r], AE, B[r + 1], "none") + scritta((AE - .065) * M, (B[r] + B[r + 1]) / 2 * M, 4.4, .7, BIANCO, 30 + r);   // "2 a 1"
    for (k = 0; k < 3; k++) {   // le dozzine: uno, due, tre puntini
      var d1 = A0 - 4 * k * W, d0 = d1 - 4 * W;
      o += R(d0, B[3], d1, B[4], "none");
      for (r = 0; r <= k; r++) o += cer(((d0 + d1) / 2 + (r - k / 2) * .035) * M, (B[3] + B[4]) / 2 * M, .9, BIANCO);
    }
    for (k = 0; k < 6; k++) {   // le chance: 1-18, pari, rosso, nero, dispari, 19-36
      var c1 = A0 - 2 * k * W, c0 = c1 - 2 * W, cx = (c0 + c1) / 2 * M, cy = (B[4] + B[5]) / 2 * M;
      o += R(c0, B[4], c1, B[5], "none");
      if (k === 2 || k === 3) o += pth("M" + q2(cx - 5, cy) + " L" + q2(cx, cy - 3.4) + " L" + q2(cx + 5, cy) + " L" + q2(cx, cy + 3.4) + " Z", k === 2 ? ROSSO : NERO, "stroke='" + BIANCO + "' stroke-width='.45'");
      else o += scritta(cx, cy, 7, .9, BIANCO, 40 + k);
    }
    o += rett((AE - .13) * M - 1.2, B[0] * M - 1.2, (A0 + .17 - AE + .13) * M + 2.4, (B[5] - B[0]) * M + 2.4, 1.5, "none", "stroke='" + BIANCO + "' stroke-width='.4' opacity='.7'");   // il filo intorno
    // il rastrello del croupier (il râteau), posato sul panno
    var ra = [-1.18, -.47], rb = [-.5, -.42];
    o += "<path d='M" + q2(ra[0] * M, ra[1] * M + 1) + " L" + q2(rb[0] * M, rb[1] * M + 1) + "' stroke='#000' stroke-width='1.6' opacity='.25' stroke-linecap='round'/>";
    o += "<path d='M" + q2(ra[0] * M, ra[1] * M) + " L" + q2(rb[0] * M, rb[1] * M) + "' stroke='#c08a4f' stroke-width='1.3' stroke-linecap='round'/>";
    o += rett(rb[0] * M - .6, rb[1] * M - 4.2, 1.6, 8.4, .6, "#a8743e", "stroke='" + L + "' stroke-width='.35' transform='rotate(4 " + f2(rb[0] * M) + " " + f2(rb[1] * M) + ")'");
    return o;
  }
  // il cilindro: la conca di mogano con l'anello d'ottone, la pista della pallina coi rombi d'ottone, la ruota coi 37 numeri,
  // le caselle, il cono di legno, la croce d'ottone (la "torretta") e la pallina d'avorio
  function cilindro(ca, cb, z0) {
    var R0 = .44, R1 = .398, R2 = .338, R3 = .3, R4 = .222, ZR = z0 + 7.5, ZT = ZR - 1.3, ZN = ZR - 2, ZP = ZR - 2.7, s = "", i;
    function C(R, z) { var c = P(ca, cb, z); return [c[0], c[1], R * 70.71, R * 35.36]; }
    function E(R, z) { var c = C(R, z); return dEll(c[0], c[1], c[2], c[3]); }
    function meta(R, z) { var c = C(R, z), o = [], k; for (k = 0; k <= 24; k++) { var t = Math.PI * k / 24; o.push([c[0] + c[2] * Math.cos(t), c[1] + c[3] * Math.sin(t)]); } return o; }
    // la conca: il fianco di mogano laccato (la metà davanti), col filo d'ottone in alto e in basso
    s += corpo([giro(forma(ca, cb, R0), z0 + .2, 1, 64), giro(forma(ca, cb, R0), ZR, 1, 64)], [[0, "#c88356"], [.22, "#9a4a24"], [.55, "#6a2a12"], [1, "#2e1006"]], 1.6);
    s += tratto(aperto(meta(R0, ZR - 1)), ORO, 1.5) + tratto(aperto(meta(R0, ZR - 1.3)), ORO_C, .5, op(.9)) + tratto(aperto(meta(R0, z0 + 1.6)), ORO, 1, op(.9));
    s += tratto(aperto(meta(R0, (ZR + z0) / 2).slice(15, 23)), "#ffffff", 1.2, op(.4));   // il lucido della lacca
    // il bordo di sopra (mogano lucido) e la pista inclinata dove gira la pallina
    s += pth(E(R0, ZR) + " " + E(R1, ZR), nuova([[0, "#b8693e"], [.5, "#7d3519"], [1, "#4a1c0b"]], 0, 0, 1, 1), "fill-rule='evenodd' " + bordo(L, 1.2));
    s += pth(E(R1, ZR) + " " + E(R2, ZT), nuova([[0, "#e0b07c"], [.5, "#b97a45"], [1, "#7e4720"]], 0, 0, 1, 1), "fill-rule='evenodd' stroke='" + L + "' stroke-width='.6'");
    s += tratto(E(R1 - .006, ZR - .2), "#fff3dc", .5, op(.55));
    for (i = 0; i < 8; i++) {   // i rombi d'ottone sulla pista (dritti e di traverso)
      var t = i / 8 * 2 * Math.PI + .2, rr = (R1 + R2) / 2 - .005, cx = ca + rr * Math.cos(t), cy = cb + rr * Math.sin(t), ux = Math.cos(t), uy = Math.sin(t), lx = -uy, ly = ux, al = i % 2 ? .022 : .012, tr = i % 2 ? .009 : .016;
      s += poly([P(cx + ux * al, cy + uy * al, ZT + .9), P(cx + lx * tr, cy + ly * tr, ZT + 1.4), P(cx - ux * al, cy - uy * al, ZT + .9), P(cx - lx * tr, cy - ly * tr, ZT + 1.4)], ORO_C, bordo(ORO_S, .35));
    }
    // la ruota: i 37 numeri (l'anello di fuori) e le caselle dove cade la pallina, divise dai separatori
    var celle = "", tasche = "", n = RUOTA.length, a0 = -Math.PI / 2;
    for (i = 0; i < n; i++) {
      var t0 = a0 + i / n * 2 * Math.PI, t1 = a0 + (i + 1) / n * 2 * Math.PI, tm = (t0 + t1) / 2, col = colNum(RUOTA[i]);
      celle += pth(chiusoP([[ca + R2 * Math.cos(t0), cb + R2 * Math.sin(t0)], [ca + R2 * Math.cos(tm), cb + R2 * Math.sin(tm)], [ca + R2 * Math.cos(t1), cb + R2 * Math.sin(t1)], [ca + R3 * Math.cos(t1), cb + R3 * Math.sin(t1)], [ca + R3 * Math.cos(t0), cb + R3 * Math.sin(t0)]]), col);
      tasche += pth(chiusoP([[ca + R3 * Math.cos(t0), cb + R3 * Math.sin(t0)], [ca + R3 * Math.cos(t1), cb + R3 * Math.sin(t1)], [ca + R4 * Math.cos(t1), cb + R4 * Math.sin(t1)], [ca + R4 * Math.cos(t0), cb + R4 * Math.sin(t0)]]), scuro(col, .25));
      celle += cer((ca + (R2 + R3) / 2 * Math.cos(tm)) * 61, (cb + (R2 + R3) / 2 * Math.sin(tm)) * 61, .38, "#f6f1e3", op(.85));   // il numero (da lontano un puntino)
    }
    s += suZ(ZN, celle) + suZ(ZP, tasche);
    s += pth(E(R2, ZN), "none", "stroke='" + ORO + "' stroke-width='.7'") + pth(E(R3, ZN), "none", "stroke='" + ORO_C + "' stroke-width='.45'");
    var sep = "";
    for (i = 0; i < n; i++) { var ts = a0 + i / n * 2 * Math.PI; sep += "M" + q(P(ca + R4 * Math.cos(ts), cb + R4 * Math.sin(ts), ZP + .9)) + " L" + q(P(ca + R2 * Math.cos(ts), cb + R2 * Math.sin(ts), ZN + .1)) + " "; }
    s += tratto(sep, "#dfe4e8", .45, op(.9));
    // il cono di legno lucido al centro, con l'anello d'ottone
    s += corpo([giro(forma(ca, cb, R4), ZP, 1, 48), giro(forma(ca, cb, R4 * .55), ZP + 1.6, 1, 40), giro(forma(ca, cb, .07), ZR + .4, 1, 24)], [[0, "#e5b47a"], [.35, "#b06a34"], [.7, "#7a3a16"], [1, "#401806"]], .9);
    s += pth(E(R4 * .72, ZP + 1), "none", "stroke='" + ORO + "' stroke-width='.6' opacity='.9'");
    for (i = 0; i < 4; i++) {   // i quattro raggi d'ottone sul cono
      var tr2 = i * Math.PI / 2 + Math.PI / 4;
      s += tratto(linea(P(ca + .07 * Math.cos(tr2), cb + .07 * Math.sin(tr2), ZR + .2), P(ca + R4 * .95 * Math.cos(tr2), cb + R4 * .95 * Math.sin(tr2), ZP + .3)), ORO, .9, op(.95));
    }
    // la torretta d'ottone: il perno e la croce coi pomelli (prima i bracci lontani, poi il perno, poi quelli vicini)
    var bracci = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(function (v) { return { v: vicino(v[0], v[1]), d: v }; }).sort(function (x, y) { return x.v - y.v; });
    var ZC = ZR + 5.6, LB = .095;
    function braccio(v) { var e = P(ca + v[0] * LB, cb + v[1] * LB, ZC); return ottone(linea(P(ca, cb, ZC), e), .9) + pallina(e, 1.25, ORO, .5); }
    s += bracci.filter(function (x) { return x.v < 0; }).map(function (x) { return braccio(x.d); }).join("");
    s += tornito(ca, cb, [[ZR, .03], [ZR + .8, .024], [ZR + 1.2, .014], [ZC - .6, .012], [ZC, .02], [ZC + .6, .012], [ZC + 2.2, .009]], OTTONE, .7, null, .5) + pallina(P(ca, cb, ZC + 2.5), 1.1, ORO, .5);
    s += bracci.filter(function (x) { return x.v >= 0; }).map(function (x) { return braccio(x.d); }).join("");
    // la pallina d'avorio in una casella (dalla parte di chi guarda)
    var tb = (G > 0 ? .85 : .85 + Math.PI), rp = (R3 + R4) / 2 + .01, cp = P(ca + rp * Math.cos(tb), cb + rp * Math.sin(tb), ZP + 1.1);
    return s + ell(cp[0] + .5, cp[1] + .6, 1.6, .7, "#000", op(.35)) + pallina(cp, 1.35, "#fbf8ee", .5);
  }
  def("tavolo_roulette", { nome: "Tavolo della roulette", fp: [3, 2], box: [-120, -106, 128, 65], dietro: true, piano: 45,
    posti: [[-1, 0], [-1, 1], [0, 2], [1, 2], [2, 2]], croupier: [2, -1] }, function () {
    var O = pRett(-1.44, 1.44, -.86, .9, .2, 7), ZF = 45, Z0 = 33, Z1 = 44.4, s = ombraForma(O, 1), l = [];
    var gambe = [[-1.22, -.6], [0, -.6], [1.22, -.6], [-1.22, .64], [0, .64], [1.22, .64]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
    s += gambe.map(function (g) { return gambaTornita(g[0], g[1], Z0 + .5); }).join("");
    s += grembiule(allarga(O, -.035), Z0, Z1, MOGANO);
    s += panno(allarga(O, -.12), ZF, VERDE, tappetoRoulette());
    s += tubo(allarga(O, -.07), ZF + 1.9, 4.3, CUOIO_NERO, { cucitura: true });
    // il cilindro, le fiches del croupier e le puntate dei giocatori (colori della roulette: ognuno il suo)
    l.push([vicino(.875, 0), cilindro(.875, 0, ZF)]);
    var banco = [FICHE.rosa, FICHE.gialla, FICHE.azzurra, FICHE.verde, FICHE.arancio, FICHE.viola, FICHE.rossa];   // il banco del croupier: le pile in fila, tutte uguali
    banco.forEach(function (c, i) { var a = -.5 + i * .09, b = -.6; l.push([vicino(a, b), fiches(a, b, ZF, 7, c, .04)]); });
    [[17, FICHE.gialla, 3], [5, FICHE.rosa, 2], [32, FICHE.azzurra, 4], [26, FICHE.verde, 2], [11, FICHE.arancio, 3]].forEach(function (x) { var c = cellaRoulette(x[0]); l.push([vicino(c[0], c[1]), fiches(c[0], c[1], ZF, x[2], x[1], .037)]); });
    [[-.25, .53, FICHE.rosa, 3], [-.6, .37, FICHE.azzurra, 2]].forEach(function (x) { l.push([vicino(x[0], x[1]), fiches(x[0], x[1], ZF, x[3], x[2], .037)]); });
    return s + ordina(l);
  });

  // =========================================================
  //  BLACK JACK: la mezzaluna; il bordo di cuoio solo dalla parte dei giocatori, dalla parte del croupier il legno lucido
  //  col vassoio delle fiches incassato; sul panno verde le scritte ad arco (finte, d'oro), i cinque cerchi delle puntate,
  //  il sabot delle carte alla sinistra del croupier, le carte e le fiches della mano in corso
  // =========================================================
  def("tavolo_blackjack", { nome: "Tavolo del Black Jack", fp: [2, 2], box: [-94, -93, 102, 52], dietro: true, piano: 45,
    posti: [[-1, 0], [-1, 1], [0, 2], [1, 2], [2, 1]], croupier: [1, -1] }, function () {
    var O = pMezzaluna(-.95, .95, -.82, -.2, .9, .1), ZF = 45, Z0 = 32, Z1 = 45.2, s = ombraForma(O, 1), l = [], CB = [0, -.2], RA = .95, RB = 1.1;
    var col = [[-.66, -.6], [.66, -.6], [-.5, .36], [.5, .36]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
    s += col.map(function (g) { return gambaTornita(g[0], g[1], Z0 + .5); }).join("");
    s += grembiule(allarga(O, -.035), Z0, Z1, MOGANO, { passo: .055 });
    var Pn = allarga(O, -.11);
    s += anelloP(O, Pn, Z1, nuova([[0, "#b8693e"], [.5, "#7d3519"], [1, "#4a1c0b"]], 0, 0, 1, 1), bordo(L, 1.2));   // il piano di legno (si vede dalla parte del croupier)
    function ar(k, t) { var c = Math.cos(t), s2 = Math.sin(t); return [CB[0] + RA * k * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / 2.2), CB[1] + RB * k * Math.pow(Math.max(0, s2), 2 / 2.2)]; }
    function arco(k, t0, t1) { var o = [], i; for (i = 0; i <= 40; i++) o.push(ar(k, t0 + (t1 - t0) * i / 40)); return o; }
    var tap = "", i, M = 61;
    // la fascia dell'assicurazione (due fili d'oro con la scritta in mezzo) e la scritta grande ad arco
    tap += "<path d='" + aperto(arco(.47, .32, Math.PI - .32).map(function (x) { return [x[0] * M, x[1] * M]; })) + "' fill='none' stroke='" + ORO + "' stroke-width='.7'/>";
    tap += "<path d='" + aperto(arco(.39, .36, Math.PI - .36).map(function (x) { return [x[0] * M, x[1] * M]; })) + "' fill='none' stroke='" + ORO + "' stroke-width='.7'/>";
    for (i = 0; i < 22; i++) { var tt = .45 + i / 21 * (Math.PI - .9), pa = ar(.43, tt), pb = ar(.43, tt + .035); tap += "<path d='M" + q2(pa[0] * M, pa[1] * M) + " L" + q2(pb[0] * M, pb[1] * M) + "' stroke='" + ORO_C + "' stroke-width='1' stroke-linecap='round' opacity='" + (i % 5 === 4 ? 0 : .85) + "'/>"; }
    for (i = 0; i < 30; i++) { var t3 = .5 + i / 29 * (Math.PI - 1), pc = ar(.6, t3), pd = ar(.6, t3 + .028); tap += "<path d='M" + q2(pc[0] * M, pc[1] * M) + " L" + q2(pd[0] * M, pd[1] * M) + "' stroke='" + BIANCO + "' stroke-width='1.4' stroke-linecap='round' opacity='" + (i % 7 === 6 || i === 14 ? 0 : .8) + "'/>"; }
    // i cinque cerchi delle puntate, coi posti numerati da un puntino d'oro
    var cerchi = [2.75, 2.2, 1.5708, .94, .39].map(function (t) { return ar(.8, t); });
    cerchi.forEach(function (c) { tap += cer(c[0] * M, c[1] * M, .075 * M, "none", "stroke='" + BIANCO + "' stroke-width='.8'") + cer(c[0] * M, c[1] * M, .058 * M, "none", "stroke='" + ORO + "' stroke-width='.4' stroke-dasharray='1 .8'"); });
    tap += vassoioP(-.34, .34, -.79, -.61, colori8());
    // le carte: quelle del croupier, e quelle dei giocatori davanti ai cerchi
    tap += cartaP(-.05, -.42, -4, "picche", true) + cartaP(.06, -.43, 5, "cuori", false);
    [[1, "cuori", "fiori"], [2, "quadri", "picche"], [4, "fiori", "cuori"]].forEach(function (x, j) {
      var c = cerchi[x[0]], v = [c[0] * .78, (c[1] - CB[1]) * .78 + CB[1]];
      tap += cartaP(v[0] - .025, v[1], -8 + j * 6, x[1], true) + cartaP(v[0] + .03, v[1] - .015, 6 + j * 4, x[2], true);
    });
    s += panno(Pn, ZF, VERDE, tap);
    var dorso = O.dorso;
    s += tubo(allarga(O, -.065).slice(0, dorso + 1), ZF + 1.8, 4.2, CUOIO_BRUNO, { aperto: true, cucitura: true });
    l.push([vicino(.6, -.5), sabot(.6, -.52, ZF)]);
    l.push([vicino(-.6, -.5), blocco(-.68, -.53, -.6, -.42, ZF, ZF + 3.2, "#f1e9dc", { sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, rett(W * .1, H * .1, W * .8, H * .8, 1, "#b3202f") + rett(W * .2, H * .2, W * .6, H * .6, .5, "none", "stroke='#f5c6cb' stroke-width='.6'")); } }, 1)]);   // le carte già giocate
    [[0, FICHE.rossa, 4], [1, FICHE.verde, 3], [2, FICHE.nera, 2], [3, FICHE.rossa, 5], [4, FICHE.viola, 2]].forEach(function (x) { var c = cerchi[x[0]]; l.push([vicino(c[0], c[1]), fiches(c[0], c[1], ZF, x[2], x[1])]); });
    l.push([vicino(-.72, .3), fiches(-.72, .32, ZF, 3, FICHE.verde, .04)]);
    return s + ordina(l);
  });

  // =========================================================
  //  POKER: l'ovale sulle due colonne, il bordo di cuoio nero, la pista di noce lucido, il panno verde col filo d'oro,
  //  i semi d'oro alle due punte; in mezzo le carte comuni e il piatto, le carte coperte e le fiches dei giocatori, il bottone del mazziere
  // =========================================================
  def("tavolo_poker", { nome: "Tavolo da poker", fp: [3, 2], box: [-101, -97, 109, 55], dietro: true, piano: 45,
    posti: [[-1, 0], [-1, 1], [0, 2], [1, 2], [2, 2], [3, 1], [3, 0], [2, -1], [0, -1]], croupier: [1, -1] }, function () {
    var O = pOvale(0, .02, 1.45, .88, 2.6, 140), ZF = 45, Z0 = 33, Z1 = 44.4, s = ombraForma(O, 1), l = [], M = 61;
    var piedi = [[-.78, 0], [.78, 0]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
    s += piedi.map(function (g) {
      var st = [[0, "#b77a4c"], [.3, "#7a4424"], [.7, "#4a2410"], [1, "#220e05"]];   // le colonne di noce scuro, col collare d'ottone
      return tornito(g[0], g[1], [[0, .3], [2.5, .3], [3.6, .25], [4.6, .17], [6, .12], [8, .1], [27, .085], [30, .11], [Z0, .16]], st, 1.4, [1, 2, 7], 1) +
        tornito(g[0], g[1], [[4.2, .165], [4.9, .15], [5.6, .125]], OTTONE, .7) + tornito(g[0], g[1], [[25.6, .09], [27.4, .095]], OTTONE, .7);
    }).join("");
    s += grembiule(allarga(O, -.035), Z0, Z1, "#3a2316", { passo: .065 });
    var tap = "", Pn = allarga(O, -.2);
    tap += "<path d='" + chiuso(allarga(O, -.36).map(function (x) { return [x[0] * M, x[1] * M]; })) + "' fill='none' stroke='" + ORO + "' stroke-width='.8' stroke-dasharray='3 1.6' opacity='.9'/>";   // la linea delle puntate
    [-1, 1].forEach(function (sg) { tap += "<g opacity='.85'>" + seme("picche", sg * .92 * M, .02 * M, 2.4).replace("fill='#1d1d22'", "fill='none' stroke='" + ORO + "' stroke-width='.35'") + "</g>"; });
    tap += vassoioP(-.3, .3, -.74, -.58, colori8());
    [["cuori", true, -.26], ["picche", true, -.13], ["quadri", true, 0], ["fiori", true, .13], ["cuori", false, .26]].forEach(function (x) { tap += cartaP(x[2], -.16, 0, x[0], x[1]); });   // le carte comuni
    [[-.98, .3, 20], [-.35, .58, 4], [.42, .58, -6], [1.02, .28, -22], [.95, -.42, 200], [-.8, -.45, 160]].forEach(function (x) { tap += cartaP(x[0] - .03, x[1], x[2] - 6, "cuori", false) + cartaP(x[0] + .03, x[1] + .01, x[2] + 6, "cuori", false); });   // le carte coperte dei giocatori
    s += panno(Pn, ZF, "#127a49", tap);
    // la pista di noce lucido tra il bordo e il panno
    var est = allarga(O, -.105), int = allarga(O, -.2), bs = limiti(aSchermo(est, ZF + .6));
    s += anelloP(est, int, ZF + .6, nuova([[0, "#c08350"], [.45, "#8a5228"], [1, "#4f2a12"]], bs[0], 0, bs[2], 0, true), "stroke='" + L + "' stroke-width='.7'");
    s += tratto(chiuso(aSchermo(allarga(O, -.135), ZF + .6)), "#ffe2b8", .5, op(.45)) + tratto(chiuso(aSchermo(int, ZF + .6)), "#2a160a", .6, op(.7));
    s += tubo(allarga(O, -.06), ZF + 2, 4.4, CUOIO_NERO, { cucitura: true });
    // il piatto in mezzo, le fiches dei giocatori, il bottone del mazziere
    [[-.08, .12, FICHE.rossa, 5], [.04, .1, FICHE.verde, 4], [-.02, .2, FICHE.nera, 6], [.11, .19, FICHE.blu, 3], [-.15, .21, FICHE.bianca, 4]].forEach(function (x) { l.push([vicino(x[0], x[1]), fiches(x[0], x[1], ZF, x[3], x[2])]); });
    [[-.98, .5, FICHE.rossa, 7], [-.9, .46, FICHE.nera, 3], [-.38, .4, FICHE.verde, 5], [.4, .4, FICHE.blu, 6], [.48, .44, FICHE.rossa, 2], [1.0, .1, FICHE.nera, 8], [.92, -.24, FICHE.verde, 4], [-.82, -.27, FICHE.viola, 5]].forEach(function (x) { l.push([vicino(x[0], x[1]), fiches(x[0], x[1], ZF, x[3], x[2])]); });
    var bt = P(-.2, .45, ZF);
    l.push([vicino(-.2, .45), corpo([giro(forma(-.2, .45, .045), ZF, 1, 24), giro(forma(-.2, .45, .045), ZF + 1.6, 1, 24)], [[0, "#ffffff"], [.6, "#e9ecef"], [1, "#adb5bd"]], .6) + pth(chiuso(giro(forma(-.2, .45, .045), ZF + 1.6, 1, 24)), "#fbfbf8", bordo(L, .6)) + pth(chiuso(giro(forma(-.2, .45, .045), ZF + 1.6, .55, 20)), "none", "stroke='#1d1d22' stroke-width='.6'") + cer(bt[0], bt[1] - 1.6, .5, "#1d1d22")]);
    return s + ordina(l);
  });

  // =========================================================
  //  BACCARAT (la sala VIP): il tavolo a fagiolo con l'incavo per il croupier, le gambe dorate a cabriolè,
  //  la fascia di mogano con l'oro, il bordo di cuoio bordeaux col cordoncino d'oro; sul panno blu notte le fasce
  //  del giocatore, del banco e del pareggio coi posti numerati, le caselle delle commissioni, le carte delle due mani
  // =========================================================
  def("tavolo_baccarat", { nome: "Tavolo del baccarat", fp: [3, 2], box: [-97, -97, 104, 52], dietro: true, piano: 45,
    posti: [[-1, 0], [-1, 1], [0, 2], [1, 2], [2, 2], [3, 1], [3, 0]], croupier: [1, -1] }, function () {
    var O = pRene(1.45, .9, .86, 2.4, .3, .58, 180), ZF = 45, Z0 = 33, Z1 = 44.4, s = ombraForma(O, 1), l = [], M = 61, i;
    var gambe = [[-1.12, -.5, -1, -.5], [1.12, -.5, 1, -.5], [-1.12, .52, -1, .6], [1.12, .52, 1, .6], [-.42, .68, -.3, 1], [.42, .68, .3, 1]];
    gambe.sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
    s += gambe.map(function (g) { var l2 = Math.sqrt(g[2] * g[2] + g[3] * g[3]); return cabriole(g[0], g[1], Z0 + .5, g[2] / l2, g[3] / l2, .09, 2.8); }).join("");
    s += grembiule(allarga(O, -.035), Z0, Z1, "#6e2a14", { passo: .06 });
    var tap = "", CB = [0, -.32];
    function el(k, t) { return [CB[0] + 1.25 * k * Math.cos(t), CB[1] + 1.12 * k * Math.sin(t)]; }
    function fascia(k0, k1, fill) { var o = [], j; for (j = 0; j <= 40; j++) o.push(el(k0, .12 + j / 40 * (Math.PI - .24))); for (j = 40; j >= 0; j--) o.push(el(k1, .12 + j / 40 * (Math.PI - .24))); return pth(chiusoP(o), fill, "stroke='" + ORO + "' stroke-width='.6'"); }
    tap += fascia(.98, .86, "#2b7a58") + fascia(.86, .73, "#9e2a3a") + fascia(.73, .6, "#2f5fb3");   // pareggio, banco, giocatore
    for (i = 0; i <= 7; i++) { var tr = .12 + i / 7 * (Math.PI - .24), pa = el(.6, tr), pb = el(.98, tr); tap += "<path d='M" + q2(pa[0] * M, pa[1] * M) + " L" + q2(pb[0] * M, pb[1] * M) + "' stroke='" + ORO + "' stroke-width='.6'/>"; }
    for (i = 0; i < 7; i++) {   // nei posti: le scritte finte e il numero del posto dentro il cerchietto d'oro
      var tm = .12 + (i + .5) / 7 * (Math.PI - .24), c1 = el(.92, tm), c2 = el(.795, tm), c3 = el(.665, tm), cn = el(1.06, tm);
      [c1, c2, c3].forEach(function (c, j) { tap += "<g transform='translate(" + q2(c[0] * M, c[1] * M) + ") rotate(" + f1(tm * 180 / Math.PI - 90) + ")'>" + scritta(0, 0, 5.5, .8, j ? "#f6f1e3" : ORO_C, 50 + i * 3 + j) + "</g>"; });
      tap += cer(cn[0] * M, cn[1] * M, 2.4, "none", "stroke='" + ORO + "' stroke-width='.6'") + numero(String(i + 1), cn[0] * M, cn[1] * M, 2.4, ORO_C, .45);
    }
    for (i = 0; i < 7; i++) tap += rett((-.42 + i * .12) * M - 2.6, -.43 * M - 2.6, 5.2, 5.2, .6, "none", "stroke='" + ORO + "' stroke-width='.5'") + numero(String(i + 1), (-.42 + i * .12) * M, -.43 * M, 2.4, ORO_C, .4);   // le commissioni
    tap += rett(-.36 * M, -.27 * M, .3 * M, .17 * M, 1.2, "#2f5fb3", "stroke='" + ORO + "' stroke-width='.6' opacity='.85'") + rett(.06 * M, -.27 * M, .3 * M, .17 * M, 1.2, "#9e2a3a", "stroke='" + ORO + "' stroke-width='.6' opacity='.85'");   // le caselle delle carte: giocatore e banco
    tap += cartaP(-.26, -.185, -3, "quadri", true) + cartaP(-.16, -.185, 4, "fiori", true) + cartaP(.16, -.185, -4, "cuori", true) + cartaP(.26, -.185, 3, "picche", true);
    var pal = [[.36, -.5], [.05, .05]];   // la paletta del croupier, posata sul panno
    tap += "<path d='M" + q2(pal[0][0] * M + .4, pal[0][1] * M + .8) + " L" + q2(pal[1][0] * M + .4, pal[1][1] * M + .8) + "' stroke='#000' stroke-width='1.6' opacity='.25' stroke-linecap='round'/>" + "<path d='M" + q2(pal[0][0] * M, pal[0][1] * M) + " L" + q2(pal[1][0] * M, pal[1][1] * M) + "' stroke='#c8935a' stroke-width='1.2' stroke-linecap='round'/>" + ell(pal[1][0] * M, pal[1][1] * M, 2.4, 3.6, "#b07a43", "stroke='" + L + "' stroke-width='.35' transform='rotate(-27 " + f2(pal[1][0] * M) + " " + f2(pal[1][1] * M) + ")'");
    s += panno(allarga(O, -.11), ZF, "#1c2d6b", tap);
    s += tubo(allarga(O, -.065), ZF + 1.9, 4.3, CUOIO_ROSSO, { cucitura: false, oro: true });
    l.push([vicino(.66, -.42), sabot(.66, -.44, ZF)]);
    [[-.6, .32, FICHE.nera, 6], [-.5, .58, FICHE.viola, 3], [.3, .66, FICHE.gialla, 4], [.75, .45, FICHE.nera, 2], [1.0, .2, FICHE.viola, 5]].forEach(function (x) { l.push([vicino(x[0], x[1]), fiches(x[0], x[1], ZF, x[3], x[2])]); });
    [[-.62, -.5, FICHE.nera], [-.53, -.52, FICHE.viola], [-.71, -.48, FICHE.gialla]].forEach(function (x, j) { l.push([vicino(x[0], x[1]), fiches(x[0], x[1], ZF, 5 + j * 2, x[2])]); });
    return s + ordina(l);
  });

  // =========================================================
  //  CRAPS (i dadi): la vasca col bordo alto di mogano, il bracciolo di cuoio e la canalina delle fiches;
  //  dentro, le pareti di gomma a piramidi; sul panno verde il percorso delle puntate (linea del passaggio, campo,
  //  numeri, le puntate al centro coi dadi disegnati); i due dadi rossi e il bastone del croupier
  // =========================================================
  def("tavolo_craps", { nome: "Tavolo dei dadi (craps)", fp: [3, 2], box: [-117, -114, 125, 64], dietro: true, inPiedi: true,
    posti: [[-1, 0], [-1, 1], [0, 2], [1, 2], [2, 2], [3, 1], [3, 0]], croupier: [1, -1] }, function () {
    var O = pRett(-1.45, 1.45, -.86, .9, .3, 8), ZF = 44, ZW = 53, ZB = 30, s = ombraForma(O, 1.1), l = [], M = 61, i;
    var In = allarga(O, -.2);
    // la base: un mobile pieno di mogano scuro con lo zoccolo d'ottone
    s += fianco(allarga(O, -.26), 0, ZB, "#55230f", LACCA, { righe: [[1.6, ORO_S, 1.6, .9], [1.7, ORO, .9, 1], [ZB - 2, ORO_S, .8, .7]], extra: lesene(ZB) });
    // le pareti di dentro che si vedono (quelle lontane): la gomma nera a piramidi
    s += fianco(In, ZF, ZW, "#2a2a30", GOMMA, { dentro: true, lati: false, extra: function (vv) {
      var o = "";
      [ZF + 2.8, ZF + 6.4].forEach(function (zr, k) {
        o += lungoCorsa(vv, .07, function (a, b) {
          var c = P(a, b, zr), w = 2.3, h = 1.8;
          return poly([[c[0], c[1] - h], [c[0] + w, c[1]], [c[0], c[1] + h]], "#4a4b55") + poly([[c[0], c[1] - h], [c[0] - w, c[1]], [c[0], c[1] + h]], "#6d6f7c") + poly([[c[0], c[1] - h], [c[0] + w, c[1]], [c[0], c[1] + h], [c[0] - w, c[1]]], "none", "stroke='#15151a' stroke-width='.35'");
        });
      });
      return o;
    } });
    // il panno col disegno delle puntate (uguale dalle due parti)
    var tap = "", BI = "#f6f1e3", w5 = "stroke='" + BI + "' stroke-width='.6' fill='none'";
    function R(a0, b0, a1, b1, x) { var f = /fill='([^']*)'/.exec(x || ""); return rett(Math.min(a0, a1) * M, Math.min(b0, b1) * M, Math.abs(a1 - a0) * M, Math.abs(b1 - b0) * M, .8, f ? f[1] : "none", (x || w5).replace(/ ?fill='[^']*'/, "")); }   // (il colore di dentro, se c'è, va nel fill)
    function dadini(x, y, n1, n2, k) { return facciaDado(n1, x - 1.6 * k, y, 2.8 * k, "#fbfaf5", "#1d1d22") + facciaDado(n2, x + 1.6 * k, y, 2.8 * k, "#fbfaf5", "#1d1d22"); }
    [-1, 1].forEach(function (sg) {
      function A(v) { return sg * v; }
      var nums = ["4", "5", "6", "8", "9", "10"];
      for (i = 0; i < 6; i++) { var a0 = .42 + i * .113, a1 = a0 + .113; tap += R(A(a0), -.66, A(a1), -.42) + numero(nums[i], A((a0 + a1) / 2) * M, -.54 * M, 4.2, i === 2 || i === 3 ? "#ff6b6b" : BI, .55); }   // i numeri
      tap += R(A(.3), -.66, A(.42), -.42) + scritta(A(.36) * M, -.54 * M, 4.5, .8, BI, 61 + sg);   // non venire
      tap += R(A(.3), -.42, A(1.1), -.02) + scritta(A(.7) * M, -.22 * M, 18, 3.4, "#e03131", 70 + sg);   // venire (la scritta grande e rossa)
      tap += R(A(.3), -.02, A(1.1), .2);   // il campo, coi numeri 2 3 4 9 10 11 12 (il 2 e il 12 cerchiati)
      ["2", "3", "4", "9", "10", "11", "12"].forEach(function (nn, j) { var x = A(.37 + j * .108) * M; tap += numero(nn, x, .09 * M, 3, "#ffd43b", .5) + (j === 0 || j === 6 ? cer(x, .09 * M, 3, "none", "stroke='#ffd43b' stroke-width='.45'") : ""); });
      tap += R(A(.3), .2, A(.92), .31) + dadini(A(.86) * M, .255 * M, 6, 6, .7) + scritta(A(.55) * M, .255 * M, 10, .8, BI, 80 + sg);   // non passare
      tap += R(A(.3), .31, A(1.22), .52) + scritta(A(.7) * M, .415 * M, 16, 1.6, BI, 90 + sg);   // la linea del passaggio, davanti
      tap += R(A(1.1), -.66, A(1.22), .31) + R(A(.92), .2, A(1.1), .31, "stroke='" + BI + "' stroke-width='.5'");   // e lungo la testata
      tap += numero("6", A(.97) * M, .255 * M, 3, "#e03131", .55) + numero("8", A(1.05) * M, .255 * M, 3, "#e03131", .55);   // il 6 e l'8 grandi
    });
    // le puntate al centro: il sette, i doppi (coi dadi disegnati), le puntate di un tiro
    tap += R(-.28, -.42, .28, .52, "stroke='#e03131' stroke-width='1' fill='#156b40'") + R(-.24, -.38, .24, -.27, "stroke='" + BI + "' stroke-width='.5' fill='#c92a2a'") + scritta(0, -.325 * M, 12, 1.4, BI, 99);
    [[2, 2], [3, 3], [4, 4], [5, 5]].forEach(function (d, j) { var x = (j % 2 ? .12 : -.12) * M, y = (j < 2 ? -.18 : -.03) * M; tap += R(x / M - .11, y / M - .07, x / M + .11, y / M + .07, "stroke='" + BI + "' stroke-width='.45'") + dadini(x, y, d[0], d[1], .75); });
    [[1, 1], [6, 6], [1, 2], [5, 6]].forEach(function (d, j) { var x = (-.18 + j * .12) * M, y = .14 * M; tap += R(x / M - .055, y / M - .07, x / M + .055, y / M + .07, "stroke='" + BI + "' stroke-width='.45'") + facciaDado(d[0], x, y - 2, 2.4, "#fbfaf5", "#1d1d22") + facciaDado(d[1], x, y + 1.8, 2.4, "#fbfaf5", "#1d1d22"); });
    tap += R(-.24, .27, .24, .38, "stroke='" + BI + "' stroke-width='.5' fill='#c92a2a'") + scritta(0, .325 * M, 10, 1.3, BI, 98);
    tap += vassoioP(-.22, .22, -.68, -.5, [FICHE.nera, FICHE.verde, FICHE.verde, FICHE.rossa, FICHE.rossa, FICHE.bianca, FICHE.bianca]);
    // il bastone del croupier (bambù col gancio), posato sul panno
    var b1 = [-1.02, -.1], b2 = [-.36, -.32];
    tap += "<path d='M" + q2(b1[0] * M + .5, b1[1] * M + .9) + " L" + q2(b2[0] * M + .5, b2[1] * M + .9) + "' stroke='#000' stroke-width='1.5' opacity='.25' stroke-linecap='round'/>";
    tap += "<path d='M" + q2(b1[0] * M, b1[1] * M) + " L" + q2(b2[0] * M, b2[1] * M) + "' stroke='#d9b26a' stroke-width='1.1' stroke-linecap='round'/>";
    tap += "<path d='M" + q2(b2[0] * M, b2[1] * M) + " q2.4,-.6 3,1.4 q.3,1.4 -1.2,1.6' fill='none' stroke='#d9b26a' stroke-width='1.1' stroke-linecap='round'/>";
    for (i = 1; i < 6; i++) { var pn = lerp(b1, b2, i / 6); tap += cer(pn[0] * M, pn[1] * M + .02 * M * (i / 6), .55, "#a8803f"); }
    s += panno(In, ZF, "#147a46", tap);
    // i due dadi rossi sul panno
    l.push([vicino(.52, .08), dado(.52, .08, ZF, .055, "#d6283b", "#ffffff", [5, 3, 1])]);
    l.push([vicino(.66, .02), dado(.66, .02, ZF, .055, "#d6283b", "#ffffff", [2, 6, 3])]);
    [[-.85, -.25, FICHE.rossa, 3], [.8, .4, FICHE.verde, 2], [-.6, .07, FICHE.nera, 2], [.15, -.12, FICHE.rossa, 2]].forEach(function (x) { l.push([vicino(x[0], x[1]), fiches(x[0], x[1], ZF, x[3], x[2], .038)]); });
    s += ordina(l);
    // le pareti di fuori che si vedono (quelle vicine): mogano laccato col filo d'oro
    s += grembiule(allarga(O, -.02), ZB, ZW, MOGANO, { passo: .07 });
    // sopra il bordo: il piano di legno, la canalina scura delle fiches, il bracciolo di cuoio fuori
    var Bt = allarga(O, -.02), C1 = allarga(O, -.105), C2 = allarga(O, -.165), ZT = ZW + 1;
    s += anelloP(Bt, In, ZT, nuova([[0, "#c27a4a"], [.5, "#8c3e1c"], [1, "#4e1c0a"]], 0, 0, 1, 1), bordo(L, 1));
    s += fianco(In, ZW, ZT, "#5a2410", LACCA, { dentro: true, lati: false, lw: .8 });
    s += anelloP(C1, C2, ZT, "#1c1210", "stroke='" + L + "' stroke-width='.6'");
    s += tratto(chiuso(aSchermo(allarga(O, -.172), ZT)), "#ffd9a8", .5, op(.5));
    // le fiches nella canalina, davanti ai giocatori
    var canalina = [[-1.315, -.3, 0, FICHE.rossa], [-1.315, .02, 0, FICHE.verde], [-1.315, .36, 0, FICHE.nera], [-.95, -.725, 1, FICHE.blu], [.95, -.725, 1, FICHE.rossa]];   // (nella canalina lontana, quella che si vede: davanti la copre il bracciolo)
    canalina.forEach(function (g) {
      var a = g[0] * G, b = g[1] * G, e1 = P(a - (g[2] ? .05 : 0) * G, b - (g[2] ? 0 : .05) * G, ZT + 1), e2 = P(a + (g[2] ? .05 : 0) * G, b + (g[2] ? 0 : .05) * G, ZT + 1);
      s += tratto(linea(e1, e2), L, 4.4) + tratto(linea(e1, e2), g[3], 3.4) + tratto(linea(e1, e2), g[3] === FICHE.bianca ? "#1c7ed6" : "#ffffff", 2.4, "stroke-dasharray='.35 1' opacity='.75'") + tratto(linea([e1[0], e1[1] - .9], [e2[0], e2[1] - .9]), chiaro(g[3], .5), .7, op(.7));
    });
    s += tubo(allarga(O, -.035), ZT + 1.3, 3.6, CUOIO_NERO, { cucitura: true });
    return s;
  });

  // =========================================================
  //  SIC BO: il tavolo nero laccato con l'oro, il bordo di cuoio nero, il panno rosso coi riquadri dei tre dadi:
  //  piccolo e grande, i doppi e i tris, i totali, le coppie, i sei numeri coi dadi grandi (l'uno e il quattro rossi,
  //  come i dadi cinesi); dietro, la cupola di vetro coi tre dadi sulla base d'oro (di notte si accende)
  // =========================================================
  def("tavolo_sicbo", { nome: "Tavolo del Sic Bo", fp: [2, 2], box: [-95, -94, 103, 52], dietro: true, piano: 45,
    posti: [[-1, 0], [-1, 1], [0, 2], [1, 2], [2, 1], [2, 0]], croupier: [0, -1], luce: [0, -.5, 58, 70, "#ffe39a"] }, function () {
    var O = pRett(-.95, .95, -.84, .9, .22, 7), ZF = 45, Z0 = 32, Z1 = 44.4, s = ombraForma(O, 1), l = [], M = 61, i, j;
    s += fianco(allarga(O, -.3), 0, Z0, "#1f1a1e", LACCA, { righe: [[1.6, ORO_S, 1.6, .9], [1.7, ORO, .9, 1], [Z0 - 1.5, ORO, .8, .8]], extra: lesene(Z0) });
    s += grembiule(allarga(O, -.035), Z0, Z1, "#231d22", { passo: .06 });
    var tap = "", BI = "#f6f1e3", w5 = "stroke='" + ORO + "' stroke-width='.6'";
    function R(a0, b0, a1, b1, fill, x) { return rett(a0 * M, b0 * M, (a1 - a0) * M, (b1 - b0) * M, .6, fill || "none", x || w5); }
    var X0 = -.78, X1 = .78, WW = X1 - X0;
    // piccolo e grande (coi dadi bassi e alti), i doppi, il tris qualsiasi
    tap += R(X0, -.3, X0 + .3, -.06, "#7d1020") + R(X1 - .3, -.3, X1, -.06, "#7d1020");
    [1, 2, 3].forEach(function (n, k) { tap += facciaDado(n, (X0 + .06 + k * .09) * M, -.18 * M, 4, "#fbfaf5", "#1d1d22", true); });
    [4, 5, 6].forEach(function (n, k) { tap += facciaDado(n, (X1 - .24 + k * .09) * M, -.18 * M, 4, "#fbfaf5", "#1d1d22", true); });
    for (i = 0; i < 6; i++) { var xa = X0 + .3 + (i < 3 ? i : i + 1) * (WW - .6) / 7, xb = xa + (WW - .6) / 7; tap += R(xa, -.3, xb, -.06) + facciaDado(i + 1, (xa + xb) / 2 * M, -.235 * M, 2.6, "#fbfaf5", "#1d1d22", true) + facciaDado(i + 1, (xa + xb) / 2 * M, -.125 * M, 2.6, "#fbfaf5", "#1d1d22", true); }
    var xt0 = X0 + .3 + 3 * (WW - .6) / 7, xt1 = xt0 + (WW - .6) / 7;
    tap += R(xt0, -.3, xt1, -.06, "#9c6a12") + [0, 1, 2].map(function (k) { return facciaDado(k * 2 + 2, ((xt0 + xt1) / 2 + (k - 1) * .035) * M, (-.2 + (k === 1 ? .05 : 0)) * M, 2.1, "#fbfaf5", "#1d1d22", true); }).join("");
    // i totali da 4 a 17
    for (i = 0; i < 14; i++) { var t0 = X0 + i * WW / 14, t1 = t0 + WW / 14; tap += R(t0, -.06, t1, .12) + numero(String(i + 4), (t0 + t1) / 2 * M, .03 * M, 3, ORO_C, .5); }
    // le coppie (due dadi diversi)
    var cop = []; for (i = 1; i <= 6; i++) for (j = i + 1; j <= 6; j++) cop.push([i, j]);
    cop.forEach(function (c, k) { var c0 = X0 + k * WW / 15, c1 = c0 + WW / 15; tap += R(c0, .12, c1, .32) + facciaDado(c[0], (c0 + c1) / 2 * M, .175 * M, 2.4, "#fbfaf5", "#1d1d22", true) + facciaDado(c[1], (c0 + c1) / 2 * M, .265 * M, 2.4, "#fbfaf5", "#1d1d22", true); });
    // i sei numeri, coi dadi grandi
    for (i = 0; i < 6; i++) { var s0 = X0 + i * WW / 6, s1 = s0 + WW / 6; tap += R(s0, .32, s1, .6, i % 2 ? "#8e1424" : "#a3192b") + facciaDado(i + 1, (s0 + s1) / 2 * M, .46 * M, 9, "#fbfaf5", "#1d1d22", true, "#c9a227"); }
    if (NOTTE) {   // di notte si accendono da sotto le puntate vincenti: i dadi nella cupola fanno 5, 2 e 6 (13, grande)
      var vinte = [[X1 - .3, -.3, X1, -.06], [X0 + 9 * WW / 14, -.06, X0 + 10 * WW / 14, .12]];
      [1, 4, 5].forEach(function (i) { vinte.push([X0 + i * WW / 6, .32, X0 + (i + 1) * WW / 6, .6]); });
      [7, 8, 14].forEach(function (k) { vinte.push([X0 + k * WW / 15, .12, X0 + (k + 1) * WW / 15, .32]); });
      vinte.forEach(function (v) { tap += R(v[0], v[1], v[2], v[3], "#ffd84a", "opacity='.62' stroke='#fff3b0' stroke-width='1.5'") + R(v[0] + .015, v[1] + .015, v[2] - .015, v[3] - .015, "none", "stroke='#ffffff' stroke-width='.5' opacity='.9'"); });
    }
    s += panno(allarga(O, -.11), ZF, "#a3192b", tap);
    s += tubo(allarga(O, -.065), ZF + 1.9, 4.2, CUOIO_NERO, { cucitura: true, oro: true });
    // la cupola: la base nera e oro, i tre dadi, il vetro coi riflessi
    var cx = 0, cy = -.52, F = forma(cx, cy, .2), Fv = forma(cx, cy, .165), ZB2 = ZF + 5.5, cupola = "";
    cupola += corpo([giro(F, ZF, 1, 48), giro(F, ZF + 3.5, 1, 48), giro(F, ZB2, .9, 48)], [[0, "#6b6470"], [.3, "#2c2730"], [.7, "#141116"], [1, "#050405"]], 1.4);
    cupola += tratto(aperto(giro(F, ZF + 3.5, 1, 48).slice(0, 25)), ORO, 1.2) + tratto(aperto(giro(F, ZF + 1.2, 1, 48).slice(0, 25)), ORO_S, .7);
    var luci = giro(F, ZF + 2.2, 1, 16).filter(function (x, k) { return k < 9; });
    luci.forEach(function (c) { cupola += cer(c[0], c[1], .8, NOTTE ? "#fff7c2" : "#c9a227", NOTTE ? "" : op(.8)) + (NOTTE ? cer(c[0], c[1], 2, "#ffe066", op(.35)) : ""); });
    cupola += pth(chiuso(giro(F, ZB2, .9, 48)), nuovaR([[0, "#3a3540"], [1, "#0d0b0e"]], .4, .35, .8), bordo(L, .8));
    [[-.05, -.03, [5, 3, 1]], [.05, -.04, [2, 6, 4]], [0, .05, [6, 4, 5]]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }).forEach(function (d) { cupola += dado(cx + d[0], cy + d[1], ZB2, .062, "#fbfaf5", "#1d1d22", d[2], true); });
    var lv = [], k2; for (k2 = 0; k2 <= 6; k2++) { var an = k2 / 6 * Math.PI / 2; lv.push(giro(Fv, ZB2 + Math.sin(an) * 12, Math.max(.02, Math.cos(an)), 40)); }
    var cup = sagoma(lv);
    cupola += pth(chiuso(cup), nuovaR([[0, "#ffffff", .1], [.7, "#d8f0ff", .18], [1, "#9fd4f2", .42]], .4, .4, .7), bordo("#5c7f96", 1));
    var bc = limiti(cup);
    cupola += dentro(chiuso(cup), ell(bc[0] + (bc[2] - bc[0]) * .3, bc[1] + (bc[3] - bc[1]) * .3, (bc[2] - bc[0]) * .1, (bc[3] - bc[1]) * .28, "#ffffff", op(.75)) + tratto("M" + q(bc[0] + (bc[2] - bc[0]) * .72, bc[1] + (bc[3] - bc[1]) * .25) + " q" + q((bc[2] - bc[0]) * .12, (bc[3] - bc[1]) * .2) + " " + q((bc[2] - bc[0]) * .08, (bc[3] - bc[1]) * .55), "#ffffff", 1, op(.6)));
    if (NOTTE) cupola += pth(chiuso(cup), nuovaR([[0, "#fff3b0", .45], [1, "#ffd43b", 0]], .5, .7, .7));
    l.push([vicino(cx, cy), cupola]);
    [[-.52, .62, FICHE.rossa, 4], [.22, .52, FICHE.gialla, 3], [.6, .2, FICHE.verde, 2], [-.2, .02, FICHE.nera, 2]].forEach(function (x) { l.push([vicino(x[0], x[1]), fiches(x[0], x[1], ZF, x[3], x[2], .038)]); });
    return s + ordina(l);
  });
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }

  // =========================================================
  //  RUOTA DELLA FORTUNA (Big Six): la grande ruota in piedi sul podio di mogano col velluto e la stella d'oro;
  //  i 54 settori colorati coi biglietti (e le due stelle del jackpot), i chiodini d'ottone, le lampadine tutt'intorno,
  //  la linguetta di cuoio in cima e lo stemma dorato; dietro, le razze di legno, il perno e il palo che la regge
  // =========================================================
  var BIG6 = ["J", 1, 2, 1, 5, 1, 2, 1, 10, 1, 2, 1, 5, 2, 20, 1, 2, 1, 5, 1, 2, 1, 10, 1, 2, 1, 5, "J", 1, 2, 1, 5, 1, 2, 1, 10, 1, 2, 1, 5, 2, 20, 1, 2, 1, 5, 1, 2, 1, 10, 1, 2, 1, 2];
  var COL6 = { 1: "#f2c230", 2: "#3b8be0", 5: "#e8457c", 10: "#2fb35a", 20: "#f07f1d", J: "#c61f2f" };
  function stella(x, y, R, r, n, fill, x2) { var o = [], i; for (i = 0; i < n * 2; i++) { var t = -Math.PI / 2 + i * Math.PI / n, k = i % 2 ? r : R; o.push([x + k * Math.cos(t), y + k * Math.sin(t)]); } return "<path d='M" + o.map(function (v) { return q2(v[0], v[1]); }).join(" L") + " Z' fill='" + fill + "'" + attr(x2) + "/>"; }
  def("ruota_fortuna", { nome: "Ruota della fortuna", fp: [2, 1], box: [-61, -205, 61, 30], dietro: true, luce: [0, .08, 112, 150, "#ffd27a"] }, function () {
    var R = .88, ZC = 112, RZ = R * 61, BF = .075, BB = -.075, s = "", i, n = BIG6.length, notte = NOTTE;
    var bV = G > 0 ? BF : BB;   // la faccia che si vede
    s += ombraPianta(-.78, .78, -.36, .34, 1, .1);
    // il podio: mogano laccato, il pannello di velluto rosso con la stella d'oro, la cornice dorata sopra e sotto
    function pannello(stellaSi) {
      return function (W, H) {
        var o = rett(4, 6, W - 8, H - 12, 1.5, "#9e1426", "stroke='" + ORO + "' stroke-width='1.6'") + rett(4, 6, W - 8, (H - 12) * .45, 1.5, "#ffffff", op(.08)) + rett(6.5, 8.5, W - 13, H - 17, 1, "none", "stroke='" + ORO_C + "' stroke-width='.5' opacity='.8'");
        if (stellaSi) o += stella(W / 2, H / 2, 9, 3.8, 5, ORO, "stroke='" + ORO_S + "' stroke-width='.6'") + stella(W / 2 - .6, H / 2 - .8, 4, 1.7, 5, "#fff3c4", op(.7));
        return o + rett(0, H - 3, W, 3, 0, ORO, op(.9)) + rett(0, 0, W, 1.6, 0, ORO, op(.9));
      };
    }
    s += blocco(-.74, .74, -.34, .32, 0, 50, "#6e2a14", { davanti: pannello(true), dietro: pannello(false), fianco: pannello(false) }, 2);
    s += blocco(-.78, .78, -.37, .35, 50, 54, "#d9a83a", { davanti: function (W, H) { return rett(0, H * .55, W, H * .45, 0, "#9c6f1c", op(.6)); }, fianco: function (W, H) { return rett(0, H * .55, W, H * .45, 0, "#6e4a10", op(.5)); } }, 1.6);
    // il palo dietro la ruota (regge il perno e lo stemma) e la staffa
    var palo = blocco(-.06, .06, -.27, -.15, 54, ZC + RZ + 10, "#5a2410", { davanti: function (W, H) { return rett(W * .35, 0, W * .3, H, 0, ORO, op(.5)); } }, 1.4);
    var perno = tornito(0, -.14, [[ZC - 3, .05], [ZC + 3, .05]], OTTONE, .9);
    // la ruota: il bordo di fianco (tra le due facce), poi la faccia che si vede
    var orlo = [], k;
    for (k = 0; k < 72; k++) { var t = k / 72 * 2 * Math.PI; orlo.push(P(R * Math.cos(t), BF, ZC + RZ * Math.sin(t))); orlo.push(P(R * Math.cos(t), BB, ZC + RZ * Math.sin(t))); }
    var bo = limiti(orlo), ruota = pth(chiuso(inviluppo(orlo)), nuova([[0, "#e8c068"], [.4, "#b8862b"], [1, "#5e3f0c"]], bo[0], 0, bo[2], 0, true), bordo(L, 2));
    var fac = "";
    if (G > 0) {
      fac += cer(0, -ZC, RZ, nuovaR([[0, "#8a4a22"], [.85, "#6e2a14"], [1, "#4a1a0a"]], .5, .5, .5));
      for (i = 0; i < n; i++) {   // i settori coi biglietti
        var a0 = -Math.PI / 2 - Math.PI / n + i / n * 2 * Math.PI, a1 = a0 + 2 * Math.PI / n, am = (a0 + a1) / 2, v = BIG6[i], c = COL6[v], r0 = RZ * .36, r1 = RZ * .86;
        fac += "<path d='M" + q2(r0 * Math.cos(a0), -ZC + r0 * Math.sin(a0)) + " L" + q2(r1 * Math.cos(a0), -ZC + r1 * Math.sin(a0)) + " A" + f1(r1) + "," + f1(r1) + " 0 0,1 " + q2(r1 * Math.cos(a1), -ZC + r1 * Math.sin(a1)) + " L" + q2(r0 * Math.cos(a1), -ZC + r0 * Math.sin(a1)) + " Z' fill='" + (notte ? chiaro(c, .15) : c) + "' stroke='#3d1a0c' stroke-width='.5'/>";
        var rb = RZ * .64, bx = rb * Math.cos(am), by = -ZC + rb * Math.sin(am), rot = am * 180 / Math.PI + 90;
        if (v === "J") fac += stella(bx, by, 4.2, 1.8, 5, ORO_C, "stroke='" + ORO_S + "' stroke-width='.4'") + cer(RZ * .78 * Math.cos(am), -ZC + RZ * .78 * Math.sin(am), 1.2, ORO_C);
        else fac += "<g transform='translate(" + q2(bx, by) + ") rotate(" + f1(rot) + ")'>" + rett(-2.1, -5.6, 4.2, 11.2, .5, "#eef6e2", "stroke='" + scuro(c, .35) + "' stroke-width='.35'") + ell(0, 0, 1.2, 1.9, "#7fae6a") + rett(-1.5, -4.6, 3, .8, 0, scuro(c, .2)) + rett(-1.5, 3.8, 3, .8, 0, scuro(c, .2)) + "</g>";
      }
      fac += cer(0, -ZC, RZ * .36, "none", "stroke='" + ORO + "' stroke-width='3.2'") + cer(0, -ZC, RZ * .38, "none", "stroke='" + ORO_C + "' stroke-width='.6'");
      fac += cer(0, -ZC, RZ * .34, nuovaR([[0, "#d23040"], [.7, "#9e1426"], [1, "#6a0c18"]], .4, .4, .7));
      fac += stella(0, -ZC, RZ * .3, RZ * .12, 8, nuovaR(DORATO, .35, .3, .8), "stroke='" + ORO_S + "' stroke-width='.6'") + cer(0, -ZC, RZ * .08, nuovaR(DORATO, .35, .3, .8), "stroke='" + ORO_S + "' stroke-width='.6'") + cer(-1.2, -ZC - 1.4, 1.4, "#ffffff", op(.7));
      fac += cer(0, -ZC, RZ * .93, "none", "stroke='" + ORO + "' stroke-width='" + f1(RZ * .13) + "'") + cer(0, -ZC, RZ * .995, "none", "stroke='" + ORO_S + "' stroke-width='1.2'") + cer(0, -ZC, RZ * .865, "none", "stroke='" + ORO_S + "' stroke-width='1'");
      for (i = 0; i < n; i++) { var ap = -Math.PI / 2 - Math.PI / n + i / n * 2 * Math.PI; fac += cer(RZ * .855 * Math.cos(ap), -ZC + RZ * .855 * Math.sin(ap), .9, ORO_C, "stroke='" + ORO_S + "' stroke-width='.35'"); }   // i chiodini
      if (notte) fac += cer(0, -ZC, RZ, nuovaR([[0, "#fff3c4", .25], [1, "#ffd27a", .05]], .5, .5, .5));
    } else {   // dietro: il legno con le razze, i cerchi e il perno grosso
      fac += cer(0, -ZC, RZ, nuovaR([[0, "#9a5a2c"], [.8, "#6e2a14"], [1, "#4a1a0a"]], .5, .5, .5));
      for (i = 0; i < 8; i++) { var ar2 = i * Math.PI / 4; fac += "<path d='M" + q2(RZ * .2 * Math.cos(ar2), -ZC + RZ * .2 * Math.sin(ar2)) + " L" + q2(RZ * .9 * Math.cos(ar2), -ZC + RZ * .9 * Math.sin(ar2)) + "' stroke='#4a1a0a' stroke-width='5' stroke-linecap='round'/><path d='M" + q2(RZ * .2 * Math.cos(ar2), -ZC + RZ * .2 * Math.sin(ar2)) + " L" + q2(RZ * .9 * Math.cos(ar2), -ZC + RZ * .9 * Math.sin(ar2)) + "' stroke='#a8683a' stroke-width='1.2' stroke-linecap='round' transform='translate(-.6 -.8)'/>"; }
      fac += cer(0, -ZC, RZ * .55, "none", "stroke='#4a1a0a' stroke-width='3'") + cer(0, -ZC, RZ * .93, "none", "stroke='" + ORO + "' stroke-width='" + f1(RZ * .13) + "'") + cer(0, -ZC, RZ * .995, "none", "stroke='" + ORO_S + "' stroke-width='1.2'");
      fac += cer(0, -ZC, RZ * .2, nuovaR(DORATO, .35, .3, .8), "stroke='" + ORO_S + "' stroke-width='1'") + cer(0, -ZC, RZ * .08, "#5e3f0c");
    }
    ruota += suB(bV, fac);
    // le lampadine sul bordo (di notte accese, coi bagliori)
    var lamp = 30;
    for (i = 0; i < lamp; i++) {
      var al = i / lamp * 2 * Math.PI + .1, cl = P(R * .93 * Math.cos(al), bV + (G > 0 ? .01 : -.01), ZC + RZ * .93 * Math.sin(al));
      if (notte) ruota += cer(cl[0], cl[1], 3.4, "#ffe9a8", op(.35)) + cer(cl[0], cl[1], 1.9, nuovaR([[0, "#ffffff"], [.6, "#fff4c2"], [1, "#ffcf5a"]], .5, .5, .5), "stroke='#b8862b' stroke-width='.4'");
      else ruota += cer(cl[0], cl[1], 1.9, nuovaR([[0, "#ffffff"], [.5, "#fbe9c0"], [1, "#d8b56e"]], .35, .3, .8), "stroke='#7a5214' stroke-width='.45'") + cer(cl[0] - .6, cl[1] - .6, .55, "#ffffff", op(.9));
    }
    // lo stemma dorato in cima (sul palo) e la linguetta di cuoio che batte sui chiodini
    var zs = ZC + RZ + 2, stemma = "";
    function Y(v) { return f1(-zs - v); }
    stemma += "<path d='M-30," + Y(-2) + " C-32," + Y(6) + " -21," + Y(13) + " -12," + Y(15) + " C-10," + Y(21) + " -4," + Y(24) + " 0," + Y(25.5) + " C4," + Y(24) + " 10," + Y(21) + " 12," + Y(15) + " C21," + Y(13) + " 32," + Y(6) + " 30," + Y(-2) + " C18," + Y(2) + " -18," + Y(2) + " -30," + Y(-2) + " Z' fill='" + nuova(DORATO, 0, 0, 1, 1) + "' stroke='" + L + "' stroke-width='1.6' stroke-linejoin='round'/>";
    stemma += "<path d='M-26," + Y(1) + " C-20," + Y(9) + " -13," + Y(11) + " -9," + Y(12) + " M26," + Y(1) + " C20," + Y(9) + " 13," + Y(11) + " 9," + Y(12) + "' fill='none' stroke='" + ORO_S + "' stroke-width='.8' opacity='.8'/>";   // gli intagli
    [-1, 1].forEach(function (sg) { stemma += cer(sg * 29, -zs - .5, 2.8, ORO, "stroke='" + L + "' stroke-width='.8'") + "<path d='M" + f1(sg * 29) + "," + Y(.5) + " m" + f1(-sg * 1.4) + ",0 a1.4,1.4 0 1,1 " + f1(sg * 1.4) + ",1.4' fill='none' stroke='" + ORO_S + "' stroke-width='.6'/>"; });   // le volute
    stemma += ell(0, -zs - 11.5, 9.5, 7.8, "#9e1426", "stroke='" + ORO_S + "' stroke-width='.9'") + ell(-2.5, -zs - 14, 4, 2.2, "#ffffff", op(.15));
    stemma += stella(0, -zs - 11.5, 6.4, 2.7, 5, notte ? "#fffbe6" : ORO_C, "stroke='" + ORO_S + "' stroke-width='.4'");
    stemma += cer(0, -zs - 28, 2.6, nuovaR(DORATO, .35, .3, .8), "stroke='" + L + "' stroke-width='.8'") + cer(-.8, -zs - 28.8, .8, "#ffffff", op(.8));   // il pomo in cima
    [[-24, 6], [-17, 11.5], [-9.5, 17.5], [0, 21.3], [9.5, 17.5], [17, 11.5], [24, 6]].forEach(function (v) {   // le lampadine lungo l'arco
      stemma += (notte ? cer(v[0], -zs - v[1], 3.6, "#ffe066", op(.3)) : "") + cer(v[0], -zs - v[1], notte ? 1.9 : 1.6, notte ? "#fff4c2" : "#fbe9c0", "stroke='#7a5214' stroke-width='.4'") + (notte ? "" : cer(v[0] - .5, -zs - v[1] - .5, .5, "#ffffff", op(.9)));
    });
    var stemmaS = suB(-.12, stemma);
    var lingua = "";
    if (G > 0) {
      var cTop = P(0, BF + .02, ZC + RZ + 1), cPun = P(0, BF + .03, ZC + RZ * .82);
      lingua += ottone(linea(P(0, -.12, ZC + RZ + 4), cTop), 1.2);
      lingua += poly([[cTop[0] - 2.2, cTop[1]], [cTop[0] + 2.2, cTop[1]], [cPun[0] + .6, cPun[1]], [cPun[0] - .6, cPun[1]]], "#2b1d14", bordo(L, .8)) + tratto(linea([cTop[0] - 1, cTop[1] + 1], [cPun[0] - .2, cPun[1] - 1]), "#7a5a40", .6, op(.8));
      lingua += pallina(cTop, 1.6, ORO, .5);
    }
    if (G > 0) s += palo + ruota + stemmaS + lingua;
    else s += ruota + perno + palo + stemmaS;
    return s;
  });

  // =========================================================
  //  SEDIA DI VELLUTO (per i tavoli): la cornice di legno dorato, le gambe a cabriolè davanti, il cuscino gonfio
  //  di velluto rosso coi bottoni, lo schienale a medaglione col velluto capitonné e il fiocco intagliato in cima.
  //  Da dietro: lo schienale col velluto liscio e la cornice d'oro (è come la vedono quasi tutti, ai tavoli)
  // =========================================================
  def("sgabello_casino", { nome: "Sedia di velluto", fp: [1, 1], box: [-24, -83, 25, 15], dietro: true, azione: "siedi", seduta: 30 }, function () {
    var VEL = "#b0122c", s = ombraPianta(-.24, .24, -.24, .26, .95, .05), ZS = 23.5, ZR = 27, BS = -.2, i;
    var gambe = [[-.17, .17, 1], [.17, .17, 1], [-.17, -.17, 0], [.17, -.17, 0]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
    function gamba(g) {
      if (g[2]) return cabriole(g[0], g[1], ZS, g[0] > 0 ? .55 : -.55, .84, .045, 1.9);
      var t = P(g[0], g[1], ZS), f = P(g[0] * 1.08, g[1] * 1.25, 0);
      return tratto(linea(t, f), L, 4.4) + tratto(linea(t, f), nuova(DORATO, t[0] - 2, 0, t[0] + 2, 0, true), 2.6) + tratto(linea([t[0] - .6, t[1]], [f[0] - .6, f[1]]), "#fffbe6", .6, op(.7)) + ell(f[0], f[1], 1.8, .9, "#a97720", bordo(L, .6));
    }
    // lo schienale: le due colonnine dorate e il medaglione (velluto dentro la cornice d'oro), col fiocco in cima
    function schienale() {
      var o = "", zc = 53, ry = 16.5, rx = .165 * 61, bF = BS + .018, bR = BS - .018, bv = G > 0 ? bF : bR;
      [-.11, .11].forEach(function (a) { var t = P(a, BS, ZR), f = P(a * .8, BS, zc - ry + 2.5); o += tratto(linea(t, f), L, 3.6) + tratto(linea(t, f), nuova(DORATO, t[0] - 2, 0, t[0] + 2, 0, true), 2) + tratto(linea([t[0] - .5, t[1]], [f[0] - .5, f[1]]), "#fffbe6", .5, op(.7)); });
      var bordoO = [], k;
      for (k = 0; k < 48; k++) { var t = k / 48 * 2 * Math.PI; bordoO.push(P(rx / 61 * Math.cos(t), bF, zc + ry * Math.sin(t))); bordoO.push(P(rx / 61 * Math.cos(t), bR, zc + ry * Math.sin(t))); }
      var bb = limiti(bordoO);
      o += pth(chiuso(inviluppo(bordoO)), nuova(DORATO, bb[0], 0, bb[2], 0, true), bordo(L, 1.6));
      var med = "";
      med += ell(0, -zc, rx, ry, nuova([[0, "#fff3c2"], [.4, "#e2b444"], [1, "#8a5c12"]], 0, 0, 1, 1));
      med += ell(0, -zc, rx - 2.3, ry - 2.3, nuovaR([[0, chiaro(VEL, .28)], [.55, VEL], [1, scuro(VEL, .45)]], .38, .32, .8));
      if (G > 0) {   // davanti: il capitonné coi bottoni
        [[0, -zc - 7], [-3.6, -zc - 1.5], [3.6, -zc - 1.5], [0, -zc + 4.5], [-3, -zc + 10], [3, -zc + 10]].forEach(function (v) { med += cer(v[0], v[1] + .5, 1.1, scuro(VEL, .5), op(.5)) + cer(v[0], v[1], .75, nuovaR([[0, "#ffe2e6"], [1, scuro(VEL, .2)]], .35, .3, .8)); });
        med += "<path d='M0," + f1(-zc - 7) + " L-3.6," + f1(-zc - 1.5) + " L0," + f1(-zc + 4.5) + " L3.6," + f1(-zc - 1.5) + " Z M-3.6," + f1(-zc - 1.5) + " L-3," + f1(-zc + 10) + " M3.6," + f1(-zc - 1.5) + " L3," + f1(-zc + 10) + "' fill='none' stroke='" + scuro(VEL, .45) + "' stroke-width='.5' opacity='.6'/>";
      } else med += ell(-2.5, -zc - 5, 3, 7, "#ffffff", op(.12));
      med += ell(0, -zc, rx - 2.3, ry - 2.3, "none", "stroke='" + scuro(ORO, .4) + "' stroke-width='.6'") + ell(0, -zc, rx - .9, ry - .9, "none", "stroke='" + ORO_C + "' stroke-width='.5' stroke-dasharray='1 .9'");
      // il fiocco intagliato in cima
      var zf = zc + ry + 1.5;
      med += "<path d='M0," + f1(-zf) + " C-3,-" + f1(zf + 4) + " -7,-" + f1(zf + 2) + " -5.5,-" + f1(zf - 1) + " C-4,-" + f1(zf - 2.5) + " -1.5,-" + f1(zf - .5) + " 0," + f1(-zf) + " C1.5,-" + f1(zf - .5) + " 4,-" + f1(zf - 2.5) + " 5.5,-" + f1(zf - 1) + " C7,-" + f1(zf + 2) + " 3,-" + f1(zf + 4) + " 0," + f1(-zf) + " Z' fill='" + ORO + "' stroke='" + L + "' stroke-width='.8'/>" + cer(0, -zf, 1.5, ORO_C, "stroke='" + L + "' stroke-width='.6'");
      o += suB(bv, med);
      return o;
    }
    // la cornice dorata della seduta e il cuscino di velluto
    function seduta() {
      var F = forma(0, .01, .215, .225, .2, 3.4), o = "";
      o += corpo([giro(F, ZS, 1, 64), giro(F, ZR, 1, 64)], DORATO, 1.4);
      o += tratto(aperto(giro(F, ZS + 1.7, 1.005, 64).slice(0, 33)), ORO_S, .7, op(.8)) + tratto(aperto(giro(F, ZR - .5, 1, 64).slice(0, 33)), "#fff3c4", .6, op(.8));
      var Fc = forma(0, .01, .2, .21, .185, 3.6), lv = [giro(Fc, ZR - .3, .98, 64), giro(Fc, ZR + 2, 1.02, 64), giro(Fc, ZR + 3.6, .96, 64), giro(Fc, ZR + 4.3, .75, 64), giro(Fc, ZR + 4.6, .4, 48)];
      o += corpo(lv, [[0, chiaro(VEL, .3)], [.35, VEL], [1, scuro(VEL, .5)]], 1.5);
      var top = giro(Fc, ZR + 4.2, .82, 64), bt = limiti(top);
      o += pth(chiuso(top), nuovaR([[0, chiaro(VEL, .4)], [.55, chiaro(VEL, .08)], [1, scuro(VEL, .15)]], .38, .32, .85));
      [[0, 0], [-.08, -.05], [.08, -.05], [-.08, .06], [.08, .06]].forEach(function (v) { var c = P(v[0], v[1] + .01, ZR + 4.4); o += cer(c[0], c[1] + .4, 1, scuro(VEL, .5), op(.45)) + cer(c[0], c[1], .7, nuovaR([[0, "#ffe2e6"], [1, scuro(VEL, .2)]], .35, .3, .8)); });
      o += ell(bt[0] + (bt[2] - bt[0]) * .32, bt[1] + (bt[3] - bt[1]) * .38, (bt[2] - bt[0]) * .14, (bt[3] - bt[1]) * .16, "#ffffff", op(.16));
      return o;
    }
    s += gambe.filter(function (g) { return vicino(g[0], g[1]) < 0; }).map(gamba).join("");
    if (G > 0) s += schienale() + gambe.filter(function (g) { return vicino(g[0], g[1]) >= 0; }).map(gamba).join("") + seduta();
    else s += gambe.filter(function (g) { return vicino(g[0], g[1]) >= 0; }).map(gamba).join("") + seduta() + schienale();
    return s;
  });

  // =========================================================
  //  COLONNINA COL CORDONE (la sala VIP): due colonnine d'ottone lucido (la base a cupola, il fusto, il pomo)
  //  e il cordone di velluto rosso che pende tra i ganci. Uguale da davanti e da dietro; messe in fila fanno una barriera unica
  // =========================================================
  def("cordone", { nome: "Colonnina col cordone", fp: [1, 1], box: [-37, -78, 40, 21] }, function () {
    var A = .5, ZH = 53, s = "", VEL = "#b0122c";
    [-A, A].forEach(function (a) { var c = P(a, 0, 0); s += ell(c[0] + 2.4, c[1] + .8, 9.5, 4.2, nuovaR([[0, "#000", .3], [1, "#000", 0]], .5, .5, .5)); });
    function palo(a) {
      var o = tornito(a, 0, [[0, .12], [1.5, .12], [2.8, .105], [4, .08], [5, .05], [5.8, .036], [6.6, .027]], OTTONE, 1.3, [1], .9);
      o += tornito(a, 0, [[6.4, .025], [49, .023], [50, .032], [51.4, .032], [52.2, .023], [55, .023]], OTTONE, 1.1, [2, 3], .8);
      return o + tornito(a, 0, [[54.8, .03], [55.8, .037], [56.6, .028]], OTTONE, .8) + pallina(P(a, 0, 59), 3.4, ORO, .9);
    }
    function cordone() {
      var pp = [], k, a0 = -A + .045, a1 = A - .045;
      for (k = 0; k <= 24; k++) { var t = k / 24; pp.push(P(a0 + (a1 - a0) * t, 0, ZH - 1 - 15 * (1 - Math.pow(2 * t - 1, 2)))); }
      var d = aperto(pp), o = tratto(d, L, 6.6) + tratto(d, scuro(VEL, .25), 4.6) + tratto(d, VEL, 3, "transform='translate(0 -.6)'") + tratto(d, chiaro(VEL, .35), 1.1, "transform='translate(-.2 -1.3)' opacity='.8'");
      o += tratto(d, scuro(VEL, .5), .4, "stroke-dasharray='.6 1.6' transform='translate(0 .4)' opacity='.7'");   // la trama del velluto ritorto
      [pp[0], pp[24]].forEach(function (c, j) {   // i ganci d'ottone
        o += tratto(linea([c[0], c[1]], [c[0] + (j ? 2.2 : -2.2) * G, c[1] - 1.2]), L, 3.4) + tratto(linea([c[0], c[1]], [c[0] + (j ? 2.2 : -2.2) * G, c[1] - 1.2]), ORO, 2) + ell(c[0], c[1], 2.2, 2.6, nuovaR(DORATO, .35, .3, .8), bordo(L, .7));
      });
      return o;
    }
    var vicinoPalo = vicino(A, 0) >= vicino(-A, 0) ? A : -A;
    s += palo(-vicinoPalo) + cordone() + palo(vicinoPalo);
    return s;
  });

  // =========================================================
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: "piedi", nome: d.nome, stanza: "casino", reparto: "casino", w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice(), dietro: !!d.dietro, prezzo: 0, qual: 2 };
      if (d.piano) o.piano = d.piano;
      if (d.posti) { o.posti = d.posti.map(function (x) { return x.slice(); }); o.croupier = d.croupier.slice(); }
      if (d.inPiedi) o.inPiedi = true;   // ai dadi si gioca in piedi: ai posti niente sedie, la gente sta in piedi
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      if (d.luce) { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "cas" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!opz.notte;
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

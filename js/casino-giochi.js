/* =========================================================
   SPeeD GAME — I GIOCHI NUOVI DEL CASINÒ: TAVOLI, BINGO E KENO, VISTI DALL'ALTO (come i mobili della casa, js/mobili-arte.js)
   Il Casinò è una sala enorme vista dall'alto (lo stesso motore della casa, js/giardino.js).
   Una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   - Tavoli (il panno a 45): Caribbean Stud Poker (la mezzaluna con la ruota del jackpot), Pai Gow (le tessere del domino cinese),
     Trente et Quarante (il gioco storico di Monte-Carlo, con le losanghe rossa e nera), il tavolo del bingo.
     In info "posti" = le mattonelle dove si siedono i giocatori, "croupier" = dove sta chi tiene il banco
     (relative all'angolo dell'impronta nel disegno davanti; il croupier sta dalla parte della schiena).
   - Macchine: la roulette elettronica sotto la cupola di vetro (le postazioni a schermo tutte attorno),
     la corsa dei cavallini (la pista ovale coi fantini), l'urna del bingo, la postazione del keno.
   - Da parete (larghi due pezzi di muro, 124 × 200): il tabellone del bingo (90 numeri) e quello del keno (80).
   Niente lettere (il motore specchia i disegni): solo caselle, numeri, dadi, tessere, semi delle carte e colori.
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
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }
  function stella(x, y, R, r, n, fill, x2) { var o = [], i; for (i = 0; i < n * 2; i++) { var t = -Math.PI / 2 + i * Math.PI / n, k = i % 2 ? r : R; o.push([x + k * Math.cos(t), y + k * Math.sin(t)]); } return "<path d='M" + o.map(function (v) { return q2(v[0], v[1]); }).join(" L") + " Z' fill='" + fill + "'" + attr(x2) + "/>"; }

  // ---------- altri attrezzi di questo gruppo ----------
  // le cifre luminose a sette segmenti (contatori e tabelloni): in (x, y) l'angolo in alto a sinistra, alte h; il punto delle migliaia non occupa posto
  var SEG = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg" };
  function ledL(str, h) { var n = str.replace(/\./g, "").length; return n * h * .55 + (n - 1) * h * .22; }
  function led(str, x, y, h, col, acceso) {
    var w = h * .55, sp = h * .22, t = h * .07, sk = h * .1, o = "", xx = x, i, lw = h * .13;
    function pt(px, py) { return q2(px + (y + h - py) / h * sk, py); }
    for (i = 0; i < str.length; i++) {
      var ch = str[i];
      if (ch === ".") { o += cer(xx - sp * .55 + sk * .1, y + h - lw * .3, lw * .6, col); continue; }
      var S = { a: [[xx + t, y], [xx + w - t, y]], b: [[xx + w, y + t], [xx + w, y + h / 2 - t]], c: [[xx + w, y + h / 2 + t], [xx + w, y + h - t]], d: [[xx + t, y + h], [xx + w - t, y + h]],
        e: [[xx, y + h / 2 + t], [xx, y + h - t]], f: [[xx, y + t], [xx, y + h / 2 - t]], g: [[xx + t, y + h / 2], [xx + w - t, y + h / 2]] }, on = "", off = "";
      Object.keys(S).forEach(function (k) { var d = "M" + pt(S[k][0][0], S[k][0][1]) + " L" + pt(S[k][1][0], S[k][1][1]) + " "; if ((SEG[ch] || "").indexOf(k) >= 0) on += d; else off += d; });
      if (off) o += "<path d='" + off + "' stroke='" + col + "' stroke-width='" + f2(lw) + "' stroke-linecap='round' opacity='.13'/>";
      if (on && acceso) o += "<path d='" + on + "' stroke='" + col + "' stroke-width='" + f2(lw * 2.6) + "' stroke-linecap='round' opacity='.3'/>";
      if (on) o += "<path d='" + on + "' stroke='" + (acceso ? chiaro(col, .45) : col) + "' stroke-width='" + f2(lw) + "' stroke-linecap='round'/>";
      xx += w + sp;
    }
    return o;
  }
  // un solido qualsiasi (convesso): V = i vertici [a, b, z]; F = le facce (liste di indici); si vedono le facce girate verso chi guarda,
  // ognuna col colore della sua luce. o = { colori: { faccia: colore o "url(...)" }, dec: { faccia: function (punti sullo schermo) }, lw }
  function solido(V, F, col, m, o) {
    o = o || {};
    var S = V.map(function (v) { return P(v[0], v[1], v[2]); }), c0 = [0, 0, 0], s = "", spig = "";
    V.forEach(function (v) { c0[0] += v[0] / V.length; c0[1] += v[1] / V.length; c0[2] += v[2] / 61 / V.length; });
    F.forEach(function (f, i) {
      var A = V[f[0]], B = V[f[1]], C = V[f[2]], e1 = [B[0] - A[0], B[1] - A[1], (B[2] - A[2]) / 61], e2 = [C[0] - A[0], C[1] - A[1], (C[2] - A[2]) / 61];
      var n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], fc = [0, 0, 0];
      f.forEach(function (k) { fc[0] += V[k][0] / f.length; fc[1] += V[k][1] / f.length; fc[2] += V[k][2] / 61 / f.length; });
      if ((fc[0] - c0[0]) * n[0] + (fc[1] - c0[1]) * n[1] + (fc[2] - c0[2]) * n[2] < 0) n = [-n[0], -n[1], -n[2]];
      var nv = norma([G * n[0], G * n[1], n[2]]);
      if (dot(nv, VISTA) <= .003) return;
      var pp = f.map(function (k) { return S[k]; }), cc = (o.colori && o.colori[i]) || col, t = cc.indexOf("url(") === 0 ? cc : tinta(cc, nv, m);
      s += poly(pp, t, "stroke='" + (cc.indexOf("url(") === 0 ? "none" : t) + "' stroke-width='.6' stroke-linejoin='round'");
      if (o.dec && o.dec[i]) s += o.dec[i](pp, nv);
      spig += chiuso(pp) + " ";
    });
    if (spig) s += tratto(spig, L, .7, op(.55));   // gli spigoli di dentro, sottili
    return s + pth(chiuso(inviluppo(S)), "none", bordo(L, o.lw || 1.5));
  }
  // una lampadina: di giorno il vetro chiaro spento, di notte accesa col bagliore
  function lampadina(x, y, r, col) {
    col = col || "#ffd36b";
    if (NOTTE) return cer(x, y, r * 2.4, col, op(.3)) + cer(x, y, r * 1.1, rad("lpn" + col.slice(1), [[0, "#ffffff"], [.5, chiaro(col, .6)], [1, col]], .5, .5, .5), "stroke='" + scuro(col, .35) + "' stroke-width='" + f2(r * .22) + "'");
    return cer(x, y, r, rad("lpg" + col.slice(1), [[0, "#ffffff"], [.45, chiaro(col, .7)], [1, mix(col, "#a08a62", .55)]], .35, .3, .8), "stroke='#7a5214' stroke-width='" + f2(r * .25) + "'") + cer(x - r * .32, y - r * .34, r * .3, "#ffffff", op(.9));
  }
  function pStadio(ra, rb, n) {   // lo stadio (la pista): due dritti lungo a e due mezzi giri di raggio rb, in giro antiorario
    var o = [], i, lg = ra - rb; n = n || 40;
    for (i = 0; i <= n; i++) { var t = -Math.PI / 2 + i / n * Math.PI; o.push([lg + rb * Math.cos(t), rb * Math.sin(t)]); }
    for (i = 0; i <= n; i++) { var t2 = Math.PI / 2 + i / n * Math.PI; o.push([-lg + rb * Math.cos(t2), rb * Math.sin(t2)]); }
    return pulisci(o);
  }
  function vetro(d, b, k) {   // il riflesso del vetro dentro una forma (b = i suoi limiti sullo schermo)
    var w = b[2] - b[0], h = b[3] - b[1];
    return dentro(d, pth("M" + q(b[0] + w * .14, b[1]) + " L" + q(b[0] + w * .34, b[1]) + " L" + q(b[0] + w * .12, b[3]) + " L" + q(b[0] - w * .08, b[3]) + " Z", "#ffffff", op(k || .16)) +
      pth("M" + q(b[0] + w * .42, b[1]) + " L" + q(b[0] + w * .47, b[1]) + " L" + q(b[0] + w * .25, b[3]) + " L" + q(b[0] + w * .2, b[3]) + " Z", "#ffffff", op((k || .16) * .7)));
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  var VERDE = "#177a47", CUOIO_NERO = "#2b2427", CUOIO_ROSSO = "#6d1a29", MOGANO = "#7d3519", LACCA_NERA = "#231d22";
  var ROSSI = [1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36];
  var RUOTA = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26];
  var ROSSO = "#d42a2a", NERO = "#1f1f25", VERDE0 = "#1fa35a", BIANCO = "#f6f1e3";
  function colNum(n) { return n === 0 ? VERDE0 : (ROSSI.indexOf(n) >= 0 ? ROSSO : NERO); }
  function colori8() { return [FICHE.viola, FICHE.nera, FICHE.nera, FICHE.verde, FICHE.verde, FICHE.rossa, FICHE.rossa, FICHE.rossa, FICHE.bianca, FICHE.bianca]; }
  function per(l) { return l.sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }); }   // dal più lontano al più vicino

  // =========================================================
  //  CARIBBEAN STUD POKER: la mezzaluna nera laccata con l'oro, il bordo di cuoio nero dalla parte dei giocatori;
  //  sul panno verde la fascia turchese del "mare" coi cinque posti: la lucina rossa del jackpot, il cerchio della puntata
  //  e la casella della scommessa; in mezzo il ventaglio delle cinque carte di cuori (la scala reale) e la tabella delle vincite.
  //  Dalla parte del croupier: le fiches, la mescolatrice, le carte del banco. Sul bordo, sul palo d'ottone, la ruota luminosa
  //  del jackpot progressivo (le lampadine, gli spicchi colorati e il contatore rosso)
  // =========================================================
  def("tavolo_caribbean", { nome: "Tavolo del Caribbean Stud Poker", fp: [2, 2], box: [-108, -165, 108, 64], dietro: true, piano: 45,
    posti: [[-1, 0], [-1, 1], [0, 2], [1, 2], [2, 1]], croupier: [1, -1], luce: [-.6, -.74, 104, 70, "#ffd36b"] }, function () {
    var O = pMezzaluna(-.95, .95, -.82, -.2, .9, .1), ZF = 45, Z0 = 32, Z1 = 45.2, s = ombraForma(O, 1), l = [], CB = [0, -.2], RA = .95, RB = 1.1, M = 61, i;
    s += per([[-.5, -.38], [.5, -.38], [0, .1]]).map(function (g) { return gambaTornita(g[0], g[1], Z0 + .5, "#3a2f34"); }).join("");
    s += grembiule(allarga(O, -.035), Z0, Z1, LACCA_NERA, { passo: .055 });
    var Pn = allarga(O, -.11);
    s += anelloP(O, Pn, Z1, nuova([[0, "#6a5a62"], [.45, "#2e242a"], [1, "#100b0e"]], 0, 0, 1, 1), bordo(L, 1.2));   // il bordo di legno nero laccato
    function ar(k, t) { var c = Math.cos(t), s2 = Math.sin(t); return [CB[0] + RA * k * (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / 2.2), CB[1] + RB * k * Math.pow(Math.max(0, s2), 2 / 2.2)]; }
    function arco(k, t0, t1) { var o = [], j; for (j = 0; j <= 40; j++) o.push(ar(k, t0 + (t1 - t0) * j / 40)); return o; }
    function inP(pp) { return pp.map(function (x) { return [x[0] * M, x[1] * M]; }); }
    var tap = "", POS = [2.75, 2.2, 1.5708, .94, .39];
    // il mare dei Caraibi: la fascia turchese ad arco coi fili d'oro, e le onde
    var fa = arco(.9, .2, Math.PI - .2), fi = arco(.6, .2, Math.PI - .2).reverse();
    tap += pth(chiuso(inP(fa.concat(fi))), nuova([[0, "#4fe0cf"], [.5, "#1fb8a8"], [1, "#0b8c84"]], 0, 0, 0, 1), op(.78));
    tap += tratto(aperto(inP(fa)), ORO, .8) + tratto(aperto(inP(fi)), ORO, .8);
    for (i = 0; i < 4; i++) tap += tratto(aperto(inP(arco(.66 + i * .065, .32, Math.PI - .32))), "#e6fffb", .45, "stroke-dasharray='2.2 1.6 .6 1.6' opacity='" + (.8 - i * .1) + "'");
    // i cinque posti: la lucina del jackpot, il cerchio della puntata (ante) e la casella della scommessa
    POS.forEach(function (t, j) {
      var sl = ar(.81, t), an = ar(.69, t), bt = ar(.45, t), rot = Math.atan2(bt[1] - an[1], bt[0] - an[0]) * 180 / Math.PI + 90;
      tap += cer(an[0] * M, an[1] * M, .065 * M, "#e9fbf7", "stroke='" + BIANCO + "' stroke-width='.8' fill-opacity='.22'") + cer(an[0] * M, an[1] * M, .05 * M, "none", "stroke='" + ORO + "' stroke-width='.4' stroke-dasharray='1 .8'");
      tap += "<g transform='translate(" + q2(bt[0] * M, bt[1] * M) + ") rotate(" + f1(rot) + ")'>" + rett(-.075 * M, -.05 * M, .15 * M, .1 * M, 1, "#ffd43b", "fill-opacity='.3' stroke='" + ORO + "' stroke-width='.8'") + rett(-.06 * M, -.036 * M, .12 * M, .072 * M, .6, "none", "stroke='" + ORO_C + "' stroke-width='.35'") + "</g>";
      tap += cer(sl[0] * M, sl[1] * M, 2.1, nuovaR(OTTONE, .35, .3, .8), "stroke='" + L + "' stroke-width='.35'") + cer(sl[0] * M, sl[1] * M, 1.35, NOTTE ? "#ff6b6b" : "#b3121f") + cer(sl[0] * M - .4, sl[1] * M - .45, .45, "#ffffff", op(NOTTE ? .95 : .6));
      if (NOTTE) tap += cer(sl[0] * M, sl[1] * M, 3.6, "#ff4040", op(.35));
      if (j !== 1) { var cc = ar(.565, t); for (var k2 = 0; k2 < 5; k2++) tap += cartaP(cc[0] + (k2 - 2) * .022 * Math.sin(t), cc[1] - (k2 - 2) * .022 * Math.cos(t), rot + (k2 - 2) * 9, "cuori", false); }   // le cinque carte coperte
    });
    // in mezzo: la tabella delle vincite (righe finte d'oro) e il ventaglio della scala reale di cuori
    tap += tratto(aperto(inP(arco(.35, .55, Math.PI - .55))), ORO, .6) + tratto(aperto(inP(arco(.27, .62, Math.PI - .62))), ORO, .6);
    for (i = 0; i < 18; i++) { var tt = .62 + i / 17 * (Math.PI - 1.24), pa = ar(.31, tt), pb = ar(.31, tt + .045); tap += "<path d='M" + q2(pa[0] * M, pa[1] * M) + " L" + q2(pb[0] * M, pb[1] * M) + "' stroke='" + ORO_C + "' stroke-width='1.1' stroke-linecap='round' opacity='" + (i % 6 === 5 ? 0 : .8) + "'/>"; }
    for (i = 0; i < 5; i++) tap += cartaP((i - 2) * .05, -.02 + Math.abs(i - 2) * .012, (i - 2) * 11, "cuori", true);
    tap += vassoioP(-.34, .34, -.79, -.61, colori8());
    for (i = 0; i < 5; i++) tap += cartaP(-.2 + i * .1, -.47, 0, "picche", i === 4);   // le carte del banco: una scoperta
    s += panno(Pn, ZF, VERDE, tap);
    s += tubo(allarga(O, -.065).slice(0, O.dorso + 1), ZF + 1.8, 4.2, CUOIO_NERO, { aperto: true, cucitura: true, oro: true });
    // la mescolatrice automatica (grigia, col vetro fumé e la lucina verde) e le carte già giocate
    l.push([vicino(.62, -.52), blocco(.5, .74, -.64, -.42, ZF, ZF + 7.5, "#3c4048", {
      sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, rett(W * .12, H * .14, W * .76, H * .6, 1.5, "#141820", "stroke='#7d8794' stroke-width='.8'") + rett(W * .18, H * .2, W * .3, H * .22, 1, "#ffffff", op(.18)) + rett(W * .3, H * .8, W * .4, H * .08, .5, "#0b0d10")); },
      davanti: function (W, H) { return rett(W * .1, H * .3, W * .5, H * .16, .5, "#16191e") + cer(W * .8, H * .38, 1, NOTTE ? "#b2f2bb" : "#37b24d") + rett(0, H - 1.6, W, 1.6, 0, "#6b7380"); } }, 1.2)]);
    l.push([vicino(-.6, -.5), blocco(-.68, -.53, -.6, -.42, ZF, ZF + 3.2, "#f1e9dc", { sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, rett(W * .1, H * .1, W * .8, H * .8, 1, "#b3202f") + rett(W * .2, H * .2, W * .6, H * .6, .5, "none", "stroke='#f5c6cb' stroke-width='.6'")); } }, 1)]);
    // le fiches: sulle puntate e sulle scommesse dei giocatori
    [[0, .69, FICHE.rossa, 3], [0, .45, FICHE.rossa, 5], [2, .69, FICHE.verde, 2], [2, .45, FICHE.verde, 4], [3, .69, FICHE.nera, 2], [4, .69, FICHE.blu, 3], [4, .45, FICHE.blu, 6]].forEach(function (x) { var c = ar(x[1], POS[x[0]]); l.push([vicino(c[0], c[1]), fiches(c[0], c[1], ZF, x[3], x[2], .04)]); });
    l.push([vicino(-.74, .22), fiches(-.74, .24, ZF, 4, FICHE.gialla, .04)]);
    // la ruota del jackpot sul suo palo d'ottone
    var ja = -.6, jb = -.74, zc = 104, R = 17.5, ruota = "";
    ruota += tornito(ja, jb, [[ZF - .5, .045], [ZF + 1.2, .045], [ZF + 2.2, .026], [ZF + 3, .018], [zc - R - 2, .016], [zc - R + .5, .024]], OTTONE, .9, [1, 3], .5);
    var orlo = [], k;
    for (k = 0; k < 60; k++) { var t = k / 60 * 2 * Math.PI; orlo.push(P(ja + R / 61 * Math.cos(t), jb + .022, zc + R * Math.sin(t))); orlo.push(P(ja + R / 61 * Math.cos(t), jb - .022, zc + R * Math.sin(t))); }
    var bo = limiti(orlo);
    ruota += pth(chiuso(inviluppo(orlo)), nuova([[0, "#f3d67e"], [.45, "#b8862b"], [1, "#5e3f0c"]], bo[0], 0, bo[2], 0, true), bordo(L, 1.6));
    var X0 = ja * M, Y0 = -zc, fac = "";
    if (G > 0) {
      fac += cer(X0, Y0, R, nuovaR([[0, "#fff1b8"], [.6, "#e2b444"], [1, "#8a5c12"]], .35, .3, .9));
      var colS = ["#d6283b", "#f2c230", "#13a39b", "#7048e8", "#f2c230", "#2f9e44"];
      for (i = 0; i < 12; i++) {
        var a0 = -Math.PI / 2 + i / 12 * 2 * Math.PI, a1 = a0 + 2 * Math.PI / 12, r0 = R * .5, r1 = R * .8, cs = colS[i % 6];
        fac += "<path d='M" + q2(X0 + r0 * Math.cos(a0), Y0 + r0 * Math.sin(a0)) + " L" + q2(X0 + r1 * Math.cos(a0), Y0 + r1 * Math.sin(a0)) + " A" + f1(r1) + "," + f1(r1) + " 0 0,1 " + q2(X0 + r1 * Math.cos(a1), Y0 + r1 * Math.sin(a1)) + " L" + q2(X0 + r0 * Math.cos(a1), Y0 + r0 * Math.sin(a1)) + " Z' fill='" + (NOTTE ? chiaro(cs, .25) : cs) + "' stroke='#5e3f0c' stroke-width='.4'/>";
      }
      fac += cer(X0, Y0, R * .8, "none", "stroke='" + ORO_C + "' stroke-width='.6'") + cer(X0, Y0, R * .5, "#120d10", "stroke='" + ORO + "' stroke-width='1.1'");
      fac += led("8.760", X0 - ledL("8760", 3.3) / 2, Y0 - 1.65, 3.3, "#ff3b30", NOTTE);
      fac += stella(X0, Y0 - R * .5 - 2.4, 2, .85, 5, ORO_C, "stroke='" + ORO_S + "' stroke-width='.3'");
      for (i = 0; i < 14; i++) { var ab = -Math.PI / 2 + (i + .5) / 14 * 2 * Math.PI; fac += lampadina(X0 + R * .9 * Math.cos(ab), Y0 + R * .9 * Math.sin(ab), 1.05, i % 2 ? "#ffd36b" : "#ff8a5c"); }
      fac += poly([[X0 - 2.2, Y0 - R - 2.4], [X0 + 2.2, Y0 - R - 2.4], [X0, Y0 - R * .76]], "#d6283b", bordo(L, .5)) + cer(X0, Y0 - R - 2.4, 1, ORO_C, bordo(L, .35));   // la freccia in cima
      if (NOTTE) fac += cer(X0, Y0, R, nuovaR([[0, "#fff3c4", .3], [1, "#ffd27a", 0]], .5, .5, .5));
      else fac += ell(X0 - R * .35, Y0 - R * .45, R * .3, R * .16, "#ffffff", op(.35));
    } else {   // da dietro: il disco d'oro con le viti e il tappo del motore
      fac += cer(X0, Y0, R, nuovaR([[0, "#f6dc8c"], [.6, "#c99a36"], [1, "#7a5614"]], .4, .35, .9)) + cer(X0, Y0, R * .45, nuovaR([[0, "#5a5f68"], [1, "#1d2025"]], .4, .35, .8), bordo(L, .6));
      for (i = 0; i < 4; i++) { var av = i * Math.PI / 2 + .6; fac += cer(X0 + R * .72 * Math.cos(av), Y0 + R * .72 * Math.sin(av), .9, "#7a5614") + cer(X0 + R * .72 * Math.cos(av) - .25, Y0 + R * .72 * Math.sin(av) - .25, .35, "#fff3c4"); }
    }
    ruota += suB(jb + (G > 0 ? .022 : -.022), fac);
    l.push([vicino(ja, jb), ruota]);
    return s + ordina(l);
  });

  // =========================================================
  //  PAI GOW (il domino cinese, come a Macao): il tavolo laccato di rosso con le monete d'oro, le gambe nere col piede d'oro,
  //  il bordo di cuoio nero col cordoncino d'oro; sul panno rosso il medaglione d'oro con la moneta, i sei posti
  //  (la casella delle due mani e il cerchio della puntata) con le tessere scoperte; davanti al croupier la "catasta"
  //  di otto pile da quattro tessere, la ciotola d'oro coi tre dadi e il suo coperchio, le fiches del banco
  // =========================================================
  function puntiTessera(n, x, y, w) {   // i punti di mezza tessera: l'uno e il quattro rossi, gli altri bianchi
    var d = w * .27, r = w * .1, o = "";
    PUNTI[n].forEach(function (v) { o += cer(x + v[0] * d, y + v[1] * d * 1.15, n === 1 ? r * 1.7 : r, n === 1 || n === 4 ? "#ff3b3b" : "#f8f5ee"); });
    return o;
  }
  function tesseraP(x, y, ang, n1, n2) {   // una tessera stesa sul panno, scoperta (in pianta, X = a·61): nera e lucida, coi punti
    var w = .05 * 61, h = .108 * 61, o = "<g transform='translate(" + f2(x) + " " + f2(y) + ") rotate(" + f1(ang) + ")'>";
    o += rett(-w / 2 + .5, -h / 2 + .7, w, h, .7, "#000000", op(.35));
    o += rett(-w / 2, -h / 2, w, h, .7, "#1c1a20", "stroke='#5c5764' stroke-width='.35'") + rett(-w / 2 + .35, -h / 2 + .3, w * .4, h - .6, .4, "#ffffff", op(.09));
    o += "<path d='M" + f2(-w / 2 + .45) + ",0 H" + f2(w / 2 - .45) + "' stroke='#c9a227' stroke-width='.3'/>";
    return o + puntiTessera(n1, 0, -h / 4, w) + puntiTessera(n2, 0, h / 4, w) + "</g>";
  }
  def("tavolo_paigow", { nome: "Tavolo del Pai Gow", fp: [2, 2], box: [-106, -100, 106, 64], dietro: true, piano: 45,
    posti: [[-1, 0], [-1, 1], [0, 2], [1, 2], [2, 1], [2, 0]], croupier: [0, -1] }, function () {
    var O = pRene(.95, .88, .86, 3.6, .1, .4, 160), ZF = 45, Z0 = 32, Z1 = 44.6, s = ombraForma(O, 1), l = [], M = 61, i, j;
    var LAC = "#8e1a1f";
    // le gambe quadrate laccate di nero, con l'anello d'oro e il piede d'oro
    s += per([[-.62, -.5], [.62, -.5], [-.62, .52], [.62, .52]]).map(function (g) {
      var a = g[0], b = g[1], e = .036;
      return blocco(a - e - .006, a + e + .006, b - e - .006, b + e + .006, 0, 3.4, "#d9a83a", null, 1) + blocco(a - e, a + e, b - e, b + e, 3.4, Z0 + .5, "#221b1e", { davanti: function (W, H) { return rett(0, H * .12, W, 1.6, 0, ORO, op(.95)); }, fianco: function (W, H) { return rett(0, H * .12, W, 1.6, 0, ORO_S, op(.95)); } }, 1);
    }).join("");
    // la fascia laccata di rosso: i fili d'oro e le monete d'oro col buco quadrato
    s += fianco(allarga(O, -.035), Z0, Z1, LAC, LACCA, {
      righe: [[Z1 - 1.5, ORO_S, 1.6, .9], [Z1 - 1.6, ORO, 1, 1], [Z1 - 1.9, ORO_C, .4, .9], [Z0 + 1.3, ORO_S, 1.2, .85], [Z0 + 1.4, ORO, .6, .9]],
      extra: function (vv) { var zb = (Z0 + Z1) / 2 - .3; return lungoCorsa(vv, .1, function (a, b) { var c = P(a, b, zb); return cer(c[0], c[1], 2, ORO, "stroke='" + ORO_S + "' stroke-width='.4'") + rett(c[0] - .65, c[1] - .65, 1.3, 1.3, .2, scuro(LAC, .35)) + cer(c[0] - .7, c[1] - .8, .45, "#fff7d6", op(.9)); }); }
    });
    var tap = "", BI = "#f6e7b0";
    tap += "<path d='" + chiuso(allarga(O, -.2).map(function (x) { return [x[0] * M, x[1] * M]; })) + "' fill='none' stroke='" + ORO + "' stroke-width='.7' stroke-dasharray='3 1.4' opacity='.9'/>";
    // il medaglione: due anelli d'oro, la moneta col buco quadrato, gli otto puntini e le nuvolette
    var mx = 0, my = .07 * M;
    tap += cer(mx, my, .2 * M, "none", "stroke='" + ORO + "' stroke-width='1.1'") + cer(mx, my, .175 * M, "none", "stroke='" + ORO_C + "' stroke-width='.4'");
    for (i = 0; i < 8; i++) { var ta = i / 8 * 2 * Math.PI; tap += cer(mx + .14 * M * Math.cos(ta), my + .14 * M * Math.sin(ta), .7, ORO_C); }
    tap += cer(mx, my, .1 * M, nuovaR([[0, "#fff3c2"], [.5, "#e2b444"], [1, "#9c6f1c"]], .35, .3, .9), "stroke='" + ORO_S + "' stroke-width='.6'") + cer(mx, my, .085 * M, "none", "stroke='" + ORO_S + "' stroke-width='.4'");
    tap += rett(mx - .028 * M, my - .028 * M, .056 * M, .056 * M, .3, "#7d1018", "stroke='" + ORO_S + "' stroke-width='.4'");
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (v) {   // le nuvolette (i riccioli d'oro)
      var cx = mx + v[0] * .25 * M, cy = my + v[1] * .2 * M;
      tap += "<path d='M" + q2(cx - 3.6 * v[0], cy) + " c" + q2(v[0] * 1, -2.4) + " " + q2(v[0] * 3.4, -2.4) + " " + q2(v[0] * 3.6, 0) + " c" + q2(v[0] * .2, -2) + " " + q2(v[0] * 3, -2) + " " + q2(v[0] * 3.2, .2) + " c" + q2(v[0] * 1.4, .2) + " " + q2(v[0] * 1.2, 2) + " " + q2(v[0] * -.2, 2) + "' fill='none' stroke='" + ORO + "' stroke-width='.6' stroke-linecap='round'/>";
    });
    // i sei posti: la casella delle due mani (alta e bassa) col cerchio della puntata, e le quattro tessere scoperte
    var POSTI = [[-.66, -.36, -1, 0], [-.66, .3, -1, 0], [-.38, .6, 0, 1], [.38, .6, 0, 1], [.66, .3, 1, 0], [.66, -.36, 1, 0]];
    var MANI = [[[6, 6], [2, 4], [5, 1], [3, 3]], [[1, 1], [4, 6], [2, 2], [5, 6]], [[4, 4], [1, 3], [6, 5], [3, 4]], [[5, 5], [2, 6], [1, 6], [6, 6]], [[3, 3], [1, 5], [4, 4], [2, 3]], [[2, 2], [6, 3], [1, 4], [5, 5]]];
    POSTI.forEach(function (sp, k) {
      var ang = Math.atan2(sp[3], sp[2]) * 180 / Math.PI - 90, o2 = "";
      o2 += rett(-.12 * M, -.11 * M, .24 * M, .14 * M, 1, "#7d1018", "fill-opacity='.45' stroke='" + ORO + "' stroke-width='.7'") + "<path d='M0," + f2(-.105 * M) + " V" + f2(.025 * M) + "' stroke='" + ORO + "' stroke-width='.5'/>";
      o2 += cer(0, .09 * M, .055 * M, "none", "stroke='" + ORO + "' stroke-width='.8'") + cer(0, .09 * M, .042 * M, "none", "stroke='" + BI + "' stroke-width='.3' stroke-dasharray='.8 .7'");
      if (k !== 2) MANI[k].forEach(function (t2, j2) { o2 += tesseraP((j2 < 2 ? -.085 + j2 * .055 : .03 + (j2 - 2) * .055) * M, -.042 * M, j2 % 2 ? 3 : -3, t2[0], t2[1]); });
      tap += "<g transform='translate(" + q2(sp[0] * M, sp[1] * M) + ") rotate(" + f1(ang) + ")'>" + o2 + "</g>";
    });
    tap += vassoioP(-.3, .3, -.66, -.52, [FICHE.nera, FICHE.gialla, FICHE.gialla, FICHE.rossa, FICHE.rossa, FICHE.verde, FICHE.verde, FICHE.bianca, FICHE.bianca]);
    s += panno(allarga(O, -.11), ZF, "#a8161f", tap);
    s += tubo(allarga(O, -.065), ZF + 1.9, 4.3, "#1e1a1c", { cucitura: false, oro: true });
    // la catasta: otto pile da quattro tessere coperte, nere e lucide
    for (i = 0; i < 8; i++) {
      var ta2 = -.285 + i * .07;
      l.push([vicino(ta2, -.31), blocco(ta2 - .027, ta2 + .027, -.365, -.255, ZF, ZF + 4.6, "#25222a", {
        davanti: function (W, H) { var o3 = ""; for (j = 1; j < 4; j++) o3 += rett(0, H * j / 4 - .2, W, .4, 0, "#8a8494", op(.8)); return o3; },
        dietro: function (W, H) { var o3 = ""; for (j = 1; j < 4; j++) o3 += rett(0, H * j / 4 - .2, W, .4, 0, "#8a8494", op(.8)); return o3; },
        fianco: function (W, H) { var o3 = ""; for (j = 1; j < 4; j++) o3 += rett(0, H * j / 4 - .2, W, .4, 0, "#6d6776", op(.8)); return o3; },
        sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, rett(W * .12, H * .1, W * .3, H * .8, 1, "#ffffff", op(.14))); } }, .8)]);
    }
    // la ciotola d'oro (bassa e larga, sul suo piedino) coi tre dadi dentro
    var cb = [.46, -.52], Fc = forma(cb[0], cb[1], .115), ciot = "";
    ciot += corpo([giro(forma(cb[0], cb[1], .06), ZF, 1, 40), giro(forma(cb[0], cb[1], .06), ZF + 1.2, 1, 40), giro(forma(cb[0], cb[1], .085), ZF + 2, 1, 44), giro(Fc, ZF + 5, 1, 48)], OTTONE, 1.2);
    ciot += tratto(aperto(giro(forma(cb[0], cb[1], .062), ZF + 1.3, 1, 40).slice(0, 21)), ORO_S, .6, op(.8)) + tratto(aperto(giro(forma(cb[0], cb[1], .1), ZF + 3.6, 1, 48).slice(2, 23)), "#7d1018", 1.1, op(.85));
    ciot += pth(chiuso(giro(Fc, ZF + 5, 1, 48)), nuovaR([[0, "#fff3c2"], [1, "#b8862b"]], .4, .4, .8), bordo(L, 1));
    ciot += pth(chiuso(giro(Fc, ZF + 5, .86, 48)), nuovaR([[0, "#d0453a"], [.7, "#8a1018"], [1, "#4a0a0f"]], .5, .3, .8), "stroke='" + ORO_S + "' stroke-width='.5'");
    ciot += suZ(ZF + 2.6, facciaDado(5, (cb[0] - .035) * M, (cb[1] - .015) * M, 3.4, "#fbfaf5", "#1d1d22", true, "#999") + facciaDado(4, (cb[0] + .035) * M, (cb[1] - .03) * M, 3.4, "#fbfaf5", "#1d1d22", true, "#999") + facciaDado(1, (cb[0] + .005) * M, (cb[1] + .04) * M, 3.4, "#fbfaf5", "#1d1d22", true, "#999"));
    l.push([vicino(cb[0], cb[1]), ciot]);
    [[0, FICHE.rossa, 4], [2, FICHE.gialla, 3], [3, FICHE.nera, 5], [5, FICHE.verde, 2]].forEach(function (x) { var sp = POSTI[x[0]], c = [sp[0] + sp[2] * .09, sp[1] + sp[3] * .09]; l.push([vicino(c[0], c[1]), fiches(c[0], c[1], ZF, x[2], x[1], .04)]); });
    return s + ordina(l);
  });

  // =========================================================
  //  TRENTE ET QUARANTE (il gioco storico di Monte-Carlo, "rosso e nero"): il tavolo lungo di mogano sulle sei gambe tornite,
  //  col posto del croupier in mezzo a un lato lungo; sul panno verde, a destra e a sinistra, le due metà uguali coi fili gialli:
  //  la grande losanga nera e la grande losanga rossa, le zone del colore e dell'inverso (col triangolo); in mezzo le due file
  //  di carte stese dal croupier (prima il nero, poi il rosso), la cassetta delle carte di mogano e le fiches del banco, il rastrello
  // =========================================================
  def("tavolo_trente", { nome: "Tavolo del Trente et Quarante", fp: [3, 2], box: [-130, -110, 128, 68], dietro: true, piano: 45,
    posti: [[0, 2], [1, 2], [2, 2], [0, -1], [2, -1]], croupier: [1, -1] }, function () {
    var O = pRene(1.45, .9, .86, 3.6, .12, .45, 200), ZF = 45, Z0 = 33, Z1 = 44.4, s = ombraForma(O, 1), l = [], M = 61, i, GI = "#f2d16b";
    s += per([[-1.2, -.56], [0, -.56], [1.2, -.56], [-1.2, .62], [0, .66], [1.2, .62]]).map(function (g) { return gambaTornita(g[0], g[1], Z0 + .5); }).join("");
    s += grembiule(allarga(O, -.035), Z0, Z1, MOGANO);
    var tap = "", w6 = "stroke='" + GI + "' stroke-width='.7'";
    function R(a0, b0, a1, b1, x) { return rett(Math.min(a0, a1) * M, Math.min(b0, b1) * M, Math.abs(a1 - a0) * M, Math.abs(b1 - b0) * M, .8, "none", x || w6); }
    function losanga(ca, cb, ha, hb, fill) {   // la losanga, col filo giallo e il filetto di dentro
      var o = pth(chiusoP([[ca - ha, cb], [ca, cb - hb], [ca + ha, cb], [ca, cb + hb]]), fill, "stroke='" + GI + "' stroke-width='.8'");
      return o + pth(chiusoP([[ca - ha * .8, cb], [ca, cb - hb * .8], [ca + ha * .8, cb], [ca, cb + hb * .8]]), "none", "stroke='" + GI + "' stroke-width='.35' opacity='.8'") + pth(chiusoP([[ca - ha * .7, cb - hb * .05], [ca, cb - hb * .72], [ca + ha * .2, cb - hb * .52]]), "#ffffff", op(.12));
    }
    [-1, 1].forEach(function (sg) {
      function A(v) { return sg * v; }
      tap += R(A(.36), -.56, A(1.24), .62, "stroke='" + GI + "' stroke-width='1'");   // il campo di questa metà
      tap += R(A(.36), -.56, A(.96), .03) + R(A(.36), .03, A(.96), .62);   // il nero dietro, il rosso davanti
      tap += losanga(A(.66), -.265, .28, .2, NERO) + losanga(A(.66), .325, .28, .2, ROSSO);
      tap += R(A(.96), -.56, A(1.24), .1) + R(A(.96), .1, A(1.24), .62);   // il colore e l'inverso
      tap += "<g transform='translate(" + q2(A(1.1) * M, -.23 * M) + ") rotate(90)'>" + scritta(0, 0, 18, 1.5, GI, 120 + sg) + "</g>";
      tap += losanga(A(1.1), .02, .045, .04, ROSSO) + losanga(A(1.1), -.48, .045, .04, NERO);
      tap += pth(chiusoP([[A(1.02), .27], [A(1.18), .27], [A(1.1), .42]]), "none", "stroke='" + GI + "' stroke-width='.9' stroke-linejoin='round'");   // il triangolo dell'inverso
      tap += "<g transform='translate(" + q2(A(1.1) * M, .52 * M) + ")'>" + scritta(0, 0, 9, 1.2, GI, 130 + sg) + "</g>";
      tap += "<g transform='translate(" + q2(A(.66) * M, -.5 * M) + ")'>" + scritta(0, 0, 12, 1.1, GI, 140 + sg) + "</g>" + "<g transform='translate(" + q2(A(.66) * M, .565 * M) + ")'>" + scritta(0, 0, 12, 1.1, GI, 150 + sg) + "</g>";
    });
    // in mezzo: le due file di carte del croupier (il nero dietro, il rosso davanti), coi segni del colore
    tap += R(-.3, -.36, .3, -.09, "stroke='" + GI + "' stroke-width='.6' stroke-dasharray='2 1.2'") + R(-.3, -.06, .3, .21, "stroke='" + GI + "' stroke-width='.6' stroke-dasharray='2 1.2'");
    tap += losanga(-.27, -.225, .025, .025, NERO) + losanga(-.27, .075, .025, .025, ROSSO);
    [["picche", -.17], ["quadri", -.07], ["fiori", .03], ["cuori", .13]].forEach(function (c, j) { tap += cartaP(c[1] + .05, -.225, j % 2 ? 2 : -3, c[0], true); });
    [["cuori", -.12], ["picche", -.02], ["quadri", .08]].forEach(function (c, j) { tap += cartaP(c[1] + .05, .075, j % 2 ? -2 : 3, c[0], true); });
    tap += vassoioP(-.06, .3, -.6, -.46, [FICHE.nera, FICHE.nera, FICHE.viola, FICHE.verde, FICHE.rossa, FICHE.rossa, FICHE.bianca]);
    // il rastrello del croupier, posato dietro
    var ra = [.38, -.47], rb2 = [1.0, -.5];
    tap += "<path d='M" + q2(ra[0] * M + .5, ra[1] * M + .9) + " L" + q2(rb2[0] * M + .5, rb2[1] * M + .9) + "' stroke='#000' stroke-width='1.6' opacity='.25' stroke-linecap='round'/>";
    tap += "<path d='M" + q2(ra[0] * M, ra[1] * M) + " L" + q2(rb2[0] * M, rb2[1] * M) + "' stroke='#c08a4f' stroke-width='1.3' stroke-linecap='round'/>" + rett(rb2[0] * M - .6, rb2[1] * M - 4.2, 1.6, 8.4, .6, "#a8743e", "stroke='" + L + "' stroke-width='.35'");
    s += panno(allarga(O, -.11), ZF, VERDE, tap);
    s += tubo(allarga(O, -.068), ZF + 1.9, 4.3, CUOIO_NERO, { cucitura: true });
    // la cassetta delle carte: mogano con gli spigoli d'ottone, piena di mazzi (i dorsi rossi e blu)
    l.push([vicino(-.23, -.5), blocco(-.33, -.13, -.58, -.42, ZF, ZF + 6, MOGANO, {
      sopra: function (A, B, C, D, W, H) { var o = rett(W * .08, H * .1, W * .84, H * .8, 1, "#3a1a0c"), j; for (j = 0; j < 6; j++) o += rett(W * (.1 + j * .135), H * .16, W * .12, H * .68, .6, j % 2 ? "#1f4f9a" : "#b3202f", "stroke='#f4f1ea' stroke-width='.5'"); return piano(A, B, D, W, H, o + rett(0, 0, W, 1.4, 0, ORO, op(.9)) + rett(0, H - 1.4, W, 1.4, 0, ORO, op(.9))); },
      davanti: function (W, H) { return rett(0, 0, W, 1.2, 0, ORO, op(.9)) + rett(0, H - 1.2, W, 1.2, 0, ORO, op(.9)) + rett(W / 2 - 2.2, H / 2 - 1.2, 4.4, 2.4, .5, ORO, "stroke='" + ORO_S + "' stroke-width='.3'"); },
      dietro: function (W, H) { return rett(0, 0, W, 1.2, 0, ORO, op(.9)) + rett(0, H - 1.2, W, 1.2, 0, ORO, op(.9)); },
      fianco: function (W, H) { return rett(0, 0, W, 1.2, 0, ORO_S, op(.9)) + rett(0, H - 1.2, W, 1.2, 0, ORO_S, op(.9)); } }, 1.2)]);
    // le puntate: sulle losanghe, sul colore e sull'inverso
    [[-.66, .32, FICHE.rossa, 5], [-.6, .4, FICHE.verde, 2], [.66, .33, FICHE.nera, 3], [.7, -.26, FICHE.viola, 4], [-.66, -.27, FICHE.gialla, 3], [-1.1, .34, FICHE.blu, 2], [1.1, -.2, FICHE.rossa, 3], [.6, -.18, FICHE.nera, 2]].forEach(function (x) { l.push([vicino(x[0], x[1]), fiches(x[0], x[1], ZF, x[3], x[2], .04)]); });
    return s + ordina(l);
  });

  // =========================================================
  //  TAVOLO DEL BINGO: il tavolo lungo di mogano sulle gambe tornite, col bordo d'ottone e il panno verde intarsiato;
  //  quattro posti (due per lato) con le cartelle colorate (i 15 numeri, i segni del pennarello e i gettoni colorati),
  //  il pennarello del bingo in piedi accanto a ogni posto, e in mezzo la ciotolina d'ottone piena di gettoni colorati
  // =========================================================
  var COL_CART = ["#ff5fa2", "#ffc933", "#4dabf7", "#5fd17a", "#ff922b", "#a98bff"];
  function cartella(x, y, ang, col, seme, segno) {   // una cartella (in pianta): la cornice colorata, 3 righe da 9 caselle con 15 numeri, i segni del pennarello
    var w = .37 * 61, h = .13 * 61, r = rnd(seme), cw = (w - 1.6) / 9, ch = (h - 1.6) / 3, i, j, o = "<g transform='translate(" + q2(x, y) + ") rotate(" + f1(ang) + ")'>";
    o += rett(-w / 2 + .5, -h / 2 + .7, w, h, .7, "#000000", op(.3));
    o += rett(-w / 2, -h / 2, w, h, .7, col, "stroke='" + scuro(col, .35) + "' stroke-width='.3'") + rett(-w / 2 + .8, -h / 2 + .8, w - 1.6, h - 1.6, .25, "#fffdf6");
    for (j = 0; j < 3; j++) {
      var cols = [0, 1, 2, 3, 4, 5, 6, 7, 8];
      for (i = 0; i < 4; i++) cols.splice(Math.floor(r() * cols.length), 1);   // in ogni riga 5 numeri su 9 caselle
      for (i = 0; i < 9; i++) {
        var cx = -w / 2 + .8 + (i + .5) * cw, cy = -h / 2 + .8 + (j + .5) * ch;
        if (cols.indexOf(i) < 0) { o += rett(cx - cw / 2 + .15, cy - ch / 2 + .15, cw - .3, ch - .3, .15, chiaro(col, .55)); continue; }
        o += numero(String(i * 10 + 1 + Math.floor(r() * 9)), cx, cy, 1.3, "#26262e", .32);
        if (segno && r() < .42) o += cer(cx, cy, 1.25, segno, op(.65));
      }
    }
    for (i = 1; i < 9; i++) o += rett(-w / 2 + .8 + i * cw - .05, -h / 2 + .8, .1, h - 1.6, 0, scuro(col, .1), op(.5));
    return o + rett(-w / 2 + .8, -h / 2 + .8 + ch - .05, w - 1.6, .1, 0, scuro(col, .1), op(.5)) + rett(-w / 2 + .8, -h / 2 + .8 + 2 * ch - .05, w - 1.6, .1, 0, scuro(col, .1), op(.5)) + "</g>";
  }
  function pennarello(a, b, z, col) {   // il pennarello del bingo: la boccetta tozza di plastica colorata, col tappo largo
    var o = tornito(a, b, [[z, .04], [z + 4.2, .04], [z + 5, .034], [z + 5.4, .026]], [[0, chiaro(col, .55)], [.35, col], [.75, scuro(col, .3)], [1, scuro(col, .55)]], .8, [1], .9);
    o += tornito(a, b, [[z + 5.2, .036], [z + 7.6, .036], [z + 8.1, .028]], [[0, chiaro(col, .3)], [.4, scuro(col, .15)], [1, scuro(col, .55)]], .8, [1], .6);
    var c = P(a, b, z + 2.3);
    return o + rett(c[0] - 2.4, c[1] - 1.4, 4.8, 2.4, .5, "#ffffff", op(.85)) + cer(c[0], c[1] - .2, .7, col, op(.85));   // l'etichetta
  }
  def("tavolo_bingo", { nome: "Tavolo del bingo", fp: [2, 1], box: [-90, -90, 90, 52], dietro: true, piano: 46,
    posti: [[0, -1], [1, -1], [0, 1], [1, 1]] }, function () {
    var A0 = -.94, A1 = .94, B0 = -.42, B1 = .42, ZT = 46, ZA = 41.5, s = "", l = [], M = 61, i;
    var Pt = pRett(A0, A1, B0, B1, .06, 4), Pi = pRett(A0 + .075, A1 - .075, B0 + .075, B1 - .075, .03, 3);
    s += ombraForma(Pt, .9);
    s += per([[-.8, -.29], [.8, -.29], [-.8, .29], [.8, .29]]).map(function (g) { return gambaTornita(g[0], g[1], ZA - 6.5); }).join("");
    s += grembiule(pRett(A0 + .05, A1 - .05, B0 + .05, B1 - .05, .04, 3), ZA - 7, ZA, MOGANO, { passo: .07 });
    // il piano: lo spessore di mogano col filo d'ottone, la cornice lucida e il panno verde intarsiato
    s += fianco(Pt, ZA, ZT, "#8a3c1c", LACCA, { righe: [[ZT - 1.1, ORO_S, 1.2, .9], [ZT - 1.2, ORO, .7, 1], [ZA + 1, "#3a1608", .8, .6]] });
    var bs = limiti(aSchermo(Pt, ZT));
    s += anelloP(Pt, Pi, ZT, nuova([[0, "#c8834f"], [.45, "#8c3e1c"], [1, "#4e1c0a"]], bs[0], 0, bs[2], 0, true), bordo(L, 1.1));
    s += tratto(chiuso(aSchermo(allarga(Pi, .02), ZT)), ORO, .7, op(.95)) + tratto(chiuso(aSchermo(allarga(Pt, -.02), ZT)), "#ffe2b8", .5, op(.45));
    var tap = "", POSTI = [[-.47, .2, 0], [.47, .2, 0], [-.47, -.2, 180], [.47, -.2, 180]], DAUB = ["#ff3d8b", "#20b4f0", "#2fbf55", "#ff8a1c"];
    tap += "<path d='M" + q2(-.82 * M, 0) + " H" + q2(.82 * M, 0) + "' stroke='" + ORO + "' stroke-width='.5' stroke-dasharray='2.5 1.5' opacity='.8'/>";
    function gettone(gx, gy, gc) { return cer(gx + .35, gy + .45, 1.5, "#000000", op(.3)) + cer(gx, gy, 1.5, gc, "stroke='" + scuro(gc, .45) + "' stroke-width='.35'") + cer(gx, gy, .9, "none", "stroke='#ffffff' stroke-width='.3' opacity='.6'") + cer(gx - .4, gy - .45, .45, "#ffffff", op(.85)); }
    POSTI.forEach(function (p2, k) {
      var sg = p2[2] ? -1 : 1, d1 = .072 * sg, o2 = "", pen = k === 0 || k === 3, gr = rnd(500 + k);
      o2 += cartella((p2[0] - .02) * M, (p2[1] - d1) * M, p2[2] + (k % 2 ? 3 : -2), COL_CART[(k * 2) % 6], 300 + k * 17, pen ? DAUB[k] : null);
      o2 += cartella((p2[0] + .015) * M, (p2[1] + d1) * M, p2[2] + (k % 2 ? -1 : 2), COL_CART[(k * 2 + 1) % 6], 301 + k * 17, pen ? DAUB[k] : null);
      if (!pen) {   // chi gioca coi gettoni: i gettoni colorati sui numeri usciti e il mucchietto accanto
        for (i = 0; i < 7; i++) o2 += gettone((p2[0] + (gr() - .5) * .3) * M, (p2[1] + (gr() - .5) * .22) * M, COL_CART[(k + i) % 6]);
        for (i = 0; i < 6; i++) o2 += gettone((p2[0] * 1.72 + (gr() - .5) * .07) * M, (p2[1] * 1.15 + (gr() - .5) * .08) * M, COL_CART[Math.floor(gr() * 6)]);
      }
      tap += o2;
    });
    s += panno(Pi, ZT, "#1b6e47", tap);
    // la ciotolina d'ottone coi gettoni, e i pennarelli in piedi
    var cc = [0, 0], Fd = forma(cc[0], cc[1], .085), cio = corpo([giro(forma(0, 0, .055), ZT, 1, 36), giro(Fd, ZT + 3.2, 1, 44)], OTTONE, 1);
    cio += pth(chiuso(giro(Fd, ZT + 3.2, 1, 44)), nuovaR([[0, "#fff3c2"], [1, "#b8862b"]], .4, .4, .8), bordo(L, .8));
    var gt = rnd(77), gg = "";
    for (i = 0; i < 16; i++) { var an = gt() * 6.283, rr = Math.sqrt(gt()) * .055, pc = P(cc[0] + rr * Math.cos(an), cc[1] + rr * Math.sin(an), ZT + 2.4 + gt()), col = COL_CART[i % 6]; gg += ell(pc[0], pc[1], 1.5, .8, col, "stroke='" + scuro(col, .45) + "' stroke-width='.3'") + ell(pc[0] - .3, pc[1] - .25, .5, .25, "#ffffff", op(.75)); }
    cio += dentro(chiuso(giro(Fd, ZT + 3.2, .88, 44)), pth(chiuso(giro(Fd, ZT + 3.2, .88, 44)), "#5e3f0c") + gg);
    l.push([vicino(0, 0), cio]);
    [[-.8, .25, 0], [-.72, .3, 2], [.8, -.25, 3], [.72, -.3, 1]].forEach(function (x) { l.push([vicino(x[0], x[1]), pennarello(x[0], x[1], ZT, DAUB[x[2]])]); });
    return s + ordina(l);
  });

  // =========================================================
  //  ROULETTE ELETTRONICA (Las Vegas): il mobile tondo laccato nero e viola coi filetti d'oro e la fila di lucine,
  //  lo zoccolo con la striscia di luce e il poggiapiedi cromato; in mezzo, sotto la cupola di vetro, il cilindro vero
  //  (mogano, ottone, i 37 numeri e la pallina) che gira da solo; tutto attorno le otto postazioni con lo schermo
  //  inclinato (il tappeto dei numeri rossi e neri, le fiches e la ruotina), il bracciolo imbottito di velluto bordeaux.
  //  Di notte si accendono gli schermi, le lucine, la striscia rosa e la cupola
  // =========================================================
  function cilindro(ca, cb, z0, k) {   // il cilindro della roulette (lo stesso dei tavoli), grande k volte
    var R0 = .46 * k, R1 = .415 * k, R2 = .352 * k, R3 = .312 * k, R4 = .232 * k, ZR = z0 + 7.5 * k, ZT = ZR - 1.3 * k, ZN = ZR - 2 * k, ZP = ZR - 2.7 * k, s = "", i;
    function C(R, z) { var c = P(ca, cb, z); return [c[0], c[1], R * 70.71, R * 35.36]; }
    function E(R, z) { var c = C(R, z); return dEll(c[0], c[1], c[2], c[3]); }
    function meta(R, z) { var c = C(R, z), o = [], j; for (j = 0; j <= 24; j++) { var t = Math.PI * j / 24; o.push([c[0] + c[2] * Math.cos(t), c[1] + c[3] * Math.sin(t)]); } return o; }
    s += corpo([giro(forma(ca, cb, R0), z0 + .2, 1, 64), giro(forma(ca, cb, R0), ZR, 1, 64)], [[0, "#c88356"], [.22, "#9a4a24"], [.55, "#6a2a12"], [1, "#2e1006"]], 1.6);
    s += tratto(aperto(meta(R0, ZR - 1 * k)), ORO, 1.5) + tratto(aperto(meta(R0, ZR - 1.3 * k)), ORO_C, .5, op(.9)) + tratto(aperto(meta(R0, z0 + 1.6 * k)), ORO, 1, op(.9));
    s += pth(E(R0, ZR) + " " + E(R1, ZR), nuova([[0, "#b8693e"], [.5, "#7d3519"], [1, "#4a1c0b"]], 0, 0, 1, 1), "fill-rule='evenodd' " + bordo(L, 1.2));
    s += pth(E(R1, ZR) + " " + E(R2, ZT), nuova([[0, "#e0b07c"], [.5, "#b97a45"], [1, "#7e4720"]], 0, 0, 1, 1), "fill-rule='evenodd' stroke='" + L + "' stroke-width='.6'");
    s += tratto(E(R1 - .006, ZR - .2), "#fff3dc", .5, op(.55));
    for (i = 0; i < 8; i++) {   // i rombi d'ottone sulla pista
      var t = i / 8 * 2 * Math.PI + .2, rr = (R1 + R2) / 2 - .005, cx = ca + rr * Math.cos(t), cy = cb + rr * Math.sin(t), ux = Math.cos(t), uy = Math.sin(t), lx = -uy, ly = ux, al = (i % 2 ? .022 : .012) * k, tr = (i % 2 ? .009 : .016) * k;
      s += poly([P(cx + ux * al, cy + uy * al, ZT + .9), P(cx + lx * tr, cy + ly * tr, ZT + 1.4), P(cx - ux * al, cy - uy * al, ZT + .9), P(cx - lx * tr, cy - ly * tr, ZT + 1.4)], ORO_C, bordo(ORO_S, .35));
    }
    var celle = "", tasche = "", n = RUOTA.length, a0 = -Math.PI / 2;
    for (i = 0; i < n; i++) {
      var t0 = a0 + i / n * 2 * Math.PI, t1 = a0 + (i + 1) / n * 2 * Math.PI, tm = (t0 + t1) / 2, col = colNum(RUOTA[i]);
      celle += pth(chiusoP([[ca + R2 * Math.cos(t0), cb + R2 * Math.sin(t0)], [ca + R2 * Math.cos(tm), cb + R2 * Math.sin(tm)], [ca + R2 * Math.cos(t1), cb + R2 * Math.sin(t1)], [ca + R3 * Math.cos(t1), cb + R3 * Math.sin(t1)], [ca + R3 * Math.cos(t0), cb + R3 * Math.sin(t0)]]), col);
      tasche += pth(chiusoP([[ca + R3 * Math.cos(t0), cb + R3 * Math.sin(t0)], [ca + R3 * Math.cos(t1), cb + R3 * Math.sin(t1)], [ca + R4 * Math.cos(t1), cb + R4 * Math.sin(t1)], [ca + R4 * Math.cos(t0), cb + R4 * Math.sin(t0)]]), scuro(col, .25));
      celle += cer((ca + (R2 + R3) / 2 * Math.cos(tm)) * 61, (cb + (R2 + R3) / 2 * Math.sin(tm)) * 61, .38 * k, "#f6f1e3", op(.85));
    }
    s += suZ(ZN, celle) + suZ(ZP, tasche);
    s += pth(E(R2, ZN), "none", "stroke='" + ORO + "' stroke-width='.7'") + pth(E(R3, ZN), "none", "stroke='" + ORO_C + "' stroke-width='.45'");
    var sep = "";
    for (i = 0; i < n; i++) { var ts = a0 + i / n * 2 * Math.PI; sep += "M" + q(P(ca + R4 * Math.cos(ts), cb + R4 * Math.sin(ts), ZP + .9)) + " L" + q(P(ca + R2 * Math.cos(ts), cb + R2 * Math.sin(ts), ZN + .1)) + " "; }
    s += tratto(sep, "#dfe4e8", .45, op(.9));
    s += corpo([giro(forma(ca, cb, R4), ZP, 1, 48), giro(forma(ca, cb, R4 * .55), ZP + 1.6 * k, 1, 40), giro(forma(ca, cb, .07 * k), ZR + .4 * k, 1, 24)], [[0, "#e5b47a"], [.35, "#b06a34"], [.7, "#7a3a16"], [1, "#401806"]], .9);
    s += pth(E(R4 * .72, ZP + 1 * k), "none", "stroke='" + ORO + "' stroke-width='.6' opacity='.9'");
    for (i = 0; i < 4; i++) { var tr2 = i * Math.PI / 2 + Math.PI / 4; s += tratto(linea(P(ca + .07 * k * Math.cos(tr2), cb + .07 * k * Math.sin(tr2), ZR + .2), P(ca + R4 * .95 * Math.cos(tr2), cb + R4 * .95 * Math.sin(tr2), ZP + .3)), ORO, .9, op(.95)); }
    var bracci = [[1, 0], [0, 1], [-1, 0], [0, -1]].map(function (v) { return { v: vicino(v[0], v[1]), d: v }; }).sort(function (x, y) { return x.v - y.v; });
    var ZC = ZR + 5.6 * k, LB = .095 * k;
    function braccio(v) { var e = P(ca + v[0] * LB, cb + v[1] * LB, ZC); return ottone(linea(P(ca, cb, ZC), e), .9) + pallina(e, 1.25 * k, ORO, .5); }
    s += bracci.filter(function (x) { return x.v < 0; }).map(function (x) { return braccio(x.d); }).join("");
    s += tornito(ca, cb, [[ZR, .03 * k], [ZR + .8 * k, .024 * k], [ZR + 1.2 * k, .014 * k], [ZC - .6 * k, .012 * k], [ZC, .02 * k], [ZC + .6 * k, .012 * k], [ZC + 2.2 * k, .009 * k]], OTTONE, .7, null, .5) + pallina(P(ca, cb, ZC + 2.5 * k), 1.1 * k, ORO, .5);
    s += bracci.filter(function (x) { return x.v >= 0; }).map(function (x) { return braccio(x.d); }).join("");
    var tb = (G > 0 ? .85 : .85 + Math.PI), rp = (R3 + R4) / 2 + .01, cp = P(ca + rp * Math.cos(tb), cb + rp * Math.sin(tb), ZP + 1.1);
    return s + ell(cp[0] + .5, cp[1] + .6, 1.6 * k, .7 * k, "#000", op(.35)) + pallina(cp, 1.35 * k, "#fbf8ee", .5);
  }
  function schermoRoulette(W, H) {   // lo schermo di una postazione: il tappeto dei numeri, le fiches e la ruotina
    var o = rett(0, 0, W, H, 2.4, "#0d0b10", "stroke='" + ORO + "' stroke-width='.8'"), x0 = 3, y0 = 3, w = W - 6, h = H - 6, i, j;
    o += rett(x0, y0, w, h, 1.2, NOTTE ? nuova([[0, "#2bd57d"], [1, "#0f7a45"]], 0, 0, 0, 1) : nuova([[0, "#1c9a5a"], [1, "#0b5732"]], 0, 0, 0, 1));
    var gx = x0 + 5, gw = w * .62, cw = gw / 12, ch = h * .22, gy = y0 + 2.2;
    o += pth("M" + q2(gx, gy) + " L" + q2(gx - 3.6, gy + ch * 1.5) + " L" + q2(gx, gy + ch * 3) + " Z", NOTTE ? "#4bf08f" : VERDE0, "stroke='#ffffff' stroke-width='.3'");
    for (i = 0; i < 12; i++) for (j = 0; j < 3; j++) { var nn = 3 * i + 3 - j; o += rett(gx + i * cw, gy + j * ch, cw, ch, 0, colNum(nn) === ROSSO ? (NOTTE ? "#ff4b4b" : ROSSO) : (NOTTE ? "#2a2a36" : NERO), "stroke='#ffffff' stroke-width='.25'"); }
    for (i = 0; i < 3; i++) o += rett(gx + i * 4 * cw, gy + 3 * ch + .6, 4 * cw, ch * .8, 0, "none", "stroke='#ffffff' stroke-width='.3'");
    [[2, 1, FICHE.gialla], [7, 0, FICHE.azzurra], [9, 2, FICHE.rosa]].forEach(function (f) { o += cer(gx + (f[0] + .5) * cw, gy + (f[1] + .5) * ch, 1.3, f[2], "stroke='#ffffff' stroke-width='.35'"); });
    var rx = x0 + w - 6.2, ry = y0 + h / 2 - .6, rr = 4.6;   // la ruotina
    o += cer(rx, ry, rr, "#5a2a12", "stroke='" + ORO + "' stroke-width='.6'");
    for (i = 0; i < 12; i++) { var a1 = i / 12 * 2 * Math.PI, a2 = (i + 1) / 12 * 2 * Math.PI; o += "<path d='M" + q2(rx + rr * .5 * Math.cos(a1), ry + rr * .5 * Math.sin(a1)) + " L" + q2(rx + rr * .9 * Math.cos(a1), ry + rr * .9 * Math.sin(a1)) + " L" + q2(rx + rr * .9 * Math.cos(a2), ry + rr * .9 * Math.sin(a2)) + " L" + q2(rx + rr * .5 * Math.cos(a2), ry + rr * .5 * Math.sin(a2)) + " Z' fill='" + (i % 2 ? (NOTTE ? "#ff4b4b" : ROSSO) : NERO) + "'/>"; }
    o += cer(rx, ry, rr * .45, ORO_C) + cer(rx + rr * .7, ry - rr * .3, .7, "#ffffff");
    o += led("17", rx - 3.1, y0 + 1.4, 2.6, "#ffe066", NOTTE);
    o += rett(x0 + 1, y0 + h - 3.4, w * .5, 2.2, .6, "#000000", op(.35)) + led("2.500", x0 + 2, y0 + h - 3.1, 1.6, "#ffe066", NOTTE);
    o += pth("M" + q2(x0 + w * .15, y0) + " L" + q2(x0 + w * .38, y0) + " L" + q2(x0 + w * .2, y0 + h) + " L" + q2(x0 - w * .03, y0 + h) + " Z", "#ffffff", op(NOTTE ? .06 : .14));   // il riflesso del vetro
    if (NOTTE) o += rett(x0, y0, w, h, 1.2, nuovaR([[0, "#ffffff", .25], [1, "#ffffff", 0]], .5, .4, .7));
    return o;
  }
  def("roulette_elettronica", { nome: "Roulette elettronica", fp: [3, 3], box: [-160, -150, 160, 90],
    posti: [[3, 2], [3, 0], [2, 3], [0, 3], [-1, 2], [-1, 0], [0, -1], [2, -1]], luce: [0, 0, 74, 165, "#ff9ad8"] }, function () {
    var Rb = 1.4, Rc = 1.32, ZB = 5, ZT = 40, s = "", i, VIOLA = "#2b1c3a";
    var Ob = pOvale(0, 0, Rb, Rb, 2, 128), Oc = pOvale(0, 0, Rc, Rc, 2, 128), Op = pOvale(0, 0, .66, .66, 2, 96);
    var ANG = [[2, 1], [2, -1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2]].map(function (v) { return Math.atan2(v[1], v[0]); });
    s += ombraForma(Ob, 1.1);
    // lo zoccolo con la striscia di luce
    s += fianco(Ob, 0, ZB, "#17131c", LACCA, { righe: NOTTE ? [[ZB * .5, "#ff5fd2", 3.4, .5], [ZB * .5, "#ffe3f8", 1.2, 1]] : [[ZB * .5, "#a3328c", 1.3, .95]] });
    s += anelloP(Ob, Oc, ZB, "#0f0b12", "stroke='" + L + "' stroke-width='.8'");
    // il mobile: le formelle dorate sotto le postazioni, i filetti d'oro, la fila di lucine
    s += fianco(Oc, ZB, ZT, VIOLA, LACCA, { righe: [[ZT - 1.6, ORO_S, 1.4, .9], [ZT - 1.7, ORO, .8, 1], [ZT - 1.9, ORO_C, .3, .9], [ZB + 1.6, ORO, .9, .9]],
      extra: function (vv) { return lungoCorsa(vv, .085, function (a, b) { var c = P(a, b, ZT - 5); return lampadina(c[0], c[1], .85, "#ff8fe0"); }); } });
    ANG.forEach(function (t) {
      if (vicino(Math.cos(t), Math.sin(t)) <= .15) return;
      var pp = [], j, d = .21;
      [[t - d, ZB + 5], [t + d, ZB + 5], [t + d, ZT - 9], [t - d, ZT - 9]].forEach(function (x) { pp.push(P(Rc * Math.cos(x[0]), Rc * Math.sin(x[0]), x[1])); });
      var c2 = [];
      [[t - d * .8, ZB + 6.5], [t + d * .8, ZB + 6.5], [t + d * .8, ZT - 10.5], [t - d * .8, ZT - 10.5]].forEach(function (x) { c2.push(P(Rc * Math.cos(x[0]), Rc * Math.sin(x[0]), x[1])); });
      s += poly(pp, "none", "stroke='" + (NOTTE ? "#ffe9a8" : ORO) + "' stroke-width='1' stroke-linejoin='round'") + poly(c2, NOTTE ? "#ff6fd0" : "#000000", "opacity='" + (NOTTE ? .16 : .18) + "' stroke='" + ORO_C + "' stroke-width='.4'");
      var cc = P(Rc * Math.cos(t), Rc * Math.sin(t), (ZB + ZT) / 2 - 2);
      if (NOTTE) s += cer(cc[0], cc[1], 5.5, "#ffd6f5", op(.3));
      s += stella(cc[0], cc[1], 3, 1.3, 4, NOTTE ? "#fff6d8" : ORO, "stroke='" + ORO_S + "' stroke-width='.3'");
    });
    // il poggiapiedi cromato (si vede la metà davanti) coi suoi sostegni
    var Rf = 1.5, t0 = G > 0 ? .75 * Math.PI : -.25 * Math.PI;
    function arco(R, ta, tb, z) { var o = [], j; for (j = 0; j <= 48; j++) { var t = ta + (tb - ta) * j / 48; o.push(P(R * Math.cos(t), R * Math.sin(t), z)); } return o; }
    var fr = aperto(arco(Rf, t0 + Math.PI - .2, t0 + 2 * Math.PI + .2, 9));
    for (i = 0; i < 6; i++) { var ts = t0 + Math.PI + (i + .5) / 6 * Math.PI; s += cromo(linea(P(Rc * Math.cos(ts), Rc * Math.sin(ts), 9), P(Rf * Math.cos(ts), Rf * Math.sin(ts), 9)), 1); }
    s += tratto(fr, L, 4.4) + tratto(fr, "#9aa6ae", 2.6) + tratto(fr, "#ffffff", .9, "transform='translate(-.3 -.6)' opacity='.9'");
    // il piano di vetro nero coi cerchi d'oro
    s += anelloP(Oc, Op, ZT, nuova([[0, "#4d3a60"], [.5, "#1d1428"], [1, "#0b0710"]], 0, 0, 1, 1), bordo(L, 1.2));
    s += tratto(chiuso(aSchermo(pOvale(0, 0, 1.25, 1.25, 2, 110), ZT)), ORO, .7, op(.9)) + tratto(chiuso(aSchermo(pOvale(0, 0, .76, .76, 2, 90), ZT)), ORO, .7, op(.9));
    // il bracciolo: la metà lontana
    var Rr = Rc - .03;
    var anello = tubo(pOvale(0, 0, Rr, Rr, 2, 128), ZT + 2.3, 3.4, "#7a1035", { cucitura: true });
    s += anello;
    // le postazioni: lo schermo inclinato verso chi gioca, la fessura dei biglietti e i bottoni
    function postazione(t) {
      var ca = Math.cos(t), sa = Math.sin(t), ta = -sa, tb2 = ca;
      function V(r, u, z) { return [ca * r + ta * u, sa * r + tb2 * u, z]; }
      var r0 = .84, r1 = 1.2, h0 = .17, h1 = .25, zl = ZT, zo = ZT + 5, zi = ZT + 19;
      var Vv = [V(r1, -h1, zl), V(r1, h1, zl), V(r0, h0, zl), V(r0, -h0, zl), V(r1, -h1, zo), V(r1, h1, zo), V(r0, h0, zi), V(r0, -h0, zi)];
      return solido(Vv, [[4, 5, 6, 7], [0, 1, 5, 4], [3, 2, 6, 7], [0, 4, 7, 3], [1, 5, 6, 2]], "#2a2232", LACCA, {
        dec: {
          0: function (pp) { return piano(pp[3], pp[2], pp[0], 40, 30, schermoRoulette(40, 30)); },
          1: function (pp) { return piano(pp[3], pp[2], pp[0], 30, 5, rett(3, 1.4, 8, 1.4, .5, "#0b0b0f") + cer(19, 2.3, 1.2, NOTTE ? "#8cff9e" : "#2f9e44") + cer(23.5, 2.3, 1.2, NOTTE ? "#ff8787" : "#e03131") + rett(0, 0, 30, .7, 0, ORO, op(.9))); },
          2: function (pp) { return piano(pp[3], pp[2], pp[0], 20, 19, rett(2, 3, 16, 12, 1, "#000000", op(.25)) + rett(0, 0, 20, .8, 0, ORO, op(.8))); }
        }, lw: 1.3 });
    }
    var vicine = [], lontane = [];
    ANG.forEach(function (t) { (vicino(Math.cos(t), Math.sin(t)) < 0 ? lontane : vicine).push(t); });
    function ordinaT(l) { return l.sort(function (x, y) { return vicino(Math.cos(x), Math.sin(x)) - vicino(Math.cos(y), Math.sin(y)); }); }
    s += ordinaT(lontane).map(postazione).join("");
    // in mezzo: l'anello cromato, il cilindro e la cupola di vetro
    var Fc = forma(0, 0, .64), ZC = ZT + 6;
    s += corpo([giro(Fc, ZT, 1, 80), giro(Fc, ZC, 1, 80)], [[0, "#ffffff"], [.25, "#dfe5ea"], [.6, "#8d98a1"], [1, "#4d5760"]], 1.4);
    s += tratto(aperto(giro(Fc, ZT + 2.2, 1, 80).slice(0, 41)), NOTTE ? "#ff8fe0" : "#7d2e70", NOTTE ? 1.6 : 1.1, op(.95));
    s += pth(chiuso(giro(Fc, ZC, 1, 80)), nuovaR([[0, "#3a2c46"], [1, "#120c18"]], .45, .4, .7), bordo(L, 1));
    s += cilindro(0, 0, ZC, 1.15);
    var Fd = forma(0, 0, .62), lv = [], k2, HD = 30;
    for (k2 = 0; k2 <= 8; k2++) { var an = k2 / 8 * Math.PI / 2; lv.push(giro(Fd, ZC + Math.sin(an) * HD, Math.max(.02, Math.cos(an)), 64)); }
    var cup = sagoma(lv), bc = limiti(cup), dc = chiuso(cup);
    s += pth(dc, nuovaR(NOTTE ? [[0, "#fff6e0", .35], [.6, "#ffd1f0", .22], [1, "#d58fd0", .45]] : [[0, "#ffffff", .08], [.7, "#d8f0ff", .16], [1, "#9fd4f2", .4]], .45, .45, .65), bordo("#5c7f96", 1.1));
    s += vetro(dc, bc, .2) + dentro(dc, tratto("M" + q(bc[0] + (bc[2] - bc[0]) * .78, bc[1] + (bc[3] - bc[1]) * .2) + " q" + q((bc[2] - bc[0]) * .12, (bc[3] - bc[1]) * .22) + " " + q((bc[2] - bc[0]) * .08, (bc[3] - bc[1]) * .6), "#ffffff", 1.2, op(.55)));
    s += tratto(aperto(giro(Fd, ZC + .6, 1, 64).slice(0, 33)), "#e9eef2", 1.6) + tratto(aperto(giro(Fd, ZC + .6, 1, 64).slice(0, 33)), "#ffffff", .5, "transform='translate(0 -.5)'");
    s += pallina(P(0, 0, ZC + HD + 1.6), 2.3, ORO, .7) + tornito(0, 0, [[ZC + HD - 1, .05], [ZC + HD + .4, .035]], OTTONE, .8);
    s += ordinaT(vicine).map(postazione).join("");
    // il bracciolo: la metà vicina (lo stesso anello, ritagliato sotto il suo centro)
    s += dentro("M-300," + f1(-(ZT + 2.3)) + " H300 V300 H-300 Z", anello);
    return s;
  });
  function cromo(d, w) { return tratto(d, L, w + 2.4) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.7, w * .38), "opacity='.95' transform='translate(-.4 -.5)'"); }

  // @@QUI@@

  // =========================================================
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var o;
      if (d.tipo === "parete") {   // da parete: largo 62 per ogni pezzo di muro, alto 200
        o = { tipo: "parete", nome: d.nome, stanza: "casino", reparto: "casino", w: 62 * d.largo, h: 200, fp: [d.largo, 1], prezzo: 0, qual: 2 };
        if (d.luce) o.luce = d.luce.slice();
        return o;
      }
      var m = misure(d);
      o = { tipo: "piedi", nome: d.nome, stanza: "casino", reparto: "casino", w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice(), dietro: !!d.dietro, prezzo: 0, qual: 2 };
      if (d.piano) o.piano = d.piano;
      if (d.posti) o.posti = d.posti.map(function (x) { return x.slice(); });
      if (d.croupier) o.croupier = d.croupier.slice();
      if (d.luce) { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      p = "cgi" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!(opz.notte && d.luce);
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      var defs = DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "";
      if (d.tipo === "parete") { var w = 62 * d.largo; return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " 200' width='" + w + "' height='200'>" + defs + c + "</svg>"; }
      var m = misure(d);
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + defs +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

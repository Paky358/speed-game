/* =========================================================
   SPeeD GAME — I MOBILI DELLA CAMERA, ROBA BELLA (vista dall'alto, come il bagno di js/mobili-arte.js)
   Letto con la trapunta, letto a baldacchino, comodino, lampada da comodino, armadio a tre ante,
   cassettiera arcobaleno, scrivania, sedia da ufficio: gli stessi mobili della casa vista di lato (casa.js),
   stessi nomi, prezzi e colori, visti dall'alto in diagonale.
   Misure: una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   È la roba che si compra: legno lucido con le venature, ottone, velluto, trapunte imbottite e cucite.
   Si aggiunge a SGMobiliArte con SGMobiliArte.aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte) return;

  // ---------- attrezzi (come nel bagno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato (da dietro)
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(o) { return "opacity='" + Math.round(o * 100) / 100 + "'"; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f1(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f1(rx) + "' ry='" + f1(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f1(x) + "' y='" + f1(y) + "' width='" + f1(w) + "' height='" + f1(h) + "'" + (r ? " rx='" + f1(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + (w || 2.4) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f1(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q(a) + " L" + q(b); }
  function fascio(segs, c, w, x) { return segs.length ? tratto(segs.map(function (g) { return linea(g[0], g[1]); }).join(" "), c, w, x) : ""; }   // tanti trattini uguali in un tracciato solo (più leggero)
  function chiuso(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function aperto(a) { return "M" + a.map(function (x) { return q(x); }).join(" L"); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function tra(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  function luce(c) { var x = hx(c); return (x[0] * .3 + x[1] * .59 + x[2] * .11) / 255; }   // quanto è chiaro un colore (0 nero, 1 bianco)
  // sfumature e ritagli (gli id col prefisso del disegno; quelle "sul posto" hanno anche un numero)
  function sfum(tag, nome, stops, a) {
    var id = p + nome;
    if (!FATTI[id]) {
      FATTI[id] = 1;
      DEFS.push("<" + tag + " id='" + id + "' " + a + ">" + stops.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join("") + "</" + tag + ">");
    }
    return "url(#" + id + ")";
  }
  function lin(nome, stops, x1, y1, x2, y2, user) { return sfum("linearGradient", user ? nome + (++nC) : nome, stops, "x1='" + f1(x1) + "' y1='" + f1(y1) + "' x2='" + f1(x2) + "' y2='" + f1(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function rad(nome, stops, cx, cy, r) { return sfum("radialGradient", nome, stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  function ombra(x, y, rx, ry, k) {   // l'ombra morbida a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra)
    return ell(x, y, rx, ry, rad("om", [[0, "#000", .2], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5), k ? op(k) : "");
  }
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];      // il cromo
  var ORO = [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]];                         // l'ottone
  function cromo(d, w) { return tratto(d, L, w + 2.4) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.7, w * .38), "opacity='.95' transform='translate(-.4 -.5)'"); }   // un tubo cromato

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda (si disegna dopo)
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  // le forme tonde in pianta: centro (ca, cb), mezza larghezza ra, mezza profondità rf davanti e rr dietro; e = 2 ovale, di più = più squadrata
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf, rr: rr == null ? rf : rr, e: e || 2 }; }
  function giro(F, z, k, n, db) {   // i punti sullo schermo del bordo della forma all'altezza z (k = grandezza, anche [ka, kb]; db = spostata indietro/avanti)
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
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }
  function lucido(pp, k, alto) {   // il riflesso bianco, vicino al bordo di sinistra (da dove viene la luce)
    var b = limiti(pp), w = b[2] - b[0], h = b[3] - b[1];
    return dentro(chiuso(pp), ell(b[0] + w * .19, b[1] + h * (alto || .5), Math.max(1.6, w * .05), h * .3, "#ffffff", op(k || .7)));
  }

  // ---------- i mobili squadrati ----------
  // una faccia piatta messa in diagonale: o = il suo angolo in alto a sinistra sullo schermo; dir 1 = la faccia di sinistra, -1 = quella di destra.
  // Dentro si disegna di fronte: in larghezza 61 = 1 metro, in altezza come z.
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
    if (f.sopra) s += f.sopra(A, B, C, D);
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), L, 1.1, "opacity='.8'");   // gli spigoli di dentro, sottili
    if (H > 5) s += tratto("M" + q(D[0] + 1.6, D[1] + 1.4) + " L" + q(C[0] - .6, C[1] + 1.1), "#ffffff", 1.1, "opacity='.6'");   // il filo di luce sullo spigolo davanti
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, lw || 2.3));   // il contorno fuori, più spesso
  }
  // una lastra in piedi (testiera, pediera): come un blocco sottile, ma il bordo di sopra segue il profilo zt(a), uguale ai due lati
  function lastra(a0, a1, b0, b1, z0, zt, col, f, lw) {
    f = f || {};
    var u0 = G > 0 ? a0 : -a1, u1 = G > 0 ? a1 : -a0, v0 = G > 0 ? b0 : -b1, v1 = G > 0 ? b1 : -b0, c = tinte(col), n = 28, i, zm = 0;
    function za(u) { return zt(G > 0 ? u : -u); }
    for (i = 0; i <= n; i++) zm = Math.max(zm, za(u0 + (u1 - u0) * i / n));
    var Ws = (u1 - u0) * 61, Wd = (v1 - v0) * 61, H = zm - z0, fs = G > 0 ? f.davanti : f.dietro, pr = [], tF = [], tB = [];
    for (i = 0; i <= n; i++) { var u = u0 + (u1 - u0) * i / n; pr.push([Ws * i / n, zm - za(u)]); tF.push(Puv(u, v1, za(u))); tB.push(Puv(u, v0, za(u))); }
    var sag = "M0," + f1(H) + " L" + pr.map(function (x) { return q(x); }).join(" L") + " L" + f1(Ws) + "," + f1(H) + " Z";
    var zE = za(u1), s = faccia(Puv(u0, v1, zm), 1, pth(sag, c[1]) + (fs ? dentro(sag, fs(Ws, H, pr)) : ""));
    s += faccia(Puv(u1, v1, zE), -1, rett(0, 0, Wd, zE - z0, 0, c[2]));
    s += poly(tF.concat(tB.slice().reverse()), c[0]);
    s += tratto(aperto(tF), L, 1.1, "opacity='.8'") + tratto(linea(Puv(u1, v1, zE), Puv(u1, v1, z0)), L, 1.1, "opacity='.8'");
    s += tratto(aperto(tF.map(function (x) { return [x[0] + .3, x[1] + 1.3]; })), "#ffffff", 1, "opacity='.5'");
    var fuori = [Puv(u0, v1, z0), tF[0], tB[0]].concat(tB.slice(1), [Puv(u1, v0, z0), Puv(u1, v1, z0)]);
    return s + poly(fuori, "none", bordo(L, lw || 2.3));
  }
  function pannello(c, W, H, m, r) {   // un'anta o un cassetto in rilievo: il bordo chiaro in alto a sinistra, scuro in basso a destra
    return rett(m[0], m[1], W, H, r || 1.4, lin("an" + c.slice(1), [[0, chiaro(c, .2)], [1, chiaro(c, .02)]], 0, 0, 0, 1), "stroke='" + scuro(c, .45) + "' stroke-width='.9'") +
      tratto("M" + q(m[0] + 1, m[1] + H - 1) + " L" + q(m[0] + 1, m[1] + 1) + " L" + q(m[0] + W - 1, m[1] + 1), chiaro(c, .55), .9, "opacity='.8'") +
      tratto("M" + q(m[0] + W - 1, m[1] + 1.5) + " L" + q(m[0] + W - 1, m[1] + H - 1) + " L" + q(m[0] + 1.5, m[1] + H - 1), scuro(c, .3), .9, "opacity='.7'");
  }
  // la bugna: il pannello in rilievo con le quattro smussature (luce in alto a sinistra)
  function bugna(x, y, w, h, c, b) {
    b = b || 2.2;
    var x1 = x + w, y1 = y + h;
    return poly([[x, y], [x1, y], [x1 - b, y + b], [x + b, y + b]], chiaro(c, .42)) + poly([[x, y], [x + b, y + b], [x + b, y1 - b], [x, y1]], chiaro(c, .22)) +
      poly([[x, y1], [x + b, y1 - b], [x1 - b, y1 - b], [x1, y1]], scuro(c, .24)) + poly([[x1, y], [x1, y1], [x1 - b, y1 - b], [x1 - b, y + b]], scuro(c, .13)) +
      rett(x + b, y + b, w - 2 * b, h - 2 * b, 0, lin("bg" + c.slice(1), [[0, chiaro(c, .14)], [1, scuro(c, .05)]], 0, 0, 1, 1)) +
      rett(x, y, w, h, 0, "none", "stroke='" + scuro(c, .45) + "' stroke-width='.7' opacity='.8'");
  }
  // le venature del legno su una faccia piatta (vert = che corrono in su, come sulle ante): righe fini e qualche striscia più scura
  function venature(W, H, c, seme, vert, k) {
    var r = rnd(seme), s = "", i, n = Math.max(2, Math.round((vert ? W : H) / 2.4));
    k = k || 1;
    for (i = 0; i < 2; i++) { var t2 = r(), w2 = .08 + r() * .12; s += vert ? rett(t2 * W, -1, W * w2, H + 2, 0, scuro(c, .2), op(.1 * k)) : rett(-1, t2 * H, W + 2, H * w2, 0, scuro(c, .2), op(.1 * k)); }
    for (i = 0; i < n; i++) {
      var t = (i + .2 + r() * .6) / n, a = (r() * 2 - 1) * .9, b = (r() * 2 - 1) * .9, sc = r() < .72, col = sc ? scuro(c, .25 + r() * .12) : chiaro(c, .3);
      var d = vert ? "M" + q(t * W, -1) + " C" + q(t * W + a, H * .33) + " " + q(t * W + b, H * .66) + " " + q(t * W + a * .5, H + 1)
        : "M" + q(-1, t * H) + " C" + q(W * .33, t * H + a) + " " + q(W * .66, t * H + b) + " " + q(W + 1, t * H + a * .5);
      s += tratto(d, col, .3 + r() * .3, op((sc ? .25 + r() * .25 : .4) * k));
    }
    return s;
  }
  // le venature sul piano di sopra, nel verso della larghezza (a), all'altezza z
  function venatureSopra(a0, a1, b0, b1, z, c, seme, k) {
    var r = rnd(seme), s = "", i, j, n = Math.max(3, Math.round((b1 - b0) / .032));
    k = k || 1;
    for (i = 0; i < n; i++) {
      var b = b0 + (i + .2 + r() * .6) * (b1 - b0) / n, ph = r() * 6, am = .0015 + r() * .004, d = "", sc = r() < .72;
      for (j = 0; j <= 12; j++) { var a = a0 + (a1 - a0) * j / 12; d += (j ? " L" : "M") + q(P(a, b + Math.sin(ph + j * .7) * am, z)); }
      s += tratto(d, sc ? scuro(c, .22 + r() * .1) : chiaro(c, .3), .3 + r() * .25, op((sc ? .22 + r() * .22 : .4) * k));
    }
    return s;
  }
  // i colori del legno lucido e del bianco laccato (sopra, sinistra alla luce, destra in ombra)
  function legnoT(c) { var k = c.slice(1); return [lin("ws" + k, [[0, chiaro(c, .15)], [.6, chiaro(c, .03)], [1, scuro(c, .08)]], 0, 0, 1, 1), lin("wl" + k, [[0, chiaro(c, .06)], [1, scuro(c, .12)]], 0, 0, 0, 1), lin("wd" + k, [[0, scuro(c, .3)], [1, scuro(c, .42)]], 0, 0, 0, 1)]; }
  function biancoT() { return [lin("bs", [[0, "#ffffff"], [1, "#efebe4"]], 0, 0, 1, 1), lin("bl", [[0, "#fdfbf7"], [1, "#ebe6dd"]], 0, 0, 0, 1), lin("bd", [[0, "#d9d2c6"], [1, "#c2baac"]], 0, 0, 0, 1)]; }
  // un cassetto o un'anta di legno: la bugna smussata con le venature dentro
  function bugnaLegno(x, y, w, h, c, b, seme, vert) {
    return bugna(x, y, w, h, c, b) + dentro("M" + q(x + b, y + b) + " H" + f1(x + w - b) + " V" + f1(y + h - b) + " H" + f1(x + b) + " Z", "<g transform='translate(" + f1(x) + " " + f1(y) + ")'>" + venature(w, h, c, seme, vert, 1) + "</g>");
  }
  // il riflesso lucido: due strisce in diagonale, dentro un rettangolo piatto (W × H) o dentro un poligono dello schermo
  function lacca(W, H, k) {
    return dentro("M0,0 H" + f1(W) + " V" + f1(H) + " H0 Z", poly([[W * .12, 0], [W * .34, 0], [W * .04, H], [-W * .18, H]], "#ffffff", op(.2 * (k || 1))) + poly([[W * .42, 0], [W * .49, 0], [W * .19, H], [W * .12, H]], "#ffffff", op(.14 * (k || 1))));
  }
  function laccaSopra(pp, k) {
    var b = limiti(pp), w = b[2] - b[0];
    return dentro(chiuso(pp), poly([[b[0] + w * .3, b[1]], [b[0] + w * .44, b[1]], [b[0] + w * .2, b[3]], [b[0] + w * .06, b[3]]], "#ffffff", op(.26 * (k || 1))) +
      poly([[b[0] + w * .5, b[1]], [b[0] + w * .54, b[1]], [b[0] + w * .3, b[3]], [b[0] + w * .26, b[3]]], "#ffffff", op(.18 * (k || 1))));
  }
  // l'ottone: il pomello con la rosetta, e la maniglia a barra (m = il colore del metallo)
  function pomoloOro(x, y, r) {
    return cer(x, y, r * 1.65, lin("ro", ORO, 0, 0, 1, 1), bordo(L, .6)) + cer(x + .3, y + .5, r, "#6b4a0e", op(.45)) +
      cer(x, y, r, rad("po", [[0, "#fffbe6"], [.45, "#f5cf5a"], [1, "#9a6c12"]], .35, .3, .75), bordo(L, .7)) + cer(x - r * .35, y - r * .38, r * .32, "#ffffff", op(.9));
  }
  function barra(x, y, w, h, m) {
    var g = lin("bm" + m.slice(1) + (w > h ? "o" : "v"), [[0, chiaro(m, .7)], [.45, m], [1, scuro(m, .42)]], 0, 0, w > h ? 0 : 1, w > h ? 1 : 0);
    return rett(x + .5, y + .8, w, h, Math.min(w, h) / 2, scuro(m, .6), op(.35)) + rett(x, y, w, h, Math.min(w, h) / 2, g, bordo(L, .7)) +
      (w > h ? rett(x + w * .1, y + h * .2, w * .7, h * .25, h * .12, "#ffffff", op(.75)) : rett(x + w * .2, y + h * .1, w * .25, h * .7, w * .12, "#ffffff", op(.75)));
  }
  function retro(c) {   // la schiena di un mobile: un pannello liscio con le viti
    return function (W, H) { return rett(2.5, 2.5, W - 5, H - 5, 1, "none", "stroke='" + scuro(c, .22) + "' stroke-width='.9' opacity='.8'") + [[4.5, 4.5], [W - 4.5, 4.5], [4.5, H - 4.5], [W - 4.5, H - 4.5]].map(function (v) { return cer(v[0], v[1], .8, scuro(c, .35)); }).join(""); };
  }
  // un piedino tornito (a cipolla) in (a, b), alto h
  function piedino(a, b, h, r, c) {
    var F = forma(a, b, r, r, r);
    return corpo([giro(F, 0, .7, 20), giro(F, h * .45, 1.15, 20), giro(F, h, .85, 20)], [[0, chiaro(c, .35)], [.5, c], [1, scuro(c, .4)]], 1.3);
  }

  // il registro: box = [x0, y0, x1, y1] attorno al centro dell'impronta (uguale davanti e dietro)
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  function colore(lista, o) { var id = o && o.col, i; for (i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return lista[0]; }

  // ===== QUI I DISEGNI =====

  // =========================================================
  //  COMODINO di legno lucido: due cassetti coi pomelli d'ottone, il piano che sporge, i piedini torniti
  // =========================================================
  def("comodino_legno", { tipo: "piedi", nome: "Comodino coi cassetti", stanza: "camera", fp: [1, 1], box: [-40, -56, 40, 22], dietro: true, piano: 34.5, prezzo: 400 }, function () {
    var c = "#c08a55", s = ombra(5, 6, 34, 15);
    var A0 = -.24, A1 = .24, B0 = -.45, B1 = .07;   // il corpo (il piano copre il centro della mattonella: lì si appoggia la lampada)
    [[A0 + .04, B0 + .04], [A1 - .04, B0 + .04], [A0 + .04, B1 - .04], [A1 - .04, B1 - .04]].sort(function (m, n) { return vicino(m[0], m[1]) - vicino(n[0], n[1]); })
      .forEach(function (g) { s += piedino(g[0], g[1], 5.5, .034, scuro(c, .2)); });
    s += blocco(A0, A1, B0, B1, 5, 31, legnoT(c), {
      davanti: function (W, H) {   // due cassetti a bugna, coi pomelli d'ottone
        var g = 1.4, h = (H - 3 * g) / 2, r = venature(W, H, c, 11, false, .6);
        [0, 1].forEach(function (i) {
          var y = g + i * (h + g), fd = "M" + q(g + 3.3, y + 3.3) + " H" + f1(W - g - 3.3) + " V" + f1(y + h - 3.3) + " H" + f1(g + 3.3) + " Z";
          r += bugnaLegno(g, y, W - 2 * g, h, chiaro(c, .04), 1.7, 21 + i) + tratto(fd, "#6b4a0e", 1.4, op(.3)) + tratto(fd, "#e0b84a", .7) + pomoloOro(W / 2, y + h / 2, 1.45);   // il filo d'ottone intarsiato
        });
        return r + lacca(W, H, .8);
      },
      dietro: function (W, H) { return venature(W, H, c, 14, true, .6) + retro(c)(W, H); },
      fianco: function (W, H) { return bugnaLegno(2.2, 2.2, W - 4.4, H - 4.4, scuro(c, .28), 1.4, 12, true); }
    });
    var T0 = A0 - .025, T1 = A1 + .025, U0 = B0 - .025, U1 = B1 + .035;   // il piano, un po' sporgente, col bordo sagomato
    s += blocco(T0, T1, U0, U1, 31, 34.5, legnoT(chiaro(c, .06)), {
      davanti: function (W, H) { return rett(0, H * .58, W, .6, 0, scuro(c, .35), op(.6)) + rett(0, 0, W, 1, 0, "#ffffff", op(.35)); },
      fianco: function (W, H) { return rett(0, H * .58, W, .6, 0, scuro(c, .5), op(.5)); },
      sopra: function (A, B, C, D) { return dentro(chiuso([A, B, C, D]), venatureSopra(T0, T1, U0, U1, 34.5, c, 13)) + laccaSopra([A, B, C, D], 1.1); }
    }, 2);
    return s;
  });

  // =========================================================
  //  LAMPADA DA COMODINO: il vaso di ceramica blu lucida col decoro bianco, l'ottone, il paralume plissé color panna
  // =========================================================
  def("lampada_comodino", { tipo: "sopra", nome: "Lampada da comodino", stanza: "camera", fp: [1, 1], box: [-13, -40, 17, 10], prezzo: 350 }, function () {
    var s = ombra(2, 1.5, 11, 5), i, t;
    function cerchio(r, z, t0, t1, n) { var o = []; for (var k = 0; k <= n; k++) { var a = t0 + (t1 - t0) * k / n; o.push(Puv(r * Math.cos(a), r * Math.sin(a), typeof z === "function" ? z(a) : z)); } return o; }   // un arco (solo la parte che si vede: t da -45° a 135°)
    var piede = forma(0, 0, .068, .068, .068), vaso = forma(0, 0, .088, .088, .088), coll = forma(0, 0, .034, .034, .034);
    s += corpo([giro(piede, 0, 1, 30), giro(piede, 2.4, 1, 30)], [[0, "#8cc4ee"], [.45, "#4a8fd0"], [1, "#2a6aa6"]], 1.1) + pth(chiuso(giro(piede, 2.4, 1, 30)), "#6aa9e0", bordo(L, .8)) +
      tratto(aperto(cerchio(.066, 2.4, -.785, 2.356, 30)), "#f2c94c", .8);   // il piede blu col filo d'oro
    var lv = [giro(vaso, 2.2, .58, 36), giro(vaso, 4.6, .88, 36), giro(vaso, 7.6, 1, 36), giro(vaso, 10.6, .86, 36), giro(vaso, 12.7, .55, 36), giro(vaso, 13.5, .4, 36)], sil = sagoma(lv);
    s += corpo(lv, [[0, "#a5d8ff"], [.35, "#4dabf7"], [.75, "#1c7ed6"], [1, "#145a9c"]], 1.5);
    s += tratto(aperto(cerchio(.0885, function (a) { return 7.6 + 1.2 * Math.sin(a * 9); }, -.785, 2.356, 40)), "#ffffff", 1.1, op(.9));   // l'onda bianca sulla pancia
    s += tratto(aperto(cerchio(.074, 4.4, -.785, 2.356, 30)), "#ffffff", .7, op(.7)) + tratto(aperto(cerchio(.071, 11.3, -.785, 2.356, 30)), "#a8781a", 1.6) + tratto(aperto(cerchio(.071, 11.3, -.785, 2.356, 30)), "#f2c94c", .9);
    s += lucido(sil, .8, .45);
    s += corpo([giro(coll, 13.3, 1, 24), giro(coll, 14.5, 1, 24)], ORO, 1.1) + pth(chiuso(giro(coll, 14.5, 1, 24)), "#f6d77a", bordo(L, .8));   // l'anello d'ottone
    s += tratto(linea(Puv(0, 0, 14.5), Puv(0, 0, 18.4)), L, 2.6) + tratto(linea(Puv(0, 0, 14.5), Puv(0, 0, 18.4)), "#e0b84a", 1.3);   // il gambo
    // il paralume: un tronco di cono, plissé, coi bordi d'ottone; da sopra si vede dentro
    var Zb = 17.8, Zt = 28, Rb = .104, Rt = .07, giu = cerchio(Rb, Zb, 0, 6.2832, 48), su = cerchio(Rt, Zt, 0, 6.2832, 48);
    var sp = inviluppo(giu.concat(su)), bb = limiti(sp);
    s += pth(chiuso(sp), lin("pa", [[0, "#fffaf0"], [.45, "#f6ead2"], [.8, "#e2cfa8"], [1, "#c9b088"]], bb[0], 0, bb[2], 0, true), bordo(L, 1.6));
    var pl = "";
    for (i = 0; i <= 22; i++) { t = -.785 + i / 22 * 3.1416; var a = Puv(Rb * Math.cos(t), Rb * Math.sin(t), Zb), b = Puv(Rt * Math.cos(t), Rt * Math.sin(t), Zt); pl += tratto(linea(a, b), i % 2 ? "#ffffff" : "#c7ae84", i % 2 ? .7 : .6, op(i % 2 ? .55 : .7)); }
    s += dentro(chiuso(sp), pl + ell(bb[0] + (bb[2] - bb[0]) * .22, (bb[1] + bb[3]) / 2 + 1, 1.6, 4.5, "#ffffff", op(.6)));
    s += tratto(aperto(cerchio(Rb, Zb, -.785, 2.356, 30)), "#a8781a", 1.8) + tratto(aperto(cerchio(Rb, Zb, -.785, 2.356, 30)), "#f2c94c", .9);   // il bordino d'ottone in basso
    s += pth(chiuso(su), rad("in", [[0, "#fff3d6"], [.6, "#e9d3a8"], [1, "#b89a6a"]], .5, .6, .6), bordo(L, 1.1));   // la bocca: dentro, un po' in ombra
    s += tratto(chiuso(su), "#d9a92e", .9);
    var cima = Puv(0, 0, Zt + .6);
    s += tratto(linea(Puv(-Rt * .7, 0, Zt - .2), Puv(Rt * .7, 0, Zt - .2)), "#8a6a2a", .6, op(.8)) + ell(cima[0], cima[1], 1.4, 1.25, rad("fn", [[0, "#fffbe6"], [.5, "#f2c94c"], [1, "#9a6c12"]], .35, .3, .8), bordo(L, .6));   // il pomolo in cima
    return "<g transform='scale(1.15)'>" + s + "</g>";   // un po' più grande del vero, così si vede bene sul comodino
  });

  // =========================================================
  //  CASSETTIERA ARCOBALENO: bianca laccata, quattro cassetti colorati coi pomelli di ceramica, i piedini scuri
  // =========================================================
  def("cassettiera", { tipo: "piedi", nome: "Cassettiera arcobaleno", stanza: "tutte", fp: [1, 1], box: [-46, -77, 48, 25], dietro: true, piano: 52.5, prezzo: 700 }, function () {
    var c = "#f1f3f5", s = ombra(6, 7, 44, 18), COL = ["#ff8787", "#ffd43b", "#69db7c", "#74c0fc"];
    var A0 = -.37, A1 = .37, B0 = -.44, B1 = .06;
    [[A0 + .05, B0 + .05], [A1 - .05, B0 + .05], [A0 + .05, B1 - .05], [A1 - .05, B1 - .05]].sort(function (m, n) { return vicino(m[0], m[1]) - vicino(n[0], n[1]); })
      .forEach(function (g) { s += piedino(g[0], g[1], 4.8, .036, "#495057"); });
    s += blocco(A0, A1, B0, B1, 4.5, 49, biancoT(), {
      davanti: function (W, H) {   // i cassetti colorati e lucidi: la cornice smussata, il filo chiaro, il pomello di ceramica con l'anello del colore
        var g = 1.5, h = (H - 5 * g) / 4, r = "";
        COL.forEach(function (k, i) {
          var y = g + i * (h + g), cx = W / 2, cy = y + h / 2;
          r += bugna(g, y, W - 2 * g, h, k, 1.5) + rett(g + 3, y + 2.8, W - 2 * g - 6, h - 5.6, 1, "none", "stroke='" + chiaro(k, .6) + "' stroke-width='.6' opacity='.85'") +
            cer(cx + .4, cy + .7, 2.1, scuro(k, .55), op(.35)) + cer(cx, cy, 2.1, rad("kn", [[0, "#ffffff"], [.55, "#f4f1ec"], [1, "#bdb5a8"]], .35, .3, .8), bordo(L, .7)) +
            cer(cx, cy, 1.05, "none", "stroke='" + k + "' stroke-width='.8'") + cer(cx - .7, cy - .8, .55, "#ffffff");
        });
        return r + lacca(W, H, 1.2);
      },
      dietro: retro("#e6e0d6"),
      fianco: function (W, H) { return bugna(3, 3, W - 6, H - 6, "#cfc8bb", 1.6) + lacca(W, H, .5); }
    });
    var T0 = A0 - .02, T1 = A1 + .02, U0 = B0 - .02, U1 = B1 + .03;   // il piano laccato, col bordo arrotondato e il filo arcobaleno
    s += blocco(T0, T1, U0, U1, 49, 52.5, biancoT(), {
      davanti: function (W, H) { var r = "", i; for (i = 0; i < 4; i++) r += rett(W * i / 4, H - 1.2, W / 4 + .2, 1.2, 0, COL[i]); return r + rett(0, 0, W, .9, 0, "#ffffff", op(.8)); },
      sopra: function (A, B, C, D) { return laccaSopra([A, B, C, D], 1.4) + tratto(linea(tra(D, C, .04), tra(D, C, .96)), "#ffffff", 1.2, op(.9)); }
    }, 2);
    return s;
  });

  // =========================================================
  //  SCRIVANIA di rovere chiaro: la cassettiera a sinistra coi tre cassetti, la gamba a pannello a destra,
  //  il cassettino delle matite sotto il piano, il pannello di fondo; il piano lucido con le venature
  // =========================================================
  def("scrivania", { tipo: "piedi", nome: "Scrivania coi cassetti", stanza: "tutte", fp: [2, 1], box: [-70, -83, 75, 34], dietro: true, piano: 46.5, prezzo: 900 }, function () {
    var c = "#e9d8b8", s = ombra(6, 8, 74, 26), T = legnoT(c), ACC = "#c9d1d8";
    var cassettiera = function () {
      return blocco(-.77, -.35, -.43, .08, 0, 3, scuro(c, .55), null, 1.4) + blocco(-.79, -.33, -.45, .1, 3, 43, T, {   // lo zoccolo rientrato, poi la cassettiera
        davanti: function (W, H) {
          var g = 1.4, h = (H - 4 * g) / 3, r = "";
          [0, 1, 2].forEach(function (i) { var y = g + i * (h + g); r += bugnaLegno(g, y, W - 2 * g, h, chiaro(c, .03), 1.5, 31 + i) + barra(W / 2 - 6, y + h * .32, 12, 1.9, ACC); });
          return r + lacca(W, H, .7);
        },
        dietro: function (W, H) { return venature(W, H, c, 34, true, .6) + retro(c)(W, H); },
        fianco: function (W, H) { return bugnaLegno(2.2, 2.2, W - 4.4, H - 4.4, scuro(c, .3), 1.4, 35, true); }
      });
    };
    var gamba = function () {
      return blocco(.73, .79, -.45, .1, 0, 43, T, {
        davanti: function (W, H) { return venature(W, H, c, 36, true, .8); },
        dietro: function (W, H) { return venature(W, H, c, 37, true, .8); },
        fianco: function (W, H) { return bugnaLegno(2.4, 3, W - 4.8, H - 9, scuro(c, .3), 1.5, 38, true) + rett(1, H - 3.5, W - 2, 1.4, .7, scuro(c, .55), op(.5)); }
      });
    };
    var fondo = function () { return blocco(-.33, .73, -.44, -.4, 14, 43, T, { davanti: function (W, H) { return venature(W, H, scuro(c, .05), 39, false, .7); }, dietro: retro(c) }, 1.8); };
    var matite = function () {   // il cassettino delle matite, sotto il piano
      return blocco(-.33, .73, .05, .1, 37.5, 43, T, {
        davanti: function (W, H) { return bugnaLegno(1, .8, W - 2, H - 1.6, chiaro(c, .03), 1, 40) + barra(W / 2 - 5, H / 2 - .8, 10, 1.6, ACC); },
        dietro: function (W, H) { return venature(W, H, c, 41, false, .6); }
      }, 1.8);
    };
    s += ordina([[vicino(-.56, -.17), cassettiera()], [vicino(.2, -.42), fondo()], [vicino(.2, .075), matite()], [vicino(.76, -.17), gamba()]]);
    var A0 = -.84, A1 = .84, B0 = -.48, B1 = .14;   // il piano, spesso, col bordo smussato
    s += blocco(A0, A1, B0, B1, 43, 46.5, legnoT(chiaro(c, .05)), {
      davanti: function (W, H) { return venature(W, H, c, 42, false, .7) + rett(0, H * .62, W, .6, 0, scuro(c, .35), op(.55)) + rett(0, 0, W, .9, 0, "#ffffff", op(.4)); },
      dietro: function (W, H) { return venature(W, H, c, 43, false, .7); },
      fianco: function (W, H) { return rett(0, H * .62, W, .6, 0, scuro(c, .5), op(.5)); },
      sopra: function (A, B, C, D) {   // il piano: le venature, e il sottomano di pelle verde incassato col filo d'oro
        var Z = 46.5, pe = [P(-.6, -.38, Z), P(.6, -.38, Z), P(.6, .05, Z), P(-.6, .05, Z)], fi = [P(-.56, -.345, Z), P(.56, -.345, Z), P(.56, .015, Z), P(-.56, .015, Z)];
        return dentro(chiuso([A, B, C, D]), venatureSopra(A0, A1, B0, B1, Z, c, 44, 1.1)) +
          poly(pe, lin("pe", [[0, "#4f8a68"], [.55, "#2f6148"], [1, "#1f4433"]], 0, 0, 1, 1), "stroke='" + scuro(c, .45) + "' stroke-width='1.1'") +
          tratto(aperto([pe[3], pe[0], pe[1]]), "#16301f", 1, op(.6)) + tratto(chiuso(fi), "#d9b450", .8, op(.95)) + tratto(chiuso(fi.map(function (x) { return [x[0], x[1] + .9]; })), "#7a5a1c", .4, op(.5)) +
          laccaSopra([A, B, C, D], 1.2);
      }
    }, 2.2);
    return s;
  });

  // =========================================================
  //  SEDIA DA UFFICIO di pelle nera con le cuciture, i braccioli imbottiti, il pistone e la stella cromata con le ruote
  // =========================================================
  def("sedia_ufficio", { tipo: "piedi", nome: "Sedia da ufficio", stanza: "tutte", fp: [1, 1], box: [-27, -83, 33, 19], dietro: true, azione: "siedi", seduta: 31, prezzo: 700 }, function () {
    var s = ombra(4, 4, 30, 14), PELLE = [[0, "#6b7580"], [.35, "#3d444b"], [.8, "#24292e"], [1, "#16191c"]], i;
    // la stella a cinque razze, di alluminio lucido, con le ruote
    var razze = [];
    for (i = 0; i < 5; i++) { var t = 1.5708 + i * 1.2566; razze.push([Math.cos(t) * .27, Math.sin(t) * .27]); }
    razze.sort(function (m, n) { return vicino(m[0], m[1]) - vicino(n[0], n[1]); });
    var mozzo = P(0, 0, 6.5), dietroR = "", davantiR = "";
    razze.forEach(function (r) {
      var e = P(r[0] * .93, r[1] * .93, 5), w = P(r[0], r[1], 0), d = "M" + q(mozzo) + " L" + q(e), ruota;
      var braccio = tratto(d, L, 6) + tratto(d, lin("rz", [[0, "#ffffff"], [.5, "#b9c3ca"], [1, "#6c7881"]], 0, 0, 1, 1), 3.6) + tratto(d, "#ffffff", 1, "opacity='.8' transform='translate(-.4 -.9)'");
      ruota = rett(w[0] - 3.4, w[1] - 4.6, 6.8, 4.6, 2.3, lin("ru", [[0, "#5a6168"], [1, "#1c1f22"]], 0, 0, 1, 0), bordo(L, 1)) + rett(w[0] - 2.2, w[1] - 4, 1.4, 3, .7, "#8a949c", op(.8)) + tratto(linea([e[0], e[1]], [w[0], w[1] - 4]), "#9aa5ad", 1.4);
      if (vicino(r[0], r[1]) < 0) dietroR += ruota + braccio; else davantiR += ruota + braccio;
    });
    s += dietroR;
    var pist = forma(0, 0, .036, .036, .036), canna = forma(0, 0, .022, .022, .022);
    s += corpo([giro(pist, 5, 1, 24), giro(pist, 14, 1, 24)], [[0, "#5a636b"], [.4, "#2b3035"], [1, "#121417"]], 1.4);   // la copertura nera del pistone
    s += davantiR + ell(mozzo[0], mozzo[1], 4.6, 2.4, lin("mz", [[0, "#ffffff"], [1, "#7d8991"]], 0, 0, 1, 1), bordo(L, 1));
    s += corpo([giro(canna, 14, 1, 20), giro(canna, 24, 1, 20)], CROMO, 1.2);   // il pistone cromato
    s += blocco(-.1, .1, -.12, .08, 22, 25.5, ["#3a4046", "#2b3035", "#1a1d20"], null, 1.4);   // il meccanismo sotto il sedile
    // lo schienale: curvo, inclinato all'indietro, imbottito a canali cuciti
    function sch(x, y, dav) { var a = .2 * x, z = 53 + 17 * y, b = -.205 - (z - 36) * .0016 + .035 * x * x - (dav ? 0 : .06); return P(a, b, z); }
    function bordoSch(dav, k) { var o = [], j; for (j = 0; j < 48; j++) { var t2 = j / 48 * 6.2832, cc = Math.cos(t2), ss = Math.sin(t2); o.push(sch((cc < 0 ? -1 : 1) * Math.pow(Math.abs(cc), .62) * (k || 1), (ss < 0 ? -1 : 1) * Math.pow(Math.abs(ss), .62) * (k || 1), dav)); } return o; }
    function schienale() {
      var fr = bordoSch(true), re = bordoSch(false), visto = G > 0 ? fr : re, sil = inviluppo(fr.concat(re)), r = "", bb = limiti(sil), j;
      var bra = aperto([P(0, -.1, 24), P(0, -.27, 27.5), P(0, -.285, G > 0 ? 42 : 47)]);
      var braccio = tratto(bra, L, 7) + tratto(bra, "#3a4147", 4.2) + tratto(bra, "#7d8790", 1.2, "transform='translate(-.6 -.6)'");   // il braccio che regge lo schienale
      if (G > 0) r += braccio;   // davanti sta dietro lo schienale; da dietro gli passa davanti (dopo)
      r += pth(chiuso(sil), lin("sg", [[0, "#4a5259"], [1, "#16191c"]], bb[0], 0, bb[2], 0, true), bordo(L, 2.2));
      var vb = limiti(visto);
      if (G > 0) {   // davanti: la pelle imbottita, il riquadro più chiaro coi canali cuciti
        r += pth(chiuso(visto), lin("sv", PELLE, vb[0], vb[1], vb[2], vb[3], true), bordo(L, 1.6));
        var dentroS = bordoSch(true, .78), cuc = "";
        for (j = 1; j < 6; j++) { var yy = -.78 + j * 1.56 / 6, pa = [], k; for (k = 0; k <= 10; k++) pa.push(sch(-.8 + k * .16, yy, true)); cuc += tratto(aperto(pa), "#121417", 1.6, op(.7)) + tratto(aperto(pa.map(function (x) { return [x[0], x[1] + 1]; })), "#8b96a0", .5, "stroke-dasharray='1.2 1' opacity='.8'"); }
        r += pth(chiuso(dentroS), lin("si", [[0, "#5e6871"], [.5, "#3f474e"], [1, "#2a2f34"]], vb[0], vb[1], vb[2], vb[3], true), "stroke='#16191c' stroke-width='1'") + dentro(chiuso(dentroS), cuc) +
          tratto(aperto(dentroS.slice(30, 44)), "#9aa5ad", .7, "stroke-dasharray='1.2 1' opacity='.7'");
        r += lucido(visto, .35, .4);
      } else {   // da dietro: il guscio di plastica lucida con la placca e la manopola
        r += pth(chiuso(visto), lin("sb", [[0, "#5a636b"], [.4, "#30363b"], [1, "#16191c"]], vb[0], vb[1], vb[2], vb[3], true), bordo(L, 1.6));
        r += dentro(chiuso(visto), tratto(aperto([sch(-.95, -.55, false), sch(0, -.62, false), sch(.95, -.55, false)]), "#0f1113", 1.2, op(.6))) + lucido(visto, .4, .35);
        var pl = [sch(-.38, 0, false), sch(.38, 0, false), sch(.38, -.6, false), sch(-.38, -.6, false)], pc = sch(0, -.3, false);   // la placca del meccanismo, dove entra il braccio, con la manopola
        r += braccio + poly(pl, lin("pq", [[0, "#3d444b"], [1, "#1a1d20"]], 0, 0, 0, 1), bordo(L, 1.1)) + tratto(aperto([pl[3], pl[0], pl[1]]), "#6b7580", .8) +
          cer(pc[0], pc[1], 2.1, lin("mn", CROMO, 0, 0, 1, 1), bordo(L, .8)) + cer(pc[0] - .6, pc[1] - .7, .7, "#ffffff", op(.9));
      }
      return r;
    }
    function bracciolo(sg) {   // il bracciolo: il sostegno a L e il cuscinetto morbido
      var a = .255 * sg, r = "", base = P(a, -.02, 22), su = P(a, -.03, 40), d = "M" + q(P(a * .4, -.02, 23)) + " L" + q(base) + " L" + q(su);
      r += tratto(d, L, 6.4) + tratto(d, "#2f353a", 3.8) + tratto(d, "#7d8790", 1, "transform='translate(-.5 -.4)'");
      var F = forma(a, -.02, .032, .13, .13, 4);
      return r + corpo([giro(F, 40, 1, 30), giro(F, 43.5, 1, 30)], [[0, "#59626a"], [.5, "#2b3035"], [1, "#15181b"]], 1.5) + pth(chiuso(giro(F, 43.5, 1, 30)), lin("bp", [[0, "#6b7580"], [1, "#2b3035"]], 0, 0, 1, 1), bordo(L, 1.1));
    }
    function sedile() {   // il cuscino del sedile, spesso, col bordo a cascata davanti e la cucitura
      var F = forma(0, .02, .225, .225, .2, 3.4), lv = [giro(F, 25, .95), giro(F, 27.5, 1), giro(F, 30, .985)], sil = sagoma(lv), top = giro(F, 31, .94), r = "";
      r += corpo(lv, [[0, "#59626a"], [.4, "#30363b"], [1, "#121417"]], 1.8);
      r += pth(chiuso(top), rad("st", [[0, "#6b7580"], [.55, "#3a4147"], [1, "#1e2226"]], .4, .35, .75), bordo(L, 1.3));
      r += tratto(chiuso(giro(F, 31, .8)), "#9aa5ad", .6, "stroke-dasharray='1.4 1.1' opacity='.75'") + tratto(chiuso(giro(F, 31, .8)), "#0f1113", 1.2, op(.35));
      return r + lucido(top, .3, .45);
    }
    s += ordina([[vicino(0, -.24), schienale()], [vicino(-.255, 0), bracciolo(-1)], [vicino(0, .02), sedile()], [vicino(.255, 0), bracciolo(1)]]);
    return s;
  });

  // =========================================================
  //  ARMADIO A TRE ANTE: le ante a bugna (due pannelli ciascuna) col filo intarsiato, le maniglie lunghe, il cassettone in basso,
  //  la cornice coi dentelli, il frontone ad arco con la conchiglia d'oro e i piedini a cipolla; laccato lucido
  // =========================================================
  var COL_ARMADIO = [{ id: "bianco", nome: "bianco", c: "#f4efe6", a: "#ffffff", m: "#d4a72c" }, { id: "noce", nome: "noce", c: "#8a5a3a", a: "#a0683f", m: "#e0c070" }, { id: "azzurro", nome: "azzurro", c: "#a5d8ff", a: "#d0ebff", m: "#ffffff" },
    { id: "nero", nome: "nero lucido", c: "#2b2b30", a: "#3d3d45", m: "#e0c070" }, { id: "rosa", nome: "rosa confetto", c: "#fcc2d7", a: "#ffdeeb", m: "#ffffff" }, { id: "verde", nome: "verde bosco", c: "#2b8a3e", a: "#37a24d", m: "#ffd43b" }];
  def("armadio_bianco", { tipo: "piedi", nome: "Armadio a tre ante", stanza: "camera", fp: [2, 1], box: [-71, -156, 77, 36], dietro: true, prezzo: 2400, colori: COL_ARMADIO }, function (o) {
    var K = colore(COL_ARMADIO, o), c = K.c, a = K.a, m = K.m, noce = K.id === "noce", s = ombra(6, 10, 76, 26);
    var A0 = -.8, A1 = .8, B0 = -.46, B1 = .1;
    [[A0 + .07, B0 + .06], [A1 - .07, B0 + .06], [A0 + .07, B1 - .06], [A1 - .07, B1 - .06]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); })
      .forEach(function (g) { s += piedino(g[0], g[1], 5.5, .045, m); });
    var T = noce ? legnoT(c) : tinte(c);
    function lati(W, H) { return bugna(3, 3, W - 6, H - 6, scuro(c, .22), 1.6) + (noce ? dentro("M3,3 H" + f1(W - 3) + " V" + f1(H - 3) + " H3 Z", venature(W, H, scuro(c, .25), 51, true, .8)) : "") + lacca(W, H, .5); }
    function filo(d) { return tratto(d, scuro(m, .45), 1.5, op(.35)) + tratto(d, m, .75); }   // il filo intarsiato del colore delle maniglie (d'oro sul bianco)
    function rettF(x, y, w, h) { return "M" + q(x, y) + " H" + f1(x + w) + " V" + f1(y + h) + " H" + f1(x) + " Z"; }
    s += blocco(A0, A1, B0, B1, 5, 22, T, {   // il cassettone in basso
      davanti: function (W, H) { return bugna(1.6, 1.6, W - 3.2, H - 3.2, a, 1.6) + (noce ? dentro("M3,3 H" + f1(W - 3) + " V" + f1(H - 3) + " H3 Z", venature(W, H, a, 52, false, .8)) : "") + filo(rettF(4.6, 4.2, W - 9.2, H - 8.4)) + barra(W / 2 - 9, H / 2 - 1.2, 18, 2.4, m) + lacca(W, H, .8); },
      dietro: retro(c), fianco: lati
    });
    s += blocco(A0, A1, B0, B1, 22, 105, T, {
      davanti: function (W, H) {   // le tre ante: la cornice e due bugne ciascuna, col filo intarsiato (ad arco in quella di sopra); le maniglie come nella casa (le prime due al centro, la terza a destra)
        var g = 1.3, w = (W - 4 * g) / 3, r = "", i, hS = H * .56, hG = H - 2 * g - 12 - hS;
        for (i = 0; i < 3; i++) {
          var x = g + i * (w + g), x0 = x + 3.4 + 2.7, x1 = x + w - 3.4 - 2.7, y0 = g + 4 + 2.7, y1 = g + 4 + hS - 2.7;
          r += pannello(a, w, H - 2 * g, [x, g], 1) + bugna(x + 3.4, g + 4, w - 6.8, hS, a, 2) + bugna(x + 3.4, g + 8 + hS, w - 6.8, hG, a, 2);
          if (noce) r += dentro("M" + q(x, g) + " h" + f1(w) + " v" + f1(H - 2 * g) + " h" + f1(-w) + " Z", "<g transform='translate(" + f1(x) + " 0)'>" + venature(w, H, a, 53 + i, true, .9) + "</g>");
          r += filo("M" + q(x0, y1) + " V" + f1(y0 + 5) + " Q" + q((x0 + x1) / 2, y0 - 3.4) + " " + q(x1, y0 + 5) + " V" + f1(y1) + " Z") + filo(rettF(x0, g + 8 + hS + 2.7, x1 - x0, hG - 5.4));
          r += barra(i === 1 ? x + 2.2 : x + w - 4.2, H * .4, 2, 17, m);
        }
        return r + lacca(W, H, luce(c) < .3 ? 1.5 : 1);
      },
      dietro: retro(c), fianco: lati
    });
    // la cornice in cima: la fascia coi dentelli e il cappello sporgente
    s += blocco(A0 - .025, A1 + .025, B0 - .02, B1 + .03, 105, 112, T, {
      davanti: function (W, H) {   // i dentelli e il filo del colore delle maniglie
        var r = rett(0, 0, W, H, 0, scuro(c, .22), op(.8)), x;
        for (x = 2; x < W - 2; x += 4.2) r += rett(x, .8, 2.4, H - 2.4, .3, chiaro(c, .18), "stroke='" + scuro(c, .4) + "' stroke-width='.5'");
        return r + rett(0, H - 1.2, W, 1.2, 0, m, op(.9));
      },
      fianco: function (W, H) { var r = rett(0, 0, W, H, 0, scuro(c, .3), op(.8)), x; for (x = 2; x < W - 2; x += 4.2) r += rett(x, .8, 2.4, H - 2.4, .3, scuro(c, .1), "stroke='" + scuro(c, .45) + "' stroke-width='.5'"); return r + rett(0, H - 1.2, W, 1.2, 0, scuro(m, .2), op(.8)); }
    }, 2);
    s += blocco(A0 - .055, A1 + .055, B0 - .035, B1 + .06, 112, 118.5, T, {
      davanti: function (W, H) { return rett(0, H * .45, W, 1, 0, m, op(.9)) + rett(0, 0, W, 1, 0, "#ffffff", op(.45)); },
      fianco: function (W, H) { return rett(0, H * .45, W, 1, 0, m, op(.7)); },
      sopra: function (A, B, C, D) { return laccaSopra([A, B, C, D], .8); }
    }, 2.3);
    // il frontone ad arco sul cappello, davanti: il timpano bordato dal filo, la rosetta d'ottone coi due tralci, e la conchiglia d'oro in cima
    var FA = .66, FB0 = B1 + .012, FB1 = B1 + .05, Z0 = 118.5;
    var zf = function (u) { var t = Math.min(1, Math.abs(u) / FA); return Z0 + 3 + 12 * Math.pow(Math.max(0, Math.cos(t * 1.5708)), 1.15); };
    s += lastra(-FA, FA, FB0, FB1, Z0, zf, T, {
      davanti: function (W, H, pr) {
        var su = pr.map(function (x) { return [x[0], x[1] + 2.3]; }).filter(function (x) { return x[0] > 2.6 && x[0] < W - 2.6; }), cx = W / 2, yb = H - 1.7, yc = (2.3 + yb) / 2 + 1.2;
        var timpano = "M" + q(su[0][0], yb) + " L" + su.map(function (x) { return q(x[0], Math.min(x[1], yb)); }).join(" L") + " L" + q(su[su.length - 1][0], yb) + " Z";
        return (noce ? venature(W, H, c, 57, false, .8) : lacca(W, H, luce(c) < .3 ? 1.2 : .7)) + filo(timpano) +
          filo("M" + q(cx - 2.6, yc + .6) + " Q" + q(cx - 9, yc - 3.4) + " " + q(cx - 16, yc + 1.6) + " M" + q(cx + 2.6, yc + .6) + " Q" + q(cx + 9, yc - 3.4) + " " + q(cx + 16, yc + 1.6)) +   // i tralci
          [-1, 1].map(function (k) { return ell(cx + k * 9.5, yc - 1.4, 1.6, .8, m, "transform='rotate(" + (k * 20) + " " + f1(cx + k * 9.5) + " " + f1(yc - 1.4) + ")'"); }).join("") +   // le foglioline
          pomoloOro(cx, yc, 1.25);
      },
      dietro: function (W, H) { return noce ? venature(W, H, c, 58, false, .7) : ""; }
    }, 2);
    s += faccia(Puv(-FA, G > 0 ? FB1 : -FB0, zf(0)), 1, cresta(FA * 61, .6, .85));
    return s;
  });

  // =========================================================
  //  I LETTI: stessa base (giroletto, materasso, cuscini, trapunta imbottita); t = la trapunta, l = il legno
  // =========================================================
  var COL_LETTO = [{ id: "rosa", nome: "trapunta rosa", c: "#e8789a", t: "#e8789a", l: "#8a5a3a" }, { id: "blu", nome: "trapunta blu", c: "#4c6ef5", t: "#4c6ef5", l: "#8a5a3a" }, { id: "verde", nome: "trapunta verde", c: "#40c057", t: "#40c057", l: "#c08a55" },
    { id: "lilla", nome: "bianco e lilla", c: "#b197fc", t: "#b197fc", l: "#e9ecef" }, { id: "oro", nome: "nero e oro", c: "#f2c14e", t: "#f2c14e", l: "#343a40" }, { id: "rosso", nome: "rosso fuoco", c: "#e03131", t: "#e03131", l: "#5c3a21" }];
  var COL_BALD = [{ id: "rosso", nome: "rosso e oro", c: "#c92a2a", t: "#c92a2a", l: "#5c3a21" }, { id: "bianco", nome: "bianco e lilla", c: "#b197fc", t: "#b197fc", l: "#f1f3f5" },
    { id: "blu", nome: "blu notte", c: "#364fc7", t: "#364fc7", l: "#2b2b30" }, { id: "rosa", nome: "rosa", c: "#f783ac", t: "#f783ac", l: "#e9ecef" }];
  function legnoDi(l) {   // il legno del letto: venato se è legno, laccato lucido se è bianco o nero
    var lu = luce(l), grana = lu > .22 && lu < .8;
    return { c: l, T: grana ? legnoT(l) : tinte(l), grana: grana, filo: lu < .3 ? "#e0b84a" : lu > .8 ? "#c9b27a" : chiaro(l, .35) };
  }
  function grana(W, H, Wd, seme, vert) { return Wd.grana ? venature(W, H, Wd.c, seme, vert, .9) : lacca(W, H, luce(Wd.c) < .3 ? 1.3 : .8); }
  // il pomolo tornito in cima ai pali (oro = d'ottone)
  function pomolo(a, b, z, r, Wd, oro) {
    var F = forma(a, b, r, r, r), st = oro ? ORO : [[0, chiaro(Wd.c, .4)], [.5, Wd.c], [1, scuro(Wd.c, .45)]];
    return corpo([giro(F, z, .75, 20), giro(F, z + 1.4, 1.05, 20), giro(F, z + 2.6, .55, 20)], st, 1.2) +
      corpo([giro(F, z + 2.6, .7, 24), giro(F, z + 5, 1.25, 24), giro(F, z + 7.6, .7, 24)], st, 1.3) + lucido(sagoma([giro(F, z + 2.6, .7, 24), giro(F, z + 5, 1.25, 24), giro(F, z + 7.6, .7, 24)]), .8, .35);
  }
  // il pannello ad arco sulla faccia di una testiera o pediera: la bugna che segue la curva, il filo di intarsio, il medaglione
  function arcoDecorato(W, H, pr, Wd, m, oro) {
    var su = pr.filter(function (x) { return x[0] >= m && x[0] <= W - m; }).map(function (x) { return [x[0], x[1] + m]; });
    var d = "M" + q(m, H + 2) + " L" + su.map(function (x) { return q(x); }).join(" L") + " L" + q(W - m, H + 2) + " Z", c = Wd.c, r = "";
    r += pth(d, lin("ar" + c.slice(1), [[0, chiaro(c, .16)], [1, scuro(c, .06)]], 0, 0, 1, 1)) + (Wd.grana ? dentro(d, "<g transform='translate(" + m + " 0)'>" + venature(W - 2 * m, H, c, 61, true, .9) + "</g>") : "");
    r += tratto(aperto(su.map(function (x) { return [x[0] - .5, x[1] - .6]; })), chiaro(c, .5), 1.2, op(.8)) + tratto(aperto(su.map(function (x) { return [x[0] + .5, x[1] + .9]; })), scuro(c, .4), 1, op(.6));
    r += tratto(aperto(su.map(function (x) { return [x[0], x[1] + 3.2]; }).filter(function (x, i, a) { return i > 0 && i < a.length - 1; })), oro ? "#f2c94c" : Wd.filo, .9, op(.9));   // il filo d'intarsio
    var cx = W / 2, cy = su[Math.floor(su.length / 2)][1] + 7.5;   // il medaglione intagliato
    r += ell(cx + .4, cy + .6, 6.4, 4.4, "#000", op(.18)) + ell(cx, cy, 6.2, 4.2, oro ? lin("md", ORO, 0, 0, 1, 1) : lin("md" + c.slice(1), [[0, chiaro(c, .4)], [1, scuro(c, .2)]], 0, 0, 1, 1), bordo(L, .8));
    [0, 1, 2, 3, 4].forEach(function (i) { var an = i * 1.2566 - 1.5708; r += ell(cx + Math.cos(an) * 2.4, cy + Math.sin(an) * 1.7, 1.5, 1.1, oro ? "#fff1b8" : chiaro(c, .45), "stroke='" + (oro ? "#a8781a" : scuro(c, .35)) + "' stroke-width='.5' transform='rotate(" + f1(an * 57.3 + 90) + " " + f1(cx + Math.cos(an) * 2.4) + " " + f1(cy + Math.sin(an) * 1.7) + ")'"); });
    return r + cer(cx, cy, 1.2, oro ? "#a8781a" : scuro(c, .4));
  }
  // un cuscino appoggiato: la faccia davanti (piano a-z, inclinata indietro di incl), spesso sp; tipo 1 = col bottone
  function cuscino(ca, cb, ra, rz, z0, incl, sp, col, tipo, oro) {
    var fr = [], re = [], i, N = 44;
    for (i = 0; i < N; i++) {
      var t = i / N * 6.2832, c = Math.cos(t), s = Math.sin(t), k = 1 - .09 * Math.cos(4 * t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), .85) * k, y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), .85) * k;
      var a = ca + x * ra, z = z0 + (y + 1) * rz, b = cb - incl * (y + 1);
      fr.push(P(a, b, z)); re.push(P(a, b - sp, z - .6));
    }
    var vis = G > 0 ? fr : re, alt = G > 0 ? re : fr, bb = limiti(vis), r = "", sb = limiti(alt.concat(vis));
    r += pth(chiuso(inviluppo(alt.concat(vis))), lin("cf", [[0, chiaro(col, .1)], [1, scuro(col, .2)]], sb[0], 0, sb[2], 0, true), bordo(L, 1.6));   // il fianco gonfio
    r += pth(chiuso(vis), rad("cu" + col.slice(1), [[0, chiaro(col, .8)], [.4, chiaro(col, .3)], [.8, col], [1, scuro(col, .12)]], .4, .32, .78), bordo(L, 1.25));
    if (G > 0) {
      var cuc = vis.map(function (p2) { return [bb[0] + (p2[0] - bb[0]) * .92 + (bb[2] - bb[0]) * .04, bb[1] + (p2[1] - bb[1]) * .9 + (bb[3] - bb[1]) * .05]; });
      r += tratto(chiuso(cuc), oro ? "#e0b84a" : chiaro(col, .55), oro ? 1 : .7, op(.9));   // il bordino
      var cx = (bb[0] + bb[2]) / 2, cy = (bb[1] + bb[3]) / 2;
      r += tratto("M" + q(bb[0] + (bb[2] - bb[0]) * .2, bb[1] + (bb[3] - bb[1]) * .3) + " Q" + q(cx - 2, cy + 1) + " " + q(cx + (bb[2] - bb[0]) * .12, cy + (bb[3] - bb[1]) * .18), scuro(col, .2), .8, op(.45));   // la piega
      if (tipo === 1) r += [0, 1, 2, 3].map(function (j) { var an = j * 1.5708 + .785; return tratto(linea([cx, cy], [cx + Math.cos(an) * 4.5, cy + Math.sin(an) * 3]), scuro(col, .35), .7, op(.6)); }).join("") +
        cer(cx, cy, 1.5, oro ? lin("bt", ORO, 0, 0, 1, 1) : scuro(col, .25), bordo(L, .6));
      r += lucido(vis, .5, .35);
    }
    return r;
  }
  // la trapunta: il piano imbottito a riquadri cuciti, il lenzuolo risvoltato col ricamo, il lembo che pende sul fianco che si vede
  function trapunta(t, oro) {
    var ZQ = 31.5, A = .83, Bt = -.4, Bf = .9, na = 6, nb = 5, du = 2 * A / na, dv = (Bf - Bt) / nb, s = "", i, j, aV = A * G, n = 44;
    function zh(b) { return 10.5 + 2 * Math.sin(b * 21) + .8 * Math.sin(b * 47); }
    var su = [], giu = [];
    for (i = 0; i <= n; i++) { var b = Bt + (Bf - Bt) * i / n; su.push(P(aV, b, ZQ - .5)); giu.push(P(aV * 1.04, b, zh(b))); }
    var lembo = su.concat(giu.slice().reverse()), lb = limiti(lembo), pieghe = "";
    for (i = 1; i < 9; i++) { var bp = Bt + (Bf - Bt) * (i - .3 + .35 * Math.sin(i * 2.7)) / 9; pieghe += tratto(linea(P(aV, bp, ZQ - 3), P(aV * 1.04, bp, zh(bp) + .5)), scuro(t, .35), 2.2, op(.3)) + tratto(linea(P(aV, bp + .025, ZQ - 3), P(aV * 1.04, bp + .025, zh(bp + .025) + .5)), chiaro(t, .35), 1, op(.35)); }
    for (j = 1; j < nb; j++) { var bj = Bt + j * dv; pieghe += tratto(linea(P(aV, bj, ZQ - 1), P(aV * 1.04, bj, zh(bj))), scuro(t, .3), .7, "stroke-dasharray='1.6 1.2' opacity='.7'"); }
    var cuci = []; for (i = 0; i <= n; i++) { var b2 = Bt + (Bf - Bt) * i / n; cuci.push(P(aV * 1.02, b2, 21 + .5 * Math.sin(b2 * 21))); }
    pieghe += tratto(aperto(cuci), scuro(t, .3), .7, "stroke-dasharray='1.6 1.2' opacity='.7'");
    var risv = []; for (i = 0; i <= 8; i++) { var b3 = Bt + .13 * i / 8; risv.push(P(aV, b3, ZQ - .5)); } for (i = 8; i >= 0; i--) { var b4 = Bt + .13 * i / 8; risv.push(P(aV * 1.04, b4, zh(b4))); }
    s += pth(chiuso(lembo), lin("lb", [[0, chiaro(t, .12)], [.5, t], [1, scuro(t, .3)]], 0, lb[1], 0, lb[3], true), bordo(L, 2)) + dentro(chiuso(lembo), pieghe + pth(chiuso(risv), lin("rv", [[0, "#ffffff"], [1, "#e6e1d8"]], 0, lb[1], 0, lb[3], true)));
    if (oro) s += tratto(aperto(giu), "#a8781a", 2.6) + tratto(aperto(giu), "#f2c94c", 1.4) + fascio(giu.filter(function (x, k) { return k % 2 === 0; }).map(function (x) { return [x, [x[0], x[1] + 3.2]]; }), "#d9a92e", .9);   // la frangia d'oro
    // il piano: i riquadri gonfi e le cuciture
    var F = forma(0, (Bt + Bf) / 2, A, (Bf - Bt) / 2, (Bf - Bt) / 2, 9), top = giro(F, ZQ, 1, 80), cel = "", gonfio = rad("tg" + t.slice(1), [[0, chiaro(t, .42)], [.5, chiaro(t, .1)], [1, scuro(t, .14)]], .34, .3, .78);
    for (i = 0; i < na; i++) for (j = 0; j < nb; j++) { var u0 = -A + i * du, v0 = Bt + j * dv; cel += poly([P(u0, v0, ZQ), P(u0 + du, v0, ZQ), P(u0 + du, v0 + dv, ZQ), P(u0, v0 + dv, ZQ)], gonfio); }
    for (i = 1; i < na; i++) { var ua = -A + i * du; cel += tratto(linea(P(ua, Bt, ZQ), P(ua, Bf, ZQ)), scuro(t, .3), 1.5, op(.35)) + tratto(linea(P(ua, Bt, ZQ), P(ua, Bf, ZQ)), chiaro(t, .4), .55, "stroke-dasharray='1.6 1.2' opacity='.8' transform='translate(0 -.5)'"); }
    for (j = 1; j < nb; j++) { var vb = Bt + j * dv; cel += tratto(linea(P(-A, vb, ZQ), P(A, vb, ZQ)), scuro(t, .3), 1.5, op(.35)) + tratto(linea(P(-A, vb, ZQ), P(A, vb, ZQ)), chiaro(t, .4), .55, "stroke-dasharray='1.6 1.2' opacity='.8' transform='translate(0 -.5)'"); }
    if (oro) cel += tratto(chiuso(giro(F, ZQ, [.93, .9], 80)), "#a8781a", 2.2, op(.9)) + tratto(chiuso(giro(F, ZQ, [.93, .9], 80)), "#f6d77a", 1, op(.95));   // la greca d'oro
    s += pth(chiuso(top), t) + dentro(chiuso(top), cel) + tratto(chiuso(top), chiaro(t, .45), 1.2, "opacity='.6' transform='translate(-.4 -.6)'") + pth(chiuso(top), "none", bordo(L, 1.8));
    // il lenzuolo risvoltato sopra la trapunta, col bordo ricamato a smerlo
    var r0 = Bt - .02, r1 = Bt + .13, ban = [P(-A - .01, r0, ZQ + .6), P(A + .01, r0, ZQ + .6), P(A + .01, r1, ZQ + .6), P(-A - .01, r1, ZQ + .6)], sm = "";
    for (i = 0; i < 26; i++) { var ax = -A + (2 * A) * (i + .5) / 26, pc = P(ax, r1, ZQ + .6); sm += cer(pc[0], pc[1], 1.3, "#ffffff", "stroke='" + (oro ? "#d9a92e" : chiaro(t, .1)) + "' stroke-width='.6'"); }
    s += poly(ban, lin("ln", [[0, "#ffffff"], [1, "#ece7de"]], 0, 0, 0, 1), bordo(L, 1.3)) + dentro(chiuso(ban), tratto(linea(P(-A, r1 - .035, ZQ + .6), P(A, r1 - .035, ZQ + .6)), oro ? "#e0b84a" : t, 1.1, op(.85))) + sm;
    return s;
  }
  // il materasso e il giroletto
  function base(Wd) {
    var m = ["#fbf8f3", lin("mtl", [[0, "#ffffff"], [1, "#e9e4da"]], 0, 0, 0, 1), lin("mtd", [[0, "#d6cfc2"], [1, "#bdb4a5"]], 0, 0, 0, 1)];
    m[0] = lin("mts", [[0, "#ffffff"], [1, "#efebe3"]], 0, 0, 1, 1);
    var cuciture = function (W, H) { var r = rett(0, 1.2, W, .7, 0, "#c9c1b2") + rett(0, H - 1.9, W, .7, 0, "#c9c1b2"), x; for (x = 4; x < W; x += 6) r += cer(x, H / 2, .6, "#b9b0a0"); return r; };
    return blocco(-.82, .82, -.915, .915, 9, 20, Wd.T, { davanti: function (W, H) { return grana(W, H, Wd, 62, false) + rett(0, H - 3, W, .7, 0, scuro(Wd.c, .4), op(.5)); }, dietro: function (W, H) { return grana(W, H, Wd, 63, false); }, fianco: function (W, H) { return grana(W, H, Wd, 64, false) + rett(0, H - 3, W, .7, 0, scuro(Wd.c, .5), op(.5)); } }, 2) +
      blocco(-.8, .8, -.9, .9, 20, 29.5, m, { davanti: cuciture, dietro: cuciture, fianco: cuciture }, 1.8);
  }
  // i cuscini: due grandi bianchi dritti contro la testiera, due color crema davanti, quello decorativo col bottone
  function cuscini(t, oro) {   // in fila: da dietro in avanti (si disegnano solo davanti: da dietro li copre la testiera)
    return [cuscino(-.41, -.8, .355, 12, 27.5, .065, .07, "#ffffff", 0, oro), cuscino(.41, -.8, .355, 12, 27.5, .065, .07, "#ffffff", 0, oro),
      cuscino(-.4, -.6, .32, 8.6, 28.5, .09, .06, oro ? t : "#f6eadb", 0, oro), cuscino(.4, -.6, .32, 8.6, 28.5, .09, .06, oro ? t : "#f6eadb", 0, oro),
      cuscino(0, -.45, .17, 7, 29.5, .075, .06, oro ? "#f2c94c" : t, 1, oro)].join("");
  }

  // =========================================================
  //  LETTO CON LA TRAPUNTA: testiera alta ad arco col medaglione intagliato e i pomoli, pediera più bassa,
  //  la trapunta imbottita a riquadri, il lenzuolo ricamato, cinque cuscini
  // =========================================================
  def("letto_matrimoniale", { tipo: "piedi", nome: "Letto con la trapunta", stanza: "camera", fp: [2, 2], box: [-98, -131, 110, 60], dietro: true, azione: "dormi", cuscino: [11, -62.5], prezzo: 2000, colori: COL_LETTO }, function (o) {
    var K = colore(COL_LETTO, o), Wd = legnoDi(K.l), s = ombra(6, 12, 112, 50);
    function testa() {
      var za = function (a) { return 60 + 10 * Math.pow(Math.max(0, Math.cos(Math.min(1, Math.abs(a) / .82) * 1.5708)), 1.4); };
      var pali = [-1, 1].map(function (sg) { var a0 = sg < 0 ? -.9 : .82; return [vicino(a0 + .04, -.955), blocco(a0, a0 + .08, -.995, -.915, 0, 74, Wd.T, { davanti: function (W, H) { return grana(W, H, Wd, 65, true); }, dietro: function (W, H) { return grana(W, H, Wd, 66, true); }, fianco: function (W, H) { return grana(W, H, Wd, 67, true); } }, 2) + pomolo(a0 + .04, -.955, 74, .045, Wd)]; });
      var pan = lastra(-.82, .82, -.985, -.925, 18, za, Wd.T, { davanti: function (W, H, pr) { return grana(W, H, Wd, 68, true) + arcoDecorato(W, H, pr, Wd, 6); }, dietro: function (W, H) { return grana(W, H, Wd, 69, true) + rett(6, 8, W - 12, H, 3, "none", "stroke='" + scuro(Wd.c, .3) + "' stroke-width='.8' opacity='.6'"); } }, 2.2);
      return ordina(pali.concat([[vicino(0, -.955), pan]]));
    }
    function piedi() {
      var za = function (a) { return 35 + 5 * Math.pow(Math.max(0, Math.cos(Math.min(1, Math.abs(a) / .82) * 1.5708)), 1.4); };
      var pali = [-1, 1].map(function (sg) { var a0 = sg < 0 ? -.9 : .82; return [vicino(a0 + .04, .955), blocco(a0, a0 + .08, .915, .995, 0, 42, Wd.T, { davanti: function (W, H) { return grana(W, H, Wd, 70, true); }, dietro: function (W, H) { return grana(W, H, Wd, 71, true); }, fianco: function (W, H) { return grana(W, H, Wd, 72, true); } }, 2) + pomolo(a0 + .04, .955, 42, .045, Wd)]; });
      var pan = lastra(-.82, .82, .925, .985, 11, za, Wd.T, { davanti: function (W, H, pr) { return grana(W, H, Wd, 73, true) + arcoDecorato(W, H, pr, Wd, 5); }, dietro: function (W, H, pr) { return grana(W, H, Wd, 74, true) + arcoDecorato(W, H, pr, Wd, 5); } }, 2.2);
      return ordina(pali.concat([[vicino(0, .955), pan]]));
    }
    var letto = base(Wd);
    if (G > 0) s += testa() + letto + cuscini(K.t) + trapunta(K.t) + piedi();
    else s += piedi() + letto + trapunta(K.t) + testa();   // da dietro i cuscini stanno nascosti dalla testiera
    return s;
  });

  // =========================================================
  //  LETTO A BALDACCHINO: quattro colonne tornite coi pomoli d'ottone, il cielo con la mantovana a festoni,
  //  la frangia e le nappe d'oro, le tende raccolte coi cordoni; la testiera capitonné di velluto;
  //  la trapunta con la greca d'oro, il plaid di velluto ai piedi
  // =========================================================
  function nappa(x, y, k) {   // la nappa d'oro: il pomolo e la gonnellina di fili
    k = k || 1;
    return cer(x, y, 1.7 * k, lin("np", ORO, 0, 0, 1, 1), bordo(L, .6)) + pth("M" + q(x - 1.5 * k, y + .9 * k) + " L" + q(x - 2.5 * k, y + 6.5 * k) + " Q" + q(x, y + 7.8 * k) + " " + q(x + 2.5 * k, y + 6.5 * k) + " L" + q(x + 1.5 * k, y + .9 * k) + " Z", lin("np2", ORO, 0, 0, 1, 0), bordo(L, .6)) +
      tratto("M" + q(x - .9 * k, y + 2.6 * k) + " L" + q(x - 1.3 * k, y + 6.4 * k) + " M" + q(x, y + 2.6 * k) + " L" + q(x, y + 7 * k) + " M" + q(x + .9 * k, y + 2.6 * k) + " L" + q(x + 1.3 * k, y + 6.4 * k), "#9a6c12", .45);
  }
  function cresta(x, y, k) {   // il fregio d'oro a conchiglia, appoggiato in (x, y) su una faccia piatta
    var r = "", i, R = 8 * k, d = "M" + q(x - R, y) + " A" + f1(R) + "," + f1(R * .95) + " 0 0,1 " + q(x + R, y) + " Z";
    r += pth(d, lin("cr", ORO, 0, 0, 1, 1), bordo(L, .9));
    for (i = 1; i < 7; i++) { var an = 3.1416 * i / 7; r += tratto(linea([x, y - .6], [x - Math.cos(an) * R * .92, y - Math.sin(an) * R * .88]), "#a8781a", .6, op(.9)); }
    r += pth("M" + q(x - R - 3.4 * k, y) + " q" + f1(1.5 * k) + "," + f1(-3.6 * k) + " " + f1(3.6 * k) + ",0 M" + q(x + R + 3.4 * k, y) + " q" + f1(-1.5 * k) + "," + f1(-3.6 * k) + " " + f1(-3.6 * k) + ",0", "none", "stroke='#7a5410' stroke-width='2.6' stroke-linecap='round'") +
      pth("M" + q(x - R - 3.4 * k, y) + " q" + f1(1.5 * k) + "," + f1(-3.6 * k) + " " + f1(3.6 * k) + ",0 M" + q(x + R + 3.4 * k, y) + " q" + f1(-1.5 * k) + "," + f1(-3.6 * k) + " " + f1(-3.6 * k) + ",0", "none", "stroke='#f2c94c' stroke-width='1.3' stroke-linecap='round'");
    return r + cer(x, y - R - 1.6 * k, 1.9 * k, rad("cb", [[0, "#fffbe6"], [.5, "#f2c94c"], [1, "#9a6c12"]], .35, .3, .8), bordo(L, .7)) + ell(x - R * .35, y - R * .5, 1.2, 2.4, "#ffffff", op(.6));
  }
  // il capitonné: losanghe gonfie, le pieghe tra i bottoni, i bottoni (dentro una forma "d" su una faccia piatta)
  function capitonne(d, x0, y0, x1, y1, t, px, py) {
    var r = "", i, j, g = rad("cap" + t.slice(1), [[0, chiaro(t, .4)], [.55, t], [1, scuro(t, .38)]], .42, .36, .72);
    for (j = -1; j * py < y1 - y0 + py; j++) for (i = -1; i * px < x1 - x0 + px; i++) {
      var cx = x0 + i * px + ((j + 1) % 2 === 0 ? 0 : px / 2) + px / 2, cy = y0 + j * py;
      r += poly([[cx, cy - py], [cx + px / 2, cy], [cx, cy + py], [cx - px / 2, cy]], g);
    }
    var pi = [], lu = [], bot = "", bl = "";
    function tondo(x, y, rr) { return "M" + q(x - rr, y) + " a" + f1(rr) + "," + f1(rr) + " 0 1,0 " + f1(2 * rr) + ",0 a" + f1(rr) + "," + f1(rr) + " 0 1,0 " + f1(-2 * rr) + ",0 "; }
    for (j = -1; j * py < y1 - y0 + py; j++) for (i = -1; i * px < x1 - x0 + px; i++) {
      var bx = x0 + i * px + (j % 2 === 0 ? 0 : px / 2), by = y0 + j * py;
      pi.push([[bx - px / 2, by + py], [bx, by]], [[bx, by], [bx + px / 2, by + py]]); lu.push([[bx - px / 2 + .5, by + py + .4], [bx + .3, by + .6]]);
      bot += tondo(bx, by, 1.15); bl += tondo(bx - .35, by - .35, .4);   // i bottoni (tutti in un tracciato) e il loro puntino di luce
    }
    return dentro(d, r + fascio(pi, scuro(t, .45), .8, op(.6)) + fascio(lu, chiaro(t, .35), .5, op(.5)) + pth(bot, scuro(t, .28), "stroke='" + scuro(t, .6) + "' stroke-width='.4'") + pth(bl, chiaro(t, .45)) + lacca(x1, y1, .6));
  }
  def("letto_baldacchino", { tipo: "piedi", nome: "Letto a baldacchino", stanza: "tutte", fp: [2, 2], box: [-107, -214, 115, 63], dietro: true, azione: "dormi", cuscino: [11, -62.5], prezzo: 4200, colori: COL_BALD }, function (o) {
    var K = colore(COL_BALD, o), Wd = legnoDi(K.l), t = K.t, s = ombra(6, 14, 118, 52), PA = .885, PB = .955, ZR = 150, HV = 19;
    var stC = [[0, chiaro(Wd.c, .42)], [.5, Wd.c], [1, scuro(Wd.c, .45)]];
    // ---- il letto dentro ----
    function testa() {
      var za = function (a) { return 80 + 12 * Math.pow(Math.max(0, Math.cos(Math.min(1, Math.abs(a) / .84) * 1.5708)), 1.2); };
      var r = lastra(-.835, .835, -.985, -.925, 18, za, Wd.T, {
        davanti: function (W, H, pr) {   // il velluto capitonné dentro la cornice di legno, col filo d'oro
          var m = 5.5, su = pr.filter(function (x) { return x[0] >= m && x[0] <= W - m; }).map(function (x) { return [x[0], x[1] + m]; });
          var d = "M" + q(m, H + 2) + " L" + su.map(function (x) { return q(x); }).join(" L") + " L" + q(W - m, H + 2) + " Z";
          return grana(W, H, Wd, 81, true) + pth(d, t) + capitonne(d, m, su[Math.floor(su.length / 2)][1] + 4, W - m, H, t, 9, 7.5) +
            tratto(aperto(su.map(function (x) { return [x[0], x[1] - 1]; })), "#7a5410", 2.4) + tratto(aperto(su.map(function (x) { return [x[0], x[1] - 1]; })), "#f2c94c", 1.2) +
            tratto("M" + q(m - 1, H) + " L" + q(su[0][0] - 1, su[0][1] - 1) + " M" + q(W - m + 1, H) + " L" + q(su[su.length - 1][0] + 1, su[su.length - 1][1] - 1), "#f2c94c", 1.2);
        },
        dietro: function (W, H) { return grana(W, H, Wd, 82, true) + rett(6, 10, W - 12, H, 3, "none", "stroke='" + scuro(Wd.c, .3) + "' stroke-width='.8' opacity='.6'"); }
      }, 2.2);
      var o2 = Puv(-.835, G > 0 ? -.925 : .985, 92);   // il fregio d'oro in cima alla testiera
      return r + faccia(o2, 1, cresta(.835 * 61, 0, 1.1));
    }
    function piedi() {
      var za = function (a) { return 38 + 5 * Math.pow(Math.max(0, Math.cos(Math.min(1, Math.abs(a) / .84) * 1.5708)), 1.4); };
      var dec = function (W, H, pr) {
        var m = 5, su = pr.filter(function (x) { return x[0] >= m && x[0] <= W - m; }).map(function (x) { return [x[0], x[1] + m]; });
        var d = "M" + q(m, H - 4) + " L" + su.map(function (x) { return q(x); }).join(" L") + " L" + q(W - m, H - 4) + " Z";
        return grana(W, H, Wd, 83, true) + pth(d, t) + capitonne(d, m, su[Math.floor(su.length / 2)][1] + 4.5, W - m, H, t, 9, 7.5) + pth(d, "none", "stroke='#7a5410' stroke-width='2.4'") + pth(d, "none", "stroke='#f2c94c' stroke-width='1.2'");
      };
      return lastra(-.835, .835, .925, .985, 11, za, Wd.T, { davanti: dec, dietro: dec }, 2.2);
    }
    function plaid() {   // il plaid di velluto piegato ai piedi, con le righe d'oro, che pende sul fianco con la frangia
      var b0 = .44, b1 = .7, Z = 33.2, A = .845, aV = A * G, r = "", i, su = [], giu = [];
      for (i = 0; i <= 12; i++) { var b = b0 + (b1 - b0) * i / 12; su.push(P(aV, b, Z - .5)); giu.push(P(aV * 1.05, b, 13 + .8 * Math.sin(i * 1.7))); }
      var lem = su.concat(giu.slice().reverse()), lb = limiti(lem), pv = scuro(t, .3);
      r += pth(chiuso(lem), lin("pl" + t.slice(1), [[0, chiaro(pv, .15)], [1, scuro(pv, .35)]], 0, lb[1], 0, lb[3], true), bordo(L, 1.6));
      r += dentro(chiuso(lem), [.18, .82].map(function (k) { var bb = b0 + (b1 - b0) * k; return tratto(linea(P(aV, bb, Z), P(aV * 1.05, bb, 12)), "#f2c94c", 1.3); }).join(""));
      r += fascio(giu.map(function (x) { return [x, [x[0], x[1] + 3]]; }), "#d9a92e", .9);
      var top = [P(-A, b0, Z), P(A, b0, Z), P(A, b1, Z), P(-A, b1, Z)];
      r += poly(top, lin("pt" + t.slice(1), [[0, chiaro(pv, .3)], [.5, pv], [1, scuro(pv, .2)]], 0, 0, 1, 1), bordo(L, 1.5));
      r += dentro(chiuso(top), [.18, .82].map(function (k) { var bb = b0 + (b1 - b0) * k; return tratto(linea(P(-A, bb, Z), P(A, bb, Z)), "#f2c94c", 1.3); }).join("") + laccaSopra(top, .9));
      return r;
    }
    var letto = base(Wd), interno = G > 0 ? testa() + letto + cuscini(t, true) + trapunta(t, true) + plaid() + piedi() : piedi() + letto + trapunta(t, true) + plaid() + testa();   // da dietro i cuscini stanno nascosti dalla testiera
    // ---- il baldacchino (uguale da tutti i lati): u, v = posto sullo schermo ----
    function colonna(u, v) {
      var a = u * G, b = v * G, F = forma(a, b, .042, .042, .042), r = blocco(a - .05, a + .05, b - .05, b + .05, 0, 21, Wd.T, { davanti: function (W, H) { return grana(W, H, Wd, 84, true); }, dietro: function (W, H) { return grana(W, H, Wd, 85, true); }, fianco: function (W, H) { return grana(W, H, Wd, 86, true); } }, 1.8);
      [[21, 23.5, 1.35, 1.45, 1.3], [23.5, 26.5, .9, .78, .95], [26.5, 45, .95, 1.55, .72], [45, 48, .8, 1.15, .8], [48, 139, .8, .88, .8], [139, 142.5, .95, 1.3, .95], [142.5, ZR + 2, 1.05, 1.05, 1.05]].forEach(function (g) {
        var lv = [giro(F, g[0], g[2], 20), giro(F, (g[0] + g[1]) / 2, g[3], 20), giro(F, g[1], g[4], 20)];
        r += corpo(lv, stC, 1.2) + (g[1] - g[0] > 10 ? lucido(sagoma(lv), .5, .5) : "");
      });
      return r;
    }
    function tenda(u, v) {   // la tenda raccolta: larga in alto, stretta dal cordone, si allarga fino a terra
      var p0 = Puv(u, v, 0), x = p0[0], yT = p0[1] - ZR + 6, yN = p0[1] - 76, yB = p0[1] - .5, wT = 12, wN = 3.6, wB = 8.5, r = "";
      var d = "M" + q(x - wT, yT) + " C" + q(x - wT, yT + 28) + " " + q(x - wN - 2.5, yN - 18) + " " + q(x - wN, yN) + " C" + q(x - wN - 1, yN + 22) + " " + q(x - wB, yB - 26) + " " + q(x - wB, yB) +
        " Q" + q(x - wB * .5, yB + 2.4) + " " + q(x, yB) + " Q" + q(x + wB * .5, yB + 2.4) + " " + q(x + wB, yB) +
        " C" + q(x + wB, yB - 26) + " " + q(x + wN + 1, yN + 22) + " " + q(x + wN, yN) + " C" + q(x + wN + 2.5, yN - 18) + " " + q(x + wT, yT + 28) + " " + q(x + wT, yT) + " Z";
      r += pth(d, lin("tn" + t.slice(1), [[0, chiaro(t, .3)], [.3, chiaro(t, .08)], [.65, scuro(t, .12)], [1, scuro(t, .42)]], 0, 0, 1, 0), bordo(L, 1.5));
      [-.62, -.22, .22, .62].forEach(function (k) { r += tratto("M" + q(x + k * wT, yT + 2) + " Q" + q(x + k * wT * .75, yN - 28) + " " + q(x + k * wN, yN) + " Q" + q(x + k * wB * .75, yN + 28) + " " + q(x + k * wB, yB - .5), k < 0 ? chiaro(t, .35) : scuro(t, .4), .9, op(.6)); });
      r += ell(x, yN, wN + 2, 2, "none", "stroke='#5c3d08' stroke-width='3.6'") + ell(x, yN, wN + 2, 2, "none", "stroke='#f2c94c' stroke-width='1.8'") + tratto("M" + q(x - wN - 1.5, yN - .8) + " L" + q(x + wN + 1.5, yN + .8), "#fff1b8", .6, op(.8));
      return r + tratto(linea([x + wN + 1.4, yN + 1], [x + wN + 2.6, yN + 7.5]), "#a8781a", 1) + nappa(x + wN + 2.6, yN + 7.5, 1.1);
    }
    function mantovana(W, H, interna) {   // la mantovana piatta (W × H): i festoni, il gallone d'oro in alto, la frangia e le nappe
      var nF = Math.max(2, Math.round(W / 24)), fw = W / nF, i, k, r = "", d = "M0,0 L" + f1(W) + ",0 L" + f1(W) + "," + f1(H - 7);
      for (i = nF - 1; i >= 0; i--) d += " Q" + q(fw * (i + .5), H + 4) + " " + q(fw * i, H - 7);
      d += " Z";
      r += pth(d, lin("mv" + t.slice(1) + (interna ? "i" : ""), interna ? [[0, scuro(t, .55)], [1, scuro(t, .3)]] : [[0, scuro(t, .25)], [.35, chiaro(t, .2)], [.7, t], [1, scuro(t, .25)]], 0, 0, 0, 1), bordo(L, 1.4));
      var pieghe = "";
      for (i = 0; i <= nF; i++) { var x = fw * i; pieghe += tratto("M" + q(x - 3.5, 3) + " Q" + q(x - 1, H * .5) + " " + q(x, H - 7), scuro(t, .4), 1, op(.5)) + tratto("M" + q(x + 3.5, 3) + " Q" + q(x + 1, H * .5) + " " + q(x, H - 7), chiaro(t, .3), .8, op(interna ? .2 : .45)); }
      for (i = 0; i < nF; i++) for (k = 1; k <= 2; k++) pieghe += tratto("M" + q(fw * i + 2 + k * 2, H - 8 - k * 3) + " Q" + q(fw * (i + .5), H + 1 - k * 3.4) + " " + q(fw * (i + 1) - 2 - k * 2, H - 8 - k * 3), interna ? scuro(t, .6) : chiaro(t, .32), .8, op(.55));
      r += dentro(d, pieghe);
      r += rett(0, 0, W, 3.4, 0, lin("gb", ORO, 0, 0, 0, 1), bordo(L, .8));
      var tr = [], fr = [];
      for (i = 1; i < W - 1; i += 2.2) tr.push([[i, .7], [i + 1.3, 2.8]]);
      for (i = 0; i < nF; i++) for (k = 1; k < 12; k++) { var tt = k / 12, xx = fw * i + fw * tt, yy = (1 - tt) * (1 - tt) * (H - 7) + 2 * (1 - tt) * tt * (H + 4) + tt * tt * (H - 7); fr.push([[xx, yy - .6], [xx, yy + 3.2]]); }
      r += fascio(tr, "#9a6c12", .5, op(.8)) + fascio(fr, interna ? "#b8892a" : "#e0b84a", .9);
      for (i = 1; i < nF; i++) r += nappa(fw * i, H - 7.5, .9);
      return r;
    }
    function lato(qual, interna) {   // un lato del cielo: la cornice di legno in cima e la mantovana (qual: "v-", "v+", "u-", "u+")
      var r = "", W, o, dir, e = .045, vv = qual === "v+" ? PB : -PB, uu = qual === "u+" ? PA : -PA;   // la stoffa pende dal bordo di fuori della cornice
      if (qual[0] === "v") { W = 2 * (PA + e) * 61; o = Puv(-PA - e, vv + (vv > 0 ? e : -e), ZR + 2); dir = 1; } else { W = 2 * (PB + e) * 61; o = Puv(uu + (uu > 0 ? e : -e), PB + e, ZR + 2); dir = -1; }
      r += faccia(o, dir, mantovana(W, HV, interna));
      var a0 = qual[0] === "v" ? -PA - .045 : uu - .045, a1 = qual[0] === "v" ? PA + .045 : uu + .045, b0 = qual[0] === "v" ? vv - .045 : -PB - .045, b1 = qual[0] === "v" ? vv + .045 : PB + .045;
      r += blocco(a0 * G < a1 * G ? a0 * G : a1 * G, a0 * G < a1 * G ? a1 * G : a0 * G, b0 * G < b1 * G ? b0 * G : b1 * G, b0 * G < b1 * G ? b1 * G : b0 * G, ZR + 2, ZR + 6.5, Wd.T, {
        davanti: function (W2, H2) { return rett(0, H2 * .55, W2, .9, 0, "#e0b84a", op(.9)); }, dietro: function (W2, H2) { return rett(0, H2 * .55, W2, .9, 0, "#e0b84a", op(.9)); }, fianco: function (W2, H2) { return rett(0, H2 * .55, W2, .9, 0, "#e0b84a", op(.9)); }
      }, 1.6);
      if (!interna) r += faccia(qual[0] === "v" ? Puv(-PA - e, vv + e, ZR + 6.5) : Puv(uu + e, PB + e, ZR + 6.5), dir, cresta(W / 2, 0, 1));
      return r;
    }
    var finali = [[-PA, -PB], [PA, -PB], [-PA, PB], [PA, PB]].map(function (c) { return [c[0] + c[1], pomolo(c[0] * G, c[1] * G, ZR + 6.5, .05, Wd, true)]; });
    // le colonne e le tende stanno dentro il cielo: la mantovana davanti le copre in alto
    s += colonna(-PA, -PB) + tenda(-PA, -PB) + lato("v-", true) + lato("u-", true) + colonna(PA, -PB) + tenda(PA, -PB) + interno + colonna(-PA, PB) + tenda(-PA, PB) +
      colonna(PA, PB) + tenda(PA, PB) + lato("v+", false) + lato("u+", false) + ordina(finali);
    return s;
  });

  // =========================================================
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  window.SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: d.stanza, w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice(), dietro: !!d.dietro, prezzo: d.prezzo, qual: 2 };
      if (d.piano) o.piano = d.piano;
      if (d.azione) o.azione = d.azione;
      if (d.seduta) o.seduta = d.seduta;
      if (d.cuscino) o.cuscino = [m.ax + d.cuscino[0], m.ay + d.cuscino[1]];   // dove va la testa, nelle misure del disegno
      if (d.colori) o.colori = d.colori.map(function (k) { return { id: k.id, nome: k.nome, c: k.c }; });
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "mc" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1;
      var c; try { c = d.fn(opz); } finally { G = 1; }
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

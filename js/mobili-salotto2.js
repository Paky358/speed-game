/* =========================================================
   SPeeD GAME — DIVANETTI, SEDIE, LETTI E MOBILI RIMASTI, VISTI DALL'ALTO
   Come il bagno (js/mobili-arte.js): una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Gli stessi mobili della casa vista di lato (js/casa.js), con gli stessi nomi, prezzi e colori:
   poltrona a sacco, pouf di velluto, sedia a dondolo, panca imbottita, sgabello di legno, futon giapponese,
   baule del tesoro, vetrinetta coi piatti, chitarra, tappeto di pelo bianco, tappeto tondo.
   Il davanti guarda in basso a sinistra; con { dietro: true } lo stesso mobile girato (si vede la schiena).
   Si aggiungono a SGMobiliArte con aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";

  // ---------- attrezzi (gli stessi del bagno, del soggiorno e della camera) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato (da dietro)
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(k) { return "opacity='" + f2(k) + "'"; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f1(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f1(rx) + "' ry='" + f1(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f1(x) + "' y='" + f1(y) + "' width='" + f1(w) + "' height='" + f1(h) + "'" + (r ? " rx='" + f1(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + (w || 2.4) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f1(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q(a) + " L" + q(b); }
  function chiuso(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function aperto(a) { return "M" + a.map(function (x) { return q(x); }).join(" L"); }
  function liscio(a, chiudi) {   // un tracciato morbido che passa per tutti i punti
    var n = a.length, d = "M" + q(a[0]), i, m = chiudi ? n : n - 1;
    for (i = 0; i < m; i++) {
      var p0 = a[(i - 1 + n) % n], p1 = a[i], p2 = a[(i + 1) % n], p3 = a[(i + 2) % n];
      if (!chiudi) { if (i === 0) p0 = p1; if (i + 2 >= n) p3 = p2; }
      d += " C" + q(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6) + " " + q(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6) + " " + q(p2);
    }
    return d + (chiudi ? " Z" : "");
  }
  function sposta(a, dx, dy) { return a.map(function (x) { return [x[0] + dx, x[1] + dy]; }); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function rientra(a, d) {   // la stessa forma, più stretta di d tutto attorno
    var cx = 0, cy = 0; a.forEach(function (x) { cx += x[0]; cy += x[1]; }); cx /= a.length; cy /= a.length;
    return a.map(function (x) { var dx = x[0] - cx, dy = x[1] - cy, l = Math.sqrt(dx * dx + dy * dy) || 1; return [x[0] - dx / l * d, x[1] - dy / l * d]; });
  }
  function tra(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function gira(x, y, ang) { return "transform='rotate(" + f1(ang) + " " + f1(x) + " " + f1(y) + ")'"; }
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
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];
  var OTTONE = [[0, "#fff6cf"], [.3, "#f3d27a"], [.62, "#c99a36"], [1, "#7a5614"]];
  var ORO = [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]];

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda (si disegna dopo)
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  var DAVANTI = function () { return G > 0 ? -Math.PI / 4 : Math.PI * .75; };   // da quale angolo comincia la metà tonda che si vede

  // le forme tonde in pianta: centro (ca, cb), mezza larghezza ra, mezza profondità rf davanti e rr dietro; e = 2 ovale, di più = più squadrata
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf, rr: rr == null ? rf : rr, e: e || 2 }; }
  function giro(F, z, k, n, db) {
    var ka = k == null ? 1 : (k.length ? k[0] : k), kb = k == null ? 1 : (k.length ? k[1] : k), out = [], i; n = n || 60;
    for (i = 0; i < n; i++) {
      var t = i / n * 6.2832, c = Math.cos(t), s = Math.sin(t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / F.e), y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / F.e);
      out.push(P(F.ca + x * F.ra * ka, F.cb + (db || 0) + y * (y > 0 ? F.rf : F.rr) * kb, z));
    }
    return out;
  }
  function arco(F, z, t0, t1, n, k) {   // un pezzo del bordo di una forma tonda, dall'angolo t0 a t1
    var out = [], i; n = n || 24; k = k || 1;
    for (i = 0; i <= n; i++) {
      var t = t0 + (t1 - t0) * i / n, c = Math.cos(t), s = Math.sin(t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / F.e), y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / F.e);
      out.push(P(F.ca + x * F.ra * k, F.cb + y * (y > 0 ? F.rf : F.rr) * k, z));
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

  // ---------- i mobili squadrati ----------
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
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), L, 1.1, "opacity='.8'");   // gli spigoli di dentro, sottili
    if (H > 5) s += tratto("M" + q(D[0] + 1.6, D[1] + 1.4) + " L" + q(C[0] - .6, C[1] + 1.1), "#ffffff", 1.1, "opacity='.6'");   // il filo di luce sullo spigolo davanti
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, lw || 2.3));
  }
  // una lastra in piedi (come un blocco sottile), col bordo di sopra che segue il profilo zt(a)
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
  function piano(O, X, Y, W, H, c) {   // un disegno piatto W × H steso su un piano qualsiasi: O = il suo angolo in alto a sinistra, X = la fine della riga di sopra, Y = la fine del lato di sinistra
    var m = [(X[0] - O[0]) / W, (X[1] - O[1]) / W, (Y[0] - O[0]) / H, (Y[1] - O[1]) / H, O[0], O[1]];
    return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>";
  }

  // ---------- la luce: viene da in alto a sinistra ----------
  function norma(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  var LUCE = norma([-.3, .5, .8]), VISTA = norma([1, 1, .82]), MEZZO = norma([LUCE[0] + VISTA[0], LUCE[1] + VISTA[1], LUCE[2] + VISTA[2]]);
  function tinta(c, n, m) {   // il colore di una superficie con la normale n (nella vista: u, v, z) fatta del materiale m
    m = m || {};
    var B = dot(n, LUCE), t = B >= .5 ? (B - .5) / .3 * .2 : (B - .5) / .8 * .27;
    if (m.velluto) { var g = 1 - Math.max(0, dot(n, VISTA)); t = t * .8 + g * g * m.velluto - .07; }   // il velluto: chiaro dove la stoffa gira, cupo e pieno dove ti guarda
    var col = tono(c, t * (m.forza || 1));
    if (m.lucido) { var sp = Math.pow(Math.max(0, dot(n, MEZZO)), m.esp || 24) * m.lucido; if (sp > .01) col = mix(col, m.riflesso ? chiaro(c, m.riflesso) : "#fff8ec", Math.min(.85, sp)); }
    return col;
  }
  var VELLUTO = { velluto: .5, lucido: .55, esp: 7, riflesso: .55 }, STOFFA = {}, LEGNO = { lucido: .32, esp: 12 };
  function pianoV(asse, fisso, t0, t1, z0, z1, cont) {   // un disegno piatto su un piano dritto (asse "a" = largo lungo a, "b" = largo lungo b)
    var W = Math.abs(t1 - t0) * 61, H = z1 - z0, lo = Math.min(t0, t1), hi = Math.max(t0, t1), s, e;
    if (asse === "a") { s = G > 0 ? lo : hi; e = G > 0 ? hi : lo; return piano(P(s, fisso, z1), P(e, fisso, z1), P(s, fisso, z0), W, H, cont); }
    s = G > 0 ? hi : lo; e = G > 0 ? lo : hi; return piano(P(fisso, s, z1), P(fisso, e, z1), P(fisso, s, z0), W, H, cont);
  }
  function buio(W, H, k, su) { return rett(0, 0, W, H, 0, nuova(su ? [[0, "#000", k], [1, "#000", 0]] : [[0, "#000", 0], [1, "#000", k]], 0, 0, 0, 1)); }

  // ---------- i pezzi imbottiti: una sezione tirata lungo un asse (come nel soggiorno) ----------
  function arcoS(cx, cz, rx, rz, a0, a1, n) { var o = [], i; for (i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(t), cz + rz * Math.sin(t)]); } return o; }
  function pulisci(a) { return a.filter(function (x, i) { var y = a[(i + a.length - 1) % a.length]; return Math.abs(x[0] - y[0]) > 1e-4 || Math.abs(x[1] - y[1]) > 1e-3; }); }
  function tondo(x0, x1, z0, z1, r, pancia, rb) {   // la sezione di un cuscino
    var rz = r * 61, b = rb == null ? r * .5 : rb, bz = b * 61, top = [], k;
    for (k = 1; k < 8; k++) { var s = k / 8; top.push([x1 - r - (x1 - x0 - 2 * r) * s, z1 + (pancia || 0) * Math.sin(Math.PI * s)]); }
    return pulisci([].concat(arcoS(x0 + b, z0 + bz, b, bz, Math.PI, Math.PI * 1.5, 3), arcoS(x1 - b, z0 + bz, b, bz, Math.PI * 1.5, Math.PI * 2, 3),
      arcoS(x1 - r, z1 - rz, r, rz, 0, Math.PI / 2, 9), top, arcoS(x0 + r, z1 - rz, r, rz, Math.PI / 2, Math.PI, 9)));
  }
  function estruso(asse, prof, t0, t1, c, o) {
    o = o || {};
    var A = asse === "a", tv = G > 0 ? t1 : t0, tn = G > 0 ? t0 : t1, n = prof.length, m = o.mat, i;
    function p3(pt, t) { return A ? P(t, pt[0], pt[1]) : P(pt[0], t, pt[1]); }
    var capV = prof.map(function (x) { return p3(x, tv); }), capN = prof.map(function (x) { return p3(x, tn); });
    var sil = inviluppo(capV.concat(capN)), dSil = chiuso(sil), dCap = chiuso(capV);
    var nn = A ? [-.4472, .8944] : [.4472, .8944];
    function sp(w) { return w[0] * nn[0] + w[1] * nn[1]; }
    var area = 0, en = [];
    for (i = 0; i < n; i++) { var u1 = prof[i], u2 = prof[(i + 1) % n]; area += (u1[0] * u2[1] - u2[0] * u1[1]) / 61; }
    var sg = area > 0 ? 1 : -1, zb = Math.min.apply(null, prof.map(function (x) { return x[1]; }));
    function tv2(nrm, z) { var col = tinta(c, nrm, m), f = o.ao ? Math.max(0, 1 - (z - zb) / (o.aoH || 8)) : 0; return f > 0 ? mix(col, "#000000", o.ao * f * f) : col; }
    for (i = 0; i < n; i++) {
      var e1 = prof[i], e2 = prof[(i + 1) % n], dx = e2[0] - e1[0], dz = (e2[1] - e1[1]) / 61, l = Math.sqrt(dx * dx + dz * dz) || 1, mx = sg * dz / l, mz = -sg * dx / l;
      en.push(A ? [0, G * mx, mz] : [G * mx, 0, mz]);
    }
    var voci = [], vis = [], luMax = -2, kLuce = 0;
    for (i = 0; i < n; i++) {
      var ea = en[(i + n - 1) % n], eb = en[i], va = dot(ea, VISTA) > .001, vb = dot(eb, VISTA) > .001, s = sp(capV[i]);
      if (!va && !vb) continue;
      vis.push({ k: i, s: s });
      var zz = prof[i][1], nm = va && vb ? norma([ea[0] + eb[0], ea[1] + eb[1], ea[2] + eb[2]]) : (va ? ea : eb), lu = dot(nm, MEZZO);
      if (lu > luMax) { luMax = lu; kLuce = i; }
      if (va && vb && dot(ea, eb) < .8) { var prima = sp(capV[(i + n - 1) % n]) < s; voci.push({ s: s, c: [tv2(prima ? ea : eb, zz), tv2(prima ? eb : ea, zz)] }); }
      else voci.push({ s: s, c: [tv2(va && vb ? norma([ea[0] + eb[0], ea[1] + eb[1], ea[2] + eb[2]]) : (va ? ea : eb), zz)] });
    }
    voci.sort(function (x, y) { return x.s - y.s; }); vis.sort(function (x, y) { return x.s - y.s; });
    var smin = 1e9, smax = -1e9; sil.forEach(function (w) { var v = sp(w); if (v < smin) smin = v; if (v > smax) smax = v; });
    var st = []; voci.forEach(function (v) { v.c.forEach(function (cc) { st.push([f2(Math.max(0, Math.min(1, (v.s - smin) / (smax - smin || 1)))), cc]); }); });
    if (!st.length) st = [[0, c], [1, c]];
    var r = pth(dSil, nuova(st, nn[0] * smin, nn[1] * smin, nn[0] * smax, nn[1] * smax, true));
    var xs = prof.map(function (x) { return x[0]; }), zs = prof.map(function (x) { return x[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
    var H = {
      p3: p3, tv: tv, tn: tn, prof: prof, sil: sil, capV: capV, kLuce: kLuce,
      luccica: function (k, a, b) { var pp = this.lungo(kLuce, t0 + (t1 - t0) * (a || .06), t0 + (t1 - t0) * (b || .94)); return tratto(aperto(pp), "#ffffff", 1.3, op(k || .5)) + tratto(aperto(pp), "#ffffff", 3.2, op((k || .5) * .25)); },
      vis: vis.map(function (v) { return v.k; }),
      sez: function (t, filtro) { return vis.filter(function (v) { return !filtro || filtro(prof[v.k]); }).map(function (v) { return p3(prof[v.k], t); }); },
      lungo: function (k, ta, tb) { return [p3(prof[k], ta == null ? t0 : ta), p3(prof[k], tb == null ? t1 : tb)]; },
      vicinoA: function (x, z) { var bi = 0, bd = 1e9; prof.forEach(function (w, j) { var d = Math.abs(w[0] - x) + Math.abs(w[1] - z) / 61; if (d < bd) { bd = d; bi = j; } }); return bi; }
    };
    if (o.fascia) r += dentro(dSil, o.fascia(H));
    var ct = o.tappoCol || tinta(c, A ? [1, 0, 0] : [0, 1, 0], m);
    r += pth(dCap, nuova([[0, chiaro(ct, .07)], [1, scuro(ct, .1)]], 0, 0, 0, 1));
    if (o.tappo) {
      var T;
      if (A) T = { O: P(tv, G > 0 ? x1 : x0, z1), X: P(tv, G > 0 ? x0 : x1, z1), Y: P(tv, G > 0 ? x1 : x0, z0), W: (x1 - x0) * 61, H: z1 - z0, x: function (b) { return (G > 0 ? x1 - b : b - x0) * 61; } };
      else T = { O: P(G > 0 ? x0 : x1, tv, z1), X: P(G > 0 ? x1 : x0, tv, z1), Y: P(G > 0 ? x0 : x1, tv, z0), W: (x1 - x0) * 61, H: z1 - z0, x: function (a) { return (G > 0 ? a - x0 : x1 - a) * 61; } };
      T.y = function (z) { return z1 - z; }; T.capV = capV; T.prof = prof;
      T.su = function (cont) { return piano(T.O, T.X, T.Y, T.W, T.H, cont); };
      r += dentro(dCap, o.tappo(T));
    }
    r += pth(dCap, "none", "stroke='" + L + "' stroke-width='1.1' stroke-linejoin='round' opacity='.7'");
    return r + pth(dSil, "none", bordo(L, o.lw || 2.3));
  }
  function solco(H, x, z, t0, t1) {   // l'ombra morbida dove la seduta tocca lo schienale (solo da davanti)
    if (G < 0) return "";
    var pp = aperto(H.lungo(H.vicinoA(x, z), t0, t1));
    return tratto(pp, "#000000", 8, op(.09)) + tratto(pp, "#000000", 3.5, op(.12));
  }
  function cordone(d, c, w) { w = w || 1.5; return tratto(d, scuro(c, .42), w + .5, op(.85)) + tratto(d, chiaro(c, .32), w * .45, "opacity='.75' transform='translate(-.3 -.45)'"); }
  function trama(b, seme, n, c) {   // la trama della stoffa: puntini chiari e scuri, fitti (dentro i limiti b sullo schermo)
    var r = rnd(seme), s = "", i;
    for (i = 0; i < n; i++) s += cer(b[0] + r() * (b[2] - b[0]), b[1] + r() * (b[3] - b[1]), .3 + r() * .25, r() < .8 ? chiaro(c, .55) : scuro(c, .12), op(.13));
    return s;
  }
  // il capitonné (piatto, W × H): i bottoni in file sfalsate, le pieghe che li uniscono, i rombi gonfi
  function capitonne(W, H, ys, n, c) {
    var dx = W / n, s = "", rows = [], i, k;
    ys.forEach(function (y, k2) { var row = [], m = k2 % 2 ? n - 1 : n; for (i = 0; i < m; i++) row.push([(k2 % 2 ? dx : dx / 2) + i * dx, y]); rows.push(row); });
    var gp = nuovaR([[0, "#fff", .4], [.4, "#fff", .1], [.75, "#000", .04], [1, "#000", .24]], .4, .34, .66);
    for (k = 0; k < ys.length; k++) {
      var y = ys[k], su = k ? y - ys[k - 1] : y, giu = k < ys.length - 1 ? ys[k + 1] - y : H - y, off = k % 2 ? dx : dx / 2;
      for (i = -1; i < rows[k].length; i++) {
        var x = off + i * dx + dx / 2, t = [x, y - su], d = [x + dx / 2, y], b = [x, y + giu], l = [x - dx / 2, y];
        s += pth("M" + q(t) + " Q" + q(x + dx * .34, y - su * .38) + " " + q(d) + " Q" + q(x + dx * .3, y + giu * .4) + " " + q(b) + " Q" + q(x - dx * .3, y + giu * .4) + " " + q(l) + " Q" + q(x - dx * .34, y - su * .38) + " " + q(t) + " Z", gp);
      }
    }
    function piega(a, b) { return tratto(linea(a, b), scuro(c, .4), .8, op(.85)) + tratto(linea([a[0] + .25, a[1] + .55], [b[0] + .25, b[1] + .55]), chiaro(c, .5), .45, op(.7)); }
    for (k = 0; k < ys.length; k++) rows[k].forEach(function (bt) {
      var su = k ? ys[k - 1] : 0, giu = k < ys.length - 1 ? ys[k + 1] : H;
      if (!k) { s += piega(bt, [bt[0] - dx / 2, su]) + piega(bt, [bt[0] + dx / 2, su]); }
      s += piega(bt, [bt[0] - dx / 2, giu]) + piega(bt, [bt[0] + dx / 2, giu]);
    });
    for (k = 0; k < ys.length; k++) rows[k].forEach(function (bt) {
      s += ell(bt[0], bt[1] + .3, 2.8, 2.2, nuovaR([[0, "#000", .4], [1, "#000", 0]], .5, .5, .5)) + cer(bt[0], bt[1], 1.2, nuovaR([[0, chiaro(c, .5)], [.6, c], [1, scuro(c, .4)]], .35, .3, .8), bordo(scuro(c, .55), .35));
    });
    return s;
  }
  function chiodi(pp, r) {   // i chiodini d'ottone, uno accanto all'altro
    var g = rad("chd", [[0, "#fffbe0"], [.35, "#f1cf6e"], [.75, "#b5862a"], [1, "#6e4c10"]], .38, .32, .7);
    return pp.map(function (w) { return cer(w[0] + .3, w[1] + .45, r || .85, "#000", op(.35)) + cer(w[0], w[1], r || .85, g, "stroke='#5a3c0c' stroke-width='.3'"); }).join("");
  }

  // ---------- le gambe ----------
  // una gamba tonda e affusolata da T (in alto) a F (il piede), punti [a, b, z]; w0 e w1 = mezze larghezze sullo schermo
  function gambaTonda(T, F, w0, w1, stops, puntale, senzaPiede) {
    var t = P(T[0], T[1], T[2]), f = P(F[0], F[1], F[2]), dx = f[0] - t[0], dy = f[1] - t[1], l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
    if (nx > 0) { nx = -nx; ny = -ny; }
    var a = [t[0] + nx * w0, t[1] + ny * w0], b = [t[0] - nx * w0, t[1] - ny * w0], c = [f[0] - nx * w1, f[1] - ny * w1], d = [f[0] + nx * w1, f[1] + ny * w1];
    var s = poly([a, b, c, d], nuova(stops, a[0], a[1], b[0], b[1], true), bordo(L, 1.1));
    if (puntale) {
      var k = .3, pa = [a[0] + (d[0] - a[0]) * (1 - k), a[1] + (d[1] - a[1]) * (1 - k)], pb = [b[0] + (c[0] - b[0]) * (1 - k), b[1] + (c[1] - b[1]) * (1 - k)];
      s += poly([pa, pb, c, d], nuova(puntale, pa[0], pa[1], pb[0], pb[1], true), bordo(L, 1));
    }
    s += tratto(linea([t[0] + nx * w0 * .4, t[1] + ny * w0 * .4], [f[0] + nx * w1 * .4, f[1] + ny * w1 * .4]), "#ffffff", .7, op(.5));
    return s + (senzaPiede ? "" : ell(f[0], f[1], w1, w1 * .5, scuro(stops[stops.length - 1][1], .2), bordo(L, .8)));
  }
  function tubo(A, B, w, col, luce) {   // un tubo (metallo o legno tondo) da A a B, punti [a, b, z]
    var d = linea(P(A[0], A[1], A[2]), P(B[0], B[1], B[2]));
    return tratto(d, L, w + 2.2) + tratto(d, col, w) + tratto(d, luce || chiaro(col, .45), Math.max(.5, w * .32), "opacity='.75' transform='translate(-.35 -.45)'");
  }
  function angoli(ra, rb) { return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(function (g) { return [ra * g[0], rb * g[1]]; }).sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }); }

  // ---------- le ombre a terra (un po' spostate a destra: la luce viene da sinistra) ----------
  function aTerra(c) { return "<g transform='matrix(50 25 -50 25 0 0)'>" + c + "</g>"; }
  function ombraPianta(a0, a1, b0, b1, k, pad) {
    pad = pad == null ? .1 : pad;
    var cu = G * (a0 + a1) / 2 + .05, cv = G * (b0 + b1) / 2 - .01;
    return aTerra("<ellipse cx='" + f2(cu) + "' cy='" + f2(cv) + "' rx='" + f2((a1 - a0) / 2 + pad) + "' ry='" + f2((b1 - b0) / 2 + pad) + "' fill='" + rad("omp", [[0, "#000", .24], [.6, "#000", .16], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>");
  }
  function ombraSotto(a0, a1, b0, b1, k) {   // il buio sotto un mobile alzato sui piedini
    var u0 = Math.min(G * a0, G * a1), v0 = Math.min(G * b0, G * b1);
    return aTerra("<rect x='" + f2(u0 + .02) + "' y='" + f2(v0) + "' width='" + f2(Math.abs(a1 - a0)) + "' height='" + f2(Math.abs(b1 - b0)) + "' rx='" + f2(.06) + "' fill='" + rad("oms", [[0, "#000", .5], [.7, "#000", .35], [1, "#000", 0]], .5, .5, .55) + "' " + op(k || .3) + "/>");
  }

  // ---------- i pezzi di un mobile, dal più lontano al più vicino (box = [a0, a1, b0, b1, z0, z1]) ----------
  function inOrdine(l) {
    var n = l.length, fatto = [], out = "", k, i, j;
    function sov(x0, x1, y0, y1) { return x0 < y1 - 1e-6 && y0 < x1 - 1e-6; }
    function prima(A, B) {
      var a = A.box, b = B.box, sa = sov(a[0], a[1], b[0], b[1]), sb = sov(a[2], a[3], b[2], b[3]);
      if (sa && sb) return a[4] < b[4] - 1e-6 || (Math.abs(a[4] - b[4]) < 1e-6 && (A.ord || 0) < (B.ord || 0));
      if (sb && !sa) return G * (a[0] + a[1]) < G * (b[0] + b[1]);
      if (sa && !sb) return G * (a[2] + a[3]) < G * (b[2] + b[3]);
      return false;
    }
    for (k = 0; k < n; k++) {
      for (i = 0; i < n; i++) {
        if (fatto[i]) continue;
        for (j = 0; j < n; j++) if (j !== i && !fatto[j] && prima(l[j], l[i])) break;
        if (j === n) break;
      }
      if (i === n) for (i = 0; fatto[i]; i++);
      fatto[i] = true; out += l[i].s;
    }
    return out;
  }

  // ---------- il legno ----------
  function venature(W, H, c, seme, vert, k) {   // le venature su una faccia piatta (vert = che corrono in su)
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
  function venatureSopra(a0, a1, b0, b1, z, c, seme, k) {   // le venature sul piano di sopra, lungo a
    var r = rnd(seme), s = "", i, j, n = Math.max(3, Math.round((b1 - b0) / .032));
    k = k || 1;
    for (i = 0; i < n; i++) {
      var b = b0 + (i + .2 + r() * .6) * (b1 - b0) / n, ph = r() * 6, am = .0015 + r() * .004, d = "", sc = r() < .72;
      for (j = 0; j <= 12; j++) { var a = a0 + (a1 - a0) * j / 12; d += (j ? " L" : "M") + q(P(a, b + Math.sin(ph + j * .7) * am, z)); }
      s += tratto(d, sc ? scuro(c, .22 + r() * .1) : chiaro(c, .3), .3 + r() * .25, op((sc ? .22 + r() * .22 : .4) * k));
    }
    return s;
  }
  function legnoT(c) { var k = c.slice(1); return [lin("ws" + k, [[0, chiaro(c, .15)], [.6, chiaro(c, .03)], [1, scuro(c, .08)]], 0, 0, 1, 1), lin("wl" + k, [[0, chiaro(c, .06)], [1, scuro(c, .12)]], 0, 0, 0, 1), lin("wd" + k, [[0, scuro(c, .3)], [1, scuro(c, .42)]], 0, 0, 0, 1)]; }
  function bugna(x, y, w, h, c, b) {   // il pannello in rilievo con le quattro smussature (luce in alto a sinistra)
    b = b || 2.2;
    var x1 = x + w, y1 = y + h;
    return poly([[x, y], [x1, y], [x1 - b, y + b], [x + b, y + b]], chiaro(c, .42)) + poly([[x, y], [x + b, y + b], [x + b, y1 - b], [x, y1]], chiaro(c, .22)) +
      poly([[x, y1], [x + b, y1 - b], [x1 - b, y1 - b], [x1, y1]], scuro(c, .24)) + poly([[x1, y], [x1, y1], [x1 - b, y1 - b], [x1 - b, y + b]], scuro(c, .13)) +
      rett(x + b, y + b, w - 2 * b, h - 2 * b, 0, lin("bg" + c.slice(1), [[0, chiaro(c, .14)], [1, scuro(c, .05)]], 0, 0, 1, 1)) +
      rett(x, y, w, h, 0, "none", "stroke='" + scuro(c, .45) + "' stroke-width='.7' opacity='.8'");
  }
  function bugnaLegno(x, y, w, h, c, b, seme, vert) {
    return bugna(x, y, w, h, c, b) + dentro("M" + q(x + b, y + b) + " H" + f1(x + w - b) + " V" + f1(y + h - b) + " H" + f1(x + b) + " Z", "<g transform='translate(" + f1(x) + " " + f1(y) + ")'>" + venature(w, h, c, seme, vert, 1) + "</g>");
  }
  function lacca(W, H, k) {   // il riflesso lucido: due strisce in diagonale
    return dentro("M0,0 H" + f1(W) + " V" + f1(H) + " H0 Z", poly([[W * .12, 0], [W * .34, 0], [W * .04, H], [-W * .18, H]], "#ffffff", op(.2 * (k || 1))) + poly([[W * .42, 0], [W * .49, 0], [W * .19, H], [W * .12, H]], "#ffffff", op(.14 * (k || 1))));
  }
  function laccaSopra(pp, k) {
    var b = limiti(pp), w = b[2] - b[0];
    return dentro(chiuso(pp), poly([[b[0] + w * .3, b[1]], [b[0] + w * .44, b[1]], [b[0] + w * .2, b[3]], [b[0] + w * .06, b[3]]], "#ffffff", op(.26 * (k || 1))) +
      poly([[b[0] + w * .5, b[1]], [b[0] + w * .54, b[1]], [b[0] + w * .3, b[3]], [b[0] + w * .26, b[3]]], "#ffffff", op(.18 * (k || 1))));
  }
  function pomoloOro(x, y, r) {
    return cer(x, y, r * 1.65, lin("ro", ORO, 0, 0, 1, 1), bordo(L, .6)) + cer(x + .3, y + .5, r, "#6b4a0e", op(.45)) +
      cer(x, y, r, rad("po", [[0, "#fffbe6"], [.45, "#f5cf5a"], [1, "#9a6c12"]], .35, .3, .75), bordo(L, .7)) + cer(x - r * .35, y - r * .38, r * .32, "#ffffff", op(.9));
  }
  function retro(c) {   // la schiena di un mobile: un pannello liscio con le viti
    return function (W, H) { return rett(2.5, 2.5, W - 5, H - 5, 1, "none", "stroke='" + scuro(c, .22) + "' stroke-width='.9' opacity='.8'") + [[4.5, 4.5], [W - 4.5, 4.5], [4.5, H - 4.5], [W - 4.5, H - 4.5]].map(function (v) { return cer(v[0], v[1], .8, scuro(c, .35)); }).join(""); };
  }
  function facciaLegno(c, seme, vert) { return function (W, H) { return venature(W, H, c, seme, vert, .9); }; }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  function scelto(lista, o) { var id = o && o.col, i; for (i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return lista[0]; }

  // =========================================================
  //  POLTRONA A SACCO: un sacco solo di stoffa lucida, a spicchi cuciti: la seduta che scende davanti, i fianchi e lo schienale
  //  che salgono attorno, le pieghe tirate, la maniglia in cima e l'etichetta cucita nella cucitura
  // =========================================================
  var COL_SACCO = [{ id: "blu", nome: "blu", c: "#4c6ef5" }, { id: "rosso", nome: "rosso", c: "#f03e3e" }, { id: "lime", nome: "verde lime", c: "#82c91e" },
    { id: "arancio", nome: "arancione", c: "#fd7e14" }, { id: "nero", nome: "nero", c: "#343a40" }, { id: "rosa", nome: "rosa", c: "#f783ac" }];
  // il sacco a fette, dal basso: [z, centro b, mezza larghezza, mezza profondità davanti, dietro, pendenza della stoffa (90 = dritta, 0 = guarda in su)]
  var SACCO = [[0, -.04, .3, .25, .27, 125], [2.5, -.045, .385, .335, .345, 105], [7, -.05, .42, .36, .365, 92], [13, -.055, .425, .35, .37, 86], [18.5, -.065, .405, .315, .36, 76],
    [23, -.08, .37, .25, .35, 62], [27, -.11, .33, .17, .33, 50], [31, -.15, .31, .11, .305, 55], [34.5, -.18, .28, .08, .27, 48], [37.2, -.21, .245, .06, .225, 36],
    [39.4, -.235, .18, .04, .165, 20], [40.7, -.25, .1, .022, .09, 8], [41.2, -.255, .03, .008, .03, 2]];
  function sacLv(k) { var i = Math.max(0, Math.min(SACCO.length - 2, Math.floor(k))), t = Math.max(0, Math.min(1, k - i)), A = SACCO[i], B = SACCO[i + 1]; return A.map(function (v, j) { return v + (B[j] - v) * t; }); }
  function sacPt(l, t) { var cs = Math.cos(t), sn = Math.sin(t), x = (cs < 0 ? -1 : 1) * Math.pow(Math.abs(cs), .93), y = (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), .93); return [x * l[2], l[1] + y * (y > 0 ? l[3] : l[4]), l[0]]; }
  function sacVisto(l, t) { var f = l[5] * Math.PI / 180; return .615 * G * (Math.cos(t) + Math.sin(t)) * Math.sin(f) + .504 * Math.cos(f); }   // > 0: la stoffa lì guarda verso chi guarda
  function sacAnello(l, t0, t1, n) { var o = [], j; n = n || 64; for (j = 0; j < n; j++) { var w = sacPt(l, t0 == null ? j / n * 6.2832 : t0 + (t1 - t0) * j / (n - 1)); o.push(P(w[0], w[1], w[2])); } return o; }
  function piega(a, b, curva, c, k) {   // una piega della stoffa: il solco scuro e il filo di luce accanto
    var m = tra(a, b, .5); m = [m[0] + curva[0], m[1] + curva[1]];
    return tratto("M" + q(a) + " Q" + q(m) + " " + q(b), scuro(c, .32), 1.1, op(.55 * (k || 1))) + tratto("M" + q(a[0] - 1, a[1] + .6) + " Q" + q(m[0] - 1, m[1] + .6) + " " + q(b[0] - 1, b[1] + .6), chiaro(c, .42), .6, op(.45 * (k || 1)));
  }
  def("poltrona_sacco", { tipo: "piedi", nome: "Poltrona a sacco", fp: [1, 1], box: [-52, -57, 58, 30], dietro: true, seduta: 25, prezzo: 800, reparto: "divani", colori: COL_SACCO }, function (o) {
    var c = scelto(COL_SACCO, o).c, nero = c === "#343a40", i;
    var s = ombraPianta(-.44, .44, -.48, .34, 1.15, .07) + aTerra("<ellipse cx='" + f2(G * .03) + "' cy='" + f2(-G * .07) + "' rx='.37' ry='.36' fill='" + rad("osa", [[0, "#000", .5], [.7, "#000", .3], [1, "#000", 0]], .5, .5, .5) + "' " + op(.4) + "/>");
    var an = SACCO.map(function (l) { return sacAnello(l); }), fette = [], bb = limiti([].concat.apply([], an)), W0 = bb[2] - bb[0], H0 = bb[3] - bb[1];
    for (i = 0; i < an.length - 1; i++) fette.push(chiuso(inviluppo(an[i].concat(an[i + 1]))));
    var luce = sfum("radialGradient", "sl" + (++nC), [[0, chiaro(c, nero ? .45 : .36)], [.42, chiaro(c, nero ? .12 : .06)], [.8, scuro(c, .14)], [1, scuro(c, .34)]],
      "cx='" + f1(bb[0] + W0 * .34) + "' cy='" + f1(bb[1] + H0 * .26) + "' r='" + f1(Math.max(W0, H0) * .82) + "' gradientUnits='userSpaceOnUse'");
    // il contorno di fuori: tutte le fette col bordo spesso, poi i riempimenti ne coprono la metà di dentro
    s += fette.map(function (d) { return pth(d, "none", bordo(L, 4.6)); }).join("");
    fette.forEach(function (d) { s += pth(d, luce); });
    // sopra a tutto: le cuciture degli spicchi, le pieghe, il lucido, il buio in basso
    var det = "";
    [15, 75, 135, 195, 255, 315].forEach(function (gr) {
      var t = gr * Math.PI / 180, pezzi = [], cur = [], kk;
      for (kk = 0; kk <= SACCO.length - 1.001; kk += .25) {
        var l = sacLv(kk), w = sacPt(l, t);
        if (sacVisto(l, t) > .03) cur.push(P(w[0], w[1], w[2])); else if (cur.length) { pezzi.push(cur); cur = []; }
      }
      if (cur.length) pezzi.push(cur);
      pezzi.forEach(function (pp) {
        if (pp.length < 2) return;
        var d = liscio(pp);
        det += tratto(d, scuro(c, .5), 1.6, op(.7)) + tratto(d, chiaro(c, .45), .6, "opacity='.6' transform='translate(-.8 -.3)'") + tratto(d, chiaro(c, .6), .45, "stroke-dasharray='1.1 1.3' opacity='.5' transform='translate(1 .3)'");
      });
    });
    if (G > 0) {
      // la conca dove ti siedi, sul davanti che pende all'indietro: buia dietro al bordo, il bordo che prende la luce, le pieghe tirate attorno
      var conca = function (t) { var u = Math.sin(t); return P(.22 * Math.cos(t), .05 + .105 * u, 27.2 - 4 * u); }, cc = [], k;
      for (k = 0; k < 48; k++) cc.push(conca(k / 48 * 6.2832));
      det += pth(liscio(cc, true), nuovaR([[0, scuro(c, .36), .82], [.55, scuro(c, .25), .52], [1, scuro(c, .1), 0]], .5, .66, .56));
      var lab = []; for (k = 0; k <= 20; k++) lab.push(conca(.45 + k / 20 * (Math.PI - .9)));
      det += tratto(liscio(sposta(lab, 0, 1.6)), chiaro(c, .55), 2.3, op(.5)) + tratto(liscio(sposta(lab, 0, .2)), scuro(c, .35), .9, op(.4));
      [[.75, [2, -1]], [1.25, [-2, -1]], [1.9, [2, -1]], [2.4, [-2, -1]]].forEach(function (g) {   // giù per il davanti
        var b2 = sacPt(sacLv(2.3), g[0] + (g[0] < 1.57 ? -.14 : .14));
        det += piega(sposta([conca(g[0])], 0, 1.4)[0], P(b2[0], b2[1], b2[2]), g[1], c);
      });
      det += piega(conca(3.55), P(-.15, -.22, 36.5), [-2.2, 0], c, .85) + piega(conca(5.9), P(.16, -.23, 36.5), [2.2, 0], c, .85);   // su per lo schienale
    } else {
      det += piega(P(-.14, -.46, 10), P(-.11, -.44, 30), [2, 0], c, .8) + piega(P(.16, -.46, 10), P(.13, -.44, 30), [-2, 0], c, .8);
    }
    det += "<g transform='translate(" + f1(bb[0] + W0 * .34) + " " + f1(bb[1] + H0 * .17) + ") rotate(-24)'>" + ell(0, 0, W0 * .12, H0 * .07, "#ffffff", op(nero ? .22 : .3)) + ell(-1.2, -.4, W0 * .045, H0 * .026, "#ffffff", op(.6)) + "</g>";
    det += "<g transform='translate(" + f1(bb[0] + W0 * .08) + " " + f1(bb[1] + H0 * .62) + ") rotate(10)'>" + ell(0, 0, W0 * .025, H0 * .14, "#ffffff", op(.2)) + "</g>";
    det += rett(bb[0] - 2, bb[3] - 12, W0 + 4, 13, 0, nuova([[0, "#000", 0], [1, "#000", .3]], 0, 0, 0, 1));
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'>" + fette.map(function (d) { return "<path d='" + d + "'/>"; }).join("") + "</clipPath>");
    s += "<g clip-path='url(#" + id + ")'>" + det + "</g>";
    // l'etichetta bianca, cucita nella cucitura di fianco
    var lt = sacPt(sacLv(1.1), Math.PI * .75), pe = P(lt[0], lt[1], lt[2]);
    s += "<g transform='translate(" + f1(pe[0] - 4) + " " + f1(pe[1]) + ") rotate(-12)'>" + rett(-.6, -2.6, 5.4, 5.6, .8, "#fdfcf7", bordo(L, .7)) + rett(.2, -1.4, 3.8, 1, 0, "#e03131") + rett(.2, .6, 2.8, .55, 0, "#adb5bd") + rett(.2, 1.7, 2, .55, 0, "#adb5bd") + "</g>";
    // la maniglia in cima, sulla schiena
    var m0 = P(-.075, -.33, 38.6), m1 = P(.075, -.33, 38.6), dM = "M" + q(m0) + " C" + q(m0[0] - .5, m0[1] - 7.5) + " " + q(m1[0] + .5, m1[1] - 7.5) + " " + q(m1);
    s += tratto(dM, L, 4.6) + tratto(dM, scuro(c, nero ? 0 : .12), 2.8) + tratto(dM, chiaro(c, .4), .8, "opacity='.7' transform='translate(-.4 -.5)'");
    [m0, m1].forEach(function (m) { s += rett(m[0] - 2.2, m[1] - 1.2, 4.4, 2.6, .6, scuro(c, .08), bordo(L, .8)) + tratto("M" + q(m[0] - 1.4, m[1] - .4) + " L" + q(m[0] + 1.4, m[1] - .4), chiaro(c, .5), .4, "stroke-dasharray='.6 .6'"); });
    return s;
  });

  // =========================================================
  //  POUF DI VELLUTO: tondo a spicchi gonfi, il velluto che brilla dove gira, il cordoncino sul bordo,
  //  sopra le pieghe arricciate attorno al bottone; la base d'ottone
  // =========================================================
  var COL_POUF = [{ id: "fucsia", nome: "fucsia", c: "#c2255c" }, { id: "smeraldo", nome: "smeraldo", c: "#0ca678" }, { id: "oro", nome: "oro", c: "#f59f00" }, { id: "blu", nome: "blu", c: "#3b5bdb" }, { id: "grigio", nome: "grigio", c: "#868e96" }];
  def("pouf", { tipo: "piedi", nome: "Pouf di velluto", fp: [1, 1], box: [-33, -40, 38, 20], seduta: 27, prezzo: 500, reparto: "divani", colori: COL_POUF }, function (o) {
    var c = scelto(COL_POUF, o).c, R = .262, Z0 = 5.2, Z1 = 26.4, N = 12, i, s = ombraPianta(-.3, .3, -.3, .3, 1, .03);
    var Fb = forma(0, 0, .215, .215, .215, 2), F = forma(0, 0, R, R, R, 2), A0 = DAVANTI();
    // la base d'ottone: un anello basso e lucido, col filo di luce
    s += corpo([giro(Fb, 0, .95, 48), giro(Fb, Z0 + .8, 1, 48)], OTTONE, 1.3) + tratto(aperto(arco(Fb, 2.2, A0 + .35, A0 + Math.PI - .35, 30, .97)), "#fffbe6", .8, op(.8)) +
      tratto(aperto(arco(Fb, .9, A0 + .2, A0 + Math.PI - .2, 30, .96)), "#5a3c0c", .5, op(.6));
    // gli spicchi gonfi tutto attorno: ognuno col suo colore (il velluto si schiarisce dove gira)
    var sp = [];
    for (i = 0; i < N; i++) {
      var t0 = i / N * 6.2832, t1 = (i + 1) / N * 6.2832, tm = (t0 + t1) / 2, nv = [G * Math.cos(tm), G * Math.sin(tm), 0], vv = dot(nv, VISTA);
      if (vv < -.3) continue;
      var pp = [], su = [], j, nn = 8;
      for (j = 0; j <= nn; j++) { var t = t0 + (t1 - t0) * j / nn, k = 1 + .05 * Math.sin(Math.PI * j / nn); pp.push(P(Math.cos(t) * R * k, Math.sin(t) * R * k, Z0)); su.push(P(Math.cos(t) * R * k, Math.sin(t) * R * k, Z1)); }
      var col = tinta(c, nv, VELLUTO), e0 = P(Math.cos(t0) * R, Math.sin(t0) * R, (Z0 + Z1) / 2), e1 = P(Math.cos(t1) * R, Math.sin(t1) * R, (Z0 + Z1) / 2);
      var sx = e0[0] < e1[0] ? [e0, e1] : [e1, e0];
      sp.push([vv, pth(chiuso(pp.concat(su.slice().reverse())), nuova([[0, scuro(col, .26)], [.22, chiaro(col, .12)], [.5, col], [.8, scuro(col, .1)], [1, scuro(col, .3)]], sx[0][0], sx[0][1], sx[1][0], sx[1][1], true)) +
        tratto(linea(P(Math.cos(t0) * R, Math.sin(t0) * R, Z0 + .8), P(Math.cos(t0) * R, Math.sin(t0) * R, Z1 - .6)), scuro(c, .5), .8, op(.6))]);
    }
    var sil = sagoma([giro(F, Z0, 1.05, 72), giro(F, Z1, 1.05, 72)]), bb = limiti(sil);
    s += ordina(sp) + dentro(chiuso(sil), rett(bb[0], bb[3] - 8, bb[2] - bb[0], 9, 0, nuova([[0, "#000", 0], [1, "#000", .25]], 0, 0, 0, 1)));   // più buio in basso
    // sopra: il velluto arricciato attorno al bottone, a spicchi gonfi
    var top = giro(F, Z1, 1.03, 72), dT = chiuso(top), cT = tinta(c, [0, 0, 1], VELLUTO), cen = P(0, 0, Z1 + .2), pl = "";
    s += pth(dT, nuovaR([[0, chiaro(cT, .3)], [.55, cT], [1, scuro(cT, .14)]], .38, .34, .72));
    for (i = 0; i < 10; i++) {
      var ta = i / 10 * 6.2832, tb = (i + 1) / 10 * 6.2832, e = P(Math.cos(ta) * R * 1.02, Math.sin(ta) * R * 1.02, Z1), m = P(Math.cos(ta + .32) * R * .5, Math.sin(ta + .32) * R * .5, Z1 + 1);
      var cg = P(Math.cos((ta + tb) / 2 + .12) * R * .6, Math.sin((ta + tb) / 2 + .12) * R * .6, Z1 + 1.2), lu = Math.max(0, Math.min(1, (cen[0] - cg[0]) * .04 + (cen[1] - cg[1]) * .12 + .45));
      pl += pth("M" + q(cen) + " Q" + q(m) + " " + q(e) + " L" + q(P(Math.cos(ta + .16) * R * 1.02, Math.sin(ta + .16) * R * 1.02, Z1)) + " Q" + q(P(Math.cos(ta + .42) * R * .5, Math.sin(ta + .42) * R * .5, Z1 + 1)) + " " + q(cen) + " Z", scuro(cT, .35), op(.32)) +   // l'ombra nella piega
        ell(cg[0], cg[1], 4, 1.9, "#ffffff", op(f2(.05 + .2 * lu)) + " " + gira(cg[0], cg[1], -12)) +
        tratto("M" + q(cen) + " Q" + q(m) + " " + q(e), scuro(cT, .45), 1, op(.7)) + tratto("M" + q(cen[0] - .4, cen[1] - .5) + " Q" + q(m[0] - .4, m[1] - .5) + " " + q(e[0] - .4, e[1] - .5), chiaro(cT, .5), .55, op(.6));
    }
    s += dentro(dT, pl);
    s += ell(cen[0], cen[1] + .5, 5, 2.9, nuovaR([[0, "#000", .5], [1, "#000", 0]], .5, .5, .5)) + cer(cen[0], cen[1] - .1, 2.1, nuovaR([[0, chiaro(c, .55)], [.55, c], [1, scuro(c, .45)]], .35, .3, .8), bordo(scuro(c, .6), .5)) + cer(cen[0] - .7, cen[1] - .8, .6, "#ffffff", op(.8));
    // i cordoncini: sul bordo di sopra (tutto attorno) e in basso (davanti)
    s += cordone(chiuso(giro(F, Z1 - .1, 1.035, 72)), c, 1.9) + cordone(aperto(arco(F, Z0 + .5, A0, A0 + Math.PI, 36, 1.045)), c, 1.4);
    return s + pth(chiuso(sil), "none", bordo(L, 2.2));
  });

  // =========================================================
  //  SEDIA A DONDOLO: legno di noce caldo, i pattini curvi col ricciolo davanti, lo schienale a colonnine tornite
  //  sotto la traversa ad arco dipinta a fiorellini, i braccioli col ricciolo, il cuscino rosa a pois coi fiocchi
  // =========================================================
  def("dondolo", { tipo: "piedi", nome: "Sedia a dondolo", fp: [1, 1], box: [-43, -85, 49, 25], dietro: true, seduta: 30, prezzo: 1200, reparto: "sedie" }, function () {
    var c = "#a0652b", W3 = legnoT(c), GL = [[0, chiaro(c, .4)], [.45, c], [1, scuro(c, .45)]], ROSA = "#e64980", AR = .255, pz = [];
    var s = ombraPianta(-.33, .33, -.5, .5, 1, .02);
    function zPat(b) { return 19 * b * b + Math.max(0, b - .33) * 36; }   // il fondo del pattino: curvo, col ricciolo davanti
    function stB(z) { return -.17 - .15 * (z - 4) / 60; }   // dove sta il montante dello schienale a quell'altezza (inclinato all'indietro)
    function pattino(a) {
      var n = 34, ta = .018, hh = 3.6, i, vis = [], fon = [], lon = [];
      for (i = 0; i <= n; i++) { var b = .445 - .925 * i / n, z0 = zPat(b); vis.push(P(a + G * ta, b, z0 + hh)); fon.push(P(a + G * ta, b, z0)); lon.push(P(a - G * ta, b, z0 + hh)); }
      var r = pth(chiuso(vis.concat(fon.slice().reverse())), nuova([[0, scuro(c, .14)], [1, scuro(c, .42)]], 0, 0, 0, 1)) + pth(chiuso(vis.concat(lon.slice().reverse())), chiaro(c, .2));
      r += tratto(liscio(sposta(vis, .2, .9)), "#ffffff", .7, op(.35)) + tratto(liscio(vis), L, .8, op(.75));
      return r + pth(chiuso(lon.concat(fon.slice().reverse())), "none", bordo(L, 1.7));
    }
    [-AR, AR].forEach(function (a) { pz.push({ box: [a - .018, a + .018, -.48, .445, 0, 8], s: pattino(a) }); });
    // le gambe davanti (sopra la seduta diventano le colonnine tornite che reggono i braccioli) e i montanti dello schienale
    [-AR, AR].forEach(function (a) {
      var zf = zPat(.19) + 3.4, m1 = [a, .19, 33.4];
      pz.push({ box: [a - .02, a + .02, .17, .21, zf, 22.4], s: gambaTonda([a, .19, 22.6], [a, .19, zf], 1.9, 1.8, GL) });
      pz.push({ box: [a - .02, a + .02, .17, .21, 26, 40], s: gambaTonda([a, .19, 39.8], m1, 1.25, 1.95, GL, null, true) + gambaTonda(m1, [a, .19, 26], 1.95, 1.55, GL, null, true) +
        (function () { var m = P(m1[0], m1[1], m1[2]); return ell(m[0], m[1], 2.3, 1.05, chiaro(c, .1), bordo(L, .7)); })() });
      var zb = zPat(stB(4)) + 3.4, top = [a, stB(63), 63];
      var pom = forma(a, stB(64.5), .022, .022, .022);
      pz.push({ box: [a - .02, a + .02, stB(66) - .01, -.231, zb, 67], s: gambaTonda(top, [a, stB(zb), zb], 2, 2.1, GL) +
        corpo([giro(pom, 62.6, .8, 18), giro(pom, 64.4, 1.15, 18), giro(pom, 66.4, .55, 18)], GL, 1.1) });   // il pomolo tornito in cima
    });
    // la seduta di legno
    pz.push({ box: [-.275, .275, -.23, .25, 22, 26], s: blocco(-.275, .275, -.23, .25, 22.4, 26, W3, { davanti: facciaLegno(c, 911), dietro: facciaLegno(c, 912), fianco: facciaLegno(c, 913), sopra: function (A, B, C, D) { return dentro(chiuso([A, B, C, D]), venatureSopra(-.275, .275, -.23, .25, 26, c, 914)); } }, 1.8) });
    // il cuscino rosa a pois bianchi, col cordoncino (sta tra le gambe)
    var cu = tondo(-.205, .245, 26, 29.4, .055, 1.3, .03);
    pz.push({ box: [-.232, .232, -.205, .245, 26, 30.7], s: estruso("a", cu, -.232, .232, ROSA, { mat: STOFFA, ao: .22, aoH: 4, fascia: function (H) {
      var k = H.vicinoA(.245 - .02, 29.4 - 1.3), r = trama(limiti(H.sil), 921, 90, ROSA), pois = "", x, y, rr = rnd(922);
      for (y = 3; y < 28; y += 5.4) for (x = (y % 10.8 < 5 ? 2.5 : 5.2); x < 29; x += 5.4) pois += ell(x + (rr() - .5), y + (rr() - .5), 1.05, 1.05, "#ffffff", op(.85));
      r += piano(P(-.232, -.2, 30.3), P(.232, -.2, 30.3), P(-.232, .24, 30.3), 28.3, 26.8, pois);
      return r + cordone(aperto(H.lungo(k, -.228, .228)), ROSA, 1.1) + (G > 0 ? H.luccica(.25, .1, .9) : "");
    }, tappo: function (T) { var pois = "", y; for (y = 1.5; y < T.H; y += 3.2) pois += ell(T.W * .3 + (y % 6.4 < 3 ? 0 : 6), y, .9, .9, "#ffffff", op(.75)) + ell(T.W * .7 - (y % 6.4 < 3 ? 0 : 6), y + 1.4, .9, .9, "#ffffff", op(.75)); return T.su(pois); } }) });
    // i fiocchi che legano il cuscino ai montanti
    [-1, 1].forEach(function (sg) {
      var f0 = P(sg * .22, -.198, 29.3), ff = "";
      ff += pth("M" + q(f0) + " q-3.6,-2.6 -3.6,-.2 q0,2.2 3.6,.2 Z M" + q(f0) + " q3.6,-2.6 3.6,-.2 q0,2.2 -3.6,.2 Z", nuova([[0, chiaro(ROSA, .3)], [1, scuro(ROSA, .2)]], 0, 0, 1, 1), bordo(L, .7)) +
        tratto("M" + q(f0) + " q-1.2,2.6 -2.4,4.6 M" + q(f0) + " q1,2.6 2.2,4.4", L, 1.9) + tratto("M" + q(f0) + " q-1.2,2.6 -2.4,4.6 M" + q(f0) + " q1,2.6 2.2,4.4", ROSA, 1) + cer(f0[0], f0[1], 1, scuro(ROSA, .15), bordo(L, .6));
      pz.push({ box: [sg * .22 - .01, sg * .22 + .01, -.22, -.21, 29, 31], s: ff });
    });
    // le colonnine tornite dello schienale
    [-.16, -.08, 0, .08, .16].forEach(function (a) {
      var F0 = [a, stB(26.5) + .012, 26.5], T0 = [a, stB(55) + .012, 55], M0 = [a, stB(37) + .012, 37];
      pz.push({ box: [a - .012, a + .012, stB(55) - .002, -.212, 26.2, 55], s: gambaTonda(T0, M0, .95, 1.55, GL, null, true) + gambaTonda(M0, F0, 1.55, 1.05, GL, null, true) + (function () { var m = P(M0[0], M0[1], M0[2]); return ell(m[0], m[1], 1.9, .9, chiaro(c, .1), bordo(L, .7)); })() });
    });
    // la traversa in cima, ad arco, dipinta a fiorellini
    var zt = function (a) { return 60.5 + 3.6 * Math.pow(Math.cos(Math.min(1, Math.abs(a) / (AR - .01)) * Math.PI / 2), .8); };
    pz.push({ box: [-AR + .02, AR - .02, stB(60) - .018, stB(60) + .014, 53.5, 64.2], s: lastra(-AR + .02, AR - .02, stB(59) - .016, stB(59) + .016, 53.5, zt, W3, {
      davanti: function (W, H, pr) {
        var r = venature(W, H, c, 931, false, .8) + tratto("M" + pr.map(function (x) { return q(x[0], x[1] + 2.2); }).join(" L"), scuro(c, .4), .6, op(.7)) + rett(0, H - 2.4, W, .6, 0, scuro(c, .4), op(.6)), k;
        var cx = W / 2, cy = H * .5;   // la ghirlanda dipinta: un fiore rosa in mezzo, le foglioline e i fiorellini ai lati
        for (k = -1; k <= 1; k += 2) r += tratto("M" + q(cx, cy) + " Q" + q(cx + k * 6, cy - 3) + " " + q(cx + k * 12, cy - .5) + " T" + q(cx + k * 19, cy - 1.5), "#2f7d32", .7) +
          [[5, -1.6, 30], [9, -2.4, -20], [13.5, -.4, 35], [16.5, -1.8, -25]].map(function (f) { return ell(cx + k * f[0], cy + f[1], 1.5, .7, "#5aa13c", gira(cx + k * f[0], cy + f[1], k * f[2])); }).join("") +
          [[11.2, -1.4], [18.6, -1.8]].map(function (f) { return cer(cx + k * f[0], cy + f[1], 1.1, "#fff3bf", bordo("#c2255c", .3)) + cer(cx + k * f[0], cy + f[1], .4, "#f59f00"); }).join("");
        for (k = 0; k < 5; k++) { var an = k / 5 * 6.2832 - 1.57; r += ell(cx + Math.cos(an) * 1.6, cy + Math.sin(an) * 1.6, 1.3, .9, ROSA, gira(cx + Math.cos(an) * 1.6, cy + Math.sin(an) * 1.6, an * 57.3)); }
        return r + cer(cx, cy, .9, "#ffd43b") + lacca(W, H, .7);
      },
      dietro: function (W, H, pr) { return venature(W, H, c, 932, false, .8) + tratto("M" + pr.map(function (x) { return q(x[0], x[1] + 2.2); }).join(" L"), scuro(c, .4), .6, op(.6)); }
    }, 1.9) });
    // i braccioli col ricciolo davanti, sopra le gambe
    [-1, 1].forEach(function (sg) {
      var a0 = sg * AR - .036, a1 = sg * AR + .036;
      pz.push({ box: [a0, a1, stB(41) - .01, .285, 39.4, 42.6], s: estruso("b", tondo(a0, a1, 39.6, 42.2, .016, .35, .008), stB(41) - .01, .285, c, { mat: LEGNO, fascia: function (H) {
        return H.vis.filter(function (k, j) { return j % 2; }).map(function (k) { return tratto(aperto(H.lungo(k)), scuro(c, .3), .35, op(.5)); }).join("") + (G > 0 ? H.luccica(.35, .05, .95) : "");
      }, tappo: function (T) { return T.su(cer(T.W / 2, T.H * .5, T.H * .32, "none", "stroke='" + scuro(c, .45) + "' stroke-width='.5'") + cer(T.W / 2, T.H * .5, T.H * .12, scuro(c, .35))); } }) });
    });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  PANCA IMBOTTITA: il cuscino color crema col capitonné, il cordoncino e i chiodini d'ottone,
  //  il telaio di noce, le gambe tornite coi puntali d'ottone e la traversa ad H
  // =========================================================
  def("panca", { tipo: "piedi", nome: "Panca imbottita", fp: [2, 1], box: [-64, -61, 70, 36], seduta: 29, piano: 29, prezzo: 650, reparto: "sedie" }, function () {
    var c = "#f1e3c2", LG = "#8b5a2b", LS = "#6b4220", GL = [[0, chiaro(LS, .4)], [.45, LS], [1, scuro(LS, .45)]], pz = [];
    var s = ombraPianta(-.92, .92, -.27, .27, 1, .05) + ombraSotto(-.82, .82, -.18, .18, .32);
    function gamba(a, b) {   // la gamba tornita: il puntale d'ottone, la pancia, il collo, il dado in cima
      var F = forma(a, b, .03, .03, .03, 2), lv = [[2.2, .72], [4.6, 1.05], [7, .7], [9.4, .62], [11.8, .95], [14.2, .95]], r = "", k;
      r += corpo([giro(F, 0, .62, 20), giro(F, 2.4, .7, 20)], OTTONE, 1);
      for (k = 0; k < lv.length - 1; k++) r += corpo([giro(F, lv[k][0], lv[k][1], 20), giro(F, lv[k + 1][0], lv[k + 1][1], 20)], GL, 1.1);
      return r;
    }
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (g) { var a = .79 * g[0], b = .165 * g[1]; pz.push({ box: [a - .032, a + .032, b - .032, b + .032, 0, 14.2], s: gamba(a, b) }); });
    pz.push({ box: [-.765, .765, -.013, .013, 5.5, 8], s: blocco(-.765, .765, -.013, .013, 5.5, 8, legnoT(LS), null, 1.2) });
    [-1, 1].forEach(function (g) { var a = .79 * g; pz.push({ box: [a - .013, a + .013, -.133, .133, 5.5, 8], s: blocco(a - .013, a + .013, -.133, .133, 5.5, 8, legnoT(LS), null, 1.2) }); });
    // il telaio di noce, con la modanatura
    function fasciaT(seme) { return function (W, H) { return venature(W, H, LG, seme, false, .9) + rett(0, 1.1, W, .5, 0, chiaro(LG, .45), op(.55)) + rett(0, H - 1.7, W, .7, 0, scuro(LG, .45), op(.55)); }; }
    pz.push({ box: [-.835, .835, -.205, .205, 13.8, 18.6], s: blocco(-.835, .835, -.205, .205, 13.8, 18.6, legnoT(LG), { davanti: fasciaT(941), dietro: fasciaT(942), fianco: fasciaT(943) }, 1.9) });
    // il cuscino: crema, col capitonné sopra, il cordoncino e i chiodini
    var cu = tondo(-.228, .228, 18.6, 27.6, .05, 1.5, .025);
    pz.push({ box: [-.86, .86, -.228, .228, 18.6, 29.1], s: (function () {
      var r = estruso("a", cu, -.86, .86, c, { mat: STOFFA, ao: .2, aoH: 5, fascia: function (H) {
        var f = trama(limiti(H.sil), 951, 380, c);
        f += piano(P(-.835, -.205, 28.7), P(.835, -.205, 28.7), P(-.835, .205, 28.7), 101.9, 25, capitonne(101.9, 25, [8.3, 16.7], 9, c));
        var k = H.vicinoA(.228 - .02, 27.6 - 1.2), ch = [], a;
        f += cordone(aperto(H.lungo(k, -.85, .85)), c, 1.3) + cordone(aperto(H.lungo(H.vicinoA(.228, 19.7), -.85, .85)), c, 1.1);
        for (a = -.84; a <= .841; a += .035) ch.push(P(a, .229, 20.4));
        return f + chiodi(ch, .72) + H.luccica(.3, .08, .92);
      }, tappo: function (T) { return T.su(ell(T.W * .35, 3, T.W * .25, 1.6, "#ffffff", op(.2))); } });
      var ch2 = [], b; for (b = -.21; b <= .211; b += .035) ch2.push(P(.861, b, 20.4));
      var cap = cu.filter(function (w) { return w[1] > 25; }).map(function (w) { return P(.862, w[0], w[1]); });   // il cordoncino sul fianco (la panca è uguale da tutti e due i lati)
      return r + chiodi(ch2, .72) + cordone(aperto(cap), c, 1.2);
    })() });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  SGABELLO DI LEGNO: il sedile tondo di assi incollate, lucido, col bordo smussato;
  //  quattro gambe affusolate un po' aperte e i pioli in quadrato
  // =========================================================
  def("sgabello_legno", { tipo: "piedi", nome: "Sgabello di legno", fp: [1, 1], box: [-24, -42, 30, 15], seduta: 29, piano: 29, prezzo: 250, reparto: "sedie" }, function () {
    var c = "#c08a55", GL = [[0, chiaro(c, .42)], [.45, c], [1, scuro(c, .45)]], s = ombraPianta(-.21, .21, -.21, .21, 1, .03), parti = [];
    var GA = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(function (g) { return { g: g, T: [.088 * g[0], .088 * g[1], 26.3], F: [.152 * g[0], .152 * g[1], 0] }; });
    function suGamba(g, z) { var t = (g.T[2] - z) / (g.T[2] - g.F[2]); return [g.T[0] + (g.F[0] - g.T[0]) * t, g.T[1] + (g.F[1] - g.T[1]) * t, z]; }
    GA.forEach(function (g) { parti.push([vicino(g.g[0], g.g[1]) * .15, gambaTonda(g.T, g.F, 2.1, 1.55, GL)]); });
    [[0, 1], [1, 3], [3, 2], [2, 0]].forEach(function (pr) {   // i pioli
      var A = suGamba(GA[pr[0]], 9.5), B = suGamba(GA[pr[1]], 9.5);
      parti.push([vicino((A[0] + B[0]) / 2, (A[1] + B[1]) / 2), tubo(A, B, 1.7, c, chiaro(c, .5))]);
    });
    s += ordina(parti);
    // il sedile: il bordo smussato (con le fibre di testa), il piano lucido con le assi e le venature
    var FS = forma(0, 0, .185, .185, .185, 2), A0 = DAVANTI(), lv = [giro(FS, 25.6, .88, 64), giro(FS, 26.8, 1, 64), giro(FS, 29.2, 1, 64)], sil = sagoma(lv), bs = limiti(sil);
    s += pth(chiuso(sil), lin("sg", [[0, chiaro(c, .25)], [.35, c], [1, scuro(c, .42)]], bs[0], 0, bs[2], 0, true));
    var fib = "", rr = rnd(961), i;
    for (i = 0; i < 46; i++) { var t = A0 + .05 + i / 46 * (Math.PI - .1), w = P(Math.cos(t) * .185, Math.sin(t) * .185, 26.9), dz = .6 + rr() * .6; fib += tratto(linea([w[0], w[1] - dz], [w[0] + (rr() - .5) * .3, w[1] - 2.2]), scuro(c, .3), .3, op(.35)); }
    s += dentro(chiuso(sil), fib) + pth(chiuso(sil), "none", bordo(L, 1.9));
    var top = giro(FS, 29.2, 1, 64), dT = chiuso(top);
    s += pth(dT, lin("st", [[0, chiaro(c, .32)], [1, chiaro(c, .06)]], 0, 0, 1, 1)) + dentro(dT, venatureSopra(-.2, .2, -.2, .2, 29.2, c, 962, 1.1) +
      tratto(linea(P(-.2, -.062, 29.2), P(.2, -.062, 29.2)) + " " + linea(P(-.2, .062, 29.2), P(.2, .062, 29.2)), scuro(c, .4), .55, op(.6)) +
      tratto(linea(P(-.2, -.059, 29.2), P(.2, -.059, 29.2)) + " " + linea(P(-.2, .065, 29.2), P(.2, .065, 29.2)), chiaro(c, .4), .4, op(.5)) + laccaSopra(top, .9));
    s += pth(chiuso(giro(FS, 29.2, .88, 64)), "none", "stroke='" + chiaro(c, .45) + "' stroke-width='.6' opacity='.6'");   // il filo di luce sulla smussatura
    return s + pth(dT, "none", bordo(L, 1.4));
  });

  // =========================================================
  //  FUTON GIAPPONESE: la pedana bassa di legno coi tatami (le fasce di stoffa sui bordi), il materasso,
  //  il cuscino di grano saraceno, la trapunta a motivi giapponesi (onde, fiori di ciliegio o foglie di canapa)
  //  col colletto bianco in cima
  // =========================================================
  var COL_FUTON = [{ id: "blu", nome: "bianco e blu", c: "#4263eb", t: "#4263eb", l: "#f1f3f5" }, { id: "rosso", nome: "rosso", c: "#e03131", t: "#e03131", l: "#fff5f5" }, { id: "verde", nome: "verde tè", c: "#74b816", t: "#74b816", l: "#f4fce3" }];
  function tatami(W, H) {   // due tatami da 1 × 2 metri, con la cornice di legno attorno (W, H = 196)
    var s = rett(0, 0, W, H, 0, "#8a6038"), x0s = [3.5, 98.5], mw = 94, r = rnd(971), i, y;
    x0s.forEach(function (x0) {
      s += rett(x0, 3.5, mw, H - 7, 0, lin("tt", [[0, "#ddd296"], [.5, "#d3c682"], [1, "#c4b56f"]], 0, 0, 1, 1));
      for (y = 5; y < H - 4; y += 2.6) s += rett(x0 + 5, y, mw - 10, .7, 0, r() < .5 ? "#b9a862" : "#e6dca6", op(f2(.35 + r() * .25)));   // la trama di giunco
      [x0, x0 + mw - 4.6].forEach(function (hx0) {   // le fasce di stoffa sui lati lunghi (heri)
        s += rett(hx0, 3.5, 4.6, H - 7, 0, "#25324e") + rett(hx0 + 1.4, 3.5, .5, H - 7, 0, "#c9a94b", op(.7)) + rett(hx0 + 2.7, 3.5, .5, H - 7, 0, "#c9a94b", op(.7));
        for (i = 6; i < H - 6; i += 4) s += cer(hx0 + 2.3, i, .35, "#e8d48a", op(.6));
      });
    });
    s += rett(97.6, 3.5, 1.8, H - 7, 0, "#000", op(.25)) + rett(3.5, 3.5, W - 7, H - 7, 0, "none", "stroke='#5c3d22' stroke-width='1.2'");
    return s;
  }
  function motivoFuton(id, W, H, t) {   // il disegno della trapunta, bianco sul colore
    var s = "", x, y, i, k, r = rnd(981);
    if (id === "blu") {   // le onde (seigaiha)
      for (y = H + 6; y > -8; y -= 4.6) for (x = (Math.round(y / 4.6) % 2 ? 0 : 4.6); x < W + 8; x += 9.2) {
        s += cer(x, y, 4.6, t);
        for (k = 4.4; k > .8; k -= 1.25) s += "<path d='M" + q(x - k, y) + " A" + f1(k) + "," + f1(k) + " 0 0,1 " + q(x + k, y) + "' fill='none' stroke='#ffffff' stroke-width='.45' opacity='.8'/>";
      }
    } else if (id === "rosso") {   // i fiori di ciliegio sparsi, coi petali che volano
      for (i = 0; i < 26; i++) {
        var cx = r() * W, cy = r() * H, rr = 2.4 + r() * 1.6, ru = r() * 72, f = "";
        for (k = 0; k < 5; k++) { var an = (ru + k * 72) * Math.PI / 180, px = cx + Math.cos(an) * rr * .62, py = cy + Math.sin(an) * rr * .62; f += ell(px, py, rr * .48, rr * .34, "#fff0f3", gira(px, py, an * 57.3)); }
        s += f + cer(cx, cy, rr * .25, "#ffc9d4") + cer(cx, cy, rr * .1, "#c92a2a");
      }
      for (i = 0; i < 22; i++) { var qx = r() * W, qy = r() * H; s += ell(qx, qy, 1, .55, "#ffe3ea", gira(qx, qy, r() * 180) + " " + op(.85)); }
    } else {   // le foglie di canapa (asanoha): stelle a sei punte sulla griglia di triangoli
      var lato = 9, hh = lato * .866, d = "";
      for (y = -hh; y < H + hh; y += hh) for (x = -lato + ((Math.round(y / hh) % 2) ? lato / 2 : 0); x < W + lato; x += lato) {
        var A = [x, y], B = [x + lato, y], C = [x + lato / 2, y + hh], D = [x + lato * 1.5, y + hh], c1 = [(A[0] + B[0] + C[0]) / 3, (A[1] + B[1] + C[1]) / 3], c2 = [(B[0] + C[0] + D[0]) / 3, (B[1] + C[1] + D[1]) / 3];
        d += "M" + q(A) + " L" + q(B) + " L" + q(C) + " Z M" + q(A) + " L" + q(c1) + " L" + q(B) + " M" + q(C) + " L" + q(c1) + " M" + q(B) + " L" + q(c2) + " L" + q(D) + " M" + q(C) + " L" + q(c2) + " ";
      }
      s += "<path d='" + d + "' fill='none' stroke='#ffffff' stroke-width='.4' opacity='.75'/>";
    }
    return s;
  }
  def("futon", { tipo: "piedi", nome: "Futon giapponese", fp: [2, 2], box: [-105, -67, 111, 56], dietro: true, azione: "dormi", cuscino: [35, -37], prezzo: 1200, reparto: "letti", colori: COL_FUTON }, function (o) {
    var K = scelto(COL_FUTON, o), t = K.t, l = K.l, LW = "#7a5232", s = ombraPianta(-1, 1, -1, 1, 1.05, .05);
    s += blocco(-.98, .98, -.98, .98, 0, 5.5, legnoT(LW), { davanti: facciaLegno(LW, 991), dietro: facciaLegno(LW, 992), fianco: facciaLegno(LW, 993),
      sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, tatami(W, H)); } }, 2);
    // il materasso (shikibuton): bianco, con le trapuntature
    var mat = estruso("b", tondo(-.5, .5, 5.5, 12, .06, .5, .03), -.86, .86, l, { mat: STOFFA, ao: .3, aoH: 3, fascia: function (H) {
      return tratto(aperto(H.lungo(H.vicinoA(.5, 10), -.85, .85)), "#c9ccd0", .5, "stroke-dasharray='1.4 1' opacity='.8'") + tratto(aperto(H.lungo(H.vicinoA(-.5, 10), -.85, .85)), "#c9ccd0", .5, "stroke-dasharray='1.4 1' opacity='.8'");
    }, tappo: function (T) { return T.su(rett(1.5, 1.6, T.W - 3, T.H - 3.2, 2, "none", "stroke='#c9ccd0' stroke-width='.5' stroke-dasharray='1.4 1'")); } });
    // il cuscino basso di grano saraceno: bianco, con la fascia del colore della trapunta
    var cus = estruso("a", tondo(-.81, -.6, 12, 18.4, .07, 1.3, .03), -.19, .19, "#fbfbf8", { mat: STOFFA, ao: .25, aoH: 3, fascia: function (H) {
      var r = "";
      [-.13, .13].forEach(function (a) { var pp = H.sez(a); if (pp.length > 1) r += tratto(aperto(pp), L, 3.2, op(.5)) + tratto(aperto(pp), t, 2.2); });
      return r + trama(limiti(H.sil), 994, 60, "#e9ecef");
    }, tappo: function (T) { return T.su(rett(0, 0, T.W, T.H, 0, "#000", op(.04))); } });
    // la trapunta (kakebuton): gonfia, coi motivi, ricade sui fianchi e in fondo; in cima il colletto bianco con la cucitura
    function cupola(w, z0, dz) { return pulisci([[-.985 * w, z0], [.985 * w, z0], [w, z0 + 2.2], [.985 * w, 12 + dz], [.935 * w, 15.2 + dz], [.815 * w, 17.4 + dz], [.585 * w, 18.6 + dz], [.285 * w, 19.1 + dz], [0, 19.25 + dz],
      [-.285 * w, 19.1 + dz], [-.585 * w, 18.6 + dz], [-.815 * w, 17.4 + dz], [-.935 * w, 15.2 + dz], [-.985 * w, 12 + dz], [-w, z0 + 2.2]]); }
    var pIu = estruso("b", cupola(.565, 5.8, 0), -.41, .93, t, { mat: STOFFA, ao: .3, aoH: 5, fascia: function (H) {
      var W = 69.5, Hh = 81.7, r = "", e0 = H.sez(-.41), e1 = H.sez(-.27);
      r += piano(P(-.57, -.41, 18.6), P(.57, -.41, 18.6), P(-.57, .93, 18.6), W, Hh, motivoFuton(K.id, W, Hh, t)) +
        tratto(aperto(H.lungo(H.vicinoA(0, 19.25), -.43, .91)), "#ffffff", 3, op(.08)) + trama(limiti(H.sil), 995, 160, t);
      if (e0.length > 1 && e1.length > 1)   // il colletto bianco cucito sul bordo di sopra, che segue la trapunta
        r += pth(chiuso(e0.concat(e1.slice().reverse())), nuova([[0, "#ffffff"], [1, scuro(l, .1)]], 0, 0, 1, 1)) + tratto(aperto(e1), scuro(l, .3), .8, op(.8)) +
          tratto(aperto(H.sez(-.29)), "#adb5bd", .5, "stroke-dasharray='1.2 .9' opacity='.9'");
      return r;
    }, tappo: function (T) {
      if (G < 0) return T.su(rett(0, 0, T.W, T.H, 0, l) + rett(0, T.H - 4, T.W, 4, 0, "#000", op(.06)) + rett(2, 2.2, T.W - 4, .6, 0, "#adb5bd", op(.8)));   // da dietro si vede il colletto che fascia la testa della trapunta
      return T.su(rett(0, 0, T.W, T.H, 0, "#000", op(.05)) + rett(0, T.H - 4, T.W, 4, 0, "#000", op(.08)));
    } });
    if (G > 0) s += mat + cus + pIu; else s += mat + pIu + cus;
    return s;
  });

  // =========================================================
  //  BAULE DEL TESORO: le assi di legno col coperchio a botte, le fasce d'oro coi chiodi, gli angolari, la serratura
  //  grande; dal coperchio scappano una collana di perle e qualche moneta d'oro; da dietro le cerniere
  // =========================================================
  def("baule", { tipo: "piedi", nome: "Baule del tesoro", fp: [1, 1], box: [-41, -50, 47, 24], dietro: true, piano: 35, prezzo: 900, reparto: "mobili" }, function () {
    var c = "#8b5a2b", s = ombraPianta(-.44, .44, -.29, .29, 1, .05), OR = lin("fo", [[0, "#fff1b8"], [.35, "#f2c94c"], [.7, "#d29e2c"], [1, "#9a6c12"]], 0, 0, 1, 0), ORv = lin("fov", [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]], 0, 0, 0, 1);
    angoli(.37, .215).forEach(function (g) { var F = forma(g[0], g[1], .03, .03, .03); s += corpo([giro(F, 0, .55, 16), giro(F, 1.4, 1, 16), giro(F, 2.8, .7, 16)], OTTONE, 1); });   // i piedini a palla d'ottone
    function borchia(x, y, r) { return cer(x + .25, y + .35, r, "#000", op(.35)) + cer(x, y, r, rad("bo", [[0, "#fffbe6"], [.45, "#f2c94c"], [1, "#8a6010"]], .35, .3, .8), "stroke='#5a3c0c' stroke-width='.3'"); }
    function assi(W, H, seme) {   // tre assi orizzontali, con le fughe e le venature
      var r = venature(W, H, c, seme, false, 1), k;
      for (k = 1; k < 3; k++) r += rett(0, H * k / 3 - .5, W, .9, 0, scuro(c, .55), op(.8)) + rett(0, H * k / 3 + .45, W, .45, 0, chiaro(c, .3), op(.45));
      return r;
    }
    function fasce(W, H, xs) {   // le fasce d'oro: in alto, in basso e quelle dritte, coi chiodi
      var r = rett(0, 0, W, 2.3, 0, ORv) + rett(0, H - 2.3, W, 2.3, 0, ORv) + rett(0, 2.3, W, .5, 0, "#6b4a0e", op(.5)), x;
      xs.forEach(function (x0) { r += rett(x0 - 1.7, 0, 3.4, H, 0, OR) + rett(x0 - 1.7, 0, .5, H, 0, "#fff6cf", op(.6)) + rett(x0 + 1.2, 0, .5, H, 0, "#6b4a0e", op(.5)); for (var y = 4.5; y < H - 2; y += 4.2) r += borchia(x0, y, .7); });
      for (x = 3; x < W - 1; x += 4.6) r += borchia(x, 1.15, .5) + borchia(x, H - 1.15, .5);
      return r;
    }
    function angolari(W, H) {   // gli angolari d'oro
      return [[0, 0, 1, 1], [W, 0, -1, 1], [0, H, 1, -1], [W, H, -1, -1]].map(function (v) {
        return pth("M" + q(v[0], v[1]) + " l" + f1(v[2] * 6) + ",0 l0," + f1(v[3] * 2.3) + " l" + f1(-v[2] * 3.7) + ",0 l0," + f1(v[3] * 3.7) + " l" + f1(-v[2] * 2.3) + ",0 Z", ORv, "stroke='#6b4a0e' stroke-width='.4'") + borchia(v[0] + v[2] * 1.4, v[1] + v[3] * 4, .5);
      }).join("");
    }
    function maniglia(W, H) {   // la maniglia ad anello sul fianco
      var cx = W / 2, cy = H * .38;
      return rett(cx - 3.2, cy - 2.4, 6.4, 4.2, 1, ORv, "stroke='#6b4a0e' stroke-width='.5'") + borchia(cx - 2, cy - .3, .5) + borchia(cx + 2, cy - .3, .5) +
        "<path d='M" + q(cx - 3.4, cy + 1) + " Q" + q(cx - 3.8, cy + 7.5) + " " + q(cx, cy + 7.6) + " Q" + q(cx + 3.8, cy + 7.5) + " " + q(cx + 3.4, cy + 1) + "' fill='none' stroke='#5a3c0c' stroke-width='2.2'/>" +
        "<path d='M" + q(cx - 3.4, cy + 1) + " Q" + q(cx - 3.8, cy + 7.5) + " " + q(cx, cy + 7.6) + " Q" + q(cx + 3.8, cy + 7.5) + " " + q(cx + 3.4, cy + 1) + "' fill='none' stroke='#e8c27a' stroke-width='1.2'/>";
    }
    var xs = [(.4 - .22) * 61, (.4 + .22) * 61];
    s += blocco(-.4, .4, -.25, .25, 2.8, 24, legnoT(c), {
      davanti: function (W, H) { return assi(W, H, 1001) + fasce(W, H, xs) + angolari(W, H); },
      dietro: function (W, H) { return assi(W, H, 1002) + fasce(W, H, xs) + angolari(W, H) + [W * .25, W * .75].map(function (x) { return rett(x - 3, 0, 6, 6.5, .8, ORv, "stroke='#6b4a0e' stroke-width='.5'") + borchia(x - 1.6, 3.4, .5) + borchia(x + 1.6, 3.4, .5); }).join(""); },
      fianco: function (W, H) { return assi(W, H, 1003) + fasce(W, H, []) + angolari(W, H) + maniglia(W, H); }
    }, 2.2);
    // il coperchio a botte
    var prof = pulisci([[-.262, 24], [.262, 24], [.262, 26.6]].concat(arcoS(0, 26.6, .262, 8.4, 0, Math.PI, 22), [[-.262, 26.6]]));
    s += estruso("a", prof, -.405, .405, chiaro(c, .06), { mat: LEGNO, ao: .1, aoH: 3, fascia: function (H) {
      var r = "", k, rr = rnd(1011);
      H.vis.forEach(function (kk, j) { if (j > 0 && j % 4 === 0) r += tratto(aperto(H.lungo(kk)), scuro(c, .55), .8, op(.7)); else if (rr() < .5) r += tratto(aperto(H.lungo(kk, -.4 + rr() * .2, .4 - rr() * .2)), scuro(c, .3), .3, op(.4)); });   // le assi e le venature
      r += H.luccica(.3, .03, .97);
      var bassoV = H.vicinoA(G > 0 ? .262 : -.262, 25.3);
      r += tratto(aperto(H.lungo(bassoV)), "#6b4a0e", 3.2) + tratto(aperto(H.lungo(bassoV)), "#e9c25a", 2) + tratto(aperto(sposta(H.lungo(bassoV), 0, -.6)), "#fff1b8", .5, op(.8));   // il bordo d'oro del coperchio
      [-.22, .22].forEach(function (a) {   // le fasce d'oro che passano sopra il coperchio, coi chiodi
        var pp = H.sez(a); if (pp.length < 2) return;
        r += tratto(aperto(pp), "#5a3c0c", 4.6) + tratto(aperto(pp), "#e3b641", 3.2) + tratto(aperto(sposta(pp, -.7, -.2)), "#fff1b8", .8, op(.8));
        for (k = 1; k < pp.length - 1; k += 3) r += borchia(pp[k][0], pp[k][1], .6);
      });
      return r;
    }, tappo: function (T) {
      var r = "", k;
      for (k = 1; k < 4; k++) r += rett(0, T.H * k / 4 - .4, T.W, .7, 0, scuro(c, .55), op(.7));
      return T.su(r + venature(T.W, T.H, c, 1012, false, .7) + rett(0, T.H - 2.4, T.W, 2.4, 0, ORv));
    } });
    // il tesoro che scappa dal coperchio: si disegna dopo il coperchio, tagliato al suo bordo, così sembra uscire da sotto (la collana di perle col rubino, le monete schiacciate)
    if (G > 0) {
      var tes = "", k, perla = rad("pe", [[0, "#ffffff"], [.6, "#f1ece4"], [1, "#b9ada0"]], .35, .3, .8);
      for (k = 0; k <= 18; k++) { var x = 3.6 + k * .84, y = -1.2 + 8.6 * (1 - Math.pow((k - 9) / 9, 2)); tes += cer(x + .2, y + .3, .8, "#000", op(.3)) + cer(x, y, .8, perla, "stroke='#8a7e72' stroke-width='.2'"); }
      for (k = 0; k <= 9; k++) { var x2 = 9.2 + k * .9, y2 = -1.2 + 4.6 * Math.sin(k / 9 * Math.PI); tes += cer(x2, y2, .7, perla, "stroke='#8a7e72' stroke-width='.2'"); }
      tes += tratto("M" + q(13.2, 3.4) + " L" + q(13.2, 4.6), "#c99a36", .5) + pth("M" + q(13.2, 4.4) + " l1.7,1.7 l-1.7,2.7 l-1.7,-2.7 Z", lin("rb", [[0, "#ffa8a8"], [.5, "#e03131"], [1, "#7a1010"]], 0, 0, 1, 1), "stroke='#5a3c0c' stroke-width='.4'") + cer(12.8, 5.5, .35, "#ffffff", op(.85));
      [[29.5, .5, -14], [32.6, .9, 6], [35.6, .3, -6], [34.2, -.2, 18]].forEach(function (m) { tes += ell(m[0] + .2, m[1] + .9, 2.2, 1.2, "#7a5614", gira(m[0], m[1] + .9, m[2])) + ell(m[0], m[1] + .5, 2.2, 1.2, rad("mo", [[0, "#fff6cf"], [.6, "#f2c94c"], [1, "#b5862a"]], .4, .35, .8), "stroke='#6b4a0e' stroke-width='.35' " + gira(m[0], m[1] + .5, m[2])) + ell(m[0] - .6, m[1] + .2, .7, .3, "#ffffff", op(.7) + " " + gira(m[0], m[1] + .5, m[2])); });
      s += faccia(P(-.4, .2505, 24), 1, dentro("M-2,-.3 H52 V22 H-2 Z", tes));
    }
    if (G > 0) {
      // la serratura grande: la piastra a scudo con il buco della chiave, il gancio dal coperchio
      var ser = pth("M-4.2,-5.5 L4.2,-5.5 L4.2,2.4 Q4.2,6.8 0,8.6 Q-4.2,6.8 -4.2,2.4 Z", lin("se", [[0, "#fff1b8"], [.45, "#f2c94c"], [1, "#9a6c12"]], 0, 0, 1, 1), bordo("#5a3c0c", .8)) +
        pth("M-2.6,-5.5 L2.6,-5.5 L2.2,-1.2 L-2.2,-1.2 Z", lin("ga", [[0, "#ffe9a0"], [1, "#b5862a"]], 0, 0, 0, 1), bordo("#5a3c0c", .6)) +
        cer(0, 1.8, 1.2, "#2a1a08") + pth("M-.6,2.2 L.6,2.2 L.9,4.6 L-.9,4.6 Z", "#2a1a08") + borchia(-2.8, 5, .45) + borchia(2.8, 5, .45) + borchia(-2.8, -.2, .45) + borchia(2.8, -.2, .45) +
        ell(-2.2, -3.6, .9, 2.2, "#ffffff", op(.45));
      s += faccia(P(0, .262, 24), 1, "<g transform='translate(-.5 2.6)'>" + ser + "</g>");
    }
    return s;
  });

  // =========================================================
  //  VETRINETTA COI PIATTI: legno chiaro, sotto le ante a bugna coi pomoli d'ottone, sopra la vetrina a due ante
  //  coi vetri che riflettono; dentro il fondo azzurro, i piatti in piedi coi bordi blu e rosa, la teiera e le tazzine;
  //  in cima la cornice coi dentelli; da dietro il pannello con le viti
  // =========================================================
  def("vetrinetta", { tipo: "piedi", nome: "Vetrinetta coi piatti", fp: [1, 1], box: [-51, -130, 57, 29], dietro: true, piano: 104, prezzo: 1500, reparto: "mobili" }, function () {
    var c = "#d8b48a", WB = legnoT(c), a0 = -.42, a1 = .42, b0 = -.475, b1 = -.03, s = ombraPianta(-.45, .45, -.5, -.01, .95, .04);
    angoli(.385, .2).forEach(function (g) {   // i piedini a cipolla, di legno scuro
      var F = forma(g[0], g[1] - .2525, .036, .036, .036);
      s += corpo([giro(F, 0, .6, 18), giro(F, 1.5, 1.05, 18), giro(F, 3.4, .78, 18)], [[0, chiaro(c, .1)], [.45, scuro(c, .3)], [1, scuro(c, .6)]], 1.1);
    });
    s += blocco(-.415, .415, -.47, -.035, 3.2, 5.6, legnoT(scuro(c, .3)), { davanti: function (W, H) { return rett(0, H - 1, W, .6, 0, chiaro(c, .2), op(.5)); } }, 1.5);   // lo zoccolo
    s += blocco(a0, a1, b0, b1, 5.6, 37.6, WB, {
      davanti: function (W, H) { var w2 = (W - 5.2) / 2; return venature(W, H, c, 1101, true, .5) + bugnaLegno(1.7, 2, w2, H - 4, c, 2.6, 1102, true) + bugnaLegno(3.5 + w2, 2, w2, H - 4, c, 2.6, 1103, true) + rett(W / 2 - .3, 2, .6, H - 4, 0, scuro(c, .5), op(.6)) + pomoloOro(W / 2 - 3.2, H * .4, 1.15) + pomoloOro(W / 2 + 3.2, H * .4, 1.15); },
      dietro: retro(c), fianco: facciaLegno(c, 1104, false)
    }, 2.2);
    s += blocco(a0 - .016, a1 + .016, b0 - .004, b1 + .018, 37.6, 41, WB, { davanti: function (W, H) { return rett(0, 1, W, .5, 0, chiaro(c, .5), op(.6)); }, fianco: function (W, H) { return rett(0, 1, W, .5, 0, chiaro(c, .4), op(.5)); },
      sopra: function (A, B, C, D) { return laccaSopra([A, B, C, D], .7); } }, 1.9);   // il piano che sporge, lucido
    var ZA = 41, ZB = 97, bv = b1 - .006;
    s += blocco(a0 + .008, a1 - .008, b0, bv, ZA, ZB, WB, { davanti: function () { return ""; }, dietro: retro(c), fianco: facciaLegno(c, 1105, true) }, 2.2);
    if (G > 0) {
      // dentro la vetrina: il fondo, il fianco, i ripiani, i piatti e la teiera (si vede solo dalla finestra davanti)
      var x0 = a0 + .04, x1 = a1 - .04, bf = b0 + .022, za = ZA + 2.4, zb = ZB - 2.6, r = "";
      var FONDO = "#bfdcea";
      r += poly([P(x0, bf, zb), P(x1, bf, zb), P(x1, bf, za), P(x0, bf, za)], FONDO);
      r += piano(P(x0, bf, zb), P(x1, bf, zb), P(x0, bf, za), (x1 - x0) * 61, zb - za, (function () { var w = (x1 - x0) * 61, h = zb - za, d = "", xx; for (xx = 2; xx < w; xx += 4) d += rett(xx, 0, 1.3, h, 0, "#ffffff", op(.25)); return d + buio(w, h * .5, .3, true); })());   // la carta a righine
      r += poly([P(x0, bf, zb), P(x0, bv, zb), P(x0, bv, za), P(x0, bf, za)], scuro(c, .28));
      function ripiano(z) { return poly([P(x0, bf, z), P(x1, bf, z), P(x1, bv, z), P(x0, bv, z)], lin("rp", [[0, scuro(c, .25)], [1, chiaro(c, .1)]], 0, 0, 0, 1)) + poly([P(x0, bv, z), P(x1, bv, z), P(x1, bv, z - 1.8), P(x0, bv, z - 1.8)], chiaro(c, .05)) + tratto(linea(P(x0, bf + .05, z), P(x1, bf + .05, z)), scuro(c, .45), .6, op(.7)); }
      function piatto(ac, z, rag, colB, fiore, bp) {   // un piatto in piedi sul davanti del ripiano (appena dietro al vetro), un po' appoggiato all'indietro
        bp = bp || bv - .085;
        var d = rag, dd = "", O = P(ac - rag / 61, bp - .03, z + 2 * rag), X = P(ac + rag / 61, bp - .03, z + 2 * rag), Y = P(ac - rag / 61, bp, z);
        dd += cer(d + .5, d + .7, d, "#000", op(.2)) + cer(d, d, d, nuovaR([[0, "#ffffff"], [.7, "#f4f6f7"], [1, "#cfd6db"]], .4, .35, .75), bordo(L, .7));
        dd += cer(d, d, d * .84, "none", "stroke='" + colB + "' stroke-width='" + f1(d * .16) + "'") + cer(d, d, d * .58, nuovaR([[0, "#ffffff"], [1, "#e6ebee"]], .4, .35, .7), "stroke='#d0d7dc' stroke-width='.5'");
        if (fiore) { var k; for (k = 0; k < 5; k++) { var an = k / 5 * 6.2832; dd += ell(d + Math.cos(an) * d * .2, d + Math.sin(an) * d * .2, d * .16, d * .1, colB, gira(d + Math.cos(an) * d * .2, d + Math.sin(an) * d * .2, an * 57.3)); } dd += cer(d, d, d * .08, "#fcc419"); }
        for (var j = 0; j < 12; j++) { var aj = j / 12 * 6.2832; dd += cer(d + Math.cos(aj) * d * .84, d + Math.sin(aj) * d * .84, d * .045, "#ffffff", op(.8)); }
        dd += "<path d='M" + q(d * .3, d * .55) + " A" + f1(d * .75) + "," + f1(d * .75) + " 0 0,1 " + q(d * .7, d * .22) + "' fill='none' stroke='#ffffff' stroke-width='.8' opacity='.9'/>";
        return piano(O, X, Y, 2 * d, 2 * d, dd);
      }
      function tazza(ac, bc, z, colB) {   // una tazzina col piattino
        var F = forma(ac, bc, .03, .03, .03), Fp = forma(ac, bc, .045, .045, .045), rr2 = "";
        rr2 += corpo([giro(Fp, z, 1, 24), giro(Fp, z + .8, 1, 24)], [[0, "#ffffff"], [1, "#b9c3ca"]], .7) + pth(chiuso(giro(Fp, z + .8, 1, 24)), "#f8f9fa", bordo(L, .5));
        var m = P(ac + .034, bc, z + 3.2); rr2 += "<path d='M" + q(m[0] - .8, m[1] - 1.4) + " q2.6,-.4 2.4,1.6 q-.2,1.8 -2.4,1.2' fill='none' stroke='" + L + "' stroke-width='1.6'/><path d='M" + q(m[0] - .8, m[1] - 1.4) + " q2.6,-.4 2.4,1.6 q-.2,1.8 -2.4,1.2' fill='none' stroke='#f8f9fa' stroke-width='.7'/>";
        rr2 += corpo([giro(F, z + .8, .7, 24), giro(F, z + 4.6, 1, 24)], [[0, "#ffffff"], [.6, "#eef1f3"], [1, "#aeb8bf"]], .7) + pth(chiuso(giro(F, z + 4.6, 1, 24)), "#7a4a2a", bordo(L, .5)) + tratto(aperto(arco(F, z + 3.8, DAVANTI() + .5, DAVANTI() + Math.PI - .5, 12)), colB, .8);
        return rr2;
      }
      function teiera(ac, bc, z) {   // la teiera bianca coi fiorellini blu
        var F = forma(ac, bc, .072, .072, .072), rr2 = "", bp = P(ac - .075, bc, z + 6), sp = P(ac - .125, bc, z + 10.5), hp = P(ac + .07, bc, z + 8.5);
        rr2 += "<path d='M" + q(hp[0] - .6, hp[1] - 2.5) + " q4.2,-.6 3.8,3 q-.4,3 -3.4,2.6' fill='none' stroke='" + L + "' stroke-width='2.6'/><path d='M" + q(hp[0] - .6, hp[1] - 2.5) + " q4.2,-.6 3.8,3 q-.4,3 -3.4,2.6' fill='none' stroke='#f8f9fa' stroke-width='1.3'/>";
        rr2 += corpo([giro(F, z, .62, 28), giro(F, z + 2.2, .92, 28), giro(F, z + 5.2, 1, 28), giro(F, z + 8, .86, 28), giro(F, z + 9.6, .56, 28)], [[0, "#ffffff"], [.55, "#eef1f3"], [1, "#a9b4bc"]], 1.1);
        rr2 += pth("M" + q(bp[0], bp[1] - 1.2) + " Q" + q(sp[0] + 1.5, bp[1] - 1) + " " + q(sp[0], sp[1]) + " L" + q(sp[0] + 1.6, sp[1] + .6) + " Q" + q(bp[0] - 1, bp[1] + 1) + " " + q(bp[0] + .6, bp[1] + 2.4) + " Z", "#f1f3f5", bordo(L, .8));
        var k; for (k = 0; k < 3; k++) { var fp = P(ac + (k - 1) * .035, bc + .07, z + 5.2 + (k % 2) * 1.6); rr2 += cer(fp[0], fp[1], .9, "#4dabf7") + cer(fp[0], fp[1], .35, "#fcc419"); }
        rr2 += corpo([giro(F, z + 9.4, .5, 24), giro(F, z + 10.4, .44, 24)], [[0, "#ffffff"], [1, "#adb5bd"]], .8);
        var pm = forma(ac, bc, .016, .016, .016); rr2 += corpo([giro(pm, z + 10.3, 1, 12), giro(pm, z + 11.8, .7, 12)], [[0, "#ffffff"], [1, "#9aa5ad"]], .7);
        return rr2;
      }
      // dal basso in alto: ogni ripiano copre la cima delle cose sotto; i piatti stanno sul davanti, sul listello
      var z1 = 59.3, z2 = 77.6;
      function listello(z) { return tratto(linea(P(x0, bv - .06, z + .6), P(x1, bv - .06, z + .6)), scuro(c, .35), 1.6) + tratto(linea(P(x0, bv - .06, z + 1), P(x1, bv - .06, z + 1)), chiaro(c, .35), .6, op(.8)); }
      r += ripiano(za) + teiera(0, -.19, za) + piatto(-.235, za, 6.4, "#4dabf7", true) + piatto(.235, za, 6.4, "#4dabf7", true) + listello(za);
      r += ripiano(z1) + piatto(-.25, z1, 6.9, "#f783ac", true) + piatto(.25, z1, 6.9, "#f783ac", true) + piatto(0, z1, 6.9, "#4dabf7", true, bv - .1) + listello(z1);
      r += ripiano(z2) + tazza(-.06, -.2, z2, "#f783ac") + tazza(.08, -.22, z2, "#4dabf7") + piatto(-.255, z2, 6.4, "#4dabf7", false) + piatto(.255, z2, 6.4, "#f783ac", false) + listello(z2);
      s += dentro(chiuso([P(x0, bv, zb), P(x1, bv, zb), P(x1, bv, za - 2), P(x0, bv, za - 2)]), r);
      // le ante a vetri: il telaio di legno, i listelli all'altezza dei ripiani, i vetri che riflettono, i pomoli
      var Wv = (a1 - a0 - .016) * 61, Hv = ZB - ZA, ante = "", g2;
      var vetro = function (x, y, w, h) { return rett(x, y, w, h, 0, lin("vt", [[0, "#e7f8ff"], [1, "#a5d8ff"]], 0, 0, 1, 1), op(.2)) + dentro("M" + q(x, y) + " h" + f1(w) + " v" + f1(h) + " h" + f1(-w) + " Z", poly([[x + w * .1, y], [x + w * .42, y], [x - w * .2, y + h * .55], [x - w * .52, y + h * .55]], "#ffffff", op(.32)) + poly([[x + w * .58, y], [x + w * .7, y], [x + w * .1, y + h * .7], [x - w * .02, y + h * .7]], "#ffffff", op(.22)) + poly([[x + w, y + h * .6], [x + w, y + h * .8], [x + w * .6, y + h], [x + w * .35, y + h]], "#ffffff", op(.14))); };
      [[2.6, Wv / 2 - 1.8], [Wv / 2 + 1.8, Wv - 2.6]].forEach(function (d) {
        var w = d[1] - d[0];
        ante += vetro(d[0], 2.8, w, Hv - 5.4);
        [ZB - z2, ZB - z1].forEach(function (y) { ante += rett(d[0], y - .6, w, 1.6, .3, lin("ls", [[0, chiaro(c, .3)], [1, scuro(c, .15)]], 0, 0, 0, 1), "stroke='" + scuro(c, .5) + "' stroke-width='.4'"); });
      });
      g2 = lin("tv", [[0, chiaro(c, .25)], [1, chiaro(c, .02)]], 0, 0, 1, 0);
      ante += rett(0, 0, 2.6, Hv, 0, g2) + rett(Wv - 2.6, 0, 2.6, Hv, 0, g2) + rett(Wv / 2 - 1.8, 0, 3.6, Hv, 0, g2) + rett(0, 0, Wv, 2.8, 0, lin("to", [[0, chiaro(c, .3)], [1, c]], 0, 0, 0, 1)) + rett(0, Hv - 2.6, Wv, 2.6, 0, lin("to2", [[0, chiaro(c, .2)], [1, scuro(c, .1)]], 0, 0, 0, 1));
      ante += rett(Wv / 2 - .2, 0, .4, Hv, 0, scuro(c, .5), op(.7)) + [[2.6, 2.8, Wv / 2 - 4.4], [Wv / 2 + 1.8, 2.8, Wv / 2 - 4.4]].map(function (v) { return rett(v[0], v[1], v[2], Hv - 5.4, 0, "none", "stroke='" + scuro(c, .5) + "' stroke-width='.6'"); }).join("");
      [[2.6, Wv / 2 - 1.8], [Wv / 2 + 1.8, Wv - 2.6]].forEach(function (d) {   // l'arco in cima a ogni vetro, con la chiave di volta
        var x0 = d[0], x1 = d[1], xm = (x0 + x1) / 2, y0 = 2.8, y1 = 10.2, arc = "M" + q(x0, y1) + " C" + q(x0, y0 + 1.2) + " " + q(x1, y0 + 1.2) + " " + q(x1, y1);
        ante += pth("M" + q(x0, y0 - .1) + " H" + f1(x1) + " V" + f1(y1) + " C" + q(x1, y0 + 1.2) + " " + q(x0, y0 + 1.2) + " " + q(x0, y1) + " Z", lin("ar", [[0, chiaro(c, .3)], [1, c]], 0, 0, 0, 1)) +
          tratto(arc, scuro(c, .5), .7) + tratto("M" + q(x0 + .4, y1) + " C" + q(x0 + .4, y0 + 2.1) + " " + q(x1 - .4, y0 + 2.1) + " " + q(x1 - .4, y1), chiaro(c, .5), .4, op(.8)) +
          pth("M" + q(xm - 1.6, y0 + .1) + " L" + q(xm + 1.6, y0 + .1) + " L" + q(xm + .9, y0 + 3.3) + " L" + q(xm - .9, y0 + 3.3) + " Z", lin("kc", [[0, chiaro(c, .35)], [1, scuro(c, .15)]], 0, 0, 0, 1), "stroke='" + scuro(c, .5) + "' stroke-width='.4'");
      });
      ante += pomoloOro(Wv / 2 - 2.8, Hv * .5, 1) + pomoloOro(Wv / 2 + 2.8, Hv * .5, 1) + pth("M" + q(Wv / 2 + 4.2, Hv * .5 + 2.6) + " l1,0 l0,2 l-1,0 Z", "#2a1a08");
      s += faccia(P(a0 + .008, bv, ZB), 1, ante);
    }
    // la cornice in cima, coi dentelli, e il cappello lucido
    s += blocco(a0 - .012, a1 + .012, b0 - .004, b1 + .012, ZB, ZB + 3.2, WB, { davanti: function (W, H) { var d = "", x; for (x = 1.5; x < W - 1; x += 3.2) d += rett(x, .6, 1.8, H - 1.2, .2, chiaro(c, .25), "stroke='" + scuro(c, .4) + "' stroke-width='.35'"); return d; }, fianco: function (W, H) { var d = "", x; for (x = 1.5; x < W - 1; x += 3.2) d += rett(x, .6, 1.8, H - 1.2, .2, scuro(c, .15), "stroke='" + scuro(c, .5) + "' stroke-width='.35'"); return d; } }, 1.8);
    s += blocco(a0 - .032, a1 + .032, b0 - .008, b1 + .032, ZB + 3.2, ZB + 7, WB, { davanti: function (W, H) { return rett(0, 1, W, .6, 0, chiaro(c, .5), op(.6)) + rett(0, H - 1.2, W, .6, 0, scuro(c, .4), op(.5)); }, fianco: function (W, H) { return rett(0, 1, W, .6, 0, chiaro(c, .35), op(.5)); },
      sopra: function (A, B, C, D) { return dentro(chiuso([A, B, C, D]), venatureSopra(a0 - .03, a1 + .03, b0, b1 + .03, ZB + 7, c, 1106)) + laccaSopra([A, B, C, D], .8); } }, 2.1);
    return s;
  });

  // =========================================================
  //  CHITARRA sul suo cavalletto: la cassa a otto col sunburst (arancio al centro, scuro sul bordo), la rosetta,
  //  il battipenna, il ponticello coi piroli, la tastiera coi tasti e i segni di madreperla, la paletta con le meccaniche;
  //  da dietro il fondo di mogano con la striscia in mezzo
  // =========================================================
  var CASSA = "M12,31.2 C16.2,31 19.9,32.7 20.6,36.6 C21.2,40.1 19.1,42.1 19.3,44.6 C19.6,47.6 24,49.6 23.9,55 C23.8,60.6 18.4,63 12,63 C5.6,63 .2,60.6 .1,55 C0,49.6 4.4,47.6 4.7,44.6 C4.9,42.1 2.8,40.1 3.4,36.6 C4.1,32.7 7.8,31 12,31.2 Z";
  var MANICO = "M10.45,11 L13.55,11 L13.85,32 L10.15,32 Z", PALETTA = "M10.5,11.2 L9.3,2 C9.2,.8 10.1,.1 12,.1 C13.9,.1 14.8,.8 14.7,2 L13.5,11.2 Z";
  def("chitarra", { tipo: "piedi", nome: "Chitarra", fp: [1, 1], box: [-30, -75, 36, 19], dietro: true, prezzo: 900, reparto: "deco" }, function () {
    var TOP = [0, -.155, 66], BOT = [0, .095, 5], NB = .970, NZ = .2425;   // la cima della paletta, il fondo della cassa; (NB, NZ) = dove guarda la tavola: avanti e un po' in su
    function g3(x, y, d) { var t = y / 63, b = TOP[1] + (BOT[1] - TOP[1]) * t, z = TOP[2] + (BOT[2] - TOP[2]) * t; return P((x - 12) / 61, b - NB * (d || 0) / 61, z - NZ * (d || 0)); }
    function su(d, cont) { return piano(g3(0, 0, d), g3(24, 0, d), g3(0, 63, d), 24, 63, cont); }
    var NER = "#2b2e33", s = ombraPianta(-.2, .2, -.33, .22, .9, .04);
    // il cavalletto: tubi neri, i piedini di gomma
    var hub = [0, -.055, 9];
    function piede(A) { var p0 = P(A[0], A[1], A[2]); return ell(p0[0], p0[1], 2.4, 1.3, "#1a1b1e", bordo(L, .8)) + ell(p0[0] - .5, p0[1] - .4, .9, .4, "#5c636b"); }
    var cavDietro = tubo([0, -.06, 8], [0, -.24, .8], 1.5, NER, "#6c737a") + piede([0, -.24, .8]) + tubo([0, -.065, 9], [0, -.138, 45], 1.5, NER, "#6c737a");   // la gamba di dietro e l'asta
    var cavGiogo = (function () {   // il giogo che tiene il manico
      var aL = [-.043, -.14, 45], aR = [.043, -.14, 45], fL = [-.043, -.088, 46.4], fR = [.043, -.088, 46.4];
      return { dietro: tubo(aL, aR, 1.6, "#1a1b1e", "#4a4f55"), sx: tubo(aL, fL, 1.6, "#1a1b1e", "#4a4f55"), dx: tubo(aR, fR, 1.6, "#1a1b1e", "#4a4f55") };
    })();
    var cavDavanti = tubo([0, .01, 6.5], [-.135, .155, .8], 1.5, NER, "#6c737a") + tubo([0, .01, 6.5], [.135, .155, .8], 1.5, NER, "#6c737a") + piede([-.135, .155, .8]) + piede([.135, .155, .8]);
    var culla = tubo([-.085, .03, 4], [.085, .03, 4], 1.5, NER, "#6c737a") + [-1, 1].map(function (sg) { return tubo([sg * .085, .03, 4], [sg * .085, .15, 4.8], 1.5, NER, "#6c737a") + tubo([sg * .085, .15, 4.8], [sg * .085, .165, 8.8], 2.2, "#1a1b1e", "#4a4f55"); }).join("");
    // la chitarra: i fianchi (copie una dietro l'altra), la tavola, il manico, la paletta
    var FIANCO = "#5a2a10", fianchi = "", k;
    [6.1, 5, 3.9, 2.8, 1.7, .7].forEach(function (d, j) { fianchi += su(d, pth(CASSA, nuova([[0, chiaro(FIANCO, .2)], [.6, FIANCO], [1, scuro(FIANCO, .35)]], 0, 0, 1, 0), j ? "" : bordo(L, 1.4))); });
    var manicoF = "";
    [3.4, 2.4, 1.4, .6].forEach(function (d, j) { manicoF += su(d, pth(MANICO, "#6e3418", j ? "" : bordo(L, 1.1)) + pth(PALETTA, "#3a2214", j ? "" : bordo(L, 1.1))); });
    var tavola = "", fr = "";
    if (G > 0) {
      tavola += pth(CASSA, nuovaR([[0, "#ffd88a"], [.3, "#f7a43a"], [.6, "#e8590c"], [.85, "#9c3208"], [1, "#4a1a05"]], .5, .62, .64));
      tavola += pth(CASSA, "none", "stroke='#f7e7c6' stroke-width='1.1'") + pth(CASSA, "none", "stroke='" + L + "' stroke-width='.55'");   // il filetto chiaro sul bordo
      tavola += cer(12, 40.2, 5.7, "none", "stroke='#2b160b' stroke-width='.35'") + cer(12, 40.2, 4.25, "none", "stroke='#2b160b' stroke-width='.45'");   // la rosetta
      for (k = 0; k < 30; k++) { var an = k / 30 * 6.2832; tavola += cer(12 + Math.cos(an) * 4.95, 40.2 + Math.sin(an) * 4.95, .32, ["#f4e6c3", "#2b8a3e", "#2b160b"][k % 3]); }
      tavola += cer(12, 40.2, 3.6, nuovaR([[0, "#3a2414"], [.7, "#1a0f08"], [1, "#0d0704"]], .45, .4, .6)) + "<path d='M8.7,40.6 A3.4,3.4 0 0,1 14.6,38' fill='none' stroke='#5c3a21' stroke-width='.5' opacity='.8'/>";   // la buca
      tavola += pth("M13.4,44.6 C15.6,44.2 17.2,43 17.9,41.4 C19.5,43.6 19.4,47.2 17.2,48.4 C15.4,49.3 13.4,48 13.4,44.6 Z", nuova([[0, "#5c2d12"], [1, "#2b1407"]], 0, 0, 1, 1), "stroke='#1a0c04' stroke-width='.35'") +
        ell(16.4, 45.6, .9, .5, "#8a4a1c", op(.6)) + ell(15, 46.8, .6, .4, "#8a4a1c", op(.5)) + ell(17.3, 44, .5, .3, "#a0602a", op(.5));   // il battipenna tartarugato
      tavola += pth("M7.2,54.6 C7.2,53.6 8.4,53.4 9.6,53.7 L14.4,53.7 C15.6,53.4 16.8,53.6 16.8,54.6 C16.8,55.6 15.6,55.9 14.4,55.6 L9.6,55.6 C8.4,55.9 7.2,55.6 7.2,54.6 Z", "#2b160b", "stroke='#120804' stroke-width='.3'") + rett(9.2, 53.85, 5.6, .5, .2, "#f8f3e3");   // il ponticello
      for (k = 0; k < 6; k++) tavola += cer(9.75 + k * .9, 55, .3, "#f3ead2") + cer(9.75 + k * .9, 55, .1, "#3b2b22");
      tavola += ell(6.6, 52, 2, 4.6, "#ffffff", op(.22) + " " + gira(6.6, 52, 18)) + ell(6.2, 51, .7, 2, "#ffffff", op(.45) + " " + gira(6.2, 51, 18)) + ell(6.4, 36.4, 1.2, 2, "#ffffff", op(.25));   // il lucido della vernice
      // il manico: la tastiera di palissandro, i tasti, i segni, il capotasto; la paletta con le meccaniche
      fr += pth("M10.5,11.2 L13.5,11.2 L13.85,36.3 L10.15,36.3 Z", nuova([[0, "#4a2a16"], [.5, "#2b160b"], [1, "#1a0c05"]], 0, 0, 1, 0), "stroke='#120804' stroke-width='.35'");
      for (k = 1; k <= 20; k++) { var y = 11.2 + 42.6 * (1 - Math.pow(2, -k / 12)); if (y > 36) break; var hw = 1.5 + (y - 11.2) / 25 * .35; fr += rett(12 - hw, y - .17, 2 * hw, .34, 0, "#cfd4d8"); }
      [3, 5, 7, 9, 12, 15].forEach(function (n) { var ya = 11.2 + 42.6 * (1 - Math.pow(2, -(n - 1) / 12)), yb = 11.2 + 42.6 * (1 - Math.pow(2, -n / 12)), ym = (ya + yb) / 2; if (n === 12) fr += cer(11.3, ym, .3, "#f4efe4") + cer(12.7, ym, .3, "#f4efe4"); else fr += cer(12, ym, .32, "#f4efe4"); });
      fr += rett(10.4, 10.7, 3.2, .7, .2, "#f8f3e3");
      fr += pth(PALETTA, nuova([[0, "#4a2c1a"], [1, "#1f120a"]], 0, 0, 1, 0), "stroke='#120804' stroke-width='.4'") + rett(10.6, 1.4, 2.8, .6, .3, "#e8c27a");
      [2.9, 5.7, 8.5].forEach(function (y) {
        fr += rett(7.5, y - .35, 2.2, .7, .3, "#c0c6cb") + rett(14.3, y - .35, 2.2, .7, .3, "#c0c6cb") + ell(7.1, y, .9, 1.2, "#f1ead6", bordo(L, .35)) + ell(16.9, y, .9, 1.2, "#f1ead6", bordo(L, .35)) + cer(10.8, y, .45, "#dfe4e8", bordo(L, .25)) + cer(13.2, y, .45, "#dfe4e8", bordo(L, .25));
      });
      var corde = "";   // le corde: dai piroli al capotasto, poi alle meccaniche
      for (k = 0; k < 6; k++) { var xb = 9.75 + k * .9, xn = 10.75 + k * .5, xp = k < 3 ? 10.8 : 13.2, yp = [8.5, 5.7, 2.9][k < 3 ? k : 5 - k]; corde += tratto("M" + q(xb, 54.2) + " L" + q(xn, 11) + " L" + q(xp, yp), k < 3 ? "#d9c38c" : "#eef0f2", k < 3 ? .3 : .22, op(.95)); }
      fr += corde;
    } else {
      tavola += pth(CASSA, nuovaR([[0, "#b0582a"], [.55, "#7a3412"], [1, "#3e1806"]], .4, .45, .7)) + venature(24, 63, "#7a3412", 1201, true, .9).replace(/<rect[^>]*>/g, "") + rett(11.7, 31, .6, 32, 0, "#f4e6c3", op(.85)) + rett(11.55, 31, .15, 32, 0, "#1a0c04") + rett(12.3, 31, .15, 32, 0, "#1a0c04");
      tavola += pth(CASSA, "none", "stroke='#f7e7c6' stroke-width='1.1'") + pth(CASSA, "none", "stroke='" + L + "' stroke-width='.55'") + ell(17.4, 51, 2, 4.6, "#ffffff", op(.18) + " " + gira(17.4, 51, -18)) + ell(17.8, 50, .7, 2, "#ffffff", op(.38));
      tavola = dentro(CASSA, tavola) + pth(CASSA, "none", bordo(L, 1.2));
      fr += pth(MANICO, nuova([[0, "#9c4f24"], [.5, "#7a3a18"], [1, "#4a200c"]], 0, 0, 1, 0), bordo(L, .8)) + pth("M10.3,31 Q12,35.5 13.7,31 Z", "#7a3a18", bordo(L, .6));   // il retro del manico col tallone
      fr += pth(PALETTA, nuova([[0, "#5a3420"], [1, "#2b170c"]], 0, 0, 1, 0), bordo(L, .8));
      [2.9, 5.7, 8.5].forEach(function (y) { fr += rett(7.5, y - .35, 2.2, .7, .3, "#c0c6cb") + rett(14.3, y - .35, 2.2, .7, .3, "#c0c6cb") + rett(9.6, y - 1, 1.6, 2, .3, "#aeb6bd", bordo(L, .3)) + rett(12.8, y - 1, 1.6, 2, .3, "#aeb6bd", bordo(L, .3)) + ell(7.1, y, .9, 1.2, "#f1ead6", bordo(L, .35)) + ell(16.9, y, .9, 1.2, "#f1ead6", bordo(L, .35)); });
    }
    var dF = G > 0 ? 0 : 6.1, dM = G > 0 ? -.4 : 3.4;
    var chit = G > 0 ? fianchi + manicoF + su(dF, tavola) + su(dM, fr) : manicoF + su(dM, fr) + fianchi + su(dF, tavola);
    if (G > 0) s += cavDietro + cavGiogo.dietro + chit + cavGiogo.sx + cavGiogo.dx + culla + cavDavanti;
    else s += cavDavanti + culla + cavGiogo.sx + cavGiogo.dx + chit + cavGiogo.dietro + cavDietro;
    return s;
  });

  // =========================================================
  //  A TERRA (100 × 100 per mattonella, visto da sopra)
  // =========================================================
  // TAPPETO DI PELO BIANCO: ovale, morbidissimo, il pelo lungo che esce a ciuffi dal bordo
  def("tappeto_pelo", { tipo: "terra", nome: "Tappeto di pelo bianco", fp: [2, 1], w: 200, h: 100, prezzo: 800, reparto: "deco" }, function () {
    var r = rnd(4242), s = "", i, cx = 100, cy = 50, RX = 84, RY = 37, n = 96, pp = [];
    for (i = 0; i < n; i++) { var t = i / n * 6.2832, k = 1 + (i % 2 ? .065 : -.02) + (r() - .5) * .07; pp.push([cx + Math.cos(t) * RX * k, cy + Math.sin(t) * RY * k]); }
    var dB = liscio(pp, true);
    s += pth(dB, "#000", "opacity='.17' transform='translate(3 2)'") + pth(dB, "#000", "opacity='.1' transform='translate(1.5 1)'");   // l'ombra (il pelo è alto)
    s += pth(dB, nuovaR([[0, "#ffffff"], [.55, "#f7f5f1"], [.85, "#e7e2da"], [1, "#d3cdc3"]], .42, .44, .62), bordo("#8a7d70", 1.5));   // il contorno un po' più deciso: in miniatura su fondo chiaro si vede
    // il pelo: tante ciocche (prima le ombre tra una ciocca e l'altra, poi le ciocche chiare, poi le punte che brillano)
    var om = "", me = "", lu = "", pu = "";
    for (i = 0; i < 900; i++) {
      var a = r() * 6.2832, rr = Math.sqrt(r()), px = cx + Math.cos(a) * RX * rr * .96, py = cy + Math.sin(a) * RY * rr * .96;
      var dir = rr > .7 ? a + (r() - .5) * .9 : r() * 6.2832, l = 3 + r() * 4.5, dx = Math.cos(dir) * l, dy = Math.sin(dir) * l * .8, cu = (r() - .5) * 3;
      var d = "M" + q(px, py) + " q" + q(dx * .5 - dy * .15 * cu, dy * .5 + dx * .15 * cu) + " " + q(dx, dy) + " ";
      var lato = (px - cx) / RX, v = r();
      if (v < .22 + lato * .12) om += d; else if (v < .7) me += d; else if (v < .93) lu += d; else pu += d;
    }
    s += dentro(dB, "<path d='" + om + "' fill='none' stroke='#cfc7bb' stroke-width='1.6' stroke-linecap='round' opacity='.55'/>" + "<path d='" + me + "' fill='none' stroke='#f3f0eb' stroke-width='1.5' stroke-linecap='round'/>" +
      "<path d='" + lu + "' fill='none' stroke='#ffffff' stroke-width='1.2' stroke-linecap='round'/>" + "<path d='" + pu + "' fill='none' stroke='#ffffff' stroke-width='.7' stroke-linecap='round' opacity='.9'/>");
    // i ciuffi che escono dal bordo
    var cO = "", cC = "";
    for (i = 0; i < 150; i++) {
      var t2 = i / 150 * 6.2832 + r() * .03, ex = cx + Math.cos(t2) * RX * (.94 + r() * .04), ey = cy + Math.sin(t2) * RY * (.94 + r() * .04), l2 = 4 + r() * 4, d2 = t2 + (r() - .5) * .7;
      var ddx = Math.cos(d2) * l2, ddy = Math.sin(d2) * l2 * .75, cv = (r() - .5) * 2.4, dd = "M" + q(ex, ey) + " q" + q(ddx * .5 - ddy * .2 * cv, ddy * .5 + ddx * .2 * cv) + " " + q(ddx, ddy) + " ";
      cO += dd; cC += dd;
    }
    s += "<path d='" + cO + "' fill='none' stroke='#b3a89b' stroke-width='2.2' stroke-linecap='round' opacity='.5'/><path d='" + cC + "' fill='none' stroke='#fbfaf8' stroke-width='1.4' stroke-linecap='round'/>";
    // la luce da sinistra e qualche ciuffo gonfio
    s += dentro(dB, rett(0, 0, 200, 100, 0, nuova([[0, "#ffffff", .18], [.5, "#ffffff", 0], [1, "#6b5d50", .12]], 0, 0, 1, .3)) +
      [[70, 40, 14, 7], [118, 58, 12, 6], [95, 30, 10, 5], [140, 42, 9, 5], [58, 60, 9, 5]].map(function (g) { return ell(g[0], g[1], g[2], g[3], nuovaR([[0, "#ffffff", .7], [1, "#ffffff", 0]], .5, .5, .5)); }).join(""));
    return s;
  });

  // TAPPETO TONDO: cinque anelli dei due colori, scolpiti (il pelo più basso tra un anello e l'altro), i pallini e la ghirlanda,
  // il fiore in mezzo, il bordo cucito
  var COL_TONDO = [{ id: "azzurro", nome: "azzurro", c: "#74c0fc", k: "#d0ebff" }, { id: "rosa", nome: "rosa", c: "#f783ac", k: "#ffdeeb" }, { id: "verde", nome: "verde", c: "#69db7c", k: "#d3f9d8" },
    { id: "giallo", nome: "giallo", c: "#fcc419", k: "#fff3bf" }, { id: "grigio", nome: "grigio", c: "#868e96", k: "#e9ecef" }];
  def("tappeto_tondo", { tipo: "terra", nome: "Tappeto tondo", fp: [2, 2], w: 200, h: 200, prezzo: 600, reparto: "deco", colori: COL_TONDO }, function (o) {
    var K = scelto(COL_TONDO, o), c = K.c, k = K.k, r = rnd(5151), s = "", i, j, cx = 100, cy = 100, RR = [92, 74, 56, 38, 19];
    s += cer(cx + 2.6, cy + 2, 92, "#000", op(.17)) + cer(cx + 1.3, cy + 1, 92, "#000", op(.08));   // l'ombra
    RR.forEach(function (R, n) { var col = n % 2 ? k : c; s += cer(cx, cy, R, nuovaR([[0, chiaro(col, .12)], [.85, col], [1, scuro(col, .06)]], .45, .45, .6)); });
    // i solchi scolpiti tra gli anelli: l'ombra in basso a destra, la luce in alto a sinistra
    RR.slice(1).forEach(function (R) { s += cer(cx + .5, cy + .5, R, "none", "stroke='#000' stroke-width='1.3' opacity='.16'") + cer(cx - .6, cy - .6, R + .3, "none", "stroke='#fff' stroke-width='.8' opacity='.35'"); });
    // nell'anello chiaro di fuori: i pallini del colore; in quello colorato di mezzo: la ghirlanda chiara a onde
    for (i = 0; i < 36; i++) { var an = i / 36 * 6.2832, rr = (RR[1] + RR[2]) / 2; s += cer(cx + Math.cos(an) * rr, cy + Math.sin(an) * rr, 2.6, c) + cer(cx + Math.cos(an) * rr - .5, cy + Math.sin(an) * rr - .5, .9, chiaro(c, .45)); }
    var onda = "", R3 = (RR[2] + RR[3]) / 2;
    for (i = 0; i <= 120; i++) { var a2 = i / 120 * 6.2832, rr2 = R3 + Math.sin(a2 * 14) * 4.2; onda += (i ? " L" : "M") + q(cx + Math.cos(a2) * rr2, cy + Math.sin(a2) * rr2); }
    s += tratto(onda + " Z", k, 2.2, op(.95));
    for (i = 0; i < 14; i++) { var a3 = (i + .25) / 14 * 6.2832, rr3 = R3 + 6.5; s += ell(cx + Math.cos(a3) * rr3, cy + Math.sin(a3) * rr3, 1.8, 1, k, gira(cx + Math.cos(a3) * rr3, cy + Math.sin(a3) * rr3, a3 * 57.3 + 90)); }
    for (i = 0; i < 14; i++) { var a4 = (i + .75) / 14 * 6.2832, rr4 = R3 - 6.5; s += ell(cx + Math.cos(a4) * rr4, cy + Math.sin(a4) * rr4, 1.8, 1, k, gira(cx + Math.cos(a4) * rr4, cy + Math.sin(a4) * rr4, a4 * 57.3 + 90)); }
    // nell'anello chiaro di dentro: i rombetti
    for (i = 0; i < 16; i++) { var a5 = i / 16 * 6.2832, rr5 = (RR[3] + RR[4]) / 2, x5 = cx + Math.cos(a5) * rr5, y5 = cy + Math.sin(a5) * rr5; s += pth("M" + q(x5, y5 - 2.4) + " l2,2.4 l-2,2.4 l-2,-2.4 Z", c, gira(x5, y5, a5 * 57.3)); }
    // il fiore in mezzo
    for (i = 0; i < 8; i++) { var a6 = i / 8 * 6.2832, x6 = cx + Math.cos(a6) * 9.5, y6 = cy + Math.sin(a6) * 9.5; s += ell(x6, y6, 6.4, 3.6, k, gira(x6, y6, a6 * 57.3)) + ell(x6, y6, 3.6, 1.6, chiaro(c, .3), gira(x6, y6, a6 * 57.3) + " " + op(.6)); }
    s += cer(cx, cy, 4.4, c) + cer(cx, cy, 2.2, k) + cer(cx - .8, cy - .8, .8, "#ffffff", op(.8));
    // il bordo: la fascia cucita e i punti
    s += cer(cx, cy, RR[0] - 3.4, "none", "stroke='" + chiaro(c, .55) + "' stroke-width='.8' stroke-dasharray='2.2 1.8' opacity='.9'") + cer(cx, cy, RR[0] - 1.2, "none", "stroke='" + scuro(c, .2) + "' stroke-width='2.4'");
    // la lana: puntini chiari e scuri, e la luce da sinistra
    var pt = "", ps = "";
    for (i = 0; i < 1100; i++) { var a7 = r() * 6.2832, rr7 = Math.sqrt(r()) * (RR[0] - 1.5), x7 = cx + Math.cos(a7) * rr7, y7 = cy + Math.sin(a7) * rr7, rd = f1(.45 + r() * .45); if (r() < .55) pt += "M" + q(x7 - rd, y7) + " a" + rd + "," + rd + " 0 1,0 " + f1(2 * rd) + ",0 a" + rd + "," + rd + " 0 1,0 " + f1(-2 * rd) + ",0 "; else ps += "M" + q(x7 - rd, y7) + " a" + rd + "," + rd + " 0 1,0 " + f1(2 * rd) + ",0 a" + rd + "," + rd + " 0 1,0 " + f1(-2 * rd) + ",0 "; }
    s += pth(pt, "#ffffff", op(.16)) + pth(ps, "#000000", op(.07));
    s += cer(cx, cy, RR[0], nuova([[0, "#ffffff", .2], [.5, "#ffffff", 0], [1, "#000000", .12]], 0, 0, 1, .4));
    return s + cer(cx, cy, RR[0], "none", bordo(L, 1.7));
  });

  // =========================================================
  function misure(d) { if (d.tipo === "parete" || d.tipo === "terra") return { w: d.w, h: d.h }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  var pacco = {
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: d.stanza || "tutte", reparto: d.reparto, w: m.w, h: m.h, fp: d.fp.slice(), prezzo: d.prezzo, qual: 2 };
      if (d.tipo === "piedi" || d.tipo === "sopra") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.piano) o.piano = d.piano;
      if (d.seduta) { o.azione = "siedi"; o.seduta = d.seduta; }
      if (d.azione) o.azione = d.azione;
      if (d.cuscino) o.cuscino = [m.ax + d.cuscino[0], m.ay + d.cuscino[1]];   // dove va la testa, nelle misure del disegno
      if (d.colori) o.colori = d.colori.map(function (k) { return { id: k.id, nome: k.nome, c: k.c }; });
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "sl" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1;
      var c; try { c = d.fn(opz); } finally { G = 1; }
      var testa = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "");
      if (d.tipo === "parete" || d.tipo === "terra") return testa + c + "</svg>";
      return testa + "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  };
  if (window.SGMobiliArte) window.SGMobiliArte.aggiungi(pacco);
})();

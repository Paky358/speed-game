/* =========================================================
   SPeeD GAME — IL SALONE DEL CASINÒ, VISTO DALL'ALTO (come i mobili della casa, js/mobili-arte.js)
   I pezzi della sala grande, stile Monte-Carlo (marmi, ori, cristalli, velluto rosso):
   la cassa delle fiches, il bar di lusso, il pianoforte a coda, le colonne di marmo, la statua, la fontana,
   il vaso dorato con la palma, il divanetto di velluto, i lampadari di cristallo e la passatoia rossa.
   Una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Tipi: "piedi" (in prospettiva; il davanti guarda in basso a sinistra, con { dietro: true } lo stesso pezzo girato),
   "sospeso" (i lampadari: come i "piedi" ma appesi in alto, tra 170 e 240 sopra il pavimento; sotto si cammina),
   "terra" (la passatoia: 100 × 100 visto da sopra, si ripete senza giunte lungo x).
   Con { notte: true } le luci accese (nel Casinò è sempre sera: le cose con la luce si vedono sempre accese).
   Non si vendono nel negozio: reparto "casino", prezzo 0. Si aggiungono con SGMobiliArte.aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte || !window.SGMobiliArte.aggiungi) return;

  // ---------- attrezzi (gli stessi degli altri mobili) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato; NOTTE = luci accese
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f2(n) { return Math.round(n * 100) / 100; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f2(x) + "," + f2(y); }
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
  function liscio(a, chiudi) {   // un tracciato morbido che passa per i punti (chiudi: una forma chiusa)
    var n = a.length, d = "M" + q(a[0]), i;
    function pt(k) { return chiudi ? a[(k + n) % n] : a[Math.max(0, Math.min(n - 1, k))]; }
    for (i = 0; i < (chiudi ? n : n - 1); i++) {
      var p0 = pt(i - 1), p1 = pt(i), p2 = pt(i + 1), p3 = pt(i + 2);
      d += " C" + q(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6) + " " + q(p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6) + " " + q(p2);
    }
    return d + (chiudi ? " Z" : "");
  }
  function sposta(a, dx, dy) { return a.map(function (x) { return [x[0] + dx, x[1] + dy]; }); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function trasla(dx, dy) { return "transform='translate(" + f2(dx) + " " + f2(dy) + ")'"; }
  function dEll(cx, cy, rx, ry) { return "M" + q(cx - rx, cy) + " A" + f2(rx) + "," + f2(ry) + " 0 1,0 " + q(cx + rx, cy) + " A" + f2(rx) + "," + f2(ry) + " 0 1,0 " + q(cx - rx, cy) + " Z"; }
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
  function nuovaRU(stops, cx, cy, r) { return sfum("radialGradient", "g" + (++nC), stops, "cx='" + f2(cx) + "' cy='" + f2(cy) + "' r='" + f2(r) + "' gradientUnits='userSpaceOnUse'"); }   // tonda, in unità del disegno
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  // i materiali
  var OTTONE = [[0, "#fff6cf"], [.3, "#f3d27a"], [.62, "#c99a36"], [1, "#7a5614"]];
  var DORATO = [[0, "#fff3c2"], [.22, "#f8d978"], [.5, "#dcab3c"], [.78, "#a97720"], [1, "#6a460e"]];   // l'oro lucido (foglia d'oro)
  var ORO = "#e2b444", ORO_C = "#f8de8a", ORO_S = "#9c6f1c";
  var VEL = "#b0122c";   // il velluto rosso (lo stesso delle sedie dei tavoli)
  function oroT(k) { return [lin("ot" + (k || ""), [[0, "#fff4c4"], [1, "#eac55e"]], 0, 0, 1, 1), lin("ol" + (k || ""), [[0, "#fbe08a"], [.55, "#e2b444"], [1, "#a97720"]], 0, 0, 0, 1), lin("od" + (k || ""), [[0, "#c7952f"], [1, "#6e4a10"]], 0, 0, 0, 1)]; }   // le tre facce di un blocco d'oro
  function tuboOro(d, w) { return tratto(d, L, w + 1.6) + tratto(d, "#d9a83a", w) + tratto(d, "#fff3c4", Math.max(.35, w * .36), "opacity='.9' transform='translate(-.3 -.45)'"); }   // un bastoncino d'oro

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  // le forme tonde in pianta: centro (ca, cb), mezza larghezza ra, mezza profondità rf davanti e rr dietro; e = 2 ovale, di più = più squadrata
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
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }

  // ---------- i blocchi squadrati (come nel bagno) ----------
  function faccia(o, dir, c) { return "<g transform='matrix(.8197 " + (dir > 0 ? ".4098" : "-.4098") + " 0 1 " + f2(o[0]) + " " + f2(o[1]) + ")'>" + c + "</g>"; }
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
  function mat(m, c) { return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>"; }
  function suZ(z, c) { return mat([.8197 * G, .4098 * G, -.8197 * G, .4098 * G, 0, -z], c); }   // un disegno in pianta (x = a·61, y = b·61) steso all'altezza z

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
  var VELLUTO = { velluto: .5, lucido: .55, esp: 7, riflesso: .55 }, LACCA = { lucido: .8, esp: 9 }, PELLE = { lucido: .5, esp: 14 };

  // ---------- i pezzi imbottiti: una sezione tirata lungo un asse (come il divano Chesterfield) ----------
  function arcoS(cx, cz, rx, rz, a0, a1, n) { var o = [], i; for (i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(t), cz + rz * Math.sin(t)]); } return o; }
  function pulisci(a) { return a.filter(function (x, i) { var y = a[(i + a.length - 1) % a.length]; return Math.abs(x[0] - y[0]) > 1e-4 || Math.abs(x[1] - y[1]) > 1e-3; }); }
  // la sezione di un cuscino: da x0 a x1 (mattonelle) e da z0 a z1 (unità); r = il raggio degli spigoli di sopra (mattonelle); pancia = quanto si gonfia sopra
  function sezione(x0, x1, z0, z1, r, pancia, rb) {
    var rz = r * 61, b = rb == null ? r * .5 : rb, bz = b * 61, top = [], k;
    for (k = 1; k < 8; k++) { var s = k / 8; top.push([x1 - r - (x1 - x0 - 2 * r) * s, z1 + (pancia || 0) * Math.sin(Math.PI * s)]); }
    return pulisci([].concat(arcoS(x0 + b, z0 + bz, b, bz, Math.PI, Math.PI * 1.5, 3), arcoS(x1 - b, z0 + bz, b, bz, Math.PI * 1.5, Math.PI * 2, 3),
      arcoS(x1 - r, z1 - rz, r, rz, 0, Math.PI / 2, 9), top, arcoS(x0 + r, z1 - rz, r, rz, Math.PI / 2, Math.PI, 9)));
  }
  // asse "a": la sezione è fatta di punti [b, z] e va da a = t0 ad a = t1; asse "b": punti [a, z], da b = t0 a b = t1.
  // o = { mat, fascia(H) = disegni sulla parte tirata, tappo(T) = disegni sul tappo che si vede, ao/aoH = il buio in basso, lw }
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
      else voci.push({ s: s, c: [tv2(nm, zz)] });
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
      T.y = function (z) { return z1 - z; };
      T.su = function (cont) { return piano(T.O, T.X, T.Y, T.W, T.H, cont); };
      r += dentro(dCap, o.tappo(T));
    }
    r += pth(dCap, "none", "stroke='" + L + "' stroke-width='1' stroke-linejoin='round' opacity='.7'");
    return r + pth(dSil, "none", bordo(L, o.lw || 2));
  }
  function cordone(d, c, w) { w = w || 1.5; return tratto(d, scuro(c, .42), w + .5, op(.85)) + tratto(d, chiaro(c, .32), w * .45, "opacity='.75' transform='translate(-.3 -.45)'"); }   // il cordoncino dei cuscini

  // ---------- i pezzi torniti (colonne, vasi, balaustre): il profilo [[z, raggio in mattonelle], ...] dal basso in alto ----------
  function dTornito(a, b, prof) {
    var c = P(a, b, 0), n = prof.length, sx = [], dx = [], i;
    for (i = 0; i < n; i++) { var rx = prof[i][1] * 70.71, y = c[1] - prof[i][0]; sx.push([c[0] - rx, y]); dx.push([c[0] + rx, y]); }
    var rt = prof[n - 1][1] * 70.71, rb = prof[0][1] * 70.71;
    var d = "M" + sx.map(function (x) { return q(x); }).join(" L") + (rt > .05 ? " A" + f2(rt) + "," + f2(rt / 2) + " 0 0,1 " + q(dx[n - 1]) : " L" + q(dx[n - 1]));
    for (i = n - 2; i >= 0; i--) d += " L" + q(dx[i]);
    return d + (rb > .05 ? " A" + f2(rb) + "," + f2(rb / 2) + " 0 0,1 " + q(sx[0]) : "") + " Z";
  }
  function tornito(a, b, prof, stops, lw, anelli, luce) {   // anelli = i livelli dove si vede un anello; luce = il filo chiaro a sinistra
    var c = P(a, b, 0), n = prof.length, rm = 0;
    prof.forEach(function (x) { rm = Math.max(rm, x[1] * 70.71); });
    var o = pth(dTornito(a, b, prof), lin("tn", stops, c[0] - rm, 0, c[0] + rm, 0, true), bordo(L, lw == null ? 1.3 : lw));
    (anelli || []).forEach(function (k) { var rx = prof[k][1] * 70.71, y = c[1] - prof[k][0]; o += pth("M" + q(c[0] - rx, y) + " A" + f2(rx) + "," + f2(rx / 2) + " 0 0,0 " + q(c[0] + rx, y), "none", "stroke='" + L + "' stroke-width='.55' opacity='.5'"); });
    if (luce) o += tratto("M" + prof.slice(1, n - 1).map(function (x) { return q(c[0] - x[1] * 70.71 * .52, c[1] - x[0]); }).join(" L"), "#ffffff", luce, "opacity='.55'");
    return o;
  }
  function anello(a, b, z, r) { var c = P(a, b, z); return { x: c[0], y: c[1], rx: r * 70.71, ry: r * 35.36 }; }   // un cerchio in pianta all'altezza z, sullo schermo
  function fascia(z0, z1, rr, stops, a, b) {   // un anello attorno a un pezzo tondo (da z0 a z1): si vede la metà davanti
    var e1 = anello(a || 0, b || 0, z1, rr), e0 = anello(a || 0, b || 0, z0, rr);
    var d = "M" + q(e1.x - e1.rx, e1.y) + " A" + f2(e1.rx) + "," + f2(e1.ry) + " 0 0,0 " + q(e1.x + e1.rx, e1.y) + " L" + q(e0.x + e0.rx, e0.y) + " A" + f2(e0.rx) + "," + f2(e0.ry) + " 0 0,1 " + q(e0.x - e0.rx, e0.y) + " Z";
    return pth(d, lin("fa", stops, e1.x - e1.rx, 0, e1.x + e1.rx, 0, true), bordo(L, .7)) + tratto("M" + q(e1.x - e1.rx * .7, e1.y + e1.ry * .7) + " A" + f2(e1.rx) + "," + f2(e1.ry) + " 0 0,0 " + q(e1.x - e1.rx * .1, e1.y + e1.ry * .99), "#ffffff", .45, op(.7));
  }
  function arcoDav(e) { return "M" + q(e.x - e.rx, e.y) + " A" + f2(e.rx) + "," + f2(e.ry) + " 0 0,0 " + q(e.x + e.rx, e.y); }   // la metà davanti di un anello
  function arcoDie(e) { return "M" + q(e.x - e.rx, e.y) + " A" + f2(e.rx) + "," + f2(e.ry) + " 0 0,1 " + q(e.x + e.rx, e.y); }   // la metà dietro
  function pallina(c, r, col, k) {   // una pallina lucida: c = il centro sullo schermo
    return cer(c[0], c[1], r, nuovaR([[0, chiaro(col, .7)], [.35, col], [1, scuro(col, .5)]], .35, .3, .8), bordo(L, k || .6)) + ell(c[0] - r * .32, c[1] - r * .38, r * .34, r * .22, "#ffffff", op(.85));
  }
  // su un cilindro dritto (raggio r in mattonelle): psi = l'angolo attorno (0 = davanti a chi guarda, − a sinistra, + a destra)
  function suCilindro(cx, cy, r, psi, z) { return [cx + Math.sin(psi) * r * 70.71, cy - z + Math.cos(psi) * r * 35.36]; }

  // ---------- lo spazio vero (in metri, anche l'altezza): [a, b, c] — per le piante e le cose storte ----------
  var VI = [.6124, .6124, .5], LU = norma([-.45, .55, .7]);   // da dove guarda chi gioca, da dove viene la luce
  function add(u, v) { return [u[0] + v[0], u[1] + v[1], u[2] + v[2]]; }
  function sub(u, v) { return [u[0] - v[0], u[1] - v[1], u[2] - v[2]]; }
  function mul(u, k) { return [u[0] * k, u[1] * k, u[2] * k]; }
  function crs(u, v) { return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; }
  function mista(u, v, t) { return add(mul(u, 1 - t), mul(v, t)); }
  function mondo(u) { return [u[0] * G, u[1] * G, u[2]]; }
  function S3(pt) { return Puv(pt[0] * G, pt[1] * G, pt[2] * 61); }   // un punto sullo schermo
  function Sv3(d) { return [(d[0] - d[1]) * 50 * G, (d[0] + d[1]) * 25 * G - d[2] * 61]; }   // una direzione sullo schermo
  function prof3(pt) { return dot(mondo(pt), VI); }   // più è grande, più è vicino a chi guarda
  function guarda(n) { return dot(mondo(n), VI); }
  function lux(n) { return dot(norma(mondo(n)), LU); }
  function mat3(c, u, w) { var C = S3(c), U = Sv3(u), W = Sv3(w); return " transform='matrix(" + [U[0], U[1], W[0], W[1], C[0], C[1]].map(f2).join(" ") + ")'"; }
  function simbolo(id, d, x) { DEFS.push("<path id='" + p + id + "' d='" + d + "' vector-effect='non-scaling-stroke' stroke-linejoin='round'" + attr(x) + "/>"); }
  function usa(id, m, x) { return "<use xlink:href='#" + p + id + "'" + m + attr(x) + "/>"; }
  function coloreFoglia(n, chiara, scura, rovescio, extra) {   // il verde di una foglia secondo dove guarda
    var vis = guarda(n) >= 0, lu = lux(vis ? n : mul(n, -1)), t = Math.max(0, Math.min(1, .5 + .38 * lu + (extra || 0)));
    return vis ? mix(scura, chiara, t) : mix(scuro(rovescio, .2), rovescio, t);
  }

  // ---------- le ombre a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra) ----------
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

  // ---------- i pezzi di un mobile, dal più lontano al più vicino: ognuno con box = [a0, a1, b0, b1, z0, z1] e s = il disegno ----------
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

  // ---------- le forme in pianta (punti [a, b]) e i loro fianchi dritti ----------
  function nrm2(A, B) { var dx = B[0] - A[0], dy = B[1] - A[1], l = Math.sqrt(dx * dx + dy * dy) || 1; return [dy / l, -dx / l]; }   // la normale verso fuori di un lato (giro antiorario)
  function allarga(pp, d) {   // la stessa forma spostata in fuori di d (in dentro se d < 0)
    var n = pp.length, out = [], i;
    for (i = 0; i < n; i++) {
      var n1 = nrm2(pp[(i + n - 1) % n], pp[i]), n2 = nrm2(pp[i], pp[(i + 1) % n]), m = [n1[0] + n2[0], n1[1] + n2[1]], lm = Math.sqrt(m[0] * m[0] + m[1] * m[1]) || 1;
      m = [m[0] / lm, m[1] / lm];
      var k = 1 / Math.max(.5, m[0] * n1[0] + m[1] * n1[1]);
      out.push([pp[i][0] + m[0] * d * k, pp[i][1] + m[1] * d * k]);
    }
    return out;
  }
  function aSchermo(pp, z) { return pp.map(function (x) { return P(x[0], x[1], z); }); }
  // il fianco dritto di una forma (da z0 a z1): si vedono solo i pezzi girati verso chi guarda, ognuno col colore della sua luce.
  // o = { dentro (la faccia di dentro), righe: [[z, colore, spessore, opacità]], extra(fila), cima, lw, lati }
  function fianco(pp, z0, z1, col, m, o) {
    o = o || {};
    var n = pp.length, s = "", vis = [], i, k, verso = o.dentro ? -1 : 1;
    function nv(i) { var nn = nrm2(pp[i], pp[(i + 1) % n]); return [G * nn[0] * verso, G * nn[1] * verso, 0]; }
    for (i = 0; i < n; i++) vis.push(dot(nv(i), VISTA) > .003 && (!o.filtro || o.filtro(i)));
    var file = [], parti = -1, cur = null;
    for (i = 0; i < n; i++) if (!vis[i]) { parti = i; break; }
    if (parti < 0) { cur = []; for (i = 0; i < n; i++) cur.push(i); file.push(cur); }
    else for (k = 1; k <= n; k++) { i = (parti + k) % n; if (vis[i]) { if (!cur) { cur = [i]; file.push(cur); } else cur.push(i); } else cur = null; }
    file.forEach(function (fl) {
      fl.forEach(function (i) {
        var A = pp[i], B = pp[(i + 1) % n], c = typeof col === "function" ? col(nv(i), i) : tinta(col, nv(i), m);
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
  function lungoCorsa(vv, passo, fn) {   // dei punti lungo una fila di vertici (in pianta), ogni "passo" mattonelle
    var o = "", acc = passo / 2, i;
    for (i = 0; i < vv.length - 1; i++) {
      var A = vv[i], B = vv[i + 1], l = Math.sqrt((B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1]));
      while (acc <= l) { var t = acc / l; o += fn(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t); acc += passo; }
      acc -= l;
    }
    return o;
  }
  // le venature del marmo su una faccia piatta W × H (seme fisso: lo stesso pezzo viene sempre uguale)
  function venato(W, H, seme, col, n, k) {
    var r = rnd(seme), s = "", i, j;
    for (i = 0; i < (n || 5); i++) {
      var x = r() * W, y = -4, pp = [[x, y]], dx = (r() - .5) * W * .5;
      for (j = 1; j <= 6; j++) { pp.push([x + dx * j / 6 + (r() - .5) * W * .12, -4 + (H + 8) * j / 6]); }
      s += tratto(liscio(pp), col, .35 + r() * .7, op((k || .45) * (.5 + r() * .6)));
    }
    return dentro("M0,0 H" + f2(W) + " V" + f2(H) + " H0 Z", s);   // (solo dentro la faccia)
  }
  // le venature del marmo attorno a un fusto tondo (raggio(z) in mattonelle): vene vere che vagano, si dividono e cambiano spessore
  function venePietra(raggio, z0, z1, seme, cols, n) {
    var r = rnd(seme), s = "", i, j;
    function vena(ps, z, dz, len, w, col, rami) {
      var pp = [], k, pv = ps;
      for (k = 0; k <= len; k++) { var zz = z + dz * k; if (zz < z0 - 6 || zz > z1 + 6) break; pv += (r() - .5) * .22 + (k ? 0 : 0); if (Math.abs(pv) > 1.5) break; pp.push(suCilindro(0, 0, raggio(zz), pv, zz)); if (rami > 0 && k > 2 && r() < .16) vena(pv, zz, dz * (r() < .5 ? 1 : -1) * (.6 + r() * .5), Math.round(len * .4), w * .55, col, rami - 1); }
      if (pp.length < 3) return;
      var d = liscio(pp);
      s += tratto(d, col, w * 2.6, op(.12)) + tratto(d, col, w, op(.55)) + tratto(d, "#ffffff", w * .35, op(.25) + " " + trasla(-.4, 0));
    }
    for (i = 0; i < n; i++) { var c = cols[i % cols.length]; vena(-1.3 + r() * 2.6, z0 + r() * (z1 - z0), (r() < .5 ? 1 : -1) * (5 + r() * 4), 10 + Math.round(r() * 14), .55 + r() * .6, c, 2); }
    for (j = 0; j < n * 2; j++) { var pz = z0 + r() * (z1 - z0), pc = suCilindro(0, 0, raggio(pz), -1.2 + r() * 2.4, pz); s += ell(pc[0], pc[1], 3 + r() * 5, 6 + r() * 12, cols[j % cols.length], op(.06 + r() * .06)); }   // le nuvole
    return s;
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  PASSATOIA ROSSA (a terra): il velluto rosso a rombi coi fiorellini d'oro, i bordi d'oro a cordone intrecciato.
  //  Il disegno si ripete ogni 50 lungo x (e 100 = due giri): messe in fila fanno un tappeto lungo senza giunte
  // =========================================================
  def("tappeto_rosso", { tipo: "terra", nome: "Passatoia rossa", w: 100, h: 100 }, function () {
    var s = "", r = rnd(1863), i, x;
    // il velluto: più scuro verso i bordi, col pelo che luccica nel mezzo
    s += rett(0, 0, 100, 100, 0, nuova([[0, "#5c0812"], [.1, "#8e1023"], [.22, "#ad1a2e"], [.5, "#c42136"], [.78, "#ad1a2e"], [.9, "#8e1023"], [1, "#5c0812"]], 0, 0, 0, 1));
    s += rett(0, 30, 100, 26, 0, nuova([[0, "#ffffff", 0], [.5, "#ffd6dc", .09], [1, "#ffffff", 0]], 0, 0, 0, 1));
    // i rombi (ogni 50: si ripetono uguali) col fiorellino d'oro in mezzo
    [-50, 0, 50, 100, 150].forEach(function (cx) {
      var d = "M" + q(cx, 18.5) + " L" + q(cx + 25, 50) + " L" + q(cx, 81.5) + " L" + q(cx - 25, 50) + " Z", d2 = "M" + q(cx, 30) + " L" + q(cx + 15.5, 50) + " L" + q(cx, 70) + " L" + q(cx - 15.5, 50) + " Z";
      s += pth(d, "#9c1428", op(.5)) + tratto(d, "#6e0a19", 1.7) + tratto(d, "#e45a6a", .55, op(.55) + " " + trasla(.35, .5));
      s += tratto(d2, "#e2b444", .7, op(.75)) + tratto(d2, "#6e0a19", .5, op(.6) + " " + trasla(.4, .5));
      [[5.6, 0, 3.4, 1.7], [-5.6, 0, 3.4, 1.7], [0, 5.8, 1.7, 3.5], [0, -5.8, 1.7, 3.5]].forEach(function (f) {   // i petali
        s += ell(cx + f[0], 50 + f[1], f[2], f[3], lin("pe", [[0, "#fff1b0"], [.5, "#e8b84a"], [1, "#9c6f1c"]], 0, 0, 1, 1), "stroke='#6e4a10' stroke-width='.45'");
      });
      s += cer(cx, 50, 2.3, "#7d0d1d", "stroke='#e2b444' stroke-width='.9'") + cer(cx - .6, 49.4, .6, "#ffd0d6", op(.6));
      [[cx + 25, 50], [cx, 18.5], [cx, 81.5]].forEach(function (v) { s += cer(v[0], v[1], 1.5, "#e2b444", "stroke='#6e4a10' stroke-width='.4'") + cer(v[0] - .4, v[1] - .4, .5, "#fff6cf"); });
    });
    // il pelo del velluto: puntini chiari e scuri (quelli sul bordo si ripetono dall'altra parte: niente giunte)
    for (i = 0; i < 300; i++) {
      x = r() * 100; var y = 14 + r() * 72, rr = .45 + r() * .5, c = r() < .55 ? "#ea6676" : "#5e0814", o = op(.12 + r() * .16);
      s += cer(x, y, rr, c, o); if (x < 1.5) s += cer(x + 100, y, rr, c, o); if (x > 98.5) s += cer(x - 100, y, rr, c, o);
    }
    // i bordi d'oro (sopra, e uguali capovolti sotto): l'orlo scuro, il cordone intrecciato, il filo rosso e il filetto d'oro
    function bordoOro() {
      var b = rett(0, 0, 100, 3.2, 0, "#43050e") + rett(0, 0, 100, 1.1, 0, "#000000", op(.3));
      b += rett(0, 3.2, 100, 8, 0, nuova([[0, "#fff3c0"], [.3, "#f6d06a"], [.65, "#c99a36"], [1, "#7d5513"]], 0, 0, 0, 1));
      for (x = -2; x < 104; x += 4) {   // le spire del cordone (ogni 4: 100 è un giro giusto)
        var dd = "M" + q(x, 3.6) + " C" + q(x + 2.4, 4.4) + " " + q(x + 1.6, 9.8) + " " + q(x + 4, 10.8);
        b += tratto(dd, "#7a5212", 1.1, op(.85)) + tratto(dd, "#fff4c8", .45, op(.8) + " " + trasla(-.7, -.1));
      }
      b += rett(0, 11.2, 100, 1.7, 0, "#5e0814") + rett(0, 12.9, 100, 1.2, 0, "#d9a83a") + rett(0, 12.9, 100, .45, 0, "#fff0b0", op(.75)) + rett(0, 14.1, 100, .9, 0, "#000000", op(.18));
      return b;
    }
    return s + bordoOro() + "<g transform='matrix(1 0 0 -1 0 100)'>" + bordoOro() + "</g>";
  });

  // =========================================================
  //  COLONNA DI MARMO (fino al soffitto): il plinto e la base d'oro, il fusto di marmo color miele con le venature
  //  e il lucido, il collarino e il capitello corinzio d'oro (due giri di foglie d'acanto, le volute, l'abaco)
  // =========================================================
  var CALACATTA = [[0, "#ece2cf"], [.14, "#fffdf8"], [.34, "#faf4e8"], [.6, "#ebdfc8"], [.84, "#cdb999"], [1, "#958064"]];   // il marmo bianco caldo (come il Calacatta)
  def("colonna_marmo", { nome: "Colonna di marmo", fp: [1, 1], box: [-46, -219, 48, 28] }, function () {
    var s = ombraPianta(-.31, .31, -.31, .31, 1.15, .16), i;
    function specchiatura(W, H) { return rett(4, 3, W - 8, H - 5.5, 1, "none", "stroke='#7a5614' stroke-width='.8' opacity='.75'") + rett(4.8, 3.8, W - 9.6, H - 7.1, .8, "none", "stroke='#fff3c4' stroke-width='.5' opacity='.7'"); }
    s += blocco(-.31, .31, -.31, .31, 0, 11, oroT(), { davanti: specchiatura, dietro: specchiatura, fianco: specchiatura }, 2);
    s += tornito(0, 0, [[11, .272], [12.4, .282], [14.2, .278], [15.3, .255], [16.6, .236], [17.6, .238], [18.6, .25], [19.8, .246], [20.8, .228], [22.2, .216]], OTTONE, 1.3, [3, 5, 8], .8);   // la base: toro, scozia, toro
    // il fusto (un filo più largo a un terzo, come le colonne vere), con le vene grigie e d'oro e il lucido
    var pr = [], nz = 20;
    for (i = 0; i <= nz; i++) { var t = i / nz; pr.push([22 + 149 * t, .212 - .021 * t + .007 * Math.sin(Math.PI * t * .9)]); }
    function raggio(z) { var t = Math.max(0, Math.min(1, (z - 22) / 149)); return .212 - .021 * t + .007 * Math.sin(Math.PI * t * .9); }
    var dF = dTornito(0, 0, pr), ven = venePietra(raggio, 22, 171, 1879, ["#7a6650", "#b8945a", "#958067"], 8);
    var luceF = [], luceD = [];
    for (i = 0; i <= nz; i++) { var zz = pr[i][0]; luceF.push(suCilindro(0, 0, raggio(zz), -.42, zz)); luceD.push(suCilindro(0, 0, raggio(zz), 1.22, zz)); }
    ven += tratto(aperto(luceF), "#ffffff", 6, op(.2)) + tratto(aperto(luceF), "#ffffff", 2, op(.65)) + tratto(aperto(luceD), "#ffe6b8", 1.4, op(.3));   // il lucido (e il riflesso caldo dall'altra parte)
    s += pth(dF, lin("fu", CALACATTA, -15.4, 0, 15.4, 0, true)) + dentro(dF, ven) + pth(dF, "none", bordo(L, 1.5));
    s += tornito(0, 0, [[169.5, .198], [170.6, .214], [173.2, .214], [174.4, .198]], OTTONE, 1, null, .6);   // il collarino d'oro
    // il capitello corinzio: il cesto, due giri di foglie d'acanto che si piegano in fuori (dietro prima), le volute e l'abaco
    s += tornito(0, 0, [[174.4, .196], [182, .2], [189, .214], [193.6, .238], [196, .256]], [[0, "#e9c25a"], [.4, "#c99a36"], [1, "#6e4a10"]], 1.1);
    function foglia(phi, z0, z1, rb, rt, hw) {   // una foglia: phi = dove sta in giro (π/2 = davanti), hw = mezza larghezza (radianti); in cima si arriccia in fuori
      function pt(dp, z, rr) { var a = phi + dp; return [Math.cos(a) * rr * 70.71, Math.sin(a) * rr * 35.36 - z]; }
      var zm = (z0 + z1) / 2, rm = (rb + rt) / 2, h = z1 - z0;
      var pp = [pt(-hw * .55, z0, rb), pt(-hw * .95, z0 + h * .35, rm - .004), pt(-hw * .78, z0 + h * .5, rm), pt(-hw * 1.02, z0 + h * .66, rm + .01), pt(-hw * .8, z1 - 1, rt),
        pt(-hw * .45, z1 + .6, rt + .03), pt(-hw * .12, z1 - .4, rt + .07), pt(0, z1 - 3.2, rt + .1), pt(hw * .12, z1 - .4, rt + .07), pt(hw * .45, z1 + .6, rt + .03),
        pt(hw * .8, z1 - 1, rt), pt(hw * 1.02, z0 + h * .66, rm + .01), pt(hw * .78, z0 + h * .5, rm), pt(hw * .95, z0 + h * .35, rm - .004), pt(hw * .55, z0, rb)];
      var b = limiti(pp), lu = .5 - .34 * Math.cos(phi), c1 = mix("#8f6418", "#fff4c4", Math.max(0, Math.min(1, lu + .3))), c2 = mix("#6e4a10", "#e8b84a", Math.max(0, Math.min(1, lu + .05)));
      var d = liscio(pp, true), o = pth(d, lin("fo", [[0, c1], [.5, c2], [1, scuro(c2, .38)]], b[0], 0, b[2], 0, true), bordo(L, .6));
      o += tratto(liscio([pt(0, z0 + .5, rb + .005), pt(0, zm, rm + .02), pt(0, z1 - 1.4, rt + .06)]), scuro(c2, .5), .6, op(.85));   // la costola
      o += tratto(liscio([pt(-hw * .5, z0 + 2, rb), pt(-hw * .62, zm + 1.5, rm + .01)]), "#fff6d0", .45, op(.75)) + tratto(liscio([pt(hw * .5, z0 + 2, rb), pt(hw * .62, zm + 1.5, rm + .01)]), scuro(c2, .45), .4, op(.6));
      var pc = pt(0, z1 - 2.4, rt + .09); o += ell(pc[0], pc[1], 1.1 + .8 * Math.abs(Math.sin(phi)), .9, scuro(c2, .3), op(.8));   // l'ombra sotto il ricciolo
      return o;
    }
    var foglie = [];
    for (i = 0; i < 8; i++) { var ph = i * Math.PI / 4 + Math.PI / 8; if (Math.sin(ph) > -.8) foglie.push([Math.sin(ph) + .02, foglia(ph, 177.6, 191.5, .204, .25, .34)]); }
    for (i = 0; i < 8; i++) { var ph2 = i * Math.PI / 4; if (Math.sin(ph2) > -.8) foglie.push([Math.sin(ph2) + .05, foglia(ph2, 174.6, 185.6, .2, .232, .36)]); }
    s += ordina(foglie);
    [0, Math.PI / 2, Math.PI].forEach(function (ph) {   // le volute agli angoli, sotto l'abaco: il gambo che sale e la chiocciola
      var a0 = [Math.cos(ph) * .235 * 70.71, Math.sin(ph) * .235 * 35.36 - 188], c = [Math.cos(ph) * .3 * 70.71, Math.sin(ph) * .3 * 35.36 - 193.2];
      s += tuboOro("M" + q(a0) + " Q" + q((a0[0] + c[0]) / 2, a0[1] - 3) + " " + q(c[0], c[1] - 1.8), 1.6);
      s += cer(c[0], c[1], 3, nuovaR([[0, "#fff3c2"], [.5, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), bordo(L, .7)) + tratto("M" + q(c[0] + 2, c[1]) + " A2,2 0 1,1 " + q(c[0], c[1] - 2) + " A1.2,1.2 0 1,1 " + q(c[0] - .4, c[1] + .7) + " A.5,.5 0 1,1 " + q(c[0] + .3, c[1]), "#6e4a10", .5);
    });
    // l'abaco: una lastra sottile, un quadrato coi lati incavati (gli angoli verso le diagonali)
    var sA = .315, inc = .065;
    function lato(A, M, B, z) { var a = P(A[0], A[1], z), m = P(M[0], M[1], z), b = P(B[0], B[1], z); return [a, [2 * m[0] - (a[0] + b[0]) / 2, 2 * m[1] - (a[1] + b[1]) / 2], b]; }
    function curva(l) { return "M" + q(l[0]) + " Q" + q(l[1]) + " " + q(l[2]); }
    var cS = [[-sA, sA], [sA, sA], [sA, -sA], [-sA, -sA]], mS = [[0, sA - inc], [sA - inc, 0], [0, -sA + inc], [-sA + inc, 0]];
    [[0, 1, 0], [1, 2, 1]].forEach(function (f, j) {   // le due facce davanti (quella a sinistra più chiara)
      var t1 = lato(cS[f[0]], mS[f[2]], cS[f[1]], 200), t0 = lato(cS[f[0]], mS[f[2]], cS[f[1]], 196.2);
      var d = "M" + q(t1[0]) + " Q" + q(t1[1]) + " " + q(t1[2]) + " L" + q(t0[2]) + " Q" + q(t0[1]) + " " + q(t0[0]) + " Z";
      s += pth(d, j ? lin("ab1", [[0, "#c99a36"], [1, "#7a5614"]], 0, 0, 0, 1) : lin("ab0", [[0, "#fff1b8"], [1, "#d9a83a"]], 0, 0, 0, 1), bordo(L, .9));
      var mm = P(mS[f[2]][0], mS[f[2]][1], 193.4); s += cer(mm[0], mm[1], 1.9, nuovaR([[0, "#fff6d0"], [.6, "#e8b84a"], [1, "#8f6418"]], .35, .3, .8), bordo(L, .55)) + cer(mm[0], mm[1], .6, "#7a5614");   // il fiore dell'abaco (sotto, sul cesto)
    });
    var top = [lato(cS[0], mS[0], cS[1], 200), lato(cS[1], mS[1], cS[2], 200), lato(cS[2], mS[2], cS[3], 200), lato(cS[3], mS[3], cS[0], 200)];
    s += pth("M" + q(top[0][0]) + top.map(function (l) { return " Q" + q(l[1]) + " " + q(l[2]); }).join("") + " Z", lin("abt", [[0, "#fff4c4"], [1, "#e2b444"]], 0, 0, 1, 1), bordo(L, 1));
    return s;
  });

  // =========================================================
  //  VASO DORATO CON LA PALMA: il vaso a campana (come il vaso Medici) d'oro lucido sul plinto, la pancia a baccellature,
  //  i manici a ricciolo, il festone in rilievo e gli ovoli sotto l'orlo; dentro la palma Kentia, con le fronde ad arco
  //  e le foglioline lunghe che ricadono
  // =========================================================
  def("vaso_dorato", { nome: "Vaso dorato con la palma", fp: [1, 1], box: [-90, -170, 92, 24] }, function () {
    var base = ombraPianta(-.24, .24, -.24, .24, 1.1, .1) + blocco(-.21, .21, -.21, .21, 0, 5, oroT(), null, 1.6), s = "", r = rnd(1866), i, j, cose = [];   // l'ombra e il plinto
    var piede = [[5, .16], [6.2, .172], [7.6, .166], [8.5, .132], [10, .096], [12.5, .086], [13.6, .1], [14.4, .128]];
    var pancia = [[14.4, .132], [15.6, .19], [18, .236], [21.5, .262], [25, .27], [28, .258], [30.4, .238]];
    var cint = [[30.2, .244], [31, .254], [32.4, .254], [33.2, .236]];
    var campana = [[33.2, .232], [37, .233], [41, .241], [45, .255], [49, .276], [52.6, .3], [54.6, .312]];
    s += tornito(0, 0, piede, DORATO, 1.3, [2, 5], .7);
    // la pancia a baccellature (spicchi tondi, ognuno col suo lucido)
    var dP = dTornito(0, 0, pancia), bac = "";
    function rP(z) { for (var k = 1; k < pancia.length; k++) if (z <= pancia[k][0]) { var t = (z - pancia[k - 1][0]) / (pancia[k][0] - pancia[k - 1][0]); return pancia[k - 1][1] + (pancia[k][1] - pancia[k - 1][1]) * t; } return pancia[pancia.length - 1][1]; }
    for (i = 0; i < 16; i++) {
      var p0 = -Math.PI / 2 + i * Math.PI / 8, pm = p0 + Math.PI / 16, sol = [], lu = [];
      for (j = 0; j <= 8; j++) { var z = 14.8 + j * 15.4 / 8; sol.push(suCilindro(0, 0, rP(z) * .995, p0, z)); lu.push(suCilindro(0, 0, rP(z) * 1.01, pm - .09, z)); }
      if (Math.cos(p0) > -.2) bac += tratto(liscio(sol), "#5c3c0a", .8, op(.75)) + tratto(liscio(sposta(sol, .6, .2)), "#fff3c4", .35, op(.4));
      if (Math.cos(pm) > .05) bac += tratto(liscio(lu), "#fffbe6", .7 + .9 * Math.cos(pm), op(.35 + .35 * Math.max(0, Math.cos(pm + .5))));
    }
    s += pth(dP, lin("pa", DORATO, -19, 0, 19, 0, true), bordo(L, 1.4)) + dentro(dP, bac);
    // i manici a ricciolo (sui due fianchi)
    [-1, 1].forEach(function (sg) {
      var x0 = sg * .262 * 70.71, d = "M" + q(x0 - sg * 1, -29.5) + " C" + q(x0 + sg * 6.5, -33) + " " + q(x0 + sg * 8.5, -25) + " " + q(x0 + sg * 4.2, -22.6) + " C" + q(x0 + sg * 1.8, -21.6) + " " + q(x0 + sg * 1.6, -24.6) + " " + q(x0 + sg * 3.6, -25.2);
      s += tratto(d, L, 3.6) + tratto(d, sg < 0 ? "#f3d27a" : "#b8861f", 2) + tratto(d, "#fff6cf", .6, op(.8) + " " + trasla(-.3, -.4));
    });
    s += tornito(0, 0, cint, OTTONE, 1.1, [1], .6);
    // la campana col festone in rilievo e gli ovoli sotto l'orlo
    var dC = dTornito(0, 0, campana), dec = "";
    function rC(z) { for (var k = 1; k < campana.length; k++) if (z <= campana[k][0]) { var t = (z - campana[k - 1][0]) / (campana[k][0] - campana[k - 1][0]); return campana[k - 1][1] + (campana[k][1] - campana[k - 1][1]) * t; } return campana[campana.length - 1][1]; }
    for (i = -2; i <= 2; i++) {   // i festoni appesi tra le rosette
      var a0 = i * .62 - .31, a1 = a0 + .62, fp = [];
      for (j = 0; j <= 10; j++) { var aa = a0 + (a1 - a0) * j / 10, zf = 46 - 5.2 * Math.sin(Math.PI * j / 10); fp.push(suCilindro(0, 0, rC(zf) + .006, aa, zf)); }
      if (Math.cos(a0) > -.1 || Math.cos(a1) > -.1) dec += tratto(liscio(fp), "#6e4a10", 3.2, op(.8)) + tratto(liscio(fp), "#f6d572", 2, op(.95)) + tratto(liscio(sposta(fp, -.3, -.6)), "#fffbe6", .6, op(.8));
      [a0, a1].forEach(function (aa) { if (Math.cos(aa) > 0) { var c = suCilindro(0, 0, rC(46) + .008, aa, 46.4); dec += cer(c[0], c[1], 1.8, "#f6d572", bordo("#6e4a10", .5)) + cer(c[0] - .4, c[1] - .5, .6, "#fffbe6"); } });
    }
    for (i = 0; i < 22; i++) { var ao = -Math.PI / 2 + (i + .5) * Math.PI / 22, co = suCilindro(0, 0, rC(52.4) + .004, ao, 52.4); if (Math.cos(ao) > .08) dec += ell(co[0], co[1], 1.25 * Math.cos(ao) + .3, 1.5, "#f8d978", "stroke='#7a5614' stroke-width='.4'"); }
    var lc = []; for (j = 0; j <= 10; j++) { var zl = 33.4 + j * 21 / 10; lc.push(suCilindro(0, 0, rC(zl), -.5, zl)); }
    dec += tratto(aperto(lc), "#ffffff", 3, op(.25)) + tratto(aperto(lc), "#ffffff", 1, op(.65));
    s += pth(dC, lin("ca", DORATO, -22.1, 0, 22.1, 0, true), bordo(L, 1.4)) + dentro(dC, dec);
    // l'orlo arrotolato e, dentro, la parete di dietro e la terra col muschio
    s += tornito(0, 0, [[54.6, .312], [55.4, .33], [57, .337], [58, .331], [58.5, .32]], DORATO, 1.2, null, .7);
    var bocca = anello(0, 0, 58.3, .3), dB = dEll(bocca.x, bocca.y, bocca.rx, bocca.ry), terra = anello(0, 0, 55.6, .3), tt = "";
    tt += ell(bocca.x, bocca.y, bocca.rx, bocca.ry, lin("in", [[0, "#5a3e0c"], [1, "#2e2006"]], 0, 0, 0, 1));
    tt += ell(terra.x, terra.y, terra.rx, terra.ry, nuovaR([[0, "#6b4a2e"], [.7, "#4a3020"], [1, "#2e1c10"]], .45, .4, .6));
    for (i = 0; i < 26; i++) { var ra = r() * 6.28, rr2 = Math.sqrt(r()) * .27, mc = P(Math.cos(ra) * rr2, Math.sin(ra) * rr2, 55.8); tt += ell(mc[0], mc[1], 1.3 + r() * 1.5, .7 + r() * .6, ["#5f8a3a", "#7da64a", "#4a6e2c"][i % 3], op(.8)); }
    s += dentro(dB, tt) + pth(dB, "none", bordo(L, .9)) + tratto(arcoDav(anello(0, 0, 58.4, .326)), "#fffbe6", .7, op(.75));
    // la palma Kentia: ogni fronda sale dritta dalla terra col suo gambo, poi si apre ad arco verso fuori e la punta ricade;
    // [direzione°, quanto si apre (m), quanto sale l'arco (m), dove arriva la punta (m sopra la terra), le foglioline (0 = ancora chiusa)]
    var C = [0, 0, .915], FR = [[-160, .62, 1.05, .62, 1], [-100, .7, 1.12, .58, 1], [-35, .64, 1.0, .6, 1], [30, .72, 1.1, .56, 1], [100, .66, 1.04, .62, 1], [165, .7, 1.0, .6, 1],
      [-130, .86, .78, .34, 1], [-65, .9, .74, .3, 1], [5, .88, .8, .32, 1], [70, .92, .76, .3, 1], [135, .86, .8, .34, 1], [-15, .14, 1.22, 1.12, 0], [55, .18, 1.16, 1.02, 0]];
    simbolo("fg", "M0,0 C.2,.5 .65,.45 1,0 C.65,-.45 .2,-.5 0,0 Z");
    function bez3(a, b, c, t) { var u = 1 - t; return add(add(mul(a, u * u), mul(b, 2 * u * t)), mul(c, t * t)); }
    FR.forEach(function (f) {
      var ph = f[0] / 57.296 + (r() - .5) * .14, h = [Math.cos(ph), Math.sin(ph), 0], ns = 18, pp = [];
      var P0 = add(C, mul(h, .025)), P1 = add(P0, add(mul(h, f[1] * .18), [0, 0, f[2] * 1.25])), P2 = add(P0, add(mul(h, f[1]), [0, 0, f[3]]));
      for (j = 0; j <= ns; j++) pp.push(bez3(P0, P1, P2, j / ns));
      for (j = 1; j <= ns; j++) {
        var a = pp[j - 1], b = pp[j], T1 = norma(sub(b, a)), lato2 = norma(crs(T1, [0, 0, 1])), t = j / ns, mid0 = mista(a, b, .5);
        var sa = S3(a), sb = S3(b);
        cose.push([prof3(mid0), tratto(linea(sa, sb), "#2b4716", 2.1 - t * 1.2) + tratto(linea(sa, sb), t < .35 ? "#7c9a3e" : "#9cc054", .85 - t * .5), mid0]);   // il gambo e la costola
        if (t < .36) continue;   // il primo tratto è il gambo nudo
        [-1, 1].forEach(function (sg) {
          [0, .5].forEach(function (off) {   // due foglioline per lato in ogni pezzo: la fronda è folta
            var c0 = mista(a, b, .25 + off), tt = (t - .36) / .64;
            var dl = f[4] ? norma(add(add(mul(T1, .42), mul(lato2, sg * .78)), [0, 0, -.5 - .25 * tt])) : norma(add(mul(T1, .9), mul(lato2, sg * .22)));
            var ll = f[4] ? .27 * (1 - .62 * tt) + .045 : .16 * (1 - .5 * tt) + .03, ww = f[4] ? .024 : .016;
            var N0 = norma(crs(dl, T1)); if (N0[2] < 0) N0 = mul(N0, -1);
            var col = coloreFoglia(N0, "#93d867", "#1a5726", "#a3c98a", (r() - .5) * .14 + .02), mid = add(c0, mul(dl, ll * .5));
            cose.push([prof3(mid), usa("fg", mat3(c0, mul(dl, ll), mul(crs(N0, dl), ww)), "fill='" + col + "' stroke='" + scuro(col, .52) + "' stroke-width='.4'"), mid]);
          });
        });
      }
    });
    // le basi delle fronde (fibrose) sopra la terra
    for (i = 0; i < 6; i++) { var an = i / 6 * 6.28, cb = P(Math.cos(an) * .035, Math.sin(an) * .035, 57); cose.push([prof3([0, 0, .93]), ell(cb[0], cb[1] - 1.4, 1.6, 3, ["#5c7a2a", "#4a6624", "#6b8a30"][i % 3], bordo(L, .5)), [0, 0, .93]]); }
    // le foglie che ricadono dietro il vaso (più basse dell'orlo) si disegnano prima: il vaso le copre
    var dietroV = [], restoV = [];
    cose.forEach(function (x) { var pt = x[2], rr = Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1]); if (pt[2] < .97 && rr > .3 && (pt[0] + pt[1]) * G < 0) dietroV.push(x); else restoV.push(x); });
    return base + ordina(dietroV) + s + ordina(restoV);
  });

  // =========================================================
  //  STATUA CLASSICA: la dea Fortuna di marmo bianco (la veste lunga con le pieghe, il mantello di traverso,
  //  la cornucopia piena di frutta e di monete d'oro) sul piedistallo di marmo verde con le cornici e la ghirlanda d'oro
  // =========================================================
  var VERDE_M = "#2f6352";   // il marmo verde del piedistallo
  var BIANCO_M = [[0, "#f4f1ea"], [.2, "#ffffff"], [.5, "#f1ece2"], [.78, "#d6cdbd"], [1, "#a69a86"]];   // il marmo bianco della statua
  def("statua", { nome: "Statua della Fortuna", fp: [1, 1], box: [-42, -160, 44, 26], dietro: true }, function () {
    var s = ombraPianta(-.33, .33, -.33, .33, 1.1, .12);
    function venaV(W, H) { return venato(W, H, 71 + Math.round(W), "#cfe8dc", 5, .5) + venato(W, H, 91 + Math.round(H), "#163a2e", 3, .5); }
    var vt = [lin("vs", [[0, chiaro(VERDE_M, .3)], [1, chiaro(VERDE_M, .1)]], 0, 0, 1, 1), lin("vl", [[0, chiaro(VERDE_M, .14)], [1, scuro(VERDE_M, .08)]], 0, 0, 0, 1), lin("vd", [[0, scuro(VERDE_M, .25)], [1, scuro(VERDE_M, .45)]], 0, 0, 0, 1)];
    function pannelloV(medaglia) { return function (W, H) {
      var o = venaV(W, H) + rett(5, 5, W - 10, H - 10, 1, "none", "stroke='#e2b444' stroke-width='1.1'") + rett(5.8, 5.8, W - 11.6, H - 11.6, 1, "none", "stroke='#163a2e' stroke-width='.5' opacity='.6'");
      if (medaglia) {   // la ghirlanda d'alloro d'oro col nastro
        var cx = W / 2, cy = H / 2, k, fo = "";
        for (k = 0; k < 14; k++) { var an = Math.PI * .62 + k / 13 * Math.PI * 1.76, x = cx + Math.cos(an) * 7.5, y = cy + Math.sin(an) * 7.5, rot = an * 57.3 + 90; fo += "<ellipse cx='" + f2(x) + "' cy='" + f2(y) + "' rx='1' ry='2.3' transform='rotate(" + f2(rot + (k % 2 ? 28 : -28)) + " " + f2(x) + " " + f2(y) + ")' fill='#f2c94c' stroke='#7a5614' stroke-width='.35'/>"; }
        o += tratto("M" + q(cx - 2.5, cy + 7.5) + " L" + q(cx - 5, cy + 12) + " M" + q(cx + 2.5, cy + 7.5) + " L" + q(cx + 5, cy + 12), "#e2b444", 1.1) + fo + cer(cx, cy + 7.5, 1.3, "#f8de8a", bordo("#7a5614", .4));
      }
      return o;
    }; }
    s += blocco(-.335, .335, -.335, .335, 0, 5, vt, { davanti: function (W, H) { return venaV(W, H); }, dietro: function (W, H) { return venaV(W, H); }, fianco: function (W, H) { return venaV(W, H); } }, 1.8);
    s += blocco(-.275, .275, -.275, .275, 5, 41, vt, { davanti: pannelloV(true), dietro: pannelloV(false), fianco: pannelloV(false) }, 1.8);
    s += blocco(-.3, .3, -.3, .3, 41, 43, oroT(), null, 1.2);
    s += blocco(-.32, .32, -.32, .32, 43, 48, vt, { davanti: function (W, H) { return venaV(W, H); }, dietro: function (W, H) { return venaV(W, H); }, fianco: function (W, H) { return venaV(W, H); } }, 1.8);
    s += tornito(0, 0, [[48, .21], [50, .212], [51, .2], [51.6, .182]], BIANCO_M, 1.2);   // il basamento tondo della statua
    return s + "<g transform='translate(0 -50.6)'>" + (G > 0 ? fortunaDavanti() : fortunaDietro()) + "</g>";
  });
  function fortunaDavanti() {   // la dea vista da davanti (girata un po' a sinistra); y = 0 sul basamento, in su negativo
    var s = "", mb = lin("mb", BIANCO_M, -16, 0, 18, 0, true), mbS = lin("mbs", [[0, "#ffffff"], [.6, "#e9e3d8"], [1, "#b9ae9b"]], -16, 0, 18, 0, true);
    function piega(pp, w) { return tratto(liscio(pp), "#a89d8a", w || .7, op(.75)) + tratto(liscio(sposta(pp, -.7, 0)), "#ffffff", (w || .7) * .6, op(.85)); }
    // i piedi sotto l'orlo
    s += pth("M-9.6,-1.6 C-9.8,-3.6 -5.6,-3.8 -5,-1.6 C-5.2,.2 -9.4,.4 -9.6,-1.6 Z", mbS, bordo(L, .9)) + pth("M4.2,.2 C4,-2.2 8.8,-2.6 9.2,-.2 C9,1.8 4.4,2 4.2,.2 Z", mbS, bordo(L, .9));
    // la veste lunga, dai fianchi all'orlo (la gamba sinistra piegata in avanti)
    var gonna = "M-8.6,-55 C-11.6,-49 -12.4,-44 -12.6,-36 C-12.8,-24 -13.6,-12 -14.8,-3.4 C-12.8,-1.6 -11,-3 -9.8,-2.2 C-8,-1.2 -6.4,-3 -4.6,-2.4 C-2.6,-1.4 -.8,-3 1.2,-2.2 C3,-1.2 4.6,-2.8 6.4,-2 C8.4,-.9 10.6,-2.6 12.8,-1.6 C13.8,-8 13.4,-16 12.6,-26 C12.2,-36 12,-46 9.4,-55 Z";
    s += pth(gonna, mb, bordo(L, 1.3));
    var pg = piega([[-9, -50], [-9.8, -34], [-10.6, -18], [-11.8, -3.2]]) + piega([[-5, -52], [-5.6, -36], [-6.2, -20], [-6.8, -2.8]]) + piega([[-1.2, -52], [-1.4, -38], [-2, -22], [-2.4, -2.6]]) +
      piega([[2.6, -50], [3.4, -40], [2.6, -30]]) + piega([[9.6, -48], [10.6, -32], [11, -16], [11.4, -2.4]]) + piega([[3.6, -18], [4.6, -10], [5.4, -2.4]]) + piega([[7.2, -20], [8, -11], [8.6, -2.6]]);
    pg += tratto("M3.4,-29.4 Q6,-30.6 8.4,-28.6", "#ffffff", 1.4, op(.45)) + tratto("M3,-22 Q5.6,-20.2 8.2,-22.2", "#a89d8a", .5, op(.3));   // il ginocchio piegato sotto la stoffa
    s += dentro(gonna, pg + rett(4, -60, 12, 60, 0, "#8e826c", op(.1)));
    // il busto con la cintura sotto il petto
    var busto = "M-8.6,-55 C-9.6,-60 -10.4,-66 -11.4,-72.6 C-8.6,-74.6 -6,-75.2 -4.2,-74.4 C-2.6,-72.6 -.4,-72.2 1.6,-73.8 C4,-75 7.4,-74.6 10.4,-72.6 C10.2,-66 9.8,-60 9.4,-55 Z";
    s += pth(busto, mb, bordo(L, 1.2)) + dentro(busto, piega([[-7.6, -72], [-4.6, -64], [-3.6, -58]], .55) + piega([[-3.4, -73], [-1.6, -66], [-.6, -59]], .55) + piega([[6.4, -73.4], [3.6, -66], [2.4, -59]], .55) + ell(-4.6, -66.5, 3, 3.4, "#ffffff", op(.4)) + ell(4.2, -66.4, 3, 3.4, "#d6cdbd", op(.35)));
    s += tratto("M-9.4,-61.8 Q0,-60.2 9.6,-62", L, 2.4) + tratto("M-9.4,-61.8 Q0,-60.2 9.6,-62", "#efe9de", 1.4) + cer(.4, -61, 1.2, "#f4f1ea", bordo(L, .6));
    // il mantello: dalla spalla sinistra (a destra) giù di traverso sui fianchi, con le pieghe a festone
    var manto = "M9.8,-73 C12.6,-66 13.6,-58 13.2,-50 C12.6,-44 10,-41.4 5,-40.6 C-1,-40 -7.4,-41 -12.8,-43.4 C-13.6,-40 -13.4,-36 -12.2,-33 C-10.2,-37.4 -7.8,-38.6 -6.2,-38 C-9,-43.2 -6,-46.8 0,-47.4 C5,-48.6 8.2,-52.4 8.6,-58 C8.8,-64 8.4,-69 9.8,-73 Z";
    s += pth(manto, mbS, bordo(L, 1.2)) + dentro(manto, piega([[-11, -42], [-4, -44.4], [3, -45.6], [9.6, -50]], .6) + piega([[-8.6, -40.8], [-1, -42], [6, -43.6], [11.6, -47]], .6) + piega([[10.4, -70], [11.2, -62], [11.6, -54]], .5));
    // il braccio destro (a sinistra) lungo il fianco, che tiene un lembo del mantello
    var braccio = "M-11.4,-72.6 C-14,-71 -15.4,-66 -15.6,-60 C-15.8,-53 -15,-48 -14.4,-44.2 C-13.6,-42.4 -11.6,-42.4 -11.4,-44 C-11.8,-49 -12.4,-55 -11.8,-61 C-11.4,-65 -10.8,-69 -11.4,-72.6 Z";
    s += pth(braccio, mb, bordo(L, 1.1)) + tratto("M-14.8,-66 Q-12.6,-64 -11.4,-66.6", "#a89d8a", .6, op(.7)) + pth("M-15,-45.6 C-15.4,-43 -14,-40.8 -12.2,-41.6 C-11,-42.6 -11.4,-45 -12.6,-45.8 Z", mbS, bordo(L, .9));
    // la cornucopia: il corno a spirale che sale lungo il braccio sinistro, la bocca piena di frutta e monete d'oro
    var corno = "M3.4,-47.6 C8,-49.6 14.2,-53 16.6,-60 C18.4,-66 18.2,-73 17.6,-79.6 C14.6,-80.8 11.4,-80.6 9.2,-79.2 C10.4,-73.6 11,-67 9.8,-61.6 C8.6,-56.6 6.2,-52 3.4,-47.6 Z";
    s += pth(corno, lin("co", [[0, "#ffffff"], [.5, "#ece6da"], [1, "#b3a792"]], 8, 0, 18.6, 0, true), bordo(L, 1.1));
    s += dentro(corno, [[-52, .1], [-57, .25], [-62, .4], [-67, .55], [-72, .7], [-76.6, .85]].map(function (v) { var y = v[0]; return tratto("M" + q(4 + v[1] * 6, y + 4) + " Q" + q(10 + v[1] * 3, y + 1) + " " + q(18.6, y - 2), "#a89d8a", .6, op(.8)) + tratto("M" + q(4 + v[1] * 6, y + 3.2) + " Q" + q(10 + v[1] * 3, y + .2) + " " + q(18.6, y - 2.8), "#ffffff", .4, op(.7)); }).join(""));
    var bocca = "M8.8,-79.4 C10.6,-82.4 16,-83 18.2,-80 C16.6,-77.8 11,-77.6 8.8,-79.4 Z";
    s += pth(bocca, "#7c705c", bordo(L, 1));
    // la frutta (bianca, di marmo: l'uva, la mela, la pera, le foglie) e le monete d'oro che cadono
    s += cer(11.6, -83.2, 2.6, lin("me", BIANCO_M, 9, 0, 14.2, 0, true), bordo(L, .7)) + pth("M14.4,-82 C14,-86.6 17.6,-87.6 18.2,-84 C18.4,-82 16.2,-80.8 14.4,-82 Z", mbS, bordo(L, .7));
    [[9.4, -82.2], [8.4, -83.8], [9.6, -84.8], [10.6, -86.2], [8.6, -85.8]].forEach(function (u) { s += cer(u[0], u[1], 1.15, "#f1ece2", bordo(L, .45)) + cer(u[0] - .35, u[1] - .35, .35, "#ffffff"); });
    s += pth("M13.4,-86 C12.4,-90 15.6,-91.4 16.2,-88.4 C15.6,-87 14.6,-86.2 13.4,-86 Z", "#ece6da", bordo(L, .6));
    [[17.8, -79.4, 0], [18.8, -77.2, 1], [17.6, -75.2, 0], [19.4, -74.4, 1]].forEach(function (m) { s += ell(m[0], m[1], 1.4, m[2] ? .7 : 1.2, lin("mo", [[0, "#fff3c2"], [.5, "#f2c94c"], [1, "#9c6f1c"]], 0, 0, 1, 1), bordo("#6e4a10", .4)); });
    // il braccio sinistro piegato che regge il corno
    var bsx = "M10.4,-72.6 C12.6,-71.2 13.8,-66.8 13.6,-62.4 C13.4,-59.6 11.6,-58.2 9.6,-58.4 C7.8,-58.6 6.4,-60.2 6.8,-61.6 C8.6,-61.6 10.2,-62.4 10.6,-64.2 C10.8,-67 10.2,-70 10.4,-72.6 Z";
    s += pth(bsx, mb, bordo(L, 1.1)) + pth("M6.4,-60.8 C5.8,-62.8 7.4,-64.4 9,-63.4 C9.8,-62.4 9.4,-60.6 8,-60.2 Z", mbS, bordo(L, .8));
    // il collo e la testa: il profilo verso sinistra, i capelli raccolti nella crocchia, il diadema
    s += pth("M-3.6,-73.4 C-3.6,-75.6 -3.4,-77.4 -3.2,-78.6 L1.4,-78.8 C1.4,-77 1.8,-75.2 2.6,-73.6 Z", mb, bordo(L, 1));
    var testa = "M-2.6,-78.4 C-5.4,-78.8 -6.6,-81.6 -6.4,-83.2 C-7.4,-84 -7.4,-85 -6.4,-85.4 C-6.6,-89.6 -4,-91.8 -.8,-91.8 C3,-91.8 5,-89 5,-85.4 C5,-81.6 2.6,-78.2 -2.6,-78.4 Z";
    s += pth(testa, lin("vi", [[0, "#ffffff"], [.6, "#efe9de"], [1, "#c6bcab"]], -7, 0, 5, 0, true), bordo(L, 1.1));
    s += ell(-4.4, -85.2, 1.2, .7, "#b9ae9b", op(.55)) + ell(-.9, -85.3, 1.2, .7, "#b9ae9b", op(.5)) + tratto("M-5.6,-86.6 Q-4.3,-87.3 -3.1,-86.6 M-2.1,-86.7 Q-.9,-87.4 .3,-86.7", "#a89d8a", .45, op(.8)) + tratto("M-4.3,-80.9 L-2.9,-80.9", "#a89d8a", .45, op(.8)) + ell(-5.3, -82.6, .9, .6, "#c9bfae", op(.5));   // gli occhi senza pupille delle statue, le sopracciglia, la bocca appena accennata
    var capelli = "M-6.6,-86.4 C-7,-90.6 -3.6,-93.6 .2,-93.2 C4.4,-92.8 6.8,-89.2 6.2,-85 C5.8,-82.8 4.6,-81.4 3.4,-80.6 C3.8,-83 3.4,-85.4 1.8,-87.2 C-.6,-88.4 -3.6,-88.2 -6.6,-86.4 Z";
    s += pth(capelli, lin("ca", [[0, "#ffffff"], [.5, "#ebe5d9"], [1, "#b9ae9b"]], -7, 0, 7, 0, true), bordo(L, 1));
    s += tratto("M-5.4,-88.2 Q-2,-91.4 3.4,-89.6 M-4.4,-89.8 Q-.4,-92.6 4.6,-88.2 M1.6,-87.4 Q4.6,-86 4.4,-82.4", "#a89d8a", .5, op(.8));
    s += cer(5.6, -86.6, 3.1, lin("cr", [[0, "#ffffff"], [1, "#c4b9a6"]], 2.6, 0, 8.8, 0, true), bordo(L, .9)) + tratto("M3.8,-87.8 Q5.8,-85.2 7.6,-87.4 M4,-85.8 Q5.8,-84 7.8,-85.4", "#a89d8a", .45);   // la crocchia
    s += tratto("M-5.8,-88.6 Q-1,-92.8 4.2,-90.4", L, 2.2) + tratto("M-5.8,-88.6 Q-1,-92.8 4.2,-90.4", "#f8f5ee", 1.3);   // il diadema
    s += ell(-3.4, -88.6, 1.2, 2.2, "#ffffff", op(.55));
    return s;
  }
  function fortunaDietro() {   // la dea vista da dietro: la crocchia, la schiena, il mantello sulla spalla e la bocca della cornucopia che spunta
    var s = "", mb = lin("mb", BIANCO_M, -16, 0, 18, 0, true), mbS = lin("mbs", [[0, "#ffffff"], [.6, "#e9e3d8"], [1, "#b9ae9b"]], -16, 0, 18, 0, true);
    function piega(pp, w) { return tratto(liscio(pp), "#a89d8a", w || .7, op(.75)) + tratto(liscio(sposta(pp, -.7, 0)), "#ffffff", (w || .7) * .6, op(.85)); }
    s += pth("M-8.8,-1.8 C-9,-3.4 -6,-3.6 -5.4,-1.8 C-5.6,-.6 -8.6,-.4 -8.8,-1.8 Z", mbS, bordo(L, .9)) + pth("M5.2,-1.6 C5,-3.2 8.2,-3.4 8.6,-1.6 C8.4,-.4 5.4,-.2 5.2,-1.6 Z", mbS, bordo(L, .9));   // i talloni
    var gonna = "M-9.4,-55 C-12,-49 -12.6,-44 -12.8,-36 C-13,-24 -13.6,-12 -14.6,-3.4 C-12.6,-1.8 -10.8,-3.2 -9.4,-2.4 C-7.8,-1.4 -6.2,-3 -4.4,-2.4 C-2.4,-1.6 -.6,-3 1.4,-2.4 C3.2,-1.4 4.8,-2.8 6.6,-2.2 C8.6,-1.2 10.8,-2.6 12.8,-1.8 C13.8,-8 13.6,-16 13,-26 C12.6,-36 12.4,-46 9.4,-55 Z";
    s += pth(gonna, mb, bordo(L, 1.3)) + dentro(gonna, piega([[-8, -50], [-9, -34], [-10.4, -18], [-11.6, -3]]) + piega([[-3.6, -52], [-4, -36], [-4.4, -20], [-4.8, -2.6]]) + piega([[.8, -52], [1.2, -36], [1.4, -20], [1.6, -2.6]]) + piega([[5.4, -51], [6, -34], [6.6, -18], [7.2, -2.4]]) + piega([[9.4, -48], [10.4, -32], [11, -16], [11.6, -2.4]]) + rett(4, -60, 12, 60, 0, "#8e826c", op(.1)));
    // la bocca della cornucopia (davanti a lei) che spunta sopra la spalla sinistra: l'orlo, la frutta e una moneta d'oro
    s += "<g transform='translate(3.6 1.6)'><g transform='rotate(-14 -12.6 -78.6)'>" + pth("M-16.6,-78.4 C-15.2,-80.8 -10.4,-81 -9,-78.4 C-10.4,-76.6 -15,-76.4 -16.6,-78.4 Z", "#8a7e6a", bordo(L, .9)) + tratto("M-16.2,-78.6 C-14.6,-80.2 -10.8,-80.4 -9.4,-78.6", "#ffffff", .5, op(.8)) + "</g>";
    s += cer(-13.6, -80.6, 2.3, mbS, bordo(L, .7)) + cer(-10.8, -81.2, 1.5, "#f1ece2", bordo(L, .5)) + cer(-15.8, -80.4, 1.2, "#f1ece2", bordo(L, .45)) + pth("M-12.6,-82.4 C-13.4,-85.4 -10.8,-86.4 -10.2,-84 C-10.6,-83 -11.4,-82.4 -12.6,-82.4 Z", "#ece6da", bordo(L, .55)) + ell(-17, -78.2, 1.2, .9, "#f2c94c", bordo("#6e4a10", .4)) + "</g>";   // (appena sopra la spalla: la testa e la spalla la coprono un po')
    var busto = "M-9.4,-55 C-10.2,-60 -10.8,-66 -11.2,-72.4 C-6,-75 6,-75.4 10.6,-72.6 C10.4,-66 10,-60 9.4,-55 Z";
    s += pth(busto, mb, bordo(L, 1.2)) + dentro(busto, ell(-.6, -66, 1.2, 6, "#c9bfae", op(.45)) + piega([[-8, -72], [-6.4, -64], [-6, -57]], .5) + piega([[7.8, -72.4], [6.6, -64], [6, -57]], .5));
    s += tratto("M-9.8,-61.6 Q0,-60.4 9.6,-61.8", L, 2.4) + tratto("M-9.8,-61.6 Q0,-60.4 9.6,-61.8", "#efe9de", 1.4);
    // il braccio sinistro (qui a sinistra): si vede fino al gomito, l'avambraccio va avanti a reggere il corno
    s += pth("M-11.2,-72.4 C-13.8,-71 -15,-67 -15.2,-62.6 C-15.2,-60 -13.6,-58.6 -11.8,-59.2 C-10.6,-62 -10.4,-67 -11.2,-72.4 Z", mb, bordo(L, 1.1));
    // il mantello sulla spalla sinistra che scende di traverso sulla schiena
    var manto = "M-11.4,-73 C-7,-74.6 -3,-72 0,-66 C3,-60 7.4,-52 13,-48 C13.6,-44 12.4,-41.6 9.6,-41.2 C4,-42.6 -1.4,-46.6 -5.2,-52 C-8.6,-57 -11.4,-63 -12.6,-68 Z";
    s += pth(manto, mbS, bordo(L, 1.2)) + dentro(manto, piega([[-10.6, -70], [-6, -64], [-1, -56], [6, -48.6], [11, -45]], .6) + piega([[-7.6, -72.6], [-3, -66], [2.6, -58], [9, -50.6]], .6));
    // il braccio destro (qui a destra) lungo il fianco
    var braccio = "M10.6,-72.6 C13.4,-71 14.8,-66 15,-60 C15.2,-53 14.6,-48 14,-44.4 C13.2,-42.6 11.4,-42.8 11.2,-44.4 C11.6,-49 12,-55 11.4,-61 C11,-65 10.4,-69 10.6,-72.6 Z";
    s += pth(braccio, mb, bordo(L, 1.1)) + pth("M14.6,-45.6 C15,-43 13.6,-40.8 11.8,-41.6 C10.8,-42.6 11.2,-45 12.4,-45.8 Z", mbS, bordo(L, .9));
    // la nuca, i capelli con la crocchia, il nastro del diadema
    s += pth("M-2.8,-73.6 C-2.8,-75.6 -2.6,-77.4 -2.4,-78.6 L2.4,-78.6 C2.6,-77 2.8,-75.2 3,-73.6 Z", mbS, bordo(L, 1));
    var testa = "M-6,-84.4 C-6.4,-89.6 -3.6,-92.8 .2,-92.8 C4,-92.8 6.6,-89.6 6.2,-84.4 C5.8,-80.6 3,-78.2 .2,-78.2 C-2.8,-78.2 -5.6,-80.6 -6,-84.4 Z";
    s += pth(testa, lin("ca", [[0, "#ffffff"], [.5, "#ebe5d9"], [1, "#b9ae9b"]], -6.5, 0, 6.5, 0, true), bordo(L, 1.1));
    s += tratto("M-5,-87.8 Q-3,-84 -1.8,-80.4 M-2.4,-90.6 Q-1,-85.6 -.6,-80.6 M1,-91.2 Q1.4,-86 .8,-80.6 M3.8,-89.6 Q3,-85 2,-80.4 M5.6,-86 Q4.4,-83 3,-80.6", "#a89d8a", .5, op(.85));   // le ciocche tirate verso la crocchia
    s += ell(.3, -80.2, 3.6, 2.5, lin("cr", [[0, "#ffffff"], [1, "#c4b9a6"]], -3.3, 0, 3.9, 0, true), bordo(L, .9)) + tratto("M-2.6,-81.2 L.4,-78.4 M-1,-82.4 L2.6,-79.2 M1,-82.6 L3.4,-80.6", "#a89d8a", .45, op(.9));   // la crocchia sulla nuca, intrecciata
    s += tratto("M-5.8,-87.4 Q.2,-90.6 6,-87.4", L, 2.2) + tratto("M-5.8,-87.4 Q.2,-90.6 6,-87.4", "#f8f5ee", 1.3) + ell(-3, -88.6, 1.2, 2.4, "#ffffff", op(.5));
    return s;
  }

  // =========================================================
  //  FONTANA: la vasca tonda di marmo bianco con le specchiature e le rosette d'oro, l'acqua azzurra con le monetine
  //  sul fondo; tre coppe una sopra l'altra sulle colonnine a balaustro, l'acqua che cade a velo da ogni coppa,
  //  in cima la pigna d'oro col getto. Di notte le luci sott'acqua e l'acqua che brilla
  // =========================================================
  var MARMO_B = [[0, "#e6e8e7"], [.16, "#ffffff"], [.45, "#f1efea"], [.76, "#d3cdc2"], [1, "#958c7f"]];   // il marmo bianco
  def("fontana_casino", { nome: "Fontana", fp: [2, 2], box: [-80, -160, 82, 44], luce: [0, 0, 66, 175, "#86e6ff"] }, function () {
    var s = ombraPianta(-.98, .98, -.98, .98, 1.1, .08), r = rnd(1878), i;
    var ACQ = NOTTE ? [[0, "#f4fffe"], [.3, "#a6f2ff"], [.72, "#3cc8ec"], [1, "#168fc0"]] : [[0, "#d6f6ff"], [.4, "#86d8f0"], [.8, "#3ea8d2"], [1, "#2580b0"]];
    function acqua(e, rr, seme, cadute) {   // il pelo dell'acqua (un ovale): i riflessi, le increspature dove cade il velo
      var o = ell(e.x, e.y, e.rx, e.ry, nuovaR(ACQ, .42, .38, .62)), rq = rnd(seme), k;
      (cadute || []).forEach(function (rc) { [1, 1.12, 1.26].forEach(function (f, j) { var ee = anello(0, 0, 0, rc * f); o += ell(e.x, e.y, ee.rx, ee.ry, "none", "stroke='#ffffff' stroke-width='" + (j ? .5 : .9) + "' opacity='" + (j ? .35 : .6) + "'"); }); });
      for (k = 0; k < 7; k++) { var an = rq() * 6.28, rr2 = (.25 + rq() * .65) * rr, x = e.x + Math.cos(an) * rr2 * 70.71, y = e.y + Math.sin(an) * rr2 * 35.36; o += tratto("M" + q(x - 3, y) + " q1.5,-1 3,0 t3,0", "#ffffff", .5, op(.45)); }
      return o + ell(e.x - e.rx * .3, e.y - e.ry * .35, e.rx * .3, e.ry * .16, "#ffffff", op(NOTTE ? .45 : .35));
    }
    function velo(r0, z0, r1, z1, dietro, n) {   // l'acqua che cade a velo dal bordo di una coppa (la metà davanti o quella dietro)
      var o = "", j, a0 = dietro ? Math.PI / 2 : -Math.PI / 2, a1 = dietro ? Math.PI * 1.5 : Math.PI / 2, top = [], bot = [], k = dietro ? .5 : 1;
      for (j = 0; j <= 28; j++) { var ps = a0 + (a1 - a0) * j / 28; top.push(suCilindro(0, 0, r0, ps, z0)); bot.push(suCilindro(0, 0, r1, ps, z1)); }
      var bt = limiti(top.concat(bot));
      o += pth(aperto(top) + " L" + bot.reverse().map(function (x) { return q(x); }).join(" L") + " Z", nuova([[0, "#ffffff", .55 * k], [.35, NOTTE ? "#c8f8ff" : "#d6f4ff", .32 * k], [1, NOTTE ? "#9ef0ff" : "#bfeaff", .16 * k]], 0, bt[1], 0, bt[3], true));
      for (j = 0; j < n; j++) {
        var ps2 = a0 + (a1 - a0) * (j + .2 + r() * .6) / n, A = suCilindro(0, 0, r0 * 1.01, ps2, z0), C = suCilindro(0, 0, r0 + .05, ps2, z0 - 2.5), B = suCilindro(0, 0, r1, ps2, z1);
        o += tratto("M" + q(A) + " Q" + q(C) + " " + q(B), "#ffffff", .5 + r() * .8, op((.35 + r() * .45) * k));
      }
      for (j = 0; j < n * .8; j++) { var ps3 = a0 + (a1 - a0) * r(), c = suCilindro(0, 0, r1 * (1 + r() * .06), ps3, z1 + .8 + r() * 2.5); o += ell(c[0], c[1], .7 + r() * 1.2, .5 + r() * .7, "#ffffff", op((.5 + r() * .4) * k)); }   // gli spruzzi
      return o;
    }
    function balaustro(z0, z1, rr, oro) {   // la colonnina sotto una coppa, con gli anelli d'oro (si vede la metà davanti)
      var h = z1 - z0, pr = [[z0, rr * 1.15], [z0 + h * .08, rr * 1.15], [z0 + h * .14, rr * .85], [z0 + h * .3, rr * .7], [z0 + h * .48, rr * .95], [z0 + h * .62, rr * 1.05], [z0 + h * .74, rr * .8], [z0 + h * .86, rr * .62], [z0 + h * .94, rr * .8], [z0 + h, rr * .95]];
      var o = tornito(0, 0, pr, MARMO_B, 1.2, [2, 7], .8);
      (oro || []).forEach(function (t) { var zz = z0 + h * t, k2; for (k2 = 1; k2 < pr.length && pr[k2][0] < zz; k2++); var rz = pr[Math.min(k2, pr.length - 1)][1] * 1.06; o += fascia(zz - 1, zz + 1, rz, OTTONE); });
      return o;
    }
    function coppa(rr, z0, z1, seme, cadute) {   // una coppa: la pancia a spicchi sotto, l'orlo col filo d'oro, l'acqua dentro
      var h = z1 - z0, pr = [[z0, rr * .18], [z0 + h * .2, rr * .45], [z0 + h * .45, rr * .72], [z0 + h * .7, rr * .9], [z1 - 2.4, rr], [z1 - 1.8, rr * 1.035], [z1, rr * 1.035], [z1 + .5, rr * 1.0]];
      var dC = dTornito(0, 0, pr), sp = "", j;
      for (j = 0; j < 14; j++) {   // gli spicchi della pancia
        var ps = -Math.PI / 2 + (j + .5) * Math.PI / 14, a = suCilindro(0, 0, rr * .22, ps, z0 + .5), b = suCilindro(0, 0, rr * .9, ps, z0 + h * .7), c = suCilindro(0, 0, rr * .99, ps, z1 - 2.6);
        sp += tratto("M" + q(a) + " Q" + q(b) + " " + q(c), "#9b9286", .55, op(.6)) + tratto("M" + q(a[0] - .5, a[1]) + " Q" + q(b[0] - .6, b[1]) + " " + q(c[0] - .6, c[1]), "#ffffff", .4, op(.6));
      }
      if (NOTTE) sp += ell(0, -z0 - h * .3, rr * 60, h * .9, nuovaR([[0, "#c8f8ff", .55], [1, "#c8f8ff", 0]], .5, .5, .5));   // la luce che sale dall'acqua di sotto
      var o = pth(dC, lin("cp", MARMO_B, -rr * 73, 0, rr * 73, 0, true), bordo(L, 1.3)) + dentro(dC, sp);
      o += tratto(arcoDav(anello(0, 0, z1 - 2.1, rr * 1.035)), "#c99a36", 1.2) + tratto(arcoDav(anello(0, 0, z1 - 2.3, rr * 1.035)), "#fff3c4", .4, op(.8));   // il filo d'oro sull'orlo
      var e = anello(0, 0, z1 + .5, rr * .95), dO = dEll(e.x, e.y, e.rx, e.ry), w = anello(0, 0, z1 - .4, rr * .93);
      o += dentro(dO, ell(e.x, e.y, e.rx, e.ry, lin("cpi", [[0, "#b8b0a4"], [1, "#efebe4"]], 0, 0, 0, 1)) + acqua(w, rr * .93, seme, cadute));
      return o + pth(dO, "none", bordo(L, .8)) + tratto(arcoDav(anello(0, 0, z1 + .5, rr * 1.0)), "#ffffff", .7, op(.8));
    }
    // la vasca: il fianco con le specchiature e le rosette d'oro, l'orlo, l'acqua con le monete sul fondo
    var vasca = [[0, .985], [3, .985], [3.6, .955], [5, .94], [17.5, .935], [19, .952], [21.2, .97], [23.4, .976], [24.8, .966], [25.4, .95]], dV = dTornito(0, 0, vasca), pan = "";
    for (i = 0; i <= 12; i++) {
      var p0 = -Math.PI / 2 + i * Math.PI / 12, l0 = suCilindro(0, 0, .942, p0, 5.4), l1 = suCilindro(0, 0, .942, p0, 17.2);
      pan += tratto(linea(l0, l1), "#a39a8d", 1.4, op(.6)) + tratto(linea([l0[0] - .8, l0[1]], [l1[0] - .8, l1[1]]), "#ffffff", .6, op(.8));
      if (i < 12) { var pc = p0 + Math.PI / 24, cr = suCilindro(0, 0, .945, pc, 11.4), kx = Math.max(.2, Math.cos(pc)); pan += ell(cr[0], cr[1], 2.4 * kx + .3, 2.4, nuovaR([[0, "#fff3c2"], [.55, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), "stroke='" + L + "' stroke-width='.5'") + ell(cr[0], cr[1], .9 * kx + .1, .9, "#a97720"); }
    }
    pan += venePietra(function () { return .94; }, 3, 25, 1881, ["#9a9184", "#b7ae9f"], 4);
    s += pth(dV, lin("va", MARMO_B, -70, 0, 70, 0, true), bordo(L, 1.6)) + dentro(dV, pan) + tratto(arcoDav(anello(0, 0, 19.6, .955)), "#c99a36", 1.5) + tratto(arcoDav(anello(0, 0, 19.9, .955)), "#fff3c4", .5, op(.8));
    var bo = anello(0, 0, 25.2, .9), dB = dEll(bo.x, bo.y, bo.rx, bo.ry), w0 = anello(0, 0, 21.4, .9), fondo = "";
    for (i = 0; i < 9; i++) { var an = r() * 6.28, rm = .25 + r() * .55, mc = P(Math.cos(an) * rm, Math.sin(an) * rm, 21.4); fondo += ell(mc[0], mc[1], 1.5, .8, NOTTE ? "#ffe9a0" : "#e8c060", "stroke='#8a6418' stroke-width='.35' opacity='.85'"); }   // le monetine buttate per fortuna
    if (NOTTE) [-.8, -.27, .27, .8, 1.35, 1.9, 2.45, 3, 3.6, 4.2, 4.8, 5.4].forEach(function (an) { var lc = P(Math.cos(an) * .83, Math.sin(an) * .83, 21); fondo += ell(lc[0], lc[1], 7, 3.5, nuovaR([[0, "#ffffff", .8], [.4, "#bff8ff", .4], [1, "#bff8ff", 0]], .5, .5, .5)) + ell(lc[0], lc[1], 1.5, .9, "#ffffff"); });   // le luci sott'acqua
    s += dentro(dB, ell(bo.x, bo.y, bo.rx, bo.ry, lin("vi", [[0, "#a9a197"], [.6, "#ddd8cf"], [1, "#f4f1ec"]], 0, 0, 0, 1)) + acqua(w0, .9, 11, [.6]) + "<g opacity='.8'>" + fondo + "</g>");
    s += pth(dB, "none", bordo(L, 1)) + tratto(arcoDav(anello(0, 0, 25.3, .965)), "#ffffff", 1, op(.85));
    // le coppe sulle colonnine, coi veli d'acqua (prima la metà dietro, poi la colonnina, la coppa e la metà davanti)
    s += velo(.585, 69.6, .63, 22.2, true, 22) + balaustro(21.4, 60, .13, [.08, .9]) + coppa(.56, 58, 71.4, 21, [.36]) + velo(.585, 69.6, .63, 22.2, false, 26);
    s += velo(.36, 104.4, .38, 70.6, true, 14) + balaustro(70.6, 98, .085, [.85]) + coppa(.34, 96, 106.2, 31, [.2]) + velo(.36, 104.4, .38, 70.6, false, 16);
    s += velo(.195, 127.8, .205, 105.4, true, 9) + balaustro(105.4, 121, .06, null) + coppa(.18, 120, 129.4, 41) + velo(.195, 127.8, .205, 105.4, false, 10);
    // la pigna d'oro col getto d'acqua
    s += tornito(0, 0, [[128.8, .03], [131, .045], [132.5, .03], [133.5, .05], [136, .07], [139, .075], [142, .062], [144.5, .04], [146, .018], [147, .004]], DORATO, 1.1, [3], .7);
    for (i = 0; i < 4; i++) { var yy = -134.5 - i * 2.6, ww = [4.2, 5, 4.6, 3][i]; s += tratto("M" + q(-ww, yy) + " Q0," + f2(yy + 2) + " " + q(ww, yy), "#7a5614", .5, op(.8)); }
    [-1, 1].forEach(function (sg) { [.5, 1].forEach(function (k2) { var d = "M" + q(0, -147.5) + " Q" + q(sg * 6 * k2, -156) + " " + q(sg * 9.5 * k2, -128.6 - (1 - k2) * 2); s += tratto(d, "#ffffff", 1.1, op(.55)) + tratto(d, NOTTE ? "#c8f8ff" : "#bfeaff", .5, op(.8)); }); });
    for (i = 0; i < 7; i++) s += cer((r() - .5) * 14, -146 - r() * 10, .5 + r() * .5, "#ffffff", op(.7));
    return s;
  });

  // =========================================================
  //  DIVANETTO DI VELLUTO (la lounge): lo schienale a cappello col capitonné a rombi e i bottoni, la cornice di legno
  //  dorato intagliata con la conchiglia in cima, i braccioli imbottiti col ricciolo d'oro davanti, il cuscino gonfio
  //  col cordoncino, le gambe a cabriolè dorate. Da dietro: lo schienale liscio di velluto nella cornice d'oro
  // =========================================================
  function pianoV(fisso, t0, t1, z0, z1, cont) {   // un disegno piatto sul piano b = fisso (largo lungo a da t0 a t1, alto da z0 a z1): x = 0 a sinistra sullo schermo, y = 0 in cima
    var W = Math.abs(t1 - t0) * 61, H = z1 - z0, lo = Math.min(t0, t1), hi = Math.max(t0, t1), s0 = G > 0 ? lo : hi, e0 = G > 0 ? hi : lo;
    return piano(P(s0, fisso, z1), P(e0, fisso, z1), P(s0, fisso, z0), W, H, cont);
  }
  function cabriole(a, b, z1, da, db, k, w0) {   // una gamba a cabriolè dorata (il ginocchio in fuori, la caviglia stretta, il piedino a ricciolo), verso fuori (da, db)
    var n = 16, sx = [], dx = [], c = [], i; w0 = w0 || 2.6;
    for (i = 0; i <= n; i++) { var t = i / n, f = k * (Math.sin(Math.PI * Math.min(1, t * 1.3)) * .85 - t * .5 + Math.pow(t, 6) * .75); c.push(P(a + da * f, b + db * f, z1 * (1 - t))); }
    for (i = 0; i <= n; i++) {
      var A = c[Math.max(0, i - 1)], B = c[Math.min(n, i + 1)], tx = B[0] - A[0], ty = B[1] - A[1], l = Math.sqrt(tx * tx + ty * ty) || 1, t2 = i / n;
      var w = w0 * (1 - .55 * Math.sin(Math.PI * Math.min(1, t2 * 1.05) * .5) * (t2 < .85 ? 1 : 1 - (t2 - .85) * 3)) + (t2 > .9 ? (t2 - .9) * 12 : 0);
      sx.push([c[i][0] - ty / l * w, c[i][1] + tx / l * w]); dx.push([c[i][0] + ty / l * w, c[i][1] - tx / l * w]);
    }
    var pp = sx.concat(dx.reverse()), bb = limiti(pp), f0 = c[n];
    return pth(liscio(pp, true), nuova(DORATO, bb[0], 0, bb[2], 0, true), bordo(L, 1)) + tratto(liscio(c.slice(1, n - 2).map(function (v) { return [v[0] - .9, v[1]]; })), "#fff6cf", .6, op(.75)) +
      ell(f0[0], f0[1] - .4, w0 * .9, w0 * .45, nuovaR([[0, "#fff3c2"], [.6, "#d9a83a"], [1, "#6e4a10"]], .35, .3, .8), bordo(L, .7));
  }
  var VELLO = { velluto: .55, lucido: .26, esp: 6, riflesso: .3 };   // il velluto rosso cupo, col riflesso morbido
  def("divanetto_velluto", { nome: "Divanetto di velluto", fp: [2, 1], box: [-82, -96, 88, 46], dietro: true, azione: "siedi", seduta: 29 }, function () {
    var c = VEL, pz = [], i, j;
    var s = ombraPianta(-.95, .95, -.44, .42, 1) + ombraSotto(-.86, .86, -.36, .34, .3);
    function zTop(a) { return 55 + 9.5 * Math.pow(Math.cos(Math.PI * a / 1.86), 2); }   // lo schienale a cappello: più alto nel mezzo
    var oroC = function (n) { return tinta("#d4a23a", n, { lucido: .8, esp: 6 }); };
    // le gambe
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (g) { var a = .8 * g[0], b = g[1] < 0 ? -.3 : .28; pz.push({ box: [a - .04, a + .04, b - .04, b + .04, 0, 13], s: cabriole(a, b, 13.4, .07 * g[0], .06 * g[1], 1, 2.4) }); });
    // il telaio della seduta: legno dorato, la conchiglia intagliata davanti, i bordi a perline
    var tel = pulisci([[.88, .29], [.88, -.31], [.81, -.38], [-.81, -.38], [-.88, -.31], [-.88, .29], [-.8, .36], [.8, .36]].reverse());
    var telS = fianco(tel, 13, 20.5, oroC, null, { righe: [[19.6, "#fff3c4", .5, .9], [14.2, "#7a5614", .7, .8]], extra: function (vv) { return lungoCorsa(vv, .055, function (a, b) { var p0 = P(a, b, 16.8); return cer(p0[0], p0[1], .75, "#f6d572", "stroke='#6e4a10' stroke-width='.3'"); }); } });
    if (G > 0) {   // la conchiglia in mezzo al davanti
      var cs = P(0, .362, 17.2), con = "";
      for (i = -3; i <= 3; i++) { var an = -Math.PI / 2 + i * .32; con += tratto(linea([cs[0], cs[1] + 2.2], [cs[0] + Math.sin(an + Math.PI / 2) * 0 + i * 1.5, cs[1] - 3.6 + Math.abs(i) * .5]), "#7a5614", .5, op(.8)); }
      telS += pth("M" + q(cs[0] - 5.4, cs[1] + 1.4) + " Q" + q(cs[0] - 5.6, cs[1] - 4.4) + " " + q(cs[0], cs[1] - 4.6) + " Q" + q(cs[0] + 5.6, cs[1] - 4.4) + " " + q(cs[0] + 5.4, cs[1] + 1.4) + " Q" + q(cs[0], cs[1] + 3.6) + " " + q(cs[0] - 5.4, cs[1] + 1.4) + " Z", nuova(DORATO, cs[0] - 5.6, 0, cs[0] + 5.6, 0, true), bordo(L, .6)) + con;
    }
    pz.push({ box: [-.88, .88, -.38, .36, 13, 20.5], s: telS });
    // lo schienale: davanti il capitonné (da dietro liscio), sopra il bordo di velluto, la cornice d'oro e la conchiglia in cima
    var B0 = -.38, B1 = -.25;
    function facciaDav(W, H) {
      var o = "", x, y, k, rr2 = rnd(77), ztop = function (x) { return zTop(x / 61 - .86); };
      var sag = [], ap;
      for (k = 0; k <= 24; k++) { ap = k / 24 * W; sag.push([ap, 64 - ztop(ap)]); }
      var dS = "M0," + f2(H) + " L" + sag.map(function (v) { return q(v); }).join(" L") + " L" + f2(W) + "," + f2(H) + " Z", ins = "";
      ins += rett(0, 0, W, H, 0, nuova([[0, chiaro(c, .16)], [.45, c], [1, scuro(c, .4)]], 0, 0, 0, 1));
      var bot = [];   // il capitonné: i rombi gonfi, le pieghe, i bottoni
      for (y = 6; y <= H - 4; y += 7) {
        var dispari = Math.round((y - 6) / 7) % 2;
        for (x = (dispari ? 6.5 : 0) + 3.5; x <= W - 2; x += 13) if (y > 64 - ztop(x) + 4) bot.push([x, y]);
      }
      bot.forEach(function (b) { ins += ell(b[0], b[1] - 3.5, 5.6, 3, nuovaR([[0, chiaro(c, .3)], [.6, chiaro(c, .06)], [1, scuro(c, .14)]], .38, .3, .7), op(.95)); });
      bot.forEach(function (b) {
        [[6.5, -3.5], [-6.5, -3.5], [6.5, 3.5], [-6.5, 3.5]].forEach(function (d) { ins += tratto(linea(b, [b[0] + d[0], b[1] + d[1]]), scuro(c, .55), .7, op(.75)) + tratto(linea([b[0] + .5, b[1] + .6], [b[0] + d[0] + .5, b[1] + d[1] + .6]), chiaro(c, .35), .35, op(.5)); });
      });
      bot.forEach(function (b) { ins += cer(b[0], b[1], 1.15, nuovaR([[0, chiaro(c, .45)], [.6, c], [1, scuro(c, .55)]], .35, .3, .8), "stroke='" + scuro(c, .6) + "' stroke-width='.35'"); });
      ins += rett(0, H - 9, W, 9, 0, nuova([[0, "#000", 0], [1, "#000", .35]], 0, 0, 0, 1));   // il buio dove tocca la seduta
      o += dentro(dS, ins);
      o += tratto(aperto(sag), L, 3.6) + tratto(aperto(sag), "#d9a83a", 2.2) + tratto(aperto(sposta(sag, 0, -.5)), "#fff3c4", .6, op(.9));   // la cornice d'oro sopra
      return o;
    }
    function facciaDie(W, H) {   // da dietro: il velluto liscio dentro la cornice dorata
      var o = "", k, sag = [], ztop = function (x) { return zTop(.86 - x / 61); };
      for (k = 0; k <= 24; k++) { var ap = k / 24 * W; sag.push([ap, 64 - ztop(ap)]); }
      var dS = "M0," + f2(H) + " L" + sag.map(function (v) { return q(v); }).join(" L") + " L" + f2(W) + "," + f2(H) + " Z";
      o += dentro(dS, rett(0, 0, W, H, 0, nuova([[0, chiaro(c, .1)], [.5, scuro(c, .08)], [1, scuro(c, .35)]], 0, 0, 0, 1)) + rett(W * .12, 0, W * .1, H, 0, "#ffffff", op(.05)) + tratto(aperto(sposta(sag, 0, 4)), "#e2b444", .8, op(.8)));
      return o + tratto(aperto(sag), L, 3.6) + tratto(aperto(sag), "#d9a83a", 2.2) + tratto(aperto(sposta(sag, 0, -.5)), "#fff3c4", .6, op(.9));
    }
    var sch = "", top = [], topB = [], k2;
    for (k2 = 0; k2 <= 24; k2++) { var a2 = -.86 + 1.72 * k2 / 24; top.push(P(a2, B1, zTop(a2))); topB.push(P(a2, B0, zTop(a2))); }
    if (G > 0) sch += pianoV(B1, -.86, .86, 22, 64, facciaDav(105, 42)); else sch += pianoV(B0, -.86, .86, 22, 64, facciaDie(105, 42));
    sch += pth(aperto(top) + " L" + topB.slice().reverse().map(function (v) { return q(v); }).join(" L") + " Z", nuova([[0, chiaro(c, .32)], [1, chiaro(c, .1)]], 0, 0, 1, 1), bordo(L, 1.2));   // il bordo di sopra
    var aE = G > 0 ? .86 : -.86, eF = [P(aE, B1, 22), P(aE, B0, 22), P(aE, B0, zTop(aE)), P(aE, B1, zTop(aE))];
    sch += poly(eF, scuro(c, .35), bordo(L, 1));   // la testa dello schienale (a destra)
    var cr = P(0, (B0 + B1) / 2, zTop(0) + 1);   // la conchiglia dorata in cima
    sch += pth("M" + q(cr[0] - 6, cr[1] + 1) + " Q" + q(cr[0] - 7, cr[1] - 6) + " " + q(cr[0], cr[1] - 8) + " Q" + q(cr[0] + 7, cr[1] - 6) + " " + q(cr[0] + 6, cr[1] + 1) + " Q" + q(cr[0], cr[1] + 2.6) + " " + q(cr[0] - 6, cr[1] + 1) + " Z", nuova(DORATO, cr[0] - 7, 0, cr[0] + 7, 0, true), bordo(L, .7));
    for (i = -3; i <= 3; i++) sch += tratto(linea([cr[0], cr[1] + .8], [cr[0] + i * 1.7, cr[1] - 6.6 + Math.abs(i) * .7]), "#7a5614", .5, op(.85));
    sch += cer(cr[0] - 1.6, cr[1] - 4.6, .9, "#fff6cf", op(.8));
    pz.push({ box: [-.88, .88, B0, B1, 20, 66], s: sch, ord: G > 0 ? 0 : 2 });   // (da dietro lo schienale va dopo i braccioli)
    // il cuscino gonfio della seduta, col cordoncino
    pz.push({ box: [-.79, .79, B1, .36, 20.5, 30], s: estruso("a", sezione(B1, .355, 20.5, 28.4, .055, 1.9, .02), -.79, .79, c, { mat: VELLO, ao: .3, aoH: 6, fascia: function (H) {
      var kk = H.vicinoA(.355 - .03, 28.4 - 2.2);
      return cordone(aperto(H.lungo(kk, -.77, .77)), c, 1.2) + H.luccica(.22, .1, .9);
    } }) });
    // i braccioli imbottiti, visti di fianco: alti dietro, scendono davanti e finiscono col rotolo; sul fianco la cornice d'oro e la rosetta
    var profB = pulisci([[-.31, 20.5], [.33, 20.5], [.345, 30.5], [.362, 34], [.356, 37.4], [.334, 39.6], [.296, 40.5], [.258, 39.6], [.236, 38], [.12, 39.2], [-.04, 41], [-.19, 42.9], [-.31, 44.4], [-.322, 32]].reverse());
    function bracciolo(x0, x1) {
      return estruso("a", profB, x0, x1, c, { mat: VELLO, ao: .3, aoH: 8, fascia: function (H) { return H.luccica(.22, .05, .95); }, tappo: function (T) {
        var pp = profB.map(function (v) { return [T.x(v[0]), T.y(v[1])]; }), cx = 0, cy = 0, o;
        pp.forEach(function (v) { cx += v[0]; cy += v[1]; }); cx /= pp.length; cy /= pp.length;
        var dentroP = pp.map(function (v) { var dx = v[0] - cx, dy = v[1] - cy, l = Math.sqrt(dx * dx + dy * dy) || 1; return [v[0] - dx / l * 2.2, v[1] - dy / l * 2.2]; });
        o = rett(0, 0, T.W, T.H, 0, "#000", op(.08)) + tratto(liscio(dentroP, true), L, 2.8) + tratto(liscio(dentroP, true), "#d9a83a", 1.6) + tratto(liscio(dentroP, true), "#fff3c4", .45, trasla(-.3, -.3));
        var rc = [T.x(.296), T.y(37.4)];
        o += cer(rc[0], rc[1], 2.3, nuovaR([[0, "#fff6d0"], [.55, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), bordo(L, .6)) + tratto("M" + q(rc[0] + 1.2, rc[1]) + " A1.2,1.2 0 1,1 " + q(rc[0], rc[1] - 1.2), "#6e4a10", .45);
        return T.su(o);
      } });
    }
    pz.push({ box: [-.92, -.79, -.32, .362, 20, 45], s: bracciolo(-.92, -.79), ord: 1 }, { box: [.79, .92, -.32, .362, 20, 45], s: bracciolo(.79, .92), ord: 1 });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  PIANOFORTE A CODA: la cassa nera laccata a specchio (il fianco curvo a S, la coda tonda), dentro la piastra d'oro
  //  coi buchi tondi, le corde e gli smorzatori; il coperchio alzato sull'asta, il leggio con lo spartito, la tastiera
  //  bianca e nera, la lira coi tre pedali d'ottone, tre gambe coi gommini d'ottone e lo sgabello di pelle capitonné
  // =========================================================
  var NERO_L = "#1d1b22";   // la lacca nera
  def("pianoforte_coda", { nome: "Pianoforte a coda", fp: [2, 2], box: [-106, -150, 104, 56], dietro: true }, function () {
    var s = "", i, Z0 = 36, Z1 = 58.5, BETA = 52 / 57.296;   // il coperchio alzato sull'asta
    var CASSA = [[.74, .5], [-.74, .5], [-.74, -.6], [-.73, -.72], [-.69, -.83], [-.61, -.92], [-.5, -.975], [-.37, -.995], [-.25, -.985], [-.15, -.94], [-.06, -.86], [.04, -.75], [.15, -.62], [.28, -.49], [.42, -.37], [.55, -.25], [.65, -.11], [.71, .05], [.735, .22], [.74, .38]];
    var DENTRO = allarga(CASSA, -.035);
    var laccaC = function (n) { return tinta(NERO_L, n, LACCA); };
    function pp2d(pp) { return chiuso(pp.map(function (v) { return [v[0] * 61, v[1] * 61]; })); }   // un contorno in pianta (dentro suZ)
    function bFondo(a) { var m = 1e9, k, n = DENTRO.length; for (k = 0; k < n; k++) { var A = DENTRO[k], B = DENTRO[(k + 1) % n]; if ((A[0] - a) * (B[0] - a) <= 0 && A[0] !== B[0]) { var t = (a - A[0]) / (B[0] - A[0]), bb = A[1] + (B[1] - A[1]) * t; if (bb < m) m = bb; } } return m; }
    s += ombraPianta(-.78, .78, -1, .72, 1.1, .06) + ombraSotto(-.7, .7, -.9, .45, .25);
    // le gambe (nere col nodo d'oro e il gommino d'ottone), la lira coi pedali
    function gamba(a, b) {
      var o = tornito(a, b, [[0, .045], [2.5, .045], [3.2, .036]], OTTONE, .9) + tornito(a, b, [[3, .034], [12, .038], [26, .046], [31, .052], [32.5, .06], [Z0, .06]], [[0, "#5a5660"], [.3, "#2c2a31"], [.7, "#141217"], [1, "#000000"]], 1.1, [4], .7);
      return o + fascia(29.6, 31.4, .056, OTTONE, a, b);
    }
    function lira() {
      var o = "", k;
      [-.06, .06].forEach(function (a) { var t = P(a, .3, Z0), m = P(a * 2.2, .3, 20), f = P(a, .3, 8); o += tratto("M" + q(t) + " Q" + q(m) + " " + q(f), L, 3.4) + tratto("M" + q(t) + " Q" + q(m) + " " + q(f), "#2c2a31", 2) + tratto("M" + q(t) + " Q" + q(m) + " " + q(f), "#8a8794", .5, op(.6)); });
      o += blocco(-.13, .13, .25, .34, 3, 9, NERO_L, null, 1.2);
      for (k = -1; k <= 1; k++) { var a0 = k * .065, p0 = P(a0, G > 0 ? .34 : .25, 5), p1 = P(a0, G > 0 ? .44 : .15, 4.2); o += tratto(linea(p0, p1), L, 3) + tratto(linea(p0, p1), "#e2b444", 1.8) + tratto(linea(p0, p1), "#fff3c4", .5, trasla(0, -.4)); }
      return o;
    }
    // lo sgabello: le gambe nere, il cuscino di pelle nera capitonné
    function sgabello() {
      var o = "";
      [[-.32, .8], [.32, .8], [-.32, .95], [.32, .95]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }).forEach(function (g) { o += tornito(g[0], g[1], [[0, .025], [18, .03], [24, .034]], [[0, "#5a5660"], [.4, "#26242b"], [1, "#000"]], .9); });
      o += blocco(-.37, .37, .76, .99, 23, 27, NERO_L, null, 1.4);
      o += estruso("a", sezione(.765, .985, 27, 32, .04, 1.4, .015), -.36, .36, "#2a2628", { mat: PELLE, fascia: function (H) {
        var r2 = "", k; for (k = 0; k < 5; k++) { var c = P(-.28 + k * .14, .875, 32.6); r2 += cer(c[0], c[1] + .4, .9, "#000", op(.4)) + cer(c[0], c[1], .7, "#5a5458"); } return r2 + H.luccica(.35, .08, .92);
      } });
      return o;
    }
    // la tastiera: il letto dei tasti, i tasti bianchi e neri, il listello davanti, le guance ai lati, la ribalta aperta
    function tastiera() {
      var o = blocco(-.74, .74, .5, .69, Z0, 40.5, NERO_L, null, 1.6);
      var kw = 1.36 / 52, k, bianchi = "", neri = "";
      bianchi += rett(-.68 * 61, .5 * 61, 1.36 * 61, .17 * 61, 0, "#fbf8f1");
      for (k = 1; k < 52; k++) bianchi += tratto(linea([(-.68 + k * kw) * 61, .5 * 61], [(-.68 + k * kw) * 61, .67 * 61]), "#a39e92", .25);
      bianchi += rett(-.68 * 61, .64 * 61, 1.36 * 61, .03 * 61, 0, "#e6e0d2");
      var tasti = blocco(-.69, .69, .5, .675, 40.5, 44.5, "#f4f0e6", null, 1.1) + suZ(44.6, bianchi);
      for (k = 0; k < 51; k++) { var nota = (k + 5) % 7; if (nota === 2 || nota === 6) continue; var a0 = -.68 + (k + 1) * kw - kw * .3; neri += blocco(a0, a0 + kw * .6, .5, .6, 44.6, 46.6, "#141217", null, .3); }
      var guance = blocco(-.74, -.69, .5, .69, 40.5, 49, NERO_L, null, 1.2) + blocco(.69, .74, .5, .69, 40.5, 49, NERO_L, null, 1.2);
      var ribalta = blocco(-.69, .69, .44, .5, 46, 52.5, NERO_L, { davanti: function (W, H) { return rett(W * .44, H * .45, W * .12, .7, 0, "#e2b444"); } }, 1.1);   // la ribalta aperta, col filetto d'oro
      return o + (G > 0 ? ribalta + tasti + neri + guance : tasti + neri + guance + ribalta);
    }
    // il leggio inclinato con lo spartito (davanti), liscio dietro
    function leggio() {
      var A = P(-.38, .335, 81), B = P(.38, .335, 81), C = P(-.38, .4, 57), o = "", W = 46.4, H = 24;
      if (G < 0) { A = P(.38, .335, 81); B = P(-.38, .335, 81); C = P(.38, .4, 57); }
      var cont = rett(0, 0, W, H, 1, nuova([[0, "#4a4652"], [.3, "#1d1b22"], [1, "#0c0b0e"]], 0, 0, 1, 1)) + rett(1.2, 1.2, W - 2.4, H - 2.4, 1, "none", "stroke='#e2b444' stroke-width='.5' opacity='.8'");
      if (G > 0) {
        cont += rett(5, 3.2, 17.6, 17, .4, "#fbf8ef", bordo("#8f8a7e", .3)) + rett(23.8, 3.2, 17.6, 17, .4, "#f6f2e6", bordo("#8f8a7e", .3));
        [0, 1].forEach(function (pg) { var x0 = 6.6 + pg * 18.8, k, j; for (k = 0; k < 3; k++) { for (j = 0; j < 5; j++) cont += rett(x0, 5.2 + k * 5 + j * .7, 14.4, .18, 0, "#6d685e"); for (j = 0; j < 5; j++) cont += ell(x0 + 1.6 + j * 2.8 + (k % 2) * .9, 6.2 + k * 5 + (j % 3) * .55, .55, .4, "#2b2824"); } });
        cont += rett(0, H - 3, W, 3, 0, "#000", op(.25));
      }
      o += piano(A, B, C, W, H, cont);
      var l0 = P(-.4, .41, 57), l1 = P(.4, .41, 57); o += tratto(linea(l0, l1), L, 3.2) + tratto(linea(l0, l1), "#2c2a31", 1.8) + tratto(linea(l0, l1), "#8a8794", .5, trasla(0, -.6));
      return o;
    }
    // dentro: le pareti di dentro, la tavola armonica, la piastra d'oro coi buchi, le corde, la caviglia, gli smorzatori
    function interno() {
      var o = fianco(DENTRO, 47, Z1, function (n) { return tinta("#2a2530", n, { lucido: .3, esp: 6 }); }, null, { dentro: true, lw: .8, lati: false });
      var tavola = pp2d(DENTRO), vena = "", k, r2 = rnd(88);
      for (k = 0; k < 26; k++) { var x = (-.7 + k * .055) * 61; vena += tratto("M" + q(x, -62) + " L" + q(x + 8, 40), "#c9a46a", .35 + r2() * .3, op(.5)); }
      o += suZ(47, pth(tavola, "#ecd0a0") + dentro(tavola, vena));
      var PI = allarga(CASSA, -.085).map(function (v) { return [v[0], Math.min(v[1], .34)]; });
      var buchi = [[-.47, -.62, .1, .13], [-.42, -.22, .1, .12], [-.1, -.36, .08, .1], [.2, -.12, .07, .09], [-.45, .14, .09, .1], [.05, .12, .1, .09], [.42, .12, .08, .09]];
      var dP = pp2d(PI) + buchi.map(function (h) { return " " + dEll(h[0] * 61, h[1] * 61, h[2] * 61, h[3] * 61); }).join("");
      var corde = "";
      for (k = 0; k < 48; k++) { var a = -.66 + k * .0272, bf = bFondo(a) + .04; if (bf > .3) continue; corde += tratto(linea([a * 61, .31 * 61], [a * 61, bf * 61]), a < -.32 ? "#d08a3c" : "#e9ecef", a < -.32 ? .5 : .32, op(.95)); }
      o += suZ(50, pth(dP, nuova([[0, "#fff1b8"], [.35, "#e8bd52"], [.8, "#b8861f"], [1, "#7a5614"]], -45, -60, 45, 30, true), "fill-rule='evenodd' stroke='#5c3c0a' stroke-width='.8'") + buchi.map(function (h) { return ell(h[0] * 61, h[1] * 61, h[2] * 61, h[3] * 61, "none", "stroke='#fff3c4' stroke-width='.5' opacity='.8'"); }).join(""));
      o += suZ(52, corde);
      o += blocco(-.7, .7, .36, .44, 47, 51.5, "#5a3a22", { sopra: function (A, B, C, D) { var r3 = "", j; for (j = 0; j < 30; j++) { var t = (j + .5) / 30, p0 = [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], p1 = [D[0] + (C[0] - D[0]) * t, D[1] + (C[1] - D[1]) * t]; r3 += cer(p0[0] + (p1[0] - p0[0]) * .35, p0[1] + (p1[1] - p0[1]) * .35, .45, "#dfe3e6") + cer(p0[0] + (p1[0] - p0[0]) * .7, p0[1] + (p1[1] - p0[1]) * .7, .45, "#c9ced2"); } return r3; } }, .8);   // la caviglia con le spine
      o += blocco(-.66, .6, .27, .33, 51, 54.5, "#2b2730", null, .8);   // gli smorzatori di feltro
      return dentro(chiuso(aSchermo(DENTRO, Z1)), o);   // si vede solo dalla bocca della cassa
    }
    // il coperchio alzato (girato attorno al lato dritto di sinistra), con l'asta
    function coperchio() {
      var pl = CASSA.filter(function (v) { return v[1] <= .3 && v[0] > -.74; }), o = "";
      pl = [[.7, .32], [-.715, .32], [-.74, .3], [-.74, -.6]].concat(pl, [[.738, .3]]);   // la pianta del coperchio (gli angoli smussati)
      function giraP(v, dz) { var d = v[0] + .745, aa = -.745 + d * Math.cos(BETA), zz = Z1 + d * Math.sin(BETA) * 61 + (dz || 0); return P(aa, v[1], zz); }
      var sup = pl.map(function (v) { return giraP(v); }), sot = pl.map(function (v) { return giraP(v, -2.4); });
      var nTop = [-Math.sin(BETA) * G, 0, Math.cos(BETA)], vede = dot(nTop, VISTA) > 0, bb = limiti(sup);
      o += pth(chiuso(sot), "#0b0a0d", bordo(L, 1.2));   // lo spessore
      if (vede) o += pth(chiuso(sup), nuova([[0, "#5a5762"], [.22, "#26242c"], [.6, "#121015"], [1, "#34313b"]], bb[0], bb[1], bb[2], bb[3], true), bordo(L, 1.4));   // sopra: nero lucido
      else o += pth(chiuso(sup), nuova([[0, "#2c2933"], [.5, "#141217"], [1, "#3c3842"]], bb[0], bb[3], bb[2], bb[1], true), bordo(L, 1.4));   // sotto
      var curvo = pl.slice(4).map(function (v) { return giraP([v[0] - .09 * (v[0] + .745) / 1.5, v[1] + .05]); });   // il lucido che segue il bordo curvo
      var r1 = [lerp(giraP([-.6, .2]), giraP([.5, .2]), .1), lerp(giraP([-.6, -.7]), giraP([.2, -.5]), .2)];
      o += dentro(chiuso(sup), tratto(linea(r1[0], r1[1]), "#ffffff", 8, op(.1)) + tratto(liscio(curvo), "#ffffff", 4, op(.1)) + tratto(liscio(curvo), "#ffffff", 1.2, op(.35)) + (vede ? "" : tratto(linea(giraP([-.6, -.25]), giraP([.35, -.25])), "#e8bd52", 10, op(.08))));
      if (vede) {   // la ribaltina davanti, piegata sopra il coperchio, con la cerniera
        var rb = [[-.715, .32], [.7, .32], [.738, .3], [.738, .15], [-.74, .15], [-.74, .3]].map(function (v) { return giraP(v, 1.4); });
        o += pth(chiuso(rb), nuova([[0, "#4a4752"], [.4, "#1b1920"], [1, "#2e2b34"]], bb[0], bb[1], bb[2], bb[3], true), bordo(L, 1)) + tratto(linea(giraP([-.72, .15], 1.6), giraP([.72, .15], 1.6)), "#8a8794", .6, op(.8));
      }
      o += tratto(aperto(pl.slice(4).map(function (v) { return giraP(v); })), "#8a8794", .6, op(.7));   // il filo di luce sul bordo curvo
      var a0 = P(.6, -.16, Z1), a1 = giraP([.5, -.16], -2.4);   // l'asta
      o += tratto(linea(a0, a1), L, 2.6) + tratto(linea(a0, a1), "#2c2a31", 1.4) + tratto(linea(a0, a1), "#9a96a2", .4, trasla(-.4, 0)) + cer(a1[0], a1[1], 1, "#e2b444", bordo(L, .4));
      return o;
    }
    var cassa = fianco(CASSA, Z0, Z1, laccaC, null, { righe: [[Z1 - .8, "#5a5662", .6, .8], [Z0 + 1, "#000000", .8, .5]], cima: 1.2 });
    var sotto = gamba(-.45, -.8), davanti = gamba(-.63, .4) + gamba(.63, .4);
    if (G > 0) s += sotto + cassa + interno() + coperchio() + leggio() + tastiera() + lira() + davanti + sgabello();
    else s += sgabello() + davanti + lira() + tastiera() + leggio() + cassa + interno() + coperchio() + sotto;
    return s;
  });

  // =========================================================
  //  LE FICHES (piccole, ma un po' più grandi del vero per vederle): pile in piedi e file sdraiate nei vassoi
  // =========================================================
  var COL_FICHE = ["#d42a2a", "#1f1f25", "#1fa35a", "#2f6fd6", "#7a3fd0", "#f2b13a"];
  function pilaFiche(a, b, z, n, col, rr) {   // una pila di n fiches in piedi su (a, b) all'altezza z
    rr = rr || .034; var c = P(a, b, z), rx = rr * 70.71, ry = rr * 35.36, h = n * 1.25, o = "", k;
    o += rett(c[0] - rx, c[1] - h, rx * 2, h, 0, nuova([[0, chiaro(col, .3)], [.45, col], [1, scuro(col, .45)]], c[0] - rx, 0, c[0] + rx, 0, true)) + ell(c[0], c[1], rx, ry, scuro(col, .3));
    for (k = 1; k < n; k++) o += tratto("M" + q(c[0] - rx, c[1] - k * 1.25) + " A" + f2(rx) + "," + f2(ry) + " 0 0,0 " + q(c[0] + rx, c[1] - k * 1.25), scuro(col, .5), .3, op(.8));
    for (k = 0; k < n; k++) [-.55, 0, .55].forEach(function (f) { o += rett(c[0] + f * rx - .35, c[1] - k * 1.25 - .95 + Math.cos(f) * ry * .8, .7, .7, 0, "#ffffff", op(.85)); });   // le righette bianche sul bordo
    o += ell(c[0], c[1] - h, rx, ry, chiaro(col, .12), "stroke='" + L + "' stroke-width='.4'") + ell(c[0], c[1] - h, rx * .55, ry * .55, "none", "stroke='#ffffff' stroke-width='.4' stroke-dasharray='.8 .7' opacity='.9'");
    return o + pth("M" + q(c[0] - rx, c[1] - h) + " L" + q(c[0] - rx, c[1]) + " A" + f2(rx) + "," + f2(ry) + " 0 0,0 " + q(c[0] + rx, c[1]) + " L" + q(c[0] + rx, c[1] - h), "none", "stroke='" + L + "' stroke-width='.5'");
  }
  function vassoioFiche(a0, a1, b0, b1, z) {   // il vassoio coi cinque scomparti e le fiches sdraiate in fila
    var o = blocco(a0, a1, b0, b1, z, z + 2.4, "#3a2a22", null, .8), k, n = 5, d = (b1 - b0) / n;
    for (k = 0; k < n; k++) {
      var bb = b0 + d * (k + .5), col = COL_FICHE[k], p0 = P(a0 + .015, bb, z + 2.6), p1 = P(a1 - .015, bb, z + 2.6), w = d * 35.36 * .9;
      o += tratto(linea(p0, p1), L, w + .8) + tratto(linea(p0, p1), col, w) + tratto(linea(p0, p1), chiaro(col, .45), w * .3, trasla(0, -w * .25)) + tratto(linea(p0, p1), "#ffffff", w * .9, "stroke-dasharray='.5 2.4' opacity='.7'");
    }
    return o;
  }

  // =========================================================
  //  CASSA DELLE FICHES: il bancone di mogano con le specchiature e le medaglie d'oro, il piano di marmo nero e oro
  //  (Portoro), la grata d'ottone con i tre sportelli ad arco, dietro le pile di fiches nei vassoi e le lampade verdi
  //  da banchiere; sopra l'insegna con la fiche gigante, la corona e le lampadine. Da dietro: i cassetti del cassiere
  // =========================================================
  var MOGANO = "#5e2414";
  function pannelloOro(x, y, w, h, col) {   // una specchiatura in rilievo con la cornice d'oro
    return rett(x, y, w, h, .8, nuova([[0, chiaro(col, .14)], [1, scuro(col, .12)]], 0, 0, 1, 1)) + rett(x, y, w, h, .8, "none", "stroke='#e2b444' stroke-width='1'") + rett(x + .9, y + .9, w - 1.8, h - 1.8, .5, "none", "stroke='#fff3c4' stroke-width='.35' opacity='.7'") +
      tratto("M" + q(x + w - .6, y + 1) + " L" + q(x + w - .6, y + h - .6) + " L" + q(x + 1, y + h - .6), "#2a0e06", .6, op(.6));
  }
  function medagliaFiche(cx, cy, r) {   // la medaglia d'oro con la fiche in rilievo
    var o = cer(cx, cy, r + 1.2, nuovaR([[0, "#fff3c2"], [.6, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), bordo(L, .6)) + cer(cx, cy, r, "#c0202a", bordo("#5c0a10", .4)), k;
    for (k = 0; k < 8; k++) { var an = k / 8 * 6.2832; o += "<rect x='" + f2(cx - .9) + "' y='" + f2(cy - r) + "' width='1.8' height='" + f2(r * .32) + "' fill='#ffffff' transform='rotate(" + f2(an * 57.3) + " " + f2(cx) + " " + f2(cy) + ")'/>"; }
    return o + cer(cx, cy, r * .52, "#f6d572", bordo("#7a5614", .35)) + cer(cx - r * .2, cy - r * .2, r * .16, "#fffbe6", op(.8));
  }
  def("cassa_casino", { nome: "Cassa delle fiches", fp: [3, 1], box: [-100, -234, 100, 50], dietro: true, luce: [0, 0, 180, 135, "#ffd27a"] }, function () {
    var s = ombraPianta(-1.5, 1.5, -.38, .38, 1.1, .08), i, BG = -.2, AW = [-.96, 0, .96];
    var nero = [lin("pts", [[0, "#3e3a40"], [1, "#1c1a1d"]], 0, 0, 1, 1), lin("ptl", [[0, "#2c292e"], [1, "#151316"]], 0, 0, 0, 1), lin("ptd", [[0, "#141215"], [1, "#09080a"]], 0, 0, 0, 1)];
    function veneOro(W, H, seme) { return venato(W, H, seme, "#d9b25a", 4, .7) + venato(W, H, seme + 7, "#efe2bf", 3, .4); }
    s += blocco(-1.45, 1.45, -.3, .31, 0, 6, nero, { davanti: function (W, H) { return veneOro(W, H, 3); }, dietro: function (W, H) { return veneOro(W, H, 5); }, fianco: function (W, H) { return veneOro(W, H, 9); } }, 1.6);
    // il bancone di mogano: davanti le tre specchiature con la medaglia (una per sportello) e le lesene d'oro; dietro i cassetti
    function davanti(W, H) {
      var o = "", k, lw = W / 3;
      for (k = 0; k < 3; k++) { var x0 = k * lw; o += pannelloOro(x0 + 5, 5, lw - 10, H - 11, MOGANO) + medagliaFiche(x0 + lw / 2, H / 2 - 2, 5); }
      for (k = 0; k <= 3; k++) { var xl = Math.min(W - 3.5, Math.max(0, k * lw - 1.75)); o += rett(xl, 0, 3.5, H, 0, nuova([[0, "#f8de8a"], [.5, "#d9a83a"], [1, "#8f6418"]], 0, 0, 1, 0)) + rett(xl + .6, 2, .7, H - 4, 0, "#fff6d0", op(.7)); }
      return o + rett(0, 0, W, 2.2, 0, "#d9a83a") + rett(0, 0, W, .7, 0, "#fff3c4", op(.8)) + rett(0, H - 1.5, W, 1.5, 0, "#2a0e06", op(.6));
    }
    function dietro(W, H) {
      var o = "", k, lw = W / 3;
      for (k = 0; k < 3; k++) {
        var x0 = k * lw + 4, w = lw - 8;
        [[6, 13], [21, 13], [36, 14]].forEach(function (c, j) { o += pannelloOro(x0, c[0], w, c[1], MOGANO) + rett(x0 + w / 2 - 5, c[0] + c[1] / 2 - 1, 10, 2.2, 1.1, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .5)) + (j === 2 ? rett(x0 + w / 2 - 2, c[0] + 3, 4, 2.6, .4, "#2a1a10", bordo("#e2b444", .4)) : ""); });   // i cassetti con le maniglie (e la serratura)
      }
      return o + rett(0, 0, W, 2.2, 0, "#d9a83a");
    }
    function fianco(W, H) { return pannelloOro(5, 5, W - 10, H - 11, MOGANO) + rett(0, 0, W, 2.2, 0, "#c99a36"); }
    s += blocco(-1.43, 1.43, -.28, .28, 6, 61, MOGANO, { davanti: davanti, dietro: dietro, fianco: fianco }, 2);
    // il piano di marmo nero con le vene d'oro (sporge un po' davanti)
    s += blocco(-1.48, 1.48, -.34, .36, 61, 65.5, nero, { davanti: function (W, H) { return veneOro(W, H, 21); }, dietro: function (W, H) { return veneOro(W, H, 23); }, fianco: function (W, H) { return veneOro(W, H, 25); }, sopra: function (A, B, C, D) {
      var v = "", r2 = rnd(1871), k;
      for (k = 0; k < 7; k++) { var t0 = r2(), t1 = Math.min(1, Math.max(0, t0 + (r2() - .5) * .3)), p0 = lerp(A, B, t0), p1 = lerp(D, C, t1), m = lerp(p0, p1, .5); v += tratto("M" + q(p0) + " Q" + q(m[0] + (r2() - .5) * 12, m[1]) + " " + q(p1), k % 3 ? "#d9b25a" : "#f3e6c0", .5 + r2() * .5, op(.6)); }
      return dentro(chiuso([A, B, C, D]), v) + tratto(linea(lerp(A, D, .12), lerp(B, C, .12)), "#ffffff", 1.4, op(.18));
    } }, 1.8);
    // dalla parte del cassiere: i vassoi di fiches, le pile e le lampade verdi da banchiere
    var cassiere = "";
    AW.forEach(function (a, j) {
      cassiere += vassoioFiche(a - .2, a + .2, -.335, -.235, 65.5);
      cassiere += pilaFiche(a + .3, -.28, 65.5, 7 + j, COL_FICHE[(j + 3) % 6]) + pilaFiche(a - .3, -.29, 65.5, 5 + (j % 2) * 3, COL_FICHE[j]);
    });
    [-.48, .48].forEach(function (a) {   // la lampada da banchiere: il piede d'ottone, il paralume di vetro verde
      cassiere += tornito(a, -.29, [[65.5, .045], [67, .045], [68, .012], [74, .012]], OTTONE, .7);
      var c = P(a, -.29, 75), sh = "M" + q(c[0] - 6, c[1] + 1.2) + " Q" + q(c[0] - 5, c[1] - 3.4) + " " + q(c[0], c[1] - 3.6) + " Q" + q(c[0] + 5, c[1] - 3.4) + " " + q(c[0] + 6, c[1] + 1.2) + " Q" + q(c[0], c[1] + 3) + " " + q(c[0] - 6, c[1] + 1.2) + " Z";
      cassiere += pth(sh, NOTTE ? lin("lv", [[0, "#9dffc0"], [1, "#2fbf6a"]], 0, 0, 0, 1) : lin("lv", [[0, "#5fd08a"], [1, "#0f6b38"]], 0, 0, 0, 1), bordo(L, .7)) + tratto("M" + q(c[0] - 4.4, c[1] - 1.6) + " Q" + q(c[0] - 2, c[1] - 3) + " " + q(c[0] + 1, c[1] - 3), "#ffffff", .6, op(.7));
      if (NOTTE) cassiere += ell(c[0], c[1] + 3, 7, 2.6, nuovaR([[0, "#fff6c8", .8], [1, "#fff6c8", 0]], .5, .5, .5));
    });
    // dalla parte dei clienti: un vassoietto d'ottone con le fiches a ogni sportello, il campanello in mezzo
    var clienti = "";
    AW.forEach(function (a, j) {
      var c = P(a + .12, .14, 65.5); clienti += ell(c[0], c[1], 6.6, 3.3, nuova(OTTONE, c[0] - 6.6, 0, c[0] + 6.6, 0, true), bordo(L, .6)) + ell(c[0], c[1] - .5, 5.2, 2.5, scuro("#c99a36", .2));
      clienti += pilaFiche(a + .08, .13, 66, 3 + j, COL_FICHE[(j + 1) % 6], .03) + pilaFiche(a + .17, .16, 66, 2, COL_FICHE[(j + 4) % 6], .03);
    });
    var cb = P(-.2, .17, 65.5); clienti += ell(cb[0], cb[1], 3.4, 1.6, "#3a2a22", bordo(L, .5)) + pth("M" + q(cb[0] - 2.8, cb[1] - .6) + " Q" + q(cb[0] - 2.8, cb[1] - 4.6) + " " + q(cb[0], cb[1] - 4.8) + " Q" + q(cb[0] + 2.8, cb[1] - 4.6) + " " + q(cb[0] + 2.8, cb[1] - .6) + " Z", nuovaR([[0, "#fff6cf"], [.5, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), bordo(L, .6)) + cer(cb[0], cb[1] - 5.4, .8, "#e2b444", bordo(L, .4));
    // la grata d'ottone con i tre sportelli ad arco (le sbarre si vedono anche da dietro)
    function grata(W, H) {
      var o = "", x, k, fin = AW.map(function (a) { return { x: (a + 1.44) * 61, y0: H - (69.5 - 65.5), y1: H - (112 - 65.5) }; }), rA = 15;
      function inFin(xx, yy) { for (var j = 0; j < fin.length; j++) { var f = fin[j]; if (Math.abs(xx - f.x) < rA + 1.5 && yy > f.y1 - rA - 1 && yy < f.y0 + 1) { if (yy >= f.y1) return true; var dy = f.y1 - yy; if ((xx - f.x) * (xx - f.x) + dy * dy < (rA + 1.5) * (rA + 1.5)) return true; } } return false; }
      for (x = 2.6; x < W - 1; x += 4.3) {   // le sbarre, interrotte dove ci sono gli sportelli
        var seg = [], y, dentroF = true, y0 = 15;
        for (y = 15; y <= H - 1.5; y += .5) { var f2b = inFin(x, y); if (f2b && !dentroF) { seg.push([y0, y]); dentroF = true; } else if (!f2b && dentroF) { y0 = y; dentroF = false; } }
        if (!dentroF) seg.push([y0, H - 1.5]);
        seg.forEach(function (sg) { if (sg[1] - sg[0] < 1) return; o += rett(x - .9, sg[0], 1.8, sg[1] - sg[0], .5, L) + rett(x - .55, sg[0], 1.1, sg[1] - sg[0], .3, "#d9a83a") + rett(x - .45, sg[0], .35, sg[1] - sg[0], 0, "#fff6cf", op(.8)); });
      }
      fin.forEach(function (f) {   // la cornice d'ottone di ogni sportello, l'arco, la conchiglia in cima
        var d = "M" + q(f.x - rA, f.y0) + " L" + q(f.x - rA, f.y1) + " A" + rA + "," + rA + " 0 0,1 " + q(f.x + rA, f.y1) + " L" + q(f.x + rA, f.y0);
        o += tratto(d, L, 4.4) + tratto(d, "#e2b444", 2.8) + tratto(d, "#fff3c4", .7, trasla(-.4, -.4));
        o += tratto("M" + q(f.x - rA - 2, f.y0) + " L" + q(f.x + rA + 2, f.y0), L, 3.6) + tratto("M" + q(f.x - rA - 2, f.y0) + " L" + q(f.x + rA + 2, f.y0), "#e2b444", 2.2);
        o += rett(f.x - 7, f.y0 - 2.4, 14, 2.4, .8, "#1a1214", bordo("#e2b444", .5));   // la feritoia per passare i soldi
        o += cer(f.x, f.y1 - rA - .5, 2.4, nuovaR([[0, "#fff6d0"], [.55, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), bordo(L, .6));
      });
      for (x = 6; x < W - 3; x += 8) o += cer(x, 9, 3, "none", "stroke='" + L + "' stroke-width='2.4'") + cer(x, 9, 3, "none", "stroke='#d9a83a' stroke-width='1.3'") + cer(x - .5, 8.5, 1.6, "none", "stroke='#fff3c4' stroke-width='.4' opacity='.7'");   // la fascia di anelli in cima
      [[0, 3.4], [14.2, 2.2], [H - 2.2, 2.2]].forEach(function (rr) { o += rett(0, rr[0], W, rr[1], .6, nuova([[0, "#fff3c4"], [.4, "#e2b444"], [1, "#7a5614"]], 0, 0, 0, 1), bordo(L, .6)); });
      [0, W - 3.2].forEach(function (xx) { o += rett(xx, 0, 3.2, H, .6, nuova([[0, "#fff3c4"], [.5, "#e2b444"], [1, "#7a5614"]], 0, 0, 1, 0), bordo(L, .6)); });
      return o;
    }
    var gr = pianoV(BG, -1.44, 1.44, 65.5, 156, grata(175.7, 90.5));
    var cornice = blocco(-1.47, 1.47, -.27, -.13, 156, 162, MOGANO, { davanti: function (W, H) { return rett(0, H - 1.6, W, 1.6, 0, "#e2b444") + rett(0, 0, W, 1.2, 0, "#e2b444"); }, dietro: function (W, H) { return rett(0, H - 1.6, W, 1.6, 0, "#e2b444"); }, fianco: function (W, H) { return rett(0, H - 1.6, W, 1.6, 0, "#e2b444"); } }, 1.6);
    // l'insegna: la cornice d'oro con le lampadine, la fiche gigante e la corona
    function insegna(W, H) {
      var o = "", k, cx = W / 2, cy = H * .58, forma = "M3," + f2(H) + " L3,12 Q3,5 10,5 Q" + f2(cx * .5) + ",-1 " + f2(cx) + ",0 Q" + f2(cx * 1.5) + ",-1 " + f2(W - 10) + ",5 Q" + f2(W - 3) + ",5 " + f2(W - 3) + ",12 L" + f2(W - 3) + "," + f2(H) + " Z";
      o += pth(forma, nuova([[0, "#fff3c2"], [.4, "#e2b444"], [1, "#7a5614"]], 0, 0, 1, 1), bordo(L, 1.2));
      var dentroI = "M7," + f2(H - 3) + " L7,13 Q7,9 12,9 Q" + f2(cx * .5) + ",4 " + f2(cx) + ",4 Q" + f2(cx * 1.5) + ",4 " + f2(W - 12) + ",9 Q" + f2(W - 7) + ",9 " + f2(W - 7) + ",13 L" + f2(W - 7) + "," + f2(H - 3) + " Z";
      o += pth(dentroI, G > 0 ? (NOTTE ? nuova([[0, "#c8203a"], [1, "#6e0a19"]], 0, 0, 0, 1) : nuova([[0, "#a3172c"], [1, "#4a0610"]], 0, 0, 0, 1)) : nuova([[0, "#6b2a18"], [1, "#3a140a"]], 0, 0, 0, 1), bordo(L, .8));
      if (G > 0) {
        var sc = H / 36;
        o += medagliaFiche(cx - 22 * sc, cy + 2 * sc, 6.5 * sc).replace(/#c0202a/g, "#1f1f25") + medagliaFiche(cx + 22 * sc, cy + 2 * sc, 6.5 * sc).replace(/#c0202a/g, "#1fa35a") + medagliaFiche(cx, cy, 9.5 * sc);   // tre fiches: la grande rossa in mezzo
        var cr = "M" + q(cx - 7 * sc, cy - 11 * sc) + " L" + q(cx - 8 * sc, cy - 18 * sc) + " L" + q(cx - 4 * sc, cy - 14.4 * sc) + " L" + q(cx, cy - 20 * sc) + " L" + q(cx + 4 * sc, cy - 14.4 * sc) + " L" + q(cx + 8 * sc, cy - 18 * sc) + " L" + q(cx + 7 * sc, cy - 11 * sc) + " Z";   // la corona
        o += pth(cr, nuova([[0, "#fff3c2"], [.5, "#f2c94c"], [1, "#9c6f1c"]], 0, 0, 1, 1), bordo(L, .7)) + [[-8, -18], [0, -20], [8, -18]].map(function (v) { return cer(cx + v[0] * sc, cy + v[1] * sc, 1.2 * sc, "#e8304a", bordo(L, .35)); }).join("");
        [[-33, -6], [33, -6], [-13, -9], [13, -9]].forEach(function (v, j) { var x = cx + v[0] * sc, y = cy + v[1] * sc, l = (j < 2 ? 2.6 : 1.8) * sc; o += pth("M" + q(x, y - l) + " L" + q(x + l * .3, y - l * .3) + " L" + q(x + l, y) + " L" + q(x + l * .3, y + l * .3) + " L" + q(x, y + l) + " L" + q(x - l * .3, y + l * .3) + " L" + q(x - l, y) + " L" + q(x - l * .3, y - l * .3) + " Z", "#fff6d0", op(NOTTE ? 1 : .8)); });   // le stelline
      }
      var bulbi = [];
      for (k = 0; k <= 7; k++) bulbi.push([5, H - 2 - k * (H - 14) / 7]);
      for (k = 1; k <= 9; k++) { var t = k / 10; bulbi.push([5 + (W - 10) * t, 5 - Math.sin(Math.PI * t) * 4.2]); }
      for (k = 7; k >= 0; k--) bulbi.push([W - 5, H - 2 - k * (H - 14) / 7]);
      bulbi.forEach(function (b) { if (NOTTE) o += cer(b[0], b[1], 2.8, nuovaR([[0, "#fffbe6", .9], [1, "#ffd27a", 0]], .5, .5, .5)); o += cer(b[0], b[1], 1.25, NOTTE ? "#fffbe6" : "#fff1c4", bordo("#7a5614", .4)) + cer(b[0] - .35, b[1] - .4, .4, "#ffffff"); });
      return o;
    }
    var ins = pianoV(BG, -.74, .74, 162, 206, insegna(90.3, 44));
    if (G > 0) s += cassiere + gr + clienti + cornice + ins; else s += clienti + gr + cassiere + cornice + ins;
    return s;
  });

  // =========================================================
  //  BANCONE DEL BAR: il davanti con le lastre d'onice color miele illuminate da dietro tra le lesene di mogano e oro,
  //  il poggiapiedi d'ottone, il piano di marmo bianco venato col filo d'oro, l'alzata a due gradini di vetro
  //  illuminato con le bottiglie (vino, champagne, whisky, gin, liquori), i bicchieri da cocktail, lo shaker e il secchiello.
  //  Da dietro: la parte del barista, coi bicchieri capovolti, il frigo a vetri e il lavello
  // =========================================================
  var BOTTIGLIE = [   // [profilo (z, raggio), colore del vetro, colore del tappo, etichetta]
    [[[0, .034], [13, .034], [15, .03], [18, .013], [23, .012], [23.6, .014]], "#2f6b3a", "#e2b444", "#f3e7c6"],
    [[[0, .04], [13.5, .04], [15, .034], [16.6, .016], [20, .016]], "#c27a2a", "#1f1f25", "#1f1f25"],
    [[[0, .036], [15, .036], [16.2, .03], [18, .015], [21.5, .015]], "#a8dceb", "#d42a2a", "#ffffff"],
    [[[0, .03], [4, .046], [9, .042], [12, .02], [17, .013], [17.6, .015]], "#c0263a", "#e2b444", "#f6d572"],
    [[[0, .033], [17, .033], [18.6, .022], [21.6, .014]], "#e6edf2", "#9aa5ae", "#2f6fd6"],
    [[[0, .038], [12, .038], [13.8, .028], [16.6, .014], [20, .014]], "#7a3a14", "#c99a36", "#f3e7c6"],
    [[[0, .05], [3.6, .054], [7.6, .046], [9.6, .02], [13.6, .016]], "#d08a30", "#7a5614", "#1f1f25"],
    [[[0, .033], [13, .033], [15, .028], [18.4, .012], [23.4, .012], [24, .014]], "#20402a", "#f2c94c", "#fff3c4"]
  ];
  function bottiglia(a, b, z, k) {   // una bottiglia col vetro, il liquido, l'etichetta, il tappo e il lucido
    var B = BOTTIGLIE[k % BOTTIGLIE.length], pr = B[0].map(function (v) { return [z + v[0], v[1]]; }), col = B[1], d = dTornito(a, b, pr), c = P(a, b, z), rx = pr[0][1] * 70.71, o = "";
    var vetro = NOTTE ? [[0, chiaro(col, .55)], [.4, chiaro(col, .2)], [1, scuro(col, .3)]] : [[0, chiaro(col, .35)], [.4, col], [1, scuro(col, .5)]];
    o += pth(d, nuova(vetro, c[0] - rx, 0, c[0] + rx, 0, true), bordo(L, .7));
    var hb = B[0][1][0] * .62;   // l'etichetta a metà pancia (senza scritte)
    o += rett(c[0] - rx * .82, c[1] - hb - 1.2, rx * 1.64, hb * .55, .4, B[3], "stroke='" + L + "' stroke-width='.25' opacity='.95'") + rett(c[0] - rx * .82, c[1] - hb * .6, rx * 1.64, .5, 0, "#e2b444", op(.8));
    var top = pr[pr.length - 1];
    o += rett(c[0] - top[1] * 70.71 - .2, c[1] - (top[0] - z) - 2.2, top[1] * 141.4 + .4, 2.4, .4, B[2], bordo(L, .3));   // il tappo
    o += tratto(linea([c[0] - rx * .5, c[1] - 1.5], [c[0] - rx * .5, c[1] - hb * 1.3]), "#ffffff", .7, op(.75));
    if (NOTTE) o += ell(c[0], c[1] - 1, rx * 1.1, 1.6, nuovaR([[0, "#fff3c8", .8], [1, "#fff3c8", 0]], .5, .5, .5));
    return o;
  }
  function calice(a, b, z) {   // il bicchiere da cocktail: il piede, lo stelo, la coppa a cono con l'oliva
    var c = P(a, b, z), o = ell(c[0], c[1], 2.4, 1.1, "#dfeaf0", "stroke='" + L + "' stroke-width='.4' fill-opacity='.8'");
    o += tratto(linea([c[0], c[1]], [c[0], c[1] - 6]), "#cfe2ea", .7) + pth("M" + q(c[0] - 4, c[1] - 10.5) + " L" + q(c[0], c[1] - 6) + " L" + q(c[0] + 4, c[1] - 10.5) + " Z", "#e7f6fb", "stroke='" + L + "' stroke-width='.4' fill-opacity='.7'");
    o += pth("M" + q(c[0] - 3, c[1] - 9.4) + " L" + q(c[0], c[1] - 6.6) + " L" + q(c[0] + 3, c[1] - 9.4) + " Z", NOTTE ? "#ffe9a8" : "#f3e6b0", op(.85)) + ell(c[0], c[1] - 10.5, 4, 1.2, "#f4fbfd", "stroke='" + L + "' stroke-width='.35' fill-opacity='.8'") + cer(c[0] + 1, c[1] - 9.2, .9, "#6b8a2a", bordo(L, .25)) + tratto(linea([c[0] + 1, c[1] - 9.2], [c[0] + 2.6, c[1] - 12.6]), "#7a5614", .35);
    return o;
  }
  def("bancone_casino", { nome: "Bancone del bar", fp: [3, 1], box: [-100, -156, 100, 52], dietro: true, piano: 68, luce: [0, 0, 84, 145, "#ffc46b"] }, function () {
    var s = ombraPianta(-1.5, 1.5, -.3, .42, 1.1, .08), i;
    var nero = [lin("bns", [[0, "#3e3a40"], [1, "#1c1a1d"]], 0, 0, 1, 1), lin("bnl", [[0, "#2c292e"], [1, "#151316"]], 0, 0, 0, 1), lin("bnd", [[0, "#141215"], [1, "#09080a"]], 0, 0, 0, 1)];
    var corpoB = blocco(-1.44, 1.44, -.24, .32, 0, 5, nero, null, 1.6);
    // il davanti: le lastre d'onice illuminate tra le lesene di mogano coi capitelli d'oro; dietro la parte del barista
    function onice(x, y, w, h, seme) {
      var r2 = rnd(seme), o = rett(x, y, w, h, 0, NOTTE ? nuovaR([[0, "#fff4d0"], [.5, "#ffc76a"], [1, "#d9822a"]], .5, .45, .75) : nuova([[0, "#f2c681"], [.5, "#d9963e"], [1, "#a8621c"]], 0, 0, 1, 1)), k, j;
      for (k = 0; k < 9; k++) {   // le onde dell'onice
        var y0 = y + r2() * h, pp = [];
        for (j = 0; j <= 8; j++) pp.push([x + w * j / 8, y0 + Math.sin(j * .9 + k) * (1.5 + r2() * 2.5) + (r2() - .5) * 2]);
        o += tratto(liscio(pp), k % 3 ? (NOTTE ? "#fff8e0" : "#f8deb0") : "#8a4a12", .5 + r2() * 1.4, op(.35 + r2() * .3));
      }
      return dentro("M" + q(x, y) + " h" + f2(w) + " v" + f2(h) + " h" + f2(-w) + " Z", o) + rett(x, y, w, h, 0, "none", "stroke='#e2b444' stroke-width='1.1'");
    }
    function davanti(W, H) {
      var o = rett(0, 0, W, H, 0, nuova([[0, chiaro(MOGANO, .12)], [1, scuro(MOGANO, .2)]], 0, 0, 0, 1)), k, lw = W / 3;
      for (k = 0; k < 3; k++) o += onice(k * lw + 5.5, 5, lw - 11, H - 10, 300 + k);
      for (k = 0; k <= 3; k++) { var xl = Math.min(W - 5, Math.max(0, k * lw - 2.5)); o += rett(xl, 0, 5, H, 0, nuova([[0, chiaro(MOGANO, .25)], [.5, MOGANO], [1, scuro(MOGANO, .35)]], 0, 0, 1, 0)) + rett(xl - .5, 1.5, 6, 3, .6, "#e2b444", bordo(L, .4)) + rett(xl - .5, H - 4, 6, 2.6, .6, "#c99a36", bordo(L, .4)); }
      return o + rett(0, 0, W, 1.4, 0, "#e2b444");
    }
    function dietro(W, H) {   // il barista: i ripiani coi bicchieri capovolti, il frigo a vetri, il lavello
      var o = rett(0, 0, W, H, 0, nuova([[0, chiaro(MOGANO, .08)], [1, scuro(MOGANO, .3)]], 0, 0, 0, 1)), k, j, lw = W / 3;
      o += rett(4, 4, lw - 8, H - 8, 1, NOTTE ? nuova([[0, "#e9fbff"], [1, "#9fd8ea"]], 0, 0, 0, 1) : nuova([[0, "#bfe6f2"], [1, "#5f9fb8"]], 0, 0, 0, 1), bordo(L, .8));   // il frigo a vetri con le bottigliette
      for (j = 0; j < 2; j++) for (k = 0; k < 6; k++) { var bx = 8 + k * (lw - 16) / 5.5, by = 10 + j * 22; o += rett(bx, by, 3, 11, 1.2, ["#2f6b3a", "#c27a2a", "#c0263a", "#e6edf2"][(k + j) % 4], bordo(L, .3)) + rett(bx + .5, by + 1, .7, 7, 0, "#ffffff", op(.6)); }
      o += rett(4, 4 + (H - 8) / 2, lw - 8, 1.2, 0, "#cfd8dd") + rett(lw - 9, 8, 1.6, H - 16, .8, "#cfd8dd", bordo(L, .3));
      for (k = 1; k < 3; k++) {   // i ripiani coi bicchieri
        var x0 = k * lw + 4, w = lw - 8;
        [12, 30].forEach(function (y) { o += rett(x0, y + 10, w, 1.6, 0, "#3a1a0e"); for (j = 0; j < 6; j++) { var gx = x0 + 3 + j * (w - 6) / 5.5; o += pth("M" + q(gx - 2.2, y + 10) + " L" + q(gx - 1.6, y + 2) + " L" + q(gx + 1.6, y + 2) + " L" + q(gx + 2.2, y + 10) + " Z", "#dfeef4", "stroke='" + L + "' stroke-width='.35' fill-opacity='.8'") + rett(gx - 1, y + 3, .6, 6, 0, "#ffffff", op(.7)); } });
      }
      return o + rett(0, 0, W, 1.4, 0, "#e2b444");
    }
    corpoB += blocco(-1.42, 1.42, -.22, .3, 5, 64, MOGANO, { davanti: davanti, dietro: dietro, fianco: function (W, H) { return onice(4, 5, W - 8, H - 10, 309); } }, 2);
    // il poggiapiedi d'ottone davanti, coi sostegni
    var pg = "", pf0 = P(-1.38, .4, 9.5), pf1 = P(1.38, .4, 9.5);
    [-1.2, -.4, .4, 1.2].forEach(function (a) { var p0 = P(a, .3, 11), p1 = P(a, .4, 9.5); pg += tratto(linea(p0, p1), L, 2.6) + tratto(linea(p0, p1), "#d9a83a", 1.4); });
    pg += tratto(linea(pf0, pf1), L, 3.6) + tratto(linea(pf0, pf1), "#d9a83a", 2.2) + tratto(linea(pf0, pf1), "#fff3c4", .7, trasla(0, -.6));
    // il piano di marmo bianco venato col bordo tondo e il filo d'oro
    var marmoT = [lin("bms", [[0, "#ffffff"], [1, "#efe9de"]], 0, 0, 1, 1), lin("bml", [[0, "#f6f2ea"], [1, "#d9d1c3"]], 0, 0, 0, 1), lin("bmd", [[0, "#cfc6b6"], [1, "#a99f8e"]], 0, 0, 0, 1)];
    var piano2 = blocco(-1.48, 1.48, -.26, .4, 64, 68.4, marmoT, { davanti: function (W, H) { return venato(W, H, 41, "#9b8f7c", 4, .5) + rett(0, H - 1.2, W, 1.2, 0, "#e2b444"); }, dietro: function (W, H) { return venato(W, H, 43, "#9b8f7c", 4, .5); }, fianco: function (W, H) { return venato(W, H, 45, "#9b8f7c", 3, .5); }, sopra: function (A, B, C, D) {
      var v = "", r2 = rnd(1864), k;
      for (k = 0; k < 8; k++) { var t0 = r2(), t1 = Math.min(1, Math.max(0, t0 + (r2() - .5) * .35)), p0 = lerp(A, B, t0), p1 = lerp(D, C, t1), m = lerp(p0, p1, .5); v += tratto("M" + q(p0) + " Q" + q(m[0] + (r2() - .5) * 14, m[1]) + " " + q(p1), k % 3 ? "#a39684" : "#c9a45a", .4 + r2() * .6, op(.5)); }
      return dentro(chiuso([A, B, C, D]), v) + tratto(linea(lerp(A, D, .15), lerp(B, C, .15)), "#ffffff", 1.6, op(.4));
    } }, 1.8);
    // l'alzata a due gradini di vetro illuminato col bordo d'ottone, e le bottiglie
    function vetroLuce(W, H) { return rett(0, 0, W, H, 0, NOTTE ? nuova([[0, "#fffbe6"], [.5, "#ffd98a"], [1, "#f0a640"]], 0, 0, 0, 1) : nuova([[0, "#f6e3b8"], [1, "#c99a5a"]], 0, 0, 0, 1)) + rett(0, 0, W, 1.2, 0, "#e2b444") + rett(0, H - 1, W, 1, 0, "#7a5614"); }
    var g1 = blocco(-1.36, 1.36, -.25, -.06, 68.4, 75.4, "#c99a5a", { davanti: vetroLuce, dietro: function (W, H) { return rett(0, 0, W, H, 0, MOGANO) + rett(0, 0, W, 1.2, 0, "#e2b444"); }, fianco: vetroLuce }, 1.3);
    var g2 = blocco(-1.3, 1.3, -.25, -.155, 75.4, 84.4, "#c99a5a", { davanti: vetroLuce, dietro: function (W, H) { return rett(0, 0, W, H, 0, MOGANO) + rett(0, 0, W, 1.2, 0, "#e2b444"); }, fianco: vetroLuce }, 1.3);
    var fila1 = "", fila2 = "", n1 = 11, n2 = 10;
    for (i = 0; i < n1; i++) fila1 += bottiglia(-1.24 + i * 2.48 / (n1 - 1), -.11, 75.4, i * 3 + 1);
    for (i = 0; i < n2; i++) fila2 += bottiglia(-1.16 + i * 2.32 / (n2 - 1), -.2, 84.4, i * 5 + 2);
    // sul piano: due calici da cocktail, lo shaker d'argento, il secchiello con lo champagne
    var sopra = calice(-1.02, .16, 68.4) + calice(.62, .2, 68.4);
    sopra += tornito(-.5, .18, [[68.4, .032], [77, .036], [78, .03], [80, .026], [82.5, .016], [83.5, .016]], [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]], .8, [2], .6);
    sopra += tornito(1.1, .14, [[68.4, .055], [69.4, .058], [77, .07], [78, .074]], [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]], .9, [3], .7);
    var cs2 = P(1.1, .14, 78), pb3 = "M" + q(cs2[0] - 1.6, cs2[1] + 1) + " L" + q(cs2[0] + 2.2, cs2[1] - 11) + " L" + q(cs2[0] + 4, cs2[1] - 10.4) + " L" + q(cs2[0] + 1.6, cs2[1] + 1.4) + " Z";
    sopra += pth(pb3, lin("ch", [[0, "#3a6a3a"], [1, "#14301c"]], 0, 0, 1, 0), bordo(L, .5)) + pth("M" + q(cs2[0] + 1.5, cs2[1] - 8.2) + " L" + q(cs2[0] + 2.2, cs2[1] - 11) + " L" + q(cs2[0] + 4, cs2[1] - 10.4) + " L" + q(cs2[0] + 3.1, cs2[1] - 7.6) + " Z", "#f2c94c", bordo(L, .4)) + ell(cs2[0], cs2[1], 5, 2.4, "#c9d6dc", "stroke='" + L + "' stroke-width='.5'");
    for (i = 0; i < 5; i++) sopra += cer(cs2[0] - 3 + i * 1.5, cs2[1] - .4 + (i % 2) * .5, .8, "#f4fbfd", "stroke='#9fb8c4' stroke-width='.3'");   // il ghiaccio
    if (G > 0) s += corpoB + pg + piano2 + g1 + g2 + fila2 + fila1 + sopra;
    else s += pg + corpoB + piano2 + sopra + g1 + fila1 + g2 + fila2;
    return s;
  });

  // =========================================================
  //  LAMPADARI DI CRISTALLO (appesi in alto in mezzo alla sala, sotto si cammina): la catena d'oro che sale al soffitto,
  //  la corona con le punte di cristallo, la "tenda" di fili di perline fino al giro grande dei bracci con le candele,
  //  i festoni di perline, le gocce a prisma, il cesto di perline sotto e la sfera sfaccettata in fondo.
  //  Di notte (nel Casinò sempre) le candele accese e i cristalli che scintillano
  // =========================================================
  function lampadario(K) {
    var cose = [], r = rnd(K.seme), i, j, oro = NOTTE ? [[0, "#fff8d8"], [.35, "#ffd75e"], [.75, "#d39b26"], [1, "#8a5c12"]] : DORATO;
    var cri = NOTTE ? "#fff8e6" : "#eef8ff", criB = NOTTE ? "#d9b46a" : "#6f9fb5";
    function pz(ph, rr, z) { return suCilindro(0, 0, rr, ph, z); }   // ph: 0 = davanti a chi guarda
    function dep(ph) { return Math.cos(ph); }   // più è grande, più è vicino a chi guarda
    function perla(c, k) { return cer(c[0], c[1], .78 * k, cri, "stroke='" + criB + "' stroke-width='.26'") + cer(c[0] - .25 * k, c[1] - .27 * k, .27 * k, "#ffffff"); }
    function goccia(c, l, k) {   // la goccia a prisma
      k = k || 1; var w = l * .28;
      return pth("M" + q(c[0], c[1]) + " L" + q(c[0] + w, c[1] + l * .42) + " L" + q(c[0], c[1] + l) + " L" + q(c[0] - w, c[1] + l * .42) + " Z", lin("gc", NOTTE ? [[0, "#ffffff"], [.5, "#fff3d0"], [1, "#e6c98a"]] : [[0, "#ffffff"], [.45, "#e3f3fb"], [1, "#9fc8dc"]], 0, 0, 1, 1), "stroke='" + criB + "' stroke-width='.25'") +
        tratto(linea([c[0], c[1] + .4], [c[0], c[1] + l - .4]), "#ffffff", .25, op(.85));
    }
    function filo(A, B, sag, n, k, gonfia) {   // un filo di perline da A a B (punti 3D [ph, r, z]) che si incurva di sag (e si allarga di gonfia)
      var o = "", m;
      for (m = 0; m <= n; m++) { var t = m / n, ph = A[0] + (B[0] - A[0]) * t, rr = A[1] + (B[1] - A[1]) * t + (gonfia || 0) * Math.sin(Math.PI * t), z = A[2] + (B[2] - A[2]) * t - sag * Math.sin(Math.PI * t); o += perla(pz(ph, rr, z), (m % 3 === 1 ? 1.25 : .95) * (k || 1)); }
      return o;
    }
    function candela(ph, rr, z, k) {   // la coppetta d'oro, la candela e la lampadina a fiamma
      var c = pz(ph, rr, z), o = "";
      o += ell(c[0], c[1] + .5 * k, 2.4 * k, .9 * k, nuova(oro, c[0] - 2.4 * k, 0, c[0] + 2.4 * k, 0, true), bordo(L, .4));
      o += rett(c[0] - .95 * k, c[1] - 5.6 * k, 1.9 * k, 5.6 * k, .4, lin("cd", [[0, "#ffffff"], [1, "#e6d9bb"]], 0, 0, 1, 0), bordo(L, .35));
      var fy = c[1] - 5.8 * k, fl = "M" + q(c[0], fy - 4.6 * k) + " C" + q(c[0] + 1.6 * k, fy - 3 * k) + " " + q(c[0] + 1.5 * k, fy - .8 * k) + " " + q(c[0], fy) + " C" + q(c[0] - 1.5 * k, fy - .8 * k) + " " + q(c[0] - 1.6 * k, fy - 3 * k) + " " + q(c[0], fy - 4.6 * k) + " Z";
      if (NOTTE) o += cer(c[0], fy - 2.2 * k, 5.5 * k, rad("ha", [[0, "#fffbe6", .9], [.35, "#ffe9a0", .45], [1, "#ffe9a0", 0]], .5, .5, .5)) + pth(fl, rad("fn", [[0, "#ffffff"], [.55, "#fff6cf"], [1, "#ffcf6a"]], .5, .6, .6), bordo("#d9a530", .3));
      else o += pth(fl, lin("fv", [[0, "#ffffff"], [.6, "#f3eee2"], [1, "#d5cab2"]], 0, 0, 1, 0), bordo(L, .35)) + ell(c[0] - .45 * k, fy - 2.6 * k, .3 * k, .8 * k, "#ffffff");
      return o;
    }
    function giroOro(rr, z, w, davanti) {   // il giro d'oro (la metà dietro o quella davanti)
      var e = anello(0, 0, z, rr), d = (davanti ? arcoDav : arcoDie)(e);
      return tratto(d, L, w + 1.6) + tratto(d, nuova(oro, e.x - e.rx, 0, e.x + e.rx, 0, true), w) + tratto(d, "#fff6cc", w * .3, op(.8) + " " + trasla(0, -w * .3));
    }
    // la catena che sale al soffitto, la corona con le punte, la coppa
    var cat = "";
    for (i = 0; i < Math.ceil((K.top - K.zc - 4) / 2.6); i++) { var yy = -K.top + i * 2.6; cat += i % 2 ? rett(-.5, yy, 1, 2.6, .4, nuova(oro, -.5, 0, .5, 0, true), bordo(L, .3)) : ell(0, yy + 1.3, 1, 1.5, "none", "stroke='" + L + "' stroke-width='.9'") + ell(0, yy + 1.3, 1, 1.5, "none", "stroke='#e0b54a' stroke-width='.45'"); }
    cose.push([-3, cat]);
    for (i = 0; i < K.punte; i++) { var pp2 = (i + .5) / K.punte * 6.2832, b2 = pz(pp2, K.rc, K.zc), t2 = pz(pp2, K.rc * 1.12, K.zc + 6 * K.k); cose.push([dep(pp2) * .3 - 1.5, tratto(linea(b2, t2), L, 2) + tratto(linea(b2, t2), cri, 1.1) + tratto(linea(b2, t2), "#ffffff", .35, trasla(-.25, 0)) + cer(t2[0], t2[1], .7, "#ffffff", "stroke='" + criB + "' stroke-width='.2'")]); }   // le punte di cristallo della corona
    cose.push([-1.3, giroOro(K.rc, K.zc, 1.5 * K.k, false)], [1.3, giroOro(K.rc, K.zc, 1.5 * K.k, true)]);
    // il fusto in mezzo: la coppa sotto la corona, il vaso di cristallo, il nodo dei bracci alti, il piatto dei bracci bassi, la pera d'oro
    var fu = "", zv = K.zu ? K.zu + 9 * K.k : (K.zc + K.zp) / 2 + 2;
    fu += pth("M" + q(-4.2 * K.k, -K.zc) + " Q" + q(-3.4 * K.k, -K.zc + 4 * K.k) + " " + q(0, -K.zc + 5 * K.k) + " Q" + q(3.4 * K.k, -K.zc + 4 * K.k) + " " + q(4.2 * K.k, -K.zc) + " Z", nuova(oro, -4.2 * K.k, 0, 4.2 * K.k, 0, true), bordo(L, .5));
    fu += rett(-.9, -K.zc + 4, 1.8, K.zc - zv - 9 * K.k, .5, nuova(oro, -.9, 0, .9, 0, true), bordo(L, .4));
    fu += pth("M" + q(-2.6 * K.k, -zv - 5 * K.k) + " C" + q(-4.8 * K.k, -zv - 2 * K.k) + " " + q(-4.4 * K.k, -zv + 2.8 * K.k) + " " + q(-1.6 * K.k, -zv + 4.4 * K.k) + " L" + q(1.6 * K.k, -zv + 4.4 * K.k) + " C" + q(4.4 * K.k, -zv + 2.8 * K.k) + " " + q(4.8 * K.k, -zv - 2 * K.k) + " " + q(2.6 * K.k, -zv - 5 * K.k) + " Z", lin("ur", NOTTE ? [[0, "#ffffff"], [.5, "#fff6dc"], [1, "#e6c98a"]] : [[0, "#ffffff"], [.5, "#e3f3fb"], [1, "#9fc8dc"]], 0, 0, 1, 1), "stroke='" + criB + "' stroke-width='.4'") + tratto("M" + q(-2.6 * K.k, -zv - 3 * K.k) + " Q" + q(-3.6 * K.k, -zv) + " " + q(-1.6 * K.k, -zv + 3 * K.k), "#ffffff", .6, op(.9));
    fu += rett(-.9, -zv + 4.4 * K.k, 1.8, zv - K.zp - 4.4 * K.k, .5, nuova(oro, -.9, 0, .9, 0, true), bordo(L, .4));
    if (K.zu) fu += ell(0, -K.zu, 2.6 * K.k, 1.8 * K.k, nuovaR([[0, "#fff6cf"], [.5, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), bordo(L, .5));
    cose.push([0, fu]);
    var pe = anello(0, 0, K.zp, .1 * K.k);   // il piatto dei bracci bassi (dietro e davanti) e la pera d'oro sotto
    cose.push([-.3, ell(pe.x, pe.y, pe.rx, pe.ry, nuova(oro, pe.x - pe.rx, 0, pe.x + pe.rx, 0, true), bordo(L, .5))]);
    cose.push([.3, pth("M" + q(pe.x - pe.rx, pe.y) + " A" + f2(pe.rx) + "," + f2(pe.ry) + " 0 0,0 " + q(pe.x + pe.rx, pe.y) + " C" + q(pe.x + pe.rx * .9, pe.y + 6 * K.k) + " " + q(pe.x + 2, pe.y + 10 * K.k) + " " + q(pe.x, pe.y + 12 * K.k) + " C" + q(pe.x - 2, pe.y + 10 * K.k) + " " + q(pe.x - pe.rx * .9, pe.y + 6 * K.k) + " " + q(pe.x - pe.rx, pe.y) + " Z", nuova(oro, pe.x - pe.rx, 0, pe.x + pe.rx, 0, true), bordo(L, .6)) +
      tratto("M" + q(pe.x - pe.rx * .6, pe.y + 2) + " Q" + q(pe.x - pe.rx * .5, pe.y + 7 * K.k) + " " + q(pe.x - 1, pe.y + 10 * K.k), "#fff6cc", .6, op(.8))]);
    for (i = 0; i < 10; i++) { var pg = (i + .5) / 10 * 6.2832; cose.push([dep(pg) * .32, goccia(pz(pg, .1 * K.k, K.zp - .6), 6 * K.k)]); }   // le goccine attorno al piatto
    var zSf = K.zp - 15.8 * K.k;   // il sacco di fili di perline sotto il piatto, che si stringe sulla sfera
    for (i = 0; i < K.sacco; i++) { var ps4 = (i + .5) / K.sacco * 6.2832, d4 = dep(ps4); cose.push([d4 * .3 + (d4 > 0 ? .36 : -.36), filo([ps4, .16 * K.k, K.zp - 1.5], [ps4, .025, zSf + 3.2 * K.k], 0, 11, .92, .11 * K.k)]); }
    // i bracci bassi a S (dal piatto alla coppetta, giù e poi su), con le candele, le gocce, i festoni tra un braccio e l'altro e verso la corona
    function braccioS(ph, r0, z0, r1, z1, k) {
      var pp = [], m, c1 = [r1 * .42, z0 - 10 * k], c2 = [r1 * .96, z1 - 15 * k];
      for (m = 0; m <= 16; m++) { var t = m / 16, u = 1 - t, rr = u * u * u * r0 + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * r1, zz = u * u * u * z0 + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * z1; pp.push(pz(ph, rr, zz)); }
      var d = liscio(pp), lo = pp[7];
      return tratto(d, L, 3.3 * k) + tratto(d, NOTTE ? "#f6c94e" : "#d9a530", 2.1 * k) + tratto(d, "#fff6cc", .7 * k, op(.85) + " " + trasla(-.25, -.35)) +
        tratto("M" + q(lo[0], lo[1]) + " a" + f2(1.6 * k) + "," + f2(1.6 * k) + " 0 1,1 " + f2(1.4 * k) + "," + f2(2 * k), L, 1.6 * k) + tratto("M" + q(lo[0], lo[1]) + " a" + f2(1.6 * k) + "," + f2(1.6 * k) + " 0 1,1 " + f2(1.4 * k) + "," + f2(2 * k), "#e0b54a", .8 * k);   // il ricciolo sotto
    }
    for (i = 0; i < K.nl; i++) {
      var pb = (i + .5) / K.nl * 6.2832, pb2 = (i + 1.5) / K.nl * 6.2832, dd = dep(pb);
      cose.push([dd * 1.05 + .02, braccioS(pb, .09 * K.k, K.zp, K.rl, K.zl, K.k) + candela(pb, K.rl, K.zl, K.k * 1.12)]);
      cose.push([dd * 1.05 + .01, goccia(pz(pb, K.rl * .99, K.zl - 1.6 * K.k), 13 * K.k)]);
      cose.push([dep((pb + pb2) / 2) * 1.05 + .03, filo([pb, K.rl * .985, K.zl + 1 * K.k], [pb2, K.rl * .985, K.zl + 1 * K.k], 9 * K.k, 13, 1)]);
      var bm = pz((pb + pb2) / 2, K.rl * .93, K.zl + 1 * K.k - 9 * K.k);
      cose.push([dep((pb + pb2) / 2) * 1.05 + .04, goccia([bm[0], bm[1] + .6], 7 * K.k)]);
      cose.push([dd * .85, filo([pb, K.rc * .95, K.zc - 1.5], [pb, K.rl * .97, K.zl + 2 * K.k], 6 * K.k, K.perle, .95)]);   // dalla corona giù fino al braccio
    }
    // i bracci alti (corti), con le candele e i festoncini
    if (K.nu) for (i = 0; i < K.nu; i++) {
      var pu = i / K.nu * 6.2832, pu2 = (i + 1) / K.nu * 6.2832;
      cose.push([dep(pu) * .55 + .02, braccioS(pu, .03, K.zu, K.ru, K.zuc, K.k * .7) + candela(pu, K.ru, K.zuc, K.k * .82)]);
      cose.push([dep(pu) * .55 + .01, goccia(pz(pu, K.ru * .98, K.zuc - 1.4), 7 * K.k)]);
      cose.push([dep((pu + pu2) / 2) * .55 + .03, filo([pu, K.ru * .98, K.zuc + .6], [pu2, K.ru * .98, K.zuc + .6], 5 * K.k, 8, .9)]);
    }
    // la sfera sfaccettata in fondo e l'ultima goccia
    var zs = zSf;
    cose.push([2, cer(0, -zs, 3.8 * K.k, nuovaR(NOTTE ? [[0, "#ffffff"], [.5, "#fff3d0"], [1, "#d9b46a"]] : [[0, "#ffffff"], [.5, "#dff1fa"], [1, "#8fbcd2"]], .38, .32, .8), "stroke='" + criB + "' stroke-width='.35'") +
      pth("M" + q(-3.8 * K.k, -zs) + " L" + q(0, -zs - 1.3 * K.k) + " L" + q(3.8 * K.k, -zs) + " M" + q(-2.6 * K.k, -zs - 2.8 * K.k) + " L" + q(0, -zs) + " L" + q(2.6 * K.k, -zs - 2.8 * K.k) + " M" + q(-2.6 * K.k, -zs + 2.8 * K.k) + " L" + q(0, -zs) + " L" + q(2.6 * K.k, -zs + 2.8 * K.k), "none", "stroke='" + criB + "' stroke-width='.3' opacity='.7'") +
      cer(-1.3 * K.k, -zs - 1.5 * K.k, 1 * K.k, "#ffffff", op(.9)) + goccia([0, -zs + 3.6 * K.k], 8 * K.k)]);
    var s = ordina(cose);
    if (NOTTE) for (i = 0; i < K.lampi; i++) {   // i lampi di luce sui cristalli
      var ph3 = r() * 6.2832, rr3 = .15 + r() * (K.rl - .15), zz3 = K.zl - 10 + r() * (K.zc - K.zl + 8), c3 = pz(ph3, rr3, zz3), l3 = 1.6 + r() * 2.6;
      s += pth("M" + q(c3[0], c3[1] - l3) + " L" + q(c3[0] + .4, c3[1] - .4) + " L" + q(c3[0] + l3, c3[1]) + " L" + q(c3[0] + .4, c3[1] + .4) + " L" + q(c3[0], c3[1] + l3) + " L" + q(c3[0] - .4, c3[1] + .4) + " L" + q(c3[0] - l3, c3[1]) + " L" + q(c3[0] - .4, c3[1] - .4) + " Z", "#ffffff", op(.9));
    }
    return s;
  }
  def("lampadario_gigante", { tipo: "sospeso", nome: "Lampadario di cristallo gigante", fp: [2, 2], box: [-66, -249, 66, -148], luce: [0, 0, 200, 230, "#ffe6a8"] }, function () {
    return lampadario({ seme: 1863, top: 249, zc: 233, rc: .2, punte: 14, zu: 210, ru: .42, zuc: 217, nu: 8, zp: 191, rl: .8, zl: 199, nl: 12, perle: 30, sacco: 16, k: 1, lampi: 30 });
  });
  def("lampadario_piccolo", { tipo: "sospeso", nome: "Lampadario di cristallo", fp: [1, 1], box: [-40, -249, 40, -168], luce: [0, 0, 204, 140, "#ffe6a8"] }, function () {
    return lampadario({ seme: 1910, top: 249, zc: 226, rc: .11, punte: 9, zu: 0, zp: 198, rl: .43, zl: 205, nl: 8, perle: 18, sacco: 10, k: .78, lampi: 14 });
  });

  // =========================================================
  function misure(d) { if (d.tipo === "terra") return { w: d.w, h: d.h }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), tipo = d.tipo || "piedi", o = { tipo: tipo, nome: d.nome, stanza: "casino", reparto: "casino", w: m.w, h: m.h, fp: (d.fp || [1, 1]).slice(), prezzo: 0, qual: 2 };
      if (tipo !== "terra") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.piano) o.piano = d.piano;
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      if (d.luce) { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "cs" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!opz.notte;
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      var testa = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "");
      if (d.tipo === "terra") return testa + c + "</svg>";
      return testa + "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

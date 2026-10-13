/* =========================================================
   SPeeD GAME — I LOCALI DEL CASINÒ, VISTI DALL'ALTO (come i mobili della casa, js/mobili-arte.js)
   Il bar col palco dello spettacolo, il ristorante col buffet e la sala delle scommesse sportive:
   il palco (la pedana di legno lucido con le lampadine, il sipario di velluto rosso, i fari colorati, il microfono d'argento),
   il banco e le poltrone delle scommesse, il tabellone delle quote, il buffet, il tavolo e la sedia del ristorante,
   il tavolino da cocktail con la lampada, la poltrona Chesterfield, la torre di champagne, la balaustra e la fioriera
   di marmo (si mettono in fila senza giunte) e l'acquario cilindrico fino al soffitto.
   Una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Tipi: "piedi" (in prospettiva; il davanti guarda in basso a sinistra, con { dietro: true } lo stesso pezzo girato),
   "parete" (il tabellone delle quote: un disegno piatto 124 × 200 che il gioco piega su due pezzi di muro).
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

  // ---------- attrezzi in più (dal soggiorno il capitonné e i chiodini, dalle slot le cifre luminose, dagli acquari i pesci) ----------
  function f1(n) { return Math.round(n * 10) / 10; }
  function rigaB(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f2(w) + "' stroke-linecap='butt'" + attr(x) + "/>"; }   // una riga coi capi dritti (non fa il puntino dove due pezzi si toccano)
  function pianoV(asse, fisso, t0, t1, z0, z1, cont) {   // un disegno piatto su un piano dritto: "a" = il piano a b fisso (largo lungo a), "b" = il piano ad a fisso; y piatta = z1 − z
    var W = Math.abs(t1 - t0) * 61, H = z1 - z0, lo = Math.min(t0, t1), hi = Math.max(t0, t1), s, e;
    if (asse === "a") { s = G > 0 ? lo : hi; e = G > 0 ? hi : lo; return piano(P(s, fisso, z1), P(e, fisso, z1), P(s, fisso, z0), W, H, cont); }
    s = G > 0 ? hi : lo; e = G > 0 ? lo : hi; return piano(P(fisso, s, z1), P(fisso, e, z1), P(fisso, s, z0), W, H, cont);
  }
  function buio(W, H, k, su) { return rett(0, 0, W, H, 0, nuova(su ? [[0, "#000", k], [1, "#000", 0]] : [[0, "#000", 0], [1, "#000", k]], 0, 0, 0, 1)); }   // l'ombra morbida in un angolo
  function solco(H, x, z, t0, t1) {   // l'ombra in fondo alla seduta, dove tocca lo schienale (solo da davanti)
    if (G < 0) return "";
    var pp = aperto(H.lungo(H.vicinoA(x, z), t0, t1));
    return tratto(pp, "#000000", 8, op(.09)) + tratto(pp, "#000000", 3.5, op(.12));
  }
  // il capitonné a rombi (piatto, W × H): i bottoni in file sfalsate, le pieghe che li uniscono, i rombi gonfi e lucidi
  function capitonne(W, H, ys, n, c) {
    var dx = W / n, s = "", rows = [], i, k;
    ys.forEach(function (y, k2) { var row = [], m = k2 % 2 ? n - 1 : n; for (i = 0; i < m; i++) row.push([(k2 % 2 ? dx : dx / 2) + i * dx, y]); rows.push(row); });
    var gp = nuovaR([[0, "#fff", .38], [.4, "#fff", .1], [.75, "#000", .04], [1, "#000", .26]], .4, .34, .66);
    for (k = 0; k < ys.length; k++) {
      var y = ys[k], su = k ? y - ys[k - 1] : y, giu = k < ys.length - 1 ? ys[k + 1] - y : H - y, off = k % 2 ? dx : dx / 2;
      for (i = -1; i < rows[k].length; i++) {
        var x = off + i * dx + dx / 2, t = [x, y - su], d = [x + dx / 2, y], b = [x, y + giu], l = [x - dx / 2, y];
        s += pth("M" + q(t) + " Q" + q(x + dx * .34, y - su * .38) + " " + q(d) + " Q" + q(x + dx * .3, y + giu * .4) + " " + q(b) + " Q" + q(x - dx * .3, y + giu * .4) + " " + q(l) + " Q" + q(x - dx * .34, y - su * .38) + " " + q(t) + " Z", gp);
      }
    }
    function piega(a, b) { return tratto(linea(a, b), scuro(c, .6), .8, op(.85)) + tratto(linea([a[0] + .25, a[1] + .55], [b[0] + .25, b[1] + .55]), chiaro(c, .38), .45, op(.6)); }
    for (k = 0; k < ys.length; k++) rows[k].forEach(function (bt) {
      var su = k ? ys[k - 1] : 0, giu = k < ys.length - 1 ? ys[k + 1] : H;
      if (!k) { s += piega(bt, [bt[0] - dx / 2, su]) + piega(bt, [bt[0] + dx / 2, su]); }
      s += piega(bt, [bt[0] - dx / 2, giu]) + piega(bt, [bt[0] + dx / 2, giu]);
    });
    for (k = 0; k < ys.length; k++) rows[k].forEach(function (bt) {
      s += ell(bt[0], bt[1] + .3, 2.8, 2.2, nuovaR([[0, "#000", .45], [1, "#000", 0]], .5, .5, .5)) + cer(bt[0], bt[1], 1.15, nuovaR([[0, chiaro(c, .5)], [.6, c], [1, scuro(c, .5)]], .35, .3, .8), bordo(scuro(c, .65), .35));
    });
    return s;
  }
  function chiodi(pp, r) {   // i chiodini d'ottone, uno accanto all'altro
    var g = rad("chd", [[0, "#fffbe0"], [.35, "#f1cf6e"], [.75, "#b5862a"], [1, "#6e4c10"]], .38, .32, .7);
    return pp.map(function (w) { return cer(w[0] + .3, w[1] + .45, r || .85, "#000", op(.35)) + cer(w[0], w[1], r || .85, g, "stroke='#5a3c0c' stroke-width='.3'"); }).join("");
  }
  function patina(b, seme, n) {   // le macchie morbide della pelle (chiare e scure), dentro i limiti b sullo schermo
    var r = rnd(seme), s = "", i;
    for (i = 0; i < (n || 8); i++) { var x = b[0] + r() * (b[2] - b[0]), y = b[1] + r() * (b[3] - b[1]); s += ell(x, y, 3 + r() * 6, 1.5 + r() * 2.5, r() < .5 ? "#fff" : "#000", op(f2(.025 + r() * .03))); }
    return s;
  }
  // una gamba tonda e affusolata da T (in alto) a F (il piede), punti [a, b, z]; w0 e w1 = mezze larghezze sullo schermo
  function gambaTonda(T, F, w0, w1, stops, puntale) {
    var t = P(T[0], T[1], T[2]), f = P(F[0], F[1], F[2]), dx = f[0] - t[0], dy = f[1] - t[1], l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
    if (nx > 0) { nx = -nx; ny = -ny; }
    var a = [t[0] + nx * w0, t[1] + ny * w0], b = [t[0] - nx * w0, t[1] - ny * w0], c = [f[0] - nx * w1, f[1] - ny * w1], d = [f[0] + nx * w1, f[1] + ny * w1];
    var s = poly([a, b, c, d], nuova(stops, a[0], a[1], b[0], b[1], true), bordo(L, 1.1));
    if (puntale) {
      var k = .3, pa = [a[0] + (d[0] - a[0]) * (1 - k), a[1] + (d[1] - a[1]) * (1 - k)], pb = [b[0] + (c[0] - b[0]) * (1 - k), b[1] + (c[1] - b[1]) * (1 - k)];
      s += poly([pa, pb, c, d], nuova(puntale, pa[0], pa[1], pb[0], pb[1], true), bordo(L, 1));
    }
    return s + tratto(linea([t[0] + nx * w0 * .4, t[1] + ny * w0 * .4], [f[0] + nx * w1 * .4, f[1] + ny * w1 * .4]), "#ffffff", .7, op(.55)) + ell(f[0], f[1], w1, w1 * .5, scuro(stops[stops.length - 1][1], .2), bordo(L, .8));
  }
  function piedeTornito(a, b, legno) {   // il piedino tornito a cipolla, col collarino d'ottone
    var F = forma(a, b, .05, .05, .05, 2), lv = [giro(F, 0, .5, 24), giro(F, 1.4, .82, 24), giro(F, 3.3, 1, 24), giro(F, 5.2, .78, 24)];
    return corpo(lv, [[0, chiaro(legno, .4)], [.4, legno], [1, scuro(legno, .45)]], 1.2) + corpo([giro(F, 5, .8, 24), giro(F, 7, .8, 24)], OTTONE, 1.1);
  }
  var GAMBA_NOCE = [[0, "#c9976a"], [.35, "#8a5a35"], [1, "#3e2412"]];
  var MARMO = [[0, "#e6e1d6"], [.16, "#fffdf8"], [.42, "#f5f0e7"], [.72, "#ddd4c4"], [1, "#9f927f"]];   // il marmo bianco caldo
  var LUCIDO_M = { lucido: .3, esp: 10 };   // il marmo lucidato

  // le cifre luminose a sette segmenti (x, y = in alto a sinistra, h = altezza); il punto sta nello spazio fra due cifre
  var SEG = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg" };
  function ledL(testo, h) { var n = testo.replace(/[^0-9 ]/g, "").length; return n * h * .78 - h * .22; }
  function led(testo, x, y, h, c, acceso) {   // acceso = di notte: i segmenti più chiari, con la riga bianca dentro
    var w = h * .56, t = h * .19, gap = h * .22, o = "", px = x, e = t * .2, cl = acceso ? chiaro(c, .14) : c;
    function oriz(x0, yc) { return [[x0 + e, yc], [x0 + e + t / 2, yc - t / 2], [x0 + w - e - t / 2, yc - t / 2], [x0 + w - e, yc], [x0 + w - e - t / 2, yc + t / 2], [x0 + e + t / 2, yc + t / 2]]; }
    function vert(xc, ya, yb) { return [[xc, ya + e], [xc + t / 2, ya + e + t / 2], [xc + t / 2, yb - e - t / 2], [xc, yb - e], [xc - t / 2, yb - e - t / 2], [xc - t / 2, ya + e + t / 2]]; }
    testo.split("").forEach(function (ch) {
      if (ch === "." || ch === ",") { o += rett(px - gap / 2 - t * .55, y + h - t * 1.1, t * 1.1, t * 1.1, t * .3, cl); return; }
      if (ch !== " ") {
        var S = { a: oriz(px, y + t / 2), g: oriz(px, y + h / 2), d: oriz(px, y + h - t / 2), f: vert(px + t / 2, y + t / 2, y + h / 2), b: vert(px + w - t / 2, y + t / 2, y + h / 2), e: vert(px + t / 2, y + h / 2, y + h - t / 2), c: vert(px + w - t / 2, y + h / 2, y + h - t / 2) };
        var on = SEG[ch] || "";
        "abcdefg".split("").forEach(function (sg) {
          var acc = on.indexOf(sg) >= 0, pp = S[sg];
          if (acc) o += poly(pp, cl); else if (h > 3) o += poly(pp, scuro(c, .55), op(.12));
          if (acc && acceso && h > 4) o += tratto(linea(pp[0], pp[3]), "#fff3e6", t * .18, op(.5));
        });
      }
      px += w + gap;
    });
    return o;
  }

  // ---------- i pesci tropicali (disegnati di lato, lunghi 100 da −50 a 50, il muso a destra) ----------
  var PESCE = {}, NE = "#1d1712";
  function pinna(d, fill, w) { return pth(d, fill, "stroke='" + L + "' stroke-width='" + (w || 2.2) + "' stroke-linejoin='round'"); }
  function pelle(d, fill, disegni, luce) {
    var b = luce || [10, -13, 20, 4.5];
    return pth(d, fill) + dentro(d, (disegni || "") + ell(b[0], b[1], b[2], b[3], "#ffffff", op(.4))) + pth(d, "none", "stroke='" + L + "' stroke-width='3' stroke-linejoin='round'");
  }
  function occhio(x, y, r, iride) { return cer(x, y, r, "#ffffff", "stroke='" + L + "' stroke-width='1.3'") + cer(x + r * .16, y + r * .06, r * .64, iride || "#3b2a1a") + cer(x + r * .2, y + r * .06, r * .34, "#000000") + cer(x - r * .04, y - r * .3, r * .26, "#ffffff"); }
  function margine(nome, c, verso) { var v = { su: [0, 1, 0, 0], giu: [0, 0, 0, 1], sx: [1, 0, 0, 0] }[verso]; return lin(nome, [[0, c], [.56, c], [.72, NE], [1, NE]], v[0], v[1], v[2], v[3]); }
  function giu(nome, a, b) { return lin(nome, [[0, a], [1, b]], 0, 0, 0, 1); }
  PESCE.pagliaccio = function () {
    var ar = "#ff7a1a", B = "M50,3 C48,-12 34,-22 13,-23 C-7,-24 -21,-15 -29,-7 L-29,7 C-21,15 -7,21 13,20 C34,19 48,15 50,3 Z";
    var fasce = "M36,-27 C25,-12 25,10 34,25 L21,25 C13,10 13,-12 23,-27 Z M3,-27 C0,-14 12,-4 7,5 C4,12 0,18 3,25 L-8,25 C-11,12 -9,-12 -12,-27 Z M-19,-20 C-23,-8 -23,8 -19,20 L-27,20 C-30,7 -30,-7 -27,-20 Z";
    return pinna("M-27,-5 C-35,-18 -47,-22 -51,-12 C-54,-4 -54,4 -51,12 C-47,22 -35,18 -27,5 Z", margine("pgC", ar, "sx")) +
      pinna("M20,-20 C15,-31 5,-32 0,-24 C-6,-33 -19,-31 -24,-13 Z", margine("pgD", ar, "su")) +
      pinna("M-5,19 C-9,29 -19,28 -23,12 Z", margine("pgA", ar, "giu")) + pinna("M14,18 C12,27 5,29 2,20 Z", margine("pgA", ar, "giu")) +
      pelle(B, giu("pgB", "#ffb066", "#e8590c"), pth(fasce, "#ffffff", "stroke='" + NE + "' stroke-width='2.8'")) +
      pinna("M20,5 C13,0 5,3 4,10 C10,14 17,11 20,5 Z", margine("pgP", ar, "sx"), 1.6) + occhio(37, -5, 5.5, "#c2410c") + tratto("M49,6 Q46,8.5 42.5,7.5", L, 1.4);
  };
  PESCE.chirurgo = function () {
    var B = "M50,1 C47,-17 31,-27 9,-27 C-13,-27 -25,-15 -30,-6 L-30,6 C-25,15 -13,25 9,25 C31,25 47,16 50,1 Z";
    var tav = "M41,-8 C31,-17.5 12,-20.5 -6,-18.5 C-18,-17 -26,-10.5 -31,-3 L-31,2 C-26,-5 -16,-11 -6,-12.2 C8,-13.4 24,-10.5 38,-2.5 Z M10,-12 C8,-4 0,2.6 -10,4 C-19,5 -26,3.6 -31,2 L-31,6 C-24,9 -14,10 -6,8.4 C4,6.4 12,.5 15.5,-10.5 Z";
    return pinna("M-28,-5 L-48,-22 C-43,-8 -43,8 -48,22 L-28,5 Z", lin("chC", [[0, "#ffe066"], [1, "#f59f00"]], 1, 0, 0, 0)) + tratto("M-47,-21 L-30,-6 M-47,21 L-30,6", NE, 2.6) +
      pinna("M33,-24 C12,-35 -14,-33 -28,-10 L-20,-15 C-6,-25 12,-27 33,-24 Z", "#15306e") + pinna("M30,22 C10,31 -12,30 -27,9 L-20,13 C-6,22 10,24 30,22 Z", "#15306e") +
      pelle(B, giu("chB", "#5d9cff", "#1b4fc4"), pth(tav, NE) + ell(8, 17, 26, 6, "#a5d8ff", op(.35))) +
      pinna("M22,6 C14,4 7,8 6,14 C13,16 20,12 22,6 Z", lin("chP", [[0, "#2f6fe0"], [.55, "#2f6fe0"], [1, "#ffd43b"]], 1, 0, 0, 1), 1.6) + occhio(37, -6, 5, "#1a1a1a");
  };
  PESCE.giallo = function () {
    var B = "M52,-1 C44,-6 33,-20 20,-34 C6,-46 -17,-38 -25,-8 L-25,8 C-17,38 6,46 20,34 C33,21 44,8 52,1 Z";
    return pinna("M-23,-6 L-42,-18 C-38,-6 -38,6 -42,18 L-23,6 Z", lin("giC", [[0, "#ffd43b"], [1, "#f59f00"]], 1, 0, 0, 0)) +
      pelle(B, giu("giB", "#fff27a", "#f59f00"), tratto("M33,-17 C15,-32 -8,-30 -18,-10 M33,17 C15,32 -8,30 -18,10", "#e08a00", 1.6, op(.7)) + tratto("M10,-30 L6,-12 M0,-32 L-3,-12 M-9,-28 L-11,-10 M10,30 L6,12 M0,32 L-3,12 M-9,28 L-11,10", "#f5a900", 1, op(.5)), [14, -18, 16, 6]) +
      ell(-19, 0, 3.6, 2, "#ffffff", bordo(L, .8)) + pinna("M20,4 C13,2 8,6 8,11 C13,12 18,9 20,4 Z", "#ffc61a", 1.4) + occhio(30, -7, 5, "#1a1a1a");
  };
  PESCE.imperatore = function () {
    var B = "M47,3 C44,-15 27,-27 5,-28 C-15,-28 -25,-15 -29,-5 L-29,5 C-25,15 -15,28 5,28 C27,28 44,19 47,3 Z", r = "", i;
    for (i = 0; i < 10; i++) { var y0 = -26 + i * 5.6; r += tratto("M20," + f1(y0 + 2) + " C6," + f1(y0 - 2) + " -12," + f1(y0 - 1) + " -32," + f1(y0 + 5), "#ffd43b", 2.4); }
    var faccia = pth("M47,3 C44,-15 30,-25 19,-28 C23,-10 23,12 19,28 C30,26 44,19 47,3 Z", "#cfe9ff") + pth("M38,-20 C31,-8 31,8 35,18 L27,20 C23,8 23,-8 29,-22 Z", "#0d1f52", "stroke='#74c0fc' stroke-width='1.6'") + pth("M21,-28 C17,-10 17,12 21,28 L15,28 C11,10 11,-10 15,-28 Z", "#0d1f52", "stroke='#74c0fc' stroke-width='1.4'");
    return pinna("M-27,-5 C-37,-16 -47,-15 -49,-6 L-49,6 C-47,15 -37,16 -27,5 Z", lin("imC", [[0, "#ffe066"], [1, "#f08c00"]], 1, 0, 0, 0)) +
      pinna("M20,-26 C0,-37 -20,-33 -33,-16 L-24,-13 Z", "#1c4fc0") + pinna("M15,26 C0,37 -20,33 -32,15 L-24,12 Z", "#14306e") + tratto("M10,30 C-4,33 -16,29 -26,18", "#74c0fc", 1.2) +
      pelle(B, giu("imB", "#3d7cf0", "#16389c"), r + faccia) + occhio(32, -5, 4.6, "#1a1a1a");
  };
  PESCE.gramma = function () {
    var B = "M50,1 C42,-13 16,-17 -8,-16 C-22,-15 -28,-7 -30,0 C-28,7 -22,15 -8,16 C16,17 42,13 50,1 Z";
    return pinna("M-28,-3 L-46,-14 C-42,-4 -42,4 -46,14 L-28,3 Z", "#ffc61a") + pinna("M30,-13 C15,-22 -10,-22 -24,-11 Z", lin("grD", [[0, "#ffc61a"], [.45, "#ffc61a"], [.55, "#b33bd0"], [1, "#b33bd0"]], 0, 0, 1, 0)) + cer(22, -15.5, 2.6, NE) +
      pelle(B, lin("grB", [[0, "#ffd43b"], [.44, "#fcc419"], [.52, "#c13ad6"], [1, "#9c2fb8"]], 0, 0, 1, 0), tratto("M47,-3 L31,-8", "#3b0d4a", 1.6), [14, -9, 18, 3.4]) + occhio(38, -3, 4, "#1a1a1a");
  };
  PESCE.castagnola = function () {
    return pinna("M-28,-3 L-50,-21 L-41,0 L-50,21 L-28,3 Z", "#3bc9db") + pelle("M50,1 C42,-15 15,-19 -8,-17 C-22,-14 -28,-6 -30,0 C-28,6 -22,14 -8,17 C15,19 42,15 50,1 Z", giu("caB", "#c5f6fa", "#1098ad"), "", [12, -8, 18, 3.6]) + occhio(37, -3, 4.6, "#1a1a1a");
  };
  function bolle(x, y0, y1, seme, n, k) {   // le bollicine che salgono (più grandi in alto), un po' storte
    var r = rnd(seme), s = "", i;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1), y = y0 + (y1 - y0) * t, rr = (.7 + t * 1.3) * (k || 1) * (.8 + r() * .4), xx = x + Math.sin(i * 1.7 + seme) * (.8 + t * 2.2);
      s += cer(xx, y, rr, "#ffffff", op(.14)) + cer(xx, y, rr, "none", "stroke='#ffffff' stroke-width='" + f1(Math.max(.35, rr * .28)) + "' opacity='.85'") + cer(xx - rr * .35, y - rr * .35, rr * .3, "#ffffff", op(.95));
    }
    return s;
  }

  // ---------- i pezzi che si mettono in fila senza giunte (la fioriera) ----------
  // un pezzo dritto lungo l'asse "a", da t0 a t1, con la sezione prof = [[b, z], ...]: le facce piene, ognuna col suo colore (uguale per tutta
  // la lunghezza), il tappo in fondo (quando sono in fila lo copre il pezzo vicino) e le righe del contorno solo lungo il pezzo: niente righe
  // sui tagli, così due pezzi in fila sembrano uno solo. o = { mat, lw, col(i, normale): il colore di una faccia, tappoCol }
  function listone(prof, t0, t1, c, o) {
    o = o || {};
    var n = prof.length, i, s = "", m = o.mat, lw = o.lw || 1.8;
    var tv = G > 0 ? t1 : t0, tn = G > 0 ? t0 - .004 : t1 + .004;   // il taglio vicino e quello lontano (un filo più lungo: copre la giunta col pezzo di prima)
    function p3(pt, t) { return P(t, pt[0], pt[1]); }
    var area = 0; for (i = 0; i < n; i++) { var u1 = prof[i], u2 = prof[(i + 1) % n]; area += (u1[0] * u2[1] - u2[0] * u1[1]) / 61; }
    var sg = area > 0 ? 1 : -1, en = [], vis = [];
    for (i = 0; i < n; i++) {
      var e1 = prof[i], e2 = prof[(i + 1) % n], db = e2[0] - e1[0], dz = (e2[1] - e1[1]) / 61, l = Math.sqrt(db * db + dz * dz) || 1;
      en.push([0, G * sg * dz / l, -sg * db / l]); vis.push(dot(en[i], VISTA) > .001);
    }
    for (i = 0; i < n; i++) if (vis[i]) {   // le facce lunghe
      var A = prof[i], B = prof[(i + 1) % n], cc = o.col ? o.col(i, en[i]) : tinta(c, en[i], m);
      s += poly([p3(A, tn), p3(A, tv), p3(B, tv), p3(B, tn)], cc, "stroke='" + cc + "' stroke-width='.5' stroke-linejoin='round'");
    }
    var cap = prof.map(function (x) { return p3(x, tv); });
    s += poly(cap, o.tappoCol || tinta(c, [1, 0, 0], m));   // il tappo in fondo
    for (i = 0; i < n; i++) {
      var pr = (i + n - 1) % n;
      if (vis[pr] !== vis[i]) s += rigaB(linea(p3(prof[i], tn), p3(prof[i], tv)), L, lw);   // il contorno, lungo il pezzo
      else if (vis[i] && dot(en[pr], en[i]) < .9) s += rigaB(linea(p3(prof[i], tn), p3(prof[i], tv)), L, .6, op(.4));   // lo spigolo tra due facce
      if (!vis[i]) s += tratto(linea(cap[i], cap[(i + 1) % n]), L, lw);   // il bordo del tappo che dà sul vuoto
    }
    return s;
  }
  function ombraFila(b0, b1, k) {   // l'ombra a terra di un pezzo in fila: una striscia lungo tutto il pezzo, sfumata solo di traverso
    var v0 = G * b0, v1 = G * b1, lo = Math.min(v0, v1) + .04, hi = Math.max(v0, v1) + .04;
    return aTerra("<rect x='-.504' y='" + f2(lo) + "' width='1.008' height='" + f2(hi - lo) + "' fill='" + lin("ofl", [[0, "#000", 0], [.25, "#000", .2], [.6, "#000", .24], [1, "#000", 0]], 0, 0, 0, 1) + "' " + op(k || 1) + "/>");
  }


  // ---------- le forme tonde: la metà davanti di un giro, il cuscino gonfio, lo schienale a guscio ----------
  function giroDav(F, z, k, n) {   // la metà di un giro che guarda verso chi guarda (per i cordoncini e i bordi)
    var out = [], i, t0 = G > 0 ? -Math.PI / 4 : Math.PI * .75; n = n || 30;
    for (i = 0; i <= n; i++) {
      var t = t0 + Math.PI * i / n, c = Math.cos(t), s2 = Math.sin(t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / F.e), y = (s2 < 0 ? -1 : 1) * Math.pow(Math.abs(s2), 2 / F.e);
      out.push(P(F.ca + x * F.ra * k, F.cb + y * (y > 0 ? F.rf : F.rr) * k, z));
    }
    return out;
  }
  function cuscino(F, z0, z1, c, gonfio, lw) {   // un cuscino tondo e gonfio: il fianco sfumato, il sopra lucido e il cordoncino
    var g = gonfio == null ? 1.2 : gonfio, lv = [giro(F, z0, .96, 48), giro(F, (z0 + z1) / 2, 1.01, 48), giro(F, z1 - 1, 1, 48), giro(F, z1 + g * .6, .9, 48), giro(F, z1 + g, .62, 40)];
    var o = corpo(lv, [[0, chiaro(c, .3)], [.4, c], [1, scuro(c, .5)]], lw || 1.6);
    var top = giro(F, z1 + g * .75, .86, 48);
    o += pth(chiuso(top), nuovaR([[0, chiaro(c, .4)], [.55, chiaro(c, .08)], [1, scuro(c, .1)]], .38, .32, .85));
    return o + cordone(aperto(giroDav(F, z1 - .4, 1.005, 30)), c, 1.1);
  }
  // lo schienale a guscio (come una botte tagliata): un arco in pianta attorno a (ca, cb), raggi R0 (dentro) e R1 (fuori), da f0 a f1;
  // zSu(f) = l'altezza del bordo. Le facce di dentro vanno disegnate prima della seduta, quelle di fuori dopo (dalla più lontana alla più vicina)
  function guscio(o) {
    var n = o.n || 32, k, dL = [], fL = [], R0 = o.R0, R1 = o.R1, lw = o.lw || 1.6, sil = "", basso = "";
    function pt(f, R, z) { return P(o.ca + Math.cos(f) * R, o.cb + Math.sin(f) * R, z); }
    function fa(k2) { return o.f0 + (o.f1 - o.f0) * k2 / n; }
    var visF = [];
    for (k = 0; k < n; k++) {
      var a0 = fa(k), a1 = fa(k + 1), fm = (a0 + a1) / 2, nr = [Math.cos(fm), Math.sin(fm), 0], nf = mondo(nr), nd = mondo([-nr[0], -nr[1], 0]);
      var dep = vicino(o.ca + nr[0] * (R0 + R1) / 2, o.cb + nr[1] * (R0 + R1) / 2);
      visF.push(dot(nf, VISTA) > 0);
      if (dot(nf, VISTA) > 0) { var cf = o.colFuori ? o.colFuori(nf, k, fm) : tinta(o.col, nf, o.mat); fL.push([dep, poly([pt(a0, R1, o.z0), pt(a1, R1, o.z0), pt(a1, R1, o.zSu(a1)), pt(a0, R1, o.zSu(a0))], cf, "stroke='" + cf + "' stroke-width='.6' stroke-linejoin='round'")]); basso += tratto(linea(pt(a0, R1, o.z0), pt(a1, R1, o.z0)), L, lw); }
      else { var cd = o.colDentro ? o.colDentro(nd, k, fm) : tinta(o.col, nd, o.mat); dL.push([dep, poly([pt(a0, R0, o.z0), pt(a1, R0, o.z0), pt(a1, R0, o.zSu(a1)), pt(a0, R0, o.zSu(a0))], cd, "stroke='" + cd + "' stroke-width='.6' stroke-linejoin='round'")]); }
    }
    for (k = 1; k < n; k++) if (visF[k] !== visF[k - 1]) { var fk = fa(k); sil += tratto(linea(pt(fk, R1, o.z0), pt(fk, R1, o.zSu(fk))), L, lw); }   // dove il guscio gira: il contorno
    // i due tagli in fondo all'arco (se si vedono)
    var tappi = "";
    [[o.f0, -1], [o.f1, 1]].forEach(function (e) {
      var f = e[0], tg = [-Math.sin(f) * e[1], Math.cos(f) * e[1], 0];
      if (dot(mondo(tg), VISTA) <= 0) return;
      var pp = [pt(f, R0, o.z0), pt(f, R1, o.z0), pt(f, R1, o.zSu(f)), pt(f, R0, o.zSu(f))], c2 = o.colTappo || tinta(o.col, mondo(tg), o.mat);
      tappi += poly(pp, c2, bordo(L, lw * .8));
    });
    // il bordo di sopra, imbottito
    var su = [], giuL = [], k3;
    for (k3 = 0; k3 <= n; k3++) { var f3 = fa(k3); su.push(pt(f3, R1, o.zSu(f3))); giuL.push(pt(f3, R0, o.zSu(f3))); }
    var dTop = chiuso(su.concat(giuL.slice().reverse())), mezzo = [];
    for (k3 = 0; k3 <= n; k3++) { var f4 = fa(k3); mezzo.push(pt(f4, (R0 * .6 + R1 * .4), o.zSu(f4) + 1.2)); }
    var cima = pth(dTop, o.colCima || tinta(o.col, [0, 0, 1], o.mat), bordo(L, lw)) + tratto(liscio(mezzo), "#ffffff", 1.1, op(o.lucCima || .3));
    return { dentro: ordina(dL), fuori: ordina(fL) + basso + sil, tappi: tappi, cima: cima, pt: pt, visF: visF, fa: fa };
  }

  // =========================================================
  //  BALAUSTRA DI MARMO: lo zoccolo, le colonnine tornite a vaso, il corrimano sagomato e lucido, i due pilastrini ai lati
  //  col capitello e il filo d'oro. I pilastrini stanno a cavallo del bordo: in fila, due balaustre vicine hanno lo stesso
  //  pilastrino (disegnato uguale) e sembrano una balaustra sola; da sola è già finita, coi suoi due pilastrini
  // =========================================================
  var BIANCO = "#efe8dc";   // il marmo bianco dei pezzi squadrati
  def("balaustra", { nome: "Balaustra di marmo", fp: [1, 1], box: [-42, -80, 42, 24] }, function () {
    var s = ombraFila(-.12, .12, 1), i;
    function spec(W, H) { return venato(W, H, 300 + Math.round(W * 7), "#b8ab96", 2, .4) + rett(3, 3.4, W - 6, H - 6.8, .6, "none", "stroke='#a89a84' stroke-width='.7' opacity='.8'") + rett(3.6, 4, W - 7.2, H - 8, .5, "none", "stroke='#ffffff' stroke-width='.45' opacity='.85'"); }
    function filo(W, H) { return rett(0, H * .42, W, 1.1, 0, ORO, "stroke='" + ORO_S + "' stroke-width='.25'") + rett(0, H * .42, W, .35, 0, "#fff6cf", op(.9)); }
    function pilastrino(a) {   // il pilastrino quadrato: la base, il fusto con la specchiatura, il capitello col filo d'oro, il cappello
      return blocco(a - .105, a + .105, -.105, .105, 0, 7.5, BIANCO, null, 1.4) +
        blocco(a - .085, a + .085, -.085, .085, 7.5, 49.5, BIANCO, { davanti: spec, dietro: spec, fianco: spec }, 1.4) +
        blocco(a - .115, a + .115, -.115, .115, 49.5, 58, BIANCO, { davanti: filo, dietro: filo, fianco: filo }, 1.3) +
        blocco(a - .095, a + .095, -.095, .095, 58, 61.5, BIANCO, null, 1.2);
    }
    var lontano = vicino(-.5, 0) < vicino(.5, 0) ? -.5 : .5;
    s += pilastrino(lontano);
    // lo zoccolo con la cornicetta
    s += blocco(-.395, .395, -.08, .08, 0, 6.5, BIANCO, null, 1.4) + blocco(-.395, .395, -.068, .068, 6.5, 8.6, BIANCO, null, 1.1);
    // le colonnine a vaso (dalla più lontana)
    var prof = [[8.6, .062], [10, .062], [10.8, .05], [12, .046], [13.4, .052], [16.5, .066], [20.5, .074], [24.5, .07], [28.5, .056], [32.5, .042], [36.5, .033], [39.8, .03], [41.6, .036], [43, .046], [44.4, .046], [45.2, .037], [47.6, .037], [48.4, .052], [49.6, .052]];
    [-.2, 0, .2].sort(function (x, y) { return vicino(x, 0) - vicino(y, 0); }).forEach(function (a) { s += tornito(a, 0, prof, MARMO, 1.1, [2, 13, 16], .75); });
    // il corrimano: la sagoma tonda sopra, lucido
    var cr = [[-.062, 49.4], [.062, 49.4], [.066, 50.8], [.094, 52], [.099, 53.8], [.088, 56], [.055, 57.4], [0, 57.9], [-.055, 57.4], [-.088, 56], [-.099, 53.8], [-.094, 52], [-.066, 50.8]];
    s += estruso("a", cr, -.385, .385, BIANCO, { mat: LUCIDO_M, lw: 1.5, fascia: function (H) { return H.luccica(.55, .02, .98); } });
    s += pilastrino(-lontano);
    return s;
  });

  // =========================================================
  //  FIORIERA DI MARMO: la vasca lunga col suo zoccolo, la specchiatura col festone d'oro, la cornice sagomata;
  //  dentro la siepe di bosso tagliata dritta e, davanti, la fila di fiori rossi, bianchi e rosa.
  //  Si mette in fila: le facce vanno da un bordo all'altro senza righe sui tagli, le foglie e i fiori sconfinano un po'
  //  (in fila si mescolano con quelli del vicino); da sola il taglio in fondo è finito come un blocco di siepe potata
  // =========================================================
  def("fioriera", { nome: "Fioriera di marmo", fp: [1, 1], box: [-46, -80, 46, 26] }, function () {
    var s = ombraFila(-.32, .32, 1), r = rnd(1912), i, mm = { lucido: .22, esp: 10 };
    s += listone([[-.29, 0], [.29, 0], [.29, 4], [-.29, 4]], -.5, .5, BIANCO, { mat: mm, lw: 1.6 });   // lo zoccolo
    s += listone([[-.262, 4], [.262, 4], [.262, 27.5], [-.262, 27.5]], -.5, .5, BIANCO, { mat: mm, lw: 1.6 });   // la vasca
    // la specchiatura col festone d'oro (sulla faccia lunga che si vede): è in mezzo al pezzo, in fila si ripete giusta
    s += pianoV("a", .262 * G, -.5, .5, 4, 27.5, (function () {
      var o = "", W = 61, x0 = 5.5, x1 = 55.5, y0 = 3.2, y1 = 20.3;
      o += rett(x0, y0, x1 - x0, y1 - y0, .4, nuova([[0, "#e4dccd"], [1, "#f3eee4"]], 0, 0, 0, 1)) + venato(x1 - x0, y1 - y0, 77, "#b4a690", 3, .5).replace("<g clip", "<g transform='translate(" + x0 + " " + y0 + ")'><g clip").replace(/<\/g>$/, "</g></g>");
      o += tratto("M" + q(x0, y1) + " L" + q(x0, y0) + " L" + q(x1, y0), "#9d8f78", 1, op(.8)) + tratto("M" + q(x1, y0) + " L" + q(x1, y1) + " L" + q(x0, y1), "#ffffff", 1, op(.9));   // l'incavo: in ombra sopra e a sinistra
      var fe = "M" + q(13, 7.2) + " Q" + q(30.5, 19) + " " + q(48, 7.2);   // il festone di alloro
      o += tratto(fe, "#6e4a10", 3.2, op(.85)) + tratto(fe, ORO, 2.2);
      for (i = 0; i <= 12; i++) { var t = i / 12, px = (1 - t) * (1 - t) * 13 + 2 * (1 - t) * t * 30.5 + t * t * 48, py = (1 - t) * (1 - t) * 7.2 + 2 * (1 - t) * t * 19 + t * t * 7.2; o += ell(px - .6, py - .5, 1.3, .7, i % 2 ? ORO_C : "#d9a83a", "stroke='#7a5614' stroke-width='.25' transform='rotate(" + f1(-30 + t * 60) + " " + f2(px) + " " + f2(py) + ")'"); }
      [[13, 7.2], [48, 7.2]].forEach(function (v) { o += tratto("M" + q(v[0], v[1] + 1) + " q-1,3 .6,5.4 M" + q(v[0], v[1] + 1) + " q1.2,2.6 .2,5", "#b8861f", .7) + cer(v[0], v[1], 1.9, nuovaR(DORATO, .35, .3, .8), bordo("#6e4a10", .4)) + cer(v[0], v[1], .6, "#7a5614"); });   // le rosette coi nastrini
      o += cer(30.5, 11.6, 2.2, nuovaR(DORATO, .35, .3, .8), bordo("#6e4a10", .45)) + cer(30.1, 11.1, .7, "#fff6cf");   // il bottone in mezzo
      return o + rett(0, 0, W, .9, 0, "#ffffff", op(.5));
    })());
    // la cornice sagomata, poi la terra
    s += listone([[-.29, 27.5], [.29, 27.5], [.3, 29], [.306, 31], [.296, 32.6], [.27, 33.4], [-.27, 33.4], [-.296, 32.6], [-.306, 31], [-.3, 29]], -.5, .5, BIANCO, { mat: mm, lw: 1.6 });
    var tz = 33.5;
    s += suZ(tz, rett(-30.8, -15.4, 61.6, 30.8, 0, "#4a3020") + rett(-30.8, -15.4, 61.6, 2, 0, "#2e1c10", op(.6)));
    // la siepe di bosso: la base scura, poi tante foglioline (più chiare sopra, dove batte la luce)
    var SB = .158, ZH = 61;
    s += listone(sezione(-SB, SB, tz, ZH - 1.4, .055, 1.4, .02), -.5, .5, "#2f6b25", { lw: 1.5, col: function (k, nrm) { return tinta("#2f6b25", nrm, { forza: 1.4 }); } });
    var fog = [];
    function foglia(a, b, z, cols, k) { var c = P(a, b, z), cc = cols[Math.floor(r() * cols.length)], rot = Math.round(r() * 180), rx = (1.3 + r() * .9) * (k || 1); return "<ellipse cx='" + f2(c[0]) + "' cy='" + f2(c[1]) + "' rx='" + f2(rx) + "' ry='" + f2(rx * .62) + "' fill='" + cc + "' transform='rotate(" + rot + " " + f2(c[0]) + " " + f2(c[1]) + ")'/>"; }
    var DAV = ["#3f8530", "#4f9a38", "#2f6e25", "#5fae42", "#245a1c", "#6dbb4c"], SOPRA = ["#7cc457", "#8fd166", "#69b549", "#a2dc78", "#5aa23f"], FIANCO = ["#2c6522", "#3a7a2c", "#24561c", "#478c34"];
    for (i = 0; i < 95; i++) fog.push(foglia(-.54 + r() * 1.08, (r() - .5) * 2 * (SB - .01), ZH + .2, SOPRA, .95));
    for (i = 0; i < 50; i++) fog.push(foglia(-.54 + r() * 1.08, SB * G - G * r() * .03, ZH - 1.2 - r() * 2.5, SOPRA.concat(DAV.slice(3)), 1));   // il bordo tondo davanti
    for (i = 0; i < 170; i++) fog.push(foglia(-.54 + r() * 1.08, (SB + .004) * G, tz + 1 + r() * (ZH - tz - 4), DAV, 1));
    for (i = 0; i < 42; i++) fog.push(foglia(.5 * G + .004 * G, (r() - .5) * 2 * SB, tz + 1 + r() * (ZH - tz - 2.5), FIANCO, .95));   // il taglio in fondo
    s += fog.join("");
    for (i = 0; i < 26; i++) { var lp = P(-.52 + r() * 1.04, (SB + .006) * G, tz + 3 + r() * (ZH - tz - 6)); s += cer(lp[0] - .3, lp[1] - .3, .35, "#d8f5b8", op(.7)); }   // i riflessi sulle foglie
    // la fila di fiori davanti alla siepe
    var FIORI = [["#d6203a", "#8f0d1f", "#ffb3bd"], ["#fff8f0", "#cdbfb0", "#ffe9a8"], ["#ff7aa8", "#c2255c", "#ffd1e1"]], fl = [];
    for (i = 0; i < 15; i++) {
      var fa = -.53 + (i + r() * .6) / 14.2 * 1.06, fb = (SB + .045 + r() * .04) * G, fz = tz + 4.5 + r() * 3.2, tipo = FIORI[i % 3];
      fl.push([vicino(fa, fb), (function (fa, fb, fz, tipo) {
        var c = P(fa, fb, fz), o = "", k2;
        for (k2 = 0; k2 < 3; k2++) { var an = r() * 6.28, lx = c[0] + Math.cos(an) * 2.6, ly = c[1] + 2 + Math.sin(an) * 1; o += ell(lx, ly, 2.3, 1.2, k2 % 2 ? "#3f8530" : "#2f6e25", "stroke='#1d4515' stroke-width='.3' transform='rotate(" + Math.round(an * 30) + " " + f2(lx) + " " + f2(ly) + ")'"); }
        o += tratto(linea([c[0], c[1] + 3.4], [c[0] + .3, c[1]]), "#2f6e25", .7);
        for (k2 = 0; k2 < 5; k2++) { var a2 = k2 / 5 * 6.2832 - 1.57, px = c[0] + Math.cos(a2) * 1.25, py = c[1] + Math.sin(a2) * 1; o += cer(px, py, 1.25, tipo[0], "stroke='" + tipo[1] + "' stroke-width='.3'"); }
        return o + cer(c[0], c[1], .95, tipo[2]) + cer(c[0], c[1], .45, tipo[1], op(.7)) + cer(c[0] - .5, c[1] - .7, .4, "#ffffff", op(.7));
      })(fa, fb, fz, tipo)]);
    }
    s += ordina(fl);
    return s;
  });

  // =========================================================
  //  TAVOLO DEL RISTORANTE: rotondo, con la tovaglia bianca lunga fino a terra (le pieghe morbide, l'orlo che ondeggia,
  //  la balza ricamata d'oro); sopra due coperti (il sottopiatto d'oro, il piatto col filo d'oro, il tovagliolo bordeaux
  //  a ventaglio, le posate d'argento, il bicchiere del vino rosso e quello dell'acqua) e in mezzo il candeliere d'argento
  //  con la candela e la coroncina di rose rosse. I due coperti sono uno di fronte all'altro: girato è uguale.
  //  Di notte la candela accesa scalda la tovaglia
  // =========================================================
  var ARGENTO = [[0, "#ffffff"], [.3, "#e9eef2"], [.62, "#aab4bd"], [1, "#5d6770"]];
  def("tavolo_ristorante", { nome: "Tavolo del ristorante", fp: [1, 1], box: [-36, -84, 38, 22], piano: 46, luce: [0, 0, 74, 62, "#ffc46b"] }, function () {
    var s = ombraPianta(-.44, .44, -.44, .44, 1.05, .08), r = rnd(1956), i, ZT = 46, R0 = .4, R1 = .445;
    var top = anello(0, 0, ZT, R0), bot = anello(0, 0, 0, R1);
    function bordoT(th, z, R, wv) { var e = anello(0, 0, z, R); return [e.x + Math.cos(th) * e.rx, e.y + Math.sin(th) * e.ry + (wv || 0)]; }
    // la tovaglia: il fianco (da sinistra a destra lungo la metà davanti), con l'orlo che ondeggia
    var NP = 16, orlo = [], k;
    for (k = 0; k <= 64; k++) { var th = Math.PI - Math.PI * k / 64, w = Math.sin(k / 64 * NP * Math.PI); orlo.push(bordoT(th, -w * .9, R1 + w * .006)); }
    var arcoTop = []; for (k = 0; k <= 32; k++) arcoTop.push(bordoT(Math.PI * k / 32, ZT, R0));
    var dF = "M" + q(top.x - top.rx, top.y) + " L" + orlo.map(function (x) { return q(x); }).join(" L") + " L" + q(top.x + top.rx, top.y) + " L" + arcoTop.map(function (x) { return q(x); }).join(" L") + " Z";
    var pieghe = "";
    for (k = 0; k < NP; k++) {   // le pieghe: dove la stoffa rientra l'ombra, dove esce la luce
      var t2 = (k + .5) / NP, th2 = Math.PI - Math.PI * t2, a0 = bordoT(th2, ZT - 3.5, R0 * 1.01), a1 = bordoT(th2, 0, R1), kk = Math.sin(Math.PI * t2);
      pieghe += tratto("M" + q(a0) + " Q" + q((a0[0] + a1[0]) / 2 + .4, (a0[1] + a1[1]) / 2) + " " + q(a1[0], a1[1] + .8), "#6e6352", 2.4, op(.13 + .1 * kk)) + tratto("M" + q(a0[0] - 1.6, a0[1] + 3) + " Q" + q((a0[0] + a1[0]) / 2 - 1.5, (a0[1] + a1[1]) / 2) + " " + q(a1[0] - 2, a1[1] - .4), "#ffffff", 1.4, op(.35 + .3 * (1 - t2)));
    }
    var balza = []; for (k = 0; k <= 64; k++) { var th3 = Math.PI - Math.PI * k / 64, w3 = Math.sin(k / 64 * NP * Math.PI); balza.push(bordoT(th3, 6.2 - w3 * .9, R1 * .997 + w3 * .006)); }
    pieghe += tratto(aperto(balza), "#7a5614", 2.6, op(.8)) + tratto(aperto(balza), ORO, 1.6) + tratto(aperto(sposta(balza, 0, -.5)), "#fff3c4", .5, op(.85));   // la balza ricamata d'oro
    pieghe += tratto(aperto(sposta(balza, 0, -2.6)), "#c99a36", .5, "stroke-dasharray='.8 1.2' opacity='.8'");
    if (NOTTE) pieghe += ell(top.x - 4, top.y + 6, top.rx * .9, 18, nuovaR([[0, "#ffd08a", .28], [1, "#ffd08a", 0]], .5, .3, .6));   // la luce della candela sul davanti
    s += pth(dF, lin("tv", [[0, "#ffffff"], [.3, "#f8f5ef"], [.62, "#e3dcd0"], [.88, "#c4b9a8"], [1, "#a99c88"]], top.x - top.rx, 0, top.x + top.rx, 0, true)) + dentro(dF, pieghe) + pth(dF, "none", bordo(L, 1.8));
    // il piano: la stoffa bianca col disegno damascato appena visibile e il bordo che gira
    var dT = dEll(top.x, top.y, top.rx, top.ry), dam = "";
    for (k = 0; k < 8; k++) { var an = k / 8 * 6.2832, dc = P(Math.cos(an) * .27, Math.sin(an) * .27, ZT); dam += ell(dc[0], dc[1], 3.2, 1.4, "none", "stroke='#d9d0c2' stroke-width='.45' opacity='.6'"); }
    dam += ell(top.x, top.y, top.rx * .78, top.ry * .78, "none", "stroke='#ddd4c6' stroke-width='.5' opacity='.6'");
    if (NOTTE) dam += ell(top.x, top.y, top.rx * .9, top.ry * .9, nuovaR([[0, "#ffe2a8", .55], [.6, "#ffd08a", .2], [1, "#ffd08a", 0]], .5, .5, .5));
    s += pth(dT, nuovaR([[0, "#ffffff"], [.7, "#f7f3ec"], [1, "#e2dace"]], .42, .38, .62)) + dentro(dT, dam) + tratto(arcoDav(anello(0, 0, ZT - .4, R0 * .985)), "#ffffff", 1.4, op(.9)) + pth(dT, "none", bordo(L, 1.2));
    // i coperti (piatti e posate stesi), poi le cose in piedi dalla più lontana
    var su = function (a, b, dz) { return P(a, b, ZT + (dz || 0)); };
    [1, -1].forEach(function (sg) {
      var c = su(.21 * sg, 0, .2);
      s += ell(c[0] + .4, c[1] + .5, 8.2, 4.1, "#000", op(.1)) + ell(c[0], c[1], 8, 4, nuova(DORATO, c[0] - 8, 0, c[0] + 8, 0, true), bordo("#7a5614", .5));   // il sottopiatto d'oro
      s += ell(c[0], c[1] - .3, 6.3, 3.15, nuovaR([[0, "#ffffff"], [.7, "#f4f1ec"], [1, "#d6d0c6"]], .45, .4, .65), "stroke='#9a8f80' stroke-width='.4'") + ell(c[0], c[1] - .3, 5.6, 2.8, "none", "stroke='" + ORO + "' stroke-width='.45'") + ell(c[0] + .2, c[1] - .2, 3.6, 1.7, "#e8e3da", op(.8));   // il piatto col filo d'oro
      [[-.135, 0], [.135, 1]].forEach(function (pb) {   // la forchetta e il coltello
        var b = pb[0] * sg, A = su(.13 * sg, b, .3), B = su(.3 * sg, b, .3);
        s += tratto(linea(A, B), "#5d6770", 1.5) + tratto(linea(A, B), "#e9eef2", .8) + (pb[1] ? "" : tratto(linea(A, [A[0] + (B[0] - A[0]) * .25, A[1] + (B[1] - A[1]) * .25]), "#f8fafc", 1.3));
      });
    });
    var cose = [];
    function bicchiere(a, b, vino) {   // il calice: il piede, lo stelo, la coppa a tulipano col vino (o l'acqua) dentro
      var c = su(a, b), x = c[0], y = c[1], o = "", yb = y - 5.4, yt = y - 12.4, R = 2.7;
      o += ell(x, y, 2.1, 1, "#e9f4fb", "stroke='#7d8a94' stroke-width='.35' opacity='.9'") + rett(x - .35, yb, .7, 5.2, .2, "#dfeef7", "stroke='#7d8a94' stroke-width='.25'");
      var dB = "M" + q(x - R, yt) + " C" + q(x - R * 1.05, yt + 3.6) + " " + q(x - 1.4, yb) + " " + q(x, yb) + " C" + q(x + 1.4, yb) + " " + q(x + R * 1.05, yt + 3.6) + " " + q(x + R, yt) + " A" + R + "," + f2(R * .42) + " 0 0,0 " + q(x - R, yt) + " Z";
      var liq = "M" + q(x - R * .93, yt + 3.2) + " C" + q(x - R * .85, yt + 5.3) + " " + q(x - 1.2, yb) + " " + q(x, yb) + " C" + q(x + 1.2, yb) + " " + q(x + R * .85, yt + 5.3) + " " + q(x + R * .93, yt + 3.2) + " Z";
      o += pth(dB, "#eef8ff", op(.45)) + pth(liq, vino ? (NOTTE ? "#c0263f" : "#8f1028") : "#d6f0ff", op(vino ? .95 : .55)) + ell(x, yt + 3.2, R * .93, R * .32, vino ? (NOTTE ? "#e0475e" : "#b51f3a") : "#f2fbff", op(.9));
      o += pth(dB, "none", "stroke='#7d8a94' stroke-width='.4'") + ell(x, yt, R, R * .42, "none", "stroke='#ffffff' stroke-width='.5'") + tratto("M" + q(x - R * .7, yt + 1) + " Q" + q(x - R * .75, yt + 4) + " " + q(x - .6, yb - .6), "#ffffff", .5, op(.9));
      return o;
    }
    function tovagliolo(a, b) {   // il tovagliolo bordeaux piegato a ventaglio, in piedi sul piatto
      var c = su(a, b, .6), x = c[0], y = c[1], d = "M" + q(x - 3, y) + " L" + q(x - 2.2, y - 3.4) + " L" + q(x - 1, y - 5.6) + " L" + q(x, y - 6.6) + " L" + q(x + 1, y - 5.6) + " L" + q(x + 2.2, y - 3.4) + " L" + q(x + 3, y) + " Z";
      return pth(d, lin("tg", [[0, "#b2283f"], [1, "#6e0f20"]], 0, 0, 1, 1), bordo(L, .55)) + tratto("M" + q(x, y) + " L" + q(x, y - 6.4) + " M" + q(x - 1.6, y) + " L" + q(x - 1, y - 5.4) + " M" + q(x + 1.6, y) + " L" + q(x + 1, y - 5.4), "#4f0a16", .4, op(.7)) + tratto("M" + q(x - .5, y - .5) + " L" + q(x - .4, y - 5.6), "#e8798a", .4, op(.8));
    }
    [1, -1].forEach(function (sg) {
      cose.push([vicino(.21 * sg, 0) + .01, tovagliolo(.21 * sg, 0)]);
      cose.push([vicino(.06 * sg, .165 * sg), bicchiere(.06 * sg, .165 * sg, true)]);
      cose.push([vicino(.15 * sg, .2 * sg), bicchiere(.15 * sg, .2 * sg, false)]);
    });
    // il centrotavola: le rose attorno al candeliere, il candeliere d'argento e la candela
    for (k = 0; k < 7; k++) {
      var ar = k / 7 * 6.2832 + .3, ra = Math.cos(ar) * .065, rb = Math.sin(ar) * .065;
      cose.push([vicino(ra, rb), (function (ra, rb) {
        var c = su(ra, rb, 1.6);
        return ell(c[0] - 1.6, c[1] + .8, 1.9, .9, "#2f6e25", bordo("#1d4515", .3)) + ell(c[0] + 1.5, c[1] + .9, 1.8, .85, "#3f8530", bordo("#1d4515", .3)) +
          cer(c[0], c[1], 1.75, nuovaR([[0, "#ff5a6e"], [.6, "#c8102e"], [1, "#7a0618"]], .4, .35, .75), bordo("#5a0612", .35)) + tratto("M" + q(c[0] - .7, c[1] - .2) + " a.7,.6 0 1,1 1.2,.5 a.4,.4 0 1,1 -.6,-.5", "#6e0614", .4, op(.8));
      })(ra, rb)]);
    }
    cose.push([0, (function () {
      var o = tornito(0, 0, [[ZT, .052], [ZT + 1, .052], [ZT + 1.8, .036], [ZT + 3.6, .016], [ZT + 8.4, .012], [ZT + 9.6, .02], [ZT + 10.6, .014], [ZT + 12, .026], [ZT + 13, .03], [ZT + 13.4, .026]], ARGENTO, .8, [2, 7], .5);
      var c = P(0, 0, ZT + 13.2), x = c[0], y = c[1], hC = 13;
      o += rett(x - 1.1, y - hC, 2.2, hC, .5, lin("cn", [[0, "#ffffff"], [.6, "#f6efe0"], [1, "#d9cdb5"]], 0, 0, 1, 0), bordo(L, .45)) + pth("M" + q(x - 1.1, y - hC + 1.4) + " q.6,1.6 .3,3.4 q.5,.4 .8,-.2 l0,-3.2 Z", "#fffdf6", op(.9));   // la candela con la goccia di cera
      var fy = y - hC - .4;
      if (NOTTE) o += cer(x, fy - 2.6, 6.4, rad("ha", [[0, "#fffbe6", .95], [.3, "#ffe39a", .5], [1, "#ffd27a", 0]], .5, .5, .5)) + pth("M" + q(x, fy - 6) + " C" + q(x + 1.8, fy - 3.6) + " " + q(x + 1.5, fy - .6) + " " + q(x, fy) + " C" + q(x - 1.5, fy - .6) + " " + q(x - 1.8, fy - 3.6) + " " + q(x, fy - 6) + " Z", rad("fi", [[0, "#ffffff"], [.5, "#fff2b8"], [1, "#ffa83c"]], .5, .65, .6)) + ell(x, fy - 1.4, .5, .9, "#7ab8ff", op(.6));
      else o += tratto(linea([x, fy + .3], [x, fy - 1.4]), "#2b2420", .6);   // lo stoppino spento
      return o;
    })()]);
    s += ordina(cose);
    return s;
  });

  // =========================================================
  //  SEDIA DEL RISTORANTE: la poltroncina a botte di velluto verde smeraldo (lo schienale tondo che avvolge, alto dietro
  //  e più basso ai lati, coi canali imbottiti), il cuscino gonfio col cordoncino, le gambe di noce affusolate coi puntali
  //  d'ottone. Da dietro il guscio liscio, il filo d'oro sul bordo e la fila di chiodini d'ottone
  // =========================================================
  var SMERALDO = "#17694c";
  def("sedia_ristorante", { nome: "Sedia del ristorante", fp: [1, 1], box: [-30, -76, 32, 16], dietro: true, azione: "siedi", seduta: 30 }, function () {
    var s = ombraPianta(-.3, .3, -.3, .3, 1, .06), c = SMERALDO, i;
    var gambe = [[-.165, .2], [.165, .2], [-.15, -.16], [.15, -.16]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
    gambe.forEach(function (g) { s += gambaTonda([g[0], g[1], 21], [g[0] * 1.14, g[1] * 1.12, 0], 1.9, 1.05, GAMBA_NOCE, OTTONE); });
    var f0 = Math.PI * 186 / 180, f1 = Math.PI * 354 / 180, NC = 6, NS = 42;
    function zSu(f) { var t = (f - f0) / (f1 - f0); return 42 + 19 * Math.pow(Math.sin(Math.PI * t), .9); }
    var G0 = guscio({ ca: 0, cb: .03, R0: .205, R1: .255, f0: f0, f1: f1, z0: 21.5, zSu: zSu, n: NS, col: c, mat: VELLUTO, lw: 1.6,
      colDentro: function (nd, k) { var t = (k % NC + .5) / NC; return tono(tinta(c, nd, VELLUTO), (Math.sin(Math.PI * t) - .62) * .3); },   // i canali gonfi
      colCima: chiaro(c, .16), lucCima: .35 });
    s += G0.dentro;
    for (i = 1; i < NS / NC; i++) {   // le cuciture tra un canale e l'altro (sulla faccia di dentro, se si vede)
      var fk = G0.fa(i * NC), nk = mondo([-Math.cos(fk), -Math.sin(fk), 0]);
      if (dot(nk, VISTA) > .05) s += tratto(linea(G0.pt(fk, .2, 27), G0.pt(fk, .2, zSu(fk) - 2.5)), scuro(c, .55), .8, op(.75)) + tratto(linea(G0.pt(fk + .03, .2, 27), G0.pt(fk + .03, .2, zSu(fk) - 2.5)), chiaro(c, .35), .4, op(.5));
    }
    s += cuscino(forma(0, .04, .205, .225, .17, 3.2), 19.5, 29.2, c, 1.3, 1.5);
    s += G0.fuori;
    // da dietro: il filo d'oro sul bordo e i chiodini in fondo (solo dove il guscio si vede da fuori)
    var ch = [], fo = [], k;
    for (k = 0; k <= NS; k++) { var fk2 = G0.fa(k), vis = dot(mondo([Math.cos(fk2), Math.sin(fk2), 0]), VISTA) > .08; if (vis) { fo.push(G0.pt(fk2, .252, zSu(fk2) - 1.8)); if (k % 2 === 0) ch.push(G0.pt(fk2, .252, 24.6)); } }
    if (fo.length > 1) s += tratto(aperto(fo), "#7a5614", 1.3, op(.8)) + tratto(aperto(fo), ORO, .7);
    s += chiodi(ch, .7);
    s += G0.tappi + G0.cima;
    return s;
  });

  // =========================================================
  //  TAVOLINO DA COCKTAIL (il salotto del bar): il piano tondo di marmo nero venato col bordo d'ottone, lo stelo d'ottone
  //  con gli anelli e il piede a disco; sopra la lampada col paralume plissettato rosso e la frangia d'oro, un Martini
  //  con l'oliva e una coppa di champagne sui sottobicchieri. Di notte la lampada accesa e la luce sul marmo
  // =========================================================
  def("tavolino_lounge", { nome: "Tavolino da cocktail", fp: [1, 1], box: [-26, -76, 30, 16], piano: 42, luce: [0, 0, 62, 72, "#ffc27a"] }, function () {
    var s = ombraPianta(-.24, .24, -.24, .24, .95, .06), r = rnd(1929), ZT = 42, i;
    s += tornito(0, 0, [[0, .175], [1.3, .175], [2.3, .16], [3.5, .105], [4.5, .052], [5.4, .036]], OTTONE, 1.2, [1], .6);   // il piede a disco
    s += tornito(0, 0, [[5, .03], [8, .028], [9, .042], [10.4, .042], [11.2, .026], [35, .022], [36, .036], [37.4, .036], [38.2, .028], [39.6, .056]], OTTONE, 1, [2, 7], .6);   // lo stelo con gli anelli
    // il piano: il bordo d'ottone e il marmo nero con le vene
    s += fascia(ZT - 2.8, ZT, .265, OTTONE);
    var e = anello(0, 0, ZT, .265), dT = dEll(e.x, e.y, e.rx, e.ry), ven = "";
    for (i = 0; i < 4; i++) { var pp = [], j, sx = -18 + r() * 8, sy = -6 + i * 3.5 + r() * 2; for (j = 0; j <= 6; j++) pp.push([e.x + sx + j * 6.5 + (r() - .5) * 2, e.y + sy + j * 1.2 + (r() - .5) * 2.6]); ven += tratto(liscio(pp), i % 2 ? "#d9c8a6" : "#f4f0ea", .4 + r() * .5, op(.35 + r() * .3)); }
    ven += poly([[e.x - 14, e.y - 9], [e.x - 6, e.y - 9], [e.x - 16, e.y + 9], [e.x - 24, e.y + 9]], "#ffffff", op(.09)) + poly([[e.x - 2, e.y - 9], [e.x + 1, e.y - 9], [e.x - 9, e.y + 9], [e.x - 12, e.y + 9]], "#ffffff", op(.07));
    if (NOTTE) ven += ell(e.x, e.y, e.rx * .85, e.ry * .85, nuovaR([[0, "#ffcf8a", .55], [.5, "#ff9a5a", .2], [1, "#ff9a5a", 0]], .5, .5, .5));   // la luce della lampada sul marmo
    s += pth(dT, nuovaR([[0, "#4a4650"], [.55, "#24222a"], [1, "#0f0e13"]], .4, .35, .7)) + dentro(dT, ven) + pth(dT, "none", bordo(L, 1.1)) + tratto(arcoDav(anello(0, 0, ZT - .3, .262)), "#fff6cf", .6, op(.8));
    var cose = [];
    function sottobicchiere(c) { return ell(c[0], c[1], 3.4, 1.7, "#1d1b22", "stroke='" + ORO + "' stroke-width='.45'"); }
    cose.push([vicino(.12, -.11), (function () {   // il Martini con l'oliva
      var c = P(.12, -.11, ZT), x = c[0], y = c[1], o = sottobicchiere(c), yt = y - 12.6, R = 3.5;
      o += ell(x, y - .3, 2, .9, "#e9f4fb", "stroke='#7d8a94' stroke-width='.3'") + rett(x - .3, y - 7.4, .6, 7.2, .2, "#e3f1fa", "stroke='#7d8a94' stroke-width='.22'");
      var dV = "M" + q(x - R, yt) + " L" + q(x, y - 7.2) + " L" + q(x + R, yt) + " A" + R + "," + f2(R * .4) + " 0 0,0 " + q(x - R, yt) + " Z";
      o += pth(dV, "#eef8ff", op(.5)) + pth("M" + q(x - R * .8, yt + 1) + " L" + q(x, y - 7.4) + " L" + q(x + R * .8, yt + 1) + " Z", NOTTE ? "#f4f9d8" : "#e6efc4", op(.85)) + ell(x, yt + 1, R * .8, R * .3, NOTTE ? "#fbffe6" : "#f3f7dc");
      o += tratto(linea([x - 2.6, yt - 1.6], [x + 1, yt + 2.6]), "#8a5a35", .45) + cer(x - .2, yt + 1.4, 1.1, "#6b8e23", bordo("#3a4f12", .3)) + cer(x - .1, yt + 1.4, .38, "#d6402b");   // lo stecchino con l'oliva
      return o + pth(dV, "none", "stroke='#7d8a94' stroke-width='.4'") + ell(x, yt, R, R * .4, "none", "stroke='#ffffff' stroke-width='.5'") + tratto(linea([x - R * .62, yt + 1], [x - .5, y - 7.8]), "#ffffff", .5, op(.85));
    })()]);
    cose.push([vicino(-.12, .11), (function () {   // la coppa di champagne
      var c = P(-.12, .11, ZT), x = c[0], y = c[1], o = sottobicchiere(c), yt = y - 10.4, R = 3.4;
      o += ell(x, y - .3, 2, .9, "#e9f4fb", "stroke='#7d8a94' stroke-width='.3'") + rett(x - .3, y - 6.2, .6, 6, .2, "#e3f1fa", "stroke='#7d8a94' stroke-width='.22'");
      var dC = "M" + q(x - R, yt) + " C" + q(x - R * .95, yt + 3.2) + " " + q(x - 1.6, yt + 4.2) + " " + q(x, yt + 4.2) + " C" + q(x + 1.6, yt + 4.2) + " " + q(x + R * .95, yt + 3.2) + " " + q(x + R, yt) + " A" + R + "," + f2(R * .42) + " 0 0,0 " + q(x - R, yt) + " Z";
      o += pth(dC, lin("ch", NOTTE ? [[0, "#fff6cc"], [1, "#f2c14e"]] : [[0, "#fbe9a6"], [1, "#d9a83a"]], 0, 0, 0, 1), "stroke='#7d8a94' stroke-width='.4'") + ell(x, yt + .4, R * .88, R * .34, NOTTE ? "#fff3c4" : "#f7e3a0");
      o += cer(x - 1, yt + 2.4, .3, "#ffffff", op(.9)) + cer(x + .8, yt + 1.8, .25, "#ffffff", op(.9)) + cer(x + .2, yt + 3, .22, "#ffffff", op(.8));   // le bollicine
      return o + ell(x, yt, R, R * .42, "none", "stroke='#ffffff' stroke-width='.5'") + tratto("M" + q(x - R * .75, yt + .8) + " Q" + q(x - R * .7, yt + 2.8) + " " + q(x - 1.2, yt + 3.6), "#ffffff", .5, op(.9));
    })()]);
    cose.push([0, (function () {   // la lampada: il piedino, lo stelo, il paralume plissettato con la frangia d'oro
      var o = tornito(0, 0, [[ZT, .06], [ZT + .9, .06], [ZT + 1.6, .035], [ZT + 2.4, .03], [ZT + 3, .014], [ZT + 13, .011], [ZT + 13.6, .018]], OTTONE, .8, [1], .4);
      var zb = ZT + 12.5, zt = ZT + 23, Rb = .1, Rt = .058, eb = anello(0, 0, zb, Rb), et = anello(0, 0, zt, Rt);
      var dP = "M" + q(et.x - et.rx, et.y) + " L" + q(eb.x - eb.rx, eb.y) + " A" + f2(eb.rx) + "," + f2(eb.ry) + " 0 0,0 " + q(eb.x + eb.rx, eb.y) + " L" + q(et.x + et.rx, et.y) + " A" + f2(et.rx) + "," + f2(et.ry) + " 0 0,1 " + q(et.x - et.rx, et.y) + " Z";
      var pl = "", k;
      for (k = 0; k <= 14; k++) { var th = Math.PI - Math.PI * k / 14, A = [et.x + Math.cos(th) * et.rx, et.y + Math.sin(th) * et.ry], B = [eb.x + Math.cos(th) * eb.rx, eb.y + Math.sin(th) * eb.ry]; pl += tratto(linea(A, B), NOTTE ? "#ffd7a0" : "#5a0a16", .5, op(NOTTE ? .45 : .5)); }
      if (NOTTE) {   // accesa: il paralume che brilla, la luce che esce sotto e sopra
        o += ell(eb.x, eb.y + 1, eb.rx * 1.6, eb.ry * 2.2, nuovaR([[0, "#fff1c8", .7], [1, "#ffcf8a", 0]], .5, .4, .55));
        o += pth(dP, lin("pn", [[0, "#ffb38a"], [.45, "#ff6a5a"], [1, "#d8283e"]], 0, 0, 0, 1)) + dentro(dP, pl + ell(et.x, (et.y + eb.y) / 2, eb.rx * .6, 6, nuovaR([[0, "#fff6d8", .85], [1, "#ffd08a", 0]], .5, .5, .5)));
        o += ell(et.x, et.y, et.rx, et.ry, "#fff3cf");
      } else {
        o += pth(dP, lin("pd", [[0, "#c62a40"], [.5, "#9b1c2e"], [1, "#5e0c18"]], 0, 0, 1, 0)) + dentro(dP, pl);
        o += ell(et.x, et.y, et.rx, et.ry, "#3a0710");
      }
      o += pth(dP, "none", bordo(L, .8)) + tratto(arcoDav(eb), ORO, 1.3) + tratto(arcoDav(et), ORO, .9);
      for (k = 0; k <= 12; k++) { var th2 = Math.PI - Math.PI * k / 12, fx = eb.x + Math.cos(th2) * eb.rx, fy = eb.y + Math.sin(th2) * eb.ry; o += tratto(linea([fx, fy], [fx, fy + 1.6]), ORO, .45); }   // la frangia
      return o + cer(et.x, et.y - 1.2, .9, nuovaR(DORATO, .35, .3, .8), bordo(L, .3));   // il pomolo in cima
    })()]);
    s += ordina(cose);
    return s;
  });

  // =========================================================
  //  POLTRONA CHESTERFIELD (il salotto del bar): pelle bordeaux, lo schienale capitonné a rombi, i braccioli a rotolo
  //  col ventaglio di pieghe e il bottone, il cuscino gonfio col cordoncino, le file di chiodini d'ottone, i piedini torniti.
  //  Da dietro la pelle liscia coi chiodini
  // =========================================================
  def("poltrona_club", { nome: "Poltrona Chesterfield", fp: [1, 1], box: [-50, -80, 54, 30], dietro: true, azione: "siedi", seduta: 28 }, function () {
    var c = "#862e3e", pz = [], i;
    var s = ombraPianta(-.5, .5, -.47, .43, 1) + ombraSotto(-.42, .42, -.42, .38, .34);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (g) {
      var a = .4 * g[0], b = g[1] < 0 ? -.38 : .335;
      pz.push({ box: [a - .05, a + .05, b - .05, b + .05, 0, 7], s: piedeTornito(a, b, "#3a2516") });
    });
    // il frontale sotto la seduta, coi chiodini
    pz.push({ box: [-.245, .245, -.45, .405, 7, 14], s: estruso("a", sezione(-.45, .405, 7, 14, .022, 0, .018), -.245, .245, c, { mat: PELLE, ao: .3, aoH: 6, fascia: function () {
      if (G < 0) return "";
      var rr = [], a; for (a = -.228; a <= .229; a += .038) rr.push(P(a, .405, 12.2));
      return chiodi(rr, .78);
    } }) });
    // lo schienale: il capitonné a rombi sul davanti, il bordo a rotolo con le pieghe; dietro liscio coi chiodini
    var sch = pulisci([[-.462, 14], [-.235, 14], [-.268, 43]].concat(arcoS(-.366, 44, .1, 6.8, 0, Math.PI, 18), [[-.466, 43.5]]));
    function bDav(z) { return -.235 - .033 * (z - 14) / 29; }
    var schienale = estruso("a", sch, -.245, .245, c, { mat: PELLE, ao: .25, aoH: 10, fascia: function (H) {
      var r = patina(limiti(H.sil), 101, 6) + H.luccica(.45), dav = function (w) { return w[0] > -.37 && w[1] >= 42.9; };
      if (G > 0) {
        r += piano(P(-.245, bDav(43), 43), P(.245, bDav(43), 43), P(-.245, bDav(14), 14), 30, 29, capitonne(30, 29, [4.6, 11.6, 18.6], 3, c) + buio(30, 16, .3).replace("<rect ", "<rect transform='translate(0 13)' "));
        for (i = 0; i <= 3; i++) { var pp = H.sez(-.245 + i * .49 / 3, dav); if (pp.length > 1) r += tratto(aperto(pp), scuro(c, .55), .75, op(.6)) + tratto(aperto(sposta(pp, .3, .5)), chiaro(c, .35), .45, op(.45)); }
      } else {
        r += pianoV("a", -.464, -.245, .245, 14, 43.5, tratto("M15,1 L15,29", scuro(c, .5), .8, op(.7)) + tratto("M15.6,1 L15.6,29", chiaro(c, .3), .45, op(.5)));
        var ch = [], a; for (a = -.228; a <= .229; a += .038) ch.push(P(a, -.464, 42.2), P(a, -.462, 15.6));
        r += chiodi(ch, .78);
      }
      return r;
    } });
    pz.push({ box: [-.245, .245, -.47, -.236, 14, 51], s: schienale });
    // i braccioli: il fianco dritto (capitonné dentro, chiodini sul davanti) e il rotolo sopra col ventaglio di pieghe
    function braccio(lato) {
      var xi = .245 * lato, xe = .45 * lato, x0 = Math.min(xi, xe), x1 = Math.max(xi, xe), rc = .355 * lato, bv = G > 0 ? .395 : -.462;
      var fianco = estruso("b", pulisci([[x0, 7], [x1, 7], [x1, 41], [x0, 41]]), -.462, .395, c, { mat: PELLE, ao: .28, aoH: 8, fascia: function (H) {
        var r = patina(limiti(H.sil), 131 + lato, 6);
        if ((lato < 0) === (G > 0)) r += pianoV("b", xi, -.235, .395, 28, 40, capitonne(38.4, 12, [5.6], 3, c) + buio(38.4, 6, .3).replace("<rect ", "<rect transform='translate(0 6)' "));
        return r;
      } });
      var ch = [], z; for (z = 9; z <= 36.5; z += 2.3) ch.push(P(x0 + .017, bv, z), P(x1 - .017, bv, z));
      var rotolo = estruso("b", pulisci(arcoS(rc, 41.5, .118, 6.2, -Math.PI, Math.PI, 30).slice(0, -1)), -.47, .41, c, { mat: PELLE, fascia: function (H) { return patina(limiti(H.sil), 141 + lato, 5) + H.luccica(.6, .03, .97); }, tappo: function (T) {
        var cx = T.x(rc), cy = T.y(41.5), rx = .118 * 61, ry = 6.2, r = "", k;
        if (G < 0) return T.su(ell(cx - rx * .35, cy - ry * .4, rx * .3, ry * .22, "#fff", op(.15)));
        for (k = 0; k < 12; k++) {
          var an = k / 12 * 6.2832 + .2;
          r += tratto(linea([cx + Math.cos(an) * 1.6, cy + Math.sin(an) * 1.3], [cx + Math.cos(an) * rx * .95, cy + Math.sin(an) * ry * .95]), scuro(c, .55), .7, op(.75)) +
            tratto(linea([cx + Math.cos(an + .13) * 1.8, cy + Math.sin(an + .13) * 1.5], [cx + Math.cos(an + .13) * rx * .9, cy + Math.sin(an + .13) * ry * .9]), chiaro(c, .4), .45, op(.55));
        }
        r += ell(cx - rx * .35, cy - ry * .4, rx * .3, ry * .22, "#fff", op(.18)) + ell(cx, cy + .2, 2.6, 2.2, nuovaR([[0, "#000", .45], [1, "#000", 0]], .5, .5, .5)) + cer(cx, cy, 1.35, nuovaR([[0, chiaro(c, .5)], [.6, c], [1, scuro(c, .5)]], .35, .3, .8), bordo(scuro(c, .65), .35));
        return T.su(r);
      } });
      return fianco + chiodi(ch, .75) + rotolo;
    }
    pz.push({ box: [-.45, -.246, -.47, .41, 7, 48], s: braccio(-1) }, { box: [.246, .45, -.47, .41, 7, 48], s: braccio(1) });
    // il cuscino gonfio, col cordoncino e le piccole grinze della pelle
    var cu = sezione(-.25, .42, 14, 28, .05, 1.1, .03);
    pz.push({ box: [-.244, .244, -.23, .42, 14, 29.5], s: estruso("a", cu, -.244, .244, c, { mat: PELLE, ao: .3, aoH: 9, fascia: function (H) {
      var k = H.vicinoA(.42 - .02, 28 - 1.4), r = cordone(aperto(H.lungo(k, -.224, .224)), c, 1.2) + patina(limiti(H.sil), 151, 8) + H.luccica(.3, .1, .9);
      r = solco(H, -.2, 28, -.244, .244) + r;
      if (G > 0) [[-.17, 1], [.15, -1]].forEach(function (g) {
        var a1 = P(g[0], .425, 25.6), a2 = P(g[0] + .025 * g[1], .425, 22.5), a3 = P(g[0] + .012 * g[1], .425, 19.5);
        r += tratto("M" + q(a1) + " Q" + q(a2) + " " + q(a3), scuro(c, .5), .6, op(.55)) + tratto("M" + q(a1[0] + .5, a1[1] + .2) + " Q" + q(a2[0] + .5, a2[1] + .2) + " " + q(a3[0] + .5, a3[1] + .2), chiaro(c, .35), .4, op(.45));
      });
      return r;
    } }) });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  TORRE DI CHAMPAGNE: la piramide di 30 coppe (4 × 4, 3 × 3, 2 × 2 e una in cima) piene di champagne che trabocca,
  //  sul carrello d'oro col vassoio a specchio, la ringhierina, le ruote; sotto, il secchiello d'argento col ghiaccio
  //  e due bottiglie. Di notte le coppe brillano (la luce sotto il vassoio) e scintillano
  // =========================================================
  def("torre_champagne", { nome: "Torre di champagne", fp: [1, 1], box: [-42, -100, 44, 24], luce: [0, 0, 66, 74, "#ffe39a"] }, function () {
    var s = ombraPianta(-.38, .38, -.38, .38, .9, .06), r = rnd(1959), i, j, ZT = 46, ZS = 10, AG = .31;
    var LIQ = NOTTE ? [[0, "#fffbe0"], [.4, "#ffe066"], [1, "#e0a020"]] : [[0, "#fff1b0"], [.4, "#f5cf4f"], [1, "#b8860b"]];   // lo champagne dorato
    var gambe = [[-AG, -AG], [AG, -AG], [-AG, AG], [AG, AG]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
    function gamba(g) {   // la ruota piroettante e il tubo d'oro
      var p0 = P(g[0], g[1], 0), o = ell(p0[0] + .6, p0[1] + .4, 3, 1.3, "#000", op(.25)) + rett(p0[0] - 1.6, p0[1] - 3.4, 3.2, 3.4, 1.6, "#2b2622", bordo(L, .5)) + rett(p0[0] - .5, p0[1] - 3.2, 1, 3, .5, "#6b6460");
      o += pth("M" + q(p0[0] - 1.9, p0[1] - 2) + " L" + q(p0[0] - 1.2, p0[1] - 5.6) + " L" + q(p0[0] + 1.2, p0[1] - 5.6) + " L" + q(p0[0] + 1.9, p0[1] - 2), "none", "stroke='" + L + "' stroke-width='1.6'") + pth("M" + q(p0[0] - 1.9, p0[1] - 2) + " L" + q(p0[0] - 1.2, p0[1] - 5.6) + " L" + q(p0[0] + 1.2, p0[1] - 5.6) + " L" + q(p0[0] + 1.9, p0[1] - 2), "none", "stroke='" + ORO + "' stroke-width='.8'");
      return o + tuboOro(linea(P(g[0], g[1], 5.6), P(g[0], g[1], ZT - 2)), 1.8) + pallina(P(g[0], g[1], ZS + .8), 1.6, ORO, .5);
    }
    gambe.forEach(function (g) { if (vicino(g[0], g[1]) < -.1) s += gamba(g); });
    // il ripiano di sotto (vetro col bordo d'oro), il secchiello col ghiaccio e le bottiglie
    s += blocco(-AG, AG, -AG, AG, ZS, ZS + 1.4, oroT(), { sopra: function (A, B, C, D) { var m = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2]; return poly([A, B, C, D].map(function (v) { return [m[0] + (v[0] - m[0]) * .9, m[1] + (v[1] - m[1]) * .9]; }), lin("vs", [[0, "#cfe6ee"], [1, "#7e9aa6"]], 0, 0, 1, 1), op(.95)); } }, 1.2);
    var cb = [.02, .1];
    function bottiglia(dx, ang) {   // una bottiglia verde scuro col collo d'oro, un po' inclinata
      var c = P(cb[0], cb[1], ZS + 10), o = "<g transform='rotate(" + ang + " " + f2(c[0]) + " " + f2(c[1]) + ")'>", x = c[0] + dx, y = c[1];
      o += pth("M" + q(x - 2.6, y) + " L" + q(x - 2.6, y - 12) + " C" + q(x - 2.6, y - 15) + " " + q(x - 1, y - 15.5) + " " + q(x - 1, y - 18) + " L" + q(x - 1, y - 23) + " L" + q(x + 1, y - 23) + " L" + q(x + 1, y - 18) + " C" + q(x + 1, y - 15.5) + " " + q(x + 2.6, y - 15) + " " + q(x + 2.6, y - 12) + " L" + q(x + 2.6, y) + " Z", lin("bt", [[0, "#3f6b3a"], [.4, "#1c3d1e"], [1, "#0b1a0c"]], 0, 0, 1, 0), bordo(L, .6));
      o += pth("M" + q(x - 1.15, y - 17) + " L" + q(x - 1.15, y - 23.4) + " L" + q(x + 1.15, y - 23.4) + " L" + q(x + 1.15, y - 17) + " Z", lin("bo", [[0, "#fff3c2"], [.5, "#e2b444"], [1, "#8a5c12"]], 0, 0, 1, 0), bordo(L, .45)) + rett(x - 2.2, y - 11, 4.4, 4, .4, "#f3ead2", bordo(L, .35)) + rett(x - 1.4, y - 9.8, 2.8, .8, 0, ORO) + tratto(linea([x - 1.6, y - 1], [x - 1.6, y - 12]), "#ffffff", .5, op(.45));
      return o + "</g>";
    }
    var sec = "";
    sec += bottiglia(-1.6, -14) + bottiglia(1.8, 12);
    var ss = anello(cb[0], cb[1], ZS + 1.4 + 13, .105);
    sec = sec + tornito(cb[0], cb[1], [[ZS + 1.4, .07], [ZS + 2.4, .075], [ZS + 3.4, .066], [ZS + 12, .1], [ZS + 13.4, .108], [ZS + 14.4, .104]], ARGENTO, 1.1, [2, 4], .7);
    for (i = 0; i < 6; i++) { var gp = P(cb[0] + (r() - .5) * .14, cb[1] + (r() - .2) * .1, ZS + 14.6); sec += rett(gp[0] - 1.1, gp[1] - .9, 2.2, 1.8, .5, "#eef8ff", "stroke='#9fc3d6' stroke-width='.3' opacity='.95'"); }   // il ghiaccio
    [-1, 1].forEach(function (sg) { var hp = P(cb[0] + sg * .105, cb[1], ZS + 9.5); sec += ell(hp[0] + sg * .8, hp[1], 1.4, 1.8, "none", "stroke='" + L + "' stroke-width='1.2'") + ell(hp[0] + sg * .8, hp[1], 1.4, 1.8, "none", "stroke='#dfe6ea' stroke-width='.6'"); });   // i maniglioni
    s += sec + tratto(arcoDav(ss), "#ffffff", .6, op(.8));
    gambe.forEach(function (g) { if (vicino(g[0], g[1]) >= -.1) s += gamba(g); });
    // il vassoio a specchio col bordo d'oro (di notte la luce sotto)
    s += blocco(-.37, .37, -.37, .37, ZT - 2.6, ZT, oroT(), { sopra: function (A, B, C, D) {
      var m = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2], pp = [A, B, C, D].map(function (v) { return [m[0] + (v[0] - m[0]) * .9, m[1] + (v[1] - m[1]) * .9]; });
      return poly(pp, lin("sp", NOTTE ? [[0, "#fff6d8"], [.5, "#f2d68a"], [1, "#b98a3a"]] : [[0, "#f2f4f5"], [.45, "#c5ccd1"], [1, "#7f8a92"]], 0, 0, 1, 1)) + poly([pp[0], [pp[0][0] + 9, pp[0][1] + 4.5], [pp[3][0] + 9, pp[3][1] + 4.5], pp[3]], "#ffffff", op(.25));
    } }, 1.4);
    if (NOTTE) s += ell(0, -ZT - 4, 30, 15, nuovaR([[0, "#fff1c0", .55], [1, "#ffd76a", 0]], .5, .5, .5));   // la luce che sale dal vassoio
    // le coppe: la ringhierina dietro, il primo piano, la ringhierina davanti, gli altri piani
    var HC = 10;
    function coppa(a, b, z0) {
      var c = P(a, b, z0), x = c[0], y = c[1], R = .079 * 70.71, yt = y - HC, o = "";
      o += ell(x, y, 2.5, 1.15, "#f4fbff", "stroke='#8a9aa4' stroke-width='.3' opacity='.9'") + rett(x - .38, y - 5.4, .76, 5.2, .3, NOTTE ? "#fffbe6" : "#e6f2f9", "stroke='#8a9aa4' stroke-width='.2'");
      var dS = "M" + q(x - R, yt) + " C" + q(x - R * .92, yt + 3.3) + " " + q(x - R * .45, yt + 4.3) + " " + q(x, yt + 4.3) + " C" + q(x + R * .45, yt + 4.3) + " " + q(x + R * .92, yt + 3.3) + " " + q(x + R, yt) + " A" + f2(R) + "," + f2(R * .5) + " 0 0,0 " + q(x - R, yt) + " Z";
      o += pth(dS, lin("lq", LIQ, 0, 0, 0, 1), "stroke='" + (NOTTE ? "#c99a36" : "#8a7a5a") + "' stroke-width='.35'");
      o += ell(x, yt + .45, R * .86, R * .38, NOTTE ? "#fff3b0" : "#ffe27a") + ell(x, yt, R, R * .5, "none", "stroke='#ffffff' stroke-width='.55' opacity='.9'");
      o += tratto("M" + q(x - R * .78, yt + .8) + " Q" + q(x - R * .7, yt + 2.8) + " " + q(x - R * .25, yt + 3.7), "#ffffff", .5, op(.85));
      return o + cer(x + R * .3, yt + 1.2, .28, "#ffffff", op(.9)) + cer(x - R * .15, yt + 2.2, .22, "#ffffff", op(.8));
    }
    function ringhiera(davanti) {   // la ringhierina d'oro attorno al vassoio (la metà dietro o quella davanti)
      var K = .345, zr = ZT + 4.2, cc = [[-K, -K], [K, -K], [K, K], [-K, K]], o = "", k;
      for (k = 0; k < 4; k++) {
        var A = cc[k], B = cc[(k + 1) % 4], m = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
        if ((vicino(m[0], m[1]) > 0) !== davanti) continue;
        o += tuboOro(linea(P(A[0], A[1], zr), P(B[0], B[1], zr)), 1.1);
        for (j = 1; j < 4; j++) { var pp = [A[0] + (B[0] - A[0]) * j / 4, A[1] + (B[1] - A[1]) * j / 4]; o += tuboOro(linea(P(pp[0], pp[1], ZT), P(pp[0], pp[1], zr)), .55); }
      }
      cc.forEach(function (v) { if ((vicino(v[0], v[1]) > .01) === davanti) o += tuboOro(linea(P(v[0], v[1], ZT), P(v[0], v[1], zr + 1.2)), .9) + pallina(P(v[0], v[1], zr + 2), 1.3, ORO, .45); });
      return o;
    }
    s += ringhiera(false);
    var piani = [[4, .158], [3, .158], [2, .158], [1, .158]], scintille = [];
    piani.forEach(function (pn, L2) {
      var n = pn[0], z0 = ZT + L2 * (HC - .7), cc2 = [];
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) cc2.push([(i - (n - 1) / 2) * pn[1], (j - (n - 1) / 2) * pn[1]]);
      cc2.sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
      cc2.forEach(function (v) { s += coppa(v[0], v[1], z0); if (r() < .3) scintille.push(P(v[0], v[1], z0 + HC + .3)); });
      if (L2 === 0) s += ringhiera(true);
    });
    // lo champagne che trabocca dalla coppa in cima e scende sulle altre
    var cima = P(0, 0, ZT + 3 * (HC - .7) + HC);
    [[-1, 1], [1, 1], [-1, -1], [1, -1]].forEach(function (d) {
      if (vicino(d[0], d[1]) < -.1) return;
      var A = P(d[0] * .05, d[1] * .05, ZT + 3 * (HC - .7) + HC - .2), B = P(d[0] * .075, d[1] * .075, ZT + 2 * (HC - .7) + HC + .2);
      s += tratto("M" + q(A) + " Q" + q((A[0] + B[0]) / 2 + d[0] * 1.5, A[1] + 1) + " " + q(B), NOTTE ? "#fff1b0" : "#f2cf6e", .8, op(.85));
    });
    if (NOTTE) scintille.concat([cima]).forEach(function (c, k) { var l = k % 2 ? 1.8 : 2.6; s += pth("M" + q(c[0], c[1] - l) + " L" + q(c[0] + .35, c[1] - .35) + " L" + q(c[0] + l, c[1]) + " L" + q(c[0] + .35, c[1] + .35) + " L" + q(c[0], c[1] + l) + " L" + q(c[0] - .35, c[1] + .35) + " L" + q(c[0] - l, c[1]) + " L" + q(c[0] - .35, c[1] - .35) + " Z", "#ffffff", op(.95)); });
    return s;
  });


  // ---------- attrezzi delle luci, delle insegne e degli schermi (come nelle slot) ----------
  function rq(x, y, w, h, r) {   // un rettangolo con gli angoli tondi, come tracciato
    return "M" + f2(x + r) + "," + f2(y) + " H" + f2(x + w - r) + " Q" + f2(x + w) + "," + f2(y) + " " + f2(x + w) + "," + f2(y + r) + " V" + f2(y + h - r) + " Q" + f2(x + w) + "," + f2(y + h) + " " + f2(x + w - r) + "," + f2(y + h) +
      " H" + f2(x + r) + " Q" + f2(x) + "," + f2(y + h) + " " + f2(x) + "," + f2(y + h - r) + " V" + f2(y + r) + " Q" + f2(x) + "," + f2(y) + " " + f2(x + r) + "," + f2(y) + " Z";
  }
  function ombraD(d, dx, dy, k) {   // l'ombra sul muro: la stessa forma spostata in basso a destra, in due velature
    k = k == null ? 1 : k;
    return pth(d, "#000", op(.06 * k) + " " + trasla(dx * 1.7, dy * 1.7)) + pth(d, "#000", op(.13 * k) + " " + trasla(dx, dy));
  }
  function lampadina(x, y, r, c) {   // una lampadina della fila: di giorno spenta (vetro chiaro), di notte accesa con l'alone
    c = c || "#ffd43b";
    var k = c.slice(1);
    if (NOTTE) return cer(x, y, r * 2.7, rad("la" + k, [[0, chiaro(c, .45), .8], [.32, c, .38], [1, c, 0]], .5, .5, .5)) + cer(x, y, r, rad("ln" + k, [[0, "#ffffff"], [.5, chiaro(c, .62)], [1, c]], .4, .4, .7)) + cer(x - r * .3, y - r * .32, r * .3, "#ffffff", op(.95));
    return cer(x + r * .22, y + r * .28, r * 1.1, "#000", op(.22)) + cer(x, y, r, rad("lg" + k, [[0, "#fffdf2"], [.5, chiaro(c, .5)], [1, scuro(c, .25)]], .38, .35, .75), "stroke='" + scuro(c, .6) + "' stroke-width='" + f2(r * .24) + "'") + cer(x - r * .32, y - r * .34, r * .3, "#ffffff", op(.9));
  }
  function lungoRett(x, y, w, h, passo) {   // i punti lungo il bordo di un rettangolo, uno ogni "passo"
    var pp = [], nx = Math.max(1, Math.round(w / passo)), ny = Math.max(1, Math.round(h / passo)), i;
    for (i = 0; i < nx; i++) pp.push([x + w * i / nx, y]);
    for (i = 0; i < ny; i++) pp.push([x + w, y + h * i / ny]);
    for (i = 0; i < nx; i++) pp.push([x + w - w * i / nx, y + h]);
    for (i = 0; i < ny; i++) pp.push([x, y + h - h * i / ny]);
    return pp;
  }
  function stella(cx, cy, R, r) { var pp = [], i; for (i = 0; i < 10; i++) { var t = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pp.push([cx + Math.cos(t) * rr, cy + Math.sin(t) * rr]); } return pp; }   // i punti di una stella a cinque punte
  function tuboArg(d, w) { return tratto(d, L, w + 1.4) + tratto(d, "#aab4bd", w) + tratto(d, "#ffffff", Math.max(.3, w * .4), "opacity='.95' transform='translate(-.3 -.4)'"); }   // un bastoncino cromato
  function nappa(x, y, k) {   // una nappa d'oro: il cordino, il bottone e la frangia a campana
    var o = tratto(linea([x, y], [x, y + 3 * k]), "#7a5614", 1.1 * k), yk = y + 4.6 * k, j;
    o += cer(x, yk, 2.3 * k, nuovaR([[0, "#fff6cf"], [.55, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), bordo(L, .6 * k));
    var dS = "M" + q(x - 1.6 * k, yk + 1.8 * k) + " L" + q(x + 1.6 * k, yk + 1.8 * k) + " L" + q(x + 3.6 * k, yk + 12 * k) + " Q" + q(x, yk + 13.4 * k) + " " + q(x - 3.6 * k, yk + 12 * k) + " Z";
    o += pth(dS, nuova(DORATO, 0, 0, 1, 0), bordo(L, .6 * k));
    for (j = -3; j <= 3; j++) o += tratto(linea([x + j * .45 * k, yk + 3.2 * k], [x + j * 1.05 * k, yk + 12.3 * k]), j % 2 ? "#7a5614" : "#fff3c4", .35 * k, op(.8));
    return o + rett(x - 2 * k, yk + 2.2 * k, 4 * k, 1.2 * k, .4 * k, "#b8861f");
  }
  function pallone(x, y, r, k) {   // il pallone da calcio (bianco coi pentagoni neri), visto di fronte
    var o = cer(x, y, r, nuovaRU([[0, "#ffffff"], [.65, "#eef1f4"], [1, "#aab4bf"]], x - r * .35, y - r * .4, r * 1.45)), pc = [], i, j, fuori = "";
    for (i = 0; i < 5; i++) { var t = -Math.PI / 2 + i * Math.PI * .4; pc.push([x + Math.cos(t) * r * .36, y + Math.sin(t) * r * .36]); }
    for (i = 0; i < 5; i++) {   // i pezzi di pentagono sul bordo, e le cuciture
      var t2 = -Math.PI / 2 + i * Math.PI * .4 + Math.PI * .2, ex = x + Math.cos(t2) * r * 1.02, ey = y + Math.sin(t2) * r * 1.02, pe = [];
      for (j = 0; j < 5; j++) { var t3 = t2 + Math.PI + j * Math.PI * .4; pe.push([ex + Math.cos(t3) * r * .36, ey + Math.sin(t3) * r * .36]); }
      fuori += poly(pe, "#1d1b22") + tratto(linea(pc[i], [x + Math.cos(t2 - Math.PI * .2) * r * .72, y + Math.sin(t2 - Math.PI * .2) * r * .72]), "#5a5f66", r * .06);
    }
    return o + dentro(dEll(x, y, r, r), fuori) + poly(pc, "#1d1b22") + pth(dEll(x, y, r, r), "none", bordo(L, k || .6)) + ell(x - r * .38, y - r * .42, r * .26, r * .16, "#ffffff", op(.8));
  }

  // =========================================================
  //  PALCO DELLO SPETTACOLO (largo 4 mattonelle, profondo 3): la pedana di legno lucido col davanti tondo, il bordo laccato
  //  bordeaux coi fili d'oro e la fila di lampadine; in fondo il sipario di velluto rosso aperto e legato ai lati con le nappe
  //  d'oro, la mantovana coi festoni e la frangia, dietro il fondale blu notte con la raggiera e la stella d'oro; le due colonne
  //  d'oro con le lampadine (come le insegne di Broadway), la trave coi fari colorati e la stella in cima; sul davanti il
  //  microfono d'argento degli anni Cinquanta sull'asta cromata. Di notte i fari accesi: i fasci colorati e le pozze di luce.
  //  Da dietro: il retro del fondale (velluto scuro con la cornice d'oro e la stella), le colonne e la trave viste di spalle
  // =========================================================
  var FARI = ["#ff4fa3", "#4fd8ff", "#ffd23f", "#b06bff", "#5cff8a"], AF = [-1.44, -.72, 0, .72, 1.44];   // i colori dei fari e dove stanno sulla trave
  def("palco_show", { nome: "Palco dello spettacolo", fp: [4, 3], box: [-184, -300, 184, 96], dietro: true, luce: [0, .3, 95, 230, "#ffc0e8"] }, function () {
    var ZP = 24, BF = -1.38, ZT = 176, r = rnd(4404), i, k, s = "";
    s += ombraPianta(-2, 2, -1.5, 1.5, .85, .05);
    // ---- la pedana: il contorno in pianta col davanti tondo (in giro antiorario), il bordo con le lampadine ----
    var ped = [[-1.96, -1.46], [1.96, -1.46], [1.96, .74]];
    for (k = 1; k < 28; k++) { var t = k / 28 * Math.PI; ped.push([1.96 * Math.cos(t), .74 + .7 * Math.sin(t)]); }
    ped.push([-1.96, .74]);
    s += fianco(ped, 0, ZP, "#5c1222", { lucido: .55, esp: 10 }, { lw: 1.8, cima: 1.3,
      righe: [[ZP - 1.7, "#7a5614", 3.2], [ZP - 1.7, ORO, 2], [ZP - 2.1, "#fff3c4", .6, .85], [2.8, "#7a5614", 2.6], [2.8, ORO, 1.5]],
      extra: function (vv) { return lungoCorsa(vv, .2, function (a, b) { if (b < -1.4) return ""; var c = P(a, b, ZP * .5); return lampadina(c[0], c[1], 1.9, "#ffd76a"); }); } });
    // il piano: le assi di legno lucido (dal fondo al davanti), il riflesso del sipario, la stella d'oro e le pozze dei fari
    var dPed = chiuso(ped.map(function (v) { return [v[0] * 61, v[1] * 61]; })), tav = rett(-124, -92, 248, 184, 0, "#b06a35");
    for (k = 0; k < 21; k++) {
      var x0 = -119.56 + k * 11.386, cA = mix("#d39556", "#9c5a2a", r() * .85);
      tav += rett(x0, -92, 11.4, 184, 0, nuova([[0, chiaro(cA, .14)], [.5, cA], [1, scuro(cA, .1)]], 0, 0, 1, 0));
      for (i = 0; i < 3; i++) { var gx = x0 + 1.6 + r() * 8.2, gy = -92 + r() * 30; tav += tratto("M" + q(gx, gy) + " C" + q(gx + 1.3, gy + 45) + " " + q(gx - 1.3, gy + 95) + " " + q(gx + .5, gy + 150), scuro(cA, .32), .3 + r() * .35, op(.4)); }
      var gj = -70 + r() * 135; tav += rett(x0, gj, 11.4, .7, 0, "#4a2410", op(.55));   // la giunta di testa
      tav += rett(x0, -92, .7, 184, 0, "#4a2410", op(.6)) + rett(x0 + .7, -92, .5, 184, 0, "#ffe2b8", op(.3));
    }
    tav += rett(-124, -92, 248, 46, 0, nuova([[0, "#c0203a", .4], [1, "#c0203a", 0]], 0, 0, 0, 1));   // il riflesso rosso del sipario sulle assi lucide
    tav += ell(-14, 34, 100, 34, nuovaRU([[0, "#fff4dc", .32], [1, "#fff4dc", 0]], -14, 34, 100));   // il lucido
    tav += poly(stella(0, 24, 15, 6.2), "#000", op(.25) + " " + trasla(.8, 1)) + poly(stella(0, 24, 15, 6.2), nuova(DORATO, 0, 0, 1, 1), "stroke='#6e4a10' stroke-width='.8'") + poly(stella(0, 24, 8.4, 3.5), "#fff3c4", op(.4));
    FARI.forEach(function (c, j) { var px = AF[j] * .55 * 61, py = .2 * 61; tav += cer(px, py, 20, nuovaRU([[0, chiaro(c, .45), NOTTE ? .75 : .2], [.5, c, NOTTE ? .4 : .1], [1, c, 0]], px, py, 20)); });
    s += suZ(ZP, dentro(dPed, tav));

    // ---- il fondo: il sipario (da davanti) o il retro del fondale (da dietro) ----
    function telo(lato, W, H) {   // un telo del sipario (lato −1 a sinistra, 1 a destra) raccolto con la corda d'oro; x misurata dal bordo di fuori
      function X(x) { return lato < 0 ? x : W - x; }
      var xm = W * .5 + 2, T0 = W * .17, T1 = H * .58, xb = W * .25, o = "", k2;
      function piega(f) { return liscio([[xm * f, -2], [xm * f * .86 + T0 * f * .14, H * .16], [xm * f * .5 + T0 * f * .5 + 5 * f, H * .37], [T0 * f, T1], [T0 * f + (xb - T0) * f * .5, T1 + (H - T1) * .5], [xb * f, H + 2]].map(function (v) { return [X(v[0]), v[1]]; })); }
      var bordoDentro = "M" + q(X(xm), -2) + " C" + q(X(xm - 6), H * .22) + " " + q(X(T0 + 26), T1 - 30) + " " + q(X(T0), T1) + " C" + q(X(T0 + 4), T1 + 16) + " " + q(X(xb + 6), H - 24) + " " + q(X(xb), H + 2);
      var dT = "M" + q(X(-2), -2) + " L" + q(X(xm), -2) + bordoDentro.replace(/^M[^C]*/, " ") + " L" + q(X(-2), H + 2) + " Z";
      var dentroT = rett(-4, -4, W + 8, H + 8, 0, nuova([[0, "#d42a44"], [.4, "#ab1530"], [.75, "#8a0f24"], [1, "#5e0818"]], 0, 0, 0, 1));
      for (k2 = 0; k2 <= 8; k2++) { var dv = piega(k2 / 8); dentroT += tratto(dv, "#3a0410", 5.5, op(.26)) + tratto(dv, "#3a0410", 2, op(.38)); }   // le valli delle pieghe, in ombra
      for (k2 = 0; k2 < 8; k2++) { var dl = piega((k2 + (lato < 0 ? .38 : .62)) / 8); dentroT += tratto(dl, "#ff6b81", 3.2, op(.3)) + tratto(dl, "#ffd0d8", 1, op(.35)); }   // le creste, dove batte la luce
      dentroT += rett(-4, T1 - 10, W + 8, 22, 0, nuova([[0, "#000", 0], [.5, "#000", .18], [1, "#000", 0]], 0, 0, 0, 1));   // dove la corda stringe
      o += dentro(dT, dentroT) + pth(dT, "none", bordo("#3a0410", 1));
      o += tratto(bordoDentro, "#6e4a10", 3.4) + tratto(bordoDentro, ORO, 2) + tratto(bordoDentro, "#fff3c4", .5, "opacity='.85' transform='translate(-.4 -.3)'");   // il gallone d'oro sul bordo
      var dC = "M" + q(X(-2), T1 - 6) + " Q" + q(X(T0 * .5), T1 + 3.5) + " " + q(X(T0 + 2.5), T1);   // la corda che lo tiene
      o += tratto(dC, "#5a3c0c", 4.6) + tratto(dC, ORO, 3.2) + tratto(dC, "#fff3c4", 1.1, "stroke-dasharray='1.4 1.4' opacity='.85'");
      return o + nappa(X(T0 + 3.2), T1 - .6, 1.15);
    }
    function mantovana(W) {   // la mantovana: la fascia di velluto coi festoni, la frangia e le nappe d'oro
      var o = rett(-1, -1, W + 2, 9, 0, nuova([[0, "#c4203c"], [1, "#7e0c20"]], 0, 0, 0, 1)), n = 5, sw = W / n, i2, j, fondo = 25;
      for (i2 = 0; i2 < n; i2++) {
        var xa = i2 * sw, xz = xa + sw, xc = xa + sw / 2, cy = 2 * fondo - 7;
        o += pth("M" + q(xa - 1, 7) + " L" + q(xz + 1, 7) + " Q" + q(xc, cy) + " " + q(xa - 1, 7) + " Z", nuova([[0, "#cc2642"], [.6, "#9c1230"], [1, "#5e0818"]], 0, 0, 0, 1), bordo("#3a0410", .8));
        for (j = 1; j <= 3; j++) { var yy = 7 + (fondo - 7) * j / 4.2; o += tratto("M" + q(xa + j * 3, 8) + " Q" + q(xc, 2 * yy - 8) + " " + q(xz - j * 3, 8), "#4a0614", 1.4, op(.42)) + tratto("M" + q(xa + j * 3 - 1, 9) + " Q" + q(xc - 1, 2 * yy - 9.6) + " " + q(xz - j * 3 - 1, 9), "#ff8496", .7, op(.35)); }
        for (j = 0; j <= 18; j++) { var tt = j / 18, bx = (1 - tt) * (1 - tt) * (xz + 1) + 2 * (1 - tt) * tt * xc + tt * tt * (xa - 1), by = (1 - tt) * (1 - tt) * 7 + 2 * (1 - tt) * tt * cy + tt * tt * 7; o += tratto(linea([bx, by - .3], [bx, by + 3.4]), j % 2 ? ORO : "#c99a36", 1); }   // la frangia
        o += tratto("M" + q(xz + 1, 7) + " Q" + q(xc, cy) + " " + q(xa - 1, 7), ORO, 1.3);
      }
      o += rett(-1, 6.6, W + 2, 1.4, 0, ORO) + rett(-1, 6.6, W + 2, .45, 0, "#fff3c4", op(.85));
      for (i2 = 0; i2 <= n; i2++) o += nappa(i2 * sw, 7, 1.05);
      return o;
    }
    function sipario(W, H) {   // il fondo visto da davanti (piatto, W × H, y = 0 in alto)
      var o = rett(0, 0, W, H, 0, nuova([[0, "#2a1d6e"], [.55, "#1b1350"], [1, "#0d0a2a"]], 0, 0, 0, 1)), cx = W / 2, cy = H * .5, rr = rnd(1957), j;
      for (j = 0; j < 36; j += 2) { var t0 = j / 36 * 6.2832, t1 = (j + 1) / 36 * 6.2832; o += poly([[cx, cy], [cx + Math.cos(t0) * 150, cy + Math.sin(t0) * 150], [cx + Math.cos(t1) * 150, cy + Math.sin(t1) * 150]], "#ffcf5a", op(NOTTE ? .2 : .12)); }   // la raggiera
      o += cer(cx, cy, 62, nuovaRU([[0, "#ffd76a", NOTTE ? .5 : .32], [1, "#ffd76a", 0]], cx, cy, 62));
      for (j = 0; j < 80; j++) { var px = rr() * W, py = rr() * H * .95; o += cer(px, py, .45 + rr() * .9, rr() < .5 ? "#fff3c4" : "#c9d8ff", op(NOTTE ? .95 : .55)); }   // le paillettes
      o += poly(stella(cx, cy, 23, 9.5), "#000", op(.3) + " " + trasla(1.2, 1.6)) + poly(stella(cx, cy, 23, 9.5), nuova(DORATO, 0, 0, 1, 1), bordo(L, 1.4)) + poly(stella(cx, cy, 13, 5.4), "#fff6d0", op(.45));
      return dentro("M0,0 H" + f2(W) + " V" + f2(H) + " H0 Z", o) + telo(-1, W, H) + telo(1, W, H) + mantovana(W);   // (la raggiera resta dentro il fondale)
    }
    function retro(W, H) {   // il retro del fondale: velluto scuro a pieghe, la cornice d'oro e la stella nel tondo
      var o = rett(0, 0, W, H, 0, nuova([[0, "#741026"], [.5, "#4e0a19"], [1, "#2c050e"]], 0, 0, 0, 1)), j;
      for (j = 1; j < 16; j++) { var x = j * W / 16; o += rett(x - 3.4, 0, 6.8, H, 0, nuova([[0, "#000", 0], [.5, "#000", .25], [1, "#000", 0]], 0, 0, 1, 0)) + rett(x - 6.4, 0, 1.8, H, 0, "#ff9aaa", op(.08)); }
      o += rett(9, 12, W - 18, H - 24, 3, "none", "stroke='#5a3c0c' stroke-width='4'") + rett(9, 12, W - 18, H - 24, 3, "none", "stroke='" + ORO + "' stroke-width='2.4'") + rett(8.6, 11.5, W - 18, H - 24, 3, "none", "stroke='#fff3c4' stroke-width='.6' opacity='.8'");
      o += cer(W / 2, H * .47, 26, "none", "stroke='#5a3c0c' stroke-width='3.6'") + cer(W / 2, H * .47, 26, "none", "stroke='" + ORO + "' stroke-width='2'");
      return o + poly(stella(W / 2, H * .47, 19, 7.8), nuova(DORATO, 0, 0, 1, 1), bordo(L, 1.2)) + poly(stella(W / 2, H * .47, 11, 4.5), "#fff6d0", op(.35));
    }
    // ---- le colonne d'oro con le lampadine, la trave e la stella in cima ----
    function specch(W, H) { return rett(2.2, 3, W - 4.4, H - 6, .8, "none", "stroke='#7a5614' stroke-width='.8' opacity='.75'") + rett(2.9, 3.7, W - 5.8, H - 7.4, .6, "none", "stroke='#fff3c4' stroke-width='.5' opacity='.7'"); }
    function colonnaDav(W, H) {   // la colonna vista davanti: la fascia rossa con la fila di lampadine
      var o = rett(2.2, 0, W - 4.4, H, 0, nuova([[0, "#8a1426"], [1, "#4a0812"]], 0, 0, 1, 0)) + rett(1.7, 0, .6, H, 0, "#fff3c4", op(.7)) + rett(W - 2.3, 0, .6, H, 0, "#7a5614", op(.7)), y;
      for (y = 6; y < H - 3; y += 8.8) o += lampadina(W / 2, y, 2.1, Math.round(y / 8.8) % 2 ? "#fff1b0" : "#ffd23f");
      return o;
    }
    function traveDav(W, H) {   // la trave vista davanti: la fascia rossa coi fili d'oro e le lampadine
      var o = rett(0, 3.2, W, H - 6.4, 0, nuova([[0, "#8a1426"], [1, "#4a0812"]], 0, 0, 0, 1)) + rett(0, 2.6, W, .7, 0, "#fff3c4", op(.8)) + rett(0, H - 3.4, W, .7, 0, "#7a5614", op(.8)), x;
      for (x = 5; x < W - 2; x += 8.6) o += lampadina(x, H / 2, 2, Math.round(x / 8.6) % 2 ? "#fff1b0" : "#ffd23f");
      return o;
    }
    function colonna(a) { return blocco(a - .125, a + .125, -1.5, -1.26, ZP, ZP + 8, oroT(), { davanti: specch, dietro: specch, fianco: specch }, 1.4) + blocco(a - .1, a + .1, -1.48, -1.28, ZP + 8, ZT, oroT(), { davanti: colonnaDav, dietro: specch, fianco: specch }, 1.5); }
    var lati = [-1.89, 1.89].sort(function (x, y) { return G * x - G * y; });   // prima la colonna che sta a sinistra sullo schermo, poi il fondo, poi l'altra
    s += colonna(lati[0]);
    s += pianoV("a", BF, -1.79, 1.79, ZP, ZT, G > 0 ? sipario(218.4, ZT - ZP) : retro(218.4, ZT - ZP));
    s += colonna(lati[1]);
    s += blocco(-1.99, 1.99, -1.47, -1.29, ZT, ZT + 18, oroT(), { davanti: traveDav, dietro: specch, fianco: specch }, 1.6);
    s += pianoV("a", BF, -.28, .28, ZT + 18, ZT + 48, (function () {   // la stella in cima, con le lampadine sulle punte
      var W = 34.2, cx = W / 2, cy = 15.5, o = rett(cx - 2, 24, 4, 6.5, .8, nuova(DORATO, 0, 0, 1, 0), bordo(L, .8));
      o += poly(stella(cx, cy, 14.5, 6), "#000", op(.25) + " " + trasla(1, 1.2)) + poly(stella(cx, cy, 14.5, 6), nuova(DORATO, 0, 0, 1, 1), bordo(L, 1.3)) + poly(stella(cx, cy, 8.6, 3.6), "#fff6cf", op(.4));
      stella(cx, cy, 14.5, 6).forEach(function (v, j) { if (j % 2 === 0) o += lampadina(v[0], v[1], 1.5, "#fff1b0"); });
      return o + lampadina(cx, cy, 2.2, "#ffffff");
    })());
    if (G < 0) return s;   // da dietro il resto (i fari, il microfono) sta dietro il fondale

    // ---- i fari colorati sotto la trave: la barra, le staffe, i corpi neri e le lenti colorate; di notte i fasci ----
    var b0 = P(-1.78, -1.2, ZT + 1.5), b1 = P(1.78, -1.2, ZT + 1.5);
    s += tratto(linea(b0, b1), L, 3.6) + tratto(linea(b0, b1), "#2a2830", 2.3) + tratto(linea(b0, b1), "#8a8694", .6, "transform='translate(0 -.7)'");
    function puntiFaro(j) { var c = P(AF[j], -1.2, ZT - 12), T = P(AF[j] * .55, .2, ZP), dx = T[0] - c[0], dy = T[1] - c[1], l = Math.sqrt(dx * dx + dy * dy); return { c: c, T: T, u: [dx / l, dy / l] }; }
    function faro(j) {
      var F = puntiFaro(j), c = F.c, u = F.u, col = FARI[j], ang = Math.atan2(-u[0], u[1]) * 180 / Math.PI, K = P(AF[j], -1.2, ZT + 1.5), yb = c[1] - 7.5, o = "";
      o += tratto("M" + q(K) + " L" + q(K[0], yb) + " M" + q(c[0] - 6.2, yb) + " L" + q(c[0] + 6.2, yb) + " M" + q(c[0] - 6.2, yb) + " L" + q(c[0] - 6.2, c[1]) + " M" + q(c[0] + 6.2, yb) + " L" + q(c[0] + 6.2, c[1]), "#141218", 2.2);   // la staffa a U
      o += cer(K[0], K[1], 2, "#3a3840", bordo(L, .6)) + cer(c[0] - 6.2, c[1], 1.4, "#4a4752", bordo(L, .5)) + cer(c[0] + 6.2, c[1], 1.4, "#4a4752", bordo(L, .5));
      o += "<g transform='translate(" + f2(c[0]) + " " + f2(c[1]) + ") rotate(" + f2(ang) + ")'>";
      o += pth("M-4.4,-3.2 Q-4.4,-8.2 0,-8.2 Q4.4,-8.2 4.4,-3.2 L4.9,5 L-4.9,5 Z", lin("fc", [[0, "#5a5662"], [.45, "#2a2830"], [1, "#0d0c10"]], 0, 0, 1, 0), bordo(L, 1));
      o += tratto("M-3.3,-5.6 L-3.6,3", "#9a96a3", .7, op(.7)) + rett(-4.6, -1, 9.2, .9, 0, "#000", op(.35));
      o += ell(0, 5, 5.7, 3, "#1b1a20", bordo(L, .9));
      o += ell(0, 5.3, 4.6, 2.3, NOTTE ? rad("fn" + j, [[0, "#ffffff"], [.45, chiaro(col, .55)], [1, col]], .45, .45, .6) : rad("fg" + j, [[0, chiaro(col, .6)], [.6, col], [1, scuro(col, .45)]], .4, .35, .7), "stroke='" + scuro(col, .5) + "' stroke-width='.5'");
      o += ell(-1.4, 4.4, 1.4, .6, "#ffffff", op(NOTTE ? .9 : .6));
      if (NOTTE) o += ell(0, 5.6, 9, 5, rad("fa" + j, [[0, col, .6], [1, col, 0]], .5, .5, .5));
      return o + "</g>";
    }
    function fascio(j) {   // il fascio di luce dal faro alla pozza sul palco
      var F = puntiFaro(j), c = F.c, T = F.T, u = F.u, nx = -u[1], ny = u[0], col = FARI[j], s0 = [c[0] + u[0] * 6, c[1] + u[1] * 6], w0 = 4.4, w1 = 21;
      var pp = [[s0[0] + nx * w0, s0[1] + ny * w0], [T[0] + nx * w1, T[1] + ny * w1], [T[0] - nx * w1, T[1] - ny * w1], [s0[0] - nx * w0, s0[1] - ny * w0]];
      var pc = [[s0[0] + nx * w0 * .4, s0[1] + ny * w0 * .4], [T[0] + nx * w1 * .3, T[1] + ny * w1 * .3], [T[0] - nx * w1 * .3, T[1] - ny * w1 * .3], [s0[0] - nx * w0 * .4, s0[1] - ny * w0 * .4]];
      return poly(pp, nuova([[0, col, .5], [.55, col, .2], [1, col, .06]], s0[0], s0[1], T[0], T[1], true)) + poly(pc, nuova([[0, "#ffffff", .32], [1, "#ffffff", 0]], s0[0], s0[1], T[0], T[1], true));
    }
    for (k = 0; k < 5; k++) s += faro(k);
    if (NOTTE) for (k = 0; k < 5; k++) s += fascio(k);

    // ---- il microfono d'argento sull'asta cromata, col filo nero che corre sul palco ----
    var MB = .98, c0 = P(0, MB, ZP), cima = P(0, MB, ZP + 82);
    s += suZ(ZP + .3, tratto("M" + q(0, MB * 61) + " C" + q(14, MB * 61 + 10) + " " + q(30, 52) + " " + q(60, 57) + " S" + q(98, 50) + " " + q(119, 46), "#141218", 1.4));
    s += ell(c0[0] + 1.5, c0[1] + .6, 8, 3.4, "#000", op(.28));
    s += tornito(0, MB, [[ZP, .072], [ZP + 1.4, .072], [ZP + 2.3, .058], [ZP + 3, .022], [ZP + 4.5, .016]], ARGENTO, 1, [1], .5);
    s += tuboArg(linea(P(0, MB, ZP + 4), cima), 1.5);
    var gh = P(0, MB, ZP + 50);
    s += rett(gh[0] - 1.9, gh[1] - 2.6, 3.8, 5.2, 1.2, lin("ghi", ARGENTO, 0, 0, 1, 0), bordo(L, .6)) + rett(gh[0] - 1.4, gh[1] - 2, .7, 4, .3, "#ffffff", op(.8));   // la ghiera
    var hx = cima[0], hy = cima[1] - 9.5, dM = "M-4.8,-1 C-5,-7.8 -2.7,-9.6 0,-9.6 C2.7,-9.6 5,-7.8 4.8,-1 C4.6,3.6 2.5,5.9 0,5.9 C-2.5,5.9 -4.6,3.6 -4.8,-1 Z", righe = "", yy;
    for (yy = -8.2; yy <= 4.8; yy += 1.45) righe += rett(-5, yy, 10, .55, 0, "#3a4148", op(.75)) + rett(-5, yy + .55, 10, .35, 0, "#ffffff", op(.55));   // la griglia a righe
    righe += rett(-.8, -10, 1.6, 16, 0, lin("mcs", [[0, "#ffffff"], [1, "#8a949c"]], 0, 0, 1, 0)) + rett(-5, -10, 10, 16, 0, lin("mco", [[0, "#000", 0], [.6, "#000", 0], [1, "#000", .35]], 0, 0, 1, 0));
    s += rett(hx - 1.2, hy + 4.6, 2.4, 4.4, .6, "#9aa4ac", bordo(L, .5));   // lo snodo
    s += "<g transform='translate(" + f2(hx) + " " + f2(hy) + ") rotate(-10)'>" + pth(dM, lin("mic", [[0, "#ffffff"], [.3, "#e4e9ee"], [.65, "#97a1aa"], [1, "#4a535b"]], 0, 0, 1, 0)) + dentro(dM, righe) + pth(dM, "none", bordo(L, 1)) + ell(-2.5, -6.4, 1.5, 2.3, "#ffffff", op(.8)) + "</g>";
    if (NOTTE) s += cer(hx - 2, hy - 7, 2.6, "#ffffff", op(.5)) + pth("M" + q(hx - 2, hy - 12) + " L" + q(hx - 1.5, hy - 7.5) + " L" + q(hx + 2.5, hy - 7) + " L" + q(hx - 1.5, hy - 6.5) + " L" + q(hx - 2, hy - 2) + " L" + q(hx - 2.5, hy - 6.5) + " L" + q(hx - 6.5, hy - 7) + " L" + q(hx - 2.5, hy - 7.5) + " Z", "#ffffff", op(.95));   // lo scintillio
    return s;
  });

  // =========================================================
  //  BANCO DELLE SCOMMESSE (lungo 3 mattonelle): il bancone blu notte laccato; sul davanti la striscia luminosa delle quote,
  //  il campo di calcio (le righe bianche, le aree, il pallone a centrocampo) nella cornice d'ottone e lo zoccolo d'ottone;
  //  sui fianchi il medaglione col pallone. Il piano di granito nero col bordo d'oro; sopra la stampante delle schedine,
  //  le schedine colorate, il bicchiere delle penne e la coppa d'oro; in alto, sulla barra d'ottone, i tre monitor delle quote
  //  (le maglie delle squadre e i numeri). Da dietro: il lato dell'allibratore (i cassetti, gli sportelli) e il retro dei monitor
  // =========================================================
  var NAVY = "#17305c";
  var MAGLIE_Q = [["#e03131", "#ffffff", 1], ["#1c7ed6", "#ffffff", 0], ["#212529", "#ffffff", 1], ["#fab005", "#c92a2a", 2], ["#2b8a3e", "#ffffff", 2], ["#74c0fc", "#ffffff", 0], ["#7048e8", "#ffd43b", 0],
    ["#f76707", "#212529", 0], ["#ffffff", "#e03131", 2], ["#0b7285", "#ffd43b", 1], ["#862e9c", "#ffffff", 1], ["#c92a2a", "#1864ab", 3], ["#ffd43b", "#1c7ed6", 1], ["#495057", "#fab005", 2]];   // [colore, secondo colore, disegno: 0 tinta unita, 1 strisce, 2 fascia, 3 metà e metà]
  var QUOTE_T = [["1,85", "3,40", "4,20"], ["2,10", "3,10", "3,60"], ["1,45", "4,50", "6,80"], ["2,70", "3,20", "2,55"], ["1,20", "6,00", "9,50"], ["3,10", "3,25", "2,25"], ["1,95", "3,30", "3,90"]];
  function maglia(x, y, s, m) {   // la maglietta di una squadra (x, y = in alto a sinistra, s = larghezza)
    var k = s / 8, d = "M" + q(x + 2.6 * k, y) + " L" + q(x + 5.4 * k, y) + " L" + q(x + 8 * k, y + 1.8 * k) + " L" + q(x + 7 * k, y + 3.6 * k) + " L" + q(x + 6.2 * k, y + 3.1 * k) + " L" + q(x + 6.2 * k, y + 8 * k) + " L" + q(x + 1.8 * k, y + 8 * k) + " L" + q(x + 1.8 * k, y + 3.1 * k) + " L" + q(x + k, y + 3.6 * k) + " L" + q(x, y + 1.8 * k) + " Z", dis = "", j;
    if (m[2] === 1) for (j = 0; j < 4; j++) dis += rett(x + (1.2 + j * 1.8) * k, y, .9 * k, 8 * k, 0, m[1]);
    else if (m[2] === 2) dis += rett(x, y + 3.4 * k, 8 * k, 1.6 * k, 0, m[1]);
    else if (m[2] === 3) dis += rett(x + 4 * k, y, 4 * k, 8 * k, 0, m[1]);
    dis += rett(x, y, 8 * k, 8 * k, 0, lin("mgl", [[0, "#ffffff", .3], [.5, "#ffffff", 0], [1, "#000", .25]], 0, 0, 1, 1));
    return pth(d, m[0]) + dentro(d, dis) + tratto("M" + q(x + 2.6 * k, y) + " Q" + q(x + 4 * k, y + 1.5 * k) + " " + q(x + 5.4 * k, y), "#0a0f1c", .4 * k, op(.6)) + pth(d, "none", bordo("#0a0f1c", .45 * k));
  }
  function freccia(x, y, su, k) { return su ? poly([[x, y - 1.6 * k], [x + 1.5 * k, y + .9 * k], [x - 1.5 * k, y + .9 * k]], NOTTE ? "#69ff8a" : "#2fbf55") : poly([[x, y + 1.6 * k], [x + 1.5 * k, y - .9 * k], [x - 1.5 * k, y - .9 * k]], NOTTE ? "#ff6b6b" : "#e03131"); }   // la quota che sale o che scende
  function schermoQuote(W, H, seme) {   // un monitor delle quote: la cornice nera, la testata verde e le righe delle partite con le maglie e i numeri
    var o = rett(0, 0, W, H, 1.6, "#15161a"), ix = 1.7, iy = 1.7, iw = W - 3.4, ih = H - 3.4, rr = rnd(seme), j;
    o += rett(ix, iy, iw, ih, .6, NOTTE ? "#14427a" : "#0e2a52");
    o += rett(ix, iy, iw, 4.6, 0, NOTTE ? "#3ccf62" : "#2b9e48") + rett(ix + iw * .5 - .2, iy, .4, 4.6, 0, "#ffffff", op(.7)) + cer(ix + iw * .5, iy + 2.3, 1.5, "none", "stroke='#ffffff' stroke-width='.35' opacity='.8'");
    o += pallone(ix + 3, iy + 2.3, 1.7, .3);
    for (j = 0; j < 4; j++) {
      var yy = iy + 5.4 + j * 4.35, q0 = QUOTE_T[(seme * 3 + j) % QUOTE_T.length];
      o += rett(ix + .4, yy, iw - .8, 4, .3, j % 2 ? "#163a6a" : "#1b4478");
      o += maglia(ix + 1, yy + .5, 3.3, MAGLIE_Q[(seme * 5 + j * 2) % 14]) + maglia(ix + 4.8, yy + .5, 3.3, MAGLIE_Q[(seme * 5 + j * 2 + 1) % 14]);
      o += rett(ix + 8.6, yy + 1.7, 5.4, .9, .45, "#b9c6d8", op(.8));
      [0, 1, 2].forEach(function (i2) { var qx = ix + 15.4 + i2 * 9.2; o += rett(qx - .4, yy + .5, 8.6, 3.3, .4, "#060b16") + led(q0[i2], qx + .5, yy + .95, 2.4, "#ffb020", NOTTE); if (rr() < .3) o += freccia(qx + 7.4, yy + 2.15, rr() < .5, .55); });
    }
    return o + poly([[ix, iy], [ix + iw * .32, iy], [ix + iw * .12, iy + ih], [ix, iy + ih]], "#ffffff", op(NOTTE ? .04 : .08));
  }
  def("banco_scommesse", { nome: "Banco delle scommesse", fp: [3, 1], box: [-106, -170, 106, 54], dietro: true, piano: 63, luce: [0, -.27, 94, 112, "#8fd8ff"] }, function () {
    var ZP = 63, s = ombraPianta(-1.5, 1.5, -.46, .46, 1, .06), r = rnd(1898), i;
    function zoccolo(W, H) { return rett(0, H - 6, W, 6, 0, nuova([[0, "#f1cf6e"], [.45, "#c99a36"], [1, "#6e4a10"]], 0, 0, 0, 1)) + rett(0, H - 6, W, .6, 0, "#fff6cf", op(.85)); }
    function frontale(W, H) {   // il davanti: la striscia delle quote, il campo di calcio nella cornice d'ottone, le lesene e lo zoccolo
      var o = rett(0, 0, W, 9.6, 0, "#07090f"), x0 = 8, x1 = W - 8, y0 = 15, y1 = H - 10.5, pw = x1 - x0, ph = y1 - y0, lc = "#f3fff5", j;
      o += led("1,85  3,40  2,10  4,50  1,95  3,20  2,75", 9.3, 1.7, 6.2, "#ffb020", NOTTE) + rett(0, 0, W, 4.4, 0, "#ffffff", op(.06));
      if (NOTTE) o += rett(0, 0, W, 9.6, 0, "#ffb020", op(.12)) + rett(0, 12.2, W, 1.1, .5, "#8fd8ff") + rett(0, H - 7.4, W, 1.1, .5, "#8fd8ff");   // il bagliore delle quote e le strisce di led azzurre
      o += rett(0, 9.6, W, 2.4, 0, nuova(OTTONE, 0, 0, 0, 1));
      o += rett(x0 - 2, y0 - 2, pw + 4, ph + 4, 1.2, nuova(OTTONE, 0, 0, 0, 1), bordo("#5a3c0c", .5));
      o += rett(x0, y0, pw, ph, 0, NOTTE ? "#36c25a" : "#2c9a45");   // di notte il campo è illuminato da dietro
      for (j = 0; j < 14; j += 2) o += rett(x0 + j * pw / 14, y0, pw / 14, ph, 0, NOTTE ? "#4cd46e" : "#38ad54");
      if (NOTTE) o += rett(x0, y0, pw, ph, 0, nuova([[0, "#eaffd0", .32], [.5, "#eaffd0", .06], [1, "#eaffd0", .3]], 0, 0, 0, 1));
      o += rett(x0 + 2.4, y0 + 2.4, pw - 4.8, ph - 4.8, 0, "none", "stroke='" + lc + "' stroke-width='.8'") + tratto(linea([x0 + pw / 2, y0 + 2.4], [x0 + pw / 2, y1 - 2.4]), lc, .8) + cer(x0 + pw / 2, y0 + ph / 2, ph * .27, "none", "stroke='" + lc + "' stroke-width='.8'");
      [[x0 + 2.4, 1], [x1 - 2.4, -1]].forEach(function (g) {   // le aree e le porte
        var ax = g[1] > 0 ? g[0] : g[0] - 21, bx = g[1] > 0 ? g[0] : g[0] - 8;
        o += rett(ax, y0 + ph * .18, 21, ph * .64, 0, "none", "stroke='" + lc + "' stroke-width='.8'") + rett(bx, y0 + ph * .34, 8, ph * .32, 0, "none", "stroke='" + lc + "' stroke-width='.7'");
        o += rett(g[1] > 0 ? g[0] - 2.4 : g[0], y0 + ph * .4, 2.4, ph * .2, 0, "#ffffff", op(.55));
      });
      o += pallone(x0 + pw / 2, y0 + ph / 2, 4.4, .5);
      o += rett(0, 12, 5.2, H - 18, 0, nuova(OTTONE, 0, 0, 1, 0)) + rett(W - 5.2, 12, 5.2, H - 18, 0, nuova(OTTONE, 0, 0, 1, 0));   // le lesene d'ottone
      return o + zoccolo(W, H);
    }
    function retroBanco(W, H) {   // il lato dell'allibratore: i cassetti e gli sportelli coi pomoli d'ottone
      var o = rett(0, 0, W, 3, 0, nuova(OTTONE, 0, 0, 0, 1)), nD = 4, dw = (W - 10) / nD, j;
      for (j = 0; j < nD; j++) {
        var x = 5 + j * dw;
        o += rett(x + 1, 6, dw - 2, 9, 1, "none", "stroke='#0b1730' stroke-width='.9'") + rett(x + 1.6, 6.6, dw - 3.2, 1, 0, "#ffffff", op(.08)) + rett(x + dw / 2 - 4.5, 10, 9, 1.8, .9, nuova(OTTONE, 0, 0, 0, 1), bordo("#5a3c0c", .3));
        o += rett(x + 1, 18, dw - 2, H - 27, 1.2, "none", "stroke='#0b1730' stroke-width='.9'") + rett(x + 2.6, 19.6, dw - 5.2, H - 30.2, .8, "none", "stroke='" + ORO + "' stroke-width='.5' opacity='.7'") + cer(j % 2 ? x + 4.6 : x + dw - 4.6, 18 + (H - 27) / 2, 1.3, nuovaR(DORATO, .35, .3, .8), bordo("#5a3c0c", .3));
      }
      return o + zoccolo(W, H);
    }
    function fiancata(W, H) {   // il fianco: il medaglione d'oro col pallone
      var o = rett(0, 9.6, W, 2.4, 0, nuova(OTTONE, 0, 0, 0, 1)), cy = H * .5;
      o += cer(W / 2 + .5, cy + .8, 10.4, "#000", op(.25)) + cer(W / 2, cy, 10.4, nuovaR(DORATO, .35, .3, .85), bordo(L, .9)) + cer(W / 2, cy, 8.2, "#0e2147", bordo("#5a3c0c", .5));
      return o + pallone(W / 2, cy, 6.2, .6) + zoccolo(W, H);
    }
    s += blocco(-1.45, 1.45, -.37, .37, 0, 59, NAVY, { davanti: frontale, dietro: retroBanco, fianco: fiancata }, 1.8);
    // il piano: il bordo d'oro e il granito nero lucido
    s += blocco(-1.5, 1.5, -.41, .45, 59, ZP, oroT(), null, 1.5);
    var gr = rett(-90.3, -24.4, 180.6, 51.9, 1.5, nuova([[0, "#3c3843"], [.5, "#26232b"], [1, "#151318"]], 0, 0, 1, 1));
    for (i = 0; i < 170; i++) gr += cer(-90 + r() * 180, -24 + r() * 51.5, .25 + r() * .5, ["#8d8794", "#5c5763", "#c9c4ce", "#0d0c10"][Math.floor(r() * 4)], op(.55));
    gr += pth("M-90,-24 L-40,-24 L-80,27.5 L-90,27.5 Z", "#ffffff", op(.07)) + pth("M-30,-24 L-18,-24 L-58,27.5 L-70,27.5 Z", "#ffffff", op(.05));
    s += suZ(ZP, gr);
    // la barra d'ottone coi tre monitor delle quote (in fondo al piano)
    function monitor() {
      var o = "", bb = -.27, zb = 111;
      [-1.3, 1.3].forEach(function (a) { var pb = P(a, bb, ZP); o += ell(pb[0], pb[1], 4, 2, nuovaR(DORATO, .35, .3, .8), bordo(L, .6)) + tuboOro(linea(P(a, bb, ZP), P(a, bb, zb + 1)), 1.9) + pallina(P(a, bb, zb + 3), 2.1, ORO, .6); });
      o += tuboOro(linea(P(-1.3, bb, zb), P(1.3, bb, zb)), 1.6);
      [[-1.21, -.43], [-.38, .38], [.43, 1.21]].forEach(function (m, j) {
        [m[0] + .12, m[1] - .12].forEach(function (a) { o += tuboOro(linea(P(a, bb, zb), P(a, bb, 104)), .7); });
        o += blocco(m[0], m[1], bb - .035, bb + .035, 78, 104.5, ["#2a2c33", "#1d1f25", "#121317"], { davanti: function (W, H) { return schermoQuote(W, H, j + 1); },
          dietro: function (W, H) { var v = rett(2, 2, W - 4, H - 4, 1.4, "#24262c"), y; for (y = 6; y < H - 5; y += 2.6) v += rett(W * .3, y, W * .4, .7, .35, "#0d0e11"); return v + cer(W / 2, H - 5, 1.6, ORO, op(.8)); } }, 1.2);
      });
      return o;
    }
    var cose = [];
    cose.push([vicino(-.16, .11), blocco(-.3, -.03, -.02, .24, ZP, ZP + 9, "#dfe3e8", { davanti: function (W, H) {   // la stampante delle schedine, con la schedina che esce
      return rett(3, 2.6, W - 6, 1.6, .6, "#2a2c33") + pth("M" + q(W / 2 - 4.5, 3.4) + " L" + q(W / 2 + 4.5, 3.4) + " L" + q(W / 2 + 4.2, 8.2) + " L" + q(W / 2 - 4.8, 8.6) + " Z", "#ffffff", bordo("#9aa4ad", .3)) + rett(W / 2 - 3, 5.2, 6, .5, 0, "#adb5bd") + rett(W / 2 - 3, 6.4, 4, .5, 0, "#adb5bd") + cer(W - 3, H - 2.2, .9, NOTTE ? "#69ff8a" : "#2fbf55");
    } }, 1)]);
    cose.push([vicino(.53, .15), (function () {   // le schedine colorate nel portaschedine di plexiglas
      var o = blocco(.4, .67, .06, .25, ZP, ZP + 2.5, ["#d9f2ff", "#bfe3f5", "#9cc8de"], null, .8);
      ["#ff8fab", "#ffe066", "#8ce99a", "#74c0fc"].forEach(function (c, j) { var bS = .21 - j * .04; o += pianoV("a", bS, .42, .65, ZP + 1.5, ZP + 11.5 - j * .6, rett(0, 0, 14, 10, .4, c, bordo(scuro(c, .4), .3)) + rett(2, 2, 7, .8, 0, scuro(c, .35), op(.6)) + rett(2, 4, 10, .5, 0, scuro(c, .3), op(.5)) + rett(2, 5.6, 9, .5, 0, scuro(c, .3), op(.5))); });
      return o;
    })()]);
    cose.push([vicino(.95, .2), (function () {   // il bicchiere delle penne
      var o = ""; [["#1c7ed6", -.02, -2], ["#e03131", .025, 1], ["#212529", 0, 3]].forEach(function (pn) { o += tratto(linea(P(.95 + pn[1], .2, ZP + 5), P(.95 + pn[1] * 2.2, .2, ZP + 13.5)), L, 1.6) + tratto(linea(P(.95 + pn[1], .2, ZP + 5), P(.95 + pn[1] * 2.2, .2, ZP + 13.5)), pn[0], .9); });
      return o + tornito(.95, .2, [[ZP, .045], [ZP + 1, .048], [ZP + 7.5, .055]], [[0, "#4a4f57"], [.5, "#2a2d33"], [1, "#101114"]], .9, null, .5);
    })()]);
    cose.push([vicino(-1.05, .14), (function () {   // la coppa d'oro
      var o = tornito(-1.05, .14, [[ZP, .075], [ZP + 2.6, .075], [ZP + 3.2, .055], [ZP + 4, .05], [ZP + 4.6, .022], [ZP + 9.5, .015], [ZP + 10.5, .03], [ZP + 13, .062], [ZP + 17, .088], [ZP + 21, .098]], DORATO, 1.1, [1, 3], .6);
      var e = anello(-1.05, .14, ZP + 21, .098), m1 = P(-1.05, .14, ZP + 18.5);
      [-1, 1].forEach(function (sg) { o += tuboOro("M" + q(m1[0] + sg * 6.2, m1[1] - 1.6) + " C" + q(m1[0] + sg * 11, m1[1] - 2) + " " + q(m1[0] + sg * 10, m1[1] + 6) + " " + q(m1[0] + sg * 4, m1[1] + 5.4), 1); });
      return o + ell(e.x, e.y, e.rx * .88, e.ry * .8, nuova([[0, "#6e4a10"], [1, "#c99a36"]], 0, 0, 0, 1)) + cer(e.x - 2.4, e.y + 7, .9, "#ffffff", op(.8));
    })()]);
    cose.sort(function (x, y) { return x[0] - y[0]; });
    var piccole = cose.map(function (x) { return x[1]; }).join("");
    return s + (G > 0 ? monitor() + piccole : piccole + monitor());
  });

  // =========================================================
  //  POLTRONA DELLE SCOMMESSE: la poltroncina sportiva di pelle nera sul piede cromato girevole: la scocca con lo schienale
  //  inclinato e il poggiatesta tondo, i canali imbottiti con le cuciture rosse, i braccioli imbottiti; dal bracciolo di
  //  sinistra sale il braccio cromato snodato con lo schermo della partita e delle quote, girato verso chi è seduto
  //  (da dietro si vede lo schermo acceso, da davanti il retro). Da dietro la scocca col filo rosso e lo stemma col pallone
  // =========================================================
  var NERO_P = "#2e2d35";
  def("poltrona_scommesse", { nome: "Poltrona delle scommesse", fp: [1, 1], box: [-50, -80, 52, 26], dietro: true, azione: "siedi", seduta: 27 }, function () {
    var c = NERO_P, pz = [], s = ombraPianta(-.42, .42, -.42, .4, 1), ROSSO = "#d6283b";
    function filo(W, H) { return rett(0, H * .5, W, .9, 0, "#d9dee3", op(.85)) + rett(0, H * .5, W, .3, 0, "#ffffff"); }
    // il piede cromato girevole e la scocca nera sotto la seduta
    pz.push({ box: [-.3, .3, -.33, .27, 0, 8.4], s: tornito(0, -.03, [[0, .3], [1.2, .3], [2.2, .27], [2.9, .1], [3.6, .085], [7.5, .085], [8.4, .13]], ARGENTO, 1.2, [1, 3], .7) });
    pz.push({ box: [-.37, .37, -.43, .33, 8.4, 11.5], s: blocco(-.37, .37, -.43, .33, 8.4, 11.5, "#1b1a20", { davanti: filo, dietro: filo, fianco: filo }, 1.3) });
    // la seduta: il cuscino gonfio con la cucitura rossa sul davanti
    pz.push({ box: [-.25, .25, -.26, .34, 11.5, 27.6], s: estruso("a", sezione(-.26, .34, 11.5, 26, .06, 1.6, .03), -.25, .25, c, { mat: PELLE, ao: .3, aoH: 6, fascia: function (H) {
      var kk = H.vicinoA(.34 - .02, 26 - 2);
      return solco(H, -.23, 26, -.25, .25) + tratto(aperto(H.lungo(kk, -.23, .23)), ROSSO, .6, "stroke-dasharray='1.4 1.1' opacity='.9'") + H.luccica(.35, .1, .9);
    } }) });
    // lo schienale inclinato col poggiatesta tondo: davanti i canali con le cuciture rosse, dietro il filo rosso e lo stemma
    var prS = pulisci([[-.26, 11.5], [-.42, 11.5], [-.445, 49]].concat(arcoS(-.37, 51, .075, 7.5, Math.PI, 0, 12), [[-.29, 46], [-.265, 24]]));
    function bF(z) { return z > 46 ? -.29 : -.265 - (z - 24) * .00114; }
    pz.push({ box: [-.27, .27, -.445, -.26, 11.5, 59], ord: G > 0 ? 0 : 2, s: estruso("a", prS, -.27, .27, c, { mat: PELLE, ao: .25, aoH: 8, fascia: function (H) {
      var o = H.luccica(.45);
      if (G > 0) {
        [-.09, .09].forEach(function (a) { var A = P(a, bF(27), 27), B = P(a, bF(44), 44); o += tratto(linea(A, B), "#000", 1.5, op(.5)) + tratto(linea([A[0] - .8, A[1]], [B[0] - .8, B[1]]), "#ffffff", .5, op(.22)) + tratto(linea([A[0] + 1.3, A[1] + .6], [B[0] + 1.3, B[1] + .6]), ROSSO, .5, "stroke-dasharray='1.3 1' opacity='.85'"); });
        var A2 = P(-.26, bF(45), 45), B2 = P(.26, bF(45), 45);   // la cucitura sotto il poggiatesta
        o += tratto(linea(A2, B2), "#000", 1.4, op(.45)) + tratto(linea([A2[0], A2[1] - 1.2], [B2[0], B2[1] - 1.2]), ROSSO, .55, "stroke-dasharray='1.3 1' opacity='.9'");
      } else {
        o += pianoV("a", -.447, -.27, .27, 14, 50, (function () {
          var v = rett(3, 2.5, 26.9, 31, 3, "none", "stroke='" + ROSSO + "' stroke-width='1.1'") + rett(3, 2.5, 26.9, 31, 3, "none", "stroke='#ffb3bd' stroke-width='.3' stroke-dasharray='1.2 1' transform='translate(-.4 -.4)'");
          v += cer(16.5, 12.6, 6, "#000", op(.3)) + cer(16.5, 12, 6, nuovaR(DORATO, .35, .3, .85), bordo(L, .7)) + cer(16.5, 12, 4.6, "#14151a");
          return v + pallone(16.5, 12, 3.7, .4);
        })());
      }
      return o;
    } }) });
    // i braccioli imbottiti (tondi sopra), col filo rosso
    function braccio(lato) {
      var xi = .25 * lato, xe = .37 * lato, x0 = Math.min(xi, xe), x1 = Math.max(xi, xe), xc = (x0 + x1) / 2;
      var pr = pulisci([[x0, 11.5], [x1, 11.5], [x1, 30]].concat(arcoS(xc, 30, (x1 - x0) / 2, 5.5, 0, Math.PI, 12)));
      return estruso("b", pr, -.42, .3, c, { mat: PELLE, ao: .28, aoH: 7, fascia: function (H) { var kk = H.vicinoA(xc, 35.5); return H.luccica(.5, .04, .96) + tratto(aperto(H.lungo(kk, -.4, .28)), ROSSO, .5, "stroke-dasharray='1.3 1' opacity='.8'"); } });
    }
    pz.push({ box: [-.37, -.25, -.42, .3, 11.5, 35.5], s: braccio(-1), ord: 1 }, { box: [.25, .37, -.42, .3, 11.5, 35.5], s: braccio(1), ord: 1 });
    // il braccio cromato snodato e lo schermo (largo, girato verso chi è seduto)
    pz.push({ box: [-.52, -.25, .3, .48, 34, 60], ord: 2, s: (function () {
      var o = "", C0 = [-.37, .41], tA = [.98, .2], nF = [.2, -.98], hw = .145, zb = 47, zh = 12;
      var P1 = P(-.31, .24, 35.2), P2 = P(-.31, .24, 43), P3 = P(C0[0], C0[1], zb + .4);
      o += tuboArg(linea(P1, P2), 1.5) + tuboArg(linea(P2, P3), 1.3) + pallina(P2, 1.6, "#c9d1d8", .5) + pallina(P1, 1.5, "#c9d1d8", .5);
      function pm(sx, h) { return P(C0[0] + tA[0] * sx * hw - nF[0] * .025 * h, C0[1] + tA[1] * sx * hw - nF[1] * .025 * h, zb + zh * h); }
      var faccia2 = dot(mondo([nF[0], nF[1], 0]), VISTA) > 0, sx0 = pm(-1, 1)[0] < pm(1, 1)[0] ? -1 : 1;
      var dS = P(-nF[0] * .035, -nF[1] * .035, 0), sh = function (v) { return [v[0] + dS[0], v[1] + dS[1]]; };
      var qF = [pm(-1, 0), pm(1, 0), pm(1, 1), pm(-1, 1)], dF = chiuso(qF), dB = chiuso(qF.map(sh));
      if (faccia2) {   // si vede lo schermo: la partita a sinistra, le quote a destra
        o += pth(dB, "#16151a", bordo(L, 1.1));
        o += piano(pm(sx0, 1), pm(-sx0, 1), pm(sx0, 0), 17.7, 12, (function () {
          var v = rett(0, 0, 17.7, 12, 1, "#101115") + rett(1, 1, 15.7, 10, .4, "#123d78");
          v += rett(1, 1, 9, 10, .4, "#3cc463") + rett(5.3, 1, .3, 10, 0, "#ffffff", op(.75)) + cer(5.45, 6, 1.8, "none", "stroke='#ffffff' stroke-width='.3' opacity='.85'");
          v += rett(2.6, 3, 1, 1.6, .25, "#e03131") + rett(7.6, 6.4, 1, 1.6, .25, "#1c7ed6") + cer(4.4, 7, .5, "#ffffff");
          v += rett(10.6, 2, 6.2, 3.4, .3, "#060b16") + led("1,85", 10.9, 2.5, 2.3, "#ffb020", true) + rett(10.6, 6.6, 6.2, 3.4, .3, "#060b16") + led("3,40", 10.9, 7.1, 2.3, "#ffb020", true);
          return v + poly([[1, 1], [6, 1], [3, 11], [1, 11]], "#ffffff", op(.1));
        })());
        o += pth(dF, "none", bordo(L, .9));
      } else {   // si vede il retro: la plastica nera con la piastra e il pallino d'oro
        o += pth(dF, "#16151a", bordo(L, 1.1));
        o += pth(dB, lin("mrb", [[0, "#4a4953"], [1, "#17161b"]], 0, 0, 1, 1), bordo(L, 1.1));
        var cB = sh(P(C0[0], C0[1], zb + zh * .5)); o += rett(cB[0] - 2.6, cB[1] - 2.2, 5.2, 4.4, .6, "#2a2930", bordo(L, .5)) + cer(cB[0], cB[1], 1.1, ORO, op(.9));
      }
      return o;
    })() });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  TABELLONE DELLE QUOTE (da parete, largo due pezzi di muro): la cornice d'oro con le lampadine, in cima lo stemma col
  //  pallone e l'alloro; dentro la testata verde del campo con le tre colonne (1, X, 2), le sette partite con le maglie
  //  delle squadre e le quote color ambra (le frecce verdi e rosse: la quota sale o scende), sotto la striscia che scorre.
  //  Di notte le cifre e le lampadine accese, con la luce sul muro
  // =========================================================
  def("tabellone_quote", { tipo: "parete", nome: "Tabellone delle quote", largo: 2, luce: [62, 86, 140, "#9ff0c4"] }, function () {
    var x = 5, y = 32, w = 114, h = 104, cx = 62, s = "", i, j, rr = rnd(2026);
    var cor = rq(x, y, w, h, 6);
    if (NOTTE) s += ell(cx, y + h / 2, 74, 64, rad("alo", [[0, "#9ff0c4", .32], [1, "#9ff0c4", 0]], .5, .5, .5));   // la luce sul muro
    s += ombraD(cor, 2.4, 3.2);
    [30, 94].forEach(function (bx) { s += rett(bx - 2.4, y + h - 2, 4.8, 8, 1, nuova(OTTONE, 0, 0, 1, 0), bordo(L, .6)) + cer(bx, y + h + 4.4, .9, "#6e4a10"); });   // i sostegni d'ottone
    s += pth(cor, rad("tqc", [[0, "#fff3c4"], [.55, "#e0a92e"], [1, "#9a6a14"]], .35, .3, .95), bordo(L, 1.6));
    var ix = x + 5, iy = y + 5, iw = w - 10, ih = h - 10;
    s += rett(ix, iy, iw, ih, 3, lin("tqf", NOTTE ? [[0, "#0f2650"], [1, "#050c1e"]] : [[0, "#0b1c3d"], [1, "#040a18"]], 0, 0, 0, 1), "stroke='#3a2a0a' stroke-width='.8'");
    // la testata: il campo verde con le righe, il pallone e le tre colonne
    var hy = iy + 2, hx0 = ix + 2, hw = iw - 4, colX = [ix + 50, ix + 68, ix + 86], cw = 16, lc = "#f3fff5";
    s += rett(hx0, hy, hw, 10.5, 1.5, NOTTE ? "#36b85a" : "#2b9e48");
    for (i = 0; i < 12; i += 2) s += rett(hx0 + i * hw / 12, hy, hw / 12, 10.5, 0, NOTTE ? "#45c968" : "#35ac53", op(.9));
    s += rett(hx0 + 1.2, hy + 1.2, hw - 2.4, 8.1, 0, "none", "stroke='" + lc + "' stroke-width='.5' opacity='.85'") + rett(hx0 + hw / 2 - .25, hy + 1.2, .5, 8.1, 0, lc, op(.85)) + cer(hx0 + hw / 2, hy + 5.25, 2.6, "none", "stroke='" + lc + "' stroke-width='.5' opacity='.85'");
    s += pallone(ix + 9, hy + 5.25, 3.7, .45);
    [0, 1, 2].forEach(function (k) {
      var mx = colX[k] + cw / 2;
      s += rett(colX[k] + 2, hy + 1.6, cw - 4, 7.3, 1.2, "#071a0d", op(.75));
      if (k === 1) s += tratto(linea([mx - 1.8, hy + 3], [mx + 1.8, hy + 7.4]) + " " + linea([mx + 1.8, hy + 3], [mx - 1.8, hy + 7.4]), NOTTE ? "#ffffff" : "#e9fff0", 1.1);
      else s += led(k ? "2" : "1", mx - 1.3, hy + 2.6, 5, NOTTE ? "#ffffff" : "#e9fff0", NOTTE);
    });
    // le partite: le maglie, i nomi (righine) e le quote
    for (j = 0; j < 7; j++) {
      var ry = iy + 14 + j * 10.3, mA = MAGLIE_Q[(j * 2) % 14], mB = MAGLIE_Q[(j * 2 + 1) % 14];
      s += rett(ix + 2, ry, iw - 4, 9.5, 1, j % 2 ? "#0f2550" : "#132d5e");
      s += maglia(ix + 3.4, ry + 1.1, 7.2, mA) + rett(ix + 12.2, ry + 3.6, 10, 1.6, .8, "#c5cfdc", op(.85)) + cer(ix + 24.6, ry + 4.4, .75, "#8fa3c0") + rett(ix + 26.8, ry + 3.6, 10, 1.6, .8, "#c5cfdc", op(.85)) + maglia(ix + 38.6, ry + 1.1, 7.2, mB);
      for (i = 0; i < 3; i++) {
        s += rett(colX[i], ry + 1, cw, 7.5, 1, "#050a14", "stroke='#2d4a7a' stroke-width='.4'") + led(QUOTE_T[j][i], colX[i] + 1.8, ry + 2.3, 5, "#ffb020", NOTTE);
        if (rr() < .28) s += freccia(colX[i] + cw - 2.2, ry + 4.75, rr() < .5, .85);
      }
    }
    // la striscia che scorre
    var ty = iy + ih - 7.6;
    s += rett(ix + 2, ty, iw - 4, 6, 1, "#020407", "stroke='#2d4a7a' stroke-width='.4'") + led("2,35 3,10 1,75 4,40 2,90 1,62 5,25", ix + 4, ty + 1.2, 3.6, "#5cff8a", NOTTE);
    s += rett(ix, iy, iw, ih * .4, 3, lin("tqv", [[0, "#ffffff", NOTTE ? .05 : .09], [1, "#ffffff", 0]], 0, 0, 0, 1));
    // le lampadine sulla cornice
    lungoRett(x + 2.5, y + 2.5, w - 5, h - 5, 8.6).forEach(function (pt, k) { s += lampadina(pt[0], pt[1], 1.15, k % 2 ? "#ffd36b" : "#fff3bf"); });
    // in cima lo stemma: il pallone nell'alloro d'oro
    var sy = y - 8;
    for (i = 0; i < 7; i++) {
      [-1, 1].forEach(function (sg) {
        var t = .5 + i * .3, fx = cx + sg * Math.sin(t) * 12.6, fy = sy + 3 - Math.cos(t) * 8.5, rot = sg * (t * 57 + 20);
        s += ell(fx, fy, 3.4, 1.5, nuova(DORATO, 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.5' transform='rotate(" + f2(rot) + " " + f2(fx) + " " + f2(fy) + ")'");
      });
    }
    s += cer(cx + .8, sy + 1, 8.8, "#000", op(.25)) + pallone(cx, sy, 8.6, .9) + rett(cx - 6, sy + 8.6, 12, 3.2, 1.2, nuova(DORATO, 0, 0, 0, 1), bordo(L, .7));
    return s;
  });

  // =========================================================
  //  BUFFET (lungo 3 mattonelle): il tavolo con la tovaglia bianca col pizzo, la gonna a pieghe bordeaux coi festoni e le
  //  nappe d'oro; dietro il gradino bianco con l'alzata d'argento della frutta (l'ananas, l'uva, le arance, le mele, le
  //  fragole) e la torta alle fragole; davanti le pile di piatti, due cloche d'argento chiuse, il pollo arrosto con
  //  l'insalata e i pomodorini, l'alzata dei dolci (i macaron colorati e i pasticcini). Da dietro il lato dei cuochi
  //  (la gonna senza festoni)
  // =========================================================
  var BORDEAUX = "#7e1430";
  def("buffet", { nome: "Buffet", fp: [3, 1], box: [-106, -150, 106, 52], dietro: true, piano: 50 }, function () {
    var ZT = 50, ZR = 58, s = ombraPianta(-1.5, 1.5, -.46, .46, 1, .06), r = rnd(1977), i, k;
    function pizzo(W, cad) { var o = rett(0, 0, W, cad, 0, nuova([[0, "#ffffff"], [1, "#e9e3d8"]], 0, 0, 0, 1)), xx; for (xx = 0; xx < W - .5; xx += 3.4) o += pth("M" + q(xx, cad - .3) + " A1.7,1.7 0 0,0 " + q(xx + 3.4, cad - .3) + " Z", "#f6f1e8", "stroke='#cfc6b6' stroke-width='.3'") + cer(xx + 1.7, cad + .3, .35, "#ddd4c4"); return o; }
    function gonna(W, H, ricca) {   // la tovaglia che scende col pizzo, la gonna a pieghe bordeaux, i festoni e le nappe d'oro
      var o = "", j, cad = 8.5, np = Math.max(4, Math.round(W / 7.2)), pw = W / np;
      for (j = 0; j < np; j++) o += rett(j * pw, cad, pw + .3, H - cad, 0, nuova([[0, chiaro(BORDEAUX, .2)], [.35, BORDEAUX], [.85, scuro(BORDEAUX, .32)], [1, scuro(BORDEAUX, .5)]], 0, 0, 1, 0));
      o += rett(0, cad, W, H - cad, 0, nuova([[0, "#000", 0], [.55, "#000", 0], [1, "#000", .32]], 0, 0, 0, 1)) + rett(0, H - 2.4, W, 1.3, 0, ORO, op(.9));
      o += pizzo(W, cad);
      if (ricca) {
        var ns = Math.max(1, Math.round(W / 44)), sw = W / ns;
        for (j = 0; j < ns; j++) { var xa = j * sw, dS = "M" + q(xa + 1, cad + .4) + " Q" + q(xa + sw / 2, cad + 17) + " " + q(xa + sw - 1, cad + .4); o += tratto(dS, "#5a3c0c", 3.8) + tratto(dS, ORO, 2.6) + tratto(dS, "#fff3c4", .8, "stroke-dasharray='1.5 1.5' opacity='.85'"); }
        for (j = 0; j <= ns; j++) o += nappa(j * sw, cad - .5, .78);
      }
      return o;
    }
    s += blocco(-1.46, 1.46, -.41, .41, 0, ZT, "#f6f2ea", { davanti: function (W, H) { return gonna(W, H, true); }, dietro: function (W, H) { return gonna(W, H, false); }, fianco: function (W, H) { return gonna(W, H, true); } }, 1.8);
    var dam = "";   // il damasco appena visibile sulla tovaglia
    for (i = 0; i < 9; i++) { var dx = -78 + i * 19.5; dam += ell(dx, 12, 5, 2.6, "none", "stroke='#dcd3c4' stroke-width='.45' opacity='.7'") + cer(dx, 12, .9, "#dcd3c4", op(.6)); }
    s += suZ(ZT, dam + rett(-89, 23.6, 178, .6, 0, "#e2d9ca", op(.8)));
    // ---- le cose del buffet ----
    function vassoio(c, rx, ry) { return ell(c[0] + .8, c[1] + 1, rx + .6, ry + .5, "#000", op(.16)) + ell(c[0], c[1], rx, ry, nuova(ARGENTO, c[0] - rx, 0, c[0] + rx, 0, true), bordo(L, .8)) + ell(c[0], c[1] - .4, rx * .8, ry * .76, nuova([[0, "#eef2f5"], [1, "#9aa4ad"]], 0, 0, 1, 1)) + tratto(arcoDav({ x: c[0], y: c[1], rx: rx * .96, ry: ry * .9 }), "#ffffff", .5, op(.8)); }
    function grande(c, k, cont) { return "<g transform='translate(" + f2(c[0]) + " " + f2(c[1]) + ") scale(" + k + ") translate(" + f2(-c[0]) + " " + f2(-c[1]) + ")'>" + cont + "</g>"; }   // un piatto ingrandito attorno al suo centro
    function cupola(a, b) { return grande(P(a, b, ZT), 1.2, cupola0(a, b)); }
    function cupola0(a, b) {   // la cloche d'argento chiusa sul vassoio
      var c = P(a, b, ZT), x = c[0], y = c[1], o = vassoio(c, 13.5, 6.8), R = 10.6, Hd = 13;
      var dD = "M" + q(x - R, y - 1) + " C" + q(x - R, y - Hd * .95) + " " + q(x - R * .45, y - Hd) + " " + q(x, y - Hd) + " C" + q(x + R * .45, y - Hd) + " " + q(x + R, y - Hd * .95) + " " + q(x + R, y - 1) + " A" + f2(R) + "," + f2(R * .48) + " 0 0,1 " + q(x - R, y - 1) + " Z";
      o += pth(dD, nuovaRU([[0, "#ffffff"], [.35, "#e3e8ec"], [.7, "#9aa4ad"], [1, "#59636c"]], x - R * .4, y - Hd * .7, R * 1.6));
      o += dentro(dD, ell(x + R * .2, y + 1.5, R * 1.1, R * .42, "#d9a83a", op(.22)) + ell(x - R * .45, y - Hd * .6, R * .2, Hd * .2, "#ffffff", op(.85)) + tratto("M" + q(x + R * .55, y - Hd * .72) + " Q" + q(x + R * .82, y - Hd * .38) + " " + q(x + R * .8, y - 2.5), "#ffffff", .8, op(.5)) + ell(x - R * .1, y - Hd * .35, R * .9, Hd * .12, "#7a1430", op(.1)));
      o += pth(dD, "none", bordo(L, 1.1)) + tratto("M" + q(x - R, y - 1) + " A" + f2(R) + "," + f2(R * .48) + " 0 0,0 " + q(x + R, y - 1), "#5d6770", 1, op(.8));
      return o + rett(x - .7, y - Hd - 2, 1.4, 2.4, .3, "#9aa4ad") + pallina([x, y - Hd - 2.6], 2, "#d9dee3", .6);
    }
    function arrosto(a, b) { return grande(P(a, b, ZT), 1.22, arrosto0(a, b)); }
    function arrosto0(a, b) {   // il pollo arrosto sul vassoio, con l'insalata, i pomodorini e il limone
      var c = P(a, b, ZT), x = c[0], y = c[1], o = vassoio(c, 14.5, 7.2), j;
      for (j = 0; j < 10; j++) { var an = j / 10 * 6.2832, lx = x + Math.cos(an) * 10, ly = y - .6 + Math.sin(an) * 4.4; o += ell(lx, ly, 3.2, 1.7, j % 2 ? "#5aa83a" : "#86cc5c", "stroke='#2f6e25' stroke-width='.4' transform='rotate(" + Math.round(an * 57 + 90) + " " + f2(lx) + " " + f2(ly) + ")'"); }
      [[-9, 2.6], [8.6, 2.2], [10.6, -2.6]].forEach(function (v) { o += cer(x + v[0], y + v[1] - 1, 1.6, nuovaR([[0, "#ff8a7a"], [.6, "#e03131"], [1, "#8a1010"]], .35, .3, .8), bordo("#5a0a0a", .3)) + cer(x + v[0] - .5, y + v[1] - 1.6, .4, "#ffffff", op(.8)); });
      o += ell(x - 9.6, y - 3, 2.4, 1.3, "#ffe066", bordo("#b08900", .4)) + tratto(linea([x - 11.6, y - 3], [x - 7.6, y - 3]) + " " + linea([x - 9.6, y - 4.2], [x - 9.6, y - 1.8]), "#e8b100", .3);
      var dP = "M" + q(x - 8, y - 2) + " C" + q(x - 8.5, y - 9) + " " + q(x - 2, y - 10.4) + " " + q(x + 2.5, y - 9.6) + " C" + q(x + 7.5, y - 8.8) + " " + q(x + 9, y - 4.6) + " " + q(x + 8, y - 1) + " C" + q(x + 6, y + 2.6) + " " + q(x - 5.5, y + 2.6) + " " + q(x - 8, y - 2) + " Z";
      o += pth(dP, nuovaRU([[0, "#ffd99a"], [.38, "#e3923e"], [.8, "#a8541c"], [1, "#6e3010"]], x - 2.5, y - 7.6, 12.5));
      o += dentro(dP, tratto("M" + q(x - 4, y - 8) + " Q" + q(x, y - 5) + " " + q(x + 5, y - 7.6), "#8a3c10", .7, op(.6)) + ell(x - 3, y - 7.4, 3.4, 1.4, "#fff2c8", op(.55)) + cer(x + 2, y - 3, .5, "#5a2a08", op(.5)) + cer(x - 1, y - 2, .4, "#5a2a08", op(.5)) + cer(x + 4.6, y - 5.2, .4, "#5a2a08", op(.5)));
      o += pth(dP, "none", bordo(L, 1));
      [[-6.4, -1, 1], [6.2, -1.6, -1]].forEach(function (v) {   // le cosce con la carta arricciata
        var lx = x + v[0], ly = y + v[1];
        o += ell(lx, ly, 3.4, 2.4, nuovaR([[0, "#f2b066"], [.6, "#c46a28"], [1, "#7a3a12"]], .35, .3, .8), bordo(L, .7));
        var tx = lx + v[2] * 3.6, ty = ly + 1.6; o += tratto(linea([lx + v[2] * 2, ly + .8], [tx, ty]), "#f3e3c8", 1.2) + cer(tx + v[2] * .6, ty + .3, 1.3, "#ffffff", bordo("#bfb3a0", .3));
      });
      return o;
    }
    function piatti(a, b) { var c = P(a, b, ZT), o = ell(c[0] + .6, c[1] + .8, 7.6, 3.6, "#000", op(.16)), j; for (j = 0; j < 7; j++) o += ell(c[0], c[1] - j * 1.05, 7.2, 3.5, j === 6 ? nuovaR([[0, "#ffffff"], [.75, "#f1ede6"], [1, "#d7d0c4"]], .45, .4, .65) : "#e9e4db", "stroke='#a59c8c' stroke-width='.35'") + (j === 6 ? ell(c[0], c[1] - j * 1.05, 6.2, 3, "none", "stroke='" + ORO + "' stroke-width='.4'") : ""); return grande(c, 1.2, o); }
    function insalata(a, b) {   // la ciotola di vetro con l'insalata mista (le foglie, il radicchio, i pomodorini, il mais)
      var c = P(a, b, ZR), x = c[0], y = c[1], o = ell(x + .8, y + .8, 9, 3.8, "#000", op(.14)), j, rr2 = rnd(77), fo = "";
      o += ell(x, y - .6, 5.5, 2, "#c9e6ee", "stroke='#7d9aa6' stroke-width='.5'") + rett(x - 1.4, y - 3, 2.8, 2.6, .5, "#d8eef4", "stroke='#7d9aa6' stroke-width='.4'");   // il piede di vetro
      var dB = "M" + q(x - 10, y - 6) + " A10,4.6 0 0,0 " + q(x + 10, y - 6) + " L" + q(x + 6.6, y - 2.4) + " A6.6,2.6 0 0,1 " + q(x - 6.6, y - 2.4) + " Z";
      for (j = 0; j < 30; j++) { var fx = x + (rr2() - .5) * 17, fy = y - 6.6 - rr2() * 3.6 + Math.abs(fx - x) * .2; fo += ell(fx, fy, 2.5, 1.3, ["#5aa83a", "#86cc5c", "#3f8530", "#a3d977", "#8a2f5a"][j % 5], "stroke='#2f6e25' stroke-width='.35' transform='rotate(" + Math.round(rr2() * 180) + " " + f2(fx) + " " + f2(fy) + ")'"); }
      for (j = 0; j < 5; j++) fo += cer(x + (rr2() - .5) * 12, y - 8.4 - rr2() * 2, 1.5, nuovaR([[0, "#ff8a7a"], [.6, "#e03131"], [1, "#8a1010"]], .35, .3, .8), bordo("#5a0a0a", .3));
      for (j = 0; j < 9; j++) fo += cer(x + (rr2() - .5) * 13, y - 7.6 - rr2() * 2.6, .6, "#ffd43b", bordo("#b08900", .2));
      o += ell(x, y - 6, 10, 4.6, "#cfe9d6", op(.6)) + fo + pth(dB, lin("vt", [[0, "#ffffff", .55], [.5, "#d8f0f8", .25], [1, "#9fc8d6", .55]], 0, 0, 1, 0), "stroke='#7d9aa6' stroke-width='.6'");
      return o + tratto(arcoDav({ x: x, y: y - 6, rx: 10, ry: 4.6 }), "#ffffff", .8, op(.9)) + tratto("M" + q(x - 8.4, y - 4.6) + " Q" + q(x - 7, y - 2.4) + " " + q(x - 4, y - 2), "#ffffff", .7, op(.8));
    }
    function salmone(a, b) {   // il salmone intero sul vassoio d'argento, col limone a fette e l'aneto
      var c = P(a, b, ZR), x = c[0], y = c[1], o = vassoio(c, 15.5, 6.8), j;
      var dS = "M" + q(x - 12, y - 1.4) + " C" + q(x - 9, y - 4.8) + " " + q(x + 6, y - 5) + " " + q(x + 10, y - 2.6) + " L" + q(x + 13.6, y - 4.6) + " L" + q(x + 12.6, y - .8) + " L" + q(x + 13.6, y + 2.6) + " L" + q(x + 10, y + .6) + " C" + q(x + 6, y + 3) + " " + q(x - 9, y + 2.6) + " " + q(x - 12, y - 1.4) + " Z", righe = "";
      for (j = 0; j < 9; j++) righe += tratto("M" + q(x - 8 + j * 2.2, y - 4.8) + " Q" + q(x - 9 + j * 2.2, y - 1) + " " + q(x - 8 + j * 2.2, y + 2.8), "#ffe3d6", .6, op(.8));
      o += pth(dS, lin("sal", [[0, "#ffb38a"], [.5, "#f08a5d"], [1, "#c8603a"]], 0, 0, 0, 1)) + dentro(dS, righe + ell(x - 2, y - 3, 7, 1.2, "#ffffff", op(.35))) + pth(dS, "none", bordo(L, .8)) + cer(x - 9.4, y - 1.8, .6, L);
      [[-5, 2], [0, 2.8], [5, 2.3]].forEach(function (v) { var lx = x + v[0], ly = y + v[1], k2; o += ell(lx, ly, 2, 1.4, "#fff3a6", bordo("#d4a900", .4)) + ell(lx, ly, 1.4, .95, "#ffe066"); for (k2 = 0; k2 < 6; k2++) { var an = k2 / 6 * 6.2832; o += tratto(linea([lx, ly], [lx + Math.cos(an) * 1.4, ly + Math.sin(an) * .95]), "#fff8d6", .25); } });
      for (j = 0; j < 7; j++) { var dx2 = x - 8.6 + j * 2.9, dy2 = y - 4.8 + (j % 2) * .6; o += tratto("M" + q(dx2, dy2) + " l1.3,-1.3 M" + q(dx2, dy2) + " l-1.1,-1.2 M" + q(dx2, dy2) + " l.2,-1.8", "#3f8530", .5); }
      return o;
    }
    function alzata(a, b, z0, piani, cosa) {   // un'alzata d'argento a più piani: piani = [[altezza, raggio], ...]; cosa(livello, centro, rx, ry) = quello che c'è sopra
      var o = tornito(a, b, [[z0, .07], [z0 + 1.2, .07], [z0 + 2, .03], [z0 + piani[piani.length - 1][0] + 2, .014]], ARGENTO, .9, [1], .4), j;
      piani.forEach(function (pn, j2) {
        var e = anello(a, b, z0 + pn[0], pn[1]);
        o += ell(e.x, e.y + 1, e.rx, e.ry, nuova(ARGENTO, e.x - e.rx, 0, e.x + e.rx, 0, true), bordo(L, .8)) + ell(e.x, e.y, e.rx * .9, e.ry * .82, nuova([[0, "#f4f6f8"], [1, "#a7b0b8"]], 0, 0, 1, 1));
        o += cosa(j2, [e.x, e.y], e.rx, e.ry);
      });
      return o;
    }
    function frutto(x, y, tipo, k) {   // un frutto visto da vicino (x, y = il centro sullo schermo)
      k = k || 1;
      if (tipo === "arancia") return cer(x, y, 2.6 * k, nuovaR([[0, "#ffd08a"], [.5, "#f59f00"], [1, "#b35c00"]], .35, .3, .8), bordo("#7a3e00", .4)) + cer(x - .8 * k, y - .9 * k, .6 * k, "#ffffff", op(.6));
      if (tipo === "mela") return cer(x, y, 2.5 * k, nuovaR([[0, "#ff8a8a"], [.5, "#e03131"], [1, "#7a0f0f"]], .35, .3, .8), bordo("#5a0a0a", .4)) + tratto(linea([x, y - 2.2 * k], [x + .5 * k, y - 3.4 * k]), "#5a3a1a", .5) + cer(x - .8 * k, y - .9 * k, .55 * k, "#ffffff", op(.6));
      if (tipo === "verde") return cer(x, y, 2.4 * k, nuovaR([[0, "#d8f5a2"], [.5, "#8bc34a"], [1, "#4a7a1a"]], .35, .3, .8), bordo("#2f5010", .4)) + cer(x - .8 * k, y - .9 * k, .5 * k, "#ffffff", op(.6));
      if (tipo === "fragola") return pth("M" + q(x - 1.6 * k, y - 1 * k) + " Q" + q(x, y - 2 * k) + " " + q(x + 1.6 * k, y - 1 * k) + " Q" + q(x + 1.2 * k, y + 1.6 * k) + " " + q(x, y + 2.2 * k) + " Q" + q(x - 1.2 * k, y + 1.6 * k) + " " + q(x - 1.6 * k, y - 1 * k) + " Z", nuovaR([[0, "#ff7a7a"], [.6, "#e3192f"], [1, "#8a0a14"]], .35, .3, .8), bordo("#5a0610", .3)) + pth("M" + q(x - 1.4 * k, y - 1.2 * k) + " L" + q(x, y - 2.2 * k) + " L" + q(x + 1.4 * k, y - 1.2 * k) + " L" + q(x, y - 1.5 * k) + " Z", "#3f8530") + cer(x - .5 * k, y, .2 * k, "#ffe066") + cer(x + .5 * k, y + .6 * k, .2 * k, "#ffe066");
      if (tipo === "uva") { var o = "", g; for (g = 0; g < 9; g++) { var gx = x + ((g % 3) - 1) * 1.5 * k + (g > 5 ? .7 * k : 0), gy = y + Math.floor(g / 3) * 1.4 * k; if (g === 8) continue; o += cer(gx, gy, 1 * k, nuovaR([[0, "#c08ad8"], [.55, "#6a2c91"], [1, "#2e0a45"]], .35, .3, .8), bordo("#1e0630", .25)); } return o + tratto(linea([x, y - 1 * k], [x + .6 * k, y - 2.4 * k]), "#5a3a1a", .5); }
      return "";
    }
    function fruttiera() {   // l'alzata della frutta a due piani, con l'ananas in cima
      return alzata(-1.08, -.25, ZR, [[5, .23], [20, .15]], function (lv, c, rx, ry) {
        var o = "", tipi = lv ? ["uva", "fragola", "arancia", "verde", "fragola", "uva"] : ["arancia", "mela", "uva", "verde", "arancia", "mela", "uva", "fragola", "mela"], n = tipi.length, j, ff = [];
        for (j = 0; j < n; j++) { var an = j / n * 6.2832 + .3, fx = c[0] + Math.cos(an) * rx * .62, fy = c[1] - 2.4 + Math.sin(an) * ry * .62; ff.push([fy, frutto(fx, fy, tipi[j], lv ? 1 : 1.18)]); }
        ff.sort(function (p1, p2) { return p1[0] - p2[0]; }).forEach(function (v) { o += v[1]; });
        if (lv) {   // l'ananas
          var ax = c[0], ay = c[1] - 7.5, dA = dEll(ax, ay, 3.6, 5.2), sq = "";
          for (j = -4; j <= 4; j++) sq += tratto(linea([ax + j * 1.6 - 4, ay - 6], [ax + j * 1.6 + 4, ay + 6]), "#7a4a10", .45, op(.6)) + tratto(linea([ax + j * 1.6 + 4, ay - 6], [ax + j * 1.6 - 4, ay + 6]), "#7a4a10", .45, op(.6));
          o += pth(dA, nuovaR([[0, "#ffe08a"], [.55, "#e0a12e"], [1, "#8a5a10"]], .35, .3, .8)) + dentro(dA, sq) + pth(dA, "none", bordo(L, .7));
          for (j = -3; j <= 3; j++) o += pth("M" + q(ax - .9 + j * .3, ay - 4.6) + " Q" + q(ax + j * 1.6, ay - 9 - (3 - Math.abs(j)) * 1.4) + " " + q(ax + j * 2.3, ay - 10.5 - (3 - Math.abs(j)) * 1.6) + " Q" + q(ax + j * 1.2 + .6, ay - 8) + " " + q(ax + .9 + j * .3, ay - 4.6) + " Z", j % 2 ? "#3f8530" : "#5aa83a", bordo("#1d4515", .35));
        }
        return o;
      });
    }
    function torta() { return grande(P(1.02, -.25, ZR), 1.15, torta0()); }
    function torta0() {   // la torta a due piani alle fragole, sull'alzatina d'argento
      var c = P(1.02, -.25, ZR), x = c[0], o = alzata(1.02, -.25, ZR, [[4, .17]], function () { return ""; }), y0 = c[1] - 4.5;
      [[0, 11, 8.6, "#fff7ee"], [8.6, 7.4, 7, "#fdf1f4"]].forEach(function (t) {   // i due piani: la panna, la colata rosa
        var yb = y0 - t[0], R = t[1], h = t[2], yt = yb - h, dT = "M" + q(x - R, yt) + " L" + q(x - R, yb) + " A" + f2(R) + "," + f2(R * .45) + " 0 0,0 " + q(x + R, yb) + " L" + q(x + R, yt) + " Z";
        o += pth(dT, lin("tt", [[0, "#ffffff"], [.6, t[3]], [1, "#d9cfc4"]], 0, 0, 1, 0), bordo(L, .8));
        var col = "", j; for (j = 0; j <= 8; j++) { var px = x - R + j * R / 4; col += "M" + q(px - 1.2, yt) + " L" + q(px - 1.2, yt + 2 + (j % 2) * 1.6) + " A1.2,1.2 0 0,0 " + q(px + 1.2, yt + 2 + (j % 2) * 1.6) + " L" + q(px + 1.2, yt) + " Z "; }
        o += dentro(dT, pth(col, "#f783ac") + rett(x - R, yt, 2 * R, 1.4, 0, "#f783ac"));
        o += ell(x, yt, R, R * .45, nuovaR([[0, "#ffffff"], [.8, "#fff0f5"], [1, "#f3c7d6"]], .45, .4, .6), bordo(L, .7));
      });
      var yt2 = y0 - 15.6;
      [[-3.2, .4], [3, .6], [0, -1.4], [.2, 1.6]].forEach(function (v) { o += frutto(x + v[0], yt2 + v[1] - 1, "fragola", .9); });
      return o;
    }
    function dolci() {   // l'alzata dei dolci: i macaron colorati e i pasticcini
      var MAC = ["#f7a1c4", "#9be3c0", "#fff08a", "#c9b3f5", "#8a5a3a", "#ffb47a"];
      return alzata(1.2, .1, ZT, [[4, .2], [13, .145], [21.5, .1]], function (lv, c, rx, ry) {
        var o = "", n = [7, 5, 3][lv], j, ff = [];
        for (j = 0; j < n; j++) { var an = j / n * 6.2832 + lv, mx = c[0] + Math.cos(an) * rx * .58, my = c[1] - 1.4 + Math.sin(an) * ry * .58, mc = MAC[(j + lv * 2) % 6]; ff.push([my, ell(mx, my + .7, 2.6, 1.3, scuro(mc, .2), bordo(L, .3)) + rett(mx - 2.4, my - .2, 4.8, .9, .3, "#fff6e8") + ell(mx, my - .6, 2.6, 1.3, nuovaR([[0, chiaro(mc, .4)], [1, mc]], .4, .35, .7), bordo(L, .3))]); }
        ff.sort(function (p1, p2) { return p1[0] - p2[0]; }).forEach(function (v) { o += v[1]; });
        return o;
      });
    }
    var dietroR = blocco(-1.38, 1.38, -.38, -.13, ZT, ZR, "#f8f4ec", { davanti: function (W, H) { return pizzo(W, H); }, dietro: function (W, H) { return pizzo(W, H); }, fianco: function (W, H) { return pizzo(W, H); } }, 1.3);
    var gradino = [[-1.08, fruttiera], [-.38, function () { return insalata(-.38, -.25); }], [.3, function () { return salmone(.3, -.25); }], [1.02, torta]].map(function (v) { return [vicino(v[0], -.25), v[1]()]; });
    gradino.sort(function (x, y) { return x[0] - y[0]; });
    var sulGradino = gradino.map(function (v) { return v[1]; }).join("");
    var davanti = [[-1.3, .2, piatti], [-.62, .12, cupola], [0, .1, arrosto], [.6, .12, cupola]].map(function (v) { return [vicino(v[0], v[1]), v[2](v[0], v[1])]; });
    davanti.push([vicino(1.2, .1), dolci()]);
    davanti.sort(function (x, y) { return x[0] - y[0]; });
    var cose = davanti.map(function (v) { return v[1]; }).join("");
    return s + (G > 0 ? dietroR + sulGradino + cose : cose + dietroR + sulGradino);
  });

  // =========================================================
  //  ACQUARIO CILINDRICO (fino al soffitto): la base d'oro con le modanature e le lucine azzurre, il cilindro di vetro
  //  pieno d'acqua azzurra coi raggi di luce, la sabbia coi sassi, i coralli rossi e arancio, l'anemone, le alghe che salgono,
  //  la colonna di bollicine e i pesci tropicali (pagliaccio, chirurgo blu, pesce giallo, imperatore, gramma, castagnole);
  //  in cima la corona d'oro che arriva al soffitto. Di notte l'acqua s'illumina
  // =========================================================
  def("acquario_cilindro", { nome: "Acquario cilindrico", fp: [1, 1], box: [-36, -218, 36, 24], luce: [0, 0, 110, 130, "#5fd0ff"] }, function () {
    var R = .33, Z0 = 24, Z1 = 176, s = ombraPianta(-.42, .42, -.42, .42, 1, .06), r = rnd(1910), i, k, RX = R * 70.71;
    s += tornito(0, 0, [[0, .42], [3.5, .42], [5, .395], [6.5, .39], [8, .405], [15.5, .405], [17, .385], [19, .37], [21.5, .37], [Z0, .35]], DORATO, 1.6, [1, 3, 5, 7], .9);   // la base d'oro
    var eB = anello(0, 0, 11.7, .405);
    for (k = 0; k <= 12; k++) { var tb = Math.PI - Math.PI * k / 12, bx = eB.x + Math.cos(tb) * eB.rx * .98, by = eB.y + Math.sin(tb) * eB.ry * .98; s += ell(bx, by, 1.8, 2.6, nuovaR([[0, "#fff6cf"], [.6, "#e2b444"], [1, "#7a5614"]], .35, .3, .8), bordo("#5a3c0c", .35)); }   // gli ovoli sulla fascia
    // l'acqua: il cilindro di vetro, e dentro tutto ritagliato
    var dV = dTornito(0, 0, [[Z0, R], [Z1, R]]), acqua = "";
    acqua += rett(-RX - 2, -Z1 - 20, 2 * RX + 4, Z1 - Z0 + 40, 0, lin("aq", NOTTE ? [[0, "#2fb4e0"], [.3, "#8ef0ff"], [.55, "#5fd6f2"], [.85, "#1f96cc"], [1, "#0f5f8c"]] : [[0, "#1f86b0"], [.3, "#5ccbe8"], [.55, "#3cb0d8"], [.85, "#18709e"], [1, "#0c4670"]], -RX, 0, RX, 0, true));
    acqua += rett(-RX - 2, -Z1 - 20, 2 * RX + 4, Z1 - Z0 + 40, 0, lin("aqv", [[0, "#ffffff", NOTTE ? .35 : .22], [.4, "#ffffff", 0], [1, "#003050", .3]], 0, -Z1 - 4, 0, -Z0, true));
    // in fondo: le alghe e i pesciolini lontani (velati dall'acqua)
    var lont = "";
    [[-12, 128, "#2f8a4a"], [10, 112, "#3a9a52"], [2, 98, "#2b7a44"]].forEach(function (al) { var pp = [], z; for (z = Z0 + 6; z <= al[1]; z += 8) pp.push([al[0] + Math.sin(z * .09 + al[0]) * 2.6, -z]); lont += tratto(liscio(pp), al[2], 3.4, op(.7)); });
    [[-6, 150, .08, 1], [8, 84, .07, -1], [-11, 66, .07, 1]].forEach(function (f, j) { lont += "<g transform='translate(" + f[0] + " " + (-f[1]) + ") scale(" + f2(f[2] * f[3]) + " " + f2(f[2]) + ")' opacity='.75'>" + PESCE[["castagnola", "giallo", "castagnola"][j]]() + "</g>"; });
    acqua += lont + rett(-RX - 2, -Z1 - 20, 2 * RX + 4, Z1 - Z0 + 40, 0, NOTTE ? "#5fd6f2" : "#2a9cc8", op(.35));
    // i raggi di luce dall'alto
    for (k = 0; k < 4; k++) { var rx0 = -RX + 4 + k * 12; acqua += poly([[rx0, -Z1 - 4], [rx0 + 5, -Z1 - 4], [rx0 - 9, -Z0 - 10], [rx0 - 16, -Z0 - 10]], "#ffffff", op(NOTTE ? .13 : .09)); }
    // la sabbia: il fondo visto dall'alto e il davanti, coi sassolini
    var zS = Z0 + 9, eS = anello(0, 0, zS, R), e0 = anello(0, 0, Z0, R);
    acqua += pth("M" + q(eS.x - eS.rx - 2, eS.y) + " A" + f2(eS.rx + 2) + "," + f2(eS.ry + 1) + " 0 0,0 " + q(eS.x + eS.rx + 2, eS.y) + " L" + q(e0.x + e0.rx + 2, e0.y + 2) + " A" + f2(e0.rx + 2) + "," + f2(e0.ry + 2) + " 0 0,1 " + q(e0.x - e0.rx - 2, e0.y + 2) + " Z", lin("sb", [[0, "#e9cf96"], [1, "#b8925a"]], 0, 0, 0, 1));
    acqua += ell(eS.x, eS.y, eS.rx + 1, eS.ry + .6, nuovaR([[0, "#fbecc4"], [.7, "#e6cc92"], [1, "#c9a66a"]], .45, .45, .6));
    for (k = 0; k < 40; k++) { var sa = r() * 6.2832, sr = Math.sqrt(r()), sx = Math.cos(sa) * sr * eS.rx, sy = eS.y + Math.sin(sa) * sr * eS.ry; acqua += cer(sx, sy, .3 + r() * .5, ["#a88a5a", "#f6e2b4", "#8a7a6a", "#d9b98a"][k % 4], op(.8)); }
    for (k = 0; k < 18; k++) { var px = -RX + r() * 2 * RX, py = e0.y - 1 - r() * 8; acqua += cer(px, py + Math.abs(px) * .05, .35 + r() * .45, ["#a88a5a", "#f6e2b4", "#8a7a6a"][k % 3], op(.75)); }
    // i sassi, i coralli, l'anemone, le alghe davanti
    acqua += pth("M-15,-35 C-17,-41 -12,-45 -7,-43 C-3,-45 1,-41 -1,-35 Z", nuovaR([[0, "#a9a39a"], [.6, "#6f6a62"], [1, "#3f3b36"]], .35, .3, .8), bordo(L, .8)) + pth("M6,-33 C5,-38 9,-41 13,-39 C17,-40 19,-36 17,-33 Z", nuovaR([[0, "#b8ad9c"], [.6, "#7a7064"], [1, "#4a4038"]], .35, .3, .8), bordo(L, .8));
    function ramo(x0, y0, ang, len, w, n, col) {   // un corallo a rami (ricorsivo, sempre uguale)
      if (n <= 0 || len < 2) return "";
      var x1 = x0 + Math.cos(ang) * len, y1 = y0 + Math.sin(ang) * len, o = tratto(linea([x0, y0], [x1, y1]), L, w + 1.2) + tratto(linea([x0, y0], [x1, y1]), col, w) + tratto(linea([x0 - .3, y0], [x1 - .3, y1]), chiaro(col, .35), w * .3, op(.8));
      o += ramo(x1, y1, ang - .45, len * .7, w * .75, n - 1, col) + ramo(x1, y1, ang + .38, len * .66, w * .72, n - 1, col);
      return n === 1 ? o + cer(x1, y1, w * .6, chiaro(col, .3)) : o;
    }
    acqua += ramo(-9, -40, -Math.PI / 2 - .15, 8, 2.2, 4, "#e8493a") + ramo(11, -37, -Math.PI / 2 + .25, 6.5, 1.8, 3, "#ff8c2a");
    var an = "";   // l'anemone rosa col pesce pagliaccio vicino
    for (k = 0; k < 9; k++) { var ta = -Math.PI + .2 + k * .34; an += tratto("M" + q(2 + Math.cos(ta) * 1.5, -36) + " Q" + q(2 + Math.cos(ta) * 5, -40 - Math.abs(Math.sin(ta)) * 3) + " " + q(2 + Math.cos(ta) * 6.5 + Math.sin(k) * 1.2, -44 - Math.abs(Math.sin(ta)) * 2.5), k % 2 ? "#ff8fc7" : "#f06595", 1.3) + cer(2 + Math.cos(ta) * 6.5 + Math.sin(k) * 1.2, -44 - Math.abs(Math.sin(ta)) * 2.5, .8, "#ffd6ea"); }
    acqua += ell(2, -35.5, 4, 1.6, "#c2255c", bordo(L, .6)) + an;
    [[-15, 120, "#43a047", 1], [14, 104, "#5cb85c", -1], [-4, 82, "#2e7d32", 1]].forEach(function (al, j) {   // le alghe che salgono ondeggiando
      var pp = [], z; for (z = Z0 + 8; z <= al[1]; z += 6) pp.push([al[0] + Math.sin(z * .11 + j * 2) * 3.2 * al[3], -z]);
      var d = liscio(pp); acqua += tratto(d, L, 4.6) + tratto(d, al[2], 3.2) + tratto(d, chiaro(al[2], .4), .8, "transform='translate(-.6 0)' opacity='.8'");
      for (z = 2; z < pp.length - 1; z += 2) { var fp = pp[z], sg = z % 4 ? 1 : -1; acqua += ell(fp[0] + sg * 2.6, fp[1] - 1, 2.6, 1, al[2], "stroke='" + L + "' stroke-width='.5' transform='rotate(" + (sg * -30) + " " + f2(fp[0] + sg * 2.6) + " " + f2(fp[1] - 1) + ")'"); }
    });
    // la colonna di bollicine dalla pietra porosa
    acqua += ell(-5, -37, 2.4, 1.2, "#5a5650", bordo(L, .5)) + bolle(-5, -40, -Z1 + 6, 1913, 13, 1.3) + bolle(9, -60, -Z1 + 10, 1917, 8, 1);
    // i pesci tropicali (davanti)
    [[-7, 156, "giallo", .15, 1], [8, 136, "chirurgo", .16, -1], [-5, 116, "imperatore", .155, 1], [9, 92, "gramma", .12, -1], [-9, 72, "pagliaccio", .13, 1], [7, 56, "pagliaccio", .11, -1], [-2, 166, "castagnola", .1, -1], [11, 160, "castagnola", .09, 1]].forEach(function (f) {
      acqua += "<g transform='translate(" + f[0] + " " + (-f[1]) + ") scale(" + f2(f[3] * f[4] * 1.2) + " " + f2(f[3] * 1.2) + ")'>" + PESCE[f[2]]() + "</g>";
    });
    // la superficie dell'acqua in cima, che brilla
    var eT = anello(0, 0, Z1 - 5, R);
    acqua += ell(eT.x, eT.y, eT.rx, eT.ry, "#ffffff", op(NOTTE ? .28 : .2)) + tratto("M" + q(-RX, eT.y) + " Q" + q(-RX * .5, eT.y + eT.ry * 1.4) + " " + q(0, eT.y + eT.ry) + " T" + q(RX, eT.y), "#ffffff", .9, op(.7));
    if (NOTTE) acqua += ell(0, -100, RX * 1.1, 70, nuovaR([[0, "#eaffff", .3], [1, "#eaffff", 0]], .5, .5, .5));
    s += pth(dV, "#1a6f96") + dentro(dV, acqua);
    // il vetro: i riflessi dritti e il bordo
    s += rett(-RX * .66, -Z1 + 2, 5.4, Z1 - Z0 - 4, 2.7, "#ffffff", op(.16)) + rett(-RX * .58, -Z1 + 3, 1.3, Z1 - Z0 - 6, .6, "#ffffff", op(.6)) + rett(-RX * .3, -Z1 + 3, .7, Z1 - Z0 - 6, .3, "#ffffff", op(.35)) + rett(RX * .8, -Z1 + 3, 1, Z1 - Z0 - 6, .5, "#ffffff", op(.3));
    s += pth(dV, "none", bordo(L, 1.6));
    // le lucine azzurre sotto il vetro
    for (k = 0; k <= 10; k++) { var tl = Math.PI - Math.PI * k / 10, lx = e0.x + Math.cos(tl) * e0.rx * .99, ly = e0.y + Math.sin(tl) * e0.ry * .99 + 1.6; s += NOTTE ? cer(lx, ly, 2.4, "#7fe3ff", op(.4)) + cer(lx, ly, 1, "#ffffff") : cer(lx, ly, .9, "#bfefff", bordo("#2a6f8a", .3)); }
    // la corona d'oro fino al soffitto, con la frangia a festoni
    var eC = anello(0, 0, Z1, .36), fr = "";
    for (k = 0; k < 12; k++) { var t0 = Math.PI - Math.PI * k / 12, t1 = Math.PI - Math.PI * (k + 1) / 12, pa = [eC.x + Math.cos(t0) * eC.rx, eC.y + Math.sin(t0) * eC.ry], pb = [eC.x + Math.cos(t1) * eC.rx, eC.y + Math.sin(t1) * eC.ry]; fr += pth("M" + q(pa) + " Q" + q((pa[0] + pb[0]) / 2, (pa[1] + pb[1]) / 2 + 5) + " " + q(pb) + " Z", nuova(DORATO, 0, 0, 1, 1), bordo(L, .5)); }
    s += tornito(0, 0, [[Z1 - 1, .35], [Z1 + 2, .37], [Z1 + 4, .4], [Z1 + 7, .392], [Z1 + 9, .372], [Z1 + 13, .378], [Z1 + 16, .41], [Z1 + 20, .425], [200, .425]], DORATO, 1.6, [2, 4, 6], .9) + fr;
    var eTop = anello(0, 0, 200, .425);
    s += ell(eTop.x, eTop.y, eTop.rx, eTop.ry, nuovaR([[0, "#fff6d0"], [.7, "#e9c25a"], [1, "#a97720"]], .4, .35, .7), bordo(L, 1.2));
    [.33, .22].forEach(function (rr3) { var e3 = anello(0, 0, 200, rr3); s += ell(e3.x, e3.y, e3.rx, e3.ry, "none", "stroke='#7a5614' stroke-width='.8' opacity='.7'") + tratto(arcoDav({ x: e3.x, y: e3.y + .6, rx: e3.rx, ry: e3.ry }), "#fff6cf", .5, op(.8)); });   // le cornici tonde sul soffitto
    var eL = anello(0, 0, 200, .1);   // il lampadario a cupola che illumina l'acqua
    return s + ell(eL.x, eL.y + 1.6, eL.rx, eL.ry + 1.4, NOTTE ? nuovaR([[0, "#ffffff"], [.5, "#c8f4ff"], [1, "#5fd0ff"]], .45, .4, .6) : nuovaR([[0, "#ffffff"], [.6, "#dfe9ee"], [1, "#9fb4bf"]], .4, .35, .7), bordo(L, .8)) + ell(eL.x - 1.6, eL.y + .6, 1.6, .8, "#ffffff", op(.85));
  });

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
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      if (d.luce) { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      p = "cloc" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!opz.notte;
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      var testa = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 ", defs = DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "";
      if (d.tipo === "parete") { var w = 62 * d.largo; return testa + w + " 200' width='" + w + "' height='200'>" + defs + c + "</svg>"; }
      var m = misure(d);
      return testa + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + defs + "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

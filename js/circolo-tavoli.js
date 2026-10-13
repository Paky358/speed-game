/* =========================================================
   SPeeD GAME — IL CIRCOLO: TAVOLI DA GIOCO, SEDIE, BILIARDO E FRECCETTE (visti dall'alto, come i mobili della casa)
   Il circolo ricreativo di paese, anni '60-'80 ma tenuto bene: noce e faggio a cera, sedie impagliate,
   il panno verde, le carte napoletane e il bicchiere di rosso. Caldo e familiare, non di lusso come il casinò.
   Una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   - Tavoli (piano a 46-47): da carte (panno verde, carte napoletane, vino), quadrato con la tovaglia a quadretti,
     rotondo col centrino all'uncinetto, lungo da 6, tavolino per due; i tavolini del tris (lavagna e gesso),
     del Forza 4 e della battaglia navale. In info "posti" = le mattonelle dove ci si siede (relative all'angolo
     dell'impronta nel disegno davanti, fuori dall'impronta). Le sedie sono un mobile a parte: "sedia_circolo".
   - La sedia impagliata da osteria, il biliardo all'italiana coi cinque birilli, la lampada verde appesa ("sospeso":
     in alto, sotto si cammina) e due cose da muro ("parete", 62 × 200): le freccette con la lavagnetta, le stecche.
   Il davanti guarda in basso a sinistra; con { dietro: true } lo stesso oggetto girato; con { notte: true } la lampada accesa.
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
  function q2(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f2(x) + "," + f2(y); }
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
  function cerD(x, y, r) { return "M" + q(x - r, y) + " A" + f2(r) + "," + f2(r) + " 0 1,0 " + q(x + r, y) + " A" + f2(r) + "," + f2(r) + " 0 1,0 " + q(x - r, y) + " Z"; }
  function rettD(x, y, w, h, r) {
    if (!r) return "M" + q(x, y) + " H" + f1(x + w) + " V" + f1(y + h) + " H" + f1(x) + " Z";
    return "M" + q(x + r, y) + " H" + f1(x + w - r) + " Q" + q(x + w, y) + " " + q(x + w, y + r) + " V" + f1(y + h - r) + " Q" + q(x + w, y + h) + " " + q(x + w - r, y + h) + " H" + f1(x + r) + " Q" + q(x, y + h) + " " + q(x, y + h - r) + " V" + f1(y + r) + " Q" + q(x, y) + " " + q(x + r, y) + " Z";
  }
  function gruppo(t, c) { return "<g transform='" + t + "'>" + c + "</g>"; }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  function tono(c, t) { return t >= 0 ? chiaro(c, Math.min(.85, t)) : scuro(c, Math.min(.85, -t)); }
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
  function perVicino(x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf == null ? ra : rf, rr: rr == null ? (rf == null ? ra : rf) : rr, e: e || 2 }; }
  function giro(F, z, k, n) {
    var ka = k == null ? 1 : (k.length ? k[0] : k), kb = k == null ? 1 : (k.length ? k[1] : k), out = [], i; n = n || 60;
    for (i = 0; i < n; i++) {
      var t = i / n * 6.2832, c = Math.cos(t), s = Math.sin(t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / F.e), y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / F.e);
      out.push(P(F.ca + x * F.ra * ka, F.cb + y * (y > 0 ? F.rf : F.rr) * kb, z));
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
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), L, .7, "opacity='.7'");   // gli spigoli di dentro, sottili
    if (H > 4) s += tratto("M" + q(D[0] + 1, D[1] + .9) + " L" + q(C[0] - .5, C[1] + .8), "#ffffff", .8, "opacity='.5'");   // il filo di luce sullo spigolo davanti
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, lw || 1.6));
  }
  function stesa(O, X, Y, W, H, c) {   // un disegno piatto W × H steso su un piano qualsiasi: O = il suo angolo in alto a sinistra, X = la fine della riga di sopra, Y = la fine del lato di sinistra
    var m = [(X[0] - O[0]) / W, (X[1] - O[1]) / W, (Y[0] - O[0]) / H, (Y[1] - O[1]) / H, O[0], O[1]];
    return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>";
  }
  // un disegno piatto steso su un piano dritto: in pianta a z fisso (X = a·61, Y = b·61), su un fianco a b fisso o ad a fisso (X lungo il fianco, Y = −z)
  function mat(m, c) { return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>"; }
  function suZ(z, c) { return mat([.8197 * G, .4098 * G, -.8197 * G, .4098 * G, 0, -z], c); }
  function suB(b, c) { return mat([.8197 * G, .4098 * G, 0, 1, -50 * G * b, 25 * G * b], c); }
  function suA(a, c) { return mat([-.8197 * G, .4098 * G, 0, 1, 50 * G * a, 25 * G * a], c); }

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
  var CERA = { lucido: .26, esp: 7 };   // il legno a cera: lucido piano

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
  function pallina(c, r, col, k) {   // una pallina lucida: c = il centro sullo schermo
    return cer(c[0], c[1], r, nuovaR([[0, chiaro(col, .75)], [.32, col], [1, scuro(col, .5)]], .35, .3, .8), bordo(L, k || .6)) + ell(c[0] - r * .34, c[1] - r * .4, r * .34, r * .22, "#ffffff", op(.9));
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
  function ombraMuro(d, dx, dy, k) {   // l'ombra sul muro: la stessa forma spostata in basso a destra, in due velature
    k = k == null ? 1 : k;
    return pth(d, "#000", op(.07 * k) + " transform='translate(" + f2(dx * 1.7) + " " + f2(dy * 1.7) + ")'") + pth(d, "#000", op(.14 * k) + " transform='translate(" + f2(dx) + " " + f2(dy) + ")'");
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
  function pOvale(ca, cb, ra, rb, e, n) {   // un ovale (e = 2 ellisse, di più = più squadrato)
    var o = [], i; n = n || 96;
    for (i = 0; i < n; i++) {
      var t = i / n * 2 * Math.PI, c = Math.cos(t), s = Math.sin(t);
      o.push([ca + (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / e) * ra, cb + (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / e) * rb]);
    }
    return o;
  }
  function rettRuotato(a, b, w, h, ang) {   // il rettangolo w × h (mattonelle) centrato in (a, b), girato di ang gradi
    var c = Math.cos(ang * Math.PI / 180), s = Math.sin(ang * Math.PI / 180);
    return [[w / 2, h / 2], [-w / 2, h / 2], [-w / 2, -h / 2], [w / 2, -h / 2]].map(function (v) { return [a + v[0] * c - v[1] * s, b + v[0] * s + v[1] * c]; });
  }
  function aSchermo(pp, z) { return pp.map(function (x) { return P(x[0], x[1], z); }); }
  function lungoCorsa(vv, passo, fn) {   // dei punti lungo una fila di vertici (in pianta), ogni "passo" mattonelle
    var o = "", acc = passo / 2, i;
    for (i = 0; i < vv.length - 1; i++) {
      var A = vv[i], B = vv[i + 1], l = Math.sqrt((B[0] - A[0]) * (B[0] - A[0]) + (B[1] - A[1]) * (B[1] - A[1]));
      while (acc <= l) { var t = acc / l; o += fn(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t); acc += passo; }
      acc -= l;
    }
    return o;
  }
  // il fianco dritto di una forma (da z0 a z1): si vedono solo i pezzi girati verso chi guarda, ognuno col colore della sua luce.
  // o = { righe: [[z, colore, spessore, opacità]], extra(fila), cima, lw, lati }
  function fianco(pp, z0, z1, col, m, o) {
    o = o || {};
    var n = pp.length, s = "", vis = [], i, k;
    function nv(i) { var nn = nrm(pp[i], pp[(i + 1) % n]); return [G * nn[0], G * nn[1], 0]; }
    for (i = 0; i < n; i++) vis.push(dot(nv(i), VISTA) > .003);
    var file = [], parti = -1, cur = null;
    for (i = 0; i < n; i++) if (!vis[i]) { parti = i; break; }
    if (parti < 0) { cur = []; for (i = 0; i < n; i++) cur.push(i); file.push(cur); }
    else for (k = 1; k <= n; k++) { i = (parti + k) % n; if (vis[i]) { if (!cur) { cur = [i]; file.push(cur); } else cur.push(i); } else cur = null; }
    file.forEach(function (fl) {
      fl.forEach(function (i) {
        var A = pp[i], B = pp[(i + 1) % n], c = tinta(col, nv(i), m);
        s += poly([P(A[0], A[1], z1), P(B[0], B[1], z1), P(B[0], B[1], z0), P(A[0], A[1], z0)], c, "stroke='" + c + "' stroke-width='.6' stroke-linejoin='round'");
      });
      var vv = fl.map(function (i) { return pp[i]; }).concat([pp[(fl[fl.length - 1] + 1) % n]]);
      if (o.extra) s += o.extra(vv);
      (o.righe || []).forEach(function (r) { s += tratto(aperto(vv.map(function (x) { return P(x[0], x[1], r[0]); })), r[1], r[2], r[3] ? op(r[3]) : ""); });
      var lw = o.lw || 1.5;
      s += tratto(aperto(vv.map(function (x) { return P(x[0], x[1], z0); })), L, lw);
      if (o.cima) s += tratto(aperto(vv.map(function (x) { return P(x[0], x[1], z1); })), L, o.cima);
      if (o.lati !== false) [vv[0], vv[vv.length - 1]].forEach(function (x) { s += tratto(linea(P(x[0], x[1], z0), P(x[0], x[1], z1)), L, lw * .8); });
    });
    return s;
  }
  function anelloP(est, int, z, fill, x) {   // un anello piatto tra due contorni (in pianta), all'altezza z
    return pth(chiuso(aSchermo(est, z)) + " " + chiuso(aSchermo(int, z).reverse()), fill, "fill-rule='evenodd'" + attr(x));
  }
  // il panno teso, col disegno (in pianta) e la pozza di luce della lampada
  function panno(pp, z, col, disegno, luce) {
    var sp = aSchermo(pp, z), d = chiuso(sp), b = limiti(sp), w = b[2] - b[0], h = b[3] - b[1];
    var s = pth(d, nuova([[0, chiaro(col, .14)], [.5, col], [1, scuro(col, .24)]], b[0], b[1], b[2], b[3], true));
    var c = (disegno ? suZ(z, disegno) : "") +
      ell(b[0] + w * .46, b[1] + h * .45, w * .36, h * .36, nuovaR([[0, "#fff3cf", luce || .17], [.55, "#fff3cf", (luce || .17) * .35], [1, "#fff3cf", 0]], .5, .5, .5)) +   // la luce dall'alto
      tratto(d, "#000000", 6, op(.12)) + tratto(d, "#000000", 2.4, op(.16));   // l'ombra del bordo sul panno
    return s + dentro(d, c);
  }

  // ---------- i legni del circolo ----------
  var NOCE = "#8c5634", NOCE_SC = "#6c3c20", CASTAGNO = "#9a6036", FAGGIO = "#d4a066", SEDIA = "#7a4527", PAGLIA = "#d6ad5c";
  var VERDE = "#1f7d48", VERDE_BIL = "#21844b";   // i panni
  var OTTONE = [[0, "#fff6cf"], [.3, "#f3d27a"], [.62, "#c99a36"], [1, "#7a5614"]];
  function legno(c) { return [[0, chiaro(c, .42)], [.3, chiaro(c, .14)], [.65, scuro(c, .26)], [1, scuro(c, .58)]]; }   // il legno tondo, girato verso la luce
  // le venature (in pianta, lungo X), col seme fisso; qualche nodo
  function venePiano(x0, x1, y0, y1, col, seme, o) {
    o = o || {};
    var r = rnd(seme), s = "", y = y0 + 1, passo = o.passo || 2.4;
    while (y < y1 - .5) {
      var d = "M" + q(x0, y), x = x0, yy = y;
      while (x < x1) { var nx = Math.min(x1, x + 9 + r() * 12), ny = y + (r() - .5) * 1.6; d += " Q" + q((x + nx) / 2, (yy + ny) / 2 + (r() - .5) * 2) + " " + q(nx, ny); x = nx; yy = ny; }
      s += "<path d='" + d + "' fill='none' stroke='" + scuro(col, .3 + r() * .2) + "' stroke-width='" + f2(.25 + r() * .55) + "' opacity='" + f2(.2 + r() * .26) + "'/>";
      y += passo * (.55 + r() * .9);
    }
    var nn = o.nodi == null ? 1 : o.nodi, i;
    for (i = 0; i < nn; i++) {
      var cx = x0 + (x1 - x0) * (.2 + r() * .6), cy = y0 + (y1 - y0) * (.2 + r() * .6);
      s += ell(cx, cy, 3.4, 1.4, "none", "stroke='" + scuro(col, .35) + "' stroke-width='.4' opacity='.45'") + ell(cx, cy, 1.7, .7, scuro(col, .4), op(.5));
    }
    return s;
  }
  function assi(bp, col, seme, n) {   // il piano fatto di n assi lungo X, con le fughe scure
    var x0 = bp[0] * 61, x1 = bp[2] * 61, y0 = bp[1] * 61, y1 = bp[3] * 61, h = (y1 - y0) / n, s = "", r = rnd(seme + 3), i;
    for (i = 0; i < n; i++) {
      var ya = y0 + i * h;
      s += rett(x0, ya, x1 - x0, h, 0, tono(col, (r() - .5) * .14), op(.55)) + venePiano(x0, x1, ya, ya + h, col, seme + i * 17, { nodi: r() < .6 ? 1 : 0, passo: 2.1 });
      if (i) s += "<path d='M" + q(x0, ya) + " H" + f1(x1) + "' stroke='" + scuro(col, .58) + "' stroke-width='.85' opacity='.75'/><path d='M" + q(x0, ya + .8) + " H" + f1(x1) + "' stroke='" + chiaro(col, .35) + "' stroke-width='.4' opacity='.4'/>";
    }
    [-1, 1].forEach(function (sg) { for (i = 0; i < n; i++) s += cer(sg * (x1 - 7), y0 + (i + .5) * h, .55, scuro(col, .55), op(.7)); });   // i chiodini delle traverse sotto
    return s;
  }
  // una gamba tornita da tavolo (il piedino, la pancia a vaso, il collarino), da terra a z1, nel punto (a, b); k = quanto è grossa
  function gambaTavolo(a, b, z1, col, k) {
    k = k || 1; var h = z1 / 44, c = P(a, b, 0);
    var pr = [[0, .03], [1.4, .034], [2.6, .029], [5 * h, .024], [9 * h, .026], [13 * h, .034], [16.5 * h, .041], [19.5 * h, .038], [22.5 * h, .029], [25 * h, .025], [26.6 * h, .034], [28 * h, .034], [29.4 * h, .028], [31 * h, .031], [z1, .031]].map(function (x) { return [x[0], x[1] * k]; });
    return ell(c[0] + 1.2, c[1] + .5, 4.2 * k, 2 * k, "#000", op(.24)) + tornito(a, b, pr, legno(col), 1.1, [2, 10, 12], .55);
  }
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
  function fascia(pp, z0, z1, col) {   // la fascia sotto il piano, col filo in basso
    return fianco(pp, z0, z1, col, CERA, { lw: 1.2, righe: [[z0 + 1.2, scuro(col, .35), .5, .5], [z0 + 1.6, chiaro(col, .3), .45, .5], [z1 - 1, scuro(col, .3), .45, .45]] });
  }
  // le 4 gambe in (±ga, ±gb) e la fascia tra loro (da za a zs): tornite (grosse k) o squadrate (mezzo lato rs)
  function gambeEFascia(ga, gb, za, zs, col, k, rs) {
    var gg = [[-ga, -gb], [ga, -gb], [ga, gb], [-ga, gb]].sort(perVicino);
    function g(x) { return rs ? gambaQuadra(x[0], x[1], rs * .72, rs, 0, zs, col) : gambaTavolo(x[0], x[1], zs, col, k); }
    var e = rs ? rs - .006 : .02;
    return g(gg[0]) + fascia(pRett(-ga - e, ga + e, -gb - e, gb + e, 0), za, zs, col) + gg.slice(1).map(g).join("");
  }
  // il piano di un tavolo (forma in pianta pp, da z0 a z1): il bordo coi lati verso chi guarda, sopra il legno a cera con le venature
  function ripiano(pp, z0, z1, col, o) {
    o = o || {};
    var s = fianco(pp, z0, z1, col, CERA, { lw: 1.3, righe: [[z1 - .7, chiaro(col, .4), .55, .55], [z0 + .6, scuro(col, .4), .5, .5]] });
    var sp = aSchermo(pp, z1), d = chiuso(sp), b = limiti(sp), bp = limiti(pp);
    s += pth(d, nuova([[0, chiaro(col, .26)], [.55, chiaro(col, .1)], [1, scuro(col, .08)]], b[0], b[1], b[2], b[3], true));
    var c = "";
    if (o.vene !== false) c += suZ(z1, o.assi ? assi(bp, col, o.seme || 7, o.assi) : venePiano(bp[0] * 61, bp[2] * 61, bp[1] * 61, bp[3] * 61, col, o.seme || 7, o));
    if (o.disegno) c += suZ(z1, o.disegno);
    c += ell(b[0] + (b[2] - b[0]) * .38, b[1] + (b[3] - b[1]) * .36, (b[2] - b[0]) * .3, (b[3] - b[1]) * .25, nuovaR([[0, "#fff8e8", .22], [1, "#fff8e8", 0]], .5, .5, .5));   // il lucido della cera
    return s + dentro(d, c) + tratto(d, L, o.lw || 1.5);
  }

  // ---------- le carte napoletane (in pianta: X = a·61) ----------
  var CW = .12 * 61, CH = .2 * 61;   // la carta, stretta e alta come le napoletane
  function simbolo(seme, x, y, k) {   // denari, coppe, bastoni, spade: centrati in (x, y), grandi k (1 = alti circa 2,4)
    var t = "translate(" + f2(x) + " " + f2(y) + ") scale(" + f2(k) + ")";
    if (seme === "denari") return "<g transform='" + t + "'><circle r='1.12' fill='#f2c33a' stroke='#a8481f' stroke-width='.3'/><circle r='.66' fill='none' stroke='#d9480f' stroke-width='.22'/><circle r='.3' fill='#c92a2a'/><circle cx='-.4' cy='-.45' r='.22' fill='#fff6cf'/></g>";
    if (seme === "coppe") return "<g transform='" + t + "'><path d='M-.95,-1.1 H.95 C.95,-.15 .5,.3 .2,.38 V.78 H.62 C.7,.9 .7,1.05 .62,1.12 H-.62 C-.7,1.05 -.7,.9 -.62,.78 H-.2 V.38 C-.5,.3 -.95,-.15 -.95,-1.1 Z' fill='#f0b429' stroke='#9c4a1a' stroke-width='.2'/><path d='M-.9,-.68 H.9' stroke='#c92a2a' stroke-width='.36'/><path d='M-.55,-1 C-.6,-.4 -.4,-.05 -.15,.15' fill='none' stroke='#fff3c4' stroke-width='.18'/></g>";
    if (seme === "bastoni") return "<g transform='" + t + " rotate(-22)'><path d='M-.34,1.2 C-.4,.25 -.5,-.55 -.62,-1 C-.4,-1.32 .38,-1.32 .58,-1 C.46,-.55 .38,.25 .3,1.2 Z' fill='#6aa84f' stroke='#2f5a1c' stroke-width='.2'/><path d='M-.52,-.5 H.48 M-.42,.25 H.36' stroke='#c92a2a' stroke-width='.24'/><circle cx='-.18' cy='-.85' r='.14' fill='#2f5a1c'/></g>";
    return "<g transform='" + t + "'><path d='M-.1,-1.28 C.6,-.72 .5,.15 .14,.55 L-.12,.55 C.16,.1 .22,-.6 -.1,-1.28 Z' fill='#4c7fd6' stroke='#1f3f7a' stroke-width='.18'/><path d='M-.62,.6 H.58' stroke='#e8a917' stroke-width='.36' stroke-linecap='round'/><path d='M0,.62 V1.18' stroke='#8a5a2b' stroke-width='.3' stroke-linecap='round'/></g>";
  }
  var DISP = {   // dove stanno i semi sulla carta (in frazioni della carta) e quanto sono grandi
    1: [[0, 0, 2.2]], 2: [[0, -.25, 1.25], [0, .25, 1.25]], 3: [[0, -.3, 1.1], [0, 0, 1.1], [0, .3, 1.1]],
    4: [[-.2, -.25, 1.05], [.2, -.25, 1.05], [-.2, .25, 1.05], [.2, .25, 1.05]],
    5: [[-.2, -.27, 1], [.2, -.27, 1], [0, 0, 1], [-.2, .27, 1], [.2, .27, 1]],
    7: [[-.2, -.32, .9], [.2, -.32, .9], [0, -.16, .9], [-.2, 0, .9], [.2, 0, .9], [-.2, .32, .9], [.2, .32, .9]]
  };
  function dorso(w, h) {   // il dorso rosso col reticolo d'oro e il medaglione
    var m = motivo("dr", 1.5, 1.5, "<rect width='1.5' height='1.5' fill='#b3342b'/><path d='M.75,.12 L1.38,.75 .75,1.38 .12,.75Z' fill='none' stroke='#e6a94a' stroke-width='.2'/>");
    return rett(-w / 2 + .55, -h / 2 + .55, w - 1.1, h - 1.1, .4, m) + rett(-w / 2 + .55, -h / 2 + .55, w - 1.1, h - 1.1, .4, "none", "stroke='#7e1d16' stroke-width='.3'") +
      ell(0, 0, w * .2, h * .13, "#f3d58a", "stroke='#7e1d16' stroke-width='.25'") + ell(0, 0, w * .08, h * .055, "#c0392b");
  }
  function cartaN(a, b, ang, seme, n, coperta, senzaOmbra) {   // una carta stesa (in pianta), scoperta col seme o coperta col dorso
    var w = CW, h = CH, o = "<g transform='translate(" + f2(a * 61) + " " + f2(b * 61) + ") rotate(" + f2(ang) + ")'>";
    if (!senzaOmbra) o += rett(-w / 2 + .45, -h / 2 + .65, w, h, .8, "#000000", op(.3));
    o += rett(-w / 2, -h / 2, w, h, .8, coperta ? "#f6f1e4" : "#fcf8ec", "stroke='#8f8573' stroke-width='.3'");
    if (coperta) o += dorso(w, h);
    else (DISP[n] || DISP[1]).forEach(function (d) { o += simbolo(seme, d[0] * w, d[1] * h, d[2]); });
    return o + "</g>";
  }
  function mazzo(a, b, z, ang, h) {   // un mazzo di carte coperte, girato di ang gradi, alto h
    var pp = rettRuotato(a, b, CW / 61, CH / 61, ang), top = aSchermo(pp, z + h);
    var s = pth(chiuso(aSchermo(pp, z).map(function (x) { return [x[0] + 1.3, x[1] + .7]; })), "#000", op(.26));   // l'ombra
    s += fianco(pp, z, z + h, "#efe7d3", null, { lw: .5, righe: h > 1.6 ? [[z + h * .35, "#c9bc9c", .25, .9], [z + h * .7, "#c9bc9c", .25, .9]] : [] });
    s += suZ(z + h, cartaN(a, b, ang, null, 0, true, true));
    return s + pth(chiuso(top), "none", bordo(L, .45));
  }
  function prese(a, b, z, ang, h, seme, n) {   // il mucchietto delle carte prese, coperto, con la "scopa" girata di traverso in mezzo
    return mazzo(a, b, z, ang, h * .5) + suZ(z + h * .5 + .05, cartaN(a + .01, b, ang + 90, seme, n, false, true)) + mazzo(a, b, z + h * .5 + .1, ang + 4, h * .5);
  }
  function foglietto(a, b, ang) {   // il foglietto dei punti: due colonne di stanghette a matita, e la matita gialla
    var w = .16 * 61, h = .21 * 61, o = "<g transform='translate(" + f2(a * 61) + " " + f2(b * 61) + ") rotate(" + f2(ang) + ")'>", i;
    o += rett(-w / 2 + .5, -h / 2 + .7, w, h, .3, "#000", op(.28)) + rett(-w / 2, -h / 2, w, h, .3, "#fdfbf3", "stroke='#b8b09d' stroke-width='.3'");
    for (i = 1; i < 7; i++) o += "<path d='M" + q(-w / 2 + .6, -h / 2 + i * h / 7) + " H" + f1(w / 2 - .6) + "' stroke='#a5c8e8' stroke-width='.2'/>";   // le righe del quaderno
    o += "<path d='M0," + f1(-h / 2 + 1) + " V" + f1(h / 2 - 1) + " M" + f1(-w / 2 + .8) + "," + f1(-h / 2 + 2.3) + " H" + f1(w / 2 - .8) + "' stroke='#555' stroke-width='.3'/>";
    function cinque(x, y, quante) { var g = "", k; for (k = 0; k < Math.min(4, quante); k++) g += "M" + q(x + k * .55, y) + " l.1,1.7 "; return g + (quante > 4 ? "M" + q(x - .3, y + 1.35) + " L" + q(x + 2, y + .3) + " " : ""); }
    var d = cinque(-w / 2 + 1.1, -h / 2 + 3.2, 5) + cinque(-w / 2 + 1.1, -h / 2 + 5.8, 5) + cinque(-w / 2 + 1.1, -h / 2 + 8.4, 3) + cinque(1, -h / 2 + 3.2, 5) + cinque(1, -h / 2 + 5.8, 4);
    o += "<path d='" + d + "' fill='none' stroke='#4a4a4a' stroke-width='.28' stroke-linecap='round'/>";
    o += "<g transform='translate(" + f2(w * .16) + " " + f2(h * .24) + ") rotate(-35)'>" + rett(-4.6, -.55, 8.2, 1.1, .2, "#f5c518", "stroke='#8a6a0a' stroke-width='.2'") + rett(3.6, -.55, 1, 1.1, 0, "#c0c4c8") + rett(4.6, -.55, 1.1, 1.1, .3, "#f08ca0") +
      "<path d='M-4.6,-.55 L-6.2,0 -4.6,.55 Z' fill='#f1d9b5' stroke='#8a6a0a' stroke-width='.15'/><path d='M-5.7,-.18 L-6.2,0 -5.7,.18 Z' fill='#333'/><path d='M-4.4,-.2 H3.4' stroke='#fff2a8' stroke-width='.25'/></g>";   // la matita
    return o + "</g>";
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
  // la caraffa del vino: la pancia tonda, il collo lungo, il rosso fino a metà; sul panno l'ombra e il riflesso rosso
  function caraffa(a, b, z) {
    var c = P(a, b, z), s = "";
    s += ell(c[0] + 4, c[1] + 1.6, 9.5, 4.6, "#000", op(.22)) + ell(c[0] + 6, c[1] + 2.4, 6, 2.6, "#b0202f", op(.2));
    var vino = [[z + .9, .068], [z + 3, .088], [z + 6, .094], [z + 9, .091], [z + 10, .087]];
    s += tornito(a, b, vino, [[0, "#a3263a"], [.45, "#7a0f22"], [1, "#35040d"]], 0);
    s += tornito(a, b, [[z, .066], [z + .8, .075], [z + 3, .093], [z + 6, .1], [z + 9, .097], [z + 12, .082], [z + 14.5, .056], [z + 16.5, .042], [z + 19.5, .038], [z + 21.2, .043], [z + 22, .048]], VETRO, .9, [10]);
    var w = anello(a, b, z + 10, .087), t = anello(a, b, z + 22, .048);
    s += ell(w.x, w.y, w.rx, w.ry, nuovaR([[0, "#c94a5c"], [1, "#6e0c1d"]], .4, .35, .8)) + ell(w.x - w.rx * .3, w.y - w.ry * .25, w.rx * .32, w.ry * .3, "#ffffff", op(.3));
    s += ell(t.x, t.y, t.rx, t.ry, "#2a1a1a", op(.35)) + ell(t.x, t.y, t.rx, t.ry, "none", "stroke='#ffffff' stroke-width='.9' opacity='.85'") + ell(t.x, t.y, t.rx, t.ry, "none", bordo(L, .5));
    s += tratto("M" + q(c[0] - 4.4, c[1] - 14) + " Q" + q(c[0] - 5.6, c[1] - 9) + " " + q(c[0] - 4, c[1] - 4), "#ffffff", 1.2, op(.8)) + tratto(linea([c[0] - 1.6, c[1] - 20.5], [c[0] - 1.8, c[1] - 16]), "#ffffff", .8, op(.75));   // i riflessi sul vetro
    return s;
  }

  // il cassettino nella fascia (su un fianco piatto: X lungo il fianco, Y = −z): il frontalino incassato e il pomolo d'ottone
  function cassettino(X0, X1, Y0, Y1, xLuce) {
    var xl = xLuce > 0 ? X0 : X1, xs = xLuce > 0 ? X1 : X0, cx = (X0 + X1) / 2, cy = (Y0 + Y1) / 2;
    return rett(X0, Y0, X1 - X0, Y1 - Y0, .5, "#000", op(.14)) +
      "<path d='M" + q(xl, Y1) + " V" + f1(Y0) + " H" + f1(xs) + "' fill='none' stroke='#000' stroke-width='.7' opacity='.4'/><path d='M" + q(xs, Y0) + " V" + f1(Y1) + " H" + f1(xl) + "' fill='none' stroke='#fff3df' stroke-width='.6' opacity='.35'/>" +
      cer(cx + .5, cy + .7, 1.5, "#000", op(.3)) + cer(cx, cy, 1.5, lin("pm", OTTONE, 0, 0, 1, 1), bordo(L, .4)) + cer(cx - .45, cy - .5, .5, "#fffbe6", op(.9));
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  var POSTI4 = [[-1, 0], [2, 1], [1, -1], [0, 2]], POSTI2 = [[-1, 0], [1, 0]];

  // =========================================================
  //  TAVOLO DA CARTE: il quadrato di noce scuro sulle gambe tornite, il panno verde incassato nel bordo di legno;
  //  sul panno la partita a scopa: le quattro carte in tavola (c'è il settebello), il mazzo, le prese davanti a due
  //  giocatori con la scopa girata di traverso, le tre carte coperte di chi è andato al bancone, il foglietto dei punti,
  //  due bicchieri di rosso e la caraffa
  // =========================================================
  def("tavolo_carte", { nome: "Tavolo da carte", fp: [2, 2], box: [-100, -98, 108, 54], dietro: true, piano: 47, posti: POSTI4 }, function () {
    var col = NOCE_SC, H = .9, HP = .73, ZT = 47, ZS = 44.4, ZA = 34.8, GA = .78, l = [];
    var O = pRett(-H, H, -H, H, .05, 4), Pn = pRett(-HP, HP, -HP, HP, .035, 3);
    var s = ombraForma(pRett(-H, H, -H, H, 0), 1) + gambeEFascia(GA, GA, ZA, ZS, col, 1.55), BA = GA + .02;
    s += suB(G * BA, cassettino(-15, 15, -ZS + 1.5, -ZA - 1.8, G)) + suA(G * BA, cassettino(-15, 15, -ZS + 1.5, -ZA - 1.8, -G));   // i cassettini delle carte nella fascia
    s += ripiano(O, ZS, ZT, col, { seme: 21 });
    var tap = "";
    [[-.3, .03, -8, "denari", 7], [-.1, -.04, 5, "coppe", 3], [.1, .05, -3, "bastoni", 5], [.3, -.02, 9, "spade", 2]].forEach(function (c) { tap += cartaN(c[0], c[1], c[2], c[3], c[4]); });   // le carte in tavola
    [[.5, .42, 28], [.56, .45, 40], [.62, .47, 52]].forEach(function (c) { tap += cartaN(c[0], c[1], c[2], null, 0, true); });   // le tre carte coperte di chi si è alzato
    tap += foglietto(-.5, -.44, 18);
    s += panno(Pn, ZT - .25, VERDE, tap);
    s += tratto(chiuso(aSchermo(Pn, ZT)), "#24130a", 1.1, op(.85)) + tratto(chiuso(aSchermo(allarga(Pn, .014), ZT)), chiaro(col, .5), .55, op(.55));   // l'orlo del legno attorno al panno
    l.push([vicino(.6, -.26), mazzo(.6, -.26, ZT, 22, 3.4)]);
    l.push([vicino(-.48, .5), prese(-.48, .5, ZT, 8, 1.6, "denari", 1)]);
    l.push([vicino(.47, -.54), prese(.47, -.54, ZT, -10, 2.2, "coppe", 7)]);
    l.push([vicino(-.32, -.62), caraffa(-.32, -.62, ZT)]);
    l.push([vicino(.24, .62), bicchiere(.24, .62, ZT, .62)]);
    l.push([vicino(-.62, .26), bicchiere(-.62, .26, ZT, .4)]);
    return s + ordina(l);
  });

  // =========================================================
  //  TAVOLO QUADRATO (generico): il tavolo di noce sotto la tovaglia a quadretti verdi e bianchi stirata,
  //  coi lati che cadono a onde e gli angoli a punta; sotto si vedono le gambe tornite. Sopra niente: ci si appoggia quello che serve
  // =========================================================
  function quadretti(Q) {   // il motivo della tovaglia (si ripete ogni due quadretti): le strisce verdi che si incrociano
    return motivo("qd", 2 * Q, 2 * Q, "<rect width='" + f2(2 * Q) + "' height='" + f2(2 * Q) + "' fill='#fbfaf3'/><rect width='" + f2(Q) + "' height='" + f2(2 * Q) + "' fill='#2c9a58' opacity='.52'/><rect width='" + f2(2 * Q) + "' height='" + f2(Q) + "' fill='#2c9a58' opacity='.52'/>" +
      "<path d='M0," + f2(Q * .5) + " H" + f2(2 * Q) + " M0," + f2(Q * 1.5) + " H" + f2(2 * Q) + " M" + f2(Q * .5) + ",0 V" + f2(2 * Q) + " M" + f2(Q * 1.5) + ",0 V" + f2(2 * Q) + "' stroke='#ffffff' stroke-width='.18' opacity='.35'/>");
  }
  function tovaglia(HC, ZC, cad) {
    var Q = .085 * 61, pat = quadretti(Q), Lf = 2 * HC * 61, X0 = HC * 61, s = "", i;
    function caduta(x) { var e = Math.max(0, 1 - x / 15), f = Math.max(0, 1 - (Lf - x) / 15); return cad + 1.2 * Math.sin(x / Lf * Math.PI * 6) + 9.5 * (e * e + f * f); }
    function lato(o, dir, girato, buio) {   // un lato che cade, disegnato piatto (x lungo il bordo, y in giù) e piegato sul suo piano
      var d = "M0,0 H" + f1(Lf), giu = "M0,0", n = 48;
      for (i = n; i >= 0; i--) { var x = Lf * i / n; d += " L" + q(x, caduta(x)); }
      for (i = 0; i <= n; i++) { var x2 = Lf * i / n; giu += " L" + q(x2, caduta(x2)); }
      giu += " L" + q(Lf, 0);
      var tr = girato ? "translate(" + f2(X0) + " " + f2(-X0) + ") scale(-1 1)" : "translate(" + f2(X0) + " " + f2(-X0) + ")";
      var c = gruppo(tr, rett(-X0 - 3, X0 - 3, Lf + 6, cad + 26, 0, pat));
      var st = [], k;
      for (k = 0; k <= 12; k++) st.push([k / 12, k % 2 ? "#000000" : "#ffffff", k % 2 ? .12 : .16]);   // le pieghe morbide
      c += rett(0, 0, Lf, cad + 22, 0, lin("pg", st, 0, 0, Lf, 0, true));
      c += rett(0, 0, Lf, 3, 0, lin("bt", [[0, "#000", .16], [1, "#000", 0]], 0, 0, 0, 1)) + (buio ? rett(0, 0, Lf, cad + 22, 0, "#000", op(buio)) : "");
      var orlo = "";
      for (i = 0; i <= n; i++) { var x3 = Lf * i / n; orlo += (i ? " L" : "M") + q(x3, caduta(x3) - 1.6); }
      c += tratto(orlo, "#ffffff", .4, "stroke-dasharray='1 .9' opacity='.6'");   // la cucitura dell'orlo
      return faccia(o, dir, dentro(d, c) + tratto(giu, L, 1.2) + tratto("M0,.4 H" + f1(Lf), "#ffffff", .7, op(.55)));
    }
    s += lato(P(-HC, HC, ZC), 1, false, 0) + lato(P(HC, HC, ZC), -1, true, .16);
    // il piano: i quadretti, le due pieghe della stiratura, la luce
    var top = pRett(-HC, HC, -HC, HC, .012, 2), sp = aSchermo(top, ZC), d = chiuso(sp), b = limiti(sp);
    var c = suZ(ZC, rett(-X0 - 3, -X0 - 3, Lf + 6, Lf + 6, 0, pat) +
      "<path d='M" + q(-X0, 0) + " H" + f1(X0) + " M" + q(0, -X0) + " V" + f1(X0) + "' stroke='#000' stroke-width='.9' opacity='.08'/><path d='M" + q(-X0, .7) + " H" + f1(X0) + " M" + q(.7, -X0) + " V" + f1(X0) + "' stroke='#ffffff' stroke-width='.7' opacity='.35'/>");
    c += ell(b[0] + (b[2] - b[0]) * .4, b[1] + (b[3] - b[1]) * .38, (b[2] - b[0]) * .34, (b[3] - b[1]) * .3, nuovaR([[0, "#ffffff", .2], [1, "#ffffff", 0]], .5, .5, .5));
    c += pth(d, nuova([[0, "#000", 0], [.6, "#000", 0], [1, "#000", .1]], b[0], b[1], b[2], b[3], true));
    s += pth(d, "#fbfaf3") + dentro(d, c);
    var A =P(-HC, -HC, ZC), B = P(HC, -HC, ZC), Cc = P(HC, HC, ZC), D = P(-HC, HC, ZC);
    return s + tratto("M" + q(D) + " L" + q(A) + " L" + q(B), L, 1.4) + tratto("M" + q(D[0] + 1, D[1] + .4) + " L" + q(Cc[0], Cc[1] - .3) + " L" + q(B[0] - 1, B[1] + .4), "#ffffff", .9, op(.7));
  }
  def("tavolo_quadrato", { nome: "Tavolo quadrato", fp: [2, 2], box: [-100, -96, 108, 54], piano: 47, posti: POSTI4 }, function () {
    var col = NOCE, HC = .9, ZC = 47, ZS = 44.6, ZA = 37.5, GA = .74;
    return ombraForma(pRett(-HC, HC, -HC, HC, 0), 1) + gambeEFascia(GA, GA, ZA, ZS, col, 1.45) + tovaglia(HC, ZC, 12.5);
  });

  // =========================================================
  //  TAVOLO ROTONDO (generico): il piano tondo di noce a cera sulle quattro gambe tornite e la fascia tonda,
  //  in mezzo il centrino bianco all'uncinetto (il bordo a smerli, i giri di buchetti, i ventagli, il fiore)
  // =========================================================
  function centrino(R) {   // in pianta, centrato; i buchi lasciano vedere il legno
    var o = "", n = 22, i, j, BUCO = "#4a2a16", FILO = "#e6dcc5", d = "";
    for (i = 0; i < n; i++) {
      var t0 = i / n * 2 * Math.PI, t1 = (i + 1) / n * 2 * Math.PI, tm = (t0 + t1) / 2;
      if (!i) d += "M" + q(R * Math.cos(t0), R * Math.sin(t0));
      d += " Q" + q((R + 4.6) * Math.cos(tm), (R + 4.6) * Math.sin(tm)) + " " + q(R * Math.cos(t1), R * Math.sin(t1));
    }
    d += " Z";
    o += pth(d, "#000", op(.2) + " transform='translate(.7 .9)'") + pth(d, "#fbf8ef", "stroke='#cfc6ae' stroke-width='.35'");
    for (i = 0; i < n; i++) { var tp = (i + .5) / n * 2 * Math.PI; o += cer((R + 1.4) * Math.cos(tp), (R + 1.4) * Math.sin(tp), .75, BUCO, op(.55)); }   // i buchetti negli smerli
    [[R - 2.6, 44, .62, 0], [R * .84, 30, .95, 0], [R * .75, 30, .95, .5]].forEach(function (g) {   // i giri di buchetti e la rete
      for (j = 0; j < g[1]; j++) { var tt = (j + g[3]) / g[1] * 2 * Math.PI; o += cer(g[0] * Math.cos(tt), g[0] * Math.sin(tt), g[2], BUCO, op(.5)); }
    });
    [R * .9, R * .68, R * .4].forEach(function (rr) { o += cer(0, 0, rr, "none", "stroke='" + FILO + "' stroke-width='.5'"); });
    for (i = 0; i < 8; i++) {   // gli otto ventagli
      var ta = i / 8 * 2 * Math.PI, ca = Math.cos(ta), sa = Math.sin(ta), vv = "";
      for (j = -3; j <= 3; j++) { var tj = ta + j * .075; vv += "M" + q(R * .42 * ca, R * .42 * sa) + " L" + q(R * .66 * Math.cos(tj), R * .66 * Math.sin(tj)) + " "; }
      o += "<path d='" + vv + "' stroke='" + FILO + "' stroke-width='.45' fill='none'/>";
      var tb = ta + Math.PI / 8; o += cer(R * .55 * Math.cos(tb), R * .55 * Math.sin(tb), 1.7, BUCO, op(.5)) + cer(R * .55 * Math.cos(tb), R * .55 * Math.sin(tb), 1.7, "none", "stroke='" + FILO + "' stroke-width='.4'");
    }
    for (i = 0; i < 8; i++) { var tf = i / 8 * 360; o += "<ellipse cx='" + f2(R * .2) + "' cy='0' rx='" + f2(R * .14) + "' ry='" + f2(R * .065) + "' transform='rotate(" + tf + ")' fill='#fffdf6' stroke='" + FILO + "' stroke-width='.45'/>"; }   // il fiore in mezzo
    o += cer(0, 0, R * .08, "#fffdf6", "stroke='" + FILO + "' stroke-width='.45'") + cer(0, 0, R * .035, BUCO, op(.45));
    return o + cer(0, 0, R + 2.4, nuovaR([[0, "#ffffff", 0], [.7, "#ffffff", 0], [1, "#8a7a5a", .12]], .5, .5, .5));
  }
  def("tavolo_rotondo", { nome: "Tavolo rotondo", fp: [2, 2], box: [-74, -84, 82, 41], piano: 47, posti: POSTI4 }, function () {
    var col = NOCE, R = .94, ZT = 47, ZS = 44.4, ZA = 37.4, O = pOvale(0, 0, R, R, 2, 120), s = ombraForma(O, 1);
    var gg = [[-.52, -.52], [.52, -.52], [.52, .52], [-.52, .52]].sort(perVicino);
    s += gambaTavolo(gg[0][0], gg[0][1], ZS, col, 1.5) + fascia(pOvale(0, 0, .77, .77, 2, 80), ZA, ZS, col) + gg.slice(1).map(function (g) { return gambaTavolo(g[0], g[1], ZS, col, 1.5); }).join("");
    return s + ripiano(O, ZS, ZT, col, { seme: 33, disegno: centrino(.52 * 61) });
  });

  // =========================================================
  //  TAVOLO LUNGO da sei (generico): le assi di castagno coi chiodini, le gambe squadrate e robuste,
  //  il traverso basso ad H come i tavoloni delle feste
  // =========================================================
  def("tavolo_lungo", { nome: "Tavolo lungo", fp: [3, 1], box: [-104, -97, 112, 56], piano: 47, posti: [[0, -1], [1, -1], [2, -1], [0, 1], [1, 1], [2, 1]] }, function () {
    var col = CASTAGNO, HA = 1.44, HB = .43, ZT = 47, ZS = 44, ZA = 37, GA = 1.28, GB = .31, RS = .053;
    var O = pRett(-HA, HA, -HB, HB, .03, 3), s = ombraForma(pRett(-HA, HA, -HB, HB, 0), 1);
    function gamba(a, b) { return gambaQuadra(a, b, RS * .78, RS, 0, ZS, col); }
    s += gamba(-GA, -GB) + gamba(GA, -GB);
    s += blocco(-GA - .022, -GA + .022, -GB, GB, 7.5, 10.5, col, null, 1) + blocco(-GA, GA, -.022, .022, 9, 12, col, null, 1) + blocco(GA - .022, GA + .022, -GB, GB, 7.5, 10.5, col, null, 1);
    s += fascia(pRett(-GA - RS + .006, GA + RS - .006, -GB - RS + .006, GB + RS - .006, 0), ZA, ZS, col);
    s += gamba(-GA, GB) + gamba(GA, GB);
    return s + ripiano(O, ZS, ZT, col, { seme: 41, assi: 4 });
  });

  // =========================================================
  //  TAVOLINO PER DUE (generico, per i giochi da tavolo): faggio chiaro a cera, il filetto scuro intarsiato
  //  tutto intorno, quattro gambe squadrate che si stringono in basso. Sopra niente
  // =========================================================
  function filetto(h, col) { var X = h * 61; return rett(-X, -X, 2 * X, 2 * X, 1.2, "none", "stroke='" + scuro(col, .5) + "' stroke-width='1.1'") + rett(-X + 1, -X + 1, 2 * X - 2, 2 * X - 2, .8, "none", "stroke='" + chiaro(col, .4) + "' stroke-width='.35' opacity='.8'"); }
  function tavolinoBase(col, o) {
    o = o || {};
    var H = .41, ZT = 46, ZS = 43.5, ZA = 37.2, GA = .34, RS = .038;
    var O = pRett(-H, H, -H, H, .03, 3), s = ombraForma(pRett(-H, H, -H, H, 0), 1) + gambeEFascia(GA, GA, ZA, ZS, col, 1, RS);
    return s + ripiano(O, ZS, ZT, col, { seme: o.seme || 51, nodi: 0, disegno: (o.filetto === false ? "" : filetto(H - .05, col)) + (o.disegno || "") });
  }
  def("tavolino_due", { nome: "Tavolino per due", fp: [1, 1], box: [-51, -70, 59, 30], piano: 46, posti: POSTI2 }, function () {
    return tavolinoBase(FAGGIO, { seme: 52 });
  });

  // =========================================================
  //  TAVOLINO DEL TRIS: nel piano di faggio è incassata una lavagna; col gesso la griglia, le X e le O,
  //  la riga gialla di chi ha vinto, gli aloni delle partite cancellate; sul bordo il gessetto e il cancellino
  // =========================================================
  function gesso(d, w, col) { col = col || "#f3f1e7"; return "<path d='" + d + "' fill='none' stroke='" + col + "' stroke-width='" + f2(w * 2.3) + "' stroke-linecap='round' opacity='.2'/><path d='" + d + "' fill='none' stroke='" + col + "' stroke-width='" + f2(w) + "' stroke-linecap='round' stroke-dasharray='3.5 .35 2.2 .3' opacity='.93'/>"; }
  function lavagnaTris(S) {   // in pianta, lato 2S
    var o = "", r = rnd(909), c = 2 * S / 3, i, j;
    o += rett(-S - 1.3, -S - 1.3, 2 * S + 2.6, 2 * S + 2.6, 1, "#3a2818") + rett(-S, -S, 2 * S, 2 * S, .6, lin("lv", [[0, "#4b5852"], [1, "#27302d"]], 0, 0, 1, 1));
    for (i = 0; i < 6; i++) o += "<ellipse cx='" + f2(-S + 3 + r() * (2 * S - 6)) + "' cy='" + f2(-S + 3 + r() * (2 * S - 6)) + "' rx='" + f2(3 + r() * 4) + "' ry='" + f2(1.6 + r() * 2) + "' fill='#e9efe9' opacity='" + f2(.05 + r() * .05) + "'/>";   // gli aloni del cancellino
    [-c / 2, c / 2].forEach(function (x) {
      o += gesso("M" + q(x + (r() - .5), -S + 2.2) + " Q" + q(x + (r() - .5) * 1.6, 0) + " " + q(x + (r() - .5), S - 2.2), .8);
      o += gesso("M" + q(-S + 2.2, x + (r() - .5)) + " Q" + q(0, x + (r() - .5) * 1.6) + " " + q(S - 2.2, x + (r() - .5)), .8);
    });
    var celle = [["X", "O", "X"], ["", "X", "O"], ["O", "", "X"]], k = c * .27;
    for (j = 0; j < 3; j++) for (i = 0; i < 3; i++) {
      var x = (i - 1) * c + (r() - .5), y = (j - 1) * c + (r() - .5), v = celle[j][i];
      if (v === "X") o += gesso("M" + q(x - k, y - k) + " L" + q(x + k, y + k) + " M" + q(x + k * .95, y - k) + " L" + q(x - k * .9, y + k * 1.05), .85);
      else if (v === "O") o += gesso("M" + q(x + k * .2, y - k) + " C" + q(x + k * 1.25, y - k * .9) + " " + q(x + k * 1.2, y + k) + " " + q(x, y + k * 1.02) + " C" + q(x - k * 1.25, y + k * .95) + " " + q(x - k * 1.1, y - k * 1.05) + " " + q(x + k * .4, y - k * .92), .85);
    }
    return o + gesso("M" + q(-c * 1.4, -c * 1.36) + " L" + q(c * 1.38, c * 1.42), 1, "#ffe066");   // la riga di chi ha vinto
  }
  function gessetto(a0, b0, a1, b1, z) {   // il gessetto bianco steso
    var A = P(a0, b0, z + 1), B = P(a1, b1, z + 1), sh = "M" + q(A[0] + 1, A[1] + 1) + " L" + q(B[0] + 1, B[1] + 1);
    return tratto(sh, "#000", 2.4, op(.25)) + tratto(linea(A, B), L, 3) + tratto(linea(A, B), "#efece2", 2.2) + tratto(linea([A[0], A[1] - .5], [B[0], B[1] - .5]), "#ffffff", .7) + ell(B[0], B[1], 1.1, 1, "#e2ddd0", bordo(L, .4));
  }
  function cancellino(a, b, z) {   // il cancellino: il feltro grigio sotto, il dorso di legno sopra
    return ombraPianta(a - .06, a + .06, b - .035, b + .035, 1, .02) + blocco(a - .06, a + .06, b - .035, b + .035, z, z + 1.1, "#8e949a", null, .7) + blocco(a - .058, a + .058, b - .033, b + .033, z + 1.1, z + 3.3, "#c99058", { sopra: function (A, B, C, D, W, H) { return stesa(A, B, D, W, H, rett(W * .15, H * .3, W * .7, H * .4, H * .2, scuro("#c99058", .2), op(.5))); } }, .8);
  }
  def("tavolo_tris", { nome: "Tavolino del tris", fp: [1, 1], box: [-51, -70, 59, 30], dietro: true, piano: 46, posti: POSTI2 }, function () {
    var ZT = 46, l = [];
    var s = tavolinoBase(FAGGIO, { seme: 61, filetto: false, disegno: lavagnaTris(.29 * 61) });
    l.push([vicino(-.01, .355), gessetto(-.07, .35, .04, .362, ZT)]);
    l.push([vicino(.355, -.2), cancellino(.355, -.2, ZT)]);
    return s + ordina(l);
  });

  // =========================================================
  //  TAVOLINO DEL FORZA 4: in mezzo la griglia blu in piedi coi piedini e la sbarra in basso, le pedine rosse e gialle
  //  cadute nelle colonne; sul tavolo le pedine che restano: rosse dalla parte di uno, gialle dalla parte dell'altro
  // =========================================================
  var BLU4 = "#1f5fd0", ROSSA = "#e03131", GIALLA = "#fcc419";
  var STATO4 = [["R"], ["G", "R"], ["R", "G", "G"], ["G", "R", "R", "G"], ["R", "G", "R"], ["G"], []];   // le colonne (dal davanti), dal basso
  function pedina(a, b, z, col) {   // una pedina stesa
    var F = forma(a, b, .034), c = P(a, b, z), s = ell(c[0] + 1.2, c[1] + .6, 3.2, 1.7, "#000", op(.22));
    s += corpo([giro(F, z, 1, 28), giro(F, z + 1.3, 1, 28)], [[0, chiaro(col, .3)], [.5, col], [1, scuro(col, .4)]], .55);
    var tp = giro(F, z + 1.3, 1, 28);
    return s + pth(chiuso(tp), nuovaR([[0, chiaro(col, .4)], [.6, col], [1, scuro(col, .12)]], .4, .35, .8), bordo(L, .5)) + pth(chiuso(giro(F, z + 1.35, .6, 22)), "none", "stroke='" + scuro(col, .28) + "' stroke-width='.45' opacity='.7'");
  }
  function griglia4(z) {
    var B0 = .275, Z0 = z + 2.4, Z1 = z + 31, s = "";
    function faccia4(W, H) {   // la faccia con i 42 buchi: le pedine dove ci sono (si vedono da tutte e due le parti)
      var o = rett(0, 0, W, H, 0, lin("bl", [[0, chiaro(BLU4, .16)], [1, scuro(BLU4, .15)]], 0, 0, 0, 1)), cw = W / 7, ch = (H - 2.4) / 6, i, j;
      for (i = 0; i < 7; i++) for (j = 0; j < 6; j++) {
        var x = cw * (i + .5), y = 1.2 + ch * (j + .5), col = STATO4[G > 0 ? i : 6 - i][5 - j];
        if (col) {
          var cc = col === "R" ? ROSSA : GIALLA;
          o += cer(x, y, 1.95, nuovaR([[0, chiaro(cc, .38)], [.6, cc], [1, scuro(cc, .25)]], .4, .35, .8)) + cer(x, y, 1.2, "none", "stroke='" + scuro(cc, .25) + "' stroke-width='.35' opacity='.7'");
          o += pth("M" + q(x - 1.95, y) + " A1.95,1.95 0 0,1 " + q(x + 1.95, y), "none", "stroke='#0a2050' stroke-width='.7' opacity='.45'");   // l'ombra del bordo del buco
        } else o += cer(x, y, 1.95, "#0d2a63") + pth("M" + q(x - 1.6, y + .9) + " A1.95,1.95 0 0,0 " + q(x + 1.6, y + .9), "none", "stroke='" + chiaro(BLU4, .3) + "' stroke-width='.5'");
        o += cer(x, y, 2.05, "none", "stroke='" + scuro(BLU4, .4) + "' stroke-width='.35'");
      }
      return o + rett(0, 0, W, .9, 0, "#ffffff", op(.25));
    }
    function fessure(A, B, C, D, W, H) { var o = "", k; for (k = 0; k < 7; k++) o += rett(W * .25, H * (k + .2) / 7, W * .5, H * .6 / 7, .3, "#0b2152"); return stesa(A, B, D, W, H, o); }
    var lato = function (W, H) { return rett(0, 0, W, H, 0, "#ffffff", op(.1)); };
    var piedi = [-1, 1].map(function (sg) { return [vicino(0, sg * (B0 + .012)), blocco(-.1, .1, sg * (B0 + .012) - .016, sg * (B0 + .012) + .016, z, z + 2.6, BLU4, null, .9)]; });
    s += ordina(piedi.filter(function (x) { return x[0] < 0; }));
    s += blocco(-.034, .034, -B0, B0, z, Z0, "#173f8f", null, .9);   // la sbarra in basso che fa cadere le pedine
    s += blocco(-.022, .022, -B0, B0, Z0, Z1, BLU4, { fianco: faccia4, davanti: lato, dietro: lato, sopra: fessure }, 1.2);
    return s + ordina(piedi.filter(function (x) { return x[0] >= 0; }));
  }
  def("tavolo_forza4", { nome: "Tavolino del Forza 4", fp: [1, 1], box: [-51, -88, 59, 30], dietro: true, posti: POSTI2 }, function () {
    var ZT = 46, l = [], s = tavolinoBase(FAGGIO, { seme: 71 });
    [[-.28, .14, ROSSA, 3], [-.24, -.06, ROSSA, 1], [-.3, -.22, ROSSA, 2], [.27, -.16, GIALLA, 3], [.24, .06, GIALLA, 1], [.3, .22, GIALLA, 2]].forEach(function (x) {
      var o = "", k; for (k = 0; k < x[3]; k++) o += pedina(x[0] + k * .004, x[1] - k * .003, ZT + k * 1.35, x[2]);
      l.push([vicino(x[0], x[1]), o]);
    });
    l.push([vicino(0, 0), griglia4(ZT)]);
    return s + ordina(l);
  });

  // =========================================================
  //  TAVOLINO DELLA BATTAGLIA NAVALE: le due valigette (rossa e blu) aperte, ognuna davanti al suo giocatore:
  //  sotto il mare a quadretti con le navi grigie e i pioli, il coperchio in piedi con la griglia dei colpi;
  //  in mezzo il separatore alto (il cielo e la nave da guerra stampati) che non fa vedere le navi dell'altro
  // =========================================================
  function valigetta(sg, col, z) {   // sg = da che parte del tavolo (−1 a sinistra, +1 a destra)
    var a0 = sg * .065, a1 = sg * .37, A0 = Math.min(a0, a1), A1 = Math.max(a0, a1), r = rnd(sg > 0 ? 55 : 77), l = [];
    function mare(A, B, C, D, W, H) {   // il vassoio: la cornice, il mare a quadretti, le navi, i pioli
      var o = rett(W * .06, H * .05, W * .88, H * .9, 1, "#1c7ed6") + rett(W * .06, H * .05, W * .88, H * .9, 1, lin("mr", [[0, "#74c0fc", .6], [1, "#1864ab", .4]], 0, 0, 1, 1)), i, n = 10, cw = W * .88 / n, ch = H * .9 / n;
      var g = ""; for (i = 1; i < n; i++) g += "M" + q(W * .06 + i * cw, H * .05) + " V" + f1(H * .95) + " M" + q(W * .06, H * .05 + i * ch) + " H" + f1(W * .94) + " ";
      o += "<path d='" + g + "' stroke='#d0ebff' stroke-width='.25' opacity='.7'/>";
      [[1, 1, 1, 4], [4, 7, 4, 1], [7, 2, 1, 3], [3, 3, 3, 1], [8, 7, 1, 2]].forEach(function (nv) {   // le navi: [colonna, riga, larga, lunga]
        var x = W * .06 + nv[0] * cw + cw * .15, y = H * .05 + nv[1] * ch + ch * .15, w = nv[2] * cw - cw * .3, h = nv[3] * ch - ch * .3;
        o += rett(x + .4, y + .5, w, h, Math.min(w, h) / 2, "#000", op(.3)) + rett(x, y, w, h, Math.min(w, h) / 2, "#adb5bd", "stroke='#495057' stroke-width='.3'") + rett(x + w * .25, y + h * .25, w * .5, h * .5, Math.min(w, h) * .2, "#ced4da");
      });
      for (i = 0; i < 7; i++) { var px = W * .06 + (Math.floor(r() * n) + .5) * cw, py = H * .05 + (Math.floor(r() * n) + .5) * ch; o += cer(px, py, Math.min(cw, ch) * .28, i < 3 ? "#e03131" : "#f8f9fa", "stroke='#343a40' stroke-width='.2'"); }
      return stesa(A, B, D, W, H, o);
    }
    function colpi(W, H) {   // il coperchio dalla parte del giocatore: la griglia dei colpi coi pioli rossi e bianchi
      var o = rett(W * .07, H * .08, W * .86, H * .84, .8, "#2b3036"), i, j, n = 10, cw = W * .86 / n, ch = H * .84 / n;
      for (i = 0; i < n; i++) for (j = 0; j < n; j++) { var x = W * .07 + (i + .5) * cw, y = H * .08 + (j + .5) * ch, v = r(); o += v < .1 ? cer(x, y, cw * .34, "#e03131") + cer(x - .15, y - .15, cw * .12, "#ffc9c9") : v < .26 ? cer(x, y, cw * .3, "#f8f9fa") : cer(x, y, cw * .14, "#0d0f12"); }
      return o + rett(0, 0, W, H, 0, lin("cp", [[0, "#ffffff", .14], [1, "#ffffff", 0]], 0, 0, 1, 1));
    }
    function schiena(W, H) { return rett(W * .18, H * .25, W * .64, H * .5, 2, scuro(col, .15)) + rett(W * .22, H * .3, W * .56, H * .4, 1.6, "none", "stroke='" + chiaro(col, .3) + "' stroke-width='.5'"); }
    var verso = sg * G > 0;   // il coperchio guarda chi lo vede (la faccia dei colpi) o gli dà la schiena
    l.push([vicino((A0 + A1) / 2, 0) - .05, blocco(A0, A1, -.225, .225, z, z + 2.2, col, { sopra: mare }, 1.1)]);
    var b0 = sg * .052, b1 = sg * .068;
    l.push([vicino(sg * .06, 0), blocco(Math.min(b0, b1), Math.max(b0, b1), -.225, .225, z + 1.4, z + 20.5, col, { fianco: verso ? colpi : schiena }, 1.1)]);
    return l;
  }
  function separatore(z) {   // il pannello in mezzo: il cielo, la nave da guerra in controluce, le onde
    function stampa(W, H) {
      var o = rett(0, 0, W, H, 0, lin("cl", [[0, "#9fd3ff"], [.55, "#e7f5ff"], [1, "#4dabf7"]], 0, 0, 0, 1)), x = W * .18, y = H * .25, k = W / 40;
      o += pth("M" + q(x, y + 2.4 * k) + " L" + q(x + 26 * k, y + 2.4 * k) + " L" + q(x + 29 * k, y) + " L" + q(x + 21 * k, y) + " L" + q(x + 20 * k, y - 2 * k) + " L" + q(x + 16 * k, y - 2 * k) + " L" + q(x + 15 * k, y - 5.5 * k) + " L" + q(x + 14 * k, y - 5.5 * k) + " L" + q(x + 13 * k, y - 2 * k) + " L" + q(x + 9 * k, y - 2 * k) + " L" + q(x + 8 * k, y) + " L" + q(x - 1 * k, y) + " Z", "#1b2a4a");
      o += tratto(linea([x + 21 * k, y - 1 * k], [x + 25 * k, y - 1.8 * k]), "#1b2a4a", .6) + tratto(linea([x + 4 * k, y - .6 * k], [x - .5 * k, y - 1.4 * k]), "#1b2a4a", .6);   // i cannoni
      var d = "M0," + f1(y + 3 * k); for (var i = 0; i <= 10; i++) d += " Q" + q(W * (i + .5) / 10, y + (i % 2 ? 1.6 : 4.4) * k) + " " + q(W * (i + 1) / 10, y + 3 * k);
      o += pth(d + " V" + f1(H) + " H0 Z", "#1864ab") + tratto(d, "#ffffff", .5, op(.8));
      return o + rett(0, 0, W, 1, 0, "#ffffff", op(.4));
    }
    var lato = function (W, H) { return rett(0, 0, W, H, 0, "#ffffff", op(.15)); };
    return blocco(-.008, .008, -.262, .262, z, z + 31, "#5c7cfa", { fianco: stampa, davanti: lato, dietro: lato, sopra: function (A, B, C, D, W, H) { return stesa(A, B, D, W, H, rett(0, 0, W, H, 0, "#dbe4ff")); } }, 1.1);
  }
  def("tavolo_navale", { nome: "Tavolino della battaglia navale", fp: [1, 1], box: [-51, -88, 59, 30], dietro: true, posti: POSTI2 }, function () {
    var ZT = 46, s = tavolinoBase(FAGGIO, { seme: 81 }), l = [];
    l = l.concat(valigetta(-1, "#c92a2a", ZT), valigetta(1, "#1864ab", ZT));
    l.push([vicino(0, 0), separatore(ZT)]);
    return s + ordina(l);
  });

  // =========================================================
  //  SEDIA IMPAGLIATA da osteria: faggio tinto noce a cera, le gambe davanti tornite col pomello che spunta,
  //  i pioli (due davanti, due per lato, uno dietro), lo schienale coi montanti un po' all'indietro, le tre stecche curve
  //  e i pomelli in cima; il sedile di paglia intrecciata a quattro spicchi (si vede la croce dell'intreccio).
  //  Da dietro: lo schienale davanti al sedile
  // =========================================================
  def("sedia_circolo", { nome: "Sedia impagliata", fp: [1, 1], box: [-26, -76, 27, 14], dietro: true, azione: "siedi", seduta: 30 }, function () {
    var W = SEDIA, ZR = 26.2, ZP = 29.3, ZM = 57.5, i;
    var FL = [-.215, .195], FR = [.215, .195], BR = [.185, -.205], BL = [-.185, -.205];
    var s = ombraPianta(-.23, .23, -.25, .23, .95, .06);
    function bPost(z) { return z <= 27.5 ? -.215 + .025 * z / 27.5 : -.19 - .045 * (z - 27.5) / (ZM - 27.5); }
    function piolo(A, B, w) {   // un piolo tondo da A a B (punti [a, b, z])
      var a = P(A[0], A[1], A[2]), b = P(B[0], B[1], B[2]);
      return tratto(linea(a, b), L, w + 1.3) + tratto(linea(a, b), W, w) + tratto(linea([a[0], a[1] - w * .25], [b[0], b[1] - w * .25]), chiaro(W, .4), w * .35, op(.8));
    }
    function montante(a) {   // la gamba di dietro che sale a fare lo schienale, col pomello in cima
      var p0 = P(a, -.215, 0), p1 = P(a, -.19, 27.5), p2 = P(a, bPost(ZM), ZM), d = "M" + q(p0) + " L" + q(p1) + " L" + q(p2);
      var o = ell(p0[0] + 1, p0[1] + .5, 3.2, 1.6, "#000", op(.24)) + tratto(d, L, 4.6) + tratto(d, nuova(legno(W), p1[0] - 2, 0, p1[0] + 2, 0, true), 3.1) + tratto("M" + q(p0[0] - .7, p0[1]) + " L" + q(p1[0] - .7, p1[1]) + " L" + q(p2[0] - .7, p2[1]), "#ffffff", .55, op(.35));
      return o + tornito(a, bPost(ZM), [[ZM - 1, .022], [ZM + .6, .028], [ZM + 2.2, .027], [ZM + 3.2, .016], [ZM + 3.7, .009]], legno(W), .9, [1]);
    }
    function gambaDav(a, b) { return tornito(a, b, [[0, .021], [1.6, .023], [5, .019], [8, .024], [9.4, .029], [10.6, .024], [14, .021], [19, .025], [21.2, .03], [22.6, .025], [ZP + .2, .027]], legno(W), 1, [4, 8], .45) + (function () { var c = P(a, b, 0); return ell(c[0] + 1, c[1] + .5, 3, 1.5, "#000", op(.24)); })(); }
    function pomello(a, b) { var t = anello(a, b, ZP + 1, .027); return pth("M" + q(t.x - t.rx, t.y + 1) + " L" + q(t.x - t.rx, t.y) + " A" + f1(t.rx) + "," + f1(t.rx) + " 0 0,1 " + q(t.x + t.rx, t.y) + " L" + q(t.x + t.rx, t.y + 1) + " Z", nuova(legno(W), t.x - t.rx, 0, t.x + t.rx, 0, true), bordo(L, .8)) + ell(t.x - .6, t.y - 1.2, .8, .5, "#ffffff", op(.5)); }
    function stecca(z0, z1, arco) {   // una stecca dello schienale, curva (incavata verso chi si siede)
      var fr = [], ba = [], tp1 = [], tp2 = [], n = 12, k;
      for (k = 0; k <= n; k++) {
        var a = -.168 + .336 * k / n, t = a / .168, bc = bPost((z0 + z1) / 2) - .03 * (1 - t * t), zt = z1 + arco * (1 - t * t);
        fr.push(P(a, bc, zt)); ba.push(P(a, bc, z0)); tp1.push(P(a, bc - .01, zt)); tp2.push(P(a, bc + .01, zt));
      }
      var pp = fr.concat(ba.slice().reverse()), bb = limiti(pp);
      return pth(chiuso(pp), nuova([[0, chiaro(W, .28)], [.45, chiaro(W, .08)], [1, scuro(W, .3)]], bb[0], 0, bb[2], 0, true), bordo(L, 1)) +
        pth(chiuso(tp1.concat(tp2.slice().reverse())), chiaro(W, .3), bordo(L, .5)) + tratto(aperto(fr.map(function (x) { return [x[0], x[1] + .9]; })), "#ffffff", .5, op(.35));
    }
    function schienale() { return stecca(35.4, 38.6, .4) + stecca(42.2, 45.6, .6) + stecca(49.2, 55, 1.6); }
    function gambeDietro() { return montante(-.17) + montante(.17) + piolo([-.17, -.205, 11.5], [.17, -.205, 11.5], 1.6); }
    function lati() { return piolo([-.2, .175, 9], [-.17, -.2, 9], 1.6) + piolo([-.2, .175, 16.5], [-.17, -.198, 16.5], 1.6) + piolo([.2, .175, 9], [.17, -.2, 9], 1.6) + piolo([.2, .175, 16.5], [.17, -.198, 16.5], 1.6); }
    function davanti() { return piolo([-.2, .178, 7], [.2, .178, 7], 1.7) + piolo([-.2, .178, 14.5], [.2, .178, 14.5], 1.7) + gambaDav(-.2, .175) + gambaDav(.2, .175); }
    // il sedile di paglia: il bordo che fascia i regoli, sopra l'intreccio a quattro spicchi
    function sedile() {
      var pp = [FR, FL, BL, BR], o = "";
      o += fianco(pp, ZR, ZP, PAGLIA, null, { lw: 1.1, extra: function (vv) { return lungoCorsa(vv, .021, function (a, b) { return tratto(linea(P(a, b, ZR + .4), P(a, b, ZP - .2)), scuro(PAGLIA, .32), .45, op(.7)); }); } });
      var top = aSchermo(pp, ZP), d = chiuso(top), t = "", C = [0, -.005], tri = [[FL, FR], [FR, BR], [BR, BL], [BL, FL]], k, j, n = 11;
      tri.forEach(function (e, ti) {
        for (j = 0; j < n; j++) {
          var t0 = j / n, t1 = (j + 1) / n, A = lerp(e[0], C, t0), B = lerp(e[1], C, t0), A1 = lerp(e[0], C, t1), B1 = lerp(e[1], C, t1);
          var cc = (j % 2 ? "#cfa450" : "#e0bb68");
          t += "<path d='M" + q(A[0] * 61, A[1] * 61) + " L" + q(B[0] * 61, B[1] * 61) + " L" + q(B1[0] * 61, B1[1] * 61) + " L" + q(A1[0] * 61, A1[1] * 61) + " Z' fill='" + cc + "'/>";
          var m0 = lerp(A, A1, .35), m1 = lerp(B, B1, .35);
          t += "<path d='M" + q(m0[0] * 61, m0[1] * 61) + " L" + q(m1[0] * 61, m1[1] * 61) + "' stroke='#f6dc98' stroke-width='.35' opacity='.8'/><path d='M" + q(A1[0] * 61, A1[1] * 61) + " L" + q(B1[0] * 61, B1[1] * 61) + "' stroke='#8a6428' stroke-width='.3' opacity='.75'/>";
        }
        if (ti === 1 || ti === 2) t += "<path d='M" + q(e[0][0] * 61, e[0][1] * 61) + " L" + q(e[1][0] * 61, e[1][1] * 61) + " L" + q(C[0] * 61, C[1] * 61) + " Z' fill='#000' opacity='.07'/>";   // gli spicchi in ombra
      });
      [FL, FR, BR, BL].forEach(function (v) { t += "<path d='M" + q(v[0] * 61, v[1] * 61) + " L" + q(C[0] * 61, C[1] * 61) + "' stroke='#6e4c1c' stroke-width='.7' opacity='.8'/>"; });   // la croce dell'intreccio
      var b = limiti(top);
      t = suZ(ZP, t) + ell(b[0] + (b[2] - b[0]) * .4, b[1] + (b[3] - b[1]) * .4, (b[2] - b[0]) * .34, (b[3] - b[1]) * .3, nuovaR([[0, "#fff6d8", .32], [1, "#fff6d8", 0]], .5, .5, .5));
      return o + dentro(d, t) + pth(d, "none", bordo(L, 1.1));
    }
    if (G > 0) s += gambeDietro() + schienale() + lati() + davanti() + sedile() + pomello(-.2, .175) + pomello(.2, .175);
    else s += davanti() + lati() + sedile() + pomello(-.2, .175) + pomello(.2, .175) + gambeDietro() + schienale();
    return s;
  });

  // =========================================================
  //  BILIARDO ALL'ITALIANA: la cassa di noce coi pannelli e le sei gambe a balaustro, le sponde lucide coi rombetti
  //  di madreperla, le gomme e il panno verde, le sei buche col bordo cromato; in mezzo il "castello" dei cinque birilli
  //  (il rosso al centro), le tre bilie (bianca, gialla e il pallino rosso), le due stecche appoggiate e il gessetto blu
  // =========================================================
  function gambaBiliardo(a, b, z1) {
    var c = P(a, b, 0), pr = [[0, .085], [1.8, .088], [3.2, .075], [5, .062], [8, .07], [12, .094], [15.5, .1], [19, .088], [22, .066], [24, .06], [25.6, .07], [27.2, .08], [z1, .08]];
    return ell(c[0] + 2, c[1] + 1, 9, 4.2, "#000", op(.26)) + tornito(a, b, pr, legno(NOCE_SC), 1.3, [2, 9, 11], .9);
  }
  function pannelli(segm, y0, y1, xLuce) {   // sui fianchi della cassa: i pannelli in rilievo (cornice chiara dalla parte della luce) col rombo intarsiato
    var o = "";
    segm.forEach(function (sg) {
      var x0 = sg[0], x1 = sg[1], w = x1 - x0, h = y1 - y0, xl = xLuce > 0 ? x0 : x1, xs = xLuce > 0 ? x1 : x0, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
      o += rett(x0, y0, w, h, .6, "#000", op(.1));
      o += "<path d='M" + q(xl, y1) + " V" + f1(y0) + " H" + f1(xs) + "' fill='none' stroke='#fff3df' stroke-width='.8' opacity='.35'/><path d='M" + q(xs, y0) + " V" + f1(y1) + " H" + f1(xl) + "' fill='none' stroke='#000' stroke-width='.8' opacity='.35'/>";
      o += rett(x0 + 1.8, y0 + 1.8, w - 3.6, h - 3.6, .4, "none", "stroke='#000' stroke-width='.5' opacity='.25'");
      o += "<path d='M" + q(cx - Math.min(w * .16, 9), cy) + " L" + q(cx, cy - h * .27) + " L" + q(cx + Math.min(w * .16, 9), cy) + " L" + q(cx, cy + h * .27) + " Z' fill='#e9b880' opacity='.55' stroke='#3d2414' stroke-width='.4'/>";
    });
    return o;
  }
  function steccaDistesa(a0, b0, a1, b1, z, giro2) {   // una stecca stesa: dal calcio (a0, b0) alla punta (a1, b1), appoggiata all'altezza z
    var A = P(a0, b0, z + 1.6), B = P(a1, b1, z + .8), dx = B[0] - A[0], dy = B[1] - A[1], ln = Math.sqrt(dx * dx + dy * dy), nx = -dy / ln, ny = dx / ln;
    if (ny > 0) { nx = -nx; ny = -ny; }   // n: il lato verso la luce (in alto)
    function W(t) { return (3.3 - 1.8 * t) / 2; }
    function pz(t0, t1, fill) { return poly([[A[0] + dx * t0 + nx * W(t0), A[1] + dy * t0 + ny * W(t0)], [A[0] + dx * t1 + nx * W(t1), A[1] + dy * t1 + ny * W(t1)], [A[0] + dx * t1 - nx * W(t1), A[1] + dy * t1 - ny * W(t1)], [A[0] + dx * t0 - nx * W(t0), A[1] + dy * t0 - ny * W(t0)]], fill); }
    var sag = [[A[0] + nx * W(0), A[1] + ny * W(0)], [B[0] + nx * W(1), B[1] + ny * W(1)], [B[0] - nx * W(1), B[1] - ny * W(1)], [A[0] - nx * W(0), A[1] - ny * W(0)]];
    var s = poly(sag.map(function (x) { return [x[0] + 1.4, x[1] + 2.2]; }), "#000", op(.24));   // l'ombra sul panno
    s += poly(sag, "none", bordo(L, 1.6));
    s += pz(0, .025, "#1d1d1f") + pz(.025, .2, "#3a1f14") + pz(.2, .205, "#e8e4da") + pz(.205, .37, giro2) + pz(.37, .52, "#e6c58f");
    [[.37, .5], [.37, .47]].forEach(function (pt, i) { var t0 = pt[0], t1 = pt[1], m = W(t0) * (i ? -.55 : .55); s += poly([[A[0] + dx * t0 + nx * (m - .9), A[1] + dy * t0 + ny * (m - .9)], [A[0] + dx * t0 + nx * (m + .9), A[1] + dy * t0 + ny * (m + .9)], [A[0] + dx * t1 + nx * m, A[1] + dy * t1 + ny * m]], "#2a1710"); });   // le punte d'ebano
    s += pz(.52, .53, "#f4f1e8") + pz(.53, .985, "#efd6a2") + pz(.985, .996, "#fbfaf5") + pz(.996, 1, "#3b6fb0");
    for (var k = 0; k < 9; k++) { var t = .22 + k * .016; s += tratto(linea([A[0] + dx * t + nx * W(t), A[1] + dy * t + ny * W(t)], [A[0] + dx * (t + .008) - nx * W(t), A[1] + dy * (t + .008) - ny * W(t)]), "#000", .25, op(.35)); }   // la fasciatura
    return s + tratto(linea([A[0] + nx * W(0) * .45, A[1] + ny * W(0) * .45], [B[0] + nx * W(1) * .45, B[1] + ny * W(1) * .45]), "#ffffff", .5, op(.5));
  }
  def("biliardo", { nome: "Biliardo", fp: [3, 2], box: [-124, -110, 131, 66], dietro: true }, function () {
    var A0 = 1.47, B0 = .8, AR = 1.36, BR = .69, AC = 1.32, BC = .65, ZT = 49.5, ZG = 49.1, ZN = 48.3, ZP = 47.3, ZK = 45, ZB = 30, l = [];
    var O = pRett(-A0, A0, -B0, B0, .045, 4), Oc = pRett(-A0 + .05, A0 - .05, -B0 + .05, B0 - .05, .03, 3), Inn = pRett(-AR, AR, -BR, BR, 0);
    var s = ombraForma(pRett(-A0, A0, -B0, B0, 0), 1.15);
    var gg = [[-1.22, -.58], [0, -.58], [1.22, -.58], [-1.22, .58], [0, .58], [1.22, .58]].sort(perVicino);
    s += gg.map(function (g) { return gambaBiliardo(g[0], g[1], ZB + .5); }).join("");
    // la cassa coi pannelli e le cornici
    s += fianco(Oc, ZB, ZK, NOCE_SC, CERA, { lw: 1.5, righe: [[ZB + 1.4, "#000", .8, .35], [ZB + 2.6, "#fff3df", .6, .3], [ZK - 1.4, "#000", .7, .3]] });
    var Ac = A0 - .05, Bc = B0 - .05;
    s += suB(G * Bc, pannelli([[-Ac * 61 + 7, -Ac * 61 + 7 + 54], [-27, 27], [Ac * 61 - 61, Ac * 61 - 7]], -ZK + 3, -ZB - 4, G));
    s += suA(G * Ac, pannelli([[-Bc * 61 + 6, Bc * 61 - 6]], -ZK + 3, -ZB - 4, -G));
    // le sponde: il bordo di noce lucido e sopra il legno con le venature
    s += fianco(O, ZK, ZT, NOCE, CERA, { lw: 1.5, righe: [[ZK + .7, "#000", .6, .4], [ZT - .7, "#fff3df", .55, .5]] });
    var bs = limiti(aSchermo(O, ZT)), ring = chiuso(aSchermo(O, ZT)) + " " + chiuso(aSchermo(Inn, ZT).reverse());
    s += pth(ring, nuova([[0, chiaro(NOCE, .3)], [.5, NOCE], [1, scuro(NOCE, .2)]], bs[0], bs[1], bs[2], bs[3], true), "fill-rule='evenodd'");
    s += dentro(ring, suZ(ZT, venePiano(-A0 * 61, A0 * 61, -B0 * 61, B0 * 61, NOCE, 91, { nodi: 0, passo: 2 })) + ell(bs[0] + (bs[2] - bs[0]) * .35, bs[1] + (bs[3] - bs[1]) * .3, (bs[2] - bs[0]) * .3, (bs[3] - bs[1]) * .25, nuovaR([[0, "#fff8e8", .3], [1, "#fff8e8", 0]], .5, .5, .5)), true);
    s += pth(ring, "none", "fill-rule='evenodd' " + bordo(L, 1.4));
    // il panno, le gomme
    var dis = "";
    [[0, 0], [-.07, 0], [.07, 0], [0, -.07], [0, .07], [-.66, 0], [.66, 0]].forEach(function (x, i) { dis += cer(x[0] * 61, x[1] * 61, i < 5 ? .55 : .7, "#ffffff", op(.55)); });   // i segni dei birilli e delle bilie
    s += panno(pRett(-AC, AC, -BC, BC, 0), ZP, VERDE_BIL, dis, .22);
    var cus = [
      [[[-AR, -BR, ZG], [AR, -BR, ZG], [AC, -BC, ZN], [-AC, -BC, ZN]], [0, G * .3, .95]], [[[-AR, BR, ZG], [AR, BR, ZG], [AC, BC, ZN], [-AC, BC, ZN]], [0, -G * .3, .95]],
      [[[-AR, -BR, ZG], [-AR, BR, ZG], [-AC, BC, ZN], [-AC, -BC, ZN]], [G * .3, 0, .95]], [[[AR, -BR, ZG], [AR, BR, ZG], [AC, BC, ZN], [AC, -BC, ZN]], [-G * .3, 0, .95]]
    ];
    cus.forEach(function (c) { var pp = c[0].map(function (x) { return P(x[0], x[1], x[2]); }); s += poly(pp, tinta(scuro(VERDE_BIL, .08), norma(c[1])), "stroke='" + scuro(VERDE_BIL, .4) + "' stroke-width='.4'"); });
    s += tratto(chiuso(aSchermo(pRett(-AC, AC, -BC, BC, 0), ZN)), scuro(VERDE_BIL, .45), .6, op(.8));
    // le buche: il buco nel panno e nella sponda, il bordo cromato verso fuori
    var buche = "";
    [[1, 1], [-1, 1], [-1, -1], [1, -1]].forEach(function (k) { buche += buca((AC + .02) * k[0], (BC + .02) * k[1], .075, Math.atan2(k[1], k[0]) * 180 / Math.PI, 80); });
    [1, -1].forEach(function (k) { buche += buca(0, (BC + .035) * k, .066, k > 0 ? 90 : -90, 68); });
    s += suZ(ZG, buche);
    // i rombetti di madreperla sulle sponde
    var mo = "", mb = (BR + B0) / 2, ma = (AR + A0) / 2;
    [-.99, -.66, -.33, .33, .66, .99].forEach(function (a) { [-1, 1].forEach(function (k) { mo += rombetto(a * 61, mb * 61 * k); }); });
    [-.33, 0, .33].forEach(function (b) { [-1, 1].forEach(function (k) { mo += rombetto(ma * 61 * k, b * 61); }); });
    s += suZ(ZT, mo);
    // sul panno: il castello dei birilli, le bilie, le stecche; sulla sponda il gessetto
    [[0, 0, true], [-.07, 0], [.07, 0], [0, -.07], [0, .07]].forEach(function (x) { l.push([vicino(x[0], x[1]), birillo(x[0], x[1], ZP, !!x[2])]); });
    [[-.72, .22, "#f8f6ef"], [.78, -.26, "#f4c020"], [.42, .1, "#d6283b"]].forEach(function (x) { l.push([vicino(x[0], x[1]), bilia(x[0], x[1], ZP, x[2])]); });
    l.push([vicino(-.3, -.5) + .5, steccaDistesa(-1.12, -.5, .36, -.47, ZP, "#2b5f3a")]);
    l.push([vicino(.2, .4) + .5, steccaDistesa(1.16, .53, -.24, .2, ZP, "#7a1f1f")]);
    l.push([vicino(.86, .745) + 1, blocco(.835, .885, .72, .77, ZT, ZT + 3, "#2f6fd0", { sopra: function (A, B, C, D, W, H) { return stesa(A, B, D, W, H, ell(W / 2, H / 2, W * .28, H * .28, "#1f4f9c")); } }, .8)]);
    return s + ordina(l);
  });
  function buca(X, Y, r, verso, ampio) {   // in pianta (mattonelle): il buco scuro e la piastra cromata attorno (dalla parte di fuori)
    var x = X * 61, y = Y * 61, R = r * 61, t0 = (verso - ampio) * Math.PI / 180, t1 = (verso + ampio) * Math.PI / 180, R2 = R + 2.8;
    var o = cer(x + .5, y + .7, R + 1.2, "#000", op(.3));
    o += "<path d='M" + q(x + R * Math.cos(t0), y + R * Math.sin(t0)) + " A" + f2(R) + "," + f2(R) + " 0 0,1 " + q(x + R * Math.cos(t1), y + R * Math.sin(t1)) + " L" + q(x + R2 * Math.cos(t1), y + R2 * Math.sin(t1)) + " A" + f2(R2) + "," + f2(R2) + " 0 0,0 " + q(x + R2 * Math.cos(t0), y + R2 * Math.sin(t0)) + " Z' fill='" + lin("cr", [[0, "#ffffff"], [.35, "#d9dee2"], [.7, "#8f9aa3"], [1, "#5b6670"]], 0, 0, 1, 1) + "' stroke='" + L + "' stroke-width='.5'/>";
    o += cer(x, y, R, nuovaR([[0, "#040404"], [.65, "#14110f"], [1, "#3a2d24"]], .45, .42, .62), "stroke='" + L + "' stroke-width='.6'");
    return o + cer(x - R * .25, y - R * .3, R * .3, "#5a4636", op(.25));
  }
  function rombetto(x, y) { return "<path d='M" + q(x - 1.4, y) + " L" + q(x, y - .8) + " L" + q(x + 1.4, y) + " L" + q(x, y + .8) + " Z' fill='#f4efe2' stroke='#7a6650' stroke-width='.25'/>"; }
  function bilia(a, b, z, col) { var r = 2.9, c = P(a, b, z); return ell(c[0] + 2, c[1] + .6, 3.4, 1.5, "#000", op(.3)) + pallina([c[0], c[1] - r], r, col, .5); }
  function birillo(a, b, z, rosso) {   // un birillo (piccolo come quelli veri, ma un po' più alto per vederlo)
    var col = rosso ? "#d6283b" : "#f7f4ec", c = P(a, b, z);
    return ell(c[0] + 1.3, c[1] + .4, 1.6, .7, "#000", op(.3)) + tornito(a, b, [[z, .011], [z + .7, .015], [z + 2.4, .018], [z + 3.8, .011], [z + 4.6, .008], [z + 5.4, .012], [z + 6.2, .006]], [[0, "#ffffff"], [.4, col], [1, scuro(col, .35)]], .4);
  }

  // =========================================================
  //  LAMPADA DEL BILIARDO (appesa in alto, sotto si cammina): il paralume lungo di metallo smaltato verde a tetto,
  //  le testate e il bordo d'ottone, la sbarra d'ottone coi pomelli in cima, le due catenelle che salgono al soffitto.
  //  Di notte sotto il bordo esce la luce calda. L'impronta è quella del biliardo (3 × 2): messa nella stessa mattonella
  //  del biliardo gli sta centrata sopra (con un'impronta più piccola resterebbe sempre spostata di mezza mattonella)
  // =========================================================
  def("lampada_biliardo", { tipo: "sospeso", nome: "Lampada del biliardo", fp: [3, 2], box: [-60, -262, 61, -66], luce: [0, 0, 112, 175, "#ffe3a0"] }, function () {
    var A = .86, B0 = .19, B1 = .075, Z0 = 118, Z1 = 131, Z2 = 133.4, VL = "#21703f", s = "", i;
    var OT = [[0, "#fff6cf"], [.3, "#f3d27a"], [.62, "#c99a36"], [1, "#7a5614"]];
    // le catenelle (salgono fuori dal disegno, fino al soffitto)
    [-.52, .52].forEach(function (a) {
      var c = P(a, 0, Z2 + 2), y, k = 0;
      for (y = c[1] - 2; y > -258; y -= 2.6, k++) s += k % 2 ? rett(c[0] - .5, y - 2.6, 1, 2.6, .4, nuova(OT, c[0] - .5, 0, c[0] + .5, 0, true), bordo(L, .3)) : ell(c[0], y - 1.3, 1, 1.5, "none", "stroke='" + L + "' stroke-width='.9'") + ell(c[0], y - 1.3, 1, 1.5, "none", "stroke='#e0b54a' stroke-width='.45'");
      s += ell(c[0], c[1] - .6, 1.8, 1.2, "none", bordo(L, .9)) + ell(c[0], c[1] - .6, 1.8, 1.2, "none", "stroke='#e0b54a' stroke-width='.5'");
    });
    var u = function (a, b, z) { return P(a, b, z); };
    var F = [u(-A, B0, Z0), u(A, B0, Z0), u(A, B1, Z1), u(-A, B1, Z1)], E = [u(A, B0, Z0), u(A, -B0, Z0), u(A, -B1, Z1), u(A, B1, Z1)], T = [u(-A, -B1, Z1), u(A, -B1, Z1), u(A, B1, Z1), u(-A, B1, Z1)];
    var bf = limiti(F);
    // la falda davanti (lucida, col riflesso lungo), la testata, il tetto
    s += poly(F, nuova([[0, chiaro(VL, .3)], [.45, VL], [1, scuro(VL, .3)]], 0, bf[1], 0, bf[3], true));
    s += dentro(chiuso(F), poly([lerp(F[3], F[2], .05), lerp(F[3], F[2], .7), lerp(F[0], F[1], .66), lerp(F[0], F[1], .02)].map(function (x, j) { return [x[0], x[1] + (j < 2 ? 2.6 : -4.6)]; }), "#ffffff", op(.16)) +
      tratto(linea([F[3][0] + 6, F[3][1] + 3.2], [F[2][0] - 18, F[2][1] + 3.2]), "#ffffff", 1.1, op(.55)));
    for (i = 1; i < 6; i++) s += tratto(linea(lerp(F[0], F[1], i / 6), lerp(F[3], F[2], i / 6)), scuro(VL, .4), .5, op(.45));   // le nervature della lamiera
    s += poly(E, nuova([[0, scuro(VL, .1)], [1, scuro(VL, .42)]], 0, limiti(E)[1], 0, limiti(E)[3], true)) + poly(E, "none", bordo(L, 1.1));
    s += poly(T, nuova([[0, chiaro(VL, .38)], [1, chiaro(VL, .12)]], limiti(T)[0], 0, limiti(T)[2], 0, true)) + poly(F, "none", bordo(L, 1.3)) + poly(T, "none", bordo(L, 1.1));
    // l'ottone: il bordo in basso, gli spigoli della testata, la sbarra e i pomelli
    var bordoB = "M" + q(F[0]) + " L" + q(F[1]) + " L" + q(E[1]);
    s += tratto(bordoB, L, 3.4) + tratto(bordoB, nuova(OT, bf[0], 0, bf[2], 0, true), 2) + tratto(bordoB, "#fff6cf", .6, op(.8) + " transform='translate(0 -.5)'");
    s += tratto("M" + q(E[3]) + " L" + q(E[0]) + " M" + q(E[2]) + " L" + q(E[1]), "#c99a36", 1.2) + tratto("M" + q(F[3]) + " L" + q(F[0]), "#c99a36", 1.2);
    var r0 = P(-A - .05, 0, Z2), r1 = P(A + .05, 0, Z2);
    s += blocco(-A + .02, A - .02, -B1 + .012, B1 - .012, Z1, Z2, scuro(VL, .1), null, .9);
    s += tratto(linea(r0, r1), L, 3.4) + tratto(linea(r0, r1), nuova(OT, r0[0], r0[1] - 2, r0[0], r0[1] + 2, true), 2) + pallina(r0, 1.9, "#e2b444", .6) + pallina(r1, 1.9, "#e2b444", .6);
    [-.66, 0, .66].forEach(function (a) { s += tornito(a, 0, [[Z2 - .4, .034], [Z2 + 1.2, .031], [Z2 + 2.3, .017], [Z2 + 3, .007]], OT, .7, null, .5); });   // i tre cappellotti delle lampadine
    if (NOTTE) {   // la luce che esce sotto il bordo e scende verso il tavolo
      var g0 = u(-A, B0, Z0 - .5), g1 = u(A, B0, Z0 - .5), g2 = u(A, -B0, Z0 - .5), dz = 26;
      s += poly([g0, g1, g2, [g2[0] + 6, g2[1] + dz], [g1[0] + 4, g1[1] + dz], [g0[0] - 4, g0[1] + dz]], nuova([[0, "#ffe9b0", .34], [.45, "#ffe9b0", .1], [1, "#ffe9b0", 0]], 0, g1[1], 0, g1[1] + dz, true));
      s += tratto("M" + q(g0) + " L" + q(g1) + " L" + q(g2), "#fffbe6", 1.4) + tratto("M" + q(g0) + " L" + q(g1) + " L" + q(g2), "#ffe9a0", 3.2, op(.5));
    }
    return s;
  });

  // =========================================================
  //  FRECCETTE (sul muro): il bersaglio di sisal coi venti spicchi neri e crema, i doppi e i tripli rossi e verdi,
  //  il centro, i fili e i numeri; dietro il tondo di legno coi buchetti dei tiri sbagliati; tre freccette piantate
  //  (alette tricolori); sotto la lavagnetta col punteggio a gesso (si parte da 501), il gessetto appeso allo spago
  // =========================================================
  var CIFRE = {
    "0": "M2,0C3.9,0 4,2 4,3S3.9,6 2,6S0,4 0,3S.1,0 2,0Z", "1": "M.9,1.3L2.5,0V6", "2": "M.3,1.3C.6,-.3 3.7,-.4 3.7,1.6C3.7,3.2 .9,4.2 .2,6H3.8",
    "3": "M.4,.6C1.4,-.3 3.6,0 3.5,1.5C3.4,2.6 2.4,2.8 1.5,2.8C2.6,2.8 3.9,3.2 3.8,4.5C3.6,6.3 1,6.4 .2,5.3", "4": "M3,6V0L.1,4.3H3.9",
    "5": "M3.6,0H.9L.6,2.6C1.6,2 3.8,2.2 3.8,4.1C3.8,6.3 1,6.4 .3,5.2", "6": "M3.4,.6C1.6,-.6 .2,1.4 .3,3.6C.4,6.3 3.7,6.4 3.7,4.1C3.7,2.3 1,2 .4,3.6",
    "7": "M.2,0H3.8L1.5,6", "8": "M2,2.9C.5,2.9 .4,0 2,0S3.5,2.9 2,2.9C.2,2.9 .1,6 2,6S3.8,2.9 2,2.9Z", "9": "M3.6,2.4C3,4 .3,3.8 .3,1.9S1.3,0 2,0S3.7,.4 3.7,2.4C3.7,4.4 2.8,6.6 .6,5.6"
  };
  function numero(str, x, y, h, col, w, x2) {   // i numeri a tratti: centrati in (x, y), alti h
    var k = h / 6, cw = 4 * k, gap = 1.2 * k, n = str.length, tot = n * cw + (n - 1) * gap, o = "", i;
    for (i = 0; i < n; i++) o += "<path d='" + CIFRE[str[i]] + "' transform='translate(" + f2(x - tot / 2 + i * (cw + gap)) + " " + f2(y - h / 2) + ") scale(" + f2(k) + ")' fill='none' stroke='" + col + "' stroke-width='" + f2(w / k) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x2) + "/>";
    return o;
  }
  function spicchio(cx, cy, r0, r1, a0, a1, fill) {
    var c0 = Math.cos(a0), s0 = Math.sin(a0), c1 = Math.cos(a1), s1 = Math.sin(a1);
    return "<path d='M" + q(cx + r1 * c0, cy + r1 * s0) + " A" + f2(r1) + "," + f2(r1) + " 0 0,1 " + q(cx + r1 * c1, cy + r1 * s1) + " L" + q(cx + r0 * c1, cy + r0 * s1) + (r0 > 0 ? " A" + f2(r0) + "," + f2(r0) + " 0 0,0 " + q(cx + r0 * c0, cy + r0 * s0) : "") + " Z' fill='" + fill + "'/>";
  }
  function bersaglio(cx, cy, R) {
    var NUM = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5], k = R / 20, i, o = "";
    var rD1 = 15.4 * k, rD0 = 14 * k, rT1 = 9.8 * k, rT0 = 8.5 * k, rB = 2 * k, rBB = .9 * k, NERO = "#1f1c1d", CREMA = "#efe1bd", ROSSO = "#d6312f", VERDE2 = "#1e8a4c";
    o += cer(cx + 1, cy + 1.3, R, "#0e0b0b") + cer(cx, cy, R, "#262224", bordo(L, 1.2));   // lo spessore del sisal e il cerchio nero dei numeri
    for (i = 0; i < 20; i++) {
      var a0 = (-99 + i * 18) * Math.PI / 180, a1 = a0 + 18 * Math.PI / 180, nero = i % 2 === 0;
      o += spicchio(cx, cy, rD0, rD1, a0, a1, nero ? ROSSO : VERDE2) + spicchio(cx, cy, rT1, rD0, a0, a1, nero ? NERO : CREMA) + spicchio(cx, cy, rT0, rT1, a0, a1, nero ? ROSSO : VERDE2) + spicchio(cx, cy, rB, rT0, a0, a1, nero ? NERO : CREMA);
    }
    o += cer(cx, cy, rB, VERDE2) + cer(cx, cy, rBB, ROSSO);
    var fili = "";   // la ragnatela di fili d'acciaio
    [rD1, rD0, rT1, rT0, rB, rBB].forEach(function (rr) { fili += cerD(cx, cy, rr) + " "; });
    for (i = 0; i < 20; i++) { var t = (-99 + i * 18) * Math.PI / 180; fili += "M" + q(cx + rB * Math.cos(t), cy + rB * Math.sin(t)) + " L" + q(cx + rD1 * Math.cos(t), cy + rD1 * Math.sin(t)) + " "; }
    o += "<path d='" + fili + "' fill='none' stroke='#c9ced3' stroke-width='.28'/>";
    for (i = 0; i < 20; i++) { var tn = (-90 + i * 18) * Math.PI / 180, rn = (rD1 + R) / 2 + .2 * k; o += numero(String(NUM[i]), cx + rn * Math.cos(tn), cy + rn * Math.sin(tn), 2.5 * k, "#f3efe6", .42); }
    o += cer(cx, cy, R, nuovaR([[0, "#ffffff", .14], [.45, "#ffffff", 0], [1, "#000000", .2]], .32, .28, .85));   // il volume
    return o + pth("M" + q(cx - R * .78, cy - R * .38) + " A" + f2(R * .86) + "," + f2(R * .86) + " 0 0,1 " + q(cx - R * .3, cy - R * .82), "none", "stroke='#ffffff' stroke-width='.7' opacity='.35' stroke-linecap='round'");
  }
  function freccetta(x, y, ang, l, cA, cB) {   // piantata in (x, y): esce verso di noi e un po' in basso a sinistra (ang = verso del corpo), lunga l; cA, cB = i colori delle alette
    var o = "<g transform='translate(" + f2(x) + " " + f2(y) + ")'>" + tratto("M0,0 L" + q(l * .42, l * .5), "#000", 1.6, op(.22)) + tratto("M" + q(l * .3, l * .45) + " L" + q(l * .6, l * .62), "#000", 4, op(.08)) + "</g>";   // l'ombra sul bersaglio
    o += "<g transform='translate(" + f2(x) + " " + f2(y) + ") rotate(" + f2(ang) + ")'>";
    var b1 = l * .38, s1 = l * .6, x0 = l * .55, x1 = l, i;
    o += "<path d='M0,-.5 L" + f2(b1 * .2) + ",-1.2 L" + f2(b1) + ",-1.15 L" + f2(b1) + ",1.15 L" + f2(b1 * .2) + ",1.2 L0,.5 Z' fill='" + lin("bar", [[0, "#ffffff"], [.4, "#c9ced3"], [1, "#4f5a62"]], 0, 0, 0, 1) + "' " + bordo(L, .4) + "/>";   // il fusto d'acciaio zigrinato
    for (i = 1; i < 7; i++) o += "<path d='M" + f2(b1 * (.25 + .7 * i / 7)) + ",-1.1 V1.1' stroke='#4f5a62' stroke-width='.3'/>";
    o += rett(b1, -.55, s1 - b1, 1.1, .4, "#1d1d22", bordo(L, .3)) + rett(b1 + (s1 - b1) * .5, -.6, 1, 1.2, .2, "#e8b923");
    o += "<path d='M" + f2(x0) + ",-.4 L" + f2(x0 + (x1 - x0) * .25) + ",-4.6 L" + f2(x1) + ",-5 L" + f2(x1) + ",-.4 Z' fill='" + cA + "' stroke='" + L + "' stroke-width='.4' stroke-linejoin='round'/>";   // le alette: due aperte e una di taglio
    o += "<path d='M" + f2(x0) + ",.4 L" + f2(x0 + (x1 - x0) * .25) + ",4.6 L" + f2(x1) + ",5 L" + f2(x1) + ",.4 Z' fill='" + cB + "' stroke='" + L + "' stroke-width='.4' stroke-linejoin='round'/>";
    o += "<path d='M" + f2(x0 + 1.2) + ",-2.6 L" + f2(x1 - .4) + ",-2.9 M" + f2(x0 + 1.2) + ",2.6 L" + f2(x1 - .4) + ",2.9' stroke='#ffffff' stroke-width='.9' opacity='.85'/>";   // la riga bianca in mezzo (il tricolore)
    o += "<path d='M" + f2(x0 + .6) + ",0 H" + f2(x1 + .3) + "' stroke='" + L + "' stroke-width='1.9'/><path d='M" + f2(x0 + .6) + ",0 H" + f2(x1 + .3) + "' stroke='#ffffff' stroke-width='1.1'/>";
    return o + "</g>";
  }
  def("freccette", { tipo: "parete", nome: "Bersaglio delle freccette" }, function () {
    var cx = 31, cy = 74, R = 19.5, s = "", r = rnd(180), i;
    s += ombraMuro(cerD(cx, cy, 25.5), 1.6, 2.2);
    s += cer(cx, cy, 25.5, nuovaR([[0, "#c98c55"], [.7, "#8f5a30"], [1, "#5e3618"]], .38, .32, .85), bordo(L, 1.5));   // il tondo di legno
    for (i = 0; i < 3; i++) s += cer(cx, cy, 21.5 + i * 1.3, "none", "stroke='#5e3618' stroke-width='.3' opacity='.35'");
    for (i = 0; i < 30; i++) { var t = r() * 6.283, rr = 20.6 + r() * 4.2; s += cer(cx + Math.cos(t) * rr, cy + Math.sin(t) * rr, .3 + r() * .25, "#2b1a10", op(.75)); }   // i buchetti dei tiri sbagliati
    s += bersaglio(cx, cy, R);
    var k = R / 20;
    s += freccetta(cx + .3, cy - 9.15 * k, 124, 15, "#2b9348", "#e03131") + freccetta(cx + 1.1, cy + .5, 112, 15.5, "#2b9348", "#e03131");
    var tt = (-90 - 18 * 1.05) * Math.PI / 180;   // la terza nel 5, accanto al 20
    s += freccetta(cx + 12 * k * Math.cos(tt), cy + 12 * k * Math.sin(tt), 138, 14.5, "#2b9348", "#e03131");
    // la lavagnetta del punteggio
    var x = 13, y = 111, w = 36, h = 38, f = 3.2;
    s += tratto("M" + q(x + 5, y + 1) + " L" + q(x + w / 2, y - 7.5) + " L" + q(x + w - 5, y + 1), "#8a6d4a", .55) + cer(x + w / 2, y - 7.5, 1, "#9aa3aa", bordo(L, .4));   // lo spago e il chiodo
    s += ombraMuro(rettD(x, y, w, h + 3, 1.3), 1.4, 2);
    s += rett(x, y, w, h, 1.3, lin("cf", [[0, "#b07a45"], [1, "#6e4322"]], 0, 0, 1, 1), bordo(L, 1.3));
    s += rett(x + f, y + f, w - 2 * f, h - 2 * f, .6, lin("sl", [[0, "#3f4a45"], [1, "#222a27"]], 0, 0, 1, 1));
    s += ell(x + w * .4, y + h * .45, w * .3, h * .25, "#e9efe9", op(.06)) + ell(x + w * .7, y + h * .7, w * .2, h * .12, "#e9efe9", op(.05));   // gli aloni del gesso
    var g = "", C = "#f2efe6";
    g += "<path d='M" + q(x + w / 2, y + f + 2) + " V" + f1(y + h - f - 2) + " M" + q(x + f + 1.5, y + f + 6.4) + " H" + f1(x + w - f - 1.5) + "' stroke='" + C + "' stroke-width='.5' opacity='.85'/>";
    g += "<path d='M" + q(x + 8, y + f + 3.8) + " l1.2,-2 1.2,2 M" + q(x + 8.5, y + f + 3) + " h1.4 M" + q(x + 24.5, y + f + 1.8) + " v2 M" + q(x + 24.5, y + f + 1.8) + " h1.6 M" + q(x + 24.5, y + f + 2.8) + " h1.2' fill='none' stroke='" + C + "' stroke-width='.45' stroke-linecap='round' opacity='.85'/>";   // le iniziali dei due giocatori
    [["501", 1], ["441", 1], ["380", 0]].forEach(function (v, j) { var yy = y + f + 10 + j * 6.8; g += numero(v[0], x + w * .27, yy, 4, C, .6, op(.88)); if (v[1]) g += "<path d='M" + q(x + w * .27 - 6, yy + 1.8) + " L" + q(x + w * .27 + 6, yy - 1.6) + "' stroke='" + C + "' stroke-width='.45' opacity='.8'/>"; });
    [["501", 1], ["455", 0]].forEach(function (v, j) { var yy = y + f + 10 + j * 6.8; g += numero(v[0], x + w * .73, yy, 4, C, .6, op(.88)); if (v[1]) g += "<path d='M" + q(x + w * .73 - 6, yy + 1.8) + " L" + q(x + w * .73 + 6, yy - 1.6) + "' stroke='" + C + "' stroke-width='.45' opacity='.8'/>"; });
    s += g;
    // il gessetto sul bordino in basso e quello appeso allo spago
    s += rett(x + w * .55, y + h - 2.6, 6, 1.6, .8, "#f4f1e6", bordo(L, .4)) + tratto("M" + q(x + w + .5, y + 6) + " Q" + q(x + w + 3, y + 16) + " " + q(x + w + 2.2, y + 24), "#d8cfc0", .4) + rett(x + w + 1.4, y + 24, 1.7, 5.2, .7, "#f4f1e6", bordo(L, .4));
    return s;
  });

  // =========================================================
  //  RASTRELLIERA DELLE STECCHE (sul muro): la cornice di noce col fregio a volute e la targhetta d'ottone,
  //  la sbarra in alto con gli incavi e quella in basso con le coppette; quattro stecche (punta blu, ghiera bianca,
  //  fusto d'acero, punte d'ebano, fasciatura colorata, calcio scuro) e un posto vuoto: quella è sul biliardo
  // =========================================================
  function steccaRitta(x, yT, yB, giro2) {
    var Lh = yB - yT, s = "";
    function wd(y) { var t = (y - yT) / Lh; return 1.5 + 1.9 * Math.pow(Math.max(0, t), 1.2); }
    function pz(y0, y1, fill) { var w0 = wd(y0) / 2, w1 = wd(y1) / 2; return poly([[x - w0, y0], [x + w0, y0], [x + w1, y1], [x - w1, y1]], fill); }
    function cil(c) { return lin("st" + c.slice(1), [[0, chiaro(c, .35)], [.35, c], [1, scuro(c, .45)]], 0, 0, 1, 0); }
    var yJ = yT + Lh * .5, yF = yT + Lh * .7, yW = yT + Lh * .88, sag = [[x - wd(yT) / 2, yT], [x + wd(yT) / 2, yT], [x + wd(yB) / 2, yB], [x - wd(yB) / 2, yB]];
    s += poly(sag.map(function (p2) { return [p2[0] + 1.5, p2[1] + 1.2]; }), "#000", op(.16));   // l'ombra sul muro
    s += poly(sag, "none", bordo(L, 1.3));
    s += pz(yT, yT + 1.1, cil("#3b6fb0")) + pz(yT + 1.1, yT + 2.7, cil("#f4f1e8")) + pz(yT + 2.7, yJ, cil("#efd6a2")) + pz(yJ, yJ + 1.3, cil("#f4f1e8")) + pz(yJ + 1.3, yF, cil("#e3bf86"));
    var w = wd(yF);
    s += poly([[x - w * .3, yF], [x + w * .3, yF], [x, yJ + 5]], "#2a1710") + poly([[x - w / 2, yF], [x - w * .38, yF], [x - wd(yJ + 6) / 2, yJ + 6]], "#2a1710") + poly([[x + w * .38, yF], [x + w / 2, yF], [x + wd(yJ + 6) / 2, yJ + 6]], "#2a1710");   // le punte d'ebano
    s += pz(yF, yW, cil(giro2));
    for (var y = yF + 1; y < yW; y += 1.3) s += "<path d='M" + q(x - wd(y) / 2, y) + " L" + q(x + wd(y) / 2, y + .7) + "' stroke='#000' stroke-width='.25' opacity='.35'/>";   // la fasciatura
    s += pz(yW, yW + .8, cil("#d9dde0")) + pz(yW + .8, yB - 1.5, cil("#3a1f14")) + pz(yB - 1.5, yB, cil("#1d1d1f"));
    return s + "<path d='M" + q(x - wd(yT + 3) * .2, yT + 3) + " L" + q(x - wd(yB - 3) * .2, yB - 3) + "' stroke='#ffffff' stroke-width='.5' opacity='.45'/>";
  }
  def("rastrelliera_stecche", { tipo: "parete", nome: "Rastrelliera delle stecche" }, function () {
    var s = "", LG = "#6e3e22", X = [14.5, 23, 31.5, 40, 48.5], yT = 80, yB = 175;
    function legnoP(nome) { return lin(nome, [[0, chiaro(LG, .3)], [.5, LG], [1, scuro(LG, .3)]], 0, 0, 0, 1); }
    // l'ombra sul muro, i montanti, il fregio, le due sbarre
    var sag = rettD(6, 96, 4.2, 82, 1) + " " + rettD(51.8, 96, 4.2, 82, 1) + " " + rettD(4.5, 98, 53, 8, 1.2) + " " + rettD(4.5, 168, 53, 8, 1.2) + " M10,99 C10,92 16,87.5 23,87 C26,86.8 27,84.5 31,84.5 C35,84.5 36,86.8 39,87 C46,87.5 52,92 52,99 Z";
    s += ombraMuro(sag, 1.6, 2.2);
    s += rett(6, 96, 4.2, 82, 1, lin("mt", [[0, chiaro(LG, .25)], [1, scuro(LG, .35)]], 0, 0, 1, 0), bordo(L, 1.1)) + rett(51.8, 96, 4.2, 82, 1, lin("mt2", [[0, chiaro(LG, .2)], [1, scuro(LG, .4)]], 0, 0, 1, 0), bordo(L, 1.1));
    s += pth("M10,99 C10,92 16,87.5 23,87 C26,86.8 27,84.5 31,84.5 C35,84.5 36,86.8 39,87 C46,87.5 52,92 52,99 Z", legnoP("fr"), bordo(L, 1.2));   // il fregio
    s += pth("M14,97 C15,92 19,90.5 22,92 C24,93 23,95.5 21,95.2", "none", "stroke='" + scuro(LG, .45) + "' stroke-width='.7'") + pth("M48,97 C47,92 43,90.5 40,92 C38,93 39,95.5 41,95.2", "none", "stroke='" + scuro(LG, .45) + "' stroke-width='.7'");   // le volute
    s += ell(31, 91.5, 4.6, 2.8, lin("tg", [[0, "#fff3c2"], [.5, "#e2b444"], [1, "#8a5c12"]], 0, 0, 1, 1), bordo(L, .6)) + ell(30, 90.6, 1.8, .8, "#ffffff", op(.6));   // la targhetta d'ottone
    s += rett(4.5, 98, 53, 8, 1.2, legnoP("sb"), bordo(L, 1.3)) + rett(5.5, 99, 51, 1.2, .6, "#ffffff", op(.22));
    X.forEach(function (x, i) { if (i === 3) s += pth("M" + q(x - 2.4, 98.2) + " Q" + q(x, 103) + " " + q(x + 2.4, 98.2) + " Z", "#1e100a", op(.85)); });   // l'incavo vuoto
    s += rett(4.5, 168, 53, 8, 1.2, legnoP("sb2"), bordo(L, 1.3)) + rett(5.5, 169, 51, 1.2, .6, "#ffffff", op(.22));
    X.forEach(function (x) { s += ell(x, 169.5, 3.4, 1.3, "#1e100a", op(.85)); });   // le coppette
    // le stecche (la quarta manca: è sul biliardo)
    var giri = ["#2b5f3a", "#1f2b4a", "#7a1f1f", null, "#2d2d30"];
    X.forEach(function (x, i) {
      if (!giri[i]) return;
      s += steccaRitta(x, yT + (i % 2) * 1.6, yB - 3.5, giri[i]);
      s += ell(x, 102.2, 2.6, 1, "#000", op(.25));   // l'incavo dove sta appoggiata
    });
    X.forEach(function (x) { s += pth("M" + q(x - 3.4, 169.5) + " A3.4,1.3 0 0,0 " + q(x + 3.4, 169.5) + " L" + q(x + 3, 171.2) + " A3,1.1 0 0,1 " + q(x - 3, 171.2) + " Z", lin("cp", [[0, "#fff3c2"], [.5, "#d9a83a"], [1, "#7a5614"]], 0, 0, 1, 0), bordo(L, .5)); });   // il labbro d'ottone delle coppette
    // i gessetti blu sulla sbarra in basso
    [[8.6, 1], [53.4, 0]].forEach(function (g) { s += rett(g[0] - 2.2, 163.6, 4.4, 4.4, .6, lin("gs" + g[1], [[0, "#5c8fe6"], [1, "#1f4f9c"]], 0, 0, 1, 1), bordo(L, .5)) + rett(g[0] - 1.2, 163.6, 2.4, 1.2, .4, "#a9c4f2"); });
    return s;
  });

  // =========================================================
  function misure(d) { if (d.tipo === "parete") return { w: 62, h: 200 }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), tipo = d.tipo || "piedi", o = { tipo: tipo, nome: d.nome, stanza: "circolo", reparto: "circolo", w: m.w, h: m.h, fp: (d.fp || [1, 1]).slice(), prezzo: 0, qual: 2 };
      if (tipo !== "parete") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
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
      p = "ctav" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!opz.notte;
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      var corpoSvg = d.tipo === "parete" ? c : "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g>";
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + corpoSvg + "</svg>";
    }
  });
})();

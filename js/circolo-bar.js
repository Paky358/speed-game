/* =========================================================
   SPeeD GAME — IL CIRCOLO: IL BAR, LA TV, LE COPPE E IL SALOTTO (visti dall'alto, come i mobili della casa)
   Il circolo ricreativo di paese, anni '60-'80 ma tenuto bene: il bancone di legno col piano di marmo e la macchina
   dell'espresso a leva, gli sgabelli di legno e ottone, la vetrina delle coppe coi gagliardetti, la TV con la partita,
   il ventilatore al soffitto, la foto in bianco e nero della squadra, la bandiera, il calendario col torneo di scopa,
   la vecchia poltrona di pelle, il tavolino coi giornali rosa e l'attaccapanni. Caldo e familiare, non di lusso.
   Una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   - "piedi": il davanti guarda in basso a sinistra; con { dietro: true } lo stesso oggetto girato (si vede la schiena).
   - "sospeso": come i "piedi" ma appeso in alto (il ventilatore): sotto si cammina.
   - "parete": disegno piatto di fronte, 62 × 200 per ogni pezzo di muro (quelli larghi 124 × 200, fp [2, 1]).
   Con { notte: true } le cose che fanno luce sono accese; info().luce = [x, y, raggio, colore] dice da dove esce la luce.
   Non si vendono nel negozio: reparto "circolo", prezzo 0. Si aggiungono con SGMobiliArte.aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte || !window.SGMobiliArte.aggiungi) return;

  // ---------- attrezzi (gli stessi degli altri mobili) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato; NOTTE = luci accese
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
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f2(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f2(rx) + "' ry='" + f2(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f1(x) + "' y='" + f1(y) + "' width='" + f1(w) + "' height='" + f1(h) + "'" + (r ? " rx='" + f1(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + f2(w == null ? 2.4 : w) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f2(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q(a) + " L" + q(b); }
  function chiuso(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function aperto(a) { return "M" + a.map(function (x) { return q(x); }).join(" L"); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function curva(pp) {   // una linea morbida che passa vicino ai punti
    var d = "M" + q(pp[0]), i;
    for (i = 1; i < pp.length - 1; i++) d += " Q" + q(pp[i]) + " " + q([(pp[i][0] + pp[i + 1][0]) / 2, (pp[i][1] + pp[i + 1][1]) / 2]);
    return d + " L" + q(pp[pp.length - 1]);
  }
  function cerD(x, y, r) { return "M" + q(x - r, y) + " A" + f2(r) + "," + f2(r) + " 0 1,0 " + q(x + r, y) + " A" + f2(r) + "," + f2(r) + " 0 1,0 " + q(x - r, y) + " Z"; }
  function rettD(x, y, w, h, r) {
    if (!r) return "M" + q(x, y) + " H" + f1(x + w) + " V" + f1(y + h) + " H" + f1(x) + " Z";
    return "M" + q(x + r, y) + " H" + f1(x + w - r) + " Q" + q(x + w, y) + " " + q(x + w, y + r) + " V" + f1(y + h - r) + " Q" + q(x + w, y + h) + " " + q(x + w - r, y + h) + " H" + f1(x + r) + " Q" + q(x, y + h) + " " + q(x, y + h - r) + " V" + f1(y + r) + " Q" + q(x, y) + " " + q(x + r, y) + " Z";
  }
  function rientra(a, d) {   // la stessa forma, più stretta di d tutto attorno
    var cx = 0, cy = 0; a.forEach(function (x) { cx += x[0]; cy += x[1]; }); cx /= a.length; cy /= a.length;
    return a.map(function (x) { var dx = x[0] - cx, dy = x[1] - cy, l = Math.sqrt(dx * dx + dy * dy) || 1; return [x[0] - dx / l * d, x[1] - dy / l * d]; });
  }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  function tono(c, t) { return t >= 0 ? chiaro(c, Math.min(.85, t)) : scuro(c, Math.min(.85, -t)); }
  function vivo(c) { return NOTTE ? chiaro(c, .15) : c; }   // di notte, dentro la vetrinetta illuminata, i colori brillano
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
  function dentro(forma, corpo, pari) {   // corpo ritagliato dentro la forma (un tracciato "d"); pari = la forma ha dei buchi
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'" + (pari ? " clip-rule='evenodd'" : "") + "/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  function ruota(x, y, ang, c) { return "<g transform='rotate(" + f1(ang) + " " + f1(x) + " " + f1(y) + ")'>" + c + "</g>"; }
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];
  var OTTONE = [[0, "#fff6cf"], [.3, "#f3d27a"], [.62, "#c99a36"], [1, "#7a5614"]];
  var ORO = [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]];
  var CER = [[0, "#ffffff"], [.4, "#f4f8fa"], [.78, "#d5dee4"], [1, "#adbac3"]];   // la ceramica bianca
  var NERO = [[0, "#6c737a"], [.3, "#2e3236"], [1, "#0d0f11"]];                     // la bachelite nera
  function cromo(d, w) { return tratto(d, L, w + 2.2) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.5, w * .38), "opacity='.95' transform='translate(-.35 -.45)'"); }   // un tubo cromato
  function ottone(d, w) { return tratto(d, L, w + 2.2) + tratto(d, "#c99a36", w) + tratto(d, "#fff3c4", Math.max(.5, w * .36), "opacity='.95' transform='translate(-.35 -.45)'"); }   // un tubo d'ottone
  function tinteDi(stops, k) { return [nuova([[0, stops[0][1]], [1, stops[1][1]]], 0, 0, 1, 1), nuova([[0, stops[1][1]], [1, stops[2][1]]], 0, 0, 0, 1), nuova([[0, stops[2][1]], [1, stops[3][1]]], 0, 0, 0, 1)]; }   // le tre facce di un blocco di metallo

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf == null ? ra : rf, rr: rr == null ? (rf == null ? ra : rf) : rr, e: e || 2 }; }
  function giro(F, z, k, n) {   // i punti sullo schermo del bordo della forma all'altezza z (k = grandezza, anche [ka, kb])
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
    return pth(chiuso(pp), lin("cx", stops, b[0], 0, b[2], 0, true), bordo(L, lw == null ? 2.4 : lw));
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
    var s = faccia(D, 1, (f.vuoto && G > 0 ? "" : rett(0, 0, Ws, H, 0, c[1])) + (fs ? fs(Ws, H) : "")) + faccia(C, -1, rett(0, 0, Wd, H, 0, c[2]) + (f.fianco ? f.fianco(Wd, H) : "")) + poly([A, B, C, D], c[0]);   // vuoto: il davanti si disegna da sé (la vetrina)
    if (f.sopra) s += f.sopra(A, B, C, D);
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), L, .8, op(.75));   // gli spigoli di dentro, sottili
    if (H > 4) s += tratto("M" + q(D[0] + 1.2, D[1] + 1) + " L" + q(C[0] - .5, C[1] + .9), "#ffffff", .9, op(.55));   // il filo di luce sullo spigolo davanti
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, lw || 1.8));
  }
  function piano(O, X, Y, W, H, c) {   // un disegno piatto W × H steso su un piano qualsiasi: O = il suo angolo in alto a sinistra, X = la fine della riga di sopra, Y = la fine del lato di sinistra
    var m = [(X[0] - O[0]) / W, (X[1] - O[1]) / W, (Y[0] - O[0]) / H, (Y[1] - O[1]) / H, O[0], O[1]];
    return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>";
  }
  // un disegno piatto su un piano dritto, girato verso chi guarda: asse "a" = il piano a b fisso (largo lungo a), asse "b" = il piano ad a fisso; y piatta = z1 - z
  function pianoV(asse, fisso, t0, t1, z0, z1, cont) {
    var W = Math.abs(t1 - t0) * 61, H = z1 - z0, lo = Math.min(t0, t1), hi = Math.max(t0, t1), s, e;
    if (asse === "a") { s = G > 0 ? lo : hi; e = G > 0 ? hi : lo; return piano(P(s, fisso, z1), P(e, fisso, z1), P(s, fisso, z0), W, H, cont); }
    s = G > 0 ? hi : lo; e = G > 0 ? lo : hi; return piano(P(fisso, s, z1), P(fisso, e, z1), P(fisso, s, z0), W, H, cont);
  }
  function buio(W, H, k, su) {   // l'ombra morbida in un angolo: un rettangolo che sfuma (su = scuro in alto)
    return rett(0, 0, W, H, 0, nuova(su ? [[0, "#000", k], [1, "#000", 0]] : [[0, "#000", 0], [1, "#000", k]], 0, 0, 0, 1));
  }

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
  var PELLE = { lucido: .45, esp: 12 }, MARMO_L = { lucido: .55, esp: 20 }, CROMATO = { lucido: 1, esp: 5, forza: 1.7 }, LEGNO_L = { lucido: .35, esp: 16 };

  // ---------- i pezzi tirati: una sezione tirata lungo un asse ----------
  // asse "a": la sezione è fatta di punti [b, z] e va da a = t0 ad a = t1; asse "b": punti [a, z], da b = t0 a b = t1.
  // o = { mat, fascia(H) = disegni sulla parte tirata, tappo(T) = disegni sul tappo che si vede (piatto), tappoCol, lw, ao, aoH }
  function arcoS(cx, cz, rx, rz, a0, a1, n) { var o = [], i; for (i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(t), cz + rz * Math.sin(t)]); } return o; }
  function pulisci(a) { return a.filter(function (x, i) { var y = a[(i + a.length - 1) % a.length]; return Math.abs(x[0] - y[0]) > 1e-4 || Math.abs(x[1] - y[1]) > 1e-3; }); }
  function tondo(x0, x1, z0, z1, r, pancia, rb) {   // la sezione di un cuscino: r = raggio degli spigoli di sopra (mattonelle); pancia = quanto si gonfia sopra (unità)
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
    var nn = A ? [-.4472, .8944] : [.4472, .8944];   // sullo schermo, di traverso all'asse
    function sp(w) { return w[0] * nn[0] + w[1] * nn[1]; }
    var area = 0, en = [];
    for (i = 0; i < n; i++) { var u1 = prof[i], u2 = prof[(i + 1) % n]; area += (u1[0] * u2[1] - u2[0] * u1[1]) / 61; }
    var sg = area > 0 ? 1 : -1, zb = Math.min.apply(null, prof.map(function (x) { return x[1]; }));
    function tv2(nrm, z) { var col = tinta(c, nrm, m), f = o.ao ? Math.max(0, 1 - (z - zb) / (o.aoH || 8)) : 0; return f > 0 ? mix(col, "#000000", o.ao * f * f) : col; }
    for (i = 0; i < n; i++) {   // la normale di ogni lato della sezione, nella vista
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
      if (va && vb && dot(ea, eb) < .8) { var prima = sp(capV[(i + n - 1) % n]) < s; voci.push({ s: s, c: [tv2(prima ? ea : eb, zz), tv2(prima ? eb : ea, zz)] }); }   // uno spigolo vivo: due colori nello stesso punto
      else voci.push({ s: s, c: [tv2(nm, zz)] });
    }
    voci.sort(function (x, y) { return x.s - y.s; }); vis.sort(function (x, y) { return x.s - y.s; });
    var smin = 1e9, smax = -1e9; sil.forEach(function (w) { var v = sp(w); if (v < smin) smin = v; if (v > smax) smax = v; });
    var st = []; voci.forEach(function (v) { v.c.forEach(function (cc) { st.push([f2(Math.max(0, Math.min(1, (v.s - smin) / (smax - smin || 1)))), cc]); }); });
    if (!st.length) st = [[0, c], [1, c]];
    var r = pth(dSil, nuova(st, nn[0] * smin, nn[1] * smin, nn[0] * smax, nn[1] * smax, true));
    var xs = prof.map(function (x) { return x[0]; }), zs = prof.map(function (x) { return x[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
    var H = {   // gli aiuti per decorare
      p3: p3, sil: sil, capV: capV, kLuce: kLuce, tv: tv,
      luccica: function (k, a, b) { var pp = this.lungo(kLuce, t0 + (t1 - t0) * (a || .06), t0 + (t1 - t0) * (b || .94)); return tratto(aperto(pp), "#ffffff", 1.2, op(k || .5)) + tratto(aperto(pp), "#ffffff", 3, op((k || .5) * .25)); },
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
    r += pth(dCap, "none", "stroke='" + L + "' stroke-width='.9' stroke-linejoin='round' opacity='.7'");
    return r + pth(dSil, "none", bordo(L, o.lw || 2));
  }
  function cordone(d, c, w) { w = w || 1.3; return tratto(d, scuro(c, .42), w + .5, op(.85)) + tratto(d, chiaro(c, .32), w * .45, "opacity='.75' transform='translate(-.3 -.4)'"); }   // il cordoncino della pelle

  // ---------- i pezzi torniti (colonne, bottiglie, tazzine): prof = [[z, raggio in mattonelle], ...] dal basso in alto ----------
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
    var o = pth(dTornito(a, b, prof), lin("tn", stops, c[0] - rm, 0, c[0] + rm, 0, true), bordo(L, lw == null ? 1.2 : lw));
    (anelli || []).forEach(function (k) { var rx = prof[k][1] * 70.71, y = c[1] - prof[k][0]; o += pth("M" + q(c[0] - rx, y) + " A" + f1(rx) + "," + f1(rx / 2) + " 0 0,0 " + q(c[0] + rx, y), "none", "stroke='" + L + "' stroke-width='.5' opacity='.5'"); });
    if (luce) o += tratto("M" + prof.slice(1, n - 1).map(function (x) { return q(c[0] - x[1] * 70.71 * .5, c[1] - x[0]); }).join(" L"), "#ffffff", luce, op(.5));
    return o;
  }
  function bocca(a, b, z, r, fill, x2) { var c = P(a, b, z); return ell(c[0], c[1], r * 70.71, r * 35.36, fill, x2); }   // il cerchio orizzontale (la bocca, il tappo) visto dall'alto
  function fasciaT(a, b, z0, z1, r) {   // la fascia attorno a un pezzo tornito dritto (l'etichetta): il tracciato
    var c = P(a, b, 0), rx = r * 70.71, ry = rx / 2, y0 = c[1] - z0, y1 = c[1] - z1;
    return "M" + q(c[0] - rx, y1) + " A" + f1(rx) + "," + f1(ry) + " 0 0,0 " + q(c[0] + rx, y1) + " L" + q(c[0] + rx, y0) + " A" + f1(rx) + "," + f1(ry) + " 0 0,1 " + q(c[0] - rx, y0) + " Z";
  }
  function anello(a, b, z, R, w, vicina, ott) {   // un anello orizzontale (poggiapiedi): la metà lontana o quella vicina
    var c = P(a, b, z), rx = R * 70.71, ry = R * 35.36, pp = [], i;
    for (i = 0; i <= 28; i++) { var t = (vicina ? 0 : Math.PI) + Math.PI * i / 28; pp.push([c[0] + rx * Math.cos(t), c[1] + ry * Math.sin(t)]); }
    return ott ? ottone(aperto(pp), w) : cromo(aperto(pp), w);
  }

  // ---------- le gambe, le ombre, l'ordine dei pezzi ----------
  function gambaTonda(T, F, w0, w1, stops, puntale) {   // una gamba tonda e affusolata da T (in alto) a F (il piede), punti [a, b, z]
    var t = P(T[0], T[1], T[2]), f = P(F[0], F[1], F[2]), dx = f[0] - t[0], dy = f[1] - t[1], l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
    if (nx > 0) { nx = -nx; ny = -ny; }
    var a = [t[0] + nx * w0, t[1] + ny * w0], b = [t[0] - nx * w0, t[1] - ny * w0], c = [f[0] - nx * w1, f[1] - ny * w1], d = [f[0] + nx * w1, f[1] + ny * w1];
    var s = poly([a, b, c, d], nuova(stops, a[0], a[1], b[0], b[1], true), bordo(L, 1));
    if (puntale) { var k = .22, pa = lerp(d, a, k), pb = lerp(c, b, k); s += poly([pa, pb, c, d], nuova(puntale, pa[0], pa[1], pb[0], pb[1], true), bordo(L, .8)); }
    return s + tratto(linea([t[0] + nx * w0 * .4, t[1] + ny * w0 * .4], [f[0] + nx * w1 * .4, f[1] + ny * w1 * .4]), "#ffffff", .6, op(.5));
  }
  function aTerra(c) { return "<g transform='matrix(50 25 -50 25 0 0)'>" + c + "</g>"; }
  function ombraSotto(a0, a1, b0, b1, k) {   // il buio sotto un mobile alzato sui piedini
    var u0 = Math.min(G * a0, G * a1), v0 = Math.min(G * b0, G * b1);
    return aTerra("<rect x='" + f2(u0 + .02) + "' y='" + f2(v0) + "' width='" + f2(Math.abs(a1 - a0)) + "' height='" + f2(Math.abs(b1 - b0)) + "' rx='.06' fill='" + rad("oms", [[0, "#000", .5], [.7, "#000", .35], [1, "#000", 0]], .5, .5, .55) + "' " + op(k || .3) + "/>");
  }
  function ombraPianta(a0, a1, b0, b1, k, pad) {   // l'ombra morbida stesa sul pavimento (un po' a destra: la luce viene da sinistra)
    pad = pad == null ? .1 : pad;
    var cu = G * (a0 + a1) / 2 + .05, cv = G * (b0 + b1) / 2 - .01;
    return aTerra("<ellipse cx='" + f2(cu) + "' cy='" + f2(cv) + "' rx='" + f2((a1 - a0) / 2 + pad) + "' ry='" + f2((b1 - b0) / 2 + pad) + "' fill='" + rad("omp", [[0, "#000", .24], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>");
  }
  function ombraTonda(a, b, r, k) { return aTerra("<circle cx='" + f2(G * a + .04) + "' cy='" + f2(G * b) + "' r='" + f2(r) + "' fill='" + rad("omt", [[0, "#000", .26], [.55, "#000", .15], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>"); }
  function inOrdine(l) {   // i pezzi dal più lontano al più vicino: box = [a0, a1, b0, b1, z0, z1]
    var n = l.length, fatto = [], out = "", k, i, j;
    function sov(x0, x1, y0, y1) { return x0 < y1 - 1e-6 && y0 < x1 - 1e-6; }
    function prima(A, B) {
      var a = A.box, b = B.box, sa = sov(a[0], a[1], b[0], b[1]), sb = sov(a[2], a[3], b[2], b[3]);
      if (sa && sb) return a[4] < b[4] - 1e-6 || (Math.abs(a[4] - b[4]) < 1e-6 && (A.ord || 0) < (B.ord || 0));
      if (sb && !sa) return G * (a[0] + a[1]) < G * (b[0] + b[1]);
      if (sa && !sb) return G * (a[2] + a[3]) < G * (b[2] + b[3]);
      return G * (a[0] + a[1] + a[2] + a[3]) < G * (b[0] + b[1] + b[2] + b[3]);
    }
    for (k = 0; k < n; k++) {
      for (i = 0; i < n; i++) { if (fatto[i]) continue; for (j = 0; j < n; j++) if (j !== i && !fatto[j] && prima(l[j], l[i])) break; if (j === n) break; }
      if (i === n) for (i = 0; fatto[i]; i++);
      fatto[i] = true; out += l[i].s;
    }
    return out;
  }
  function chiodi(pp, r) {   // i chiodini d'ottone
    var g = rad("chd", [[0, "#fffbe0"], [.35, "#f1cf6e"], [.75, "#b5862a"], [1, "#6e4c10"]], .38, .32, .7);
    return pp.map(function (w) { return cer(w[0] + .25, w[1] + .35, r || .7, "#000", op(.3)) + cer(w[0], w[1], r || .7, g, "stroke='#5a3c0c' stroke-width='.25'"); }).join("");
  }
  function venature(W, H, n, seme, c, k, x0, y0) {   // le venature del legno, quasi dritte (in verticale)
    var o = "", rr = rnd(seme), i; x0 = x0 || 0; y0 = y0 || 0;
    for (i = 0; i < n; i++) { var x = x0 + rr() * W, w = .3 + rr() * .55; o += pth("M" + q(x, y0) + " Q" + q(x + (rr() - .5) * 3, y0 + H * .5) + " " + q(x + (rr() - .5) * 2, y0 + H), "none", "stroke='" + (rr() < .5 ? chiaro(c, .25) : scuro(c, .3)) + "' stroke-width='" + f1(w) + "' " + op(k || .35)); }
    return o;
  }
  function venatureO(W, H, n, seme, c, k, x0, y0) {   // le venature in orizzontale
    var o = "", rr = rnd(seme), i; x0 = x0 || 0; y0 = y0 || 0;
    for (i = 0; i < n; i++) { var y = y0 + rr() * H, w = .3 + rr() * .5; o += pth("M" + q(x0, y) + " Q" + q(x0 + W * .5, y + (rr() - .5) * 2.4) + " " + q(x0 + W, y + (rr() - .5) * 1.6), "none", "stroke='" + (rr() < .5 ? chiaro(c, .25) : scuro(c, .3)) + "' stroke-width='" + f1(w) + "' " + op(k || .35)); }
    return o;
  }
  function riquadro(x, y, w, h, c, seme, r) {   // il riquadro in rilievo col filetto chiaro (l'intarsio)
    r = r == null ? 2.4 : r;
    var o = rett(x + .7, y + .9, w, h, r, "#000", op(.2));
    o += rett(x, y, w, h, r, lin("rq" + c.slice(1), [[0, chiaro(c, .18)], [1, scuro(c, .05)]], 0, 0, 1, 1), "stroke='" + scuro(c, .5) + "' stroke-width='.6'");
    o += dentro(rettD(x, y, w, h, r), venature(w, h, Math.max(3, Math.round(w / 5)), seme, c, .4, x, y));
    if (w > 9 && h > 9) o += rett(x + 2.6, y + 2.6, w - 5.2, h - 5.2, Math.max(.6, r - 1), "none", "stroke='" + chiaro(c, .52) + "' stroke-width='.7' opacity='.9'");
    return o + tratto("M" + q(x + .9, y + h - 1.2) + " L" + q(x + .9, y + .9) + " L" + q(x + w - 1.2, y + .9), "#ffffff", .6, op(.45));
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  var NOCE = "#8e5a32", NOCE_SC = "#5a3519", MIELE = "#b07a45";

  // =========================================================
  //  IL BANCONE DEL BAR (anni '60): il davanti di noce a riquadri con l'intarsio chiaro, le fasce e il poggiapiedi d'ottone,
  //  il piano di marmo bianco di Carrara col bordo tondo. Sopra: la vetrinetta delle paste (cornetti, bomboloni, cannoli, bignè),
  //  le bottiglie di amaro coi dosatori, le tazzine col piattino, il bicchiere d'acqua e lo zucchero, la radio di legno
  //  e la macchina dell'espresso a leva, cromata, coi due gruppi e le leve col pomello nero.
  //  Da dietro (la parte del barista): le nicchie con le tazzine impilate, i bicchieri, la cassetta delle bibite,
  //  i gruppi della macchina coi portafiltri e la tazzina sotto il beccuccio.
  // =========================================================
  def("bancone_circolo", { nome: "Bancone del bar", fp: [3, 1], box: [-93, -132, 93, 48], dietro: true, piano: 64, luce: [0, -.01, 72, 100, "#ffe2a8"] }, function () {
    var A0 = -1.42, A1 = 1.42, B0 = -.3, B1 = .22, ZP = 6, ZB = 58.5, ZT = 64, r = rnd(6401);
    var s = ombraPianta(A0, A1, -.34, .34, .9, .12);
    // ---- il mobile: lo zoccolo scuro, il corpo di noce, il poggiapiedi d'ottone ----
    function davanti(W, H) {
      var o = venature(W, H, 50, 3, NOCE, .28), n = 4, m = 6, gap = 7, pw = (W - 2 * m - gap * (n - 1)) / n, i;
      for (i = 0; i < n; i++) o += riquadro(m + i * (pw + gap), 7.5, pw, H - 17.5, MIELE, 20 + i);
      for (i = 0; i <= n; i++) {   // le lesene tra un riquadro e l'altro, un po' in rilievo
        var xl = i === 0 ? 1.2 : i === n ? W - 4.4 : m + i * (pw + gap) - gap / 2 - 1.6;
        o += rett(xl, 4, 3.2, H - 7, .8, lin("ls", [[0, chiaro(NOCE, .2)], [.5, NOCE], [1, scuro(NOCE, .3)]], 0, 0, 1, 0), "stroke='" + scuro(NOCE, .5) + "' stroke-width='.4'");
      }
      o += rett(0, 0, W, 2.6, 0, lin("fo", OTTONE, 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.4'") + rett(0, 2.6, W, 1, 0, "#000", op(.25));   // la fascia d'ottone sotto il marmo
      o += rett(0, H - 3.2, W, 3.2, 0, lin("fz", OTTONE, 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.4'");   // la fascia d'ottone in basso
      for (i = 0; i < 9; i++) o += cer(8 + i * (W - 16) / 8, H - 1.6, .45, "#7a5614");   // le viti della fascia
      return o + buio(W, 9, .42, true);   // l'ombra del marmo che sporge
    }
    function fianco(W, H) { return venature(W, H, 12, 9, NOCE, .28) + riquadro(4, 7.5, W - 8, H - 17.5, MIELE, 31) + rett(0, 0, W, 2.6, 0, lin("fo", OTTONE, 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.4'") + rett(0, H - 3.2, W, 3.2, 0, lin("fz", OTTONE, 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.4'") + buio(W, 7, .38, true); }
    function dietro(W, H) {   // dalla parte del barista: tre nicchie con le mensole
      var o = venature(W, H, 36, 11, NOCE, .28), xs = [3, 60.4, 117.8], bw = 54.4, k, j;
      xs.forEach(function (x) {
        o += rett(x, 5, bw, H - 10, 1, lin("ni", [[0, "#22160e"], [1, "#3d2a1c"]], 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.8'") + rett(x, 5, bw, 3, 0, "#000", op(.35)) + rett(x, 5, 2.2, H - 10, 0, "#000", op(.25));
        o += rett(x + .6, 24.5, bw - 1.2, 2, .4, lin("mn", [[0, chiaro(NOCE, .3)], [1, scuro(NOCE, .25)]], 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.4'");   // la mensola in mezzo
      });
      // prima nicchia: sopra le tazzine capovolte in fila, sotto le pile di piattini
      for (k = 0; k < 7; k++) { var cx = 7 + k * 7.2, yb = 24.5; o += pth("M" + q(cx - 2.6, yb) + " L" + q(cx - 2, yb - 3.6) + " Q" + q(cx, yb - 4.4) + " " + q(cx + 2, yb - 3.6) + " L" + q(cx + 2.6, yb) + " Z", "#f8f9fa", "stroke='#8a96a0' stroke-width='.35'") + rett(cx - 2.6, yb - .7, 5.2, .7, .3, "#c92a2a", op(.85)) + rett(cx - 1.6, yb - 3.2, .8, 2.4, .3, "#ffffff"); }
      for (j = 0; j < 4; j++) for (k = 0; k < 6; k++) { var px = 9 + j * 12.4, py = 49 - k * 1.25; o += ell(px, py, 5.2, 1.1, k % 2 ? "#eef1f3" : "#ffffff", "stroke='#8a96a0' stroke-width='.3'"); }
      // seconda nicchia: i bicchieri capovolti sullo strofinaccio, sotto la cassetta delle bibite
      o += rett(62, 23.2, 50, 1.6, .3, "#f8f9fa") + rett(62, 23.6, 50, .4, 0, "#e03131", op(.8));
      for (k = 0; k < 7; k++) { var gx = 65.5 + k * 6.6, gy = 23.2; o += pth("M" + q(gx - 2.4, gy) + " L" + q(gx - 1.9, gy - 7.6) + " L" + q(gx + 1.9, gy - 7.6) + " L" + q(gx + 2.4, gy) + " Z", "#d0ebff", "stroke='#8fb3c9' stroke-width='.4' fill-opacity='.65'") + rett(gx - 1.9, gy - 7.6, 3.8, 1.2, .3, "#a5d8ff", op(.7)) + rett(gx - 1.4, gy - 6.6, .5, 5, .25, "#ffffff", op(.8)); }
      o += rett(65, 34.5, 44, 13, .8, lin("cs", [[0, "#d9a066"], [1, "#9c6230"]], 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.6'") + rett(65, 38.5, 44, 1, 0, "#000", op(.2));   // la cassetta di legno
      for (k = 0; k < 6; k++) { var bx = 68.5 + k * 7.2, cc = k % 2 ? "#e8590c" : "#2f2a26"; o += rett(bx - 1.6, 27.5, 3.2, 8, 1.2, cc, "stroke='" + L + "' stroke-width='.35'") + rett(bx - .7, 24.6, 1.4, 3.4, .5, cc, "stroke='" + L + "' stroke-width='.3'") + rett(bx - .8, 24, 1.6, .9, .3, "#fab005", "stroke='" + L + "' stroke-width='.25'") + rett(bx - 1.1, 29, .6, 5, .3, "#ffffff", op(.5)); }
      // terza nicchia: sopra i sacchetti del caffè, sotto il portabottiglie del vino
      [[124, 0], [139, 1]].forEach(function (g) { o += pth("M" + q(g[0], 24.4) + " L" + q(g[0] + .6, 12) + " Q" + q(g[0] + 6, 10.4) + " " + q(g[0] + 11.4, 12) + " L" + q(g[0] + 12, 24.4) + " Z", g[1] ? "#c08a4a" : "#8a5a2b", "stroke='" + L + "' stroke-width='.45'") + rett(g[0] + 2.4, 15.4, 7.2, 5, .6, g[1] ? "#c92a2a" : "#2b8a3e", op(.85)) + cer(g[0] + 6, 17.9, 1.3, "#fff4d6"); });
      o += rett(154, 15, 8, 9.4, .6, "#1d1d1f", "stroke='" + L + "' stroke-width='.4'") + rett(154.6, 17.6, 6.8, .7, 0, "#868e96");   // il battifondi
      for (j = 0; j < 2; j++) for (k = 0; k < 7; k++) { var vx = 123.5 + k * 7.1, vy = 33 + j * 7.4; o += cer(vx, vy, 3.1, "#2a1d14") + cer(vx, vy, 2.5, nuovaR([[0, "#4b7a3a"], [1, "#132b12"]], .4, .35, .7), "stroke='" + L + "' stroke-width='.35'") + cer(vx - .7, vy - .8, .7, "#ffffff", op(.6)); }
      return o + buio(W, 9, .5, true);
    }
    function poggiapiedi() {   // il tubo d'ottone sulle staffe, e la sua ombra a terra
      var bb = B1 + .085, zz = 11, e0 = A0 + .12, e1 = A1 - .12, o = tratto(linea(P(e0, bb + .05, 0), P(e1, bb + .05, 0)), "#000", 5, op(.07));
      [-1.05, -.35, .35, 1.05].forEach(function (a) { o += ottone("M" + q(P(a, B1, zz + 4.4)) + " L" + q(P(a, bb, zz + .6)), 1.2); });
      o += ottone(linea(P(e0, bb, zz), P(e1, bb, zz)), 2.4);
      [e0, e1].forEach(function (a) { var c = P(a, bb, zz); o += cer(c[0], c[1], 1.8, lin("pt", OTTONE, 0, 0, 1, 1), bordo(L, .7)); });
      return o;
    }
    if (G < 0) s += poggiapiedi();
    s += blocco(A0 + .03, A1 - .03, B0 + .03, B1 - .04, 0, ZP, "#3a2a20", null, 1.4);
    s += blocco(A0, A1, B0, B1, ZP, ZB, NOCE, { davanti: davanti, dietro: dietro, fianco: fianco }, 2.2);
    if (G > 0) s += poggiapiedi();
    // ---- il piano di marmo bianco, spesso, col bordo tondo dalla parte dei clienti; le venature grigie ----
    var prof = [[-.34, ZB], [.27, ZB]].concat(arcoS(.27, (ZB + ZT) / 2, .03, (ZT - ZB) / 2, -Math.PI / 2, Math.PI / 2, 8).slice(1), [[-.34, ZT]]);
    s += estruso("a", pulisci(prof), A0 - .015, A1 + .015, "#e9e6df", {
      mat: MARMO_L, lw: 2.1,
      fascia: function (H) {
        var o = "", k, i;
        for (k = 0; k < 11; k++) {   // le venature: linee grigie che vagano, qualcuna si divide
          var b = -.3 + r() * .56, a = A0 + r() * .3, pp = [];
          for (i = 0; i < 9 && a < A1; i++) { pp.push(P(a, b, ZT)); a += .12 + r() * .28; b += (r() - .5) * .16; b = Math.max(-.32, Math.min(.27, b)); }
          if (pp.length > 2) o += tratto(curva(pp), r() < .4 ? "#8f969c" : "#b4b9bd", .3 + r() * .5, op(.75)) + tratto(curva(pp), "#c9cdd0", 2.4, op(.12));
        }
        var t0 = P(A0, -.34, ZT), t1 = P(A1, .3, ZT);
        for (k = 0; k < 3; k++) { var x0 = t0[0] + 34 + k * 46, w = k === 1 ? 14 : 8; o += poly([[x0, t0[1] - 6], [x0 + w, t0[1] - 6], [x0 + w - 44, t1[1] + 6], [x0 - 44, t1[1] + 6]], "#ffffff", op(k === 1 ? .22 : .14)); }   // i riflessi del marmo lucido
        return o + H.luccica(.7, .02, .98);
      }
    });
    // ---- le cose sopra il banco ----
    var sopra = [];
    // la vetrinetta delle paste: la base cromata, i ripiani coi pasticcini, il vetro coi riflessi, gli spigoli cromati
    (function () {
      var a0 = -1.36, a1 = -.8, b0 = -.2, b1 = .17, zb = ZT + 2.6, zm = ZT + 12.6, zv = ZT + 23;
      var o = blocco(a0, a1, b0, b1, ZT, zb, tinteDi(CROMO), null, 1.2);
      var u0 = G > 0 ? a0 : -a1, u1 = G > 0 ? a1 : -a0, v0 = G > 0 ? b0 : -b1, v1 = G > 0 ? b1 : -b0;
      function C(u, v, z) { return Puv(u, v, z); }
      var sil = [C(u0, v0, zv), C(u1, v0, zv), C(u1, v0, zb), C(u1, v1, zb), C(u0, v1, zb), C(u0, v1, zv)];
      var dentroV = "";
      if (NOTTE) dentroV += pth(chiuso(sil), nuovaR([[0, "#fff1c4", .78], [.6, "#ffd98a", .42], [1, "#ffc56b", .18]], .45, .5, .7));   // la lucina dentro la vetrinetta, morbida
      else dentroV += pth(chiuso(sil), nuova([[0, "#eaf6fb", .35], [1, "#cfe6ef", .25]], 0, 0, 0, 1));
      dentroV += poly([C(u0, v0, zb), C(u1, v0, zb), C(u1, v1, zb), C(u0, v1, zb)], NOTTE ? "#fff3d6" : "#f6f1e6");   // il fondo bianco
      dentroV += tratto(linea(C(u0, v0, zb), C(u0, v0, zv)) + " " + linea(C(u0, v0, zv), C(u1, v0, zv)) + " " + linea(C(u0, v0, zv), C(u0, v1, zv)), "#9aa5ad", .6, op(.8));   // gli spigoli lontani, sottili
      // i pasticcini: in basso i cornetti e i bomboloni sul vassoio d'argento, in alto i cannoli e i bignè nei pirottini
      function vassoio(z) { var pp = [P(a0 + .03, b0 + .03, z), P(a1 - .03, b0 + .03, z), P(a1 - .03, b1 - .03, z), P(a0 + .03, b1 - .03, z)]; return poly(pp, lin("vs", [[0, "#ffffff"], [.5, "#dfe5e9"], [1, "#aab5be"]], 0, 0, 1, 1), "stroke='#8a96a0' stroke-width='.4'") + poly(rientra(pp, 1.6), "none", "stroke='#ffffff' stroke-width='.5' opacity='.8'"); }
      function cornetto(a, b, z) {
        var c = P(a, b, z + 1.8), g = nuova([[0, vivo("#ffd27a")], [.45, vivo("#e39a3b")], [1, vivo("#9a5418")]], c[0] - 4, c[1] - 3, c[0] + 4, c[1] + 2, true);
        var d = "M" + q(c[0] - 4.4, c[1] + 1) + " Q" + q(c[0] - 3.4, c[1] - 2.9) + " " + q(c[0], c[1] - 2.8) + " Q" + q(c[0] + 3.4, c[1] - 2.9) + " " + q(c[0] + 4.4, c[1] + 1) + " Q" + q(c[0] + 2, c[1] - .2) + " " + q(c[0], c[1] + .4) + " Q" + q(c[0] - 2, c[1] - .2) + " " + q(c[0] - 4.4, c[1] + 1) + " Z";
        return pth(d, g, bordo(L, .5)) + tratto("M" + q(c[0] - 2.1, c[1] - 2.5) + " Q" + q(c[0] - 1.5, c[1] - .8) + " " + q(c[0] - 2.1, c[1] + .1) + " M" + q(c[0], c[1] - 2.8) + " L" + q(c[0], c[1] + .3) + " M" + q(c[0] + 2.1, c[1] - 2.5) + " Q" + q(c[0] + 1.5, c[1] - .8) + " " + q(c[0] + 2.1, c[1] + .1), "#8a4a14", .4, op(.85)) + ell(c[0] - 1, c[1] - 1.9, 1.3, .5, "#ffffff", op(.6));
      }
      function bombolone(a, b, z) { var c = P(a, b, z + 2.2); return cer(c[0], c[1], 2.6, nuovaR([[0, vivo("#ffe6b0")], [.55, vivo("#e5a452")], [1, vivo("#a8641e")]], .38, .32, .75), bordo(L, .45)) + [[-1, -.8], [.6, -1.3], [1.2, .3], [-.3, .8], [-1.3, .5], [.2, -.2]].map(function (w) { return cer(c[0] + w[0], c[1] + w[1], .36, "#ffffff", op(.95)); }).join("") + ell(c[0] - .9, c[1] - 1.2, .8, .45, "#ffffff", op(.55)); }
      function cannolo(a, b, z) {
        var c0 = P(a - .055, b, z + 1.7), c1 = P(a + .055, b, z + 1.7);
        return tratto(linea(c0, c1), L, 4.6) + tratto(linea(c0, c1), vivo("#b8732a"), 3.6) + tratto(linea([c0[0], c0[1] - .8], [c1[0], c1[1] - .8]), vivo("#e6ae63"), 1.1) +
          cer(c0[0], c0[1], 1.8, "#fffaf0", bordo(L, .4)) + cer(c1[0], c1[1], 1.8, "#fffaf0", bordo(L, .4)) + cer(c0[0] - .4, c0[1] - .3, .6, "#e03131") + cer(c1[0] + .4, c1[1] - .4, .6, "#2f9e44");
      }
      function bigne(a, b, z) {
        var c = P(a, b, z), o = pth("M" + q(c[0] - 2.6, c[1] - 1.1) + " L" + q(c[0] - 2.1, c[1] + .6) + " L" + q(c[0] + 2.1, c[1] + .6) + " L" + q(c[0] + 2.6, c[1] - 1.1) + " Z", "#ffffff", "stroke='#c9b99a' stroke-width='.35'");   // il pirottino di carta
        return o + pth("M" + q(c[0] - 2.4, c[1] - 1) + " Q" + q(c[0] - 2.4, c[1] - 4.4) + " " + q(c[0], c[1] - 4.5) + " Q" + q(c[0] + 2.4, c[1] - 4.4) + " " + q(c[0] + 2.4, c[1] - 1) + " Z", vivo("#e7b066"), bordo(L, .45)) + pth("M" + q(c[0] - 2.2, c[1] - 2.4) + " Q" + q(c[0], c[1] - 5.6) + " " + q(c[0] + 2.2, c[1] - 2.4) + " Q" + q(c[0], c[1] - 3.4) + " " + q(c[0] - 2.2, c[1] - 2.4) + " Z", vivo("#5a2e14")) + ell(c[0] - .8, c[1] - 3.7, .7, .3, "#ffffff", op(.6));
      }
      var basso = [[-1.26, -.11, cornetto], [-1.1, -.12, cornetto], [-.95, -.11, cornetto], [-1.22, .07, bombolone], [-1.07, .08, bombolone], [-.92, .07, bombolone]];
      var alto = [[-1.24, -.08, cannolo], [-1.08, -.07, cannolo], [-.93, -.09, bigne], [-1.23, .08, bigne], [-1.08, .08, bigne], [-.93, .07, bigne]];
      function fila(l, z) { return ordina(l.map(function (x) { return [vicino(x[0], x[1]), x[2](x[0], x[1], z)]; })); }
      dentroV += vassoio(zb + .3) + fila(basso, zb + .3);
      dentroV += poly([C(u0, v0, zm), C(u1, v0, zm), C(u1, v1, zm), C(u0, v1, zm)], "#e3f4fa", op(.55)) + tratto(linea(C(u0, v1, zm), C(u1, v1, zm)) + " " + linea(C(u1, v1, zm), C(u1, v0, zm)), "#ffffff", .7, op(.9));   // il ripiano di vetro
      dentroV += fila(alto, zm);
      o += dentroV;
      // i vetri vicini (davanti e fianco) coi riflessi, e il coperchio
      var fv = [C(u0, v1, zv), C(u1, v1, zv), C(u1, v1, zb), C(u0, v1, zb)], fd = [C(u1, v1, zv), C(u1, v0, zv), C(u1, v0, zb), C(u1, v1, zb)], top = [C(u0, v0, zv), C(u1, v0, zv), C(u1, v1, zv), C(u0, v1, zv)];
      o += poly(fv, "#e7f5ff", op(NOTTE ? .08 : .2)) + poly(fd, "#c5dce6", op(NOTTE ? .12 : .3)) + poly(top, "#f1f9ff", op(NOTTE ? .15 : .35));
      o += dentro(chiuso(fv), poly([lerp(fv[0], fv[1], .12), lerp(fv[0], fv[1], .3), lerp(fv[3], fv[2], .05), lerp(fv[3], fv[2], -.13)], "#ffffff", op(.4)) + poly([lerp(fv[0], fv[1], .38), lerp(fv[0], fv[1], .44), lerp(fv[3], fv[2], .25), lerp(fv[3], fv[2], .19)], "#ffffff", op(.3)));
      o += dentro(chiuso(fd), poly([lerp(fd[0], fd[1], .2), lerp(fd[0], fd[1], .45), lerp(fd[3], fd[2], .3), lerp(fd[3], fd[2], .05)], "#ffffff", op(.22)));
      o += dentro(chiuso(top), poly([lerp(top[0], top[1], .1), lerp(top[0], top[1], .35), lerp(top[3], top[2], .35), lerp(top[3], top[2], .1)], "#ffffff", op(.35)));
      if (G < 0) {   // dalla parte del barista: le due ante scorrevoli coi buchi per le dita
        o += tratto(linea(lerp(fv[0], fv[1], .5), lerp(fv[3], fv[2], .5)), "#9aa5ad", .9) + [.38, .62].map(function (t) { var m = lerp(lerp(fv[0], fv[3], .55), lerp(fv[1], fv[2], .55), t); return ell(m[0], m[1], .9, 1.2, "#ffffff", "stroke='#8a96a0' stroke-width='.35'"); }).join("");
      }
      function filo(d, w) { return tratto(d, "#59636b", w + .9) + tratto(d, "#eef2f5", w) + tratto(d, "#ffffff", w * .4, op(.9) + " transform='translate(-.2 -.3)'"); }   // gli spigoli cromati, sottili
      o += filo(linea(C(u0, v0, zv), C(u1, v0, zv)) + " " + linea(C(u0, v0, zv), C(u0, v1, zv)), .6);
      o += filo(linea(C(u0, v1, zv), C(u0, v1, zb)) + " " + linea(C(u1, v0, zv), C(u1, v0, zb)), .7) + filo(linea(C(u1, v1, zv), C(u1, v1, zb)), .8);
      o += filo(linea(C(u0, v1, zv), C(u1, v1, zv)) + " " + linea(C(u1, v1, zv), C(u1, v0, zv)), .9);
      var pm = P((a0 + a1) / 2, (b0 + b1) / 2, zv);   // il pomello del coperchio
      o += ell(pm[0], pm[1] - .5, 2.2, 1.2, lin("pv", CROMO, 0, 0, 1, 1), bordo(L, .45)) + ell(pm[0] - .6, pm[1] - .9, .7, .35, "#ffffff");
      sopra.push({ box: [a0, a1, b0, b1, ZT, zv + 2], s: o });
    })();
    // le bottiglie di amaro in fila contro il bordo di dietro, coi dosatori cromati
    var BOTT = [
      { a: -.69, h: 19, r: .043, v: "#3a2414", et: "#efe3c4", fa: "#b02a1e", tp: "#1d1d1f" },             // amaro scuro, l'etichetta crema col sigillo rosso
      { a: -.57, h: 21, r: .036, v: "#c81e2b", vetro: 1, et: "#f8f4ea", fa: "#c81e2b", dos: 1 },          // il bitter rosso, nel vetro chiaro
      { a: -.45, h: 23, r: .034, v: "#f2c230", vetro: 1, et: "#f7d860", fa: "#2a2a2a", dos: 1 },          // il liquore giallo, alto e stretto
      { a: -.33, h: 20, r: .046, v: "#8a4a1a", vetro: 1, et: "#f3e7c8", fa: "#7a3d14", tp: "#1d1d1f" },  // l'amaro ambrato con le spalle larghe
      { a: -.21, h: 19, r: .04, v: "#1f4a2a", et: "#cfe8c0", fa: "#2b6a3a", dos: 1 },                     // la bottiglia verde
      { a: -.09, h: 20, r: .041, v: "#2a1c14", et: "#f6e6a8", fa: "#3a2a1a", tp: "#1d1d1f" }              // l'amaro amaro, l'etichetta gialla con l'aquila
    ];
    function bottiglia(k, b) {
      var a = k.a, h = k.h, R = k.r, z = ZT, prof = [[z, R * .92], [z + .6, R], [z + h * .58, R], [z + h * .68, R * .72], [z + h * .76, R * .38], [z + h * .93, R * .34], [z + h * .97, R * .4], [z + h, R * .38]];
      var vc = vivo(k.v), st = k.vetro ? [[0, chiaro(vc, .5)], [.3, chiaro(vc, .1)], [.75, scuro(vc, .25)], [1, scuro(vc, .55)]] : [[0, chiaro(vc, .35)], [.3, vc], [1, scuro(vc, .55)]];
      var o = tornito(a, b, prof, st, 1, null, null), c = P(a, b, 0);
      if (k.vetro) o += pth(fasciaT(a, b, z + h * .62, z + h * .9, R * .5), "#ffffff", op(.18));   // il collo vuoto, più chiaro
      o += pth(fasciaT(a, b, z + h * .16, z + h * .46, R * 1.01), lin("et" + k.et.slice(1), [[0, chiaro(k.et, .4)], [.45, k.et], [1, scuro(k.et, .25)]], 0, 0, 1, 0), "stroke='" + L + "' stroke-width='.3'");   // l'etichetta
      o += pth(fasciaT(a, b, z + h * .38, z + h * .43, R * 1.012), k.fa, op(.9)) + cer(c[0] - .4, c[1] - z - h * .3, R * 22, k.fa, op(.85));   // la fascia e lo stemmino
      o += tratto(linea([c[0] - R * 70.71 * .45, c[1] - z - h * .08], [c[0] - R * 70.71 * .45, c[1] - z - h * .55]), "#ffffff", .7, op(.55));   // il riflesso sul vetro
      if (k.dos) {   // il dosatore cromato col beccuccio
        var t = P(a, b, z + h + 1.6), t2 = [t[0] + 1.6 * G, t[1] - 1.5];
        o += tornito(a, b, [[z + h - .4, R * .4], [z + h + 1.6, R * .36]], CROMO, .6) + tratto(linea(t, t2), L, 1.6) + tratto(linea(t, t2), "#d9dee2", .8);
      } else o += tornito(a, b, [[z + h - .5, R * .42], [z + h + 1.4, R * .42]], [[0, chiaro(k.tp, .3)], [1, k.tp]], .6) + bocca(a, b, z + h + 1.4, R * .42, scuro(k.tp, .2));   // il tappo
      return o;
    }
    BOTT.forEach(function (k, i) { var b = -.22 + (i % 2 ? .015 : -.01); sopra.push({ box: [k.a - k.r, k.a + k.r, b - k.r, b + k.r, ZT, ZT + k.h], s: bottiglia(k, b) }); });
    // le tazzine col piattino e il cucchiaino (una ancora piena), il bicchiere d'acqua, il dosatore dello zucchero
    function tazzina(a, b, piena) {
      var z = ZT, o = "", sp = forma(a, b, .058), tz = forma(a, b, .03);
      o += corpo([giro(sp, z, 1, 32), giro(sp, z + .9, 1, 32)], CER, .7) + pth(chiuso(giro(sp, z + .9, 1, 32)), "#f6f9fa", "stroke='#9aa5ad' stroke-width='.35'") + pth(chiuso(giro(sp, z + .95, .55, 24)), "none", "stroke='#c92a2a' stroke-width='.35' opacity='.7'");
      var cu = P(a, b, 0), mh = P(a + .042, b + .01, z + 3.4);
      o += tratto("M" + q(mh[0] - .6, mh[1] - 1.1) + " Q" + q(mh[0] + 1.3, mh[1] - .6) + " " + q(mh[0] - .4, mh[1] + .9), L, 1.3) + tratto("M" + q(mh[0] - .6, mh[1] - 1.1) + " Q" + q(mh[0] + 1.3, mh[1] - .6) + " " + q(mh[0] - .4, mh[1] + .9), "#f4f6f8", .6);   // il manico
      o += tornito(a, b, [[z + .9, .019], [z + 2.1, .026], [z + 4, .031], [z + 4.6, .032]], CER, .7);
      o += bocca(a, b, z + 4.6, .028, piena ? nuovaR([[0, "#e9b47d"], [.5, "#b8743d"], [1, "#5e3317"]], .45, .45, .6) : "#f1f3f5", "stroke='" + L + "' stroke-width='.35'");
      var s0 = P(a - .045, b + .045, z + 1.1), s1 = P(a + .005, b + .05, z + 1.2);   // il cucchiaino
      o += tratto(linea(s0, s1), "#7d8991", 1) + tratto(linea(s0, s1), "#e9ecef", .45) + ell(s0[0], s0[1], .9, .5, "#dee2e6", "stroke='#7d8991' stroke-width='.3'");
      return { box: [a - .058, a + .058, b - .058, b + .058, z, z + 5], s: o };
    }
    sopra.push(tazzina(-.53, .12, true), tazzina(-.27, .16, false), tazzina(.39, .15, true));
    (function () {   // il bicchiere d'acqua
      var a = -.4, b = .05, z = ZT, prof = [[z, .022], [z + 7.5, .027]];
      var o = tornito(a, b, prof, [[0, "#ffffff"], [.4, "#e3f2fb"], [1, "#9cc3d6"]], .6) + pth(fasciaT(a, b, z + .4, z + 5.2, .0235), "#a5d8ff", op(.5)) + bocca(a, b, z + 5.2, .0235, "#d0ebff", "stroke='#8fb3c9' stroke-width='.25'") + bocca(a, b, z + 7.5, .027, "none", "stroke='#8fb3c9' stroke-width='.35'");
      var c = P(a, b, z); o += tratto(linea([c[0] - .9, c[1] - 1.2], [c[0] - 1.1, c[1] - 6.4]), "#ffffff", .5, op(.9));
      sopra.push({ box: [a - .027, a + .027, b - .027, b + .027, z, z + 7.5], s: o });
    })();
    (function () {   // il dosatore dello zucchero: il vetro pieno e il coperchio cromato col beccuccio
      var a = .1, b = .07, z = ZT, o = tornito(a, b, [[z, .03], [z + 6.6, .03], [z + 7, .028]], [[0, "#ffffff"], [.4, "#f1f3f5"], [1, "#b9c4cc"]], .7);
      o += pth(fasciaT(a, b, z + .3, z + 4.8, .029), "#ffffff", op(.9)) + bocca(a, b, z + 4.8, .029, "#f8f9fa");
      o += tornito(a, b, [[z + 7, .03], [z + 8.2, .028], [z + 9.4, .016]], CROMO, .6);
      var t = P(a, b, z + 9.4); o += tratto(linea(t, [t[0] + 1.2 * G, t[1] - 1.8]), L, 1.5) + tratto(linea(t, [t[0] + 1.2 * G, t[1] - 1.8]), "#e9ecef", .7);
      var c = P(a, b, z); o += tratto(linea([c[0] - 1.2, c[1] - 1], [c[0] - 1.2, c[1] - 6]), "#ffffff", .5, op(.9));
      sopra.push({ box: [a - .03, a + .03, b - .03, b + .03, z, z + 10], s: o });
    })();
    // la radio di legno degli anni '50: la tela dell'altoparlante coi listelli d'ottone, la scala delle stazioni, le due manopole
    (function () {
      var a0 = .04, a1 = .4, b0 = -.31, b1 = -.14, z1 = ZT + 13.6, RL = "#7b4423";
      function fronte(W, H) {
        var o = venatureO(W, H, 6, 41, RL, .3) + rett(1.4, 1.4, W - 2.8, H - 2.8, 1.6, "none", "stroke='" + chiaro(RL, .35) + "' stroke-width='.5'");
        o += rett(2.4, 2.4, 11.6, H - 4.8, 1.2, lin("tl", [[0, "#e9d8b0"], [1, "#b89a62"]], 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.4'");   // la tela
        for (var i = 0; i < 4; i++) o += rett(3.8 + i * 2.7, 2.4, .7, H - 4.8, .3, lin("lo", OTTONE, 0, 0, 1, 0));   // i listelli
        o += rett(15.2, 2.6, 5.6, 4.6, .8, NOTTE ? "#ffd27a" : "#f3e6c4", "stroke='" + L + "' stroke-width='.4'");   // la scala delle stazioni
        for (i = 0; i < 6; i++) o += rett(15.9 + i * .85, 3.4, .25, 1.4 + (i % 2) * .8, 0, "#6b4a2a");
        o += rett(17.6, 2.8, .35, 4.2, 0, "#e03131") + (NOTTE ? rett(15.2, 2.6, 5.6, 4.6, .8, "#fff3c4", op(.35)) : "");
        [16.6, 19.6].forEach(function (x) { o += cer(x + .2, H - 3, 1.5, "#000", op(.25)) + cer(x, H - 3.3, 1.5, nuovaR([[0, "#a0673a"], [1, "#3d2010"]], .35, .3, .8), bordo(L, .35)) + cer(x - .45, H - 3.8, .4, "#ffffff", op(.6)); });
        return o;
      }
      function retro(W, H) { var o = rett(1.4, 1.4, W - 2.8, H - 2.8, .6, "#5a3c22", "stroke='" + L + "' stroke-width='.4'"); for (var i = 0; i < 5; i++) for (var j = 0; j < 3; j++) o += cer(4 + i * 3.6, 3.6 + j * 3, .75, "#1d140c"); return o + tratto("M" + q(W - 4, H - 2) + " C" + q(W - 4, H + 2) + " " + q(W - 9, H + 2.6) + " " + q(W - 12, H + 3), "#1d1d1f", .8); }
      var o = blocco(a0, a1, b0, b1, ZT + .8, z1 - 2.2, RL, { davanti: fronte, dietro: retro, fianco: function (W, H) { return venatureO(W, H, 4, 43, RL, .3); } }, 1.3);
      o += estruso("a", pulisci(arcoS(b0 + .085, z1 - 2.2, .085, 2.2, 0, Math.PI, 12)), a0, a1, RL, { mat: LEGNO_L, lw: 1.3, tappoCol: scuro(RL, .2) });   // il coperchio tondo
      [[a0 + .03, b0 + .03], [a1 - .03, b0 + .03], [a0 + .03, b1 - .03], [a1 - .03, b1 - .03]].forEach(function (g) { if (vicino(g[0], g[1]) > vicino((a0 + a1) / 2, (b0 + b1) / 2) - .05) { var c = P(g[0], g[1], ZT); o = ell(c[0], c[1] - .3, 1.2, .6, "#2a1a10") + o; } });   // i piedini
      sopra.push({ box: [a0, a1, b0, b1, ZT, z1], s: o });
    })();
    // la macchina dell'espresso a leva (anni '60): due gruppi, la carrozzeria cromata coi fianchi smaltati di rosso,
    // dalla parte dei clienti la fascia crema col marchio ovale e il manometro; sopra lo scaldatazze con la ringhiera e le tazzine;
    // dalla parte del barista i gruppi coi portafiltri e le grandi leve inclinate col pomello nero
    (function () {
      var a0 = .57, a1 = 1.31, b0 = -.19, b1 = .1, zt = ZT + 27, GR = [.77, 1.11], bg = b0 - .05, RO = "#c4302b";
      var CRF = [[0, "#ffffff"], [.2, "#eef2f5"], [.44, "#aab5be"], [.52, "#4d5962"], [.62, "#7f8b94"], [.84, "#e2e8ec"], [1, "#a3aeb6"]];   // il cromo che riflette la stanza (la riga scura dell'orizzonte)
      function vasca() {   // la vaschetta con la griglia dalla parte del barista
        return blocco(a0 + .04, a1 - .04, -.36, b0 + .01, ZT, ZT + 3.4, tinteDi(CROMO), { sopra: function (A, B, C, D) { var o = "", k; for (k = 1; k < 15; k++) { var t = k / 15; o += tratto(linea(lerp(A, B, t), lerp(D, C, t)), "#4d5962", .45, op(.85)); } return o; } }, 1.1);
      }
      function gruppo(a) {   // il gruppo, il portafiltro col manico nero, i beccucci, la tazzina sotto; la leva col pomello
        var o = "", zg = ZT + 8.4;
        o += tornito(a, bg, [[zg, .044], [zg + 1.2, .053], [zg + 10.4, .053], [zg + 11.6, .046]], CROMO, 1, [1, 2], .8);   // la campana del gruppo
        o += tornito(a, bg, [[zg - 2.6, .038], [zg - 1.8, .047], [zg, .047]], CROMO, .8);   // il portafiltro
        var m0 = P(a, bg - .045, zg - 1.4), m1 = P(a + .015, bg - .19, zg - 2.6);
        o += tratto(linea(m0, m1), L, 4.2) + tratto(linea(m0, m1), "#1d1f22", 2.8) + tratto(linea([m0[0] - .3, m0[1] - .7], [m1[0] - .3, m1[1] - .7]), "#6c757d", .6);   // il manico nero
        [-.013, .013].forEach(function (d) { o += tratto(linea(P(a + d, bg, zg - 2.6), P(a + d, bg, zg - 3.7)), "#868e96", .6); });
        var tz = forma(a, bg, .046), zc = ZT + 3.4;   // la tazzina col piattino sulla griglia, sotto i beccucci
        o += corpo([giro(tz, zc, 1, 28), giro(tz, zc + .7, 1, 28)], CER, .6) + tornito(a, bg, [[zc + .7, .021], [zc + 1.9, .026], [zc + 3.6, .03]], CER, .6) + bocca(a, bg, zc + 3.6, .027, nuovaR([[0, "#e9b47d"], [.6, "#a8642f"], [1, "#5e3317"]], .45, .45, .6), "stroke='" + L + "' stroke-width='.3'");
        // la leva: le due guance del perno sopra il gruppo, il braccio cromato che sale inclinato verso il barista, il pomello nero
        var pv = P(a, bg - .01, zg + 12.6), tp = P(a, bg - .25, ZT + 45.5);   // leva corta e robusta, non un'antenna
        o += pth("M" + q(pv[0] - 2.6, pv[1] + 2.4) + " L" + q(pv[0] - 2, pv[1] - 2.6) + " L" + q(pv[0] + 2, pv[1] - 2.6) + " L" + q(pv[0] + 2.6, pv[1] + 2.4) + " Z", lin("pv", CROMO, 0, 0, 1, 1), bordo(L, .6));
        var dx = tp[0] - pv[0], dy = tp[1] - pv[1], l = Math.sqrt(dx * dx + dy * dy), nx = -dy / l, ny = dx / l, w0 = 2.2, w1 = 1.5;
        var br = [[pv[0] + nx * w0, pv[1] + ny * w0], [tp[0] + nx * w1, tp[1] + ny * w1], [tp[0] - nx * w1, tp[1] - ny * w1], [pv[0] - nx * w0, pv[1] - ny * w0]];
        o += poly(br, nuova(CROMO, br[0][0], br[0][1], br[3][0], br[3][1], true), bordo(L, .9)) + tratto(linea(lerp(br[0], br[3], .35), lerp(br[1], br[2], .35)), "#ffffff", .7, op(.9));
        o += cer(pv[0], pv[1], 1.1, lin("pc", CROMO, 0, 0, 1, 1), bordo(L, .45));   // il perno
        o += cer(tp[0] + .4, tp[1] + .6, 3.3, "#000", op(.2)) + cer(tp[0], tp[1], 3.3, nuovaR(NERO, .35, .3, .8), bordo(L, .7)) + cer(tp[0] - 1.1, tp[1] - 1.2, 1, "#ffffff", op(.75));
        return o;
      }
      function rubinetto(a, dw) {   // la lancia del vapore (o dell'acqua calda) col pomello nero
        var t0 = P(a, b0 - .02, zt - 7), t1 = P(a + dw, b0 - .11, zt - 10), t2 = P(a + dw * 1.3, b0 - .12, ZT + 7), mp = P(a, b0 - .02, zt - 4);
        return cromo("M" + q(t0) + " Q" + q(t1) + " " + q(t2), 1.1) + ell(mp[0], mp[1], 2.1, 1.6, nuovaR(NERO, .35, .3, .8), bordo(L, .5)) + ell(mp[0] - .5, mp[1] - .5, .6, .3, "#ffffff", op(.7));
      }
      function retroMacchina() { return vasca() + rubinetto(a0 + .05, -.02) + GR.slice().sort(function (x, y) { return vicino(x, bg) - vicino(y, bg); }).map(gruppo).join("") + rubinetto(a1 - .05, .02); }
      function strisce(W, H, k) { return [.12, .3, .66, .8].map(function (t, i) { return poly([[W * t, 0], [W * t + (i % 2 ? 1.6 : 3.4), 0], [W * t + (i % 2 ? 1.6 : 3.4) - 4, H], [W * t - 4, H]], "#ffffff", op(k * (i % 2 ? .5 : .8))); }).join(""); }   // i riflessi del cromo
      function clienti(W, H) {   // dalla parte dei clienti: il cromo, la fascia crema con le righe rosse, il marchio ovale con le ali, il manometro, le costole in basso
        var o = rett(0, 0, W, H, 0, lin("crf", CRF, 0, 0, 0, 1)) + strisce(W, H, .45);
        o += rett(0, 9, W, 8.4, 0, lin("fc", [[0, "#fdf6e3"], [1, "#e8d5a8"]], 0, 0, 0, 1)) + rett(0, 9, W, 1, 0, RO) + rett(0, 16.4, W, 1, 0, RO) + rett(0, 17.4, W, .8, 0, "#000", op(.2));
        [[W / 2 - 7.6, -1], [W / 2 + 7.6, 1]].forEach(function (g) { for (var k = 0; k < 3; k++) { var w = 10 - k * 2.6; o += rett(g[1] < 0 ? g[0] - w : g[0], 10.9 + k * 1.75, w, .8, .4, lin("al", CROMO, 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.22'"); } });   // le ali cromate
        o += ell(W / 2, 13.2, 6.8, 3.7, lin("mo", ORO, 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.55'") + ell(W / 2, 13.2, 5, 2.5, RO, "stroke='#7a1515' stroke-width='.3'") + ell(W / 2, 13.2, 2.6, 1.1, "#fdf6e3", op(.9)) + ell(W / 2 - 1.6, 12.2, 1.6, .55, "#ffffff", op(.55));
        var gx = W / 2, gy = 4.4;   // il manometro
        o += cer(gx + .3, gy + .4, 3.3, "#000", op(.25)) + cer(gx, gy, 3.3, lin("mb", CROMO, 0, 0, 1, 1), bordo(L, .5)) + cer(gx, gy, 2.5, "#fffdf5", "stroke='#495057' stroke-width='.25'");
        for (var k = 0; k < 7; k++) { var t = Math.PI * (.8 + 1.4 * k / 6); o += tratto(linea([gx + Math.cos(t) * 1.8, gy + Math.sin(t) * 1.8], [gx + Math.cos(t) * 2.3, gy + Math.sin(t) * 2.3]), "#495057", .25); }
        o += tratto(linea([gx, gy], [gx + 1.5, gy - 1.2]), "#e03131", .45) + cer(gx, gy, .4, "#343a40") + ell(gx - 1.2, gy - 1.4, 1.1, .5, "#ffffff", op(.7));
        for (k = 0; k < 4; k++) o += rett(2, 20 + k * 1.6, W - 4, .7, .35, "#ffffff", op(.75)) + rett(2, 20.7 + k * 1.6, W - 4, .4, 0, "#4d5962", op(.5));   // le costole cromate in basso
        o += cer(5, 4.6, 1.1, NOTTE ? "#ffc9c9" : "#e03131", "stroke='#7a1515' stroke-width='.3'") + cer(4.7, 4.3, .4, "#ffffff", op(.8));   // la lucina rossa
        return o;
      }
      function barista(W, H) {   // dalla parte del barista: il cromo, il vetrino del livello dell'acqua, i rubinetti
        var o = rett(0, 0, W, H, 0, lin("crf", CRF, 0, 0, 0, 1)) + strisce(W, H, .4);
        o += rett(W / 2 - 1.4, 3, 2.8, 9, 1.2, lin("lv", [[0, "#ffffff"], [.5, "#a5d8ff"], [1, "#4dabf7"]], 0, 0, 1, 0), "stroke='" + L + "' stroke-width='.4'") + rett(W / 2 - 1.4, 3, 2.8, 3.6, 1.2, "#f1f3f5", op(.9));
        return o + rett(0, 0, W, 1.6, 0, "#ffffff", op(.6));
      }
      function fianco(W, H) {   // il fianco smaltato di rosso, col bordo cromato e il rubinetto tondo
        var o = rett(0, 0, W, H, 0, lin("fr", [[0, "#dfe5e9"], [1, "#8d99a2"]], 0, 0, 1, 1)) + rett(1.6, 1.6, W - 3.2, H - 3.2, 2, lin("sm", [[0, chiaro(RO, .25)], [.6, RO], [1, scuro(RO, .3)]], 0, 0, 1, 1), "stroke='" + scuro(RO, .5) + "' stroke-width='.5'");
        o += poly([[3, 2], [7, 2], [3, H * .6]], "#ffffff", op(.25));
        var cx = W / 2, cy = H * .48;
        return o + cer(cx, cy, 3.6, lin("tr", CROMO, 0, 0, 1, 1), bordo(L, .5)) + cer(cx, cy, 2.2, nuovaR(NERO, .35, .3, .8), "stroke='" + L + "' stroke-width='.3'") + rett(cx - .55, cy - 2.9, 1.1, 5.8, .45, "#343a40") + cer(cx - .9, cy - 1, .55, "#ffffff", op(.7));
      }
      var CT = [lin("cts", [[0, "#ffffff"], [1, "#c9d1d7"]], 0, 0, 1, 1), lin("ctl", CRF, 0, 0, 0, 1), lin("ctd", [[0, "#aab5be"], [.5, "#59646d"], [1, "#8d99a2"]], 0, 0, 0, 1)];
      var carr = blocco(a0, a1, b0, b1, ZT + .6, zt, CT, { davanti: clienti, dietro: barista, fianco: fianco }, 1.9);
      carr += tratto(linea(P(a0, G > 0 ? b1 : b0, zt - .8), P(a1, G > 0 ? b1 : b0, zt - .8)), "#ffffff", 1.1, op(.85));   // il bordo lucido in alto
      // sopra: lo scaldatazze con la ringhiera e le tazzine capovolte
      var ra0 = a0 + .05, ra1 = a1 - .05, rb0 = b0 + .035, rb1 = b1 - .04, zr = zt + 3.6, ang = [[ra0, rb0], [ra1, rb0], [ra1, rb1], [ra0, rb1]];
      function lato(i) { return cromo(linea(P(ang[i][0], ang[i][1], zr), P(ang[(i + 1) % 4][0], ang[(i + 1) % 4][1], zr)), .7); }
      function palo(v) { return cromo(linea(P(v[0], v[1], zt), P(v[0], v[1], zr)), .6); }
      var lati = [0, 1, 2, 3].map(function (i) { var m = [(ang[i][0] + ang[(i + 1) % 4][0]) / 2, (ang[i][1] + ang[(i + 1) % 4][1]) / 2]; return [vicino(m[0], m[1]), lato(i)]; }).sort(function (x, y) { return x[0] - y[0]; });
      var pali = ang.slice().sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
      var tazze = [];
      [.68, .83, .98, 1.13].forEach(function (a, i) { [-.1, .01].forEach(function (b, j) { var aa = a + (j ? .07 : 0); if (aa < ra1 - .03) tazze.push([vicino(aa, b), tornito(aa, b, [[zt, .036], [zt + 2.8, .032], [zt + 3.5, .024]], CER, .65) + bocca(aa, b, zt + 3.5, .024, "#eef2f5", "stroke='" + L + "' stroke-width='.25'") + pth(fasciaT(aa, b, zt + .5, zt + 1.1, .0355), "#c4302b", op(.8))]); }); });
      var top = lati[0][1] + lati[1][1] + pali.slice(0, 2).map(palo).join("") + ordina(tazze) + pali.slice(2).map(palo).join("") + lati[2][1] + lati[3][1];
      var o = G > 0 ? retroMacchina() + carr + top : carr + top + retroMacchina();
      sopra.push({ box: [a0, a1, -.36, b1, ZT, ZT + 56], s: o });
    })();
    return s + inOrdine(sopra);
  });

  // =========================================================
  //  LO SGABELLO DEL BAR: il sedile tondo di noce col cuscino di pelle rossa e i chiodini d'ottone, le quattro gambe tornite
  //  un po' aperte coi puntali d'ottone, l'anello poggiapiedi d'ottone (dove arrivano i piedi di chi è seduto)
  //  e lo schienalino basso di legno curvato, dietro. Da dietro lo schienalino sta davanti.
  // =========================================================
  def("sgabello_circolo", { nome: "Sgabello del bar", fp: [1, 1], box: [-20, -63, 22, 14], dietro: true, azione: "siedi", seduta: 42 }, function () {
    var ZS = 38.6, ZC = 42.2, RS = .19, ZA = 15.5, CU = "#8f2626", i;
    var s = ombraTonda(0, 0, .28, 1);
    var gambe = [0, 1, 2, 3].map(function (k) { var t = k * Math.PI / 2; return [Math.cos(t), Math.sin(t)]; });
    function rg(z) { return .185 - (.185 - .124) * z / ZS; }   // dove sta la gamba all'altezza z
    function gamba(v) {
      var T = [v[0] * .124, v[1] * .124, ZS - .4], F = [v[0] * .185, v[1] * .185, 0], o = gambaTonda(T, F, 2.1, 1.6, [[0, chiaro(NOCE, .45)], [.4, NOCE], [1, scuro(NOCE, .5)]], OTTONE);
      [27, 6].forEach(function (z) { var c = P(v[0] * rg(z), v[1] * rg(z), z); o += ell(c[0], c[1], 2.4, 1.1, lin("ag", [[0, chiaro(NOCE, .4)], [1, scuro(NOCE, .4)]], 0, 0, 1, 0), bordo(L, .45)); });   // gli anelli torniti
      return o;
    }
    var lontane = gambe.filter(function (v) { return vicino(v[0], v[1]) < -.01; }), vicine = gambe.filter(function (v) { return vicino(v[0], v[1]) >= -.01; });
    var schiena = "";
    // lo schienalino: il listello curvo e le due colonnine, dietro (b-)
    (function () {
      var t0 = 1.16 * Math.PI, t1 = 1.84 * Math.PI, R = .172, z0 = ZC + 6, z1 = ZC + 10.5, su = [], giu = [], k;
      for (k = 0; k <= 20; k++) { var t = t0 + (t1 - t0) * k / 20; su.push(P(R * Math.cos(t), R * Math.sin(t), z1)); giu.push(P(R * Math.cos(t), R * Math.sin(t), z0)); }
      var pp = su.concat(giu.slice().reverse()), b = limiti(pp);
      var col = [.25, .75].map(function (f) { var t = t0 + (t1 - t0) * f, a = R * Math.cos(t), bb = R * Math.sin(t); return [vicino(a, bb), gambaTonda([a, bb, z0 + .5], [a * .97, bb * .97, ZC - 1], 1.2, 1.3, [[0, chiaro(NOCE, .4)], [1, scuro(NOCE, .4)]])]; });
      [1.08, 1.92].forEach(function (f) { var t = f * Math.PI, a = R * Math.cos(t), bb = R * Math.sin(t); col.push([vicino(a, bb), gambaTonda([a, bb, z1 - .5], [a * .99, bb * .99, ZC - 1.5], 1.5, 1.6, [[0, chiaro(NOCE, .4)], [1, scuro(NOCE, .4)]])]); });   // i due montanti che scendono al sedile
      schiena = ordina(col) + pth(chiuso(pp), nuova([[0, chiaro(NOCE, .4)], [.5, NOCE], [1, scuro(NOCE, .35)]], b[0], 0, b[2], 0, true), bordo(L, 1.2)) + tratto(aperto(su.slice(3, 15)), "#ffffff", .6, op(.5));
    })();
    var dietroVicino = G < 0;   // da dietro lo schienalino è dalla parte di chi guarda
    // l'anello poggiapiedi: la metà lontana, le gambe lontane, la metà vicina
    s += anello(0, 0, ZA, rg(ZA) + .006, 1.6, false, true);
    s += lontane.map(gamba).join("");
    s += anello(0, 0, ZA, rg(ZA) + .006, 1.6, true, true);
    s += vicine.map(gamba).join("");
    // il sedile di noce, il cuscino di pelle coi chiodini
    var S = forma(0, 0, RS);
    if (!dietroVicino) s += schiena;
    s += corpo([giro(S, ZS - 3.2, .96, 56), giro(S, ZS - 2.2, 1, 56), giro(S, ZS, 1, 56)], [[0, chiaro(NOCE, .4)], [.4, NOCE], [1, scuro(NOCE, .5)]], 1.4);
    s += pth(chiuso(giro(S, ZS, 1, 56)), nuova([[0, chiaro(NOCE, .3)], [1, NOCE]], 0, 0, 1, 1), bordo(L, 1));
    var K = forma(0, 0, RS * .93), lv = [giro(K, ZS, 1, 56), giro(K, ZS + 1.8, 1.01, 56), giro(K, ZC - .6, .96, 56)];
    s += corpo(lv, [[0, chiaro(CU, .3)], [.4, CU], [1, scuro(CU, .5)]], 1.3);
    var top = giro(K, ZC, .9, 56);
    s += pth(chiuso(top), nuovaR([[0, chiaro(CU, .45)], [.5, chiaro(CU, .1)], [1, scuro(CU, .2)]], .38, .3, .8), bordo(L, 1));
    var nails = []; for (i = 0; i < 26; i++) { var t = i / 26 * 6.2832; if (vicino(Math.cos(t), Math.sin(t)) > -.35) nails.push(P(Math.cos(t) * RS * .935, Math.sin(t) * RS * .935, ZS + 1)); }
    s += chiodi(nails, .55);
    var hl = []; for (i = 0; i <= 12; i++) { var t2 = Math.PI * (.85 + .45 * i / 12); hl.push(P(Math.cos(t2) * RS * .7, Math.sin(t2) * RS * .7, ZC)); }
    s += tratto(aperto(hl), "#ffffff", 1, op(.7)) + ell(P(-.05, -.03, ZC)[0], P(-.05, -.03, ZC)[1], 2.6, 1, "#ffffff", op(.3));
    if (dietroVicino) s += schiena;
    return s;
  });

  // ---------- le coppe, i trofei, i gagliardetti e le medaglie ----------
  var ORO_C = [[0, "#fff6cf"], [.3, "#f5cf55"], [.7, "#c08a1c"], [1, "#6e4a0c"]], ARG_C = [[0, "#ffffff"], [.3, "#e3e8eb"], [.68, "#9aa6ae"], [1, "#58636b"]], BRO_C = [[0, "#ffe0c0"], [.3, "#e0975a"], [.7, "#a2521f"], [1, "#5a2a0c"]];
  var MARMO_N = [[0, "#6b7178"], [.35, "#2c3034"], [1, "#0e1012"]];
  function stella(x, y, r1, r2, fill, x2) { var d = "", j; for (j = 0; j < 10; j++) { var rr = j % 2 ? r2 : r1, an = -Math.PI / 2 + j * Math.PI / 5; d += (j ? " L" : "M") + q(x + Math.cos(an) * rr, y + Math.sin(an) * rr); } return pth(d + " Z", fill, x2); }
  function coppa(a, b, z, k, met, manici) {   // la coppa: la base di marmo nero con la targhetta, il fusto coi nodi, la coppa che si allarga, i manici grandi
    var o = "", c0 = P(a, b, 0), x = c0[0], y0 = c0[1];
    o += tornito(a, b, [[z, .062 * k], [z + .8 * k, .062 * k], [z + 1.1 * k, .054 * k], [z + 3.3 * k, .054 * k], [z + 3.7 * k, .048 * k]], MARMO_N, .8);
    var ty = y0 - z - 2.2 * k + .054 * k * 35.36;
    o += rett(x - 2.3 * k, ty - .65 * k, 4.6 * k, 1.3 * k, .3, lin("tg", ORO, 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.2'");
    var zz = z + 3.7 * k, zt = zz + 15 * k, rt = .08 * k * 70.71, ytop = y0 - zt, ymid = y0 - (zz + 10.5 * k);
    var prof = [[zz, .042 * k], [zz + .9 * k, .036 * k], [zz + 1.6 * k, .015 * k], [zz + 4.6 * k, .013 * k], [zz + 5.3 * k, .026 * k], [zz + 6 * k, .015 * k], [zz + 6.8 * k, .02 * k], [zz + 9 * k, .046 * k], [zz + 11.6 * k, .066 * k], [zz + 14 * k, .077 * k], [zz + 15 * k, .08 * k]];
    if (manici) [-1, 1].forEach(function (sx) {
      var d = "M" + q(x + sx * rt * .9, ytop + 1.8 * k) + " C" + q(x + sx * (rt + 5.6 * k), ytop + .2 * k) + " " + q(x + sx * (rt + 5.8 * k), ymid + 2 * k) + " " + q(x + sx * rt * .45, ymid + 3.6 * k);
      o += tratto(d, L, 2.5 * k) + tratto(d, nuova(met, x + sx * rt, 0, x + sx * (rt + 5 * k), 0, true), 1.35 * k) + tratto(d, "#ffffff", .4 * k, op(.7));
    });
    o += tornito(a, b, prof, met, 1, [4, 5, 6], 1.1 * k);
    o += bocca(a, b, zt, .08 * k, nuova([[0, met[3][1]], [.55, met[2][1]], [1, met[1][1]]], x - rt, 0, x + rt, 0, true), bordo(L, .6)) + bocca(a, b, zt + .15, .068 * k, "none", "stroke='#ffffff' stroke-width='.4' opacity='.45'");
    return o + ell(x - rt * .5, y0 - zz - 10.8 * k, .9 * k, 2.4 * k, "#ffffff", op(.7));
  }
  function statuina(a, b, z, k) {   // la statuetta d'oro del calciatore che tira, sulla colonnina di marmo bianco
    var o = tornito(a, b, [[z, .052 * k], [z + 1 * k, .052 * k], [z + 1.4 * k, .036 * k], [z + 7 * k, .032 * k], [z + 7.6 * k, .044 * k], [z + 8.4 * k, .044 * k]], [[0, "#ffffff"], [.5, "#ddd8cc"], [1, "#8f897c"]], .8, [2, 4]);
    var c = P(a, b, z + 8.4 * k), x = c[0], y = c[1], g = nuova(ORO_C, x - 4 * k, 0, x + 4 * k, 0, true);
    function arto(d, w) { return tratto(d, L, w + 1) + tratto(d, g, w); }
    o += ell(x, y, 2.7 * k, 1.1 * k, g, bordo(L, .4));
    o += arto("M" + q(x - 1.5 * k, y - 8.6 * k) + " L" + q(x - 3.3 * k, y - 6.6 * k), 1.1 * k);   // il braccio dietro
    o += arto("M" + q(x - .3 * k, y - .3 * k) + " L" + q(x - .1 * k, y - 4.6 * k), 1.4 * k);   // la gamba d'appoggio
    o += arto("M" + q(x + .3 * k, y - 4.8 * k) + " L" + q(x + 2.4 * k, y - 3.3 * k) + " L" + q(x + 3.9 * k, y - 4.6 * k), 1.3 * k);   // la gamba che tira
    o += pth("M" + q(x - 1.4 * k, y - 9.2 * k) + " Q" + q(x + 1.6 * k, y - 9.6 * k) + " " + q(x + 1.2 * k, y - 7 * k) + " L" + q(x + .9 * k, y - 4.6 * k) + " L" + q(x - .9 * k, y - 4.4 * k) + " Q" + q(x - 1.8 * k, y - 7 * k) + " " + q(x - 1.4 * k, y - 9.2 * k) + " Z", g, bordo(L, .5));   // il busto
    o += arto("M" + q(x + 1 * k, y - 8.8 * k) + " L" + q(x + 3.1 * k, y - 10.3 * k), 1 * k);   // il braccio alzato
    o += cer(x + .1 * k, y - 10.7 * k, 1.35 * k, nuovaR(ORO_C, .35, .3, .8), bordo(L, .5));   // la testa
    o += cer(x + 4.9 * k, y - 4.4 * k, 1.1 * k, nuovaR(ORO_C, .35, .3, .8), bordo(L, .45));   // il pallone
    return o + tratto("M" + q(x - .9 * k, y - 8.6 * k) + " L" + q(x - .7 * k, y - 5.6 * k), "#fffbe6", .5 * k, op(.8));
  }
  function bocciaT(a, b, z, k) {   // la coppa delle bocce: la colonnina nera, la boccia d'argento con le righe incise, il pallino rosso sulla base
    var o = tornito(a, b, [[z, .056 * k], [z + 1 * k, .056 * k], [z + 1.4 * k, .028 * k], [z + 6 * k, .024 * k], [z + 6.6 * k, .038 * k], [z + 7.2 * k, .03 * k]], MARMO_N, .8, [2]);
    var bt = P(a, b, z + 1 * k), c = P(a, b, z + 7.2 * k + 3.4 * k), R = 3.6 * k, d = cerD(c[0], c[1], R);
    o += cer(bt[0] + 2.1 * k, bt[1] - .7 * k, .95 * k, nuovaR([[0, "#ffb3b3"], [.5, "#e03131"], [1, "#7a1515"]], .35, .3, .8), bordo(L, .35));
    o += pth(d, nuovaR([[0, "#ffffff"], [.35, "#dfe4e8"], [.8, "#7d8991"], [1, "#4a545c"]], .35, .3, .75), bordo(L, .7));
    o += dentro(d, tratto("M" + q(c[0] - R, c[1] - .6 * k) + " Q" + q(c[0], c[1] + 1.8 * k) + " " + q(c[0] + R, c[1] - .6 * k), "#5c6770", .45 * k, op(.7)) + tratto("M" + q(c[0] - R, c[1] + .9 * k) + " Q" + q(c[0], c[1] + 3.2 * k) + " " + q(c[0] + R, c[1] + .9 * k), "#5c6770", .45 * k, op(.7)));
    return o + cer(c[0] - 1.3 * k, c[1] - 1.4 * k, .9 * k, "#ffffff", op(.85));
  }
  function pallone(a, b, z, R) {   // il vecchio pallone di cuoio a spicchi, con la stringa
    var c = P(a, b, z + R), x = c[0], y = c[1], d = cerD(x, y, R), base = P(a, b, z);
    var o = ell(base[0] + .8, base[1] - .2, R * .95, R * .38, "#000", op(.28));
    o += pth(d, nuovaR([[0, "#f0c08a"], [.45, "#b56f30"], [1, "#5a2e10"]], .36, .32, .8), bordo(L, .8));
    var cuc = "M" + q(x - R, y - R * .1) + " Q" + q(x, y + R * .35) + " " + q(x + R, y - R * .1) + " M" + q(x - R * .9, y - R * .5) + " Q" + q(x, y - R * .15) + " " + q(x + R * .9, y - R * .5) + " M" + q(x - R * .35, y - R) + " Q" + q(x - R * .55, y) + " " + q(x - R * .3, y + R) + " M" + q(x + R * .35, y - R) + " Q" + q(x + R * .15, y) + " " + q(x + R * .35, y + R);
    o += dentro(d, tratto(cuc, "#4a2410", .45, op(.75)));
    o += tratto("M" + q(x - R * .25, y - R * .72) + " L" + q(x + R * .25, y - R * .72), "#3a1c0a", .9) + [-.18, -.06, .06, .18].map(function (t) { return tratto(linea([x + R * t - .4, y - R * .8], [x + R * t + .4, y - R * .64]), "#fff3d6", .35); }).join("");   // la stringa
    return o + ell(x - R * .38, y - R * .4, R * .28, R * .16, "#ffffff", op(.5));
  }
  function targa(a, b, z, k) {   // la targa di legno a scudo, sul leggio, con la piastra d'ottone e il pallone in rilievo
    var c = P(a, b, z), x = c[0], y = c[1] - .5, w = 7.4 * k, h = 9.6 * k, cy = y - h * .45;
    var d = "M" + q(x - w / 2, y - h) + " L" + q(x + w / 2, y - h) + " L" + q(x + w / 2, y - h * .42) + " Q" + q(x + w / 2, y - h * .08) + " " + q(x, y) + " Q" + q(x - w / 2, y - h * .08) + " " + q(x - w / 2, y - h * .42) + " Z";
    var o = tratto(linea([x + 1.4 * k, y - h * .5], [x + 3 * k, y + .2]), L, 1.4) + tratto(linea([x + 1.4 * k, y - h * .5], [x + 3 * k, y + .2]), NOCE_SC, .7);   // il leggio dietro
    o += pth(d, "#000", op(.2) + " transform='translate(.7 .6)'") + pth(d, nuova([[0, chiaro(NOCE, .25)], [1, scuro(NOCE, .25)]], x - w / 2, 0, x + w / 2, 0, true), bordo(L, .7));
    o += pth(d, "none", "stroke='#d9a530' stroke-width='.45' transform='translate(" + f1(x * .16) + " " + f1(cy * .16) + ") scale(.84)'");   // il filetto d'oro
    o += rett(x - 2.4 * k, y - h * .8, 4.8 * k, 2.4 * k, .3, lin("tp", ORO, 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.25'") + rett(x - 1.6 * k, y - h * .72, 3.2 * k, .3, 0, "#7a5614") + rett(x - 1.2 * k, y - h * .66, 2.4 * k, .3, 0, "#7a5614");
    return o + cer(x, y - h * .38, 1.4 * k, nuovaR(ORO_C, .35, .3, .8), bordo(L, .35)) + cer(x - .4 * k, y - h * .42, .4 * k, "#ffffff", op(.7));
  }
  function gagliardetto(x, y, w, h, c1, c2, tipo) {   // il gagliardetto a triangolo (piatto): x, y = l'angolo in alto a sinistra; lo stemma, la frangia d'oro, la nappina
    var d = "M" + q(x, y) + " L" + q(x + w, y) + " L" + q(x + w / 2, y + h) + " Z", o = "";
    o += tratto("M" + q(x + .6, y) + " L" + q(x + w / 2, y - 2.6) + " L" + q(x + w - .6, y), "#d9a530", .4) + cer(x + w / 2, y - 2.6, .45, "#7d8991");   // il cordino al chiodo
    o += pth(d, "#000", op(.28) + " transform='translate(.9 1.1)'");
    var campo = tipo === 1 ? rett(x, y, w, h * .36, 0, c1) + rett(x, y + h * .36, w, h, 0, c2) : tipo === 2 ? rett(x, y, w, h, 0, c2) + pth("M" + q(x, y) + " L" + q(x + w * .34, y) + " L" + q(x + w * .62, y + h) + " L" + q(x + w * .38, y + h) + " Z", c1) : rett(x, y, w / 2, h, 0, c1) + rett(x + w / 2, y, w / 2, h, 0, c2);
    o += pth(d, c2) + dentro(d, campo + rett(x, y, w, h, 0, nuova([[0, "#fff", .22], [.6, "#fff", 0], [1, "#000", .18]], x, y, x + w, y + h, true)));
    var sx = x + w / 2, sy = y + h * .3, rs = w * .17;
    o += cer(sx, sy, rs, "#ffffff", bordo(L, .3)) + cer(sx, sy, rs * .62, c1 === "#ffffff" ? c2 : c1) + stella(sx, sy, rs * .45, rs * .2, "#fff3bf") + cer(sx - rs * .3, sy - rs * .3, rs * .18, "#ffffff", op(.7));   // lo stemma
    o += tratto("M" + q(x, y) + " L" + q(x + w / 2, y + h) + " L" + q(x + w, y), "#e0b54a", 1.3, "stroke-dasharray='.3 .4'") + pth(d, "none", bordo(L, .4));   // la frangia d'oro
    o += rett(x - .6, y - .7, w + 1.2, 1.2, .5, lin("ba", ORO, 0, 0, 0, 1), bordo(L, .3));   // l'asticciola
    return o + pth("M" + q(x + w / 2 - .7, y + h) + " L" + q(x + w / 2 + .7, y + h) + " L" + q(x + w / 2 + 1, y + h + 2.6) + " L" + q(x + w / 2 - 1, y + h + 2.6) + " Z", "#e0b54a", bordo("#7a5614", .25));   // la nappina
  }
  function medaglia(x, y, r, met) {   // la medaglia col nastro tricolore che scende dall'alto (piatta): x, y = il centro
    var t = y - r - 7.5, w = 2.6, o = pth("M" + q(x - w / 2, t) + " L" + q(x + w / 2, t) + " L" + q(x + w / 2, y - r + .6) + " L" + q(x - w / 2, y - r + .6) + " Z", "#000", op(.22) + " transform='translate(.6 .8)'");
    o += rett(x - w / 2, t, w / 3, 8.1, 0, "#2b8a3e") + rett(x - w / 6, t, w / 3, 8.1, 0, "#f8f9fa") + rett(x + w / 6, t, w / 3, 8.1, 0, "#e03131") + rett(x - w / 2, t, w, 8.1, 0, "none", "stroke='" + L + "' stroke-width='.25'");
    o += cer(x + .5, y + .7, r, "#000", op(.25)) + cer(x, y, r, nuovaR(met, .35, .3, .8), bordo(L, .4)) + cer(x, y, r * .72, "none", "stroke='" + met[2][1] + "' stroke-width='.3'") + stella(x, y, r * .45, r * .2, met[2][1]);
    return o + cer(x - r * .35, y - r * .35, r * .22, "#ffffff", op(.8));
  }

  // =========================================================
  //  LA VETRINA DELLE COPPE: il mobile di noce col cassettone a tre ante sotto e la vetrina a tre ante sopra,
  //  il fondo di velluto verde e i ripiani di vetro. Dentro: la coppa d'oro grande, le coppe d'argento, la statuetta
  //  del calciatore, la coppa delle bocce col pallino, il vecchio pallone di cuoio, la targa, le medaglie col nastro tricolore
  //  e i gagliardetti delle altre squadre appesi al fondo; sopra il mobile la coppa più grande, che dentro non ci stava.
  //  Da dietro: la schiena di assi coi chiodini e l'etichetta del mobilificio.
  // =========================================================
  def("vetrina_coppe", { nome: "Vetrina delle coppe", fp: [2, 1], box: [-74, -157, 74, 36], dietro: true }, function () {
    var A0 = -.92, A1 = .92, B0 = -.44, B1 = .02, Z1 = 38, Z2 = 41, Z3 = 112, S1 = 62, S2 = 85, VEL = "#2f6a4d", NC = NOCE;
    var s = ombraPianta(A0, A1, B0, B1 + .04, 1, .1);
    function pomolo(x, y) { return cer(x + .3, y + .4, 1.1, "#000", op(.3)) + cer(x, y, 1.1, nuovaR(ORO_C, .35, .3, .8), bordo(L, .35)) + cer(x - .35, y - .35, .35, "#ffffff", op(.8)); }
    function bocchetta(x, y) { return ell(x, y, .9, 1.4, lin("bo", ORO, 0, 0, 1, 1), bordo(L, .3)) + cer(x, y - .3, .3, "#1d140c") + rett(x - .12, y - .2, .24, .8, 0, "#1d140c"); }
    function ante(W, H) {   // le tre ante di sotto, col riquadro, la bocchetta della chiave e il pomolo
      var o = venature(W, H, 30, 21, NC, .25), n = 3, w = (W - 2.4) / n, i;
      for (i = 0; i < n; i++) { var x = 1.2 + i * w; o += riquadro(x + .7, 1.8, w - 1.4, H - 3.6, MIELE, 60 + i, 1.6) + rett(x + w - .3, 1, .6, H - 2, 0, "#000", op(.35)); }
      o += bocchetta(1.2 + w - 3.4, H * .42) + pomolo(1.2 + w - 3.4, H * .62) + bocchetta(1.2 + 2 * w - 3.4, H * .42) + pomolo(1.2 + 2 * w - 3.4, H * .62) + bocchetta(1.2 + 2 * w + 3.4, H * .42) + pomolo(1.2 + 2 * w + 3.4, H * .62);
      return o + buio(W, 4, .45, true);
    }
    function telaio(W, H) {   // il davanti della vetrina: il vetro coi riflessi e il telaio di noce a tre ante, coi pomoli
      var st = 3.4, tr = 4, br = 4.4, n = 3, wo = (W - (n + 1) * st) / n, i, buchi = "", o = "", d = "M0,0 H" + f1(W) + " V" + f1(H) + " H0 Z";
      for (i = 0; i < n; i++) {
        var x = st + i * (wo + st), hv = H - tr - br, dv = rettD(x, tr, wo, hv, 0);
        buchi += " " + dv;
        o += pth(dv, "#dff1f8", op(.1)) + dentro(dv, poly([[x + wo * .12, tr], [x + wo * .44, tr], [x + wo * .04, tr + hv * .6], [x - wo * .28, tr + hv * .6]], "#ffffff", op(.22)) + poly([[x + wo * .56, tr], [x + wo * .67, tr], [x + wo * .12, tr + hv], [x + wo * .01, tr + hv]], "#ffffff", op(.13)));
      }
      o += pth(d + buchi, lin("tv", [[0, chiaro(NC, .16)], [1, scuro(NC, .1)]], 0, 0, 0, 1), "fill-rule='evenodd' stroke='" + scuro(NC, .5) + "' stroke-width='.5'");
      o += dentro(d + buchi, venature(W, H, 40, 23, NC, .3), true);
      for (i = 0; i < n; i++) { var x2 = st + i * (wo + st); o += tratto("M" + q(x2 - .5, H - br + .5) + " L" + q(x2 - .5, tr - .5) + " L" + q(x2 + wo + .5, tr - .5), scuro(NC, .45), .7, op(.85)) + tratto("M" + q(x2 + wo + .5, tr - .5) + " L" + q(x2 + wo + .5, H - br + .5) + " L" + q(x2 - .5, H - br + .5), chiaro(NC, .45), .6, op(.85)); }   // la cornicetta attorno ai vetri
      for (i = 1; i < n; i++) { var xm = i * (wo + st) + st / 2; o += bocchetta(xm, H * .5 - 2.6) + pomolo(xm, H * .5 + 1); }
      return o;
    }
    function assi(W, H) {   // la schiena: le assi in piedi coi chiodini; l'etichetta del mobilificio
      var o = "", n = Math.round(W / 9), i;
      for (i = 0; i < n; i++) { var x = i * W / n; o += rett(x, 0, W / n, H, 0, i % 2 ? scuro(NC, .1) : chiaro(NC, .03)) + rett(x, 0, .6, H, 0, "#000", op(.3)) + cer(x + W / n / 2, 2.2, .45, "#3a2a1a") + cer(x + W / n / 2, H - 2.2, .45, "#3a2a1a"); }
      o += venature(W, H, Math.round(W / 3), 31, NC, .22);
      if (H > 50) o += rett(W * .6, H * .3, 15, 9.6, .5, "#f3ead2", "stroke='#b8a88a' stroke-width='.3'") + [0, 1, 2].map(function (k) { return rett(W * .6 + 2, H * .3 + 2.4 + k * 2.3, 11 - k * 3, .7, 0, "#8a7a5a"); }).join("");
      return o;
    }
    function fiancoSu(W, H) { return venature(W, H, 8, 25, NC, .3) + riquadro(3, 4, W - 6, H - 8.4, MIELE, 27, 1.8); }
    function fiancoGiu(W, H) { return venature(W, H, 6, 26, NC, .3) + riquadro(3, 2, W - 6, H - 4, MIELE, 28, 1.6) + buio(W, 4, .45, true); }
    function interno() {   // dentro la vetrina (si vede solo da davanti)
      var a0 = A0 + .035, a1 = A1 - .035, b0 = B0 + .03, b1 = B1 - .005, W = (a1 - a0) * 61, H = Z3 - Z2, o = "", i, rr = rnd(4141);
      function X(a) { return (a - a0) * 61; }
      function Y(z) { return Z3 - z; }
      var fondo = rett(0, 0, W, H, 0, lin("vel", [[0, chiaro(VEL, .08)], [1, scuro(VEL, .2)]], 0, 0, 0, 1));
      for (i = 0; i < 170; i++) fondo += cer(rr() * W, rr() * H, .35 + rr() * .3, rr() < .6 ? chiaro(VEL, .22) : scuro(VEL, .25), op(.25));   // il pelo del velluto
      fondo += gagliardetto(X(-.66) - 7, Y(108.6), 14, 17, "#f6c21a", "#c62828", 0) + gagliardetto(X(0) - 7, Y(108.6), 14, 17, "#1e4fa8", "#ffffff", 1) + gagliardetto(X(.66) - 7, Y(108.6), 14, 17, "#2b2b2b", "#ffffff", 2);
      fondo += gagliardetto(X(-.44) - 6, Y(83), 12, 14.5, "#2b8a3e", "#ffffff", 0) + gagliardetto(X(.44) - 6, Y(83), 12, 14.5, "#7a1f6e", "#f6c21a", 1);
      fondo += medaglia(X(.12), Y(50.6), 2.4, ORO_C) + medaglia(X(.28), Y(51.6), 2.2, ARG_C) + medaglia(X(.43), Y(50.6), 2.1, BRO_C);
      fondo += buio(W, 12, .38, true) + [S1, S2].map(function (z) { return rett(0, Y(z) - 5, W, 5, 0, nuova([[0, "#000", 0], [1, "#000", .2]], 0, 0, 0, 1)); }).join("") + ell(W * .5, H * .35, W * .45, H * .4, nuovaR([[0, "#fff8e0", .16], [1, "#fff8e0", 0]], .5, .5, .5));   // l'ombra in alto e sopra i ripiani; un po' di luce in mezzo
      o += pianoV("a", b0, a0, a1, Z2, Z3, fondo);
      o += poly([P(a0, b0, Z2), P(a0, b1, Z2), P(a0, b1, Z3), P(a0, b0, Z3)], lin("fi", [[0, scuro(NC, .35)], [1, scuro(NC, .55)]], 0, 0, 0, 1));   // il fianco di dentro, in ombra
      o += poly([P(a0, b0, Z2), P(a1, b0, Z2), P(a1, b1, Z2), P(a0, b1, Z2)], scuro(VEL, .05));
      function ripiano(z) { var pp = [P(a0, b0, z), P(a1, b0, z), P(a1, b1, z), P(a0, b1, z)]; return poly(pp, "#dff3fa", op(.35)) + tratto(linea(pp[3], pp[2]), "#ffffff", .9, op(.95)) + tratto(linea([pp[3][0], pp[3][1] + 1], [pp[2][0], pp[2][1] + 1]), "#7fa8b8", .5, op(.8)); }
      function liv(l) { return ordina(l.map(function (x) { return [vicino(x[0], x[1]), x[2]]; })); }
      o += liv([[-.62, -.16, pallone(-.62, -.16, Z2, 5.2)], [-.27, -.2, targa(-.27, -.2, Z2, 1)], [.66, -.16, coppa(.66, -.16, Z2, .55, BRO_C, true)]]);
      o += ripiano(S1);
      o += liv([[-.62, -.18, coppa(-.62, -.18, S1, .7, ARG_C, true)], [-.3, -.2, statuina(-.3, -.2, S1, 1)], [0, -.17, coppa(0, -.17, S1, 1, ORO_C, true)], [.3, -.2, bocciaT(.3, -.2, S1, 1)], [.62, -.18, coppa(.62, -.18, S1, .72, ARG_C, true)]]);
      o += ripiano(S2);
      o += liv([[-.33, -.13, coppa(-.33, -.13, S2, .6, ORO_C, true)], [.33, -.13, coppa(.33, -.13, S2, .58, ARG_C, false)]]);
      return o;
    }
    s += blocco(A0 + .04, A1 - .04, B0 + .02, B1 - .03, 0, 5, NOCE_SC, null, 1.4);   // lo zoccolo
    s += blocco(A0, A1, B0, B1, 5, Z1, NC, { davanti: ante, dietro: assi, fianco: fiancoGiu }, 2);
    s += blocco(A0 - .015, A1 + .015, B0, B1 + .03, Z1, Z2, scuro(NC, .08), null, 1.5);   // il ripiano che sporge
    if (G > 0) s += interno();
    s += blocco(A0, A1, B0, B1, Z2, Z3, NC, { vuoto: true, davanti: telaio, dietro: assi, fianco: fiancoSu }, 2);
    var cor = [[B0, Z3], [B1 + .004, Z3], [B1 + .014, Z3 + 1.4], [B1 + .032, Z3 + 3.2], [B1 + .046, Z3 + 4.4], [B1 + .05, Z3 + 6.2], [B0, Z3 + 6.2]];   // la cornice sagomata in cima
    s += estruso("a", cor, A0 - .05, A1 + .05, NC, { mat: LEGNO_L, lw: 1.9, fascia: function (H) { return H.luccica(.35, .02, .98); } });
    return s + coppa(.45, -.2, Z3 + 6.2, 1.15, ARG_C, true);   // sopra: la coppa più grande
  });

  // =========================================================
  //  LA TV CON LA PARTITA (larga due pezzi di muro): il televisore a tubo degli anni '80 sulla mensola di legno
  //  con le squadrette di ferro, l'antenna a baffo, i tasti e la grata dell'altoparlante; sullo schermo la partita
  //  (il pubblico, i cartelloni, il campo a strisce, i giocatori rossoblù e bianchi, l'arbitro, il pallone, il punteggio);
  //  la sciarpa rossoblù appesa alla mensola con la frangia. Di notte lo schermo è acceso e fa luce.
  // =========================================================
  def("tv_partita", { tipo: "parete", nome: "TV con la partita", fp: [2, 1], luce: [54, 70, 118, "#d3e6ff"] }, function () {
    var s = "", X0 = 24, X1 = 96, Y0 = 46.5, Y1 = 93.5, SX0 = 29.5, SX1 = 78.5, SY0 = 51.5, SY1 = 88.5, r = rnd(1982), i, RO = "#c62828", BL = "#1f3a93";
    s += rett(X0 + 2.6, Y0 - 2, X1 - X0, Y1 - Y0 + 4, 5, "#000", op(.15)) + rett(16 + 2.4, 92 + 3.4, 99, 8, 1, "#000", op(.12));   // le ombre sul muro
    [30, 102].forEach(function (x) {   // le squadrette di ferro sotto la mensola
      s += rett(x - 1.3 + 1.5, 99 + 1.5, 2.6, 14, .4, "#000", op(.15)) + rett(x - 1.3, 98.6, 2.6, 14, .5, lin("sq", [[0, "#5c636a"], [1, "#24282c"]], 0, 0, 1, 0), bordo(L, .5)) + cer(x, 104, .45, "#adb5bd") + cer(x, 109.5, .45, "#adb5bd");
    });
    s += poly([[16, 91.6], [113, 91.6], [114.5, 95.2], [14.5, 95.2]], lin("mt", [[0, chiaro(MIELE, .25)], [1, MIELE]], 0, 0, 0, 1), bordo(L, .6)) + rett(14.5, 95.2, 100, 3.6, .6, lin("mf", [[0, NOCE], [1, scuro(NOCE, .3)]], 0, 0, 0, 1), bordo(L, .8)) + tratto("M15.5,95.7 H113.5", "#ffffff", .5, op(.4));   // la mensola
    // il pezzo di sciarpa che sta sopra la mensola
    s += pth("M99.4,95.4 Q99.2,90 105.4,89.6 Q111.6,90 111.4,95.4 Z", RO, bordo(L, .6)) + dentro("M99.4,95.4 Q99.2,90 105.4,89.6 Q111.6,90 111.4,95.4 Z", rett(103.2, 88, 1.8, 8, 0, BL) + rett(107.6, 88, 1.8, 8, 0, BL) + rett(102.4, 88, .5, 8, 0, "#f8f9fa") + rett(106.8, 88, .5, 8, 0, "#f8f9fa") + rett(99, 88, 13, 3, 0, "#ffffff", op(.2)));
    // il televisore: il sopra della scatola, la scatola, la cornice dello schermo, lo schermo con la partita
    function schermo() {
      var w = SX1 - SX0, h = SY1 - SY0, o = "", x0 = SX0, y0 = SY0, yc = y0 + h * .19, cy = yc + 2.3, Hc = SY1 - cy, k;
      o += rett(x0, y0, w, h, 0, "#2c3446");
      for (k = 0; k < 95; k++) o += cer(x0 + r() * w, y0 + r() * (yc - y0), .5 + r() * .4, ["#e9ecef", "#ffd43b", "#ff6b6b", "#74c0fc", "#ffa94d", "#ced4da"][Math.floor(r() * 6)], op(.75));   // il pubblico
      var cart = ["#e03131", "#1c7ed6", "#fab005", "#f8f9fa", "#2f9e44", "#e03131"];
      for (k = 0; k < 6; k++) o += rett(x0 + k * w / 6, yc, w / 6 - .3, 2.3, 0, cart[k]) + rett(x0 + k * w / 6 + 1.6, yc + .85, w / 6 - 3.5, .6, 0, "#ffffff", op(.7));   // i cartelloni
      o += rett(x0, cy, w, Hc, 0, "#3f9b3a");
      var mx = x0 + w / 2;
      for (k = -2; k < 10; k++) { var xa = x0 + k * w / 7, xb = xa + w / 14; o += poly([[mx + (xa - mx) * .92, cy], [mx + (xb - mx) * .92, cy], [mx + (xb - mx) * 1.1, SY1], [mx + (xa - mx) * 1.1, SY1]], "#56b44c", op(.9)); }   // le strisce del prato
      var hx = x0 + w * .52;
      o += tratto("M" + q(x0, cy + 1.3) + " L" + q(x0 + w, cy + 1.3), "#f8f9fa", .5) + tratto("M" + q(hx, cy + 1.3) + " L" + q(hx + 1, SY1), "#f8f9fa", .5) + ell(hx + .5, cy + Hc * .52, 9.4, 3.8, "none", "stroke='#f8f9fa' stroke-width='.5'") + cer(hx + .5, cy + Hc * .52, .5, "#f8f9fa");
      function omino(x, y, maglia, calz, kk) {   // un giocatorino visto da lontano
        return ell(x, y + .2, 1.2 * kk, .4 * kk, "#000", op(.3)) + tratto("M" + q(x - .5 * kk, y) + " L" + q(x - .3 * kk, y - 1.6 * kk) + " M" + q(x + .5 * kk, y) + " L" + q(x + .3 * kk, y - 1.6 * kk), calz, .6 * kk) + rett(x - .75 * kk, y - 2.4 * kk, 1.5 * kk, 1 * kk, .2, "#f8f9fa") + rett(x - .85 * kk, y - 4.5 * kk, 1.7 * kk, 2.2 * kk, .4, maglia) + cer(x, y - 5.1 * kk, .62 * kk, "#f1c9a5");
      }
      var gente = [[.16, .42, RO, BL], [.29, .72, "#f8f9fa", "#212529"], [.4, .36, RO, BL], [.47, .6, "#f8f9fa", "#212529"], [.57, .48, RO, BL], [.66, .8, "#212529", "#212529"], [.74, .34, "#f8f9fa", "#212529"], [.84, .62, RO, BL], [.9, .28, "#f8f9fa", "#212529"]];
      gente.sort(function (m, n) { return m[1] - n[1]; }).forEach(function (g) { o += omino(x0 + w * g[0], cy + Hc * g[1], g[2], g[3], .85 + g[1] * .5); });
      o += cer(x0 + w * .53, cy + Hc * .66, .6, "#ffffff", "stroke='#212529' stroke-width='.15'");   // il pallone
      o += rett(x0 + 1.6, y0 + 1.4, 12.4, 3.6, .6, "#111418", op(.85)) + rett(x0 + 2.3, y0 + 2.1, 2.2, 2.2, .3, RO) + rett(x0 + 8.3, y0 + 2.1, 2.2, 2.2, .3, "#f8f9fa") + rett(x0 + 5.2, y0 + 2.3, 1.4, 1.8, .2, "#f8f9fa") + rett(x0 + 11.2, y0 + 2.3, 1.4, 1.8, .2, "#f8f9fa");   // il punteggio (solo colori e numerini)
      o += rett(x0, y0, w, h, 0, nuovaR([[0, "#000", 0], [.72, "#000", .05], [1, "#000", .45]], .5, .5, .72));   // il vetro bombato, più scuro ai bordi
      for (k = 1; k < h; k += 1.3) o += rett(x0, y0 + k, w, .35, 0, "#000", op(.07));   // le righe del tubo
      if (NOTTE) o += rett(x0, y0, w, h, 0, "#ffffff", op(.12));
      return o + pth("M" + q(x0, y0) + " L" + q(x0 + w * .52, y0) + " Q" + q(x0 + w * .2, y0 + h * .22) + " " + q(x0, y0 + h * .58) + " Z", "#ffffff", op(.17));   // il riflesso
    }
    s += poly([[X0 + 3, Y0 - 4], [X1 - 3, Y0 - 4], [X1 - .4, Y0 + 1.2], [X0 + .4, Y0 + 1.2]], lin("tt", [[0, "#61666d"], [1, "#33363b"]], 0, 0, 0, 1), bordo(L, 1));   // il sopra della scatola
    [36, 84].forEach(function (x) { s += rett(x - 2, Y1 - .4, 4, 1.6, .5, "#16181b", bordo(L, .4)); });   // i piedini
    var dC = rettD(X0, Y0, X1 - X0, Y1 - Y0, 5), dS = rettD(SX0, SY0, SX1 - SX0, SY1 - SY0, 4);
    s += pth(dC, lin("tc", [[0, "#41454b"], [.55, "#26292d"], [1, "#16181b"]], 0, 0, 1, 1), bordo(L, 1.5)) + tratto("M" + q(X0 + 4, Y0 + 1.3) + " L" + q(X1 - 4, Y0 + 1.3), "#ffffff", .6, op(.35));
    s += rett(SX0 - 2.2, SY0 - 2.2, SX1 - SX0 + 4.4, SY1 - SY0 + 4.4, 5.5, lin("bz", [[0, "#aeb5bc"], [1, "#5c636a"]], 0, 0, 1, 1), bordo(L, .6));   // la cornice d'argento
    if (NOTTE) s += rett(SX0 - 1.4, SY0 - 1.4, SX1 - SX0 + 2.8, SY1 - SY0 + 2.8, 5, "none", "stroke='#dbeaff' stroke-width='2' opacity='.45'");
    s += dentro(dS, schermo()) + pth(dS, "none", bordo(L, .8));
    for (i = 0; i < 9; i++) s += rett(82.6, 53 + i * 1.9, 11, .9, .45, "#0b0c0e") + rett(82.6, 53.9 + i * 1.9, 11, .3, 0, "#ffffff", op(.12));   // la grata dell'altoparlante
    for (i = 0; i < 6; i++) s += rett(83 + (i % 2) * 5.6, 73 + Math.floor(i / 2) * 3.6, 4.4, 2.4, .5, lin("pu", [[0, "#e9ecef"], [1, "#868e96"]], 0, 0, 0, 1), bordo(L, .3));   // i tasti dei canali
    s += cer(88, 88.4, .8, NOTTE ? "#ffb3b3" : "#c92a2a", bordo(L, .25)) + (NOTTE ? cer(88, 88.4, 2.2, "#ff6b6b", op(.3)) : "") + rett(47, 90.4, 14, 1.5, .6, "#868e96", op(.9));   // la lucina e la targhetta
    // l'antenna a baffo
    var ab = [60, Y0 - 2.6];
    [[46.5, 17.5], [76, 19]].forEach(function (t) { s += tratto(linea(ab, t), L, 1.5) + tratto(linea(ab, t), "#ced4da", .7) + cer(t[0], t[1], .9, lin("pa", CROMO, 0, 0, 1, 1), bordo(L, .3)); });
    s += pth("M" + q(ab[0] - 3.6, ab[1] + 1.4) + " Q" + q(ab[0] - 3.4, ab[1] - 2.4) + " " + q(ab[0], ab[1] - 2.6) + " Q" + q(ab[0] + 3.4, ab[1] - 2.4) + " " + q(ab[0] + 3.6, ab[1] + 1.4) + " Z", lin("ba", [[0, "#5c636a"], [1, "#1d1f22"]], 0, 0, 1, 1), bordo(L, .6));
    // le due code della sciarpa rossoblù che scendono dalla mensola, con la frangia
    function coda(x, y0, y1, w) {
      var d = "M" + q(x, y0) + " L" + q(x + w, y0) + " L" + q(x + w + .4, y1) + " L" + q(x + .2, y1) + " Z", f = "", yy, j = 0, k;
      for (yy = y0; yy < y1; yy += 3.6) { f += rett(x - 1, yy, w + 2, 3.6, 0, j % 2 ? BL : RO) + rett(x - 1, yy + 3.1, w + 2, .5, 0, "#f8f9fa", op(.9)); j++; }
      for (k = 1; k < w; k += 1.1) f += rett(x + k, y0, .25, y1 - y0, 0, "#000", op(.12));   // la maglia
      f += rett(x, y0, w, y1 - y0, 0, nuova([[0, "#fff", .18], [.5, "#fff", 0], [1, "#000", .2]], 0, 0, 1, 0));
      var o = pth(d, "#000", op(.2) + " transform='translate(1 1.2)'") + pth(d, RO) + dentro(d, f) + pth(d, "none", bordo(L, .6));
      for (k = 0; k <= w; k += .9) o += tratto(linea([x + .3 + k, y1], [x + .4 + k, y1 + 3]), j % 2 ? BL : RO, .5);   // la frangia
      return o;
    }
    return s + coda(104.6, 96.6, 133, 6.6) + coda(99.6, 95.6, 141, 6.8);
  });

  // =========================================================
  //  IL VENTILATORE A PALE (appeso in alto, sotto si cammina): il rosone e l'asta d'ottone, il motore a campana
  //  con le fasce, le cinque pale di noce sulle staffe d'ottone, la catenella, la lampada a globo di vetro smerigliato.
  //  Di notte la lampada è accesa.
  // =========================================================
  def("ventilatore", { tipo: "sospeso", nome: "Ventilatore a pale", fp: [1, 1], box: [-44, -256, 44, -178], luce: [0, 0, 193, 130, "#ffe6b0"] }, function () {
    var ZC = 251, ZR = 222, ZM = 208, ZP = 209.4, s = "";
    s += tornito(0, 0, [[ZC - 6, .03], [ZC - 4.6, .055], [ZC - 1.6, .066], [ZC, .068]], OTTONE, 1, [1]);   // il rosone al soffitto
    s += tornito(0, 0, [[ZR - 1, .014], [ZC - 6, .014]], OTTONE, .8, null, .5);   // l'asta
    var pale = [0, 1, 2, 3, 4].map(function (k) { var t = (9 + 72 * k) * Math.PI / 180; return { t: t, v: vicino(Math.cos(t), Math.sin(t)) }; }).sort(function (x, y) { return x.v - y.v; });
    function pala(pp) {
      var t = pp.t, c = Math.cos(t), sn = Math.sin(t), r0 = .12, r1 = .6, w0 = .032, w1 = .056, k, o = "";
      function pt(rr, w, z) { return P(c * rr - sn * w, sn * rr + c * w, z); }
      var top = [pt(r0, -w0, ZP), pt(r1 - .056, -w1, ZP)];
      for (k = 1; k < 8; k++) { var an = -Math.PI / 2 + Math.PI * k / 8; top.push(pt(r1 - .056 + .056 * Math.cos(an), w1 * Math.sin(an), ZP)); }
      top.push(pt(r1 - .056, w1, ZP), pt(r0, w0, ZP));
      var sotto = top.map(function (w) { return [w[0], w[1] + 1.4]; }), m0 = pt(r0, 0, ZP), m1 = pt(r1, 0, ZP);
      o += pth(chiuso(sotto), scuro(NOCE, .45), bordo(L, 1)) + pth(chiuso(top), nuova([[0, chiaro(NOCE, .5)], [.5, chiaro(NOCE, .12)], [1, scuro(NOCE, .15)]], m0[0], m0[1], m1[0], m1[1], true), bordo(L, 1));
      o += tratto(linea(pt(r0 + .03, -.012, ZP), pt(r1 - .07, -.02, ZP)), chiaro(NOCE, .35), .45, op(.65)) + tratto(linea(pt(r0 + .05, .014, ZP), pt(r1 - .09, .022, ZP)), scuro(NOCE, .35), .4, op(.5));   // le venature
      o += ottone(linea(pt(.07, 0, ZM + 1), pt(.21, 0, ZP + .5)), 1.9) + cer(pt(.18, -.012, ZP + .7)[0], pt(.18, -.012, ZP + .7)[1], .45, "#5a3c0c") + cer(pt(.18, .012, ZP + .7)[0], pt(.18, .012, ZP + .7)[1], .45, "#5a3c0c");   // la staffa d'ottone con le viti
      return o;
    }
    s += pale.filter(function (x) { return x.v < 0; }).map(pala).join("");
    s += tornito(0, 0, [[ZM - 1.2, .07], [ZM, .095], [ZM + 2, .106], [ZM + 9.4, .106], [ZM + 11.6, .09], [ZM + 13, .055], [ZR, .03]], OTTONE, 1.3, [2, 3, 4], 1.1);   // il motore a campana
    s += tornito(0, 0, [[ZM - 7.2, .045], [ZM - 5.6, .053], [ZM - 1.2, .062]], OTTONE, 1, [1]);   // la scatolina dell'interruttore
    var ca = P(.03, .03, ZM - 6), cb = [ca[0] + .6, ca[1] + 17];
    s += tratto(linea(ca, cb), "#8a6a2a", .55, "stroke-dasharray='.55 .45'") + pth("M" + q(cb[0] - .9, cb[1] + .4) + " Q" + q(cb[0], cb[1] - .8) + " " + q(cb[0] + .9, cb[1] + .4) + " L" + q(cb[0], cb[1] + 2.4) + " Z", nuovaR(ORO_C, .35, .3, .8), bordo(L, .3));   // la catenella col pomellino
    s += tornito(0, 0, [[ZM - 9, .03], [ZM - 7.2, .036]], OTTONE, .8);
    var gl = [[ZM - 22.4, .018], [ZM - 21.6, .042], [ZM - 19.6, .064], [ZM - 16, .078], [ZM - 12.4, .074], [ZM - 10, .056], [ZM - 9, .034]];
    s += tornito(0, 0, gl, NOTTE ? [[0, "#fffef6"], [.5, "#fff3c8"], [1, "#f5c870"]] : [[0, "#ffffff"], [.45, "#f4f1ea"], [1, "#c9c2b2"]], 1, null, NOTTE ? 0 : 1.2);   // il globo di vetro smerigliato
    if (NOTTE) { var lc = P(0, 0, ZM - 15); s += cer(lc[0], lc[1], 9, nuovaR([[0, "#fffbe6", .9], [.5, "#ffe8a8", .35], [1, "#ffe8a8", 0]], .5, .5, .5)); }
    else { var lr = P(0, 0, ZM - 13); s += ell(lr[0] - 2.2, lr[1] - 1, 1, 2.4, "#ffffff", op(.75)); }
    return s + pale.filter(function (x) { return x.v >= 0; }).map(pala).join("");
  });

  // =========================================================
  //  LA FOTO DELLA SQUADRA (larga due pezzi di muro): in bianco e nero, un po' color seppia, nella cornice di noce
  //  col filetto d'oro e il passe-partout; dietro in piedi l'allenatore col cappello, i giocatori e il presidente,
  //  il portiere col maglione scuro; davanti accovacciati gli altri, in mezzo la coppa vinta e il pallone.
  //  La targhetta d'ottone sotto, il filo e il chiodo.
  // =========================================================
  def("foto_squadra", { tipo: "parete", nome: "Foto della squadra", fp: [2, 1] }, function () {
    var s = "", X0 = 15, Y0 = 50, W = 94, H = 64, fr = 5.2, pp = 4, px = X0 + fr + pp, py = Y0 + fr + pp, pw = W - 2 * (fr + pp), ph = H - 2 * (fr + pp), r = rnd(1968), i;
    var PEL = "#cdbfa6", CAP = "#2f2922", MAG = "#4b443a", BIA = "#ebe4d3", SC = "#2a251f";
    function inPiedi(x, yp, tipo) {   // in piedi (i piedi a yp)
      var o = "", maglia = tipo === "portiere" ? "#1e1b17" : tipo ? "#3a352d" : MAG;
      if (!tipo || tipo === "portiere") {
        o += tratto("M" + q(x - 1, yp - 7.4) + " L" + q(x - 1.1, yp - .4) + " M" + q(x + 1, yp - 7.4) + " L" + q(x + 1.1, yp - .4), SC, 1.5) + rett(x - 1.9, yp - 5.2, 3.8, .7, 0, BIA, op(.9)) + ell(x - 1.4, yp - .2, 1.2, .55, "#141210") + ell(x + 1.4, yp - .2, 1.2, .55, "#141210");
        o += rett(x - 2.6, yp - 10.6, 5.2, 3.5, .7, tipo === "portiere" ? "#2a251f" : BIA);   // i calzoncini
      } else o += rett(x - 2.2, yp - 10.8, 4.4, 10.4, .6, maglia) + ell(x - 1.3, yp - .2, 1.3, .55, "#141210") + ell(x + 1.3, yp - .2, 1.3, .55, "#141210") + rett(x - .15, yp - 9, .3, 8, 0, "#000", op(.3));   // i pantaloni del vestito
      o += pth("M" + q(x - 3.3, yp - 17) + " L" + q(x + 3.3, yp - 17) + " L" + q(x + 2.7, yp - 10.4) + " L" + q(x - 2.7, yp - 10.4) + " Z", maglia);
      o += tratto("M" + q(x - 3.1, yp - 16.6) + " L" + q(x - 3.5, yp - 11) + " M" + q(x + 3.1, yp - 16.6) + " L" + q(x + 3.5, yp - 11), maglia, 1.5);   // le braccia
      o += pth("M" + q(x - 1.2, yp - 17) + " L" + q(x, yp - 15.3) + " L" + q(x + 1.2, yp - 17) + " Z", BIA);   // il colletto
      if (tipo === "allenatore" || tipo === "presidente") o += tratto("M" + q(x - .2, yp - 16.6) + " L" + q(x - .2, yp - 13), "#1a1714", .5);   // la cravatta
      o += cer(x, yp - 19, 1.9, PEL) + pth("M" + q(x - 1.9, yp - 19.2) + " Q" + q(x - 1.8, yp - 21.2) + " " + q(x, yp - 21.1) + " Q" + q(x + 1.8, yp - 21.2) + " " + q(x + 1.9, yp - 19.2) + " Q" + q(x, yp - 20.2) + " " + q(x - 1.9, yp - 19.2) + " Z", CAP);
      if (tipo === "allenatore") o += ell(x, yp - 20.6, 3, .7, "#25211c") + pth("M" + q(x - 1.8, yp - 20.6) + " Q" + q(x - 1.7, yp - 23) + " " + q(x, yp - 23) + " Q" + q(x + 1.7, yp - 23) + " " + q(x + 1.8, yp - 20.6) + " Z", "#25211c");   // il cappello
      if (tipo === "portiere") o += pth("M" + q(x - 2, yp - 19.8) + " Q" + q(x, yp - 22.2) + " " + q(x + 2, yp - 19.8) + " L" + q(x + 3, yp - 19.6) + " Z", "#1a1714");   // il berretto
      return o;
    }
    function accovacciato(x, yp) {   // accovacciato davanti, con un ginocchio a terra
      var o = tratto("M" + q(x - 1.6, yp - 4.4) + " L" + q(x - 2.8, yp - .8) + " L" + q(x - 4.4, yp - .4) + " M" + q(x + 1.4, yp - 4.6) + " L" + q(x + 2.6, yp - 4.2) + " L" + q(x + 2.9, yp - .4), SC, 1.5);
      o += ell(x - 4.8, yp - .3, 1.1, .5, "#141210") + ell(x + 3.3, yp - .2, 1.2, .55, "#141210");
      o += rett(x - 2.8, yp - 7.2, 5.6, 3, .8, BIA) + pth("M" + q(x - 3.2, yp - 12.8) + " L" + q(x + 3.2, yp - 12.8) + " L" + q(x + 2.8, yp - 7) + " L" + q(x - 2.8, yp - 7) + " Z", MAG);
      o += tratto("M" + q(x - 3, yp - 12.4) + " L" + q(x - 2.2, yp - 6.8) + " M" + q(x + 3, yp - 12.4) + " L" + q(x + 2.6, yp - 6.6), MAG, 1.4) + pth("M" + q(x - 1.2, yp - 12.8) + " L" + q(x, yp - 11.2) + " L" + q(x + 1.2, yp - 12.8) + " Z", BIA);
      return o + cer(x, yp - 14.8, 1.9, PEL) + pth("M" + q(x - 1.9, yp - 15) + " Q" + q(x - 1.8, yp - 17) + " " + q(x, yp - 16.9) + " Q" + q(x + 1.8, yp - 17) + " " + q(x + 1.9, yp - 15) + " Q" + q(x, yp - 16) + " " + q(x - 1.9, yp - 15) + " Z", CAP);
    }
    function foto() {
      var o = rett(px, py, pw, ph * .46, 0, lin("ci", [[0, "#d9d1c0"], [1, "#bfb5a2"]], 0, 0, 0, 1)), k;
      for (k = 0; k < 16; k++) o += ell(px + r() * pw, py + ph * .34 + r() * 2.5, 3 + r() * 4, 2.4 + r() * 2.2, "#8d8473", op(.9));   // gli alberi lontani
      o += rett(px, py + ph * .4, pw, ph * .6, 0, lin("pr", [[0, "#a49b88"], [1, "#857c6b"]], 0, 0, 0, 1)) + rett(px, py + ph * .38, pw, 1.8, 0, "#6e6658");   // il prato e il muretto
      var dietro = [[.07, "allenatore"], [.19, 0], [.3, 0], [.41, 0], [.52, "portiere"], [.63, 0], [.74, 0], [.88, "presidente"]], yb = py + ph * .77;
      dietro.forEach(function (g) { o += inPiedi(px + pw * g[0], yb, g[1]); });
      [.17, .29, .41, .73, .85].forEach(function (t) { o += accovacciato(px + pw * t, py + ph * .97); });
      // la coppa vinta, in mezzo davanti, e il pallone
      var cx = px + pw * .57, cy = py + ph * .975;
      o += rett(cx - 2.6, cy - 1.8, 5.2, 1.8, .3, "#2a251f") + pth("M" + q(cx - .7, cy - 1.8) + " L" + q(cx - .4, cy - 4.4) + " L" + q(cx + .4, cy - 4.4) + " L" + q(cx + .7, cy - 1.8) + " Z", "#d9d2c4");
      o += pth("M" + q(cx - 3.4, cy - 9.6) + " Q" + q(cx - 3.2, cy - 5) + " " + q(cx, cy - 4.4) + " Q" + q(cx + 3.2, cy - 5) + " " + q(cx + 3.4, cy - 9.6) + " Z", lin("cp", [[0, "#ffffff"], [.5, "#cfc8ba"], [1, "#7a7366"]], 0, 0, 1, 0), "stroke='#2a251f' stroke-width='.3'") + tratto("M" + q(cx - 3.3, cy - 8.8) + " C" + q(cx - 6, cy - 9.4) + " " + q(cx - 5.6, cy - 6) + " " + q(cx - 2.4, cy - 5.6) + " M" + q(cx + 3.3, cy - 8.8) + " C" + q(cx + 6, cy - 9.4) + " " + q(cx + 5.6, cy - 6) + " " + q(cx + 2.4, cy - 5.6), "#bdb6a8", .6);
      o += ell(cx, cy - 9.6, 3.4, .8, "#6e675b") + ell(cx - 1.6, cy - 7.4, .5, 1.4, "#ffffff", op(.8));
      var bx = px + pw * .65, by = py + ph * .955;
      o += cer(bx, by, 2.2, "#e2dccd", "stroke='#2a251f' stroke-width='.3'") + tratto("M" + q(bx - 2.1, by - .4) + " Q" + q(bx, by + .8) + " " + q(bx + 2.1, by - .4) + " M" + q(bx - .8, by - 2) + " Q" + q(bx - 1.3, by) + " " + q(bx - .7, by + 2), "#6e675b", .3);
      // il viraggio seppia, l'alone scuro ai bordi, i graffi
      o += rett(px, py, pw, ph, 0, nuovaR([[0, "#000", 0], [.68, "#000", .06], [1, "#3a2a10", .42]], .5, .5, .72)) + rett(px, py, pw, ph, 0, "#a5793d", op(.1));
      return o + tratto("M" + q(px + pw * .62, py + 1) + " L" + q(px + pw * .66, py + ph * .45), "#ffffff", .3, op(.5)) + tratto("M" + q(px + pw * .2, py + ph * .55) + " Q" + q(px + pw * .26, py + ph * .7) + " " + q(px + pw * .23, py + ph * .86), "#ffffff", .25, op(.4));
    }
    s += tratto("M" + q(X0 + 14, Y0 + 3) + " L" + q(X0 + W / 2, Y0 - 9) + " L" + q(X0 + W - 14, Y0 + 3), "#6b6258", .45) + cer(X0 + W / 2, Y0 - 9.4, .9, "#868e96", bordo(L, .3));   // il filo e il chiodo
    s += rett(X0 + 2.6, Y0 + 3.4, W, H, 1.5, "#000", op(.16));   // l'ombra sul muro
    s += rett(X0, Y0, W, H, 1.2, lin("cf", [[0, chiaro(NOCE_SC, .3)], [1, scuro(NOCE_SC, .3)]], 0, 0, 1, 1), bordo(L, 1.2));   // la cornice di noce
    s += tratto("M" + q(X0 + 1.2, Y0 + H - 1.2) + " L" + q(X0 + 1.2, Y0 + 1.2) + " L" + q(X0 + W - 1.2, Y0 + 1.2), chiaro(NOCE_SC, .5), .7, op(.8)) + tratto("M" + q(X0 + fr, Y0 + H - fr) + " L" + q(X0 + W - fr, Y0 + H - fr) + " L" + q(X0 + W - fr, Y0 + fr), chiaro(NOCE_SC, .4), .6, op(.7));
    s += venatureO(W, fr, 6, 71, NOCE_SC, .35, X0, Y0) + venatureO(W, fr, 6, 72, NOCE_SC, .35, X0, Y0 + H - fr);
    s += rett(X0 + fr - .8, Y0 + fr - .8, W - 2 * fr + 1.6, H - 2 * fr + 1.6, 0, "none", "stroke='#d9a530' stroke-width='.8'");   // il filetto d'oro
    s += rett(X0 + fr, Y0 + fr, W - 2 * fr, H - 2 * fr, 0, "#efe6d0") + tratto("M" + q(X0 + fr, Y0 + H - fr) + " L" + q(X0 + fr, Y0 + fr) + " L" + q(X0 + W - fr, Y0 + fr), "#000", 1.2, op(.18));   // il passe-partout
    s += dentro(rettD(px, py, pw, ph, 0), foto()) + rett(px, py, pw, ph, 0, "none", "stroke='#7d7466' stroke-width='.45'");
    s += dentro(rettD(X0 + fr, Y0 + fr, W - 2 * fr, H - 2 * fr, 0), poly([[X0 + 20, Y0], [X0 + 34, Y0], [X0 + 12, Y0 + H], [X0 - 2, Y0 + H]], "#ffffff", op(.13)) + poly([[X0 + 40, Y0], [X0 + 44, Y0], [X0 + 22, Y0 + H], [X0 + 18, Y0 + H]], "#ffffff", op(.09)));   // il vetro
    s += rett(X0 + W / 2 - 9, Y0 + H - fr + .7, 18, 3.6, .5, lin("tg", ORO, 0, 0, 0, 1), bordo(L, .35)) + rett(X0 + W / 2 - 6, Y0 + H - fr + 1.9, 12, .4, 0, "#7a5614") + rett(X0 + W / 2 - 4, Y0 + H - fr + 2.9, 8, .4, 0, "#7a5614");   // la targhetta incisa
    return s;
  });

  // =========================================================
  //  LA BANDIERA ITALIANA: il drappo verde, bianco e rosso con le pieghe morbide e la frangia d'oro,
  //  appeso con gli anellini all'asta di legno con le punte di lancia d'ottone, sulle due staffe; le nappine d'oro
  // =========================================================
  def("bandiera_italia", { tipo: "parete", nome: "Bandiera italiana" }, function () {
    var s = "", x0 = 9, x1 = 53, y0 = 52.4, h = 30, VE = "#009246", BI = "#f4f5f0", RS = "#ce2b37", i, w = x1 - x0;
    function yb(x) { return y0 + h + Math.sin((x - x0) / w * Math.PI * 4 - .4) * 1.3; }   // l'orlo in basso, ondulato dalle pieghe
    var d = "M" + q(x0, y0) + " L" + q(x1, y0) + " Q" + q(x1 + 1, y0 + h * .5) + " " + q(x1 + .3, yb(x1));
    for (i = 15; i >= 0; i--) d += " L" + q(x0 + w * i / 16, yb(x0 + w * i / 16));
    d += " Q" + q(x0 - .8, y0 + h * .5) + " " + q(x0, y0) + " Z";
    s += pth(d, "#000", op(.14) + " transform='translate(2.4 3.2)'");   // l'ombra sul muro
    var pieghe = nuova([[0, "#000", .14], [.12, "#fff", .16], [.25, "#000", .14], [.37, "#fff", .14], [.5, "#000", .15], [.62, "#fff", .16], [.75, "#000", .13], [.87, "#fff", .13], [1, "#000", .16]], x0, 0, x1, 0, true);
    s += dentro(d, rett(x0 - 2, y0 - 2, w / 3 + 2, h + 6, 0, VE) + rett(x0 + w / 3, y0 - 2, w / 3, h + 6, 0, BI) + rett(x0 + 2 * w / 3, y0 - 2, w / 3 + 3, h + 6, 0, RS) + rett(x0 - 2, y0 - 2, w + 4, h + 6, 0, pieghe) + rett(x0 - 2, y0 - 2, w + 4, 6, 0, nuova([[0, "#000", .2], [1, "#000", 0]], 0, 0, 0, 1)));
    s += pth(d, "none", bordo(L, .7));
    for (i = 0; i <= 55; i++) { var x = x0 + w * i / 55, y = yb(x); s += tratto(linea([x, y + .2], [x + .1, y + 2.6]), i % 2 ? "#e9b949" : "#b8861f", .55); }   // la frangia d'oro
    s += tratto("M" + q(x0, yb(x0) + 2.4) + " " + Array.apply(null, Array(17)).map(function (_, k) { var x = x0 + w * k / 16; return "L" + q(x, yb(x) + 2.5); }).join(" "), "#8a6514", .4, op(.6));
    // l'asta di legno, le staffe, gli anellini, le punte d'ottone e le nappine
    [14, 48].forEach(function (x) { s += rett(x - 1, 47.6, 2, 3.4, .5, lin("st", OTTONE, 0, 0, 1, 0), bordo(L, .35)); });
    s += rett(5, 49.6, 52, 2.4, 1.2, lin("as", [[0, "#a0673a"], [.5, "#6b3f22"], [1, "#3e2412"]], 0, 0, 0, 1), bordo(L, .6)) + rett(6, 50, 50, .5, 0, "#ffffff", op(.3));
    for (i = 0; i < 7; i++) s += ell(x0 + 2 + i * (w - 4) / 6, 51.6, 1, 1.4, "none", "stroke='#c99a36' stroke-width='.55'");
    [[5, -1], [57, 1]].forEach(function (g) {
      var x = g[0], k = g[1];
      s += pth("M" + q(x, 49.4) + " L" + q(x + k * 3.6, 50.8) + " L" + q(x, 52.2) + " Q" + q(x + k * .9, 50.8) + " " + q(x, 49.4) + " Z", lin("pn", OTTONE, 0, 0, 1, 1), bordo(L, .4));   // la punta di lancia
      s += tratto("M" + q(x + k * -.6, 52) + " Q" + q(x + k * -.2, 58) + " " + q(x + k * -.8, 63), "#c99a36", .55) + pth("M" + q(x + k * -.8, 62.6) + " L" + q(x + k * -.8 - 1.1, 67.4) + " L" + q(x + k * -.8 + 1.1, 67.4) + " Z", lin("nap", OTTONE, 0, 0, 1, 0), bordo("#7a5614", .3));   // il cordone e la nappina
    });
    return s;
  });

  // =========================================================
  //  IL CALENDARIO E IL CARTELLO DEL TORNEO DI SCOPA: il cartello di carta appeso con le puntine colorate, col nastro rosso
  //  in alto, il ventaglio di carte napoletane (l'asso di denari, l'asso di coppe, il tre di spade, il settebello)
  //  e la coppa, le righe scritte piccole (da lontano, niente lettere) e il tricolore in fondo; sotto, appeso al chiodo,
  //  il calendario col paesaggio di campagna toscana, i giorni del mese e la data del torneo cerchiata di rosso.
  // =========================================================
  def("calendario_parete", { tipo: "parete", nome: "Calendario e torneo di scopa" }, function () {
    var s = "", i, j;
    function carta(cx, cy, ang, tipo) {   // una carta napoletana: il bordo, il disegno del seme
      var w = 9, h = 14, x = cx - w / 2, y = cy - h / 2, o = rett(x + .5, y + .6, w, h, 1, "#000", op(.2)) + rett(x, y, w, h, 1, "#fffdf6", bordo(L, .4)) + rett(x + .8, y + .8, w - 1.6, h - 1.6, .6, "none", "stroke='#c92a2a' stroke-width='.3'");
      function moneta(mx, my, rr) { return cer(mx, my, rr, nuovaR([[0, "#fff1a8"], [.5, "#f2b824"], [1, "#a8641e"]], .35, .3, .8), "stroke='#7a4a10' stroke-width='.25'") + cer(mx, my, rr * .45, "#c92a2a"); }
      if (tipo === "denari") o += moneta(cx, cy, 3.3) + [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { var an = k * Math.PI / 4; return tratto(linea([cx + Math.cos(an) * 1.7, cy + Math.sin(an) * 1.7], [cx + Math.cos(an) * 2.8, cy + Math.sin(an) * 2.8]), "#a8641e", .3); }).join("");
      if (tipo === "settebello") [[-2.1, -4.2], [2.1, -4.2], [0, -2.1], [-2.1, 0], [2.1, 0], [-2.1, 4.2], [2.1, 4.2]].forEach(function (m) { o += moneta(cx + m[0], cy + m[1], 1.25); });
      if (tipo === "coppe") o += pth("M" + q(cx - 3, cy - 4.6) + " Q" + q(cx - 3, cy - .6) + " " + q(cx, cy) + " Q" + q(cx + 3, cy - .6) + " " + q(cx + 3, cy - 4.6) + " Z", lin("cc", [[0, "#ffd43b"], [1, "#c97a14"]], 0, 0, 1, 0), "stroke='#7a4a10' stroke-width='.3'") + rett(cx - .5, cy, 1, 2.6, 0, "#e0a020") + ell(cx, cy + 3, 2.4, .9, "#c92a2a", "stroke='#7a1515' stroke-width='.25'") + ell(cx, cy - 4.6, 3, .8, "#c92a2a");
      if (tipo === "spade") [-2.2, 0, 2.2].forEach(function (dx, k) { var a0 = [cx + dx - 1.2, cy + 4.6], a1 = [cx + dx + 1.2, cy - 4.6]; o += tratto(linea(a0, a1), "#1c4f9c", .9) + tratto(linea(lerp(a0, a1, .78), [lerp(a0, a1, .78)[0] - 1.3, lerp(a0, a1, .78)[1] - .3]), "#d9a530", .6) + tratto(linea(lerp(a0, a1, .78), [lerp(a0, a1, .78)[0] + 1.3, lerp(a0, a1, .78)[1] + .3]), "#d9a530", .6); });
      return ruota(cx, cy + 6, ang, o);
    }
    // il cartello del torneo, un po' storto
    var poster = rett(9.6, 38.8, 44, 46, .6, "#000", op(.18)) + rett(9, 38, 44, 46, .6, lin("pa", [[0, "#fffaf0"], [1, "#efe4cc"]], 0, 0, 1, 1), bordo("#8a7a5a", .45));
    poster += pth("M10,42.4 L14,41.8 L14,48 L10,47.6 L11.6,45 Z", "#8f1d1d") + pth("M52,42.4 L48,41.8 L48,48 L52,47.6 L50.4,45 Z", "#8f1d1d") + rett(13, 40.8, 36, 6.4, .6, lin("na", [[0, "#ef4444"], [1, "#b91c1c"]], 0, 0, 0, 1), bordo("#6b1010", .35));   // il nastro rosso
    poster += stella(17, 44, 1.5, .6, "#ffe066") + stella(45, 44, 1.5, .6, "#ffe066") + [22, 26.5, 31, 35.5, 40].map(function (x, k) { return rett(x - 1.4, 43.2 - (k % 2) * .3, 2.8 + (k % 2), 1.6, .6, "#ffffff", op(.85)); }).join("");   // (da lontano sembra scritto)
    poster += carta(17.6, 62, -26, "denari") + carta(22.2, 61, -9, "coppe") + carta(26.8, 61, 9, "spade") + carta(31.4, 62, 26, "settebello");
    var cx = 44.4, cy = 62;   // la coppa del torneo
    poster += pth("M" + q(cx - 4, cy - 6) + " Q" + q(cx - 3.8, cy - .4) + " " + q(cx, cy + .4) + " Q" + q(cx + 3.8, cy - .4) + " " + q(cx + 4, cy - 6) + " Z", lin("ct", ORO_C, 0, 0, 1, 0), bordo(L, .4)) + tratto("M" + q(cx - 3.8, cy - 5) + " C" + q(cx - 7, cy - 5.6) + " " + q(cx - 6.4, cy - 1.6) + " " + q(cx - 2.6, cy - 1) + " M" + q(cx + 3.8, cy - 5) + " C" + q(cx + 7, cy - 5.6) + " " + q(cx + 6.4, cy - 1.6) + " " + q(cx + 2.6, cy - 1), "#c08a1c", .8);
    poster += rett(cx - .7, cy + .4, 1.4, 3, 0, "#c08a1c") + rett(cx - 3, cy + 3.4, 6, 1.6, .4, "#3a3f45") + ell(cx, cy - 6, 4, 1, "#a8781a") + ell(cx - 1.8, cy - 3.6, .6, 1.6, "#ffffff", op(.75));
    poster += [[16, 46, 76.4], [19, 43, 78.6], [22, 40, 80.6]].map(function (g) { return rett(g[0], g[2], g[1] - g[0], .9, .45, "#6b6258", op(.75)); }).join("");   // le righe piccole
    poster += rett(9.6, 82.4, 14.27, 1.3, 0, "#009246") + rett(23.87, 82.4, 14.27, 1.3, 0, "#f4f5f0") + rett(38.13, 82.4, 14.27, 1.3, 0, "#ce2b37");
    [[11.4, 40.2, "#e03131"], [50.6, 40.2, "#1c7ed6"], [11.4, 81.6, "#f59f00"], [50.6, 81.6, "#2f9e44"]].forEach(function (pn) { poster += cer(pn[0] + .5, pn[1] + .6, 1.3, "#000", op(.25)) + cer(pn[0], pn[1], 1.3, pn[2], bordo(L, .3)) + cer(pn[0] - .4, pn[1] - .4, .4, "#ffffff", op(.8)); });   // le puntine
    s += ruota(31, 61, -2.2, poster);
    // il calendario appeso al chiodo
    s += tratto("M31,89 L23.5,96.2 M31,89 L38.5,96.2", "#6b6258", .45) + cer(31, 88.6, .9, "#868e96", bordo(L, .3));
    s += rett(14.8, 96.8, 34, 55, .5, "#000", op(.17)) + rett(14, 95.8, 34, 55, .5, "#fbfaf6", bordo("#8a7a5a", .45)) + rett(14, 95.8, 34, 2.6, .5, lin("me", CROMO, 0, 0, 0, 1), bordo(L, .3)) + cer(31, 97.1, .6, "#495057");
    var px = 15.6, py = 99.2, pw = 30.8, ph = 21.4, pd = rettD(px, py, pw, ph, 0), pae = rett(px, py, pw, ph, 0, lin("cl", [[0, "#8ec5ff"], [.7, "#d6ecff"], [1, "#fff3d6"]], 0, 0, 0, 1));
    pae += cer(px + pw * .78, py + ph * .3, 2.6, "#ffe066") + pth("M" + q(px, py + ph * .62) + " Q" + q(px + pw * .3, py + ph * .4) + " " + q(px + pw * .6, py + ph * .58) + " T" + q(px + pw, py + ph * .5) + " V" + f1(py + ph) + " H" + f1(px) + " Z", "#9bc46a");
    pae += pth("M" + q(px, py + ph * .78) + " Q" + q(px + pw * .4, py + ph * .55) + " " + q(px + pw, py + ph * .74) + " V" + f1(py + ph) + " H" + f1(px) + " Z", "#6fa94a") + pth("M" + q(px + pw * .45, py + ph) + " Q" + q(px + pw * .5, py + ph * .8) + " " + q(px + pw * .66, py + ph * .66), "none", "stroke='#f3e3b3' stroke-width='1'");
    [[.18, .55, 6.4], [.24, .58, 5.2], [.86, .52, 6]].forEach(function (c) { pae += ell(px + pw * c[0], py + ph * c[1] - c[2] / 2, 1, c[2] / 2, "#2f5d2a"); });   // i cipressi
    var cx2 = px + pw * .62, cy2 = py + ph * .56;   // il casolare col tetto rosso
    pae += rett(cx2 - 3, cy2 - 3, 6, 3.4, 0, "#f1e2c2", "stroke='#8a6a4a' stroke-width='.25'") + pth("M" + q(cx2 - 3.6, cy2 - 2.8) + " L" + q(cx2, cy2 - 5.2) + " L" + q(cx2 + 3.6, cy2 - 2.8) + " Z", "#c4512b") + rett(cx2 - .5, cy2 - 1.6, 1, 2, 0, "#8a5a3a");
    s += dentro(pd, pae) + rett(px, py, pw, ph, 0, "none", "stroke='#8a7a5a' stroke-width='.3'");
    s += rett(15.6, 121.6, 30.8, 3.4, .3, "#d62f2f") + rett(25, 122.6, 12, 1.4, .6, "#ffffff", op(.85));   // il mese
    for (j = 0; j < 7; j++) s += rett(16.6 + j * 4.3, 126.2, 2.2, .7, .3, j === 6 ? "#d62f2f" : "#868e96");
    for (i = 0; i < 5; i++) for (j = 0; j < 7; j++) { var n = i * 7 + j - 2; if (n < 0 || n > 30) continue; var gx = 16.4 + j * 4.3, gy = 128.4 + i * 4.2, cc = j === 6 ? "#d62f2f" : "#343a40"; s += rett(gx, gy, n >= 9 ? 1 : .9, 1.8, .2, cc) + (n >= 9 ? rett(gx + 1.4, gy, 1, 1.8, .2, cc) : ""); }
    s += ell(16.4 + 5 * 4.3 + 1.2, 128.4 + 2 * 4.2 + .9, 2.6, 2, "none", "stroke='#e03131' stroke-width='.55' transform='rotate(-8 " + f1(16.4 + 5 * 4.3 + 1.2) + " " + f1(128.4 + 2 * 4.2 + .9) + ")'");   // il giorno del torneo, cerchiato
    s += rett(14, 147.4, 34, 3.4, 0, "#2f7a3a", op(.9));
    return s;
  });

  // =========================================================
  //  LA VECCHIA POLTRONA DI PELLE (la poltrona club): lo schienale tondo che scende sui braccioli a rullo,
  //  il cuscino gonfio, il cordoncino lungo i bordi, i piedini a cipolla. La pelle marrone è vissuta:
  //  schiarita dove si appoggiano le mani e dove ci si siede, con le crepette, le macchie della patina.
  // =========================================================
  function patina(b, seme, n) { var r = rnd(seme), s = "", i; for (i = 0; i < (n || 8); i++) { var x = b[0] + r() * (b[2] - b[0]), y = b[1] + r() * (b[3] - b[1]); s += ell(x, y, 3 + r() * 6, 1.5 + r() * 2.5, r() < .5 ? "#fff" : "#000", op(.025 + r() * .035)); } return s; }
  function consumato(x, y, rx, ry, c) { return ell(x, y, rx, ry, nuovaR([[0, chiaro(c, .4), .8], [.55, chiaro(c, .28), .4], [1, chiaro(c, .2), 0]], .5, .5, .5)); }   // la pelle schiarita dall'uso
  function crepe(cx, cy, n, seme, c, larga) {   // le crepette della pelle vecchia
    var r = rnd(seme), s = "", i; larga = larga || 10;
    for (i = 0; i < Math.ceil(n * .6); i++) { var x = cx + (r() - .5) * larga, y = cy + (r() - .5) * larga * .4, l = 1 + r() * 1.6, an = (r() - .5) * .8; s += tratto("M" + q(x, y) + " l" + f1(Math.cos(an) * l) + "," + f1(Math.sin(an) * l) + " l" + f1(Math.cos(an + .7) * l * .45) + "," + f1(Math.sin(an + .7) * l * .45), scuro(c, .4), .22, op(.45)); }
    return s;
  }
  def("poltrona_circolo", { nome: "Vecchia poltrona di pelle", fp: [1, 1], box: [-48, -69, 48, 24], dietro: true, azione: "siedi", seduta: 26 }, function () {
    var PE = "#7a4529", pz = [];
    var s = ombraPianta(-.45, .45, -.45, .41, 1) + ombraSotto(-.4, .4, -.4, .36, .32);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (g) {   // i piedini a cipolla di noce scuro
      var a = .36 * g[0], b = g[1] < 0 ? -.37 : .33;
      pz.push({ box: [a - .04, a + .04, b - .04, b + .04, 0, 5], s: tornito(a, b, [[0, .026], [1.2, .04], [3.2, .045], [5.2, .036]], [[0, chiaro(NOCE_SC, .45)], [.4, NOCE_SC], [1, scuro(NOCE_SC, .5)]], .9) });
    });
    // il basamento: la fascia di pelle tutto attorno, sotto la seduta
    pz.push({ box: [-.43, .43, -.43, .41, 5, 15], s: estruso("a", tondo(-.43, .41, 5, 15.2, .03, 0, .02), -.43, .43, scuro(PE, .08), { mat: PELLE, ao: .35, aoH: 5, fascia: function (H) { return patina(limiti(H.sil), 201, 8); } }) });
    // lo schienale tondo, a ferro di cavallo
    var sch = pulisci([[-.43, 15], [.43, 15]].concat(arcoS(0, 35, .43, 15, 0, Math.PI, 22)));
    pz.push({ box: [-.43, .43, -.43, -.2, 15, 50], s: estruso("b", sch, -.43, -.2, PE, { mat: PELLE, ao: .25, aoH: 10, lw: 2.2,
      fascia: function (H) { var b = limiti(H.sil), t = H.p3([0, 49], G > 0 ? -.3 : -.33); return patina(b, 211, 14) + consumato(t[0], t[1] + 2, 12, 3.4, PE) + crepe(t[0] - 2, t[1] + 2, 6, 213, PE) + H.luccica(.35); },
      tappo: function (T) {
        if (G < 0) return T.su(tratto("M" + f1(T.x(0)) + "," + f1(T.y(49)) + " L" + f1(T.x(0)) + "," + f1(T.y(16)), scuro(PE, .4), .6, op(.6)) + patina([0, 0, T.W, T.H], 215, 10));   // dietro: liscio, con la cucitura
        var o = buio(T.W, 10, .38).replace("<rect ", "<rect transform='translate(0 " + f1(T.H - 10) + ")' ") + consumato(T.x(0), T.y(41), 14, 5, PE) + crepe(T.x(0), T.y(40), 7, 217, PE, 14);
        [-.2, 0, .2].forEach(function (a) { o += tratto("M" + f1(T.x(a)) + "," + f1(T.y(46)) + " Q" + f1(T.x(a) + 1.2) + "," + f1(T.y(31)) + " " + f1(T.x(a) - .4) + "," + f1(T.y(17)), scuro(PE, .4), .7, op(.5)); });   // le pieghe morbide
        return T.su(o);
      } }) + cordone(chiuso(rientra(sch.map(function (w) { return P(w[0], G > 0 ? -.2 : -.43, w[1]); }), 1.6)), PE, 1.2) });
    // i braccioli a rullo, larghi e bassi
    function bracciolo(x0, x1) {
      var pr = pulisci([[x0, 15], [x1, 15], [x1, 33]].concat(arcoS((x0 + x1) / 2, 33, (x1 - x0) / 2, 5.6, 0, Math.PI, 14), [[x0, 33]])), xm = (x0 + x1) / 2;
      return estruso("b", pr, -.3, .41, PE, { mat: PELLE, ao: .25, aoH: 9,
        fascia: function (H) { var b = limiti(H.sil), t = H.p3([xm, 38.6], G > 0 ? .3 : -.2); return patina(b, 221 + Math.round(x0 * 10), 7) + consumato(t[0], t[1], 7, 2.6, PE) + crepe(t[0], t[1], 4, 223 + Math.round(x0 * 10), PE, 7) + H.luccica(.45); },
        tappo: function (T) { return T.su(consumato(T.x(xm), T.y(35), 5, 3, PE) + crepe(T.x(xm), T.y(34), 4, 225, PE, 6)); }
      }) + cordone(chiuso(rientra(pr.map(function (w) { return P(w[0], G > 0 ? .41 : -.3, w[1]); }), 1.3)), PE, 1.1);
    }
    pz.push({ box: [-.43, -.271, -.3, .41, 15, 38.6], s: bracciolo(-.43, -.27) }, { box: [.271, .43, -.3, .41, 15, 38.6], s: bracciolo(.27, .43) });
    // il cuscino gonfio, consumato davanti
    pz.push({ box: [-.27, .27, -.2, .42, 15, 27.6], s: estruso("a", tondo(-.22, .42, 15, 26.4, .06, 1.2, .03), -.27, .27, PE, { mat: PELLE, ao: .3, aoH: 8, fascia: function (H) {
      var k = H.vicinoA(.42 - .02, 26.4 - 1.4), b = limiti(H.sil), m = H.p3([G > 0 ? .3 : -.1, 27], 0);
      return patina(b, 231, 10) + consumato(m[0], m[1], 10, 3.6, PE) + crepe(m[0], m[1], 6, 233, PE, 12) + cordone(aperto(H.lungo(k, -.255, .255)), PE, 1.1) + H.luccica(.3, .1, .9);
    } }) });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  IL TAVOLINO DEI GIORNALI: tondo, di noce, col ripiano di sotto; sopra la Gazzetta rosa piegata e un'altra aperta,
  //  il portacenere di vetro ambrato (pulito); sotto la pila dei giornali rosa dei giorni prima
  // =========================================================
  def("tavolino_giornali", { nome: "Tavolino coi giornali", fp: [1, 1], box: [-25, -50, 28, 16], dietro: true, piano: 34 }, function () {
    var ZT = 34, RT = .31, ZS = 10.6, RS = .24, s = ombraTonda(0, 0, .36, 1);
    var gambe = [0, 1, 2, 3].map(function (k) { var t = k * Math.PI / 2; return [Math.cos(t), Math.sin(t)]; });
    function gamba(v) {
      var T = [v[0] * .21, v[1] * .21, ZT - 2.4], F = [v[0] * .23, v[1] * .23, 0], o = gambaTonda(T, F, 2, 1.5, [[0, chiaro(NOCE, .45)], [.4, NOCE], [1, scuro(NOCE, .5)]]);
      [ZT - 8, 4].forEach(function (z) { var c = P(v[0] * .22, v[1] * .22, z); o += ell(c[0], c[1], 2.3, 1, lin("ag", [[0, chiaro(NOCE, .4)], [1, scuro(NOCE, .4)]], 0, 0, 1, 0), bordo(L, .4)); });
      return o;
    }
    function giornale(ca, cb, z, ang, w, h, seme, aperto) {   // un giornale rosa steso in pianta: la testata, i titoli, la foto, le colonne
      var c = Math.cos(ang), sn = Math.sin(ang);
      function pt(x, y) { return P(ca + c * x - sn * y, cb + sn * x + c * y, z); }
      var O = pt(-w / 2, -h / 2), X = pt(w / 2, -h / 2), Y = pt(-w / 2, h / 2), Zp = pt(w / 2, h / 2), W = w * 61, H = h * 61, rr = rnd(seme), k;
      var pag = rett(0, 0, W, H, 0, lin("rosa", [[0, "#fbd6db"], [1, "#efb7c0"]], 0, 0, 1, 1));
      pag += rett(1, .9, W - 2, 2.6, .3, "#e7909e") + rett(W * .22, 1.5, W * .56, 1.3, .6, "#3a2f31");   // la testata (da lontano)
      pag += rett(1, 4.4, W - 2, .9, .4, "#5a4a4d") + rett(1, 5.9, W * .7, .9, .4, "#5a4a4d");   // i titoloni
      pag += rett(1, 7.8, W * .42, H - 9.6, .2, "#8f8a85") + pth("M" + q(W * .18, H - 2.4) + " l1,-3.4 l1,3.4 Z", "#3a3633");   // la foto
      for (k = 0; k < Math.floor((H - 9) / 1.3); k++) { pag += rett(W * .46, 8 + k * 1.3, W * .5 - 1 - rr() * 2, .45, 0, "#9a8a8d"); }   // le colonne
      if (aperto) pag += rett(W / 2 - .2, 0, .4, H, 0, "#c98f98", op(.8));   // la piega in mezzo
      var o = poly([O, X, Zp, Y].map(function (p) { return [p[0], p[1] + .8]; }), "#c98f98") + piano(O, X, Y, W, H, pag) + poly([O, X, Zp, Y], "none", bordo(L, .5));
      return o + poly([O, X, lerp(X, Zp, .4), lerp(O, Y, .4)], "#ffffff", op(.1));
    }
    function portacenere(a, b, z) {   // il portacenere di vetro ambrato, pulito, con le tre tacche
      var o = tornito(a, b, [[z, .046], [z + .9, .053], [z + 2.4, .058]], [[0, "#ffe8b8"], [.4, "#e0a24a"], [1, "#8a5a1a"]], .7);
      o += bocca(a, b, z + 2.4, .058, lin("pc", [[0, "#f6c97a"], [1, "#b97a2a"]], 0, 0, 1, 1), bordo(L, .5)) + bocca(a, b, z + 1.3, .037, nuovaR([[0, "#fff0cc"], [1, "#d89a40"]], .4, .4, .7), "stroke='#8a5a1a' stroke-width='.3'");
      [Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6].forEach(function (an) { var t = P(a + Math.cos(an) * .056, b + Math.sin(an) * .056, z + 2.4); o += ell(t[0], t[1], 1, .5, "#8a5a1a"); });
      var h = P(a - .03, b - .01, z + 2.4); return o + ell(h[0], h[1], 1.4, .5, "#ffffff", op(.7));
    }
    var lont = gambe.filter(function (v) { return vicino(v[0], v[1]) < 0; }), vic = gambe.filter(function (v) { return vicino(v[0], v[1]) >= 0; });
    s += lont.map(gamba).join("");
    var Sf = forma(0, 0, RS);   // il ripiano di sotto, coi giornali vecchi
    s += corpo([giro(Sf, ZS - 1.6, 1, 48), giro(Sf, ZS, 1, 48)], [[0, chiaro(NOCE, .35)], [.5, NOCE], [1, scuro(NOCE, .45)]], 1.1) + pth(chiuso(giro(Sf, ZS, 1, 48)), nuova([[0, chiaro(NOCE, .25)], [1, NOCE]], 0, 0, 1, 1), bordo(L, .8));
    s += giornale(.01, .01, ZS + .2, .25, .28, .2, 81, false) + giornale(-.01, 0, ZS + .9, -.15, .28, .2, 82, false) + giornale(.02, -.01, ZS + 1.6, .05, .28, .2, 83, false);
    s += vic.map(gamba).join("");
    var Tf = forma(0, 0, RT);   // il piano
    s += corpo([giro(Tf, ZT - 2.6, .98, 60), giro(Tf, ZT - 2, 1, 60), giro(Tf, ZT, 1, 60)], [[0, chiaro(NOCE, .4)], [.4, NOCE], [1, scuro(NOCE, .5)]], 1.4);
    var top = giro(Tf, ZT, 1, 60);
    s += pth(chiuso(top), nuovaR([[0, chiaro(NOCE, .35)], [.7, NOCE], [1, scuro(NOCE, .15)]], .4, .35, .75), bordo(L, 1.1));
    s += dentro(chiuso(top), [0, 1, 2, 3, 4].map(function (k) { return pth(chiuso(giro(forma(.02, -.02, RT * (.25 + k * .17)), ZT, 1, 40)), "none", "stroke='" + scuro(NOCE, .25) + "' stroke-width='.35' opacity='.4'"); }).join("") + tratto(aperto(giro(Tf, ZT, .9, 60).slice(30, 46)), "#ffffff", .9, op(.5)));   // gli anelli del legno, il lucido
    s += giornale(-.05, -.04, ZT + .2, .35, .3, .21, 91, true) + giornale(-.08, .05, ZT + .8, -.3, .26, .18, 92, false) + portacenere(.16, .12, ZT);
    return s;
  });

  // =========================================================
  //  L'ATTACCAPANNI DI LEGNO CURVATO (alla Thonet): le quattro gambe curve che passano dall'anello porta ombrelli,
  //  l'asta tornita, i ganci grandi che salgono e quelli piccoli che scendono, il pomo in cima.
  //  Appesi: la giacca di tweed marrone col fazzoletto rosso nel taschino e il cappello grigio col nastro nero.
  //  Da dietro la giacca mostra la schiena con lo spacco.
  // =========================================================
  def("appendiabiti", { nome: "Attaccapanni", fp: [1, 1], box: [-22, -123, 23, 14], dietro: true }, function () {
    var s = ombraTonda(0, 0, .28, 1), LG = NOCE;
    function curvo(pp, w) { var d = curva(pp); return tratto(d, L, w + 1.8) + tratto(d, LG, w) + tratto(d, chiaro(LG, .45), w * .35, op(.75) + " transform='translate(-.3 -.4)'"); }   // il legno curvato a vapore
    var dirs = [0, 1, 2, 3].map(function (k) { var t = k * Math.PI / 2; return [Math.cos(t), Math.sin(t)]; });
    var diag = dirs.map(function (v) { return [(v[0] - v[1]) * .7071, (v[0] + v[1]) * .7071]; });
    function gamba(v) { return curvo([[.03, 62], [.07, 52], [.11, 41], [.135, 31], [.16, 20], [.205, 9], [.245, 2.4], [.272, 1.4], [.282, 3.4]].map(function (w) { return P(v[0] * w[0], v[1] * w[0], w[1]); }), 2); }
    function gancio(v, alto) {   // i ganci grandi salgono e si arricciano, quelli piccoli scendono
      var l = alto ? [[.02, 99], [.06, 101.5], [.105, 104.6], [.138, 108.6], [.136, 112], [.118, 113.2]] : [[.02, 93], [.06, 91.4], [.095, 88.8], [.11, 85.4], [.1, 83.4]];
      var e = l[l.length - 1], t = P(v[0] * e[0], v[1] * e[0], e[1]);
      return curvo(l.map(function (w) { return P(v[0] * w[0], v[1] * w[0], w[1]); }), alto ? 1.9 : 1.5) + cer(t[0], t[1], alto ? 1.5 : 1.2, nuovaR([[0, chiaro(LG, .5)], [1, scuro(LG, .3)]], .35, .3, .8), bordo(L, .45));
    }
    function giacca(hx, hy, davanti) {   // la giacca appesa per il passante del collo (le spalle cadono): davanti i revers, i bottoni, le tasche e il fazzoletto; dietro la schiena con lo spacco
      var TW = "#7d5c3e", w = 9.6, sp = 6.4, lu = 41, o = "", k;
      var corpoD = "M" + q(hx - 2.4, hy + .2) + " Q" + q(hx - 6, hy + 2.2) + " " + q(hx - w, hy + sp) + " Q" + q(hx - w - 1.4, hy + sp + 14) + " " + q(hx - w - .4, hy + lu) + " Q" + q(hx, hy + lu + 1.4) + " " + q(hx + w + .4, hy + lu) + " Q" + q(hx + w + 1.4, hy + sp + 14) + " " + q(hx + w, hy + sp) + " Q" + q(hx + 6, hy + 2.2) + " " + q(hx + 2.4, hy + .2) + " Z";
      var trama = ""; for (k = 0; k < 30; k++) trama += rett(hx - w - 3, hy + k * 1.5, 2 * w + 6, .35, 0, k % 2 ? "#000" : "#fff", op(.06));
      for (k = 0; k < 9; k++) trama += rett(hx - w + k * 2.4, hy, .3, lu + 2, 0, "#000", op(.05));   // il quadrettino del tweed
      var maniche = [-1, 1].map(function (sx) {   // le maniche che scendono dalle spalle, un po' davanti ai fianchi
        var x0 = hx + sx * w, d = "M" + q(x0 + sx * .4, hy + sp - .6) + " Q" + q(x0 + sx * 2.8, hy + sp + 8) + " " + q(x0 + sx * 2.2, hy + lu - 6) + " L" + q(x0 - sx * 2.6, hy + lu - 5.2) + " Q" + q(x0 - sx * 2.2, hy + sp + 12) + " " + q(x0 - sx * 2.6, hy + sp + 2.4) + " Z";
        return pth(d, nuova([[0, chiaro(TW, .14)], [1, scuro(TW, .28)]], x0 - 3, 0, x0 + 3, 0, true), bordo(L, .8)) + tratto("M" + q(x0 - sx * 2.4, hy + lu - 7.4) + " L" + q(x0 + sx * 2.2, hy + lu - 8.2), scuro(TW, .4), .5, op(.7)) + tratto("M" + q(x0 + sx * .6, hy + sp + 2) + " Q" + q(x0 + sx * 1.6, hy + sp + 12) + " " + q(x0 + sx * .9, hy + lu - 9), chiaro(TW, .3), .5, op(.5));
      }).join("");
      o += pth(corpoD, "#000", op(.18) + " transform='translate(1.2 1.4)'") + pth(corpoD, lin("gi", [[0, chiaro(TW, .18)], [.55, TW], [1, scuro(TW, .25)]], 0, 0, 1, 0), bordo(L, 1)) + dentro(corpoD, trama);
      if (davanti) {
        o += pth("M" + q(hx - 2.4, hy + .2) + " L" + q(hx - 4.8, hy + 3.6) + " L" + q(hx - 3, hy + 7.2) + " L" + q(hx - .5, hy + 18.6) + " L" + q(hx, hy + 6) + " Z", chiaro(TW, .1), bordo(L, .6)) + pth("M" + q(hx + 2.4, hy + .2) + " L" + q(hx + 4.8, hy + 3.6) + " L" + q(hx + 3, hy + 7.2) + " L" + q(hx + .5, hy + 18.6) + " L" + q(hx, hy + 6) + " Z", scuro(TW, .06), bordo(L, .6));   // i revers
        o += pth("M" + q(hx - 2, hy + .5) + " L" + q(hx, hy + 6) + " L" + q(hx + 2, hy + .5) + " Z", "#3a2a1c");   // il dentro, scuro
        o += tratto("M" + q(hx, hy + 18.6) + " Q" + q(hx + .4, hy + 31) + " " + q(hx - 2.4, hy + lu + .6), L, .7, op(.8));   // l'apertura davanti
        [22, 28].forEach(function (y) { o += cer(hx - .9, hy + y, .85, "#3a2a1c", bordo(L, .3)) + cer(hx - 1.1, hy + y - .2, .3, "#ffffff", op(.4)); });   // i bottoni
        [[-5.4, 30], [4.6, 30]].forEach(function (t) { o += rett(hx + t[0] - 2.6, hy + t[1], 5.4, 1.7, .4, scuro(TW, .12), bordo(L, .45)); });   // le tasche
        o += rett(hx + 3, hy + 11.2, 3.8, .9, .3, scuro(TW, .15), bordo(L, .35)) + pth("M" + q(hx + 3.5, hy + 11.3) + " L" + q(hx + 4.2, hy + 9) + " L" + q(hx + 5, hy + 10.4) + " L" + q(hx + 5.9, hy + 9.2) + " L" + q(hx + 6.4, hy + 11.3) + " Z", "#d63c3c", bordo("#7a1515", .3));   // il fazzoletto rosso nel taschino
      } else {
        o += pth("M" + q(hx - 3, hy + .2) + " Q" + q(hx, hy + 2.8) + " " + q(hx + 3, hy + .2) + " L" + q(hx + 2.6, hy - .6) + " Q" + q(hx, hy + 1.4) + " " + q(hx - 2.6, hy - .6) + " Z", scuro(TW, .1), bordo(L, .5));   // il colletto
        o += tratto("M" + q(hx, hy + 2.6) + " L" + q(hx, hy + lu - 7) + " L" + q(hx + .2, hy + lu + .6), scuro(TW, .45), .6, op(.85)) + pth("M" + q(hx - .8, hy + lu - 7) + " L" + q(hx + 1.2, hy + lu - 7) + " L" + q(hx + 1.4, hy + lu + .6) + " L" + q(hx - 1, hy + lu + .6) + " Z", scuro(TW, .2), op(.6));   // la cucitura e lo spacco
      }
      return o + maniche + tratto("M" + q(hx - 1, hy + .6) + " Q" + q(hx, hy - 1.6) + " " + q(hx + 1, hy + .6), "#3a2a1c", .6);   // il passante sul gancio
    }
    function cappello(cx, cy) {   // il borsalino grigio col nastro nero, un po' storto sul gancio
      var GR = "#6f747a", o = ell(cx + .8, cy + 5.4, 8.6, 2.2, "#000", op(.2));
      o += ell(cx, cy + 4.6, 9, 2.4, lin("te", [[0, chiaro(GR, .25)], [1, scuro(GR, .3)]], 0, 0, 1, 0), bordo(L, .7)) + ell(cx, cy + 4.1, 6.2, 1.3, scuro(GR, .35));   // la tesa
      o += pth("M" + q(cx - 5.6, cy + 4.2) + " L" + q(cx - 4.8, cy - 3.4) + " Q" + q(cx - 2.6, cy - 6.2) + " " + q(cx, cy - 4.6) + " Q" + q(cx + 2.6, cy - 6.2) + " " + q(cx + 4.8, cy - 3.4) + " L" + q(cx + 5.6, cy + 4.2) + " Z", lin("cu", [[0, chiaro(GR, .3)], [.5, GR], [1, scuro(GR, .3)]], 0, 0, 1, 0), bordo(L, .8));   // la cupola con la piega
      o += tratto("M" + q(cx, cy - 4.4) + " Q" + q(cx - .4, cy - 1.8) + " " + q(cx, cy), scuro(GR, .45), .6, op(.8));
      o += pth("M" + q(cx - 5.5, cy + 3.8) + " L" + q(cx - 5.2, cy + 1.4) + " L" + q(cx + 5.2, cy + 1.4) + " L" + q(cx + 5.5, cy + 3.8) + " Z", "#1d1d1f") + pth("M" + q(cx + 2.6, cy + 1.6) + " l1.6,-.8 l.2,2.6 Z", "#2b2b2b");   // il nastro e il fiocco
      return ruota(cx, cy - 4, -12, o + ell(cx - 3, cy - 2.4, .8, 2, "#ffffff", op(.3)));
    }
    var lontG = dirs.filter(function (v) { return vicino(v[0], v[1]) < -.01; }), vicG = dirs.filter(function (v) { return vicino(v[0], v[1]) >= -.01; });
    var ganciL = [], ganciV = [];
    dirs.forEach(function (v) { (vicino(v[0], v[1]) < -.01 ? ganciL : ganciV).push(gancio(v, true)); });
    diag.forEach(function (v) { (vicino(v[0], v[1]) < -.01 ? ganciL : ganciV).push(gancio(v, false)); });
    var hj = P(0, .128, 106.2), hh = P(.128, 0, 106.4), giaccaL = vicino(0, 1) < 0, capL = vicino(1, 0) < 0;
    var gi = giacca(hj[0], hj[1], !giaccaL), ca = cappello(hh[0] + .4 * G, hh[1] + 4.6);
    s += lontG.map(gamba).join("") + anello(0, 0, 31, .135, 1.6, false, false).replace(/#a7b2ba/g, LG).replace(/#ffffff/g, chiaro(LG, .45));
    s += ganciL.join("") + (giaccaL ? gi : "") + (capL ? ca : "");
    s += tornito(0, 0, [[0, .03], [1.6, .034], [3, .026], [56, .021], [58, .03], [60, .021], [96, .019], [98, .027], [100, .019], [114, .019], [115.5, .027], [117.6, .025], [119, .012]], [[0, chiaro(LG, .45)], [.4, LG], [1, scuro(LG, .5)]], 1, [1, 4, 7, 10], .8);   // l'asta tornita col pomo
    s += anello(0, 0, 31, .135, 1.6, true, false).replace(/#a7b2ba/g, LG).replace(/#ffffff/g, chiaro(LG, .45));
    s += vicG.map(gamba).join("") + ganciV.join("") + (giaccaL ? "" : gi) + (capL ? "" : ca);
    return s;
  });

  // =========================================================
  function misure(d) { if (d.tipo === "parete") { var n = d.fp ? d.fp[0] : 1; return { w: 62 * n, h: 200 }; } var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), tipo = d.tipo || "piedi", o = { tipo: tipo, nome: d.nome, stanza: "circolo", reparto: "circolo", w: m.w, h: m.h, fp: (d.fp || [1, 1]).slice(), prezzo: 0, qual: 2 };
      if (tipo !== "parete") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.piano) o.piano = d.piano;
      if (d.posti) o.posti = d.posti.map(function (x) { return x.slice(); });
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      if (d.luce) {
        if (tipo === "parete") o.luce = d.luce.slice();
        else { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      }
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "cbar" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!(opz.notte && d.luce);
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      var corpoSvg = d.tipo === "parete" ? c : "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g>";
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + corpoSvg + "</svg>";
    }
  });
})();

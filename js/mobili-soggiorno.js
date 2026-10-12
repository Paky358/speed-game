/* =========================================================
   SPeeD GAME — I MOBILI DEL SOGGIORNO, LA ROBA BELLA, VISTI DALL'ALTO
   Come il bagno (js/mobili-arte.js): una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Gli stessi mobili della casa vista di lato (js/casa.js), con gli stessi nomi, prezzi e colori:
   divano di velluto, divano Chesterfield, poltrona imbottita, poltrona relax, tavolino di legno, tavolino di vetro,
   mobile basso per la TV, TV a schermo piatto, libreria, lampada a stelo, tappeto persiano.
   Il davanti guarda in basso a sinistra; con { dietro: true } lo stesso mobile girato (si vede la schiena).
   I pezzi imbottiti sono "sezioni tirate" lungo un asse: ogni punto della sezione prende la sua luce
   (sopra chiaro, davanti medio, il fianco di destra scuro; il velluto brilla dove gira, la pelle ha il lucido).
   Si aggiungono a SGMobiliArte con aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";

  // ---------- attrezzi (gli stessi del bagno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato (da dietro)
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(k) { return "opacity='" + k + "'"; }
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
  function sposta(a, dx, dy) { return a.map(function (x) { return [x[0] + dx, x[1] + dy]; }); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function rientra(a, d) {   // la stessa forma, più stretta di d tutto attorno (per i cordoncini dentro il bordo)
    var cx = 0, cy = 0; a.forEach(function (x) { cx += x[0]; cy += x[1]; }); cx /= a.length; cy /= a.length;
    return a.map(function (x) { var dx = x[0] - cx, dy = x[1] - cy, l = Math.sqrt(dx * dx + dy * dy) || 1; return [x[0] - dx / l * d, x[1] - dy / l * d]; });
  }
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
  function cromo(d, w) { return tratto(d, L, w + 2.4) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.7, w * .38), "opacity='.95' transform='translate(-.4 -.5)'"); }

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda
  // le forme tonde in pianta (come nel bagno): centro (ca, cb), mezza larghezza ra, mezza profondità rf davanti e rr dietro; e = 2 ovale, di più = più squadrata
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf, rr: rr == null ? rf : rr, e: e || 2 }; }
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

  // ---------- i mobili squadrati (come nel bagno) ----------
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
  function piano(O, X, Y, W, H, c) {   // un disegno piatto W × H steso su un piano qualsiasi: O = il suo angolo in alto a sinistra, X = la fine della riga di sopra, Y = la fine del lato di sinistra
    var m = [(X[0] - O[0]) / W, (X[1] - O[1]) / W, (Y[0] - O[0]) / H, (Y[1] - O[1]) / H, O[0], O[1]];
    return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>";
  }

  // ---------- la luce: viene da in alto a sinistra ----------
  function norma(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  var LUCE = norma([-.3, .5, .8]), VISTA = norma([1, 1, .82]), MEZZO = norma([LUCE[0] + VISTA[0], LUCE[1] + VISTA[1], LUCE[2] + VISTA[2]]);
  // il colore di una superficie con la normale n (nella vista: u, v, z) fatta del materiale m
  function tinta(c, n, m) {
    m = m || {};
    var B = dot(n, LUCE), t = B >= .5 ? (B - .5) / .3 * .2 : (B - .5) / .8 * .27;
    if (m.velluto) { var g = 1 - Math.max(0, dot(n, VISTA)); t = t * .8 + g * g * m.velluto - .07; }   // il velluto: chiaro dove la stoffa gira, cupo e pieno dove ti guarda
    var col = tono(c, t * (m.forza || 1));
    if (m.lucido) { var sp = Math.pow(Math.max(0, dot(n, MEZZO)), m.esp || 24) * m.lucido; if (sp > .01) col = mix(col, m.riflesso ? chiaro(c, m.riflesso) : "#fff8ec", Math.min(.85, sp)); }   // il lucido (pelle, legno laccato; il velluto ha un riflesso morbido del suo colore)
    return col;
  }
  var VELLUTO = { velluto: .5, lucido: .55, esp: 7, riflesso: .55 }, PELLE = { lucido: .5, esp: 14 }, STOFFA = {};
  // un disegno piatto su un piano dritto: asse "a" = il piano a b fisso (largo lungo a), asse "b" = il piano ad a fisso (largo lungo b); y piatta = z1 - z
  function pianoV(asse, fisso, t0, t1, z0, z1, cont) {
    var W = Math.abs(t1 - t0) * 61, H = z1 - z0, lo = Math.min(t0, t1), hi = Math.max(t0, t1), s, e;
    if (asse === "a") { s = G > 0 ? lo : hi; e = G > 0 ? hi : lo; return piano(P(s, fisso, z1), P(e, fisso, z1), P(s, fisso, z0), W, H, cont); }
    s = G > 0 ? hi : lo; e = G > 0 ? lo : hi; return piano(P(fisso, s, z1), P(fisso, e, z1), P(fisso, s, z0), W, H, cont);
  }
  function buio(W, H, k, su) {   // l'ombra morbida in un angolo (dove la seduta tocca lo schienale): un rettangolo che sfuma (su = scuro in alto)
    return rett(0, 0, W, H, 0, nuova(su ? [[0, "#000", k], [1, "#000", 0]] : [[0, "#000", 0], [1, "#000", k]], 0, 0, 0, 1));
  }

  // ---------- i pezzi imbottiti: una sezione tirata lungo un asse ----------
  // asse "a": la sezione è fatta di punti [b, z] e va da a = t0 ad a = t1; asse "b": punti [a, z], da b = t0 a b = t1.
  // o = { mat, fascia(H) = disegni sulla parte tirata, tappo(T) = disegni sul tappo che si vede (piatto), tappoCol, lw }
  function arcoS(cx, cz, rx, rz, a0, a1, n) { var o = [], i; for (i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(t), cz + rz * Math.sin(t)]); } return o; }
  function pulisci(a) { return a.filter(function (x, i) { var y = a[(i + a.length - 1) % a.length]; return Math.abs(x[0] - y[0]) > 1e-4 || Math.abs(x[1] - y[1]) > 1e-3; }); }
  // la sezione di un cuscino: da x0 a x1 (mattonelle) e da z0 a z1 (unità); r = il raggio degli spigoli di sopra (mattonelle); pancia = quanto si gonfia sopra (unità)
  function tondo(x0, x1, z0, z1, r, pancia, rb) {
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
    function tv2(nrm, z) {   // la tinta, e più buio in basso (dove il pezzo tocca la base o il pavimento)
      var col = tinta(c, nrm, m), f = o.ao ? Math.max(0, 1 - (z - zb) / (o.aoH || 8)) : 0;
      return f > 0 ? mix(col, "#000000", o.ao * f * f) : col;
    }
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
      if (va && vb && dot(ea, eb) < .8) {   // uno spigolo vivo: due colori nello stesso punto
        var prima = sp(capV[(i + n - 1) % n]) < s;
        voci.push({ s: s, c: [tv2(prima ? ea : eb, zz), tv2(prima ? eb : ea, zz)] });
      } else voci.push({ s: s, c: [tv2(va && vb ? norma([ea[0] + eb[0], ea[1] + eb[1], ea[2] + eb[2]]) : (va ? ea : eb), zz)] });
    }
    voci.sort(function (x, y) { return x.s - y.s; }); vis.sort(function (x, y) { return x.s - y.s; });
    var smin = 1e9, smax = -1e9; sil.forEach(function (w) { var v = sp(w); if (v < smin) smin = v; if (v > smax) smax = v; });
    var st = []; voci.forEach(function (v) { v.c.forEach(function (cc) { st.push([f2(Math.max(0, Math.min(1, (v.s - smin) / (smax - smin || 1)))), cc]); }); });
    if (!st.length) st = [[0, c], [1, c]];
    var r = pth(dSil, nuova(st, nn[0] * smin, nn[1] * smin, nn[0] * smax, nn[1] * smax, true));
    var xs = prof.map(function (x) { return x[0]; }), zs = prof.map(function (x) { return x[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
    var H = {   // gli aiuti per decorare: p3, la catena dei punti che si vedono, il tappo piatto
      p3: p3, tv: tv, tn: tn, prof: prof, sil: sil, capV: capV, kLuce: kLuce,
      luccica: function (k, a, b) {   // la riga di luce lucida lungo il pezzo, dove la luce batte di più (pelle, legno laccato)
        var pp = this.lungo(kLuce, t0 + (t1 - t0) * (a || .06), t0 + (t1 - t0) * (b || .94));
        return tratto(aperto(pp), "#ffffff", 1.3, op(k || .5)) + tratto(aperto(pp), "#ffffff", 3.2, op((k || .5) * .25));
      },
      vis: vis.map(function (v) { return v.k; }),
      sez: function (t, filtro) { return vis.filter(function (v) { return !filtro || filtro(prof[v.k]); }).map(function (v) { return p3(prof[v.k], t); }); },
      lungo: function (k, ta, tb) { return [p3(prof[k], ta == null ? t0 : ta), p3(prof[k], tb == null ? t1 : tb)]; },
      vicinoA: function (x, z) { var bi = 0, bd = 1e9; prof.forEach(function (w, j) { var d = Math.abs(w[0] - x) + Math.abs(w[1] - z) / 61; if (d < bd) { bd = d; bi = j; } }); return bi; }
    };
    if (o.fascia) r += dentro(dSil, o.fascia(H));
    // il tappo che si vede: piatto, un po' più chiaro in alto
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
  // un cordoncino (la bordatura dei cuscini): scuro sotto, il filo di luce sopra
  function solco(H, x, z, t0, t1) {   // l'ombra morbida in fondo alla seduta, dove tocca lo schienale (solo da davanti)
    if (G < 0) return "";
    var pp = aperto(H.lungo(H.vicinoA(x, z), t0, t1));
    return tratto(pp, "#000000", 8, op(.09)) + tratto(pp, "#000000", 3.5, op(.12));
  }
  function cordone(d, c, w) { w = w || 1.5; return tratto(d, scuro(c, .42), w + .5, op(.85)) + tratto(d, chiaro(c, .32), w * .45, "opacity='.75' transform='translate(-.3 -.45)'"); }

  // ---------- le gambe ----------
  // una gamba tonda e affusolata da T (in alto) a F (il piede), punti [a, b, z]; w0 e w1 = mezze larghezze sullo schermo
  function gambaTonda(T, F, w0, w1, stops, puntale) {
    var t = P(T[0], T[1], T[2]), f = P(F[0], F[1], F[2]), dx = f[0] - t[0], dy = f[1] - t[1], l = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / l, ny = dx / l;
    if (nx > 0) { nx = -nx; ny = -ny; }   // (nx, ny) = verso sinistra
    var a = [t[0] + nx * w0, t[1] + ny * w0], b = [t[0] - nx * w0, t[1] - ny * w0], c = [f[0] - nx * w1, f[1] - ny * w1], d = [f[0] + nx * w1, f[1] + ny * w1];
    var s = poly([a, b, c, d], nuova(stops, a[0], a[1], b[0], b[1], true), bordo(L, 1.1));
    if (puntale) {   // il puntale in fondo, d'ottone
      var k = .3, pa = [a[0] + (d[0] - a[0]) * (1 - k), a[1] + (d[1] - a[1]) * (1 - k)], pb = [b[0] + (c[0] - b[0]) * (1 - k), b[1] + (c[1] - b[1]) * (1 - k)];
      s += poly([pa, pb, c, d], nuova(puntale, pa[0], pa[1], pb[0], pb[1], true), bordo(L, 1));
    }
    return s + tratto(linea([t[0] + nx * w0 * .4, t[1] + ny * w0 * .4], [f[0] + nx * w1 * .4, f[1] + ny * w1 * .4]), "#ffffff", .7, op(.55)) + ell(f[0], f[1], w1, w1 * .5, scuro(stops[stops.length - 1][1], .2), bordo(L, .8));
  }
  // una gamba squadrata e affusolata, centrata in (a, b): r0 = mezzo lato in alto, r1 in basso
  function zampa(a, b, r0, r1, z0, z1, c) {
    var col = tinte(c), u = G * a, v = G * b;
    var T = [Puv(u - r0, v + r0, z1), Puv(u + r0, v + r0, z1), Puv(u + r0, v - r0, z1)], B = [Puv(u - r1, v + r1, z0), Puv(u + r1, v + r1, z0), Puv(u + r1, v - r1, z0)];
    return poly([T[0], T[1], B[1], B[0]], col[1]) + poly([T[1], T[2], B[2], B[1]], col[2]) + tratto(linea(T[1], B[1]), L, .8, op(.6)) +
      tratto(linea([T[0][0] + 1, T[0][1] + 1], [B[0][0] + .8, B[0][1] - .5]), "#ffffff", .7, op(.45)) + poly([T[0], T[1], T[2], B[2], B[1], B[0]], "none", bordo(L, 1.3));
  }
  function angoli(ra, rb) {   // i quattro angoli di una pianta, dal più lontano al più vicino
    return [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(function (g) { return [ra * g[0], rb * g[1]]; }).sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
  }

  // ---------- le ombre a terra (stese sul pavimento, un po' spostate a destra: la luce viene da sinistra) ----------
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

  // ---------- i pezzi di un mobile, dal più lontano al più vicino ----------
  // ognuno ha box = [a0, a1, b0, b1, z0, z1] (in pianta) e s = il disegno
  function inOrdine(l) {
    var n = l.length, fatto = [], out = "", k, i, j;
    function sov(x0, x1, y0, y1) { return x0 < y1 - 1e-6 && y0 < x1 - 1e-6; }
    function prima(A, B) {   // A va disegnato prima di B?
      var a = A.box, b = B.box, sa = sov(a[0], a[1], b[0], b[1]), sb = sov(a[2], a[3], b[2], b[3]);
      if (sa && sb) return a[4] < b[4] - 1e-6 || (Math.abs(a[4] - b[4]) < 1e-6 && (A.ord || 0) < (B.ord || 0));   // uno sopra l'altro: prima quello sotto
      if (sb && !sa) return G * (a[0] + a[1]) < G * (b[0] + b[1]);   // uno accanto all'altro
      if (sa && !sb) return G * (a[2] + a[3]) < G * (b[2] + b[3]);   // uno davanti all'altro
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

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  function scelto(lista, o) { var id = o && o.col, i; for (i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i]; return lista[0]; }

  // =========================================================
  //  DIVANO DI VELLUTO: lo schienale a quattro canali coi bottoni, i braccioli tondi, due cuscini gonfi,
  //  i cuscinetti col colore che stacca (con le nappine) e i piedini d'ottone
  // =========================================================
  var COL_VELLUTO = [{ id: "acqua", nome: "verde acqua", c: "#1f8a8a", k: "#f2c14e" }, { id: "rosa", nome: "rosa", c: "#e8789a", k: "#fff3bf" }, { id: "blu", nome: "blu notte", c: "#364fc7", k: "#ffd43b" },
    { id: "senape", nome: "senape", c: "#d9a21b", k: "#1f8a8a" }, { id: "grigio", nome: "grigio", c: "#7d858d", k: "#ff8787" }, { id: "viola", nome: "viola", c: "#7048e8", k: "#c3fae8" }];
  def("divano_velluto", { tipo: "piedi", nome: "Divano di velluto", fp: [2, 1], box: [-81, -85, 87, 44], dietro: true, seduta: 28, prezzo: 1800, colori: COL_VELLUTO }, function (o) {
    var K = scelto(COL_VELLUTO, o), c = K.c, pz = [];
    var s = ombraPianta(-.97, .97, -.46, .43, 1) + ombraSotto(-.9, .9, -.4, .36, .32);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (g) {   // i piedini d'ottone, affusolati e un po' aperti
      var a = .86 * g[0], b = g[1] < 0 ? -.37 : .32;
      pz.push({ box: [a - .03, a + .03, b - .03, b + .03, 0, 9], s: gambaTonda([a, b, 9.5], [a + .05 * g[0], b + .04 * g[1], 0], 2.4, 1.3, OTTONE) });
    });
    pz.push({ box: [-.95, .95, -.45, .39, 9, 13.5], s: estruso("a", tondo(-.45, .39, 9, 13.5, .02, 0, .015), -.95, .95, scuro(c, .3), { mat: VELLUTO, lw: 2 }) });   // il telaio, in ombra
    // lo schienale: il davanti un po' all'indietro, il bordo tondo sopra; quattro canali capitonné
    var sch = pulisci([[-.457, 13.5], [-.222, 13.5], [-.262, 45.5]].concat(arcoS(-.36, 46.2, .098, 7.8, 0, Math.PI, 16), [[-.458, 45.5]]));
    function zDav(z) { return -.222 - .04 * (z - 13.5) / 32; }   // la faccia davanti dello schienale, a quell'altezza
    var schienale = estruso("a", sch, -.77, .77, c, { mat: VELLUTO, ao: .2, aoH: 10, fascia: function (H) {
      var r = "", i, dav = function (w) { return w[0] > -.375; };
      if (G > 0) {
        // i quattro canali gonfi sul davanti (chiari a sinistra, scuri a destra), l'ombra dove tocca la seduta
        var fd = "";
        for (i = 0; i < 4; i++) fd += rett(i * 23.5, 0, 23.5, 32, 0, nuova([[0, "#000", .1], [.18, "#fff", .05], [.38, "#fff", .2], [.62, "#fff", 0], [.88, "#000", .16], [1, "#000", .3]], 0, 0, 1, 0));
        r += piano(P(-.77, zDav(45.5), 45.5), P(.77, zDav(45.5), 45.5), P(-.77, zDav(13.5), 13.5), 94, 32, fd + rett(0, 12, 94, 7, 0, nuova([[0, "#000", 0], [1, "#000", .35]], 0, 0, 0, 1)));
        for (i = 1; i < 4; i++) { var t = -.77 + i * .385, pp = H.sez(t, dav); if (pp.length > 1) r += tratto(aperto(pp), scuro(c, .6), 1, op(.85)) + tratto(aperto(H.sez(t + .012, dav)), chiaro(c, .45), .55, op(.5)); }
      } else {
        // da dietro: la schiena liscia, con la luce che scorre sul velluto e il cordoncino sotto il bordo tondo
        var kk = H.vicinoA(-.458, 45.5);
        r += cordone(aperto(H.lungo(kk, -.76, .76)), c, 1.3) + cordone(aperto(H.lungo(H.vicinoA(-.457, 13.5), -.76, .76)), c, 1.1);
        r += pianoV("a", -.458, -.77, .77, 13.5, 45.5, rett(4, 0, 40, 32, 0, nuova([[0, "#fff", 0], [.5, "#fff", .08], [1, "#fff", 0]], 0, 0, 1, 0)) + rett(0, 20, 94, 12, 0, nuova([[0, "#000", 0], [1, "#000", .18]], 0, 0, 0, 1)));
      }
      return r;
    } });
    if (G > 0) for (var i = 0; i < 4; i++) {   // i bottoni ricoperti, ognuno nella sua fossetta
      var bt = P(-.77 + (i + .5) * .385, zDav(37), 37);
      schienale += ell(bt[0], bt[1] + .3, 5.5, 4.2, nuovaR([[0, "#000", .35], [1, "#000", 0]], .5, .5, .5)) + tratto("M" + q(bt[0], bt[1] - 4.2) + " L" + q(bt[0], bt[1] + 4.6), scuro(c, .5), .6, op(.55)) +
        cer(bt[0], bt[1], 1.7, nuovaR([[0, chiaro(c, .5)], [.55, c], [1, scuro(c, .45)]], .35, .3, .8), bordo(scuro(c, .6), .5));
    }
    pz.push({ box: [-.77, .77, -.46, -.222, 13.5, 54], s: schienale });
    // i braccioli: tondi sopra, col cordoncino attorno al davanti; dentro, l'ombra dove tocca la seduta
    function bracciolo(x0, x1) {
      var pr = pulisci([[x0, 13.5], [x1, 13.5], [x1, 29]].concat(arcoS((x0 + x1) / 2, 29, (x1 - x0) / 2, 7.4, 0, Math.PI, 16), [[x0, 29]])), dentroX = x0 < 0 ? x1 : x0;
      return estruso("b", pr, -.46, .42, c, { mat: VELLUTO, ao: .22, aoH: 9, fascia: function () {
        return (x0 < 0) === (G > 0) ? pianoV("b", dentroX, -.23, .42, 27, 34, buio(40, 7, .32)) : "";   // il fianco di dentro, in ombra vicino alla seduta
      } }) + (function () {
        var cap = pr.map(function (w) { return P(w[0], G > 0 ? .42 : -.46, w[1]); });
        return cordone(chiuso(rientra(cap, 1.8)), c, 1.3);
      })();
    }
    pz.push({ box: [-.97, -.77, -.46, .42, 13.5, 37], s: bracciolo(-.97, -.77) }, { box: [.77, .97, -.46, .42, 13.5, 37], s: bracciolo(.77, .97) });
    // i due cuscini della seduta, gonfi, col cordoncino davanti e il pelo che luccica
    var cu = tondo(-.255, .43, 13.5, 28, .06, 1.6, .03);
    [[-.766, -.004], [.004, .766]].forEach(function (x, j) {
      pz.push({ box: [x[0], x[1], -.215, .43, 13.5, 29.5], s: estruso("a", cu, x[0], x[1], c, { mat: VELLUTO, ao: .28, aoH: 9, fascia: function (H) {
        var k = H.vicinoA(.43 - .02, 28 - 1.6), r = cordone(aperto(H.lungo(k, x[0] + .02, x[1] - .02)), c, 1.3);
        r = solco(H, -.2, 28, x[0], x[1]) + r;
        if (G < 0) return r;
        var m = P((x[0] + x[1]) / 2 + (j ? .05 : -.05), .06, 29.5);   // il pelo schiacciato che luccica
        var sw = P((x[0] + x[1]) / 2 + (j ? -.16 : .14), .18, 29.5);   // la carezza contropelo: una striscia più cupa, come una mano passata sul velluto
        return r + "<g transform='translate(" + q(m[0], m[1]).replace(",", " ") + ") rotate(26.6)'>" + ell(0, 0, 19, 6, nuovaR([[0, "#fff", .26], [1, "#fff", 0]], .5, .5, .5)) + "</g>" +
          "<g transform='translate(" + q(sw[0], sw[1]).replace(",", " ") + ") rotate(" + (j ? 18 : 34) + ")'>" + ell(0, 0, 13, 3, nuovaR([[0, scuro(c, .3), .26], [1, scuro(c, .3), 0]], .5, .5, .5)) + ell(-.6, -1.8, 11, 1.6, nuovaR([[0, "#fff", .24], [1, "#fff", 0]], .5, .5, .5)) + "</g>" +
          H.luccica(.22, .05, .95);
      } }) });
    });
    // i cuscinetti appoggiati allo schienale: gonfi, col colore che stacca e le nappine agli angoli
    function cuscinetto(a0, a1, ruota) {
      var aL = G > 0 ? a0 : a1, aR = G > 0 ? a1 : a0, W = 27, Hh = 28, k = K.k;
      var O = P(aL, -.25, 50.5), X = P(aR, -.25, 50.5), Y = P(aL, -.155, 28.4);
      var f = "M1.5,1.5 Q" + W / 2 + ",4.6 " + (W - 1.5) + ",1.5 Q" + (W - 4.6) + "," + Hh / 2 + " " + (W - 1.5) + "," + (Hh - 1.5) + " Q" + W / 2 + "," + (Hh - 4.6) + " 1.5," + (Hh - 1.5) + " Q4.6," + Hh / 2 + " 1.5,1.5 Z";
      var gir = "rotate(" + ruota + " " + W / 2 + " " + Hh / 2 + ")", d = P(0, -.075, -1.4), d0 = P(0, 0, 0), dx = d[0] - d0[0], dy = d[1] - d0[1];
      var faccia1 = pth(f, nuovaR([[0, chiaro(k, .5)], [.5, k], [1, scuro(k, .3)]], .38, .34, .75), bordo(L, 1.3)) +
        pth("M6,6 Q" + W / 2 + "," + (Hh / 2 - 1.5) + " " + (W - 6) + "," + (Hh - 6) + " M" + (W - 6) + ",6 Q" + W / 2 + "," + (Hh / 2 + 1.5) + " 6," + (Hh - 6), "none", "stroke='" + scuro(k, .35) + "' stroke-width='.7' opacity='.4'") +
        pth(f, "none", "stroke='" + chiaro(k, .55) + "' stroke-width='.7' opacity='.75' transform='translate(1.35 1.4) scale(.9)'") + ell(W * .36, Hh * .3, 4, 2.6, "#fff", op(.3)) + cer(W / 2, Hh / 2, 1.2, scuro(k, .35));
      var nappe = [[1.5, 1.5], [W - 1.5, 1.5], [W - 1.5, Hh - 1.5], [1.5, Hh - 1.5]].map(function (v) {
        return pth("M" + (v[0] - 1.3) + "," + (v[1] + 1.2) + " L" + (v[0] - 2.2) + "," + (v[1] + 7.6) + " Q" + v[0] + "," + (v[1] + 8.8) + " " + (v[0] + 2.2) + "," + (v[1] + 7.6) + " L" + (v[0] + 1.3) + "," + (v[1] + 1.2) + " Z", nuova([[0, chiaro(c, .35)], [1, scuro(c, .2)]], 0, 0, 1, 0), bordo(L, .7)) +
          tratto("M" + (v[0] - .8) + "," + (v[1] + 2.4) + " L" + (v[0] - 1.1) + "," + (v[1] + 7.4) + " M" + (v[0] + .7) + "," + (v[1] + 2.4) + " L" + (v[0] + 1) + "," + (v[1] + 7.4), scuro(c, .4), .4) +
          cer(v[0], v[1] + .8, 1.5, nuovaR([[0, chiaro(c, .45)], [1, scuro(c, .25)]], .35, .3, .8), bordo(L, .6));
      }).join("");
      function copia(t, col) { var e = P(0, -.075 * t, -1.4 * t); return "<g transform='translate(" + f1(e[0] - d0[0]) + " " + f1(e[1] - d0[1]) + ")'>" + piano(O, X, Y, W, Hh, "<g transform='" + gir + "'>" + pth(f, col, bordo(L, 1.3)) + "</g>") + "</g>"; }
      return copia(1, scuro(k, .42)) + copia(.5, scuro(k, .2)) + piano(O, X, Y, W, Hh, "<g transform='" + gir + "'>" + faccia1 + nappe + "</g>");
    }
    pz.push({ box: [-.76, -.34, -.21, -.165, 28, 53], s: cuscinetto(-.76, -.34, -4) }, { box: [.34, .76, -.21, -.165, 28, 53], s: cuscinetto(.34, .76, 5) });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  DIVANO CHESTERFIELD: la pelle col capitonné a rombi e i bottoni, i braccioli a rotolo col ventaglio di pieghe,
  //  i chiodini d'ottone tutto attorno, i piedini torniti di legno scuro
  // =========================================================
  var COL_PELLE = [{ id: "cuoio", nome: "cuoio", c: "#7a3e1d" }, { id: "nero", nome: "nero", c: "#2b2b30" }, { id: "bordeaux", nome: "bordeaux", c: "#862e3e" }, { id: "verde", nome: "verde inglese", c: "#1e5c3a" }, { id: "panna", nome: "panna", c: "#d9c9a6" }];
  function piedeTornito(a, b, legno) {   // il piedino tornito a cipolla, col collarino d'ottone
    var F = forma(a, b, .05, .05, .05, 2), lv = [giro(F, 0, .5, 24), giro(F, 1.4, .82, 24), giro(F, 3.3, 1, 24), giro(F, 5.2, .78, 24)];
    return corpo(lv, [[0, chiaro(legno, .4)], [.4, legno], [1, scuro(legno, .45)]], 1.2) + corpo([giro(F, 5, .8, 24), giro(F, 7, .8, 24)], OTTONE, 1.1);
  }
  // il capitonné a rombi (piatto, W × H, sopra la sfumatura del pezzo): i bottoni in file sfalsate, le pieghe che li uniscono, i rombi gonfi e lucidi
  function capitonne(W, H, ys, n, c) {
    var dx = W / n, s = "", rows = [], i, k;
    ys.forEach(function (y, k2) { var row = [], m = k2 % 2 ? n - 1 : n; for (i = 0; i < m; i++) row.push([(k2 % 2 ? dx : dx / 2) + i * dx, y]); rows.push(row); });
    var gp = nuovaR([[0, "#fff", .38], [.4, "#fff", .1], [.75, "#000", .04], [1, "#000", .26]], .4, .34, .66);
    for (k = 0; k < ys.length; k++) {   // i rombi gonfi
      var y = ys[k], su = k ? y - ys[k - 1] : y, giu = k < ys.length - 1 ? ys[k + 1] - y : H - y, off = k % 2 ? dx : dx / 2;
      for (i = -1; i < rows[k].length; i++) {
        var x = off + i * dx + dx / 2, t = [x, y - su], d = [x + dx / 2, y], b = [x, y + giu], l = [x - dx / 2, y];
        s += pth("M" + q(t) + " Q" + q(x + dx * .34, y - su * .38) + " " + q(d) + " Q" + q(x + dx * .3, y + giu * .4) + " " + q(b) + " Q" + q(x - dx * .3, y + giu * .4) + " " + q(l) + " Q" + q(x - dx * .34, y - su * .38) + " " + q(t) + " Z", gp);
      }
    }
    function piega(a, b) { return tratto(linea(a, b), scuro(c, .6), .8, op(.85)) + tratto(linea([a[0] + .25, a[1] + .55], [b[0] + .25, b[1] + .55]), chiaro(c, .38), .45, op(.6)); }
    for (k = 0; k < ys.length; k++) rows[k].forEach(function (bt) {   // le pieghe: dai bottoni ai vicini sopra e sotto
      var su = k ? ys[k - 1] : 0, giu = k < ys.length - 1 ? ys[k + 1] : H;
      if (!k) { s += piega(bt, [bt[0] - dx / 2, su]) + piega(bt, [bt[0] + dx / 2, su]); }
      s += piega(bt, [bt[0] - dx / 2, giu]) + piega(bt, [bt[0] + dx / 2, giu]);
    });
    for (k = 0; k < ys.length; k++) rows[k].forEach(function (bt) {   // i bottoni nella fossetta
      s += ell(bt[0], bt[1] + .3, 2.8, 2.2, nuovaR([[0, "#000", .45], [1, "#000", 0]], .5, .5, .5)) + cer(bt[0], bt[1], 1.15, nuovaR([[0, chiaro(c, .5)], [.6, c], [1, scuro(c, .5)]], .35, .3, .8), bordo(scuro(c, .65), .35));
    });
    return s;
  }
  function chiodi(pp, r) {   // i chiodini d'ottone, uno accanto all'altro
    var g = rad("chd", [[0, "#fffbe0"], [.35, "#f1cf6e"], [.75, "#b5862a"], [1, "#6e4c10"]], .38, .32, .7);
    return pp.map(function (w) { return cer(w[0] + .3, w[1] + .45, r || .85, "#000", op(.35)) + cer(w[0], w[1], r || .85, g, "stroke='#5a3c0c' stroke-width='.3'"); }).join("");
  }
  function patina(b, seme, n) {   // le macchie morbide della pelle vissuta (chiare e scure), dentro i limiti b sullo schermo
    var r = rnd(seme), s = "", i;
    for (i = 0; i < (n || 8); i++) { var x = b[0] + r() * (b[2] - b[0]), y = b[1] + r() * (b[3] - b[1]); s += ell(x, y, 3 + r() * 6, 1.5 + r() * 2.5, r() < .5 ? "#fff" : "#000", op(f2(.025 + r() * .03))); }
    return s;
  }
  def("divano_pelle", { tipo: "piedi", nome: "Divano Chesterfield", stanza: "tutte", fp: [2, 1], box: [-82, -84, 88, 45], dietro: true, seduta: 28, prezzo: 3200, colori: COL_PELLE }, function (o) {
    var c = scelto(COL_PELLE, o).c, pz = [], i;
    var s = ombraPianta(-.98, .98, -.47, .43, 1) + ombraSotto(-.9, .9, -.42, .38, .34);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (g) {
      var a = .85 * g[0], b = g[1] < 0 ? -.38 : .335;
      pz.push({ box: [a - .05, a + .05, b - .05, b + .05, 0, 7], s: piedeTornito(a, b, "#3a2516") });
    });
    // il frontale sotto la seduta, con la fila di chiodini
    pz.push({ box: [-.745, .745, -.45, .405, 7, 14], s: estruso("a", tondo(-.45, .405, 7, 14, .022, 0, .018), -.745, .745, c, { mat: PELLE, ao: .3, aoH: 6, fascia: function () {
      if (G < 0) return "";
      var r = [], a; for (a = -.727; a <= .728; a += .0363) r.push(P(a, .405, 12.2));
      return chiodi(r, .78);
    } }) });
    // lo schienale: il capitonné a rombi sul davanti, il bordo a rotolo con le pieghe; dietro liscio coi chiodini
    var sch = pulisci([[-.462, 14], [-.235, 14], [-.268, 43]].concat(arcoS(-.366, 44, .1, 6.8, 0, Math.PI, 18), [[-.466, 43.5]]));
    function bDav(z) { return -.235 - .033 * (z - 14) / 29; }
    var schienale = estruso("a", sch, -.745, .745, c, { mat: PELLE, ao: .25, aoH: 10, fascia: function (H) {
      var r = patina(limiti(H.sil), 101, 12) + H.luccica(.45), dav = function (w) { return w[0] > -.37 && w[1] >= 42.9; };
      if (G > 0) {
        r += piano(P(-.745, bDav(43), 43), P(.745, bDav(43), 43), P(-.745, bDav(14), 14), 91, 29, capitonne(91, 29, [4.6, 11.6, 18.6], 7, c) + buio(91, 16, .3).replace("<rect ", "<rect transform='translate(0 13)' "));
        for (i = 0; i <= 7; i++) { var pp = H.sez(-.745 + i * 1.49 / 7, dav); if (pp.length > 1) r += tratto(aperto(pp), scuro(c, .55), .75, op(.6)) + tratto(aperto(sposta(pp, .3, .5)), chiaro(c, .35), .45, op(.45)); }   // le pieghe che salgono sul rotolo
      } else {
        r += pianoV("a", -.464, -.745, .745, 14, 43.5, [30.3, 60.6].map(function (x) { return tratto("M" + x + ",1 L" + x + ",29", scuro(c, .5), .8, op(.7)) + tratto("M" + (x + .6) + ",1 L" + (x + .6) + ",29", chiaro(c, .3), .45, op(.5)); }).join(""));
        var ch = [], a; for (a = -.73; a <= .731; a += .0365) ch.push(P(a, -.464, 42.2), P(a, -.462, 15.6));
        r += chiodi(ch, .78);
      }
      return r;
    } });
    pz.push({ box: [-.745, .745, -.47, -.236, 14, 51], s: schienale });
    // i braccioli: il fianco dritto (capitonné dentro, chiodini sul davanti) e il rotolo sopra col ventaglio di pieghe
    function braccio(lato) {
      var xi = .745 * lato, xe = .95 * lato, x0 = Math.min(xi, xe), x1 = Math.max(xi, xe), rc = .86 * lato, bv = G > 0 ? .395 : -.462;
      var fianco = estruso("b", pulisci([[x0, 7], [x1, 7], [x1, 41], [x0, 41]]), -.462, .395, c, { mat: PELLE, ao: .28, aoH: 8, fascia: function (H) {
        var r = patina(limiti(H.sil), 131 + lato, 6);
        if ((lato < 0) === (G > 0)) r += pianoV("b", xi, -.235, .395, 28, 40, capitonne(38.4, 12, [5.6], 3, c) + buio(38.4, 6, .3).replace("<rect ", "<rect transform='translate(0 6)' "));
        return r;
      } });
      var ch = [], z; for (z = 9; z <= 36.5; z += 2.3) ch.push(P(x0 + .017, bv, z), P(x1 - .017, bv, z));
      var rotolo = estruso("b", pulisci(arcoS(rc, 41.5, .118, 6.2, -Math.PI, Math.PI, 30).slice(0, -1)), -.47, .41, c, { mat: PELLE, fascia: function (H) { return patina(limiti(H.sil), 141 + lato, 5) + H.luccica(.6, .03, .97); }, tappo: function (T) {
        var cx = T.x(rc), cy = T.y(41.5), rx = .118 * 61, ry = 6.2, r = "", k;
        if (G < 0) return T.su(ell(cx - rx * .35, cy - ry * .4, rx * .3, ry * .22, "#fff", op(.15)));   // dietro il rotolo è liscio
        for (k = 0; k < 12; k++) {   // il ventaglio di pieghe attorno al bottone
          var an = k / 12 * 6.2832 + .2;
          r += tratto(linea([cx + Math.cos(an) * 1.6, cy + Math.sin(an) * 1.3], [cx + Math.cos(an) * rx * .95, cy + Math.sin(an) * ry * .95]), scuro(c, .55), .7, op(.75)) +
            tratto(linea([cx + Math.cos(an + .13) * 1.8, cy + Math.sin(an + .13) * 1.5], [cx + Math.cos(an + .13) * rx * .9, cy + Math.sin(an + .13) * ry * .9]), chiaro(c, .4), .45, op(.55));
        }
        r += ell(cx - rx * .35, cy - ry * .4, rx * .3, ry * .22, "#fff", op(.18)) + ell(cx, cy + .2, 2.6, 2.2, nuovaR([[0, "#000", .45], [1, "#000", 0]], .5, .5, .5)) + cer(cx, cy, 1.35, nuovaR([[0, chiaro(c, .5)], [.6, c], [1, scuro(c, .5)]], .35, .3, .8), bordo(scuro(c, .65), .35));
        return T.su(r);
      } });
      return fianco + chiodi(ch, .75) + rotolo;
    }
    pz.push({ box: [-.98, -.746, -.47, .41, 7, 48], s: braccio(-1) }, { box: [.746, .98, -.47, .41, 7, 48], s: braccio(1) });
    // i due cuscini della seduta, col cordoncino e le piccole grinze della pelle
    var cu = tondo(-.25, .42, 14, 28, .05, 1.1, .03);
    [[-.744, -.004], [.004, .744]].forEach(function (x, j) {
      pz.push({ box: [x[0], x[1], -.23, .42, 14, 29.5], s: estruso("a", cu, x[0], x[1], c, { mat: PELLE, ao: .3, aoH: 9, fascia: function (H) {
        var k = H.vicinoA(.42 - .02, 28 - 1.4), r = cordone(aperto(H.lungo(k, x[0] + .02, x[1] - .02)), c, 1.2) + patina(limiti(H.sil), 151 + j, 8) + H.luccica(.3, .1, .9);
        r = solco(H, -.2, 28, x[0], x[1]) + r;
        if (G > 0) [[x[0] + .07, 1], [x[1] - .09, -1], [(x[0] + x[1]) / 2 + .04, 1]].forEach(function (g) {   // le grinze
          var a1 = P(g[0], .425, 25.6), a2 = P(g[0] + .025 * g[1], .425, 22.5), a3 = P(g[0] + .012 * g[1], .425, 19.5);
          r += tratto("M" + q(a1) + " Q" + q(a2) + " " + q(a3), scuro(c, .5), .6, op(.55)) + tratto("M" + q(a1[0] + .5, a1[1] + .2) + " Q" + q(a2[0] + .5, a2[1] + .2) + " " + q(a3[0] + .5, a3[1] + .2), chiaro(c, .35), .4, op(.45));
        });
        return r;
      } }) });
    });
    return s + inOrdine(pz);
  });

  function trama(b, seme, n, c) {   // la trama della stoffa: puntini chiari e scuri, fitti (dentro i limiti b sullo schermo)
    var r = rnd(seme), s = "", i;
    for (i = 0; i < n; i++) s += cer(b[0] + r() * (b[2] - b[0]), b[1] + r() * (b[3] - b[1]), .3 + r() * .25, r() < .8 ? chiaro(c, .55) : scuro(c, .12), op(.13));
    return s;
  }
  function punti(pp, c, w) { return tratto(aperto(pp), chiaro(c, .5), w || .5, "stroke-dasharray='1.4 1.1' opacity='.8'"); }   // le cuciture a vista

  // =========================================================
  //  POLTRONA IMBOTTITA: lo schienale alto e tondo, i braccioli a rullo, il cuscino gonfio col cordoncino,
  //  le gambe di noce affusolate coi puntali d'ottone
  // =========================================================
  var COL_POLTRONA = [{ id: "giallo", nome: "gialla", c: "#f2b134" }, { id: "rosso", nome: "rossa", c: "#e03131" }, { id: "salvia", nome: "verde salvia", c: "#8cb39a" },
    { id: "azzurro", nome: "azzurra", c: "#4dabf7" }, { id: "lilla", nome: "lilla", c: "#b197fc" }, { id: "panna", nome: "panna", c: "#efe3c8" }];
  var GAMBA_NOCE = [[0, "#c9976a"], [.35, "#8a5a35"], [1, "#3e2412"]];
  def("poltrona_gialla", { tipo: "piedi", nome: "Poltrona imbottita", fp: [1, 1], box: [-52, -75, 58, 30], dietro: true, seduta: 29, prezzo: 900, colori: COL_POLTRONA }, function (o) {
    var c = scelto(COL_POLTRONA, o).c, pz = [];
    var s = ombraPianta(-.42, .42, -.44, .38, 1) + ombraSotto(-.36, .36, -.38, .32, .3);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(function (g) {   // le gambe di noce, un po' aperte
      var a = .32 * g[0], b = g[1] < 0 ? -.36 : .29;
      pz.push({ box: [a - .03, a + .03, b - .03, b + .03, 0, 9], s: gambaTonda([a, b, 9.5], [a + .045 * g[0], b + .04 * g[1], 0], 2.2, 1.2, GAMBA_NOCE, OTTONE) });
    });
    pz.push({ box: [-.4, .4, -.42, .36, 9, 14], s: estruso("a", tondo(-.42, .36, 9, 14, .02, 0, .015), -.4, .4, scuro(c, .28), { mat: STOFFA, lw: 2 }) });
    // lo schienale: alto e tondo come una lapide, col cordoncino tutto attorno
    var arc = pulisci([[-.37, 14], [.37, 14]].concat(arcoS(.17, 44, .2, 12.2, 0, Math.PI / 2, 10), arcoS(-.17, 44, .2, 12.2, Math.PI / 2, Math.PI, 10)));
    pz.push({ box: [-.27, .27, -.44, -.215, 14, 57], s: estruso("b", arc, -.44, -.215, c, { mat: STOFFA, ao: .2, aoH: 14, fascia: function (H) { return trama(limiti(H.sil), 61, 140, c); }, tappo: function (T) {
      if (G < 0) return T.su(rett(T.x(-.37), T.y(44), T.W, 6, 0, "none"));
      return T.su(buio(T.W, 14, .32).replace("<rect ", "<rect transform='translate(0 " + f1(T.H - 18) + ")' ") + ell(T.W * .32, T.H * .28, T.W * .2, T.H * .18, "#fff", op(.14)));
    } }) + cordone(chiuso(rientra(arc.map(function (w) { return P(w[0], G > 0 ? -.215 : -.44, w[1]); }), 1.8)), c, 1.25) });
    // i braccioli a rullo
    function bracciolo(x0, x1) {
      var pr = pulisci([[x0, 14], [x1, 14], [x1, 32.4]].concat(arcoS((x0 + x1) / 2, 32.4, (x1 - x0) / 2, 4.8, 0, Math.PI, 14), [[x0, 32.4]])), dx = x0 < 0 ? x1 : x0;
      return estruso("b", pr, -.3, .37, c, { mat: STOFFA, ao: .25, aoH: 9, fascia: function (H) {
        return trama(limiti(H.sil), 71 + x0 * 10, 70, c) + ((x0 < 0) === (G > 0) ? pianoV("b", dx, -.2, .37, 28, 34, buio(41, 6, .3)) : "");
      } }) + cordone(chiuso(rientra(pr.map(function (w) { return P(w[0], G > 0 ? .37 : -.3, w[1]); }), 1.6)), c, 1.15);
    }
    pz.push({ box: [-.42, -.271, -.3, .37, 14, 37.2], s: bracciolo(-.42, -.27) }, { box: [.271, .42, -.3, .37, 14, 37.2], s: bracciolo(.27, .42) });
    // il cuscino gonfio
    pz.push({ box: [-.27, .27, -.214, .38, 14, 30.5], s: estruso("a", tondo(-.23, .38, 14, 29, .06, 1.7, .03), -.27, .27, c, { mat: STOFFA, ao: .28, aoH: 9, fascia: function (H) {
      var k = H.vicinoA(.38 - .02, 29 - 1.6), m = P(0, .07, 30.5);
      return solco(H, -.18, 29, -.27, .27) + trama(limiti(H.sil), 81, 80, c) + cordone(aperto(H.lungo(k, -.255, .255)), c, 1.2) + (G > 0 ? "<g transform='translate(" + q(m[0], m[1]).replace(",", " ") + ") rotate(26.6)'>" + ell(0, 0, 9, 4.5, nuovaR([[0, "#fff", .25], [1, "#fff", 0]], .5, .5, .5)) + "</g>" : "");
    } }) });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  POLTRONA RELAX: lo schienale a tre cuscini uno sull'altro, i braccioli grossi e morbidi, il poggiapiedi nascosto
  //  davanti, le cuciture a vista e la leva sul fianco; dietro la cerniera
  // =========================================================
  def("poltrona_relax", { tipo: "piedi", nome: "Poltrona relax", stanza: "tutte", fp: [1, 1], box: [-55, -81, 61, 31], dietro: true, seduta: 30, prezzo: 1600 }, function () {
    var c = "#868e96", pz = [];
    var s = ombraPianta(-.45, .45, -.47, .41, 1.1);
    pz.push({ box: [-.3, .3, -.42, .36, 0, 2], s: blocco(-.3, .3, -.42, .36, 0, 2, "#3b3f44", null, 1.4) });   // lo zoccolo scuro, rientrato
    // il davanti col poggiapiedi ripiegato (la cucitura attorno)
    pz.push({ box: [-.27, .27, -.3, .4, 2, 16], s: estruso("a", tondo(-.3, .4, 2, 16, .03, 0, .02), -.27, .27, scuro(c, .06), { mat: STOFFA, ao: .3, aoH: 6, fascia: function (H) {
      if (G < 0) return "";
      return trama(limiti(H.sil), 91, 60, c) + pianoV("a", .4, -.27, .27, 2, 16, rett(3, 2.2, 27, 10.5, 2, "none", "stroke='" + scuro(c, .45) + "' stroke-width='.9'") + rett(4.1, 3.3, 24.8, 8.3, 1.6, "none", "stroke='" + chiaro(c, .5) + "' stroke-width='.5' stroke-dasharray='1.4 1.1' opacity='.8'"));
    } }) });
    // il guscio dello schienale, inclinato all'indietro; dietro la cerniera
    var gu = pulisci([[-.475, 2], [-.325, 2], [-.392, 58]].concat(arcoS(-.433, 58, .041, 2.5, 0, Math.PI, 8), [[-.475, 58]]));
    pz.push({ box: [-.3, .3, -.48, -.395, 2, 61], s: estruso("a", gu, -.3, .3, scuro(c, .04), { mat: STOFFA, ao: .2, aoH: 10, fascia: function (H) {
      if (G > 0) return "";
      var r = trama(limiti(H.sil), 95, 110, c);
      r += pianoV("a", -.475, -.3, .3, 2, 58, rett(17.6, 3, 1.4, 50, .5, "#4a4f55") + rett(17.9, 3, .8, 50, 0, "none", "stroke='#c9ced3' stroke-width='.5' stroke-dasharray='.6 .6'") + rett(17, 49, 2.6, 4.4, .8, nuova(CROMO, 0, 0, 1, 0), bordo(L, .4)));   // la cerniera
            return r + punti(H.lungo(H.vicinoA(-.475, 58), -.29, .29), c) + punti(H.lungo(H.vicinoA(-.475, 2), -.29, .29), c);
    } }) });
    // i tre cuscini dello schienale, a cascata (quello di sopra è il poggiatesta)
    [[-.25, 34, .1, 7.6, -.24], [-.29, 45.5, .1, 7.4, -.28], [-.33, 56.5, .108, 7, -.32]].forEach(function (k, j) {
      var pr = pulisci(arcoS(k[0], k[1], k[2], k[3], -Math.PI, Math.PI, 26).slice(0, -1));
      pz.push({ box: [-.27, .27, k[4] - .005, k[4] + .005, k[1] - 7, k[1] + 7], s: estruso("a", pr, -.265, .265, c, { mat: STOFFA, fascia: function (H) {
        var r = trama(limiti(H.sil), 101 + j, 70, c);
        if (G > 0) r += punti(H.sez(-.264, function (w) { return true; }), c) + punti(H.sez(.264, function (w) { return true; }), c);
        return r;
      } }) });
    });
    // i braccioli: grossi, col cuscinetto sopra e le cuciture
    function bracciolo(x0, x1) {
      var pr = tondo(x0, x1, 2, 38, .07, 1.2, .02), dx = x0 < 0 ? x1 : x0, bv = G > 0 ? .38 : -.4;
      return estruso("b", pr, -.4, .38, c, { mat: STOFFA, ao: .3, aoH: 10, fascia: function (H) {
        var r = trama(limiti(H.sil), 111 + x0 * 10, 120, c) + ((x0 < 0) === (G > 0) ? pianoV("b", dx, -.22, .38, 29, 36, buio(37, 7, .32)) : "");
        r += punti(H.lungo(H.vicinoA(x0 + .012, 36.6), -.39, .37), c) + punti(H.lungo(H.vicinoA(x1 - .012, 36.6), -.39, .37), c);
        return r;
      }, tappo: function (T) {
        return T.su(rett(1.6, 1.6, T.W - 3.2, 9, 3.5, "none", "stroke='" + scuro(c, .4) + "' stroke-width='.8'") + rett(2.6, 2.6, T.W - 5.2, 7, 2.6, "none", "stroke='" + chiaro(c, .5) + "' stroke-width='.45' stroke-dasharray='1.4 1.1' opacity='.8'") +
          ell(T.W * .35, 4.5, T.W * .25, 2.4, "#fff", op(.15)));
      } });
    }
    pz.push({ box: [-.44, -.271, -.4, .38, 2, 39.2], s: bracciolo(-.44, -.27) }, { box: [.271, .44, -.4, .38, 2, 39.2], s: bracciolo(.27, .44) });
    // la seduta
    pz.push({ box: [-.27, .27, -.235, .39, 16, 31.5], s: estruso("a", tondo(-.235, .39, 16, 30, .065, 1.8, .03), -.27, .27, c, { mat: STOFFA, ao: .28, aoH: 9, fascia: function (H) {
      var k = H.vicinoA(.39 - .02, 30 - 1.8);
      return solco(H, -.19, 30, -.27, .27) + trama(limiti(H.sil), 121, 90, c) + punti(H.lungo(k, -.26, .26), c, .55) + (G > 0 ? ell(P(0, .1, 31)[0], P(0, .1, 31)[1], 9, 3.4, nuovaR([[0, "#fff", .2], [1, "#fff", 0]], .5, .5, .5)) : "");
    } }) });
    // la leva sul fianco destro
    pz.push({ box: [.44, .5, .1, .2, 18, 30], s: (function () {   // la piastrina e la leva cromata col pomello
      var a = P(.443, .15, 19.5), b = P(.475, .15, 22), e = P(.49, .13, 30);
      return pianoV("b", .441, .1, .2, 17, 24, rett(1.2, .8, 3.7, 5.4, 1.2, nuova([[0, "#6c737a"], [1, "#2f3337"]], 0, 0, 1, 1), bordo(L, .6))) +
        cromo("M" + q(a) + " L" + q(b) + " L" + q(e), 1.8) + cer(e[0], e[1], 2.3, nuovaR([[0, "#ffffff"], [.5, "#c9d1d7"], [1, "#6b7780"]], .35, .3, .8), bordo(L, .9));
    })() });
    return s + inOrdine(pz);
  });

  // =========================================================
  //  IL LEGNO: venature col caso fisso, il lucido della vernice
  // =========================================================
  function venature(W, H, c, seme, passo, nodi) {   // le venature lungo x in un rettangolo piatto W × H
    var r = rnd(seme), s = "", i, n = Math.max(2, Math.round(H / (passo || 3)));
    for (i = 0; i < n; i++) {
      var y = (i + .2 + r() * .6) * H / n, amp = .3 + r() * 1.1, fr = 1.5 + r() * 3, ph = r() * 6.28, d = "M-2," + f1(y + Math.sin(ph) * amp), x;
      for (x = 3; x <= W + 3; x += 3) d += " L" + f1(x) + "," + f1(y + Math.sin(ph + x / W * fr * 3.14) * amp);
      s += tratto(d, r() < .72 ? scuro(c, .28 + r() * .15) : chiaro(c, .22), .35 + r() * .45, op(f2(.28 + r() * .35)));
    }
    for (i = 0; i < (nodi || 0); i++) {
      var nx = W * (.15 + r() * .7), ny = H * (.25 + r() * .5), rw = 2.2 + r() * 2.4;
      s += ell(nx, ny, rw * 1.8, rw * .7, "none", "stroke='" + scuro(c, .3) + "' stroke-width='.45' opacity='.45'") + ell(nx, ny, rw * 1.1, rw * .4, "none", "stroke='" + scuro(c, .3) + "' stroke-width='.45' opacity='.5'") + ell(nx, ny, rw * .45, rw * .2, scuro(c, .35), op(.5));
    }
    return s;
  }
  function lucidoPiano(W, H, k) {   // il riflesso della vernice sul piano: una fascia larga e una riga sottile, in diagonale
    k = k || 1;
    return poly([[W * .16, 0], [W * .36, 0], [W * .2, H], [0, H]], "#ffffff", op(f2(.13 * k))) + poly([[W * .42, 0], [W * .46, 0], [W * .3, H], [W * .26, H]], "#ffffff", op(f2(.2 * k))) +
      rett(0, 0, W, H, 0, nuova([[0, "#fff", .14 * k], [.5, "#fff", 0]], 0, 0, 1, 1));
  }
  function facciaLegno(c, seme, passo) { return function (W, H) { return venature(W, H, c, seme, passo || 2.2); }; }

  // =========================================================
  //  TAVOLINO DI LEGNO: il piano spesso di noce con le venature e il lucido, le gambe affusolate,
  //  il ripiano sotto con i libri e la rivista
  // =========================================================
  function pagine(W, H) { var s = rett(0, 0, W, H, 0, nuova([[0, "#fbf3dc"], [1, "#e4d4ae"]], 0, 0, 0, 1)), y; for (y = 1; y < H; y += 1.1) s += rett(0, y, W, .3, 0, "#c9b58c", op(.6)); return s; }
  function libroSteso(a0, a1, b0, b1, z0, z1, col, oro) {   // un libro sdraiato: la copertina sopra, le pagine sui fianchi, il dorso dietro
    return blocco(a0, a1, b0, b1, z0, z1, col, { davanti: pagine, fianco: pagine, dietro: function (W, H) { return rett(0, 0, W, H, 0, col) + (oro ? rett(W * .15, 0, .9, H, 0, "#f2c94c") + rett(W * .8, 0, .9, H, 0, "#f2c94c") : ""); },
      sopra: function (A, B, C, D, W, H) { return oro ? piano(A, B, D, W, H, rett(2, 2, W - 4, H - 4, .5, "none", "stroke='#f2c94c' stroke-width='.7'")) : piano(A, B, D, W, H, rett(W * .2, H * .3, W * .5, H * .25, .5, "#ffffff", op(.55))); } }, 1);
  }
  def("tavolino_legno", { tipo: "piedi", nome: "Tavolino di legno", stanza: "tutte", fp: [1, 1], box: [-44, -51, 50, 26], dietro: true, piano: 28, prezzo: 600 }, function () {
    var c = "#b07a4a", s = ombraPianta(-.47, .47, -.31, .31, .9, .06) + ombraSotto(-.4, .4, -.24, .24, .22), ang = angoli(.39, .225);
    function gamba(g) { return zampa(g[0], g[1], .033, .021, 0, 24, scuro(c, .08)); }
    s += gamba(ang[0]);
    s += blocco(-.395, .395, -.22, .22, 6.2, 8, scuro(c, .05), { sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, venature(W, H, scuro(c, .05), 21, 3.4)); }, davanti: facciaLegno(c, 22), dietro: facciaLegno(c, 23), fianco: facciaLegno(c, 24) }, 1.5);
    s += libroSteso(-.27, .02, -.13, .1, 8, 10.6, "#1f3d6b", true) + libroSteso(-.25, .0, -.11, .08, 10.6, 12.6, "#8f2d2d", true) + libroSteso(.07, .3, -.12, .12, 8, 8.9, "#f08c00");   // i libri e la rivista
    s += gamba(ang[1]) + gamba(ang[2]) + gamba(ang[3]);
    s += blocco(-.47, .47, -.305, .305, 24, 28, c, { sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, venature(W, H, c, 25, 4.2, 2) + lucidoPiano(W, H)); },
      davanti: facciaLegno(c, 26, 1.4), dietro: facciaLegno(c, 27, 1.4), fianco: facciaLegno(c, 28, 1.4) }, 2.3);
    return s;
  });

  // =========================================================
  //  TAVOLINO DI VETRO: il piano spesso col bordo verde del vetro e i riflessi, le gambe cromate,
  //  il ripiano sotto di vetro smerigliato con due libri (si vedono attraverso il piano)
  // =========================================================
  function lastra(a0, a1, b0, b1, z0, z1, k, smer) {   // una lastra di vetro: sopra trasparente, i bordi verdi
    var u0 = G > 0 ? a0 : -a1, u1 = G > 0 ? a1 : -a0, v0 = G > 0 ? b0 : -b1, v1 = G > 0 ? b1 : -b0;
    var A = Puv(u0, v0, z1), B = Puv(u1, v0, z1), C = Puv(u1, v1, z1), D = Puv(u0, v1, z1), Bb = Puv(u1, v0, z0), Cb = Puv(u1, v1, z0), Db = Puv(u0, v1, z0);
    var s = poly([D, C, Cb, Db], nuova([[0, "#bfe8df"], [1, "#6fb8aa"]], 0, 0, 0, 1), op(.92)) + poly([C, B, Bb, Cb], nuova([[0, "#8fcfc2"], [1, "#4f9a8d"]], 0, 0, 0, 1), op(.92));
    s += poly([A, B, C, D], nuova(smer ? [[0, "#f4fbfd"], [1, "#cfe2e8"]] : [[0, "#ffffff"], [.5, "#d9f3fb"], [1, "#a9dcec"]], 0, 0, 1, 1), op(smer ? .82 : k || .34));
    s += tratto(linea([D[0] + 1.5, D[1] + .9], [C[0] - 1, C[1] + .6]), "#ffffff", .9, op(.85)) + tratto(linea([C[0] + .6, C[1] + .6], [B[0] - .8, B[1] + .9]), "#e6fffa", .7, op(.6));
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), "#2d6a62", .8, op(.7));
    if (!smer) s += dentro(chiuso([A, B, C, D]), tratto(linea([A[0] + 10, A[1] + 3], [D[0] + 10, D[1] + 3]), "#ffffff", 5, op(.28)) + tratto(linea([A[0] + 20, A[1] + 8], [D[0] + 20, D[1] + 8]), "#ffffff", 1.6, op(.45)) + tratto(linea([B[0] - 22, B[1] - 3], [C[0] - 22, C[1] - 3]), "#ffffff", 3, op(.15)));
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, 1.6));
  }
  def("tavolino_vetro", { tipo: "piedi", nome: "Tavolino di vetro", stanza: "tutte", fp: [1, 1], box: [-42, -48, 48, 25], dietro: true, piano: 26.5, prezzo: 650 }, function () {
    var s = ombraPianta(-.46, .46, -.3, .3, .6, .05), ang = angoli(.395, .235);
    s += aTerra("<ellipse cx='" + f2(.03) + "' cy='0' rx='.3' ry='.17' fill='" + rad("cau", [[0, "#dff7ff", .5], [1, "#dff7ff", 0]], .5, .5, .5) + "'/>");   // la luce che passa dal vetro
    function gamba(g) { var F = forma(g[0], g[1], .018, .018, .018, 2), pie = P(g[0], g[1], 0); return ell(pie[0], pie[1] + .4, 2.6, 1.3, "#000", op(.3)) + corpo([giro(F, 0, 1, 20), giro(F, 24.6, 1, 20)], CROMO, 1.2); }
    s += gamba(ang[0]);
    // il telaio cromato sotto il ripiano e sotto il piano
    function telaio(z) { return [[-.395, -.235, .395, -.235], [-.395, .235, .395, .235], [-.395, -.235, -.395, .235], [.395, -.235, .395, .235]].map(function (t) { return cromo(linea(P(t[0], t[1], z), P(t[2], t[3], z)), 1.2); }).join(""); }
    s += telaio(7.2) + lastra(-.41, .41, -.25, .25, 7.4, 8.4, 0, true);
    s += libroSteso(-.28, -.04, -.14, .07, 8.4, 10.6, "#e03131") + libroSteso(.0, .2, -.1, .12, 8.4, 10, "#1c7ed6");   // i due libri, rosso e blu
    s += gamba(ang[1]) + gamba(ang[2]) + gamba(ang[3]) + telaio(23.8);
    [[-.395, -.235], [.395, -.235], [-.395, .235], [.395, .235]].forEach(function (g) { var t = P(g[0], g[1], 24.6); s += ell(t[0], t[1], 3.4, 1.7, nuova(CROMO, 0, 0, 1, 1), bordo(L, .8)); });   // i dischetti che reggono il vetro
    return s + lastra(-.46, .46, -.3, .3, 24.6, 26.5, .3);
  });

  // =========================================================
  //  MOBILE BASSO PER LA TV: noce con le venature, tre ante cannettate con le maniglie d'ottone,
  //  il piano lucido sporgente, le gambe affusolate coi puntali; dietro il pannello coi buchi per i fili
  // =========================================================
  def("mobile_tv", { tipo: "piedi", nome: "Mobile basso di legno", fp: [2, 1], box: [-76, -68, 82, 42], dietro: true, piano: 30, prezzo: 800 }, function () {
    var c = "#a8754a", s = ombraPianta(-.95, .95, -.47, .14, 1, .06) + ombraSotto(-.9, .9, -.43, .1, .28);
    [[-.86, -.41], [.86, -.41], [-.86, .08], [.86, .08]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }).forEach(function (g) {
      var sa = g[0] < 0 ? -1 : 1, sb = g[1] < 0 ? -1 : 1;
      s += gambaTonda([g[0], g[1], 6.5], [g[0] + .03 * sa, g[1] + .025 * sb, 0], 2.1, 1.25, GAMBA_NOCE, OTTONE);
    });
    function ante(W, H) {   // le tre ante cannettate, con la maniglia lunga d'ottone
      var g = 1.4, w = (W - 4 * g) / 3, r = "", i, x;
      for (i = 0; i < 3; i++) {
        var x0 = g + i * (w + g);
        r += rett(x0, 1.4, w, H - 2.8, .8, nuova([[0, chiaro(c, .16)], [1, chiaro(c, .02)]], 0, 0, 0, 1), "stroke='" + scuro(c, .45) + "' stroke-width='.8'");
        for (x = x0 + 1.6; x < x0 + w - .8; x += 2.2) r += rett(x, 1.9, 1.1, H - 3.8, .5, chiaro(c, .3), op(.55)) + rett(x + 1.1, 1.9, .5, H - 3.8, 0, scuro(c, .35), op(.45));   // le cannette
        r += rett(x0 + w / 2 - 6, 4.2, 12, 1.7, .85, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .55)) + rett(x0 + w / 2 - 5, 4.5, 9, .45, .2, "#fffbe0", op(.8));
      }
      return r + rett(0, H - 1.2, W, 1.2, 0, scuro(c, .35), op(.6));
    }
    function schiena(W, H) {   // il pannello di dietro: più scuro, le viti, i buchi coi fili
      var r = venature(W, H, scuro(c, .25), 31, 2.4) + rett(2, 2, W - 4, H - 4, 1, "none", "stroke='" + scuro(c, .45) + "' stroke-width='.8'");
      [[3.5, 3.5], [W - 3.5, 3.5], [3.5, H - 3.5], [W - 3.5, H - 3.5], [W / 2, 3.5], [W / 2, H - 3.5]].forEach(function (v) { r += cer(v[0], v[1], .7, scuro(c, .6)); });
      [W * .3, W * .7].forEach(function (x) { r += ell(x, H * .42, 4, 2.6, "#2b1d14", "stroke='#1a1a1a' stroke-width='1.2'") + ell(x, H * .42, 4, 2.6, "none", "stroke='#4a4f55' stroke-width='.6'"); });
      return r + tratto("M" + f1(W * .3 - 1) + "," + f1(H * .45) + " Q" + f1(W * .3 - 3) + "," + f1(H * .8) + " " + f1(W * .26) + "," + f1(H + 6), "#1b1b1f", 1.6) + tratto("M" + f1(W * .7 + 1) + "," + f1(H * .45) + " Q" + f1(W * .7 + 4) + "," + f1(H * .85) + " " + f1(W * .75) + "," + f1(H + 6), "#1b1b1f", 1.6);
    }
    s += blocco(-.92, .92, -.45, .115, 6, 27.5, c, { davanti: ante, dietro: schiena, fianco: facciaLegno(c, 32) }, 2.3);
    s += blocco(-.945, .945, -.462, .132, 27.5, 30, chiaro(c, .03), { sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, venature(W, H, chiaro(c, .03), 33, 3.6, 2) + lucidoPiano(W, H)); },
      davanti: facciaLegno(c, 34, 1.2), dietro: facciaLegno(c, 35, 1.2), fianco: facciaLegno(c, 36, 1.2) }, 2.2);
    return s;
  });

  // =========================================================
  //  TV A SCHERMO PIATTO: la cornice sottile e lucida, lo schermo spento blu scuro coi riflessi, il piede;
  //  dietro: la gobba con le prese d'aria, l'etichetta e il filo
  // =========================================================
  def("tv_piatta", { tipo: "sopra", nome: "TV a schermo piatto", fp: [1, 1], box: [-32, -52, 28, 12], dietro: true, prezzo: 1500 }, function () {
    var s = ombraPianta(-.17, .17, -.11, .11, .85, .03);
    function schermo(W, H) {
      var r = rett(0, 0, W, H, 0, nuova([[0, "#34363d"], [1, "#101114"]], 0, 0, 1, 1)), gx = 1.2, gy = 1.2, gw = W - 2.4, gh = H - 3.8;
      r += rett(gx, gy, gw, gh, .3, nuova([[0, "#43539b"], [.45, "#1f2a5e"], [1, "#0a0f2a"]], 0, 0, 1, 1));
      r += dentro("M" + gx + "," + gy + " h" + f1(gw) + " v" + f1(gh) + " h" + f1(-gw) + " Z", poly([[gw * .05, gy], [gw * .3, gy], [gw * .08, gh + gy], [-gw * .17, gh + gy]], "#ffffff", op(.09)) +
        poly([[gw * .36, gy], [gw * .4, gy], [gw * .18, gh + gy], [gw * .14, gh + gy]], "#ffffff", op(.12)) + rett(gw * .62, gy + 2, gw * .12, gh * .42, .4, "#ffffff", op(.05)) + rett(gw * .76, gy + 2, gw * .12, gh * .42, .4, "#ffffff", op(.05)) +
        rett(gx, gy, gw, gh * .35, 0, nuova([[0, "#fff", .1], [1, "#fff", 0]], 0, 0, 0, 1)));
      r += rett(0, gy + gh, W, H - gy - gh, 0, nuova([[0, "#e9edf0"], [.45, "#aab3bb"], [1, "#6c757d"]], 0, 0, 0, 1)) + rett(0, gy + gh, W, .35, 0, "#ffffff", op(.8));   // la cornice di sotto, d'alluminio spazzolato
      return r + rett(W / 2 - 3, H - 1.9, 6, .8, .4, "#3a3d43", op(.8)) + cer(W - 3, H - 1.3, .45, "#ff4d4d") + cer(W - 3, H - 1.3, 1, "#ff4d4d", op(.25)) + rett(0, 0, W, .5, 0, "#ffffff", op(.25));
    }
    function retro(W, H) {
      var r = rett(0, 0, W, H, 0, nuova([[0, "#3a3d43"], [1, "#24262a"]], 0, 0, 1, 1)), x;
      for (x = 4; x < W - 4; x += 2.4) r += rett(x, 2.4, 1, 4.2, .5, "#15161a");   // le prese d'aria
      return r + rett(0, 0, W, .5, 0, "#ffffff", op(.12));
    }
    function gobba(W, H) {
      var r = rett(0, 0, W, H, 1, nuova([[0, "#45484f"], [1, "#2a2c31"]], 0, 0, 1, 1)), y;
      for (y = 3; y < 9; y += 1.6) r += rett(4, y, W - 8, .8, .4, "#15161a");
      r += rett(W * .58, H * .45, 9, 5.5, .5, "#e9ecef") + rett(W * .58 + 1, H * .45 + 1, 4, .5, 0, "#868e96") + rett(W * .58 + 1, H * .45 + 2.2, 6.5, .4, 0, "#adb5bd") + rett(W * .58 + 1, H * .45 + 3.4, 5, .4, 0, "#adb5bd");   // l'etichetta
      [[W * .14, H * .62], [W * .14 + 3.4, H * .62], [W * .14 + 6.8, H * .62]].forEach(function (v) { r += rett(v[0], v[1], 2.4, 1.6, .3, "#0d0e10", "stroke='#6c727a' stroke-width='.35'"); });   // le prese
      return r;
    }
    var ALLU = [nuova([[0, "#f4f6f8"], [.5, "#c3cad0"], [1, "#9aa3ab"]], 0, 0, 1, 1), nuova([[0, "#d5dbe0"], [1, "#8d969e"]], 0, 0, 0, 1), nuova([[0, "#7d868e"], [1, "#59626a"]], 0, 0, 0, 1)];   // l'alluminio del piede
    var base = blocco(-.15, .15, -.095, .085, 0, 1.4, ALLU, { sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, lucidoPiano(W, H, 1.4)); } }, 1.3);
    var collo = blocco(-.032, .032, -.07, -.036, 1.4, 9, ALLU, null, 1.1);
    var dietroG = blocco(-.3, .3, -.072, -.035, 9, 31, "#2b2e33", { dietro: gobba }, 1.5);
    var corpoTv = blocco(-.45, .45, -.035, -.006, 6, 35, "#1b1c20", { davanti: schermo, dietro: retro }, 1.9);
    var filo = G < 0 ? tratto("M" + q(P(.14, -.07, 12)) + " C" + q(P(.17, -.12, 5)) + " " + q(P(.2, -.16, 1)) + " " + q(P(.26, -.2, 0)), "#16171a", 1.7) : "";
    return s + base + (G > 0 ? collo + dietroG + corpoTv : corpoTv + dietroG + filo + collo);
  });

  // =========================================================
  //  LIBRERIA PIENA DI LIBRI: noce, quattro ripiani di libri colorati (alcuni rilegati col filo d'oro), uno appoggiato storto,
  //  una pila sdraiata, la piantina nel vaso di coccio; dietro il pannello con le viti
  // =========================================================
  var COL_LIBRI = ["#e03131", "#1c7ed6", "#2f9e44", "#f08c00", "#7048e8", "#e64980", "#0c8599", "#fab005"], COL_ANTICHI = ["#6b1f2a", "#1f3d2b", "#1b2a4a", "#5c3a1e", "#7a2e12"];
  def("libreria", { tipo: "piedi", nome: "Libreria piena di libri", stanza: "tutte", fp: [1, 1], box: [-51, -141, 57, 29], dietro: true, piano: 115, prezzo: 1200 }, function () {
    var c = "#9a6b45", a0 = -.45, a1 = .45, b0 = -.475, b1 = -.03, t = .024, s = ombraPianta(-.46, .46, -.48, -.02, .9, .05);   // profonda fino quasi al centro della mattonella: le cose appoggiate sopra (al centro) stanno sul piano
    var piani = [[3.5, 6], [31.5, 33.5], [59, 61], [86.5, 88.5], [112, 115]];
    s += blocco(-.43, .43, -.46, -.045, 0, 3.5, scuro(c, .5), null, 1.4);   // lo zoccolo
    function schiena(W, H) {
      var r = venature(W, H, scuro(c, .2), 41, 3), x;
      for (x = W / 4; x < W - 1; x += W / 4) r += rett(x - .3, 0, .6, H, 0, scuro(c, .5), op(.7));
      [[3, 4], [W - 3, 4], [3, H - 4], [W - 3, H - 4], [3, H / 2], [W - 3, H / 2]].forEach(function (v) { r += cer(v[0], v[1], .7, scuro(c, .6)); });
      return r + rett(W * .55, H * .72, 12, 7, .5, "#f1ece2") + rett(W * .55 + 1.5, H * .72 + 1.5, 6, .7, 0, "#868e96") + rett(W * .55 + 1.5, H * .72 + 3.2, 9, .5, 0, "#adb5bd");
    }
    s += blocco(a0, a1, b0, b1, 3.5, 115, c, { davanti: function () { return ""; }, dietro: schiena, fianco: facciaLegno(c, 42, 2.6),
      sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, venature(W, H, c, 43, 3.2) + lucidoPiano(W, H, .6)); } }, 2.3);
    if (G < 0) return s;
    // da davanti: dentro ogni vano il fondo in ombra, il ripiano, i libri
    function libro(x0, x1, y0, y1, z0, h, col, oro, pende) {   // un libro in piedi (pende = quanto è inclinato verso sinistra, in mattonelle)
      var z1 = z0 + h, pe = pende || 0;
      var Db = P(x0, y1, z0), Cb = P(x1, y1, z0), Bb = P(x1, y0, z0), D = P(x0 - pe, y1, z1), C = P(x1 - pe, y1, z1), B = P(x1 - pe, y0, z1), A = P(x0 - pe, y0, z1);
      var r = poly([C, B, Bb, Cb], scuro(col, .26)) + tratto(linea(C, Cb), chiaro(col, .3), .5, op(.6)) + poly([D, C, Cb, Db], nuova([[0, chiaro(col, .22)], [.6, col], [1, scuro(col, .18)]], 0, 0, 1, 0)) + poly([A, B, C, D], "#f1e6c8");
      var w = x1 - x0;
      function fascia(z, k, colF) { var a = P(x0 - pe * k, y1, z), b = P(x1 - pe * k, y1, z); return tratto(linea(a, b), colF, .9); }
      if (oro) r += fascia(z0 + h * .1, .1, "#f2c94c") + fascia(z0 + h * .86, .86, "#f2c94c") + fascia(z0 + h * .9, .9, "#f2c94c") + (function () { var m = P(x0 + w * .5 - pe * .6, y1, z0 + h * .6); return rett(m[0] - w * 14, m[1] - 1.6, w * 28, 3.2, .3, scuro(col, .3)) + rett(m[0] - w * 9, m[1] - .3, w * 18, .6, 0, "#f2c94c"); })();
      else r += fascia(z0 + h * .78, .78, chiaro(col, .7)) + fascia(z0 + h * .2, .2, scuro(col, .3));
      return r + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, .6));
    }
    function pianta(x, y, z) {   // la piantina nel vaso di coccio, coi rametti che ricadono dal ripiano
      var F = forma(x, y, .06, .06, .06, 2), r = "", te = giro(F, z + 8.5, .86, 28), rr = rnd(77), i, k;
      var m = P(x, y, z + 9), fo = [];
      function foglia(px, py, ang, l, col) { return "<path d='M0,0 C" + q(l * .35, -l * .32) + " " + q(l * .8, -l * .2) + " " + f1(l) + ",0 C" + q(l * .8, l * .2) + " " + q(l * .35, l * .32) + " 0,0 Z' fill='" + col + "' transform='translate(" + f1(px) + " " + f1(py) + ") rotate(" + f1(ang) + ")' " + bordo("#1d5c25", .45) + "/>"; }
      for (i = 0; i < 4; i++) {   // i rametti che scendono davanti al vaso (si disegnano dopo)
        var sx = m[0] + (i - 1.5) * 2.6, d = "M" + q(sx, m[1]), lun = 7 + rr() * 8;
        d += " Q" + q(sx + (i - 1.5) * 2.5, m[1] + lun * .4) + " " + q(sx + (i - 1.5) * 1.5, m[1] + lun);
        var g = tratto(d, "#2b7a35", .7);
        for (k = 1; k <= 4; k++) g += foglia(sx + (i - 1.5) * (1 + k * .3), m[1] + lun * k / 4.4, 90 + (k % 2 ? 40 : -40), 3.2 - k * .3, mix("#2f9e44", "#8ce99a", rr() * .5));
        fo.push(g);
      }
      var cespo = "";
      for (i = 0; i < 14; i++) { var an = -170 + i * 11.5 + rr() * 8, l = 5 + rr() * 4.5; cespo += foglia(m[0] + (rr() - .5) * 4, m[1] - rr() * 2, an, l, mix("#2f9e44", "#9be3a8", rr() * .6)); }
      r += cespo + corpo([giro(F, z, .78, 28), giro(F, z + 8.5, 1, 28)], [[0, "#ffb487"], [.45, "#e8590c"], [1, "#8f3505"]], 1.2) + pth(chiuso(giro(F, z + 8.5, 1.02, 28)), "none", "stroke='#c94d0a' stroke-width='1.6'") + pth(chiuso(te), "#4a2f1b", bordo(L, .6));
      return r + fo.join("");
    }
    function vano(zb, zt, k) {
      var x0 = a0 + t, x1 = a1 - t, bf = b0 + .02, bv = b1, r = "";
      r += poly([P(x0, bf, zt), P(x1, bf, zt), P(x1, bf, zb), P(x0, bf, zb)], scuro(c, .52));   // il fondo
      r += poly([P(x0, bf, zt), P(x0, bv, zt), P(x0, bv, zb), P(x0, bf, zb)], scuro(c, .32));   // il fianco di dentro
      r += poly([P(x0, bf, zb), P(x1, bf, zb), P(x1, bv, zb), P(x0, bv, zb)], nuova([[0, scuro(c, .35)], [1, scuro(c, .12)]], 0, 0, 0, 1));   // il ripiano
      r += piano(P(x0, bf, zt), P(x1, bf, zt), P(x0, bf, zb), (x1 - x0) * 61, zt - zb, buio((x1 - x0) * 61, (zt - zb) * .6, .45, true));
      var rr = rnd(900 + k * 37), x = x0 + .008, h0 = zt - zb, fatta = false, cnt = 0;
      while (x < x1 - .02) {
        if (k === 1 && !fatta && x > x0 + .5) { r += pianta(x + .075, (bf + bv) / 2 + .03, zb); x += .155; fatta = true; continue; }   // la piantina
        if (k === 2 && cnt === 9) {   // una pila di libri sdraiati
          var hh = 0, j; for (j = 0; j < 3; j++) { var th = 2 + rr() * 1.3, cc = COL_ANTICHI[(rr() * 5) | 0]; r += libroSteso(x + .005 * j, x + .2 - .01 * j, bv - .25, bv - .02, zb + hh, zb + hh + th, cc, true); hh += th; }
          x += .21; cnt++; continue;
        }
        var w = .022 + rr() * .026, h = h0 * (.62 + rr() * .3), d = .19 + rr() * .07, ant = rr() < .35, col = ant ? COL_ANTICHI[(rr() * 5) | 0] : COL_LIBRI[(rr() * 8) | 0];
        if (x + w > x1 - .006) break;
        if (k === 0 && x + w > x1 - .09 && x + w < x1 - .03) { r += libro(x + .035, x + .035 + w, bv - .015 - d, bv - .015, zb, h, col, ant, .05); break; }   // l'ultimo, storto
        r += libro(x, x + w, bv - .015 - d, bv - .015, zb, h, col, ant);
        x += w + .0015; cnt++;
        if (rr() < .1) x += .015;
      }
      return dentro(chiuso([P(x0, bv, zt), P(x1, bv, zt), P(x1, bv, zb), P(x0, bv, zb)]), r);
    }
    for (var k = 0; k < 4; k++) s += vano(piani[3 - k][1], piani[4 - k][0], k);
    for (k = 0; k < 4; k++) { var zz = piani[k][1]; s += tratto(linea(P(a0 + t, b1, zz + .2), P(a1 - t, b1, zz + .2)), "#ffffff", .7, op(.35)); }   // il filo di luce sui ripiani
    return s;
  });

  // =========================================================
  //  LAMPADA A STELO: la base pesante nera col filo d'ottone, lo stelo sottile con l'anello e l'interruttore,
  //  il paralume plissettato color crema con le bordure; il filo per terra con l'interruttore a pedale
  // =========================================================
  def("lampada_stelo", { tipo: "piedi", nome: "Lampada a stelo", stanza: "tutte", fp: [1, 1], box: [-41, -112, 41, 14], dietro: true, prezzo: 700 }, function () {
    var NERO = [[0, "#70757c"], [.3, "#3d4046"], [1, "#141518"]], s = ombraPianta(-.17, .17, -.17, .17, 1, .03);
    var Fb = forma(0, 0, .15, .15, .15, 2), Fp = forma(0, 0, .012, .012, .012, 2), Fs = forma(0, 0, .2, .2, .2, 2);
    var c1 = P(.03, -.15, .4), c2 = P(.12, -.28, 0), c3 = P(.2, -.4, 0), cv = "M" + q(c1) + " C" + q(c2) + " " + q(P(.14, -.36, 0)) + " " + q(c3) + " L" + q(P(.28, -.47, 0));
    var filo = tratto(cv, "#141518", 1.6) + (function () { var m = P(.2, -.4, 0); return ell(m[0], m[1] - .8, 3.2, 1.9, "#25272b", bordo(L, .8)) + ell(m[0] - .4, m[1] - 1.5, 1.4, .8, "#e03131"); })();
    if (G > 0) s += filo;
    s += corpo([giro(Fb, 0, 1, 48), giro(Fb, 2.6, .97, 48)], NERO, 1.6) + pth(chiuso(giro(Fb, 2.6, .97, 48)), rad("bs", [[0, "#6a6f76"], [.5, "#2f3237"], [1, "#16171a"]], .4, .35, .8), bordo(L, 1.1));
    s += pth(chiuso(giro(Fb, 2.6, .82, 48)), "none", "stroke='#d9b04c' stroke-width='.8' opacity='.9'") + pth(chiuso(giro(Fb, 2.6, .97, 48)), "none", "stroke='#ffffff' stroke-width='.5' opacity='.25'");
    if (G < 0) s += filo;
    // lo stelo, con l'anello d'ottone e l'interruttore
    s += corpo([giro(Fp, 2.6, 1.6, 16), giro(Fp, 5, 1.6, 16)], OTTONE, 1) + corpo([giro(Fp, 5, 1, 16), giro(Fp, 79, 1, 16)], NERO, 1.1) + corpo([giro(Fp, 46, 1.7, 16), giro(Fp, 48.5, 1.7, 16)], OTTONE, .9);
    var sw = P(0, .03, 33);
    if (G > 0) s += rett(sw[0] - 1.6, sw[1] - 2.6, 3.2, 4.6, 1, nuova(NERO, 0, 0, 1, 0), bordo(L, .7)) + cer(sw[0] - .2, sw[1] - .3, 1, nuovaR(OTTONE, .35, .3, .8), bordo(L, .4));
    s += corpo([giro(Fp, 78.5, 2.4, 16), giro(Fp, 82, 2.4, 16)], OTTONE, .9);   // il portalampada
    // il paralume plissettato
    var giu = giro(Fs, 76, 1, 64), su = giro(Fs, 101, .66, 64), sil = sagoma([giu, su]), r = "", i;
    var stoffa = lin("ps", [[0, "#fffaf0"], [.35, "#f5e8cb"], [.75, "#e2cfa4"], [1, "#b89f72"]], limiti(sil)[0], 0, limiti(sil)[2], 0, true);
    for (i = 0; i < 64; i += 2) {   // le pieghe, solo sul davanti
      var an = i / 64 * 6.2832, uu = Math.cos(an), vv = Math.sin(an);
      if (uu + vv < -.15) continue;
      var pa = Puv(uu * .2, vv * .2, 76), pb = Puv(uu * .2 * .66, vv * .2 * .66, 101);
      r += tratto(linea(pa, pb), i % 4 ? "#ffffff" : "#b89f72", i % 4 ? .7 : .55, op(i % 4 ? .45 : .5));
    }
    s += pth(chiuso(sil), stoffa) + dentro(chiuso(sil), r + ell((limiti(sil)[0] + limiti(sil)[2]) / 2 - 6, limiti(sil)[1] + 14, 3, 9, "#ffffff", op(.3))) + pth(chiuso(sil), "none", bordo(L, 1.8));
    // le bordure (sotto e sopra) e la bocca col dentro chiaro
    var bg = giro(Fs, 76, 1.01, 64), bs = giro(Fs, 101, .67, 64);
    s += tratto(aperto(bg.filter(function (w, j) { var an = j / 64 * 6.2832; return G * (Math.cos(an) + Math.sin(an)) > -.3; }).sort(function (x, y) { return x[0] - y[0]; })), "#c9a24a", 2.4) +
      tratto(aperto(bg.filter(function (w, j) { var an = j / 64 * 6.2832; return G * (Math.cos(an) + Math.sin(an)) > -.3; }).sort(function (x, y) { return x[0] - y[0]; })), "#f6dd8f", .8, op(.8));
    s += pth(chiuso(bs), rad("dn", [[0, "#fff4d6"], [.7, "#efdcae"], [1, "#c7ad78"]], .5, .62, .6), bordo(L, 1.2)) + pth(chiuso(giro(Fs, 101, .58, 64)), "none", "stroke='#c9a24a' stroke-width='1.2' opacity='.9'");
    var fi = P(0, 0, 104.5), ce = P(0, 0, 101);
    s += tratto(linea(ce, fi), "#b5862a", .9) + cer(fi[0], fi[1], 1.5, nuovaR(OTTONE, .35, .3, .8), bordo(L, .6));   // il pomolo in cima
    return s;
  });

  // =========================================================
  //  TAPPETO PERSIANO (a terra, 300 × 200): il campo rosso pieno di fiorellini, il medaglione blu e rubino al centro
  //  con i pendenti, gli angoli blu, le bordure a rosette e tralci, le frange sui lati corti
  // =========================================================
  def("tappeto_persiano", { tipo: "terra", nome: "Tappeto persiano", stanza: "tutte", fp: [3, 2], w: 300, h: 200, prezzo: 900 }, function () {
    var RO = "#8f2d2d", BL = "#1f4e79", OR = "#e8c27a", RU = "#c0392b", AV = "#f3e3c3", r = rnd(331), s = "", i, x, y;
    var X0 = 12, Y0 = 8, X1 = 288, Y1 = 192;
    s += rett(X0 + 1.5, Y0 + 3, X1 - X0, Y1 - Y0, 2, "#000", op(.17));   // l'ombra
    for (y = Y0 + 2.4; y < Y1 - 1.5; y += 2.6) {   // le frange
      var j1 = r() * 2.4, j2 = r() * 2.4;
      s += tratto("M" + X0 + "," + f1(y) + " L" + f1(X0 - 7 - j1) + "," + f1(y + (r() - .5) * 1.4), "#efe2c4", 1.3) + tratto("M" + X1 + "," + f1(y) + " L" + f1(X1 + 7 + j2) + "," + f1(y + (r() - .5) * 1.4), "#efe2c4", 1.3);
    }
    s += rett(X0 - 1, Y0, 2.5, Y1 - Y0, 0, "#d9c9a6") + rett(X1 - 1.5, Y0, 2.5, Y1 - Y0, 0, "#d9c9a6");
    s += rett(X0, Y0, X1 - X0, Y1 - Y0, 1.5, RO);
    function cornice(m, w, col) { return rett(X0 + m, Y0 + m, X1 - X0 - 2 * m, Y1 - Y0 - 2 * m, 0, "none", "stroke='" + col + "' stroke-width='" + w + "'"); }
    // le bordure: blu fuori coi puntini d'oro, poi la fascia avorio con le rosette e i tralci, poi il filo rosso e oro
    s += cornice(3, 5.5, BL);
    for (x = X0 + 6; x < X1 - 4; x += 5.5) s += cer(x, Y0 + 3, .9, OR) + cer(x, Y1 - 3, .9, OR);
    for (y = Y0 + 6; y < Y1 - 4; y += 5.5) s += cer(X0 + 3, y, .9, OR) + cer(X1 - 3, y, .9, OR);
    s += cornice(12.5, 13, AV) + cornice(6.3, 1.2, OR) + cornice(18.7, 1.2, OR);
    function rosetta(cx, cy, rr, c1, c2) {   // un fiore a otto petali
      var o = "", k; for (k = 0; k < 8; k++) { var an = k * Math.PI / 4; o += ell(cx + Math.cos(an) * rr * .55, cy + Math.sin(an) * rr * .55, rr * .42, rr * .22, c1, "transform='rotate(" + f1(an * 57.3) + " " + f1(cx + Math.cos(an) * rr * .55) + " " + f1(cy + Math.sin(an) * rr * .55) + ")'"); }
      return o + cer(cx, cy, rr * .32, c2) + cer(cx, cy, rr * .13, OR);
    }
    function tralcio(x0, y0, x1, y1, vert) {   // il tralcio che ondeggia nella fascia avorio, con le rosette e le foglioline
      var o = "", n = Math.round((vert ? y1 - y0 : x1 - x0) / 16), k, d = "M" + f1(x0) + "," + f1(y0);
      for (k = 0; k < n; k++) { var t0 = k / n, t1 = (k + 1) / n, s1 = k % 2 ? 1 : -1; if (vert) d += " Q" + f1(x0 + s1 * 3.4) + "," + f1(y0 + (y1 - y0) * (t0 + t1) / 2) + " " + f1(x0) + "," + f1(y0 + (y1 - y0) * t1); else d += " Q" + f1(x0 + (x1 - x0) * (t0 + t1) / 2) + "," + f1(y0 + s1 * 3.4) + " " + f1(x0 + (x1 - x0) * t1) + "," + f1(y0); }
      o += tratto(d, "#5c7a3a", .8);
      for (k = 0; k <= n; k++) { var px = vert ? x0 : x0 + (x1 - x0) * k / n, py = vert ? y0 + (y1 - y0) * k / n : y0; o += k % 2 ? rosetta(px, py, 4.6, RU, BL) : rosetta(px, py, 3.6, BL, RU); }
      return o;
    }
    s += tralcio(X0 + 20, Y0 + 12.5, X1 - 20, Y0 + 12.5) + tralcio(X0 + 20, Y1 - 12.5, X1 - 20, Y1 - 12.5) + tralcio(X0 + 12.5, Y0 + 22, X0 + 12.5, Y1 - 22, true) + tralcio(X1 - 12.5, Y0 + 22, X1 - 12.5, Y1 - 22, true);
    [[X0 + 12.5, Y0 + 12.5], [X1 - 12.5, Y0 + 12.5], [X0 + 12.5, Y1 - 12.5], [X1 - 12.5, Y1 - 12.5]].forEach(function (v) { s += rosetta(v[0], v[1], 5.6, RU, BL); });
    // il campo: fiorellini sparsi a griglia
    var FX0 = X0 + 21, FY0 = Y0 + 21, FX1 = X1 - 21, FY1 = Y1 - 21, cx = 150, cy = 100, campo = "", rete = "";
    for (x = FX0 - 160; x < FX1; x += 22) rete += "M" + f1(x) + "," + FY0 + " l160,160 M" + f1(x + 160) + "," + FY0 + " l-160,160 ";   // il reticolo a rombi (herati), appena più scuro
    s += dentro("M" + FX0 + "," + FY0 + " H" + FX1 + " V" + FY1 + " H" + FX0 + " Z", tratto(rete, "#6e1f22", 1.1, op(.55)) + tratto(rete, OR, .35, "opacity='.35' transform='translate(.6 .6)'"));
    for (y = FY0 + 6; y < FY1 - 3; y += 11) for (x = FX0 + 6 + ((y / 11) % 2 ? 5.5 : 0); x < FX1 - 3; x += 11) {
      var dx = (x - cx) / 82, dy = (y - cy) / 54; if (dx * dx + dy * dy < 1.15) continue;
      var t = r(); campo += t < .45 ? rosetta(x, y, 2.9, OR, BL) : t < .75 ? ell(x, y, 2.7, 1.2, BL, "transform='rotate(" + f1(r() * 180) + " " + f1(x) + " " + f1(y) + ")'") + ell(x + 1.2, y - .6, 1.4, .6, "#3d7a4a", "transform='rotate(" + f1(r() * 180) + " " + f1(x) + " " + f1(y) + ")'") + cer(x, y, .8, OR) : cer(x, y, 1.6, AV) + cer(x, y, .7, RU);
    }
    s += campo;
    // gli angoli blu (quarti di medaglione) col bordo d'oro
    [[FX0, FY0, 1, 1], [FX1, FY0, -1, 1], [FX0, FY1, 1, -1], [FX1, FY1, -1, -1]].forEach(function (v) {
      var d = "M" + v[0] + "," + v[1] + " L" + f1(v[0] + v[2] * 46) + "," + v[1] + " Q" + f1(v[0] + v[2] * 40) + "," + f1(v[1] + v[3] * 18) + " " + f1(v[0] + v[2] * 20) + "," + f1(v[1] + v[3] * 22) + " Q" + f1(v[0] + v[2] * 12) + "," + f1(v[1] + v[3] * 26) + " " + v[0] + "," + f1(v[1] + v[3] * 32) + " Z";
      s += pth(d, BL, "stroke='" + OR + "' stroke-width='1.6'") + dentro(d, pth(d, "none", "stroke='" + AV + "' stroke-width='.7' stroke-dasharray='1.6 1.3' transform='translate(" + f1(v[0] * (1 - .86)) + " " + f1(v[1] * (1 - .86)) + ") scale(.86)'")) +
        rosetta(v[0] + v[2] * 13, v[1] + v[3] * 10, 4.6, RU, OR) + tratto("M" + f1(v[0] + v[2] * 26) + "," + f1(v[1] + v[3] * 4) + " Q" + f1(v[0] + v[2] * 22) + "," + f1(v[1] + v[3] * 14) + " " + f1(v[0] + v[2] * 6) + "," + f1(v[1] + v[3] * 20), OR, .8, op(.8)) +
        [[30, 6], [22, 11], [9, 22], [4, 26]].map(function (w) { return ell(v[0] + v[2] * w[0], v[1] + v[3] * w[1], 2.2, 1, "#3d7a4a", "transform='rotate(" + (v[2] * v[3] * -35) + " " + f1(v[0] + v[2] * w[0]) + " " + f1(v[1] + v[3] * w[1]) + ")'") + cer(v[0] + v[2] * w[0], v[1] + v[3] * w[1], .6, OR); }).join("");
    });
    // il medaglione: lobato blu col bordo di perle d'oro, dentro la stella rubino e la rosa al centro; i pendenti ai lati
    function lobato(rx, ry, lobi, k, punta) {
      var pp = [], n = 120, j; for (j = 0; j < n; j++) { var an = j / n * 6.2832, rr = 1 + k * Math.cos(lobi * an), pu = punta ? 1 + punta * Math.pow(Math.abs(Math.cos(an)), 8) : 1; pp.push([cx + Math.cos(an) * rx * rr * pu, cy + Math.sin(an) * ry * rr]); }
      return chiuso(pp);
    }
    [-1, 1].forEach(function (sg) {   // i pendenti
      var px = cx + sg * 92;
      s += pth("M" + f1(cx + sg * 78) + "," + (cy - 8) + " L" + f1(px) + "," + cy + " L" + f1(cx + sg * 78) + "," + (cy + 8) + " Z", OR) + ell(px, cy, 8, 6.4, BL, "stroke='" + OR + "' stroke-width='1.4'") + rosetta(px, cy, 4, RU, OR) + cer(px + sg * 10, cy, 2, OR);
    });
    s += pth(lobato(76, 52, 12, .06, .14), OR) + pth(lobato(72, 48.5, 12, .06, .14), BL);
    for (i = 0; i < 48; i++) { var an = i / 48 * 6.2832, rr2 = 1 + .06 * Math.cos(12 * an), pu = 1 + .14 * Math.pow(Math.abs(Math.cos(an)), 8); s += cer(cx + Math.cos(an) * 69 * rr2 * pu, cy + Math.sin(an) * 46 * rr2, 1.1, OR); }   // le perle
    for (i = 0; i < 16; i++) { var a2 = i / 16 * 6.2832; s += ell(cx + Math.cos(a2) * 52, cy + Math.sin(a2) * 33, 3.4, 1.6, AV, "transform='rotate(" + f1(a2 * 57.3 + 90) + " " + f1(cx + Math.cos(a2) * 52) + " " + f1(cy + Math.sin(a2) * 33) + ")'") + cer(cx + Math.cos(a2 + .2) * 58, cy + Math.sin(a2 + .2) * 37, 1.2, RU); }
    for (i = 0; i < 24; i++) { var a3 = i / 24 * 6.2832, lx = cx + Math.cos(a3) * 44, ly = cy + Math.sin(a3) * 30; s += ell(lx, ly, 2.4, 1, OR, "transform='rotate(" + f1(a3 * 57.3) + " " + f1(lx) + " " + f1(ly) + ")'"); }   // l'anello di foglioline d'oro
    s += pth(lobato(40, 28, 8, .16), OR) + pth(lobato(37, 25.5, 8, .16), RU) + pth(lobato(37, 25.5, 8, .16), "none", "stroke='" + AV + "' stroke-width='.8' stroke-dasharray='2 1.6'");
    for (i = 0; i < 8; i++) { var a4 = i / 8 * 6.2832 + .39; s += ell(cx + Math.cos(a4) * 25, cy + Math.sin(a4) * 17, 3, 1.3, BL, "transform='rotate(" + f1(a4 * 57.3) + " " + f1(cx + Math.cos(a4) * 25) + " " + f1(cy + Math.sin(a4) * 17) + ")'"); }
    s += rosetta(cx, cy, 15, OR, BL) + rosetta(cx, cy, 7, AV, RU);
    // il pelo: puntini chiari e scuri, e la lucentezza della lana
    for (i = 0; i < 900; i++) s += cer(X0 + r() * (X1 - X0), Y0 + r() * (Y1 - Y0), .45 + r() * .4, r() < .5 ? "#ffffff" : "#000000", op(f2(.04 + r() * .06)));
    s += rett(X0, Y0, X1 - X0, Y1 - Y0, 1.5, nuova([[0, "#fff", .12], [.5, "#fff", 0], [1, "#000", .1]], 0, 0, 1, 1));
    return s + rett(X0, Y0, X1 - X0, Y1 - Y0, 1.5, "none", bordo(L, 1.6));
  });

  // =========================================================
  function misure(d) { if (d.tipo !== "piedi" && d.tipo !== "sopra") return { w: d.w, h: d.h }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  var pacco = {
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: d.stanza || "soggiorno", w: m.w, h: m.h, fp: d.fp.slice(), prezzo: d.prezzo, qual: 2 };
      if (d.tipo === "piedi" || d.tipo === "sopra") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.piano) o.piano = d.piano;
      if (d.seduta) { o.azione = "siedi"; o.seduta = d.seduta; }
      if (d.colori) o.colori = d.colori.map(function (k) { return { id: k.id, nome: k.nome, c: k.c }; });
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "sog" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1;
      var c; try { c = d.fn(opz); } finally { G = 1; }
      var testa = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "");
      if (d.tipo !== "piedi" && d.tipo !== "sopra") return testa + c + "</svg>";
      return testa + "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  };
  if (window.SGMobiliArte) window.SGMobiliArte.aggiungi(pacco);
})();

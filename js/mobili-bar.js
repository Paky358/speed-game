/* =========================================================
   SPeeD GAME — IL BAR E LA GELATERIA VISTI DALL'ALTO (roba bella, da comprare)
   Gli stessi mobili della casa vista di lato (js/casa.js, reparto "bar"), con gli stessi nomi, prezzi e colori:
   bancone del bar, sgabello, tavolino da bistrot, macchina dei gelati, distributore di bibite, carretto dei popcorn,
   zucchero filato, frigo bar e la macchina dell'espresso (si appoggia sopra un ripiano).
   Come il bagno (js/mobili-arte.js): una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Il davanti guarda in basso a sinistra; con { dietro: true } lo stesso mobile girato (si vede la schiena).
   Con { notte: true } le cose che fanno luce sono accese; info().luce = [x, y, raggio, colore] dice da dove esce la luce.
   Si aggiungono a SGMobiliArte con aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte || !window.SGMobiliArte.aggiungi) return;

  // ---------- attrezzi (gli stessi del bagno e del soggiorno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato; NOTTE = luci accese
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function q3(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f2(x) + "," + f2(y); }
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
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function curva(pp, f) {   // una linea morbida che passa vicino ai punti (f = come scrivere i numeri)
    f = f || q; var d = "M" + f(pp[0]), i;
    for (i = 1; i < pp.length - 1; i++) d += " Q" + f(pp[i]) + " " + f([(pp[i][0] + pp[i + 1][0]) / 2, (pp[i][1] + pp[i + 1][1]) / 2]);
    return d + " L" + f(pp[pp.length - 1]);
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
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];
  var CER = [[0, "#ffffff"], [.4, "#f4f8fa"], [.78, "#d5dee4"], [1, "#adbac3"]];        // la ceramica bianca
  var FERRO = [[0, "#7a8188"], [.25, "#474d53"], [.7, "#23272b"], [1, "#0e1012"]];      // la ghisa nera
  var GOMMA = [[0, "#5a6168"], [.5, "#2b3035"], [1, "#121417"]];
  function cromo(d, w) { return tratto(d, L, w + 2.4) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.7, w * .38), "opacity='.95' transform='translate(-.4 -.5)'"); }   // un tubo cromato

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda (si disegna dopo)
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  function perVicino(l) { return l.sort(function (m, n) { return vicino(m[0], m[1]) - vicino(n[0], n[1]); }); }
  // le forme tonde in pianta: centro (ca, cb), mezza larghezza ra, mezza profondità rf davanti e rr dietro; e = 2 ovale, di più = più squadrata
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
    return pth(chiuso(pp), lin("cx", stops, b[0], 0, b[2], 0, true), bordo(L, lw || 2.4));
  }
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }
  function lucido(pp, k, alto) {   // il riflesso bianco, vicino al bordo di sinistra (da dove viene la luce)
    var b = limiti(pp), w = b[2] - b[0], h = b[3] - b[1];
    return dentro(chiuso(pp), ell(b[0] + w * .19, b[1] + h * (alto || .5), Math.max(1.6, w * .05), h * .3, "#ffffff", op(k || .7)));
  }
  function ombra(x, y, rx, ry, k) {   // l'ombra morbida a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra)
    return ell(x, y, rx, ry, rad("om", [[0, "#000", .2], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5), k ? op(k) : "");
  }
  function aTerra(c) { return "<g transform='matrix(50 25 -50 25 0 0)'>" + c + "</g>"; }
  function ombraPianta(a0, a1, b0, b1, k, pad) {   // l'ombra stesa sul pavimento sotto un mobile lungo
    pad = pad == null ? .1 : pad;
    var cu = G * (a0 + a1) / 2 + .05, cv = G * (b0 + b1) / 2 - .01;
    return aTerra("<ellipse cx='" + f2(cu) + "' cy='" + f2(cv) + "' rx='" + f2((a1 - a0) / 2 + pad) + "' ry='" + f2((b1 - b0) / 2 + pad) + "' fill='" + rad("omp", [[0, "#000", .24], [.6, "#000", .16], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>");
  }

  // ---------- i mobili squadrati (come nel bagno) ----------
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
  function pannello(c, W, H, m, r) {   // un'anta o un cassetto in rilievo: il bordo chiaro in alto a sinistra, scuro in basso a destra
    return rett(m[0], m[1], W, H, r || 1.4, lin("an" + c.slice(1), [[0, chiaro(c, .2)], [1, chiaro(c, .02)]], 0, 0, 0, 1), "stroke='" + scuro(c, .45) + "' stroke-width='.9'") +
      tratto("M" + q(m[0] + 1, m[1] + H - 1) + " L" + q(m[0] + 1, m[1] + 1) + " L" + q(m[0] + W - 1, m[1] + 1), chiaro(c, .55), .9, "opacity='.8'") +
      tratto("M" + q(m[0] + W - 1, m[1] + 1.5) + " L" + q(m[0] + W - 1, m[1] + H - 1) + " L" + q(m[0] + 1.5, m[1] + H - 1), scuro(c, .3), .9, "opacity='.7'");
  }
  function maniglia(x, y, w, h) { return rett(x + .5, y + .7, w, h, Math.min(w, h) / 2, "#000", "opacity='.22'") + rett(x, y, w, h, Math.min(w, h) / 2, lin("mn", CROMO, 0, 0, 1, 0), bordo(L, .8)); }
  function piano(O, X, Y, W, H, c) {   // un disegno piatto W × H steso su un piano qualsiasi: O = il suo angolo in alto a sinistra, X = la fine della riga di sopra, Y = la fine del lato di sinistra
    var m = [(X[0] - O[0]) / W, (X[1] - O[1]) / W, (Y[0] - O[0]) / H, (Y[1] - O[1]) / H, O[0], O[1]];
    return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>";
  }
  function specchiaSe(W, s) { return G < 0 ? "<g transform='matrix(-1 0 0 1 " + f1(W) + " 0)'>" + s + "</g>" : s; }   // i fianchi: da dietro, il davanti del mobile sta dall'altra parte
  function buio(W, H, k, su) {   // l'ombra morbida in un angolo: un rettangolo che sfuma (su = scuro in alto)
    return rett(0, 0, W, H, 0, nuova(su ? [[0, "#000", k], [1, "#000", 0]] : [[0, "#000", 0], [1, "#000", k]], 0, 0, 0, 1));
  }
  // disegnare su un piano orizzontale all'altezza z, in mattonelle (a, b): le linee restano sottili
  function inPiano(z, corpo) { return "<g transform='matrix(" + 50 * G + " " + 25 * G + " " + -50 * G + " " + 25 * G + " 0 " + f1(-z) + ")'>" + corpo + "</g>"; }
  function trattoP(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + w + "' stroke-linecap='round' vector-effect='non-scaling-stroke'" + attr(x) + "/>"; }

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

  // ---------- i pezzi tirati: una sezione tirata lungo un asse (come i cuscini del soggiorno) ----------
  // asse "a": la sezione è fatta di punti [b, z] e va da a = t0 ad a = t1; asse "b": punti [a, z], da b = t0 a b = t1.
  // o = { mat, fascia(H) = disegni sulla parte tirata, tappo(T) = disegni sul tappo che si vede, tappoCol, lw }
  function arcoS(cx, cz, rx, rz, a0, a1, n) { var o = [], i; for (i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(t), cz + rz * Math.sin(t)]); } return o; }
  function pulisci(a) { return a.filter(function (x, i) { var y = a[(i + a.length - 1) % a.length]; return Math.abs(x[0] - y[0]) > 1e-4 || Math.abs(x[1] - y[1]) > 1e-3; }); }
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
    var sg = area > 0 ? 1 : -1;
    for (i = 0; i < n; i++) {   // la normale di ogni lato della sezione, nella vista
      var e1 = prof[i], e2 = prof[(i + 1) % n], dx = e2[0] - e1[0], dz = (e2[1] - e1[1]) / 61, l = Math.sqrt(dx * dx + dz * dz) || 1, mx = sg * dz / l, mz = -sg * dx / l;
      en.push(A ? [0, G * mx, mz] : [G * mx, 0, mz]);
    }
    var voci = [], vis = [], luMax = -2, kLuce = 0;
    for (i = 0; i < n; i++) {
      var ea = en[(i + n - 1) % n], eb = en[i], va = dot(ea, VISTA) > .001, vb = dot(eb, VISTA) > .001, s = sp(capV[i]);
      if (!va && !vb) continue;
      vis.push({ k: i, s: s });
      var nm = va && vb ? norma([ea[0] + eb[0], ea[1] + eb[1], ea[2] + eb[2]]) : (va ? ea : eb), lu = dot(nm, MEZZO);
      if (lu > luMax) { luMax = lu; kLuce = i; }
      if (va && vb && dot(ea, eb) < .8) {   // uno spigolo vivo: due colori nello stesso punto
        var prima = sp(capV[(i + n - 1) % n]) < s;
        voci.push({ s: s, c: [tinta(c, prima ? ea : eb, m), tinta(c, prima ? eb : ea, m)] });
      } else voci.push({ s: s, c: [tinta(c, nm, m)] });
    }
    voci.sort(function (x, y) { return x.s - y.s; }); vis.sort(function (x, y) { return x.s - y.s; });
    var smin = 1e9, smax = -1e9; sil.forEach(function (w) { var v = sp(w); if (v < smin) smin = v; if (v > smax) smax = v; });
    var st = []; voci.forEach(function (v) { v.c.forEach(function (cc) { st.push([f2(Math.max(0, Math.min(1, (v.s - smin) / (smax - smin || 1)))), cc]); }); });
    if (!st.length) st = [[0, c], [1, c]];
    var r = pth(dSil, nuova(st, nn[0] * smin, nn[1] * smin, nn[0] * smax, nn[1] * smax, true));
    var xs = prof.map(function (x) { return x[0]; }), zs = prof.map(function (x) { return x[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
    var H = {   // gli aiuti per decorare
      p3: p3, sil: sil, capV: capV, kLuce: kLuce,
      lungo: function (k, ta, tb) { return [p3(prof[k], ta == null ? t0 : ta), p3(prof[k], tb == null ? t1 : tb)]; },
      luccica: function (k, a, b) {   // la riga di luce lucida lungo il pezzo, dove la luce batte di più
        var pp = this.lungo(kLuce, t0 + (t1 - t0) * (a || .06), t0 + (t1 - t0) * (b || .94));
        return tratto(aperto(pp), "#ffffff", 1.3, op(k || .5)) + tratto(aperto(pp), "#ffffff", 3.2, op((k || .5) * .25));
      }
    };
    if (o.fascia) r += dentro(dSil, o.fascia(H));
    var ct = o.tappoCol || tinta(c, A ? [1, 0, 0] : [0, 1, 0], m);   // il tappo che si vede: piatto
    r += pth(dCap, nuova([[0, chiaro(ct, .07)], [1, scuro(ct, .1)]], 0, 0, 0, 1));
    if (o.tappo) {
      var T;
      if (A) T = { O: P(tv, G > 0 ? x1 : x0, z1), X: P(tv, G > 0 ? x0 : x1, z1), Y: P(tv, G > 0 ? x1 : x0, z0), W: (x1 - x0) * 61, H: z1 - z0, x: function (b) { return (G > 0 ? x1 - b : b - x0) * 61; } };
      else T = { O: P(G > 0 ? x0 : x1, tv, z1), X: P(G > 0 ? x1 : x0, tv, z1), Y: P(G > 0 ? x0 : x1, tv, z0), W: (x1 - x0) * 61, H: z1 - z0, x: function (a) { return (G > 0 ? a - x0 : x1 - a) * 61; } };
      T.y = function (z) { return z1 - z; };
      T.su = function (cont) { return piano(T.O, T.X, T.Y, T.W, T.H, cont); };
      r += dentro(dCap, o.tappo(T));
    }
    r += pth(dCap, "none", "stroke='" + L + "' stroke-width='1.1' stroke-linejoin='round' opacity='.7'");
    return r + pth(dSil, "none", bordo(L, o.lw || 2.3));
  }

  // ---------- i pezzi torniti (colonne, tazzine, barattoli, coni): prof = [[z, raggio in mattonelle], ...] dal basso in alto ----------
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
    var o = pth(dTornito(a, b, prof), lin("tn", stops, c[0] - rm, 0, c[0] + rm, 0, true), bordo(L, lw || 1.4));
    (anelli || []).forEach(function (k) { var rx = prof[k][1] * 70.71, y = c[1] - prof[k][0]; o += pth("M" + q(c[0] - rx, y) + " A" + f1(rx) + "," + f1(rx / 2) + " 0 0,0 " + q(c[0] + rx, y), "none", "stroke='" + L + "' stroke-width='.6' opacity='.5'"); });
    if (luce) o += tratto("M" + prof.slice(1, n - 1).map(function (x) { return q(c[0] - x[1] * 70.71 * .5, c[1] - x[0]); }).join(" L"), "#ffffff", luce, "opacity='.45'");
    return o;
  }
  // un anello orizzontale (poggiapiedi): la metà lontana o quella vicina, come un tubo cromato
  function anello(a, b, z, R, w, vicina) {
    var c = P(a, b, z), rx = R * 70.71, ry = R * 35.36, pp = [], i;
    for (i = 0; i <= 28; i++) { var t = (vicina ? 0 : Math.PI) + Math.PI * i / 28; pp.push([c[0] + rx * Math.cos(t), c[1] + ry * Math.sin(t)]); }
    return cromo(aperto(pp), w);
  }
  // una ruota nel piano verticale b fisso (gira lungo a): R = raggio in unità, sp = spessore verso il carretto
  function ruota(a, b, zc, R, sp, cerchio) {
    var n = 40, fuori = [], dentroR = [], i, verso = b > 0 ? -1 : 1;
    for (i = 0; i < n; i++) { var t = i / n * 6.2832, x = a + Math.cos(t) * R / 61, z = zc + Math.sin(t) * R; fuori.push(P(x, b, z)); dentroR.push(P(x, b + verso * sp, z)); }
    var vista = vicino(a, b) >= vicino(a, b + verso * sp) ? b : b + verso * sp;   // la faccia che guarda chi guarda
    function pt(k, t) { return P(a + Math.cos(t) * R * k / 61, vista, zc + Math.sin(t) * R * k); }
    var o = pth(chiuso(inviluppo(fuori.concat(dentroR))), lin("rg", GOMMA, 0, 0, 1, 0), bordo(L, 1.3));   // il copertone
    var fac = [], cc = [], k;
    for (i = 0; i < n; i++) { fac.push(pt(1, i / n * 6.2832)); cc.push(pt(.68, i / n * 6.2832)); }
    o += pth(chiuso(fac), lin("rf", [[0, "#4a5056"], [1, "#16191c"]], 0, 0, 1, 1), "stroke='" + L + "' stroke-width='1'");
    o += pth(chiuso(cc), lin("rc" + cerchio.slice(1), [[0, chiaro(cerchio, .5)], [.5, cerchio], [1, scuro(cerchio, .35)]], 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.8'");
    for (k = 0; k < 8; k++) { var t2 = k / 8 * 6.2832 + .2; o += tratto(linea(pt(.16, t2), pt(.64, t2)), scuro(cerchio, .45), .9); }   // i raggi
    var hub = []; for (i = 0; i < 16; i++) hub.push(pt(.2, i / 16 * 6.2832));
    o += pth(chiuso(hub), lin("rh", CROMO, 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.7'");
    return o + tratto(aperto(fac.slice(Math.round(n * .55), Math.round(n * .8))), "#ffffff", .7, op(.35));   // la luce sul copertone
  }
  function cifre(x, y, n, c, h) {   // le cifre di un display: rettangolini accesi (da lontano sembrano numeri)
    var o = "", w = h * .56, i;
    for (i = 0; i < n; i++) { var x0 = x + i * (w + h * .34); o += rett(x0, y, w, h, .2, "none", "stroke='" + c + "' stroke-width='" + f1(Math.max(.3, h * .17)) + "'") + rett(x0, y + h / 2 - h * .08, w, h * .16, 0, c); }
    return o;
  }
  function viti(W, H, m, c, x0, y0) { x0 = x0 || 0; y0 = y0 || 0; return [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].map(function (v) { return cer(x0 + v[0], y0 + v[1], .8, c || "#6f7a83"); }).join(""); }
  function bagliore(W, H, x, y, w, h, c) {   // di notte: la luce che esce dalla vetrina e si allarga sulla faccia (ritagliata sulla faccia)
    return dentro("M0,0 H" + f1(W) + " V" + f1(H) + " H0 Z", [[8, .1], [5, .16], [2.6, .26]].map(function (v) { return rett(x, y, w, h, 2.4 + v[0] / 2, "none", "stroke='" + c + "' stroke-width='" + v[0] + "' opacity='" + v[1] + "'"); }).join(""));
  }
  function feritoie(x, y, w, n, dy, c) { var o = "", i; for (i = 0; i < n; i++) o += rett(x, y + i * dy, w, dy * .45, dy * .22, c || "#1b1e21") + rett(x, y + i * dy + dy * .45, w, .5, 0, "#ffffff", op(.25)); return o; }   // le fessure per l'aria

  // ---------- le bibite disegnate di fronte (nel frigo bar e nel distributore): x = il centro, y = la base ----------
  function vivo(c) { return NOTTE ? chiaro(c, .12) : c; }
  function lattina(x, y, w, h, c) {
    c = vivo(c);
    var o = rett(x - w / 2, y - h, w, h, w * .2, lin("lt" + c.slice(1), [[0, chiaro(c, .4)], [.35, c], [1, scuro(c, .38)]], 0, 0, 1, 0), "stroke='" + scuro(c, .55) + "' stroke-width='.45'");
    o += rett(x - w / 2 + .2, y - h, w - .4, h * .15, w * .18, lin("lc", [[0, "#ffffff"], [.5, "#ced4da"], [1, "#868e96"]], 0, 0, 1, 0));   // il coperchio d'alluminio
    o += rett(x - w / 2, y - h * .6, w, h * .2, 0, "#ffffff", op(.8));   // la fascia bianca
    return o + rett(x - w * .3, y - h * .82, w * .14, h * .66, w * .07, "#ffffff", op(.6));   // il riflesso
  }
  function bottiglia(x, y, w, h, c, tappo) {
    c = vivo(c);
    var col = h * .34, d = "M" + q(x - w / 2, y) + " L" + q(x - w / 2, y - h + col + w * .35) + " Q" + q(x - w / 2, y - h + col) + " " + q(x - w * .2, y - h + col * .7) +
      " L" + q(x - w * .2, y - h) + " L" + q(x + w * .2, y - h) + " L" + q(x + w * .2, y - h + col * .7) + " Q" + q(x + w / 2, y - h + col) + " " + q(x + w / 2, y - h + col + w * .35) + " L" + q(x + w / 2, y) + " Z";
    var o = pth(d, lin("bt" + c.slice(1), [[0, chiaro(c, .35)], [.4, c], [1, scuro(c, .42)]], 0, 0, 1, 0), "stroke='" + scuro(c, .6) + "' stroke-width='.45'");
    o += rett(x - w / 2, y - h * .52, w, h * .24, 0, "#fff8e6", op(.92)) + rett(x - w / 2, y - h * .52, w, h * .05, 0, scuro(c, .2), op(.5));   // l'etichetta
    o += rett(x - w * .22 - .1, y - h - .5, w * .44 + .2, 1.1, .3, tappo || "#fab005", "stroke='" + L + "' stroke-width='.3'");   // il tappo
    return o + rett(x - w * .32, y - h * .62, w * .14, h * .5, w * .07, "#ffffff", op(.55));
  }
  function brick(x, y, w, h, c) {   // il succo di frutta, con la cannuccia
    c = vivo(c);
    var o = rett(x - w / 2, y - h, w, h, .4, lin("br" + c.slice(1), [[0, chiaro(c, .3)], [.5, c], [1, scuro(c, .3)]], 0, 0, 1, 0), "stroke='" + scuro(c, .55) + "' stroke-width='.45'");
    o += rett(x - w / 2, y - h, w, h * .22, .3, "#ffffff", op(.85)) + cer(x, y - h * .48, w * .24, "#ffffff", op(.85)) + cer(x, y - h * .48, w * .13, chiaro(c, .2));
    return o + tratto("M" + q(x + w * .18, y - h) + " L" + q(x + w * .26, y - h - 2.2) + " L" + q(x + w * .5, y - h - 2.6), "#ffffff", .7);
  }
  function molla(x0, x1, y) {   // la spirale del distributore, davanti alle bibite
    var d = "M" + q(x0, y), x = x0;
    while (x < x1 - .5) { d += " Q" + q(x + .35, y - 1.6) + " " + q(x + .7, y) + " Q" + q(x + 1.05, y + .5) + " " + q(x + 1.4, y); x += 1.4; }
    return tratto(d, "#5c6770", 1, op(.9)) + tratto(d, "#e9ecef", .45, "transform='translate(-.15 -.25)'");
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }
  function colore(lista, o) { var id = o && o.col, i; for (i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i].c; return lista[0].c; }

  // =========================================================
  //  SGABELLO DA BAR: il cuscino tondo di similpelle lucida col bordino e la cucitura, l'anello cromato sotto,
  //  la colonna cromata, l'anello poggiapiedi coi raggi e la base a cupola. Uguale da tutti i lati.
  // =========================================================
  var COL_SGABELLO = [{ id: "rosso", nome: "rosso", c: "#e03131" }, { id: "nero", nome: "nero", c: "#343a40" }, { id: "menta", nome: "menta", c: "#38d9a9" }, { id: "giallo", nome: "giallo", c: "#fcc419" }];
  def("sgabello_bar", { tipo: "piedi", nome: "Sgabello da bar", fp: [1, 1], box: [-16, -55, 22, 12], azione: "siedi", seduta: 47, prezzo: 450, colori: COL_SGABELLO }, function (o) {
    var c = colore(COL_SGABELLO, o), s = ombra(3, 2.6, 19, 8.6), ZA = 17, i;
    // la base: il disco di gomma e la cupola cromata
    var B = forma(0, 0, .165);
    s += corpo([giro(B, 0, 1, 48), giro(B, 1.3, 1, 48)], GOMMA, 1.4);
    var cup = [giro(B, 1.3, .98, 48), giro(B, 2.5, .96, 48), giro(B, 3.5, .8, 48), giro(B, 4.2, .52, 48), giro(B, 4.5, .28, 48)];
    s += corpo(cup, CROMO, 1.4);
    var cb = P(0, 0, 3.6);
    s += pth("M" + q(cb[0] - 9.5, cb[1] + 1.4) + " Q" + q(cb[0] - 6, cb[1] - 2.6) + " " + q(cb[0] + 1, cb[1] - 2.8), "none", "stroke='#ffffff' stroke-width='1.1' stroke-linecap='round' opacity='.85'");
    // l'anello poggiapiedi coi quattro raggi: la metà lontana, la colonna, la metà vicina
    var raggi = [0, 1, 2, 3].map(function (k) { var t = .7854 + k * 1.5708; return [Math.cos(t), Math.sin(t)]; });
    function raggio(v) { return cromo(linea(P(v[0] * .024, v[1] * .024, ZA), P(v[0] * .125, v[1] * .125, ZA)), 1.1); }
    s += anello(0, 0, ZA, .125, 1.7, false);
    raggi.forEach(function (v) { if (vicino(v[0], v[1]) < 0) s += raggio(v); });
    s += tornito(0, 0, [[4.4, .036], [5.6, .028], [38.8, .028], [40, .036]], CROMO, 1.1, [1, 2], 1);   // la colonna
    raggi.forEach(function (v) { if (vicino(v[0], v[1]) >= 0) s += raggio(v); });
    s += anello(0, 0, ZA, .125, 1.7, true);
    // sotto il sedile: il piattello che gira e l'anello cromato
    s += corpo([giro(forma(0, 0, .085), 39.4, 1, 36), giro(forma(0, 0, .085), 41, 1, 36)], GOMMA, 1.1);
    var S = forma(0, 0, .19);
    s += corpo([giro(S, 40.6, .9, 64), giro(S, 42.2, .96, 64)], CROMO, 1.3);
    // il cuscino: il fianco imbottito e il sopra lucido
    var lv = [giro(S, 42, .97, 64), giro(S, 43.9, 1.02, 64), giro(S, 45.8, 1, 64)];
    s += corpo(lv, [[0, chiaro(c, .22)], [.4, c], [1, scuro(c, .42)]], 1.6);
    var top = giro(S, 46.4, .985, 64);
    s += pth(chiuso(top), rad("st", [[0, chiaro(c, .42)], [.5, chiaro(c, .08)], [1, scuro(c, .2)]], .38, .3, .8), bordo(L, 1.4));
    s += tratto(chiuso(giro(S, 46.4, .93, 64)), scuro(c, .3), .8, op(.55));   // il bordino
    s += tratto(chiuso(giro(S, 46.6, .66, 48)), chiaro(c, .55), .6, "stroke-dasharray='1.3 1' opacity='.85'");   // la cucitura tonda
    var hl = []; for (i = 0; i <= 14; i++) { var t = Math.PI * (.82 + .42 * i / 14); hl.push(P(Math.cos(t) * .15, Math.sin(t) * .15, 46.6)); }
    s += tratto(aperto(hl), "#ffffff", 1.3, op(.85)) + ell(P(-.06, -.04, 46.6)[0], P(-.06, -.04, 46.6)[1], 3.2, 1.3, "#ffffff", op(.4));   // il lucido della similpelle
    var fl = []; for (i = 0; i <= 12; i++) { var t2 = Math.PI * (.75 + .5 * i / 12); fl.push(P(Math.cos(t2) * .19, Math.sin(t2) * .19, 44.2)); }
    return s + tratto(aperto(fl), "#ffffff", .9, op(.45));   // la luce sul fianco del cuscino
  });

  // =========================================================
  //  TAVOLINO DA BISTROT: il piano di marmo bianco con le venature e il bordo d'ottone,
  //  la colonna di ghisa tornita e la base a cupola. Uguale da tutti i lati.
  // =========================================================
  def("tavolino_bistrot", { tipo: "piedi", nome: "Tavolino da bistrot", fp: [1, 1], box: [-23, -58, 31, 16], piano: 45, prezzo: 500 }, function () {
    var s = ombra(4, 3, 27, 12), r = rnd(613), k, j, ZT = 45;
    // la base di ghisa a cupola, col gradino
    var B = forma(0, 0, .2), lb = [giro(B, 0, 1, 48), giro(B, 1.4, 1, 48), giro(B, 1.9, .9, 48), giro(B, 3, .78, 48), giro(B, 4, .56, 48), giro(B, 4.6, .36, 48)];
    s += corpo(lb, FERRO, 1.5) + lucido(sagoma(lb), .3, .35);
    var gb = giro(B, 1.9, .9, 48); s += tratto(aperto(gb.slice(20, 34)), "#a3aab1", .8, op(.7)) + tratto(aperto(giro(B, 4, .56, 48).slice(20, 32)), "#a3aab1", .7, op(.6));
    // la colonna tornita: il piede a vaso, gli anelli, il fusto col nodo in mezzo, il collarino e la crociera sotto il piano
    s += tornito(0, 0, [[4.4, .07], [5.6, .066], [6.8, .054], [8.4, .038], [9.6, .05], [10.6, .038], [12.4, .03], [23.4, .028], [24.4, .044], [25.4, .044], [26.4, .028], [37.4, .027], [38.2, .04], [39.2, .04], [40, .028], [41.4, .055], [42.8, .095]], FERRO, 1.2, [1, 4, 8, 9, 12, 13], 1.1);
    // il piano: il bordo d'ottone, poi il marmo di Carrara
    var T = forma(0, 0, .3);
    s += corpo([giro(T, 42.2, 1, 72), giro(T, ZT, 1, 72)], [[0, "#fff3bf"], [.3, "#f0c75e"], [.7, "#b8892b"], [1, "#7a5a1a"]], 1.6);   // il bordo d'ottone
    var top = giro(T, ZT, .975, 72), vene = "";
    for (k = 0; k < 5; k++) vene += "<ellipse cx='" + f2(-.2 + r() * .4) + "' cy='" + f2(-.2 + r() * .4) + "' rx='" + f2(.06 + r() * .08) + "' ry='" + f2(.04 + r() * .05) + "' fill='#aeb6bd' opacity='.09'/>";   // le nuvolette grigie del marmo
    for (k = 0; k < 5; k++) {   // le venature grigie, morbide e lunghe (in mattonelle, sul piano), con l'alone sfumato
      var princ = k < 2, x = -.36 + r() * .1, y = -.3 + r() * .6, ang = -.3 + r() * .45, pp = [[x, y]];
      if (!princ) { x = -.2 + r() * .4; y = -.2 + r() * .4; pp = [[x, y]]; ang = r() * 6.28; }
      for (j = 0; j < (princ ? 12 : 4); j++) { x += .06 * Math.cos(ang); y += .06 * Math.sin(ang); ang += (r() - .5) * .6; pp.push([x, y]); }
      var dv = curva(pp, q3);
      vene += princ ? trattoP(dv, "#e3e7ea", 3.4, op(.5)) + trattoP(dv, "#ccd2d7", 1.3, op(.5)) + trattoP(dv, "#a9b1b8", .45, op(.6)) : trattoP(dv, "#d3d8dc", .8, op(.45)) + trattoP(dv, "#b4bcc2", .3, op(.5));
    }
    s += pth(chiuso(top), lin("mr", [[0, "#ffffff"], [.5, "#f3f1ec"], [1, "#dcdad4"]], 0, 0, 1, 1), bordo(L, 1.3));   // il piano è piatto: la luce lo sfuma appena da sinistra a destra
    var tb = limiti(top);
    s += dentro(chiuso(top), inPiano(ZT, vene) + poly([[tb[0] + 9, tb[1]], [tb[0] + 15, tb[1]], [tb[0] + 6, tb[3]], [tb[0], tb[3]]], "#ffffff", op(.35)) + poly([[tb[0] + 18, tb[1]], [tb[0] + 20.5, tb[1]], [tb[0] + 11.5, tb[3]], [tb[0] + 9, tb[3]]], "#ffffff", op(.22)));
    return s + tratto(aperto(top.slice(36, 52)), "#ffffff", 1, op(.8));   // il filo di luce sul bordo
  });

  // =========================================================
  //  FRIGO BAR: nero, con la porta a vetri; dentro si vede la luce e tre ripiani di bibite (bottiglie, lattine, succhi).
  //  Da dietro la lamiera con la serpentina e il cavo. Di notte la luce dentro è accesa.
  // =========================================================
  def("frigobar", { tipo: "piedi", nome: "Frigo bar con le bibite", fp: [1, 1], box: [-35, -72, 45, 21], dietro: true, piano: 53, prezzo: 1100, luce: [0, .16, 30, 65, "#d0ebff"] }, function () {
    var A0 = -.28, A1 = .28, B0 = -.36, B1 = .16, Z0 = 1.6, ZT = 53, s = ombra(8, 4, 38, 17);
    perVicino([[A0 + .03, B0 + .03], [A1 - .07, B0 + .03], [A0 + .03, B1 - .07], [A1 - .07, B1 - .07]]).forEach(function (g) { s += blocco(g[0], g[0] + .04, g[1], g[1] + .04, 0, Z0, "#2b3035", null, 1); });
    var NERO = [lin("ns", [[0, "#626a71"], [1, "#3a4046"]], 0, 0, 1, 1), lin("nl", [[0, "#3f464c"], [1, "#2a2f34"]], 0, 0, 0, 1), lin("nd", [[0, "#272b2f"], [1, "#16191c"]], 0, 0, 0, 1)];
    function porta(W, H) {
      var gx = 3, gy = 3, gw = W - 6, gh = H - 12.6, o = "", rh = (gh - 2.4) / 3, i, row;
      o += rett(.9, .9, W - 1.8, H - 10, 2, "none", "stroke='#596168' stroke-width='.7'");   // la cornice della porta
      o += rett(gx, gy, gw, gh, 1.2, lin(NOTTE ? "fn" : "fg", NOTTE ? [[0, "#ffffff"], [.55, "#f0f8ff"], [1, "#cfe6f7"]] : [[0, "#eaf2f8"], [.55, "#cfdeea"], [1, "#a8bccb"]], 0, 0, 0, 1));
      o += poly([[gx, gy], [gx + 2.2, gy + 1.8], [gx + 2.2, gy + gh - 1.8], [gx, gy + gh]], "#000", op(NOTTE ? .06 : .12)) + poly([[gx + gw, gy], [gx + gw - 2.2, gy + 1.8], [gx + gw - 2.2, gy + gh - 1.8], [gx + gw, gy + gh]], "#000", op(NOTTE ? .1 : .2));   // le pareti di dentro
      o += rett(gx + 2.4, gy + .7, gw - 4.8, 1, .5, NOTTE ? "#ffffff" : "#f4f9fd") + rett(gx + 2.4, gy + 1.7, gw - 4.8, 3, 0, "#ffffff", op(NOTTE ? .55 : .25));   // la striscia di luce in alto
      var cols = ["#e03131", "#40c057", "#fab005", "#1c7ed6"], dx = (gw - 3.6) / 4;
      for (row = 0; row < 3; row++) {
        var yb = gy + 2.4 + (row + 1) * rh - .6;
        for (i = 0; i < 4; i++) {
          var cx = gx + 1.8 + dx * (i + .5), c = cols[(row + i) % 4];
          if (row === 0) o += bottiglia(cx, yb, 3.2, rh - 2.2, c === "#fab005" ? "#8a5a1c" : c, row === 0 && i % 2 ? "#e9ecef" : "#fab005");
          else if (row === 1) o += lattina(cx, yb, 3.9, rh * .62, c);
          else o += i % 2 ? brick(cx, yb, 4.1, rh * .62, c) : bottiglia(cx, yb, 3.8, rh - 1.6, c, "#ffffff");
        }
        o += rett(gx + 1.2, yb, gw - 2.4, 1, .4, lin("rp", CROMO, 0, 0, 0, 1)) + rett(gx + 1.2, yb + 1, gw - 2.4, .6, 0, "#000", op(.18));   // il ripiano a griglia
      }
      if (NOTTE) o += rett(gx, gy, gw, gh, 1.2, lin("ln", [[0, "#ffffff", .45], [.5, "#e7f5ff", .12], [1, "#d0ebff", .3]], 0, 0, 0, 1));   // la luce che riempie
      var vetro = "M" + q(gx, gy) + " H" + f1(gx + gw) + " V" + f1(gy + gh) + " H" + f1(gx) + " Z";
      o += rett(gx, gy, gw, gh, 1.2, "#a5d8ff", op(NOTTE ? .06 : .14)) + dentro(vetro, poly([[gx + 3, gy], [gx + 9.5, gy], [gx - 2, gy + gh * .62], [gx - 8.5, gy + gh * .62]], "#ffffff", op(NOTTE ? .18 : .36)) +
        poly([[gx + 12, gy], [gx + 14, gy], [gx + 2.5, gy + gh * .62], [gx + .5, gy + gh * .62]], "#ffffff", op(NOTTE ? .12 : .26)) + poly([[gx + gw, gy + gh * .55], [gx + gw, gy + gh * .72], [gx + gw - 9, gy + gh], [gx + gw - 14, gy + gh]], "#ffffff", op(.12)));
      o += rett(gx, gy, gw, gh, 1.2, "none", "stroke='#121417' stroke-width='1.1'") + rett(gx - .6, gy - .6, gw + 1.2, gh + 1.2, 1.6, "none", "stroke='#8a939b' stroke-width='.5' opacity='.8'");
      if (NOTTE) o += bagliore(W, H, gx, gy, gw, gh, "#e7f5ff");
      [6, H - 17].forEach(function (y) { o += rett(.2, y, 1.3, 4, .4, "#5c646b"); });   // le cerniere
      var ky = H - 8.4;   // lo zoccolo con le fessure e la lucina blu
      o += rett(0, ky, W, H - ky, 0, lin("zk", [[0, "#2d3237"], [1, "#141619"]], 0, 0, 0, 1)) + rett(0, ky, W, .6, 0, "#0b0c0e") + feritoie(4, ky + 2, W - 8, 3, 1.9, "#08090a");
      return o + cer(W - 3.4, ky + 4.2, .8, NOTTE ? "#a5d8ff" : "#4dabf7") + cer(W - 3.6, ky + 4, .3, "#ffffff");
    }
    function fianco(W, H) {
      return rett(0, H - 8.4, W, 8.4, 0, "#141619", op(.85)) + poly([[W * .3, 0], [W * .44, 0], [W * .62, H - 8.4], [W * .48, H - 8.4]], "#ffffff", op(.05)) + specchiaSe(W, feritoie(W - 9, 6, 6, 5, 1.8, "#0c0e10"));
    }
    function schiena(W, H) {   // la lamiera, la serpentina nera coi fili, il compressore e il cavo
      var o = rett(0, 0, W, H, 0, lin("lm", [[0, "#4b5359"], [1, "#30363b"]], 0, 0, 0, 1)), x0 = 5, x1 = W - 5, y0 = 6, n = 11, dy = (H - 22 - y0) / n, d = "M" + f1(x0) + "," + f1(y0), i;
      for (i = 0; i < n; i++) { var y = y0 + i * dy; d += i % 2 ? " L" + f1(x0) + "," + f1(y) + " A" + f1(dy / 2) + "," + f1(dy / 2) + " 0 0,0 " + f1(x0) + "," + f1(y + dy) : " L" + f1(x1) + "," + f1(y) + " A" + f1(dy / 2) + "," + f1(dy / 2) + " 0 0,1 " + f1(x1) + "," + f1(y + dy); }
      o += tratto(d, "#000", 2.6, "opacity='.25' transform='translate(.8 1)'") + tratto(d, "#101214", 1.8) + tratto(d, "#6b747c", .5, "transform='translate(-.3 -.4)'");
      for (i = 0; i < 11; i++) { var x = x0 + 1 + i * (x1 - x0 - 2) / 10; o += tratto("M" + f1(x) + "," + f1(y0 - 2) + " L" + f1(x) + "," + f1(y0 + n * dy + 2), "#1b1f22", .45); }
      o += rett(3, H - 14, W - 6, 12, 1.4, "#1f2326", bordo(L, .8)) + ell(W * .62, H - 7.4, 6, 4.6, "#121416", bordo(L, .8)) + ell(W * .59, H - 9.4, 2.2, 1, "#ffffff", op(.22));   // il vano col compressore
      o += rett(4.5, 2.4, 10, 3.6, .6, "#e9ecef") + rett(5.4, 3.2, 5, .7, 0, "#495057") + rett(5.4, 4.4, 7.4, .5, 0, "#adb5bd");   // l'etichetta
      return o + tratto("M" + f1(W * .25) + "," + f1(H - 6) + " C" + f1(W * .2) + "," + f1(H + 1) + " " + f1(W * .12) + "," + f1(H + 3) + " " + f1(W * .04) + "," + f1(H + 3.4), "#121416", 1.4);   // il cavo
    }
    s += blocco(A0, A1, B0, B1, Z0, ZT, NERO, {
      davanti: porta, dietro: schiena, fianco: fianco,
      sopra: function (A, B, C, D) { return dentro(chiuso([A, B, C, D]), poly([[A[0] - 6, A[1] + 6], [A[0] + 10, A[1] - 4], [D[0] + 24, D[1] - 2], [D[0] + 8, D[1] + 8]], "#ffffff", op(.13))); }
    }, 2.4);
    if (G > 0) {   // la maniglia lunga, staccata dalla porta, con due perni
      var am = A1 - .045, bm = B1 + .032;
      s += tratto(linea(P(am + .02, B1, 41), P(am + .02, B1, 22)), "#000", 2.2, op(.3));
      [42, 21].forEach(function (z) { s += cromo(linea(P(am, B1, z), P(am, bm, z)), 1.6); });
      s += cromo(linea(P(am, bm, 43), P(am, bm, 20)), 2.4);
    }
    return s;
  });

  // =========================================================
  //  DISTRIBUTORE DI BIBITE: rosso lucido, la vetrina illuminata con cinque file di bibite sulle spirali, il pannello nero
  //  col display, i tasti, le monete e le banconote; giù lo sportello dove cade la bibita. Da dietro le griglie e il cavo.
  // =========================================================
  def("distributore_bibite", { tipo: "piedi", nome: "Distributore di bibite", fp: [1, 1], box: [-44, -130, 50, 25], dietro: true, prezzo: 2800, luce: [-.1, .24, 68, 100, "#e3f4ff"] }, function () {
    var A0 = -.38, A1 = .38, B0 = -.44, B1 = .24, Z0 = 2, ZT = 107, s = ombra(7, 5, 44, 20), r = rnd(2801);
    perVicino([[A0 + .03, B0 + .03], [A1 - .08, B0 + .03], [A0 + .03, B1 - .08], [A1 - .08, B1 - .08]]).forEach(function (g) { s += blocco(g[0], g[0] + .05, g[1], g[1] + .05, 0, Z0, "#343a40", null, 1); });
    var RO = [lin("rs", [[0, "#ff6b6b"], [1, "#e03131"]], 0, 0, 1, 1), lin("rl", [[0, "#f03e3e"], [.5, "#e03131"], [1, "#c92a2a"]], 0, 0, 0, 1), lin("rd", [[0, "#b22222"], [1, "#871818"]], 0, 0, 0, 1)];
    function davanti(W, H) {
      var o = "", gx = 3.6, gy = 5, gw = 27.4, gh = 69, rows = 5, rh = (gh - 1.6) / rows, cols = ["#e03131", "#1c7ed6", "#40c057", "#fab005", "#f76707"], i, k;
      o += rett(.8, 2, 1.4, H - 12, .7, "#ffffff", op(.3));   // il lucido sulla lamiera
      o += rett(gx - 1.8, gy - 1.8, gw + 3.6, gh + 3.6, 2.4, lin("cf", CROMO, 0, 0, 1, 1), bordo(L, .9));   // la cornice cromata della vetrina
      o += rett(gx, gy, gw, gh, 1, lin(NOTTE ? "vn" : "vg", NOTTE ? [[0, "#ffffff"], [.5, "#f4faff"], [1, "#dbeefc"]] : [[0, "#dbe6ee"], [.5, "#c4d5e2"], [1, "#a0b6c7"]], 0, 0, 0, 1));
      o += poly([[gx + gw, gy], [gx + gw - 2.4, gy + 2], [gx + gw - 2.4, gy + gh - 2], [gx + gw, gy + gh]], "#000", op(NOTTE ? .08 : .16)) + rett(gx + 1.4, gy + .5, gw - 2.8, 1.1, .5, "#ffffff", op(NOTTE ? 1 : .8));   // la parete di destra e il neon in alto
      for (k = 0; k < rows; k++) {   // le file: lattine, bottiglie, succhi; sotto la spirale e il cartellino del prezzo
        var yb = gy + 1.6 + (k + 1) * rh - 1.8, dx = gw / 5;
        for (i = 0; i < 5; i++) {
          var cx = gx + dx * (i + .5), c = cols[(k + i) % 5];
          if (k === 1 || k === 4) o += bottiglia(cx, yb - .4, 3.3, rh - 3.4, c, k === 4 ? "#ffffff" : "#fab005");
          else if (k === 3) o += brick(cx, yb - .4, 3.8, rh * .55, c);
          else o += lattina(cx, yb - .4, 3.7, rh * .58, c);
          o += molla(cx - 2.2, cx + 2.2, yb - .3);
        }
        o += rett(gx, yb, gw, 1.8, 0, lin("lb", [[0, "#ced4da"], [1, "#868e96"]], 0, 0, 0, 1));   // il bordo del ripiano
        for (i = 0; i < 5; i++) o += rett(gx + dx * (i + .5) - 1.1, yb + .45, 2.2, .9, .2, "#ffffff") + rett(gx + dx * (i + .5) - .6, yb + .75, 1.2, .3, 0, "#495057");
      }
      if (NOTTE) o += rett(gx, gy, gw, gh, 1, lin("ln", [[0, "#ffffff", .5], [.5, "#ffffff", .1], [1, "#e3f4ff", .3]], 0, 0, 0, 1));
      var vetro = "M" + q(gx, gy) + " H" + f1(gx + gw) + " V" + f1(gy + gh) + " H" + f1(gx) + " Z";
      o += rett(gx, gy, gw, gh, 1, "#a5d8ff", op(NOTTE ? .05 : .12)) + dentro(vetro, poly([[gx + 4, gy], [gx + 12, gy], [gx - 4, gy + gh * .55], [gx - 12, gy + gh * .55]], "#ffffff", op(NOTTE ? .16 : .34)) +
        poly([[gx + 15, gy], [gx + 17.5, gy], [gx + 1.5, gy + gh * .55], [gx - 1, gy + gh * .55]], "#ffffff", op(NOTTE ? .1 : .24)) + poly([[gx + gw, gy + gh * .6], [gx + gw, gy + gh * .74], [gx + gw - 14, gy + gh], [gx + gw - 20, gy + gh]], "#ffffff", op(.13)));
      o += rett(gx, gy, gw, gh, 1, "none", "stroke='#1d2124' stroke-width='1'");
      if (NOTTE) o += bagliore(W, H, gx - 1.8, gy - 1.8, gw + 3.6, gh + 3.6, "#e3f4ff");
      // il pannello nero: il display, i tasti, le monete, le banconote, il resto
      var px = gx + gw + 3.4, pw = W - px - 2.2, pg = lin("pn", [[0, "#3d444b"], [1, "#15181b"]], 0, 0, 1, 0);
      o += rett(px, gy - 1.8, pw, gh + 3.6, 1.8, pg, bordo(L, .9)) + rett(px + .6, gy - 1.2, .8, gh + 2.4, .4, "#ffffff", op(.18));
      o += rett(px + 1.1, gy + 1.6, pw - 2.2, 6, .9, NOTTE ? "#c3fae8" : "#2b8a3e", "stroke='#0b0d0e' stroke-width='.6'") + cifre(px + 1.9, gy + 3, 3, NOTTE ? "#ffffff" : "#b2f2bb", 3.1);
      for (k = 0; k < 4; k++) for (i = 0; i < 3; i++) { var bx = px + 2 + i * (pw - 4) / 2, by = gy + 12 + k * 3; o += cer(bx + .25, by + .35, 1, "#000", op(.4)) + cer(bx, by, 1, lin("tt", [[0, "#ffffff"], [1, "#adb5bd"]], 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.35'"); }   // i tasti
      o += rett(px + 1.6, gy + 26.5, pw - 3.2, 8, 1, lin("mm", CROMO, 0, 0, 1, 1), bordo(L, .6)) + rett(px + pw / 2 - .45, gy + 27.8, .9, 5.2, .45, "#16191c");   // la fessura delle monete
      o += rett(px + 1.1, gy + 37.5, pw - 2.2, 4.4, .8, "#0b0d0e", "stroke='#5c646b' stroke-width='.4'") + rett(px + 2.2, gy + 39.4, pw - 4.4, .7, .3, NOTTE ? "#8ce99a" : "#40c057");   // le banconote
      o += rett(px + 1.8, gy + 46, pw - 3.6, 5.6, 1.4, "#0b0d0e", "stroke='#adb5bd' stroke-width='.6'") + rett(px + 2.4, gy + 46.6, pw - 4.8, 1.8, .8, "#ffffff", op(.12));   // il resto
      o += cer(px + pw / 2, gy + 58, 2.6, "#ffffff", op(.85)) + pth("M" + q(px + pw / 2 - 1.2, gy + 57) + " L" + q(px + pw / 2 + 1.2, gy + 57) + " L" + q(px + pw / 2 + .9, gy + 59.6) + " L" + q(px + pw / 2 - .9, gy + 59.6) + " Z", "#e03131") + tratto("M" + q(px + pw / 2 + .2, gy + 57) + " L" + q(px + pw / 2 + .8, gy + 55.3), "#e03131", .5);   // il bicchiere disegnato
      // lo sportello dove cade la bibita
      var sy = gy + gh + 5.2, sh = 13;
      o += rett(gx - 1.8, sy, gw + 3.6, sh, 2.2, "#16191c", bordo(L, .9)) + rett(gx, sy + 1.6, gw, sh - 3.2, 1.4, lin("sp", [[0, "#5c646b"], [.5, "#343a40"], [1, "#212529"]], 0, 0, 0, 1), "stroke='#0b0d0e' stroke-width='.6'");
      o += rett(gx + 1.4, sy + 2.2, gw - 2.8, 1, .5, "#ffffff", op(.3)) + rett(gx + gw / 2 - 4, sy + sh - 4.6, 8, 1.6, .8, lin("ms", CROMO, 0, 0, 1, 0), bordo(L, .5));
      // lo zoccolo con le fessure
      o += rett(0, H - 6.4, W, 6.4, 0, "#000", op(.25)) + feritoie(5, H - 5.2, W - 10, 2, 2.2, "#2b0d0d");
      return o + rett(0, 0, W, 1.4, 0, "#ffffff", op(.18));
    }
    function fianco(W, H) {   // il fianco: la lamiera rossa con le bollicine e il bicchiere con la cannuccia
      var o = "", rr = rnd(77), i, cx = W * .5, cy = 50;
      o += pth("M" + q(cx - 8, cy - 9) + " L" + q(cx + 8, cy - 9) + " L" + q(cx + 5.6, cy + 13) + " L" + q(cx - 5.6, cy + 13) + " Z", "#ffffff", op(.6)) + rett(cx - 9, cy - 12, 18, 3.4, 1.4, "#ffffff", op(.75)) +
        tratto("M" + q(cx + 1.2, cy - 12) + " L" + q(cx + 3.4, cy - 21) + " L" + q(cx + 8, cy - 23), "#ffffff", 1.6, op(.75)) + pth("M" + q(cx - 7.2, cy - 2) + " Q" + q(cx, cy + 1.5) + " " + q(cx + 7.2, cy - 2) + " L" + q(cx + 6.2, cy + 6) + " L" + q(cx - 6.2, cy + 6) + " Z", "#ffffff", op(.25));
      for (i = 0; i < 16; i++) { var bx = W * .15 + rr() * W * .7, by = 14 + rr() * 26, br = .8 + rr() * 2.4; o += cer(bx, by, br, "none", "stroke='#ffffff' stroke-width='.6' opacity='.55'") + cer(bx - br * .35, by - br * .35, br * .25, "#ffffff", op(.6)); }
      o += rett(0, H - 6.4, W, 6.4, 0, "#000", op(.3)) + rett(0, 0, W, 1.4, 0, "#ffffff", op(.08));
      return specchiaSe(W, o + poly([[W * .58, 0], [W * .7, 0], [W * .9, H], [W * .78, H]], "#ffffff", op(.05)));
    }
    function dietro(W, H) {   // la schiena: le griglie dell'aria, l'etichetta, le viti e il cavo
      var o = rett(3, 3, W - 6, H - 6, 1.6, "none", "stroke='#7d1515' stroke-width='.9'") + viti(W, H, 5, "#5a1010");
      o += rett(6, 8, 15, 8, .8, "#f8f9fa", bordo("#868e96", .4)) + rett(7.4, 9.6, 8, 1, 0, "#495057") + rett(7.4, 11.6, 11, .6, 0, "#adb5bd") + rett(7.4, 13.2, 7, .6, 0, "#adb5bd");
      o += rett(8, 26, W - 16, 30, 2, "#5a1010", op(.5)) + feritoie(10, 28, W - 20, 12, 2.3, "#2b0808");
      o += rett(8, H - 34, W - 16, 22, 2, "#5a1010", op(.5)) + feritoie(10, H - 32, W - 20, 8, 2.3, "#2b0808");
      return o + tratto("M" + f1(W * .78) + "," + f1(H - 8) + " C" + f1(W * .8) + "," + f1(H) + " " + f1(W * .88) + "," + f1(H + 2) + " " + f1(W * .98) + "," + f1(H + 2.2), "#16191c", 1.6) + rett(W * .74, H - 9.4, 4.6, 3, .8, "#212529");
    }
    s += blocco(A0, A1, B0, B1, Z0, ZT, RO, {
      davanti: davanti, dietro: dietro, fianco: fianco,
      sopra: function (A, B, C, D) { return dentro(chiuso([A, B, C, D]), poly([[A[0] - 8, A[1] + 8], [A[0] + 14, A[1] - 4], [D[0] + 32, D[1] - 4], [D[0] + 10, D[1] + 8]], "#ffffff", op(.2))) + tratto(chiuso([A, B, C, D].map(function (v, i) { return [v[0] + [0, -2.4, 0, 2.4][i], v[1] + [1.4, 0, -1.4, 0][i]]; })), "#871818", .8, op(.6)); }
    }, 2.5);
    return s;
  });

  // =========================================================
  //  MACCHINA DEI GELATI: la base rosa, il corpo bianco con la vetrina dei tre gusti (fragola, crema, cioccolato) accesa,
  //  le tre leve rosse sui rubinetti cromati, la vaschetta, il cappello rosa con la granella e il cono gigante in cima.
  //  Da dietro le griglie dell'aria e il cavo. Di notte la vetrina dei gusti è accesa.
  // =========================================================
  var ROSA = "#ff8fab", ROSINO = "#ffc9de", GUSTI = ["#ff8fab", "#fff3bf", "#a0652b"];
  def("macchina_gelati", { tipo: "piedi", nome: "Macchina dei gelati", fp: [1, 1], box: [-41, -115, 51, 24], dietro: true, prezzo: 3500, luce: [0, .18, 66, 60, "#ffd6e8"] }, function () {
    var A0 = -.35, A1 = .35, B0 = -.42, B1 = .18, Z1 = 11, ZC = 73, HC = 10, s = ombra(9, 4, 44, 20), r = rnd(3501);
    // la base rosa con la riga bianca
    function riga(W, H) { return rett(0, 3.4, W, 1.8, 0, "#ffffff", op(.9)) + rett(0, H - 1.2, W, 1.2, 0, "#000", op(.15)); }
    s += blocco(-.32, .32, -.39, .15, 0, Z1, ROSA, { davanti: riga, dietro: riga, fianco: riga }, 2.2);
    var BI = [lin("bs", [[0, "#ffffff"], [1, "#f1f3f5"]], 0, 0, 1, 1), lin("bl", [[0, "#ffffff"], [1, "#e9ecef"]], 0, 0, 0, 1), lin("bd", [[0, "#d7dde2"], [1, "#b5bec6"]], 0, 0, 0, 1)];
    function ricciolo(cx, yb, w, c) {   // il gelato soft a ricciolo, visto di fronte: tre giri uno sull'altro e la punta
      var o = "", k, y = yb, h = w * .3;
      for (k = 0; k < 3; k++) {
        var ww = w * [1, .76, .52][k];
        o += pth("M" + q(cx - ww / 2, y) + " Q" + q(cx - ww / 2 - .3, y - h * 1.15) + " " + q(cx, y - h * 1.15) + " Q" + q(cx + ww / 2 + .3, y - h * 1.15) + " " + q(cx + ww / 2, y) + " Z",
          lin("rc" + c.slice(1), [[0, chiaro(c, .5)], [.55, c], [1, scuro(c, .22)]], 0, 0, 1, 1), "stroke='" + scuro(c, .45) + "' stroke-width='.45'");
        o += tratto("M" + q(cx - ww * .3, y - h * .75) + " Q" + q(cx - ww * .1, y - h * 1.05) + " " + q(cx + ww * .1, y - h * .95), "#ffffff", .5, op(.75));
        y -= h * .78;
      }
      return o + tratto("M" + q(cx - .4, y + .2) + " Q" + q(cx + .2, y - 1.6) + " " + q(cx + 1.2, y - 1.4), scuro(c, .45), .9) + tratto("M" + q(cx - .4, y + .2) + " Q" + q(cx + .2, y - 1.6) + " " + q(cx + 1.2, y - 1.4), chiaro(c, .3), .45);
    }
    function davanti(W, H) {
      var o = "", fx = 3.6, fy = 2.4, fw = W - 7.2, fh = 9.8, k;
      // la vetrina dei gusti, con la cornice rosa
      o += rett(fx - 1.3, fy - 1.3, fw + 2.6, fh + 2.6, 2.6, lin("vc", [[0, "#ffb3c6"], [1, "#f06595"]], 0, 0, 0, 1), bordo(L, .9));
      o += rett(fx, fy, fw, fh, 1.6, lin(NOTTE ? "wn" : "wg", NOTTE ? [[0, "#ffffff"], [1, "#ffe3ee"]] : [[0, "#fff0f6"], [1, "#fcc2d7"]], 0, 0, 0, 1));
      for (k = 0; k < 3; k++) { var cx = fx + fw * (k + .5) / 3; o += ricciolo(cx, fy + fh - .7, 8, GUSTI[k]); if (k) o += rett(fx + fw * k / 3 - .6, fy, 1.2, fh, 0, "#ffffff", op(.95)); }
      if (NOTTE) o += rett(fx, fy, fw, fh, 1.6, lin("wl", [[0, "#ffffff", .45], [1, "#ffffff", 0]], 0, 0, 0, 1)) + bagliore(W, H, fx - 1.3, fy - 1.3, fw + 2.6, fh + 2.6, "#ffd6e8");
      o += dentro("M" + q(fx, fy) + " H" + f1(fx + fw) + " V" + f1(fy + fh) + " H" + f1(fx) + " Z", poly([[fx + 4, fy], [fx + 8.5, fy], [fx + 4, fy + fh], [fx - .5, fy + fh]], "#ffffff", op(.4)) + poly([[fx + 21, fy], [fx + 23, fy], [fx + 18.5, fy + fh], [fx + 16.5, fy + fh]], "#ffffff", op(.3)));
      // la piastra cromata dei rubinetti
      var py = fy + fh + 2.2;
      o += rett(2.4, py, W - 4.8, 8.6, 1.6, lin("pc", [[0, "#ffffff"], [.45, "#dfe5e9"], [1, "#9ca8b0"]], 0, 0, 0, 1), bordo(L, .9)) + viti(W - 4.8, 8.6, 1.6, "#868e96", 2.4, py);
      // la nicchia dove si riempie il cono
      var ny = py + 9.4, nh = 40 - ny;
      o += rett(3.6, ny, W - 7.2, nh, 1.4, lin("ni", [[0, "#c8d0d6"], [.3, "#e9ecef"], [1, "#f8f9fa"]], 0, 0, 0, 1), "stroke='#adb5bd' stroke-width='.7'") + rett(3.6, ny, W - 7.2, 3, 1.4, "#000", op(.12));
      // sotto: le due antine coi pomelli
      var dy = 43.5, dh = H - dy - 2.4, w2 = (W - 7) / 2;
      o += pannello("#f8f9fa", w2, dh, [2.6, dy]) + pannello("#f8f9fa", w2, dh, [4.4 + w2, dy]) + maniglia(W / 2 - 3.6, dy + 3, 1.6, 7) + maniglia(W / 2 + 2, dy + 3, 1.6, 7);
      // il cuoricino rosa in mezzo alle ante
      var hx2 = W * .25, hy = dy + dh * .62;
      o += pth("M" + q(hx2, hy + 2) + " C" + q(hx2 - 3.4, hy - .6) + " " + q(hx2 - 1.6, hy - 3.2) + " " + q(hx2, hy - 1.4) + " C" + q(hx2 + 1.6, hy - 3.2) + " " + q(hx2 + 3.4, hy - .6) + " " + q(hx2, hy + 2) + " Z", ROSA, "stroke='" + scuro(ROSA, .4) + "' stroke-width='.4'");
      return o;
    }
    function fianco(W, H) { return rett(0, 2.6, W, 1.6, 0, ROSA, op(.9)) + specchiaSe(W, rett(W - 14, H - 22, 10, 13, 1.4, "#000", op(.08)) + feritoie(W - 13, H - 21, 8, 5, 2.3, "#5c646b")); }
    function dietro(W, H) {
      var o = rett(0, 2.6, W, 1.6, 0, ROSA, op(.9)) + rett(5, 10, W - 10, 32, 2, "#000", op(.07)) + feritoie(7, 12, W - 14, 12, 2.4, "#6c757d") + viti(W, H, 3.2, "#adb5bd");
      o += rett(6, H - 15, 13, 7, .8, "#ffffff", bordo("#adb5bd", .4)) + rett(7.2, H - 13.6, 7, .9, 0, "#495057") + rett(7.2, H - 11.8, 10, .5, 0, "#adb5bd") + rett(7.2, H - 10.4, 6, .5, 0, "#adb5bd");
      return o + tratto("M" + f1(W * .8) + "," + f1(H - 6) + " C" + f1(W * .82) + "," + f1(H + 6) + " " + f1(W * .9) + "," + f1(H + 12) + " " + f1(W + 1) + "," + f1(H + 13), "#212529", 1.5);
    }
    s += blocco(A0, A1, B0, B1, Z1, ZC, BI, { davanti: davanti, dietro: dietro, fianco: fianco }, 2.4);
    function vaschetta() {   // la vaschetta cromata con la griglia, sporgente
      return blocco(-.26, .26, B1 - .01, B1 + .085, 31.4, 33.4, [lin("vs", [[0, "#ffffff"], [1, "#ced4da"]], 0, 0, 1, 1), lin("vl", CROMO, 0, 0, 1, 0), lin("vd", [[0, "#9ca8b0"], [1, "#65717a"]], 0, 0, 0, 1)], {
        sopra: function (A, B, C, D) { var o = "", k; for (k = 1; k < 9; k++) { var t = k / 9; o += tratto(linea([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], [D[0] + (C[0] - D[0]) * t, D[1] + (C[1] - D[1]) * t]), "#6c757d", .6); } return o; }
      }, 1.4);
    }
    function erogatore(a) {   // un rubinetto: la testa cromata, il beccuccio a stella, la leva rossa col pomello
      var o = blocco(a - .045, a + .045, B1, B1 + .06, 50.6, 56.6, [lin("es", [[0, "#ffffff"], [1, "#dee2e6"]], 0, 0, 1, 1), lin("el", CROMO, 0, 0, 1, 0), lin("ed", [[0, "#9ca8b0"], [1, "#65717a"]], 0, 0, 0, 1)], null, 1.3);
      o += tornito(a, B1 + .032, [[47.2, .01], [48, .02], [49.2, .022], [50.7, .026]], CROMO, 1, [1]);
      var b0 = P(a, B1 + .03, 56.6), b1 = P(a, B1 + .11, 60.4);
      o += tratto(linea(b0, b1), L, 3.4) + tratto(linea(b0, b1), "#e03131", 2) + tratto(linea([b0[0] - .4, b0[1] - .4], [b1[0] - .4, b1[1] - .4]), "#ff8787", .6);
      return o + cer(b1[0], b1[1], 2.1, rad("pl", [[0, "#ffa8a8"], [.5, "#e03131"], [1, "#a51d1d"]], .35, .3, .75), bordo(L, .8)) + cer(b1[0] - .7, b1[1] - .7, .6, "#ffffff", op(.9));
    }
    function portaconi() {   // sul fianco: il tubo trasparente coi coni di cialda impilati e il tappo cromato
      var a = A1 + .042, b = -.04, z0 = 27, z1 = 50, o = blocco(A1, A1 + .012, b - .025, b + .025, z1 - 4, z1 - 1, "#adb5bd", null, .8) + blocco(A1, A1 + .012, b - .025, b + .025, z0 + 1, z0 + 4, "#adb5bd", null, .8), k;
      for (k = 0; k < 7; k++) { var zz = z0 + 1.2 + k * 2.9; o += tornito(a, b, [[zz, .007], [zz + 4, .029]], [[0, "#ffe0b2"], [.5, "#e8a35b"], [1, "#9c5a22"]], .6); }
      o += tornito(a, b, [[z0, .036], [z1, .036]], [[0, "#ffffff", .55], [.35, "#e7f5ff", .12], [1, "#a5d8ff", .45]], .9) + tratto(linea(P(a - .022, b, z0 + 2), P(a - .022, b, z1 - 2)), "#ffffff", .8, op(.8));
      return o + tornito(a, b, [[z1, .041], [z1 + 1.8, .041]], CROMO, .8) + tornito(a, b, [[z0 - 1.6, .041], [z0, .041]], CROMO, .8);
    }
    if (G > 0) s += vaschetta() + erogatore(-.2) + erogatore(0) + erogatore(.2) + portaconi();
    // il cappello rosa ad arco, con la granella colorata
    var prof = [], k;
    for (k = 0; k <= 18; k++) { var t = Math.PI * k / 18; prof.push([-.335 * Math.cos(t), ZC + HC * Math.sin(t)]); }
    var b0h = B0 + .015, b1h = B1 - .015, GR = ["#ffffff", "#fcc419", "#4dabf7", "#69db7c", "#e64980", "#845ef7", "#ffa94d"];
    function granella(pp, ang, c) { var w = 1.2, h = .45, ca = Math.cos(ang), sa = Math.sin(ang); return poly([[pp[0] - ca * w + sa * h, pp[1] - sa * w - ca * h], [pp[0] + ca * w + sa * h, pp[1] + sa * w - ca * h], [pp[0] + ca * w - sa * h, pp[1] + sa * w + ca * h], [pp[0] - ca * w - sa * h, pp[1] - sa * w + ca * h]], c, "stroke='" + scuro(c, .35) + "' stroke-width='.25'"); }
    s += estruso("b", prof, b0h, b1h, ROSINO, {
      mat: { lucido: .55, esp: 12 }, lw: 2.2,
      fascia: function (H) {
        var o = "", i;
        for (i = 0; i < 70; i++) {   // la granella sulla parte tonda che si vede
          var a = (r() * 2 - 1) * .32, b = b0h + .02 + r() * (b1h - b0h - .04), z = ZC + HC * Math.sqrt(Math.max(0, 1 - a * a / (.335 * .335))), na = a / (.335 * .335), nz = (z - ZC) / (HC * HC) * 61 * .02;
          if (dot(norma([G * na, 0, Math.max(.01, nz * 40)]), VISTA) < .05) continue;
          o += granella(P(a, b, z), r() * 3.14, GR[i % GR.length]);
        }
        return o + H.luccica(.55, .05, .95);
      },
      tappo: function (T) {
        var o = "", i, rr = rnd(91);
        for (i = 0; i < 16; i++) { var a = (rr() * 2 - 1) * .3, zz = ZC + 1.2 + rr() * (HC - 2.4) * Math.sqrt(Math.max(0, 1 - a * a / .1)); o += granella([T.x(a), T.y(zz)], rr() * 3.14, GR[(i + 3) % GR.length]); }
        return T.su(o + tratto("M" + f1(T.x(-.3)) + "," + f1(T.y(ZC + 1)) + " Q" + f1(T.x(0)) + "," + f1(T.y(ZC + HC * 1.6)) + " " + f1(T.x(.3)) + "," + f1(T.y(ZC + 1)), "#ffffff", .7, op(.6)));
      }
    });
    // il cono gigante in cima: la cialda a quadretti, la pallina di fragola che cola, la crema e la ciliegina
    var cb = (B0 + B1) / 2, zc0 = ZC + HC - .4, cprof = [[zc0, .007], [zc0 + 3.4, .024], [zc0 + 6.8, .04], [zc0 + 9.6, .056]], dC = dTornito(0, cb, cprof), c0 = P(0, cb, 0), qd = "";
    s += pth(dC, lin("cn", [[0, "#ffe0b2"], [.45, "#e8a35b"], [1, "#9c5a22"]], c0[0] - 4.6, 0, c0[0] + 4.6, 0, true), bordo(L, 1.1));
    for (k = -6; k <= 6; k++) { var y0 = c0[1] - zc0 - 10 + k * 2.1; qd += tratto("M" + q(c0[0] - 6, y0) + " l12,6", "#9c5a22", .5) + tratto("M" + q(c0[0] - 6, y0 + 6) + " l12,-6", "#9c5a22", .5); }
    s += dentro(dC, qd) + pth(dC, "none", bordo(L, 1.1));
    var p1 = P(0, cb, zc0 + 9.6 + 3), R1 = 4.7;
    s += pth("M" + q(p1[0] - R1, p1[1] + .7) + " A" + R1 + "," + R1 + " 0 1,1 " + q(p1[0] + R1, p1[1] + .7) + " Q" + q(p1[0] + R1 - .4, p1[1] + 3) + " " + q(p1[0] + 2.6, p1[1] + 2.6) + " Q" + q(p1[0] + 1.9, p1[1] + 5.2) + " " + q(p1[0] + .9, p1[1] + 2.8) +
      " Q" + q(p1[0] - .7, p1[1] + 3.8) + " " + q(p1[0] - 2.1, p1[1] + 2.6) + " Q" + q(p1[0] - 3, p1[1] + 4.5) + " " + q(p1[0] - 3.8, p1[1] + 2.3) + " Z", rad("pf", [[0, "#ffc9de"], [.55, "#ff8fab"], [1, "#d6336c"]], .35, .3, .8), bordo(L, 1.1));
    var p2 = [p1[0] + .2, p1[1] - 6.1], R2 = 3.7;
    s += cer(p2[0], p2[1], R2, rad("pc2", [[0, "#ffffff"], [.55, "#fff3bf"], [1, "#e9c46a"]], .35, .3, .8), bordo(L, 1.1)) + tratto("M" + q(p2[0] - 2.6, p2[1] + 1.6) + " Q" + q(p2[0], p2[1] + 3.3) + " " + q(p2[0] + 2.8, p2[1] + 1.4), "#d4a017", .5, op(.6));
    [[-2.4, .6], [1.9, -.7], [.5, 1.9], [-1.2, -1.9], [2.8, 1.4], [-.2, -.4]].forEach(function (v, i) { s += granella([p1[0] + v[0], p1[1] + v[1] - .4], i * .9, GR[(i + 1) % GR.length]); });
    s += ell(p1[0] - 1.9, p1[1] - 1.9, 1.4, .8, "#ffffff", op(.75)) + ell(p2[0] - 1.3, p2[1] - 1.4, 1, .6, "#ffffff", op(.9));
    var pc = [p2[0] + .3, p2[1] - 4.3];
    return s + tratto("M" + q(pc[0], pc[1] - 1) + " Q" + q(pc[0] + .7, pc[1] - 3.8) + " " + q(pc[0] + 2.5, pc[1] - 4.5), "#2b8a3e", .8) + cer(pc[0], pc[1], 1.8, rad("ci", [[0, "#ff8787"], [.6, "#e03131"], [1, "#a51d1d"]], .35, .3, .8), bordo(L, .6)) + cer(pc[0] - .6, pc[1] - .6, .5, "#ffffff");
  });

  // =========================================================
  //  CARRETTO DEI POPCORN: il carretto rosso col filo d'oro, il pannello col cartoccio a righe, le quattro ruote coi raggi,
  //  la vetrina coi popcorn e il pentolino appeso, il tettuccio a righe bianche e rosse con la frangia a festoni.
  //  Da dietro gli sportelli scorrevoli e l'anta del carretto. Di notte la lampada scalda la vetrina.
  // =========================================================
  def("popcorn", { tipo: "piedi", nome: "Carretto dei popcorn", fp: [1, 1], box: [-36, -88, 43, 22], dietro: true, prezzo: 1600, luce: [0, -.08, 56, 70, "#ffd76a"] }, function () {
    var A0 = -.28, A1 = .28, B0 = -.34, B1 = .12, ZC0 = 13, ZC1 = 41, ZV = 68, ZT = 75, s = ombra(7, 5, 37, 17), r = rnd(1601), RO = "#e03131", ORO = "#ffd43b";
    var dav = G > 0 ? B1 : B0, die = G > 0 ? B0 : B1;   // nella vista: il lato vicino e quello lontano
    function ruote(b) { return ruota(-.17, b, 7.4, 5.6, .035, "#f1f3f5") + ruota(.17, b, 7.4, 5.6, .035, "#f1f3f5"); }
    function maniglione() {   // il maniglione per spingere, sul fianco destro
      var o = "", ma = A1 + .1;
      [-.22, -.02].forEach(function (b) { o += cromo(linea(P(A1, b, 34), P(ma, b, 34)), 1.6); });
      o += cromo(linea(P(ma, -.25, 34), P(ma, .01, 34)), 2.2);
      var g0 = P(ma, -.18, 34), g1 = P(ma, -.06, 34);
      return o + tratto(linea(g0, g1), L, 4.6) + tratto(linea(g0, g1), "#212529", 3) + tratto(linea([g0[0] - .4, g0[1] - .6], [g1[0] - .4, g1[1] - .6]), "#6c757d", .7);
    }
    s += ruote(die - (G > 0 ? .012 : -.012));
    if (G < 0) s += maniglione();
    function cartoccio(W, H) {   // il pannello bianco col cartoccio a righe e i popcorn
      var o = rett(1.6, 1.6, W - 3.2, H - 3.2, 1.6, "none", "stroke='" + ORO + "' stroke-width='.8'"), px = 4.6, py = 4.4, pw = W - 9.2, ph = H - 8.8;
      o += rett(px, py, pw, ph, 1.8, lin("pp", [[0, "#fffdf3"], [1, "#fff3bf"]], 0, 0, 0, 1), bordo(L, .8)) + rett(px + 1, py + 1, pw - 2, ph - 2, 1.2, "none", "stroke='" + RO + "' stroke-width='.5' stroke-dasharray='1.6 1'");
      var cx = W / 2, yt = py + ph * .42, yb = py + ph - 2.2, w1 = 6.6, w0 = 4.6, i, rr = rnd(5);
      for (i = 0; i < 9; i++) { var a = rr() * 6.28, d = rr() * 4.6; o += cer(cx + Math.cos(a) * d, yt - 1.2 - Math.abs(Math.sin(a)) * 2.4, 1.4 + rr() * .5, i % 3 ? "#fff3bf" : "#ffe066", "stroke='#c99a36' stroke-width='.35'"); }   // i popcorn che escono
      o += pth("M" + q(cx - w1, yt) + " L" + q(cx + w1, yt) + " L" + q(cx + w0, yb) + " L" + q(cx - w0, yb) + " Z", "#ffffff", bordo(L, .7));
      for (i = 0; i < 4; i++) { var t0 = (i * 2 + .5) / 8, t1 = (i * 2 + 1.5) / 8; o += poly([[cx - w1 + 2 * w1 * t0, yt], [cx - w1 + 2 * w1 * t1, yt], [cx - w0 + 2 * w0 * t1, yb], [cx - w0 + 2 * w0 * t0, yb]], RO); }
      o += pth("M" + q(cx - w1, yt) + " L" + q(cx + w1, yt) + " L" + q(cx + w0, yb) + " L" + q(cx - w0, yb) + " Z", "none", bordo(L, .7));
      return o + [[2.6, 2.6], [W - 2.6, 2.6], [2.6, H - 2.6], [W - 2.6, H - 2.6]].map(function (v) { return cer(v[0], v[1], .75, ORO, "stroke='#a8781a' stroke-width='.3'"); }).join("");
    }
    function filo(W, H) { return rett(1.6, 1.6, W - 3.2, H - 3.2, 1.6, "none", "stroke='" + ORO + "' stroke-width='.8'") + cer(W / 2, H / 2, 3.4, "none", "stroke='" + ORO + "' stroke-width='.7'") + cer(W / 2, H / 2, 1.2, ORO); }
    function anta(W, H) { return filo(W, H) + pannello("#d63030", W - 9, H - 9, [4.5, 4.5]) + cer(W - 7.4, H / 2, 1, lin("po", [[0, "#fff1b8"], [1, "#a8781a"]], 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.4'"); }
    s += blocco(A0, A1, B0, B1, ZC0, ZC1, RO, { davanti: cartoccio, dietro: anta, fianco: filo }, 2.3);
    // la vetrina: il fondo, i montanti lontani, i vetri lontani, i popcorn, il pentolino, i vetri vicini, i montanti vicini
    var e = .018, ca = A0 + e, cA = A1 - e, cbb = B0 + e, cB = B1 - e;
    function montante(a, b) { return blocco(a - .017, a + .017, b - .017, b + .017, ZC1, ZV, RO, null, 1.2); }
    function vetroB(b, k) { return poly([P(ca, b, ZC1), P(cA, b, ZC1), P(cA, b, ZV), P(ca, b, ZV)], "#e7f5ff", op(k)); }
    function vetroA(a, k) { return poly([P(a, cbb, ZC1), P(a, cB, ZC1), P(a, cB, ZV), P(a, cbb, ZV)], "#e7f5ff", op(k)); }
    var fondo = [P(ca, cbb, ZC1 + .2), P(cA, cbb, ZC1 + .2), P(cA, cB, ZC1 + .2), P(ca, cB, ZC1 + .2)];
    s += poly(fondo, "#495057", bordo(L, .8));
    var lontani = [[ca, cbb], [cA, cbb], [ca, cB], [cA, cB]].sort(function (m, n) { return vicino(m[0], m[1]) - vicino(n[0], n[1]); });
    s += montante(lontani[0][0], lontani[0][1]);
    s += vetroB(die === B0 ? cbb : cB, .22) + vetroA(G > 0 ? ca : cA, .18);
    // i popcorn: il mucchio (la sagoma piena) e i chicchi sopra, dal più lontano al più vicino
    function alto(a, b) { var u = a / .24, v = (b + .11) / .2; return ZC1 + 2.6 + 5.2 * Math.max(0, 1 - .55 * (u * u + v * v)); }
    var mucchio = [], i;
    for (i = 0; i <= 24; i++) { var t = i / 24; mucchio.push(P(ca + (cA - ca) * t, cbb, ZC1), P(ca + (cA - ca) * t, cB, ZC1), P(ca + (cA - ca) * t, cbb + .01, alto(ca + (cA - ca) * t, cbb)), P(ca + (cA - ca) * t, cB - .01, alto(ca + (cA - ca) * t, cB))); }
    for (i = 0; i <= 12; i++) { var tb = cbb + (cB - cbb) * i / 12; mucchio.push(P(ca, tb, alto(ca, tb)), P(cA, tb, alto(cA, tb)), P(0, tb, alto(0, tb))); }
    var dm = chiuso(inviluppo(mucchio));
    s += pth(dm, lin("mu", [[0, "#fff3bf"], [.6, "#ffe8a3"], [1, "#e9c46a"]], 0, 0, 0, 1));
    var chicchi = [];
    for (i = 0; i < 95; i++) {
      var a = ca + .02 + r() * (cA - ca - .04), b = cbb + .02 + r() * (cB - cbb - .04), zz = ZC1 + r() * (alto(a, b) - ZC1);
      if (r() < .55) zz = alto(a, b) - r() * 1.2;
      chicchi.push([vicino(a, b) + zz * .002, a, b, zz]);
    }
    chicchi.sort(function (m, n) { return m[0] - n[0]; });
    var ch = "";
    chicchi.forEach(function (c, k) {
      var pp = P(c[1], c[2], c[3]), rr = .95 + (k % 3) * .2;
      ch += cer(pp[0] - rr * .6, pp[1] + .2, rr, "#fff8dc", "stroke='#d4a95a' stroke-width='.3'") + cer(pp[0] + rr * .6, pp[1] + .1, rr * .9, "#fff3bf", "stroke='#d4a95a' stroke-width='.3'") + cer(pp[0], pp[1] - rr * .6, rr * .95, "#ffffff", "stroke='#d4a95a' stroke-width='.3'");
      if (k % 4 === 0) ch += cer(pp[0] + .2, pp[1] + .3, .35, "#c97b2a");
    });
    s += dentro(dm, ch);
    // il pentolino appeso, coi popcorn che traboccano
    var pb = -.01, pent = forma(0, pb, .07), zp = 56.4, cp = P(0, pb, zp);
    s += tratto(linea(P(-.035, pb, zp + 1), P(-.035, pb, ZV)), "#495057", .8) + tratto(linea(P(.035, pb, zp + 1), P(.035, pb, ZV)), "#495057", .8);
    s += tornito(0, pb, [[zp - 6, .05], [zp - 5.2, .062], [zp - 1, .068], [zp, .072]], CROMO, 1.1, [1], 1);
    s += pth(chiuso(giro(pent, zp, 1, 36)), "#5c646b", bordo(L, .9)) + dentro(chiuso(giro(pent, zp, .92, 36)), cer(cp[0], cp[1] + .4, 3, "#fff3bf") + cer(cp[0] - 2, cp[1] - .3, 1.6, "#ffffff") + cer(cp[0] + 2, cp[1], 1.5, "#fff8dc"));
    [[-1.6, -1.4], [.8, -1.9], [2.6, -.8], [-.3, -2.6], [-3.4, -.4]].forEach(function (v) { s += cer(cp[0] + v[0], cp[1] + v[1] - .6, 1.1, "#fffbe6", "stroke='#d4a95a' stroke-width='.3'"); });   // i popcorn che traboccano
    // la lampada che scalda, sotto il tetto
    var lp = P(0, pb, ZV - 1.6);
    s += ell(lp[0], lp[1], 3, 1.4, "#343a40", bordo(L, .6)) + ell(lp[0], lp[1] + .8, 1.8, .9, NOTTE ? "#fffbe6" : "#ffe8a3");
    if (NOTTE) { var cv = P(0, pb, (ZC1 + ZV) / 2), sil = [P(ca, cbb, ZC1), P(cA, cbb, ZC1), P(cA, cB, ZC1), P(ca, cB, ZC1), P(ca, cbb, ZV), P(cA, cbb, ZV), P(cA, cB, ZV), P(ca, cB, ZV)]; s += dentro(chiuso(inviluppo(sil)), ell(cv[0], cv[1], 30, 22, rad("cl", [[0, "#fff3bf", .75], [.6, "#ffd43b", .28], [1, "#ffd43b", 0]], .5, .5, .5))); }
    // i vetri vicini (col riflesso) e gli sportelli scorrevoli di dietro
    function riflesso(pp, k) { var b2 = limiti(pp); return dentro(chiuso(pp), poly([[b2[0] + 3, b2[1]], [b2[0] + 8, b2[1]], [b2[0] + 1, b2[3]], [b2[0] - 4, b2[3]]], "#ffffff", op(k))); }
    var vd = [P(ca, dav === B1 ? cB : cbb, ZC1), P(cA, dav === B1 ? cB : cbb, ZC1), P(cA, dav === B1 ? cB : cbb, ZV), P(ca, dav === B1 ? cB : cbb, ZV)];
    var vf = [P(G > 0 ? cA : ca, cbb, ZC1), P(G > 0 ? cA : ca, cB, ZC1), P(G > 0 ? cA : ca, cB, ZV), P(G > 0 ? cA : ca, cbb, ZV)];
    s += montante(lontani[1][0], lontani[1][1]) + montante(lontani[2][0], lontani[2][1]);
    s += poly(vf, "#e7f5ff", op(.16)) + riflesso(vf, NOTTE ? .1 : .3) + poly(vd, "#e7f5ff", op(.14)) + riflesso(vd, NOTTE ? .12 : .38);
    if (G < 0) {   // da dietro: i due sportelli scorrevoli coi pomellini
      var bb = cbb, sp = function (a0, a1) { return poly([P(a0, bb, ZC1 + 1), P(a1, bb, ZC1 + 1), P(a1, bb, ZV - 1), P(a0, bb, ZV - 1)], "none", "stroke='" + scuro(RO, .3) + "' stroke-width='.9'"); };
      s += sp(ca + .01, .01) + sp(-.01, cA - .01);
      [[-.06, 50], [.06, 50]].forEach(function (v) { var c = P(v[0], bb, v[1]); s += cer(c[0], c[1], .9, ORO, "stroke='" + L + "' stroke-width='.4'"); });
    }
    s += montante(lontani[3][0], lontani[3][1]);
    // il tettuccio a righe con la frangia a festoni e la pallina d'oro
    var ub = [-.31, .31], vb = G > 0 ? [-.37, .15] : [-.15, .37], ut = [-.19, .19], vt = G > 0 ? [-.25, .03] : [-.03, .25], n = 6;
    function lerp(m, n2, t) { return [m[0] + (n2[0] - m[0]) * t, m[1] + (n2[1] - m[1]) * t]; }
    function falda(b0p, b1p, t0p, t1p, scura, nn) {   // una falda: le righe che salgono, poi la frangia sotto
      var o = "", k;
      for (k = 0; k < nn; k++) {
        var c = k % 2 ? "#fff5f5" : RO, c2 = scura ? scuro(c, .2) : chiaro(c, .06);
        o += poly([lerp(b0p, b1p, k / nn), lerp(b0p, b1p, (k + 1) / nn), lerp(t0p, t1p, (k + 1) / nn), lerp(t0p, t1p, k / nn)], c2);
      }
      o += poly([b0p, b1p, t1p, t0p], "none", bordo(L, 1.6));
      for (k = 0; k < nn; k++) {   // i festoni
        var p0 = lerp(b0p, b1p, k / nn), p1 = lerp(b0p, b1p, (k + 1) / nn), m = lerp(p0, p1, .5), cf = k % 2 ? "#fff5f5" : RO;
        o += pth("M" + q(p0) + " L" + q(p1) + " Q" + q(m[0] + (p1[0] - p0[0]) * .1, m[1] + 4.6) + " " + q(p0) + " Z", scura ? scuro(cf, .15) : cf, bordo(L, .7));
      }
      return o;
    }
    var Db = Puv(ub[0], vb[1], ZV), Cb = Puv(ub[1], vb[1], ZV), Bb = Puv(ub[1], vb[0], ZV), Dt = Puv(ut[0], vt[1], ZT), Ct = Puv(ut[1], vt[1], ZT), Bt = Puv(ut[1], vt[0], ZT), At = Puv(ut[0], vt[0], ZT);
    s += falda(Cb, Bb, Ct, Bt, true, 5) + falda(Db, Cb, Dt, Ct, false, n);
    s += poly([At, Bt, Ct, Dt], lin("tt", [[0, "#ff6b6b"], [1, "#e03131"]], 0, 0, 1, 1), bordo(L, 1.4)) + tratto(linea([Dt[0] + 1.5, Dt[1]], [Ct[0] - 1, Ct[1] - .2]), "#ffffff", .8, op(.5));
    var cm = Puv(0, (vt[0] + vt[1]) / 2, ZT);
    s += tratto(linea(cm, [cm[0], cm[1] - 3.4]), "#a8781a", 1.4) + cer(cm[0], cm[1] - 4.6, 2, rad("or", [[0, "#fff6cf"], [.5, "#f3c33b"], [1, "#a8781a"]], .35, .3, .8), bordo(L, .7)) + cer(cm[0] - .6, cm[1] - 5.2, .5, "#ffffff");
    s += ruote(dav + (G > 0 ? .012 : -.012));
    if (G > 0) s += maniglione();
    return s;
  });

  // =========================================================
  //  ZUCCHERO FILATO: il carretto a righe azzurre e bianche con le ruote, il piano bianco, la bacinella d'acciaio
  //  con lo zucchero rosa che gira, due nuvole di zucchero filato sui bastoncini e il barattolo dello zucchero colorato.
  //  Da dietro la scatola dell'interruttore e il cavo.
  // =========================================================
  def("zucchero_filato", { tipo: "piedi", nome: "Zucchero filato", fp: [1, 1], box: [-36, -83, 39, 19], dietro: true, prezzo: 1400 }, function () {
    var A0 = -.28, A1 = .28, B0 = -.36, B1 = .16, Z0 = 8, Z1 = 31.6, ZP = 33.6, s = ombra(6, 4, 34, 15), r = rnd(1401), AZ = "#74c0fc";
    var dav = G > 0 ? B1 : B0, die = G > 0 ? B0 : B1;
    function ruote(b) { return ruota(-.18, b, 4.6, 4.4, .03, "#e9ecef") + ruota(.18, b, 4.6, 4.4, .03, "#e9ecef"); }
    s += ruote(die - (G > 0 ? .012 : -.012));
    function righe(W, H) {   // le righe bianche, la frangia bianca in alto e il bordino blu in basso
      var o = "", k, n = 7, w = W / n;
      for (k = 1; k < n; k += 2) o += rett(k * w, 0, w, H, 0, "#ffffff", op(.92));
      o += rett(0, H - 1.6, W, 1.6, 0, scuro(AZ, .45), op(.8));
      for (k = 0; k < n * 2; k++) o += pth("M" + q(k * W / (n * 2), 0) + " Q" + q((k + .5) * W / (n * 2), 3.4) + " " + q((k + 1) * W / (n * 2), 0) + " Z", k % 2 ? AZ : "#ffffff", "stroke='" + scuro(AZ, .4) + "' stroke-width='.4'");
      return o;
    }
    function davanti(W, H) {   // la targa tonda con la nuvoletta rosa
      var cx = W / 2, cy = H * .55, o = righe(W, H);
      o += cer(cx, cy, 6.6, "#ffffff", bordo(L, .8)) + cer(cx, cy, 5.6, "none", "stroke='#f783ac' stroke-width='.7' stroke-dasharray='1.2 .8'");
      o += tratto("M" + q(cx, cy + 1) + " L" + q(cx, cy + 4.6), "#ced4da", .8);
      [[-1.6, -.4, 1.9], [1.5, -.6, 2], [0, -1.9, 2.1], [0, .4, 1.8]].forEach(function (v) { o += cer(cx + v[0], cy + v[1] - 1, v[2], "#ffc9de", "stroke='#f06595' stroke-width='.4'"); });
      return o + cer(cx - 1, cy - 3, .8, "#ffffff", op(.9));
    }
    function dietro(W, H) {   // la scatola dell'interruttore con la lucina e il cavo
      var o = righe(W, H), bx = W * .62, by = H * .3;
      o += rett(bx, by, 9, 7, 1.2, lin("sc", [[0, "#5c646b"], [1, "#2b3035"]], 0, 0, 1, 1), bordo(L, .7)) + rett(bx + 1.6, by + 2, 3, 3.2, .6, "#e03131", bordo(L, .4)) + cer(bx + 6.8, by + 3.6, .8, "#69db7c") + cer(bx + 6.6, by + 3.4, .3, "#ffffff");
      return o + tratto("M" + q(bx + 4.5, by + 7) + " C" + q(bx + 5, by + 14) + " " + q(bx - 4, by + 15) + " " + q(bx - 8, H + 6), "#212529", 1.3);
    }
    s += blocco(A0, A1, B0, B1, Z0, Z1, AZ, { davanti: davanti, dietro: dietro, fianco: righe }, 2.3);
    s += blocco(A0 - .015, A1 + .015, B0 - .015, B1 + .015, Z1, ZP, [lin("ps", [[0, "#ffffff"], [1, "#f1f3f5"]], 0, 0, 1, 1), lin("pl", [[0, "#ffffff"], [1, "#e9ecef"]], 0, 0, 0, 1), lin("pd", [[0, "#ced4da"], [1, "#adb5bd"]], 0, 0, 0, 1)], null, 1.8);   // il piano bianco
    // le due nuvole di zucchero filato sui bastoncini (dietro la bacinella)
    function nuvola(a, b, zc, R, c, seme) {
      var rr = rnd(seme), o = tratto(linea(P(a, b, ZP), P(a, b, zc)), L, 2.2) + tratto(linea(P(a, b, ZP), P(a, b, zc)), "#fffdf5", 1.2);
      o += tornito(a, b, [[ZP, .018], [ZP + 3, .016]], CROMO, .8);   // il portabastoncino
      var c0 = P(a, b, zc), bolle = [], k;
      for (k = 0; k < 9; k++) { var t = k / 9 * 6.28 + rr() * .5, d = R * (.42 + rr() * .2); bolle.push([c0[0] + Math.cos(t) * d, c0[1] + Math.sin(t) * d * .92, R * (.42 + rr() * .16)]); }
      bolle.push([c0[0], c0[1], R * .62]);
      o += bolle.map(function (v) { return cer(v[0], v[1], v[2], L, "stroke='" + L + "' stroke-width='2.2'"); }).join("");
      o += bolle.map(function (v) { return cer(v[0], v[1], v[2], rad("nv" + c.slice(1), [[0, chiaro(c, .7)], [.6, c], [1, scuro(c, .12)]], .35, .3, .85)); }).join("");
      for (k = 0; k < 7; k++) { var t2 = rr() * 6.28, d2 = rr() * R * .7; o += tratto("M" + q(c0[0] + Math.cos(t2) * d2 - 1.2, c0[1] + Math.sin(t2) * d2) + " q1.2,-1 2.4,0", chiaro(c, .75), .5, op(.8)); }
      return o + ell(c0[0] - R * .35, c0[1] - R * .38, R * .28, R * .18, "#ffffff", op(.7));
    }
    var nuvole = ordina([[vicino(-.19, -.27), nuvola(-.19, -.27, 60, 8.4, "#ffc9de", 11)], [vicino(.19, -.27), nuvola(.19, -.27, 63, 7.4, "#d0bfff", 12)]]);
    // la bacinella d'acciaio: fuori, il bordo arrotolato, dentro lo zucchero rosa che gira attorno alla testina
    var bc = -.1, Bw = forma(0, bc, .23), ZB = ZP + 9;
    function bacinella() {
      var o = tornito(0, bc, [[ZP, .1], [ZP + 1.6, .1]], [[0, "#868e96"], [1, "#343a40"]], 1) + corpo([giro(Bw, ZP + 1.4, .72, 56), giro(Bw, ZP + 6, .9, 56), giro(Bw, ZB, 1, 56)], CROMO, 1.6);
      var bocca = giro(Bw, ZB, .96, 56), c = P(0, bc, ZB);
      o += pth(chiuso(bocca), lin("bi", [[0, "#dee2e6"], [.5, "#adb5bd"], [1, "#6c757d"]], 0, 0, 0, 1), bordo(L, 1.2));
      var fondo = giro(Bw, ZP + 2, .64, 48), fil = "", k, rr = rnd(23);
      fil += pth(chiuso(fondo), lin("bf", [[0, "#868e96"], [1, "#495057"]], 0, 0, 0, 1));
      for (k = 0; k < 28; k++) { var t = Math.PI * (1.02 + .96 * k / 27), pp = P(Math.cos(t) * .2, bc + Math.sin(t) * .2, ZP + 6 + rr() * 2.6); fil += cer(pp[0], pp[1], 1.4 + rr() * 1.1, rr() < .5 ? "#ffc9de" : "#ffdeeb", "stroke='#f783ac' stroke-width='.3'"); }   // lo zucchero filato attaccato al bordo
      for (k = 0; k < 7; k++) { var t3 = rr() * 6.28; fil += tratto("M" + q(c[0] + Math.cos(t3) * 10, c[1] + 2.4 + Math.sin(t3) * 3.6) + " Q" + q(c[0], c[1] + 1.4) + " " + q(c[0] - Math.cos(t3) * 9, c[1] + 2.8 - Math.sin(t3) * 3.2), "#fcc2d7", .6, op(.8)); }   // i fili
      var tt = P(0, bc, ZP + 2);
      fil += tornito(0, bc, [[ZP + 2, .034], [ZP + 5.4, .034], [ZP + 6, .022]], CROMO, .9) + ell(tt[0], tt[1] - 5.2, 4.4, 1.7, "#ffc9de", "stroke='#f783ac' stroke-width='.4' opacity='.9'");   // la testina che gira, con l'anello di zucchero
      o += dentro(chiuso(bocca), fil);
      o += tratto(chiuso(giro(Bw, ZB, 1.01, 56)), L, 3.6) + tratto(chiuso(giro(Bw, ZB, 1.01, 56)), "#dee2e6", 2) + tratto(aperto(giro(Bw, ZB + .2, 1.01, 56).slice(24, 40)), "#ffffff", .9, op(.95));   // il bordo arrotolato
      return o;
    }
    function barattolo() {   // il barattolo di vetro con lo zucchero rosa e il coperchio
      var a = .2, b = .09, o = tornito(a, b, [[ZP, .036], [ZP + 3.6, .036]], [[0, "#ffdeeb"], [.5, "#f783ac"], [1, "#c2255c"]], .9);
      o += tornito(a, b, [[ZP, .04], [ZP + 5.6, .04]], [[0, "#ffffff", .6], [.5, "#e7f5ff", .25], [1, "#a5d8ff", .5]], 1) + tornito(a, b, [[ZP + 5.6, .042], [ZP + 7, .042]], [[0, "#ffffff"], [1, "#e64980"]], .9);
      var c = P(a, b, ZP + 4); return o + rett(c[0] - 2.2, c[1] - 1.6, .8, 3.6, .4, "#ffffff", op(.75));
    }
    s += G > 0 ? nuvole + bacinella() + barattolo() : barattolo() + bacinella() + nuvole;   // le nuvole stanno dietro la bacinella, il barattolo davanti
    s += ruote(dav + (G > 0 ? .012 : -.012));
    return s;
  });

  // =========================================================
  //  MACCHINA DELL'ESPRESSO (si appoggia sopra): l'acciaio spazzolato, la fascia scura col manometro e la lucina rossa,
  //  il gruppo col portafiltro dal manico nero, la tazzina col caffè sulla griglia, la lancia del vapore,
  //  sopra lo scaldatazze con la ringhiera e le tazzine capovolte. Da dietro il serbatoio dell'acqua e il cavo.
  // =========================================================
  def("espresso_bar", { tipo: "sopra", nome: "Macchina dell'espresso", fp: [1, 1], box: [-23, -37, 24, 12], dietro: true, prezzo: 900 }, function () {
    var A0 = -.2, A1 = .2, B0 = -.19, B1 = .02, Z0 = 2.4, ZT = 22.4, s = ombra(2, 2, 22, 9.4);
    var AC = [lin("as", [[0, "#ffffff"], [1, "#dee2e6"]], 0, 0, 1, 1), lin("al", [[0, "#f1f3f5"], [.6, "#d5dbe0"], [1, "#b5bec6"]], 0, 0, 0, 1), lin("ad", [[0, "#aab3bb"], [1, "#7c8790"]], 0, 0, 0, 1)];
    function spazz(W, H, n, seme) { var o = "", rr = rnd(seme), i; for (i = 0; i < n; i++) { var x = rr() * W; o += rett(x, 0, .3, H, 0, rr() < .5 ? "#ffffff" : "#6a767f", op(f1(.06 + rr() * .14))); } return o; }   // l'acciaio spazzolato
    function davanti(W, H) {
      var o = spazz(W, H, 26, 5) + poly([[W * .05, 0], [W * .3, 0], [W * .55, H], [W * .3, H]], "#ffffff", op(.3));
      o += rett(1.4, 1.8, W - 2.8, 6, 1.4, lin("fs", [[0, "#495057"], [1, "#1d2124"]], 0, 0, 0, 1), bordo(L, .7));   // la fascia scura
      o += cer(3.6, 4.8, 1.1, NOTTE ? "#ffc9c9" : "#ff6b6b", "stroke='#7a1515' stroke-width='.4'") + cer(3.3, 4.5, .4, "#ffffff");   // la lucina rossa
      [7.2, 10.2].forEach(function (x) { o += rett(x, 3.6, 2.2, 2.4, .5, lin("bt", [[0, "#ffffff"], [1, "#adb5bd"]], 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.35'"); });
      var gx = W - 5.2, gy = 4.9;   // il manometro
      o += cer(gx + .3, gy + .4, 3.5, "#000", op(.3)) + cer(gx, gy, 3.5, lin("mb", CROMO, 0, 0, 1, 1), bordo(L, .7)) + cer(gx, gy, 2.6, "#fffdf5", "stroke='#495057' stroke-width='.3'");
      for (var k = 0; k < 7; k++) { var t = Math.PI * (.8 + 1.4 * k / 6); o += tratto(linea([gx + Math.cos(t) * 2, gy + Math.sin(t) * 2], [gx + Math.cos(t) * 2.4, gy + Math.sin(t) * 2.4]), "#495057", .3); }
      o += pth("M" + q(gx, gy) + " L" + q(gx + 1.7, gy - 1.3), "none", "stroke='#e03131' stroke-width='.5' stroke-linecap='round'") + cer(gx, gy, .45, "#343a40") + ell(gx - 1, gy - 1.2, 1, .5, "#ffffff", op(.8));
      o += rett(W * .5 - 4.6, 9.2, 9.2, 1.6, .8, "#000", op(.25));   // l'attacco del gruppo
      return o + ell(W * .5, H - 3.4, 2.4, 1, "#e03131", "stroke='#7a1515' stroke-width='.3'") + ell(W * .5 - .6, H - 3.7, .8, .3, "#ffffff", op(.7));   // la targhetta rossa
    }
    function dietro(W, H) {   // il serbatoio dell'acqua con la finestrella, le fessure, il cavo
      var o = spazz(W, H, 22, 9) + feritoie(3, 3.4, W * .5, 4, 1.8, "#495057");
      o += rett(W - 7.6, 2.6, 4.4, H - 6, 1.2, lin("ac", [[0, "#d0ebff"], [.5, "#74c0fc"], [1, "#1c7ed6"]], 0, 0, 1, 0), bordo(L, .6)) + rett(W - 7.6, 2.6, 4.4, 6, 1.2, "#f1f3f5", op(.85)) + rett(W - 7, 9, .8, H - 13, .4, "#ffffff", op(.6));
      return o + tratto("M" + f1(W * .3) + "," + f1(H - 2) + " C" + f1(W * .26) + "," + f1(H + 3) + " " + f1(W * .15) + "," + f1(H + 4) + " " + f1(W * .04) + "," + f1(H + 4.2), "#16191c", 1.2);
    }
    function fianco(W, H) { return spazz(W, H, 20, 7) + rett(2, 2, W - 4, H - 4, 1.4, "none", "stroke='#8a949c' stroke-width='.6' opacity='.7'") + poly([[W * .4, 0], [W * .55, 0], [W * .8, H], [W * .65, H]], "#ffffff", op(.18)); }
    var pezzi = "";   // davanti: il gruppo, il portafiltro, la tazzina, la lancia del vapore
    (function () {
      var ag = -.03, bg = .055;
      pezzi += tornito(ag, bg, [[10.4, .04], [11.2, .046], [13.4, .046], [14.2, .038]], CROMO, 1, [1], .8);   // il gruppo
      pezzi += tornito(ag, bg, [[8.6, .036], [9.4, .043], [10.6, .043]], CROMO, 1);   // il portafiltro
      var m0 = P(ag, bg + .04, 9.6), m1 = P(ag + .01, bg + .17, 8.4);
      pezzi += tratto(linea(m0, m1), L, 4.2) + tratto(linea(m0, m1), "#212529", 2.6) + tratto(linea([m0[0] - .3, m0[1] - .6], [m1[0] - .3, m1[1] - .6]), "#6c757d", .7);   // il manico nero
      [-.015, .015].forEach(function (d) { pezzi += tratto(linea(P(ag + d, bg, 8.4), P(ag + d, bg, 7.4)), "#868e96", .7); });   // i beccucci
      var tz = forma(ag, bg + .01, .05), z0 = Z0 + .3;   // la tazzina col piattino
      pezzi += corpo([giro(tz, z0, 1, 32), giro(tz, z0 + .8, 1, 32)], CER, .8) + pth(chiuso(giro(tz, z0 + .8, 1, 32)), "#f4f7f9", bordo(L, .6));
      var cu = tornito(ag, bg + .01, [[z0 + .8, .022], [z0 + 2, .027], [z0 + 3.8, .032], [z0 + 4.4, .033]], CER, .9), cr = forma(ag, bg + .01, .028), mh = P(ag + .045, bg + .01, z0 + 3.2);
      pezzi += cu + pth(chiuso(giro(cr, z0 + 4.2, 1, 24)), rad("cr", [[0, "#e7b07a"], [.55, "#b8743d"], [1, "#5e3317"]], .45, .45, .6), bordo(L, .4)) + tratto("M" + q(mh[0] - .8, mh[1] - 1) + " Q" + q(mh[0] + 1, mh[1] - .6) + " " + q(mh[0] - .6, mh[1] + .8), "#f1f4f6", .9);
      var fm = P(ag, bg + .01, z0 + 6.4);
      pezzi += tratto("M" + q(fm[0] - 1, fm[1]) + " c1.6,-1.8 -1.6,-3.4 0,-5.2", "#ffffff", .8, op(.7)) + tratto("M" + q(fm[0] + 1, fm[1] - .4) + " c-1.4,-1.6 1.4,-3 0,-4.4", "#ffffff", .7, op(.55));
      var v0 = P(.135, B1 + .01, 14.2), v1 = P(.15, B1 + .07, 9.4), v2 = P(.16, B1 + .085, 5.6);   // la lancia del vapore e la sua manopola
      pezzi += cromo("M" + q(v0) + " L" + q(v1) + " L" + q(v2), 1.3);
      var mv = P(.135, B1 + .015, 15.6);
      pezzi += ell(mv[0], mv[1], 2.2, 1.6, "#212529", bordo(L, .6)) + ell(mv[0] - .5, mv[1] - .6, .7, .4, "#868e96");
    })();
    var gr = function (A, B, C, D) { var o = "", k; for (k = 1; k < 10; k++) { var t = k / 10; o += tratto(linea([A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t], [D[0] + (C[0] - D[0]) * t, D[1] + (C[1] - D[1]) * t]), "#495057", .45, op(.7)); } return o; };
    s += blocco(-.21, .21, -.2, .15, 0, Z0, ["#4b5359", "#3a4046", "#22262a"].map(function (c, i) { return lin("bz" + i, [[0, chiaro(c, .1)], [1, c]], 0, 0, i ? 0 : 1, 1); }), { sopra: function (A, B, C, D) { var Am = [A[0] + (D[0] - A[0]) * .55, A[1] + (D[1] - A[1]) * .55], Bm = [B[0] + (C[0] - B[0]) * .55, B[1] + (C[1] - B[1]) * .55]; return poly([Am, Bm, C, D], lin("gg", CROMO, 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.5'") + gr(Am, Bm, C, D); } }, 1.4);
    if (G < 0) s += pezzi;
    s += blocco(A0, A1, B0, B1, Z0, ZT, AC, { davanti: davanti, dietro: dietro, fianco: fianco, sopra: function (A, B, C, D) { return gr(A, B, C, D); } }, 1.8);
    // lo scaldatazze: la ringhiera e le tazzine capovolte
    var ra = .175, rb0 = -.17, rb1 = 0, zr = ZT + 2.6, ang = [[-ra, rb0], [ra, rb0], [ra, rb1], [-ra, rb1]];
    function lato(i) { return cromo(linea(P(ang[i][0], ang[i][1], zr), P(ang[(i + 1) % 4][0], ang[(i + 1) % 4][1], zr)), .7); }
    function palo(v) { return cromo(linea(P(v[0], v[1], ZT), P(v[0], v[1], zr)), .6); }
    var lati = [0, 1, 2, 3].map(function (i) { var m = [(ang[i][0] + ang[(i + 1) % 4][0]) / 2, (ang[i][1] + ang[(i + 1) % 4][1]) / 2]; return [vicino(m[0], m[1]), lato(i)]; }).sort(function (x, y) { return x[0] - y[0]; });
    s += lati[0][1] + lati[1][1] + perVicino(ang.slice()).slice(0, 2).map(palo).join("");
    s += ordina([[-.1, -.1], [.03, -.12], [.1, -.05]].map(function (v) { return [vicino(v[0], v[1]), tornito(v[0], v[1], [[ZT, .03], [ZT + 2, .027], [ZT + 2.6, .02]], CER, .7) + ell(P(v[0], v[1], ZT + 2.6)[0], P(v[0], v[1], ZT + 2.6)[1], 1.2, .6, "#e9eef1", "stroke='" + L + "' stroke-width='.3'")]; }));
    s += perVicino(ang.slice()).slice(2).map(palo).join("") + lati[2][1] + lati[3][1];
    if (G > 0) s += pezzi;
    return s;
  });

  // =========================================================
  //  BANCONE DEL BAR: il piano spesso di noce scuro laccato col bordo tondo, il davanti di legno con le nove doghe in rilievo,
  //  la fascia d'acciaio, il poggiapiedi cromato sulle staffe e lo zoccolo scuro.
  //  Da dietro (dalla parte del barista): i ripiani coi bicchieri capovolti, le bottiglie e lo strofinaccio.
  // =========================================================
  def("bancone_bar", { tipo: "piedi", nome: "Bancone del bar", fp: [2, 1], box: [-61, -95, 62, 30], dietro: true, piano: 63, prezzo: 2600 }, function () {
    var A0 = -.85, A1 = .85, B0 = -.26, B1 = .2, ZP = 4.5, ZB = 58, ZT = 63, LE = "#8b5a2b", SC = "#3b2b22", r = rnd(2601);
    var s = ombraPianta(A0, A1, -.3, .32, .9, .12);
    function poggiapiedi() {   // il tubo cromato sulle tre staffe, e la sua ombra a terra
      var bb = B1 + .085, zz = 10, e0 = A0 + .14, e1 = A1 - .14, o = tratto(linea(P(e0, bb + .04, 0), P(e1, bb + .04, 0)), "#000", 5, op(.07)) + tratto(linea(P(e0, bb + .03, 0), P(e1, bb + .03, 0)), "#000", 2.2, op(.08));
      [-.58, 0, .58].forEach(function (a) { o += cromo("M" + q(P(a, B1, zz + 4.2)) + " L" + q(P(a, bb, zz + .6)), 1.4); });
      o += cromo(linea(P(e0, bb, zz), P(e1, bb, zz)), 2.6);
      [e0, e1].forEach(function (a) { var c = P(a, bb, zz); o += cer(c[0], c[1], 1.9, lin("pt", CROMO, 0, 0, 1, 1), bordo(L, .8)); });
      return o;
    }
    function venature(W, H, n, seme, k, x0, y0) {   // le venature del legno, quasi dritte (x0, y0 = dove comincia il riquadro)
      var o = "", rr = rnd(seme), i; x0 = x0 || 0; y0 = y0 || 0;
      for (i = 0; i < n; i++) { var x = x0 + rr() * W, w = .4 + rr() * .6; o += pth("M" + q(x, y0) + " Q" + q(x + (rr() - .5) * 3, y0 + H * .5) + " " + q(x + (rr() - .5) * 2, y0 + H), "none", "stroke='" + (rr() < .5 ? chiaro(LE, .25) : scuro(LE, .3)) + "' stroke-width='" + f1(w) + "' opacity='" + (k || .35) + "'"); }
      return o;
    }
    function davanti(W, H) {
      var o = venature(W, H, 60, 7), n = 9, gap = 2, pw = (W - 4 - gap * (n - 1)) / n, i;
      for (i = 0; i < n; i++) { var x = 2 + i * (pw + gap); o += pannello(chiaro(LE, .08), pw, 27, [x, 5.6]) + venature(pw - 2, 25, 4, 30 + i, .3, x + 1, 6.6); }
      o += rett(0, 35.4, W, 2.6, 0, lin("fa", [[0, "#ffffff"], [.4, "#ced4da"], [1, "#7c8790"]], 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.5'");   // la fascia d'acciaio
      o += rett(0, 38, W, 1.2, 0, "#000", op(.18)) + rett(0, H - 2.6, W, 2.6, 0, "#000", op(.16));
      return o + buio(W, 7, .42, true);   // l'ombra sotto il piano che sporge
    }
    function fianco(W, H) { return venature(W, H, 18, 9) + pannello(chiaro(LE, .08), W - 6, 27, [3, 5.6]) + rett(0, 35.4, W, 2.6, 0, lin("fa", [[0, "#ffffff"], [.4, "#ced4da"], [1, "#7c8790"]], 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.5'") + buio(W, 5, .35, true); }
    function dietro(W, H) {   // dalla parte del barista: tre scomparti, sopra i bicchieri capovolti, sotto le bottiglie
      var o = venature(W, H, 40, 11), xs = [2.4, 36.6, 70.8], bw = 30.5, rr = rnd(77), k;
      xs.forEach(function (x, j) {
        [[5.4, 16.6], [25.2, 20.6]].forEach(function (f, i) {   // le due nicchie
          o += rett(x, f[0], bw, f[1], .8, lin("ni" + i, [[0, "#1f150d"], [1, "#3b2a1c"]], 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.8'") + rett(x, f[0], bw, 2.4, 0, "#000", op(.3)) + rett(x, f[0], 1.8, f[1], 0, "#000", op(.2));
        });
        for (k = 0; k < 5; k++) {   // i bicchieri capovolti sul ripiano di sopra
          var cx = x + 3.6 + k * 5.8, yb = 21.6;
          if ((k + j) % 3 === 2) o += pth("M" + q(cx - 2, yb) + " Q" + q(cx - 2.2, yb - 5) + " " + q(cx, yb - 5.4) + " Q" + q(cx + 2.2, yb - 5) + " " + q(cx + 2, yb) + " Z", "#d0ebff", "stroke='#8fb3c9' stroke-width='.45' fill-opacity='.75'") + rett(cx - .3, yb - 9.8, .6, 4.4, .3, "#d0ebff", "stroke='#8fb3c9' stroke-width='.35'") + ell(cx, yb - 10, 2, .6, "#e7f5ff", "stroke='#8fb3c9' stroke-width='.35'");   // il calice
          else o += pth("M" + q(cx - 2.1, yb) + " L" + q(cx - 1.7, yb - 7.4) + " L" + q(cx + 1.7, yb - 7.4) + " L" + q(cx + 2.1, yb) + " Z", "#d0ebff", "stroke='#8fb3c9' stroke-width='.45' fill-opacity='.7'") + rett(cx - 1.7, yb - 7.4, 3.4, 1.2, .3, "#a5d8ff", op(.7));   // il bicchiere
          o += rett(cx - 1.4, yb - 6.4, .5, 4.6, .25, "#ffffff", op(.8));
        }
        var cols = ["#2b8a3e", "#d9480f", "#f1f3f5", "#c92a2a", "#1c7ed6", "#e8590c", "#5c940d"];
        for (k = 0; k < 5; k++) { var bx = x + 3.4 + k * 5.9, c = cols[(k + j * 2) % cols.length], h = 13 + rr() * 5; o += bottiglia(bx, 44.6, 3.5, h, c, k % 2 ? "#212529" : "#fab005"); }   // le bottiglie
      });
      [21.6, 44.6].forEach(function (y) { o += rett(1.2, y, W - 2.4, 2.2, .4, lin("rp", [[0, chiaro(LE, .3)], [1, scuro(LE, .2)]], 0, 0, 0, 1), "stroke='" + L + "' stroke-width='.5'"); });   // i ripiani
      var tx = W * .79;   // lo strofinaccio a righe appeso
      o += pth("M" + q(tx, 0) + " L" + q(tx + 9, 0) + " L" + q(tx + 9.4, 10.6) + " Q" + q(tx + 7, 11.6) + " " + q(tx + 4.6, 10.8) + " Q" + q(tx + 2.4, 11.8) + " " + q(tx - .4, 10.4) + " Z", "#f8f9fa", bordo(L, .7)) + rett(tx + .2, 6.4, 9, 1.1, 0, "#e03131", op(.85)) + rett(tx + .2, 8.2, 9.1, .6, 0, "#e03131", op(.85)) + tratto("M" + q(tx + 3, .6) + " Q" + q(tx + 2.6, 5) + " " + q(tx + 3.2, 10), "#ced4da", .5);
      return o + buio(W, 6, .5, true);
    }
    if (G < 0) s += poggiapiedi();
    s += blocco(A0 + .03, A1 - .03, B0 + .02, B1 - .03, 0, ZP, SC, null, 1.6);   // lo zoccolo, rientrato
    s += blocco(A0, A1, B0, B1, ZP, ZB, LE, { davanti: davanti, dietro: dietro, fianco: fianco }, 2.4);
    if (G > 0) s += poggiapiedi();
    // il piano di noce: spesso, col bordo tondo dalla parte dei clienti, laccato e lucido, con le venature
    var prof = [[-.3, ZB], [.27, ZB]].concat(arcoS(.27, (ZB + ZT) / 2, .045, (ZT - ZB) / 2, -Math.PI / 2, Math.PI / 2, 10).slice(1), [[-.3, ZT]]);
    s += estruso("a", pulisci(prof), A0 - .012, A1 + .012, "#4a3324", {
      mat: { lucido: .6, esp: 18 }, lw: 2.3,
      fascia: function (H) {
        var o = "", k, i;
        for (k = 0; k < 15; k++) {   // le venature lungo il piano
          var b = -.28 + r() * .55, pp = [];
          for (i = 0; i <= 8; i++) { var a = A0 + (A1 - A0) * i / 8; pp.push(P(a, b + Math.sin(i * 1.3 + k) * .012, ZT)); }
          o += tratto(curva(pp), r() < .5 ? "#7a5639" : "#2a1d15", .35 + r() * .4, op(.4));
        }
        var t0 = P(A0, -.3, ZT), t1 = P(A1, .3, ZT);
        for (k = 0; k < 2; k++) { var x0 = t0[0] + 30 + k * 52, w = k ? 9 : 16; o += poly([[x0, t0[1] - 6], [x0 + w, t0[1] - 6], [x0 + w - 44, t1[1] + 6], [x0 - 44, t1[1] + 6]], "#ffffff", op(k ? .1 : .16)); }   // i riflessi della lacca
        return o + H.luccica(.6, .03, .97);
      }
    });
    return s;
  });

  // =========================================================
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: "tutte", reparto: "bar", w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice(), dietro: !!d.dietro, prezzo: d.prezzo, qual: 2 };
      if (d.piano) o.piano = d.piano;
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      if (d.colori) o.colori = d.colori.map(function (k) { return { id: k.id, nome: k.nome, c: k.c }; });
      if (d.luce) { var l = d.luce; o.luce = [Math.round(m.ax + (l[0] - l[1]) * 50), Math.round(m.ay + (l[0] + l[1]) * 25 - l[2]), l[3], l[4]]; }   // dove esce la luce, nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "mbar" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!(opz.notte && d.luce);
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

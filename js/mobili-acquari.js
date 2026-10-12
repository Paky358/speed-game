/* =========================================================
   SPeeD GAME — GLI ACQUARI VISTI DALL'ALTO (roba bella, da comprare)
   Gli stessi acquari della casa vista di lato (js/casa.js, reparto "deco"), con gli stessi nomi e prezzi:
   l'acquario gigante (la barriera corallina col relitto del galeone, sul mobile di noce), l'acquario del pescatore
   (il fondo del lago, legno, corde e la lanterna) e l'acquario coi pesciolini (piccolo, si appoggia sopra un mobile).
   Come il bagno (js/mobili-arte.js): una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Il davanti guarda in basso a sinistra; con { dietro: true } lo stesso acquario girato (la schiena del mobile, i tubi, i cavi).
   Il vetro è trasparente da tutti i lati: anche da dietro si vedono l'acqua, le decorazioni e i pesci.
   Con { notte: true } la luce dell'acquario è accesa; info().luce = [x, y, raggio, colore] dice da dove esce la luce.
   info().vasca = [x, y, w, h] (solo nei due acquari dove vanno i pesci pescati al laghetto): il rettangolo tutto d'acqua
   nel disegno davanti (sotto il pelo dell'acqua, sopra la sabbia), uguale anche da dietro.
   Con { vuoto: true } la vasca senza i pesci disegnati (per metterci quelli pescati).
   Si aggiungono a SGMobiliArte con aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte || !window.SGMobiliArte.aggiungi) return;

  // ---------- attrezzi (gli stessi del bagno e del bar) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false, VUOTO = false;   // il disegno in corso; G = 1 davanti, −1 girato; NOTTE = luce accesa; VUOTO = senza pesci
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
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function curva(pp) {   // una linea morbida che passa vicino ai punti
    var d = "M" + q(pp[0]), i;
    for (i = 1; i < pp.length - 1; i++) d += " Q" + q(pp[i]) + " " + q([(pp[i][0] + pp[i + 1][0]) / 2, (pp[i][1] + pp[i + 1][1]) / 2]);
    return d + " L" + q(pp[pp.length - 1]);
  }
  function morbido(pp) {   // una forma chiusa morbida che passa vicino ai punti
    var n = pp.length, i, m = function (a, b) { return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; }, d = "M" + q(m(pp[n - 1], pp[0]));
    for (i = 0; i < n; i++) d += " Q" + q(pp[i]) + " " + q(m(pp[i], pp[(i + 1) % n]));
    return d + " Z";
  }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  // sfumature e ritagli (gli id col prefisso del disegno)
  function sfum(tag, nome, stops, a) {
    var id = p + nome;
    if (!FATTI[id]) {
      FATTI[id] = 1;
      DEFS.push("<" + tag + " id='" + id + "' " + a + ">" + stops.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + f2(s[2]) + "'" : "") + "/>"; }).join("") + "</" + tag + ">");
    }
    return "url(#" + id + ")";
  }
  function lin(nome, stops, x1, y1, x2, y2, user) { return sfum("linearGradient", user ? nome + (++nC) : nome, stops, "x1='" + f2(x1) + "' y1='" + f2(y1) + "' x2='" + f2(x2) + "' y2='" + f2(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function rad(nome, stops, cx, cy, r) { return sfum("radialGradient", nome, stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function nuova(stops, x1, y1, x2, y2) { return sfum("linearGradient", "g" + (++nC), stops, "x1='" + f2(x1) + "' y1='" + f2(y1) + "' x2='" + f2(x2) + "' y2='" + f2(y2) + "'"); }
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];
  var ORO = [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]];
  var FERRO = [[0, "#7a8188"], [.25, "#474d53"], [.7, "#23272b"], [1, "#0e1012"]];
  function corda(d, w) { w = w || 1.4; return tratto(d, L, w + 1.1) + tratto(d, "#d9b878", w) + tratto(d, "#9c7a3f", w * .5, "stroke-dasharray='" + f1(w * .45) + " " + f1(w * .75) + "'") + tratto(d, "#fff3d6", w * .25, "opacity='.5' transform='translate(-.2 -.3)'"); }   // una corda di canapa ritorta

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda (si disegna dopo)
  function inviluppo(pp) {   // il contorno esterno di tanti punti
    var a = pp.slice().sort(function (m, n) { return m[0] - n[0] || m[1] - n[1]; }), lo = [], hi = [], i;
    function cr(o, m, n) { return (m[0] - o[0]) * (n[1] - o[1]) - (m[1] - o[1]) * (n[0] - o[0]); }
    for (i = 0; i < a.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], a[i]) <= 0) lo.pop(); lo.push(a[i]); }
    for (i = a.length - 1; i >= 0; i--) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], a[i]) <= 0) hi.pop(); hi.push(a[i]); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  function aTerra(c) { return "<g transform='matrix(50 25 -50 25 0 0)'>" + c + "</g>"; }
  function ombraPianta(a0, a1, b0, b1, k, pad) {   // l'ombra morbida stesa sul pavimento sotto il mobile (scivola un po' a destra)
    var cu = G * (a0 + a1) / 2 + .05, cv = G * (b0 + b1) / 2 - .01;
    return aTerra("<ellipse cx='" + f2(cu) + "' cy='" + f2(cv) + "' rx='" + f2((a1 - a0) / 2 + pad) + "' ry='" + f2((b1 - b0) / 2 + pad) + "' fill='" + rad("omp", [[0, "#000", .24], [.6, "#000", .16], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>");
  }
  // disegnare su un piano orizzontale all'altezza z, in centesimi di mattonella (a, b × 100): le linee "P" restano sottili
  function inPiano(z, corpo) { return "<g transform='matrix(" + .5 * G + " " + .25 * G + " " + -.5 * G + " " + .25 * G + " 0 " + f1(-z) + ")'>" + corpo + "</g>"; }
  function trattoP(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + w + "' stroke-linecap='round' vector-effect='non-scaling-stroke'" + attr(x) + "/>"; }

  // ---------- i mobili squadrati (come nel bagno) ----------
  function faccia(o, dir, c) { return "<g transform='matrix(.8197 " + (dir > 0 ? ".4098" : "-.4098") + " 0 1 " + f1(o[0]) + " " + f1(o[1]) + ")'>" + c + "</g>"; }
  function tinte(c) {   // i tre colori: sopra, la faccia di sinistra (alla luce), quella di destra (in ombra)
    if (typeof c !== "string") return c;
    var k = c.slice(1);
    return [lin("ts" + k, [[0, chiaro(c, .32)], [1, chiaro(c, .1)]], 0, 0, 1, 1), lin("tl" + k, [[0, chiaro(c, .12)], [1, scuro(c, .06)]], 0, 0, 0, 1), lin("td" + k, [[0, scuro(c, .2)], [1, scuro(c, .34)]], 0, 0, 0, 1)];
  }
  function legnoT(c) { var k = c.slice(1); return [lin("ws" + k, [[0, chiaro(c, .18)], [.6, chiaro(c, .04)], [1, scuro(c, .08)]], 0, 0, 1, 1), lin("wl" + k, [[0, chiaro(c, .08)], [1, scuro(c, .12)]], 0, 0, 0, 1), lin("wd" + k, [[0, scuro(c, .3)], [1, scuro(c, .42)]], 0, 0, 0, 1)]; }
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
  function piano(O, X, Y, W, H, c) {   // un disegno piatto W × H steso su un piano qualsiasi: O = l'angolo in alto a sinistra, X = la fine della riga di sopra, Y = la fine del lato di sinistra
    var m = [(X[0] - O[0]) / W, (X[1] - O[1]) / W, (Y[0] - O[0]) / H, (Y[1] - O[1]) / H, O[0], O[1]];
    return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>";
  }
  function specchiaSe(W, s) { return G < 0 ? "<g transform='matrix(-1 0 0 1 " + f1(W) + " 0)'>" + s + "</g>" : s; }   // i fianchi: da dietro, il davanti del mobile sta dall'altra parte
  // le venature del legno su una faccia piatta (vert = che corrono in su): righe fini e qualche striscia più scura
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
  function lacca(A, B, C, D, k) {   // i riflessi della lacca su un piano lucido, in diagonale
    var b = limiti([A, B, C, D]), o = "";
    [[.18, 16, .2], [.36, 7, .13], [.7, 10, .1]].forEach(function (v) { var x = b[0] + (b[2] - b[0]) * v[0]; o += poly([[x, b[1] - 4], [x + v[1], b[1] - 4], [x + v[1] - 40, b[3] + 4], [x - 40, b[3] + 4]], "#ffffff", op(v[2] * (k || 1))); });
    return dentro(chiuso([A, B, C, D]), o);
  }
  // i pezzi torniti (colonne, lanterne): prof = [[z, raggio in mattonelle], ...] dal basso in alto
  function dTornito(a, b, prof) {
    var c = P(a, b, 0), n = prof.length, sx = [], dx = [], i;
    for (i = 0; i < n; i++) { var rx = prof[i][1] * 70.71, y = c[1] - prof[i][0]; sx.push([c[0] - rx, y]); dx.push([c[0] + rx, y]); }
    var rt = prof[n - 1][1] * 70.71, rb = prof[0][1] * 70.71;
    var d = "M" + sx.map(function (x) { return q(x); }).join(" L") + " A" + f1(rt) + "," + f1(rt / 2) + " 0 0,1 " + q(dx[n - 1]);
    for (i = n - 2; i >= 0; i--) d += " L" + q(dx[i]);
    return d + " A" + f1(rb) + "," + f1(rb / 2) + " 0 0,1 " + q(sx[0]) + " Z";
  }
  function tornito(a, b, prof, stops, lw, luce) {
    var c = P(a, b, 0), rm = 0;
    prof.forEach(function (x) { rm = Math.max(rm, x[1] * 70.71); });
    var o = pth(dTornito(a, b, prof), lin("tn", stops, c[0] - rm, 0, c[0] + rm, 0, true), bordo(L, lw || 1.4));
    if (luce) o += tratto("M" + prof.slice(1, prof.length - 1).map(function (x) { return q(c[0] - x[1] * 70.71 * .5, c[1] - x[0]); }).join(" L"), "#ffffff", luce, op(.4));
    return o;
  }
  function anelloTornito(a, b, z, r, c, w) {   // un anello (la metà davanti) attorno a un pezzo tornito
    var o = P(a, b, z), rx = r * 70.71;
    return tratto("M" + q(o[0] - rx, o[1]) + " A" + f1(rx) + "," + f1(rx / 2) + " 0 0,0 " + q(o[0] + rx, o[1]), c, w);
  }
  function pomoOro(x, y, r) { return cer(x + .4, y + .6, r, "#000", op(.25)) + cer(x, y, r, rad("po", [[0, "#fff6cc"], [.45, "#f2c94c"], [1, "#9c6b12"]], .35, .3, .75), bordo(L, .6)) + cer(x - r * .3, y - r * .3, r * .3, "#ffffff", op(.85)); }

  // =========================================================
  //  I PESCI: disegnati di lato, lunghi 100 (da −50 a 50), il muso a destra; poi messi nella vasca (lunghi Lp)
  // =========================================================
  var PESCE = {}, NE = "#1d1712";
  function pinna(d, fill, w) { return pth(d, fill, "stroke='" + L + "' stroke-width='" + (w || 2.2) + "' stroke-linejoin='round'"); }
  function pelle(d, fill, disegni, luce) {   // il corpo: il colore, i disegni ritagliati dentro, il riflesso e il contorno
    var b = luce || [10, -13, 20, 4.5];
    return pth(d, fill) + dentro(d, (disegni || "") + ell(b[0], b[1], b[2], b[3], "#ffffff", op(.4))) + pth(d, "none", "stroke='" + L + "' stroke-width='3' stroke-linejoin='round'");
  }
  function occhio(x, y, r, iride) { return cer(x, y, r, "#ffffff", "stroke='" + L + "' stroke-width='1.3'") + cer(x + r * .16, y + r * .06, r * .64, iride || "#3b2a1a") + cer(x + r * .2, y + r * .06, r * .34, "#000000") + cer(x - r * .04, y - r * .3, r * .26, "#ffffff"); }
  function margine(nome, c, verso) {   // la pinna che diventa nera sul bordo (verso = dove sta il bordo)
    var v = { su: [0, 1, 0, 0], giu: [0, 0, 0, 1], sx: [1, 0, 0, 0] }[verso];
    return lin(nome, [[0, c], [.56, c], [.72, NE], [1, NE]], v[0], v[1], v[2], v[3]);
  }
  function giu(nome, a, b) { return lin(nome, [[0, a], [1, b]], 0, 0, 0, 1); }
  // il pesce pagliaccio: arancione con le tre fasce bianche bordate di nero, le pinne col bordo nero
  PESCE.pagliaccio = function () {
    var ar = "#ff7a1a", B = "M50,3 C48,-12 34,-22 13,-23 C-7,-24 -21,-15 -29,-7 L-29,7 C-21,15 -7,21 13,20 C34,19 48,15 50,3 Z";
    var fasce = "M36,-27 C25,-12 25,10 34,25 L21,25 C13,10 13,-12 23,-27 Z M3,-27 C0,-14 12,-4 7,5 C4,12 0,18 3,25 L-8,25 C-11,12 -9,-12 -12,-27 Z M-19,-20 C-23,-8 -23,8 -19,20 L-27,20 C-30,7 -30,-7 -27,-20 Z";
    return pinna("M-27,-5 C-35,-18 -47,-22 -51,-12 C-54,-4 -54,4 -51,12 C-47,22 -35,18 -27,5 Z", margine("pgC", ar, "sx")) +
      pinna("M20,-20 C15,-31 5,-32 0,-24 C-6,-33 -19,-31 -24,-13 Z", margine("pgD", ar, "su")) +
      pinna("M-5,19 C-9,29 -19,28 -23,12 Z", margine("pgA", ar, "giu")) + pinna("M14,18 C12,27 5,29 2,20 Z", margine("pgA", ar, "giu")) +
      pelle(B, giu("pgB", "#ffb066", "#e8590c"), pth(fasce, "#ffffff", "stroke='" + NE + "' stroke-width='2.8'")) +
      pinna("M20,5 C13,0 5,3 4,10 C10,14 17,11 20,5 Z", margine("pgP", ar, "sx"), 1.6) + occhio(37, -5, 5.5, "#c2410c") + tratto("M49,6 Q46,8.5 42.5,7.5", L, 1.4);
  };
  // il pesce chirurgo blu (quello dei cartoni): blu reale, la "tavolozza" nera, la coda gialla
  PESCE.chirurgo = function () {
    var B = "M50,1 C47,-17 31,-27 9,-27 C-13,-27 -25,-15 -30,-6 L-30,6 C-25,15 -13,25 9,25 C31,25 47,16 50,1 Z";
    var tav = "M41,-8 C31,-17.5 12,-20.5 -6,-18.5 C-18,-17 -26,-10.5 -31,-3 L-31,2 C-26,-5 -16,-11 -6,-12.2 C8,-13.4 24,-10.5 38,-2.5 Z M10,-12 C8,-4 0,2.6 -10,4 C-19,5 -26,3.6 -31,2 L-31,6 C-24,9 -14,10 -6,8.4 C4,6.4 12,.5 15.5,-10.5 Z";   // la "tavolozza": la riga nera sulla schiena e il ricciolo che torna alla coda
    return pinna("M-28,-5 L-48,-22 C-43,-8 -43,8 -48,22 L-28,5 Z", lin("chC", [[0, "#ffe066"], [1, "#f59f00"]], 1, 0, 0, 0)) + tratto("M-47,-21 L-30,-6 M-47,21 L-30,6", NE, 2.6) +
      pinna("M33,-24 C12,-35 -14,-33 -28,-10 L-20,-15 C-6,-25 12,-27 33,-24 Z", "#15306e") + pinna("M30,22 C10,31 -12,30 -27,9 L-20,13 C-6,22 10,24 30,22 Z", "#15306e") +
      pelle(B, giu("chB", "#5d9cff", "#1b4fc4"), pth(tav, NE) + ell(8, 17, 26, 6, "#a5d8ff", op(.35))) +
      pinna("M22,6 C14,4 7,8 6,14 C13,16 20,12 22,6 Z", lin("chP", [[0, "#2f6fe0"], [.55, "#2f6fe0"], [1, "#ffd43b"]], 1, 0, 0, 1), 1.6) + occhio(37, -6, 5, "#1a1a1a");
  };
  // il pesce chirurgo giallo: un disco giallo limone col muso a punta, la spina bianca vicino alla coda
  PESCE.giallo = function () {
    var B = "M52,-1 C44,-6 33,-20 20,-34 C6,-46 -17,-38 -25,-8 L-25,8 C-17,38 6,46 20,34 C33,21 44,8 52,1 Z";
    return pinna("M-23,-6 L-42,-18 C-38,-6 -38,6 -42,18 L-23,6 Z", lin("giC", [[0, "#ffd43b"], [1, "#f59f00"]], 1, 0, 0, 0)) +
      pelle(B, giu("giB", "#fff27a", "#f59f00"), tratto("M33,-17 C15,-32 -8,-30 -18,-10 M33,17 C15,32 -8,30 -18,10", "#e08a00", 1.6, op(.7)) + tratto("M10,-30 L6,-12 M0,-32 L-3,-12 M-9,-28 L-11,-10 M10,30 L6,12 M0,32 L-3,12 M-9,28 L-11,10", "#f5a900", 1, op(.5)), [14, -18, 16, 6]) +
      ell(-19, 0, 3.6, 2, "#ffffff", bordo(L, .8)) + pinna("M20,4 C13,2 8,6 8,11 C13,12 18,9 20,4 Z", "#ffc61a", 1.4) + occhio(30, -7, 5, "#1a1a1a");
  };
  // il pesce angelo imperatore: blu con le righe gialle, la maschera scura sull'occhio, la coda gialla
  PESCE.imperatore = function () {
    var B = "M47,3 C44,-15 27,-27 5,-28 C-15,-28 -25,-15 -29,-5 L-29,5 C-25,15 -15,28 5,28 C27,28 44,19 47,3 Z", r = "", i;
    for (i = 0; i < 10; i++) { var y0 = -26 + i * 5.6; r += tratto("M20," + f1(y0 + 2) + " C6," + f1(y0 - 2) + " -12," + f1(y0 - 1) + " -32," + f1(y0 + 5), "#ffd43b", 2.4); }
    var faccia = pth("M47,3 C44,-15 30,-25 19,-28 C23,-10 23,12 19,28 C30,26 44,19 47,3 Z", "#cfe9ff") + pth("M38,-20 C31,-8 31,8 35,18 L27,20 C23,8 23,-8 29,-22 Z", "#0d1f52", "stroke='#74c0fc' stroke-width='1.6'") + pth("M21,-28 C17,-10 17,12 21,28 L15,28 C11,10 11,-10 15,-28 Z", "#0d1f52", "stroke='#74c0fc' stroke-width='1.4'");
    return pinna("M-27,-5 C-37,-16 -47,-15 -49,-6 L-49,6 C-47,15 -37,16 -27,5 Z", lin("imC", [[0, "#ffe066"], [1, "#f08c00"]], 1, 0, 0, 0)) +
      pinna("M20,-26 C0,-37 -20,-33 -33,-16 L-24,-13 Z", "#1c4fc0") + pinna("M15,26 C0,37 -20,33 -32,15 L-24,12 Z", "#14306e") + tratto("M10,30 C-4,33 -16,29 -26,18", "#74c0fc", 1.2) +
      pelle(B, giu("imB", "#3d7cf0", "#16389c"), r + faccia) + occhio(32, -5, 4.6, "#1a1a1a");
  };
  // il gramma reale: viola davanti e giallo dietro, piccolino
  PESCE.gramma = function () {
    var B = "M50,1 C42,-13 16,-17 -8,-16 C-22,-15 -28,-7 -30,0 C-28,7 -22,15 -8,16 C16,17 42,13 50,1 Z";
    return pinna("M-28,-3 L-46,-14 C-42,-4 -42,4 -46,14 L-28,3 Z", "#ffc61a") + pinna("M30,-13 C15,-22 -10,-22 -24,-11 Z", lin("grD", [[0, "#ffc61a"], [.45, "#ffc61a"], [.55, "#b33bd0"], [1, "#b33bd0"]], 0, 0, 1, 0)) + cer(22, -15.5, 2.6, NE) +
      pelle(B, lin("grB", [[0, "#ffd43b"], [.44, "#fcc419"], [.52, "#c13ad6"], [1, "#9c2fb8"]], 0, 0, 1, 0), tratto("M47,-3 L31,-8", "#3b0d4a", 1.6), [14, -9, 18, 3.4]) + occhio(38, -3, 4, "#1a1a1a");
  };
  // la castagnola verde-azzurra (in branco)
  PESCE.castagnola = function () {
    return pinna("M-28,-3 L-50,-21 L-41,0 L-50,21 L-28,3 Z", "#3bc9db") + pelle("M50,1 C42,-15 15,-19 -8,-17 C-22,-14 -28,-6 -30,0 C-28,6 -22,14 -8,17 C15,19 42,15 50,1 Z", giu("caB", "#c5f6fa", "#1098ad"), "", [12, -8, 18, 3.6]) + occhio(37, -3, 4.6, "#1a1a1a");
  };
  // il persico reale: verde oliva e dorato con le fasce scure, la pinna spinosa con la macchia nera, le pinne di sotto arancioni
  PESCE.persico = function () {
    var B = "M50,4 C46,-9 36,-15 22,-20 C6,-25 -13,-20 -31,-6 L-31,6 C-13,16 10,18 26,16 C38,15 46,11 50,4 Z", f = "", i;
    for (i = 0; i < 6; i++) { var x = 28 - i * 10.5; f += pth("M" + f1(x - 3.6) + ",-28 L" + f1(x + 3.6) + ",-28 L" + f1(x + 1.2) + ",7 L" + f1(x - 1.2) + ",7 Z", "#2a3a12", op(.5)); }
    return pinna("M-29,-5 L-50,-20 C-45,-6 -45,6 -50,20 L-29,5 Z", giu("peC", "#93a03c", "#e8590c")) +
      pinna("M21,-20 L18,-33 L13,-24 L9,-35 L4,-25 L0,-34 L-5,-24 L-9,-31 L-12,-19 Z", "#8f9d5c", 1.6) + cer(-6, -26, 2.6, NE) + pinna("M-13,-18 C-16,-28 -24,-25 -28,-10 Z", "#8f9d5c", 1.6) +
      pinna("M16,15 C17,27 9,28 6,16 Z", "#f0592b", 1.6) + pinna("M-10,14 C-13,25 -21,23 -25,9 Z", "#f0592b", 1.6) +
      pelle(B, lin("peB", [[0, "#56751f"], [.45, "#b4c25a"], [.8, "#ece6b8"], [1, "#f7f3dc"]], 0, 0, 0, 1), f) + pinna("M24,2 C17,0 12,4 12,9 C17,10 22,7 24,2 Z", "#d9a441", 1.4) + occhio(38, -4, 5, "#e8b923");
  };
  // la trota fario: bruna e dorata coi puntini neri e rossi (i rossi con l'alone chiaro), la pinnetta adiposa
  PESCE.trota = function () {
    var B = "M50,2 C45,-8 30,-14 10,-15 C-10,-16 -24,-10 -32,-5 L-32,5 C-24,10 -10,15 10,14 C30,13 45,10 50,2 Z", r = rnd(77), m = "", i;
    for (i = 0; i < 16; i++) m += cer(-24 + r() * 58, -12 + r() * 10, .9 + r() * .9, NE, op(.85));
    for (i = 0; i < 7; i++) { var x = -20 + i * 8 + r() * 3, y = 1 + r() * 4; m += cer(x, y, 2.3, "#f3e3c3", op(.9)) + cer(x, y, 1.3, "#d6402b"); }
    return pinna("M-30,-4 L-49,-15 C-46,-5 -46,5 -49,15 L-30,4 Z", "#7a6036") + pinna("M10,-14.5 C7,-25 -4,-25 -7,-14 Z", "#8a6d3b", 1.6) + cer(3, -18, 1, NE) + cer(-1, -20, .9, NE) +
      pinna("M-19,-10.5 C-20,-15 -25,-15 -25,-9 Z", "#c0582b", 1.4) + pinna("M-2,14 C-4,21 -10,21 -12,13 Z", "#c99b55", 1.4) + pinna("M-14,11 C-16,18 -22,17 -24,8 Z", "#c99b55", 1.4) +
      pelle(B, lin("trB", [[0, "#5e4a2a"], [.4, "#a8864a"], [.7, "#e2c486"], [1, "#f7ecd0"]], 0, 0, 0, 1), m, [12, -8, 20, 3]) + pinna("M26,3 C20,2 16,6 16,9 C21,10 25,7 26,3 Z", "#c99b55", 1.4) + occhio(38, -3, 4.5, "#d9a441");
  };
  // la carpa: bronzo e oro con le squame grandi, la pinna di sopra lunga, i baffetti
  PESCE.carpa = function () {
    var B = "M50,5 C46,-9 32,-19 12,-21 C-10,-23 -24,-13 -32,-6 L-32,6 C-22,15 -6,20 14,19 C32,18 46,13 50,5 Z", sq = "", j, x;
    [-14, -7, 0, 7, 13].forEach(function (y, k) { for (x = 30 - (k % 2) * 3.5, j = 0; x > -26; x -= 7, j++) sq += "<path d='M" + f1(x) + "," + f1(y - 3.2) + " A3.4,3.4 0 0,0 " + f1(x) + "," + f1(y + 3.2) + "' fill='none' stroke='#6e4a16' stroke-width='1.1' opacity='.45'/>"; });
    return pinna("M-30,-5 L-50,-23 C-44,-8 -44,8 -50,23 L-30,5 Z", lin("caC", [[0, "#9c6a24"], [1, "#c4792b"]], 1, 0, 0, 0)) + pinna("M12,-20.5 C10,-31 4,-32 0,-29 L-23,-15 L-24,-11 Z", "#8a5f22", 1.6) +
      pinna("M10,18 C9,26 3,27 1,18 Z", "#a8692a", 1.4) + pinna("M-12,15 C-14,23 -20,22 -23,11 Z", "#a8692a", 1.4) +
      pelle(B, lin("caB", [[0, "#6e4a16"], [.4, "#b8862e"], [.75, "#e5c27a"], [1, "#f3e3bb"]], 0, 0, 0, 1), sq) +
      pinna("M26,6 C20,4 15,8 15,12 C20,14 24,10 26,6 Z", "#a8692a", 1.4) + tratto("M47,7 Q50,12 46,15 M49,5 Q54,8 52,12", L, 1.1) + occhio(37, -3, 4.2, "#c99b55");
  };
  // il persico sole: tondo, la pancia arancione, le righe azzurre sulla guancia, la macchia nera dell'orecchio col bordo rosso
  PESCE.sole = function () {
    var B = "M50,2 C47,-18 30,-30 6,-30 C-14,-30 -26,-16 -30,-6 L-30,6 C-26,18 -12,30 8,30 C30,30 47,20 50,2 Z", r = rnd(31), m = "", i;
    for (i = 0; i < 18; i++) m += cer(-24 + r() * 44, -22 + r() * 40, 1 + r() * 1.3, r() < .55 ? "#ff922b" : "#3bc9db", op(.75));
    m += tratto("M48,-4 C42,-2 38,-8 30,-5 M49,3 C42,5 36,0 28,3 M46,10 C40,12 34,8 27,11", "#22b8cf", 2);
    return pinna("M-28,-5 L-45,-18 C-41,-6 -41,6 -45,18 L-28,5 Z", "#7d8c3c") + pinna("M22,-29 L18,-40 L12,-31 L7,-41 L2,-32 L-4,-40 L-8,-30 C-16,-36 -24,-30 -27,-12 Z", "#6f7f38", 1.6) +
      pinna("M0,29 C-8,38 -20,33 -26,12 Z", "#e67700", 1.6) + pinna("M18,27 C17,36 10,37 8,28 Z", "#e67700", 1.4) +
      pelle(B, lin("soB", [[0, "#5f7a3a"], [.35, "#9aa84a"], [.65, "#f2a33a"], [1, "#ff8c1a"]], 0, 0, 0, 1), m + ell(17, -3, 4.8, 3.2, NE) + cer(21, -3, 1.8, "#ff3b3b"), [8, -18, 18, 5]) +
      pinna("M22,4 C15,2 10,6 10,11 C15,12 20,9 22,4 Z", "#f2a33a", 1.4) + occhio(37, -8, 5, "#d9480f");
  };
  // il pesce rosso con la coda a velo (quello dell'acquario piccolo)
  PESCE.rosso = function () {
    var cd = "M-24,-3 C-34,-20 -50,-30 -55,-16 C-50,-8 -46,-3 -50,2 C-47,6 -50,10 -55,20 C-48,30 -33,20 -24,4 Z";
    return pinna(cd, lin("roC", [[0, "#ffd8a8", .95], [1, "#ff922b", .85]], 1, 0, 0, 0), 1.6) + dentro(cd, tratto("M-26,0 L-52,-18 M-26,0 L-50,-4 M-26,1 L-50,8 M-26,2 L-52,20", "#e8590c", 1, op(.6))) +
      pinna("M8,-24 C2,-36 -12,-36 -16,-21 Z", "#ff922b", 1.6) + pinna("M-10,20 C-14,28 -20,27 -22,17 Z", "#ff922b", 1.4) +
      pelle("M34,0 C32,-17 14,-25 -4,-23 C-18,-21 -25,-11 -27,0 C-25,11 -18,21 -4,23 C14,25 32,17 34,0 Z", giu("roB", "#ffc078", "#e8590c"), "", [4, -13, 14, 4.5]) +
      pinna("M14,6 C8,5 4,9 5,13 C10,14 14,10 14,6 Z", "#ffa94d", 1.3) + occhio(21, -5, 7, "#2b1a10") + tratto("M33,4 Q31,6 28,5.5", L, 1.3);
  };
  // il pesciolino rosa
  PESCE.rosa = function () {
    return pinna("M-24,-3 C-34,-18 -48,-22 -52,-10 C-48,-3 -48,3 -52,10 C-48,22 -34,18 -24,3 Z", lin("rsC", [[0, "#ffc9de", .95], [1, "#f06595", .9]], 1, 0, 0, 0), 1.6) +
      pinna("M6,-19 C0,-30 -14,-28 -18,-15 Z", "#f06595", 1.6) + pelle("M38,0 C35,-15 16,-21 -2,-19 C-16,-17 -24,-9 -27,0 C-24,9 -16,17 -2,19 C16,21 35,15 38,0 Z", giu("rsB", "#ffb3cf", "#c2255c"), "", [6, -11, 15, 4]) +
      pinna("M15,5 C9,4 5,8 6,12 C11,13 15,9 15,5 Z", "#faa2c1", 1.3) + occhio(24, -4, 6, "#2b1a10");
  };
  // un pesce nella vasca, lungo Lp, che nuota lungo l'asse "a" o "b" del mobile (verso 1 / −1): di lato e un po' in diagonale come il vetro
  function metti(nome, a, b, z, Lp, asse, verso) {
    var c = P(a, b, z), s = verso * G, m = asse === "a" ? (s > 0 ? [.82, .41] : [-.82, -.41]) : (s > 0 ? [-.82, .41] : [.82, -.41]), k = Lp / 100;
    return "<g transform='matrix(" + [m[0] * k, m[1] * k, 0, k, c[0], c[1]].map(f2).join(" ") + ")'>" + PESCE[nome]() + "</g>";
  }

  // =========================================================
  //  LE COSE DENTRO LA VASCA (disegnate di fronte, appoggiate sul fondo nel punto x, y)
  // =========================================================
  function roccia(x, y, w, h, c, seme, macchie) {   // una roccia viva: bitorzoluta, piatta sotto, coi buchini e le macchie colorate
    var r = rnd(seme), pp = [], n = 18, i, tex = "";
    for (i = 0; i < n; i++) { var t = Math.PI + i / (n - 1) * Math.PI, f = i === 0 || i === n - 1 ? 1 : 1 + (r() - .5) * .38; pp.push([x + Math.cos(t) * w / 2 * f, y + Math.sin(t) * h * f]); }
    var d = curva(pp) + " Q" + q(x, y + 2.6) + " " + q(pp[0]) + " Z";
    for (i = 0; i < 18; i++) tex += cer(x + (r() - .5) * w * .9, y - r() * h * .9, .45 + r() * .9, scuro(c, .42), op(.4));
    (macchie || []).forEach(function (mc) { for (i = 0; i < 3; i++) tex += ell(x + (r() - .5) * w * .8, y - h * (.12 + r() * .72), 2.2 + r() * 3.6, 1.4 + r() * 2, mc, op(.9)); });
    tex += ell(x - w * .18, y - h * .78, w * .16, h * .12, "#ffffff", op(.28));
    return pth(d, rad("rc" + c.slice(1), [[0, chiaro(c, .38)], [.55, c], [1, scuro(c, .38)]], .35, .25, .85)) + dentro(d, tex) + pth(d, "none", bordo(L, 1.3));
  }
  function sasso(x, y, rx, ry, c, seme) {   // un sasso di fiume, liscio e tondo
    var pp = [], r = rnd(seme), i, n = 12;
    for (i = 0; i < n; i++) { var t = i / n * 6.2832, f = 1 + (r() - .5) * .16; pp.push([x + Math.cos(t) * rx * f, y - ry + Math.sin(t) * ry * f]); }
    return pth(morbido(pp), rad("ss" + c.slice(1), [[0, chiaro(c, .45)], [.6, c], [1, scuro(c, .38)]], .35, .3, .8), bordo(L, 1)) + ell(x - rx * .35, y - ry * 1.45, rx * .32, ry * .2, "#ffffff", op(.45));
  }
  function cervello(x, y, r, c) {   // il corallo cervello: la cupola coi solchi a labirinto
    var d = "M" + q(x - r, y) + " C" + q(x - r, y - r * 1.15) + " " + q(x + r, y - r * 1.15) + " " + q(x + r, y) + " Z", s = "", i, j;
    for (i = 0; i < 5; i++) { var yy = y - r * (.1 + i * .17), dd = "M" + q(x - r, yy); for (j = 1; j <= 8; j++) dd += " Q" + q(x - r + (j - .5) * r / 4, yy + (j % 2 ? -1.5 : 1.5)) + " " + q(x - r + j * r / 4, yy); s += tratto(dd, scuro(c, .42), .7, op(.75)); }
    return pth(d, rad("cv" + c.slice(1), [[0, chiaro(c, .5)], [.55, c], [1, scuro(c, .3)]], .35, .25, .85)) + dentro(d, s + ell(x - r * .35, y - r * .62, r * .25, r * .12, "#ffffff", op(.4))) + pth(d, "none", bordo(L, 1.2));
  }
  function ramificato(x, y, h, c, seme, w0) {   // il corallo a corna di cervo: i rami che si dividono, le punte chiare
    var r = rnd(seme), seg = [], punte = [], s = "";
    function ramo(x0, y0, ang, len, w, k) {
      var x1 = x0 + Math.sin(ang) * len, y1 = y0 - Math.cos(ang) * len;
      seg.push([x0, y0, x1, y1, w]);
      if (k > 0) { ramo(x1, y1, ang - .3 - r() * .35, len * (.68 + r() * .14), w * .8, k - 1); ramo(x1, y1, ang + .3 + r() * .35, len * (.68 + r() * .14), w * .8, k - 1); }
      else punte.push([x1, y1, w]);
    }
    ramo(x, y, (r() - .5) * .3, h * .38, w0 || 3.2, 3);
    seg.forEach(function (g) { s += tratto(linea([g[0], g[1]], [g[2], g[3]]), L, g[4] + 1.5); });
    seg.forEach(function (g) { s += tratto(linea([g[0], g[1]], [g[2], g[3]]), c, g[4]); });
    seg.forEach(function (g) { s += tratto(linea([g[0] - g[4] * .22, g[1]], [g[2] - g[4] * .22, g[3]]), chiaro(c, .42), g[4] * .32, op(.75)); });
    punte.forEach(function (t) { s += cer(t[0], t[1], t[2] * .55, chiaro(c, .62)); });
    return s;
  }
  function ventaglio(x, y, w, h, c) {   // la gorgonia: un ventaglio di rami fitti, quasi piatto
    var d = "M" + q(x - 1.2, y - h * .1) + " C" + q(x - w * .62, y - h * .3) + " " + q(x - w * .58, y - h * 1.04) + " " + q(x, y - h) + " C" + q(x + w * .58, y - h * 1.04) + " " + q(x + w * .62, y - h * .3) + " " + q(x + 1.2, y - h * .1) + " Z", s = "", i;
    for (i = 0; i < 11; i++) { var t = (i + .5) / 11, ex = x - w * .55 + t * w * 1.1, ey = y - h * (.5 + .52 * Math.sin(t * Math.PI)); s += tratto("M" + q(x, y - h * .08) + " Q" + q(x + (ex - x) * .45, y - h * .55) + " " + q(ex, ey), scuro(c, .32), .9, op(.85)); }
    for (i = 1; i < 5; i++) { var k = i / 5; s += tratto("M" + q(x - w * .5 * k - w * .1, y - h * (.15 + .7 * k)) + " Q" + q(x, y - h * (.32 + .78 * k)) + " " + q(x + w * .5 * k + w * .1, y - h * (.15 + .7 * k)), scuro(c, .25), .6, op(.65)); }
    return tratto(linea([x, y], [x, y - h * .12]), L, 3.2) + tratto(linea([x, y], [x, y - h * .12]), scuro(c, .3), 1.8) +
      pth(d, lin("vt" + c.slice(1), [[0, chiaro(c, .28)], [1, scuro(c, .15)]], 0, 0, 1, 1), op(.95)) + dentro(d, s) + pth(d, "none", "stroke='" + scuro(c, .55) + "' stroke-width='.9' stroke-linejoin='round'");
  }
  function anemone(x, y, r, c, punta, seme) {   // l'anemone coi tentacoli a bulbo (la casa dei pesci pagliaccio)
    var rr = rnd(seme), n = 17, i, sd = "", sv = "";
    for (i = 0; i < n; i++) {
      var t = (i + rr() * .5) / n, ang = -1.25 + t * 2.5, lun = r * (.7 + rr() * .38), bx = x + Math.sin(ang) * r * .62, by = y - r * .22,
        tx = bx + Math.sin(ang) * lun * .85, ty = by - Math.cos(ang) * lun, mx = bx + Math.sin(ang) * lun * .35 + (rr() - .5) * 3, my = by - lun * .55;
      var dd = "M" + q(bx, by) + " Q" + q(mx, my) + " " + q(tx, ty), t2 = tratto(dd, L, 3.7) + tratto(dd, c, 2.5) + tratto(dd, chiaro(c, .4), .8, op(.7)) + cer(tx, ty, 1.8, punta, bordo(L, .6)) + cer(tx - .5, ty - .6, .6, "#ffffff", op(.75));
      if (i % 2) sd += t2; else sv += t2;
    }
    return sd + ell(x, y - r * .2, r * .78, r * .3, scuro(c, .32), bordo(L, 1)) + sv;
  }
  function tubi(x, y, h, c) {   // le spugne a tubo
    var s = "";
    [[-5, .75, 2.6], [5, .6, 2.3], [0, 1, 3], [2.6, .42, 2]].forEach(function (t) {
      var cx = x + t[0], hh = h * t[1], w = t[2], top = y - hh;
      s += pth("M" + q(cx - w, y) + " L" + q(cx - w * 1.1, top) + " A" + f1(w * 1.1) + "," + f1(w * .5) + " 0 0,1 " + q(cx + w * 1.1, top) + " L" + q(cx + w, y) + " Z", lin("tb" + c.slice(1), [[0, chiaro(c, .38)], [.5, c], [1, scuro(c, .3)]], 0, 0, 1, 0), bordo(L, .9));
      s += ell(cx, top, w * 1.1, w * .5, chiaro(c, .3), bordo(L, .8)) + ell(cx, top + .2, w * .72, w * .3, scuro(c, .6));
    });
    return s;
  }
  function tavola(x, y, r, c) {   // l'acropora a tavola: un piatto largo sul gambo corto, coi polipi
    var s = tratto(linea([x, y + 6], [x, y]), L, 4) + tratto(linea([x, y + 6], [x, y]), scuro(c, .2), 2.6) + ell(x, y + 1.2, r, r * .42, scuro(c, .35), bordo(L, 1)) + ell(x, y, r, r * .42, rad("tv" + c.slice(1), [[0, chiaro(c, .55)], [.6, c], [1, scuro(c, .2)]], .4, .35, .8), bordo(L, 1)), r2 = rnd(5), i;
    for (i = 0; i < 14; i++) { var t = r2() * 6.28, d = Math.sqrt(r2()) * .8; s += cer(x + Math.cos(t) * r * d, y + Math.sin(t) * r * .42 * d, .5, chiaro(c, .7), op(.85)); }
    return s;
  }
  function fungo(x, y, r, c) {   // il corallo a fungo: un disco con le righe e la bocca in mezzo
    var s = ell(x, y, r, r * .5, rad("fg" + c.slice(1), [[0, chiaro(c, .55)], [.6, c], [1, scuro(c, .3)]], .4, .35, .75), bordo(L, .8)), i;
    for (i = 0; i < 10; i++) { var t = i / 10 * 6.2832; s += tratto(linea([x + Math.cos(t) * r * .25, y + Math.sin(t) * r * .12], [x + Math.cos(t) * r * .85, y + Math.sin(t) * r * .42]), scuro(c, .3), .45, op(.6)); }
    return s + ell(x, y, r * .18, r * .09, scuro(c, .5)) + ell(x - r * .3, y - r * .18, r * .25, r * .08, "#ffffff", op(.45));
  }
  function nastri(x, y, h, c, n, seme, larg, piega) {   // le piante a nastro, un po' piegate dalla corrente (ferme)
    var r = rnd(seme), s = "", i;
    for (i = 0; i < n; i++) {
      var bx = x + (i - (n - 1) / 2) * (larg || 1.6) * 1.2 + (r() - .5), hh = h * (.62 + r() * .42), sw = (piega || 0) + (r() - .5) * 9, w = (larg || 1.6) * (.85 + r() * .3);
      var c1 = [bx + sw * .15, y - hh * .38], c2 = [bx + sw * .55, y - hh * .72], tp = [bx + sw, y - hh];
      var d = "M" + q(bx - w, y) + " C" + q(c1[0] - w, c1[1]) + " " + q(c2[0] - w * .6, c2[1]) + " " + q(tp) + " C" + q(c2[0] + w * .6, c2[1]) + " " + q(c1[0] + w, c1[1]) + " " + q(bx + w, y) + " Z";
      var cc = [c, chiaro(c, .2), scuro(c, .15)][i % 3];
      s += pth(d, lin("na" + cc.slice(1), [[0, chiaro(cc, .32)], [1, scuro(cc, .3)]], 0, 0, 1, 0), "stroke='" + scuro(c, .5) + "' stroke-width='.6' stroke-linejoin='round'") + tratto("M" + q(bx, y) + " C" + q(c1) + " " + q(c2) + " " + q(tp), chiaro(cc, .5), .35, op(.6));
    }
    return s;
  }
  function piumetta(x, y, h, c, seme) {   // l'elodea: il fusto con le foglioline a stella
    var r = rnd(seme), s = "", i, k, d = "M" + q(x, y) + " Q" + q(x + 3, y - h * .5) + " " + q(x + 1, y - h);
    s += tratto(d, scuro(c, .45), 1.7) + tratto(d, c, .9);
    for (i = 1; i <= 10; i++) {
      var t = i / 10, px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * (x + 3) + t * t * (x + 1), py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * (y - h * .5) + t * t * (y - h), lf = 3.4 * (1 - t * .45);
      for (k = 0; k < 4; k++) { var an = k * 1.5708 + i * .7 + r() * .3; s += tratto(linea([px, py], [px + Math.cos(an) * lf, py + Math.sin(an) * lf * .45 - .8]), k % 2 ? c : chiaro(c, .2), 1); }
    }
    return s;
  }
  function polipi(x, y, r, c, centro, seme) {   // gli zoantidi: tanti polipetti a disco, verdi col centro arancione
    var rr = rnd(seme), s = "", i;
    for (i = 0; i < 9; i++) { var t = rr() * 6.28, d = Math.sqrt(rr()) * r, px = x + Math.cos(t) * d, py = y + Math.sin(t) * d * .5; s += ell(px, py + .6, 1.9, 1.1, scuro(c, .35)) + ell(px, py, 1.9, 1.1, c, bordo(L, .4)) + ell(px, py, .8, .45, centro); }
    return s;
  }
  function conchiglia(x, y, r, c) {   // una conchiglia a ventaglio sulla sabbia
    var d = "M" + q(x, y) + " L" + q(x - r, y - r * .45) + " Q" + q(x, y - r * 1.3) + " " + q(x + r, y - r * .45) + " Z", s = "", i;
    for (i = 1; i < 6; i++) { var t = Math.PI * (1 + i / 6); s += tratto(linea([x, y], [x + Math.cos(t) * r * .95, y + Math.sin(t) * r * .82]), scuro(c, .3), .45, op(.7)); }
    return pth(d, lin("cg" + c.slice(1), [[0, chiaro(c, .4)], [1, scuro(c, .15)]], 0, 0, 1, 1), bordo(L, .8)) + dentro(d, s);
  }
  function bolle(x, y0, y1, seme, n, k) {   // le bollicine che salgono (più grandi in alto), un po' storte
    var r = rnd(seme), s = "", i;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1), y = y0 + (y1 - y0) * t, rr = (.7 + t * 1.3) * (k || 1) * (.8 + r() * .4), xx = x + Math.sin(i * 1.7 + seme) * (.8 + t * 2.2);
      s += cer(xx, y, rr, "#ffffff", op(.14)) + cer(xx, y, rr, "none", "stroke='#ffffff' stroke-width='" + f1(Math.max(.35, rr * .28)) + "' opacity='.85'") + cer(xx - rr * .35, y - rr * .35, rr * .3, "#ffffff", op(.95));
    }
    return s;
  }
  function stella(a, b, z, R, c, rot) {   // la stella marina appoggiata sulla sabbia (vista da sopra), coi bitorzoli
    var pp = [], i, A = a * 100, B = b * 100, RR = R * 100, pal = "";
    for (i = 0; i < 10; i++) { var t = rot + i * .6283, rr = i % 2 ? RR * .42 : RR; pp.push([A + Math.cos(t) * rr, B + Math.sin(t) * rr]); }
    for (i = 0; i < 5; i++) { var t2 = rot + i * 1.2566, k; for (k = 1; k <= 3; k++) pal += cer(A + Math.cos(t2) * RR * k * .24, B + Math.sin(t2) * RR * k * .24, .65, chiaro(c, .55)); }
    return inPiano(z, poly(pp, L, "stroke='" + L + "' stroke-width='4.4' stroke-linejoin='round'") + poly(pp, rad("st" + c.slice(1), [[0, chiaro(c, .35)], [.7, c], [1, scuro(c, .2)]], .45, .45, .6), "stroke='" + c + "' stroke-width='2.4' stroke-linejoin='round'") + pal);
  }

  // =========================================================
  //  LA VASCA DI VETRO: dentro l'acqua, la sabbia, le cose e i pesci; poi il pelo dell'acqua e il vetro coi riflessi
  //  V = { a0, a1, b0, b1 (il vetro), z0 (il fondo), z1 (il bordo), zw (il pelo dell'acqua), zsF / zsB (la sabbia davanti / dietro) }
  // =========================================================
  function zSab(V, b) { return V.zsF + (V.zsB - V.zsF) * (V.b1 - b) / (V.b1 - V.b0); }   // la sabbia sale verso il vetro di dietro
  function scatola(V, za, zb) { var l = []; [V.a0, V.a1].forEach(function (a) { [V.b0, V.b1].forEach(function (b) { l.push(P(a, b, za), P(a, b, zb)); }); }); return inviluppo(l); }
  function raggi(sil, k, c, seme) {   // i raggi di luce che scendono nell'acqua, un po' storti (la luce viene da in alto a sinistra)
    var b = limiti(sil), r = rnd(seme), s = "", i, n = 6;
    for (i = 0; i < n; i++) {
      var x = b[0] + (b[2] - b[0]) * (.04 + i / n + r() * .05), w = 4 + r() * 9, dx = (b[3] - b[1]) * .22;
      s += poly([[x, b[1]], [x + w, b[1]], [x + w * 1.8 + dx, b[3]], [x + dx - w * .4, b[3]]], nuova([[0, c, k * (.55 + r() * .45)], [.65, c, k * .22], [1, c, 0]], 0, 0, 0, 1));
    }
    return s;
  }
  // o = { acqua: [in alto, in mezzo, in fondo], sabbia: [chiara, scura], sassolini: [colori], nSass (quanti), kSass (quanto grandi), cose: [[a, b, disegno]], velo (quanto si vede l'acqua sulla sabbia), raggi,
  //       sfondo(), sopra(), cornice(W, H, lato), aperta (senza coperchio: si vede dentro anche dal pelo dell'acqua), telaio (ha già il suo bordo sopra), seme }
  function vasca(V, o) {
    var a0 = V.a0, a1 = V.a1, b0 = V.b0, b1 = V.b1, z0 = V.z0, z1 = V.z1, zw = V.zw, ac = o.acqua, r = rnd(o.seme || 7), i;
    var aN = G > 0 ? a1 : a0, aF = G > 0 ? a0 : a1, bN = G > 0 ? b1 : b0, bF = G > 0 ? b0 : b1;   // i lati vicini e quelli lontani (da dietro si scambiano)
    var silA = scatola(V, z0, zw), dA = chiuso(silA), bA = limiti(silA), s = "", w = "";
    // 1. l'acqua: chiara in alto, più blu giù; i vetri lontani visti attraverso l'acqua sono un po' più scuri
    w += pth(dA, lin("aq", [[0, ac[0]], [.5, ac[1]], [1, ac[2]]], 0, bA[1], 0, bA[3], true));
    w += poly([P(a0, bF, z0), P(a1, bF, z0), P(a1, bF, zw), P(a0, bF, zw)], ac[2], op(.14)) + poly([P(aF, b0, z0), P(aF, b1, z0), P(aF, b1, zw), P(aF, b0, zw)], ac[2], op(.24));
    w += tratto(linea(P(aF, bF, z0), P(aF, bF, zw)), "#ffffff", .7, op(.3));   // lo spigolo lontano
    if (o.sfondo) w += o.sfondo(bF);
    // 2. la sabbia: il piano di sopra coi granelli, i sassolini e le macchie di luce
    var sab = [P(a0, b0, zSab(V, b0)), P(a1, b0, zSab(V, b0)), P(a1, b1, zSab(V, b1)), P(a0, b1, zSab(V, b1))], gr = "";
    for (i = 0; i < Math.round((a1 - a0) * (b1 - b0) * 55); i++) { var ga = a0 + r() * (a1 - a0), gb = b0 + r() * (b1 - b0), pg = P(ga, gb, zSab(V, gb)); gr += ell(pg[0], pg[1], .5 + r() * .9, .3 + r() * .5, r() < .5 ? scuro(o.sabbia[1], .22) : chiaro(o.sabbia[0], .55), op(.6)); }
    for (i = 0; i < (o.sassolini ? (o.nSass == null ? 26 : o.nSass) : 0); i++) { var sa = a0 + .03 + r() * (a1 - a0 - .06), sb = b0 + .03 + r() * (b1 - b0 - .06), ps = P(sa, sb, zSab(V, sb)), cs = o.sassolini[i % o.sassolini.length]; gr += ell(ps[0], ps[1] - .5, (1.2 + r() * 1.1) * (o.kSass || 1), (.8 + r() * .6) * (o.kSass || 1), cs, "stroke='" + scuro(cs, .45) + "' stroke-width='.4'") + ell(ps[0] - .4, ps[1] - .9, .5, .3, "#ffffff", op(.6)); }
    var cst = "", zm = (V.zsF + V.zsB) / 2;   // le macchie di luce che ballano sulla sabbia (le caustiche)
    for (i = 0; i < 30; i++) { var ca = (a0 + .05 + r() * (a1 - a0 - .1)) * 100, cb = (b0 + .04 + r() * (b1 - b0 - .08)) * 100, l = 4 + r() * 6; cst += trattoP("M" + q(ca - l, cb) + " Q" + q(ca - l / 2, cb - 2.4) + " " + q(ca, cb) + " T" + q(ca + l, cb), "#ffffff", .8, op((NOTTE ? .55 : .4) * (.5 + r() * .5))); }
    w += poly(sab, lin("sb", [[0, o.sabbia[0]], [1, o.sabbia[1]]], 0, 0, 1, 1)) + dentro(chiuso(sab), gr + inPiano(zm, cst)) + tratto(aperto([P(aF, bF, zSab(V, bF)), P(aN, bF, zSab(V, bF))]), scuro(o.sabbia[1], .3), .6, op(.4));
    // 3. le cose dentro, dalla più lontana; prima un velo d'acqua sulla sabbia, poi un altro a metà strada (quelle in fondo sembrano più lontane)
    w += pth(dA, ac[1], op(o.velo || .24));
    if (NOTTE && o.bagliore) w += pth(dA, lin("bg", [[0, chiaro(ac[0], .7), o.bagliore], [.55, chiaro(ac[0], .4), o.bagliore * .5], [1, ac[1], o.bagliore * .2]], 0, bA[1], 0, bA[3], true));   // di notte l'acqua illuminata buca il buio
    var lista = o.cose.slice().sort(function (m, n) { return vicino(m[0], m[1]) - vicino(n[0], n[1]); }), velo = false;
    lista.forEach(function (c) { if (!velo && vicino(c[0], c[1]) > 0) { w += pth(dA, ac[1], op(.14)); velo = true; } w += c[2](); });
    if (!velo) w += pth(dA, ac[1], op(.14));
    // 4. i raggi di luce dall'alto
    w += raggi(silA, (o.raggi || .16) * (NOTTE ? 1.25 : 1), "#ffffff", (o.seme || 7) + 3);
    // 5. la sabbia schiacciata contro il vetro davanti e di lato: gli strati e i sassolini
    var fd = [P(a0, bN, z0), P(a1, bN, z0), P(a1, bN, zSab(V, bN)), P(a0, bN, zSab(V, bN))], fl = [P(aN, b0, z0), P(aN, b1, z0), P(aN, b1, zSab(V, b1)), P(aN, b0, zSab(V, b0))], pf = "";
    [fd, fl].forEach(function (f, k) {
      var bb = limiti(f), t = "";
      for (i = 0; i < Math.round((bb[2] - bb[0]) * .6); i++) { var px = bb[0] + r() * (bb[2] - bb[0]), py = bb[1] + r() * (bb[3] - bb[1]) + 3, cp = o.sassolini && r() < .3 ? o.sassolini[i % o.sassolini.length] : (r() < .5 ? scuro(o.sabbia[1], .12) : chiaro(o.sabbia[0], .3)); t += ell(px, py, (.8 + r() * 1.3) * (o.kSass || 1), (.6 + r() * .8) * (o.kSass || 1), cp, "stroke='" + scuro(o.sabbia[1], .45) + "' stroke-width='.3'"); }
      pf += poly(f, lin("sf" + k, [[0, o.sabbia[0]], [1, scuro(o.sabbia[1], .18)]], 0, 0, 0, 1)) + dentro(chiuso(f), t + tratto(aperto([f[3], f[2]]), "#ffffff", 1, op(.5)));
    });
    w += pf;
    // 6. il velo davanti: la luce che entra dal pelo dell'acqua, l'acqua un po' più blu in fondo
    w += pth(dA, lin("vl", [[0, "#ffffff", NOTTE ? .1 : .1], [.2, "#ffffff", 0], [1, ac[2], .12]], 0, bA[1], 0, bA[3], true));
    if (NOTTE && o.bagliore) w += pth(dA, lin("bh", [[0, "#f2fdff", o.bagliore * .9], [.6, chiaro(ac[0], .5), 0]], 0, bA[1], 0, bA[3], true));   // e la lampada accesa schiarisce l'acqua in alto
    s += dentro(dA, w);
    // 7. il pelo dell'acqua visto da sopra (trasparente, con le increspature e il riflesso) e la riga chiara dove tocca il vetro
    var sup = [P(a0, b0, zw), P(a1, b0, zw), P(a1, b1, zw), P(a0, b1, zw)], onde = "", j;
    for (i = 0; i < 9; i++) { var ob = b0 + (i + .5) * (b1 - b0) / 9, pp = []; for (j = 0; j <= 12; j++) { var oa = a0 + (a1 - a0) * j / 12; pp.push([oa * 100, (ob + Math.sin(j * 1.3 + i * 2) * .012) * 100]); } onde += trattoP(curva(pp), "#ffffff", .8, op(.15 + (i % 2) * .15)); }
    s += poly(sup, lin("pe", [[0, "#ffffff", o.aperta ? .16 : .6], [.45, chiaro(ac[0], .3), o.aperta ? .06 : .5], [1, ac[0], o.aperta ? .14 : .6]], 0, 0, 1, 1)) + dentro(chiuso(sup), inPiano(zw, onde));
    s += tratto(aperto([P(aF, bN, zw), P(aN, bN, zw), P(aN, bF, zw)]), "#ffffff", 1.1, op(.9)) + tratto(aperto([P(aF, bN, zw), P(aF, bF, zw), P(aN, bF, zw)]), "#ffffff", .7, op(.5));
    if (o.sopra) s += o.sopra(sup);
    // 8. il vetro: l'aria sopra l'acqua, i riflessi in diagonale, la cornice; gli spigoli verdini come il vetro spesso
    var Wf = (a1 - a0) * 61, Wl = (b1 - b0) * 61, H = z1 - z0, hw = z1 - zw;
    function lastra(W, k, lato) {
      var t = rett(0, 0, W, hw, 0, nuova([[0, NOTTE ? "#e3faff" : "#ffffff", NOTTE ? .4 : .22], [1, "#ffffff", NOTTE ? .18 : .08]], 0, 0, 0, 1)) + rett(0, hw, W, H - hw, 0, "#eafcff", op(.04));
      t += poly([[W * .1, 0], [W * .1 + 9, 0], [W * .1 - 16, H], [W * .1 - 25, H]], "#ffffff", op(.15 * k)) + poly([[W * .1 + 13, 0], [W * .1 + 16, 0], [W * .1 - 9, H], [W * .1 - 12, H]], "#ffffff", op(.11 * k)) + poly([[W * .64, 0], [W * .64 + 5, 0], [W * .64 - 20, H], [W * .64 - 25, H]], "#ffffff", op(.1 * k));
      return dentro("M0,0 H" + f1(W) + " V" + f1(H) + " H0 Z", t) + (o.cornice ? o.cornice(W, H, lato) : "");
    }
    s += piano(P(aF, bN, z1), P(aN, bN, z1), P(aF, bN, z0), Wf, H, lastra(Wf, 1, "davanti")) + piano(P(aN, bN, z1), P(aN, bF, z1), P(aN, bN, z0), Wl, H, lastra(Wl, .6, "fianco"));
    [[aF, bN], [aN, bN], [aN, bF]].forEach(function (e, k) { s += tratto(linea(P(e[0], e[1], z0), P(e[0], e[1], z1)), "#c9f2e6", k === 1 ? 1.5 : 1.2, op(.9)) + (k === 1 ? tratto(linea(P(e[0], e[1], z0), P(e[0], e[1], z1)), L, .5, op(.55)) : ""); });
    if (o.aperta && !o.telaio) {   // senza coperchio né telaio: si vede il bordo di sopra dei quattro vetri, verdino
      var tb = [P(aF, bN, z1), P(aN, bN, z1), P(aN, bF, z1), P(aF, bF, z1)];
      s += tratto(chiuso(tb), "#d9f7ef", 1.6, op(.95)) + tratto(chiuso(tb), L, .45, op(.5));
    }
    return s + pth(chiuso(scatola(V, z0, z1)), "none", bordo(L, 2.2));
  }
  // il rettangolo dritto più grande tutto d'acqua (sotto il pelo, sopra la sabbia), nel disegno davanti; un po' più largo che alto
  function rettAcqua(V) {
    var g0 = G; G = 1;
    var l = [];
    [V.a0, V.a1].forEach(function (a) { [V.b0, V.b1].forEach(function (b) { l.push(P(a, b, zSab(V, b) + 2), P(a, b, V.zw - 2.5)); }); });
    var pp = inviluppo(l), b = limiti(pp), best = [0, 0, 0, 0], v = 0, cx = Math.round((b[0] + b[2]) / 2), m;
    G = g0;
    function taglio(x) { var lo = 1e9, hi = -1e9, n = pp.length, i; for (i = 0; i < n; i++) { var A = pp[i], B = pp[(i + 1) % n]; if ((A[0] - x) * (B[0] - x) <= 0 && A[0] !== B[0]) { var y = A[1] + (B[1] - A[1]) * (x - A[0]) / (B[0] - A[0]); lo = Math.min(lo, y); hi = Math.max(hi, y); } } return [lo, hi]; }
    for (m = 6; cx - m > b[0]; m++) {   // centrato in mezzo alla vasca: più largo che alto
      var t0 = taglio(cx - m), t1 = taglio(cx + m), ya = Math.max(t0[0], t1[0]), yb = Math.min(t0[1], t1[1]), val = Math.pow(2 * m, 1.5) * (yb - ya);
      if (yb - ya > 6 && val > v) { v = val; best = [cx - m, ya, 2 * m, yb - ya]; }
    }
    return best;
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  ACQUARIO GIGANTE (12.000): lungo tre mattonelle, aperto sopra, sul mobile di noce lucido con le quattro ante e i pomelli d'oro;
  //  sopra la lampada a LED sulle sue gambe, la luce scende nell'acqua. Dentro la barriera corallina: la sabbia bianca, le rocce coi coralli
  //  (cervello, corna di cervo, gorgonie, spugne a tubo, a tavola, a fungo), l'anemone coi pesci pagliaccio, il relitto del galeone pirata,
  //  il forziere da cui escono le bollicine, la stella marina; i pesci: chirurgo blu, chirurgo giallo, angelo imperatore,
  //  gramma reale e un branco di castagnole. Da dietro la schiena del mobile, i tubi del filtro e il cavo della lampada.
  // =========================================================
  var VG = { a0: -1.42, a1: 1.42, b0: -.38, b1: .38, z0: 39, z1: 96, zw: 92, zsF: 43.5, zsB: 49 };
  def("acquario_gigante", { tipo: "piedi", nome: "Acquario gigante", fp: [3, 1], box: [-99, -147, 99, 48], prezzo: 12000, V: VG, pesci: true, luce: [0, 0, 84, 140, "#7fd6ff"] }, function () {
    var V = VG, NOCE = "#7a4322", W0 = legnoT(NOCE), oro = lin("oro", ORO, 0, 0, 1, 0), s = ombraPianta(-1.48, 1.48, -.44, .44, .95, .12), i;
    function su(a, b, dz) { return P(a, b, zSab(V, b) + (dz || 0)); }
    function anta(x, y, w, h, seme) {   // un'anta di noce: la cornice smussata, il pannello in rilievo con le venature
      return rett(x, y, w, h, 1.2, lin("an", [[0, chiaro(NOCE, .14)], [1, scuro(NOCE, .1)]], 0, 0, 0, 1), "stroke='" + scuro(NOCE, .5) + "' stroke-width='.8'") +
        rett(x + 3, y + 3, w - 6, h - 6, 1, lin("ap", [[0, chiaro(NOCE, .06)], [1, scuro(NOCE, .16)]], 0, 0, 0, 1), "stroke='" + scuro(NOCE, .5) + "' stroke-width='.6'") +
        "<g transform='translate(" + f1(x + 3) + " " + f1(y + 3) + ")'>" + venature(w - 6, h - 6, NOCE, seme, true, 1.1) + "</g>" +
        tratto("M" + q(x + 1, y + h - 1) + " L" + q(x + 1, y + 1) + " L" + q(x + w - 1, y + 1), chiaro(NOCE, .5), .8, op(.8)) + tratto("M" + q(x + w - 1, y + 1.5) + " L" + q(x + w - 1, y + h - 1) + " L" + q(x + 1.5, y + h - 1), scuro(NOCE, .4), .8, op(.8));
    }
    function davanti(W, H) {   // le quattro ante coi pomelli d'oro, il filetto d'oro sotto il piano, la lacca
      var o = "", g = 2.4, dw = (W - g * 5) / 4;
      for (i = 0; i < 4; i++) { var x = g + i * (dw + g); o += anta(x, 3.6, dw, H - 7.2, 40 + i) + pomoOro(i % 2 ? x + 4.6 : x + dw - 4.6, 3.6 + (H - 7.2) / 2, 1.8); }
      o += rett(0, .9, W, .8, 0, oro) + rett(0, H - 2, W, .7, 0, oro, op(.8));
      return o + poly([[W * .08, 0], [W * .08 + 14, 0], [W * .08 - 2, H], [W * .08 - 16, H]], "#ffffff", op(.07)) + poly([[W * .55, 0], [W * .55 + 8, 0], [W * .55 - 8, H], [W * .55 - 16, H]], "#ffffff", op(.05));
    }
    function fianco(W, H) { return anta(3, 3.6, W - 6, H - 7.2, 44) + rett(0, .9, W, .8, 0, oro) + rett(0, H - 2, W, .7, 0, oro, op(.8)); }
    function schiena(W, H) {   // la schiena: il pannello con le viti, le griglie dell'aria, i buchi dei tubi e l'etichetta
      var o = venature(W, H, NOCE, 31, false, .6) + rett(2.5, 2.5, W - 5, H - 5, 1, "none", "stroke='" + scuro(NOCE, .35) + "' stroke-width='.9'"), k;
      [[4.5, 4.5], [W - 4.5, 4.5], [4.5, H - 4.5], [W - 4.5, H - 4.5], [W / 2, 4.5], [W / 2, H - 4.5]].forEach(function (v) { o += cer(v[0], v[1], .8, scuro(NOCE, .5)); });
      [W * .3, W * .62].forEach(function (x) { o += rett(x, 9, 24, 13, 1.5, scuro(NOCE, .45)); for (k = 0; k < 5; k++) o += rett(x + 2, 10.5 + k * 2.3, 20, 1.1, .5, "#1b0f08"); });
      o += cer(W * .1, 6.5, 2.4, "#1b0f08", bordo(L, .6)) + cer(W * .14, 6.5, 2.4, "#1b0f08", bordo(L, .6)) + cer(W * .06, 6.5, 1.8, "#1b0f08", bordo(L, .6));   // i buchi dei tubi e del cavo
      return o + rett(W * .78, 12, 16, 8, .8, "#f1f3f5", bordo("#868e96", .4)) + rett(W * .78 + 1.6, 13.6, 9, 1, 0, "#495057") + rett(W * .78 + 1.6, 15.6, 12, .6, 0, "#adb5bd") + rett(W * .78 + 1.6, 17.2, 7, .6, 0, "#adb5bd");
    }
    function filetto(W, H) { return rett(0, H * .5 - .4, W, .8, 0, oro) + rett(0, 0, W, .8, 0, "#ffffff", op(.25)); }
    // lo zoccolo nero, il mobile, il piano
    s += blocco(-1.42, 1.42, -.38, .38, 0, 3.5, "#2a170c", null, 1.4);
    s += blocco(-1.46, 1.46, -.42, .42, 3.5, 35, W0, { davanti: davanti, dietro: schiena, fianco: function (W, H) { return specchiaSe(W, fianco(W, H)); } }, 2.4);
    s += blocco(-1.48, 1.48, -.44, .44, 35, 39, W0, { davanti: filetto, dietro: filetto, fianco: filetto, sopra: function (A, B, C, D) { return dentro(chiuso([A, B, C, D]), venatureSopra(-1.48, 1.48, -.44, .44, 39, NOCE, 5, .8)) + lacca(A, B, C, D); } }, 2.2);
    // la barriera corallina
    var VIOLA = NOTTE ? "#d29bff" : "#9b5de5", ROSA = NOTTE ? "#ff7eb6" : "#e8456f";
    var cose = [
      [-1.18, -.31, function () { var t = su(-1.18, -.31); return ventaglio(t[0], t[1] - 6, 40, 46, ROSA); }],
      [-.98, -.18, function () { var t = su(-.98, -.18); return roccia(t[0], t[1] + 2, 64, 33, "#9c8a7e", 11, ["#d77fc0", "#9775fa", "#f19ab4"]) + ramificato(t[0] + 14, t[1] - 24, 36, VIOLA, 5, 4.2) + cervello(t[0] - 13, t[1] - 22, 10.5, NOTTE ? "#b2f25b" : "#94c45e") + tubi(t[0] - 1, t[1] - 28, 12, "#ffd43b") + fungo(t[0] - 21, t[1] - 7, 3.8, "#69db7c") + fungo(t[0] + 2, t[1] - 5, 3.2, "#ff8787") + fungo(t[0] + 19, t[1] - 6, 3.4, "#4dabf7"); }],
      [.66, -.33, function () { var t = su(.66, -.33); return nastri(t[0], t[1], 46, "#2f9e44", 8, 41, 1.8, 5); }],
      [.36, -.17, function () { return nave(.36, -.17, zSab(V, -.17)); }],
      [1.25, -.31, function () { var t = su(1.25, -.31); return ventaglio(t[0], t[1] - 5, 36, 42, NOTTE ? "#c77dff" : "#9c36b5"); }],
      [1.02, -.15, function () { var t = su(1.02, -.15); return roccia(t[0], t[1] + 2, 56, 36, "#a08b80", 23, ["#e599f7", "#ffa8a8"]) + tubi(t[0] - 13, t[1] - 25, 17, "#ffa94d") + ramificato(t[0] + 1, t[1] - 22, 17, NOTTE ? "#ff9ad5" : "#f06595", 9, 2.4) + tavola(t[0] + 11, t[1] - 32, 13, NOTTE ? "#66e8f5" : "#22b8cf") + fungo(t[0] + 6, t[1] - 9, 3.6, "#ff922b"); }],
      [-.42, .12, function () { var t = su(-.42, .12); return anemone(t[0], t[1], 13, "#8ccf6e", NOTTE ? "#ffa3c8" : "#ff8fb8", 21); }],
      [.82, .18, function () { return forziere(.82, .18, zSab(V, .18) - .5, V.zw); }],
      [-1.24, .22, function () { var t = su(-1.24, .22); return nastri(t[0], t[1], 30, "#40c057", 7, 52, 1.6, 3); }],
      [1.27, .22, function () { var t = su(1.27, .22); return nastri(t[0], t[1], 27, "#37b24d", 6, 63, 1.5, -4); }],
      [.36, .27, function () { return stella(.36, .27, zSab(V, .27) + .3, .085, "#ff6b3d", .4); }],
      [-.72, .3, function () { var t = su(-.72, .3); return conchiglia(t[0], t[1], 3.6, "#ffe3c4"); }],
      [.02, .27, function () { var t = su(.02, .27); return roccia(t[0], t[1] + 1, 12, 5, "#a39185", 31, ["#ff8fab"]) + fungo(t[0] - 1, t[1] - 4, 2.8, "#4dabf7"); }],
      [-.98, .27, function () { return stella(-.98, .27, zSab(V, .27) + .3, .07, "#3b82f6", 1.1); }],
      [.56, .3, function () { var t = su(.56, .3); return roccia(t[0], t[1] + 1, 13, 5.5, "#9c8a7e", 47) + polipi(t[0], t[1] - 4, 5, NOTTE ? "#8ff0a4" : "#51cf66", "#ff922b", 8); }]
    ];
    if (!VUOTO) {
      cose.push([0, .15, function () { return metti("chirurgo", 0, .15, 72, 31, "a", -1); }], [-.62, .12, function () { return metti("giallo", -.62, .12, 83, 27, "a", 1); }],
        [1.12, .14, function () { return metti("imperatore", 1.12, .14, 71, 29, "a", -1); }], [-.3, .2, function () { return metti("pagliaccio", -.3, .2, 63, 16, "a", 1); }],
        [-.52, .06, function () { return metti("pagliaccio", -.52, .06, 70, 14, "a", -1); }], [.9, .16, function () { return metti("gramma", .9, .16, 57, 13, "b", 1); }]);
      [[.42, -.12, 88], [.55, -.03, 86.5], [.67, -.15, 89.5], [.8, -.05, 87], [.5, .07, 89.5], [.9, -.18, 86], [.95, .02, 89.5]].forEach(function (v) { cose.push([v[0], v[1], function () { return metti("castagnola", v[0], v[1], v[2], 10, "a", -1); }]); });
    }
    s += vasca(V, {
      acqua: NOTTE ? ["#7fe3ff", "#2fb0f0", "#1060c0"] : ["#5cc8f2", "#1789d6", "#0a4a94"], sabbia: ["#f8eed6", "#d4c196"], sassolini: ["#ffd6a5", "#f4f4f4", "#d0bfff"], nSass: 18, cose: cose, raggi: .2, seme: 12, aperta: true, velo: .28, bagliore: .5,
      sfondo: function (bF) { var t = "", rr = rnd(91), k; for (k = 0; k < 10; k++) { var pg = P(V.a0 + (k + .5) * (V.a1 - V.a0) / 10, bF, zSab(V, bF)); t += ell(pg[0], pg[1] - 2, 8 + rr() * 8, 5 + rr() * 9, "#0a4a8a", op(.22)); } return t; },
      cornice: function (W, H) { return rett(0, H - 1.6, W, 1.6, 0, "#1d2226") + rett(0, H - 1.6, W, .5, 0, "#5c646b"); }
    });
    if (G < 0) {   // da dietro: i tubi del filtro e il cavo della lampada che salgono dal mobile lungo il vetro
      [1.07, 1.16].forEach(function (a) { var d = "M" + q(P(a, -.4, 37.5)) + " L" + q(P(a, -.4, 97)); s += tratto(d, L, 3.2) + tratto(d, "#3f4a45", 2) + tratto(d, "#8fa39a", .5, "transform='translate(-.5 0)' opacity='.8'"); });
      var dc = "M" + q(P(1.28, -.4, 37.5)) + " C" + q(P(1.28, -.41, 60)) + " " + q(P(1.3, -.41, 80)) + " " + q(P(1.3, -.4, 99)); s += tratto(dc, L, 2.3) + tratto(dc, "#16191c", 1.2);
    }
    // da dietro i tubi del filtro scavalcano il vetro ed entrano nell'acqua; poi la lampada a LED
    if (G < 0) [1.07, 1.16].forEach(function (a) { var d = "M" + q(P(a, -.4, 93)) + " L" + q(P(a, -.4, 97.5)) + " Q" + q(P(a, -.4, 100.5)) + " " + q(P(a, -.37, 100.5)) + " Q" + q(P(a, -.34, 100.5)) + " " + q(P(a, -.34, 97.5)) + " L" + q(P(a, -.34, 90)); s += tratto(d, L, 3.2) + tratto(d, "#3f4a45", 2) + tratto(d, "#8fa39a", .5, "transform='translate(-.5 0)' opacity='.8'"); });
    s += lampada(1.4, 104);
    return s;
  });
  // la lampada a LED sopra la vasca: la barra nera sulle due gambe appoggiate ai vetri corti, il cavo; sotto, la luce che scende nell'acqua
  function lampada(ab, ZL) {
    var s = "", zv = VG.zw, ALU = "#30353a";
    var cono = inviluppo([P(-ab, -.06, ZL), P(ab, -.06, ZL), P(ab, .06, ZL), P(-ab, .06, ZL), P(-ab, -.34, zv), P(ab, -.34, zv), P(ab, .34, zv), P(-ab, .34, zv)]), bc = limiti(cono);
    s += pth(chiuso(cono), lin("cn", [[0, NOTTE ? "#f1fbff" : "#ffffff", NOTTE ? .34 : .12], [1, "#ffffff", 0]], 0, bc[1], 0, bc[3], true));
    if (G < 0) { var dc = "M" + q(P(ab, -.04, ZL + 1.4)) + " C" + q(P(ab + .06, -.2, ZL + 2)) + " " + q(P(1.3, -.42, 102)) + " " + q(P(1.3, -.41, 99)); s += tratto(dc, L, 2.3) + tratto(dc, "#16191c", 1.2); }   // il cavo (da dietro)
    [-1, 1].sort(function (m, n) { return vicino(m, 0) - vicino(n, 0); }).forEach(function (k) {   // le gambe sottili, col gancetto sul vetro
      var a = k * ab;
      s += blocco(a - .008, a + .008, -.03, .03, VG.z1 - 1.5, ZL, ALU, null, .8) + blocco(a - .022, a + .022, -.035, .035, VG.z1 - 2.5, VG.z1 + .4, "#1d2125", null, .8);
    });
    s += blocco(-ab - .03, ab + .03, -.075, .075, ZL, ZL + 2.8, ALU, {
      davanti: function (W, H) { return rett(0, H - .9, W, .9, 0, NOTTE ? "#f8fdff" : "#cfeeff") + rett(0, .3, W, .4, 0, "#9aa4ad", op(.7)); },
      dietro: function (W, H) { return rett(0, H - .9, W, .9, 0, NOTTE ? "#f8fdff" : "#cfeeff") + rett(W * .05, .8, 2.4, 1.2, .4, "#111"); },
      fianco: function (W, H) { return rett(0, H - .9, W, .9, 0, NOTTE ? "#f8fdff" : "#cfeeff"); },
      sopra: function (A, B, C, D) { var m = P(ab - .25, 0, ZL + 2.8); return tratto(linea([(A[0] + D[0]) / 2, (A[1] + D[1]) / 2], [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]), "#5c646b", .5, op(.8)) + cer(m[0], m[1], .9, NOTTE ? "#8ce99a" : "#40c057") + lacca(A, B, C, D, .7); }
    }, 1.3);
    return s;
  }

  // il relitto del galeone: lo scafo inclinato e mezzo insabbiato, il ponte, il castello di poppa con le finestrelle,
  // l'albero spezzato con la vela strappata, gli oblò, le alghe e i coralli che ci sono cresciuti sopra
  function nave(ac, bc, zs) {
    var lw = .22, th = -.11, cs = Math.cos(th), sn = Math.sin(th), O = P(ac, bc + G * lw / 2, zs + 2.5), sh = [50 * lw, -25 * lw], K = 1.05;   // K = quanto è grande
    var M = [G * .82 * cs * K, (G * .41 * cs + sn) * K, -G * .82 * sn * K, (cs - G * .41 * sn) * K];
    function T(x, y) { return [O[0] + M[0] * x + M[2] * y, O[1] + M[1] * x + M[3] * y]; }
    function gruppo(c, dx) { return "<g transform='matrix(" + M.concat([O[0] + (dx ? sh[0] * dx : 0), O[1] + (dx ? sh[1] * dx : 0)]).map(f2).join(" ") + ")'>" + c + "</g>"; }
    var LG = "#6b4426", s = "", i;
    var scafo = "M-31,-17 L-19,-17 L-18.5,-11.5 C-8,-10.3 8,-9.4 20,-10.2 C25,-10.8 28.5,-12.5 31.5,-15.8 C30.5,-9 28,-2.5 22.5,1.5 C12,3.5 -10,3.6 -21,2.4 C-26,1 -29.5,-4 -31,-17 Z";
    var ponte = [[-18.5, -11.3], [-12, -10.6], [-5, -10.1], [2, -9.8], [9, -9.6], [15, -9.8], [20, -10.2], [24, -10.8], [27, -11.8], [29.5, -13.5], [31.5, -15.8]];
    function bordoLontano(pp) { return pp.map(function (v) { var k = Math.min(1, (31.5 - v[0]) / 9), t = T(v[0], v[1]); return [t[0] + sh[0] * k, t[1] + sh[1] * k]; }); }
    // l'albero spezzato, la vela strappata e il pennone storto (dietro lo scafo, nel mezzo della nave)
    var alb = tratto("M3,-9.8 L3,-44 L4.4,-47.5 L2.6,-46 L1.6,-49", L, 4.2) + tratto("M3,-9.8 L3,-44 L4.4,-47.5 L2.6,-46 L1.6,-49", "#8a5a30", 2.4) + tratto("M2.4,-10 L2.4,-44", "#c08850", .7, op(.7));
    alb += tratto("M-9,-35 L14,-38.5", L, 3) + tratto("M-9,-35 L14,-38.5", "#7a4e2a", 1.6);
    alb += pth("M-8,-34.5 L13,-37.8 L12.6,-33 L11.2,-29.4 L9.6,-33.4 L8.2,-27.4 L6.2,-32.8 L4.6,-26.8 L2.4,-33.2 L.8,-29 L-1.2,-33.2 L-3.4,-28 L-5,-32.6 L-6.6,-29.8 L-8.2,-31.8 Z", lin("vela", [[0, "#d2bd8e"], [1, "#8f7a52"]], 0, 0, 1, 1), "stroke='" + L + "' stroke-width='.8' stroke-linejoin='round'") + tratto("M9.6,-36.8 L9.6,-33.4 M4.6,-36 L4.6,-30 M-1.2,-35 L-1.2,-33.2", "#6e5c3a", .5, op(.7));   // la vela strappata a strisce
    alb += tratto("M3,-44 L-24,-17.5 M3,-44 L28,-14", "#5a4630", .45, op(.7));   // le sartie
    alb += pth("M2.6,-45.5 L-7,-46.5 L-5.6,-44 L-8,-42.6 L-5.8,-41.2 L-7.4,-39.6 L2.6,-40 Z", "#1d1d1f", bordo(L, .5)) + cer(-2.4, -43.6, 1.15, "#f1ece0") + tratto("M-4.4,-41.2 L-.4,-42.4 M-4.4,-42.4 L-.4,-41.2", "#f1ece0", .45);   // la bandiera dei pirati, strappata
    s += gruppo(alb, .5);
    // il ponte (si vede da sopra) e il castello di poppa
    var vic = ponte.map(function (v) { return T(v[0], v[1]); }), lon = bordoLontano(ponte);
    s += poly(vic.concat(lon.slice().reverse()), lin("pn", [[0, "#b07d48"], [1, "#7e5530"]], 0, 0, 1, 1), bordo(L, 1.1));
    for (i = 1; i < 4; i++) s += tratto(aperto(vic.map(function (v, k) { return [v[0] + (lon[k][0] - v[0]) * i / 4, v[1] + (lon[k][1] - v[1]) * i / 4]; })), "#5a3b20", .5, op(.6));
    var cast = [T(-31, -17), T(-19, -17)], castL = [[cast[0][0] + sh[0], cast[0][1] + sh[1]], [cast[1][0] + sh[0], cast[1][1] + sh[1]]];
    if (G > 0) s += poly([T(-19, -17), T(-18.5, -11.5), [T(-18.5, -11.5)[0] + sh[0], T(-18.5, -11.5)[1] + sh[1]], castL[1]], scuro(LG, .1), bordo(L, .9));   // il gradino del castello (si vede solo da davanti)
    s += poly([cast[0], cast[1], castL[1], castL[0]], lin("pc", [[0, "#a77443"], [1, "#7a522d"]], 0, 0, 1, 1), bordo(L, 1));
    if (G < 0) {   // da dietro si vede la poppa con le finestrelle
      var pp = [T(-31, -17), [T(-31, -17)[0] + sh[0], T(-31, -17)[1] + sh[1]], [T(-30, -5)[0] + sh[0] * .6, T(-30, -5)[1] + sh[1] * .6], T(-30, -5)];
      s += poly(pp, scuro(LG, .15), bordo(L, 1));
      for (i = 0; i < 3; i++) { var wq = [pp[0][0] + (pp[1][0] - pp[0][0]) * (.18 + i * .27), pp[0][1] + (pp[1][1] - pp[0][1]) * (.18 + i * .27) + 3]; s += rett(wq[0] - .9, wq[1], 1.8, 2.6, .5, "#2b1a10", bordo("#c9a227", .4)); }
    }
    // lo scafo: le assi, gli oblò d'ottone, lo squarcio, le alghe e i denti di cane
    var dec = "", r = rnd(404);
    for (i = 1; i < 5; i++) dec += tratto("M-31," + f1(-17 + i * 3.8) + " C-8," + f1(-10 + i * 3.1) + " 10," + f1(-9.4 + i * 3) + " 31," + f1(-15 + i * 3.6), "#3d2614", .6, op(.6));
    [-25, -12, -1, 10, 21].forEach(function (x) { dec += tratto("M" + x + ",-12 L" + x + ",4", "#3d2614", .35, op(.4)); });
    [[-8, -5.5], [2, -5], [16, -5.6]].forEach(function (v) { dec += cer(v[0], v[1], 2, "#c9a227", bordo(L, .5)) + cer(v[0], v[1], 1.2, "#16222b") + cer(v[0] - .4, v[1] - .4, .4, "#9be6ff", op(.8)); });
    [[-27, -15], [-23, -15]].forEach(function (v) { dec += rett(v[0] - .9, v[1], 1.8, 2.4, .4, "#2b1a10", bordo("#c9a227", .35)); });
    dec += pth("M7,-1 L9,-4.5 L11.5,-2.6 L13.5,-5 L15,-1.5 L13,1.6 L9,1.8 Z", "#140c06", bordo("#3d2614", .5));   // lo squarcio
    for (i = 0; i < 22; i++) dec += cer(-28 + r() * 54, -3 + r() * 6, .45 + r() * .5, "#f1ece0", op(.8));
    dec += ell(-20, 0, 7, 3.5, "#4f7a3a", op(.45)) + ell(14, 1, 8, 3, "#4f7a3a", op(.4)) + rett(-31, -17, 2, 30, 0, "#000", op(.12)) + rett(-30, -16, 60, 2, 0, "#ffffff", op(.08));
    s += gruppo(pth(scafo, lin("sc", [[0, chiaro(LG, .15)], [1, scuro(LG, .3)]], 0, 0, 0, 1)) + dentro(scafo, dec) + pth(scafo, "none", bordo(L, 1.4)));
    s += gruppo(tratto("M31.5,-15.8 L41,-21.5", L, 2.6) + tratto("M31.5,-15.8 L41,-21.5", "#8a5a30", 1.3));   // il bompresso
    // le alghe che pendono dal bordo e i coralli cresciuti sul ponte
    [[-12, -10.6], [6, -9.6], [22, -10.6]].forEach(function (v, k) { var t = T(v[0], v[1]); s += tratto("M" + q(t) + " q1.5,4 -.5,8 q-1.5,3 .5,6", "#2f9e44", 1.1, op(.85)) + (k === 1 ? tratto("M" + q(t[0] + 1.5, t[1]) + " q1.5,3 0,6", "#51cf66", .9, op(.8)) : ""); });
    var cp = T(-25, -17); s += ramificato(cp[0] + 5, cp[1] - 1.5, 10, NOTTE ? "#ff8ad8" : "#e64980", 7, 1.6);
    var cb = T(12, -9.6); s += cervello(cb[0] + 4, cb[1] - .5, 3.6, "#ffa94d");
    // la sabbia ammucchiata contro lo scafo, e qualche bollicina che esce dallo squarcio
    var a = T(-26, 2.8), bq = T(24, 1.4), md = T(0, 3.2);
    s += pth("M" + q(a[0] - 5, a[1] + 3) + " Q" + q(a[0] + 2, a[1] - 4.5) + " " + q(md[0] - 8, md[1] - 2) + " Q" + q(md[0] + 4, md[1] - 4.5) + " " + q(bq[0] - 6, bq[1] - 1) + " Q" + q(bq[0] + 2, bq[1] - 3.4) + " " + q(bq[0] + 6, bq[1] + 3) + " Z", lin("mu", [[0, "#fff8e3"], [1, "#d8c69a"]], 0, 0, 0, 1), "stroke='#b8a67a' stroke-width='.6'");
    var hb = T(11, -2);
    return s + bolle(hb[0], hb[1] - 2, hb[1] - 26, 9, 5, .8);
  }
  // il forziere aperto pieno d'oro, con le monete sparse e le bollicine che salgono fino al pelo dell'acqua
  function forziere(ac, bc, z, zw) {
    var a0 = ac - .08, a1 = ac + .08, b0 = bc - .055, b1 = bc + .055, h = 7, LG = "#8a5226", s = "", i, r = rnd(66);
    var oro = lin("fo", [[0, "#fff3bf"], [.45, "#fcc419"], [1, "#b07d0a"]], 0, 0, 1, 1);
    function fasce(W, H) { return rett(W * .14, 0, 1.6, H, 0, oro) + rett(W * .86 - 1.6, 0, 1.6, H, 0, oro) + rett(W / 2 - 1.4, 1.2, 2.8, 3, .6, oro, bordo(L, .4)) + cer(W / 2, 2.9, .5, "#3b2a10"); }
    function coperchio() {   // il coperchio a botte, aperto all'indietro: si vede il dentro
      var c0 = P(a0, b0, z + h), c1 = P(a1, b0, z + h), d0 = P(a0, b0 - .035, z + h + 8), d1 = P(a1, b0 - .035, z + h + 8);
      return pth("M" + q(c0) + " L" + q(c1) + " L" + q(d1) + " Q" + q((c1[0] + d1[0]) / 2 + 3, (c1[1] + d1[1]) / 2 - 3.6) + " " + q(d1[0] - 1, d1[1] - .5) + " L" + q(d0[0] - 1, d0[1] - .5) + " Q" + q((c0[0] + d0[0]) / 2 + 3, (c0[1] + d0[1]) / 2 - 3.6) + " " + q(d0) + " Z", lin("fc", [[0, scuro(LG, .1)], [1, scuro(LG, .45)]], 0, 0, 0, 1), bordo(L, 1)) +
        tratto(linea([(c0[0] * 3 + c1[0]) / 4, (c0[1] * 3 + c1[1]) / 4], [(d0[0] * 3 + d1[0]) / 4, (d0[1] * 3 + d1[1]) / 4]), "#e0a91a", 1.2) + tratto(linea([(c0[0] + c1[0] * 3) / 4, (c0[1] + c1[1] * 3) / 4], [(d0[0] + d1[0] * 3) / 4, (d0[1] + d1[1] * 3) / 4]), "#e0a91a", 1.2);
    }
    if (G > 0) s += coperchio();
    s += blocco(a0, a1, b0, b1, z, z + h, LG, { davanti: fasce, dietro: fasce, fianco: function (W, H) { return rett(W / 2 - .8, 0, 1.6, H, 0, oro); },
      sopra: function (A, B, C, D) {   // dentro: il mucchio di monete d'oro, una collana di perle e un rubino
        var o = poly([A, B, C, D], "#2b1a0e"), m = [(A[0] + C[0]) / 2, (A[1] + C[1]) / 2 - 1.2], k;
        o += ell(m[0], m[1] + .6, 6.4, 2.6, "#c98d0c") ;
        for (k = 0; k < 14; k++) { var t = r() * 6.28, d = Math.sqrt(r()); o += ell(m[0] + Math.cos(t) * 5.6 * d, m[1] + Math.sin(t) * 2 * d - (1 - d) * 1.6, 1.4, .8, oro, "stroke='#8a5a08' stroke-width='.3'"); }
        o += tratto("M" + q(m[0] - 5, m[1] + .5) + " q3,-2.5 6,-1.5", "#ffffff", 1.1, "stroke-dasharray='.1 1.4'") + cer(m[0] + 2.2, m[1] - 1.2, .9, "#e03131", bordo(L, .3)) + cer(m[0] - 1.6, m[1] - 1.4, .8, "#40c057", bordo(L, .3));
        return o + cer(m[0] - .6, m[1] - 2, .7, "#ffffff", op(.9));
      } }, 1.2);
    if (G < 0) s += coperchio();
    for (i = 0; i < 6; i++) { var mp = P(ac + (r() - .3) * .26, bc + .03 + r() * .1, z + .6); s += ell(mp[0], mp[1], 1.5, .75, oro, "stroke='#8a5a08' stroke-width='.35'"); }   // le monete sparse
    var bp = P(ac, bc, z + h + 2), top = P(ac, bc, zw);
    return s + bolle(bp[0], bp[1], top[1] + 2, 3, 9, 1.05);
  }

  // =========================================================
  //  ACQUARIO DEL PESCATORE (4.000): il mobile di assi vecchie con le ante a "Z" e gli anelli di ferro, la corda lungo il bordo,
  //  la rete coi sugheri sul fianco; la vasca col telaio di legno legato agli angoli; dentro il fondo del lago: la ghiaia, i sassi
  //  di fiume, il ramo sommerso, le piante a nastro, la tifa che esce dall'acqua, lo scarpone vecchio; sopra le ninfee e il galleggiante;
  //  i pesci del laghetto: persico reale, trota, carpa e persico sole. Il palo da molo con la corda regge la lanterna.
  // =========================================================
  var VP = { a0: -.9, a1: .9, b0: -.36, b1: .36, z0: 40, z1: 84, zw: 79, zsF: 45, zsB: 49 };
  def("acquario_pescatore", { tipo: "piedi", nome: "Acquario del pescatore", fp: [2, 1], box: [-76, -136, 76, 39], prezzo: 4000, V: VP, pesci: true, luce: [.12, -.02, 95, 110, "#ffcf70"] }, function () {
    var V = VP, LE = "#9b7046", W0 = legnoT(LE), TL = "#6e4a2a", s = ombraPianta(-1, 1, -.46, .46, .95, .1), i;
    function su(a, b, dz) { return P(a, b, zSab(V, b) + (dz || 0)); }
    function assi(W, H, seme, vert) {   // le assi di legno vecchio: le fughe, le venature, i chiodi
      var o = "", n = vert ? Math.round(W / 9) : Math.round(H / 9), k, dw = (vert ? W : H) / n;
      for (k = 0; k < n; k++) {
        var x = k * dw, t = vert ? rett(x, 0, dw, H, 0, chiaro(LE, (k % 3) * .05), op(.5)) : rett(0, x, W, dw, 0, chiaro(LE, (k % 3) * .05), op(.5));
        o += t + (vert ? "<g transform='translate(" + f1(x) + " 0)'>" + venature(dw, H, LE, seme + k, true, .9) + "</g>" : "<g transform='translate(0 " + f1(x) + ")'>" + venature(W, dw, LE, seme + k, false, .9) + "</g>");
        if (k) o += vert ? rett(x - .45, 0, .9, H, 0, scuro(LE, .55)) : rett(0, x - .45, W, .9, 0, scuro(LE, .55));
      }
      return o;
    }
    function chiodi(xs, ys) { var o = ""; xs.forEach(function (x) { ys.forEach(function (y) { o += cer(x, y, .6, "#3a3633") + cer(x - .2, y - .2, .25, "#9a9a9a"); }); }); return o; }
    function porta(x, y, w, h, seme) {   // un'anta di assi con la traversa a "Z", le cerniere e l'anello di ferro
      var o = "<g transform='translate(" + f1(x) + " " + f1(y) + ")'>" + rett(0, 0, w, h, 0, LE) + assi(w, h, seme, true);
      o += rett(1.5, 2.2, w - 3, 3.2, .4, chiaro(LE, .08), bordo(L, .5)) + rett(1.5, h - 5.4, w - 3, 3.2, .4, chiaro(LE, .08), bordo(L, .5)) + poly([[2.6, h - 5.4], [6.4, h - 5.4], [w - 2.6, 5.4], [w - 6.4, 5.4]], chiaro(LE, .08), bordo(L, .5));
      o += chiodi([3.4, w - 3.4], [3.8, h - 3.8]) + rett(-1, 2.6, 6, 2.4, .5, "#3a3633") + rett(-1, h - 5, 6, 2.4, .5, "#3a3633");   // i chiodi e le cerniere
      return o + rett(0, 0, w, h, 0, "none", bordo(L, .8)) + "</g>";
    }
    function anello(x, y) { return tratto("M" + q(x, y) + " m-2.2,1.4 a2.2,2.6 0 1,0 4.4,0 a2.2,2.6 0 1,0 -4.4,0", "#1f1d1b", 1.3) + tratto("M" + q(x, y) + " m-2.2,1.4 a2.2,2.6 0 0,1 2.2,-2.6", "#8a8580", .5) + cer(x, y - 1.2, 1, "#2b2826", bordo(L, .4)); }
    function davanti(W, H) {
      var o = assi(W, H, 3, true), dw = (W - 16) / 2;
      o += porta(5, 4, dw, H - 8, 10) + porta(11 + dw, 4, dw, H - 8, 20) + anello(5 + dw - 4, H / 2) + anello(11 + dw + 4, H / 2);
      return o + rett(0, H - 2.5, W, 2.5, 0, "#000", op(.18));
    }
    function fianco(W, H) {   // la rete da pesca appesa, coi sugheri arancioni
      var o = assi(W, H, 7, true), net = "M3,2.5 L" + f1(W - 3) + ",2.5 Q" + f1(W - 5) + "," + f1(H * .6) + " " + f1(W * .62) + "," + f1(H - 4) + " Q" + f1(W * .4) + "," + f1(H * .72) + " " + f1(W * .3) + "," + f1(H - 7) + " Q8," + f1(H * .45) + " 3,2.5 Z", m = "", k;
      for (k = -12; k < 16; k++) m += tratto("M" + f1(k * 3.6) + ",0 L" + f1(k * 3.6 + H) + "," + f1(H), "#e9dcc0", .45) + tratto("M" + f1(k * 3.6 + H) + ",0 L" + f1(k * 3.6) + "," + f1(H), "#e9dcc0", .45);
      o += pth(net, "#000", op(.12) + " transform='translate(1 1.4)'") + dentro(net, m) + pth(net, "none", "stroke='#cdbf9f' stroke-width='.6'");
      for (k = 0; k < 5; k++) { var x = 5 + k * (W - 10) / 4; o += ell(x, 2.6, 2, 1.4, lin("sg", [[0, "#ffb26b"], [1, "#c8550f"]], 0, 0, 0, 1), bordo(L, .5)); }
      return specchiaSe(W, o + tratto("M2,2.5 L" + f1(W - 2) + ",2.5", "#b89b6a", .8));
    }
    function schiena(W, H) { return assi(W, H, 9, false) + chiodi([3, W / 2, W - 3], [3, H / 2, H - 3]) + rett(W * .8, 5, 9, 6, .6, "#e9dcc0", bordo("#9c8a6a", .4)) + tratto("M" + f1(W * .8 + 1.5) + ",7.5 l6,0 M" + f1(W * .8 + 1.5) + ",9 l4,0", "#7a6a4a", .5); }
    // il mobile, il piano di assi, la corda lungo il bordo
    s += blocco(-.98, .98, -.42, .42, 0, 36, W0, { davanti: davanti, dietro: schiena, fianco: fianco }, 2.4);
    s += blocco(-1, 1, -.44, .44, 36, 40, legnoT("#a77a4c"), { davanti: function (W, H) { return venature(W, H, "#a77a4c", 4, false); }, dietro: function (W, H) { return venature(W, H, "#a77a4c", 5, false); }, fianco: function (W, H) { return venature(W, H, "#a77a4c", 6, false); },
      sopra: function (A, B, C, D) { var o = "", k; for (k = 1; k < 4; k++) o += tratto(linea(P(-1, -.44 + k * .22, 40), P(1, -.44 + k * .22, 40)), scuro("#a77a4c", .5), .7); return o + dentro(chiuso([A, B, C, D]), venatureSopra(-1, 1, -.44, .44, 40, "#a77a4c", 13, .7)); } }, 2.2);
    var aN = G > 0 ? .98 : -.98, bN = G > 0 ? .42 : -.42, bF = -bN;
    s += corda(aperto([P(-aN, bN, 32.5), P(aN, bN, 32.5), P(aN, bF, 32.5)]), 1.5);
    // il fondo del lago
    var cose = [
      [-.72, -.24, function () { var t = su(-.72, -.24); return nastri(t[0], t[1], 33, "#5aa83c", 7, 17, 1.4, 6); }],
      [.7, -.26, function () { var t = su(.7, -.26); return nastri(t[0], t[1], 30, "#66b342", 6, 27, 1.3, -5); }],
      [.2, -.27, function () { var t = su(.2, -.27); return piumetta(t[0], t[1], 28, "#4f9a32", 3) + piumetta(t[0] + 5, t[1] + 1, 22, "#5fae3b", 4); }],
      [-.66, -.3, function () { var t = su(-.66, -.3); return tifa(t[0], t[1], P(-.66, -.3, V.zw)[1], 3); }],
      [-.3, -.12, function () {   // il ramo sommerso, col muschio
        var p0 = su(-.78, -.16, 13), p1 = su(-.45, -.12, 6), p2 = su(-.05, -.06, 2), p3 = su(.12, -.02, 1);
        return ramo([p0, p1, p2, p3], 3.4, "#6b4a2b") + ramo([su(-.48, -.12, 7), su(-.44, -.12, 15), su(-.36, -.13, 20)], 1.6, "#6b4a2b") + muschio([p1, p2], 5);
      }],
      [-.55, .2, function () { var t = su(-.55, .2); return sasso(t[0], t[1] + 1, 8, 4.6, "#8e9196", 3) + sasso(t[0] + 8, t[1] + 1.5, 4.4, 2.8, "#a08670", 4); }],
      [.62, -.04, function () { var t = su(.62, -.04); return sasso(t[0], t[1] + 1, 7, 4.2, "#9a8c7a", 5) + sasso(t[0] - 6, t[1] + 2, 3.4, 2.2, "#7d8186", 6); }],
      [.3, .16, function () { return scarpone(.3, .16, zSab(V, .16)); }],
      [-.15, .26, function () { var t = su(-.15, .26); return sasso(t[0], t[1] + 1, 3.6, 2.2, "#b0a48e", 7); }],
      [.78, .24, function () { var t = su(.78, .24); return sasso(t[0], t[1] + 1, 4.6, 2.8, "#868a8f", 8); }]
    ];
    cose.push([-.1, -.31, function () { var t = su(-.1, -.31); return nastri(t[0], t[1], 31, "#4f9a32", 6, 37, 1.3, 3); }], [.8, .25, function () { var t = su(.8, .25); return nastri(t[0], t[1], 13, "#74b83f", 4, 47, 1.1, -2); }]);
    if (!VUOTO) cose.push([-.35, .12, function () { return metti("persico", -.35, .12, 60, 26, "a", 1); }], [.45, .12, function () { return metti("trota", .45, .12, 60, 31, "a", -1); }],
      [.05, -.12, function () { return metti("carpa", .05, -.1, 55.5, 31, "a", -1); }], [-.62, .2, function () { return metti("sole", -.62, .2, 53, 18, "a", 1); }]);
    s += vasca(V, {
      acqua: NOTTE ? ["#9fe0c4", "#3fa383", "#1d5e4a"] : ["#6cc4aa", "#2c8a70", "#155040"], velo: .3, sabbia: ["#d8c39a", "#9c8058"], sassolini: ["#9aa0a6", "#b08a63", "#c46a3a", "#e9e2d0"], nSass: 20, cose: cose, raggi: .14, seme: 33, aperta: true, telaio: true,
      sfondo: function (bF) { var t = "", k; for (k = 0; k < 14; k++) { var pg = P(V.a0 + (k + .5) * (V.a1 - V.a0) / 14, bF, zSab(V, bF)); t += tratto("M" + q(pg) + " q" + f1(k % 2 ? 2 : -2) + "," + (-12 - k % 3 * 5) + " " + (k % 2 ? 1 : -1) + "," + (-22 - k % 4 * 4), "#1d4d3c", 1.4, op(.3)); } return t; },
      cornice: function (W, H) {   // il telaio di legno: la traversa sotto, quella sopra, i montanti agli angoli, i chiodi
        var t = rett(0, H - 3.6, W, 3.6, 0, lin("tls", [[0, "#8a6038"], [1, "#5e3f22"]], 0, 0, 0, 1)) + rett(0, 0, W, 3.6, 0, lin("tla", [[0, "#a87a4a"], [1, "#6e4a28"]], 0, 0, 0, 1));
        t += rett(0, 0, 2.8, H, 0, lin("tlm", [[0, "#9a6d42"], [1, "#6a4626"]], 0, 0, 1, 0)) + rett(W - 2.8, 0, 2.8, H, 0, lin("tlm", [[0, "#9a6d42"], [1, "#6a4626"]], 0, 0, 1, 0));
        t += rett(0, 3.6, W, .5, 0, "#3d2614", op(.6)) + rett(0, H - 3.6, W, .5, 0, "#3d2614", op(.6)) + rett(0, .4, W, .6, 0, "#ffffff", op(.25)) + rett(2.8, 0, .5, H, 0, "#3d2614", op(.5)) + rett(W - 3.3, 0, .5, H, 0, "#3d2614", op(.5));
        return t + chiodi([1.4, W - 1.4], [1.8, H - 1.8]);
      },
      sopra: function () {   // sul pelo dell'acqua: le ninfee col fiore, il galleggiante; la tifa che esce dall'acqua
        var t = ninfea(-.38, .06, .11, false) + ninfea(.17, -.15, .09, true) + ninfea(.6, .14, .065, false) + galleggiante(-.04, .22, V.zw), ts = P(-.66, -.3, V.zw);
        return t + dentro("M-200," + f1(ts[1]) + " L200," + f1(ts[1]) + " L200,-400 L-200,-400 Z", tifa(su(-.66, -.3)[0], su(-.66, -.3)[1], ts[1], 3));
      }
    });
    // il bordo di legno sopra la vasca, legato con la corda agli angoli
    var sb = bN > bF ? 1 : -1, sa = G > 0 ? 1 : -1, w = .035, z1 = V.z1, aNv = G > 0 ? V.a1 : V.a0, aFv = -aNv, bNv = G > 0 ? V.b1 : V.b0, bFv = -bNv, tc = lin("tlt", [[0, "#b48655"], [1, "#8a6038"]], 0, 0, 1, 1);
    s += poly([P(aFv, bFv, z1), P(aNv, bFv, z1), P(aNv, bFv + sb * w, z1), P(aFv, bFv + sb * w, z1)], tc, bordo(L, .8)) + poly([P(aFv, bFv, z1), P(aFv + sa * w, bFv, z1), P(aFv + sa * w, bNv, z1), P(aFv, bNv, z1)], tc, bordo(L, .8));
    s += poly([P(aFv, bNv, z1), P(aNv, bNv, z1), P(aNv, bNv - sb * w, z1), P(aFv, bNv - sb * w, z1)], tc, bordo(L, .8)) + poly([P(aNv, bFv, z1), P(aNv - sa * w, bFv, z1), P(aNv - sa * w, bNv, z1), P(aNv, bNv, z1)], tc, bordo(L, .8));
    [[aFv, bNv], [aNv, bNv], [aNv, bFv]].forEach(function (e) { var c = P(e[0], e[1], z1 - 2); for (i = 0; i < 3; i++) s += corda("M" + q(c[0] - 3, c[1] - 1.8 + i * 1.6) + " l6,2", .9); });
    // il palo da molo con la corda, il braccio di ferro e la lanterna
    var pa = .935, pb = -.4, ZP = 118;
    s += tornito(pa, pb, [[40, .05], [ZP - 2, .05], [ZP, .042]], [[0, "#a77d52"], [.4, "#8a6038"], [1, "#4f3420"]], 2, 1.1);
    s += dentro(dTornito(pa, pb, [[40, .05], [ZP, .05]]), (function () { var o = "", k, c = P(pa, pb, 0); for (k = 0; k < 9; k++) o += tratto("M" + q(c[0] - 3.5, c[1] - 46 - k * 6.5) + " q1.5,1 0,3", "#3d2614", .5, op(.6)); return o; })());   // le crepe del legno
    var ct = P(pa, pb, ZP); s += ell(ct[0], ct[1], 3.5, 1.75, lin("ptop", [[0, "#c9a47a"], [1, "#8a6038"]], 0, 0, 1, 1), bordo(L, .9)) + ell(ct[0], ct[1], 1.8, .9, "none", "stroke='#6e4a2a' stroke-width='.4'");
    [[58, 5], [96, 4]].forEach(function (g) { var c = P(pa, pb, g[0]); for (i = 0; i < g[1]; i++) s += corda("M" + q(c[0] - 3.6, c[1] - i * 1.7) + " Q" + q(c[0], c[1] - i * 1.7 + 2.3) + " " + q(c[0] + 3.6, c[1] - i * 1.7 - .6), 1.1); });   // la corda avvolta
    var b0 = P(pa, pb, ZP - 6), la = .12, lb = -.02, b1 = P(la, lb, ZP - 6), mm = P((pa + la) / 2 + .1, (pb + lb) / 2, ZP - 6);
    var br = "M" + q(b0) + " L" + q(b1), sc = "M" + q(P(pa, pb, ZP - 18)) + " Q" + q(P(pa - .12, pb + .05, ZP - 7)) + " " + q(mm);
    s += tratto(br, L, 3.6) + tratto(br, "#2f2b28", 2.2) + tratto(br, "#7a736c", .6, "transform='translate(0 -.6)'") + tratto(sc, L, 2.4) + tratto(sc, "#2f2b28", 1.2);   // il braccio con la voluta
    var gc = P(pa - .2, pb + .06, ZP - 11); s += tratto("M" + q(gc) + " a2.4,2.4 0 1,1 4,1.8", L, 2.2) + tratto("M" + q(gc) + " a2.4,2.4 0 1,1 4,1.8", "#2f2b28", 1);
    s += tratto(linea(b1, P(la, lb, ZP - 12)), "#2f2b28", 1.2) + corda(linea(P(la, lb, ZP - 10), P(la, lb, 107.5)), .9);   // il gancio e la corda
    s += lanterna(la, lb);
    return s;
  });
  function ramo(pp, w, c) { var d = curva(pp); return tratto(d, L, w + 2) + tratto(d, c, w) + tratto(d, chiaro(c, .3), w * .3, "transform='translate(-.5 -.8)' opacity='.6'") + tratto(d, scuro(c, .4), .5, "stroke-dasharray='3 4' opacity='.6'"); }
  function muschio(pp, seme) { var r = rnd(seme), o = "", i; for (i = 0; i < 14; i++) { var t = r(), x = pp[0][0] + (pp[1][0] - pp[0][0]) * t, y = pp[0][1] + (pp[1][1] - pp[0][1]) * t - 1.6; o += cer(x + (r() - .5) * 3, y + (r() - .5) * 1.5, .8 + r() * .7, r() < .5 ? "#6fa83a" : "#4f8a2a", op(.9)); } return o; }
  function tifa(x, y0, ya, seme) {   // la tifa (la mazza sorda): il fusto e le foglie lunghe che escono dall'acqua, la spiga marrone di velluto
    var yt = ya - 22, s = nastri(x, y0, y0 - ya + 26, "#6b9a3a", 3, seme + 50, 1, 7), d = "M" + q(x, y0) + " Q" + q(x + 1.6, (y0 + yt) / 2) + " " + q(x + 1, yt);
    s += tratto(d, L, 2.4) + tratto(d, "#7a9f45", 1.3);
    s += rett(x - .9, yt + 1.5, 3.8, 10, 1.9, lin("tf", [[0, "#9a6a3a"], [.5, "#6e4523"], [1, "#4a2c14"]], 0, 0, 1, 0), bordo(L, .8)) + rett(x - .1, yt + 2.5, .8, 7, .4, "#ffffff", op(.25)) + tratto(linea([x + 1, yt + 1.5], [x + 1, yt - 4]), "#8a6a40", .8);
    return s;
  }
  function ninfea(a, b, r, fiore) {   // la foglia di ninfea che galleggia (vista da sopra), col taglio; il fiore rosa e bianco
    var A = a * 100, B = b * 100, R = r * 100, d = "M" + q(A, B) + " L" + q(A + R * Math.cos(.3), B + R * Math.sin(.3)) + " A" + f1(R) + "," + f1(R) + " 0 1,1 " + q(A + R * Math.cos(-.3), B + R * Math.sin(-.3)) + " Z", v = "", k;
    for (k = 0; k < 7; k++) { var t = .6 + k * .78; v += "<path d='M" + q(A, B) + " L" + q(A + R * .85 * Math.cos(t), B + R * .85 * Math.sin(t)) + "' stroke='#2b6a1e' stroke-width='.6' vector-effect='non-scaling-stroke' opacity='.6'/>"; }
    var s = inPiano(VP.zw, "<path d='" + d + "' fill='#000' opacity='.15' transform='translate(1.5 1.5)'/><path d='" + d + "' fill='" + rad("nf", [[0, "#9fdc6a"], [.7, "#4f9a2e"], [1, "#3a7a22"]], .4, .4, .7) + "' stroke='" + L + "' stroke-width='.9' vector-effect='non-scaling-stroke'/>" + v);
    if (fiore) {
      var c = P(a, b, VP.zw + 1), pp = [[-3.4, -1], [3.4, -1], [-2, -2.6], [2, -2.6], [0, -3.4], [-2.6, .4], [2.6, .4]], o = "";
      pp.forEach(function (u, k) { var ang = Math.atan2(u[1], u[0]) * 57.3 + 90; o += "<ellipse cx='" + f1(c[0] + u[0] * .6) + "' cy='" + f1(c[1] + u[1] * .6) + "' rx='1.4' ry='3.2' transform='rotate(" + f1(ang) + " " + f1(c[0] + u[0] * .6) + " " + f1(c[1] + u[1] * .6) + ")' fill='" + (k < 2 ? "#ffdeeb" : "#ffffff") + "' stroke='#c2255c' stroke-width='.45'/>"; });
      s += o + cer(c[0], c[1] - 1.4, 1.3, "#fcc419", bordo("#e67700", .4));
    }
    return s;
  }
  function galleggiante(a, b, zw) {   // il galleggiante rosso e bianco che galleggia, con i cerchi nell'acqua
    var c = P(a, b, zw), o = inPiano(zw, "<ellipse cx='" + f1(a * 100) + "' cy='" + f1(b * 100) + "' rx='5' ry='5' fill='none' stroke='#ffffff' stroke-width='.7' vector-effect='non-scaling-stroke' opacity='.7'/><ellipse cx='" + f1(a * 100) + "' cy='" + f1(b * 100) + "' rx='8.5' ry='8.5' fill='none' stroke='#ffffff' stroke-width='.6' vector-effect='non-scaling-stroke' opacity='.4'/>");
    o += pth("M" + q(c[0] - 2.6, c[1] - 1) + " A2.6,2.6 0 0,1 " + q(c[0] + 2.6, c[1] - 1) + " Z", lin("gr", [[0, "#ff8787"], [1, "#c92a2a"]], 0, 0, 1, 1), bordo(L, .6)) + pth("M" + q(c[0] - 2.6, c[1] - 1) + " L" + q(c[0] + 2.6, c[1] - 1) + " A2.6,1.2 0 0,1 " + q(c[0] - 2.6, c[1] - 1) + " Z", "#f8f9fa", bordo(L, .6));
    return o + tratto(linea([c[0], c[1] - 3.4], [c[0], c[1] - 7]), L, 1.4) + tratto(linea([c[0], c[1] - 3.4], [c[0], c[1] - 7]), "#fab005", .7) + cer(c[0] - .9, c[1] - 2.4, .5, "#ffffff", op(.9));
  }
  function scarpone(a, b, zs) {   // lo scarpone vecchio pescato... e rimesso giù (coi lacci, il buco e un po' d'alga)
    var c = P(a, b, zs + .5), m = G > 0 ? [.82, .41] : [-.82, -.41], k = .62;
    var d = "M-7,-20 L3,-20 L3.2,-9 C6,-8 12,-6.5 15,-3.5 C17,-1.5 17,.5 15,1.5 L-8,1.5 C-9.2,-.5 -8.4,-6 -7,-20 Z";
    var o = pth(d, lin("sp", [[0, "#9a6436"], [1, "#5a3618"]], 0, 0, 1, 1), bordo(L, 1.4)) + rett(-8.4, -.4, 24, 2.4, 1, "#2b1d14", bordo(L, .8)) + ell(-2, -20, 5, 1.6, "#1b120b", bordo(L, .8));
    o += pth("M3.2,-19 L1,-19 L1,-8.6 L3.2,-8.2 Z", scuro("#5a3618", .2)) + tratto("M1,-17.5 L3.6,-15.5 M1,-15.5 L3.6,-17.5 M1,-13 L3.6,-11 M1,-11 L3.6,-13", "#e9dcc0", .8) + tratto("M3.6,-17.5 q3,-2 4,1 M3.6,-15.5 q2.5,1 2,4", "#e9dcc0", .7);   // la linguetta e i lacci incrociati, uno slacciato
    o += ell(9, -3.8, 1.8, 1.1, "#1b120b") + tratto("M-5,-18 q-.8,7 .6,14", "#ffffff", 1.2, op(.25)) + tratto("M-7,-20 q-3,3 -1,6 M-6,-20 q1,-3 3,-1", "#4f8a2a", 1.1, op(.9));
    return "<g transform='matrix(" + [m[0] * k, m[1] * k, 0, k, c[0], c[1]].map(f2).join(" ") + ")'>" + o + "</g>";
  }
  function lanterna(a, b) {   // la lanterna da pescatore: il cappello e la base di ferro, il vetro a botte con la gabbietta; accesa di notte
    var s = "", g = P(a, b, 0), luce = NOTTE;
    s += tornito(a, b, [[86.5, .05], [88.5, .056], [90, .052]], FERRO, 1.1);
    var vetro = [[90, .042], [92.5, .058], [96, .064], [99.5, .057], [101.5, .042]], dv = dTornito(a, b, vetro);
    s += pth(dv, luce ? rad("lv", [[0, "#fffbe6"], [.45, "#ffe8a3"], [1, "#ffb84d"]], .5, .5, .6) : lin("lg", [[0, "#ffffff", .75], [.5, "#e7f5ff", .35], [1, "#b8c7d1", .6]], 0, 0, 1, 0), bordo(L, 1.1));
    var fz = g[1] - 92.5;   // lo stoppino e la fiammella
    s += rett(g[0] - .7, fz - 1.4, 1.4, 1.6, .3, "#3a3633") + pth("M" + q(g[0], fz - 1.6) + " C" + q(g[0] + 1.7, fz - 3.4) + " " + q(g[0] + .4, fz - 5.6) + " " + q(g[0], fz - 6.6) + " C" + q(g[0] - .4, fz - 5.6) + " " + q(g[0] - 1.7, fz - 3.4) + " " + q(g[0], fz - 1.6) + " Z", luce ? "#fff3bf" : "#ffb347", luce ? "" : op(.85));
    if (!luce) s += cer(g[0], fz - 3.6, 2.8, "#ffd27a", op(.25));
    s += dentro(dv, tratto(linea([g[0] - 2.3, g[1] - 91], [g[0] - 2.6, g[1] - 101]), "#ffffff", 1, op(.6)));
    [-.7, 0, .7].forEach(function (k) { var x = g[0] + k * 4.6; s += tratto("M" + q(x, g[1] - 90) + " Q" + q(x + k * 1.6, g[1] - 96) + " " + q(x, g[1] - 101.5), "#2f2b28", .7); });   // la gabbietta
    s += anelloTornito(a, b, 96, .066, "#2f2b28", .8);
    s += tornito(a, b, [[101.5, .05], [102.6, .056], [104.6, .034], [106, .016]], FERRO, 1.1);
    var top = [g[0], g[1] - 106]; s += tratto("M" + q(top[0] - 2, top[1]) + " a2,2 0 0,1 4,0", L, 1.6) + tratto("M" + q(top[0] - 2, top[1]) + " a2,2 0 0,1 4,0", "#2f2b28", .8);
    return s;
  }

  // =========================================================
  //  ACQUARIO COI PESCIOLINI (1.300): piccolo, sulla base grigia col coperchio nero e la lucina;
  //  dentro la sabbia gialla coi sassolini colorati, tre piantine verdi, il pesce rosso, quello rosa e le bollicine.
  //  Da dietro il cavo della luce e il tubicino dell'aria.
  // =========================================================
  var VS = { a0: -.27, a1: .27, b0: -.15, b1: .15, z0: 3, z1: 24, zw: 21.6, zsF: 5.6, zsB: 7 };
  def("acquario", { tipo: "sopra", nome: "Acquario coi pesciolini", fp: [1, 1], box: [-25, -40, 25, 14], prezzo: 1300, V: VS, luce: [0, 0, 15, 55, "#a5e4ff"] }, function () {
    var V = VS, s = ombraPianta(-.3, .3, -.18, .18, .9, .05), GR = "#495057", NE2 = "#343a40";
    function su(a, b, dz) { return P(a, b, zSab(V, b) + (dz || 0)); }
    s += blocco(-.29, .29, -.17, .17, 0, 3, GR, { davanti: function (W, H) { return rett(W / 2 - 3, .9, 6, 1.2, .5, "#2b3035") + cer(W - 3, H / 2, .5, NOTTE ? "#8ce99a" : "#40c057"); } }, 1.5);
    var cose = [
      [-.18, -.08, function () { var t = su(-.18, -.08); return nastri(t[0], t[1], 14, "#2f9e44", 3, 5, .9, 3); }],
      [-.09, -.11, function () { var t = su(-.09, -.11); return nastri(t[0], t[1], 9, "#40c057", 2, 6, .8, -2); }],
      [.19, -.07, function () { var t = su(.19, -.07); return nastri(t[0], t[1], 13, "#2f9e44", 3, 7, .9, -3); }],
      [.08, .08, function () { var t = su(.08, .08); return sasso(t[0], t[1] + .6, 2.4, 1.5, "#f4a261", 2) + sasso(t[0] + 3, t[1] + .8, 1.6, 1, "#e76f51", 3); }],
      [-.17, .1, function () { var t = su(-.17, .1); return sasso(t[0], t[1] + .6, 2, 1.3, "#adb5bd", 4); }]
    ];
    if (!VUOTO) cose.push([-.07, .08, function () { return metti("rosso", -.07, .08, 14.5, 13, "a", 1); }], [.11, 0, function () { return metti("rosa", .11, 0, 10.5, 11, "a", -1); }]);
    cose.push([.2, .04, function () { var t = su(.2, .04), top = P(.2, .04, V.zw); return bolle(t[0], t[1] - 1, top[1] + 1, 4, 6, .6); }]);
    s += vasca(V, { acqua: NOTTE ? ["#a6defd", "#45a8f2", "#1f6fd0"] : ["#9ad4fa", "#3d9cec", "#1e66c2"], sabbia: ["#f6d98e", "#d9a948"], sassolini: ["#f4a261", "#e76f51", "#adb5bd"], nSass: 8, kSass: .55, cose: cose, raggi: .1, seme: 5, bagliore: .45,
      cornice: function (W, H) { return rett(0, H - 1.4, W, 1.4, 0, "#2b3035") + rett(0, 0, W, 1, 0, "#2b3035"); } });
    if (G < 0) { var c0 = P(.18, -.155, 24), c1 = P(.18, -.16, 3), d = "M" + q(c0) + " C" + q(c0[0] + 1, c0[1] + 6) + " " + q(c1[0] - 1, c1[1] - 6) + " " + q(c1[0] + 2, c1[1] + 3); s += tratto(d, L, 1.8) + tratto(d, "#16191c", .9) + tratto("M" + q(P(-.16, -.155, 24)) + " L" + q(P(-.16, -.16, 6)), "#d0ebff", .7, op(.8)); }   // il cavo e il tubicino dell'aria
    // il coperchio nero con lo sportellino e la lucina
    s += blocco(-.285, .285, -.165, .165, 24, 26.6, NE2, { davanti: function (W, H) { return rett(0, H - .6, W, .6, 0, NOTTE ? "#e3f6ff" : "#adb5bd", op(.7)); }, sopra: function (A, B, C, D) {
      var o = poly([P(-.2, -.1, 26.6), P(.02, -.1, 26.6), P(.02, .1, 26.6), P(-.2, .1, 26.6)], "#212529", "stroke='#1a1d20' stroke-width='.5'");
      var l = [P(.07, -.08, 26.6), P(.22, -.08, 26.6), P(.22, .08, 26.6), P(.07, .08, 26.6)];
      return o + poly(l, NOTTE ? "#fff9db" : "#ffe066", bordo(L, .5)) + lacca(A, B, C, D, .8);
    } }, 1.4);
    return s;
  });

  // =========================================================
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  var VASCA = {};   // il rettangolo d'acqua si calcola una volta sola
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: "tutte", reparto: "deco", w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice(), dietro: true, prezzo: d.prezzo, qual: 2 };
      if (d.luce) { var l = d.luce; o.luce = [Math.round(m.ax + (l[0] - l[1]) * 50), Math.round(m.ay + (l[0] + l[1]) * 25 - l[2]), l[3], l[4]]; }   // dove esce la luce, nel disegno davanti
      if (d.pesci) { var r = VASCA[nome] || (VASCA[nome] = rettAcqua(d.V)); o.vasca = [Math.round(m.ax + r[0]), Math.round(m.ay + r[1]), Math.round(r[2]), Math.round(r[3])]; }   // dove nuoteranno i pesci pescati
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "acq" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro ? -1 : 1; NOTTE = !!opz.notte; VUOTO = !!opz.vuoto;
      var c; try { c = d.fn(opz, d); } finally { G = 1; NOTTE = false; VUOTO = false; }
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

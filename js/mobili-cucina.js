/* =========================================================
   SPeeD GAME — LA CUCINA VISTA DALL'ALTO (roba bella, da comprare)
   Gli stessi mobili della casa vista di lato (casa.js), disegnati come quelli del bagno (mobili-arte.js):
   una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   - "piedi" e "sopra": in prospettiva, il davanti guarda in basso a sinistra; { dietro: true } = girato di 180°.
   - "parete": piatto, di fronte, in un rettangolo 62 × 200 (un pezzo di muro).
   I piani di lavoro (cucina col forno e lavello) sono alti 55 (90 cm): messi in fila fanno una cucina componibile.
   Si aggiunge a SGMobiliArte con SGMobiliArte.aggiungi({ nomi(), info(nome), svg(nome, { dietro }) }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte || !window.SGMobiliArte.aggiungi) return;

  // ---------- attrezzi (gli stessi del bagno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato (da dietro)
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f3(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f1(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f1(rx) + "' ry='" + f1(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f1(x) + "' y='" + f1(y) + "' width='" + f1(w) + "' height='" + f1(h) + "'" + (r ? " rx='" + f1(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + (w || 2.4) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f1(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q(a) + " L" + q(b); }
  function chiuso(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function sposta(a, dx, dy) { return a.map(function (x) { return [x[0] + dx, x[1] + dy]; }); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function rq(x, y, w, h, r) {   // un rettangolo con gli angoli tondi, come tracciato (per i ritagli)
    return "M" + f1(x + r) + "," + f1(y) + " H" + f1(x + w - r) + " Q" + f1(x + w) + "," + f1(y) + " " + f1(x + w) + "," + f1(y + r) + " V" + f1(y + h - r) + " Q" + f1(x + w) + "," + f1(y + h) + " " + f1(x + w - r) + "," + f1(y + h) +
      " H" + f1(x + r) + " Q" + f1(x) + "," + f1(y + h) + " " + f1(x) + "," + f1(y + h - r) + " V" + f1(y + r) + " Q" + f1(x) + "," + f1(y) + " " + f1(x + r) + "," + f1(y) + " Z";
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
    return ell(x, y, rx, ry, rad("om", [[0, "#000", .2], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5), k ? "opacity='" + k + "'" : "");
  }
  var CER = [[0, "#ffffff"], [.4, "#f4f8fa"], [.78, "#d5dee4"], [1, "#adbac3"]];        // la ceramica bianca, da sinistra (luce) a destra
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];      // il cromo
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
    return dentro(chiuso(pp), ell(b[0] + w * .19, b[1] + h * (alto || .5), Math.max(1.6, w * .05), h * .3, "#ffffff", "opacity='" + (k || .7) + "'"));
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
  function retro(c) {   // la schiena di un mobile: un pannello liscio con le viti
    return function (W, H) { return rett(2.5, 2.5, W - 5, H - 5, 1, "none", "stroke='" + scuro(c, .22) + "' stroke-width='.9' opacity='.8'") + [[4.5, 4.5], [W - 4.5, 4.5], [4.5, H - 4.5], [W - 4.5, H - 4.5]].map(function (v) { return cer(v[0], v[1], .8, scuro(c, .35)); }).join(""); };
  }

  // ---------- attrezzi nuovi della cucina ----------
  function specchiaSe(W, s) { return G < 0 ? "<g transform='matrix(-1 0 0 1 " + f1(W) + " 0)'>" + s + "</g>" : s; }   // i fianchi: da dietro, il davanti del mobile sta dall'altra parte
  // disegnare su un piano orizzontale all'altezza z, in mattonelle (a, b): le linee restano sottili
  function inPiano(z, corpo) { return "<g transform='matrix(" + 50 * G + " " + 25 * G + " " + -50 * G + " " + 25 * G + " 0 " + f1(-z) + ")'>" + corpo + "</g>"; }
  function rettP(x, y, w, h, fill, x2) { return "<rect x='" + f3(x) + "' y='" + f3(y) + "' width='" + f3(w) + "' height='" + f3(h) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function trattoP(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + w + "' stroke-linecap='round' vector-effect='non-scaling-stroke'" + attr(x) + "/>"; }
  function q3(x, y) { return f3(x) + "," + f3(y); }
  // un pezzo tornito (gambe, gambo del tavolo, vasi, tazzine): prof = [[z, raggio in mattonelle], ...] dal basso in alto.
  // La sagoma vera, anche coi rientri; anelli = i livelli dove si vede un anello; luce = il filo chiaro a sinistra
  function tornito(a, b, prof, stops, lw, anelli, luce) {
    var c = P(a, b, 0), n = prof.length, sx = [], dx = [], i, rm = 0;
    for (i = 0; i < n; i++) { var rx = prof[i][1] * 70.71, y = c[1] - prof[i][0]; sx.push([c[0] - rx, y]); dx.push([c[0] + rx, y]); rm = Math.max(rm, rx); }
    var rt = prof[n - 1][1] * 70.71, rb = prof[0][1] * 70.71;
    var d = "M" + sx.map(function (x) { return q(x); }).join(" L") + " A" + f1(rt) + "," + f1(rt / 2) + " 0 0,1 " + q(dx[n - 1]);
    for (i = n - 2; i >= 0; i--) d += " L" + q(dx[i]);
    d += " A" + f1(rb) + "," + f1(rb / 2) + " 0 0,1 " + q(sx[0]) + " Z";
    var o = pth(d, lin("tn", stops, c[0] - rm, 0, c[0] + rm, 0, true), bordo(L, lw || 1.4));
    (anelli || []).forEach(function (k) { var rx = prof[k][1] * 70.71, y = c[1] - prof[k][0]; o += pth("M" + q(c[0] - rx, y) + " A" + f1(rx) + "," + f1(rx / 2) + " 0 0,0 " + q(c[0] + rx, y), "none", "stroke='" + L + "' stroke-width='.6' opacity='.5'"); });
    if (luce) o += tratto("M" + prof.slice(1, n - 1).map(function (x) { return q(c[0] - x[1] * 70.71 * .5, c[1] - x[0]); }).join(" L"), "#ffffff", luce, "opacity='.45'");
    return o;
  }
  function cerchioP(a, b, z, rr) { var c = P(a, b, z); return { x: c[0], y: c[1], rx: rr * 70.71, ry: rr * 35.36 }; }   // un cerchio in pianta, sullo schermo
  function cifre(x, y, n, c, h) {   // le cifre di un display: rettangolini accesi (da lontano sembrano numeri)
    var o = "", w = h * .56, i;
    for (i = 0; i < n; i++) { var x0 = x + i * (w + h * .34); o += rett(x0, y, w, h, .2, "none", "stroke='" + c + "' stroke-width='" + f1(Math.max(.3, h * .17)) + "'") + rett(x0, y + h / 2 - h * .08, w, h * .16, 0, c); }
    return o;
  }
  function shaker(c, x, y, w, h) {   // un'anta con la cornice e il pannello incassato (il bordo in basso a destra prende luce)
    var m = Math.min(3.4, w * .16);
    return pannello(c, w, h, [x, y]) + rett(x + m, y + m, w - 2 * m, h - 2 * m, .8, lin("in" + c.slice(1), [[0, scuro(c, .05)], [1, chiaro(c, .12)]], 0, 0, 0, 1), "stroke='" + scuro(c, .32) + "' stroke-width='.6'") +
      tratto("M" + q(x + m + .5, y + h - m - .5) + " L" + q(x + w - m - .5, y + h - m - .5) + " L" + q(x + w - m - .5, y + m + .5), chiaro(c, .7), .8, "opacity='.9'") +
      tratto("M" + q(x + m + .5, y + h - m - .6) + " L" + q(x + m + .5, y + m + .5) + " L" + q(x + w - m - .6, y + m + .5), scuro(c, .3), .8, "opacity='.7'");
  }
  function legno(w) { return [[0, chiaro(w, .34)], [.3, chiaro(w, .14)], [.68, w], [1, scuro(w, .38)]]; }
  var BIANCO = [[0, "#ffffff"], [.45, "#f4f7f9"], [.8, "#d6dee3"], [1, "#aab6be"]];   // il bianco lucido

  // il registro: box = [x0, y0, x1, y1] attorno al centro dell'impronta (per i mobili in piedi e le cose sopra)
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  FRIGO D'ACCIAIO: congelatore sopra e frigo sotto, maniglie lunghe cromate, distributore del ghiaccio col display;
  //  da dietro la lamiera con la serpentina nera e il compressore
  // =========================================================
  def("frigo_moderno", { tipo: "piedi", nome: "Frigo d'acciaio", fp: [1, 1], box: [-44, -136, 57, 24], dietro: true, piano: 113 }, function () {
    var A0 = -.37, A1 = .37, B0 = -.46, B1 = .2, Z0 = 1.6, ZT = 113, Y1 = 37.5, r = rnd(311);
    var s = ombra(10, 1, 47, 22);
    perVicino([[A0 + .03, B0 + .03], [A1 - .07, B0 + .03], [A0 + .03, B1 - .07], [A1 - .07, B1 - .07]]).forEach(function (g) { s += blocco(g[0], g[0] + .04, g[1], g[1] + .04, 0, Z0, "#3a3f44", null, 1); });   // i piedini
    var acc = [lin("as", [[0, "#f8fafb"], [1, "#c6ced4"]], 0, 0, 1, 1), lin("al", [[0, "#e8ecef"], [.5, "#d0d7dc"], [1, "#b2bcc4"]], 0, 0, 0, 1), lin("ad", [[0, "#9ca7b0"], [1, "#77838d"]], 0, 0, 0, 1)];
    function spazzolato(W, H, n) { var o = "", i; for (i = 0; i < n; i++) { var x = r() * W, w = .25 + r() * .35, ch = r() < .55; o += rett(x, 0, w, H, 0, ch ? "#ffffff" : "#6a767f", "opacity='" + f1(ch ? .12 + r() * .22 : .05 + r() * .12) + "'"); } return o; }   // l'acciaio spazzolato
    function davanti(W, H) {
      var k = H - 6, o = spazzolato(W, k, 60), nx = 5.2, ny = 6.5, nw = 12.6, nh = 22.5;
      o += poly([[W * .04, 0], [W * .28, 0], [W * .62, k], [W * .38, k]], "#ffffff", "opacity='.44'") + poly([[W * .34, 0], [W * .41, 0], [W * .75, k], [W * .68, k]], "#ffffff", "opacity='.28'") +
        poly([[W * .52, 0], [W * .66, 0], [W * 1, k], [W * .86, k]], "#4a5660", "opacity='.1'");   // i riflessi dell'acciaio: chiari e una fascia più scura
      // le due ante: la fessura e lo smusso chiaro
      o += rett(0, Y1 - .8, W, 1.6, 0, "#3f4a52") + rett(0, Y1 + .8, W, .7, 0, "#ffffff", "opacity='.8'") + rett(0, Y1 - 1.6, W, .8, 0, "#000", "opacity='.08'");
      // il distributore del ghiaccio e dell'acqua, incassato, col display acceso
      o += rett(nx - .4, ny - .4, nw + .8, nh + .8, 2.9, "#ffffff", "opacity='.6'") + rett(nx, ny, nw, nh, 2.6, lin("nc", [[0, "#0d1317"], [.25, "#1f2930"], [1, "#2e3a43"]], 0, 0, 0, 1), bordo(L, .9));
      o += rett(nx + .9, ny + 5.2, nw - 1.8, 12, 1.6, lin("gn", [[0, "#74c0fc", .55], [1, "#74c0fc", 0]], 0, 0, 0, 1));   // la lucina azzurra dentro
      o += rett(nx + 1, ny + 1.1, nw - 2, 3.8, .9, "#04080a", "stroke='#2b3a42' stroke-width='.4'") + cifre(nx + 1.8, ny + 1.8, 3, "#7cf2a6", 2.3) + cer(nx + nw - 2.5, ny + 3, .9, "#74c0fc") + cer(nx + nw - 2.5, ny + 3, .4, "#e7f5ff");   // i gradi e il fiocco di neve
      o += rett(nx + 3.6, ny + 7.2, nw - 7.2, 9.4, 1.8, lin("lv", CROMO, 0, 0, 1, 0), bordo(L, .7)) + rett(nx + 4.5, ny + 7.9, .9, 7.8, .4, "#ffffff", "opacity='.85'");   // la levetta
      o += rett(nx + 1.5, ny + nh - 4.2, nw - 3, 2.6, .8, "#5d6971", bordo(L, .5)) + [0, 1, 2, 3].map(function (i) { return rett(nx + 2.4 + i * 2.2, ny + nh - 3.7, 1.1, 1.6, .2, "#2a3238"); }).join("");   // la griglia per le gocce
      o += rett(W / 2 - 4.6, Y1 + 4, 9.2, 2, 1, lin("tg", [[0, "#ffffff"], [1, "#9aa5ad"]], 0, 0, 0, 1), bordo(L, .5));   // la targhetta
      o += rett(0, k, W, H - k, 0, lin("gr", [[0, "#4b555d"], [1, "#2d343a"]], 0, 0, 0, 1)) + rett(0, k, W, .6, 0, "#1d2226");   // la griglia in basso
      for (var i = 0; i < 3; i++) o += rett(3, k + 1.3 + i * 1.5, W - 6, .7, .3, "#161b1f");
      return o;
    }
    function fianco(W, H) {
      var o = spazzolato(W, H - 6, 34) + poly([[W * .42, 0], [W * .6, 0], [W * .8, H - 6], [W * .62, H - 6]], "#ffffff", "opacity='.2'") + poly([[W * .7, 0], [W * .78, 0], [W * .98, H - 6], [W * .9, H - 6]], "#ffffff", "opacity='.12'");
      o += rett(0, 0, 3.4, H - 6, 0, lin("sp", [[0, "#d9dfe3"], [1, "#a9b3bb"]], 0, 0, 0, 1)) + rett(3.4, 0, .7, H - 6, 0, "#5e6971", "opacity='.6'") + rett(0, Y1 - .8, 3.4, 1.6, 0, "#46515a");   // lo spessore delle ante
      return specchiaSe(W, o + rett(0, H - 6, W, 6, 0, "#3f474e"));
    }
    function schiena(W, H) {   // la lamiera con l'etichetta, la serpentina nera coi fili, il compressore e il cavo
      var o = rett(0, 0, W, H, 0, lin("lm", [[0, "#c9d0d5"], [1, "#9fa9b1"]], 0, 0, 0, 1)), x0 = 7, x1 = W - 7, y0 = 15, n = 15, dy = (H - 47 - y0) / n, d = "M" + f1(x0) + "," + f1(y0), i;
      o += rett(4, 3.5, 13, 7.5, .8, "#f8f9fa", bordo("#868e96", .5)) + rett(5.4, 5, 7, .9, 0, "#495057") + rett(5.4, 6.8, 10, .6, 0, "#adb5bd") + rett(5.4, 8.3, 6, .6, 0, "#adb5bd");   // l'etichetta
      for (i = 0; i < n; i++) { var y = y0 + i * dy; d += i % 2 ? " L" + f1(x0) + "," + f1(y) + " A" + f1(dy / 2) + "," + f1(dy / 2) + " 0 0,0 " + f1(x0) + "," + f1(y + dy) : " L" + f1(x1) + "," + f1(y) + " A" + f1(dy / 2) + "," + f1(dy / 2) + " 0 0,1 " + f1(x1) + "," + f1(y + dy); }
      d += " L" + f1(n % 2 ? x0 : x1) + "," + f1(y0 + n * dy);
      o += tratto(d, "#000", 3, "opacity='.18' transform='translate(1 1.2)'") + tratto(d, "#15191c", 2.2) + tratto(d, "#59646d", .6, "transform='translate(-.3 -.5)'");
      for (i = 0; i < 16; i++) { var x = x0 + 1 + i * (x1 - x0 - 2) / 15; o += tratto("M" + f1(x) + "," + f1(y0 - 2.5) + " L" + f1(x) + "," + f1(y0 + n * dy + 2.5), "#23292e", .5); }   // i fili d'acciaio
      // giù: il vano del compressore, coi tubi di rame
      var yc = H - 27;
      o += rett(3, yc, W - 6, 24, 1.6, "#2c3338", bordo(L, .9)) + rett(3.6, yc + .6, W - 7.2, 3, 1, "#000", "opacity='.35'");
      o += ell(W * .64, H - 8.5, 8, 6.4, rad("cp", [[0, "#5b636a"], [.6, "#23282c"], [1, "#0e1113"]], .38, .3, .75), bordo(L, .9)) + ell(W * .6, H - 11.5, 3, 1.4, "#ffffff", "opacity='.25'");   // il compressore
      o += tratto("M" + f1(W * .58) + "," + f1(H - 14) + " C" + f1(W * .52) + "," + f1(H - 22) + " " + f1(W * .3) + "," + f1(yc - 2) + " " + f1(x0 + 2) + "," + f1(y0 + n * dy), "#b4683a", 1.3) + tratto("M" + f1(W * .7) + "," + f1(H - 14) + " C" + f1(W * .74) + "," + f1(H - 24) + " " + f1(W * .8) + "," + f1(yc - 3) + " " + f1(x1) + "," + f1(y0 + n * dy - 3), "#c77b45", 1.3);   // i tubi di rame
      o += rett(6, H - 18, 7, 9, 1, "#3b4248", bordo(L, .6));   // la scatoletta elettrica
      o += tratto("M" + f1(W * .3) + "," + f1(H - 9) + " C" + f1(W * .26) + "," + f1(H - 2) + " " + f1(W * .2) + "," + f1(H + 3) + " " + f1(W * .08) + "," + f1(H + 4), "#16191c", 1.5) + rett(W * .02, H + 2.4, 3.6, 3, .8, "#212529", bordo(L, .5));   // il cavo con la spina
      return o + [[1.8, 1.8], [W - 1.8, 1.8]].map(function (v) { return cer(v[0], v[1], .7, "#6f7a83"); }).join("");
    }
    s += blocco(A0, A1, B0, B1, Z0, ZT, acc, { davanti: davanti, dietro: schiena, fianco: fianco }, 2.4);
    function maniglia3d(a, za, zb) {   // la maniglia lunga: una barra cromata staccata dall'anta, con due perni
      var bb = B1 + .05, o = tratto(linea(P(a + .03, B1, za - 2), P(a + .03, B1, zb + 2)), "#1d2226", 2.6, "opacity='.22'");   // l'ombra sull'anta
      [za - 2.4, zb + 2.4].forEach(function (z) { o += cromo(linea(P(a, B1, z), P(a, bb, z)), 2); });
      return o + cromo(linea(P(a, bb, za), P(a, bb, zb)), 3);
    }
    if (G > 0) s += maniglia3d(.27, ZT - 6, ZT - 33) + maniglia3d(.27, ZT - 44, ZT - 84);
    return s;
  });

  // =========================================================
  //  CUCINA COL FORNO: il piano di vetro nero con le quattro zone, la fascia coi comandi e l'orologio,
  //  lo sportello col vetro scuro e la maniglia cromata, il cassetto; da dietro la lamiera, le fessure e il cavo
  // =========================================================
  def("cucina_moderna", { tipo: "piedi", nome: "Cucina col forno", fp: [1, 1], box: [-46, -79, 55, 23], dietro: true, piano: 55 }, function () {
    var A0 = -.38, A1 = .38, B0 = -.46, B1 = .2, ZP = 4.5, ZC = 52, ZT = 55;
    var s = ombra(10, 1, 45, 21);
    var sm = [lin("ws", [[0, "#ffffff"], [1, "#eceff2"]], 0, 0, 1, 1), lin("wl", [[0, "#ffffff"], [1, "#e1e6ea"]], 0, 0, 0, 1), lin("wd", [[0, "#c9d1d7"], [1, "#a7b1b9"]], 0, 0, 0, 1)];
    var nero = [lin("vs", [[0, "#3f444a"], [1, "#16191c"]], 0, 0, 1, 1), lin("vl", [[0, "#2c3035"], [1, "#16191c"]], 0, 0, 0, 1), lin("vd", [[0, "#15171a"], [1, "#0b0c0e"]], 0, 0, 0, 1)];
    function manopola(x, y, rr) {   // una manopola cromata col segno
      return ell(x + .5, y + .7, rr, rr, "#000", "opacity='.28'") + cer(x, y, rr, rad("mp", [[0, "#ffffff"], [.55, "#d5dce1"], [1, "#7c8890"]], .35, .3, .8), bordo(L, .7)) +
        cer(x, y, rr * .6, "none", "stroke='#9aa5ad' stroke-width='.5'") + tratto("M" + q(x, y) + " L" + q(x - rr * .45, y - rr * .7), "#2b3035", .7);
    }
    function davanti(W, H) {
      var o = rett(0, 0, W, 7.6, 0, lin("fc", [[0, "#f4f6f8"], [1, "#c9d0d6"]], 0, 0, 0, 1)) + rett(0, 7.6, W, .7, 0, "#8d98a1");   // la fascia dei comandi
      [5.4, 12.2, W - 12.2, W - 5.4].forEach(function (x) { o += manopola(x, 3.8, 2.5); });
      o += rett(W / 2 - 5.4, 1.5, 10.8, 4.6, 1, "#101417", bordo(L, .6)) + cifre(W / 2 - 4, 2.4, 2, "#ffa94d", 2.8) + cer(W / 2, 3.2, .3, "#ffa94d") + cer(W / 2, 4.6, .3, "#ffa94d") + cifre(W / 2 + .9, 2.4, 2, "#ffa94d", 2.8);   // l'orologio
      // lo sportello del forno: la cornice bianca, il vetro nero, dentro la griglia; i riflessi
      o += rett(1.3, 9.2, W - 2.6, 30.4, 2.2, lin("sf", [[0, "#ffffff"], [1, "#e2e7eb"]], 0, 0, 0, 1), "stroke='#97a2aa' stroke-width='.9'");
      var gx = 4.8, gy = 15.2, gw = W - 9.6, gh = 20.8, vt = rq(gx, gy, gw, gh, 2.4);
      o += pth(vt, lin("vf", [[0, "#40464d"], [1, "#0f1215"]], 0, 0, 0, 1), bordo(L, 1));
      o += dentro(vt, rett(gx + 3, gy + 3, gw - 6, gh - 6, 1.6, "#1c2125", "stroke='#30373d' stroke-width='.6'") + rett(gx + 4, gy + 8.6, gw - 8, .8, 0, "#5b646c") + rett(gx + 4, gy + 14, gw - 8, .8, 0, "#5b646c") +   // la griglia
        ell(gx + gw - 6, gy + 4.2, 2.4, 1.4, "#ffd8a8", "opacity='.35'") +   // la lucina del forno
        poly([[gx + gw * .1, gy], [gx + gw * .32, gy], [gx + gw * .06, gy + gh], [gx - gw * .16, gy + gh]], "#ffffff", "opacity='.16'") + poly([[gx + gw * .4, gy], [gx + gw * .47, gy], [gx + gw * .21, gy + gh], [gx + gw * .14, gy + gh]], "#ffffff", "opacity='.1'"));
      // il cassetto scaldavivande
      o += rett(1.3, 40.6, W - 2.6, 6.2, 1.4, lin("cs", [[0, "#ffffff"], [1, "#e6eaee"]], 0, 0, 0, 1), "stroke='#97a2aa' stroke-width='.9'") + maniglia(W / 2 - 6, 42.6, 12, 1.8);
      return o;
    }
    function dietro(W, H) {   // la schiena: la lamiera con le viti, le fessure per l'aria, l'etichetta e il cavo con la spina
      var o = rett(0, 0, W, H, 0, lin("lr", [[0, "#e3e8eb"], [1, "#c3cbd1"]], 0, 0, 0, 1)) + retro("#dfe5e9")(W, H), i;
      for (i = 0; i < 6; i++) o += rett(W * .28, 6 + i * 2.4, W * .44, 1.1, .5, "#7d8991");
      o += rett(5, 25, 11, 6.5, .6, "#fff9db", bordo("#adb5bd", .5)) + rett(6.2, 26.6, 6, .7, 0, "#868e96") + rett(6.2, 28.4, 7.6, .6, 0, "#ced4da");
      return o + tratto("M" + f1(W * .78) + "," + f1(H - 9) + " C" + f1(W * .86) + "," + f1(H - 2) + " " + f1(W * .72) + "," + f1(H + 5) + " " + f1(W * .58) + "," + f1(H + 6), "#22272b", 1.5) + rett(W * .52, H + 4.6, 3.6, 3, .8, "#212529", bordo(L, .5));
    }
    function fianco(W, H) { return poly([[W * .5, 0], [W * .68, 0], [W * .8, H], [W * .62, H]], "#ffffff", "opacity='.14'") + rett(0, 0, W, 2.4, 0, "#000", "opacity='.14'"); }
    function piastre(A, B, C, D) {   // il vetro nero: le quattro zone di cottura, i comandi a sfioramento, i riflessi
      var o = "", lim = limiti([A, B, C, D]), w = lim[2] - lim[0];
      [[-.18, -.25, .1], [.17, -.24, .125], [-.17, .03, .125], [.18, .04, .09]].forEach(function (z) {
        var F = forma(z[0], z[1], z[2]);
        o += pth(chiuso(giro(F, ZT, 1, 48)), "#1d2024", "stroke='#8b939a' stroke-width='.8'") + pth(chiuso(giro(F, ZT, .66, 40)), "none", "stroke='#4c535a' stroke-width='.6'") + pth(chiuso(giro(F, ZT, .32, 32)), "none", "stroke='#3d444a' stroke-width='.5'");
      });
      [-.1, -.05, 0, .05, .1].forEach(function (a, i) { var c = P(a, .15, ZT); o += i === 2 ? cer(c[0], c[1], .9, "none", "stroke='#ff6b6b' stroke-width='.5'") : ell(c[0], c[1], .9, .5, "#e9ecef", "opacity='.7'"); });
      o += tratto(linea(P(-.12, .185, ZT), P(.12, .185, ZT)), "#ced4da", .5, "opacity='.5'");
      o += poly([[lim[0] + w * .3, lim[1]], [lim[0] + w * .5, lim[1]], [lim[0] + w * .2, lim[3]], [lim[0], lim[3]]], "#ffffff", "opacity='.09'") + poly([[lim[0] + w * .55, lim[1]], [lim[0] + w * .6, lim[1]], [lim[0] + w * .3, lim[3]], [lim[0] + w * .25, lim[3]]], "#ffffff", "opacity='.12'");
      return dentro(chiuso([A, B, C, D]), o);
    }
    s += blocco(A0 + .03, A1 - .03, B0 + .02, B1 - .045, 0, ZP, "#30353a", null, 1.4);   // lo zoccolo scuro, rientrato
    s += blocco(A0, A1, B0, B1, ZP, ZC, sm, { davanti: davanti, dietro: dietro, fianco: fianco });
    s += blocco(A0 - .012, A1 + .012, B0 - .01, B1 + .022, ZC, ZT, nero, { sopra: piastre }, 2);   // il piano di vetro
    if (G > 0) {   // la maniglia dello sportello: una barra cromata staccata, coi perni
      var z = ZC - 12.3, bb = B1 + .045, a0 = A0 + .07, a1 = A1 - .07;
      s += tratto(linea(P(a0, B1, z - 2.6), P(a1, B1, z - 2.6)), "#1d2226", 2, "opacity='.18'");
      [a0 + .025, a1 - .025].forEach(function (a) { s += cromo(linea(P(a, B1, z), P(a, bb, z)), 1.7); });
      s += cromo(linea(P(a0, bb, z), P(a1, bb, z)), 2.5);
    }
    return s;
  });

  // =========================================================
  //  LAVELLO col mobile: due ante color salvia con le cornici, il piano di pietra chiara,
  //  la vasca d'acciaio col gocciolatoio, il rubinetto a collo di cigno, il sapone e la spugna; da dietro i tubi
  // =========================================================
  def("lavello", { tipo: "piedi", nome: "Lavello con mobile", fp: [1, 1], box: [-51, -100, 64, 26], dietro: true, piano: 55 }, function () {
    var c = "#cbdcd2", A0 = -.47, A1 = .47, B0 = -.45, B1 = .2, ZP = 4.5, ZC = 51, ZT = 55, r = rnd(531);
    var s = ombra(10, 1, 55, 25);
    var pietra = [lin("ps", [[0, "#f7f8f9"], [1, "#dcdfe2"]], 0, 0, 1, 1), lin("pl", [[0, "#eceef0"], [1, "#cfd4d8"]], 0, 0, 0, 1), lin("pd", [[0, "#b8bfc5"], [1, "#9ea6ad"]], 0, 0, 0, 1)];
    function ante(W, H) {
      var g = 1.3, w2 = (W - 3 * g) / 2;
      return shaker(c, g, 2.6, w2, H - 4) + shaker(c, 2 * g + w2, 2.6, w2, H - 4) + maniglia(W / 2 - 4.4, 6.4, 1.9, 13) + maniglia(W / 2 + 2.5, 6.4, 1.9, 13) +
        rett(0, 0, W, 3.2, 0, lin("ol", [[0, "#000", .3], [1, "#000", 0]], 0, 0, 0, 1));   // l'ombra del piano che sporge
    }
    function tubi(W, H) {   // la schiena: il pannello con le viti e, nel buco, il sifone cromato e i due flessibili coi rubinetti rosso e blu
      var x0 = W * .27, x1 = W * .73, y0 = 7, y1 = H - 6, cx = W / 2, o = retro(c)(W, H);
      o += rett(x0, y0, x1 - x0, y1 - y0, 1.6, "#26302b", bordo(L, .9));
      var sif = "M" + f1(cx + 2) + "," + f1(y0) + " L" + f1(cx + 2) + "," + f1(y0 + 13) + " C" + f1(cx + 2) + "," + f1(y0 + 21) + " " + f1(cx + 11) + "," + f1(y0 + 21) + " " + f1(cx + 11) + "," + f1(y0 + 13) + " L" + f1(x1 + 1) + "," + f1(y0 + 13);
      var fl = function (x, col) {
        var d = "M" + f1(x) + "," + f1(y0) + " C" + f1(x - 2) + "," + f1(y0 + 10) + " " + f1(x + 2) + "," + f1(y0 + 18) + " " + f1(x) + "," + f1(y1 - 9);
        return tratto(d, L, 3.2) + tratto(d, "#b9c2c8", 1.8) + tratto(d, "#ffffff", .6, "stroke-dasharray='1 1' opacity='.8'") + rett(x - 2, y1 - 9.5, 4, 4.6, 1, lin("vv", CROMO, 0, 0, 1, 0), bordo(L, .6)) + cer(x + 2.8, y1 - 7.2, 1.7, col, bordo(L, .6)) + cer(x + 2.4, y1 - 7.6, .6, "#ffffff", "opacity='.6'");
      };
      o += dentro(rq(x0, y0, x1 - x0, y1 - y0, 1.6), rett(x0, y0, x1 - x0, 3, 0, "#000", "opacity='.35'") + cromo(sif, 2.8) + fl(cx - 7, "#e03131") + fl(cx - 1.5, "#1c7ed6"));
      return o;
    }
    function fianco(W, H) { return rett(0, 0, W, 3.2, 0, lin("ol", [[0, "#000", .3], [1, "#000", 0]], 0, 0, 0, 1)); }
    function lavabo(A, B, C, D) {   // il piano di pietra: le venature, la vasca d'acciaio e il gocciolatoio
      var o = "", i, ven = "";
      for (i = 0; i < 5; i++) { var y = -.42 + i * .16 + r() * .06; ven += trattoP("M-.5," + f3(y) + " C" + q3(-.2, y + (r() - .5) * .2) + " " + q3(.1, y + (r() - .5) * .25) + " " + q3(.5, y + (r() - .5) * .12), i % 2 ? "#959ea6" : "#adb5bc", i % 2 ? .8 : 1.3, "opacity='.55'"); }
      for (i = 0; i < 70; i++) ven += "<circle cx='" + f3(-.48 + r() * .96) + "' cy='" + f3(-.46 + r() * .69) + "' r='" + f3(.003 + r() * .004) + "' fill='" + (r() < .5 ? "#8d969d" : "#ffffff") + "' opacity='.6'/>";   // i granellini del quarzo
      o += dentro(chiuso([A, B, C, D]), inPiano(ZT, ven));
      // la lastra d'acciaio: la vasca a sinistra, il gocciolatoio a destra
      var fl = forma(-.005, -.11, .455, .255, .255, 8), flp = giro(fl, ZT, 1, 72);
      o += pth(chiuso(sposta(flp, .8, 1)), "#000", "opacity='.12'") + pth(chiuso(flp), lin("fl", [[0, "#f6f8f9"], [.5, "#d5dbdf"], [1, "#aeb7be"]], 0, 0, 1, 1), bordo(L, 1.3));
      var dr = forma(.22, -.11, .19, .2, .2, 6), drp = giro(dr, ZT, 1, 48);
      o += pth(chiuso(drp), lin("dr", [[0, "#dfe4e7"], [1, "#b8c1c7"]], 0, 0, 1, 1), "stroke='#8d98a1' stroke-width='.7'");
      for (i = 0; i < 7; i++) { var a = .07 + i * .05; o += tratto(linea(P(a, -.27, ZT), P(a, .05, ZT)), "#7f8a93", .8, "opacity='.75'") + tratto(linea(P(a + .013, -.27, ZT), P(a + .013, .05, ZT)), "#ffffff", .6, "opacity='.8'"); }   // le righe del gocciolatoio
      var bw = forma(-.25, -.11, .18, .2, .2, 7), bp = giro(bw, ZT, 1, 56), fondo = giro(bw, ZT - 9, .9, 56), sc = P(-.25, -.2, ZT - 9);
      o += pth(chiuso(bp), lin("bw", [[0, "#5f6a73"], [1, "#b6c0c7"]], 0, 0, 1, 0), bordo(L, 1.3));
      o += dentro(chiuso(bp), pth(chiuso(fondo), lin("bf", [[0, "#e7ebee"], [1, "#a9b3ba"]], 0, 0, 1, 1), "stroke='#8794a0' stroke-width='.6'") +
        ell(sc[0], sc[1], 3.8, 1.9, lin("sc", CROMO, 0, 0, 1, 1), bordo(L, .7)) + ell(sc[0], sc[1], 1.8, .9, "#4b5660") + [[-3, 1.6], [4.6, -.6], [1.4, 3.2]].map(function (g) { return ell(sc[0] + g[0], sc[1] + g[1], 1, .6, "#c5e6f8", "stroke='#7fb3d1' stroke-width='.4'") + cer(sc[0] + g[0] - .3, sc[1] + g[1] - .2, .25, "#ffffff"); }).join(""));   // lo scarico e le goccioline
      return o + pth(chiuso(bp), "none", bordo(L, 1.3)) + tratto("M" + q(bp[Math.round(bp.length * .5)]) + " L" + q(bp[Math.round(bp.length * .62)]), "#ffffff", .8, "opacity='.6'");
    }
    function rubinetto() {   // il miscelatore cromato a collo di cigno, con la leva di lato
      var a = -.25, b = -.405, F = forma(a, b, .034), o = corpo([giro(F, ZT, 1.2, 24), giro(F, ZT + 1.6, 1.15, 24)], CROMO, 1.2) + corpo([giro(F, ZT + 1.6, 1, 24), giro(F, ZT + 9, 1, 24)], CROMO, 1.3);
      o += pth(chiuso(giro(F, ZT + 9, 1, 24)), "#eef2f4", bordo(L, .9)) + cromo(linea(P(a + .02, b, ZT + 7.4), P(a + .1, b + .025, ZT + 9.4)), 1.8);
      var d = "M" + q(P(a, b, ZT + 8.5)) + " L" + q(P(a, b, ZT + 20)) + " C" + q(P(a, b, ZT + 29)) + " " + q(P(a, b + .2, ZT + 29)) + " " + q(P(a, b + .2, ZT + 20.5));
      var e = P(a, b + .2, ZT + 20);
      return o + cromo(d, 2.6) + ell(e[0], e[1] + .5, 1.8, .9, "#4a5560", bordo(L, .5));
    }
    function sapone() {   // il sapone per i piatti, verde, col dosatore e l'etichetta che gira attorno alla bottiglia
      var a = .33, b = -.415, F = forma(a, b, .034), lv = [giro(F, ZT, 1, 24), giro(F, ZT + 9.5, 1, 24)], sil = sagoma(lv), o = corpo(lv, [[0, "#b2f2bb"], [.45, "#40c057"], [1, "#2b8a3e"]], 1.2);
      var c = P(a, b, 0), rx = .034 * 70.71, ry = rx / 2, y1 = c[1] - ZT - 3, y2 = c[1] - ZT - 6.8;
      o += dentro(chiuso(sil), pth("M" + q(c[0] - rx, y2) + " A" + f1(rx) + "," + f1(ry) + " 0 0,0 " + q(c[0] + rx, y2) + " L" + q(c[0] + rx, y1) + " A" + f1(rx) + "," + f1(ry) + " 0 0,1 " + q(c[0] - rx, y1) + " Z", "#ffffff", "opacity='.9'") +
        ell(c[0], y2 + ry + 1.2, rx * .5, .6, "#2f9e44", "opacity='.8'")) + lucido(sil, .6, .45);
      o += pth(chiuso(giro(F, ZT + 9.5, 1, 24)), "#8ce99a", bordo(L, .8)) + corpo([giro(F, ZT + 9.5, .45, 16), giro(F, ZT + 12, .45, 16)], CROMO, .9);
      var t = P(a, b, ZT + 12.4), n = P(a, b + .05, ZT + 12.4);
      return o + tratto(linea(t, n), L, 2.4) + tratto(linea(t, n), "#e9ecef", 1.2);
    }
    function spugna() { return blocco(.27, .4, -.03, .06, ZT, ZT + 2.4, "#ffd43b", null, 1) + blocco(.27, .4, -.03, .06, ZT + 2.4, ZT + 3.4, "#37b24d", null, 1); }   // la spugna gialla e verde
    s += blocco(A0 + .03, A1 - .03, B0 + .02, B1 - .045, 0, ZP, scuro(c, .55), null, 1.4);   // lo zoccolo
    s += blocco(A0, A1, B0, B1, ZP, ZC, c, { davanti: ante, dietro: tubi, fianco: fianco });
    s += blocco(-.49, .49, -.475, .24, ZC, ZT, pietra, { sopra: lavabo }, 2.2);   // il piano di pietra
    return s + ordina([[vicino(-.25, -.405), rubinetto()], [vicino(.33, -.415), sapone()], [vicino(.335, .015), spugna()]]);
  });

  // =========================================================
  //  PENSILE (da parete, 62 × 200): la cornice in alto, due ante color crema con le cornici e le maniglie,
  //  la luce dei led che scende sul muro
  // =========================================================
  def("pensile", { tipo: "parete", nome: "Pensile della cucina" }, function () {
    var c = "#f1e8d6", x0 = 2.6, x1 = 59.4, y0 = 73, y1 = 106, g = 1.3, w2 = (x1 - x0 - 3 * g) / 2, s = "";
    s += pth("M" + (x0 + 5) + "," + (y1 + 1) + " L" + (x1 - 5) + "," + (y1 + 1) + " L" + (x1 + 1) + "," + (y1 + 26) + " L" + (x0 - 1) + "," + (y1 + 26) + " Z", lin("gl", [[0, "#fff3c4", .5], [.4, "#fff3c4", .14], [1, "#fff3c4", 0]], 0, 0, 0, 1));   // la luce dei led sul muro
    s += rett(x0 + 3, y0 - 4, x1 - x0, y1 - y0 + 6.5, 2, "#000", "opacity='.16'");   // l'ombra sul muro
    s += rett(x0 - 2.1, y0 - 7.4, x1 - x0 + 4.2, 4.8, 1.2, lin("cs", [[0, "#ffffff"], [1, chiaro(c, .25)]], 0, 0, 0, 1), bordo(L, 1.5)) +   // il cappello che sporge (visto un po' da sopra)
      rett(x0 - 1.1, y0 - 2.9, x1 - x0 + 2.2, 3.1, .6, lin("cg", [[0, scuro(c, .08)], [1, scuro(c, .28)]], 0, 0, 0, 1), bordo(L, 1.2)) + rett(x0 - 1, y0 - 6.6, x1 - x0 + 2, .9, .4, "#ffffff", "opacity='.9'");
    s += rett(x0, y0, x1 - x0, y1 - y0, 1.2, lin("cp", [[0, chiaro(c, .2)], [1, scuro(c, .14)]], 0, 0, 1, 1), bordo(L, 2.2));
    s += shaker(c, x0 + g, y0 + 1.3, w2, y1 - y0 - 4.8) + shaker(c, x0 + 2 * g + w2, y0 + 1.3, w2, y1 - y0 - 4.8);
    s += maniglia(31 - 4.7, y1 - 16.5, 1.9, 11) + maniglia(31 + 2.8, y1 - 16.5, 1.9, 11);
    s += rett(x0 + .8, y1 - 3.3, x1 - x0 - 1.6, 2.4, .4, scuro(c, .34)) + rett(x0 + 5, y1 - 1.6, x1 - x0 - 10, 1, .5, "#fffbe6", "stroke='#ffe8a3' stroke-width='.5'");   // il fondo e la striscia dei led
    return s;
  });

  // =========================================================
  //  TAVOLO CON LA TOVAGLIA a quadretti rossi e bianchi (due mattonelle): i lembi col bordo a zig-zag,
  //  le gambe tornite che si vedono sotto, la fruttiera in mezzo
  // =========================================================
  def("tavolo_pranzo", { tipo: "piedi", nome: "Tavolo con la tovaglia", fp: [2, 1], box: [-79, -83, 91, 44], piano: 46 }, function () {
    var A = .9, B = .45, ZT = 46, ZB = 30.5, Q = .1, w = "#a8754a", ROSSO = "#ea4b4e", PANNO = "#fffdf6", s = ombra(6, 6, 84, 37, .9), i, j;
    // le gambe tornite (sotto la tovaglia si vede solo il pezzo in basso)
    var prof = [[0, .032], [1.4, .04], [2.8, .041], [4, .031], [5.4, .03], [6.6, .038], [7.6, .045], [8.6, .038], [10.2, .031], [20, .037], [24.6, .043], [26, .05], [27.4, .042], [28.8, .05], [ZB + 1, .05]];
    perVicino([[-.76, -.33], [.76, -.33], [-.76, .33], [.76, .33]]).forEach(function (g) { s += tornito(g[0], g[1], prof, legno(w), 1.4, [2, 6, 12], .8); });
    // sopra: i quadretti (le righe e le colonne vanno avanti uguali anche sui lembi), le pieghe della tovaglia stirata, la luce
    var At = P(-A, -B, ZT), Bt = P(A, -B, ZT), Ct = P(A, B, ZT), Dt = P(-A, B, ZT), top = chiuso([At, Bt, Ct, Dt]), qt = rettP(-A, -B, 2 * A, 2 * B, PANNO);
    for (i = Math.floor(-A / Q); i < Math.ceil(A / Q); i++) for (j = Math.floor(-B / Q); j < Math.ceil(B / Q); j++) {
      if (!((i + j) & 1)) continue;
      var x0 = Math.max(-A, i * Q), x1 = Math.min(A, (i + 1) * Q), y0 = Math.max(-B, j * Q), y1 = Math.min(B, (j + 1) * Q);
      if (x1 > x0 && y1 > y0) qt += rettP(x0, y0, x1 - x0, y1 - y0, ROSSO);
    }
    qt += trattoP("M0," + f3(-B) + " L0," + f3(B) + " M" + f3(-A) + ",0 L" + f3(A) + ",0", "#ffffff", 1.4, "opacity='.4'") + trattoP("M" + f3(-A / 2) + "," + f3(-B) + " L" + f3(-A / 2) + "," + f3(B) + " M" + f3(A / 2) + "," + f3(-B) + " L" + f3(A / 2) + "," + f3(B), "#000000", .8, "opacity='.07'");
    function lembo(W, H, u0, su, v0, buio) {   // un lembo che pende: in x si va lungo il bordo (u = u0 + su·x/61), in giù la stoffa continua (v = v0 + y/61)
      var n = Math.max(2, Math.round(W / 3.05)), k, giu = [], o = "";
      for (k = n; k >= 0; k--) {   // l'orlo a zig-zag; agli angoli la stoffa scende un po' di più
        var x = W * k / n, ag = Math.pow(Math.max(0, 1 - x / 10), 2) + Math.pow(Math.max(0, 1 - (W - x) / 10), 2);
        giu.push([x, H - (k % 2 ? 2.4 : 0) + Math.sin(x / W * Math.PI * 4 + u0 * 9) * .8 + ag * 3.4]);
      }
      var fz = "M0,0 L" + f1(W) + ",0 L" + giu.map(function (x) { return q(x); }).join(" L") + " Z", qd = rett(0, -1, W, H + 6, 0, PANNO), c, m;
      var ua = Math.min(u0, u0 + su * W / 61), ub = Math.max(u0, u0 + su * W / 61);
      for (c = Math.floor(ua / Q) - 1; c <= Math.ceil(ub / Q); c++) for (m = Math.floor(v0 / Q); m <= Math.ceil((v0 + (H + 7) / 61) / Q); m++) {
        if (!((c + m) & 1)) continue;
        var xa = (c * Q - u0) * 61 * su, xb = ((c + 1) * Q - u0) * 61 * su, xx0 = Math.max(0, Math.min(xa, xb)), xx1 = Math.min(W, Math.max(xa, xb));
        var yy0 = Math.max(-1, (m * Q - v0) * 61), yy1 = Math.min(H + 7, ((m + 1) * Q - v0) * 61);
        if (xx1 > xx0 && yy1 > yy0) qd += rett(xx0, yy0, xx1 - xx0, yy1 - yy0, 0, ROSSO);
      }
      var pieghe = "", np = Math.max(2, Math.round(W / 15));
      for (k = 0; k < np; k++) { var xc = (k + .5) * W / np + Math.sin(k * 2.3 + u0 * 5) * 2; pieghe += rett(xc - 3.2, 0, 6.4, H + 7, 0, lin("pg", [[0, "#000", 0], [.5, "#000", .13], [1, "#000", 0]], 0, 0, 1, 0)) + rett(xc - 6.4, 0, 3, H + 7, 0, lin("pl", [[0, "#fff", 0], [.5, "#fff", .22], [1, "#fff", 0]], 0, 0, 1, 0)); }
      o += dentro(fz, qd + pieghe + rett(0, -1, W, H + 8, 0, lin("lv", [[0, "#ffffff", .32], [.3, "#ffffff", 0], [1, "#000000", .14]], 0, 0, 0, 1)) + (buio ? rett(0, -1, W, H + 8, 0, "#2a1608", "opacity='" + buio + "'") : ""));
      o += tratto("M" + giu.map(function (x) { return q(x[0], x[1] - 1.6); }).join(" L"), scuro(ROSSO, .35), .5, "stroke-dasharray='1 1' opacity='.55'");   // l'orlo cucito
      return o + pth(fz, "none", bordo(L, 1.5));
    }
    s += faccia(Dt, 1, lembo(2 * A * 61, ZT - ZB, -A, 1, B, 0)) + faccia(Ct, -1, lembo(2 * B * 61, ZT - ZB, B, -1, A, .2));
    s += pth(top, PANNO) + dentro(top, inPiano(ZT, qt) + pth(top, lin("tl", [[0, "#ffffff", .28], [.45, "#ffffff", 0], [1, "#000000", .1]], 0, 0, 1, 1)));
    s += tratto("M" + q(Bt) + " L" + q(Ct) + " L" + q(Dt), L, 1.2, "opacity='.8'") + tratto("M" + q(Dt) + " L" + q(At) + " L" + q(Bt), L, 2.2) + tratto("M" + q(Dt[0] + 1.6, Dt[1] + 1.2) + " L" + q(Ct[0] - .6, Ct[1] + .9), "#ffffff", 1.1, "opacity='.7'");
    // la fruttiera: la ciotola bianca, dentro arance, mele e una banana
    var zf = ZT, o = tornito(0, 0, [[zf, .06], [zf + .8, .07], [zf + 1.6, .072], [zf + 2.6, .1], [zf + 4.2, .13], [zf + 5.2, .142]], BIANCO, 1.3);
    var cb = cerchioP(0, 0, zf + 5.2, .142), fr = "";
    o += ell(cb.x, cb.y, cb.rx, cb.ry, lin("fi", [[0, "#cdd6dc"], [1, "#f6f8f9"]], 0, 0, 1, 1), bordo(L, 1.1));
    function frutto(a, b, z, rr, tipo) {
      var c = P(a, b, z), R = rr * 70.71, k = { ar: [[0, "#ffe0b3"], [.45, "#ff922b"], [1, "#c2410c"]], me: [[0, "#ffb3b3"], [.45, "#e03131"], [1, "#871b1b"]], mv: [[0, "#e3f7b0"], [.5, "#82c91e"], [1, "#4a7a10"]] }[tipo];
      var f = cer(c[0], c[1], R, rad("f" + tipo, k, .35, .3, .78), bordo(L, .8)) + ell(c[0] - R * .38, c[1] - R * .42, R * .3, R * .2, "#ffffff", "opacity='.7'");
      if (tipo === "ar") f += cer(c[0] + R * .15, c[1] - R * .55, .45, "#5c7f1e");
      else f += tratto("M" + q(c[0], c[1] - R * .6) + " l.5,-1.6", "#5c3b1e", .7) + ell(c[0] + 1.3, c[1] - R * .85, 1.1, .5, "#51a332", "transform='rotate(-25 " + f1(c[0] + 1.3) + " " + f1(c[1] - R * .85) + ")'");
      return f;
    }
    perVicino([[-.05, -.05, 5.8, "ar"], [.055, -.045, 5.6, "me"], [-.07, .04, 5.2, "mv"], [.04, .055, 5.2, "ar"], [0, 0, 8, "me"]]).forEach(function (f) { fr += frutto(f[0], f[1], zf + f[2], f[3] === "ar" ? .048 : .044, f[3]); });
    var b1 = P(-.085, .03, zf + 10.6), b2 = P(.07, -.06, zf + 10.8), bm = P(0, .06, zf + 8.2), dB = "M" + q(b1) + " Q" + q(bm) + " " + q(b2);
    fr += tratto(dB, L, 4.6) + tratto(dB, "#ffd43b", 3) + tratto(dB, "#fff3bf", .9, "transform='translate(-.3 -.8)'") + cer(b1[0], b1[1], .9, "#5c3b1e") + cer(b2[0], b2[1], .8, "#5c3b1e");   // la banana
    var sopraBordo = "M" + q(cb.x - cb.rx - 30, cb.y - 40) + " L" + q(cb.x + cb.rx + 30, cb.y - 40) + " L" + q(cb.x + cb.rx + 30, cb.y) + " L" + q(cb.x + cb.rx, cb.y) + " A" + f1(cb.rx) + "," + f1(cb.ry) + " 0 0,1 " + q(cb.x - cb.rx, cb.y) + " L" + q(cb.x - cb.rx - 30, cb.y) + " Z";
    o += dentro(sopraBordo, fr) + pth("M" + q(cb.x - cb.rx, cb.y) + " A" + f1(cb.rx) + "," + f1(cb.ry) + " 0 0,0 " + q(cb.x + cb.rx, cb.y), "none", bordo(L, 1.3)) + pth("M" + q(cb.x - cb.rx + 1.4, cb.y + .6) + " A" + f1(cb.rx - 1.4) + "," + f1(cb.ry - .7) + " 0 0,0 " + q(cb.x + cb.rx - 1.4, cb.y + .6), "none", "stroke='#ffffff' stroke-width='.8' opacity='.8'");
    return s + o;
  });

  // =========================================================
  //  SEDIA DI LEGNO lucido: le gambe davanti tornite, i traversi, lo schienale a due stecche con la spalliera intagliata a cuore,
  //  il cuscino a quadretti col bottone
  // =========================================================
  def("sedia_legno", { tipo: "piedi", nome: "Sedia di legno", fp: [1, 1], box: [-27, -71, 33, 16], dietro: true, azione: "siedi", seduta: 31 }, function () {
    var w = "#b07a4a", AL = .19, BF = .1, BR = -.245, ZS = 25.5, ZT = 28.5, ZC = 31.6, ZM = 50, ROSSO = "#e8484d", pz = [];
    function luc(W, H) { return rett(W * .2, .4, Math.max(.45, W * .16), H - .8, .2, "#ffffff", "opacity='.3'"); }   // il legno lucido: il filo di luce sui montanti
    var LUSTRO = { davanti: luc, dietro: luc, fianco: luc };
    var s = ombra(6, 2, 27, 13);
    // sotto il sedile: le gambe di dietro (quadrate, poi salgono a fare lo schienale), quelle davanti tornite, i traversi
    [-AL, AL].forEach(function (a) {
      pz.push([vicino(a, BR), blocco(a - .02, a + .02, BR - .02, BR + .02, 0, ZS, w, LUSTRO, 1.2)]);
      pz.push([vicino(a, BF), tornito(a, BF, [[0, .019], [1.6, .021], [5, .02], [8, .024], [9.2, .029], [10.4, .024], [14, .022], [19, .025], [21, .03], [22.2, .025], [23.4, .031], [ZS, .031]], legno(w), 1.1, [4, 8], .5)]);
      pz.push([vicino(a, (BF + BR) / 2) - .01, blocco(a - .011, a + .011, BR + .02, BF - .02, 9.5, 11.7, w, null, .9)]);
    });
    pz.push([vicino(0, BR) + .001, blocco(-AL + .02, AL - .02, BR - .011, BR + .011, 13.5, 15.6, w, null, .9)]);
    s += ordina(pz);
    // il sedile, con le venature
    s += blocco(-.235, .235, -.29, .135, ZS, ZT, w, { sopra: function (A, B, C, D) {
      var r = rnd(83), v = "", i;
      for (i = 0; i < 7; i++) { var y = -.27 + i * .06 + r() * .02; v += trattoP("M-.22," + f3(y) + " C" + q3(-.08, y + (r() - .5) * .03) + " " + q3(.06, y + (r() - .5) * .03) + " " + q3(.22, y + (r() - .5) * .02), scuro(w, .3), .6, "opacity='.35'"); }
      return dentro(chiuso([A, B, C, D]), inPiano(ZT, v));
    } }, 1.6);
    // il cuscino a quadretti: gonfio, col bordino e il bottone in mezzo
    var F = forma(0, -.075, .205, .19, .19, 4.6), lv = [giro(F, ZT, .95, 48), giro(F, ZT + 1.7, 1.03, 48), giro(F, ZC, .96, 48)], cu = giro(F, ZC, .96, 48), qd = "", i, j, Qc = .056;
    s += corpo(lv, [[0, chiaro(ROSSO, .35)], [.5, ROSSO], [1, scuro(ROSSO, .38)]], 1.5);
    for (i = -4; i < 4; i++) for (j = -5; j < 4; j++) if ((i + j) & 1) qd += rettP(i * Qc, -.075 + j * Qc, Qc, Qc, ROSSO);
    s += pth(chiuso(cu), "#fffdf6") + dentro(chiuso(cu), inPiano(ZC, qd) + pth(chiuso(cu), rad("cg", [[0, "#ffffff", .3], [.55, "#ffffff", 0], [1, "#000000", .26]], .42, .4, .62))) + pth(chiuso(cu), "none", bordo(scuro(ROSSO, .3), 1.4));
    var cc = P(0, -.075, ZC + .2);
    s += [[-4, -2], [4, -2], [-4, 2], [4, 2]].map(function (g) { return tratto("M" + q(cc[0], cc[1]) + " L" + q(cc[0] + g[0], cc[1] + g[1]), "#000", .6, "opacity='.18'"); }).join("") + cer(cc[0], cc[1], 1.3, scuro(ROSSO, .15), bordo(L, .5)) + cer(cc[0] - .4, cc[1] - .4, .4, "#ffffff", "opacity='.7'");
    // lo schienale: i due montanti, le due stecche, la spalliera intagliata
    var sch = [];
    [-AL, AL].forEach(function (a) { sch.push([vicino(a, BR), blocco(a - .02, a + .02, BR - .02, BR + .02, ZT, ZM + 1, w, LUSTRO, 1.2)]); });
    sch.push([vicino(0, BR) - .001, blocco(-AL + .02, AL - .02, BR - .01, BR + .01, 37, 39.7, w, null, 1) + blocco(-AL + .02, AL - .02, BR - .01, BR + .01, 43, 45.7, w, null, 1)]);
    s += ordina(sch);
    function intaglio(W, H) {   // l'incisione tutt'intorno e il cuore traforato in mezzo
      var cx = W / 2, cy = H / 2 + .3;
      return rett(1.3, 1, W - 2.6, H - 2, 1, "none", "stroke='" + scuro(w, .35) + "' stroke-width='.5' opacity='.6'") + rett(1.8, 1.5, W - 3.6, .5, 0, chiaro(w, .5), "opacity='.6'") +
        pth("M" + f1(cx) + "," + f1(cy + 1.7) + " C" + f1(cx - 3.3) + "," + f1(cy - .3) + " " + f1(cx - 1.7) + "," + f1(cy - 2.7) + " " + f1(cx) + "," + f1(cy - 1) + " C" + f1(cx + 1.7) + "," + f1(cy - 2.7) + " " + f1(cx + 3.3) + "," + f1(cy - .3) + " " + f1(cx) + "," + f1(cy + 1.7) + " Z", "#2e1a0e", "stroke='" + chiaro(w, .35) + "' stroke-width='.5'");
    }
    s += blocco(-AL - .035, AL + .035, BR - .017, BR + .017, ZM, ZM + 6, w, { davanti: intaglio, dietro: intaglio }, 1.5);
    return s;
  });

  // =========================================================
  //  TAVOLO TONDO BIANCO: il piede a tulipano laccato, il piano di marmo bianco con le venature grigie,
  //  il vasetto di vetro con una gerbera rosa
  // =========================================================
  def("tavolo_tondo", { tipo: "piedi", nome: "Tavolo tondo bianco", fp: [1, 1], box: [-39, -77, 49, 25], piano: 46 }, function () {
    var F = forma(0, 0, .46), ZT = 46, ZB = 43.2, r = rnd(717), s = ombra(5, 4, 44, 20);
    // il piede a tulipano: un pezzo solo, dalla base tonda bassa al gambo che si allarga sotto il piano; l'anello dove la base diventa gambo
    var prof = [[0, .27], [.9, .275], [1.9, .266], [3.1, .228], [3.9, .185], [4.8, .14], [6.2, .1], [8.5, .074], [12, .06], [18, .054], [25, .053], [31, .058], [35.5, .07], [38.8, .093], [41.2, .125], [ZB + .3, .158]];
    s += tornito(0, 0, prof, BIANCO, 1.8, [3], 1.2);
    var an = cerchioP(0, 0, 3.5, .21);
    s += pth("M" + q(an.x - an.rx, an.y) + " A" + f1(an.rx) + "," + f1(an.ry) + " 0 0,0 " + q(an.x + an.rx, an.y), "none", "stroke='#ffffff' stroke-width='1' opacity='.9'");
    // il piano: lo spessore arrotondato, poi il marmo
    s += corpo([giro(F, ZB - .2, .985), giro(F, ZB + 1.5, 1.006), giro(F, ZT)], BIANCO, 2.2);
    var top = giro(F, ZT, 1, 72), v = "", i;
    for (i = 0; i < 4; i++) { var y = -.36 + i * .22 + r() * .08, d = "M-.5," + f3(y) + " C" + q3(-.25, y - .12 + r() * .1) + " " + q3(0, y + .1 - r() * .1) + " " + q3(.18, y + (r() - .5) * .1) + " S" + q3(.4, y - .1) + " " + q3(.55, y + (r() - .5) * .15); v += trattoP(d, "#a3abb3", i % 2 ? .7 : 1.2, "opacity='.42'") + trattoP(d, "#d0d5da", 2.6, "opacity='.25' transform='translate(.01 .012)'"); }
    for (i = 0; i < 6; i++) v += "<ellipse cx='" + f3(-.35 + r() * .7) + "' cy='" + f3(-.35 + r() * .7) + "' rx='" + f3(.08 + r() * .1) + "' ry='" + f3(.04 + r() * .05) + "' fill='#dfe3e7' opacity='.35'/>";   // le nuvolette del marmo
    s += pth(chiuso(top), rad("mt", [[0, "#ffffff"], [.7, "#f7f8f9"], [1, "#e4e8eb"]], .38, .35, .75)) + dentro(chiuso(top), inPiano(ZT, v) +
      ell(P(-.16, -.14, ZT)[0], P(-.16, -.14, ZT)[1], 14, 5, "#ffffff", "opacity='.55' transform='rotate(-8 " + q(P(-.16, -.14, ZT)).replace(",", " ") + ")'")) + pth(chiuso(top), "none", bordo(L, 1.8));
    // il vasetto di vetro con la gerbera rosa
    var va = .1, vb = -.27, vz = ZT;
    s += tornito(va, vb, [[vz, .03], [vz + 1, .036], [vz + 4.2, .034], [vz + 6.8, .02], [vz + 8.6, .015], [vz + 9.6, .018]], [[0, "#ffffff", .9], [.4, "#e3f4fb", .6], [1, "#8fc3d8", .8]], 1);
    var vc = P(va, vb, vz + 2.6);
    s += ell(vc[0], vc[1], 1.8, .8, "#74c0fc", "opacity='.5'") + tratto("M" + q(vc[0] - 1.4, vc[1] - 1.8) + " l0,-3", "#ffffff", .7, "opacity='.9'");
    var st = P(va, vb, vz + 9.4), fio = P(va - .02, vb + .015, vz + 19), dS = "M" + q(st) + " Q" + q(st[0] + 2, st[1] - 5) + " " + q(fio);
    s += tratto(dS, "#2b8a3e", 1.2) + ell(st[0] + 2.4, st[1] - 3.6, 2.2, .9, "#40c057", bordo("#2b6a2e", .5) + " transform='rotate(-35 " + f1(st[0] + 2.4) + " " + f1(st[1] - 3.6) + ")'");
    for (i = 0; i < 12; i++) { var an = i / 12 * 360; s += ell(fio[0], fio[1] - 2.9, 1.25, 3, i % 2 ? "#f783ac" : "#faa2c1", bordo("#a61e4d", .4) + " transform='rotate(" + an + " " + f1(fio[0]) + " " + f1(fio[1]) + ") scale(1 1)'"); }
    return s + cer(fio[0], fio[1], 1.8, "#7a4a12", bordo(L, .5)) + cer(fio[0] - .4, fio[1] - .4, .5, "#ffd43b");
  });

  // =========================================================
  //  MICROONDE (da appoggiare sopra): lo sportello di vetro nero con la retina, il piatto girevole, la maniglia,
  //  il pannello col display e i tasti, la manopola; da dietro le prese d'aria e il cavo
  // =========================================================
  def("microonde", { tipo: "sopra", nome: "Microonde", fp: [1, 1], box: [-25, -31, 33, 16], dietro: true }, function () {
    var A0 = -.25, A1 = .25, B0 = -.18, B1 = .18, ZT = 18.4, s = ombra(4, 2, 29, 13);
    DEFS.push("<pattern id='" + p + "rete' width='1.3' height='1.3' patternUnits='userSpaceOnUse'><circle cx='.65' cy='.65' r='.33' fill='#7a858e'/></pattern>");
    perVicino([[A0 + .03, B0 + .03], [A1 - .07, B0 + .03], [A0 + .03, B1 - .07], [A1 - .07, B1 - .07]]).forEach(function (g) { s += blocco(g[0], g[0] + .04, g[1], g[1] + .04, 0, 1, "#2b3035", null, .8); });
    var arg = [lin("ms", [[0, "#ffffff"], [1, "#dde2e6"]], 0, 0, 1, 1), lin("ml", [[0, "#f1f3f5"], [1, "#cfd5da"]], 0, 0, 0, 1), lin("md", [[0, "#b3bcc3"], [1, "#939da6"]], 0, 0, 0, 1)];
    function davanti(W, H) {
      var vt = rq(.8, .8, 21.4, H - 1.6, 1.4), o = pth(vt, lin("pt", [[0, "#353c42"], [1, "#121518"]], 0, 0, 0, 1), bordo(L, .9));   // lo sportello di vetro nero
      o += rett(2.6, 2.6, 15.6, H - 5.2, 1, "#2a3035", "stroke='#4b555d' stroke-width='.5'") + rett(2.6, 2.6, 15.6, H - 5.2, 1, "url(#" + p + "rete)", "opacity='.6'") + ell(10.4, H - 4.6, 6.2, 1.3, "none", "stroke='#6c7780' stroke-width='.5' opacity='.8'");   // la retina e il piatto girevole
      o += dentro(vt, poly([[4, 0], [9.5, 0], [2.5, H], [-3, H]], "#ffffff", "opacity='.17'") + poly([[11.5, 0], [13.2, 0], [6.2, H], [4.5, H]], "#ffffff", "opacity='.12'"));
      o += rett(19, 3, 1.6, H - 6, .8, lin("mg", CROMO, 0, 0, 1, 0), bordo(L, .5));   // la maniglia
      o += rett(22.9, .8, W - 23.7, H - 1.6, 1, lin("pc", [[0, "#f6f7f8"], [1, "#cbd2d7"]], 0, 0, 0, 1), bordo(L, .7));   // il pannello dei comandi
      o += rett(23.7, 1.9, W - 25.3, 2.9, .5, "#0d1114") + cifre(24.3, 2.4, 3, "#69db7c", 1.9);
      [0, 1].forEach(function (cx) { [0, 1, 2].forEach(function (ry) { o += rett(23.8 + cx * 2.9, 5.7 + ry * 2.1, 2.3, 1.5, .5, "#e9ecef", "stroke='#8d98a1' stroke-width='.35'"); }); });
      return o + cer(26.2, 14, 1.8, rad("dm", [[0, "#ffffff"], [.55, "#d5dce1"], [1, "#7c8890"]], .35, .3, .8), bordo(L, .5)) + tratto("M26.2,14 L25.4,12.8", "#2b3035", .5);
    }
    function dietro(W, H) {   // le prese d'aria, l'etichetta e il cavo
      var o = "", i, j;
      for (i = 0; i < 4; i++) for (j = 0; j < 6; j++) o += rett(5 + j * 3.6, 3 + i * 2.4, 2.6, .9, .4, "#7d8991");
      o += rett(4, H - 6, 7, 3.6, .4, "#fff9db", bordo("#adb5bd", .4));
      return o + tratto("M" + f1(W * .78) + "," + f1(H - 4) + " C" + f1(W * .84) + "," + f1(H + 1) + " " + f1(W * .7) + "," + f1(H + 2 + 1.5) + " " + f1(W * .6) + "," + f1(H + 3), "#22272b", 1.2);
    }
    function fianco(W, H) { var o = "", i; for (i = 0; i < 7; i++) o += rett(W - 15 + i * 1.7, 4, .8, 8, .4, "#7d8991"); return specchiaSe(W, o + poly([[W * .2, 0], [W * .32, 0], [W * .42, H], [W * .3, H]], "#ffffff", "opacity='.15'")); }
    function sopra(A, B, C, D) { var lm = limiti([A, B, C, D]), w = lm[2] - lm[0]; return dentro(chiuso([A, B, C, D]), poly([[lm[0] + w * .25, lm[1]], [lm[0] + w * .42, lm[1]], [lm[0] + w * .22, lm[3]], [lm[0] + w * .05, lm[3]]], "#ffffff", "opacity='.35'")); }
    return s + blocco(A0, A1, B0, B1, 1, ZT, arg, { davanti: davanti, dietro: dietro, fianco: fianco, sopra: sopra }, 1.8);
  });

  // =========================================================
  //  MACCHINETTA DEL CAFFÈ (da appoggiare sopra): nera lucida con le finiture cromate, la tazzina col caffè che fuma
  //  sulla griglia; da dietro il serbatoio dell'acqua trasparente
  // =========================================================
  def("macchina_caffe", { tipo: "sopra", nome: "Macchinetta del caffè", fp: [1, 1], box: [-18, -30, 22, 11], dietro: true }, function () {
    var s = ombra(3, 2, 18, 8);
    var NERO = [[0, "#6b737a"], [.2, "#343a40"], [.68, "#16191c"], [1, "#07080a"]];   // il nero lucido, da sinistra (luce) a destra
    function pezzo(F, z0, z1, n) {   // un pezzo nero lucido con gli angoli tondi: la sagoma, il riflesso, il sopra
      var lv = [giro(F, z0, 1, n || 40), giro(F, z1, 1, n || 40)];
      return corpo(lv, NERO, 1.4) + lucido(sagoma(lv), .45, .5) + pth(chiuso(giro(F, z1, 1, n || 40)), lin("nt", [[0, "#727a81"], [.55, "#2f353a"], [1, "#1a1d20"]], 0, 0, 1, 1), bordo(L, 1));
    }
    function base() {   // la vaschetta, con la griglia cromata davanti dove sta la tazzina
      var o = pezzo(forma(0, -.02, .12, .205, .205, 4), 0, 2.4), gq = forma(0, .1, .1, .075, .075, 5), gp = giro(gq, 2.4, 1, 36), r = "", i;
      for (i = 1; i < 6; i++) r += tratto(linea(P(-.1 + i * .033, .02, 2.4), P(-.1 + i * .033, .18, 2.4)), "#5f6b74", .5);
      return o + pth(chiuso(gp), lin("gq", CROMO, 0, 0, 1, 1), bordo(L, .7)) + dentro(chiuso(gp), r);
    }
    function serbatoio() {   // il serbatoio trasparente dietro: l'acqua azzurra, il vetro, il coperchio nero
      var F = forma(0, -.19, .085, .045, .045, 4), o = corpo([giro(F, 2.4, .94, 32), giro(F, 12.5, .94, 32)], [[0, "#a5d8ff"], [.5, "#4dabf7"], [1, "#1864ab"]], .5);
      o += pth(chiuso(giro(F, 12.5, .94, 32)), "#b8e0ff", "stroke='#ffffff' stroke-width='.5'");
      o += corpo([giro(F, 2.4, 1, 32), giro(F, 19, 1, 32)], [[0, "#ffffff", .6], [.35, "#e7f5ff", .22], [1, "#74c0fc", .5]], 1.1) + lucido(sagoma([giro(F, 2.4, 1, 32), giro(F, 19, 1, 32)]), .8, .45);
      return o + pezzo(forma(0, -.19, .09, .05, .05, 4), 19, 20.4, 32);
    }
    function torre() {   // la colonna, con la riga cromata davanti
      var o = pezzo(forma(0, -.07, .105, .095, .095, 3.6), 2.4, 14.6);
      return G > 0 ? o + tratto(linea(P(.07, .02, 3.6), P(.07, .02, 13.6)), "#dfe5e9", 1, "opacity='.9'") : o;
    }
    function testa() {   // la testa: la fascia cromata sotto, il nero lucido, la lucina rossa, la leva ad arco e i due tasti sopra
      var F = forma(0, -.015, .114, .142, .15, 3.4), o = corpo([giro(F, 14, 1, 40), giro(F, 15.3, 1.01, 40)], CROMO, 1.2) + pezzo(F, 15.3, 21.2);
      if (G > 0) { var lr = P(-.07, .1, 18.2); o += cer(lr[0], lr[1], 1, "#ff6b6b", bordo(L, .4)) + cer(lr[0] - .3, lr[1] - .3, .35, "#ffffff"); }
      var dL = "M" + q(P(0, -.12, 21.2)) + " C" + q(P(0, -.1, 25.6)) + " " + q(P(0, .0, 25.6)) + " " + q(P(0, .025, 21.4));
      o += cromo(dL, 2.6);
      [-.05, .05].forEach(function (a, i) { var c = P(a, .09, 21.2); o += ell(c[0], c[1] + .4, 2.1, 1.1, "#000", "opacity='.3'") + ell(c[0], c[1], 2, 1, lin("tb", CROMO, 0, 0, 1, 1), bordo(L, .5)) + ell(c[0], c[1], 1.1, .55, "none", "stroke='" + (i ? "#74c0fc" : "#ffffff") + "' stroke-width='.5'"); });
      return o;
    }
    function beccuccio() { var F = forma(0, .075, .022); return corpo([giro(F, 12.6, 1, 20), giro(F, 14.2, 1, 20)], CROMO, 1); }
    function tazzina() {   // la tazzina bianca col piattino, il caffè con la crema
      var a = 0, b = .1, z0 = 2.4, o = "", pt = forma(a, b, .062);
      o += corpo([giro(pt, z0, 1, 32), giro(pt, z0 + .9, 1, 32)], CER, .9) + pth(chiuso(giro(pt, z0 + .9, 1, 32)), "#f4f7f9", bordo(L, .7));
      var ma = P(a + .052, b, z0 + 4.6), mb = P(a + .07, b, z0 + 3.4), mc = P(a + .045, b, z0 + 2.4), dM = "M" + q(ma) + " Q" + q(mb[0] + 1.6, mb[1]) + " " + q(mc);
      var manico = tratto(dM, L, 2.4) + tratto(dM, "#f1f4f6", 1.1);
      var corpoT = tornito(a, b, [[z0 + .9, .026], [z0 + 2, .03], [z0 + 4.4, .037], [z0 + 5.6, .04]], CER, 1), cf = forma(a, b, .033);
      corpoT += pth(chiuso(giro(cf, z0 + 5.3, 1, 28)), rad("cr", [[0, "#e7b07a"], [.55, "#b8743d"], [1, "#5e3317"]], .45, .45, .6), bordo(L, .5));
      return o + (vicino(.06, 0) > 0 ? corpoT + manico : manico + corpoT);
    }
    function fumo() { var c = P(0, .1, 9); return [-1.2, 1.4].map(function (dx, i) { var d = "M" + q(c[0] + dx, c[1]) + " c" + (i ? "-2,-2.5 2,-4.5 0,-7" : "2,-2.5 -2,-4.5 0,-7") + " c-1.6,-1.8 1,-3 .2,-4.6"; return tratto(d, "#ffffff", 1.2, "opacity='.65'"); }).join(""); }
    if (G > 0) return s + base() + serbatoio() + torre() + testa() + beccuccio() + tazzina() + fumo();
    return s + base() + tazzina() + fumo() + beccuccio() + torre() + testa() + serbatoio();
  });

  // =========================================================
  function misure(d) { if (d.tipo === "parete") return { w: 62, h: 200 }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  // prezzi: gli stessi dei mobili della casa (js/casa.js); è tutta roba bella (qual 2)
  var PREZZI = { frigo_moderno: 2200, cucina_moderna: 1600, lavello: 1300, pensile: 700, tavolo_pranzo: 1100, sedia_legno: 350, tavolo_tondo: 1100, microonde: 600, macchina_caffe: 450 };
  function svgPiatto(w, h, c) { return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " " + h + "' width='" + w + "' height='" + h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + c + "</svg>"; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: "cucina", w: m.w, h: m.h, fp: d.fp ? d.fp.slice() : [1, 1], prezzo: PREZZI[nome], qual: 2 };
      if (d.tipo !== "parete") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.piano) o.piano = d.piano;
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "mcuc" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1;
      var c; try { c = d.fn(opz); } finally { G = 1; }
      if (d.tipo === "parete") return svgPiatto(m.w, m.h, c);
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

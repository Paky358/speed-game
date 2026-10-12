/* =========================================================
   SPeeD GAME — I MOBILI DELLA CASA VISTA DALL'ALTO (SGMobiliArte)
   Per ora il BAGNO. Stessi mobili della casa vista di lato (casa.js), visti dall'alto in diagonale come il giardino:
   una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Tre tipi:
   - "piedi": in prospettiva; il davanti guarda in basso a sinistra, la schiena verso l'angolo in alto/destra dell'impronta.
     Con { dietro: true } lo stesso mobile girato di 180° (si vede la schiena). Gli altri due versi li fa il motore con lo specchio.
   - "parete": piatto, di fronte, in un rettangolo 62 × 200 (un pezzo di muro lungo una mattonella, dal pavimento al soffitto).
   - "terra": piatto, visto da sopra, 100 × 100 per mattonella (il motore lo piega sul rombo).
   Stile dei reperti e del giardino: sfumature (luce da in alto a sinistra), contorno caldo scuro, ombra morbida, riflessi.
   SGMobiliArte = { nomi(), info(nome), svg(nome, { col, dietro }) }
   ========================================================= */
(function () {
  "use strict";

  // ---------- attrezzi ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato (da dietro)
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
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
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  // sfumature e ritagli (gli id col prefisso del disegno; quelle "sul posto" hanno anche un numero, perché cambiano a ogni forma)
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
  var ORO = [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]];
  function cromo(d, w) { return tratto(d, L, w + 2.4) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.7, w * .38), "opacity='.95' transform='translate(-.4 -.5)'"); }   // un tubo cromato

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  // u = colonne (scende a destra), v = righe (scende a sinistra); (0,0,0) = centro dell'impronta. Girato: a e b cambiano segno.
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
  function inviluppo(pp) {   // il contorno esterno di tanti punti (per i pezzi tondi: la sagoma tra il bordo di sopra e quello di sotto)
    var a = pp.slice().sort(function (m, n) { return m[0] - n[0] || m[1] - n[1]; }), lo = [], hi = [], i;
    function cr(o, m, n) { return (m[0] - o[0]) * (n[1] - o[1]) - (m[1] - o[1]) * (n[0] - o[0]); }
    for (i = 0; i < a.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], a[i]) <= 0) lo.pop(); lo.push(a[i]); }
    for (i = a.length - 1; i >= 0; i--) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], a[i]) <= 0) hi.pop(); hi.push(a[i]); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  function corpo(livelli, stops, lw) {   // un pezzo tondo pieno (ceramica, vimini, vaso): la sagoma sfumata da sinistra a destra
    var pp = inviluppo([].concat.apply([], livelli)), b = limiti(pp);
    return pth(chiuso(pp), lin("cx", stops, b[0], 0, b[2], 0, true), bordo(L, lw || 2.4));
  }
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }
  function lucido(pp, k, alto) {   // il riflesso bianco, vicino al bordo di sinistra (da dove viene la luce)
    var b = limiti(pp), w = b[2] - b[0], h = b[3] - b[1];
    return dentro(chiuso(pp), ell(b[0] + w * .19, b[1] + h * (alto || .5), Math.max(1.6, w * .05), h * .3, "#ffffff", "opacity='" + (k || .7) + "'"));
  }

  // ---------- i mobili squadrati ----------
  // una faccia piatta messa in diagonale: o = il suo angolo in alto a sinistra sullo schermo; dir 1 = la faccia di sinistra, -1 = quella di destra.
  // Dentro si disegna di fronte, come i mobili della casa vista di lato: in larghezza 61 = 1 metro, in altezza come z.
  function faccia(o, dir, c) { return "<g transform='matrix(.8197 " + (dir > 0 ? ".4098" : "-.4098") + " 0 1 " + f1(o[0]) + " " + f1(o[1]) + ")'>" + c + "</g>"; }
  function tinte(c) {   // i tre colori: sopra, la faccia di sinistra (alla luce), quella di destra (in ombra)
    if (typeof c !== "string") return c;
    var k = c.slice(1);
    return [lin("ts" + k, [[0, chiaro(c, .32)], [1, chiaro(c, .1)]], 0, 0, 1, 1), lin("tl" + k, [[0, chiaro(c, .12)], [1, scuro(c, .06)]], 0, 0, 0, 1), lin("td" + k, [[0, scuro(c, .2)], [1, scuro(c, .34)]], 0, 0, 0, 1)];
  }
  function ceramica() { return [lin("ks", [[0, "#ffffff"], [1, "#edf2f5"]], 0, 0, 1, 1), lin("kl", [[0, "#ffffff"], [1, "#e2e9ed"]], 0, 0, 0, 1), lin("kd", [[0, "#cbd5db"], [1, "#a9b5bd"]], 0, 0, 0, 1)]; }
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
  function maniglia(x, y, w, h) { return rett(x, y, w, h, Math.min(w, h) / 2, lin("mn", CROMO, 0, 0, 1, 0), bordo(L, .8)); }
  function pomello(x, y, r) { return cer(x, y + .5, r, scuro("#9ca8b0", .3)) + cer(x, y, r, rad("pm", [[0, "#ffffff"], [.5, "#d4dbe0"], [1, "#7d8991"]], .35, .3, .8), bordo(L, .8)); }
  function retro(c) {   // la schiena di un mobile: un pannello liscio con le viti
    return function (W, H) { return rett(2.5, 2.5, W - 5, H - 5, 1, "none", "stroke='" + scuro(c, .22) + "' stroke-width='.9' opacity='.8'") + [[4.5, 4.5], [W - 4.5, 4.5], [4.5, H - 4.5], [W - 4.5, H - 4.5]].map(function (v) { return cer(v[0], v[1], .8, scuro(c, .35)); }).join(""); };
  }

  // ---------- i colori dei mobili ----------
  var COL_MOBILE = [{ id: "azzurro", nome: "azzurro polvere", c: "#6c8ea0" }, { id: "bianco", nome: "bianco", c: "#eef1f3" }, { id: "legno", nome: "legno chiaro", c: "#b88454" },
    { id: "salvia", nome: "verde salvia", c: "#8cb39a" }, { id: "rosa", nome: "rosa", c: "#e59bb0" }, { id: "antracite", nome: "antracite", c: "#555b62" }];
  var COL_STOFFA = [{ id: "rosa", nome: "rosa", c: "#f783ac" }, { id: "azzurro", nome: "azzurro", c: "#4dabf7" }, { id: "menta", nome: "verde menta", c: "#38c9a0" },
    { id: "giallo", nome: "giallo", c: "#fcc419" }, { id: "bianco", nome: "bianco", c: "#f1f3f5" }, { id: "lilla", nome: "lilla", c: "#b197fc" }];
  function colore(lista, o) { var id = o && o.col, i; for (i = 0; i < lista.length; i++) if (lista[i].id === id) return lista[i].c; return lista[0].c; }

  // il registro: box = [x0, y0, x1, y1] attorno al centro dell'impronta (solo per i mobili in piedi)
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  WC: la cassetta col tasto, il coperchio alzato, la tazza col sedile e l'acqua
  // =========================================================
  def("wc_moderno", { tipo: "piedi", nome: "Gabinetto moderno", fp: [1, 1], box: [-37, -81, 44, 26], dietro: true }, function () {
    var s = ombra(5, 7, 36, 16), girato = G < 0;
    var cas = forma(0, -.37, .225, .095, .095, 5), cop = forma(0, -.37, .243, .112, .112, 5);
    var taz = forma(0, -.03, .185, .25, .2), sed = forma(0, -.03, .2, .27, .215), bu = forma(0, -.01, .12, .175, .105), acq = forma(0, .025, .095, .11, .085);
    function cassetta() {
      var r = corpo([giro(cas, 30), giro(cas, 57)], CER), sil = sagoma([giro(cas, 30), giro(cas, 57)]);
      r += lucido(sil, .6, .55);
      r += corpo([giro(cop, 56.5), giro(cop, 61)], CER, 2) + pth(chiuso(giro(cop, 61)), lin("cp", [[0, "#ffffff"], [1, "#e6edf1"]], 0, 0, 1, 1), bordo(L, 1.5));
      var t = P(0, -.37, 61);   // il tasto doppio dello sciacquone
      r += ell(t[0] + .4, t[1] + 1, 6.4, 3.3, "#8b979f", bordo(L, 1.1)) + ell(t[0], t[1], 6, 3, rad("tb", [[0, "#ffffff"], [.6, "#dfe5e9"], [1, "#98a4ac"]], .4, .35, .75), bordo(L, 1.1)) +
        tratto("M" + q(t[0] - 1.2, t[1] - 2.8) + " L" + q(t[0] + 1.2, t[1] + 2.8), "#7d8991", .9);
      return r;
    }
    function coperchio() {   // il coperchio alzato, appoggiato alla cassetta: un ovale in piedi
      var f1p = [], f2p = [], i;
      for (i = 0; i < 40; i++) {
        var t = i / 40 * 6.2832, sn = Math.sin(t), a = .19 * Math.cos(t) * (1 - .14 * Math.max(0, sn)), z = 45.5 + 13.5 * sn, b = -.232 - (z - 32) * .0011;
        f1p.push(P(a, b, z)); f2p.push(P(a, b - .028, z));
      }
      var vis = girato ? f2p : f1p, r = pth(chiuso(inviluppo(f1p.concat(f2p))), "#d3dce2", bordo(L, 2.2));
      r += pth(chiuso(vis), lin("cv", [[0, "#ffffff"], [.7, "#eef3f6"], [1, "#cdd7dd"]], 0, 0, 1, 1), bordo(L, 1.5));
      var b0 = limiti(vis), cx = (b0[0] + b0[2]) / 2, cy = (b0[1] + b0[3]) / 2;
      return r + ell(cx, cy + 1, (b0[2] - b0[0]) * .32, (b0[3] - b0[1]) * .34, "none", "stroke='#c7d1d8' stroke-width='1.3'") + lucido(vis, .55, .4);
    }
    function tazza() {
      var ba = forma(0, -.2, .115, .17, .17), die = forma(0, -.31, .16, .07, .07);   // la base (va indietro fin sotto la cassetta) e il pezzo che regge la cassetta
      var r = corpo([giro(ba, 3.5, 1.06, 40), giro(ba, 0, 1.1, 40)], CER, 2);   // il piede
      var lv = [giro(taz, 30), giro(die, 27, 1, 40), giro(taz, 21, .97), giro(ba, 9, 1, 40), giro(ba, 3, .96, 40)], sil = sagoma(lv);
      r += corpo(lv, CER) + lucido(sil, .75, .42);
      r += corpo([giro(sed, 29.5), giro(sed, 32.5)], [[0, "#ffffff"], [.6, "#e9eef1"], [1, "#b9c5cd"]], 2);   // il sedile
      var top = giro(sed, 32.5), bp = giro(bu, 32.5);
      r += pth(chiuso(top), lin("sd", [[0, "#ffffff"], [1, "#e8eef1"]], 0, 0, 1, 1), bordo(L, 1.7));
      r += pth(chiuso(bp), "#a9b7c0", bordo(L, 1.4));   // il buco: il bordo fa ombra in alto a sinistra
      r += dentro(chiuso(bp), pth(chiuso(sposta(bp, 2.4, 2.6)), rad("in", [[0, "#ffffff"], [.7, "#e6edf1"], [1, "#c9d4db"]], .5, .55, .6)) +
        pth(chiuso(giro(acq, 25)), lin("aq", [[0, "#c5ecff"], [.6, "#74c0fc"], [1, "#3d95d9"]], 0, 0, 1, 1), bordo("#2f7fb8", 1)) +
        tratto("M" + q(P(-.05, .01, 25)) + " Q" + q(P(0, -.03, 25)) + " " + q(P(.05, -.02, 25)), "#ffffff", 1.3, "opacity='.9'"));
      return r + pth(chiuso(bp), "none", bordo(L, 1.4));
    }
    return s + (girato ? tazza() + coperchio() + cassetta() : cassetta() + coperchio() + tazza());
  });

  // =========================================================
  //  LAVANDINO col mobiletto a due ante, il piano di ceramica, la vaschetta, il rubinetto e la saponetta
  // =========================================================
  def("lavandino_mobile", { tipo: "piedi", nome: "Lavandino col mobiletto", fp: [1, 1], box: [-46, -83, 56, 32], dietro: true, colori: COL_MOBILE }, function (o) {
    var c = colore(COL_MOBILE, o), s = ombra(7, 9, 46, 20);
    s += blocco(-.31, .31, -.44, .02, 0, 4.5, scuro(c, .45), null, 1.6);   // lo zoccolo, rientrato
    s += blocco(-.36, .36, -.46, .06, 4.5, 46, c, {
      davanti: function (W, H) {   // le due ante con le maniglie in mezzo (come il mobiletto della casa)
        var g = 1.5, w2 = (W - 3 * g) / 2;
        return pannello(c, w2, H - 4, [g, 2]) + pannello(c, w2, H - 4, [2 * g + w2, 2]) + maniglia(W / 2 - 4.4, 7, 1.9, 12) + maniglia(W / 2 + 2.5, 7, 1.9, 12);
      },
      dietro: retro(c)
    });
    s += blocco(-.39, .39, -.48, .1, 46, 52.5, ceramica(), null, 2.2);   // il piano di ceramica
    var vas = forma(0, -.17, .25, .155, .15), bp = giro(vas, 52.5), sc = P(0, -.145, 52.5);
    s += pth(chiuso(bp), "#a6b4bd", bordo(L, 1.5)) + dentro(chiuso(bp), pth(chiuso(sposta(bp, 2.6, 3.2)), rad("vf", [[0, "#ffffff"], [.65, "#e7eef2"], [1, "#c6d1d8"]], .5, .55, .6)) +
      ell(sc[0], sc[1], 3.2, 1.6, "#8d9aa2", bordo(L, .7)) + ell(sc[0] - .3, sc[1] - .3, 1.6, .8, "#5b6870")) + pth(chiuso(bp), "none", bordo(L, 1.5));
    function rubinetto() {
      var col = forma(0, -.41, .036, .036, .036), r = corpo([giro(col, 52.5, 1, 24), giro(col, 64, 1, 24)], CROMO, 1.5) + pth(chiuso(giro(col, 64, 1, 24)), "#f2f5f7", bordo(L, 1));
      var a = P(0, -.405, 62), m = P(0, -.3, 67.5), e = P(0, -.25, 58.5);
      r += cromo(linea(P(0, -.41, 64.5), P(0, -.465, 67.5)), 2.4) + cromo("M" + q(a) + " Q" + q(m) + " " + q(e), 2.8);   // la leva (corta, all'indietro) e la canna curva
      return r + ell(e[0], e[1] + 1, 1.5, .8, "#4a5560");
    }
    function sapone() {   // la saponetta rosa
      return blocco(.23, .33, -.43, -.35, 52.5, 55.5, "#f497b6", null, 1.3) + tratto(linea(P(.25, -.36, 55.5), P(.31, -.36, 55.5)), "#ffffff", .9, "opacity='.7'");
    }
    return s + ordina([[vicino(0, -.41), rubinetto()], [vicino(.28, -.39), sapone()]]);
  });

  // =========================================================
  //  VASCA coi piedini dorati: l'acqua azzurra con la schiuma, il rubinetto sul bordo di dietro
  // =========================================================
  def("vasca", { tipo: "piedi", nome: "Vasca da bagno", fp: [2, 1], box: [-92, -69, 110, 49], dietro: true }, function () {
    var s = ombra(9, 14, 98, 32), V = forma(0, -.05, .88, .37, .37, 3.4), D = forma(0, -.05, .8, .29, .29, 3.4), Wt = forma(0, -.05, .76, .25, .25, 3.4), r = rnd(57);
    [[-.6, -.21], [.6, -.21], [-.6, .11], [.6, .11]].sort(function (m, n) { return vicino(m[0], m[1]) - vicino(n[0], n[1]); }).forEach(function (f) {   // i piedini a zampa di leone, corti, sotto la pancia
      var a = P(f[0], f[1], 11), m = P(f[0] * 1.03, f[1] + (f[1] < -.05 ? -.015 : .015), 5), e = P(f[0] * 1.06, f[1] + (f[1] < -.05 ? -.035 : .035), 2), d = "M" + q(a) + " Q" + q(m[0] + (e[0] < a[0] ? -1 : 1), m[1]) + " " + q(e);
      s += tratto(d, L, 8.4) + tratto(d, lin("pd", ORO, 0, 0, 1, 0), 5.6) + tratto(d, "#fff4c4", 1.3, "opacity='.8' transform='translate(-1 -.3)'") +
        ell(e[0], e[1] + .4, 4.4, 2.6, lin("pz", ORO, 0, 0, 1, 1), bordo(L, 1.4)) + tratto("M" + q(e[0] - 2.2, e[1] + 1.2) + " l0,1.4 M" + q(e[0], e[1] + 1.7) + " l0,1.4 M" + q(e[0] + 2.2, e[1] + 1.2) + " l0,1.4", "#8a6210", .8);
    });
    var lv = [giro(V, 34), giro(V, 22, [.985, .93]), giro(V, 9, [.9, .72])], sil = sagoma(lv);
    s += corpo(lv, CER) + lucido(sil, .7, .45);
    s += corpo([giro(V, 33, 1.025), giro(V, 37.5, 1.025)], [[0, "#ffffff"], [.6, "#eef3f6"], [1, "#b8c4cc"]], 2.2);   // il bordo arrotondato
    var top = giro(V, 37.5, 1.025), ap = giro(D, 37.5);
    s += pth(chiuso(top), lin("vt", [[0, "#ffffff"], [1, "#e9eff2"]], 0, 0, 1, 1), bordo(L, 1.8));
    // dentro: la parete interna (il bordo fa ombra in alto a sinistra), l'acqua, la schiuma
    var acqua = giro(Wt, 26), sch = "";
    [[-.5, -.08, 9], [-.12, .04, 7], [.3, -.14, 8], [.58, .02, 6], [-.66, .1, 4], [.05, -.16, 4]].forEach(function (b) {
      var c = P(b[0], b[1], 26), k;
      for (k = 0; k < b[2]; k++) {
        var x = c[0] + (r() - .5) * 26, y = c[1] + (r() - .5) * 8, rr = 2.2 + r() * 3.2;
        sch += cer(x, y, rr, "#ffffff", "stroke='#a9d4ee' stroke-width='.8'") + cer(x - rr * .35, y - rr * .35, rr * .3, "#e3f4ff");
      }
    });
    s += pth(chiuso(ap), "#9fb2be", bordo(L, 1.5)) + dentro(chiuso(ap), pth(chiuso(sposta(ap, 3, 4)), lin("vi", [[0, "#f6fafc"], [1, "#d3dee5"]], 0, 0, 0, 1)) +
      pth(chiuso(acqua), lin("va", [[0, "#bfe9ff"], [.55, "#7cc8f7"], [1, "#4aa3e6"]], 0, 0, .3, 1), bordo("#2f7fb8", 1)) +
      tratto("M" + q(P(-.55, .1, 26)) + " Q" + q(P(-.3, .0, 26)) + " " + q(P(-.1, .12, 26)) + " M" + q(P(.2, .08, 26)) + " Q" + q(P(.4, -.02, 26)) + " " + q(P(.6, .08, 26)), "#ffffff", 1.2, "opacity='.75'") + sch) +
      pth(chiuso(ap), "none", bordo(L, 1.5));
    // il rubinetto sul bordo di dietro: la canna a collo di cigno e le due manopole (calda e fredda)
    function manopola(a, col) {
      var b = P(a, -.39, 37.5), t = P(a, -.39, 43);
      return cromo(linea(b, t), 2.4) + tratto("M" + q(t[0] - 4, t[1] - 2) + " L" + q(t[0] + 4, t[1] + 2) + " M" + q(t[0] - 4, t[1] + 2) + " L" + q(t[0] + 4, t[1] - 2), L, 3.4) +
        tratto("M" + q(t[0] - 4, t[1] - 2) + " L" + q(t[0] + 4, t[1] + 2) + " M" + q(t[0] - 4, t[1] + 2) + " L" + q(t[0] + 4, t[1] - 2), "#dfe5e9", 1.6) + cer(t[0], t[1], 1.9, col, bordo(L, .7));
    }
    var rb = P(0, -.395, 37.5), rt = P(0, -.395, 53), rm = P(0, -.3, 58), re = P(0, -.25, 47);
    var cig = "M" + q(rb) + " L" + q(rt) + " Q" + q(rm) + " " + q(re);
    return s + ordina([[vicino(-.12, -.39), manopola(-.12, "#e03131")], [vicino(.12, -.39), manopola(.12, "#339af0")], [vicino(0, -.39) + .001, cromo(cig, 3) + ell(re[0], re[1] + 1, 1.6, .8, "#4a5560")]]);
  });

  // =========================================================
  //  BOX DOCCIA: il piatto, la parete di piastrelle col soffione e il miscelatore, i vetri trasparenti col telaio cromato
  // =========================================================
  def("doccia", { tipo: "piedi", nome: "Box doccia", fp: [1, 1], box: [-58, -168, 58, 33], dietro: true }, function () {
    var R = .47, ZT = 138, s = ombra(5, 8, 50, 22, .9), girato = G < 0;
    s += blocco(-R, R, -R, R, 0, 6.5, ceramica(), null, 2.2);   // il piatto doccia
    var fondo = [Puv(-R + .07, -R + .07, 6.5), Puv(R - .07, -R + .07, 6.5), Puv(R - .07, R - .07, 6.5), Puv(-R + .07, R - .07, 6.5)];
    s += poly(fondo, lin("pf", [[0, "#cfd9df"], [1, "#eef3f6"]], 0, 0, 1, 1), "stroke='#9fb0bb' stroke-width='1'");
    var sc = P(0, 0, 6.5); s += ell(sc[0], sc[1], 6, 3, lin("sc", CROMO, 0, 0, 1, 1), bordo(L, 1)) + tratto("M" + q(sc[0] - 3.4, sc[1]) + " L" + q(sc[0] + 3.4, sc[1]) + " M" + q(sc[0] - 2.4, sc[1] - 1.1) + " L" + q(sc[0] + 2.4, sc[1] - 1.1) + " M" + q(sc[0] - 2.4, sc[1] + 1.1) + " L" + q(sc[0] + 2.4, sc[1] + 1.1), "#6f7c85", .7);
    function piastrelle(W, H) {   // la faccia di dentro della parete: piastrelline bianche e azzurre, il miscelatore e l'asta della doccetta
      var r = rett(0, 0, W, H, 0, lin("pp", [[0, "#ffffff"], [1, "#dfeef5"]], 0, 0, 0, 1)), x, y;
      for (y = 0; y < H; y += 9.6) for (x = 0; x < W; x += 9.6) { if ((x + y) % 3 < 1) r += rett(x, y, 9.6, 9.6, 0, "#cfe8f3", "opacity='.6'"); }
      for (x = 9.6; x < W; x += 9.6) r += rett(x - .3, 0, .6, H, 0, "#a9c7d4");
      for (y = 9.6; y < H; y += 9.6) r += rett(0, y - .3, W, .6, 0, "#a9c7d4");
      r += rett(W * .78 - 1.2, 30, 2.4, 62, 1.2, lin("as", CROMO, 0, 0, 1, 0), bordo(L, .8)) + rett(W * .78 - 4, 70, 8, 4, 1.5, lin("as2", CROMO, 0, 0, 1, 0), bordo(L, .8)) +   // l'asta col supporto
        rett(W * .78 - 2.6, 54, 5.2, 18, 2.6, lin("dc", CROMO, 0, 0, 1, 0), bordo(L, .9)) + ell(W * .78, 54, 4.6, 3.4, lin("dc2", CROMO, 0, 0, 1, 1), bordo(L, .9));   // la doccetta
      r += cer(W * .36, 66, 5.6, lin("ms", CROMO, 0, 0, 1, 1), bordo(L, 1)) + cer(W * .36, 66, 2.6, "#c9d2d8", bordo(L, .7)) + rett(W * .36 - 1.1, 57.5, 2.2, 9, 1.1, lin("ml", CROMO, 0, 0, 1, 0), bordo(L, .8));   // il miscelatore
      return r + tratto("M" + q(W * .36 + 5, 66) + " Q" + q(W * .6, 92) + " " + q(W * .78, 80), "#7d8991", 1.4, "opacity='.8'");   // il tubo della doccetta
    }
    function parete() { return blocco(-R, R, -R, -R + .045, 6.5, ZT, [lin("ps", [[0, "#ffffff"], [1, "#e6edf1"]], 0, 0, 1, 1), lin("pl", [[0, "#f6f8f9"], [1, "#dce4e9"]], 0, 0, 0, 1), lin("pd", [[0, "#c5cfd6"], [1, "#a3b0b8"]], 0, 0, 0, 1)], { davanti: piastrelle, dietro: retro("#e9eef1") }, 2.4); }
    function vetro(lato, porta) {   // un vetro trasparente col telaio: lato nella vista ("u0","u1","v0","v1")
      var o, dir, W = 2 * R * 61, H = ZT - 6.5;
      if (lato === "v1") { o = Puv(-R, R, ZT); dir = 1; } else if (lato === "v0") { o = Puv(-R, -R, ZT); dir = 1; } else if (lato === "u1") { o = Puv(R, R, ZT); dir = -1; } else { o = Puv(-R, R, ZT); dir = -1; }
      var vicinoV = lato === "v1" || lato === "u1";
      var r = rett(0, 0, W, H, 0, lin("vg", [[0, "#e6f7ff"], [1, "#a9dcf3"]], 0, 0, 1, 1), "fill-opacity='" + (vicinoV ? .3 : .22) + "'") +
        dentro("M0,0 H" + f1(W) + " V" + f1(H) + " H0 Z", poly([[W * .12, 0], [W * .3, 0], [W * .02, H * .42], [-W * .16, H * .42]], "#ffffff", "opacity='" + (vicinoV ? .45 : .2) + "'") +
          poly([[W * .4, 0], [W * .47, 0], [W * .17, H * .5], [W * .1, H * .5]], "#ffffff", "opacity='" + (vicinoV ? .35 : .15) + "'") + poly([[W * .9, H * .55], [W, H * .45], [W, H * .62], [W * .82, H * .8]], "#ffffff", "opacity='.18'"));
      r += rett(0, 0, W, 3, 1, lin("tt", CROMO, 0, 0, 0, 1), bordo(L, .9)) + rett(0, H - 3, W, 3, 1, lin("tt", CROMO, 0, 0, 0, 1), bordo(L, .9)) +   // il telaio cromato
        rett(-1, 0, 2.6, H, 1, lin("tv", CROMO, 0, 0, 1, 0), bordo(L, .9)) + rett(W - 1.6, 0, 2.6, H, 1, lin("tv", CROMO, 0, 0, 1, 0), bordo(L, .9));
      if (porta) r += rett(W / 2 - .6, 3, 1.2, H - 6, 0, "#7d8991", "opacity='.7'") + rett(W / 2 + 4, H * .36, 2.2, 26, 1.1, lin("pm", CROMO, 0, 0, 1, 0), bordo(L, .9)) +   // la porta scorrevole con la maniglia
        rett(W / 2 + 2.2, H * .36 + 2, 2, 1.6, .5, "#9ca8b0") + rett(W / 2 + 2.2, H * .36 + 22, 2, 1.6, .5, "#9ca8b0");
      return faccia(o, dir, r);
    }
    function soffione() {   // il braccio e il soffione tondo grande, con le bottiglie sul piatto
      var ar = cromo(linea(P(0, -R + .045, 126), P(0, -.15, 128.5)), 3), sf = forma(0, -.15, .13, .13, .13);
      var b1 = forma(.32, -.33, .035, .035), b2 = forma(.23, -.36, .03, .03);
      var bott = corpo([giro(b1, 6.5, 1, 20), giro(b1, 22, 1, 20)], [[0, "#ffb3c9"], [.5, "#f06595"], [1, "#a61e4d"]], 1.4) + pth(chiuso(giro(b1, 22, 1, 20)), "#ffdeeb", bordo(L, .9)) + corpo([giro(b1, 22, .5, 16), giro(b1, 26, .5, 16)], CER, 1.2) +
        corpo([giro(b2, 6.5, 1, 20), giro(b2, 19, 1, 20)], [[0, "#a5d8ff"], [.5, "#339af0"], [1, "#1864ab"]], 1.4) + pth(chiuso(giro(b2, 19, 1, 20)), "#d0ebff", bordo(L, .9)) + corpo([giro(b2, 19, .6, 16), giro(b2, 22, .6, 16)], [[0, "#ffffff"], [1, "#868e96"]], 1.1);
      var cs = P(0, -.15, 129.5);
      return bott + ar + corpo([giro(sf, 125, 1, 36), giro(sf, 127.5, 1, 36)], CROMO, 1.8) + pth(chiuso(giro(sf, 127.5, 1, 36)), rad("sf", [[0, "#ffffff"], [.6, "#dfe5e9"], [1, "#a9b4bb"]], .4, .35, .8), bordo(L, 1.3)) +
        ell(cs[0], cs[1], 3.6, 1.8, "#c4ccd2", bordo(L, .9));   // il raccordo in mezzo

    }
    var pa = girato ? "v1" : "v0", po = girato ? "v0" : "v1";   // dove stanno, nella vista, la parete di piastrelle e la porta
    function lato(x) { return x === pa ? parete() : vetro(x, x === po); }
    return s + lato("u0") + lato("v0") + soffione() + lato("u1") + lato("v1");
  });

  // =========================================================
  //  MOBILETTO: colonna bassa coi cassetti, e sopra due asciugamani piegati
  // =========================================================
  def("mobiletto", { tipo: "piedi", nome: "Mobiletto coi cassetti", fp: [1, 1], box: [-40, -93, 40, 23], dietro: true, colori: COL_MOBILE }, function (o) {
    var c = colore(COL_MOBILE, o), s = ombra(5, 6, 32, 14);
    [[-.22, -.43], [.18, -.43], [-.22, -.11], [.18, -.11]].forEach(function (g) { s += blocco(g[0], g[0] + .04, g[1], g[1] + .04, 0, 4, scuro(c, .5), null, 1.2); });   // i piedini
    s += blocco(-.25, .25, -.46, -.04, 4, 64, c, {
      davanti: function (W, H) { var r = "", i, h = (H - 5) / 4; for (i = 0; i < 4; i++) r += pannello(c, W - 4, h - 1.6, [2, 2.2 + i * h]) + maniglia(W / 2 - 4, 2.2 + i * h + h / 2 - 1.8, 8, 2.2); return r; },
      dietro: retro(c)
    });
    s += blocco(-.27, .27, -.475, -.02, 64, 67.5, chiaro(c, .12), null, 2);   // il piano, un po' sporgente
    function piegato(z, h, col, k, db) {   // un asciugamano piegato: morbido, con gli spigoli tondi; davanti la piega del bordo
      var F = forma(0, -.245 + db, .15 * k, .125 * k, .125 * k, 5), top = giro(F, z + h, 1, 40), mz = giro(F, z + h * .5, 1.04, 40), i, fr = [];
      for (i = 0; i <= 16; i++) { var t = (G > 0 ? -.75 : 2.39) + i / 16 * 3.14, c = Math.cos(t), sn = Math.sin(t); c = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), .4); sn = (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), .4); fr.push(P(c * .15 * k * 1.04, -.245 + db + sn * .125 * k * 1.04, z + h * .5)); }   // la piega, sul davanti che si vede
      return corpo([giro(F, z, 1, 40), top, mz], [[0, chiaro(col, .3)], [.6, col], [1, scuro(col, .25)]], 1.4) + pth(chiuso(top), lin("tp" + col.slice(1), [[0, chiaro(col, .45)], [1, chiaro(col, .1)]], 0, 0, 1, 1), bordo(L, 1.1)) +
        tratto("M" + fr.map(function (x) { return q(x); }).join(" L"), scuro(col, .3), .8, "opacity='.7'");
    }
    return s + piegato(67.5, 4, "#f4f6f8", 1, 0) + piegato(71.5, 3.8, "#8ce0c4", .95, .01) + piegato(75.3, 3.6, "#f7a1c0", .9, -.005);
  });

  // =========================================================
  //  LAVATRICE: l'oblò coi panni dentro, i comandi, lo sportellino del filtro; da dietro i tubi
  // =========================================================
  def("lavatrice", { tipo: "piedi", nome: "Lavatrice", fp: [1, 1], box: [-41, -79, 49, 29], dietro: true }, function () {
    var s = ombra(6, 8, 40, 18);
    var bianco = [lin("ls", [[0, "#ffffff"], [1, "#eef2f5"]], 0, 0, 1, 1), lin("ll", [[0, "#fbfcfd"], [1, "#e0e7eb"]], 0, 0, 0, 1), lin("ld", [[0, "#c9d3d9"], [1, "#a7b4bc"]], 0, 0, 0, 1)];
    [[-.27, -.43], [.23, -.43], [-.27, .1], [.23, .1]].forEach(function (g) { s += blocco(g[0], g[0] + .04, g[1], g[1] + .04, 0, 1.6, "#5a6168", null, 1); });
    s += blocco(-.3, .3, -.46, .14, 1.6, 57, bianco, {
      davanti: function (W, H) {
        var cx = W / 2, cy = 32.5, r = rett(0, 0, W, 11, 0, lin("cm", [[0, "#f3f6f8"], [1, "#e1e8ec"]], 0, 0, 0, 1)) + rett(0, 11, W, .8, 0, "#aab6be");
        r += rett(2.4, 2.4, 9.6, 6.4, 1, "#fbfcfd", bordo(L, .8)) + rett(4.2, 6.2, 6, 1.2, .6, "#8d9aa2");   // il cassettino del detersivo
        r += rett(14.4, 3, 9, 4.8, .8, "#22313a", bordo(L, .7)) + rett(15.6, 4.2, 2.2, 2.4, 0, "#69db7c") + rett(18.4, 4.2, 1.2, 2.4, 0, "#69db7c") + rett(20.2, 4.2, 2.2, 2.4, 0, "#69db7c");   // il display
        r += cer(W - 6, 5.6, 3.8, lin("mp", CROMO, 0, 0, 1, 1), bordo(L, .9)) + tratto("M" + f1(W - 6) + ",5.6 L" + f1(W - 6) + ",2.4", L, .9) + cer(14.6 + 11.5, 9.4, .7, "#ff6b6b");   // la manopola dei programmi
        r += cer(cx + .6, cy + .8, 14, "#9aa6ae") + cer(cx, cy, 14, lin("ob", [[0, "#ffffff"], [.5, "#dfe5e9"], [1, "#8b979f"]], 0, 0, 1, 1), bordo(L, 1.3)) +   // l'oblò: il cerchio cromato
          cer(cx, cy, 10.8, "#56636c", bordo(L, .9)) + cer(cx, cy, 9.6, rad("vt", [[0, "#5b86a3"], [.7, "#2c4a5e"], [1, "#1b2f3c"]], .45, .4, .7));
        r += dentro("M" + f1(cx - 9.6) + "," + f1(cy) + " a9.6,9.6 0 1,0 19.2,0 a9.6,9.6 0 1,0 -19.2,0 Z",   // i panni che girano dentro
          ell(cx - 3, cy + 6, 6, 3.6, "#e8590c") + ell(cx + 4, cy + 7, 6, 3.4, "#fcc419") + ell(cx + 1, cy + 4.4, 4.6, 2.4, "#4dabf7") + ell(cx - 5, cy + 2.6, 3.4, 2, "#f783ac") +
          tratto("M" + f1(cx - 9) + "," + f1(cy + 3) + " Q" + f1(cx) + "," + f1(cy + 1) + " " + f1(cx + 9) + "," + f1(cy + 3), "#9fd4f5", 1, "opacity='.7'"));
        r += pth("M" + f1(cx - 6.8) + "," + f1(cy - 2.6) + " A7.6,7.6 0 0,1 " + f1(cx + 1.4) + "," + f1(cy - 7.4), "none", "stroke='#ffffff' stroke-width='1.8' stroke-linecap='round' opacity='.8'") + cer(cx + 4.6, cy - 5.4, .9, "#ffffff", "opacity='.8'");
        r += rett(cx + 12.2, cy - 4, 2.4, 8, 1.2, lin("mo", CROMO, 0, 0, 1, 0), bordo(L, .8));   // la maniglia dello sportello
        return r + rett(2.6, H - 7.4, 7.6, 5, 1, "#eef2f4", "stroke='#9aa6ae' stroke-width='.8'") + rett(W - 9, H - 4, 6, .8, 0, "#aab6be");
      },
      dietro: function (W, H) {   // la schiena: il pannello con le viti, il tubo dell'acqua, lo scarico e la spina
        var r = rett(3, 3, W - 6, H - 6, 1, "none", "stroke='#b5c1c8' stroke-width='.9'") + [[5, 5], [W - 5, 5], [5, H - 5], [W - 5, H - 5]].map(function (v) { return cer(v[0], v[1], .9, "#8d9aa2"); }).join("");
        var i; for (i = 0; i < 5; i++) r += rett(W * .32, 16 + i * 3.2, W * .36, 1.4, .7, "#c4ced4");   // le fessure
        r += cer(W * .78, 8, 2.2, lin("ra", CROMO, 0, 0, 1, 1), bordo(L, .8)) + tratto("M" + f1(W * .78) + ",8 C" + f1(W * .9) + ",22 " + f1(W * .62) + ",30 " + f1(W * .7) + "," + f1(H + 2), "#4a5560", 2.8) + tratto("M" + f1(W * .78) + ",8 C" + f1(W * .9) + ",22 " + f1(W * .62) + ",30 " + f1(W * .7) + "," + f1(H + 2), "#9aa6ae", 1.4);
        r += tratto("M" + f1(W * .22) + "," + f1(H - 14) + " C" + f1(W * .05) + "," + f1(H - 30) + " " + f1(W * .02) + ",10 " + f1(W * .2) + ",6", "#5a646c", 3.4) + tratto("M" + f1(W * .22) + "," + f1(H - 14) + " C" + f1(W * .05) + "," + f1(H - 30) + " " + f1(W * .02) + ",10 " + f1(W * .2) + ",6", "#b0bac1", 1.6);   // lo scarico a ricciolo
        return r + tratto("M" + f1(W * .5) + "," + f1(H - 6) + " Q" + f1(W * .44) + "," + f1(H) + " " + f1(W * .5) + "," + f1(H + 2), "#2b2f33", 1.4);
      }
    });
    return s;
  });

  // =========================================================
  //  CESTO della biancheria di vimini, coi panni che escono
  // =========================================================
  def("cesto_bucato", { tipo: "piedi", nome: "Cesto della biancheria", fp: [1, 1], box: [-30, -56, 33, 19], dietro: true }, function () {
    var s = ombra(4, 5, 26, 11), ca = 0, cb = -.18, R0 = .185, Z = 37, r = rnd(91), i, j;
    function el(z, k) { var c = P(ca, cb, z), rr = R0 * k; return { x: c[0], y: c[1], rx: rr * 70.71, ry: rr * 35.36 }; }   // un cerchio in pianta, sullo schermo
    function kz(z) { return .8 + .2 * z / Z; }   // il cesto si allarga verso l'alto
    var su = el(Z, 1), giu = el(0, .8);
    var sil = "M" + q(su.x - su.rx, su.y) + " L" + q(giu.x - giu.rx, giu.y) + " A" + f1(giu.rx) + "," + f1(giu.ry) + " 0 0,0 " + q(giu.x + giu.rx, giu.y) + " L" + q(su.x + su.rx, su.y) + " A" + f1(su.rx) + "," + f1(su.ry) + " 0 0,0 " + q(su.x - su.rx, su.y) + " Z";
    var vim = lin("vm", [[0, "#f3d9a4"], [.45, "#d9ae6c"], [1, "#9a6c35"]], su.x - su.rx, 0, su.x + su.rx, 0, true), tr = "";
    // l'intreccio: le file orizzontali (archi) e i paletti, con i "chicchi" alternati
    for (i = 0; i < 10; i++) {
      var z0 = 2 + i * 3.5, e = el(z0, kz(z0)), e1 = el(z0 + 3.5, kz(z0 + 3.5));
      tr += pth("M" + q(e.x - e.rx, e.y) + " A" + f1(e.rx) + "," + f1(e.ry) + " 0 0,0 " + q(e.x + e.rx, e.y), "none", "stroke='#7a5228' stroke-width='.9' opacity='.75'");
      for (j = 0; j < 12; j++) {
        var t = (j + (i % 2) * .5 + .25) / 12 * Math.PI, cx = e.x - Math.cos(t) * (e.rx + e1.rx) / 2, cy = (e.y + e1.y) / 2 + Math.sin(t) * (e.ry + e1.ry) / 2 - 1.7, w = Math.sin(t) * 2.6 + .6;
        tr += ell(cx, cy, w, 1.25, "#fbe7bf", "opacity='" + (.25 + .45 * Math.sin(t) * (1 - Math.cos(t) * .5)) + "'");
      }
    }
    for (j = 1; j < 12; j++) { var tt = j / 12 * Math.PI, a = el(0, .8), b = el(Z, 1); tr += tratto(linea([a.x - Math.cos(tt) * a.rx, a.y + Math.sin(tt) * a.ry], [b.x - Math.cos(tt) * b.rx, b.y + Math.sin(tt) * b.ry]), "#8a5e2e", .8, "opacity='.55'"); }
    var h1 = el(Z - 7, kz(Z - 7));   // le due maniglie a buco
    [-1, 1].forEach(function (sg) { var t = sg < 0 ? .38 : Math.PI - .38; tr += ell(h1.x - Math.cos(t) * h1.rx * .97, h1.y + Math.sin(t) * h1.ry - 1, 4.2, 2, "#4a2f15", "transform='rotate(" + (sg * -14) + " " + f1(h1.x - Math.cos(t) * h1.rx * .97) + " " + f1(h1.y + Math.sin(t) * h1.ry - 1) + ")'"); });
    s += pth(sil, vim) + dentro(sil, tr + ell(su.x - su.rx * .62, (su.y + giu.y) / 2, 2.4, 10, "#ffffff", "opacity='.35'")) + pth(sil, "none", bordo(L, 2.3));
    // la bocca: il dentro scuro, il bordo di dietro, i panni, il bordo davanti
    var bocca = el(Z, .93);
    s += ell(bocca.x, bocca.y, bocca.rx, bocca.ry, "#6b4520");
    var dRetro = "M" + q(su.x - su.rx, su.y) + " A" + f1(su.rx) + "," + f1(su.ry) + " 0 0,1 " + q(su.x + su.rx, su.y), dDav = "M" + q(su.x - su.rx, su.y) + " A" + f1(su.rx) + "," + f1(su.ry) + " 0 0,0 " + q(su.x + su.rx, su.y);
    function bordoCesto(d) { return tratto(d, L, 7) + tratto(d, "#d6a965", 4.6) + tratto(d, "#f6dfb0", 1.4, "opacity='.8' transform='translate(0 -1)'"); }
    s += bordoCesto(dRetro);
    // i panni: una maglietta azzurra, un asciugamano rosa, un calzino a righe; la manica che pende fuori dal bordo
    var manica = function () {
      var a = P(ca - .03, cb + .175, Z + 2), b = P(ca - .045, cb + .19, Z - 13), d = "M" + q(a[0] - 4, a[1]) + " Q" + q(b[0] - 7, (a[1] + b[1]) / 2) + " " + q(b[0] - 4, b[1]) + " L" + q(b[0] + 4, b[1] + 1) + " Q" + q(b[0] + 3, (a[1] + b[1]) / 2) + " " + q(a[0] + 5, a[1]) + " Z";
      return pth(d, lin("mc", [[0, "#8fd0ff"], [1, "#3b8fd6"]], 0, 0, 1, 1), bordo(L, 1.4)) + tratto(linea([b[0] - 3.6, b[1] - 2], [b[0] + 3.4, b[1] - 1]), "#ffffff", 1, "opacity='.6'");
    };
    var mv = vicino(-.03, .175) >= 0;
    var pan = "", m1 = P(ca + .04, cb - .04, Z + 5), m2 = P(ca - .06, cb + .05, Z + 4), m3 = P(ca + .09, cb + .06, Z + 3);
    pan += pth("M" + q(m1[0] - 14, m1[1] + 2) + " Q" + q(m1[0] - 10, m1[1] - 7) + " " + q(m1[0], m1[1] - 6) + " Q" + q(m1[0] + 12, m1[1] - 8) + " " + q(m1[0] + 14, m1[1] + 1) + " Q" + q(m1[0], m1[1] + 6) + " " + q(m1[0] - 14, m1[1] + 2) + " Z", lin("as", [[0, "#ffc2d6"], [1, "#e64980"]], 0, 0, 1, 1), bordo(L, 1.4)) +
      tratto("M" + q(m1[0] - 8, m1[1] - 2) + " Q" + q(m1[0], m1[1] - 4) + " " + q(m1[0] + 8, m1[1] - 1), "#c2255c", .9, "opacity='.7'");
    pan += pth("M" + q(m2[0] - 13, m2[1] + 3) + " Q" + q(m2[0] - 11, m2[1] - 5) + " " + q(m2[0] - 2, m2[1] - 4) + " Q" + q(m2[0] + 8, m2[1] - 6) + " " + q(m2[0] + 9, m2[1] + 2) + " Q" + q(m2[0] - 2, m2[1] + 7) + " " + q(m2[0] - 13, m2[1] + 3) + " Z", lin("ms", [[0, "#a5d8ff"], [1, "#3b8fd6"]], 0, 0, 1, 1), bordo(L, 1.4)) +
      tratto("M" + q(m2[0] - 7, m2[1]) + " L" + q(m2[0] + 3, m2[1] - 1), "#1c6fb5", .8, "opacity='.6'");
    pan += "<g transform='rotate(-24 " + q(m3[0], m3[1]).replace(",", " ") + ")'>" + rett(m3[0] - 7, m3[1] - 2.6, 14, 5.2, 2.6, "#ffffff", bordo(L, 1.2)) + rett(m3[0] - 3, m3[1] - 2.6, 2, 5.2, 0, "#fa5252") + rett(m3[0] + 1.4, m3[1] - 2.6, 2, 5.2, 0, "#fa5252") + "</g>";
    s += pan + bordoCesto(dDav) + (mv ? manica() : "");   // da dietro la manica che pende resta nascosta dal cesto
    return s;
  });

  // =========================================================
  //  PIANTA DA BAGNO: una felce nel vaso di ceramica
  // =========================================================
  def("pianta_bagno", { tipo: "piedi", nome: "Felce in vaso", fp: [1, 1], box: [-40, -69, 39, 20], dietro: true }, function () {
    var s = ombra(5, 5, 30, 12), ca = 0, cb = -.16, R0 = .17, Z = 25, r = rnd(23), i, k;
    function el(z, rr) { var c = P(ca, cb, z); return { x: c[0], y: c[1], rx: rr * 70.71, ry: rr * 35.36 }; }
    var su = el(Z, R0), giu = el(0, R0 * .72);
    var sil = "M" + q(su.x - su.rx, su.y) + " L" + q(giu.x - giu.rx, giu.y) + " A" + f1(giu.rx) + "," + f1(giu.ry) + " 0 0,0 " + q(giu.x + giu.rx, giu.y) + " L" + q(su.x + su.rx, su.y) + " A" + f1(su.rx) + "," + f1(su.ry) + " 0 0,0 " + q(su.x - su.rx, su.y) + " Z";
    var fascia = el(9, R0 * .81);
    s += pth(sil, lin("vs", [[0, "#ffffff"], [.4, "#eef3f5"], [.8, "#bfccd3"], [1, "#9daab3"]], su.x - su.rx, 0, su.x + su.rx, 0, true), bordo(L, 2.2)) +
      dentro(sil, pth("M" + q(fascia.x - fascia.rx - 2, fascia.y) + " A" + f1(fascia.rx + 2) + "," + f1(fascia.ry + 1) + " 0 0,0 " + q(fascia.x + fascia.rx + 2, fascia.y), "none", "stroke='#3f8fc7' stroke-width='3.2'") +
        ell(su.x - su.rx * .6, (su.y + giu.y) / 2 - 2, 2.2, 8, "#ffffff", "opacity='.75'")) + pth(sil, "none", bordo(L, 2.2));
    var bo = el(Z + 3.5, R0 * 1.1), te = el(Z + 2.5, R0 * .9);
    s += ell(bo.x, bo.y + 1.6, bo.rx, bo.ry, lin("bv", [[0, "#ffffff"], [1, "#a9b6be"]], 0, 0, 1, 0), bordo(L, 1.8)) + ell(bo.x, bo.y, bo.rx, bo.ry, lin("bs", [[0, "#ffffff"], [1, "#dfe7eb"]], 0, 0, 1, 1), bordo(L, 1.6)) +
      ell(te.x, te.y, te.rx, te.ry, rad("te", [[0, "#6b4a2e"], [1, "#3a2414"]], .5, .5, .6), bordo(L, 1));
    // le fronde: ognuna esce dal centro, si alza ad arco e ricade; le foglioline a coppie lungo il gambo, più piccole verso la punta
    var fr = [];
    for (i = 0; i < 13; i++) {   // le fronde: quelle in mezzo più dritte, le altre ricadono di più
      var th = (i / 13) * 6.2832 + r() * .4, R = .26 + r() * .14, up = 26 + r() * 20;
      fr.push({ th: th, R: R, up: up, d: vicino(Math.cos(th), Math.sin(th)) + r() * .01, t: r() });
    }
    fr.push({ th: -2.4, R: .1, up: 46, d: -.05, t: .5 }, { th: .6, R: .12, up: 42, d: .05, t: .8 });
    function fronda(f) {
      var pos = function (t) { return P(ca + f.R * t * Math.cos(f.th), cb + f.R * t * Math.sin(f.th), Z + 3 + f.up * (2.1 * t - 1.95 * t * t)); };
      var g = (f.d + 1.4) / 2.8, cF = mix("#2f7a2a", "#7ccf4f", Math.max(0, Math.min(1, g * .85 + f.t * .2))), cL = scuro(cF, .5), o = "", n = 13, j;
      var dpath = "M" + q(pos(0)); for (j = 1; j <= 12; j++) dpath += " L" + q(pos(j / 12));
      o += tratto(dpath, cL, 2.6) + tratto(dpath, cF, 1.1);
      for (j = 1; j <= n; j++) {
        var t = .08 + j / (n + 1) * .92, a = pos(t), b = pos(Math.min(1, t + .03)), ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 57.3, l = 7.6 * (1 - t * .68), w = 2.2 * (1 - t * .45);
        [-1, 1].forEach(function (sg) { o += "<path d='M0,0 C" + q(w, -l * .3) + " " + q(w * .55, -l * .95) + " 0," + f1(-l) + " C" + q(-w * .55, -l * .95) + " " + q(-w, -l * .3) + " 0,0 Z' fill='" + (sg < 0 ? chiaro(cF, .12) : cF) + "' transform='translate(" + f1(a[0]) + " " + f1(a[1]) + ") rotate(" + f1(ang + 90 + sg * 62) + ")' " + bordo(cL, .7) + "/>"; });
      }
      var e = pos(1); return o + "<path d='M0,0 C2,-2 1.4,-6 0,-7 C-1.4,-6 -2,-2 0,0 Z' fill='" + cF + "' transform='translate(" + f1(e[0]) + " " + f1(e[1]) + ") rotate(" + f1(Math.atan2(e[1] - pos(.95)[1], e[0] - pos(.95)[0]) * 57.3 + 90) + ")' " + bordo(cL, .7) + "/>";
    }
    fr.sort(function (m, n) { return m.d - n.d; });
    var dav = "M" + q(bo.x - bo.rx, bo.y) + " A" + f1(bo.rx) + "," + f1(bo.ry) + " 0 0,0 " + q(bo.x + bo.rx, bo.y);
    for (k = 0; k < fr.length; k++) { if (fr[k].d >= 0 && (k === 0 || fr[k - 1].d < 0)) s += tratto(dav, L, 4.4) + tratto(dav, "#f4f7f9", 2.2); s += fronda(fr[k]); }   // davanti alle fronde dietro passa il bordo del vaso
    return s;
  });

  // =========================================================
  //  DA PARETE (62 × 200, di fronte): specchio, mensola, portasciugamani
  // =========================================================
  function svgPiatto(w, h, c) { return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " " + h + "' width='" + w + "' height='" + h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + c + "</svg>"; }

  def("specchio", { tipo: "parete", nome: "Specchio", w: 62, h: 200 }, function () {
    var x0 = 10, x1 = 52, y0 = 40, y1 = 110, gl = "M" + (x0 + 5) + "," + (y0 + 5) + " H" + (x1 - 5) + " V" + (y1 - 5) + " H" + (x0 + 5) + " Z";
    var s = rett(x0 + 2.5, y0 + 3.5, x1 - x0, y1 - y0, 7, "#000", "opacity='.15'");   // l'ombra sul muro
    s += rett(x0, y0, x1 - x0, y1 - y0, 7, lin("cr", [[0, "#fff1b8"], [.35, "#f2c94c"], [.7, "#d9a530"], [1, "#a8781a"]], 0, 0, 1, 1), bordo(L, 2.2));   // la cornice dorata
    s += rett(x0 + 2, y0 + 2, x1 - x0 - 4, y1 - y0 - 4, 5.5, "none", "stroke='#fff6d0' stroke-width='1' opacity='.8'");
    s += rett(x0 + 5, y0 + 5, x1 - x0 - 10, y1 - y0 - 10, 2.5, lin("vt", [[0, "#eef9fc"], [.5, "#c7e6ef"], [1, "#9ccbdb"]], 0, 0, .4, 1), bordo(L, 1.2));
    s += dentro(gl, poly([[x0 + 9, y0 + 5], [x0 + 19, y0 + 5], [x0 + 5, y0 + 30], [x0 + 5, y0 + 14]], "#ffffff", "opacity='.75'") + poly([[x0 + 24, y0 + 5], [x0 + 28, y0 + 5], [x0 + 5, y0 + 46], [x0 + 5, y0 + 39]], "#ffffff", "opacity='.55'") +
      poly([[x1 - 5, y1 - 26], [x1 - 5, y1 - 18], [x1 - 13, y1 - 5], [x1 - 18, y1 - 5]], "#ffffff", "opacity='.35'") + rett(x0 + 5, y1 - 20, x1 - x0 - 10, 15, 0, "#7fb3c6", "opacity='.25'"));
    return s + tratto("M" + (x0 + 3) + "," + (y1 - 8) + " L" + (x0 + 3) + "," + (y0 + 8) + " Q" + (x0 + 3) + "," + (y0 + 3) + " " + (x0 + 8) + "," + (y0 + 3) + " L" + (x1 - 10) + "," + (y0 + 3), "#ffffff", 1.2, "opacity='.7'");
  });

  def("mensola", { tipo: "parete", nome: "Mensola con le boccette", w: 62, h: 200 }, function () {
    var Y = 104, s = "";   // Y = il piano della mensola
    s += pth("M10," + (Y + 6) + " L54," + (Y + 6) + " L56," + (Y + 13) + " L12," + (Y + 13) + " Z", "#000", "opacity='.13'");   // l'ombra sul muro
    [16, 46].forEach(function (x) { s += pth("M" + x + "," + (Y + 4) + " L" + (x + 3) + "," + (Y + 4) + " L" + (x + 3) + "," + (Y + 13) + " Z", lin("sq", CROMO, 0, 0, 1, 0), bordo(L, 1)); });   // le squadrette
    // le cose sulla mensola (la base sta su Y)
    s += rett(13.5, Y - 13, 9, 13, 2.4, lin("bk", [[0, "#e7f8ff"], [1, "#9fd2e8"]], 0, 0, 1, 0), bordo(L, 1.1) + " fill-opacity='.85'");   // il bicchiere
    s += tratto("M16.5," + (Y - 9) + " L14.5," + (Y - 27), L, 3.4) + tratto("M16.5," + (Y - 9) + " L14.5," + (Y - 27), "#339af0", 2) + rett(12.2, Y - 31, 3.6, 5.5, 1, "#ffffff", bordo(L, .8)) + rett(12.6, Y - 30.4, 2.8, 2.2, .5, "#74c0fc");   // lo spazzolino
    s += tratto("M20," + (Y - 9) + " L23," + (Y - 24), L, 4.2) + tratto("M20," + (Y - 9) + " L23," + (Y - 24), "#f8f9fa", 2.8) + rett(21.2, Y - 28, 3.6, 4.4, 1, "#e03131", bordo(L, .8)) + tratto("M20.3," + (Y - 12) + " L22.6," + (Y - 22.5), "#e03131", .8);   // il dentifricio
    s += rett(15, Y - 11, 1.6, 9, .8, "#ffffff", "opacity='.6'");
    s += rett(26, Y - 16, 9, 16, 3, lin("sp", [[0, "#ffc9de"], [.6, "#f06595"], [1, "#c2255c"]], 0, 0, 1, 0), bordo(L, 1.1)) + rett(27.5, Y - 19, 6, 3, 1, "#ffffff", bordo(L, .8)) + rett(29.6, Y - 24, 1.8, 5, .6, "#ffffff", bordo(L, .8)) + rett(29.6, Y - 24.6, 5.4, 2, .8, "#ffffff", bordo(L, .8)) + rett(28, Y - 10, 5, 5, 1, "#ffffff", "opacity='.55'");   // il sapone col dosatore
    s += rett(37, Y - 22, 9.5, 22, 2.6, lin("sh", [[0, "#9ff0d4"], [.6, "#20c997"], [1, "#087f5b"]], 0, 0, 1, 0), bordo(L, 1.1)) + rett(38.4, Y - 25.5, 6.7, 4, 1.4, "#fcc419", bordo(L, .8)) + rett(38.6, Y - 14, 6, 6, 1, "#ffffff", "opacity='.6'") + rett(38.6, Y - 19, 1.4, 15, .7, "#ffffff", "opacity='.45'");   // lo shampoo
    s += rett(48, Y - 7, 8, 7, 2, lin("cm", [[0, "#ffffff"], [1, "#ced6db"]], 0, 0, 1, 0), bordo(L, 1)) + rett(47.4, Y - 9.6, 9.2, 3.2, 1.2, lin("co", ORO, 0, 0, 1, 0), bordo(L, .8));   // il barattolo di crema
    s += rett(6, Y, 52, 2.6, 1, lin("mp", [[0, "#ffffff"], [1, "#dfe7eb"]], 0, 0, 0, 1), bordo(L, 1)) + rett(6, Y + 2.6, 52, 3.6, 1, lin("mf", [[0, "#cfd8dd"], [1, "#a3b0b8"]], 0, 0, 0, 1), bordo(L, 1.2));   // il ripiano (sopra e davanti)
    return s + tratto("M8," + (Y + 3.4) + " L56," + (Y + 3.4), "#ffffff", .8, "opacity='.6'");
  });

  def("porta_asciugamani", { tipo: "parete", nome: "Portasciugamani", w: 62, h: 200, colori: COL_STOFFA }, function (o) {
    var c = colore(COL_STOFFA, o), Y = 94, s = "", r = rnd(5), i;
    var dav = "M13," + (Y + 1) + " Q13," + (Y - 5.5) + " 19," + (Y - 5.5) + " L43," + (Y - 5.5) + " Q49," + (Y - 5.5) + " 49," + (Y + 1) + " L49.5," + (Y + 52) + " Q44," + (Y + 55) + " 38," + (Y + 53) + " Q31," + (Y + 51) + " 24," + (Y + 54) + " Q18," + (Y + 56) + " 12.5," + (Y + 52) + " Z";
    s += pth(dav, "#000", "opacity='.14' transform='translate(2.6 3.4)'");   // l'ombra sul muro
    s += pth("M14," + (Y + 46) + " L48," + (Y + 46) + " L48," + (Y + 59) + " Q40," + (Y + 61) + " 31," + (Y + 59) + " Q22," + (Y + 57) + " 14," + (Y + 59) + " Z", scuro(c, .22), bordo(L, 1.4));   // la parte di dietro che spunta sotto
    s += rett(5, Y - 2.8, 52, 3.6, 1.8, lin("bc", CROMO, 0, 0, 0, 1), bordo(L, 1.1));   // la barra cromata
    [6.5, 55.5].forEach(function (x) { s += cer(x, Y - 1, 3.6, lin("rs", CROMO, 0, 0, 1, 1), bordo(L, 1.1)) + cer(x - .9, Y - 2, 1, "#ffffff"); });
    var tex = "";
    for (i = 0; i < 70; i++) tex += cer(14 + r() * 35, Y - 4 + r() * 58, .55 + r() * .4, r() < .5 ? chiaro(c, .35) : scuro(c, .12), "opacity='.5'");   // la spugna
    s += pth(dav, lin("st", [[0, chiaro(c, .28)], [.5, c], [1, scuro(c, .12)]], 0, 0, 1, 0), bordo(L, 1.6)) +
      dentro(dav, tex + rett(10, Y + 40, 44, 3, 0, chiaro(c, .75)) + rett(10, Y + 44.5, 44, 1.6, 0, chiaro(c, .75)) +
        tratto("M22," + (Y + 2) + " Q24," + (Y + 26) + " 21," + (Y + 53) + " M38," + (Y + 1) + " Q36," + (Y + 28) + " 39," + (Y + 52), scuro(c, .2), 1, "opacity='.55'") +
        ell(16.5, Y + 20, 1.8, 20, "#ffffff", "opacity='.3'") + rett(12, Y - 6, 38, 4, 2, chiaro(c, .4), "opacity='.6'")) + pth(dav, "none", bordo(L, 1.6));
    return s;
  });

  // =========================================================
  //  A TERRA (100 × 100, visto da sopra): il tappetino morbido con la frangia
  // =========================================================
  def("tappetino", { tipo: "terra", nome: "Tappetino", w: 100, h: 100, colori: COL_STOFFA }, function (o) {
    var c = colore(COL_STOFFA, o), r = rnd(17), s = "", i, x0 = 16, y0 = 24, W = 68, H = 52;
    s += rett(x0 + 1.5, y0 + 2.5, W, H, 10, "#000", "opacity='.16'");   // l'ombra (è morbido e un po' alto)
    for (i = 0; i < 9; i++) { var y = y0 + 4 + i * (H - 8) / 8; s += tratto("M" + (x0 - 6) + "," + f1(y) + " L" + x0 + "," + f1(y) + " M" + (x0 + W) + "," + f1(y) + " L" + (x0 + W + 6) + "," + f1(y), scuro(c, .3), 2.6) + tratto("M" + (x0 - 6) + "," + f1(y) + " L" + x0 + "," + f1(y) + " M" + (x0 + W) + "," + f1(y) + " L" + (x0 + W + 6) + "," + f1(y), chiaro(c, .35), 1.3); }   // la frangia
    var tex = "", d = "M" + (x0 + 10) + "," + y0 + " H" + (x0 + W - 10) + " Q" + (x0 + W) + "," + y0 + " " + (x0 + W) + "," + (y0 + 10) + " V" + (y0 + H - 10) + " Q" + (x0 + W) + "," + (y0 + H) + " " + (x0 + W - 10) + "," + (y0 + H) + " H" + (x0 + 10) + " Q" + x0 + "," + (y0 + H) + " " + x0 + "," + (y0 + H - 10) + " V" + (y0 + 10) + " Q" + x0 + "," + y0 + " " + (x0 + 10) + "," + y0 + " Z";
    for (i = 0; i < 160; i++) { var px = x0 + r() * W, py = y0 + r() * H; tex += cer(px, py, .9 + r() * 1.1, r() < .55 ? chiaro(c, .3) : scuro(c, .1), "opacity='.55'"); }   // il pelo morbido
    s += pth(d, rad("tp", [[0, chiaro(c, .25)], [.7, c], [1, scuro(c, .12)]], .4, .35, .75), bordo(L, 1.8));
    s += dentro(d, tex + rett(x0 + 6, y0 + 6, W - 12, H - 12, 6, "none", "stroke='" + chiaro(c, .6) + "' stroke-width='1.6' stroke-dasharray='3 2.4'"));
    return s + pth(d, "none", bordo(L, 1.8));
  });

  // =========================================================
  function misure(d) { if (d.tipo !== "piedi") return { w: d.w, h: d.h }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  // prezzi e qualità (0 = roba scadente di partenza, 2 = roba bella): gli stessi nomi e prezzi dei mobili della casa (js/casa.js)
  var PREZZI = { wc_moderno: 900, lavandino_mobile: 1200, vasca: 2500, doccia: 1800, mobiletto: 600, lavatrice: 1400, cesto_bucato: 200, pianta_bagno: 400, specchio: 500, mensola: 300, porta_asciugamani: 300, tappetino: 150 };
  // gli altri gruppi di mobili (js/mobili-*.js) si aggiungono con SGMobiliArte.aggiungi({ nomi(), info(nome), svg(nome, opz) })
  var ALTRI = [];
  function chi(nome) { for (var i = 0; i < ALTRI.length; i++) { try { if (ALTRI[i].info(nome)) return ALTRI[i]; } catch (e) {} } return null; }
  window.SGMobiliArte = {
    aggiungi: function (pacchetto) { if (pacchetto && pacchetto.nomi && pacchetto.info && pacchetto.svg) ALTRI.push(pacchetto); },
    nomi: function () { var l = Object.keys(DIS); ALTRI.forEach(function (p) { try { l = l.concat(p.nomi()); } catch (e) {} }); return l; },
    info: function (nome) {
      var d = DIS[nome]; if (!d) { var a = chi(nome); return a ? a.info(nome) : null; }
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: "bagno", w: m.w, h: m.h, fp: d.fp ? d.fp.slice() : [1, 1], prezzo: PREZZI[nome] || 300, qual: 2 };
      if (d.tipo === "piedi") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.colori) o.colori = d.colori.map(function (k) { return { id: k.id, nome: k.nome, c: k.c }; });
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) { var a = chi(nome); return a ? a.svg(nome, opz || {}) : ""; }
      opz = opz || {};
      var m = misure(d);
      p = "mb" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1;
      var c; try { c = d.fn(opz); } finally { G = 1; }
      if (d.tipo !== "piedi") return svgPiatto(m.w, m.h, c);
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  };
})();

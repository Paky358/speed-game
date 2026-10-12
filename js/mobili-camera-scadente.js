/* =========================================================
   SPeeD GAME — MOBILI VISTI DALL'ALTO: CAMERA E BAGNO, LA ROBA DI PARTENZA
   Gli stessi mobili poveri della casa vista di lato (casa.js, qualità 0), visti dall'alto in diagonale
   come quelli belli del bagno (mobili-arte.js): stessa vista, stesse misure, stesso stile.
   Roba povera e vissuta ma simpatica: legno grezzo, cartone, ceramica ingiallita, plastica,
   scheggiature, toppe, cose storte.
   Tipi: "piedi" (in piedi sul pavimento), "sopra" (cose piccole da appoggiare su un ripiano), "parete" (62 × 200).
   Si aggiunge a SGMobiliArte con aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte) return;

  // ---------- attrezzi (gli stessi dei mobili del bagno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato (da dietro)
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 100) / 100; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(k) { return "opacity='" + f1(k) + "'"; }
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
  function sf(stops, x1, y1, x2, y2) { return sfum("linearGradient", "u" + (++nC), stops, "x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "'"); }   // una sfumatura usata una volta sola
  function rf(stops, cx, cy, r) { return sfum("radialGradient", "v" + (++nC), stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  function ritaglio(W, H, corpo) { return dentro("M0,0 H" + f1(W) + " V" + f1(H) + " H0 Z", corpo); }
  function ombra(x, y, rx, ry, k, ang) {   // l'ombra morbida a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra)
    return ell(x, y, rx, ry, rad("om", [[0, "#000", .2], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5), (k ? "opacity='" + k + "'" : "") + (ang ? " transform='rotate(" + ang + " " + f1(x) + " " + f1(y) + ")'" : ""));
  }
  var CER_V = [[0, "#fffcf2"], [.4, "#f4edd9"], [.78, "#dad0b1"], [1, "#b3a684"]];      // la ceramica vecchia, un po' ingiallita (quella bella del bagno è bianca e azzurrina)
  var METALLO = [[0, "#f1f1ea"], [.3, "#cfcfc6"], [.66, "#93938a"], [1, "#65645b"]];    // il cromo spento, vecchio
  var OTTONE = [[0, "#fbe8a6"], [.45, "#d2ab4c"], [1, "#82621c"]];                       // l'ottone un po' annerito
  function tubo(d, w, c) {   // un tubo (di metallo vecchio, o del colore c)
    var cc = c || "#a8a89e";
    return tratto(d, L, w + 2.2) + tratto(d, cc, w) + tratto(d, chiaro(cc, .7), Math.max(.5, w * .32), "opacity='.85' transform='translate(-.35 -.45)'");
  }

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
      var t = i / n * 6.2832, c = Math.cos(t), s = Math.sin(t), e = s < 0 && F.eb ? F.eb : F.e, x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / e) * F.ra * ka, y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / e) * (s > 0 ? F.rf : F.rr) * kb;
      if (F.ang) { var ca = Math.cos(F.ang), sa = Math.sin(F.ang), x2 = x * ca - y * sa; y = x * sa + y * ca; x = x2; }   // la forma girata in pianta
      out.push(P(F.ca + x, F.cb + (db || 0) + y, z));
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
  function corpo(livelli, stops, lw) {   // un pezzo tondo pieno (ceramica, plastica): la sagoma sfumata da sinistra a destra
    var pp = inviluppo([].concat.apply([], livelli)), b = limiti(pp);
    return pth(chiuso(pp), lin("cx", stops, b[0], 0, b[2], 0, true), bordo(L, lw || 2.4));
  }
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }
  function lucido(pp, k, alto) {   // il riflesso bianco, vicino al bordo di sinistra (da dove viene la luce)
    var b = limiti(pp), w = b[2] - b[0], h = b[3] - b[1];
    return dentro(chiuso(pp), ell(b[0] + w * .19, b[1] + h * (alto || .5), Math.max(1.6, w * .05), h * .3, "#ffffff", "opacity='" + (k || .7) + "'"));
  }
  function frontale(pp) {   // la metà davanti (quella più in basso sullo schermo) di un giro chiuso, da sinistra a destra
    var iL = 0, iR = 0, n = pp.length, i, a = [], b = [];
    for (i = 1; i < n; i++) { if (pp[i][0] < pp[iL][0]) iL = i; if (pp[i][0] > pp[iR][0]) iR = i; }
    for (i = iL; ; i = (i + 1) % n) { a.push(pp[i]); if (i === iR) break; }
    for (i = iR; ; i = (i + 1) % n) { b.push(pp[i]); if (i === iL) break; }
    function my(l) { return l.reduce(function (s, x) { return s + x[1]; }, 0) / l.length; }
    return my(a) > my(b) ? a : b.reverse();
  }
  function inclina(v, pv, ta, tb) {   // un punto [a, b, z] inclinato attorno al perno pv: ta verso +a, tb verso +b (in radianti)
    var x = v[0] - pv[0], y = v[1] - pv[1], h = (v[2] - pv[2]) / 61;
    var x1 = x * Math.cos(ta) + h * Math.sin(ta), h1 = -x * Math.sin(ta) + h * Math.cos(ta);
    var y1 = y * Math.cos(tb) + h1 * Math.sin(tb), h2 = -y * Math.sin(tb) + h1 * Math.cos(tb);
    return [pv[0] + x1, pv[1] + y1, pv[2] + h2 * 61];
  }

  // ---------- i mobili squadrati ----------
  // una faccia piatta messa in diagonale: o = il suo angolo in alto a sinistra sullo schermo; dir 1 = la faccia di sinistra, -1 = quella di destra.
  // Dentro si disegna di fronte: in larghezza 61 = 1 metro, in altezza come z.
  function faccia(o, dir, c) { return "<g transform='matrix(.8197 " + (dir > 0 ? ".4098" : "-.4098") + " 0 1 " + f1(o[0]) + " " + f1(o[1]) + ")'>" + c + "</g>"; }
  function piattoV(a0, a1, b, zTop, c) { return faccia(Puv(G > 0 ? a0 : -a1, G * b, zTop), 1, c); }    // un disegno piatto sul piano b = costante (che guarda chi sta davanti o dietro)
  function piattoU(b0, b1, a, zTop, c) { return faccia(Puv(G * a, G > 0 ? b1 : -b0, zTop), -1, c); }   // un disegno piatto sul piano a = costante (un fianco)
  function sopraT(z, c) { return "<g transform='matrix(" + [.5 * G, .25 * G, -.5 * G, .25 * G, 0, -z].map(f1).join(" ") + ")'>" + c + "</g>"; }   // un disegno steso in piano all'altezza z (in centimetri: x = a·100, y = b·100)
  function tinte(c) {   // i tre colori: sopra, la faccia di sinistra (alla luce), quella di destra (in ombra)
    if (typeof c !== "string") return c;
    var k = c.slice(1);
    return [lin("ts" + k, [[0, chiaro(c, .32)], [1, chiaro(c, .1)]], 0, 0, 1, 1), lin("tl" + k, [[0, chiaro(c, .12)], [1, scuro(c, .06)]], 0, 0, 0, 1), lin("td" + k, [[0, scuro(c, .2)], [1, scuro(c, .34)]], 0, 0, 0, 1)];
  }
  function ceramicaV() { return [lin("ks", [[0, "#fffcf3"], [1, "#efe7d1"]], 0, 0, 1, 1), lin("kl", [[0, "#fbf6e8"], [1, "#e3d9bf"]], 0, 0, 0, 1), lin("kd", [[0, "#cec3a5"], [1, "#aa9d7c"]], 0, 0, 0, 1)]; }
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
  // un blocco morbido (materasso): gli spigoli tondi; la parte di sinistra alla luce, quella di destra in ombra
  function soffice(a0, a1, b0, b1, z0, z1, c, e, lw) {
    var F = forma((a0 + a1) / 2, (b0 + b1) / 2, (a1 - a0) / 2, (b1 - b0) / 2, (b1 - b0) / 2, e || 8);
    var top = giro(F, z1, 1, 96), sil = inviluppo(top.concat(giro(F, z1 - 2.2, 1.008, 96), giro(F, z0 + 1, 1.004, 96), giro(F, z0, .99, 96))), b = limiti(sil);
    var xc = Puv(G > 0 ? a1 : -a0, G > 0 ? b1 : -b0, 0)[0], t = Math.max(.08, Math.min(.92, (xc - b[0]) / (b[2] - b[0])));
    var lato = lin("sf", [[0, chiaro(c, .12)], [t - .07, scuro(c, .03)], [t + .05, scuro(c, .2)], [1, scuro(c, .32)]], b[0], 0, b[2], 0, true);
    return { F: F, top: top, sil: sil, s: pth(chiuso(sil), lato, bordo(L, lw || 2.2)) + pth(chiuso(top), sf([[0, chiaro(c, .4)], [1, chiaro(c, .1)]], 0, 0, 1, 1), bordo(L, 1.2)) };
  }
  // il legno: le venature su una faccia piatta (in orizzontale, o in verticale), ritagliate dentro la faccia
  function legno(c, seme, verticale) {
    return function (W, H) {
      var r = rnd(seme), s = "", i, lungo = verticale ? H : W, corto = verticale ? W : H, n = Math.max(2, Math.round(corto / 3.4));
      for (i = 0; i < n; i++) {
        var t = (i + .2 + r() * .6) / n * corto, amp = .25 + r() * 1.1, per = 6 + r() * 10, ph = r() * 6.3, d = "", x;
        for (x = -2; x <= lungo + 2.5; x += 2.5) { var y = t + Math.sin(x / per + ph) * amp; d += (d ? " L" : "M") + (verticale ? q(y, x) : q(x, y)); }
        s += tratto(d, scuro(c, .32), .45 + r() * .4, op(.22 + r() * .3));
      }
      return ritaglio(W, H, s);
    };
  }
  function nodo(x, y, rx, ry, c) { return ell(x, y, rx * 1.9, ry * 1.6, "none", "stroke='" + scuro(c, .3) + "' stroke-width='.5' opacity='.45'") + ell(x, y, rx, ry, scuro(c, .3), op(.75)) + ell(x - rx * .15, y - ry * .1, rx * .5, ry * .5, scuro(c, .55), op(.8)); }
  function chiodo(x, y) { return cer(x + .3, y + .35, .95, "#000", op(.25)) + cer(x, y, .85, "#8f8b82", bordo(L, .4)) + cer(x - .25, y - .25, .3, "#ffffff", op(.8)); }

  // il registro: box = [x0, y0, x1, y1] attorno al centro dell'impronta (per i mobili in piedi e le cose sopra)
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  LETTO DI LEGNO SEMPLICE: una tavola per testiera, il materasso con la molla che scappa,
  //  il cuscino schiacciato, la coperta a quadri blu con la toppa; un piede corto sta su due libri
  // =========================================================
  function quadri(nome, k, rot, chiaroK) {   // la trama a quadri della coperta: k = grandezza, rot = girata di 90°, chiaroK = il rovescio più chiaro
    var id = p + nome, w = f1(14 * k), h = f1(7 * k), base = chiaroK ? chiaro("#5d7fa3", chiaroK) : "#5d7fa3";
    if (!FATTI[id]) {
      FATTI[id] = 1;
      DEFS.push("<pattern id='" + id + "' width='" + w + "' height='" + w + "' patternUnits='userSpaceOnUse'" + (rot ? " patternTransform='rotate(90)'" : "") + ">" +
        "<rect width='" + w + "' height='" + w + "' fill='" + base + "'/><rect width='" + h + "' height='" + w + "' fill='#8aa6c4' opacity='.6'/><rect width='" + w + "' height='" + h + "' fill='#3e5f82' opacity='.42'/>" +
        "<rect x='" + f1(10.4 * k) + "' width='" + f1(.9 * k) + "' height='" + w + "' fill='#efe6cc' opacity='.5'/><rect y='" + f1(10.4 * k) + "' width='" + w + "' height='" + f1(.9 * k) + "' fill='#efe6cc' opacity='.4'/></pattern>");
    }
    return "url(#" + id + ")";
  }
  function pieghe(W, H, n, seme) {   // le pieghe morbide della stoffa che scende
    var r = rnd(seme), s = "", i;
    for (i = 0; i < n; i++) { var x = (i + .3 + r() * .4) * W / n, w = 1.4 + r() * 1.8; s += rett(x, -2, w, H + 4, 0, "#000", op(.13)) + rett(x - w * .9, -2, w * .8, H + 4, 0, "#fff", op(.09)); }
    return s;
  }
  function stellina(x, y, r) {   // l'adesivo a stella, scolorito
    var a = [], i; for (i = 0; i < 10; i++) { var t = -Math.PI / 2 + i * Math.PI / 5, k = i % 2 ? r * .45 : r; a.push([x + Math.cos(t) * k, y + Math.sin(t) * k]); }
    return poly(sposta(a, .4, .5), "#000", op(.12)) + poly(a, "#ffd66b", "stroke='#fff8e1' stroke-width='.7' stroke-linejoin='round' opacity='.9'") + poly(a, "none", "stroke='" + L + "' stroke-width='.3' opacity='.45'");
  }
  function etichetta(x, y, w, h) {   // un'etichetta di carta col codice a barre
    var s = rett(x + .4, y + .5, w, h, .4, "#000", op(.12)) + rett(x, y, w, h, .4, "#f8f5ec", "stroke='#9d9070' stroke-width='.35'"), i;
    s += rett(x + 1, y + 1.1, w * .55, .7, 0, "#7a7466") + rett(x + 1, y + 2.5, w * .4, .6, 0, "#a39d8e");
    for (i = 0; i < 13; i++) s += rett(x + 1 + i * (w - 2) / 13, y + h * .52, i % 3 ? .3 : .55, h * .36, 0, "#3a3630");
    return s;
  }
  def("letto_semplice", { tipo: "piedi", nome: "Letto di legno semplice", stanza: "camera", fp: [1, 2], box: [-77, -88, 77, 54], dietro: true, azione: "dormi", testa: [0, -.745, 30.2] }, function () {
    var c = "#b88b5c", s = ombra(4, 7, 84, 33, 1, -26.57), BQ = -.38, ZT = 27.8;
    function piede(a, b, z0) { return blocco(a - .033, a + .033, b - .033, b + .033, z0, 6.4, scuro(c, .3), null, 1.2); }
    function libro(a0, a1, b0, b1, z0, z1, col) {   // un libro sdraiato: la copertina e le pagine
      var pag = function (W, H) { return rett(0, H * .2, W - .7, H * .6, 0, "#f6efd9") + tratto("M0," + f1(H * .5) + " H" + f1(W - .9), "#cbbf9f", .3); };
      return blocco(a0, a1, b0, b1, z0, z1, col, { davanti: pag, fianco: pag, dietro: pag }, 1);
    }
    var gambe = [[-.4, -.885], [.4, -.885], [-.4, .905], [.4, .905]].map(function (g) {
      var zoppo = g[0] > 0 && g[1] > 0;   // il piede corto, rialzato con due libri
      return [vicino(g[0], g[1]), zoppo ? libro(.28, .495, .79, .995, 0, 2.3, "#e03131") + libro(.31, .475, .815, .975, 2.3, 4.4, "#fab005") + piede(g[0], g[1], 4.4) : piede(g[0], g[1], 0)];
    });
    function graffio(x, y) { return tratto("M" + q(x, y + .45) + " l6.5,1.4 M" + q(x + 1.6, y + 1.95) + " l4,.9", scuro(c, .35), .5, op(.7)) + tratto("M" + q(x, y) + " l6.5,1.4 M" + q(x + 1.6, y + 1.5) + " l4,.9", chiaro(c, .55), .45, op(.9)); }
    var tv = legno(c, 11), tf = legno(c, 13);
    function telaio() {
      return blocco(-.45, .45, -.935, .97, 6.4, 14, c, {
        davanti: function (W, H) { return tv(W, H) + chiodo(2.6, H / 2) + chiodo(W - 2.6, H / 2); },
        fianco: function (W, H) { return tf(W, H) + chiodo(2.6, H / 2) + chiodo(W - 2.6, H / 2) + graffio(W * .46, H * .3) + nodo(W * .8, H * .55, 1.4, .9, c); },
        dietro: function (W, H) { return tv(W, H) + chiodo(2.6, H / 2) + chiodo(W - 2.6, H / 2); }
      }, 2.1);
    }
    function materasso() {
      var M = soffice(-.43, .43, -.925, .95, 14, 26, "#efe7d4", 9, 2), r = M.s, a = G > 0 ? .43 : -.43;
      r += pth(chiuso(giro(M.F, 26, .962, 96)), "none", "stroke='#cdbf9d' stroke-width='.8' opacity='.85'");   // la cucitura del bordo
      r += dentro(chiuso(M.top), sopraT(26, ell(-27, -47, 7, 4.2, "#d6c086", op(.42)) + ell(-26, -47.6, 4.2, 2.4, "#e2d09c", op(.4))));   // un alone
      [-.85, -.48].forEach(function (b) { r += faccia(P(a, b, 20.5), -1, ell(0, 0, 1.3, 1.3, "#aaa496", bordo(L, .45)) + ell(0, 0, .6, .6, "#4d463a")); });   // gli occhielli dell'aria
      return r;
    }
    function molla() {   // la molla che scappa dal materasso, con un po' d'imbottitura
      var b = -.665, z = 20, r = faccia(P(.43, b, z), -1, ell(0, 0, 4.4, 3.2, "#fbf7ec", bordo("#b9aa83", .6)) + ell(.3, .3, 3.1, 2.2, "#3f3326")), i, o;   // il buco nella stoffa
      [[-3.4, -1.6, 1.5], [3.2, 1.9, 1.3], [-2, 2.6, 1.2], [2.6, -1.9, 1.1]].forEach(function (t) { var c0 = P(.432, b + t[0] * .01, z + t[1]); r += cer(c0[0], c0[1], t[2], "#fffdf7", "stroke='#cfc4a6' stroke-width='.45'"); });   // l'imbottitura che esce
      for (i = 0; i < 5; i++) {
        o = P(.43 + .03 * i, b - .008 * i, z + .3 + .65 * i);
        r += faccia(o, -1, ell(0, 0, 2.1, 2.5, "none", "stroke='" + L + "' stroke-width='1.6'") + ell(0, 0, 2.1, 2.5, "none", "stroke='#cfd3d6' stroke-width='.75'") + pth("M-1.5,-1.8 A2.1,2.5 0 0 1 1.4,-1.9", "none", "stroke='#ffffff' stroke-width='.45' opacity='.95'"));
      }
      o = P(.43 + .15, b - .04, z + 3.2);
      return r + tratto("M" + q(o) + " q2,-.8 1.7,-2.8", L, 1.6) + tratto("M" + q(o) + " q2,-.8 1.7,-2.8", "#cfd3d6", .75);   // la punta
    }
    function cuscino() {   // il cuscino sottile e schiacciato, con la conca morbida dove si appoggia la testa
      var F = forma(0, -.745, .3, .135, .135, 2.7), top = giro(F, 30.2, .92), lv = [giro(F, 25.8, .96), giro(F, 28.2, 1.03), top], c0 = P(.03, -.75, 30.2);
      var r = corpo(lv, [[0, "#fffdf7"], [.55, "#efe8d4"], [1, "#c9bea1"]], 1.8) + pth(chiuso(top), sf([[0, "#fffefa"], [1, "#eee6d1"]], 0, 0, 1, 1), bordo(L, 1.1));
      r += dentro(chiuso(top), ell(c0[0] + .8, c0[1] + .4, 11.5, 4.4, rf([[0, "#c9bd9c", .75], [.7, "#d8cdb0", .3], [1, "#d8cdb0", 0]], .5, .5, .5), "transform='rotate(" + f1(26.57) + " " + f1(c0[0] + .8) + " " + f1(c0[1] + .4) + ")'") +
        tratto("M" + q(P(-.25, -.8, 30.2)) + " Q" + q(P(-.17, -.77, 30.2)) + " " + q(P(-.15, -.72, 30.2)), "#cdbf9d", .6, op(.8)) + tratto("M" + q(P(.24, -.69, 30.2)) + " Q" + q(P(.19, -.72, 30.2)) + " " + q(P(.2, -.79, 30.2)), "#cdbf9d", .6, op(.8)));   // la conca e le pieghe
      return r + lucido(top, .5, .4);
    }
    function toppa() {   // la toppa arancione a pois, cucita col filo bianco (in centimetri, sulla coperta)
      var r = rnd(29), t = "", i;
      for (i = 0; i < 9; i++) t += cer(6.4 + r() * 15.6, 41 + r() * 12.4, .9, "#fff3e0", op(.85));
      return "<g transform='rotate(-8 15 47)'>" + rett(5.7, 40.6, 18.6, 14.6, 1.4, "#000", op(.18)) + rett(5, 39.6, 18.6, 14.6, 1.4, "#ee7a36", "stroke='" + L + "' stroke-width='.7'") + t +
        rett(6.6, 41.2, 15.4, 11.4, 1, "none", "stroke='#fff8ec' stroke-width='.8' stroke-dasharray='1.5 1.2'") + "</g>";
    }
    function coperta() {
      var ra = .458, b0 = BQ, b1 = .975, n = 120, Ft = forma(0, (b0 + b1) / 2, ra, (b1 - b0) / 2, (b1 - b0) / 2, 10), top = giro(Ft, ZT, 1, n), orlo = [], i;
      for (i = 0; i < n; i++) {   // l'orlo: sui fianchi e in fondo scende quasi fino al telaio, in cima resta appoggiata sul materasso
        var t = i / n * 6.2832, cs = Math.cos(t), sn = Math.sin(t), x = (cs < 0 ? -1 : 1) * Math.pow(Math.abs(cs), .2), y = (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), .2);
        var a = x * (ra + .016), b = Ft.cb + y * ((b1 - b0) / 2 + .016), k = Math.max(0, Math.min(1, (b - b0) / .16)), punta = Math.max(0, (Math.abs(x) - .8) / .2) * Math.max(0, (y - .8) / .2);
        orlo.push(P(a * (1 + .03 * punta), b + .008 * punta, ZT - 2.6 - (ZT - 2.6 - 15.4) * k - 4 * punta));   // in fondo gli angoli pendono un po' di più
      }
      var sil = inviluppo(top.concat(orlo)), lim = limiti(sil), aS = G > 0 ? ra + .016 : -(ra + .016), bF = G > 0 ? b1 + .016 : b0 - .016, xc = P(aS, bF, 0)[0];
      var H = ZT - 14, Wv = (2 * ra + .04) * 61, Wu = (b1 - b0 + .04) * 61, yR = (b0 + .11) * 100;
      var sx = "M" + q(lim[0] - 4, lim[1] - 4) + " H" + f1(xc) + " V" + f1(lim[3] + 4) + " H" + f1(lim[0] - 4) + " Z", dx = "M" + q(xc, lim[1] - 4) + " H" + f1(lim[2] + 4) + " V" + f1(lim[3] + 4) + " H" + f1(xc) + " Z";
      var dav = piattoV(-ra - .02, ra + .02, bF, ZT, rett(-30, -3, Wv + 60, H + 6, 0, quadri("qv", .61)) + pieghe(Wv, H, 4, 61) + rett(-30, -3, Wv + 60, H + 6, 0, "#ffffff", op(.08)));
      var fia = piattoU(b0 - .02, b1 + .02, aS, ZT, rett(-30, -3, Wu + 60, H + 6, 0, quadri("qu", .61, true)) + pieghe(Wu, H, 7, 67) + rett(-30, -3, Wu + 60, H + 6, 0, "#0d2238", op(.26)));
      var sop = sopraT(ZT, rett(-50, b0 * 100 - 4, 100, (b1 - b0) * 100 + 8, 0, quadri("qt", 1)) +
        rett(-50, b0 * 100 - 4, 100, yR - b0 * 100 + 4, 0, quadri("qr", 1, false, .3)) + rett(-50, yR, 100, 2.6, 0, "#000", op(.16)) + tratto("M-50," + f1(yR) + " L50," + f1(yR), "#1f344e", .9, op(.6)) +   // il risvolto in cima
        toppa());
      var r = pth(chiuso(sil), "#4f6f93") + dentro(chiuso(sil), dentro(sx, dav) + dentro(dx, fia) + pth(chiuso(top), "#5d7fa3") + dentro(chiuso(top), sop));
      return r + pth(chiuso(top), "none", "stroke='#22384f' stroke-width='.7' opacity='.45'") + pth(chiuso(sil), "none", bordo(L, 2));
    }
    function testiera() {   // una tavola sola: davanti il nodo, la scheggia in cima e l'adesivo; dietro due listelli e l'etichetta
      var fr = legno(c, 17), rt = legno(chiaro(c, .05), 19);
      function listello(W, y) { return rett(1.6, y, W - 3.2, 4.4, .5, scuro(c, .1), "stroke='" + scuro(c, .4) + "' stroke-width='.5'") + rett(1.6, y, W - 3.2, 1, 0, chiaro(c, .3), op(.6)) + [4, W / 2, W - 4].map(function (x) { return cer(x, y + 2.2, .7, "#9a958b", bordo(L, .3)) + tratto("M" + q(x - .45, y + 2.2) + " h.9", L, .3); }).join(""); }
      return blocco(-.478, .478, -.995, -.947, 0, 48, c, {
        davanti: function (W, H) {
          return fr(W, H) + nodo(W * .27, 8.5, 1.8, 1.1, c) + nodo(W * .72, 25, 1.2, .8, c) + stellina(W * .6, 7.4, 3.1) +
            pth("M" + q(W - 7.5, 0) + " L" + q(W, 0) + " L" + q(W, 5.5) + " L" + q(W - 1.8, 3.1) + " L" + q(W - 3.6, 3.6) + " L" + q(W - 4.6, 1.2) + " Z", chiaro(c, .4), "stroke='" + scuro(c, .3) + "' stroke-width='.5'") +   // la scheggia in cima
            chiodo(3.2, 4.4) + chiodo(W - 3.2, 9.5) + chiodo(3.2, H - 8) + chiodo(W - 3.2, H - 8);
        },
        dietro: function (W, H) { return rt(W, H) + listello(W, 8) + listello(W, H - 16) + etichetta(W * .2, 17, 13, 8); },
        fianco: legno(c, 23, true)
      }, 2.4);
    }
    s += ordina(gambe);
    if (G > 0) s += testiera() + telaio() + materasso() + molla() + cuscino() + coperta();
    else s += telaio() + materasso() + coperta() + cuscino() + testiera();
    return s;
  });

  // =========================================================
  //  SCATOLA DI CARTONE usata come comodino: lo scotch, FRAGILE, le frecce, la maniglia a buco,
  //  l'etichetta della spedizione, un'ammaccatura; sopra l'alone della tazza
  // =========================================================
  def("comodino_cartone", { tipo: "piedi", nome: "Scatola di cartone", stanza: "camera", fp: [1, 1], box: [-34, -46, 39, 22], dietro: true, piano: 27 }, function () {
    var c = "#c99a62", A = .25, B0 = -.36, B1 = .12, Z = 27, s = ombra(5, 6, 34, 15);
    function onde(W, H) { var r = "", x; for (x = 1.3; x < W; x += 1.8) r += rett(x, 0, .5, H, 0, scuro(c, .25), op(.09)); return r; }   // le righine del cartone ondulato
    function nastro(x, y0, y1) {   // lo scotch marrone chiaro, lucido, strappato in fondo
      var w = 6.2, d = "M" + q(x - w / 2, y0) + " H" + f1(x + w / 2) + " V" + f1(y1) + " L" + q(x + w * .28, y1 + 1.4) + " L" + q(x + w * .06, y1 - .3) + " L" + q(x - w * .18, y1 + 1.6) + " L" + q(x - w / 2, y1 + .4) + " Z";
      return pth(d, "#e8d197", op(.8)) + pth(d, "none", "stroke='" + scuro(c, .25) + "' stroke-width='.35' opacity='.6'") + rett(x - w / 2 + 1, y0, 1.2, y1 - y0, 0, "#ffffff", op(.4)) + rett(x + w / 2 - 1.6, y0, .6, y1 - y0, 0, "#ffffff", op(.25));
    }
    function frecce(x, y, col) {   // le due frecce "questo lato in alto"
      var r = "";
      [0, 3.4].forEach(function (dx) { r += pth("M" + q(x + dx + 1.3, y) + " l1.4,2 h-.85 v2.8 h-1.1 v-2.8 h-.85 Z", col, op(.75)); });
      return r + rett(x - .2, y + 5.4, 6.4, .55, 0, col, op(.75));
    }
    function ammaccatura(x, y) {   // il cartone schiacciato in un angolo
      return pth("M" + q(x - 3, y - 4) + " L" + q(x + 2.6, y - 2.2) + " L" + q(x + 4.2, y + 2.4) + " L" + q(x - 1, y + 4) + " L" + q(x - 3.6, y + 1) + " Z", scuro(c, .22), op(.45)) +
        tratto("M" + q(x - 2.6, y - 3.4) + " L" + q(x + 1.4, y + .6) + " L" + q(x + 3.8, y + 2) + " M" + q(x + 1.4, y + .6) + " L" + q(x - .6, y + 3.4), chiaro(c, .45), .5, op(.8)) +
        tratto("M" + q(x - 2.2, y - 2.8) + " L" + q(x + 1.6, y + 1.1), scuro(c, .4), .4, op(.6));
    }
    function riciclo(x, y) { return pth("M" + q(x, y - 3) + " L" + q(x + 2.9, y + 1.9) + " L" + q(x - 2.9, y + 1.9) + " Z", "none", "stroke='#4a3420' stroke-width='.6' stroke-dasharray='2.3 .9' opacity='.6'"); }
    var dav = function (W, H) {   // il timbro rosso "fragile" (senza scritte: il motore specchia il disegno), le frecce
      var r = onde(W, H) + frecce(2, 2.2, "#3b2a1a"), cx = W / 2 + 1.5, cy = H * .72;
      r += "<g transform='rotate(-5 " + f1(cx) + " " + f1(cy) + ")' opacity='.85'>" + rett(cx - 9.5, cy - 5, 19, 10, .8, "none", "stroke='#b42318' stroke-width='.75'") +
        pth("M" + q(cx - 7.6, cy - 3.4) + " H" + f1(cx - 2.6) + " Q" + q(cx - 2.6, cy) + " " + q(cx - 5.1, cy + .5) + " Q" + q(cx - 7.6, cy) + " " + q(cx - 7.6, cy - 3.4) + " Z", "#b42318") +
        tratto("M" + q(cx - 5.1, cy + .5) + " V" + f1(cy + 2.6) + " M" + q(cx - 6.6, cy + 2.9) + " H" + f1(cx - 3.6), "#b42318", .6) + tratto("M" + q(cx - 5.4, cy - 3.4) + " l.7,1.2 l-.8,.8 l.5,1", "#f3d9b0", .45) +   // il calice incrinato
        rett(cx - 1, cy - 3, 9, 1.5, .4, "#b42318") + rett(cx - 1, cy - .3, 7, 1.2, .4, "#b42318") + rett(cx - 1, cy + 2.2, 8, 1.2, .4, "#b42318") + "</g>";
      return ritaglio(W, H, r + nastro(W / 2, -1, H * .46) + ammaccatura(4.6, H - 5));
    };
    var fia = function (W, H) {
      var r = onde(W, H), x = W / 2;
      r += ell(x, 6, 4.8, 1.9, "#3a2614") + pth("M" + q(x - 4.5, 6.5) + " Q" + q(x, 8.9) + " " + q(x + 4.5, 6.5) + " Q" + q(x, 7.9) + " " + q(x - 4.5, 6.5) + " Z", chiaro(c, .25)) + ell(x, 6, 4.8, 1.9, "none", "stroke='" + scuro(c, .45) + "' stroke-width='.45'");   // la maniglia a buco
      return ritaglio(W, H, r + "<g transform='rotate(3 " + f1(x) + " 16)'>" + etichetta(x - 7.5, 11.5, 15, 9.5) + "</g>");
    };
    var ret = function (W, H) {
      var r = onde(W, H) + frecce(W - 8.6, 2.2, "#3b2a1a"), x = W * .2, y = H * .7;
      r += tratto("M" + q(x, y) + " c1,-3 2.4,-3 2,0 c-.3,2 1.4,2.2 2.2,-.4 c.6,-2.6 1.8,-2.4 1.6,.2 c-.1,1.8 1.6,1.6 2.4,-.6 c.5,-1.6 1.8,-1.2 1.8,.6 c0,1.4 1.4,1 2.2,-.4 M" + q(x - .4, y + 3) + " q6,1.2 13,-.4", "#2b2118", .8, op(.8));   // la scritta a pennarello, illeggibile
      return ritaglio(W, H, r + riciclo(W - 5, H - 5) + nastro(W / 2, -1, H * .38));
    };
    var sop = function (A_, B_, C_, D_) {   // sopra: i due lembi chiusi con lo scotch, gli spigoli piegati, l'alone della tazza
      var r = tratto("M0," + f1(B0 * 100) + " V" + f1(B1 * 100), scuro(c, .45), .6, op(.7)) +
        rett(-24, B0 * 100 + 1, 48, (B1 - B0) * 100 - 2, 1, "none", "stroke='" + chiaro(c, .3) + "' stroke-width='.6' opacity='.7'") +
        rett(-3.1, B0 * 100 - 1, 6.2, (B1 - B0) * 100 + 2, 0, "#e8d197", op(.8)) + rett(-2.1, B0 * 100 - 1, 1.2, (B1 - B0) * 100 + 2, 0, "#ffffff", op(.4)) +
        ell(12, -22, 4.4, 4.4, "none", "stroke='#7a4a1f' stroke-width='.9' opacity='.32'") + pth("M" + q(8.4, -20) + " A4,4 0 0 1 14.5,-26", "none", "stroke='#7a4a1f' stroke-width='.5' opacity='.3'");
      return dentro(chiuso([A_, B_, C_, D_]), sopraT(Z, r));
    };
    return s + blocco(-A, A, B0, B1, 0, Z, c, { davanti: dav, fianco: fia, dietro: ret, sopra: sop }, 2.2);
  });

  // =========================================================
  //  ARMADIO CON L'ANTA STORTA: l'anta di destra pende e lascia la fessura (ne scappa un calzino),
  //  al posto del pomello che manca c'è uno spago, l'impiallacciatura si stacca, sul fianco un adesivo
  // =========================================================
  def("armadio_storto", { tipo: "piedi", nome: "Armadio con l'anta storta", stanza: "camera", fp: [1, 1], box: [-52, -144, 55, 32], dietro: true }, function () {
    var c = "#a87b52", s = ombra(6, 9, 50, 22);
    s += ordina([[-.425, -.425], [.38, -.425], [-.425, .06], [.38, .06]].map(function (g) { return [vicino(g[0], g[1]), blocco(g[0], g[0] + .045, g[1], g[1] + .045, 0, 5, scuro(c, .42), null, 1.2)]; }));   // i piedini
    function anta(x, y, w, h, seme) {   // un'anta di truciolato impiallacciato: venature in verticale, la cornicetta incisa
      var d = "M" + q(x, y) + " h" + f1(w) + " v" + f1(h) + " h" + f1(-w) + " Z";
      return pth(d, sf([[0, chiaro(c, .14)], [1, scuro(c, .05)]], 0, 0, 1, 1), "stroke='" + scuro(c, .5) + "' stroke-width='.8'") + "<g transform='translate(" + f1(x) + " " + f1(y) + ")'>" + legno(c, seme, true)(w, h) + "</g>" +
        rett(x + 3, y + 4, w - 6, h - 8, .8, "none", "stroke='" + scuro(c, .32) + "' stroke-width='.6' opacity='.7'") + rett(x + 3.6, y + 4.6, w - 6, h - 8, .8, "none", "stroke='" + chiaro(c, .4) + "' stroke-width='.5' opacity='.55'") +
        tratto("M" + q(x + .6, y + h - .6) + " V" + f1(y + .6) + " H" + f1(x + w - .6), chiaro(c, .5), .6, op(.7));
    }
    function pomelloOro(x, y) { return cer(x + .3, y + .4, 1.8, "#000", op(.25)) + cer(x, y, 1.8, rf([[0, "#fff4c8"], [.5, "#e0c070"], [1, "#8a6a1f"]], .35, .3, .8), bordo(L, .6)) + cer(x - .5, y - .5, .5, "#ffffff", op(.85)); }
    function buco(x, y) {   // il pomello che manca: il buco, le due viti, e uno spago annodato al posto della maniglia
      return cer(x, y, 1.2, "#1d130b") + cer(x - .25, y - .3, 1.25, "none", "stroke='" + chiaro(c, .4) + "' stroke-width='.4' opacity='.7'") + cer(x, y - 3.2, .38, "#3a2a1c") + cer(x, y + 3.2, .38, "#3a2a1c") +
        tratto("M" + q(x, y) + " C" + q(x - 2.4, y + 2.6) + " " + q(x + 2.2, y + 6.4) + " " + q(x - .4, y + 8.6) + " M" + q(x, y) + " C" + q(x + 1.8, y + 2.6) + " " + q(x + 2.8, y + 6.2) + " " + q(x - .4, y + 8.6), "#5a4a30", 1.2) +
        tratto("M" + q(x, y) + " C" + q(x - 2.4, y + 2.6) + " " + q(x + 2.2, y + 6.4) + " " + q(x - .4, y + 8.6) + " M" + q(x, y) + " C" + q(x + 1.8, y + 2.6) + " " + q(x + 2.8, y + 6.2) + " " + q(x - .4, y + 8.6), "#e2d3ab", .6) + cer(x - .1, y + .6, .7, "#e2d3ab", bordo("#5a4a30", .3));
    }
    function calzino(x, y) {   // il calzino a righe rimasto chiuso nell'anta: pende fuori dalla fessura
      var d = "M" + q(x - 1.8, y) + " L" + q(x + 1.8, y) + " L" + q(x + 2.1, y + 11) + " Q" + q(x + 2.4, y + 15.6) + " " + q(x - 1.4, y + 16) + " Q" + q(x - 5.4, y + 16.4) + " " + q(x - 5, y + 14) + " Q" + q(x - 4.6, y + 12.2) + " " + q(x - 1.8, y + 11.8) + " Z", righe = "", k;
      for (k = 0; k < 7; k++) righe += rett(x - 7, y + 1.2 + k * 2.3, 12, 1.1, 0, "#e03131");
      return pth(d, "#000", "opacity='.22' transform='translate(1.1 1)'") + pth(d, "#f8f4ea") + dentro(d, righe + ell(x - 3.8, y + 14.6, 2.2, 1.8, "#e03131") + ell(x + 1.2, y + 13.6, 1.5, 2, "#e03131") +
        rett(x - 7, y - 1, 12, 5, 0, sf([[0, "#000", .55], [1, "#000", 0]], 0, 0, 0, 1)) + rett(x - 1.4, y, .9, 14, 0, "#ffffff", op(.35))) + pth(d, "none", bordo(L, .6));
    }
    function buccia(x, yb) {   // l'impiallacciatura che si stacca: sotto si vede il truciolato
      var k = rnd(7), d = "M" + q(x + .5, yb - 14) + " L" + q(x + 4.6, yb - 11.2) + " L" + q(x + 6.4, yb - 6.4) + " L" + q(x + 10.6, yb - 3.2) + " L" + q(x + 12.4, yb - .5) + " L" + q(x + .5, yb - .5) + " Z", t = "", i;
      for (i = 0; i < 30; i++) t += cer(x + 1 + k() * 11, yb - 1 - k() * 12.6, .28 + k() * .35, k() < .5 ? "#8c6c44" : "#f4e6c6", op(.85));
      return pth(d, "#d8c39a") + dentro(d, t + rett(x, yb - 15, 3, 15, 0, "#000", op(.12))) + pth(d, "none", "stroke='" + scuro(c, .5) + "' stroke-width='.5'") +
        pth("M" + q(x + 4.6, yb - 11.2) + " Q" + q(x + 7.8, yb - 12.6) + " " + q(x + 8.8, yb - 9.6) + " Q" + q(x + 7.6, yb - 8.4) + " " + q(x + 6.4, yb - 6.4) + " Z", chiaro(c, .3), bordo(L, .45));   // il ricciolo che si alza
    }
    var ante = function (W, H) {
      var g = 1.4, w2 = (W - 3 * g) / 2, y0 = 2.4, h = H - 5, xL = g, xR = 2 * g + w2;
      var r = legno(c, 31, true)(W, H) + rett(xR - .8, y0 - .8, w2 + 1.8, h + 1.6, 0, "#24170e");   // il buio dentro, che si vede dalla fessura
      r += anta(xL, y0, w2, h, 41) + pomelloOro(xL + w2 - 4, y0 + h * .47) + buccia(xL, y0 + h);
      r += "<g transform='rotate(4 " + f1(xR) + " " + f1(y0) + ")'>" + anta(xR, y0, w2, h, 43) + buco(xR + 4, y0 + h * .47) + "</g>";   // l'anta storta
      return ritaglio(W, H, r + calzino(xR + 25.4, y0 + h * .42));
    };
    var fianco = function (W, H) {
      var r = legno(c, 33, true)(W, H), x = W * .56, y = 30;
      if (G < 0) return r + chiodo(W * .5, 22) + tratto("M" + q(W * .5, 22) + " q-.4,-2.2 1.4,-2.4 q1.6,0 1.2,1.8 M" + q(W * .5, 22) + " L" + q(W * .5 - 9, 29) + " H" + f1(W * .5 + 9) + " Z", "#8d8b80", .7);   // dall'altra parte: una gruccia di fil di ferro appesa a un chiodo
      r += cer(x + .5, y + .6, 4.6, "#000", op(.12)) + cer(x, y, 4.6, "#f5d24a", "stroke='#fffaf0' stroke-width='.8' opacity='.88'") + cer(x - 1.5, y - 1, .55, "#3b2a1a") + cer(x + 1.5, y - 1, .55, "#3b2a1a") + tratto("M" + q(x - 2.3, y + 1) + " Q" + q(x, y + 3.2) + " " + q(x + 2.3, y + 1), "#3b2a1a", .6);
      r += pth("M" + q(x + 2.3, y + 3.9) + " Q" + q(x + 4.8, y + 3) + " " + q(x + 4.3, y + 1.1) + " Q" + q(x + 3, y + 3.2) + " " + q(x + 2.3, y + 3.9) + " Z", "#fffdf2", bordo(L, .35));   // l'adesivo della faccina, con l'angolino che si stacca
      return r + tratto("M" + q(W * .2, 70) + " l5,-1.5 M" + q(W * .25, 72) + " l3,-.8", chiaro(c, .5), .45, op(.8));
    };
    function valigia() {   // la vecchia valigia di cartone messa sopra l'armadio: le cinghie, le borchie e l'adesivo del viaggio
      var F = forma(-.05, -.19, .29, .18, .18, 9), z0 = 115.5, z1 = 124, cv = "#9a6a3e"; F.ang = .1;
      var bot = giro(F, z0, 1, 72), top = giro(F, z1, 1, 72), sil = inviluppo(bot.concat(top)), lim = limiti(sil);
      var low = bot.reduce(function (m, x) { return x[1] > m[1] ? x : m; }, bot[0]), t = Math.max(.1, Math.min(.9, (low[0] - lim[0]) / (lim[2] - lim[0])));
      var r = pth(chiuso(sil), lin("vl", [[0, chiaro(cv, .14)], [t - .06, scuro(cv, .02)], [t + .05, scuro(cv, .24)], [1, scuro(cv, .36)]], lim[0], 0, lim[2], 0, true), bordo(L, 1.8));
      r += tratto("M" + frontale(giro(F, z0 + 5.4, 1.006, 72)).map(function (x) { return q(x); }).join(" L"), scuro(cv, .45), .8, op(.8));   // la riga del coperchio
      r += pth(chiuso(top), sf([[0, chiaro(cv, .32)], [1, chiaro(cv, .08)]], 0, 0, 1, 1), bordo(L, 1.3));
      var dc = [-13, 13].map(function (x) { return rett(x - 2.2, -19, 4.4, 38, 0, scuro(cv, .3), op(.85)) + rett(x - 2.8, 5, 5.6, 4, .6, "none", "stroke='#d9c27a' stroke-width='.9'"); }).join("") +   // le cinghie con la fibbia
        [[-27, -16], [27, -16], [-27, 16], [27, 16]].map(function (v) { return cer(v[0] * .92, v[1] * .82, 1.6, "#d9c27a", bordo(L, .4)); }).join("") +   // le borchie agli angoli
        "<g transform='translate(2 -4) rotate(-12)'>" + ell(0, 0, 7.6, 5.6, "#fff3dc", "stroke='#e8590c' stroke-width='1.3'") + dentro("M-7.6,0 A7.6,5.6 0 1 0 7.6,0 A7.6,5.6 0 1 0 -7.6,0 Z", pth("M-8,2 Q-4,.6 0,2 Q4,3.4 8,2 V6 H-8 Z", "#4dabf7") + cer(3.6, -1.8, 1.9, "#fcc419") +
          tratto("M-2.2,3 Q-2.6,-.6 -.8,-3.4", "#8a5a2b", .9) + [[-3, -3.2, 25], [1.2, -3.4, -25], [-1.6, -4.6, -60], [.2, -2.4, 40]].map(function (f) { return ell(f[0], f[1], 2.1, .7, "#2f9e44", "transform='rotate(" + f[2] + " " + f[0] + " " + f[1] + ")'"); }).join("")) + "</g>";   // l'adesivo della spiaggia
      r += dentro(chiuso(top), sopraT(z1, "<g transform='translate(" + f1(F.ca * 100) + " " + f1(F.cb * 100) + ") rotate(" + f1(F.ang * 57.3) + ")'>" + dc + "</g>"));
      if (G > 0) {   // davanti: la maniglia
        var mx = F.ca - .18 * Math.sin(F.ang), my = F.cb + .18 * Math.cos(F.ang), h1 = P(mx - .05, my + .005, z0 + 6.2), h2 = P(mx + .05, my - .005, z0 + 6.2), hm = P(mx, my + .02, z0 + 9.5);
        r += tratto("M" + q(h1) + " Q" + q(hm) + " " + q(h2), L, 2.4) + tratto("M" + q(h1) + " Q" + q(hm) + " " + q(h2), "#5a3b1e", 1.1);
      }
      return r;
    }
    var schiena = function (W, H) {   // la schiena di masonite inchiodata, con l'etichetta
      var r = rett(2.4, 2.4, W - 4.8, H - 4.8, 0, "#c29b6d", "stroke='" + scuro(c, .4) + "' stroke-width='.7'"), k = rnd(9), i, x, y;
      function chiodino(x2, y2) { return cer(x2, y2, .5, "#6d665c") + cer(x2 - .15, y2 - .15, .18, "#ffffff", op(.6)); }
      for (i = 0; i < 110; i++) r += cer(3 + k() * (W - 6), 3 + k() * (H - 6), .25, k() < .5 ? "#a9835a" : "#dcb98c", op(.55));
      for (x = 6; x < W - 3; x += 7.5) r += chiodino(x, 3.6) + chiodino(x, H - 3.6);
      for (y = 12; y < H - 6; y += 10) r += chiodino(3.6, y) + chiodino(W - 3.6, y);
      return r + etichetta(W * .56, 14, 14, 9);
    };
    s += blocco(-.46, .46, -.46, .1, 5, 110, c, { davanti: ante, fianco: fianco, dietro: schiena }, 2.4);
    var cr = function (W, H) { return legno(scuro(c, .15), 37)(W, H) + rett(0, 0, W, .9, 0, chiaro(c, .2), op(.6)); };
    return s + blocco(-.485, .485, -.485, .125, 110, 115.5, scuro(c, .15), {
      davanti: function (W, H) { return cr(W, H) + pth("M" + q(W * .68, H) + " L" + q(W * .7, H - 2.4) + " L" + q(W * .74, H - 1.6) + " L" + q(W * .77, H) + " Z", chiaro(c, .35), "stroke='" + scuro(c, .4) + "' stroke-width='.4'"); },   // una scheggia sul bordo
      fianco: cr, dietro: cr
    }, 2.2) + valigia();
  });

  // =========================================================
  //  LAMPADA COL PARALUME STORTO: la base smaltata con l'interruttore rosso, lo stelo,
  //  il paralume di carta inclinato, ammaccato e un po' strappato
  // =========================================================
  def("lampada_storta", { tipo: "sopra", nome: "Lampada col paralume storto", stanza: "camera", fp: [1, 1], box: [-13, -31, 16, 9], dietro: true }, function () {
    var cb = "#7a6a52", s = ombra(2.6, 2.2, 12, 5.6), base = forma(0, 0, .092, .092, .092, 2), i;
    var lv = [giro(base, 0, 1, 40), giro(base, 1.5, 1, 40), giro(base, 3.4, .5, 40)];
    s += corpo(lv, [[0, chiaro(cb, .45)], [.45, cb], [1, scuro(cb, .4)]], 1.4) + lucido(sagoma(lv), .28, .4);
    [[-.05, .04, .9], [.02, .075, .6]].forEach(function (k) { var o = P(k[0], k[1], 1.6); s += ell(o[0], o[1], k[2], k[2] * .55, "#d9d3c4", op(.8)); });   // lo smalto saltato
    var sw = P(.045, .06, 2.2); s += ell(sw[0] + .2, sw[1] + .4, 1.5, .9, "#2b211a") + ell(sw[0], sw[1], 1.25, .75, "#c0392b", bordo(L, .35));   // l'interruttore
    s += tubo(linea(P(0, 0, 3), P(0, 0, 16.4)), 1.4, "#8b7b62");   // lo stelo
    var pv = [0, 0, 16.4], ta = -.24, tb = .09;
    function an(z, rr) { var o = [], t; for (i = 0; i < 48; i++) { t = i / 48 * 6.2832; o.push(P.apply(null, inclina([rr * Math.cos(t), rr * Math.sin(t), z], pv, ta, tb))); } return o; }
    function davanti(t) { return G * (Math.cos(t) + Math.sin(t)) > -.2; }
    var giu = an(11.6, .118), su = an(25.4, .072), sil = inviluppo(giu.concat(su)), lim = limiti(sil), cuc = "", t;
    for (i = 0; i < 48; i += 4) { t = i / 48 * 6.2832; if (davanti(t)) cuc += tratto(linea(giu[i], su[i]), i === 8 ? "#a48f63" : "#c9b688", i === 8 ? .6 : .4, op(i === 8 ? .9 : .5)); }   // le pieghe e la cucitura
    var am = P.apply(null, inclina([-.035, .085, 19.5], pv, ta, tb)), st = P.apply(null, inclina([.07, .085, 12.4], pv, ta, tb)), dett = "";
    if (G > 0) dett = tratto("M" + q(am[0] - 1.6, am[1] - 2.6) + " Q" + q(am[0] + .8, am[1] - .4) + " " + q(am[0] - .4, am[1] + 2.8), "#8f7b52", .7, op(.8)) + tratto("M" + q(am[0] - 1, am[1] - 2.6) + " Q" + q(am[0] + 1.4, am[1] - .4) + " " + q(am[0] + .2, am[1] + 2.8), "#fffaf0", .6, op(.7)) +   // l'ammaccatura
      pth("M" + q(st[0] - 1.6, st[1] + 1) + " L" + q(st[0] - .4, st[1] - 3.4) + " L" + q(st[0] + .5, st[1] - 1.2) + " L" + q(st[0] + 1.4, st[1] - 2.6) + " L" + q(st[0] + 1.8, st[1] + 1.2) + " Z", "#5b4a32") + tratto("M" + q(st[0] - .4, st[1] - 3.4) + " L" + q(st[0] - 2.2, st[1] - 2.4), "#f3e6c4", .7);   // lo strappo
    s += pth(chiuso(sil), lin("pl", [[0, "#fbf3dc"], [.45, "#ead9ab"], [1, "#b49f73"]], lim[0], 0, lim[2], 0, true), bordo(L, 1.6)) + dentro(chiuso(sil), cuc + dett);
    return s + pth(chiuso(su), "#a8946a", bordo(L, 1)) + dentro(chiuso(su), pth(chiuso(sposta(su, 1.1, 1.3)), "#d6c396")) + pth(chiuso(su), "none", "stroke='" + L + "' stroke-width='1'");
  });

  // =========================================================
  //  SVEGLIA vecchia a campane: rossa, con le campanelle d'ottone e il martelletto, il quadrante crepato;
  //  dietro le due chiavette per caricarla
  // =========================================================
  function discoV(ca, cb, cz, r, n) { var out = [], i; for (i = 0; i < n; i++) { var t = i / n * 6.2832; out.push(P(ca + r * Math.cos(t), cb, cz + r * 61 * Math.sin(t))); } return out; }   // un cerchio in piedi (nel piano a-z)
  def("sveglia", { tipo: "sopra", nome: "Sveglia", stanza: "tutte", fp: [1, 1], box: [-9, -17, 12, 7], dietro: true }, function () {
    var R = .07, D = .026, Z0 = 1.3, H0 = R * 61, cz = Z0 + H0, s = ombra(1.2, 1.2, 9, 3.8);
    var fr = discoV(0, D, cz, R, 48), rt = discoV(0, -D, cz, R, 48), sil = inviluppo(fr.concat(rt)), lim = limiti(sil);
    function gamba(a, b) { var t = P(a * .75, b * .6, Z0 + .7), f = P(a, b, 0); return tratto(linea(t, f), L, 1.7) + tratto(linea(t, f), "#5a5048", .8) + ell(f[0], f[1], 1, .55, "#3a3028", bordo(L, .3)); }
    var gambe = [[-.055, -.02], [.055, -.02], [-.055, .024], [.055, .024]].map(function (g) { return [vicino(g[0], g[1]), gamba(g[0], g[1])]; });
    s += ordina(gambe.filter(function (g) { return g[0] < 0; }));
    function campana(lato) {   // una campanella d'ottone, inclinata verso fuori
      var c0 = P(lato * .047, 0, cz + H0 * .8), sx = c0[0] < 0 ? -1 : 1;
      return "<g transform='translate(" + f1(c0[0]) + " " + f1(c0[1]) + ") rotate(" + (sx * 36) + ")'>" + pth("M-3,0 Q-3,-3.4 0,-3.4 Q3,-3.4 3,0 Z", lin("cmp", OTTONE, 0, 0, 1, 0), bordo(L, .55)) +
        rett(-3.3, -.3, 6.6, 1, .5, "#b8913a", bordo(L, .4)) + cer(0, -3.6, .75, "#c9a24a", bordo(L, .35)) + ell(-1.3, -2.1, .6, 1, "#ffffff", op(.6)) + ell(1.4, -1.2, .7, .5, "#6b5216", op(.35)) + "</g>";
    }
    var mt = P(0, -.004, cz + H0 - .4), mb = P(0, -.004, cz + H0 + 2.8);
    s += tratto(linea(mt, mb), L, 1.1) + tratto(linea(mt, mb), "#8d8b80", .45) + cer(mb[0], mb[1], .75, "#8d8b80", bordo(L, .35));   // il martelletto
    s += campana(-1) + campana(1);
    s += pth(chiuso(sil), lin("sv", [[0, "#ff8a7a"], [.45, "#e03131"], [1, "#8f1d1d"]], lim[0], 0, lim[2], 0, true), bordo(L, .9)) +
      dentro(chiuso(sil), cer(lim[2] - 2.2, lim[1] + 3, .5, "#d9d3c4", op(.8)) + cer(lim[2] - 1.4, lim[1] + 4.4, .3, "#d9d3c4", op(.8)));   // la vernice saltata
    var c0 = H0;
    function quadrante() {
      var r = cer(c0, c0, c0 * .98, lin("bz", METALLO, 0, 0, 1, 1), bordo(L, .5)) + cer(c0, c0, c0 * .8, rf([[0, "#fffdf3"], [.8, "#f5ead0"], [1, "#d6c6a0"]], .4, .35, .8), bordo(L, .35)), k;
      for (k = 0; k < 12; k++) { var a = k / 12 * 6.2832, l0 = k % 3 ? .62 : .54; r += tratto("M" + q(c0 + Math.sin(a) * c0 * l0, c0 - Math.cos(a) * c0 * l0) + " L" + q(c0 + Math.sin(a) * c0 * .7, c0 - Math.cos(a) * c0 * .7), "#3b2a1a", k % 3 ? .2 : .35); }
      function lancetta(a, l, w, col) { return tratto("M" + q(c0, c0) + " L" + q(c0 + Math.sin(a) * c0 * l, c0 - Math.cos(a) * c0 * l), col, w); }
      r += lancetta(3.6, .52, .42, "#c92a2a") + lancetta(5.25, .42, .5, "#2b2118") + lancetta(1.05, .62, .36, "#2b2118") + cer(c0, c0, .4, "#2b2118");
      r += tratto("M" + q(c0 + 1.6, c0 - 3) + " L" + q(c0 + .7, c0 - 1.2) + " L" + q(c0 + 1.3, c0 + .2) + " L" + q(c0 + .2, c0 + 2.2), "#ffffff", .3, op(.95));   // la crepa nel vetro
      return r + pth("M" + q(c0 - c0 * .62, c0 - .5) + " A" + f1(c0 * .62) + "," + f1(c0 * .62) + " 0 0 1 " + q(c0 - .5, c0 - c0 * .62), "none", "stroke='#ffffff' stroke-width='.5' opacity='.85'");
    }
    function retroS() {   // dietro: le due chiavette per caricarla e il pomellino della suoneria
      var r = cer(c0, c0, c0 * .96, rf([[0, "#f2756a"], [.7, "#d63a2f"], [1, "#8f1d1d"]], .4, .35, .8), bordo(L, .45)) + cer(c0, c0, c0 * .74, "none", "stroke='#8f1d1d' stroke-width='.3' opacity='.7'");
      [-1, 1].forEach(function (k) { var x = c0 + k * 2.1, y = c0 - .9; r += ell(x, y - 1.05, .62, .95, lin("ch", OTTONE, 0, 0, 1, 1), bordo(L, .28)) + ell(x, y + 1.05, .62, .95, lin("ch", OTTONE, 0, 0, 1, 1), bordo(L, .28)) + cer(x, y, .42, "#8a6a1f", bordo(L, .22)); });   // le chiavette a farfalla
      return r + cer(c0, c0 + 2.3, .65, "#8d8b80", bordo(L, .28)) + tratto("M" + q(c0 - .4, c0 + 2.3) + " h.8", L, .2);
    }
    s += G > 0 ? piattoV(-R, R, D, cz + H0, quadrante()) : piattoV(-R, R, -D, cz + H0, retroS());
    return s + ordina(gambe.filter(function (g) { return g[0] >= 0; }));
  });

  // =========================================================
  //  GABINETTO VECCHIO: ceramica ingiallita, la cassetta squadrata col coperchio storto e crepato e il tasto consumato,
  //  niente coperchio sulla tazza, la tavoletta gialla di traverso, il tubo col rubinetto a rotella,
  //  una riga di ruggine; accanto la ventosa per sturare
  // =========================================================
  def("wc_vecchio", { tipo: "piedi", nome: "Gabinetto vecchio", stanza: "bagno", fp: [1, 1], box: [-44, -85, 44, 25], dietro: true }, function () {
    var s = ombra(5, 7, 38, 17);
    var cas = forma(0, -.36, .235, .1, .1, 7), cop = forma(.014, -.356, .252, .114, .114, 7); cop.ang = .075;
    var taz = forma(0, -.03, .19, .255, .2), sed = forma(.008, -.03, .206, .272, .216); sed.ang = -.11;
    var bu = forma(.008, -.012, .122, .172, .106); bu.ang = -.11;
    var acq = forma(0, .022, .094, .108, .084);
    function cassetta() {
      var lv = [giro(cas, 31), giro(cas, 59.6)], sil = sagoma(lv), r = corpo(lv, CER_V);
      if (G > 0) { var d0 = P(.11, -.26, 37.5), d1 = P(.114, -.26, 30.6); r += dentro(chiuso(sil), tratto(linea(d0, d1), "#b86a24", 1.2, op(.42)) + tratto(linea([d0[0], d0[1] + 1.6], d1), "#8a4a14", .5, op(.45)) + ell(d0[0], d0[1], 1, .6, "#8a4a14", op(.5))); }   // la riga di ruggine
      r += lucido(sil, .6, .55);
      var top = giro(cop, 64.2);
      r += corpo([giro(cop, 59.4), top], CER_V, 2) + pth(chiuso(top), sf([[0, "#fffdf5"], [1, "#ece3c9"]], 0, 0, 1, 1), bordo(L, 1.5));
      r += tratto("M" + q(P(.11, -.285, 64.2)) + " L" + q(P(.145, -.33, 64.2)) + " L" + q(P(.135, -.365, 64.2)) + " L" + q(P(.185, -.405, 64.2)) + " L" + q(P(.2, -.45, 64.2)), "#6b5f48", .6, op(.85));   // la crepa sul coperchio
      var t = P(-.07, -.352, 64.2);   // il tasto, cromato ma consumato
      return r + ell(t[0] + .4, t[1] + 1, 4.6, 2.4, "#7d7a70", bordo(L, 1)) + ell(t[0], t[1], 4.2, 2.1, rf([[0, "#ffffff"], [.55, "#cfcfc6"], [1, "#8d8b80"]], .4, .35, .75), bordo(L, 1)) + ell(t[0] + 1.2, t[1] + .4, 1.6, .8, "#c9a24a", op(.55));
    }
    function tuboAcqua() {   // il tubo dell'acqua che esce dal muro, col rubinetto a rotella
      var a = P(.226, -.41, 33.5), b = P(.29, -.41, 33.5), c2 = P(.29, -.41, 12.5), d = P(.29, -.5, 12.5), w = P(.322, -.41, 22);
      return tubo("M" + q(a) + " L" + q(b) + " L" + q(c2) + " L" + q(d), 1.7) + tratto(linea(P(.29, -.41, 22), w), L, 2.2) +
        faccia(w, -1, cer(0, 0, 2.5, "#b23b26", bordo(L, .7)) + tratto("M-2,0 H2 M0,-2 V2", "#7a2213", .6) + cer(0, 0, .8, "#e9e2d0", bordo(L, .3)) + pth("M-1.8,-.9 A2,2 0 0 1 -.6,-2", "none", "stroke='#ffb3a3' stroke-width='.5'"));
    }
    function ventosa() {   // lo sturalavandini rosso col manico di legno
      var F = forma(-.36, .19, .072, .072, .072, 2), lv = [giro(F, 0, 1, 36), giro(F, 2.6, .94, 36), giro(F, 5.4, .42, 36)], sil = sagoma(lv);
      var r = corpo(lv, [[0, "#ff9a8a"], [.5, "#d9342b"], [1, "#7a1712"]], 1.4) + lucido(sil, .55, .45);
      var a0 = P(-.36, .19, 5), a1 = P(-.39, .155, 39);
      return r + tratto(linea(a0, a1), L, 3.6) + tratto(linea(a0, a1), "#c08a52", 2) + tratto(linea(a0, a1), "#f0c890", .6, "transform='translate(-.5 0)'") + ell(a1[0], a1[1], 1.4, .8, "#3a2a1c", bordo(L, .5));
    }
    function tazza() {
      var ba = forma(0, -.2, .12, .17, .17), die = forma(0, -.31, .165, .07, .07);
      var r = corpo([giro(ba, 3.5, 1.07, 40), giro(ba, 0, 1.12, 40)], CER_V, 2);   // il piede
      var lv = [giro(taz, 30), giro(die, 27, 1, 40), giro(taz, 21, .98), giro(ba, 9, 1.03, 40), giro(ba, 3, .98, 40)], sil = sagoma(lv), m = P(.06, .16, 15);
      r += corpo(lv, CER_V) + dentro(chiuso(sil), ell(m[0], m[1], 2.6, 4.6, "#cdb978", op(.22))) + lucido(sil, .7, .42);
      [G].forEach(function (k) { var b2 = P(k * .13, -.1, 1.8); r += ell(b2[0], b2[1], 1.5, .9, "#e4d9ba", bordo(L, .6)) + ell(b2[0] - .4, b2[1] - .3, .5, .3, "#ffffff", op(.8)); });   // il copribullone (quello dalla parte che si vede)
      var cern = [-1, 1].map(function (k) { var h = P(k * .095 + .006, -.252, 32.4); return ell(h[0], h[1] + .7, 3, 1.6, "#6f6c63", bordo(L, .7)) + ell(h[0], h[1], 2.6, 1.3, lin("cn", METALLO, 0, 0, 1, 1), bordo(L, .6)); }).join("");   // le cerniere (si vedono: il coperchio non c'è più)
      var top = giro(sed, 32.6), bp = giro(bu, 32.6);
      var tav = corpo([giro(sed, 29.5), top], [[0, "#fbf3d6"], [.6, "#e6dbb0"], [1, "#b3a476"]], 2) + pth(chiuso(top), sf([[0, "#fcf5dc"], [1, "#e0d3a5"]], 0, 0, 1, 1), bordo(L, 1.6));
      tav += tratto("M" + q(P(-.17, .12, 32.6)) + " L" + q(P(-.13, .11, 32.6)) + " L" + q(P(-.12, .14, 32.6)), "#8f8460", .5, op(.8));   // una crepa nella tavoletta
      tav += pth(chiuso(bp), "#b0a487", bordo(L, 1.3)) + dentro(chiuso(bp), pth(chiuso(sposta(bp, 2.4, 2.6)), rad("in", [[0, "#fffbee"], [.7, "#efe6cd"], [1, "#d2c5a3"]], .5, .55, .6)) +
        pth(chiuso(giro(acq, 25)), sf([[0, "#d4eef2"], [.6, "#94c9d5"], [1, "#5d9db0"]], 0, 0, 1, 1), bordo("#4a8aa0", .9)) +
        tratto("M" + q(P(-.05, .01, 25)) + " Q" + q(P(0, -.03, 25)) + " " + q(P(.05, -.02, 25)), "#ffffff", 1.2, op(.8))) + pth(chiuso(bp), "none", bordo(L, 1.3));
      return r + (G > 0 ? cern + tav : tav + cern);
    }
    return s + ordina([[vicino(0, -.36) - .05, cassetta()], [vicino(.29, -.41), tuboAcqua()], [vicino(-.36, .19), ventosa()], [vicino(0, -.03), tazza()]]);
  });

  // =========================================================
  //  LAVANDINO A COLONNA, scheggiato: ceramica ingiallita, il pezzo che manca sul bordo con la crepa,
  //  i rubinetti a croce consumati, la goccia che cade e l'alone, la saponetta ridotta a una fettina
  // =========================================================
  def("lavandino_colonna", { tipo: "piedi", nome: "Lavandino scheggiato", stanza: "bagno", fp: [1, 1], box: [-37, -76, 37, 22], dietro: true, piano: 53 }, function () {
    var s = ombra(5, 7, 32, 14), col = forma(0, -.27, .085, .075, .075, 2.2);
    var lvc = [giro(col, 0, 1.55, 40), giro(col, 2.4, 1.48, 40), giro(col, 6.5, 1.02, 40), giro(col, 20, .84, 40), giro(col, 33, .92, 40), giro(col, 40, 1.2, 40)];
    s += corpo(lvc, CER_V, 2.2) + lucido(sagoma(lvc), .6, .5);
    if (G < 0) {   // da dietro la colonna è aperta: si vede il sifone
      var bz = function (z, k) { return -.27 - .075 * k; }, sl = [P(-.04, bz(36, .95), 36), P(.04, bz(36, .95), 36), P(.05, bz(6, 1.05), 6), P(-.05, bz(6, 1.05), 6)];
      s += poly(sl, "#3d3428", bordo(L, .8)) + dentro(chiuso(sl), tubo("M" + q(P(0, -.3, 40)) + " L" + q(P(0, -.3, 22)) + " Q" + q(P(0, -.3, 17)) + " " + q(P(0, -.36, 18)) + " L" + q(P(0, -.5, 21)), 2.6, "#9b978c"));
    }
    var bac = forma(0, -.215, .3, .3, .2, 2.3); bac.eb = 7;   // davanti il bordo è largo: ci sta il bicchiere dello spazzolino (il piano è al centro della mattonella)
    var lvb = [giro(bac, 38.5, .45), giro(bac, 44, .86), giro(bac, 49.6, 1), giro(bac, 53, 1)], silb = sagoma(lvb), top = giro(bac, 53);
    s += corpo(lvb, CER_V, 2.3) + lucido(silb, .65, .5) + pth(chiuso(top), sf([[0, "#fffdf6"], [1, "#ece4cd"]], 0, 0, 1, 1), bordo(L, 1.6));
    var vas = forma(0, -.19, .215, .145, .1, 2.2); vas.eb = 3.2;
    var bp = giro(vas, 53), sc = P(0, -.17, 53), fr = P(0, -.25, 53);
    s += pth(chiuso(bp), "#a99d84", bordo(L, 1.4)) + dentro(chiuso(bp), pth(chiuso(sposta(bp, 2.6, 3.2)), rad("vf", [[0, "#fffbee"], [.65, "#ede4cc"], [1, "#cdbf9f"]], .5, .55, .6)) +
      tratto("M" + q(fr[0], fr[1] + 2) + " Q" + q((fr[0] + sc[0]) / 2 + 1, (fr[1] + sc[1]) / 2 + 2) + " " + q(sc), "#c07f3c", 2.4, op(.28)) +   // l'alone sotto il rubinetto che gocciola
      ell(sc[0], sc[1], 3.4, 1.7, "#a2622a", op(.3)) + ell(sc[0], sc[1], 3, 1.5, lin("sct", METALLO, 0, 0, 1, 1), bordo(L, .7)) + ell(sc[0] - .3, sc[1] - .3, 1.5, .7, "#4d4a42")) + pth(chiuso(bp), "none", bordo(L, 1.4));
    if (G > 0) {   // il pezzo che manca sul bordo davanti a destra, e la crepa che scende
      var pt = function (t, k, z) { var c = Math.cos(t), sn = Math.sin(t), e = 2.3, x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / e) * .3 * k, y = (sn < 0 ? -1 : 1) * Math.pow(Math.abs(sn), 2 / e) * .3 * k; return P(x, -.215 + y, z); };
      var T = Math.PI / 180, ch = [pt(28 * T, 1.005, 53), pt(34 * T, .9, 53), pt(41 * T, .93, 53), pt(48 * T, .89, 53), pt(55 * T, 1.005, 53), pt(52 * T, 1.005, 49.2), pt(45 * T, 1.003, 47.6), pt(36 * T, 1.005, 50.2)];
      s += pth(chiuso(ch), "#d8cba9", bordo(L, .8)) + dentro(chiuso(ch), cer(ch[2][0], ch[2][1] + 2, 1.6, "#b9ab86", op(.6)) + cer(ch[6][0] + 1, ch[6][1] - 1, 1, "#efe6cf", op(.8))) +
        tratto("M" + [ch[0], ch[1], ch[2], ch[3], ch[4]].map(function (x) { return q(x); }).join(" L"), "#8c7f62", .7) +
        tratto("M" + q(ch[6]) + " L" + q(pt(43 * T, .96, 45.6)) + " L" + q(pt(47 * T, .93, 44)) + " L" + q(pt(44 * T, .9, 42.2)), "#6b5f48", .6, op(.85));
    }
    function croce(a, b, colore) {   // un rubinetto a croce, cromo consumato, col bollino rosso o blu
      var base = P(a, b, 53), t = P(a, b, 57.6), r = ell(base[0], base[1] + .4, 3, 1.5, "#7d7a70", bordo(L, .6)) + ell(base[0], base[1], 2.7, 1.3, lin("fl", METALLO, 0, 0, 1, 1), bordo(L, .5)) + tubo(linea(base, t), 1.8);
      [[P(a - .038, b, 57.8), P(a + .038, b, 57.8)], [P(a, b - .038, 57.8), P(a, b + .038, 57.8)]].forEach(function (m) { r += tratto(linea(m[0], m[1]), L, 3.2) + tratto(linea(m[0], m[1]), "#cfcfc6", 1.6) + tratto(linea(m[0], m[1]), "#ffffff", .5, "transform='translate(-.3 -.4)'"); });
      return r + ell(t[0], t[1] - .3, 1.6, .9, colore, bordo(L, .5)) + cer(base[0] + 1.4, base[1] + .3, .6, "#b86a24", op(.6));
    }
    function canna() {   // la canna a gomito, con la goccia che cade
      var a = P(0, -.37, 53), b = P(0, -.37, 59.8), c2 = P(0, -.37, 62.4), d = P(0, -.335, 62.4), e = P(0, -.27, 62.2), f = P(0, -.255, 61.6), g = P(0, -.255, 59.6);
      var dd = "M" + q(a) + " L" + q(b) + " Q" + q(c2) + " " + q(d) + " L" + q(e) + " Q" + q(P(0, -.255, 62.2)) + " " + q(f) + " L" + q(g), x = g[0], y = g[1] + 3.8;
      return ell(a[0], a[1], 3, 1.5, "#9b9b91", bordo(L, .6)) + ell(a[0] - 1.9, a[1] + .7, 1.3, .55, "#eef2de", op(.9)) + ell(a[0] + 2, a[1] + .4, 1, .45, "#eef2de", op(.85)) + tubo(dd, 2.6) + ell(g[0], g[1] + .6, 1.3, .7, "#4a5560") +   // il calcare alla base
        pth("M" + q(x, y - 1.8) + " Q" + q(x + 1.1, y - .2) + " " + q(x, y + .5) + " Q" + q(x - 1.1, y - .2) + " " + q(x, y - 1.8) + " Z", "#a9daf3", bordo("#3b7ea8", .4)) + cer(x - .3, y - .3, .25, "#ffffff");
    }
    function saponetta() {   // la saponetta finita, ridotta a una fettina crepata
      var F = forma(.215, -.36, .036, .022, .022, 3), tp = giro(F, 54.2, 1, 24);
      return corpo([giro(F, 53, 1, 24), tp], [[0, "#e6f5d8"], [1, "#94bf82"]], .8) + pth(chiuso(tp), "#d6edc3", bordo(L, .6)) + tratto(linea(P(.2, -.37, 54.2), P(.225, -.352, 54.2)), "#7da66a", .4);
    }
    var dt = P(-.06, -.315, 53);   // una macchia di dentifricio sul bordo
    s += ell(dt[0], dt[1], 2.4, 1, "#d6f0e8", "stroke='#9cc8bb' stroke-width='.4' transform='rotate(-12 " + f1(dt[0]) + " " + f1(dt[1]) + ")'") + ell(dt[0] - .6, dt[1] - .3, .8, .3, "#ffffff", op(.9));
    return s + ordina([[vicino(-.13, -.37), croce(-.13, -.37, "#e03131")], [vicino(.13, -.37), croce(.13, -.37, "#339af0")], [vicino(0, -.37) + .001, canna()], [vicino(.215, -.36), saponetta()]]);
  });

  // =========================================================
  //  DOCCIA CON LA TENDA: il piatto vecchio scheggiato in un angolo di piastrelle anni '70 (una crepata, una che manca),
  //  il tubo a vista col soffione piccolo e il calcare, la tenda di plastica a bollicine su un'asta che si piega,
  //  con la muffa in fondo; la tenda davanti è tirata da una parte. Per terra il flacone a testa in giù, per le ultime gocce
  // =========================================================
  def("doccia_tenda", { tipo: "piedi", nome: "Doccia con la tenda", stanza: "bagno", fp: [1, 1], box: [-51, -169, 53, 30], dietro: true }, function () {
    var R = .47, ZB = 7.5, ZT = 142, ZR = 137.6, ZC = 135.6, s = ombra(5, 8, 50, 22, .9), SP = .045;
    s += blocco(-R, R, -R, R, 0, ZB, ceramicaV(), {
      davanti: function (W, H) { return pth("M" + q(W * .7, 0) + " L" + q(W * .73, 3.4) + " L" + q(W * .77, 2.2) + " L" + q(W * .8, 0) + " Z", "#d8cba9", "stroke='#8c7f62' stroke-width='.5'") + tratto("M" + q(W * .735, 3.3) + " l-.8,2.6 l.7,1.4", "#8c7f62", .45); }   // la scheggia del piatto
    }, 2.2);
    var m = .065, fondo = [Puv(-R + m, -R + m, ZB), Puv(R - m, -R + m, ZB), Puv(R - m, R - m, ZB), Puv(-R + m, R - m, ZB)], sc = P(-.13, .13, ZB);
    s += poly(fondo, sf([[0, "#d3c8ab"], [1, "#efe8d5"]], 0, 0, 1, 1), "stroke='#b2a68a' stroke-width='1'");
    s += ell(sc[0] + .6, sc[1] + .4, 7.4, 3.7, "#b4651e", op(.2)) + ell(sc[0], sc[1], 5.8, 2.9, lin("sc", METALLO, 0, 0, 1, 1), bordo(L, 1)) + tratto("M" + q(sc[0] - 3.2, sc[1]) + " L" + q(sc[0] + 3.2, sc[1]) + " M" + q(sc[0] - 2.2, sc[1] - 1.1) + " L" + q(sc[0] + 2.2, sc[1] - 1.1) + " M" + q(sc[0] - 2.2, sc[1] + 1.1) + " L" + q(sc[0] + 2.2, sc[1] + 1.1), "#5d5a52", .7);   // lo scarico, con l'alone di ruggine
    function piastrelle(tubi) {   // la parete di dentro: piastrelle color crema con la fascia a fiori; su quella di sinistra il miscelatore e il tubo a vista
      return function (W, H) {
        var r = rett(0, 0, W, H, 0, "#e3d7ba"), nc = 6, l = W / nc, x, y, i, j, kk = rnd(tubi ? 41 : 43);
        for (j = 0; j * l < H; j++) for (i = 0; i < nc; i++) {
          x = i * l; y = j * l;
          var deco = j === 6, manca = tubi && j === 10 && i === 1, crepa = tubi ? (j === 3 && i === 1) || (j === 9 && i === 4) : j === 4 && i === 2;
          if (manca) { r += rett(x, y, l, l, 0, "#a39c8e") + rett(x, y, l, 1.2, 0, "#000", op(.25)) + rett(x, y, 1, l, 0, "#000", op(.2)) + cer(x + l * .3, y + l * .6, .5, "#7e776a") + cer(x + l * .7, y + l * .3, .4, "#7e776a") + cer(x + l * .55, y + l * .75, .35, "#c5beb0"); continue; }   // la piastrella che manca
          var cc = deco ? "#e9c46a" : mix("#f1e7cc", "#e1d4b2", kk());
          r += rett(x + .3, y + .3, l - .6, l - .6, .6, cc) + rett(x + .9, y + .9, l * .5, .7, 0, "#ffffff", op(.6));
          if (deco) {   // il fiore anni '70
            var fx = x + l / 2, fy = y + l / 2, pe;
            for (pe = 0; pe < 4; pe++) { var an = pe * Math.PI / 2 + .785; r += ell(fx + Math.cos(an) * 1.9, fy + Math.sin(an) * 1.9, 1.7, 1.7, "#c8692a"); }
            r += cer(fx, fy, 1.2, "#6b3415") + cer(fx, fy, .45, "#f4d99a");
          }
          if (crepa) r += tratto("M" + q(x + l * .15, y + l * .2) + " L" + q(x + l * .45, y + l * .45) + " L" + q(x + l * .4, y + l * .62) + " L" + q(x + l * .8, y + l * .9), "#7e735c", .45);
        }
        for (i = 1; i < nc; i++) r += rett(i * l - .3, 0, .6, H, 0, "#b4a88a");
        for (y = l; y < H; y += l) r += rett(0, y - .3, W, .6, 0, y > H - 3 * l ? "#7f7b5e" : "#b4a88a");   // le fughe, in basso scurite dalla muffa
        for (i = 0; i < 28; i++) r += cer(kk() * W, H - kk() * 14, .4 + kk() * .7, "#6f7a52", op(.25));
        if (!tubi) return r;
        var px = W * .6, yM = H - 66, yA = ZT - 124;
        r += rett(px - 1.1, yA, 2.2, yM - yA, 1.1, lin("tb", METALLO, 0, 0, 1, 0), bordo(L, .7)) + rett(px - 2.2, yA + 14, 4.4, 2, .6, "#9b9b91", bordo(L, .5)) + rett(px - 2.2, yA + 40, 4.4, 2, .6, "#9b9b91", bordo(L, .5));   // il tubo a vista con le fascette
        r += rett(px - 10, yM - 1.6, 20, 3.4, 1.6, lin("mx", METALLO, 0, 0, 0, 1), bordo(L, .8)) + cer(px + 3, yM + 1, .6, "#b86a24", op(.7));   // il miscelatore
        [-1, 1].forEach(function (sg) { var cx = px + sg * 10; r += tratto("M" + q(cx - 3, yM) + " H" + f1(cx + 3) + " M" + q(cx, yM - 3) + " V" + f1(yM + 3), L, 2.4) + tratto("M" + q(cx - 3, yM) + " H" + f1(cx + 3) + " M" + q(cx, yM - 3) + " V" + f1(yM + 3), "#d0d0c8", 1.1) + cer(cx, yM, 1.1, sg < 0 ? "#e03131" : "#339af0", bordo(L, .4)); });
        return r + tratto("M" + q(W * .28, H - 58) + " h9 l-1.4,3.2 h-6.2 Z", "#9b9b91", .7) + ell(W * .28 + 4.5, H - 59, 3.2, 1.2, "#f3c9d6", bordo(L, .4));   // il portasapone di filo col sapone rosa
      };
    }
    function retroParete(W, H) {   // fuori: il pannello liscio, un po' macchiato
      var r = rett(2.5, 2.5, W - 5, H - 5, 1, "none", "stroke='#b3a98f' stroke-width='.8'");
      [[4.5, 4.5], [W - 4.5, 4.5], [4.5, H - 4.5], [W - 4.5, H - 4.5]].forEach(function (v) { r += cer(v[0], v[1], .8, "#9b9384"); });
      var onda = "M" + q(4, H - 9) + " Q" + q(W * .2, H - 13) + " " + q(W * .35, H - 9) + " T" + q(W * .65, H - 10) + " T" + q(W - 4, H - 8);
      return r + pth(onda + " V" + f1(H - 3) + " H4 Z", "#b7a77c", op(.16)) + tratto(onda, "#a8966a", .6, op(.4));   // in basso la riga dell'acqua passata sotto
    }
    var pareteC = [lin("ps", [[0, "#fbf6ea"], [1, "#e8dfc8"]], 0, 0, 1, 1), lin("pl", [[0, "#efe8d6"], [1, "#d8cdb2"]], 0, 0, 0, 1), lin("pd", [[0, "#c2b697"], [1, "#a2967a"]], 0, 0, 0, 1)];
    function pareteD() { return blocco(-R, R, -R, -R + SP, ZB, ZT, pareteC, { davanti: piastrelle(false), dietro: retroParete }, 2.4); }   // la parete di fondo (contro il muro)
    function pareteS() {   // la parete di sinistra, coi tubi; da fuori si vede il tubo che entra
      return blocco(-R, -R + SP, -R + SP, R, ZB, ZT, pareteC, { fianco: function (W, H) { return G > 0 ? piastrelle(true)(W, H) : retroParete(W, H) + tubo("M" + q(W * .4, H + 2) + " V" + f1(H - 64), 2.2) + ell(W * .4, H - 64, 2.4, 1.2, "#8d877a", bordo(L, .5)) +
        rett(W * .4 - 2.4, H - 22, 4.8, 2.2, .6, "#8d877a", bordo(L, .5)) + rett(W * .4 - 2.4, H - 48, 4.8, 2.2, .6, "#8d877a", bordo(L, .5)) + cer(W * .4 + 1.6, H - 34, .7, "#b86a24", op(.7)); } }, 2.4);   // da fuori: il tubo con le fascette e un po' di ruggine
    }
    function soffione() {   // il braccio e il soffione piccolo, col calcare
      var a0 = P(-R + SP, -.08, 124), a1 = P(-.27, -.08, 122.6), hc = P(-.24, -.08, 119.6), r = tubo("M" + q(a0) + " L" + q(a1), 2.2), i2, dots = "";
      for (i2 = 0; i2 < 9; i2++) dots += cer((i2 % 3 - 1) * 1.5, .9 + (Math.floor(i2 / 3) - 1) * .55, .28, "#5d5a52");
      r += ell(a0[0], a0[1], 2.2, 2.6, "#9b9b91", bordo(L, .6)) + "<g transform='translate(" + f1(hc[0]) + " " + f1(hc[1]) + ")'>" + pth("M-1.8,-3.4 L1.8,-3.4 L4.4,1 L-4.4,1 Z", lin("so", METALLO, 0, 0, 1, 0), bordo(L, .9)) + ell(0, 1.1, 4.4, 1.8, "#c4c4ba", bordo(L, .9)) + dots + ell(-2.2, 1.2, 1.3, .6, "#f2f0e2", op(.85)) + ell(2.4, .8, .9, .45, "#e7ecd8", op(.8)) + "</g>";
      var x = hc[0] + .6, y = hc[1] + 6;
      return r + pth("M" + q(x, y - 1.6) + " Q" + q(x + 1, y - .2) + " " + q(x, y + .4) + " Q" + q(x - 1, y - .2) + " " + q(x, y - 1.6) + " Z", "#a9daf3", bordo("#3b7ea8", .4));   // la goccia
    }
    function flacone() {   // lo shampoo a testa in giù sul tappo, per le ultime gocce
      var ca = -.3, cb = .02, F = forma(ca, cb, .036, .024, .024, 3.2), tp = forma(ca, cb, .022, .016, .016, 2), o = P(ca, cb, 0);
      return corpo([giro(tp, ZB, 1, 20), giro(tp, ZB + 2.2, 1, 20)], [[0, "#ffffff"], [1, "#9a9a92"]], .9) + corpo([giro(F, ZB + 2.2, .7, 24), giro(F, ZB + 4.4, 1, 24), giro(F, ZB + 14, 1, 24)], [[0, "#ffd0dc"], [.5, "#f06595"], [1, "#a61e4d"]], 1.3) +
        pth(chiuso(giro(F, ZB + 14, 1, 24)), "#ffd7e2", bordo(L, .8)) + dentro(chiuso(sagoma([giro(F, ZB + 4.4, 1, 24), giro(F, ZB + 14, 1, 24)])), rett(o[0] - 3, P(ca, cb, ZB + 11)[1], 6, 3.4, 0, "#ffffff", op(.75)));
    }
    // la tenda: un pezzo largo Wt e alto Ht (dall'asta in giù); fitta = raccolta da una parte; buchi = gli anelli che mancano (lì l'orlo pende)
    function tela(Wt, Ht, seme, fitta, buchi) {
      var kr = rnd(seme), per = fitta ? 2.4 : 6.2, n = Math.max(2, Math.round(Wt / per)), stops = [], i2, x, passo = 5.4, na = Math.max(2, Math.round(Wt / passo)), xs = [];
      for (i2 = 0; i2 <= n; i2++) stops.push([f1(i2 / n), i2 % 2 ? (fitta ? "#b4c3c9" : "#c4d0d5") : "#eef3f4"]);
      for (i2 = 0; i2 < na; i2++) xs.push((i2 + .5) * Wt / na);
      function y0(xx) {   // l'orlo di sopra: dritto, ma pende dove mancano gli anelli
        var yy = 1;
        (buchi || []).forEach(function (bi) { var xa = bi > 0 ? xs[bi - 1] : 0, xb = bi < na - 1 ? xs[bi + 1] : Wt; if (xx > xa && xx < xb) yy = Math.max(yy, 1 + 4.2 * Math.sin(Math.PI * (xx - xa) / (xb - xa))); });
        return yy;
      }
      var d = "M0," + f1(y0(0));
      for (x = .5; x <= Wt; x += .5) d += " L" + q(x, y0(x));
      for (x = Wt; x >= 0; x -= .5) d += " L" + q(x, Ht + Math.sin(x / per * Math.PI) * (fitta ? 1.2 : .9));
      d += " Z";
      var muffa = "", bolle = "";
      for (i2 = 0; i2 < (fitta ? 6 : 16); i2++) muffa += cer(kr() * Wt, Ht - 2 - kr() * 16 * kr(), .4 + kr() * .9, kr() < .5 ? "#7d8f5a" : "#5f6e44", op(.3 + kr() * .2));
      for (i2 = 0; i2 < Wt * Ht / 90; i2++) { var bx = kr() * Wt, by = 6 + kr() * (Ht - 12), br = .9 + kr() * 1.8; bolle += cer(bx, by, br, "none", "stroke='#8fc3dc' stroke-width='.45' opacity='.45'") + cer(bx - br * .35, by - br * .35, br * .28, "#ffffff", op(.6)); }   // le bollicine stampate, sbiadite
      var sporco = lin("sp", [[0, "#9a8f62", 0], [1, "#9a8f62", .3]], 0, Ht - 34, 0, Ht, true);
      var corpoT = pth(d, lin("te", stops, 0, 0, Wt, 0, true)) + dentro(d, bolle + rett(0, Ht - 34, Wt, 36, 0, sporco) + muffa + rett(0, 0, Wt, 4, 0, "#ffffff", op(.25)) + rett(0, 3.4, Wt, .5, 0, "#9fb0b7", op(.6))) + pth(d, "none", bordo(L, 1.1));
      var anelli = "";
      xs.forEach(function (xx, bi) { if ((buchi || []).indexOf(bi) < 0) anelli += ell(xx, .2, 1.2, 1.9, "none", "stroke='" + L + "' stroke-width='1.1'") + ell(xx, .2, 1.2, 1.9, "none", "stroke='#f4f4ee' stroke-width='.5'"); });
      return { t: corpoT, a: anelli };
    }
    var Ht = ZC - 9.5, aS = -R + SP, aD = R - .02, bF = R - .02, bP = -R + SP;
    var tD = tela((bF - bP) * 61, Ht, 5, false, [3, 4]), tF = tela(.26 * 61, Ht, 7, true, []);
    var destra = function (x) { return piattoU(bP, bF, aD, ZC, x); }, davanti = function (x) { return piattoV(aS, aS + .26, bF, ZC, x); };
    function asta() {   // l'asta a L della tenda, un po' piegata in mezzo, con la ruggine
      var c1 = P(aS, bF, ZR), c2 = P(aD, bF, ZR), c3 = P(aD, bP, ZR), mm = P(0, bF, ZR - 4.6), r;
      r = tubo("M" + q(c1) + " Q" + q(mm) + " " + q(c2) + " L" + q(c3), 1.8);
      [[.18, bF, 2], [aD, .05, 0]].forEach(function (v) { var o = P(v[0], v[1], ZR - v[2]); r += cer(o[0], o[1], .8, "#b4651e", op(.8)); });
      return r + [c1, c3].map(function (o) { return ell(o[0], o[1], 2.2, 1.4, "#9b9b91", bordo(L, .6)); }).join("");
    }
    if (G > 0) s += pareteD() + pareteS() + soffione() + flacone() + destra(tD.t) + davanti(tF.t) + asta() + destra(tD.a) + davanti(tF.a);
    else s += destra(tD.t) + davanti(tF.t) + flacone() + asta() + destra(tD.a) + davanti(tF.a) + pareteS() + pareteD();
    return s;
  });

  // =========================================================
  //  DA PARETE (62 × 200, di fronte): lo specchio scheggiato e il poster strappato
  // =========================================================
  def("specchio_scheggiato", { tipo: "parete", nome: "Specchio scheggiato", stanza: "bagno" }, function () {
    var x0 = 15, x1 = 47, y0 = 54, y1 = 98, gx0 = x0 + 3.2, gy0 = y0 + 3.2, gx1 = x1 - 3.2, gy1 = y1 - 3.2, k = rnd(13), i, s = "";
    s += rett(x0 + 2.2, y0 + 3, x1 - x0, y1 - y0, 2, "#000", op(.15));   // l'ombra sul muro
    s += rett(x0, y0, x1 - x0, y1 - y0, 2, sf([[0, "#bcb19b"], [.5, "#9a8f7a"], [1, "#726754"]], 0, 0, 1, 1), bordo(L, 1.8));   // la cornice di plastica color tortora
    for (i = 0; i < 6; i++) { var px = x0 + k() * (x1 - x0), py = k() < .5 ? y0 + .6 + k() * 2 : y1 - 2.6 + k() * 2; s += ell(px, py, .7 + k() * .8, .4 + k() * .3, "#e2dccd", op(.75)); }   // la vernice che salta
    s += rett(gx0, gy0, gx1 - gx0, gy1 - gy0, 0, "#5f5546");   // il fondo che si vede dove manca il vetro
    var v = "M" + q(gx0, gy0) + " H" + f1(gx1) + " V" + f1(gy1 - 9) + " L" + q(gx1 - 2.2, gy1 - 6.6) + " L" + q(gx1 - 3.6, gy1 - 4.4) + " L" + q(gx1 - 6.2, gy1 - 2.8) + " L" + q(gx1 - 8.5, gy1) + " H" + f1(gx0) + " Z";
    var macchie = "";
    for (i = 0; i < 9; i++) macchie += ell(gx0 + k() * 5, gy1 - k() * 12, 1 + k() * 1.8, .8 + k() * 1.4, "#4f4b40", op(.22 + k() * .2));   // l'argento che se ne va negli angoli
    for (i = 0; i < 5; i++) macchie += ell(gx1 - k() * 6, gy0 + k() * 4, .8 + k() * 1.4, .6 + k() * 1, "#4f4b40", op(.2 + k() * .15));
    for (i = 0; i < 11; i++) macchie += cer(gx0 + 7 + k() * 12, gy1 - 3 - k() * 9, .25 + k() * .5, k() < .6 ? "#ffffff" : "#d4f0e6", op(.85));   // gli schizzi di dentifricio
    s += pth(v, sf([[0, "#e6f1f2"], [.55, "#bfd6db"], [1, "#97b3bb"]], 0, 0, .4, 1), bordo(L, .9)) + dentro(v, macchie +
      poly([[gx0 + 4, gy0], [gx0 + 11, gy0], [gx0, gy0 + 17], [gx0, gy0 + 7]], "#ffffff", op(.55)) + poly([[gx0 + 15, gy0], [gx0 + 18, gy0], [gx0, gy0 + 28], [gx0, gy0 + 24]], "#ffffff", op(.35)) +
      tratto("M" + q(gx1 - 4.6, gy1 - 5.2) + " L" + q(gx1 - 8.4, gy1 - 11.2) + " L" + q(gx1 - 10.2, gy1 - 18.4) + " L" + q(gx1 - 15.6, gy1 - 23.4) + " L" + q(gx1 - 17.2, gy1 - 30.4) + " M" + q(gx1 - 10.2, gy1 - 18.4) + " L" + q(gx1 - 4, gy1 - 22) + " M" + q(gx1 - 8.4, gy1 - 11.2) + " L" + q(gx1 - 14.4, gy1 - 10.2), "#ffffff", .7, op(.95)) +
      tratto("M" + q(gx1 - 4.2, gy1 - 4.6) + " L" + q(gx1 - 8, gy1 - 10.6) + " L" + q(gx1 - 9.8, gy1 - 17.8) + " L" + q(gx1 - 15.2, gy1 - 22.8) + " L" + q(gx1 - 16.8, gy1 - 29.8), "#4f6a73", .4, op(.7))) +   // la crepa
      pth(v, "none", bordo(L, .9));
    s += "<g transform='rotate(38 " + f1(gx1 - 11) + " " + f1(gy1 - 16) + ")'>" + rett(gx1 - 16, gy1 - 17.6, 10, 3.2, .3, "#f1e2a6", op(.75)) + rett(gx1 - 16, gy1 - 17.6, 10, .7, 0, "#ffffff", op(.5)) + "</g>";   // lo scotch sulla crepa
    return s + [[x0 + 2, y0 + 2], [x1 - 2, y0 + 2]].map(function (v2) { return cer(v2[0], v2[1], .9, "#d7d2c4", bordo(L, .4)) + tratto("M" + q(v2[0] - .5, v2[1]) + " h1", L, .3); }).join("");   // le due viti
  });

  def("poster_strappato", { tipo: "parete", nome: "Poster strappato", stanza: "camera" }, function () {
    var x0 = 14, x1 = 48, y0 = 48, y1 = 96, k = rnd(19), i, s = "", f = 9;
    var carta = "M" + q(x0, y0) + " H" + f1(x1) + " V" + f1(y1 - f) + " L" + q(x1 - f, y1) + " H" + f1(x0) + " V" + f1(y1 - 17) + " L" + q(x0 + 2.8, y1 - 18.6) + " L" + q(x0 + 1.2, y1 - 20.4) + " L" + q(x0 + 3.4, y1 - 22.6) + " L" + q(x0, y1 - 24.6) + " Z";
    s += pth(carta, "#000", "opacity='.15' transform='translate(2 2.6)'");   // l'ombra sul muro
    var cielo = sf([[0, "#3d2c8f"], [.35, "#6c5ce7"], [.62, "#c44ab0"], [1, "#e84393"]], 0, 0, 0, 1), cx = x0 + 17, cy = y0 + 21, sole = "", st = "";
    for (i = 0; i < 14; i++) st += cer(x0 + 2 + k() * 30, y0 + 2 + k() * 14, .25 + k() * .45, "#ffffff", op(.5 + k() * .4));   // le stelline
    sole = cer(cx, cy, 10.5, sf([[0, "#fff3a0"], [.5, "#ffd43b"], [1, "#ff8a3d"]], 0, 0, 0, 1));
    for (i = 0; i < 4; i++) sole += rett(cx - 11, cy + 2 + i * 2.4, 22, .9 + i * .3, 0, "#c44ab0");   // le righe del sole al tramonto
    var monti = pth("M" + q(x0, y0 + 30) + " L" + q(x0 + 7, y0 + 23) + " L" + q(x0 + 12, y0 + 27) + " L" + q(x0 + 20, y0 + 20) + " L" + q(x0 + 28, y0 + 28) + " L" + q(x1, y0 + 24) + " V" + f1(y0 + 33) + " H" + f1(x0) + " Z", "#2a1858");
    var griglia = rett(x0, y0 + 31, x1 - x0, 9, 0, "#24124a");
    for (i = 0; i <= 8; i++) griglia += tratto("M" + q(cx + (i - 4) * 1.4, y0 + 31) + " L" + q(cx + (i - 4) * 7, y0 + 40), "#ff6bd6", .35, op(.8));
    for (i = 0; i < 4; i++) griglia += tratto("M" + q(x0, y0 + 32 + i * i * .7 + i) + " H" + f1(x1), "#ff6bd6", .35, op(.8));
    var titolo = rett(x0, y0 + 40, x1 - x0, 9, 0, "#1b0d36") + rett(x0 + 5, y0 + 41.8, 24, 2.6, .8, "#ffffff", op(.92)) + rett(x0 + 9, y0 + 45.4, 16, 1.2, .5, "#ffd43b", op(.85));   // il titolo
    var pieghe2 = tratto("M" + q(x0, y0 + 24) + " H" + f1(x1), "#ffffff", .5, op(.35)) + tratto("M" + q(x0, y0 + 24.6) + " H" + f1(x1), "#000", .4, op(.18)) + tratto("M" + q(x0 + 17, y0) + " V" + f1(y1), "#ffffff", .5, op(.3)) + tratto("M" + q(x0 + 17.6, y0) + " V" + f1(y1), "#000", .4, op(.16));   // le pieghe: era piegato in quattro
    s += pth(carta, cielo) + dentro(carta, st + sole + monti + griglia + titolo + pieghe2 + rett(x0, y0, x1 - x0, y1 - y0, 0, "#fff6e0", op(.1))) + pth(carta, "none", bordo(L, 1.2));
    s += pth("M" + q(x1, y1 - f) + " L" + q(x1 - f, y1) + " L" + q(x1 - f + 1.6, y1 - f + 1.2) + " Z", "#000", op(.18)) + pth("M" + q(x1, y1 - f) + " L" + q(x1 - f, y1) + " L" + q(x1 - f, y1 - f) + " Z", sf([[0, "#efe8f6"], [1, "#b8a6d9"]], 0, 0, 1, 1), bordo(L, .9));   // l'angolo piegato in avanti (si vede il retro bianco)
    s += "<g transform='rotate(-22 " + f1(x0 + 1) + " " + f1(y0 + 1) + ")'>" + rett(x0 - 3.4, y0 - 1.6, 9, 3.4, .3, "#f1e2a6", op(.8)) + rett(x0 - 3.4, y0 - 1.6, 9, .8, 0, "#ffffff", op(.45)) + "</g>";   // lo scotch ingiallito
    s += "<g transform='rotate(18 " + f1(x1 - 1) + " " + f1(y0 + 1) + ")'>" + rett(x1 - 5.6, y0 - 1.6, 9, 3.4, .3, "#f1e2a6", op(.8)) + rett(x1 - 5.6, y0 - 1.6, 9, .8, 0, "#ffffff", op(.45)) + "</g>";
    return "<g transform='translate(31 72) scale(1.12) translate(-31 -72)'>" + s + "</g>";   // un po' più grande, come un poster vero
  });

  // =========================================================
  function svgPiatto(w, h, c) { return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " " + h + "' width='" + w + "' height='" + h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + c + "</svg>"; }
  function misure(d) { if (d.tipo === "parete") return { w: 62, h: 200 }; var b = d.box; return { w: b[2] - b[0], h: b[3] - b[1], ax: -b[0], ay: -b[1] }; }
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: d.stanza, w: m.w, h: m.h, fp: (d.fp || [1, 1]).slice(), prezzo: 0, qual: 0 };   // la roba di partenza: non costa niente
      if (d.tipo !== "parete") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.piano) o.piano = d.piano;
      if (d.azione) o.azione = d.azione;
      if (d.testa) { var t = Puv(d.testa[0], d.testa[1], d.testa[2]); o.cuscino = [Math.round(m.ax + t[0]), Math.round(m.ay + t[1])]; }   // dove va la testa di chi dorme (nel disegno davanti)
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "mcs" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1;
      var c; try { c = d.fn(opz); } finally { G = 1; }
      if (d.tipo === "parete") return svgPiatto(m.w, m.h, c);
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

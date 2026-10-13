/* =========================================================
   SPeeD GAME — I MATERIALI DEL CASINÒ (si aggiungono a SGKit)
   Stesso contratto di js/costruzioni-arte.js (va caricato dopo):
   - muri: pezzo 62 × 200 che si ripete in orizzontale (una campata per pezzo: le lesene e le cornici
     stanno a metà sui due bordi, così messe in fila si chiudono da sole)
   - pavimenti: quadrato 100 × 100 che si ripete nei due versi (il disegno si stende 3 × 3 volte, così
     quello che esce da un bordo rientra dall'altro)
   - porte: 62 × 200 trasparente attorno; opz.notte: vetri accesi
   Modello: il Casinò di Monte-Carlo (damaschi, boiserie, marmi, stucchi dorati) e la moquette dei casinò.
   ========================================================= */
(function () {
  "use strict";
  var K = window.SGKit;
  if (!K) return;

  // ---------- attrezzi (copiati dal kit, il prefisso degli id è diverso) ----------
  var nId = 0, P = "", DEFS = [], FATTI = {}, PRONTI = {};
  var SEGNO = "§q§";
  var L = "#5a3a22", MW = 62, MH = 200;
  var OR = { l: "#fff4c8", a: "#f3d070", m: "#d4a43f", s: "#9a6a17", c: "#5e3d06" };   // l'oro: luce, chiaro, pieno, ombra, contorno
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f2(n) { return Math.round(n * 100) / 100; }
  function q(x, y) { return f2(x) + "," + f2(y); }
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  function scegli(r, a) { return a[Math.floor(r() * a.length) % a.length]; }
  function at(x) { return x ? " " + x : ""; }
  function op(o) { return "opacity='" + f2(o) + "'"; }
  function rett(x, y, w, h, fill, x2) { return "<rect x='" + f2(x) + "' y='" + f2(y) + "' width='" + f2(w) + "' height='" + f2(h) + "' fill='" + fill + "'" + at(x2) + "/>"; }
  function pth(d, fill, x2) { return "<path d='" + d + "' fill='" + fill + "'" + at(x2) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f2(x) + "' cy='" + f2(y) + "' r='" + f2(r) + "' fill='" + fill + "'" + at(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f2(x) + "' cy='" + f2(y) + "' rx='" + f2(rx) + "' ry='" + f2(ry) + "' fill='" + fill + "'" + at(x2) + "/>"; }
  function tratto(d, c, w, x2) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f2(w) + "' stroke-linecap='round' stroke-linejoin='round'" + at(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + (w || 2.5) + "' stroke-linejoin='round'"; }
  function sposta(dx, dy, corpo) { return "<g transform='translate(" + f2(dx) + " " + f2(dy) + ")'>" + corpo + "</g>"; }
  function gira(a, cx, cy, corpo) { return "<g transform='rotate(" + f2(a) + " " + f2(cx) + " " + f2(cy) + ")'>" + corpo + "</g>"; }
  function rq(x, y, w, h) { return "<rect x='" + f2(x) + "' y='" + f2(y) + "' width='" + f2(w) + "' height='" + f2(h) + "'/>"; }
  function sfum(tag, nome, stops, a) {
    var id = P + nome;
    if (!FATTI[id]) {
      FATTI[id] = 1;
      DEFS.push("<" + tag + " id='" + id + "' " + a + ">" + stops.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join("") + "</" + tag + ">");
    }
    return "url(#" + id + ")";
  }
  function lin(nome, stops, x1, y1, x2, y2) { return sfum("linearGradient", nome, stops, "x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "'"); }
  function rad(nome, stops, cx, cy, r) { return sfum("radialGradient", nome, stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function clip(nome, forme) { var id = P + nome; if (!FATTI[id]) { FATTI[id] = 1; DEFS.push("<clipPath id='" + id + "'>" + forme + "</clipPath>"); } return "clip-path='url(#" + id + ")'"; }
  function dentro(nome, forma, corpo) { return "<g " + clip(nome, forma) + ">" + corpo + "</g>"; }
  // il disegno pronto: si fa una volta sola, poi a ogni chiamata cambia solo il prefisso degli id
  function svg(chiave, w, h, corpo) {
    if (!PRONTI[chiave]) {
      DEFS = []; FATTI = {}; P = SEGNO;
      var b = corpo();
      PRONTI[chiave] = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 " + w + " " + h + "' width='" + w + "' height='" + h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + b + "</svg>";
    }
    return PRONTI[chiave].split(SEGNO).join("kc" + (++nId) + "_");
  }
  // pavimento: il motivo si stende 3 × 3 volte (quello che esce da un bordo rientra dall'altro)
  function piastrella(nome, corpo) {
    DEFS.push("<g id='" + P + nome + "'>" + corpo + "</g>");
    var s = "", i, j;
    for (j = -1; j <= 1; j++) for (i = -1; i <= 1; i++) s += "<use xlink:href='#" + P + nome + "' x='" + i * 100 + "' y='" + j * 100 + "'/>";
    return s;
  }
  function puntini(a, col, w, o) {
    if (!a.length) return "";
    return "<path d='" + a.map(function (v) { return "M" + q(v[0], v[1]) + "h.01"; }).join("") + "' fill='none' stroke='" + col + "' stroke-width='" + w + "' stroke-linecap='round'" + (o != null ? " " + op(o) : "") + "/>";
  }
  function granelli(n, W, H, seme, col, w, o, dueVersi) {
    var r = rnd(seme), a = [], i;
    for (i = 0; i < n; i++) {
      var x = r() * W, y = r() * H;
      a.push([x, y]);
      if (x < w) a.push([x + W, y]); if (x > W - w) a.push([x - W, y]);
      if (dueVersi) { if (y < w) a.push([x, y + H]); if (y > H - w) a.push([x, y - H]); }
    }
    return puntini(a, col, w, o);
  }
  function venature(x, y, w, h, c, seme, n, vert, forza) {   // le linee del legno dentro un riquadro
    var r = rnd(seme), s = "", i, f = forza || 1;
    for (i = 0; i < n; i++) {
      var a = (r() - .5) * 2.6, b = (r() - .5) * 2.6, t = r(), o = (.18 + r() * .2) * f, w2 = .45 + r() * .4, scur = r() < .75;
      var col = scur ? scuro(c, .32) : chiaro(c, .3);
      if (vert) { var xx = x + 1 + t * (w - 2); s += tratto("M" + q(xx, y + 1) + " C" + q(xx + a, y + h * .33) + " " + q(xx + b, y + h * .66) + " " + q(xx + (a + b) * .3, y + h - 1), col, w2, op(o)); }
      else { var yy = y + 1 + t * (h - 2); s += tratto("M" + q(x + 1, yy) + " C" + q(x + w * .33, yy + a * .5) + " " + q(x + w * .66, yy + b * .5) + " " + q(x + w - 1, yy + (a + b) * .15), col, w2, op(o)); }
    }
    return s;
  }
  function riquadro(x, y, w, h, c, b) {   // un pannello in rilievo: smussi chiari in alto a sinistra, scuri in basso a destra
    b = b || 2.4;
    return rett(x, y, w, h, scuro(c, .2), bordo(scuro(c, .5), .8)) +
      pth("M" + q(x, y) + " L" + q(x + w, y) + " L" + q(x + w - b, y + b) + " L" + q(x + b, y + b) + " Z", chiaro(c, .3)) +
      pth("M" + q(x, y) + " L" + q(x + b, y + b) + " L" + q(x + b, y + h - b) + " L" + q(x, y + h) + " Z", chiaro(c, .16)) +
      pth("M" + q(x, y + h) + " L" + q(x + b, y + h - b) + " L" + q(x + w - b, y + h - b) + " L" + q(x + w, y + h) + " Z", scuro(c, .3)) +
      pth("M" + q(x + w, y) + " L" + q(x + w, y + h) + " L" + q(x + w - b, y + h - b) + " L" + q(x + w - b, y + b) + " Z", scuro(c, .18)) +
      rett(x + b, y + b, w - 2 * b, h - 2 * b, c);
  }

  // ---------- l'oro ----------
  function oroV() { return lin("orv", [[0, OR.l], [.28, OR.a], [.65, OR.m], [1, OR.s]], 0, 0, 0, 1); }   // per le fasce orizzontali
  function oroH() { return lin("orh", [[0, OR.l], [.3, OR.a], [.7, OR.m], [1, OR.s]], 0, 0, 1, 0); }    // per i listelli in piedi
  function oroP() { return rad("orp", [[0, "#fffbe6"], [.35, OR.a], [.8, OR.m], [1, OR.s]], .35, .3, .75); }   // perline e borchie
  function filetto(y, h) {   // un listello d'oro orizzontale
    return rett(0, y, MW, h, oroV()) + rett(0, y, MW, .5, "#fff", op(.75)) + rett(0, y + h - .45, MW, .45, OR.c, op(.75));
  }
  function perline(y, r) {   // fila di perline dorate: 20 per pezzo, combaciano sul bordo
    r = r || 1.2;
    var s = rett(0, y - r * .9, MW, r * 1.8, scuro(OR.m, .45)), x;
    for (x = 1.55; x < MW; x += 3.1) s += cer(x, y, r, oroP());
    return s;
  }
  function dentelli(y, h, c) {   // i dentelli della cornice (16 per pezzo)
    var s = rett(0, y, MW, h, scuro(c, .4)), x;
    for (x = .7; x < MW; x += 3.875) s += rett(x, y, 2.5, h, lin("dt" + c.slice(1), [[0, chiaro(c, .35)], [1, scuro(c, .1)]], 0, 0, 0, 1)) + rett(x + 2.5, y, .5, h, "#000", op(.25));
    return s;
  }
  function ombraSotto(y, h, o) { return rett(0, y, MW, h, lin("os" + Math.round(o * 100), [[0, "#000", o], [1, "#000", 0]], 0, 0, 0, 1)); }
  // la cornice in cima al muro (cimasa): fascia, listello d'oro, guscio in ombra, perline, listello
  function cornicione(c, conDentelli) {
    var s = rett(0, 0, MW, 3.6, lin("cc" + c.slice(1), [[0, chiaro(c, .25)], [1, c]], 0, 0, 0, 1)) + filetto(3.6, 2.2);
    s += rett(0, 5.8, MW, 5.2, lin("cg" + c.slice(1), [[0, scuro(c, .5)], [.55, scuro(c, .12)], [1, chiaro(c, .22)]], 0, 0, 0, 1));
    if (conDentelli) s += dentelli(6.6, 3.4, c);
    s += perline(12.2, 1.15) + filetto(13.4, 1.8);
    return s + rett(0, 15.2, MW, .5, L, op(.55)) + ombraSotto(15.7, 6, .3);
  }
  // una cornice d'oro con gli angoli rientranti (come nei saloni Belle Époque)
  function cornicePannello(x, y, w, h, r, sp) {
    sp = sp || 1.8;
    var d = "M" + q(x + r, y) + " L" + q(x + w - r, y) + " A" + r + "," + r + " 0 0 0 " + q(x + w, y + r) + " L" + q(x + w, y + h - r) + " A" + r + "," + r + " 0 0 0 " + q(x + w - r, y + h) +
      " L" + q(x + r, y + h) + " A" + r + "," + r + " 0 0 0 " + q(x, y + h - r) + " L" + q(x, y + r) + " A" + r + "," + r + " 0 0 0 " + q(x + r, y) + " Z";
    return sposta(.7, .9, pth(d, "none", "stroke='#000' stroke-width='" + f2(sp + .6) + "' opacity='.22'")) +   // l'ombra sul muro
      pth(d, "none", "stroke='" + OR.c + "' stroke-width='" + f2(sp + 1) + "' stroke-linejoin='round'") + pth(d, "none", "stroke='" + OR.m + "' stroke-width='" + f2(sp) + "' stroke-linejoin='round'") +
      sposta(-.35, -.35, pth(d, "none", "stroke='" + OR.l + "' stroke-width='" + f2(sp * .38) + "' stroke-linejoin='round' opacity='.85'"));
  }
  function rosetta(x, y, r) {   // una piccola rosa d'oro
    var s = "", i;
    for (i = 0; i < 6; i++) { var a = i * Math.PI / 3; s += cer(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .48, OR.m, bordo(OR.c, .4)); }
    return s + cer(x, y, r * .45, oroP(), bordo(OR.c, .4)) + cer(x - r * .2, y - r * .2, r * .15, "#fff", op(.8));
  }

  // ---------- il marmo ----------
  function nuvole(x, y, w, h, r, cC, cS, n, rMin, rMax, o) {   // macchie morbide dentro un riquadro (poi ritagliate)
    var gC = rad("nz" + cC.slice(1), [[0, cC, 1], [1, cC, 0]], .5, .5, .5), gS = rad("nz" + cS.slice(1), [[0, cS, 1], [1, cS, 0]], .5, .5, .5), s = "", i;
    for (i = 0; i < n; i++) { var rx = rMin + r() * (rMax - rMin); s += ell(x + r() * w, y + r() * h, rx, rx * (.4 + r() * .4), r() < .5 ? gC : gS, op(o * (.5 + r() * .5))); }
    return s;
  }
  function vene(x, y, w, h, r, col, n, o, grossa) {   // le vene: lunghe, morbide, in diagonale, con l'alone e i rametti
    var s = "", k, j;
    for (k = 0; k < n; k++) {
      var a = [x - 3, y + r() * h * .8], b = [x + w + 3, a[1] + h * (.15 + r() * .6)], c1 = [x + w * .33, a[1] + (r() - .35) * h * .5], c2 = [x + w * .66, b[1] - (r() - .35) * h * .5];
      var d = "M" + q(a[0], a[1]) + " C" + q(c1[0], c1[1]) + " " + q(c2[0], c2[1]) + " " + q(b[0], b[1]), oo = o * (.6 + r() * .4);
      s += tratto(d, col, (grossa || 1) * 3.4, op(oo * .16)) + tratto(d, col, (grossa || 1) * (.45 + r() * .55), op(oo));
      for (j = 0; j < 2; j++) {
        var t = .15 + r() * .7, u = 1 - t, px = u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], py = u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1];
        var lg = Math.min(w, h) * (.15 + r() * .3), an = (r() < .5 ? -1 : 1) * (.4 + r() * .8);
        s += tratto("M" + q(px, py) + " q" + q(lg * .5, lg * an * .25) + " " + q(lg, lg * an * .6), col, .35, op(oo * .75));
      }
    }
    return s;
  }
  // una lastra di marmo: fondo, nuvole, vene, la lucidatura; m = { c, cC, cS, vene: [[col, n, o]], lucido }
  function lastra(nome, x, y, w, h, m, seme) {
    var r = rnd(seme), t = rett(x, y, w, h, m.c) + nuvole(x, y, w, h, r, m.cC, m.cS, m.nuv || 6, Math.min(w, h) * .25, Math.max(w, h) * .45, .55);
    m.vene.forEach(function (v) { t += vene(x, y, w, h, r, v[0], v[1], v[2], v[3]); });
    if (m.lucido) t += rett(x, y, w, h, lin("lu" + Math.round(m.lucido * 10), [[0, "#fff", .45 * m.lucido], [.35, "#fff", .06], [.7, "#000", 0], [1, "#000", .1 * m.lucido]], 0, 0, .7, 1)) +
      pth("M" + q(x + w * .55, y) + " L" + q(x + w * .75, y) + " L" + q(x, y + h * .75) + " L" + q(x, y + h * .55) + " Z", "#fff", op(.1 * m.lucido));   // il riflesso largo
    return dentro(nome, rq(x, y, w, h), t);
  }
  var CREMA = { c: "#efe3cb", cC: "#fbf5e8", cS: "#dccaa6", vene: [["#b59a6c", 3, .55], ["#c9b28a", 3, .5], ["#8f7a5a", 1, .45]] };
  var SIENA = { c: "#ddb36a", cC: "#f2d293", cS: "#c08e45", vene: [["#8a5a26", 2, .5], ["#f6e2b5", 2, .55]] };
  var ROSSO = { c: "#7a2c26", cC: "#9a3f35", cS: "#5a1d19", vene: [["#f1dccb", 2, .55], ["#c97f6c", 2, .45]] };

  // =========================================================
  //  I MURI (62 × 200)
  // =========================================================
  function damasco(x, y, oro, fondo, lcol, k) {   // il motivo damascato: metà sinistra disegnata e specchiata, più il centro
    var lc = "stroke='" + lcol + "' stroke-width='.45' stroke-linejoin='round'";
    var meta = tratto("M-4.6,-1 C-9,-6.5 -14,-3.5 -13.4,1.6 C-12.8,6.4 -7.8,7.6 -6.8,4.2", lcol, 3.2) + tratto("M-4.6,-1 C-9,-6.5 -14,-3.5 -13.4,1.6 C-12.8,6.4 -7.8,7.6 -6.8,4.2", oro, 2.3) + cer(-7.2, 3.6, 1.7, oro, lc) +
      pth("M-9.4,-4.6 C-10.6,-9.6 -13.8,-12.4 -13.6,-17.6 C-10.4,-15.4 -8.2,-11 -8.6,-5.2 Z", oro, lc) +
      pth("M-1,-10.4 C-4.2,-12.2 -7.2,-16 -6.4,-21.4 C-3.6,-18.6 -2,-14.6 -1,-10.4 Z", oro, lc) +
      pth("M-1.4,10.6 C-4.6,13.4 -10.4,14.4 -12.6,20.6 C-8.6,20.4 -4.4,18.8 -1.2,15 Z", oro, lc) +
      cer(-12.8, 10, 1.1, oro, lc) + cer(-14.6, -8.6, .9, oro, lc) + cer(-3.6, -24, .9, oro, lc);
    var centro = pth("M0,-8.6 C5.4,-6.6 7.4,-.4 5.4,5.8 C4.2,9 2.2,11.2 0,12.4 C-2.2,11.2 -4.2,9 -5.4,5.8 C-7.4,-.4 -5.4,-6.6 0,-8.6 Z", oro, lc) +
      pth("M0,-4.4 C2.4,-2.4 3,1.6 0,6.4 C-3,1.6 -2.4,-2.4 0,-4.4 Z", fondo) + cer(0, 9, 1, fondo) +
      pth("M0,-9.4 C2.2,-13.4 2.2,-18.6 0,-24 C-2.2,-18.6 -2.2,-13.4 0,-9.4 Z", oro, lc) +
      tratto("M0,12.4 L0,21.6", oro, 1.6) + cer(0, 23, 1.6, oro, lc) + ell(-2.4, -4.8, .9, 2.2, "#fff", op(.35));
    return "<g transform='translate(" + q(x, y) + ") scale(" + (k || 1) + ")'>" + meta + "<g transform='scale(-1 1)'>" + meta + "</g>" + centro + "</g>";
  }
  function legnoScuro(x, y, w, h, c, seme) { return rett(x, y, w, h, lin("lg" + c.slice(1), [[0, chiaro(c, .1)], [1, scuro(c, .12)]], 0, 0, 1, 0)) + venature(x, y, w, h, c, seme, Math.round(w / 4), true, .9); }
  function zoccoloLegno(c) {   // il battiscopa alto di legno scuro col listello d'oro
    return ombraSotto(186, 2, .2) + rett(0, 188, MW, 12, lin("zl" + c.slice(1), [[0, chiaro(c, .25)], [.3, c], [1, scuro(c, .35)]], 0, 0, 0, 1)) + filetto(187.4, 1.4) + rett(0, 199, MW, 1, scuro(c, .6));
  }
  function corrimano(y, c) {   // la cimasa a metà muro: listello d'oro, il legno tondo, perline
    return ombraSotto(y + 10, 4, .3) + rett(0, y, MW, 10, lin("cm" + c.slice(1), [[0, chiaro(c, .35)], [.35, chiaro(c, .1)], [.75, c], [1, scuro(c, .4)]], 0, 0, 0, 1)) +
      rett(0, y + 1.2, MW, .8, "#fff", op(.35)) + filetto(y - 1.4, 1.6) + perline(y + 8.8, .95) + rett(0, y - 1.4, MW, .5, L, op(.6));
  }
  // carta damascata (seta) con la cornice dorata, la boiserie scura sotto
  function damascato(base, seme, legno) {
    var s = rett(0, 0, MW, MH, lin("df" + base.slice(1), [[0, scuro(base, .12)], [.25, base], [1, chiaro(base, .05)]], 0, 0, 0, 1)), m;
    s += granelli(110, MW, 140, seme, scuro(base, .35), .7, .3) + granelli(70, MW, 140, seme + 1, chiaro(base, .35), .7, .22);
    var oro = lin("dm" + base.slice(1), [[0, "#f0d28a"], [.5, "#c99c4c"], [1, "#94692c"]], 0, 0, .4, 1), ton = scuro(base, .28);
    // il motivo si disegna una volta sola nei defs e poi si ripete con <use> (il disegno resta leggero)
    DEFS.push("<g id='" + P + "dmt'>" + damasco(0, 0, ton, ton, ton, .46) + "</g><g id='" + P + "dmo'>" + damasco(0, 0, oro, base, scuro(base, .5), .46) + "</g>");
    for (m = -1; m < 7; m++) for (var k = 0; k < 4; k++) {   // il disegno tono su tono (un po' spostato) e sopra l'oro, fitto e piccolo come una seta vera
      var dx = 7.75 + k * 15.5, dy = 20 + m * 24 + (k % 2) * 12;
      s += "<use xlink:href='#" + P + "dmt' x='" + f2(dx + .5) + "' y='" + f2(dy + .6) + "'/><use xlink:href='#" + P + "dmo' x='" + f2(dx) + "' y='" + f2(dy) + "'/>";
    }
    s += rett(0, 0, MW, MH, lin("ds", [[0, "#fff", 0], [.45, "#fff", .07], [.55, "#fff", 0]], 0, 0, 1, 0));   // il lucido della seta
    s += cornicePannello(6.5, 27, 49, 98, 5, 1.7) + [[6.5, 27], [55.5, 27], [6.5, 125], [55.5, 125]].map(function (p) { return rosetta(p[0], p[1], 2.4); }).join("");
    s += cornicione(legno, false);
    s += legnoScuro(0, 140, MW, 48, legno, seme + 3) + riquadro(7, 151, 48, 31, chiaro(legno, .04), 2.8) + venature(9.8, 153.8, 42.4, 25.4, chiaro(legno, .04), seme + 5, 9, false, 1);
    s += cornicePannello(12, 156, 38, 21, 2.5, 1.1);
    return s + corrimano(132, legno) + zoccoloLegno(legno);
  }
  // pannelli di legno scuro fino in alto con le modanature d'oro
  function boiserieOro() {
    var c = "#5b2d1a", s = legnoScuro(0, 0, MW, MH, c, 611);
    s += rett(-1, 15, 2, 173, OR.m, op(.85)) + rett(61, 15, 2, 173, OR.m, op(.85)) + rett(-.4, 15, .8, 173, OR.l, op(.6)) + rett(61.6, 15, .8, 173, OR.c, op(.5));   // il filo d'oro tra due campate
    s += riquadro(7, 24, 48, 94, chiaro(c, .05), 3.2) + venature(10.2, 27.2, 41.6, 87.6, chiaro(c, .05), 613, 12, true, 1.1);
    s += rett(10.2, 27.2, 41.6, 87.6, lin("bl", [[0, "#fff", .1], [.5, "#fff", 0], [1, "#000", .12]], 0, 0, 1, 1));
    s += cornicePannello(13, 31, 36, 80, 5, 1.6);
    s += pth("M31,48 L42,71 L31,94 L20,71 Z", "none", "stroke='" + OR.c + "' stroke-width='2.4' stroke-linejoin='round'") + pth("M31,48 L42,71 L31,94 L20,71 Z", "none", "stroke='" + OR.m + "' stroke-width='1.4' stroke-linejoin='round'") +   // il rombo d'oro in mezzo
      pth("M31,55 L38.4,71 L31,87 L23.6,71 Z", lin("br", [[0, "#7a4026"], [1, "#4a2212"]], 0, 0, 1, 1)) + rosetta(31, 71, 3.6) + [[31, 46], [31, 96], [17.6, 71], [44.4, 71]].map(function (p) { return cer(p[0], p[1], 1.3, oroP(), bordo(OR.c, .4)); }).join("");
    s += ombraSotto(124, 3, .2) + rett(0, 122, MW, 12, lin("bm", [[0, chiaro(c, .2)], [1, scuro(c, .2)]], 0, 0, 0, 1)) + filetto(121.4, 1.4) + filetto(133, 1.4) + perline(127.7, 1);
    s += riquadro(7, 142, 48, 40, chiaro(c, .05), 3) + venature(10, 145, 42, 34, chiaro(c, .05), 617, 8, false, 1.1) + cornicePannello(12.5, 147.5, 37, 29, 3.5, 1.3);
    return s + cornicione(c, false) + zoccoloLegno(c);
  }
  // una lesena di marmo giallo col capitello e la base d'oro, centrata in xc (sta a metà sui bordi)
  function lesena(xc, seme) {
    var s = rett(xc + 6, 28, 3, 132, lin("lo", [[0, "#000", .28], [1, "#000", 0]], 0, 0, 1, 0));   // l'ombra sul muro a destra
    s += lastra("ls" + xc, xc - 6, 28, 12, 132, SIENA, seme) + rett(xc - 6, 28, 12, 132, lin("lsl", [[0, "#fff", .35], [.4, "#fff", 0], [.6, "#000", 0], [1, "#000", .28]], 0, 0, 1, 0));
    [-3, 0, 3].forEach(function (d) { s += tratto("M" + q(xc + d, 34) + " L" + q(xc + d, 154), scuro(SIENA.c, .4), 1.2, op(.7)) + tratto("M" + q(xc + d + .7, 34) + " L" + q(xc + d + .7, 154), "#fff", .5, op(.55)); });   // le scanalature
    s += rett(xc - 6, 28, 12, 132, "none", "stroke='" + L + "' stroke-width='.7' opacity='.6'");
    // il capitello: abaco, le volute, la campana con le foglie
    s += rett(xc - 7, 19.5, 14, 8.5, oroV(), bordo(OR.c, .6)) + rett(xc - 8.5, 16, 17, 3.6, oroV(), bordo(OR.c, .6));
    s += cer(xc - 6.4, 22.2, 2.1, oroP(), bordo(OR.c, .5)) + cer(xc + 6.4, 22.2, 2.1, oroP(), bordo(OR.c, .5)) + cer(xc - 6.4, 22.2, .7, OR.c) + cer(xc + 6.4, 22.2, .7, OR.c);
    s += pth("M" + q(xc - 3.5, 28) + " Q" + q(xc - 4.5, 23) + " " + q(xc - 1.5, 21) + " Q" + q(xc - 2, 25) + " " + q(xc, 28) + " Z", OR.a, bordo(OR.c, .4)) + pth("M" + q(xc + 3.5, 28) + " Q" + q(xc + 4.5, 23) + " " + q(xc + 1.5, 21) + " Q" + q(xc + 2, 25) + " " + q(xc, 28) + " Z", OR.m, bordo(OR.c, .4));
    s += rett(xc - 8.5, 16, 17, .6, "#fff", op(.7));
    // la base: toro d'oro e plinto
    s += rett(xc - 7, 158, 14, 3.4, oroV(), bordo(OR.c, .5) + " rx='1.6'") + rett(xc - 8, 161.4, 16, 3.2, oroV(), bordo(OR.c, .5) + " rx='1.4'") + rett(xc - 8.5, 164.6, 17, 5.4, lin("pl", [[0, "#f3e9d6"], [1, "#c9b48f"]], 0, 0, 0, 1), bordo(L, .6));
    return s;
  }
  // lastre di marmo crema con le lesene e lo zoccolo di marmo rosso
  function marmoCrema() {
    var s = rett(0, 0, MW, MH, "#b9a582");
    s += lastra("a", 6, 16, 50, 77.4, CREMA, 631) + lastra("b", 6, 93.6, 50, 76.4, CREMA, 633);
    s += rett(6, 93.2, 50, .8, scuro(CREMA.c, .35), op(.7)) + rett(6, 94, 50, .5, "#fff", op(.7));   // la giunta tra le lastre
    s += cornicePannello(12, 26, 38, 58, 4, 1.2) + cornicePannello(12, 103, 38, 58, 4, 1.2);
    s += lesena(0, 641) + lesena(62, 641);
    // l'architrave in cima: fascia crema, dentelli, listello d'oro
    s += rett(0, 0, MW, 16, lin("ar", [[0, "#fbf5e8"], [.6, "#e8dbc0"], [1, "#cdb994"]], 0, 0, 0, 1)) + filetto(2.6, 1.6) + dentelli(5.6, 4, "#efe3cb") + perline(11.6, 1.05) + filetto(13.2, 1.8) + rett(0, 15, MW, .5, L, op(.5)) + ombraSotto(15.5, 5, .26);
    // lo zoccolo: modanatura crema e marmo rosso in due lastre
    s += lastra("za", 0, 177, 31, 23, ROSSO, 651) + lastra("zb", 31, 177, 31, 23, ROSSO, 653) + rett(30.7, 177, .7, 23, "#2a0d0a", op(.6)) + rett(61.5, 177, .5, 23, "#2a0d0a", op(.6));
    s += rett(0, 170, MW, 6, lin("zm", [[0, "#fbf4e6"], [.5, "#e2d3b4"], [1, "#a99270"]], 0, 0, 0, 1)) + rett(0, 169.6, MW, .6, L, op(.6)) + filetto(176, 1.4) + ombraSotto(177.4, 3, .3) + rett(0, 199, MW, 1, "#2a0d0a");
    return s;
  }
  function voluta(cx, cy, R, a0, dir, giri) {   // una spirale (per il fregio)
    var d = "", n = 22, i;
    for (i = 0; i <= n; i++) { var t = i / n, a = a0 + dir * t * Math.PI * 2 * (giri || 1.25), rr = R * (1 - t * .8); d += (i ? " L" : "M") + q(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    return d;
  }
  function fregio(y0) {   // il fregio a racemi d'oro (onda con le volute e le foglie), due onde per pezzo
    var yc = y0 + 8, A = 3, d = "", x, s = "", k;
    for (x = -2; x <= 64; x += 1) d += (x > -2 ? " L" : "M") + q(x, yc + A * Math.sin(2 * Math.PI * x / 31));
    var vol = "";
    for (k = -1; k < 5; k++) {
      var xk = 7.75 + k * 15.5, sg = k % 2 ? -1 : 1, yk = yc + sg * A;   // sg = 1 cresta in basso
      vol += voluta(xk + 4.2, yk - sg * 3.4, 3.4, sg > 0 ? Math.PI * .5 : -Math.PI * .5, -sg, 1.2) + " ";
      s += ell(xk - 4.6, yk - sg * 2.6, 2.4, 1.1, OR.a, bordo(OR.c, .35) + " transform='rotate(" + (sg * 35) + " " + q(xk - 4.6, yk - sg * 2.6).replace(",", " ") + ")'");
      s += cer(xk + 4.2, yk - sg * 3.4, .9, OR.a, bordo(OR.c, .3));
    }
    return tratto(d, OR.c, 2.1) + tratto(vol, OR.c, 1.7) + tratto(d, OR.m, 1.3) + tratto(vol, OR.m, 1) + s + sposta(-.3, -.3, tratto(d, OR.l, .45, op(.7)));
  }
  function conchiglia(x, y, R) {   // la conchiglia d'oro (ventaglio) sopra il pannello
    var s = "", i, d = "M" + q(x - R, y);
    for (i = 0; i < 7; i++) { var a0 = Math.PI + i * Math.PI / 7, a1 = a0 + Math.PI / 7, am = (a0 + a1) / 2; d += " Q" + q(x + Math.cos(am) * R * 1.18, y + Math.sin(am) * R * 1.18) + " " + q(x + Math.cos(a1) * R, y + Math.sin(a1) * R); }
    s += pth(d + " Z", oroV(), bordo(OR.c, .6));
    for (i = 1; i < 7; i++) { var a = Math.PI + i * Math.PI / 7; s += tratto("M" + q(x, y) + " L" + q(x + Math.cos(a) * R * .95, y + Math.sin(a) * R * .95), OR.s, .55); }
    return s + pth(voluta(x - R - 1.4, y - .6, 2, 0, -1, 1), "none", bordo(OR.c, .9)) + pth(voluta(x + R + 1.4, y - .6, 2, Math.PI, 1, 1), "none", bordo(OR.c, .9)) + cer(x, y, 1.6, oroP(), bordo(OR.c, .4));
  }
  function festone(x0, x1, y, cala) {   // la ghirlanda appesa, con le foglioline e i fiocchi
    var xm = (x0 + x1) / 2, d = "M" + q(x0, y) + " Q" + q(xm, y + cala * 2) + " " + q(x1, y), s = tratto(d, OR.c, 2.6) + tratto(d, OR.m, 1.8), i;
    for (i = 1; i < 10; i++) { var t = i / 10, u = 1 - t, px = u * u * x0 + 2 * u * t * xm + t * t * x1, py = u * u * y + 2 * u * t * (y + cala * 2) + t * t * y; s += ell(px, py + .4, 1.5, .8, i % 2 ? OR.a : OR.m, bordo(OR.c, .3) + " transform='rotate(" + (i % 2 ? 30 : -30) + " " + f2(px) + " " + f2(py + .4) + ")'"); }
    [x0, x1].forEach(function (xx) { s += tratto("M" + q(xx, y) + " L" + q(xx, y + 7), OR.c, 1.2) + tratto("M" + q(xx, y) + " L" + q(xx, y + 7), OR.m, .7) + pth("M" + q(xx, y + 6) + " L" + q(xx + 1.4, y + 10) + " L" + q(xx - 1.4, y + 10) + " Z", OR.m, bordo(OR.c, .4)) + cer(xx, y, 1.3, oroP(), bordo(OR.c, .4)); });
    return s;
  }
  // stucchi bianchi con le cornici dorate e i fregi (Belle Époque)
  function stucchi() {
    var c = "#f5eee1", s = rett(0, 0, MW, MH, lin("st", [[0, "#efe5d3"], [.3, c], [1, "#f1e8d8"]], 0, 0, 0, 1)) + granelli(60, MW, MH, 671, "#c9b998", .7, .2) + granelli(40, MW, MH, 673, "#fff", .8, .5);
    // in cima: cornice coi dentelli, il fregio d'oro, le perline
    s += rett(0, 0, MW, 30, lin("sf", [[0, "#faf6ee"], [1, "#efe6d4"]], 0, 0, 0, 1)) + rett(0, 0, MW, 3, "#fbf8f1") + filetto(3, 1.4) + dentelli(4.4, 3.6, "#f6f0e4") + filetto(8, 1.3);
    s += rett(0, 9.3, MW, 17, lin("sfr", [[0, "#e4d6bb"], [.2, "#f3ebdc"], [1, "#efe4cf"]], 0, 0, 0, 1)) + fregio(9.6) + perline(27.6, 1.05) + filetto(28.8, 1.4) + rett(0, 30.2, MW, .5, L, op(.45)) + ombraSotto(30.7, 5, .2);
    // il pannello grande: fondo appena più chiaro, la cornice d'oro, la conchiglia e la ghirlanda
    s += rett(9, 42, 44, 84, lin("sp", [[0, "#fdfaf3"], [1, "#f4ecdc"]], 0, 0, 1, 1)) + cornicePannello(9, 42, 44, 84, 6, 1.8) + cornicePannello(13, 46, 36, 76, 3.5, .8);
    s += festone(17, 45, 50, 4.5) + conchiglia(31, 42.5, 5.6) + rosetta(31, 122, 2.2);
    // tra due pannelli (sul bordo): il nastro d'oro con le campanule
    [0, 62].forEach(function (xc) {
      s += tratto("M" + q(xc, 44) + " L" + q(xc, 116), OR.c, 1.6) + tratto("M" + q(xc, 44) + " L" + q(xc, 116), OR.m, .9) + cer(xc, 42, 2, oroP(), bordo(OR.c, .45));
      [56, 72, 88, 104].forEach(function (yy, i) { s += pth("M" + q(xc, yy - 3.4) + " C" + q(xc + 2.6, yy - 1.6) + " " + q(xc + 2.2, yy + 2) + " " + q(xc, yy + 3) + " C" + q(xc - 2.2, yy + 2) + " " + q(xc - 2.6, yy - 1.6) + " " + q(xc, yy - 3.4) + " Z", i % 2 ? OR.m : OR.a, bordo(OR.c, .4)); });
    });
    // la cimasa bianca col filo d'oro, lo zoccolo con la cornicetta, il battiscopa di marmo
    s += ombraSotto(144, 3.5, .18) + rett(0, 135, MW, 9, lin("sc", [[0, "#ffffff"], [.5, "#f1e8d8"], [1, "#cfc0a3"]], 0, 0, 0, 1)) + filetto(137.6, 1.5) + rett(0, 134.6, MW, .5, L, op(.45)) + rett(0, 143.6, MW, .5, L, op(.45));
    s += cornicePannello(10, 151, 42, 30, 3, 1.2) + rosetta(31, 151, 1.8);
    s += ombraSotto(186, 2, .18) + rett(0, 188, MW, 12, lin("sb", [[0, "#fbf5e8"], [.4, "#e9dcc2"], [1, "#b8a27c"]], 0, 0, 0, 1)) + filetto(187.4, 1.3) + rett(0, 199, MW, 1, "#8f7a58");
    return s;
  }

  var MURI_C = [
    ["damascato_rosso", "Damasco rosso del Casinò", 60, function () { return damascato("#8e1b22", 601, "#4a2416"); }],
    ["damascato_verde", "Damasco verde del Casinò", 60, function () { return damascato("#1f4a37", 603, "#3e2414"); }],
    ["boiserie_oro", "Boiserie scura con l'oro", 90, boiserieOro],
    ["marmo_crema", "Marmo crema con le lesene", 120, marmoCrema],
    ["stucchi", "Stucchi bianchi e oro", 100, stucchi]
  ];
  MURI_C.forEach(function (v) { K.muri.push({ id: v[0], nome: v[1], dove: "dentro", prezzo: v[2], svg: function () { return svg("cm_" + v[0], MW, MH, v[3]); } }); });

  // =========================================================
  //  I PAVIMENTI (100 × 100)
  // =========================================================
  // la moquette dei casinò: medaglione al centro, volute d'oro, rombi agli angoli, fiorellini; c = i colori
  function moquetteCasino(c, seme) {
    var lc = "stroke='" + c.l + "' stroke-width='.55' stroke-linejoin='round'", m = "", i;
    // il traliccio scuro sotto (rombi che passano per i fiori dei bordi)
    m += tratto("M50,0 L100,50 L50,100 L0,50 Z", scuro(c.f, .3), 2.4, op(.55)) + tratto("M50,0 L100,50 L50,100 L0,50 Z", chiaro(c.f, .12), .5, op(.5) + " stroke-dasharray='1.2 2'");
    // le volute d'oro lungo i quattro assi (a lira, due specchiate)
    var vol = "M48.6,31.5 C42,28 38.5,21 42.5,15.5 C45,12 49.5,13.5 48.4,17 C47.6,19.4 44.8,18.6 45.4,16.6";
    var asse = tratto(vol, c.l, 3.1) + tratto(vol, c.o, 2) + "<g transform='translate(100 0) scale(-1 1)'>" + tratto(vol, c.l, 3.1) + tratto(vol, c.o, 2) + "</g>" +
      pth("M50,30 C47.6,27 47.6,24 50,21 C52.4,24 52.4,27 50,30 Z", c.b, lc) + cer(50, 19.2, 1.3, c.o, lc) +   // la goccia blu tra le volute
      ell(41.2, 24.5, 2.6, 1.2, c.v, lc + " transform='rotate(-60 41.2 24.5)'") + ell(58.8, 24.5, 2.6, 1.2, c.v, lc + " transform='rotate(60 58.8 24.5)'");
    for (i = 0; i < 4; i++) m += gira(i * 90, 50, 50, asse);
    // le foglie d'acanto sulle diagonali, con il fiore in punta
    var foglia = pth("M50,30 C45.5,27 44,21 47.2,15.6 C47.8,18.6 48.6,19.6 50,20.4 C51.4,19.6 52.2,18.6 52.8,15.6 C56,21 54.5,27 50,30 Z", c.o, lc) + tratto("M50,29 L50,19", c.l, .5, op(.7)) +
      cer(50, 13.2, 2.6, c.bc, lc) + cer(50, 13.2, 1, c.o);
    for (i = 0; i < 4; i++) m += gira(45 + i * 90, 50, 50, foglia);
    // il medaglione
    for (i = 0; i < 12; i++) { var a = i * Math.PI / 6; m += cer(50 + Math.cos(a) * 17.6, 50 + Math.sin(a) * 17.6, 4.2, c.o, lc); }
    m += cer(50, 50, 18, c.o) + cer(50, 50, 15.4, c.l) + cer(50, 50, 14.6, c.b);
    for (i = 0; i < 16; i++) { var b = i * Math.PI / 8; m += cer(50 + Math.cos(b) * 12.6, 50 + Math.sin(b) * 12.6, .75, c.o); }
    for (i = 0; i < 8; i++) m += gira(i * 45, 50, 50, ell(50, 42.2, 2.6, 5.2, c.r, lc) + tratto("M50,46 L50,39", scuro(c.r, .35), .5, op(.7)));
    m += cer(50, 50, 4.2, c.o, lc) + cer(50, 50, 2, c.r) + cer(50, 50, .8, c.o);
    for (i = 0; i < 12; i++) { var e = i * Math.PI / 6 + Math.PI / 12; m += cer(50 + Math.cos(e) * 21.4, 50 + Math.sin(e) * 21.4, .9, c.bc); }
    // il rombo agli angoli (diviso tra quattro piastrelle)
    m += pth("M0,-14 L11,0 L0,14 L-11,0 Z", c.o, lc) + pth("M0,-11.6 L9,0 L0,11.6 L-9,0 Z", c.b, lc) + pth("M0,-6.4 L5,0 L0,6.4 L-5,0 Z", c.r, lc) + cer(0, 0, 1.4, c.o);
    [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) { m += ell(d[0] * 8.6, d[1] * 8.6, 3.2, 1.4, c.v, lc + " transform='rotate(" + (d[0] * d[1] * 45) + " " + f2(d[0] * 8.6) + " " + f2(d[1] * 8.6) + ")'"); });
    // i fiori a quattro petali a metà dei bordi
    [[50, 0], [0, 50]].forEach(function (p) {
      [[0, -3.4], [3.4, 0], [0, 3.4], [-3.4, 0]].forEach(function (o) { m += cer(p[0] + o[0], p[1] + o[1], 3.1, c.bc, lc); });
      m += cer(p[0], p[1], 2.3, c.o, lc) + cer(p[0], p[1], .9, c.r);
      [[1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(function (d) { m += ell(p[0] + d[0] * 5.6, p[1] + d[1] * 5.6, 2.2, .9, c.o, lc + " transform='rotate(" + (d[0] * d[1] * 45) + " " + f2(p[0] + d[0] * 5.6) + " " + f2(p[1] + d[1] * 5.6) + ")'"); });
    });
    // i rametti d'oro lungo i bordi (tra il rombo e il fiore): due riccioli specchiati e il bocciolo blu
    var ramo = tratto("M25,1 C21,1.5 18.5,5 20.5,7.6 C22,9.4 24.2,7.8 23,6.4", c.l, 2.4) + tratto("M25,1 C21,1.5 18.5,5 20.5,7.6 C22,9.4 24.2,7.8 23,6.4", c.o, 1.4) +
      "<g transform='translate(50 0) scale(-1 1)'>" + tratto("M25,1 C21,1.5 18.5,5 20.5,7.6 C22,9.4 24.2,7.8 23,6.4", c.l, 2.4) + tratto("M25,1 C21,1.5 18.5,5 20.5,7.6 C22,9.4 24.2,7.8 23,6.4", c.o, 1.4) + "</g>" +
      ell(25, 4.6, 1.5, 2.6, c.bc, lc) + cer(25, 1.2, 1.2, c.o, lc) + ell(21.4, 11.4, 1.8, .8, c.v, lc + " transform='rotate(35 21.4 11.4)'") + ell(28.6, 11.4, 1.8, .8, c.v, lc + " transform='rotate(-35 28.6 11.4)'");
    ramo += "<g transform='scale(1 -1)'>" + ramo + "</g>";   // specchiato anche sopra il bordo
    m += ramo + sposta(50, 0, ramo) + "<g transform='matrix(0 1 1 0 0 0)'>" + ramo + sposta(50, 0, ramo) + "</g>";
    var s = rett(0, 0, 100, 100, c.f) + piastrella("mq", m);
    // il pelo della moquette (granelli chiari e scuri) e una leggera macchia di luce
    s += granelli(700, 100, 100, seme, scuro(c.f, .4), .8, .22, true) + granelli(500, 100, 100, seme + 1, "#fff", .7, .12, true);
    return s;
  }
  // marmo bianco e nero lucido a scacchi (lastre grandi da mezzo metro)
  function marmoScacchi() {
    var s = rett(0, 0, 100, 100, "#2a2722"), i, j;
    var NERO = { c: "#1d1d22", cC: "#33333c", cS: "#0d0d10", vene: [["#f2efe6", 2, .8], ["#9a9aa6", 2, .55]], lucido: .45 }, BIANCO = { c: "#f3f1ec", cC: "#ffffff", cS: "#dcd8d0", vene: [["#8d8780", 2, .55], ["#b7b1a8", 3, .45]], lucido: .55 };
    for (j = 0; j < 2; j++) for (i = 0; i < 2; i++) {
      var x = i * 50 + .4, y = j * 50 + .4, n = (i + j) % 2;
      s += lastra("s" + i + j, x, y, 49.2, 49.2, n ? NERO : BIANCO, 701 + i * 3 + j * 7);
      s += rett(x, y, 49.2, .6, "#fff", op(n ? .25 : .8)) + rett(x, y, .6, 49.2, "#fff", op(n ? .18 : .6));
    }
    return s;
  }
  // marmo crema venato con le fasce di marmo rosso e il tassello nero agli incroci
  function marmoLucido() {
    var B = 12, s = rett(0, 0, 100, 100, "#2a1a14"), CR = { c: "#efe2c7", cC: "#fdf7ea", cS: "#d8bf94", vene: [["#a88754", 2, .65], ["#c7a978", 3, .5], ["#8a6c45", 1, .5]], lucido: .7, nuv: 8 };
    var FA = { c: "#7a2621", cC: "#9b3a30", cS: "#561612", vene: [["#f3e0d2", 1, .7], ["#c8786a", 1, .5]], lucido: .35 }, i, j, l = (100 - B) / 2;
    for (j = 0; j < 2; j++) for (i = 0; i < 2; i++) s += lastra("c" + i + j, B + i * l + .25, B + j * l + .25, l - .5, l - .5, CR, 721 + i * 5 + j * 11);   // quattro lastre crema
    s += lastra("fo", B + .3, .9, 100 - B - .6, B - 1.8, FA, 723) + lastra("fv", .9, B + .3, B - 1.8, 100 - B - .6, FA, 725);   // le fasce di marmo rosso
    s += rett(B, 0, 100 - B, .9, "#16110f") + rett(B, B - .9, 100 - B, .9, "#16110f") + rett(0, B, .9, 100 - B, "#16110f") + rett(B - .9, B, .9, 100 - B, "#16110f");   // i fili neri lungo le fasce
    s += rett(B, .9, 100 - B, .5, "#fff", op(.3)) + rett(.9, B, .5, 100 - B, "#fff", op(.25));
    // il tassello all'incrocio: quadrato nero, rombo crema col filo d'oro
    s += rett(0, 0, B, B, "#16141a") + rett(0, 0, B, .6, "#fff", op(.2)) + pth("M6,1.4 L10.6,6 L6,10.6 L1.4,6 Z", "#efe2c7", "stroke='" + OR.m + "' stroke-width='.9'") + cer(6, 6, 1.3, "#16141a") + pth("M6,2.4 L8.6,5 L3.4,5 Z", "#fff", op(.35));
    return s;
  }
  // parquet a intarsi: fasce di noce coi fili d'acero, cestino di rovere e la stella in mezzo
  function parquetIntarsio() {
    var noce = "#5b3520", rov = ["#c89a5e", "#c0904f", "#cfa266", "#b98a4e"], acero = "#e9d3a4", cil = "#9a4e2c", s = rett(0, 0, 100, 100, "#3a2214"), i, j, k;
    var g = lin("pi", [[0, "#fff", .2], [.5, "#fff", 0], [1, "#000", .16]], 0, 0, 1, 1);
    function asse(x, y, w, h, c, seme, vert) { return rett(x + .25, y + .25, w - .5, h - .5, c) + venature(x + .3, y + .3, w - .6, h - .6, c, seme, 3, vert, 1.3) + rett(x + .25, y + .25, w - .5, h - .5, "none", "stroke='" + scuro(c, .45) + "' stroke-width='.45' opacity='.7'"); }
    // le fasce di noce in alto e a sinistra, coi fili d'acero
    s += asse(10, 1.2, 90, 7.6, noce, 801, false) + asse(1.2, 10, 7.6, 90, noce, 803, true);
    s += rett(10, 0, 90, 1.2, acero) + rett(10, 8.8, 90, 1.2, acero) + rett(0, 10, 1.2, 90, acero) + rett(8.8, 10, 1.2, 90, acero);
    s += rett(0, 0, 10, 10, acero) + pth("M5,1.4 L8.6,5 L5,8.6 L1.4,5 Z", noce) + pth("M5,3.2 L6.8,5 L5,6.8 L3.2,5 Z", cil);   // l'incrocio
    // il cestino: 3 × 3 quadrati da 30, tre assi per quadrato, il verso cambia a scacchi
    for (j = 0; j < 3; j++) for (i = 0; i < 3; i++) {
      var x0 = 10 + i * 30, y0 = 10 + j * 30;
      if (i === 1 && j === 1) continue;
      for (k = 0; k < 3; k++) {
        var r = rnd(811 + i * 7 + j * 13 + k), c = scegli(r, rov);
        s += (i + j) % 2 ? asse(x0 + k * 10, y0, 10, 30, c, 821 + i + j * 3 + k * 9, true) : asse(x0, y0 + k * 10, 30, 10, c, 831 + i + j * 3 + k * 9, false);
      }
    }
    // la stella a otto punte nel quadrato in mezzo (ogni punta metà chiara e metà scura)
    var cx = 55, cy = 55;
    s += rett(40, 40, 30, 30, noce) + venature(40, 40, 30, 30, noce, 841, 6, false, 1) + cer(cx, cy, 13.6, acero) + cer(cx, cy, 12.6, scuro(noce, .15));
    for (k = 0; k < 8; k++) {
      var a = k * Math.PI / 4 - Math.PI / 2, lung = k % 2 ? 9.6 : 12.4, px = cx + Math.cos(a) * lung, py = cy + Math.sin(a) * lung;
      var sx = cx + Math.cos(a - Math.PI / 8) * 4.2, sy = cy + Math.sin(a - Math.PI / 8) * 4.2, dx = cx + Math.cos(a + Math.PI / 8) * 4.2, dy = cy + Math.sin(a + Math.PI / 8) * 4.2;
      var cp = k % 2 ? cil : acero;
      s += pth("M" + q(cx, cy) + " L" + q(sx, sy) + " L" + q(px, py) + " Z", chiaro(cp, .18)) + pth("M" + q(cx, cy) + " L" + q(dx, dy) + " L" + q(px, py) + " Z", scuro(cp, .2));
    }
    s += cer(cx, cy, 2, acero) + cer(cx, cy, 1, cil);
    s += rett(40, 40, 30, 30, "none", "stroke='" + acero + "' stroke-width='1.1'");
    return s + rett(0, 0, 100, 100, g);
  }
  var PAV_C = [
    ["moquette_casino", "Moquette rossa del Casinò", 50, function () { return moquetteCasino({ f: "#9a1725", o: "#e6b54c", b: "#1f3d84", bc: "#3e6cc0", r: "#d0333a", v: "#2f7a52", l: "#4a0a10" }, 851); }],
    ["moquette_casino_blu", "Moquette blu del Casinò", 50, function () { return moquetteCasino({ f: "#1c2c66", o: "#e6b54c", b: "#9c1a28", bc: "#d8434a", r: "#3e6cc0", v: "#2f7a52", l: "#0b1236" }, 853); }],
    ["marmo_scacchi", "Marmo a scacchi lucido", 80, marmoScacchi],
    ["marmo_lucido", "Marmo crema con le fasce", 90, marmoLucido],
    ["parquet_intarsio", "Parquet a intarsi", 90, parquetIntarsio]
  ];
  PAV_C.forEach(function (v) { K.pavimenti.push({ id: v[0], nome: v[1], dove: "dentro", prezzo: v[2], svg: function () { return svg("cv_" + v[0], 100, 100, v[3]); } }); });

  // =========================================================
  //  LA PORTA: il portone d'ingresso a vetri e ottone
  // =========================================================
  function vetroPortone(nome, forma, b, notte) {   // b = [x, y, w, h]
    var x = b[0], y = b[1], w = b[2], h = b[3], c;
    if (notte) c = rett(x, y, w, h, lin("vn", [[0, "#fffbe8"], [.4, "#ffe9a6"], [1, "#ffc152"]], 0, 0, .3, 1)) + ell(x + w * .5, y + h * .35, w * .7, h * .4, rad("vlu", [[0, "#fff", .7], [1, "#fff", 0]], .5, .5, .5));
    else c = rett(x, y, w, h, lin("vg", [[0, "#d9ecf4"], [.45, "#8fb6cb"], [1, "#4e7590"]], 0, 0, .35, 1)) + rett(x, y + h * .6, w, h * .4, "#2e4a60", op(.25)) +
      pth("M" + q(x + w * .45, y) + " L" + q(x + w * .75, y) + " L" + q(x + w * .2, y + h) + " L" + q(x - w * .1, y + h) + " Z", "#fff", op(.28)) + pth("M" + q(x + w * .85, y) + " L" + q(x + w * .95, y) + " L" + q(x + w * .4, y + h) + " L" + q(x + w * .3, y + h) + " Z", "#fff", op(.22));
    return dentro(nome, forma, c);
  }
  function portone(notte) {
    var s = "", i, marmo = "#efe4cf";
    if (notte) s += ell(31, 110, 34, 92, rad("al", [[0, "#ffe7a0", .55], [.55, "#ffd47a", .2], [1, "#ffd47a", 0]], .5, .5, .5));
    // la cornice di marmo ad arco con la chiave di volta d'oro
    var fuori = "M.5,200 L.5,46 A30.5,30.5 0 0 1 61.5,46 L61.5,200 Z", vano = "M6,198 L6,46 A25,25 0 0 1 56,46 L56,198 Z";
    s += sposta(1.4, 1.8, pth(fuori, "#000", op(.18))) + pth(fuori, lin("cf", [[0, "#fdf8ee"], [.5, marmo], [1, "#c9b48f"]], 0, 0, 1, 1), bordo(L, 2));
    s += tratto("M3,200 L3,46 A28,28 0 0 1 59,46 L59,200", OR.m, 1.1) + tratto("M3,200 L3,46 A28,28 0 0 1 59,46 L59,200", OR.l, .4, op(.7));
    [.25, .5, .75].forEach(function (k) { var a = Math.PI + k * Math.PI; s += tratto("M" + q(31 + Math.cos(a) * 25.5, 46 + Math.sin(a) * 25.5) + " L" + q(31 + Math.cos(a) * 30, 46 + Math.sin(a) * 30), L, .7, op(.45)); });
    s += pth("M26,14 L36,14 L34.4,24 L27.6,24 Z", oroV(), bordo(OR.c, .9)) + rosetta(31, 18.4, 2.2);
    // il vano: telaio d'ottone, la lunetta a raggiera, le due ante
    s += pth(vano, "#3a2a14");
    s += vetroPortone("vl", "<path d='M8.6,46 A22.4,22.4 0 0 1 53.4,46 Z'/>", [8.6, 23.6, 44.8, 22.4], notte);
    for (i = 1; i < 8; i++) { var b = Math.PI + i * Math.PI / 8; s += tratto("M" + q(31 + Math.cos(b) * 6, 46 + Math.sin(b) * 6) + " L" + q(31 + Math.cos(b) * 22.4, 46 + Math.sin(b) * 22.4), OR.c, 1.5) + tratto("M" + q(31 + Math.cos(b) * 6, 46 + Math.sin(b) * 6) + " L" + q(31 + Math.cos(b) * 22.4, 46 + Math.sin(b) * 22.4), OR.m, .8); }
    s += pth("M23,46 A8,8 0 0 1 39,46 Z", oroV(), bordo(OR.c, .8)) + pth("M8.6,46 A22.4,22.4 0 0 1 53.4,46", "none", bordo(OR.c, 2.4)) + pth("M8.6,46 A22.4,22.4 0 0 1 53.4,46", "none", "stroke='" + OR.m + "' stroke-width='1.4'");
    s += rett(6, 46, 50, 4.4, oroV(), bordo(OR.c, .8));   // la traversa
    [6.4, 31].forEach(function (x, n) {
      var w = 24.6;
      s += rett(x, 50.4, w, 147.6, notte ? lin("ann" + n, [[0, "#e2b85c"], [.3, "#c08b2c"], [.7, "#8e6114"], [1, "#5e3d08"]], 0, 0, 1, 1) : lin("an" + n, [[0, OR.l], [.25, OR.a], [.6, OR.m], [1, OR.s]], 0, 0, 1, 1), bordo(OR.c, .9));   // l'anta d'ottone (di notte più scura, così i vetri accesi risaltano)
      s += rett(x + 3.6, 55, w - 7.2, 108, OR.c) + vetroPortone("va" + n, rq(x + 4.2, 55.6, w - 8.4, 106.8), [x + 4.2, 55.6, w - 8.4, 106.8], notte);
      s += rett(x + 4.2, 55.6, w - 8.4, 1.4, "#000", op(.25));
      // la grata d'ottone sul vetro: cornicetta, ovale in mezzo, i ricci
      var cx = x + w / 2;
      s += rett(x + 6.4, 58, w - 12.8, 102, "none", "stroke='" + OR.c + "' stroke-width='1.3'") + rett(x + 6.4, 58, w - 12.8, 102, "none", "stroke='" + OR.m + "' stroke-width='.7'");
      s += ell(cx, 109, 6.2, 12, "none", "stroke='" + OR.c + "' stroke-width='2.2'") + ell(cx, 109, 6.2, 12, "none", "stroke='" + OR.m + "' stroke-width='1.3'") + rosetta(cx, 109, 2.6);
      s += tratto("M" + q(cx, 58) + " L" + q(cx, 97) + " M" + q(cx, 121) + " L" + q(cx, 160), OR.c, 1.1) + tratto("M" + q(cx, 58) + " L" + q(cx, 97) + " M" + q(cx, 121) + " L" + q(cx, 160), OR.m, .55);
      [[72, 1], [146, -1]].forEach(function (v) { s += tratto(voluta(cx - 3.2, v[0], 2.6, 0, v[1], 1) + " " + voluta(cx + 3.2, v[0], 2.6, Math.PI, -v[1], 1), OR.c, 1.1) + tratto(voluta(cx - 3.2, v[0], 2.6, 0, v[1], 1) + " " + voluta(cx + 3.2, v[0], 2.6, Math.PI, -v[1], 1), OR.m, .55); });
      // la lamina in basso, in rilievo
      s += riquadro(x + 3.6, 168, w - 7.2, 25, notte ? "#a87a26" : "#d9a944", 2.2) + rosetta(cx, 180.5, 2.4);
      s += rett(x + .6, 51, 1, 146, "#fff", op(.45));
    });
    s += rett(30.4, 50.4, 1.2, 147.6, OR.c);   // la fuga tra le ante
    // i maniglioni lunghi d'ottone
    [27.2, 34.8].forEach(function (x) {
      s += rett(x - 1.2, 94, 2.4, 3, OR.s, bordo(OR.c, .5)) + rett(x - 1.2, 146, 2.4, 3, OR.s, bordo(OR.c, .5)) + sposta(.8, 1, rett(x - 1.5, 92, 3, 59, "#000", op(.25) + " rx='1.5'"));
      s += rett(x - 1.5, 92, 3, 59, oroH(), bordo(OR.c, .7) + " rx='1.5'") + rett(x - .8, 94, .7, 55, "#fff", op(.75));
    });
    // la soglia di marmo con il filo d'ottone
    return s + rett(0, 196, 62, 4, lin("sg", [[0, "#fbf6ec"], [1, "#b8a582"]], 0, 0, 0, 1), bordo(L, 1.2)) + rett(1, 196.6, 60, .8, OR.m);
  }
  K.porte.push({ id: "portone_casino", nome: "Portone del Casinò", dove: "dentro", prezzo: 1500, svg: function (opz) { var notte = !!(opz && opz.notte); return svg("cp_portone" + (notte ? "_n" : ""), MW, MH, function () { return portone(notte); }); } });
})();

/* =========================================================
   SPeeD GAME — I MATERIALI DELLE ZONE NUOVE DEL CASINÒ (si aggiungono a SGKit)
   Stesso contratto di js/costruzioni-arte.js e js/costruzioni-casino.js (va caricato dopo di loro):
   - muri: pezzo 62 × 200 che si ripete in orizzontale (le cose sui bordi sono divise a metà tra due
     pezzi, così in fila si chiudono da sole); opz.notte: gli specchi riflettono le luci, i neon brillano di più
   - pavimenti: quadrato 100 × 100 che si ripete nei due versi (il motivo si stende 3 × 3 volte, così
     quello che esce da un bordo rientra dall'altro)
   Le zone: bar e ristorante (specchi), slot e sala giochi (neon di Las Vegas), scommesse (sport),
   sala poker (legno scuro e ottone), il palco (assi chiare).
   Attenzione ai nomi: "moquette_blu" e "parquet_scuro" ci sono già nel kit della casa (e il gioco prende
   il primo con quel nome), per questo qui si chiamano "moquette_blu_reale" e "parquet_spina".
   Il muro al neon ha anche `luce` (come i mobili): il punto da cui esce la luce di ogni pezzo.
   ========================================================= */
(function () {
  "use strict";
  var K = window.SGKit;
  if (!K) return;

  // ---------- attrezzi (come nel kit; gli id hanno un prefisso tutto loro) ----------
  var nId = 0, P = "", DEFS = [], FATTI = {}, PRONTI = {};
  var SEGNO = "§z§";
  var L = "#5a3a22", MW = 62, MH = 200;
  var OR = { k: "o", l: "#fff4c8", a: "#f3d070", m: "#d4a43f", s: "#9a6a17", c: "#5e3d06" };   // l'oro: luce, chiaro, pieno, ombra, contorno
  var OT = { k: "t", l: "#fff8d8", a: "#e9d07c", m: "#c4a03e", s: "#7f611b", c: "#45320a" };   // l'ottone: più giallo e più freddo dell'oro
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
    return PRONTI[chiave].split(SEGNO).join("kz" + (++nId) + "_");
  }
  // pavimento: il motivo si stende 3 × 3 volte (quello che esce da un bordo rientra dall'altro)
  function piastrella(nome, corpo) {
    DEFS.push("<g id='" + P + nome + "'>" + corpo + "</g>");
    var s = "", i, j;
    for (j = -1; j <= 1; j++) for (i = -1; i <= 1; i++) s += "<use xlink:href='#" + P + nome + "' x='" + i * 100 + "' y='" + j * 100 + "'/>";
    return s;
  }
  // muro: quello che sta a cavallo dei bordi si disegna tre volte (a sinistra, qui, a destra)
  function inFila(nome, corpo) {
    DEFS.push("<g id='" + P + nome + "'>" + corpo + "</g>");
    return [-MW, 0, MW].map(function (x) { return "<use xlink:href='#" + P + nome + "' x='" + x + "'/>"; }).join("");
  }
  function puntini(a, col, w, o) {
    if (!a.length) return "";
    return "<path d='" + a.map(function (v) { return "M" + q(v[0], v[1]) + "h.01"; }).join("") + "' fill='none' stroke='" + col + "' stroke-width='" + w + "' stroke-linecap='round'" + (o != null ? " " + op(o) : "") + "/>";
  }
  function granelli(n, W, H, seme, col, w, o, dueVersi, y0) {   // puntini a caso (a seme fisso) che rientrano dai bordi
    var r = rnd(seme), a = [], i;
    for (i = 0; i < n; i++) {
      var x = r() * W, y = r() * H + (y0 || 0);
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
  function stella4(x, y, a, b) {   // la stellina a quattro punte (scintilla)
    return "M" + q(x, y - a) + " Q" + q(x + b, y - b) + " " + q(x + a, y) + " Q" + q(x + b, y + b) + " " + q(x, y + a) + " Q" + q(x - b, y + b) + " " + q(x - a, y) + " Q" + q(x - b, y - b) + " " + q(x, y - a) + " Z";
  }

  // ---------- l'oro e l'ottone ----------
  function metV(M) { return lin("mv" + M.k, [[0, M.l], [.28, M.a], [.65, M.m], [1, M.s]], 0, 0, 0, 1); }   // per le fasce orizzontali
  function metD(M) { return lin("md" + M.k, [[0, M.l], [.3, M.a], [.7, M.m], [1, M.s]], 0, 0, 1, 1); }   // per le cornici (luce in alto a sinistra)
  function metP(M) { return rad("mp" + M.k, [[0, "#fffbe6"], [.35, M.a], [.8, M.m], [1, M.s]], .35, .3, .75); }   // perline e borchie
  function filetto(y, h, M) {   // un listello di metallo orizzontale
    M = M || OR;
    return rett(0, y, MW, h, metV(M)) + rett(0, y, MW, .5, "#fff", op(.75)) + rett(0, y + h - .45, MW, .45, M.c, op(.75));
  }
  function perline(y, r, M) {   // fila di perline: 20 per pezzo, combaciano sul bordo
    M = M || OR; r = r || 1.2;
    var s = rett(0, y - r * .9, MW, r * 1.8, scuro(M.m, .45)), x;
    for (x = 1.55; x < MW; x += 3.1) s += cer(x, y, r, metP(M));
    return s;
  }
  function dentelli(y, h, c) {   // i dentelli della cornice (16 per pezzo)
    var s = rett(0, y, MW, h, scuro(c, .4)), x;
    for (x = .7; x < MW; x += 3.875) s += rett(x, y, 2.5, h, lin("dt" + c.slice(1), [[0, chiaro(c, .35)], [1, scuro(c, .1)]], 0, 0, 0, 1)) + rett(x + 2.5, y, .5, h, "#000", op(.25));
    return s;
  }
  function ombraSotto(y, h, o) { return rett(0, y, MW, h, lin("os" + Math.round(o * 100), [[0, "#000", o], [1, "#000", 0]], 0, 0, 0, 1)); }
  function cornicione(c, conDentelli) {   // la cornice in cima al muro: fascia, listello d'oro, guscio in ombra, perline
    var s = rett(0, 0, MW, 3.6, lin("cc" + c.slice(1), [[0, chiaro(c, .25)], [1, c]], 0, 0, 0, 1)) + filetto(3.6, 2.2);
    s += rett(0, 5.8, MW, 5.2, lin("cg" + c.slice(1), [[0, scuro(c, .5)], [.55, scuro(c, .12)], [1, chiaro(c, .22)]], 0, 0, 0, 1));
    if (conDentelli) s += dentelli(6.6, 3.4, c);
    s += perline(12.2, 1.15) + filetto(13.4, 1.8);
    return s + rett(0, 15.2, MW, .5, L, op(.55)) + ombraSotto(15.7, 6, .3);
  }
  function cornicePannello(x, y, w, h, r, sp, M) {   // la cornice di metallo con gli angoli rientranti
    M = M || OR; sp = sp || 1.8;
    var d = "M" + q(x + r, y) + " L" + q(x + w - r, y) + " A" + r + "," + r + " 0 0 0 " + q(x + w, y + r) + " L" + q(x + w, y + h - r) + " A" + r + "," + r + " 0 0 0 " + q(x + w - r, y + h) +
      " L" + q(x + r, y + h) + " A" + r + "," + r + " 0 0 0 " + q(x, y + h - r) + " L" + q(x, y + r) + " A" + r + "," + r + " 0 0 0 " + q(x + r, y) + " Z";
    return sposta(.7, .9, pth(d, "none", "stroke='#000' stroke-width='" + f2(sp + .6) + "' opacity='.22'")) +
      pth(d, "none", "stroke='" + M.c + "' stroke-width='" + f2(sp + 1) + "' stroke-linejoin='round'") + pth(d, "none", "stroke='" + M.m + "' stroke-width='" + f2(sp) + "' stroke-linejoin='round'") +
      sposta(-.35, -.35, pth(d, "none", "stroke='" + M.l + "' stroke-width='" + f2(sp * .38) + "' stroke-linejoin='round' opacity='.85'"));
  }
  function rosetta(x, y, r, M) {   // una piccola rosa di metallo
    M = M || OR;
    var s = "", i;
    for (i = 0; i < 6; i++) { var a = i * Math.PI / 3; s += cer(x + Math.cos(a) * r * .55, y + Math.sin(a) * r * .55, r * .48, M.m, bordo(M.c, .4)); }
    return s + cer(x, y, r * .45, metP(M), bordo(M.c, .4)) + cer(x - r * .2, y - r * .2, r * .15, "#fff", op(.8));
  }
  function borchia(x, y, r, M) {   // la borchia a cupola (chiodo da tappezziere)
    M = M || OT;
    return cer(x + r * .3, y + r * .4, r, "#000", op(.3)) + cer(x, y, r, metP(M), bordo(M.c, .35)) + cer(x - r * .35, y - r * .35, r * .3, "#fff", op(.85));
  }
  function voluta(cx, cy, R, a0, dir, giri) {   // una spirale
    var d = "", n = 22, i;
    for (i = 0; i <= n; i++) { var t = i / n, a = a0 + dir * t * Math.PI * 2 * (giri || 1.25), rr = R * (1 - t * .8); d += (i ? " L" : "M") + q(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
    return d;
  }
  function conchiglia(x, y, R) {   // la conchiglia d'oro (ventaglio)
    var s = "", i, d = "M" + q(x - R, y);
    for (i = 0; i < 7; i++) { var a0 = Math.PI + i * Math.PI / 7, a1 = a0 + Math.PI / 7, am = (a0 + a1) / 2; d += " Q" + q(x + Math.cos(am) * R * 1.18, y + Math.sin(am) * R * 1.18) + " " + q(x + Math.cos(a1) * R, y + Math.sin(a1) * R); }
    s += pth(d + " Z", metV(OR), bordo(OR.c, .6));
    for (i = 1; i < 7; i++) { var a = Math.PI + i * Math.PI / 7; s += tratto("M" + q(x, y) + " L" + q(x + Math.cos(a) * R * .95, y + Math.sin(a) * R * .95), OR.s, .55); }
    return s + pth(voluta(x - R - 1.4, y - .6, 2, 0, -1, 1), "none", bordo(OR.c, .9)) + pth(voluta(x + R + 1.4, y - .6, 2, Math.PI, 1, 1), "none", bordo(OR.c, .9)) + cer(x, y, 1.6, metP(OR), bordo(OR.c, .4));
  }
  function legnoV(x, y, w, h, c, seme, forza) {   // il fondo di legno con le venature in piedi (sfumato in su e in giù: niente giunte tra i pezzi)
    return rett(x, y, w, h, lin("lv" + c.slice(1), [[0, chiaro(c, .08)], [1, scuro(c, .1)]], 0, 0, 0, 1)) + venature(x, y, w, h, c, seme, Math.max(3, Math.round(w / 4)), true, forza || .9);
  }
  function zoccoloLegno(c, M) {   // il battiscopa di legno col listello di metallo
    return ombraSotto(186, 2, .2) + rett(0, 188, MW, 12, lin("zl" + c.slice(1), [[0, chiaro(c, .25)], [.3, c], [1, scuro(c, .35)]], 0, 0, 0, 1)) + filetto(187.4, 1.4, M) + rett(0, 199, MW, 1, scuro(c, .6));
  }

  // =========================================================
  //  I MURI (62 × 200)
  // =========================================================

  // ---- 1. GLI SPECCHI (bar e ristorante): la galleria degli specchi, archi di specchio nelle cornici d'oro ----
  var AVORIO = "#f0e2c4", NOCE = "#4e2817";
  function vetroSpecchio(nome, forma, x, y, w, h, notte) {   // il vetro dello specchio: argento, e dentro la sala riflessa (luci calde, il lampadario, il legno)
    var r = rnd(notte ? 977 : 971), c = "", i;
    if (notte) c += rett(x, y, w, h, lin("svn", [[0, "#7a6e66"], [.3, "#5a4d47"], [.65, "#3f3230"], [1, "#2c1f1c"]], 0, 0, .25, 1));   // di notte: bronzo scuro, la sala calda riflessa
    else c += rett(x, y, w, h, lin("svg", [[0, "#dfe2df"], [.3, "#c7cecf"], [.62, "#a0a9ac"], [1, "#858b8a"]], 0, 0, .25, 1));
    // la sala riflessa: il caldo delle luci e del legno, la riga scura della boiserie di fronte
    c += rett(x, y + h * .42, w, h * .58, lin("sr" + (notte ? "n" : ""), [[0, "#ffb54a", 0], [.45, "#e39a45", notte ? .42 : .34], [1, "#6a3519", notte ? .62 : .5]], 0, 0, 0, 1));
    c += rett(x, y + h * .8, w, h * .06, "#3b2213", op(notte ? .3 : .2)) + rett(x, y + h * .8, w, .5, "#ffe2a8", op(.35));
    // il lampadario di fronte, riflesso in alto (un alone caldo con le gocce che brillano)
    c += ell(x + w * .5, y + h * .34, w * .4, h * .12, rad("slp", [[0, "#fffbe8", notte ? 1 : .95], [.35, "#ffe1a0", notte ? .75 : .6], [1, "#ffc864", 0]], .5, .5, .5));
    c += tratto("M" + q(x + w * .3, y + h * .3) + " Q" + q(x + w * .5, y + h * .4) + " " + q(x + w * .7, y + h * .3), "#fff3cf", .7, op(.8));   // il giro di gocce
    for (i = 0; i < 7; i++) c += cer(x + w * (.3 + i * .0667), y + h * (.3 + .1 * (1 - Math.pow((i - 3) / 3, 2)) * .5) + .4, .6, "#fff", op(.95));
    // le altre luci della sala, tonde e sfocate
    var n = notte ? 10 : 6;
    for (i = 0; i < n; i++) {
      var bx = x + 3 + r() * (w - 6), by = y + h * .3 + r() * h * .6, br = 1.8 + r() * (notte ? 4 : 3);
      c += cer(bx, by, br, rad("bk", [[0, "#fff8e2", notte ? 1 : .9], [.4, "#ffd47e", notte ? .6 : .45], [1, "#ffc864", 0]], .5, .5, .5));
    }
    for (i = 0; i < (notte ? 6 : 3); i++) { var sx = x + 4 + r() * (w - 8), sy = y + 6 + r() * h * .8, sa = 2.2 + r() * 2; c += pth(stella4(sx, sy, sa, sa * .16), "#fff", op(.95)) + cer(sx, sy, sa * .3, "#fff"); }   // le scintille
    // i riflessi in diagonale (larghi e sottili) e l'ombra del vetro vicino alla cornice
    c += pth("M" + q(x + w * .62, y) + " L" + q(x + w * .92, y) + " L" + q(x + w * .12, y + h) + " L" + q(x - w * .18, y + h) + " Z", "#fff", op(notte ? .1 : .2));
    c += pth("M" + q(x + w * 1.02, y) + " L" + q(x + w * 1.1, y) + " L" + q(x + w * .3, y + h) + " L" + q(x + w * .22, y + h) + " Z", "#fff", op(notte ? .08 : .18));
    return dentro(nome, forma, c + forma.replace("/>", " fill='none' stroke='#2a2018' stroke-width='3.2' opacity='.22'/>"));
  }
  function bacchetta(d, M, k) { k = k || 1; return tratto(d, M.c, 2 * k) + tratto(d, M.m, 1.25 * k) + tratto(d, M.l, .42 * k, op(.85)); }   // un bastoncino d'oro (la grata dello specchio)
  function campanule(xc, y0, y1) {   // il nastro d'oro con le campanule (sulle lesene tra gli specchi)
    var s = tratto("M" + q(xc, y0) + " L" + q(xc, y1), OR.c, 1.5) + tratto("M" + q(xc, y0) + " L" + q(xc, y1), OR.m, .8), yy, i = 0;
    for (yy = y0 + 9; yy < y1 - 4; yy += 14, i++) s += pth("M" + q(xc, yy - 3.2) + " C" + q(xc + 2.5, yy - 1.5) + " " + q(xc + 2.1, yy + 1.9) + " " + q(xc, yy + 2.9) + " C" + q(xc - 2.1, yy + 1.9) + " " + q(xc - 2.5, yy - 1.5) + " " + q(xc, yy - 3.2) + " Z", i % 2 ? OR.m : OR.a, bordo(OR.c, .4));
    return s + cer(xc, y0, 1.9, metP(OR), bordo(OR.c, .45));
  }
  function specchi(notte) {
    var s = "", i, cx = 31, cy = 52, R = 22, x0 = cx - R, x1 = cx + R, y1 = 129, RF = R + 3.6;
    // il fondo: lacca avorio con un filo di grana
    s += rett(0, 0, MW, MH, lin("sav", [[0, "#e6d4b0"], [.25, AVORIO], [1, "#eadabb"]], 0, 0, 0, 1)) + granelli(60, MW, 130, 911, "#c4a982", .7, .2);
    // le lesene tra gli specchi (sul bordo, metà per pezzo): pannellino avorio col filo d'oro e le campanule
    var lesene = rett(-3.6, 44, 7.2, 82, lin("sle", [[0, "#fbf3e2"], [1, "#e7d5b2"]], 0, 0, 1, 0)) + rett(-3.6, 44, 7.2, 82, "none", "stroke='" + OR.c + "' stroke-width='1.2'") + rett(-3.6, 44, 7.2, 82, "none", "stroke='" + OR.m + "' stroke-width='.6'") + campanule(0, 49, 122) +
      rosetta(0, 33, 2.6) + ell(-4.2, 37, 2.6, 1, OR.a, bordo(OR.c, .35) + " transform='rotate(35 -4.2 37)'") + ell(4.2, 37, 2.6, 1, OR.a, bordo(OR.c, .35) + " transform='rotate(-35 4.2 37)'");
    s += inFila("les", lesene);
    // la cornice d'oro ad arco (con l'ombra sul muro)
    var fuori = "M" + q(cx - RF, y1 + 1) + " L" + q(cx - RF, cy) + " A" + RF + "," + RF + " 0 0 1 " + q(cx + RF, cy) + " L" + q(cx + RF, y1 + 1) + " Z";
    var vano = "M" + q(x0, y1) + " L" + q(x0, cy) + " A" + R + "," + R + " 0 0 1 " + q(x1, cy) + " L" + q(x1, y1) + " Z";
    var mezzo = "M" + q(cx - R - 1.8, y1 + 1) + " L" + q(cx - R - 1.8, cy) + " A" + (R + 1.8) + "," + (R + 1.8) + " 0 0 1 " + q(cx + R + 1.8, cy) + " L" + q(cx + R + 1.8, y1 + 1);
    s += sposta(1.1, 1.4, pth(fuori, "#000", op(.2))) + pth(fuori, metD(OR), bordo(L, .9));
    s += tratto(mezzo, OR.s, .7, op(.75)) + sposta(-.5, -.5, tratto(mezzo, OR.l, .45, op(.8)));
    // il vetro
    s += vetroSpecchio("vs", "<path d='" + vano + "'/>", x0, cy - R, 2 * R, y1 - cy + R, notte);
    // la grata d'oro: la raggiera nella lunetta, poi 3 colonne × 4 file di vetri smussati
    var cols = [x0, x0 + 2 * R / 3, x0 + 4 * R / 3, x1], file = [cy, cy + 19.25, cy + 38.5, cy + 57.75, y1], j, g = "";
    for (j = 0; j < 4; j++) for (i = 0; i < 3; i++) {   // lo smusso di ogni vetro: luce in alto a sinistra, ombra in basso a destra
      var px = cols[i], py = file[j], pw = cols[i + 1] - px, ph = file[j + 1] - py;
      g += rett(px + .9, py + .9, pw - 1.8, .55, "#fff", op(.55)) + rett(px + .9, py + .9, .55, ph - 1.8, "#fff", op(.4)) + rett(px + .9, py + ph - 1.45, pw - 1.8, .55, "#1d2c38", op(.22)) + rett(px + pw - 1.45, py + .9, .55, ph - 1.8, "#1d2c38", op(.18));
    }
    g += tratto("M" + q(cx - R + 1.2, cy) + " A" + (R - 1.2) + "," + (R - 1.2) + " 0 0 1 " + q(cx + R - 1.2, cy), "#fff", .5, op(.5));
    for (i = 1; i < 4; i++) { var a = Math.PI + i * Math.PI / 4; g += bacchetta("M" + q(cx + Math.cos(a) * 6, cy + Math.sin(a) * 6) + " L" + q(cx + Math.cos(a) * R, cy + Math.sin(a) * R), OR, .9); }
    g += bacchetta("M" + q(x0, cy) + " L" + q(x1, cy), OR, 1.1);
    [cols[1], cols[2]].forEach(function (x) { g += bacchetta("M" + q(x, cy) + " L" + q(x, y1), OR, .9); });
    [file[1], file[2], file[3]].forEach(function (y) { g += bacchetta("M" + q(x0, y) + " L" + q(x1, y), OR, .9); });
    g += pth("M" + q(cx - 6, cy) + " A6,6 0 0 1 " + q(cx + 6, cy) + " Z", metV(OR), bordo(OR.c, .7));   // il mozzo della raggiera
    for (i = 0; i < 5; i++) { var b2 = Math.PI + (i + .5) * Math.PI / 5; g += tratto("M" + q(cx + Math.cos(b2) * 1.5, cy + Math.sin(b2) * 1.5) + " L" + q(cx + Math.cos(b2) * 5.2, cy + Math.sin(b2) * 5.2), OR.s, .45); }
    [cols[1], cols[2]].forEach(function (x) { [file[1], file[2], file[3]].forEach(function (y) { g += cer(x, y, 1.7, metP(OR), bordo(OR.c, .4)); }); g += cer(x, cy, 1.5, metP(OR), bordo(OR.c, .4)); });
    s += dentro("vg", "<path d='" + vano + "'/>", g) + pth(vano, "none", bordo(OR.c, 1));
    s += conchiglia(cx, cy - RF + 3, 6.4);   // la conchiglia in cima all'arco
    // la mensola sotto lo specchio: piano chiaro, listelli d'oro, perline, ombra
    s += ombraSotto(137.4, 4, .32) + rett(0, 128.6, MW, 2.4, lin("sme", [[0, "#fff7e6"], [1, "#e2cfa6"]], 0, 0, 0, 1)) + rett(0, 128.4, MW, .5, L, op(.5)) + filetto(131, 1.7) + rett(0, 132.7, MW, 3, lin("smf", [[0, "#e9d6ad"], [1, "#b89b68"]], 0, 0, 0, 1)) + perline(134.2, .95) + filetto(135.6, 1.6) + rett(0, 137.2, MW, .5, L, op(.6));
    // sotto: la boiserie di noce col pannello e la cornicetta d'oro
    s += legnoV(0, 137.7, MW, 50, NOCE, 921) + riquadro(7, 144.5, 48, 36, chiaro(NOCE, .06), 2.8) + venature(9.8, 147.3, 42.4, 30.4, chiaro(NOCE, .06), 923, 9, false, 1);
    s += cornicePannello(12, 149.5, 38, 26, 3, 1.1) + rosetta(31, 162.5, 2.2) + inFila("lfo", rett(-.7, 137.7, 1.4, 50, metV(OR)) + rett(-.2, 137.7, .4, 50, OR.l, op(.6)));
    // in cima: la cornice champagne coi dentelli e le perline
    return s + cornicione("#dcc59a", true) + zoccoloLegno(NOCE);
  }

  // ---- 2. I NEON DI LAS VEGAS (slot e sala giochi): pannelli laccati scuri, le lampadine in cima, i tubi colorati ----
  var NE = { rosa: "#ff3da6", ciano: "#2ae0ff", giallo: "#ffe03c", viola: "#b65cff" };
  function tubo(d, col, k, notte) {   // un tubo al neon acceso: l'alone sul muro, il vetro colorato, l'anima bianca
    var s = "";
    if (notte) s += tratto(d, col, k * 11, op(.07)) + tratto(d, col, k * 7, op(.11));
    s += tratto(d, col, k * 4.4, op(notte ? .22 : .15)) + tratto(d, col, k * 2.5, op(notte ? .45 : .32));
    return s + tratto(d, chiaro(col, notte ? .3 : .12), k) + tratto(d, "#fff", k * .42, op(notte ? 1 : .85));
  }
  function morsetti(y, xs) { return xs.map(function (x) { return rett(x - .8, y - 2.3, 1.6, 4.6, "#3a3646", bordo("#0c0a12", .35) + " rx='.5'") + rett(x - .55, y - 2.1, .45, 4.2, "#c9c6d8", op(.6)); }).join(""); }   // i fermagli che tengono i tubi (si vedono sopra e sotto il vetro)
  function lampadina(x, y, forte, notte) {   // una lampadina del bordo luminoso (forte = accesa in pieno)
    var k = forte ? 1 : 0;
    return cer(x, y, forte ? (notte ? 6.4 : 5.2) : 3.8, rad("lg" + k, [[0, "#ffe9a0", forte ? (notte ? .7 : .5) : .3], [1, "#ffcf5a", 0]], .5, .5, .5)) +
      cer(x, y, 2.4, lin("lgz", [[0, "#e4e4ee"], [1, "#4e4e62"]], 0, 0, 0, 1), bordo("#120c18", .5)) +
      cer(x, y, 1.75, rad("lgv" + k, [[0, "#ffffff"], [.45, forte ? "#fff3b8" : "#ffe08a"], [1, forte ? "#ffc23a" : "#d9982c"]], .4, .38, .7)) + cer(x - .55, y - .6, .5, "#fff", op(.9));
  }
  function cromo(y, h, nome) { return rett(0, y, MW, h, lin(nome, [[0, "#f4f4fa"], [.35, "#b9b9c8"], [.6, "#6c6c80"], [1, "#2c2c3a"]], 0, 0, 0, 1)) + rett(0, y, MW, .45, "#fff", op(.8)); }   // una fascia cromata
  function neon(notte) {
    var s = "", i, sf = notte ? ["#170c2b", "#100722", "#090412"] : ["#2b1749", "#200f3a", "#170a2c"];
    s += rett(0, 0, MW, MH, lin("nf", [[0, sf[0]], [.5, sf[1]], [1, sf[2]]], 0, 0, 0, 1));
    // i pannelli laccati: due per pezzo, con la giunta e il lucido in diagonale
    [0, 31].forEach(function (x, n) {
      s += dentro("pn" + n, rq(x, 15, 31, 173), pth("M" + q(x + 12, 15) + " L" + q(x + 22, 15) + " L" + q(x - 6, 188) + " L" + q(x - 16, 188) + " Z", "#fff", op(notte ? .035 : .055)) + pth("M" + q(x + 27, 15) + " L" + q(x + 30, 15) + " L" + q(x + 2, 188) + " L" + q(x - 1, 188) + " Z", "#fff", op(notte ? .03 : .045)));
    });
    s += inFila("gn", rett(-.45, 15, .9, 173, "#05020a") + rett(.45, 15, .45, 173, "#fff", op(.08))) + rett(30.55, 15, .9, 173, "#05020a") + rett(31.45, 15, .45, 173, "#fff", op(.08));
    // il rombo grande al neon (rosa fuori, azzurro dentro, la stella gialla in mezzo): in fila fanno la catena di rombi
    s += cer(31, 84, 40, rad("nal", [[0, NE.rosa, notte ? .24 : .14], [.6, NE.viola, notte ? .1 : .06], [1, NE.viola, 0]], .5, .5, .5));
    s += morsetti(84, [4.4, 57.6, 13.9, 48.1]) + morsetti(52, [31]) + morsetti(116, [31]);   // (i fermagli stanno dietro ai tubi)
    s += tubo("M31,50 L58,84 L31,118 L4,84 Z", NE.rosa, 1.9, notte) + tubo("M31,61.5 L48.5,84 L31,106.5 L13.5,84 Z", NE.ciano, 1.55, notte);
    s += tubo(stella4(31, 84, 10, 1.9), NE.giallo, 1.5, notte);
    // tra un rombo e l'altro (sul bordo): il pallino giallo e i due trattini viola
    s += inFila("tr", tubo("M-2.4,84 A2.4,2.4 0 1 1 2.4,84 A2.4,2.4 0 1 1 -2.4,84", NE.giallo, 1.3, notte) + tubo("M0,62 L0,70 M0,98 L0,106", NE.viola, 1.3, notte));
    // le strisce: tre tubi sopra e tre sotto (azzurro, rosa, giallo / giallo, rosa, azzurro)
    [[27, NE.ciano], [33.5, NE.rosa], [40, NE.giallo], [128, NE.giallo], [134.5, NE.rosa], [141, NE.ciano]].forEach(function (v) { s += morsetti(v[0], [15.5, 46.5]) + tubo("M-2," + v[0] + " L64," + v[0], v[1], 1.45, notte); });
    // in cima: il bordo luminoso con le lampadine (una sì e una no più forti: sembrano correre)
    s += rett(0, 0, MW, 15.5, lin("nmq", [[0, "#3e0b26"], [1, "#1f0516"]], 0, 0, 0, 1)) + cromo(0, 2.6, "ncr1") + cromo(13, 2.6, "ncr2") + ombraSotto(15.6, 4, .45);
    for (i = 0; i < 8; i++) s += lampadina(3.875 + i * 7.75, 7.8, notte || i % 2 === 0, notte);
    // sotto: il corrimano cromato, il pannello nero lucido e la luce rosa che sale dal battiscopa
    s += cromo(146.5, 3, "ncr3") + ombraSotto(149.5, 3, .4) + rett(0, 149.5, MW, 37, lin("nbs", [[0, "#140a20"], [1, "#0b0612"]], 0, 0, 0, 1));
    s += inFila("gb", rett(-.45, 149.5, .9, 37, "#030106")) + rett(30.55, 149.5, .9, 37, "#030106");
    s += rett(0, 156, MW, 30, lin("nsu", [[0, NE.rosa, 0], [1, NE.rosa, notte ? .42 : .26]], 0, 0, 0, 1)) + tubo("M-2,183.2 L64,183.2", NE.rosa, 1.6, notte);
    s += tubo(stella4(15.5, 166, 4.6, .9), NE.ciano, 1.1, notte) + tubo(stella4(46.5, 166, 4.6, .9), NE.viola, 1.1, notte);   // le stelline tra un pannello e l'altro
    // il battiscopa d'acciaio scuro, col riflesso rosa del neon
    return s + rett(0, 186, MW, 14, lin("nzc", [[0, "#b7b4c6"], [.18, "#8b879e"], [.55, "#4a4658"], [1, "#24202e"]], 0, 0, 0, 1)) + rett(0, 186, MW, 3.2, lin("nzr", [[0, NE.rosa, notte ? .55 : .4], [1, NE.rosa, 0]], 0, 0, 0, 1)) + rett(0, 186, MW, .6, "#000", op(.6)) + rett(0, 192.6, MW, .45, "#fff", op(.25)) + rett(0, 199, MW, 1, "#15111d");
  }

  // ---- 3. LO SPORT (scommesse): blu notte coi fari dello stadio, le strisce bianche, il pallone e il ferro di cavallo, il prato ----
  function pallone(x, y, r) {   // il pallone da calcio: il pentagono nero in mezzo, le cuciture, i pentagoni sul bordo (schiacciati dalla curva)
    var pent = function (rr, a0) { var d = "", i; for (i = 0; i < 5; i++) { var a = a0 + i * 2 * Math.PI / 5; d += (i ? " L" : "M") + q(Math.cos(a) * rr, Math.sin(a) * rr); } return d + " Z"; };
    var N = "#1c1d26", c = sposta(x, y, pth(pent(r * .38, -Math.PI / 2), N)), i;
    for (i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / 5, b = a + Math.PI / 5, g = f2(a * 180 / Math.PI);
      c += tratto("M" + q(x + Math.cos(a) * r * .36, y + Math.sin(a) * r * .36) + " L" + q(x + Math.cos(a) * r * .72, y + Math.sin(a) * r * .72), N, r * .05);   // la cucitura verso il pentagono del bordo
      c += "<g transform='translate(" + q(x + Math.cos(a) * r * .95, y + Math.sin(a) * r * .95).replace(",", " ") + ") rotate(" + g + ") scale(.55 1)'>" + pth(pent(r * .42, Math.PI), N) + "</g>";
      c += tratto("M" + q(x + Math.cos(a + .43) * r * .96, y + Math.sin(a + .43) * r * .96) + " Q" + q(x + Math.cos(b) * r * .9, y + Math.sin(b) * r * .9) + " " + q(x + Math.cos(b + .4) * r * .96, y + Math.sin(b + .4) * r * .96), N, r * .045);   // il lato dell'esagono tra due pentagoni del bordo
    }
    return cer(x + .5, y + .7, r, "#000", op(.3)) + cer(x, y, r, rad("pbg", [[0, "#ffffff"], [.55, "#eef0f4"], [1, "#aeb5c4"]], .36, .3, .8)) + dentro("pb" + Math.round(x), "<circle cx='" + f2(x) + "' cy='" + f2(y) + "' r='" + f2(r) + "'/>", c + cer(x + r * .25, y + r * .3, r, rad("pbo", [[.6, "#000", 0], [1, "#000", .22]], .5, .5, .5))) +
      cer(x, y, r, "none", bordo("#141520", .6)) + ell(x - r * .38, y - r * .42, r * .26, r * .15, "#fff", op(.8) + " transform='rotate(-35 " + f2(x - r * .38) + " " + f2(y - r * .42) + ")'");
  }
  function ferroCavallo(x, y) {   // il ferro di cavallo d'oro, con le punte in su (porta fortuna)
    var d = "M" + q(x - 4.6, y - 4.2) + " L" + q(x - 4.6, y + .4) + " A4.6,4.6 0 0 0 " + q(x + 4.6, y + .4) + " L" + q(x + 4.6, y - 4.2), s = "";
    s += sposta(.5, .7, tratto(d, "#000", 3.4, op(.3))) + tratto(d, OR.c, 3.6) + tratto(d, lin("fcv", [[0, OR.l], [.4, OR.a], [1, OR.s]], 0, 0, 1, 1), 2.6);
    [[-4.6, -2.6], [-4.4, -.2], [-3.4, 2.6], [4.6, -2.6], [4.4, -.2], [3.4, 2.6]].forEach(function (p) { s += cer(x + p[0], y + p[1], .42, OR.c); });
    return s + rett(x - 6.1, y - 5.6, 3, 1.6, OR.m, bordo(OR.c, .4)) + rett(x + 3.1, y - 5.6, 3, 1.6, OR.m, bordo(OR.c, .4)) + tratto("M" + q(x - 5.2, y - 3) + " L" + q(x - 5.2, y + .2), "#fff", .4, op(.7));
  }
  function stemma(x, y, corpo) {   // il tondo blu col bordo bianco e il filo rosso
    return cer(x + .7, y + .9, 11, "#000", op(.25)) + cer(x, y, 11, "#f4f6fb", bordo("#0b1633", .7)) + cer(x, y, 9.6, "#c8202f") + cer(x, y, 8.9, rad("stb", [[0, "#2c4f9e"], [1, "#132a62"]], .4, .35, .75)) + corpo;
  }
  function erba(seme, y0, h) {   // i fili d'erba (a seme fisso, rientrano dai bordi)
    var r = rnd(seme), i, a = [], b = [];
    for (i = 0; i < 150; i++) { var x = r() * MW, y = y0 + 2 + r() * (h - 3), l = .9 + r() * 1.4, t = (r() - .5) * .8, dove = r() < .55 ? a : b; dove.push("M" + q(x, y) + " l" + q(t, -l)); if (x < 1) dove.push("M" + q(x + MW, y) + " l" + q(t, -l)); }
    return tratto(a.join(" "), "#245d1f", .45, op(.55)) + tratto(b.join(" "), "#a6e07e", .4, op(.45));
  }
  function sport() {
    var BL = "#16295e", s = "", i;
    s += rett(0, 0, MW, MH, lin("sbf", [[0, "#23428e"], [.4, BL], [.75, "#122453"], [1, "#0e1c44"]], 0, 0, 0, 1));
    s += granelli(70, MW, 112, 941, "#ffffff", .6, .07, false, 16);   // la trama del tessuto
    // i fasci di luce dei fari (deboli, a cono)
    for (i = 0; i < 4; i++) { var fx = 7.75 + i * 15.5; s += pth("M" + q(fx - 1.6, 12) + " L" + q(fx + 1.6, 12) + " L" + q(fx + 7.6, 96) + " L" + q(fx - 7.6, 96) + " Z", lin("fl", [[0, "#ffffff", .22], [1, "#ffffff", 0]], 0, 0, 0, 1)); }
    // in cima: la gronda bianca, la fila dei fari, il filo rosso
    s += rett(0, 0, MW, 3, lin("sgr", [[0, "#ffffff"], [1, "#c9d1e3"]], 0, 0, 0, 1)) + rett(0, 3, MW, 8.6, lin("sgb", [[0, "#0a1532"], [1, "#132554"]], 0, 0, 0, 1)) + rett(0, 11.6, MW, 2.4, "#f3f5fa") + rett(0, 14, MW, 1.2, "#c8202f") + rett(0, 15.2, MW, .5, "#060c1e", op(.6)) + ombraSotto(15.7, 4, .3);
    for (i = 0; i < 4; i++) {
      var lx = 7.75 + i * 15.5;
      s += cer(lx, 7.3, 5, rad("fa", [[0, "#ffffff", .55], [1, "#dfe9ff", 0]], .5, .5, .5)) + rett(lx - 3.4, 4.6, 6.8, 5.4, "#2a2f3c", bordo("#05070d", .5) + " rx='1'");
      [-1.8, 0, 1.8].forEach(function (d) { s += cer(lx + d, 6.4, .75, "#fffef4") + cer(lx + d, 8.4, .75, "#fffef4"); });
    }
    // le strisce bianche (come le maglie) e, sopra, i due tondi: il pallone e il ferro di cavallo
    s += ombraSotto(116.6, 3, .25) + rett(0, 96.6, MW, 2.4, "#f2f5fb") + rett(0, 101.4, MW, 9, lin("sst", [[0, "#ffffff"], [.7, "#eef1f8"], [1, "#c9d0e0"]], 0, 0, 0, 1)) + rett(0, 110.4, MW, 1.4, "#c8202f") + rett(0, 114.2, MW, 2.4, "#f2f5fb") + rett(0, 101.4, MW, .5, "#fff");
    s += stemma(15.5, 106.5, pallone(15.5, 106.5, 8.6)) + stemma(46.5, 106.5, ferroCavallo(46.5, 107.6));
    // il corrimano bianco
    s += ombraSotto(134.4, 3, .3) + rett(0, 127.6, MW, 6.8, lin("scr", [[0, "#ffffff"], [.5, "#e3e8f2"], [1, "#9aa6bf"]], 0, 0, 0, 1)) + rett(0, 127.2, MW, .5, "#060c1e", op(.6)) + rett(0, 130.6, MW, .8, BL, op(.8));
    // il prato: le strisce del tosaerba, i fili d'erba, la riga bianca di gesso
    s += rett(0, 134.4, MW, 52, "#3f9a3b");
    for (i = 0; i < 4; i++) s += rett(i * 15.5, 134.4, 15.5, 52, i % 2 ? lin("pr1", [[0, "#3a8f36"], [1, "#2f7a2c"]], 0, 0, 0, 1) : lin("pr0", [[0, "#52b04a"], [1, "#43993d"]], 0, 0, 0, 1));
    s += erba(951, 134.4, 52) + ombraSotto(134.4, 5, .35);
    s += rett(0, 144, MW, 2.6, "#f7f9f2") + granelli(40, MW, 2.4, 953, "#9fc79a", .5, .5, false, 144.1) + rett(0, 146.6, MW, .5, "#1f5e1c", op(.4));
    // il battiscopa bianco col filo blu
    return s + ombraSotto(184, 2.4, .25) + rett(0, 186.4, MW, 13.6, lin("sbt", [[0, "#ffffff"], [.5, "#e6eaf3"], [1, "#a5b0c6"]], 0, 0, 0, 1)) + rett(0, 186, MW, .6, "#0b1633", op(.7)) + rett(0, 191, MW, 1.3, BL) + rett(0, 199, MW, 1, "#2a3654");
  }

  // ---- 4. IL LEGNO SCURO E L'OTTONE (sala poker): mogano, borchie, i quattro semi in un medaglione, la sbarra d'ottone ----
  var MOGANO = "#3f1b10";
  function seme(tipo, x, y, k, col) {   // i semi delle carte (tutti simmetrici: si possono specchiare)
    var d;
    if (tipo === "cuori") d = "M" + q(x, y + 2.6 * k) + " C" + q(x - 1.2 * k, y + 1.5 * k) + " " + q(x - 3 * k, y + .2 * k) + " " + q(x - 3 * k, y - 1.1 * k) + " C" + q(x - 3 * k, y - 2.6 * k) + " " + q(x - 1 * k, y - 3 * k) + " " + q(x, y - 1.5 * k) + " C" + q(x + 1 * k, y - 3 * k) + " " + q(x + 3 * k, y - 2.6 * k) + " " + q(x + 3 * k, y - 1.1 * k) + " C" + q(x + 3 * k, y + .2 * k) + " " + q(x + 1.2 * k, y + 1.5 * k) + " " + q(x, y + 2.6 * k) + " Z";
    else if (tipo === "quadri") d = "M" + q(x, y - 3 * k) + " L" + q(x + 2.2 * k, y) + " L" + q(x, y + 3 * k) + " L" + q(x - 2.2 * k, y) + " Z";
    else if (tipo === "picche") d = "M" + q(x, y - 3 * k) + " C" + q(x + 1.2 * k, y - 1.7 * k) + " " + q(x + 3 * k, y - .6 * k) + " " + q(x + 3 * k, y + .8 * k) + " C" + q(x + 3 * k, y + 2.2 * k) + " " + q(x + 1.1 * k, y + 2.5 * k) + " " + q(x + .3 * k, y + 1.4 * k) + " L" + q(x + 1.1 * k, y + 3 * k) + " L" + q(x - 1.1 * k, y + 3 * k) + " L" + q(x - .3 * k, y + 1.4 * k) + " C" + q(x - 1.1 * k, y + 2.5 * k) + " " + q(x - 3 * k, y + 2.2 * k) + " " + q(x - 3 * k, y + .8 * k) + " C" + q(x - 3 * k, y - .6 * k) + " " + q(x - 1.2 * k, y - 1.7 * k) + " " + q(x, y - 3 * k) + " Z";
    else {   // fiori: tre palline e il gambo (prima tutto col bordo, poi sopra tutto pieno: resta solo il contorno di fuori)
      var parti = function (b) { return cer(x, y - 1.4 * k, 1.35 * k, col, b) + cer(x - 1.45 * k, y + .7 * k, 1.35 * k, col, b) + cer(x + 1.45 * k, y + .7 * k, 1.35 * k, col, b) + cer(x, y + .3 * k, .9 * k, col, b) + pth("M" + q(x - .35 * k, y + .2 * k) + " L" + q(x - 1 * k, y + 3 * k) + " L" + q(x + 1 * k, y + 3 * k) + " L" + q(x + .35 * k, y + .2 * k) + " Z", col, b); };
      return parti(bordo(OT.c, .9)) + parti("");
    }
    return pth(d, col, bordo(OT.c, .45));
  }
  function legnoScuro() {
    var c = MOGANO, cl = chiaro(MOGANO, .07), s = "", i;
    s += legnoV(0, 0, MW, MH, c, 961, 1.1);
    // il pannello alto in rilievo, col filo d'ottone dentro e gli angoli d'ottone avvitati
    s += riquadro(6.5, 22, 49, 98, cl, 3.2) + venature(9.7, 25.2, 42.6, 91.6, cl, 963, 13, true, 1.15) + rett(9.7, 25.2, 42.6, 91.6, lin("plu", [[0, "#fff", .1], [.45, "#fff", 0], [1, "#000", .14]], 0, 0, 1, 1));
    s += sposta(.5, .6, rett(13, 29, 36, 84, "none", "stroke='#000' stroke-width='1.3' opacity='.3'")) + rett(13, 29, 36, 84, "none", "stroke='" + OT.c + "' stroke-width='1.6'") + rett(13, 29, 36, 84, "none", "stroke='" + OT.m + "' stroke-width='.9'") + sposta(-.25, -.25, rett(13, 29, 36, 84, "none", "stroke='" + OT.l + "' stroke-width='.35' opacity='.8'"));
    [[13, 29, 1, 1], [49, 29, -1, 1], [13, 113, 1, -1], [49, 113, -1, -1]].forEach(function (a) {   // le squadrette agli angoli
      var x = a[0], y = a[1], sx = a[2], sy = a[3], d = "M" + q(x - sx * 1.2, y - sy * 1.2) + " L" + q(x + sx * 8, y - sy * 1.2) + " L" + q(x + sx * 8, y + sy * 1.6) + " L" + q(x + sx * 1.6, y + sy * 1.6) + " L" + q(x + sx * 1.6, y + sy * 8) + " L" + q(x - sx * 1.2, y + sy * 8) + " Z";
      s += sposta(.5, .6, pth(d, "#000", op(.3))) + pth(d, metD(OT), bordo(OT.c, .45)) + cer(x + sx * .2, y + sy * .2, .55, OT.c) + cer(x + sx * 5.6, y + sy * .2, .45, OT.c) + cer(x + sx * .2, y + sy * 5.6, .45, OT.c);
    });
    // il medaglione d'ottone coi quattro semi (picche, cuori, fiori, quadri)
    // il medaglione è una fiche: anello d'ottone, il bordo rosso con le tacche avorio, il centro avorio coi quattro semi
    var mx = 31, my = 71, RM = 14;
    s += tratto("M" + q(mx, 29.8) + " L" + q(mx, my - RM) + " M" + q(mx, my + RM) + " L" + q(mx, 112.2), OT.c, 1.3) + tratto("M" + q(mx, 29.8) + " L" + q(mx, my - RM) + " M" + q(mx, my + RM) + " L" + q(mx, 112.2), OT.m, .65);
    s += cer(mx + .9, my + 1.2, RM, "#000", op(.35)) + cer(mx, my, RM, metD(OT), bordo(OT.c, .6)) + cer(mx, my, RM - .9, "none", "stroke='" + OT.l + "' stroke-width='.35' opacity='.75'");
    s += cer(mx, my, 11.9, rad("mfr", [[0, "#d8323d"], [1, "#8c1620"]], .4, .35, .8), bordo(OT.s, .5));
    for (i = 0; i < 8; i++) s += gira(i * 45 + 22.5, mx, my, rett(mx - 1.7, my - 11.6, 3.4, 2.6, "#f6ead2", bordo("#7a1018", .3) + " rx='.5'"));
    s += cer(mx, my, 8.7, rad("mfa", [[0, "#fffaf0"], [.7, "#f1e3c6"], [1, "#d9c49c"]], .4, .35, .8), bordo(OT.s, .55)) + cer(mx, my, 7.9, "none", "stroke='" + OT.m + "' stroke-width='.4' opacity='.8'");
    s += seme("picche", mx, my - 4.3, .95, "#1b1b22") + seme("cuori", mx + 4.4, my, .92, "#c4212f") + seme("fiori", mx, my + 4.3, .95, "#1b1b22") + seme("quadri", mx - 4.4, my, .95, "#c4212f");
    s += ell(mx - 4.6, my - 6.6, 3.2, 1.3, "#fff", op(.5) + " transform='rotate(-35 " + f2(mx - 4.6) + " " + f2(my - 6.6) + ")'");
    // tra un pannello e l'altro (sul bordo): il filo d'ottone con le borchie
    var bordoP = rett(-.8, 18, 1.6, 104, metV(OT)) + rett(-.3, 18, .5, 104, OT.l, op(.6));
    for (i = 0; i < 7; i++) bordoP += borchia(0, 24 + i * 15.6, 1.35);
    s += inFila("fb", bordoP);
    // la sbarra d'ottone tonda coi suoi sostegni, sopra lo zoccolo scanalato
    s += ombraSotto(134.6, 3, .35) + rett(0, 122, MW, 12.6, lin("smr", [[0, chiaro(c, .2)], [.5, c], [1, scuro(c, .3)]], 0, 0, 0, 1)) + filetto(121.4, 1.3, OT) + rett(0, 134, MW, .6, scuro(c, .6));
    [15.5, 46.5].forEach(function (x) { s += sposta(.6, .8, rett(x - 2.1, 123.2, 4.2, 9, "#000", op(.3) + " rx='1'")) + rett(x - 2.1, 123.2, 4.2, 9, metD(OT), bordo(OT.c, .45) + " rx='1'") + cer(x, 130.4, .5, OT.c); });
    s += sposta(.4, 1.8, rett(0, 124.6, MW, 5.2, "#000", op(.32))) + rett(0, 124.2, MW, 5.4, lin("sbr", [[0, OT.l], [.22, "#fffbe8"], [.45, OT.a], [.75, OT.m], [1, OT.c]], 0, 0, 0, 1)) + rett(0, 125.2, MW, .7, "#fff", op(.9)) + rett(0, 129.2, MW, .4, OT.c);
    // lo zoccolo: listelli di mogano scanalati (dieci per pezzo), tra due fasce d'ottone
    s += rett(0, 134.6, MW, 51.4, scuro(c, .25));
    for (i = 0; i < 10; i++) {
      var xs = i * 6.2;
      s += rett(xs + .3, 137, 5.6, 47, lin("scn", [[0, chiaro(c, .16)], [.35, chiaro(c, .06)], [.75, c], [1, scuro(c, .3)]], 0, 0, 1, 0)) + venature(xs + .5, 137, 5.2, 47, c, 971 + i, 2, true, 1) + rett(xs + .9, 137.4, .5, 46, "#fff", op(.14));
    }
    s += filetto(135, 2, OT) + rett(0, 137, MW, .8, "#000", op(.3));
    // la fascia intarsiata sullo zoccolo: i quattro semi d'ottone (si vedono anche nella miniatura del menu)
    s += sposta(0, .8, rett(0, 142, MW, 15, "#000", op(.3))) + rett(0, 142, MW, 15, lin("sfi", [[0, chiaro(c, .1)], [.5, scuro(c, .15)], [1, scuro(c, .4)]], 0, 0, 0, 1)) + filetto(141.2, 1.1, OT) + filetto(156.6, 1.1, OT);
    ["picche", "cuori", "fiori", "quadri"].forEach(function (t, n) { var x = 7.75 + n * 15.5; s += "<g opacity='.4'>" + sposta(.4, .5, seme(t, x, 149.6, 1.35, "#000")) + "</g>" +seme(t, x, 149.6, 1.35, metD(OT)); });
    // la base di mogano e la lamina d'ottone in basso, con le viti
    s += rett(0, 184, MW, 6, lin("sbm", [[0, chiaro(c, .22)], [.4, c], [1, scuro(c, .4)]], 0, 0, 0, 1)) + rett(0, 183.6, MW, .6, "#000", op(.4));
    s += rett(0, 190, MW, 10, lin("slm", [[0, OT.a], [.3, OT.m], [.75, OT.s], [1, scuro(OT.s, .3)]], 0, 0, 0, 1)) + rett(0, 190, MW, .7, OT.c) + rett(0, 190.7, MW, .5, "#fff", op(.7)) + rett(0, 199, MW, 1, OT.c);
    [7.75, 23.25, 38.75, 54.25].forEach(function (x) { s += cer(x, 195, .95, OT.s, bordo(OT.c, .3)) + tratto("M" + q(x - .6, 195.4) + " L" + q(x + .6, 194.6), OT.c, .3) + cer(x - .3, 194.6, .25, "#fff", op(.8)); });
    // in cima: la cornice di mogano con le borchie d'ottone
    s += rett(0, 0, MW, 4, lin("lcc", [[0, chiaro(c, .25)], [1, c]], 0, 0, 0, 1)) + filetto(4, 1.8, OT) + rett(0, 5.8, MW, 6.2, lin("lcg", [[0, scuro(c, .5)], [.6, scuro(c, .1)], [1, chiaro(c, .2)]], 0, 0, 0, 1));
    for (i = 0; i < 16; i++) s += borchia(1.94 + i * 3.875, 8.9, 1.05);
    return s + filetto(12, 1.8, OT) + rett(0, 13.8, MW, .5, "#000", op(.5)) + ombraSotto(14.3, 6, .4);
  }

  var MURI_Z = [
    ["muro_specchi", "Specchi con le cornici d'oro", 140, specchi],
    ["muro_neon", "Neon di Las Vegas", 120, neon],
    ["muro_sport", "Blu dello stadio", 90, sport],
    ["muro_legno_scuro", "Legno scuro e ottone", 110, legnoScuro]
  ];
  MURI_Z.forEach(function (v) {
    var voce = { id: v[0], nome: v[1], dove: "dentro", prezzo: v[2], svg: function (opz) { var notte = !!(opz && opz.notte); return svg("zm_" + v[0] + (notte ? "_n" : ""), MW, MH, function () { return v[3](notte); }); } };
    if (v[0] === "muro_neon") voce.luce = [31, 84, 70, "#ff4fa8"];   // come i mobili: da dove esce la luce di ogni pezzo (il rombo rosa), per l'alone di notte
    K.muri.push(voce);
  });

  // =========================================================
  //  I PAVIMENTI (100 × 100)
  // =========================================================

  // ---- 5. LA MOQUETTE DI LAS VEGAS: viola, i nastri turchesi, i riccioli d'oro, le stelle rosa (stile anni '50) ----
  function moquetteVegas() {
    var c = { f: "#33105a", f2: "#4b1d7c", o: "#f4c54e", oS: "#9a6a16", t: "#21c8c2", tS: "#0c6670", t2: "#9df5ec", p: "#ff4dac", pS: "#9c1560", l: "#16052a", w: "#fff4dc" };
    var lc = function (w) { return "stroke='" + c.l + "' stroke-width='" + (w || .6) + "' stroke-linejoin='round'"; }, m = "", i;
    // le macchie lilla (fagioli e boomerang) sotto a tutto
    var fagiolo = "M-9,-2 C-10,-8 -2,-9 1,-5 C3,-2 7,-4 9,-1 C11,3 6,8 0,7 C-5,6 -8,3 -9,-2 Z";
    [[16, 56, 1.9, 20], [66, 82, 1.6, -35], [92, 46, 1.3, 70], [40, 16, 1.2, 160]].forEach(function (b) { m += "<g transform='translate(" + b[0] + " " + b[1] + ") rotate(" + b[3] + ") scale(" + b[2] + ")'>" + pth(fagiolo, c.f2) + pth("M-6,-1 C-6,-5 -1,-6 1,-3", "none", "stroke='#8a4cc4' stroke-width='1' stroke-linecap='round' opacity='.7'") + "</g>"; });
    // le code di cometa (turchesi e rosa): grosse in mezzo e a punta in fondo, col filo chiaro sul dorso e i puntini d'oro
    function cometa(p, w, col, colS, colL, nome) {
      var sx = [], dx = [], dorso = "", k;
      for (k = 0; k <= 24; k++) {
        var t = k / 24, u = 1 - t, bx = u * u * u * p[0] + 3 * u * u * t * p[2] + 3 * u * t * t * p[4] + t * t * t * p[6], by = u * u * u * p[1] + 3 * u * u * t * p[3] + 3 * u * t * t * p[5] + t * t * t * p[7];
        var tx = 3 * u * u * (p[2] - p[0]) + 6 * u * t * (p[4] - p[2]) + 3 * t * t * (p[6] - p[4]), ty = 3 * u * u * (p[3] - p[1]) + 6 * u * t * (p[5] - p[3]) + 3 * t * t * (p[7] - p[5]), ln = Math.sqrt(tx * tx + ty * ty) || 1;
        var hw = w * Math.pow(Math.sin(Math.PI * t), .8) * (.55 + .45 * t), nx = -ty / ln * hw, ny = tx / ln * hw;
        sx.push(q(bx + nx, by + ny)); dx.unshift(q(bx - nx, by - ny)); dorso += (k ? " L" : "M") + q(bx + nx * .55, by + ny * .55);
      }
      var forma = "M" + sx.join(" L") + " L" + dx.join(" L") + " Z";
      return pth(forma, lin(nome, [[0, colL], [.45, col], [1, colS]], 0, 0, 1, 1), bordo(c.l, .8)) + tratto(dorso, "#fff", .8, op(.55)) + tratto(dorso, c.o, .9, op(.95) + " stroke-dasharray='.1 3.6'");
    }
    m += cometa([-8, 36, 6, 4, 34, 2, 54, 24], 6.4, c.t, c.tS, c.t2, "ct1");
    m += cometa([46, 86, 58, 60, 84, 56, 106, 74], 5.8, c.t, c.tS, c.t2, "ct1");
    m += cometa([0, 72, 8, 52, 28, 90, 40, 70], 4.6, c.p, c.pS, "#ffc2e2", "cp1");
    // i riccioli d'oro (a esse, con la punta a spirale)
    var riccio = tratto(voluta(-5, 0, 5, 0, 1, 1.15), c.l, 3) + tratto(voluta(5, 0, 5, Math.PI, 1, 1.15), c.l, 3) + tratto("M-5,-5 C-1,-5 1,5 5,5", c.l, 3) +
      tratto(voluta(-5, 0, 5, 0, 1, 1.15), c.o, 1.9) + tratto(voluta(5, 0, 5, Math.PI, 1, 1.15), c.o, 1.9) + tratto("M-5,-5 C-1,-5 1,5 5,5", c.o, 1.9) + cer(-5, 0, 1.1, c.o, lc(.4)) + cer(5, 0, 1.1, c.o, lc(.4));
    [[57, 51, 1.25, 25], [92, 50, .95, -60], [18, 92, 1, 100], [80, 6, .9, -20], [8, 44, .8, 60]].forEach(function (b) { m += "<g transform='translate(" + b[0] + " " + b[1] + ") rotate(" + b[3] + ") scale(" + b[2] + ")'>" + riccio + "</g>"; });
    // le stelle a raggiera rosa (otto punte lunghe e corte, il pallino d'oro in mezzo e in punta)
    function raggiera(cx, cy, R, n) {
      var s = "", d = "", k;
      for (k = 0; k < n * 2; k++) { var a = k * Math.PI / n, rr = k % 2 ? R * .32 : (k % 4 ? R * .72 : R); d += (k ? " L" : "M") + q(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      s += pth(d + " Z", rad("rg", [[0, "#ffe27a"], [.3, "#ff8bc8"], [1, c.p]], .5, .5, .5), lc(.7)) + pth(d + " Z", "none", "stroke='#ffd0ea' stroke-width='.4' opacity='.6' transform='translate(-.3 -.3)'");
      for (k = 0; k < n; k += 2) { var b = k * 2 * Math.PI / n / 2 * 2; s += cer(cx + Math.cos(b) * R * 1.12, cy + Math.sin(b) * R * 1.12, R * .1, c.o, lc(.35)); }
      return s + cer(cx, cy, R * .22, c.o, lc(.5)) + cer(cx - R * .06, cy - R * .06, R * .08, "#fff", op(.8));
    }
    m += raggiera(82, 30, 13.5, 8) + raggiera(26, 47, 8, 8) + raggiera(64, 94, 7, 8) + raggiera(46, 4, 4.8, 4) + raggiera(4, 86, 4.4, 4);
    // gli atomi: l'anello turchese col pallino d'oro
    [[40, 34, 3.6], [94, 92, 3], [12, 12, 2.6]].forEach(function (a) { m += cer(a[0], a[1], a[2], "none", "stroke='" + c.l + "' stroke-width='2.4'") + cer(a[0], a[1], a[2], "none", "stroke='" + c.t + "' stroke-width='1.4'") + cer(a[0], a[1], a[2] * .38, c.o, lc(.35)); });
    // le scintille bianche e i coriandoli (turchesi, oro, rosa)
    [[40, 56, 3.4], [74, 44, 2.8], [14, 22, 2.6], [96, 70, 2.6], [30, 98, 2.4], [62, 30, 2.2]].forEach(function (p) { m += pth(stella4(p[0], p[1], p[2], p[2] * .2), c.w, lc(.3)); });
    var r = rnd(981), col = [c.t, c.o, c.p, c.t2];
    for (i = 0; i < 34; i++) m += cer(r() * 100, r() * 100, .9 + r() * 1.2, col[i % 4], lc(.35));
    var s = rett(0, 0, 100, 100, c.f) + piastrella("mv", m);
    // il pelo della moquette
    return s + granelli(650, 100, 100, 983, c.l, .8, .25, true) + granelli(420, 100, 100, 985, "#e9c8ff", .7, .1, true);
  }

  // ---- 6. LA MOQUETTE VERDE (sala poker): verde scuro, la rete di rombi d'oro, i fiorellini ----
  function moquetteVerde() {
    var c = { f: "#0f3b29", f2: "#0b2e20", o: "#e2b54c", oS: "#8a6418", oL: "#ffe7a0", r: "#a3242b", l: "#04150c" };
    var lc = function (w) { return "stroke='" + c.l + "' stroke-width='" + (w || .5) + "' stroke-linejoin='round'"; }, m = "", i;
    // dentro ogni rombo: il campo più scuro con il filo d'oro sottile (i quadrati del disegno, nella vista diventano rombi)
    [[0, 0], [50, 0], [0, 50], [50, 50]].forEach(function (p) {
      m += rett(p[0] - 20.5, p[1] - 20.5, 41, 41, c.f2) + rett(p[0] - 17, p[1] - 17, 34, 34, "none", "stroke='" + c.o + "' stroke-width='.7' opacity='.75'");
    });
    // la rete: doppio filo d'oro
    [25, 75].forEach(function (v) {
      m += rett(v - 3.4, -2, 1.5, 104, c.o, lc(.35)) + rett(v + 1.9, -2, 1.5, 104, c.o, lc(.35)) + rett(-2, v - 3.4, 104, 1.5, c.o, lc(.35)) + rett(-2, v + 1.9, 104, 1.5, c.o, lc(.35));
      m += rett(v - .5, -2, 1, 104, c.r, op(.85)) + rett(-2, v - .5, 104, 1, c.r, op(.85));
    });
    // agli incroci: la rosetta d'oro col cuore rosso
    var ros = "", k;
    for (k = 0; k < 8; k++) { var a = k * Math.PI / 4; ros += ell(Math.cos(a) * 3.4, Math.sin(a) * 3.4, 2.1, 1.1, k % 2 ? c.oS : c.o, lc(.35) + " transform='rotate(" + f2(k * 45) + " " + f2(Math.cos(a) * 3.4) + " " + f2(Math.sin(a) * 3.4) + ")'"); }
    ros += cer(0, 0, 2.6, c.o, lc(.45)) + cer(0, 0, 1.4, c.r) + cer(-.5, -.5, .45, c.oL);
    [[25, 25], [75, 25], [25, 75], [75, 75]].forEach(function (p) { m += sposta(p[0], p[1], ros); });
    // in mezzo a ogni rombo: il fiore a quattro petali, le foglioline e il rombino d'oro
    var fio = rett(-6.5, -6.5, 13, 13, "none", "stroke='" + c.o + "' stroke-width='.9'");
    for (k = 0; k < 4; k++) fio += gira(k * 90, 0, 0, pth("M0,-1.6 C2.4,-3.4 2.2,-7.4 0,-9 C-2.2,-7.4 -2.4,-3.4 0,-1.6 Z", c.o, lc(.4)) + tratto("M0,-2.4 L0,-7.6", c.oS, .4)) + gira(45 + k * 90, 0, 0, ell(0, -6.4, 1.1, 2.2, "#3f8a4e", lc(.3)));
    fio += cer(0, 0, 2.2, c.r, lc(.4)) + cer(0, 0, .9, c.o);
    [[0, 0], [50, 0], [0, 50], [50, 50]].forEach(function (p) { m += sposta(p[0], p[1], fio); });
    var s = rett(0, 0, 100, 100, c.f) + piastrella("mg", m);
    return s + granelli(700, 100, 100, 991, c.l, .8, .25, true) + granelli(450, 100, 100, 993, "#bfe8c8", .7, .09, true);
  }

  // ---- 7. LA MOQUETTE BLU (bingo e scommesse): blu reale coi cerchi d'oro intrecciati e i fregi color crema ----
  function moquetteBlu() {
    var c = { f: "#2147a6", f2: "#163583", f3: "#2c56bd", o: "#e9bd57", oS: "#8f6418", cr: "#f6e7c4", r: "#c2263a", l: "#0a1745" };
    var lc = function (w) { return "stroke='" + c.l + "' stroke-width='" + (w || .5) + "' stroke-linejoin='round'"; }, m = "", k;
    // le lenti (dove due cerchi si sovrappongono): un blu più scuro con la foglia d'oro
    var lenti = "";
    [[0, 0], [100, 0], [0, 100], [100, 100]].forEach(function (p) { lenti += cer(p[0], p[1], 50, c.f2); });
    m += dentro("cb", "<circle cx='50' cy='50' r='50'/>", lenti);
    [[25, 25, -45], [75, 25, 45], [25, 75, 45], [75, 75, -45]].forEach(function (p) {   // la foglia d'oro lungo la lente, coi riccioli in punta
      var x = p[0], y = p[1];
      m += gira(p[2], x, y, pth("M" + q(x - 17, y) + " C" + q(x - 8, y - 4.6) + " " + q(x + 8, y - 4.6) + " " + q(x + 17, y) + " C" + q(x + 8, y + 4.6) + " " + q(x - 8, y + 4.6) + " " + q(x - 17, y) + " Z", c.o, lc(.5)) +
        tratto("M" + q(x - 13, y) + " L" + q(x + 13, y), c.cr, .9, op(.95)) + [-7, 0, 7].map(function (d) { return tratto("M" + q(x + d - 2, y - 2.2) + " L" + q(x + d, y) + " L" + q(x + d - 2, y + 2.2), c.oS, .5); }).join("") +
        tratto(voluta(x - 20.4, y - 1.6, 2.2, 0, -1, 1), c.o, .9) + tratto(voluta(x + 20.4, y - 1.6, 2.2, Math.PI, 1, 1), c.o, .9));
    });
    // i cerchi: filo d'oro con l'anima crema, e dentro un secondo filo crema sottile
    var cerchi = "<circle cx='50' cy='50' r='50'/><circle cx='0' cy='0' r='50'/><circle cx='100' cy='0' r='50'/><circle cx='0' cy='100' r='50'/><circle cx='100' cy='100' r='50'/>";
    var dentroC = "<circle cx='50' cy='50' r='45.6'/><circle cx='0' cy='0' r='45.6'/><circle cx='100' cy='0' r='45.6'/><circle cx='0' cy='100' r='45.6'/><circle cx='100' cy='100' r='45.6'/>";
    m += "<g fill='none' stroke='" + c.cr + "' stroke-width='.7' opacity='.7' stroke-dasharray='.1 2.2' stroke-linecap='round'>" + dentroC + "</g>";
    m += "<g fill='none' stroke='" + c.l + "' stroke-width='2.8'>" + cerchi + "</g><g fill='none' stroke='" + c.o + "' stroke-width='1.9'>" + cerchi + "</g><g fill='none' stroke='" + c.cr + "' stroke-width='.45' opacity='.8'>" + cerchi + "</g>";
    // dove si toccano tre cerchi: il pallino d'oro
    [[50, 0], [0, 50], [100, 50], [50, 100]].forEach(function (p) { m += cer(p[0], p[1], 2.2, c.o, lc(.45)) + cer(p[0], p[1], .9, c.r); });
    // il fregio in mezzo: quattro gigli crema verso i lati e la rosa rossa
    var giglio = pth("M0,-4 C1.6,-6 1.6,-10 0,-14 C-1.6,-10 -1.6,-6 0,-4 Z", c.cr, lc(.4)) + pth("M0,-5 C3.4,-6 6,-9 5.4,-13 C3.6,-10.6 2,-9.4 .6,-9 Z", c.o, lc(.35)) + pth("M0,-5 C-3.4,-6 -6,-9 -5.4,-13 C-3.6,-10.6 -2,-9.4 -.6,-9 Z", c.o, lc(.35)) + rett(-2.2, -5.4, 4.4, 1.3, c.o, lc(.3));
    var fregio = "";
    for (k = 0; k < 4; k++) fregio += gira(k * 90, 0, 0, giglio) + gira(45 + k * 90, 0, 0, ell(0, -8.4, 1.3, 2.4, c.cr, lc(.3)));
    for (k = 0; k < 16; k++) { var ak = k * Math.PI / 8 + Math.PI / 16; fregio += cer(Math.cos(ak) * 13.6, Math.sin(ak) * 13.6, .7, c.cr, op(.9)); }   // il giro di perline crema
    fregio += cer(0, 0, 3.6, c.o, lc(.5)) + cer(0, 0, 2.3, c.r) + cer(-.6, -.6, .6, "#fff", op(.7));
    m += sposta(50, 50, "<g transform='scale(1.35)'>" + fregio + "</g>");
    // agli angoli (il centro dei cerchi di fianco): la rosa d'oro e crema
    var rosa = "";
    for (k = 0; k < 8; k++) rosa += gira(k * 45, 0, 0, ell(0, -4.6, 1.6, 3, k % 2 ? c.cr : c.o, lc(.35)));
    rosa += cer(0, 0, 2.3, c.r, lc(.4)) + cer(0, 0, .9, c.o);
    for (k = 0; k < 4; k++) rosa += gira(k * 90, 0, 0, pth("M0,-9 C1.6,-11 1.6,-14 0,-16.5 C-1.6,-14 -1.6,-11 0,-9 Z", c.o, lc(.35)));   // le punte verso i lati
    m += "<g transform='scale(1.25)'>" + rosa + "</g>";
    var s = rett(0, 0, 100, 100, c.f) + piastrella("mb", m);
    return s + granelli(700, 100, 100, 1001, c.l, .8, .22, true) + granelli(450, 100, 100, 1003, "#cfe0ff", .7, .1, true);
  }

  function lucentezza(seme, col, o) {   // due macchie di luce morbide e allungate per mattonella (stese 3 × 3: rientrano dai bordi)
    var r = rnd(seme), m = "", i, g = rad("lz" + seme, [[0, col, o], [.6, col, o * .35], [1, col, 0]], .5, .5, .5);
    for (i = 0; i < 2; i++) { var x = 20 + i * 50 + r() * 14, y = 18 + i * 46 + r() * 14; m += ell(x, y, 26, 11, g, "transform='rotate(45 " + f2(x) + " " + f2(y) + ")'"); }
    return piastrella("lzt" + seme, m);   // (nome diverso dalla sfumatura: con lo stesso id il riflesso spariva)
  }
  // ---- 8. IL PARQUET SCURO A SPINA DI PESCE (bar e ristorante): noce lucido, assi 12,5 × 50 ----
  function asse(x, y, w, h, c, seme, vert, lucido) {   // un'asse: il colore, le venature lungo il verso, lo smusso, la fuga
    var g = vert ? lin("av" + c.slice(1), [[0, chiaro(c, .12)], [.5, c], [1, scuro(c, .14)]], 0, 0, 1, 0) : lin("ah" + c.slice(1), [[0, chiaro(c, .12)], [.5, c], [1, scuro(c, .14)]], 0, 0, 0, 1);
    var s = rett(x, y, w, h, g) + venature(x + .3, y + .3, w - .6, h - .6, c, seme, vert ? 3 : 3, vert, 1.4);
    if (lucido) { var lu = Math.round(lucido * 20) / 20; s += rett(x, y, w, h, lin("al" + (vert ? "v" : "h") + Math.round(lu * 100), [[0, "#fff", lu], [.5, "#fff", 0], [1, "#fff", 0]], 0, 0, vert ? 0 : 1, vert ? 1 : 0)); }   // il lucido che scorre lungo l'asse
    return s + rett(x + .3, y + .3, w - .6, .45, "#fff", op(.22)) + rett(x + .3, y + .3, .45, h - .6, "#fff", op(.16)) + rett(x, y, w, h, "none", "stroke='" + scuro(c, .6) + "' stroke-width='.55'");
  }
  function parquetScuro() {
    var W = 12.5, LG = 50, toni = ["#53301b", "#462714", "#5f3720", "#3e2111", "#4f2c18", "#683f24", "#4a2915"], s = rett(0, 0, 100, 100, "#160904"), i, j, v;
    // la spina di pesce: le assi stese (a scala) e quelle in piedi, ripetute con i passi (12,5 ; 12,5) e (50 ; −50)
    for (i = -14; i <= 18; i++) for (j = -4; j <= 4; j++) for (v = 0; v < 2; v++) {
      var x = i * W + j * LG + (v ? LG : 0), y = i * W - j * LG + (v ? W - LG : 0), w = v ? W : LG, h = v ? LG : W;
      if (x >= 100 || y >= 100 || x + w <= 0 || y + h <= 0) continue;
      var kx = ((x % 100) + 100) % 100, ky = ((y % 100) + 100) % 100, r = rnd(Math.round(kx * 8 + ky * 1301) + v * 7919 + 11);
      s += asse(x, y, w, h, scegli(r, toni), Math.floor(r() * 9999) + 1, v, .08 + r() * .1);
    }
    // la cera lucida: i riflessi morbidi delle luci (rientrano dai bordi: niente giunte tra le mattonelle)
    return s + lucentezza(1201, "#ffe8c4", .1);
  }

  // ---- 9. IL LEGNO DEL PALCO: assi chiare di acero lucidato, le giunte sfalsate, le viti ----
  function legnoPalco() {
    var W = 12.5, toni = ["#e4b977", "#dcb06c", "#eac487", "#d6a663", "#efcd93", "#e0b472"], s = rett(0, 0, 100, 100, "#7a5126"), j;
    var giunte = [[38], [], [80], [12, 64], [], [46], [92], [26]];   // dove finisce un'asse e ne comincia un'altra (riga per riga)
    for (j = 0; j < 8; j++) {
      var y = j * W, g = giunte[j], tagli = g.length ? g.slice() : [], pezzi = [], k;
      if (!tagli.length) pezzi.push([-2, 104]);
      else { for (k = 0; k < tagli.length; k++) pezzi.push([tagli[k], (k + 1 < tagli.length ? tagli[k + 1] : tagli[0] + 100)]); }
      pezzi.forEach(function (p, n) {
        var r = rnd(1101 + j * 17 + n * 5), c = scegli(r, toni), x0 = p[0], x1 = p[1];
        (g.length ? [0, -100] : [0]).forEach(function (dx) {   // l'asse che esce a destra rientra da sinistra (senza giunte: un'asse sola, lunga)
          if (x1 + dx <= 0 || x0 + dx >= 100) return;
          s += asse(x0 + dx, y, x1 - x0, W, c, 1111 + j * 13 + n * 7, false, g.length ? .16 : 0);   // (l'asse lunga senza giunte: niente lucido in punta, se no si vedrebbe il bordo della mattonella)
        });
      });
      // le viti: due per asse sopra ogni trave (a 25 e a 75) e vicino alle giunte
      [25, 75].forEach(function (x) { s += cer(x, y + 3.6, .55, "#6a4520") + cer(x, y + 8.9, .55, "#6a4520") + cer(x - .15, y + 3.45, .2, "#fff", op(.6)) + cer(x - .15, y + 8.75, .2, "#fff", op(.6)); });
      g.forEach(function (x) { [x - 1.6, x + 1.6].forEach(function (xx) { var xm = ((xx % 100) + 100) % 100; s += cer(xm, y + 3.6, .5, "#6a4520") + cer(xm, y + 8.9, .5, "#6a4520"); }); });
    }
    // la vernice lucida: i riflessi morbidi delle luci
    return s + lucentezza(1203, "#fff", .1);
  }

  var PAV_Z = [
    ["moquette_vegas", "Moquette pazza di Las Vegas", 60, moquetteVegas],
    ["moquette_verde", "Moquette verde coi rombi d'oro", 55, moquetteVerde],
    ["moquette_blu_reale", "Moquette blu reale", 55, moquetteBlu],   // (non "moquette_blu" né "parquet_scuro": quei nomi ci sono già nel kit della casa)
    ["parquet_spina", "Parquet scuro a spina di pesce", 90, parquetScuro],
    ["legno_palco", "Assi chiare del palco", 70, legnoPalco]
  ];
  PAV_Z.forEach(function (v) { K.pavimenti.push({ id: v[0], nome: v[1], dove: "dentro", prezzo: v[2], svg: function () { return svg("zv_" + v[0], 100, 100, v[3]); } }); });
})();

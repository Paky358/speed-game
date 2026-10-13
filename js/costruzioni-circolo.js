/* =========================================================
   SPeeD GAME — I MATERIALI DEL CIRCOLO (si aggiungono a SGKit)
   Stesso contratto di js/costruzioni-arte.js (va caricato dopo):
   - muri: pezzo 62 × 200 che si ripete in orizzontale (le giunte tra un pezzo e l'altro cadono a metà
     di una perlina, di una piastrella o di una pietra, così in fila non si vedono)
   - pavimenti: quadrato 100 × 100 che si ripete nei due versi (quello che esce da un bordo rientra dall'altro)
   - porte: 62 × 200 trasparente attorno; opz.notte: vetri accesi
   Modello: il circolo ricreativo di paese (anni '60-'80, tenuto bene): perline e intonaco crema, il giallo
   caldo con la fascia dipinta, le piastrelle verdi del bar, la pietra del cortile; la graniglia a disegni,
   il cotto a spina di pesce, le assi consumate, la ghiaia chiara; la porta di noce coi vetri stampati.
   Attenzione ai nomi: "cotto" c'è già nel kit della casa (e il gioco prende il primo con quel nome),
   per questo qui si chiama "cotto_toscano".
   ========================================================= */
(function () {
  "use strict";
  var K = window.SGKit;
  if (!K) return;

  // ---------- attrezzi (come nel kit; gli id hanno un prefisso tutto loro) ----------
  var nId = 0, P = "", DEFS = [], FATTI = {}, PRONTI = {};
  var SEGNO = "§r§";
  var L = "#5a3a22", MW = 62, MH = 200;
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
  function tondo(a, k) {   // un poligono con gli angoli smussati
    var n = a.length, d = "", i;
    for (i = 0; i < n; i++) {
      var p0 = a[(i + n - 1) % n], p1 = a[i], p2 = a[(i + 1) % n];
      var l1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1, l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
      var k1 = Math.min(k, l1 * .45) / l1, k2 = Math.min(k, l2 * .45) / l2;
      d += (i ? " L" : "M") + q(p1[0] + (p0[0] - p1[0]) * k1, p1[1] + (p0[1] - p1[1]) * k1) + " Q" + q(p1[0], p1[1]) + " " + q(p1[0] + (p2[0] - p1[0]) * k2, p1[1] + (p2[1] - p1[1]) * k2);
    }
    return d + " Z";
  }
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
      PRONTI[chiave] = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " " + h + "' width='" + w + "' height='" + h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + b + "</svg>";
    }
    return PRONTI[chiave].split(SEGNO).join("kcr" + (++nId) + "_");
  }
  // una cosa vicino al bordo si ridisegna anche dall'altra parte (così la giunta non si vede); H = 0: solo in orizzontale
  function giro(x, y, r, W, H, fn) {
    var xs = [x], ys = [y], s = "";
    if (x - r < 0) xs.push(x + W); if (x + r > W) xs.push(x - W);
    if (H) { if (y - r < 0) ys.push(y + H); if (y + r > H) ys.push(y - H); }
    xs.forEach(function (a) { ys.forEach(function (b) { s += fn(a, b); }); });
    return s;
  }
  function puntini(a, col, w, o) {   // tanti puntini in un tratto solo
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
  function macchieMorbide(n, W, H, seme, cC, cS, rMin, rMax, o, dueVersi) {   // macchie morbide chiare e scure
    var r = rnd(seme), gC = rad("cz" + cC.slice(1), [[0, cC, 1], [1, cC, 0]], .5, .5, .5), gS = rad("cz" + cS.slice(1), [[0, cS, 1], [1, cS, 0]], .5, .5, .5), s = "", i;
    for (i = 0; i < n; i++) (function (x, y, rx, k, g, oo) {
      s += giro(x, y, rx, W, dueVersi ? H : 0, function (a, b) { return ell(a, b, rx, rx * k, g, op(oo)); });
    })(r() * W, r() * H, rMin + r() * (rMax - rMin), .45 + r() * .5, r() < .5 ? gC : gS, o * (.5 + r() * .5));
    return s;
  }
  // la sfumatura sopra un mattone, una pietra: chiaro in alto a sinistra, scuro in basso a destra
  function luce(k) { k = k || 1; return lin("lu" + Math.round(k * 10), [[0, "#fff", .32 * k], [.4, "#fff", 0], [.62, "#000", 0], [1, "#000", .26 * k]], 0, 0, .3, 1); }
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
  function nodo(x, y, c, k) {   // un nodo del legno
    k = k || 1;
    return ell(x, y, 5.2 * k, 3.2 * k, "none", "stroke='" + scuro(c, .35) + "' stroke-width='.6' opacity='.4'") + ell(x, y, 3.4 * k, 2.2 * k, scuro(c, .25), "stroke='" + scuro(c, .45) + "' stroke-width='.6'") + ell(x - .3 * k, y - .2 * k, 1.5 * k, .9 * k, scuro(c, .55));
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
  // una pietra: bordo scuro sotto, faccia chiara un po' in alto a sinistra, puntini e qualche crepa
  function sasso(pts, c, seme, k) {
    var cx = 0, cy = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, r = rnd(seme), s, i;
    pts.forEach(function (p) { cx += p[0]; cy += p[1]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    cx /= pts.length; cy /= pts.length;
    var fac = pts.map(function (p) { return [cx + (p[0] - cx) * .9 - .45, cy + (p[1] - cy) * .86 - .65]; }), d = tondo(fac, k * .9);
    s = pth(tondo(pts, k), scuro(c, .32), "stroke='" + L + "' stroke-width='.8' stroke-opacity='.45' stroke-linejoin='round'") + pth(d, c) + pth(d, luce(1));
    for (i = 0; i < 6; i++) s += cer(cx + (r() - .5) * (x1 - x0) * .6, cy + (r() - .5) * (y1 - y0) * .55, .35 + r() * .5, r() < .65 ? scuro(c, .3) : chiaro(c, .45), op(.6));
    if (r() < .3) { var ax = cx + (r() - .5) * (x1 - x0) * .4, ay = y0 + (y1 - y0) * (.3 + r() * .3); s += tratto("M" + q(ax, ay) + " l" + q(2 + r() * 3, 1 + r() * 2) + " l" + q(2 + r() * 2, -1 + r() * 2), scuro(c, .4), .5, op(.6)); }
    return s + tratto("M" + q(fac[0][0] + 1.4, fac[0][1] + .9) + " L" + q(fac[1][0], fac[1][1] + .9), "#fff", .8, op(.32));
  }

  // =========================================================
  //  I MURI (62 × 200)
  // =========================================================
  // l'intonaco liscio di dentro, da y = 0 a y1, con la patina del fumo sotto il soffitto (anni di sigarette e di stufa)
  function intonacoCasa(col, seme, y1, fumo) {
    var s = rett(0, 0, MW, y1, lin("ic" + col.slice(1), [[0, scuro(col, .05)], [.45, col], [1, chiaro(col, .05)]], 0, 0, 0, 1));
    s += macchieMorbide(10, MW, y1, seme, chiaro(col, .55), scuro(col, .12), 9, 22, .2, false);
    s += granelli(Math.round(y1 * .55), MW, y1, seme + 1, scuro(col, .3), .8, .14) + granelli(Math.round(y1 * .4), MW, y1, seme + 2, chiaro(col, .65), .8, .35);
    if (fumo !== false) s += rett(0, 0, MW, Math.min(y1, 80), lin("fumo", [[0, "#8a5a2a", .13], [.45, "#8a5a2a", .04], [1, "#8a5a2a", 0]], 0, 0, 0, 1));   // (leggera e calda: il circolo è tenuto bene)
    return s;
  }
  // il battiscopa di legno: l'ombra sul muro, il bordo tondo in luce, le venature
  function battiscopaLegno(c, seme, alto) {
    var y = 200 - (alto || 13);
    return rett(0, y - 5, MW, 5, lin("bso", [[0, "#000", 0], [1, "#000", .16]], 0, 0, 0, 1)) +
      rett(0, y, MW, 200 - y, lin("bl" + c.slice(1), [[0, chiaro(c, .45)], [.12, chiaro(c, .18)], [.3, c], [1, scuro(c, .32)]], 0, 0, 0, 1)) +
      venature(0, y + 2.4, MW, 200 - y - 3.4, c, seme, 6, false, 1) +
      rett(0, y - .4, MW, .8, L, op(.65)) + rett(0, y + .6, MW, .7, "#fff", op(.5)) + rett(0, y + 3, MW, .6, scuro(c, .45), op(.55)) + rett(0, 199, MW, 1, scuro(c, .6));
  }

  // ---- perline di abete chiaro fino a metà, la cimasa di legno e l'intonaco crema sopra ----
  function perlineCircolo() {
    var Y0 = 106.4, Y1 = 187, bw = MW / 6, h = Y1 - Y0, k;
    var s = intonacoCasa("#efe1c3", 1101, Y0);
    var cols = ["#e4bd82", "#d9b075", "#e8c58d", "#d4a96d", "#e0b87c", "#d2a76a"];   // abete chiaro con la vernice un po' ambrata
    s += rett(0, Y0, MW, h, "#3a2412");   // il fondo delle scanalature
    for (k = 0; k < 6; k++) (function (x, c, r) {
      var t = rett(x + .35, Y0, bw - .7, h, lin("pc" + k, [[0, chiaro(c, .22)], [.12, chiaro(c, .06)], [.55, c], [.88, scuro(c, .06)], [1, scuro(c, .2)]], 0, 0, 1, 0));
      t += venature(x + .8, Y0, bw - 1.6, h, c, 1103 + k * 7, 7, true, 1.45);
      // la "fiamma" dell'abete: archi morbidi uno dentro l'altro, storti e sfumati (non in tutte le perline)
      var fy = Y0 + 8 + r() * (h - 40), fx = x + bw * (.36 + r() * .28), j, nf = r() < .3 ? 0 : 2 + Math.floor(r() * 3), sb = (r() - .5) * 1.6;
      for (j = 0; j < nf; j++) { var hw = 1.1 + j * (.8 + r() * .3), hh = 9 + j * (5 + r() * 3), y2 = fy + j * 1.6; t += tratto("M" + q(fx - hw + sb, y2 + hh) + " C" + q(fx - hw * 1.05, y2 + hh * .3) + " " + q(fx - hw * .3, y2) + " " + q(fx + sb * .2, y2) + " C" + q(fx + hw * .3, y2) + " " + q(fx + hw * .95, y2 + hh * .35) + " " + q(fx + hw - sb * .5, y2 + hh * 1.1), scuro(c, .22), .5, op(.26 - j * .04)); }
      if (r() < .55) t += nodo(x + 3 + r() * (bw - 6), Y0 + 8 + r() * (h - 16), c, .42);
      // la vernice: una striscia di lucido lungo la perlina
      t += rett(x + bw * .22, Y0, bw * .16, h, lin("pv", [[0, "#fff", 0], [.5, "#fff", .22], [1, "#fff", 0]], 0, 0, 1, 0));
      // la scanalatura a V: il lato in luce a sinistra, quello in ombra a destra
      t += rett(x + .35, Y0, .9, h, chiaro(c, .45), op(.85)) + rett(x + bw - 1.25, Y0, .9, h, scuro(c, .3), op(.8));
      s += t; if (x + bw > MW) s += sposta(-MW, 0, t);
    })(bw / 2 + k * bw, cols[k], rnd(1105 + k * 3));
    // i segni delle sedie e delle scarpe, leggeri, e il legno un po' più scuro in basso
    s += rett(0, Y0, MW, h, lin("pg", [[0, "#000", 0], [.7, "#000", 0], [1, "#3a2412", .14]], 0, 0, 0, 1));
    var r2 = rnd(1107), i;
    for (i = 0; i < 7; i++) (function (x, y, l, dy, cc, o) { s += giro(x, y, l / 2 + 1, MW, 0, function (a) { return tratto("M" + q(a - l / 2, y) + " L" + q(a + l / 2, y + dy), cc, .7, op(o)); }); })(r2() * MW, 150 + r2() * 24, 3 + r2() * 6, (r2() - .5) * .8, r2() < .5 ? "#fff8e6" : "#6b4423", .14 + r2() * .12);
    // la cimasa: il piano in luce, il toro tondo, l'ombra sulle perline
    var cc = "#9c6838", yc = Y0 - 9.4;
    s += rett(0, Y0, MW, 5.5, lin("cso", [[0, "#000", .34], [1, "#000", 0]], 0, 0, 0, 1));
    s += rett(0, yc, MW, 2.6, lin("csp", [[0, chiaro(cc, .5)], [1, chiaro(cc, .3)]], 0, 0, 0, 1)) + rett(0, yc - .5, MW, .8, L, op(.55));
    s += rett(0, yc + 2.6, MW, 6.8, lin("cst", [[0, chiaro(cc, .28)], [.3, chiaro(cc, .08)], [.7, cc], [1, scuro(cc, .4)]], 0, 0, 0, 1)) + venature(0, yc + 3, MW, 6, cc, 1109, 5, false, .9);
    s += rett(0, yc + 2.5, MW, .5, scuro(cc, .35), op(.7)) + rett(0, yc + 3.6, MW, .8, "#fff", op(.4)) + rett(0, yc + 9.1, MW, .7, L, op(.75));
    return s + battiscopaLegno("#8a5630", 1111);
  }

  // ---- intonaco giallo caldo (a calce, con le pennellate), la fascia dipinta in alto e il battiscopa scuro ----
  function intonacoGiallo() {
    var col = "#f0c56c", s = intonacoCasa(col, 1201, 188), r = rnd(1203), i;
    s += macchieMorbide(16, MW, 188, 1204, chiaro(col, .45), scuro(col, .1), 8, 20, .3, false);   // la calce data a nuvole
    for (i = 0; i < 18; i++) (function (x, y, l, a, cv, cc, o, w) {   // le pennellate larghe, appena si vedono
      var dx = Math.cos(a) * l / 2, dy = Math.sin(a) * l / 2;
      s += giro(x, y, l / 2 + 5, MW, 0, function (X) { return tratto("M" + q(X - dx, y - dy) + " Q" + q(X - Math.sin(a) * cv, y + Math.cos(a) * cv) + " " + q(X + dx, y + dy), cc, w, op(o)); });
    })(r() * MW, 24 + r() * 150, 12 + r() * 16, (r() - .5) * 1.6, (r() - .5) * 5, r() < .55 ? chiaro(col, .4) : scuro(col, .08), .05 + r() * .05, 5 + r() * 4);
    // la fascia dipinta sotto il soffitto: ocra più scuro, il filo marrone e il filetto rosso
    var oc = mix(col, "#9a4a18", .5);   // ocra rossa (non mescolata col nero: verrebbe color fango)
    s += rett(0, 0, MW, 10.5, lin("fa", [[0, scuro(oc, .1)], [1, oc]], 0, 0, 0, 1)) + granelli(40, MW, 10, 1205, scuro(oc, .35), .7, .25);
    s += rett(0, 10.5, MW, 1.2, "#6e3a16", op(.8)) + rett(0, 11.7, MW, .6, "#fff3cf", op(.5)) + rett(0, 14.2, MW, .8, "#a33b22", op(.65));
    return s + battiscopaLegno("#4c2c1a", 1207, 14);
  }

  // ---- piastrelle verdi lucide da bar fino a metà, il torello in cima, intonaco crema sopra ----
  function piastrelleVerdi() {
    var tl = MW / 6, Y0 = 105.6, Y1 = 188, j, k;
    var s = intonacoCasa("#f3e8d0", 1301, Y0);
    s += rett(0, Y0, MW, Y1 - Y0, "#d3ccb8") + sposta(0, Y0, granelli(110, MW, Y1 - Y0, 1303, "#a39b85", .6, .5));   // la fuga
    var cols = ["#2f7f5c", "#2b7656", "#368a63", "#287152", "#327d5b", "#2c7a5e", "#3a8b67", "#2a7a59", "#41936d", "#256a4d"];   // lo smalto fatto a mano: ogni piastrella un po' diversa
    var cusc = lin("vp", [[0, "#fff", .34], [.38, "#fff", .05], [.7, "#000", 0], [1, "#000", .22]], 0, 0, 1, 1);
    for (j = 0; j < 8; j++) for (k = 0; k < 6; k++) (function (x, y, r) {
      var c = scegli(r, cols), g = .5, l = tl - 2 * g, t;
      t = rett(x + g, y + g, l, l, c, "rx='1'") + rett(x + g, y + g, l, l, cusc, "rx='1'");   // lo smalto col cuscinetto
      t += rett(x + g + .5, y + g + .5, l - 1, l - 1, "none", "rx='.8' stroke='" + scuro(c, .4) + "' stroke-width='.9' opacity='.45'");   // lo smalto più scuro sui bordi
      t += rett(x + g + 1.4, y + g + 1.3, l * .34, l * .2, "#fff", op(.32) + " rx='.8'") + rett(x + g + 1.4, y + g + 1.3, l * .62, .6, "#fff", op(.45));   // il riflesso della luce, piccolo
      if (r() < .3) t += cer(x + g + 2.5 + r() * (l - 5), y + g + 2.5 + r() * (l - 5), .32, scuro(c, .45), op(.7));   // un forellino nello smalto
      s += t; if (x + tl > MW) s += sposta(-MW, 0, t);
    })(tl / 2 + k * tl, Y0 + j * tl, rnd(1305 + j * 7 + k * 3));
    // un riflesso largo e morbido che scorre sulle piastrelle
    s += pth("M" + q(20, Y0) + " L" + q(34, Y0) + " L" + q(4, Y1) + " L" + q(-10, Y1) + " Z", "#fff", op(.07)) + pth("M" + q(82, Y0) + " L" + q(96, Y0) + " L" + q(66, Y1) + " L" + q(52, Y1) + " Z", "#fff", op(.07));
    // il torello: la piastrella tonda che chiude in cima, verde più scuro
    var tv = "#21604a", yt = Y0 - 7.6;
    s += rett(0, yt - .5, MW, .8, L, op(.5)) + rett(0, yt, MW, 7.6, "#c9c2ad");
    for (k = 0; k < 3; k++) (function (x) {
      var t = rett(x + .3, yt, 2 * tl - .6, 7.6, lin("tor", [[0, chiaro(tv, .55)], [.22, chiaro(tv, .22)], [.5, tv], [1, scuro(tv, .38)]], 0, 0, 0, 1), "rx='1.4'") + rett(x + 1.4, yt + 1.3, 2 * tl - 2.8, .9, "#fff", op(.65));
      s += t; if (x + 2 * tl > MW) s += sposta(-MW, 0, t);
    })(tl / 2 + k * 2 * tl);
    s += rett(0, Y0, MW, 1.6, "#000", op(.18));
    // il battiscopa di piastrella, tondo in cima
    var yb = Y1, bv = "#1f5a43";
    s += rett(0, yb - .2, MW, 12.2, "#c9c2ad");
    for (k = 0; k < 3; k++) (function (x) {
      var t = rett(x + .3, yb + .2, 2 * tl - .6, 11.6, lin("bat", [[0, chiaro(bv, .45)], [.18, chiaro(bv, .12)], [.45, bv], [1, scuro(bv, .4)]], 0, 0, 0, 1), "rx='1'") + rett(x + 1.4, yb + 1.3, 2 * tl - 2.8, .7, "#fff", op(.55));
      s += t; if (x + 2 * tl > MW) s += sposta(-MW, 0, t);
    })(tl / 2 + k * 2 * tl);
    return s + rett(0, 199, MW, 1, scuro(bv, .5));
  }

  // ---- il muro di pietra del cortile: pietre di calcare con le file di mattoni (muratura listata), il coronamento di mattoni di taglio ----
  var MATTONI = ["#b65a3a", "#a94f33", "#c2663f", "#9e4730", "#bb6040", "#ad5637", "#c86f48", "#b8613f"];
  var PIETRE = ["#cdbb98", "#bea883", "#d8c7a6", "#ad9672", "#c6ad88", "#b79f7b", "#d1b88f", "#a08c70", "#dccbaa", "#bba383", "#c4a58c", "#a9a294"];
  function pietre(y0, y1, seme) {   // file di pietre irregolari tra y0 e y1 (la malta di calce si vede in mezzo)
    var s = "", r = rnd(seme), y = y0, n = 0, g = 1.25;
    while (y < y1 - .5) {
      var h = 10.5 + r() * 6.5; if (y1 - y - h < 8) h = y1 - y;
      var x = r() * MW, fine = x + MW;
      while (x < fine - .1) {
        var w = 11 + r() * 13; if (fine - x - w < 8) w = fine - x;
        var j = function () { return r() * 1.5; };
        var pts = [[x + g + j(), y + g + j()], [x + w * (.3 + r() * .4), y + g + j() * .6 - .4], [x + w - g - j(), y + g + j()], [x + w - g - j() * .8, y + h * (.3 + r() * .4)],
          [x + w - g - j(), y + h - g - j()], [x + w * (.3 + r() * .4), y + h - g - j() * .6 + .4], [x + g + j(), y + h - g - j()], [x + g + j() * .8, y + h * (.3 + r() * .4)]];
        var t = rett(x + g + .6, y + h - g - .2, w - 2 * g, 1.3, "#5a4a36", op(.25)) + sasso(pts, scegli(r, PIETRE), seme * 31 + (++n), 3.4);   // l'ombra sotto la pietra e la pietra
        if (x < MW) s += t; if (x + w > MW) s += sposta(-MW, 0, t);
        x += w;
      }
      y += h;
    }
    return s;
  }
  function mattoncino(x, y, w, h, c, r) {   // un mattone pieno con la sua luce e qualche puntino
    var t = rett(x + .5, y + .5, w - 1, h - 1, c, "rx='.6'") + rett(x + .5, y + .5, w - 1, h - 1, luce(1), "rx='.6'") + rett(x + 1.1, y + .9, w - 2.2, .5, "#fff", op(.25)), i;
    for (i = 0; i < 3; i++) t += cer(x + 1.5 + r() * (w - 3), y + 1.2 + r() * (h - 2.4), .3 + r() * .3, r() < .6 ? scuro(c, .35) : chiaro(c, .35), op(.6));
    if (r() < .25) t += rett(x + .5 + r() * (w - 4), y + .5, 3, h - 1, scuro(c, .25), op(.35));   // la bruciatura
    return t;
  }
  function corsoMattoni(y, righe, seme) {   // la listatura: file di mattoni sfalsate di mezzo
    var s = "", f, k, hm = 4.8, lm = 15.5;
    for (f = 0; f < righe; f++) for (k = 0; k < 4; k++) (function (yy, x, r) {
      var t = mattoncino(x, yy, lm, hm, scegli(r, MATTONI), r);
      s += t; if (x + lm > MW) s += sposta(-MW, 0, t);
    })(y + f * hm, 3.1 + (f % 2 ? lm / 2 : 0) + k * lm, rnd(seme * 7 + f * 5 + k));
    return s + rett(0, y + righe * hm, MW, 1.2, "#5a4a36", op(.2));
  }
  function pietraCortile() {
    var malta = "#d8ccb1", s = rett(0, 0, MW, MH, malta) + granelli(300, MW, MH, 1401, "#9e9177", .9, .45) + granelli(180, MW, MH, 1402, "#f1e9d6", .9, .55), k;
    // il coronamento: mattoni messi di taglio, con l'ombra sotto
    var cw = MW / 10;
    for (k = 0; k < 10; k++) (function (x, r) {
      var t = mattoncino(x, .2, cw, 9.4, scegli(r, MATTONI), r);
      s += t; if (x + cw > MW) s += sposta(-MW, 0, t);
    })(cw / 2 + k * cw, rnd(1411 + k));
    s += rett(0, 9.6, MW, 3, lin("cco", [[0, "#000", .3], [1, "#000", 0]], 0, 0, 0, 1));
    s += pietre(10.6, 62, 1403) + corsoMattoni(62.4, 2, 1404) + pietre(73, 128, 1405) + corsoMattoni(128.4, 2, 1406) + pietre(139, 200, 1407);
    // i licheni chiari sulle pietre, a ciuffetti
    var r = rnd(1409), lic = [], i, m;
    for (i = 0; i < 9; i++) { var lx = r() * MW, ly = 14 + r() * 150; for (m = 0; m < 9; m++) { var px = lx + (r() - .5) * 5, py = ly + (r() - .5) * 3.5; lic.push([px, py]); if (px < 1) lic.push([px + MW, py]); if (px > MW - 1) lic.push([px - MW, py]); } }
    s += puntini(lic, "#d9d49a", 1.1, .45) + puntini(lic.filter(function (v, x) { return x % 2; }), "#a9ad78", .7, .5);
    // l'umidità che sale da terra e il muschio nelle fughe in basso
    s += rett(0, 160, MW, 40, lin("um", [[0, "#3d4a26", 0], [.6, "#3d4a26", .14], [1, "#2f3a1c", .34]], 0, 0, 0, 1));
    var mu = [];
    for (i = 0; i < 16; i++) { var mx = r() * MW, my = 176 + r() * 23; for (m = 0; m < 7; m++) { var qx = mx + (r() - .5) * 4.5, qy = my + (r() - .5) * 2.4; mu.push([qx, qy]); if (qx < 1.2) mu.push([qx + MW, qy]); if (qx > MW - 1.2) mu.push([qx - MW, qy]); } }
    return s + puntini(mu, "#55702f", 1.8, .7) + puntini(mu.filter(function (v, x) { return x % 3 === 0; }), "#8aa34c", 1.1, .8);
  }

  var MURI_R = [
    ["perline_circolo", "Perline e intonaco crema", "dentro", 40, perlineCircolo],
    ["intonaco_giallo", "Intonaco giallo caldo", "dentro", 20, intonacoGiallo],
    ["piastrelle_verdi", "Piastrelle verdi da bar", "dentro", 45, piastrelleVerdi],
    ["pietra_cortile", "Pietra del cortile", "fuori", 40, pietraCortile]
  ];
  MURI_R.forEach(function (v) { K.muri.push({ id: v[0], nome: v[1], dove: v[2], prezzo: v[3], svg: function () { return svg("rm_" + v[0], MW, MH, v[4]); } }); });

  // =========================================================
  //  I PAVIMENTI (100 × 100)
  // =========================================================
  // ---- la graniglia anni '60: mattonelle da 25 coi rosoni (ognuno sta su quattro mattonelle), le stelline e le scaglie di marmo ----
  function graniglia() {
    var T = 25, s = "", i, j, a;
    var NERO = "#5a4a3d", ROSSO = "#b25a3f", SALVIA = "#7f9486", OCRA = "#d3a24c", CREMA = "#f1e7d1";   // colori di cemento, un po' spenti
    var FONDI = ["#e2d4b7", "#ded0b2", "#e6d9be", "#dacbad", "#e0d3b8"];
    for (j = 0; j < 4; j++) for (i = 0; i < 4; i++) s += rett(i * T, j * T, T, T, scegli(rnd(1501 + j * 4 + i), FONDI));
    function ovunque(x, y, rr, fn) { return giro(x, y, rr, 100, 100, fn); }
    function petalo(cx, cy, r0, r1, w, c, ang) {
      var m = (r0 + r1) / 2, d = "M" + q(cx, cy - r0) + " Q" + q(cx + w, cy - m) + " " + q(cx, cy - r1) + " Q" + q(cx - w, cy - m) + " " + q(cx, cy - r0) + " Z";
      return gira(ang, cx, cy, pth(d, c, "stroke='" + NERO + "' stroke-width='.55' stroke-linejoin='round'") + tratto("M" + q(cx, cy - r0 - 1.2) + " L" + q(cx, cy - r1 + 2.2), CREMA, .55, op(.8)));
    }
    // i rosoni
    [[25, 25], [75, 25], [25, 75], [75, 75]].forEach(function (p) {
      var cx = p[0], cy = p[1], R = 18.6;
      s += cer(cx, cy, R + .5, NERO) + cer(cx, cy, R, ROSSO) + cer(cx, cy, R - 1.3, NERO) + cer(cx, cy, R - 1.8, CREMA);   // il cerchio sottile
      s += cer(cx, cy, R - 4.2, "none", "stroke='" + OCRA + "' stroke-width='.7' stroke-dasharray='.8 1.6' opacity='.9'");   // la coroncina di puntini ocra
      for (a = 0; a < 8; a++) s += petalo(cx, cy, 3.2, a % 2 ? 12.2 : 14.8, a % 2 ? 2.2 : 2.8, a % 2 ? SALVIA : ROSSO, a * 45);
      for (a = 0; a < 8; a++) { var b = a * Math.PI / 4 + Math.PI / 8; s += cer(cx + Math.sin(b) * 12.4, cy - Math.cos(b) * 12.4, .9, OCRA, "stroke='" + NERO + "' stroke-width='.4'"); }
      s += cer(cx, cy, 3.6, OCRA, "stroke='" + NERO + "' stroke-width='.6'") + cer(cx, cy, 1.4, ROSSO) + cer(cx - .9, cy - .9, .5, "#fff", op(.7));
    });
    // le stelline dove si toccano quattro rosoni
    var stella = function (x, y) {
      var d = "M" + q(x, y - 7.4) + " L" + q(x + 2, y - 2) + " L" + q(x + 7.4, y) + " L" + q(x + 2, y + 2) + " L" + q(x, y + 7.4) + " L" + q(x - 2, y + 2) + " L" + q(x - 7.4, y) + " L" + q(x - 2, y - 2) + " Z";
      return pth(d, OCRA, "stroke='" + NERO + "' stroke-width='.55' stroke-linejoin='round'") + cer(x, y, 1.8, ROSSO, "stroke='" + NERO + "' stroke-width='.4'") +
        [[1, 1], [1, -1], [-1, 1], [-1, -1]].map(function (v) { return cer(x + v[0] * 4.6, y + v[1] * 4.6, .9, SALVIA, "stroke='" + NERO + "' stroke-width='.35'"); }).join("");
    };
    [[0, 0], [50, 0], [0, 50], [50, 50]].forEach(function (p) { s += ovunque(p[0], p[1], 9, stella); });
    // i rombetti tra due rosoni
    var rombo = function (x, y) { return pth("M" + q(x, y - 3.4) + " L" + q(x + 3.4, y) + " L" + q(x, y + 3.4) + " L" + q(x - 3.4, y) + " Z", SALVIA, "stroke='" + NERO + "' stroke-width='.5' stroke-linejoin='round'") + cer(x, y, .9, CREMA); };
    [[25, 0], [75, 0], [0, 25], [50, 25], [0, 75], [50, 75], [25, 50], [75, 50]].forEach(function (p) { s += ovunque(p[0], p[1], 4, rombo); });
    // le scaglie di marmo della graniglia (bianche, nere, grigie, ocra, rosse) su tutto
    s += granelli(520, 100, 100, 1511, "#2f2a25", .75, .5, true) + granelli(420, 100, 100, 1512, "#7a7064", .9, .45, true) + granelli(520, 100, 100, 1513, "#fbf8f0", .95, .65, true) +
      granelli(160, 100, 100, 1514, "#c38f4e", 1, .45, true) + granelli(120, 100, 100, 1515, "#9b4e3b", .9, .4, true) + granelli(70, 100, 100, 1516, "#fffdf6", 1.6, .55, true) + granelli(50, 100, 100, 1517, "#4a433b", 1.4, .4, true);
    // la cera consumata a chiazze e le fughe sottili tra le mattonelle
    s += macchieMorbide(10, 100, 100, 1519, "#fffaf0", "#b9a988", 14, 30, .2, true);
    for (i = 0; i < 4; i++) {
      var z = i * T;
      s += rett(z - .3, 0, .6, 100, "#8f8169", op(.55)) + rett(z + .3, 0, .4, 100, "#fff", op(.35)) + rett(0, z - .3, 100, .6, "#8f8169", op(.55)) + rett(0, z + .3, 100, .4, "#fff", op(.35));
      if (!i) s += rett(99.7, 0, .3, 100, "#8f8169", op(.55)) + rett(0, 99.7, 100, .3, "#8f8169", op(.55));
    }
    return s;
  }

  // ---- il cotto toscano: mezzane a spina di pesce (12,5 × 25), fatte a mano, con la fiammatura del forno e la cera ----
  function cottoToscano() {
    var u = 12.5, s = rett(0, 0, 100, 100, "#cdbc9c") + granelli(380, 100, 100, 1601, "#9a8768", .85, .55, true) + granelli(200, 100, 100, 1602, "#ede3cc", .8, .6, true), b, k;
    var cols = ["#c9714a", "#bf6640", "#d27c52", "#b65c38", "#cc774d", "#c26c45", "#d8885d", "#ad5634", "#c97650", "#d0835a"];
    function mezzana(x, y, w, h, r, cl) {
      var c = scegli(r, cols), g = .75, j = function () { return (r() - .5) * .7; };
      var pts = [[x + g + j(), y + g + j()], [x + w - g + j(), y + g + j()], [x + w - g + j(), y + h - g + j()], [x + g + j(), y + h - g + j()]], d = tondo(pts, 1.3), t = "", i;
      t += pth(d, c) + pth(d, luce(1.1));
      var corpo = "";
      if (r() < .45) { var fx = r() < .5 ? x + w * .2 : x + w * .8, fy = r() < .5 ? y + h * .2 : y + h * .8; corpo += ell(fx, fy, w * .45, h * .45, rad("fia", [[0, "#5a2410", .42], [.6, "#5a2410", .12], [1, "#5a2410", 0]], .5, .5, .5)); }   // la fiammatura del forno
      if (r() < .35) corpo += ell(x + w * (.3 + r() * .4), y + h * (.3 + r() * .4), w * .32, h * .32, rad("sal", [[0, "#fff1d8", .35], [1, "#fff1d8", 0]], .5, .5, .5));   // la cera più chiara
      for (i = 0; i < 6; i++) corpo += cer(x + 1.6 + r() * (w - 3.2), y + 1.6 + r() * (h - 3.2), .28 + r() * .38, r() < .7 ? scuro(c, .4) : chiaro(c, .35), op(.6));   // i forellini
      t += dentro(cl, "<path d='" + d + "'/>", corpo);
      t += pth(d, "none", "stroke='" + scuro(c, .32) + "' stroke-width='.9' opacity='.45'") + tratto("M" + q(pts[0][0] + 1.4, pts[0][1] + .9) + " L" + q(pts[1][0] - 1.4, pts[1][1] + .9), "#fff", .55, op(.4));
      return t;
    }
    function metti(x, y, w, h, seme) {   // la mezzana al suo posto, e di nuovo dall'altra parte se esce dal quadrato
      var t = mezzana(x, y, w, h, rnd(seme), "fm" + seme), out = t;
      if (x + w > 100) out += sposta(-100, 0, t);
      if (y + h > 100) out += sposta(0, -100, t);
      if (x + w > 100 && y + h > 100) out += sposta(-100, -100, t);
      return out;
    }
    // la spina: in ogni fila a scala una mezzana distesa e una in piedi, le file spostate di 4 moduli
    for (b = 0; b < 2; b++) for (k = 0; k < 8; k++) {
      var x = ((k + 4 * b) % 8) * u;
      s += metti(x, k * u, 2 * u, u, 1611 + b * 97 + k * 13) + metti(x, ((k + 1) % 8) * u, u, 2 * u, 2611 + b * 89 + k * 17);   // (semi tutti diversi: fanno anche il nome del ritaglio)
    }
    // la cera: una lucentezza leggera
    return s + macchieMorbide(6, 100, 100, 1621, "#fff4dc", "#7a3a1a", 16, 30, .14, true);
  }

  // ---- le assi di legno vecchie: larghe, consumate dove si cammina, con le fessure, i chiodi sulle travi e i graffi ----
  function legnoVecchio() {
    var n = 5, h = 100 / n, s = rett(0, 0, 100, 100, "#22140b"), j;
    var cols = ["#ad7746", "#a26c3e", "#b9834f", "#97643a", "#b07d4c", "#9e6e43", "#8f6037", "#b48450"];
    var travi = [22, 72];   // i chiodi in fila sulle travi sotto il pavimento
    function asse(x, y, w, c, seme, lw) {
      var r = rnd(seme), t = rett(x + .35, y + .65, w - .7, h - 1.3, c, "rx='.5'"), i;
      t += venature(x + .8, y + 1.2, w - 1.6, h - 2.4, c, seme + 1, 9, false, 1.5);
      if (r() < .4) t += nodo(x + 5 + r() * (w - 10), y + 4 + r() * (h - 8), c, .6);
      t += rett(x + .35, y + .65, w - .7, h - 1.3, lin("cup", [[0, "#fff", .16], [.18, "#fff", 0], [.8, "#000", 0], [1, "#000", .24]], 0, 0, 0, 1), "rx='.5'");   // le assi un po' imbarcate
      if (r() < .4) { var cy = y + 3 + r() * (h - 6), cl = 6 + r() * 12, cx = r() < .5 ? x + .8 : x + w - .8 - cl; t += tratto("M" + q(cx, cy) + " L" + q(cx + cl * .5, cy + (r() - .5)) + " L" + q(cx + cl, cy + (r() - .5) * .6), "#2a170b", .55, op(.6)); }   // una crepa
      // i chiodi alle due teste
      [x + 2.4, x + w - 2.4].forEach(function (nx) { [y + h * .3, y + h * .7].forEach(function (ny) { t += cer(nx, ny, .75, "#2b2622", op(.85)) + cer(nx - .25, ny - .25, .28, "#b9b0a2", op(.8)); }); });
      travi.forEach(function (tx) { [tx, tx + 100, tx - 100].forEach(function (xx) { if (xx > x + 4 && xx < x + w - 4) [y + h * .3, y + h * .7].forEach(function (ny) { t += cer(xx, ny, .7, "#2b2622", op(.8)) + cer(xx - .25, ny - .25, .26, "#b9b0a2", op(.75)); }); }); });
      return t + rett(x + .35, y + .65, .5, h - 1.3, "#1a0e06", op(.5)) + rett(x + 1, y + 1.1, w - 2, .55, "#fff", op(.2));
    }
    var TESTE = [8, 56, 30, 82, 44];   // dove finisce l'asse in ogni fila (una sola giunta per metro, sfalsate)
    for (j = 0; j < n; j++) (function (y, x0, c, seme) {
      [x0, x0 - 100].forEach(function (xx) { s += asse(xx, y, 100, c, seme); if (y + h > 100) s += asse(xx, y - 100, 100, c, seme); });
    })(h / 2 + j * h, TESTE[j], cols[(j * 3 + 1) % cols.length], 1703 + j * 31);
    // consumate dove si cammina: chiazze chiare e grigie (la vernice andata via) e i graffi
    s += macchieMorbide(8, 100, 100, 1711, "#e8d6b2", "#5a3a1e", 16, 34, .2, true) + macchieMorbide(6, 100, 100, 1712, "#d9cdb8", "#d9cdb8", 18, 30, .3, true);   // (le ultime grigie: il legno senza più vernice)
    var rg = rnd(1713), gr = "", i2;
    for (i2 = 0; i2 < 22; i2++) (function (x, yy, l, aa, o) {
      gr += giro(x, yy, l, 100, 100, function (X, Y) { return tratto("M" + q(X, Y) + " l" + q(Math.cos(aa) * l, Math.sin(aa) * l * .4), "#f3e3c4", .4, op(o)); });
    })(rg() * 100, rg() * 100, 2 + rg() * 6, rg() * 6.28, .1 + rg() * .1);
    return s + gr + granelli(140, 100, 100, 1715, "#2a170b", .8, .35, true);
  }

  // ---- la ghiaia chiara del cortile: sassolini bianchi e crema sulla terra battuta ----
  function ghiaiaCortile() {
    var cols = ["#f3eee3", "#e9e2d2", "#ded4c0", "#f8f5ee", "#d8ccb4", "#cfc3ab", "#e6dac4", "#c9bca3", "#efe7d6", "#e2cfa9", "#d9c39c", "#bdb6a8", "#c9ad7c", "#a9a69b", "#b8a68a"];
    var s = rett(0, 0, 100, 100, "#cdbf9f") + granelli(500, 100, 100, 1801, "#a69576", 1, .55, true) + granelli(320, 100, 100, 1802, "#efe6d2", 1, .6, true);
    var r = rnd(1803), i, hl = [], g = rad("gc", [[0, "#fff", .6], [.45, "#fff", .08], [.8, "#000", .03], [1, "#000", .2]], .32, .3, .85), N = 15;
    for (i = 0; i < N * N + 150; i++) (function (x, y, rx, k, a, c) {   // i sassolini grossi su una griglia mossa, poi quelli piccoli sparsi
      var ry = rx * k;
      s += giro(x, y, rx + 1, 100, 100, function (X, Y) {
        hl.push([X - ry * .35, Y - ry * .42]);
        return "<g transform='translate(" + q(X, Y) + ") rotate(" + f2(a) + ")'>" + ell(.7, .85, rx, ry, "#6b5a40", op(.32)) + ell(0, 0, rx, ry, c) + ell(0, 0, rx, ry, g) + "</g>";
      });
    })(i < N * N ? (i % N + .12 + r() * .76) * 100 / N : r() * 100, i < N * N ? (Math.floor(i / N) + .12 + r() * .76) * 100 / N : r() * 100, i < N * N ? 2.2 + r() * 1.5 : 1.1 + r() * 1, .62 + r() * .3, r() * 180, scegli(r, cols));
    return s + puntini(hl, "#fff", .8, .5);
  }

  var PAV_R = [
    ["graniglia", "Graniglia anni '60", "dentro", 45, graniglia],
    ["cotto_toscano", "Cotto toscano a spina", "tutti", 35, cottoToscano],
    ["legno_vecchio", "Assi di legno vecchie", "dentro", 30, legnoVecchio],
    ["ghiaia_cortile", "Ghiaia chiara del cortile", "fuori", 15, ghiaiaCortile]
  ];
  PAV_R.forEach(function (v) { K.pavimenti.push({ id: v[0], nome: v[1], dove: v[2], prezzo: v[3], svg: function () { return svg("rv_" + v[0], 100, 100, v[4]); } }); });

  // =========================================================
  //  LA PORTA: noce coi vetri stampati, il sopraluce e la maniglia d'ottone
  // =========================================================
  function ottone(n) { return rad("ot" + (n || ""), [[0, "#fff6cf"], [.35, "#f0c75a"], [1, "#9c7114"]], .35, .3, .75); }
  function vetroStampato(nome, b, notte) {   // b = [x, y, w, h]; il vetro stampato "martellato": di giorno chiaro coi riflessi, di notte acceso
    var x = b[0], y = b[1], w = b[2], h = b[3], c, i, j;
    if (notte) c = rett(x, y, w, h, lin("vn", [[0, "#fff8dc"], [.45, "#ffe39a"], [1, "#ffbf55"]], 0, 0, .3, 1)) + ell(x + w * .5, y + h * .4, w * .6, h * .5, rad("vl", [[0, "#fff", .6], [1, "#fff", 0]], .5, .5, .5));
    else c = rett(x, y, w, h, lin("vg", [[0, "#eef5f2"], [.5, "#c3d6d3"], [1, "#93afb0"]], 0, 0, .35, 1)) + rett(x, y + h * .55, w, h * .45, "#4f6c6e", op(.16));
    var pt = [], ps = [];   // le bolle del vetro martellato, in file sfalsate
    for (j = 0; j * 2.2 < h + 2; j++) for (i = 0; i * 2.4 < w + 2; i++) { var px = x + i * 2.4 + (j % 2) * 1.2, py = y + j * 2.2; pt.push([px - .35, py - .35]); ps.push([px + .3, py + .35]); }
    c += puntini(ps, notte ? "#c98a2a" : "#5d7b7c", 1.2, notte ? .22 : .2) + puntini(pt, "#fff", 1, notte ? .45 : .5);
    if (!notte) c += pth("M" + q(x + w * .45, y) + " L" + q(x + w * .72, y) + " L" + q(x + w * .3, y + h) + " L" + q(x + w * .03, y + h) + " Z", "#fff", op(.26)) + pth("M" + q(x + w * .82, y) + " L" + q(x + w * .9, y) + " L" + q(x + w * .48, y + h) + " L" + q(x + w * .4, y + h) + " Z", "#fff", op(.2));
    return dentro(nome, rq(x, y, w, h), c) + rett(x, y, w, 1.2, "#000", op(.22)) + rett(x, y, 1, h, "#000", op(.14));
  }
  function portaCircolo(notte) {
    var c = "#8b5a34", cs = "#6e4325", s = "", i;
    var legno = lin("pn", [[0, chiaro(c, .2)], [.5, c], [1, scuro(c, .22)]], 0, 0, 1, 1);
    // il coprifilo intorno al vano (col sopraluce), il cappello in cima e l'ombra sul muro
    s += rett(6.4, 22.6, 52, 177.4, "#000", op(.17)) + rett(3.4, 19.4, 55.2, 4.4, "#000", op(.12));
    s += rett(5, 21.5, 52, 178.5, lin("cf", [[0, chiaro(cs, .3)], [.5, cs], [1, scuro(cs, .25)]], 0, 0, 1, 0), bordo(L, 1.6));
    s += rett(7.2, 23.7, 47.6, 176.3, "none", "stroke='" + scuro(cs, .35) + "' stroke-width='.7' opacity='.7'") + rett(5.8, 22.3, .8, 177, "#fff", op(.3));
    s += rett(3, 17.6, 56, 4.6, lin("cap", [[0, chiaro(cs, .45)], [.4, chiaro(cs, .1)], [1, scuro(cs, .35)]], 0, 0, 0, 1), bordo(L, 1.3) + " rx='.8'") + rett(4, 18.3, 54, .7, "#fff", op(.45));
    // il sopraluce: tre vetri e due listelli
    s += rett(9.5, 26, 43, 22, scuro(cs, .45));
    s += vetroStampato("vs", [10.3, 26.8, 41.4, 19.4], notte);
    [23.6, 38.4].forEach(function (x) { s += rett(x - .8, 26.8, 1.6, 19.4, legno, bordo(L, .5)); });
    s += rett(9.5, 46.2, 43, 3.8, legno, bordo(L, .8)) + rett(10, 46.7, 42, .6, "#fff", op(.35));   // la traversa
    // l'anta di noce
    s += rett(10, 50, 42, 146, legno, bordo(L, 1.4));
    s += dentro("an", rq(10, 50, 42, 146), venature(10, 50, 42, 146, c, 1901, 16, true, 1.15));
    // i vetri in alto: sei riquadri col fermavetro
    s += rett(14.6, 55, 32.8, 62, scuro(c, .4)) + vetroStampato("va", [15.4, 55.8, 31.2, 60.4], notte);
    s += rett(30.2, 55.8, 1.6, 60.4, legno, bordo(L, .5)) + rett(15.4, 75.2, 31.2, 1.6, legno, bordo(L, .5)) + rett(15.4, 95.2, 31.2, 1.6, legno, bordo(L, .5));
    s += rett(14.6, 55, 32.8, 62, "none", "stroke='" + chiaro(c, .25) + "' stroke-width='1.3'") + rett(14.6, 55, 32.8, 62, "none", bordo(L, .6));
    // la traversa di mezzo e i due pannelli in rilievo sotto
    s += rett(10.6, 118.6, 40.8, .6, "#fff", op(.25));
    s += riquadro(14.6, 125, 15.2, 54, chiaro(c, .04), 2.6) + riquadro(32.2, 125, 15.2, 54, chiaro(c, .04), 2.6);
    s += dentro("p1", rq(17.2, 127.6, 10, 48.8), venature(17.2, 127.6, 10, 48.8, chiaro(c, .04), 1903, 4, true, 1)) + dentro("p2", rq(34.8, 127.6, 10, 48.8), venature(34.8, 127.6, 10, 48.8, chiaro(c, .04), 1905, 4, true, 1));
    // la lamina d'ottone in basso, con le viti
    s += rett(10.8, 184.5, 40.4, 10, ottone("l"), bordo("#6b4a00", .8)) + rett(11.6, 185.3, 38.8, .8, "#fff", op(.6));
    [13.2, 31, 48.8].forEach(function (x) { s += cer(x, 189.5, .7, "#8a6a1e") + cer(x - .2, 189.3, .25, "#fff", op(.7)); });
    s += pth("M12,52 L18,52 L13,180 L12,180 Z", "#fff", op(.08));   // la luce sul legno lucido
    // le cerniere d'ottone
    [66, 172].forEach(function (y) { s += rett(9.2, y - 4.2, 2.8, 8.4, ottone("c"), bordo("#6b4a00", .6) + " rx='.8'") + rett(9.7, y - 3.6, .7, 7.2, "#fff", op(.6)); });
    // la maniglia d'ottone: la placca lunga con la leva e la toppa della chiave
    s += sposta(.8, 1, rett(44.6, 127, 4.4, 24, "#000", op(.25) + " rx='2'"));
    s += rett(44.6, 127, 4.4, 24, lin("pl", [[0, "#fff4c4"], [.4, "#e2b84e"], [1, "#94690f"]], 0, 0, 1, 0), bordo("#6b4a00", .7) + " rx='2'") + rett(45.3, 128.4, .8, 21, "#fff", op(.6));
    s += pth("M46.8,143.4 a1,1 0 1 1 .01,0 Z", "#2a1d0c") + pth("M46.3,144 L47.3,144 L47.7,147.2 L45.9,147.2 Z", "#2a1d0c");   // la toppa
    s += cer(46.8, 133, 2, ottone("p"), bordo("#6b4a00", .6));
    s += sposta(.7, 1, tratto("M46.8,133 L37.6,133.6", "#000", 2.8, op(.25))) + tratto("M46.8,133 L37.6,133.6", "#6b4a00", 3.4) + tratto("M46.8,133 L37.6,133.6", "#e8c050", 2.2) + tratto("M45.4,132.3 L38.6,132.8", "#fff", .7, op(.75));
    // la soglia di pietra
    return s + rett(4, 196, 54, 4, lin("sg", [[0, "#efe8da"], [1, "#b3a792"]], 0, 0, 0, 1), bordo(L, 1.2)) + rett(5, 196.8, 52, .7, "#fff", op(.6));
  }
  K.porte.push({ id: "porta_circolo", nome: "Porta del Circolo", dove: "dentro", prezzo: 600, svg: function (opz) { var notte = !!(opz && opz.notte); return svg("rp_porta" + (notte ? "_n" : ""), MW, MH, function () { return portaCircolo(notte); }); } });
})();

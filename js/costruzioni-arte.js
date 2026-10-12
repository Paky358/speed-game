/* =========================================================
   SPeeD GAME — IL KIT DEI MATERIALI PER COSTRUIRE LA CASA (SGKit)
   Disegni PIATTI, visti di fronte con una luce neutra: il motore (giardino.js) li piega sui muri,
   sul pavimento e sul tetto, e mette lui luci e ombre delle facce.
   - muri: un pezzo 62 × 200 (una mattonella di muro); si ripete in orizzontale senza giunte
   - pavimenti e tetti: quadrato 100 × 100 che si ripete nei due versi senza giunte
     (tetti: file di tegole orizzontali, la falda scende verso il basso)
   - porte e finestre: 62 × 200 trasparente tranne la porta/finestra col telaio; porta con la base a y=200,
     vetro della finestra circa da y=45 a y=125. opz.notte: vetri accesi. Si vedono anche dall'altra parte
     (il motore le specchia): niente scritte.
   Stile del giardino: sfumature (chiaro in alto a sinistra), contorno caldo, trame a seme fisso (mai Math.random).
   ========================================================= */
(function () {
  "use strict";

  // ---------- attrezzi ----------
  var nId = 0, P = "", DEFS = [], FATTI = {}, PRONTI = {};
  var SEGNO = "§k§";   // segnaposto del prefisso: il disegno si fa una volta, poi a ogni chiamata cambia solo il prefisso
  var L = "#5a3a22";             // il contorno caldo, come nel giardino
  var MW = 62, MH = 200;         // il pezzo di muro
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
  // un poligono con gli angoli smussati (k = quanto si smussa ogni angolo)
  function tondo(a, k) {
    var n = a.length, d = "", i;
    for (i = 0; i < n; i++) {
      var p0 = a[(i + n - 1) % n], p1 = a[i], p2 = a[(i + 1) % n];
      var l1 = Math.hypot(p0[0] - p1[0], p0[1] - p1[1]) || 1, l2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) || 1;
      var k1 = Math.min(k, l1 * .45) / l1, k2 = Math.min(k, l2 * .45) / l2;
      d += (i ? " L" : "M") + q(p1[0] + (p0[0] - p1[0]) * k1, p1[1] + (p0[1] - p1[1]) * k1) + " Q" + q(p1[0], p1[1]) + " " + q(p1[0] + (p2[0] - p1[0]) * k2, p1[1] + (p2[1] - p1[1]) * k2);
    }
    return d + " Z";
  }
  // sfumature e ritagli: tornano già pronti da usare ("url(#...)" o "clip-path=...")
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
  function dentro(nome, forma, corpo) { return "<g " + clip(nome, forma) + ">" + corpo + "</g>"; }   // corpo ritagliato dentro la forma
  // il disegno pronto: si fa una volta sola, poi a ogni chiamata cambia solo il prefisso degli id
  function svg(chiave, w, h, corpo) {
    if (!PRONTI[chiave]) {
      DEFS = []; FATTI = {}; P = SEGNO;
      var b = corpo();
      PRONTI[chiave] = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " " + h + "' width='" + w + "' height='" + h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") + b + "</svg>";
    }
    return PRONTI[chiave].split(SEGNO).join("ck" + (++nId) + "_");
  }
  // trama che si ripete: se un pezzo esce da un bordo si ridisegna anche dall'altra parte (così la giunta non si vede)
  function giro(x, y, r, W, H, fn) {
    var xs = [x], ys = [y], s = "";
    if (x - r < 0) xs.push(x + W); if (x + r > W) xs.push(x - W);
    if (H) { if (y - r < 0) ys.push(y + H); if (y + r > H) ys.push(y - H); }
    xs.forEach(function (a) { ys.forEach(function (b) { s += fn(a, b); }); });
    return s;
  }
  // tanti puntini in un tratto solo (granelli, fibre, pori)
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
  // la sfumatura sopra un mattone, una pietra, una tegola: chiaro in alto a sinistra, scuro in basso a destra
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

  // =========================================================
  //  I MURI (62 × 200, si ripetono in orizzontale)
  // =========================================================
  function intonaco(col, seme, liscio) {   // intonaco di fuori (ruvido) o pittura di dentro (liscio)
    var s = rett(0, 0, MW, MH, col), r = rnd(seme * 7 + 3), i;
    s += macchieMorbide(liscio ? 7 : 30, MW, MH, seme, chiaro(col, .55), scuro(col, .14), liscio ? 16 : 4, liscio ? 30 : 11, liscio ? .08 : .3, false);
    s += granelli(liscio ? 45 : 240, MW, MH, seme + 1, scuro(col, .32), liscio ? .8 : 1, liscio ? .1 : .22);
    s += granelli(liscio ? 30 : 160, MW, MH, seme + 2, chiaro(col, .7), liscio ? .8 : 1, liscio ? .3 : .5);
    if (!liscio) s += granelli(120, MW, MH, seme + 4, scuro(col, .2), 1.8, .1);
    if (!liscio) for (i = 0; i < 8; i++) (function (x, y, l, cv, cc, o) {   // i segni leggeri della cazzuola
      s += giro(x, y, l / 2 + 1, MW, 0, function (a) { return tratto("M" + q(a - l / 2, y) + " Q" + q(a, y + cv) + " " + q(a + l / 2, y), cc, 1.4, op(o)); });
    })(r() * MW, 8 + r() * 184, 8 + r() * 14, (r() - .5) * 5, r() < .6 ? chiaro(col, .6) : scuro(col, .15), .16 + r() * .14);
    return s;
  }
  function macchieMorbide(n, W, H, seme, cC, cS, rMin, rMax, o, dueVersi) {   // macchie morbide (chiare e scure) sparse sulla trama
    var r = rnd(seme), gC = rad("cz" + cC.slice(1), [[0, cC, 1], [1, cC, 0]], .5, .5, .5), gS = rad("cz" + cS.slice(1), [[0, cS, 1], [1, cS, 0]], .5, .5, .5), s = "", i;
    for (i = 0; i < n; i++) (function (x, y, rx, k, g, oo) {
      var ry = rx * k;
      s += giro(x, y, rx, W, dueVersi ? H : 0, function (a, b) { return ell(a, b, rx, ry, g, op(oo)); });
    })(r() * W, r() * H, rMin + r() * (rMax - rMin), .45 + r() * .5, r() < .5 ? gC : gS, o * (.5 + r() * .5));
    return s;
  }
  function battiscopa(col) {   // lo zoccolino in fondo ai muri di dentro
    col = col || "#f4eee3";
    return rett(0, 182, MW, 6, lin("bso", [[0, "#000", 0], [1, "#000", .13]], 0, 0, 0, 1)) +
      rett(0, 188, MW, 12, lin("bs" + col.slice(1), [[0, chiaro(col, .5)], [.3, col], [1, scuro(col, .16)]], 0, 0, 0, 1)) +
      rett(0, 187.5, MW, .9, L, op(.55)) + rett(0, 188.6, MW, .9, "#fff", op(.7)) + rett(0, 191.4, MW, .7, scuro(col, .4), op(.5)) + rett(0, 199, MW, 1, scuro(col, .45));
  }
  function mattoni(cols, malta, seme, bianchi) {   // 20 file da 10: mattoni lunghi 31 (due per pezzo), sfalsati di mezzo
    var s = rett(0, 0, MW, MH, malta) + granelli(150, MW, MH, seme, scuro(malta, .3), .9, .35), f, k, g = luce(1);
    for (f = 0; f < 20; f++) for (k = 0; k < 2; k++) (function (y, x) {
      var r = rnd(seme * 97 + f * 13 + k * 5 + 3), c = scegli(r, cols), det = [], m;
      for (m = 0; m < 6; m++) det.push([2 + r() * 26, 2 + r() * 5.5, r()]);
      var rosa = bianchi && r() < .45 ? [3 + r() * 20, 2 + r() * 4, 3 + r() * 6] : null, scheggia = r() < .22 ? r() : -1;
      var pezzo = function (xx) {
        var t = rett(xx + 1.2, y + 9.1, 29, 1.1, "#000", op(.2)) +   // l'ombra nella fuga sotto
          rett(xx + 1, y + .9, 29, 8.3, c, "rx='1'") + rett(xx + 1, y + .9, 29, 8.3, g, "rx='1'");
        if (rosa) t += ell(xx + 1 + rosa[0], y + .9 + rosa[1] + 1.5, rosa[2], 1.8, "#d9a48e", op(.28));
        det.forEach(function (d) { t += cer(xx + 1 + d[0], y + .9 + d[1], .45 + d[2] * .4, d[2] < .6 ? scuro(c, .35) : chiaro(c, .4), op(bianchi ? .35 : .55)); });
        if (scheggia >= 0) t += pth("M" + q(xx + 1 + scheggia * 24, y + .9) + " l3,0 l-1.4,2 Z", malta);
        return t + rett(xx + 1.6, y + 1.3, 27.8, .7, "#fff", op(bianchi ? .5 : .22));
      };
      s += pezzo(x); if (x + 31 > MW) s += pezzo(x - MW);
    })(f * 10, (f % 2 ? 15.5 : 0) + k * 31);
    return s;
  }
  function sasso(pts, c, seme, k, linea) {   // una pietra: bordo scuro sotto, faccia chiara un po' in alto a sinistra, puntini
    var cx = 0, cy = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9, r = rnd(seme), s, i;
    pts.forEach(function (p) { cx += p[0]; cy += p[1]; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
    cx /= pts.length; cy /= pts.length;
    var fac = pts.map(function (p) { return [cx + (p[0] - cx) * .9 - .45, cy + (p[1] - cy) * .86 - .65]; }), d = tondo(fac, k * .9);
    s = pth(tondo(pts, k), scuro(c, .3), "stroke='" + (linea || L) + "' stroke-width='.9' stroke-opacity='.5' stroke-linejoin='round'") + pth(d, c) + pth(d, luce(1));
    for (i = 0; i < 5; i++) s += cer(cx + (r() - .5) * (x1 - x0) * .6, cy + (r() - .5) * (y1 - y0) * .55, .4 + r() * .5, r() < .65 ? scuro(c, .3) : chiaro(c, .45), op(.6));
    if (r() < .35) { var ax = cx + (r() - .5) * (x1 - x0) * .4, ay = y0 + (y1 - y0) * (.3 + r() * .3); s += tratto("M" + q(ax, ay) + " l" + q(2 + r() * 3, 1 + r() * 2) + " l" + q(2 + r() * 2, -1 + r() * 2), scuro(c, .4), .55, op(.6)); }
    return s + tratto("M" + q(fac[0][0] + 1.5, fac[0][1] + 1) + " L" + q(fac[1][0], fac[1][1] + 1), "#fff", .9, op(.3));
  }
  function pietraVista(seme) {   // file di pietre irregolari con la malta
    var cols = ["#b9ae9b", "#a99f8d", "#c6bba7", "#9e9484", "#b3a690", "#cdc2ae", "#a59c8f", "#bfae94"];
    var s = rett(0, 0, MW, MH, "#9a907f") + granelli(200, MW, MH, seme + 9, "#6b6255", 1, .45) + granelli(110, MW, MH, seme + 8, "#cbc1ae", 1, .55);
    var r = rnd(seme), y = 0, n = 0, g = 1.1;
    while (y < MH - .5) {
      var h = 17 + r() * 9; if (MH - y - h < 15) h = MH - y;
      var x = r() * MW, fine = x + MW;
      while (x < fine - .1) {
        var w = 13 + r() * 17; if (fine - x - w < 10) w = fine - x;
        var j = function () { return r() * 1.5; };
        var pts = [[x + g + j(), y + g + j()], [x + w * (.35 + r() * .3), y + g + j() * .7 - .3], [x + w - g - j(), y + g + j()], [x + w - g - j() * .8, y + h * (.35 + r() * .3)],
          [x + w - g - j(), y + h - g - j()], [x + w * (.35 + r() * .3), y + h - g - j() * .7 + .3], [x + g + j(), y + h - g - j()], [x + g + j() * .8, y + h * (.35 + r() * .3)]];
        var t = sasso(pts, scegli(r, cols), seme * 31 + (++n), 4);
        if (x < MW) s += t; if (x + w > MW) s += sposta(-MW, 0, t);
        x += w;
      }
      y += h;
    }
    return s;
  }
  function nodo(x, y, c, k) {   // un nodo del legno
    k = k || 1;
    return ell(x, y, 5.2 * k, 3.2 * k, "none", "stroke='" + scuro(c, .35) + "' stroke-width='.6' opacity='.4'") + ell(x, y, 3.4 * k, 2.2 * k, scuro(c, .25), "stroke='" + scuro(c, .45) + "' stroke-width='.6'") + ell(x - .3 * k, y - .2 * k, 1.5 * k, .9 * k, scuro(c, .55));
  }
  function tronchi(seme) {   // la baita: 8 tronchi con lo stucco chiaro in mezzo
    var cols = ["#b27c47", "#a8723f", "#b9854f", "#a06a39", "#ad7743", "#b5804b", "#a36e3c", "#b07a44"];
    var s = rett(0, 0, MW, MH, "#e4d6b8") + granelli(110, MW, MH, seme, "#a39072", 1, .45), i, j;
    for (i = 0; i < 8; i++) {
      var y = i * 25, c = cols[i], r = rnd(seme * 13 + i + 1);
      s += rett(0, y + 23.8, MW, 2.4, "#000", op(.2));   // l'ombra del tronco sullo stucco
      s += rett(0, y + 2, MW, 22, lin("tr" + i, [[0, chiaro(c, .32)], [.2, chiaro(c, .12)], [.55, c], [.85, scuro(c, .28)], [1, scuro(c, .5)]], 0, 0, 0, 1));
      for (j = 0; j < 11; j++) (function (x, yy, l, a, b, sc, o, w) {   // la corteccia
        s += giro(x + l / 2, yy, l / 2 + 1, MW, 0, function (cx) { var x0 = cx - l / 2; return tratto("M" + q(x0, yy) + " C" + q(x0 + l * .33, yy + a) + " " + q(x0 + l * .66, yy + b) + " " + q(x0 + l, yy), sc ? scuro(c, .45) : chiaro(c, .4), w, op(o)); });
      })(r() * MW, y + 5 + r() * 16, 10 + r() * 24, (r() - .5) * 2, (r() - .5) * 2, r() < .7, .25 + r() * .25, .6 + r() * .5);
      if (r() < .75) (function (x, yy) { s += giro(x, yy, 6, MW, 0, function (a) { return nodo(a, yy, c, .9); }); })(r() * MW, y + 10 + r() * 7);
      s += rett(0, y + 1.6, MW, .9, L, op(.75)) + rett(0, y + 23.6, MW, 1, L, op(.85)) + rett(0, y + 3.2, MW, 1.2, "#fff", op(.25));
    }
    return s;
  }
  function doghe(seme) {   // doghe di legno orizzontali sovrapposte
    var cols = ["#c99a62", "#c09058", "#d0a46c", "#b98953", "#c6975f", "#cc9f67"], s = "", i, j;
    for (i = 0; i < 16; i++) {
      var y = i * 12.5, r = rnd(seme * 17 + i + 1), c = scegli(r, cols);
      s += rett(0, y, MW, 12.5, lin("dg" + i, [[0, chiaro(c, .18)], [.7, c], [1, scuro(c, .22)]], 0, 0, 0, 1));
      for (j = 0; j < 4; j++) (function (x, yy, l, a, b, o) {
        s += giro(x + l / 2, yy, l / 2 + 1, MW, 0, function (cx) { var x0 = cx - l / 2; return tratto("M" + q(x0, yy) + " C" + q(x0 + l * .33, yy + a) + " " + q(x0 + l * .66, yy + b) + " " + q(x0 + l, yy), scuro(c, .35), .55, op(o)); });
      })(r() * MW, y + 3 + r() * 8, 14 + r() * 30, (r() - .5) * 1.6, (r() - .5) * 1.6, .25 + r() * .2);
      if (r() < .45) (function (jx) {   // la giunta tra due doghe
        s += giro(jx, 0, 2, MW, 0, function (a) { return rett(a - .4, y + .4, .8, 11.4, L, op(.35)) + rett(a + .4, y + .4, .5, 11.4, "#fff", op(.2)); });
      })(r() * MW);
      s += rett(0, y, MW, 2.8, lin("dgo", [[0, "#000", .34], [1, "#000", 0]], 0, 0, 0, 1)) + rett(0, y + 11.8, MW, .8, L, op(.6)) + rett(0, y + 10.8, MW, .8, "#fff", op(.28));
    }
    return s;
  }
  function pannelli() {   // pannelli moderni bianchi, tre per altezza, con i fissaggi
    var s = rett(0, 0, MW, MH, "#77736c"), i, h = MH / 3;
    for (i = 0; i < 3; i++) {
      var y = i * h, c = ["#f6f5f1", "#eeede8", "#f3f2ed"][i];
      s += rett(.7, y + .7, MW - 1.4, h - 1.4, lin("pn" + i, [[0, "#ffffff"], [.55, c], [1, scuro(c, .07)]], 0, 0, .5, 1));
      s += pth("M" + q(14 + i * 6, y + .7) + " L" + q(26 + i * 6, y + .7) + " L" + q(8 + i * 6, y + h - .7) + " L" + q(-4 + i * 6, y + h - .7) + " Z", "#fff", op(.45));   // un riflesso largo
      s += rett(.7, y + .7, MW - 1.4, .8, "#fff", op(.9)) + rett(.7, y + h - 1.6, MW - 1.4, .9, "#000", op(.08));
      [[4.5, y + 5], [MW - 4.5, y + 5], [4.5, y + h - 5], [MW - 4.5, y + h - 5]].forEach(function (p) { s += cer(p[0], p[1], 1.15, "#c9c6bf", "stroke='#8a867f' stroke-width='.5'") + cer(p[0] - .3, p[1] - .3, .4, "#fff", op(.8)); });
    }
    return s + rett(0, 0, MW, MH, "none", "stroke='#5e5a54' stroke-width='.6' opacity='.3'");
  }
  function blocchiPietra(y0, y1, righe, seme) {   // pietra squadrata (lo zoccolo e i davanzali)
    var cols = ["#b8ad99", "#aaa08c", "#c4baa6", "#a39885", "#bdb29d"], s = rett(0, y0, MW, y1 - y0, "#857b6b"), h = (y1 - y0) / righe, f, k;
    for (f = 0; f < righe; f++) for (k = 0; k < 2; k++) (function (y, x) {
      var r = rnd(seme * 19 + f * 3 + k + 1), c = scegli(r, cols);
      var t = sasso([[x + 1, y + 1], [x + 30, y + 1], [x + 30, y + h - 1], [x + 1, y + h - 1]], c, seme * 23 + f * 5 + k, 1.6);
      s += t; if (x + 31 > MW) s += sposta(-MW, 0, t);
    })(y0 + f * h, (f % 2 ? 15.5 : 0) + k * 31);
    return s;
  }
  function zoccolo(col, seme) {   // intonaco con lo zoccolo di pietra in basso
    var s = intonaco(col, seme, false) + blocchiPietra(163, 200, 2, seme + 5);
    return s + rett(0, 161, MW, 4, "#000", op(.12)) + rett(0, 155, MW, 8, lin("zc", [[0, "#efe6d5"], [.45, "#d9ccb4"], [1, "#a99c84"]], 0, 0, 0, 1)) +
      rett(0, 154.6, MW, .9, L, op(.7)) + rett(0, 155.6, MW, .9, "#fff", op(.75)) + rett(0, 162.4, MW, .9, L, op(.7)) + granelli(30, MW, 8, seme, "#8a7d66", .8, .4).replace("<path", "<path transform='translate(0 155)'");
  }
  function pittura(col, seme) { return intonaco(col, seme, true) + battiscopa(); }
  function carta(col, seme) { return rett(0, 0, MW, MH, col) + granelli(70, MW, MH, seme, scuro(col, .3), .7, .1) + granelli(50, MW, MH, seme + 1, "#fff", .7, .25); }
  function cartaRighe() {
    var s = carta("#f3e8d3", 41), k;
    for (k = 0; k < 4; k++) {
      var x = k * 15.5;
      s += rett(x + 1.6, 0, 6.4, MH, "#a3bacb") + rett(x + 1.6, 0, .7, MH, "#7f99b0") + rett(x + 7.3, 0, .7, MH, "#7f99b0") + rett(x + 3.1, 0, .5, MH, "#fff", op(.35));
      s += rett(x + 11.3, 0, 1, MH, "#c9a466", op(.9));
    }
    return s + granelli(60, MW, MH, 47, "#fff", .7, .2) + battiscopa();
  }
  function fiore(x, y, k, rot, cp) {   // un rametto: due foglie, cinque petali, il bottone giallo
    var s = "<g transform='translate(" + q(x, y) + ") rotate(" + f2(rot) + ") scale(" + f2(k) + ")'>", i;
    s += pth("M0,1 C-3,2 -6,5 -7.5,8 C-4.5,7.8 -1.8,5.5 0,1 Z", "#7fa36a", bordo("#4f7140", .5)) + pth("M0.5,1 C3.5,2.5 5.5,5 6,7.6 C3.4,6.6 1.4,4.6 .5,1 Z", "#93b67c", bordo("#4f7140", .5));
    for (i = 0; i < 5; i++) { var a = (i * 72 - 90) * Math.PI / 180; s += cer(Math.cos(a) * 2.1, Math.sin(a) * 2.1 - 1, 2, cp, bordo(scuro(cp, .3), .45)); }
    return s + cer(0, -1, 1.15, "#f2c94c", bordo("#b98a1c", .4)) + cer(-.9, -2.6, .6, "#fff", op(.6)) + "</g>";
  }
  function cartaFiori() {
    var s = carta("#f6eedb", 43), riga, k;
    for (riga = 0; riga < 9; riga++) for (k = 0; k < 2; k++) (function (y, x, cp, rot) {
      s += giro(x, y, 9, MW, 0, function (a) { return fiore(a, y, 1.05, rot, cp); });
    })(10 + riga * 24, (riga % 2 ? 0 : 15.5) + k * 31, (riga + k) % 2 ? "#e98d9a" : "#f0a9a0", ((riga * 2 + k) % 3 - 1) * 14);
    for (riga = 0; riga < 9; riga++) for (k = 0; k < 2; k++) (function (y, x) {   // i puntini tra un rametto e l'altro
      s += giro(x, y, 3, MW, 0, function (a) { return cer(a, y, .9, "#9cbf86") + cer(a + 2.2, y + 1.2, .7, "#9cbf86") + cer(a - 1.6, y + 1.8, .6, "#e98d9a"); });
    })(22 + riga * 24, (riga % 2 ? 15.5 : 0) + k * 31);
    return s + battiscopa();
  }
  function cartaPois() {
    var s = carta("#b9d6e8", 45), riga, k;
    for (riga = 0; riga < 16; riga++) for (k = 0; k < 4; k++) (function (y, x) {
      s += giro(x, y, 3.5, MW, 0, function (a) { return cer(a + .5, y + .6, 2.9, "#7fa7c2", op(.45)) + cer(a, y, 2.9, "#fffaf2") + cer(a - .9, y - .9, .9, "#fff"); });
    })(6 + riga * 13, (riga % 2 ? 7.75 : 0) + k * 15.5);
    return s + battiscopa();
  }
  function cartaQuadretti() {
    var s = carta("#fbf7ef", 49), k, col = "#d8635b";
    for (k = 0; k < 4; k++) s += rett(k * 15.5, 0, 7.75, MH, col, op(.4)) + rett(k * 15.5 + 1.9, 0, .5, MH, "#fff", op(.3)) + rett(k * 15.5 + 5.3, 0, .5, MH, "#fff", op(.3));
    for (k = 0; k < 13; k++) s += rett(0, k * 15.5, MW, 7.75, col, op(.4)) + rett(0, k * 15.5 + 1.9, MW, .5, "#fff", op(.3)) + rett(0, k * 15.5 + 5.3, MW, .5, "#fff", op(.3));
    return s + battiscopa();
  }
  function damasco(x, y, oro, fondo) {   // il motivo damascato: metà sinistra disegnata e specchiata, più il centro
    var lc = "stroke='#7a5a26' stroke-width='.45' stroke-linejoin='round'";
    var meta = tratto("M-4.6,-1 C-9,-6.5 -14,-3.5 -13.4,1.6 C-12.8,6.4 -7.8,7.6 -6.8,4.2", "#7a5a26", 3.2) + tratto("M-4.6,-1 C-9,-6.5 -14,-3.5 -13.4,1.6 C-12.8,6.4 -7.8,7.6 -6.8,4.2", oro, 2.3) + cer(-7.2, 3.6, 1.7, oro, lc) +   // la voluta
      pth("M-9.4,-4.6 C-10.6,-9.6 -13.8,-12.4 -13.6,-17.6 C-10.4,-15.4 -8.2,-11 -8.6,-5.2 Z", oro, lc) +   // la foglia sopra la voluta
      pth("M-1,-10.4 C-4.2,-12.2 -7.2,-16 -6.4,-21.4 C-3.6,-18.6 -2,-14.6 -1,-10.4 Z", oro, lc) +   // il petalo di lato della corona
      pth("M-1.4,10.6 C-4.6,13.4 -10.4,14.4 -12.6,20.6 C-8.6,20.4 -4.4,18.8 -1.2,15 Z", oro, lc) +   // la foglia in basso
      cer(-12.8, 10, 1.1, oro, lc) + cer(-14.6, -8.6, .9, oro, lc) + cer(-3.6, -24, .9, oro, lc);
    var centro = pth("M0,-8.6 C5.4,-6.6 7.4,-.4 5.4,5.8 C4.2,9 2.2,11.2 0,12.4 C-2.2,11.2 -4.2,9 -5.4,5.8 C-7.4,-.4 -5.4,-6.6 0,-8.6 Z", oro, lc) +   // il bulbo
      pth("M0,-4.4 C2.4,-2.4 3,1.6 0,6.4 C-3,1.6 -2.4,-2.4 0,-4.4 Z", fondo) + cer(0, 9, 1, fondo) +
      pth("M0,-9.4 C2.2,-13.4 2.2,-18.6 0,-24 C-2.2,-18.6 -2.2,-13.4 0,-9.4 Z", oro, lc) +   // il petalo in alto
      tratto("M0,12.4 L0,21.6", oro, 1.6) + cer(0, 23, 1.6, oro, lc) + ell(-2.4, -4.8, .9, 2.2, "#fff", op(.35));
    return "<g transform='translate(" + q(x, y) + ")'>" + meta + "<g transform='scale(-1 1)'>" + meta + "</g>" + centro + "</g>";
  }
  function cartaDamascata() {
    var base = "#2d4559", s = carta(base, 51), m, oro = lin("dm", [[0, "#ecd394"], [.5, "#c9a560"], [1, "#9c7a3c"]], 0, 0, .4, 1);
    for (m = -1; m < 5; m++) s += damasco(15.5, 25 + m * 50, oro, base) + damasco(46.5, m * 50, oro, base);
    return s + battiscopa("#efe7d6");
  }
  function stella(x, y, R, rot, col, lin2) {
    var a = [], i;
    for (i = 0; i < 10; i++) { var ang = (rot + i * 36 - 90) * Math.PI / 180, rr = i % 2 ? R * .5 : R; a.push([x + Math.cos(ang) * rr, y + Math.sin(ang) * rr]); }
    return pth(tondo(a, R * .16), col, bordo(lin2, .7)) + cer(x - R * .25, y - R * .3, R * .18, "#fff", op(.7));
  }
  function cartaStelline() {
    var s = carta("#cde2f5", 53), r = rnd(57), c, j;
    for (j = 0; j < 10; j++) for (c = 0; c < 3; c++) (function (x, y, R, rot, tipo) {
      var col = tipo < .62 ? "#ffd75e" : tipo < .82 ? "#fffdf4" : "#ffb9cb", lc = tipo < .62 ? "#d99a2b" : tipo < .82 ? "#a9bfd6" : "#d77b96";
      s += giro(x, y, R + 1, MW, 0, function (a) { return stella(a, y, R, rot, col, lc); });
    })(c * 20.67 + 3 + r() * 14.7, j * 18.6 + 3 + r() * 12, 2.8 + r() * 2.2, r() * 72, r());
    return s + granelli(36, MW, 185, 59, "#fff", 1.5, .85) + granelli(20, MW, 185, 61, "#ffe48a", 1.2, .8) + battiscopa();
  }
  function foglia(x, y, ang, k, c, tipo, fondo) {   // una foglia tropicale: monstera (col buchi) o banano (lunga, con gli strappi)
    var s = "<g transform='translate(" + q(x, y) + ") rotate(" + f2(ang) + ") scale(" + f2(k) + ")'>", g = lin("fo", [[0, "#fff", .2], [.5, "#fff", 0], [1, "#000", .2]], 0, 0, .6, 1);
    if (tipo) {   // monstera: a cuore, i tagli dal bordo verso la costola e i forellini
      var m = "M0,-3 C-2,0 -9,1 -12,-4 C-15,-9 -15,-17 -11,-22 C-8,-26 -3,-27 0,-26 C3,-27 8,-26 11,-22 C15,-17 15,-9 12,-4 C9,1 2,0 0,-3 Z";
      s += tratto("M0,-3 L0,6", scuro(c, .2), 1.5) + pth(m, c, bordo(scuro(c, .45), .6)) + pth(m, g);
      s += tratto("M0,-3.5 L0,-25", chiaro(c, .35), .8);
      [[-13.6, -5.6, -3.4, -7.4], [-14.8, -11, -3.4, -12.2], [-14.2, -16.6, -3.2, -16.8], [-10.6, -22.2, -2.6, -20.8]].forEach(function (t) {
        [1, -1].forEach(function (lato) {
          var a = [t[0] * lato, t[1]], b = [t[2] * lato, t[3]];
          s += pth("M" + q(a[0], a[1] - 1.1) + " L" + q(b[0], b[1] - .3) + " L" + q(b[0], b[1] + .3) + " L" + q(a[0], a[1] + 1.1) + " Z", fondo);
          s += tratto("M" + q(b[0] * .4, b[1] - .4) + " L" + q(b[0] * 1.2, b[1] - .4), scuro(c, .25), .4, op(.5));
        });
      });
      s += ell(-2.2, -4.6, .7, 1.3, fondo) + ell(2.2, -9.4, .7, 1.3, fondo) + ell(-2.1, -14.4, .6, 1.2, fondo) + ell(2, -19, .5, 1, fondo);
    } else {
      var b = "M0,0 C-4.5,-6 -5.2,-16 0,-25 C5.2,-16 4.5,-6 0,0 Z", i;
      s += tratto("M0,0 L0,5", scuro(c, .2), 1.2) + pth(b, c, bordo(scuro(c, .4), .6)) + pth(b, g);
      for (i = 1; i < 8; i++) { var yy = -i * 3; s += tratto("M0," + yy + " l-3.6,-2.4 M0," + yy + " l3.6,-2.4", chiaro(c, .3), .45, op(.7)); }
      s += tratto("M-4,-9 l2.6,-1.6 M4.4,-14 l-2.8,-1.8", fondo, .9) + tratto("M0,-.5 L0,-24", chiaro(c, .35), .6);
    }
    return s + "</g>";
  }
  function cartaFoglie() {
    var fondo = "#eef1e3", s = carta(fondo, 63), r = rnd(67), c, j, dietro = ["#1f5c3a", "#25683f", "#2c7046"], avanti = ["#3f8f55", "#5aa565", "#4c9a5c", "#6db06e", "#358549"];
    for (j = 0; j < 8; j++) for (c = 0; c < 2; c++) (function (x, y, ang, k, col, tipo) {   // le foglie scure dietro
      s += giro(x, y, 26 * k, MW, 0, function (a) { return foglia(a, y, ang, k, col, tipo, fondo); });
    })(c * 31 + r() * 31, j * 25 + r() * 20, (r() < .5 ? 0 : 180) - 60 + r() * 120, .75 + r() * .3, scegli(r, dietro), r() < .5);
    for (j = 0; j < 7; j++) for (c = 0; c < 2; c++) (function (x, y, ang, k, col, tipo) {   // quelle chiare davanti
      s += giro(x, y, 26 * k, MW, 0, function (a) { return foglia(a, y, ang, k, col, tipo, fondo); });
    })(c * 31 + 8 + r() * 18, 12 + j * 26 + r() * 14, (r() < .5 ? 0 : 180) - 55 + r() * 110, .85 + r() * .3, scegli(r, avanti), r() < .55);
    return s + battiscopa();
  }
  function piastrelleMeta(tipo) {   // piastrelle fino a metà altezza, la pittura sopra
    var s, k, j;
    if (tipo === "bagno") {
      s = intonaco("#e8f1ef", 71, true) + rett(0, 102, MW, 98, "#eef3f2");
      var cols = ["#a9d6e0", "#b2dbe4", "#a2d0db", "#b8dfe6"], gl = lin("gl", [[0, "#fff", .55], [.45, "#fff", .06], [1, "#000", .08]], 0, 0, .6, 1);
      for (j = 0; j < 6; j++) for (k = 0; k < 4; k++) (function (x, y) {
        var r = rnd(73 + j * 4 + k), c = scegli(r, cols);
        s += rett(x + .6, y + .6, 14.3, 14.3, c, "rx='.8'") + rett(x + .6, y + .6, 14.3, 14.3, gl, "rx='.8'") + tratto("M" + q(x + 3, y + 7) + " L" + q(x + 7, y + 3), "#fff", .9, op(.6)) +
          rett(x + .6, y + .6, 14.3, 14.3, "none", "rx='.8' stroke='" + scuro(c, .3) + "' stroke-width='.5' opacity='.6'");
      })(k * 15.5, 107 + j * 15.5);
      s += rett(0, 107, MW, 1.6, "#000", op(.14)) + rett(0, 101, MW, 6, lin("lb", [[0, "#8cc3d4"], [.5, "#4f93ab"], [1, "#2f6f87"]], 0, 0, 0, 1)) + rett(0, 100.6, MW, .9, L, op(.6)) + rett(0, 101.8, MW, .7, "#fff", op(.6));
      for (k = 0; k < 8; k++) s += pth("M" + q(3.9 + k * 7.75, 102.2) + " l1.8,1.8 l-1.8,1.8 l-1.8,-1.8 Z", "#f4fbfd", op(.9));
      return s;
    }
    s = intonaco("#efe5d1", 75, true) + rett(0, 108, MW, 92, "#cdc8be");   // le piastrelle "metro" bianche, sfalsate
    for (j = 0; j < 12; j++) for (k = 0; k < 4; k++) (function (x, y) {
      var r = rnd(77 + j * 5 + k), c = scegli(r, ["#f8f7f3", "#f3f1ec", "#faf9f6", "#efede7"]);
      var t = rett(x + .5, y + .5, 14.5, 6.5, c, "rx='1.2'") + rett(x + .5, y + .5, 14.5, 6.5, lin("mt", [[0, "#fff", .8], [.35, "#fff", 0], [1, "#000", .12]], 0, 0, 0, 1), "rx='1.2'") +
        rett(x + 1.5, y + 5.6, 12.5, .8, "#000", op(.08)) + rett(x + 2, y + 1.4, 6, .6, "#fff", op(.9));
      s += t; if (x + 15.5 > MW) s += sposta(-MW, 0, t);
    })((j % 2 ? 7.75 : 0) + k * 15.5, 110 + j * 7.5);
    return s + rett(0, 110, MW, 1.4, "#000", op(.12)) + rett(0, 105, MW, 5, lin("lm", [[0, "#ffffff"], [.5, "#ebe8e1"], [1, "#c9c4b9"]], 0, 0, 0, 1)) + rett(0, 104.6, MW, .9, L, op(.55));
  }
  function riquadro(x, y, w, h, c, b) {   // un pannello in rilievo: smussi chiari in alto a sinistra, scuri in basso a destra
    b = b || 2.4;
    return rett(x, y, w, h, scuro(c, .2), bordo(scuro(c, .5), .8)) +
      pth("M" + q(x, y) + " L" + q(x + w, y) + " L" + q(x + w - b, y + b) + " L" + q(x + b, y + b) + " Z", chiaro(c, .3)) +
      pth("M" + q(x, y) + " L" + q(x + b, y + b) + " L" + q(x + b, y + h - b) + " L" + q(x, y + h) + " Z", chiaro(c, .16)) +
      pth("M" + q(x, y + h) + " L" + q(x + b, y + h - b) + " L" + q(x + w - b, y + h - b) + " L" + q(x + w, y + h) + " Z", scuro(c, .3)) +
      pth("M" + q(x + w, y) + " L" + q(x + w, y + h) + " L" + q(x + w - b, y + h - b) + " L" + q(x + w - b, y + b) + " Z", scuro(c, .18)) +
      rett(x + b, y + b, w - 2 * b, h - 2 * b, c) + rett(x + b, y + b, w - 2 * b, h - 2 * b, "none", "stroke='" + scuro(c, .45) + "' stroke-width='.5' opacity='.6'");
  }
  function boiserie() {   // pannelli di legno in basso, con la cornice a metà muro e la pittura sopra
    var c = "#a8743f", s = intonaco("#ece0c8", 81, true);
    s += rett(0, 116, MW, 84, lin("bw", [[0, chiaro(c, .1)], [1, scuro(c, .1)]], 0, 0, 0, 1)) + venature(0, 116, MW, 84, c, 83, 16, true, .8);
    s += riquadro(8, 128, 46, 52, chiaro(c, .06), 3.2) + venature(11.2, 131.2, 39.6, 45.6, chiaro(c, .06), 85, 8, true, .9);
    s += rett(0, 120, MW, 2.4, "#000", op(.18)) + rett(0, 110, MW, 10, lin("bc", [[0, chiaro(c, .45)], [.35, chiaro(c, .15)], [.7, c], [1, scuro(c, .35)]], 0, 0, 0, 1)) +
      rett(0, 109.6, MW, .9, L, op(.7)) + rett(0, 113.4, MW, .6, scuro(c, .4), op(.6)) + rett(0, 110.8, MW, .8, "#fff", op(.45)) + rett(0, 119.4, MW, .9, L, op(.6)) + rett(0, 106, MW, 4, lin("bco", [[0, "#000", 0], [1, "#000", .1]], 0, 0, 0, 1));
    return s + battiscopa(scuro(c, .12));
  }
  function perline() {   // perline di pino verticali, con la scanalatura
    var cols = ["#e2b77a", "#d9ad6f", "#e8c088", "#d4a668", "#dfb476"], s = "", k;
    for (k = 0; k < 5; k++) (function (x, c) {
      var t = rett(x, 0, 12.4, MH, lin("pe" + k, [[0, chiaro(c, .12)], [.5, c], [1, scuro(c, .1)]], 0, 0, 1, 0)) + venature(x, 0, 12.4, MH, c, 91 + k, 5, true, 1.1);
      var r = rnd(93 + k); if (r() < .8) t += nodo(x + 3 + r() * 6, 20 + r() * 150, c, .7);
      t += rett(x, 0, 1, MH, scuro(c, .45)) + rett(x + 1, 0, .7, MH, "#fff", op(.4));
      s += t; if (x + 12.4 > MW) s += sposta(-MW, 0, t);
    })(6.2 + k * 12.4, cols[k]);
    return s + battiscopa("#c9965a");
  }

  var MURI = [];
  function muro(id, nome, dove, fa) { MURI.push({ id: id, nome: nome, dove: dove, svg: function () { return svg("m_" + id, MW, MH, fa); } }); }
  [["crema", "Intonaco crema", "#f1dfbd"], ["bianco", "Intonaco bianco", "#f4f1ea"], ["paglia", "Intonaco giallo paglia", "#ecd28c"], ["rosa", "Intonaco rosa antico", "#e2b2a2"],
    ["azzurro", "Intonaco azzurro polvere", "#b9cfdc"], ["salvia", "Intonaco salvia", "#bfcaa8"], ["terracotta", "Intonaco terracotta", "#cf8a63"], ["perla", "Intonaco grigio perla", "#cfcfcb"]].forEach(function (v, i) {
    muro("intonaco_" + v[0], v[1], "fuori", function () { return intonaco(v[2], 101 + i * 7, false); });
  });
  muro("mattoni_rossi", "Mattoni rossi", "fuori", function () { return mattoni(["#b4533a", "#a9472f", "#bf5f40", "#9b402c", "#b85a3c", "#a44b34", "#c76a48", "#8f3a29"], "#d6c7ae", 151); });
  muro("mattoni_chiari", "Mattoni chiari", "fuori", function () { return mattoni(["#e6cc9c", "#dcbf8c", "#eed7ad", "#d3b07c", "#e2c393", "#c9a473"], "#b9ae9c", 153); });
  muro("pietra", "Pietra a vista", "fuori", function () { return pietraVista(155); });
  muro("tronchi", "Tronchi (baita)", "fuori", function () { return tronchi(157); });
  muro("doghe", "Doghe di legno", "fuori", function () { return doghe(159); });
  muro("pannelli", "Pannelli moderni", "fuori", pannelli);
  muro("zoccolo", "Intonaco con zoccolo", "fuori", function () { return zoccolo("#f1dfbd", 161); });
  [["latte", "Bianco latte", "#f6f1e7"], ["tortora", "Tortora", "#cfc2b1"], ["salvia", "Verde salvia", "#b7c4a6"], ["menta", "Menta", "#bfe3d0"], ["azzurro", "Azzurro cielo", "#b9d3e6"],
    ["blu", "Blu notte", "#3f557a"], ["lavanda", "Lavanda", "#c9bfe0"], ["cipria", "Rosa cipria", "#efcbc3"], ["pesca", "Pesca", "#f2bf9b"], ["burro", "Giallo burro", "#f3e1a2"]].forEach(function (v, i) {
    muro("pittura_" + v[0], v[1], "dentro", function () { return pittura(v[2], 201 + i * 5); });
  });
  muro("carta_righe", "Carta a righe", "dentro", cartaRighe);
  muro("carta_fiori", "Carta a fiori", "dentro", cartaFiori);
  muro("carta_pois", "Carta a pois", "dentro", cartaPois);
  muro("carta_quadretti", "Carta a quadretti", "dentro", cartaQuadretti);
  muro("carta_damascata", "Carta damascata", "dentro", cartaDamascata);
  muro("carta_stelline", "Carta con le stelline", "dentro", cartaStelline);
  muro("carta_foglie", "Carta tropicale", "dentro", cartaFoglie);
  muro("mattoncini_bianchi", "Mattoncini bianchi", "dentro", function () { return mattoni(["#f4f1ea", "#eeeae2", "#f7f5f0", "#e8e3d9", "#f1ede5"], "#d6d0c4", 251, true) + battiscopa(); });
  muro("piastrelle_bagno", "Piastrelle da bagno", "dentro", function () { return piastrelleMeta("bagno"); });
  muro("piastrelle_cucina", "Piastrelle da cucina", "dentro", function () { return piastrelleMeta("cucina"); });
  muro("boiserie", "Boiserie di legno", "dentro", boiserie);
  muro("perline", "Perline di legno", "dentro", perline);

  // =========================================================
  //  I PAVIMENTI (100 × 100, si ripetono nei due versi)
  // =========================================================
  function parquet(cols, seme, righe) {   // assi orizzontali: le file spostate di mezza, così nessuna fuga cade sul bordo
    var h = 100 / righe, r = rnd(seme), s = rett(0, 0, 100, 100, scuro(cols[0], .5)), j, g = lin("pq", [[0, "#fff", .16], [.5, "#fff", 0], [1, "#000", .14]], 0, 0, 0, 1);
    for (j = 0; j < righe; j++) {
      var y = h / 2 + j * h, a = r() * 100, b = a + 38 + r() * 26;
      [[a, b], [b, a + 100]].forEach(function (pz, n) {
        var rr = rnd(seme * 53 + j * 11 + n * 7 + 1), c = scegli(rr, cols), X = pz[0] % 100, w = pz[1] - pz[0], kn = rr() < .14 ? [rr(), rr()] : null, vs = rr() * 1e5 | 0;
        var asse = function (x, yy) {
          var t = rett(x + .45, yy + .45, w - .9, h - .9, c, "rx='.6'") + venature(x + .5, yy + 1, w - 1, h - 2, c, vs, 6, false, 1.3);
          if (kn) t += nodo(x + w * (.15 + .7 * kn[0]), yy + h * (.3 + .4 * kn[1]), c, .4);
          return t + rett(x + .45, yy + .45, w - .9, h - .9, g, "rx='.6'") + rett(x + 1, yy + .8, w - 2, .6, "#fff", op(.3));
        };
        [X, X - 100].forEach(function (xx) { if (xx < 100 && xx + w > 0) { s += asse(xx, y); if (y + h > 100) s += asse(xx, y - 100); } });
      });
    }
    return s;
  }
  function spinaPesce(cols, seme) {   // spina di pesce vera: assi 4 volte più lunghe che larghe, a 45°
    var w = 12.5 / Math.SQRT2, Lp = 4 * w, s = rett(0, 0, 100, 100, scuro(cols[0], .5)), i, j, t, g = lin("sp", [[0, "#fff", .18], [.5, "#fff", 0], [1, "#000", .15]], 0, 0, .3, 1);
    function rot(x, y) { return [(x - y) / Math.SQRT2, (x + y) / Math.SQRT2]; }
    for (j = -2; j <= 3; j++) for (i = -10; i <= 18; i++) for (t = 0; t < 2; t++) {
      var bx = i * w + j * Lp, by = i * w - j * Lp, rc = t ? [bx + Lp, by + w - Lp, w, Lp] : [bx, by, Lp, w];
      var x0 = rc[0] + .45, y0 = rc[1] + .45, x1 = rc[0] + rc[2] - .45, y1 = rc[1] + rc[3] - .45;
      var a = [rot(x0, y0), rot(x1, y0), rot(x1, y1), rot(x0, y1)];
      var mx = Math.min(a[0][0], a[1][0], a[2][0], a[3][0]), Mx = Math.max(a[0][0], a[1][0], a[2][0], a[3][0]), my = Math.min(a[0][1], a[1][1], a[2][1], a[3][1]), My = Math.max(a[0][1], a[1][1], a[2][1], a[3][1]);
      if (Mx < 0 || mx > 100 || My < 0 || my > 100) continue;
      var rr = rnd(seme * 61 + (((i % 8) + 8) % 8) * 5 + (((j % 2) + 2) % 2) * 3 + t + 1), c = scegli(rr, cols), d = "M" + a.map(function (v) { return q(v[0], v[1]); }).join(" L") + " Z", k;
      s += pth(d, c);
      for (k = 0; k < 3; k++) {   // le venature lungo l'asse
        var f = .2 + rr() * .6, p0 = t ? rot(x0 + (x1 - x0) * f, y0 + 1) : rot(x0 + 1, y0 + (y1 - y0) * f), p1 = t ? rot(x0 + (x1 - x0) * (f + (rr() - .5) * .3), y1 - 1) : rot(x1 - 1, y0 + (y1 - y0) * (f + (rr() - .5) * .3));
        s += tratto("M" + q(p0[0], p0[1]) + " L" + q(p1[0], p1[1]), scuro(c, .3), .5, op(.3));
      }
      s += pth(d, g);
    }
    return s;
  }
  function piastrelle(n, fuga, colFuga, seme, fa) {   // n per lato; fa(x, y, lato, r, i, j) disegna una piastrella
    var l = 100 / n, s = rett(0, 0, 100, 100, colFuga), i, j;
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) s += fa(i * l + fuga / 2, j * l + fuga / 2, l - fuga, rnd(seme * 71 + j * n + i + 1), i, j);
    return s;
  }
  function lucido(x, y, l, forte) {   // la lucentezza della ceramica: chiaro in alto a sinistra e un riflesso
    var k = forte || 1;
    return rett(x, y, l, l, lin("lc" + Math.round(k * 10), [[0, "#fff", .5 * k], [.45, "#fff", .05], [1, "#000", .1]], 0, 0, .6, 1), "rx='.8'") + tratto("M" + q(x + l * .14, y + l * .42) + " L" + q(x + l * .42, y + l * .14), "#fff", l * .05, op(.45 * k));
  }
  function venaMarmo(x, y, l, r, col, o) {   // una vena del marmo: lunga e morbida, in diagonale, con l'alone e due rametti sottili
    var a = [x - 2, y + r() * l * .55], b = [x + l + 2, y + l * .45 + r() * l * .55], c1 = [x + l * .33, a[1] + (r() - .3) * l * .45], c2 = [x + l * .66, b[1] - (r() - .3) * l * .45];
    var d = "M" + q(a[0], a[1]) + " C" + q(c1[0], c1[1]) + " " + q(c2[0], c2[1]) + " " + q(b[0], b[1]), s = tratto(d, col, 3.2, op(o * .18)) + tratto(d, col, .5 + r() * .5, op(o)), k;
    for (k = 0; k < 2; k++) {
      var t = .2 + r() * .6, u = 1 - t, px = u * u * u * a[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * b[0], py = u * u * u * a[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * b[1];
      var lg = l * (.18 + r() * .25), an = (r() < .5 ? -1 : 1) * (.5 + r() * .7);
      s += tratto("M" + q(px, py) + " q" + q(lg * .5, lg * an * .2) + " " + q(lg, lg * an * .55), col, .35, op(o * .8));
    }
    return s;
  }
  function moquette(c, seme) {
    return rett(0, 0, 100, 100, c) + macchieMorbide(16, 100, 100, seme, chiaro(c, .25), scuro(c, .15), 10, 24, .14, true) +
      granelli(520, 100, 100, seme + 1, scuro(c, .35), .9, .3, true) + granelli(380, 100, 100, seme + 2, chiaro(c, .35), .9, .35, true) + granelli(160, 100, 100, seme + 3, scuro(c, .5), .6, .3, true);
  }
  function opusRomano(seme) {   // pietra di dentro: lastre di travertino di misure diverse
    var B = [[0, 0, 2, 2], [2, 0, 2, 1], [2, 1, 1, 1], [3, 1, 1, 2], [0, 2, 1, 2], [1, 2, 2, 1], [1, 3, 1, 1], [2, 3, 2, 1]], cols = ["#ddd0b6", "#d2c3a6", "#e4d8c0", "#cbbb9c", "#d8c9ab", "#e0d1b5"];
    var s = rett(0, 0, 100, 100, "#a5967c"), g = 1.6;
    B.forEach(function (b, n) {
      var r = rnd(seme * 29 + n + 1), c = scegli(r, cols), x = b[0] * 25 + g / 2, y = b[1] * 25 + g / 2, w = b[2] * 25 - g, h = b[3] * 25 - g, t = rett(x, y, w, h, c), k;
      for (k = 0; k < 6; k++) { var yy = y + r() * h; t += tratto("M" + q(x, yy) + " C" + q(x + w * .3, yy + (r() - .5) * 4) + " " + q(x + w * .7, yy + (r() - .5) * 4) + " " + q(x + w, yy + (r() - .5) * 3), r() < .5 ? scuro(c, .12) : chiaro(c, .3), 1 + r() * 2, op(.35)); }
      for (k = 0; k < 7; k++) t += ell(x + 2 + r() * (w - 4), y + 2 + r() * (h - 4), .7 + r() * 1.6, .35 + r() * .4, scuro(c, .35), op(.55));   // i forellini del travertino
      s += dentro("or" + n, "<rect x='" + f2(x) + "' y='" + f2(y) + "' width='" + f2(w) + "' height='" + f2(h) + "'/>", t + rett(x, y, w, h, luce(.7)));
      s += rett(x, y, w, h, "none", "stroke='" + scuro(c, .4) + "' stroke-width='.6' opacity='.6'") + rett(x + .8, y + .8, w - 1.6, .7, "#fff", op(.5));
    });
    return s;
  }
  function cemento(seme) {   // cemento lucido: nuvole morbide, granelli, la lucidatura
    var c = "#aeafab", s = rett(0, 0, 100, 100, c) + macchieMorbide(22, 100, 100, seme, "#d0d1cd", "#8c8d89", 10, 28, .24, true) + granelli(280, 100, 100, seme + 1, "#6c6d69", .8, .25, true) + granelli(200, 100, 100, seme + 2, "#e6e7e3", .8, .35, true);
    s += macchieMorbide(4, 100, 100, seme + 3, "#ffffff", "#ffffff", 16, 30, .2, true);
    var r = rnd(seme + 4), i;
    for (i = 0; i < 6; i++) (function (x, y, l, cv, o) {   // i segni della spatola
      s += giro(x, y, l / 2 + 1, 100, 100, function (a, b) { return tratto("M" + q(a - l / 2, b) + " Q" + q(a, b + cv) + " " + q(a + l / 2, b), "#f4f4f2", 2.2, op(o)); });
    })(r() * 100, r() * 100, 16 + r() * 18, (r() - .5) * 12, .12 + r() * .1);
    return s;
  }
  function lastre(seme) {   // lastre di pietra irregolari (opus incertum), col muschio nelle fughe
    var n = 4, l = 25, r = rnd(seme), J = [], M = [], i, j, s = rett(0, 0, 100, 100, "#7d7465") + granelli(220, 100, 100, seme + 1, "#5a5246", 1.1, .5, true);
    var cols = ["#b9b1a3", "#a9a091", "#c5bcae", "#9e9687", "#b3aa98", "#cbc2b2", "#aea595"];
    for (j = 0; j < n; j++) { J.push([]); M.push([]); for (i = 0; i < n; i++) { J[j].push([(r() - .5) * 15, (r() - .5) * 15]); M[j].push([(r() - .5) * 11, (r() - .5) * 11]); } }
    function md(v) { return ((v % n) + n) % n; }
    function V(i, j) { var a = J[md(j)][md(i)]; return [i * l + a[0], j * l + a[1]]; }
    function Mh(i, j) { var a = V(i, j), b = V(i + 1, j), m = M[md(j)][md(i)]; return [(a[0] + b[0]) / 2 + m[0] * .3, (a[1] + b[1]) / 2 + m[1]]; }
    function Mv(i, j) { var a = V(i, j), b = V(i, j + 1), m = M[md(j)][md(i)]; return [(a[0] + b[0]) / 2 + m[0], (a[1] + b[1]) / 2 + m[1] * .3]; }
    var muschio = [];
    for (j = 0; j < n; j++) for (i = 0; i < n; i++) if (r() < .5) { var v = V(i, j), k; for (k = 0; k < 7; k++) { var px = v[0] + (r() - .5) * 7, py = v[1] + (r() - .5) * 7; [[0, 0], [100, 0], [-100, 0], [0, 100], [0, -100]].forEach(function (o) { muschio.push([px + o[0], py + o[1]]); }); } }
    s += puntini(muschio, "#6f8c3e", 2.2, .85) + puntini(muschio.filter(function (v, x) { return x % 3 === 0; }), "#9cb85a", 1.4, .9);
    // le lastre: alcune caselle unite a due a due (in largo o in alto), così le misure cambiano
    var LASTRE = [[0, 0, "o"], [2, 0, ""], [3, 0, "v"], [0, 1, "v"], [1, 1, ""], [2, 1, "v"], [1, 2, ""], [3, 2, ""], [0, 3, "o"], [2, 3, "o"]];
    LASTRE.forEach(function (la, nn) {
      var i = la[0], j = la[1], pts;
      if (la[2] === "o") pts = [V(i, j), Mh(i, j), V(i + 1, j), Mh(i + 1, j), V(i + 2, j), Mv(i + 2, j), V(i + 2, j + 1), Mh(i + 1, j + 1), V(i + 1, j + 1), Mh(i, j + 1), V(i, j + 1), Mv(i, j)];
      else if (la[2] === "v") pts = [V(i, j), Mh(i, j), V(i + 1, j), Mv(i + 1, j), V(i + 1, j + 1), Mv(i + 1, j + 1), V(i + 1, j + 2), Mh(i, j + 2), V(i, j + 2), Mv(i, j + 1), V(i, j + 1), Mv(i, j)];
      else pts = [V(i, j), Mh(i, j), V(i + 1, j), Mv(i + 1, j), V(i + 1, j + 1), Mh(i, j + 1), V(i, j + 1), Mv(i, j)];
      var cx = 0, cy = 0, x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      pts.forEach(function (p) { cx += p[0] / pts.length; cy += p[1] / pts.length; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); y0 = Math.min(y0, p[1]); y1 = Math.max(y1, p[1]); });
      pts = pts.map(function (p) { var dx = cx - p[0], dy = cy - p[1], d = Math.hypot(dx, dy) || 1; return [p[0] + dx / d * 1.8, p[1] + dy / d * 1.8]; });
      var t = sasso(pts, cols[nn % cols.length], seme * 37 + nn + 1, 5.5);
      [-100, 0, 100].forEach(function (dx) { [-100, 0, 100].forEach(function (dy) { if (x1 + dx > 0 && x0 + dx < 100 && y1 + dy > 0 && y0 + dy < 100) s += dx || dy ? sposta(dx, dy, t) : t; }); });
    });
    return s;
  }
  function terrazza(seme) {   // legno da terrazza: assi con le fessure, le righe antiscivolo e le viti
    var n = 6, h = 100 / n, cols = ["#b98154", "#ad7549", "#c48b5c", "#a66f45", "#b47c50"], s = rett(0, 0, 100, 100, "#3b2a1e"), j, r = rnd(seme), g = lin("tz", [[0, "#fff", .2], [.5, "#fff", 0], [1, "#000", .2]], 0, 0, 0, 1);
    for (j = 0; j < n; j++) (function (y, a, c, vs) {
      var asse = function (x, yy) {
        var t = rett(x + .5, yy + .9, 99, h - 1.8, c, "rx='.8'") + venature(x + 1, yy + 1.5, 98, h - 3, c, vs, 4, false, 1.2), k;
        for (k = 1; k < 4; k++) t += rett(x + 1, yy + .9 + (h - 1.8) * k / 4, 98, .5, scuro(c, .3), op(.3)) + rett(x + 1, yy + 1.4 + (h - 1.8) * k / 4, 98, .4, chiaro(c, .3), op(.4));
        return t + rett(x + .5, yy + .9, 99, h - 1.8, g, "rx='.8'");
      };
      [a, a - 100].forEach(function (xx) { s += asse(xx, y); if (y + h > 100) s += asse(xx, y - 100); });
      [25, 75].forEach(function (vx) { [y + h * .3, y + h * .7].forEach(function (vy) { var yv = vy > 100 ? vy - 100 : vy; s += cer(vx, yv, .65, scuro(c, .4), op(.75)) + cer(vx - .2, yv - .2, .22, "#e8ddd0", op(.7)); }); });
    })(h / 2 + j * h, r() * 100, scegli(r, cols), r() * 1e5 | 0);
    return s;
  }
  function ghiaia(seme) {   // ghiaia fine: sassolini chiari con l'ombra e il riflesso
    var cols = ["#d8d0c0", "#c9bfae", "#e6dfd2", "#b7ab97", "#cfc5b3", "#a99c88", "#ddd3c4", "#c2b5a0", "#9f9484", "#d3c3a8"], s = rett(0, 0, 100, 100, "#74695a") + granelli(320, 100, 100, seme + 1, "#4a4136", 1.3, .5, true);
    var r = rnd(seme), i, hl = [], g = rad("gh", [[0, "#fff", .55], [.45, "#fff", 0], [.75, "#000", .05], [1, "#000", .35]], .3, .28, .85);
    for (i = 0; i < 289 + 90; i++) (function (x, y, rx, k, a, c) {   // i sassolini grossi su una griglia mossa (coprono bene), poi quelli piccoli sparsi
      var ry = rx * k;
      s += giro(x, y, rx + .8, 100, 100, function (X, Y) {
        hl.push([X - ry * .35, Y - ry * .4]);
        return "<g transform='translate(" + q(X, Y) + ")'>" + ell(.6, .8, rx, ry, "#2e271f", op(.45) + " transform='rotate(" + f2(a) + ")'") + ell(0, 0, rx, ry, c, "transform='rotate(" + f2(a) + ")'") + cer(0, 0, ry, g) + "</g>";
      });
    })(i < 289 ? (i % 17 + .1 + r() * .8) * 100 / 17 : r() * 100, i < 289 ? (Math.floor(i / 17) + .1 + r() * .8) * 100 / 17 : r() * 100, i < 289 ? 2.3 + r() * 1.3 : 1.2 + r() * 1, .7 + r() * .25, r() * 180, scegli(r, cols));
    return s + puntini(hl, "#fff", .9, .6);
  }

  var PAVIMENTI = [];
  function pav(id, nome, dove, fa) { PAVIMENTI.push({ id: id, nome: nome, dove: dove, svg: function () { return svg("v_" + id, 100, 100, fa); } }); }
  pav("parquet_chiaro", "Parquet chiaro", "dentro", function () { return parquet(["#e2c193", "#dab786", "#e8caa0", "#d4ae7c", "#dfbd8c", "#e6c697"], 301, 5); });
  pav("parquet_scuro", "Parquet scuro", "dentro", function () { return parquet(["#7a4a2c", "#6e4127", "#845233", "#663b23", "#744629", "#5e3720"], 303, 5); });
  pav("spina_pesce", "Parquet a spina di pesce", "dentro", function () { return spinaPesce(["#c99a63", "#bf8f58", "#d2a56f", "#b5854f", "#c69660", "#ad7c48"], 305); });
  pav("piastrelle_bianche", "Piastrelle bianche", "dentro", function () {
    return piastrelle(4, 1.3, "#cbc4b8", 307, function (x, y, l, r) { return rett(x, y, l, l, scegli(r, ["#f6f4ef", "#f1efe9", "#f8f7f3", "#eeebe4"]), "rx='.8'") + lucido(x, y, l) + rett(x, y, l, l, "none", "rx='.8' stroke='#b9b2a6' stroke-width='.4'"); });
  });
  pav("scacchi", "Scacchi bianchi e neri", "dentro", function () {
    return piastrelle(4, .8, "#8e8a82", 309, function (x, y, l, r, i, j) {
      var nero = (i + j) % 2, c = nero ? scegli(r, ["#2b2b30", "#303036", "#26262b"]) : scegli(r, ["#f3efe6", "#efebe1", "#f6f3ec"]);
      return rett(x, y, l, l, c) + venaMarmo(x, y, l, r, nero ? "#6d6d78" : "#b9b4aa", .4) + lucido(x, y, l, nero ? .7 : 1);
    });
  });
  pav("cotto", "Cotto", "tutti", function () {
    return piastrelle(4, 1.6, "#d6c6aa", 311, function (x, y, l, r) {
      var c = scegli(r, ["#c4683f", "#b85d36", "#cf7448", "#ad5732", "#c96c41", "#d07b4f"]), t = rett(x, y, l, l, c, "rx='1.2'"), k;
      for (k = 0; k < 5; k++) { var rr = 3 + r() * 5; t += ell(x + rr + r() * (l - 2 * rr), y + rr + r() * (l - 2 * rr), rr, rr * (.6 + r() * .4), r() < .5 ? scuro(c, .15) : chiaro(c, .15), op(.25)); }
      for (k = 0; k < 6; k++) t += cer(x + 2 + r() * (l - 4), y + 2 + r() * (l - 4), .4 + r() * .4, scuro(c, .4), op(.6));
      return t + rett(x, y, l, l, luce(.8), "rx='1.2'") + rett(x + .6, y + .6, l - 1.2, l - 1.2, "none", "rx='1' stroke='" + scuro(c, .3) + "' stroke-width='1.1' opacity='.35'");
    });
  });
  pav("marmo", "Marmo", "dentro", function () {
    var s = piastrelle(2, .7, "#cfc9c0", 313, function (x, y, l, r, i, j) {
      var c = scegli(r, ["#f1eee9", "#eeebe5", "#f3f1ec"]), t = rett(x, y, l, l, c) + macchieMorbide(4, l, l, 315 + i + j * 2, "#ffffff", "#d9d4cc", 8, 18, .6, false).replace(/<ellipse/g, "<ellipse transform='translate(" + q(x, y) + ")'"), k, v = "";
      for (k = 0; k < 3; k++) v += venaMarmo(x, y, l, r, k < 1 ? "#8a847e" : "#aca59d", k < 1 ? .6 : .45);
      t += (i + j) % 2 ? "<g transform='rotate(90 " + q(x + l / 2, y + l / 2).replace(",", " ") + ")'>" + v + "</g>" : v;   // le lastre posate a vena alternata
      return dentro("ma" + i + j, "<rect x='" + f2(x) + "' y='" + f2(y) + "' width='" + f2(l) + "' height='" + f2(l) + "'/>", t) + lucido(x, y, l, .8);
    });
    return s;
  });
  [["beige", "Moquette beige", "#cdb894"], ["grigia", "Moquette grigia", "#8e9299"], ["blu", "Moquette blu", "#4d6a92"], ["bordeaux", "Moquette bordeaux", "#8e3a3d"]].forEach(function (v, i) {
    pav("moquette_" + v[0], v[1], "dentro", function () { return moquette(v[2], 321 + i * 9); });
  });
  pav("pietra", "Pietra", "tutti", function () { return opusRomano(341); });
  pav("cemento", "Cemento lucido", "tutti", function () { return cemento(343); });
  pav("bagno_azzurro", "Piastrelle azzurre", "dentro", function () {
    return piastrelle(5, 1.4, "#eef4f5", 345, function (x, y, l, r) { var c = scegli(r, ["#8fcbdc", "#9fd3e2", "#86c3d6", "#a8d8e5", "#94cfdf"]); return rett(x, y, l, l, c, "rx='.9'") + lucido(x, y, l) + rett(x, y, l, l, "none", "rx='.9' stroke='" + scuro(c, .25) + "' stroke-width='.45'"); });
  });
  pav("lastre", "Lastre di pietra", "fuori", function () { return lastre(351); });
  pav("terrazza", "Legno da terrazza", "fuori", function () { return terrazza(353); });
  pav("ghiaia", "Ghiaia fine", "fuori", function () { return ghiaia(355); });

  // =========================================================
  //  I TETTI (100 × 100: file di tegole orizzontali, la falda scende verso il basso)
  // =========================================================
  function fileTegole(n, fa) {   // dal basso in alto (la fila sopra copre quella sotto); la prima ripetuta sotto il bordo e l'ultima sopra
    var h = 100 / n, s = fa(0, 100, h), k;
    for (k = n - 1; k >= 0; k--) s += fa(k, k * h, h);
    return s + fa(n - 1, -h, h);
  }
  function ombraFila(x, y, w) { return rett(x, y - 1.2, w, 5.4, lin("om", [[0, "#000", .5], [1, "#000", 0]], 0, 0, 0, 1)); }
  function marsigliesi(cols, seme) {
    var gT = lin("tg", [[0, "#000", .1], [.55, "#fff", .06], [.86, "#fff", .14], [.93, "#fff", .3], [1, "#000", .1]], 0, 0, 0, 1), gR = lin("tc", [[0, "#fff", .3], [.45, "#fff", .05], [.6, "#000", .04], [1, "#000", .26]], 0, 0, 1, 0);
    return rett(0, 0, 100, 100, scuro(cols[0], .55)) + fileTegole(5, function (k, y, h) {
      var t = "", i;
      for (i = 0; i < 4; i++) (function (x, r) {
        var c = scegli(r, cols), b = y + h - 1.2;
        t += ombraFila(x, b + 1, 25) + rett(x + .5, y - 8, 24, h + 6.8, c, "rx='1.6'") + rett(x + .5, y - 8, 24, h + 6.8, gT, "rx='1.6'");
        [6.4, 15.6].forEach(function (dx) { t += rett(x + dx, y - 8, 4.2, h + 7.6, c, "rx='2.1'") + rett(x + dx, y - 8, 4.2, h + 7.6, gR, "rx='2.1'") + tratto("M" + q(x + dx + .2, b - 1) + " Q" + q(x + dx + 2.1, b + 1.6) + " " + q(x + dx + 4, b - 1), L, .7, op(.55)); });
        t += tratto("M" + q(x + .6, b) + " L" + q(x + 6.4, b) + " M" + q(x + 10.6, b) + " L" + q(x + 15.6, b) + " M" + q(x + 19.8, b) + " L" + q(x + 24.4, b), L, .9, op(.6)) + rett(x + .5, y - 8, .7, h + 6.8, L, op(.4));
        if (r() < .5) t += ell(x + 3 + r() * 19, y + 3 + r() * (h - 8), 2 + r() * 2.5, 1.2 + r(), scuro(c, .25), op(.35));
      })(i * 25, rnd(seme * 41 + k * 7 + i + 1));
      return t;
    });
  }
  function coppi(cols, seme) {
    var gC = lin("cc", [[0, "#000", .5], [.45, "#000", .25], [.85, "#fff", .04], [1, "#fff", .15]], 0, 0, 1, 0), gV = lin("cv", [[0, "#fff", .42], [.3, "#fff", .1], [.7, "#000", .14], [1, "#000", .45]], 0, 0, 1, 0);
    return rett(0, 0, 100, 100, "#4e2617") + fileTegole(4, function (k, y, h) {
      var t = "", i;
      for (i = 0; i < 5; i++) (function (r, cx0) {   // i canali, sotto
        var c = scegli(r, cols);
        t += giro(cx0, 0, 9, 100, 0, function (cx) {
          var d = "M" + q(cx - 8, y - 8) + " L" + q(cx + 8, y - 8) + " L" + q(cx + 8, y + h - 2) + " Q" + q(cx, y + h + 1.5) + " " + q(cx - 8, y + h - 2) + " Z";
          return ombraFila(cx - 8, y + h, 16) + pth(d, c) + pth(d, gC) + tratto("M" + q(cx - 8, y + h - 2) + " Q" + q(cx, y + h + 1.5) + " " + q(cx + 8, y + h - 2), L, .8, op(.6));
        });
      })(rnd(seme * 43 + k * 11 + i + 1), i * 20);
      for (i = 0; i < 5; i++) (function (r, cx) {   // i coppi, sopra
        var c = scegli(r, cols), b = y + h - 3, d = "M" + q(cx - 6, y - 8) + " L" + q(cx + 6, y - 8) + " L" + q(cx + 7.4, b) + " Q" + q(cx + 7.4, b + 4.5) + " " + q(cx, b + 4.5) + " Q" + q(cx - 7.4, b + 4.5) + " " + q(cx - 7.4, b) + " Z";
        t += sposta(1.8, 1.8, pth(d, "#000", op(.3))) + pth(d, c) + pth(d, gV);
        if (r() < .6) t += ell(cx + (r() - .5) * 6, y + 2 + r() * (h - 6), 2 + r() * 2, 3 + r() * 3, r() < .5 ? scuro(c, .25) : chiaro(c, .25), op(.4));
        if (r() < .3) t += puntini([[cx - 2 + r() * 4, b - 2], [cx - 1 + r() * 3, b - 4], [cx + r() * 3, b - 1]], "#cfc79a", 1.6, .7);
        t += pth(d, "none", bordo(L, .9) + " opacity='.7'") + tratto("M" + q(cx - 4.6, b + 1) + " Q" + q(cx - 3, b + 3.4) + " " + q(cx, b + 3.6), "#fff", .8, op(.35));
      })(rnd(seme * 47 + k * 13 + i + 1), 10 + i * 20);
      return t;
    });
  }
  function ardesia(cols, seme) {
    var gS = lin("as", [[0, "#fff", .14], [.6, "#fff", 0], [1, "#000", .2]], 0, 0, .3, 1);
    return rett(0, 0, 100, 100, "#20262c") + fileTegole(6, function (k, y, h) {
      var t = "", i, off = k % 2 ? 10 : 0;
      for (i = 0; i < 5; i++) (function (r, x) {
        var c = scegli(r, cols), sc = [r(), r(), r(), r(), r()];
        t += giro(x + 10, 0, 10.5, 100, 0, function (cx) {
          var x0 = cx - 10, b = y + h - 1, d = "M" + q(x0 + .5, y - 7) + " L" + q(x0 + 19.5, y - 7) + " L" + q(x0 + 19.5, b - 1.6) + " L" + q(x0 + 18, b) + " L" + q(x0 + 2, b) + " L" + q(x0 + .5, b - 1.6) + " Z";
          return ombraFila(x0, b + 1, 20) + pth(d, c) + pth(d, gS) +
            tratto("M" + q(x0 + 2 + sc[0] * 14, y + sc[1] * (h - 5)) + " l" + q(3 + sc[2] * 4, 1 + sc[3] * 2), chiaro(c, .3), .5, op(.4)) +
            tratto("M" + q(x0 + 2, b - 1.4) + " L" + q(x0 + 18, b - 1.4), chiaro(c, .3), .7, op(.5)) + pth(d, "none", "stroke='#14181d' stroke-width='.8' opacity='.8'");
        });
      })(rnd(seme * 53 + k * 7 + i + 1), off + i * 20);
      return t;
    });
  }
  function squame(cols, seme) {   // tegole smaltate a squama, lucide
    var gS = rad("sq", [[0, "#fff", .14], [.55, "#000", 0], [1, "#000", .38]], .4, .3, .85);
    return rett(0, 0, 100, 100, "#101a2a") + fileTegole(6, function (k, y, h) {
      var t = "", i, off = k % 2 ? 10 : 0;
      for (i = 0; i < 5; i++) (function (r, x) {
        var c = scegli(r, cols);
        t += giro(x + 10, 0, 10.5, 100, 0, function (cx) {
          var x0 = cx - 10, d = "M" + q(x0 + .4, y - 7) + " L" + q(x0 + 19.6, y - 7) + " L" + q(x0 + 19.6, y + h - 8.5) + " A9.6,8 0 0 1 " + q(x0 + .4, y + h - 8.5) + " Z";
          return sposta(0, 2, pth(d, "#000", op(.35))) + pth(d, c) + pth(d, gS) + ell(x0 + 7, y + h - 9.5, 4, 2.4, "#fff", op(.22)) + ell(x0 + 6.2, y + h - 10.6, 1.6, .9, "#fff", op(.65)) +
            pth(d, "none", "stroke='#0d1626' stroke-width='.9' stroke-linejoin='round'");
        });
      })(rnd(seme * 57 + k * 7 + i + 1), off + i * 20);
      return t;
    });
  }
  function scandole(cols, seme) {   // scandole di legno di larghezze diverse
    var g = lin("sc", [[0, "#fff", .12], [.6, "#fff", 0], [1, "#000", .22]], 0, 0, .2, 1);
    return rett(0, 0, 100, 100, "#2e1f14") + fileTegole(6, function (k, y, h) {
      var r = rnd(seme * 59 + k + 1), x = r() * 100, fine = x + 100, t = "";
      while (x < fine - .1) {
        var w = 7 + r() * 10; if (fine - x - w < 6) w = fine - x;
        var c = scegli(r, cols), dy = r() * 1.4, vs = r() * 1e5 | 0, crepa = r() < .2 ? r() : -1, b = y + h - .6 - dy;
        var pz = ombraFila(x, b + 1, w) + rett(x + .4, y - 7, w - .8, b - y + 7, c, "rx='.6'") + venature(x + .4, y - 6, w - .8, b - y + 6, c, vs, 3, true, 1.4) + rett(x + .4, y - 7, w - .8, b - y + 7, g, "rx='.6'") +
          tratto("M" + q(x + .6, b) + " L" + q(x + w - .6, b), L, .9, op(.65)) + rett(x + .8, b - 1.6, w - 1.6, .6, "#fff", op(.25));
        if (crepa >= 0) pz += tratto("M" + q(x + 1 + crepa * (w - 2), b) + " l.4,-6", "#2e1f14", .7, op(.8));
        if (x < 100) t += pz; if (x + w > 100) t += sposta(-100, 0, pz);
        x += w;
      }
      return t;
    });
  }
  function muschio(cols, seme) {   // tegole piane "a coda di castoro" color muschio, con un po' di muschio vero
    var g = luce(.9), w = 100 / 6;
    return rett(0, 0, 100, 100, "#1f2a15") + fileTegole(6, function (k, y, h) {
      var t = "", i, off = k % 2 ? w / 2 : 0;
      for (i = 0; i < 6; i++) (function (r, x) {
        var c = scegli(r, cols), m = [], j, n = r() < .5 ? 6 + (r() * 6 | 0) : 0, lato = r();
        for (j = 0; j < n; j++) m.push([2 + lato * (w - 6) + r() * 4, h - 3 - r() * 4]);
        var lich = r() < .4 ? [3 + r() * (w - 6), r() * (h - 8)] : null;
        t += giro(x + w / 2, 0, w / 2 + .5, 100, 0, function (cx) {
          var x0 = cx - w / 2, b = y + h - 1, d = "M" + q(x0 + .4, y - 7) + " L" + q(x0 + w - .4, y - 7) + " L" + q(x0 + w - .4, b - 4) + " Q" + q(x0 + w - .4, b) + " " + q(x0 + w - 4.4, b) + " L" + q(x0 + 4.4, b) + " Q" + q(x0 + .4, b) + " " + q(x0 + .4, b - 4) + " Z";
          var s2 = ombraFila(x0 + 1, b + 1, w - 2) + pth(d, c) + pth(d, g) + pth(d, "none", "stroke='#2b3a1c' stroke-width='.8' stroke-linejoin='round'") + rett(x0 + 2, y - 5, w - 4, .8, "#fff", op(.15));
          if (lich) s2 += ell(x0 + lich[0], y + lich[1], 1.6, 1.1, "#dfe3b6", op(.55));
          var mm = m.map(function (p) { return [x0 + p[0], y + p[1]]; });
          return s2 + puntini(mm, "#7f9c45", 2.4, .9) + puntini(mm.filter(function (v, z) { return z % 2; }), "#b3cc6e", 1.5, .95);
        });
      })(rnd(seme * 61 + k * 7 + i + 1), off + i * w);
      return t;
    });
  }

  var TETTI = [];
  function tetto(id, nome, c, fa) { TETTI.push({ id: id, nome: nome, c: c, svg: function () { return svg("t_" + id, 100, 100, fa); } }); }
  tetto("tegole_rosse", "Tegole rosse", "#c4553a", function () { return marsigliesi(["#c95a3d", "#be4f35", "#d06444", "#b7492f", "#c4553a"], 401); });
  tetto("coppi", "Coppi di cotto", "#c46a40", function () { return coppi(["#c96f44", "#bb5f38", "#d27c4e", "#b15633", "#c66a3f", "#a84f30", "#d58a5a"], 403); });
  tetto("ardesia", "Ardesia grigia", "#56616c", function () { return ardesia(["#5d6872", "#525d68", "#66717b", "#4b5560", "#6b7680", "#58636d"], 405); });
  tetto("tegole_blu", "Tegole blu scure", "#2e4a6c", function () { return squame(["#2c4a6e", "#27405f", "#33557a", "#223a58", "#2f4f75"], 407); });
  tetto("scandole", "Scandole di legno", "#9a6a40", function () { return scandole(["#a87448", "#9a6a40", "#b07c4e", "#8e603a", "#a3714a", "#86684c"], 409); });
  tetto("muschio", "Verde muschio", "#6a8a48", function () { return muschio(["#6f8d4c", "#5f7d42", "#7b9a55", "#56733b", "#86a35e"], 411); });

  // =========================================================
  //  PORTE E FINESTRE (62 × 200, trasparenti attorno)
  // =========================================================
  function ottone() { return rad("ot", [[0, "#fff6cf"], [.35, "#f0c75a"], [1, "#9c7114"]], .35, .3, .75); }
  function ferro() { return rad("fe", [[0, "#8a8580"], [.4, "#4a4542"], [1, "#1f1b19"]], .35, .3, .75); }
  function pomolo(x, y) { return cer(x + .7, y + .9, 2.9, "#000", op(.22)) + cer(x, y, 2.9, ottone(), bordo("#6b4a00", .9)) + cer(x - .9, y - .9, .9, "#fff", op(.8)); }
  function maniglia(x, y, verso, col) {   // la maniglia a leva (verso -1 = punta a sinistra)
    var g = col || ottone(), lc = col ? "#1e1a18" : "#6b4a00", e = x + verso * 8;
    return rett(x - 1.9, y - 5.5, 3.8, 11, g, bordo(lc, .8) + " rx='1.4'") + sposta(.6, .9, tratto("M" + q(x, y - 1.6) + " L" + q(e, y - 1.6), "#000", 2.6, op(.22))) +
      tratto("M" + q(x, y - 1.8) + " L" + q(e, y - 1.8), lc, 3.2) + tratto("M" + q(x, y - 1.8) + " L" + q(e, y - 1.8), col ? "#5a5552" : "#e8c050", 2) + tratto("M" + q(x + verso * 1.5, y - 2.4) + " L" + q(e - verso, y - 2.4), "#fff", .6, op(.7)) +
      cer(x, y + 3, .7, lc);
  }
  function cardine(x, y) { return rett(x - 1.3, y - 4, 2.6, 8, "#3b3330", bordo("#1e1a18", .6) + " rx='.6'") + rett(x - .6, y - 3.4, .8, 6.8, "#8a817b", op(.6)); }
  function soglia(x0, x1) { return rett(x0, 196, x1 - x0, 4, lin("sg", [[0, "#efe8da"], [1, "#b3a792"]], 0, 0, 0, 1), bordo(L, 1.2)) + rett(x0 + 1, 196.8, x1 - x0 - 2, .7, "#fff", op(.6)); }
  function cornice(x0, x1, yt, col, sp) {   // la cornice intorno al vano: copre il bordo del buco nel muro
    sp = sp || 4;
    var g = lin("cr" + col.slice(1), [[0, chiaro(col, .32)], [.5, col], [1, scuro(col, .2)]], 0, 0, 1, 1);
    return rett(x0 - sp + 1.4, yt - sp + 1.6, x1 - x0 + 2 * sp, 200 - yt + sp, "#000", op(.16)) +   // l'ombra morbida sul muro
      rett(x0 - sp, yt - sp, x1 - x0 + 2 * sp, 200 - yt + sp + 2, g, bordo(L, 2)) + rett(x0 - sp + 1, yt - sp + 1, x1 - x0 + 2 * sp - 2, .8, "#fff", op(.5)) +
      rett(x0 - .8, yt - .8, x1 - x0 + 1.6, 200 - yt + .8, scuro(col, .45));
  }
  function tende(x, y, w, h, col, o) {   // due tende raccolte ai lati, con le pieghe
    var tw = Math.min(w * .3, 12), s = "";
    [0, 1].forEach(function (lato) {
      var sx = lato ? -1 : 1, x0 = lato ? x + w : x;
      var d = "M" + q(x0, y) + " L" + q(x0 + sx * tw, y) + " C" + q(x0 + sx * tw * .7, y + h * .3) + " " + q(x0 + sx * tw * .25, y + h * .42) + " " + q(x0 + sx * tw * .3, y + h * .56) + " C" + q(x0 + sx * tw * .5, y + h * .76) + " " + q(x0 + sx * tw * .72, y + h * .9) + " " + q(x0 + sx * tw * .66, y + h) + " L" + q(x0, y + h) + " Z";
      s += pth(d, col, op(o)) + tratto("M" + q(x0 + sx * tw * .55, y + 1) + " Q" + q(x0 + sx * tw * .3, y + h * .3) + " " + q(x0 + sx * tw * .18, y + h * .55), scuro(col, .3), .7, op(o * .6)) +
        tratto("M" + q(x0 + sx * tw * .2, y + h * .6) + " Q" + q(x0 + sx * tw * .35, y + h * .8) + " " + q(x0 + sx * tw * .4, y + h - .5), scuro(col, .3), .7, op(o * .5)) + ell(x0 + sx * tw * .28, y + h * .56, 1.4, 1, scuro(col, .3), op(o));
    });
    return s;
  }
  function vetro(nome, forma, b, notte, tenda) {   // il vetro: azzurro coi riflessi di giorno, caldo e acceso di notte; b = [x, y, w, h]
    var x = b[0], y = b[1], w = b[2], h = b[3], c;
    if (notte) c = rett(x, y, w, h, lin("vn", [[0, "#fffdf3"], [.45, "#fff0b2"], [1, "#ffc95e"]], 0, 0, .35, 1)) + ell(x + w * .5, y + h * .42, w * .55, h * .45, rad("vl", [[0, "#fff", .75], [1, "#fff", 0]], .5, .5, .5));
    else c = rett(x, y, w, h, lin("vg", [[0, "#eef8ff"], [.5, "#b4d5ef"], [1, "#82acd4"]], 0, 0, .35, 1)) + rett(x, y + h * .62, w, h * .38, "#5f86ad", op(.18));
    if (tenda !== false) c += tende(x, y, w, h, notte ? "#f2a344" : (tenda || "#e9927c"), notte ? .55 : .85);
    if (!notte) c += pth("M" + q(x + w * .5, y) + " L" + q(x + w * .72, y) + " L" + q(x + w * .32, y + h) + " L" + q(x + w * .1, y + h) + " Z", "#fff", op(.3)) + pth("M" + q(x + w * .8, y) + " L" + q(x + w * .86, y) + " L" + q(x + w * .46, y + h) + " L" + q(x + w * .4, y + h) + " Z", "#fff", op(.25));
    return dentro(nome, forma, c);
  }
  function rq(x, y, w, h) { return "<rect x='" + f2(x) + "' y='" + f2(y) + "' width='" + f2(w) + "' height='" + f2(h) + "'/>"; }
  function bordoVetro(x, y, w, h) { return rett(x, y, w, 1.8, "#000", op(.2)) + rett(x, y, 1.4, h, "#000", op(.12)) + rett(x, y, w, h, "none", "stroke='" + L + "' stroke-width='.9' opacity='.8'"); }
  function listello(x, y, w, h, c) { return rett(x, y, w, h, c, bordo(L, .7)) + rett(x + .3, y + .3, w > h ? w - .6 : .6, w > h ? .6 : h - .6, "#fff", op(.55)); }   // un listello del telaio
  function alone(cx, cy, rx, ry, notte) { return notte ? ell(cx, cy, rx, ry, rad("al", [[0, "#ffe9a8", .6], [.5, "#ffd47a", .26], [1, "#ffd47a", 0]], .5, .5, .5)) : ""; }
  function davanzale(x0, x1, y, col) {   // il davanzale di pietra con l'ombra sul muro
    col = col || "#efe7d8";
    return rett(x0 + 1, y + 5, x1 - x0 - 2, 3.4, lin("dvo", [[0, "#000", .26], [1, "#000", 0]], 0, 0, 0, 1)) +
      rett(x0, y, x1 - x0, 5.4, lin("dv" + col.slice(1), [[0, chiaro(col, .55)], [.4, col], [1, scuro(col, .2)]], 0, 0, 0, 1), bordo(L, 1.4) + " rx='.8'") + rett(x0 + 1, y + 1, x1 - x0 - 2, .8, "#fff", op(.7));
  }
  function telaioBianco() { return lin("tb", [[0, "#ffffff"], [.6, "#f1ece2"], [1, "#d6ccbb"]], 0, 0, 1, 1); }
  function ombraR(x, y, w, h, rx) { return rett(x + 1.4, y + 1.6, w, h, "#000", op(.16) + (rx ? " rx='" + rx + "'" : "")); }

  var PORTE = [];
  function porta(id, nome, fa) { PORTE.push({ id: id, nome: nome, svg: function (opz) { var notte = !!(opz && opz.notte); return svg("p_" + id + (notte ? "_n" : ""), MW, MH, function () { return fa(notte); }); } }); }
  porta("legno", "Legno semplice", function () {
    var c = "#b67c47", s = cornice(10, 52, 50, "#8a5a33"), k;
    s += rett(10, 50, 42, 146, lin("pl", [[0, chiaro(c, .16)], [.5, c], [1, scuro(c, .2)]], 0, 0, 1, 1));
    s += dentro("pf", rq(10, 50, 42, 146), venature(10, 50, 42, 146, c, 11, 14, true, 1.2));
    for (k = 1; k < 3; k++) s += rett(10 + k * 14 - .5, 50, 1, 146, scuro(c, .4), op(.55)) + rett(10 + k * 14 + .5, 50, .6, 146, "#fff", op(.25));   // le tre tavole
    s += rett(10, 50, 42, 146, "none", bordo(L, 1.6)) + rett(11, 51, 40, .8, "#fff", op(.4));
    return s + cardine(11.6, 66) + cardine(11.6, 178) + maniglia(46, 128, -1) + soglia(5, 57);
  });
  porta("pannelli", "Legno a pannelli", function () {
    var c = "#9a6338", s = cornice(10, 52, 50, "#7a4c2b");
    s += rett(10, 50, 42, 146, lin("pp", [[0, chiaro(c, .14)], [1, scuro(c, .14)]], 0, 0, 1, 1)) + dentro("pf", rq(10, 50, 42, 146), venature(10, 50, 42, 146, c, 13, 10, true));
    [[55, 22], [82, 48], [140, 51]].forEach(function (v) { s += riquadro(14, v[0], 15.5, v[1], chiaro(c, .05)) + riquadro(32.5, v[0], 15.5, v[1], chiaro(c, .05)); });
    s += rett(10, 50, 42, 146, "none", bordo(L, 1.6));
    return s + cardine(11.6, 66) + cardine(11.6, 178) + pomolo(47, 135) + soglia(5, 57);
  });
  porta("elegante", "Ingresso elegante", function (notte) {
    var c = "#2f5f4b", s = cornice(9, 53, 50, "#efe6d4", 4.5);
    s += rett(1, 37.4, 60, 4, "#000", op(.15)) + rett(1.5, 38, 59, 8, lin("cp", [[0, "#fbf6ec"], [1, "#d8cbb2"]], 0, 0, 0, 1), bordo(L, 1.6)) + rett(4, 34, 54, 4.6, "#efe6d4", bordo(L, 1.4)) + rett(5, 34.8, 52, .8, "#fff", op(.7));   // il cornicione sopra
    s += rett(9, 50, 44, 146, lin("pe", [[0, chiaro(c, .22)], [.5, c], [1, scuro(c, .3)]], 0, 0, 1, 1));
    s += ell(31, 86, 12.4, 19.6, ottone(), bordo("#6b4a00", .9)) + vetro("vo", "<ellipse cx='31' cy='86' rx='10' ry='17'/>", [21, 69, 20, 34], notte, false) + ell(31, 86, 10, 17, "none", bordo(L, .9));
    s += tratto("M31,69 L31,103 M21,86 L41,86", "#c9a560", 1.2, op(.9));   // la grata sottile del vetrino
    s += riquadro(13.5, 120, 16, 66, c, 2.6) + riquadro(32.5, 120, 16, 66, c, 2.6);
    s += cer(31, 111.5, 3.2, "none", "stroke='#6b4a00' stroke-width='2.6'") + cer(31, 111.5, 3.2, "none", "stroke='#f0c75a' stroke-width='1.4'") + cer(31, 107.6, 1.4, ottone(), bordo("#6b4a00", .6));   // il batacchio
    s += rett(9, 188, 44, 8, lin("lo", [[0, "#fff1b8"], [.4, "#e7bd4f"], [1, "#9c7114"]], 0, 0, 0, 1), bordo("#6b4a00", .8));   // la lamina d'ottone
    s += rett(9, 50, 44, 146, "none", bordo(L, 1.6)) + rett(10, 51, 42, .8, "#fff", op(.35));
    return s + maniglia(49.5, 140, -1) + soglia(4, 58);
  });
  porta("vetro", "Vetro moderna", function (notte) {
    var s = ombraR(8, 46, 46, 154) + rett(8, 46, 46, 156, lin("an", [[0, "#5a6068"], [1, "#2c3036"]], 0, 0, 1, 1), bordo("#1d2025", 1.6));
    s += rett(12.5, 50.5, 37, 145.5, "#25292e") + vetro("vv", rq(13.5, 51.5, 35, 143.5), [13.5, 51.5, 35, 143.5], notte, false) + bordoVetro(13.5, 51.5, 35, 143.5);
    s += rett(13.5, 116, 35, 20, "#fff", op(notte ? .25 : .45)) + rett(13.5, 119.5, 35, .6, "#fff", op(.6)) + rett(13.5, 126, 35, .6, "#fff", op(.6)) + rett(13.5, 132.5, 35, .6, "#fff", op(.6));   // la fascia satinata
    s += rett(43.6, 98, 1.6, 4, "#8d949b") + rett(43.6, 158, 1.6, 4, "#8d949b") + sposta(.8, 1, rett(44.6, 94, 2.6, 72, "#000", op(.25))) + rett(44.6, 94, 2.6, 72, lin("ac", [[0, "#f4f6f8"], [.5, "#b8bfc6"], [1, "#6e767e"]], 0, 0, 1, 0), bordo("#3d4248", .6) + " rx='1.2'");   // la maniglia lunga d'acciaio
    return s + rett(5, 196, 52, 4, "#3a3f46", bordo("#1d2025", 1));
  });
  porta("rustica", "Rustica con borchie", function () {
    var c = "#7a4e2c", pietra = "#cbbfa8", s = "", i, j;
    var arco = "M5,200 L5,71 A26,26 0 0 1 57,71 L57,200 Z", vano = "M10,196 L10,71 A21,21 0 0 1 52,71 L52,196 Z";
    s += sposta(1.4, 1.6, pth(arco, "#000", op(.16))) + pth(arco, lin("ra", [[0, chiaro(pietra, .3)], [1, scuro(pietra, .2)]], 0, 0, 1, 1), bordo(L, 2));
    for (i = 0; i < 7; i++) { var a = Math.PI + i * Math.PI / 6 + Math.PI / 12; if (i < 6) s += tratto("M" + q(31 + Math.cos(a) * 21, 71 + Math.sin(a) * 21) + " L" + q(31 + Math.cos(a) * 26, 71 + Math.sin(a) * 26), L, .8, op(.6)); }   // i conci dell'arco
    [94, 120, 146, 172].forEach(function (y) { s += tratto("M5," + y + " L10," + y + " M52," + y + " L57," + y, L, .8, op(.6)); });
    s += pth(vano, scuro(c, .5)) + dentro("rv", pth(vano, "#000"), rett(10, 50, 42, 146, c) + (function () {
      var t = "", k;
      for (k = 0; k < 4; k++) t += rett(10 + k * 10.5, 50, 10.5, 146, lin("rt" + k, [[0, chiaro(c, .12 + k * .03)], [1, scuro(c, .15)]], 0, 0, 1, 0)) + venature(10 + k * 10.5, 50, 10.5, 146, c, 21 + k, 4, true, 1.4) + rett(10 + k * 10.5, 50, .9, 146, scuro(c, .55));
      return t;
    })() + rett(10, 50, 42, 146, luce(.6)));
    [88, 166].forEach(function (y) {   // le fasce di ferro con le borchie
      s += rett(10, y + 1.2, 42, 6, "#000", op(.25)) + rett(10, y, 42, 6, "#3a3431", bordo("#1a1614", .7)) + rett(10, y + .6, 42, .8, "#8a817b", op(.6));
      for (j = 0; j < 5; j++) s += cer(14 + j * 8.5, y + 3, 1.3, ferro()) + cer(13.6 + j * 8.5, y + 2.6, .4, "#fff", op(.6));
    });
    for (i = 0; i < 4; i++) for (j = 0; j < 4; j++) s += cer(15.2 + i * 10.5, 108 + j * 15, 1.1, ferro()) + cer(14.9 + i * 10.5, 107.7 + j * 15, .35, "#fff", op(.55));   // le borchie
    s += pth(vano, "none", bordo(L, 1.6));
    s += rett(39, 124, 7, 13, "#3a3431", bordo("#1a1614", .7) + " rx='1.5'") + cer(42.5, 137, 4, "none", "stroke='#1a1614' stroke-width='2.4'") + cer(42.5, 137, 4, "none", "stroke='#6b6460' stroke-width='1.2'") + cer(42.5, 128, 1.2, "#1a1614");   // l'anello
    return s + soglia(4, 58);
  });
  porta("rossa", "Rossa", function () {
    var c = "#c63a2e", s = cornice(10, 52, 50, "#f4f0e8");
    s += rett(10, 50, 42, 146, lin("pr", [[0, chiaro(c, .2)], [.5, c], [1, scuro(c, .25)]], 0, 0, 1, 1));
    s += riquadro(14, 56, 15.5, 60, c, 2.6) + riquadro(32.5, 56, 15.5, 60, c, 2.6) + riquadro(14, 128, 15.5, 62, c, 2.6) + riquadro(32.5, 128, 15.5, 62, c, 2.6);
    s += rett(22, 120, 18, 4, ottone(), bordo("#6b4a00", .7) + " rx='1'") + rett(23.5, 121.3, 15, 1.2, "#5a3a10", op(.8));   // la buca delle lettere
    s += pth("M12,52 L20,52 L12,190 Z", "#fff", op(.1)) + rett(10, 50, 42, 146, "none", bordo(L, 1.6));
    return s + cardine(11.6, 66) + cardine(11.6, 178) + pomolo(47, 122) + soglia(5, 57);
  });
  porta("giardino", "A vetri da giardino", function (notte) {
    var s = cornice(5, 57, 48, "#f5f2ec", 3.5), b = telaioBianco();
    [5, 31].forEach(function (x, n) {
      s += rett(x, 48, 26, 148, b, bordo(L, 1.2));
      s += vetro("vg" + n, rq(x + 3.4, 52, 19.2, 106), [x + 3.4, 52, 19.2, 106], notte, notte ? null : false) + bordoVetro(x + 3.4, 52, 19.2, 106);
      s += listello(x + 12.2, 52, 1.6, 106, "#f6f2ea");
      [78.5, 105, 131.5].forEach(function (y) { s += listello(x + 3.4, y - .8, 19.2, 1.6, "#f6f2ea"); });
      s += riquadro(x + 3.4, 163, 19.2, 29, "#efe9de", 2.2);
    });
    s += rett(30.4, 48, 1.2, 148, scuro("#f5f2ec", .35));
    return s + maniglia(28.4, 130, -1) + maniglia(33.6, 130, 1) + soglia(1, 61);
  });
  porta("arco", "Ad arco", function (notte) {
    var c = "#a8642f", pietra = "#e3d6bf", s = "", i;
    var arco = "M6,200 L6,74 A25,25 0 0 1 56,74 L56,200 Z", vano = "M11,196 L11,74 A20,20 0 0 1 51,74 L51,196 Z";
    s += sposta(1.4, 1.6, pth(arco, "#000", op(.16))) + pth(arco, lin("aa", [[0, chiaro(pietra, .35)], [1, scuro(pietra, .14)]], 0, 0, 1, 1), bordo(L, 2));
    s += pth(vano, lin("ap", [[0, chiaro(c, .1)], [1, scuro(c, .32)]], 0, 0, 1, 1));
    s += dentro("av", pth(vano, "#000"), venature(11, 54, 40, 142, c, 31, 12, true, 1.2) + [21, 31, 41].map(function (x) { return rett(x - .5, 54, 1, 142, "#4a2812", op(.5)) + rett(x + .5, 54, .6, 142, "#fff", op(.2)); }).join(""));
    s += rett(24.5, 82, 13, 18, "#5a3a22", bordo(L, 1)) + vetro("af", rq(26, 83.5, 10, 15), [26, 83.5, 10, 15], notte, false) + tratto("M31,83.5 L31,98.5 M26,91 L36,91", "#5a3a22", 1.2);   // il vetrino
    [96, 170].forEach(function (y) { s += pth("M11," + (y - 2.4) + " L32," + (y - 2.4) + " L35," + y + " L32," + (y + 2.4) + " L11," + (y + 2.4) + " Z", "#2b2018", bordo("#140e0a", .6)) + cer(15, y, .7, "#8a817b") + cer(26, y, .7, "#8a817b"); });   // le cerniere lunghe
    s += pth(vano, "none", bordo(L, 1.6)) + pomolo(45.5, 132);
    for (i = 0; i < 2; i++) s += tratto("M" + (6 + i * 45) + ",120 L" + (11 + i * 45) + ",120 M" + (6 + i * 45) + ",160 L" + (11 + i * 45) + ",160", L, .8, op(.5));
    return s + soglia(4, 58);
  });

  var FINESTRE = [];
  function finestra(id, nome, fa) { FINESTRE.push({ id: id, nome: nome, svg: function (opz) { var notte = !!(opz && opz.notte); return svg("f_" + id + (notte ? "_n" : ""), MW, MH, function () { return fa(notte); }); } }); }
  finestra("semplice", "Semplice", function (notte) {
    var s = alone(31, 86, 30, 48, notte) + ombraR(13, 44, 36, 84);
    s += rett(13, 44, 36, 84, telaioBianco(), bordo(L, 2)) + vetro("v", rq(17, 48, 28, 76), [17, 48, 28, 76], notte) + bordoVetro(17, 48, 28, 76);
    return s + rett(14, 45, 34, .8, "#fff", op(.8)) + davanzale(9, 53, 128);
  });
  finestra("croce", "A croce", function (notte) {
    var c = "#a8682f", s = alone(31, 86, 30, 48, notte) + ombraR(12, 43, 38, 85);
    s += rett(12, 43, 38, 85, lin("tc", [[0, chiaro(c, .25)], [.5, c], [1, scuro(c, .25)]], 0, 0, 1, 1), bordo(L, 2)) + vetro("v", rq(16, 47, 30, 77), [16, 47, 30, 77], notte) + bordoVetro(16, 47, 30, 77);
    s += listello(29.7, 47, 2.6, 77, scuro(c, .08)) + listello(16, 77, 30, 2.6, scuro(c, .08));
    return s + rett(13, 44, 36, .8, "#fff", op(.45)) + davanzale(8, 54, 128);
  });
  function persiana(x, y, w, h, c) {   // un'anta della persiana, aperta contro il muro, con le stecche
    var s = ombraR(x, y, w, h) + rett(x, y, w, h, lin("ps", [[0, chiaro(c, .2)], [1, scuro(c, .22)]], 0, 0, 1, 1), bordo(L, 1.6)), yy;
    s += rett(x + 2.2, y + 2.2, w - 4.4, h - 4.4, scuro(c, .3));
    for (yy = y + 2.4; yy < y + h - 3; yy += 3.4) s += rett(x + 2.2, yy, w - 4.4, 2.2, lin("pss", [[0, chiaro(c, .25)], [1, scuro(c, .12)]], 0, 0, 0, 1)) + rett(x + 2.2, yy + 2.2, w - 4.4, .7, "#000", op(.3));
    return s + rett(x, y + h * .47, w, 3.6, c, bordo(L, .8)) + rett(x + 2.2, y + 2.2, w - 4.4, h - 4.4, "none", "stroke='" + L + "' stroke-width='.7' opacity='.7'") + rett(x + .8, y + .8, w - 1.6, .7, "#fff", op(.45));
  }
  finestra("persiane", "Con le persiane", function (notte) {
    var s = alone(31, 86, 30, 48, notte) + persiana(2.5, 42, 15.5, 88, "#4f8a5b") + persiana(44, 42, 15.5, 88, "#4f8a5b");
    s += ombraR(18, 44, 26, 84) + rett(18, 44, 26, 84, telaioBianco(), bordo(L, 1.8)) + vetro("v", rq(21, 47, 20, 78), [21, 47, 20, 78], notte) + bordoVetro(21, 47, 20, 78);
    s += listello(30.2, 47, 1.6, 78, "#f4efe6") + listello(21, 70, 20, 1.6, "#f4efe6");
    s += cardine(18.4, 52).replace(/height='8'/, "height='5'") + cardine(43.6, 52).replace(/height='8'/, "height='5'");
    return s + davanzale(15, 47, 128);
  });
  finestra("arco", "Ad arco", function (notte) {
    var s = alone(31, 84, 30, 50, notte), st = "#efe3cc";
    var mostra = "M8,128 L8,66 A23,23 0 0 1 54,66 L54,128 Z", tel = "M13,126 L13,66 A18,18 0 0 1 49,66 L49,126 Z", ve = "M16.5,124 L16.5,66 A14.5,14.5 0 0 1 45.5,66 L45.5,124 Z";
    s += sposta(1.4, 1.6, pth(mostra, "#000", op(.16))) + pth(mostra, lin("ms", [[0, chiaro(st, .4)], [1, scuro(st, .12)]], 0, 0, 1, 1), bordo(L, 2)) + pth(tel, telaioBianco(), bordo(L, 1.6));
    s += vetro("v", pth(ve, "#000"), [16.5, 51.5, 29, 72.5], notte) + pth(ve, "none", "stroke='" + L + "' stroke-width='.9'");
    s += listello(30.2, 51.5, 1.6, 72.5, "#f4efe6") + listello(16.5, 65.2, 29, 1.6, "#f4efe6");
    [-.25, -.75].forEach(function (k) { var a = Math.PI * k; s += tratto("M31,66 L" + q(31 + Math.cos(a) * 14.5, 66 + Math.sin(a) * 14.5), "#f4efe6", 1.6) + tratto("M31,66 L" + q(31 + Math.cos(a) * 14.5, 66 + Math.sin(a) * 14.5), L, .4, op(.6)); });
    s += pth("M26.5,39 L35.5,39 L34,49 L28,49 Z", lin("ch", [[0, "#f6efe0"], [1, "#cdbfa4"]], 0, 0, 1, 1), bordo(L, 1.3));   // la chiave di volta
    return s + davanzale(5, 57, 128, "#e8dfcf");
  });
  finestra("vetrata", "Grande vetrata", function (notte) {
    var s = alone(31, 102, 30.5, 86, notte) + ombraR(6, 26, 50, 152);
    s += rett(6, 26, 50, 152, lin("vt", [[0, "#5a6068"], [1, "#2c3036"]], 0, 0, 1, 1), bordo("#1d2025", 1.6)) + vetro("v", rq(9, 29, 44, 146), [9, 29, 44, 146], notte, "#f3efe6") + bordoVetro(9, 29, 44, 146);
    s += rett(29.8, 29, 2.4, 146, "#3b4047", bordo("#1d2025", .5)) + rett(9, 147, 44, 2.4, "#3b4047", bordo("#1d2025", .5)) + rett(30.2, 29, .6, 146, "#8d949b", op(.6));
    return s + rett(4, 178, 54, 3, lin("vs", [[0, "#d6dbe0"], [1, "#7b838b"]], 0, 0, 0, 1), bordo("#1d2025", .8)) + rett(5, 181, 52, 2.4, "#000", op(.14));
  });
  finestra("oblo", "Oblò tondo", function (notte) {
    var s = alone(31, 84, 30, 30, notte) + cer(32.4, 85.6, 23, "#000", op(.16));
    s += cer(31, 84, 23, lin("ob", [[0, "#f7f0e2"], [1, "#cdbfa5"]], 0, 0, 1, 1), bordo(L, 2)) + cer(31, 84, 18.6, ottone(), bordo("#6b4a00", 1));
    s += vetro("v", "<circle cx='31' cy='84' r='15.2'/>", [15.8, 68.8, 30.4, 30.4], notte, false) + cer(31, 84, 15.2, "none", "stroke='#000' stroke-width='1.6' opacity='.18'") + cer(31, 84, 15.2, "none", bordo("#6b4a00", .9));
    for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 + Math.PI / 8; s += cer(31 + Math.cos(a) * 16.9, 84 + Math.sin(a) * 16.9, .95, "#8a6414") + cer(30.7 + Math.cos(a) * 16.9, 83.7 + Math.sin(a) * 16.9, .35, "#fff6cf"); }
    return s + pth("M14,72 A19,19 0 0 1 26,66", "none", "stroke='#fff' stroke-width='1.2' opacity='.6' stroke-linecap='round'");
  });
  function geranio(x, y, r) {   // un'ombrella di gerani: tanti fiorellini rossi, i più chiari davanti
    var s = cer(x, y, 4.4, "#7a141b", op(.35)), i;
    for (i = 0; i < 12; i++) {
      var a = r() * Math.PI * 2, d = Math.sqrt(r()) * 3.4, fx = x + Math.cos(a) * d, fy = y + Math.sin(a) * d * .8, c = scegli(r, ["#e0333a", "#f04a4f", "#d42c35", "#ff5e63"]);
      s += cer(fx, fy, 1.45, c, "stroke='#8e1a20' stroke-width='.35'") + cer(fx, fy, .35, "#8e1a20", op(.7));
    }
    return s + cer(x - 1.4, y - 1.6, .8, "#fff", op(.55)) + cer(x + 1.2, y - .6, .5, "#ffd2d2", op(.8));
  }
  function fogliaGeranio(x, y, rr, c) {   // la foglia tonda e smerlata del geranio, con la fascia più scura
    var a = [], i;
    for (i = 0; i < 14; i++) { var t = i / 14 * Math.PI * 2, k = i % 2 ? .86 : 1; a.push([x + Math.cos(t) * rr * k, y + Math.sin(t) * rr * k * .9]); }
    return pth(tondo(a, rr * .3), c, bordo(scuro(c, .45), .5)) + ell(x, y, rr * .55, rr * .5, "none", "stroke='" + scuro(c, .35) + "' stroke-width='" + f2(rr * .22) + "' opacity='.4'") +
      tratto("M" + q(x, y) + " L" + q(x - rr * .7, y - rr * .4) + " M" + q(x, y) + " L" + q(x + rr * .7, y - rr * .4) + " M" + q(x, y) + " L" + q(x, y + rr * .75), chiaro(c, .3), .35, op(.6)) + ell(x - rr * .35, y - rr * .4, rr * .3, rr * .2, "#fff", op(.25));
  }
  finestra("fioriera", "Con la fioriera", function (notte) {
    var s = alone(31, 84, 30, 48, notte) + ombraR(12, 43, 38, 83), r = rnd(431), i, verdi = ["#4f8f3f", "#5ea24a", "#447f36", "#69ad53", "#3f7a32"];
    s += rett(12, 43, 38, 83, telaioBianco(), bordo(L, 2)) + vetro("v", rq(15.5, 46.5, 31, 76), [15.5, 46.5, 31, 76], notte) + bordoVetro(15.5, 46.5, 31, 76);
    s += listello(30.2, 46.5, 1.6, 76, "#f4efe6") + listello(15.5, 74, 31, 1.6, "#f4efe6") + davanzale(8, 54, 126);
    for (i = 0; i < 11; i++) s += fogliaGeranio(11.5 + i * 3.9 + r() * 1.6, 126.5 - Math.sin(i / 10 * Math.PI) * 4.5 + r() * 2, 3.5 + r() * 1.1, scegli(r, verdi));   // la cupoletta di foglie
    [[15, 114], [24.5, 110], [34, 113.5], [44, 110.5], [49, 117.5], [19.5, 119], [39.5, 118.5]].forEach(function (p) { s += tratto("M" + q(p[0], p[1] + 3) + " Q" + q(p[0] + (r() - .5) * 3, p[1] + 8) + " " + q(31 + (p[0] - 31) * .8, 128), "#447f36", 1) + geranio(p[0], p[1], r); });
    s += rett(10.4, 131.6, 44, 14, "#000", op(.18)) + rett(9, 130, 44, 14, lin("vf", [[0, "#dd8253"], [.5, "#c66a3e"], [1, "#9a4a26"]], 0, 0, 0, 1), bordo(L, 1.6) + " rx='1.2'") + rett(8, 129, 46, 3.6, "#d97a4a", bordo(L, 1.2) + " rx='1'") + rett(9, 129.8, 44, .8, "#ffd2b0", op(.6));
    s += rett(13, 135, 36, .9, "#8e4422", op(.5)) + rett(13, 139, 36, .9, "#8e4422", op(.5));
    for (i = 0; i < 5; i++) s += fogliaGeranio(12 + i * 9.5 + r() * 2, 129.5 + r(), 2.8 + r() * .7, scegli(r, verdi));   // le foglie sopra il bordo
    for (i = 0; i < 4; i++) (function (x0, l, dx) {   // i rametti che scendono, con le foglioline a cuore
      var d = "M" + q(x0, 131) + " C" + q(x0 + dx * .2, 138) + " " + q(x0 + dx, 138 + l * .5) + " " + q(x0 + dx * .8, 131 + l), k;
      s += tratto(d, "#3f7a32", .9);
      for (k = 1; k <= 4; k++) { var t = k / 4, u = 1 - t, px = u * u * u * x0 + 3 * u * u * t * (x0 + dx * .2) + 3 * u * t * t * (x0 + dx) + t * t * t * (x0 + dx * .8), py = u * u * u * 131 + 3 * u * u * t * 138 + 3 * u * t * t * (138 + l * .5) + t * t * t * (131 + l), lato = k % 2 ? -1 : 1;
        s += ell(px + lato * 1.6, py, 1.9 - t * .4, 1.3 - t * .3, scegli(r, verdi), bordo("#2e5e26", .4) + " transform='rotate(" + (lato * 30) + " " + f2(px + lato * 1.6) + " " + f2(py) + ")'"); }
    })(13 + i * 11 + r() * 3, 12 + r() * 8, (r() - .5) * 6);
    return s;
  });
  finestra("bagno", "Finestrella del bagno", function (notte) {
    var s = alone(31, 72, 22, 30, notte) + ombraR(18, 46, 26, 52);
    s += rett(18, 46, 26, 52, telaioBianco(), bordo(L, 1.8));
    s += dentro("v", rq(21, 49, 20, 46), rett(21, 49, 20, 46, notte ? lin("bn", [[0, "#fffbe9"], [1, "#ffd37a"]], 0, 0, .3, 1) : lin("bg", [[0, "#f2f6f8"], [1, "#c6d3dc"]], 0, 0, .3, 1)) + granelli(120, 20, 46, 433, "#fff", 1.2, .55).replace("<path", "<path transform='translate(21 49)'"));
    s += bordoVetro(21, 49, 20, 46) + listello(21, 71.2, 20, 1.6, "#f4efe6");
    return s + davanzale(15, 47, 98);
  });

  window.SGKit = { muri: MURI, pavimenti: PAVIMENTI, porte: PORTE, finestre: FINESTRE, tetti: TETTI };
})();

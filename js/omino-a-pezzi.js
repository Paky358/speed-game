/* =========================================================
   SPeeD GAME — I PEZZI DEGLI AVATAR «ILLUSTRATI» (strada A, 5 nov 2026)
   Capelli, cappelli, vestiti, scarpe, bocche, barbe e segni disegnati sul motore di js/omino-a.js.
   Ogni pezzo: SGOminoA.pezzo(tipo, voce, function (K) { … }). Fatto unendo i file di lavoro (pezzi/*.js).
   ========================================================= */

// ---- capelli-uomo ----
// pezzi: capelli-uomo — pettinature da uomo per gli avatar illustrati (stile del pezzo «corti»)
(function () {
  var A = window.SGOminoA; if (!A) return;

  // ---------- aiuti comuni ----------
  // contorno della massa di capelli (coordinate testa). o: vol (quanto sale sopra il cranio), s (spessore ai lati), sb (dove finiscono le basette),
  // hy (attaccatura al centro, sotto la cima), th (attaccatura alla tempia), peak (x della cima), hl (funzione: u 0..1 -> [x,y] dell'attaccatura)
  function forma(K, o) {
    var w = K.F.cw + (o.s != null ? o.s : 3), T = K.top, vol = o.vol, sb = o.sb != null ? o.sb : -84;
    var cy = Math.min(-98, sb), rx = w + 6, ry = cy - (T - vol), px = o.peak || 0, out = [];
    var ang = o.ang || [180, 150, 120, 90, 60, 30, 0];
    ang.forEach(function (a, i) {
      var r = a * Math.PI / 180, bump = o.bump ? o.bump[i] || 0 : 0;
      var x = rx * Math.cos(r), y = cy - ry * Math.sin(r);
      if (a === 90) x += px;
      out.push([x * (1 + bump * 0.01), y - bump]);
    });
    var hy = T + (o.hy != null ? o.hy : 24), th = o.th != null ? o.th : -100;
    var ib = w - (o.ib != null ? o.ib : 9);
    var uu = [0, 0.3, 0.55, 0.8, 1];
    var hl = o.hl || function (u, side) { return [w * 0.93 * u, hy + (th - hy) * Math.pow(u, 3)]; };
    var inR = uu.map(function (u) { return hl(u, 1); }), inL = uu.map(function (u) { var q = hl(u, -1); return [-q[0], q[1]]; });
    var R = [[w - 1, sb], [ib, sb]];
    var pts = [[-(rx - 1), sb]].concat(out.map(function (q) { return q.slice(); }), [[rx - 1, sb]], [[ib, sb - 1]], inR.slice().reverse(), inL, [[-ib, sb - 1]]);
    // la cima: sposta anche il punto a 90 gradi se c'è peak (già fatto); sfumature sui lati
    return { d: K.lisciaChiusa(pts), pts: pts, w: w, T: T, hy: hy, th: th, sb: sb, out: out, inR: inR, inL: inL, rx: rx };
  }
  // la massa con volumi: base, ciocche, luce a sinistra in alto, ombra a destra
  function chiudi(K, F, ciocche, o) {
    o = o || {};
    var s = K.Pa(F.d, K.U("hg3"));
    s += "<g clip-path='" + K.clip(F.d) + "'>";
    s += ciocche || "";
    s += K.El(-24, F.T - (o.vol || 14) * 0.2 - 6, 34, 20, K.soft(K.hL, 0.55));
    s += K.El(F.w - 6, -118, 22, 50, K.soft(K.hDD, 0.5));
    s += K.El(0, F.hy + F.T + 4, F.w * 0.8, 9, K.soft(K.hDD, 0.35));
    s += (o.extra || "") + "</g>";
    return s;
  }
  // basette (strisce ai lati del viso)
  function basette(K, w, sb) {
    sb = sb == null ? -80 : sb;
    var a = K.limb([[w - 4, -108, 11], [w, -96, 11], [w + 0.5, -86, 9], [w - 2, sb, 4.5]]);
    var b = K.limb([[-w + 4, -108, 11], [-w, -96, 11], [-w - 0.5, -86, 9], [-w + 2, sb, 4.5]]);
    return K.Pa(a, K.U("hg2")) + K.Pa(b, K.U("hg2"));
  }
  // ciocche dal punto di attaccatura verso il contorno: n ciocche, spinta verso l'alto o di lato
  // dir: funzione (i, n) -> {u: posizione sull'attaccatura 0..1 da sinistra a destra, tx, ty: punto d'arrivo vicino al contorno}
  function fascio(K, F, lista, ids) {
    // l'ultima parte di ogni ciocca esce un po' dal contorno (poi ritagliata) e resta larga: niente punte a stella
    lista = lista.map(function (Lc) { Lc = Lc.map(function (q) { return q.slice(); }); var e = Lc[Lc.length - 1], dx = e[0], dy = e[1] + 100, l = Math.hypot(dx, dy) || 1; e[0] += dx / l * 9; e[1] += dy / l * 9; e[2] = Math.max(e[2], 8); return Lc; });
    return K.ciocche(lista, ids || ["hg1", "hg2", "hg1", "hg2", "hg1"]);
  }
  function lungoAtt(F, u) { // punto sull'attaccatura, u 0 sinistra .. 1 destra
    var l = F.inL.slice().reverse().concat(F.inR.slice(1)), t = u * (l.length - 1), i = Math.min(l.length - 2, Math.floor(t)), f = t - i;
    return [l[i][0] + (l[i + 1][0] - l[i][0]) * f, l[i][1] + (l[i + 1][1] - l[i][1]) * f];
  }
  function lungoOut(F, u) { // punto sul contorno esterno (arco), u 0 sinistra .. 1 destra
    var l = F.out, t = u * (l.length - 1), i = Math.min(l.length - 2, Math.floor(t)), f = t - i;
    return [l[i][0] + (l[i + 1][0] - l[i][0]) * f, l[i][1] + (l[i + 1][1] - l[i][1]) * f];
  }
  // ciocche a ventaglio: da attaccatura (u0) al contorno (u1) con un po' di curva (bend) e larghezza
  function ventaglio(K, F, n, u0a, u0b, u1a, u1b, opz) {
    opz = opz || {}; var R = K.rnd(opz.seme || 5), L = [], wd = opz.w || 15, bend = opz.bend || 0;
    for (var i = 0; i < n; i++) {
      var t = n === 1 ? 0.5 : i / (n - 1), a = lungoAtt(F, u0a + (u0b - u0a) * t), b = lungoOut(F, u1a + (u1b - u1a) * t);
      var dx = b[0] - a[0], dy = b[1] - a[1], j = (R() - 0.5) * 4;
      var m1 = [a[0] + dx * 0.4 + bend + j, a[1] + dy * 0.4], m2 = [a[0] + dx * 0.78 + bend * 0.6, a[1] + dy * 0.78];
      var e = [b[0] - dx * 0.04, b[1] - dy * 0.04];
      L.push([[a[0], a[1] + 4, wd * 0.8], [m1[0], m1[1], wd], [m2[0], m2[1], wd * 0.8], [e[0], e[1], 3]]);
    }
    return L;
  }
  function peli(K, seme, n, x0, x1, y0, y1, op, col) { // trama di sottili tratti per dare materia
    var R = K.rnd(seme), d = "";
    for (var i = 0; i < n; i++) { var x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); d += "M" + K.n1(x) + " " + K.n1(y) + "l" + K.n1((R() - 0.4) * 9) + " " + K.n1(-2 - R() * 7); }
    return "<path d='" + d + "' stroke='" + (col || K.hDD) + "' stroke-width='1.1' stroke-linecap='round' fill='none' opacity='" + (op || 0.3) + "'/>";
  }
  function rimosso(K, d) { return "<g clip-path='" + K.clip(d) + "'>"; }

  // ---------- riga di lato ----------
  A.pezzo("capelli", "riga", function (K) {
    var hlf = function (u, side) { var w = K.F.cw + 3; return side === 1 ? [w * 0.93 * u, K.top + 22 + (-100 - K.top - 22) * Math.pow(u, 2.6)] : [w * 0.93 * u, K.top + 30 + (-102 - K.top - 30) * Math.pow(u, 2.8)]; };
    var F = forma(K, { vol: 20, hy: 24, hl: hlf, s: 3 });
    var T = K.top, R = K.rnd(3);
    var L = [];
    // a destra della riga: massa grossa che scende verso la tempia
    for (var i = 0; i < 6; i++) {
      var t = i / 5, a = [-16 + t * 22, T + 20 - t * 2], b = lungoOut(F, 0.55 + t * 0.45);
      L.push([[a[0], a[1] + 2, 14], [a[0] + (b[0] - a[0]) * 0.4, a[1] + (b[1] - a[1]) * 0.3 - 12 - 8 * (1 - t), 17], [a[0] + (b[0] - a[0]) * 0.75, a[1] + (b[1] - a[1]) * 0.65 - 6, 14], [b[0] - 1, b[1] + 1, 2]]);
    }
    // a sinistra: meno capelli, più corti
    for (i = 0; i < 4; i++) { var t2 = i / 3, a2 = [-16 - t2 * 14, T + 20 + t2 * 8], b2 = lungoOut(F, 0.04 + t2 * 0.42); L.push([[a2[0], a2[1] + 2, 12], [(a2[0] + b2[0]) / 2 - 3, (a2[1] + b2[1]) / 2, 14], [b2[0] + 2, b2[1] + 3, 3]]); }
    var d = chiudi(K, F, fascio(K, F, L), { vol: 20 });
    // la riga: sottile solco scuro dall'attaccatura alla cima
    d += K.St("M-15 " + K.n1(T + 22) + "C-17 " + K.n1(T + 8) + " -14 " + K.n1(T - 8) + " -6 " + K.n1(T - 16), K.hDD, 2.2, 0.7) + K.St("M-14 " + K.n1(T + 21) + "C-16 " + K.n1(T + 8) + " -13 " + K.n1(T - 8) + " -5 " + K.n1(T - 15), K.hL, 1.1, 0.5);
    return { fronte: d + basette(K, F.w - 2) };
  });

  // ---------- ciuffo (alto e portato avanti) ----------
  A.pezzo("capelli", "ciuffo", function (K) {
    var T = K.top;
    var hlf = function (u, side) { var w = K.F.cw + 3; return [w * 0.93 * u, T + 18 + (-100 - T - 18) * Math.pow(u, 3)]; };
    var F = forma(K, { vol: 28, hy: 18, hl: hlf, peak: 10, bump: [0, 2, 8, 10, 8, 2, 0] });
    var L = [], i;
    for (i = 0; i < 6; i++) {
      var t = i / 5, a = lungoAtt(F, 0.12 + t * 0.8), b = lungoOut(F, 0.18 + t * 0.75);
      L.push([[a[0], a[1] + 4, 13], [a[0] + (b[0] - a[0]) * 0.35, a[1] - 18, 17], [a[0] + (b[0] - a[0]) * 0.7 + 4, (a[1] + b[1]) / 2 - 22, 14], [b[0], b[1] + 2, 2]]);
    }
    for (i = 0; i < 3; i++) { var u = 0.04 + i * 0.09, a3 = lungoAtt(F, u), b3 = lungoOut(F, u * 1.3); L.push([[a3[0], a3[1] + 3, 11], [(a3[0] + b3[0]) / 2, (a3[1] + b3[1]) / 2, 13], [b3[0], b3[1] + 3, 2]]); }
    var s = chiudi(K, F, fascio(K, F, L), { vol: 28 });
    // la punta del ciuffo sulla fronte, a ciocca
    s += K.Pa(K.limb([[-12, T + 18, 8], [2, T + 24, 14], [16, T + 22, 12], [28, T + 14, 5]], 0.2), K.U("hg1")) + K.Pa(K.limb([[-6, T + 20, 3], [6, T + 22, 5], [18, T + 19, 3]]), K.hL, " opacity='.5'");
    return { fronte: s + basette(K, F.w - 2) };
  });

  // ---------- spettinati ----------
  A.pezzo("capelli", "spettinati", function (K) {
    var T = K.top, w = K.F.cw + 3, R = K.rnd(21);
    var hlf = function (u, side) { return [w * 0.93 * u, T + 24 + (-100 - T - 24) * Math.pow(u, 2.8) + (side === 1 ? 2 : -1) * Math.sin(u * 8) * 3]; };
    var F = forma(K, { vol: 14, hy: 26, hl: hlf, s: 2 });
    // contorno a punte: tanti ciuffi rivolti in direzioni diverse
    var cy = -100, cx = 0, pts = [], n = 14, i;
    var base = [], tips = [];
    for (i = 0; i <= n; i++) {
      var a = Math.PI - i * Math.PI / n, rr = w + 2, ry = cy - (T - 14);
      var bx = rr * Math.cos(a), by = cy - ry * Math.sin(a);
      var nx = Math.cos(a), ny = -Math.sin(a), long = 10 + R() * 14 + (i % 2 ? 6 : 0);
      var tilt = (R() - 0.5) * 0.9;
      tips.push([bx + (nx + ny * tilt) * long * 1.1, by + (ny - nx * tilt) * long * 0.9]);
      base.push([bx, by]);
    }
    // percorso: base sinistra giù, punte, base destra, poi l'attaccatura (stessa di forma)
    var d = "M" + K.n1(-(w + 1)) + " -84";
    d += "L" + K.n1(base[0][0] - 3) + " -104";
    for (i = 0; i <= n; i++) {
      var p0 = base[i], tp = tips[i], pn = base[Math.min(n, i + 1)];
      var mid = [(p0[0] + pn[0]) / 2, (p0[1] + pn[1]) / 2];
      d += "Q" + K.n1(p0[0] * 0.5 + tp[0] * 0.5) + " " + K.n1(p0[1] * 0.5 + tp[1] * 0.5) + " " + K.n1(tp[0]) + " " + K.n1(tp[1]);
      if (i < n) d += "Q" + K.n1(mid[0] + (tp[0] - mid[0]) * 0.05) + " " + K.n1(mid[1] - 2) + " " + K.n1(pn[0] * 0.98 + (tips[i + 1][0] - pn[0]) * 0.06) + " " + K.n1(pn[1] - 3);
    }
    d += "L" + K.n1(w + 1) + " -84L" + K.n1(w - 9) + " -84";
    var hr = F.inR.slice().reverse().concat(F.inL.slice(1));
    d += "L" + K.n1(hr[0][0]) + " " + K.n1(hr[0][1]) + K.cr(hr) + "L" + K.n1(-(w - 9)) + " -84Z";
    var L = [];
    for (i = 0; i < 12; i++) {
      var u = 0.06 + i * 0.075, att = lungoAtt(F, u), tp2 = tips[Math.min(n, Math.round(u * n))];
      var jx = (R() - 0.5) * 18;
      L.push([[att[0], att[1] + 5, 11], [(att[0] * 0.5 + tp2[0] * 0.5) + jx * 0.4, (att[1] + tp2[1]) / 2, 12], [tp2[0] * 0.92 + jx * 0.2, tp2[1] * 0.92 + 3, 2]]);
    }
    var s = K.Pa(d, K.U("hg3"));
    s += "<g clip-path='" + K.clip(d) + "'>" + fascio(K, F, L, ["hg1", "hg2", "hg1", "hg1", "hg2"]) +
      K.El(-24, T - 6, 36, 22, K.soft(K.hL, 0.55)) + K.El(w - 6, -118, 22, 52, K.soft(K.hDD, 0.5)) + K.El(0, T + 28, w * 0.8, 9, K.soft(K.hDD, 0.35)) +
      peli(K, 8, 22, -w, w, T - 20, T + 20, 0.3) + "</g>";
    return { fronte: s + basette(K, w - 2) };
  });

  // ---------- puntini sparsi: prob(x, y) dà la probabilità 0..1 (bordi morbidi) ----------
  function puntini(K, seme, n, x0, x1, y0, y1, prob, op) {
    var R = K.rnd(seme), d = "";
    for (var i = 0; i < n; i++) { var x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (R() < prob(x, y)) d += "M" + K.n1(x) + " " + K.n1(y) + "h.3"; }
    return "<path d='" + d + "' stroke='" + K.hDD + "' stroke-width='1.7' stroke-linecap='round' opacity='" + (op || 0.4) + "' fill='none'/>";
  }
  function fade(v, a, b) { var t = (v - a) / (b - a); return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  // ---------- zone rasate ai lati: sfumatura morbida dal colore dei capelli alla pelle, senza angoli ----------
  function latiRasati(K, w, alto, sb, op) {
    var rx = w + 6, s = "";
    [-1, 1].forEach(function (sg) {
      var P = function (x, y) { return [sg * x, y]; };
      var d = K.lisciaChiusa([P(rx - 1, sb + 2), P(rx + 1, -98), P(rx - 1, alto + 4), P(rx - 12, alto - 1), P(w - 14, alto + 4), P(w - 10, -100), P(w - 8, sb - 4), P(w + 2, sb + 6)]);
      var g = K.LG("sf" + (sg > 0 ? "d" : "s"), sg * (rx + 2), 0, sg * (w - 12), 0, [[0, K.hDD, 0.72], [0.55, K.hDD, 0.4], [1, K.hDD, 0.02]], true);
      s += K.Pa(d, g);
      s += "<g clip-path='" + K.clip(d) + "'>" + puntini(K, sg > 0 ? 41 : 43, 420, Math.min(sg * (w - 14), sg * (rx + 2)), Math.max(sg * (w - 14), sg * (rx + 2)), alto - 4, sb + 8,
        function (x, y) { var ax = Math.abs(x); return fade(ax, w - 16, w + 4) * fade(y, alto - 2, alto + 14) * fade(sb + 8 - y, 0, 10) + 0.12; }, op || 0.45) + "</g>";
    });
    return s;
  }

  // ---------- sfumato: lati corti sfumati, sopra più lungo ----------
  A.pezzo("capelli", "sfumato", function (K) {
    var T = K.top, w = K.F.cw + 3;
    var hlf = function (u, side) { return [w * 0.9 * u, T + 22 + (-108 - T - 22) * Math.pow(u, 3)]; };
    var F = forma(K, { vol: 22, hy: 22, hl: hlf, sb: -112, ib: 14, s: 1, ang: [180, 150, 120, 90, 60, 30, 0] });
    var L = [], i;
    for (i = 0; i < 7; i++) { var t = i / 6, a = lungoAtt(F, 0.08 + t * 0.84), b = lungoOut(F, 0.14 + t * 0.72); L.push([[a[0], a[1] + 4, 12], [a[0] + (b[0] - a[0]) * 0.4, a[1] + (b[1] - a[1]) * 0.35 - 6, 16], [a[0] + (b[0] - a[0]) * 0.8, a[1] + (b[1] - a[1]) * 0.78, 10], [b[0], b[1] + 1, 2]]); }
    var s = latiRasati(K, w, -112, -80, 0.5);
    s += chiudi(K, F, fascio(K, F, L), { vol: 22 });
    s += peli(K, 4, 0, 0, 0, 0, 0);
    return { fronte: s };
  });

  // ---------- rasato: quasi a zero, solo l'ombra dei capelli sull'area dei capelli, bordi morbidi ----------
  A.pezzo("capelli", "rasato", function (K) {
    var T = K.top, w = K.F.cw + 3;
    var hlf = function (u, side) { return [w * 0.93 * u, T + 22 + (-104 - T - 22) * Math.pow(u, 3)]; };
    var F = forma(K, { vol: 3, hy: 22, hl: hlf, s: 3, ib: 9 });
    var pts = F.inR;
    var yh = function (x) { x = Math.abs(x); for (var i = 0; i < pts.length - 1; i++) if (x <= pts[i + 1][0]) { var t = (x - pts[i][0]) / ((pts[i + 1][0] - pts[i][0]) || 1); return pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t; } return null; };
    var prob = function (x, y) {
      var h = yh(x), ax = Math.abs(x);
      if (h == null || ax > F.w - 9) return fade(-82 - y, 0, 22) * 0.95;
      return fade(h - y, 0, 20) * 0.95;
    };
    var s = "<g clip-path='" + K.clip(K.faceD) + "'>";
    s += K.Pa(F.d, K.LG("rsm", 0, 0, 0, 1, [[0, K.capelli, 0.3], [0.6, K.capelli, 0.16], [1, K.capelli, 0.03]]));
    s += puntini(K, 12, 1500, -70, 70, T - 6, -78, prob, 0.4);
    s += puntini(K, 13, 700, -70, 70, T - 6, -78, function (x, y) { return prob(x, y) * 0.8; }, 0.22);
    s += K.El(-22, T + 6, 32, 16, K.soft(K.hL, 0.28)) + "</g>";
    return { fronte: s, ombraFronte: false };
  });

  // ---------- ricci: corti / afro corto. Massa irregolare a riccioli piccoli, dentro più scura, trama a «c» e «s» ----------
  function ricci(K, o) {
    var T = K.top, w = K.F.cw + o.s, R = K.rnd(o.seme), cy = -98, n1 = K.n1;
    var rx = w + 4, ry = cy - (T - o.vol), sb = -84, ib = w - 10;
    var hlf = function (u) { return [w * 0.9 * u, T + o.hy + (-100 - T - o.hy) * Math.pow(u, 2.8)]; };
    var N = o.n, ext = [], i;
    for (i = 0; i <= N; i++) { var a = Math.PI - i * Math.PI / N; ext.push([rx * Math.cos(a), cy - ry * Math.sin(a), a]); }
    var d = "M" + n1(-(rx - 2)) + " " + sb + "L" + n1(-(rx - 1)) + " " + cy;
    for (i = 0; i < N; i++) {
      var p0 = ext[i], p1 = ext[i + 1], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, am = (p0[2] + p1[2]) / 2;
      var k = o.r * (0.7 + R() * 0.8);
      d += "Q" + n1(mx + Math.cos(am) * k * 1.25) + " " + n1(my - Math.sin(am) * k * 1.25) + " " + n1(p1[0]) + " " + n1(p1[1]);
    }
    d += "L" + n1(rx - 2) + " " + sb + "L" + n1(ib) + " " + sb;
    var hp = [], u;
    for (u = 0; u <= 1.001; u += 0.125) hp.push(hlf(u));
    var hr = hp.slice().reverse(), hlft = hp.slice(1).map(function (q) { return [-q[0], q[1]]; });
    var seq = hr.concat(hlft), at = "L" + n1(seq[0][0]) + " " + n1(seq[0][1]);
    for (i = 0; i < seq.length - 1; i++) { var a0 = seq[i], a1 = seq[i + 1]; at += "Q" + n1((a0[0] + a1[0]) / 2) + " " + n1((a0[1] + a1[1]) / 2 + (i % 2 ? 4 : -4) * 0.7 - 3) + " " + n1(a1[0]) + " " + n1(a1[1]); }
    d += at + "L" + n1(-ib) + " " + sb + "Z";
    var s = K.Pa(d, K.U("hg3"));
    s += "<g clip-path='" + K.clip(d) + "'>";
    s += K.El(0, -118, rx * 0.95, 34, K.soft(K.hDD, 0.55)) + K.El(0, -100, rx, 30, K.soft(K.hDD, 0.3));
    var lc = "", dk = "", cnt = o.m;
    for (i = 0; i < cnt; i++) {
      var x = (R() * 2 - 1) * (rx - 3), y = T - o.vol + 4 + R() * (sb - 10 - T + o.vol);
      var inside = (x * x) / (rx * rx) + (y - cy) * (y - cy) / (ry * ry) < 1.05; if (!inside && y < cy) continue;
      if (y > -108 && Math.abs(x) < ib - 4) continue;
      var q = o.r * (0.5 + R() * 0.5), rot = R() * 6.28, cs = Math.cos(rot), sn = Math.sin(rot);
      var P = function (px, py) { return n1(x + px * cs - py * sn) + " " + n1(y + px * sn + py * cs); };
      var path;
      if (R() > 0.45) path = "M" + P(q, -q * 0.7) + "C" + P(-q * 0.4, -q * 1.1) + " " + P(-q * 1.1, q * 0.2) + " " + P(-q * 0.1, q * 0.9);
      else path = "M" + P(-q, -q * 0.4) + "C" + P(-q * 0.5, -q * 1.1) + " " + P(q * 0.1, -q * 0.3) + " " + P(0, 0) + "S" + P(q * 0.6, q * 1.1) + " " + P(q, q * 0.4);
      dk += path;
      var lit = (x < 12 && y < -112) ? 0.75 : 0.18;
      if (R() < lit) lc += "M" + n1(x - q * 0.5) + " " + n1(y - q * 0.9) + "q" + n1(q * 0.5) + " " + n1(-q * 0.4) + " " + n1(q * 1.0) + " " + n1(-q * 0.1);
    }
    var mid = "";
    for (i = 0; i < cnt * 0.8; i++) { var xm = (R() * 2 - 1) * (rx - 2), ym = T - o.vol + 3 + R() * 40, qm = o.r * 0.6; mid += "M" + n1(xm - qm) + " " + n1(ym) + "c" + n1(qm * 0.3) + " " + n1(-qm * 1.1) + " " + n1(qm * 1.5) + " " + n1(-qm * 0.9) + " " + n1(qm * 1.7) + " " + n1(qm * 0.1); }
    s += "<path d='" + dk + "' stroke='" + K.hDD + "' stroke-width='2.1' stroke-linecap='round' fill='none' opacity='.55'/>";
    s += "<path d='" + mid + "' stroke='" + K.capelli + "' stroke-width='2.2' stroke-linecap='round' fill='none' opacity='.55'/>";
    s += "<path d='" + lc + "' stroke='" + K.hL + "' stroke-width='1.9' stroke-linecap='round' fill='none' opacity='.8'/>";
    s += K.El(-22, T - o.vol * 0.25 + 4, 34, 20, K.soft(K.hL, 0.5)) + K.El(w - 2, -112, 22, 52, K.soft(K.hDD, 0.55)) + K.El(0, T + o.hy + 8, w * 0.8, 10, K.soft(K.hDD, 0.4));
    s += "</g>";
    return { fronte: s };
  }
  A.pezzo("capelli", "riccicorti", function (K) { return ricci(K, { s: 2, vol: 13, hy: 22, r: 5.5, n: 26, m: 90, seme: 17 }); });
  A.pezzo("capelli", "afrocorto", function (K) { return ricci(K, { s: 9, vol: 29, hy: 24, r: 7.5, n: 30, m: 120, seme: 29 }); });

  // ---------- pettinati all'indietro ----------
  A.pezzo("capelli", "indietro", function (K) {
    var T = K.top, w = K.F.cw + 3;
    var hlf = function (u, side) { return [w * 0.9 * u, T + 15 + (-106 - T - 15) * Math.pow(u, 2.6)]; };
    var F = forma(K, { vol: 18, hy: 15, hl: hlf, sb: -92, ib: 8, s: 2, bump: [0, 0, 4, 6, 4, 0, 0] });
    var L = [], i;
    for (i = 0; i < 9; i++) {
      var u = 0.05 + i * 0.1125, a = lungoAtt(F, u), b = lungoOut(F, 0.1 + (u) * 0.8), side = u - 0.5;
      L.push([[a[0], a[1] + 3, 11], [a[0] + (b[0] - a[0]) * 0.45, a[1] + (b[1] - a[1]) * 0.45 - 9, 15], [a[0] * 0.5 + b[0] * 0.5 + side * 8, (a[1] + b[1]) / 2 - 14, 13], [b[0] * 0.98, b[1] + 2, 2]]);
    }
    var s = chiudi(K, F, fascio(K, F, L, ["hg1", "hg2"]), { vol: 18 });
    // righe del pettine: sottili, ordinate verso la nuca
    var r = "", R = K.rnd(2);
    for (i = 0; i < 12; i++) { var a2 = lungoAtt(F, 0.05 + i * 0.081), b2 = lungoOut(F, 0.12 + i * 0.07); r += K.St("M" + K.n1(a2[0]) + " " + K.n1(a2[1]) + "Q" + K.n1((a2[0] + b2[0]) / 2) + " " + K.n1((a2[1] + b2[1]) / 2 - 12) + " " + K.n1(b2[0] * 0.97) + " " + K.n1(b2[1] + 2), i % 3 ? K.hL : K.hDD, 1, i % 3 ? 0.35 : 0.28); }
    s += "<g clip-path='" + K.clip(F.d) + "'>" + r + "</g>";
    return { fronte: s + basette(K, F.w - 2, -84) };
  });

  // ---------- calvo ----------
  A.pezzo("capelli", "calvo", function (K) {
    var T = K.top;
    // solo luce sulla testa (dentro il viso) e un velo di ombra a destra
    var f = "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(-16, T + 12, 26, 14, K.soft("#ffffff", 0.32)) + K.El(-12, T + 6, 10, 5, K.soft("#ffffff", 0.35)) + "</g>";
    return { fronte: f, ombraFronte: false };
  });

  // ---------- stempiato: fronte alta, capelli ai lati e un po' sopra ----------
  A.pezzo("capelli", "stempiato", function (K) {
    var T = K.top, w = K.F.cw + 3;
    // attaccatura a «M»: tempie rientrate, un ciuffetto a punta al centro
    var hlf = function (u, side) {
      var xs = [0, 0.3, 0.55, 0.8, 1], ys = [T + 30, T + 22, T + 14, T + 22, -100];
      var i = Math.round(u * 4); return [w * (0.12 + 0.81 * u), [T + 36, T + 28, T + 16, T + 30, -100][i]];
    };
    var F = forma(K, { vol: 10, hy: 36, hl: hlf, s: 2, ib: 9 });
    var L = [], i;
    for (i = 0; i < 7; i++) { var u = 0.08 + i * 0.14, a = lungoAtt(F, u), b = lungoOut(F, 0.1 + u * 0.8); L.push([[a[0], a[1] + 3, 10], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + 2, 12], [b[0], b[1] + 2, 2]]); }
    var s = chiudi(K, F, fascio(K, F, L), { vol: 10 });
    // fronte alta: luce sulla pelle e piccolo ciuffo centrale
    s += "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(-12, T + 36, 22, 9, K.soft("#ffffff", 0.18)) + "</g>";
    s += K.Pa(K.limb([[-4, T + 36, 6], [0, T + 40, 8], [4, T + 36, 6]], 0.2), K.U("hg2"), " opacity='.85'");
    return { fronte: s + basette(K, F.w - 2, -82), ombraFronte: false };
  });

  // ---------- chierica: fascia sottile di capelli corti ai lati del cranio (dalle tempie sopra le orecchie), cima calva ----------
  A.pezzo("capelli", "chierica", function (K) {
    var T = K.top, w = K.F.cw + 3, rx = w + 3, s = "", R = K.rnd(6);
    [-1, 1].forEach(function (sg) {
      var band = K.limb([[sg * (rx - 4), -80, 7], [sg * (rx - 1), -94, 10], [sg * (rx - 2), -110, 10], [sg * (rx - 8), -124, 8], [sg * (rx - 20), -134, 4]], 0.1);
      s += K.Pa(band, K.U(sg < 0 ? "hg1" : "hg3"));
      var tr = "";
      for (var i = 0; i < 14; i++) { var y = -82 - i * 3.6 - R() * 2, x = sg * (rx - 3 - R() * 4 - Math.max(0, (i - 8)) * 1.6); tr += "M" + K.n1(x) + " " + K.n1(y) + "l" + K.n1(sg * -2) + " " + K.n1(-3.5); }
      s += "<g clip-path='" + K.clip(band) + "'><path d='" + tr + "' stroke='" + K.hDD + "' stroke-width='1.1' stroke-linecap='round' opacity='.5'/>" + K.El(sg * (rx - 3), -104, sg < 0 ? 5 : 8, 26, K.soft(sg < 0 ? K.hL : K.hDD, 0.5)) + "</g>";
    });
    s += "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(-14, T + 10, 28, 15, K.soft("#ffffff", 0.34)) + K.El(0, T + 22, w * 0.55, 8, K.soft(K.hDD, 0.12)) + "</g>";
    return { fronte: s, ombraFronte: false };
  });

  // ---------- undercut: lati rasati netti, sopra lungo e riportato indietro ----------
  A.pezzo("capelli", "undercut", function (K) {
    var T = K.top, w = K.F.cw + 3;
    var hlf = function (u, side) { return [w * 0.86 * u, T + 20 + (-114 - T - 20) * Math.pow(u, 3.2)]; };
    var F = forma(K, { vol: 28, hy: 20, hl: hlf, sb: -116, ib: 10, s: 3, peak: -4, bump: [0, 2, 8, 10, 8, 2, 0] });
    var L = [], i;
    for (i = 0; i < 8; i++) {
      var u = 0.06 + i * 0.12, a = lungoAtt(F, u), b = lungoOut(F, 0.05 + u * 0.92);
      L.push([[a[0], a[1] + 4, 12], [a[0] + (b[0] - a[0]) * 0.4, a[1] + (b[1] - a[1]) * 0.4 - 14, 18], [a[0] * 0.4 + b[0] * 0.6, (a[1] + b[1]) / 2 - 18, 15], [b[0], b[1] + 2, 2]]);
    }
    var s = latiRasati(K, w, -116, -80, 0.55);
    s += chiudi(K, F, fascio(K, F, L), { vol: 28 });
    // bordo netto sopra la parte rasata: sporgenza ombra sotto la massa
    s += K.St("M" + K.n1(-(w + 2)) + " -116Q" + K.n1(-(w - 6)) + " -112 " + K.n1(-(w - 14)) + " -112", K.hDD, 1.6, 0.4) + K.St("M" + K.n1(w + 2) + " -116Q" + K.n1(w - 6) + " -112 " + K.n1(w - 14) + " -112", K.hDD, 1.6, 0.4);
    return { fronte: s };
  });

  /* FATTI: riga, ciuffo, spettinati, sfumato, rasato, riccicorti, indietro, calvo, stempiato, chierica, afrocorto, undercut
     (tutti e 12). Se uno non convince: riga/ciuffo -> «corti»; sfumato/undercut -> «ciuffo»; rasato -> «sfumato». */
})();


// ---- capelli-donna ----
// pezzi: capelli-donna — pettinature da donna dell'avatar «illustrato» (coordinate della testa: mento 0, cima del cranio -148)
(function () {
  "use strict";
  var A = window.SGOminoA; if (!A) return;

  // ---------- aiuti comuni ----------
  // una ciocca che scende da (x0,y0) a (x1,y1) con ondulazione (amp = ampiezza in px, n = mezze onde), larghezza da w0 a w1
  function ciocca(x0, y0, x1, y1, amp, n, w0, w1, fase) {
    var P = [[x0 + (x0 < 0 ? 4 : -4), y0 - 26, 6]], N = 14, dx = -(y1 - y0), dy = (x1 - x0), l = Math.hypot(dx, dy) || 1;
    for (var i = 0; i <= N; i++) {
      var t = i / N, o = Math.sin(t * Math.PI * n + (fase || 0)) * amp * Math.min(1, t * 3) * (1 - 0.25 * t);
      P.push([x0 + (x1 - x0) * t + dx / l * o, y0 + (y1 - y0) * t + dy / l * o, w0 + (w1 - w0) * Math.pow(t, 1.4)]);
    }
    return P;
  }
  // volume: ombra a destra, luce in alto a sinistra e un velo lucido, dentro la sagoma d
  function vol(K, d, lucido) {
    var s = "<g clip-path='" + K.clip(d) + "'>";
    s += K.El(66, -80, 36, 110, K.soft(K.hDD, 0.5)) + K.El(-30, -156, 46, 20, K.soft(K.hL, 0.5));
    if (lucido !== false) s += K.St("M-48 -130C-38 -156 -4 -166 26 -158", "#ffffff", 5, 0.13) + K.St("M-40 -120C-30 -144 -8 -154 12 -150", "#ffffff", 2, 0.12);
    return s + "</g>";
  }
  // ombra morbida di una massa sull'altra
  function ombra(K, d, col, op) { return "<g clip-path='" + K.clip(d) + "'>" + K.Pa(d, col || K.hDD, " opacity='" + (op || 0.3) + "'") + "</g>"; }
  function cerchio(x, y, r) { return "M" + (x - r) + " " + y + "a" + r + " " + r + " 0 1 0 " + 2 * r + " 0a" + r + " " + r + " 0 1 0 " + (-2 * r) + " 0Z"; }
  // ricci: mucchio di boccoli [x, y, raggio], ognuno con la sua luce e la sua ombra
  function ricci(K, list, seme) {
    var R = K.rnd(seme || 3), s = "", mid = K.mix(K.capelli, K.hL, 0.12), D = Math.PI / 180;
    list.slice().sort(function (a, b) { return a[1] - b[1] || a[0] - b[0]; }).forEach(function (c) {
      var x = c[0], y = c[1], r = c[2], a0 = (R() * 360) * D, sw = (250 + R() * 40) * D, rr = r * 0.56;
      s += K.Pa(cerchio(x, y, r), K.U("hg3"), " stroke='" + K.hDD + "' stroke-opacity='.55' stroke-width='1.2'");
      var p = function (a) { return K.n1(x + Math.cos(a) * rr) + " " + K.n1(y + Math.sin(a) * rr); };
      var arco = "M" + p(a0) + "A" + K.n1(rr) + " " + K.n1(rr) + " 0 1 1 " + p(a0 + sw);
      s += K.St(arco, mid, r * 0.5, 0.9);
      s += K.St("M" + K.n1(x - r * 0.55) + " " + K.n1(y - r * 0.2) + "A" + K.n1(rr) + " " + K.n1(rr) + " 0 0 1 " + K.n1(x + r * 0.15) + " " + K.n1(y - r * 0.6), K.hL, r * 0.16, 0.4);
      s += K.El(x + r * 0.3, y + r * 0.38, r * 0.62, r * 0.5, K.soft(K.hDD, 0.3));
    });
    return s;
  }
  // forma della calotta con la riga: «px» = dove cade la riga, «alto» = altezza della cima
  function calotta(px, alto, lat) {
    alto = alto == null ? -174 : alto; lat = lat || 0;
    return "M-57 -80C-" + (68 + lat) + " " + (alto + 44) + " -50 " + alto + " -6 " + alto + "C42 " + (alto - 4) + " " + (68 + lat) + " " + (alto + 34) + " 60 -84L56 -96C48 -118 " + (px + 40) + " -134 " + px + " -142C" + (px - 24) + " -128 -50 -112 -54 -92Z";
  }
  // capelli tirati indietro: attaccatura alta e liscia
  var TIRATA = "M-56 -84C-66 -128 -52 -160 -4 -164C44 -168 68 -136 58 -88L54 -94C49 -112 36 -126 12 -130C0 -131 -2 -131 -12 -130C-36 -124 -50 -108 -53 -92Z";
  function stridi(K, lati) {   // fili di capelli tirati indietro (dall'attaccatura verso la nuca)
    return K.ciocche([
      [[-50, -98, 9], [-50, -126, 13], [-36, -150, 14], [-12, -162, 8]],
      [[-40, -110, 8], [-34, -134, 12], [-16, -152, 12], [10, -160, 6]],
      [[-22, -124, 7], [-14, -142, 10], [8, -156, 10], [34, -156, 5]],
      [[8, -126, 7], [20, -142, 10], [40, -148, 9], [58, -128, 4]],
      [[34, -116, 8], [44, -132, 11], [56, -128, 8], [60, -100, 3]],
      [[52, -98, 8], [54, -118, 10], [50, -140, 6], [38, -154, 2]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
  }
  function ciuffiLati(K) {   // due ciocche libere davanti alle orecchie
    return K.Pa(K.limb([[-53, -98, 7], [-57, -76, 6], [-54, -52, 5], [-50, -36, 1.5]]), K.U("hg2")) + K.Pa(K.limb([[53, -98, 7], [58, -78, 6], [56, -54, 5], [52, -38, 1.5]]), K.U("hg2"));
  }
  function codaForma(K, N, col) {   // una coda: massa + ciocche dentro, a partire da una linea di nodi [x, y, larghezza]
    var d = K.limb(N, 0.4), s = K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>";
    var ci = [];
    for (var k = -1; k <= 1; k++) ci.push(N.map(function (q, i) { return [q[0] + k * q[2] * 0.26, q[1] + (i === N.length - 1 ? 0 : 0), q[2] * (k === 0 ? 0.42 : 0.34)]; }));
    s += K.ciocche(ci, ["hg1", "hg2", "hg1"]);
    s += K.El(N[0][0] + 46, N[Math.floor(N.length / 2)][1], 20, 80, K.soft(K.hDD, 0.4)) + "</g>";
    return s;
  }
  function laccio(K, x, y, ang, w) {   // elastico / fiocchetto (col colore della maglia)
    var c = K.maglia, r = "<g transform='translate(" + x + " " + y + ") rotate(" + ang + ")'>";
    r += K.Pa("M" + (-w) + " -5C" + (-w) + " -9 " + w + " -9 " + w + " -5L" + w + " 5C" + w + " 9 " + (-w) + " 9 " + (-w) + " 5Z", K.LG("lc" + x, 0, 0, 0, 1, [[0, K.chiaro(c, 0.25)], [1, K.scuro(c, 0.3)]]), " stroke='" + K.scuro(c, 0.5) + "' stroke-width='1.2'");
    r += K.St("M" + (-w + 3) + " -3L" + (w - 3) + " -3", "#ffffff", 1.6, 0.4);
    return r + "</g>";
  }

  // =========================================================
  //  MOSSI — medi, mossi, alle spalle
  // =========================================================
  A.pezzo("capelli", "mossi", function (K) {
    var back = "M-62 -92C-84 -44 -94 18 -88 60C-84 80 -76 90 -66 82C-54 92 -42 78 -28 86C-12 92 4 78 18 86C32 92 44 78 58 86C70 92 82 82 88 62C94 20 84 -44 62 -92C52 -150 -52 -150 -62 -92Z";
    var dietro = K.Pa(back, K.U("hg3")) + ombra(K, back, K.hDD, 0.28) + K.Pa("M-30 -10L30 -10L34 60C20 70 -20 70 -34 60Z", K.hDD, " opacity='.45'");
    var s = K.Pa(calotta(-10, -172, 0), K.U("hg3"));
    var Lw = ciocca(-62, -104, -74, 76, 8, 3.2, 24, 4, 0.2), Rw = ciocca(62, -104, 76, 74, 8, 3.2, 22, 4, 0.9);
    var Lw2 = ciocca(-56, -108, -60, 60, 7, 3.2, 20, 3, 1.4), Rw2 = ciocca(58, -108, 62, 56, 7, 3.2, 18, 3, 2.2);
    s += K.ciocche([
      Lw.slice(0).map(function (q, i) { return [q[0] - 4, q[1], q[2] + 3]; }),
      Lw2, Rw.map(function (q) { return [q[0] + 4, q[1], q[2] + 2]; }), Rw2,
      [[-12, -150, 8], [-32, -156, 16], [-50, -140, 20], [-60, -112, 22], [-62, -100, 18], [-58, -82, 4]],
      [[-8, -148, 8], [-24, -168, 14], [-48, -162, 18], [-64, -132, 20], [-68, -104, 16], [-64, -84, 3]],
      [[-12, -152, 8], [10, -156, 16], [36, -146, 20], [54, -124, 20], [60, -100, 12], [56, -84, 3]],
      [[0, -166, 8], [30, -166, 14], [56, -146, 18], [68, -118, 16], [70, -94, 10], [64, -78, 2]],
      [[-10, -144, 6], [-26, -140, 10], [-44, -118, 12], [-52, -94, 6]]
    ], ["hg2", "hg1", "hg2", "hg1", "hg1", "hg2", "hg1", "hg2", "hg1"]);
    s += vol(K, calotta(-10, -172, 0));
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  CODA — coda di cavallo, la coda si vede dietro, a lato del collo
  // =========================================================
  A.pezzo("capelli", "coda", function (K) {
    var N = [[44, -112, 24], [74, -112, 38], [94, -84, 40], [100, -36, 38], [96, 12, 34], [88, 52, 26], [90, 84, 14], [86, 100, 2]];
    var dietro = codaForma(K, N);
    dietro += laccio(K, 60, -112, 88, 18);
    var s = K.Pa(TIRATA, K.U("hg3")) + "<g clip-path='" + K.clip(TIRATA) + "'>" + stridi(K) + "</g>" + ciuffiLati(K) + vol(K, TIRATA);
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  CASCHETTO — bob al mento
  // =========================================================
  A.pezzo("capelli", "caschetto", function (K) {
    var back = "M-62 -92C-72 -50 -74 -8 -68 10C-54 16 -30 14 0 12C30 14 54 16 68 10C74 -8 72 -50 62 -92C52 -150 -52 -150 -62 -92Z";
    var dietro = K.Pa(back, K.U("hg3")) + ombra(K, back, K.hDD, 0.25) + K.Pa("M-34 -4C-20 14 20 14 34 -4L34 14L-34 14Z", K.hDD, " opacity='.45'");
    var cal = calotta(-14, -174, 0);
    var s = K.Pa(cal, K.U("hg3"));
    // le due tende che incorniciano il viso, con la punta in dentro
    var L = [[-58, -124, 12], [-60, -90, 20], [-62, -50, 24], [-58, -14, 22], [-50, 4, 14], [-40, 10, 3]];
    var Rr = [[58, -124, 12], [61, -90, 20], [64, -50, 24], [60, -14, 22], [52, 4, 14], [42, 10, 3]];
    var tL = K.limb(L), tR = K.limb(Rr);
    s += K.Pa(tL, K.U("hg2")) + K.Pa(tR, K.U("hg1"));
    s += K.ciocche([
      [[-14, -150, 8], [-34, -150, 16], [-50, -134, 20], [-58, -104, 20], [-62, -70, 20], [-60, -30, 16], [-52, 0, 7], [-44, 10, 2]],
      [[-10, -148, 8], [-28, -164, 14], [-50, -158, 18], [-64, -130, 18], [-68, -86, 20], [-68, -40, 18], [-62, -8, 11], [-54, 8, 3]],
      [[-12, -152, 8], [10, -158, 16], [34, -148, 20], [52, -124, 20], [60, -90, 18], [62, -50, 15], [56, -14, 9], [48, 6, 2]],
      [[2, -168, 8], [30, -168, 14], [56, -148, 18], [68, -116, 16], [70, -76, 16], [70, -34, 13], [64, -4, 7], [56, 8, 2]],
      [[-8, -146, 6], [-26, -140, 10], [-44, -120, 12], [-52, -94, 6]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1"]);
    s += vol(K, cal) + "<g clip-path='" + K.clip([tL, tR]) + "'>" + K.El(66, -40, 20, 70, K.soft(K.hDD, 0.45)) + K.El(-64, -70, 8, 50, K.soft(K.hL, 0.4)) + "</g>";
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  CHIGNON — raccolti in uno chignon alto
  // =========================================================
  A.pezzo("capelli", "chignon", function (K) {
    var dietro = "";
    var s = K.Pa(TIRATA, K.U("hg3")) + "<g clip-path='" + K.clip(TIRATA) + "'>" + stridi(K) + "</g>" + ciuffiLati(K) + vol(K, TIRATA);
    // lo chignon: un nodo di ciocche avvolte
    var bun = "M-30 -176C-30 -204 -8 -214 8 -212C28 -210 42 -194 38 -176C34 -158 12 -150 -8 -152C-24 -154 -30 -164 -30 -176Z";
    var b = K.Pa(bun, K.U("hg3")) + "<g clip-path='" + K.clip(bun) + "'>";
    b += K.ciocche([
      [[-28, -166, 8], [-26, -194, 14], [-4, -210, 14], [24, -206, 10], [38, -186, 4]],
      [[-24, -154, 8], [-30, -180, 14], [-16, -204, 14], [12, -212, 10], [34, -196, 4]],
      [[-10, -152, 8], [-18, -172, 12], [-6, -192, 12], [18, -198, 8], [36, -182, 3]],
      [[8, -152, 8], [0, -172, 12], [10, -190, 10], [28, -190, 6], [38, -176, 2]],
      [[26, -156, 8], [20, -172, 10], [26, -184, 8]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1"]);
    b += K.El(26, -176, 18, 30, K.soft(K.hDD, 0.5)) + K.El(-16, -200, 18, 10, K.soft(K.hL, 0.5)) + "</g>";
    b += K.St("M-30 -170C-24 -156 -6 -150 16 -154", K.hDD, 3, 0.35);
    // il bordo dove lo chignon si appoggia sulla testa
    s = b.replace(/^/, "") + s;
    // la base dello chignon sopra la testa (di nuovo davanti, per nascondere il bordo)
    s += K.Pa("M-24 -156C-12 -170 14 -170 28 -158C16 -148 -10 -148 -24 -156Z", K.U("hg1"), " opacity='.95'") + K.St("M-18 -158C-4 -164 14 -164 24 -158", K.hL, 2, 0.5);
    return { dietro: dietro, fronte: s };
  });

  // ---------- riccioli «illustrati»: massa unica dal contorno a riccioli piccoli, trama di «c» e «s», molle che scendono ----------
  function sub(p, passo) {   // infittisce un contorno chiuso
    var o = [];
    for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / passo)); for (var k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    return o;
  }
  function bumpy(K, pts, r, R) {   // contorno con piccoli riccioli verso fuori
    var P = sub(pts, r * 2.1), ar = 0, i, n1 = K.n1;
    for (i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; ar += a[0] * b[1] - b[0] * a[1]; }
    var sg = ar > 0 ? 1 : -1, d = "M" + n1(P[0][0]) + " " + n1(P[0][1]);
    for (i = 0; i < P.length; i++) {
      var p0 = P[i], p1 = P[(i + 1) % P.length], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, k = r * (0.8 + R() * 0.9);
      var nx = sg * dy / l, ny = -sg * dx / l;
      d += "Q" + n1((p0[0] + p1[0]) / 2 + nx * k * 1.3 + (R() - 0.5) * r * 0.5) + " " + n1((p0[1] + p1[1]) / 2 + ny * k * 1.3) + " " + n1(p1[0]) + " " + n1(p1[1]);
    }
    return d + "Z";
  }
  // trama di piccoli archi a «c» e «s» (a tratti) dentro la massa, con i riflessi corti chiari in alto a sinistra
  function trama(K, d, box, cnt, r, R, luce) {
    cnt = Math.round(cnt * 0.6);
    var n1 = K.n1, dk = "", lc = "", md = "", i;
    for (i = 0; i < cnt; i++) {
      var x = box[0] + R() * (box[2] - box[0]), y = box[1] + R() * (box[3] - box[1]), q = r * (0.55 + R() * 0.5), rot = R() * 6.28, cs = Math.cos(rot), sn = Math.sin(rot);
      var P = function (px, py) { return n1(x + px * cs - py * sn) + " " + n1(y + px * sn + py * cs); };
      dk += R() > 0.45 ? "M" + P(q, -q * 0.7) + "C" + P(-q * 0.4, -q * 1.1) + " " + P(-q * 1.1, q * 0.2) + " " + P(-q * 0.1, q * 0.9) : "M" + P(-q, -q * 0.4) + "C" + P(-q * 0.5, -q * 1.1) + " " + P(q * 0.1, -q * 0.3) + " " + P(0, 0) + "S" + P(q * 0.6, q * 1.1) + " " + P(q, q * 0.4);
      if (R() < (luce ? luce(x, y) : 0.2)) lc += "M" + n1(x - q * 0.5) + " " + n1(y - q * 0.9) + "q" + n1(q * 0.5) + " " + n1(-q * 0.4) + " " + n1(q * 1.0) + " " + n1(-q * 0.1);
      if (R() < 0.5) md += "M" + n1(x - q) + " " + n1(y + q * 0.4) + "c" + n1(q * 0.3) + " " + n1(-q * 1.1) + " " + n1(q * 1.5) + " " + n1(-q * 0.9) + " " + n1(q * 1.7) + " " + n1(q * 0.1);
    }
    return "<path d='" + dk + "' stroke='" + K.hDD + "' stroke-width='2' stroke-linecap='round' fill='none' opacity='.55'/><path d='" + md + "' stroke='" + K.capelli + "' stroke-width='2.2' stroke-linecap='round' fill='none' opacity='.5'/><path d='" + lc + "' stroke='" + K.hL + "' stroke-width='1.8' stroke-linecap='round' fill='none' opacity='.8'/>";
  }
  // una ciocca a molla che scende: ellissi sovrapposte (A = larghezza, passo = distanza fra le spire)
  function molla(K, x, y0, lung, A, passo, tipo) {
    var P = [], N = Math.round(lung / passo * 5), i;
    for (i = 0; i <= N; i++) { var t = i / N, th = t * lung / passo * 2 * Math.PI, a = A * (1 - 0.35 * t); P.push([x + a * Math.sin(th) + (tipo || 0) * t * 6, y0 + t * lung - a * 0.7 * Math.cos(th)]); }
    var d = K.liscio(P), w = A * 0.78;
    return K.St(d, K.hDD, w + 2.2, 0.6) + K.St(d, K.capelli, w, 0.95) + K.St(d, K.mix(K.capelli, K.hL, 0.4), w * 0.38, 0.8).replace("<path ", "<path transform='translate(-1.6 -1.8)' ") + K.St(d, K.hDD, 1.2, 0.5);
  }
  function massa(K, d, box, cnt, r, R, ombre) {   // massa riccia completa
    var s = K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>";
    s += K.El(60, -40, 50, 150, K.soft(K.hDD, 0.45)) + (ombre || "");
    s += trama(K, d, box, cnt, r, R, function (x, y) { return (x < 10 && y < -90) ? 0.75 : 0.18; });
    s += K.El(-26, -158, 40, 14, K.soft(K.hL, 0.3)) + "</g>";
    return s;
  }
  // =========================================================
  //  RICCI LUNGHI — massa voluminosa che scende oltre le spalle, ciocche a molla
  // =========================================================
  A.pezzo("capelli", "riccilunghi", function (K) {
    var R = K.rnd(41), i, y;
    var back = [[-62, -92], [-80, -44], [-94, 10], [-100, 70], [-98, 130], [-88, 172], [-60, 186], [-30, 176], [0, 184], [30, 176], [60, 186], [88, 172], [98, 130], [100, 70], [94, 10], [80, -44], [62, -92], [44, -152], [0, -162], [-44, -152]];
    var d1 = bumpy(K, back, 6.5, R);
    var dietro = massa(K, d1, [-100, -150, 100, 180], 190, 7, R, K.El(0, 60, 60, 120, K.soft(K.hDD, 0.4)));
    // contorno davanti: cima, due tende ai lati del viso, attaccatura a riccioli
    var fr = [[-56, -92], [-70, -140], [-40, -170], [0, -178], [42, -170], [72, -140], [58, -92], [64, -40], [86, 20], [100, 80], [98, 140], [90, 176], [64, 184], [54, 150], [52, 90], [46, 30], [48, -20], [54, -70], [52, -94], [46, -112], [30, -124], [10, -120], [-8, -126], [-30, -124], [-46, -112], [-52, -94], [-54, -70], [-48, -20], [-46, 30], [-52, 90], [-54, 150], [-64, 184], [-90, 176], [-98, 140], [-100, 80], [-86, 20], [-64, -40]];
    var d2 = bumpy(K, fr, 6, R);
    var s = massa(K, d2, [-100, -176, 100, 184], 330, 6.5, R);
    s += "<g clip-path='" + K.clip(d2) + "'>";
    // ciocche a molla che scendono sulle spalle
    for (i = 0; i < 6; i++) {
      var side = i < 3 ? -1 : 1, k = i % 3;
      s += molla(K, side * (62 + k * 14), -10 + k * 10, 170 - k * 14, 8.5, 25 + k * 2, side * 0.5);
    }
    s += molla(K, -46, 24, 150, 7, 24, 0) + molla(K, 46, 24, 150, 7, 24, 0);
    s += K.El(-30, -150, 40, 16, K.soft("#ffffff", 0.16)) + "</g>";
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  PIXIE — cortissimi da donna
  // =========================================================
  A.pezzo("capelli", "pixie", function (K) {
    var d = "M-58 -64C-70 -110 -54 -166 -6 -168C46 -170 70 -132 60 -70C58 -78 56 -84 54 -92C50 -108 34 -122 14 -126C0 -128 -26 -122 -40 -108C-48 -96 -52 -82 -58 -64Z";
    var s = K.Pa(d, K.U("hg3"));
    s += K.ciocche([
      [[-52, -76, 8], [-56, -110, 14], [-46, -146, 14], [-16, -164, 10], [14, -166, 2]],
      [[-44, -94, 10], [-44, -128, 14], [-26, -154, 14], [8, -166, 8], [40, -158, 2]],
      [[-30, -112, 12], [-20, -138, 14], [6, -154, 14], [36, -156, 8], [58, -140, 2]],
      [[-10, -122, 12], [4, -142, 14], [28, -152, 12], [52, -146, 8], [64, -118, 2]],
      [[34, -114, 10], [46, -128, 12], [58, -120, 8], [62, -92, 2]],
      [[-52, -90, 6], [-56, -70, 6], [-52, -58, 2]],
      [[52, -100, 7], [58, -84, 6], [56, -62, 2]]
    ], ["hg2", "hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
    s += vol(K, d);
    // ciuffo spostato di lato sulla fronte
    var fr = K.limb([[-34, -134, 8], [-8, -126, 18], [20, -114, 17], [42, -100, 9], [52, -92, 1.5]], 0.2);
    s += K.Pa(fr, K.U("hg2")) + "<g clip-path='" + K.clip(fr) + "'>" + K.ciocche([[[-26, -126, 6], [0, -122, 12], [26, -112, 10], [48, -94, 2]], [[-20, -132, 6], [6, -126, 10], [30, -114, 8], [50, -98, 2]]], ["hg1", "hg1"], false) + K.El(34, -96, 22, 12, K.soft(K.hDD, 0.5)) + "</g>";
    return { fronte: s };
  });

  // =========================================================
  //  CODINI — due codini ai lati
  // =========================================================
  A.pezzo("capelli", "codini", function (K) {
    var dietro = "";
    [-1, 1].forEach(function (l) {
      var N = [[l * 50, -108, 24], [l * 82, -104, 34], [l * 98, -70, 34], [l * 102, -24, 30], [l * 96, 24, 24], [l * 98, 62, 10], [l * 94, 78, 2]];
      dietro += codaForma(K, N);
      dietro += laccio(K, l * 66, -106, l * 78, 14);
    });
    var cal = "M-56 -84C-66 -128 -52 -160 -4 -164C44 -168 68 -136 58 -88L54 -94C48 -112 28 -124 0 -126C-28 -124 -48 -112 -53 -92Z";
    var s = K.Pa(cal, K.U("hg3")) + "<g clip-path='" + K.clip(cal) + "'>" + K.ciocche([
      [[0, -126, 8], [-26, -134, 14], [-46, -150, 14], [-52, -120, 6]],
      [[0, -126, 8], [-30, -146, 12], [-48, -138, 12], [-56, -100, 4]],
      [[0, -126, 8], [24, -138, 14], [44, -154, 14], [56, -122, 6]],
      [[0, -128, 8], [30, -150, 12], [50, -140, 10], [58, -100, 3]],
      [[0, -128, 6], [-8, -150, 12], [-2, -164, 8]],
      [[0, -128, 6], [10, -150, 12], [6, -166, 8]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg2", "hg1"]) + "</g>" + vol(K, cal);
    s += K.St("M0 -128L0 -164", K.hDD, 1.6, 0.5);
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  ONDE — lunghi a onde larghe
  // =========================================================
  A.pezzo("capelli", "onde", function (K) {
    var back = "M-60 -92C-84 -40 -96 30 -92 100C-90 132 -82 150 -72 158C-60 170 -48 156 -34 164C-14 172 6 158 22 166C38 172 50 158 64 166C76 160 90 140 94 110C98 40 84 -40 60 -92C50 -150 -50 -150 -60 -92Z";
    var dietro = K.Pa(back, K.U("hg3")) + ombra(K, back, K.hDD, 0.3) + K.Pa("M-34 10L34 10L40 130C20 150 -20 150 -40 130Z", K.hDD, " opacity='.4'");
    var cal = calotta(-6, -174, 0);
    var s = K.Pa(cal, K.U("hg3"));
    var Ls = [ciocca(-62, -104, -74, 164, 14, 4.4, 26, 3, 0.1), ciocca(-56, -108, -56, 150, 12, 4.4, 20, 3, 0.9), ciocca(-66, -96, -90, 150, 12, 4.4, 20, 3, 0.4)];
    var Rs = [ciocca(62, -104, 76, 164, 14, 4.4, 24, 3, 1.4), ciocca(58, -108, 58, 150, 12, 4.4, 18, 3, 2.2), ciocca(66, -96, 90, 150, 12, 4.4, 20, 3, 1.9)];
    s += K.ciocche(Ls.concat(Rs).concat([
      [[-6, -150, 8], [-30, -156, 16], [-50, -140, 20], [-60, -112, 22], [-62, -100, 18], [-58, -82, 4]],
      [[-4, -148, 8], [-22, -168, 14], [-48, -162, 18], [-64, -132, 20], [-68, -104, 16], [-64, -84, 3]],
      [[-6, -152, 8], [14, -158, 16], [38, -148, 20], [54, -126, 20], [60, -100, 12], [56, -84, 3]],
      [[2, -166, 8], [30, -168, 14], [56, -148, 18], [68, -118, 16], [70, -94, 10], [64, -78, 2]]
    ]), ["hg2", "hg1", "hg1", "hg2", "hg1", "hg1", "hg1", "hg2", "hg1", "hg2"]);
    s += vol(K, cal);
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  FRANGIA — medi con frangia dritta
  // =========================================================
  A.pezzo("capelli", "frangia", function (K) {
    var back = "M-62 -92C-82 -44 -88 8 -84 54C-80 70 -70 74 -58 70C-44 78 -30 70 -14 74C0 78 14 70 28 74C42 78 58 70 70 70C80 72 88 66 86 54C88 8 82 -44 62 -92C52 -150 -52 -150 -62 -92Z";
    var dietro = K.Pa(back, K.U("hg3")) + ombra(K, back, K.hDD, 0.3) + K.Pa("M-30 -6L30 -6L34 56C20 64 -20 64 -34 56Z", K.hDD, " opacity='.45'");
    // la frangia: dritta, appena curva, sopra le sopracciglia
    var fr = "M-60 -90C-70 -130 -52 -168 -4 -172C46 -174 70 -136 60 -90C56 -98 52 -100 48 -100C28 -96 -28 -96 -48 -100C-52 -100 -56 -98 -60 -90Z";
    var s = K.Pa(fr, K.U("hg3"));
    s += K.ciocche([
      [[-4, -168, 8], [-34, -160, 14], [-54, -132, 16], [-58, -104, 10]],
      [[4, -168, 8], [34, -160, 14], [54, -132, 16], [58, -104, 10]],
      [[-4, -150, 8], [-20, -142, 12], [-40, -124, 12], [-46, -100, 4]],
      [[6, -150, 8], [24, -142, 12], [42, -124, 12], [48, -100, 4]],
      [[0, -146, 6], [-6, -128, 8], [-8, -104, 3]],
      [[2, -146, 6], [10, -128, 8], [12, -102, 3]],
      [[-26, -140, 6], [-28, -120, 8], [-28, -102, 3]],
      [[26, -140, 6], [30, -120, 8], [30, -102, 3]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
    s += vol(K, fr);
    // le lunghezze sui lati, dritte, con la punta tagliata netta
    var L = K.limb([[-52, -104, 20], [-64, -70, 22], [-70, -20, 24], [-70, 20, 24], [-66, 62, 24], [-62, 72, 22]]);
    var Rr = K.limb([[52, -104, 20], [64, -70, 22], [70, -20, 24], [70, 20, 24], [68, 62, 24], [64, 72, 22]]);
    var sl = K.Pa(L, K.U("hg2")) + K.Pa(Rr, K.U("hg1"));
    sl += "<g clip-path='" + K.clip([L, Rr]) + "'>" + K.St("M-62 -60C-68 -10 -66 40 -64 70", K.hL, 3, 0.35) + K.St("M64 -60C70 -10 68 40 66 70", K.hL, 3, 0.25) + K.El(72, 10, 14, 80, K.soft(K.hDD, 0.45)) + "</g>";
    return { dietro: dietro, fronte: sl + s };
  });

  // =========================================================
  //  CODA ALTA — parte dall'alto della nuca, fa un arco e ricade dietro la testa fino alla spalla
  // =========================================================
  A.pezzo("capelli", "codaalta", function (K) {
    var cp = K.c.cappello && K.c.cappello !== "nessuno";
    var N = [[14, -150, 20], [40, -172, 28], [70, -166, 32], [92, -130, 34], [98, -86, 34], [98, -30, 30], [92, 20, 24], [90, 54, 12], [86, 72, 2]];
    if (cp) N = [[44, -100, 24], [70, -100, 36], [90, -76, 38], [96, -30, 36], [92, 14, 30], [86, 50, 22], [88, 76, 12], [84, 92, 2]];
    var dietro = codaForma(K, N);
    dietro += cp ? laccio(K, 58, -100, 88, 18) : laccio(K, 24, -166, 52, 18);
    var s = K.Pa(TIRATA, K.U("hg3")) + "<g clip-path='" + K.clip(TIRATA) + "'>" + stridi(K) + "</g>" + ciuffiLati(K) + vol(K, TIRATA);
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  RICCI RACCOLTI — ricci in alto, qualche ricciolo libero alle tempie
  // =========================================================
  A.pezzo("capelli", "ricciraccolti", function (K) {
    var R = K.rnd(57);
    var bun = [[-34, -186], [-24, -206], [0, -216], [26, -208], [40, -188], [36, -166], [16, -152], [-14, -152], [-32, -166]];
    var db = bumpy(K, bun, 5.5, R);
    var s = massa(K, db, [-40, -218, 44, -150], 70, 6, R);
    var cap = [[-56, -92], [-66, -128], [-48, -158], [-14, -170], [22, -170], [52, -154], [66, -126], [56, -92], [52, -108], [38, -120], [20, -126], [0, -124], [-20, -126], [-38, -120], [-52, -108]];
    var dc = bumpy(K, cap, 5.5, R);
    s += massa(K, dc, [-66, -172, 66, -92], 120, 6, R);
    // ricci liberi vicino alle tempie: molle corte
    [-1, 1].forEach(function (l) {
      s += molla(K, l * 57, -96, 50, 5, 15, l * 0.3) + molla(K, l * 52, -100, 34, 4, 13, 0);
    });
    return { fronte: s };
  });

  // =========================================================
  //  TRECCIA — treccia vera a spina di pesce, davanti alla spalla
  // =========================================================
  A.pezzo("capelli", "treccia", function (K) {
    var s = K.Pa(TIRATA, K.U("hg3")) + "<g clip-path='" + K.clip(TIRATA) + "'>" + stridi(K) + "</g>" + K.Pa(K.limb([[-53, -98, 7], [-57, -76, 6], [-54, -52, 5], [-50, -36, 1.5]]), K.U("hg2")) + vol(K, TIRATA);
    var dietro = K.Pa("M-60 -92C-70 -50 -66 -10 -54 10C-30 20 30 20 54 10C66 -10 70 -50 60 -92C50 -150 -50 -150 -60 -92Z", K.U("hg3")) + K.El(0, 6, 38, 14, K.soft(K.hDD, 0.7));
    // la curva della treccia: dalla nuca sull'orecchio, davanti alla spalla, giù sul petto
    var P0 = [60, -52], P1 = [98, 0], P2 = [48, 86], P3 = [66, 178];
    function bz(t) { var u = 1 - t; return [u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0], u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]]; }
    var wd = function (t) { return 30 - 17 * t; };
    // ombra e anima della treccia
    var core = [], i;
    for (i = 0; i <= 12; i++) { var tt = i / 12, c = bz(tt); core.push([c[0], c[1], wd(tt) * 0.92]); }
    var b = K.Pa(K.limb(core, 0.1), K.hDD, " opacity='.9'");
    var n = 22;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1) * 0.97, c0 = bz(t), c1 = bz(Math.min(1, t + 0.01)), ang = Math.atan2(c1[1] - c0[1], c1[0] - c0[0]) * 180 / Math.PI;
      var w = wd(t), side = i % 2 ? 1 : -1, ox = side * w * 0.2;
      var nx = -Math.sin(ang * Math.PI / 180), ny = Math.cos(ang * Math.PI / 180);
      var cx = c0[0] + nx * ox, cy = c0[1] + ny * ox, rot = ang + side * 52;
      b += "<g transform='translate(" + K.n1(cx) + " " + K.n1(cy) + ") rotate(" + K.n1(rot) + ")'>" +
        "<ellipse rx='" + K.n1(w * 0.72) + "' ry='" + K.n1(w * 0.3) + "' fill='" + K.U(i % 2 ? "hg1" : "hg2") + "' stroke='" + K.hDD + "' stroke-opacity='.6' stroke-width='1.2'/>" +
        "<ellipse cx='" + K.n1(w * 0.1) + "' cy='" + K.n1(w * 0.13) + "' rx='" + K.n1(w * 0.55) + "' ry='" + K.n1(w * 0.12) + "' fill='" + K.hDD + "' opacity='.28'/>" +
        "<path d='M" + K.n1(-w * 0.55) + " " + K.n1(-w * 0.08) + "Q0 " + K.n1(-w * 0.3) + " " + K.n1(w * 0.5) + " " + K.n1(-w * 0.08) + "' stroke='" + K.hL + "' stroke-width='1.8' stroke-linecap='round' fill='none' opacity='.65'/>" +
        "<path d='M" + K.n1(-w * 0.45) + " " + K.n1(w * 0.02) + "L" + K.n1(w * 0.4) + " " + K.n1(w * 0.02) + "' stroke='" + K.hDD + "' stroke-width='1' opacity='.35'/></g>";
    }
    var pe = bz(1);
    b += K.Pa(K.limb([[pe[0] - 6, pe[1] - 4, 3], [pe[0] - 1, pe[1] + 12, 16], [pe[0] + 5, pe[1] + 34, 11], [pe[0] + 3, pe[1] + 44, 2]], 0.3), K.U("hg2"), " stroke='" + K.hDD + "' stroke-opacity='.4' stroke-width='1'");
    b += K.St("M" + K.n1(pe[0] - 2) + " " + K.n1(pe[1] + 10) + "L" + K.n1(pe[0] + 2) + " " + K.n1(pe[1] + 38), K.hL, 1.6, 0.5);
    b += laccio(K, pe[0], pe[1] - 2, 0, 10);
    return { dietro: dietro, fronte: s + b };
  });
})();

/* PEZZI FATTI (capelli donna): mossi, coda, caschetto, chignon, riccilunghi, pixie, codini, onde, frangia, codaalta, ricciraccolti, treccia */


// ---- viso ----
// pezzi: viso — bocche, barbe e segni sul viso (avatar «illustrati», strada A)
(function () {
  "use strict";
  var A = window.SGOminoA; if (!A) return;
  var N = function (v) { return Math.round(v * 10) / 10; };
  var DENTE = "#f2eadb", DENTE_O = "#cdbfa5", INT = "#3a1417", LING = "#cb6670";
  var cnt = 0;
  function uid() { return "vb" + (cnt++); }
  function glo(K) { return K.rossetto && K.c.rossetto === "lucido" ? 0.6 : (K.m ? 0.22 : 0.45); }
  function filtro(K) { return K.St("M-4 -36C-4 -33 -3.5 -31 -3 -30", K.skDD, 1, 0.22) + K.St("M4 -36C4 -33 3.5 -31 3 -30", K.skDD, 1, 0.22); }
  function linea(K) { return K.mix(K.labbro, "#2a0c0a", 0.62); }
  // pieghe agli angoli della bocca (+ piega del sorriso sulla guancia)
  function angoli(K, w, yc, f, guancia) {
    var s = "";
    [1, -1].forEach(function (l) {
      s += K.St("M" + N(l * (w + 1)) + " " + N(yc - 0.6) + "C" + N(l * (w + 3)) + " " + N(yc - 2.4) + " " + N(l * (w + 4)) + " " + N(yc - 3.6) + " " + N(l * (w + 4.4)) + " " + N(yc - 4.6), K.skDD, 1.1, 0.5 * f);
      if (guancia) s += K.St("M" + N(l * (w + 8)) + " " + N(yc - 17) + "C" + N(l * (w + 11)) + " " + N(yc - 9) + " " + N(l * (w + 10)) + " " + N(yc - 3) + " " + N(l * (w + 7)) + " " + N(yc + 2), K.skD, 1.6, 0.25 * f);
    });
    return s;
  }
  function gradV(K, st) { return K.LG(uid(), 0, 0, 0, 1, st); }

  // ---------- bocca chiusa: yc = altezza degli angoli, ym = linea al centro, tU/tL = spessore dei labbri ----------
  function chiusa(K, o) {
    var lip = K.labbro, w = o.w, yc = o.yc, ym = o.ym, tU = o.tU || 4.6, tL = o.tL || 7, dk = K.mix(lip, "#000000", 0.12), ln = linea(K);
    var cu = 2 * ym - yc, ty = ym - tU, pk = ty - 1.8, c1 = yc + (pk - yc) * 0.7, c1x = N(w * 0.56);
    var yL = yc + 1.4, cuL = cu + 0.9, yb = ym + tL, cy = (yb - 0.25 * yL) / 0.75, wl = w - 1.5, cxl = N(wl * 0.65);
    var s = K.El(0, yb + 3, w * 0.62, 2.8, K.soft(K.skDD, 0.3));
    s += K.Pa("M-" + N(wl) + " " + N(yL) + "Q0 " + N(cuL) + " " + N(wl) + " " + N(yL) + "C" + cxl + " " + N(cy) + " -" + cxl + " " + N(cy) + " -" + N(wl) + " " + N(yL) + "Z",
      gradV(K, [[0, K.mix(lip, dk, 0.2)], [0.5, lip], [1, K.mix(lip, "#ffffff", 0.07)]]));
    s += K.El(0, yb - 1.2, wl * 0.5, 1.8, K.soft(dk, 0.5));
    s += K.El(-1, ym + tL * 0.42, wl * 0.3, 1.2, "#ffffff", " opacity='" + (o.gloss || glo(K)) + "'");
    if (o.mid) s += o.mid;
    s += K.Pa("M-" + N(w) + " " + N(yc) + "C-" + c1x + " " + N(c1) + " -4.5 " + N(pk) + " 0 " + N(ty) + "C4.5 " + N(pk) + " " + c1x + " " + N(c1) + " " + N(w) + " " + N(yc) + "Q0 " + N(cu) + " -" + N(w) + " " + N(yc) + "Z", dk);
    s += K.El(0, ym - tU * 0.55, w * 0.38, 1, "#ffffff", " opacity='.1'");
    s += K.St("M-" + N(w + 0.6) + " " + N(yc - 0.4) + "Q0 " + N(cu) + " " + N(w + 0.6) + " " + N(yc - 0.4), ln, 1.2);
    if (o.post) s += o.post;
    return s;
  }

  // ---------- bocca aperta: yu/yl = bordo di sopra e di sotto al centro; denti "sopra" | "tutti" ----------
  function aperta(K, o) {
    var lip = K.labbro, w = o.w, yc = o.yc, yu = o.yu, yl = o.yl, tU = o.tU || 3.8, tL = o.tL || 5.8, dk = K.mix(lip, "#000000", 0.12), ln = linea(K);
    var cu = 2 * yu - yc, cl = 2 * yl - yc;
    function eu(x) { return yc + (1 - (x / w) * (x / w)) / 2 * (cu - yc); }
    function el(x) { return yc + (1 - (x / w) * (x / w)) / 2 * (cl - yc); }
    var inter = "M-" + N(w) + " " + N(yc) + "Q0 " + N(cu) + " " + N(w) + " " + N(yc) + "Q0 " + N(cl) + " -" + N(w) + " " + N(yc) + "Z";
    var s = K.El(0, yl + tL + 2.6, w * 0.6, 2.8, K.soft(K.skDD, 0.3));
    var inn = Pa0(K, inter, INT);
    // denti
    var hS = o.hS || 5, hI = o.hI || 3.6, xs = [], i, x, pt, pb;
    for (i = -10; i <= 10; i++) xs.push(i / 10 * (w - 2.2));
    var td = "";
    if (o.lingua) td += K.El(0, yl - 0.4, w * 0.58, Math.max(2.6, (yl - yu) * 0.5), gradV(K, [[0, K.mix(LING, "#ffffff", 0.12)], [1, K.mix(LING, "#4a1018", 0.35)]])) +
      K.St("M0 " + N(yl - (yl - yu) * 0.55) + "L0 " + N(yl + 0.5), K.mix(LING, "#4a1018", 0.45), 0.8, 0.5);
    if (o.denti) {
      pt = xs.map(function (q) { return [q, eu(q) - 1.6]; }); pb = xs.map(function (q) { return [q, eu(q) + hS * (1 - 0.14 * (q / w) * (q / w))]; }).reverse();
      var pg = pt.concat(pb);
      td += K.Pa(pol(pg), gradV(K, [[0, DENTE_O], [0.22, DENTE], [1, K.mix(DENTE, "#ffffff", 0.3)]]));
      td += K.Pa(pol(pg), K.LG(uid(), 0, 0, 1, 0, [[0, INT, 0.42], [0.2, INT, 0], [0.8, INT, 0], [1, INT, 0.42]]));
      var tw = (2 * w - 4.4) / 6;
      for (i = 1; i < 6; i++) { x = -w + 2.2 + tw * i; td += K.St("M" + N(x) + " " + N(eu(x)) + "L" + N(x) + " " + N(eu(x) + hS * (1 - 0.14 * (x / w) * (x / w))), DENTE_O, 0.6, 0.8); }
      if (o.denti === "tutti") {
        var qt = xs.slice(1, -1).map(function (q) { return [q, el(q) - hI * (1 - 0.18 * (q / w) * (q / w))]; }), qb = xs.slice(1, -1).map(function (q) { return [q, el(q) + 2]; }).reverse();
        var pg2 = qt.concat(qb);
        td += K.Pa(pol(pg2), gradV(K, [[0, DENTE_O], [0.5, K.mix(DENTE, DENTE_O, 0.4)], [1, DENTE_O]]));
        td += K.Pa(pol(pg2), K.LG(uid(), 0, 0, 1, 0, [[0, INT, 0.65], [0.25, INT, 0], [0.75, INT, 0], [1, INT, 0.65]]));
        var tw2 = (2 * (w - 3.2)) / 6;
        for (i = 1; i < 6; i++) { x = -w + 3.2 + tw2 * i; td += K.St("M" + N(x) + " " + N(el(x) - hI) + "L" + N(x) + " " + N(el(x) + 1), DENTE_O, 0.5, 0.7); }
      }
      if (o.inInt) td += o.inInt(eu, el);
    }
    s += "<g clip-path='" + K.clip(inter) + "'>" + inn + td + K.El(0, yu + 0.8, w * 0.85, 2.6, K.soft("#000000", 0.5)) + "</g>";
    // labbro inferiore
    var cy = (yl + tL - 0.25 * yc) / 0.75, cxl = N(w * 0.66);
    s += K.Pa("M-" + N(w) + " " + N(yc) + "Q0 " + N(cl) + " " + N(w) + " " + N(yc) + "C" + cxl + " " + N(cy) + " -" + cxl + " " + N(cy) + " -" + N(w) + " " + N(yc) + "Z",
      gradV(K, [[0, K.mix(lip, dk, 0.25)], [0.5, lip], [1, K.mix(lip, "#ffffff", 0.07)]]));
    s += K.St("M-" + N(w) + " " + N(yc) + "Q0 " + N(cl) + " " + N(w) + " " + N(yc), ln, 0.9, 0.55);
    s += K.El(-1, yl + tL * 0.4, w * 0.26, 1.2, "#ffffff", " opacity='" + glo(K) + "'");
    if (o.mid) s += o.mid;
    // labbro superiore
    var ty = yu - tU, pk = ty - 1.8, c1 = yc + (pk - yc) * 0.7, c1x = N(w * 0.56);
    s += K.Pa("M-" + N(w) + " " + N(yc) + "C-" + c1x + " " + N(c1) + " -4.5 " + N(pk) + " 0 " + N(ty) + "C4.5 " + N(pk) + " " + c1x + " " + N(c1) + " " + N(w) + " " + N(yc) + "Q0 " + N(cu) + " -" + N(w) + " " + N(yc) + "Z", dk);
    s += K.St("M-" + N(w) + " " + N(yc) + "Q0 " + N(cu) + " " + N(w) + " " + N(yc), ln, 1, 0.6);
    s += K.El(0, ty + 1.2, w * 0.36, 0.9, "#ffffff", " opacity='.1'");
    s += K.El(-w, yc, 1.5, 1.1, K.mix(lip, "#2a0c0a", 0.6), " opacity='.5'") + K.El(w, yc, 1.5, 1.1, K.mix(lip, "#2a0c0a", 0.6), " opacity='.5'");
    if (o.post) s += o.post;
    return s;
  }
  function Pa0(K, d, f) { return K.Pa(d, f); }
  function pol(p) { return "M" + p.map(function (q) { return N(q[0]) + " " + N(q[1]); }).join("L") + "Z"; }
  // gruppo inclinato: un angolo della bocca più alto dell'altro
  function storta(s, k) { return "<g transform='matrix(1 " + k + " 0 1 0 0)'>" + s + "</g>"; }

  // ======================= BOCCHE =======================
  A.pezzo("bocca", "sorrisone", function (K) {
    var w = K.m ? 17.5 : 17;
    return filtro(K) + K.El(0, -10, 10, 2.6, K.soft(K.skDD, 0.3)) + angoli(K, w, -28, 1, true) +
      aperta(K, { w: w, yc: -28, yu: -27.2, yl: -17.2, denti: "tutti", hS: 5.6, hI: 2.4, tU: 3.8, tL: 5.2 });
  });
  A.pezzo("bocca", "sorrisetto", function (K) {
    var w = K.m ? 15 : 14.5, s = filtro(K);
    s += storta(chiusa(K, { w: w, yc: -25.4, ym: -23.4, tU: 4.4, tL: 7 }), -0.15);
    s += K.St("M" + N(w + 9) + " -48C" + N(w + 12) + " -40 " + N(w + 11) + " -33 " + N(w + 8) + " -29", K.skD, 1.6, 0.25);
    s += K.St("M" + N(w + 1.2) + " -28.4C" + N(w + 3) + " -30.4 " + N(w + 4) + " -31.4 " + N(w + 4.4) + " -32.4", K.skDD, 1.1, 0.5);
    return s;
  });
  A.pezzo("bocca", "ghigno", function (K) {
    var w = K.m ? 16 : 15.5;
    return filtro(K) + K.St("M" + N(w + 10) + " -46C" + N(w + 13) + " -37 " + N(w + 11) + " -31 " + N(w + 8) + " -28", K.skD, 1.6, 0.25) +
      storta(aperta(K, { w: w, yc: -25.4, yu: -25, yl: -21.4, denti: "sopra", hS: 3.4, tU: 4, tL: 6.4 }), -0.16);
  });
  A.pezzo("bocca", "risata", function (K) {
    var w = K.m ? 18.5 : 18;
    return filtro(K) + angoli(K, w, -29.4, 1.1, true) + K.El(0, -6.4, 10, 2.4, K.soft(K.skDD, 0.3)) +
      aperta(K, { w: w, yc: -29.4, yu: -28.2, yl: -13.2, denti: "tutti", hS: 6.4, hI: 3.4, lingua: true, tU: 3.8, tL: 5 });
  });
  A.pezzo("bocca", "labbra", function (K) {
    var w = K.m ? 14.2 : 14, lip = K.labbro;
    return filtro(K) + chiusa(K, { w: w, yc: -24.6, ym: -24.2, tU: 5.8, tL: 9, gloss: Math.min(0.9, glo(K) + 0.2) });
  });
  A.pezzo("bocca", "o", function (K) {
    var lip = K.labbro, dk = K.mix(lip, "#000000", 0.14), s = filtro(K);
    s += K.El(0, -9, 8, 2.4, K.soft(K.skDD, 0.32));
    var og = gradV(K, [[0, dk], [0.45, lip], [1, K.mix(lip, "#ffffff", 0.07)]]);
    s += K.El(0, -21, 8.6, 10, og);
    for (var i = 0; i < 9; i++) { var a = -Math.PI * 0.1 + i / 8 * Math.PI * 1.2 - Math.PI * 0.1 + Math.PI; s += K.St("M" + N(Math.cos(a) * 6.6) + " " + N(-21 + Math.sin(a) * 8) + "L" + N(Math.cos(a) * 8) + " " + N(-21 + Math.sin(a) * 9.4), K.mix(lip, "#2a0c0a", 0.5), 0.5, 0.2); }
    var inner = "M-4.6 -21C-4.6 -26.4 4.6 -26.4 4.6 -21C4.6 -15.6 -4.6 -15.6 -4.6 -21Z";
    s += K.Pa(inner, INT);
    s += "<g clip-path='" + K.clip(inner) + "'>" + K.Pa("M-3.6 -25.6C-1.5 -26.8 1.5 -26.8 3.6 -25.6L3.2 -22.8C1 -23.4 -1 -23.4 -3.2 -22.8Z", DENTE) +
      K.El(0, -17.6, 3.2, 2.2, K.mix(LING, "#4a1018", 0.25)) + K.El(0, -25, 5, 2.4, K.soft("#000000", 0.5)) + "</g>";
    s += K.St(inner, linea(K), 0.9, 0.6);
    s += K.El(-2.4, -14.2, 3, 1.2, "#ffffff", " opacity='" + glo(K) + "'");
    return s;
  });
  A.pezzo("bocca", "triste", function (K) {
    var w = K.m ? 13.8 : 13.4, s = filtro(K);
    s += K.El(0, -8.4, 6.4, 3.2, K.soft(K.skDD, 0.34));
    s += chiusa(K, { w: w, yc: -21.4, ym: -25.8, tU: 3.6, tL: 6.8 });
    [1, -1].forEach(function (l) { s += K.St("M" + N(l * (w + 0.8)) + " -21.8C" + N(l * (w + 2.4)) + " -20 " + N(l * (w + 3.2)) + " -17.4 " + N(l * (w + 3.4)) + " -15", K.skDD, 1, 0.38); });
    return s;
  });
  A.pezzo("bocca", "smorfia", function (K) {
    var w = K.m ? 16.6 : 16.2;
    return filtro(K) + angoli(K, w, -24.4, 0.8, false) +
      aperta(K, { w: w, yc: -24.4, yu: -25.8, yl: -18.6, denti: "tutti", hS: 4.4, hI: 3.6, tU: 3.2, tL: 4.2 });
  });
  A.pezzo("bocca", "baciotto", function (K) {
    var lip = K.labbro, s = filtro(K), w = 7.4;
    s += chiusa(K, { w: w, yc: -23.6, ym: -23.4, tU: 4.8, tL: 7.4, gloss: Math.min(0.9, glo(K) + 0.15) });
    [-1, 1].forEach(function (l) { for (var i = 0; i < 3; i++) s += K.St("M" + N(l * (w + 1.2)) + " " + N(-25.4 + i * 2.6) + "L" + N(l * (w + 3.8 + (i === 1 ? 0.6 : 0))) + " " + N(-26.2 + i * 3.4), K.skDD, 0.9, 0.3); });
    return s;
  });
  A.pezzo("bocca", "linguaccia", function (K) {
    var w = K.m ? 15.6 : 15.2, tg = "M-6.6 -21.6C-7.8 -13 -6.4 -7.2 0 -6C6.4 -7.2 7.8 -13 6.6 -21.6Z";
    var post = K.El(0, -3.8, 6, 1.8, K.soft(K.skDD, 0.35)) + K.Pa(tg, gradV(K, [[0, K.mix(LING, "#ffffff", 0.12)], [0.7, LING], [1, K.mix(LING, "#4a1018", 0.3)]])) +
      K.St("M0 -20.6C0.4 -15 0.2 -11 0 -8.4", K.mix(LING, "#4a1018", 0.45), 1, 0.55) + K.El(-2.4, -13.4, 1.5, 3.6, "#ffffff", " opacity='.2'") +
      K.El(0, -20.6, 7, 1.7, K.soft("#000000", 0.4));
    return filtro(K) + angoli(K, w, -26.6, 0.9, true) + aperta(K, { w: w, yc: -26.6, yu: -26.1, yl: -21.2, denti: "sopra", hS: 4.2, tU: 3.8, tL: 5, post: post });
  });
  A.pezzo("bocca", "micio", function (K) {
    var lip = K.labbro, dk = K.mix(lip, "#000000", 0.12), ln = linea(K), s = filtro(K);
    var W = "M-13 -27C-11.6 -23 -8.6 -21.6 -6 -21.8C-3 -22 -1 -24.6 0 -27.4C1 -24.6 3 -22 6 -21.8C8.6 -21.6 11.6 -23 13 -27";
    s += K.El(0, -12.6, 9, 2.4, K.soft(K.skDD, 0.3));
    s += K.Pa(W + "C11.4 -15.4 -11.4 -15.4 -13 -27Z", gradV(K, [[0, K.mix(lip, dk, 0.2)], [0.5, lip], [1, K.mix(lip, "#ffffff", 0.07)]]));
    s += K.El(-5.6, -18.8, 3, 1.1, "#ffffff", " opacity='" + glo(K) + "'") + K.El(5.6, -18.8, 3, 1.1, "#ffffff", " opacity='" + glo(K) * 0.8 + "'");
    s += K.Pa("M-13.4 -27.4C-10.4 -30.6 -4.2 -31.8 0 -30.2C4.2 -31.8 10.4 -30.6 13.4 -27.4C11.6 -23 8.6 -21.6 6 -21.8C3 -22 1 -24.6 0 -27.4C-1 -24.6 -3 -22 -6 -21.8C-8.6 -21.6 -11.6 -23 -13.4 -27.4Z", dk);
    s += K.St(W, ln, 1.2);
    s += K.St("M-14.2 -27.2C-15.2 -28.2 -15.8 -29 -16 -30", K.skDD, 1, 0.45) + K.St("M14.2 -27.2C15.2 -28.2 15.8 -29 16 -30", K.skDD, 1, 0.45);
    return s;
  });
  A.pezzo("bocca", "dentoni", function (K) {
    var w = 13.4, ym = -23.6, s = filtro(K);
    var dente = function (x0, x1) {
      return K.Pa("M" + x0 + " " + (ym - 2) + "L" + x1 + " " + (ym - 2) + "L" + x1 + " " + N(ym + 7.2) + "Q" + x1 + " " + N(ym + 9.6) + " " + N((x0 + x1) / 2 + (x1 > x0 ? 0.8 : -0.8)) + " " + N(ym + 9.8) + "Q" + x0 + " " + N(ym + 9.6) + " " + x0 + " " + N(ym + 7.2) + "Z", gradV(K, [[0, DENTE_O], [0.3, DENTE], [1, K.mix(DENTE, DENTE_O, 0.35)]]));
    };
    var mid = K.El(0, ym + 10.4, 6.4, 1.8, K.soft(K.mix(K.labbro, "#000000", 0.4), 0.5)) + dente(-5.5, 0) + dente(0, 5.5) +
      K.St("M0 " + (ym - 1) + "L0 " + N(ym + 9.6), DENTE_O, 0.7, 0.9) + K.St("M-5.5 " + N(ym + 2) + "L-5.5 " + N(ym + 8), K.mix(DENTE_O, "#3a1417", 0.2), 0.6, 0.5);
    return s + chiusa(K, { w: w, yc: -26, ym: ym, tU: 4.2, tL: 7.4, mid: mid });
  });
  A.pezzo("bocca", "canini", function (K) {
    var w = K.m ? 15.6 : 15.2, yc = -26.6, yu = -26.2, yl = -21.8;
    var fangs = "", fg = gradV(K, [[0, DENTE_O], [0.4, DENTE], [1, K.mix(DENTE, DENTE_O, 0.4)]]);
    [-1, 1].forEach(function (l) {
      var x = l * 8.4;
      fangs += K.Pa("M" + N(x - 2.1) + " " + (yu - 1) + "L" + N(x + 2.1) + " " + (yu - 1) + "L" + N(x + 2) + " " + N(yu + 4) + "Q" + N(x + 1) + " " + N(yu + 7) + " " + N(x + l * 0.2) + " " + N(yu + 8.6) + "Q" + N(x - 1.4) + " " + N(yu + 6.4) + " " + N(x - 2) + " " + N(yu + 4) + "Z", fg) +
        K.St("M" + N(x - 1) + " " + N(yu + 2) + "L" + N(x - 0.8) + " " + N(yu + 5.4), "#ffffff", 0.6, 0.5);
    });
    return filtro(K) + angoli(K, w, yc, 0.8, true) + aperta(K, { w: w, yc: yc, yu: yu, yl: yl, denti: "sopra", hS: 3.2, tU: 3.8, tL: 5.2, mid: fangs });
  });
  A.pezzo("bocca", "apparecchio", function (K) {
    var w = K.m ? 17 : 16.6, yc = -27.6, yu = -27.1, hS = 5.8;
    function eu(x) { return yc + (1 - (x / w) * (x / w)) / 2 * (2 * yu - yc - yc); }
    var tw = (2 * w - 4.4) / 6, met = "", fil = "", i, x, pts = [];
    var mg = K.LG(uid(), 0, 0, 1, 1, [[0, "#f4f7fa"], [0.5, "#aab4be"], [1, "#6d7882"]]);
    for (i = 0; i < 6; i++) { x = -w + 2.2 + tw * (i + 0.5); pts.push([x, eu(x) + hS * 0.5]); }
    fil = K.St("M" + pts.map(function (q) { return N(q[0]) + " " + N(q[1]); }).join("L"), "#8e99a4", 0.7, 0.95);
    pts.forEach(function (q) { met += K.Pa("M" + N(q[0] - 1.35) + " " + N(q[1] - 1.2) + "h2.7v2.4h-2.7Z", mg) + K.El(q[0] - 0.4, q[1] - 0.5, 0.5, 0.4, "#ffffff", " opacity='.8'"); });
    return filtro(K) + angoli(K, w, yc, 1, true) +
      aperta(K, { w: w, yc: yc, yu: yu, yl: -19.4, denti: "tutti", hS: hS, hI: 3, tU: 3.8, tL: 5.4, inInt: function () { return fil + met; } });
  });
  A.pezzo("bocca", "mordilabbro", function (K) {
    var w = 13.6, ym = -23.4, s = filtro(K), lip = K.labbro, dk = K.mix(lip, "#000000", 0.12);
    var plate = "M-6.2 " + (ym - 1.6) + "L6.2 " + (ym - 1.6) + "L6 " + N(ym + 2.6) + "Q5.6 " + N(ym + 4.6) + " 3.4 " + N(ym + 4.7) + "L-3.4 " + N(ym + 4.7) + "Q-5.6 " + N(ym + 4.6) + " -6 " + N(ym + 2.6) + "Z";
    var mid = K.Pa(plate, gradV(K, [[0, DENTE_O], [0.35, DENTE], [1, K.mix(DENTE, DENTE_O, 0.4)]])) + K.St("M0 " + (ym - 1) + "L0 " + N(ym + 4.4), DENTE_O, 0.6, 0.8) +
      K.El(0, ym + 5.6, 6.2, 1.5, K.soft(K.mix(lip, "#000000", 0.4), 0.5));
    var post = K.El(-1, ym + 8.6, 5, 1.2, "#ffffff", " opacity='" + (glo(K) + 0.1) + "'");
    return s + chiusa(K, { w: w, yc: -25.8, ym: ym, tU: 4.2, tL: 7.4, mid: mid, post: post, gloss: 0.01 });
  });
  A.pezzo("bocca", "nervoso", function (K) {
    var lip = K.labbro, dk = K.mix(lip, "#000000", 0.12), ln = linea(K), s = filtro(K);
    var W = "M-14 -23.4C-11.2 -26.6 -9.2 -21 -6.6 -24.2C-4.2 -27.4 -2 -21.4 0.4 -24.6C3 -27.8 5 -21.6 7.6 -24.4C10 -27 11.6 -22.4 14 -23.6";
    s += K.El(0, -14.4, 10, 2.4, K.soft(K.skDD, 0.3));
    s += K.St(W, dk, 6.2, 1) + K.St(W, lip, 4.4, 1);
    s += K.St("M-12 -21.2C-8 -19.4 -4 -19.2 0 -19.4C4 -19.2 8 -19.4 12 -21.2", K.mix(lip, "#ffffff", 0.1), 1, 0.55);
    s += K.St(W, ln, 1.1);
    s += K.El(-1, -20.4, 4.6, 0.9, "#ffffff", " opacity='" + glo(K) + "'");
    return s;
  });

  // ======================= BARBE =======================
  function bez(p, t) { var u = 1 - t; return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]]; }
  // punti del contorno del viso (lato destro) da u0 (orecchio) a 1 (mento), con la normale verso fuori
  function jaw(K, M, u0) {
    var F = K.F, S1 = [[F.cw, -78], [F.cw, -56], [F.cw - 2, -40], [F.jx, F.jy]], S2 = [[F.jx, F.jy], [F.jx - 10 + F.k1 * 1.5, F.jy + 14 + F.k1], [F.cx, 0], [0, 0]], out = [], i;
    for (i = 0; i <= M; i++) {
      var u = u0 + (1 - u0) * i / M, S = u < 0.5 ? S1 : S2, t = u < 0.5 ? u * 2 : u * 2 - 1, a = bez(S, Math.max(0, t - 0.015)), b = bez(S, Math.min(1, t + 0.015)), p = bez(S, t), dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      out.push({ x: p[0], y: p[1], nx: dy / l, ny: -dx / l, u: u });
    }
    return out;
  }
  // una massa di barba: o.th(u) spessore fuori dal viso (negativo = dentro), o.top = linea alta (centro → orecchio), o.drop(u), o.tx(u)
  function massaD(K, o) {
    var J = jaw(K, 14, o.u0 == null ? 0.06 : o.u0), R = [], L = [], i;
    J.forEach(function (q, k) {
      var th = o.th(q.u), x = (q.x + q.nx * th) * (o.tx ? o.tx(q.u) : 1), y = q.y + q.ny * th + (o.drop ? o.drop(q.u) : 0) + (o.dropX ? o.dropX(q.x) : 0);
      R.push([x, y]); if (k < J.length - 1) L.push([-x, y]);
    });
    L.reverse();
    var T = o.top, topR = T.slice(1), topL = T.slice().reverse().map(function (q) { return [-q[0], q[1]]; });
    return K.lisciaChiusa(R.concat(L).concat(topL).concat(topR));
  }
  // banda lungo la mascella
  function bandaD(K, o) {
    var J = jaw(K, 12, o.u0), oR = [], iR = [], oL = [], iL = [];
    J.forEach(function (q) {
      var a = q.x + q.nx * o.fuori, b = q.y + q.ny * o.fuori, s = (q.u - o.u0) / (1 - o.u0), w = o.w0 + (o.w1 - o.w0) * s;
      var ix = q.x - q.nx * w, iy = q.y - q.ny * w;
      oR.push([a, b]); iR.push([ix, iy]); oL.push([-a, b]); iL.push([-ix, iy]);
    });
    return K.lisciaChiusa(oR.concat(oL.slice(0, -1).reverse()).concat(iL.slice(0, -1)).concat(iR.slice().reverse().slice(0)));
  }
  // peli: tratti brevi, per la maggior parte verso il basso (nei baffi verso fuori)
  function fili(K, seed, n, o) {
    var R = K.rnd(seed), P = ["", "", ""], i;
    for (i = 0; i < n; i++) {
      var x = (R() * 2 - 1) * (o.xr || 72), y = o.y0 + R() * (o.y1 - o.y0), c = R() < 0.4 ? 0 : (R() < 0.6 ? 1 : 2), dirx, len = 5 + R() * 6;
      if (y > -40 && y < -26 && Math.abs(x) < 28) { dirx = (x < 0 ? -1 : 1) * 0.6; len = 4 + R() * 4; }
      else dirx = (x < 0 ? 1 : -1) * 0.32 * Math.min(1, Math.abs(x) / 30) + (R() - 0.5) * 0.5;
      var dx = dirx * len * 0.6, dy = len, cx = dx * 0.3 + (R() - 0.5) * 2, cy = dy * 0.5;
      P[c] += "M" + N(x) + " " + N(y) + "q" + N(cx) + " " + N(cy) + " " + N(dx) + " " + N(dy);
    }
    var cl = K.lum(K.capelli), op = [cl > 0.45 ? 0.26 : 0.5, cl > 0.45 ? 0.3 : 0.45, 0.4], wd = [1.1, 1, 0.8], col = [K.hDD, K.hD, K.hL], s = "";
    for (i = 0; i < 3; i++) s += "<path d='" + P[i] + "' fill='none' stroke='" + col[i] + "' stroke-width='" + wd[i] + "' stroke-linecap='round' opacity='" + op[i] + "'/>";
    return s;
  }
  var EO = 0;
  function fuoriViso(K) {
    var id = "bo" + (EO++);
    K.D.push("<clipPath id='" + K.id + id + "'><path clip-rule='evenodd' d='M-200 -260H200V260H-200Z" + K.faceD + "'/></clipPath>");
    return "url(#" + K.id + id + ")";
  }
  // la massa disegnata: dentro (nel viso) e sopra (fuori dal viso, per mento e guance che sporgono)
  function massa(K, d, o) {
    o = o || {};
    var g = K.LG(uid(), 0, 0, 0.6, 1, [[0, K.mix(K.capelli, K.hL, 0.28)], [0.45, K.capelli], [1, K.hD]]), mc = K.clip(d);
    var base = K.Pa(d, g, " opacity='" + (o.op || 0.93) + "'");
    if (o.sfuma) {
      base += K.St(d, K.capelli, 4, 0.22) + K.St(d, K.capelli, 1.8, 0.3);
      var Rs = K.rnd(77), pd = "", T = o.sfuma, k, t, a, b;
      for (k = 0; k < 150; k++) { t = Rs() * (T.length - 1); a = T[Math.floor(t)]; b = T[Math.min(T.length - 1, Math.floor(t) + 1)]; var f = t - Math.floor(t), sg = Rs() < 0.5 ? -1 : 1, px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f - Rs() * 5; pd += "M" + N(sg * px) + " " + N(py) + "h.3"; }
      base += "<path d='" + pd + "' stroke='" + K.hD + "' stroke-width='1.1' stroke-linecap='round' opacity='.4' fill='none'/>";
    }
    var tex = "<g clip-path='" + mc + "'>" + fili(K, o.seed || 31, Math.round((o.n || 800) * 0.42), { xr: 76, y0: -80, y1: o.y1 || 66 }) + K.El(-18, -28, 22, 14, K.soft("#ffffff", 0.1)) + K.El(26, -20, 26, 30, K.soft("#000000", 0.18)) + "</g>";
    var r = { dentro: "<g>" + base + tex + "</g>", sopra: "" };
    var ro = o.ombra ? K.El(0, o.ombra[0], o.ombra[1], o.ombra[2], K.soft("#000000", 0.32)) : "";
    r.sopra = ro + "<g clip-path='" + fuoriViso(K) + "'>" + base + tex + "</g>";
    return r;
  }
  function cat(a, b) { return { dentro: (a.dentro || "") + (b.dentro || ""), sopra: (a.sopra || "") + (b.sopra || "") }; }
  // baffi (a destra; a sinistra lo specchio). k = quanto sono grossi
  function baffi(K, liste) {
    var s = K.El(0, -29.4, 18, 3.4, K.soft(K.skDD, 0.4)), half = K.ciocche(liste, ["hg1", "hg2", "hg1"]);
    return s + half + "<g transform='scale(-1 1)'>" + half + "</g>";
  }
  var TOP_C = function (cw) { return [[0, -34.5], [10, -35], [18, -36], [27, -40], [cw - 13, -50], [cw - 6, -62], [cw - 3, -73]]; };
  var TOP_F = function (cw) { return [[0, -35], [9, -36], [16, -38], [25, -43], [cw - 14, -52], [cw - 6, -64], [cw - 2, -77]]; };
  var LB = [
    [[1, -34, 6.5], [9, -33.8, 8], [17, -31, 7.5], [24, -26.5, 5], [28, -22.5, 1.5]],
    [[1, -33, 6], [8, -31.8, 7], [15, -28.6, 6], [21, -24.6, 3.5], [24, -21, 1]],
    [[2, -36, 5], [10, -36.8, 6], [19, -35, 5], [26, -30.6, 3], [30, -27.5, 1]]
  ];
  var LB_FOLTI = [
    [[1, -33.6, 7.5], [10, -33.4, 9.5], [19, -30.6, 9], [27, -25.6, 6.5], [32, -20, 2]],
    [[1, -32.6, 7], [9, -31, 8], [17, -27.6, 7], [24, -22.6, 4.5], [27, -18, 1]],
    [[2, -35.8, 6], [11, -36.4, 7], [21, -34, 6], [29, -29.4, 4], [34, -25.6, 1]]
  ];
  var LB_BAFFONI = [
    [[1, -33.6, 7.5], [10, -33, 10], [20, -30.6, 10.5], [30, -28.2, 9], [38, -29, 6.5], [44, -34, 4.5], [46, -40, 2.4], [45.5, -45, 0.8]],
    [[1, -32.6, 7], [10, -30.6, 9], [19, -27.6, 8.5], [28, -25.4, 6.5], [36, -26.4, 4.5], [41, -30.5, 2.5], [42, -35, 0.8]],
    [[2, -35.6, 6], [12, -36.2, 8], [23, -34.2, 7.5], [33, -32.6, 5.5], [41, -35, 3.4], [46, -40.5, 1.6]]
  ];

  A.pezzo("barba", "corta", function (K) {
    var cw = K.F.cw, d = massaD(K, { th: function (u) { return 1.2 + 2.6 * u; }, top: TOP_C(cw) });
    return massa(K, d, { seed: 31, n: 760, ombra: [3, 30, 4], sfuma: TOP_C(cw) });
  });
  A.pezzo("barba", "folta", function (K) {
    var cw = K.F.cw, d = massaD(K, { th: function (u) { return 2 + 11 * Math.pow(u, 1.5); }, top: TOP_F(cw) });
    var m = massa(K, d, { seed: 32, n: 1100, ombra: [10, 34, 6], sfuma: TOP_F(cw) });
    return cat(m, { sopra: baffi(K, LB_FOLTI) });
  });
  A.pezzo("barba", "pizzetto", function (K) {
    var d = K.lisciaChiusa([[0, -13.6], [5.4, -13.2], [9.6, -8.6], [10.6, -2], [8, 4.4], [3.8, 9], [0, 10.2], [-3.8, 9], [-8, 4.4], [-10.6, -2], [-9.6, -8.6], [-5.4, -13.2]]);
    return massa(K, d, { seed: 33, n: 220, y1: 12, ombra: [11, 12, 3] });
  });
  A.pezzo("barba", "baffi", function (K) { return { sopra: baffi(K, LB) }; });
  A.pezzo("barba", "baffipizzetto", function (K) {
    var d = K.lisciaChiusa([[0, -13.6], [5.4, -13.2], [9.6, -8.6], [10.6, -2], [8, 4.4], [3.8, 9], [0, 10.2], [-3.8, 9], [-8, 4.4], [-10.6, -2], [-9.6, -8.6], [-5.4, -13.2]]);
    return cat(massa(K, d, { seed: 34, n: 220, y1: 12, ombra: [11, 12, 3] }), { sopra: baffi(K, LB) });
  });
  A.pezzo("barba", "barbalunga", function (K) {
    var cw = K.F.cw, d = massaD(K, { u0: 0.05, th: function (u) { return 3 + 8 * u; }, top: TOP_F(cw), dropX: function (x) { var t = Math.min(1, Math.abs(x) / (cw - 6)); return 44 * Math.sqrt(1 - t * t * t); } });
    var m = massa(K, d, { seed: 35, n: 1500, y1: 64, ombra: [48, 28, 7] });
    return cat(m, { sopra: baffi(K, LB_FOLTI) });
  });
  A.pezzo("barba", "collare", function (K) {
    var d = bandaD(K, { u0: 0.28, fuori: 2.6, w0: 1.4, w1: 8.5 });
    return massa(K, d, { seed: 36, n: 420, y1: 12, ombra: [6, 30, 4] });
  });
  A.pezzo("barba", "ancora", function (K) {
    var d = K.lisciaChiusa([[-21, -28], [-15.4, -28], [-14, -18], [-10.8, -12.6], [0, -12], [10.8, -12.6], [14, -18], [15.4, -28], [21, -28], [22, -14], [18, -2], [10, 6], [0, 9.6], [-10, 6], [-18, -2], [-22, -14]]);
    return cat(massa(K, d, { seed: 37, n: 520, y1: 12, ombra: [11, 18, 4] }), { sopra: baffi(K, LB) });
  });
  A.pezzo("barba", "baffoni", function (K) { return { sopra: baffi(K, LB_BAFFONI) }; });
  A.pezzo("barba", "basettoni", function (K) {
    var F = K.F, cw = F.cw, J = jaw(K, 8, 0.0).filter(function (q) { return q.u <= 0.42; }), side = function (l) {
      var p = J.map(function (q) { return [l * (q.x + q.nx * 1.8), q.y + q.ny * 1.8]; });
      p = p.concat([[l * (F.jx - 3), F.jy + 6], [l * (F.jx - 9), F.jy - 2], [l * (cw - 15), -42], [l * (cw - 12), -56], [l * (cw - 9), -70], [l * (cw - 6), -82]]);
      return K.lisciaChiusa(p);
    };
    var dR = side(1), dL = side(-1);
    var a = massa(K, dR, { seed: 38, n: 420, y1: 0, sfuma: [[cw - 14, -40], [cw - 15, -56], [cw - 10, -72]].map(function (q) { return [q[0], q[1]]; }) }), b = massa(K, dL, { seed: 39, n: 420, y1: 0 });
    return cat(a, b);
  });

  // ======================= SEGNI =======================
  function pelleFissa(K) { return K.clip(K.faceD); }
  A.pezzo("segno", "neo", function (K) {
    var scuro = K.lum(K.pelle) < 0.3, c = scuro ? "#120805" : K.mix(K.skDD, "#2a140c", 0.45), k = scuro ? 1.2 : 1;
    return K.El(26.6, -35, 3.3 * k, 3.1 * k, K.soft(scuro ? "#000000" : K.skDD, 0.3)) + K.El(26.6, -35, 1.85 * k, 1.75 * k, c) + K.El(26.2, -35.5, 0.6, 0.45, "#ffffff", " opacity='.4'");
  });
  A.pezzo("segno", "cicatrice", function (K) {
    var c = K.mix(K.pelle, "#c26a6e", 0.4), e = K.mix(K.skDD, "#3a1018", 0.2), s = "<g transform='translate(-33 -55) rotate(-24)'>";
    s += K.St("M-1 -12C1 -6 -1 0 1 6C2 9 1 12 2 15", e, 3.4, 0.2);
    s += K.St("M0 -12C2 -6 0 0 2 6C3 9 2 12 3 15", c, 2.2, 0.95) + K.St("M-0.4 -12C1.6 -6 -0.4 0 1.6 6C2.6 9 1.6 12 2.6 15", K.mix(c, "#ffffff", 0.35), 0.7, 0.55);
    for (var i = 0; i < 5; i++) { var y = -8 + i * 5.2, x = 0.6 + (i % 2) * 0.4; s += K.St("M" + N(x - 3) + " " + N(y) + "L" + N(x + 3.4) + " " + N(y + 0.6), e, 0.9, 0.55); }
    return s + "</g>";
  });
  A.pezzo("segno", "cerotto", function (K) {
    var cr = "#ecc79e", cb = K.LG(uid(), 0, 0, 0, 1, [[0, "#f4d6b2"], [1, "#d9ae80"]]);
    var s = "<g transform='translate(31 -50) rotate(-24)'>";
    s += K.El(0, 1.6, 12, 4.6, K.soft("#000000", 0.28));
    s += K.Pa("M-10.5 -3.6H10.5Q12.5 -3.6 12.5 -1.6V1.6Q12.5 3.6 10.5 3.6H-10.5Q-12.5 3.6 -12.5 1.6V-1.6Q-12.5 -3.6 -10.5 -3.6Z", cb);
    s += K.Pa("M-4.6 -3.6H4.6V3.6H-4.6Z", "#f7e6d0") + K.St("M-4.6 -3.6V3.6M4.6 -3.6V3.6", "#c89a70", 0.5, 0.7);
    for (var i = 0; i < 4; i++) { s += "<circle cx='" + (-9.4 + i * 0.7) + "' cy='" + (-2 + i * 1.4) + "' r='.28' fill='#b88a60' opacity='.5'/><circle cx='" + (9.4 - i * 0.7) + "' cy='" + (-2 + i * 1.4) + "' r='.28' fill='#b88a60' opacity='.5'/>"; }
    s += K.St("M-10.5 -3.2H10.5", "#ffffff", 0.7, 0.4) + K.St("M-12.2 -1.8V1.8", "#b98c63", 0.5, 0.5) + K.St("M12.2 -1.8V1.8", "#b98c63", 0.5, 0.5);
    return s + "</g>";
  });
  A.pezzo("segno", "occhiaie", function (K) {
    var tono = K.mix(K.skDD, "#4a3a78", K.lum(K.pelle) < 0.4 ? 0.18 : 0.38), s = "<g clip-path='" + pelleFissa(K) + "'>";
    [-1, 1].forEach(function (l) {
      s += K.El(l * 25, -62.6, 15, 5.2, K.soft(tono, 0.62)) + K.St("M" + N(l * 14) + " -66.4C" + N(l * 20) + " -61.4 " + N(l * 30) + " -61.2 " + N(l * 38) + " -65.6", tono, 1.3, 0.34);
    });
    return s + "</g>";
  });
  A.pezzo("segno", "rughe", function (K) {
    var c = K.lum(K.pelle) < 0.3 ? K.mix(K.pelle, "#d9a07a", 0.45) : K.skDD, s = "<g clip-path='" + pelleFissa(K) + "'>";
    [[-102, 25, 0.34], [-107.6, 21, 0.3], [-113, 16, 0.24]].forEach(function (r, i) {
      s += K.St("M" + (-r[1]) + " " + N(r[0] + 0.6) + "C" + N(-r[1] * 0.4) + " " + N(r[0] - 1.2 + i * 0.2) + " " + N(r[1] * 0.4) + " " + N(r[0] - 1.2) + " " + r[1] + " " + N(r[0] + 0.6), c, 1.1, r[2]);
      s += K.St("M" + (-r[1]) + " " + N(r[0] + 2.4) + "C" + N(-r[1] * 0.4) + " " + N(r[0] + 0.8) + " " + N(r[1] * 0.4) + " " + N(r[0] + 0.8) + " " + r[1] + " " + N(r[0] + 2.4), "#ffffff", 0.7, r[2] * 0.5);
    });
    [1, -1].forEach(function (l) {
      s += K.St("M" + N(l * 45) + " -76C" + N(l * 49) + " -77 " + N(l * 52) + " -78.6 " + N(l * 53) + " -80", c, 0.9, 0.22) + K.St("M" + N(l * 45.6) + " -72C" + N(l * 49.4) + " -72 " + N(l * 52) + " -72.6 " + N(l * 53.2) + " -73.6", c, 0.9, 0.2) + K.St("M" + N(l * 45) + " -68C" + N(l * 48.6) + " -67 " + N(l * 51) + " -66.4 " + N(l * 52.4) + " -65.4", c, 0.9, 0.18);
      s += K.St("M" + N(l * 13) + " -44C" + N(l * 19) + " -38 " + N(l * 20) + " -32 " + N(l * 18) + " -26", c, 1.2, 0.2);
    });
    return s + "</g>";
  });
  A.pezzo("segno", "voglia", function (K) {
    var c = K.lum(K.pelle) < 0.3 ? K.mix(K.pelle, "#d2a273", 0.55) : K.mix(K.pelle, "#7a3d22", 0.42), d = "M-1 -7C4 -9.4 9 -6.6 9.6 -1.4C10 3.4 5.4 6.4 0.6 6C-4.6 5.6 -6.6 1.6 -5.2 -2C-4.6 -4.6 -2.6 -6.4 -1 -7Z";
    return "<g transform='translate(-34 -53) rotate(-14) scale(.78)'>" + K.El(2, 0, 12.4, 10.6, K.soft(c, 0.34)) + K.Pa(d, c, " opacity='.58'") +
      K.St("M0 -4C3 -5.4 6.4 -3.6 7 -0.6", K.mix(c, "#ffffff", 0.25), 0.9, 0.3) + "</g>";
  });
  A.pezzo("segno", "stellina", function (K) {
    var st = "M0 -5.4L1.5 -1.8L5.5 -1.6L2.4 0.9L3.4 4.8L0 2.6L-3.4 4.8L-2.4 0.9L-5.5 -1.6L-1.5 -1.8Z";
    var g = K.LG(uid(), 0, 0, 1, 1, [[0, "#8fd0ff"], [0.55, "#3f9bea"], [1, "#2468b8"]]);
    return "<g transform='translate(-31 -46) rotate(-10) scale(1.3)'>" + K.El(0.8, 1.2, 6.8, 6.2, K.soft("#000000", 0.28)) + K.Pa(st, g, " stroke='#1c5fa8' stroke-width='.6' stroke-linejoin='round'") +
      K.Pa("M-0.4 -3.8L0.6 -1.4L-2 -1.2Z", "#ffffff", " opacity='.5'") + "</g>";
  });

  /* PEZZI FATTI: bocche (sorrisone, sorrisetto, ghigno, risata, labbra, o, triste, smorfia, baciotto, linguaccia, micio, dentoni, canini,
     apparecchio, mordilabbro, nervoso); barbe (corta, folta, pizzetto, baffi, baffipizzetto, barbalunga, collare, ancora, baffoni, basettoni);
     segni (neo, cicatrice, cerotto, occhiaie, rughe, voglia, stellina). */
})();


// ---- vestiti-sopra ----
/* =========================================================
   VESTITI DI SOPRA (avatar illustrati, strada A)
   felpa, camicia, giacca, bomber, maglione, cappotto, polo, canotta, dolcevita, calcio, sportiva,
   crop, top, camicetta, cardigan, gilet, vestito, vestitolungo, grembiule
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGOminoA;
  if (!A) return;
  var uid = 0, n1 = function (v) { return Math.round(v * 10) / 10; };

  // ---------- aiuti comuni ----------
  function colori(K, mg) { return { mg: mg, ml: K.chiaro(mg, 0.38), mll: K.chiaro(mg, 0.62), md: K.scuro(mg, 0.3), mdd: K.scuro(mg, 0.5) }; }
  function contrasto(K, mg) { return K.lum(mg) > 0.6 ? K.mix(mg, "#16203c", 0.82) : "#ffffff"; }
  // cilindro (luce a sinistra, ombra a destra) su una fascia di coordinate fisse
  function cilU(K, c, x0, x1, f) {
    f = f == null ? 1 : f;
    var L = K.lum(c), ch = K.mix(c, "#ffffff", (0.22 + 0.16 * (1 - L)) * f), sc = K.mix(c, "#1a0c14", (0.28 + 0.1 * L) * f), bo = K.mix(c, "#12060c", (0.46 + 0.1 * L) * f);
    return K.LG("vs" + (uid++), x0, 0, x1, 0, [[0, K.mix(c, sc, 0.35)], [0.12, K.mix(c, ch, 0.7)], [0.3, ch], [0.55, c], [0.82, sc], [1, bo]], true);
  }
  function pattern(K, w, h, inner) {
    var id = K.id + "vp" + (uid++);
    K.D.push("<pattern id='" + id + "' width='" + w + "' height='" + h + "' patternUnits='userSpaceOnUse'>" + inner + "</pattern>");
    return "url(#" + id + ")";
  }
  // costine verticali (trama scura e riflesso)
  function costine(K) { return pattern(K, 6, 10, "<rect x='2.2' y='0' width='1.7' height='10' fill='#1a0a10' opacity='.26'/><rect x='4.3' y='0' width='1' height='10' fill='#ffffff' opacity='.13'/>"); }
  function stampa(K, T) { var st = A.stampa && A.stampa[K.c.stampa]; return st ? "<g clip-path='" + K.clip(T) + "'>" + st(K, T) + "</g>" : ""; }
  function bottone(K, x, y, r, col) {
    r = r || 3.6;
    return K.El(x + 0.8, y + 1.3, r, r, "#000000", " opacity='.28'") + "<circle cx='" + n1(x) + "' cy='" + n1(y) + "' r='" + r + "' fill='" + col + "' stroke='" + K.scuro(col, 0.45) + "' stroke-width='.9'/>" +
      K.El(x - r * 0.3, y - r * 0.35, r * 0.4, r * 0.3, "#ffffff", " opacity='.55'") + K.St("M" + n1(x - r * 0.3) + " " + n1(y + 0.4) + "h.1M" + n1(x + r * 0.3) + " " + n1(y + 0.4) + "h.1", K.scuro(col, 0.6), 1, 0.7);
  }
  function cerniera(K, x, y0, y1, luce) {
    var d = "M" + n1(x) + " " + y0 + "L" + n1(x) + " " + y1;
    return K.St(d, "#000000", 6, 0.6) + K.St(d, luce || "#c9ccd3", 3.8, 0.95) + K.St(d, "#6f737d", 3.8, 0.9, " stroke-dasharray='1.5 1.5'") + K.St(d, "#ffffff", 1, 0.6, " stroke-dasharray='1.5 1.5'");
  }
  function tiretta(K, x, y) {
    return K.Pa("M" + (x - 5) + " " + (y - 4) + "L" + (x + 5) + " " + (y - 4) + "L" + (x + 4) + " " + (y + 11) + "L" + (x - 4) + " " + (y + 11) + "Z", "#c9ccd3", " stroke='#5b5e66' stroke-width='1' stroke-linejoin='round'") +
      "<rect x='" + (x - 2.4) + "' y='" + (y + 6) + "' width='4.8' height='11' rx='2.2' fill='#aab0ba' stroke='#5b5e66' stroke-width='.8'/><rect x='" + (x - 1) + "' y='" + (y + 9) + "' width='2' height='5.5' rx='1' fill='#3a3d44'/>";
  }
  // maniche con luci e ombre; ritorna { svg, ds: [contorno sx, dx] }
  function maniche(K, col, o) {
    o = o || {};
    var lung = o.lung == null ? 1 : o.lung, e = o.agio == null ? 7 : o.agio, k = colori(K, col), s = "", ds = [];
    [-1, 1].forEach(function (l) {
      var d = K.manica(l, { lung: lung, agio: e, svasa: o.svasa || 0, tonda: o.tonda });
      ds.push(d);
      s += K.Pa(d, K.cil(col, o.forza || 1));
      var b = K.BR[l], J = b.J, E = b.E;
      s += "<g clip-path='" + K.clip(d) + "'>" + K.El(J[0] + l * 6, J[1] + 36, 12, 24, K.soft(k.mdd, 0.25));
      if (lung > 0.5) {
        var ux = b.W[0] - J[0], uy = b.W[1] - J[1], ul = Math.hypot(ux, uy) || 1, w = (K.B.aw[1] + e) * 0.62 + 2;
        ux /= ul; uy /= ul;
        var px = -uy, py = ux;
        for (var i = 0; i < 3; i++) {
          var cx = E[0] + ux * (i * 7 - 6), cy = E[1] + uy * (i * 6 - 5), q = 1 - i * 0.2;
          s += K.St("M" + n1(cx - px * w) + " " + n1(cy - py * w) + "Q" + n1(cx + ux * 5 * l * l) + " " + n1(cy + uy * 5) + " " + n1(cx + px * w) + " " + n1(cy + py * w), k.mdd, 3.4, 0.11 * q) +
            K.St("M" + n1(cx - px * w + ux * 2) + " " + n1(cy - py * w + uy * 2) + "Q" + n1(cx + ux * 7) + " " + n1(cy + uy * 7) + " " + n1(cx + px * w * 0.2 + ux * 2) + " " + n1(cy + py * w * 0.2 + uy * 2), "#ffffff", 1.4, 0.1 * q);
        }
      }
      s += "</g>";
      if (o.pol) s += polsino(K, l, lung, o.pol[0], e, o.pol[1], o.pol[2], o.pol[3]);
    });
    return { svg: s, ds: ds };
  }
  // polsino/orlo di manica a costine o liscio (e = agio usato nella manica)
  function polsino(K, l, lung, len, e, fill, linea, o) {
    o = o || {};
    var f = K.fineManica(l, lung), w = (f.w + e + (o.dw || 0)), ux = f.dx, uy = f.dy, px = -uy, py = ux, xs = f.x - ux * len, ys = f.y - uy * len;
    if (px > 0) { px = -px; py = -py; }
    var s = K.Pa(K.limb([[xs, ys, w * 0.98], [f.x, f.y, w * 0.94]]), fill) + "<g clip-path='" + K.clip(K.limb([[xs, ys, w * 0.98], [f.x, f.y, w * 0.94]])) + "'>";
    if (!o.liscio) for (var q = -0.42; q <= 0.43; q += 0.14) s += K.St("M" + n1(xs + px * w * q) + " " + n1(ys + py * w * q) + "L" + n1(f.x + px * w * q * 0.96) + " " + n1(f.y + py * w * q * 0.96), linea, 1.1, 0.34);
    s += K.St("M" + n1(xs + px * w * 0.5) + " " + n1(ys + py * w * 0.5) + "L" + n1(f.x + px * w * 0.47) + " " + n1(f.y + py * w * 0.47), "#ffffff", 2.2, 0.28) + K.St("M" + n1(xs - py * 0 + px * w * -0.5) + " " + n1(ys - py * 0 + py * w * -0.5) + "L" + n1(f.x - px * w * 0.47) + " " + n1(f.y - py * w * 0.47), linea, 3, 0.3) + "</g>";
    s += K.St("M" + n1(xs + px * w * 0.49) + " " + n1(ys + py * w * 0.49) + "L" + n1(xs - px * w * 0.49) + " " + n1(ys - py * w * 0.49), linea, 1.6, 0.5);
    return s;
  }
  // luce e ombra sul busto (dentro il ritaglio del busto)
  function ombra(K, k, o) {
    o = o || {};
    var C = K.C, B = K.B, Y = K.Y, mdd = k.mdd, q = o.q == null ? 1 : o.q, s = "";
    s += K.El(C - 40, Y.petto - 30, 30, 40, K.soft("#ffffff", 0.2)) + K.El(C + B.ch - 6, Y.petto + 30, 24, 120, K.soft(mdd, 0.22)) + K.El(C, 272, 40, 14, K.soft(mdd, 0.35));
    if (K.donna) { var bs = B.seno || 1; s += K.El(C - 24 * bs, Y.petto + 22 * bs, 24 * bs, 9, K.soft(mdd, 0.42)) + K.El(C + 24 * bs, Y.petto + 22 * bs, 24 * bs, 9, K.soft(mdd, 0.48)) + K.El(C - 26 * bs, Y.petto - 2, 18 * bs, 14 * bs, K.soft("#ffffff", 0.18)); }
    if (B.pancia && !o.noPancia) s += K.St("M" + (C - B.wt + 10) + " " + (Y.vita + 26) + "C" + (C - 30) + " " + (Y.vita + 44) + " " + (C + 30) + " " + (Y.vita + 44) + " " + (C + B.wt - 10) + " " + (Y.vita + 26), mdd, 4, 0.25);
    if (!o.noPieghe) {
      s += K.St("M" + (C - B.wt + 4) + " 470C" + (C - B.wt + 24) + " 478 " + (C - B.wt + 44) + " 472 " + (C - B.wt + 64) + " 482", mdd, 5, 0.13 * q) +
        K.St("M" + (C + B.wt - 6) + " 442C" + (C + B.wt - 26) + " 454 " + (C + B.wt - 40) + " 452 " + (C + B.wt - 62) + " 464", mdd, 4, 0.15 * q) +
        K.St("M" + (C - 24) + " 420C" + (C - 12) + " 440 " + (C - 10) + " 470 " + (C - 18) + " 498", mdd, 4, 0.1 * q);
    }
    return s;
  }
  // bordo interno morbido (niente contorni neri)
  function bordo(K, T, k, w) { return K.St(T, k.mdd, w || 4, 0.3); }
  // fascia a costine sull'orlo (dentro il ritaglio del busto)
  function costineOrlo(K, k, orlo, h, fill) {
    var C = K.C, B = K.B, x0 = C - B.hp - 20, x1 = C + B.hp + 20, hh = h == null ? 22 : h;
    return K.Pa("M" + (C - 200) + " " + (orlo - hh) + "Q" + C + " " + (orlo - hh + 6) + " " + (C + 200) + " " + (orlo - hh) + "L" + (C + 200) + " " + (orlo + 30) + "L" + (C - 200) + " " + (orlo + 30) + "Z", cilU(K, fill, x0, x1, 0.9)) +
      K.Pa("M" + (C - 200) + " " + (orlo - hh) + "Q" + C + " " + (orlo - hh + 6) + " " + (C + 200) + " " + (orlo - hh) + "L" + (C + 200) + " " + (orlo + 30) + "L" + (C - 200) + " " + (orlo + 30) + "Z", costine(K)) +
      K.St("M" + (C - 200) + " " + (orlo - hh) + "Q" + C + " " + (orlo - hh + 6) + " " + (C + 200) + " " + (orlo - hh), k.mdd, 2, 0.5) +
      K.St("M" + (C - 200) + " " + (orlo - hh + 2.5) + "Q" + C + " " + (orlo - hh + 8.5) + " " + (C + 200) + " " + (orlo - hh + 2.5), "#ffffff", 1.2, 0.3);
  }
  // un torso corto (finisce a yo): per crop e simili
  function torsoCorto(K, yo, o) {
    o = o || {};
    var C = K.C, B = K.B, Y = K.Y, e = o.agio == null ? 5 : o.agio, nl = B.nk + (o.larg == null ? 4 : o.larg), prof = o.prof == null ? 16 : o.prof, ny = 240;
    var xAt = function (y) { if (y <= Y.petto) return B.ch + e; var t = Math.min(1, (y - Y.petto) / (Y.vita - Y.petto)); return B.ch + (B.wt - B.ch) * t + e * 1.1; };
    var side = function (s) { return [[C + s * (B.shx + e * 0.6), Y.spalla], [C + s * (B.sho - 4 + e), Y.delt], [C + s * (B.ap + e), Y.ascella], [C + s * (B.ch + e), Y.petto], [C + s * xAt(yo), yo]]; };
    var R = side(1), L = side(-1).reverse();
    var sc = "C" + n1(C - nl + 2) + " " + n1(ny + prof * 0.9) + " " + n1(C - nl * 0.45) + " " + (ny + prof) + " " + C + " " + (ny + prof) + "C" + n1(C + nl * 0.45) + " " + (ny + prof) + " " + n1(C + nl - 2) + " " + n1(ny + prof * 0.9) + " " + n1(C + nl) + " " + ny;
    return "M" + n1(C - nl) + " " + ny + sc + "C" + n1(C + nl + 10) + " " + (ny + 2) + " " + n1(R[0][0] - 8) + " " + n1(R[0][1] - 4) + " " + n1(R[0][0]) + " " + n1(R[0][1]) + K.cr(R) +
      "Q" + C + " " + (yo + (o.curva == null ? 5 : o.curva)) + " " + n1(L[0][0]) + " " + n1(L[0][1]) + K.cr(L) + "C" + n1(L[L.length - 1][0] + 8) + " " + n1(L[L.length - 1][1] - 4) + " " + n1(C - nl - 10) + " " + (ny + 2) + " " + n1(C - nl) + " " + ny + "Z";
  }
  // colletto a due punte (camicia, polo)
  function colletto(K, k, o) {
    o = o || {};
    var C = K.C, nk = K.B.nk, tw = o.tw == null ? 14 : o.tw, ty = o.ty || 292, top = o.top || 236, cy = o.cy || 266, fill = o.fill || k.mg, s = "";
    [-1, 1].forEach(function (l) {
      var X = function (v) { return n1(C + l * v); };
      var d = "M" + X(2) + " " + cy + "L" + X(nk + 3) + " " + top + "C" + X(nk + 12) + " " + (top + 1) + " " + X(nk + tw + 8) + " " + (ty - 36) + " " + X(nk + tw + 9) + " " + (ty - 28) + "L" + X(nk + tw) + " " + ty + "Q" + X(nk * 0.45 + 6) + " " + (ty - 16) + " " + X(2) + " " + cy + "Z";
      s += K.Pa(d, K.cil(fill, 0.55), " opacity='1'");
      s += "<g clip-path='" + K.clip(d) + "'>" + K.El(C + l * (nk + tw * 0.5), ty - 10, 16, 20, K.soft("#ffffff", l < 0 ? 0.3 : 0.12)) + K.St("M" + X(nk + 2) + " " + (top + 4) + "C" + X(nk + 6) + " " + (top + 20) + " " + X(nk + tw * 0.6) + " " + (ty - 18) + " " + X(nk + tw - 2) + " " + (ty - 5), K.scuro(fill, 0.3), 2, 0.3) + "</g>";
      s += K.St("M" + X(nk + tw) + " " + ty + "Q" + X(nk * 0.45 + 6) + " " + (ty - 16) + " " + X(2) + " " + cy, k.mdd, 1.6, 0.55);
      s += K.St("M" + X(nk + tw + 6) + " " + (ty - 28) + "L" + X(nk + tw - 1) + " " + (ty - 4), "#ffffff", 1.2, 0.35);
    });
    return s;
  }
  // luci e ombre del busto di un capo lungo (cappotto, vestiti): pieghe verticali che scendono
  function pieghe(K, k, y0, y1, n, q) {
    var C = K.C, B = K.B, s = "", w = Math.max(B.hp, B.wt) + 10;
    for (var i = 0; i < n; i++) {
      var t = (i + 0.5) / n, x = C + (t - 0.5) * 2 * w * 0.9, sw = (t - 0.5) * 2;
      s += K.St("M" + n1(C + (t - 0.5) * 2 * w * 0.55) + " " + y0 + "C" + n1(x - 2) + " " + n1(y0 + (y1 - y0) * 0.35) + " " + n1(x + sw * 6) + " " + n1(y0 + (y1 - y0) * 0.7) + " " + n1(x + sw * 12) + " " + y1, k.mdd, 5 + (i % 2) * 2, (0.1 + (i % 3) * 0.03) * q) +
        K.St("M" + n1(C + (t - 0.5) * 2 * w * 0.55 - 3) + " " + y0 + "C" + n1(x - 5) + " " + n1(y0 + (y1 - y0) * 0.35) + " " + n1(x + sw * 6 - 3) + " " + n1(y0 + (y1 - y0) * 0.7) + " " + n1(x + sw * 12 - 3) + " " + y1, "#ffffff", 2, 0.1 * q);
    }
    return s;
  }

  // =========================================================
  //  FELPA
  // =========================================================
  A.pezzo("capo", "felpa", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", rib = K.mix(mg, k.mdd, 0.22);
    var T = K.busto({ agio: 9, orlo: 512, scollo: { prof: 10, larg: 8 }, svasa: -3, pancia: B.pancia ? 8 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 10, pol: [18, rib, k.mdd] });
    // il cappuccio dietro il collo (si vede ai lati del collo e dietro le spalle)
    var dietro = K.Pa("M" + (C - nk - 30) + " 264C" + (C - nk - 36) + " 232 " + (C - nk - 14) + " 204 " + C + " 202C" + (C + nk + 14) + " 204 " + (C + nk + 36) + " 232 " + (C + nk + 30) + " 264Z", cilU(K, k.md, C - nk - 36, C + nk + 36, 0.9)) +
      K.El(C, 252, nk + 20, 22, K.soft(k.mdd, 0.55));
    s += M.svg + K.Pa(T, K.cil(mg, 0.75));
    var q = "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 1.3 });
    // tasca a marsupio
    var tb = Math.max(B.wt - 8, 34), tt = Math.min(48, tb - 6), pk = "M" + (C - tt) + " 430C" + (C - tt - 2) + " 440 " + (C - tb + 2) + " 470 " + (C - tb) + " 500L" + (C + tb) + " 500C" + (C + tb - 2) + " 470 " + (C + tt + 2) + " 440 " + (C + tt) + " 430C" + (C + 20) + " 436 " + (C - 20) + " 436 " + (C - tt) + " 430Z";
    q += K.Pa(pk, K.mix(mg, "#000000", 0.05), " opacity='.5'") + K.St(pk, k.mdd, 3, 0.35) + K.St("M" + (C - tt + 3) + " 433C" + (C - 20) + " 439 " + (C + 20) + " 439 " + (C + tt - 3) + " 433", "#ffffff", 1.4, 0.25) +
      K.St("M" + (C - tt - 1) + " 432C" + (C - tt - 3) + " 442 " + (C - tb + 3) + " 470 " + (C - tb + 1) + " 496", k.mdd, 1.2, 0.5, " stroke-dasharray='3 2.5'") + K.St("M" + (C + tt + 1) + " 432C" + (C + tt + 3) + " 442 " + (C + tb - 3) + " 470 " + (C + tb - 1) + " 496", k.mdd, 1.2, 0.5, " stroke-dasharray='3 2.5'") +
      K.El(C - tt + 4, 462, 8, 22, K.soft(k.mdd, 0.45)) + K.El(C + tt - 4, 462, 8, 22, K.soft(k.mdd, 0.5)) + K.El(C, 482, tb - 6, 10, K.soft(k.mdd, 0.18));
    q += costineOrlo(K, k, 512, 24, rib) + "</g>";
    s += q + bordo(K, T, k, 4).replace("<path", "<path clip-path='" + K.clip(T) + "'");
    s += stampa(K, T);
    // il cappuccio sul davanti (a rotolo attorno al collo) e i cordini
    var hood = "M" + (C - nk - 22) + " 238C" + (C - nk - 30) + " 264 " + (C - nk - 14) + " 296 " + (C - 22) + " 306C" + (C - 8) + " 309 " + (C + 8) + " 309 " + (C + 22) + " 306C" + (C + nk + 14) + " 296 " + (C + nk + 30) + " 264 " + (C + nk + 22) + " 238C" + (C + nk + 16) + " 238 " + (C + nk + 8) + " 240 " + (C + nk + 3) + " 244C" + (C + nk + 2) + " 258 " + (C + nk * 0.5) + " 270 " + C + " 270C" + (C - nk * 0.5) + " 270 " + (C - nk - 2) + " 258 " + (C - nk - 3) + " 244C" + (C - nk - 8) + " 240 " + (C - nk - 16) + " 238 " + (C - nk - 22) + " 238Z";
    s += K.Pa(hood, cilU(K, mg, C - nk - 30, C + nk + 30, 0.85)) + "<g clip-path='" + K.clip(hood) + "'>" + K.El(C - nk * 0.8, 262, 16, 30, K.soft("#ffffff", 0.22)) + K.El(C + nk, 284, 18, 24, K.soft(k.mdd, 0.3)) + K.St("M" + (C - nk - 14) + " 252C" + (C - nk - 16) + " 276 " + (C - 18) + " 296 " + C + " 298C" + (C + 18) + " 296 " + (C + nk + 16) + " 276 " + (C + nk + 14) + " 252", k.mdd, 2, 0.28) + "</g>" +
      K.St("M" + (C + nk + 3) + " 244C" + (C + nk + 2) + " 258 " + (C + nk * 0.5) + " 270 " + C + " 270C" + (C - nk * 0.5) + " 270 " + (C - nk - 2) + " 258 " + (C - nk - 3) + " 244", k.mdd, 3.2, 0.6) +
      K.St("M" + (C - nk - 18) + " 244C" + (C - nk - 25) + " 266 " + (C - nk - 12) + " 292 " + (C - 22) + " 302", "#ffffff", 1.5, 0.3);
    var cord = K.chiaro(mg, 0.7);
    [-1, 1].forEach(function (l) {
      var x = C + l * 13, d = "M" + n1(x) + " 270C" + n1(x + l * 3) + " 290 " + n1(x - l * 2) + " 320 " + n1(x + l * 2) + " 346";
      s += K.St(d, k.mdd, 4.4, 0.35) + K.St(d, cord, 3.2, 0.95) + K.St("M" + n1(x + l * 2) + " 342L" + n1(x + l * 2.4) + " 354", K.mix(cord, "#444", 0.5), 4.2, 1);
    });
    return { dietro: dietro, corpo: s };
  });

  // =========================================================
  //  CAMICIA (e base per il gilet)
  // =========================================================
  function buildCamicia(K, mg, o) {
    o = o || {};
    var k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "";
    var T = K.busto({ agio: 5, orlo: 524, scollo: { tipo: "v", prof: 30, larg: 3 }, curvaOrlo: 9, pancia: B.pancia ? 5 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 6, pol: [17, K.mix(mg, "#ffffff", 0.06), k.mdd, { liscio: true }] });
    s += M.svg + K.Pa(T, K.cil(mg, 0.75));
    var q = "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 0.8 });
    // fila dei bottoni
    q += K.Pa("M" + (C - 7) + " 262L" + (C + 7) + " 262L" + (C + 7) + " 540L" + (C - 7) + " 540Z", K.mix(mg, "#ffffff", 0.1), " opacity='.7'") + K.St("M" + (C - 7) + " 264L" + (C - 7) + " 530", k.mdd, 1.2, 0.35) + K.St("M" + (C + 7) + " 264L" + (C + 7) + " 530", k.mdd, 1.2, 0.4);
    for (var i = 0; i < 6; i++) q += bottone(K, C, 286 + i * 42, 3.5, K.chiaro(mg, 0.65));
    if (K.m) {   // taschino sul petto (a destra nel disegno)
      var px = C + B.ch * 0.5, py = 360;
      q += K.Pa("M" + (px - 13) + " " + py + "L" + (px + 13) + " " + py + "L" + (px + 13) + " " + (py + 24) + "L" + px + " " + (py + 29) + "L" + (px - 13) + " " + (py + 24) + "Z", K.mix(mg, "#000000", 0.04), " opacity='.5'") +
        K.St("M" + (px - 13) + " " + py + "L" + (px + 13) + " " + py + "L" + (px + 13) + " " + (py + 24) + "L" + px + " " + (py + 29) + "L" + (px - 13) + " " + (py + 24) + "Z", k.mdd, 1.3, 0.5) + K.St("M" + (px - 12) + " " + (py + 3) + "L" + (px + 12) + " " + (py + 3), "#ffffff", 1.2, 0.3);
    }
    q += K.St("M" + (C - B.hp + 2) + " 506C" + (C - 20) + " 514 " + (C + 20) + " 514 " + (C + B.hp - 2) + " 506", k.mdd, 2, 0.28);
    q += "</g>";
    s += q + "<g clip-path='" + K.clip(T) + "'>" + bordo(K, T, k, 4) + "</g>";
    var cuffs = "";
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1);
      cuffs += bottone(K, f.x - f.dx * 9 + (l > 0 ? -5 : 5), f.y - f.dy * 9, 2.8, K.chiaro(mg, 0.65));
    });
    return { corpo: s + cuffs, collar: colletto(K, k, { fill: mg, ty: 296, tw: 15 }), T: T, k: k, q: q, fine: "" };
  }
  A.pezzo("capo", "camicia", function (K) { var b = buildCamicia(K, K.maglia); return { corpo: b.corpo + b.collar }; });

  // =========================================================
  //  GIACCA (blazer aperto con revers)
  // =========================================================
  A.pezzo("capo", "giacca", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", cam = K.lum(mg) > 0.8 ? "#cdd5ea" : "#f4f5f9", kc = colori(K, cam);
    var T = K.busto({ agio: 7, orlo: 548, scollo: { tipo: "v", prof: 40, larg: 6 }, curvaOrlo: 9, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 7 });
    s += M.svg + K.Pa(T, K.cil(mg, 0.8));
    var ie = [[nk + 3, 242], [nk + 5, 262], [nk * 0.3 + 22, 304], [18, 360], [17, 420], [19, 466]];
    var L = ie.map(function (q) { return [C - q[0], q[1]]; }), R = ie.map(function (q) { return [C + q[0], q[1]]; }), Rr = R.slice().reverse();
    var cd = K.liscio(L) + "Q" + C + " " + (L[L.length - 1][1] + 12) + " " + n1(Rr[0][0]) + " " + n1(Rr[0][1]) + K.cr(Rr) + "Z";
    // sulla giacca: luci e ombre
    s += "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 1.1 }) + K.St("M" + (C - B.hp + 4) + " 540C" + (C - 30) + " 552 " + (C + 30) + " 552 " + (C + B.hp - 4) + " 540", k.mdd, 3, 0.3) + "</g>";
    // la camicia bianca nell'apertura
    s += K.Pa(cd, cilU(K, cam, C - 34, C + 34, 0.7)) + "<g clip-path='" + K.clip(cd) + "'>" + K.St(K.liscio(L), k.mdd, 11, 0.4) + K.St(K.liscio(R), k.mdd, 11, 0.5) + K.El(C, 250, nk + 4, 12, K.soft(kc.mdd, 0.4)) +
      K.St("M" + C + " 270L" + C + " 466", kc.mdd, 1.2, 0.3);
    for (var i = 0; i < 3; i++) s += bottone(K, C, 330 + i * 46, 2.8, "#ffffff");
    s += K.St("M" + (C - nk - 3) + " 240C" + (C - nk) + " 258 " + (C + nk) + " 258 " + (C + nk + 3) + " 240", "#ffffff", 8, 0.95) + "</g>";
    s += K.Pa("M" + (C - nk - 4) + " 238L" + (C - nk - 12) + " 268L" + (C - 4) + " 262Z", cam) + K.Pa("M" + (C + nk + 4) + " 238L" + (C + nk + 12) + " 268L" + (C + 4) + " 262Z", K.mix(cam, "#c9ccd6", 0.5));
    // i revers
    [-1, 1].forEach(function (l) {
      var X = function (v) { return n1(C + l * v); };
      var lp = "M" + X(nk + 2) + " 240L" + X(nk + 34) + " 267L" + X(nk + 25) + " 282L" + X(22) + " 424L" + X(17) + " 420C" + X(17) + " 400 " + X(18) + " 380 " + X(18) + " 360C" + X(18) + " 336 " + X(nk * 0.3 + 22) + " 316 " + X(nk * 0.3 + 22) + " 304C" + X(nk + 7) + " 288 " + X(nk + 5) + " 272 " + X(nk + 5) + " 262Z";
      s += K.El(C + l * (nk + 16), 300, 20, 30, K.soft("#000000", 0.3));
      s += K.Pa(lp, K.LG("vl" + (uid++), 0, 0, 1, 1, [[0, K.mix(mg, "#ffffff", l < 0 ? 0.4 : 0.26)], [0.6, K.mix(mg, "#ffffff", 0.08)], [1, mg]]));
      s += "<g clip-path='" + K.clip(lp) + "'>" + K.St("M" + X(nk + 32) + " 270L" + X(24) + " 420", "#ffffff", 4, 0.2) + K.St("M" + X(nk + 22) + " 290L" + X(20) + " 418", k.mdd, 3, 0.2) + "</g>" + K.St(lp, k.mdd, 1.5, 0.5) + K.St("M" + X(nk + 34) + " 267L" + X(nk + 25) + " 282L" + X(22) + " 424", k.mdd, 1.4, 0.55) + K.St("M" + X(nk + 31) + " 268L" + X(nk + 8) + " 246", "#ffffff", 1, 0.3) +
        K.St("M" + X(nk + 26) + " 285L" + X(23) + " 421", "#ffffff", 1, 0.3, " stroke-dasharray='3 3'");
    });
    // taschini a patta, taschino sul petto, bottone, polsini
    var p0 = B.hp * 0.42, p1 = B.hp * 0.9;
    [-1, 1].forEach(function (l) {
      var X = function (v) { return n1(C + l * v); };
      s += K.Pa("M" + X(p1) + " 488L" + X(p0) + " 484L" + X(p0) + " 498L" + X(p1) + " 502Z", K.mix(mg, "#000000", 0.12), " stroke='" + k.mdd + "' stroke-width='1.2' stroke-opacity='.5' stroke-linejoin='round'") + K.St("M" + X(p1) + " 489L" + X(p0) + " 485", "#ffffff", 1.2, 0.3) + K.St("M" + X(p1 - 2) + " 503L" + X(p0 + 2) + " 499", "#000000", 3, 0.2);
    });
    if (K.m) s += K.St("M" + (C + B.ch * 0.55 - 12) + " 372L" + (C + B.ch * 0.55 + 12) + " 366", k.mdd, 2.4, 0.6) + K.St("M" + (C + B.ch * 0.55 - 12) + " 370L" + (C + B.ch * 0.55 + 12) + " 364", "#ffffff", 1.1, 0.3) + K.Pa("M" + (C + B.ch * 0.55 - 8) + " 369L" + (C + B.ch * 0.55 - 4) + " 360L" + (C + B.ch * 0.55 + 2) + " 367Z", "#f4f5f9");
    s += bottone(K, C - 26, 438, 4, K.mix(mg, "#000000", 0.35));
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1), w = f.w + 7, px = -f.dy, py = f.dx;
      s += K.St("M" + n1(f.x - f.dx * 18 - px * w * 0.5) + " " + n1(f.y - f.dy * 18 - py * w * 0.5) + "L" + n1(f.x - f.dx * 18 + px * w * 0.5) + " " + n1(f.y - f.dy * 18 + py * w * 0.5), k.mdd, 1.4, 0.5);
      for (var j = 0; j < 3; j++) s += bottone(K, f.x - f.dx * (8 + j * 0) + px * (j - 1) * w * 0.26, f.y - f.dy * 8 + py * (j - 1) * w * 0.26, 2.5, K.mix(mg, "#000000", 0.3));
    });
    return { corpo: s };
  });

  // =========================================================
  //  BOMBER (cerniera e costine)
  // =========================================================
  A.pezzo("capo", "bomber", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", rib = K.mix(mg, k.mdd, 0.3);
    var T = K.busto({ agio: 9, orlo: 506, scollo: { tipo: "v", prof: 30, larg: 6 }, svasa: -5, curvaOrlo: 5, pancia: B.pancia ? 8 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 10, forza: 1.05, pol: [20, rib, k.mdd] });
    s += M.svg + K.Pa(T, K.cil(mg, 0.9));
    var q = "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 1.4, noPieghe: false });
    q += K.St("M" + (C - B.ch + 8) + " 330C" + (C - B.ch + 12) + " 360 " + (C - B.ch + 14) + " 400 " + (C - B.ch + 8) + " 440", "#ffffff", 7, 0.1) + K.St("M" + (C - B.ch + 20) + " 340C" + (C - B.ch + 22) + " 370 " + (C - B.ch + 24) + " 410 " + (C - B.ch + 20) + " 450", "#ffffff", 2.4, 0.2);
    q += K.El(C + 52, 430, 24, 80, K.soft("#000000", 0.28));
    // tasche a zip oblique
    [-1, 1].forEach(function (l) {
      var d = "M" + (C + l * (B.wt - 2)) + " 432L" + (C + l * 32) + " 458";
      q += K.St(d, "#000000", 4.6, 0.7) + K.St(d, "#b8bcc4", 2.2, 0.85, " stroke-dasharray='1.6 1.6'") + K.Pa("M" + (C + l * (B.wt - 8)) + " 430L" + (C + l * (B.wt + 6)) + " 428L" + (C + l * (B.wt + 6)) + " 440Z", k.md, " opacity='.7'");
    });
    q += costineOrlo(K, k, 506, 24, rib) + "</g>";
    s += q + "<g clip-path='" + K.clip(T) + "'>" + bordo(K, T, k, 4) + "</g>";
    s += cerniera(K, C, 296, 504) + tiretta(K, C, 292);
    // colletto a costine rialzato (a V)
    var cd = "M" + (C - nk - 6) + " 232C" + (C - nk - 12) + " 256 " + (C - nk * 0.5) + " 280 " + (C - 2) + " 300L" + (C + 2) + " 300C" + (C + nk * 0.5) + " 280 " + (C + nk + 12) + " 256 " + (C + nk + 6) + " 232";
    s += K.St(cd, "#000000", 14, 0.25) + K.St(cd, rib, 12.5, 1) + K.St(cd, "#ffffff", 2, 0.22) + K.St("M" + (C - nk + 1) + " 236C" + (C - nk - 3) + " 256 " + (C - nk * 0.4) + " 276 " + (C - 4) + " 294", k.mdd, 1.6, 0.5) + K.St("M" + (C + nk - 1) + " 236C" + (C + nk + 3) + " 256 " + (C + nk * 0.4) + " 276 " + (C + 4) + " 294", k.mdd, 1.6, 0.5);
    for (var i = 0; i < 9; i++) { var t = i / 8; s += K.St("M" + n1(C - nk - 8 + t * 0 - 0) + " 0", "#000", 0); }
    var tk = pattern(K, 4.4, 4.4, "<path d='M2.2 0L2.2 4.4' stroke='#000' stroke-width='1.2' opacity='.3'/>");
    s += K.St(cd, tk, 11.5, 1);
    return { corpo: s };
  });

  // =========================================================
  //  MAGLIONE (a maglia, con costine e treccia)
  // =========================================================
  A.pezzo("capo", "maglione", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", rib = K.mix(mg, k.mdd, 0.18);
    var T = K.busto({ agio: 9, orlo: 520, scollo: { prof: 14, larg: 7 }, svasa: -2, pancia: B.pancia ? 8 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 11, pol: [20, rib, k.mdd] });
    var trama = pattern(K, 9, 10, "<path d='M0.5 1L4.5 8L8.5 1' fill='none' stroke='#1a0a10' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' opacity='.2'/><path d='M1.5 0.4L4.5 6L7.5 0.4' fill='none' stroke='#ffffff' stroke-width='1' stroke-linecap='round' opacity='.17'/>");
    s += M.svg + K.Pa(T, K.cil(mg, 0.8));
    M.ds.forEach(function (d) { s += K.Pa(d, trama); });
    s += K.Pa(T, trama);
    var q = "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 1.2 });
    // treccia al centro
    var tr = "";
    for (var y = 300; y < 480; y += 34) tr += "M" + (C - 15) + " " + y + "C" + (C - 15) + " " + (y + 10) + " " + (C + 3) + " " + (y + 10) + " " + (C + 3) + " " + (y + 17) + "C" + (C + 3) + " " + (y + 26) + " " + (C - 15) + " " + (y + 26) + " " + (C - 15) + " " + (y + 34) + "M" + (C + 15) + " " + y + "C" + (C + 15) + " " + (y + 10) + " " + (C - 3) + " " + (y + 10) + " " + (C - 3) + " " + (y + 17) + "C" + (C - 3) + " " + (y + 26) + " " + (C + 15) + " " + (y + 26) + " " + (C + 15) + " " + (y + 34);
    q += K.St(tr, "#1a0a10", 5, 0.2) + K.St(tr, K.chiaro(mg, 0.45), 3.2, 0.5) + K.St(tr, "#ffffff", 1, 0.25);
    q += K.St("M" + (C - 24) + " 296L" + (C - 24) + " 490", k.mdd, 1.6, 0.3) + K.St("M" + (C + 24) + " 296L" + (C + 24) + " 490", k.mdd, 1.6, 0.3);
    q += costineOrlo(K, k, 520, 26, rib) + "</g>";
    s += q + "<g clip-path='" + K.clip(T) + "'>" + bordo(K, T, k, 5) + "</g>";
    s += stampa(K, T);
    // collo a costine spesse
    var cd = "M" + (C - nk - 5) + " 238C" + (C - nk + 2) + " 262 " + (C + nk - 2) + " 262 " + (C + nk + 5) + " 238";
    s += K.St(cd, "#000000", 14, 0.18) + K.St(cd, rib, 12, 1) + K.St(cd, costine(K), 11, 1) + K.St("M" + (C - nk - 2) + " 235C" + (C - nk + 5) + " 256 " + (C + nk - 5) + " 256 " + (C + nk + 2) + " 235", "#ffffff", 1.6, 0.4);
    return { corpo: s };
  });

  // =========================================================
  //  COLLO ALTO e DOLCEVITA
  // =========================================================
  A.pezzo("capo", "dolcevita", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "";
    var T = K.busto({ agio: 3, orlo: 512, scollo: { prof: 4, larg: 5 }, pancia: B.pancia ? 5 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 4, pol: [14, K.mix(mg, k.mdd, 0.1), k.mdd] });
    var trama = pattern(K, 6, 10, "<rect x='2.2' y='0' width='1.2' height='10' fill='#1a0a10' opacity='.1'/>");
    s += M.svg + K.Pa(T, K.cil(mg, 0.8));
    s += "<g clip-path='" + K.clip(T) + "'>" + K.Pa(T, trama) + ombra(K, k, { q: 1 }) + K.St("M" + (C - B.hp + 2) + " 502C" + (C - 20) + " 510 " + (C + 20) + " 510 " + (C + B.hp - 2) + " 502", k.mdd, 2, 0.3) + bordo(K, T, k, 4) + "</g>";
    s += stampa(K, T);
    // il collo alto a rotolo (due risvolti)
    var w = nk + 8, cl = "M" + (C - w - 1) + " 258C" + (C - w - 3) + " 244 " + (C - w) + " 230 " + (C - w + 4) + " 224C" + (C - w + 12) + " 219 " + (C + w - 12) + " 219 " + (C + w - 4) + " 224C" + (C + w) + " 230 " + (C + w + 3) + " 244 " + (C + w + 1) + " 258C" + (C + w - 4) + " 268 " + (C - w + 4) + " 268 " + (C - w - 1) + " 258Z";
    s += K.Pa(cl, cilU(K, mg, C - w - 3, C + w + 3, 0.9)) + "<g clip-path='" + K.clip(cl) + "'>" + K.Pa(cl, trama) +
      K.St("M" + (C - w - 4) + " 241C" + (C - w + 10) + " 249 " + (C + w - 10) + " 249 " + (C + w + 4) + " 241", k.mdd, 2.4, 0.4) + K.St("M" + (C - w - 4) + " 244C" + (C - w + 10) + " 252 " + (C + w - 10) + " 252 " + (C + w + 4) + " 244", "#ffffff", 1.2, 0.3) +
      K.El(C - w * 0.4, 236, 12, 14, K.soft("#ffffff", 0.2)) + K.El(C, 262, w + 4, 8, K.soft(k.mdd, 0.45)) + K.El(C, 224, w, 6, K.soft(k.mdd, 0.3)) + "</g>" +
      K.St("M" + (C - w - 1) + " 258C" + (C - w + 4) + " 268 " + (C + w - 4) + " 268 " + (C + w + 1) + " 258", k.mdd, 1.6, 0.5);
    return { corpo: s };
  });

  // =========================================================
  //  COLLO / POLO
  // =========================================================
  A.pezzo("capo", "polo", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", ct = contrasto(K, mg), fascia = K.lum(mg) > 0.6 ? K.mix(mg, k.mdd, 0.55) : K.mix(mg, "#ffffff", 0.7);
    var T = K.busto({ agio: 6, orlo: 514, scollo: { tipo: "v", prof: 26, larg: 3 }, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 0.32, agio: 9, pol: [13, fascia, k.mdd, { liscio: true }] });
    s += M.svg + K.Pa(T, K.cil(mg, 0.75));
    var piq = pattern(K, 4, 4, "<circle cx='1' cy='1' r='.8' fill='#1a0a10' opacity='.1'/><circle cx='3' cy='3' r='.8' fill='#1a0a10' opacity='.1'/>");
    s += "<g clip-path='" + K.clip(T) + "'>" + K.Pa(T, piq) + ombra(K, k, { q: 1 });
    // la patta con i bottoni
    s += K.Pa("M" + (C - 8) + " 262L" + (C + 8) + " 262L" + (C + 8) + " 332L" + (C - 8) + " 332Z", K.mix(mg, "#ffffff", 0.08)) + K.St("M" + (C - 8) + " 264L" + (C - 8) + " 332", k.mdd, 1.3, 0.45) + K.St("M" + (C + 8) + " 264L" + (C + 8) + " 332", k.mdd, 1.3, 0.5) + K.St("M" + (C - 8) + " 332L" + (C + 8) + " 332", k.mdd, 1.4, 0.5);
    s += bottone(K, C, 286, 3.4, K.chiaro(mg, 0.6)) + bottone(K, C, 312, 3.4, K.chiaro(mg, 0.6));
    s += K.St("M" + (C - B.hp + 2) + " 506C" + (C - 20) + " 514 " + (C + 20) + " 514 " + (C + B.hp - 2) + " 506", k.mdd, 2, 0.3) + K.Pa("M" + (C - 200) + " 496Q" + C + " 504 " + (C + 200) + " 496L" + (C + 200) + " 540L" + (C - 200) + " 540Z", k.md, " opacity='.16'") + "</g>";
    s += "<g clip-path='" + K.clip(T) + "'>" + bordo(K, T, k, 4) + "</g>" + stampa(K, T);
    s += colletto(K, { mg: mg, mdd: k.mdd }, { fill: K.mix(mg, "#ffffff", 0.06), ty: 284, tw: 12, top: 236, cy: 262 });
    return { corpo: s };
  });

  // =========================================================
  //  CANOTTA
  // =========================================================
  A.pezzo("capo", "canotta", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "";
    var T = K.busto({ agio: 4, orlo: 512, smanicato: true, spallina: K.m ? 26 : 20, scollo: { prof: 40, larg: 8 }, pancia: B.pancia ? 6 : 0 });
    s += K.Pa(T, K.cil(mg, 0.8)) + "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 1 }) + K.St("M" + (C - B.hp + 2) + " 504C" + (C - 20) + " 512 " + (C + 20) + " 512 " + (C + B.hp - 2) + " 504", k.mdd, 2, 0.35) + bordo(K, T, k, 7) + "</g>" + stampa(K, T);
    return { corpo: s };
  });

  // =========================================================
  //  MAGLIA DA CALCIO
  // =========================================================
  A.pezzo("capo", "calcio", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", ct = contrasto(K, mg);
    var T = K.busto({ agio: 5, orlo: 514, scollo: { tipo: "v", prof: 30, larg: 4 }, pancia: B.pancia ? 5 : 0 });
    var M = maniche(K, mg, { lung: 0.34, agio: 8, pol: [13, ct, k.mdd, { liscio: true }] });
    var rete = pattern(K, 5, 5, "<circle cx='1.25' cy='1.25' r='.7' fill='#000' opacity='.1'/><circle cx='3.75' cy='3.75' r='.7' fill='#000' opacity='.1'/>");
    s += M.svg + K.Pa(T, K.cil(mg, 0.75));
    s += "<g clip-path='" + K.clip(T) + "'>" + K.Pa(T, rete) + ombra(K, k, { q: 1 });
    // fasce laterali a contrasto
    s += K.St("M" + (C - B.ap - 4) + " 336C" + (C - B.ch - 5) + " 370 " + (C - B.wt - 5) + " 440 " + (C - B.hp - 5) + " 520", ct, 9, 0.22) + K.St("M" + (C + B.ap + 4) + " 336C" + (C + B.ch + 5) + " 370 " + (C + B.wt + 5) + " 440 " + (C + B.hp + 5) + " 520", ct, 9, 0.22);
    // numero sul petto e stemma
    s += "<text x='" + C + "' y='" + (Y.petto + 62) + "' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='60' fill='" + ct + "' opacity='.92'>10</text>";
    s += K.Pa("M" + (C + B.ch * 0.42 - 8) + " 346L" + (C + B.ch * 0.42 + 8) + " 346L" + (C + B.ch * 0.42 + 8) + " 358C" + (C + B.ch * 0.42 + 8) + " 366 " + (C + B.ch * 0.42) + " 370 " + (C + B.ch * 0.42) + " 370C" + (C + B.ch * 0.42) + " 370 " + (C + B.ch * 0.42 - 8) + " 366 " + (C + B.ch * 0.42 - 8) + " 358Z", ct, " opacity='.88'");
    s += K.St("M" + (C - B.hp + 2) + " 506C" + (C - 20) + " 514 " + (C + 20) + " 514 " + (C + B.hp - 2) + " 506", k.mdd, 2, 0.3) + "</g>";
    s += "<g clip-path='" + K.clip(T) + "'>" + bordo(K, T, k, 4) + "</g>";
    // colletto a V a contrasto
    var v = "M" + (C - nk - 5) + " 238L" + C + " 276L" + (C + nk + 5) + " 238";
    s += K.St(v, "#000000", 9.5, 0.2) + K.St(v, ct, 8, 1) + K.St("M" + (C - nk - 4) + " 236L" + C + " 273", "#ffffff", 1.2, 0.4);
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 0.34);
      s += K.St("M" + n1(f.x - f.dx * 20 - f.dy * -(f.w + 8) * 0.5) + " " + n1(f.y - f.dy * 20 + f.dx * -(f.w + 8) * 0.5) + "L" + n1(f.x - f.dx * 20 - f.dy * (f.w + 8) * 0.5) + " " + n1(f.y - f.dy * 20 + f.dx * (f.w + 8) * 0.5), ct, 3, 0.9);
    });
    return { corpo: s };
  });

  // =========================================================
  //  GIACCA DELLA TUTA (cerniera, due righe sulle maniche)
  // =========================================================
  A.pezzo("capo", "sportiva", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", ct = contrasto(K, mg), rib = K.mix(mg, k.mdd, 0.22);
    var T = K.busto({ agio: 7, orlo: 514, scollo: { tipo: "v", prof: 22, larg: 5 }, svasa: -2, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 8, pol: [15, rib, k.mdd] });
    s += M.svg + K.Pa(T, K.cil(mg, 0.85));
    // righe lungo le maniche (sul lato esterno) e sul fianco
    [-1, 1].forEach(function (l, i) {
      var N = K.BR[l].nodi, off = function (t) { return N.map(function (q, j) { var a = N[Math.max(0, j - 1)], b = N[Math.min(N.length - 1, j + 1)], dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1, nx = -dy / ln, ny = dx / ln; if (nx * l < 0) { nx = -nx; ny = -ny; } return [q[0] + nx * q[2] * t, q[1] + ny * q[2] * t, 4]; }); };
      s += "<g clip-path='" + K.clip(M.ds[i]) + "'>" + K.Pa(K.limb(off(0.18).slice(1)), ct, " opacity='.95'") + K.Pa(K.limb(off(0.36).slice(1)), ct, " opacity='.95'") + "</g>";
    });
    s += "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 1.1 });
    s += K.St("M" + (C - B.ap - 2) + " 340C" + (C - B.ch - 2) + " 372 " + (C - B.wt - 2) + " 440 " + (C - B.hp - 2) + " 516", ct, 3, 0.9) + K.St("M" + (C + B.ap + 2) + " 340C" + (C + B.ch + 2) + " 372 " + (C + B.wt + 2) + " 440 " + (C + B.hp + 2) + " 516", ct, 3, 0.9);
    [-1, 1].forEach(function (l) { var d = "M" + (C + l * (B.wt - 4)) + " 440L" + (C + l * 30) + " 462"; s += K.St(d, "#000000", 4.2, 0.55) + K.St(d, "#aeb3bc", 2, 0.8, " stroke-dasharray='1.6 1.6'"); });
    s += costineOrlo(K, k, 514, 14, rib) + "</g>" + "<g clip-path='" + K.clip(T) + "'>" + bordo(K, T, k, 4) + "</g>";
    s += cerniera(K, C, 290, 512) + tiretta(K, C, 286);
    // colletto alto aperto
    var cd = "M" + (C - nk - 6) + " 230C" + (C - nk - 11) + " 252 " + (C - nk * 0.6) + " 270 " + (C - 2) + " 290L" + (C + 2) + " 290C" + (C + nk * 0.6) + " 270 " + (C + nk + 11) + " 252 " + (C + nk + 6) + " 230";
    s += K.St(cd, "#000000", 13, 0.22) + K.St(cd, rib, 11.5, 1) + K.St(cd, ct, 1.8, 0.9, " transform='translate(0 -1)'") + K.St(cd, "#ffffff", 1.4, 0.25, " transform='translate(0 4)'");
    return { corpo: s };
  });

  // =========================================================
  //  CROP (donna): maglietta corta, pancia scoperta
  // =========================================================
  A.pezzo("capo", "crop", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, s = "";
    var T = torsoCorto(K, 414, { agio: 4, prof: 16, larg: 4, curva: 5 });
    var M = maniche(K, mg, { lung: 0.3, agio: 7, pol: [9, K.mix(mg, k.mdd, 0.08), k.mdd, { liscio: true }] });
    s += M.svg + K.Pa(T, K.cil(mg, 0.75)) + "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 0.8, noPieghe: true, noPancia: true }) +
      K.St("M" + (C - B.ch + 2) + " 404C" + (C - 20) + " 412 " + (C + 20) + " 412 " + (C + B.ch - 2) + " 404", k.mdd, 2, 0.4) + K.Pa("M" + (C - 200) + " 400Q" + C + " 408 " + (C + 200) + " 400L" + (C + 200) + " 440L" + (C - 200) + " 440Z", k.md, " opacity='.22'") + bordo(K, T, k, 4) + "</g>" + stampa(K, T);
    var nk = B.nk;
    s += K.St("M" + (C - nk - 5) + " 241C" + (C - nk + 2) + " 263 " + (C + nk - 2) + " 263 " + (C + nk + 5) + " 241", K.mix(mg, "#000000", 0.22), 7, 0.95) + K.St("M" + (C - nk - 3) + " 238C" + (C - nk + 4) + " 259 " + (C + nk - 4) + " 259 " + (C + nk + 3) + " 238", K.chiaro(mg, 0.35), 1.8, 0.45);
    return { corpo: s };
  });

  // =========================================================
  //  TOP (donna): senza spalline, spalle e pancia scoperte
  // =========================================================
  A.pezzo("capo", "top", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, s = "", xa = B.ap + 2, bs = B.seno || 1;
    var side = function (l) { return [[C + l * xa, 348], [C + l * (B.ch + 3), 384], [C + l * (B.wt + 4), 436]]; };
    var R = side(1), Lp = side(-1).reverse();
    var topPts = [[C - xa, 348], [C - 54, 340], [C - 27, 332 - 2 * bs], [C, 354], [C + 27, 332 - 2 * bs], [C + 54, 340], [C + xa, 348]];
    var d = K.liscio(topPts) + "L" + n1(R[1][0]) + " " + n1(R[1][1]) + "L" + n1(R[2][0]) + " " + R[2][1] + "Q" + C + " 442 " + n1(Lp[0][0]) + " " + Lp[0][1] + "L" + n1(Lp[1][0]) + " " + Lp[1][1] + "Z";
    s += K.Pa(d, K.cil(mg, 0.75)) + "<g clip-path='" + K.clip(d) + "'>" + ombra(K, k, { q: 0.7, noPieghe: true, noPancia: true });
    // arricciature dal centro
    for (var i = -3; i <= 3; i++) { if (!i) continue; var x0 = C + i * 5; s += K.St("M" + x0 + " 356C" + (x0 + i * 7) + " 380 " + (C + i * 11) + " 410 " + (C + i * 13) + " 440", k.mdd, 2.2, 0.2) + K.St("M" + (x0 + 2) + " 358C" + (x0 + i * 7 + 2) + " 382 " + (C + i * 11 + 2) + " 410 " + (C + i * 13 + 2) + " 440", "#ffffff", 1, 0.16); }
    s += K.Pa("M" + (C - 200) + " 424Q" + C + " 432 " + (C + 200) + " 424L" + (C + 200) + " 460L" + (C - 200) + " 460Z", k.md, " opacity='.2'") + bordo(K, d, k, 5) + "</g>";
    s += K.St(K.liscio(topPts), "#ffffff", 1.4, 0.35) + stampa(K, d);
    return { corpo: s };
  });

  // =========================================================
  //  CAMICETTA (donna): scollo a V con fiocco, maniche a sbuffo
  // =========================================================
  A.pezzo("capo", "camicetta", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "";
    var T = K.busto({ agio: 8, orlo: 526, scollo: { tipo: "v", prof: 34, larg: 4 }, svasa: 6, curvaOrlo: 9, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 11, svasa: 2, pol: [12, K.mix(mg, "#ffffff", 0.05), k.mdd, { liscio: true }] });
    var seta = pattern(K, 12, 12, "<path d='M0 6Q3 2 6 6T12 6' fill='none' stroke='#fff' stroke-width='.7' opacity='.1'/>");
    s += M.svg;
    M.ds.forEach(function (d) { s += K.Pa(d, seta); });
    s += K.Pa(T, K.cil(mg, 0.7)) + "<g clip-path='" + K.clip(T) + "'>" + K.Pa(T, seta) + ombra(K, k, { q: 1.1 });
    s += K.St("M" + (C - 14) + " 300C" + (C - 20) + " 360 " + (C - 28) + " 430 " + (C - 40) + " 524", k.mdd, 4, 0.1) + K.St("M" + (C + 22) + " 300C" + (C + 28) + " 360 " + (C + 38) + " 430 " + (C + 50) + " 524", k.mdd, 5, 0.12) + K.St("M" + (C - 8) + " 296L" + (C - 8) + " 520", k.mdd, 1.2, 0.25);
    s += K.St("M" + (C - B.hp - 4) + " 516C" + (C - 20) + " 528 " + (C + 20) + " 528 " + (C + B.hp + 4) + " 516", k.mdd, 2, 0.3) + bordo(K, T, k, 4) + "</g>";
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1), px = -f.dy, py = f.dx, w = f.w + 11;
      for (var i = -2; i <= 2; i++) s += K.St("M" + n1(f.x - f.dx * 14 + px * i * w * 0.17) + " " + n1(f.y - f.dy * 14 + py * i * w * 0.17) + "L" + n1(f.x - f.dx * 30 + px * i * w * 0.2) + " " + n1(f.y - f.dy * 30 + py * i * w * 0.2), k.mdd, 1.2, 0.26);
    });
    // fiocco al collo
    var cx = C, cy = 262, col = K.mix(mg, "#ffffff", 0.08);
    [-1, 1].forEach(function (l) {
      s += K.Pa("M" + (cx + l * 5) + " " + (cy + 4) + "C" + (cx + l * 8) + " " + (cy + 34) + " " + (cx + l * 14) + " " + (cy + 58) + " " + (cx + l * 20) + " " + (cy + 72) + "L" + (cx + l * 6) + " " + (cy + 64) + "C" + (cx + l * 2) + " " + (cy + 40) + " " + (cx - l * 2) + " " + (cy + 20) + " " + (cx - l * 2) + " " + (cy + 6) + "Z", K.cil(col, 0.8)) +
        K.Pa("M" + (cx + l * 4) + " " + cy + "C" + (cx + l * 22) + " " + (cy - 18) + " " + (cx + l * 40) + " " + (cy - 12) + " " + (cx + l * 38) + " " + (cy + 4) + "C" + (cx + l * 36) + " " + (cy + 18) + " " + (cx + l * 16) + " " + (cy + 10) + " " + (cx + l * 4) + " " + cy + "Z", K.cil(col, 0.8)) +
        K.St("M" + (cx + l * 8) + " " + cy + "C" + (cx + l * 22) + " " + (cy - 8) + " " + (cx + l * 32) + " " + (cy - 6) + " " + (cx + l * 35) + " " + (cy + 2), k.mdd, 1.2, 0.4);
    });
    s += K.Pa("M" + (cx - 7) + " " + (cy - 6) + "C" + (cx - 7) + " " + (cy - 12) + " " + (cx + 7) + " " + (cy - 12) + " " + (cx + 7) + " " + (cy - 6) + "L" + (cx + 7) + " " + (cy + 8) + "C" + (cx + 7) + " " + (cy + 14) + " " + (cx - 7) + " " + (cy + 14) + " " + (cx - 7) + " " + (cy + 8) + "Z", K.cil(col, 0.9)) + K.St("M" + (cx - 3) + " " + (cy - 8) + "L" + (cx - 3) + " " + (cy + 10), "#ffffff", 1, 0.4);
    return { corpo: s };
  });

  // =========================================================
  //  CARDIGAN (aperto, maglietta chiara sotto)
  // =========================================================
  A.pezzo("capo", "cardigan", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", rib = K.mix(mg, k.mdd, 0.18), sotto = K.lum(mg) > 0.75 ? "#d7dae6" : "#f6f6fa";
    var T = K.busto({ agio: 8, orlo: 526, scollo: { tipo: "v", prof: 44, larg: 5 }, svasa: -1, curvaOrlo: 8, pancia: B.pancia ? 7 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 9, pol: [17, rib, k.mdd] });
    var trama = pattern(K, 7, 8, "<path d='M0.5 .8L3.5 6.5L6.5 .8' fill='none' stroke='#1a0a10' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' opacity='.14'/>");
    s += M.svg + K.Pa(T, K.cil(mg, 0.8));
    // la maglietta di sotto nell'apertura
    var ie = [[nk + 6, 244], [nk + 12, 276], [28, 330], [24, 400], [24, 470], [24, 524]];
    var L = ie.map(function (q) { return [C - q[0], q[1]]; }), R = ie.map(function (q) { return [C + q[0], q[1]]; }), Rr = R.slice().reverse();
    var cd = K.liscio(L) + "Q" + C + " 534 " + n1(Rr[0][0]) + " " + n1(Rr[0][1]) + K.cr(Rr) + "Z";
    s += "<g clip-path='" + K.clip(T) + "'>" + K.Pa(T, trama) + ombra(K, k, { q: 1.1 }) + "</g>";
    s += K.Pa(cd, cilU(K, sotto, C - 40, C + 40, 0.7)) + "<g clip-path='" + K.clip(cd) + "'>" + K.St(K.liscio(L), k.mdd, 12, 0.45) + K.St(K.liscio(R), k.mdd, 12, 0.5) + K.El(C, 262, 22, 12, K.soft("#000000", 0.2)) + "</g>";
    s += K.St("M" + (C - nk - 3) + " 240C" + (C - nk) + " 262 " + (C + nk) + " 262 " + (C + nk + 3) + " 240", K.mix(sotto, "#000000", 0.15), 7, 0.95);
    // bande dei bottoni a costine lungo i bordi
    [-1, 1].forEach(function (l) {
      var X = function (q) { return [C + l * q[0], q[1]]; };
      var band = ie.map(function (q) { return [C + l * (q[0] + 8), q[1]]; });
      var pb = K.limb(band.map(function (q) { return [q[0], q[1], 14]; }));
      s += K.Pa(pb, cilU(K, rib, C + l * 24 - 18, C + l * 24 + 18, 0.8)) + "<g clip-path='" + K.clip(pb) + "'>" + K.Pa(pb, pattern(K, 10, 5, "<rect y='2.2' width='10' height='1.5' fill='#1a0a10' opacity='.24'/>")) + "</g>" + K.St(K.liscio(ie.map(X)), k.mdd, 1.6, 0.5);
      for (var i = 0; i < 4; i++) { var by = 340 + i * 42, bx = C + l * 32; if (l < 0) s += bottone(K, bx, by, 3.6, K.mix(mg, "#ffffff", 0.3)); }
    });
    s += "<g clip-path='" + K.clip(T) + "'>" + costineOrlo(K, k, 526, 20, rib) + bordo(K, T, k, 4) + "</g>";
    // tasche
    [-1, 1].forEach(function (l) { var X = function (v) { return n1(C + l * v); }; s += K.Pa("M" + X(B.hp * 0.9) + " 472L" + X(B.hp * 0.45) + " 470L" + X(B.hp * 0.45) + " 500L" + X(B.hp * 0.9) + " 502Z", K.mix(mg, "#000000", 0.07), " opacity='.45'") + K.St("M" + X(B.hp * 0.9) + " 472L" + X(B.hp * 0.45) + " 470L" + X(B.hp * 0.45) + " 500L" + X(B.hp * 0.9) + " 502Z", k.mdd, 1.2, 0.4, " stroke-dasharray='3 2.5'"); });
    return { corpo: s };
  });

  // =========================================================
  //  GILET (sopra una camicia bianca)
  // =========================================================
  A.pezzo("capo", "gilet", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "";
    var cam = buildCamicia(K, K.lum(mg) > 0.8 ? "#cdd5ea" : "#f3f4f9", {});
    s += cam.corpo;
    var T = K.busto({ agio: 5, orlo: 520, smanicato: true, spallina: 22, scollo: { tipo: "v", prof: 104, larg: 5 }, curvaOrlo: 34, pancia: B.pancia ? 5 : 0 });
    s += K.Pa(T, K.cil(mg, 0.85)) + "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 1.1, noPieghe: true }) + K.St("M" + (C - B.ap + 4) + " 296C" + (C - B.ch + 6) + " 330 " + (C - B.ch + 8) + " 400 " + (C - B.wt + 6) + " 470", "#ffffff", 4, 0.12);
    var lin = pattern(K, 5, 5, "<path d='M0 5L5 0' stroke='#fff' stroke-width='.6' opacity='.1'/>");
    s += K.Pa(T, lin) + K.St("M" + (C - B.wt) + " 452C" + (C - 30) + " 470 " + (C + 30) + " 470 " + (C + B.wt) + " 452", k.mdd, 1.5, 0.2) + bordo(K, T, k, 6) + "</g>";
    // bottoni, taschini e cordonatura del V
    for (var i = 0; i < 5; i++) s += bottone(K, C, 366 + i * 30, 3.4, K.mix(mg, "#000000", 0.45)) ;
    var pw = B.hp * 0.5;
    [-1, 1].forEach(function (l) { s += K.St("M" + n1(C + l * (pw + 20)) + " 464L" + n1(C + l * (pw - 6)) + " 462", "#000000", 3, 0.4) + K.St("M" + n1(C + l * (pw + 20)) + " 462.5L" + n1(C + l * (pw - 6)) + " 460.5", "#ffffff", 1, 0.25); });
    var vL = "M" + (C - nk - 4 - 22) + " 244L" + C + " " + (240 + 104), vR = "M" + (C + nk + 4 + 22) + " 244L" + C + " " + (240 + 104);
    s += K.St("M" + (C - 22) + " 280L" + (C - 4) + " 336", k.mdd, 0, 0);
    s += cam.collar;
    return { corpo: s };
  });

  // =========================================================
  //  COPRICAPO LUNGO: CAPPOTTO
  // =========================================================
  A.pezzo("capo", "cappotto", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", cam = K.lum(mg) > 0.8 ? "#cdd5ea" : "#f1f2f7", kc = colori(K, cam);
    var T = K.busto({ agio: 8, orlo: 742, scollo: { tipo: "v", prof: 80, larg: 6 }, svasa: 8, curvaOrlo: 10, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 9 });
    var lana = pattern(K, 6, 6, "<path d='M0 6L6 0' stroke='#000' stroke-width='.7' opacity='.1'/>");
    s += M.svg + K.Pa(T, cilU(K, mg, C - 150, C + 150, 0.75)) + "<g clip-path='" + K.clip(T) + "'>" + K.Pa(T, lana) + ombra(K, k, { q: 1.1, noPieghe: true });
    s += pieghe(K, k, 530, 742, 6, 1.2);
    s += K.El(C + 60, 620, 40, 140, K.soft("#000000", 0.16)) + K.El(C - 60, 600, 24, 120, K.soft("#ffffff", 0.08));
    // il doppio petto: bordo che si sovrappone e bottoni
    s += K.Pa("M" + (C + 12) + " 330L" + (C + 12) + " 742L" + (C + 200) + " 742L" + (C + 200) + " 330Z", K.mix(mg, "#000000", 0.0), " opacity='.0'");
    s += K.St("M" + (C - 11) + " 372L" + (C - 11) + " 742", k.mdd, 5, 0.12) + K.St("M" + (C + 12) + " 372C" + (C + 12) + " 520 " + (C + 12) + " 640 " + (C + 12) + " 742", "#000000", 3, 0.28) + K.St("M" + (C + 10) + " 372L" + (C + 10) + " 742", "#ffffff", 1.1, 0.22);
    // tasche con patta
    [-1, 1].forEach(function (l) { var X = function (v) { return n1(C + l * v); }; s += K.Pa("M" + X(B.hp * 0.86) + " 560L" + X(B.hp * 0.3) + " 556L" + X(B.hp * 0.3) + " 580L" + X(B.hp * 0.86) + " 585Z", K.mix(mg, "#000000", 0.1), " opacity='.85'") + K.St("M" + X(B.hp * 0.86) + " 561L" + X(B.hp * 0.3) + " 557", "#ffffff", 1.2, 0.28) + K.St("M" + X(B.hp * 0.84) + " 588L" + X(B.hp * 0.32) + " 583", "#000000", 4, 0.22); });
    s += K.St("M" + (C - B.hp - 18) + " 736C" + (C - 40) + " 752 " + (C + 40) + " 752 " + (C + B.hp + 18) + " 736", k.mdd, 3, 0.3) + "</g>";
    // la camicia nel V
    var inn = "M" + (C - nk - 3) + " 242L" + C + " 330L" + (C + nk + 3) + " 242Z";
    s += K.Pa(inn, cilU(K, cam, C - 40, C + 40, 0.7)) + "<g clip-path='" + K.clip(inn) + "'>" + K.El(C, 250, nk + 6, 14, K.soft(kc.mdd, 0.4)) + "</g>";
    s += K.St("M" + (C - nk - 3) + " 240C" + (C - nk) + " 258 " + (C + nk) + " 258 " + (C + nk + 3) + " 240", "#ffffff", 8, 0.95);
    // revers grandi
    [-1, 1].forEach(function (l) {
      var X = function (v) { return n1(C + l * v); };
      var lp = "M" + X(nk + 2) + " 238L" + X(nk + 38) + " 268L" + X(nk + 30) + " 288L" + X(24) + " 376L" + X(11) + " 372L" + X(4) + " 332C" + X(4) + " 296 " + X(nk * 0.6) + " 270 " + X(nk + 2) + " 238Z";
      s += K.El(C + l * (nk + 14), 300, 22, 34, K.soft("#000000", 0.35));
      s += K.Pa(lp, K.LG("vl" + (uid++), 0, 0, 1, 1, [[0, K.mix(mg, "#ffffff", l < 0 ? 0.28 : 0.14)], [0.6, mg], [1, k.md]])) + "<g clip-path='" + K.clip(lp) + "'>" + K.Pa(lp, lana) + K.St("M" + X(nk + 34) + " 272L" + X(26) + " 372", "#ffffff", 4, 0.18) + K.El(C + l * (nk + 8), 308, 12, 40, K.soft(k.mdd, 0.28)) + "</g>" +
        K.St("M" + X(nk + 38) + " 268L" + X(nk + 30) + " 288L" + X(24) + " 376", k.mdd, 1.5, 0.55) + K.St("M" + X(nk + 34) + " 268L" + X(nk + 6) + " 244", "#ffffff", 1, 0.3);
    });
    // bottoni in due file
    [372, 424, 476].forEach(function (y) { s += bottone(K, C - 22, y, 4, K.mix(mg, "#000000", 0.45)) + bottone(K, C + 24, y, 4, K.mix(mg, "#000000", 0.45)); });
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1), px = -f.dy, py = f.dx, w = f.w + 9;
      s += K.St("M" + n1(f.x - f.dx * 20 - px * w * 0.5) + " " + n1(f.y - f.dy * 20 - py * w * 0.5) + "L" + n1(f.x - f.dx * 20 + px * w * 0.5) + " " + n1(f.y - f.dy * 20 + py * w * 0.5), k.mdd, 1.6, 0.5) + K.St("M" + n1(f.x - f.dx * 3 - px * w * 0.5) + " " + n1(f.y - f.dy * 3 - py * w * 0.5) + "L" + n1(f.x - f.dx * 3 + px * w * 0.5) + " " + n1(f.y - f.dy * 3 + py * w * 0.5), "#ffffff", 1, 0.18) + bottone(K, f.x - f.dx * 12, f.y - f.dy * 12, 3.1, K.mix(mg, "#000000", 0.45));
    });
    return { corpo: s };
  });

  // =========================================================
  //  VESTITO (donna): al ginocchio
  // =========================================================
  function abito(K, lungo) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", ct = K.mix(mg, "#ffffff", 0.0);
    var orlo = lungo ? 942 : 742, T = K.busto(lungo ? { agio: 3, orlo: orlo, smanicato: true, spallina: 12, scollo: { tipo: "v", prof: 62, larg: 8 }, svasa: 6, curvaOrlo: 14 } : { agio: 3, orlo: orlo, scollo: { prof: 26, larg: 10 }, svasa: 8, curvaOrlo: 10, pancia: B.pancia ? 4 : 0 });
    var M = lungo ? { svg: "", ds: [] } : maniche(K, mg, { lung: 0.28, agio: 6, pol: [8, K.mix(mg, k.mdd, 0.05), k.mdd, { liscio: true }] });
    if (!lungo) {   // sotto il vestito le gambe sono nude: coprono i pantaloni di sotto, poi si rimettono le scarpe
      [-1, 1].forEach(function (l) {
        var dg = K.gamba(l, { da: 736, a: 946, curvaOrlo: 2, agio: 5, agioI: 4 }), g = K.gIn(800), kx = C + l * g[0];
        s += K.Pa(dg, K.cil(K.pelle, 0.85)) + "<g clip-path='" + K.clip(dg) + "'>" + K.El(kx + l * 16, 840, 9, 60, K.soft(K.skDD, 0.25)) + K.El(kx - 4, 790, 14, 14, K.soft("#ffffff", 0.18)) + K.El(kx, 748, 26, 14, K.soft(K.skDD, 0.3)) + "</g>";
      });
      var ps = A.pezzoDi("scarpe", K.c.modScarpe), sh = ps ? ps.fn(K) : ""; if (sh && typeof sh === "object") sh = sh.corpo || "";
      s += "<g class='om-scarpe'>" + sh + "</g>";
    }
    s += M.svg + K.Pa(T, cilU(K, mg, C - 150, C + 150, 0.8));
    s += "<g clip-path='" + K.clip(T) + "'>" + ombra(K, k, { q: 1, noPieghe: true });
    // il corpetto stretto e la gonna che si apre
    s += K.El(C + 66, 640, 40, 200, K.soft("#000000", 0.17)) + K.El(C - 70, 600, 22, 140, K.soft("#ffffff", 0.1)) + pieghe(K, k, 452, orlo - 6, lungo ? 8 : 6, 1.3);
    // cintura
    var cb = K.mix(mg, k.mdd, 0.45);
    s += K.Pa("M" + (C - 200) + " 438Q" + C + " 444 " + (C + 200) + " 438L" + (C + 200) + " 456Q" + C + " 462 " + (C - 200) + " 456Z", cilU(K, cb, C - B.wt - 6, C + B.wt + 6, 0.8)) + K.St("M" + (C - 200) + " 439.5Q" + C + " 445.5 " + (C + 200) + " 439.5", "#ffffff", 1.1, 0.3) +
      K.Pa("M" + (C - 8) + " 438L" + (C + 8) + " 438L" + (C + 8) + " 456L" + (C - 8) + " 456Z", "#d9be78", " stroke='#7a5f24' stroke-width='1.3'") + K.Pa("M" + (C - 4) + " 442L" + (C + 4) + " 442L" + (C + 4) + " 452L" + (C - 4) + " 452Z", cb);
    s += K.St("M" + (C - 200) + " " + (orlo - 14) + "Q" + C + " " + (orlo - 4) + " " + (C + 200) + " " + (orlo - 14), "#ffffff", 1.2, 0.35, " stroke-dasharray='3 3'") + K.St("M" + (C - 200) + " " + (orlo - 4) + "Q" + C + " " + (orlo + 6) + " " + (C + 200) + " " + (orlo - 4), k.mdd, 3, 0.28);
    s += bordo(K, T, k, 4) + "</g>";
    s += stampa(K, T);
    if (lungo) {   // spalline del vestito lungo: scollo con orlo
      s += K.St("M" + (C - nk - 4 - 12) + " 244L" + C + " 302L" + (C + nk + 4 + 12) + " 244", K.mix(mg, k.mdd, 0.2), 2.4, 0.9);
    }
    return { corpo: s };
  }
  A.pezzo("capo", "vestito", function (K) { return abito(K, false); });
  A.pezzo("capo", "vestitolungo", function (K) { return abito(K, true); });

  // =========================================================
  //  GREMBIULE (da cuoco, sopra una maglietta)
  // =========================================================
  A.pezzo("capo", "grembiule", function (K) {
    var C = K.C, B = K.B, Y = K.Y, nk = B.nk, base = A.maglia(K, 0.3), s = base.corpo, bianco = "#fbfbfd", k = colori(K, bianco), mg = K.maglia, tess = K.mix(mg, "#ffffff", 0.0);
    var bw = Math.min(B.ch - 14, 50), sw = Math.max(B.wt + 20, B.hp), wb = B.wt + 14;
    // bavaglino, cintura e gonna del grembiule
    var ap = "M" + (C - bw) + " 316C" + (C - bw - 2) + " 360 " + (C - B.wt - 5) + " 410 " + (C - B.wt - 6) + " 452L" + (C - wb) + " 474C" + (C - sw - 4) + " 540 " + (C - sw - 8) + " 640 " + (C - sw - 14) + " 700C" + (C - 40) + " 712 " + (C + 40) + " 712 " + (C + sw + 14) + " 700C" + (C + sw + 8) + " 640 " + (C + sw + 4) + " 540 " + (C + wb) + " 474L" + (C + B.wt + 6) + " 452C" + (C + B.wt + 5) + " 410 " + (C + bw + 2) + " 360 " + (C + bw) + " 316Z";
    // bretella al collo
    [-1, 1].forEach(function (l) {
      var d = "M" + n1(C + l * (bw - 4)) + " 322C" + n1(C + l * (nk + 12)) + " 290 " + n1(C + l * (nk + 6)) + " 262 " + n1(C + l * (nk + 2)) + " 242";
      s += K.St(d, "#000000", 11, 0.18) + K.St(d, K.mix(bianco, "#b9bccb", 0.3), 8.6, 1) + K.St(d, "#ffffff", 2, 0.7, " transform='translate(" + (l * -2) + " 0)'");
    });
    s += K.Pa(ap, cilU(K, bianco, C - sw - 14, C + sw + 14, 0.8)) + "<g clip-path='" + K.clip(ap) + "'>";
    s += K.El(C - 30, 372, 22, 50, K.soft("#ffffff", 0.35)) + K.El(C, 330, bw, 12, K.soft(k.mdd, 0.3)) + K.El(C + sw * 0.8, 600, 30, 130, K.soft("#000000", 0.14));
    s += pieghe(K, { mdd: "#6e7390" }, 480, 706, 6, 1);
    // tasca grande e filetti a colore della maglia
    s += K.Pa("M" + (C - 38) + " 540L" + (C + 38) + " 540L" + (C + 42) + " 600L" + (C - 42) + " 600Z", "#ffffff", " opacity='.55'") + K.St("M" + (C - 38) + " 540L" + (C + 38) + " 540L" + (C + 42) + " 600L" + (C - 42) + " 600Z", "#6e7390", 1.4, 0.55, " stroke-dasharray='4 3'") + K.St("M" + (C - 38) + " 541.5L" + (C + 38) + " 541.5", mg, 3, 0.9) + K.St("M" + C + " 541L" + C + " 600", "#6e7390", 1.2, 0.35);
    s += K.St("M" + (C - sw - 20) + " 698Q" + C + " 716 " + (C + sw + 20) + " 698", mg, 4, 0.85) + K.St("M" + (C - bw) + " 317C" + (C - 20) + " 324 " + (C + 20) + " 324 " + (C + bw) + " 317", mg, 3.4, 0.85);
    s += K.Pa("M" + (C - B.wt - 12) + " 448L" + (C + B.wt + 12) + " 448L" + (C + wb + 2) + " 474L" + (C - wb - 2) + " 474Z", K.mix(bianco, "#b9bccb", 0.35), " opacity='.9'") + K.St("M" + (C - B.wt - 12) + " 449.5L" + (C + B.wt + 12) + " 449.5", "#ffffff", 1.2, 0.6);
    s += K.St(ap, "#5d6280", 3.2, 0.3) + "</g>";
    // lacci in vita
    [-1, 1].forEach(function (l) { var x = C + l * (B.wt + 12); s += K.Pa("M" + n1(x) + " 456C" + n1(x + l * 8) + " 480 " + n1(x + l * 6) + " 504 " + n1(x + l * 12) + " 524L" + n1(x + l * 2) + " 524C" + n1(x - l * 2) + " 500 " + n1(x - l * 4) + " 478 " + n1(x - l * 2) + " 456Z", K.cil(bianco, 0.6)); });
    return { corpo: s };
  });
})();
/* PEZZI FATTI (voce capo): felpa, camicia, giacca, bomber, maglione, cappotto, polo, canotta, dolcevita, calcio, sportiva,
   crop, top, camicetta, cardigan, gilet, vestito, vestitolungo, grembiule. Tutti provati su 6 corporature, colori chiari/scuri,
   braccia alzate. Nessun pezzo da sostituire.
   NOTA per il capo: vestito e vestitolungo non coprono i pantaloni "sotto": il vestito al ginocchio ridisegna da solo le gambe
   nude e le scarpe sotto l'orlo; il lungo arriva alle caviglie (orlo 942). Se c'e' una gonna lunga sotto, l'editor dovrebbe spegnerla. */


// ---- vestiti-sotto ----
// pezzi: vestiti-sotto — pantaloni, gonne e scarpe degli avatar illustrati
(function () {
  var A = window.SGOminoA;

  // ---------------------------------------------------------------- pantaloni
  // base comune: gambe + bacino con un gradiente unico, luci e ombre per ogni gamba (come i jeans del motore)
  function pant(K, o) {
    var pn = o.col || K.pantaloni, pl = K.chiaro(pn, K.m ? 0.2 : 0.26), pd = K.scuro(pn, 0.38), C = K.C, B = K.B, v = K.m ? 456 : 448;
    var x0 = C - B.hp - 10, x1 = C + B.hp + 10, id = o.id || "vp";
    var g = K.LG(id, x0, 0, x1, 0, [[0, pl], [0.45, pn], [1, K.mix(pn, pd, 0.7)]], true);
    var gm = { agio: o.agio == null ? 7 : o.agio, agioI: o.agioI == null ? 5 : o.agioI, da: 548, a: o.a, dritto: o.dritto, orlo: o.a, orloL: o.orloL, segue: true, svasa: o.svasa, curvaOrlo: o.curva == null ? 4 : o.curva };
    var Ln = K.gamba(-1, gm), Rn = K.gamba(1, gm), wp = K.bacino({ agio: o.agioB == null ? 5 : o.agioB });
    var s = K.Pa(Ln, g) + K.Pa(Rn, g) + K.Pa(wp, g);
    var ym = (548 + o.a) / 2, ry = (o.a - 548) / 2 * 0.8;
    s += "<g clip-path='" + K.clip([Ln, Rn, wp]) + "'>";
    s += "<rect x='198' y='575' width='4' height='" + Math.min(130, o.a - 580) + "' fill='" + K.LG(id + "c", 0, 0, 0, 1, [[0, "#000000", 0.45], [1, "#000000", 0]]) + "'/>";
    s += K.El(200, 588, 22, 26, K.soft("#000000", 0.4));
    [-1, 1].forEach(function (l) {
      var gy = K.gIn(ym), cx = C + l * gy[0];
      s += K.El(cx - gy[1] * 0.35, ym, 14, ry, K.soft("#ffffff", K.m ? 0.2 : 0.25)) + K.El(cx + gy[1] * 0.8, ym + 10, 12, ry * 1.05, K.soft("#000000", 0.3)) + K.El(cx - l * gy[2] * 0.85, ym, 8, ry * 0.95, K.soft("#000000", 0.26));
      s += K.St("M" + (cx - l * 3) + " 606C" + (cx + 8 * l) + " 612 " + (cx + 22 * l) + " 610 " + (cx + 32 * l) + " 602", pd, 3, 0.2);
      if (o.dett) s += o.dett(l, cx, pn, pl, pd);
    });
    if (o.dentro) s += o.dentro(pn, pl, pd);
    // cintura
    var wl = C - B.wt - 5, wr = C + B.wt + 5, st = " stroke-dasharray='3.5 3'";
    var bandaCol = K.mix(pn, "#000000", 0.18);
    if (o.cintura !== false) {
      s += K.Pa("M" + wl + " " + v + "L" + wr + " " + v + "L" + (wr + 1) + " " + (v + 14) + "L" + (wl - 1) + " " + (v + 14) + "Z", bandaCol, " opacity='.6'");
      s += K.St("M" + wl + " " + (v + 14) + "L" + wr + " " + (v + 14), pd, 1.2, 0.7);
      s += K.St("M" + wl + " " + (v + 1) + "L" + wr + " " + (v + 1), pl, 1, 0.5);
    }
    s += "</g>";
    if (o.cordino) {   // laccio della tuta e dei pantaloncini
      var ya = v + 8;
      s += K.St("M" + (C - 7) + " " + ya + "C" + (C - 18) + " " + (ya + 22) + " " + (C - 16) + " " + (ya + 34) + " " + (C - 20) + " " + (ya + 44), "#f2f2ee", 2.4, 0.95) +
        K.St("M" + (C + 7) + " " + ya + "C" + (C + 16) + " " + (ya + 20) + " " + (C + 18) + " " + (ya + 32) + " " + (C + 22) + " " + (ya + 40), "#d8d8d2", 2.4, 0.95) +
        K.El(C - 20, ya + 46, 2.6, 3.4, "#f2f2ee") + K.El(C + 22, ya + 42, 2.6, 3.4, "#d8d8d2") + K.El(C - 4, ya, 2.2, 2, "#555", " opacity='.7'") + K.El(C + 4, ya, 2.2, 2, "#555", " opacity='.7'");
    }
    if (o.bottone) s += "<circle cx='200' cy='" + (v + 13) + "' r='4.4' fill='#c9ccd2' stroke='#6e7078' stroke-width='1'/><circle cx='199' cy='" + (v + 12) + "' r='1.5' fill='#ffffff' opacity='.8'/>";
    return { s: s, L: Ln, R: Rn };
  }
  function laccetto(K, wl, wr, v, pn) {   // passanti della cintura
    var s = ""; [wl + 14, wr - 14, K.C - 16, K.C + 16].forEach(function (b) { s += "<rect x='" + (b - 3) + "' y='" + v + "' width='6' height='20' rx='1.5' fill='" + K.mix(pn, "#000000", 0.2) + "' opacity='.55'/>"; });
    return s;
  }
  // cucitura tratteggiata
  var TR = " stroke-dasharray='3.5 3'";

  // un orlo piegato / polsino disegnato dentro la gamba (dalla quota y0 alla y1)
  function fascia(K, gam, y0, y1, fill, extra) {
    var c = K.clip(gam), c2 = K.clip("M0 " + y0 + "H400V" + y1 + "H0Z");
    return "<g clip-path='" + c + "'><g clip-path='" + c2 + "'>" + K.Pa(gam, fill) + (extra || "") + "</g></g>";
  }

  // ---- pantaloncini sportivi
  A.pezzo("sotto", "pantaloncini", function (K) {
    var C = K.C, B = K.B;
    var r = pant(K, { id: "vpc", a: 694, agio: 9, agioI: 7, curva: 6, cordino: true, cintura: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(660), ex = C + l * (g[0] + g[1] + 9);
        return K.Pa(K.limb([[C + l * (B.wt - 8), 462, 7], [C + l * (B.hp - 7), 528, 7], [ex - l * 8, 598, 7], [ex - l * 8, 696, 7]]), K.mix(pn, "#ffffff", 0.7), " opacity='.6'") +
          K.St("M" + (cx - 24) + " 676C" + (cx - 10) + " 683 " + (cx + 10) + " 683 " + (cx + 24) + " 675", pd, 3, 0.3) +
          K.St("M" + (cx - 24) + " 684C" + (cx - 10) + " 691 " + (cx + 10) + " 691 " + (cx + 24) + " 683", pl, 1.2, 0.3);
      } });
    return r.s;
  });
  // ---- bermuda
  A.pezzo("sotto", "bermuda", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var r = pant(K, { id: "vbe", a: 776, agio: 10, agioI: 8, curva: 5, bottone: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(700), ex = C + l * (g[0] + g[1] + 9);
        var s = K.St("M" + (cx - 26) + " 758C" + (cx - 12) + " 765 " + (cx + 10) + " 765 " + (cx + 26) + " 757", pd, 3, 0.28) + K.St("M" + (cx - 24) + " 766C" + (cx - 10) + " 773 " + (cx + 10) + " 773 " + (cx + 24) + " 765", pl, 1.4, 0.25);
        s += K.St("M" + (cx - l * 4 - 24) + " 748C" + (cx - 10) + " 754 " + (cx + 10) + " 754 " + (cx + 24) + " 747", pd, 1, 0.5, TR);
        // tasca sul lato (cargo leggera)
        s += K.Pa("M" + (ex - l * 3) + " 668L" + (ex - l * 31) + " 668L" + (ex - l * 31) + " 718L" + (ex - l * 3) + " 718Z", K.mix(pn, "#000000", 0.08), " opacity='.5'") +
          K.St("M" + (ex - l * 3) + " 668L" + (ex - l * 31) + " 668L" + (ex - l * 31) + " 718L" + (ex - l * 3) + " 718", pd, 1.1, 0.55, TR) +
          K.Pa("M" + (ex - l * 3) + " 668L" + (ex - l * 31) + " 668L" + (ex - l * 31) + " 684L" + (ex - l * 3) + " 684Z", K.mix(pn, "#000000", 0.18), " opacity='.5'") +
          K.St("M" + (ex - l * 3) + " 684L" + (ex - l * 31) + " 684", pd, 1.6, 0.5) + K.El(ex - l * 17, 684, 2.4, 2.4, "#c9b26a", " opacity='.9'");
        return s;
      },
      dentro: function (pn, pl, pd) { return laccetto(K, C - B.wt - 5, C + B.wt + 5, v, pn); } });
    return r.s;
  });
  // ---- shorts di jeans (sfilacciati)
  A.pezzo("sotto", "shortsjeans", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var r = pant(K, { id: "vsj", a: 664, agio: 6, agioI: 4, curva: 5, bottone: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(640), s = "";
        s += K.St("M" + (cx - 22) + " 662C" + (cx - 8) + " 669 " + (cx + 8) + " 669 " + (cx + 22) + " 661", "#f1ece0", 2.2, 0.55, " stroke-dasharray='1.2 1.6'") + K.St("M" + (cx - 22) + " 652C" + (cx - 8) + " 659 " + (cx + 8) + " 659 " + (cx + 22) + " 651", pd, 1, 0.45, TR);
        for (var i = 0; i < 6; i++) s += K.St("M" + (cx - 20 + i * 8) + " 664l" + (i % 2 ? -1 : 1) + " 5", "#f1ece0", 1, 0.55);
        return s;
      },
      dentro: function (pn) { var wl = C - B.wt - 5, wr = C + B.wt + 5; return laccetto(K, wl, wr, v, pn) + K.St("M" + (wl + 2) + " " + (v + 4) + "C" + (wl + 8) + " " + (v + 42) + " " + (wl + 24) + " " + (v + 58) + " " + (wl + 46) + " " + (v + 64), K.mix(pn, "#e8c070", 0.75), 1.1, 0.8, TR) + K.St("M" + (wr - 2) + " " + (v + 4) + "C" + (wr - 8) + " " + (v + 42) + " " + (wr - 24) + " " + (v + 58) + " " + (wr - 46) + " " + (v + 64), K.mix(pn, "#e8c070", 0.75), 1.1, 0.8, TR); } });
    return r.s;
  });
  // ---- leggings: aderenti
  A.pezzo("sotto", "leggings", function (K) {
    var C = K.C;
    var r = pant(K, { id: "vle", a: 944, agio: 1.5, agioI: 1, agioB: 3, orloL: 18, dritto: 0, curva: 3,
      dett: function (l, cx, pn, pl, pd) {
        var s = "";
        // riflesso lucido lungo la gamba e piega alle ginocchia
        var g = K.gIn(740);
        s += K.St("M" + K.n1(C + l * (K.gIn(600)[0]) - 12) + " 600C" + K.n1(C + l * K.gIn(700)[0] - 14) + " 680 " + K.n1(C + l * K.gIn(800)[0] - 10) + " 800 " + K.n1(C + l * K.gIn(930)[0] - 7) + " 930", "#ffffff", 3.4, 0.16);
        s += K.St("M" + (cx - 14) + " " + 750 + "C" + (cx - 4) + " 756 " + (cx + 6) + " 756 " + (cx + 14) + " 750", pd, 2, 0.3);
        s += K.St("M" + (cx - 9) + " 936C" + (cx - 2) + " 940 " + (cx + 4) + " 940 " + (cx + 9) + " 936", pd, 2, 0.35);
        return s;
      } });
    return r.s;
  });
  // ---- zampa d'elefante
  A.pezzo("sotto", "zampa", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var r = pant(K, { id: "vza", a: 962, agio: 5, agioI: 3, svasa: 44, curva: 6, bottone: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(880), s = "";
        s += K.St("M" + (cx - 36) + " 944C" + (cx - 14) + " 954 " + (cx + 14) + " 954 " + (cx + 36) + " 942", pd, 2.6, 0.3) + K.St("M" + (cx - 32) + " 953C" + (cx - 12) + " 962 " + (cx + 12) + " 962 " + (cx + 32) + " 951", pl, 1.2, 0.25);
        s += K.St("M" + K.n1(C + l * (g[0] + 6)) + " 780L" + K.n1(C + l * (g[0] + 18)) + " 958", pd, 1, 0.35, TR);
        s += K.El(cx + l * 6, 880, 18, 78, K.soft("#ffffff", 0.12));
        return s;
      },
      dentro: function (pn) { return K.St("M" + (C - B.wt - 3) + " " + (v + 38) + "C" + (C - B.wt + 12) + " " + (v + 56) + " " + (C - B.wt + 28) + " " + (v + 62) + " " + (C - B.wt + 44) + " " + (v + 64), K.mix(pn, "#e8c070", 0.75), 1.1, 0.8, TR); } });
    return r.s;
  });
  // ---- tuta: polsini e riga laterale
  A.pezzo("sotto", "tuta", function (K) {
    var C = K.C, B = K.B;
    var r = pant(K, { id: "vtu", a: 944, agio: 10, agioI: 7, agioB: 6, dritto: 760, orloL: 24, curva: 4, cordino: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(700), ex = C + l * (g[0] + g[1] + 10);
        var righe = K.mix(pn, K.lum(pn) > 0.55 ? "#2b2b33" : "#ffffff", 0.78);
        var s = K.Pa("M" + (ex - l * 3) + " 556L" + (ex - l * 11) + " 556L" + (ex - l * 13) + " 944L" + (ex - l * 4) + " 944Z", righe, " opacity='.85'");
        s += K.St("M" + (ex - l * 12) + " 556L" + (ex - l * 14) + " 944", K.chiaro(righe, 0.3), 1, 0.35);
        var k = K.gIn(748); s += K.St("M" + (cx - 24) + " 742C" + (cx - 10) + " 750 " + (cx + 10) + " 750 " + (cx + 24) + " 740", pd, 3, 0.22);
        return s;
      } });
    // polsino a costine sul fondo della gamba
    var pn = K.pantaloni, pc = K.scuro(pn, 0.25), s = r.s;
    [r.L, r.R].forEach(function (d, i) {
      var l = i ? 1 : -1, g = K.gIn(930), cx = K.C + l * g[0];
      var ribs = ""; for (var q = -24; q <= 24; q += 5) ribs += K.St("M" + (cx + q) + " 922L" + (cx + q * 0.96) + " 946", K.scuro(pn, 0.5), 1, 0.35);
      s += fascia(K, d, 922, 950, K.LG("vtp" + i, 0, 0, 1, 0, [[0, K.mix(pn, "#ffffff", 0.1)], [0.5, pc], [1, K.scuro(pn, 0.5)]]), ribs + K.St("M" + (cx - 40) + " 922L" + (cx + 40) + " 922", K.scuro(pn, 0.55), 1.6, 0.6));
    });
    return s;
  });
  // ---- cargo
  function cargoTasche(K, l, pn, pl, pd, ym) {
    var C = K.C, g = K.gIn(ym), ex = C + l * (g[0] + g[1] + 11), s = "";
    var x1 = ex - l * 3, x2 = ex - l * 36;
    s += K.Pa("M" + x1 + " 690L" + x2 + " 690L" + x2 + " 770L" + x1 + " 770Z", K.mix(pn, "#000000", 0.12), " opacity='.55'");
    s += K.El((x1 + x2) / 2 - l * 5, 770, 17, 5, K.soft("#000000", 0.3));
    s += K.Pa("M" + x1 + " 690L" + x2 + " 690L" + x2 + " 710L" + (x2 + l * 3) + " 714L" + (x1 - l * 2) + " 714L" + x1 + " 710Z", K.mix(pn, "#ffffff", 0.08), " opacity='.6'");
    s += K.St("M" + x1 + " 690L" + x2 + " 690L" + x2 + " 770L" + x1 + " 770Z", pd, 1.2, 0.7, TR) + K.St("M" + x2 + " 712L" + x1 + " 712", pd, 1.8, 0.5) + K.El((x1 + x2) / 2, 712, 2.5, 2.5, K.mix(pn, "#000000", 0.4));
    return s;
  }
  A.pezzo("sotto", "cargo", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var r = pant(K, { id: "vca", a: 946, agio: 12, agioI: 9, agioB: 6, dritto: 780, orloL: 32, curva: 5, bottone: true,
      dett: function (l, cx, pn, pl, pd) {
        var s = cargoTasche(K, l, pn, pl, pd, 720);
        s += K.St("M" + (cx - 28) + " 744C" + (cx - 12) + " 754 " + (cx + 10) + " 754 " + (cx + 26) + " 742", pd, 3, 0.25);
        s += K.St("M" + (cx - 30) + " 924C" + (cx - 12) + " 934 " + (cx + 10) + " 934 " + (cx + 30) + " 922", pd, 3, 0.3) + K.St("M" + (cx - 28) + " 934C" + (cx - 10) + " 942 " + (cx + 10) + " 942 " + (cx + 28) + " 932", pd, 2, 0.25);
        return s;
      },
      dentro: function (pn) { return laccetto(K, C - B.wt - 5, C + B.wt + 5, v, pn); } });
    return r.s;
  });
  // ---- mimetici
  A.pezzo("sotto", "mimetici", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var kaki = K.mix(K.pantaloni, "#6f7a4c", 0.62), c1 = K.mix(kaki, "#2c3a1a", 0.55), c2 = K.mix(kaki, "#9a8250", 0.6), c3 = K.mix(kaki, "#15190d", 0.72);
    var Rn = K.rnd(77);
    var r = pant(K, { id: "vmi", col: kaki, a: 946, agio: 12, agioI: 9, agioB: 6, dritto: 780, orloL: 32, curva: 5, bottone: true,
      dett: function (l, cx, pn, pl, pd) { return cargoTasche(K, l, pn, pl, pd, 720); },
      dentro: function (pn) {
        var s = "", cols = [c1, c2, c3];
        for (var i = 0; i < 120; i++) {
          var x = C + (Rn() * 2 - 1) * (B.hp + 40), y = 450 + Rn() * 500, rx = 7 + Rn() * 15, ry = 5 + Rn() * 10, k = Math.floor(Rn() * 3), a = Rn() * 6.28;
          var pts = []; for (var j = 0; j < 7; j++) { var t = j / 7 * 6.283, f = 0.7 + Rn() * 0.5; pts.push([x + Math.cos(t) * rx * f * Math.cos(a) - Math.sin(t) * ry * f * Math.sin(a), y + Math.cos(t) * rx * f * Math.sin(a) + Math.sin(t) * ry * f * Math.cos(a)]); }
          s += K.Pa(K.lisciaChiusa(pts), cols[k], " opacity='.9'");
        }
        s += K.Pa("M0 0H400V1000H0Z", K.LG("vmil", 0, 0, 1, 0, [[0, "#ffffff", 0.16], [0.4, "#ffffff", 0], [1, "#000000", 0.38]]));
        return s + laccetto(K, C - B.wt - 5, C + B.wt + 5, v, pn);
      } });
    return r.s;
  });
  // ---- strappati: jeans di base + strappi alle ginocchia
  A.pezzo("sotto", "strappati", function (K) {
    var base = A.pantaloni(K, false), C = K.C, s = base;
    var sk = K.pelle, skD = K.skD, skDD = K.skDD, jn = K.pantaloni;
    function strappo(cx, cy, w, h, seme, id) {
      var Rr = K.rnd(seme), n = 12, pts = [], ext = [];
      for (var i = 0; i < n; i++) { var t = i / n * 6.283, f = 0.82 + Rr() * 0.3; pts.push([cx + Math.cos(t) * w * f, cy + Math.sin(t) * h * f]); ext.push([cx + Math.cos(t) * (w + 3.5) * (f + 0.06), cy + Math.sin(t) * (h + 3) * (f + 0.1)]); }
      var d = K.lisciaChiusa(pts), de = K.lisciaChiusa(ext);
      var o = K.Pa(de, K.mix(jn, "#ffffff", 0.55), " opacity='.55'");
      o += K.Pa(d, K.LG(id, 0, 0, 1, 1, [[0, K.mix(sk, "#ffffff", 0.08)], [1, skD]]));
      o += "<g clip-path='" + K.clip(d) + "'>" + K.El(cx, cy - h * 0.7, w * 1.2, h * 0.7, K.soft(skDD, 0.6)) + K.El(cx + w * 0.4, cy + h * 0.3, w * 0.6, h * 0.8, K.soft(skDD, 0.25));
      for (var q = 0; q < 6; q++) { var tx = cx - w * 0.8 + q * w * 0.32 + (Rr() - 0.5) * 3; o += K.St("M" + K.n1(tx) + " " + K.n1(cy - h * 0.9) + "L" + K.n1(tx + (Rr() - 0.5) * 4) + " " + K.n1(cy + h * 0.9), "#e9ecf2", 0.8, 0.4); }
      o += "</g>";
      o += K.St(d, K.scuro(jn, 0.4), 1, 0.5);
      for (q = 0; q < 8; q++) { var a2 = Rr() * 6.283, rr = 1 + Rr() * 0.12; o += K.St("M" + K.n1(cx + Math.cos(a2) * w * rr) + " " + K.n1(cy + Math.sin(a2) * h * rr) + "l" + K.n1(Math.cos(a2) * 4.5 + (Rr() - 0.5) * 3) + " " + K.n1(Math.sin(a2) * 4 + (Rr() - 0.5) * 2), "#f0f1f4", 1, 0.85); }
      return o;
    }
    [-1, 1].forEach(function (l, i) {
      var g = K.gIn(748), kx = C + l * g[0], wd = Math.min(15, g[1] * 0.5);
      s += strappo(kx - l * 1, 748, wd, 21, 11 + i * 5, "vst" + i);
    });
    var g2 = K.gIn(660); s += strappo(C - (g2[0]) + 2, 664, 8, 11, 41, "vst2");
    var g3 = K.gIn(850); s += strappo(C + g3[0] - 2, 850, 6, 7, 52, "vst3");
    return s;
  });

  // ---------------------------------------------------------------- gonne
  function gonna(K, o) {
    var pn = K.pantaloni, pl = K.chiaro(pn, 0.28), pd = K.scuro(pn, 0.4), C = K.C, B = K.B, v = K.m ? 456 : 448, hy = o.hem;
    var wv = B.wt + 4, wh = B.hp + 4 + (o.agioH || 0), hw = o.hw(B), id = o.id;
    var g = K.LG(id, C - hw, 0, C + hw, 0, [[0, pl], [0.42, pn], [1, K.mix(pn, pd, 0.72)]], true);
    var mid = hy - (hy - 528) * 0.5;
    var R = [[C + wv, v], [C + wv + 3, v + 30], [C + wh, 528]], Lf = [[C - wv, v], [C - wv - 3, v + 30], [C - wh, 528]];
    if (o.tubino) { R.push([C + wh - 3, 620], [C + hw + 4, hy - 40], [C + hw, hy]); Lf.push([C - wh + 3, 620], [C - hw - 4, hy - 40], [C - hw, hy]); }
    else { R.push([C + wh + (hw - wh) * 0.2, 528 + (hy - 528) * 0.4], [C + wh + (hw - wh) * 0.75, hy - (hy - 528) * 0.22], [C + hw, hy]); Lf.push([C - wh - (hw - wh) * 0.2, 528 + (hy - 528) * 0.4], [C - wh - (hw - wh) * 0.75, hy - (hy - 528) * 0.22], [C - hw, hy]); }
    // orlo: leggermente più basso al centro e con onde morbide
    var n = o.onde || 6, hem = [], sag = o.sag == null ? 7 : o.sag, amp = o.amp == null ? 2.5 : o.amp;
    for (var i = 0; i <= n; i++) { var t = i / n, x = C + hw - 2 * hw * t, u = (x - C) / hw; hem.push([x, hy + sag * (1 - u * u) + (i && i < n ? amp * (i % 2 ? 1 : -1) : 0)]); }
    var d = "M" + (C - wv) + " " + v + "L" + (C + wv) + " " + v + K.cr(R) + K.cr(hem) + K.cr(Lf.slice().reverse()) + "Z";
    var s = "";
    // ombra dell'orlo sulle gambe nude
    if (hy < 900) {
      var gm = { da: hy - 4, a: 950, agio: 0, curvaOrlo: 2 }, LL = K.gamba(-1, gm), RR = K.gamba(1, gm);
      s += "<g clip-path='" + K.clip([LL, RR]) + "'><rect x='0' y='" + (hy - 4) + "' width='400' height='34' fill='" + K.LG(id + "s", 0, 0, 0, 1, [[0, "#000000", 0.34], [1, "#000000", 0]]) + "'/></g>";
    }
    s += K.Pa(d, g);
    s += "<g clip-path='" + K.clip(d) + "'>";
    // luce a sinistra, ombra a destra
    s += K.El(C - hw * 0.5, (hy + 528) / 2, hw * 0.28, (hy - 528) * 0.5, K.soft("#ffffff", 0.2)) + K.El(C + hw * 0.62, (hy + 528) / 2 + 6, hw * 0.3, (hy - 528) * 0.5, K.soft("#000000", 0.28));
    s += K.El(C, v + 8, wv + 6, 18, K.soft("#000000", 0.28));
    s += K.Pa("M0 " + (hy - 20) + "H400V" + (hy + 20) + "H0Z", K.LG(id + "o", 0, 0, 0, 1, [[0, "#000000", 0], [1, "#000000", 0.32]]));
    if (o.pieghe) s += o.pieghe(g, pl, pd, pn, wv, hw, hy, v);
    if (o.dett) s += o.dett(pl, pd, pn, wv, hw, hy, v);
    s += "</g>";
    // cintura
    s += K.Pa("M" + (C - wv) + " " + v + "L" + (C + wv) + " " + v + "L" + (C + wv + 3) + " " + (v + 12) + "L" + (C - wv - 3) + " " + (v + 12) + "Z", K.mix(pn, "#000000", 0.2), " opacity='.62'") +
      K.St("M" + (C - wv - 2) + " " + (v + 12) + "L" + (C + wv + 2) + " " + (v + 12), pd, 1.2, 0.7) + K.St("M" + (C - wv + 2) + " " + (v + 1) + "L" + (C + wv - 2) + " " + (v + 1), pl, 1, 0.5);
    // piccola curva luminosa lungo l'orlo
    s += K.St(K.liscio(hem.map(function (q) { return [q[0], q[1] - 1.5]; })), pl, 1.1, 0.4);
    return s;
  }
  // pieghe morbide dalla vita all'orlo
  function pieghe(K, n, forza) {
    return function (g, pl, pd, pn, wv, hw, hy, v) {
      var C = K.C, s = "", R = K.rnd(5);
      for (var i = 0; i < n; i++) {
        var u = -0.82 + 1.64 * (i + 0.5) / n + (R() - 0.5) * 0.06, xw = C + u * wv * 0.95, xh = C + u * hw * 0.97, ym = (hy + v) / 2;
        var dd = "M" + K.n1(xw) + " " + (v + 14) + "C" + K.n1(xw + (xh - xw) * 0.15) + " " + K.n1(ym - 40) + " " + K.n1(xw + (xh - xw) * 0.75) + " " + K.n1(ym + 70) + " " + K.n1(xh) + " " + (hy + 2);
        s += K.St(dd, pd, 6 * (forza || 1), 0.1 + 0.05 * (i % 2)) + K.St(dd.replace(/(\d+\.?\d*) (\d+\.?\d*)/g, function (m, a, b) { return K.n1(+a - 4) + " " + b; }), pl, 2.2, 0.2);
      }
      return s;
    };
  }
  A.pezzo("sotto", "gonna", function (K) {
    return gonna(K, { id: "vgo", hem: 748, hw: function (B) { return B.hp + 36; }, onde: 6, sag: 7, amp: 3, pieghe: pieghe(K, 7, 1) });
  });
  A.pezzo("sotto", "minigonna", function (K) {
    return gonna(K, { id: "vmg", hem: 642, hw: function (B) { return B.hp + 18; }, onde: 4, sag: 5, amp: 1.5, pieghe: pieghe(K, 5, 0.7),
      dett: function (pl, pd, pn, wv, hw, hy, v) { return K.St("M" + (K.C - hw + 8) + " " + (hy - 7) + "C" + (K.C - 20) + " " + (hy + 2) + " " + (K.C + 20) + " " + (hy + 2) + " " + (K.C + hw - 8) + " " + (hy - 7), pd, 1, 0.5, TR); } });
  });
  A.pezzo("sotto", "gonnalunga", function (K) {
    return gonna(K, { id: "vgl", hem: 932, hw: function (B) { return B.hp + 38; }, onde: 8, sag: 8, amp: 4, agioH: 2, pieghe: pieghe(K, 9, 1.4),
      dett: function (pl, pd, pn, wv, hw, hy) { return K.El(K.C, hy - 30, hw * 0.9, 28, K.soft("#000000", 0.12)); } });
  });
  A.pezzo("sotto", "gonnatubino", function (K) {
    return gonna(K, { id: "vgt", hem: 752, tubino: true, hw: function (B) { return Math.round(B.hp * 0.72 + 4); }, onde: 4, sag: 3, amp: 0, agioH: 0,
      pieghe: function (g, pl, pd, pn, wv, hw, hy, v) {
        var C = K.C, s = "";
        s += K.St("M" + (C - wv + 10) + " " + (v + 14) + "L" + (C - wv + 18) + " " + (v + 60), pd, 2, 0.35) + K.St("M" + (C + wv - 10) + " " + (v + 14) + "L" + (C + wv - 18) + " " + (v + 60), pd, 2, 0.35);
        s += K.St("M" + C + " " + (v + 40) + "L" + C + " " + (hy - 2), pd, 1.1, 0.25);
        s += K.St("M" + (C - 32) + " 560C" + (C - 10) + " 572 " + (C + 10) + " 572 " + (C + 32) + " 560", pd, 3, 0.22) + K.St("M" + (C - 28) + " 590C" + (C - 8) + " 600 " + (C + 12) + " 600 " + (C + 30) + " 592", pd, 2, 0.15);
        s += K.St("M" + (C - hw + 6) + " " + (hy - 12) + "C" + (C - 20) + " " + (hy - 5) + " " + (C + 20) + " " + (hy - 5) + " " + (C + hw - 6) + " " + (hy - 12), pd, 1, 0.45, TR);
        return s;
      } });
  });
  A.pezzo("sotto", "gonnapieghe", function (K) {
    var n = 11;
    return gonna(K, { id: "vgp", hem: 738, hw: function (B) { return B.hp + 40; }, onde: 11, sag: 6, amp: 4.5, agioH: 0,
      pieghe: function (g, pl, pd, pn, wv, hw, hy, v) {
        var C = K.C, s = "";
        for (var i = 0; i < n; i++) {
          var u0 = -1 + 2 * i / n, u1 = -1 + 2 * (i + 1) / n, um = (u0 + u1) / 2;
          var pa = [[C + u0 * wv * 0.98, v + 14], [C + u1 * wv * 0.98, v + 14], [C + u1 * hw, hy + 4], [C + u0 * hw, hy + 4]];
          // una piega su due è in ombra, l'altra in luce
          if (i % 2) s += K.Pa(K.poli(pa), pd, " opacity='" + (0.18 + 0.12 * (um + 1) / 2) + "'"); else s += K.Pa(K.poli(pa), pl, " opacity='" + (0.16 - 0.06 * (um + 1) / 2) + "'");
          s += K.St("M" + K.n1(C + u0 * wv * 0.98) + " " + (v + 14) + "L" + K.n1(C + u0 * hw) + " " + (hy + 3), pd, 1, 0.38);
        }
        return s;
      } });
  });

  // ---------------------------------------------------------------- scarpe
  // geometria di una scarpa di lato (tacco a sinistra x 114, caviglia 140-190, punta a destra x 210, suola a y 999)
  var PIEDE = "M146 926L188 926C191 944 196 954 204 962C212 970 213 984 203 988L150 990C130 990 118 986 116 976C115 966 126 960 138 958C144 954 144 940 146 926Z";
  function cuoio(K, id, c) { return K.LG(id, 0, 0, 1, 1, [[0, K.chiaro(c, 0.5)], [0.5, c], [1, K.scuro(c, 0.28)]]); }
  function pelleFill(K, id) { return K.LG(id, 0, 0, 1, 1, [[0, K.mix(K.pelle, "#fff3e8", 0.2)], [0.55, K.pelle], [1, K.skD]]); }
  function dita(K, x, y) {   // le dita viste di tre quarti: separazioni sottili sulla punta
    var r = ""; for (var i = 0; i < 4; i++) r += K.St("M" + (x - 8 - i * 1.5) + " " + (y + i * 5 - 2) + "l" + (7 + i * 0.5) + " " + (2.4), K.skDD, 0.9, 0.55);
    return r + K.St("M" + (x - 5) + " " + (y - 3) + "C" + (x - 1) + " " + (y - 1) + " " + (x + 3) + " " + (y + 5) + " " + (x + 5) + " " + (y + 14), "#ffffff", 1.2, 0.3);
  }
  function toccoDita(K) { return dita(K, 204, 962); }
  function suola(K, c, sp) {
    sp = sp || 5; var cs = K.scuro(c, 0.62);
    return K.Pa("M113 " + (989 - sp) + "C112 998 124 999 148 999L204 999C216 999 218 990 212 " + (983 - sp) + "C210 " + (989 - sp) + " 206 " + (991 - sp) + " 200 " + (991 - sp) + "L148 " + (993 - sp) + "C130 " + (993 - sp) + " 118 " + (991 - sp) + " 113 " + (989 - sp) + "Z", cs) +
      K.St("M118 " + (994) + "C130 996 190 996 206 994", K.chiaro(cs, 0.3), 0.9, 0.5);
  }

  A.pezzo("scarpe", "eleganti", function (K) {
    var sc = K.scarpe, lu = K.lum(sc) > 0.6, sd = "M146 930L186 930C188 944 192 952 204 958C220 962 230 972 228 982C226 989 218 990 208 990L150 991C130 991 118 989 116 982C115 972 126 964 138 962C144 958 146 944 146 930Z";
    var one = K.Pa(sd, cuoio(K, "vel", sc)) + "<g clip-path='" + K.clip(sd) + "'>" + K.El(210, 976, 24, 18, K.soft("#000000", 0.2)) + K.El(158, 948, 22, 9, K.soft("#ffffff", lu ? 0.3 : 0.55)) + K.El(124, 976, 10, 12, K.soft("#000000", 0.18)) +
      K.St("M170 954C190 954 214 964 224 976", "#ffffff", 3, lu ? 0.2 : 0.4) +
      K.St("M192 958C196 966 198 976 196 988", K.scuro(sc, 0.4), 1.2, 0.6) + K.St("M184 966C192 962 200 964 206 968", K.scuro(sc, 0.35), 1, 0.5) + "</g>" +
      K.Pa("M147 931C155 937 179 937 186 931C186 934 181 939 166 939C152 939 147 935 147 931Z", K.scuro(sc, 0.62), " opacity='.7'") +
      K.St("M152 944L176 947M151 951L180 954M152 958L184 961", K.mix(sc, "#ffffff", 0.4), 1.2, 0.75) + K.St("M118 982C121 972 130 966 140 966", K.chiaro(sc, 0.4), 1.2, 0.4) +
      K.Pa("M114 985C114 992 124 994 148 994L214 994C224 994 230 991 229 984C226 989 220 990 210 990L150 991C130 991 118 989 114 985Z", K.scuro(sc, 0.65)) + K.St("M119 990C140 992 200 992 224 989", K.chiaro(sc, 0.2), 0.8, 0.5) + K.Pa("M118 990L148 991L148 999L120 999C116 999 115 994 118 990Z", K.scuro(sc, 0.72));
    return A.duePiedi(K, one);
  });
  // un gambale: dalla quota "top" fino a sotto la caviglia, ai due lati
  function gambale(K, o) {
    var sc = K.scarpe, C = K.C, s = "";
    [-1, 1].forEach(function (l, i) {
      var gt = K.gIn(o.top), gm = K.gIn((o.top + 940) / 2), cx = C + l * gm[0], w = gm[1] + o.agio + 6;
      var d = K.gamba(l, { da: o.top, a: 962, agio: o.agio, agioI: o.agio * 0.8, curvaOrlo: 0 });
      var fl = K.LG("vgb" + o.id + i, cx - w, 0, cx + w, 0, [[0, K.chiaro(sc, 0.38)], [0.3, K.chiaro(sc, 0.16)], [0.62, sc], [1, K.scuro(sc, 0.42)]], true);
      s += K.Pa(d, fl) + "<g clip-path='" + K.clip(d) + "'>";
      s += K.El(cx - w * 0.45, (o.top + 940) / 2, w * 0.25, (940 - o.top) * 0.5, K.soft("#ffffff", K.lum(sc) > 0.6 ? 0.28 : 0.38)) + K.El(cx + w * 0.7, (o.top + 940) / 2, w * 0.3, (940 - o.top) * 0.5, K.soft("#000000", 0.3));
      s += K.El(cx, o.top + 8, w, 10, K.soft("#000000", 0.28)) + K.Pa("M0 954H400V966H0Z", K.LG("vgf" + o.id + i, 0, 0, 0, 1, [[0, "#000000", 0], [1, "#000000", 0.35]]));
      if (o.dett) s += o.dett(l, cx, w, gt, sc);
      s += "</g>";
      var gt0 = K.gIn(o.top), ct = C + l * gt0[0], wt = gt0[1] + o.agio + 1;
      s += K.El(ct, o.top + 1, wt, 6, K.scuro(sc, 0.55), " opacity='.85'") + K.St("M" + (ct - wt) + " " + (o.top + 1) + "C" + (ct - wt * 0.5) + " " + (o.top + 8) + " " + (ct + wt * 0.5) + " " + (o.top + 8) + " " + (ct + wt) + " " + (o.top + 1), K.chiaro(sc, 0.4), 1.4, 0.7);
      s += K.St("M" + K.n1(ct - wt) + " " + (o.top - 1) + "C" + K.n1(ct - wt * 0.5) + " " + (o.top - 7) + " " + K.n1(ct + wt * 0.5) + " " + (o.top - 7) + " " + K.n1(ct + wt) + " " + (o.top - 1), K.scuro(sc, 0.5), 1.4, 0.8);
    });
    return s;
  }
  function stivaleBase(K, id, o) {   // la parte del piede, comune a tutti gli stivali
    var sc = K.scarpe, sd = o.piede || PIEDE;
    return K.Pa(sd, cuoio(K, id, sc)) + "<g clip-path='" + K.clip(sd) + "'>" + K.El(198, 974, 22, 22, K.soft("#000000", 0.24)) + K.El(158, 950, 22, 10, K.soft("#ffffff", 0.3)) + "</g>";
  }
  A.pezzo("scarpe", "stivali", function (K) {
    var sc = K.scarpe, base = "M144 922L190 922C192 940 197 952 207 960C220 967 222 982 208 989L148 990C128 990 116 988 114 980C113 968 124 962 136 960C142 954 144 940 144 922Z";
    var one = stivaleBase(K, "vst", { piede: base }) + K.St("M190 944C197 952 204 960 208 972", K.chiaro(sc, 0.5), 1.4, 0.45) + K.St("M188 962C194 962 201 966 206 976", K.scuro(sc, 0.35), 1.3, 0.55) + suola(K, sc, 4) + K.Pa("M118 990L146 992L146 999L122 999Z", K.scuro(sc, 0.7));
    var s = A.duePiedi(K, one);
    s += gambale(K, { id: "sv", top: 786, agio: 8, dett: function (l, cx, w, gt, sc2) {
      var r = "";
      for (var j = 0; j < 4; j++) r += K.St("M" + (cx - w + 6) + " " + (904 + j * 7) + "C" + (cx - w * 0.3) + " " + (908 + j * 7) + " " + (cx + w * 0.3) + " " + (908 + j * 7) + " " + (cx + w - 6) + " " + (904 + j * 7), K.scuro(sc2, 0.5), 1.4, 0.35);
      r += K.St("M" + (cx - w + 4) + " 808C" + (cx - w * 0.2) + " 812 " + (cx + w * 0.3) + " 812 " + (cx + w - 5) + " 806", K.scuro(sc2, 0.4), 1.2, 0.3);
      return r + K.St("M" + (cx + l * w * 0.7) + " 800L" + (cx + l * w * 0.75) + " 940", K.scuro(sc2, 0.3), 1, 0.4, TR);
    } });
    return s;
  });
  A.pezzo("scarpe", "stivalialti", function (K) {
    var sc = K.scarpe, base = "M144 922L190 922C192 940 197 952 208 962C222 968 224 982 208 989L148 990C128 990 116 988 114 980C113 968 124 962 136 960C142 954 144 940 144 922Z";
    var one = stivaleBase(K, "vsa", { piede: base }) + K.St("M190 946C197 954 204 962 209 974", K.chiaro(sc, 0.55), 1.4, 0.5) + suola(K, sc, 4) + K.Pa("M118 990L146 992L146 999L122 999Z", K.scuro(sc, 0.7));
    var s = A.duePiedi(K, one);
    s += gambale(K, { id: "sa", top: 738, agio: 2.5, dett: function (l, cx, w, gt, sc2) {
      var r = "";
      r += K.St("M" + (cx + l * (w - 3)) + " 750L" + (cx + l * (w - 4)) + " 940", K.scuro(sc2, 0.45), 1.2, 0.5) + K.St("M" + (cx + l * (w - 6)) + " 752L" + (cx + l * (w - 7)) + " 940", K.chiaro(sc2, 0.45), 0.8, 0.45);
      r += K.St("M" + (cx - w + 4) + " 748C" + (cx - w * 0.2) + " 754 " + (cx + w * 0.3) + " 754 " + (cx + w - 5) + " 746", K.scuro(sc2, 0.4), 1.2, 0.3);
      r += K.St("M" + (cx - w * 0.25) + " 760L" + (cx - w * 0.3) + " 930", "#ffffff", 3.2, K.lum(sc2) > 0.6 ? 0.18 : 0.26);
      return r;
    } });
    return s;
  });
  A.pezzo("scarpe", "stivaletti", function (K) {
    var sc = K.scarpe, base = "M144 924L190 924C192 940 197 952 207 960C220 966 222 982 208 989L148 990C128 990 116 988 114 980C113 968 124 962 136 960C142 954 144 940 144 924Z";
    var one = stivaleBase(K, "vsl", { piede: base }) + K.St("M190 946C197 954 204 962 208 972", K.chiaro(sc, 0.5), 1.4, 0.45) + K.St("M188 962C194 962 201 966 206 976", K.scuro(sc, 0.35), 1.3, 0.5) + suola(K, sc, 4) + K.Pa("M118 986L148 988L148 999L120 999Z", K.scuro(sc, 0.72));
    var s = A.duePiedi(K, one);
    s += gambale(K, { id: "sl", top: 870, agio: 8, dett: function (l, cx, w, gt, sc2) {
      var r = ""; for (var j = 0; j < 2; j++) r += K.St("M" + (cx - w + 5) + " " + (918 + j * 7) + "C" + (cx - w * 0.3) + " " + (922 + j * 7) + " " + (cx + w * 0.3) + " " + (922 + j * 7) + " " + (cx + w - 5) + " " + (918 + j * 7), K.scuro(sc2, 0.5), 1.3, 0.35);
      return r + K.St("M" + (cx + l * w * 0.55) + " 880L" + (cx + l * w * 0.5) + " 944", K.scuro(sc2, 0.3), 1, 0.4);
    } });
    return s;
  });
  A.pezzo("scarpe", "anfibi", function (K) {
    var sc = K.scarpe, giallo = "#e0b64a";
    var base = "M142 920L192 920C194 938 199 950 209 958C224 964 226 982 210 989L146 990C126 990 114 988 112 980C111 968 122 962 134 960C140 954 142 938 142 920Z";
    var one = stivaleBase(K, "van", { piede: base }) + K.St("M192 944C199 952 207 960 211 972", K.chiaro(sc, 0.5), 1.4, 0.45) +
      K.St("M146 952C152 957 190 959 205 966", giallo, 1.1, 0.8, TR) +
      // suola spessa con il battistrada
      K.Pa("M111 979C110 995 124 999 148 999L208 999C222 999 226 990 220 976C216 984 210 986 204 986L148 987C128 987 116 985 111 979Z", "#1d1b1c") +
      K.St("M113 986C128 990 190 990 218 984", "#6a6663", 1, 0.55);
    for (var q = 0; q < 9; q++) one += K.St("M" + (122 + q * 10.5) + " 991L" + (124 + q * 10.5) + " 997", "#050505", 1.8, 0.7);
    var s = A.duePiedi(K, one);
    s += gambale(K, { id: "an", top: 846, agio: 10, dett: function (l, cx, w, gt, sc2) {
      var r = "";
      // lacci incrociati davanti con occhielli
      r += K.Pa("M" + (cx - 7) + " 852L" + (cx + 7) + " 852L" + (cx + 7) + " 944L" + (cx - 7) + " 944Z", K.scuro(sc2, 0.3), " opacity='.7'");
      for (var j = 0; j < 7; j++) {
        var y = 858 + j * 12;
        r += K.El(cx - 9, y, 2.2, 2.2, "#b9b6b0", " stroke='#444' stroke-width='.6'") + K.El(cx + 9, y, 2.2, 2.2, "#b9b6b0", " stroke='#444' stroke-width='.6'") +
          K.St("M" + (cx - 9) + " " + y + "L" + (cx + 9) + " " + (y + 6) + "M" + (cx + 9) + " " + y + "L" + (cx - 9) + " " + (y + 6), "#f1f0ec", 2, 0.92);
      }
      r += K.St("M" + (cx - w + 4) + " 850L" + (cx - w + 3) + " 950", giallo, 1.1, 0.75, TR) + K.St("M" + (cx + w - 4) + " 850L" + (cx + w - 3) + " 950", giallo, 1.1, 0.75, TR);
      r += K.St("M" + (cx - w + 3) + " 880C" + (cx - w * 0.3) + " 884 " + (cx + w * 0.3) + " 884 " + (cx + w - 3) + " 880", K.scuro(sc2, 0.4), 1.2, 0.25);
      // linguetta sopra il bordo e fiocco
      r += K.Pa("M" + (cx - 6) + " 846L" + (cx + 6) + " 846L" + (cx + 7) + " 858L" + (cx - 7) + " 858Z", K.chiaro(sc2, 0.1), " opacity='.9'");
      return r;
    } });
    return s;
  });

  // piedi nudi per sandali, ballerine ecc. (di lato, come sneakers)
  function piedeNudo(K, id, d) { return K.Pa(d || PIEDE, pelleFill(K, id)) + "<g clip-path='" + K.clip(d || PIEDE) + "'>" + K.El(150, 940, 18, 14, K.soft("#ffffff", 0.22)) + K.El(196, 976, 18, 16, K.soft(K.skDD, 0.3)) + "</g>"; }
  A.pezzo("scarpe", "ballerine", function (K) {
    var sc = K.scarpe;
    var foot = piedeNudo(K, "vbp");
    var scarpa = "M115 977C113 966 124 960 138 958C143 956 146 952 146 948C150 956 156 962 168 967C176 970 184 966 188 962C196 962 205 964 212 972C216 980 210 988 202 988L150 990C130 990 118 986 115 977Z";
    var one = foot + K.Pa(scarpa, cuoio(K, "vba", sc)) + "<g clip-path='" + K.clip(scarpa) + "'>" + K.El(124, 978, 12, 14, K.soft("#000000", 0.18)) + K.El(202, 978, 14, 14, K.soft("#000000", 0.18)) + K.El(160, 982, 40, 5, K.soft("#ffffff", 0.2)) + "</g>" +
      K.St("M146 949C151 957 157 963 168 968C177 971 184 967 188 963", K.scuro(sc, 0.35), 1.4, 0.7) + K.St("M149 952C154 959 160 964 169 966", K.chiaro(sc, 0.5), 0.9, 0.55) +
      // fiocchetto
      K.Pa("M184 962C176 954 176 970 184 964Z", K.chiaro(sc, 0.15)) + K.Pa("M184 962C192 954 192 970 184 964Z", K.chiaro(sc, 0.1)) + K.El(184, 963, 2.4, 2.4, K.scuro(sc, 0.2)) +
      K.Pa("M114 984C114 996 126 998 150 998L202 998C212 998 215 992 213 984C210 990 206 992 200 992L150 993C130 993 118 991 114 984Z", K.scuro(sc, 0.55));
    return A.duePiedi(K, one);
  });
  A.pezzo("scarpe", "sandali", function (K) {
    var sc = K.scarpe, cs = cuoio(K, "vsd", sc), fb = function (pts, w) { return K.Pa(K.limb(pts), cs) + K.St(K.liscio(pts.map(function (q) { return [q[0] - 1, q[1]]; })), K.chiaro(sc, 0.5), 0.7, 0.55); };
    var one = piedeNudo(K, "vsp") + toccoDita(K) +
      K.Pa("M113 986C112 996 124 999 148 999L204 999C216 999 218 992 214 984C210 988 204 990 198 990L148 992C130 992 118 990 113 986Z", K.scuro(sc, 0.55)) +
      K.Pa("M114 984C114 988 122 991 148 991L200 991C208 991 212 988 211 983L198 987L148 988Z", K.scuro(sc, 0.35), " opacity='.9'") +
      fb([[158, 940, 6], [164, 962, 6.5], [168, 988, 6]]) + fb([[184, 956, 6], [191, 970, 6.5], [192, 988, 6]]) +
      K.Pa("M144 930C156 936 178 936 190 930L191 937C178 943 156 943 144 937Z", cs) + K.St("M146 931C158 937 176 937 189 931", K.chiaro(sc, 0.5), 0.8, 0.55) +
      fb([[134, 986, 5.5], [136, 966, 5.5], [146, 940, 5.5]]) + K.El(166, 940, 3.2, 3.2, "#e0bd52", " stroke='#7a5d12' stroke-width='.7'");
    return A.duePiedi(K, one);
  });
  A.pezzo("scarpe", "infradito", function (K) {
    var sc = K.scarpe, cs = cuoio(K, "vin", sc);
    var one = piedeNudo(K, "vip") + dita(K, 207, 964) +
      K.Pa("M112 984C110 996 124 999 150 999L206 999C220 999 224 992 218 983C212 988 204 990 198 990L150 992C130 992 118 990 112 984Z", K.scuro(sc, 0.6)) +
      K.Pa("M113 982C112 978 120 975 132 976L206 982C214 984 218 984 218 986C214 992 206 994 198 994L150 994C130 994 118 990 113 982Z", cs, " opacity='.92'") +
      K.Pa("M192 978C196 976 200 978 200 982L192 982Z", K.scuro(sc, 0.2)) +
      K.St("M176 962C186 968 194 972 197 980", K.chiaro(sc, 0.12), 3.2, 0.95) + K.St("M178 984C176 974 172 966 170 960", K.chiaro(sc, 0.12), 3.2, 0.95) + K.El(196, 980, 3, 3, K.scuro(sc, 0.2));
    return A.duePiedi(K, one);
  });
  A.pezzo("scarpe", "tacchi", function (K) {
    var sc = K.scarpe;
    var foot = "M146 926L188 926C189 942 194 956 204 968C214 978 216 990 208 993L200 993C182 986 164 976 152 966C144 960 140 950 144 940Z";
    var one = K.Pa(foot, pelleFill(K, "vtp")) + "<g clip-path='" + K.clip(foot) + "'>" + K.El(154, 938, 18, 14, K.soft("#ffffff", 0.22)) + K.El(190, 972, 12, 16, K.soft(K.skDD, 0.28)) + "</g>" +
      // tacco a spillo, sotto il tallone
      K.Pa("M139 954C145 951 156 955 158 962L153 998L148 998Z", cuoio(K, "vth", sc)) + K.St("M141 957L150 996", K.chiaro(sc, 0.5), 0.9, 0.5) + K.Pa("M148 992L153 992L152.6 999L148.4 999Z", K.scuro(sc, 0.7)) +
      // il tallone e la punta della scarpa
      K.Pa("M138 948C144 944 150 946 152 952C152 962 158 968 170 976L174 982L160 982C148 976 138 966 138 948Z", cuoio(K, "vtc", sc)) +
      K.Pa("M190 956C200 962 214 976 218 988C218 994 210 996 200 995C192 992 186 986 184 982C192 982 196 976 200 972C196 966 192 960 190 956Z", cuoio(K, "vtt", sc)) +
      K.St("M152 964C160 974 176 984 194 992", K.scuro(sc, 0.4), 3, 0.9) + K.St("M200 962C208 970 214 980 215 990", K.chiaro(sc, 0.5), 1.3, 0.5) + K.St("M141 950C146 949 150 951 151 956", K.chiaro(sc, 0.45), 1.1, 0.5);
    return A.duePiedi(K, one);
  });
  A.pezzo("scarpe", "zeppe", function (K) {
    var sc = K.scarpe, sughero = "#c8975a", sg = K.LG("vzs", 0, 0, 1, 1, [[0, "#ddb078"], [0.5, sughero], [1, "#8d6538"]]);
    var zeppa = "M114 966C114 960 120 958 128 962L204 984C214 988 216 994 212 997C208 999 200 999 192 999L122 999C116 999 113 996 114 990Z";
    var foot = "M146 920L188 920C190 936 196 950 206 960C214 968 214 980 204 984L186 984C170 976 150 962 136 958C128 948 140 936 146 920Z";
    var one = K.Pa(foot, pelleFill(K, "vzp")) + "<g clip-path='" + K.clip(foot) + "'>" + K.El(152, 932, 18, 14, K.soft("#ffffff", 0.22)) + K.El(188, 964, 14, 16, K.soft(K.skDD, 0.25)) + "</g>" + dita(K, 207, 956) +
      K.Pa(zeppa, sg) + "<g clip-path='" + K.clip(zeppa) + "'>";
    for (var q = 0; q < 8; q++) one += K.St("M" + (118 + q * 12) + " " + (964 + q * 2.4) + "L" + (116 + q * 12) + " 999", "#7a5530", 1.2, 0.5);
    one += K.El(180, 990, 50, 8, K.soft("#000000", 0.3)) + "</g>" +
      K.Pa("M114 966C114 960 120 958 128 962L204 984C213 987 216 991 214 994L200 988L122 968Z", cuoio(K, "vzt", sc)) +
      K.Pa("M186 944C194 946 204 954 208 962L204 966C198 960 190 954 182 950Z", cuoio(K, "vzv", sc)) +
      K.Pa("M138 940L184 934L186 940L140 946Z", cuoio(K, "vzc", sc), " opacity='.95'") +
      K.Pa("M126 958C128 948 134 944 140 946L140 962Z", cuoio(K, "vzd", sc)) + K.St("M188 946C196 949 204 956 207 962", K.chiaro(sc, 0.5), 1.1, 0.5);
    return A.duePiedi(K, one);
  });
  A.pezzo("scarpe", "pantofole", function (K) {
    var sc = K.scarpe, pelo = K.chiaro(sc, 0.45);
    var foot = "M146 930L188 930C190 944 196 954 204 962C210 968 210 980 204 988L150 990C130 990 118 986 116 976C115 966 126 960 138 958C144 954 146 940 146 930Z";
    var pant = "M158 958C170 950 190 952 202 962C214 970 216 984 208 990L146 992C140 992 138 988 140 984C146 982 150 974 154 966Z";
    var one = piedeNudo(K, "vpp") +
      K.Pa("M112 984C110 996 124 1000 150 1000L206 1000C222 1000 224 992 218 982C212 988 206 990 198 990L150 992C130 992 118 990 112 984Z", K.scuro(sc, 0.4)) +
      K.Pa(pant, K.LG("vpf", 0, 0, 1, 1, [[0, K.chiaro(sc, 0.35)], [0.5, sc], [1, K.scuro(sc, 0.25)]])) + "<g clip-path='" + K.clip(pant) + "'>" + K.El(198, 976, 18, 20, K.soft("#000000", 0.22)) + K.El(168, 964, 18, 8, K.soft("#ffffff", 0.35));
    for (var q = 0; q < 26; q++) { var R = K.rnd(q + 3), x = 150 + R() * 66, y = 954 + R() * 36; one += K.St("M" + K.n1(x) + " " + K.n1(y) + "l" + K.n1(2 + R() * 3) + " " + K.n1(-1 + R() * 3), pelo, 1.1, 0.55); }
    one += "</g>";
    // bordo peloso lungo l'apertura
    var bordo = []; for (var i = 0; i <= 8; i++) { var t = i / 8; bordo.push([154 + t * 6, 970 - t * 20]); }
    one += K.St("M140 984C146 982 150 974 154 966C156 960 160 956 166 954C176 950 186 952 194 956", pelo, 5, 0.95) + K.St("M140 984C146 982 150 974 154 966C156 960 160 956 166 954C176 950 186 952 194 956", K.chiaro(sc, 0.2), 2.6, 0.6);
    for (i = 0; i < 9; i++) one += K.El(144 + i * 6.2, 982 - Math.min(i, 6) * 4.2 + (i > 6 ? (i - 6) * 1 : 0) - (i > 3 ? 4 : 0), 2.8, 2.4, pelo, " opacity='.0'");
    return A.duePiedi(K, one);
  });
})();

// FATTI: pantaloncini, gonna, leggings, strappati, cargo, tuta, bermuda, shortsjeans, minigonna, gonnalunga, gonnapieghe, gonnatubino, zampa, mimetici;
// scarpe: eleganti, stivali, anfibi, tacchi, ballerine, sandali, stivaletti, stivalialti, infradito, zeppe, pantofole.


// ---- cappelli ----
/* =========================================================
   CAPPELLI degli avatar illustrati (strada A). Coordinate della testa: origine al mento, guance a y -78,
   cima del cranio K.top (circa -144...-155), mezza larghezza K.F.cw. Colore = K.acc.
   Ogni cappello rispetta il «contratto»: { linea (sotto cui i capelli restano visibili), svg }.
   Senza linea (visiera, fascia, cuffie, fiori, cerchietto, fiocco, festa) i capelli restano interi.
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGOminoA;
  if (!A) return;
  // numeri arrotondati, separati da spazi (per costruire i tracciati)
  var q = function () { var o = []; for (var i = 0; i < arguments.length; i++) { var v = arguments[i]; o.push(typeof v === "number" ? Math.round(v * 10) / 10 : v); } return o.join(" "); };
  function pal(K) { var c = K.acc; return { c: c, l: K.mix(c, "#ffffff", 0.34), m: K.mix(c, "#000000", 0.2), d: K.mix(c, "#000000", 0.45), dd: K.mix(c, "#000000", 0.62) }; }
  function dia(K, id, P) { return K.LG(id, 0.05, 0, 0.95, 1, [[0, P.l], [0.38, P.c], [1, P.d]]); }
  function ver(K, id, P) { return K.LG(id, 0, 0, 0, 1, [[0, P.l], [0.5, P.c], [1, P.m]]); }
  // ombra del cappello sulla fronte (ritagliata nel viso)
  function ombra(K, y, rx, ry, op) { return "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(0, y, rx, ry, K.soft("#000000", op == null ? 0.5 : op)) + "</g>"; }
  // quota di un bordo che si incurva (come un anello visto un po' dall'alto): y0 ai lati, s = quanto scende al centro
  function sag(y0, s, x, W) { var u = x / W; return y0 + s * (1 - u * u); }
  function banda(x0, x1, yT, sT, yB, sB) { return "M" + q(x0, yT) + "Q" + q(0, yT + 2 * sT, x1, yT) + "L" + q(x1, yB) + "Q" + q(0, yB + 2 * sB, x0, yB) + "Z"; }
  // luce e ombra morbide dentro una cupola (da mettere in un ritaglio)
  function vol(K, W, T, yb) {
    var h = yb - T;
    return K.El(W * 0.72, T + h * 0.5, W * 0.55, h * 0.85, K.soft("#000000", 0.4)) + K.El(-W * 0.5, T + h * 0.22, W * 0.4, h * 0.3, K.soft("#ffffff", 0.32));
  }
  // colore di contrasto per nastri e fasce (più chiaro se il cappello è scuro, più scuro se è chiaro)
  function contr(K, P) { return K.lum(P.c) < 0.36 ? K.mix(P.c, "#ffffff", 0.42) : K.mix(P.c, "#000000", 0.55); }
  var cnt = 0;
  // pallino di lana / pelo, con i peletti intorno
  function pom(K, cx, cy, r, col, seme) {
    var R = K.rnd(seme), s = "", lt = K.mix(col, "#ffffff", 0.5), dk = K.mix(col, "#000000", 0.3), i, a, c, sn;
    for (i = 0; i < 38; i++) { a = R() * 6.283; c = Math.cos(a); sn = Math.sin(a); s += K.St("M" + q(cx + c * r * 0.78, cy + sn * r * 0.78) + "L" + q(cx + c * r * (1.1 + R() * 0.25), cy + sn * r * (1.1 + R() * 0.25)), i % 3 ? col : dk, 2.4, 0.95); }
    s += K.El(cx, cy, r * 1.02, r * 1.02, K.RG("pm" + (cnt++), [[0, lt], [0.55, col], [1, dk]], "cx='.36' cy='.3' r='.8'"));
    for (i = 0; i < 26; i++) { a = R() * 6.283; var d = r * Math.sqrt(R()) * 0.85, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, b = R() * 6.283; s += K.St("M" + q(x, y) + "l" + q(Math.cos(b) * 3.4, Math.sin(b) * 3.4), i % 2 ? lt : dk, 1.2, 0.45); }
    return s;
  }
  // un fiore a cinque petali: centro, raggio, colore, giro
  function fiore(K, cx, cy, r, col, rot, cc) {
    var s = "", lt = K.mix(col, "#ffffff", 0.45), dk = K.mix(col, "#000000", 0.28), id = "fl" + (cnt++);
    var g = K.RG(id, [[0, lt], [0.6, col], [1, dk]], "cx='.5' cy='.7' r='.8'");
    s += K.El(cx + 1, cy + 2, r * 1.3, r * 1.3, K.soft("#000000", 0.3));
    for (var i = 0; i < 5; i++) {
      var a = rot + i * 72;
      s += "<g transform='translate(" + q(cx, cy) + ") rotate(" + q(a) + ")'>" + K.El(0, -r * 0.62, r * 0.46, r * 0.62, g) + K.St("M0 " + q(-r * 0.2) + "L0 " + q(-r * 0.95), dk, 0.7, 0.35) + "</g>";
    }
    s += K.El(cx, cy, r * 0.3, r * 0.3, K.RG("fc" + (cnt++), [[0, "#fff1a8"], [0.7, cc || "#ffc83d"], [1, "#d98a14"]], "cx='.4' cy='.35' r='.7'"));
    return s;
  }
  // una foglia: centro, lunghezza, angolo
  function foglia(K, cx, cy, l, rot, col) {
    return "<g transform='translate(" + q(cx, cy) + ") rotate(" + q(rot) + ")'>" + K.Pa("M0 0C" + q(l * 0.3, -l * 0.34, l * 0.75, -l * 0.3, l, 0) + "C" + q(l * 0.75, l * 0.3, l * 0.3, l * 0.34, 0, 0) + "Z", col) +
      K.St("M" + q(l * 0.08, 0) + "L" + q(l * 0.85, 0), K.mix(col, "#000000", 0.4), 0.8, 0.5) + K.El(l * 0.4, -l * 0.1, l * 0.25, l * 0.08, K.soft("#ffffff", 0.35)) + "</g>";
  }
  // tesa davanti: dai lati (alzati a y yFine) fino al centro davanti (yFr); curva dietro nascosta dalla calotta
  function tesa(W2, yFine, yFr, yDietro) {
    return "M" + q(-W2, yFine) + "C" + q(-W2 * 0.96, yFine + (yDietro - yFine) * 0.7, -W2 * 0.55, yDietro, 0, yDietro) + "C" + q(W2 * 0.55, yDietro, W2 * 0.96, yFine + (yDietro - yFine) * 0.7, W2, yFine) +
      "C" + q(W2 * 0.97, yFr + (yFine - yFr) * 0.55, W2 * 0.5, yFr, 0, yFr) + "C" + q(-W2 * 0.5, yFr, -W2 * 0.97, yFr + (yFine - yFr) * 0.55, -W2, yFine) + "Z";
  }

  // ---------------------------------------------------------------- berretto di lana
  A.pezzo("cappelli", "berretto", function (K) {
    var P = pal(K), W = K.F.cw + 7, T = K.top, s = "", i;
    var dome = "M" + q(-(W - 2), -112) + "C" + q(-(W + 3), T + 28, -W * 0.6, T - 14, 0, T - 14) + "C" + q(W * 0.6, T - 14, W + 3, T + 28, W - 2, -112) + "Z";
    s += ombra(K, -92, W - 6, 12, 0.5);
    s += K.Pa(dome, dia(K, "bb1", P)) + "<g clip-path='" + K.clip(dome) + "'>";
    // coste della maglia: righe che salgono verso la cima
    for (i = -6; i <= 6; i++) {
      var x0 = i * (W / 5.6);
      s += K.St("M" + q(x0, -118) + "Q" + q(x0 * 0.92, (T + -118) / 2, x0 * 0.14, T - 12), P.dd, 1.7, 0.2) + K.St("M" + q(x0 + 2.4, -118) + "Q" + q(x0 * 0.92 + 2.4, (T + -118) / 2, x0 * 0.14 + 0.6, T - 12), P.l, 1.2, 0.22);
    }
    s += vol(K, W, T - 14, -104) + "</g>";
    // risvolto a coste
    var cuff = banda(-(W + 1), W + 1, -126, 3, -96, 7);
    s += K.El(0, -127, W, 6, K.soft("#000000", 0.35), "") + K.Pa(cuff, K.cil(P.c, 0.9)) + "<g clip-path='" + K.clip(cuff) + "'>";
    for (var x = -W; x <= W; x += 5.4) {
      s += K.St("M" + q(x, sag(-126, 3, x, W + 1)) + "L" + q(x, sag(-96, 7, x, W + 1)), P.dd, 1.6, 0.3) + K.St("M" + q(x + 2, sag(-126, 3, x, W + 1)) + "L" + q(x + 2, sag(-96, 7, x, W + 1)), P.l, 1.1, 0.25);
    }
    s += K.St("M" + q(-W, -125) + "Q" + q(0, -119, W, -125), P.l, 1.4, 0.55) + K.St("M" + q(-W, -97.5) + "Q" + q(0, -87, W, -97.5), P.dd, 2.4, 0.4) + "</g>";
    s += pom(K, 0, T - 20, 15, K.mix(P.c, "#ffffff", 0.3), 7);
    return { linea: -98, svg: s };
  });

  // ---------------------------------------------------------------- visiera (solo visiera, a testa scoperta)
  A.pezzo("cappelli", "visiera", function (K) {
    var P = pal(K), W = K.F.cw + 6, s = "";
    var fascia = banda(-W, W, -128, 3, -110, 4);
    s += ombra(K, -92, W, 12, 0.5);
    s += K.El(0, -108, W + 4, 9, K.soft("#000000", 0.35), "");
    s += K.Pa(fascia, K.cil(P.c, 0.9)) + K.St("M" + q(-W + 1, -126.5) + "Q" + q(0, -120.5, W - 1, -126.5), P.l, 1.4, 0.6);
    // visiera: dritta, larga, con il bordo cucito
    var br = "M" + q(-(W + 8), -110) + "Q" + q(0, -102, W + 8, -110) + "C" + q(W + 14, -103, W + 8, -96, W - 4, -92) + "Q" + q(0, -83, -(W - 4), -92) + "C" + q(-(W + 8), -96, -(W + 14), -103, -(W + 8), -110) + "Z";
    s += K.Pa(br, ver(K, "vi1", P)) + "<g clip-path='" + K.clip(br) + "'>" + K.Pa("M" + q(-(W + 14), -96) + "Q" + q(0, -88, W + 14, -96) + "L" + q(W + 14, -80) + "L" + q(-(W + 14), -80) + "Z", P.dd, " opacity='.6'") +
      K.El(W * 0.7, -100, W * 0.5, 12, K.soft("#000000", 0.3)) + K.El(-W * 0.45, -104, W * 0.4, 5, K.soft("#ffffff", 0.35)) + "</g>";
    s += K.St("M" + q(-(W + 4), -105) + "Q" + q(0, -97, W + 4, -105), P.l, 0.9, 0.55, " stroke-dasharray='2.4 2.4'");
    s += K.St("M" + q(-(W - 3), -93.5) + "Q" + q(0, -85.5, W - 3, -93.5), P.dd, 1.2, 0.3);
    return { svg: s };
  });

  // ---------------------------------------------------------------- cappello di paglia
  A.pezzo("cappelli", "paglia", function (K) {
    var W = K.F.cw + 5, T = K.top, s = "", i, x;
    var pg = { c: "#e3c27c", l: "#f6e2a6", m: "#d3ac5e", d: "#a47c38", dd: "#6e5022" };
    var nast = K.acc, nl = K.mix(nast, "#ffffff", 0.34), nd = K.mix(nast, "#000000", 0.42);
    var brim = "M-106 -107C-102 -121 -52 -128 0 -128C52 -128 102 -121 106 -107C104 -98 62 -91 0 -93C-62 -91 -104 -98 -106 -107Z";
    s += ombra(K, -90, 66, 14, 0.5);
    s += K.El(0, -92, 100, 10, K.soft("#000000", 0.25), "");
    s += K.Pa(brim, K.LG("pg1", 0, 0, 0, 1, [[0, pg.l], [0.5, pg.c], [1, pg.m]])) + "<g clip-path='" + K.clip(brim) + "'>";
    // intreccio della tesa: anelli
    for (i = 0; i < 9; i++) {
      var k = 1 - i * 0.075;
      s += "<g transform='translate(0 -110) scale(" + q(k, 0.3 + k * 0.7) + ") translate(0 110)'><path d='M-106 -107C-102 -121 -52 -128 0 -128C52 -128 102 -121 106 -107C104 -98 62 -91 0 -93C-62 -91 -104 -98 -106 -107Z' fill='none' stroke='" + pg.d + "' stroke-width='" + q(0.9 / k) + "' opacity='.32'/></g>";
    }
    s += K.El(60, -100, 60, 12, K.soft("#000000", 0.28)) + K.El(-50, -112, 50, 8, K.soft("#ffffff", 0.35)) + K.Pa("M-106 -103C-100 -97 -62 -90 0 -91C62 -90 100 -97 106 -103L106 -96C60 -85 -60 -85 -106 -96Z", pg.dd, " opacity='.25'") + "</g>";
    s += K.St("M-105 -104C-100 -98 -62 -92 0 -93.5C62 -92 100 -98 105 -104", pg.dd, 1.6, 0.5);
    // calotta
    var cr = "M" + q(-W, -108) + "C" + q(-W - 2, T + 12, -W * 0.82, T - 18, -W * 0.4, T - 21) + "Q" + q(0, T - 24, W * 0.4, T - 21) + "C" + q(W * 0.82, T - 18, W + 2, T + 12, W, -108) + "Q" + q(0, -92, -W, -108) + "Z";
    s += K.Pa(cr, K.LG("pg2", 0.05, 0, 0.95, 1, [[0, pg.l], [0.4, pg.c], [1, pg.d]])) + "<g clip-path='" + K.clip(cr) + "'>";
    for (i = -7; i <= 7; i++) s += K.St("M" + q(i * 2.2, T - 20) + "Q" + q(i * W / 7 * 0.85, T + 20, i * W / 6.4, -104), pg.dd, 1, 0.3);
    for (i = 0; i < 9; i++) { var yy = T - 14 + i * ((-104 - (T - 14)) / 8.5); s += K.St("M" + q(-W - 4, yy + 3) + "Q" + q(0, yy - 4, W + 4, yy + 3), pg.dd, 0.9, 0.28); }
    s += vol(K, W, T - 20, -104) + "</g>";
    // nastro + nodo
    var nb = banda(-(W + 1), W + 1, -126, 6, -108, 8);
    s += K.Pa(nb, K.cil(nast, 0.9)) + "<g clip-path='" + K.clip(nb) + "'>" + K.St("M" + q(-W, -121) + "Q" + q(0, -108, W, -121), nl, 1.2, 0.5) + "</g>";
    var bx = W * 0.55, by = sag(-117, 6, W * 0.55, W + 1);
    s += "<g transform='translate(" + q(bx, by) + ")'>" + K.Pa("M0 0C8 -9 18 -8 18 -1C18 7 8 8 0 1Z", nast) + K.Pa("M0 1C-6 9 -17 9 -17 1C-17 -6 -7 -8 0 0Z", nast) + K.Pa("M-2 3C-6 12 -8 18 -13 24L-6 26C-3 20 1 13 2 4Z", nd) + K.Pa("M1 3C4 11 8 16 14 21L9 25C4 19 0 13 -1 4Z", nd) +
      K.El(0, 0.5, 4, 4.5, K.RG("pg3" + (cnt++), [[0, nl], [1, nd]], "cx='.35' cy='.3' r='.8'")) + K.El(9, -3, 4, 1.6, "#ffffff", " opacity='.35'") + "</g>";
    return { linea: -98, svg: s };
  });

  // ---------------------------------------------------------------- borsalino
  A.pezzo("cappelli", "borsalino", function (K) {
    var P = pal(K), W = K.F.cw + 5, T = K.top, s = "", BD = contr(K, P);
    var brim = tesa(W + 24, -113, -93, -123);
    s += ombra(K, -90, W + 2, 12, 0.55);
    s += K.El(0, -100, W + 26, 10, K.soft("#000000", 0.28), "");
    s += K.Pa(brim, ver(K, "bo1", P)) + "<g clip-path='" + K.clip(brim) + "'>" + K.Pa("M" + q(-(W + 26), -100) + "Q" + q(0, -86, W + 26, -100) + "L" + q(W + 26, -80) + "L" + q(-(W + 26), -80) + "Z", P.dd, " opacity='.42'") +
      K.El((W + 10), -108, 26, 16, K.soft("#000000", 0.3)) + K.El(-(W + 6), -112, 24, 8, K.soft("#ffffff", 0.3)) + "</g>";
    s += "<g clip-path='" + K.clip(brim) + "'>" + K.St("M" + q(-(W + 22), -105) + "C" + q(-(W + 14), -97, -W * 0.5, -93, 0, -94) + "C" + q(W * 0.5, -93, W + 14, -97, W + 22, -105), P.l, 0.9, 0.5) + "</g>";
    // calotta con la fossetta
    var cr = "M" + q(-(W - 4), -106) + "C" + q(-(W - 3), T + 6, -(W - 9), T - 20, -W * 0.5, T - 26) + "C" + q(-W * 0.3, T - 28, -W * 0.12, T - 15, 0, T - 14) + "C" + q(W * 0.12, T - 15, W * 0.3, T - 28, W * 0.5, T - 26) + "C" + q(W - 9, T - 20, W - 3, T + 6, W - 4, -106) + "Q" + q(0, -94, -(W - 4), -106) + "Z";
    s += K.Pa(cr, dia(K, "bo2", P)) + "<g clip-path='" + K.clip(cr) + "'>";
    // le due pieghe che scendono dalla fossetta
    [-1, 1].forEach(function (sd) {
      s += K.St("M" + q(sd * W * 0.2, T - 14) + "C" + q(sd * W * 0.3, T + 10, sd * W * 0.34, -130, sd * W * 0.4, -118), P.dd, 7, 0.17) + K.St("M" + q(sd * W * 0.2, T - 14) + "C" + q(sd * W * 0.3, T + 10, sd * W * 0.34, -130, sd * W * 0.4, -118), P.dd, 1.4, 0.35);
    });
    s += K.El(0, T - 6, W * 0.22, 14, K.soft("#000000", 0.35)) + vol(K, W, T - 22, -104) + "</g>";
    // nastro con una penna
    var nb = banda(-(W - 3.5), W - 3.5, -121, 6, -106, 6);
    s += K.Pa(nb, K.cil(BD, 0.9)) + "<g clip-path='" + K.clip(nb) + "'>" + K.St("M" + q(-W, -118) + "Q" + q(0, -107, W, -118), K.mix(BD, "#ffffff", 0.35), 1, 0.5) + "</g>";
    var px = W * 0.5, py = sag(-113, 6, px, W);
    s += "<g transform='translate(" + q(px, py) + ") rotate(-18)'>" + K.Pa("M-2 3C0 -10 6 -26 16 -34C18 -22 12 -6 4 5Z", "#f4ecd8") + K.St("M0 2C4 -10 9 -22 15 -31", "#b8a98a", 0.9, 0.7) + K.Pa("M4 -12C8 -13 11 -12 13 -9C10 -9 7 -10 4 -12Z", "#ffffff", " opacity='.7'") + "</g>";
    return { linea: -100, svg: s };
  });

  // ---------------------------------------------------------------- coppola
  A.pezzo("cappelli", "coppola", function (K) {
    var P = pal(K), W = K.F.cw + 8, T = K.top, s = "", i, R = K.rnd(41);
    var cr = "M" + q(-(W + 1), -102) + "C" + q(-(W + 13), -114, -(W + 10), T + 14, -W * 0.5, T - 4) + "C" + q(-W * 0.22, T - 12, W * 0.22, T - 12, W * 0.5, T - 4) + "C" + q(W + 10, T + 14, W + 13, -114, W + 1, -102) + "Q" + q(0, -92, -(W + 1), -102) + "Z";
    s += ombra(K, -90, W - 6, 11, 0.5);
    // visierina corta
    var bill = "M" + q(-(W - 2), -104) + "Q" + q(0, -94, W - 2, -104) + "C" + q(W - 5, -96, W * 0.5, -90, 0, -90) + "C" + q(-W * 0.5, -90, -(W - 5), -96, -(W - 2), -104) + "Z";
    s += K.Pa(bill, ver(K, "co1", P)) + "<g clip-path='" + K.clip(bill) + "'>" + K.Pa("M" + q(-W, -97) + "Q" + q(0, -87, W, -97) + "L" + q(W, -85) + "L" + q(-W, -85) + "Z", P.dd, " opacity='.45'") + "</g>";
    s += K.Pa(cr, dia(K, "co2", P)) + "<g clip-path='" + K.clip(cr) + "'>";
    // spicchi che partono dal bottoncino, e la trama in tweed
    for (i = -3; i <= 3; i++) s += K.St("M" + q(0, T - 8) + "Q" + q(i * W * 0.4, T + 4, i * W * 0.56, -100), P.dd, 1.2, 0.35) + K.St("M" + q(1.4, T - 8) + "Q" + q(i * W * 0.4 + 1.4, T + 4, i * W * 0.56 + 1.4, -100), P.l, 0.8, 0.28);
    for (i = 0; i < 150; i++) { var x = (R() * 2 - 1) * (W + 10), y = T - 8 + R() * (-98 - T + 8); s += K.St("M" + q(x, y) + "l" + q(2.6, -2.6), R() < 0.5 ? P.dd : P.l, 0.9, 0.3); }
    s += K.El(W * 0.7, -126, W * 0.5, 36, K.soft("#000000", 0.4)) + K.El(-W * 0.5, T + 8, W * 0.45, 12, K.soft("#ffffff", 0.3)) + "</g>";
    s += K.El(0, T - 8, 3.8, 3.2, K.mix(P.c, "#000000", 0.3)) + K.El(-0.8, T - 9, 1.4, 1, K.mix(P.c, "#ffffff", 0.5));
    s += K.St("M" + q(-(W + 1), -102) + "Q" + q(0, -92, W + 1, -102), P.dd, 1.6, 0.4);
    return { linea: -102, svg: s };
  });

  // ---------------------------------------------------------------- cappello da pescatore
  A.pezzo("cappelli", "pescatore", function (K) {
    var P = pal(K), W = K.F.cw + 6, T = K.top, s = "", i;
    var cr = "M" + q(-W, -110) + "C" + q(-(W - 2), T + 30, -W * 0.8, T - 6, -W * 0.58, T - 12) + "Q" + q(0, T - 19, W * 0.58, T - 12) + "C" + q(W * 0.8, T - 6, W - 2, T + 30, W, -110) + "L" + q(W, -98) + "L" + q(-W, -98) + "Z";
    s += ombra(K, -89, W + 2, 10, 0.55);
    s += K.Pa(cr, dia(K, "pe1", P)) + "<g clip-path='" + K.clip(cr) + "'>" + K.St("M" + q(-W * 0.9, -120) + "Q" + q(0, -112, W * 0.9, -120), P.dd, 1.1, 0.3, " stroke-dasharray='2.4 2.4'") +
      K.St("M" + q(-W * 0.8, T + 6) + "Q" + q(0, T - 4, W * 0.8, T + 6), P.dd, 1.1, 0.3, " stroke-dasharray='2.4 2.4'");
    for (i = -2; i <= 2; i++) s += K.St("M" + q(i * W * 0.22, T - 12) + "L" + q(i * W * 0.28, -112), P.dd, 1, 0.22);
    s += vol(K, W, T - 14, -104) + "</g>";
    // due occhielli
    [-1, 1].forEach(function (sd) { var ex = sd * W * 0.74, ey = -134; s += K.El(ex, ey, 4.4, 3.8, P.dd, " opacity='.85'") + K.El(ex, ey, 2.4, 1.9, "#14080c", " opacity='.8'") + K.St("M" + q(ex - 4, ey + 3) + "Q" + q(ex, ey + 6, ex + 4, ey + 3), P.l, 0.9, 0.5); });
    // tesa che scende tutto intorno
    var br = "M" + q(-W, -112) + "C" + q(-(W + 10), -110, -(W + 22), -105, -(W + 27), -96) + "C" + q(-(W + 23), -90, -W * 0.6, -90, 0, -91.5) + "C" + q(W * 0.6, -90, W + 23, -90, W + 27, -96) + "C" + q(W + 22, -105, W + 10, -110, W, -112) + "Q" + q(0, -100, -W, -112) + "Z";
    s += K.Pa(br, ver(K, "pe2", P)) + "<g clip-path='" + K.clip(br) + "'>" + K.Pa("M" + q(-(W + 30), -98) + "C" + q(-(W + 20), -92, -W * 0.5, -91.5, 0, -93) + "C" + q(W * 0.5, -91.5, W + 20, -92, W + 30, -98) + "L" + q(W + 30, -80) + "L" + q(-(W + 30), -80) + "Z", P.dd, " opacity='.4'") +
      K.El(W + 12, -102, 22, 12, K.soft("#000000", 0.3)) + K.El(-(W + 8), -106, 22, 7, K.soft("#ffffff", 0.3)) + "</g>";
    s += K.St("M" + q(-(W + 20), -99) + "C" + q(-(W + 14), -94, -W * 0.55, -93.6, 0, -95) + "C" + q(W * 0.55, -93.6, W + 14, -94, W + 20, -99), P.l, 0.9, 0.55, " stroke-dasharray='2.4 2.4'");
    s += K.St("M" + q(-(W + 12), -105) + "C" + q(-(W + 8), -100.5, -W * 0.55, -99.6, 0, -101) + "C" + q(W * 0.55, -99.6, W + 8, -100.5, W + 12, -105), P.l, 0.9, 0.4, " stroke-dasharray='2.4 2.4'");
    return { linea: -100, svg: s };
  });

  // ---------------------------------------------------------------- basco
  A.pezzo("cappelli", "basco", function (K) {
    var P = pal(K), W = K.F.cw + 6, T = K.top, s = "", i;
    var d = "M" + q(-(W + 6), -112) + "C" + q(-(W + 18), T + 10, -42, T - 18, -4, T - 18) + "C" + q(32, T - 18, W + 28, T - 2, W + 24, -104) + "C" + q(W + 21, -96, W * 0.6, -98, 0, -100) + "C" + q(-W * 0.5, -102, -(W + 2), -104, -(W + 6), -112) + "Z";
    s += ombra(K, -92, W, 10, 0.45);
    s += K.Pa(d, dia(K, "ba1", P)) + "<g clip-path='" + K.clip(d) + "'>";
    // pieghe a raggiera dal gambo
    for (i = -4; i <= 4; i++) {
      var ex = i * (W * 0.42) + 6, ey = -100 + Math.abs(i) * 1.2;
      s += K.St("M" + q(-4, T - 14) + "Q" + q(-4 + i * 12, T + 12, ex, ey), P.dd, 3.4, 0.14) + K.St("M" + q(-4, T - 14) + "Q" + q(-4 + i * 12, T + 12, ex, ey), P.dd, 1, 0.3) + K.St("M" + q(-2.2, T - 14) + "Q" + q(-2.2 + i * 12, T + 12, ex + 2.5, ey), P.l, 0.9, 0.3);
    }
    s += K.El(W * 0.8, -118, W * 0.5, 30, K.soft("#000000", 0.4)) + K.El(-W * 0.55, T + 4, W * 0.5, 14, K.soft("#ffffff", 0.32)) + "</g>";
    // gambo
    s += K.Pa("M-8 " + q(T - 15) + "C-9 " + q(T - 23) + " -1 " + q(T - 24) + " 1 " + q(T - 22) + "C4 " + q(T - 21) + " 2 " + q(T - 15) + " 0 " + q(T - 14) + "Z", P.d) + K.El(-3, T - 20, 2, 1.4, P.l, " opacity='.7'");
    // fascetta di cuoio lungo il bordo
    s += K.St("M" + q(-(W + 4), -111) + "C" + q(-(W + 1), -104, -W * 0.5, -102, 0, -100.5) + "C" + q(W * 0.6, -98.5, W + 20, -96.5, W + 23, -104), P.dd, 4, 0.85) + K.St("M" + q(-(W + 4), -112.5) + "C" + q(-(W + 1), -105, -W * 0.5, -103.2, 0, -101.8) + "C" + q(W * 0.6, -100, W + 20, -98, W + 23, -105.5), P.l, 0.9, 0.4);
    return { linea: -102, svg: s };
  });

  // ---------------------------------------------------------------- cappello da chef
  A.pezzo("cappelli", "chef", function (K) {
    var W = K.F.cw + 5, T = K.top, s = "", i, x;
    var b = "#fbfbf9", bl = "#ffffff", bm = "#e6e8ec", bd = "#c4c9d4";
    var lobi = [[-W * 0.74, T + 8, 24], [-W * 0.36, T - 8, 26], [0, T - 16, 27], [W * 0.36, T - 8, 26], [W * 0.74, T + 8, 24]];
    s += ombra(K, -92, W - 4, 10, 0.4);
    // il cappello (puffo) a lobi
    var tutti = "";
    lobi.forEach(function (o) { tutti += "<circle cx='" + q(o[0]) + "' cy='" + q(o[1]) + "' r='" + o[2] + "'/>"; });
    var nuvola = K.clip(lobi.map(function (o) { return "M" + q(o[0] - o[2], o[1]) + "a" + o[2] + " " + o[2] + " 0 1 0 " + (o[2] * 2) + " 0a" + o[2] + " " + o[2] + " 0 1 0 " + (-o[2] * 2) + " 0Z"; }));
    s += K.Pa("M" + q(-W * 0.9, -128) + "L" + q(-W * 0.8, T - 4) + "L" + q(W * 0.8, T - 4) + "L" + q(W * 0.9, -128) + "Z", bm);
    lobi.forEach(function (o, k) { s += K.El(o[0], o[1], o[2], o[2], K.RG("ch" + (cnt++), [[0, bl], [0.6, b], [1, k > 2 ? bd : bm]], "cx='.38' cy='.3' r='.85'")); });
    s += "<g clip-path='" + nuvola + "'>" + K.El(W * 0.7, T + 6, W * 0.5, 40, K.soft("#6b7390", 0.3)) + "</g>";
    // pieghe del puffo
    s += K.St("M" + q(-W * 0.55, T - 4) + "Q" + q(-W * 0.45, T - 28, -W * 0.18, T - 36), bd, 1.2, 0.55) + K.St("M" + q(W * 0.55, T - 4) + "Q" + q(W * 0.45, T - 28, W * 0.18, T - 36), bd, 1.2, 0.55) + K.St("M" + q(0, T - 18) + "Q" + q(2, T - 4, 0, -118), bd, 1.1, 0.4);
    // fascia pieghettata
    var fa = "M" + q(-(W - 2), -105) + "Q" + q(0, -95, W - 2, -105) + "L" + q(W + 4, -136) + "Q" + q(0, -127, -(W + 4), -136) + "Z";
    s += K.Pa(fa, K.LG("ch1", 0, 0, 1, 0, [[0, bm], [0.15, bl], [0.5, b], [0.85, bm], [1, bd]])) + "<g clip-path='" + K.clip(fa) + "'>";
    for (i = -9; i <= 9; i++) { x = i * W / 8.6; s += K.St("M" + q(x * 0.98, -97) + "L" + q(x * 1.04, -136), i % 2 ? bd : bm, 1.5, 0.55); }
    s += K.El(0, -136, W + 4, 5, K.soft("#9aa1b6", 0.35)) + "</g>";
    s += K.St("M" + q(-(W - 2), -105) + "Q" + q(0, -95, W - 2, -105), bd, 1.4, 0.7);
    return { linea: -100, svg: s };
  });

  // ---------------------------------------------------------------- fascia per capelli (sportiva)
  A.pezzo("cappelli", "fascia", function (K) {
    var P = pal(K), W = K.F.cw + 5, s = "", i;
    var fa = banda(-W, W, -124, 3, -104, 4), bianco = K.lum(P.c) > 0.78 ? P.d : "#ffffff";
    s += ombra(K, -97, W - 5, 8, 0.45);
    s += K.El(0, -124, W, 5, K.soft("#000000", 0.25), "");
    s += K.Pa(fa, K.cil(P.c, 0.95)) + "<g clip-path='" + K.clip(fa) + "'>";
    // trama di spugna e righe
    for (var x = -W; x <= W; x += 3.6) for (var y = 0; y < 4; y++) s += "<path d='M" + q(x + (y % 2) * 1.8, sag(-122, 3, x, W) + y * 4.6) + "h.1' stroke='" + P.dd + "' stroke-width='1.3' stroke-linecap='round' opacity='.22'/>";
    s += K.St("M" + q(-W, -120) + "Q" + q(0, -114, W, -120), bianco, 1.5, 0.7) + K.St("M" + q(-W, -108.5) + "Q" + q(0, -100.5, W, -108.5), bianco, 1.5, 0.7);
    s += K.El(W * 0.75, -112, W * 0.4, 14, K.soft("#000000", 0.3)) + "</g>";
    s += K.St("M" + q(-W + 1, -123) + "Q" + q(0, -117, W - 1, -123), P.l, 1.1, 0.55) + K.St("M" + q(-W + 1, -105.2) + "Q" + q(0, -96.5, W - 1, -105.2), P.dd, 1.8, 0.35);
    return { svg: s };
  });

  // ---------------------------------------------------------------- cuffie musicali
  A.pezzo("cappelli", "cuffie", function (K) {
    var P = pal(K), cw = K.F.cw, T = K.top, s = "";
    var arco = "M" + q(-(cw + 9), -84) + "C" + q(-(cw + 11), T - 4, -cw * 0.5, T - 22, 0, T - 22) + "C" + q(cw * 0.5, T - 22, cw + 11, T - 4, cw + 9, -84);
    // archetto: pelle di sotto, poi il colore, il riflesso
    s += K.St(arco, "#000000", 13, 0.12, "") + K.St(arco, "#26262e", 10) + K.St(arco, ver(K, "cu0", P), 7.2) + K.St("M" + q(-(cw + 6), -104) + "C" + q(-(cw + 4), T + 2, -cw * 0.45, T - 19, 0, T - 19.4), P.l, 1.8, 0.7) +
      K.St("M" + q(cw + 12, -104) + "C" + q(cw + 8, T + 2, cw * 0.55, T - 19, 0, T - 19.4), P.dd, 1.6, 0.35);
    // i due padiglioni
    [-1, 1].forEach(function (sd) {
      var cx = sd * (cw + 9), cy = -60;
      s += "<g transform='translate(" + q(cx, cy) + ") rotate(" + q(sd * 5) + ")'>";
      s += K.El(0, 3, 20, 29, K.soft("#000000", 0.35), "");
      s += K.El(-sd * 4, 0, 16, 26, "#2a2a31");
      s += K.El(sd * 1.5, 0, 17, 26, K.LG("cu" + (sd + 2), sd < 0 ? 0 : 1, 0, sd < 0 ? 1 : 0, 1, [[0, P.l], [0.45, P.c], [1, P.d]]));
      s += K.El(sd * 2, 0, 11, 19, P.dd, " opacity='.5'") + K.El(sd * 2.4, -0.5, 9.4, 17.2, K.RG("cur" + (cnt++), [[0, P.c], [1, P.d]], "cx='.4' cy='.3' r='.8'"));
      s += K.St("M" + q(sd * 2.4 - 6, -8) + "Q" + q(sd * 2.4 - 4, -14, sd * 2.4 + 2, -15), P.l, 1.4, 0.6) + K.El(sd * -5.5, -17, 5, 2.2, "#ffffff", " opacity='.3'");
      s += K.El(sd * 2.4, 6, 3, 3, P.dd, " opacity='.6'");
      s += "</g>";
    });
    return { svg: s };
  });

  // ---------------------------------------------------------------- cappello da festa (cono)
  A.pezzo("cappelli", "festa", function (K) {
    var P = pal(K), T = K.top, s = "", bx = -6, by = T + 16, r = 33, tx = 6, ty = T - 56;
    var gia = "#ffd24a", gv = "#ffffff";
    var cono = "M" + q(bx - r, by) + "L" + q(tx, ty) + "L" + q(bx + r, by) + "Q" + q(bx, by + 11, bx - r, by) + "Z";
    s += K.El(bx, by + 2, r + 7, 8, K.soft("#000000", 0.4), "");
    s += K.Pa(cono, dia(K, "fe1", P)) + "<g clip-path='" + K.clip(cono) + "'>";
    // strisce oblique e pallini
    for (var i = 0; i < 5; i++) { var y0 = by - 8 - i * 14; s += K.Pa("M" + q(bx - r - 4, y0 + 4) + "L" + q(bx + r + 4, y0 - 12) + "L" + q(bx + r + 4, y0 - 6) + "L" + q(bx - r - 4, y0 + 10) + "Z", i % 2 ? gia : gv, " opacity='.85'"); }
    var R = K.rnd(9); for (i = 0; i < 12; i++) { var f = R(), px = bx + (tx - bx) * (1 - f) * 0.9 + (R() * 2 - 1) * r * f * 0.8, py = ty + (by - ty) * f; s += "<circle cx='" + q(px) + "' cy='" + q(py) + "' r='" + q(1.2 + R() * 1.2) + "' fill='" + (i % 2 ? gv : gia) + "' opacity='.9'/>"; }
    s += K.El(bx + r * 0.7, by - 22, r * 0.5, 38, K.soft("#000000", 0.4)) + K.El(bx - r * 0.5, by - 18, r * 0.3, 26, K.soft("#ffffff", 0.35)) + "</g>";
    s += K.Pa("M" + q(bx - r, by) + "Q" + q(bx, by + 11, bx + r, by) + "L" + q(bx + r - 1, by - 4) + "Q" + q(bx, by + 7, bx - r + 1, by - 4) + "Z", P.dd, " opacity='.55'");
    s += pom(K, tx, ty - 1, 7.5, gia, 3);
    return { svg: s };
  });

  // ---------------------------------------------------------------- Babbo Natale
  A.pezzo("cappelli", "babbo", function (K) {
    var P = pal(K), W = K.F.cw + 6, T = K.top, s = "", i;
    var corpo = "M" + q(-(W - 1), -116) + "C" + q(-(W + 5), T + 14, -W * 0.45, T - 16, W * 0.2, T - 16) + "C" + q(W * 0.85, T - 16, W + 34, T - 4, W + 40, T + 36) + "C" + q(W + 20, T + 18, W + 6, T + 22, W - 1, -116) + "Z";
    s += ombra(K, -92, W - 4, 11, 0.45);
    s += K.Pa(corpo, dia(K, "ba1", P)) + "<g clip-path='" + K.clip(corpo) + "'>" + K.St("M" + q(-W * 0.4, -118) + "C" + q(-W * 0.45, T + 6, -W * 0.1, T - 8, W * 0.3, T - 12), P.dd, 1.4, 0.3) + K.St("M" + q(W * 0.2, -112) + "C" + q(W * 0.6, T + 20, W + 8, T + 4, W + 30, T + 22), P.dd, 1.3, 0.28) +
      K.El(W * 0.85, T + 20, W * 0.4, 30, K.soft("#000000", 0.38)) + K.El(-W * 0.5, T + 4, W * 0.45, 14, K.soft("#ffffff", 0.3)) + K.El(0, T - 16, W, 12, K.soft("#ffffff", 0.18)) + "</g>";
    s += pom(K, W + 40, T + 38, 13.5, "#ffffff", 17);
    // fascia di pelo, a ciuffi
    var pelo = "#f7f8fa", pd = "#c9cfdb", pl = "#ffffff", fa = banda(-(W + 2), W + 2, -126, 4, -103, 5), R = K.rnd(23);
    s += K.El(0, -126, W, 5, K.soft("#000000", 0.25), "");
    for (i = 0; i <= 12; i++) { var x = -(W + 1) + i * (2 * W + 2) / 12; s += K.El(x, sag(-126, 4, x, W + 2) - 0.5, 8.4, 7, pelo) + K.El(x, sag(-103, 5, x, W + 2) + 1, 8.6, 7.6, pelo); }
    s += K.Pa(fa, K.LG("ba2", 0, 0, 1, 0, [[0, pd], [0.14, pl], [0.5, pelo], [0.86, pd], [1, "#aab1c2"]]));
    for (i = 0; i <= 12; i++) { x = -(W + 1) + i * (2 * W + 2) / 12; s += K.El(x, sag(-126, 4, x, W + 2) - 0.5, 8.4, 7, K.RG("bp" + (cnt++), [[0, pl], [0.7, pelo], [1, pd]], "cx='.4' cy='.35' r='.8'")) + K.El(x, sag(-103, 5, x, W + 2) + 1, 8.6, 7.6, K.RG("bp" + (cnt++), [[0, pl], [0.7, pelo], [1, pd]], "cx='.4' cy='.3' r='.8'")); }
    s += K.Pa(fa, K.LG("ba3", 0, 0, 1, 0, [[0, pd, 0.7], [0.14, pl, 0.15], [0.5, pelo, 0.05], [0.86, pd, 0.55], [1, "#aab1c2", 0.85]]));
    for (i = 0; i < 40; i++) { var fx = (R() * 2 - 1) * (W + 2), fy = sag(-114.5, 5, fx, W + 2) + (R() * 2 - 1) * 8; s += K.St("M" + q(fx, fy) + "l" + q((R() - 0.5) * 5, (R() - 0.5) * 4), i % 2 ? pd : pl, 1.1, 0.55); }
    return { linea: -100, svg: s };
  });

  // ---------------------------------------------------------------- cilindro
  A.pezzo("cappelli", "cilindro", function (K) {
    var P = pal(K), W = K.F.cw + 3, T = K.top, s = "", BD = contr(K, P), top = T - 46, rw = W - 1;
    var brim = tesa(W + 20, -112, -93, -121);
    s += ombra(K, -90, W + 2, 12, 0.55);
    s += K.El(0, -100, W + 22, 10, K.soft("#000000", 0.28), "");
    s += K.Pa(brim, ver(K, "ci1", P)) + "<g clip-path='" + K.clip(brim) + "'>" + K.Pa("M" + q(-(W + 22), -100) + "Q" + q(0, -87, W + 22, -100) + "L" + q(W + 22, -80) + "L" + q(-(W + 22), -80) + "Z", P.dd, " opacity='.45'") +
      K.El(W + 8, -108, 22, 14, K.soft("#000000", 0.3)) + K.El(-(W + 4), -111, 20, 7, K.soft("#ffffff", 0.3)) + "</g>";
    s += "<g clip-path='" + K.clip(brim) + "'>" + K.St("M" + q(-(W + 17), -105) + "C" + q(-(W + 10), -97.5, -W * 0.5, -93, 0, -94) + "C" + q(W * 0.5, -93, W + 10, -97.5, W + 17, -105), P.l, 0.9, 0.5) + "</g>";
    var cr = "M" + q(-W, -106) + "C" + q(-(W - 3), -140, -(rw - 1), top + 16, -rw, top) + "A" + q(rw, 7, 0, 0, 1, rw, top) + "C" + q(rw - 1, top + 16, W - 3, -140, W, -106) + "Q" + q(0, -94, -W, -106) + "Z";
    s += K.Pa(cr, K.LG("ci2", 0, 0, 1, 0, [[0, P.m], [0.15, P.l], [0.35, P.c], [0.75, P.d], [1, P.dd]])) + "<g clip-path='" + K.clip(cr) + "'>" +
      K.St("M" + q(-W * 0.78, -112) + "C" + q(-W * 0.78, -140, -rw * 0.78, top + 14, -rw * 0.76, top + 4), "#ffffff", 3, 0.3) + K.El(W * 0.7, -150, W * 0.3, 50, K.soft("#000000", 0.3)) + "</g>";
    // il piano di sopra
    var tp = "M" + q(-rw, top) + "C" + q(-rw, top - 10, rw, top - 10, rw, top) + "C" + q(rw, top + 10, -rw, top + 10, -rw, top) + "Z";
    s += K.Pa(tp, K.LG("ci3", 0, 0, 1, 1, [[0, P.l], [0.5, P.c], [1, P.m]])) + K.St("M" + q(-rw + 3, top + 2) + "C" + q(-rw * 0.5, top + 8, rw * 0.5, top + 8, rw - 3, top + 2), P.dd, 0.9, 0.25) + K.St("M" + q(-rw + 2, top - 1) + "C" + q(-rw * 0.4, top - 7, 0, top - 8, rw * 0.5, top - 6), "#ffffff", 1.2, 0.4);
    // nastro largo
    var nb = banda(-(W - 3), W - 3, -128, 5, -106, 6);
    s += K.Pa(nb, K.cil(BD, 0.9)) + "<g clip-path='" + K.clip(nb) + "'>" + K.St("M" + q(-W, -126) + "Q" + q(0, -116, W, -126), K.mix(BD, "#ffffff", 0.4), 1.1, 0.5) + "</g>";
    s += K.St("M" + q(-(W - 3), -106) + "Q" + q(0, -94, W - 3, -106), P.dd, 1.2, 0.35);
    return { linea: -100, svg: s };
  });

  // ---------------------------------------------------------------- cowboy
  A.pezzo("cappelli", "cowboy", function (K) {
    var P = pal(K), W = K.F.cw + 4, T = K.top, s = "", i, BD = contr(K, P), top = T - 26;
    var brim = tesa(W + 36, -126, -93, -123);
    s += ombra(K, -90, W + 4, 12, 0.55);
    s += K.El(0, -102, W + 40, 12, K.soft("#000000", 0.28), "");
    s += K.Pa(brim, ver(K, "cw1", P)) + "<g clip-path='" + K.clip(brim) + "'>" + K.Pa("M" + q(-(W + 40), -104) + "Q" + q(0, -86, W + 40, -104) + "L" + q(W + 40, -70) + "L" + q(-(W + 40), -70) + "Z", P.dd, " opacity='.4'") +
      K.El(W + 20, -112, 30, 20, K.soft("#000000", 0.32)) + K.El(-(W + 16), -116, 28, 12, K.soft("#ffffff", 0.3)) + "</g>";
    // bordo rullato davanti
    s += "<g clip-path='" + K.clip(brim) + "'>" + K.St("M" + q(-(W + 36), -122) + "C" + q(-(W + 26), -100, -W * 0.5, -92.5, 0, -93.4) + "C" + q(W * 0.5, -92.5, W + 26, -100, W + 36, -122), P.dd, 3.4, 0.5) + K.St("M" + q(-(W + 36), -125) + "C" + q(-(W + 26), -103, -W * 0.5, -95.6, 0, -96.4) + "C" + q(W * 0.5, -95.6, W + 26, -103, W + 36, -125), P.l, 0.9, 0.5) + "</g>";
    // calotta alta con la fossa in mezzo
    var cr = "M" + q(-(W - 2), -108) + "C" + q(-(W - 1), top + 22, -(W - 6), top + 2, -W * 0.56, top - 2) + "C" + q(-W * 0.36, top - 5, -W * 0.14, top + 16, 0, top + 18) + "C" + q(W * 0.14, top + 16, W * 0.36, top - 5, W * 0.56, top - 2) + "C" + q(W - 6, top + 2, W - 1, top + 22, W - 2, -108) + "Q" + q(0, -96, -(W - 2), -108) + "Z";
    s += K.Pa(cr, dia(K, "cw2", P)) + "<g clip-path='" + K.clip(cr) + "'>";
    [-1, 1].forEach(function (sd) { s += K.St("M" + q(sd * W * 0.12, top + 16) + "C" + q(sd * W * 0.22, top + 34, sd * W * 0.26, -134, sd * W * 0.3, -120), P.dd, 8, 0.15) + K.St("M" + q(sd * W * 0.12, top + 16) + "C" + q(sd * W * 0.22, top + 34, sd * W * 0.26, -134, sd * W * 0.3, -120), P.dd, 1.3, 0.35); });
    s += K.El(0, top + 22, W * 0.2, 14, K.soft("#000000", 0.4)) + vol(K, W, top - 4, -104) + "</g>";
    // fascia di cuoio con borchie
    var nb = banda(-(W - 2), W - 2, -122, 5, -108, 6);
    s += K.Pa(nb, K.cil(BD, 0.9)) + "<g clip-path='" + K.clip(nb) + "'>" + K.St("M" + q(-W, -120) + "Q" + q(0, -111, W, -120), K.mix(BD, "#ffffff", 0.35), 1, 0.45) + "</g>";
    [-24, -8, 8, 24].forEach(function (x, k) { var y = sag(-115, 5.5, x, W - 2); s += K.El(x, y, 3.2, 3.2, K.RG("cc" + (cnt++), [[0, "#fff1b0"], [0.6, "#e4b93c"], [1, "#9a6c14"]], "cx='.35' cy='.3' r='.8'")); });
    return { linea: -100, svg: s };
  });

  // ---------------------------------------------------------------- coroncina di fiori
  A.pezzo("cappelli", "fiori", function (K) {
    var cw = K.F.cw, s = "", i, W = cw + 3, vite = [];
    var verde = "#4f9a3c", verde2 = "#2f6f2a", vd = K.mix(verde, "#14320f", 0.3);
    function ya(x) { return sag(-124, 13, x, W); }
    var pts = []; for (i = 0; i <= 10; i++) { var x = -W + i * (2 * W) / 10; pts.push([x, ya(x)]); }
    var arco = K.liscio(pts);
    s += K.St(arco, "#000000", 8, 0.14, " transform='translate(0 2)'");
    s += K.St(arco, vd, 5.2) + K.St(arco, verde, 3.6) + K.St(arco, "#8ccf6a", 1, 0.7, " transform='translate(0 -1)'");
    // foglie a coppie lungo il ramo
    for (i = 0; i < 14; i++) { var xx = -W + 4 + i * (2 * W - 8) / 13, yy = ya(xx), rot = (i % 2 ? -1 : 1) * 48 + (xx > 0 ? 8 : -8) + (i % 2 ? 180 : 0); s += foglia(K, xx, yy, 19, i % 2 ? 150 : 30 + (xx < 0 ? 0 : 0), i % 3 ? verde : verde2); }
    // fiori (con il colore scelto) e bottoncini
    var col = [K.acc, "#ffffff", "#ffd24a", "#ff93b5", "#c8b2ff", K.acc, "#ffffff"], rag = [14, 11, 12, 11, 11.5, 10.5, 14];
    var pos = [-0.86, -0.58, -0.3, 0, 0.3, 0.58, 0.86];
    var ord = [0, 6, 1, 5, 2, 4, 3];
    ord.forEach(function (k) {
      var fx = pos[k] * W, fy = ya(fx) - 1.5, c = col[k];
      s += fiore(K, fx, fy, rag[k] * (k === 3 ? 1.25 : 1), c, k * 23, c === "#ffd24a" ? "#ff8a2a" : (c === "#ffffff" ? "#ffc83d" : null));
    });
    [-0.72, -0.44, -0.15, 0.15, 0.44, 0.72].forEach(function (u, k) {
      var bx = u * W, by = ya(bx) + (k % 2 ? 7 : -9);
      s += K.St("M" + q(bx, ya(bx)) + "L" + q(bx, by), verde2, 1.2) + K.El(bx, by, 3, 3, K.RG("bu" + (cnt++), [[0, "#ffffff"], [1, k % 2 ? "#ffb3c8" : "#fff0a0"]], "cx='.35' cy='.3' r='.8'"));
    });
    return { svg: s };
  });

  // ---------------------------------------------------------------- cerchietto
  A.pezzo("cappelli", "cerchietto", function (K) {
    var P = pal(K), cw = K.F.cw, T = K.top, s = "";
    var rx = cw + 1, cy = -84, ry = cy - (T - 2);
    var arco = "M" + q(-rx, cy) + "A" + q(rx, ry, 0, 0, 1, rx, cy);
    // ombra sui capelli, poi il cerchietto con il suo volume
    s += K.St(arco, "#000000", 9, 0.16, " transform='translate(1.5 3)'") + K.St(arco, P.d, 7.4) + K.St(arco, ver(K, "ce1", P), 5.6);
    s += K.St("M" + q(-rx + 1.5, cy - 8) + "A" + q(rx - 1, ry - 1, 0, 0, 1, -rx * 0.2, T - 1.4), P.l, 1.6, 0.75);
    s += K.St("M" + q(rx * 0.3, T - 1) + "A" + q(rx, ry, 0, 0, 1, rx - 1, cy - 12), P.dd, 1.4, 0.3);
    [-1, 1].forEach(function (sd) { s += K.El(sd * rx, cy, 4.2, 5, P.d) + K.El(sd * rx - sd * 0.6, cy - 0.5, 3, 3.6, P.c); });
    return { svg: s };
  });

  // ---------------------------------------------------------------- fiocco
  A.pezzo("cappelli", "fiocco", function (K) {
    var P = pal(K), T = K.top, s = "", cx = 20, cy = T + 4;
    s += K.El(cx, cy + 4, 38, 14, K.soft("#000000", 0.35), "");
    var occhio = "M3 0C12 -18 38 -26 44 -8C48 8 26 22 4 4Z";
    var gl = K.LG("fi1", 0, 0, 1, 1, [[0, P.l], [0.45, P.c], [1, P.d]]), gr = K.LG("fi2", 1, 0, 0, 1, [[0, P.l], [0.45, P.c], [1, P.d]]);
    function ansa(sd, g) {
      return "<g transform='scale(" + sd + " 1)'>" + K.Pa(occhio, g) + "<g clip-path='" + K.clip(occhio) + "'>" + K.St("M6 -1C16 -14 34 -18 41 -9", P.dd, 5, 0.18) + K.St("M7 1C20 -6 33 -6 42 -2", P.dd, 1.3, 0.3) + K.St("M8 -3C18 -13 32 -17 39 -12", P.l, 1.4, 0.55) +
        K.El(34, 2, 16, 12, K.soft("#000000", 0.3)) + "</g></g>";
    }
    var tail = function (sd, g) { return "<g transform='scale(" + sd + " 1)'>" + K.Pa("M2 6C8 18 12 28 14 40L24 36C20 26 12 14 6 2Z", g) + K.St("M7 8C11 18 15 26 18 34", P.dd, 1.1, 0.3) + "</g>"; };
    s += "<g transform='translate(" + q(cx, cy) + ") rotate(-8) scale(1.4)'>";
    s += tail(1, gr) + tail(-1, gl) + ansa(-1, gl) + ansa(1, gr);
    s += K.Pa("M-8 -2C-8 -12 8 -12 8 -2C8 8 -8 8 -8 -2Z", K.RG("fi3" + (cnt++), [[0, P.l], [0.6, P.c], [1, P.d]], "cx='.4' cy='.3' r='.8'")) + K.St("M-4 -8C-1 -10 3 -10 5 -7", "#ffffff", 1.3, 0.5);
    s += "</g>";
    return { svg: s };
  });

  /* ---- PEZZI FATTI: berretto, visiera, paglia, borsalino, coppola, pescatore, basco, chef, fascia, cuffie, festa, babbo,
     cilindro, cowboy, fiori, cerchietto, fiocco. Il cappellino lo fa il motore.
     Note: i capelli molto larghi (lunghi, ricci) restano tagliati in piano alla linea del cappello (come col cappellino); cilindro, chef e festa sono alti e nel busto stretto toccano il bordo alto. ---- */
})();


// ---- accessori ----
(function () {
  var A = window.SGOminoA;
  // ====== OCCHIALI e ORECCHINI (coordinate della testa) ======
  var ORO = ["#fff0b8", "#e8b84a", "#9c6a18"], ARG = ["#ffffff", "#c6cdd8", "#788396"];

  // gradiente «metallo» (chiaro in alto a sinistra, scuro in basso a destra)
  function metallo(K, id, m) { return K.LG(id, 0, 0, 1, 1, [[0, m[0]], [0.45, m[1]], [1, m[2]]]); }

  // montatura: contorno col suo colore + filo di luce in alto a sinistra
  function mont(K, d, col, w, luce) {
    return K.St(d, K.scuro(col, 0.35), w + 0.9, 0.9) + K.St(d, col, w) + "<g transform='translate(-.5 -.6)'>" + K.St(d, luce || K.chiaro(col, 0.55), w * 0.32, 0.55) + "</g>";
  }

  // un paio di lenti uguali: path locale (x positivo = verso l'esterno, eye a 0,0), asimmetriche con lato
  // opz: {col, w, lente:[colSopra, colSotto, opSopra, opSotto], rif: forza riflesso, dy, sca, ponte:[x,y], dentro: svg extra dentro la lente}
  function paio(K, id, d, o) {
    var P = K.occhiPos, s = "", i, lato;
    var lg = K.LG(id + "l", 0, 0, 1, 1, [[0, o.lente[0], o.lente[2]], [1, o.lente[1], o.lente[3]]]);
    var clipLente = K.clip(d);
    for (i = 0; i < 2; i++) {
      lato = i ? 1 : -1;
      s += "<g transform='translate(" + K.n1(lato * P.dx) + " " + K.n1(P.y + (o.dy || 0)) + ") scale(" + K.n1(lato * P.k * (o.sca || 1)) + " " + K.n1(P.k * (o.sca || 1)) + ")'>";
      s += K.Pa(d, lg, " stroke='none'");
      s += "<g clip-path='" + clipLente + "'><g transform='scale(" + lato + " 1)'>" + (o.dentro || "") +
        K.St("M-15 12L2 -16", "#ffffff", 5, 0.38 * (o.rif == null ? 1 : o.rif)) + K.St("M-6 14L10 -10", "#ffffff", 2, 0.28 * (o.rif == null ? 1 : o.rif)) + "</g></g>";
      s += mont(K, d, o.col, o.w, o.luce);
      s += "</g>";
    }
    return s;
  }
  // ponte e stanghette (coordinate della testa); R = mezza larghezza della lente, ri = tra gli occhi
  function stanghette(K, col, w, R, yTop) {
    var P = K.occhiPos, cw = K.F.cw, s = "";
    for (var i = 0; i < 2; i++) {
      var l = i ? 1 : -1, x1 = l * (P.dx + R * P.k), y1 = P.y + (yTop || -4) * P.k;
      s += K.St("M" + K.n1(x1) + " " + K.n1(y1) + "C" + K.n1(l * (cw - 6)) + " " + K.n1(y1 - 1) + " " + K.n1(l * (cw - 1)) + " " + K.n1(-80) + " " + K.n1(l * (cw + 1.5)) + " " + K.n1(-79), K.scuro(col, 0.4), w + 0.6, 0.35) +
        K.St("M" + K.n1(x1) + " " + K.n1(y1) + "C" + K.n1(l * (cw - 6)) + " " + K.n1(y1 - 1) + " " + K.n1(l * (cw - 1)) + " " + K.n1(-80) + " " + K.n1(l * (cw + 1.5)) + " " + K.n1(-79), col, w);
    }
    return s;
  }
  function ponte(K, col, w, R, yy, alto) {
    var P = K.occhiPos, xi = (P.dx - R * P.k) + 0.5, y = P.y + (yy || -4) * P.k, a = alto == null ? -3 : alto;
    var d = "M" + K.n1(-xi) + " " + K.n1(y) + "C" + K.n1(-xi * 0.45) + " " + K.n1(y + a) + " " + K.n1(xi * 0.45) + " " + K.n1(y + a) + " " + K.n1(xi) + " " + K.n1(y);
    return K.St(d, K.scuro(col, 0.4), w + 0.9, 0.9) + K.St(d, col, w);
  }
  // ombra morbida delle lenti sul viso (poco)
  function ombra(K, rx, ry) {
    var P = K.occhiPos, s = "";
    for (var i = 0; i < 2; i++) s += K.El((i ? 1 : -1) * P.dx + 2.5, P.y + 4, rx * P.k, ry * P.k, K.soft(K.skDD, 0.28));
    return "<g clip-path='" + K.clip(K.faceD) + "'>" + s + "</g>";
  }

  // ---------- da sole (wayfarer) ----------
  A.pezzo("occhiali", "sole", function (K) {
    var d = "M-17 -11C-17 -13 -16 -14 -14 -14H17C19 -14 20 -13 19.6 -11L17.5 6C16.5 12 12 15 6 15H-6C-12 15 -15.5 11 -16 5Z";
    var col = "#20222c";
    var dentro = K.St("M-12 8C-6 12 6 12 12 8", "#9db4d6", 1.2, 0.25);
    return ombra(K, 20, 15) + stanghette(K, col, 3.2, 19.5, -9) + ponte(K, col, 3.4, 18, -9, -2) +
      paio(K, "ac_so", d, { col: col, w: 3.8, lente: ["#4a5266", "#0c0e16", 0.95, 0.96], rif: 1.3, dentro: dentro, luce: "#7d86a0" });
  });
  // ---------- tondi ----------
  A.pezzo("occhiali", "tondi", function (K) {
    var d = "M-15 0A15 15 0 1 0 15 0A15 15 0 1 0 -15 0Z", col = "#c79a3c";
    return stanghette(K, col, 1.9, 15, -3) + ponte(K, col, 1.9, 15, -4, -4) +
      paio(K, "ac_to", d, { col: col, w: 2.7, lente: ["#e8f3ff", "#bcd0e8", 0.22, 0.1], luce: "#fff3c4" });
  });
  // ---------- quadrati ----------
  A.pezzo("occhiali", "quadrati", function (K) {
    var d = "M-17 -10C-17 -13 -15 -14 -12 -14H13C16 -14 18 -13 18 -10V8C18 12 15 14 12 14H-12C-15 14 -17 12 -17 8Z", col = "#2b2630";
    return ombra(K, 19, 14) + stanghette(K, col, 3, 18, -8) + ponte(K, col, 3, 17, -8, -3) +
      paio(K, "ac_qu", d, { col: col, w: 3.3, lente: ["#eaf4ff", "#c4d6ec", 0.24, 0.1], luce: "#8a8296" });
  });
  // ---------- felina (cat-eye) ----------
  A.pezzo("occhiali", "felina", function (K) {
    var d = "M-15 -3C-15 -10 -9 -12 -2 -12C7 -12 14 -15 21 -21C22 -12 20 -1 15 6C11 12 4 14 -3 14C-11 14 -15 9 -15 -3Z", col = "#5b1c40";
    var P = K.occhiPos;
    return stanghette(K, col, 2.6, 20, -14) + ponte(K, col, 2.6, 15, -7, -3) +
      paio(K, "ac_fe", d, { col: col, w: 3, lente: ["#f2e6f8", "#cdb4dc", 0.26, 0.12], luce: "#e9a6c9",
        dentro: K.St("M-12 -3C-10 -8 -2 -9 4 -9", "#ffffff", 1, 0.35) });
  });
  // ---------- aviatore (a goccia, metallo, lenti sfumate) ----------
  A.pezzo("occhiali", "aviatore", function (K) {
    var d = "M-16 -11C-16 -14 -9 -15 0 -15C10 -15 18 -14 18 -10C18 4 12 15 1 15C-9 15 -16 5 -16 -11Z", m = metallo(K, "ac_avm", ORO), col = "#d9ab45";
    return ombra(K, 19, 15) + stanghette(K, col, 1.9, 18, -10) + ponte(K, col, 1.7, 16, -10, -3) + ponte(K, col, 1.4, 16, -3, -6) +
      paio(K, "ac_av", d, { col: col, w: 2.2, lente: ["#1d3a30", "#7fa593", 0.88, 0.1], rif: 1.1, luce: "#fff3c0" });
  });
  // ---------- grandi (da diva) ----------
  A.pezzo("occhiali", "grandi", function (K) {
    var d = "M-21 -5C-21 -17 -11 -20 0 -20C13 -20 22 -16 22 -3C22 11 14 20 0 20C-13 20 -21 14 -21 -5Z", col = "#6b3a22";
    var R = K.rnd(11), mac = "";
    for (var i = 0; i < 16; i++) { var a = R() * 6.28, r = 17 + R() * 5; mac += K.El(Math.cos(a) * r, Math.sin(a) * r * 0.95, 1.6 + R() * 2, 1.4 + R() * 1.6, "#2d1409") ; }
    return ombra(K, 24, 20) + stanghette(K, col, 3.4, 22, -14) + ponte(K, col, 3.2, 20, -10, -1) +
      paio(K, "ac_gr", d, { col: col, w: 3.8, lente: ["#f0e7e0", "#c9b6a8", 0.25, 0.18], luce: "#d99a66", sca: 1 });
  });
  // ---------- a cuore ----------
  A.pezzo("occhiali", "cuore", function (K) {
    var d = "M0 13C-13 6 -19 -1 -19 -7C-19 -13 -14 -16 -9.5 -16C-5 -16 -1 -14 0 -9.5C1 -14 5 -16 9.5 -16C14 -16 19 -13 19 -7C19 -1 13 6 0 13Z", col = K.acc;
    return stanghette(K, col, 2.4, 18, -9) + ponte(K, col, 2.4, 14, -9, -2) +
      paio(K, "ac_cu", d, { col: col, w: 3, lente: [K.chiaro(col, 0.8), K.chiaro(col, 0.5), 0.35, 0.22], dy: 1, rif: 1 });
  });
  // ---------- sportivi (a fascia avvolgente) ----------
  A.pezzo("occhiali", "sportivi", function (K) {
    var P = K.occhiPos, k = P.k, X = P.dx + 19 * k, y = P.y, n = K.n1, col = "#1d2230", cw = K.F.cw;
    var d = "M" + n(-X) + " " + n(y - 4 * k) + "C" + n(-X + 1) + " " + n(y - 11 * k) + " " + n(-X + 12) + " " + n(y - 14 * k) + " " + n(-7) + " " + n(y - 12 * k) +
      "C" + n(-3) + " " + n(y - 11 * k) + " " + n(-2.5) + " " + n(y - 7 * k) + " 0 " + n(y - 7 * k) + "C" + n(2.5) + " " + n(y - 7 * k) + " " + n(3) + " " + n(y - 11 * k) + " " + n(7) + " " + n(y - 12 * k) +
      "C" + n(X - 12) + " " + n(y - 14 * k) + " " + n(X - 1) + " " + n(y - 11 * k) + " " + n(X) + " " + n(y - 4 * k) +
      "C" + n(X + 1) + " " + n(y + 6 * k) + " " + n(X - 7) + " " + n(y + 13 * k) + " " + n(X - 16) + " " + n(y + 13 * k) +
      "C" + n(X - 28) + " " + n(y + 13 * k) + " " + n(5) + " " + n(y + 7 * k) + " 0 " + n(y + 6 * k) +
      "C" + n(-5) + " " + n(y + 7 * k) + " " + n(-X + 28) + " " + n(y + 13 * k) + " " + n(-X + 16) + " " + n(y + 13 * k) +
      "C" + n(-X + 7) + " " + n(y + 13 * k) + " " + n(-X - 1) + " " + n(y + 6 * k) + " " + n(-X) + " " + n(y - 4 * k) + "Z";
    var lg = K.LG("ac_spl", 0, 0, 1, 1, [[0, "#5ad0ff", 0.9], [0.45, "#1c4f8a", 0.92], [1, "#0b1a33", 0.96]]);
    var s = ombra(K, 24, 15);
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, ey = y - 5 * k;
      s += K.St("M" + n(l * (X - 1)) + " " + n(ey) + "C" + n(l * (cw - 2)) + " " + n(ey - 2) + " " + n(l * cw) + " -80 " + n(l * (cw + 1.5)) + " -79", col, 3.4); }
    s += K.Pa(d, lg, " stroke='none'") + "<g clip-path='" + K.clip(d) + "'>" +
      K.St("M" + n(-X + 6) + " " + n(y + 10 * k) + "L" + n(-X + 26) + " " + n(y - 14 * k), "#ffffff", 5, 0.35) + K.St("M" + n(X - 30) + " " + n(y + 12 * k) + "L" + n(X - 12) + " " + n(y - 12 * k), "#ffd27a", 2.4, 0.3) +
      K.St("M" + n(-X + 3) + " " + n(y + 4 * k) + "C" + n(-X + 12) + " " + n(y + 11 * k) + " " + n(-20) + " " + n(y + 12 * k) + " " + n(-4) + " " + n(y + 8 * k), "#ffffff", 1.2, 0.2) + "</g>";
    s += mont(K, d, col, 3.2, "#7d8ab0");
    s += K.St("M" + n(-X + 3) + " " + n(y - 9 * k) + "C" + n(-X + 12) + " " + n(y - 13 * k) + " " + n(-14) + " " + n(y - 12 * k) + " " + n(-7) + " " + n(y - 11 * k), "#ff5a7a", 1.1, 0.8);
    return s;
  });
  // ---------- a stella ----------
  A.pezzo("occhiali", "stelle", function (K) {
    var col = K.acc, pts = [], i, r;
    for (i = 0; i < 10; i++) { r = i % 2 ? 9.5 : 20; var a = -Math.PI / 2 + i * Math.PI / 5; pts.push(K.n1(Math.cos(a) * r) + " " + K.n1(Math.sin(a) * r)); }
    var d = "M" + pts.join("L") + "Z";
    var sc = "<g stroke-linejoin='round'>";
    // la stella ha il centro un filo più in basso rispetto all'occhio
    return stanghette(K, col, 2.2, 14, 0) + ponte(K, col, 2.2, 9, 2, -2) +
      "<g stroke-linejoin='round'>" + paio(K, "ac_st", d, { col: col, w: 2.6, lente: [K.chiaro(col, 0.8), K.chiaro(col, 0.45), 0.4, 0.28], dy: 1.5, rif: 0.8 }) + "</g>";
  });
  // ---------- benda da pirata ----------
  A.pezzo("occhiali", "benda", function (K) {
    var P = K.occhiPos, n = K.n1, x = P.dx, y = P.y, k = P.k, cw = K.F.cw;
    var strap = "#17151b", lg = K.LG("ac_be", 0, 0, 1, 1, [[0, "#454858"], [0.5, "#1c1d27"], [1, "#07070b"]]);
    var s = "";
    // laccio: dalla benda in diagonale sulla fronte e verso l'orecchio
    var l1 = "M" + n(x - 2) + " " + n(y - 12 * k) + "C" + n(x - 30) + " " + n(y - 40) + " " + n(-cw + 6) + " -118 " + n(-cw - 0.5) + " -112";
    var l2 = "M" + n(x + 10 * k) + " " + n(y - 4) + "C" + n(cw - 8) + " " + n(y - 6) + " " + n(cw - 1) + " -82 " + n(cw + 1) + " -80";
    s += K.St(l1, "#000000", 5.2, 0.25) + K.St(l1, strap, 4.4) + K.St(l1, "#ffffff", 1, 0.14);
    s += K.St(l2, strap, 4);
    var d = "M-14 -7C-14 -15 -5 -18 3 -16C13 -13 16 -3 13 7C10 15 -5 16 -11 9C-13 6 -14 2 -14 -7Z";
    s += "<g transform='translate(" + n(x) + " " + n(y) + ") scale(" + n(k) + ")'>" + K.El(2, 4, 19, 16, K.soft("#000000", 0.3)) + K.Pa(d, lg, " stroke='" + "#000" + "' stroke-opacity='.5' stroke-width='1.4'");
    s += "<g clip-path='" + K.clip(d) + "'>" + K.St("M-9 5C-8 -6 -2 -13 6 -13", "#ffffff", 2.4, 0.22) + K.El(-5, -7, 6, 4, K.soft("#ffffff", 0.2)) + K.El(8, 10, 10, 8, K.soft("#000000", 0.4)) + "</g>";
    // cuciture a punti
    s += K.St("M-10 -5C-9 -11 -3 -14 3 -13", "#7a7d92", 0.8, 0.45, " stroke-dasharray='1.6 1.6'") + "</g>";
    return s;
  });
  // ---------- mascherina da supereroe ----------
  A.pezzo("occhiali", "mascherina", function (K) {
    var P = K.occhiPos, n = K.n1, x = P.dx, y = P.y, k = P.k, col = K.acc, X = x + 21 * k;
    var d = "M" + n(-X) + " " + n(y - 15 * k) + "C" + n(-X + 10) + " " + n(y - 10 * k) + " " + n(-x - 2) + " " + n(y - 19 * k) + " 0 " + n(y - 12 * k) +
      "C" + n(x + 2) + " " + n(y - 19 * k) + " " + n(X - 10) + " " + n(y - 10 * k) + " " + n(X) + " " + n(y - 15 * k) +
      "C" + n(X + 1) + " " + n(y - 3 * k) + " " + n(X - 4) + " " + n(y + 9 * k) + " " + n(X - 14) + " " + n(y + 11 * k) +
      "C" + n(x + 6) + " " + n(y + 13 * k) + " " + n(5) + " " + n(y + 7 * k) + " 0 " + n(y + 6 * k) + "C" + n(-5) + " " + n(y + 7 * k) + " " + n(-x - 6) + " " + n(y + 13 * k) + " " + n(-X + 14) + " " + n(y + 11 * k) +
      "C" + n(-X + 4) + " " + n(y + 9 * k) + " " + n(-X - 1) + " " + n(y - 3 * k) + " " + n(-X) + " " + n(y - 15 * k) + "Z";
    var hole = function (l) { var cx = l * x, rx = 13.5 * k, ry = 8.6 * k; return "M" + n(cx - rx) + " " + n(y) + "C" + n(cx - rx) + " " + n(y - ry * 1.15) + " " + n(cx + rx) + " " + n(y - ry * 1.15) + " " + n(cx + rx) + " " + n(y) + "C" + n(cx + rx) + " " + n(y + ry * 1.15) + " " + n(cx - rx) + " " + n(y + ry * 1.15) + " " + n(cx - rx) + " " + n(y) + "Z"; };
    var gr = K.LG("ac_ma", 0, 0, 1, 1, [[0, K.chiaro(col, 0.35)], [0.5, col], [1, K.scuro(col, 0.45)]]);
    var full = d + hole(-1) + hole(1);
    var s = "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(0, y + 4, X + 6, 17, K.soft(K.skDD, 0.3)) + "</g>";
    s += "<path d='" + full + "' fill='" + gr + "' fill-rule='evenodd'/>";
    s += "<g clip-path='" + K.clip(d) + "'>" + K.St("M" + n(-X + 6) + " " + n(y - 12 * k) + "C" + n(-x) + " " + n(y - 15 * k) + " " + n(-10) + " " + n(y - 12 * k) + " -4 " + n(y - 10 * k), "#ffffff", 2.4, 0.3) +
      K.El(x * 0.9, y + 8 * k, 22, 6, K.soft("#000000", 0.28)) + "</g>";
    s += "<path d='" + full + "' fill='none' stroke='" + K.scuro(col, 0.5) + "' stroke-width='1.3' stroke-opacity='.85' fill-rule='evenodd' stroke-linejoin='round'/>";
    // bordo interno dei fori (luce sotto, ombra sopra)
    s += K.St(hole(-1), K.scuro(col, 0.6), 1, 0.4) + K.St(hole(1), K.scuro(col, 0.6), 1, 0.4);
    // lacci verso le orecchie
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1; s += K.St("M" + n(l * (X - 1)) + " " + n(y - 9 * k) + "L" + n(l * (K.F.cw + 1)) + " -80", K.scuro(col, 0.3), 2.2, 0.9); }
    return s;
  });

  // ================= ORECCHINI =================
  function lobo(K, l) { return { x: l * (K.F.cw + 3.5), y: -48 }; }
  function arco(x, cy, r, a, b) { var f = function (t) { t *= Math.PI / 180; return (x + Math.cos(t) * r).toFixed(1) + " " + (cy + Math.sin(t) * r).toFixed(1); }; return "M" + f(a) + "A" + r + " " + r + " 0 0 1 " + f(b); }
  function anello(x, cy, r) { return "M" + (x - r) + " " + cy + "A" + r + " " + r + " 0 1 0 " + (x + r) + " " + cy + "A" + r + " " + r + " 0 1 0 " + (x - r) + " " + cy + "Z"; }
  function riflesso(x, y) { return "<circle cx='" + x + "' cy='" + y + "' r='.9' fill='#fff' opacity='.9'/>"; }
  // contatto con la pelle (ombra morbida sotto il gioiello)
  function om(K, x, y, rx, ry) { return K.El(x + 1.2, y + 1.5, rx, ry, K.soft(K.skDD, 0.4)); }

  A.pezzo("orecchini", "cerchi", function (K) {
    var s = "", mg = metallo(K, "ac_oc", ORO);
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), cy = p.y + 7, d = anello(p.x, cy, 6.8);
      s += om(K, p.x, cy, 8, 8) + K.St(d, K.scuro("#e8b84a", 0.5), 3.2, 0.8) + K.St(d, "#e8b84a", 2.2) + K.St(arco(p.x, cy, 6.8, 190, 265), "#fff4c8", 1, 0.9) + K.St(arco(p.x, cy, 6.8, 20, 80), "#8a5c14", 1, 0.5); }
    return s;
  });
  A.pezzo("orecchini", "punti", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l);
      var star = "M" + p.x + " " + (p.y - 3.4) + "L" + (p.x + 3.4) + " " + p.y + "L" + p.x + " " + (p.y + 3.4) + "L" + (p.x - 3.4) + " " + p.y + "Z";
      s += om(K, p.x, p.y, 4.5, 4) + K.Pa(star, K.LG("ac_pu" + i, 0, 0, 1, 1, [[0, "#ffffff"], [0.5, "#cfe6ff"], [1, "#7aa2d6"]]), " stroke='#9aa8c0' stroke-width='1' stroke-linejoin='round'") +
        K.St("M" + (p.x - 2) + " " + (p.y - 1) + "L" + p.x + " " + (p.y - 2.2) + "L" + (p.x + 2) + " " + (p.y - 1), "#ffffff", 0.8, 0.9) + K.St("M" + (p.x + 5) + " " + (p.y - 5) + "v3M" + (p.x + 3.5) + " " + (p.y - 3.5) + "h3", "#ffffff", 0.7, 0.8); }
    return s;
  });
  A.pezzo("orecchini", "perla", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), pg = K.RG("ac_pe" + i, [[0, "#ffffff"], [0.5, "#f1ece6"], [1, "#b9b1ae"]], "cx='.35' cy='.3' r='.8'");
      s += om(K, p.x, p.y + 1, 5.4, 5) + "<circle cx='" + p.x + "' cy='" + (p.y + 1) + "' r='5' fill='" + pg + "' stroke='#b8aeb0' stroke-width='.6' stroke-opacity='.7'/>" + K.El(p.x - 1.6, p.y - 1, 1.8, 1.2, K.soft("#ffffff", 0.95)) + K.El(p.x + 1.5, p.y + 3, 3, 1.5, K.soft("#e9c2d6", 0.45)); }
    return s;
  });
  A.pezzo("orecchini", "pendenti", function (K) {
    var s = "", pietra = K.rossetto || "#c03050";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), x = p.x, y = p.y;
      var g = "M" + x + " " + (y + 12) + "C" + (x - 5.6) + " " + (y + 18) + " " + (x - 5) + " " + (y + 24) + " " + x + " " + (y + 28) + "C" + (x + 5) + " " + (y + 24) + " " + (x + 5.6) + " " + (y + 18) + " " + x + " " + (y + 12) + "Z";
      s += om(K, x, y + 18, 6, 12) + "<circle cx='" + x + "' cy='" + y + "' r='2.3' fill='#e8b84a' stroke='#8a5c14' stroke-width='.6'/>" +
        K.St("M" + x + " " + (y + 2) + "L" + x + " " + (y + 11), "#e8b84a", 1.3) + K.St("M" + x + " " + (y + 4) + "h0M" + x + " " + (y + 7) + "h0", "#fff4c8", 1.3) +
        K.Pa(g, K.LG("ac_pd" + i, 0, 0, 1, 1, [[0, K.chiaro(pietra, 0.45)], [0.5, pietra], [1, K.scuro(pietra, 0.5)]]), " stroke='#e8b84a' stroke-width='1.3' stroke-linejoin='round'") +
        K.St("M" + (x - 2.2) + " " + (y + 16) + "C" + (x - 3) + " " + (y + 19) + " " + (x - 2.6) + " " + (y + 21) + " " + (x - 1.4) + " " + (y + 23), "#ffffff", 1.1, 0.7) + "<circle cx='" + x + "' cy='" + (y + 11) + "' r='1.6' fill='#e8b84a'/>"; }
    return s;
  });
  A.pezzo("orecchini", "cuori", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), x = p.x, y = p.y + 4;
      var h = "M" + x + " " + (y + 6) + "C" + (x - 7) + " " + (y + 1.5) + " " + (x - 8.4) + " " + (y - 1.5) + " " + (x - 8.4) + " " + (y - 3.5) + "C" + (x - 8.4) + " " + (y - 6.5) + " " + (x - 5.4) + " " + (y - 7.5) + " " + (x - 4.2) + " " + (y - 7.5) + "C" + (x - 2) + " " + (y - 7.5) + " " + x + " " + (y - 6) + " " + x + " " + (y - 4) + "C" + x + " " + (y - 6) + " " + (x + 2) + " " + (y - 7.5) + " " + (x + 4.2) + " " + (y - 7.5) + "C" + (x + 5.4) + " " + (y - 7.5) + " " + (x + 8.4) + " " + (y - 6.5) + " " + (x + 8.4) + " " + (y - 3.5) + "C" + (x + 8.4) + " " + (y - 1.5) + " " + (x + 7) + " " + (y + 1.5) + " " + x + " " + (y + 6) + "Z";
      s += "<g transform='translate(" + x + " " + (p.y - 2) + ") scale(.82) translate(" + (-x) + " " + (-(p.y - 2)) + ")'>" + om(K, x, y, 8, 7) + K.St("M" + x + " " + (p.y - 2) + "L" + x + " " + (y - 6), "#d9a640", 1.3) + "<circle cx='" + x + "' cy='" + (p.y - 1) + "' r='1.6' fill='#e8b84a'/>" +
        K.Pa(h, K.LG("ac_cr" + i, 0, 0, 1, 1, [[0, "#ff9ab4"], [0.5, "#e8305c"], [1, "#8f1634"]]), " stroke='#7a1230' stroke-width='.8' stroke-linejoin='round'") +
        K.St("M" + (x - 6) + " " + (y - 3) + "C" + (x - 6.2) + " " + (y - 5.4) + " " + (x - 4.4) + " " + (y - 6) + " " + (x - 3.2) + " " + (y - 5.6), "#ffffff", 1.2, 0.75) + "</g>"; }
    return s;
  });
  A.pezzo("orecchini", "cerchioni", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), cy = p.y + 11, R = 11, x = p.x;
      var d = anello(x, cy, R);
      s += "<g>" + K.St(d, "#000", 4, 0.12) + K.St(d, K.scuro("#e8b84a", 0.5), 3.8, 0.85) + K.St(d, "#e8b84a", 2.8) +
        K.St(arco(x, cy, R, 190, 265), "#fff4c8", 1.2, 0.9) + K.St(arco(x, cy, R, 20, 80), "#8a5c14", 1.1, 0.5) + "</g>"; }
    return s;
  });
  A.pezzo("orecchini", "piercing", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), x = p.x, yh = p.y - 13, yh2 = p.y - 7;
      s += om(K, x, p.y, 4, 4) + "<circle cx='" + x + "' cy='" + p.y + "' r='2.6' fill='" + K.LG("ac_pi" + i, 0, 0, 1, 1, [[0, "#ffffff"], [0.5, "#c6cdd8"], [1, "#788396"]]) + "' stroke='#68727f' stroke-width='.5'/>" + riflesso(x - 0.8, p.y - 0.9);
      // anellino sul bordo alto dell'orecchio (elice) e una barretta
      var r1 = anello(x - 0.5, yh, 3.5);
      s += K.St(r1, "#68727f", 2.4, 0.8) + K.St(r1, "#d4dae4", 1.6) + K.St(arco(x - 0.5, yh, 3.5, 200, 270), "#ffffff", 0.8, 0.9) +
        "<circle cx='" + (x + 1) + "' cy='" + yh2 + "' r='1.5' fill='#c6cdd8' stroke='#68727f' stroke-width='.4'/>"; }
    return s;
  });
  /* Pezzi fatti: occhiali sole, tondi, quadrati, felina, aviatore, grandi, cuore, sportivi, stelle, benda, mascherina;
     orecchini cerchi, punti, perla, pendenti, cuori, cerchioni, piercing. */
})();


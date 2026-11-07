/* =========================================================
   SPeeD GAME — I PEZZI DEGLI AVATAR «ILLUSTRATI» (strada A, 5 nov 2026)
   Capelli, cappelli, vestiti, scarpe, bocche, barbe e segni disegnati sul motore di js/omino-a.js.
   Ogni pezzo: SGOminoA.pezzo(tipo, voce, function (K) { … }). Fatto unendo i file di lavoro (pezzi/*.js).
   ========================================================= */

// ---- capelli-uomo ----
// pezzi: capelli-uomo — pettinature da uomo per gli avatar illustrati (stile del pezzo «corti»)
(function () {
  var A = window.SGOminoA; if (!A) return;
  // (leggero, 5 nov 2026) stesso disegno con meno testo. I tratti di questo file (St) non ripetono fill='none' e la punta tonda:
  // li dà UNA volta il gruppo GR che avvolge l'uscita di ogni pezzo del file (in fondo; dentro, ogni riempimento è scritto,
  // quindi non cambia niente). Opacità e spessori con al massimo 3 decimali.
  var GR = "<g fill='none' stroke-linecap='round'>", RX_LN = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
  function op3(v) { var t = "" + Math.round(v * 1000) / 1000; return t.charAt(0) === "0" && t.length > 1 ? t.slice(1) : t; }
  function St(d, c, w, op, x) { return "<path d='" + d + "' stroke='" + c + "' stroke-width='" + op3(w) + "'" + (op != null ? " opacity='" + op3(op) + "'" : "") + (x ? x.replace(RX_LN, "") : "") + "/>"; }

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
  // (leggero, 5 nov 2026) gli stessi punti scritti corti: decimi interi, ".5", lo spazio solo dove serve («10-4», «1.5.5»);
  // nei riccioli, dopo il primo punto gli spostamenti (c, s minuscole). Tn(k, 1) = il primo numero dopo una lettera.
  var nP = false;
  function Tn(k, primo) { var neg = k < 0, a = neg ? -k : k, r = a % 10, i = (a - r) / 10, sp = primo || neg || (!i && r && nP) ? "" : " "; nP = r !== 0; return sp + (neg ? "-" : "") + (r ? (i ? i : "") + "." + r : i); }
  function dec(v) { return Math.round(v * 10); }
  function peli(K, seme, n, x0, x1, y0, y1, op, col) { // trama di sottili tratti per dare materia
    var R = K.rnd(seme), d = "";
    for (var i = 0; i < n; i++) { var x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); d += "M" + Tn(dec(x), 1) + Tn(dec(y)) + "l" + Tn(dec((R() - 0.4) * 9), 1) + Tn(dec(-2 - R() * 7)); }
    return d ? "<path d='" + d + "' stroke='" + (col || K.hDD) + "' stroke-width='1.1' stroke-linecap='round' fill='none' stroke-opacity='" + (op || 0.3) + "'/>" : "";
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
    d += St("M-15 " + K.n1(T + 22) + "C-17 " + K.n1(T + 8) + " -14 " + K.n1(T - 8) + " -6 " + K.n1(T - 16), K.hDD, 2.2, 0.7) + St("M-14 " + K.n1(T + 21) + "C-16 " + K.n1(T + 8) + " -13 " + K.n1(T - 8) + " -5 " + K.n1(T - 15), K.hL, 1.1, 0.5);
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
    for (var i = 0; i < n; i++) { var x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (R() < prob(x, y)) d += "M" + Tn(dec(x), 1) + Tn(dec(y)) + "h.3"; }
    return "<path d='" + d + "' stroke='" + K.hDD + "' stroke-width='1.7' stroke-linecap='round' stroke-opacity='" + (op || 0.4) + "' fill='none'/>";
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
      var X = function (px, py) { return dec(x + px * cs - py * sn); }, Y = function (px, py) { return dec(y + px * sn + py * cs); }, x0, y0, x3, y3;
      if (R() > 0.45) { x0 = X(q, -q * 0.7); y0 = Y(q, -q * 0.7); dk += "M" + Tn(x0, 1) + Tn(y0) + "c" + Tn(X(-q * 0.4, -q * 1.1) - x0, 1) + Tn(Y(-q * 0.4, -q * 1.1) - y0) + Tn(X(-q * 1.1, q * 0.2) - x0) + Tn(Y(-q * 1.1, q * 0.2) - y0) + Tn(X(-q * 0.1, q * 0.9) - x0) + Tn(Y(-q * 0.1, q * 0.9) - y0); }
      else { x0 = X(-q, -q * 0.4); y0 = Y(-q, -q * 0.4); x3 = X(0, 0); y3 = Y(0, 0); dk += "M" + Tn(x0, 1) + Tn(y0) + "c" + Tn(X(-q * 0.5, -q * 1.1) - x0, 1) + Tn(Y(-q * 0.5, -q * 1.1) - y0) + Tn(X(q * 0.1, -q * 0.3) - x0) + Tn(Y(q * 0.1, -q * 0.3) - y0) + Tn(x3 - x0) + Tn(y3 - y0) + "s" + Tn(X(q * 0.6, q * 1.1) - x3, 1) + Tn(Y(q * 0.6, q * 1.1) - y3) + Tn(X(q, q * 0.4) - x3) + Tn(Y(q, q * 0.4) - y3); }
      var lit = (x < 12 && y < -112) ? 0.75 : 0.18;
      if (R() < lit) lc += "M" + Tn(dec(x - q * 0.5), 1) + Tn(dec(y - q * 0.9)) + "q" + Tn(dec(q * 0.5), 1) + Tn(dec(-q * 0.4)) + Tn(dec(q * 1.0)) + Tn(dec(-q * 0.1));
    }
    var mid = "";
    for (i = 0; i < cnt * 0.8; i++) { var xm = (R() * 2 - 1) * (rx - 2), ym = T - o.vol + 3 + R() * 40, qm = o.r * 0.6; mid += "M" + Tn(dec(xm - qm), 1) + Tn(dec(ym)) + "c" + Tn(dec(qm * 0.3), 1) + Tn(dec(-qm * 1.1)) + Tn(dec(qm * 1.5)) + Tn(dec(-qm * 0.9)) + Tn(dec(qm * 1.7)) + Tn(dec(qm * 0.1)); }
    s += "<g fill='none' stroke-linecap='round'><path d='" + dk + "' stroke='" + K.hDD + "' stroke-width='2.1' stroke-opacity='.55'/>";
    s += "<path d='" + mid + "' stroke='" + K.capelli + "' stroke-width='2.2' stroke-opacity='.55'/>";
    s += "<path d='" + lc + "' stroke='" + K.hL + "' stroke-width='1.9' stroke-opacity='.8'/></g>";
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
    for (i = 0; i < 12; i++) { var a2 = lungoAtt(F, 0.05 + i * 0.081), b2 = lungoOut(F, 0.12 + i * 0.07); r += St("M" + K.n1(a2[0]) + " " + K.n1(a2[1]) + "Q" + K.n1((a2[0] + b2[0]) / 2) + " " + K.n1((a2[1] + b2[1]) / 2 - 12) + " " + K.n1(b2[0] * 0.97) + " " + K.n1(b2[1] + 2), i % 3 ? K.hL : K.hDD, 1, i % 3 ? 0.35 : 0.28); }
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
    s += St("M" + K.n1(-(w + 2)) + " -116Q" + K.n1(-(w - 6)) + " -112 " + K.n1(-(w - 14)) + " -112", K.hDD, 1.6, 0.4) + St("M" + K.n1(w + 2) + " -116Q" + K.n1(w - 6) + " -112 " + K.n1(w - 14) + " -112", K.hDD, 1.6, 0.4);
    return { fronte: s };
  });

  /* FATTI: riga, ciuffo, spettinati, sfumato, rasato, riccicorti, indietro, calvo, stempiato, chierica, afrocorto, undercut
     (tutti e 12). Se uno non convince: riga/ciuffo -> «corti»; sfumato/undercut -> «ciuffo»; rasato -> «sfumato». */
  // (leggero) l'uscita di ogni pezzo di questo file dentro il gruppo GR (vedi St)
  [["capelli", "riga"], ["capelli", "ciuffo"], ["capelli", "spettinati"], ["capelli", "sfumato"], ["capelli", "rasato"], ["capelli", "riccicorti"], ["capelli", "afrocorto"], ["capelli", "indietro"], ["capelli", "calvo"], ["capelli", "stempiato"], ["capelli", "chierica"], ["capelli", "undercut"]].forEach(function (tv) {
    var f = A[tv[0]][tv[1]]; if (!f) return;
    A[tv[0]][tv[1]] = function () {
      var r = f.apply(this, arguments);
      if (typeof r === "string") return r ? GR + r + "</g>" : r;
      if (r && typeof r === "object") { var o = {}; for (var k in r) o[k] = typeof r[k] === "string" && r[k] ? GR + r[k] + "</g>" : r[k]; return o; }
      return r;
    };
  });
})();


// ---- capelli-donna ----
// pezzi: capelli-donna — pettinature da donna dell'avatar «illustrato» (coordinate della testa: mento 0, cima del cranio -148)
(function () {
  "use strict";
  var A = window.SGOminoA; if (!A) return;
  // (leggero, 5 nov 2026) stesso disegno con meno testo. I tratti di questo file (St) non ripetono fill='none' e la punta tonda:
  // li dà UNA volta il gruppo GR che avvolge l'uscita di ogni pezzo del file (in fondo; dentro, ogni riempimento è scritto,
  // quindi non cambia niente). Opacità e spessori con al massimo 3 decimali.
  var GR = "<g fill='none' stroke-linecap='round'>", RX_LN = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
  function op3(v) { var t = "" + Math.round(v * 1000) / 1000; return t.charAt(0) === "0" && t.length > 1 ? t.slice(1) : t; }
  function St(d, c, w, op, x) { return "<path d='" + d + "' stroke='" + c + "' stroke-width='" + op3(w) + "'" + (op != null ? " opacity='" + op3(op) + "'" : "") + (x ? x.replace(RX_LN, "") : "") + "/>"; }

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
    if (lucido !== false) s += St("M-48 -130C-38 -156 -4 -166 26 -158", "#ffffff", 5, 0.13) + St("M-40 -120C-30 -144 -8 -154 12 -150", "#ffffff", 2, 0.12);
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
      s += St(arco, mid, r * 0.5, 0.9);
      s += St("M" + K.n1(x - r * 0.55) + " " + K.n1(y - r * 0.2) + "A" + K.n1(rr) + " " + K.n1(rr) + " 0 0 1 " + K.n1(x + r * 0.15) + " " + K.n1(y - r * 0.6), K.hL, r * 0.16, 0.4);
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
    r += St("M" + (-w + 3) + " -3L" + (w - 3) + " -3", "#ffffff", 1.6, 0.4);
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
    // ciocca morbida: massa + tre fili sfalsati che finiscono in punte diverse (mai un bordo unico e netto)
    // N = nodi [x, y, larghezza]; o = { onda: ampiezza, punte: 0 = chiusa, flick: sposta in fuori le ultime punte, tronca: punta dritta }
    function ciuffoM(K, N, o) {
      o = o || {};
      var n = N.length, sg = N[n >> 1][0] < 0 ? -1 : 1, P = N.map(function (q, i) {
        var t = i / (n - 1), x = q[0] + (o.onda ? sg * o.onda * Math.sin(i * 1.25 + (o.fase || 0)) * Math.min(1, t * 2) : 0) + (o.flick ? sg * o.flick * Math.pow(t, 3) : 0);
        return [x, q[1], q[2]];
      });
      var base = o.tronca ? P : P.slice(0, n - 1).concat([[P[n - 1][0], P[n - 1][1] - 0, P[n - 1][2] * 0.5]]);
      var d = K.limb(base, o.tronca ? 0 : 0.35), s = K.El(P[n >> 1][0] - sg * 8, P[n >> 1][1] + 8, P[n >> 1][2] * 0.9, (P[n - 1][1] - P[0][1]) * 0.5, K.soft(K.hDD, 0.35));
      s += K.Pa(d, K.U(sg < 0 ? "hg2" : "hg1")) + "<g clip-path='" + K.clip(d) + "'>";
      var F = [[-0.3, 0.46, 1, "hg1"], [0.02, 0.5, 0, "hg2"], [0.32, 0.4, 2, "hg1"]], k, L = [], m = P.length;
      for (k = 0; k < 3; k++) {
        var f = F[k], cut = f[2], sub = P.slice(0, m - cut).map(function (q, i) { return [q[0] + f[0] * q[2] + Math.sin(i + k * 2) * 1.2, q[1] + (i === 0 ? 0 : 0), Math.max(1.5, q[2] * f[1])]; });
        if (cut && !o.tronca) sub[sub.length - 1][2] = 1.5;
        L.push(sub);
      }
      s += K.ciocche(L, ["hg1", "hg2", "hg1"]);
      var Mi = P[(n >> 1)];
      s += St(K.liscio(P.slice(0, n - 1).map(function (q) { return [q[0] + sg * q[2] * 0.34, q[1]]; })), K.hDD, Math.max(5, Mi[2] * 0.28), 0.3);
      s += St(K.liscio(P.slice(0, n - 1).map(function (q) { return [q[0] - sg * q[2] * 0.3, q[1]]; })), K.hL, 2.4, 0.4);
      s += K.El(P[1][0], P[1][1] + 6, P[1][2] * 0.7, 14, K.soft(K.hDD, 0.35));
      return s + "</g>";
    }

    // elastico: una fascetta curva che stringe i capelli (stesso colore di sempre), con un'ombra morbida sotto
    function fascia(K, x, y, ang, w) {
      var c = K.maglia, id = "dl" + Math.round(Math.abs(x)) + "_" + Math.round(Math.abs(y)) + (ang < 0 ? "n" : "");
      var r = "<g transform='translate(" + x + " " + y + ") rotate(" + ang + ")'>";
      r += K.El(0, 6, w * 1.05, 5, K.soft(K.hDD, 0.55));
      r += K.Pa("M" + (-w) + " -2Q0 -7 " + w + " -2Q" + (w + 2) + " 2 " + w + " 5Q0 10 " + (-w) + " 5Q" + (-w - 2) + " 2 " + (-w) + " -2Z", K.LG(id, 0, 0, 0, 1, [[0, K.chiaro(c, 0.2)], [0.55, c], [1, K.scuro(c, 0.3)]]), " stroke='" + K.scuro(c, 0.45) + "' stroke-opacity='.45' stroke-width='.9'");
      r += St("M" + (-w * 0.6) + " -2Q" + (-w * 0.1) + " -4 " + (w * 0.3) + " -3", "#ffffff", 1.2, 0.35);
      return r + "</g>";
    }

    // la coda: i capelli si raccolgono dietro la testa, si stringono nell'elastico (appena fuori dal bordo) e ricadono morbidi, a ciocche, dietro la spalla
    var dietro = ciuffoM(K, [[40, -118, 20], [58, -122, 20], [68, -124, 22], [84, -114, 34], [95, -84, 38], [98, -40, 36], [94, 8, 32], [90, 48, 25], [90, 80, 14], [86, 98, 2]], { onda: 3, fase: 0.8 });
    dietro += fascia(K, 66, -124, 90, 12);
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
    b += St("M-30 -170C-24 -156 -6 -150 16 -154", K.hDD, 3, 0.35);
    // il bordo dove lo chignon si appoggia sulla testa
    s = b.replace(/^/, "") + s;
    // la base dello chignon sopra la testa (di nuovo davanti, per nascondere il bordo)
    s += K.Pa("M-24 -156C-12 -170 14 -170 28 -158C16 -148 -10 -148 -24 -156Z", K.U("hg1"), " opacity='.95'") + St("M-18 -158C-4 -164 14 -164 24 -158", K.hL, 2, 0.5);
    return { dietro: dietro, fronte: s };
  });

  // ---------- riccioli «illustrati»: massa unica dal contorno a riccioli piccoli, trama di «c» e «s», molle che scendono ----------
  function sub(p, passo) {   // infittisce un contorno chiuso
    var o = [];
    for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / passo)); for (var k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    return o;
  }
  // (leggero, 5 nov 2026) gli stessi punti scritti corti: decimi interi, ".5", lo spazio solo dove serve («10-4», «1.5.5»);
  // dopo il primo punto gli spostamenti (q, c, s minuscole). T(k, 1) = il primo numero dopo una lettera.
  var nP = false;
  function T(k, primo) { var neg = k < 0, a = neg ? -k : k, r = a % 10, i = (a - r) / 10, sp = primo || neg || (!i && r && nP) ? "" : " "; nP = r !== 0; return sp + (neg ? "-" : "") + (r ? (i ? i : "") + "." + r : i); }
  function dec(v) { return Math.round(v * 10); }
  function bumpy(K, pts, r, R) {   // contorno con piccoli riccioli verso fuori
    var P = sub(pts, r * 2.1), ar = 0, i;
    for (i = 0; i < P.length; i++) { var a = P[i], b = P[(i + 1) % P.length]; ar += a[0] * b[1] - b[0] * a[1]; }
    var sg = ar > 0 ? 1 : -1, px = dec(P[0][0]), py = dec(P[0][1]), d = "M" + T(px, 1) + T(py);
    for (i = 0; i < P.length; i++) {
      var p0 = P[i], p1 = P[(i + 1) % P.length], dx = p1[0] - p0[0], dy = p1[1] - p0[1], l = Math.hypot(dx, dy) || 1, k = r * (0.8 + R() * 0.9);
      var nx = sg * dy / l, ny = -sg * dx / l;
      var cx = dec((p0[0] + p1[0]) / 2 + nx * k * 1.3 + (R() - 0.5) * r * 0.5), cy = dec((p0[1] + p1[1]) / 2 + ny * k * 1.3), ex = dec(p1[0]), ey = dec(p1[1]);
      d += "q" + T(cx - px, 1) + T(cy - py) + T(ex - px) + T(ey - py); px = ex; py = ey;
    }
    return d + "Z";
  }
  // trama di piccoli archi a «c» e «s» (a tratti) dentro la massa, con i riflessi corti chiari in alto a sinistra
  function trama(K, d, box, cnt, r, R, luce) {
    cnt = Math.round(cnt * 0.6);
    var dk = "", lc = "", md = "", i;
    for (i = 0; i < cnt; i++) {
      var x = box[0] + R() * (box[2] - box[0]), y = box[1] + R() * (box[3] - box[1]), q = r * (0.55 + R() * 0.5), rot = R() * 6.28, cs = Math.cos(rot), sn = Math.sin(rot);
      var X = function (px, py) { return dec(x + px * cs - py * sn); }, Y = function (px, py) { return dec(y + px * sn + py * cs); }, x0, y0, x3, y3;
      if (R() > 0.45) { x0 = X(q, -q * 0.7); y0 = Y(q, -q * 0.7); dk += "M" + T(x0, 1) + T(y0) + "c" + T(X(-q * 0.4, -q * 1.1) - x0, 1) + T(Y(-q * 0.4, -q * 1.1) - y0) + T(X(-q * 1.1, q * 0.2) - x0) + T(Y(-q * 1.1, q * 0.2) - y0) + T(X(-q * 0.1, q * 0.9) - x0) + T(Y(-q * 0.1, q * 0.9) - y0); }
      else { x0 = X(-q, -q * 0.4); y0 = Y(-q, -q * 0.4); x3 = X(0, 0); y3 = Y(0, 0); dk += "M" + T(x0, 1) + T(y0) + "c" + T(X(-q * 0.5, -q * 1.1) - x0, 1) + T(Y(-q * 0.5, -q * 1.1) - y0) + T(X(q * 0.1, -q * 0.3) - x0) + T(Y(q * 0.1, -q * 0.3) - y0) + T(x3 - x0) + T(y3 - y0) + "s" + T(X(q * 0.6, q * 1.1) - x3, 1) + T(Y(q * 0.6, q * 1.1) - y3) + T(X(q, q * 0.4) - x3) + T(Y(q, q * 0.4) - y3); }
      if (R() < (luce ? luce(x, y) : 0.2)) lc += "M" + T(dec(x - q * 0.5), 1) + T(dec(y - q * 0.9)) + "q" + T(dec(q * 0.5), 1) + T(dec(-q * 0.4)) + T(dec(q * 1.0)) + T(dec(-q * 0.1));
      if (R() < 0.5) md += "M" + T(dec(x - q), 1) + T(dec(y + q * 0.4)) + "c" + T(dec(q * 0.3), 1) + T(dec(-q * 1.1)) + T(dec(q * 1.5)) + T(dec(-q * 0.9)) + T(dec(q * 1.7)) + T(dec(q * 0.1));
    }
    return "<g fill='none' stroke-linecap='round'><path d='" + dk + "' stroke='" + K.hDD + "' stroke-width='2' stroke-opacity='.55'/><path d='" + md + "' stroke='" + K.capelli + "' stroke-width='2.2' stroke-opacity='.5'/><path d='" + lc + "' stroke='" + K.hL + "' stroke-width='1.8' stroke-opacity='.8'/></g>";
  }
  // una ciocca a molla che scende: ellissi sovrapposte (A = larghezza, passo = distanza fra le spire)
  // (leggero) la linea della molla si scrive una volta (in defs) e i suoi quattro tratti la usano con <use>
  var nMo = 0;
  function molla(K, x, y0, lung, A, passo, tipo) {
    var P = [], N = Math.round(lung / passo * 5), i;
    for (i = 0; i <= N; i++) { var t = i / N, th = t * lung / passo * 2 * Math.PI, a = A * (1 - 0.35 * t); P.push([x + a * Math.sin(th) + (tipo || 0) * t * 6, y0 + t * lung - a * 0.7 * Math.cos(th)]); }
    var d = K.liscio(P), w = A * 0.78, id = K.id + "LDm" + (nMo++), u = "<use href='#" + id + "'";
    K.D.push("<path id='" + id + "' d='" + d + "'/>");
    return "<g fill='none' stroke-linecap='round'>" + u + " stroke='" + K.hDD + "' stroke-width='" + (w + 2.2) + "' stroke-opacity='.6'/>" + u + " stroke='" + K.capelli + "' stroke-width='" + w + "' stroke-opacity='.95'/>" +
      u + " transform='translate(-1.6 -1.8)' stroke='" + K.mix(K.capelli, K.hL, 0.4) + "' stroke-width='" + (w * 0.38) + "' stroke-opacity='.8'/>" + u + " stroke='" + K.hDD + "' stroke-width='1.2' stroke-opacity='.5'/></g>";
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
    s += St("M0 -128L0 -164", K.hDD, 1.6, 0.5);
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
    sl += "<g clip-path='" + K.clip([L, Rr]) + "'>" + St("M-62 -60C-68 -10 -66 40 -64 70", K.hL, 3, 0.35) + St("M64 -60C70 -10 68 40 66 70", K.hL, 3, 0.25) + K.El(72, 10, 14, 80, K.soft(K.hDD, 0.45)) + "</g>";
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
        "<path d='M" + K.n1(-w * 0.45) + " " + K.n1(w * 0.02) + "L" + K.n1(w * 0.4) + " " + K.n1(w * 0.02) + "' stroke='" + K.hDD + "' stroke-width='1' opacity='.35' stroke-linecap='butt'/></g>";
    }
    var pe = bz(1);
    b += K.Pa(K.limb([[pe[0] - 6, pe[1] - 4, 3], [pe[0] - 1, pe[1] + 12, 16], [pe[0] + 5, pe[1] + 34, 11], [pe[0] + 3, pe[1] + 44, 2]], 0.3), K.U("hg2"), " stroke='" + K.hDD + "' stroke-opacity='.4' stroke-width='1'");
    b += St("M" + K.n1(pe[0] - 2) + " " + K.n1(pe[1] + 10) + "L" + K.n1(pe[0] + 2) + " " + K.n1(pe[1] + 38), K.hL, 1.6, 0.5);
    b += laccio(K, pe[0], pe[1] - 2, 0, 10);
    return { dietro: dietro, fronte: s + b };
  });
  // (leggero) l'uscita di ogni pezzo di questo file dentro il gruppo GR (vedi St)
  [["capelli", "mossi"], ["capelli", "coda"], ["capelli", "caschetto"], ["capelli", "chignon"], ["capelli", "riccilunghi"], ["capelli", "pixie"], ["capelli", "codini"], ["capelli", "onde"], ["capelli", "frangia"], ["capelli", "codaalta"], ["capelli", "ricciraccolti"], ["capelli", "treccia"]].forEach(function (tv) {
    var f = A[tv[0]][tv[1]]; if (!f) return;
    A[tv[0]][tv[1]] = function () {
      var r = f.apply(this, arguments);
      if (typeof r === "string") return r ? GR + r + "</g>" : r;
      if (r && typeof r === "object") { var o = {}; for (var k in r) o[k] = typeof r[k] === "string" && r[k] ? GR + r[k] + "</g>" : r[k]; return o; }
      return r;
    };
  });
})();

/* PEZZI FATTI (capelli donna): mossi, coda, caschetto, chignon, riccilunghi, pixie, codini, onde, frangia, codaalta, ricciraccolti, treccia */


// ---- viso ----
// pezzi: viso — bocche, barbe e segni sul viso (avatar «illustrati», strada A)
(function () {
  "use strict";
  var A = window.SGOminoA; if (!A) return;
  // (leggero, 5 nov 2026) stesso disegno con meno testo. I tratti di questo file (St) non ripetono fill='none' e la punta tonda:
  // li dà UNA volta il gruppo GR che avvolge l'uscita di ogni pezzo del file (in fondo; dentro, ogni riempimento è scritto,
  // quindi non cambia niente). Opacità e spessori con al massimo 3 decimali.
  var GR = "<g fill='none' stroke-linecap='round'>", RX_LN = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
  function op3(v) { var t = "" + Math.round(v * 1000) / 1000; return t.charAt(0) === "0" && t.length > 1 ? t.slice(1) : t; }
  function St(d, c, w, op, x) { return "<path d='" + d + "' stroke='" + c + "' stroke-width='" + op3(w) + "'" + (op != null ? " opacity='" + op3(op) + "'" : "") + (x ? x.replace(RX_LN, "") : "") + "/>"; }
  var N = function (v) { return Math.round(v * 10) / 10; };
  // (leggero, 5 nov 2026) gli stessi numeri di N scritti corti nei percorsi: ".5", "-.5", lo spazio solo dove serve («10-4», «1.5.5»);
  // nn(v, 1) = il primo numero dopo una lettera
  var nP = false;
  function nn(v, primo) { var k = Math.round(v * 10), neg = k < 0, a = neg ? -k : k, r = a % 10, i = (a - r) / 10, sp = primo || neg || (!i && r && nP) ? "" : " "; nP = r !== 0; return sp + (neg ? "-" : "") + (r ? (i ? i : "") + "." + r : i); }
  var DENTE = "#f2eadb", DENTE_O = "#cdbfa5", INT = "#3a1417", LING = "#cb6670";
  var cnt = 0;
  function uid() { return "vb" + (cnt++); }
  function glo(K) { return K.rossetto && K.c.rossetto === "lucido" ? 0.6 : (K.m ? 0.22 : 0.45); }
  function filtro(K) { return St("M-4 -36C-4 -33 -3.5 -31 -3 -30", K.skDD, 1, 0.22) + St("M4 -36C4 -33 3.5 -31 3 -30", K.skDD, 1, 0.22); }
  function linea(K) { return K.mix(K.labbro, "#2a0c0a", 0.62); }
  // pieghe agli angoli della bocca (+ piega del sorriso sulla guancia)
  function angoli(K, w, yc, f, guancia) {
    var s = "";
    [1, -1].forEach(function (l) {
      s += St("M" + N(l * (w + 1)) + " " + N(yc - 0.6) + "C" + N(l * (w + 3)) + " " + N(yc - 2.4) + " " + N(l * (w + 4)) + " " + N(yc - 3.6) + " " + N(l * (w + 4.4)) + " " + N(yc - 4.6), K.skDD, 1.1, 0.5 * f);
      if (guancia) s += St("M" + N(l * (w + 8)) + " " + N(yc - 17) + "C" + N(l * (w + 11)) + " " + N(yc - 9) + " " + N(l * (w + 10)) + " " + N(yc - 3) + " " + N(l * (w + 7)) + " " + N(yc + 2), K.skD, 1.6, 0.25 * f);
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
    s += St("M-" + N(w + 0.6) + " " + N(yc - 0.4) + "Q0 " + N(cu) + " " + N(w + 0.6) + " " + N(yc - 0.4), ln, 1.2);
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
      St("M0 " + N(yl - (yl - yu) * 0.55) + "L0 " + N(yl + 0.5), K.mix(LING, "#4a1018", 0.45), 0.8, 0.5);
    if (o.denti) {
      pt = xs.map(function (q) { return [q, eu(q) - 1.6]; }); pb = xs.map(function (q) { return [q, eu(q) + hS * (1 - 0.14 * (q / w) * (q / w))]; }).reverse();
      var pg = pt.concat(pb);
      td += K.Pa(pol(pg), gradV(K, [[0, DENTE_O], [0.22, DENTE], [1, K.mix(DENTE, "#ffffff", 0.3)]]));
      td += K.Pa(pol(pg), K.LG(uid(), 0, 0, 1, 0, [[0, INT, 0.42], [0.2, INT, 0], [0.8, INT, 0], [1, INT, 0.42]]));
      var tw = (2 * w - 4.4) / 6;
      for (i = 1; i < 6; i++) { x = -w + 2.2 + tw * i; td += St("M" + N(x) + " " + N(eu(x)) + "L" + N(x) + " " + N(eu(x) + hS * (1 - 0.14 * (x / w) * (x / w))), DENTE_O, 0.6, 0.8); }
      if (o.denti === "tutti") {
        var qt = xs.slice(1, -1).map(function (q) { return [q, el(q) - hI * (1 - 0.18 * (q / w) * (q / w))]; }), qb = xs.slice(1, -1).map(function (q) { return [q, el(q) + 2]; }).reverse();
        var pg2 = qt.concat(qb);
        td += K.Pa(pol(pg2), gradV(K, [[0, DENTE_O], [0.5, K.mix(DENTE, DENTE_O, 0.4)], [1, DENTE_O]]));
        td += K.Pa(pol(pg2), K.LG(uid(), 0, 0, 1, 0, [[0, INT, 0.65], [0.25, INT, 0], [0.75, INT, 0], [1, INT, 0.65]]));
        var tw2 = (2 * (w - 3.2)) / 6;
        for (i = 1; i < 6; i++) { x = -w + 3.2 + tw2 * i; td += St("M" + N(x) + " " + N(el(x) - hI) + "L" + N(x) + " " + N(el(x) + 1), DENTE_O, 0.5, 0.7); }
      }
      if (o.inInt) td += o.inInt(eu, el);
    }
    s += "<g clip-path='" + K.clip(inter) + "'>" + inn + td + K.El(0, yu + 0.8, w * 0.85, 2.6, K.soft("#000000", 0.5)) + "</g>";
    // labbro inferiore
    var cy = (yl + tL - 0.25 * yc) / 0.75, cxl = N(w * 0.66);
    s += K.Pa("M-" + N(w) + " " + N(yc) + "Q0 " + N(cl) + " " + N(w) + " " + N(yc) + "C" + cxl + " " + N(cy) + " -" + cxl + " " + N(cy) + " -" + N(w) + " " + N(yc) + "Z",
      gradV(K, [[0, K.mix(lip, dk, 0.25)], [0.5, lip], [1, K.mix(lip, "#ffffff", 0.07)]]));
    s += St("M-" + N(w) + " " + N(yc) + "Q0 " + N(cl) + " " + N(w) + " " + N(yc), ln, 0.9, 0.55);
    s += K.El(-1, yl + tL * 0.4, w * 0.26, 1.2, "#ffffff", " opacity='" + glo(K) + "'");
    if (o.mid) s += o.mid;
    // labbro superiore
    var ty = yu - tU, pk = ty - 1.8, c1 = yc + (pk - yc) * 0.7, c1x = N(w * 0.56);
    s += K.Pa("M-" + N(w) + " " + N(yc) + "C-" + c1x + " " + N(c1) + " -4.5 " + N(pk) + " 0 " + N(ty) + "C4.5 " + N(pk) + " " + c1x + " " + N(c1) + " " + N(w) + " " + N(yc) + "Q0 " + N(cu) + " -" + N(w) + " " + N(yc) + "Z", dk);
    s += St("M-" + N(w) + " " + N(yc) + "Q0 " + N(cu) + " " + N(w) + " " + N(yc), ln, 1, 0.6);
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
    s += St("M" + N(w + 9) + " -48C" + N(w + 12) + " -40 " + N(w + 11) + " -33 " + N(w + 8) + " -29", K.skD, 1.6, 0.25);
    s += St("M" + N(w + 1.2) + " -28.4C" + N(w + 3) + " -30.4 " + N(w + 4) + " -31.4 " + N(w + 4.4) + " -32.4", K.skDD, 1.1, 0.5);
    return s;
  });
  A.pezzo("bocca", "ghigno", function (K) {
    var w = K.m ? 16 : 15.5;
    return filtro(K) + St("M" + N(w + 10) + " -46C" + N(w + 13) + " -37 " + N(w + 11) + " -31 " + N(w + 8) + " -28", K.skD, 1.6, 0.25) +
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
    for (var i = 0; i < 9; i++) { var a = -Math.PI * 0.1 + i / 8 * Math.PI * 1.2 - Math.PI * 0.1 + Math.PI; s += St("M" + N(Math.cos(a) * 6.6) + " " + N(-21 + Math.sin(a) * 8) + "L" + N(Math.cos(a) * 8) + " " + N(-21 + Math.sin(a) * 9.4), K.mix(lip, "#2a0c0a", 0.5), 0.5, 0.2); }
    var inner = "M-4.6 -21C-4.6 -26.4 4.6 -26.4 4.6 -21C4.6 -15.6 -4.6 -15.6 -4.6 -21Z";
    s += K.Pa(inner, INT);
    s += "<g clip-path='" + K.clip(inner) + "'>" + K.Pa("M-3.6 -25.6C-1.5 -26.8 1.5 -26.8 3.6 -25.6L3.2 -22.8C1 -23.4 -1 -23.4 -3.2 -22.8Z", DENTE) +
      K.El(0, -17.6, 3.2, 2.2, K.mix(LING, "#4a1018", 0.25)) + K.El(0, -25, 5, 2.4, K.soft("#000000", 0.5)) + "</g>";
    s += St(inner, linea(K), 0.9, 0.6);
    s += K.El(-2.4, -14.2, 3, 1.2, "#ffffff", " opacity='" + glo(K) + "'");
    return s;
  });
  A.pezzo("bocca", "triste", function (K) {
    var w = K.m ? 13.8 : 13.4, s = filtro(K);
    s += K.El(0, -8.4, 6.4, 3.2, K.soft(K.skDD, 0.34));
    s += chiusa(K, { w: w, yc: -21.4, ym: -25.8, tU: 3.6, tL: 6.8 });
    [1, -1].forEach(function (l) { s += St("M" + N(l * (w + 0.8)) + " -21.8C" + N(l * (w + 2.4)) + " -20 " + N(l * (w + 3.2)) + " -17.4 " + N(l * (w + 3.4)) + " -15", K.skDD, 1, 0.38); });
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
    [-1, 1].forEach(function (l) { for (var i = 0; i < 3; i++) s += St("M" + N(l * (w + 1.2)) + " " + N(-25.4 + i * 2.6) + "L" + N(l * (w + 3.8 + (i === 1 ? 0.6 : 0))) + " " + N(-26.2 + i * 3.4), K.skDD, 0.9, 0.3); });
    return s;
  });
  A.pezzo("bocca", "linguaccia", function (K) {
    var w = K.m ? 15.6 : 15.2, tg = "M-6.6 -21.6C-7.8 -13 -6.4 -7.2 0 -6C6.4 -7.2 7.8 -13 6.6 -21.6Z";
    var post = K.El(0, -3.8, 6, 1.8, K.soft(K.skDD, 0.35)) + K.Pa(tg, gradV(K, [[0, K.mix(LING, "#ffffff", 0.12)], [0.7, LING], [1, K.mix(LING, "#4a1018", 0.3)]])) +
      St("M0 -20.6C0.4 -15 0.2 -11 0 -8.4", K.mix(LING, "#4a1018", 0.45), 1, 0.55) + K.El(-2.4, -13.4, 1.5, 3.6, "#ffffff", " opacity='.2'") +
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
    s += St(W, ln, 1.2);
    s += St("M-14.2 -27.2C-15.2 -28.2 -15.8 -29 -16 -30", K.skDD, 1, 0.45) + St("M14.2 -27.2C15.2 -28.2 15.8 -29 16 -30", K.skDD, 1, 0.45);
    return s;
  });
  A.pezzo("bocca", "dentoni", function (K) {
    var w = 13.4, ym = -23.6, s = filtro(K);
    var dente = function (x0, x1) {
      return K.Pa("M" + x0 + " " + (ym - 2) + "L" + x1 + " " + (ym - 2) + "L" + x1 + " " + N(ym + 7.2) + "Q" + x1 + " " + N(ym + 9.6) + " " + N((x0 + x1) / 2 + (x1 > x0 ? 0.8 : -0.8)) + " " + N(ym + 9.8) + "Q" + x0 + " " + N(ym + 9.6) + " " + x0 + " " + N(ym + 7.2) + "Z", gradV(K, [[0, DENTE_O], [0.3, DENTE], [1, K.mix(DENTE, DENTE_O, 0.35)]]));
    };
    var mid = K.El(0, ym + 10.4, 6.4, 1.8, K.soft(K.mix(K.labbro, "#000000", 0.4), 0.5)) + dente(-5.5, 0) + dente(0, 5.5) +
      St("M0 " + (ym - 1) + "L0 " + N(ym + 9.6), DENTE_O, 0.7, 0.9) + St("M-5.5 " + N(ym + 2) + "L-5.5 " + N(ym + 8), K.mix(DENTE_O, "#3a1417", 0.2), 0.6, 0.5);
    return s + chiusa(K, { w: w, yc: -26, ym: ym, tU: 4.2, tL: 7.4, mid: mid });
  });
  A.pezzo("bocca", "canini", function (K) {
    var w = K.m ? 15.6 : 15.2, yc = -26.6, yu = -26.2, yl = -21.8;
    var fangs = "", fg = gradV(K, [[0, DENTE_O], [0.4, DENTE], [1, K.mix(DENTE, DENTE_O, 0.4)]]);
    [-1, 1].forEach(function (l) {
      var x = l * 8.4;
      fangs += K.Pa("M" + N(x - 2.1) + " " + (yu - 1) + "L" + N(x + 2.1) + " " + (yu - 1) + "L" + N(x + 2) + " " + N(yu + 4) + "Q" + N(x + 1) + " " + N(yu + 7) + " " + N(x + l * 0.2) + " " + N(yu + 8.6) + "Q" + N(x - 1.4) + " " + N(yu + 6.4) + " " + N(x - 2) + " " + N(yu + 4) + "Z", fg) +
        St("M" + N(x - 1) + " " + N(yu + 2) + "L" + N(x - 0.8) + " " + N(yu + 5.4), "#ffffff", 0.6, 0.5);
    });
    return filtro(K) + angoli(K, w, yc, 0.8, true) + aperta(K, { w: w, yc: yc, yu: yu, yl: yl, denti: "sopra", hS: 3.2, tU: 3.8, tL: 5.2, mid: fangs });
  });
  A.pezzo("bocca", "apparecchio", function (K) {
    var w = K.m ? 17 : 16.6, yc = -27.6, yu = -27.1, hS = 5.8;
    function eu(x) { return yc + (1 - (x / w) * (x / w)) / 2 * (2 * yu - yc - yc); }
    var tw = (2 * w - 4.4) / 6, met = "", fil = "", i, x, pts = [];
    var mg = K.LG(uid(), 0, 0, 1, 1, [[0, "#f4f7fa"], [0.5, "#aab4be"], [1, "#6d7882"]]);
    for (i = 0; i < 6; i++) { x = -w + 2.2 + tw * (i + 0.5); pts.push([x, eu(x) + hS * 0.5]); }
    fil = St("M" + pts.map(function (q) { return N(q[0]) + " " + N(q[1]); }).join("L"), "#8e99a4", 0.7, 0.95);
    pts.forEach(function (q) { met += K.Pa("M" + N(q[0] - 1.35) + " " + N(q[1] - 1.2) + "h2.7v2.4h-2.7Z", mg) + K.El(q[0] - 0.4, q[1] - 0.5, 0.5, 0.4, "#ffffff", " opacity='.8'"); });
    return filtro(K) + angoli(K, w, yc, 1, true) +
      aperta(K, { w: w, yc: yc, yu: yu, yl: -19.4, denti: "tutti", hS: hS, hI: 3, tU: 3.8, tL: 5.4, inInt: function () { return fil + met; } });
  });
  A.pezzo("bocca", "mordilabbro", function (K) {
    var w = 13.6, ym = -23.4, s = filtro(K), lip = K.labbro, dk = K.mix(lip, "#000000", 0.12);
    var plate = "M-6.2 " + (ym - 1.6) + "L6.2 " + (ym - 1.6) + "L6 " + N(ym + 2.6) + "Q5.6 " + N(ym + 4.6) + " 3.4 " + N(ym + 4.7) + "L-3.4 " + N(ym + 4.7) + "Q-5.6 " + N(ym + 4.6) + " -6 " + N(ym + 2.6) + "Z";
    var mid = K.Pa(plate, gradV(K, [[0, DENTE_O], [0.35, DENTE], [1, K.mix(DENTE, DENTE_O, 0.4)]])) + St("M0 " + (ym - 1) + "L0 " + N(ym + 4.4), DENTE_O, 0.6, 0.8) +
      K.El(0, ym + 5.6, 6.2, 1.5, K.soft(K.mix(lip, "#000000", 0.4), 0.5));
    var post = K.El(-1, ym + 8.6, 5, 1.2, "#ffffff", " opacity='" + (glo(K) + 0.1) + "'");
    return s + chiusa(K, { w: w, yc: -25.8, ym: ym, tU: 4.2, tL: 7.4, mid: mid, post: post, gloss: 0.01 });
  });
  A.pezzo("bocca", "nervoso", function (K) {
    var lip = K.labbro, dk = K.mix(lip, "#000000", 0.12), ln = linea(K), s = filtro(K);
    var W = "M-14 -23.4C-11.2 -26.6 -9.2 -21 -6.6 -24.2C-4.2 -27.4 -2 -21.4 0.4 -24.6C3 -27.8 5 -21.6 7.6 -24.4C10 -27 11.6 -22.4 14 -23.6";
    s += K.El(0, -14.4, 10, 2.4, K.soft(K.skDD, 0.3));
    s += St(W, dk, 6.2, 1) + St(W, lip, 4.4, 1);
    s += St("M-12 -21.2C-8 -19.4 -4 -19.2 0 -19.4C4 -19.2 8 -19.4 12 -21.2", K.mix(lip, "#ffffff", 0.1), 1, 0.55);
    s += St(W, ln, 1.1);
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
      P[c] += "M" + nn(x, 1) + nn(y) + "q" + nn(cx, 1) + nn(cy) + nn(dx) + nn(dy);
    }
    var cl = K.lum(K.capelli), op = [cl > 0.45 ? ".26" : ".5", cl > 0.45 ? ".3" : ".45", ".4"], wd = ["1.1", "1", ".8"], col = [K.hDD, K.hD, K.hL], s = "";
    for (i = 0; i < 3; i++) s += "<path d='" + P[i] + "' stroke='" + col[i] + "' stroke-width='" + wd[i] + "' stroke-opacity='" + op[i] + "'/>";
    return "<g fill='none' stroke-linecap='round'>" + s + "</g>";
  }
  var EO = 0;
  function fuoriViso(K) {
    if (K.vsFuori) return K.vsFuori;   // (leggero) uno solo per avatar
    var id = "LVf" + (EO++);   // (prefisso maiuscolo: «bo1» del borsalino era lo stesso id)
    K.D.push("<clipPath id='" + K.id + id + "'><path clip-rule='evenodd' d='M-200 -260H200V260H-200Z" + K.faceD + "'/></clipPath>");
    return (K.vsFuori = "url(#" + K.id + id + ")");
  }
  // la massa disegnata: dentro (nel viso) e sopra (fuori dal viso, per mento e guance che sporgono)
  // (leggero, 5 nov 2026) la massa si scrive UNA volta in defs e si usa due volte (dentro e sopra), il contorno una volta
  // sola (colore e bordi sfumati lo usano con <use>): stesso disegno, metà testo
  function massa(K, d, o) {
    o = o || {};
    var g = K.LG(uid(), 0, 0, 0.6, 1, [[0, K.mix(K.capelli, K.hL, 0.28)], [0.45, K.capelli], [1, K.hD]]), mc = K.clip(d), id = K.id + "LVm" + (EO++);
    K.D.push("<path id='" + id + "p' d='" + d + "'/>");
    var u = "<use href='#" + id + "p'";
    var base = u + " fill='" + g + "' opacity='" + (o.op || ".93") + "'/>";
    if (o.sfuma) {
      base += "<g fill='none' stroke='" + K.capelli + "' stroke-linecap='round'>" + u + " stroke-width='4' stroke-opacity='.22'/>" + u + " stroke-width='1.8' stroke-opacity='.3'/></g>";
      var Rs = K.rnd(77), pd = "", T = o.sfuma, k, t, a, b;
      for (k = 0; k < 150; k++) { t = Rs() * (T.length - 1); a = T[Math.floor(t)]; b = T[Math.min(T.length - 1, Math.floor(t) + 1)]; var f = t - Math.floor(t), sg = Rs() < 0.5 ? -1 : 1, px = a[0] + (b[0] - a[0]) * f, py = a[1] + (b[1] - a[1]) * f - Rs() * 5; pd += "M" + nn(sg * px, 1) + nn(py) + "h.3"; }
      base += "<path d='" + pd + "' stroke='" + K.hD + "' stroke-width='1.1' stroke-linecap='round' opacity='.4' fill='none'/>";
    }
    var tex = "<g clip-path='" + mc + "'>" + fili(K, o.seed || 31, Math.round((o.n || 800) * 0.42), { xr: 76, y0: -80, y1: o.y1 || 66 }) + K.El(-18, -28, 22, 14, K.soft("#ffffff", 0.1)) + K.El(26, -20, 26, 30, K.soft("#000000", 0.18)) + "</g>";
    K.D.push("<g id='" + id + "'>" + base + tex + "</g>");
    var r = { dentro: "<use href='#" + id + "'/>", sopra: "" };
    var ro = o.ombra ? K.El(0, o.ombra[0], o.ombra[1], o.ombra[2], K.soft("#000000", 0.32)) : "";
    r.sopra = ro + "<g clip-path='" + fuoriViso(K) + "'><use href='#" + id + "'/></g>";
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
    s += St("M-1 -12C1 -6 -1 0 1 6C2 9 1 12 2 15", e, 3.4, 0.2);
    s += St("M0 -12C2 -6 0 0 2 6C3 9 2 12 3 15", c, 2.2, 0.95) + St("M-0.4 -12C1.6 -6 -0.4 0 1.6 6C2.6 9 1.6 12 2.6 15", K.mix(c, "#ffffff", 0.35), 0.7, 0.55);
    for (var i = 0; i < 5; i++) { var y = -8 + i * 5.2, x = 0.6 + (i % 2) * 0.4; s += St("M" + N(x - 3) + " " + N(y) + "L" + N(x + 3.4) + " " + N(y + 0.6), e, 0.9, 0.55); }
    return s + "</g>";
  });
  A.pezzo("segno", "cerotto", function (K) {
    var cr = "#ecc79e", cb = K.LG(uid(), 0, 0, 0, 1, [[0, "#f4d6b2"], [1, "#d9ae80"]]);
    var s = "<g transform='translate(31 -50) rotate(-24)'>";
    s += K.El(0, 1.6, 12, 4.6, K.soft("#000000", 0.28));
    s += K.Pa("M-10.5 -3.6H10.5Q12.5 -3.6 12.5 -1.6V1.6Q12.5 3.6 10.5 3.6H-10.5Q-12.5 3.6 -12.5 1.6V-1.6Q-12.5 -3.6 -10.5 -3.6Z", cb);
    s += K.Pa("M-4.6 -3.6H4.6V3.6H-4.6Z", "#f7e6d0") + St("M-4.6 -3.6V3.6M4.6 -3.6V3.6", "#c89a70", 0.5, 0.7);
    for (var i = 0; i < 4; i++) { s += "<circle cx='" + (-9.4 + i * 0.7) + "' cy='" + (-2 + i * 1.4) + "' r='.28' fill='#b88a60' opacity='.5'/><circle cx='" + (9.4 - i * 0.7) + "' cy='" + (-2 + i * 1.4) + "' r='.28' fill='#b88a60' opacity='.5'/>"; }
    s += St("M-10.5 -3.2H10.5", "#ffffff", 0.7, 0.4) + St("M-12.2 -1.8V1.8", "#b98c63", 0.5, 0.5) + St("M12.2 -1.8V1.8", "#b98c63", 0.5, 0.5);
    return s + "</g>";
  });
  A.pezzo("segno", "occhiaie", function (K) {
    var tono = K.mix(K.skDD, "#4a3a78", K.lum(K.pelle) < 0.4 ? 0.18 : 0.38), s = "<g clip-path='" + pelleFissa(K) + "'>";
    [-1, 1].forEach(function (l) {
      s += K.El(l * 25, -62.6, 15, 5.2, K.soft(tono, 0.62)) + St("M" + N(l * 14) + " -66.4C" + N(l * 20) + " -61.4 " + N(l * 30) + " -61.2 " + N(l * 38) + " -65.6", tono, 1.3, 0.34);
    });
    return s + "</g>";
  });
  A.pezzo("segno", "rughe", function (K) {
    var c = K.lum(K.pelle) < 0.3 ? K.mix(K.pelle, "#d9a07a", 0.45) : K.skDD, s = "<g clip-path='" + pelleFissa(K) + "'>";
    [[-102, 25, 0.34], [-107.6, 21, 0.3], [-113, 16, 0.24]].forEach(function (r, i) {
      s += St("M" + (-r[1]) + " " + N(r[0] + 0.6) + "C" + N(-r[1] * 0.4) + " " + N(r[0] - 1.2 + i * 0.2) + " " + N(r[1] * 0.4) + " " + N(r[0] - 1.2) + " " + r[1] + " " + N(r[0] + 0.6), c, 1.1, r[2]);
      s += St("M" + (-r[1]) + " " + N(r[0] + 2.4) + "C" + N(-r[1] * 0.4) + " " + N(r[0] + 0.8) + " " + N(r[1] * 0.4) + " " + N(r[0] + 0.8) + " " + r[1] + " " + N(r[0] + 2.4), "#ffffff", 0.7, r[2] * 0.5);
    });
    [1, -1].forEach(function (l) {
      s += St("M" + N(l * 45) + " -76C" + N(l * 49) + " -77 " + N(l * 52) + " -78.6 " + N(l * 53) + " -80", c, 0.9, 0.22) + St("M" + N(l * 45.6) + " -72C" + N(l * 49.4) + " -72 " + N(l * 52) + " -72.6 " + N(l * 53.2) + " -73.6", c, 0.9, 0.2) + St("M" + N(l * 45) + " -68C" + N(l * 48.6) + " -67 " + N(l * 51) + " -66.4 " + N(l * 52.4) + " -65.4", c, 0.9, 0.18);
      s += St("M" + N(l * 13) + " -44C" + N(l * 19) + " -38 " + N(l * 20) + " -32 " + N(l * 18) + " -26", c, 1.2, 0.2);
    });
    return s + "</g>";
  });
  A.pezzo("segno", "voglia", function (K) {
    var c = K.lum(K.pelle) < 0.3 ? K.mix(K.pelle, "#d2a273", 0.55) : K.mix(K.pelle, "#7a3d22", 0.42), d = "M-1 -7C4 -9.4 9 -6.6 9.6 -1.4C10 3.4 5.4 6.4 0.6 6C-4.6 5.6 -6.6 1.6 -5.2 -2C-4.6 -4.6 -2.6 -6.4 -1 -7Z";
    return "<g transform='translate(-34 -53) rotate(-14) scale(.78)'>" + K.El(2, 0, 12.4, 10.6, K.soft(c, 0.34)) + K.Pa(d, c, " opacity='.58'") +
      St("M0 -4C3 -5.4 6.4 -3.6 7 -0.6", K.mix(c, "#ffffff", 0.25), 0.9, 0.3) + "</g>";
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
  // (leggero) l'uscita di ogni pezzo di questo file dentro il gruppo GR (vedi St)
  [["bocca", "sorrisone"], ["bocca", "sorrisetto"], ["bocca", "ghigno"], ["bocca", "risata"], ["bocca", "labbra"], ["bocca", "o"], ["bocca", "triste"], ["bocca", "smorfia"], ["bocca", "baciotto"], ["bocca", "linguaccia"], ["bocca", "micio"], ["bocca", "dentoni"], ["bocca", "canini"], ["bocca", "apparecchio"], ["bocca", "mordilabbro"], ["bocca", "nervoso"], ["barba", "corta"], ["barba", "folta"], ["barba", "pizzetto"], ["barba", "baffi"], ["barba", "baffipizzetto"], ["barba", "barbalunga"], ["barba", "collare"], ["barba", "ancora"], ["barba", "baffoni"], ["barba", "basettoni"], ["segno", "neo"], ["segno", "cicatrice"], ["segno", "cerotto"], ["segno", "occhiaie"], ["segno", "rughe"], ["segno", "voglia"], ["segno", "stellina"]].forEach(function (tv) {
    var f = A[tv[0]][tv[1]]; if (!f) return;
    A[tv[0]][tv[1]] = function () {
      var r = f.apply(this, arguments);
      if (typeof r === "string") return r ? GR + r + "</g>" : r;
      if (r && typeof r === "object") { var o = {}; for (var k in r) o[k] = typeof r[k] === "string" && r[k] ? GR + r[k] + "</g>" : r[k]; return o; }
      return r;
    };
  });
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
  function stampa(K, T) { var st = A.stampa && A.stampa[K.c.stampa]; return st ? fuori("<g clip-path='" + K.clip(T) + "'>" + st(K, T) + "</g>") : ""; }
  // (leggero) ogni bottone uguale (stesso raggio e colore) si scrive una volta (in defs) e si mette al suo posto con <use>
  function bottone(K, x, y, r, col) {
    r = r || 3.6;
    var M = K.LSbt || (K.LSbt = {}), k = r + col;
    if (!M[k]) { M[k] = K.id + "LSb" + (uid++); K.D.push("<g id='" + M[k] + "'>" + bottone0(K, 0, 0, r, col) + "</g>"); }
    return "<use href='#" + M[k] + "' transform='translate(" + n1(x) + " " + n1(y) + ")'/>";
  }
  function bottone0(K, x, y, r, col) {
    return K.El(x + 0.8, y + 1.3, r, r, "#000000", " opacity='.28'") + "<circle cx='" + n1(x) + "' cy='" + n1(y) + "' r='" + r + "' fill='" + col + "' stroke='" + K.scuro(col, 0.45) + "' stroke-width='.9'/>" +
      K.El(x - r * 0.3, y - r * 0.35, r * 0.4, r * 0.3, "#ffffff", " opacity='.55'") + St("M" + n1(x - r * 0.3) + " " + n1(y + 0.4) + "h.1M" + n1(x + r * 0.3) + " " + n1(y + 0.4) + "h.1", K.scuro(col, 0.6), 1, 0.7);
  }
  function cerniera(K, x, y0, y1, luce) {
    var d = "M" + n1(x) + " " + y0 + "L" + n1(x) + " " + y1;
    return St(d, "#000000", 6, 0.6) + St(d, luce || "#c9ccd3", 3.8, 0.95) + St(d, "#6f737d", 3.8, 0.9, " stroke-dasharray='1.5 1.5'") + St(d, "#ffffff", 1, 0.6, " stroke-dasharray='1.5 1.5'");
  }
  function tiretta(K, x, y) {
    return K.Pa("M" + (x - 5) + " " + (y - 4) + "L" + (x + 5) + " " + (y - 4) + "L" + (x + 4) + " " + (y + 11) + "L" + (x - 4) + " " + (y + 11) + "Z", "#c9ccd3", " stroke='#5b5e66' stroke-width='1' stroke-linejoin='round'") +
      "<rect x='" + (x - 2.4) + "' y='" + (y + 6) + "' width='4.8' height='11' rx='2.2' fill='#aab0ba' stroke='#5b5e66' stroke-width='.8'/><rect x='" + (x - 1) + "' y='" + (y + 9) + "' width='2' height='5.5' rx='1' fill='#3a3d44'/>";
  }
  // (leggero, 5 nov 2026) la stessa linea usata più volte (ripassata con ombra, colore e luce, riempita e bordata): si scrive UNA
  // volta (in defs) e ogni passaggio la usa con <use>. tratto() = gli attributi di K.St (opacity = stroke-opacity: per un tratto è uguale)
  // I tratti di questo file (St) non ripetono fill='none' e la punta tonda: li dà UNA volta il gruppo che avvolge tutto il capo
  // (GR, messo in fondo al file da chi registra i capi). Tutto quello che disegnano gli altri (le stampe, la maglietta del motore
  // sotto il grembiule) esce dal gruppo con fuori(). Nel gruppo ogni riempimento è scritto (fill=…), quindi non cambia niente.
  var GR = "<g fill='none' stroke-linecap='round'>", RX_LN = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
  function fuori(x) { return x ? "</g>" + x + GR : ""; }
  function op3(v) { var t = "" + Math.round(v * 1000) / 1000; return t.charAt(0) === "0" && t.length > 1 ? t.slice(1) : t; }
  function St(d, c, w, op, x) { return "<path d='" + d + "' stroke='" + c + "' stroke-width='" + w + "'" + (op != null ? " opacity='" + op3(op) + "'" : "") + (x ? x.replace(RX_LN, "") : "") + "/>"; }
  // la trama (motivo a ripetizione) su una parte già ritagliata: un rettangolo invece di riscrivere il contorno (stesso disegno)
  function tela(f) { return "<rect x='-200' y='-200' width='800' height='1400' fill='" + f + "'/>"; }
  function telaManica(K, l, d, f) { return K.suManica(l, "<g clip-path='" + K.clip(d) + "'>" + tela(f) + "</g>"); }   // (il ritaglio della manica c'è già: lo fa maniche())
  function linea(K, d) { var id = K.id + "LSl" + (uid++); K.D.push("<path id='" + id + "' d='" + d + "'/>"); return id; }
  function usa(id, at) { return "<use href='#" + id + "'" + at + "/>"; }
  function tratto(c, w, op, x) { return " stroke='" + c + "' stroke-width='" + w + "'" + (op != null ? " stroke-opacity='" + op3(op) + "'" : "") + (x || ""); }
  // maniche: UN contorno per braccio (K.manica) che va colorato insieme al tronco con K.dipingi.
  // ritorna { br: da passare a K.dipingi, dett: pieghe (da mettere nel "dentro"), pol: polsini (da mettere dopo), ds: contorni }
  function maniche(K, col, o) {
    o = o || {};
    var lung = o.lung == null ? 1 : o.lung, e = o.agio == null ? 7 : o.agio, k = colori(K, col), br = [], ds = [], dett = "", pol = "";
    [-1, 1].forEach(function (l) {
      var d = K.manica(l, { lung: lung, agio: e, svasa: o.svasa || 0, tonda: o.tonda });
      ds.push(d);
      br.push({ d: d, lato: l, fino: lung, e: e });
      var b = K.BR[l], J = b.J, E = b.E, g = "<g clip-path='" + K.clip(d) + "'>" + K.El(J[0] + l * 6, J[1] + 36, 12, 24, K.soft(k.mdd, 0.25));
      if (lung > 0.5) {
        var ux = b.W[0] - J[0], uy = b.W[1] - J[1], ul = Math.hypot(ux, uy) || 1, w = (K.B.aw[1] + e) * 0.62 + 2;
        ux /= ul; uy /= ul;
        var px = -uy, py = ux;
        for (var i = 0; i < 3; i++) {
          var cx = E[0] + ux * (i * 7 - 6), cy = E[1] + uy * (i * 6 - 5), q = 1 - i * 0.2;
          g += St("M" + n1(cx - px * w) + " " + n1(cy - py * w) + "Q" + n1(cx + ux * 5 * l * l) + " " + n1(cy + uy * 5) + " " + n1(cx + px * w) + " " + n1(cy + py * w), k.mdd, 3.4, 0.11 * q) +
            St("M" + n1(cx - px * w + ux * 2) + " " + n1(cy - py * w + uy * 2) + "Q" + n1(cx + ux * 7) + " " + n1(cy + uy * 7) + " " + n1(cx + px * w * 0.2 + ux * 2) + " " + n1(cy + py * w * 0.2 + uy * 2), "#ffffff", 1.4, 0.1 * q);
        }
      }
      dett += K.suManica(l, g + (o.extra ? o.extra(l, d, b) : "") + "</g>");
      if (o.pol) pol += K.suManica(l, polsino(K, l, lung, o.pol[0], e, o.pol[1], o.pol[2], o.pol[3]));
    });
    return { br: br, dett: dett, pol: pol, ds: ds };
  }
  // dipinge tronco + maniche (+ altro) in un colpo solo; dentro = dettagli ritagliati sulla sagoma intera
  function veste(K, mg, T, M, dentro, o) {
    o = o || {};
    o.dentro = (M ? M.dett : "") + (dentro || "");
    return K.dipingi({ tronco: [T], braccia: M ? M.br : [] }, mg, o);
  }
  // un pezzo di disegno ritagliato sul solo tronco
  function inT(K, T, svg) { return "<g clip-path='" + K.clip(T) + "'>" + svg + "</g>"; }
  // polsino/orlo di manica a costine o liscio (e = agio usato nella manica)
  function polsino(K, l, lung, len, e, fill, linea, o) {
    o = o || {};
    var f = K.fineManica(l, lung), w = (f.w + e + (o.dw || 0)), ux = f.dx, uy = f.dy, px = -uy, py = ux, xs = f.x - ux * len, ys = f.y - uy * len;
    if (px > 0) { px = -px; py = -py; }
    var s = K.Pa(K.limb([[xs, ys, w * 0.98], [f.x, f.y, w * 0.94]]), fill) + "<g clip-path='" + K.clip(K.limb([[xs, ys, w * 0.98], [f.x, f.y, w * 0.94]])) + "'>";
    if (!o.liscio) for (var q = -0.42; q <= 0.43; q += 0.14) s += St("M" + n1(xs + px * w * q) + " " + n1(ys + py * w * q) + "L" + n1(f.x + px * w * q * 0.96) + " " + n1(f.y + py * w * q * 0.96), linea, 1.1, 0.34);
    s += St("M" + n1(xs + px * w * 0.5) + " " + n1(ys + py * w * 0.5) + "L" + n1(f.x + px * w * 0.47) + " " + n1(f.y + py * w * 0.47), "#ffffff", 2.2, 0.28) + St("M" + n1(xs - py * 0 + px * w * -0.5) + " " + n1(ys - py * 0 + py * w * -0.5) + "L" + n1(f.x - px * w * 0.47) + " " + n1(f.y - py * w * 0.47), linea, 3, 0.3) + "</g>";
    s += St("M" + n1(xs + px * w * 0.49) + " " + n1(ys + py * w * 0.49) + "L" + n1(xs - px * w * 0.49) + " " + n1(ys - py * w * 0.49), linea, 1.6, 0.5);
    return s;
  }
  // luce e ombra sul busto (dentro il ritaglio del busto)
  function ombra(K, k, o) {
    o = o || {};
    var C = K.C, B = K.B, Y = K.Y, mdd = k.mdd, q = o.q == null ? 1 : o.q, s = "";
    s += K.El(C - 40, Y.petto - 30, 30, 40, K.soft("#ffffff", 0.2)) + K.El(C + B.ch - 6, Y.petto + 30, 24, 120, K.soft(mdd, 0.22)) + K.El(C, 272, 40, 14, K.soft(mdd, 0.35));
    if (K.donna) { var bs = B.seno || 1; s += K.El(C - 25 * bs, Y.petto + 26 * bs, 36 * bs, 15 * bs, K.soft(mdd, 0.15)) + K.El(C + 25 * bs, Y.petto + 26 * bs, 36 * bs, 15 * bs, K.soft(mdd, 0.19)) + K.El(C - 28 * bs, Y.petto + 2, 24 * bs, 20 * bs, K.soft("#ffffff", 0.14)); }
    if (B.pancia && !o.noPancia) s += St("M" + (C - B.wt + 10) + " " + (Y.vita + 26) + "C" + (C - 30) + " " + (Y.vita + 44) + " " + (C + 30) + " " + (Y.vita + 44) + " " + (C + B.wt - 10) + " " + (Y.vita + 26), mdd, 4, 0.25);
    if (!o.noPieghe) {
      s += St("M" + (C - B.wt + 4) + " 470C" + (C - B.wt + 24) + " 478 " + (C - B.wt + 44) + " 472 " + (C - B.wt + 64) + " 482", mdd, 5, 0.13 * q) +
        St("M" + (C + B.wt - 6) + " 442C" + (C + B.wt - 26) + " 454 " + (C + B.wt - 40) + " 452 " + (C + B.wt - 62) + " 464", mdd, 4, 0.15 * q) +
        St("M" + (C - 24) + " 420C" + (C - 12) + " 440 " + (C - 10) + " 470 " + (C - 18) + " 498", mdd, 4, 0.1 * q);
    }
    return s;
  }
  // bordo interno morbido (niente contorni neri)
  function bordo(K, T, k, w) { return ""; }
  // bordo interno morbido solo per i capi senza maniche (nessuna giuntura possibile)
  function bordoS(K, T, k, w) { return inT(K, T, St(T, k.mdd, w || 4, 0.3)); }
  // fascia a costine sull'orlo (dentro il ritaglio del busto)
  function costineOrlo(K, k, orlo, h, fill) {
    var C = K.C, B = K.B, x0 = C - B.hp - 20, x1 = C + B.hp + 20, hh = h == null ? 22 : h;
    return K.Pa("M" + (C - 200) + " " + (orlo - hh) + "Q" + C + " " + (orlo - hh + 6) + " " + (C + 200) + " " + (orlo - hh) + "L" + (C + 200) + " " + (orlo + 30) + "L" + (C - 200) + " " + (orlo + 30) + "Z", cilU(K, fill, x0, x1, 0.9)) +
      K.Pa("M" + (C - 200) + " " + (orlo - hh) + "Q" + C + " " + (orlo - hh + 6) + " " + (C + 200) + " " + (orlo - hh) + "L" + (C + 200) + " " + (orlo + 30) + "L" + (C - 200) + " " + (orlo + 30) + "Z", costine(K)) +
      St("M" + (C - 200) + " " + (orlo - hh) + "Q" + C + " " + (orlo - hh + 6) + " " + (C + 200) + " " + (orlo - hh), k.mdd, 2, 0.5) +
      St("M" + (C - 200) + " " + (orlo - hh + 2.5) + "Q" + C + " " + (orlo - hh + 8.5) + " " + (C + 200) + " " + (orlo - hh + 2.5), "#ffffff", 1.2, 0.3);
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
      s += "<g clip-path='" + K.clip(d) + "'>" + K.El(C + l * (nk + tw * 0.5), ty - 10, 16, 20, K.soft("#ffffff", l < 0 ? 0.3 : 0.12)) + St("M" + X(nk + 2) + " " + (top + 4) + "C" + X(nk + 6) + " " + (top + 20) + " " + X(nk + tw * 0.6) + " " + (ty - 18) + " " + X(nk + tw - 2) + " " + (ty - 5), K.scuro(fill, 0.3), 2, 0.3) + "</g>";
      s += St("M" + X(nk + tw) + " " + ty + "Q" + X(nk * 0.45 + 6) + " " + (ty - 16) + " " + X(2) + " " + cy, k.mdd, 1.6, 0.55);
      s += St("M" + X(nk + tw + 6) + " " + (ty - 28) + "L" + X(nk + tw - 1) + " " + (ty - 4), "#ffffff", 1.2, 0.35);
    });
    return s;
  }
  // luci e ombre del busto di un capo lungo (cappotto, vestiti): pieghe verticali che scendono
  function pieghe(K, k, y0, y1, n, q) {
    var C = K.C, B = K.B, s = "", w = Math.max(B.hp, B.wt) + 10;
    for (var i = 0; i < n; i++) {
      var t = (i + 0.5) / n, x = C + (t - 0.5) * 2 * w * 0.9, sw = (t - 0.5) * 2;
      s += St("M" + n1(C + (t - 0.5) * 2 * w * 0.55) + " " + y0 + "C" + n1(x - 2) + " " + n1(y0 + (y1 - y0) * 0.35) + " " + n1(x + sw * 6) + " " + n1(y0 + (y1 - y0) * 0.7) + " " + n1(x + sw * 12) + " " + y1, k.mdd, 5 + (i % 2) * 2, (0.1 + (i % 3) * 0.03) * q) +
        St("M" + n1(C + (t - 0.5) * 2 * w * 0.55 - 3) + " " + y0 + "C" + n1(x - 5) + " " + n1(y0 + (y1 - y0) * 0.35) + " " + n1(x + sw * 6 - 3) + " " + n1(y0 + (y1 - y0) * 0.7) + " " + n1(x + sw * 12 - 3) + " " + y1, "#ffffff", 2, 0.1 * q);
    }
    return s;
  }

  // =========================================================
  //  FELPA
  // =========================================================
  A.pezzo("capo", "felpa", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", rib = K.mix(mg, k.mdd, 0.22);
    var T = K.busto({ agio: 4, orlo: 512, scollo: { prof: 10, larg: 8 }, svasa: -2, pancia: B.pancia ? 8 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 3.5, pol: [18, rib, k.mdd] });
    // il cappuccio dietro il collo: stoffa piena, piu scura, con l'interno in ombra e due pieghe
    var hd = "M" + (C - nk - 30) + " 266C" + (C - nk - 36) + " 232 " + (C - nk - 14) + " 204 " + C + " 202C" + (C + nk + 14) + " 204 " + (C + nk + 36) + " 232 " + (C + nk + 30) + " 266Z", hcol = K.scuro(mg, 0.2);
    var dietro = K.Pa(hd, cilU(K, hcol, C - nk - 36, C + nk + 36, 0.9)) + "<g clip-path='" + K.clip(hd) + "'>" +
      K.El(C, 250, nk + 12, 40, K.soft(K.scuro(mg, 0.62), 0.85)) + K.El(C - nk - 14, 232, 10, 28, K.soft("#ffffff", 0.14)) +
      St("M" + (C - nk - 22) + " 222C" + (C - nk - 12) + " 238 " + (C - nk - 14) + " 252 " + (C - nk - 20) + " 262", k.mdd, 2, 0.4) + St("M" + (C + nk + 22) + " 222C" + (C + nk + 12) + " 238 " + (C + nk + 14) + " 252 " + (C + nk + 20) + " 262", k.mdd, 2, 0.4) + "</g>" +
      St(hd, k.mdd, 1.6, 0.55);
    var q = ombra(K, k, { q: 1.3 });
    // tasca a marsupio
    var tb = Math.max(B.wt - 8, 34), tt = Math.min(48, tb - 6), pk = "M" + (C - tt) + " 430C" + (C - tt - 2) + " 440 " + (C - tb + 2) + " 470 " + (C - tb) + " 500L" + (C + tb) + " 500C" + (C + tb - 2) + " 470 " + (C + tt + 2) + " 440 " + (C + tt) + " 430C" + (C + 20) + " 436 " + (C - 20) + " 436 " + (C - tt) + " 430Z";
    q += K.Pa(pk, K.mix(mg, "#000000", 0.05), " opacity='.5'") + St(pk, k.mdd, 3, 0.35) + St("M" + (C - tt + 3) + " 433C" + (C - 20) + " 439 " + (C + 20) + " 439 " + (C + tt - 3) + " 433", "#ffffff", 1.4, 0.25) +
      St("M" + (C - tt - 1) + " 432C" + (C - tt - 3) + " 442 " + (C - tb + 3) + " 470 " + (C - tb + 1) + " 496", k.mdd, 1.2, 0.5, " stroke-dasharray='3 2.5'") + St("M" + (C + tt + 1) + " 432C" + (C + tt + 3) + " 442 " + (C + tb - 3) + " 470 " + (C + tb - 1) + " 496", k.mdd, 1.2, 0.5, " stroke-dasharray='3 2.5'") +
      K.El(C - tt + 4, 462, 8, 22, K.soft(k.mdd, 0.45)) + K.El(C + tt - 4, 462, 8, 22, K.soft(k.mdd, 0.5)) + K.El(C, 482, tb - 6, 10, K.soft(k.mdd, 0.18));
    q += costineOrlo(K, k, 512, 24, rib);
    s += veste(K, mg, T, M, inT(K, T, q)).svg + M.pol;
    s += stampa(K, T);
    // il cappuccio sul davanti (a rotolo attorno al collo) e i cordini
    var hood = "M" + (C - nk - 22) + " 238C" + (C - nk - 30) + " 264 " + (C - nk - 14) + " 296 " + (C - 22) + " 306C" + (C - 8) + " 309 " + (C + 8) + " 309 " + (C + 22) + " 306C" + (C + nk + 14) + " 296 " + (C + nk + 30) + " 264 " + (C + nk + 22) + " 238C" + (C + nk + 16) + " 238 " + (C + nk + 8) + " 240 " + (C + nk + 3) + " 244C" + (C + nk + 2) + " 258 " + (C + nk * 0.5) + " 270 " + C + " 270C" + (C - nk * 0.5) + " 270 " + (C - nk - 2) + " 258 " + (C - nk - 3) + " 244C" + (C - nk - 8) + " 240 " + (C - nk - 16) + " 238 " + (C - nk - 22) + " 238Z";
    var inn = "M" + (C + nk + 3) + " 244C" + (C + nk + 2) + " 258 " + (C + nk * 0.5) + " 270 " + C + " 270C" + (C - nk * 0.5) + " 270 " + (C - nk - 2) + " 258 " + (C - nk - 3) + " 244";
    s += K.Pa(hood, cilU(K, mg, C - nk - 30, C + nk + 30, 0.9)) + "<g clip-path='" + K.clip(hood) + "'>" +
      (function () { var il = linea(K, inn); return usa(il, tratto(k.mdd, 9, 0.38)) + usa(il, tratto(k.mdd, 4, 0.45, " transform='translate(0 -1)'")); })() +
      K.El(C - nk - 10, 262, 12, 26, K.soft("#ffffff", 0.16)) + K.El(C + nk + 12, 282, 14, 22, K.soft(k.mdd, 0.35)) + K.El(C, 304, 26, 8, K.soft(k.mdd, 0.3)) +
      St("M" + (C - nk - 16) + " 250C" + (C - nk - 18) + " 274 " + (C - 20) + " 296 " + C + " 299C" + (C + 20) + " 296 " + (C + nk + 18) + " 274 " + (C + nk + 16) + " 250", k.mdd, 1.8, 0.35) +
      St("M" + (C - nk - 8) + " 246C" + (C - nk - 6) + " 262 " + (C - nk + 4) + " 276 " + (C - 14) + " 283", k.mdd, 1.6, 0.3) + St("M" + (C + nk + 8) + " 246C" + (C + nk + 6) + " 262 " + (C + nk - 4) + " 276 " + (C + 14) + " 283", k.mdd, 1.6, 0.3) +
      St("M" + (C - nk - 10) + " 250C" + (C - nk - 9) + " 264 " + (C - nk - 1) + " 275 " + (C - 18) + " 283", "#ffffff", 1.2, 0.22) + "</g>" +
      St(hood, k.mdd, 1.5, 0.55) + St("M" + (C - nk - 18) + " 244C" + (C - nk - 25) + " 266 " + (C - nk - 12) + " 292 " + (C - 22) + " 302", "#ffffff", 1.3, 0.26);
    var cord = K.chiaro(mg, 0.7);
    [-1, 1].forEach(function (l) {
      var x = C + l * 13, d = "M" + n1(x) + " 270C" + n1(x + l * 3) + " 290 " + n1(x - l * 2) + " 320 " + n1(x + l * 2) + " 346", il = linea(K, d);
      s += usa(il, tratto(k.mdd, 4.4, 0.35)) + usa(il, tratto(cord, 3.2, 0.95)) + St("M" + n1(x + l * 2) + " 342L" + n1(x + l * 2.4) + " 354", K.mix(cord, "#444", 0.5), 4.2, 1);
    });
    return { dietro: dietro, corpo: s };
  });

  // =========================================================
  //  CAMICIA (e base per il gilet)
  // =========================================================
  function buildCamicia(K, mg, o) {
    o = o || {};
    var k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "";
    var T = K.busto({ agio: 4, orlo: 524, scollo: K.spalle ? { prof: 5, larg: 5 } : { tipo: "v", prof: 30, larg: 3 }, curvaOrlo: 9, pancia: B.pancia ? 5 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 5, pol: [17, K.mix(mg, "#ffffff", 0.06), k.mdd, { liscio: true }] });
    var q = ombra(K, k, { q: 0.8 });
    // fila dei bottoni
    q += K.Pa("M" + (C - 7) + " 262L" + (C + 7) + " 262L" + (C + 7) + " 540L" + (C - 7) + " 540Z", K.mix(mg, "#ffffff", 0.1), " opacity='.7'") + St("M" + (C - 7) + " 264L" + (C - 7) + " 530", k.mdd, 1.2, 0.35) + St("M" + (C + 7) + " 264L" + (C + 7) + " 530", k.mdd, 1.2, 0.4);
    for (var i = 0; i < 6; i++) q += bottone(K, C, 286 + i * 42, 3.5, K.chiaro(mg, 0.65));
    if (K.m) {   // taschino sul petto (a destra nel disegno)
      var px = C + B.ch * 0.5, py = 360;
      q += K.Pa("M" + (px - 13) + " " + py + "L" + (px + 13) + " " + py + "L" + (px + 13) + " " + (py + 24) + "L" + px + " " + (py + 29) + "L" + (px - 13) + " " + (py + 24) + "Z", K.mix(mg, "#000000", 0.04), " opacity='.5'") +
        St("M" + (px - 13) + " " + py + "L" + (px + 13) + " " + py + "L" + (px + 13) + " " + (py + 24) + "L" + px + " " + (py + 29) + "L" + (px - 13) + " " + (py + 24) + "Z", k.mdd, 1.3, 0.5) + St("M" + (px - 12) + " " + (py + 3) + "L" + (px + 12) + " " + (py + 3), "#ffffff", 1.2, 0.3);
    }
    q += St("M" + (C - B.hp + 2) + " 506C" + (C - 20) + " 514 " + (C + 20) + " 514 " + (C + B.hp - 2) + " 506", k.mdd, 2, 0.28);
    s += veste(K, mg, T, M, inT(K, T, q)).svg + M.pol;
    var cuffs = "";
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1);
      cuffs += K.suManica(l, bottone(K, f.x - f.dx * 9 + (l > 0 ? -5 : 5), f.y - f.dy * 9, 2.8, K.chiaro(mg, 0.65)));
    });
    return { corpo: s + cuffs, collar: colletto(K, k, { fill: mg, ty: 296, tw: 15 }), T: T, k: k };
  }
  A.pezzo("capo", "camicia", function (K) { var b = buildCamicia(K, K.maglia); return { corpo: b.corpo + b.collar }; });

  // =========================================================
  //  GIACCA (blazer aperto con revers)
  // =========================================================
  A.pezzo("capo", "giacca", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", cam = K.lum(mg) > 0.8 ? "#cdd5ea" : "#f4f5f9", kc = colori(K, cam);
    var T = K.busto({ agio: 4, orlo: 548, scollo: { tipo: "v", prof: 40, larg: 6 }, curvaOrlo: 9, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 5 });
    var ie = [[nk + 3, 242], [nk + 5, 262], [nk * 0.3 + 22, 304], [18, 360], [17, 420], [19, 466]];
    var L = ie.map(function (q) { return [C - q[0], q[1]]; }), R = ie.map(function (q) { return [C + q[0], q[1]]; }), Rr = R.slice().reverse();
    var cd = K.liscio(L) + "Q" + C + " " + (L[L.length - 1][1] + 12) + " " + n1(Rr[0][0]) + " " + n1(Rr[0][1]) + K.cr(Rr) + "Z";
    // sulla giacca: luci e ombre
    s += veste(K, mg, T, M, inT(K, T, ombra(K, k, { q: 1.1 }) + St("M" + (C - B.hp + 4) + " 540C" + (C - 30) + " 552 " + (C + 30) + " 552 " + (C + B.hp - 4) + " 540", k.mdd, 3, 0.3))).svg;
    // la camicia bianca nell'apertura
    s += K.Pa(cd, cilU(K, cam, C - 34, C + 34, 0.7)) + "<g clip-path='" + K.clip(cd) + "'>" + St(K.liscio(L), k.mdd, 11, 0.4) + St(K.liscio(R), k.mdd, 11, 0.5) + K.El(C, 250, nk + 4, 12, K.soft(kc.mdd, 0.4)) +
      St("M" + C + " 270L" + C + " 466", kc.mdd, 1.2, 0.3);
    for (var i = 0; i < 3; i++) s += bottone(K, C, 330 + i * 46, 2.8, "#ffffff");
    s += St("M" + (C - nk - 3) + " 240C" + (C - nk) + " 258 " + (C + nk) + " 258 " + (C + nk + 3) + " 240", "#ffffff", 8, 0.95) + "</g>";
    s += K.Pa("M" + (C - nk - 4) + " 238L" + (C - nk - 12) + " 268L" + (C - 4) + " 262Z", cam) + K.Pa("M" + (C + nk + 4) + " 238L" + (C + nk + 12) + " 268L" + (C + 4) + " 262Z", K.mix(cam, "#c9ccd6", 0.5));
    // i revers
    [-1, 1].forEach(function (l) {
      var X = function (v) { return n1(C + l * v); };
      var lp = "M" + X(nk + 2) + " 240L" + X(nk + 34) + " 267L" + X(nk + 25) + " 282L" + X(22) + " 424L" + X(17) + " 420C" + X(17) + " 400 " + X(18) + " 380 " + X(18) + " 360C" + X(18) + " 336 " + X(nk * 0.3 + 22) + " 316 " + X(nk * 0.3 + 22) + " 304C" + X(nk + 7) + " 288 " + X(nk + 5) + " 272 " + X(nk + 5) + " 262Z";
      s += K.El(C + l * (nk + 16), 300, 20, 30, K.soft("#000000", 0.3));
      s += K.Pa(lp, K.LG("vl" + (uid++), 0, 0, 1, 1, [[0, K.mix(mg, "#ffffff", l < 0 ? 0.4 : 0.26)], [0.6, K.mix(mg, "#ffffff", 0.08)], [1, mg]]));
      s += "<g clip-path='" + K.clip(lp) + "'>" + St("M" + X(nk + 32) + " 270L" + X(24) + " 420", "#ffffff", 4, 0.2) + St("M" + X(nk + 22) + " 290L" + X(20) + " 418", k.mdd, 3, 0.2) + "</g>" + St(lp, k.mdd, 1.5, 0.5) + St("M" + X(nk + 34) + " 267L" + X(nk + 25) + " 282L" + X(22) + " 424", k.mdd, 1.4, 0.55) + St("M" + X(nk + 31) + " 268L" + X(nk + 8) + " 246", "#ffffff", 1, 0.3) +
        St("M" + X(nk + 26) + " 285L" + X(23) + " 421", "#ffffff", 1, 0.3, " stroke-dasharray='3 3'");
    });
    // taschini a patta, taschino sul petto, bottone, polsini
    var p0 = B.hp * 0.42, p1 = B.hp * 0.9;
    [-1, 1].forEach(function (l) {
      var X = function (v) { return n1(C + l * v); };
      s += K.Pa("M" + X(p1) + " 488L" + X(p0) + " 484L" + X(p0) + " 498L" + X(p1) + " 502Z", K.mix(mg, "#000000", 0.12), " stroke='" + k.mdd + "' stroke-width='1.2' stroke-opacity='.5' stroke-linejoin='round'") + St("M" + X(p1) + " 489L" + X(p0) + " 485", "#ffffff", 1.2, 0.3) + St("M" + X(p1 - 2) + " 503L" + X(p0 + 2) + " 499", "#000000", 3, 0.2);
    });
    if (K.m) s += St("M" + (C + B.ch * 0.55 - 12) + " 372L" + (C + B.ch * 0.55 + 12) + " 366", k.mdd, 2.4, 0.6) + St("M" + (C + B.ch * 0.55 - 12) + " 370L" + (C + B.ch * 0.55 + 12) + " 364", "#ffffff", 1.1, 0.3) + K.Pa("M" + (C + B.ch * 0.55 - 8) + " 369L" + (C + B.ch * 0.55 - 4) + " 360L" + (C + B.ch * 0.55 + 2) + " 367Z", "#f4f5f9");
    s += bottone(K, C - 26, 438, 4, K.mix(mg, "#000000", 0.35));
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1), w = f.w + 7, px = -f.dy, py = f.dx;
      var sm = St("M" + n1(f.x - f.dx * 18 - px * w * 0.5) + " " + n1(f.y - f.dy * 18 - py * w * 0.5) + "L" + n1(f.x - f.dx * 18 + px * w * 0.5) + " " + n1(f.y - f.dy * 18 + py * w * 0.5), k.mdd, 1.4, 0.5);
      for (var j = 0; j < 3; j++) sm += bottone(K, f.x - f.dx * (8 + j * 0) + px * (j - 1) * w * 0.26, f.y - f.dy * 8 + py * (j - 1) * w * 0.26, 2.5, K.mix(mg, "#000000", 0.3));
      s += K.suManica(l, sm);
    });
    return { corpo: s };
  });

  // =========================================================
  //  BOMBER (cerniera e costine)
  // =========================================================
  A.pezzo("capo", "bomber", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", rib = K.mix(mg, k.mdd, 0.3);
    var T = K.busto({ agio: 6, orlo: 506, scollo: { tipo: "v", prof: 30, larg: 6 }, svasa: -5, curvaOrlo: 5, pancia: B.pancia ? 8 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 7, forza: 1.05, pol: [20, rib, k.mdd] });
    var q = ombra(K, k, { q: 1.4, noPieghe: false });
    q += St("M" + (C - B.ch + 8) + " 330C" + (C - B.ch + 12) + " 360 " + (C - B.ch + 14) + " 400 " + (C - B.ch + 8) + " 440", "#ffffff", 7, 0.1) + St("M" + (C - B.ch + 20) + " 340C" + (C - B.ch + 22) + " 370 " + (C - B.ch + 24) + " 410 " + (C - B.ch + 20) + " 450", "#ffffff", 2.4, 0.2);
    q += K.El(C + 52, 430, 24, 80, K.soft("#000000", 0.28));
    // tasche a zip oblique
    [-1, 1].forEach(function (l) {
      var d = "M" + (C + l * (B.wt - 2)) + " 432L" + (C + l * 32) + " 458";
      q += St(d, "#000000", 4.6, 0.7) + St(d, "#b8bcc4", 2.2, 0.85, " stroke-dasharray='1.6 1.6'") + K.Pa("M" + (C + l * (B.wt - 8)) + " 430L" + (C + l * (B.wt + 6)) + " 428L" + (C + l * (B.wt + 6)) + " 440Z", k.md, " opacity='.7'");
    });
    q += costineOrlo(K, k, 506, 24, rib);
    s += veste(K, mg, T, M, inT(K, T, q)).svg + M.pol;
    s += cerniera(K, C, 296, 504) + tiretta(K, C, 292);
    // colletto a costine rialzato (a V)
    var cd = "M" + (C - nk - 6) + " 232C" + (C - nk - 12) + " 256 " + (C - nk * 0.5) + " 280 " + (C - 2) + " 300L" + (C + 2) + " 300C" + (C + nk * 0.5) + " 280 " + (C + nk + 12) + " 256 " + (C + nk + 6) + " 232";
    var il = linea(K, cd);
    s += usa(il, tratto("#000000", 14, 0.25)) + usa(il, tratto(rib, 12.5, 1)) + usa(il, tratto("#ffffff", 2, 0.22)) + St("M" + (C - nk + 1) + " 236C" + (C - nk - 3) + " 256 " + (C - nk * 0.4) + " 276 " + (C - 4) + " 294", k.mdd, 1.6, 0.5) + St("M" + (C + nk - 1) + " 236C" + (C + nk + 3) + " 256 " + (C + nk * 0.4) + " 276 " + (C + 4) + " 294", k.mdd, 1.6, 0.5);
    var tk = pattern(K, 4.4, 4.4, "<path d='M2.2 0L2.2 4.4' stroke='#000' stroke-width='1.2' opacity='.3'/>");
    s += usa(il, tratto(tk, 11.5, 1));
    return { corpo: s };
  });

  // =========================================================
  //  MAGLIONE (a maglia, con costine e treccia)
  // =========================================================
  A.pezzo("capo", "maglione", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", rib = K.mix(mg, k.mdd, 0.18);
    var T = K.busto({ agio: 4, orlo: 520, scollo: { prof: 14, larg: 7 }, svasa: -2, pancia: B.pancia ? 8 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 4, pol: [20, rib, k.mdd] });
    var trama = pattern(K, 9, 10, "<path d='M0.5 1L4.5 8L8.5 1' fill='none' stroke='#1a0a10' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' opacity='.2'/><path d='M1.5 0.4L4.5 6L7.5 0.4' fill='none' stroke='#ffffff' stroke-width='1' stroke-linecap='round' opacity='.17'/>");
    var q = ombra(K, k, { q: 1.2 });
    // treccia al centro
    var tr = "";
    for (var y = 300; y < 480; y += 34) tr += "M" + (C - 15) + " " + y + "C" + (C - 15) + " " + (y + 10) + " " + (C + 3) + " " + (y + 10) + " " + (C + 3) + " " + (y + 17) + "C" + (C + 3) + " " + (y + 26) + " " + (C - 15) + " " + (y + 26) + " " + (C - 15) + " " + (y + 34) + "M" + (C + 15) + " " + y + "C" + (C + 15) + " " + (y + 10) + " " + (C - 3) + " " + (y + 10) + " " + (C - 3) + " " + (y + 17) + "C" + (C - 3) + " " + (y + 26) + " " + (C + 15) + " " + (y + 26) + " " + (C + 15) + " " + (y + 34);
    var it = linea(K, tr);
    q += usa(it, tratto("#1a0a10", 5, 0.2)) + usa(it, tratto(K.chiaro(mg, 0.45), 3.2, 0.5)) + usa(it, tratto("#ffffff", 1, 0.25));
    q += St("M" + (C - 24) + " 296L" + (C - 24) + " 490", k.mdd, 1.6, 0.3) + St("M" + (C + 24) + " 296L" + (C + 24) + " 490", k.mdd, 1.6, 0.3);
    q += costineOrlo(K, k, 520, 26, rib);
    var tram = ""; M.ds.forEach(function (d, i) { tram += telaManica(K, i ? 1 : -1, d, trama); });
    s += veste(K, mg, T, M, inT(K, T, tela(trama)) + tram + inT(K, T, q)).svg + M.pol;
    s += stampa(K, T);
    // collo a costine spesse
    var cd = "M" + (C - nk - 5) + " 238C" + (C - nk + 2) + " 262 " + (C + nk - 2) + " 262 " + (C + nk + 5) + " 238";
    var ic = linea(K, cd);
    s += usa(ic, tratto("#000000", 14, 0.18)) + usa(ic, tratto(rib, 12, 1)) + usa(ic, tratto(costine(K), 11, 1)) + St("M" + (C - nk - 2) + " 235C" + (C - nk + 5) + " 256 " + (C + nk - 5) + " 256 " + (C + nk + 2) + " 235", "#ffffff", 1.6, 0.4);
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
    var tramM = ""; M.ds.forEach(function (d, i) { tramM += telaManica(K, i ? 1 : -1, d, trama); });
    s += veste(K, mg, T, M, tramM + inT(K, T, tela(trama) + ombra(K, k, { q: 1 }) + St("M" + (C - B.hp + 2) + " 502C" + (C - 20) + " 510 " + (C + 20) + " 510 " + (C + B.hp - 2) + " 502", k.mdd, 2, 0.3))).svg + M.pol;
    s += stampa(K, T);
    // il collo alto a rotolo (due risvolti)
    var w = nk + 8, cl = "M" + (C - w - 1) + " 258C" + (C - w - 3) + " 244 " + (C - w) + " 230 " + (C - w + 4) + " 224C" + (C - w + 12) + " 219 " + (C + w - 12) + " 219 " + (C + w - 4) + " 224C" + (C + w) + " 230 " + (C + w + 3) + " 244 " + (C + w + 1) + " 258C" + (C + w - 4) + " 268 " + (C - w + 4) + " 268 " + (C - w - 1) + " 258Z";
    s += K.Pa(cl, cilU(K, mg, C - w - 3, C + w + 3, 0.9)) + "<g clip-path='" + K.clip(cl) + "'>" + tela(trama) +
      St("M" + (C - w - 4) + " 241C" + (C - w + 10) + " 249 " + (C + w - 10) + " 249 " + (C + w + 4) + " 241", k.mdd, 2.4, 0.4) + St("M" + (C - w - 4) + " 244C" + (C - w + 10) + " 252 " + (C + w - 10) + " 252 " + (C + w + 4) + " 244", "#ffffff", 1.2, 0.3) +
      K.El(C - w * 0.4, 236, 12, 14, K.soft("#ffffff", 0.2)) + K.El(C, 262, w + 4, 8, K.soft(k.mdd, 0.45)) + K.El(C, 224, w, 6, K.soft(k.mdd, 0.3)) + "</g>" +
      St("M" + (C - w - 1) + " 258C" + (C - w + 4) + " 268 " + (C + w - 4) + " 268 " + (C + w + 1) + " 258", k.mdd, 1.6, 0.5);
    return { corpo: s };
  });

  // =========================================================
  //  COLLO / POLO
  // =========================================================
  A.pezzo("capo", "polo", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", ct = contrasto(K, mg), fascia = K.lum(mg) > 0.6 ? K.mix(mg, k.mdd, 0.55) : K.mix(mg, "#ffffff", 0.7);
    var T = K.busto({ agio: 6, orlo: 514, scollo: { tipo: "v", prof: 26, larg: 3 }, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 0.32, agio: 9, pol: [13, fascia, k.mdd, { liscio: true }] });
    var piq = pattern(K, 4, 4, "<circle cx='1' cy='1' r='.8' fill='#1a0a10' opacity='.1'/><circle cx='3' cy='3' r='.8' fill='#1a0a10' opacity='.1'/>");
    var q = tela(piq) + ombra(K, k, { q: 1 });
    // la patta con i bottoni
    q += K.Pa("M" + (C - 8) + " 262L" + (C + 8) + " 262L" + (C + 8) + " 332L" + (C - 8) + " 332Z", K.mix(mg, "#ffffff", 0.08)) + St("M" + (C - 8) + " 264L" + (C - 8) + " 332", k.mdd, 1.3, 0.45) + St("M" + (C + 8) + " 264L" + (C + 8) + " 332", k.mdd, 1.3, 0.5) + St("M" + (C - 8) + " 332L" + (C + 8) + " 332", k.mdd, 1.4, 0.5);
    q += bottone(K, C, 286, 3.4, K.chiaro(mg, 0.6)) + bottone(K, C, 312, 3.4, K.chiaro(mg, 0.6));
    q += St("M" + (C - B.hp + 2) + " 506C" + (C - 20) + " 514 " + (C + 20) + " 514 " + (C + B.hp - 2) + " 506", k.mdd, 2, 0.3) + K.Pa("M" + (C - 200) + " 496Q" + C + " 504 " + (C + 200) + " 496L" + (C + 200) + " 540L" + (C - 200) + " 540Z", k.md, " opacity='.16'");
    s += veste(K, mg, T, M, inT(K, T, q)).svg + M.pol + stampa(K, T);
    s += colletto(K, { mg: mg, mdd: k.mdd }, { fill: K.mix(mg, "#ffffff", 0.06), ty: 284, tw: 12, top: 236, cy: 262 });
    return { corpo: s };
  });

  // =========================================================
  //  CANOTTA
  // =========================================================
  A.pezzo("capo", "canotta", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "";
    // giro manica aderente: la spallina sta sulla linea della spalla, poi il giro manica scende concavo fino all'ascella
    var G = K.G, e = 4, nl = nk + 8, ny = 240, Tp = [G.Jd - G.rc * 0.15, G.Jy - G.rc], F0 = [nk + 13, 249];
    var xS = G.Jd - G.rc * 0.42, yS = F0[1] + (Tp[1] - F0[1]) * Math.max(0, Math.min(1, (xS - F0[0]) / (Tp[0] - F0[0]))) - 2.5;
    var xa = B.ap + e - 2, ya = Y.ascella + 8, ex = G.Jd - G.rc * 0.62;
    var Rr = [[nl, ny], [nl + (xS - nl) * 0.5, (ny + yS) / 2 - 2], [xS, yS], [ex + 3, G.Jy - 8], [ex, G.Jy + 14], [(ex + xa) / 2 - 2, (G.Jy + ya) / 2 + 12], [xa, ya]];
    Rr.push([B.ch + e, Y.petto], [B.wt + e * 1.1 + (B.pancia ? 6 : 0), Y.vita]);
    var xs = function (y, x0, y0, x1, y1) { return x0 + (x1 - x0) * (y - y0) / (y1 - y0); };
    Rr.push([xs(512, B.wt + e * 1.1 + (B.pancia ? 6 : 0), Y.vita, B.hp + e, Y.fianchi), 512]);
    var Ra = Rr.map(function (p) { return [C + p[0], p[1]]; }), La = Rr.map(function (p) { return [C - p[0], p[1]]; }).reverse();
    var T = "M" + n1(C - nl) + " " + ny + "C" + n1(C - nl + 2) + " " + (ny + 36) + " " + n1(C - nl * 0.45) + " " + (ny + 40) + " " + C + " " + (ny + 40) + "C" + n1(C + nl * 0.45) + " " + (ny + 40) + " " + n1(C + nl - 2) + " " + (ny + 36) + " " + n1(C + nl) + " " + ny + K.cr(Ra) + "Q" + C + " 518 " + n1(La[0][0]) + " " + n1(La[0][1]) + K.cr(La) + "Z";
    s += veste(K, mg, T, null, inT(K, T, ombra(K, k, { q: 1 }) + St("M" + (C - B.hp + 2) + " 504C" + (C - 20) + " 512 " + (C + 20) + " 512 " + (C + B.hp - 2) + " 504", k.mdd, 2, 0.35)) + bordoS(K, T, k, 7)).svg + stampa(K, T);
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
    var q = tela(rete) + ombra(K, k, { q: 1 });
    // fasce laterali a contrasto
    q += St("M" + (C - B.ap - 4) + " 336C" + (C - B.ch - 5) + " 370 " + (C - B.wt - 5) + " 440 " + (C - B.hp - 5) + " 520", ct, 9, 0.22) + St("M" + (C + B.ap + 4) + " 336C" + (C + B.ch + 5) + " 370 " + (C + B.wt + 5) + " 440 " + (C + B.hp + 5) + " 520", ct, 9, 0.22);
    // numero sul petto e stemma
    q += "<text x='" + C + "' y='" + (Y.petto + 62) + "' text-anchor='middle' font-family='Arial Black,Arial,sans-serif' font-weight='900' font-size='60' fill='" + ct + "' opacity='.92'>10</text>";
    q += K.Pa("M" + (C + B.ch * 0.42 - 8) + " 346L" + (C + B.ch * 0.42 + 8) + " 346L" + (C + B.ch * 0.42 + 8) + " 358C" + (C + B.ch * 0.42 + 8) + " 366 " + (C + B.ch * 0.42) + " 370 " + (C + B.ch * 0.42) + " 370C" + (C + B.ch * 0.42) + " 370 " + (C + B.ch * 0.42 - 8) + " 366 " + (C + B.ch * 0.42 - 8) + " 358Z", ct, " opacity='.88'");
    q += St("M" + (C - B.hp + 2) + " 506C" + (C - 20) + " 514 " + (C + 20) + " 514 " + (C + B.hp - 2) + " 506", k.mdd, 2, 0.3);
    s += veste(K, mg, T, M, inT(K, T, q)).svg + M.pol;
    // colletto a V a contrasto
    var v = "M" + (C - nk - 5) + " 238L" + C + " 276L" + (C + nk + 5) + " 238";
    var iv = linea(K, v);
    s += usa(iv, tratto("#000000", 9.5, 0.2)) + usa(iv, tratto(ct, 8, 1)) + St("M" + (C - nk - 4) + " 236L" + C + " 273", "#ffffff", 1.2, 0.4);
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 0.34);
      s += K.suManica(l, St("M" + n1(f.x - f.dx * 20 - f.dy * -(f.w + 8) * 0.5) + " " + n1(f.y - f.dy * 20 + f.dx * -(f.w + 8) * 0.5) + "L" + n1(f.x - f.dx * 20 - f.dy * (f.w + 8) * 0.5) + " " + n1(f.y - f.dy * 20 + f.dx * (f.w + 8) * 0.5), ct, 3, 0.9));
    });
    return { corpo: s };
  });

  // =========================================================
  //  GIACCA DELLA TUTA (cerniera, due righe sulle maniche)
  // =========================================================
  A.pezzo("capo", "sportiva", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", ct = contrasto(K, mg), rib = K.mix(mg, k.mdd, 0.22);
    var T = K.busto({ agio: 6, orlo: 514, scollo: { tipo: "v", prof: 22, larg: 5 }, svasa: -2, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 6, pol: [15, rib, k.mdd] });
    // righe lungo le maniche (sul lato esterno) e sul fianco: dentro la stoffa, seguono il braccio
    var righe = "";
    [-1, 1].forEach(function (l, i) {
      var N = K.BR[l].nodi, off = function (t) { return N.map(function (q, j) { var a = N[Math.max(0, j - 1)], b = N[Math.min(N.length - 1, j + 1)], dx = b[0] - a[0], dy = b[1] - a[1], ln = Math.hypot(dx, dy) || 1, nx = -dy / ln, ny = dx / ln; if (nx * l < 0) { nx = -nx; ny = -ny; } return [q[0] + nx * q[2] * t, q[1] + ny * q[2] * t, 4]; }); };
      righe += K.suManica(l, "<g clip-path='" + K.clip(M.ds[i]) + "'>" + K.Pa(K.limb(off(0.18).slice(1)), ct, " opacity='.95'") + K.Pa(K.limb(off(0.36).slice(1)), ct, " opacity='.95'") + "</g>");
    });
    var q = ombra(K, k, { q: 1.1 });
    q += St("M" + (C - B.ap - 2) + " 340C" + (C - B.ch - 2) + " 372 " + (C - B.wt - 2) + " 440 " + (C - B.hp - 2) + " 516", ct, 3, 0.9) + St("M" + (C + B.ap + 2) + " 340C" + (C + B.ch + 2) + " 372 " + (C + B.wt + 2) + " 440 " + (C + B.hp + 2) + " 516", ct, 3, 0.9);
    [-1, 1].forEach(function (l) { var d = "M" + (C + l * (B.wt - 4)) + " 440L" + (C + l * 30) + " 462"; q += St(d, "#000000", 4.2, 0.55) + St(d, "#aeb3bc", 2, 0.8, " stroke-dasharray='1.6 1.6'"); });
    q += costineOrlo(K, k, 514, 14, rib);
    s += veste(K, mg, T, M, righe + inT(K, T, q)).svg + M.pol;
    s += cerniera(K, C, 290, 512) + tiretta(K, C, 286);
    // colletto alto aperto
    var cd = "M" + (C - nk - 6) + " 230C" + (C - nk - 11) + " 252 " + (C - nk * 0.6) + " 270 " + (C - 2) + " 290L" + (C + 2) + " 290C" + (C + nk * 0.6) + " 270 " + (C + nk + 11) + " 252 " + (C + nk + 6) + " 230";
    var ic = linea(K, cd);
    s += usa(ic, tratto("#000000", 13, 0.22)) + usa(ic, tratto(rib, 11.5, 1)) + usa(ic, tratto(ct, 1.8, 0.9, " transform='translate(0 -1)'")) + usa(ic, tratto("#ffffff", 1.4, 0.25, " transform='translate(0 4)'"));
    return { corpo: s };
  });

  // =========================================================
  //  CROP (donna): maglietta corta, pancia scoperta
  // =========================================================
  A.pezzo("capo", "crop", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, s = "";
    var T = K.busto({ agio: 4, orlo: 414, scollo: { prof: 16, larg: 4 }, curvaOrlo: 5 });
    var M = maniche(K, mg, { lung: 0.3, agio: 7, pol: [9, K.mix(mg, k.mdd, 0.08), k.mdd, { liscio: true }] });
    s += veste(K, mg, T, M, inT(K, T, ombra(K, k, { q: 0.8, noPieghe: true, noPancia: true }) +
      St("M" + (C - B.ch + 2) + " 404C" + (C - 20) + " 412 " + (C + 20) + " 412 " + (C + B.ch - 2) + " 404", k.mdd, 2, 0.4) + K.Pa("M" + (C - 200) + " 400Q" + C + " 408 " + (C + 200) + " 400L" + (C + 200) + " 440L" + (C - 200) + " 440Z", k.md, " opacity='.22'"))).svg + M.pol + stampa(K, T);
    var nk = B.nk;
    s += St("M" + (C - nk - 5) + " 241C" + (C - nk + 2) + " 263 " + (C + nk - 2) + " 263 " + (C + nk + 5) + " 241", K.mix(mg, "#000000", 0.22), 7, 0.95) + St("M" + (C - nk - 3) + " 238C" + (C - nk + 4) + " 259 " + (C + nk - 4) + " 259 " + (C + nk + 3) + " 238", K.chiaro(mg, 0.35), 1.8, 0.45);
    return { corpo: s };
  });

  // =========================================================
  //  TOP (donna): senza spalline, spalle e pancia scoperte
  // =========================================================
  A.pezzo("capo", "top", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", bs = B.seno || 1, G = K.G;
    var wx = function (y) { return G.largTronco(y) + 3; };            // la stoffa segue il busto: mezza larghezza a quella quota
    var yT = 346, yB = 438;
    // bordo alto a cuore (due curve sopra il seno) e fianchi che seguono il corpo
    var topPts = [[C - wx(yT), yT + 3], [C - wx(yT) * 0.62, yT - 8 - 2 * bs], [C - 26, yT - 12 - 3 * bs], [C - 8, yT + 2], [C, yT + 8], [C + 8, yT + 2], [C + 26, yT - 12 - 3 * bs], [C + wx(yT) * 0.62, yT - 8 - 2 * bs], [C + wx(yT), yT + 3]];
    var bord = K.liscio(topPts), ib = linea(K, bord);
    var fianco = function (l) { var o = []; for (var y = yT + 3; y <= yB; y += 18) o.push([C + l * wx(y), y]); o.push([C + l * wx(yB), yB]); return o; };
    var R = fianco(1), Lf = fianco(-1).reverse();
    var d = bord + K.cr(R) + "Q" + C + " " + (yB + 9) + " " + n1(Lf[0][0]) + " " + n1(Lf[0][1]) + K.cr(Lf) + "Z";
    // ombra morbida sulla pelle sopra il bordo (prima della stoffa) e sotto l'orlo
    s += usa(ib, tratto(K.skDD, 12, 0.07, " transform='translate(0 -3)'")) + usa(ib, tratto(K.skDD, 7, 0.1, " transform='translate(0 -2)'")) + usa(ib, tratto(K.skDD, 3.4, 0.16, " transform='translate(0 -1)'"));
    s += St("M" + n1(C - wx(yB)) + " " + (yB + 1) + "Q" + C + " " + (yB + 10) + " " + n1(C + wx(yB)) + " " + (yB + 1), K.skDD, 10, 0.08, " transform='translate(0 4)'") + St("M" + n1(C - wx(yB)) + " " + (yB + 1) + "Q" + C + " " + (yB + 10) + " " + n1(C + wx(yB)) + " " + (yB + 1), K.skDD, 5, 0.13, " transform='translate(0 3)'");
    // spalline sottili
    var sp = [];
    [-1, 1].forEach(function (l) {
      var a = [C + l * 27, yT - 12 - 3 * bs], b = [C + l * (nk + 26), 262], dd = "M" + n1(a[0]) + " " + n1(a[1]) + "C" + n1(a[0] + l * 1) + " " + n1(a[1] - 30) + " " + n1(b[0] + l * 3) + " " + n1(b[1] + 34) + " " + n1(b[0]) + " " + n1(b[1]);
      sp.push(dd);
    });
    sp.forEach(function (dd, i) {
      var l = i ? 1 : -1;
      var id = linea(K, dd);
      s += usa(id, tratto(K.skDD, 7, 0.1, " transform='translate(" + (l * 1.5) + " 2)'")) + usa(id, tratto(K.scuro(mg, 0.45), 5.2, 1)) + usa(id, tratto(mg, 3.8, 1)) + usa(id, tratto("#ffffff", 1, 0.3, " transform='translate(" + (l * -1) + " 0)'"));
    });
    var q = ombra(K, k, { q: 0.7, noPieghe: true, noPancia: true });
    // la stoffa si tende sul seno e si arriccia al centro; ombra dove il corpo gira di lato
    q += K.El(C - wx(390) + 4, 392, 16, 46, K.soft(k.mdd, 0.1)) + K.El(C + wx(390) - 4, 392, 18, 48, K.soft(k.mdd, 0.28)) + K.El(C - 30 * bs, yT + 18, 22, 14, K.soft("#ffffff", 0.2));
    for (var i = -3; i <= 3; i++) { if (!i) continue; var x0 = C + i * 5; q += St("M" + x0 + " 362C" + (x0 + i * 6) + " 384 " + (C + i * 10) + " 410 " + (C + i * 12) + " 436", k.mdd, 2.2, 0.16) + St("M" + (x0 + 2) + " 364C" + (x0 + i * 6 + 2) + " 386 " + (C + i * 10 + 2) + " 410 " + (C + i * 12 + 2) + " 436", "#ffffff", 1, 0.14); }
    q += K.Pa("M" + (C - 200) + " 424Q" + C + " 432 " + (C + 200) + " 424L" + (C + 200) + " 460L" + (C - 200) + " 460Z", k.md, " opacity='.2'");
    // bordo alto con spessore: orlo ripiegato (una striscia piu scura sotto e un filo di luce sopra)
    q += usa(ib, tratto(k.mdd, 11, 0.22, " transform='translate(0 4)'")) + usa(ib, tratto(K.mix(mg, "#000000", 0.1), 7, 1, " transform='translate(0 3)'")) + usa(ib, tratto("#ffffff", 1.6, 0.34, " transform='translate(0 0.5)'"));
    s += veste(K, mg, d, null, q + bordoS(K, d, k, 4)).svg;
    s += usa(ib, tratto(k.mdd, 1.2, 0.35, " transform='translate(0 6.5)'")) + stampa(K, d);
    return { corpo: s };
  });

  // =========================================================
  //  CAMICETTA (donna): scollo a V con fiocco, maniche a sbuffo
  // =========================================================
  A.pezzo("capo", "camicetta", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "";
    var T = K.busto({ agio: 6, orlo: 526, scollo: { tipo: "v", prof: 34, larg: 4 }, svasa: 6, curvaOrlo: 9, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 8, svasa: 2, pol: [12, K.mix(mg, "#ffffff", 0.05), k.mdd, { liscio: true }] });
    var seta = pattern(K, 12, 12, "<path d='M0 6Q3 2 6 6T12 6' fill='none' stroke='#fff' stroke-width='.7' opacity='.1'/>");
    var setaM = ""; M.ds.forEach(function (d, i) { setaM += telaManica(K, i ? 1 : -1, d, seta); });
    var q = tela(seta) + ombra(K, k, { q: 1.1 });
    q += St("M" + (C - 14) + " 300C" + (C - 20) + " 360 " + (C - 28) + " 430 " + (C - 40) + " 524", k.mdd, 4, 0.1) + St("M" + (C + 22) + " 300C" + (C + 28) + " 360 " + (C + 38) + " 430 " + (C + 50) + " 524", k.mdd, 5, 0.12) + St("M" + (C - 8) + " 296L" + (C - 8) + " 520", k.mdd, 1.2, 0.25);
    q += St("M" + (C - B.hp - 4) + " 516C" + (C - 20) + " 528 " + (C + 20) + " 528 " + (C + B.hp + 4) + " 516", k.mdd, 2, 0.3);
    s += veste(K, mg, T, M, setaM + inT(K, T, q)).svg + M.pol;
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1), px = -f.dy, py = f.dx, w = f.w + 11;
      var sm = ""; for (var i = -2; i <= 2; i++) sm += St("M" + n1(f.x - f.dx * 14 + px * i * w * 0.17) + " " + n1(f.y - f.dy * 14 + py * i * w * 0.17) + "L" + n1(f.x - f.dx * 30 + px * i * w * 0.2) + " " + n1(f.y - f.dy * 30 + py * i * w * 0.2), k.mdd, 1.2, 0.26);
      s += K.suManica(l, sm);
    });
    // fiocco al collo
    var cx = C, cy = 262, col = K.mix(mg, "#ffffff", 0.08);
    [-1, 1].forEach(function (l) {
      s += K.Pa("M" + (cx + l * 5) + " " + (cy + 4) + "C" + (cx + l * 8) + " " + (cy + 34) + " " + (cx + l * 14) + " " + (cy + 58) + " " + (cx + l * 20) + " " + (cy + 72) + "L" + (cx + l * 6) + " " + (cy + 64) + "C" + (cx + l * 2) + " " + (cy + 40) + " " + (cx - l * 2) + " " + (cy + 20) + " " + (cx - l * 2) + " " + (cy + 6) + "Z", K.cil(col, 0.8)) +
        K.Pa("M" + (cx + l * 4) + " " + cy + "C" + (cx + l * 22) + " " + (cy - 18) + " " + (cx + l * 40) + " " + (cy - 12) + " " + (cx + l * 38) + " " + (cy + 4) + "C" + (cx + l * 36) + " " + (cy + 18) + " " + (cx + l * 16) + " " + (cy + 10) + " " + (cx + l * 4) + " " + cy + "Z", K.cil(col, 0.8)) +
        St("M" + (cx + l * 8) + " " + cy + "C" + (cx + l * 22) + " " + (cy - 8) + " " + (cx + l * 32) + " " + (cy - 6) + " " + (cx + l * 35) + " " + (cy + 2), k.mdd, 1.2, 0.4);
    });
    s += K.Pa("M" + (cx - 7) + " " + (cy - 6) + "C" + (cx - 7) + " " + (cy - 12) + " " + (cx + 7) + " " + (cy - 12) + " " + (cx + 7) + " " + (cy - 6) + "L" + (cx + 7) + " " + (cy + 8) + "C" + (cx + 7) + " " + (cy + 14) + " " + (cx - 7) + " " + (cy + 14) + " " + (cx - 7) + " " + (cy + 8) + "Z", K.cil(col, 0.9)) + St("M" + (cx - 3) + " " + (cy - 8) + "L" + (cx - 3) + " " + (cy + 10), "#ffffff", 1, 0.4);
    return { corpo: s };
  });

  // =========================================================
  //  CARDIGAN (aperto, maglietta chiara sotto)
  // =========================================================
  A.pezzo("capo", "cardigan", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", rib = K.mix(mg, k.mdd, 0.18), sotto = K.lum(mg) > 0.75 ? "#d7dae6" : "#f6f6fa";
    var T = K.busto({ agio: 6, orlo: 526, scollo: { tipo: "v", prof: 44, larg: 5 }, svasa: -1, curvaOrlo: 8, pancia: B.pancia ? 7 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 6, pol: [17, rib, k.mdd] });
    var trama = pattern(K, 7, 8, "<path d='M0.5 .8L3.5 6.5L6.5 .8' fill='none' stroke='#1a0a10' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' opacity='.14'/>");
    // la maglietta di sotto nell'apertura
    var ie = [[nk + 6, 244], [nk + 12, 276], [28, 330], [24, 400], [24, 470], [24, 524]];
    var L = ie.map(function (q) { return [C - q[0], q[1]]; }), R = ie.map(function (q) { return [C + q[0], q[1]]; }), Rr = R.slice().reverse();
    var cd = K.liscio(L) + "Q" + C + " 534 " + n1(Rr[0][0]) + " " + n1(Rr[0][1]) + K.cr(Rr) + "Z";
    var tramM = ""; M.ds.forEach(function (d, i) { tramM += telaManica(K, i ? 1 : -1, d, trama); });
    s += veste(K, mg, T, M, tramM + inT(K, T, tela(trama) + ombra(K, k, { q: 1.1 }))).svg + M.pol;
    s += K.Pa(cd, cilU(K, sotto, C - 40, C + 40, 0.7)) + "<g clip-path='" + K.clip(cd) + "'>" + St(K.liscio(L), k.mdd, 12, 0.45) + St(K.liscio(R), k.mdd, 12, 0.5) + K.El(C, 262, 22, 12, K.soft("#000000", 0.2)) + "</g>";
    s += St("M" + (C - nk - 3) + " 240C" + (C - nk) + " 262 " + (C + nk) + " 262 " + (C + nk + 3) + " 240", K.mix(sotto, "#000000", 0.15), 7, 0.95);
    // bande dei bottoni a costine lungo i bordi
    [-1, 1].forEach(function (l) {
      var X = function (q) { return [C + l * q[0], q[1]]; };
      var band = ie.map(function (q) { return [C + l * (q[0] + 8), q[1]]; });
      var pb = K.limb(band.map(function (q) { return [q[0], q[1], 14]; }));
      s += K.Pa(pb, cilU(K, rib, C + l * 24 - 18, C + l * 24 + 18, 0.8)) + "<g clip-path='" + K.clip(pb) + "'>" + tela(pattern(K, 10, 5, "<rect y='2.2' width='10' height='1.5' fill='#1a0a10' opacity='.24'/>")) + "</g>" + St(K.liscio(ie.map(X)), k.mdd, 1.6, 0.5);
      for (var i = 0; i < 4; i++) { var by = 340 + i * 42, bx = C + l * 32; if (l < 0) s += bottone(K, bx, by, 3.6, K.mix(mg, "#ffffff", 0.3)); }
    });
    s += inT(K, T, costineOrlo(K, k, 526, 20, rib));
    // tasche
    [-1, 1].forEach(function (l) { var X = function (v) { return n1(C + l * v); }; s += K.Pa("M" + X(B.hp * 0.9) + " 472L" + X(B.hp * 0.45) + " 470L" + X(B.hp * 0.45) + " 500L" + X(B.hp * 0.9) + " 502Z", K.mix(mg, "#000000", 0.07), " opacity='.45'") + St("M" + X(B.hp * 0.9) + " 472L" + X(B.hp * 0.45) + " 470L" + X(B.hp * 0.45) + " 500L" + X(B.hp * 0.9) + " 502Z", k.mdd, 1.2, 0.4, " stroke-dasharray='3 2.5'"); });
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
    var q = ombra(K, k, { q: 1.1, noPieghe: true }) + St("M" + (C - B.ap + 4) + " 296C" + (C - B.ch + 6) + " 330 " + (C - B.ch + 8) + " 400 " + (C - B.wt + 6) + " 470", "#ffffff", 4, 0.12);
    var lin = pattern(K, 5, 5, "<path d='M0 5L5 0' stroke='#fff' stroke-width='.6' opacity='.1'/>");
    q += tela(lin) + St("M" + (C - B.wt) + " 452C" + (C - 30) + " 470 " + (C + 30) + " 470 " + (C + B.wt) + " 452", k.mdd, 1.5, 0.2) + bordoS(K, T, k, 6);
    s += veste(K, mg, T, null, q).svg;
    // bottoni, taschini e cordonatura del V
    for (var i = 0; i < 5; i++) s += bottone(K, C, 366 + i * 30, 3.4, K.mix(mg, "#000000", 0.45)) ;
    var pw = B.hp * 0.5;
    [-1, 1].forEach(function (l) { s += St("M" + n1(C + l * (pw + 20)) + " 464L" + n1(C + l * (pw - 6)) + " 462", "#000000", 3, 0.4) + St("M" + n1(C + l * (pw + 20)) + " 462.5L" + n1(C + l * (pw - 6)) + " 460.5", "#ffffff", 1, 0.25); });
    var vL = "M" + (C - nk - 4 - 22) + " 244L" + C + " " + (240 + 104), vR = "M" + (C + nk + 4 + 22) + " 244L" + C + " " + (240 + 104);
    s += cam.collar;
    return { corpo: s };
  });

  // =========================================================
  //  COPRICAPO LUNGO: CAPPOTTO
  // =========================================================
  A.pezzo("capo", "cappotto", function (K) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", cam = K.lum(mg) > 0.8 ? "#cdd5ea" : "#f1f2f7", kc = colori(K, cam);
    var T = K.busto({ agio: 6, orlo: 742, scollo: { tipo: "v", prof: 80, larg: 6 }, svasa: K.m ? -13 : 3, curvaOrlo: K.m ? 4 : 10, pancia: B.pancia ? 6 : 0 });
    var M = maniche(K, mg, { lung: 1, agio: 6 });
    var lana = pattern(K, 13, 13, "<circle cx='3' cy='3' r='.9' fill='#000' opacity='.05'/><circle cx='9.5' cy='9.5' r='.9' fill='#fff' opacity='.05'/>");
    var q = tela(lana) + ombra(K, k, { q: 1.1, noPieghe: true });
    if (K.m) {   // maschi: cappotto dritto, due ombre lunghe e lo spacco dietro, niente gonna a campana
      q += K.El(C + B.hp - 6, 640, 18, 120, K.soft(k.mdd, 0.3)) + K.El(C - B.hp + 10, 620, 14, 110, K.soft("#ffffff", 0.07)) + K.El(C, 640, B.hp - 16, 90, K.soft(k.mdd, 0.07));
      q += St("M" + (C - B.hp - 2) + " 566L" + (C - B.hp - 6) + " 736", k.mdd, 2, 0.22) + St("M" + (C + B.hp + 2) + " 566L" + (C + B.hp + 6) + " 736", k.mdd, 2, 0.28);
      q += St("M" + (C - 40) + " 540C" + (C - 44) + " 600 " + (C - 46) + " 680 " + (C - 50) + " 738", k.mdd, 4, 0.08) + St("M" + (C + 40) + " 540C" + (C + 44) + " 600 " + (C + 46) + " 680 " + (C + 50) + " 738", k.mdd, 4, 0.1);
    } else {
      q += pieghe(K, k, 530, 742, 5, 0.9);
      q += K.El(C + 60, 620, 40, 140, K.soft("#000000", 0.14)) + K.El(C - 60, 600, 24, 120, K.soft("#ffffff", 0.07));
    }
    // il doppio petto: bordo che si sovrappone e bottoni
    q += St("M" + (C - 11) + " 372L" + (C - 11) + " 742", k.mdd, 5, 0.12) + St("M" + (C + 12) + " 372C" + (C + 12) + " 520 " + (C + 12) + " 640 " + (C + 12) + " 742", "#000000", 3, 0.28) + St("M" + (C + 10) + " 372L" + (C + 10) + " 742", "#ffffff", 1.1, 0.22);
    // tasche con patta
    [-1, 1].forEach(function (l) { var X = function (v) { return n1(C + l * v); }; q += K.Pa("M" + X(B.hp * 0.86) + " 560L" + X(B.hp * 0.3) + " 556L" + X(B.hp * 0.3) + " 580L" + X(B.hp * 0.86) + " 585Z", K.mix(mg, "#000000", 0.1), " opacity='.85'") + St("M" + X(B.hp * 0.86) + " 561L" + X(B.hp * 0.3) + " 557", "#ffffff", 1.2, 0.28) + St("M" + X(B.hp * 0.84) + " 588L" + X(B.hp * 0.32) + " 583", "#000000", 4, 0.22); });
    q += St("M" + (C - B.hp - 18) + " 736C" + (C - 40) + " 752 " + (C + 40) + " 752 " + (C + B.hp + 18) + " 736", k.mdd, 3, 0.3);
    var lanaM = ""; M.ds.forEach(function (d, i) { lanaM += telaManica(K, i ? 1 : -1, d, lana); });
    s += veste(K, mg, T, M, lanaM + inT(K, T, q)).svg;
    // la camicia nel V
    var inn = "M" + (C - nk - 3) + " 242L" + C + " 330L" + (C + nk + 3) + " 242Z";
    s += K.Pa(inn, cilU(K, cam, C - 40, C + 40, 0.7)) + "<g clip-path='" + K.clip(inn) + "'>" + K.El(C, 250, nk + 6, 14, K.soft(kc.mdd, 0.4)) + "</g>";
    s += St("M" + (C - nk - 3) + " 240C" + (C - nk) + " 258 " + (C + nk) + " 258 " + (C + nk + 3) + " 240", "#ffffff", 8, 0.95);
    // revers grandi
    [-1, 1].forEach(function (l) {
      var X = function (v) { return n1(C + l * v); };
      var lp = "M" + X(nk + 2) + " 238L" + X(nk + 38) + " 268L" + X(nk + 30) + " 288L" + X(24) + " 376L" + X(11) + " 372L" + X(4) + " 332C" + X(4) + " 296 " + X(nk * 0.6) + " 270 " + X(nk + 2) + " 238Z";
      s += K.El(C + l * (nk + 14), 300, 22, 34, K.soft("#000000", 0.35));
      s += K.Pa(lp, K.LG("vl" + (uid++), 0, 0, 1, 1, [[0, K.mix(mg, "#ffffff", l < 0 ? 0.28 : 0.14)], [0.6, mg], [1, k.md]])) + "<g clip-path='" + K.clip(lp) + "'>" + tela(lana) + St("M" + X(nk + 34) + " 272L" + X(26) + " 372", "#ffffff", 4, 0.18) + K.El(C + l * (nk + 8), 308, 12, 40, K.soft(k.mdd, 0.28)) + "</g>" +
        St("M" + X(nk + 38) + " 268L" + X(nk + 30) + " 288L" + X(24) + " 376", k.mdd, 1.5, 0.55) + St("M" + X(nk + 34) + " 268L" + X(nk + 6) + " 244", "#ffffff", 1, 0.3);
    });
    // bottoni in due file
    [372, 424, 476].forEach(function (y) { s += bottone(K, C - 22, y, 4, K.mix(mg, "#000000", 0.45)) + bottone(K, C + 24, y, 4, K.mix(mg, "#000000", 0.45)); });
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1), px = -f.dy, py = f.dx, w = f.w + 9;
      s += K.suManica(l, St("M" + n1(f.x - f.dx * 20 - px * w * 0.5) + " " + n1(f.y - f.dy * 20 - py * w * 0.5) + "L" + n1(f.x - f.dx * 20 + px * w * 0.5) + " " + n1(f.y - f.dy * 20 + py * w * 0.5), k.mdd, 1.6, 0.5) + St("M" + n1(f.x - f.dx * 3 - px * w * 0.5) + " " + n1(f.y - f.dy * 3 - py * w * 0.5) + "L" + n1(f.x - f.dx * 3 + px * w * 0.5) + " " + n1(f.y - f.dy * 3 + py * w * 0.5), "#ffffff", 1, 0.18) + bottone(K, f.x - f.dx * 12, f.y - f.dy * 12, 3.1, K.mix(mg, "#000000", 0.45)));
    });
    return { corpo: s };
  });

  // =========================================================
  //  VESTITO (donna): al ginocchio
  // =========================================================
  function abito(K, lungo) {
    var mg = K.maglia, k = colori(K, mg), C = K.C, B = K.B, Y = K.Y, nk = B.nk, s = "", ct = K.mix(mg, "#ffffff", 0.0);
    var orlo = lungo ? 942 : 742, T = K.busto(lungo ? { agio: 3, orlo: orlo, smanicato: true, spallina: 18, scollo: { tipo: "v", prof: 62, larg: 8 }, svasa: 6, curvaOrlo: 14 } : { agio: 3, orlo: orlo, scollo: { prof: 26, larg: 10 }, svasa: 8, curvaOrlo: 10, pancia: B.pancia ? 4 : 0 });
    var M = lungo ? { br: null } : maniche(K, mg, { lung: 0.28, agio: 6, pol: [8, K.mix(mg, k.mdd, 0.05), k.mdd, { liscio: true }] });
    // le gambe (nude o con i pantaloni scelti) le disegna il motore: qui solo il vestito
    var q = ombra(K, k, { q: 1, noPieghe: true });
    // il corpetto stretto e la gonna che si apre
    q += K.El(C + 66, 640, 40, 200, K.soft("#000000", 0.17)) + K.El(C - 70, 600, 22, 140, K.soft("#ffffff", 0.1)) + pieghe(K, k, 452, orlo - 6, lungo ? 8 : 6, 1.3);
    // cintura
    var cb = K.mix(mg, k.mdd, 0.45);
    q += K.Pa("M" + (C - 200) + " 438Q" + C + " 444 " + (C + 200) + " 438L" + (C + 200) + " 456Q" + C + " 462 " + (C - 200) + " 456Z", cilU(K, cb, C - B.wt - 6, C + B.wt + 6, 0.8)) + St("M" + (C - 200) + " 439.5Q" + C + " 445.5 " + (C + 200) + " 439.5", "#ffffff", 1.1, 0.3) +
      K.Pa("M" + (C - 8) + " 438L" + (C + 8) + " 438L" + (C + 8) + " 456L" + (C - 8) + " 456Z", "#d9be78", " stroke='#7a5f24' stroke-width='1.3'") + K.Pa("M" + (C - 4) + " 442L" + (C + 4) + " 442L" + (C + 4) + " 452L" + (C - 4) + " 452Z", cb);
    q += St("M" + (C - 200) + " " + (orlo - 14) + "Q" + C + " " + (orlo - 4) + " " + (C + 200) + " " + (orlo - 14), "#ffffff", 1.2, 0.35, " stroke-dasharray='3 3'") + St("M" + (C - 200) + " " + (orlo - 4) + "Q" + C + " " + (orlo + 6) + " " + (C + 200) + " " + (orlo - 4), k.mdd, 3, 0.28);
    s += veste(K, mg, T, M.br ? M : null, (lungo ? bordoS(K, T, k, 4) : "") + inT(K, T, q)).svg + (M.pol || "");
    s += stampa(K, T);
    if (!lungo) s = K.El(C, orlo + 12, B.hp + 26, 12, K.soft("#000000", 0.2)) + s;
    if (lungo) {   // spalline del vestito lungo: scollo con orlo
      s += St("M" + (C - nk - 4 - 12) + " 244L" + C + " 302L" + (C + nk + 4 + 12) + " 244", K.mix(mg, k.mdd, 0.2), 2.4, 0.9);
    }
    return { corpo: s };
  }
  A.pezzo("capo", "vestito", function (K) { return abito(K, false); });
  A.pezzo("capo", "vestitolungo", function (K) { return abito(K, true); });

  // =========================================================
  //  GREMBIULE (da cuoco, sopra una maglietta)
  // =========================================================
  A.pezzo("capo", "grembiule", function (K) {
    var C = K.C, B = K.B, Y = K.Y, nk = B.nk, base = A.maglia(K, 0.3), s = fuori(base.corpo), bianco = "#fbfbfd", k = colori(K, bianco), mg = K.maglia, tess = K.mix(mg, "#ffffff", 0.0);
    var bw = Math.min(B.ch - 14, 50), sw = Math.max(B.wt + 20, B.hp), wb = B.wt + 14;
    // bavaglino, cintura e gonna del grembiule
    var ap = "M" + (C - bw) + " 316C" + (C - bw - 2) + " 360 " + (C - B.wt - 5) + " 410 " + (C - B.wt - 6) + " 452L" + (C - wb) + " 474C" + (C - sw - 4) + " 540 " + (C - sw - 8) + " 640 " + (C - sw - 14) + " 700C" + (C - 40) + " 712 " + (C + 40) + " 712 " + (C + sw + 14) + " 700C" + (C + sw + 8) + " 640 " + (C + sw + 4) + " 540 " + (C + wb) + " 474L" + (C + B.wt + 6) + " 452C" + (C + B.wt + 5) + " 410 " + (C + bw + 2) + " 360 " + (C + bw) + " 316Z";
    // bretella al collo
    [-1, 1].forEach(function (l) {
      var d = "M" + n1(C + l * (bw - 4)) + " 322C" + n1(C + l * (nk + 12)) + " 290 " + n1(C + l * (nk + 6)) + " 262 " + n1(C + l * (nk + 2)) + " 242";
      var id = linea(K, d);
      s += usa(id, tratto("#000000", 11, 0.18)) + usa(id, tratto(K.mix(bianco, "#b9bccb", 0.3), 8.6, 1)) + usa(id, tratto("#ffffff", 2, 0.7, " transform='translate(" + (l * -2) + " 0)'"));
    });
    var pc = "#6e7390", bs = B.seno || 1;
    // ombra morbida che il grembiule fa sulla maglia e sulle gambe (fuori dal suo bordo)
    var ia = linea(K, ap);
    s += usa(ia, tratto("#000000", 9, 0.06, " transform='translate(1.5 2)'")) + usa(ia, tratto("#000000", 4.5, 0.1, " transform='translate(1 1.5)'")) + K.El(C, 712, sw + 22, 10, K.soft("#000000", 0.22));
    s += usa(ia, " fill='" + cilU(K, bianco, C - sw - 14, C + sw + 14, 0.8) + "'") + "<g clip-path='" + K.clip(ap) + "'>";
    // il corpo sotto la stoffa: petto, vita stretta, fianchi
    s += K.El(C - 30, 372, 22, 50, K.soft("#ffffff", 0.35)) + K.El(C, 330, bw, 12, K.soft(k.mdd, 0.3)) + K.El(C + sw * 0.8, 600, 30, 130, K.soft("#000000", 0.14));
    if (K.donna) s += K.El(C, 392 + 8 * bs, bw + 6, 14 * bs, K.soft(pc, 0.13)) + K.El(C - 20 * bs, 366, 24 * bs, 18 * bs, K.soft("#ffffff", 0.35));
    s += K.El(C + B.wt + 2, 420, 12, 40, K.soft(pc, 0.22)) + K.El(C - B.wt - 2, 420, 8, 36, K.soft(pc, 0.08));
    s += K.El(C, 466, wb + 8, 12, K.soft(pc, 0.28));                                  // la stoffa raccolta sopra la cintura
    // pieghe che nascono dalla vita e si aprono sulla gonna
    for (var i = -4; i <= 4; i++) {
      var x0 = C + i * wb * 0.2, x1 = C + i * (sw + 6) * 0.23, xm = (x0 + x1) / 2 + i * 3;
      s += St("M" + n1(x0) + " 478C" + n1(xm) + " 540 " + n1(x1 - i * 2) + " 640 " + n1(x1) + " 706", pc, 4.4 + (Math.abs(i) % 2) * 1.6, 0.1 + (Math.abs(i) % 3) * 0.02) +
        St("M" + n1(x0 - 2.5) + " 480C" + n1(xm - 2.5) + " 540 " + n1(x1 - i * 2 - 2.5) + " 640 " + n1(x1 - 2.5) + " 706", "#ffffff", 1.8, 0.7);
    }
    s += St("M" + (C - sw + 2) + " 560Q" + C + " 572 " + (C + sw - 2) + " 560", pc, 3.6, 0.1) + St("M" + (C - sw + 4) + " 620Q" + C + " 630 " + (C + sw - 4) + " 620", pc, 3, 0.08);
    // tasca grande: spessore, ombra sotto e cucitura
    var tk = "M" + (C - 38) + " 540L" + (C + 38) + " 540L" + (C + 42) + " 600L" + (C - 42) + " 600Z";
    var ik = linea(K, tk);
    s += usa(ik, tratto("#000000", 6, 0.07, " transform='translate(1 3)'")) + usa(ik, " fill='" + K.mix(bianco, "#ffffff", 0.0) + "' opacity='.9'") + usa(ik, tratto(pc, 1.3, 0.55, " stroke-dasharray='4 3'")) + St("M" + (C - 38) + " 541.5L" + (C + 38) + " 541.5", mg, 3, 0.9) + St("M" + C + " 543L" + C + " 600", pc, 1.2, 0.35) + St("M" + (C - 40) + " 601L" + (C + 40) + " 601", "#000000", 2.4, 0.1);
    // bordino a colore della maglia lungo i lati e in fondo, con la sua cucitura
    var bo = "M" + (C - bw) + " 317C" + (C - bw - 2) + " 360 " + (C - B.wt - 5) + " 410 " + (C - B.wt - 6) + " 452L" + (C - wb) + " 474C" + (C - sw - 4) + " 540 " + (C - sw - 8) + " 640 " + (C - sw - 14) + " 700";
    var bo2 = "M" + (C + bw) + " 317C" + (C + bw + 2) + " 360 " + (C + B.wt + 5) + " 410 " + (C + B.wt + 6) + " 452L" + (C + wb) + " 474C" + (C + sw + 4) + " 540 " + (C + sw + 8) + " 640 " + (C + sw + 14) + " 700";
    var i1 = linea(K, bo), i2 = linea(K, bo2);
    s += usa(i1, tratto(mg, 4.6, 0.9)) + usa(i2, tratto(mg, 4.6, 0.9)) + usa(i1, tratto("#ffffff", 1, 0.45, " stroke-dasharray='3 2.5' transform='translate(2.4 0)'")) + usa(i2, tratto("#ffffff", 1, 0.45, " stroke-dasharray='3 2.5' transform='translate(-2.4 0)'"));
    s += St("M" + (C - sw - 20) + " 698Q" + C + " 716 " + (C + sw + 20) + " 698", mg, 5, 0.9) + St("M" + (C - sw - 18) + " 692Q" + C + " 709 " + (C + sw + 18) + " 692", "#ffffff", 1, 0.45, " stroke-dasharray='3 2.5'") + St("M" + (C - bw) + " 317C" + (C - 20) + " 324 " + (C + 20) + " 324 " + (C + bw) + " 317", mg, 3.6, 0.9) + St("M" + (C - bw + 3) + " 322C" + (C - 20) + " 329 " + (C + 20) + " 329 " + (C + bw - 3) + " 322", "#ffffff", 1, 0.4, " stroke-dasharray='3 2.5'");
    // cintura: fascia con spessore
    var cn = "M" + (C - B.wt - 12) + " 448L" + (C + B.wt + 12) + " 448L" + (C + wb + 2) + " 474L" + (C - wb - 2) + " 474Z";
    s += K.Pa(cn, cilU(K, K.mix(bianco, "#b9bccb", 0.3), C - wb, C + wb, 0.9), " opacity='.97'") + St("M" + (C - B.wt - 12) + " 449.5L" + (C + B.wt + 12) + " 449.5", "#ffffff", 1.2, 0.7) + St("M" + (C - wb - 2) + " 473L" + (C + wb + 2) + " 473", pc, 2.2, 0.35) + K.El(C, 480, wb, 6, K.soft(pc, 0.22));
    s += usa(ia, tratto(pc, 3.6, 0.42)) + "</g>";
    // lacci in vita
    [-1, 1].forEach(function (l) { var x = C + l * (B.wt + 12); s += K.Pa("M" + n1(x) + " 456C" + n1(x + l * 8) + " 480 " + n1(x + l * 6) + " 504 " + n1(x + l * 12) + " 524L" + n1(x + l * 2) + " 524C" + n1(x - l * 2) + " 500 " + n1(x - l * 4) + " 478 " + n1(x - l * 2) + " 456Z", K.cil(bianco, 0.6)); });
    return { corpo: s };
  });

  // (leggero) ogni capo di questo file dentro il gruppo GR (vedi St)
  ["felpa", "camicia", "giacca", "bomber", "maglione", "dolcevita", "polo", "canotta", "calcio", "sportiva", "crop", "top", "camicetta", "cardigan", "gilet", "cappotto", "vestito", "vestitolungo", "grembiule"].forEach(function (v) {
    var f = A.capo[v]; if (!f) return;
    A.capo[v] = function () { var r = f.apply(this, arguments), o = {}; for (var k in r) o[k] = typeof r[k] === "string" && r[k] ? GR + r[k] + "</g>" : r[k]; return o; };
  });
})();
/* PEZZI FATTI (voce capo): felpa, camicia, giacca, bomber, maglione, cappotto, polo, canotta, dolcevita, calcio, sportiva,
   crop, top, camicetta, cardigan, gilet, vestito, vestitolungo, grembiule. Tutti provati su 6 corporature, colori chiari/scuri,
   braccia alzate. Nessun pezzo da sostituire.
   NOTA per il capo: vestito e vestitolungo non coprono i pantaloni "sotto": il vestito al ginocchio ridisegna da solo le gambe
   nude e le scarpe sotto l'orlo; il lungo arriva alle caviglie (orlo 942). Se c'e' una gonna lunga sotto, l'editor dovrebbe spegnerla. */
/* 5 nov 2026, secondo tempo: tutti i 19 capi convertiti al corpo nuovo. Tronco e maniche della stessa stoffa in UN K.dipingi (aiuto veste());
   maniche solo con K.manica (aiuto maniche(): contorni, pieghe e polsini); bordo interno solo nei capi senza maniche (bordoS);
   crop ora usa K.busto (spalla tonda) al posto del vecchio torso corto; vestito: gambe nude piu' larghe per coprire i jeans sotto. */
/* 5 nov 2026, giro 2 (aiutante sopra3): vestito/vestitolungo senza gambe finte (le gambe e i pantaloni scelti li disegna il motore) e con ombra sotto l'orlo;
   top rifatto (bordo a cuore con spessore, ombre morbide su pelle sopra e sotto, fianchi che seguono il busto, spalline sottili);
   agio di spalle e maniche ridotto (felpa, maglione, bomber, giacca, cappotto, cardigan, camicetta, sportiva); ombra del petto femminile larga e leggera;
   cappotto con trama rada, maschi dritti (niente campana); grembiule con pieghe, bordino, tasca con spessore, cintura e ombra sul corpo;
   TUTTI gli ornamenti di sola manica (polsini, righe sportiva, bottoni polsino, fascia calcio, arricciature camicetta, trame e pieghe sulle maniche) passano da K.suManica. */


// ---- vestiti-sotto ----
// pezzi: vestiti-sotto — pantaloni, gonne e scarpe degli avatar illustrati
// SECONDO TEMPO (5 nov 2026): la stoffa è UNA sagoma sola (bacino + gambe in un contorno per lato, colorata con K.dipingi):
// niente giunture né gradini tra vita, fianchi e cosce, su tutte e 6 le corporature.
(function () {
  var A = window.SGOminoA;
  // (leggero, 5 nov 2026) stesso disegno con meno testo. I tratti di questo file (St) non ripetono fill='none' e la punta tonda:
  // li dà UNA volta il gruppo GR che avvolge l'uscita di ogni pezzo del file (in fondo; dentro, ogni riempimento è scritto,
  // quindi non cambia niente). Opacità e spessori con al massimo 3 decimali.
  var GR = "<g fill='none' stroke-linecap='round'>", RX_LN = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
  function op3(v) { var t = "" + Math.round(v * 1000) / 1000; return t.charAt(0) === "0" && t.length > 1 ? t.slice(1) : t; }
  function St(d, c, w, op, x) { return "<path d='" + d + "' stroke='" + c + "' stroke-width='" + op3(w) + "'" + (op != null ? " opacity='" + op3(op) + "'" : "") + (x ? x.replace(RX_LN, "") : "") + "/>"; }

  function sm(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }

  // ---------------------------------------------------------------- pantaloni
  // il contorno di UNA metà (lato -1 sinistra, 1 destra): dalla vita (centro) giù per il fianco, il fianco dell'anca che
  // scivola nella coscia, l'orlo, la gamba da dentro fino al cavallo e su lungo il centro. L'agio passa piano dall'anca alla coscia.
  // gli stivali alti (disegnati SOPRA i pantaloni): il gambale che i pantaloni devono coprire senza sporgere ai lati
  var STIV = { stivali: [786, 8], stivalialti: [738, 2.5], stivaletti: [868, 8], anfibi: [844, 10] };
  function limStivale(K, y) {
    var b = STIV[K.c && K.c.modScarpe]; if (!b) return null;
    var tt = sm((y - b[0]) / (944 - b[0])), aa = y <= b[0] ? b[1] : b[1] + (b[1] * 0.7 - b[1]) * tt;
    return { ao: aa, ai: aa * 0.8, w: sm((y - (b[0] - 16)) / 16) };
  }
  function meta(K, l, o) {
    var C = K.C, B = K.B, pz = K.G.pancia || 0, v = o.v, a = o.a, e = o.agio, ei = o.agioI, eb = o.agioB, cv = o.curva;
    function ag(y) { return eb + (e - eb) * sm((y - 528) / 140); }
    function agI(y) { var b = eb * 0.8; return b + (ei - b) * sm((y - 528) / 140); }
    var rif = o.dritto ? K.gIn(o.dritto) : null;
    function gam(y) {   // [centro, fuori, dentro] della stoffa alla quota y
      var g = K.gIn(y), fo = g[1] + ag(y), di = g[2] + agI(y);
      if (o.dritto && y > o.dritto) {
        var t = Math.min(1, (y - o.dritto) / Math.max(1, a - o.dritto));
        var fo2 = rif[1] + e + ((o.orloL != null ? o.orloL : rif[1] + e) - (rif[1] + e)) * t;
        var di2 = rif[2] + ei + ((o.orloL != null ? o.orloL * 0.85 : rif[2] + ei) - (rif[2] + ei)) * t;
        fo = Math.max(fo, fo2); di = Math.max(di, di2);
      }
      if (o.svasa && y > 760) { var s2 = (y - 760) / 180 * o.svasa; fo += s2; di += s2 * 0.8; }
      // la stoffa si raccoglie sulla scarpa: ultimo tratto un filo più largo (piega morbida)
      if (a > 880 && !limStivale(K, 900)) { var fl = 2.2 * sm((y - (a - 30)) / 30); fo += fl; di += fl * 0.7; }
      // dentro agli stivali alti: mai più larga del gambale (niente strisce di stoffa ai lati)
      var lb = limStivale(K, y);
      if (lb && lb.w > 0) { var fo2 = Math.min(fo, g[1] + lb.ao - 0.8), di2 = Math.min(di, g[2] + lb.ai - 0.8); fo += (fo2 - fo) * lb.w; di += (di2 - di) * lb.w; }
      return [g[0], fo, di];
    }
    function P(q) { return [C + l * q[0], q[1]]; }
    var wv = B.wt + pz + eb, wh = B.hp + eb;
    var out = [[wv, v], [wv + (wh - wv) * 0.22, v + (528 - v) * 0.4], [wh, 528]], y, g;
    for (y = 562; y < a - 14; y += 34) { g = gam(y); out.push([g[0] + g[1], y]); }
    var yh = a - 9; g = gam(yh); out.push([g[0] + g[1], yh]);
    var hemIn = [g[0] - g[2], yh];
    // l'interno della gamba: dal fondo su fino al cavallo (dove le due gambe si toccano)
    var yc = 548;
    for (y = 548; y < a; y += 2) { g = gam(y); if (g[0] - g[2] >= 0.8) { yc = y; break; } }
    var inn = [hemIn];
    for (y = a - 30; y > yc + 20; y -= 34) { g = gam(y); inn.push([g[0] - g[2], y]); }
    g = gam(yc); inn.push([g[0] - g[2], yc]);
    inn.push([0, yc - 9], [-1, yc - 24]);
    var ol = P(out[out.length - 1]), ir = P(hemIn), sg = ol[0] > ir[0] ? 1 : -1, rr = Math.min(7, Math.abs(ol[0] - ir[0]) * 0.2), ym2 = (ol[0] + ir[0]) / 2;
    // l'orlo: angoli tondi e bordo appena curvo (lo sbuffo della stoffa sulla scarpa), non un taglio netto
    var hem = "Q" + K.n1(ol[0]) + " " + K.n1(a + 0.4) + " " + K.n1(ol[0] - sg * rr) + " " + K.n1(a + 1.4 + cv * 0.4) +
      "Q" + K.n1(ym2) + " " + K.n1(a + 2.4 + cv * 1.5) + " " + K.n1(ir[0] + sg * rr) + " " + K.n1(a + 1.4 + cv * 0.4) +
      "Q" + K.n1(ir[0]) + " " + K.n1(a + 0.4) + " " + K.n1(ir[0]) + " " + K.n1(yh);
    return "M" + K.n1(C - l) + " " + v + "L" + K.n1(P(out[0])[0]) + " " + v + K.cr(out.map(P)) + hem + K.cr(inn.map(P)) + "L" + K.n1(C - l) + " " + (yc - 40) + "Z";
  }
  // base comune: una sagoma sola colorata insieme, luci e ombre per ogni gamba
  function pant(K, o) {
    var pn = o.col || K.pantaloni, pl = K.chiaro(pn, K.m ? 0.2 : 0.26), pd = K.scuro(pn, 0.38), C = K.C, B = K.B, v = K.m ? 456 : 448, id = o.id || "vp";
    var ag = o.agio == null ? 7 : o.agio, op = { v: v, a: o.a, agio: ag, agioI: o.agioI == null ? 5 : o.agioI, agioB: o.agioB == null ? Math.min(ag, 5) : o.agioB, dritto: o.dritto, orloL: o.orloL, svasa: o.svasa, curva: o.curva == null ? 4 : o.curva };
    var Ln = meta(K, -1, op), Rn = meta(K, 1, op);
    var ym = (548 + o.a) / 2, ry = (o.a - 548) / 2 * 0.8, s = "";
    var fz = Math.min(1, (o.a - 548) / 280), corto = o.a < 760, lungo = o.a > 800, ombra = "";
    // cavallo: solo un'ombra morbida (niente riga dura)
    s += K.El(200, 600, corto ? 14 : 18, corto ? 16 : 38, K.soft("#000000", corto ? 0.07 : 0.11));
    [-1, 1].forEach(function (l) {
      var gy = K.gIn(ym), cx = C + l * gy[0];
      // luce larga e debole a sinistra della gamba, ombra morbida a destra e vicino al cavallo (niente striscia lucida)
      s += K.El(cx - gy[1] * 0.45, ym, gy[1] * 0.75, ry, K.soft("#ffffff", (K.m ? 0.12 : 0.15) * fz)) + K.El(cx + gy[1] * 0.85, ym + 10, 13, ry * 1.05, K.soft("#000000", 0.26 * fz)) + K.El(cx - l * gy[2] * 0.85, ym, 8, ry * 0.95, K.soft("#000000", 0.17 * fz));
      if (lungo && o.pieghe !== false) {   // pieghe leggere: davanti al ginocchio e dietro (dentro) al ginocchio
        var k = K.gIn(748), kx = C + l * k[0], kw = k[1] * 0.8;
        s += St("M" + K.n1(kx - kw) + " 738C" + K.n1(kx - kw * 0.4) + " 745 " + K.n1(kx + kw * 0.3) + " 744 " + K.n1(kx + kw) + " 737", pd, 2.6, 0.13) +
          St("M" + K.n1(kx - kw * 0.8) + " 756C" + K.n1(kx - kw * 0.3) + " 762 " + K.n1(kx + kw * 0.3) + " 761 " + K.n1(kx + kw * 0.8) + " 755", pl, 1.4, 0.16) +
          St("M" + K.n1(kx - kw * 0.6) + " 768C" + K.n1(kx - kw * 0.1) + " 773 " + K.n1(kx + kw * 0.4) + " 772 " + K.n1(kx + kw * 0.9) + " 766", pd, 1.6, 0.09);
        s += K.El(kx - l * k[2] * 0.55, 770, 8, 20, K.soft("#000000", 0.13));   // dietro al ginocchio
        s += St("M" + K.n1(kx - kw * 0.5) + " 700C" + K.n1(kx - kw * 0.2) + " 716 " + K.n1(kx + kw * 0.1) + " 726 " + K.n1(kx + kw * 0.5) + " 736", pd, 1.6, 0.07);
        // orlo morbido sulle scarpe: la stoffa si ammorbidisce e fa una piccola piega, niente risvolto
        var h = K.gIn(o.a - 8), hx = C + l * h[0], hw2 = h[1] * 0.9;
        s += St("M" + K.n1(hx - hw2) + " " + (o.a - 24) + "C" + K.n1(hx - hw2 * 0.4) + " " + (o.a - 19) + " " + K.n1(hx + hw2 * 0.4) + " " + (o.a - 19) + " " + K.n1(hx + hw2) + " " + (o.a - 25), pd, 2.2, 0.12);
        if (!limStivale(K, 900)) {   // la stoffa si ammucchia sulla scarpa: poche pieghe morbide che scendono verso l'orlo, ombra sotto
          var ha = o.a, wf = Math.max(h[1], o.orloL || 0) * 0.9;
          [[-0.55, 0.13, 5], [0.05, 0.15, -5], [0.62, 0.11, 4]].forEach(function (q, k) {
            var x0 = hx + q[0] * wf, y0 = ha - 36 + k * 3;
            s += St("M" + K.n1(x0) + " " + K.n1(y0) + "C" + K.n1(x0 + q[2] * 0.4) + " " + K.n1(y0 + 14) + " " + K.n1(x0 - q[2] * 0.6) + " " + K.n1(ha - 22) + " " + K.n1(x0 + q[2] * 0.3) + " " + K.n1(ha - 6), pd, 3.6, q[1]) +
              St("M" + K.n1(x0 + 3) + " " + K.n1(y0 + 6) + "C" + K.n1(x0 + 3 + q[2] * 0.4) + " " + K.n1(y0 + 18) + " " + K.n1(x0 + 2 - q[2] * 0.4) + " " + K.n1(ha - 20) + " " + K.n1(x0 + 3.5 + q[2] * 0.3) + " " + K.n1(ha - 8), pl, 2.2, q[1] * 0.9);
          });
          s += K.El(hx, ha - 4, wf, 5, K.soft("#000000", 0.18));
          ombra += K.El(hx + l * 1.5, ha + 5, wf * 1.02, 7.5, K.soft("#000000", 0.42));
        }
      }
      if (o.dett) s += o.dett(l, cx, pn, pl, pd);
    });
    if (lungo) s += "<rect x='0' y='" + (o.a - 22) + "' width='400' height='24' fill='" + K.LG(id + "h", 0, 0, 0, 1, [[0, "#000000", 0], [1, "#000000", 0.2]]) + "'/>";
    if (o.dentro) s += o.dentro(pn, pl, pd);
    var bandaCol = K.mix(pn, "#000000", 0.18);
    if (o.cintura !== false) {   // la cintura: una fascia ritagliata sulla sagoma (segue il contorno della pancia)
      s += "<rect x='0' y='" + v + "' width='400' height='14' fill='" + bandaCol + "' opacity='.6'/>";
      s += St("M0 " + (v + 14) + "L400 " + (v + 14), pd, 1.2, 0.7) + St("M0 " + (v + 1) + "L400 " + (v + 1), pl, 1, 0.5);
    }
    var V = K.dipingi({ altro: [Ln, Rn] }, pn, { chiaro: pl, scuro: pd, dentro: s });
    s = V.svg;
    if (o.cordino) {   // laccio della tuta e dei pantaloncini
      var ya = v + 8;
      s += St("M" + (C - 7) + " " + ya + "C" + (C - 18) + " " + (ya + 22) + " " + (C - 16) + " " + (ya + 34) + " " + (C - 20) + " " + (ya + 44), "#f2f2ee", 2.4, 0.95) +
        St("M" + (C + 7) + " " + ya + "C" + (C + 16) + " " + (ya + 20) + " " + (C + 18) + " " + (ya + 32) + " " + (C + 22) + " " + (ya + 40), "#d8d8d2", 2.4, 0.95) +
        K.El(C - 20, ya + 46, 2.6, 3.4, "#f2f2ee") + K.El(C + 22, ya + 42, 2.6, 3.4, "#d8d8d2") + K.El(C - 4, ya, 2.2, 2, "#555", " opacity='.7'") + K.El(C + 4, ya, 2.2, 2, "#555", " opacity='.7'");
    }
    if (o.bottone) s += "<circle cx='200' cy='" + (v + 13) + "' r='4.4' fill='#c9ccd2' stroke='#6e7078' stroke-width='1'/><circle cx='199' cy='" + (v + 12) + "' r='1.5' fill='#ffffff' opacity='.8'/>";
    if (ombra) K._ombraOrlo = "<g clip-path='" + K.clip("M0 " + (o.a + 1) + "H400V" + (o.a + 34) + "H0Z") + "'>" + ombra + "</g>";
    return { s: s, L: Ln, R: Rn };
  }
  // i pezzi «sotto» si registrano qui: se i pantaloni hanno buttato un'ombra sulla scarpa, esce come «sopra» (sopra la scarpa)
  var _pezzo = A.pezzo;
  function reg(tipo, nome, fn) {
    _pezzo.call(A, tipo, nome, function (K) {
      K._ombraOrlo = ""; var r = fn(K);
      if (K._ombraOrlo) { var om = K._ombraOrlo; K._ombraOrlo = ""; return typeof r === "string" ? { corpo: r, sopra: om } : { corpo: r.corpo, sopra: (r.sopra || "") + om }; }
      return r;
    });
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
  reg("sotto", "pantaloncini", function (K) {
    var C = K.C, B = K.B;
    var r = pant(K, { id: "vpc", a: 694, agio: 9, agioI: 7, curva: 6, cordino: true, cintura: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(660), ex = C + l * (g[0] + g[1] + 9);
        return K.Pa(K.limb([[C + l * (B.wt - 8), 462, 7], [C + l * (B.hp - 7), 528, 7], [ex - l * 8, 598, 7], [ex - l * 8, 696, 7]]), K.mix(pn, "#ffffff", 0.7), " opacity='.6'") +
          St("M" + K.n1(cx - 24) + " 676C" + K.n1(cx - 10) + " 683 " + K.n1(cx + 10) + " 683 " + K.n1(cx + 24) + " 675", pd, 3, 0.3) +
          St("M" + K.n1(cx - 24) + " 684C" + K.n1(cx - 10) + " 691 " + K.n1(cx + 10) + " 691 " + K.n1(cx + 24) + " 683", pl, 1.2, 0.3);
      } });
    return r.s;
  });
  // ---- bermuda
  reg("sotto", "bermuda", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var r = pant(K, { id: "vbe", a: 776, agio: 10, agioI: 8, curva: 5, bottone: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(700), ex = C + l * (g[0] + g[1] + 9);
        var s = St("M" + K.n1(cx - 26) + " 758C" + K.n1(cx - 12) + " 765 " + K.n1(cx + 10) + " 765 " + K.n1(cx + 26) + " 757", pd, 3, 0.28) + St("M" + K.n1(cx - 24) + " 766C" + K.n1(cx - 10) + " 773 " + K.n1(cx + 10) + " 773 " + K.n1(cx + 24) + " 765", pl, 1.4, 0.25);
        s += St("M" + K.n1(cx - l * 4 - 24) + " 748C" + K.n1(cx - 10) + " 754 " + K.n1(cx + 10) + " 754 " + K.n1(cx + 24) + " 747", pd, 1, 0.5, TR);
        // tasca sul lato (cargo leggera)
        s += K.Pa("M" + (ex - l * 3) + " 668L" + (ex - l * 31) + " 668L" + (ex - l * 31) + " 718L" + (ex - l * 3) + " 718Z", K.mix(pn, "#000000", 0.08), " opacity='.5'") +
          St("M" + (ex - l * 3) + " 668L" + (ex - l * 31) + " 668L" + (ex - l * 31) + " 718L" + (ex - l * 3) + " 718", pd, 1.1, 0.55, TR) +
          K.Pa("M" + (ex - l * 3) + " 668L" + (ex - l * 31) + " 668L" + (ex - l * 31) + " 684L" + (ex - l * 3) + " 684Z", K.mix(pn, "#000000", 0.18), " opacity='.5'") +
          St("M" + (ex - l * 3) + " 684L" + (ex - l * 31) + " 684", pd, 1.6, 0.5) + K.El(ex - l * 17, 684, 2.4, 2.4, "#c9b26a", " opacity='.9'");
        return s;
      },
      dentro: function (pn, pl, pd) { return laccetto(K, C - B.wt - 5, C + B.wt + 5, v, pn); } });
    return r.s;
  });
  // ---- shorts di jeans (sfilacciati)
  reg("sotto", "shortsjeans", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var r = pant(K, { id: "vsj", a: 664, agio: 6, agioI: 4, curva: 5, bottone: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(640), s = "";
        s += St("M" + K.n1(cx - 22) + " 662C" + K.n1(cx - 8) + " 669 " + K.n1(cx + 8) + " 669 " + K.n1(cx + 22) + " 661", "#f1ece0", 2.2, 0.55, " stroke-dasharray='1.2 1.6'") + St("M" + K.n1(cx - 22) + " 652C" + K.n1(cx - 8) + " 659 " + K.n1(cx + 8) + " 659 " + K.n1(cx + 22) + " 651", pd, 1, 0.45, TR);
        for (var i = 0; i < 6; i++) s += St("M" + K.n1(cx - 20 + i * 8) + " 664l" + (i % 2 ? -1 : 1) + " 5", "#f1ece0", 1, 0.55);
        return s;
      },
      dentro: function (pn) { var wl = C - B.wt - 5, wr = C + B.wt + 5; return laccetto(K, wl, wr, v, pn) + St("M" + K.n1(wl + 2) + " " + (v + 4) + "C" + K.n1(wl + 8) + " " + (v + 42) + " " + K.n1(wl + 24) + " " + (v + 58) + " " + K.n1(wl + 46) + " " + (v + 64), K.mix(pn, "#e8c070", 0.75), 1.1, 0.8, TR) + St("M" + K.n1(wr - 2) + " " + (v + 4) + "C" + K.n1(wr - 8) + " " + (v + 42) + " " + K.n1(wr - 24) + " " + (v + 58) + " " + K.n1(wr - 46) + " " + (v + 64), K.mix(pn, "#e8c070", 0.75), 1.1, 0.8, TR); } });
    return r.s;
  });
  // ---- jeans e pantaloni di base (stessa sagoma unica degli altri: vincono sulla versione del motore)
  function jeansUnico(K, classici) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448, jn = K.pantaloni, jl = K.chiaro(jn, K.m ? 0.2 : 0.26), jd = K.scuro(jn, 0.38);
    var scu = classici ? K.scuro(jn, 0.2) : K.mix(jn, "#e8c070", 0.75), wl = C - B.wt - 5, wr = C + B.wt + 5;
    var r = pant(K, { id: classici ? "vpa" : "vje", a: 944, agio: 7, agioI: 5, agioB: 5, dritto: 760, orloL: classici ? 30 : 27, curva: 4, bottone: !classici,
      dett: function (l, cx) {
        var s = "", g = K.gIn(760);
        if (!classici) {
          s += St("M" + K.n1(C + l * (g[0] + g[1] + 2)) + " 620L" + K.n1(C + l * (g[0] + 26)) + " 930", scu, 1, 0.4, TR);
          // tasca davanti, cucita
          var p0 = C + l * (B.hp - 6), p1 = C + l * (B.wt + 16);
          s += St("M" + K.n1(p1) + " " + (v + 14) + "C" + K.n1(p1 + l * 6) + " " + (v + 48) + " " + K.n1(p0 - l * 14) + " " + (v + 70) + " " + K.n1(p0 + l * 2) + " " + (v + 70), scu, 1, 0.55, TR);
        } else {
          // piega stirata: una linea morbida davanti, chiara a sinistra e scura a destra
          var g2 = K.gIn(700), px = C + l * g2[0];
          s += St("M" + K.n1(px) + " 596L" + K.n1(px + l * 1) + " 930", K.chiaro(jn, 0.25), 1.6, 0.22) + St("M" + K.n1(px + 2) + " 596L" + K.n1(px + 3) + " 930", jd, 1.4, 0.2);
          var tx = C + l * (B.wt + 12);
          s += St("M" + K.n1(tx) + " " + (v + 14) + "C" + K.n1(tx + l * 5) + " " + (v + 38) + " " + K.n1(tx + l * 9) + " " + (v + 50) + " " + K.n1(tx + l * 13) + " " + (v + 60), jd, 1.4, 0.4);
        }
        return s;
      },
      dentro: function (pn) {
        var s = laccetto(K, wl, wr, v, pn);
        if (!classici) {
          s += St("M" + K.n1(wl + 2) + " " + (v + 4) + "C" + K.n1(wl + 8) + " " + (v + 42) + " " + K.n1(wl + 24) + " " + (v + 58) + " " + K.n1(wl + 46) + " " + (v + 64), scu, 1.1, 0.8, TR) + St("M" + K.n1(wr - 2) + " " + (v + 4) + "C" + K.n1(wr - 8) + " " + (v + 42) + " " + K.n1(wr - 24) + " " + (v + 58) + " " + K.n1(wr - 46) + " " + (v + 64), scu, 1.1, 0.8, TR) +
            St("M205 " + (v + 12) + "L205 " + (v + 62) + "C205 " + (v + 68) + " 198 " + (v + 70) + " 193 " + (v + 66), scu, 1.1, 0.8, TR);
        }
        return s;
      } });
    return r.s;
  }
  reg("sotto", "jeans", function (K) { return jeansUnico(K, false); });
  reg("sotto", "pantaloni", function (K) { return jeansUnico(K, true); });

  // ---- leggings: aderenti
  reg("sotto", "leggings", function (K) {
    var C = K.C;
    var r = pant(K, { id: "vle", a: 944, agio: 1.5, agioI: 1, agioB: 3, orloL: 18, dritto: 0, curva: 3,
      dett: function (l, cx, pn, pl, pd) {
        var s = "";
        // riflesso lucido lungo la gamba e piega alle ginocchia
        var g = K.gIn(740);
        s += St("M" + K.n1(C + l * (K.gIn(600)[0]) - 12) + " 600C" + K.n1(C + l * K.gIn(700)[0] - 14) + " 680 " + K.n1(C + l * K.gIn(800)[0] - 10) + " 800 " + K.n1(C + l * K.gIn(930)[0] - 7) + " 930", "#ffffff", 3.4, 0.16);
        s += St("M" + K.n1(cx - 14) + " " + 750 + "C" + K.n1(cx - 4) + " 756 " + K.n1(cx + 6) + " 756 " + K.n1(cx + 14) + " 750", pd, 2, 0.3);
        s += St("M" + K.n1(cx - 9) + " 936C" + K.n1(cx - 2) + " 940 " + K.n1(cx + 4) + " 940 " + K.n1(cx + 9) + " 936", pd, 2, 0.35);
        return s;
      } });
    return r.s;
  });
  // ---- zampa d'elefante
  reg("sotto", "zampa", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var r = pant(K, { id: "vza", a: 962, agio: 5, agioI: 3, svasa: 44, curva: 6, bottone: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(880), s = "";
        s += St("M" + K.n1(cx - 36) + " 944C" + K.n1(cx - 14) + " 954 " + K.n1(cx + 14) + " 954 " + K.n1(cx + 36) + " 942", pd, 2.6, 0.3) + St("M" + K.n1(cx - 32) + " 953C" + K.n1(cx - 12) + " 962 " + K.n1(cx + 12) + " 962 " + K.n1(cx + 32) + " 951", pl, 1.2, 0.25);
        s += St("M" + K.n1(C + l * (g[0] + 6)) + " 780L" + K.n1(C + l * (g[0] + 18)) + " 958", pd, 1, 0.35, TR);
        s += K.El(cx + l * 6, 880, 18, 78, K.soft("#ffffff", 0.12));
        return s;
      },
      dentro: function (pn) { return St("M" + (C - B.wt - 3) + " " + (v + 38) + "C" + (C - B.wt + 12) + " " + (v + 56) + " " + (C - B.wt + 28) + " " + (v + 62) + " " + (C - B.wt + 44) + " " + (v + 64), K.mix(pn, "#e8c070", 0.75), 1.1, 0.8, TR); } });
    return r.s;
  });
  // ---- tuta: polsini e riga laterale
  reg("sotto", "tuta", function (K) {
    var C = K.C, B = K.B;
    var r = pant(K, { id: "vtu", a: 944, agio: 10, agioI: 7, agioB: 6, dritto: 760, orloL: 24, curva: 4, cordino: true,
      dett: function (l, cx, pn, pl, pd) {
        var g = K.gIn(700), ex = C + l * (g[0] + g[1] + 10);
        var righe = K.mix(pn, K.lum(pn) > 0.55 ? "#2b2b33" : "#ffffff", 0.78);
        var s = K.Pa("M" + (ex - l * 3) + " 556L" + (ex - l * 11) + " 556L" + (ex - l * 13) + " 944L" + (ex - l * 4) + " 944Z", righe, " opacity='.85'");
        s += St("M" + (ex - l * 12) + " 556L" + (ex - l * 14) + " 944", K.chiaro(righe, 0.3), 1, 0.35);
        var k = K.gIn(748); s += St("M" + K.n1(cx - 24) + " 742C" + K.n1(cx - 10) + " 750 " + K.n1(cx + 10) + " 750 " + K.n1(cx + 24) + " 740", pd, 3, 0.22);
        return s;
      } });
    // polsino a costine sul fondo della gamba
    var pn = K.pantaloni, pc = K.scuro(pn, 0.25), s = r.s;
    [r.L, r.R].forEach(function (d, i) {
      var l = i ? 1 : -1, g = K.gIn(930), cx = K.C + l * g[0];
      var ribs = ""; for (var q = -24; q <= 24; q += 5) ribs += St("M" + K.n1(cx + q) + " 922L" + K.n1(cx + q * 0.96) + " 946", K.scuro(pn, 0.5), 1, 0.35);
      s += fascia(K, d, 922, 950, K.LG("vtp" + i, 0, 0, 1, 0, [[0, K.mix(pn, "#ffffff", 0.1)], [0.5, pc], [1, K.scuro(pn, 0.5)]]), ribs + St("M" + K.n1(cx - 40) + " 922L" + K.n1(cx + 40) + " 922", K.scuro(pn, 0.55), 1.6, 0.6));
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
    s += St("M" + x1 + " 690L" + x2 + " 690L" + x2 + " 770L" + x1 + " 770Z", pd, 1.2, 0.7, TR) + St("M" + x2 + " 712L" + x1 + " 712", pd, 1.8, 0.5) + K.El((x1 + x2) / 2, 712, 2.5, 2.5, K.mix(pn, "#000000", 0.4));
    return s;
  }
  reg("sotto", "cargo", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448;
    var r = pant(K, { id: "vca", a: 946, agio: 12, agioI: 9, agioB: 6, dritto: 780, orloL: 32, curva: 5, bottone: true,
      dett: function (l, cx, pn, pl, pd) {
        var s = cargoTasche(K, l, pn, pl, pd, 720);
        s += St("M" + K.n1(cx - 28) + " 744C" + K.n1(cx - 12) + " 754 " + K.n1(cx + 10) + " 754 " + K.n1(cx + 26) + " 742", pd, 3, 0.25);
        s += St("M" + K.n1(cx - 30) + " 924C" + K.n1(cx - 12) + " 934 " + K.n1(cx + 10) + " 934 " + K.n1(cx + 30) + " 922", pd, 3, 0.3) + St("M" + K.n1(cx - 28) + " 934C" + K.n1(cx - 10) + " 942 " + K.n1(cx + 10) + " 942 " + K.n1(cx + 28) + " 932", pd, 2, 0.25);
        return s;
      },
      dentro: function (pn) { return laccetto(K, C - B.wt - 5, C + B.wt + 5, v, pn); } });
    return r.s;
  });
  // ---- mimetici
  reg("sotto", "mimetici", function (K) {
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
  // ---- strappati: jeans + strappi alle ginocchia (stessa sagoma unica degli altri pantaloni)
  reg("sotto", "strappati", function (K) {
    var C = K.C, B = K.B, v = K.m ? 456 : 448, jn = K.pantaloni, jl = K.chiaro(jn, K.m ? 0.2 : 0.26), jd = K.scuro(jn, 0.38), scu = K.mix(jn, "#e8c070", 0.75);
    var sk = K.pelle, skD = K.skD, skDD = K.skDD;
    var r = pant(K, { id: "vst", a: 944, agio: 7, agioI: 5, agioB: 5, dritto: 760, orloL: 27, curva: 5, bottone: true,
      dett: function (l, cx, pn) {
        var k = K.gIn(748), kx = C + l * k[0], g = K.gIn(760);
        return St("M" + K.n1(kx - 26) + " 742C" + K.n1(kx - 12) + " 750 " + K.n1(kx + 10) + " 750 " + K.n1(kx + 24) + " 740", jd, 3, 0.25) + St("M" + K.n1(kx - 22) + " 754C" + K.n1(kx - 10) + " 760 " + K.n1(kx + 10) + " 760 " + K.n1(kx + 22) + " 752", jl, 1.5, 0.22) +
          St("M" + K.n1(kx - 26) + " 908C" + K.n1(kx - 12) + " 916 " + K.n1(kx + 10) + " 918 " + K.n1(kx + 26) + " 908", jd, 3, 0.28) + St("M" + K.n1(kx - 24) + " 924C" + K.n1(kx - 10) + " 930 " + K.n1(kx + 10) + " 930 " + K.n1(kx + 24) + " 922", jd, 2.4, 0.3) +
          St("M" + K.n1(C + l * (g[0] + g[1] + 2)) + " 620L" + K.n1(C + l * (g[0] + 26)) + " 930", scu, 1, 0.4, TR);
      },
      dentro: function (pn) {
        var wl = C - B.wt - 5, wr = C + B.wt + 5;
        return laccetto(K, wl, wr, v, pn) + St("M" + K.n1(wl + 2) + " " + (v + 4) + "C" + K.n1(wl + 8) + " " + (v + 42) + " " + K.n1(wl + 24) + " " + (v + 58) + " " + K.n1(wl + 46) + " " + (v + 64), scu, 1.1, 0.8, TR) + St("M" + K.n1(wr - 2) + " " + (v + 4) + "C" + K.n1(wr - 8) + " " + (v + 42) + " " + K.n1(wr - 24) + " " + (v + 58) + " " + K.n1(wr - 46) + " " + (v + 64), scu, 1.1, 0.8, TR) +
          St("M205 " + (v + 12) + "L205 " + (v + 62) + "C205 " + (v + 68) + " 198 " + (v + 70) + " 193 " + (v + 66), scu, 1.1, 0.8, TR);
      } });
    var s = r.s;
    function strappo(cx, cy, w, h, seme, id) {
      var Rr = K.rnd(seme), n = 12, pts = [], ext = [];
      for (var i = 0; i < n; i++) { var t = i / n * 6.283, f = 0.82 + Rr() * 0.3; pts.push([cx + Math.cos(t) * w * f, cy + Math.sin(t) * h * f]); ext.push([cx + Math.cos(t) * (w + 3.5) * (f + 0.06), cy + Math.sin(t) * (h + 3) * (f + 0.1)]); }
      var d = K.lisciaChiusa(pts), de = K.lisciaChiusa(ext), idd = K.id + "LTs" + id;   // (leggero) il contorno dello strappo una volta sola (colore e bordo lo usano)
      K.D.push("<path id='" + idd + "' d='" + d + "'/>");
      var o = K.Pa(de, K.mix(jn, "#ffffff", 0.55), " opacity='.55'");
      o += "<use href='#" + idd + "' fill='" + K.LG(id, 0, 0, 1, 1, [[0, K.mix(sk, "#ffffff", 0.08)], [1, skD]]) + "'/>";
      o += "<g clip-path='" + K.clip(d) + "'>" + K.El(cx, cy - h * 0.7, w * 1.2, h * 0.7, K.soft(skDD, 0.6)) + K.El(cx + w * 0.4, cy + h * 0.3, w * 0.6, h * 0.8, K.soft(skDD, 0.25));
      for (var q = 0; q < 6; q++) { var tx = cx - w * 0.8 + q * w * 0.32 + (Rr() - 0.5) * 3; o += St("M" + K.n1(tx) + " " + K.n1(cy - h * 0.9) + "L" + K.n1(tx + (Rr() - 0.5) * 4) + " " + K.n1(cy + h * 0.9), "#e9ecf2", 0.8, 0.4); }
      o += "</g>";
      o += "<use href='#" + idd + "' stroke='" + K.scuro(jn, 0.4) + "' stroke-width='1' opacity='.5'/>";
      for (q = 0; q < 8; q++) { var a2 = Rr() * 6.283, rr = 1 + Rr() * 0.12; o += St("M" + K.n1(cx + Math.cos(a2) * w * rr) + " " + K.n1(cy + Math.sin(a2) * h * rr) + "l" + K.n1(Math.cos(a2) * 4.5 + (Rr() - 0.5) * 3) + " " + K.n1(Math.sin(a2) * 4 + (Rr() - 0.5) * 2), "#f0f1f4", 1, 0.85); }
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
  // una sagoma sola (vita → anca → orlo), colorata con K.dipingi come i pantaloni
  function gonna(K, o) {
    var pn = K.pantaloni, pl = K.chiaro(pn, 0.28), pd = K.scuro(pn, 0.4), C = K.C, B = K.B, v = K.m ? 456 : 448, hy = o.hem, pz = K.G.pancia || 0;
    var wv = B.wt + pz + 4, wh = B.hp + 4 + (o.agioH || 0), hw = o.hw(B), id = o.id;
    var mx = wv + (wh - wv) * 0.3, my = v + (528 - v) * 0.4;
    var R = [[C + wv, v], [C + mx, my], [C + wh, 528]], Lf = [[C - wv, v], [C - mx, my], [C - wh, 528]];
    if (o.tubino) {   // il tubino segue le cosce: mai più stretto della gamba nuda (se no la pelle sporge ai lati)
      var fg = function (y) { var q = K.gIn(y); return q[0] + q[1] + 2.5; };
      hw = Math.max(hw, fg(hy));
      [[620, wh - 3], [hy - 70, (wh + hw) / 2 - 4], [hy - 34, hw + 2], [hy, hw]].forEach(function (q) { var x = Math.max(q[1], fg(q[0])); R.push([C + x, q[0]]); Lf.push([C - x, q[0]]); });
    }
    else { R.push([C + wh + (hw - wh) * 0.2, 528 + (hy - 528) * 0.4], [C + wh + (hw - wh) * 0.75, hy - (hy - 528) * 0.22], [C + hw, hy]); Lf.push([C - wh - (hw - wh) * 0.2, 528 + (hy - 528) * 0.4], [C - wh - (hw - wh) * 0.75, hy - (hy - 528) * 0.22], [C - hw, hy]); }
    // orlo: leggermente più basso al centro e con onde morbide
    var n = o.onde || 6, hem = [], sag = o.sag == null ? 7 : o.sag, amp = o.amp == null ? 2.5 : o.amp;
    for (var i = 0; i <= n; i++) { var t = i / n, x = C + hw - 2 * hw * t, u = (x - C) / hw; hem.push([x, hy + sag * (1 - u * u) + (i && i < n ? amp * (i % 2 ? 1 : -1) : 0)]); }
    var d = "M" + (C - wv) + " " + v + "L" + (C + wv) + " " + v + K.cr(R) + K.cr(hem) + K.cr(Lf.slice().reverse()) + "Z";
    var pre = "";
    // ombra dell'orlo sulle gambe nude
    if (hy < 900) {
      var gm = { da: hy - 4, a: 950, agio: 0, curvaOrlo: 2 }, LL = K.gamba(-1, gm), RR = K.gamba(1, gm);
      pre += "<g clip-path='" + K.clip([LL, RR]) + "'><rect x='0' y='" + (hy - 4) + "' width='400' height='34' fill='" + K.LG(id + "s", 0, 0, 0, 1, [[0, "#000000", 0.34], [1, "#000000", 0]]) + "'/></g>";
    }
    var s = "";
    // luce a sinistra, ombra a destra
    s += K.El(C - hw * 0.5, (hy + 528) / 2, hw * 0.4, (hy - 528) * 0.55, K.soft("#ffffff", 0.1)) + K.El(C + hw * 0.7, (hy + 528) / 2 + 6, hw * 0.4, (hy - 528) * 0.55, K.soft("#000000", 0.14));
    s += K.El(C, v + 8, wv + 6, 18, K.soft("#000000", 0.28));
    s += K.Pa("M0 " + (hy - 20) + "H400V" + (hy + 20) + "H0Z", K.LG(id + "o", 0, 0, 0, 1, [[0, "#000000", 0], [1, "#000000", 0.32]]));
    if (o.pieghe) s += o.pieghe(null, pl, pd, pn, wv, hw, hy, v);
    if (o.dett) s += o.dett(pl, pd, pn, wv, hw, hy, v);
    // cintura: una fascia ritagliata sulla sagoma
    s += "<rect x='0' y='" + v + "' width='400' height='12' fill='" + K.mix(pn, "#000000", 0.2) + "' opacity='.62'/>" + St("M0 " + (v + 12) + "L400 " + (v + 12), pd, 1.2, 0.7) + St("M0 " + (v + 1) + "L400 " + (v + 1), pl, 1, 0.5);
    var V = K.dipingi({ altro: [d] }, pn, { chiaro: pl, scuro: pd, dentro: s });
    // piccola curva luminosa lungo l'orlo
    return pre + V.svg + St(K.liscio(hem.map(function (q) { return [q[0], q[1] - 1.5]; })), pl, 1.1, 0.4);
  }
  // pieghe morbide dalla vita all'orlo
  function pieghe(K, n, forza) {
    return function (g, pl, pd, pn, wv, hw, hy, v) {
      var C = K.C, s = "", R = K.rnd(5);
      for (var i = 0; i < n; i++) {
        var u = -0.82 + 1.64 * (i + 0.5) / n + (R() - 0.5) * 0.06, xw = C + u * wv * 0.95, xh = C + u * hw * 0.97, ym = (hy + v) / 2;
        var dd = "M" + K.n1(xw) + " " + (v + 14) + "C" + K.n1(xw + (xh - xw) * 0.15) + " " + K.n1(ym - 40) + " " + K.n1(xw + (xh - xw) * 0.75) + " " + K.n1(ym + 70) + " " + K.n1(xh) + " " + (hy + 2);
        s += St(dd, pd, 6 * (forza || 1), 0.1 + 0.05 * (i % 2)) + St(dd.replace(/(\d+\.?\d*) (\d+\.?\d*)/g, function (m, a, b) { return K.n1(+a - 4) + " " + b; }), pl, 2.2, 0.2);
      }
      return s;
    };
  }
  A.pezzo("sotto", "gonna", function (K) {
    return gonna(K, { id: "vgo", hem: 748, hw: function (B) { return B.hp + 36; }, onde: 6, sag: 7, amp: 3, pieghe: pieghe(K, 7, 1) });
  });
  A.pezzo("sotto", "minigonna", function (K) {
    return gonna(K, { id: "vmg", hem: 642, hw: function (B) { return B.hp + 18; }, onde: 4, sag: 5, amp: 1.5, pieghe: pieghe(K, 5, 0.7),
      dett: function (pl, pd, pn, wv, hw, hy, v) { return St("M" + (K.C - hw + 8) + " " + (hy - 7) + "C" + (K.C - 20) + " " + (hy + 2) + " " + (K.C + 20) + " " + (hy + 2) + " " + (K.C + hw - 8) + " " + (hy - 7), pd, 1, 0.5, TR); } });
  });
  A.pezzo("sotto", "gonnalunga", function (K) {
    return gonna(K, { id: "vgl", hem: 932, hw: function (B) { return B.hp + 38; }, onde: 8, sag: 8, amp: 4, agioH: 2, pieghe: pieghe(K, 9, 1.4),
      dett: function (pl, pd, pn, wv, hw, hy) { return K.El(K.C, hy - 30, hw * 0.9, 28, K.soft("#000000", 0.12)); } });
  });
  A.pezzo("sotto", "gonnatubino", function (K) {
    return gonna(K, { id: "vgt", hem: 752, tubino: true, hw: function (B) { return Math.round(B.hp * 0.72 + 4); }, onde: 4, sag: 3, amp: 0, agioH: 0,
      pieghe: function (g, pl, pd, pn, wv, hw, hy, v) {
        var C = K.C, s = "";
        s += St("M" + (C - wv + 10) + " " + (v + 14) + "L" + (C - wv + 18) + " " + (v + 60), pd, 2, 0.35) + St("M" + (C + wv - 10) + " " + (v + 14) + "L" + (C + wv - 18) + " " + (v + 60), pd, 2, 0.35);
        s += St("M" + C + " " + (v + 40) + "L" + C + " " + (hy - 2), pd, 1.1, 0.25);
        s += St("M" + (C - 32) + " 560C" + (C - 10) + " 572 " + (C + 10) + " 572 " + (C + 32) + " 560", pd, 3, 0.22) + St("M" + (C - 28) + " 590C" + (C - 8) + " 600 " + (C + 12) + " 600 " + (C + 30) + " 592", pd, 2, 0.15);
        s += St("M" + (C - hw + 6) + " " + (hy - 12) + "C" + (C - 20) + " " + (hy - 5) + " " + (C + 20) + " " + (hy - 5) + " " + (C + hw - 6) + " " + (hy - 12), pd, 1, 0.45, TR);
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
          s += St("M" + K.n1(C + u0 * wv * 0.98) + " " + (v + 14) + "L" + K.n1(C + u0 * hw) + " " + (hy + 3), pd, 1, 0.38);
        }
        return s;
      } });
  });


  // (leggero) l'uscita di ogni pezzo di questo file dentro il gruppo GR (vedi St)
  [["sotto", "gonna"], ["sotto", "minigonna"], ["sotto", "gonnalunga"], ["sotto", "gonnatubino"], ["sotto", "gonnapieghe"],
   ["sotto", "pantaloncini"], ["sotto", "bermuda"], ["sotto", "shortsjeans"], ["sotto", "jeans"], ["sotto", "pantaloni"], ["sotto", "leggings"], ["sotto", "zampa"], ["sotto", "tuta"], ["sotto", "cargo"], ["sotto", "mimetici"], ["sotto", "strappati"]].forEach(function (tv) {
    var f = A[tv[0]][tv[1]]; if (!f) return;
    A[tv[0]][tv[1]] = function () {
      var r = f.apply(this, arguments);
      if (typeof r === "string") return r ? GR + r + "</g>" : r;
      if (r && typeof r === "object") { var o = {}; for (var k in r) o[k] = typeof r[k] === "string" && r[k] ? GR + r[k] + "</g>" : r[k]; return o; }
      return r;
    };
  });
})();

// FATTI: pantaloncini, gonna, leggings, strappati, cargo, tuta, bermuda, shortsjeans, minigonna, gonnalunga, gonnapieghe, gonnatubino, zampa, mimetici;
// scarpe: eleganti, stivali, anfibi, tacchi, ballerine, sandali, stivaletti, stivalialti, infradito, zeppe, pantofole.
// 5 nov (sotto3): macchia lucida e riga al cavallo tolte, pieghe leggere a ginocchia e orlo morbido; jeans e pantaloni registrati qui con pant().
// SOTTO-SCARPE4 (5 nov 2026): orli arrotondati con sbuffo e pieghe + ombra sulla scarpa (sopra); dentro agli stivali alti la stoffa non supera mai il gambale (niente strisce ai lati).


// ---- scarpe ----
// SCARPE degli avatar illustrati — DI TRE QUARTI (secondo giro, 5 nov 2026)
// Il proprietario: «i piedi sono completamente uniti». Ora ogni piede si vede di tre quarti (da davanti, un po' dall'alto,
// punta girata in fuori di ~25°): si vede la punta davanti, il collo del piede che sale alla caviglia, la suola come una
// fascia sotto; il tallone resta dietro la caviglia. I due piedi sono separati, uguali e speculari, e la gamba entra
// nella scarpa (il collo della scarpa è un anello intorno alla gamba: niente buchi alla caviglia).
(function () {
  var A = window.SGOminoA;

  // =====================================================================================
  //  IL PIEDE DI TRE QUARTI
  //  Ogni scarpa è un piccolo oggetto 3D (pianta, suola, tomaia, collo) visto con una proiezione dritta (affine):
  //  coordinate della scarpa a = avanti dalla caviglia, b = in fuori (verso il mignolo), h = altezza da terra.
  // =====================================================================================
  var DEG = Math.PI / 180, nC = 0;
  var TR = " stroke-dasharray='3.5 3'";
  function sm(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function tab(T, x) { if (x <= T[0][0]) return T[0][1]; for (var i = 1; i < T.length; i++) if (x <= T[i][0]) { var t = (x - T[i - 1][0]) / Math.max(0.001, T[i][0] - T[i - 1][0]); return lerp(T[i - 1][1], T[i][1], sm(t)); } return T[T.length - 1][1]; }
  function hull(P) {   // involucro convesso (catena monotona)
    var p = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cr(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  // toglie i punti troppo vicini (il contorno poi si liscia)
  function radi(P, d) { var o = [P[0]]; for (var i = 1; i < P.length; i++) { var q = o[o.length - 1]; if (Math.hypot(P[i][0] - q[0], P[i][1] - q[1]) >= d) o.push(P[i]); } if (o.length > 3 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < d) o.pop(); return o; }
  // le due catene di un contorno chiuso tra il punto più a sinistra e quello più a destra: { basso, alto }, da sinistra a destra
  function catene(P) {
    var iL = 0, iR = 0, n = P.length, i;
    for (i = 1; i < n; i++) { if (P[i][0] < P[iL][0]) iL = i; if (P[i][0] > P[iR][0]) iR = i; }
    var c1 = [], c2 = [];
    for (i = iL; ; i = (i + 1) % n) { c1.push(P[i]); if (i === iR) break; }
    for (i = iL; ; i = (i - 1 + n) % n) { c2.push(P[i]); if (i === iR) break; }
    var m1 = 0, m2 = 0; c1.forEach(function (q) { m1 += q[1]; }); c2.forEach(function (q) { m2 += q[1]; });
    return m1 / c1.length > m2 / c2.length ? { basso: c1, alto: c2 } : { basso: c2, alto: c1 };
  }
  function yDi(ch, x) { if (x <= ch[0][0]) return ch[0][1]; for (var i = 1; i < ch.length; i++) if (x <= ch[i][0]) { var t = (x - ch[i - 1][0]) / Math.max(0.001, ch[i][0] - ch[i - 1][0]); return lerp(ch[i - 1][1], ch[i][1], t); } return ch[ch.length - 1][1]; }
  // una linea liscia con meno punti (l'avatar pesa meno): tiene il primo e l'ultimo, salta quelli più vicini di 3
  function lis(K, P) { if (P.length < 4) return K.liscio(P); var o = [P[0]], e = P[P.length - 1]; for (var i = 1; i < P.length - 1; i++) { var q = o[o.length - 1]; if (Math.hypot(P[i][0] - q[0], P[i][1] - q[1]) >= 3 && Math.hypot(P[i][0] - e[0], P[i][1] - e[1]) >= 1.5) o.push(P[i]); } o.push(e); return K.liscio(o); }
  function poli(K, P) { return "M" + P.map(function (q) { return K.n1(q[0]) + " " + K.n1(q[1]); }).join("L") + "Z"; }
  function rif(P, dx, dy) { return P.map(function (q) { return [q[0] + dx, q[1] + dy]; }); }
  // ritaglio «tutto tranne questo poligono»
  function tranne(K, P) {
    var id = "sq" + (nC++);
    K.D.push("<clipPath id='" + K.id + id + "'><path clip-rule='evenodd' d='M-200 300H600V1200H-200Z" + poli(K, P) + "'/></clipPath>");
    return "url(#" + K.id + id + ")";
  }
  function dentroA(K, tagli, svg) { (tagli || []).forEach(function (P) { svg = "<g clip-path='" + tranne(K, P) + "'>" + svg + "</g>"; }); return svg; }

  // ---- la pianta: mezza larghezza (lato fuori) lungo a, e la linea di mezzo (la punta va un po' verso l'alluce) ----
  // o: dietro, avanti, larga, Rt (quanto è lunga la curva della punta), kt (2 tonda, 1.5 a mandorla, 1.25 a punta), storta, ki (lato dentro)
  function pianta(o) {
    var ah = o.dietro || 24, at = o.avanti || 74, wb = o.larga || 25, Rt = o.Rt || wb * 0.95, kt = o.kt || 2, Rh = wb * 0.82, st = o.storta == null ? 3 : o.storta;
    var T = [[-ah, 0.76], [-4, 0.8], [at * 0.38, 0.93], [at * 0.6, 1], [Math.max(at * 0.6 + 1, at - Rt), 0.97]];
    return { ah: ah, at: at, wb: wb, ki: o.ki || 0.93,
      w: function (a) {
        var w = wb * tab(T, a);
        if (a > at - Rt) { var q = Math.min(1, (a - (at - Rt)) / Rt); w *= Math.pow(Math.max(0, 1 - Math.pow(q, kt)), 1 / kt); }
        if (a < -ah + Rh) { var q2 = Math.min(1, (-ah + Rh - a) / Rh); w *= Math.sqrt(Math.max(0, 1 - q2 * q2)); }
        return w;
      },
      bc: function (a) { return -st * sm((a - at * 0.3) / (at * 0.7)); } };
  }

  // ---- la vista di UN piede (l = -1 a sinistra nel disegno, 1 a destra) ----
  // o: la pianta (sopra) + suola (spessore), tacco (alza il tallone: il piede va in punta), dorso [[a, 0-1]…] (altezza della
  // tomaia tra la suola e il collo), labbro (quota del collo davanti, 944), giro (gradi in fuori), anello (margine del collo
  // intorno alla gamba), alto (quanto sale il collo dietro), fusto (mezza larghezza del gambale degli stivali), scala
  function vista(K, l, o) {
    o = o || {};
    var g = K.gIn(938), wa = (g[1] + g[2]) / 2, s = (0.64 + 0.36 * wa / 16.5) * (K.m ? 1.03 : 0.93) * (o.scala || 1);
    var r = (o.giro != null ? o.giro : 25) * DEG, e = 17 * DEG, sr = Math.sin(r), cr = Math.cos(r), se = Math.sin(e), ce = Math.cos(e);
    var V = { K: K, l: l, s: s, g: g, xc: K.C + l * g[0], se: se, ce: ce, o: o, yg: 0 };
    V.P = function (a, b, h) { return [V.xc + l * s * (a * sr + b * cr), V.yg + se * s * (a * cr - b * sr) - h * ce]; };
    V.W = function (X, Z, h) { return [V.xc + l * X, V.yg + se * Z - h * ce]; };
    V.ang = Math.atan2(se * cr, l * sr) / DEG;   // il verso del piede sullo schermo (per le ellissi allungate)
    var pl = pianta(o), H = o.tacco || 0, aB = pl.at * 0.6;
    V.H = H; V.aB = aB;
    V.lift = function (a) { if (!H) return 0; var t = (aB - a) / (aB + pl.ah - 8); return t <= 0 ? 0 : H * Math.pow(Math.min(1, t), 0.9); };
    // la terra: la parte più bassa della pianta tocca y 998
    var mx = -1e9, i;
    for (i = 0; i <= 40; i++) { var a = -pl.ah + (pl.at + pl.ah) * i / 40, w = pl.w(a), c = pl.bc(a); mx = Math.max(mx, V.P(a, c + w, V.lift(a))[1], V.P(a, c - w * pl.ki, V.lift(a))[1]); }
    V.yg = 998 - mx;
    // il collo della scarpa: un anello intorno alla gamba (o al gambale), davanti più basso, dietro più alto
    var gm = Math.max(g[1], g[2]);
    V.collo = function (R, lab, alto, xR) {
      var hf = (V.yg + se * R - lab) / ce, hb = hf + alto, P = [];
      for (var k = 0; k < 28; k++) { var f = k / 28 * 2 * Math.PI, sn = Math.sin(f); P.push(V.W(xR + R * Math.cos(f), R * sn, hf + (hb - hf) * (1 - sn) / 2)); }
      return { R: R, hf: hf, hb: hb, P: P, lip: catene(P).basso };
    };
    var col = V.collo((o.fusto || gm) + (o.anello == null ? (o.fusto ? 0 : 2.6) : o.anello), o.labbro || 944, o.alto == null ? 3 : o.alto, o.fusto ? (o.fustoX || 0) : (g[1] - g[2]) / 2);
    V.rho = col.R; V.hf = col.hf; V.hb = col.hb; V.ring = col.P; V.labbroC = col.lip;
    V.aThr = V.rho / s * 0.92;   // la gola: dove il collo incontra il dorso
    V.F = forma(V, o);
    return V;
  }
  // una forma (la scarpa, o il piede nudo dentro) con la stessa vista: pianta, altezza del dorso, superficie
  function forma(V, o) {
    var pl = pianta(o), T = o.suola == null ? 6 : o.suola, nE = o.nE || 2.8, ki = pl.ki;
    var F = { V: V, at: pl.at, ah: pl.ah, wb: pl.wb, w: pl.w, bc: pl.bc, t: T, ki: ki };
    var aThr = o.gola != null ? o.gola : V.aThr, hT = o.hGola != null ? o.hGola : V.hf;
    F.aThr = aThr;
    var dorso = o.dorso || [[aThr, 1], [30, 0.72], [44, 0.5], [56, 0.36], [64, 0.25], [70, 0.13], [pl.at, 0]];
    F.htop = function (a) { var b0 = V.lift(a) + T; return b0 + (hT - b0) * tab(dorso, a); };
    // i punti della pianta a quota dh sopra la pianta (che segue il tacco): fuori dal tallone alla punta, poi dentro all'indietro
    F.orma = function (dh, n, da, aa) {
      n = n || 30; da = da == null ? -pl.ah : da; aa = aa == null ? pl.at : aa;
      var fu = [], de = [];
      for (var i = 0; i <= n; i++) {
        var a = lerp(da, aa, 0.5 - 0.5 * Math.cos(Math.PI * i / n)), w = pl.w(a), c = pl.bc(a), h = V.lift(a) + dh;
        fu.push(V.P(a, c + w, h)); de.push(V.P(a, c - w * ki, h));
      }
      return fu.concat(de.reverse());
    };
    // la b di un punto (bt da -1 bordo dentro a 1 bordo fuori)
    F.b = function (a, bt) { var w = pl.w(a); return pl.bc(a) + (bt >= 0 ? w : w * ki) * (bt < 0 ? -1 : 1) * Math.pow(Math.abs(bt), 2 / nE); };
    F.hsup = function (a, bt) { var b0 = V.lift(a) + T; return b0 + (F.htop(a) - b0) * Math.pow(Math.max(0, 1 - bt * bt), 1 / nE); };
    // un punto sulla superficie (dh = un po' sopra)
    F.sup = function (a, bt, dh) { return V.P(a, F.b(a, bt), F.hsup(a, bt) + (dh || 0)); };
    F.riga = function (a0, a1, bt, dh, n) { var P = []; n = n || 8; for (var i = 0; i <= n; i++) P.push(F.sup(lerp(a0, a1, i / n), bt, dh)); return P; };
    F.giro = function (a, bt0, bt1, dh, n) { var P = []; n = n || 8; for (var i = 0; i <= n; i++) P.push(F.sup(a, lerp(bt0, bt1, i / n), dh)); return P; };
    return F;
  }
  // i contorni: la tomaia (involucro di pianta, archi del dorso e collo) e la suola (pianta a terra + pianta sopra la suola)
  // o.pezzi = [[a0, a1], …] (facoltativo): la sagoma fatta a pezzi lungo il piede che si sovrappongono (ognuno convesso);
  // o.piu = punti in più per il pezzo di dietro (il gambale degli stivali, così il piede si allarga piano dal gambale)
  function sagome(V, F, o) {
    o = o || {};
    var K = V.K, a0 = o.da != null ? o.da : F.aThr * 0.7, aF = o.fino != null ? o.fino : F.at, an = o.anello || V.ring, T = [], S = [];
    (o.pezzi || [[-F.ah, F.at]]).forEach(function (r, k) {
      var up = F.orma(F.t, 18, r[0], r[1]), i, b0 = Math.max(a0, r[0]), b1 = Math.min(aF, r[1]);
      if (r[0] < F.aThr) { up = up.concat(an); if (o.piu) up = up.concat(o.piu); }
      if (b1 > b0) for (i = 0; i <= 12; i++) { var a = lerp(b0, b1, i / 12); [-1, -0.85, -0.6, -0.3, 0, 0.3, 0.6, 0.85, 1].forEach(function (bt) { up.push(F.sup(a, bt)); }); }
      if (o.extra && o.extra[k]) up = up.concat(o.extra[k]);
      T.push(radi(hull(up), 2.4));
      S.push(radi(hull(F.orma(0, 18, r[0], r[1]).concat(F.orma(F.t, 18, r[0], r[1]))), 2.4));
    });
    return { tomaia: T, suola: S, dT: T.map(function (P) { return K.lisciaChiusa(P); }), dS: S.map(function (P) { return K.lisciaChiusa(P); }) };
  }
  // riempire più pezzi come una sagoma sola: prima il bordo di tutti, poi il colore di tutti (il bordo resta solo fuori)
  // (ogni contorno si scrive una volta sola nelle definizioni: il disegno e il ritaglio lo richiamano, così l'avatar pesa meno)
  function defn(K, d) {
    var M = K._sq || (K._sq = {});
    if (!M[d]) { var id = "sf" + (nC++); K.D.push("<path id='" + K.id + id + "' d='" + d + "'/>"); M[d] = "#" + K.id + id; }
    return M[d];
  }
  function riempi(K, dd, col, bordo, w) {
    if (dd.length === 1) return "<use href='" + defn(K, dd[0]) + "' fill='" + col + "' stroke='" + bordo + "' stroke-width='" + (w || 3) + "' stroke-linejoin='round' paint-order='stroke'/>";
    return dd.map(function (d) { return "<path d='" + d + "' fill='none' stroke='" + bordo + "' stroke-width='" + (w || 3) + "' stroke-linejoin='round'/>"; }).join("") + dd.map(function (d) { return K.Pa(d, col); }).join("");
  }
  function ritaglio(K, dd) { var id = "sk" + (nC++); K.D.push("<clipPath id='" + K.id + id + "'>" + dd.map(function (d) { return "<use href='" + defn(K, d) + "'/>"; }).join("") + "</clipPath>"); return "url(#" + K.id + id + ")"; }
  // la striscia della gamba sopra il collo: lì la gamba sta DAVANTI alla scarpa (lip = catena bassa dell'anello)
  function striscia(xa, xb, lip) {
    var x1 = Math.min(xa, xb), x2 = Math.max(xa, xb), P = [[x1, 600], [x2, 600], [x2, yDi(lip, x2)]];
    lip.slice().reverse().forEach(function (q) { if (q[0] > x1 && q[0] < x2) P.push(q); });
    P.push([x1, yDi(lip, x1)]);
    return P;
  }
  function bordiGamba(V, e) { var g = V.g, K = V.K; e = e == null ? 0.6 : e; return [K.C + V.l * (g[0] - g[2] - e), K.C + V.l * (g[0] + g[1] + e)]; }
  function tagliaGamba(V, lip, e) { var b = bordiGamba(V, e); return striscia(b[0], b[1], lip || V.labbroC); }

  // ---- l'ombra a terra ----
  function ombraTerra(V, F) {
    var K = V.K, O = F.orma(0, 16), x1 = 1e9, x2 = -1e9, y2 = -1e9;
    O.forEach(function (q) { x1 = Math.min(x1, q[0]); x2 = Math.max(x2, q[0]); y2 = Math.max(y2, q[1]); });
    return K.El((x1 + x2) / 2, y2 - 4, (x2 - x1) / 2 + 5, 7, K.soft("#000000", 0.5)) + K.El((x1 + x2) / 2 + V.l * 4, y2 - 2, (x2 - x1) / 2 - 4, 4, K.soft("#000000", 0.42));
  }
  function scatola(P) { var b = [1e9, 1e9, -1e9, -1e9]; (P.length && Array.isArray(P[0][0]) ? [].concat.apply([], P) : P).forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); return b; }
  // ---- la suola: bordo scuro fuori, luce da sinistra, più scura in basso (dietro la caviglia la copre la gamba) ----
  function suola(V, S, so, det, bordo, tagli) {
    var K = V.K, bb = scatola(S.suola), bs = bordo || K.mix(so, "#12060c", K.lum(so) > 0.7 ? 0.45 : 0.55);
    var s = riempi(K, S.dS, so, bs) + "<g clip-path='" + ritaglio(K, S.dS) + "'><rect x='" + K.n1(bb[0] - 4) + "' y='" + K.n1(bb[1] - 4) + "' width='" + K.n1(bb[2] - bb[0] + 8) + "' height='" + K.n1(bb[3] - bb[1] + 8) + "' fill='" + K.luce() + "'/>" +
      K.El((bb[0] + bb[2]) / 2 + V.l * 6, bb[3], (bb[2] - bb[0]) / 2, 4, K.soft(K.mix(so, "#000000", 0.6), 0.4)) + (det || "") + "</g>";
    return dentroA(K, tagli === undefined ? [tagliaGamba(V)] : tagli, s);
  }
  // ---- la tomaia: tinta unita col bordo scuro fuori, poi luce da sinistra e volumi morbidi ritagliati sulla sagoma ----
  // c = { colore, bordo, fodera (dentro il collo), lucida (0-1), collo: false (niente anello), anello (i punti) }; tagli = poligoni da non coprire
  function tomaia(V, F, S, c, dett, tagli) {
    var K = V.K, l = V.l, tom = c.colore, Lt = K.lum(tom), bb = scatola(S.tomaia);
    var bordo = c.bordo || K.mix(tom, "#12060c", Lt > 0.7 ? 0.42 : 0.55), sc2 = K.mix(tom, "#14080c", 0.62), cl = c.lucida == null ? 0.5 : c.lucida;
    var d = "<rect x='" + K.n1(bb[0] - 6) + "' y='" + K.n1(bb[1] - 4) + "' width='" + K.n1(bb[2] - bb[0] + 12) + "' height='" + K.n1(bb[3] - bb[1] + 8) + "' fill='" + K.luce() + "'/>";
    var ang = V.ang, aL = -l, s = V.s, am = Math.max(F.aThr + 6, F.at * 0.42);
    var p1 = F.sup(F.at * 0.7, 0.4 * aL), p2 = F.sup(am, 0.92 * aL), p3 = F.sup(am, -0.92 * aL), p4 = V.P(F.at * 0.42, F.bc(F.at * 0.42), V.lift(F.at * 0.42) + F.t + 2);
    d += K.ElR(p1[0], p1[1], 10 * s, 6, ang, K.soft("#ffffff", 0.5 * cl + (Lt < 0.3 ? 0.12 : 0))) + K.ElR(p2[0], p2[1], 20 * s, 7, ang, K.soft("#ffffff", 0.2 * cl + 0.08));
    d += K.ElR(p3[0], p3[1], 24 * s, 8, ang, K.soft(sc2, 0.42)) + K.ElR(p4[0], p4[1], 32 * s, 5, ang, K.soft(sc2, 0.32));
    if (c.collo !== false) {
      var pf = V.W(0, V.rho, V.hf), an = c.anello || V.ring;
      d += K.El(pf[0], pf[1] + 2, V.rho + 4, 6, K.soft(sc2, 0.3));
      var an2 = radi(an, 3);
      d += K.Pa(poli(K, an2), c.fodera || K.mix(tom, "#1a1418", 0.6)) + K.St(K.lisciaChiusa(an2), bordo, 1.3, 0.8);
    }
    d += dett || "";
    var s2 = riempi(K, S.dT, tom, bordo) + "<g clip-path='" + ritaglio(K, S.dT) + "'>" + d + "</g>";
    return dentroA(K, tagli === undefined ? [tagliaGamba(V)] : tagli, s2);
  }

  // ---- la caviglia nuda: non una colonna dritta. Ombre ai lati sopra l'osso (la caviglia si stringe), il tendine davanti,
  // le due ossa (esterna più bassa e più grande, interna più alta) che escono appena dal contorno della gamba ----
  function caviglia(V) {
    var K = V.K, l = V.l, g = K.gIn(918), C = K.C, sk = K.pelle, bordo = K.mix(sk, K.skDD, 0.8);
    var xo = C + l * (g[0] + g[1]), xi = C + l * (g[0] - g[2]), xc = (xo + xi) / 2, s = "";
    function osso(x, y, r, lato) {   // un'ossa che sporge dal lato (lato = +1 verso fuori dal contorno, rispetto a «l»)
      var d = "M" + K.n1(x - lato * 1.2) + " " + K.n1(y - r) + "C" + K.n1(x + lato * r * 1.05) + " " + K.n1(y - r * 0.9) + " " + K.n1(x + lato * r * 1.05) + " " + K.n1(y + r * 0.9) + " " + K.n1(x - lato * 1.2) + " " + K.n1(y + r) + "Z";
      return K.Pa(d, sk) + K.St("M" + K.n1(x - lato * 1.2) + " " + K.n1(y - r) + "C" + K.n1(x + lato * r * 1.05) + " " + K.n1(y - r * 0.9) + " " + K.n1(x + lato * r * 1.05) + " " + K.n1(y + r * 0.9) + " " + K.n1(x - lato * 1.2) + " " + K.n1(y + r), bordo, 1.4, 0.55) +
        K.El(x - lato * 0.4, y - r * 0.3, r * 0.45, r * 0.4, K.soft(K.skL, 0.5)) + K.El(x + lato * r * 0.2, y + r * 0.7, r * 0.8, r * 0.35, K.soft(K.skDD, 0.3));
    }
    // l'ombra ai lati: la gamba sembra restringersi verso la caviglia
    s += K.El(xo - l * 1.5, 902, 7, 34, K.soft(K.skDD, 0.55)) + K.El(xi + l * 1.5, 902, 7, 34, K.soft(K.skDD, 0.45));
    s += K.El(xc - 3, 892, 4, 24, K.soft(K.skL, 0.3));   // la cresta della tibia che si spegne
    s += K.St("M" + K.n1(xc + l * 2) + " 896C" + K.n1(xc + l * 2.5) + " 906 " + K.n1(xc + l * 2) + " 914 " + K.n1(xc + l * 1) + " 922", K.skD, 1.3, 0.2);   // il tendine
    s += osso(xi, 920, 2.6, -l) ;   // l'osso interno (verso l'altra gamba): più alto e piccolo
    s += osso(xo, 931, 3.4, l);     // l'osso esterno: più basso e più grande
    return s;
  }
  // ---- il piede nudo (sandali, infradito, ballerine, tacchi, zeppe, pantofole): pelle, collo del piede e dita ----
  // o: corto (quanto è più corto della suola), stretto (larghezza rispetto alla suola), su (quota della pianta), dita (true/false)
  function piedeNudo(V, o) {
    o = o || {};
    var K = V.K, l = V.l, Fs = V.F, sk = K.pelle, g = V.g;
    var cP = V.collo(Math.max(g[1], g[2]) + 0.5, 945.5, 4, (g[1] - g[2]) / 2);
    var aG = cP.R / V.s * 0.92;
    var F = forma(V, { dietro: Fs.ah - 4, avanti: Fs.at - (o.corto == null ? 5 : o.corto), larga: Fs.wb * (o.stretto || 0.84), Rt: Fs.wb * 0.84, kt: 2.3, storta: 5, suola: o.su != null ? o.su : Fs.t, gola: aG, hGola: cP.hf,
      dorso: [[aG, 1], [aG + 8, 0.84], [34, 0.58], [44, 0.4], [52, 0.27], [60, 0.16], [Fs.at, 0.05]], nE: 2.4 });
    var S = sagome(V, F, { anello: cP.P, da: aG * 0.8 });
    var bordo = K.mix(sk, K.skDD, 0.8), bb = scatola(S.tomaia), ang = V.ang, aL = -l, s = V.s;
    var d = "<rect x='" + K.n1(bb[0] - 6) + "' y='" + K.n1(bb[1] - 6) + "' width='" + K.n1(bb[2] - bb[0] + 12) + "' height='" + K.n1(bb[3] - bb[1] + 12) + "' fill='" + K.luce() + "'/>";
    var p1 = F.sup(F.at * 0.5, 0.3 * aL), p2 = F.sup(F.at * 0.45, -0.9 * aL), p3 = V.P(F.at * 0.55, F.bc(F.at * 0.55), V.lift(F.at * 0.55) + F.t + 1);
    d += K.ElR(p1[0], p1[1], 14 * s, 6, ang, K.soft(K.skL, 0.45)) + K.ElR(p2[0], p2[1], 22 * s, 7, ang, K.soft(K.skDD, 0.35)) + K.ElR(p3[0], p3[1], 26 * s, 4, ang, K.soft(K.skDD, 0.3));
    // l'osso della caviglia (appena)
    var mo = V.W(l > 0 ? cP.R * 0.7 : -cP.R * 0.7, 2, cP.hf - 8);
    d += K.El(mo[0], mo[1], 5, 4, K.soft(K.skL, 0.25));
    var dita = "";
    if (o.dita !== false) {
      // cinque dita: dal mignolo (più lontano) all'alluce (più vicino)
      var D = [[0, -0.6, 6.3, 16], [3.2, -0.14, 4.3, 12.5], [6.6, 0.2, 3.9, 11.5], [10.6, 0.5, 3.6, 10], [15.2, 0.78, 3.4, 9]];
      for (var k = 4; k >= 0; k--) {
        var q = D[k], at = F.at - q[0], r = q[2] * (K.m ? 1 : 0.92) * (o.ditaS || 1), a0 = at - q[3], bt = q[1], b = F.bc(at) + F.w(at - q[3] * 0.4) * (bt < 0 ? F.ki : 1) * bt * 1.02;
        var h0 = V.lift(at - q[3]) + F.t + r * 0.85, h1 = V.lift(at) + F.t + r * 0.8;
        var P0 = V.P(a0, b, h0), P1 = V.P(at - r * 0.9, b, h1), Pm = [(P0[0] + P1[0]) / 2, (P0[1] + P1[1]) / 2];
        var dd = K.limb([[P0[0], P0[1], r * 2 * s], [Pm[0], Pm[1], r * 2 * s * 1.02], [P1[0], P1[1], r * 1.9 * s]], 0.9);
        dita += riempi(K, [dd], sk, bordo, 2);
        var cd = ritaglio(K, [dd]), un = V.P(at - r * 1.2, b, h1 + r * 0.55);
        dita += "<g clip-path='" + cd + "'>" + K.El(P0[0] - 1.2, P0[1] - 1, r * s * 0.9, r * 0.8, K.soft(K.skL, 0.35)) + K.El(P0[0] + l * r * s * 0.8, P0[1] + 1, r * s, r, K.soft(K.skDD, 0.35)) + K.El(P0[0], P0[1] - r * 1.2, r * s * 1.4, r * 0.7, K.soft(K.skDD, 0.4)) + "</g>";
        dita += K.ElR(un[0], un[1], r * s * 0.55, r * 0.42, ang, K.mix(sk, "#fff4ec", 0.42), " stroke='" + K.mix(sk, K.skDD, 0.5) + "' stroke-width='.5'");
      }
    }
    // la pelle del piede prende la stessa ombra della gamba alla caviglia e la perde piano scendendo: nessun salto di colore
    var yA = 1e9, yB = -1e9; cP.lip.forEach(function (q) { yA = Math.min(yA, q[1]); yB = Math.max(yB, q[1]); });
    var gr = K.LG("pfg" + (nC++), 0, yA - 6, 0, yB + 20, [[0, K.skDD, 0.15], [0.5, K.skDD, 0.08], [1, K.skDD, 0]], true);
    d += "<rect x='" + K.n1(bb[0] - 6) + "' y='" + K.n1(yA - 8) + "' width='" + K.n1(bb[2] - bb[0] + 12) + "' height='" + K.n1(yB - yA + 30) + "' fill='" + gr + "'/>";
    var corpo = riempi(K, S.dT, sk, bordo) + "<g clip-path='" + ritaglio(K, S.dT) + "'>" + d + "</g>";
    return { svg: caviglia(V) + dentroA(K, [tagliaGamba(V, cP.lip, 0.4)], corpo) + dita, F: F, collo: cP, S: S };
  }
  // l'apertura di una scarpa bassa (ballerine, décolleté, pantofole): un giro sulla forma F (davanti a «aV», ai lati a quota hL
  // sopra la suola, dietro hD), con la curva davanti che scende verso la punta di «dU»
  function apertura(V, F, aV, dU, hL, hD) {
    var P = [], A2 = [], i, a, bt;
    function m(q, aa) { P.push(q); A2.push(aa); }
    for (i = 0; i <= 12; i++) { bt = 1 - 2 * i / 12; a = aV + dU * (1 - bt * bt); var hs = F.hsup(a, bt * 0.999) + 0.6, hE = F.t + lerp(hD, hL, sm((a + F.ah) / (aV + F.ah))), q4 = Math.pow(Math.abs(bt), 3); m(V.P(a, F.b(a, bt), hs + (hE - hs) * q4), a); }
    for (a = aV - 3; a > -F.ah + 5; a -= 4) m(V.P(a, F.bc(a) - F.w(a) * F.ki * 1.01, V.lift(a) + F.t + lerp(hD, hL, sm((a + F.ah) / (aV + F.ah)))), a);
    for (i = 0; i <= 6; i++) { var an = Math.PI * (0.5 + i / 6); m(V.P(-F.ah + 3, F.bc(-F.ah) + Math.sin(an) * -F.w(-F.ah + 6), V.lift(-F.ah + 3) + F.t + hD), -F.ah + 3); }
    for (a = -F.ah + 5; a < aV - 3; a += 4) m(V.P(a, F.bc(a) + F.w(a) * 1.01, V.lift(a) + F.t + lerp(hD, hL, sm((a + F.ah) / (aV + F.ah)))), a);
    // il bordo che si vede (davanti e ai lati, fino alla caviglia): fuori dal tallone verso la punta, la curva davanti, dentro all'indietro
    var n = P.length, fuori = [], dentro = [];
    for (i = n - 1; i > 12; i--) { if (A2[i] < -6) break; fuori.unshift(P[i]); }
    for (i = 13; i < n; i++) { if (A2[i] < -6) break; dentro.push(P[i]); }
    P.a = A2; P.bordo = fuori.concat(P.slice(0, 13)).concat(dentro);
    return P;
  }

  // =====================================================================================
  //  LE SCARPE
  // =====================================================================================
  // ---- SNEAKERS: suola bianca alta, punta di gomma, lacci, linguetta, collo imbottito ----
  A.pezzo("scarpe", "sneakers", function (K) {
    var sc = K.scarpe, chiara = K.lum(sc) > 0.7, so = "#f3f2ec", lacci = chiara ? "#a9adb6" : "#f6f6f2", sd = K.scuro(sc, chiara ? 0.3 : 0.4), sl = K.chiaro(sc, 0.4);
    return A.duePiedi(K, function (l) {
      var V = vista(K, l, { suola: 9, larga: 25.5, avanti: 74, Rt: 25, kt: 2.2, alto: -6 }), F = V.F, S = sagome(V, F), T = "", su = "", sp = "", i, a;
      // la punta di gomma (colore della suola)
      var f1 = F.orma(F.t - 0.5, 9, F.at * 0.64, F.at), f2 = F.orma(F.t + 5, 9, F.at * 0.64, F.at).reverse();
      T += K.Pa(poli(K, f1.concat(f2)), so) + K.St(lis(K, f2.slice().reverse()), K.mix(so, "#000000", 0.22), 0.9, 0.5);
      // il fianco: una cucitura che gira dal tallone verso la punta
      T += K.St(lis(K, F.riga(F.aThr * 0.3, 50, 0.8, 0, 10)), sd, 1, 0.4, TR) + K.St(lis(K, F.riga(F.aThr * 0.3, 50, -0.8, 0, 10)), sd, 1, 0.3, TR);
      // i bordi dei lacci e i lacci
      var e1 = F.riga(F.aThr + 1, 45, -0.42, 0, 8), e2 = F.riga(F.aThr + 1, 45, 0.42, 0, 8);
      T += K.Pa(poli(K, e1.concat(e2.slice().reverse())), K.mix(sc, "#000000", 0.1), " opacity='.6'") + K.St(lis(K, e1), sd, 1.1, 0.5) + K.St(lis(K, e2), sd, 1.1, 0.5);
      for (i = 0; i < 4; i++) {
        a = F.aThr + 5 + i * 6.3;
        var q1 = F.sup(a, -0.36, 0.8), q2 = F.sup(a + 1, 0, 1.6), q3 = F.sup(a, 0.36, 0.8);
        T += K.St(lis(K, rif([q1, q2, q3], 0, 1.4)), "#000000", 2.4, 0.16) + K.St(lis(K, [q1, q2, q3]), lacci, 2.1, 0.95) + K.El(q1[0], q1[1], 1.1, 1.1, sd) + K.El(q3[0], q3[1], 1.1, 1.1, sd);
      }
      // forellini sulla punta
      for (i = 0; i < 3; i++) for (var j = 0; j < 4; j++) { var p = F.sup(F.at * 0.73 + i * 3.4, -0.42 + j * 0.28); T += K.El(p[0], p[1], 0.7, 0.55, sd, " opacity='.4'"); }
      // il collo imbottito: il bordo davanti un po' più chiaro
      T += K.St(lis(K, V.labbroC), sl, 1.5, 0.45);
      // la suola: la riga del battistrada
      su += K.St(lis(K, catene(F.orma(F.t * 0.4, 24)).basso), K.mix(so, "#000000", 0.25), 0.9, 0.55);
      // la linguetta: sale sopra il collo, davanti alla gamba
      var aT = F.aThr, b0 = F.bc(aT), wT = F.w(aT) * 0.3;
      var lg = [F.sup(aT + 6, -0.34), V.P(aT - 1, b0 - wT, V.hf + 2), V.P(aT - 2.5, b0 - wT * 0.4, V.hf + 6), V.P(aT - 2.5, b0 + wT * 0.4, V.hf + 6), V.P(aT - 1, b0 + wT, V.hf + 2), F.sup(aT + 6, 0.34)];
      var dl = K.lisciaChiusa(lg);
      sp += riempi(K, [dl], chiara ? K.mix(sc, "#d8dbe2", 0.35) : K.chiaro(sc, 0.1), K.mix(sc, "#12060c", chiara ? 0.36 : 0.55), 2.2);
      sp += "<g clip-path='" + ritaglio(K, [dl]) + "'>" + K.El(lg[2][0] - 1.5, lg[2][1] + 2, wT * V.s * 0.8, 3, K.soft("#ffffff", 0.45)) + K.El(lg[0][0], lg[0][1], wT * V.s * 2.2, 4, K.soft("#000000", 0.22)) + "</g>";
      var r1 = F.sup(aT + 4, -0.34, 1.4), r2 = F.sup(aT + 4.8, 0, 2.2), r3 = F.sup(aT + 4, 0.34, 1.4);
      sp += K.St(lis(K, [r1, r2, r3]), lacci, 2.1, 0.95);
      return ombraTerra(V, F) + suola(V, S, so, su) + tomaia(V, F, S, { colore: sc, lucida: 0.45, fodera: K.mix(sc, "#262630", chiara ? 0.75 : 0.5) }, T) + sp;
    });
  });

  // ---- ELEGANTI: punta a mandorla lucida, suola sottile, lacci chiusi, mascherina sulla punta ----
  A.pezzo("scarpe", "eleganti", function (K) {
    var sc = K.scarpe, lu = K.lum(sc) > 0.6, sd = K.scuro(sc, 0.45), sole = K.scuro(sc, 0.68);
    return A.duePiedi(K, function (l) {
      var V = vista(K, l, { suola: 4, larga: 23.5, avanti: 78, Rt: 30, kt: 1.65, storta: 2, alto: -9, anello: 1.6 }), F = V.F, S = sagome(V, F), T = "", su = "", i;
      // la mascherina sulla punta (cucitura che gira)
      T += K.St(lis(K, F.giro(F.at * 0.7, -1, 1, 0.3, 12)), sd, 1.1, 0.6) + K.St(lis(K, F.giro(F.at * 0.7 - 1.6, -1, 1, 0.3, 12)), K.chiaro(sc, 0.3), 0.7, 0.4);
      // la gola coi lembi dei lacci e i lacci chiusi
      var e1 = F.riga(F.aThr, F.aThr + 20, -0.3, 0.4, 6), e2 = F.riga(F.aThr, F.aThr + 20, 0.3, 0.4, 6);
      T += K.St(lis(K, e1), sd, 1.1, 0.65) + K.St(lis(K, e2), sd, 1.1, 0.65);
      T += K.St(lis(K, [F.sup(F.aThr + 20, -0.3), F.sup(F.aThr + 21, -0.7), F.sup(F.aThr + 18, -1)]), sd, 0.9, 0.45) + K.St(lis(K, [F.sup(F.aThr + 20, 0.3), F.sup(F.aThr + 21, 0.7), F.sup(F.aThr + 18, 1)]), sd, 0.9, 0.45);
      for (i = 0; i < 3; i++) { var a = F.aThr + 4 + i * 5.4; T += K.St(lis(K, [F.sup(a, -0.26, 0.8), F.sup(a + 0.6, 0, 1.2), F.sup(a, 0.26, 0.8)]), K.mix(sc, lu ? "#3a2c24" : "#f0e6d8", 0.5), 1.4, 0.85); }
      // la lucidatura: un riflesso netto sulla punta
      var r0 = F.sup(F.at * 0.82, -0.3 * l, 0.4), r1 = F.sup(F.at * 0.7, -0.42 * l, 0.4), r2 = F.sup(F.at * 0.58, -0.5 * l, 0.4);
      T += K.ElR(r1[0], r1[1], 9 * V.s, 3.2, V.ang, K.soft("#ffffff", lu ? 0.5 : 0.7)) + K.St(lis(K, [r2, r1, r0]), "#ffffff", 1.4, lu ? 0.3 : 0.5);
      // il guardolo: la riga cucita della suola
      su += K.St(lis(K, catene(F.orma(F.t * 0.55, 24)).basso), K.chiaro(sole, 0.4), 0.8, 0.6, TR);
      return ombraTerra(V, F) + suola(V, S, sole, su) + tomaia(V, F, S, { colore: sc, lucida: 1, fodera: K.mix(sc, "#3a2a20", 0.5) }, T);
    });
  });

  // ---- STIVALI, stivaletti e anfibi: il gambale (sopra i pantaloni) e il piede di tre quarti attaccato sotto ----
  // o: top (dove finisce il gambale), agio, tacco, suola, larga, avanti, kt, Rt, fondo (colore della suola), lucida,
  //    dett(l, cx, w, sc) = dettagli del gambale, piede(V, F, sc) = dettagli sul piede, dettSuola(V, F)
  function stivale(K, o) {
    var sc = K.scarpe, C = K.C, Lt = K.lum(sc), id = o.id;
    return A.duePiedi(K, function (l) {
      var g0 = K.gIn(944), ag = o.agio, agI = ag * 0.8, agC = o.agioC != null ? o.agioC : ag * 0.7, fo = g0[1] + agC, fi = g0[2] + agC * 0.8;
      var V = vista(K, l, { suola: o.suola, larga: o.larga || 26, avanti: o.avanti || 74, Rt: o.Rt, kt: o.kt, tacco: o.tacco, fusto: (fo + fi) / 2, fustoX: (fo - fi) / 2, labbro: o.labbro || 950, alto: 2, storta: o.storta == null ? 2.5 : o.storta, dorso: o.dorso, nE: o.nE });
      var F = V.F, xo = C + l * (g0[0] + fo), xi = C + l * (g0[0] - fi), yl = yDi(V.labbroC, V.xc);
      // il piede si allarga piano dal gambale (niente gradino alla caviglia)
      var S = sagome(V, F, { piu: [[xo, yl - 16], [xi, yl - 16], [xo, yl - 8], [xi, yl - 8]] }), s = "";
      // il gambale: dalla quota top fino dentro il piede, colorato come il piede (tinta unita, luce da sinistra, volumi morbidi)
      var gt0 = K.gIn(o.top), gm = K.gIn((o.top + 940) / 2), cx = C + l * gm[0], w = gm[1] + ag + 4, ym = (o.top + 944) / 2, hh = (944 - o.top) / 2;
      // il gambale si stringe piano verso la caviglia (non è un tubo)
      var pO = [], pI = [], yy, tt, gy, aa;
      for (yy = o.top; yy <= 960; yy += 6) { tt = sm((yy - o.top) / (944 - o.top)); aa = lerp(ag, agC, tt) + (o.gonfia || 0) * Math.sin(Math.PI * Math.min(1, (yy - o.top) / (944 - o.top))); gy = K.gIn(yy); pO.push([C + l * (gy[0] + gy[1] + aa), yy]); pI.push([C + l * (gy[0] - gy[2] - aa * 0.8), yy]); }
      var d = poli(K, pO.concat(pI.reverse())), bo = K.mix(sc, "#0c0408", Lt > 0.7 ? 0.62 : 0.6), sc2 = K.mix(sc, "#14080c", 0.62);
      s += riempi(K, [d], sc, bo, 3.4) + "<g clip-path='" + ritaglio(K, [d]) + "'>";
      s += "<rect x='" + K.n1(cx - w - 10) + "' y='" + o.top + "' width='" + K.n1(2 * w + 20) + "' height='" + (962 - o.top) + "' fill='" + K.luce() + "'/>";
      s += K.El(cx - w * 0.42, ym, w * 0.26, hh * 1.05, K.soft("#ffffff", (o.lucida == null ? 0.6 : o.lucida) * 0.3 + 0.1)) + K.El(cx + w * 0.72, ym + 6, w * 0.32, hh * 1.1, K.soft(sc2, 0.42));
      s += K.El(cx, o.top + 8, w, 10, K.soft("#000000", 0.26));
      if (o.gonfia) s += K.El(cx - w * 0.98, ym + 10, 7, hh * 1.05, K.soft(sc2, 0.26)) + K.El(cx + w * 0.98, ym + 10, 8, hh * 1.05, K.soft(sc2, 0.5)) + K.El(cx - w * 0.3, ym - 10, 3.2, hh * 0.8, K.soft("#ffffff", 0.2));
      // la caviglia segnata: il gambale si stringe (ombre ai lati), qualche piega, il malleolo
      var ga = K.gIn(930), xa = C + l * ga[0], wa = (ga[1] + ga[2]) / 2 + agC, xao = xa + l * (ga[1] - ga[2]) / 2;
      s += K.El(xao - wa, 928, 7, 24, K.soft(sc2, 0.5)) + K.El(xao + wa, 928, 7, 24, K.soft(sc2, 0.5));
      s += K.St("M" + K.n1(xao - wa * 0.8) + " 918C" + K.n1(xao - wa * 0.3) + " 923 " + K.n1(xao + wa * 0.3) + " 923 " + K.n1(xao + wa * 0.8) + " 918", K.scuro(sc, 0.45), 1.2, 0.4) + K.St("M" + K.n1(xao - wa * 0.8) + " 926C" + K.n1(xao - wa * 0.3) + " 931 " + K.n1(xao + wa * 0.3) + " 931 " + K.n1(xao + wa * 0.8) + " 926", K.scuro(sc, 0.5), 1.2, 0.35);
      s += K.El(xao + l * wa * 0.45, 936, 4.5, 6, K.soft("#ffffff", 0.3));
      // le cuciture del gambale: una sul lato di fuori e una dentro (punti a filo), la fascia con il filo in cima, le pieghe alla caviglia
      var sO = [], sI = [], sCh = Lt > 0.5 ? K.scuro(sc, 0.5) : K.chiaro(sc, 0.42);
      for (yy = o.top + 12; yy <= 934; yy += 8) { tt = sm((yy - o.top) / (944 - o.top)); aa = lerp(ag, agC, tt) + (o.gonfia || 0) * Math.sin(Math.PI * Math.min(1, (yy - o.top) / (944 - o.top))); gy = K.gIn(yy); sO.push([C + l * (gy[0] + gy[1] + aa) - l * 5.5, yy]); sI.push([C + l * (gy[0] - gy[2] - aa * 0.8) + l * 5, yy]); }
      s += K.St(lis(K, sO), K.scuro(sc, 0.55), 1.5, 0.35) + K.St(lis(K, sO), sCh, 1.1, 0.7, TR) + K.St(lis(K, sI), K.scuro(sc, 0.55), 1.4, 0.28) + K.St(lis(K, sI), sCh, 1, 0.55, TR);
      var wB = (gt0[1] + gt0[2]) / 2 + ag * 0.9, cB = C + l * gt0[0] + l * (gt0[1] - gt0[2]) / 2;
      s += K.Pa("M" + K.n1(cB - wB - 6) + " " + (o.top + 3) + "L" + K.n1(cB + wB + 6) + " " + (o.top + 3) + "L" + K.n1(cB + wB + 6) + " " + (o.top + 12) + "C" + K.n1(cB + wB * 0.4) + " " + (o.top + 15) + " " + K.n1(cB - wB * 0.4) + " " + (o.top + 15) + " " + K.n1(cB - wB - 6) + " " + (o.top + 12) + "Z", K.mix(sc, Lt > 0.5 ? "#000000" : "#ffffff", 0.1), " opacity='.55'") +
        K.St("M" + K.n1(cB - wB) + " " + (o.top + 10) + "C" + K.n1(cB - wB * 0.4) + " " + (o.top + 14) + " " + K.n1(cB + wB * 0.4) + " " + (o.top + 14) + " " + K.n1(cB + wB) + " " + (o.top + 10), sCh, 1, 0.65, TR);
      s += K.St("M" + K.n1(xao - wa * 0.9) + " 907C" + K.n1(xao - wa * 0.2) + " 915 " + K.n1(xao + wa * 0.4) + " 913 " + K.n1(xao + wa * 0.9) + " 904", K.scuro(sc, 0.55), 2.2, 0.28) + K.St("M" + K.n1(xao - wa * 0.8) + " 911C" + K.n1(xao - wa * 0.2) + " 919 " + K.n1(xao + wa * 0.4) + " 917 " + K.n1(xao + wa * 0.8) + " 908", K.chiaro(sc, 0.35), 1.2, 0.22);
      if (o.dett) s += o.dett(l, cx, w, sc);
      s += "</g>";
      // l'orlo in alto del gambale
      var gt = K.gIn(o.top), ct = C + l * gt[0], wt = (gt[1] + gt[2]) / 2 + ag * 0.9, ctx = ct + l * (gt[1] - gt[2]) / 2;
      s += K.El(ctx, o.top + 1, wt, 5, K.scuro(sc, 0.55), " opacity='.85'") + K.St("M" + K.n1(ctx - wt) + " " + (o.top + 1) + "C" + K.n1(ctx - wt * 0.5) + " " + (o.top + 7) + " " + K.n1(ctx + wt * 0.5) + " " + (o.top + 7) + " " + K.n1(ctx + wt) + " " + (o.top + 1), K.chiaro(sc, 0.4), 1.4, 0.7);
      // il piede: davanti al gambale (il gambale resta dietro sopra il collo del piede); una piega morbida alla caviglia
      var T = K.St(lis(K, V.labbroC), sc2, 2.4, 0.18) + K.St(lis(K, rif(V.labbroC, 0, 1.5)), "#ffffff", 1.2, 0.12);
      // il piede ben fatto: punta cucita, colletto del collo del piede, filo della suola, rialzo della punta
      var ch = Lt > 0.5, fil = ch ? K.scuro(sc, 0.4) : K.chiaro(sc, 0.5);
      T += K.St(lis(K, catene(F.orma(F.t + 1.6, 24)).basso), fil, 1.1, ch ? 0.5 : 0.55);
      if (!o.ptSfumata) T += K.St(lis(K, F.giro(F.at * 0.8, -0.95, 0.95, 0.2, 10)), fil, 1, 0.4, TR);
      var ci = F.sup(F.aThr + 4, -0.8, 0.5), cm = F.sup(F.aThr + 8, 0, 1.2), co = F.sup(F.aThr + 4, 0.8, 0.5);
      T += K.St(lis(K, [ci, cm, co]), ch ? K.scuro(sc, 0.5) : K.chiaro(sc, 0.4), 1.4, 0.6);
      var tp = F.sup(F.at * 0.9, 0, 0.2);
      // la calotta della punta: cucitura marcata, fila di punti, la pelle un po' più scura sulla punta
      var cs = F.giro(F.at * 0.7, -0.97, 0.97, 0.3, 12), cs2 = F.giro(F.at * 0.7 + 4.5, -0.9, 0.9, 0.3, 12);
      T += K.St(lis(K, cs), K.scuro(sc, ch ? 0.5 : 0.62), o.ptSfumata ? 1.5 : 2.1, o.ptSfumata ? 0.34 : 0.6) + K.St(lis(K, cs), K.chiaro(sc, 0.3), 0.8, 0.45) + (o.ptSfumata ? "" : K.St(lis(K, cs2), ch ? K.scuro(sc, 0.55) : K.chiaro(sc, 0.5), 1, 0.65, TR));
      if (!o.ptSfumata) T += K.ElR(tp[0] + l * 1, tp[1] + 1, 15 * V.s, 5.5, V.ang, K.soft(K.scuro(sc, 0.6), 0.34));
      T += K.ElR(tp[0] - l * 3, tp[1] - 2.5, 7 * V.s, 2.2, V.ang, K.soft("#ffffff", ch ? 0.26 : 0.3));
      if (o.ptSfumata) { var tq = F.sup(F.at * 0.62, -0.38 * l, 0.5); T += K.ElR(tq[0], tq[1], 11 * V.s, 4.2, V.ang, K.soft("#ffffff", 0.3)); var tr = F.sup(F.at * 0.6, 0.85 * l, 0.5); T += K.ElR(tr[0], tr[1], 14 * V.s, 5, V.ang, K.soft(sc2, 0.4)); }
      if (o.piede) T += o.piede(V, F, sc);
      var taglio = striscia(xi, xo, V.labbroC), tac = "";
      if (o.tacco) {   // il tacco a blocchetto: si vede appena dietro, sotto il tallone
        var ta = -F.ah + 12, tb = F.bc(ta) + F.w(ta) * 0.12, tw = F.w(ta) * 0.88, h0 = V.lift(ta) + 1;
        var tp = [V.P(ta - 5, tb - tw, h0), V.P(ta + 5, tb - tw, h0), V.P(ta + 4, tb - tw * 0.9, 0), V.P(ta - 4, tb - tw * 0.9, 0), V.P(ta - 4, tb + tw * 0.9, 0), V.P(ta + 4, tb + tw * 0.9, 0), V.P(ta - 5, tb + tw, h0)];
        tac = K.Pa(poli(K, hull(tp)), K.scuro(sc, 0.5), " stroke='" + K.scuro(sc, 0.8) + "' stroke-width='1.6'") + K.St(lis(K, [V.P(ta - 4, tb + tw * 0.9, 1.5), V.P(ta + 4, tb + tw * 0.9, 1.5)]), K.chiaro(sc, 0.2), 1, 0.5);
      }
      return ombraTerra(V, F) + tac + suola(V, S, o.fondo || K.scuro(sc, 0.62), o.dettSuola ? o.dettSuola(V, F) : "", null, []) + s + tomaia(V, F, S, { colore: sc, lucida: o.lucida == null ? 0.6 : o.lucida, collo: false }, T, [taglio]);
    });
  }
  A.pezzo("scarpe", "stivali", function (K) {
    return stivale(K, { id: "sv", top: 786, agio: 8, suola: 6, tacco: 7, larga: 27, avanti: 82, kt: 1.75, Rt: 31, nE: 2.1, storta: 3.5, ptSfumata: 1, gonfia: 4.6,
      dorso: [[0, 1], [30, 0.74], [44, 0.56], [56, 0.42], [66, 0.31], [74, 0.2], [80, 0.09], [82, 0]],
      dett: function (l, cx, w, sc) {
        var r = "";
        for (var j = 0; j < 3; j++) r += K.St("M" + K.n1(cx - w + 6) + " " + (900 + j * 9) + "C" + K.n1(cx - w * 0.3) + " " + (905 + j * 9) + " " + K.n1(cx + w * 0.3) + " " + (905 + j * 9) + " " + K.n1(cx + w - 6) + " " + (900 + j * 9), K.scuro(sc, 0.5), 1.4, 0.32);
        r += K.St("M" + K.n1(cx - w + 4) + " 808C" + K.n1(cx - w * 0.2) + " 812 " + K.n1(cx + w * 0.3) + " 812 " + K.n1(cx + w - 5) + " 806", K.scuro(sc, 0.4), 1.2, 0.3);
        return r + K.St("M" + K.n1(cx + l * w * 0.68) + " 800L" + K.n1(cx + l * w * 0.72) + " 950", K.scuro(sc, 0.3), 1, 0.45, TR);
      },
      piede: function (V, F, sc) { return K.St(lis(K, F.giro(F.at * 0.68, -1, 1, 0.3, 12)), K.scuro(sc, 0.35), 1, 0.4); } });
  });
  A.pezzo("scarpe", "stivalialti", function (K) {
    return stivale(K, { id: "sa", top: 738, agio: 2.5, suola: 3.5, tacco: 14, larga: 22.5, avanti: 76, kt: 1.7, Rt: 27, lucida: 0.9, labbro: 948,
      dett: function (l, cx, w, sc) {
        var r = K.St("M" + K.n1(cx + l * (w - 7)) + " 752L" + K.n1(cx + l * (w - 8)) + " 948", K.scuro(sc, 0.45), 1.2, 0.5) + K.St("M" + K.n1(cx + l * (w - 10)) + " 754L" + K.n1(cx + l * (w - 11)) + " 948", K.chiaro(sc, 0.45), 0.8, 0.45);
        r += K.St("M" + K.n1(cx - w + 4) + " 748C" + K.n1(cx - w * 0.2) + " 754 " + K.n1(cx + w * 0.3) + " 754 " + K.n1(cx + w - 5) + " 746", K.scuro(sc, 0.4), 1.2, 0.3);
        return r + K.St("M" + K.n1(cx - w * 0.35) + " 760L" + K.n1(cx - w * 0.4) + " 930", "#ffffff", 3, K.lum(sc) > 0.6 ? 0.18 : 0.26);
      },
      piede: function (V, F, sc) { var r0 = F.sup(F.at * 0.8, -0.35 * V.l), r1 = F.sup(F.at * 0.58, -0.5 * V.l); return K.St(lis(K, [r1, r0]), "#ffffff", 2, K.lum(sc) > 0.6 ? 0.3 : 0.5); } });
  });
  A.pezzo("scarpe", "stivaletti", function (K) {
    return stivale(K, { id: "sl", top: 868, agio: 8, suola: 4.5, tacco: 8, larga: 24, avanti: 75, kt: 1.9,
      dett: function (l, cx, w, sc) {
        var r = ""; for (var j = 0; j < 2; j++) r += K.St("M" + K.n1(cx - w + 5) + " " + (912 + j * 8) + "C" + K.n1(cx - w * 0.3) + " " + (916 + j * 8) + " " + K.n1(cx + w * 0.3) + " " + (916 + j * 8) + " " + K.n1(cx + w - 5) + " " + (912 + j * 8), K.scuro(sc, 0.5), 1.3, 0.32);
        // l'elastico sul fianco
        return r + K.Pa("M" + K.n1(cx + l * w * 0.45) + " 872L" + K.n1(cx + l * w * 0.78) + " 872L" + K.n1(cx + l * w * 0.7) + " 944L" + K.n1(cx + l * w * 0.52) + " 944Z", K.scuro(sc, 0.38), " opacity='.7'");
      } });
  });
  A.pezzo("scarpe", "anfibi", function (K) {
    var giallo = "#e0b64a";
    function lacci(cx, y0, y1, n) {
      var r = "";
      for (var j = 0; j < n; j++) {
        var y = y0 + (y1 - y0) * j / Math.max(1, n - 1);
        r += K.El(cx - 8, y, 2, 2, "#b9b6b0", " stroke='#444' stroke-width='.6'") + K.El(cx + 8, y, 2, 2, "#b9b6b0", " stroke='#444' stroke-width='.6'");
        if (j < n - 1) { var y2 = y + (y1 - y0) / Math.max(1, n - 1); r += K.St("M" + K.n1(cx - 8) + " " + K.n1(y) + "L" + K.n1(cx + 8) + " " + K.n1(y2) + "M" + K.n1(cx + 8) + " " + K.n1(y) + "L" + K.n1(cx - 8) + " " + K.n1(y2), "#f1f0ec", 1.9, 0.92); }
      }
      return r;
    }
    return stivale(K, { id: "an", top: 844, agio: 10, suola: 11, tacco: 0, larga: 27.5, avanti: 74, kt: 2.3, Rt: 26, fondo: "#1d1b1c", lucida: 0.5,
      dett: function (l, cx, w, sc) {
        var r = K.Pa("M" + K.n1(cx - 7) + " 850L" + K.n1(cx + 7) + " 850L" + K.n1(cx + 7) + " 958L" + K.n1(cx - 7) + " 958Z", K.scuro(sc, 0.3), " opacity='.7'") + lacci(cx, 858, 950, 9);
        r += K.St("M" + K.n1(cx - w + 4) + " 850L" + K.n1(cx - w + 3) + " 958", giallo, 1.1, 0.75, TR) + K.St("M" + K.n1(cx + w - 4) + " 850L" + K.n1(cx + w - 3) + " 958", giallo, 1.1, 0.75, TR);
        return r + K.St("M" + K.n1(cx - w + 3) + " 884C" + K.n1(cx - w * 0.3) + " 888 " + K.n1(cx + w * 0.3) + " 888 " + K.n1(cx + w - 3) + " 884", K.scuro(sc, 0.4), 1.2, 0.25);
      },
      piede: function (V, F, sc) {
        var r = K.St(lis(K, F.giro(F.at * 0.66, -1, 1, 0.3, 12)), K.scuro(sc, 0.4), 1.1, 0.5);
        r += K.St(lis(K, catene(F.orma(F.t + 2.5, 24)).basso), giallo, 1.1, 0.8, TR);
        // i lacci continuano sul collo del piede
        var e1 = F.riga(F.aThr - 2, F.aThr + 16, -0.3, 0, 5), e2 = F.riga(F.aThr - 2, F.aThr + 16, 0.3, 0, 5);
        r += K.Pa(poli(K, e1.concat(e2.slice().reverse())), K.scuro(sc, 0.3), " opacity='.6'");
        for (var j = 0; j < 3; j++) { var a = F.aThr + j * 6, p = F.sup(a, -0.28, 0.6), q = F.sup(a, 0.28, 0.6), p2 = F.sup(a + 6, -0.28, 0.6), q2 = F.sup(a + 6, 0.28, 0.6); r += K.El(p[0], p[1], 1.8, 1.6, "#b9b6b0") + K.El(q[0], q[1], 1.8, 1.6, "#b9b6b0"); if (j < 2) r += K.St(lis(K, [p, q2]), "#f1f0ec", 1.8, 0.92) + K.St(lis(K, [q, p2]), "#f1f0ec", 1.8, 0.92); }
        return r;
      },
      dettSuola: function (V, F) { var r = "", B = catene(F.orma(0, 30)).basso; for (var j = 1; j < B.length - 1; j += 2) r += K.St("M" + K.n1(B[j][0]) + " " + K.n1(B[j][1] - 1) + "l0 -4", "#050505", 1.8, 0.7); return r + K.St(lis(K, catene(F.orma(F.t * 0.55, 24)).basso), "#6a6663", 1, 0.55); } });
  });

  // ---- i piedi nudi: sandali, infradito, zeppe ----
  // una cinghia lungo i punti (larghezza w), colore col
  function cinghia(K, pts, w, col) { var d = K.limb(pts.map(function (q) { return [q[0], q[1], w]; })); return riempi(K, [d], col, K.scuro(col, 0.45), 1.6) + K.St(lis(K, pts.map(function (q) { return [q[0] - 0.6, q[1] - w * 0.25]; })), K.chiaro(col, 0.45), 0.7, 0.6); }
  // il cinturino alla caviglia (la metà davanti dell'anello)
  function cavigliera(V, cP, dh) { var P = []; for (var k = 0; k <= 7; k++) { var f = Math.PI * (k / 7), sn = Math.sin(f); P.push(V.W(cP.R * 1.05 * Math.cos(f) + (V.g[1] - V.g[2]) / 2, cP.R * 1.05 * sn, cP.hf - dh + 4 * (1 - sn))); } return P; }
  // (g5) i cinturini hanno un filo chiaro intorno: sulla pelle scura il marrone spariva
  function cinghiaS(K, pts, w, col) { var d = K.limb(pts.map(function (q) { return [q[0], q[1], w]; })); return "<path d='" + d + "' fill='none' stroke='#f6f1e8' stroke-opacity='.85' stroke-width='3.4' stroke-linejoin='round'/>" + cinghia(K, pts, w, col); }
  A.pezzo("scarpe", "sandali", function (K) {
    var sc = K.scarpe, sole = K.scuro(sc, 0.5), oro = "#e0bd52";
    return A.duePiedi(K, function (l) {
      var V = vista(K, l, { suola: 5.5, larga: 26, avanti: 76, Rt: 26, kt: 2.2 }), F = V.F, S = sagome(V, F);
      var p = piedeNudo(V, { corto: 5, stretto: 0.86 }), P = p.F, cP = p.collo, s = "";
      // le cinghie: sulla caviglia (con la fibbia), sul collo del piede, sulle dita, e quella di mezzo che le unisce
      var cav = cavigliera(V, cP, 3);
      s += cinghiaS(K, P.riga(P.aThr - 2, P.aThr + 14, 0, 0.8, 3), 4.6 * V.s, sc);
      s += cinghiaS(K, cav, 5.2 * V.s, sc);
      s += cinghiaS(K, P.giro(P.aThr + 14, -1.02, 1.02, 0.6, 6), 5.6 * V.s, sc) + cinghiaS(K, P.giro(P.at - 22, -1.03, 1.03, 0.8, 6), 5 * V.s, sc);
      var fb = cav[1];   // la fibbia sul lato fuori (per tutti e due i piedi)
      s += "<rect x='" + K.n1(fb[0] - 3) + "' y='" + K.n1(fb[1] - 3.4) + "' width='6' height='6.8' rx='1.4' fill='none' stroke='" + oro + "' stroke-width='1.6'/>" + K.St("M" + K.n1(fb[0]) + " " + K.n1(fb[1] - 3) + "l0 6", "#7a5d12", 1, 0.8);
      var su = K.St(lis(K, catene(F.orma(F.t * 0.5, 24)).basso), K.chiaro(sole, 0.35), 0.8, 0.5);
      return ombraTerra(V, F) + suola(V, S, sole, su) + K.Pa(K.lisciaChiusa(radi(F.orma(F.t, 30), 3)), K.scuro(sc, 0.25)) + p.svg + s;
    });
  });
  A.pezzo("scarpe", "infradito", function (K) {
    var sc = K.scarpe, so = K.chiaro(sc, 0.1);
    return A.duePiedi(K, function (l) {
      var V = vista(K, l, { suola: 9, larga: 27, avanti: 79, Rt: 27, kt: 2.1, tacco: 3 }), F = V.F, S = sagome(V, F);
      var p = piedeNudo(V, { corto: 4, stretto: 0.86, ditaS: 1.45 }), P = p.F;
      var su = K.St(lis(K, catene(F.orma(F.t * 0.45, 24)).basso), K.scuro(sc, 0.4), 1.4, 0.5) + K.St(lis(K, catene(F.orma(F.t * 0.82, 24)).basso), K.chiaro(sc, 0.55), 1.1, 0.5) + K.St(lis(K, catene(F.orma(F.t * 0.12, 24)).basso), K.scuro(sc, 0.5), 1.8, 0.25);
      var pianta = K.Pa(K.lisciaChiusa(radi(F.orma(F.t, 30), 3)), K.chiaro(sc, 0.3));
      // la V: dal paletto tra alluce e secondo dito ai due lati del piede
      var aP = P.at - 15, btP = -0.36, aS = P.aThr + 7;
      // ogni laccio sta sulla pelle del collo del piede: dal paletto (tra alluce e secondo dito) al bordo della suola
      function striscia2(btS) { var Q = []; for (var k = 0; k <= 8; k++) { var t = k / 8; Q.push(P.sup(lerp(aP, aS, t), lerp(btP, btS, Math.pow(t, 0.8)), 0.9)); } return Q; }
      function laccio(Q) { var d = K.limb(Q.map(function (q, k) { return [q[0], q[1], (2.5 + 0.9 * k / (Q.length - 1)) * V.s]; })); return "<path d='" + d + "' fill='none' stroke='" + K.scuro(sc, 0.35) + "' stroke-width='1.4'/>" + K.Pa(d, sc) + K.St(lis(K, rif(Q, -0.4, -1)), K.chiaro(sc, 0.45), 0.8, 0.6); }
      var post = P.sup(aP, btP, 1.4), postB = V.P(aP + 2, P.b(aP + 2, btP), V.lift(aP) + F.t);
      var s = K.St(lis(K, [postB, post]), K.scuro(sc, 0.3), 3.2 * V.s, 1) + laccio(striscia2(1.04)) + laccio(striscia2(-1.04)) + K.El(post[0], post[1], 2.8 * V.s, 2.4, K.scuro(sc, 0.15)) + K.El(post[0] - 0.6, post[1] - 0.7, 1, 0.8, "#ffffff", " opacity='.4'");
      var contatto = K.El(V.xc + l * 1, 998.5, (F.ah + F.at) * V.s * 0.34, 3.2, K.soft("#000000", 0.55));
      return ombraTerra(V, F) + contatto + suola(V, S, so, su) + pianta + p.svg + s;
    });
  });
  A.pezzo("scarpe", "zeppe", function (K) {
    var sc = K.scarpe, sughero = "#c8975a";
    return A.duePiedi(K, function (l) {
      var V = vista(K, l, { suola: 3, larga: 24, avanti: 74, Rt: 24, kt: 2.2, tacco: 20 }), F = V.F, k;
      var p = piedeNudo(V, { corto: 4, stretto: 0.86 }), P = p.F, cP = p.collo, s = "", gamba = [tagliaGamba(V, cP.lip, 0.4)];
      // la zeppa: sotto piatta (a terra), sopra segue il piede
      var fu = [], de = [], n = 30;
      for (k = 0; k <= n; k++) { var a = lerp(-F.ah, F.at, 0.5 - 0.5 * Math.cos(Math.PI * k / n)), w = F.w(a), c = F.bc(a); fu.push(V.P(a, c + w, 0)); de.push(V.P(a, c - w * F.ki, 0)); }
      var Z = radi(hull(fu.concat(de).concat(F.orma(F.t, 30))), 2.4), dZ = K.lisciaChiusa(Z);
      var sg = K.LG("zs" + (l + 1), 0, 0, 1, 1, [[0, "#ddb078"], [0.5, sughero], [1, "#8d6538"]]);
      var bb = scatola(Z), tex = "";
      for (k = 0; k < 14; k++) { var x = bb[0] + (bb[2] - bb[0]) * k / 13; tex += K.St("M" + K.n1(x) + " " + K.n1(bb[1]) + "L" + K.n1(x - 2) + " " + K.n1(bb[3]), "#7a5530", 1, 0.35); }
      var zep = riempi(K, [dZ], sg, "#6e4a26") + "<g clip-path='" + ritaglio(K, [dZ]) + "'>" + tex + K.El((bb[0] + bb[2]) / 2, bb[3], (bb[2] - bb[0]) / 2, 5, K.soft("#000000", 0.3)) + "<rect x='" + K.n1(bb[0]) + "' y='" + K.n1(bb[1]) + "' width='" + K.n1(bb[2] - bb[0]) + "' height='" + K.n1(bb[3] - bb[1]) + "' fill='" + K.luce() + "'/></g>";
      // la soletta (colore della scarpa) sopra la zeppa
      zep += K.Pa(K.lisciaChiusa(radi(F.orma(F.t, 30), 3)), K.scuro(sc, 0.15)) + K.St(lis(K, catene(F.orma(F.t, 30)).basso), K.scuro(sc, 0.4), 1.2, 0.8);
      // la fascia larga sul collo del piede, quella sulle dita e il cinturino alla caviglia
      s += cinghia(K, P.giro(P.aThr + 19, -1.03, 1.03, 0.8, 6), 8.5 * V.s, sc) + cinghia(K, P.giro(P.at - 21, -1.03, 1.03, 0.8, 6), 5.5 * V.s, sc);
      s += cinghia(K, cavigliera(V, cP, 3), 4.4 * V.s, sc);
      return ombraTerra(V, F) + dentroA(K, gamba, zep) + p.svg + s;
    });
  });

  // ---- le scarpe basse col collo del piede scoperto: ballerine, décolleté (tacchi), pantofole ----
  // o: suola, tacco, larga, avanti, kt, Rt, storta, aV (dove comincia davanti l'apertura), dU (quanto scende la curva davanti),
  //    hL e hD (altezza della scarpa ai lati e dietro), lucida, fondo (suola), dorso, dett(V, F, Fs, ap), sopra(V, F, Fs, ap), dietro(V, F, sc)
  function bassa(K, o) {
    var sc = K.scarpe;
    return A.duePiedi(K, function (l) {
      var V = vista(K, l, { suola: o.suola, larga: o.larga, avanti: o.avanti, kt: o.kt, Rt: o.Rt, tacco: o.tacco, storta: o.storta }), F = V.F;
      var Fs = forma(V, { suola: o.suola, larga: o.larga, avanti: o.avanti, kt: o.kt, Rt: o.Rt, storta: o.storta, dorso: o.dorso || [[0, 0.9], [V.aThr + 8, 0.84], [34, 0.58], [44, 0.42], [52, 0.3], [60, 0.2], [o.avanti, 0.02]] });
      var p = piedeNudo(V, { dita: false, corto: o.corto == null ? 4 : o.corto, stretto: 0.84 }), gamba = [tagliaGamba(V, p.collo.lip, 0.4)];
      var ap = apertura(V, Fs, o.aV, o.dU, o.hL, o.hD), pz = [[-Fs.ah, Fs.at]], T = [], i;
      pz.forEach(function (r) {
        var up = Fs.orma(Fs.t, 18, r[0], r[1]), b0 = Math.max(o.aV, r[0]), b1 = Math.min(Fs.at, r[1]);
        ap.forEach(function (q, k) { if (ap.a[k] >= r[0] - 3 && ap.a[k] <= r[1] + 3) up.push(q); });
        if (b1 > b0) for (i = 0; i <= 10; i++) { var a = lerp(b0, b1, i / 10); [-1, -0.8, -0.5, -0.2, 0, 0.2, 0.5, 0.8, 1].forEach(function (bt) { up.push(Fs.sup(a, bt)); }); }
        T.push(radi(hull(up), 2.4));
      });
      var Ss = sagome(V, F, { pezzi: pz }), S = { tomaia: T, dT: T.map(function (P) { return K.lisciaChiusa(P); }), suola: Ss.suola, dS: Ss.dS };
      var Td = (o.dett ? o.dett(V, F, Fs, ap) : "") + K.St(lis(K, ap.bordo.slice(2, -3)), K.mix(sc, "#000000", 0.5), 1.5, 0.6);
      // il dietro della scarpa (intorno al tallone) sta dietro la caviglia: dove c'è la gamba non si vede
      var bg = bordiGamba(V, 0.4), gx1 = Math.min(bg[0], bg[1]), gx2 = Math.max(bg[0], bg[1]);
      var apT = ap.map(function (q, k) { return ap.a[k] < 2 && q[0] > gx1 && q[0] < gx2 ? [q[0], Math.min(q[1], yDi(p.collo.lip, q[0]) - 1)] : q; });
      var tom = tomaia(V, Fs, S, { colore: sc, lucida: o.lucida, collo: false }, Td, gamba.concat([apT]));
      return ombraTerra(V, F) + (o.dietro ? dentroA(K, gamba, o.dietro(V, F, sc)) : "") + suola(V, S, o.fondo || K.scuro(sc, 0.55), "", null, gamba) + p.svg + tom + (o.sopra ? o.sopra(V, F, Fs, ap) : "");
    });
  }
  A.pezzo("scarpe", "ballerine", function (K) {
    var sc = K.scarpe;
    return bassa(K, { suola: 3, larga: 26.5, avanti: 76, kt: 1.9, Rt: 29, aV: 38, dU: 5, hL: 9, hD: 8.5, lucida: 0.7,
      sopra: function (V, F, Fs, ap) {
        // il fiocchetto davanti: due anse e un nodino, puliti, sul bordo davanti
        var c = ap[6], sx = V.s * 4.2, sy = 2.9, bo = K.scuro(sc, 0.55), an = V.ang * 0.35;
        function ansa(sg) { return K.ElR(c[0] + sg * sx * 0.95, c[1] - 0.6 - sg * 0.2, sx * 0.9, sy, an + sg * -18, K.chiaro(sc, 0.14), " stroke='" + bo + "' stroke-width='.8'"); }
        return ansa(-1) + ansa(1) + K.El(c[0], c[1] - 0.4, 1.7, 1.6, K.scuro(sc, 0.12), " stroke='" + bo + "' stroke-width='.7'") + K.El(c[0] - 0.5, c[1] - 0.9, 0.7, 0.5, "#ffffff", " opacity='.5'");
      },
      dett: function (V, F, Fs, ap) { return K.St(lis(K, ap.bordo.slice(2, -2).map(function (q) { return [q[0], q[1] + 1.4]; })), K.chiaro(sc, 0.4), 0.8, 0.35); } });
  });
  A.pezzo("scarpe", "tacchi", function (K) {
    var sc = K.scarpe;
    return bassa(K, { suola: 2, larga: 22, avanti: 75, kt: 1.5, Rt: 30, storta: 1.5, tacco: 26, aV: 33, dU: 8, hL: 7, hD: 6, lucida: 1, corto: 6,
      dietro: function (V, F, sc2) {
        // il tacco a spillo, appena dietro sotto il tallone
        var ta = -F.ah + 8, tb = F.bc(ta) - F.w(ta) * 0.72, h0 = V.lift(ta), s = V.s;
        var a = V.P(ta, tb, h0 + 2), b = V.P(ta + 3, tb - 1, 0);
        var d = K.limb([[a[0], a[1], 7 * s], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, 4 * s], [b[0], b[1], 2.4 * s]]);
        return "<path d='" + d + "' fill='none' stroke='" + K.scuro(sc2, 0.6) + "' stroke-width='1.6'/>" + K.Pa(d, K.lum(sc2) < 0.2 ? K.chiaro(sc2, 0.12) : sc2) + K.St(lis(K, [[a[0] - 1.2, a[1] + 2], [b[0] - 0.4, b[1] - 3]]), "#ffffff", 0.9, 0.45) + K.El(b[0], b[1] - 1, 1.6 * s, 1.2, K.scuro(sc2, 0.75));
      },
      dett: function (V, F, Fs, ap) { var r0 = Fs.sup(Fs.at * 0.86, -0.3 * V.l), r1 = Fs.sup(Fs.at * 0.62, -0.5 * V.l); return K.St(lis(K, [r1, r0]), "#ffffff", 1.8, K.lum(sc) > 0.6 ? 0.35 : 0.55); } });
  });
  A.pezzo("scarpe", "pantofole", function (K) {
    var sc = K.scarpe, pelo = K.chiaro(sc, 0.5);
    return bassa(K, { suola: 7, larga: 27, avanti: 74, kt: 2.4, Rt: 28, aV: 33, dU: 3, hL: 17, hD: 8, lucida: 0.2, fondo: K.scuro(sc, 0.45), corto: 6,
      dorso: [[0, 0.9], [26, 0.86], [36, 0.66], [46, 0.5], [56, 0.36], [64, 0.24], [74, 0.02]],
      dett: function (V, F, Fs, ap) {
        var r = "", R = K.rnd(7 + V.l);
        for (var q = 0; q < 14; q++) { var a = lerp(Fs.aThr + 6, Fs.at - 4, R()), bt = R() * 1.8 - 0.9, p = Fs.sup(a, bt); r += K.St("M" + K.n1(p[0]) + " " + K.n1(p[1]) + "l" + K.n1(1.2 + R() * 1.6) + " " + K.n1(-0.6 + R() * 1.6), pelo, 0.8, 0.3); }
        return r;
      },
      sopra: function (V, F, Fs, ap) {
        // il bordo peloso lungo l'apertura (davanti e ai lati)
        var B = ap.bordo, d = lis(K, B), r = K.St(d, K.scuro(sc, 0.2), 7.4, 0.9) + K.St(d, pelo, 6, 0.95), R = K.rnd(3 + V.l);
        for (var i = 0; i < B.length; i += 2) r += K.El(B[i][0] + (R() - 0.5) * 2, B[i][1] + (R() - 0.5) * 2, 2.6, 2.2, K.chiaro(sc, 0.62), " opacity='.8'");
        return r + K.St(d, "#ffffff", 1.4, 0.35);
      } });
  });

  // due piedi: con una funzione (un piede di tre quarti, lato -1 e 1) o, come prima, con un disegno di lato
  var duePiediLato = A.duePiedi;
  A.duePiedi = function (K, una) { return typeof una === "function" ? una(-1) + una(1) : duePiediLato(K, una); };
})();
// PEZZI FATTI (secondo giro, 5 nov 2026, tutte di tre quarti, piedi separati e speculari, gamba che entra nella scarpa):
//   sneakers (rifatte qui: vincono su quelle del motore), eleganti, stivali, stivalialti, stivaletti, anfibi,
//   sandali, infradito, zeppe (piede nudo con le dita), ballerine, tacchi (spillo che si vede sotto l'arco), pantofole.
// A.duePiedi è ridefinita: con una funzione disegna un piede di tre quarti per lato; con un disegno di lato (stringa) fa come prima.
// «pattini» non c'è ancora: prende le sneakers (come prima).
// GIRO 3 (5 nov 2026, aiutante scarpe3): stivali/stivalialti/stivaletti: gambale che si stringe alla caviglia (non più tubo), pieghe, malleolo,
//   punta cucita, colletto del collo del piede, filo della suola; infradito: dita più strette, suola più alta, contatto a terra, lacci sottili;
//   ballerine: curva davanti raccordata ai lati (niente denti), bordo liscio, fiocchetto pulito; sandali/infradito/ballerine: ombra della gamba
//   che sfuma sul piede (nessun gradino di pelle alla caviglia). Copia di sicurezza: aiutanti/scarpe3/scarpe.backup.js
// SOTTO-SCARPE4: stivali con cuciture, fascia in cima, pieghe alla caviglia, calotta della punta; caviglie nude con ombre e ossa.
// 5 nov (scarpe5): stivali (punta tonda, gambale con pancia e ombre), ballerine (piede piu largo e tondo, tallone coperto), infradito (suola spessa a strati, dita piu grandi).


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
  // (leggero, 5 nov 2026) stesso disegno con meno testo. I tratti di questo file (St) non ripetono fill='none' e la punta tonda:
  // li dà UNA volta il gruppo GR che avvolge l'uscita di ogni pezzo del file (in fondo; dentro, ogni riempimento è scritto,
  // quindi non cambia niente). Opacità e spessori con al massimo 3 decimali.
  var GR = "<g fill='none' stroke-linecap='round'>", RX_LN = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
  function op3(v) { var t = "" + Math.round(v * 1000) / 1000; return t.charAt(0) === "0" && t.length > 1 ? t.slice(1) : t; }
  function St(d, c, w, op, x) { return "<path d='" + d + "' stroke='" + c + "' stroke-width='" + op3(w) + "'" + (op != null ? " opacity='" + op3(op) + "'" : "") + (x ? x.replace(RX_LN, "") : "") + "/>"; }
  if (!A) return;
  // numeri arrotondati, separati da spazi (per costruire i tracciati)
  var q = function () { var o = []; for (var i = 0; i < arguments.length; i++) { var v = arguments[i]; o.push(typeof v === "number" ? Math.round(v * 10) / 10 : v); } return o.join(" "); };
  // (leggero, 5 nov 2026) stesso disegno con meno testo: gli stessi numeri di q scritti corti (".5", "-.5", lo spazio solo dove
  // serve: «10-4», «1.5.5») e i tratti uguali (stesso colore, spessore e opacità) di una trama in UN percorso solo
  var nP = false;
  function T1(k, primo) { var neg = k < 0, a = neg ? -k : k, r = a % 10, i = (a - r) / 10, sp = primo || neg || (!i && r && nP) ? "" : " "; nP = r !== 0; return sp + (neg ? "-" : "") + (r ? (i ? i : "") + "." + r : i); }
  function qc() { var o = ""; for (var i = 0; i < arguments.length; i++) o += T1(Math.round(arguments[i] * 10), !i); return o; }
  // T = tratti(); T.add(d, colore, spessore, opacità); … T.svg() (opacità come stroke-opacity: per un tratto è lo stesso).
  // tratti(1) = in ordine: si uniscono solo i tratti uguali DI FILA (dove i tratti si incrociano, es. i raggi del basco, resta tutto com era);
  // tratti(2) = ogni tratto il suo percorso (dove si sovrappongono, es. il pelo del pompon): solo gli attributi uguali una volta nel gruppo
  function corto(v) { return String(v).replace(/^0\./, "."); }
  function tratti(inOrdine) {
    var o = {}, ord = [];
    return {
      add: function (d, c, w, op) { var k = c + "|" + w + "|" + (op == null ? "" : op); if (inOrdine) { var u = ord[ord.length - 1]; if (u && u[0] === k && inOrdine < 2) u[1] += d; else ord.push([k, d]); return; } if (o[k] == null) { o[k] = [k, ""]; ord.push(o[k]); } o[k][1] += d; },
      svg: function () {
        if (!ord.length) return "";
        var N = ["stroke", "stroke-width", "stroke-opacity"], P = ord.map(function (x) { return x[0].split("|"); }), com = [0, 1, 2].map(function (j) { return P.every(function (p) { return p[j] === P[0][j]; }); }), g = "<g fill='none' stroke-linecap='round'";
        function at(j, v) { return v === "" ? "" : " " + N[j] + "='" + (j ? corto(v) : v) + "'"; }
        for (var j = 0; j < 3; j++) if (com[j]) g += at(j, P[0][j]);
        g += ">"; ord.forEach(function (x, i) { g += "<path d='" + x[1] + "'"; for (var j = 0; j < 3; j++) if (!com[j]) g += at(j, P[i][j]); g += "/>"; });
        return g + "</g>";
      }
    };
  }
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
    var R = K.rnd(seme), s = "", lt = K.mix(col, "#ffffff", 0.5), dk = K.mix(col, "#000000", 0.3), i, a, c, sn, t1 = tratti(2), t2 = tratti(2);
    for (i = 0; i < 38; i++) { a = R() * 6.283; c = Math.cos(a); sn = Math.sin(a); t1.add("M" + qc(cx + c * r * 0.78, cy + sn * r * 0.78) + "L" + qc(cx + c * r * (1.1 + R() * 0.25), cy + sn * r * (1.1 + R() * 0.25)), i % 3 ? col : dk, 2.4, 0.95); }
    s += t1.svg() + K.El(cx, cy, r * 1.02, r * 1.02, K.RG("pm" + (cnt++), [[0, lt], [0.55, col], [1, dk]], "cx='.36' cy='.3' r='.8'"));
    for (i = 0; i < 26; i++) { a = R() * 6.283; var d = r * Math.sqrt(R()) * 0.85, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d, b = R() * 6.283; t2.add("M" + qc(x, y) + "l" + qc(Math.cos(b) * 3.4, Math.sin(b) * 3.4), i % 2 ? lt : dk, 1.2, 0.45); }
    return s + t2.svg();
  }
  // un fiore a cinque petali: centro, raggio, colore, giro
  function fiore(K, cx, cy, r, col, rot, cc) {
    var s = "", lt = K.mix(col, "#ffffff", 0.45), dk = K.mix(col, "#000000", 0.28), id = "fl" + (cnt++);
    var g = K.RG(id, [[0, lt], [0.6, col], [1, dk]], "cx='.5' cy='.7' r='.8'");
    s += K.El(cx + 1, cy + 2, r * 1.3, r * 1.3, K.soft("#000000", 0.3));
    // (leggero) il petalo si scrive una volta (in defs) e si usa cinque volte
    var pid = K.id + "LCp" + (cnt++);
    K.D.push("<g id='" + pid + "'>" + K.El(0, -r * 0.62, r * 0.46, r * 0.62, g) + St("M0 " + q(-r * 0.2) + "L0 " + q(-r * 0.95), dk, 0.7, 0.35) + "</g>");
    for (var i = 0; i < 5; i++) {
      var a = rot + i * 72;
      s += "<use href='#" + pid + "' transform='translate(" + q(cx, cy) + ") rotate(" + q(a) + ")'/>";
    }
    s += K.El(cx, cy, r * 0.3, r * 0.3, K.RG("fc" + (cnt++), [[0, "#fff1a8"], [0.7, cc || "#ffc83d"], [1, "#d98a14"]], "cx='.4' cy='.35' r='.7'"));
    return s;
  }
  // una foglia: centro, lunghezza, angolo
  // (leggero) ogni foglia uguale (stessa lunghezza e colore) si scrive una volta (in defs) e si usa con <use>
  function foglia(K, cx, cy, l, rot, col) {
    var M = K.LCfo || (K.LCfo = {}), k = col + "|" + l;
    if (!M[k]) { M[k] = K.id + "LCf" + (cnt++); K.D.push("<g id='" + M[k] + "'>" + foglia0(K, l, col) + "</g>"); }
    return "<use href='#" + M[k] + "' transform='translate(" + q(cx, cy) + ") rotate(" + q(rot) + ")'/>";
  }
  function foglia0(K, l, col) {
    return K.Pa("M0 0C" + q(l * 0.3, -l * 0.34, l * 0.75, -l * 0.3, l, 0) + "C" + q(l * 0.75, l * 0.3, l * 0.3, l * 0.34, 0, 0) + "Z", col) +
      St("M" + q(l * 0.08, 0) + "L" + q(l * 0.85, 0), K.mix(col, "#000000", 0.4), 0.8, 0.5) + K.El(l * 0.4, -l * 0.1, l * 0.25, l * 0.08, K.soft("#ffffff", 0.35));
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
    var tb = tratti();
    for (i = -6; i <= 6; i++) {
      var x0 = i * (W / 5.6);
      tb.add("M" + qc(x0, -118) + "Q" + qc(x0 * 0.92, (T + -118) / 2, x0 * 0.14, T - 12), P.dd, 1.7, 0.2); tb.add("M" + qc(x0 + 2.4, -118) + "Q" + qc(x0 * 0.92 + 2.4, (T + -118) / 2, x0 * 0.14 + 0.6, T - 12), P.l, 1.2, 0.22);
    }
    s += tb.svg() + vol(K, W, T - 14, -104) + "</g>";
    // risvolto a coste
    var cuff = banda(-(W + 1), W + 1, -126, 3, -96, 7);
    s += K.El(0, -127, W, 6, K.soft("#000000", 0.35), "") + K.Pa(cuff, K.cil(P.c, 0.9)) + "<g clip-path='" + K.clip(cuff) + "'>";
    var tc = tratti();
    for (var x = -W; x <= W; x += 5.4) {
      tc.add("M" + qc(x, sag(-126, 3, x, W + 1)) + "L" + qc(x, sag(-96, 7, x, W + 1)), P.dd, 1.6, 0.3); tc.add("M" + qc(x + 2, sag(-126, 3, x, W + 1)) + "L" + qc(x + 2, sag(-96, 7, x, W + 1)), P.l, 1.1, 0.25);
    }
    s += tc.svg() + St("M" + q(-W, -125) + "Q" + q(0, -119, W, -125), P.l, 1.4, 0.55) + St("M" + q(-W, -97.5) + "Q" + q(0, -87, W, -97.5), P.dd, 2.4, 0.4) + "</g>";
    s += pom(K, 0, T - 20, 15, K.mix(P.c, "#ffffff", 0.3), 7);
    return { linea: -98, svg: s };
  });

  // ---------------------------------------------------------------- visiera (solo visiera, a testa scoperta)
  A.pezzo("cappelli", "visiera", function (K) {
    var P = pal(K), W = K.F.cw + 6, s = "";
    var fascia = banda(-W, W, -128, 3, -110, 4);
    s += ombra(K, -92, W, 12, 0.5);
    s += K.El(0, -108, W + 4, 9, K.soft("#000000", 0.35), "");
    s += K.Pa(fascia, K.cil(P.c, 0.9)) + St("M" + q(-W + 1, -126.5) + "Q" + q(0, -120.5, W - 1, -126.5), P.l, 1.4, 0.6);
    // visiera: dritta, larga, con il bordo cucito
    var br = "M" + q(-(W + 8), -110) + "Q" + q(0, -102, W + 8, -110) + "C" + q(W + 14, -103, W + 8, -96, W - 4, -92) + "Q" + q(0, -83, -(W - 4), -92) + "C" + q(-(W + 8), -96, -(W + 14), -103, -(W + 8), -110) + "Z";
    s += K.Pa(br, ver(K, "vi1", P)) + "<g clip-path='" + K.clip(br) + "'>" + K.Pa("M" + q(-(W + 14), -96) + "Q" + q(0, -88, W + 14, -96) + "L" + q(W + 14, -80) + "L" + q(-(W + 14), -80) + "Z", P.dd, " opacity='.6'") +
      K.El(W * 0.7, -100, W * 0.5, 12, K.soft("#000000", 0.3)) + K.El(-W * 0.45, -104, W * 0.4, 5, K.soft("#ffffff", 0.35)) + "</g>";
    s += St("M" + q(-(W + 4), -105) + "Q" + q(0, -97, W + 4, -105), P.l, 0.9, 0.55, " stroke-dasharray='2.4 2.4'");
    s += St("M" + q(-(W - 3), -93.5) + "Q" + q(0, -85.5, W - 3, -93.5), P.dd, 1.2, 0.3);
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
    var idB = K.id + "LCb" + (cnt++);   // (leggero) la tesa una volta sola: la usano il colore e i nove anelli
    K.D.push("<path id='" + idB + "' d='" + brim + "'/>");
    s += "<use href='#" + idB + "' fill='" + K.LG("pg1", 0, 0, 0, 1, [[0, pg.l], [0.5, pg.c], [1, pg.m]]) + "'/><g clip-path='" + K.clip(brim) + "'><g fill='none' stroke='" + pg.d + "' stroke-opacity='.32'>";
    // intreccio della tesa: anelli
    for (i = 0; i < 9; i++) {
      var k = 1 - i * 0.075;
      s += "<use href='#" + idB + "' transform='translate(0 -110) scale(" + q(k, 0.3 + k * 0.7) + ") translate(0 110)' stroke-width='" + q(0.9 / k) + "'/>";
    }
    s += "</g>";
    s += K.El(60, -100, 60, 12, K.soft("#000000", 0.28)) + K.El(-50, -112, 50, 8, K.soft("#ffffff", 0.35)) + K.Pa("M-106 -103C-100 -97 -62 -90 0 -91C62 -90 100 -97 106 -103L106 -96C60 -85 -60 -85 -106 -96Z", pg.dd, " opacity='.25'") + "</g>";
    s += St("M-105 -104C-100 -98 -62 -92 0 -93.5C62 -92 100 -98 105 -104", pg.dd, 1.6, 0.5);
    // calotta
    var cr = "M" + q(-W, -108) + "C" + q(-W - 2, T + 12, -W * 0.82, T - 18, -W * 0.4, T - 21) + "Q" + q(0, T - 24, W * 0.4, T - 21) + "C" + q(W * 0.82, T - 18, W + 2, T + 12, W, -108) + "Q" + q(0, -92, -W, -108) + "Z";
    s += K.Pa(cr, K.LG("pg2", 0.05, 0, 0.95, 1, [[0, pg.l], [0.4, pg.c], [1, pg.d]])) + "<g clip-path='" + K.clip(cr) + "'>";
    var tp = tratti();
    for (i = -7; i <= 7; i++) tp.add("M" + qc(i * 2.2, T - 20) + "Q" + qc(i * W / 7 * 0.85, T + 20, i * W / 6.4, -104), pg.dd, 1, 0.3);
    for (i = 0; i < 9; i++) { var yy = T - 14 + i * ((-104 - (T - 14)) / 8.5); tp.add("M" + qc(-W - 4, yy + 3) + "Q" + qc(0, yy - 4, W + 4, yy + 3), pg.dd, 0.9, 0.28); }
    s += tp.svg() + vol(K, W, T - 20, -104) + "</g>";
    // nastro + nodo
    var nb = banda(-(W + 1), W + 1, -126, 6, -108, 8);
    s += K.Pa(nb, K.cil(nast, 0.9)) + "<g clip-path='" + K.clip(nb) + "'>" + St("M" + q(-W, -121) + "Q" + q(0, -108, W, -121), nl, 1.2, 0.5) + "</g>";
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
    s += "<g clip-path='" + K.clip(brim) + "'>" + St("M" + q(-(W + 22), -105) + "C" + q(-(W + 14), -97, -W * 0.5, -93, 0, -94) + "C" + q(W * 0.5, -93, W + 14, -97, W + 22, -105), P.l, 0.9, 0.5) + "</g>";
    // calotta con la fossetta
    var cr = "M" + q(-(W - 4), -106) + "C" + q(-(W - 3), T + 6, -(W - 9), T - 20, -W * 0.5, T - 26) + "C" + q(-W * 0.3, T - 28, -W * 0.12, T - 15, 0, T - 14) + "C" + q(W * 0.12, T - 15, W * 0.3, T - 28, W * 0.5, T - 26) + "C" + q(W - 9, T - 20, W - 3, T + 6, W - 4, -106) + "Q" + q(0, -94, -(W - 4), -106) + "Z";
    s += K.Pa(cr, dia(K, "bo2", P)) + "<g clip-path='" + K.clip(cr) + "'>";
    // le due pieghe che scendono dalla fossetta
    [-1, 1].forEach(function (sd) {
      s += St("M" + q(sd * W * 0.2, T - 14) + "C" + q(sd * W * 0.3, T + 10, sd * W * 0.34, -130, sd * W * 0.4, -118), P.dd, 7, 0.17) + St("M" + q(sd * W * 0.2, T - 14) + "C" + q(sd * W * 0.3, T + 10, sd * W * 0.34, -130, sd * W * 0.4, -118), P.dd, 1.4, 0.35);
    });
    s += K.El(0, T - 6, W * 0.22, 14, K.soft("#000000", 0.35)) + vol(K, W, T - 22, -104) + "</g>";
    // nastro con una penna
    var nb = banda(-(W - 3.5), W - 3.5, -121, 6, -106, 6);
    s += K.Pa(nb, K.cil(BD, 0.9)) + "<g clip-path='" + K.clip(nb) + "'>" + St("M" + q(-W, -118) + "Q" + q(0, -107, W, -118), K.mix(BD, "#ffffff", 0.35), 1, 0.5) + "</g>";
    var px = W * 0.5, py = sag(-113, 6, px, W);
    s += "<g transform='translate(" + q(px, py) + ") rotate(-18)'>" + K.Pa("M-2 3C0 -10 6 -26 16 -34C18 -22 12 -6 4 5Z", "#f4ecd8") + St("M0 2C4 -10 9 -22 15 -31", "#b8a98a", 0.9, 0.7) + K.Pa("M4 -12C8 -13 11 -12 13 -9C10 -9 7 -10 4 -12Z", "#ffffff", " opacity='.7'") + "</g>";
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
    var ts = tratti(1), tt = tratti();
    for (i = -3; i <= 3; i++) { ts.add("M" + qc(0, T - 8) + "Q" + qc(i * W * 0.4, T + 4, i * W * 0.56, -100), P.dd, 1.2, 0.35); ts.add("M" + qc(1.4, T - 8) + "Q" + qc(i * W * 0.4 + 1.4, T + 4, i * W * 0.56 + 1.4, -100), P.l, 0.8, 0.28); }
    for (i = 0; i < 150; i++) { var x = (R() * 2 - 1) * (W + 10), y = T - 8 + R() * (-98 - T + 8); tt.add("M" + qc(x, y) + "l2.6-2.6", R() < 0.5 ? P.dd : P.l, 0.9, 0.3); }
    s += ts.svg() + tt.svg() + K.El(W * 0.7, -126, W * 0.5, 36, K.soft("#000000", 0.4)) + K.El(-W * 0.5, T + 8, W * 0.45, 12, K.soft("#ffffff", 0.3)) + "</g>";
    s += K.El(0, T - 8, 3.8, 3.2, K.mix(P.c, "#000000", 0.3)) + K.El(-0.8, T - 9, 1.4, 1, K.mix(P.c, "#ffffff", 0.5));
    s += St("M" + q(-(W + 1), -102) + "Q" + q(0, -92, W + 1, -102), P.dd, 1.6, 0.4);
    return { linea: -102, svg: s };
  });

  // ---------------------------------------------------------------- cappello da pescatore
  A.pezzo("cappelli", "pescatore", function (K) {
    var P = pal(K), W = K.F.cw + 6, T = K.top, s = "", i;
    var cr = "M" + q(-W, -110) + "C" + q(-(W - 2), T + 30, -W * 0.8, T - 6, -W * 0.58, T - 12) + "Q" + q(0, T - 19, W * 0.58, T - 12) + "C" + q(W * 0.8, T - 6, W - 2, T + 30, W, -110) + "L" + q(W, -98) + "L" + q(-W, -98) + "Z";
    s += ombra(K, -89, W + 2, 10, 0.55);
    s += K.Pa(cr, dia(K, "pe1", P)) + "<g clip-path='" + K.clip(cr) + "'>" + St("M" + q(-W * 0.9, -120) + "Q" + q(0, -112, W * 0.9, -120), P.dd, 1.1, 0.3, " stroke-dasharray='2.4 2.4'") +
      St("M" + q(-W * 0.8, T + 6) + "Q" + q(0, T - 4, W * 0.8, T + 6), P.dd, 1.1, 0.3, " stroke-dasharray='2.4 2.4'");
    var tq = tratti();
    for (i = -2; i <= 2; i++) tq.add("M" + qc(i * W * 0.22, T - 12) + "L" + qc(i * W * 0.28, -112), P.dd, 1, 0.22);
    s += tq.svg() + vol(K, W, T - 14, -104) + "</g>";
    // due occhielli
    [-1, 1].forEach(function (sd) { var ex = sd * W * 0.74, ey = -134; s += K.El(ex, ey, 4.4, 3.8, P.dd, " opacity='.85'") + K.El(ex, ey, 2.4, 1.9, "#14080c", " opacity='.8'") + St("M" + q(ex - 4, ey + 3) + "Q" + q(ex, ey + 6, ex + 4, ey + 3), P.l, 0.9, 0.5); });
    // tesa che scende tutto intorno
    var br = "M" + q(-W, -112) + "C" + q(-(W + 10), -110, -(W + 22), -105, -(W + 27), -96) + "C" + q(-(W + 23), -90, -W * 0.6, -90, 0, -91.5) + "C" + q(W * 0.6, -90, W + 23, -90, W + 27, -96) + "C" + q(W + 22, -105, W + 10, -110, W, -112) + "Q" + q(0, -100, -W, -112) + "Z";
    s += K.Pa(br, ver(K, "pe2", P)) + "<g clip-path='" + K.clip(br) + "'>" + K.Pa("M" + q(-(W + 30), -98) + "C" + q(-(W + 20), -92, -W * 0.5, -91.5, 0, -93) + "C" + q(W * 0.5, -91.5, W + 20, -92, W + 30, -98) + "L" + q(W + 30, -80) + "L" + q(-(W + 30), -80) + "Z", P.dd, " opacity='.4'") +
      K.El(W + 12, -102, 22, 12, K.soft("#000000", 0.3)) + K.El(-(W + 8), -106, 22, 7, K.soft("#ffffff", 0.3)) + "</g>";
    s += St("M" + q(-(W + 20), -99) + "C" + q(-(W + 14), -94, -W * 0.55, -93.6, 0, -95) + "C" + q(W * 0.55, -93.6, W + 14, -94, W + 20, -99), P.l, 0.9, 0.55, " stroke-dasharray='2.4 2.4'");
    s += St("M" + q(-(W + 12), -105) + "C" + q(-(W + 8), -100.5, -W * 0.55, -99.6, 0, -101) + "C" + q(W * 0.55, -99.6, W + 8, -100.5, W + 12, -105), P.l, 0.9, 0.4, " stroke-dasharray='2.4 2.4'");
    return { linea: -100, svg: s };
  });

  // ---------------------------------------------------------------- basco
  A.pezzo("cappelli", "basco", function (K) {
    var P = pal(K), W = K.F.cw + 6, T = K.top, s = "", i;
    var d = "M" + q(-(W + 6), -112) + "C" + q(-(W + 18), T + 10, -42, T - 18, -4, T - 18) + "C" + q(32, T - 18, W + 28, T - 2, W + 24, -104) + "C" + q(W + 21, -96, W * 0.6, -98, 0, -100) + "C" + q(-W * 0.5, -102, -(W + 2), -104, -(W + 6), -112) + "Z";
    s += ombra(K, -92, W, 10, 0.45);
    s += K.Pa(d, dia(K, "ba1", P)) + "<g clip-path='" + K.clip(d) + "'>";
    // pieghe a raggiera dal gambo
    var tr = tratti(1);
    for (i = -4; i <= 4; i++) {
      var ex = i * (W * 0.42) + 6, ey = -100 + Math.abs(i) * 1.2, dr = "M" + qc(-4, T - 14) + "Q" + qc(-4 + i * 12, T + 12, ex, ey);
      tr.add(dr, P.dd, 3.4, 0.14); tr.add(dr, P.dd, 1, 0.3); tr.add("M" + qc(-2.2, T - 14) + "Q" + qc(-2.2 + i * 12, T + 12, ex + 2.5, ey), P.l, 0.9, 0.3);
    }
    s += tr.svg() + K.El(W * 0.8, -118, W * 0.5, 30, K.soft("#000000", 0.4)) + K.El(-W * 0.55, T + 4, W * 0.5, 14, K.soft("#ffffff", 0.32)) + "</g>";
    // gambo
    s += K.Pa("M-8 " + q(T - 15) + "C-9 " + q(T - 23) + " -1 " + q(T - 24) + " 1 " + q(T - 22) + "C4 " + q(T - 21) + " 2 " + q(T - 15) + " 0 " + q(T - 14) + "Z", P.d) + K.El(-3, T - 20, 2, 1.4, P.l, " opacity='.7'");
    // fascetta di cuoio lungo il bordo
    s += St("M" + q(-(W + 4), -111) + "C" + q(-(W + 1), -104, -W * 0.5, -102, 0, -100.5) + "C" + q(W * 0.6, -98.5, W + 20, -96.5, W + 23, -104), P.dd, 4, 0.85) + St("M" + q(-(W + 4), -112.5) + "C" + q(-(W + 1), -105, -W * 0.5, -103.2, 0, -101.8) + "C" + q(W * 0.6, -100, W + 20, -98, W + 23, -105.5), P.l, 0.9, 0.4);
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
    s += St("M" + q(-W * 0.55, T - 4) + "Q" + q(-W * 0.45, T - 28, -W * 0.18, T - 36), bd, 1.2, 0.55) + St("M" + q(W * 0.55, T - 4) + "Q" + q(W * 0.45, T - 28, W * 0.18, T - 36), bd, 1.2, 0.55) + St("M" + q(0, T - 18) + "Q" + q(2, T - 4, 0, -118), bd, 1.1, 0.4);
    // fascia pieghettata
    var fa = "M" + q(-(W - 2), -105) + "Q" + q(0, -95, W - 2, -105) + "L" + q(W + 4, -136) + "Q" + q(0, -127, -(W + 4), -136) + "Z";
    s += K.Pa(fa, K.LG("ch1", 0, 0, 1, 0, [[0, bm], [0.15, bl], [0.5, b], [0.85, bm], [1, bd]])) + "<g clip-path='" + K.clip(fa) + "'>";
    var tf = tratti();
    for (i = -9; i <= 9; i++) { x = i * W / 8.6; tf.add("M" + qc(x * 0.98, -97) + "L" + qc(x * 1.04, -136), i % 2 ? bd : bm, 1.5, 0.55); }
    s += tf.svg() + K.El(0, -136, W + 4, 5, K.soft("#9aa1b6", 0.35)) + "</g>";
    s += St("M" + q(-(W - 2), -105) + "Q" + q(0, -95, W - 2, -105), bd, 1.4, 0.7);
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
    var pu = "";
    for (var x = -W; x <= W; x += 3.6) for (var y = 0; y < 4; y++) pu += "M" + qc(x + (y % 2) * 1.8, sag(-122, 3, x, W) + y * 4.6) + "h.1";
    s += "<path d='" + pu + "' stroke='" + P.dd + "' stroke-width='1.3' stroke-linecap='round' stroke-opacity='.22'/>";
    s += St("M" + q(-W, -120) + "Q" + q(0, -114, W, -120), bianco, 1.5, 0.7) + St("M" + q(-W, -108.5) + "Q" + q(0, -100.5, W, -108.5), bianco, 1.5, 0.7);
    s += K.El(W * 0.75, -112, W * 0.4, 14, K.soft("#000000", 0.3)) + "</g>";
    s += St("M" + q(-W + 1, -123) + "Q" + q(0, -117, W - 1, -123), P.l, 1.1, 0.55) + St("M" + q(-W + 1, -105.2) + "Q" + q(0, -96.5, W - 1, -105.2), P.dd, 1.8, 0.35);
    return { svg: s };
  });

  // ---------------------------------------------------------------- cuffie musicali
  A.pezzo("cappelli", "cuffie", function (K) {
    var P = pal(K), cw = K.F.cw, T = K.top, s = "";
    var arco = "M" + q(-(cw + 9), -84) + "C" + q(-(cw + 11), T - 4, -cw * 0.5, T - 22, 0, T - 22) + "C" + q(cw * 0.5, T - 22, cw + 11, T - 4, cw + 9, -84);
    // archetto: pelle di sotto, poi il colore, il riflesso
    s += St(arco, "#000000", 13, 0.12, "") + St(arco, "#26262e", 10) + St(arco, ver(K, "cu0", P), 7.2) + St("M" + q(-(cw + 6), -104) + "C" + q(-(cw + 4), T + 2, -cw * 0.45, T - 19, 0, T - 19.4), P.l, 1.8, 0.7) +
      St("M" + q(cw + 12, -104) + "C" + q(cw + 8, T + 2, cw * 0.55, T - 19, 0, T - 19.4), P.dd, 1.6, 0.35);
    // i due padiglioni
    [-1, 1].forEach(function (sd) {
      var cx = sd * (cw + 9), cy = -60;
      s += "<g transform='translate(" + q(cx, cy) + ") rotate(" + q(sd * 5) + ")'>";
      s += K.El(0, 3, 20, 29, K.soft("#000000", 0.35), "");
      s += K.El(-sd * 4, 0, 16, 26, "#2a2a31");
      s += K.El(sd * 1.5, 0, 17, 26, K.LG("cu" + (sd + 2), sd < 0 ? 0 : 1, 0, sd < 0 ? 1 : 0, 1, [[0, P.l], [0.45, P.c], [1, P.d]]));
      s += K.El(sd * 2, 0, 11, 19, P.dd, " opacity='.5'") + K.El(sd * 2.4, -0.5, 9.4, 17.2, K.RG("cur" + (cnt++), [[0, P.c], [1, P.d]], "cx='.4' cy='.3' r='.8'"));
      s += St("M" + q(sd * 2.4 - 6, -8) + "Q" + q(sd * 2.4 - 4, -14, sd * 2.4 + 2, -15), P.l, 1.4, 0.6) + K.El(sd * -5.5, -17, 5, 2.2, "#ffffff", " opacity='.3'");
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
    s += K.Pa(corpo, dia(K, "ba1", P)) + "<g clip-path='" + K.clip(corpo) + "'>" + St("M" + q(-W * 0.4, -118) + "C" + q(-W * 0.45, T + 6, -W * 0.1, T - 8, W * 0.3, T - 12), P.dd, 1.4, 0.3) + St("M" + q(W * 0.2, -112) + "C" + q(W * 0.6, T + 20, W + 8, T + 4, W + 30, T + 22), P.dd, 1.3, 0.28) +
      K.El(W * 0.85, T + 20, W * 0.4, 30, K.soft("#000000", 0.38)) + K.El(-W * 0.5, T + 4, W * 0.45, 14, K.soft("#ffffff", 0.3)) + K.El(0, T - 16, W, 12, K.soft("#ffffff", 0.18)) + "</g>";
    s += pom(K, W + 40, T + 38, 13.5, "#ffffff", 17);
    // fascia di pelo, a ciuffi
    var pelo = "#f7f8fa", pd = "#c9cfdb", pl = "#ffffff", fa = banda(-(W + 2), W + 2, -126, 4, -103, 5), R = K.rnd(23);
    s += K.El(0, -126, W, 5, K.soft("#000000", 0.25), "");
    for (i = 0; i <= 12; i++) { var x = -(W + 1) + i * (2 * W + 2) / 12; s += K.El(x, sag(-126, 4, x, W + 2) - 0.5, 8.4, 7, pelo) + K.El(x, sag(-103, 5, x, W + 2) + 1, 8.6, 7.6, pelo); }
    s += K.Pa(fa, K.LG("ba2", 0, 0, 1, 0, [[0, pd], [0.14, pl], [0.5, pelo], [0.86, pd], [1, "#aab1c2"]]));
    for (i = 0; i <= 12; i++) { x = -(W + 1) + i * (2 * W + 2) / 12; s += K.El(x, sag(-126, 4, x, W + 2) - 0.5, 8.4, 7, K.RG("bp" + (cnt++), [[0, pl], [0.7, pelo], [1, pd]], "cx='.4' cy='.35' r='.8'")) + K.El(x, sag(-103, 5, x, W + 2) + 1, 8.6, 7.6, K.RG("bp" + (cnt++), [[0, pl], [0.7, pelo], [1, pd]], "cx='.4' cy='.3' r='.8'")); }
    s += K.Pa(fa, K.LG("ba3", 0, 0, 1, 0, [[0, pd, 0.7], [0.14, pl, 0.15], [0.5, pelo, 0.05], [0.86, pd, 0.55], [1, "#aab1c2", 0.85]]));
    var tz = tratti();
    for (i = 0; i < 40; i++) { var fx = (R() * 2 - 1) * (W + 2), fy = sag(-114.5, 5, fx, W + 2) + (R() * 2 - 1) * 8; tz.add("M" + qc(fx, fy) + "l" + qc((R() - 0.5) * 5, (R() - 0.5) * 4), i % 2 ? pd : pl, 1.1, 0.55); }
    s += tz.svg();
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
    s += "<g clip-path='" + K.clip(brim) + "'>" + St("M" + q(-(W + 17), -105) + "C" + q(-(W + 10), -97.5, -W * 0.5, -93, 0, -94) + "C" + q(W * 0.5, -93, W + 10, -97.5, W + 17, -105), P.l, 0.9, 0.5) + "</g>";
    var cr = "M" + q(-W, -106) + "C" + q(-(W - 3), -140, -(rw - 1), top + 16, -rw, top) + "A" + q(rw, 7, 0, 0, 1, rw, top) + "C" + q(rw - 1, top + 16, W - 3, -140, W, -106) + "Q" + q(0, -94, -W, -106) + "Z";
    s += K.Pa(cr, K.LG("ci2", 0, 0, 1, 0, [[0, P.m], [0.15, P.l], [0.35, P.c], [0.75, P.d], [1, P.dd]])) + "<g clip-path='" + K.clip(cr) + "'>" +
      St("M" + q(-W * 0.78, -112) + "C" + q(-W * 0.78, -140, -rw * 0.78, top + 14, -rw * 0.76, top + 4), "#ffffff", 3, 0.3) + K.El(W * 0.7, -150, W * 0.3, 50, K.soft("#000000", 0.3)) + "</g>";
    // il piano di sopra
    var tp = "M" + q(-rw, top) + "C" + q(-rw, top - 10, rw, top - 10, rw, top) + "C" + q(rw, top + 10, -rw, top + 10, -rw, top) + "Z";
    s += K.Pa(tp, K.LG("ci3", 0, 0, 1, 1, [[0, P.l], [0.5, P.c], [1, P.m]])) + St("M" + q(-rw + 3, top + 2) + "C" + q(-rw * 0.5, top + 8, rw * 0.5, top + 8, rw - 3, top + 2), P.dd, 0.9, 0.25) + St("M" + q(-rw + 2, top - 1) + "C" + q(-rw * 0.4, top - 7, 0, top - 8, rw * 0.5, top - 6), "#ffffff", 1.2, 0.4);
    // nastro largo
    var nb = banda(-(W - 3), W - 3, -128, 5, -106, 6);
    s += K.Pa(nb, K.cil(BD, 0.9)) + "<g clip-path='" + K.clip(nb) + "'>" + St("M" + q(-W, -126) + "Q" + q(0, -116, W, -126), K.mix(BD, "#ffffff", 0.4), 1.1, 0.5) + "</g>";
    s += St("M" + q(-(W - 3), -106) + "Q" + q(0, -94, W - 3, -106), P.dd, 1.2, 0.35);
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
    s += "<g clip-path='" + K.clip(brim) + "'>" + St("M" + q(-(W + 36), -122) + "C" + q(-(W + 26), -100, -W * 0.5, -92.5, 0, -93.4) + "C" + q(W * 0.5, -92.5, W + 26, -100, W + 36, -122), P.dd, 3.4, 0.5) + St("M" + q(-(W + 36), -125) + "C" + q(-(W + 26), -103, -W * 0.5, -95.6, 0, -96.4) + "C" + q(W * 0.5, -95.6, W + 26, -103, W + 36, -125), P.l, 0.9, 0.5) + "</g>";
    // calotta alta con la fossa in mezzo
    var cr = "M" + q(-(W - 2), -108) + "C" + q(-(W - 1), top + 22, -(W - 6), top + 2, -W * 0.56, top - 2) + "C" + q(-W * 0.36, top - 5, -W * 0.14, top + 16, 0, top + 18) + "C" + q(W * 0.14, top + 16, W * 0.36, top - 5, W * 0.56, top - 2) + "C" + q(W - 6, top + 2, W - 1, top + 22, W - 2, -108) + "Q" + q(0, -96, -(W - 2), -108) + "Z";
    s += K.Pa(cr, dia(K, "cw2", P)) + "<g clip-path='" + K.clip(cr) + "'>";
    [-1, 1].forEach(function (sd) { s += St("M" + q(sd * W * 0.12, top + 16) + "C" + q(sd * W * 0.22, top + 34, sd * W * 0.26, -134, sd * W * 0.3, -120), P.dd, 8, 0.15) + St("M" + q(sd * W * 0.12, top + 16) + "C" + q(sd * W * 0.22, top + 34, sd * W * 0.26, -134, sd * W * 0.3, -120), P.dd, 1.3, 0.35); });
    s += K.El(0, top + 22, W * 0.2, 14, K.soft("#000000", 0.4)) + vol(K, W, top - 4, -104) + "</g>";
    // fascia di cuoio con borchie
    var nb = banda(-(W - 2), W - 2, -122, 5, -108, 6);
    s += K.Pa(nb, K.cil(BD, 0.9)) + "<g clip-path='" + K.clip(nb) + "'>" + St("M" + q(-W, -120) + "Q" + q(0, -111, W, -120), K.mix(BD, "#ffffff", 0.35), 1, 0.45) + "</g>";
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
    s += St(arco, "#000000", 8, 0.14, " transform='translate(0 2)'");
    s += St(arco, vd, 5.2) + St(arco, verde, 3.6) + St(arco, "#8ccf6a", 1, 0.7, " transform='translate(0 -1)'");
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
      s += St("M" + q(bx, ya(bx)) + "L" + q(bx, by), verde2, 1.2) + K.El(bx, by, 3, 3, K.RG("bu" + (cnt++), [[0, "#ffffff"], [1, k % 2 ? "#ffb3c8" : "#fff0a0"]], "cx='.35' cy='.3' r='.8'"));
    });
    return { svg: s };
  });

  // ---------------------------------------------------------------- cerchietto
  A.pezzo("cappelli", "cerchietto", function (K) {
    var P = pal(K), cw = K.F.cw, T = K.top, s = "";
    var rx = cw + 1, cy = -84, ry = cy - (T - 2);
    var arco = "M" + q(-rx, cy) + "A" + q(rx, ry, 0, 0, 1, rx, cy);
    // ombra sui capelli, poi il cerchietto con il suo volume
    s += St(arco, "#000000", 9, 0.16, " transform='translate(1.5 3)'") + St(arco, P.d, 7.4) + St(arco, ver(K, "ce1", P), 5.6);
    s += St("M" + q(-rx + 1.5, cy - 8) + "A" + q(rx - 1, ry - 1, 0, 0, 1, -rx * 0.2, T - 1.4), P.l, 1.6, 0.75);
    s += St("M" + q(rx * 0.3, T - 1) + "A" + q(rx, ry, 0, 0, 1, rx - 1, cy - 12), P.dd, 1.4, 0.3);
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
      return "<g transform='scale(" + sd + " 1)'>" + K.Pa(occhio, g) + "<g clip-path='" + K.clip(occhio) + "'>" + St("M6 -1C16 -14 34 -18 41 -9", P.dd, 5, 0.18) + St("M7 1C20 -6 33 -6 42 -2", P.dd, 1.3, 0.3) + St("M8 -3C18 -13 32 -17 39 -12", P.l, 1.4, 0.55) +
        K.El(34, 2, 16, 12, K.soft("#000000", 0.3)) + "</g></g>";
    }
    var tail = function (sd, g) { return "<g transform='scale(" + sd + " 1)'>" + K.Pa("M2 6C8 18 12 28 14 40L24 36C20 26 12 14 6 2Z", g) + St("M7 8C11 18 15 26 18 34", P.dd, 1.1, 0.3) + "</g>"; };
    s += "<g transform='translate(" + q(cx, cy) + ") rotate(-8) scale(1.4)'>";
    s += tail(1, gr) + tail(-1, gl) + ansa(-1, gl) + ansa(1, gr);
    s += K.Pa("M-8 -2C-8 -12 8 -12 8 -2C8 8 -8 8 -8 -2Z", K.RG("fi3" + (cnt++), [[0, P.l], [0.6, P.c], [1, P.d]], "cx='.4' cy='.3' r='.8'")) + St("M-4 -8C-1 -10 3 -10 5 -7", "#ffffff", 1.3, 0.5);
    s += "</g>";
    return { svg: s };
  });

  /* ---- PEZZI FATTI: berretto, visiera, paglia, borsalino, coppola, pescatore, basco, chef, fascia, cuffie, festa, babbo,
     cilindro, cowboy, fiori, cerchietto, fiocco. Il cappellino lo fa il motore.
     Note: i capelli molto larghi (lunghi, ricci) restano tagliati in piano alla linea del cappello (come col cappellino); cilindro, chef e festa sono alti e nel busto stretto toccano il bordo alto. ---- */
  // (leggero) l'uscita di ogni pezzo di questo file dentro il gruppo GR (vedi St)
  [["cappelli", "berretto"], ["cappelli", "visiera"], ["cappelli", "paglia"], ["cappelli", "borsalino"], ["cappelli", "coppola"], ["cappelli", "pescatore"], ["cappelli", "basco"], ["cappelli", "chef"], ["cappelli", "fascia"], ["cappelli", "cuffie"], ["cappelli", "festa"], ["cappelli", "babbo"], ["cappelli", "cilindro"], ["cappelli", "cowboy"], ["cappelli", "fiori"], ["cappelli", "cerchietto"], ["cappelli", "fiocco"]].forEach(function (tv) {
    var f = A[tv[0]][tv[1]]; if (!f) return;
    A[tv[0]][tv[1]] = function () {
      var r = f.apply(this, arguments);
      if (typeof r === "string") return r ? GR + r + "</g>" : r;
      if (r && typeof r === "object") { var o = {}; for (var k in r) o[k] = typeof r[k] === "string" && r[k] ? GR + r[k] + "</g>" : r[k]; return o; }
      return r;
    };
  });
})();


// ---- accessori ----
(function () {
  var A = window.SGOminoA;
  // ====== OCCHIALI e ORECCHINI (coordinate della testa) ======
  var ORO = ["#fff0b8", "#e8b84a", "#9c6a18"], ARG = ["#ffffff", "#c6cdd8", "#788396"];

  // (leggero, 5 nov 2026) stesso disegno con meno testo. I tratti di questo file (St) non ripetono fill='none' e la punta tonda:
  // li dà UNA volta il gruppo GR che avvolge ogni paio di occhiali e di orecchini (in fondo al file; dentro, ogni riempimento è
  // scritto, quindi non cambia niente). Il contorno di una lente si scrive una volta (in defs) e lo usano colore e montatura.
  var GR = "<g fill='none' stroke-linecap='round'>", RX_LN = /\s*stroke-line(cap|join)=(['"])[^'"]*\2/g;
  function op3(v) { var t = "" + Math.round(v * 1000) / 1000; return t.charAt(0) === "0" && t.length > 1 ? t.slice(1) : t; }
  function St(d, c, w, op, x) { return "<path d='" + d + "' stroke='" + c + "' stroke-width='" + op3(w) + "'" + (op != null ? " opacity='" + op3(op) + "'" : "") + (x ? x.replace(RX_LN, "") : "") + "/>"; }
  var nL = 0;
  function linea(K, d) { var M = K.LAli || (K.LAli = {}); if (!M[d]) { M[d] = K.id + "LAl" + (nL++); K.D.push("<path id='" + M[d] + "' d='" + d + "'/>"); } return M[d]; }
  function usa(id, at) { return "<use href='#" + id + "'" + at + "/>"; }
  function tratto(c, w, op, x) { return " stroke='" + c + "' stroke-width='" + op3(w) + "'" + (op != null ? " stroke-opacity='" + op3(op) + "'" : "") + (x || ""); }
  // gradiente «metallo» (chiaro in alto a sinistra, scuro in basso a destra)
  function metallo(K, id, m) { return K.LG(id, 0, 0, 1, 1, [[0, m[0]], [0.45, m[1]], [1, m[2]]]); }

  // montatura: contorno col suo colore + filo di luce in alto a sinistra
  function mont(K, d, col, w, luce) {
    var id = linea(K, d);
    return usa(id, tratto(K.scuro(col, 0.35), w + 0.9, 0.9)) + usa(id, tratto(col, w)) + usa(id, tratto(luce || K.chiaro(col, 0.55), w * 0.32, 0.55, " transform='translate(-.5 -.6)'"));
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
      s += usa(linea(K, d), " fill='" + lg + "' stroke='none'");
      s += "<g clip-path='" + clipLente + "'><g transform='scale(" + lato + " 1)'>" + (o.dentro || "") +
        St("M-15 12L2 -16", "#ffffff", 5, 0.38 * (o.rif == null ? 1 : o.rif)) + St("M-6 14L10 -10", "#ffffff", 2, 0.28 * (o.rif == null ? 1 : o.rif)) + "</g></g>";
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
      s += St("M" + K.n1(x1) + " " + K.n1(y1) + "C" + K.n1(l * (cw - 6)) + " " + K.n1(y1 - 1) + " " + K.n1(l * (cw - 1)) + " " + K.n1(-80) + " " + K.n1(l * (cw + 1.5)) + " " + K.n1(-79), K.scuro(col, 0.4), w + 0.6, 0.35) +
        St("M" + K.n1(x1) + " " + K.n1(y1) + "C" + K.n1(l * (cw - 6)) + " " + K.n1(y1 - 1) + " " + K.n1(l * (cw - 1)) + " " + K.n1(-80) + " " + K.n1(l * (cw + 1.5)) + " " + K.n1(-79), col, w);
    }
    return s;
  }
  function ponte(K, col, w, R, yy, alto) {
    var P = K.occhiPos, xi = (P.dx - R * P.k) + 0.5, y = P.y + (yy || -4) * P.k, a = alto == null ? -3 : alto;
    var d = "M" + K.n1(-xi) + " " + K.n1(y) + "C" + K.n1(-xi * 0.45) + " " + K.n1(y + a) + " " + K.n1(xi * 0.45) + " " + K.n1(y + a) + " " + K.n1(xi) + " " + K.n1(y);
    return St(d, K.scuro(col, 0.4), w + 0.9, 0.9) + St(d, col, w);
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
    var dentro = St("M-12 8C-6 12 6 12 12 8", "#9db4d6", 1.2, 0.25);
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
        dentro: St("M-12 -3C-10 -8 -2 -9 4 -9", "#ffffff", 1, 0.35) });
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
      s += St("M" + n(l * (X - 1)) + " " + n(ey) + "C" + n(l * (cw - 2)) + " " + n(ey - 2) + " " + n(l * cw) + " -80 " + n(l * (cw + 1.5)) + " -79", col, 3.4); }
    s += K.Pa(d, lg, " stroke='none'") + "<g clip-path='" + K.clip(d) + "'>" +
      St("M" + n(-X + 6) + " " + n(y + 10 * k) + "L" + n(-X + 26) + " " + n(y - 14 * k), "#ffffff", 5, 0.35) + St("M" + n(X - 30) + " " + n(y + 12 * k) + "L" + n(X - 12) + " " + n(y - 12 * k), "#ffd27a", 2.4, 0.3) +
      St("M" + n(-X + 3) + " " + n(y + 4 * k) + "C" + n(-X + 12) + " " + n(y + 11 * k) + " " + n(-20) + " " + n(y + 12 * k) + " " + n(-4) + " " + n(y + 8 * k), "#ffffff", 1.2, 0.2) + "</g>";
    s += mont(K, d, col, 3.2, "#7d8ab0");
    s += St("M" + n(-X + 3) + " " + n(y - 9 * k) + "C" + n(-X + 12) + " " + n(y - 13 * k) + " " + n(-14) + " " + n(y - 12 * k) + " " + n(-7) + " " + n(y - 11 * k), "#ff5a7a", 1.1, 0.8);
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
    s += St(l1, "#000000", 5.2, 0.25) + St(l1, strap, 4.4) + St(l1, "#ffffff", 1, 0.14);
    s += St(l2, strap, 4);
    var d = "M-14 -7C-14 -15 -5 -18 3 -16C13 -13 16 -3 13 7C10 15 -5 16 -11 9C-13 6 -14 2 -14 -7Z";
    s += "<g transform='translate(" + n(x) + " " + n(y) + ") scale(" + n(k) + ")'>" + K.El(2, 4, 19, 16, K.soft("#000000", 0.3)) + K.Pa(d, lg, " stroke='" + "#000" + "' stroke-opacity='.5' stroke-width='1.4'");
    s += "<g clip-path='" + K.clip(d) + "'>" + St("M-9 5C-8 -6 -2 -13 6 -13", "#ffffff", 2.4, 0.22) + K.El(-5, -7, 6, 4, K.soft("#ffffff", 0.2)) + K.El(8, 10, 10, 8, K.soft("#000000", 0.4)) + "</g>";
    // cuciture a punti
    s += St("M-10 -5C-9 -11 -3 -14 3 -13", "#7a7d92", 0.8, 0.45, " stroke-dasharray='1.6 1.6'") + "</g>";
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
    s += "<g clip-path='" + K.clip(d) + "'>" + St("M" + n(-X + 6) + " " + n(y - 12 * k) + "C" + n(-x) + " " + n(y - 15 * k) + " " + n(-10) + " " + n(y - 12 * k) + " -4 " + n(y - 10 * k), "#ffffff", 2.4, 0.3) +
      K.El(x * 0.9, y + 8 * k, 22, 6, K.soft("#000000", 0.28)) + "</g>";
    s += "<path d='" + full + "' fill='none' stroke='" + K.scuro(col, 0.5) + "' stroke-width='1.3' stroke-opacity='.85' fill-rule='evenodd' stroke-linejoin='round'/>";
    // bordo interno dei fori (luce sotto, ombra sopra)
    s += St(hole(-1), K.scuro(col, 0.6), 1, 0.4) + St(hole(1), K.scuro(col, 0.6), 1, 0.4);
    // lacci verso le orecchie
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1; s += St("M" + n(l * (X - 1)) + " " + n(y - 9 * k) + "L" + n(l * (K.F.cw + 1)) + " -80", K.scuro(col, 0.3), 2.2, 0.9); }
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
      s += om(K, p.x, cy, 8, 8) + St(d, K.scuro("#e8b84a", 0.5), 3.2, 0.8) + St(d, "#e8b84a", 2.2) + St(arco(p.x, cy, 6.8, 190, 265), "#fff4c8", 1, 0.9) + St(arco(p.x, cy, 6.8, 20, 80), "#8a5c14", 1, 0.5); }
    return s;
  });
  A.pezzo("orecchini", "punti", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l);
      var star = "M" + p.x + " " + (p.y - 3.4) + "L" + (p.x + 3.4) + " " + p.y + "L" + p.x + " " + (p.y + 3.4) + "L" + (p.x - 3.4) + " " + p.y + "Z";
      s += om(K, p.x, p.y, 4.5, 4) + K.Pa(star, K.LG("ac_pu" + i, 0, 0, 1, 1, [[0, "#ffffff"], [0.5, "#cfe6ff"], [1, "#7aa2d6"]]), " stroke='#9aa8c0' stroke-width='1' stroke-linejoin='round'") +
        St("M" + (p.x - 2) + " " + (p.y - 1) + "L" + p.x + " " + (p.y - 2.2) + "L" + (p.x + 2) + " " + (p.y - 1), "#ffffff", 0.8, 0.9) + St("M" + (p.x + 5) + " " + (p.y - 5) + "v3M" + (p.x + 3.5) + " " + (p.y - 3.5) + "h3", "#ffffff", 0.7, 0.8); }
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
        St("M" + x + " " + (y + 2) + "L" + x + " " + (y + 11), "#e8b84a", 1.3) + St("M" + x + " " + (y + 4) + "h0M" + x + " " + (y + 7) + "h0", "#fff4c8", 1.3) +
        K.Pa(g, K.LG("ac_pd" + i, 0, 0, 1, 1, [[0, K.chiaro(pietra, 0.45)], [0.5, pietra], [1, K.scuro(pietra, 0.5)]]), " stroke='#e8b84a' stroke-width='1.3' stroke-linejoin='round'") +
        St("M" + (x - 2.2) + " " + (y + 16) + "C" + (x - 3) + " " + (y + 19) + " " + (x - 2.6) + " " + (y + 21) + " " + (x - 1.4) + " " + (y + 23), "#ffffff", 1.1, 0.7) + "<circle cx='" + x + "' cy='" + (y + 11) + "' r='1.6' fill='#e8b84a'/>"; }
    return s;
  });
  A.pezzo("orecchini", "cuori", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), x = p.x, y = p.y + 4;
      var h = "M" + x + " " + (y + 6) + "C" + (x - 7) + " " + (y + 1.5) + " " + (x - 8.4) + " " + (y - 1.5) + " " + (x - 8.4) + " " + (y - 3.5) + "C" + (x - 8.4) + " " + (y - 6.5) + " " + (x - 5.4) + " " + (y - 7.5) + " " + (x - 4.2) + " " + (y - 7.5) + "C" + (x - 2) + " " + (y - 7.5) + " " + x + " " + (y - 6) + " " + x + " " + (y - 4) + "C" + x + " " + (y - 6) + " " + (x + 2) + " " + (y - 7.5) + " " + (x + 4.2) + " " + (y - 7.5) + "C" + (x + 5.4) + " " + (y - 7.5) + " " + (x + 8.4) + " " + (y - 6.5) + " " + (x + 8.4) + " " + (y - 3.5) + "C" + (x + 8.4) + " " + (y - 1.5) + " " + (x + 7) + " " + (y + 1.5) + " " + x + " " + (y + 6) + "Z";
      s += "<g transform='translate(" + x + " " + (p.y - 2) + ") scale(.82) translate(" + (-x) + " " + (-(p.y - 2)) + ")'>" + om(K, x, y, 8, 7) + St("M" + x + " " + (p.y - 2) + "L" + x + " " + (y - 6), "#d9a640", 1.3) + "<circle cx='" + x + "' cy='" + (p.y - 1) + "' r='1.6' fill='#e8b84a'/>" +
        K.Pa(h, K.LG("ac_cr" + i, 0, 0, 1, 1, [[0, "#ff9ab4"], [0.5, "#e8305c"], [1, "#8f1634"]]), " stroke='#7a1230' stroke-width='.8' stroke-linejoin='round'") +
        St("M" + (x - 6) + " " + (y - 3) + "C" + (x - 6.2) + " " + (y - 5.4) + " " + (x - 4.4) + " " + (y - 6) + " " + (x - 3.2) + " " + (y - 5.6), "#ffffff", 1.2, 0.75) + "</g>"; }
    return s;
  });
  A.pezzo("orecchini", "cerchioni", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), cy = p.y + 11, R = 11, x = p.x;
      var d = anello(x, cy, R);
      s += "<g>" + St(d, "#000", 4, 0.12) + St(d, K.scuro("#e8b84a", 0.5), 3.8, 0.85) + St(d, "#e8b84a", 2.8) +
        St(arco(x, cy, R, 190, 265), "#fff4c8", 1.2, 0.9) + St(arco(x, cy, R, 20, 80), "#8a5c14", 1.1, 0.5) + "</g>"; }
    return s;
  });
  A.pezzo("orecchini", "piercing", function (K) {
    var s = "";
    for (var i = 0; i < 2; i++) { var l = i ? 1 : -1, p = lobo(K, l), x = p.x, yh = p.y - 13, yh2 = p.y - 7;
      s += om(K, x, p.y, 4, 4) + "<circle cx='" + x + "' cy='" + p.y + "' r='2.6' fill='" + K.LG("ac_pi" + i, 0, 0, 1, 1, [[0, "#ffffff"], [0.5, "#c6cdd8"], [1, "#788396"]]) + "' stroke='#68727f' stroke-width='.5'/>" + riflesso(x - 0.8, p.y - 0.9);
      // anellino sul bordo alto dell'orecchio (elice) e una barretta
      var r1 = anello(x - 0.5, yh, 3.5);
      s += St(r1, "#68727f", 2.4, 0.8) + St(r1, "#d4dae4", 1.6) + St(arco(x - 0.5, yh, 3.5, 200, 270), "#ffffff", 0.8, 0.9) +
        "<circle cx='" + (x + 1) + "' cy='" + yh2 + "' r='1.5' fill='#c6cdd8' stroke='#68727f' stroke-width='.4'/>"; }
    return s;
  });
  /* Pezzi fatti: occhiali sole, tondi, quadrati, felina, aviatore, grandi, cuore, sportivi, stelle, benda, mascherina;
     orecchini cerchi, punti, perla, pendenti, cuori, cerchioni, piercing. */
  // (leggero) ogni paio di occhiali e di orecchini dentro il gruppo GR (vedi St)
  [["occhiali", "sole"], ["occhiali", "tondi"], ["occhiali", "quadrati"], ["occhiali", "felina"], ["occhiali", "aviatore"], ["occhiali", "grandi"], ["occhiali", "cuore"], ["occhiali", "sportivi"], ["occhiali", "stelle"], ["occhiali", "benda"], ["occhiali", "mascherina"],
   ["orecchini", "cerchi"], ["orecchini", "punti"], ["orecchini", "perla"], ["orecchini", "pendenti"], ["orecchini", "cuori"], ["orecchini", "cerchioni"], ["orecchini", "piercing"]].forEach(function (tv) {
    var f = A[tv[0]][tv[1]]; if (f) A[tv[0]][tv[1]] = function () { var r = f.apply(this, arguments); return typeof r === "string" && r ? GR + r + "</g>" : r; };
  });
})();


// ---- capelli-a ----
// pezzi: capelli-a — pettinature illustrate: scodella, cresta, spike, banana, spazzola, caesar, mullet, emo, anime, arruffati, rocker
(function () {
  var A = window.SGOminoA; if (!A) return;

  // ---------- aiuti comuni (stessa mano di capelli-uomo) ----------
  function fade(v, a, b) { var t = (v - a) / (b - a); return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  function mixp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  // contorno della massa (coordinate testa); uu = punti dell'attaccatura; hl(u) -> [x, y]
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
    var uu = o.uu || [0, 0.3, 0.55, 0.8, 1];
    var hl = o.hl || function (u) { return [w * 0.93 * u, hy + (th - hy) * Math.pow(u, 3)]; };
    var inR = uu.map(function (u) { return hl(u, 1); }), inL = uu.map(function (u) { var q = hl(u, -1); return [-q[0], q[1]]; });
    var pts = [[-(rx - 1), sb]].concat(out.map(function (q) { return q.slice(); }), [[rx - 1, sb]], [[ib, sb - 1]], inR.slice().reverse(), inL, [[-ib, sb - 1]]);
    return { d: K.lisciaChiusa(pts), pts: pts, w: w, T: T, hy: hy, th: th, sb: sb, out: out, inR: inR, inL: inL, rx: rx, cy: cy, ry: ry };
  }
  function lungoAtt(F, u) {
    var l = F.inL.slice().reverse().concat(F.inR.slice(1)), t = u * (l.length - 1), i = Math.min(l.length - 2, Math.floor(t)), f = t - i;
    return [l[i][0] + (l[i + 1][0] - l[i][0]) * f, l[i][1] + (l[i + 1][1] - l[i][1]) * f];
  }
  function lungoOut(F, u) {
    var l = F.out, t = u * (l.length - 1), i = Math.min(l.length - 2, Math.floor(t)), f = t - i;
    return [l[i][0] + (l[i + 1][0] - l[i][0]) * f, l[i][1] + (l[i + 1][1] - l[i][1]) * f];
  }
  // punto sull'ellisse esterna a un angolo (gradi: 180 sinistra, 90 cima, 0 destra)
  function ell(F, a, k) { var r = a * Math.PI / 180; k = k || 1; return [F.rx * k * Math.cos(r), F.cy - F.ry * k * Math.sin(r)]; }
  // massa chiusa: colore, ciocche, luce a sinistra in alto, ombra a destra, ombra sotto l'attaccatura
  function chiudi(K, d, F, ciocche, o) {
    o = o || {};
    var s = K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>";
    s += ciocche || "";
    s += K.El(-24, F.T - (o.vol || 14) * 0.2 - 6, 34, 20, K.soft(K.hL, 0.55));
    s += K.El(F.w - 6, -118, 22, 50, K.soft(K.hDD, 0.5));
    s += K.El(0, o.omY != null ? o.omY : F.hy + F.T + 4, F.w * 0.8, 9, K.soft(K.hDD, 0.35));
    s += (o.extra || "") + "</g>";
    return s;
  }
  // ciocche dal punto P verso una lista di bersagli (escono un po' dal contorno: poi sono ritagliate)
  function raggi(K, P, bers, w0, ids, o) {
    o = o || {}; var L = [];
    bers.forEach(function (t, i) {
      var dx = t[0] - P[0], dy = t[1] - P[1], l = Math.hypot(dx, dy) || 1, ex = o.ext != null ? o.ext : 7;
      var sx = t[0] > P[0] ? 1 : -1, bz = (o.bulge != null ? o.bulge : 4) * (i % 2 ? 0.6 : 1);
      var e = [t[0] + dx / l * ex, t[1] + dy / l * ex];
      L.push([[P[0], P[1], w0 * 0.8], [P[0] + dx * 0.4 + sx * bz, P[1] + dy * 0.4 - Math.abs(bz) * 0.6, w0 + 3], [P[0] + dx * 0.78 + sx * bz * 0.4, P[1] + dy * 0.78, w0 + 1], [e[0], e[1], o.punta != null ? o.punta : 6]]);
    });
    return K.ciocche(L, ids || ["hg1", "hg2", "hg1", "hg2", "hg1"]);
  }
  // sottili fili per dare materia
  function peli(K, seme, n, x0, x1, y0, y1, op, col, lung) {
    var R = K.rnd(seme), d = "", lg = lung || 9;
    for (var i = 0; i < n; i++) { var x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); d += "M" + K.n1(x) + " " + K.n1(y) + "l" + K.n1((R() - 0.4) * lg) + " " + K.n1(-2 - R() * lg * 0.8); }
    return "<path d='" + d + "' stroke='" + (col || K.hDD) + "' stroke-width='1.1' stroke-linecap='round' fill='none' opacity='" + (op || 0.3) + "'/>";
  }
  function puntini(K, seme, n, x0, x1, y0, y1, prob, op, sw) {
    var R = K.rnd(seme), d = "";
    for (var i = 0; i < n; i++) { var x = x0 + R() * (x1 - x0), y = y0 + R() * (y1 - y0); if (R() < prob(x, y)) d += "M" + K.n1(x) + " " + K.n1(y) + "h.3"; }
    return "<path d='" + d + "' stroke='" + K.hDD + "' stroke-width='" + (sw || 1.7) + "' stroke-linecap='round' opacity='" + (op || 0.4) + "' fill='none'/>";
  }
  // zone rasate ai lati: sfumatura morbida dal colore dei capelli alla pelle
  function latiRasati(K, w, alto, sb, op) {
    var rx = w + 1, s = "";
    [-1, 1].forEach(function (sg) {
      var P = function (x, y) { return [sg * x, y]; };
      var d = K.lisciaChiusa([P(rx - 1, sb + 2), P(rx + 1, -98), P(rx - 1, alto + 4), P(rx - 12, alto - 1), P(w - 14, alto + 4), P(w - 10, -100), P(w - 8, sb - 4), P(w + 2, sb + 6)]);
      var g = K.LG("ca_sf" + (sg > 0 ? "d" : "s"), sg * (rx + 2), 0, sg * (w - 12), 0, [[0, K.hDD, 0.72 * (op || 0.5) / 0.5], [0.55, K.hDD, 0.4 * (op || 0.5) / 0.5], [1, K.hDD, 0.02]], true);
      s += K.Pa(d, g);
      s += "<g clip-path='" + K.clip(d) + "'>" + puntini(K, sg > 0 ? 41 : 43, 420, Math.min(sg * (w - 14), sg * (rx + 2)), Math.max(sg * (w - 14), sg * (rx + 2)), alto - 4, sb + 8,
        function (x, y) { var ax = Math.abs(x); return fade(ax, w - 16, w + 4) * fade(y, alto - 2, alto + 14) * fade(sb + 8 - y, 0, 10) + 0.12; }, op || 0.45) + "</g>";
    });
    return s;
  }
  function basette(K, w, sb, sp) {
    sb = sb == null ? -80 : sb; sp = sp || 11;
    var a = K.limb([[w - 4, -108, sp], [w, -96, sp], [w + 0.5, -86, sp - 2], [w - 2, sb, 4.5]]);
    var b = K.limb([[-w + 4, -108, sp], [-w, -96, sp], [-w - 0.5, -86, sp - 2], [-w + 2, sb, 4.5]]);
    return K.Pa(a, K.U("hg2")) + K.Pa(b, K.U("hg2"));
  }
  // un ciuffo a punta: dalla base alla punta, rastremato (luce a sinistra)
  function ciuffoPunta(K, nodi, id) {
    var d = K.limb(nodi, 0.0);
    return K.Pa(d, K.U(id || "hg1")) + K.Pa(K.limb(nodi.map(function (q, j) { return [q[0] - 1.6, q[1] - 2, Math.max(0.5, q[2] * 0.22) * (j === nodi.length - 1 ? 0.2 : 1)]; })), K.hL, " opacity='.45'");
  }

  // di spalle: la nuca dei tagli corti. pelle in basso, capelli in alto fino a un bordo (edge(u): u -1..1 -> y), poi sfumatura di barba (fade)
  function nucaBack(K, o) {
    if (!(K.opts && K.opts.spalle)) return undefined;
    var cw = K.F.cw, top = K.top, nk = K.B.nk / 0.9 * 1.08, n1 = K.n1, i;
    var nuca = "M" + (-cw) + " -78C" + (-cw - 1) + " " + n1(-78 - 40 * K.F.L) + " " + n1(-cw * 0.63) + " " + n1(top + 2) + " 0 " + n1(top) + "C" + n1(cw * 0.63) + " " + n1(top + 2) + " " + (cw + 1) + " " + n1(-78 - 40 * K.F.L) + " " + cw + " -78C" + cw + " -50 " + n1(cw * 0.82) + " -24 " + n1(nk) + " -4L" + n1(-nk) + " -4C" + n1(-cw * 0.82) + " -24 " + (-cw) + " -50 " + (-cw) + " -78Z";
    var s = K.Pa(nuca, K.U("face")) + "<g clip-path='" + K.clip(nuca) + "'>";
    s += K.El(cw * 0.5, -40, cw * 0.6, 50, K.soft(K.skDD, 0.3)) + K.El(0, -14, nk * 1.3, 12, K.soft(K.skDD, 0.3));
    var E = [], N = 8;
    for (i = 0; i <= N; i++) { var u = -1 + 2 * i / N; E.push([u * (cw + 6), o.edge(u)]); }
    var hp = "M" + n1(-cw - 30) + " -220L" + n1(E[0][0] - 30) + " " + n1(E[0][1]) + "L" + n1(E[0][0]) + " " + n1(E[0][1]) + K.cr(E) + "L" + n1(cw + 30) + " " + n1(E[N][1]) + "L" + n1(cw + 30) + " -220Z";
    var fd = o.fade || 0;
    if (fd) {
      var yEdge = function (x) { var u = Math.max(-1, Math.min(1, x / (cw + 6))), t = (u + 1) / 2 * N, j = Math.min(N - 1, Math.floor(t)), f2 = t - j; return E[j][1] + (E[j + 1][1] - E[j][1]) * f2; };
      s += puntini(K, 21, 1500, -cw - 2, cw + 2, -140, -20, function (x, y) { var e = yEdge(x); return y < e ? 0 : fade(e + fd - y, 0, fd) * 0.85; }, 0.38, 1.15);
    }
    s += K.Pa(hp, K.U("hg3")) + "<g clip-path='" + K.clip(hp) + "'>";
    var L = [], px;
    for (i = 0; i < 9; i++) { px = (i - 4) / 4; L.push([[px * 8, top + 8, 8], [px * (cw * 0.8), (top + o.edge(px)) / 2 - 4, 14], [px * (cw + 4), o.edge(px) + 5, 4]]); }
    s += K.ciocche(L, ["hg1", "hg2", "hg1", "hg2", "hg1"]);
    s += K.El(-22, top + 14, 34, 22, K.soft(K.hL, 0.5)) + K.El(cw * 0.5, -96, cw * 0.55, 40, K.soft(K.hDD, 0.5));
    s += K.El(0, o.edge(0) - 2, cw * 0.95, 8, K.soft(K.hDD, 0.5)) + "</g></g>";
    return s;
  }
  // di spalle, i capelli lunghi visti da dietro: ciocche dalla cima verso la punta
  function dorso(K, w, yTop, yBot) {
    var L = [], n = 9, i;
    for (i = 0; i < n; i++) { var x = (i - (n - 1) / 2) / ((n - 1) / 2); L.push([[x * 12, yTop, 6], [x * w * 0.78, (yTop + yBot) / 2 - 12, 19], [x * w * 0.96, yBot, 3]]); }
    return K.ciocche(L, ["hg1", "hg2", "hg1", "hg2", "hg1"]) + K.El(-22, yTop + 26, 34, 22, K.soft(K.hL, 0.5));
  }
  // contorno a punte: spikes = [{a: angolo, len, w: mezza larghezza in gradi, t: inclinazione x}], valli tra una punta e l'altra
  function conPunte(K, F, spikes, o) {
    o = o || {}; var k = o.k != null ? o.k : 0.25;
    var d = "M" + K.n1(-(F.rx - 1)) + " " + F.sb, tips = [];
    var p0 = ell(F, 180); d += "L" + K.n1(p0[0]) + " " + K.n1(p0[1]);
    var vprev = p0;
    spikes.forEach(function (s, i) {
      var B = ell(F, s.a), dir = [Math.cos(s.a * Math.PI / 180) * 0.8 + (s.t || 0), -Math.sin(s.a * Math.PI / 180)], dl = Math.hypot(dir[0], dir[1]);
      var tip = [B[0] + dir[0] / dl * s.len, B[1] + dir[1] / dl * s.len];
      var vl = i === 0 ? ell(F, s.a + s.w * 1.0, 1) : null;
      var next = spikes[i + 1], vang = next ? (s.a + next.a) / 2 : s.a - s.w, vr = ell(F, vang, o.valle != null ? o.valle : 0.95);
      if (i === spikes.length - 1) vr = ell(F, 0);
      var mid1 = mixp(vprev, tip, 0.5), ax1 = mixp(B, tip, 0.5), c1 = mixp(mid1, ax1, k);
      var mid2 = mixp(vr, tip, 0.5), c2 = mixp(mid2, ax1, k);
      d += "Q" + K.n1(c1[0]) + " " + K.n1(c1[1]) + " " + K.n1(tip[0]) + " " + K.n1(tip[1]) + "Q" + K.n1(c2[0]) + " " + K.n1(c2[1]) + " " + K.n1(vr[0]) + " " + K.n1(vr[1]);
      tips.push({ tip: tip, B: B });
      vprev = vr;
    });
    d += "L" + K.n1(F.rx - 1) + " " + F.sb + "L" + K.n1(F.pts[F.pts.length - F.inR.length - F.inL.length - 1][0]) + " " + (F.sb - 1);
    var hr = F.inR.slice().reverse().concat(F.inL);
    d += "L" + K.n1(hr[0][0]) + " " + K.n1(hr[0][1]) + K.cr(hr) + "L" + K.n1(-(F.pts[F.pts.length - 1][0] * -1)) + " " + (F.sb - 1) + "Z";
    return { d: d, tips: tips };
  }

  // riflesso che si vede anche sui capelli neri: sui colori scuri vira a un grigio-azzurro chiaro (come la luce sul nero vero)
  function lucido(K) {
    var Lh = K.lum(K.capelli), t = Lh >= 0.4 ? 0 : (0.4 - Lh) / 0.3; t = t > 1 ? 1 : t;
    return K.mix(K.hL, "#d2dcf5", 0.15 + 0.6 * t);
  }
  // filo di luce sul bordo del taglio (stacca il nero dalla pelle scura) + ombra morbida sulla pelle sotto
  function bordoLuce(K, d, lu, op) { return "<g clip-path='" + K.clip(d) + "'>" + K.Pa(d, "none", " stroke='" + lu + "' stroke-width='2.4' stroke-opacity='" + ((op || 0.42) * 0.45) + "'") + "</g>"; }

  // ---------- scodella: grande cupola tonda, FRANGIA DRITTA bassa che copre la fronte fino alle sopracciglia, lati a metà orecchio ----------
  A.pezzo("capelli", "scodella", function (K) {
    var T = K.top, yf = -101, lu = lucido(K);
    var hlf = function (u) { var w = K.F.cw + 5; return [w * 0.92 * u, yf + 1.5 * u * u + (u > 0.82 ? (u - 0.82) * 24 : 0)]; };
    var F = forma(K, { vol: 17, s: 5, sb: -78, ib: 6, hl: hlf, uu: [0, 0.25, 0.5, 0.75, 1] });
    var P = [0, T + 2], bers = [], i;
    for (i = 0; i <= 6; i++) { var x = -F.w * 0.88 + i * F.w * 1.76 / 6; bers.push([x, yf + 6 + (x * x) / (F.w * F.w) * 3]); }
    [[-F.rx + 3, -86], [-F.rx + 1, -104], [-F.rx + 4, -124], [F.rx - 3, -86], [F.rx - 1, -104], [F.rx - 4, -124]].forEach(function (q) { bers.push(q); });
    var s = chiudi(K, F.d, F, raggi(K, P, bers, 14, ["hg2", "hg1", "hg2", "hg1"], { bulge: 1.5 }), { vol: 17, omY: yf - 2 });
    s += "<g clip-path='" + K.clip(F.d) + "'>";
    // anello di luce sulla calotta (il «lucido» tipico del taglio a scodella) e striscia sopra la frangia
    s += K.St("M" + K.n1(-F.w * 0.82) + " " + K.n1(T + 34) + "Q" + K.n1(-F.w * 0.3) + " " + K.n1(T + 8) + " " + K.n1(F.w * 0.18) + " " + K.n1(T + 14), lu, 3.2, 0.3);
    s += K.El(-14, T + 20, 36, 6, K.soft(lu, 0.7)) + K.El(F.w * 0.5, T + 30, 16, 7, K.soft(lu, 0.3));
    s += K.El(0, yf - 9, F.w * 0.92, 5, K.soft(lu, 0.4)) + K.El(0, yf + 1, F.w * 0.95, 6, K.soft(K.hDD, 0.55));
    s += "</g>";
    s += K.St("M" + K.n1(-F.w * 0.86) + " " + (yf + 2) + "Q0 " + (yf - 1) + " " + K.n1(F.w * 0.86) + " " + (yf + 3), K.hDD, 1.8, 0.5);
    s += bordoLuce(K, F.d, lu, 0.4);
    return { fronte: s, dietro: nucaBack(K, { edge: function (u) { return -64 + u * u * 4; } }) };
  });

  // ---------- caesar: cortissimo e aderente al cranio, pettinato AVANTI, frangetta corta e dritta sopra la fronte ----------
  A.pezzo("capelli", "caesar", function (K) {
    var T = K.top, w0 = K.F.cw + 2, yf = -123, lu = lucido(K);
    var hlf = function (u) { return [w0 * 0.9 * u, yf - 2 + 2 * u * u + (u > 0.88 ? (u - 0.88) * 90 : 0)]; };
    var F = forma(K, { vol: 3, s: 2, sb: -92, ib: 8, hl: hlf, uu: [0, 0.25, 0.5, 0.75, 0.9, 1] });
    var P = [0, T + 1], bers = [], i;
    for (i = 0; i <= 8; i++) { var x = -F.w * 0.9 + i * F.w * 1.8 / 8; bers.push([x, yf + 1]); }
    [[-F.rx + 2, -98], [-F.rx + 1, -113], [F.rx - 2, -98], [F.rx - 1, -113]].forEach(function (q) { bers.push(q); });
    var s = chiudi(K, F.d, F, raggi(K, P, bers, 8, ["hg1", "hg2", "hg1", "hg2"], { bulge: 2, punta: 2 }), { vol: 6, omY: yf - 1 });
    // pettinato avanti: fili corti dalla sommità verso la frangetta (tutti nello stesso verso)
    var L = [];
    for (i = 0; i < 11; i++) { var u2 = (i - 5) / 5; L.push([[u2 * 5, T + 4, 4], [u2 * F.w * 0.55, (T + yf) / 2, 7], [u2 * F.w * 0.84, yf + 3, 1.6]]); }
    s += "<g clip-path='" + K.clip(F.d) + "'>" + K.ciocche(L, ["hg1", "hg2"]) + K.El(-12, T + 10, 30, 5, K.soft(lu, 0.7)) + K.El(F.w * 0.4, T + 14, 14, 5, K.soft(lu, 0.35)) + "</g>";
    // la frangetta: ciuffetti corti, dritti, tutti uguali (il bordo è una riga)
    for (i = 0; i < 11; i++) {
      var x2 = -F.w * 0.82 + i * F.w * 1.64 / 10;
      s += ciuffoPunta(K, [[x2, T + 14, 7], [x2, (T + yf) / 2 + 4, 11], [x2, yf, 11], [x2 + 0.5, yf + 5.5 + (i % 3 === 1 ? 1.2 : 0), 1.6]], i % 2 ? "hg2" : "hg1");
    }
    s += K.St("M" + K.n1(-F.w * 0.84) + " " + (yf + 4) + "Q0 " + (yf + 6) + " " + K.n1(F.w * 0.84) + " " + (yf + 4), K.hDD, 1.2, 0.35);
    s += bordoLuce(K, F.d, lu, 0.45);
    return { fronte: s + basette(K, F.w - 2, -88, 8), dietro: nucaBack(K, { edge: function (u) { return -50 - 18 * u * u; }, fade: 20 }) };
  });

  // ---------- spazzola: ALTA, dritta in su, cima piatta e quadrata, lati rasati ----------
  A.pezzo("capelli", "spazzola", function (K) {
    var T = K.top, w = K.F.cw + 1, yh = -121, lu = lucido(K), tt = T - 13;
    var pts = [[-(w - 8), yh + 4], [-(w - 3), -130], [-(w - 3), T + 4], [-(w - 3.5), tt + 5], [-(w - 7), tt + 0.5], [-(w - 20), tt - 1], [0, tt - 1.5], [w - 20, tt - 1], [w - 7, tt + 0.5], [w - 3.5, tt + 5], [w - 3, T + 4], [w - 3, -130], [w - 8, yh + 4],
      [w - 18, yh - 1], [w * 0.5, yh - 5], [w * 0.2, yh - 6], [0, yh - 6], [-w * 0.2, yh - 6], [-w * 0.5, yh - 5], [-(w - 18), yh - 1]];
    var d = K.lisciaChiusa(pts);
    var bar = "", R = K.rnd(4), i;
    for (i = 0; i < 190; i++) {
      var x = (R() * 2 - 1) * (w - 5), y = tt + 2 + R() * (yh - tt - 2);
      bar += "M" + K.n1(x) + " " + K.n1(y + 5) + "l" + K.n1(x * 0.01) + " -7";
    }
    var s = latiRasati(K, w, -121, -84, 0.3);
    s += K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>";
    s += "<path d='" + bar + "' stroke='" + K.mix(lu, K.capelli, 0.45) + "' stroke-width='1.3' stroke-linecap='round' fill='none' opacity='.5'/>";
    s += "<path d='" + bar.replace(/M(-?[\d.]+) (-?[\d.]+)l/g, function (m, a, b) { return "M" + (+a + 1.4) + " " + (+b + 1) + "l"; }) + "' stroke='" + K.hDD + "' stroke-width='1.2' stroke-linecap='round' fill='none' opacity='.45'/>";
    s += K.El(-14, tt + 4, 46, 7, K.soft(lu, 0.8)) + K.El(w - 6, -134, 20, 44, K.soft(K.hDD, 0.5)) + K.El(0, yh - 2, w * 0.85, 8, K.soft(K.hDD, 0.4));
    s += K.St("M" + K.n1(-(w - 8)) + " " + (tt + 1.5) + "L" + K.n1(w - 8) + " " + (tt + 0.5), lu, 1.8, 0.45);
    s += "</g>" + bordoLuce(K, d, lu, 0.4);
    return { fronte: s, dietro: nucaBack(K, { edge: function (u) { return -86 - 8 * u * u; }, fade: 40 }) };
  });

  // ---------- cresta: striscia alta al centro, lati rasati ----------
  A.pezzo("capelli", "cresta", function (K) {
    var T = K.top, w = K.F.cw + 3;
    var Fs = forma(K, { vol: 2, hy: 20, s: 3, sb: -96, ib: 8, hl: function (u) { return [w * 0.92 * u, T + 20 + (-104 - T - 20) * Math.pow(u, 3)]; } });
    var skull = "<g clip-path='" + K.clip(K.faceD) + "'>" + K.Pa(Fs.d, K.LG("ca_rm", 0, 0, 0, 1, [[0, K.capelli, 0.4], [0.65, K.capelli, 0.26], [1, K.capelli, 0.05]]));
    skull += puntini(K, 12, 3200, -70, 70, T - 6, -84, function (x, y) { var ax = Math.abs(x); return fade(ax, 14, 26) * (fade(-82 - y, 0, 26) * 0.9 + 0.05); }, 0.34, 1.15);
    skull += K.El(-26, T + 8, 30, 14, K.soft(K.hL, 0.25));
    skull += K.El(-24, T + 4, 7, 30, K.soft(K.hDD, 0.45)) + K.El(24, T + 4, 7, 30, K.soft(K.hDD, 0.55)) + "</g>";
    var top = T - 50;
    var cr = K.lisciaChiusa([[-18, T + 30], [-22, T + 8], [-24, T - 16], [-21, T - 32], [-15, top + 12], [-10, top + 2], [-5, top - 3], [0, top + 8], [5, top - 5], [10, top + 4], [16, top + 14], [21, T - 32], [24, T - 16], [23, T + 8], [18, T + 30], [10, T + 38], [0, T + 40], [-10, T + 38]]);
    var L = [], i;
    for (i = 0; i < 7; i++) {
      var x0 = -17 + i * 5.7, tx = (i - 3) * 6.5 * (i === 3 ? 0.3 : 1);
      L.push([[x0 * 0.8, T + 36, 9], [x0 * 0.95, T + 12, 12], [x0 * 1.1 + tx * 0.3, T - 22, 11], [tx, top + 3 + (i % 2 ? 6 : 0) + (i === 3 ? -4 : 0), 3]]);
    }
    var s = skull + K.Pa(cr, K.U("hg3")) + "<g clip-path='" + K.clip(cr) + "'>";
    s += K.ciocche(L, ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2", "hg1"]);
    s += K.El(-17, T - 18, 8, 34, K.soft(K.hL, 0.6)) + K.El(21, T - 8, 12, 42, K.soft(K.hDD, 0.65)) + K.El(0, T + 34, 24, 8, K.soft(K.hDD, 0.5));
    s += peli(K, 9, 18, -20, 20, top, T + 30, 0.25, null, 6) + "</g>";
    var dietro;
    if (K.opts && K.opts.spalle) {
      var cw = K.F.cw, nk = K.B.nk / 0.9 * 1.08, n1 = K.n1;
      var nuca = "M" + (-cw) + " -78C" + (-cw - 1) + " " + n1(-78 - 40 * K.F.L) + " " + n1(-cw * 0.63) + " " + n1(T + 2) + " 0 " + n1(T) + "C" + n1(cw * 0.63) + " " + n1(T + 2) + " " + (cw + 1) + " " + n1(-78 - 40 * K.F.L) + " " + cw + " -78C" + cw + " -50 " + n1(cw * 0.82) + " -24 " + n1(nk) + " -4L" + n1(-nk) + " -4C" + n1(-cw * 0.82) + " -24 " + (-cw) + " -50 " + (-cw) + " -78Z";
      dietro = K.Pa(nuca, K.U("face")) + "<g clip-path='" + K.clip(nuca) + "'>" + K.El(cw * 0.5, -40, cw * 0.6, 50, K.soft(K.skDD, 0.3)) + K.El(0, -14, nk * 1.3, 12, K.soft(K.skDD, 0.3));
      dietro += K.Pa(nuca, K.LG("ca_rn", 0, 0, 0, 1, [[0, K.capelli, 0.34], [0.7, K.capelli, 0.22], [1, K.capelli, 0.04]]));
      dietro += puntini(K, 14, 3000, -cw, cw, T, -50, function (x, y) { return fade(Math.abs(x), 14, 24) * fade(-46 - y, 0, 30) * 0.9; }, 0.34, 1.15);
      var ff = K.lisciaChiusa([[-17, T + 14], [-21, T + 40], [-20, -96], [-13, -70], [-7, -54], [0, -50], [7, -54], [13, -70], [20, -96], [21, T + 40], [17, T + 14], [0, T + 8]]);
      dietro += K.Pa(ff, K.U("hg3")) + "<g clip-path='" + K.clip(ff) + "'>" + K.ciocche([-14, -7, 0, 7, 14].map(function (x) { return [[x * 0.8, T + 10, 8], [x, -100, 12], [x * 0.9, -50, 3]]; }), ["hg1", "hg2", "hg1", "hg2", "hg1"]) + K.El(-12, -110, 7, 40, K.soft(K.hL, 0.5)) + K.El(18, -100, 10, 50, K.soft(K.hDD, 0.6)) + "</g></g>";
    }
    return { fronte: s, ombraFronte: false, dietro: dietro };
  });

  // ---------- spike: ciuffi dritti verso l'alto, gelatina ----------
  A.pezzo("capelli", "spike", function (K) {
    var T = K.top, w0 = K.F.cw + 3;
    var hlf = function (u) { return [w0 * 0.9 * u, T + 26 + (-104 - T - 26) * Math.pow(u, 3)]; };
    var F = forma(K, { vol: 9, s: 3, sb: -92, ib: 9, hl: hlf, hy: 26 });
    var sp = [{ a: 163, len: 22, w: 9, t: -0.5 }, { a: 140, len: 31, w: 9, t: -0.3 }, { a: 118, len: 38, w: 9, t: -0.12 }, { a: 96, len: 41, w: 9, t: 0 }, { a: 74, len: 38, w: 9, t: 0.12 }, { a: 52, len: 31, w: 9, t: 0.3 }, { a: 30, len: 24, w: 9, t: 0.5 }, { a: 11, len: 14, w: 7, t: 0.6 }];
    var c = conPunte(K, F, sp, { k: -0.05, valle: 0.93 });
    var s = K.Pa(c.d, K.U("hg3")) + "<g clip-path='" + K.clip(c.d) + "'>";
    c.tips.forEach(function (q, i) {
      var b0 = [q.B[0] * 0.78, q.B[1] + 26];
      s += ciuffoPunta(K, [[b0[0], b0[1], 15], [(b0[0] + q.B[0]) / 2, (b0[1] + q.B[1]) / 2, 20], [q.B[0] * 1.02 + (q.tip[0] - q.B[0]) * 0.35, q.B[1] + (q.tip[1] - q.B[1]) * 0.35, 18], [q.tip[0] * 0.995, q.tip[1], 1.5]], i % 2 ? "hg2" : "hg1");
    });
    s += K.El(-24, T - 8, 34, 24, K.soft(K.hL, 0.5)) + K.El(F.w - 6, -118, 22, 50, K.soft(K.hDD, 0.5)) + K.El(0, T + 34, F.w * 0.8, 9, K.soft(K.hDD, 0.35)) + "</g>";
    return { fronte: s + basette(K, F.w - 2, -86), dietro: nucaBack(K, { edge: function (u) { return -52 - 16 * u * u; }, fade: 20 }) };
  });

  // ---------- banana: la grande onda sulla fronte, una mezzaluna alta che si arrotola in avanti ----------
  A.pezzo("capelli", "banana", function (K) {
    var T = K.top, w0 = K.F.cw + 3;
    var hlf = function (u) { return [w0 * 0.9 * u, T + 26 + (-108 - T - 26) * Math.pow(u, 2.3)]; };
    var F = forma(K, { vol: 8, s: 3, sb: -96, ib: 9, hl: hlf, hy: 26 });
    var bers = [], i;
    for (i = 0; i < 8; i++) bers.push(lungoOut(F, 0.1 + i * 0.11));
    var s = latiRasati(K, w0, -112, -84, 0.35) + chiudi(K, F.d, F, raggi(K, [0, -40], bers, 14, ["hg2", "hg1"], { bulge: 1 }), { vol: 8, omY: T + 26, extra: K.Pa(F.d, K.hDD, " opacity='.2'") });
    // la banana: mezzaluna spessa, alta, che parte dalla tempia sinistra, sale e si piega in avanti a destra
    var O = [[-56, T + 36], [-62, T + 10], [-54, T - 16], [-28, T - 38], [10, T - 48], [46, T - 46], [70, T - 28], [78, T - 4], [72, T + 32]];
    // il bordo interno segue l'attaccatura: il ciuffo parte dalla fronte, senza fascia scura in mezzo
    var I = [-46, -32, -16, 0, 16, 32, 46, 58, 66].map(function (x) { return [x, hlf(Math.min(1, Math.abs(x) / (w0 * 0.9)))[1] + 2]; });
    var rl = K.lisciaChiusa(O.concat(I.slice().reverse()));
        s += "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(6, T + 36, 46, 9, K.soft(K.hDD, 0.4)) + "</g>";
    s += K.Pa(rl, K.U("hg3"), " stroke='" + K.hDD + "' stroke-opacity='.35' stroke-width='1'") + "<g clip-path='" + K.clip(rl) + "'>";
    var Lr = [], k, f;
    for (k = 0; k < 6; k++) {
      f = (k + 0.5) / 6;
      Lr.push(O.map(function (q, j) { var r = I[j]; return [q[0] + (r[0] - q[0]) * f, q[1] + (r[1] - q[1]) * f, j === 0 || j === 8 ? 2.5 : 9]; }));
    }
    s += K.ciocche(Lr, ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
    s += K.El(-30, T - 40, 34, 14, K.soft(K.hL, 0.75)) + K.El(66, T - 10, 14, 34, K.soft(K.hDD, 0.65)) + K.El(0, T - 4, 70, 10, K.soft(K.hDD, 0.35)) + "</g>";
    s += K.St(K.liscio(O.slice(2, 7).map(function (q) { return [q[0] + 4, q[1] + 6]; })), K.hL, 2, 0.5);
    return { fronte: s, dietro: nucaBack(K, { edge: function (u) { return -56 - 16 * u * u; }, fade: 24 }) };
  });

  // ---------- mullet: davanti e lati corti, dietro una coda lunga che spunta sotto le orecchie ----------
  A.pezzo("capelli", "mullet", function (K) {
    var T = K.top, w0 = K.F.cw + 3, R = K.rnd(31);
    var uu = [0, 0.14, 0.28, 0.42, 0.56, 0.7, 0.84, 1];
    var hlf = function (u) { return [w0 * 0.92 * u, T + 18 + (-110 - T - 18) * Math.pow(u, 2.8) + (Math.round(u * 14) % 2 ? 3 : -2)]; };
    var F = forma(K, { vol: 14, s: 3, sb: -96, ib: 9, hl: hlf, uu: uu, hy: 18 });
    var bers = [], i;
    for (i = 0; i < 12; i++) bers.push(lungoOut(F, 0.04 + i * 0.083));
    var s = latiRasati(K, w0, -112, -86, 0.3) + chiudi(K, F.d, F, raggi(K, [-8, T + 16], bers, 12, ["hg1", "hg2", "hg1", "hg2"], { bulge: 5 }), { vol: 14 });
    for (i = 0; i < 6; i++) { var x = -30 + i * 12 + (R() - 0.5) * 4, yb = T + 20 + (R() - 0.5) * 3; s += ciuffoPunta(K, [[x - 3, yb - 12, 8], [x, yb - 2, 11], [x + 2, yb + 6 + (i % 2) * 5, 7], [x + 1, yb + 12 + (i % 2) * 6, 1.2]], i % 2 ? "hg2" : "hg1"); }
    // la coda: parte dietro le orecchie e scende a punte fino alle spalle
    var tail = function (sg) {
      return K.limb([[sg * 52, -96, 10], [sg * 56, -70, 16], [sg * 58, -34, 20], [sg * 54, 10, 20], [sg * 46, 52, 14], [sg * 38, 84, 1.5]], 0);
    };
    // dietro stretto sopra (nascosto dalla testa) e lungo solo sotto la mascella: di fronte si vede soltanto la parte lunga dietro al collo, sulle spalle
    var dd = "M-52 -100C-54 -74 -52 -44 -50 -14C-52 4 -62 22 -66 40L-64 66L-56 58L-54 90L-44 62L-38 96L-28 64L-20 100L-10 66L-2 104L6 66L14 100L22 64L30 98L38 62L46 90L52 58L60 66L62 40C58 22 52 4 50 -14C52 -44 54 -74 52 -100C50 -142 -50 -142 -52 -100Z";
    var dietro = K.Pa(dd, K.U("hg3")) + "<g clip-path='" + K.clip(dd) + "'>" + dorso(K, 60, -134, 80);
    dietro += K.ciocche([[[-46, -80, 12], [-46, -30, 16], [-44, 30, 12], [-38, 84, 1.5]], [[-24, -70, 12], [-24, -20, 16], [-22, 40, 12], [-14, 80, 1.5]], [[0, -70, 12], [0, -20, 16], [2, 40, 12], [4, 92, 1.5]], [[24, -70, 12], [24, -20, 16], [22, 40, 12], [16, 84, 1.5]], [[46, -80, 12], [46, -30, 16], [44, 30, 12], [38, 78, 1.5]]], ["hg2", "hg1", "hg2", "hg1", "hg2"]);
    dietro += K.El(44, -20, 30, 80, K.soft(K.hDD, 0.5)) + K.El(0, -60, 70, 30, K.soft(K.hDD, 0.4)) + "</g>";
    return { dietro: dietro, fronte: s };
  });

  // ---------- emo: liscio e piatto, frangia lunga e dritta in diagonale che copre un occhio ----------
  A.pezzo("capelli", "emo", function (K) {
    var T = K.top, w0 = K.F.cw + 3;
    var hlf = function (u) { return [w0 * 0.92 * u, T + 18 + (-100 - T - 18) * Math.pow(u, 3)]; };
    var F = forma(K, { vol: 4, s: 4, sb: -60, ib: 12, hl: hlf, hy: 18 });
    var bers = [], i;
    for (i = 0; i < 10; i++) bers.push(lungoOut(F, 0.05 + i * 0.099));
    var s = chiudi(K, F.d, F, raggi(K, [-14, T + 8], bers, 10, ["hg1", "hg2"], { bulge: 1 }), { vol: 4 });
    var lsx = [[-(F.w - 2), -110, 12], [-(F.w + 1), -80, 15], [-(F.w + 1), -44, 13], [-(F.w - 3), -8, 9], [-(F.w - 8), 22, 1.5]];
    var ldx = [[(F.w - 4), -104, 12], [(F.w + 1), -80, 14], [(F.w + 1), -46, 12], [(F.w - 3), -14, 8], [(F.w - 8), 14, 1.5]];
    s += K.Pa(K.limb(lsx), K.U("hg2")) + K.Pa(K.limb(ldx), K.U("hg3")) + K.Pa(K.limb([[-(F.w + 3), -82, 3], [-(F.w + 3), -50, 4], [-(F.w - 1), -12, 1]]), K.hL, " opacity='.3'");
    // la frangia: un velo piatto che dalla riga a sinistra scende in diagonale e copre del tutto l'occhio destro
    var bg = "M-22 " + K.n1(T + 2) + "C16 " + K.n1(T - 8) + " 52 " + K.n1(T + 2) + " 66 -96L70 -52L68 -28L52 -40L34 -50L14 -64L-4 -80L-10 -96L-20 -108C-26 -112 -28 -118 -24 -126Z";
    var Lb = [], k;
    for (k = 0; k < 6; k++) { var q = k / 5; Lb.push([[-14 + q * 10, T + 6 + q * 4, 9], [8 + q * 16, T + 10 + q * 16, 13], [34 + q * 20, T + 34 + q * 30 + k * 2, 12], [50 + q * 20, -90 + q * 52, 2]]); }
    s += K.Pa(bg, K.U("hg3")) + "<g clip-path='" + K.clip(bg) + "'>" + K.ciocche(Lb, ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
    s += K.El(-8, T + 14, 30, 14, K.soft(K.hL, 0.45)) + K.El(54, -60, 16, 34, K.soft(K.hDD, 0.7)) + "</g>";
    s += K.St("M-20 " + K.n1(T + 4) + "C-18 " + K.n1(T + 16) + " -16 -112 -20 -110", K.hDD, 1.6, 0.55);
    var dd = "M-62 -96C-70 -64 -68 -38 -60 -14L-44 0L-30 -10L-8 2L10 -10L28 2L46 -10L60 -14C68 -38 70 -64 62 -96C60 -140 -60 -140 -62 -96Z";
    var dietro = K.Pa(dd, K.U("hg3")) + "<g clip-path='" + K.clip(dd) + "'>" + dorso(K, 58, -134, -10) + K.El(36, -50, 30, 50, K.soft(K.hDD, 0.5)) + "</g>";
    return { dietro: dietro, fronte: s };
  });

  // ---------- anime: calotta tonda, grandi ciuffi a V sulla fronte, lunghe ciocche appuntite ai lati e un ciuffetto in cima ----------
  A.pezzo("capelli", "anime", function (K) {
    var T = K.top, w0 = K.F.cw + 3;
    var hlf = function (u) { return [w0 * 0.9 * u, T + 30 + (-104 - T - 30) * Math.pow(u, 3)]; };
    var F = forma(K, { vol: 12, s: 5, sb: -80, ib: 10, hl: hlf, hy: 30 });
    var bers = [], i;
    for (i = 0; i < 9; i++) bers.push(lungoOut(F, 0.06 + i * 0.11));
    var s = chiudi(K, F.d, F, raggi(K, [0, T + 10], bers, 13, ["hg1", "hg2"], { bulge: 2 }), { vol: 12 });
    // frangia: cinque grandi punte che scendono fino alle sopracciglia, di lunghezze diverse
    var fr = [[-46, -88, -0.3], [-24, -80, 0.1], [0, -72, 0.2], [22, -82, -0.1], [44, -90, 0.3]];
    fr.forEach(function (q, j) {
      var bx = q[0] * 0.86;
      s += ciuffoPunta(K, [[bx - 6, T + 8, 14], [bx - 3, T + 28, 22], [q[0] - q[2] * 6, (T + 28 + q[1]) / 2, 18], [q[0] + q[2] * 10, q[1], 1.6]], j % 2 ? "hg2" : "hg1");
    });
    [-1, 1].forEach(function (sg) {
      s += ciuffoPunta(K, [[sg * (F.w - 3), -108, 12], [sg * (F.w + 4), -80, 17], [sg * (F.w + 3), -44, 14], [sg * (F.w - 2), -8, 9], [sg * (F.w - 8), 30, 1.2]], sg < 0 ? "hg2" : "hg3");
    });
    // il ciuffetto in cima
    s += K.Pa(K.limb([[0, T + 2, 6], [-8, T - 22, 6], [8, T - 40, 5], [32, T - 40, 1.5]]), K.U("hg2")) + K.Pa(K.limb([[1, T - 2, 2], [-6, T - 20, 2], [8, T - 36, 1.2]]), K.hL, " opacity='.5'");
    return { fronte: s, dietro: nucaBack(K, { edge: function (u) { return -56 - 16 * u * u; }, fade: 20 }) };
  });

  // ---------- arruffati: lunghezza media, ciuffi che spuntano storti in ogni direzione, anche di lato ----------
  A.pezzo("capelli", "arruffati", function (K) {
    var T = K.top, w0 = K.F.cw + 3;
    var hlf = function (u) { return [w0 * 0.92 * u, T + 28 + (-104 - T - 28) * Math.pow(u, 2.4)]; };
    var F = forma(K, { vol: 10, s: 5, sb: -72, ib: 10, hl: hlf, hy: 28 });
    var sp = [{ a: 172, len: 22, w: 14, t: -1.4 }, { a: 146, len: 14, w: 13, t: -0.2 }, { a: 120, len: 30, w: 13, t: -1 }, { a: 92, len: 12, w: 13, t: 0.2 }, { a: 66, len: 28, w: 13, t: 1 }, { a: 38, len: 14, w: 13, t: 0.1 }, { a: 10, len: 24, w: 12, t: 1.4 }];
    var c = conPunte(K, F, sp, { k: 0.1, valle: 0.95 });
    var s = K.Pa(c.d, K.U("hg3")) + "<g clip-path='" + K.clip(c.d) + "'>";
    var bers = [], i;
    for (i = 0; i < 12; i++) bers.push(lungoOut(F, 0.03 + i * 0.085));
    s += raggi(K, [-4, T + 24], bers, 13, ["hg1", "hg2", "hg1", "hg2", "hg1"], { bulge: 8, ext: 16 });
    s += K.El(-24, T - 6, 34, 22, K.soft(K.hL, 0.5)) + K.El(F.w - 6, -118, 22, 50, K.soft(K.hDD, 0.5)) + K.El(0, T + 34, F.w * 0.8, 9, K.soft(K.hDD, 0.35));
    s += peli(K, 5, 30, -F.w, F.w, T - 14, T + 30, 0.3, null, 11) + "</g>";
    // ciuffi sulla fronte: uno cade a sinistra, uno a destra, uno in su
    var fr = [[-40, -104, -16, 1], [-16, -96, 10, 2], [4, -110, -3, 3], [24, -92, 14, 4], [44, -106, -12, 5]];
    fr.forEach(function (q, j) { var bx = q[0], yb = T + 26; s += ciuffoPunta(K, [[bx - 4, yb - 10, 10], [bx - 2, yb + 6, 18], [bx + q[2] * 0.5, (yb + q[1]) / 2 + 6, 17], [bx + q[2], q[1] + 8 + (j % 2) * 8, 1.8]], j % 2 ? "hg2" : "hg1"); });
    // ciuffi che spuntano di lato, storti
    var lat = [[-1, -110, 16, -128], [-1, -94, 26, -92], [-1, -82, 22, -56], [1, -108, 18, -124], [1, -92, 28, -94], [1, -80, 24, -52]];
    lat.forEach(function (q, j) {
      var sg = q[0], bx = sg * (F.w + 2);
      s += ciuffoPunta(K, [[bx, q[1], 9], [sg * (F.w + 8), (q[1] + q[3]) / 2, 11], [sg * (F.w + 6 + q[2]), q[3], 1.4]], j % 2 ? "hg2" : "hg3");
    });
    var dd = "M-66 -100C-78 -70 -74 -34 -66 -14L-56 -4L-46 -16L-34 -2L-20 -14L-8 -2L6 -14L20 -2L34 -14L46 -2L56 -16L66 -12C76 -34 78 -70 66 -100C64 -142 -64 -142 -66 -100Z";
    var dietro = K.Pa(dd, K.U("hg3")) + "<g clip-path='" + K.clip(dd) + "'>" + dorso(K, 62, -134, -8) + K.El(40, -50, 30, 56, K.soft(K.hDD, 0.5)) + K.El(0, -80, 70, 26, K.soft(K.hDD, 0.35)) + "</g>";
    return { dietro: dietro, fronte: s };
  });

  // ---------- rocker: criniera gonfia e scalata, volume in cima e ciocche che si aprono a ventaglio sulle spalle ----------
  A.pezzo("capelli", "rocker", function (K) {
    var T = K.top, w0 = K.F.cw + 3;
    var hlf = function (u) { return [w0 * 0.93 * u, T + 24 + (-100 - T - 24) * Math.pow(u, 2.2)]; };
    var F = forma(K, { vol: 30, s: 9, sb: -80, ib: 12, hl: hlf, hy: 24, peak: 0 });
    var sp = [{ a: 170, len: 14, w: 14, t: -1 }, { a: 142, len: 20, w: 14, t: -0.5 }, { a: 116, len: 16, w: 14, t: -0.2 }, { a: 90, len: 22, w: 14, t: 0 }, { a: 64, len: 16, w: 14, t: 0.2 }, { a: 38, len: 20, w: 14, t: 0.5 }, { a: 10, len: 14, w: 12, t: 1 }];
    var s = K.Pa(F.d, K.U("hg3")) + "<g clip-path='" + K.clip(F.d) + "'>";
    var bers = [], i;
    for (i = 0; i < 10; i++) bers.push(lungoOut(F, 0.04 + i * 0.1));
    s += raggi(K, [0, T + 14], bers, 12, ["hg1", "hg2", "hg1", "hg2"], { bulge: 2, ext: 14 });
    s += K.El(-24, T - 10, 38, 24, K.soft(K.hL, 0.55)) + K.El(F.w - 6, -118, 22, 50, K.soft(K.hDD, 0.5)) + "</g>";
    [-1, 1].forEach(function (sg) {
      var tende = [
        [[sg * 3, T + 20, 8], [sg * 24, T + 32, 18], [sg * 52, -112, 22], [sg * (F.w + 12), -84, 24], [sg * (F.w + 20), -48, 22], [sg * (F.w + 26), -8, 15], [sg * (F.w + 32), 30, 1.5]],
        [[sg * 6, T + 22, 8], [sg * 32, T + 40, 14], [sg * 60, -104, 16], [sg * (F.w + 22), -70, 15], [sg * (F.w + 34), -30, 12], [sg * (F.w + 44), 10, 1.5]],
        [[sg * 4, T + 22, 7], [sg * 20, T + 38, 12], [sg * 42, -112, 12], [sg * 54, -90, 10], [sg * 56, -66, 8], [sg * 50, -46, 1.4]]
      ];
      s += K.ciocche(tende, sg < 0 ? ["hg2", "hg1", "hg2"] : ["hg3", "hg2", "hg3"]);
    });
    s += K.St("M0 " + K.n1(T + 18) + "L0 " + K.n1(T + 4), K.hDD, 2.4, 0.7) + K.St("M-1.4 " + K.n1(T + 16) + "L-1.4 " + K.n1(T + 4), K.hL, 1, 0.4);
    var dd = "M-78 -100C-96 -60 -100 -10 -94 28L-90 66L-72 44L-62 82L-46 50L-30 90L-14 54L0 92L14 54L30 90L46 50L62 82L72 44L90 66L94 28C100 -10 96 -60 78 -100C76 -148 -76 -148 -78 -100Z";
    var dietro = K.Pa(dd, K.U("hg3")) + "<g clip-path='" + K.clip(dd) + "'>" + dorso(K, 84, -134, 60);
    dietro += K.ciocche([[[-56, -80, 12], [-74, -20, 20], [-70, 34, 14], [-62, 76, 1.5]], [[-26, -70, 12], [-34, -10, 18], [-30, 44, 12], [-20, 88, 1.5]], [[0, -70, 12], [0, -10, 18], [2, 44, 12], [0, 88, 1.5]], [[26, -70, 12], [34, -10, 18], [30, 44, 12], [20, 88, 1.5]], [[56, -80, 12], [74, -20, 20], [70, 34, 14], [62, 76, 1.5]]], ["hg2", "hg1", "hg2", "hg1", "hg2"]);
    dietro += K.El(52, -20, 34, 90, K.soft(K.hDD, 0.5)) + K.El(0, -60, 90, 30, K.soft(K.hDD, 0.4)) + "</g>";
    return { dietro: dietro, fronte: s };
  });

  /* FATTI: scodella, cresta, spike, banana, spazzola, caesar, mullet, emo, anime, arruffati, rocker (tutti e 11). */
})();
// 5 nov (ab5): banana (ciuffo dalla fronte), mullet (corto davanti e ai lati, lungo solo dietro) rifatti.

// capelli-a6 (5 nov): scodella (cupola e frangia bassa), spazzola (alta, cima piatta), caesar (aderente, frangetta corta) ridisegnate con riflesso freddo `lucido` per i colori scuri e filo di luce sul bordo.


// ---- capelli-b ----
// pezzi: capelli-b — pettinature ricce e a treccine dell'avatar «illustrato» (coordinate della testa: mento 0, cima del cranio -148)
(function () {
  "use strict";
  var A = window.SGOminoA; if (!A) return;

  // ---------- aiuti: masse ricce con volume ----------
  function sub(p, passo) {   // infittisce un contorno chiuso
    var o = [];
    for (var i = 0; i < p.length; i++) { var a = p[i], b = p[(i + 1) % p.length], n = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / passo)); for (var k = 0; k < n; k++) o.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); }
    return o;
  }
  function bumpy(K, pts, r, R) {   // contorno a piccoli riccioli verso fuori
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
  function bbox(P) { var b = [999, 999, -999, -999]; P.forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); return b; }
  function dentro(P, x, y) {
    var d = false;
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) { var a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) d = !d; }
    return d;
  }
  function q20(v) { return Math.round(v * 20) / 20; }
  function semi(cx, cy, rx, ry, n) {   // metà alta di un'ellisse, da sinistra a destra
    var o = [];
    for (var i = 0; i <= n; i++) { var a = Math.PI - Math.PI * i / n; o.push([cx + rx * Math.cos(a), cy - ry * Math.sin(a)]); }
    return o;
  }
  function spec(P) { return P.map(function (q) { return [-q[0], q[1]]; }); }
  // il bordo del viso a quell'altezza (mezza larghezza): serve per le tende che lo accompagnano
  function bordo(w, y) { return y <= -78 ? w + 1 : w * (1 - 0.4 * Math.pow((y + 78) / 78, 1.5)); }
  // l'attaccatura sulla fronte (da tempia destra a tempia sinistra): yc = in mezzo, ys = alle tempie
  function attacca(w, yc, ys) {
    var r = [[w + 1, ys], [w, ys - 16], [w * 0.9, yc + 14], [w * 0.64, yc + 4], [w * 0.32, yc + 0.5], [0, yc]];
    var l = r.slice(0, 5).reverse().map(function (q) { return [-q[0], q[1]]; });
    return r.concat(l);
  }
  // la massa riccia: base, ombra, lobi (ognuno con la sua luce e la sua ombra), trama di «c» e «s» a pochi tratti, luce in alto a sinistra
  function massa(K, d, P, o) {
    var R = K.rnd(o.seme || 5), n1 = K.n1, b = bbox(P), W = b[2] - b[0], H = b[3] - b[1], s = "", i;
    if (o.proietta) s += K.Pa(d, K.hDD, " opacity='.4' transform='translate(2.5 5)'");
    s += K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>";
    s += K.El(b[2] - W * 0.18, (b[1] + b[3]) / 2 + H * 0.06, W * 0.36, H * 0.78, K.soft(K.hDD, 0.5));
    if (o.bassoOmbra) s += K.El((b[0] + b[2]) / 2, b[3] - 8, W * 0.5, 22, K.soft(K.hDD, 0.45));
    var L = o.lobo || 24, rg = 0, x, y;
    for (y = b[1]; y < b[3] + L; y += L * 0.86, rg++) for (x = b[0] + (rg % 2 ? L / 2 : 0); x < b[2] + L; x += L) {
      var jx = x + (R() - 0.5) * L * 0.5, jy = y + (R() - 0.5) * L * 0.5;
      if (!dentro(P, jx, jy)) continue;
      var r = L * (0.62 + R() * 0.2), lum = Math.max(0, 1 - ((jx - b[0]) / W * 0.55 + (jy - b[1]) / H * 0.55));
      s += K.El(jx + r * 0.3, jy + r * 0.42, r * 0.92, r * 0.72, K.soft(K.hDD, q20(0.26 + 0.16 * R())));
      s += K.El(jx - r * 0.3, jy - r * 0.36, r * 0.7, r * 0.5, K.soft(K.hL, q20(0.1 + 0.4 * lum)));
    }
    var dk = "", md = "", lc = "", cnt = o.cnt || 60, r0 = o.r || 6, tent = 0;
    for (i = 0; i < cnt * 3 && tent < cnt; i++) {
      var cx = b[0] + R() * W, cy = b[1] + R() * H;
      if (!dentro(P, cx, cy)) continue;
      tent++;
      var q = r0 * (0.6 + R() * 0.5), rot = R() * 6.28, cs = Math.cos(rot), sn = Math.sin(rot);
      var p = function (px, py) { return n1(cx + px * cs - py * sn) + " " + n1(cy + px * sn + py * cs); };
      dk += R() > 0.45 ? "M" + p(q, -q * 0.7) + "C" + p(-q * 0.4, -q * 1.1) + " " + p(-q * 1.1, q * 0.2) + " " + p(-q * 0.1, q * 0.9) : "M" + p(-q, -q * 0.4) + "C" + p(-q * 0.5, -q * 1.1) + " " + p(q * 0.1, -q * 0.3) + " " + p(0, 0) + "S" + p(q * 0.6, q * 1.1) + " " + p(q, q * 0.4);
      if (R() < 0.15 + 0.6 * Math.max(0, 1 - ((cx - b[0]) / W + (cy - b[1]) / H))) lc += "M" + n1(cx - q * 0.5) + " " + n1(cy - q * 0.9) + "q" + n1(q * 0.5) + " " + n1(-q * 0.4) + " " + n1(q) + " " + n1(-q * 0.1);
      if (R() < 0.4) md += "M" + n1(cx - q) + " " + n1(cy + q * 0.4) + "c" + n1(q * 0.3) + " " + n1(-q * 1.1) + " " + n1(q * 1.5) + " " + n1(-q * 0.9) + " " + n1(q * 1.7) + " " + n1(q * 0.1);
    }
    s += "<path d='" + dk + "' stroke='" + K.hDD + "' stroke-width='1.9' stroke-linecap='round' fill='none' opacity='.5'/><path d='" + md + "' stroke='" + K.capelli + "' stroke-width='2.1' stroke-linecap='round' fill='none' opacity='.45'/><path d='" + lc + "' stroke='" + K.hL + "' stroke-width='1.7' stroke-linecap='round' fill='none' opacity='.75'/>";
    s += (o.extra || "");
    s += K.El(b[0] + W * 0.3, b[1] + H * 0.12, W * 0.28, H * 0.1, K.soft("#ffffff", 0.12));
    return s + "</g>";
  }
  // l'ombra che la frangia o le tempie buttano sulla fronte (sotto i capelli, ritagliata sul viso)
  function ombraViso(K, y, larg, op) {
    return "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(0, y, larg, 13, K.soft(K.hDD, op || 0.32)) + "</g>";
  }
  // una ciocca a molla che scende (A = larghezza dell'onda, passo = distanza fra le spire)
  function molla(K, x, y0, lung, Aa, passo, tipo, ws) {
    var P = [], N = Math.round(lung / passo * 5), i;
    for (i = 0; i <= N; i++) { var t = i / N, th = t * lung / passo * 2 * Math.PI, a = Aa * (1 - 0.35 * t); P.push([x + a * Math.sin(th) + (tipo || 0) * t * 6, y0 + t * lung - a * 0.7 * Math.cos(th)]); }
    var d = K.liscio(P), w = ws || Aa * 0.78;
    return K.St(d, K.hDD, w + 2.2, 0.6) + K.St(d, K.capelli, w, 0.95) + K.St(d, K.mix(K.capelli, K.hL, 0.4), w * 0.38, 0.8).replace("<path ", "<path transform='translate(-1.6 -1.8)' ") + K.St(d, K.hDD, 1.2, 0.5);
  }
  // una treccina / ciocca a corda: nodi [x, y], larghezza w, con la torsione
  function corda(K, N, w, id, liscia) {
    var nodes = N.map(function (q, i) { return [q[0], q[1], i === N.length - 1 ? w * 0.82 : w]; }), d = K.limb(nodes, 0.5), c = K.liscio(N);
    var s = K.Pa(d, K.U(id || "hg2"), " stroke='" + K.hDD + "' stroke-opacity='.55' stroke-width='1.1'");
    s += "<g clip-path='" + K.clip(d) + "'>";
    if (!liscia) s += "<path d='" + c + "' fill='none' stroke='" + K.hDD + "' stroke-width='" + K.n1(w * 0.95) + "' opacity='.38' stroke-dasharray='1.4 4.6' transform='translate(0.8 0)'/>";
    s += "<path d='" + c + "' fill='none' stroke='" + K.hL + "' stroke-width='" + K.n1(w * 0.2) + "' opacity='.5' transform='translate(" + K.n1(-w * 0.24) + " 0)' stroke-linecap='round'/>";
    s += "<path d='" + c + "' fill='none' stroke='" + K.hDD + "' stroke-width='" + K.n1(w * 0.3) + "' opacity='.35' transform='translate(" + K.n1(w * 0.36) + " 0)' stroke-linecap='round'/>";
    return s + "</g>";
  }

  // =========================================================
  //  NUBE — il cuore dei ricci «a casco»: massa dietro la testa + cappello e tende davanti
  //  o: rx (larghezza), cy/ry (cima), fondo (fino a dove scendono ai lati), yc/ys (attaccatura), seme, frangia
  // =========================================================
  function nube(K, o) {
    var w = K.F.cw, R = K.rnd(o.seme), i;
    // --- dietro: la massa intera che si vede intorno e sotto
    var D = semi(0, o.cy + 2, o.rx + 6, o.ry + 4, 18);
    var sv = o.sv || 0, f = o.fondo + 6, rr = o.rx + 8 + sv;
    D = D.concat([[rr, o.cy + 24], [rr + 1, (o.cy + f) / 2], [rr - 5, f - 18], [rr - 18, f - 2], [rr - 40, f + 4], [0, f + 6]], spec([[rr, o.cy + 24], [rr + 1, (o.cy + f) / 2], [rr - 5, f - 18], [rr - 18, f - 2], [rr - 40, f + 4]]).reverse());
    var dD = bumpy(K, D, o.r + 0.5, R);
    var dietro = massa(K, dD, D, { seme: o.seme + 1, lobo: o.lobo, cnt: o.cnt * 1.1, r: o.r, bassoOmbra: true });
    // --- davanti: cima + tende ai lati del viso
    var P = semi(0, o.cy + 4, o.rx, o.ry, 18), dx = o.rx - 1 + sv, tenda = [];
    if (o.fondo > -80) {
      var fb = o.fondo;
      tenda = [[dx, o.cy + 24], [dx + 1, (o.cy + fb) / 2], [dx - 4, fb - 18], [dx - 16, fb - 4], [dx - 34, fb + 2]];
      [fb - 6, fb - 30, fb - 56, fb - 82].forEach(function (y) { if (y > -90) tenda.push([bordo(w, y) + 3, y]); });
    } else {
      tenda = [[dx - 2, -88], [w + 12, -82]];
    }
    var Hs = o.frangia ? frangiaLinea(K, w, o.fy || 0) : attacca(w, o.yc, o.ys);
    var full = P.concat(tenda, Hs, spec(tenda).reverse());
    var dF = bumpy(K, full, o.r, R);
    var s = ombraViso(K, o.frangia ? -98 : o.yc + 4, 44, o.frangia ? 0.38 : 0.3);
    s += massa(K, dF, full, { seme: o.seme + 2, lobo: o.lobo, cnt: o.cnt, r: o.r, proietta: true });
    return { D: dietro, F: s, w: w };
  }
  function frangiaLinea(K, w, dy) {   // il bordo basso della frangia: dritto sopra le sopracciglia, appena a tende (dy = più giù)
    var r = [[w + 1, -92], [w - 2, -100 + dy], [w * 0.8, -104 + dy], [w * 0.5, -102 + dy], [w * 0.22, -100 + dy], [0, -101 + dy]];
    var l = r.slice(0, 5).reverse().map(function (q) { return [-q[0], q[1]]; });
    return r.concat(l);
  }

  // =========================================================
  //  RICCI — grande massa riccia che scende alle spalle
  // =========================================================
  A.pezzo("capelli", "ricci", function (K) {
    var n = nube(K, { rx: 90, cy: -98, ry: 86, fondo: 46, yc: -132, ys: -92, seme: 71, r: 5.2, lobo: 24, cnt: 90 });
    // lunghi boccoli a molla che scendono sulle spalle
    var m = molla(K, -84, 30, 100, 8, 20, -0.3) + molla(K, -66, 40, 80, 7, 18, 0.2) + molla(K, 84, 30, 94, 8, 20, 0.3) + molla(K, 66, 40, 76, 7, 18, -0.2);
    return { dietro: n.D, fronte: n.F + m };
  });

  // =========================================================
  //  RICCIBOB — caschetto riccio al mento
  // =========================================================
  A.pezzo("capelli", "riccibob", function (K) {
    var n = nube(K, { rx: 72, cy: -96, ry: 78, fondo: 8, sv: 16, yc: -132, ys: -92, seme: 83, r: 8, lobo: 32, cnt: 40 });
    return { dietro: n.D, fronte: n.F };
  });

  // =========================================================
  //  RICCIFRANGIA — caschetto riccio con la frangia di ricci
  // =========================================================
  A.pezzo("capelli", "riccifrangia", function (K) {
    var n = nube(K, { rx: 82, cy: -96, ry: 80, fondo: -34, yc: -108, ys: -92, seme: 97, r: 4.2, lobo: 17, cnt: 90, frangia: true, fy: 11 });
    var m = molla(K, -70, -34, 30, 4.4, 12, -0.3) + molla(K, 70, -34, 30, 4.4, 12, 0.3);
    return { dietro: n.D, fronte: n.F + m };
  });

  // =========================================================
  //  RICCIOLETTI — ricci corti e soffici intorno alla testa, alle orecchie
  // =========================================================
  A.pezzo("capelli", "riccioletti", function (K) {
    var n = nube(K, { rx: 68, cy: -97, ry: 61, fondo: -68, yc: -126, ys: -94, seme: 61, r: 4.4, lobo: 16, cnt: 54 });
    return { dietro: n.D, fronte: n.F };
  });

  // =========================================================
  //  AFRO — grande sfera riccia
  // =========================================================
  A.pezzo("capelli", "afro", function (K) {
    var w = K.F.cw, R = K.rnd(113);
    var D = semi(0, -96, 122, 110, 20).concat([[122, -60], [118, -30], [104, -8], [70, 4], [30, 6], [0, 7], [-30, 6], [-70, 4], [-104, -8], [-118, -30], [-122, -60]]);
    var dD = bumpy(K, D, 7, R);
    var dietro = massa(K, dD, D, { seme: 114, lobo: 28, cnt: 130, r: 7, bassoOmbra: true });
    var cap = semi(0, -100, 113, 106, 20).concat([[112, -90], [80, -82], [w + 8, -86]]).concat(attacca(w, -130, -92)).concat([[-w - 8, -86], [-80, -82], [-112, -90]]);
    var dF = bumpy(K, cap, 6.6, R);
    var fronte = ombraViso(K, -126, 46, 0.3) + massa(K, dF, cap, { seme: 115, lobo: 26, cnt: 90, r: 6.6, proietta: true });
    return { dietro: dietro, fronte: fronte };
  });

  // =========================================================
  //  AFROALTO / RICCIOCIUFFO — cima alta e riccia, lati cortissimi
  // =========================================================
  function lati(K, w, y0) {   // i lati rasati: una velatura di capelli sui lati e sulla nuca, che sfuma verso il basso
    var R = K.rnd(31), n1 = K.n1, g = K.LG("cb_fd", 0, y0, 0, -86, [[0, K.capelli, 0.85], [0.55, K.capelli, 0.5], [1, K.capelli, 0.1]], true), p = "", i;
    var s = "<g clip-path='" + K.clip(K.faceD) + "'>" + "<rect x='-70' y='" + y0 + "' width='140' height='" + (-86 - y0) + "' fill='" + g + "'/>";
    for (i = 0; i < 70; i++) { var x = (R() * 2 - 1) * (w + 2), y = y0 + R() * (-90 - y0), a = R() * 6.28; p += "M" + n1(x) + " " + n1(y) + "l" + n1(Math.cos(a) * 1.8) + " " + n1(Math.sin(a) * 1.8 - 1); }
    s += "<path d='" + p + "' stroke='" + K.hDD + "' stroke-width='1.1' stroke-linecap='round' opacity='.5'/></g>";
    return s;
  }
  function cimaRicci(K, o) {
    var w = K.F.cw, R = K.rnd(o.seme);
    var T = K.top - o.vol, rx = w + o.lat;
    var D = semi(0, -104, rx + 6, -104 - T + 4, 16).concat([[rx + 4, -88], [rx - 6, -82], [-rx + 6, -82], [-rx - 4, -88]]);
    var dD = bumpy(K, D, o.r, R);
    var dietro = massa(K, dD, D, { seme: o.seme + 1, lobo: o.lobo, cnt: o.cnt, r: o.r });
    var cima = semi(0, -106, rx, -106 - T, 16).concat([[rx - 2, -98], [w + 3, -96]]).concat(attacca(w, o.yc, -98).slice()).concat([[-w - 3, -96], [-rx + 2, -98]]);
    var dF = bumpy(K, cima, o.r - 0.4, R);
    var fronte = lati(K, w, K.top + 6) + ombraViso(K, o.yc + 4, 42, 0.3) + massa(K, dF, cima, { seme: o.seme + 2, lobo: o.lobo, cnt: o.cnt * 0.8, r: o.r, proietta: true });
    return { dietro: dietro, fronte: fronte };
  }
  A.pezzo("capelli", "afroalto", function (K) { return cimaRicci(K, { seme: 131, vol: 74, lat: 5, yc: -122, r: 6.4, lobo: 25, cnt: 90 }); });
  A.pezzo("capelli", "ricciciuffo", function (K) { return cimaRicci(K, { seme: 151, vol: 54, lat: -1, yc: -116, r: 5.8, lobo: 22, cnt: 70 }); });

  // =========================================================
  //  BOCCOLI / BOCCOLI MEDI — ricci a spirale, testa liscia con la riga in mezzo
  // =========================================================
  function boccoli(K, lungF, lungD, seme) {
    var w = K.F.cw, k;
    // dietro: massa liscia ampia e molle fitte e grosse (si vedono ai lati del collo e, di spalle, su tutta la schiena)
    var back = "M" + (-w - 6) + " -92C" + (-w - 14) + " -40 " + (-w - 16) + " " + (lungD - 30) + " " + (-w - 6) + " " + (lungD - 64) + "L" + (w + 6) + " " + (lungD - 64) + "C" + (w + 16) + " " + (lungD - 30) + " " + (w + 14) + " -40 " + (w + 6) + " -92C" + (w - 6) + " -154 " + (-w + 6) + " -154 " + (-w - 6) + " -92Z";
    var dietro = K.Pa(back, K.U("hg3")) + "<g clip-path= + K.clip(back) + >" + K.El(70, -20, 44, 160, K.soft(K.hDD, 0.5)) + "</g>";
    var N = 13;
    for (k = 0; k < N; k++) {
      var x = -w - 24 + (2 * w + 48) * k / (N - 1);
      dietro += molla(K, x, -66 + (k % 2) * 8, lungD + 14 - (k % 3) * 8, 7.2, 21 + (k % 2) * 2, k < N / 2 ? -0.5 : 0.5, 10.5);
    }
    // davanti: ricciolo grossi ai lati del viso (sotto la testa liscia), poi la calotta con la riga in mezzo
    var s = "";
    [-1, 1].forEach(function (l) {
      s += molla(K, l * (w + 7), -92, lungF + 4, 7.2, 21, l * 0.4, 10.5) + molla(K, l * (w + 17), -86, lungF - 18, 6.6, 20, l * 0.7, 9.6) + molla(K, l * (w - 1), -90, lungF - 34, 6, 19, l * 0.2, 9);
    });
    var cal = "M" + (-w - 8) + " -78C" + (-w - 14) + " -130 -56 -168 -2 -168C52 -168 " + (w + 14) + " -130 " + (w + 8) + " -78L" + (w + 2) + " -92C" + (w - 4) + " -112 30 -128 0 -132C-30 -128 " + (-w + 4) + " -112 " + (-w - 2) + " -92Z";
    s += ombraViso(K, -126, 40, 0.3) + K.Pa(cal, K.U("hg3")) + "<g clip-path= + K.clip(cal) + >";
    s += K.ciocche([
      [[0, -132, 7], [-16, -150, 14], [-44, -148, 18], [-w - 8, -118, 16], [-w - 14, -84, 5]],
      [[0, -134, 7], [-10, -158, 14], [-40, -168, 16], [-w - 20, -134, 16], [-w - 24, -92, 4]],
      [[0, -132, 7], [16, -150, 14], [44, -148, 18], [w + 8, -118, 16], [w + 14, -84, 5]],
      [[0, -134, 7], [10, -158, 14], [40, -168, 16], [w + 20, -134, 16], [w + 24, -92, 4]],
      [[-6, -140, 6], [-30, -146, 10], [-50, -126, 10], [-w - 4, -100, 4]],
      [[6, -140, 6], [30, -146, 10], [50, -126, 10], [w + 4, -100, 4]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
    s += K.El(70, -100, 26, 60, K.soft(K.hDD, 0.5)) + K.El(-24, -158, 44, 16, K.soft(K.hL, 0.55)) + K.St("M-44 -138C-32 -158 -4 -164 24 -158", "#ffffff", 5, 0.14) + K.St("M-36 -128C-26 -144 -6 -152 12 -148", "#ffffff", 2, 0.12) + "</g>";
    s += K.St("M0 -132L0 -166", K.hDD, 1.6, 0.5);
    return { dietro: dietro, fronte: s };
  }
  A.pezzo("capelli", "boccolimedi", function (K) { return boccoli(K, 112, 58, 17); });
  A.pezzo("capelli", "boccoli", function (K) { return boccoli(K, 190, 130, 19); });

  // un punto della curva liscia (Catmull-Rom) che passa per i nodi, t da 0 a 1 → [x, y, direzione]
  function sulla(N, t) {
    var n = N.length - 1, f = Math.min(n - 1e-6, Math.max(0, t * n)), i = Math.floor(f), u = f - i;
    var p0 = N[Math.max(0, i - 1)], p1 = N[i], p2 = N[i + 1], p3 = N[Math.min(n, i + 2)], o = [], k, dd = [];
    for (k = 0; k < 2; k++) {
      o[k] = 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u);
      dd[k] = 0.5 * ((-p0[k] + p2[k]) + 2 * (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u + 3 * (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u);
    }
    var l = Math.hypot(dd[0], dd[1]) || 1;
    return [o[0], o[1], dd[0] / l, dd[1] / l];
  }
  // treccina vera: una corda con i punti a «V» della spina di pesce
  function treccina(K, N, w, id, passo) {
    var s = corda(K, N, w, id, true), n1 = K.n1, lun = 0, k, prev = N[0];
    for (k = 1; k < N.length; k++) { lun += Math.hypot(N[k][0] - N[k - 1][0], N[k][1] - N[k - 1][1]); }
    var cnt = Math.max(3, Math.round(lun / (passo || w * 0.62))), dk = "", lt = "", i;
    for (i = 1; i < cnt; i++) {
      var q = sulla(N, i / cnt), nx = -q[3], ny = q[2], h = w * 0.36;
      dk += "M" + n1(q[0] + nx * h) + " " + n1(q[1] + ny * h) + "L" + n1(q[0] + q[2] * w * 0.32) + " " + n1(q[1] + q[3] * w * 0.32) + "L" + n1(q[0] - nx * h) + " " + n1(q[1] - ny * h);
      lt += "M" + n1(q[0] + nx * h * 0.9 - q[2] * 1.3) + " " + n1(q[1] + ny * h * 0.9 - q[3] * 1.3) + "L" + n1(q[0] - q[2] * 1.0) + " " + n1(q[1] - q[3] * 1.0);
    }
    return s + "<path d='" + dk + "' fill='none' stroke='" + K.hDD + "' stroke-width='1.4' stroke-linecap='round' stroke-linejoin='round' opacity='.6'/><path d='" + lt + "' fill='none' stroke='" + K.hL + "' stroke-width='1.1' stroke-linecap='round' opacity='.5'/>";
  }
  function hy(w, x) { return -116 + 22 * Math.pow(Math.min(1, Math.abs(x) / (w + 2)), 2.2); }   // l'attaccatura sulla fronte a quella x

  // =========================================================
  //  TRECCINE — treccine strette dalla fronte alla nuca (cornrows)
  // =========================================================
  A.pezzo("capelli", "treccine", function (K) {
    var w = K.F.cw, n = 7, i;
    var cal = "M" + (-w - 5) + " -78C" + (-w - 10) + " -124 -50 -158 -2 -158C46 -158 " + (w + 10) + " -124 " + (w + 5) + " -78L" + (w + 1) + " -94C" + (w - 2) + " -102 " + (w * 0.8) + " -108 " + (w * 0.5) + " -112C" + (w * 0.25) + " -115 " + (-w * 0.25) + " -115 " + (-w * 0.5) + " -112C" + (-w * 0.8) + " -108 " + (-w + 2) + " -102 " + (-w - 1) + " -94Z";
    var s = ombraViso(K, -108, 40, 0.22) + K.Pa(cal, K.mix(K.skDD, K.hDD, 0.55)) + "<g clip-path='" + K.clip(cal) + "'>";
    for (i = 0; i < n; i++) {
      var u = (i - (n - 1) / 2) / ((n - 1) / 2), x0 = u * (w - 2), au = Math.abs(u);
      var N = [[x0, hy(w, x0) + 5], [u * (w + 4), hy(w, x0) - 12 + 8 * au], [u * (w * 0.7), K.top - 6 + 14 * au], [u * 14, K.top - 8]];
      s += treccina(K, N, 9.4, i % 2 ? "hg1" : "hg2", 6.5) + K.St(K.liscio(N), K.hL, 1.6, 0.55).replace("<path ", "<path transform='translate(-2.4 0)' ");
    }
    s += K.El(60, -100, 26, 62, K.soft(K.hDD, 0.5)) + K.El(-24, -152, 44, 16, K.soft(K.hL, 0.45)) + K.St("M-40 -136C-28 -152 -4 -158 22 -152", "#ffffff", 4, 0.14) + "</g>";
    // dietro: sulla nuca le file scendono fino al collo e finiscono in treccine corte
    var d = "";
    for (i = 0; i < 9; i++) {
      var v = (i - 4) / 4, M = [[v * 10, K.top - 6], [v * (w * 0.8), -118], [v * (w * 0.96), -66], [v * (w * 0.84), -20], [v * (w * 0.72), 16], [v * (w * 0.7), 40 + (i % 2) * 6]];
      d += treccina(K, M, 9.4, i % 2 ? "hg1" : "hg2", 6.5) + K.St(K.liscio(M), K.hL, 1.6, 0.5).replace("<path ", "<path transform='translate(-2.4 0)' ");
    }
    return { dietro: d, fronte: s };
  });

  // =========================================================
  //  DREAD — dreadlock: radici sulla testa e ciocche a corda che scendono
  // =========================================================
  A.pezzo("capelli", "dread", function (K) {
    var w = K.F.cw, i, R = K.rnd(23);
    // dietro: massa scura dietro e le ciocche lunghe sulla schiena
    var base = "M" + (-w - 6) + " -92C" + (-w - 14) + " -40 " + (-w - 6) + " 0 " + (-w + 4) + " 60L" + (w - 4) + " 60C" + (w + 6) + " 0 " + (w + 14) + " -40 " + (w + 6) + " -92C" + (w - 6) + " -150 " + (-w + 6) + " -150 " + (-w - 6) + " -92Z";
    var dietro = K.Pa(base, K.mix(K.capelli, K.hDD, 0.6));
    var xs = [-78, -68, -57, -46, -35, -24, -12, 0, 12, 24, 35, 46, 57, 68, 78], lung = [100, 126, 112, 138, 116, 144, 120, 148, 116, 142, 112, 134, 108, 124, 98];
    xs.forEach(function (x, k) {
      var sg = x < 0 ? -1 : 1, tt = Math.abs(x) / 78, sw = (k % 2 ? 1 : -1) * 3;
      dietro += corda(K, [[x * 0.8, -96], [x, -56], [x * 1.02 + sg * 2, -10], [x * 0.98 + sg * 5 * tt + sw * 2, lung[k] * 0.5], [x * 0.9 + sg * 6 * tt - sw * 2, lung[k] * 0.9]], 11, k % 2 ? "hg1" : "hg2");
    });
    // davanti: calotta con le radici (le ciocche corte nascono in cima e arrivano all'attaccatura) e le ciocche lunghe che incorniciano il viso
    var cal = "M" + (-w - 6) + " -78C" + (-w - 16) + " -130 -54 -162 -2 -162C48 -162 " + (w + 16) + " -130 " + (w + 6) + " -78L" + (w + 2) + " -92C" + (w - 2) + " -102 " + (w * 0.8) + " -108 " + (w * 0.5) + " -112C" + (w * 0.2) + " -115 " + (-w * 0.2) + " -115 " + (-w * 0.5) + " -112C" + (-w * 0.8) + " -108 " + (-w + 2) + " -102 " + (-w - 2) + " -92Z";
    var s = ombraViso(K, -108, 40, 0.22) + K.Pa(cal, K.mix(K.capelli, K.hDD, 0.35));
    var nr = 9;
    for (i = 0; i < nr; i++) {
      var u = (i - (nr - 1) / 2) / ((nr - 1) / 2), xe = u * (w - 2), ye = hy(w, xe) - 2, au = Math.abs(u);
      s += corda(K, [[u * 6, K.top - 4], [u * (w * 0.5), K.top + 6 + 6 * au], [u * (w * 0.9), (K.top + ye) / 2 - 2 + 10 * au], [xe, ye]], 12.5, i % 2 ? "hg1" : "hg2");
    }
    s += "<g clip-path='" + K.clip(cal) + "'>" + K.El(64, -104, 26, 56, K.soft(K.hDD, 0.4)) + K.El(-26, -154, 44, 14, K.soft(K.hL, 0.3)) + "</g>";
    var fr = [[-1, 0, 86, 11], [-1, 1, 108, 9.5], [-1, 2, 66, 8.5], [1, 0, 98, 10.5], [1, 1, 72, 9], [1, 2, 104, 9.5]];
    fr.forEach(function (c) {
      var sg = c[0], k = c[1], l = c[2], ww = c[3], x1 = sg * (w + 4 + k * 8), sw = (k % 2 ? 6 : -5) * sg;
      s += corda(K, [[sg * (w - 6 + k * 3), -112 + k * 8], [sg * (w + k * 4 + 6), -76 + k * 8], [x1 + sg * 1 + sw * 0.5, -4 + k * 6], [x1 + sg * 5 - sw * 0.6, l * 0.55], [x1 + sg * 6 + sw * 0.8, l * 0.8], [x1 + sg * 4 - sw * 0.4, l]], ww, k % 2 ? "hg1" : "hg2");
    });
    return { dietro: dietro, fronte: s };
  });
})();
// ---------------------------------------------------------------------------
// Voci fatte (capelli-b): ricci, riccibob, riccifrangia, riccioletti, afro, afroalto, ricciciuffo, boccolimedi, boccoli, treccine, dread
// 5 nov (ab5): treccine e dread (attaccatura piu' bassa, niente striscia di pelle), ricci lunghi / riccibob corto / riccifrangia / afro / afroalto resi diversi.
// 5 nov (secondo tempo, capelli-b6): sagome diverse — riccioletti (cappello stretto sopra le orecchie), riccibob (si allarga alla mascella), riccifrangia (media, frangia bassa), afro (sfera enorme), ricciciuffo (lati rasati, cima alta); treccine con scalpo scuro tra le file e riflesso per fila.


// ---- capelli-c ----
// pezzi: capelli-c — pettinature medie e da raccolti (tendina, surfista, caschettolungo, ciuffolaterale, scalati,
// bobfrangia, bobasimmetrico, sfilato, codinouomo, codinobasso) per gli avatar illustrati. Coordinate della testa (mento 0).
(function () {
  "use strict";
  var A = window.SGOminoA; if (!A) return;

  // ---------- aiuti ----------
  function mir(P) { return P.map(function (p) { var q = p.slice(); q[0] = -q[0]; return q; }); }
  function rev(P) { return P.slice().reverse(); }
  // forma simmetrica: O = esterno da cima verso la punta, I = interno dalla riga verso la punta (destra); a sinistra specchiata
  function simm(K, top, O, I, hy) {
    var pts = [[0, top]].concat(O, rev(I), [[0, hy]], mir(I), rev(mir(O)));
    return K.lisciaChiusa(pts);
  }
  // ciocche che scorrono tra il bordo interno e quello esterno (stessi indici); w = larghezza
  function flusso(A1, B1, n, w, prof) {
    var L = [], pr = prof || [0.55, 1, 1, 0.85, 0.5, 0.15];
    for (var k = 0; k < n; k++) {
      var t = (k + 0.5) / n;
      L.push(A1.map(function (p, i) { var q = B1[Math.min(i, B1.length - 1)]; return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t, Math.max(1.5, w * (pr[Math.min(i, pr.length - 1)]))]; }));
    }
    return L;
  }
  // volume: ombra a destra, luce in alto a sinistra, velo lucido
  function vol(K, d, lucido, dx) {
    var s = "<g clip-path='" + K.clip(d) + "'>";
    s += K.El(68 + (dx || 0), -80, 34, 112, K.soft(K.hDD, 0.5)) + K.El(-30, -156, 46, 20, K.soft(K.hL, 0.5));
    if (lucido !== false) s += K.St("M-48 -128C-38 -154 -4 -164 26 -156", "#ffffff", 5, 0.13) + K.St("M-40 -118C-30 -142 -8 -152 12 -148", "#ffffff", 2, 0.12);
    return s + "</g>";
  }
  function ombra(K, d, col, op) { return "<g clip-path='" + K.clip(d) + "'>" + K.Pa(d, col || K.hDD, " opacity='" + (op || 0.3) + "'") + "</g>"; }
  // una massa: base col gradiente, ciocche, volume
  function massa(K, d, cioc, ids, lucido) {
    var s = K.Pa(d, K.U("hg3"));
    if (cioc && cioc.length) s += "<g clip-path='" + K.clip(d) + "'>" + K.ciocche(cioc, ids || ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]) + "</g>";
    return s + vol(K, d, lucido);
  }
  // ombra sotto la testa/collo per i capelli che stanno dietro
  function nuca(K, y0, y1, w) { return K.Pa("M" + (-w) + " " + y0 + "L" + w + " " + y0 + "L" + (w + 4) + " " + y1 + "C" + (w * 0.4) + " " + (y1 + 10) + " " + (-w * 0.4) + " " + (y1 + 10) + " " + (-w - 4) + " " + y1 + "Z", K.hDD, " opacity='.4'"); }
  // la massa di capelli dietro la testa e il collo: ciocche verticali, luce a sinistra, ombra a destra e sotto la testa
  function dorso(K, d, w, y1) {
    var C = [], i;
    for (i = -4; i <= 4; i++) { var x = i * w / 4.1; C.push([[x * 0.45, -146, 4], [x * 1.04, -104, 15], [x * 1.1, -50, 15], [x * 1.04, y1 * 0.45, 13], [x * 1.0, y1 - 2, 3]]); }
    var s = K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>" + K.ciocche(C, ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2", "hg1", "hg2", "hg1"]);
    s += K.El(w * 0.95, -30, w * 0.5, 130, K.soft(K.hDD, 0.5)) + K.El(-w * 0.9, -40, w * 0.3, 90, K.soft(K.hL, 0.25)) + K.El(0, -6, w * 0.62, 26, K.soft(K.hDD, 0.55)) + K.El(0, y1 - 4, w * 1.05, 10, K.soft(K.hDD, 0.35));
    return s + "</g>";
  }
  function lato(K, N, ids) { // una lunghezza che scende ai lati, con luce a sinistra e ombra a destra
    var d = K.limb(N), M = N.slice(0, -1), g = "<g clip-path='" + K.clip(d) + "'>";
    g += K.St(K.liscio(M.map(function (p) { return [p[0] + p[2] * 0.3, p[1]]; })), K.hDD, 7, 0.32);
    g += K.St(K.liscio(M.map(function (p) { return [p[0] - p[2] * 0.2, p[1]]; })), K.hL, 2.6, 0.38);
    g += K.St(K.liscio(M.map(function (p) { return [p[0] - p[2] * 0.02, p[1]]; })), K.hDD, 1.2, 0.3);
    return K.Pa(d, K.U(ids || "hg2")) + g + "</g>";
  }
  // ciocca morbida: massa + tre fili sfalsati che finiscono in punte diverse (mai un bordo unico e netto)
  // N = nodi [x, y, larghezza]; o = { onda: ampiezza, punte: 0 = chiusa, flick: sposta in fuori le ultime punte, tronca: punta dritta }
  function ciuffoM(K, N, o) {
    o = o || {};
    var n = N.length, sg = N[n >> 1][0] < 0 ? -1 : 1, P = N.map(function (q, i) {
      var t = i / (n - 1), x = q[0] + (o.onda ? sg * o.onda * Math.sin(i * 1.25 + (o.fase || 0)) * Math.min(1, t * 2) : 0) + (o.flick ? sg * o.flick * Math.pow(t, 3) : 0);
      return [x, q[1], q[2]];
    });
    var base = o.tronca ? P : P.slice(0, n - 1).concat([[P[n - 1][0], P[n - 1][1] - 0, P[n - 1][2] * 0.5]]);
    var d = K.limb(base, o.tronca ? 0 : 0.35), s = K.El(P[n >> 1][0] - sg * 8, P[n >> 1][1] + 8, P[n >> 1][2] * 0.9, (P[n - 1][1] - P[0][1]) * 0.5, K.soft(K.hDD, 0.35));
    s += K.Pa(d, K.U(sg < 0 ? "hg2" : "hg1")) + "<g clip-path='" + K.clip(d) + "'>";
    var F = [[-0.3, 0.46, 1, "hg1"], [0.02, 0.5, 0, "hg2"], [0.32, 0.4, 2, "hg1"]], k, L = [], m = P.length;
    for (k = 0; k < 3; k++) {
      var f = F[k], cut = f[2], sub = P.slice(0, m - cut).map(function (q, i) { return [q[0] + f[0] * q[2] + Math.sin(i + k * 2) * 1.2, q[1] + (i === 0 ? 0 : 0), Math.max(1.5, q[2] * f[1])]; });
      if (cut && !o.tronca) sub[sub.length - 1][2] = 1.5;
      L.push(sub);
    }
    s += K.ciocche(L, ["hg1", "hg2", "hg1"]);
    var Mi = P[(n >> 1)];
    s += K.St(K.liscio(P.slice(0, n - 1).map(function (q) { return [q[0] + sg * q[2] * 0.34, q[1]]; })), K.hDD, Math.max(5, Mi[2] * 0.28), 0.3);
    s += K.St(K.liscio(P.slice(0, n - 1).map(function (q) { return [q[0] - sg * q[2] * 0.3, q[1]]; })), K.hL, 2.4, 0.4);
    s += K.El(P[1][0], P[1][1] + 6, P[1][2] * 0.7, 14, K.soft(K.hDD, 0.35));
    return s + "</g>";
  }
  function elastico(K, x, y, ang, w) {
    var c = K.acc || K.maglia, r = "<g transform='translate(" + x + " " + y + ") rotate(" + ang + ")'>";
    r += K.Pa("M" + (-w) + " -5C" + (-w) + " -9 " + w + " -9 " + w + " -5L" + w + " 5C" + w + " 9 " + (-w) + " 9 " + (-w) + " 5Z", K.LG("rcc" + Math.abs(Math.round(x)) + Math.abs(Math.round(y)), 0, 0, 0, 1, [[0, K.chiaro(c, 0.25)], [1, K.scuro(c, 0.3)]]), " stroke='" + K.scuro(c, 0.5) + "' stroke-width='1.2'");
    r += K.St("M" + (-w + 3) + " -3L" + (w - 3) + " -3", "#ffffff", 1.6, 0.4);
    return r + "</g>";
  }
  // (5 nov, secondo tempo) attaccatura dei capelli: una base scura sotto la frangia, così alla radice e alla riga non resta pelle chiara
  function radice(K, w, px, hy) {
    px = px || 0; hy = hy || -127;
    var d = "M" + (-w + 1) + " -84C" + (-w - 8) + " -132 -50 -164 -4 -164C44 -166 " + (w + 6) + " -134 " + (w - 1) + " -84L" + (w - 4) + " -92C" + (w - 7) + " -112 " + (px + 34) + " " + (hy + 1) + " " + px + " " + hy + "C" + (px - 34) + " " + (hy + 1) + " " + (-w + 7) + " -112 " + (-w + 4) + " -92Z";
    var s = K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>" + K.ciocche([
      [[px - 4, -156, 7], [-30, -146, 12], [-w + 6, -116, 14], [-w + 4, -94, 6]],
      [[px + 4, -158, 7], [30, -148, 12], [w - 6, -116, 14], [w - 5, -94, 6]]
    ], ["hg1", "hg2"]) + K.El(0, hy + 2, 46, 7, K.soft(K.hDD, 0.4)) + "</g>";
    return s;
  }
  var W = function (K) { return K.F.cw + 5; };
  var conCap = function (K) { return !!(K.c.cappello && K.c.cappello !== "nessuno"); };

  // =========================================================
  //  TENDINA — riga in mezzo, due «tende» che aprono la fronte; fin sotto il mento
  // =========================================================
  A.pezzo("capelli", "tendina", function (K) {
    var w = W(K), T = K.top - 24;
    var back = "M" + (-w + 2) + " -96C" + (-w - 14) + " -52 " + (-w - 14) + " -10 " + (-w - 8) + " 22C" + (-w * 0.4) + " 34 " + (w * 0.4) + " 34 " + (w + 8) + " 22C" + (w + 14) + " -10 " + (w + 14) + " -52 " + (w - 2) + " -96C" + (w - 12) + " -150 " + (-w + 12) + " -150 " + (-w + 2) + " -96Z";
    var dietro = dorso(K, back, w, 30);
    var O = [[22, T + 2], [w * 0.62, T + 14], [w + 2, -138], [w + 8, -104], [w + 5, -66], [w, -28]];
    var I = [[3, -140], [w * 0.3, -134], [w * 0.58, -116], [w * 0.8, -90], [w * 0.8, -56], [w * 0.92, -24]];
    var fr = simm(K, T, O, I, -138);
    var s = massa(K, fr, flusso(I, O, 6, 16).concat(flusso(mir(I), mir(O), 6, 16)));
    s += K.St("M0 -138C1 -150 0 -160 2 -170", K.hDD, 2.2, 0.55) + K.St("M-1.5 -140C-0.5 -150 -1.5 -160 0.5 -169", K.hL, 1, 0.45);
    var L = lato(K, [[-w + 2, -76, 14], [-w + 4, -44, 20], [-w + 2, -10, 22], [-w + 10, 16, 16], [-w + 22, 30, 7], [-w + 30, 34, 1.5]]);
    var R = lato(K, [[w - 2, -76, 14], [w - 4, -44, 20], [w - 2, -10, 22], [w - 10, 16, 16], [w - 22, 30, 7], [w - 30, 34, 1.5]], "hg1");
    return { dietro: dietro, fronte: L + R + s };
  });

  // =========================================================
  //  SURFISTA — mossi spettinati e sale, ciuffo buttato di lato, punte sfilate
  // =========================================================
  A.pezzo("capelli", "surfista", function (K) {
    var w = W(K), T = K.top - 26;
    var back = "M" + (-w + 2) + " -96C" + (-w - 12) + " -50 " + (-w - 14) + " 0 " + (-w - 8) + " 34C" + (-w - 4) + " 46 " + (-w * 0.5) + " 52 " + (-w * 0.1) + " 40C" + (w * 0.1) + " 20 " + (w - 10) + " -30 " + (w - 6) + " -62C" + (w - 3) + " -76 " + (w - 2) + " -86 " + (w - 4) + " -96C" + (w - 12) + " -150 " + (-w + 12) + " -150 " + (-w + 2) + " -96Z";
    var dietro = dorso(K, back, w, 24);
    var cal = "M" + (-w - 1) + " -84C" + (-w - 10) + " -130 " + (-w + 6) + " " + (T + 6) + " 0 " + T + "C" + (w - 6) + " " + (T + 4) + " " + (w + 10) + " -130 " + (w + 1) + " -84C" + (w - 2) + " -96 " + (w - 8) + " -104 " + (w - 16) + " -110C" + (w - 26) + " -112 " + (w - 36) + " -112 " + (w - 40) + " -108C28 -122 6 -120 -14 -112C-30 -104 -44 -98 " + (-w + 8) + " -92C" + (-w + 3) + " -90 " + (-w + 1) + " -87 " + (-w - 1) + " -84Z";
    var s = K.Pa(cal, K.U("hg3"));
    var C = [
      [[-w + 4, -96, 8], [-w + 14, -128, 16], [-34, T + 8, 18], [-6, T - 2, 12], [20, T + 6, 4]],
      [[-w + 8, -92, 8], [-34, -126, 14], [-8, -150, 16], [26, -158, 14], [52, -146, 8], [w - 4, -118, 3]],
      [[-30, -104, 9], [-6, -126, 16], [22, -140, 16], [48, -136, 11], [w - 8, -110, 3]],
      [[-6, -112, 9], [14, -128, 16], [38, -126, 14], [w - 10, -112, 4]],
      [[w - 6, -100, 8], [w + 2, -128, 14], [w - 6, -156, 12], [14, T + 2, 3]]
    ];
    s += "<g clip-path='" + K.clip(cal) + "'>" + K.ciocche(C, ["hg1", "hg2", "hg1", "hg2", "hg1"]) + "</g>" + vol(K, cal);
    var ci = K.limb([[22, -146, 18], [10, -130, 22], [-12, -118, 22], [-34, -108, 15], [-48, -96, 4]]);
    s += K.Pa(ci, K.U("hg2")) + "<g clip-path='" + K.clip(ci) + "'>" + K.St("M16 -138C2 -126 -18 -116 -40 -102", K.hL, 3, 0.4) + K.El(0, -104, 40, 8, K.soft(K.hDD, 0.4)) + "</g>";
    s = lato(K, [[-w + 2, -100, 18], [-w - 2, -72, 24], [-w + 3, -44, 26], [-w - 4, -18, 22], [-w + 3, 6, 14], [-w - 3, 24, 2]]) + lato(K, [[w - 2, -100, 18], [w + 2, -72, 24], [w - 3, -44, 26], [w + 4, -18, 22], [w - 3, 6, 14], [w + 3, 24, 2]], "hg1") + s;
    var ts = [[[-w - 2, -46, 14], [-w - 18, -38, 9], [-w - 32, -20, 1.5]], [[w + 2, -34, 14], [w + 18, -24, 9], [w + 32, -4, 1.5]], [[-w - 2, 4, 12], [-w - 20, 14, 8], [-w - 30, 34, 1.5]]];
    ts.forEach(function (t, i) { var d = K.limb(t); s += K.Pa(d, K.U(i % 2 ? "hg1" : "hg2")) + "<g clip-path='" + K.clip(d) + "'>" + K.St(K.liscio(t.map(function (p) { return [p[0], p[1]]; })), K.hL, 1.4, 0.4) + "</g>"; });
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  CASCHETTO LUNGO — bob liscio fino alle clavicole, riga laterale
  // =========================================================
  A.pezzo("capelli", "caschettolungo", function (K) {
    var w = W(K), T = K.top - 24;
    var back = "M" + (-w + 2) + " -96C" + (-w - 14) + " -50 " + (-w - 16) + " 10 " + (-w - 10) + " 62C" + (-w * 0.4) + " 66 " + (w * 0.4) + " 66 " + (w + 10) + " 62C" + (w + 16) + " 10 " + (w + 14) + " -50 " + (w - 2) + " -96C" + (w - 12) + " -150 " + (-w + 12) + " -150 " + (-w + 2) + " -96Z";
    var dietro = dorso(K, back, w, 56);
    var cal = "M" + (-w) + " -84C" + (-w - 10) + " -132 -50 " + T + " -4 " + T + "C44 " + (T - 2) + " " + (w + 10) + " -132 " + w + " -84L" + (w - 6) + " -96C" + (w - 12) + " -118 36 -134 -2 -140C-30 -132 " + (-w + 6) + " -112 " + (-w + 4) + " -92Z";
    var s = radice(K, w, 0, -128) + massa(K, cal, [
      [[-20, -146, 8], [-44, -154, 16], [-w + 2, -128, 18], [-w, -100, 10]],
      [[-18, -148, 8], [6, -164, 16], [40, -160, 18], [w, -120, 12], [w - 2, -92, 4]],
      [[-14, -140, 8], [10, -152, 14], [36, -146, 14], [w - 6, -116, 6]],
      [[-30, -132, 8], [-20, -148, 12], [0, -156, 10]]
    ]);
    var Ln = [[-w + 4, -112, 20], [-w - 6, -80, 30], [-w - 10, -36, 32], [-w - 10, 8, 32], [-w - 10, 40, 32], [-w - 10, 62, 32]];
    var Rn = [[w - 4, -112, 20], [w + 6, -80, 30], [w + 10, -36, 32], [w + 10, 8, 32], [w + 10, 40, 32], [w + 10, 62, 32]];
    var dl = K.limb(Ln, 0), dr = K.limb(Rn, 0);
    var sl = K.Pa(dl, K.U("hg2")) + K.Pa(dr, K.U("hg1"));
    sl += "<g clip-path='" + K.clip([dl, dr]) + "'>" + K.St("M" + (-w - 6) + " -80C" + (-w - 10) + " -30 " + (-w - 10) + " 20 " + (-w - 10) + " 58", K.hL, 3.5, 0.35) + K.St("M" + (w + 6) + " -80C" + (w + 10) + " -30 " + (w + 10) + " 20 " + (w + 10) + " 58", K.hL, 3, 0.2) + K.El(w + 6, -20, 16, 90, K.soft(K.hDD, 0.45)) + "</g>";
    return { dietro: dietro, fronte: sl + s };
  });

  // =========================================================
  //  CIUFFO LATERALE — lati corti, grosso ciuffo spazzolato verso destra che scende alla tempia
  // =========================================================
  A.pezzo("capelli", "ciuffolaterale", function (K) {
    var w = W(K), T = K.top - 28;
    var cal = "M" + (-w - 1) + " -96C" + (-w - 6) + " -134 " + (-w + 10) + " " + (T + 8) + " -8 " + T + "C34 " + (T - 2) + " " + (w + 8) + " -138 " + (w + 1) + " -96L" + (w - 3) + " -84C" + (w - 8) + " -92 " + (w - 12) + " -96 " + (w - 18) + " -100C" + (w - 30) + " -106 " + (w - 44) + " -108 " + (w - 56) + " -108C-30 -116 -26 -126 " + (-w + 14) + " -104L" + (-w + 8) + " -92Z";
    var s = K.Pa(cal, K.U("hg3"));
    var C = [
      [[-30, -142, 8], [-4, -164, 18], [30, -160, 18], [w - 6, -124, 12], [w - 2, -98, 3]],
      [[-34, -128, 8], [-8, -150, 18], [26, -150, 18], [w - 12, -122, 10], [w - 14, -100, 3]],
      [[-38, -118, 8], [-14, -138, 16], [18, -138, 16], [w - 22, -116, 8], [w - 26, -104, 3]],
      [[-w + 6, -100, 8], [-w + 10, -128, 14], [-34, -156, 14], [-6, -168, 8]],
      [[-w + 12, -96, 6], [-w + 20, -118, 10], [-42, -140, 10]]
    ];
    s += "<g clip-path='" + K.clip(cal) + "'>" + K.ciocche(C, ["hg1", "hg2", "hg1", "hg2", "hg1"]) + "</g>" + vol(K, cal);
    var ci = K.limb([[-28, -140, 12], [-6, -142, 30], [20, -128, 34], [40, -112, 24], [w - 8, -94, 12], [w - 4, -86, 3]], 0.2);
    s += K.Pa(ci, K.U("hg3")) + "<g clip-path='" + K.clip(ci) + "'>" + K.ciocche([
      [[-22, -142, 6], [0, -140, 12], [26, -126, 12], [w - 10, -94, 3]],
      [[-18, -134, 6], [4, -130, 12], [30, -116, 10], [w - 14, -96, 3]],
      [[-10, -146, 6], [14, -142, 10], [38, -122, 8], [w - 8, -98, 2]]
    ], ["hg1", "hg2", "hg1"]) + K.El(-8, -148, 30, 10, K.soft(K.hL, 0.5)) + K.El(40, -102, 24, 12, K.soft(K.hDD, 0.5)) + "</g>";
    s += K.St("M-26 -144C-6 -158 22 -154 44 -134", "#ffffff", 3, 0.16);
    var bl = K.limb([[-w + 4, -104, 10], [-w, -92, 10], [-w + 1, -80, 7], [-w + 3, -68, 3]]);
    var br = K.limb([[w - 4, -104, 10], [w, -92, 10], [w - 1, -80, 7], [w - 3, -68, 3]]);
    s += K.Pa(bl, K.U("hg2")) + K.Pa(br, K.U("hg2"));
    return { fronte: s };
  });

  // =========================================================
  //  SCALATI — medi a scalini, punte irregolari, ciocche che incorniciano il viso
  // =========================================================
  A.pezzo("capelli", "scalati", function (K) {
    var w = W(K), T = K.top - 22;
    var back = "M" + (-w + 2) + " -96C" + (-w - 14) + " -52 " + (-w - 14) + " -14 " + (-w - 18) + " 18L" + (-w + 2) + " 6L" + (-w - 8) + " 32L" + (-w * 0.6) + " 14L" + (-w * 0.7) + " 40L" + (-w * 0.25) + " 18L" + (-w * 0.1) + " 40L" + (w * 0.15) + " 20L" + (w * 0.34) + " 38L" + (w * 0.62) + " 16L" + (w * 0.74) + " 30L" + (w + 2) + " 8L" + (w + 20) + " 20C" + (w + 16) + " -14 " + (w + 14) + " -52 " + (w - 2) + " -96C" + (w - 12) + " -150 " + (-w + 12) + " -150 " + (-w + 2) + " -96Z";
    var dietro = dorso(K, back, w, 30);
    var px = -12, Ir = [[3, -141], [w * 0.3, -136], [w * 0.58, -120], [w * 0.8, -100], [w * 0.84, -76], [w * 0.92, -50]];
    var Or = [[22, T + 2], [w * 0.62, T + 14], [w + 2, -138], [w + 8, -104], [w + 5, -66], [w, -44]];
    var Il = Ir.map(function (p) { return [px - p[0] * 0.93, p[1] + 1]; }), Ol = mir(Or);
    var Ir2 = Ir.map(function (p) { return [px + p[0], p[1]]; });
    var cd = K.lisciaChiusa([[px, T]].concat(Or, rev(Ir2), [[px, -143]], Il, rev(Ol)));
    var s = radice(K, w, px, -126) + massa(K, cd, flusso(Ir2, Or, 5, 15).concat(flusso(Il, Ol, 4, 15)));
    s += K.St("M" + px + " -143C" + (px - 2) + " -154 " + (px - 4) + " -162 " + (px - 2) + " -170", K.hDD, 2, 0.5);
    var l1 = K.limb([[-w + 8, -118, 24], [-w - 2, -76, 24], [-w - 6, -36, 22], [-w - 12, -6, 14], [-w - 24, 14, 1.5]]);
    var l2 = K.limb([[-w + 14, -100, 10], [-w + 6, -64, 14], [-w, -30, 14], [-w - 6, -2, 9], [-w - 12, 8, 1.5]]);
    var r1 = K.limb([[w - 8, -118, 24], [w + 2, -76, 24], [w + 6, -36, 22], [w + 12, 0, 14], [w + 24, 22, 1.5]]);
    var r2 = K.limb([[w - 14, -100, 10], [w - 6, -62, 14], [w, -26, 14], [w + 6, 4, 9], [w + 14, 16, 1.5]]);
    var sl = K.Pa(l1, K.U("hg2")) + K.Pa(l2, K.U("hg1")) + K.Pa(r1, K.U("hg1")) + K.Pa(r2, K.U("hg2"));
    sl += "<g clip-path='" + K.clip([l1, l2, r1, r2]) + "'>" + K.El(w + 4, -30, 14, 70, K.soft(K.hDD, 0.45)) + K.El(-w - 4, -50, 6, 50, K.soft(K.hL, 0.35)) + "</g>";
    return { dietro: dietro, fronte: sl + s };
  });

  // =========================================================
  //  BOB CON FRANGIA — bob netto al mento, frangia dritta sopra le sopracciglia
  // =========================================================
  A.pezzo("capelli", "bobfrangia", function (K) {
    var w = W(K), T = K.top - 18;
    var back = "M" + (-w + 2) + " -96C" + (-w - 12) + " -52 " + (-w - 12) + " -14 " + (-w - 8) + " 10C" + (-w * 0.4) + " 20 " + (w * 0.4) + " 20 " + (w + 8) + " 10C" + (w + 12) + " -14 " + (w + 12) + " -52 " + (w - 2) + " -96C" + (w - 12) + " -150 " + (-w + 12) + " -150 " + (-w + 2) + " -96Z";
    var dietro = dorso(K, back, w, 14);
    var fr = "M" + (-w - 1) + " -84C" + (-w - 10) + " -132 -50 " + T + " -2 " + T + "C46 " + (T - 2) + " " + (w + 10) + " -132 " + (w + 1) + " -84C" + (w) + " -94 " + (w - 6) + " -100 " + (w - 14) + " -102C" + (w - 26) + " -104 " + (w - 34) + " -106 " + (w - 40) + " -106C14 -114 -14 -114 " + (-w + 40) + " -106C" + (-w + 34) + " -106 " + (-w + 26) + " -104 " + (-w + 14) + " -102C" + (-w + 6) + " -100 " + (-w) + " -94 " + (-w - 1) + " -84Z";
    var s = massa(K, fr, [
      [[-4, T + 4, 8], [-30, T + 10, 16], [-w + 4, -132, 18], [-w + 4, -102, 8]],
      [[4, T + 4, 8], [32, T + 10, 16], [w - 4, -132, 18], [w - 4, -102, 8]],
      [[-2, -154, 7], [-12, -134, 11], [-14, -108, 10], [-12, -96, 3]],
      [[4, -152, 7], [14, -134, 11], [16, -108, 10], [14, -96, 3]],
      [[-22, -146, 7], [-30, -128, 11], [-30, -106, 10], [-28, -96, 3]],
      [[24, -146, 7], [32, -128, 11], [32, -106, 10], [30, -96, 3]],
      [[-40, -132, 7], [-44, -116, 10], [-42, -100, 3]],
      [[42, -132, 7], [46, -116, 10], [44, -100, 3]]
    ]);
    s += K.El(0, -100, w * 0.85, 4, K.soft(K.hDD, 0.4));
    var Ln = [[-w + 2, -104, 20], [-w - 2, -70, 28], [-w - 4, -36, 32], [-w - 2, -8, 32], [-w + 6, 8, 28], [-w + 20, 14, 14], [-w + 26, 15, 3]];
    var Rn = [[w - 2, -104, 20], [w + 2, -70, 28], [w + 4, -36, 32], [w + 2, -8, 32], [w - 6, 8, 28], [w - 20, 14, 14], [w - 26, 15, 3]];
    var dl = K.limb(Ln), dr = K.limb(Rn);
    var sl = K.Pa(dl, K.U("hg2")) + K.Pa(dr, K.U("hg1"));
    sl += "<g clip-path='" + K.clip([dl, dr]) + "'>" + K.St("M" + (-w - 2) + " -70C" + (-w - 6) + " -40 " + (-w - 4) + " -10 " + (-w) + " 6", K.hL, 3.5, 0.35) + K.El(w + 6, -40, 14, 60, K.soft(K.hDD, 0.45)) + "</g>";
    return { dietro: dietro, fronte: sl + s };
  });

  // =========================================================
  //  BOB ASIMMETRICO — un lato corto, l'altro lungo fino alla mascella, frangia obliqua
  // =========================================================
  A.pezzo("capelli", "bobasimmetrico", function (K) {
    var w = W(K), T = K.top - 24;
    var back = "M" + (-w + 2) + " -96C" + (-w - 12) + " -50 " + (-w - 14) + " 0 " + (-w - 8) + " 42C" + (-w * 0.3) + " 54 " + (w * 0.2) + " 26 " + (w - 8) + " -40C" + (w - 2) + " -60 " + (w) + " -80 " + (w - 4) + " -96C" + (w - 12) + " -150 " + (-w + 12) + " -150 " + (-w + 2) + " -96Z";
    var dietro = dorso(K, back, w, 38);
    var cal = "M" + (-w) + " -84C" + (-w - 10) + " -134 -52 " + T + " -4 " + T + "C44 " + (T - 2) + " " + (w + 8) + " -134 " + (w + 1) + " -84L" + (w - 5) + " -92C" + (w - 8) + " -104 " + (w - 16) + " -112 " + (w - 28) + " -112C30 -118 6 -112 -22 -100C-34 -94 " + (-w + 10) + " -78 " + (-w + 6) + " -66L" + (-w) + " -84Z";
    var s = massa(K, cal, [
      [[26, T + 8, 8], [-4, T + 6, 16], [-40, -150, 18], [-w + 4, -118, 16], [-w + 8, -78, 6]],
      [[30, T + 14, 8], [4, -154, 16], [-24, -140, 18], [-44, -116, 14], [-w + 14, -86, 4]],
      [[36, -158, 8], [w - 4, -134, 12], [w - 2, -100, 6]],
      [[18, -140, 7], [-4, -130, 12], [-26, -112, 10], [-38, -96, 3]]
    ]);
    // lato lungo (sinistra): fino alla mascella, punte che girano in dentro; lato corto (destra): cade fino all'orecchio e dietro, pieno e ordinato
    var sl = ciuffoM(K, [[-w + 2, -104, 22], [-w - 6, -70, 32], [-w - 8, -30, 38], [-w - 4, 6, 36], [-w + 4, 30, 30], [-w + 14, 44, 20], [-w + 22, 49, 5]], { onda: 2, fase: 0.5 });
    sl += ciuffoM(K, [[-w + 6, -96, 14], [-w + 2, -62, 20], [-w + 2, -26, 22], [-w + 8, 2, 18], [-w + 18, 22, 9], [-w + 24, 30, 2]], { onda: 1.5, fase: 2.1 });
    sl += ciuffoM(K, [[w - 4, -108, 13], [w, -88, 15], [w + 1, -66, 13], [w - 3, -48, 8], [w - 7, -38, 1.5]], { onda: 0.8, fase: 1.4 });
    return { dietro: dietro, fronte: sl + s };
  });

  // =========================================================
  //  SFILATO — medi a ciocche separate, punte a spicchi, frangia scomposta
  // =========================================================
  A.pezzo("capelli", "sfilato", function (K) {
    var w = W(K), T = K.top - 22;
    var bd = "M" + (-w + 2) + " -96C" + (-w - 14) + " -52 " + (-w - 14) + " -14 " + (-w - 10) + " 10L" + (-w + 4) + " 0L" + (-w - 2) + " 26L" + (-w * 0.62) + " 6L" + (-w * 0.55) + " 34L" + (-w * 0.3) + " 10L" + (-w * 0.12) + " 36L" + (w * 0.1) + " 12L" + (w * 0.26) + " 36L" + (w * 0.5) + " 10L" + (w * 0.6) + " 30L" + (w + 2) + " 2L" + (w + 12) + " 12C" + (w + 14) + " -14 " + (w + 14) + " -52 " + (w - 2) + " -96C" + (w - 12) + " -150 " + (-w + 12) + " -150 " + (-w + 2) + " -96Z";
    var dietro = dorso(K, bd, w, 26);
    var cal = "M" + (-w) + " -86C" + (-w - 10) + " -132 -48 " + T + " -2 " + T + "C46 " + (T - 2) + " " + (w + 10) + " -132 " + w + " -86L" + (w - 4) + " -102L" + (w - 12) + " -110L" + (w - 18) + " -102L" + (w - 26) + " -118L" + (w - 36) + " -106L" + (w - 46) + " -122L" + (w - 54) + " -110L" + (-w + 56) + " -124L" + (-w + 48) + " -108L" + (-w + 40) + " -120L" + (-w + 30) + " -106L" + (-w + 20) + " -116L" + (-w + 12) + " -102L" + (-w + 4) + " -100Z";
    var s = massa(K, cal, [
      [[-4, T + 6, 8], [-32, T + 12, 16], [-w + 2, -128, 16], [-w, -98, 6]],
      [[4, T + 6, 8], [32, T + 12, 16], [w - 4, -128, 16], [w - 2, -100, 6]],
      [[-6, -150, 7], [-14, -132, 10], [-18, -110, 3]],
      [[8, -150, 7], [16, -132, 10], [22, -112, 3]],
      [[-26, -144, 7], [-34, -128, 9], [-38, -108, 3]],
      [[28, -144, 7], [38, -128, 9], [44, -108, 3]]
    ]);
    var l1 = K.limb([[-w + 4, -104, 14], [-w - 4, -72, 22], [-w - 4, -38, 22], [-w + 4, -10, 12], [-w + 14, 8, 1.5]]);
    var r1 = K.limb([[w - 4, -104, 14], [w + 4, -72, 22], [w + 4, -34, 22], [w - 4, -4, 12], [w - 14, 16, 1.5]]);
    var sl = K.Pa(l1, K.U("hg2")) + K.Pa(r1, K.U("hg1")) + "<g clip-path='" + K.clip([l1, r1]) + "'>" + K.El(w + 4, -30, 12, 70, K.soft(K.hDD, 0.45)) + "</g>";
    return { dietro: dietro, fronte: sl + s };
  });

  // =========================================================
  //  CODINO ALTO (uomo) — tirati indietro, lati corti, nodo in cima alla testa
  // =========================================================
  A.pezzo("capelli", "codinouomo", function (K) {
    var w = W(K), T = K.top - 14, cp = conCap(K);
    var dietro = "";
    if (!cp) {
      var kn = "M-17 " + (T - 4) + "C-24 " + (T - 24) + " -8 " + (T - 38) + " 6 " + (T - 36) + "C26 " + (T - 36) + " 34 " + (T - 12) + " 20 " + (T - 2) + "C10 " + (T + 4) + " -10 " + (T + 4) + " -17 " + (T - 4) + "Z";
      dietro = K.Pa(kn, K.U("hg3")) + "<g clip-path='" + K.clip(kn) + "'>" + K.ciocche([
        [[-14, T - 2, 6], [-14, T - 20, 10], [-2, T - 34, 8], [10, T - 36, 4]],
        [[-4, T, 6], [-6, T - 18, 10], [8, T - 32, 8], [22, T - 28, 3]],
        [[6, T, 6], [6, T - 16, 10], [18, T - 24, 8], [26, T - 14, 3]]
      ], ["hg1", "hg2", "hg1"]) + K.El(-8, T - 32, 14, 6, K.soft(K.hL, 0.6)) + K.El(22, T - 10, 12, 16, K.soft(K.hDD, 0.5)) + K.St("M-14 " + (T - 2) + "C-4 " + (T - 12) + " 10 " + (T - 14) + " 22 " + (T - 8), K.hDD, 1.2, 0.5) + "</g>";
    }
    var cal = "M" + (-w - 1) + " -86C" + (-w - 8) + " -130 -52 " + (T - 4) + " 0 " + (T - 6) + "C52 " + (T - 4) + " " + (w + 8) + " -130 " + (w + 1) + " -86L" + (w - 3) + " -92C" + (w - 8) + " -108 " + (w - 18) + " -122 " + (w - 32) + " -128C16 -134 -16 -134 " + (-w + 32) + " -128C" + (-w + 18) + " -122 " + (-w + 8) + " -108 " + (-w + 3) + " -92Z";
    var s = massa(K, cal, [
      [[-w + 6, -98, 6], [-w + 12, -122, 10], [-30, -146, 12], [-6, T - 2, 8]],
      [[w - 6, -98, 6], [w - 12, -122, 10], [30, -146, 12], [6, T - 2, 8]],
      [[-w + 16, -104, 6], [-w + 22, -126, 10], [-20, -146, 10], [-2, T, 3]],
      [[w - 16, -104, 6], [w - 22, -126, 10], [20, -146, 10], [2, T, 3]],
      [[-16, -134, 6], [-14, -150, 8], [-6, T + 2, 3]],
      [[16, -134, 6], [14, -150, 8], [6, T + 2, 3]]
    ]);
    var bl = K.limb([[-w + 4, -108, 10], [-w, -96, 10], [-w + 1, -84, 7], [-w + 3, -72, 3]]);
    var br = K.limb([[w - 4, -108, 10], [w, -96, 10], [w - 1, -84, 7], [w - 3, -72, 3]]);
    s += K.Pa(bl, K.U("hg2")) + K.Pa(br, K.U("hg2"));
    if (cp) {
      var N = [[-16, -100, 12], [-8, -92, 20], [0, -76, 22], [4, -58, 16], [2, -44, 2]];
      dietro = K.Pa(K.limb(N), K.U("hg3")) + "<g clip-path='" + K.clip(K.limb(N)) + "'>" + K.St("M-6 -96C0 -84 4 -66 2 -48", K.hL, 2, 0.4) + K.El(10, -72, 10, 30, K.soft(K.hDD, 0.5)) + "</g>";
    }
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  CODINO BASSO — tirati indietro, coda bassa sulla nuca che cade a destra del collo
  // =========================================================
  A.pezzo("capelli", "codinobasso", function (K) {
    var w = W(K), T = K.top - 14;
    var N = [[32, -62, 18], [48, -48, 24], [56, -26, 26], [58, 2, 26], [54, 30, 22], [50, 54, 14], [50, 70, 3]];
    var pony = K.limb(N, 0.3);
    var dietro = K.Pa(pony, K.U("hg3")) + "<g clip-path='" + K.clip(pony) + "'>" + K.ciocche([
      [[34, -62, 7], [46, -44, 10], [52, -20, 10], [52, 8, 10], [46, 40, 8], [48, 66, 2]],
      [[42, -56, 7], [56, -40, 10], [64, -16, 10], [64, 12, 10], [56, 44, 8], [52, 68, 2]],
      [[38, -60, 7], [52, -44, 10], [60, -20, 10], [58, 8, 10], [50, 36, 8], [50, 66, 2]]
    ], ["hg1", "hg2", "hg1"]) + K.El(40, -20, 14, 40, K.soft(K.hL, 0.4)) + K.El(66, 6, 16, 70, K.soft(K.hDD, 0.55)) + "</g>";
    dietro += elastico(K, 40, -56, -52, 13);
    var cal = "M" + (-w - 1) + " -82C" + (-w - 8) + " -130 -52 " + (T - 6) + " 0 " + (T - 8) + "C52 " + (T - 6) + " " + (w + 8) + " -130 " + (w + 1) + " -82L" + (w - 3) + " -90C" + (w - 8) + " -108 " + (w - 20) + " -122 " + (w - 36) + " -128C14 -132 -14 -132 " + (-w + 36) + " -128C" + (-w + 20) + " -122 " + (-w + 8) + " -108 " + (-w + 3) + " -90Z";
    var s = massa(K, cal, [
      [[-w + 6, -96, 7], [-w + 10, -124, 12], [-30, -148, 12], [-4, T, 8], [22, T + 4, 3]],
      [[-w + 16, -104, 7], [-w + 22, -128, 12], [-14, -146, 10], [12, -146, 8], [40, -126, 4]],
      [[-8, -134, 6], [8, -148, 12], [34, -144, 12], [w - 6, -118, 8], [w - 2, -92, 3]],
      [[-22, -128, 6], [-6, -142, 10], [18, -144, 10], [w - 18, -122, 5]],
      [[w - 8, -96, 7], [w - 2, -118, 10], [w - 14, -144, 8], [10, T, 3]]
    ]);
    var bl = K.limb([[-w + 4, -104, 10], [-w, -92, 10], [-w + 1, -80, 7], [-w + 3, -68, 3]]);
    var br = K.limb([[w - 4, -104, 10], [w, -92, 10], [w - 1, -80, 7], [w - 3, -68, 3]]);
    s += K.Pa(bl, K.U("hg2")) + K.Pa(br, K.U("hg2"));
    return { dietro: dietro, fronte: s };
  });
})();
// VOCI FATTE: tendina, surfista, caschettolungo, ciuffolaterale, scalati, bobfrangia, bobasimmetrico, sfilato, codinouomo, codinobasso
// capelli-c6 (5 nov): sagome rese distinte — caschettolungo blocco pari a taglio netto, scalati punte aperte in fuori, tendina bande tirate al viso, surfista ciuffi sporgenti, bobfrangia a cupola con punte in dentro.


// ---- capelli-d ----
// pezzi: capelli-d — pettinature «illustrate» (coordinate della testa: mento 0, cima del cranio -148)
(function () {
  "use strict";
  var A = window.SGOminoA; if (!A) return;

  // ---------- aiuti comuni (stessa mano di capelli-donna.js) ----------
  function vol(K, d, lucido) {
    var s = "<g clip-path='" + K.clip(d) + "'>";
    s += K.El(66, -80, 36, 110, K.soft(K.hDD, 0.5)) + K.El(-30, -156, 46, 20, K.soft(K.hL, 0.5));
    if (lucido !== false) s += K.St("M-48 -130C-38 -156 -4 -166 26 -158", "#ffffff", 5, 0.13) + K.St("M-40 -120C-30 -144 -8 -154 12 -150", "#ffffff", 2, 0.12);
    return s + "</g>";
  }
  function calotta(px, alto) {
    return "M-57 -80C-68 " + (alto + 44) + " -50 " + alto + " -6 " + alto + "C42 " + (alto - 4) + " 68 " + (alto + 34) + " 60 -84L56 -96C48 -118 " + (px + 40) + " -134 " + px + " -142C" + (px - 24) + " -128 -50 -112 -54 -92Z";
  }
  var TIRATA = "M-56 -84C-66 -128 -52 -160 -4 -164C44 -168 68 -136 58 -88L54 -94C49 -112 36 -126 12 -130C0 -131 -2 -131 -12 -130C-36 -124 -50 -108 -53 -92Z";
  function stridi(K) {
    return K.ciocche([
      [[-50, -98, 9], [-50, -126, 13], [-36, -150, 14], [-12, -162, 8]],
      [[-40, -110, 8], [-34, -134, 12], [-16, -152, 12], [10, -160, 6]],
      [[-22, -124, 7], [-14, -142, 10], [8, -156, 10], [34, -156, 5]],
      [[8, -126, 7], [20, -142, 10], [40, -148, 9], [58, -128, 4]],
      [[34, -116, 8], [44, -132, 11], [56, -128, 8], [60, -100, 3]],
      [[52, -98, 8], [54, -118, 10], [50, -140, 6], [38, -154, 2]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
  }
  function tirata(K) { return K.Pa(TIRATA, K.U("hg3")) + "<g clip-path='" + K.clip(TIRATA) + "'>" + stridi(K) + "</g>" + vol(K, TIRATA); }
  // (5 nov, secondo tempo) attaccatura più bassa e morbida: niente fascia di pelle chiara sopra la fronte
  function calottaB(px, alto) {
    return "M-57 -80C-68 " + (alto + 44) + " -50 " + alto + " -6 " + alto + "C42 " + (alto - 4) + " 68 " + (alto + 34) + " 60 -84L56 -92C52 -112 " + (px + 34) + " -127 " + px + " -128C" + (px - 34) + " -127 -51 -112 -54 -92Z";
  }
  var TIRATAB = "M-56 -84C-66 -128 -52 -160 -4 -164C44 -168 68 -136 58 -88L54 -92C51 -112 34 -126 0 -127C-34 -126 -50 -112 -53 -92Z";
  // fili sottili che sfumano l'attaccatura (il bordo non è mai una linea netta)
  function fili(K, px) {
    var s = "", i, x, h;
    for (i = -2; i <= 2; i++) { if (!i) continue; x = px + i * 15; h = -127 + Math.abs(i) * 5; s += K.St("M" + x + " " + (h - 6) + "C" + (x + 1) + " " + (h - 1) + " " + (x + i * 0.4) + " " + (h + 3) + " " + (x + i * 0.9) + " " + (h + 6), K.hD, 1.3, 0.28); }
    return s + K.El(px, -124, 44, 7, K.soft(K.hDD, 0.32));
  }
  function tirataB(K) { return K.Pa(TIRATAB, K.U("hg3")) + "<g clip-path='" + K.clip(TIRATAB) + "'>" + stridi(K) + "</g>" + vol(K, TIRATAB) + fili(K, 0); }
  // elastico: una fascetta curva che stringe i capelli (stesso colore di sempre), con un'ombra morbida sotto
  function laccio(K, x, y, ang, w) {
    var c = K.maglia, id = "dl" + Math.round(Math.abs(x)) + "_" + Math.round(Math.abs(y)) + (ang < 0 ? "n" : "");
    var r = "<g transform='translate(" + x + " " + y + ") rotate(" + ang + ")'>";
    r += K.El(0, 6, w * 1.05, 5, K.soft(K.hDD, 0.55));
    r += K.Pa("M" + (-w) + " -2Q0 -7 " + w + " -2Q" + (w + 2) + " 2 " + w + " 5Q0 10 " + (-w) + " 5Q" + (-w - 2) + " 2 " + (-w) + " -2Z", K.LG(id, 0, 0, 0, 1, [[0, K.chiaro(c, 0.2)], [0.55, c], [1, K.scuro(c, 0.3)]]), " stroke='" + K.scuro(c, 0.45) + "' stroke-opacity='.45' stroke-width='.9'");
    r += K.St("M" + (-w * 0.6) + " -2Q" + (-w * 0.1) + " -4 " + (w * 0.3) + " -3", "#ffffff", 1.2, 0.35);
    return r + "</g>";
  }
  // ciocca morbida: massa + tre fili sfalsati che finiscono in punte diverse (mai un bordo unico e netto)
  // N = nodi [x, y, larghezza]; o = { onda: ampiezza, punte: 0 = chiusa, flick: sposta in fuori le ultime punte, tronca: punta dritta }
  function ciuffo(K, N, o) {
    o = o || {};
    var n = N.length, sg = N[n >> 1][0] < 0 ? -1 : 1, P = N.map(function (q, i) {
      var t = i / (n - 1), x = q[0] + (o.onda ? sg * o.onda * Math.sin(i * 1.25 + (o.fase || 0)) * Math.min(1, t * 2) : 0) + (o.flick ? sg * o.flick * Math.pow(t, 3) : 0);
      return [x, q[1], q[2]];
    });
    var base = o.tronca ? P : P.slice(0, n - 1).concat([[P[n - 1][0], P[n - 1][1] - 0, P[n - 1][2] * 0.5]]);
    var d = K.limb(base, o.tronca ? 0 : 0.35), s = K.El(P[n >> 1][0] - sg * 8, P[n >> 1][1] + 8, P[n >> 1][2] * 0.9, (P[n - 1][1] - P[0][1]) * 0.5, K.soft(K.hDD, 0.35));
    s += K.Pa(d, K.U(sg < 0 ? "hg2" : "hg1")) + "<g clip-path='" + K.clip(d) + "'>";
    var F = [[-0.3, 0.46, 1, "hg1"], [0.02, 0.5, 0, "hg2"], [0.32, 0.4, 2, "hg1"]], k, L = [], m = P.length;
    for (k = 0; k < 3; k++) {
      var f = F[k], cut = f[2], sub = P.slice(0, m - cut).map(function (q, i) { return [q[0] + f[0] * q[2] + Math.sin(i + k * 2) * 1.2, q[1] + (i === 0 ? 0 : 0), Math.max(1.5, q[2] * f[1])]; });
      if (cut && !o.tronca) sub[sub.length - 1][2] = 1.5;
      L.push(sub);
    }
    s += K.ciocche(L, ["hg1", "hg2", "hg1"]);
    var Mi = P[(n >> 1)];
    s += K.St(K.liscio(P.slice(0, n - 1).map(function (q) { return [q[0] + sg * q[2] * 0.34, q[1]]; })), K.hDD, Math.max(5, Mi[2] * 0.28), 0.3);
    s += K.St(K.liscio(P.slice(0, n - 1).map(function (q) { return [q[0] - sg * q[2] * 0.3, q[1]]; })), K.hL, 2.4, 0.4);
    s += K.El(P[1][0], P[1][1] + 6, P[1][2] * 0.7, 14, K.soft(K.hDD, 0.35));
    return s + "</g>";
  }
  // coda / ciocca grossa: massa + ciocche dentro lungo una linea di nodi [x, y, larghezza]
  function codaForma(K, N, fine) {
    var d = K.limb(N, fine == null ? 0.4 : fine), s = K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>";
    var ci = [];
    for (var k = -1; k <= 1; k++) ci.push(N.map(function (q) { return [q[0] + k * q[2] * 0.26, q[1], q[2] * (k === 0 ? 0.42 : 0.34)]; }));
    s += K.ciocche(ci, ["hg1", "hg2", "hg1"]);
    var sg = N[N.length >> 1][0] < 0 ? -1 : 1;
    s += K.El(N[0][0] + sg * 40, N[N.length >> 1][1], 20, 80, K.soft(K.hDD, 0.4)) + K.El(N[0][0] - sg * 22, N[N.length >> 1][1] - 10, 8, 60, K.soft(K.hL, 0.3)) + "</g>";
    return s;
  }
  // massa dietro la testa che scende fino a «bot» con larghezza «w» (spalle, schiena)
  function dietroLungo(K, bot, w, punta, liscio) {
    var m = bot * 0.45, P = [[-62, -92], [-w + 8, -44], [-w, 10], [-w + 2, m], [-w + 6, bot - 14], [-w * 0.55, bot + (punta || 0)], [-w * 0.2, bot - 6 + (punta || 0) * 0.5], [w * 0.2, bot - 6 + (punta || 0) * 0.5], [w * 0.55, bot + (punta || 0)], [w - 6, bot - 14], [w - 2, m], [w, 10], [w - 8, -44], [62, -92], [44, -150], [0, -164], [-44, -150]];
    var d = K.lisciaChiusa(P);
    var s = K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>" + K.El(0, bot * 0.4, w * 0.6, bot * 0.62, K.soft(K.hDD, 0.55));
    if (!liscio) s += K.ciocche([
      [[-w + 14, 0, 14], [-w + 10, m, 16], [-w + 14, bot - 10, 6]],
      [[w - 14, 0, 14], [w - 10, m, 16], [w - 14, bot - 10, 6]]
    ], ["hg2", "hg1"]);
    s += K.El(w * 0.8, bot * 0.4, 30, bot * 0.6, K.soft(K.hDD, 0.45)) + K.El(-w * 0.85, bot * 0.3, 12, bot * 0.5, K.soft(K.hL, 0.25)) + "</g>";
    return s;
  }
  // una tenda di capelli lunga davanti alla spalla/viso lungo i nodi (sinistra se s<0); o come in ciuffo()
  function tenda(K, s, N, o) { return ciuffo(K, N, o); }
  function seg(K) { return K.St("M0 -130L0 -164", K.hDD, 1.6, 0.5); }
  // una treccia a spina di pesce lungo una curva di Bézier (P0..P3), lato s: anelli morbidi che si sovrappongono, punta che si sfila
  function treccia(K, s, P0, P1, P2, P3, w0, w1) {
    function bz(t) { var u = 1 - t; return [u * u * u * P0[0] + 3 * u * u * t * P1[0] + 3 * u * t * t * P2[0] + t * t * t * P3[0], u * u * u * P0[1] + 3 * u * u * t * P1[1] + 3 * u * t * t * P2[1] + t * t * t * P3[1]]; }
    var wd = function (t) { return w0 + (w1 - w0) * t; }, core = [], i, b;
    for (i = 0; i <= 12; i++) { var tt = i / 12, c = bz(tt); core.push([c[0], c[1], wd(tt) * 0.9]); }
    var ombra = K.limb(core.map(function (q) { return [q[0] - s * 3, q[1] + 5, q[2] * 0.95]; }), 0.1);
    b = K.Pa(ombra, K.hDD, " opacity='.28'") + K.Pa(K.limb(core, 0.1), K.mix(K.capelli, K.hDD, 0.55));
    var n = 17;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1) * 0.96, c0 = bz(t), c1 = bz(Math.min(1, t + 0.01)), ang = Math.atan2(c1[1] - c0[1], c1[0] - c0[0]) * 180 / Math.PI;
      var w = wd(t), side = i % 2 ? 1 : -1, ox = side * w * 0.17, nx = -Math.sin(ang * Math.PI / 180), ny = Math.cos(ang * Math.PI / 180);
      var cx = c0[0] + nx * ox, cy = c0[1] + ny * ox, rot = ang + side * s * 44;
      b += "<g transform='translate(" + K.n1(cx) + " " + K.n1(cy) + ") rotate(" + K.n1(rot) + ")'>" +
        "<ellipse rx='" + K.n1(w * 0.78) + "' ry='" + K.n1(w * 0.36) + "' fill='" + K.U(i % 2 ? "hg1" : "hg2") + "' stroke='" + K.hDD + "' stroke-opacity='.3' stroke-width='.8'/>" +
        "<ellipse cx='" + K.n1(w * 0.12) + "' cy='" + K.n1(w * 0.14) + "' rx='" + K.n1(w * 0.6) + "' ry='" + K.n1(w * 0.14) + "' fill='" + K.hDD + "' opacity='.2'/>" +
        "<path d='M" + K.n1(-w * 0.55) + " " + K.n1(-w * 0.08) + "Q0 " + K.n1(-w * 0.32) + " " + K.n1(w * 0.5) + " " + K.n1(-w * 0.08) + "' stroke='" + K.hL + "' stroke-width='1.4' stroke-linecap='round' fill='none' opacity='" + (s < 0 ? 0.6 : 0.4) + "'/></g>";
    }
    var pe = bz(1), ew = wd(1);
    // punta: tre ciuffetti di lunghezza diversa che si aprono sotto l'elastico
    [[-0.3, 20, 0.42], [0.02, 34, 0.5], [0.3, 25, 0.4]].forEach(function (f, k) {
      b += K.Pa(K.limb([[pe[0] + f[0] * ew * 0.6, pe[1] - 2, ew * 0.5], [pe[0] + f[0] * ew * 1.2 + s * 1.5, pe[1] + f[1] * 0.5, ew * f[2] * 1.5], [pe[0] + f[0] * ew * 1.5 + s * 2, pe[1] + f[1], 1.5]], 0.3), K.U(k % 2 ? "hg1" : "hg2"), " stroke='" + K.hDD + "' stroke-opacity='.25' stroke-width='.7'");
    });
    return b + laccio(K, pe[0], pe[1] - 2, 0, ew * 0.62);
  }

  // =========================================================
  //  TRECCE — due trecce a spina di pesce davanti alle spalle
  // =========================================================
  A.pezzo("capelli", "trecce", function (K) {
    var dietro = K.Pa("M-60 -92C-70 -50 -66 -10 -54 10C-30 20 30 20 54 10C66 -10 70 -50 60 -92C50 -150 -50 -150 -60 -92Z", K.U("hg3")) + K.El(0, 6, 38, 14, K.soft(K.hDD, 0.7));
    var s = tirataB(K) + seg(K);
    s += K.Pa(K.limb([[-54, -98, 7], [-60, -78, 8], [-66, -58, 8], [-70, -44, 4]], 0.3), K.U("hg2")) + K.Pa(K.limb([[54, -98, 7], [60, -78, 8], [66, -58, 8], [70, -44, 4]], 0.3), K.U("hg1"));
    s += treccia(K, -1, [-72, -48], [-104, 4], [-68, 86], [-84, 164], 28, 18);
    s += treccia(K, 1, [72, -48], [100, -4], [74, 94], [82, 166], 28, 18);
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  MEZZACODA — mezza raccolta in un codino in cima, il resto sciolto
  // =========================================================
  A.pezzo("capelli", "mezzacoda", function (K) {
    var dietro = dietroLungo(K, 112, 80, 6, true);
    // il codino alto: parte dalla cima della testa, sale e ricade a destra dietro l'orecchio come un getto
    var cp = !!(K.c.cappello && K.c.cappello !== "nessuno"), s = "";
    if (!cp) s += codaForma(K, [[2, -158, 14], [16, -178, 22], [38, -186, 28], [60, -176, 28], [72, -152, 24], [74, -122, 17], [70, -100, 9], [66, -88, 2]]) + K.El(46, -168, 26, 14, K.soft(K.hDD, 0.35)) + "";
    var cal = calottaB(0, -168);
    s += K.Pa(cal, K.U("hg3"));
    s += K.ciocche([
      [[0, -150, 8], [-30, -158, 16], [-50, -142, 20], [-60, -112, 18], [-60, -96, 10], [-56, -84, 3]],
      [[2, -168, 8], [-22, -170, 14], [-48, -160, 18], [-64, -132, 18], [-66, -104, 10], [-62, -86, 2]],
      [[0, -150, 8], [30, -156, 16], [52, -140, 20], [60, -112, 18], [60, -98, 10], [56, -84, 3]],
      [[2, -168, 8], [30, -168, 14], [56, -148, 18], [68, -118, 14], [68, -96, 8], [62, -80, 2]]
    ], ["hg2", "hg1", "hg1", "hg2"]);
    s += vol(K, cal) + fili(K, 0);
    s += seg(K) + (cp ? "" : laccio(K, 5, -165, 24, 11));
    // solo due ciocche sottili ai lati del viso: il resto è tirato su e le lunghezze stanno dietro le spalle
    s += ciuffo(K, [[-55, -98, 7], [-59, -76, 8], [-58, -52, 6], [-52, -30, 3], [-48, -20, 1.5]], { onda: 1.5 });
    s += ciuffo(K, [[55, -98, 7], [59, -76, 8], [58, -52, 6], [54, -34, 3], [52, -26, 1.5]], { onda: 1.5, fase: 1 });
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  CHIGNON SPETTINATO — crocchia sfatta in cima, ciuffi che scappano
  // =========================================================
  A.pezzo("capelli", "chignonspettinato", function (K) {
    var dietro = K.Pa("M-60 -92C-66 -50 -62 -16 -48 4C-24 14 24 14 48 4C62 -16 66 -50 60 -92Z", K.U("hg3")) + K.El(0, -2, 34, 12, K.soft(K.hDD, 0.6));
    // il nodo: una crocchia tonda e sfatta, fatta di anelli di capelli avvolti (nessuna punta)
    var bun = K.lisciaChiusa([[-36, -170], [-32, -196], [-14, -212], [10, -216], [32, -208], [46, -190], [44, -166], [28, -150], [0, -146], [-24, -154]]);
    var b = K.El(6, -150, 44, 10, K.soft(K.hDD, 0.5)) + K.Pa(bun, K.U("hg3")) + "<g clip-path='" + K.clip(bun) + "'>";
    b += K.St("M-34 -176C-22 -206 14 -214 40 -190", K.hL, 9, 0.35) + K.St("M-30 -166C-16 -196 22 -204 42 -176", K.hD, 7, 0.55) + K.St("M-26 -158C-8 -186 24 -190 40 -166", K.hL, 6, 0.3) + K.St("M-18 -154C0 -172 22 -172 34 -158", K.hD, 6, 0.5);
    b += K.St("M-30 -190C-14 -208 16 -212 36 -196", K.hDD, 1.4, 0.45) + K.St("M-28 -172C-10 -196 20 -198 40 -180", K.hDD, 1.4, 0.4) + K.St("M-22 -160C-4 -178 20 -178 36 -164", K.hDD, 1.4, 0.4);
    b += K.El(34, -176, 18, 30, K.soft(K.hDD, 0.5)) + K.El(-16, -204, 20, 9, K.soft(K.hL, 0.5)) + "</g>";
    // pochi fili sottili che scappano (tratti fini, niente ciuffi grossi)
    b += K.St("M-36 -184C-44 -188 -48 -182 -46 -176", K.hD, 1.4, 0.6) + K.St("M-26 -204C-32 -210 -38 -206 -38 -200", K.hD, 1.3, 0.55) + K.St("M42 -194C50 -196 54 -190 52 -184", K.hD, 1.4, 0.6) + K.St("M20 -214C26 -220 32 -216 32 -210", K.hD, 1.3, 0.5);
    b += K.St("M-30 -168C-40 -164 -44 -156 -42 -148", K.hD, 1.6, 0.5);
    var cal = "M-57 -82C-66 -126 -50 -160 -4 -164C44 -168 68 -136 59 -84L55 -96C46 -118 34 -126 10 -130C-6 -131 -14 -130 -26 -128C-42 -122 -50 -108 -53 -92Z";
    var s = b + K.Pa(cal, K.U("hg3")) + "<g clip-path='" + K.clip(cal) + "'>" + K.ciocche([
      [[-48, -98, 9], [-50, -128, 13], [-34, -152, 14], [-8, -164, 8]],
      [[-30, -118, 8], [-22, -140, 12], [0, -156, 12], [30, -158, 6]],
      [[10, -126, 7], [24, -142, 10], [44, -148, 8], [58, -126, 4]],
      [[34, -116, 8], [46, -132, 11], [58, -126, 8], [60, -96, 3]]
    ], ["hg1", "hg2", "hg1", "hg2"]) + "</g>" + vol(K, cal);
    // ciocche libere sul viso e sul collo
    s += ciuffo(K, [[-55, -106, 15], [-63, -78, 20], [-61, -50, 16], [-53, -30, 6], [-47, -18, 1.5]], { onda: 1.2 }) + ciuffo(K, [[55, -106, 15], [63, -80, 20], [61, -54, 16], [54, -34, 6], [48, -22, 1.5]], { onda: 1.2, fase: 1 });
    s += K.St("M-50 -30C-48 -18 -42 -8 -34 -2", K.hD, 2, 0.6);
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  LUNGHISSIMI — lisci fino al petto
  // =========================================================
  A.pezzo("capelli", "lunghissimi", function (K) {
    var dietro = dietroLungo(K, 196, 88, 8);
    var Lk = "", cal = calottaB(-8, -170), s = "";
    Lk += tenda(K, -1, [[-57, -114, 22], [-61, -70, 30], [-71, -26, 34], [-79, 34, 36], [-79, 98, 33], [-73, 148, 25], [-66, 182, 11], [-61, 202, 2]], { onda: 3, fase: 0.4 });
    Lk += tenda(K, -1, [[-54, -108, 14], [-56, -58, 20], [-64, -12, 24], [-70, 48, 24], [-68, 104, 19], [-63, 140, 8], [-59, 152, 1.5]], { onda: 2, fase: 2 });
    Lk += tenda(K, 1, [[57, -114, 22], [61, -70, 30], [71, -26, 34], [79, 30, 34], [78, 84, 29], [74, 124, 19], [71, 148, 4]], { onda: 3, fase: 2.2 });
    Lk += tenda(K, 1, [[54, -108, 14], [56, -58, 20], [64, -12, 24], [69, 40, 22], [66, 84, 15], [62, 106, 1.5]], { onda: 2, fase: 0.6 });
    s += K.Pa(cal, K.U("hg3"));
    s += K.ciocche([
      [[-6, -150, 8], [-30, -156, 16], [-50, -140, 20], [-60, -112, 22], [-62, -100, 18], [-58, -82, 4]],
      [[-4, -148, 8], [-22, -168, 14], [-48, -162, 18], [-64, -132, 20], [-68, -104, 16], [-64, -84, 3]],
      [[-6, -152, 8], [14, -158, 16], [38, -148, 20], [54, -126, 20], [60, -100, 12], [56, -84, 3]],
      [[2, -166, 8], [30, -168, 14], [56, -148, 18], [68, -118, 16], [70, -94, 10], [64, -78, 2]]
    ], ["hg2", "hg1", "hg1", "hg2"]);
    s += vol(K, cal);
    // lunghissimi: scendono morbidi sul petto, con un'onda leggera e le punte che si aprono; il lato sinistro più lungo
    s += fili(K, -8);
    Lk += K.St("M-70 120C-72 140 -68 160 -62 176", K.hL, 1.2, 0.5) + K.St("M74 80C78 98 76 112 72 126", K.hL, 1.2, 0.45);
    return { dietro: dietro, fronte: Lk + s };
  });

  // =========================================================
  //  CODA LATERALE — coda portata sulla spalla destra
  // =========================================================
  A.pezzo("capelli", "codalaterale", function (K) {
    var dietro = K.Pa("M-60 -92C-70 -50 -66 -10 -54 10C-30 20 30 20 54 10C66 -10 70 -50 60 -92C50 -150 -50 -150 -60 -92Z", K.U("hg3")) + K.El(0, 6, 38, 14, K.soft(K.hDD, 0.7));
    var cal = "M-57 -80C-68 -128 -50 -172 -6 -172C42 -176 68 -140 60 -84L56 -96C48 -118 30 -132 -2 -136C-20 -128 -46 -112 -54 -92Z";
    var s = K.Pa(cal, K.U("hg3")) + "<g clip-path='" + K.clip(cal) + "'>" + K.ciocche([
      [[-50, -98, 9], [-52, -126, 13], [-38, -152, 14], [-10, -168, 8]],
      [[-34, -112, 8], [-30, -136, 12], [-10, -156, 12], [18, -164, 6]],
      [[-6, -126, 7], [10, -144, 10], [34, -154, 9], [56, -138, 4]],
      [[22, -112, 8], [40, -130, 11], [56, -126, 8], [60, -96, 3]]
    ], ["hg1", "hg2", "hg1", "hg2"]) + "</g>" + vol(K, cal);
    // ciuffo laterale che scende sulla fronte
    var fr = K.limb([[-30, -140, 6], [-10, -132, 14], [14, -118, 14], [36, -102, 8], [50, -92, 1.5]], 0.2);
    s += K.Pa(fr, K.U("hg2")) + K.St("M-30 -138C-12 -128 14 -116 44 -96", K.hDD, 1.4, 0.3);
    s += tenda(K, -1, [[-54, -100, 7], [-59, -76, 6], [-56, -52, 5], [-50, -36, 1.5]]);
    // la coda: sbuca dietro l'orecchio destro e cade sul petto
    s += codaForma(K, [[60, -112, 22], [86, -96, 32], [98, -54, 36], [98, 0, 34], [92, 56, 30], [88, 106, 22], [90, 150, 12], [86, 168, 2]]);
    s += laccio(K, 62, -108, 62, 15);
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  CHIGNON DOPPIO — due crocchie in alto ai lati
  // =========================================================
  function crocchia(K, cx, cy, r) {
    var d = K.lisciaChiusa([[cx - r, cy], [cx - r * 0.7, cy - r * 0.78], [cx, cy - r], [cx + r * 0.72, cy - r * 0.76], [cx + r, cy], [cx + r * 0.72, cy + r * 0.8], [cx, cy + r], [cx - r * 0.72, cy + r * 0.78]]);
    var s = K.Pa(d, K.U("hg3")) + "<g clip-path='" + K.clip(d) + "'>";
    s += K.ciocche([
      [[cx - r * 0.9, cy + r * 0.3, 6], [cx - r * 0.8, cy - r * 0.5, 10], [cx, cy - r * 0.9, 10], [cx + r * 0.8, cy - r * 0.3, 4]],
      [[cx - r * 0.7, cy + r * 0.7, 6], [cx - r * 0.5, cy - r * 0.2, 10], [cx + r * 0.2, cy - r * 0.6, 10], [cx + r * 0.9, cy + r * 0.1, 4]],
      [[cx - r * 0.2, cy + r * 0.8, 6], [cx - r * 0.1, cy, 9], [cx + r * 0.5, cy - r * 0.2, 8], [cx + r * 0.8, cy + r * 0.5, 3]]
    ], ["hg1", "hg2", "hg1"]);
    s += K.El(cx + r * 0.55, cy + r * 0.2, r * 0.6, r * 0.9, K.soft(K.hDD, 0.5)) + K.El(cx - r * 0.4, cy - r * 0.6, r * 0.5, r * 0.3, K.soft(K.hL, 0.5)) + "</g>";
    return s + K.St("M" + (cx - r * 0.6) + " " + (cy + r * 0.7) + "C" + (cx - r * 0.1) + " " + (cy + r * 0.95) + " " + (cx + r * 0.6) + " " + (cy + r * 0.8) + " " + (cx + r * 0.9) + " " + (cy + r * 0.3), K.hDD, 2.4, 0.35);
  }
  A.pezzo("capelli", "chignondoppio", function (K) {
    var s = crocchia(K, -46, -168, 25) + crocchia(K, 46, -168, 25);
    s += tirata(K) + seg(K);
    s += K.Pa(K.limb([[-53, -98, 7], [-57, -76, 6], [-54, -52, 5], [-50, -36, 1.5]]), K.U("hg2")) + K.Pa(K.limb([[53, -98, 7], [58, -78, 6], [56, -54, 5], [52, -38, 1.5]]), K.U("hg1"));
    return { dietro: "", fronte: s };
  });

  // =========================================================
  //  CODE BASSE — due codini bassi sulle spalle
  // =========================================================
  A.pezzo("capelli", "codebasse", function (K) {
    var dietro = "";
    [-1, 1].forEach(function (l) {
      dietro += K.Pa(K.limb([[l * 54, -98, 10], [l * 62, -70, 12], [l * 62, -40, 12], [l * 60, -16, 10]], 0.3), K.U("hg3"));
    });
    var s = tirata(K) + seg(K);
    s += K.Pa(K.limb([[-53, -98, 7], [-56, -80, 5], [-54, -60, 3]], 0.3), K.U("hg2")) + K.Pa(K.limb([[53, -98, 7], [56, -80, 5], [54, -60, 3]], 0.3), K.U("hg1"));
    // ogni codino: i capelli si stringono nell'elastico (collo sottile) e poi si aprono a coda morbida
    [-1, 1].forEach(function (l) {
      s += ciuffo(K, [[l * 60, -34, 12], [l * 63, -20, 13], [l * 66, -8, 12], [l * 70, 6, 24], [l * 78, 40, 32], [l * 80, 84, 30], [l * 76, 118, 20], [l * 72, 142, 2]], { onda: 2.5, fase: l > 0 ? 1.5 : 0 });
      s += laccio(K, l * 66, -6, -l * 14, 10);
    });
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  FRANGIA LUNGA — lunghi con frangia a ciuffo
  // =========================================================
  A.pezzo("capelli", "frangialunghi", function (K) {
    var dietro = dietroLungo(K, 130, 84, 4);
    // frangia piena e bassa, quasi fino alle sopracciglia; lunghezze tagliate dritte (punte piene, non a punta)
    var fr = "M-60 -86C-72 -130 -52 -170 -4 -174C46 -176 72 -138 60 -86C58 -92 55 -96 50 -98C24 -92 -24 -92 -50 -98C-55 -96 -58 -92 -60 -86Z";
    var s = K.Pa(fr, K.U("hg3"));
    s += K.ciocche([
      [[-24, -166, 8], [-48, -150, 14], [-58, -124, 14], [-58, -100, 8]],
      [[-10, -162, 8], [-32, -146, 12], [-44, -124, 12], [-46, -98, 4]],
      [[8, -164, 8], [34, -156, 14], [54, -134, 16], [58, -104, 8]],
      [[0, -156, 8], [-14, -140, 12], [-24, -120, 12], [-26, -96, 3]],
      [[6, -154, 8], [22, -138, 12], [36, -120, 10], [38, -96, 3]],
      [[-2, -150, 6], [-2, -130, 8], [-4, -98, 2]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
    s += vol(K, fr);
    s += K.St("M-30 -140L-30 -98", K.hDD, 1.2, 0.35) + K.St("M-2 -140L-2 -96", K.hDD, 1.2, 0.35) + K.St("M24 -140L24 -97", K.hDD, 1.2, 0.35);
    s += K.El(0, -97, 46, 3.5, K.soft(K.hDD, 0.45));
    s += tenda(K, -1, [[-52, -104, 20], [-64, -70, 24], [-70, -20, 26], [-72, 40, 28], [-72, 96, 28], [-71, 124, 28]], { tronca: true, onda: 1.5 });
    s += tenda(K, 1, [[52, -104, 20], [64, -70, 24], [70, -20, 26], [72, 40, 28], [72, 96, 28], [71, 122, 28]], { tronca: true, onda: 1.5, fase: 2 });
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  RIGA LATERALE — scriminatura di lato, ciocca grande a onda
  // =========================================================
  A.pezzo("capelli", "rigalato", function (K) {
    var dietro = dietroLungo(K, 118, 80, 4);
    var cal = "M-57 -80C-68 -126 -50 -172 -4 -174C44 -176 70 -140 60 -84L56 -96C50 -120 30 -140 -10 -146C-30 -134 -48 -112 -54 -92Z";
    var s = K.Pa(cal, K.U("hg3"));
    s += K.ciocche([
      [[-30, -150, 8], [-44, -152, 14], [-56, -132, 16], [-58, -102, 8]],
      [[-26, -158, 8], [-6, -170, 14], [26, -168, 16], [52, -148, 14], [60, -112, 6]],
      [[-22, -150, 8], [4, -160, 12], [32, -154, 14], [54, -130, 12], [58, -100, 4]],
      [[-18, -146, 6], [8, -150, 10], [34, -138, 10], [50, -114, 3]]
    ], ["hg1", "hg1", "hg2", "hg1"]);
    s += vol(K, cal);
    // la grande ciocca sulla fronte, dalla riga a sinistra verso destra
    var onda = K.limb([[-30, -146, 6], [-14, -150, 18], [12, -140, 26], [36, -118, 22], [52, -96, 12], [58, -72, 4]], 0.25);
    s += K.Pa(onda, K.U("hg2")) + "<g clip-path='" + K.clip(onda) + "'>" + K.ciocche([
      [[-24, -146, 6], [0, -144, 12], [26, -126, 14], [48, -100, 8], [56, -76, 2]],
      [[-20, -142, 5], [6, -134, 10], [30, -114, 10], [46, -92, 3]]
    ], ["hg1", "hg2"]) + K.St("M-20 -146C8 -148 34 -128 54 -92", K.hL, 2.6, 0.4) + K.El(50, -96, 16, 28, K.soft(K.hDD, 0.45)) + "</g>";
    s += K.St("M-30 -146C-34 -134 -38 -122 -44 -108", K.hDD, 1.6, 0.5);
    // lato sinistro: i capelli sono portati dietro l'orecchio (si vede l'orecchio, solo un filo di ciocca); lato destro: lunga onda sulla spalla
    s += ciuffo(K, [[-55, -104, 9], [-60, -86, 8], [-62, -68, 5], [-58, -56, 1.5]], { onda: 0.8 });
    s += ciuffo(K, [[56, -98, 14], [68, -64, 26], [76, -14, 32], [80, 40, 32], [76, 90, 26], [66, 124, 14], [56, 142, 2]], { onda: 6, fase: 1.3, flick: -10 });
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  HIME — frangia dritta, due ciocche pari ai lati del viso, dietro lunghi
  // =========================================================
  A.pezzo("capelli", "hime", function (K) {
    var dietro = dietroLungo(K, 126, 76, 0);
    var fr = "M-60 -88C-70 -130 -52 -168 -4 -172C46 -174 70 -136 60 -88C56 -96 52 -100 48 -100C28 -96 -28 -96 -48 -100C-52 -100 -56 -96 -60 -88Z";
    var s = K.Pa(fr, K.U("hg3"));
    s += K.ciocche([
      [[-4, -168, 8], [-34, -160, 14], [-54, -132, 16], [-58, -104, 10]],
      [[4, -168, 8], [34, -160, 14], [54, -132, 16], [58, -104, 10]],
      [[-4, -150, 8], [-20, -142, 12], [-40, -124, 12], [-46, -100, 4]],
      [[6, -150, 8], [24, -142, 12], [42, -124, 12], [48, -100, 4]],
      [[0, -146, 6], [-6, -128, 8], [-8, -102, 3]],
      [[2, -146, 6], [10, -128, 8], [12, -102, 3]]
    ], ["hg1", "hg2", "hg1", "hg2", "hg1", "hg2"]);
    s += vol(K, fr);
    // due ciocche dritte davanti alle orecchie, tagliate pari all'altezza del mento
    [-1, 1].forEach(function (l) {
      var d = "M" + (l * 50) + " -104C" + (l * 56) + " -80 " + (l * 62) + " -40 " + (l * 62) + " -4L" + (l * 80) + " -4C" + (l * 84) + " -40 " + (l * 76) + " -86 " + (l * 66) + " -112Z";
      s += K.Pa(d, K.U(l < 0 ? "hg2" : "hg1")) + "<g clip-path='" + K.clip(d) + "'>" + K.ciocche([
        [[l * 54, -100, 6], [l * 62, -60, 8], [l * 66, -8, 5]], [[l * 66, -100, 6], [l * 72, -60, 8], [l * 76, -8, 5]]
      ], ["hg1", "hg2"]) + K.El(l * 78, -50, 10, 60, K.soft(K.hDD, 0.45)) + K.El(l * 54, -50, 5, 40, K.soft(K.hL, 0.3)) + "</g>" + K.St("M" + (l * 62) + " -4L" + (l * 80) + " -4", K.hDD, 1.4, 0.45);
    });
    return { dietro: dietro, fronte: s };
  });

  // =========================================================
  //  TENDINA LUNGA — riga in mezzo, tendine ai lati della fronte, lunghi
  // =========================================================
  A.pezzo("capelli", "tendinalunghi", function (K) {
    var dietro = dietroLungo(K, 96, 84, 4);
    var cal = calotta(0, -174), s = K.Pa(cal, K.U("hg3"));
    s += K.ciocche([
      [[0, -150, 8], [-30, -156, 16], [-50, -140, 20], [-60, -112, 22], [-62, -100, 18], [-58, -82, 4]],
      [[2, -168, 8], [-22, -170, 14], [-48, -160, 18], [-64, -132, 20], [-68, -104, 16], [-64, -84, 3]],
      [[0, -150, 8], [30, -156, 16], [50, -140, 20], [60, -112, 20], [62, -100, 14], [56, -82, 3]],
      [[0, -166, 8], [26, -168, 14], [54, -148, 18], [68, -118, 16], [70, -94, 10], [64, -78, 2]]
    ], ["hg2", "hg1", "hg1", "hg2"]);
    s += vol(K, cal);
    // le tendine: dalla riga, sulla fronte e giù fino agli zigomi, aperte al centro
    [-1, 1].forEach(function (l) {
      var N = [[l * 2, -156, 6], [l * 20, -146, 16], [l * 38, -128, 20], [l * 50, -104, 20], [l * 56, -74, 16], [l * 54, -44, 8], [l * 48, -26, 1.5]];
      var d = K.limb(N, 0.2);
      s += K.Pa(d, K.U(l < 0 ? "hg2" : "hg1")) + "<g clip-path='" + K.clip(d) + "'>" + K.ciocche([
        [[l * 2, -152, 5], [l * 22, -140, 10], [l * 40, -120, 12], [l * 52, -92, 10], [l * 54, -50, 3]],
        [[l * 6, -158, 5], [l * 30, -148, 10], [l * 48, -126, 12], [l * 58, -96, 8], [l * 58, -62, 2]]
      ], ["hg1", "hg2"]) + K.St("M" + (l * 8) + " -150C" + (l * 30) + " -142 " + (l * 46) + " -122 " + (l * 52) + " -94", K.hL, 2.2, 0.35) + K.El(l * 60, -86, 12, 40, K.soft(K.hDD, 0.4)) + "</g>";
    });
    s += seg(K);
    // lunghezze a strati, corte sul petto, con le punte che si girano in fuori
    s += tenda(K, -1, [[-56, -90, 12], [-64, -60, 22], [-68, -16, 26], [-68, 28, 26], [-64, 60, 18], [-56, 74, 2]], { onda: 1.5, flick: 22 });
    s += tenda(K, 1, [[56, -90, 12], [64, -60, 22], [68, -16, 26], [68, 28, 26], [64, 60, 18], [56, 74, 2]], { onda: 1.5, flick: 22, fase: 1.5 });
    return { dietro: dietro, fronte: s };
  });
})();

/* PEZZI FATTI (capelli-d): trecce, mezzacoda, chignonspettinato, lunghissimi, codalaterale, chignondoppio, codebasse, frangialunghi, rigalato, hime, tendinalunghi */


// ---- cappelli2 ----
/* =========================================================
   CAPPELLI DA COSTUME e OCCHIALI speciali degli avatar illustrati (strada A, secondo tempo, seconda metà).
   Coordinate della testa: origine al mento, guance a y -78, cima del cranio K.top, mezza larghezza K.F.cw.
   Colore col colAcc (K.acc) dove il disegno di prima lo usava.
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGOminoA;
  if (!A) return;
  var q = function () { var o = []; for (var i = 0; i < arguments.length; i++) { var v = arguments[i]; o.push(typeof v === "number" ? Math.round(v * 10) / 10 : v); } return o.join(" "); };
  function pal(K) { var c = K.acc; return { c: c, l: K.mix(c, "#ffffff", 0.34), m: K.mix(c, "#000000", 0.2), d: K.mix(c, "#000000", 0.45), dd: K.mix(c, "#000000", 0.62) }; }
  function tre(K, c) { return { c: c, l: K.mix(c, "#ffffff", 0.4), m: K.mix(c, "#000000", 0.2), d: K.mix(c, "#000000", 0.45), dd: K.mix(c, "#000000", 0.62) }; }
  function dia(K, id, P) { return K.LG(id, 0.05, 0, 0.95, 1, [[0, P.l], [0.38, P.c], [1, P.d]]); }
  function ver(K, id, P) { return K.LG(id, 0, 0, 0, 1, [[0, P.l], [0.5, P.c], [1, P.m]]); }
  function ombra(K, y, rx, ry, op) { return "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(0, y, rx, ry, K.soft("#000000", op == null ? 0.5 : op)) + "</g>"; }
  function sag(y0, s, x, W) { var u = x / W; return y0 + s * (1 - u * u); }
  var ORO = { l: "#fff0b8", c: "#e8b84a", m: "#c48e2a", d: "#9c6a18", dd: "#6a440c" };
  var ARG = { l: "#ffffff", c: "#d3d9e3", m: "#a9b3c4", d: "#788396", dd: "#4c5668" };
  function metal(K, id, M) { return K.LG(id, 0.05, 0, 0.95, 1, [[0, M.l], [0.4, M.c], [0.75, M.m], [1, M.d]]); }
  // cerchietto di base (come il cerchietto già fatto): ellisse che passa dietro le tempie e sopra il cranio
  function cerch(K) { var cw = K.F.cw, T = K.top, rx = cw + 1, cy = -84, ry = cy - (T - 2); return { rx: rx, cy: cy, ry: ry, y: function (x) { var u = Math.min(0.999, Math.abs(x) / rx); return cy - ry * Math.sqrt(1 - u * u); } }; }
  function arcoCerch(K, C) { return "M" + q(-C.rx, C.cy) + "A" + q(C.rx, C.ry, 0, 0, 1, C.rx, C.cy); }
  function fasciaCerch(K, id, P, C, nero) {
    var arco = arcoCerch(K, C), s = "";
    s += K.St(arco, "#000000", 9.5, 0.16, " transform='translate(1.5 3)'") + K.St(arco, nero ? "#0c0c10" : P.dd, 7.6) + K.St(arco, ver(K, id, P), 5.8);
    s += K.St("M" + q(-C.rx + 1.5, C.cy - 8) + "A" + q(C.rx - 1, C.ry - 1, 0, 0, 1, -C.rx * 0.2, K.top - 1.4), P.l, 1.6, 0.7);
    s += K.St("M" + q(C.rx * 0.3, K.top - 1) + "A" + q(C.rx, C.ry, 0, 0, 1, C.rx - 1, C.cy - 12), P.dd, 1.4, 0.3);
    [-1, 1].forEach(function (sd) { s += K.El(sd * C.rx, C.cy, 4.4, 5.2, nero ? "#0c0c10" : P.d) + K.El(sd * C.rx - sd * 0.6, C.cy - 0.5, 3.1, 3.7, nero ? "#2b2b33" : P.c); });
    return s;
  }
  var cnt = 0;
  // stella a 5 punte
  function stella(cx, cy, r, ri, col, rot) {
    var p = [], i, a;
    for (i = 0; i < 10; i++) { a = (rot || -90) * Math.PI / 180 + i * Math.PI / 5; p.push(q(cx + (i % 2 ? ri : r) * Math.cos(a), cy + (i % 2 ? ri : r) * Math.sin(a))); }
    return "<path d='M" + p.join("L") + "Z' fill='" + col + "' stroke-linejoin='round'/>";
  }
  // luccichio a quattro punte
  function luccica(cx, cy, r, op) { return "<path d='M" + q(cx, cy - r) + "Q" + q(cx, cy, cx + r * 0.9, cy) + "Q" + q(cx, cy, cx, cy + r) + "Q" + q(cx, cy, cx - r * 0.9, cy) + "Q" + q(cx, cy, cx, cy - r) + "Z' fill='#ffffff' opacity='" + (op == null ? 0.95 : op) + "'/>"; }
  // gemma tonda col riflesso: centro, raggio, colore
  function gemma(K, cx, cy, r, col) {
    var id = "c2g" + (cnt++);
    return K.El(cx + 0.6, cy + 1.2, r * 1.22, r * 1.22, K.soft("#000000", 0.35)) + K.El(cx, cy, r * 1.08, r * 1.08, K.mix(col, "#000000", 0.5)) +
      K.El(cx, cy, r, r, K.RG(id, [[0, K.mix(col, "#ffffff", 0.55)], [0.5, col], [1, K.mix(col, "#000000", 0.35)]], "cx='.35' cy='.3' r='.85'")) + K.El(cx - r * 0.34, cy - r * 0.38, r * 0.3, r * 0.22, "#ffffff", " opacity='.8'");
  }
  // perla
  function perla(K, cx, cy, r) { return K.El(cx + 0.5, cy + 1, r * 1.2, r * 1.2, K.soft("#000000", 0.3)) + K.El(cx, cy, r, r, K.RG("c2p" + (cnt++), [[0, "#ffffff"], [0.6, "#f1ebe3"], [1, "#b8b0c0"]], "cx='.35' cy='.3' r='.8'")) + K.El(cx - r * 0.3, cy - r * 0.35, r * 0.28, r * 0.2, "#ffffff", " opacity='.9'"); }

  // ---------------------------------------------------------------- GATTO (orecchie da gatto sul cerchietto)
  // un'orecchia: lato sd (-1 sinistra, 1 destra), basi sul cerchietto a xa e xb (valori assoluti)
  function orecchiaGatto(K, sd, C, P, xa, xb, alt, incl, nome) {
    var ya = C.y(xa), yb = C.y(xb), ax = sd * (xa + xb) / 2 + sd * incl, ay = Math.min(ya, yb) - alt;
    var X = function (x) { return sd * x; };
    var d = "M" + q(X(xa), ya + 5) + "C" + q(X(xa - 1), ya - alt * 0.5, ax - sd * 5, ay + alt * 0.28, ax, ay) + "C" + q(ax + sd * 7, ay + alt * 0.3, X(xb + 4), yb - alt * 0.3, X(xb), yb + 5) + "Z";
    var s = K.El(ax * 0.9, (ay + ya) / 2 + 3, 22, alt * 0.7, K.soft("#000000", 0.2), "");
    s += K.Pa(d, K.LG(nome, 0.05, 0, 0.95, 1, [[0, P.l], [0.4, P.c], [1, P.d]]));
    s += "<g clip-path='" + K.clip(d) + "'>";
    // interno rosa, un po' dentro
    var dx = (xb - xa) * 0.2, bi = (ya + yb) / 2 + 3;
    var di = "M" + q(X(xa + dx * 0.8), ya + 6) + "C" + q(X(xa + dx * 0.8 - 1), ya - alt * 0.38, ax - sd * 3, ay + alt * 0.38, ax - sd * 0.4, ay + alt * 0.34) + "C" + q(ax + sd * 3, ay + alt * 0.4, X(xb - dx * 0.8 + 2), yb - alt * 0.2, X(xb - dx * 0.9), yb + 6) + "Z";
    s += K.Pa(di, K.LG(nome + "i", 0, 1, 0, 0, [[0, "#d8607f"], [0.5, "#ff9fba"], [1, "#ffd2e0"]]));
    s += K.St("M" + q(X(xa + dx * 1.6), ya + 2) + "Q" + q(ax - sd * 1, ay + alt * 0.56, ax, ay + alt * 0.44), "#a8385a", 1.2, 0.35);
    // peletti al bordo
    for (var i = 0; i < 4; i++) { var t = 0.28 + i * 0.12, px = X(xa) + (ax - X(xa)) * t, py = ya - alt * t * 0.75; s += K.St("M" + q(px - sd * 4.5, py + 2) + "l" + q(sd * 6.5, -3), "#ffd2e0", 1.4, 0.6); }
    s += K.El(ax + sd * 10, ay + alt * 0.65, 14, alt * 0.55, K.soft("#000000", 0.34)) + K.El(ax - sd * 6, ay + alt * 0.3, 7, alt * 0.3, K.soft("#ffffff", 0.3));
    s += "</g>";
    s += K.St("M" + q(X(xa - 1), ya + 2) + "C" + q(X(xa - 1), ya - alt * 0.5, ax - sd * 5, ay + alt * 0.28, ax, ay), P.l, 1.3, 0.5);
    return s;
  }
  A.pezzo("cappelli", "gatto", function (K) {
    var P = pal(K), C = cerch(K), s = "";
    s += orecchiaGatto(K, -1, C, P, C.rx * 0.2, C.rx * 0.76, 47, 3, "c2ga");
    s += orecchiaGatto(K, 1, C, P, C.rx * 0.2, C.rx * 0.76, 47, 3, "c2gb");
    s += fasciaCerch(K, "c2gf", P, C);
    return { svg: s };
  });

  // ---------------------------------------------------------------- MOLLETTE (fermagli colorati tra i capelli)
  function molletta(K, x, y, ang, len, P, id) {
    var s = "<g transform='translate(" + q(x, y) + ") rotate(" + q(ang) + ")'>";
    var h = 4.6, bar = "M" + q(-len / 2 + h, -h) + "L" + q(len / 2 - h, -h) + "A" + q(h, h, 0, 0, 1, len / 2 - h, h) + "L" + q(-len / 2 + h, h) + "A" + q(h, h, 0, 0, 1, -len / 2 + h, -h) + "Z";
    s += K.El(1.5, 3.2, len / 2 + 2, 6, K.soft("#000000", 0.4), "");
    s += K.Pa(bar, K.LG(id, 0, 0, 0, 1, [[0, P.l], [0.45, P.c], [1, P.d]]));
    // molla: segmento di metallo dentro il fermaglio
    s += "<g clip-path='" + K.clip(bar) + "'>" + K.St("M" + q(-len / 2 + 3, 1.2) + "L" + q(len / 2 - 3, 1.2), P.dd, 1.2, 0.45) + K.St("M" + q(-len / 2 + 1.5, -2.2) + "L" + q(len / 2 - 6, -2.2), "#ffffff", 1.5, 0.55) + K.El(len * 0.28, 3.4, len * 0.34, 3, K.soft("#000000", 0.3)) + "</g>";
    s += K.El(-len / 2 + 6.5, 0, 1.4, 1.4, P.dd, " opacity='.6'") + K.El(len / 2 - 6.5, 0, 1.4, 1.4, P.dd, " opacity='.6'");
    return s + "</g>";
  }
  A.pezzo("cappelli", "mollette", function (K) {
    var P = pal(K), cw = K.F.cw, T = K.top, s = "";
    // due fermagli incrociati sulla sinistra, uno solo a destra: sul bordo dei capelli sopra la tempia
    s += molletta(K, -cw * 0.62, T + 14, 38, 30, P, "c2m1") + molletta(K, -cw * 0.64, T + 24, -32, 30, P, "c2m2") + molletta(K, cw * 0.6, T + 17, -34, 30, P, "c2m3");
    return { svg: s };
  });

  // ---------------------------------------------------------------- PIRATA (tricorno nero col bordo d'oro e il teschietto)
  A.pezzo("cappelli", "pirata", function (K) {
    var cw = K.F.cw, W = cw + 5, T = K.top, s = "", sp = K.spalle;
    var P = { l: "#52525f", c: "#2a2a34", m: "#1b1b23", d: "#101015", dd: "#08080b" };
    var oroG = K.LG("c2po", 0, 0, 1, 1, [[0, ORO.l], [0.5, ORO.c], [1, ORO.d]]);
    var py = T - 30;
    // calotta alta, un po' schiacciata in cima
    var cal = "M" + q(-W * 0.86, -108) + "C" + q(-W * 0.96, T + 10, -W * 0.7, py + 6, -W * 0.3, py) + "Q" + q(0, py - 3, W * 0.3, py) + "C" + q(W * 0.7, py + 6, W * 0.96, T + 10, W * 0.86, -108) + "Z";
    // tesa rialzata davanti: mezzaluna con le punte che salgono ai lati
    var tip = W + 30, tyy = -128;
    var tesa = "M" + q(-tip, tyy) + "C" + q(-(W + 22), -112, -W * 0.8, -113, -W * 0.4, -113.5) + "Q" + q(0, -115, W * 0.4, -113.5) + "C" + q(W * 0.8, -113, W + 22, -112, tip, tyy) +
      "C" + q(W + 24, -106, W + 6, -97, W * 0.5, -94.5) + "C" + q(W * 0.24, -93.5, -W * 0.24, -93.5, -W * 0.5, -94.5) + "C" + q(-(W + 6), -97, -(W + 24), -106, -tip, tyy) + "Z";
    s += ombra(K, -104, W + 2, 11, 0.5);
    s += "<g transform='translate(0 -15)'>";
    s += K.El(0, -100, W + 28, 11, K.soft("#000000", 0.3), "");
    s += K.Pa(cal, K.LG("c2pc", 0.05, 0, 0.95, 1, [[0, P.l], [0.4, P.c], [1, P.m]])) + "<g clip-path='" + K.clip(cal) + "'>";
    s += K.St("M" + q(-W * 0.2, py) + "C" + q(-W * 0.34, T + 10, -W * 0.4, -118, -W * 0.45, -112), P.dd, 6, 0.3) + K.St("M" + q(W * 0.2, py) + "C" + q(W * 0.34, T + 10, W * 0.4, -118, W * 0.45, -112), P.dd, 6, 0.3);
    s += K.El(W * 0.8, -138, W * 0.5, 40, K.soft("#000000", 0.45)) + K.El(-W * 0.5, T - 6, W * 0.4, 18, K.soft("#ffffff", 0.22)) + "</g>";
    s += "<g clip-path='" + K.clip(cal) + "'>" + K.St(cal, oroG, 5) + "</g>";
    if (!sp) {
      var cy = -140;
      s += "<g transform='translate(0 " + cy + ") scale(1.12)'>";
      s += K.St("M-14 6L14 20M14 6L-14 20", "#8b8680", 5.4, 0.6) + K.St("M-14 5L14 19M14 5L-14 19", "#f4f1ea", 4.2);
      [[-15, 4.6], [-14, 21], [15, 4.6], [14, 21]].forEach(function (b) { s += K.El(b[0], b[1], 2.9, 2.9, "#f4f1ea") + K.El(b[0] + (b[0] < 0 ? -2.2 : 2.2), b[1], 2.2, 2.2, "#f4f1ea"); });
      var cr = "M-11 -2C-11 -14 11 -14 11 -2C11 4 8 6 7 8L7 12L-7 12L-7 8C-8 6 -11 4 -11 -2Z";
      s += K.Pa(cr, K.LG("c2sk", 0.1, 0, 0.9, 1, [[0, "#ffffff"], [0.6, "#eee9df"], [1, "#b9b2a6"]])) + K.St(cr, "#7d766a", 0.8, 0.5);
      s += K.El(-4.2, -1, 3.1, 3.5, "#14141a") + K.El(4.2, -1, 3.1, 3.5, "#14141a") + K.Pa("M0 3.6L-1.8 6.6L1.8 6.6Z", "#14141a") + K.St("M-3.4 9.5L-3.4 12M0 9.5L0 12M3.4 9.5L3.4 12", "#7d766a", 0.9, 0.7);
      s += "</g>";
    }
    // la tesa davanti
    s += K.Pa(tesa, K.LG("c2pi", 0, 0, 0, 1, [[0, P.l], [0.35, P.c], [1, P.d]])) + "<g clip-path='" + K.clip(tesa) + "'>";
    s += K.Pa("M" + q(-tip, tyy + 2) + "C" + q(-(W + 22), -108, -W * 0.8, -110, 0, -111) + "C" + q(W * 0.8, -110, W + 22, -108, tip, tyy + 2) + "L" + q(tip, -90) + "L" + q(-tip, -90) + "Z", P.dd, " opacity='.4'");
    s += K.El(W * 0.9, -110, W * 0.5, 14, K.soft("#000000", 0.4)) + K.El(-W * 0.6, -112, W * 0.5, 6, K.soft("#ffffff", 0.2));
    s += K.St(tesa, oroG, 5) + "</g>";
    s += K.St("M" + q(-W * 0.9, -112.5) + "Q" + q(0, -108, W * 0.9, -112.5), "#fff6c8", 0.9, 0.5);
    s += "</g>";
    return { linea: -112, svg: s };
  });

  // ---------------------------------------------------------------- MAGO (cono con la punta piegata, stelle, nastro d'oro)
  function cinqueStelle(cx, cy, r, ri, col, rot, K) {
    return "<g>" + K.El(cx, cy, r * 1.6, r * 1.6, K.soft(col, 0.4)) + stella(cx, cy, r, ri, col, rot) + "</g>";
  }
  A.pezzo("cappelli", "mago", function (K) {
    var P = pal(K), cw = K.F.cw, W = cw + 4, T = K.top, s = "";
    var brimW = W + 30, by = -124;
    var brim = "M" + q(-brimW, by - 2) + "C" + q(-brimW, by - 16, -brimW * 0.55, by - 24, 0, by - 24) + "C" + q(brimW * 0.55, by - 24, brimW, by - 16, brimW, by - 2) + "C" + q(brimW * 0.96, by + 9, W * 0.5, by + 16, 0, by + 16) + "C" + q(-W * 0.5, by + 16, -brimW * 0.96, by + 9, -brimW, by - 2) + "Z";
    s += ombra(K, -108, W + 4, 10, 0.5);
    s += K.El(0, -110, brimW + 4, 10, K.soft("#000000", 0.28), "");
    s += K.Pa(brim, ver(K, "c2mb", P)) + "<g clip-path='" + K.clip(brim) + "'>" + K.Pa("M" + q(-brimW, by + 2) + "C" + q(-brimW * 0.6, by + 18, brimW * 0.6, by + 18, brimW, by + 2) + "L" + q(brimW, by + 30) + "L" + q(-brimW, by + 30) + "Z", P.dd, " opacity='.4'") +
      K.El(brimW * 0.7, by + 2, brimW * 0.4, 16, K.soft("#000000", 0.3)) + K.El(-brimW * 0.6, by - 6, brimW * 0.36, 7, K.soft("#ffffff", 0.3)) + "</g>";
    s += K.St("M" + q(-brimW + 3, by + 1) + "C" + q(-brimW * 0.6, by + 13, brimW * 0.6, by + 13, brimW - 3, by + 1), P.l, 0.9, 0.5);
    // il cono, con la punta che si piega a destra
    var ty = T - 66, cone = "M" + q(-(W - 4), by - 2) + "C" + q(-(W - 10), T + 20, -28, T - 14, -8, T - 40) + "C" + q(0, T - 52, 10, ty - 4, 28, ty - 8) + "C" + q(40, ty - 10, 50, ty + 2, 52, ty + 14) +
      "C" + q(44, ty + 6, 34, ty + 4, 26, ty + 10) + "C" + q(18, ty + 18, 20, T - 20, 24, T - 6) + "C" + q(32, T + 20, W - 12, by - 20, W - 4, by - 2) + "Q" + q(0, by + 12, -(W - 4), by - 2) + "Z";
    s += K.Pa(cone, dia(K, "c2mc", P)) + "<g clip-path='" + K.clip(cone) + "'>";
    s += K.El(W * 0.7, T + 10, W * 0.5, 80, K.soft("#000000", 0.4)) + K.El(-W * 0.45, T + 4, W * 0.36, 44, K.soft("#ffffff", 0.3));
    s += K.St("M" + q(-W * 0.55, by - 6) + "C" + q(-W * 0.5, T + 30, -30, T - 10, -12, T - 36), P.l, 2.2, 0.28);
    // stelle e una mezzaluna dorate
    s += cinqueStelle(-14, T + 10, 7.5, 3.1, ORO.c, -90, K) + cinqueStelle(14, T + 32, 5.4, 2.3, ORO.l, -80, K) + cinqueStelle(-26, T + 40, 4, 1.7, ORO.l, -100, K) + cinqueStelle(30, ty + 4, 3.8, 1.6, ORO.l, -90, K);
    s += "<g transform='translate(8 " + q(T - 14) + ")'><path d='M0 -9A9 9 0 1 0 8 6A7 7 0 1 1 0 -9Z' fill='" + ORO.c + "'/><path d='M-2 -4A7 7 0 0 0 1 7' stroke='" + ORO.l + "' stroke-width='1.2' fill='none' opacity='.7' stroke-linecap='round'/></g>";
    s += "</g>";
    // nastro d'oro alla base del cono, con la fibbia
    var nb = "M" + q(-(W - 3), by - 14) + "Q" + q(0, by - 2, W - 3, by - 14) + "L" + q(W - 3.6, by - 1) + "Q" + q(0, by + 13, -(W - 3.6), by - 1) + "Z";
    s += K.Pa(nb, K.LG("c2mn", 0, 0, 0, 1, [[0, ORO.l], [0.5, ORO.c], [1, ORO.d]])) + "<g clip-path='" + K.clip(nb) + "'>" + K.St("M" + q(-W, by - 12) + "Q" + q(0, by + 1, W, by - 12), "#fff6c8", 1, 0.6) + K.El(W * 0.7, by - 2, W * 0.4, 8, K.soft("#000000", 0.25)) + "</g>";
    s += "<g transform='translate(0 " + q(by - 1) + ")'>" + K.Pa("M-8 -5H8V6H-8Z", ORO.d) + K.Pa("M-6 -3.4H6V4.4H-6Z", "#ffe27a") + K.Pa("M-6 -3.4H6V-2.2H-6Z", "#fff6c8", " opacity='.7'") + "</g>";
    return { linea: -112, svg: s };
  });

  // ---------------------------------------------------------------- VICHINGO (elmo di metallo con le corna)
  A.pezzo("cappelli", "vichingo", function (K) {
    var cw = K.F.cw, W = cw + 5, T = K.top, s = "", sp = K.spalle;
    var C = { l: "#fbf6e8", c: "#eadfc2", m: "#c9b78e", d: "#8e7a52" };
    // corna: base sull'elmo, curva verso fuori e in su
    [-1, 1].forEach(function (sd) {
      var X = function (x) { return q(sd * x); };
      var d = "M" + X(W - 8) + " -94C" + X(W + 18) + " -92 " + X(W + 40) + " -108 " + X(W + 38) + " -138C" + X(W + 37) + " -150 " + X(W + 32) + " -160 " + X(W + 25) + " -167C" + X(W + 29) + " -150 " + X(W + 24) + " -132 " + X(W + 10) + " -124C" + X(W + 4) + " -121 " + X(W - 2) + " -121 " + X(W - 8) + " -123Z";
      s += K.Pa(d, K.LG("c2vh" + sd, sd < 0 ? 1 : 0, 0, sd < 0 ? 0 : 1, 0.6, [[0, C.l], [0.45, C.c], [1, C.d]])) + "<g clip-path='" + K.clip(d) + "'>";
      for (var i = 0; i < 3; i++) s += K.St("M" + X(W + 4 + i * 11) + " " + q(-90 - i * 7 - (i > 1 ? 14 : 0)) + "Q" + X(W + 10 + i * 11) + " " + q(-110 - i * 6) + " " + X(W - 12 + i * 12) + " " + q(-130 - i * 8), C.d, 1.1, 0.28);
      s += K.St("M" + X(W - 2) + " -102C" + X(W + 26) + " -102 " + X(W + 38) + " -122 " + X(W + 33) + " -150", "#ffffff", 1.6, 0.55) + K.El(sd * (W + 22), -118, 14, 26, K.soft("#000000", 0.28)) + "</g>";
    });
    // cupola di metallo
    var dome = "M" + q(-(W - 1), -102) + "C" + q(-(W + 3), T + 26, -W * 0.62, T - 12, 0, T - 14) + "C" + q(W * 0.62, T - 12, W + 3, T + 26, W - 1, -102) + "Q" + q(0, -92, -(W - 1), -102) + "Z";
    s += ombra(K, -92, W - 3, 11, 0.5);
    s += K.Pa(dome, K.LG("c2vd", 0.05, 0, 0.95, 1, [[0, "#f4f7fb"], [0.3, "#c3ccd8"], [0.7, "#7f8b9c"], [1, "#4a5566"]])) + "<g clip-path='" + K.clip(dome) + "'>";
    s += K.St("M" + q(0, T - 12) + "L" + q(0, -100), "#4f5a6b", 3.2, 0.5) + K.St("M" + q(1.8, T - 12) + "L" + q(1.8, -100), "#ffffff", 1, 0.35);
    s += K.St("M" + q(-W * 0.78, -108) + "C" + q(-W * 0.84, T + 22, -W * 0.5, T - 4, -W * 0.18, T - 8), "#ffffff", 5, 0.4) + K.St("M" + q(-W * 0.66, -112) + "C" + q(-W * 0.7, T + 26, -W * 0.4, T + 2, -W * 0.14, T - 4), "#ffffff", 1.4, 0.5);
    s += K.El(W * 0.75, -126, W * 0.5, 40, K.soft("#1a2230", 0.45)) + "</g>";
    // fascia di cuoio con le borchie
    var fa = "M" + q(-(W + 1), -126) + "Q" + q(0, -118, W + 1, -126) + "L" + q(W + 1.5, -104) + "Q" + q(0, -94, -(W + 1.5), -104) + "Z";
    s += K.Pa(fa, K.LG("c2vf", 0, 0, 0, 1, [[0, "#b9884e"], [0.5, "#8a5c2c"], [1, "#5a3a1a"]])) + "<g clip-path='" + K.clip(fa) + "'>" + K.St("M" + q(-W, -124) + "Q" + q(0, -116, W, -124), "#e0b27a", 1, 0.5) + K.El(W * 0.8, -112, W * 0.4, 14, K.soft("#000000", 0.3)) + "</g>";
    s += K.St("M" + q(-(W + 1.5), -104) + "Q" + q(0, -94, W + 1.5, -104), "#3b2410", 1.4, 0.5);
    if (!sp) {
      [-0.88, -0.58, -0.29, 0, 0.29, 0.58, 0.88].forEach(function (u) { var x = u * W, y = sag(-115, 7, x, W + 1.5); s += gemma(K, x, y, 3, "#f0c25a"); });
    }
    return { linea: -104, svg: s };
  });

  // ---------------------------------------------------------------- TIARA (argento con le pietre)
  A.pezzo("cappelli", "tiara", function (K) {
    var cw = K.F.cw, T = K.top, s = "", sp = K.spalle, Wt = cw * 0.98;
    var yBo = function (x) { return -106 - 24 * (1 - Math.pow(x / Wt, 2)); };   // bordo basso: più alto al centro (segue la fronte)
    var yTo = function (x) { return yBo(x) - 9; };
    var band = "M" + q(-Wt, yBo(-Wt)) + "Q" + q(0, yBo(0) * 2 - yBo(Wt), Wt, yBo(Wt)) + "L" + q(Wt, yTo(Wt)) + "Q" + q(0, yTo(0) * 2 - yTo(Wt), -Wt, yTo(Wt)) + "Z";
    var pts = [[0, 34], [0.4, 24], [0.76, 13]], pic = [], i;
    // punte: centro, e due per lato, alte in centro
    var tips = [[0, 34, 6.5], [-0.4, 24, 5], [0.4, 24, 5], [-0.76, 13, 4], [0.76, 13, 4]];
    var sagoma = "M" + q(-Wt, yTo(-Wt) + 1);
    var ordine = [-0.76, -0.4, 0, 0.4, 0.76], altA = { "-0.76": 17, "-0.4": 31, "0": 46, "0.4": 31, "0.76": 17 }, prima = -Wt, x0, x1, h, tx, ty;
    var d = "M" + q(-Wt, yTo(-Wt) + 1);
    ordine.forEach(function (u, k) {
      tx = u * Wt; h = altA[String(u)]; ty = yTo(tx) - h;
      var vx = (k === 0 ? -Wt * 0.9 : (ordine[k - 1] + u) / 2 * Wt);
      d += "L" + q(vx, yTo(vx) - 4) + "Q" + q(tx - 3.4, yTo(tx) - h * 0.5, tx, ty) + "Q" + q(tx + 3.4, yTo(tx) - h * 0.5, tx + (k === 4 ? 0 : 0) + 4.2, yTo(tx + 4.2) - 4);
    });
    d += "L" + q(Wt, yTo(Wt) + 1) + "L" + q(Wt, yBo(Wt)) + "Q" + q(0, yBo(0) * 2 - yBo(Wt), -Wt, yBo(-Wt)) + "Z";
    s += K.El(0, -130, Wt + 12, 22, K.soft("#000000", 0.25), "");
    s += K.Pa(d, metal(K, "c2ti", ARG)) + "<g clip-path='" + K.clip(d) + "'>" + K.El(Wt * 0.7, -126, Wt * 0.5, 30, K.soft("#2a3548", 0.4)) + K.El(-Wt * 0.6, -128, Wt * 0.4, 18, K.soft("#ffffff", 0.45)) + "</g>";
    s += K.Pa(band, K.LG("c2tb", 0, 0, 0, 1, [[0, ARG.l], [0.4, ARG.c], [1, ARG.d]])) + K.St("M" + q(-Wt + 2, yTo(-Wt + 2) + 1.2) + "Q" + q(0, yTo(0) * 2 - yTo(Wt) + 1.4, Wt - 2, yTo(Wt - 2) + 1.2), "#ffffff", 1, 0.75) + K.St("M" + q(-Wt, yBo(-Wt) - 0.5) + "Q" + q(0, yBo(0) * 2 - yBo(Wt) - 0.5, Wt, yBo(Wt) - 0.5), ARG.dd, 1.3, 0.5);
    if (!sp) {
      // piccoli ricami tra le punte (anellini)
      [-0.58, -0.2, 0.2, 0.58].forEach(function (u) { var x = u * Wt; s += K.El(x, yTo(x) - 4.6, 3.2, 3.2, "none", " stroke='" + ARG.d + "' stroke-width='1.1' opacity='.7'"); });
      // pietre: grande rosa al centro, azzurre ai lati, perline in cima alle punte
      s += gemma(K, 0, yTo(0) - 18, 6.6, "#e64b86");
      [-0.4, 0.4].forEach(function (u) { s += gemma(K, u * Wt, yTo(u * Wt) - 14, 4.4, "#4aa6f2"); });
      [-0.76, 0.76].forEach(function (u) { s += gemma(K, u * Wt, yTo(u * Wt) - 8, 3.2, "#a98cf2"); });
      s += perla(K, 0, yTo(0) - 46.5, 3.4) + perla(K, -0.4 * Wt, yTo(-0.4 * Wt) - 32, 2.8) + perla(K, 0.4 * Wt, yTo(0.4 * Wt) - 32, 2.8);
      s += luccica(K.n1(Wt * 0.62), K.n1(yTo(Wt * 0.62) - 26), 7, 0.95) + luccica(-Wt * 0.5, yTo(-Wt * 0.5) - 38, 5, 0.8);
    }
    return { svg: s };
  });

  // ---------------------------------------------------------------- AUREOLA (anello d'oro che brilla sopra la testa)
  A.pezzo("cappelli", "aureola", function (K) {
    var T = K.top, s = "", cy = T - 22, rx = 40, ry = 10, i;
    var anello = function (r, y) { return "M" + q(-rx, y) + "A" + q(rx, ry, 0, 1, 1, rx, y) + "A" + q(rx, ry, 0, 1, 1, -rx, y); };
    // alone
    s += K.El(0, cy, rx + 18, ry + 14, K.soft("#ffe27a", 0.55)) + K.El(0, cy, rx + 8, ry + 7, K.soft("#fff3b0", 0.5));
    var d = "M" + q(-rx, cy) + "A" + q(rx, ry, 0, 1, 1, rx, cy) + "A" + q(rx, ry, 0, 1, 1, -rx, cy);
    s += K.St(d, "#a8740b", 8.6, 0.25, " transform='translate(0 2.2)'");
    s += K.St(d, "#b27e12", 7.4) + K.St(d, K.LG("c2au", 0, 0, 0, 1, [[0, "#fff6c8"], [0.45, "#ffd75a"], [1, "#d89a1c"]]), 5.6);
    s += K.St("M" + q(-rx + 4, cy - 3) + "A" + q(rx - 4, ry - 2, 0, 0, 1, -rx * 0.1, cy - ry + 1.4), "#ffffff", 1.6, 0.85);
    s += K.St("M" + q(rx - 6, cy + 3.4) + "A" + q(rx - 6, ry - 1, 0, 0, 1, rx * 0.2, cy + ry - 0.6), "#a8740b", 1.3, 0.45);
    s += luccica(rx * 0.74, cy - ry * 0.7, 7, 0.95) + luccica(-rx * 0.88, cy + 3, 4, 0.7);
    return { svg: s };
  });

  // ---------------------------------------------------------------- CORNA (cornetti da diavoletto)
  A.pezzo("cappelli", "corna", function (K) {
    var cw = K.F.cw, T = K.top, s = "", R = { l: "#ff8a85", c: "#e03131", m: "#bb2222", d: "#8a1c1c" };
    [-1, 1].forEach(function (sd) {
      var bx = sd * cw * 0.5, by = T + 24, X = function (x) { return sd * x; };
      var d = "M" + q(bx - sd * 13, by + 10) + "C" + q(bx - sd * 17, by - 10, bx - sd * 12, by - 30, bx + sd * 6, by - 46) + "C" + q(bx + sd * 3, by - 28, bx + sd * 13, by - 14, bx + sd * 16, by + 4) +
        "C" + q(bx + sd * 8, by + 10, bx - sd * 4, by + 14, bx - sd * 13, by + 10) + "Z";
      s += K.El(bx, by + 8, 18, 7, K.soft("#000000", 0.35), "");
      s += K.Pa(d, K.LG("c2co" + sd, sd < 0 ? 0 : 1, 0.1, sd < 0 ? 1 : 0, 0.9, [[0, R.l], [0.4, R.c], [1, R.d]])) + "<g clip-path='" + K.clip(d) + "'>" +
        K.El(bx + sd * 12, by - 6, 8, 22, K.soft("#000000", 0.32)) + K.St("M" + q(bx - sd * 9, by + 2) + "C" + q(bx - sd * 11, by - 10, bx - sd * 7, by - 22, bx + sd * 0.5, by - 34), "#ffffff", 2, 0.5) +
        K.St("M" + q(bx - sd * 13, by + 3) + "Q" + q(bx, by + 8, bx + sd * 13, by + 2), R.d, 3, 0.35) + "</g>";
    });
    return { svg: s };
  });

  // ---------------------------------------------------------------- CONIGLIO (cerchietto con le lunghe orecchie)
  A.pezzo("cappelli", "coniglio", function (K) {
    var C = cerch(K), s = "", P = { l: "#ffffff", c: "#f3eff9", m: "#dbd3e8", d: "#b3a8c8", dd: "#887ba2" };
    [[-1, -0.3, -9, 0], [1, 0.3, 13, 1]].forEach(function (o) {
      var sd = o[0], bx = o[1] * C.rx, by = C.y(bx) + 3, ang = o[2], L = 66, Wd = 12.5;
      var d = "M" + q(-Wd, 0) + "C" + q(-Wd - 7, -L * 0.4, -Wd - 4, -L * 0.9, 0, -L) + "C" + q(Wd + 4, -L * 0.9, Wd + 7, -L * 0.4, Wd, 0) + "Z";
      var di = "M" + q(-Wd * 0.55, -3) + "C" + q(-Wd - 1, -L * 0.4, -Wd * 0.8, -L * 0.82, 0, -L * 0.88) + "C" + q(Wd * 0.8, -L * 0.82, Wd + 1, -L * 0.4, Wd * 0.55, -3) + "Z";
      s += "<g transform='translate(" + q(bx, by) + ") rotate(" + ang + ")'>";
      s += K.El(2, -L * 0.45, Wd + 6, L * 0.55, K.soft("#000000", 0.22), "");
      s += K.Pa(d, K.LG("c2cn" + o[3], 0.05, 0, 0.95, 1, [[0, P.l], [0.45, P.c], [1, P.m]])) + "<g clip-path='" + K.clip(d) + "'>";
      s += K.Pa(di, K.LG("c2ci" + o[3], 0.1, 0, 0.9, 1, [[0, "#ffb8d0"], [0.5, "#ff93b8"], [1, "#d96d97"]]));
      s += K.El(0, -L * 0.72, Wd * 0.7, L * 0.2, K.soft("#ffffff", 0.35)) + K.El(Wd * 0.9, -L * 0.42, 6, L * 0.46, K.soft("#4b3a6a", 0.3)) + K.El(-Wd * 0.7, -L * 0.62, 4, L * 0.28, K.soft("#ffffff", 0.55));
      s += K.St("M" + q(-Wd * 0.2, -L * 0.2) + "Q" + q(0, -L * 0.5, -Wd * 0.2, -L * 0.8), "#c4577f", 1, 0.3);
      s += "</g>" + K.St("M" + q(-Wd - 0.5, -4) + "C" + q(-Wd - 7, -L * 0.4, -Wd - 4, -L * 0.9, 0, -L), P.dd, 1, 0.3);
      s += "</g>";
    });
    s += fasciaCerch(K, "c2cf", P, C);
    return { svg: s };
  });

  // ---------------------------------------------------------------- ANTENNE (cerchietto con le antenne da alieno)
  A.pezzo("cappelli", "antenne", function (K) {
    var C = cerch(K), P = pal(K), s = "", T = K.top, N = { l: "#6b6b7a", c: "#3a3a46", m: "#2b2b33", d: "#1c1c22", dd: "#111116" };
    [-1, 1].forEach(function (sd) {
      var bx = sd * C.rx * 0.34, by = C.y(bx) + 2, tx = sd * (C.rx * 0.34 + 20), ty = T - 50, mx = sd * (C.rx * 0.34 + 5), my = (by + ty) / 2;
      var d = "M" + q(bx, by) + "Q" + q(mx + sd * 12, my + 6, tx, ty);
      s += K.St(d, "#000000", 7, 0.2, " transform='translate(1.2 2)'") + K.St(d, P.d, 6) + K.St(d, P.m, 4.6) + K.St(d, P.c, 3.2) + K.St("M" + q(bx - sd * 1.4, by - 3) + "Q" + q(mx + sd * 9.6, my + 3, tx - sd * 2.6, ty + 6), P.l, 1.1, 0.8);
      s += K.El(tx, ty, 17, 17, K.soft(P.l, 0.55)) + K.El(tx + 1, ty + 1.8, 9.4, 9.4, K.soft("#000000", 0.3));
      s += K.El(tx, ty, 8.4, 8.4, P.dd) + K.El(tx, ty, 7.6, 7.6, K.RG("c2an" + (sd + 2), [[0, K.mix(P.c, "#ffffff", 0.6)], [0.45, P.c], [1, P.d]], "cx='.35' cy='.3' r='.85'"));
      s += K.El(tx - 2.6, ty - 3, 2.6, 1.7, "#ffffff", " opacity='.85'") + K.El(tx + 2, ty + 3, 3.4, 1.2, P.l, " opacity='.5'");
    });
    s += fasciaCerch(K, "c2af", N, C, true);
    return { svg: s };
  });

  // ---------------------------------------------------------------- CORONA (oro, con gemme e perle)
  A.pezzo("cappelli", "corona", function (K) {
    var cw = K.F.cw, W = cw + 2, T = K.top, s = "", i;
    var yTop = function (x) { return sag(-158, 15, x, W + 1); }, yBot = function (x) { return sag(-132, 18, x, W + 1); };
    var tips = [[-0.9, 28], [-0.45, 38], [0, 50], [0.45, 38], [0.9, 28]];
    var d = "M" + q(-(W + 1), yBot(-W - 1)) + "L" + q(-(W + 1), yTop(-W - 1));
    var vel = "M" + q(-W * 0.86, yTop(-W * 0.86) - 4) + "C" + q(-W * 0.9, T + 8, -W * 0.4, T - 18, 0, T - 20) + "C" + q(W * 0.4, T - 18, W * 0.9, T + 8, W * 0.86, yTop(W * 0.86) - 4) + "Z";
    // velluto rosso dietro le punte
    s += ombra(K, -108, W - 2, 8, 0.4);
    s += K.Pa(vel, K.LG("c2cv", 0.05, 0, 0.95, 1, [[0, "#d63a52"], [0.5, "#a3162f"], [1, "#600a1c"]])) + "<g clip-path='" + K.clip(vel) + "'>" + K.El(W * 0.5, -140, W * 0.5, 30, K.soft("#000000", 0.35)) + K.El(-W * 0.4, -148, W * 0.3, 12, K.soft("#ffffff", 0.25)) + "</g>";
    // sagoma d'oro: fascia + cinque punte
    tips.forEach(function (t, k) {
      var tx = t[0] * W, ty = yTop(tx) - t[1], vx = k < 4 ? (tips[k][0] + tips[k + 1][0]) / 2 * W : W + 1;
      d += "L" + q((k === 0 ? -W * 0.98 : (tips[k - 1][0] + t[0]) / 2 * W) + (k === 0 ? 0 : 0), yTop(k === 0 ? -W * 0.98 : (tips[k - 1][0] + t[0]) / 2 * W) - 12) + "Q" + q(tx - 6, yTop(tx) - t[1] * 0.45, tx, ty) + "Q" + q(tx + 6, yTop(tx) - t[1] * 0.45, vx, yTop(vx) - 12);
    });
    d += "L" + q(W + 1, yTop(W + 1)) + "L" + q(W + 1, yBot(W + 1)) + "Q" + q(0, yBot(0) * 2 - yBot(W + 1), -(W + 1), yBot(-W - 1)) + "Z";
    s += K.El(0, -118, W + 10, 24, K.soft("#000000", 0.22), "");
    s += K.Pa(d, metal(K, "c2cr", ORO)) + "<g clip-path='" + K.clip(d) + "'>" + K.El(W * 0.75, -124, W * 0.5, 36, K.soft("#4a2a00", 0.42)) + K.El(-W * 0.6, -130, W * 0.4, 22, K.soft("#ffffff", 0.45)) + "</g>";
    // fascia: bordo alto e basso, e righe
    var fa = "M" + q(-(W + 1), yTop(-W - 1)) + "Q" + q(0, yTop(0) * 2 - yTop(W + 1), W + 1, yTop(W + 1)) + "L" + q(W + 1, yBot(W + 1)) + "Q" + q(0, yBot(0) * 2 - yBot(W + 1), -(W + 1), yBot(-W - 1)) + "Z";
    s += "<g clip-path='" + K.clip(fa) + "'>" + K.St("M" + q(-W, yTop(-W) + 2.4) + "Q" + q(0, yTop(0) * 2 - yTop(W) + 2.4, W, yTop(W) + 2.4), ORO.dd, 1.2, 0.5) + K.St("M" + q(-W, yBot(-W) - 2.4) + "Q" + q(0, yBot(0) * 2 - yBot(W) - 2.4, W, yBot(W) - 2.4), ORO.dd, 1.2, 0.5) + K.St("M" + q(-W, yTop(-W) + 1.2) + "Q" + q(0, yTop(0) * 2 - yTop(W) + 1.2, W, yTop(W) + 1.2), "#fff6c8", 0.9, 0.8) + "</g>";
    s += K.St("M" + q(-(W + 1), yBot(-W - 1)) + "Q" + q(0, yBot(0) * 2 - yBot(W + 1), W + 1, yBot(W + 1)), ORO.dd, 1.5, 0.5);
    // gemme sulla fascia e perle sulle punte
    var gcol = ["#2f9e44", "#4aa6f2", "#e03a5a", "#4aa6f2", "#2f9e44"];
    [-0.85, -0.45, 0, 0.45, 0.85].forEach(function (u, k) { var x = u * W, y = (yTop(x) + yBot(x)) / 2 + 0.6; s += gemma(K, x, y, k === 2 ? 5.6 : (k % 2 ? 4 : 3.4), gcol[k]); });
    tips.forEach(function (t, k) { var tx = t[0] * W; s += perla(K, tx, yTop(tx) - t[1] - 1.5, k === 2 ? 4.2 : 3.4); });
    s += luccica(-W * 0.62, yTop(-W * 0.62) - 26, 5, 0.9);
    return { linea: -128, svg: s };
  });

  // ---------------------------------------------------------------- OCCHIALI 3D (cartone, lente rossa e azzurra)
  function occ(K) { return K.occhiPos; }
  function aste(K, col, w, yy) {
    var P = occ(K), cw = K.F.cw, s = "", n = K.n1;
    for (var i = 0; i < 2; i++) {
      var l = i ? 1 : -1, x1 = l * (P.dx + 15 * P.k), y1 = P.y + yy * P.k;
      var d = "M" + n(x1) + " " + n(y1) + "C" + n(l * (cw - 6)) + " " + n(y1 - 1) + " " + n(l * (cw - 1)) + " -80 " + n(l * (cw + 1.5)) + " -79";
      s += K.St(d, K.scuro(col, 0.45), w + 0.8, 0.4) + K.St(d, col, w);
    }
    return s;
  }
  A.pezzo("occhiali", "tred", function (K) {
    var P = occ(K), n = K.n1, s = "", cw = K.F.cw, k = P.k, i, lato;
    var car = "#f6f1e6", carL = "#ffffff", carD = "#c9bfa8", carDD = "#8d8470";
    var hw = 16, hh = 11.5;   // mezza larghezza e mezza altezza del foro
    var foro = "M" + (-hw) + " " + (-hh) + "H" + hw + "V" + hh + "H" + (-hw) + "Z";
    // montatura di cartone in un solo pezzo (ponte sopra il naso) con due fori rettangolari
    var X = P.dx + (hw + 4.4) * k, yT = P.y - (hh + 4.4) * k, yB = P.y + (hh + 4.4) * k, r = 4 * k;
    var ext = "M" + n(-X + r) + " " + n(yT) + "H" + n(X - r) + "Q" + n(X) + " " + n(yT) + " " + n(X) + " " + n(yT + r) + "V" + n(yB - r) + "Q" + n(X) + " " + n(yB) + " " + n(X - r) + " " + n(yB) + "H" + n(-X + r) + "Q" + n(-X) + " " + n(yB) + " " + n(-X) + " " + n(yB - r) + "V" + n(yT + r) + "Q" + n(-X) + " " + n(yT) + " " + n(-X + r) + " " + n(yT) + "Z";
    var fori = "";
    for (i = 0; i < 2; i++) { lato = i ? 1 : -1; var cx = lato * P.dx, x0 = cx - hw * k, x1 = cx + hw * k, y0 = P.y - hh * k, y1 = P.y + hh * k; fori += "M" + n(x0) + " " + n(y0) + "H" + n(x1) + "V" + n(y1) + "H" + n(x0) + "Z"; }
    s += aste(K, car, 3.4, -hh + 2);
    // ombra sul viso
    s += "<g clip-path='" + K.clip(K.faceD) + "'>" + K.El(2, P.y + 6, X + 2, (hh + 8) * k, K.soft(K.skDD, 0.3)) + "</g>";
    // pellicole colorate (sotto il cartone)
    for (i = 0; i < 2; i++) {
      lato = i ? 1 : -1; var cx2 = lato * P.dx, col1 = lato < 0 ? "#ff3b3b" : "#19c9ee", col2 = lato < 0 ? "#b50f1f" : "#0b7fa8";
      var rect = "M" + n(cx2 - (hw + 1) * k) + " " + n(P.y - (hh + 1) * k) + "H" + n(cx2 + (hw + 1) * k) + "V" + n(P.y + (hh + 1) * k) + "H" + n(cx2 - (hw + 1) * k) + "Z";
      s += K.Pa(rect, K.LG("c2t" + i, 0, 0, 1, 1, [[0, col1, 0.62], [1, col2, 0.72]])) +
        K.St("M" + n(cx2 - 11 * k) + " " + n(P.y + 9 * k) + "L" + n(cx2 + 2 * k) + " " + n(P.y - 10 * k), "#ffffff", 3.4, 0.34) + K.St("M" + n(cx2 - 5 * k) + " " + n(P.y + 10 * k) + "L" + n(cx2 + 7 * k) + " " + n(P.y - 8 * k), "#ffffff", 1.4, 0.26);
    }
    var cart = ext + fori;
    s += K.Pa(cart, K.LG("c2tc", 0, 0, 0, 1, [[0, carL], [0.5, car], [1, carD]]), " fill-rule='evenodd'");
    s += K.St(ext, carDD, 1.1, 0.55) + K.St(fori, carDD, 0.9, 0.5);
    // rilievo del cartone: orlo chiaro in alto e piega al centro
    s += K.St("M" + n(-X + r) + " " + n(yT + 0.9) + "H" + n(X - r), "#ffffff", 1, 0.9) + K.St("M" + n(-1.2) + " " + n(yT + 1) + "V" + n(P.y - hh * k - 0.5), carDD, 0.9, 0.5) +
      K.St("M" + n(-X + 1.6) + " " + n(yB - 1.2) + "H" + n(-P.dx - hw * k - 1.4), carDD, 0.8, 0.3) + K.St("M" + n(X - 1.6) + " " + n(yB - 1.2) + "H" + n(P.dx + hw * k + 1.4), carDD, 0.8, 0.3);
    // cucitura a puntini del bordo (finta cucitura da cinema)
    s += K.St("M" + n(-X + 2.4) + " " + n(yT + 2.4) + "H" + n(X - 2.4), carDD, 0.7, 0.35, " stroke-dasharray='1.8 1.8'");
    return s;
  });

  // ---------------------------------------------------------------- MONOCOLO (anello d'oro sull'occhio destro, con la catenella)
  A.pezzo("occhiali", "monocolo", function (K) {
    var P = occ(K), n = K.n1, s = "", k = P.k, cx = P.dx, cy = P.y + 1, R = 15.5 * k, cw = K.F.cw;
    // catenella: dal bordo dell'anello giù lungo la guancia fino sotto l'orecchio
    var x0 = cx + R * 0.72, y0 = cy + R * 0.78, x1 = cw - 1, y1 = -40;
    var cat = "M" + n(x0) + " " + n(y0) + "C" + n(x0 + 4) + " " + n(y0 + 18) + " " + n(x1 + 5) + " " + n(y1 - 20) + " " + n(x1) + " " + n(y1);
    s += K.St(cat, "#000000", 2.4, 0.16, " transform='translate(1 1.6)'") + K.St(cat, ORO.d, 1.9) + K.St(cat, "#ffe27a", 1.5, 0.95, " stroke-dasharray='2.4 1.6'") + K.St(cat, "#ffffff", 0.6, 0.6, " stroke-dasharray='1 4'");
    s += K.El(x1, y1, 2.3, 2.3, ORO.c) + K.El(x1 - 0.5, y1 - 0.6, 1.2, 1.2, "#fff6c8");
    // ombra e lente
    s += K.El(cx + 2, cy + 3.5, R + 3, R + 3, K.soft(K.skDD, 0.3));
    s += K.El(cx, cy, R, R, K.LG("c2ml", 0, 0, 1, 1, [[0, "#eaf5ff", 0.34], [0.55, "#bfe3ff", 0.12], [1, "#8fb7d9", 0.22]]));
    s += K.St("M" + n(cx - R * 0.62) + " " + n(cy + R * 0.28) + "L" + n(cx + R * 0.12) + " " + n(cy - R * 0.62), "#ffffff", 3.4, 0.38) + K.St("M" + n(cx - R * 0.3) + " " + n(cy + R * 0.6) + "L" + n(cx + R * 0.45) + " " + n(cy - R * 0.3), "#ffffff", 1.3, 0.3);
    // anello: ombra, oro, filo di luce, bordo sottile dentro
    var ring = "M" + n(cx - R) + " " + n(cy) + "A" + n(R) + " " + n(R) + " 0 1 0 " + n(cx + R) + " " + n(cy) + "A" + n(R) + " " + n(R) + " 0 1 0 " + n(cx - R) + " " + n(cy);
    s += K.St(ring, ORO.dd, 4.6, 0.9) + K.St(ring, K.LG("c2mr", 0, 0, 1, 1, [[0, ORO.l], [0.45, ORO.c], [1, ORO.d]]), 3.4);
    s += K.St("M" + n(cx - R * 0.78) + " " + n(cy - R * 0.5) + "A" + n(R) + " " + n(R) + " 0 0 1 " + n(cx + R * 0.1) + " " + n(cy - R + 0.4), "#fff6c8", 1.1, 0.9);
    s += K.St("M" + n(cx + R * 0.15) + " " + n(cy + R - 0.4) + "A" + n(R) + " " + n(R) + " 0 0 0 " + n(cx + R * 0.88) + " " + n(cy + R * 0.4), ORO.dd, 1, 0.5);
    // alzatina dove attacca la catenella
    s += K.El(x0, y0, 2.4, 2.4, ORO.c) + K.El(x0 - 0.5, y0 - 0.6, 1.2, 1.2, "#fff6c8");
    return s;
  });

  /* ---- PEZZI FATTI: gatto, mollette, pirata, mago, vichingo, tiara, aureola, corna, coniglio, antenne, corona (cappelli) e tred, monocolo (occhiali). ---- */
})();


// ---- extra-a ----
(function () {
  var A = window.SGOminoA;
  // ====== EXTRA A: al collo, borse, pittura sul viso ======
  // collo e borsa: coordinate del MONDO (400×1000), dentro un gruppo centrato su x = K.C (si scrive in x relativa al centro)
  // pittura: coordinate della testa, ritagliata sul viso

  var ORO = [[0, "#fff6c9"], [0.35, "#f6c744"], [0.75, "#c88a1a"], [1, "#8a5709"]];
  var ARGENTO = [[0, "#ffffff"], [0.4, "#d7dde6"], [1, "#7e8794"]];

  function cen(K, s) { return "<g transform='translate(" + K.C + " 0)'>" + s + "</g>"; }
  function colBorsa(K) {
    var v = K.c.colBorsa, L = window.SGOmino && window.SGOmino.OPZ && window.SGOmino.OPZ.colBorsa || ["#c92a2a"];
    return typeof v === "string" && v.charAt(0) === "#" ? v : (L[v] || L[0]);
  }
  function bordo(K, col, w) { return " stroke='" + K.scuro(col, 0.42) + "' stroke-width='" + (w || 1.5) + "' stroke-linejoin='round'"; }
  // gradiente «stoffa»: luce a sinistra, ombra a destra
  function stoffa(K, id, col, hor) {
    return hor === false ? K.LG(id, 0, 0, 0, 1, [[0, K.chiaro(col, 0.3)], [0.55, col], [1, K.scuro(col, 0.28)]])
      : K.LG(id, 0, 0, 1, 0, [[0, K.chiaro(col, 0.28)], [0.42, col], [1, K.scuro(col, 0.32)]]);
  }
  // un punto della curva quadratica a, c, b
  function qp(a, c, b, t) { return [(1 - t) * (1 - t) * a[0] + 2 * (1 - t) * t * c[0] + t * t * b[0], (1 - t) * (1 - t) * a[1] + 2 * (1 - t) * t * c[1] + t * t * b[1]]; }
  function qd(a, c, b, t) { return [2 * (1 - t) * (c[0] - a[0]) + 2 * t * (b[0] - c[0]), 2 * (1 - t) * (c[1] - a[1]) + 2 * t * (b[1] - c[1])]; }
  // curva di una collana: dai lati del collo (x = ±hw, y0) con la pancia al centro (sag = quanto scende il punto più basso)
  function curva(hw, y0, sag) { return [[-hw, y0], [0, y0 + 2 * sag], [hw, y0]]; }
  function dCurva(c) { return "M" + c[0][0] + " " + c[0][1] + "Q" + c[1][0] + " " + c[1][1] + " " + c[2][0] + " " + c[2][1]; }
  // ombra morbida sotto un oggetto (sul vestito)
  function ombraSotto(K, x, y, rx, ry, op) { return K.El(x, y, rx, ry, K.soft("#000000", op || 0.3)); }
  // l'ombra del mento sul collo
  function ombraMento(K, hw, y) { return K.El(0, y, hw + 4, 11, K.soft("#000000", 0.2)); }

  // un anello di stoffa attorno al collo (sciarpa, foulard, bandana): sagoma + sfumatura + pieghe
  function anello(K, id, col, hw, y0, sag, t, o) {
    o = o || {};
    var sp = o.sp || 7;
    var d = "M" + (-hw) + " " + y0 + "Q0 " + (y0 + 2 * sag) + " " + hw + " " + y0 + "L" + (hw + sp) + " " + (y0 + t * 0.9) + "Q0 " + (y0 + t + 2 * sag + 5) + " " + (-hw - sp) + " " + (y0 + t * 0.9) + "Z";
    var s = ombraSotto(K, 0, y0 + sag + t + 3, hw + sp + 6, 9, 0.32);
    s += K.Pa(d, stoffa(K, id, col), bordo(K, col, o.bw || 1.5));
    var cp = K.clip(d);
    var dentro = "";
    // volume del rotolo: luce in alto, ombra in basso, ombra del mento
    dentro += K.St("M" + (-hw + 3) + " " + (y0 + t * 0.28) + "Q0 " + (y0 + t * 0.28 + 2 * sag + 2) + " " + (hw - 3) + " " + (y0 + t * 0.28), K.chiaro(col, 0.6), 4, 0.35);
    dentro += K.St("M" + (-hw - 3) + " " + (y0 + t * 0.88) + "Q0 " + (y0 + t * 0.88 + 2 * sag + 5) + " " + (hw + 3) + " " + (y0 + t * 0.88), K.scuro(col, 0.5), 6, 0.32);
    dentro += ombraMento(K, hw, y0 + sag - 4);
    if (o.righe) {
      [0.5].forEach(function (f) {
        dentro += K.St("M" + (-hw - 4) + " " + (y0 + t * f) + "Q0 " + (y0 + t * f + 2 * sag + 3) + " " + (hw + 4) + " " + (y0 + t * f), o.righe, 3.2, 0.85);
      });
    }
    return { svg: s + "<g clip-path='" + cp + "'>" + dentro + "</g>", d: d, clip: cp };
  }

  // ---------- sciarpa ----------
  A.pezzo("collo", "sciarpa", function (K) {
    var N = K.B.nk, col = K.collo, F = Math.max(0.9, K.B.shx / 72), hw = N + 14 + (K.B.shx - 60) * 0.16, y0 = 234, sag = 9, t = 33, sp0 = 9;
    var rig = K.chiaro(col, 0.52);
    // le due code che pendono sul petto (una dietro all'altra)
    var s = "";
    function coda(x0, w, lung, incl, id, tono) {
      var c = tono ? K.scuro(col, 0.12) : col;
      var d = "M" + (x0 - w / 2) + " " + (y0 + sag + 12) + "L" + (x0 + w / 2) + " " + (y0 + sag + 10) +
        "Q" + (x0 + w / 2 + incl * 0.5 + 2) + " " + (y0 + sag + lung * 0.5) + " " + (x0 + w / 2 + incl + 3) + " " + (y0 + sag + lung) +
        "L" + (x0 - w / 2 + incl - 2) + " " + (y0 + sag + lung + 4) + "Q" + (x0 - w / 2 + incl * 0.5 - 1) + " " + (y0 + sag + lung * 0.5) + " " + (x0 - w / 2) + " " + (y0 + sag + 12) + "Z";
      var r = ombraSotto(K, x0 + incl * 0.6 + 4, y0 + sag + lung * 0.55, w * 0.8, lung * 0.5, 0.2);
      r += K.Pa(d, stoffa(K, id, c), bordo(K, c, 1.5));
      var cp = K.clip(d), dn = "";
      [0.55, 0.72].forEach(function (f) {
        dn += K.St("M" + (x0 - w) + " " + (y0 + sag + lung * f + 4) + "L" + (x0 + w + incl + 8) + " " + (y0 + sag + lung * f - 0), tono ? K.chiaro(c, 0.4) : rig, 4.2, 0.9);
      });
      dn += K.St("M" + (x0 + w / 2 - 3) + " " + (y0 + sag + 18) + "Q" + (x0 + w / 2 + incl * 0.5) + " " + (y0 + sag + lung * 0.5) + " " + (x0 + w / 2 + incl) + " " + (y0 + sag + lung), K.scuro(c, 0.5), 5, 0.22);
      dn += K.St("M" + (x0 - w / 2 + 4) + " " + (y0 + sag + 18) + "Q" + (x0 - w / 2 + incl * 0.5 + 2) + " " + (y0 + sag + lung * 0.5) + " " + (x0 - w / 2 + incl + 2) + " " + (y0 + sag + lung), K.chiaro(c, 0.6), 3, 0.3);
      r += "<g clip-path='" + cp + "'>" + dn + "</g>";
      // frange
      var fy = y0 + sag + lung + 3, fx = x0 + incl;
      for (var i = -2; i <= 2; i++) r += K.St("M" + (fx + i * 5.2 - 1) + " " + (fy + 1) + "L" + (fx + i * 5.2 + 0.5) + " " + (fy + 11), c, 2.6) + K.St("M" + (fx + i * 5.2 - 1.2) + " " + (fy + 1) + "L" + (fx + i * 5.2 + 0.2) + " " + (fy + 10), K.chiaro(c, 0.4), 0.9, 0.7);
      return r;
    }
    s += coda(-2 * F, 26 * F, 78, -14, "xa_sc1", true);
    s += coda(11 * F, 28 * F, 96, 8, "xa_sc2", false);
    var an = anello(K, "xa_sc0", col, hw, y0, sag, t, { righe: rig, sp: sp0 });
    s += an.svg;
    // il nodo/giro in primo piano: piega a V in mezzo al rotolo
    s += K.St("M-4 " + (y0 + sag * 2 + 1) + "Q8 " + (y0 + sag * 2 + 14) + " 18 " + (y0 + sag * 2 + 8), K.scuro(col, 0.5), 2.2, 0.45);
    // vista di spalle: il giro attorno alla nuca e una coda che scende sulla schiena
    var sb = coda(4, 28 * F, 66, 4, "xa_sc4", false) + anello(K, "xa_sc3", col, hw, y0, sag, t, { righe: rig, sp: sp0 }).svg;
    return { sopra: cen(K, s), spalle: cen(K, sb) };
  });

  // ---------- catenine d'oro (collana, ciondolo) ----------
  function catenina(K, c, w, id) {
    var d = dCurva(c);
    return K.St(d, "#8a5709", w + 1.3, 0.85) + K.St(d, K.LG(id, 0, 0, 1, 1, ORO), w) + K.St(d, "#fff6c9", w * 0.35, 0.8, " stroke-dasharray='1.6 3.2'");
  }
  function palla(K, x, y, r, id) {
    return ombraSotto(K, x + 1, y + r * 0.9, r * 1.1, r * 0.55, 0.35) +
      K.El(x, y, r, r, K.RG(id, [[0, "#fff6c9"], [0.35, "#f6c744"], [0.8, "#b9780f"], [1, "#7a4a06"]], "cx='.35' cy='.3' r='.8'"), " stroke='#7a4a06' stroke-width='1'") +
      K.El(x - r * 0.35, y - r * 0.4, r * 0.32, r * 0.2, "#ffffff", " opacity='.8'");
  }

  // ---------- collana ----------
  A.pezzo("collo", "collana", function (K) {
    var N = K.B.nk, c = curva(N + 3, 238, 30);
    var s = ombraMento(K, N, 244);
    s += K.St(dCurva(c), "#000", 11, 0.16, " transform='translate(1 4)'");
    s += catenina(K, c, 7, "xa_co");
    s += palla(K, 0, 238 + 30 + 15, 14.5, "xa_cop");
    return { sopra: cen(K, s) };
  });

  // ---------- ciondolo (cuoricino) ----------
  A.pezzo("collo", "ciondolo", function (K) {
    var N = K.B.nk, c = curva(N + 3, 238, 34);
    var s = ombraMento(K, N, 244);
    s += K.St(dCurva(c), "#000", 10, 0.16, " transform='translate(1 4)'");
    s += catenina(K, c, 6, "xa_ci");
    var y = 238 + 34 + 20;
    var cuore = "M0 " + (y + 15) + "C-18 " + (y + 3) + " -14 " + (y - 11) + " -6.5 " + (y - 11) + "C-3 " + (y - 11) + " 0 " + (y - 8) + " 0 " + (y - 5) + "C0 " + (y - 8) + " 3 " + (y - 11) + " 6.5 " + (y - 11) + "C14 " + (y - 11) + " 18 " + (y + 3) + " 0 " + (y + 15) + "Z";
    s += "<g transform='translate(0 " + y + ") scale(1.5) translate(0 " + (-y) + ")'>";
    s += K.St("M0 " + (y - 8) + "L0 " + (y - 14), "#8a5709", 3.2) + K.St("M0 " + (y - 8) + "L0 " + (y - 14), "#f6c744", 1.8);
    s += ombraSotto(K, 2, y + 15, 12, 4, 0.3);
    s += K.Pa(cuore, K.RG("xa_cic", [[0, "#ff9ab8"], [0.5, "#ff4f8a"], [1, "#b81d52"]], "cx='.35' cy='.3' r='.85'"), " stroke='#a61e4d' stroke-width='1' stroke-linejoin='round'");
    s += K.El(-6, y - 5, 3.6, 2.1, "#ffffff", " opacity='.75' transform='rotate(-35 -6 " + (y - 5) + ")'");
    s += "</g>";
    return { sopra: cen(K, s) };
  });

  // ---------- perle ----------
  A.pezzo("collo", "perle", function (K) {
    var N = K.B.nk, c = curva(N + 4, 236, 30), s = ombraMento(K, N, 242), n = 12;
    s += K.St(dCurva(c), "#000", 12, 0.14, " transform='translate(1 4)'") + K.St(dCurva(c), "#8c8478", 1.6, 0.9);
    var rg = K.RG("xa_pe", [[0, "#ffffff"], [0.45, "#f6efe4"], [0.85, "#d2c6b4"], [1, "#a99c88"]], "cx='.35' cy='.3' r='.8'");
    for (var i = 0; i < n; i++) {
      var t = (i + 0.5) / n, p = qp(c[0], c[1], c[2], t), r = 8.8 - 2.4 * Math.abs(t - 0.5) * 2;
      s += K.El(p[0] + 0.8, p[1] + r * 0.85, r * 0.95, r * 0.5, K.soft("#000", 0.26));
      s += K.El(p[0], p[1], r, r, rg, " stroke='#8f836f' stroke-width='.9'");
      s += K.El(p[0] - r * 0.35, p[1] - r * 0.4, r * 0.3, r * 0.2, "#ffffff", " opacity='.95'");
    }
    return { sopra: cen(K, s) };
  });

  // ---------- papillon ----------
  A.pezzo("collo", "papillon", function (K) {
    var col = K.collo, k = Math.max(0.82, K.B.nk / 26), y = 256, s = "";
    s += ombraSotto(K, 2, y + 9, 40 * k, 12, 0.3);
    function ala(l) {
      var d = "M" + (l * 3) + " " + (y - 3) + "C" + (l * 14) + " " + (y - 14) + " " + (l * 30 * k) + " " + (y - 22 * k) + " " + (l * 41 * k) + " " + (y - 21 * k) +
        "C" + (l * 46 * k) + " " + (y - 8) + " " + (l * 46 * k) + " " + (y + 8) + " " + (l * 41 * k) + " " + (y + 21 * k) +
        "C" + (l * 30 * k) + " " + (y + 22 * k) + " " + (l * 14) + " " + (y + 14) + " " + (l * 3) + " " + (y + 3) + "Z";
      var r = K.Pa(d, K.LG("xa_pa" + (l > 0 ? 1 : 0), l > 0 ? 0 : 1, 0, l > 0 ? 1 : 0, 0, [[0, K.scuro(col, 0.1)], [0.55, col], [1, K.chiaro(col, l > 0 ? 0.1 : 0.22)]]), bordo(K, col, 1.5));
      var cp = K.clip(d);
      r += "<g clip-path='" + cp + "'>" + K.St("M" + (l * 8) + " " + (y - 3) + "L" + (l * 38 * k) + " " + (y - 14 * k) + "M" + (l * 8) + " " + (y + 3) + "L" + (l * 38 * k) + " " + (y + 14 * k), K.scuro(col, 0.5), 2, 0.3) +
        K.St("M" + (l * 12) + " " + (y - 8) + "Q" + (l * 28 * k) + " " + (y - 16 * k) + " " + (l * 40 * k) + " " + (y - 15 * k), K.chiaro(col, 0.6), 2.4, 0.45) +
        K.El(l * 40 * k, y, 6, 22 * k, K.soft("#000", 0.18)) + "</g>";
      return r;
    }
    s += ala(-1) + ala(1);
    var nodo = "M-9 " + (y - 9) + "Q0 " + (y - 12) + " 9 " + (y - 9) + "L8 " + (y + 9) + "Q0 " + (y + 12) + " -8 " + (y + 9) + "Z";
    s += K.Pa(nodo, K.LG("xa_pan", 0, 0, 1, 0, [[0, K.chiaro(col, 0.18)], [0.5, col], [1, K.scuro(col, 0.3)]]), bordo(K, col, 1.4));
    s += K.St("M-5 " + (y - 6) + "L-5 " + (y + 6), K.chiaro(col, 0.6), 2, 0.5);
    return { sopra: cen(K, s) };
  });

  // ---------- cravatta ----------
  A.pezzo("collo", "cravatta", function (K) {
    var col = K.collo, y = 252, k = Math.max(0.85, K.B.nk / 28), s = "", len = 118;
    var cs = K.scuro(col, 0.08);
    // la lama
    var lama = "M" + (-9 * k) + " " + (y + 12) + "L" + (9 * k) + " " + (y + 12) + "L" + (15 * k) + " " + (y + len - 14) + "L0 " + (y + len + 4) + "L" + (-15 * k) + " " + (y + len - 14) + "Z";
    s += ombraSotto(K, 4, y + len * 0.55, 20 * k, len * 0.55, 0.22);
    s += K.Pa(lama, K.LG("xa_cra", 0, 0, 1, 0, [[0, K.chiaro(col, 0.22)], [0.5, col], [1, K.scuro(col, 0.35)]]), bordo(K, col, 1.4));
    var cp = K.clip(lama), dn = "";
    for (var i = 0; i < 6; i++) dn += K.St("M" + (-24 * k) + " " + (y + 28 + i * 17) + "L" + (24 * k) + " " + (y + 16 + i * 17), K.chiaro(col, 0.6), 4.2, 0.55);
    dn += K.St("M" + (6 * k) + " " + (y + 12) + "L" + (11 * k) + " " + (y + len - 12), K.scuro(col, 0.5), 5, 0.22);
    dn += K.St("M" + (-5 * k) + " " + (y + 14) + "L" + (-8 * k) + " " + (y + len - 22), K.chiaro(col, 0.7), 2.4, 0.3);
    s += "<g clip-path='" + cp + "'>" + dn + "</g>";
    // il nodo
    var nodo = "M" + (-12 * k) + " " + (y - 8) + "Q0 " + (y - 12) + " " + (12 * k) + " " + (y - 8) + "L" + (15 * k) + " " + (y + 8) + "Q" + (8 * k) + " " + (y + 16) + " 0 " + (y + 15) + "Q" + (-8 * k) + " " + (y + 16) + " " + (-15 * k) + " " + (y + 8) + "Z";
    s += ombraSotto(K, 0, y + 15, 16 * k, 4, 0.3);
    s += K.Pa(nodo, K.LG("xa_crn", 0, 0, 1, 0, [[0, K.chiaro(col, 0.18)], [0.5, cs], [1, K.scuro(col, 0.38)]]), bordo(K, col, 1.4));
    s += K.St("M" + (-8 * k) + " " + (y - 4) + "Q0 " + (y + 6) + " " + (8 * k) + " " + (y - 4), K.scuro(col, 0.5), 2, 0.4) + K.St("M" + (-9 * k) + " " + (y - 5) + "L" + (-11 * k) + " " + (y + 6), K.chiaro(col, 0.65), 2.4, 0.4);
    return { sopra: cen(K, s) };
  });

  // ---------- bandana (fazzoletto a punta) ----------
  A.pezzo("collo", "bandana", function (K) {
    var N = K.B.nk, col = K.collo, hw = N + 9, y0 = 238, sag = 8, s = "";
    var tri = "M" + (-hw - 4) + " " + (y0 + 12) + "Q0 " + (y0 + 2 * sag + 20) + " " + (hw + 4) + " " + (y0 + 12) + "L" + (hw - 4) + " " + (y0 + 34) + "Q" + (hw * 0.45) + " " + (y0 + 60) + " 2 " + (y0 + 96) + "Q-2 " + (y0 + 100) + " -6 " + (y0 + 94) + "Q" + (-hw * 0.5) + " " + (y0 + 60) + " " + (-hw + 4) + " " + (y0 + 34) + "Z";
    s += ombraSotto(K, 2, y0 + 56, hw, 44, 0.28);
    s += K.Pa(tri, K.LG("xa_ba", 0, 0, 1, 1, [[0, K.chiaro(col, 0.25)], [0.5, col], [1, K.scuro(col, 0.32)]]), bordo(K, col, 1.5));
    var cp = K.clip(tri), dn = "", pts = [[-22, 70], [0, 62], [20, 74], [-8, 88], [-30, 56], [28, 54], [0, 86 + 10]];
    // disegno cachemire a puntini bianchi
    pts.forEach(function (p) { dn += K.El(p[0] * 0.8, y0 + p[1] - 14, 3.6, 3.6, "#ffffff", " opacity='.85'"); });
    [[-hw + 6, y0 + 20], [-hw * 0.5, y0 + 30], [0, y0 + 36], [hw * 0.5, y0 + 30], [hw - 6, y0 + 20]].forEach(function (p) { dn += K.El(p[0], p[1], 2.8, 2.8, "#ffffff", " opacity='.8'"); });
    dn += K.St("M" + (-hw + 5) + " " + (y0 + 36) + "Q" + (-hw * 0.45) + " " + (y0 + 62) + " -4 " + (y0 + 90), "#ffffff", 1.6, 0.55, " stroke-dasharray='3 3'");
    dn += K.St("M" + (hw - 5) + " " + (y0 + 36) + "Q" + (hw * 0.45) + " " + (y0 + 62) + " 4 " + (y0 + 90), "#ffffff", 1.6, 0.4, " stroke-dasharray='3 3'");
    dn += K.El(hw * 0.5, y0 + 56, hw * 0.7, 40, K.soft("#000", 0.2)) + K.El(-hw * 0.5, y0 + 40, hw * 0.4, 20, K.soft("#fff", 0.16)) + ombraMento(K, hw, y0 + sag - 2);
    s += "<g clip-path='" + cp + "'>" + dn + "</g>";
    // il giro attorno al collo (stessa stoffa)
    var an = anello(K, "xa_ba2", col, hw, y0 - 2, sag, 15, { sp: 5 });
    s += an.svg;
    s += K.El(-6, y0 + 8, 8, 4, K.soft("#fff", 0.25));
    return { sopra: cen(K, s) };
  });

  // ---------- girocollo (nastro nero col ciondolino) ----------
  A.pezzo("collo", "girocollo", function (K) {
    var N = K.B.nk, hw = N + 1.5, y0 = 221, sag = 5, t = 16, col = "#1d1d25", s = "";
    var d = "M" + (-hw) + " " + y0 + "Q0 " + (y0 + 2 * sag) + " " + hw + " " + y0 + "L" + (hw + 2) + " " + (y0 + t) + "Q0 " + (y0 + t + 2 * sag + 1) + " " + (-hw - 2) + " " + (y0 + t) + "Z";
    s += K.St("M" + (-hw) + " " + (y0 + t * 0.6) + "Q0 " + (y0 + t * 0.6 + 2 * sag) + " " + hw + " " + (y0 + t * 0.6), "#000", t, 0.14, " transform='translate(1 3)'");
    s += K.Pa(d, K.LG("xa_gi", 0, 0, 1, 0, [[0, "#5a5a6c"], [0.45, col], [1, "#0b0b10"]]), " stroke='#05050a' stroke-width='1' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(d) + "'>" + K.St("M" + (-hw) + " " + (y0 + 4) + "Q0 " + (y0 + 2 * sag + 4) + " " + hw + " " + (y0 + 4), "#ffffff", 2.6, 0.5) + K.El(0, y0 + sag - 3, hw, 7, K.soft("#000", 0.35)) + "</g>";
    var yy = y0 + sag + t + 4;
    var gem = "M0 " + (yy - 2) + "L7.5 " + (yy + 8) + "L0 " + (yy + 20) + "L-7.5 " + (yy + 8) + "Z";
    s += K.St("M0 " + (y0 + sag * 2 + t - 3) + "L0 " + yy, "#8a5709", 3.2) + K.St("M0 " + (y0 + sag * 2 + t - 3) + "L0 " + yy, "#f6c744", 1.8);
    s += "<g transform='translate(0 " + (yy + 8) + ") scale(1.55) translate(0 " + (-(yy + 8)) + ")'>";
    s += ombraSotto(K, 1, yy + 20, 9, 3, 0.3);
    s += K.Pa(gem, K.LG("xa_gig", 0, 0, 1, 1, ORO), " stroke='#7a4a06' stroke-width='1' stroke-linejoin='round'");
    s += K.Pa("M0 " + (yy - 2) + "L-7.5 " + (yy + 8) + "L0 " + (yy + 8) + "Z", "#ffffff", " opacity='.45'");
    s += "</g>";
    return { sopra: cen(K, s) };
  });

  // ---------- foulard (annodato di lato) ----------
  A.pezzo("collo", "foulard", function (K) {
    var N = K.B.nk, col = K.collo, hw = N + 9, y0 = 235, sag = 7, s = "";
    var kx = 17, ky = y0 + sag * 2 + 3;
    var p1 = "M" + kx + " " + ky + "C" + (kx + 5) + " " + (ky + 14) + " " + (kx + 21) + " " + (ky + 29) + " " + (kx + 36) + " " + (ky + 34) + "C" + (kx + 33) + " " + (ky + 20) + " " + (kx + 22) + " " + (ky + 6) + " " + kx + " " + ky + "Z";
    var p2 = "M" + kx + " " + ky + "C" + (kx - 8) + " " + (ky + 18) + " " + (kx - 6) + " " + (ky + 36) + " " + (kx + 2) + " " + (ky + 52) + "C" + (kx + 15) + " " + (ky + 38) + " " + (kx + 15) + " " + (ky + 14) + " " + kx + " " + ky + "Z";
    s += "<g transform='translate(" + kx + " " + ky + ") scale(1.3) translate(" + (-kx) + " " + (-ky) + ")'>";
    s += ombraSotto(K, kx + 10, ky + 26, 24, 26, 0.26);
    [[p2, K.scuro(col, 0.1), "xa_fo2"], [p1, col, "xa_fo1"]].forEach(function (q, qi) {
      s += K.Pa(q[0], stoffa(K, q[2], q[1]), bordo(K, col, 1.2));
      var dn = K.St("M" + kx + " " + ky + "L" + (kx + 16 + qi * 8) + " " + (ky + 40), K.scuro(col, 0.5), 3, 0.28) + K.St("M" + (kx + 2) + " " + (ky + 6) + "L" + (kx + 8 + qi * 10) + " " + (ky + 30), K.chiaro(col, 0.5), 1.8, 0.4);
      for (var j = 0; j < 6; j++) dn += K.El(kx + 4 + (j % 3) * 8 + qi * 6, ky + 12 + j * 6.5, 2.1, 2.1, "#ffffff", " opacity='.8'");
      s += "<g clip-path='" + K.clip(q[0]) + "'>" + dn + "</g>";
    });
    s += "</g>";
    var an = anello(K, "xa_fo0", col, hw, y0, sag, 23, { sp: 6 });
    s += an.svg;
    for (var i = -4; i <= 4; i++) { var pp = qp([-hw, y0 + 11], [0, y0 + 11 + 2 * sag], [hw, y0 + 11], (i + 4.5) / 9); s += K.El(pp[0], pp[1], 2.5, 2.5, "#ffffff", " opacity='.85'"); }
    s += K.El(kx + 1, ky + 1, 13, 11, K.soft("#000", 0.25));
    s += K.El(kx, ky, 12, 10.5, stoffa(K, "xa_fon", K.scuro(col, 0.08)), bordo(K, col, 1.3));
    s += K.St("M" + (kx - 7) + " " + (ky - 3) + "Q" + kx + " " + (ky + 4) + " " + (kx + 7) + " " + (ky - 4), K.scuro(col, 0.5), 2, 0.5);
    s += K.St("M" + (kx - 6) + " " + (ky - 5) + "Q" + kx + " " + (ky - 1) + " " + (kx + 6) + " " + (ky - 6), K.chiaro(col, 0.6), 1.8, 0.6);
    s += K.El(kx - 4, ky - 3, 3.6, 2.2, "#fff", " opacity='.35'");
    return { sopra: cen(K, s) };
  });

  // ---------- nastro a V (medaglia, fischietto) ----------
  function nastro(K, col, id, yFine, largo) {
    var N = K.B.nk, w = largo || 15, s = "";
    function striscia(l) {
      var x0 = l * (N + 2), x1 = l * 7;
      var d = "M" + (x0 - l * w * 0.5) + " 236L" + (x0 + l * w * 0.55) + " 236L" + (x1 + l * w * 0.5) + " " + yFine + "L" + (x1 - l * w * 0.5) + " " + yFine + "Z";
      return d;
    }
    [-1, 1].forEach(function (l) {
      var d = striscia(l);
      s += K.St("M" + (l * (N + 2)) + " 240L" + (l * 6) + " " + (yFine - 4), "#000", w * 0.9, 0.14, " transform='translate(1 3)'");
      s += K.Pa(d, K.LG(id + (l > 0 ? "d" : "s"), 0, 0, 1, 0, [[0, l > 0 ? K.scuro(col, 0.12) : K.chiaro(col, 0.22)], [1, l > 0 ? K.scuro(col, 0.35) : col]]), bordo(K, col, 1.3));
      s += "<g clip-path='" + K.clip(d) + "'>" + K.St("M" + (l * (N + 2)) + " 236L" + (l * 7) + " " + yFine, "#ffffff", 2.2, 0.4) + K.St("M" + (l * (N + 2) - l * 3) + " 236L" + (l * 7 - l * 3) + " " + yFine, K.scuro(col, 0.45), 2, 0.18) + "</g>";
    });
    return s;
  }

  // ---------- medaglia ----------
  A.pezzo("collo", "medaglia", function (K) {
    var col = K.collo, s = ombraMento(K, K.B.nk, 243), y = 322;
    s += nastro(K, col, "xa_me", y - 24, 22);
    s += "<g transform='translate(0 " + y + ") scale(1.28) translate(0 " + (-y) + ")'>";
    s += ombraSotto(K, 2, y + 20, 26, 6, 0.34);
    s += K.El(0, y, 23, 23, K.LG("xa_mem", 0, 0, 1, 1, ORO), " stroke='#7a4a06' stroke-width='1.4'");
    s += K.El(0, y, 17, 17, "none", " stroke='#fff6c9' stroke-width='1.8' opacity='.8'");
    s += K.El(0, y, 17, 17, K.RG("xa_mei", [[0, "#ffe27a"], [1, "#d29a24"]], "cx='.5' cy='.5' r='.6'"), " opacity='.8'");
    var st = [];
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 4.6 : 11; st.push([r * Math.cos(a), y + 1 + r * Math.sin(a)]); }
    s += K.Pa("M" + st.map(function (q) { return K.n1(q[0]) + " " + K.n1(q[1]); }).join("L") + "Z", "#fff6c9", " stroke='#9a6512' stroke-width='1.1' stroke-linejoin='round'");
    s += K.El(-9, y - 10, 6, 3, "#ffffff", " opacity='.6' transform='rotate(-40 -9 " + (y - 10) + ")'");
    s += K.El(0, y - 23, 5, 4, K.LG("xa_mea", 0, 0, 1, 1, ORO), " stroke='#7a4a06' stroke-width='1'");
    s += "</g>";
    return { sopra: cen(K, s) };
  });

  // ---------- catena d'oro grossa ----------
  A.pezzo("collo", "catena", function (K) {
    var N = K.B.nk, c = curva(N + 5, 236, 38), s = ombraMento(K, N, 242), n = 9;
    s += K.St(dCurva(c), "#000", 13, 0.16, " transform='translate(1 5)'");
    var g = K.LG("xa_ca", 0, 0, 1, 1, ORO);
    for (var i = 0; i < n; i++) {
      var t = (i + 0.5) / n, p = qp(c[0], c[1], c[2], t), dd = qd(c[0], c[1], c[2], t), ang = Math.atan2(dd[1], dd[0]) * 180 / Math.PI, gr = i % 2;
      var tr = " transform='rotate(" + K.n1(ang) + " " + K.n1(p[0]) + " " + K.n1(p[1]) + ")'";
      s += K.El(p[0], p[1], gr ? 4.4 : 8.4, gr ? 3.2 : 5.2, "none", " stroke='#7a4a06' stroke-width='6.2'" + tr);
      s += K.El(p[0], p[1], gr ? 4.4 : 8.4, gr ? 3.2 : 5.2, "none", " stroke='" + g + "' stroke-width='4'" + tr);
      s += K.El(p[0] - 1, p[1] - 1.8, gr ? 2 : 4, 0.9, "#fff6c9", " opacity='.85'" + tr);
    }
    var y = 236 + 38 + 22;
    s += ombraSotto(K, 2, y + 20, 24, 6, 0.36);
    s += K.El(0, y, 20, 20, K.LG("xa_cam", 0, 0, 1, 1, ORO), " stroke='#7a4a06' stroke-width='1.5'");
    s += K.El(0, y, 13, 13, "none", " stroke='#fff6c9' stroke-width='2' opacity='.7'");
    s += K.El(-7, y - 7, 5.4, 3, "#ffffff", " opacity='.85' transform='rotate(-40 -7 " + (y - 7) + ")'");
    s += K.El(0, y - 20, 4.6, 4.6, "none", " stroke='#7a4a06' stroke-width='3.2'");
    return { sopra: cen(K, s) };
  });

  // ---------- lei (collana di fiori hawaiani) ----------
  A.pezzo("collo", "lei", function (K) {
    var N = K.B.nk, c = curva(N + 14, 234, 64), s = ombraMento(K, N, 242), n = 8;
    var pet = ["#ff7fa3", "#ffd43b", "#fff7ee", "#ff922b", "#d58bf0", "#ff922b", "#fff7ee", "#ffd43b"];
    s += K.St(dCurva(c), "#000", 20, 0.14, " transform='translate(1 5)'");
    s += K.St(dCurva(c), "#1f6b29", 7);
    var verde = K.LG("xa_le", 0, 0, 1, 1, [[0, "#7fdc6f"], [0.6, "#3a9a3a"], [1, "#1f6b29"]]);
    var i, t, p, j;
    for (i = 0; i < n + 1; i++) {
      t = i / n; p = qp(c[0], c[1], c[2], t);
      var o = i % 2 ? 1 : -1;
      s += K.Pa("M" + K.n1(p[0]) + " " + K.n1(p[1]) + "Q" + K.n1(p[0] + o * 10) + " " + K.n1(p[1] + 12) + " " + K.n1(p[0] + o * 22) + " " + K.n1(p[1] + 12) + "Q" + K.n1(p[0] + o * 14) + " " + K.n1(p[1] - 2) + " " + K.n1(p[0]) + " " + K.n1(p[1]) + "Z", verde, " stroke='#1f6b29' stroke-width='.8'");
    }
    for (i = 0; i < n; i++) {
      t = (i + 0.5) / n; p = qp(c[0], c[1], c[2], t);
      var r = 13 - 2 * Math.abs(t - 0.5) * 2, col = pet[i], id = "xa_lp" + i;
      var rg = K.RG(id, [[0, K.chiaro(col, 0.4)], [0.55, col], [1, K.scuro(col, 0.3)]], "cx='.4' cy='.35' r='.8'");
      s += K.El(p[0] + 1, p[1] + r * 0.8, r * 1.1, r * 0.5, K.soft("#000", 0.26));
      for (j = 0; j < 5; j++) {
        var a = j * 72 + i * 21, ar = a * Math.PI / 180;
        s += K.ElR(p[0] + r * 0.5 * Math.cos(ar), p[1] + r * 0.5 * Math.sin(ar), r * 0.52, r * 0.4, a, rg);
      }
      s += K.El(p[0] - r * 0.28, p[1] - r * 0.32, r * 0.34, r * 0.2, "#ffffff", " opacity='.28'");
      s += K.El(p[0], p[1], r * 0.26, r * 0.26, K.RG("xa_lc" + i, [[0, "#ffd166"], [1, "#d9480f"]], "cx='.4' cy='.35' r='.8'"));
    }
    return { sopra: cen(K, s) };
  });

  // ---------- fischietto ----------
  A.pezzo("collo", "fischietto", function (K) {
    var col = K.collo, y = 296, s = ombraMento(K, K.B.nk, 243);
    s += nastro(K, col, "xa_fi", y - 4, 13);
    s += ombraSotto(K, 8, y + 44, 44, 8, 0.34);
    var cx = -6, cy = y + 24;
    s += K.El(cx, y + 2, 7.5, 9, "none", " stroke='#5f6874' stroke-width='4'") + K.El(cx, y + 2, 7.5, 9, "none", " stroke='#eef2f7' stroke-width='1.8'");
    var bo = "M" + cx + " " + (cy - 10) + "H34L50 " + (cy + 6) + "V" + (cy + 11) + "H" + cx + "Z";
    s += K.Pa(bo, K.LG("xa_fic", 0, 0, 0, 1, ARGENTO), " stroke='#5f6874' stroke-width='1.6' stroke-linejoin='round'");
    s += K.Pa("M14 " + (cy - 10) + "H30L35 " + (cy - 4) + "H14Z", "#3d4450");
    s += K.St("M" + (cx + 4) + " " + (cy - 7) + "H28", "#ffffff", 2.4, 0.7);
    s += K.El(cx, cy, 19, 19, K.RG("xa_fit", [[0, "#ffffff"], [0.5, "#d9dfe8"], [1, "#7e8794"]], "cx='.35' cy='.3' r='.85'"), " stroke='#5f6874' stroke-width='1.6'");
    s += K.El(cx, cy + 2, 6.5, 6.5, "#3d4450") + K.El(cx - 1.6, cy + 0.5, 2.6, 1.8, "#8e97a5");
    s += K.El(cx - 8, cy - 8, 5, 3, "#ffffff", " opacity='.8' transform='rotate(-40 " + (cx - 8) + " " + (cy - 8) + ")'");
    return { sopra: cen(K, s) };
  });

  // ---------- cuffie appoggiate al collo ----------
  A.pezzo("collo", "cuffiecollo", function (K) {
    var N = K.B.nk, col = K.collo, band = "#4a4a58", dx = (K.B.shx - 60) * 0.22, cyy = 276;
    function arco(l) { var cx = l * (N + 22 + dx), cy = cyy; return "M" + (l * (N + 1)) + " 238C" + (l * (N + 9)) + " 240 " + (l * (N + 16)) + " 246 " + (cx - l * 2) + " " + (cy - 15); }
    function fascia(d) { return K.St(d, "#000", 15, 0.2, " transform='translate(1 3)'") + K.St(d, "#0c0c11", 13.5) + K.St(d, band, 10.6) + K.St(d, "#8d8da0", 3.2, 0.5, " transform='translate(-1.6 -1.6)'"); }
    function nuca() { return fascia("M" + (-N - 1) + " 240Q0 252 " + (N + 1) + " 240"); }
    function cuffie(back) {
      var s = "";
      [-1, 1].forEach(function (l) {
        var cx = l * (N + 22 + dx), cy = cyy, id = l > 0 ? "d" : "s";
        var tr = " transform='rotate(" + (l * 12) + " " + cx + " " + cy + ")'";
        var d = "M" + (cx - 13) + " " + (cy - 4) + "Q" + (cx - 13) + " " + (cy - 19) + " " + cx + " " + (cy - 19) + "Q" + (cx + 13) + " " + (cy - 19) + " " + (cx + 13) + " " + (cy - 4) + "V" + (cy + 10) + "Q" + (cx + 13) + " " + (cy + 20) + " " + cx + " " + (cy + 20) + "Q" + (cx - 13) + " " + (cy + 20) + " " + (cx - 13) + " " + (cy + 10) + "Z";
        s += ombraSotto(K, cx + 2, cy + 20, 18, 5, 0.38);
        s += K.Pa(d, K.LG("xa_cu" + id, 0, 0, 1, 0, [[0, K.chiaro(col, 0.28)], [0.45, col], [1, K.scuro(col, 0.38)]]), bordo(K, col, 1.4) + tr);
        if (!back) s += K.Pa("M" + (cx - 8) + " " + (cy - 5) + "Q" + (cx - 8) + " " + (cy - 11) + " " + cx + " " + (cy - 11) + "Q" + (cx + 8) + " " + (cy - 11) + " " + (cx + 8) + " " + (cy - 5) + "V" + (cy + 9) + "Q" + (cx + 8) + " " + (cy + 14) + " " + cx + " " + (cy + 14) + "Q" + (cx - 8) + " " + (cy + 14) + " " + (cx - 8) + " " + (cy + 9) + "Z", K.scuro(col, 0.5), " opacity='.5'" + tr);
        s += K.El(cx - 5, cy - 6, 2.8, 8, "#ffffff", " opacity='.38'" + tr);
      });
      return s;
    }
    var fronte = fascia(arco(-1)) + fascia(arco(1)) + cuffie(false);
    var spalle = nuca() + fascia(arco(-1)) + fascia(arco(1)) + cuffie(true);
    return { dietro: cen(K, nuca()), sopra: cen(K, fronte), spalle: cen(K, spalle) };
  });

  // ====== BORSE ======
  function fibbia(K, x, y) { return K.El(x, y, 4.2, 4.2, K.LG("xa_fib" + (x < 0 ? "s" : "d"), 0, 0, 1, 1, ORO), " stroke='#7a4a06' stroke-width='.8'") + K.El(x - 1.2, y - 1.3, 1.3, 0.8, "#fff", " opacity='.8'"); }

  // ---------- a tracolla ----------
  A.pezzo("borsa", "tracolla", function (K) {
    var B = K.B, col = colBorsa(K), N = B.nk, sc = K.scuro(col, 0.3);
    var hx = B.hp + 4, by = 524, w = 56, h = 58;
    // la borsa sul fianco (dietro al braccio, sotto l'orlo del vestito)
    var corpo = "M" + (hx - w / 2) + " " + (by - 4) + "H" + (hx + w / 2) + "L" + (hx + w / 2 + 3) + " " + (by + h - 6) + "Q" + (hx + w / 2 + 3) + " " + (by + h) + " " + (hx + w / 2 - 4) + " " + (by + h) + "H" + (hx - w / 2 + 4) + "Q" + (hx - w / 2 - 3) + " " + (by + h) + " " + (hx - w / 2 - 3) + " " + (by + h - 6) + "Z";
    var sotto = ombraSotto(K, hx + 3, by + h + 2, w * 0.62, 7, 0.32);
    sotto += K.Pa(corpo, K.LG("xa_bt", 0, 0, 1, 1, [[0, K.chiaro(col, 0.28)], [0.45, col], [1, K.scuro(col, 0.34)]]), bordo(K, col, 1.6));
    var cp = K.clip(corpo), dn = "";
    var patta = "M" + (hx - w / 2 - 3) + " " + (by - 4) + "H" + (hx + w / 2 + 3) + "V" + (by + 20) + "Q" + hx + " " + (by + 33) + " " + (hx - w / 2 - 3) + " " + (by + 20) + "Z";
    dn += K.Pa(patta, K.LG("xa_btp", 0, 0, 1, 1, [[0, K.chiaro(col, 0.35)], [0.5, K.chiaro(col, 0.05)], [1, K.scuro(col, 0.22)]]), " stroke='" + sc + "' stroke-width='1.3'");
    dn += K.St("M" + (hx - w / 2 + 2) + " " + (by + 15) + "Q" + hx + " " + (by + 27) + " " + (hx + w / 2 - 2) + " " + (by + 15), "#fff", 1.6, 0.18, " stroke-dasharray='3 2.4'");
    dn += K.El(hx, by + 28, w / 2, 7, K.soft("#000", 0.3)) + K.El(hx - w * 0.28, by + 40, 7, 14, K.soft("#fff", 0.2)) + K.El(hx + w * 0.4, by + 34, 12, 26, K.soft("#000", 0.22));
    sotto += "<g clip-path='" + cp + "'>" + dn + "</g>";
    sotto += K.El(hx, by + 26, 5.6, 5.6, K.LG("xa_btf", 0, 0, 1, 1, ORO), " stroke='#7a4a06' stroke-width='1'") + K.El(hx - 1.5, by + 24.4, 1.8, 1.1, "#fff", " opacity='.85'");
    // la tracolla sul petto: dalla spalla sinistra (nel disegno) al fianco destro
    var x0 = -N - 22, y0 = 250, x1 = hx - 8, y1 = by - 2;
    var nastro2 = K.limb ? null : null;
    var d = "M" + (x0 - 6) + " " + (y0 - 4) + "L" + (x0 + 8) + " " + (y0 - 2) + "Q" + (x0 + (x1 - x0) * 0.5 + 8) + " " + (y0 + (y1 - y0) * 0.45) + " " + (x1 + 4) + " " + y1 + "L" + (x1 - 9) + " " + (y1 + 3) + "Q" + (x0 + (x1 - x0) * 0.5 - 6) + " " + (y0 + (y1 - y0) * 0.55) + " " + (x0 - 6) + " " + (y0 - 4) + "Z";
    var sopra = "<g transform='translate(0 0)'>" + K.St("M" + (x0 + 1) + " " + (y0 + 1) + "Q" + (x0 + (x1 - x0) * 0.5 + 1) + " " + (y0 + (y1 - y0) * 0.5 + 3) + " " + (x1 - 2) + " " + (y1 + 3), "#000", 14, 0.14) + "</g>";
    sopra += K.Pa(d, K.LG("xa_bs", 0, 0, 1, 0, [[0, K.chiaro(col, 0.18)], [1, K.scuro(col, 0.25)]]), bordo(K, col, 1.3));
    sopra += K.St("M" + (x0 - 3) + " " + (y0 - 1) + "Q" + (x0 + (x1 - x0) * 0.5 + 2) + " " + (y0 + (y1 - y0) * 0.5) + " " + (x1 - 2) + " " + (y1), K.chiaro(col, 0.55), 1.5, 0.45);
    sopra += K.St("M" + (x0 + 3) + " " + (y0 + 2) + "Q" + (x0 + (x1 - x0) * 0.5 + 5) + " " + (y0 + (y1 - y0) * 0.5 + 2) + " " + (x1 + 1) + " " + (y1 + 1), K.scuro(col, 0.5), 1.2, 0.3, " stroke-dasharray='4 3'");
    return { sotto: cen(K, sotto), sopra: cen(K, sopra) };
  });

  // ---------- borsetta (appesa alla mano sinistra nel disegno) ----------
  A.pezzo("borsa", "borsetta", function (K) {
    var col = colBorsa(K), W = K.BR[-1].W, x = W[0] - K.C, y = W[1] + 20, w = 58, h = 44, s = "";
    var top = W[1] + 72;
    // i manici: un anello che passa sulla mano
    var man = "M" + (x - 17) + " " + (top + 3) + "C" + (x - 17) + " " + (y - 2) + " " + (x + 17) + " " + (y - 2) + " " + (x + 17) + " " + (top + 3);
    s += K.St(man, "#000", 6, 0.14, " transform='translate(1 3)'");
    s += K.St(man, K.scuro(col, 0.45), 5) + K.St(man, K.chiaro(col, 0.1), 3.2) + K.St(man, K.chiaro(col, 0.6), 1, 0.5, " transform='translate(-.8 -.8)'");
    var d = "M" + (x - w / 2) + " " + top + "Q" + x + " " + (top - 4) + " " + (x + w / 2) + " " + top + "L" + (x + w / 2 + 5) + " " + (top + h - 8) + "Q" + (x + w / 2 + 5) + " " + (top + h) + " " + (x + w / 2 - 3) + " " + (top + h) + "H" + (x - w / 2 + 3) + "Q" + (x - w / 2 - 5) + " " + (top + h) + " " + (x - w / 2 - 5) + " " + (top + h - 8) + "Z";
    s += ombraSotto(K, x + 3, top + h + 2, w * 0.6, 6, 0.3);
    s += K.Pa(d, K.LG("xa_bo", 0, 0, 1, 1, [[0, K.chiaro(col, 0.3)], [0.45, col], [1, K.scuro(col, 0.36)]]), bordo(K, col, 1.6));
    var dn = "";
    dn += K.Pa("M" + (x - w / 2 - 6) + " " + (top - 1) + "Q" + x + " " + (top - 5) + " " + (x + w / 2 + 6) + " " + (top - 1) + "V" + (top + 14) + "Q" + x + " " + (top + 22) + " " + (x - w / 2 - 6) + " " + (top + 14) + "Z", K.LG("xa_bop", 0, 0, 1, 1, [[0, K.chiaro(col, 0.38)], [0.5, K.chiaro(col, 0.06)], [1, K.scuro(col, 0.2)]]), " stroke='" + K.scuro(col, 0.35) + "' stroke-width='1.2'");
    dn += K.El(x, top + 22, w / 2, 5, K.soft("#000", 0.3)) + K.El(x + w * 0.42, top + 26, 10, 22, K.soft("#000", 0.24)) + K.El(x - w * 0.32, top + 28, 6, 12, K.soft("#fff", 0.22));
    s += "<g clip-path='" + K.clip(d) + "'>" + dn + "</g>";
    s += K.St("M" + (x - w / 2 + 4) + " " + (top + 12) + "Q" + x + " " + (top + 18) + " " + (x + w / 2 - 4) + " " + (top + 12), "#fff", 1.4, 0.2, " stroke-dasharray='3 2.4'");
    s += K.El(x, top + 18, 5.4, 5.4, K.LG("xa_bof", 0, 0, 1, 1, ORO), " stroke='#7a4a06' stroke-width='1'") + K.El(x - 1.5, top + 16.5, 1.7, 1, "#fff", " opacity='.85'");
    return { sotto: cen(K, s) };
  });

  // ====== PITTURA SUL VISO (coordinate della testa) ======
  // vernice: un po' trasparente, senza contorni, con un velo di pelle sopra (si vede che è dipinta sul viso)
  function pelleChiara(K) { return K.lum(K.pelle) > 0.42; }
  function cuoricino(K, x, y, s, rot, id) {
    var d = "M0 " + (11 * s) + "C" + (-14 * s) + " " + (2 * s) + " " + (-11 * s) + " " + (-8 * s) + " " + (-5 * s) + " " + (-8 * s) + "C" + (-2 * s) + " " + (-8 * s) + " 0 " + (-6 * s) + " 0 " + (-3.5 * s) + "C0 " + (-6 * s) + " " + (2 * s) + " " + (-8 * s) + " " + (5 * s) + " " + (-8 * s) + "C" + (11 * s) + " " + (-8 * s) + " " + (14 * s) + " " + (2 * s) + " 0 " + (11 * s) + "Z";
    return "<g transform='translate(" + x + " " + y + ") rotate(" + rot + ") scale(.86 1)'>" + K.El(0, 1, 15 * s, 13 * s, K.soft("#ff3b74", 0.25)) +
      K.Pa(d, K.RG(id, [[0, "#ff7a9f"], [0.6, "#f0306c"], [1, "#c2185b"]], "cx='.35' cy='.3' r='.9'"), " opacity='.84'") +
      K.El(-4 * s, -3.5 * s, 2.6 * s, 1.4 * s, "#fff", " opacity='.3' transform='rotate(-30 " + (-4 * s) + " " + (-3.5 * s) + ")'") + "</g>";
  }
  A.pezzo("pittura", "gatto", function (K) {
    var s = "", chiara = pelleChiara(K), k = chiara ? "#2c1c16" : "#f6f0e6", alone = chiara ? "#ffffff" : "#000000", cw = K.F.cw;
    [-1, 1].forEach(function (l) {
      [0, 1, 2].forEach(function (i) {
        var x0 = l * 20, y0 = -42 + (i - 1) * 4, x1 = l * (cw + 2), y1 = -47 + (i - 1) * 12;
        var d = "M" + x0 + " " + y0 + "Q" + (l * (cw - 14)) + " " + K.n1((y0 + y1) / 2 - 2) + " " + x1 + " " + y1;
        s += K.St(d, alone, 6.4, 0.2) + K.St(d, k, 4, 0.9);
      });
    });
    return s;
  });
  A.pezzo("pittura", "clown", function (K) {
    // il naso rosso va sopra il naso vero: lo disegna extra.dopo (più sotto); sulle guance, due ombre rosa da trucco
    return K.El(-40, -46, 11, 8, K.soft("#ff5a7a", 0.35)) + K.El(40, -46, 11, 8, K.soft("#ff5a7a", 0.35));
  });
  A.pezzo("pittura", "cuori", function (K) {
    return cuoricino(K, -37, -47, 1.0, -12, "xa_pc1") + cuoricino(K, 37, -47, 1.0, 12, "xa_pc2");
  });
  A.pezzo("pittura", "tricolore", function (K) {
    var s = "";
    [-1, 1].forEach(function (l) {
      var cx = l * 37, cy = -49, rot = l * 8, r = "";
      var base = "M-12 -10Q0 -14 12 -10Q15 0 12 10Q0 14 -12 10Q-15 0 -12 -10Z";
      var b1 = "M-16 -16H-4Q-6 0 -4 16H-16Z", b2 = "M-4 -16H4Q6 0 4 16H-4Z", b3 = "M4 -16H16V16H4Q6 0 4 -16Z";
      r += "<g clip-path='" + K.clip(base) + "'>" + K.Pa(b1, "#1f9d4a") + K.Pa(b2, "#f6f6f2") + K.Pa(b3, "#d62a2a") +
        K.El(-4, -6, 9, 5, K.soft("#fff", 0.18)) + K.El(2, 9, 14, 6, K.soft(K.pelle, 0.35)) + "</g>";
      s += "<g transform='translate(" + cx + " " + cy + ") rotate(" + rot + ") scale(" + (l * 0.9) + " 1)' opacity='.86'>" + K.El(0, 0, 17, 15, K.soft("#000", 0.1)) + r + "</g>";
    });
    return s;
  });
  A.pezzo("pittura", "sportivo", function (K) {
    var s = "", chiara = pelleChiara(K), k = chiara ? "#17171d" : "#ffffff", alone = chiara ? "#ffffff" : "#000000";
    [-1, 1].forEach(function (l) {
      [[-58, 15, 42], [-49, 17, 40]].forEach(function (p) {
        var d = "M" + l * p[1] + " " + p[0] + "Q" + l * 30 + " " + (p[0] + 2) + " " + l * p[2] + " " + (p[0] - 1);
        s += K.St(d, alone, 9.4, 0.18) + K.St(d, k, 6.6, 0.92);
      });
    });
    return s;
  });
  A.pezzo("pittura", "fulmine", function (K) {
    var d = "M5 -19L-8 3L-1 3L-6 20L9 -4L2 -4L7 -19Z";
    return "<g transform='translate(" + K.n1(K.F.cw * 0.52) + " -49) rotate(12) scale(.92)'>" + K.El(0, 0, 12, 20, K.soft("#ffd43b", 0.3)) +
      K.Pa(d, K.LG("xa_pf", 0, 0, 0, 1, [[0, "#fff38a"], [0.5, "#ffd43b"], [1, "#f59f00"]]), " stroke='#c2410c' stroke-opacity='.85' stroke-width='1.6' stroke-linejoin='round'") +
      K.St("M4 -15L-4 -1", "#fff", 1.2, 0.4) + "</g>";
  });

  // ---- sopra al naso vero: i nasi dipinti del gatto e del clown (extra.dopo, coordinate della testa) ----
  var prev = A.extra && A.extra.dopo;
  A.extra = A.extra || {};
  A.extra.dopo = function (K) {
    var r = prev ? prev(K) : "";
    var p = K.c && K.c.pittura;
    if (p !== "clown" && p !== "gatto") return r;
    if (K.opts && K.opts.spalle) return r;
    var s;
    if (p === "clown") {
      s = K.El(1.5, -37, 12, 5, K.soft("#000", 0.22)) +
        K.El(0, -43.5, 9.6, 9.6, K.RG("xa_cln", [[0, "#ff7a82"], [0.45, "#e8212f"], [1, "#a1101c"]], "cx='.35' cy='.3' r='.85'"), " stroke='#8f0e18' stroke-width='.9'") +
        K.El(-3, -47, 3.4, 2.2, "#ffffff", " opacity='.8' transform='rotate(-30 -3 -47)'");
    } else {
      s = K.Pa("M-6.5 -47Q0 -49 6.5 -47Q7 -44 0 -38.5Q-7 -44 -6.5 -47Z", K.LG("xa_gnn", 0, 0, 0, 1, [[0, "#ffb3c8"], [1, "#f06a92"]]), " stroke='#c2255c' stroke-width='.9' stroke-linejoin='round' opacity='.95'") +
        K.El(-2, -46, 2, 1, "#fff", " opacity='.7'");
    }
    return r + "<g transform='" + K.HT + "'>" + s + "</g>";
  };

  // VOCI FATTE: collo: sciarpa, collana, perle, papillon, cravatta, bandana, girocollo, ciondolo, foulard, medaglia, catena, lei, fischietto, cuffiecollo;
  // borsa: tracolla, borsetta; pittura: gatto, clown, cuori, tricolore, sportivo, fulmine.
})();


// ---- extra-b ----
(function () {
  var A = window.SGOminoA;
  // ====== EXTRA B: cose in mano, sulla schiena, animaletti (coordinate del mondo 400×1000) ======
  var N = 0, PI = Math.PI;
  function gid() { return "xb" + (N++); }
  function lg(K, st, x1, y1, x2, y2) { return K.LG(gid(), x1 == null ? 0 : x1, y1 == null ? 0 : y1, x2 == null ? 1 : x2, y2 == null ? 0 : y2, st); }
  function rg(K, st, cx, cy, r) { return K.RG(gid(), st, "cx='" + cx + "' cy='" + cy + "' r='" + r + "' fx='" + cx + "' fy='" + cy + "'"); }
  function pal(K, nome) { var v = K.c[nome], L = SGOmino.OPZ[nome]; return typeof v === "string" && v.charAt(0) === "#" ? v : (L[v] || L[0]); }
  // riempimento col volume (luce da sinistra) e bordo scuro sottile
  function vol(K, c) { return lg(K, [[0, K.chiaro(c, 0.42)], [0.38, c], [1, K.scuro(c, 0.36)]]); }
  function corpo(K, d, c, w, x) { return K.Pa(d, vol(K, c), " stroke='" + K.scuro(c, 0.5) + "' stroke-width='" + (w == null ? 2 : w) + "' stroke-linejoin='round'" + (x || "")); }
  function tratto(K, d, c, w, op) { return K.St(d, c, w, op); }
  function n(v) { return Math.round(v * 10) / 10; }
  function op(s, o) { return s.replace(/fill='([^']*)'/, "fill='$1' opacity='" + o + "'"); }
  // ====== COSE IN MANO (terzo tempo, 6 nov 2026): si disegnano nelle coordinate della PRESA (K.presa.qui):
  // (0,0) = centro del pugno, manico lungo y, cima verso y negativi; il pugno va da y -22 a +21, largo circa 33 (x -15..19). ======
  function stella(cx, cy, R, r, rot) { var p = [], i; for (i = 0; i < 10; i++) { var a = (rot == null ? -90 : rot) * PI / 180 + i * PI / 5, q = i % 2 ? r : R; p.push((cx + q * Math.cos(a)).toFixed(1) + " " + (cy + q * Math.sin(a)).toFixed(1)); } return "M" + p.join("L") + "Z"; }
  function ombraEl(K, cx, cy, rx, ry, c, o) { return K.El(cx, cy, rx, ry, K.soft(c, o)); }
  function cerchio(x, y, r) { return "M" + n(x - r) + " " + n(y) + "A" + r + " " + r + " 0 1 0 " + n(x + r) + " " + n(y) + "A" + r + " " + r + " 0 1 0 " + n(x - r) + " " + n(y) + "Z"; }
  // la mano cresce con la corporatura (K.presa.k da 1,1 a 1,7): le cose in mano crescono molto meno, così un palloncino o un trofeo sono grandi uguali su tutti
  // MISURE VERE (terzo tempo, giro 4, 6 nov 2026): l'avatar intero (cima della testa alle suole) = 170 cm = 927 unità del mondo, quindi 1 cm = 5,45.
  // Ogni cosa dichiara E = unità del mondo per ogni unità del suo disegno: E fisso, uguale su tutte le corporature (la mano cresce con K.presa.k, la cosa no).
  // In dammi lo scala di sc = E / k (la presa poi riscala di k): così la misura vera della cosa è E, qualunque sia la mano.
  // «f» = k / E: quanto è grande la presa nelle unità del disegno (il pugno va da x -15f a 19f e da y -22f a 21f).
  function pres(K, E) { var k = K.presa.k || 1.2; return { k: k, f: k / E, E: E }; }
  function mis(lab, x, y, w, h) { return window.__MIS ? "<rect class='mis' data-l='" + lab + "' x='" + x + "' y='" + y + "' width='" + w + "' height='" + h + "' fill='none' stroke='none'/>" : ""; }
  function dammi(K, dietro, davanti, E) {
    var P = K.presa, k = P.k || 1.2, sc = E / k / PS().S, o = "<g class='ogg-misura' data-e='" + E + "' data-k='" + k.toFixed(3) + "' transform='scale(" + sc.toFixed(3) + ")'>";
    return { dietro: P.qui ? P.qui(o + dietro + "</g>") : "", davanti: davanti && P.qui ? P.qui(o + davanti + "</g>") : "" };
  }
  // la figura intera è ingrandita di S (proporzioni) intorno ai piedi: anche le cose in mano ne sono ingrandite, quindi E si divide per S
  function PS() { var p = A.PROPORZIONI && A.PROPORZIONI[A.PROPORZIONE]; return p ? p : { S: 1, alto: 72 }; }
  var ALTO_TESTA = function () { var p = PS(); return 999 - (999 - p.alto) / p.S; };   // dove sta la cima della testa PRIMA dell'ingrandimento

  // ---------- palloncino: galleggia. Braccio giù lungo il fianco, il filo teso sale dal pugno, il palloncino (30 cm) sta in alto accanto alla testa ----------
  A.impugna.palloncino = { inclina: 9, posa: "fianco" };
  A.pezzo("inmano", "palloncino", function (K) {
    var E = 2.65, C = pal(K, "colMano"), s = "", P = K.presa, inc = 9 * PI / 180;
    // quanto è lungo il filo: il palloncino arriva con la cima all'altezza della cima della testa (misurato dal pugno, lungo il filo inclinato)
    var dist = Math.max(120, (P.y - (ALTO_TESTA() - 6)) / Math.cos(inc)), yb = Math.round(-dist / (E / PS().S) + 80);
    var filo = "M0.4 14C-3 " + n(yb * 0.3) + " 3 " + n(yb * 0.62) + " 0 " + (yb + 8);
    s += tratto(K, filo, "#4a5060", 1.9, 0.55) + tratto(K, filo, "#eef1f6", 1.1);
    s += "<g transform='translate(0 " + yb + ")'>";
    var b = "M0 0C-8 -5 -33 -20 -35 -46C-37 -68 -21 -80 0 -80C21 -80 37 -68 35 -46C33 -20 8 -5 0 0Z";
    s += K.Pa("M0 -1L6 8L-6 8Z", K.scuro(C, 0.15), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='1' stroke-linejoin='round'");
    s += K.Pa(b, rg(K, [[0, K.chiaro(C, 0.55)], [0.4, K.chiaro(C, 0.08)], [0.8, C], [1, K.scuro(C, 0.38)]], 0.36, 0.3, 0.85), " stroke='" + K.scuro(C, 0.45) + "' stroke-width='1.1' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(b) + "'>" + ombraEl(K, 17, -26, 28, 50, K.scuro(C, 0.5), 0.35) + "</g>";
    s += op(K.ElR(-14, -56, 6, 12, 28, "#ffffff"), 0.6) + op(K.El(-7, -72, 2.4, 2.4, "#ffffff"), 0.55);
    s += mis("corpo", -35, -80, 70, 80) + mis("alto", -35, -80, 70, 88) + "</g>";
    return dammi(K, s, null, E);
  });

  // ---------- gelato: il cono stretto nel pugno, due palline sopra il pollice ----------
  A.impugna.gelato = { inclina: 6, posa: "davanti" };
  A.pezzo("inmano", "gelato", function (K) {
    var C = pal(K, "colMano"), s = "", CH = "#7a4a2a", i;
    var cono = "M-17 -26L17 -26L2.6 26Q0 30 -2.6 26Z";
    s += K.Pa(cono, lg(K, [[0, "#f6cf8a"], [0.45, "#e0a45a"], [1, "#a8672a"]]), " stroke='#8a521f' stroke-width='1.4' stroke-linejoin='round'");
    var rete = ""; for (i = -4; i <= 4; i++) rete += "M" + (i * 7 - 22) + " -28L" + (i * 7 + 22) + " 40M" + (i * 7 + 22) + " -28L" + (i * 7 - 22) + " 40";
    s += "<g clip-path='" + K.clip(cono) + "'>" + tratto(K, rete, "#8a521f", 0.9, 0.55) + ombraEl(K, 12, 8, 10, 44, "#5a3010", 0.4) + "</g>";
    var sc = "M-19 0C-19 -17 -10 -26 0 -26C10 -26 19 -17 19 0Q16 5 12 1Q8 7 4 2Q0 7 -4 2Q-8 6 -12 1Q-16 5 -19 0Z";
    function pallina(y, c2, sca) {
      return "<g transform='translate(0 " + y + ") scale(" + sca + ")'>" + K.Pa(sc, rg(K, [[0, K.chiaro(c2, 0.4)], [0.5, c2], [1, K.scuro(c2, 0.34)]], 0.38, 0.3, 0.9), " stroke='" + K.scuro(c2, 0.5) + "' stroke-width='1.3' stroke-linejoin='round'") +
        op(K.ElR(-8, -17, 5, 3, -28, "#ffffff"), 0.5) + "</g>";
    }
    s += pallina(-23, CH, 1.12) + pallina(-50, C, 1.08);
    s += tratto(K, "M-2 -88Q3 -96 10 -100", "#4a8a2a", 1.8) + K.El(-2, -83, 5, 5, rg(K, [[0, "#ff8a8a"], [0.5, "#e03131"], [1, "#8c1a1a"]], 0.35, 0.3, 0.8), " stroke='#701414' stroke-width='.9'") + op(K.El(-3.6, -85, 1.6, 1.2, "#ffffff"), 0.7);
    return dammi(K, "<g transform='translate(0 -22)'>" + s + mis("tot", -22, -90, 44, 118) + "</g>", null, 1.2);
  });

  // ---------- lecca: lo stecco nel pugno, il disco (16 cm) grande e ben visibile sopra il pugno ----------
  A.impugna.lecca = { inclina: 8, posa: "davanti" };
  A.pezzo("inmano", "lecca", function (K) {
    var C = pal(K, "colMano"), s = "", pts = [], t, a, r, R = 25;
    s += tratto(K, "M0 22L0 -52", "#8c93a3", 5.6, 0.55) + tratto(K, "M0 22L0 -52", "#f4f6fa", 4) + tratto(K, "M-1 20L-1 -50", "#ffffff", 1, 0.8);
    s += "<g transform='translate(0 -80)'>";
    s += K.El(0, 0, R + 3, R + 3, K.soft(K.scuro(C, 0.4), 0.3));
    s += K.El(0, 0, R, R, rg(K, [[0, K.chiaro(C, 0.5)], [0.55, C], [1, K.scuro(C, 0.3)]], 0.38, 0.32, 0.85), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='1.2'");
    for (t = 0; t <= 1.0001; t += 0.025) { a = t * PI * 2 * 2.6; r = 2 + (R - 6) * t; pts.push([r * Math.cos(a), r * Math.sin(a)]); }
    s += "<g clip-path='" + K.clip(cerchio(0, 0, R)) + "'>" + tratto(K, "M" + K.n1(pts[0][0]) + " " + K.n1(pts[0][1]) + K.cr(pts), K.lum(C) > 0.8 ? K.scuro(C, 0.22) : "#ffffff", 4.2, 0.92) + "</g>";
    s += K.St("M-17 -9A19 19 0 0 1 -4 -20", "#ffffff", 2.2, 0.7) + op(K.El(-8, -21, 1.8, 1.8, "#ffffff"), 0.8);
    s += "</g>";
    var f = K.chiaro(C, 0.15);
    s += "<g transform='translate(0 -52) scale(.8)'>" + corpo(K, "M0 0L-11 -6L-11 6ZM0 0L11 -6L11 6Z", f, 1.2) + K.El(0, 0, 2.8, 2.8, K.scuro(f, 0.2), " stroke='" + K.scuro(f, 0.5) + "' stroke-width='.9'") + "</g>";
    return dammi(K, s + mis("disco", -25, -105, 50, 50) + mis("stecco", -2.8, -52, 5.6, 74), null, 1.74);
  });

  // ---------- fiore: il gambo nel pugno, il fiore in alto (40 cm in tutto, corolla 9 cm) ----------
  A.impugna.fiore = { inclina: 6, posa: "davanti" };
  A.pezzo("inmano", "fiore", function (K) {
    var E = 1.15, C = pal(K, "colMano"), s = "", V = "#3f9d4a", i;
    var gambo = "M0 28C-6 -20 8 -110 1 -152";
    s += tratto(K, gambo, "#1f5a2a", 6.4) + tratto(K, gambo, V, 4.4) + tratto(K, "M-1 24C-5 -20 5 -108 0 -148", "#8fe08f", 1.1, 0.7);
    function foglia(x, y, sx, sy) { var d = "M0 0C-12 -10 -26 -8 -31 3C-19 8 -6 7 0 0Z"; return "<g transform='translate(" + x + " " + y + ") scale(" + sx + " " + sy + ")'>" + K.Pa(d, lg(K, [[0, "#7ad37a"], [0.6, V], [1, "#2b7a36"]]), " stroke='#1f5a2a' stroke-width='1.2' stroke-linejoin='round'") + tratto(K, "M0 0L-24 3", "#1f5a2a", 1, 0.55) + "</g>"; }
    s += foglia(-1, -50, 1.1, 1.1) + foglia(2, -92, -1, 1);
    s += "<g transform='translate(1 -156) scale(1.18)'>";
    var pet = "M0 0C-9 -5 -10 -21 0 -28C10 -21 9 -5 0 0Z";
    for (i = 0; i < 8; i++) s += "<g transform='rotate(" + (i * 45 + 22) + ")'>" + K.Pa(pet, lg(K, [[0, K.scuro(C, 0.18)], [0.55, C], [1, K.chiaro(C, 0.3)]], 0, 1, 0, 0), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='1' stroke-linejoin='round'") + "</g>";
    s += K.El(0, 0, 9, 9, rg(K, [[0, "#fff1a0"], [0.6, "#f6c60c"], [1, "#b57d00"]], 0.38, 0.32, 0.85), " stroke='#8a5a00' stroke-width='1.1'");
    for (i = 0; i < 6; i++) s += op(K.El(5 * Math.cos(i * 1.05 + 0.3), 5 * Math.sin(i * 1.05 + 0.3), 1, 1, "#8a5a00"), 0.55);
    s += op(K.El(-2.8, -2.8, 2, 1.5, "#ffffff"), 0.55) + mis("corolla", -28, -28, 56, 56) + "</g>";
    s += mis("tot", -33, -189, 66, 217);
    return dammi(K, s, null, E);
  });

  // ---------- microfono: il manico (12) nel pugno, la retina (6 cm) ben visibile sopra il pugno ----------
  A.impugna.microfono = { inclina: -12, posa: "petto" };
  A.pezzo("inmano", "microfono", function (K) {
    var E = 1.64, C = pal(K, "colMano"), s = "";
    s += K.Pa("M-6 -36L6 -36L4.8 28Q0 32 -4.8 28Z", lg(K, [[0, "#6a717f"], [0.35, "#3a3f4a"], [1, "#101216"]]), " stroke='#0b0c10' stroke-width='1.2' stroke-linejoin='round'");
    s += K.St("M-3.4 -32L-2.8 24", "#ffffff", 1.2, 0.3);
    s += K.Pa("M-7.4 -42L7.4 -42L6.4 -33L-6.4 -33Z", lg(K, [[0, K.chiaro(C, 0.4)], [0.4, C], [1, K.scuro(C, 0.45)]]), " stroke='" + K.scuro(C, 0.55) + "' stroke-width='1' stroke-linejoin='round'");
    s += K.Pa("M-4.4 28L4.4 28L3.6 34L-3.6 34Z", "#1c1f27", " stroke='#0b0c10' stroke-width='.8' stroke-linejoin='round'");
    // la retina: grande, tutta sopra il pugno (centro a -56, raggio 15)
    s += K.Pa("M-8.6 -46L8.6 -46L7 -40L-7 -40Z", "#2b2f38", " stroke='#0b0c10' stroke-width='.8' stroke-linejoin='round'");
    s += K.El(0, -57, 15, 15, rg(K, [[0, "#fbfdff"], [0.55, "#bcc4d0"], [1, "#545c69"]], 0.36, 0.3, 0.85), " stroke='#2b2f38' stroke-width='1.3'");
    var gr = "", i; for (i = -3; i <= 3; i++) gr += "M" + i * 4.6 + " -74V-40M-15 " + (-57 + i * 4.6) + "H15";
    s += "<g clip-path='" + K.clip(cerchio(0, -57, 14.2)) + "'>" + tratto(K, gr, "#56606e", 0.8, 0.55) + ombraEl(K, 6, -52, 12, 12, "#1e2229", 0.35) + "</g>";
    s += op(K.ElR(-5.5, -63, 4.5, 2.7, -40, "#ffffff"), 0.7);
    s += mis("tot", -15, -72, 30, 106) + mis("retina", -15, -72, 30, 30);
    return dammi(K, s, null, E);
  });

  // ---------- telefono: 15 cm, tenuto nella parte bassa: lo schermo si vede sopra il pugno (di spalle il retro) ----------
  A.impugna.telefono = { inclina: -8, posa: "petto" };
  A.pezzo("inmano", "telefono", function (K) {
    var E = 1.7, C = pal(K, "colMano"), s = "", i, j, X = 16, Y0 = -58, Y1 = 6;
    var d = "M" + (-X) + " " + (Y0 + 6) + "Q" + (-X) + " " + Y0 + " " + (6 - X) + " " + Y0 + "L" + (X - 6) + " " + Y0 + "Q" + X + " " + Y0 + " " + X + " " + (Y0 + 6) + "L" + X + " " + (Y1 - 6) + "Q" + X + " " + Y1 + " " + (X - 6) + " " + Y1 + "L" + (6 - X) + " " + Y1 + "Q" + (-X) + " " + Y1 + " " + (-X) + " " + (Y1 - 6) + "Z";
    s += K.Pa(d, K.spalle ? vol(K, C) : lg(K, [[0, K.chiaro(C, 0.2)], [0.4, K.scuro(C, 0.1)], [1, K.scuro(C, 0.5)]]), " stroke='" + K.scuro(C, 0.62) + "' stroke-width='1.4' stroke-linejoin='round'");
    if (K.spalle) {
      s += K.Pa("M-12 " + (Y0 + 4) + "L0 " + (Y0 + 4) + "L0 " + (Y0 + 21) + "L-12 " + (Y0 + 21) + "Z", K.scuro(C, 0.3), " stroke='" + K.scuro(C, 0.6) + "' stroke-width='1' stroke-linejoin='round'");
      for (i = 0; i < 2; i++) s += K.El(-6, Y0 + 9.5 + i * 8, 3.2, 3.2, rg(K, [[0, "#5a6678"], [0.5, "#1c2230"], [1, "#05070b"]], 0.4, 0.35, 0.8), " stroke='#aab2c0' stroke-width='.9'");
      s += op(K.El(6, Y0 + 8, 1.6, 1.6, "#fff7c8"), 0.9) + K.St("M-13 " + (Y0 + 10) + "L-13 " + (Y1 - 12), "#fff", 1.4, 0.28);
    } else {
      var sd = "M-13 " + (Y0 + 5) + "Q-13 " + (Y0 + 2.5) + " -10.5 " + (Y0 + 2.5) + "L10.5 " + (Y0 + 2.5) + "Q13 " + (Y0 + 2.5) + " 13 " + (Y0 + 5) + "L13 " + (Y1 - 5) + "Q13 " + (Y1 - 2.5) + " 10.5 " + (Y1 - 2.5) + "L-10.5 " + (Y1 - 2.5) + "Q-13 " + (Y1 - 2.5) + " -13 " + (Y1 - 5) + "Z";
      s += K.Pa(sd, lg(K, [[0, "#6fc3ff"], [0.55, "#6a63e8"], [1, "#b04fd6"]], 0, 0, 0.7, 1), " stroke='#0a0c12' stroke-width='.8' stroke-linejoin='round'");
      s += "<g clip-path='" + K.clip(sd) + "'>";
      var cc = ["#ffd43b", "#ff6b6b", "#51cf66", "#ffffff", "#ff9a4a", "#4fd8ff", "#e64980", "#a9e34b", "#ffffff"];
      for (j = 0; j < 4; j++) for (i = 0; i < 3; i++) s += op(K.Pa("M" + (-10 + i * 7.8) + " " + (Y0 + 18 + j * 8.6) + "h5a1.6 1.6 0 0 1 1.6 1.6v3.8a1.6 1.6 0 0 1 -1.6 1.6h-5a1.6 1.6 0 0 1 -1.6 -1.6v-3.8a1.6 1.6 0 0 1 1.6 -1.6Z", cc[(j * 3 + i) % 9]), 0.95);
      s += op(K.Pa("M-9 " + (Y0 + 8) + "h10a1.2 1.2 0 0 1 0 2.4h-10a1.2 1.2 0 0 1 0 -2.4Z", "#fff"), 0.85) + op(K.Pa("M-16 " + (Y0 + 2) + "L16 " + (Y0 + 2) + "L5 " + Y1 + "L-16 " + Y1 + "Z", "#ffffff"), 0.1);
      s += "</g>" + K.Pa("M-4 " + (Y0 + 2.5) + "h8v2q-4 1.4 -8 0Z", "#0a0c12") + K.St("M-14.6 " + (Y0 + 8) + "L-14.6 " + (Y1 - 22), "#fff", 1, 0.35);
    }
    return dammi(K, s + mis("tot", -16, -58, 32, 64), null, E);
  });

  // ---------- tazza: tenuta per il MANICO (il pugno), il corpo della tazza si vede intero accanto al pugno, col vapore sopra ----------
  A.impugna.tazza = { inclina: 0, posa: "davanti" };
  A.pezzo("inmano", "tazza", function (K) {
    var E = 1.45, G = pres(K, E), C = pal(K, "colMano"), s = "", f = G.f;
    var W = 45, xr = Math.round(-15 * f - 8), xl = xr - W, yt = -24, yb = 22.6;       // il corpo della tazza: a sinistra del pugno (verso il corpo)
    // il manico: un anello che esce dal corpo e finisce nel pugno (si vede sopra e sotto il pugno)
    var man = "M" + (xr - 3) + " -14C" + (xr + 22) + " -22 " + (xr + 30) + " 10 " + (xr - 3) + " 12";
    s += tratto(K, man, K.scuro(C, 0.5), 8.4) + tratto(K, man, lg(K, [[0, K.chiaro(C, 0.35)], [1, K.scuro(C, 0.25)]], 0, 0, 1, 0), 6) + tratto(K, "M" + (xr + 1) + " -16C" + (xr + 20) + " -22 " + (xr + 24) + " 8 " + (xr + 1) + " 11", "#ffffff", 1, 0.5);
    var b = "M" + xl + " " + yt + "L" + xr + " " + yt + "L" + (xr - 2) + " " + (yb - 8) + "Q" + (xr - 3) + " " + yb + " " + (xr - 13) + " " + yb + "L" + (xl + 13) + " " + yb + "Q" + (xl + 3) + " " + yb + " " + (xl + 2) + " " + (yb - 8) + "Z";
    s += K.Pa(b, lg(K, [[0, K.chiaro(C, 0.4)], [0.42, C], [1, K.scuro(C, 0.4)]]), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='1.2' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(b) + "'>" + K.Pa("M" + (xl - 2) + " " + yt + "L" + (xr + 2) + " " + yt + "L" + (xr + 2) + " " + (yt + 7) + "L" + (xl - 2) + " " + (yt + 7) + "Z", "#f4f6fa", " opacity='.88'") + ombraEl(K, xr - 5, -2, 11, 50, "#1a1f2b", 0.32) + "</g>";
    var cx = (xl + xr) / 2;
    s += K.El(cx, yt, W / 2, 6, "#f1f3f7", " stroke='" + K.scuro(C, 0.5) + "' stroke-width='1'") + K.El(cx, yt + 0.5, W / 2 - 3, 4.3, rg(K, [[0, "#9a6a40"], [1, "#4e2f18"]], 0.4, 0.4, 0.8)) + op(K.El(cx - 7, yt - 0.8, 7, 1.3, "#d9b48a"), 0.7);
    s += tratto(K, "M" + (xl + 7) + " " + (yt + 10) + "L" + (xl + 7) + " " + (yb - 9), "#ffffff", 1.6, 0.5);
    s += tratto(K, "M" + (cx - 6) + " " + (yt - 8) + "C" + (cx - 12) + " " + (yt - 18) + " " + (cx + 2) + " " + (yt - 24) + " " + (cx - 4) + " " + (yt - 36) + "C" + (cx - 8) + " " + (yt - 43) + " " + (cx + 1) + " " + (yt - 48) + " " + (cx + 3) + " " + (yt - 54), "#ffffff", 2.4, 0.55) + tratto(K, "M" + (cx + 9) + " " + (yt - 7) + "C" + (cx + 5) + " " + (yt - 15) + " " + (cx + 15) + " " + (yt - 21) + " " + (cx + 10) + " " + (yt - 29), "#ffffff", 2, 0.42);
    s += mis("corpo", xl, yt - 6, W, yb - yt + 6);
    return dammi(K, s, null, E);
  });

  // ---------- libro: 21 × 15 cm, tenuto per il dorso: il libro sta davanti al petto (verso il corpo), la copertina si vede (di spalle il retro) ----------
  A.impugna.libro = { inclina: -6, posa: "petto" };
  A.pezzo("inmano", "libro", function (K) {
    var E = 1.55, C = pal(K, "colMano"), s = "", X0 = -10, X1 = 46, Y0 = -42, Y1 = 42, cop = "M" + (X0 + 3) + " " + Y0 + "L" + (X1 - 3) + " " + Y0 + "Q" + X1 + " " + Y0 + " " + X1 + " " + (Y0 + 3) + "L" + X1 + " " + (Y1 - 3) + "Q" + X1 + " " + Y1 + " " + (X1 - 3) + " " + Y1 + "L" + (X0 + 3) + " " + Y1 + "Q" + X0 + " " + Y1 + " " + X0 + " " + (Y1 - 3) + "L" + X0 + " " + (Y0 + 3) + "Q" + X0 + " " + Y0 + " " + (X0 + 3) + " " + Y0 + "Z";
    s += ombraEl(K, 22, 0, 36, 52, "#000000", 0.18);
    s += K.Pa("M" + (X0 + 4) + " " + (Y0 + 3) + "L" + (X1 + 4) + " " + (Y0 + 3) + "L" + (X1 + 4) + " " + (Y1 - 1) + "L" + (X0 + 4) + " " + (Y1 - 1) + "Z", lg(K, [[0, "#fffdf4"], [1, "#d8cfb4"]]), " stroke='#a89c7e' stroke-width='1'") + tratto(K, "M" + (X1 + 2) + " " + (Y0 + 6) + "L" + (X1 + 2) + " " + (Y1 - 4) + "M" + (X1 + 0.4) + " " + (Y0 + 4) + "L" + (X1 + 0.4) + " " + (Y1 - 2), "#b9ae96", .7, 0.7);
    s += corpo(K, cop, C, 1.4) + K.Pa("M" + X0 + " " + Y0 + "L" + (X0 + 8) + " " + Y0 + "L" + (X0 + 8) + " " + Y1 + "L" + X0 + " " + Y1 + "Z", K.scuro(C, 0.28)) + tratto(K, "M" + (X0 + 8) + " " + (Y0 + 2) + "L" + (X0 + 8) + " " + (Y1 - 2), K.scuro(C, 0.55), 1) + tratto(K, "M" + (X0 + 3) + " " + (Y0 + 3) + "L" + (X0 + 3) + " " + (Y1 - 3), K.chiaro(C, 0.4), 1, 0.6);
    if (K.spalle) { s += K.Pa(stella(18, 0, 7, 3), K.chiaro(C, 0.55), " opacity='.7'"); }
    else {
      s += K.Pa("M" + (X0 + 14) + " " + (Y0 + 7) + "L" + (X1 - 6) + " " + (Y0 + 7) + "L" + (X1 - 6) + " " + (Y0 + 20) + "L" + (X0 + 14) + " " + (Y0 + 20) + "Z", "#f7e7a8", " opacity='.9' stroke='#b8923a' stroke-width='.8'") + tratto(K, "M" + (X0 + 19) + " " + (Y0 + 12) + "L" + (X1 - 12) + " " + (Y0 + 12) + "M" + (X0 + 19) + " " + (Y0 + 16.5) + "L" + (X1 - 20) + " " + (Y0 + 16.5), K.scuro(C, 0.5), 1.6, 0.8);
      s += K.Pa(stella(26, -5, 8, 3.4), "#ffd84a", " stroke='#b8860b' stroke-width='.9' stroke-linejoin='round'");
      s += K.Pa("M" + (X1 - 10) + " " + (Y1 - 2) + "L" + (X1 - 10) + " " + (Y1 + 9) + "L" + (X1 - 7) + " " + (Y1 + 6) + "L" + (X1 - 4) + " " + (Y1 + 9) + "L" + (X1 - 4) + " " + (Y1 - 2) + "Z", "#d6336c", " stroke='#8c1a46' stroke-width='.8'");
    }
    return dammi(K, "<g transform='translate(2 0) scale(-1 1)'>" + s + mis("tot", X0, Y0, X1 - X0 + 4, Y1 - Y0) + "</g>", null, E);
  });

  // ---------- pizza: una FETTA di 22 cm, la punta in alto e la crosta (14 cm) in basso nel pugno: la fetta si vede tutta ----------
  A.impugna.pizza = { inclina: -8, posa: "davanti" };
  A.pezzo("inmano", "pizza", function (K) {
    var E = 1.4, s = "", T = -18;
    s += "<g transform='translate(0 " + T + ")'>";
    var fet = "M-29 -6L-3.4 -88Q0 -92 3.4 -88L29 -6Q0 7 -29 -6Z";
    s += K.Pa(fet, lg(K, [[0, "#ffe9a0"], [0.5, "#f7c84a"], [1, "#d8962a"]], 0, 0, 1, 1), " stroke='#a8661a' stroke-width='1.2' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(fet) + "'>";
    [[-13, -2, 5], [12, -4, 4.5], [-2, -18, 4], [0, -48, 3.2]].forEach(function (b) { s += op(K.El(b[0], b[1], b[2], b[2] * 0.65, "#e8a21e"), 0.55); });
    s += "</g>";
    [[-12, -8, 7.4], [13, -10, 6.8], [0, -27, 6.4], [2, -52, 4.4]].forEach(function (p) { s += K.El(p[0], p[1], p[2], p[2] * 0.9, rg(K, [[0, "#f26a5a"], [0.6, "#c92a2a"], [1, "#7e1414"]], 0.38, 0.32, 0.85), " stroke='#6e1010' stroke-width='.9'") + op(K.El(p[0] - p[2] * 0.3, p[1] - p[2] * 0.3, p[2] * 0.3, p[2] * 0.2, "#ffd0c8"), 0.6); });
    [[-4, -3, -30], [17, -19, 24], [-12, -21, 50]].forEach(function (b) { s += "<g transform='translate(" + b[0] + " " + b[1] + ") rotate(" + b[2] + ")'>" + K.Pa("M0 0C-3.4 -4.6 -1 -8 3.4 -8.6C5.6 -4.6 3.4 -1 0 0Z", "#3fae4a", " stroke='#1f6a2a' stroke-width='.7'") + "</g>"; });
    s += K.Pa("M-32 -9Q0 15 32 -9Q35 0 29 5Q0 23 -29 5Q-35 0 -32 -9Z", lg(K, [[0, "#e8b068"], [0.5, "#c47e34"], [1, "#8a5220"]]), " stroke='#6a3c14' stroke-width='1.2' stroke-linejoin='round'");
    s += tratto(K, "M-26 -3Q-12 9 2 11", "#ffe0a8", 1.6, 0.7) + tratto(K, "M-27 -26C-22 -40 -19 -52 -12 -66", "#ffe9a0", 1.4, 0.5);
    s += mis("lunga", -32, -92, 64, 112) + mis("crosta", -35, -9, 70, 14) + "</g>";
    return dammi(K, s, null, E);
  });

  // ---------- bacchetta: sottile, 40 cm in tutto, la stella (13 cm) bella grande in cima ----------
  A.impugna.bacchetta = { inclina: 14, posa: "davanti" };
  A.pezzo("inmano", "bacchetta", function (K) {
    var C = pal(K, "colMano"), s = "";
    s += tratto(K, "M0 24L0 -60", "#0c0a0a", 5.6) + tratto(K, "M0 24L0 -60", lg(K, [[0, "#7a6a62"], [0.45, "#2e2625"], [1, "#0e0b0b"]]), 4.2);
    s += tratto(K, "M-1.1 20L-1.1 -56", "#ffffff", 0.8, 0.38);
    s += K.Pa("M-3.4 -40L3.4 -40L3.4 -31L-3.4 -31Z", vol(K, C), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='.8'");
    s += K.Pa("M-3.4 -64L3.4 -64L3.1 -72L-3.1 -72Z", lg(K, [[0, "#ffffff"], [1, "#b8bfcc"]]), " stroke='#7f889a' stroke-width='.8' stroke-linejoin='round'");
    s += K.Pa("M-3.6 24L3.6 24L3.4 18L-3.4 18Z", "#f2f4f8", " stroke='#7f889a' stroke-width='.7'");
    s += "<g transform='translate(0 -88)'>";
    s += K.El(0, 0, 34, 34, K.soft("#ffe27a", 0.75));
    s += K.Pa(stella(0, 0, 20, 8.4), lg(K, [[0, "#fff8c6"], [0.5, "#ffd83b"], [1, "#e0a000"]], 0, 0, 1, 1), " stroke='#b8860b' stroke-width='1' stroke-linejoin='round'");
    s += op(K.Pa(stella(-2.4, -2.4, 8.4, 3.6), "#ffffff"), 0.6) + "</g>";
    function scint(x, y, r, c2) { return K.Pa("M" + x + " " + (y - r) + "Q" + x + " " + y + " " + (x + r) + " " + y + "Q" + x + " " + y + " " + x + " " + (y + r) + "Q" + x + " " + y + " " + (x - r) + " " + y + "Q" + x + " " + y + " " + x + " " + (y - r) + "Z", c2); }
    s += scint(-27, -112, 6, "#ffffff") + scint(26, -116, 5, K.chiaro(C, 0.45)) + scint(30, -82, 5, "#ffffff");
    return dammi(K, s + mis("stecco", -3, -72, 6, 96) + mis("stella", -20, -108, 40, 40) + mis("tot", -20, -108, 40, 132), null, 1.77);
  });

  // ---------- bandiera da tifoso: asta di 60 cm nel pugno, telo di 30 × 20 cm in cima ----------
  A.impugna.bandiera = { inclina: 6, posa: "davanti" };
  A.pezzo("inmano", "bandiera", function (K) {
    var E = 2.36, s = "", i, T0 = -112;
    s += tratto(K, "M0 30L0 " + T0, "#3e2412", 4.2) + tratto(K, "M0 30L0 " + T0, lg(K, [[0, "#c28a5a"], [0.5, "#8d5a3b"], [1, "#4e2f18"]]), 2.8) + tratto(K, "M-.8 26L-.8 " + (T0 + 4), "#ffe0c0", .7, 0.4);
    var y0 = T0 + 3, fl = "M1.6 " + y0 + "C17 " + (y0 - 6) + " 29 " + (y0 + 6) + " 43 " + y0 + "S66 " + (y0 - 5) + " 80 " + (y0 + 1) + "L80 " + (y0 + 47) + "C66 " + (y0 + 41) + " 57 " + (y0 + 52) + " 43 " + (y0 + 46) + "C29 " + (y0 + 40) + " 17 " + (y0 + 52) + " 1.6 " + (y0 + 46) + "Z";
    s += K.Pa(fl, "#f4f4f4", " stroke='#5a5a5a' stroke-width='.9' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(fl) + "'>" + K.Pa("M0 " + (y0 - 20) + "L27 " + (y0 - 20) + "L27 " + (y0 + 70) + "L0 " + (y0 + 70) + "Z", "#2f9e44") + K.Pa("M27 " + (y0 - 20) + "L54 " + (y0 - 20) + "L54 " + (y0 + 70) + "L27 " + (y0 + 70) + "Z", "#fbfbf8") + K.Pa("M54 " + (y0 - 20) + "L90 " + (y0 - 20) + "L90 " + (y0 + 70) + "L54 " + (y0 + 70) + "Z", "#d9322f");
    s += tratto(K, "M1.6 " + y0 + "C17 " + (y0 - 6) + " 29 " + (y0 + 6) + " 43 " + y0 + "S66 " + (y0 - 5) + " 80 " + (y0 + 1), "#ffffff", 2.2, 0.28);
    for (i = 0; i < 3; i++) s += K.Pa("M" + (10 + i * 22) + " " + (y0 - 20) + "L" + (20 + i * 22) + " " + (y0 - 20) + "L" + (10 + i * 22) + " " + (y0 + 70) + "L" + i * 22 + " " + (y0 + 70) + "Z", "#000000", " opacity='" + (i % 2 ? 0.1 : 0.04) + "'");
    s += "</g>" + K.El(0, T0 - 2, 3.6, 3.6, rg(K, [[0, "#fff3b0"], [0.5, "#f5c518"], [1, "#a8740b"]], 0.38, 0.32, 0.85), " stroke='#8a5a00' stroke-width='.8'");
    s += mis("telo", 1.6, y0 - 2, 78.4, 50) + mis("asta", -2, T0 - 4, 4, 34 - T0);
    return dammi(K, s, null, E);
  });

  // ---------- pallone: da calcio vero, 22 cm di diametro; il pugno lo sostiene dal basso (copre solo la parte bassa) ----------
  A.impugna.pallone = { inclina: 0, posa: "davanti" };
  A.pezzo("inmano", "pallone", function (K) {
    var E = 1.87, C = pal(K, "colMano"), s = "", R = 35, cx = 2, cy = -22, i, pc = K.lum(C) > 0.78 ? "#2b2f38" : K.scuro(C, 0.12);
    function pent(x, y, r, rot) { var p = [], k; for (k = 0; k < 5; k++) { var a = (rot + k * 72) * PI / 180; p.push((x + r * Math.cos(a)).toFixed(1) + " " + (y + r * Math.sin(a)).toFixed(1)); } return "M" + p.join("L") + "Z"; }
    s += K.El(cx, cy, R, R, rg(K, [[0, "#ffffff"], [0.6, "#e8ecf2"], [1, "#9ea7b6"]], 0.36, 0.3, 0.85), " stroke='#3a3f4a' stroke-width='1.1'");
    s += "<g clip-path='" + K.clip(cerchio(cx, cy, R - 0.8)) + "'>";
    var mx = cx + 2.5, my = cy - 2, f = R / 42;
    s += K.Pa(pent(mx, my, 14 * f, -90), pc, " stroke='" + K.scuro(pc, 0.4) + "' stroke-width='.8' stroke-linejoin='round'");
    for (i = 0; i < 5; i++) {
      var a = (-90 + i * 72) * PI / 180, vx = mx + 14 * f * Math.cos(a), vy = my + 14 * f * Math.sin(a), ox = mx + 33 * f * Math.cos(a), oy = my + 33 * f * Math.sin(a), ex = mx + 56 * f * Math.cos(a), ey = my + 56 * f * Math.sin(a);
      s += tratto(K, "M" + vx.toFixed(1) + " " + vy.toFixed(1) + "L" + ox.toFixed(1) + " " + oy.toFixed(1), "#3a3f4a", 1.1, 0.85);
      s += K.Pa(pent(ex, ey, 22 * f, -90 + i * 72 + 36), pc, " stroke='" + K.scuro(pc, 0.4) + "' stroke-width='.8' stroke-linejoin='round'");
      var b = ((-90 + i * 72 + 36) * PI) / 180;
      s += tratto(K, "M" + ox.toFixed(1) + " " + oy.toFixed(1) + "L" + (mx + 40 * f * Math.cos(b)).toFixed(1) + " " + (my + 40 * f * Math.sin(b)).toFixed(1), "#3a3f4a", .9, 0.55);
    }
    s += ombraEl(K, cx + 17, cy + 18, 38, 38, "#1b2230", 0.38) + "</g>";
    s += op(K.ElR(cx - 13, cy - 17, 7, 4, -42, "#ffffff"), 0.7);
    s += mis("diam", cx - R, cy - R, 2 * R, 2 * R);
    return dammi(K, s, null, E);
  });

  // ---------- trofeo: la coppa alta circa due pugni, il gambo nel pugno, braccio alzato ----------
  A.impugna.trofeo = { inclina: 22, posa: "alto" };
  A.pezzo("inmano", "trofeo", function (K) {
    var C = pal(K, "colMano"), s = "";
    var ORO = [[0, "#fffadc"], [0.18, "#ffe45c"], [0.5, "#f2b705"], [0.82, "#b87a05"], [1, "#7a4c02"]], ORO2 = [[0, "#ffe97a"], [0.5, "#e0a50a"], [1, "#8a5604"]];
    var coppa = "M-25 -92L25 -92C26 -68 17 -48 5 -40L5 -26L-5 -26L-5 -40C-17 -48 -26 -68 -25 -92Z";
    var man = "M-24 -86C-44 -88 -44 -58 -19 -54", man2 = "M24 -86C44 -88 44 -58 19 -54";
    s += tratto(K, man, "#6a4202", 7.4) + tratto(K, man2, "#6a4202", 7.4) + tratto(K, man, lg(K, ORO2, 0, 0, 1, 1), 5.2) + tratto(K, man2, lg(K, ORO2, 0, 0, 1, 1), 5.2);
    s += tratto(K, "M-32 -82C-37 -78 -36 -64 -26 -59", "#fff6c2", 1.3, 0.7);
    s += K.Pa(coppa, lg(K, ORO), " stroke='#6a4202' stroke-width='1.5' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(coppa) + "'>" + ombraEl(K, 21, -66, 14, 44, "#4a2a00", 0.42) + tratto(K, "M-15 -89C-16 -68 -11 -54 -3 -46", "#ffffff", 3.6, 0.55) + tratto(K, "M-9 -88C-9 -74 -6 -62 -1 -54", "#ffffff", 1.4, 0.45) + "</g>";
    s += K.El(0, -92, 25, 5, "#d49a0a", " stroke='#6a4202' stroke-width='1.2'") + K.El(0, -91.4, 21.4, 3.2, "#5a3a02") + op(K.El(-9, -92.6, 8.6, 1.1, "#ffe9a0"), 0.8);
    s += K.Pa(stella(0, -66, 10.5, 4.4), "#fffbe0", " stroke='#b8860b' stroke-width='.9' stroke-linejoin='round'");
    s += K.Pa("M-5 -26L5 -26L4.6 -6L-4.6 -6Z", lg(K, ORO), " stroke='#6a4202' stroke-width='1.2'") + K.El(0, -30, 8, 2.8, lg(K, ORO2), " stroke='#6a4202' stroke-width='1'");
    s += K.Pa("M-17 30L17 30Q16 22 11 21L-11 21Q-16 22 -17 30Z", lg(K, ORO), " stroke='#6a4202' stroke-width='1.3' stroke-linejoin='round'") + K.Pa("M-19 36L19 36L17 30L-17 30Z", lg(K, ORO2), " stroke='#6a4202' stroke-width='1.3' stroke-linejoin='round'");
    s += K.Pa("M-12 21L12 21L11.4 14L-11.4 14Z", vol(K, C), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='1.1' stroke-linejoin='round'");
    s += tratto(K, "M-3 -4L-3 12", "#fff6c2", 1.2, 0.7) + op(K.Pa(stella(32, -90, 4, 1.8), "#ffffff"), 0.8);
    return dammi(K, s + mis("tot", -44, -97, 88, 133), null, 1.31);
  });

  // ====== SULLA SCHIENA (coordinate del mondo; centro x = K.C) ======
  function rr(x0, y0, x1, y1, r) { return "M" + n(x0 + r) + " " + n(y0) + "H" + n(x1 - r) + "Q" + n(x1) + " " + n(y0) + " " + n(x1) + " " + n(y0 + r) + "V" + n(y1 - r) + "Q" + n(x1) + " " + n(y1) + " " + n(x1 - r) + " " + n(y1) + "H" + n(x0 + r) + "Q" + n(x0) + " " + n(y1) + " " + n(x0) + " " + n(y1 - r) + "V" + n(y0 + r) + "Q" + n(x0) + " " + n(y0) + " " + n(x0 + r) + " " + n(y0) + "Z"; }
  function spec(s, x) { return "<g transform='translate(" + (2 * x) + " 0) scale(-1 1)'>" + s + "</g>"; }   // specchia attorno a x

  // ---------- zaino ----------
  A.pezzo("schiena", "zaino", function (K) {
    var C = pal(K, "colSchiena"), B = K.B, Y = K.Y, c0 = K.C, Jd = Math.abs(K.BR[1].J[0] - c0), s = "", i;
    var w = K.spalle ? Jd - 2 : B.sho + 23, y0 = K.spalle ? 262 : 246, y1 = K.spalle ? 522 : 548, x0 = c0 - w, x1 = c0 + w, r = 46;
    var main = rr(x0, y0, x1, y1, r);
    s += ombraEl(K, c0 + 10, y1 + 2, w + 10, 16, "#000000", 0.25);
    // le tasche laterali (sporgono)
    [-1, 1].forEach(function (l) { var xe = c0 + l * (w + 9), xi = c0 + l * (w - 14), d = "M" + n(xi) + " " + (y1 - 150) + "Q" + n(xe) + " " + (y1 - 150) + " " + n(xe) + " " + (y1 - 118) + "L" + n(xe) + " " + (y1 - 52) + "Q" + n(xe) + " " + (y1 - 30) + " " + n(xi) + " " + (y1 - 30) + "Z"; s += corpo(K, d, K.scuro(C, 0.14), 2); s += tratto(K, "M" + n(xe - l * 4) + " " + (y1 - 130) + "L" + n(xe - l * 4) + " " + (y1 - 50), K.chiaro(C, 0.3), 1.6, 0.4); });
    s += tratto(K, "M" + n(c0 - 22) + " " + (y0 + 2) + "Q" + c0 + " " + (y0 - 34) + " " + n(c0 + 22) + " " + (y0 + 2), K.scuro(C, 0.3), 9) + tratto(K, "M" + n(c0 - 22) + " " + (y0 + 2) + "Q" + c0 + " " + (y0 - 34) + " " + n(c0 + 22) + " " + (y0 + 2), K.chiaro(C, 0.15), 4.4);
    s += corpo(K, main, C, 2.6);
    var fy = y0 + 96;
    s += "<g clip-path='" + K.clip(main) + "'>";
    // patta in alto
    var patta = "M" + (x0 - 6) + " " + (y0 - 6) + "H" + (x1 + 6) + "V" + fy + "Q" + c0 + " " + (fy + 36) + " " + (x0 - 6) + " " + fy + "Z";
    s += K.Pa(patta, vol(K, K.scuro(C, 0.12)), " stroke='" + K.scuro(C, 0.52) + "' stroke-width='2.2'");
    s += tratto(K, "M" + (x0 + 10) + " " + (fy - 12) + "Q" + c0 + " " + (fy + 20) + " " + (x1 - 10) + " " + (fy - 12), K.chiaro(C, 0.4), 1.6, 0.5).replace("stroke-linecap='round'", "stroke-linecap='butt' stroke-dasharray='6 5'");
    // tasca davanti con zip
    var tx0 = x0 + 14, tx1 = x1 - 14, ty0 = fy + 44, ty1 = y1 - 38;
    s += K.Pa(rr(tx0, ty0, tx1, ty1, 20), lg(K, [[0, K.chiaro(C, 0.3)], [0.4, K.chiaro(C, 0.06)], [1, K.scuro(C, 0.3)]]), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='2'");
    s += tratto(K, "M" + (tx0 + 8) + " " + (ty0 + 18) + "H" + (tx1 - 8), K.scuro(C, 0.55), 2.2) + tratto(K, "M" + (tx0 + 8) + " " + (ty0 + 18) + "H" + (tx1 - 8), "#d8dde8", 1, 0.8).replace("stroke-linecap='round'", "stroke-linecap='butt' stroke-dasharray='3 3'");
    s += K.Pa("M" + (c0 - 5) + " " + (ty0 + 18) + "h10v22q0 4 -5 4t-5 -4Z", "#d6dbe6", " stroke='#5a6272' stroke-width='1.2'");
    // cinghia con fibbia
    s += K.Pa("M" + (c0 - 8) + " " + (fy + 14) + "h16v40h-16Z", K.scuro(C, 0.3), " stroke='" + K.scuro(C, 0.6) + "' stroke-width='1.4'") + K.Pa("M" + (c0 - 12) + " " + (fy + 36) + "h24v14h-24Z", lg(K, [[0, "#fff3b0"], [1, "#b8860b"]]), " stroke='#7a5206' stroke-width='1.2'");
    s += ombraEl(K, x1 - 4, (y0 + y1) / 2, 40, 190, K.scuro(C, 0.55), 0.35) + op(K.El(x0 + 12, (y0 + y1) / 2, 6, 150, "#ffffff"), 0.28) + "</g>";
    return { dietro: s, sopra: K.spalle ? "" : zainoSpalle(K, C) };
  });
  function zainoSpalle(K, C) {
    var B = K.B, c0 = K.C, s = "", w = 15 + B.nk * 0.42, bs = K.scuro(C, 0.18), pts = function (l) {
      var xa = B.nk + (B.shx - B.nk) * 0.5, xb = B.ap - 4;
      return [[c0 + l * xa, 248, w], [c0 + l * (xa + 4), 300, w], [c0 + l * ((xa + xb) / 2 + 2), 370, w], [c0 + l * xb, 452, w * 0.9]];
    };
    [-1, 1].forEach(function (l) {
      var p = pts(l), d = K.limb(p);
      s += ombraEl(K, p[1][0] + l * 3, 340, w, 110, "#000000", 0.22);
      s += K.Pa(d, vol(K, bs), " stroke='" + K.scuro(C, 0.55) + "' stroke-width='2' stroke-linejoin='round'");
      s += tratto(K, "M" + n(p[0][0]) + " 252" + K.cr(p.map(function (q) { return [q[0], q[1] + 2]; })), K.chiaro(C, 0.5), 1.4, 0.55).replace("stroke-linecap='round'", "stroke-linecap='butt' stroke-dasharray='5 4'");
      s += K.Pa("M" + n(p[2][0] - w * 0.46) + " 384h" + n(w * 0.92) + "v14h" + n(-w * 0.92) + "Z", "#2b2f38", " stroke='#0b0c10' stroke-width='1'");
    });
    var yy = 372, xs = (pts(1)[2][0] - c0) - w * 0.4;
    s += tratto(K, "M" + n(c0 - xs) + " " + yy + "Q" + c0 + " " + (yy + 8) + " " + n(c0 + xs) + " " + yy, K.scuro(C, 0.45), 6) + tratto(K, "M" + n(c0 - xs) + " " + yy + "Q" + c0 + " " + (yy + 8) + " " + n(c0 + xs) + " " + yy, K.scuro(C, 0.05), 3.2);
    s += K.Pa("M" + (c0 - 9) + " " + (yy - 2) + "h18v12h-18Z", "#d6dbe6", " stroke='#5a6272' stroke-width='1.2'");
    return s;
  }

  // ---------- imbracature: cinghie sulle spalle (davanti) e attacchi sulle scapole (di spalle) per ali e mantello ----------
  function cinghie(K, col, w) {   // sopra (vista davanti): due cinghie che passano sulle spalle e scendono sotto le ascelle
    var B = K.B, c0 = K.C, s = "";
    [-1, 1].forEach(function (l) {
      var xa = B.nk + (B.shx - B.nk) * 0.5, p = [[c0 + l * xa, 247, w], [c0 + l * (xa + 5), 300, w], [c0 + l * ((xa + B.ap - 4) / 2 + 2), 370, w * 0.92], [c0 + l * (B.ap - 6), 436, w * 0.8]];
      s += ombraEl(K, p[1][0] + l * 3, 330, w, 80, "#000000", 0.2);
      s += K.Pa(K.limb(p), vol(K, col), " stroke='" + K.scuro(col, 0.5) + "' stroke-width='1.6' stroke-linejoin='round'");
      s += tratto(K, "M" + n(p[0][0]) + " 250" + K.cr(p.map(function (q) { return [q[0], q[1] + 2]; })), K.chiaro(col, 0.5), 1.1, 0.55);
    });
    return s;
  }
  function attacchi(K, col) {   // di spalle: i due attacchi sulle scapole da cui partono le ali
    var c0 = K.C, s = "", Jd = Math.abs(K.BR[1].J[0] - c0);
    [-1, 1].forEach(function (l) {
      var x = c0 + l * Math.min(40, Jd * 0.5), y = 318;
      s += ombraEl(K, x + l * 2, y + 4, 26, 36, "#000000", 0.25);
      s += K.Pa(rr(x - 17, y - 28, x + 17, y + 28, 15), vol(K, col), " stroke='" + K.scuro(col, 0.55) + "' stroke-width='2' stroke-linejoin='round'");
      s += K.El(x, y, 7, 7, rg(K, [[0, "#fff6c2"], [0.5, "#f7cc2e"], [1, "#9a6a08"]], 0.38, 0.32, 0.85), " stroke='#7a5206' stroke-width='1.4'") + tratto(K, "M" + n(x - 10) + " " + (y - 20) + "L" + n(x - 10) + " " + (y + 20), "#ffffff", 1.6, 0.45);
    });
    return s;
  }

  // ---------- chitarra ----------
  A.pezzo("schiena", "chitarra", function (K) {
    var C = pal(K, "colSchiena"), c0 = K.C, s = "", i;
    var legno = [[0, "#ffd592"], [0.4, "#e39a4c"], [0.8, "#a95a22"], [1, "#6a3010"]];
    var cassa = "M0 -118C-34 -118 -56 -96 -54 -70C-53 -52 -36 -46 -40 -22C-48 -4 -84 8 -84 52C-84 100 -46 132 0 132C46 132 84 100 84 52C84 8 48 -4 40 -22C36 -46 53 -52 54 -70C56 -96 34 -118 0 -118Z";
    s += ombraEl(K, c0 - 100, 600, 100, 110, "#000000", 0.2);
    s += "<g transform='translate(" + (c0 - 112) + " 552) rotate(30) scale(1.12)'>";
    // manico e paletta
    s += K.Pa("M-12 -108L12 -108L10 -336L-10 -336Z", lg(K, [[0, "#9a6a40"], [0.45, "#5e3a20"], [1, "#2a180a"]]), " stroke='#2a1608' stroke-width='1.8' stroke-linejoin='round'");
    s += tratto(K, "M-7 -112L-6 -332", "#ffffff", 1.4, 0.25);
    for (i = 1; i < 9; i++) s += tratto(K, "M-11 " + (-108 - i * 24) + "H11", "#e8e4d8", 1.4, 0.85);
    for (i = 0; i < 5; i++) s += K.El(0, -134 - i * 44, 2, 2, "#f2eee2", "");
    s += K.Pa("M-17 -336Q-19 -380 -12 -408L12 -408Q19 -380 17 -336Z", lg(K, [[0, "#6a4a30"], [1, "#1c0f06"]]), " stroke='#120a04' stroke-width='1.6' stroke-linejoin='round'");
    [-1, 1].forEach(function (l) { for (var k = 0; k < 3; k++) s += K.El(l * 22, -352 - k * 18, 5.8, 4.4, rg(K, [[0, "#fafcff"], [1, "#8a93a3"]], 0.4, 0.35, 0.8), " stroke='#3a3f4a' stroke-width='1'") + tratto(K, "M" + l * 17 + " " + (-352 - k * 18) + "H" + l * 22, "#8a93a3", 2.2); });
    // fianco della cassa (spessore) poi il piano
    s += "<g transform='translate(7 9)'>" + K.Pa(cassa, lg(K, [[0, "#8a4a1c"], [1, "#3a1a08"]], 0, 0, 1, 1), " stroke='#2a1206' stroke-width='3' stroke-linejoin='round'") + "</g>";
    s += K.Pa(cassa, rg(K, legno, 0.34, 0.34, 0.95), " stroke='#5a2e0e' stroke-width='3' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(cassa) + "'>" + ombraEl(K, 56, 60, 50, 150, "#2a1006", 0.45) + ombraEl(K, -52, 40, 24, 120, "#ffffff", 0.22) + "</g>";
    s += tratto(K, "M0 -110C-31 -110 -50 -92 -48 -70C-47 -54 -31 -48 -34 -24C-42 -4 -77 8 -77 52C-77 96 -44 126 0 126", "#fbe9c4", 2, 0.75);
    s += K.El(0, -6, 27, 27, "#1a0e07", " stroke='#fbe9c4' stroke-width='3'") + K.El(0, -6, 33, 33, "none", " stroke='#5a2e0e' stroke-width='2'") + K.El(0, -6, 38, 38, "none", " stroke='#fbe9c4' stroke-width='1.2' opacity='.7'") + op(K.ElR(-8, -14, 10, 4, -30, "#4a3020"), 0.7);
    s += K.Pa("M20 -26Q54 -38 62 -10Q56 18 30 24Q36 -2 20 -26Z", vol(K, C), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='1.6' stroke-linejoin='round'");
    s += K.Pa("M-32 86h64v14h-64Z", lg(K, [[0, "#4a2a14"], [1, "#150a04"]]), " stroke='#120a04' stroke-width='1.2'") + tratto(K, "M-24 93h48", "#f4efe2", 1.6, 0.8);
    for (i = 0; i < 6; i++) s += tratto(K, "M" + (-8 + i * 3.2) + " -336L" + (-26 + i * 10.4) + " 94", "#ffffff", 1, 0.7);
    s += tratto(K, "M-72 36C-76 70 -62 106 -32 122", "#ffffff", 4, 0.38);
    s += "</g>";
    // la tracolla: dalla spalla destra (verso chi guarda) al fianco opposto
    var sopra = "";
    if (!K.spalle) {
      var B = K.B, p = [[c0 + B.nk + (B.shx - B.nk) * 0.55, 250, 20], [c0 + 18, 340, 20], [c0 - B.ch * 0.4, 430, 20], [c0 - B.hp * 1.12 - 6, 548, 20]];
      sopra += ombraEl(K, c0 + 4, 400, 60, 110, "#000000", 0.2) + K.Pa(K.limb(p), vol(K, C), " stroke='" + K.scuro(C, 0.55) + "' stroke-width='2' stroke-linejoin='round'");
      sopra += tratto(K, K.liscio(p.map(function (q) { return [q[0], q[1]]; })), K.chiaro(C, 0.5), 1.4, 0.55).replace("stroke-linecap='round'", "stroke-linecap='butt' stroke-dasharray='5 4'");
    }
    return { dietro: s, sopra: sopra };
  });

  // ---------- mantello ----------
  A.pezzo("schiena", "mantello", function (K) {
    var C = pal(K, "colSchiena"), B = K.B, c0 = K.C, s = "", i, ye = 838, Jd = Math.abs(K.BR[1].J[0] - c0), xo = Jd + K.rc * 0.8, nk = B.nk + 8, BR = K.BR[1];
    var X = function (l, v) { return n(c0 + l * v); };
    // dove sta il lato interno del braccio a quella quota: il mantello scende tra le braccia, poi si apre sotto i polsi
    function interno(y) {
      var J = BR.J, E = BR.E, W = BR.W, cx = y < E[1] ? J[0] + (E[0] - J[0]) * Math.max(0, (y - J[1]) / (E[1] - J[1])) : E[0] + (W[0] - E[0]) * Math.min(1, (y - E[1]) / (W[1] - E[1]));
      return Math.abs(cx - c0) - B.aw[1] * 0.62;
    }
    var m450 = Math.max(B.wt + 12, interno(450)), m540 = Math.max(B.hp + 16, interno(540));
    var dx = [[nk, 248], [B.shx + 2, 264], [B.sho - 3, 292], [B.ch + 12, 340], [m450, 450], [m540, 540], [m540 + 26, 650], [m540 + 58, 755], [m540 + 84, 825]];
    var hem = [[m540 + 86, 842], [m540 * 0.8 + 50, 856], [m540 * 0.52 + 30, 836], [m540 * 0.26 + 14, 856], [m540 * 0.06, 838]];
    var pts = [], k;
    for (k = 0; k < dx.length; k++) pts.push([c0 + dx[k][0], dx[k][1]]);
    for (k = 0; k < hem.length; k++) pts.push([c0 + hem[k][0], hem[k][1]]);
    for (k = hem.length - 1; k >= 0; k--) pts.push([c0 - (k === hem.length - 1 ? hem[k][0] : hem[k][0]) + (k % 2 ? 4 : -2), hem[k][1] + (k % 2 ? -3 : 3)]);
    for (k = dx.length - 1; k >= 0; k--) pts.push([c0 - dx[k][0], dx[k][1]]);
    pts.push([c0, 242]);
    var d = K.lisciaChiusa(pts);
    var lining = K.mix(C, "#ffcf5a", 0.55), oro = lg(K, [[0, "#fff6c2"], [0.4, "#f7cc2e"], [1, "#9a6a08"]], 0, 0, 1, 1);
    s += ombraEl(K, c0, ye + 8, m540 + 96, 14, "#000000", 0.24);
    s += K.Pa(d, lg(K, [[0, K.chiaro(C, 0.34)], [0.3, C], [0.72, K.scuro(C, 0.34)], [1, K.scuro(C, 0.5)]]), " stroke='" + K.scuro(C, 0.5) + "' stroke-width='1.8' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(d) + "'>";
    // pieghe che partono dalle spalle e scendono aprendosi, più larghe e morbide
    for (i = -4; i <= 4; i++) {
      if (!i) continue;
      var fx = i * (m540 + 60) * 0.25, a1 = i > 0 ? 1 : -1;
      s += tratto(K, "M" + X(a1, nk + Math.abs(i) * 7) + " 270C" + n(c0 + fx * 0.4) + " 430 " + n(c0 + fx * 0.8) + " 630 " + n(c0 + fx * 1.02) + " " + (ye + 8), K.scuro(C, 0.52), 9 + Math.abs(i), i > 0 ? 0.28 : 0.14) +
        tratto(K, "M" + n(c0 + fx * 0.42 - 9) + " 430C" + n(c0 + fx * 0.8 - 9) + " 580 " + n(c0 + fx * 1.0 - 9) + " 720 " + n(c0 + fx * 1.04 - 9) + " " + (ye - 2), K.chiaro(C, 0.5), 3.4, 0.24);
    }
    // l'orlo si rivolta: si vede la fodera dorata
    [-1, 1].forEach(function (l) {
      var x1 = m540 + 84, x2 = m540 * 0.5 + 40;
      s += K.Pa("M" + X(l, x1 + 6) + " 812C" + X(l, x1 - 8) + " 826 " + X(l, x2 + 20) + " 836 " + X(l, x2) + " 852L" + X(l, x2 - 4) + " 880L" + X(l, x1 + 12) + " 880Z", lg(K, [[0, K.chiaro(lining, 0.3)], [1, K.scuro(lining, 0.22)]], l > 0 ? 0 : 1, 0, l > 0 ? 1 : 0, 0), " opacity='.95'") + tratto(K, "M" + X(l, x1 + 6) + " 812C" + X(l, x1 - 8) + " 826 " + X(l, x2 + 20) + " 836 " + X(l, x2) + " 852", K.scuro(C, 0.45), 2, 0.7);
    });
    s += ombraEl(K, c0, 338, B.sho + 8, 78, K.scuro(C, 0.62), 0.4);
    s += "</g>";
    var sop = "";
    if (!K.spalle) {   // davanti: il colletto e le due spalle del mantello sopra il vestito, con i fermagli dorati e la catenella
      [-1, 1].forEach(function (l) {
        var dd = "M" + X(l, nk - 2) + " 246C" + X(l, nk + 26) + " 242 " + X(l, xo - 8) + " 262 " + X(l, xo + 8) + " 290C" + X(l, xo + 14) + " 312 " + X(l, xo + 10) + " 336 " + X(l, xo - 4) + " 352C" + X(l, xo - 24) + " 322 " + X(l, nk + 14) + " 296 " + X(l, nk + 2) + " 276Z";
        sop += ombraEl(K, c0 + l * (xo - 6), 320, 30, 46, "#000000", 0.28);
        sop += K.Pa(dd, lg(K, [[0, K.chiaro(C, 0.32)], [0.5, C], [1, K.scuro(C, 0.4)]]), " stroke='" + K.scuro(C, 0.55) + "' stroke-width='2' stroke-linejoin='round'");
        sop += tratto(K, "M" + X(l, nk + 8) + " 252C" + X(l, nk + 28) + " 252 " + X(l, xo - 10) + " 270 " + X(l, xo + 2) + " 296", K.chiaro(C, 0.5), 2, 0.5) + tratto(K, "M" + X(l, nk + 18) + " 284C" + X(l, xo - 20) + " 306 " + X(l, xo - 14) + " 330 " + X(l, xo - 8) + " 346", K.scuro(C, 0.5), 2, 0.4);
      });
      var xc = nk + 14, cy = 268;
      sop += tratto(K, "M" + X(-1, xc) + " " + cy + "Q" + c0 + " " + (cy + 22) + " " + X(1, xc) + " " + cy, "#8a5a00", 5) + tratto(K, "M" + X(-1, xc) + " " + cy + "Q" + c0 + " " + (cy + 22) + " " + X(1, xc) + " " + cy, "#f7cc2e", 2.6);
      [-1, 1].forEach(function (l) { sop += K.El(c0 + l * xc, cy, 14, 14, oro, " stroke='#7a5206' stroke-width='1.8'") + K.Pa(stella(c0 + l * xc, cy, 8, 3.4), "#fff6c2", " opacity='.85'"); });
    } else {   // di spalle: la mantellina sulle spalle con il bordo dorato, i due fermagli e il colletto che gira intorno al collo
      var yk = "M" + X(-1, nk) + " 248Q" + c0 + " 238 " + X(1, nk) + " 248C" + X(1, B.shx - 6) + " 252 " + X(1, B.sho - 12) + " 266 " + X(1, B.sho + 2) + " 298C" + X(1, B.sho - 8) + " 330 " + X(1, B.ch) + " 350 " + X(1, B.ch - 20) + " 352Q" + c0 + " 372 " + X(-1, B.ch - 20) + " 352C" + X(-1, B.ch) + " 350 " + X(-1, B.sho - 8) + " 330 " + X(-1, B.sho + 2) + " 298C" + X(-1, B.sho - 12) + " 266 " + X(-1, B.shx - 6) + " 252 " + X(-1, nk) + " 248Z";
      s += ombraEl(K, c0, 360, B.sho, 22, "#000000", 0.3);
      s += K.Pa(yk, lg(K, [[0, K.chiaro(C, 0.3)], [0.5, K.scuro(C, 0.05)], [1, K.scuro(C, 0.42)]]), " stroke='" + K.scuro(C, 0.55) + "' stroke-width='1.8' stroke-linejoin='round'");
      s += tratto(K, "M" + X(-1, B.ch - 20) + " 351Q" + c0 + " 371 " + X(1, B.ch - 20) + " 351", "#8a5a00", 5.4) + tratto(K, "M" + X(-1, B.ch - 20) + " 351Q" + c0 + " 371 " + X(1, B.ch - 20) + " 351", "#f7cc2e", 2.8);
      for (i = -3; i <= 3; i++) if (i) s += tratto(K, "M" + n(c0 + i * 5) + " 256Q" + n(c0 + i * 12) + " 300 " + n(c0 + i * 22) + " 350", K.scuro(C, 0.5), 3, 0.3);
      [-1, 1].forEach(function (l) { s += K.El(c0 + l * (B.sho - 14), 300, 12, 12, oro, " stroke='#7a5206' stroke-width='1.6'") + K.Pa(stella(c0 + l * (B.sho - 14), 300, 7, 3), "#fff6c2", " opacity='.85'") + tratto(K, "M" + X(l, B.sho - 14) + " 312L" + X(l, B.sho - 20) + " 348", "#f7cc2e", 2, 0.8); });
      s += tratto(K, "M" + X(-1, nk + 4) + " 252Q" + c0 + " 276 " + X(1, nk + 4) + " 252", K.scuro(C, 0.5), 16) + tratto(K, "M" + X(-1, nk + 4) + " 252Q" + c0 + " 276 " + X(1, nk + 4) + " 252", K.chiaro(C, 0.15), 11);
      s += K.Pa("M" + (c0 - 9) + " 268h18v12q-9 5 -18 0Z", oro, " stroke='#7a5206' stroke-width='1.4' stroke-linejoin='round'");
    }
    return { dietro: s, sopra: sop };
  });

  // ---------- ali d'angelo ----------
  A.pezzo("schiena", "ali", function (K) {
    var C = pal(K, "colSchiena"), c0 = K.C, st = K.mix("#98a8c6", C, 0.22), s = "", rx = c0 + 34, ry = 318;
    // sagoma di un'ala (a destra): arco in alto, punta, bordo di sotto a penne con le tacche tra una penna e l'altra
    var tips = [[262, 150], [258, 206], [244, 262], [220, 312], [186, 356], [144, 388], [98, 404]], notch = [[246, 166], [238, 226], [218, 280], [186, 330], [150, 366], [106, 388]];
    var d = "M" + rx + " " + ry + "C" + (rx + 14) + " 250 " + (rx + 54) + " 168 " + (rx + 126) + " 132C" + (rx + 186) + " 106 " + (rx + 218) + " 118 " + (c0 + tips[0][0]) + " " + tips[0][1];
    tips.forEach(function (t, i) { if (i) d += "Q" + (c0 + notch[i - 1][0] - 12) + " " + notch[i - 1][1] + " " + (c0 + t[0]) + " " + t[1]; });
    d += "Q" + (c0 + 60) + " 392 " + rx + " " + (ry + 26) + "Z";
    var fW = lg(K, [[0, "#ffffff"], [0.6, "#f4f7fc"], [1, K.mix("#c9d6ee", C, 0.14)]], 0, 0, 0.7, 1), fW2 = lg(K, [[0, "#ffffff"], [1, K.mix("#e4ecf8", C, 0.1)]], 0, 0, 0, 1);
    var one = "", sca = [[1, 0, fW], [0.7, -7, fW2], [0.42, -14, fW]];
    sca.forEach(function (q, qi) {
      one += "<g transform='translate(" + rx + " " + ry + ") rotate(" + q[1] + ") scale(" + q[0] + ") translate(" + (-rx) + " " + (-ry) + ")'>" + K.Pa(d, q[2], " stroke='" + st + "' stroke-width='" + n(2.2 / q[0]) + "' stroke-linejoin='round'");
      if (qi === 0) notch.forEach(function (t) { one += tratto(K, "M" + (c0 + t[0] - 8) + " " + t[1] + "L" + n(rx + (c0 + t[0] - rx) * 0.4) + " " + n(ry + (t[1] - ry) * 0.45), st, 1.3, 0.45); });
      one += "</g>";
    });
    one += tratto(K, "M" + (rx + 14) + " " + (ry - 14) + "C" + (rx + 30) + " 250 " + (rx + 68) + " 178 " + (rx + 124) + " 147", "#ffffff", 3.6, 0.8);
    one = "<g transform='translate(" + rx + " " + (ry + 8) + ") scale(1.24) translate(" + (-rx) + " " + (-ry - 8) + ")'>" + one + "</g>";
    var cin = K.mix("#dfe6f4", C, 0.35);
    s += one + spec(one, c0);
    return { dietro: s + (K.spalle ? attacchi(K, cin) : ""), sopra: K.spalle ? "" : cinghie(K, cin, 6.5) };
  });

  // ---------- ali di fata (farfalla) ----------
  A.pezzo("schiena", "farfalla", function (K) {
    var C = pal(K, "colSchiena"), c0 = K.C, s = "", x0 = 34;
    var su = "M" + (c0 + x0) + " 312C" + (c0 + x0 + 24) + " 228 " + (c0 + 160) + " 150 " + (c0 + 204) + " 196C" + (c0 + 224) + " 246 " + (c0 + 160) + " 322 " + (c0 + x0 + 4) + " 338Z";
    var giu = "M" + (c0 + x0 + 2) + " 340C" + (c0 + 112) + " 336 " + (c0 + 190) + " 396 " + (c0 + 152) + " 452C" + (c0 + 118) + " 494 " + (c0 + 62) + " 430 " + (c0 + x0 + 4) + " 368Z";
    var gr = lg(K, [[0, K.chiaro(C, 0.55)], [0.55, C], [1, K.mix(C, "#ffffff", 0.18)]], 0, 0, 1, 0.3);
    function ala() {
      var o = "";
      o += K.Pa(su, gr, " fill-opacity='.84' stroke='" + K.scuro(C, 0.35) + "' stroke-width='2.6' stroke-linejoin='round'");
      o += K.Pa(giu, gr, " fill-opacity='.78' stroke='" + K.scuro(C, 0.35) + "' stroke-width='2.6' stroke-linejoin='round'");
      o += "<g clip-path='" + K.clip([su, giu]) + "'>";
      o += tratto(K, "M" + (c0 + x0 + 2) + " 322Q" + (c0 + 100) + " 250 " + (c0 + 190) + " 190M" + (c0 + x0 + 2) + " 326Q" + (c0 + 110) + " 300 " + (c0 + 208) + " 236M" + (c0 + x0 + 2) + " 332Q" + (c0 + 100) + " 336 " + (c0 + 180) + " 310M" + (c0 + x0 + 4) + " 346Q" + (c0 + 100) + " 380 " + (c0 + 150) + " 430M" + (c0 + x0 + 4) + " 352Q" + (c0 + 100) + " 350 " + (c0 + 172) + " 400", "#ffffff", 2.2, 0.55);
      o += tratto(K, su, K.scuro(C, 0.25), 9, 0.25) + tratto(K, giu, K.scuro(C, 0.25), 8, 0.25);
      [[150, 210, 17], [176, 240, 10], [118, 270, 8]].forEach(function (q) { o += K.El(c0 + q[0], q[1], q[2], q[2], "none", " stroke='#ffffff' stroke-width='3' opacity='.6'") + op(K.El(c0 + q[0], q[1], q[2] * 0.4, q[2] * 0.4, "#ffffff"), 0.7); });
      [[110, 410, 11], [136, 424, 7]].forEach(function (q) { o += K.El(c0 + q[0], q[1], q[2], q[2], "none", " stroke='#ffffff' stroke-width='3' opacity='.55'") + op(K.El(c0 + q[0], q[1], q[2] * 0.4, q[2] * 0.4, "#ffffff"), 0.7); });
      o += "</g>";
      return o;
    }
    var one = "<g transform='translate(" + (c0 + x0) + " 334) scale(1.2) translate(" + (-c0 - x0) + " -334)'>" + ala() + "</g>";
    s += one + spec(one, c0);
    var cin = K.mix("#fbeef6", C, 0.3);
    return { dietro: s + (K.spalle ? attacchi(K, cin) : ""), sopra: K.spalle ? "" : cinghie(K, cin, 6) };
  });

  // ---------- ali da pipistrello ----------
  A.pezzo("schiena", "pipistrello", function (K) {
    var C = pal(K, "colSchiena"), c0 = K.C, s = "", M = K.mix("#8c5cb4", C, 0.28);
    if (K.lum(M) < 0.34) M = K.chiaro(M, 0.4);   // mai scuro come lo sfondo di notte
    var X = function (v) { return c0 + v; };
    var d = "M" + X(34) + " 306L" + X(122) + " 196L" + X(212) + " 138Q" + X(196) + " 196 " + X(220) + " 248Q" + X(184) + " 262 " + X(196) + " 338Q" + X(154) + " 326 " + X(148) + " 404Q" + X(96) + " 372 " + X(36) + " 440Z";
    var os = K.chiaro(M, 0.55);
    var one = K.Pa(d, lg(K, [[0, K.chiaro(M, 0.4)], [0.5, M], [1, K.scuro(M, 0.28)]], 0, 0, 1, 1), " stroke='" + K.chiaro(M, 0.45) + "' stroke-width='2.4' stroke-linejoin='round'");
    one += "<g clip-path='" + K.clip(d) + "'>" + ombraEl(K, X(160), 340, 60, 100, K.scuro(M, 0.6), 0.3) + op(K.El(X(110), 230, 40, 20, "#ffffff"), 0.1) + "</g>";
    var tips = [[212, 138], [220, 248], [196, 338], [148, 404]];
    tips.forEach(function (t) { one += tratto(K, "M" + X(122) + " 196L" + X(t[0]) + " " + t[1], K.scuro(M, 0.45), 8) + tratto(K, "M" + X(122) + " 196L" + X(t[0]) + " " + t[1], os, 4.4); });
    one += tratto(K, "M" + X(34) + " 308L" + X(122) + " 196", K.scuro(M, 0.45), 10) + tratto(K, "M" + X(34) + " 308L" + X(122) + " 196", os, 6) + tratto(K, "M" + X(36) + " 440L" + X(136) + " 338", os, 2.2, 0.6);
    one += K.El(X(122), 194, 9, 9, os, " stroke='" + K.scuro(M, 0.5) + "' stroke-width='2'") + tratto(K, "M" + X(122) + " 186Q" + X(130) + " 168 " + X(142) + " 164", "#f1ecf8", 4.2);
    s += one + spec(one, c0);
    var cin = K.mix("#4a3a5a", C, 0.3);
    return { dietro: s + (K.spalle ? attacchi(K, cin) : ""), sopra: K.spalle ? "" : cinghie(K, cin, 6.5) };
  });

  // ====== ANIMALETTI (a terra, accanto: x tra 330 e 590, zampe a y 999) ======
  function morbido(K, F) { return K.mix(F, '#9a948c', 0.14); }
  function pelo(K, F) { return rg(K, [[0, K.chiaro(F, 0.26)], [0.5, F], [1, K.scuro(F, 0.34)]], 0.3, 0.26, 1); }
  // contorni morbidi (niente linee nere da fumetto): il bordo è un'ombra dello stesso colore, sottile e trasparente
  // pelo: tanti trattini corti in due soli tracciati (uno scuro e uno chiaro), dentro una forma ritagliata
  function pellicce(K, clipD, cx, cy, rx, ry, num, F, seed, giu) {
    var r = K.rnd(seed), sc = "", ch = "", i;
    for (i = 0; i < num; i++) {
      var a = r() * 6.283, d = Math.sqrt(r()), x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d, L = 8 + r() * 8, dx = (x - cx) / rx * 6 * (giu == null ? 1 : giu), q = "M" + n(x) + " " + n(y) + "q" + n(dx * 0.4) + " " + n(L * 0.5) + " " + n(dx) + " " + n(L);
      if (i % 3) sc += q; else ch += q;
    }
    return "<g clip-path='" + K.clip(clipD) + "'>" + tratto(K, sc, K.scuro(F, 0.4), 1.4, 0.3) + tratto(K, ch, K.chiaro(F, 0.55), 1.5, 0.45) + "</g>";
  }
  function morbidi(s) { return s.replace(/ stroke='([^']*)' stroke-width='([d.]+)'/g, function (m, c, w) { return " stroke='" + c + "' stroke-opacity='.4' stroke-width='" + n(Math.max(0.7, +w * 0.55)) + "'"; }); }
  function ani(K, s, sc, x) { s = morbidi(s); return "<g transform='translate(" + (x || 374) + " 996) scale(" + (sc || 1) + ")'>" + K.El(2, 0, 112, 17, K.soft("#000000", 0.3)) + K.El(0, -3, 74, 9, K.soft("#000000", 0.4)) + s + "</g>"; }
  function occhioTondo(K, x, y, r) { r *= 0.86; return K.El(x, y - r * 0.5, r * 1.15, r * 0.8, K.soft('#000000', 0.18)) +  K.El(x, y, r, r * 1.1, rg(K, [[0, "#5a4636"], [0.5, "#1c1410"], [1, "#0a0605"]], 0.4, 0.4, 0.7)) + op(K.El(x - r * 0.32, y - r * 0.4, r * 0.34, r * 0.34, "#ffffff"), 0.95) + op(K.El(x + r * 0.3, y + r * 0.35, r * 0.16, r * 0.16, "#ffffff"), 0.6); }
  function baffi(K, F, y, dir) { var c = K.lum(F) > 0.55 ? "#7d8594" : "#ffffff", o = ""; for (var i = 0; i < 3; i++) o += tratto(K, "M" + dir * 34 + " " + (y + i * 5) + "Q" + dir * 62 + " " + (y - 8 + i * 9) + " " + dir * 92 + " " + (y - 10 + i * 13), c, 1.5, 0.85); return o; }

  // ---------- gatto ----------
  A.pezzo("animale", "gatto", function (K) {
    var F = morbido(K, pal(K, "colAnimale")), lF = K.chiaro(F, 0.42), dF = K.scuro(F, 0.3), bo = K.scuro(F, 0.4), P = pelo(K, F), s = "", sp = K.spalle, i;
    var coda = sp ? "M0 -14C70 -4 118 -50 104 -120" : "M50 -22C112 -20 132 -72 108 -122";
    s += tratto(K, coda, bo, 31) + tratto(K, coda, F, 26) + tratto(K, coda, dF, 26, 0.45).replace("stroke-linecap='round'", "stroke-linecap='butt' stroke-dasharray='7 17'") + tratto(K, coda, K.chiaro(F, 0.3), 7, 0.45);
    var bd = "M-58 -2C-72 -40 -62 -108 -28 -134C-10 -146 10 -146 28 -134C62 -108 72 -40 58 -2Q0 8 -58 -2Z";
    s += K.Pa(bd, P, " stroke='" + bo + "' stroke-width='1.7' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(bd) + "'>" + ombraEl(K, 48, -60, 24, 80, K.scuro(F, 0.45), 0.32) + (sp ? "" : op(K.El(0, -58, 31, 54, lF), 0.55)) + "</g>";
    if (sp) { [-1, 1].forEach(function (l) { s += K.El(l * 34, -10, 22, 13, K.chiaro(F, 0.12), " stroke='" + bo + "' stroke-width='1.4'"); }); for (i = 0; i < 4; i++) s += tratto(K, "M" + (-30 + i * 4) + " " + (-110 + i * 18) + "Q0 " + (-100 + i * 18) + " " + (30 - i * 4) + " " + (-110 + i * 18), dF, 4, 0.3); }
    else [-1, 1].forEach(function (l) { s += K.El(l * 24, -10, 21, 14, lF, " stroke='" + bo + "' stroke-width='1.4'") + tratto(K, "M" + (l * 24 - 8) + " -21L" + (l * 24 - 7) + " -14M" + (l * 24 + 8) + " -21L" + (l * 24 + 7) + " -14", bo, 1.2, 0.5); });
    s += pellicce(K, bd, 0, -70, 56, 64, 26, F, 11) + op(K.El(-54, -66, 9, 58, "#ffffff"), 0.16) + ombraEl(K, 0, -122, 56, 20, K.scuro(F, 0.6), 0.42);
    s += "<g transform='rotate(-11 0 -128)'>";
    var tes = "M-66 -170C-66 -216 -34 -232 0 -232C34 -232 66 -216 66 -170C66 -134 34 -122 0 -122C-34 -122 -66 -134 -66 -170Z";
    [-1, 1].forEach(function (l) {
      var e = "M" + l * 58 + " -204L" + l * 72 + " -272L" + l * 16 + " -228Z";
      s += K.Pa(e, K.scuro(F, 0.08), " stroke='" + bo + "' stroke-width='1.6' stroke-linejoin='round'") + K.Pa("M" + l * 54 + " -210L" + l * 64 + " -258L" + l * 30 + " -228Z", sp ? K.scuro(F, 0.2) : "#ffb3c7", " stroke='none'");
    });
    s += K.Pa(tes, P, " stroke='" + bo + "' stroke-width='1.7' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(tes) + "'>" + ombraEl(K, 44, -150, 34, 56, K.scuro(F, 0.45), 0.3) + op(K.El(-30, -208, 30, 14, "#ffffff"), 0.22) + "</g>" + pellicce(K, tes, 0, -176, 60, 44, 22, F, 12);
    if (!sp) {
      s += tratto(K, "M0 -230L0 -212M-14 -228L-11 -214M14 -228L11 -214", dF, 4.4, 0.5);
      [-1, 1].forEach(function (l) {
        var ex = l * 28, ey = -178;
        s += "<g transform='translate(" + ex + " " + ey + ") scale(" + l + " 1)'>" + K.Pa("M-15 0C-9 -14 9 -14 15 0C9 14 -9 14 -15 0Z", rg(K, [[0, "#e6ff9a"], [0.55, "#98d93a"], [1, "#4a8a1c"]], 0.4, 0.3, 0.9), " stroke='#1c1a14' stroke-width='1.8'") + K.El(0, 0, 3.6, 11, "#0d0a08") + op(K.El(-3, -4, 2.6, 2.6, "#ffffff"), 0.95) + "</g>";
        s += op(K.El(l * 44, -150, 14, 9, "#ff8fa3"), 0.3);
      });
      s += K.Pa("M-8 -153L8 -153L0 -142Z", "#ff8fa3", " stroke='#c2456a' stroke-width='1.3' stroke-linejoin='round'") + tratto(K, "M0 -142V-134M0 -134Q-9 -125 -18 -132M0 -134Q9 -125 18 -132", bo, 2) + baffi(K, F, -148, -1) + baffi(K, F, -148, 1);
    } else {
      s += tratto(K, "M-40 -222Q0 -240 40 -222", K.chiaro(F, 0.3), 6, 0.35);
    }
    s += "</g>";
    return ani(K, s, 0.86, 372);
  });

  // ---------- cane ----------
  A.pezzo("animale", "cane", function (K) {
    var F = morbido(K, pal(K, "colAnimale")), lF = K.chiaro(F, 0.42), dF = K.scuro(F, 0.26), bo = K.scuro(F, 0.4), P = pelo(K, F), s = "", sp = K.spalle;
    var coda = sp ? "M0 -22C6 -70 28 -104 40 -134" : "M56 -20C100 -26 118 -66 106 -112";
    s += tratto(K, coda, bo, 24) + tratto(K, coda, F, 19) + tratto(K, coda, K.chiaro(F, 0.3), 5, 0.4);
    var bd = "M-64 -2C-76 -44 -64 -104 -30 -122C-10 -132 10 -132 30 -122C64 -104 76 -44 64 -2Q0 8 -64 -2Z";
    s += K.Pa(bd, P, " stroke='" + bo + "' stroke-width='1.7' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(bd) + "'>" + ombraEl(K, 54, -58, 26, 76, K.scuro(F, 0.45), 0.32) + (sp ? "" : op(K.El(0, -48, 32, 48, lF), 0.5)) + "</g>";
    [-1, 1].forEach(function (l) { s += K.El(l * (sp ? 36 : 26), -10, 22, 14, sp ? F : lF, " stroke='" + bo + "' stroke-width='1.4'") + (sp ? "" : tratto(K, "M" + (l * 26 - 8) + " -21L" + (l * 26 - 7) + " -14M" + (l * 26 + 8) + " -21L" + (l * 26 + 7) + " -14", bo, 1.2, 0.5)); });
    s += pellicce(K, bd, 0, -62, 60, 56, 24, F, 21) + op(K.El(-58, -60, 9, 52, "#ffffff"), 0.16) + ombraEl(K, 0, -112, 54, 18, K.scuro(F, 0.6), 0.4);
    s += "<g transform='rotate(-11 0 -118)'>";
    var th = "M-60 -160C-60 -206 -30 -222 0 -222C30 -222 60 -206 60 -160C60 -126 30 -112 0 -112C-30 -112 -60 -126 -60 -160Z";
    s += K.Pa(th, P, " stroke='" + bo + "' stroke-width='1.7' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(th) + "'>" + ombraEl(K, 42, -150, 30, 56, K.scuro(F, 0.45), 0.3) + op(K.El(-26, -206, 28, 12, "#ffffff"), 0.2) + "</g>" + pellicce(K, th, 0, -170, 56, 40, 18, F, 22);
    s += tratto(K, "M-40 -112Q0 -98 40 -112", "#c2255c", 13, 1) + tratto(K, "M-40 -112Q0 -98 40 -112", "#f06595", 9) + (sp ? "" : K.El(0, -92, 9, 9, rg(K, [[0, "#fff3b0"], [1, "#b8860b"]], 0.4, 0.35, 0.8), " stroke='#7a5206' stroke-width='1.2'"));
    [-1, 1].forEach(function (l) {
      var e = "M" + l * 46 + " -210C" + l * 78 + " -218 " + l * 98 + " -188 " + l * 92 + " -140C" + l * 90 + " -116 " + l * 68 + " -112 " + l * 60 + " -130C" + l * 56 + " -152 " + l * 50 + " -184 " + l * 46 + " -210Z";
      s += K.Pa(e, lg(K, [[0, K.chiaro(dF, 0.1)], [1, K.scuro(dF, 0.3)]]), " stroke='" + bo + "' stroke-width='1.6' stroke-linejoin='round'") + tratto(K, "M" + l * 62 + " -196C" + l * 80 + " -176 " + l * 84 + " -150 " + l * 76 + " -128", K.chiaro(dF, 0.3), 3, 0.4);
    });
    if (!sp) {
      s += K.El(0, -140, 36, 28, lF) + op(K.El(-10, -150, 14, 8, "#ffffff"), 0.25);
      s += K.El(0, -154, 14, 10, rg(K, [[0, "#6a5a52"], [0.5, "#241a17"], [1, "#0a0605"]], 0.4, 0.35, 0.8)) + op(K.El(-4, -157, 4.4, 2.4, "#ffffff"), 0.7);
      s += tratto(K, "M0 -144V-134M0 -134Q-12 -120 -26 -130M0 -134Q12 -120 26 -130", bo, 2.2) + K.Pa("M-9 -127Q0 -96 9 -127Z", "#ff8fa3", " stroke='#c2456a' stroke-width='1.4' stroke-linejoin='round'");
      s += occhioTondo(K, -25, -180, 8.4) + occhioTondo(K, 25, -180, 8.4) + op(K.El(-25, -198, 7, 3.4, lF), 0.9) + op(K.El(25, -198, 7, 3.4, lF), 0.9);
    }
    s += "</g>";
    return ani(K, s, 1.02, 376);
  });

  // ---------- coniglio ----------
  A.pezzo("animale", "coniglio", function (K) {
    var F = morbido(K, pal(K, "colAnimale")), lF = K.chiaro(F, 0.45), bo = K.scuro(F, 0.45), P = pelo(K, F), s = "", sp = K.spalle;
    s += K.El(sp ? 0 : 60, sp ? -30 : -34, sp ? 24 : 21, sp ? 24 : 21, rg(K, [[0, "#ffffff"], [1, "#cfd5e0"]], 0.4, 0.35, 0.8), " stroke='#aab2c0' stroke-width='1.6'");
    s += K.El(0, -72, 64, 72, P, " stroke='" + bo + "' stroke-width='1.7'");
    s += op(K.El(-18, -96, 20, 38, "#ffffff"), 0.16);
    s += "<g clip-path='" + K.clip(cerchio(0, -72, 62)) + "'>" + ombraEl(K, 58, -66, 26, 84, K.scuro(F, 0.45), 0.3) + (sp ? "" : op(K.El(0, -62, 38, 52, lF), 0.85)) + "</g>";
    [-1, 1].forEach(function (l) { s += K.El(l * 52, -14, 28, 16, F, " stroke='" + bo + "' stroke-width='1.4'") + (sp ? "" : K.El(l * 22, -12, 15, 19, lF, " stroke='" + bo + "' stroke-width='1.4'")); });
    [-1, 1].forEach(function (l) {
      var e = "M" + l * 30 + " -204C" + l * 56 + " -262 " + l * 48 + " -322 " + l * 24 + " -328C" + l * 4 + " -324 " + l * 2 + " -262 " + l * 4 + " -206Z";
      s += K.Pa(e, lg(K, [[0, K.chiaro(F, 0.2)], [1, K.scuro(F, 0.18)]]), " stroke='" + bo + "' stroke-width='1.6' stroke-linejoin='round'") + K.Pa("M" + l * 30 + " -214C" + l * 48 + " -262 " + l * 42 + " -308 " + l * 24 + " -316C" + l * 12 + " -308 " + l * 10 + " -262 " + l * 12 + " -216Z", sp ? K.scuro(F, 0.12) : "#ffc4d8", " stroke='none'");
    });
    s += pellicce(K, cerchio(0, -72, 62), 0, -72, 56, 62, 24, F, 31) + ombraEl(K, 0, -120, 50, 16, K.scuro(F, 0.6), 0.4);
    var th = "M-58 -166C-58 -208 -30 -222 0 -222C30 -222 58 -208 58 -166C58 -132 30 -118 0 -118C-30 -118 -58 -132 -58 -166Z";
    s += K.Pa(th, P, " stroke='" + bo + "' stroke-width='1.7' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(th) + "'>" + ombraEl(K, 42, -150, 28, 52, K.scuro(F, 0.45), 0.3) + op(K.El(-24, -206, 26, 11, "#ffffff"), 0.22) + "</g>" + pellicce(K, th, 0, -168, 52, 38, 16, F, 32);
    if (!sp) {
      [-1, 1].forEach(function (l) { s += op(K.El(l * 28, -146, 26, 19, lF), 0.9) + op(K.El(l * 44, -156, 12, 8, "#ff8fa3"), 0.3); });
      s += occhioTondo(K, -22, -172, 8.6) + occhioTondo(K, 22, -172, 8.6);
      s += K.Pa("M-7 -152Q0 -156 7 -152Q5 -144 0 -142Q-5 -144 -7 -152Z", "#ff7a9c", " stroke='#c2456a' stroke-width='1.2' stroke-linejoin='round'") + tratto(K, "M0 -142V-135M0 -135Q-9 -127 -17 -134M0 -135Q9 -127 17 -134", bo, 2);
      s += K.Pa("M-7 -134h6v14h-6ZM1 -134h6v14h-6Z", "#ffffff", " stroke='#b8bfcc' stroke-width='1.2' stroke-linejoin='round'") + baffi(K, F, -146, -1) + baffi(K, F, -146, 1);
    }
    return ani(K, s, 0.8, 370);
  });

  // ---------- pulcino ----------
  A.pezzo("animale", "pulcino", function (K) {
    var Y = "#ffd43b", bo = "#c88a00", s = "", sp = K.spalle;
    [-1, 1].forEach(function (l) { s += tratto(K, "M" + l * 24 + " -24L" + l * 24 + " -4", "#e8710a", 6) + tratto(K, "M" + (l * 24 - 12) + " -3L" + (l * 24 + 12) + " -3", "#e8710a", 5); });
    var bd = "M-64 -64C-66 -110 -34 -136 0 -136C34 -136 66 -110 64 -64C62 -28 34 -20 0 -20C-34 -20 -62 -28 -64 -64Z";
    s += K.Pa(bd, rg(K, [[0, "#fff6a8"], [0.55, Y], [1, "#e09a00"]], 0.36, 0.3, 0.95), " stroke='" + bo + "' stroke-width='1.7' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(bd) + "'>" + ombraEl(K, 52, -60, 24, 70, "#a86a00", 0.35) + op(K.El(-22, -108, 24, 14, "#ffffff"), 0.4) + "</g>";
    s += pellicce(K, bd, 0, -76, 56, 50, 22, "#ffd43b", 41, 0.8) + ombraEl(K, 0, -24, 48, 12, "#a86a00", 0.4) + tratto(K, "M-8 -134Q-12 -156 -2 -164M4 -136Q6 -158 18 -160", bo, 5.6, 0.9) + tratto(K, "M-8 -134Q-12 -156 -2 -164M4 -136Q6 -158 18 -160", Y, 3.2);
    [-1, 1].forEach(function (l) { s += "<g transform='translate(" + l * 60 + " -62) rotate(" + l * 14 + ")'>" + K.Pa("M0 -22C" + l * 14 + " -16 " + l * 16 + " 14 0 28C" + (-l * 6) + " 12 " + (-l * 6) + " -10 0 -22Z", lg(K, [[0, "#ffe27a"], [1, "#e8a800"]]), " stroke='" + bo + "' stroke-width='1.4' stroke-linejoin='round'") + "</g>"; });
    if (!sp) {
      s += occhioTondo(K, -25, -88, 7.6) + occhioTondo(K, 25, -88, 7.6);
      s += op(K.El(-42, -66, 12, 8, "#ff8787"), 0.45) + op(K.El(42, -66, 12, 8, "#ff8787"), 0.45);
      s += K.Pa("M-12 -76L12 -76L0 -56Z", lg(K, [[0, "#ffb347"], [1, "#e8710a"]], 0, 0, 0, 1), " stroke='#a8470a' stroke-width='1.6' stroke-linejoin='round'");
      s += op(K.Pa("M-12 -76Q0 -80 12 -76L0 -70Z", "#ffc268"), 0.8);
    } else s += tratto(K, "M0 -26L-18 -14M0 -26L0 -10M0 -26L18 -14", bo, 3);
    return ani(K, "<g transform='rotate(-8 0 -24)'>" + s + "</g>", 0.85, 368);
  });

  // ---------- pappagallo ----------
  A.pezzo("animale", "pappagallo", function (K) {
    var R = "#e03131", Bl = "#1c7ed6", Gi = "#ffd43b", bo = "#7e1414", s = "", sp = K.spalle;
    [[-12, "#1c7ed6", "#0b4a8b"], [14, "#e03131", "#8a1c1c"], [34, "#ffd43b", "#b8860b"]].forEach(function (q) {
      var x = q[0], d = "M" + (x * 0.2) + " -90C" + (x - 14) + " -50 " + (x - 18) + " -20 " + x + " -6C" + (x + 16) + " -22 " + (x + 14) + " -50 " + (x * 0.2 + 8) + " -90Z";
      s += K.Pa(d, lg(K, [[0, K.chiaro(q[1], 0.3)], [1, q[1]]], 0, 0, 1, 0), " stroke='" + q[2] + "' stroke-width='1.4' stroke-linejoin='round'");
    });
    [-1, 1].forEach(function (l) { s += tratto(K, "M" + l * 14 + " -30L" + l * 14 + " -4", "#868e96", 6) + tratto(K, "M" + (l * 14 - 12) + " -3L" + (l * 14 + 12) + " -3", "#868e96", 5); });
    var bd = "M-50 -120C-52 -176 -30 -204 0 -204C30 -204 52 -176 50 -120C48 -66 26 -36 0 -36C-26 -36 -48 -66 -50 -120Z";
    s += K.Pa(bd, rg(K, [[0, "#ff8a7a"], [0.55, R], [1, "#8c1a1a"]], 0.36, 0.3, 0.95), " stroke='" + bo + "' stroke-width='1.7' stroke-linejoin='round'");
    [-1, 1].forEach(function (l) {
      var ala = "M" + l * 42 + " -176C" + l * 66 + " -150 " + l * 70 + " -90 " + l * 52 + " -48C" + l * 46 + " -38 " + l * 34 + " -50 " + l * 30 + " -66C" + l * 28 + " -110 " + l * 34 + " -150 " + l * 42 + " -176Z";
      s += K.Pa(ala, lg(K, [[0, K.chiaro(Bl, 0.25)], [1, K.scuro(Bl, 0.25)]]), " stroke='#0b4a8b' stroke-width='1.5' stroke-linejoin='round'") + "<g clip-path='" + K.clip(ala) + "'>" + K.Pa("M" + l * 20 + " -150L" + l * 80 + " -150L" + l * 80 + " -110L" + l * 20 + " -110Z", Gi, " opacity='.95'") + "</g>" + tratto(K, "M" + l * 40 + " -168C" + l * 52 + " -130 " + l * 50 + " -80 " + l * 42 + " -56", "#ffffff", 2, 0.3);
    });
    var sq = "", rr0, cc0;
    for (rr0 = 0; rr0 < 5; rr0++) for (cc0 = 0; cc0 < 3; cc0++) sq += "M" + (-20 + cc0 * 20 + (rr0 % 2) * 10 - 8) + " " + (-170 + rr0 * 22) + "q8 10 16 0";
    s += "<g clip-path='" + K.clip(bd) + "'>" + tratto(K, sq, "#7e1414", 1.8, 0.4) + op(K.El(-30, -130, 8, 56, "#ffffff"), 0.2) + ombraEl(K, 0, -200, 40, 14, "#4a0a0a", 0.4) + "</g>";
    var th = "M-44 -236C-44 -272 -22 -290 0 -290C22 -290 44 -272 44 -236C44 -212 24 -198 0 -198C-24 -198 -44 -212 -44 -236Z";
    s += K.Pa(th, rg(K, [[0, "#ff8a7a"], [0.55, R], [1, "#8c1a1a"]], 0.36, 0.3, 0.95), " stroke='" + bo + "' stroke-width='1.7' stroke-linejoin='round'");
    s += "<g clip-path='" + K.clip(th) + "'>" + ombraEl(K, 34, -240, 20, 50, "#4a0a0a", 0.3) + "</g>";
    if (!sp) {
      [-1, 1].forEach(function (l) { s += K.El(l * 20, -246, 16, 14, "#fff7ee", " stroke='#caa89a' stroke-width='1.4'") + K.El(l * 20, -246, 6.6, 6.6, "#1a0e0a") + op(K.El(l * 18, -249, 2.2, 2.2, "#ffffff"), 0.95); });
      s += K.Pa("M-18 -238C-20 -214 -8 -192 0 -186C8 -192 20 -214 18 -238Q0 -250 -18 -238Z", lg(K, [[0, "#f0ece4"], [0.55, "#bfb8ab"], [1, "#6c6558"]]), " stroke='#3a3630' stroke-width='1.4' stroke-linejoin='round'") + K.Pa("M-9 -198Q0 -186 9 -198Q0 -194 -9 -198Z", "#3a3630") + op(K.El(-6, -226, 4, 10, "#ffffff"), 0.6);
    } else s += tratto(K, "M-30 -276Q0 -296 30 -276", K.chiaro(R, 0.4), 5, 0.4);
    // appollaiato su un trespolo di legno accanto all'avatar, a mezza altezza, con la testa girata verso di lui
    var py = 640, W = "#8a5a32", Wd = "#4e2f18", st = "";
    st += K.El(0, 0, 54, 9, K.soft("#000000", 0.4)) + K.Pa("M-46 0Q-46 -14 -30 -15L30 -15Q46 -14 46 0Z", lg(K, [[0, "#b07a48"], [0.5, W], [1, Wd]]), " stroke='" + Wd + "' stroke-opacity='.5' stroke-width='1.4' stroke-linejoin='round'");
    st += K.Pa("M-6 -12L6 -12L5 " + (-(996 - py)) + "L-5 " + (-(996 - py)) + "Z", lg(K, [[0, "#b98250"], [0.5, W], [1, Wd]]), " stroke='" + Wd + "' stroke-opacity='.5' stroke-width='1.2'");
    st += K.Pa("M-52 " + (-(996 - py) - 3) + "L56 " + (-(996 - py) - 3) + "L56 " + (-(996 - py) + 9) + "L-52 " + (-(996 - py) + 9) + "Z", lg(K, [[0, "#b98250"], [0.5, W], [1, Wd]], 0, 0, 0, 1), " stroke='" + Wd + "' stroke-opacity='.5' stroke-width='1.2' stroke-linejoin='round'");
    var bird = morbidi(s), ptop = -(996 - py) - 3;
    return "<g transform='translate(446 996)'>" + st + "<g transform='translate(2 " + (ptop + 8) + ") rotate(-9) scale(.86)'><g transform='scale(1.26 1)'>" + bird + "</g></g></g>";
  });

})();

/* EXTRA-B, pezzi fatti (tutti e 24, tutte le voci di OPZ):
   inmano (13): palloncino, gelato, lecca, fiore, microfono, telefono, tazza, libro, pizza, bacchetta, bandiera, pallone, trofeo
   schiena (6): zaino (spallacci in sopra; di spalle e piu stretto per non coprire le braccia), chitarra (tracolla in sopra), mantello (fermagli in sopra), ali, farfalla, pipistrello
   animale (5): gatto, cane, coniglio, pulcino, pappagallo (tutti anche di spalle, K.spalle)
   Note: seduto il motore non disegna le cose in mano (braccia davanti): niente da fare nel pezzo. Pulcino e pappagallo: colori fissi come prima (colAnimale non li cambia).
   Nessun pezzo da sostituire con un simile. */
/* SECONDO GIRO (extra6, 5 nov 2026): animali piu grandi e vicini al piede (gatto e cane alzano la testa verso l'avatar, pulcino inclinato, coniglio piu grande);
   pappagallo su un trespolo di legno a mezza altezza accanto all'avatar; telefono grande con lo schermo libero; microfono con la testa sopra il pugno;
   libro tenuto per il dorso e appeso fuori dal fianco; gelato staccato dal corpo. Girocollo (extra-a.js): y0 231 -> 221. Copie di sicurezza in aiutanti/extra6/*.bak.js */


// ---- varie ----
// VARIE (secondo tempo, seconda metà): stampe sulla maglia, capo «supereroe», scarpe «pattini».
(function () {
  var A = window.SGOminoA; if (!A) return;
  var nV = 0;
  function inchiostro(K) { return K.lum(K.maglia) > 0.6 ? K.scuro(K.maglia, 0.55) : K.chiaro(K.maglia, 0.8); }
  function luceSopra(K) { return "<rect x='-200' y='-200' width='800' height='1400' fill='" + K.luce() + "'/>"; }
  // la stampa è sulla stoffa: sopra ci stanno la bombatura del petto (luce a sinistra, ombra a destra, il fianco che gira),
  // le pieghe che la attraversano e il seno nelle donne. Tutto morbido, ritagliato dal tronco della maglia.
  function velo(K, cx, cy, R, forte) {
    var mdd = K.scuro(K.maglia, 0.58), f = forte || 1, s = "", bs = K.donna ? (K.B.seno || 1) : 1;
    s += K.El(cx - R * 0.5, cy - R * 0.5, R * 0.62, R * 0.46, K.soft("#ffffff", 0.2 * f));
    s += K.El(cx + R * 0.98, cy + R * 0.1, R * 0.55, R * 1.35, K.soft(mdd, 0.36 * f));
    s += K.El(cx - R * 1.08, cy + R * 0.1, R * 0.34, R * 1.15, K.soft(mdd, 0.18 * f));
    if (K.donna) {
      s += K.El(cx - R * 0.46 * bs, cy + R * 0.72, R * 0.62, R * 0.2, K.soft(mdd, 0.32 * f)) + K.El(cx + R * 0.46 * bs, cy + R * 0.72, R * 0.62, R * 0.2, K.soft(mdd, 0.38 * f));
      s += K.El(cx - R * 0.5 * bs, cy - R * 0.08, R * 0.34, R * 0.3, K.soft("#ffffff", 0.2 * f));
    } else {
      s += K.El(cx, cy + R * 0.12, R * 0.06, R * 0.62, K.soft(mdd, 0.16 * f));
    }
    var p1 = "M" + K.n1(cx - R * 0.95) + " " + K.n1(cy - R * 0.2) + "C" + K.n1(cx - R * 0.4) + " " + K.n1(cy + R * 0.12) + " " + K.n1(cx + R * 0.3) + " " + K.n1(cy - R * 0.02) + " " + K.n1(cx + R * 0.95) + " " + K.n1(cy + R * 0.4);
    var p2 = "M" + K.n1(cx - R * 0.85) + " " + K.n1(cy + R * 0.55) + "C" + K.n1(cx - R * 0.3) + " " + K.n1(cy + R * 0.82) + " " + K.n1(cx + R * 0.35) + " " + K.n1(cy + R * 0.66) + " " + K.n1(cx + R * 0.85) + " " + K.n1(cy + R * 1.0);
    var p3 = "M" + K.n1(cx - R * 0.2) + " " + K.n1(cy - R * 0.85) + "C" + K.n1(cx - R * 0.05) + " " + K.n1(cy - R * 0.4) + " " + K.n1(cx - R * 0.12) + " " + K.n1(cy + R * 0.05) + " " + K.n1(cx + R * 0.12) + " " + K.n1(cy + R * 0.35);
    [p1, p2, p3].forEach(function (d, i) { s += K.St(d, mdd, 5.5, (i === 2 ? 0.1 : 0.15) * f, " stroke-linecap='round'") + K.St(d, "#ffffff", 1.8, 0.14 * f, " stroke-linecap='round' transform='translate(0 -3)'"); });
    return s;
  }
  // un disegno al petto (centro (0,0), raggio ~26), stampato sulla stoffa
  function alPetto(K, svg, sc, dy) {
    sc = sc || 1.6; var cx = K.C, cy = K.Y.petto + (dy == null ? 10 : dy), R = 24 * sc;
    return "<g transform='translate(" + cx + " " + cy + ") scale(" + sc + ")'><g opacity='.95'>" + svg + "</g></g>" +
      K.El(cx, cy, R * 1.3, R * 1.25, K.soft(K.maglia, 0.13)) + velo(K, cx, cy, R) + luceSopra(K);
  }
  function stella5(cx, cy, r, f) { var p = []; for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r * 0.45 : r; p.push((cx + q * Math.cos(a)).toFixed(1) + " " + (cy + q * Math.sin(a)).toFixed(1)); } return "<path d='M" + p.join("L") + "Z' fill='" + f + "' stroke-linejoin='round'/>"; }
  function sfera(K, chiaro, medio, scuro) {   // una sfera con la luce in alto a sinistra
    var id = K.id + "vrs" + (nV++);
    K.D.push("<radialGradient id='" + id + "' cx='.36' cy='.3' r='.85'><stop offset='0' stop-color='" + chiaro + "'/><stop offset='.5' stop-color='" + medio + "'/><stop offset='1' stop-color='" + scuro + "'/></radialGradient>");
    return "url(#" + id + ")";
  }

  // ---------------- SMILE ----------------
  A.pezzo("stampa", "smile", function (K) {
    var gr = sfera(K, "#fff0a0", "#ffd43b", "#e8a600"), s = "";
    s += "<circle cx='0' cy='0' r='24' fill='" + gr + "' stroke='#b57d00' stroke-width='1.6'/>";
    s += K.El(-9, -13, 11, 6, K.soft("#ffffff", 0.5));
    s += K.El(9, 9, 9, 7, K.soft("#e19400", 0.3));
    [-1, 1].forEach(function (l) { s += "<ellipse cx='" + (l * 8.6) + "' cy='-5' rx='3.2' ry='5' fill='#3a2400'/>"; });
    s += "<path d='M-12 5C-8 17 8 17 12 5C7 8 -7 8 -12 5Z' fill='#7a2a10' opacity='.35'/>";
    s += "<path d='M-12 5C-8 17 8 17 12 5' fill='none' stroke='#3a2400' stroke-width='3' stroke-linecap='round'/>";
    [-1, 1].forEach(function (l) { s += K.El(l * 16, 6, 4, 2.6, "#ff9a5a", " opacity='.45'"); });
    return alPetto(K, s, 1.6);
  });

  // ---------------- PALLONE ----------------
  A.pezzo("stampa", "pallone", function (K) {
    var gr = sfera(K, "#ffffff", "#f1f1ee", "#a9acb4"), nero = "#23252c", s = "";
    s += "<circle cx='0' cy='0' r='24' fill='" + gr + "' stroke='#2b2d34' stroke-width='1.6'/>";
    var cl = K.clip("M0 -24A24 24 0 1 0 0.01 -24Z");
    s += "<g clip-path='" + cl + "'>";
    var pe = function (cx, cy, r, rot) { var p = []; for (var i = 0; i < 5; i++) { var a = rot + i * 2 * Math.PI / 5; p.push((cx + r * Math.cos(a)).toFixed(1) + " " + (cy + r * Math.sin(a)).toFixed(1)); } return "M" + p.join("L") + "Z"; };
    s += "<path d='" + pe(0, 0, 9.5, -Math.PI / 2) + "' fill='" + nero + "' stroke='" + nero + "' stroke-width='1.2' stroke-linejoin='round'/>";
    for (var i = 0; i < 5; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / 5, x1 = 9.5 * Math.cos(a), y1 = 9.5 * Math.sin(a), x2 = 17.5 * Math.cos(a), y2 = 17.5 * Math.sin(a);
      s += "<path d='M" + x1.toFixed(1) + " " + y1.toFixed(1) + "L" + x2.toFixed(1) + " " + y2.toFixed(1) + "' stroke='" + nero + "' stroke-width='1.3'/>";
      s += "<path d='" + pe(25 * Math.cos(a), 25 * Math.sin(a), 8.5, a + Math.PI) + "' fill='" + nero + "'/>";
    }
    s += K.El(9, 12, 16, 12, K.soft("#7a8090", 0.35)) + K.El(-9, -13, 9, 5, K.soft("#ffffff", 0.7));
    s += "</g><circle cx='0' cy='0' r='24' fill='none' stroke='#2b2d34' stroke-width='1.6'/>";
    return alPetto(K, s, 1.6);
  });

  // ---------------- FIORI (camicia hawaiana: a tutto tondo) ----------------
  function fiore(x, y, r, col, rot, cen) {
    var s = "<g transform='translate(" + x + " " + y + ") rotate(" + rot + ")'>";
    var sc = "#8a3250", ch = "#ffffff";
    for (var i = 0; i < 5; i++) { s += "<g transform='rotate(" + (i * 72) + ")'><ellipse cx='0' cy='" + (-r * 0.62) + "' rx='" + (r * 0.5) + "' ry='" + (r * 0.62) + "' fill='" + col + "' stroke='" + sc + "' stroke-width='.8' stroke-opacity='.55'/><ellipse cx='" + (-r * 0.1) + "' cy='" + (-r * 0.78) + "' rx='" + (r * 0.16) + "' ry='" + (r * 0.26) + "' fill='" + ch + "' opacity='.6'/></g>"; }
    return s + "<circle r='" + (r * 0.3) + "' fill='" + cen + "' stroke='#b76a00' stroke-width='.8'/><circle cx='" + (-r * 0.08) + "' cy='" + (-r * 0.1) + "' r='" + (r * 0.1) + "' fill='#fff3b0'/></g>";
  }
  function foglia(x, y, r, rot) { var t = "transform='translate(" + x + " " + y + ") rotate(" + rot + ")'"; return "<path d='M0 0C" + (r * 0.5) + " " + (-r * 0.5) + " " + (r * 1.3) + " " + (-r * 0.3) + " " + (r * 1.6) + " 0C" + (r * 1.2) + " " + (r * 0.4) + " " + (r * 0.4) + " " + (r * 0.5) + " 0 0Z' fill='#2f9e44' stroke='#1d6b2e' stroke-width='.8' " + t + "/><path d='M0 0Q" + (r * 0.8) + " 0 " + (r * 1.5) + " 0' stroke='#1d6b2e' stroke-width='.7' fill='none' " + t + "/>"; }
  A.pezzo("stampa", "fiori", function (K) {
    var F = [[132, 300, 16, "#ffd43b", 10], [246, 296, 14, "#ff8fab", 30], [190, 352, 17, "#ffffff", 0], [292, 372, 15, "#ffd43b", 20], [106, 380, 14, "#ff8fab", 5], [226, 424, 16, "#ff6b8b", 15], [150, 452, 15, "#ffffff", 40], [290, 468, 14, "#ff8fab", 0], [100, 500, 14, "#ffd43b", 25], [204, 506, 15, "#ffd43b", 18], [262, 540, 14, "#ffffff", 8], [80, 300, 13, "#ffffff", 12], [330, 300, 13, "#ff8fab", 0]], s = "<g opacity='.95'>", i;
    for (i = 0; i < F.length; i++) { var f = F[i]; s += foglia(f[0] + 8, f[1] + 6, f[2] * 0.9, 20 + i * 47) + foglia(f[0] - 6, f[1] + 8, f[2] * 0.7, 160 + i * 31); }
    for (i = 0; i < F.length; i++) { var f2 = F[i]; s += fiore(f2[0], f2[1], f2[2], f2[3], f2[4] + i * 13, f2[3] === "#ffd43b" ? "#f08c00" : "#ffd43b"); }
    s += "</g>" + K.El(K.C, 410, 130, 120, K.soft(K.maglia, 0.14)) + velo(K, K.C, 410, 100, 1.1);
    return s + luceSopra(K);
  });

  // ---------------- ARCOBALENO (piccolo, dentro il petto) ----------------
  A.pezzo("stampa", "arcobaleno", function (K) {
    var cols = ["#ff5d5d", "#ff9f43", "#ffe066", "#5fd46f", "#4dabf7", "#9775fa"], s = "", w = 5, yb = 16;
    cols.forEach(function (c, k) { var r = 31 - k * w; s += "<path d='M" + (-r) + " " + yb + "A" + r + " " + r + " 0 0 1 " + r + " " + yb + "' fill='none' stroke='" + c + "' stroke-width='" + (w + 0.5) + "' />"; });
    s += "<path d='M-31 " + yb + "A31 31 0 0 1 31 " + yb + "' fill='none' stroke='#ffffff' stroke-width='1.2' opacity='.25' transform='translate(-.6 -1.5)'/>";
    var nuv = function (x, y, k) { return "<g transform='translate(" + x + " " + y + ") scale(" + k + ")'><path d='M-15 7C-23 7 -22 -3 -14 -3C-14 -12 -2 -14 3 -8C8 -15 21 -10 19 -1C26 -1 26 8 18 7Z' fill='#ffffff' stroke='#c8d3e6' stroke-width='1.1'/><path d='M-11 3C-4 6 8 6 15 3' stroke='#d6dff0' stroke-width='2' fill='none' opacity='.8'/></g>"; };
    s += nuv(-26, yb + 1, 0.5) + nuv(26, yb + 1, 0.5);
    return alPetto(K, s, 2.0, -8);
  });

  // ---------------- NOTA MUSICALE ----------------
  A.pezzo("stampa", "nota", function (K) {
    var ink = inchiostro(K), hi = K.chiaro(ink, 0.35), s = "";
    s += "<path d='M-10 18L-10 -14L16 -20L16 12' fill='none' stroke='" + ink + "' stroke-width='3.6' stroke-linejoin='round' stroke-linecap='round'/>";
    s += "<path d='M-10 -14L16 -20L16 -9L-10 -3Z' fill='" + ink + "'/><path d='M-9 -12L15 -17.5' stroke='" + hi + "' stroke-width='1.2' opacity='.6'/>";
    [[-15, 19], [11, 13]].forEach(function (n) { s += "<ellipse cx='" + n[0] + "' cy='" + n[1] + "' rx='8' ry='6' transform='rotate(-22 " + n[0] + " " + n[1] + ")' fill='" + ink + "'/><ellipse cx='" + (n[0] - 2.5) + "' cy='" + (n[1] - 2) + "' rx='3' ry='1.6' transform='rotate(-22 " + (n[0] - 2.5) + " " + (n[1] - 2) + ")' fill='" + hi + "' opacity='.7'/>"; });
    s += "<path d='M24 -14C30 -12 31 -6 27 -2' fill='none' stroke='" + ink + "' stroke-width='2' stroke-linecap='round' opacity='.7'/><path d='M-26 -2C-31 -6 -30 -12 -25 -15' fill='none' stroke='" + ink + "' stroke-width='2' stroke-linecap='round' opacity='.7'/>";
    return alPetto(K, s, 1.7, 12);
  });

  // ---------------- FIAMME (una stampa sul petto) ----------------
  A.pezzo("stampa", "fiamme", function (K) {
    var s = "", yb = 26;
    function lingua(cx, h, w, c0, lean) {   // una lingua di fuoco: base larga, punta storta (lean)
      var tx = cx + lean * w;
      return "<path d='M" + (cx - w) + " " + yb + "C" + (cx - w) + " " + (yb - h * 0.4) + " " + (cx - w * 0.2) + " " + (yb - h * 0.5) + " " + (tx - w * 0.15) + " " + (yb - h * 0.78) +
        "C" + (tx - w * 0.05) + " " + (yb - h * 0.9) + " " + (tx + w * 0.1) + " " + (yb - h * 0.95) + " " + tx + " " + (yb - h) +
        "C" + (tx + w * 0.3) + " " + (yb - h * 0.75) + " " + (cx + w * 0.7) + " " + (yb - h * 0.55) + " " + (cx + w * 0.9) + " " + (yb - h * 0.3) +
        "C" + (cx + w) + " " + (yb - h * 0.15) + " " + (cx + w) + " " + (yb - 2) + " " + (cx + w * 0.6) + " " + yb + "Z' fill='" + c0 + "'/>";
    }
    var gr = K.LG("vfi" + (nV++), 0, -24, 0, 28, [[0, "#ff2f1a"], [0.55, "#ff6b00"], [1, "#ff9d17"]], true), gr2 = K.LG("vfj" + (nV++), 0, -10, 0, 28, [[0, "#ff9a1a"], [1, "#ffd43b"]], true);
    var P = [[-26, 24, 9, -0.5], [-14, 38, 11, -0.4], [0, 50, 13, 0.15], [14, 36, 11, 0.45], [26, 22, 9, 0.5], [-6, 30, 9, 0.3], [8, 26, 8, -0.3]];
    P.slice().sort(function (a, b) { return a[1] - b[1]; }).forEach(function (p) { s += lingua(p[0], p[1], p[2], gr, p[3]); });
    P.forEach(function (p) { s += lingua(p[0] + 0.5, p[1] * 0.66, p[2] * 0.62, gr2, p[3]); });
    P.forEach(function (p) { s += lingua(p[0] + 1, p[1] * 0.34, p[2] * 0.3, "#fff3b0", p[3]); });
    s += "<path d='M-34 " + (yb + 1) + "C-14 " + (yb + 6) + " 14 " + (yb + 6) + " 34 " + (yb + 1) + "' stroke='#d8280f' stroke-width='2.4' fill='none' stroke-linecap='round' opacity='.85'/>";
    return alPetto(K, s, 1.8, -24);
  });

  // ---------------- PIZZA (una fetta grande, ben leggibile) ----------------
  A.pezzo("stampa", "pizza", function (K) {
    var s = "", fa = K.LG("vpz" + (nV++), 0, -20, 0, 30, [[0, "#ffe27a"], [1, "#f6a21a"]], true);
    var d = "M-26 -15C-9 -22 9 -22 26 -15L3 31C1.5 33.5 -1.5 33.5 -3 31Z";
    s += "<g transform='rotate(-10)'>";
    s += "<path d='" + d + "' fill='" + fa + "' stroke='#7a3f0c' stroke-width='2.4' stroke-linejoin='round'/>";
    s += "<g clip-path='" + K.clip(d) + "'>" + K.El(-14, -6, 9, 14, K.soft("#fff6c4", 0.6)) + K.El(12, 10, 10, 18, K.soft("#d98914", 0.4));
    s += "<path d='M-14 -4C-12 2 -16 8 -12 14M10 0C9 6 13 10 9 16M-3 12C-1 18 -4 22 -2 26' stroke='#fff0a0' stroke-width='3' fill='none' opacity='.75' stroke-linecap='round'/></g>";
    s += "<path d='M-30 -17C-12 -29 12 -29 30 -17C32 -12 29 -8 25 -9C10 -15 -10 -15 -25 -9C-29 -8 -32 -12 -30 -17Z' fill='#e0a24f' stroke='#7a3f0c' stroke-width='2.4' stroke-linejoin='round'/>";
    s += "<path d='M-24 -19C-10 -25 10 -25 24 -19' stroke='#fbd9a0' stroke-width='2.4' fill='none' opacity='.9' stroke-linecap='round'/>";
    [[-10, -2, 6.4], [9, 0, 6.6], [0, 15, 5.6]].forEach(function (p) { s += "<circle cx='" + p[0] + "' cy='" + p[1] + "' r='" + p[2] + "' fill='#d62f2f' stroke='#6e1010' stroke-width='1.8'/><circle cx='" + (p[0] - 2) + "' cy='" + (p[1] - 2) + "' r='" + (p[2] * 0.32) + "' fill='#ff9a8a' opacity='.8'/><circle cx='" + (p[0] + 2.2) + "' cy='" + (p[1] + 2) + "' r='1' fill='#8f1d1d'/>"; });
    s += "<path d='M12 -9C16 -9 17 -5 14 -4C12 -5 11 -7 12 -9Z M-18 3C-14 2 -12 6 -15 7C-17 6 -18 5 -18 3Z' fill='#3f9a24' stroke='#216b12' stroke-width='1'/>";
    s += "</g>";
    return alPetto(K, s, 2.0, 4);
  });

  // ---------------- LUNA E STELLE ----------------
  A.pezzo("stampa", "luna", function (K) {
    var s = "", gr = K.LG("vln" + (nV++), -26, -26, 14, 26, [[0, "#fff6c0"], [0.55, "#ffe066"], [1, "#e0a800"]], true), d = "M6 -26A26 26 0 1 0 6 26A34 34 0 0 1 6 -26Z";

    s += "<path d='" + d + "' fill='" + gr + "' stroke='#b88a00' stroke-width='1.4' stroke-linejoin='round'/>";
    s += "<g clip-path='" + K.clip(d) + "'>" + K.El(-12, -8, 5, 4, K.soft("#d19a00", 0.35)) + K.El(-8, 12, 3.6, 3, K.soft("#d19a00", 0.3)) + K.El(-18, -14, 6, 12, K.soft("#ffffff", 0.45)) + "</g>";
    s += "<g stroke='#b88a00' stroke-width='.9' stroke-linejoin='round'>" + stella5(20, -14, 7, "#ffe066") + stella5(25, 8, 5, "#fff3b0") + stella5(-30, -20, 4.4, "#fff3b0") + stella5(-34, 14, 3.4, "#ffe066") + "</g>";
    s += "<circle cx='12' cy='22' r='1.4' fill='#fff3b0'/><circle cx='-26' cy='28' r='1.2' fill='#fff3b0'/>";
    return alPetto(K, s, 1.8, 2);
  });

  // ---------------- GATTO ----------------
  A.pezzo("stampa", "gatto", function (K) {
    var chi = K.lum(K.maglia) > 0.6, gc = chi ? "#3b3b44" : "#f7f4ee", gi = chi ? "#ffffff" : "#3b3b44", ge = chi ? "#2b2b32" : "#d8d3c8", s = "";

    s += "<path d='M-22 -6L-24 -26C-24 -29 -22 -29 -20 -27L-8 -16Z M22 -6L24 -26C24 -29 22 -29 20 -27L8 -16Z' fill='" + gc + "' stroke='" + ge + "' stroke-width='1.2' stroke-linejoin='round'/>";
    s += "<path d='M-20 -9L-21 -22L-12 -15Z M20 -9L21 -22L12 -15Z' fill='#ff9fb2' opacity='.85'/>";
    s += "<ellipse cx='0' cy='4' rx='26' ry='21' fill='" + gc + "' stroke='" + ge + "' stroke-width='1.2'/>";
    s += K.El(-8, -4, 14, 8, K.soft("#ffffff", chi ? 0.15 : 0.5)) + K.El(10, 14, 16, 8, K.soft(chi ? "#000000" : "#a89f90", 0.3));
    [-1, 1].forEach(function (l) { s += "<ellipse cx='" + (l * 10) + "' cy='1' rx='4.2' ry='5.4' fill='" + gi + "'/><ellipse cx='" + (l * 10) + "' cy='1.4' rx='1.6' ry='4.4' fill='#2a1a10'/><circle cx='" + (l * 10 - 1.2) + "' cy='-1' r='1.2' fill='#ffffff'/>"; });
    s += "<path d='M-3.2 9.5L3.2 9.5L0 13Z' fill='#ff8fa3' stroke='#d96a80' stroke-width='.6' stroke-linejoin='round'/><path d='M0 13C0 17 -5 18 -7 16M0 13C0 17 5 18 7 16' fill='none' stroke='" + gi + "' stroke-width='1.3' stroke-linecap='round'/>";
    s += "<g stroke='" + gi + "' stroke-width='1' stroke-linecap='round' opacity='.85'><path d='M-15 11L-30 8M-15 14L-30 16M15 11L30 8M15 14L30 16'/></g>";
    return alPetto(K, s, 1.55, 10);
  });

  // ---------------- PIANETA ----------------
  A.pezzo("stampa", "pianeta", function (K) {
    var s = "", gr = sfera(K, "#ffe2b8", "#ff922b", "#b83a0a"), ring = "#d0bfff", ringD = "#8f78e0";

    s += "<g transform='rotate(-18)'><path d='M-36 0A36 10 0 0 1 36 0' fill='none' stroke='" + ringD + "' stroke-width='6' stroke-linecap='round'/><path d='M-36 0A36 10 0 0 1 36 0' fill='none' stroke='" + ring + "' stroke-width='4' stroke-linecap='round'/></g>";
    s += "<circle cx='0' cy='0' r='19' fill='" + gr + "' stroke='#8a2c05' stroke-width='1.3'/>";
    s += "<g clip-path='" + K.clip("M0 -19A19 19 0 1 0 0.01 -19Z") + "'><path d='M-20 -4C-8 -9 8 1 20 -5L20 1C8 7 -8 -3 -20 2Z' fill='#ffd8a8' opacity='.45'/><path d='M-20 9C-8 5 8 14 20 8L20 13C8 19 -8 10 -20 14Z' fill='#d9541a' opacity='.5'/>" + K.El(-7, -9, 8, 5, K.soft("#ffffff", 0.7)) + "</g>";
    s += "<g transform='rotate(-18)'><path d='M36 0A36 10 0 0 1 -36 0' fill='none' stroke='" + ringD + "' stroke-width='6' stroke-linecap='round'/><path d='M36 0A36 10 0 0 1 -36 0' fill='none' stroke='" + ring + "' stroke-width='4' stroke-linecap='round'/></g>";
    s += "<g fill='#ffffff' opacity='.85'><circle cx='-30' cy='-18' r='1.4'/><circle cx='28' cy='-20' r='1.1'/><circle cx='30' cy='18' r='1.3'/></g>";
    return alPetto(K, s, 1.75, 2);
  });

  // ---------------- SUPEREROE: tuta aderente, mantello corto, stemma a rombo col fulmine, cintura e bracciali ----------------
  A.pezzo("capo", "supereroe", function (K) {
    var mg = K.maglia, C = K.C, B = K.B, Y = K.Y, nk = B.nk, mdd = K.scuro(mg, 0.5), oro = "#ffd43b", oroD = "#b88a00", ea = 3;
    var T = K.busto({ agio: 3, orlo: 522, scollo: { prof: 14, larg: 3 }, pancia: B.pancia ? 4 : 0 });
    var br = [-1, 1].map(function (l) { return { d: K.manica(l, { lung: 1, agio: ea }), lato: l, fino: 1, e: ea }; });
    var p = "", bs = B.seno || 1;
    // muscoli e pieghe della tuta (la tuta è sulla pelle: i volumi si vedono)
    p += K.El(C - 40, Y.petto - 30, 30, 40, K.soft("#ffffff", 0.18)) + K.El(C, 272, 40, 14, K.soft(mdd, 0.3));
    if (K.donna) {
      p += K.El(C - 22 * bs, Y.petto + 24 * bs, 30 * bs, 8, K.soft(mdd, 0.2)) + K.El(C + 22 * bs, Y.petto + 24 * bs, 30 * bs, 8, K.soft(mdd, 0.26)) + K.El(C - 26 * bs, Y.petto - 2, 20 * bs, 15 * bs, K.soft("#ffffff", 0.2));
    } else {
      p += K.El(C - 24, Y.petto + 14, 28, 9, K.soft(mdd, 0.2)) + K.El(C + 24, Y.petto + 14, 28, 9, K.soft(mdd, 0.28)) + K.El(C - 26, Y.petto - 4, 20, 14, K.soft("#ffffff", 0.18));
      p += K.St("M" + C + " " + (Y.petto - 6) + "L" + C + " " + (Y.petto + 20), mdd, 1.8, 0.28);
      [0, 1, 2].forEach(function (i) { p += K.El(C - 12, 426 + i * 24, 12, 8, K.soft("#ffffff", 0.1)) + K.El(C + 12, 426 + i * 24, 12, 8, K.soft(mdd, 0.14)); });
    }
    if (B.pancia) p += K.St("M" + (C - B.wt + 10) + " " + (Y.vita + 26) + "C" + (C - 30) + " " + (Y.vita + 44) + " " + (C + 30) + " " + (Y.vita + 44) + " " + (C + B.wt - 10) + " " + (Y.vita + 26), mdd, 4, 0.22);
    [-1, 1].forEach(function (l) { var J = K.BR[l].J; p += K.El(J[0] + l * 4, J[1] + K.rc + 10, 14, 20, K.soft(mdd, 0.22)); });
    // la cintura d'oro con la fibbia (dentro la sagoma)
    var cy = 498, cb = "M" + (C - 220) + " " + cy + "L" + (C + 220) + " " + cy + "L" + (C + 220) + " " + (cy + 15) + "L" + (C - 220) + " " + (cy + 15) + "Z";
    var gb = K.LG("vcb" + (nV++), 0, cy, 0, cy + 15, [[0, "#ffe985"], [0.45, oro], [1, "#c99a00"]], true);
    p += "<g clip-path='" + K.clip(T) + "'>" + K.Pa(cb, gb) + K.St("M" + (C - 220) + " " + cy + "L" + (C + 220) + " " + cy, "#a37800", 1, 0.6) + K.St("M" + (C - 220) + " " + (cy + 15) + "L" + (C + 220) + " " + (cy + 15), "#8a6200", 1.4, 0.6) + K.St("M" + (C - 220) + " " + (cy + 3) + "L" + (C + 220) + " " + (cy + 3), "#ffffff", 1, 0.45) + "</g>";
    p += K.Pa("M" + (C - 12) + " " + (cy - 2) + "L" + (C + 12) + " " + (cy - 2) + "L" + (C + 12) + " " + (cy + 17) + "L" + (C - 12) + " " + (cy + 17) + "Z", "#fff3b0", " stroke='" + oroD + "' stroke-width='1.4' stroke-linejoin='round'") + K.Pa("M" + (C - 7) + " " + (cy + 3) + "L" + (C + 7) + " " + (cy + 3) + "L" + (C + 7) + " " + (cy + 12) + "L" + (C - 7) + " " + (cy + 12) + "Z", oro, " stroke='" + oroD + "' stroke-width='1'");
    var V = K.dipingi({ tronco: [T], braccia: br }, mg, { dentro: p });
    var s = V.svg;
    // lo stemma: rombo d'oro col fulmine del colore della tuta, grande sul petto
    var ex = C, ey = Y.petto + 6, rb = "M" + ex + " " + (ey - 31) + "L" + (ex + 28) + " " + ey + "L" + ex + " " + (ey + 31) + "L" + (ex - 28) + " " + ey + "Z";
    var gs = K.LG("vst" + (nV++), ex - 28, ey - 31, ex + 28, ey + 31, [[0, "#fff3b0"], [0.4, oro], [1, "#d4a200"]], true), fl = "M" + (ex + 4) + " " + (ey - 22) + "L" + (ex - 14) + " " + (ey + 3) + "L" + (ex - 2) + " " + (ey + 3) + "L" + (ex - 7) + " " + (ey + 22) + "L" + (ex + 15) + " " + (ey - 6) + "L" + (ex + 2) + " " + (ey - 6) + "L" + (ex + 9) + " " + (ey - 22) + "Z";
    var em = "<g transform='translate(" + ex + " " + ey + ") scale(1.5) translate(" + (-ex) + " " + (-ey) + ")'>";
    em += K.El(ex + 1.5, ey + 4, 30, 30, K.soft("#000000", 0.25)) + "<path d='" + rb + "' fill='" + gs + "' stroke='" + oroD + "' stroke-width='1.8' stroke-linejoin='round'/>";
    em += "<path d='M" + ex + " " + (ey - 25) + "L" + (ex + 22) + " " + ey + "L" + ex + " " + (ey + 25) + "L" + (ex - 22) + " " + ey + "Z' fill='none' stroke='#fff7cc' stroke-width='1' opacity='.7' stroke-linejoin='round'/>";
    em += "<path d='" + fl + "' fill='" + K.mix(mg, "#000000", 0.08) + "' stroke='" + K.scuro(mg, 0.6) + "' stroke-width='1' stroke-linejoin='round'/><path d='M" + (ex + 2) + " " + (ey - 19) + "L" + (ex - 9) + " " + (ey + 1) + "' stroke='" + K.chiaro(mg, 0.5) + "' stroke-width='1.4' opacity='.7' stroke-linecap='round'/></g>";
    s += em;
    // il colletto: bordo d'oro sottile e morbido
    var oroM = K.mix(oro, mg, 0.22), cz = "M" + (C - nk - 5) + " 241C" + (C - nk + 2) + " 258 " + (C + nk - 2) + " 258 " + (C + nk + 5) + " 241";
    s += K.St(cz, K.scuro(mg, 0.45), 6, 0.6) + K.St(cz, oroM, 3, 0.85) + K.St("M" + (C - nk - 3) + " 239C" + (C - nk + 4) + " 254 " + (C + nk - 4) + " 254 " + (C + nk + 3) + " 239", "#fff7cc", 1, 0.4);
    // i fermagli del mantello sulle spalle
    [-1, 1].forEach(function (l) { var fx = C + l * (nk + 14), fy = 258; s += K.El(fx + 0.8, fy + 1.4, 6.4, 6.4, "#000000", " opacity='.28'") + "<circle cx='" + fx + "' cy='" + fy + "' r='6' fill='" + oro + "' stroke='" + oroD + "' stroke-width='1.3'/><circle cx='" + (fx - 1.6) + "' cy='" + (fy - 1.8) + "' r='2' fill='#ffffff' opacity='.75'/>"; });
    // i bracciali in fondo alle maniche (seguono il braccio): oro morbido, senza bordi netti
    [-1, 1].forEach(function (l) {
      var f = K.fineManica(l, 1), w = (f.w + ea) * 0.5 + 0.6, bx = f.x - f.dx * 9, by = f.y - f.dy * 9;
      var seg = "M" + K.n1(bx - f.dy * w) + " " + K.n1(by + f.dx * w) + "L" + K.n1(bx + f.dy * w) + " " + K.n1(by - f.dx * w);
      s += K.suManica(l, K.St(seg, K.scuro(mg, 0.4), 12.5, 0.38, " stroke-linecap='butt'") + K.St(seg, oroM, 9.5, 0.82, " stroke-linecap='butt'") + K.St(seg, "#fff3b0", 2.4, 0.35, " transform='translate(" + K.n1(-f.dx * 2.8) + " " + K.n1(-f.dy * 2.8) + ")'") + K.St(seg, K.mix(oroD, mg, 0.4), 2, 0.4, " transform='translate(" + K.n1(f.dx * 3.4) + " " + K.n1(f.dy * 3.4) + ")'"));
    });
    // il mantello: parte dalle spalle (si vede sopra e dietro), scende ai lati e si apre, con pieghe e orlo ondulato
    var rr = parseInt(mg.slice(1, 3), 16), gg = parseInt(mg.slice(3, 5), 16), bb = parseInt(mg.slice(5, 7), 16), cb0 = "#d8283f", ct, dmin = -1;
    ["#d8283f", "#2b55c4", "#1f9d55", "#6a3fc4", "#14171f"].forEach(function (cc) { var q = parseInt(cc.slice(1, 3), 16) - rr, w = parseInt(cc.slice(3, 5), 16) - gg, z = parseInt(cc.slice(5, 7), 16) - bb, dd = Math.sqrt(q * q * 0.9 + w * w * 1.2 + z * z * 0.7); if (dmin < 170 && dd > dmin) { dmin = dd; cb0 = cc; } });   // il primo colore (rosso, poi blu…) che stacca bene dalla tuta
    ct = K.mix(mg, cb0, 0.94), cd = K.scuro(ct, 0.5), cl = K.chiaro(ct, 0.3);
    var yH = 684, wH = Math.min(B.hp + 82, 190), so = B.sho + 26, w2 = B.sho + 40, w3 = Math.min(B.hp + 52, 170);
    function lato(l) { return function (x) { return C + l * x; }; }
    var X = lato(-1), Z = lato(1);
    var cape = "M" + X(nk + 6) + " 238C" + X(nk + 22) + " 244 " + X(so - 6) + " 250 " + X(so + 2) + " 268C" + X(w2 + 4) + " 330 " + X(w2 + 6) + " 400 " + X(w3) + " 500C" + X(wH - 6) + " 580 " + X(wH + 2) + " 640 " + X(wH) + " " + (yH - 6) +
      "Q" + X(wH * 0.78) + " " + (yH + 14) + " " + X(wH * 0.56) + " " + (yH - 2) + "Q" + X(wH * 0.34) + " " + (yH + 14) + " " + X(wH * 0.12) + " " + (yH - 2) + "Q" + C + " " + (yH + 8) + " " + Z(wH * 0.12) + " " + (yH - 2) +
      "Q" + Z(wH * 0.34) + " " + (yH + 14) + " " + Z(wH * 0.56) + " " + (yH - 2) + "Q" + Z(wH * 0.78) + " " + (yH + 14) + " " + Z(wH) + " " + (yH - 6) +
      "C" + Z(wH + 2) + " 640 " + Z(wH - 6) + " 580 " + Z(w3) + " 500C" + Z(w2 + 6) + " 400 " + Z(w2 + 4) + " 330 " + Z(so + 2) + " 268C" + Z(so - 6) + " 250 " + Z(nk + 22) + " 244 " + Z(nk + 6) + " 238Z";
    var cg = K.LG("vcm" + (nV++), C - wH, 0, C + wH, 0, [[0, K.mix(ct, "#ffffff", 0.2)], [0.3, ct], [0.7, K.mix(ct, cd, 0.4)], [1, cd]], true);
    var pieg = "";
    [[-0.78, 0.5], [-0.5, 0.36], [0.5, 0.36], [0.78, 0.5]].forEach(function (q, i) {
      var xs = C + q[0] * wH, d = "M" + K.n1(C + q[0] * (so + 8)) + " 276C" + K.n1(xs + q[0] * 6) + " 400 " + K.n1(xs + q[0] * 10) + " 540 " + K.n1(xs + q[0] * 14) + " " + (yH - 4);
      pieg += K.St(d, cd, 9, q[1] * 0.5, " stroke-linecap='round'") + K.St(d, cl, 3, 0.3, " stroke-linecap='round' transform='translate(-5 0)'");
    });
    var dietro = "<path d='" + cape + "' fill='none' stroke='" + K.mix(ct, "#12060c", 0.6) + "' stroke-width='3.6' stroke-linejoin='round'/>" + K.Pa(cape, cg) + "<g clip-path='" + K.clip(cape) + "'>" + pieg +
      K.El(C - wH * 0.6, 420, 24, 200, K.soft("#ffffff", 0.22)) + K.El(C + wH * 0.85, 480, 36, 230, K.soft("#000000", 0.3)) + K.El(C, 290, nk + 60, 30, K.soft("#000000", 0.45)) + K.El(C, 560, 60, 130, K.soft("#000000", 0.25)) +
      K.St("M" + X(wH - 2) + " " + (yH - 8) + "Q" + X(wH * 0.78) + " " + (yH + 10) + " " + X(wH * 0.56) + " " + (yH - 6) + "Q" + X(wH * 0.34) + " " + (yH + 10) + " " + X(wH * 0.12) + " " + (yH - 6) + "Q" + C + " " + (yH + 4) + " " + Z(wH * 0.12) + " " + (yH - 6) + "Q" + Z(wH * 0.34) + " " + (yH + 10) + " " + Z(wH * 0.56) + " " + (yH - 6) + "Q" + Z(wH * 0.78) + " " + (yH + 10) + " " + Z(wH - 2) + " " + (yH - 8), oroM, 3, 0.75) + "</g>";
    return { corpo: s, dietro: dietro };
  });
  // ===== aiuti dei piedi di tre quarti (copiati da scarpe.js, con la ruota in più: o.alza) =====
  var nP = 0;
  var DEG = Math.PI / 180, nP = 0;
  var TR = " stroke-dasharray='3.5 3'";
  function sm(t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function tab(T, x) { if (x <= T[0][0]) return T[0][1]; for (var i = 1; i < T.length; i++) if (x <= T[i][0]) { var t = (x - T[i - 1][0]) / Math.max(0.001, T[i][0] - T[i - 1][0]); return lerp(T[i - 1][1], T[i][1], sm(t)); } return T[T.length - 1][1]; }
  function hull(P) {   // involucro convesso (catena monotona)
    var p = P.slice().sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
    function cr(o, a, b) { return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]); }
    var lo = [], up = [], i;
    for (i = 0; i < p.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], p[i]) <= 0) lo.pop(); lo.push(p[i]); }
    for (i = p.length - 1; i >= 0; i--) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], p[i]) <= 0) up.pop(); up.push(p[i]); }
    lo.pop(); up.pop(); return lo.concat(up);
  }
  // toglie i punti troppo vicini (il contorno poi si liscia)
  function radi(P, d) { var o = [P[0]]; for (var i = 1; i < P.length; i++) { var q = o[o.length - 1]; if (Math.hypot(P[i][0] - q[0], P[i][1] - q[1]) >= d) o.push(P[i]); } if (o.length > 3 && Math.hypot(o[0][0] - o[o.length - 1][0], o[0][1] - o[o.length - 1][1]) < d) o.pop(); return o; }
  // le due catene di un contorno chiuso tra il punto più a sinistra e quello più a destra: { basso, alto }, da sinistra a destra
  function catene(P) {
    var iL = 0, iR = 0, n = P.length, i;
    for (i = 1; i < n; i++) { if (P[i][0] < P[iL][0]) iL = i; if (P[i][0] > P[iR][0]) iR = i; }
    var c1 = [], c2 = [];
    for (i = iL; ; i = (i + 1) % n) { c1.push(P[i]); if (i === iR) break; }
    for (i = iL; ; i = (i - 1 + n) % n) { c2.push(P[i]); if (i === iR) break; }
    var m1 = 0, m2 = 0; c1.forEach(function (q) { m1 += q[1]; }); c2.forEach(function (q) { m2 += q[1]; });
    return m1 / c1.length > m2 / c2.length ? { basso: c1, alto: c2 } : { basso: c2, alto: c1 };
  }
  function yDi(ch, x) { if (x <= ch[0][0]) return ch[0][1]; for (var i = 1; i < ch.length; i++) if (x <= ch[i][0]) { var t = (x - ch[i - 1][0]) / Math.max(0.001, ch[i][0] - ch[i - 1][0]); return lerp(ch[i - 1][1], ch[i][1], t); } return ch[ch.length - 1][1]; }
  // una linea liscia con meno punti (l'avatar pesa meno): tiene il primo e l'ultimo, salta quelli più vicini di 3
  function lis(K, P) { if (P.length < 4) return K.liscio(P); var o = [P[0]], e = P[P.length - 1]; for (var i = 1; i < P.length - 1; i++) { var q = o[o.length - 1]; if (Math.hypot(P[i][0] - q[0], P[i][1] - q[1]) >= 3 && Math.hypot(P[i][0] - e[0], P[i][1] - e[1]) >= 1.5) o.push(P[i]); } o.push(e); return K.liscio(o); }
  function poli(K, P) { return "M" + P.map(function (q) { return K.n1(q[0]) + " " + K.n1(q[1]); }).join("L") + "Z"; }
  function rif(P, dx, dy) { return P.map(function (q) { return [q[0] + dx, q[1] + dy]; }); }
  // ritaglio «tutto tranne questo poligono»
  function tranne(K, P) {
    var id = "pq" + (nP++);
    K.D.push("<clipPath id='" + K.id + id + "'><path clip-rule='evenodd' d='M-200 300H600V1200H-200Z" + poli(K, P) + "'/></clipPath>");
    return "url(#" + K.id + id + ")";
  }
  function dentroA(K, tagli, svg) { (tagli || []).forEach(function (P) { svg = "<g clip-path='" + tranne(K, P) + "'>" + svg + "</g>"; }); return svg; }

  // ---- la pianta: mezza larghezza (lato fuori) lungo a, e la linea di mezzo (la punta va un po' verso l'alluce) ----
  // o: dietro, avanti, larga, Rt (quanto è lunga la curva della punta), kt (2 tonda, 1.5 a mandorla, 1.25 a punta), storta, ki (lato dentro)
  function pianta(o) {
    var ah = o.dietro || 24, at = o.avanti || 74, wb = o.larga || 25, Rt = o.Rt || wb * 0.95, kt = o.kt || 2, Rh = wb * 0.82, st = o.storta == null ? 3 : o.storta;
    var T = [[-ah, 0.76], [-4, 0.8], [at * 0.38, 0.93], [at * 0.6, 1], [Math.max(at * 0.6 + 1, at - Rt), 0.97]];
    return { ah: ah, at: at, wb: wb, ki: o.ki || 0.93,
      w: function (a) {
        var w = wb * tab(T, a);
        if (a > at - Rt) { var q = Math.min(1, (a - (at - Rt)) / Rt); w *= Math.pow(Math.max(0, 1 - Math.pow(q, kt)), 1 / kt); }
        if (a < -ah + Rh) { var q2 = Math.min(1, (-ah + Rh - a) / Rh); w *= Math.sqrt(Math.max(0, 1 - q2 * q2)); }
        return w;
      },
      bc: function (a) { return -st * sm((a - at * 0.3) / (at * 0.7)); } };
  }

  // ---- la vista di UN piede (l = -1 a sinistra nel disegno, 1 a destra) ----
  // o: la pianta (sopra) + suola (spessore), tacco (alza il tallone: il piede va in punta), dorso [[a, 0-1]…] (altezza della
  // tomaia tra la suola e il collo), labbro (quota del collo davanti, 944), giro (gradi in fuori), anello (margine del collo
  // intorno alla gamba), alto (quanto sale il collo dietro), fusto (mezza larghezza del gambale degli stivali), scala
  function vista(K, l, o) {
    o = o || {};
    var g = K.gIn(938), wa = (g[1] + g[2]) / 2, s = (0.64 + 0.36 * wa / 16.5) * (K.m ? 1.03 : 0.93) * (o.scala || 1);
    var r = (o.giro != null ? o.giro : 25) * DEG, e = 17 * DEG, sr = Math.sin(r), cr = Math.cos(r), se = Math.sin(e), ce = Math.cos(e);
    var V = { K: K, l: l, s: s, g: g, xc: K.C + l * g[0], se: se, ce: ce, o: o, yg: 0 };
    V.P = function (a, b, h) { return [V.xc + l * s * (a * sr + b * cr), V.yg + se * s * (a * cr - b * sr) - h * ce]; };
    V.W = function (X, Z, h) { return [V.xc + l * X, V.yg + se * Z - h * ce]; };
    V.ang = Math.atan2(se * cr, l * sr) / DEG;   // il verso del piede sullo schermo (per le ellissi allungate)
    var pl = pianta(o), H = o.tacco || 0, aB = pl.at * 0.6;
    V.H = H; V.aB = aB;
    V.lift = function (a) { if (o.alza) return o.alza; if (!H) return 0; var t = (aB - a) / (aB + pl.ah - 8); return t <= 0 ? 0 : H * Math.pow(Math.min(1, t), 0.9); };
    // la terra: la parte più bassa della pianta tocca y 998
    var mx = -1e9, i;
    for (i = 0; i <= 40; i++) { var a = -pl.ah + (pl.at + pl.ah) * i / 40, w = pl.w(a), c = pl.bc(a); mx = Math.max(mx, V.P(a, c + w, V.lift(a) - (o.alza || 0))[1], V.P(a, c - w * pl.ki, V.lift(a) - (o.alza || 0))[1]); }
    V.yg = 998 - mx;
    // il collo della scarpa: un anello intorno alla gamba (o al gambale), davanti più basso, dietro più alto
    var gm = Math.max(g[1], g[2]);
    V.collo = function (R, lab, alto, xR) {
      var hf = (V.yg + se * R - lab) / ce, hb = hf + alto, P = [];
      for (var k = 0; k < 28; k++) { var f = k / 28 * 2 * Math.PI, sn = Math.sin(f); P.push(V.W(xR + R * Math.cos(f), R * sn, hf + (hb - hf) * (1 - sn) / 2)); }
      return { R: R, hf: hf, hb: hb, P: P, lip: catene(P).basso };
    };
    var col = V.collo((o.fusto || gm) + (o.anello == null ? (o.fusto ? 0 : 2.6) : o.anello), o.labbro || 944, o.alto == null ? 3 : o.alto, o.fusto ? (o.fustoX || 0) : (g[1] - g[2]) / 2);
    V.rho = col.R; V.hf = col.hf; V.hb = col.hb; V.ring = col.P; V.labbroC = col.lip;
    V.aThr = V.rho / s * 0.92;   // la gola: dove il collo incontra il dorso
    V.F = forma(V, o);
    return V;
  }
  // una forma (la scarpa, o il piede nudo dentro) con la stessa vista: pianta, altezza del dorso, superficie
  function forma(V, o) {
    var pl = pianta(o), T = o.suola == null ? 6 : o.suola, nE = o.nE || 2.8, ki = pl.ki;
    var F = { V: V, at: pl.at, ah: pl.ah, wb: pl.wb, w: pl.w, bc: pl.bc, t: T, ki: ki };
    var aThr = o.gola != null ? o.gola : V.aThr, hT = o.hGola != null ? o.hGola : V.hf;
    F.aThr = aThr;
    var dorso = o.dorso || [[aThr, 1], [30, 0.72], [44, 0.5], [56, 0.36], [64, 0.25], [70, 0.13], [pl.at, 0]];
    F.htop = function (a) { var b0 = V.lift(a) + T; return b0 + (hT - b0) * tab(dorso, a); };
    // i punti della pianta a quota dh sopra la pianta (che segue il tacco): fuori dal tallone alla punta, poi dentro all'indietro
    F.orma = function (dh, n, da, aa) {
      n = n || 30; da = da == null ? -pl.ah : da; aa = aa == null ? pl.at : aa;
      var fu = [], de = [];
      for (var i = 0; i <= n; i++) {
        var a = lerp(da, aa, 0.5 - 0.5 * Math.cos(Math.PI * i / n)), w = pl.w(a), c = pl.bc(a), h = V.lift(a) + dh;
        fu.push(V.P(a, c + w, h)); de.push(V.P(a, c - w * ki, h));
      }
      return fu.concat(de.reverse());
    };
    // la b di un punto (bt da -1 bordo dentro a 1 bordo fuori)
    F.b = function (a, bt) { var w = pl.w(a); return pl.bc(a) + (bt >= 0 ? w : w * ki) * (bt < 0 ? -1 : 1) * Math.pow(Math.abs(bt), 2 / nE); };
    F.hsup = function (a, bt) { var b0 = V.lift(a) + T; return b0 + (F.htop(a) - b0) * Math.pow(Math.max(0, 1 - bt * bt), 1 / nE); };
    // un punto sulla superficie (dh = un po' sopra)
    F.sup = function (a, bt, dh) { return V.P(a, F.b(a, bt), F.hsup(a, bt) + (dh || 0)); };
    F.riga = function (a0, a1, bt, dh, n) { var P = []; n = n || 8; for (var i = 0; i <= n; i++) P.push(F.sup(lerp(a0, a1, i / n), bt, dh)); return P; };
    F.giro = function (a, bt0, bt1, dh, n) { var P = []; n = n || 8; for (var i = 0; i <= n; i++) P.push(F.sup(a, lerp(bt0, bt1, i / n), dh)); return P; };
    return F;
  }
  // i contorni: la tomaia (involucro di pianta, archi del dorso e collo) e la suola (pianta a terra + pianta sopra la suola)
  // o.pezzi = [[a0, a1], …] (facoltativo): la sagoma fatta a pezzi lungo il piede che si sovrappongono (ognuno convesso);
  // o.piu = punti in più per il pezzo di dietro (il gambale degli stivali, così il piede si allarga piano dal gambale)
  function sagome(V, F, o) {
    o = o || {};
    var K = V.K, a0 = o.da != null ? o.da : F.aThr * 0.7, aF = o.fino != null ? o.fino : F.at, an = o.anello || V.ring, T = [], S = [];
    (o.pezzi || [[-F.ah, F.at]]).forEach(function (r, k) {
      var up = F.orma(F.t, 18, r[0], r[1]), i, b0 = Math.max(a0, r[0]), b1 = Math.min(aF, r[1]);
      if (r[0] < F.aThr) { up = up.concat(an); if (o.piu) up = up.concat(o.piu); }
      if (b1 > b0) for (i = 0; i <= 12; i++) { var a = lerp(b0, b1, i / 12); [-1, -0.85, -0.6, -0.3, 0, 0.3, 0.6, 0.85, 1].forEach(function (bt) { up.push(F.sup(a, bt)); }); }
      if (o.extra && o.extra[k]) up = up.concat(o.extra[k]);
      T.push(radi(hull(up), 2.4));
      S.push(radi(hull(F.orma(0, 18, r[0], r[1]).concat(F.orma(F.t, 18, r[0], r[1]))), 2.4));
    });
    return { tomaia: T, suola: S, dT: T.map(function (P) { return K.lisciaChiusa(P); }), dS: S.map(function (P) { return K.lisciaChiusa(P); }) };
  }
  // riempire più pezzi come una sagoma sola: prima il bordo di tutti, poi il colore di tutti (il bordo resta solo fuori)
  // (ogni contorno si scrive una volta sola nelle definizioni: il disegno e il ritaglio lo richiamano, così l'avatar pesa meno)
  function defn(K, d) {
    var M = K._pq || (K._pq = {});
    if (!M[d]) { var id = "pf" + (nP++); K.D.push("<path id='" + K.id + id + "' d='" + d + "'/>"); M[d] = "#" + K.id + id; }
    return M[d];
  }
  function riempi(K, dd, col, bordo, w) {
    if (dd.length === 1) return "<use href='" + defn(K, dd[0]) + "' fill='" + col + "' stroke='" + bordo + "' stroke-width='" + (w || 3) + "' stroke-linejoin='round' paint-order='stroke'/>";
    return dd.map(function (d) { return "<path d='" + d + "' fill='none' stroke='" + bordo + "' stroke-width='" + (w || 3) + "' stroke-linejoin='round'/>"; }).join("") + dd.map(function (d) { return K.Pa(d, col); }).join("");
  }
  function ritaglio(K, dd) { var id = "pk" + (nP++); K.D.push("<clipPath id='" + K.id + id + "'>" + dd.map(function (d) { return "<use href='" + defn(K, d) + "'/>"; }).join("") + "</clipPath>"); return "url(#" + K.id + id + ")"; }
  // la striscia della gamba sopra il collo: lì la gamba sta DAVANTI alla scarpa (lip = catena bassa dell'anello)
  function striscia(xa, xb, lip) {
    var x1 = Math.min(xa, xb), x2 = Math.max(xa, xb), P = [[x1, 600], [x2, 600], [x2, yDi(lip, x2)]];
    lip.slice().reverse().forEach(function (q) { if (q[0] > x1 && q[0] < x2) P.push(q); });
    P.push([x1, yDi(lip, x1)]);
    return P;
  }
  function bordiGamba(V, e) { var g = V.g, K = V.K; e = e == null ? 0.6 : e; return [K.C + V.l * (g[0] - g[2] - e), K.C + V.l * (g[0] + g[1] + e)]; }
  function tagliaGamba(V, lip, e) { var b = bordiGamba(V, e); return striscia(b[0], b[1], lip || V.labbroC); }

  // ---- l'ombra a terra ----
  function ombraTerra(V, F) {
    var K = V.K, O = F.orma(-(V.o.alza || 0), 16), x1 = 1e9, x2 = -1e9, y2 = -1e9;
    O.forEach(function (q) { x1 = Math.min(x1, q[0]); x2 = Math.max(x2, q[0]); y2 = Math.max(y2, q[1]); });
    return K.El((x1 + x2) / 2, y2 - 4, (x2 - x1) / 2 + 5, 7, K.soft("#000000", 0.5)) + K.El((x1 + x2) / 2 + V.l * 4, y2 - 2, (x2 - x1) / 2 - 4, 4, K.soft("#000000", 0.42));
  }
  function scatola(P) { var b = [1e9, 1e9, -1e9, -1e9]; (P.length && Array.isArray(P[0][0]) ? [].concat.apply([], P) : P).forEach(function (q) { b[0] = Math.min(b[0], q[0]); b[1] = Math.min(b[1], q[1]); b[2] = Math.max(b[2], q[0]); b[3] = Math.max(b[3], q[1]); }); return b; }
  // ---- la suola: bordo scuro fuori, luce da sinistra, più scura in basso (dietro la caviglia la copre la gamba) ----
  function suola(V, S, so, det, bordo, tagli) {
    var K = V.K, bb = scatola(S.suola), bs = bordo || K.mix(so, "#12060c", K.lum(so) > 0.7 ? 0.45 : 0.55);
    var s = riempi(K, S.dS, so, bs) + "<g clip-path='" + ritaglio(K, S.dS) + "'><rect x='" + K.n1(bb[0] - 4) + "' y='" + K.n1(bb[1] - 4) + "' width='" + K.n1(bb[2] - bb[0] + 8) + "' height='" + K.n1(bb[3] - bb[1] + 8) + "' fill='" + K.luce() + "'/>" +
      K.El((bb[0] + bb[2]) / 2 + V.l * 6, bb[3], (bb[2] - bb[0]) / 2, 4, K.soft(K.mix(so, "#000000", 0.6), 0.4)) + (det || "") + "</g>";
    return dentroA(K, tagli === undefined ? [tagliaGamba(V)] : tagli, s);
  }
  // ---- la tomaia: tinta unita col bordo scuro fuori, poi luce da sinistra e volumi morbidi ritagliati sulla sagoma ----
  // c = { colore, bordo, fodera (dentro il collo), lucida (0-1), collo: false (niente anello), anello (i punti) }; tagli = poligoni da non coprire
  function tomaia(V, F, S, c, dett, tagli) {
    var K = V.K, l = V.l, tom = c.colore, Lt = K.lum(tom), bb = scatola(S.tomaia);
    var bordo = c.bordo || K.mix(tom, "#12060c", Lt > 0.7 ? 0.42 : 0.55), sc2 = K.mix(tom, "#14080c", 0.62), cl = c.lucida == null ? 0.5 : c.lucida;
    var d = "<rect x='" + K.n1(bb[0] - 6) + "' y='" + K.n1(bb[1] - 4) + "' width='" + K.n1(bb[2] - bb[0] + 12) + "' height='" + K.n1(bb[3] - bb[1] + 8) + "' fill='" + K.luce() + "'/>";
    var ang = V.ang, aL = -l, s = V.s, am = Math.max(F.aThr + 6, F.at * 0.42);
    var p1 = F.sup(F.at * 0.7, 0.4 * aL), p2 = F.sup(am, 0.92 * aL), p3 = F.sup(am, -0.92 * aL), p4 = V.P(F.at * 0.42, F.bc(F.at * 0.42), V.lift(F.at * 0.42) + F.t + 2);
    d += K.ElR(p1[0], p1[1], 10 * s, 6, ang, K.soft("#ffffff", 0.5 * cl + (Lt < 0.3 ? 0.12 : 0))) + K.ElR(p2[0], p2[1], 20 * s, 7, ang, K.soft("#ffffff", 0.2 * cl + 0.08));
    d += K.ElR(p3[0], p3[1], 24 * s, 8, ang, K.soft(sc2, 0.42)) + K.ElR(p4[0], p4[1], 32 * s, 5, ang, K.soft(sc2, 0.32));
    if (c.collo !== false) {
      var pf = V.W(0, V.rho, V.hf), an = c.anello || V.ring;
      d += K.El(pf[0], pf[1] + 2, V.rho + 4, 6, K.soft(sc2, 0.3));
      var an2 = radi(an, 3);
      d += K.Pa(poli(K, an2), c.fodera || K.mix(tom, "#1a1418", 0.6)) + K.St(K.lisciaChiusa(an2), bordo, 1.3, 0.8);
    }
    d += dett || "";
    var s2 = riempi(K, S.dT, tom, bordo) + "<g clip-path='" + ritaglio(K, S.dT) + "'>" + d + "</g>";
    return dentroA(K, tagli === undefined ? [tagliaGamba(V)] : tagli, s2);
  }

  function stivale(K, o) {
    var sc = K.scarpe, C = K.C, Lt = K.lum(sc), id = o.id;
    return A.duePiedi(K, function (l) {
      var g0 = K.gIn(944), ag = o.agio, agI = ag * 0.8, agC = o.agioC != null ? o.agioC : ag * 0.7, fo = g0[1] + agC, fi = g0[2] + agC * 0.8;
      var V = vista(K, l, { suola: o.suola, larga: o.larga || 26, avanti: o.avanti || 74, Rt: o.Rt, kt: o.kt, tacco: o.tacco, alza: o.alza, giro: o.giro, fusto: (fo + fi) / 2, fustoX: (fo - fi) / 2, labbro: o.labbro || 950, alto: 2, storta: 2.5 });
      var F = V.F, xo = C + l * (g0[0] + fo), xi = C + l * (g0[0] - fi), yl = yDi(V.labbroC, V.xc);
      // il piede si allarga piano dal gambale (niente gradino alla caviglia)
      var S = sagome(V, F, { piu: [[xo, yl - 16], [xi, yl - 16], [xo, yl - 8], [xi, yl - 8]] }), s = "";
      // il gambale: dalla quota top fino dentro il piede, colorato come il piede (tinta unita, luce da sinistra, volumi morbidi)
      var gm = K.gIn((o.top + 940) / 2), cx = C + l * gm[0], w = gm[1] + ag + 4, ym = (o.top + 944) / 2, hh = (944 - o.top) / 2;
      // il gambale si stringe piano verso la caviglia (non è un tubo)
      var pO = [], pI = [], yy, tt, gy, aa;
      for (yy = o.top; yy <= 960; yy += 6) { tt = sm((yy - o.top) / (944 - o.top)); aa = lerp(ag, agC, tt); gy = K.gIn(yy); pO.push([C + l * (gy[0] + gy[1] + aa), yy]); pI.push([C + l * (gy[0] - gy[2] - aa * 0.8), yy]); }
      var d = poli(K, pO.concat(pI.reverse())), bo = K.mix(sc, "#0c0408", Lt > 0.7 ? 0.62 : 0.6), sc2 = K.mix(sc, "#14080c", 0.62);
      s += riempi(K, [d], sc, bo, 3.4) + "<g clip-path='" + ritaglio(K, [d]) + "'>";
      s += "<rect x='" + K.n1(cx - w - 10) + "' y='" + o.top + "' width='" + K.n1(2 * w + 20) + "' height='" + (962 - o.top) + "' fill='" + K.luce() + "'/>";
      s += K.El(cx - w * 0.42, ym, w * 0.26, hh * 1.05, K.soft("#ffffff", (o.lucida == null ? 0.6 : o.lucida) * 0.3 + 0.1)) + K.El(cx + w * 0.72, ym + 6, w * 0.32, hh * 1.1, K.soft(sc2, 0.42));
      s += K.El(cx, o.top + 8, w, 10, K.soft("#000000", 0.26));
      // la caviglia segnata: il gambale si stringe (ombre ai lati), qualche piega, il malleolo
      var ga = K.gIn(930), xa = C + l * ga[0], wa = (ga[1] + ga[2]) / 2 + agC, xao = xa + l * (ga[1] - ga[2]) / 2;
      s += K.El(xao - wa, 928, 7, 24, K.soft(sc2, 0.5)) + K.El(xao + wa, 928, 7, 24, K.soft(sc2, 0.5));
      s += K.St("M" + K.n1(xao - wa * 0.8) + " 918C" + K.n1(xao - wa * 0.3) + " 923 " + K.n1(xao + wa * 0.3) + " 923 " + K.n1(xao + wa * 0.8) + " 918", K.scuro(sc, 0.45), 1.2, 0.4) + K.St("M" + K.n1(xao - wa * 0.8) + " 926C" + K.n1(xao - wa * 0.3) + " 931 " + K.n1(xao + wa * 0.3) + " 931 " + K.n1(xao + wa * 0.8) + " 926", K.scuro(sc, 0.5), 1.2, 0.35);
      s += K.El(xao + l * wa * 0.45, 936, 4.5, 6, K.soft("#ffffff", 0.3));
      if (o.dett) s += o.dett(l, cx, w, sc);
      s += "</g>";
      // l'orlo in alto del gambale
      var gt = K.gIn(o.top), ct = C + l * gt[0], wt = (gt[1] + gt[2]) / 2 + ag * 0.9, ctx = ct + l * (gt[1] - gt[2]) / 2;
      s += K.El(ctx, o.top + 1, wt, 5, K.scuro(sc, 0.55), " opacity='.85'") + K.St("M" + K.n1(ctx - wt) + " " + (o.top + 1) + "C" + K.n1(ctx - wt * 0.5) + " " + (o.top + 7) + " " + K.n1(ctx + wt * 0.5) + " " + (o.top + 7) + " " + K.n1(ctx + wt) + " " + (o.top + 1), K.chiaro(sc, 0.4), 1.4, 0.7);
      // il piede: davanti al gambale (il gambale resta dietro sopra il collo del piede); una piega morbida alla caviglia
      var T = K.St(lis(K, V.labbroC), sc2, 2.4, 0.18) + K.St(lis(K, rif(V.labbroC, 0, 1.5)), "#ffffff", 1.2, 0.12);
      // il piede ben fatto: punta cucita, colletto del collo del piede, filo della suola, rialzo della punta
      var ch = Lt > 0.5, fil = ch ? K.scuro(sc, 0.4) : K.chiaro(sc, 0.5);
      T += K.St(lis(K, catene(F.orma(F.t + 1.6, 24)).basso), fil, 1.1, ch ? 0.5 : 0.55);
      T += K.St(lis(K, F.giro(F.at * 0.8, -0.95, 0.95, 0.2, 10)), fil, 1, 0.4, TR);
      var ci = F.sup(F.aThr + 4, -0.8, 0.5), cm = F.sup(F.aThr + 8, 0, 1.2), co = F.sup(F.aThr + 4, 0.8, 0.5);
      T += K.St(lis(K, [ci, cm, co]), ch ? K.scuro(sc, 0.5) : K.chiaro(sc, 0.4), 1.4, 0.6);
      var tp = F.sup(F.at * 0.9, 0, 0.2);
      T += K.El(tp[0] - l * 2, tp[1] - 2, 9 * V.s, 3.2, K.soft("#ffffff", ch ? 0.5 : 0.55));
      if (o.piede) T += o.piede(V, F, sc);
      var taglio = striscia(xi, xo, V.labbroC), tac = "";
      if (o.tacco) {   // il tacco a blocchetto: si vede appena dietro, sotto il tallone
        var ta = -F.ah + 12, tb = F.bc(ta) + F.w(ta) * 0.12, tw = F.w(ta) * 0.88, h0 = V.lift(ta) + 1;
        var tp = [V.P(ta - 5, tb - tw, h0), V.P(ta + 5, tb - tw, h0), V.P(ta + 4, tb - tw * 0.9, 0), V.P(ta - 4, tb - tw * 0.9, 0), V.P(ta - 4, tb + tw * 0.9, 0), V.P(ta + 4, tb + tw * 0.9, 0), V.P(ta - 5, tb + tw, h0)];
        tac = K.Pa(poli(K, hull(tp)), K.scuro(sc, 0.5), " stroke='" + K.scuro(sc, 0.8) + "' stroke-width='1.6'") + K.St(lis(K, [V.P(ta - 4, tb + tw * 0.9, 1.5), V.P(ta + 4, tb + tw * 0.9, 1.5)]), K.chiaro(sc, 0.2), 1, 0.5);
      }
      return ombraTerra(V, F) + tac + (o.sotto ? o.sotto(V, F, l) : "") + suola(V, S, o.fondo || K.scuro(sc, 0.62), o.dettSuola ? o.dettSuola(V, F) : "", null, []) + s + tomaia(V, F, S, { colore: sc, lucida: o.lucida == null ? 0.6 : o.lucida, collo: false }, T, [taglio]);
    });
  }

  // ---------------- PATTINI A ROTELLE: stivaletto allacciato, piastra e quattro ruote per piede (di tre quarti) ----------------
  // le ruote sono dischi (cerchi trasformati con la stessa proiezione del piede): K.D tiene i gradienti una volta sola
  function ruotaGrad(K, col) {
    var id = K.id + "vw" + (nV++);
    K.D.push("<radialGradient id='" + id + "' cx='.34' cy='.3' r='.9'><stop offset='0' stop-color='" + K.chiaro(col, 0.55) + "'/><stop offset='.55' stop-color='" + col + "'/><stop offset='1' stop-color='" + K.scuro(col, 0.35) + "'/></radialGradient>");
    return "url(#" + id + ")";
  }
  function sottoPattino(K, V, F, l, ruota) {
    var al = V.o.alza, bw = F.wb * 0.52, aV = [-6, 44], s = "", i, rr = 10.5;
    var rg = ruotaGrad(K, ruota), metallo = "#aab3c0", mD = "#4d5560";
    var P0 = V.P(0, 0, 0), ea = [V.P(1, 0, 0)[0] - P0[0], V.P(1, 0, 0)[1] - P0[1]], eh = [V.P(0, 0, 1)[0] - P0[0], V.P(0, 0, 1)[1] - P0[1]], eb = [V.P(0, 1, 0)[0] - P0[0], V.P(0, 1, 0)[1] - P0[1]];
    function disco(a, b) {
      var c = V.P(a, b, rr), M = [ea[0] * rr, ea[1] * rr, eh[0] * rr, eh[1] * rr, c[0], c[1]].map(function (v) { return K.n1(v); }).join(" ");
      var sp = [eb[0] * 6, eb[1] * 6].map(function (v) { return K.n1(v); }).join(" ");
      return "<g transform='translate(" + sp.split(" ")[0] + " " + sp.split(" ")[1] + ")'><g transform='matrix(" + M + ")'><circle r='1' fill='" + K.scuro(ruota, 0.45) + "'/></g></g>" +
        "<g transform='matrix(" + M + ")'><circle r='1' fill='" + rg + "' stroke='" + K.scuro(ruota, 0.6) + "' stroke-width='.16'/><circle r='.6' fill='#eef1f6' stroke='" + K.scuro(ruota, 0.5) + "' stroke-width='.1'/><path d='M0 -.58V.58M-.5 -.29L.5 .29M-.5 .29L.5 -.29' stroke='#8a93a2' stroke-width='.1'/><circle r='.2' fill='#6b7482' stroke='#3a4150' stroke-width='.07'/><path d='M-.78 -.4A.9 .9 0 0 1 -.1 -.9' fill='none' stroke='#ffffff' stroke-width='.14' opacity='.7' stroke-linecap='round'/></g>";
    }
    // le ruote lontane (lato di fuori), la piastra, quelle vicine
    aV.forEach(function (a) { s += disco(a, F.bc(a) + bw * 1.3); });
    var pts = [];
    [-14, 54].forEach(function (a) { [-1, 1].forEach(function (k) { [al - 7, al - 0.2].forEach(function (h) { pts.push(V.P(a, F.bc(a) + k * bw, h)); }); }); });
    var dp = "M" + hullPts(pts).map(function (q) { return K.n1(q[0]) + " " + K.n1(q[1]); }).join("L") + "Z";
    s += "<path d='" + dp + "' fill='" + metallo + "' stroke='" + mD + "' stroke-width='1.3' stroke-linejoin='round'/>";
    var pa = V.P(-6, F.bc(-6) + bw * 0.1, al - 0.6), pb = V.P(52, F.bc(52) + bw * 0.1, al - 0.6);
    s += K.St("M" + K.n1(pa[0]) + " " + K.n1(pa[1]) + "L" + K.n1(pb[0]) + " " + K.n1(pb[1]), "#ffffff", 1.2, 0.5);
    aV.forEach(function (a) { s += disco(a, F.bc(a) - bw * 1.3); });
    // il freno di gomma davanti
    var fp = V.P(62, F.bc(62), 4.6), fq = V.P(62, F.bc(62) + bw * 0.5, 3.4);
    s += K.El(fp[0], fp[1], 3.4, 3, "#d8283f", " stroke='#7a1020' stroke-width='.8'");
    return s;
  }
  function hullPts(P) { return hull(P); }
  A.pezzo("scarpe", "pattini", function (K) {
    var sc = K.scarpe, chiara = K.lum(sc) > 0.7, lacci = chiara ? "#8c8c8a" : "#f6f6f2", bianco = "#f1efe8", acc = "#d8283f";
    return stivale(K, { id: "pt", top: 868, agio: 5.5, suola: 5, alza: 25, giro: 46, larga: 24.5, avanti: 72, kt: 1.9, Rt: 24, labbro: 948, lucida: 0.5, fondo: "#2c2f38",
      sotto: function (V, F, l) { return sottoPattino(K, V, F, l, "#ffd43b"); },
      dett: function (l, cx, w, sc) {
        var r = "", y;
        // la linguetta e i lacci in fila lungo il davanti del gambale
        r += K.St("M" + K.n1(cx) + " 876L" + K.n1(cx) + " 936", K.scuro(sc, 0.4), 11, 0.22);
        for (var j = 0; j < 6; j++) {
          y = 884 + j * 9.4;
          r += K.El(cx - 6.5, y, 1.7, 1.7, "#cfd5de", " stroke='#555c68' stroke-width='.6'") + K.El(cx + 6.5, y, 1.7, 1.7, "#cfd5de", " stroke='#555c68' stroke-width='.6'");
          if (j < 5) r += K.St("M" + K.n1(cx - 6.5) + " " + K.n1(y) + "L" + K.n1(cx + 6.5) + " " + K.n1(y + 9.4) + "M" + K.n1(cx + 6.5) + " " + K.n1(y) + "L" + K.n1(cx - 6.5) + " " + K.n1(y + 9.4), "#000000", 2.6, 0.18) + K.St("M" + K.n1(cx - 6.5) + " " + K.n1(y) + "L" + K.n1(cx + 6.5) + " " + K.n1(y + 9.4) + "M" + K.n1(cx + 6.5) + " " + K.n1(y) + "L" + K.n1(cx - 6.5) + " " + K.n1(y + 9.4), lacci, 1.8, 0.95);
        }
        // la fascia col velcro in alto e la striscia di colore sul fianco
        r += K.Pa("M" + K.n1(cx - w - 4) + " 870L" + K.n1(cx + w + 4) + " 870L" + K.n1(cx + w + 4) + " 883L" + K.n1(cx - w - 4) + " 883Z", acc, " opacity='.96'") + K.St("M" + K.n1(cx - w - 3) + " 872L" + K.n1(cx + w + 3) + " 872", "#ffffff", 1.4, 0.4) + K.St("M" + K.n1(cx - w) + " 883L" + K.n1(cx + w) + " 883", "#000000", 1.4, 0.3);
        r += K.Pa("M" + K.n1(cx - 5) + " 872L" + K.n1(cx + 5) + " 872L" + K.n1(cx + 5) + " 880L" + K.n1(cx - 5) + " 880Z", "#d8dce4", " stroke='#7b8290' stroke-width='.8'");
        r += K.St("M" + K.n1(cx + l * w * 0.7) + " 888L" + K.n1(cx + l * w * 0.72) + " 944", "#ffd43b", 3, 0.9);
        return r;
      },
      piede: function (V, F, sc) {
        var r = "", i;
        for (i = 0; i < 3; i++) { var a = F.aThr + 4 + i * 6.2, q1 = F.sup(a, -0.34, 0.8), q2 = F.sup(a + 1, 0, 1.6), q3 = F.sup(a, 0.34, 0.8); r += K.St(lis(K, [q1, q2, q3]), "#000000", 2.6, 0.18) + K.St(lis(K, [q1, q2, q3]), lacci, 1.9, 0.95); }
        var f1 = F.orma(F.t - 0.5, 9, F.at * 0.72, F.at), f2 = F.orma(F.t + 4.5, 9, F.at * 0.72, F.at - 1);
        r += K.Pa(poli(K, radi(hull(f1.concat(f2)), 2)), acc, " opacity='.95' stroke='" + K.scuro(acc, 0.5) + "' stroke-width='1.2' stroke-linejoin='round'");
        var h1 = F.orma(F.t - 0.5, 9, -F.ah, -F.ah + 18), h2 = F.orma(F.t + 7, 9, -F.ah, -F.ah + 18);
        r += K.Pa(poli(K, radi(hull(h1.concat(h2)), 2)), acc, " opacity='.9'");
        var i1 = F.sup(F.at * 0.7, -0.5, 0.6), i2 = F.sup(F.at * 0.82, 0.1, 0.6);
        r += K.St(lis(K, F.riga(F.at * 0.7, F.at * 0.95, 0.25, 0.4, 6)), "#ffffff", 1.2, 0.55);
        return r;
      } });
  });
})();
// PEZZI FATTI (secondo tempo, seconda metà, 5 nov 2026): stampe smile, pallone, fiori, arcobaleno, nota, fiamme, pizza, luna, gatto, pianeta;
//   capo supereroe (tuta aderente, stemma a rombo col fulmine, cintura e bracciali d'oro, mantello corto dietro: rosso o blu a seconda della tuta);
//   scarpe pattini (stivaletto allacciato di tre quarti, piastra e quattro ruote gialle per piede).
// NOTE: di spalle il motore non usa i pezzi dei capi (tinta unita), quindi il mantello non si vede dal retro. Le stampe compaiono su tutti i capi di vestiti-sopra.js che chiamano stampa(K, T) (felpa, maglione, polo, canotta, crop...), verificato su felpa.
// SECONDO GIRO (5 nov 2026): stampe ora «sulla stoffa» (bombatura del petto, ombra a destra, pieghe che le attraversano, velo del colore della maglia; niente ombra da adesivo);
//   fiamme = stampa sul petto; arcobaleno piccolo dentro il petto; pizza grande e leggibile; supereroe: mantello largo dietro le spalle e ai lati (con pieghe e orlo ondulato), stemma 1,5x,
//   cintura solo sul tronco (non attraversa più le maniche), bracciali d'oro morbidi; pattini: piedi aperti a V, 4 ruote per pattino (due assi) con mozzo, punta e tallone rossi, fascia imbottita, freno rosso.


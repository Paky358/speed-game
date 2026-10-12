/* =========================================================
   SPeeD GAME — PIANTE E COSE PICCOLE DA APPOGGIARE (vista dall'alto, come il bagno di js/mobili-arte.js)
   In piedi: ficus, palma da salotto, monstera. Da appoggiare sopra un mobile (o per terra): bonsai, girasoli,
   orchidea, cactus, mappamondo, orsacchiotto, pallone, candele, lampada lava, lampada da scrivania,
   frullatore, tostapane; e due cose scadenti del bagno: la carta igienica e il bicchiere con lo spazzolino.
   Gli stessi oggetti della casa vista di lato (casa.js), stessi nomi, prezzi e colori, visti dall'alto in diagonale.
   Misure: una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Le piante e le cose tonde sono costruite "in 3D" (punti veri nello spazio, disegnati da dietro a davanti):
   così il disegno da dietro è davvero l'altra parte. Con { notte: true } le luci sono accese
   (il gioco poi scurisce la stanza e mette l'alone nel punto "luce").
   Si aggiunge a SGMobiliArte con SGMobiliArte.aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte) return;

  // ---------- attrezzi (come nel bagno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato (da dietro)
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 100) / 100; }
  function f3(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function q2(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f2(x) + "," + f2(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(o) { return "opacity='" + Math.round(o * 100) / 100 + "'"; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f2(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f2(x) + "' cy='" + f2(y) + "' rx='" + f2(rx) + "' ry='" + f2(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f1(x) + "' y='" + f1(y) + "' width='" + f1(w) + "' height='" + f1(h) + "'" + (r ? " rx='" + f1(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + (w || 2.4) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f2(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q2(a) + " L" + q2(b); }
  function chiuso(a) { return "M" + a.map(function (x) { return q2(x); }).join(" L") + " Z"; }
  function aperto(a) { return "M" + a.map(function (x) { return q2(x); }).join(" L"); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function rot(x, y, a) { return " transform='rotate(" + f1(a) + " " + f2(x) + " " + f2(y) + ")'"; }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); t = Math.max(0, Math.min(1, t)); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
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
  function lin(nome, stops, x1, y1, x2, y2, user) { return sfum("linearGradient", user ? nome + (++nC) : nome, stops, "x1='" + f2(x1) + "' y1='" + f2(y1) + "' x2='" + f2(x2) + "' y2='" + f2(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function rad(nome, stops, cx, cy, r) { return sfum("radialGradient", nome, stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  function ombra(x, y, rx, ry, k) {   // l'ombra morbida a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra)
    return ell(x, y, rx, ry, rad("om", [[0, "#000", .2], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5), k ? "opacity='" + k + "'" : "");
  }
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];      // il cromo
  var ORO = [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]];
  function tubo(d, w, c, lw) { return tratto(d, L, w + (lw || 1.8)) + tratto(d, c, w) + tratto(d, chiaro(c, .45), Math.max(.4, w * .32), "opacity='.8' transform='translate(-.35 -.4)'"); }   // un tubo tondo col contorno e il filo di luce
  function cromo(d, w) { return tratto(d, L, w + 1.8) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.5, w * .38), "opacity='.95' transform='translate(-.3 -.4)'"); }

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda (si disegna dopo)
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }

  // ---------- lo spazio vero (tutto in metri, anche l'altezza): [a, b, c] ----------
  var VI = [.6124, .6124, .5];   // da dove guarda chi gioca: davanti, dall'alto a 30°
  var LU = nrm([-.45, .55, .7]);   // da dove viene la luce: in alto a sinistra
  function add(u, v) { return [u[0] + v[0], u[1] + v[1], u[2] + v[2]]; }
  function sub(u, v) { return [u[0] - v[0], u[1] - v[1], u[2] - v[2]]; }
  function mul(u, k) { return [u[0] * k, u[1] * k, u[2] * k]; }
  function dot(u, v) { return u[0] * v[0] + u[1] * v[1] + u[2] * v[2]; }
  function crs(u, v) { return [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; }
  function nrm(u) { var l = Math.sqrt(dot(u, u)) || 1; return mul(u, 1 / l); }
  function mista(u, v, t) { return add(mul(u, 1 - t), mul(v, t)); }
  function mondo(u) { return [u[0] * G, u[1] * G, u[2]]; }   // dal mobile al mondo (girato: a e b cambiano segno)
  function S(pt) { return Puv(pt[0] * G, pt[1] * G, pt[2] * 61); }   // un punto sullo schermo
  function Sv(d) { return [(d[0] - d[1]) * 50 * G, (d[0] + d[1]) * 25 * G - d[2] * 61]; }   // una direzione sullo schermo
  function prof(pt) { return dot(mondo(pt), VI); }   // più è grande, più è vicino a chi guarda
  function guarda(n) { return dot(mondo(n), VI); }   // > 0: la faccia guarda verso chi gioca
  function lux(n) { return dot(nrm(mondo(n)), LU); }   // da -1 (in ombra) a 1 (in piena luce)
  function mat(c, u, w) { var C = S(c), U = Sv(u), W = Sv(w); return " transform='matrix(" + [U[0], U[1], W[0], W[1], C[0], C[1]].map(f2).join(" ") + ")'"; }   // un disegno piatto (x, y) messo nello spazio: x lungo u, y lungo w
  function ruotaAsse(k, ang) { var c = Math.cos(ang), s = Math.sin(ang); return function (v) { var kv = crs(k, v), kd = dot(k, v) * (1 - c); return [v[0] * c + kv[0] * s + k[0] * kd, v[1] * c + kv[1] * s + k[1] * kd, v[2] * c + kv[2] * s + k[2] * kd]; }; }
  function ruota(da, a) { var ax = crs(da, a), l = Math.sqrt(dot(ax, ax)); return l < 1e-9 ? function (v) { return v; } : ruotaAsse(mul(ax, 1 / l), Math.atan2(l, dot(da, a))); }
  function base(n) { var e1 = nrm(crs(Math.abs(n[2]) < .95 ? [0, 0, 1] : [1, 0, 0], n)), e2 = crs(n, e1); return [e1, e2]; }   // due direzioni sul piano che ha normale n
  function bez(a, b, c, t) { var u = 1 - t; return add(add(mul(a, u * u), mul(b, 2 * u * t)), mul(c, t * t)); }   // un punto su una curva (3D)
  function sfera(c, R) {   // per disegnare sopra una palla: dalla direzione (dal centro) allo schermo; i punti dietro scivolano sul bordo
    var vo = mondo(VI);
    return { su: function (v) { var d = dot(v, vo), w = d < 0 ? nrm(sub(v, mul(vo, d))) : v; return S(add(c, mul(w, R))); }, vede: function (v) { return dot(v, vo); } };
  }
  function liscia(pp, n) {   // una curva liscia che passa per i punti (3D): n pezzi per tratto
    var out = [], i, k;
    for (i = 0; i < pp.length - 1; i++) {
      var p0 = pp[Math.max(0, i - 1)], p1 = pp[i], p2 = pp[i + 1], p3 = pp[Math.min(pp.length - 1, i + 2)];
      for (k = 0; k < n; k++) {
        var t = k / n, t2 = t * t, t3 = t2 * t;
        out.push([0, 1, 2].map(function (j) { return .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3); }));
      }
    }
    out.push(pp[pp.length - 1]);
    return out;
  }
  function rametto(pp, wf) {   // un ramo che si assottiglia lungo i punti (3D); wf(t) = il raggio in metri: dà la sagoma sullo schermo
    var sp = pp.map(S), n = sp.length, sx = [], dx = [], i;
    for (i = 0; i < n; i++) {
      var a = sp[Math.max(0, i - 1)], b = sp[Math.min(n - 1, i + 1)], vx = b[0] - a[0], vy = b[1] - a[1], l = Math.sqrt(vx * vx + vy * vy) || 1, w = wf(i / (n - 1)) * 70.71;
      sx.push([sp[i][0] - vy / l * w, sp[i][1] + vx / l * w]); dx.push([sp[i][0] + vy / l * w, sp[i][1] - vx / l * w]);
    }
    return { d: chiuso(sx.concat(dx.reverse())), sp: sp };
  }
  function cerchio(c, r) { return "M" + q2(c[0] - r, c[1]) + " A" + f2(r) + "," + f2(r) + " 0 1,0 " + q2(c[0] + r, c[1]) + " A" + f2(r) + "," + f2(r) + " 0 1,0 " + q2(c[0] - r, c[1]) + " Z"; }
  function ovale(x, y, rx, ry) { return "M" + q2(x - rx, y) + " A" + f2(rx) + "," + f2(ry) + " 0 1,0 " + q2(x + rx, y) + " A" + f2(rx) + "," + f2(ry) + " 0 1,0 " + q2(x - rx, y) + " Z"; }

  // ---------- i pezzi tondi ----------
  // un cerchio in pianta all'altezza z (unità), sullo schermo
  function anello(a, b, z, r) { var c = P(a, b, z); return { x: c[0], y: c[1], rx: r * 70.71, ry: r * 35.36 }; }
  function arcoDav(e) { return "M" + q2(e.x - e.rx, e.y) + " A" + f2(e.rx) + "," + f2(e.ry) + " 0 0,0 " + q2(e.x + e.rx, e.y); }   // la metà davanti di un anello
  function arcoDie(e) { return "M" + q2(e.x - e.rx, e.y) + " A" + f2(e.rx) + "," + f2(e.ry) + " 0 0,1 " + q2(e.x + e.rx, e.y); }   // la metà dietro
  // un pezzo tondo "tornito" (vasi, candele, vetri): pr = [[z (unità), raggio (metri)], …] dal basso in alto; dà la sagoma
  function tornio(a, b, pr) {
    var c = P(a, b, 0), n = pr.length, sx = [], dx = [], i, rm = 0;
    for (i = 0; i < n; i++) { var rx = pr[i][1] * 70.71, y = c[1] - pr[i][0]; sx.push([c[0] - rx, y]); dx.push([c[0] + rx, y]); rm = Math.max(rm, rx); }
    var rt = pr[n - 1][1] * 70.71, rb = pr[0][1] * 70.71, d = "M" + sx.map(function (x) { return q2(x); }).join(" L");
    d += rt > .05 ? " A" + f2(rt) + "," + f2(rt / 2) + " 0 0,1 " + q2(dx[n - 1]) : " L" + q2(dx[n - 1]);
    for (i = n - 2; i >= 0; i--) d += " L" + q2(dx[i]);
    if (rb > .05) d += " A" + f2(rb) + "," + f2(rb / 2) + " 0 0,1 " + q2(sx[0]);
    return { d: d + " Z", x0: c[0] - rm, x1: c[0] + rm, cx: c[0], cy: c[1], y0: c[1] - pr[n - 1][0], y1: c[1] - pr[0][0] };
  }
  function tondo(a, b, pr, stops, lw) { var t = tornio(a, b, pr); return pth(t.d, lin("tn", stops, t.x0, 0, t.x1, 0, true), bordo(L, lw || 1.4)); }   // il pezzo tornito, sfumato da sinistra (luce) a destra
  function profilo(z0, z1, n, f) { var o = [], i; for (i = 0; i <= n; i++) { var t = i / n; o.push([z0 + (z1 - z0) * t, f(t)]); } return o; }   // un profilo liscio: f(t) = il raggio
  function riflesso(t, k, w) { return dentro(t.d, ell(t.x0 + (t.x1 - t.x0) * .24, (t.y0 + t.y1) / 2, w || Math.max(.6, (t.x1 - t.x0) * .07), (t.y1 - t.y0) * .36, "#ffffff", op(k || .6))); }   // il riflesso bianco a sinistra
  function tinta(c, t) { return t < 0 ? scuro(c, -t) : chiaro(c, t); }
  // le forme tonde o squadrate in pianta (come nel bagno): centro (ca, cb), mezza larghezza ra, mezza profondità rf davanti e rr dietro; e = 2 ovale, di più = più squadrata
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
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }
  function corpo(livelli, stops, lw) {   // un pezzo pieno: la sagoma sfumata da sinistra a destra
    var pp = sagoma(livelli), b = limiti(pp);
    return pth(chiuso(pp), lin("cx", stops, b[0], 0, b[2], 0, true), bordo(L, lw || 2));
  }
  function lucido(pp, k, alto) {   // il riflesso bianco, vicino al bordo di sinistra (da dove viene la luce)
    var b = limiti(pp), w = b[2] - b[0], h = b[3] - b[1];
    return dentro(chiuso(pp), ell(b[0] + w * .19, b[1] + h * (alto || .5), Math.max(.8, w * .05), h * .3, "#ffffff", "opacity='" + (k || .7) + "'"));
  }
  function sfumTondo(c, k) { k = k || 1; return [[0, chiaro(c, .5 * k)], [.3, chiaro(c, .18 * k)], [.7, c], [1, scuro(c, .32 * k)]]; }   // un colore tondo: chiaro a sinistra, scuro a destra

  // il registro: box = [x0, y0, x1, y1] attorno al centro dell'impronta (già con la grandezza k)
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  PALLONE DA CALCIO: il classico a pentagoni neri ed esagoni bianchi (un icosaedro troncato vero), lucido
  // =========================================================
  def("pallone", { tipo: "sopra", nome: "Pallone da calcio", reparto: "deco", fp: [1, 1], k: 1.3, box: [-12, -21, 16, 8], prezzo: 100 }, function () {
    var R = .11, c = [0, 0, R], C = S(c), r = R * 70.71, i, j, sf = sfera(c, R);
    var s = ombra(2.6, .9, r * 1.1, r * .46) + ombra(.6, .1, r * .6, r * .22, .9);
    var f = (1 + Math.sqrt(5)) / 2, V = [[0, 1, f], [0, -1, f], [0, 1, -f], [0, -1, -f], [1, f, 0], [-1, f, 0], [1, -f, 0], [-1, -f, 0], [f, 0, 1], [-f, 0, 1], [f, 0, -1], [-f, 0, -1]].map(nrm);
    var dir = nrm([.22, .66, .72]), r1 = ruota(V[0], dir), r2 = ruotaAsse(dir, .45);   // girato: un pentagono guarda verso chi gioca, un po' in alto
    V = V.map(function (v) { return r2(r1(v)); });
    function arco(u, v, n) { var o = [], k; for (k = 0; k < n; k++) o.push(nrm(mista(u, v, k / n))); return o; }
    var pen = "", cuc = "";
    for (i = 0; i < 12; i++) {   // i 12 pentagoni neri (un angolo a un terzo di ogni spigolo dell'icosaedro)
      var vi = V[i], vic = [], bb = base(vi);
      for (j = 0; j < 12; j++) if (j !== i && dot(vi, V[j]) > .3) vic.push(V[j]);
      vic.sort(function (m, n) { return Math.atan2(dot(m, bb[1]), dot(m, bb[0])) - Math.atan2(dot(n, bb[1]), dot(n, bb[0])); });
      var an = vic.map(function (w) { return nrm(add(mul(vi, 2), w)); }), pp = [];
      for (j = 0; j < 5; j++) pp = pp.concat(arco(an[j], an[(j + 1) % 5], 4));
      if (Math.max.apply(null, pp.map(sf.vede)) < -.02) continue;
      pen += pth(chiuso(pp.map(sf.su)), "#26292d", "stroke='#15171a' stroke-width='.35' stroke-linejoin='round'");
    }
    for (i = 0; i < 12; i++) for (j = i + 1; j < 12; j++) if (dot(V[i], V[j]) > .3) {   // le cuciture tra gli esagoni bianchi
      var seg = arco(nrm(add(mul(V[i], 2), V[j])), nrm(add(V[i], mul(V[j], 2))), 5).concat([nrm(add(V[i], mul(V[j], 2)))]).filter(function (v) { return sf.vede(v) > 0; });
      if (seg.length > 1) cuc += tratto(aperto(seg.map(sf.su)), "#8a949c", .4, op(.85));
    }
    var cir = cerchio(C, r);
    s += pth(cir, rad("bi", [[0, "#ffffff"], [.45, "#f6f7f9"], [.82, "#d5dbe0"], [1, "#a3adb6"]], .36, .3, .78));
    s += dentro(cir, cuc + pen + pth(cir, rad("ob", [[0, "#000", 0], [.5, "#000", 0], [.85, "#1d2a36", .18], [1, "#1d2a36", .38]], .36, .3, .8)) +
      ell(C[0] - r * .34, C[1] - r * .4, r * .34, r * .2, rad("lu", [[0, "#ffffff", .95], [.55, "#ffffff", .5], [1, "#ffffff", 0]], .5, .5, .5), rot(C[0] - r * .34, C[1] - r * .4, -38)) +
      pth("M" + q2(C[0] - r * .7, C[1] + r * .72) + " A" + f2(r) + "," + f2(r) + " 0 0,0 " + q2(C[0] + r * .72, C[1] + r * .7), "none", "stroke='#ffffff' stroke-width='.7' opacity='.35'"));   // un filo di luce che rimbalza dal piano
    return s + pth(cir, "none", bordo(L, 1.2));
  });

  // =========================================================
  //  MAPPAMONDO: la palla coi continenti veri (si vede l'Italia!), l'asse inclinato, il mezzo meridiano d'ottone,
  //  il piede di noce tornito. Da dietro si vede l'altra faccia della Terra (il Pacifico e le Americhe)
  // =========================================================
  var TERRE = [   // i contorni dei continenti (longitudine latitudine), semplificati
    "-6 35.8,-9.7 30.5,-13 27.6,-16 23.7,-17 21,-17.1 14.7,-16.7 12.4,-13.3 9,-11 6.8,-7.5 4.4,-4 5.2,0 5.6,4.5 6.2,6 4.3,8.5 4.5,9.7 3,9.2 -1,11.8 -4.5,13 -9,13.7 -12,11.8 -17,14.5 -22.8,15.3 -27,18.4 -33.9,20 -34.8,25.6 -33.9,28 -32.6,31 -29.8,32.6 -26,35.5 -24,35 -20,40.5 -15,40.5 -11,39.3 -6.8,39.7 -4,41.5 -1.7,45.5 2.3,48 5,50.8 10.4,51.3 11.8,49 11.2,45 10.4,43.3 11.6,42.7 13.6,39.5 15.6,37.2 19.6,35.6 23.9,34 26.8,32.5 29.9,32.3 31.3,30 31.2,25 31.6,20 30.8,19.5 30.4,15.3 32.3,13.2 32.9,11 33.5,10.2 36.8,6 36.9,3 36.8,-1.5 35.3",
    "49.3 -12,50.5 -15.5,49.5 -17,48.6 -20.5,47.1 -24.8,45.2 -25.5,43.7 -23.5,43.3 -21.5,44.3 -19.5,44 -17,46.3 -15.8,48 -13.8",
    "-5.6 36,-8.9 37,-8.8 38.7,-9.5 39.4,-8.7 42,-9.3 43,-8 43.7,-1.8 43.4,-1.2 46,-4.5 47.9,-1.6 48.7,.2 49.6,1.6 50.9,4.5 52.6,7 53.6,8.6 53.9,8.2 56.8,10.6 57.7,10 55.2,12.5 54.4,14.2 53.9,18.6 54.4,21 55.2,21.7 57.6,24.3 57.4,23.5 58.9,28 59.6,22.3 60.4,21.3 63.2,24.5 64.9,22 65.6,19 63.2,17.3 61.8,18.9 59.2,16.6 57.7,14.2 55.4,12.9 55.6,11.8 57.7,10.5 59.8,8.5 58.2,5.3 59.3,5 61,8 63.4,12.4 66,14.5 67.8,18.9 69.7,23.6 70.6,25.8 71.1,31 70.3,33 69.3,40.5 67.7,44 66.2,44.2 68.4,49 68,55.6 68.5,61.3 69.7,66.8 69.5,68.6 70.5,66.8 71.6,69.5 73,72.6 71,73.6 68.6,74.5 72.4,80.6 73.6,86.9 74.2,95 76.2,104.3 77.7,111 76.6,113.5 73.6,119 73.1,126.7 72.4,130 71,139 71.5,146 72.3,152 70.8,159.7 69.7,167 69.6,176 69.8,-178 68.9,-174 67.3,-169.7 66.1,-173.5 64.4,-178.5 65.5,179 62.5,174 61.8,170.3 60,164 59.9,163.4 56.2,162 54.7,160 53,156.7 51,156 55,156.7 57,160 60.5,155 59.4,150.8 59.6,143 59.3,140.7 58.3,137 54.6,141.2 52.9,140.5 50,138.6 47,135.6 43.8,131.9 43.1,129.6 41,129.4 36.5,129.2 35.2,126.5 34.4,126.7 37.7,124.7 39.6,121.6 39,119.7 39.9,117.8 39,118.8 37.5,122.6 37.4,120.3 36,119.2 34.6,121.9 31.1,121.6 29.9,119.5 25.6,118 24.4,114.2 22.3,110.4 21.2,108.3 21.6,106.7 20.6,105.8 19,108.2 16,109.2 13.8,109.2 11.6,107 10.4,105.1 8.6,104.8 10.3,102 12.2,100.9 13.4,99.2 10.3,100.4 7.2,102.2 6.2,103.4 4.7,104.2 1.4,101.3 2.8,100.3 6.4,98.4 8,98.5 12.3,97.6 16.5,96.2 16.8,94.4 16,93.3 20,91.8 22.4,90.3 21.9,87 21.5,85.2 19.6,82.3 16.8,80.3 15.5,80.3 13.1,79.8 10.3,77.5 8.1,76.3 9.9,75.2 12.8,73.8 15.5,72.8 18.9,72.6 21.2,70.2 22.6,68.9 22.3,67 24.8,61.6 25.2,57.3 25.8,56.3 27.1,54 26.7,51 27.9,50.1 30.1,48 30,48.5 28.4,50.1 26.3,51.5 25.3,51.6 24.1,54.4 24.5,56 26.2,56.4 24.6,58.5 23.6,59.8 22.4,57.7 18.9,55.3 17.3,52.2 15.6,49 14.5,45 12.8,43.4 12.7,42.7 15.6,41.3 18.5,39.2 21.5,37.2 24.8,35.1 28.1,34.9 29.5,34.2 31.3,35 32.8,35.9 35.4,36.2 36.6,34.6 36.8,32 36.5,30.6 36.8,28.2 36.7,26.7 38.4,26.2 39.5,26.4 40.2,29 41,26 40.8,22.9 40.6,23.8 39.5,23 38.2,22.4 36.5,21.6 37,21.1 38.3,20.2 39.6,19.4 41.8,18.5 42.5,16.4 43.5,15.2 44.2,14 45.1,13.7 45.6,12.3 45.4,12.3 44.4,13.5 43.6,14.2 42.5,16.2 41.9,16.9 41.1,18.5 40.1,18.4 39.8,17.2 40.5,16.5 39.6,17.1 39.1,16.5 38.4,16.1 37.9,15.6 38.1,16 38.7,15.8 39.9,15.3 40.1,14.8 40.6,14.3 40.8,13.6 41.2,12.6 41.5,11.8 42.1,11.1 42.5,10.5 43,10.3 43.6,9.8 44.1,8.9 44.4,8.2 43.9,7.5 43.8,6 43.1,4.8 43.4,3 43.2,3.2 42.2,2.2 41.4,.9 41,-.3 39.5,.2 38.7,-.5 38.3,-1.6 37.3,-2.1 36.7,-4.4 36.7",
    "-168 65.6,-164.5 67.6,-156.8 71.3,-148 70.3,-141 69.6,-128 70.2,-117 68.9,-108 68.2,-98 67.8,-94.5 71.5,-90 68.5,-85 69.5,-81.5 67.5,-86 66.5,-88 64.2,-94 61,-94.2 58.7,-92.5 57,-88.8 56.6,-82.3 55.1,-82.3 52.9,-79.5 51.5,-78.8 54.5,-77.2 58.2,-77.6 60.6,-78 62.4,-73.5 62.3,-71 61.1,-69.5 59,-65 60.2,-64.4 58.3,-61.5 56.5,-60 55.2,-56.2 52.4,-59.5 50.2,-64.5 50.2,-66.8 49.2,-64.5 48.9,-64.8 46.3,-61 45.5,-63.6 44.6,-65.8 43.6,-66.9 44.8,-70.2 43.7,-70.6 41.6,-73.9 40.6,-74.2 39.5,-75.5 38.4,-76.3 37,-75.5 35.2,-77.9 34,-79.9 32.8,-81.4 30.4,-80.1 26.7,-80.4 25.2,-81.8 26.1,-82.8 28,-84.3 30,-87 30.4,-89.4 30.3,-89.2 29.1,-90.7 29.1,-93.8 29.7,-95 29.2,-97.2 27.6,-97.4 25.8,-97.7 22.5,-96.1 19.2,-94.5 18.2,-91.5 18.6,-90.4 21,-87 21.5,-87.6 18.5,-88.3 16,-86 16,-83.3 15,-83.6 11,-82.5 9.2,-79.5 9.6,-77.4 8.6,-78.9 8.4,-80 7.4,-81.7 8.2,-85.7 10,-86.5 11.8,-87.7 13.2,-91.4 13.9,-94.5 16.2,-96.5 15.7,-99.9 16.8,-105.3 20.4,-105.6 21.6,-109.4 23.2,-112.2 24.8,-114.3 28,-115.8 30.4,-117.1 32.6,-118.4 34,-120.6 34.6,-122.5 37.8,-124.2 40.4,-124.5 42.8,-123.9 46.2,-124.7 48.4,-125 50,-127.7 51,-130.3 54.3,-133 57,-136.5 58.3,-139.7 59.6,-145.7 60.4,-149.9 61.2,-152 58.9,-156.6 56.8,-161.7 55.3,-163 54.8,-157.5 58.8,-162 60,-165.4 61.1,-164.8 63,-161 64.4,-166.6 65.3",
    "-77.3 8.3,-75.5 10.5,-74.2 11.3,-71.6 12.4,-71.6 10.6,-68 10.5,-64 10.6,-61.9 10.7,-60.5 8.5,-57 6,-52.5 5,-50.5 1.8,-49.4 -1,-44.3 -2.5,-39.8 -2.9,-35.2 -5.8,-34.8 -7.1,-35.7 -9.6,-38.5 -13,-39.2 -17.7,-40.3 -20.3,-43.2 -22.9,-46.3 -24,-48.5 -26.3,-48.8 -28.5,-51.2 -30.7,-53.4 -33.8,-56.2 -34.9,-57.5 -36.3,-56.7 -36.9,-58 -38.6,-62.3 -38.8,-62.5 -40.8,-65 -42,-67.6 -46,-65.8 -47.8,-68.3 -50.2,-68.4 -52.3,-69.6 -55.5,-67.2 -55.9,-71 -55,-74.6 -52.8,-75.6 -48.5,-74 -44,-73.6 -41.5,-73.4 -37.2,-71.6 -33,-71.4 -29.9,-70.4 -23.6,-70.3 -18.5,-76.2 -14,-77.1 -12,-79 -8.1,-81.3 -5.1,-80.4 -2.2,-80.1 .9,-78.6 2.7,-77.4 4,-77.4 7",
    "113.4 -22,114.1 -21.8,114.8 -26,115 -29.5,115.7 -32,115 -34.3,118 -35,123.6 -33.9,126 -32.3,131.2 -31.5,134.2 -32.8,135.9 -34.8,137.7 -33,138.5 -34.9,140 -37.5,144.9 -37.8,146.4 -39.1,150 -37.5,151.2 -33.9,153.5 -28.2,153.1 -25,150.6 -22.5,146.8 -19.3,145.8 -16.9,145.3 -14.8,143.5 -12.8,142.5 -10.7,141.6 -12.8,141.5 -16.5,140 -17.6,137.5 -16,135.8 -14.8,136.9 -12.2,132.6 -11.6,130.8 -12.4,129.4 -14.9,126.9 -13.8,125 -15,122.2 -18,119.6 -20.1,116.7 -20.6",
    "-73 78.4,-60 82,-40 83.5,-22 82.6,-12 81.5,-19 77,-22 72.5,-25.5 68.5,-35.5 65.5,-43 60,-48 61,-51.5 64,-53.5 66.9,-54 70.2,-56.5 74.2,-66 76",   // la Groenlandia
    "-80 73.5,-71 71,-62 66.5,-65 62.5,-71.5 63.5,-74 64.5,-77.5 64.4,-78.5 67.5,-82 69,-86 70.5", "-90 76.5,-80 76.5,-62 82,-80 83,-95 81", "-118 72.5,-105 73.5,-101 69.5,-108 68.8,-118 69.5",
    "-5.7 50.1,1.4 51.2,1.7 52.7,.2 53.5,-1.6 55.6,-2 57.6,-3 58.6,-5 58.6,-6.2 56.7,-5.6 55.3,-3.2 54.9,-3 53.3,-4.6 53.3,-4.1 52.4,-5.3 51.8,-3.2 51.4,-4.5 51.1",   // la Gran Bretagna
    "-6 52.2,-6.2 53.3,-5.9 54.6,-7.3 55.3,-8.5 54.5,-10 53.4,-9.9 51.8,-8.4 51.6", "-22.5 64,-24 65.5,-22 66.4,-16 66.5,-13.5 65.2,-15 64.2,-18.8 63.4",
    "12.4 37.8,15.6 38.3,15.1 36.7", "8.4 39,9.8 41.1,9.6 39.1", "8.6 41.4,9.4 43,9.5 41.4",   // Sicilia, Sardegna, Corsica
    "130.9 31,131.7 33.2,132.5 34.3,135.1 33.9,136.9 34.3,139.8 35,140.9 36.9,141.9 39.6,141.4 41.4,140.5 41.8,141.6 42.6,143.3 42,145.8 43.4,144.3 44.1,141.9 45.5,141.4 43.3,139.9 42.2,140 40.6,139.8 38.8,138.6 37.9,136.7 37.1,135.9 35.7,133.2 35.6,131.1 34.4,129.8 33.3,130.2 31.5",
    "79.9 9.7,81.9 7.4,81.2 6.1,80.1 6.2", "95.3 5.6,98.3 4.1,100.4 2.1,103.7 -.4,106 -3.2,105.8 -5.9,104.5 -5.9,102.3 -4,100.4 -1.3,98.6 1.7",
    "109 1.6,109.6 -1,110.2 -2.9,114.5 -3.9,116.2 -2.6,116.9 .2,117.9 1.1,119 5.1,116.8 7,115.4 5.4,113.9 4.6,111.4 2.6", "105.2 -6.8,108.2 -6.3,111 -6.4,114.4 -7.8,112.8 -8.4,108.5 -7.8,106.4 -7.3",
    "131 -1.5,134.2 -.9,138 -1.6,141 -2.6,145 -4.5,147.6 -6.1,150.4 -10.4,147.5 -10.1,146 -8.1,144 -7.7,141.1 -9.1,138.5 -8.4,137.9 -5.3,135 -4.4,132.9 -4.1",
    "120.6 18.5,122.3 18.4,122.2 16.2,124 13,121.2 13.6,120.1 14.7", "122 6.9,125.3 9.8,126.6 7.3,125.4 5.6,124.1 6.9", "120.1 23,121.9 25.1,121.5 22,120.7 21.9",
    "-84.9 21.9,-80.5 23.1,-77 21,-74.2 20.2,-77.7 19.8,-81 21.6", "-74.4 18.4,-72.8 19.9,-68.4 18.6,-71.4 17.7",
    "144.6 -40.7,148.3 -40.9,148.2 -42.9,146.9 -43.6,145.2 -42.2", "172.7 -34.4,178.5 -37.7,176.9 -39.6,174.8 -41.3,173.9 -39.2,174.6 -36.9", "172.7 -40.5,174.3 -41.7,171.2 -44.4,169 -46.6,166.5 -46,168.2 -44",
    "52 71.5,56 70.6,58 70.6,57 72.5,62 75.5,69 76.9,66 77,56 75,52 73", "11 78.5,17 76.5,22 77.5,27 79.5,20 80.5,11 79.8",
    "-180 -72,-150 -76,-120 -73,-90 -72,-60 -64,-30 -78,0 -70,30 -69,60 -67,90 -66,120 -66,150 -68,179.9 -72"   // l'Antartide
  ];
  var MARI = ["27.9 42,28.6 43.4,30.6 46.5,33.5 46,32.5 45.4,33.5 44.4,36.6 45.2,38.2 47,39.7 47.2,37.5 44.7,39.7 43.6,41.6 41.6,39.7 41,35.5 41.7,31 41.2,29.1 41.2",   // il mar Nero
    "47.5 45.5,49.2 46.5,51.5 46.9,53 45.3,51.3 44.5,52.8 42,53.9 40.5,53.2 39,54 37.4,50.4 37.2,49.1 38.1,49.3 40.3,48.4 41.7,47.5 43"];   // il mar Caspio
  function lista(s) { return s.split(",").map(function (x) { var v = x.trim().split(" "); return [+v[0], +v[1]]; }); }
  def("mappamondo", { tipo: "sopra", nome: "Mappamondo", reparto: "deco", fp: [1, 1], k: 1.2, box: [-16, -30, 21, 10], dietro: true, prezzo: 450 }, function () {
    var R = .11, g = .017, ZS = .113, c = [0, 0, ZS + R + g], C = S(c), r = R * 70.71, T = 23.5 / 57.296, i, k;
    var A = nrm([Math.sin(T) * .7071, -Math.sin(T) * .7071, Math.cos(T)]), H = [.7071, -.7071, 0], H2 = nrm(sub(H, mul(A, dot(H, A))));   // l'asse (il polo nord pende a destra) e il piano del meridiano
    var Vp = nrm(sub(VI, mul(A, dot(VI, A)))), E = crs(Vp, A), LC = 12;   // davanti c'è la longitudine 12° est (l'Europa e l'Africa)
    function dirLL(lo, la) { var d = (lo - LC) / 57.296, t = la / 57.296; return add(mul(add(mul(Vp, Math.cos(d)), mul(E, Math.sin(d))), Math.cos(t)), mul(A, Math.sin(t))); }
    var sf = sfera(c, R), s = ombra(2.4, 1, 14, 6);
    // il piede di noce tornito e il gambo
    var NOCE = [[0, "#b98a5e"], [.3, "#8a5a33"], [.7, "#5c3a21"], [1, "#331f10"]];
    s += tondo(0, 0, [[0, .074], [.7, .076], [1.5, .073], [2.1, .062]], NOCE, 1.4) + ell(P(0, 0, 2.1)[0], P(0, 0, 2.1)[1], .062 * 70.71, .062 * 35.36, lin("nt", [[0, "#c79a6c"], [1, "#7a4a28"]], 0, 0, 1, 1), bordo(L, 1));
    s += tratto(arcoDav(anello(0, 0, 1.4, .0745)), "#d9b26a", .5, op(.8));   // il filo chiaro sul bordo
    s += tondo(0, 0, profilo(2.1, ZS * 61, 12, function (t) { return .011 + .006 * Math.exp(-Math.pow((t - .3) / .14, 2)) + .009 * Math.max(0, 1 - t * 6); }), NOCE, 1.1);
    // il meridiano d'ottone: mezzo cerchio dal polo nord al polo sud, passando dal basso (dove lo regge il gambo)
    var rg = R + g, dietroM = "", davantiM = "", run = [], dav = null;
    function mer(fi) { return add(mul(A, Math.cos(fi)), mul(H2, Math.sin(fi))); }
    function pezzoM(pp) { var d = aperto(pp.map(function (v) { return S(add(c, mul(v, rg))); })); return tratto(d, L, 2.1) + tratto(d, "#d4a72c", 1.05) + tratto(d, "#fff1b8", .35, "transform='translate(-.2 -.25)'"); }
    for (i = 0; i <= 48; i++) {   // il meridiano in due pezzi: quello dietro la palla e quello davanti
      var v = mer(i / 48 * Math.PI), dv = guarda(v) >= 0;
      if (dav !== null && dv !== dav) { run.push(v); if (dav) davantiM += pezzoM(run); else dietroM += pezzoM(run); run = []; }
      run.push(v); dav = dv;
    }
    if (dav) davantiM += pezzoM(run); else dietroM += pezzoM(run);
    var ps = S(add(c, mul(A, -rg)));   // il perno del polo sud
    s += dietroM + cer(ps[0], ps[1], .9, "#f2c94c", bordo(L, .5));
    // la palla: il mare, i continenti, i paralleli e i meridiani, poi la luce e l'ombra
    var cir = cerchio(C, r), terra = "", rete = "";
    TERRE.forEach(function (t) {
      var pp = lista(t).map(function (x) { return dirLL(x[0], x[1]); });
      if (Math.max.apply(null, pp.map(sf.vede)) < 0) return;
      terra += pth(chiuso(pp.map(sf.su)), "#8ce99a", "stroke='#2b8a3e' stroke-width='.35' stroke-linejoin='round'");
    });
    MARI.forEach(function (t) { var pp = lista(t).map(function (x) { return dirLL(x[0], x[1]); }); if (Math.max.apply(null, pp.map(sf.vede)) > 0) terra += pth(chiuso(pp.map(sf.su)), "#4dabf7", "stroke='#2b8a3e' stroke-width='.3'"); });
    function riga(pp) { var o = "", run = []; pp.forEach(function (v) { if (sf.vede(v) > .02) run.push(sf.su(v)); else { if (run.length > 1) o += aperto(run) + " "; run = []; } }); if (run.length > 1) o += aperto(run); return o; }
    for (k = -60; k <= 60; k += 30) { var pr = []; for (i = 0; i <= 72; i++) pr.push(dirLL(i * 5 - 180, k)); rete += tratto(riga(pr), k === 0 ? "#fff3bf" : "#ffffff", k === 0 ? .45 : .3, op(k === 0 ? .7 : .35)); }
    for (k = -180; k < 180; k += 30) { var pm = []; for (i = 0; i <= 36; i++) pm.push(dirLL(k, i * 5 - 90)); rete += tratto(riga(pm), "#ffffff", .3, op(.35)); }
    s += pth(cir, rad("ma", [[0, "#bfe3ff"], [.4, "#5cb3f5"], [.8, "#1f78c8"], [1, "#145a9c"]], .36, .3, .75));
    s += dentro(cir, terra + rete + pth(cir, rad("ol", [[0, "#ffffff", .35], [.3, "#ffffff", 0], [.62, "#000", 0], [1, "#0b2440", .42]], .36, .3, .78)) +
      ell(C[0] - r * .38, C[1] - r * .42, r * .26, r * .14, "#ffffff", op(.75) + rot(C[0] - r * .38, C[1] - r * .42, -38)));
    s += pth(cir, "none", bordo(L, 1.2));
    // il perno del polo nord e la metà del meridiano che passa davanti
    var pn0 = S(add(c, mul(A, R * .96))), pn1 = S(add(c, mul(A, rg + .004)));
    var perno = tratto(linea(pn0, pn1), L, 2) + tratto(linea(pn0, pn1), "#e9c46a", 1) + cer(pn1[0], pn1[1], 1.1, "#f2c94c", bordo(L, .6));
    return s + (guarda(A) > -.2 ? davantiM + perno : perno + davantiM);
  });

  // =========================================================
  //  CACTUS COL FIORE: la colonna con le coste e le spine, due braccia come un piccolo saguaro, il fiore rosa in cima,
  //  il vaso di terracotta col bordo e la ghiaietta
  // =========================================================
  def("cactus", { tipo: "sopra", nome: "Cactus col fiore", reparto: "deco", fp: [1, 1], k: 1.3, box: [-12, -33, 17, 9], dietro: true, prezzo: 150 }, function () {
    var s = ombra(2, 1, 10, 4.2), r = rnd(11), i, k;
    var TC = [[0, "#ffb38a"], [.3, "#f0773f"], [.72, "#c8501f"], [1, "#8f3410"]];   // la terracotta
    var vaso = tornio(0, 0, [[0, .037], [3.6, .047]]);
    s += pth(vaso.d, lin("tc", TC, vaso.x0, 0, vaso.x1, 0, true), bordo(L, 1.3)) + riflesso(vaso, .35);
    s += tondo(0, 0, [[3.4, .053], [4.1, .057], [5.8, .057]], TC, 1.2);   // il bordo grosso
    var bo = anello(0, 0, 5.8, .057), te = anello(0, 0, 5.4, .049);
    s += ell(bo.x, bo.y, bo.rx, bo.ry, lin("tb", [[0, "#ffc29e"], [1, "#d86430"]], 0, 0, 1, 1), bordo(L, 1)) + ell(te.x, te.y, te.rx, te.ry, "#7a5a3c", bordo(L, .6));
    var gh = "";   // la ghiaietta chiara
    for (i = 0; i < 34; i++) { var ga = r() * 6.283, gr = Math.sqrt(r()) * .047; var gp = P(Math.cos(ga) * gr, Math.sin(ga) * gr, 5.5); gh += ell(gp[0], gp[1], .5 + r() * .3, .36 + r() * .18, ["#e9e2d0", "#cfc6b0", "#b9ae97", "#f4efe4"][i % 4], "stroke='#8a7b62' stroke-width='.18'"); }
    s += dentro(ovale(te.x, te.y, te.rx, te.ry), gh);
    // le braccia a "L" (di profilo, così si vedono; da dietro passano dall'altra parte): escono di lato, il gomito tondo, poi salgono
    var RC = .03, Z0 = 5.4, ZT = 17.4;
    function braccio(lato, z0, lung, z1, rb) {
      var k0 = lato * .7071, pa = P(k0 * .005, -k0 * .005, z0), pe = P(k0 * (RC + lung), -k0 * (RC + lung), z0), pc = P(k0 * (RC + lung), -k0 * (RC + lung), z1);
      var w = rb * 70.71 * 2, el = pe[0], dir = el > pa[0] ? 1 : -1, gm = w * .95, o = "";
      var d = "M" + q2(pa) + " L" + q2(el - dir * gm, pa[1]) + " Q" + q2(el, pa[1]) + " " + q2(el, pa[1] - gm) + " L" + q2(pc);
      o += tratto(d, L, w + 1.3) + tratto(d, "#2f9e44", w) + tratto(d, "#51cf66", w * .66, "transform='translate(" + f2(-w * .1) + " " + f2(-w * .1) + ")'") + tratto(d, "#a9e9b4", w * .22, op(.9) + " transform='translate(" + f2(-w * .27) + " " + f2(-w * .27) + ")'");
      var dc = "M" + q2(pa) + " L" + q2(el - dir * gm, pa[1]) + " Q" + q2(el, pa[1]) + " " + q2(el, pa[1] - gm) + " L" + q2(pc[0], pc[1] + w * .45);   // le coste: la stessa linea spostata
      [-1, 1].forEach(function (sg) { o += tratto(dc, "#237a35", .28, op(.75) + " transform='translate(" + f2(sg * w * .24) + " " + f2(sg * w * .24) + ")'"); });
      for (k = 0; k < 4; k++) { var yy = pc[1] + .9 + k * (pa[1] - gm - pc[1] - .9) / 3; o += cer(el - w * .24, yy, .26, "#fffbe6") + cer(el + w * .24, yy + .8, .26, "#fffbe6"); }   // le areole
      return { s: o, cima: [pc[0], pc[1] - w * .35], w: w };
    }
    var bs = braccio(-1, 9.6, .042, 13.8, .016), bd = braccio(1, 12, .036, 15.8, .014);
    s += bs.s + bd.s;
    // la colonna con le coste: le righe scure tra le coste, la luce sul bordo di ogni costa, le areole con le spine
    var VERDE = [[0, "#b2f2bb"], [.3, "#69db7c"], [.72, "#37b24d"], [1, "#1b6e2d"]];
    var col = tornio(0, 0, [[Z0, RC], [ZT, RC]]), Ct = P(0, 0, ZT), rx = RC * 70.71;
    var dCol = "M" + q2(col.x0, col.y1) + " L" + q2(col.x0, Ct[1]) + " A" + f2(rx) + "," + f2(rx * .95) + " 0 0,1 " + q2(col.x1, Ct[1]) + " L" + q2(col.x1, col.y1) + " A" + f2(rx) + "," + f2(rx / 2) + " 0 0,1 " + q2(col.x0, col.y1) + " Z";
    var coste = "", sp = "";
    for (k = 0; k < 8; k++) {
      var an = (k + .5) / 8 * Math.PI * 2 + (G < 0 ? .2 : 0), sx = Math.sin(an), cz = Math.cos(an);
      if (cz < -.05) continue;   // dietro, non si vede
      var xx = Ct[0] - sx * rx, top = Ct[1] - Math.sqrt(Math.max(0, 1 - sx * sx)) * rx * .95;
      coste += tratto("M" + q2(xx, col.y1 + rx * .5 * cz) + " L" + q2(xx, Ct[1]) + " Q" + q2(xx, top) + " " + q2(Ct[0] + (xx - Ct[0]) * .2, Ct[1] - rx * .82), "#1f6b30", .45, op(.55 + .3 * cz));
      var xa = Ct[0] - Math.sin(an + .39) * rx;
      if (Math.cos(an + .39) > .1) for (i = 0; i < 6; i++) { var ya = Ct[1] + .4 + i * 1.75 + (k % 2) * .8; sp += cer(xa, ya, .32, "#fffbe6", "stroke='#c9b98a' stroke-width='.12'") + tratto("M" + q2(xa - .7, ya - .5) + " L" + q2(xa + .7, ya + .5) + " M" + q2(xa + .7, ya - .5) + " L" + q2(xa - .7, ya + .5), "#fff4cc", .14, op(.9)); }
    }
    s += pth(dCol, lin("cc", VERDE, col.x0, 0, col.x1, 0, true), bordo(L, 1.2)) + dentro(dCol, coste + sp + ell(col.x0 + rx * .45, (Ct[1] + col.y1) / 2, .5, (col.y1 - Ct[1]) * .4, "#ffffff", op(.3)));
    // il fiore rosa in cima: i petali dietro, gli stami gialli, i petali davanti; e un bocciolo sul braccio
    var fc = [Ct[0], Ct[1] - rx * .78], fi = "";
    for (i = 0; i < 7; i++) { var a1 = -78 + i * 26; fi += ell(fc[0], fc[1] - 2.2, 1.05, 2.3, i % 2 ? "#f783ac" : "#faa2c1", bordo("#a61e4d", .35) + rot(fc[0], fc[1], a1)); }
    fi += ell(fc[0], fc[1] - .5, 1.6, .7, "#ffe066", bordo("#c9a227", .3));
    for (i = 0; i < 6; i++) fi += cer(fc[0] - 1.1 + i * .45, fc[1] - .7 - (i % 2) * .35, .22, "#fff3bf");
    for (i = 0; i < 5; i++) { var a2 = -56 + i * 28; fi += ell(fc[0], fc[1] - 1.1, .95, 1.6, i % 2 ? "#f06595" : "#f783ac", bordo("#a61e4d", .35) + rot(fc[0], fc[1] + .6, a2 + 180)); }
    s += fi;
    var bc = bs.cima;
    s += ell(bc[0], bc[1] - 1.3, .9, 1.5, lin("bc", [[0, "#ffc9de"], [1, "#e64980"]], 0, 0, 1, 1), bordo("#a61e4d", .35)) + ell(bc[0], bc[1] - .3, 1, .5, "#40c057", bordo("#2b8a3e", .3));
    return s;
  });

  // =========================================================
  //  CANDELE PROFUMATE: tre candele a colonna (rosa, crema, menta) sul piattino di ceramica col filo d'oro,
  //  la cera colata, la fascetta di carta; davanti un rametto di lavanda. Di notte le fiammelle accese
  // =========================================================
  def("candele", { tipo: "sopra", nome: "Candele profumate", reparto: "luci", fp: [1, 1], k: 1.2, box: [-16, -29, 21, 11], dietro: true, prezzo: 250, luce: [0, -17, 70, "#ffd8a8"] }, function () {
    var s = ombra(2.2, 1.4, 14, 6.4), r = rnd(31), i;
    // il piattino
    var pi = tornio(0, 0, [[0, .122], [.5, .132], [1.3, .14]]);
    s += pth(pi.d, lin("pi", [[0, "#ffffff"], [.4, "#f1f3f5"], [.8, "#ced4da"], [1, "#9aa5ae"]], pi.x0, 0, pi.x1, 0, true), bordo(L, 1.3));
    var tp = anello(0, 0, 1.3, .14), in1 = anello(0, 0, 1, .118);
    s += ell(tp.x, tp.y, tp.rx, tp.ry, lin("pt", [[0, "#ffffff"], [1, "#e3e8ec"]], 0, 0, 1, 1), bordo(L, 1)) + ell(in1.x, in1.y, in1.rx, in1.ry, rad("pf", [[0, "#f8f9fa"], [.8, "#e9ecef"], [1, "#d3d9de"]], .45, .4, .6));
    s += pth(arcoDav(anello(0, 0, 1.3, .136)), "none", "stroke='#e0b84a' stroke-width='.55'") + pth(arcoDie(anello(0, 0, 1.3, .136)), "none", "stroke='#e0b84a' stroke-width='.45' opacity='.8'");   // il filo d'oro
    // le tre candele: [a, b, raggio, altezza (unità), colore]
    var C3 = [[-.035, -.035, .043, 12.6, "#fff3bf"], [-.012, .074, .04, 9.2, "#ffdeeb"], [.074, -.012, .038, 7, "#d3f9d8"]], fiamme = [];
    function candela(cd) {
      var a = cd[0], b = cd[1], rr = cd[2], h = cd[3], col = cd[4], z0 = 1.1, zt = z0 + h, o = "";
      var t = tornio(a, b, [[z0, rr], [zt - .5, rr], [zt, rr * .96]]);
      o += pth(t.d, lin("cd", NOTTE ? [[0, "#fffaf0"], [.35, chiaro(col, .35)], [.8, col], [1, scuro(col, .18)]] : [[0, chiaro(col, .6)], [.35, chiaro(col, .25)], [.8, scuro(col, .04)], [1, scuro(col, .2)]], t.x0, 0, t.x1, 0, true), bordo(L, 1.1));
      if (NOTTE) o += dentro(t.d, rett(t.x0, t.y0, t.x1 - t.x0, (t.y1 - t.y0) * .55, 0, lin("cg", [[0, "#fff4d6", .85], [1, "#fff4d6", 0]], 0, 0, 0, 1)));   // la cera che si illumina sotto la fiamma
      // le colate di cera sul davanti
      var cr = rnd(Math.round(h * 10)), j, gc = [[-.75, .55], [.15, .22], [.62, .38]];
      for (j = 0; j < 3; j++) {   // le colate: lunghe diverse, la goccia in fondo, il filo di luce a sinistra
        var an = gc[j][0] + cr() * .15, ex = t.cx + Math.sin(an) * rr * 70.71, top = anello(a, b, zt, rr * .97), ey = top.y + Math.cos(an) * top.ry, ln = .8 + gc[j][1] * h * (.6 + cr() * .5), wd = .42 + cr() * .2;
        var dd = "M" + q2(ex - wd * 1.3, ey - .4) + " Q" + q2(ex - wd, ey + .6) + " " + q2(ex - wd * .8, ey + ln * .6) + " L" + q2(ex - wd, ey + ln) + " A" + f2(wd) + "," + f2(wd * 1.1) + " 0 0,0 " + q2(ex + wd, ey + ln) + " L" + q2(ex + wd * .8, ey + ln * .5) + " Q" + q2(ex + wd, ey + .6) + " " + q2(ex + wd * 1.3, ey - .4) + " Z";
        o += pth(dd, chiaro(col, .3), "stroke='" + scuro(col, .12) + "' stroke-width='.18' opacity='.9'") + tratto("M" + q2(ex - wd * .45, ey + .5) + " L" + q2(ex - wd * .45, ey + ln), "#ffffff", .22, op(.8));
      }
      if (h > 12) {   // la fascetta di carta con l'etichetta, sulla candela alta
        var f0 = anello(a, b, z0 + h * .32, rr * 1.005), f1b = anello(a, b, z0 + h * .5, rr * 1.005);
        var fd = "M" + q2(f0.x - f0.rx, f0.y) + " A" + f2(f0.rx) + "," + f2(f0.ry) + " 0 0,0 " + q2(f0.x + f0.rx, f0.y) + " L" + q2(f1b.x + f1b.rx, f1b.y) + " A" + f2(f1b.rx) + "," + f2(f1b.ry) + " 0 0,1 " + q2(f1b.x - f1b.rx, f1b.y) + " Z";
        o += pth(fd, lin("kr", [[0, "#e2c29a"], [.5, "#c8a27a"], [1, "#8f6a45"]], f0.x - f0.rx, 0, f0.x + f0.rx, 0, true), bordo(L, .6));
        var et = P(a + (G > 0 ? .022 : -.022), b + (G > 0 ? .03 : -.03), z0 + h * .41);
        o += rett(et[0] - 1.6, et[1] - 1, 3.2, 2, .3, "#fffdf6", bordo("#8f6a45", .3)) + tratto("M" + q2(et[0] - 1, et[1] - .3) + " L" + q2(et[0] + 1, et[1] - .3) + " M" + q2(et[0] - .8, et[1] + .4) + " L" + q2(et[0] + .6, et[1] + .4), "#b08a5a", .22);
      }
      // la cima: il bordo, il laghetto di cera, lo stoppino
      var cm = anello(a, b, zt, rr * .96), lg = anello(a, b, zt - .35, rr * .7);
      o += ell(cm.x, cm.y, cm.rx, cm.ry, NOTTE ? "#fff8e8" : chiaro(col, .45), bordo(L, .8)) + ell(lg.x, lg.y, lg.rx, lg.ry, NOTTE ? rad("lg" + h, [[0, "#ffffff"], [.6, "#fff1c4"], [1, "#f5d58c"]], .5, .5, .6) : chiaro(col, .15), "stroke='" + scuro(col, .15) + "' stroke-width='.3'");
      var sp = P(a, b, zt - .3);
      o += tratto("M" + q2(sp) + " q.2,-1 -.3,-1.9", "#2b2018", .5);
      fiamme.push([sp[0] - .3, sp[1] - 1.9]);
      return o;
    }
    // la lavanda, appoggiata davanti sul piattino
    function lavanda() {
      var a0 = P(-.075, .085, 1.6), a1 = P(.07, .055, 2.2), o = tratto(linea(a0, a1), "#2f5d3a", 1.1) + tratto(linea(a0, a1), "#8fbc8f", .5), j;
      for (j = 0; j < 9; j++) { var t = .38 + j * .075, x = a0[0] + (a1[0] - a0[0]) * t, y = a0[1] + (a1[1] - a0[1]) * t; o += ell(x, y - .25, .75, .55, j % 2 ? "#9775fa" : "#b197fc", bordo("#5f3dc4", .25)) + ell(x + .3, y + .35, .55, .45, "#845ef7", bordo("#5f3dc4", .2)); }
      return o + ell(a0[0] - .5, a0[1] + .2, 1.4, .5, "#6b8f71", bordo("#2f5d3a", .25) + rot(a0[0] - .5, a0[1] + .2, -12));
    }
    var cose = C3.map(function (cd) { return [vicino(cd[0], cd[1]), candela(cd)]; });
    cose.push([vicino(0, .072), lavanda()]);
    s += ordina(cose);
    if (NOTTE) fiamme.forEach(function (f) {   // le fiammelle: l'alone, la goccia arancio, il cuore bianco, la base azzurra
      s += ell(f[0], f[1] - 1.8, 2.6, 3.4, rad("al", [[0, "#ffd8a8", .9], [1, "#ffd8a8", 0]], .5, .5, .5)) +
        pth("M" + q2(f[0], f[1] + .4) + " C" + q2(f[0] - 1.5, f[1] - .4) + " " + q2(f[0] - .6, f[1] - 2.8) + " " + q2(f[0], f[1] - 4.2) + " C" + q2(f[0] + .6, f[1] - 2.8) + " " + q2(f[0] + 1.5, f[1] - .4) + " " + q2(f[0], f[1] + .4) + " Z", lin("fm", [[0, "#ffffff"], [.35, "#ffe066"], [.8, "#ff922b"], [1, "#f76707"]], 0, 0, 0, 1), "stroke='#f76707' stroke-width='.25'") +
        ell(f[0], f[1] - 1.1, .45, .9, "#ffffff") + ell(f[0], f[1] + .1, .5, .3, "#74c0fc", op(.8));
    });
    return s;
  });

  // =========================================================
  //  LAMPADA LAVA: il piede di metallo a cono, il vetro a razzo col liquido arancio e le bolle di cera rossa,
  //  il cappuccio; il filo con l'interruttore esce di dietro. Di notte il liquido si accende
  // =========================================================
  def("lampada_lava", { tipo: "sopra", nome: "Lampada lava", reparto: "luci", fp: [1, 1], k: 1.2, box: [-16, -36, 16, 8], dietro: true, prezzo: 450, luce: [0, -21, 80, "#ff922b"] }, function () {
    var s = ombra(2, 1.2, 8.5, 3.8);
    var MET = [[0, "#f8f9fa"], [.14, "#ffffff"], [.3, "#ced4da"], [.52, "#e9ecef"], [.74, "#868e96"], [1, "#495057"]];
    // il filo: esce di dietro e va verso il muro (da dietro si vede venire verso di te)
    var filo = [P(0, -.05, .3), P(.02, -.11, 0), P(.06, -.13, 0), P(.075, -.17, 0)], fd = "M" + q2(filo[0]) + " C" + q2(filo[1]) + " " + q2(filo[2]) + " " + q2(filo[3]);
    var it = P(.05, -.125, .6), inter = tratto(fd, "#1f2226", 1) + tratto(fd, "#495057", .4, op(.6)) + rett(it[0] - 1.4, it[1] - .8, 2.8, 1.6, .5, "#2b2f33", bordo(L, .4)) + rett(it[0] - .4, it[1] - .6, .8, .5, .2, "#ff6b6b");
    var cavoDietro = G > 0;   // il filo esce di dietro: davanti resta nascosto dal piede
    if (cavoDietro) s += inter;
    // il piede di metallo
    var pz = tornio(0, 0, profilo(0, 9.2, 10, function (t) { return t < .08 ? .064 + .04 * t : .0672 - .025 * Math.pow((t - .08) / .92, .8); }));
    s += pth(pz.d, lin("mt", MET, pz.x0, 0, pz.x1, 0, true), bordo(L, 1.3)) + dentro(pz.d, ell(pz.cx - (pz.x1 - pz.x0) * .3, pz.y1 - 3, .5, 4, "#ffffff", op(.7)));
    s += tondo(0, 0, [[8.9, .044], [9.6, .046], [10.2, .044]], CROMO, .9);   // l'anello cromato
    // il vetro col liquido e la cera
    var vt = tornio(0, 0, profilo(10, 24.4, 12, function (t) { return .045 - .021 * Math.pow(t, 1.1); })), cx = vt.cx, yb = vt.y1, yt = vt.y0, w = (vt.x1 - vt.x0) / 2;
    var liq = NOTTE ? [[0, "#fff3bf"], [.3, "#ffe066"], [.75, "#ffa94d"], [1, "#e8590c"]] : [[0, "#ffe8cc"], [.3, "#ffd8a8"], [.75, "#ffa94d"], [1, "#d9480f"]];
    var cera = NOTTE ? [[0, "#ffd8a8"], [.4, "#ff6b3d"], [1, "#c92a2a"]] : [[0, "#ff8f6b"], [.45, "#e8590c"], [1, "#9c2a0a"]];
    var bolle = "", bl = function (x, y, rx, ry) { return ell(x, y, rx, ry, rad("cb" + (++nC), cera, .35, .3, .75), "stroke='" + (NOTTE ? "#ffc078" : "#8f2a0a") + "' stroke-width='.3'"); };
    bolle += pth("M" + q2(cx - w * .95, yb + 1) + " Q" + q2(cx - w * .7, yb - 2.6) + " " + q2(cx - w * .15, yb - 2.2) + " Q" + q2(cx + w * .15, yb - 6.2) + " " + q2(cx + w * .1, yb - 7.4) + " Q" + q2(cx + w * .55, yb - 6.4) + " " + q2(cx + w * .35, yb - 3.4) + " Q" + q2(cx + w * .6, yb - 2.2) + " " + q2(cx + w * .95, yb + 1) + " Z", lin("cp", cera, cx - w, 0, cx + w, 0, true), "stroke='" + (NOTTE ? "#ffc078" : "#8f2a0a") + "' stroke-width='.3'");   // la cera sul fondo, con la goccia che si alza
    bolle += bl(cx - w * .12, yb - 10.4, w * .38, 1.9) + bl(cx + w * .1, yb - 13.2, w * .2, 1.1) + bl(cx + w * .02, yt + 3.2, w * .26, 1.1);
    s += pth(vt.d, lin("lq", liq, vt.x0, 0, vt.x1, 0, true)) + dentro(vt.d, bolle + (NOTTE ? ell(cx, (yt + yb) / 2, w * .6, (yb - yt) * .4, "#ffffff", op(.25)) : "") +
      rett(vt.x0 + w * .3, yt, w * .22, yb - yt, w * .1, "#ffffff", op(NOTTE ? .35 : .55)) + rett(vt.x1 - w * .32, yt + 2, w * .08, yb - yt - 4, .2, "#ffffff", op(.3))) + pth(vt.d, "none", bordo(L, 1.2));
    // il cappuccio
    var cp = tornio(0, 0, [[24.1, .027], [24.8, .026], [26.6, .018], [28, .009], [28.6, .004]]);
    s += pth(cp.d, lin("ca", MET, cp.x0, 0, cp.x1, 0, true), bordo(L, 1.1));
    if (!cavoDietro) s += inter;
    return s;
  });

  // =========================================================
  //  LAMPADA DA SCRIVANIA: blu laccata, il piede tondo, il braccio snodato con la molla, la manopola dello snodo,
  //  la testa a cono con la lampadina (di notte accesa), il filo che segue il braccio
  // =========================================================
  def("lampada_scrivania", { tipo: "sopra", nome: "Lampada da scrivania", reparto: "luci", fp: [1, 1], k: 1.15, box: [-20, -25, 20, 9], dietro: true, prezzo: 300, luce: [-7, -11, 72, "#fff3c4"] }, function () {
    var BLU = "#1c7ed6", s = ombra(1.5, 1, 9.5, 4.2), al = 15 / 57.296;
    var Fw = [-Math.sin(al), Math.cos(al), 0], Rs = [Math.cos(al), Math.sin(al), 0];   // avanti e di lato (la lampada è girata un po' verso sinistra)
    function L3(sd, fw, z) { return add(add(mul(Rs, sd), mul(Fw, fw)), [0, 0, z]); }
    var B = L3(0, -.05, 0), A0 = L3(0, -.07, .032), A1 = L3(0, -.115, .245), A2 = L3(0, .04, .275), D = nrm(add(mul(Fw, .84), [0, 0, -.55]));
    var parti = [];
    // il piede: un disco laccato con lo smusso e l'interruttore
    (function () {
      var t = tornio(B[0], B[1], [[0, .068], [.5, .07], [1.2, .069], [1.7, .06]]), cp = anello(B[0], B[1], 1.7, .06), o;
      o = pth(t.d, lin("pd", sfumTondo(BLU), t.x0, 0, t.x1, 0, true), bordo(L, 1.2)) + ell(cp.x, cp.y, cp.rx, cp.ry, lin("ps", [[0, "#a5d8ff"], [.5, "#4dabf7"], [1, "#1864ab"]], 0, 0, 1, 1), bordo(L, .9));
      var it = S(L3(.03, -.02, .03));
      o += ell(it[0], it[1], 1.2, .6, "#f1f3f5", bordo(L, .5)) + ell(it[0] - .2, it[1] - .2, .5, .25, "#ffffff");
      var st = S(A0);
      o += rett(st[0] - 1.6, st[1] - .4, 3.2, 2.6, .6, "#1864ab", bordo(L, .6));   // la forcella dello snodo
      parti.push([prof(B) - .01, o]);
    })();
    // il filo: dalla testa lungo il braccio, giù dal piede e via sul piano verso il muro
    var fl = [add(A2, [0, 0, .012]), add(A1, mul(Rs, -.008)), add(A0, mul(Rs, -.01)), L3(-.02, -.11, .004), L3(.04, -.15, 0)].map(S);
    parti.push([prof(L3(0, -.13, .1)) - .02, tratto("M" + q2(fl[0]) + " L" + q2(fl[1]) + " L" + q2(fl[2]) + " Q" + q2(fl[3]) + " " + q2(fl[4]), "#1f2226", .7)]);
    // il braccio di sotto con la molla, lo snodo, il braccio di sopra
    var a0 = S(A0), a1 = S(A1), a2 = S(A2), molla = "", k;
    var m0 = S(add(A0, mul(Rs, .012))), m1 = S(add(mista(A0, A1, .75), mul(Rs, .012)));
    for (k = 0; k <= 14; k++) { var t = k / 14, mx = m0[0] + (m1[0] - m0[0]) * t, my = m0[1] + (m1[1] - m0[1]) * t; molla += (k ? " L" : "M") + q2(mx + (k % 2 ? .7 : -.7), my); }
    parti.push([prof(mista(A0, A1, .5)), tubo(linea(a0, a1), 1.5, BLU, 1.4) + tratto(molla, "#495057", .45)]);
    function manopola(Pc, rr) {   // la manopola tonda dello snodo, sul fianco che si vede
      var n = guarda(Rs) >= 0 ? Rs : mul(Rs, -1), c0 = add(Pc, mul(n, .008)), bb = base(n);
      return "<g" + mat(c0, mul(bb[0], rr), mul(bb[1], rr)) + "><circle r='1' fill='" + "#1864ab" + "' stroke='" + L + "' stroke-width='.9' vector-effect='non-scaling-stroke'/><circle r='.45' fill='#dee2e6' stroke='" + L + "' stroke-width='.5' vector-effect='non-scaling-stroke'/></g>" +
        ell(S(c0)[0] - .5, S(c0)[1] - .6, .5, .35, "#ffffff", op(.6));
    }
    parti.push([prof(A1) + .001, manopola(A1, .016)]);
    parti.push([prof(mista(A1, A2, .5)), tubo(linea(a1, a2), 1.5, BLU, 1.4)]);
    // la testa: un cono blu lucido; se la bocca guarda verso di te si vede il dentro bianco e la lampadina
    (function () {
      var top = add(A2, mul(D, .012)), M = add(A2, mul(D, .1)), bb = base(D), i, giu = [], su = [];
      for (i = 0; i < 40; i++) { var an = i / 40 * 6.2832, dd = add(mul(bb[0], Math.cos(an)), mul(bb[1], Math.sin(an))); giu.push(S(add(M, mul(dd, .062)))); su.push(S(add(top, mul(dd, .024)))); }
      var sil = (function (pp) { var a = pp.slice().sort(function (m, n) { return m[0] - n[0] || m[1] - n[1]; }), lo = [], hi = [], j; function cr(o, m, n) { return (m[0] - o[0]) * (n[1] - o[1]) - (m[1] - o[1]) * (n[0] - o[0]); } for (j = 0; j < a.length; j++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], a[j]) <= 0) lo.pop(); lo.push(a[j]); } for (j = a.length - 1; j >= 0; j--) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], a[j]) <= 0) hi.pop(); hi.push(a[j]); } return lo.slice(0, -1).concat(hi.slice(0, -1)); })(giu.concat(su));
      var bx = limiti(sil), o = pth(chiuso(sil), lin("cn", [[0, "#a5d8ff"], [.3, "#4dabf7"], [.7, BLU], [1, "#0b4f8a"]], bx[0], bx[1], bx[2], bx[3], true), bordo(L, 1.3));
      o += dentro(chiuso(sil), ell(bx[0] + (bx[2] - bx[0]) * .3, bx[1] + (bx[3] - bx[1]) * .35, 1, 3, "#ffffff", op(.55) + rot(bx[0] + (bx[2] - bx[0]) * .3, bx[1] + (bx[3] - bx[1]) * .35, -50)));
      if (guarda(D) > 0) {
        var bocca = chiuso(giu), lp = S(add(M, mul(D, -.035)));
        o += pth(bocca, NOTTE ? "#fff9db" : lin("dn", [[0, "#f8f9fa"], [1, "#adb5bd"]], 0, 0, 1, 1), bordo(L, 1)) +
          dentro(bocca, cer(lp[0], lp[1], 2.4, NOTTE ? rad("lb", [[0, "#ffffff"], [.6, "#fff3bf"], [1, "#ffd43b"]], .5, .5, .5) : rad("lb", [[0, "#ffffff"], [.6, "#f1f3f5"], [1, "#ced4da"]], .35, .3, .7), bordo(L, .5)) + (NOTTE ? ell(lp[0], lp[1], 5, 3, "#ffffff", op(.45)) : cer(lp[0] - .7, lp[1] - .7, .6, "#ffffff")));
      }
      var cap = S(add(A2, mul(D, -.004)));
      o += cer(cap[0], cap[1], 1.6, rad("cp", [[0, "#ffffff"], [.5, "#cfd8dc"], [1, "#7d8991"]], .35, .3, .8), bordo(L, .7));   // lo snodo della testa
      parti.push([prof(M), o]);
    })();
    if (NOTTE) { var pt = S(L3(0, .11, 0)); parti.push([prof(B) - .05, ell(pt[0], pt[1], 9, 4, rad("pl", [[0, "#fff3c4", .6], [1, "#fff3c4", 0]], .5, .5, .5))]); }   // la luce che cade sul piano
    return s + ordina(parti);
  });

  // =========================================================
  //  ORSACCHIOTTO: seduto con le gambe in avanti (i cuscinetti delle zampe verso di te), il muso chiaro, il nasone,
  //  gli occhi a bottone, il papillon rosso, il pancino cucito; il pelo morbido. Da dietro: la nuca, le orecchie e il codino
  // =========================================================
  def("orsacchiotto", { tipo: "sopra", nome: "Orsacchiotto", reparto: "deco", fp: [1, 1], k: 1.2, box: [-12, -22, 16, 10], dietro: true, prezzo: 300 }, function () {
    var PEL = "#c08a55", MUS = "#f1d3b0", s = ombra(1.5, 1.8, 10.5, 4.8), r = rnd(41), cose = [], al = 22 / 57.296;
    var Fw = [Math.sin(al), Math.cos(al), 0], Sd = [Math.cos(al), -Math.sin(al), 0];   // l'orsetto guarda in basso a sinistra, girato un po' verso di te
    function O(x, y, z) { return add(add(mul(Sd, x), mul(Fw, y)), [0, 0, z]); }   // un punto dell'orsetto: x di lato, y in avanti, z in alto
    var fronte = guarda(Fw) > 0;
    function pelo(C, rx, ry, col, n) { var o = "", i; for (i = 0; i < n; i++) { var a = r() * 6.283, t = Math.sqrt(r()) * .9, x = C[0] + Math.cos(a) * t * rx, y = C[1] + Math.sin(a) * t * ry, an = r() * 6.283; o += tratto("M" + q2(x, y) + " l" + f2(Math.cos(an) * .4) + "," + f2(Math.sin(an) * .4), r() < .5 ? chiaro(col, .3) : scuro(col, .2), .26, op(.5)); } return o; }
    function palla(C, rx, ry, col, ex, lw) {   // una palla di pelo: la sfumatura, il pelo, il contorno
      var d = ovale(C[0], C[1], rx, ry);
      return pth(d, rad("pp" + (++nC), [[0, chiaro(col, .36)], [.5, col], [1, scuro(col, .28)]], .36, .3, .72)) + dentro(d, pelo(C, rx, ry, col, Math.round(rx * ry * .9)) + (ex || "")) + pth(d, "none", bordo(L, lw || .85));
    }
    function salsiccia(a0, a1, rr) {   // un braccio o una gamba: un salsicciotto di pelo, corto e cicciotto
      var d = linea(S(a0), S(a1)), w = rr * 70.71 * 2;
      return tratto(d, L, w + 1.5) + tratto(d, scuro(PEL, .18), w) + tratto(d, PEL, w * .74, "transform='translate(-.25 -.25)'") + tratto(d, chiaro(PEL, .32), w * .3, op(.8) + " transform='translate(-.5 -.55)'");
    }
    function cuscinetto(c3, dir, rr) {   // il cuscinetto chiaro in fondo alla zampa, con la cucitura
      if (guarda(dir) <= .05) return "";
      var bb = base(dir);
      return "<g" + mat(c3, mul(bb[0], rr), mul(bb[1], rr)) + "><circle r='1' fill='" + rad("cu", [[0, "#fff4e4"], [1, "#e6c08f"]], .4, .35, .7) + "' stroke='" + L + "' stroke-width='.7' vector-effect='non-scaling-stroke'/><circle r='.68' fill='none' stroke='#c99a6a' stroke-width='.35' stroke-dasharray='.8 .7' vector-effect='non-scaling-stroke'/></g>";
    }
    var Cb = O(0, -.004, .074), Ch = O(0, .012, .19), RH = .064, cb = S(Cb), ch = S(Ch), rh = RH * 70.71;
    // la pancia (col pancino chiaro e la cucitura)
    var pz = "";
    if (fronte) { var pc = S(add(Cb, O(0, .054, -.004))); pz = ell(pc[0], pc[1], 2.9, 3.2, rad("pa", [[0, "#f8dfba"], [1, "#d9a46e"]], .4, .35, .7), "stroke='#b07a48' stroke-width='.3' stroke-dasharray='.7 .55'"); }
    cose.push([prof(Cb), palla(cb, 5.5, 5.2, PEL, pz)]);
    // la testa col muso, il naso, la bocca, gli occhi a bottone, le guance
    var fc = "";
    if (fronte) {
      var mu = S(add(Ch, O(0, .052, -.017))), na = S(add(Ch, O(0, .066, -.006))), oc = [-1, 1].map(function (sg) { return S(add(Ch, O(sg * .025, .051, .016))); });
      fc += ell(mu[0], mu[1], 2.2, 1.75, rad("mu", [[0, "#fff4e2"], [.6, MUS], [1, "#d9b088"]], .4, .35, .7), bordo(L, .6));
      fc += pth("M" + q2(na[0] - .9, na[1] - .4) + " Q" + q2(na[0], na[1] - .85) + " " + q2(na[0] + .9, na[1] - .4) + " Q" + q2(na[0] + .5, na[1] + .5) + " " + q2(na[0], na[1] + .55) + " Q" + q2(na[0] - .5, na[1] + .5) + " " + q2(na[0] - .9, na[1] - .4) + " Z", "#2b1d14") + ell(na[0] - .28, na[1] - .26, .3, .15, "#ffffff", op(.8));
      fc += tratto("M" + q2(na[0], na[1] + .55) + " L" + q2(na[0], na[1] + .95) + " M" + q2(na[0] - .8, na[1] + .85) + " Q" + q2(na[0] - .4, na[1] + 1.35) + " " + q2(na[0], na[1] + .95) + " Q" + q2(na[0] + .4, na[1] + 1.35) + " " + q2(na[0] + .8, na[1] + .85), "#2b1d14", .3);
      oc.forEach(function (o) { fc += cer(o[0], o[1], .62, "#1b120c") + cer(o[0] - .2, o[1] - .22, .2, "#ffffff"); });
      fc += ell(oc[0][0] - .7, oc[0][1] + 1.5, .8, .4, "#e8826b", op(.3)) + ell(oc[1][0] + .9, oc[1][1] + 1.5, .8, .4, "#e8826b", op(.3));   // le guance un po' rosa
    }
    cose.push([prof(Ch), palla(ch, rh, rh * .96, PEL, fc, .9)]);
    // le orecchie (dentro più chiare, se guardano verso di te)
    [-1, 1].forEach(function (sg) {
      var E = add(Ch, O(sg * .047, -.008, .046)), e = S(E), ie = S(add(E, O(0, .01, -.004)));
      cose.push([prof(E), palla(e, 1.7, 1.6, PEL, fronte ? ell(ie[0], ie[1], 1, .9, "#e8bd8c") : "", .8)]);
    });
    // le braccia e le gambe coi cuscinetti
    [-1, 1].forEach(function (sg) {
      var a0 = O(sg * .054, 0, .122), a1 = O(sg * .068, .036, .066), da = nrm(sub(a1, a0));
      cose.push([prof(mista(a0, a1, .6)), salsiccia(a0, a1, .021) + cuscinetto(add(a1, mul(da, .016)), da, .014)]);
      var g0 = O(sg * .038, .02, .03), g1 = O(sg * .047, .07, .029), dg = nrm(sub(g1, g0));
      cose.push([prof(g1), salsiccia(g0, g1, .03) + cuscinetto(add(g1, mul(dg, .025)), dg, .026)]);
    });
    // il codino
    var Tc = O(0, -.066, .034);
    cose.push([prof(Tc), palla(S(Tc), 1.3, 1.2, PEL, "", .7)]);
    // il papillon rosso sotto il mento (da dietro si vede il nastro attorno al collo)
    var Nk = add(Ch, O(0, .04, -.06));
    if (fronte) {
      var m = mat(Nk, mul(Sd, .03), [0, 0, .018]), ROSSO = lin("pn", [[0, "#ff8787"], [.5, "#e03131"], [1, "#a51111"]], 0, 0, 1, 1);
      cose.push([prof(Ch) + .1, "<g" + m + "><path d='M.12,0 L1,.85 Q1.18,0 1,-.85 Z M-.12,0 L-1,.85 Q-1.18,0 -1,-.85 Z' fill='" + ROSSO + "' stroke='" + L + "' stroke-width='.65' stroke-linejoin='round' vector-effect='non-scaling-stroke'/>" +
        "<path d='M.3,.1 L.85,.5 M.3,-.1 L.85,-.45 M-.3,.1 L-.85,.5 M-.3,-.1 L-.85,-.45' stroke='#a51111' stroke-width='.35' vector-effect='non-scaling-stroke'/><ellipse rx='.32' ry='.55' fill='#c92a2a' stroke='" + L + "' stroke-width='.55' vector-effect='non-scaling-stroke'/></g>"]);
    } else {
      var n0 = S(add(Ch, O(-.048, -.012, -.058))), n1 = S(add(Ch, O(.048, -.012, -.058))), nm = S(add(Ch, O(0, -.04, -.068)));
      cose.push([prof(Cb) + .02, tratto("M" + q2(n0) + " Q" + q2(nm) + " " + q2(n1), L, 2.2) + tratto("M" + q2(n0) + " Q" + q2(nm) + " " + q2(n1), "#e03131", 1.2)]);
    }
    return s + ordina(cose);
  });

  // =========================================================
  //  FRULLATORE: la base rossa lucida coi piedini e la manopola cromata, la caraffa di vetro col manico,
  //  dentro il frullato di fragole con la schiuma e una fragola, le tacche delle misure, il coperchio nero
  // =========================================================
  def("frullatore", { tipo: "sopra", nome: "Frullatore", reparto: "cucina", fp: [1, 1], k: 1.15, box: [-13, -30, 19, 10], dietro: true, prezzo: 350 }, function () {
    var RED = "#e03131", s = ombra(2.2, 1.4, 12.5, 5.6), r = rnd(7), i;
    var Fb = forma(0, 0, .08, .08, .08, 4.2), Z1 = 6.6;
    [[-.055, -.055], [.055, -.055], [-.055, .055], [.055, .055]].forEach(function (g) { var pp = P(g[0], g[1], 0); s += ell(pp[0], pp[1] + .2, 1.3, .65, "#212529"); });   // i piedini di gomma
    var lvB = [giro(Fb, .5, .96, 56), giro(Fb, 1.3, 1, 56), giro(Fb, Z1 - .6, .9, 56), giro(Fb, Z1, .86, 56)];
    s += corpo(lvB, [[0, "#ffa8a8"], [.18, "#ff6b6b"], [.55, RED], [1, "#7d1010"]], 1.5) + lucido(sagoma(lvB), .55, .42);
    s += pth(chiuso(giro(Fb, Z1, .86, 56)), lin("bt", [[0, "#ff8787"], [1, "#b02525"]], 0, 0, 1, 1), bordo(L, 1));
    if (guarda([0, 1, 0]) > 0) {   // davanti: la manopola cromata con le tacche delle velocità e la lucina verde
      var bb = base([0, 1, 0]), dc = [0, .079, .05];
      s += "<g" + mat(dc, mul(bb[0], .021), mul(bb[1], .021)) + "><circle r='1.22' fill='#a51d1d' stroke='" + L + "' stroke-width='.5' vector-effect='non-scaling-stroke'/>" +
        [0, 1, 2, 3, 4].map(function (k) { var a = (-60 + k * 30) / 57.3; return "<circle cx='" + f3(Math.sin(a) * 1.05) + "' cy='" + f3(Math.cos(a) * 1.05) + "' r='.09' fill='#ffffff'/>"; }).join("") +
        "<circle r='.8' fill='" + rad("dm", [[0, "#ffffff"], [.55, "#d5dce1"], [1, "#6c7780"]], .35, .3, .8) + "' stroke='" + L + "' stroke-width='.6' vector-effect='non-scaling-stroke'/><path d='M0,0 L-.35,.62' stroke='#212529' stroke-width='.7' stroke-linecap='round' vector-effect='non-scaling-stroke'/></g>";
      var lv = S([.04, .078, .085]);
      s += cer(lv[0], lv[1], .45, "#8ce99a", bordo(L, .3)) + cer(lv[0] - .12, lv[1] - .12, .15, "#ffffff");
    } else {   // dietro: le prese d'aria
      var bd = base([0, -1, 0]), dr = [0, -.079, .045];
      s += "<g" + mat(dr, mul(bd[0], .045), mul(bd[1], .025)) + ">" + [0, 1, 2, 3].map(function (k) { return "<rect x='-.75' y='" + f3(-.7 + k * .42) + "' width='1.5' height='.18' rx='.09' fill='#7d1010'/>"; }).join("") + "</g>";
    }
    // il collare nero e la caraffa
    var Fc = forma(0, 0, .061, .061, .061, 3.6), ZJ0 = 7.8, ZJ1 = 20.2, Fj = forma(0, 0, .055, .055, .055, 3.4), kT = 1.25;
    s += corpo([giro(Fc, Z1 - .3, 1, 48), giro(Fc, ZJ0, 1, 48)], [[0, "#868e96"], [.25, "#495057"], [.7, "#212529"], [1, "#0b0c0d"]], 1.2) + pth(chiuso(giro(Fc, ZJ0, 1, 48)), "#343a40", bordo(L, .7));
    var man = [[.069, 0, .31], [.122, 0, .305], [.122, 0, .188], [.064, 0, .174]].map(S), dM = "M" + q2(man[0]) + " C" + q2(man[1]) + " " + q2(man[2]) + " " + q2(man[3]);
    var manico = tratto(dM, L, 3.4) + tratto(dM, "#343a40", 2.1) + tratto(dM, "#868e96", .6, op(.9) + " transform='translate(-.35 -.35)'"), manDietro = guarda([1, 0, 0]) < 0;
    if (manDietro) s += manico;
    var lvJ = [giro(Fj, ZJ0, 1, 56), giro(Fj, ZJ1, kT, 56)], silJ = sagoma(lvJ), bj = limiti(silJ), dJ = chiuso(silJ);
    s += pth(dJ, lin("vj", [[0, "#ffffff"], [.5, "#e7f5ff"], [1, "#a5d8ff"]], bj[0], 0, bj[2], 0, true), op(.5));   // il vetro di dietro
    var ZS = 14.4, kS = (1 + (kT - 1) * (ZS - ZJ0) / (ZJ1 - ZJ0)) * .95, lvS = [giro(Fj, ZJ0 + .4, .94, 56), giro(Fj, ZS, kS, 56)], sup = giro(Fj, ZS, kS, 56);
    var fr = corpo(lvS, [[0, "#ffc9c9"], [.3, "#ff8787"], [.75, "#f03e3e"], [1, "#a51d2d"]], .4);   // il frullato di fragole
    var bo = "";
    var cc = limiti(sup);
    for (i = 0; i < 14; i++) { var xx = cc[0] + (cc[2] - cc[0]) * (.15 + r() * .7), yy = cc[1] + (cc[3] - cc[1]) * (.2 + r() * .6); bo += cer(xx, yy, .2 + r() * .35, "#ffffff", op(.55)); }   // le bollicine della schiuma
    fr += pth(chiuso(sup), rad("sf", [[0, "#fff0f3"], [.7, "#ffc9d2"], [1, "#ff98a8"]], .45, .45, .65), "stroke='#e8597a' stroke-width='.35'") + dentro(chiuso(sup), bo);
    var fp = S([-.012, .018, ZS / 61 + .004]);   // la fragola che galleggia
    fr += pth("M" + q2(fp[0] - 1.5, fp[1] + .5) + " Q" + q2(fp[0] - 1.6, fp[1] - 1.6) + " " + q2(fp[0], fp[1] - 1.8) + " Q" + q2(fp[0] + 1.6, fp[1] - 1.6) + " " + q2(fp[0] + 1.5, fp[1] + .5) + " Z", rad("fg", [[0, "#ff8787"], [.6, "#e03131"], [1, "#a51111"]], .4, .3, .8), bordo(L, .5));
    [[-.7, -.6], [0, -1.1], [.7, -.6], [-.3, 0], [.4, -.1]].forEach(function (d) { fr += ell(fp[0] + d[0], fp[1] + d[1], .1, .16, "#ffe066"); });
    fr += pth("M" + q2(fp[0], fp[1] - 1.7) + " l-1,-.2 l.7,-.3 l-.2,-.6 l.5,.4 l.5,-.4 l-.2,.6 l.7,.3 Z", "#40c057", bordo("#2b8a3e", .3));
    s += fr;
    var mk = "";   // le tacche delle misure, sul davanti
    if (guarda([0, 1, 0]) > 0) for (i = 0; i < 4; i++) { var zt = ZJ0 + 2.4 + i * 2.6, kk = 1 + (kT - 1) * (zt - ZJ0) / (ZJ1 - ZJ0), m0 = P(-.04 * kk, .055 * kk, zt), m1 = P((i % 2 ? -.022 : -.028) * kk, .055 * kk, zt); mk += tratto(linea(m0, m1), "#ffffff", .32, op(.9)); }
    s += dentro(dJ, mk + rett(bj[0] + (bj[2] - bj[0]) * .16, bj[1], (bj[2] - bj[0]) * .1, bj[3] - bj[1], 0, "#ffffff", op(.5)) + rett(bj[0] + (bj[2] - bj[0]) * .32, bj[1], (bj[2] - bj[0]) * .04, bj[3] - bj[1], 0, "#ffffff", op(.35)) +
      rett(bj[0] + (bj[2] - bj[0]) * .8, bj[1], (bj[2] - bj[0]) * .05, bj[3] - bj[1], 0, "#ffffff", op(.25)));
    s += pth(dJ, "none", bordo(L, 1.3)) + pth(chiuso(giro(Fj, ZJ1, kT, 56)), "none", "stroke='#ffffff' stroke-width='.5' opacity='.6'");
    // il coperchio nero col tappino trasparente
    var Fl = forma(0, 0, .055 * kT + .004, .055 * kT + .004, .055 * kT + .004, 3.4), NERO = [[0, "#6c757d"], [.25, "#343a40"], [.7, "#16181b"], [1, "#050506"]];
    s += corpo([giro(Fl, ZJ1 - .2, 1, 56), giro(Fl, ZJ1 + 1.3, .98, 56)], NERO, 1.3) + pth(chiuso(giro(Fl, ZJ1 + 1.3, .98, 56)), lin("cn", [[0, "#5c636a"], [1, "#16181b"]], 0, 0, 1, 1), bordo(L, .9));
    var tp = tornio(0, 0, [[ZJ1 + 1.2, .022], [ZJ1 + 2.2, .021], [ZJ1 + 2.6, .017]]);
    s += pth(tp.d, lin("tp", [[0, "#f1f3f5"], [.5, "#adb5bd"], [1, "#6c757d"]], tp.x0, 0, tp.x1, 0, true), bordo(L, .8));
    if (!manDietro) s += manico;
    return s;
  });

  // =========================================================
  //  TOSTAPANE: cromato lucido coi riflessi, i piedini neri, le due fessure con le fette dorate che saltano fuori,
  //  la leva nera e la manopola della doratura sul fianco, lo stemma rosso davanti
  // =========================================================
  def("tostapane", { tipo: "sopra", nome: "Tostapane", reparto: "cucina", fp: [1, 1], k: 1.15, box: [-17, -20, 23, 12], dietro: true, prezzo: 250 }, function () {
    var s = ombra(2.5, 1.6, 16, 7.2), F = forma(0, 0, .135, .08, .08, 7), ZT = 9.8, r = rnd(17), i;
    var CR = [[0, "#f1f3f5"], [.08, "#ffffff"], [.2, "#b7c0c7"], [.36, "#eef1f3"], [.55, "#8a959e"], [.72, "#d5dbe0"], [.88, "#9aa5ae"], [1, "#5c666e"]];
    [[-.105, -.055], [.105, -.055], [-.105, .055], [.105, .055]].forEach(function (g) { var pp = P(g[0], g[1], 0); s += ell(pp[0], pp[1] + .2, 1.4, .7, "#16181b"); });   // i piedini
    var latoV = guarda([1, 0, 0]) > 0, kn0 = S([.137, 0, .118]), kn1 = S([.167, 0, .118]);
    var leva = tratto(linea(kn0, kn1), L, 3.6) + tratto(linea(kn0, kn1), "#212529", 2.3) + tratto(linea(kn0, kn1), "#868e96", .6, "transform='translate(-.25 -.55)'");
    if (!latoV) s += leva;   // da dietro la leva spunta appena, dietro il tostapane
    var lv = [giro(F, .6, .96, 72), giro(F, 1.5, 1, 72), giro(F, ZT - 1.3, 1, 72), giro(F, ZT, .955, 72)], sil = sagoma(lv), bx = limiti(sil);
    s += corpo(lv, CR, 1.6) + dentro(chiuso(sil), rett(bx[0], bx[1] + (bx[3] - bx[1]) * .66, bx[2] - bx[0], (bx[3] - bx[1]) * .14, 0, "#7a6a5a", op(.18)) + tratto(aperto(giro(F, ZT - 1.6, 1, 72).slice(0, 37)), "#ffffff", .6, op(.75)));
    var top = giro(F, ZT, .955, 72);
    s += pth(chiuso(top), lin("tt", [[0, "#ffffff"], [.45, "#e9ecef"], [1, "#aab3ba"]], 0, 0, 1, 1), bordo(L, 1));
    // le fessure e le fette di pane tostato
    var B0 = [-.03, .03].sort(function (m, n) { return vicino(0, m) - vicino(0, n); });
    B0.forEach(function (b0) { var fs = giro(forma(0, b0, .1, .012, .012, 8), ZT, 1, 40); s += pth(chiuso(fs), lin("fs", [[0, "#3a3f44"], [1, "#0d0f11"]], 0, 0, 0, 1), "stroke='#59636b' stroke-width='.5'"); });
    var PANE = "M-1,0 L-1,.6 C-1.02,.93 -.78,1.05 -.44,.97 C-.22,1.09 .22,1.09 .44,.97 C.78,1.05 1.02,.93 1,.6 L1,0 Z";
    B0.forEach(function (b0, j) {
      var vn = G > 0 ? .0065 : -.0065, zb = ZT / 61 - .002, U = [.056, 0, 0], W = [0, 0, j ? .05 : .058], o = "", k;
      o += "<path d='" + PANE + "'" + mat([0, b0 - vn, zb], U, W) + " fill='#8f4f22' stroke='" + L + "' stroke-width='.9' stroke-linejoin='round' vector-effect='non-scaling-stroke'/>";   // la faccia di dietro (fa lo spessore)
      var pori = ""; for (k = 0; k < 9; k++) pori += "<ellipse cx='" + f3(-.6 + r() * 1.2) + "' cy='" + f3(.15 + r() * .6) + "' rx='.06' ry='.04' fill='#b86a2e' opacity='.6'/>";
      o += "<g" + mat([0, b0 + vn, zb], U, W) + "><path d='" + PANE + "' fill='#b8662a'/><g transform='translate(0 .05) scale(.84 .84)'><path d='" + PANE + "' fill='" + rad("mi", [[0, "#fbe3b0"], [.6, "#f0b867"], [1, "#d98c45"]], .5, .45, .65) + "'/>" + pori + "</g>" +
        "<path d='" + PANE + "' fill='none' stroke='" + L + "' stroke-width='.9' stroke-linejoin='round' vector-effect='non-scaling-stroke'/></g>";
      var e0 = P(-.1, b0 + (G > 0 ? .012 : -.012), ZT), e1 = P(.1, b0 + (G > 0 ? .012 : -.012), ZT);
      s += o + tratto(linea(e0, e1), "#dfe5e9", .55);   // il bordo cromato davanti alla fessura
    });
    if (latoV) {   // sul fianco: la scanalatura della leva, la leva nera, la manopola della doratura
      s += tratto(linea(S([.137, 0, .03]), S([.137, 0, .142])), "#1a1d20", .9) + leva;
      var bl = base([1, 0, 0]);
      s += "<g" + mat([.138, 0, .052], mul(bl[0], .019), mul(bl[1], .019)) + "><circle r='1' fill='#212529' stroke='" + L + "' stroke-width='.8' vector-effect='non-scaling-stroke'/><circle r='.68' fill='" + rad("mn", [[0, "#ffffff"], [.55, "#d5dce1"], [1, "#6c7780"]], .35, .3, .8) + "'/><path d='M0,0 L0,.62' stroke='#212529' stroke-width='.6' vector-effect='non-scaling-stroke'/></g>";
    }
    if (guarda([0, 1, 0]) > 0) {   // lo stemma rosso smaltato davanti
      s += "<g" + mat([0, .081, .082], [.026, 0, 0], [0, 0, .012]) + "><ellipse rx='1' ry='1' fill='" + lin("st", [[0, "#ff8787"], [1, "#a51111"]], 0, 0, 1, 1) + "' stroke='#f1f3f5' stroke-width='.7' vector-effect='non-scaling-stroke'/><path d='M-.6,.1 Q-.2,.45 .1,0 T.6,-.1' fill='none' stroke='#ffffff' stroke-width='.5' vector-effect='non-scaling-stroke'/></g>";
    } else {   // dietro: il filo che esce e va verso di te
      var f0 = S([-.08, -.08, .012]), f1 = S([-.1, -.13, 0]), f2b = S([-.06, -.17, 0]);
      s += tratto("M" + q2(f0) + " Q" + q2(f1) + " " + q2(f2b), "#1f2226", 1);
    }
    return s;
  });

  // =========================================================
  //  CARTA IGIENICA (scadente): un rotolo di carta riciclata grigina, un po' schiacciato, col lembo strappato male
  //  che penzola e un pezzetto caduto per terra
  // =========================================================
  def("carta_igienica", { tipo: "sopra", nome: "Carta igienica", stanza: "bagno", reparto: "bagno", qual: 0, fp: [1, 1], k: 1.3, box: [-10, -13, 14, 8], dietro: true, prezzo: 0 }, function () {
    var s = ombra(1.6, 1.2, 7.8, 3.5), HZ = 6.3, F = forma(0, 0, .056, .043, .052, 2), r = rnd(5), i, cose = [];
    var CARTA = [[0, "#f6f3ea"], [.35, "#e6e1d3"], [.75, "#c7bfa9"], [1, "#9d947e"]];   // la carta riciclata, un po' grigina
    // il pezzetto strappato caduto per terra
    var c3 = [.072, .078, 0], an = .5, U = [.022 * Math.cos(an), .022 * Math.sin(an), 0], W = [-.022 * Math.sin(an), .022 * Math.cos(an), 0];
    cose.push([vicino(.072, .078), "<g" + mat(c3, U, W) + "><path d='M-1,-1 L1,-1 L1,.55 L.72,.74 L.46,.58 L.2,.86 L-.08,.64 L-.38,.9 L-.68,.7 L-1,.82 Z' fill='#ebe6d9' stroke='" + L + "' stroke-width='.7' stroke-linejoin='round' vector-effect='non-scaling-stroke'/>" +
      "<path d='M-1,-.1 L1,-.1' fill='none' stroke='#aaa18b' stroke-width='.5' stroke-dasharray='.5 .6' vector-effect='non-scaling-stroke'/></g>"]);
    // il lembo: si stacca dal rotolo e penzola, col bordo strappato a zig-zag
    var th = 1.9, na = [Math.cos(th), Math.sin(th), 0], A = [Math.cos(th) * F.ra, Math.sin(th) * F.rf, 0], tg = nrm([-Math.sin(th) * F.ra, Math.cos(th) * F.rf, 0]);
    var A0 = add(A, [0, 0, .004]), A1 = add(A, [0, 0, HZ / 61 - .004]), E0 = add(add(A0, mul(tg, .042)), mul(na, .02)), E1 = add(add(A1, mul(tg, .034)), mul(na, .008)), zz = [], k;
    for (k = 0; k <= 7; k++) { var t = k / 7, e = mista(E1, E0, t); zz.push(S(add(e, mul(tg, (k % 2 ? -.005 : .002) - r() * .003)))); }
    var dl = "M" + q2(S(A1)) + " Q" + q2(S(add(mista(A1, E1, .5), mul(na, .006)))) + " " + q2(zz[0]) + " L" + zz.slice(1).map(function (x) { return q2(x); }).join(" L") + " Q" + q2(S(add(mista(A0, E0, .5), mul(na, .012)))) + " " + q2(S(A0)) + " Z";
    var lembo = pth(dl, lin("lb", [[0, "#fbf9f2"], [1, "#d8d1bf"]], 0, 0, 1, 1), bordo(L, .8)) + tratto(linea(S(add(A1, mul(tg, .006))), S(add(A0, mul(tg, .007)))), "#b8af99", .35, op(.8));
    cose.push([guarda(na) > 0 ? 1 : -1, lembo]);
    // il rotolo: la carta goffrata con le righe dello strappo, la piega dove è schiacciato
    var lv = [giro(F, 0, 1, 56), giro(F, HZ, 1, 56)], sil = sagoma(lv), bx = limiti(sil), det = "";
    for (i = 0; i < 10; i++) {
      var a = i / 10 * 6.2832 + .3, n = [Math.cos(a), Math.sin(a), 0];
      if (guarda(n) < .08) continue;
      var pa = P(Math.cos(a) * F.ra, Math.sin(a) * (Math.sin(a) > 0 ? F.rf : F.rr), .5), pb = P(Math.cos(a) * F.ra, Math.sin(a) * (Math.sin(a) > 0 ? F.rf : F.rr), HZ - .5);
      det += tratto(linea(pa, pb), "#a59c86", .3, "stroke-dasharray='.45 .45' opacity='.7'");
    }
    for (i = 0; i < 46; i++) det += cer(bx[0] + r() * (bx[2] - bx[0]), bx[1] + r() * (bx[3] - bx[1]), .16, i % 2 ? "#ffffff" : "#b9b09a", op(.45));
    if (guarda([0, 1, 0]) > 0) det += tratto("M" + q2(P(-.02, .043, 1)) + " Q" + q2(P(.0, .046, 3)) + " " + q2(P(.012, .043, 5.4)), "#aaa18b", .4, op(.9));   // la piega
    cose.push([0, pth(chiuso(sil), lin("cr", CARTA, bx[0], 0, bx[2], 0, true)) + dentro(chiuso(sil), det) + pth(chiuso(sil), "none", bordo(L, 1.2)) +
      pth(chiuso(giro(F, HZ, 1, 56)), lin("ct", [[0, "#fbfaf5"], [1, "#ddd6c4"]], 0, 0, 1, 1), bordo(L, .9)) +
      pth(chiuso(giro(F, HZ, .78, 48)), "none", "stroke='#cfc7b2' stroke-width='.3'") + pth(chiuso(giro(F, HZ, .6, 48)), "none", "stroke='#cfc7b2' stroke-width='.3'")]);
    var Ft = forma(.002, .002, .022, .019, .021, 2);   // il tubo di cartone
    cose[cose.length - 1][1] += pth(chiuso(giro(Ft, HZ, 1, 40)), "#c49a6c", bordo(L, .7)) + pth(chiuso(giro(Ft, HZ, .78, 40)), rad("bu", [[0, "#2e2015"], [1, "#6e5136"]], .55, .3, .75), "stroke='#8a6a48' stroke-width='.3'");
    return s + ordina(cose);
  });

  // =========================================================
  //  BICCHIERE CON LO SPAZZOLINO (scadente): il bicchiere di plastica azzurrina un po' storto, crepato e sbeccato,
  //  col calcare sul fondo; lo spazzolino con le setole tutte aperte e il tubetto del dentifricio spremuto e senza tappo
  // =========================================================
  def("bicchiere_spazzolino", { tipo: "sopra", nome: "Bicchiere con lo spazzolino", stanza: "bagno", reparto: "bagno", qual: 0, fp: [1, 1], k: 1.3, box: [-7, -18, 10, 6], dietro: true, prezzo: 0 }, function () {
    var s = ombra(1.2, .9, 5.6, 2.6), ZC = 5.8, F = forma(0, 0, .036, .03, .034, 2), r = rnd(9), cose = [], i;
    var lv = [giro(F, 0, .8, 48), giro(F, ZC, 1, 48)], sil = sagoma(lv), bx = limiti(sil), bocca = giro(F, ZC, 1, 48);
    s += pth(chiuso(sil), lin("pd", [[0, "#d9eef5"], [1, "#8fb7c6"]], bx[0], 0, bx[2], 0, true), op(.95)) + pth(chiuso(bocca), "#a9cbd7", "stroke='#7fa6b4' stroke-width='.3'");   // la plastica di dietro e il dentro
    // lo spazzolino: il manico azzurro con la gomma bianca, la testina con le setole spettinate
    var B0 = [.008, -.004, .012], B1 = [.028, -.012, .168], dB = nrm(sub(B1, B0)), B2 = add(B1, mul(dB, .028)), nb = nrm([-.85, .5, 0]);
    var sp = tubo(linea(S(B0), S(B1)), 1, "#4dabf7", 1.1) + tratto(linea(S(mista(B0, B1, .62)), S(mista(B0, B1, .78))), "#ffffff", .55) + tubo(linea(S(B1), S(B2)), 1.2, "#339af0", 1.1);
    for (i = 0; i < 9; i++) {   // le setole: tutte aperte a ventaglio, come una scopa
      var t = .12 + i / 8 * .8, pb = add(mista(B1, B2, t), mul(nb, .003)), dir = nrm(add(add(nb, mul(dB, (i - 4) * .22 + (r() - .5) * .3)), [0, 0, (r() - .5) * .5])), tip = add(pb, mul(dir, .011 + r() * .005));
      sp += tratto(linea(S(pb), S(tip)), "#8a96a0", .85) + tratto(linea(S(pb), S(tip)), i % 3 ? "#f8f9fa" : "#a5d8ff", .45);
    }
    cose.push([prof(B1), sp]);
    // il tubetto: spremuto, accartocciato, senza tappo, con un baffo di dentifricio secco
    var T0 = [-.012, .006, .01], T1 = [-.034, .012, .142], dT = nrm(sub(T1, T0)), p0 = S(T0), p1 = S(T1), pv = [-(p1[1] - p0[1]), p1[0] - p0[0]], lp = Math.sqrt(pv[0] * pv[0] + pv[1] * pv[1]);
    pv = [pv[0] / lp, pv[1] / lp];
    var lati = [], n2 = 6;
    for (i = 0; i <= n2; i++) { var tt = i / n2, c0 = [p0[0] + (p1[0] - p0[0]) * tt, p0[1] + (p1[1] - p0[1]) * tt], w = (1.35 - .3 * tt) + (i % 2 ? .25 : -.1) * (1 - tt); lati.push([c0[0] + pv[0] * w, c0[1] + pv[1] * w], [c0[0] - pv[0] * w * .9, c0[1] - pv[1] * w * .9]); }
    var sx = lati.filter(function (x, k) { return k % 2 === 0; }), dx = lati.filter(function (x, k) { return k % 2 === 1; }).reverse(), dTb = chiuso(sx.concat(dx));
    var tb = pth(dTb, lin("tb", [[0, "#ffffff"], [.6, "#e9ecef"], [1, "#adb5bd"]], 0, 0, 1, 0), bordo(L, .8)) +
      dentro(dTb, tratto(linea([p1[0] + pv[0] * 2 + (p0[0] - p1[0]) * .2, p1[1] + pv[1] * 2 + (p0[1] - p1[1]) * .2], [p1[0] - pv[0] * 2 + (p0[0] - p1[0]) * .2, p1[1] - pv[1] * 2 + (p0[1] - p1[1]) * .2]), "#e03131", 1.1) +
        tratto(linea([p0[0] + (p1[0] - p0[0]) * .55 + pv[0] * 1.6, p0[1] + (p1[1] - p0[1]) * .55 + pv[1] * 1.6], [p0[0] + (p1[0] - p0[0]) * .5 - pv[0] * 1.4, p0[1] + (p1[1] - p0[1]) * .5 - pv[1] * 1.4]), "#adb5bd", .3) +
        tratto(linea([p0[0] + (p1[0] - p0[0]) * .72 + pv[0] * 1.6, p0[1] + (p1[1] - p0[1]) * .72 + pv[1] * 1.6], [p0[0] + (p1[0] - p0[0]) * .78 - pv[0] * 1.4, p0[1] + (p1[1] - p0[1]) * .78 - pv[1] * 1.4]), "#adb5bd", .3));
    var T2 = add(T1, mul(dT, .011)), p2 = S(T2), p3 = S(add(T2, mul(dT, .006)));
    tb += tubo(linea(p1, p2), .9, "#f1f3f5", 1) + pth("M" + q2(p2) + " q-.6,-.9 .3,-1.2 q.8,-.2 .6,.6", "#c3fae8", bordo("#63e6be", .35));   // il beccuccio e il dentifricio secco
    cose.push([prof(T1), tb]);
    s += ordina(cose);
    // la plastica davanti, trasparente (solo sotto il bordo): il calcare, la crepa, la sbeccatura, i graffi
    var dav = chiuso(sil) + " " + chiuso(bocca), det = "";
    var e1 = anello(0, 0, 1.2, .031), e0 = anello(0, 0, .25, .029);   // il calcare bianco sul fondo
    det += pth("M" + q2(e1.x - e1.rx, e1.y) + " A" + f2(e1.rx) + "," + f2(e1.ry) + " 0 0,0 " + q2(e1.x + e1.rx, e1.y) + " L" + q2(e0.x + e0.rx, e0.y) + " A" + f2(e0.rx) + "," + f2(e0.ry) + " 0 0,1 " + q2(e0.x - e0.rx, e0.y) + " Z", "#ffffff", op(.35));
    var cr = P(Math.cos(2.2) * F.ra, Math.sin(2.2) * F.rf, ZC);
    if (guarda([Math.cos(2.2), Math.sin(2.2), 0]) > 0) det += tratto("M" + q2(cr) + " l.3,1 l-.4,.7 l.35,.9", "#4f7380", .32);   // la crepa
    for (i = 0; i < 3; i++) { var g0 = bx[0] + (bx[2] - bx[0]) * (.35 + i * .18), g1 = bx[1] + (bx[3] - bx[1]) * (.45 + i * .1); det += tratto("M" + q2(g0, g1) + " l1,.6", "#ffffff", .2, op(.55)); }
    s += "<path d='" + dav + "' fill='#cfe6ee' fill-rule='evenodd' opacity='.45'/>" + dentro(chiuso(sil), det + rett(bx[0] + (bx[2] - bx[0]) * .2, bx[1] + 2, (bx[2] - bx[0]) * .12, bx[3] - bx[1] - 3, .4, "#ffffff", op(.45)));
    var sb = P(Math.cos(.45) * F.ra, Math.sin(.45) * F.rf, ZC);   // la sbeccatura sul bordo
    s += pth(arcoDav(anello(0, 0, ZC, .0345)), "none", "stroke='#ffffff' stroke-width='.45' opacity='.8'") + pth(chiuso(sil), "none", bordo(L, 1.1)) + pth(chiuso(bocca), "none", "stroke='" + L + "' stroke-width='.6'");
    if (guarda([Math.cos(.45), Math.sin(.45), 0]) > 0) s += poly([[sb[0] - .9, sb[1] - .2], [sb[0] + .7, sb[1] - .1], [sb[0] - .1, sb[1] + .9]], "#a9cbd7", bordo(L, .45));
    return s;
  });

  // =========================================================
  //  BONSAI: il vasetto rettangolare smaltato blu coi piedini, il muschio e i sassolini, il tronco a "S"
  //  con le radici che affiorano, i rami e le chiome a nuvoletta (più chiare sopra, dove batte la luce)
  // =========================================================
  function nuvola(c3, ra, rb, h, seme, cols) {   // una chioma a nuvoletta di foglie minute: la base scura, il sopra chiaro, le foglioline
    var C = S(c3), rx = ra * 70.71, ry = Math.sqrt(Math.pow(rb * 35.36, 2) + Math.pow(h * 30.5, 2)), rr = rnd(seme), cir = [], j, k;
    for (j = 0; j < 12; j++) { var a = j / 12 * 6.2832 + rr() * .25, k2 = .8 + rr() * .18; cir.push([C[0] + Math.cos(a) * rx * .76 * k2, C[1] + Math.sin(a) * ry * .62 * k2 - (Math.sin(a) < 0 ? h * 8 : 0), Math.min(rx, ry * 1.6) * (.36 + rr() * .14)]); }
    cir.push([C[0], C[1] - h * 6, Math.min(rx, ry) * .82]);
    var uni = cir.map(function (c) { return cerchio(c, c[2]); }).join(" "), o = "";
    o += cir.map(function (c) { return cer(c[0], c[1], c[2], cols[0], "stroke='" + L + "' stroke-width='1.6'"); }).join("") + pth(uni, cols[0]);
    var fo = "";
    cir.forEach(function (c) { fo += cer(c[0] - c[2] * .25, c[1] - c[2] * .38, c[2] * .78, cols[1]); });
    cir.forEach(function (c, i) { if (i % 2 === 0 || i === cir.length - 1) fo += cer(c[0] - c[2] * .45, c[1] - c[2] * .6, c[2] * .42, cols[2], op(.9)); });
    for (k = 0; k < Math.round(rx * ry * 1.6); k++) { var px = C[0] + (rr() - .5) * rx * 2, py = C[1] + (rr() - .5) * ry * 2.2, up = (py - C[1]) / ry; fo += ell(px, py, .42, .24, up < 0 ? cols[3] : cols[4], op(.75) + rot(px, py, rr() * 180)); }   // le foglioline
    return o + dentro(uni, fo);
  }
  def("bonsai", { tipo: "sopra", nome: "Bonsai", reparto: "piante", fp: [1, 1], k: 1.2, box: [-18, -24, 24, 12], dietro: true, prezzo: 600 }, function () {
    var s = ombra(2.5, 1.8, 16, 7), r = rnd(53), i, BLU = "#1c7ed6";
    var Fv = forma(0, 0, .145, .092, .092, 9), ZF = .7, ZV = 5, ZB = 5.6;
    [[-.115, -.066], [.115, -.066], [-.115, .066], [.115, .066]].sort(function (m, n) { return vicino(m[0], m[1]) - vicino(n[0], n[1]); }).forEach(function (g) { s += tondo(g[0], g[1], [[0, .017], [ZF + .2, .02]], [[0, "#4dabf7"], [1, "#0b3d6e"]], .7); });   // i piedini
    var lv = [giro(Fv, ZF, .93, 64), giro(Fv, ZV, 1, 64)];
    s += corpo(lv, [[0, "#8ccfff"], [.22, "#339af0"], [.62, BLU], [1, "#0b4f8a"]], 1.4) + lucido(sagoma(lv), .6, .5);
    var lvR = [giro(Fv, ZV - .1, 1.05, 64), giro(Fv, ZB, 1.05, 64)];   // il labbro che sporge
    s += corpo(lvR, [[0, "#b8e0ff"], [.3, "#4dabf7"], [.7, "#1864ab"], [1, "#0b3d6e"]], 1.1) + pth(chiuso(giro(Fv, ZB, 1.05, 64)), lin("lb", [[0, "#a5d8ff"], [1, "#1864ab"]], 0, 0, 1, 1), bordo(L, .9));
    var te = giro(Fv, ZB - .15, .93, 64), mu = "";
    for (i = 0; i < 110; i++) { var pa = (r() - .5) * .27, pb = (r() - .5) * .17; if (Math.pow(Math.abs(pa / .135), 9) + Math.pow(Math.abs(pb / .086), 9) > 1) continue; var pp = P(pa, pb, ZB); mu += cer(pp[0], pp[1], .5 + r() * .5, ["#4f7a17", "#5f8f1c", "#77a82a", "#45701a", "#6a9a24"][i % 5]); }   // il muschio
    [[.08, .04], [.1, -.02], [-.09, .05]].forEach(function (g, j) { var pp = P(g[0], g[1], ZB); mu += ell(pp[0], pp[1] - .2, 1 - j * .15, .6, ["#ced4da", "#adb5bd", "#dee2e6"][j], bordo(L, .35)) + ell(pp[0] - .3, pp[1] - .4, .35, .18, "#ffffff", op(.7)); });   // i sassolini
    s += pth(chiuso(te), "#4a3424", "stroke='" + L + "' stroke-width='.5'") + dentro(chiuso(te), mu);
    // le radici che affiorano dal muschio
    var T0 = [-.022, .006, ZB / 61], rad0 = "";
    [[-1, .3], [.55, .85], [.95, -.35], [-.35, -.95]].forEach(function (d) { var nn = nrm([d[0], d[1], 0]), pts3 = [add(T0, mul(nn, .01)), add(add(T0, mul(nn, .035)), [0, 0, -.002]), add(add(T0, mul(nn, .06)), [0, 0, -.003])]; var rr2 = rametto(pts3, function (t) { return .007 * (1 - t) + .0015; }); rad0 += pth(rr2.d, "#6b4423", bordo(L, .6)); });
    s += rad0;
    // il tronco a "S" che si assottiglia, coi rami
    var TR = liscia([T0, [.024, .002, .118], [-.018, -.006, .168], [.012, -.004, .214], [-.002, -.004, .25]], 6);
    var wt = function (t) { return .019 * Math.pow(1 - t, .9) + .004 + .012 * Math.max(0, 1 - t * 7) * Math.max(0, 1 - t * 7); };
    var tr = rametto(TR, wt), btr = limiti(tr.sp);
    var tronco = pth(tr.d, lin("tr", [[0, "#b08a5e"], [.35, "#8a5d36"], [.7, "#5c3a21"], [1, "#3b2412"]], btr[0] - 2, 0, btr[2] + 2, 0, true), bordo(L, 1)) +
      dentro(tr.d, tratto(aperto(tr.sp.map(function (q0) { return [q0[0] + .5, q0[1]]; })), "#3b2412", .35, op(.6)) + tratto(aperto(tr.sp.map(function (q0) { return [q0[0] - .6, q0[1] - .2]; })), "#d0a77a", .35, op(.7)));
    // le chiome: [centro, mezza larghezza, mezza profondità, altezza, da dove parte il ramo (t sul tronco)]
    var CH = [[[-.112, .03, .15], .056, .041, .022, .3], [[.104, .006, .19], .051, .037, .021, .52], [[-.036, -.074, .214], .046, .036, .02, .7], [[.002, -.004, .258], .052, .043, .027, 1]];
    var COLB = ["#2b6e30", "#40a04a", "#74c87c", "#1f5d27", "#b5e8a8"], dietroT = "", davantiT = "";
    CH.forEach(function (c, j) {
      var at = TR[Math.round(c[4] * (TR.length - 1))], ramo = "";
      if (c[4] < 1) { var mid = add(mista(at, c[0], .55), [0, 0, .012]), rr3 = rametto(liscia([at, mid, add(c[0], [0, 0, -.008])], 5), function (t) { return .0055 * (1 - t) + .002; }); ramo = pth(rr3.d, "#6b4423", bordo(L, .7)); }
      var x = ramo + nuvola(c[0], c[1], c[2], c[3], 70 + j * 7, COLB);
      if (prof(c[0]) < prof(at) - .004 || j === 2) dietroT += x; else davantiT += x;
    });
    return s + dietroT + tronco + davantiT;
  });

  // =========================================================
  //  VASO DI GIRASOLI: il vaso blu smaltato, tre girasoli coi petali gialli in due giri e il disco scuro
  //  coi semi a spirale (come quelli veri), i gambi grossi e le foglie a cuore. Da dietro: il verde dei sepali
  // =========================================================
  function fogliaPiatta(b3, d, sd, len, wid, col, nv) {   // una foglia piatta nello spazio: base, direzione, lato; le nervature
    var n = nrm(crs(d, sd)), lu = lux(guarda(n) >= 0 ? n : mul(n, -1)), c1 = tinta(col, .25 * lu + .05), c2 = tinta(col, .25 * lu - .2), giu = guarda(n) < 0;
    var g = lin("fp" + (++nC), [[0, giu ? chiaro(c1, .15) : c1], [.5, giu ? chiaro(c1, .08) : c1], [.5, c2], [1, scuro(c2, .1)]], 0, 0, 0, 1);
    var sag = "M0,0 C.12,.36 .5,.5 .78,.24 C.9,.12 .96,.05 1,0 C.96,-.05 .9,-.12 .78,-.24 C.5,-.5 .12,-.36 0,0 Z", ve = "M0,0 L.96,0";
    for (var k = 1; k <= (nv || 3); k++) { var x = k / ((nv || 3) + 1) * .8; ve += " M" + f3(x) + ",0 Q" + f3(x + .12) + "," + f3(.12) + " " + f3(x + .2) + "," + f3(.3 * (1 - x)) + " M" + f3(x) + ",0 Q" + f3(x + .12) + "," + f3(-.12) + " " + f3(x + .2) + "," + f3(-.3 * (1 - x)); }
    return "<g" + mat(b3, mul(d, len), mul(sd, wid)) + "><path d='" + sag + "' fill='" + g + "' stroke='" + L + "' stroke-width='.75' stroke-linejoin='round' vector-effect='non-scaling-stroke'/><path d='" + ve + "' fill='none' stroke='" + chiaro(col, .45) + "' stroke-width='.4' opacity='.75' vector-effect='non-scaling-stroke'/></g>";
  }
  def("girasoli", { tipo: "sopra", nome: "Vaso di girasoli", reparto: "piante", fp: [1, 1], k: 1.2, box: [-13, -41, 17, 9], dietro: true, prezzo: 300 }, function () {
    var s = ombra(2, 1.4, 10.5, 4.6), i, cose = [], ZV = 10.4;
    var VA = [[0, "#bfe3ff"], [.25, "#4dabf7"], [.66, "#1c7ed6"], [1, "#0b4f8a"]];
    var vs = tornio(0, 0, profilo(0, ZV, 10, function (t) { return .046 + .02 * Math.pow(t, 1.25); }));
    s += pth(vs.d, lin("va", VA, vs.x0, 0, vs.x1, 0, true), bordo(L, 1.3)) + dentro(vs.d, tratto(arcoDav(anello(0, 0, ZV * .62, .059)), "#ffffff", .7, op(.85)) + tratto(arcoDav(anello(0, 0, ZV * .62 - .9, .058)), "#ffffff", .35, op(.6))) + riflesso(vs, .6);
    s += tondo(0, 0, [[ZV - .5, .066], [ZV + .5, .069]], [[0, "#d0ebff"], [.3, "#74c0fc"], [.7, "#1971c2"], [1, "#0b4f8a"]], 1);
    var bo = anello(0, 0, ZV + .5, .069), bi = anello(0, 0, ZV + .3, .058);
    s += ell(bo.x, bo.y, bo.rx, bo.ry, lin("bo", [[0, "#d0ebff"], [1, "#1971c2"]], 0, 0, 1, 1), bordo(L, .9)) + ell(bi.x, bi.y, bi.rx, bi.ry, "#123d63");
    var Z0 = ZV / 61;
    function girasole(c3, n, R, seme) {   // la testa del girasole: davanti i petali e il disco coi semi; dietro i sepali verdi
      var bb = base(n), o = "", k, rr = rnd(seme);
      if (guarda(n) > 0) {
        for (k = 0; k < 15; k++) o += "<ellipse cx='0' cy='.7' rx='.15' ry='.32' transform='rotate(" + f1((k + .5) / 15 * 360 + rr() * 6) + ")' fill='#f59f00' stroke='#b26b00' stroke-width='.35' vector-effect='non-scaling-stroke'/>";
        for (k = 0; k < 15; k++) o += "<ellipse cx='0' cy='.68' rx='.15' ry='.31' transform='rotate(" + f1(k / 15 * 360 + rr() * 6) + ")' fill='" + lin("pt", [[0, "#ffe066"], [1, "#fcc419"]], 0, 1, 0, 0) + "' stroke='#c77d00' stroke-width='.4' vector-effect='non-scaling-stroke'/>";
        o += "<circle r='.47' fill='" + rad("ds", [[0, "#3b2412"], [.55, "#5c3a21"], [.85, "#7a4a2a"], [1, "#9c6b30"]], .5, .5, .5) + "' stroke='#2b1a0e' stroke-width='.55' vector-effect='non-scaling-stroke'/>";
        for (k = 1; k < 70; k++) { var rk = .42 * Math.sqrt(k / 70), tk = k * 2.39996; o += "<circle cx='" + f3(rk * Math.cos(tk)) + "' cy='" + f3(rk * Math.sin(tk)) + "' r='.028' fill='" + (k % 2 ? "#2b1a0e" : "#a0703a") + "'/>"; }   // i semi a spirale
        o += "<ellipse cx='-.15' cy='.18' rx='.18' ry='.1' fill='#ffffff' opacity='.18'/>";
      } else {
        for (k = 0; k < 15; k++) o += "<ellipse cx='0' cy='.66' rx='.14' ry='.3' transform='rotate(" + f1(k / 15 * 360 + 12) + ")' fill='#e8a10c' stroke='#b26b00' stroke-width='.35' vector-effect='non-scaling-stroke'/>";
        o += "<circle r='.5' fill='" + rad("rv", [[0, "#94d82d"], [1, "#5c940d"]], .5, .5, .6) + "' stroke='" + L + "' stroke-width='.6' vector-effect='non-scaling-stroke'/>";
        for (k = 0; k < 12; k++) o += "<path d='M-.08,.3 L0,.62 L.08,.3 Z' transform='rotate(" + f1(k / 12 * 360) + ")' fill='#66a80f' stroke='#2b6e1a' stroke-width='.3' vector-effect='non-scaling-stroke'/>";
        o += "<circle r='.14' fill='#5c940d' stroke='#2b6e1a' stroke-width='.3' vector-effect='non-scaling-stroke'/>";
      }
      return "<g" + mat(c3, mul(bb[0], R), mul(bb[1], R)) + ">" + o + "</g>";
    }
    // i tre girasoli: [testa, dove guarda, da dove esce il gambo]
    var GS = [[[-.07, .03, .355], nrm([-.25, .85, .5]), [-.012, .006, Z0]], [[.012, -.03, .43], nrm([.15, .75, .62]), [.004, -.01, Z0]], [[.072, .028, .325], nrm([.6, .55, .35]), [.014, .008, Z0]]];
    GS.forEach(function (g, j) {
      var hd = g[0], n = g[1], st = g[2], dietroT = add(hd, mul(n, -.012)), mid = add(mista(st, dietroT, .5), [0, 0, .02]);
      var gp = liscia([st, mid, dietroT], 6).map(S), dG = aperto(gp);
      var stelo = tratto(dG, L, 2.6) + tratto(dG, "#5c940d", 1.3) + tratto(dG, "#a9e34b", .4, op(.8) + " transform='translate(-.3 -.2)'");
      cose.push([prof(hd), stelo + girasole(hd, n, .066, 90 + j * 11)]);
    });
    // le foglie a cuore sui gambi
    [[[-.02, .012, .2], nrm([-.75, .5, -.25]), .09], [[.025, .018, .225], nrm([.65, .55, -.2]), .085], [[.004, -.03, .25], nrm([.25, -.9, .15]), .08]].forEach(function (f) {
      var sd = nrm(crs([0, 0, 1], f[1])); cose.push([prof(add(f[0], mul(f[1], .04))), fogliaPiatta(f[0], f[1], sd, f[2], f[2] * .78, "#51a334", 3)]);
    });
    s += ordina(cose);
    s += tratto(arcoDav(bo), L, 2.2) + tratto(arcoDav(bo), "#4dabf7", 1) + tratto(arcoDav(bo), "#d0ebff", .35, "transform='translate(0 -.3)'");   // il bordo davanti del vaso, sopra i gambi
    return s;
  });

  // =========================================================
  //  ORCHIDEA (falenopsis): il vaso bianco col filo lilla, la corteccia, le foglie larghe e lucide, le radici aeree argentate,
  //  il bastoncino di bambù con la mollettina e lo stelo ad arco coi fiori rosa-lilla (la "farfalla" col labello fucsia) e i boccioli
  // =========================================================
  def("orchidea", { tipo: "sopra", nome: "Orchidea", reparto: "piante", fp: [1, 1], k: 1.25, box: [-15, -33, 15, 8], dietro: true, prezzo: 500 }, function () {
    var s = ombra(2, 1.3, 8.5, 3.8), r = rnd(71), i, cose = [], ZV = 6.7, Z0 = ZV / 61;
    var vs = tornio(0, 0, profilo(0, ZV, 8, function (t) { return .044 + .015 * Math.pow(t, .9); }));
    s += pth(vs.d, lin("vo", [[0, "#ffffff"], [.4, "#f6f3fa"], [.8, "#d3cae0"], [1, "#a99cbb"]], vs.x0, 0, vs.x1, 0, true), bordo(L, 1.2)) + dentro(vs.d, tratto(arcoDav(anello(0, 0, ZV * .58, .055)), "#b197fc", .8, op(.9))) + riflesso(vs, .85);
    var bo = anello(0, 0, ZV, .0595), te = anello(0, 0, ZV - .35, .052), co = "";
    s += ell(bo.x, bo.y, bo.rx, bo.ry, lin("bo", [[0, "#ffffff"], [1, "#d8d0e4"]], 0, 0, 1, 1), bordo(L, .9)) + ell(te.x, te.y, te.rx, te.ry, "#5c3d24", "stroke='" + L + "' stroke-width='.35'");
    for (i = 0; i < 18; i++) { var pa = (r() - .5) * .09, pb = (r() - .5) * .09, pp = P(pa, pb, ZV - .2); co += rett(pp[0] - .7, pp[1] - .35, 1.4, .7, .25, ["#8a5a33", "#a0703a", "#6b4423", "#b5844a"][i % 4], "stroke='#3d2b22' stroke-width='.15'" + rot(pp[0], pp[1], r() * 180)); }   // i pezzetti di corteccia
    s += dentro(ovale(te.x, te.y, te.rx, te.ry), co);
    // le foglie larghe, lucide, che ricadono sul bordo
    function fogliaO(b3, d, sd, len, wid) {
      var n = nrm(crs(d, sd)), su = guarda(n) >= 0, lu = lux(su ? n : mul(n, -1)), c1 = tinta("#2f9e44", .22 * lu + .08), c2 = tinta("#2f9e44", .2 * lu - .22);
      var g = lin("fo" + (++nC), [[0, su ? c1 : "#7fb88a"], [.5, su ? chiaro(c1, .06) : "#74ad80"], [.5, c2], [1, scuro(c2, .1)]], 0, 0, 0, 1);
      return "<g" + mat(b3, mul(d, len), mul(sd, wid)) + "><path d='M0,-.36 C.32,-.56 .86,-.48 1,-.04 C1.02,.02 1.02,.06 .98,.1 C.86,.5 .32,.56 0,.36 Z' fill='" + g + "' stroke='" + L + "' stroke-width='.8' stroke-linejoin='round' vector-effect='non-scaling-stroke'/>" +
        "<path d='M.03,0 L.92,.03' stroke='" + scuro(c2, .2) + "' stroke-width='.45' fill='none' vector-effect='non-scaling-stroke'/><path d='M.2,-.22 Q.5,-.34 .78,-.22' stroke='#ffffff' stroke-width='.7' fill='none' opacity='" + (su ? .5 : .15) + "' vector-effect='non-scaling-stroke'/></g>";
    }
    [[[-.006, .004, Z0 + .014], nrm([-.76, .6, -.3]), .14, .078, .5], [[.006, -.004, Z0 + .014], nrm([.8, -.55, -.32]), .135, .075, .5], [[.002, .006, Z0 + .018], nrm([.3, .92, -.42]), .1, .064, .2]].forEach(function (f) {
      var F = [G * .7071, G * .7071, 0], n0 = nrm(sub([0, 0, 1], mul(f[1], f[1][2]))), np = sub(F, mul(f[1], dot(F, f[1])));   // la foglia pende sul bordo e gira un po' la faccia verso chi guarda (davanti e anche da dietro)
      n0 = nrm(mista(n0, nrm(np), f[4]));
      var sd = crs(n0, f[1]);
      cose.push([prof(add(f[0], mul(f[1], f[2] * .5))) - .03, fogliaO(f[0], f[1], sd, f[2], f[3])]);
    });
    // le radici aeree argentate che scavalcano il bordo
    [[[.014, -.004, Z0 + .01], [.05, -.022, Z0 + .014], [.062, -.03, Z0 - .016]], [[-.016, .01, Z0 + .008], [-.05, .028, Z0 + .01], [-.06, .032, Z0 - .014]]].forEach(function (rd) {
      var pp = liscia(rd, 5).map(S), d = aperto(pp), e = pp[pp.length - 1];
      cose.push([prof(rd[1]), tratto(d, L, 1.4) + tratto(d, "#c5d6c0", .7) + tratto(d, "#eef5ea", .25, op(.8) + " transform='translate(-.2 -.2)'") + ell(e[0], e[1] + .1, .3, .4, "#8ce99a", bordo(L, .25))]);
    });
    // il bastoncino di bambù con la mollettina
    var b0 = [-.012, -.012, Z0], b1 = [-.012, -.012, .335], bs = tratto(linea(S(b0), S(b1)), L, 1.6) + tratto(linea(S(b0), S(b1)), "#d9b77a", .75);
    for (i = 1; i < 5; i++) { var nd = S([-.012, -.012, Z0 + i * .055]); bs += tratto("M" + q2(nd[0] - .45, nd[1]) + " l.9,0", "#8a6a3a", .35); }
    var cl = S([-.012, -.012, .3]);
    bs += rett(cl[0] - .9, cl[1] - .5, 1.8, 1, .3, "#f1f3f5", bordo(L, .4));
    cose.push([prof(b0) - .02, bs]);
    // lo stelo ad arco coi fiori
    var ST = liscia([[-.006, -.008, Z0 + .01], [-.009, -.01, .2], [-.009, -.011, .3], [.012, -.016, .36], [.052, -.024, .384], [.092, -.034, .37], [.122, -.044, .335]], 6), sp = ST.map(S);
    cose.push([prof([-.01, -.01, .2]), tratto(aperto(sp), L, 1.5) + tratto(aperto(sp), "#6b8f3a", .7)]);
    function fiore(c3, n, R, ang) {   // la "farfalla": tre sepali, due petali tondi, il labello fucsia con la macchia gialla
      var bb = base(n), o = "<g transform='rotate(" + f1(ang) + ")'>", st = " stroke='#a74bb5' stroke-width='.4' vector-effect='non-scaling-stroke'";
      if (guarda(n) > 0) {
        var PE = lin("pe", [[0, "#fff0fb"], [.5, "#f6d3f7"], [1, "#e7a6ef"]], 0, 0, 1, 1);
        o += "<ellipse cx='0' cy='.56' rx='.27' ry='.46' fill='" + PE + "'" + st + "/><ellipse cx='.36' cy='-.46' rx='.24' ry='.42' transform='rotate(-30 .36 -.46)' fill='" + PE + "'" + st + "/><ellipse cx='-.36' cy='-.46' rx='.24' ry='.42' transform='rotate(30 -.36 -.46)' fill='" + PE + "'" + st + "/>";
        o += "<ellipse cx='.48' cy='.1' rx='.47' ry='.43' fill='" + PE + "'" + st + "/><ellipse cx='-.48' cy='.1' rx='.47' ry='.43' fill='" + PE + "'" + st + "/>";
        o += "<path d='M.22,.12 Q.48,.22 .74,.12 M-.22,.12 Q-.48,.22 -.74,.12 M0,.25 L0,.75' fill='none' stroke='#e599f7' stroke-width='.35' vector-effect='non-scaling-stroke'/>";
        o += "<path d='M-.24,-.06 Q-.34,-.46 0,-.64 Q.34,-.46 .24,-.06 Q0,.06 -.24,-.06 Z' fill='#be4bdb' stroke='#862e9c' stroke-width='.45' vector-effect='non-scaling-stroke'/><ellipse cx='0' cy='-.16' rx='.12' ry='.08' fill='#ffd43b'/><ellipse cx='0' cy='.1' rx='.08' ry='.12' fill='#ffffff' stroke='#c2a5cf' stroke-width='.25' vector-effect='non-scaling-stroke'/>";
      } else {
        var PR = "#f1d8f2";
        o += "<ellipse cx='.48' cy='.1' rx='.47' ry='.43' fill='" + PR + "'" + st + "/><ellipse cx='-.48' cy='.1' rx='.47' ry='.43' fill='" + PR + "'" + st + "/><ellipse cx='0' cy='.56' rx='.27' ry='.46' fill='" + PR + "'" + st + "/>";
        o += "<ellipse cx='.36' cy='-.46' rx='.24' ry='.42' transform='rotate(-30 .36 -.46)' fill='" + PR + "'" + st + "/><ellipse cx='-.36' cy='-.46' rx='.24' ry='.42' transform='rotate(30 -.36 -.46)' fill='" + PR + "'" + st + "/><circle r='.12' fill='#74a83a'/>";
      }
      return "<g" + mat(c3, mul(bb[0], R), mul(bb[1], R)) + ">" + o + "</g></g>";
    }
    var NF = 5;
    for (i = 0; i < NF; i++) {   // i fiori pendono dall'arco, uno dopo l'altro, guardando verso di te
      var t = .48 + i * .1, idx = Math.min(ST.length - 1, Math.round(t * (ST.length - 1))), pt = add(ST[idx], [.004, .02, -.03]), n = nrm(add([.42, .72, .42], [(r() - .5) * .25, (r() - .5) * .15, -i * .04]));
      cose.push([prof(pt) + .01 + i * .001, tratto(linea(S(ST[idx]), S(add(pt, mul(n, -.004)))), "#6b8f3a", .45) + fiore(pt, n, .041 - i * .0018, (r() - .5) * 24)]);
    }
    var fine = ST[ST.length - 1];   // i boccioli in punta
    [[.004, -.012], [.014, -.026]].forEach(function (b, j) { var pb = S(add(fine, [b[0], .002, b[1]])); cose.push([prof(fine) + .02, tratto(linea(S(fine), pb), "#6b8f3a", .35) + ell(pb[0], pb[1] + .5, .75 - j * .15, .95 - j * .2, rad("bc" + j, [[0, "#fbeefc"], [.6, "#e9c6ee"], [1, "#9cbf6a"]], .4, .3, .8), "stroke='#7a5a86' stroke-width='.3'")]); });
    s += ordina(cose);
    s += pth(arcoDav(bo), "none", "stroke='" + L + "' stroke-width='1'") ;
    return s;
  });

  // ---------- le piante grandi: le foglie piccole sono una sagoma sola, ripetuta (girata e colorata una per una) ----------
  function simbolo(id, d, x) { DEFS.push("<path id='" + p + id + "' d='" + d + "' vector-effect='non-scaling-stroke' stroke-linejoin='round'" + attr(x) + "/>"); }
  function usa(id, m, x) { return "<use xlink:href='#" + p + id + "'" + m + attr(x) + "/>"; }
  function coloreFoglia(n, chiara, scura, rovescio, extra) {   // il verde di una foglia secondo dove guarda: alla luce più chiaro, sul rovescio più pallido
    var vis = guarda(n) >= 0, lu = lux(vis ? n : mul(n, -1)), t = Math.max(0, Math.min(1, .5 + .38 * lu + (extra || 0)));
    return vis ? mix(scura, chiara, t) : mix(scuro(rovescio, .2), rovescio, t);
  }
  function quadri(pp, w, col, chiaroC) {   // un ramoscello a pezzetti (per la treccia del ficus): ogni pezzo è un quadrilatero coi bordi scuri, senza tappi
    var a = S(pp[0]), b = S(pp[1]), vx = b[0] - a[0], vy = b[1] - a[1], l = Math.sqrt(vx * vx + vy * vy) || 1, nx = -vy / l * w / 2, ny = vx / l * w / 2, ex = vx / l * .25, ey = vy / l * .25;
    var A1 = [a[0] + nx - ex, a[1] + ny - ey], A2 = [a[0] - nx - ex, a[1] - ny - ey], B1 = [b[0] + nx + ex, b[1] + ny + ey], B2 = [b[0] - nx + ex, b[1] - ny + ey];
    return poly([A1, B1, B2, A2], col) + tratto(linea(A1, B1), L, .7) + tratto(linea(A2, B2), L, .7) + tratto(linea([(A1[0] * 2 + A2[0]) / 3, (A1[1] * 2 + A2[1]) / 3], [(B1[0] * 2 + B2[0]) / 3, (B1[1] * 2 + B2[1]) / 3]), chiaroC, w * .22, op(.75));
  }

  // =========================================================
  //  FICUS (Ficus benjamina): il vaso bianco lucido col bordo arrotondato e i sassolini bianchi sulla terra,
  //  il tronco a treccia (tre fusti intrecciati, come quelli del vivaio), la chioma fitta di foglioline lucide
  //  a punta che ricadono un po' (più chiare sopra a sinistra, scure dentro), i rametti che si vedono tra le foglie
  // =========================================================
  def("ficus", { tipo: "piedi", nome: "Ficus", reparto: "piante", fp: [1, 1], box: [-29, -97, 37, 19], dietro: true, prezzo: 900 }, function () {
    var s = ombra(5, 4, 30, 13), r = rnd(101), i, j, cose = [];
    var vs = tornio(0, 0, profilo(0, 22.4, 10, function (t) { return .148 + .042 * Math.pow(t, .9); }));
    s += pth(vs.d, lin("vf", [[0, "#ffffff"], [.38, "#f3f5f7"], [.78, "#cfd6db"], [1, "#a3aeb7"]], vs.x0, 0, vs.x1, 0, true), bordo(L, 2)) +
      dentro(vs.d, tratto(arcoDav(anello(0, 0, 4, .156)), "#b9c3ca", .8) + tratto(arcoDav(anello(0, 0, 4.6, .157)), "#ffffff", .6, op(.9))) + riflesso(vs, .85, 2.2);
    s += tondo(0, 0, [[21.8, .19], [22.6, .199], [23.8, .2], [24.4, .194]], [[0, "#ffffff"], [.4, "#f1f3f5"], [.8, "#c3ccd2"], [1, "#94a0a9"]], 1.7);
    var bo = anello(0, 0, 24.4, .194), te = anello(0, 0, 23.9, .174), ss = "";
    s += ell(bo.x, bo.y, bo.rx, bo.ry, lin("bo", [[0, "#ffffff"], [1, "#d5dce1"]], 0, 0, 1, 1), bordo(L, 1.3)) + ell(te.x, te.y, te.rx, te.ry, rad("te", [[0, "#6b4a2e"], [1, "#3a2414"]], .5, .5, .6), bordo(L, .6));
    for (i = 0; i < 40; i++) { var ga = r() * 6.283, gr = Math.sqrt(r()) * .165, gp = P(Math.cos(ga) * gr, Math.sin(ga) * gr, 24); ss += ell(gp[0], gp[1], .8 + r() * .5, .5 + r() * .25, ["#f8f9fa", "#e9ecef", "#dee2e6"][i % 3], "stroke='#8a8f94' stroke-width='.25'"); }   // i sassolini bianchi
    s += dentro(ovale(te.x, te.y, te.rx, te.ry), ss);
    // il tronco a treccia: tre fusti che girano uno attorno all'altro, a pezzetti ordinati da dietro a davanti
    var TOP = [.014, .008, .82];
    for (j = 0; j < 3; j++) {
      var pt = function (t) { var th = t * 6.2832 * 2.2 + j * 2.0944, rb = .011 * (1 + 1.4 * t * t); return [TOP[0] * t + Math.cos(th) * rb, TOP[1] * t + Math.sin(th) * rb, .39 + (TOP[2] - .39) * t]; };
      for (i = 0; i < 28; i++) { var a = pt(i / 28), b = pt((i + 1) / 28); cose.push([prof(mista(a, b, .5)), quadri([a, b], 1.45 - .3 * i / 28, ["#9a7b5c", "#8a6b4e", "#a5876a"][j], "#d2bea6")]); }
    }
    // la chioma: tante nuvolette di foglie (centro, raggio); le foglie stanno sulla pelle di ogni nuvoletta
    simbolo("fg", "M0,0 C.1,.55 .5,.62 .72,.36 C.84,.22 .93,.08 1,0 C.93,-.08 .84,-.22 .72,-.36 C.5,-.62 .1,-.55 0,0 Z");
    var CL = [[0, 0, 1.13, .2], [-.18, .05, 1.02, .15], [.17, -.04, 1.05, .15], [.03, .16, .98, .14], [-.05, -.16, 1.08, .15], [.05, .02, 1.32, .14], [-.15, -.06, 1.25, .12], [.15, .08, 1.24, .12], [.21, .11, .9, .09], [-.21, .13, .88, .09]], CC = [0, 0, 1.12];
    CL.forEach(function (c, k) {
      var cen = [c[0], c[1], c[2]], R = c[3], nf = Math.round(64 * Math.pow(R / .15, 2) + 8), C2 = S(cen);
      cose.push([prof(cen), cer(C2[0], C2[1], R * 70.71 * .78, rad("ms", [[0, "#3f8a3a"], [.7, "#245a28"], [1, "#1b4721"]], .38, .32, .7))]);   // il fitto dentro la chioma
      var at = mista(TOP, cen, .15), rm = liscia([at, add(mista(at, cen, .5), [0, 0, .04]), add(cen, [0, 0, -R * .4])], 4).map(S);
      cose.push([prof(cen) + .0005, tratto(aperto(rm), L, 1.7) + tratto(aperto(rm), "#8a6b4e", .9)]);   // il rametto che porta la nuvoletta
      for (j = 0; j < nf; j++) {
        var u = r() * 2 - 1, th = r() * 6.2832, dir = [Math.sqrt(1 - u * u) * Math.cos(th), Math.sqrt(1 - u * u) * Math.sin(th), u];
        if (k && dot(dir, nrm(sub(cen, CC))) < -.45) continue;   // dentro la chioma non si vedono
        var pb = add(cen, mul(dir, R * (.72 + r() * .3))), D = nrm(add(add(mul(dir, .75), [0, 0, -.55]), [(r() - .5) * .7, (r() - .5) * .7, (r() - .5) * .3]));
        var N0 = nrm(add(dir, [0, 0, .8])), N = nrm(sub(N0, mul(D, dot(N0, D)))), Sd = crs(N, D), len = .064 + r() * .026;
        var col = coloreFoglia(N, "#9ee07f", "#1f5a26", "#a6cc95", .34 * dot(nrm(mondo(dir)), LU) + .06 + (r() - .5) * .16);
        cose.push([prof(add(pb, mul(D, len * .5))), usa("fg", mat(pb, mul(D, len), mul(Sd, len * .44)), "fill='" + col + "' stroke='" + scuro(col, .5) + "' stroke-width='.45'")]);
      }
    });
    return s + ordina(cose);
  });

  // =========================================================
  //  PALMA DA SALOTTO (una palma nana, come la Phoenix): il vaso di terracotta all'italiana col bordo arrotolato
  //  e la ghirlanda in rilievo, il tronco rugoso a scaglie, la corona di fronde ad arco con le foglioline
  //  appaiate che ricadono (le giovani dritte in alto, le vecchie più basse)
  // =========================================================
  def("palma", { tipo: "piedi", nome: "Palma da salotto", reparto: "piante", fp: [1, 1], box: [-46, -104, 46, 20], dietro: true, prezzo: 1300 }, function () {
    var s = ombra(5, 4, 32, 14), r = rnd(131), i, j, cose = [];
    var TC = [[0, "#ffb08a"], [.3, "#e8692e"], [.72, "#b8461a"], [1, "#7d2e0e"]];
    var vs = tornio(0, 0, profilo(0, 21, 10, function (t) { return .158 + .05 * Math.pow(t, 1.1); })), gh = "";
    for (i = 0; i <= 8; i++) {   // la ghirlanda in rilievo: festoni appesi tra le rosette (solo davanti)
      var ps = -1.35 + i * .3375, zr = 15.6, rr = .158 + .05 * Math.pow(zr / 21, 1.1), c0 = P(0, 0, zr);
      var x0 = c0[0] + Math.sin(ps) * rr * 70.71, y0 = c0[1] + Math.cos(ps) * rr * 35.36, ps2 = ps + .3375, x1 = c0[0] + Math.sin(ps2) * rr * 70.71, y1 = c0[1] + Math.cos(ps2) * rr * 35.36;
      if (i < 8) { var fd = "M" + q2(x0, y0) + " Q" + q2((x0 + x1) / 2, (y0 + y1) / 2 + 3.2) + " " + q2(x1, y1); gh += tratto(fd, "#8f3410", 1.3, op(.75)) + tratto(fd, "#ffb58a", .45, op(.8) + " transform='translate(0 -.55)'"); }
      gh += cer(x0, y0, .95, "#c8501f", "stroke='#7d2e0e' stroke-width='.35'") + cer(x0 - .25, y0 - .3, .35, "#ffc29e");
    }
    s += pth(vs.d, lin("vt", TC, vs.x0, 0, vs.x1, 0, true), bordo(L, 2)) + dentro(vs.d, gh + tratto(arcoDav(anello(0, 0, 18.6, .2)), "#8f3410", .7, op(.7))) + riflesso(vs, .3, 2);
    s += tondo(0, 0, [[20.4, .212], [21.2, .224], [23.8, .224], [24.6, .215]], [[0, "#ffc29e"], [.3, "#ee7a42"], [.72, "#c2410c"], [1, "#7d2e0e"]], 1.8);   // il bordo arrotolato
    var bo = anello(0, 0, 24.6, .215), te = anello(0, 0, 24, .19);
    s += ell(bo.x, bo.y, bo.rx, bo.ry, lin("bo", [[0, "#ffc29e"], [1, "#c8501f"]], 0, 0, 1, 1), bordo(L, 1.3)) + ell(te.x, te.y, te.rx, te.ry, rad("te", [[0, "#6b4a2e"], [1, "#3a2414"]], .5, .5, .6), bordo(L, .6));
    // il tronco: rugoso, a scaglie (dove c'erano le fronde vecchie)
    var T = liscia([[0, 0, .39], [.012, .006, .76], [.028, .012, 1.2]], 8), tr = rnd(7);
    var tro = rametto(T, function (t) { return .054 - .012 * t; }), bt = limiti(tro.sp), sc = "";
    for (i = 1; i < T.length - 1; i++) {
      var c1 = S(T[i]), w = (.054 - .012 * i / (T.length - 1)) * 70.71;
      sc += pth("M" + q2(c1[0] - w, c1[1]) + " Q" + q2(c1[0], c1[1] + 1.6) + " " + q2(c1[0] + w, c1[1]), "none", "stroke='#4a2c14' stroke-width='.7' opacity='.8'") + pth("M" + q2(c1[0] - w, c1[1] - .8) + " Q" + q2(c1[0], c1[1] + .8) + " " + q2(c1[0] + w, c1[1] - .8), "none", "stroke='#d6a571' stroke-width='.45' opacity='.6'");
      for (j = 0; j < 4; j++) { var xx = c1[0] - w + (j + .5 + (i % 2) * .5) * w / 2; sc += tratto("M" + q2(xx, c1[1] + .2) + " l" + (j % 2 ? .9 : -.9) + ",-2.1", "#5c3a1e", .4, op(.6)); }
    }
    cose.push([prof(T[8]), pth(tro.d, lin("tr", [[0, "#d39a5f"], [.35, "#a8692f"], [.75, "#7a4a22"], [1, "#4a2c14"]], bt[0] - 3, 0, bt[2] + 3, 0, true), bordo(L, 1.4)) + dentro(tro.d, sc)]);
    // le fronde: [direzione, quanto si alzano, lunghezza]; le foglioline appaiate lungo la costa, più lunghe vicino al tronco
    simbolo("fp", "M0,0 C.25,.55 .7,.45 1,0 C.7,-.45 .25,-.55 0,0 Z");
    var C = T[T.length - 1], FR = [[-150, 64, .5], [-55, 62, .52], [35, 66, .5], [125, 60, .52], [-110, 46, .64], [-15, 42, .66], [75, 44, .64], [170, 46, .62], [-65, 18, .62], [25, 14, .64], [115, 16, .6], [-160, 16, .6], [-20, 52, .56], [160, 54, .56]];
    FR.forEach(function (f) {
      var ph = f[0] / 57.296 + (tr() - .5) * .2, al = f[1] / 57.296, Lf = f[2], h = [Math.cos(ph), Math.sin(ph), 0], g = .6 + (1 - al / 1.3) * 1.1, n = 13, pts = [];
      for (j = 0; j <= n; j++) { var sv = j / n * Lf; pts.push(add(C, add(mul(h, sv * Math.cos(al)), [0, 0, sv * Math.sin(al) - g * sv * sv]))); }
      for (j = 1; j <= n; j++) {
        var a = pts[j - 1], b = pts[j], T1 = nrm(sub(b, a)), side = nrm(crs(T1, [0, 0, 1])), t = j / n;
        cose.push([prof(mista(a, b, .5)), tratto(linea(S(a), S(b)), "#3d5a1e", 1.5 - t * .7) + tratto(linea(S(a), S(b)), "#a3b84a", .6 - t * .3)]);   // la costa
        if (t < .12) continue;
        [-1, 1].forEach(function (sg) {
          var dl = nrm(add(add(mul(T1, .55), mul(side, sg * .82)), [0, 0, -.36])), ll = .19 * (1 - .55 * t) + .03, ww = .025 * (1 - .3 * t);
          var N0 = nrm(crs(dl, T1)); if (N0[2] < 0) N0 = mul(N0, -1);
          var col = coloreFoglia(N0, "#a3e36e", "#24722e", "#8fc268", (tr() - .5) * .14 + .04);
          cose.push([prof(add(b, mul(dl, ll * .5))), usa("fp", mat(b, mul(dl, ll), mul(crs(N0, dl), ww)), "fill='" + col + "' stroke='" + scuro(col, .46) + "' stroke-width='.4'")]);
        });
      }
    });
    // la corona: le basi fibrose delle fronde, sopra il tronco
    var cc = S(C), cr0 = "";
    for (i = 0; i < 7; i++) { var an = i / 7 * 6.2832, xb = cc[0] + Math.cos(an) * 2.6, yb = cc[1] + Math.sin(an) * 1.2; cr0 += ell(xb, yb, 2.2, 1.6, ["#8a5a2b", "#6b4423", "#9c6b30"][i % 3], bordo(L, .6)) + tratto("M" + q2(xb - 1.2, yb) + " l.6,1.4 M" + q2(xb, yb - .4) + " l.2,1.6 M" + q2(xb + 1, yb) + " l-.4,1.4", "#4a2c14", .3, op(.8)); }
    cose.push([prof(C) - .02, cr0]);
    return s + ordina(cose);
  });

  // =========================================================
  //  MONSTERA: il vaso di gres color crema puntinato, i gambi lunghi, le foglie grandi a cuore coi tagli larghi e i buchi
  //  (lucide, piegate un po' lungo la nervatura; sul rovescio più pallide), la foglia nuova arrotolata e una radice aerea.
  //  Le foglie stanno tutt'intorno al vaso: davanti si vede la faccia lucida, da dietro anche il rovescio più chiaro
  // =========================================================
  function margM(t, sg) { var th = t * Math.PI; return [.42 - .55 * Math.cos(th), sg * .47 * Math.sin(th) * (1 - .15 * t) * (1 - Math.pow(t, 6) * .5)]; }   // il bordo della foglia (t: dal lobo dietro alla punta)
  var TAGLI = [.29, .47, .64, .8];   // dove cadono i tagli lungo il bordo
  function sagomaMonstera(seme, matura) {   // la sagoma in coordinate della foglia: x lungo la nervatura (0 → 1), y di traverso
    var r = rnd(seme), m = margM, fondi = [[], []];
    function lato(sg) {
      var o = [], n = 90, k = 0, j, tk = matura ? TAGLI.map(function (t) { return t + (r() - .5) * .025; }) : [];
      for (j = 0; j <= n; j++) {
        var t = .06 + .94 * j / n;
        if (k < tk.length && t > tk[k] - .05) {   // un taglio largo sul bordo che si stringe verso dentro, inclinato verso il gambo, col fondo tondo
          var w = .036 - .004 * k, tc = tk[k], m1 = m(tc - w, sg), m2 = m(tc + w, sg), mc = m(tc, sg), pr = .7 - .07 * k;
          var I = [mc[0] - .12 * pr, mc[1] * (1 - pr)], ax = nrm([I[0] - mc[0], I[1] - mc[1], 0]), pe = [-ax[1], ax[0]];
          if ((m1[0] - mc[0]) * pe[0] + (m1[1] - mc[1]) * pe[1] < 0) pe = [-pe[0], -pe[1]];   // pe guarda verso il primo bordo del taglio
          o.push(m1, [I[0] + pe[0] * .016, I[1] + pe[1] * .016], [I[0] + ax[0] * .012, I[1] + ax[1] * .012], [I[0] - pe[0] * .016, I[1] - pe[1] * .016], m2);
          fondi[sg > 0 ? 0 : 1].push(I);
          while (j < n && .06 + .94 * (j + 1) / n < tc + w) j++;
          k++;
        } else o.push(m(t, sg));
      }
      return o;
    }
    var pp = [[.02, 0]].concat(lato(1)).concat(lato(-1).reverse()), d = "M" + pp.map(function (x) { return f3(x[0]) + "," + f3(x[1]); }).join(" L") + " Z", bu = "";
    if (matura) fondi.forEach(function (ff, s) {   // i buchi ovali tra un taglio e l'altro, vicino alla nervatura (le "finestre")
      var sg = s ? -1 : 1, k, i;
      for (i = 0; i < ff.length - 1; i++) {
        if ((i + s) % 3 === 2) continue;   // non tutti: la foglia vera è un po' disordinata
        var cx = (ff[i][0] + ff[i + 1][0]) / 2 - .012, cy = sg * Math.min(Math.abs(ff[i][1]), Math.abs(ff[i + 1][1])) * .52, rx = .056 - i * .009, ry = .025 - i * .003, o = [];
        for (k = 0; k < 16; k++) { var a = k / 16 * 6.2832; o.push([cx + Math.cos(a) * rx - Math.sin(a) * ry * .4 * sg, cy + Math.sin(a) * ry + Math.cos(a) * rx * .38 * sg]); }
        bu += " M" + o.map(function (x) { return f3(x[0]) + "," + f3(x[1]); }).join(" L") + " Z";
      }
    });
    return { tutto: d + bu, fuori: d, buchi: bu };   // la foglia coi buchi, solo il contorno, solo i buchi
  }
  def("monstera", { tipo: "piedi", nome: "Monstera", reparto: "piante", fp: [1, 1], box: [-37, -85, 39, 20], dietro: true, prezzo: 700 }, function () {
    var s = ombra(5, 4, 32, 14), r = rnd(151), i, cose = [];
    var CR = [[0, "#fffdf8"], [.35, "#f1ebde"], [.75, "#d6ccb8"], [1, "#a99e88"]];
    var vs = tornio(0, 0, profilo(0, 25, 10, function (t) { return .156 + .05 * Math.pow(t, .95); })), pu = "";
    for (i = 0; i < 70; i++) pu += cer(vs.x0 + r() * (vs.x1 - vs.x0), vs.y0 + r() * (vs.y1 - vs.y0), .2 + r() * .25, i % 3 ? "#8a7b66" : "#5c4f3e", op(.55));   // i puntini del gres
    s += pth(vs.d, lin("vm", CR, vs.x0, 0, vs.x1, 0, true), bordo(L, 2)) + dentro(vs.d, pu + rett(vs.x0, vs.y1 - 3.2, vs.x1 - vs.x0, 3.2, 0, "#c79a6c", op(.55)) + tratto(arcoDav(anello(0, 0, 3.2, .16)), "#8a6a48", .5, op(.8))) + riflesso(vs, .5, 2);
    s += tondo(0, 0, [[24.6, .203], [25.6, .207], [26.2, .203]], [[0, "#ffffff"], [.4, "#efe8da"], [.8, "#cdbfa6"], [1, "#9e917a"]], 1.6);
    var bo = anello(0, 0, 26.2, .203), te = anello(0, 0, 25.6, .185);
    s += ell(bo.x, bo.y, bo.rx, bo.ry, lin("bo", [[0, "#fffdf6"], [1, "#d8ccb4"]], 0, 0, 1, 1), bordo(L, 1.3)) + ell(te.x, te.y, te.rx, te.ry, rad("te", [[0, "#6b4a2e"], [1, "#3a2414"]], .5, .5, .6), bordo(L, .6));
    [7, 13].forEach(function (se, j) {   // due sagome di foglia, così non sono tutte uguali
      var sm = sagomaMonstera(se, true);
      simbolo("mf" + j, sm.tutto, "fill-rule='evenodd' clip-rule='evenodd'"); simbolo("mfb" + j, sm.fuori); simbolo("mfh" + j, sm.buchi);
      DEFS.push("<clipPath id='" + p + "mf" + j + "c'><use xlink:href='#" + p + "mf" + j + "'/></clipPath>");
    });
    var VE = "M.03,0 L.97,0", LAT;   // la nervatura in mezzo e quelle di lato (in mezzo a ogni striscia, verso il bordo)
    function vene(tt) { var o = ""; tt.forEach(function (t) { [-1, 1].forEach(function (sg) { var mc = margM(t, sg); o += " M" + f3(mc[0] - .14) + ",0 Q" + f3(mc[0] - .06) + "," + f3(mc[1] * .45) + " " + f3(mc[0] - .01) + "," + f3(mc[1] * .93); }); }); return o; }
    LAT = vene([.2, .38, .555, .72, .9]);
    // le foglie, tutt'intorno al vaso: [direzione (gradi: 45 = verso chi guarda, -135 = verso il muro, -45 = a destra, 135 = a sinistra),
    //  quanto è lontano dal centro l'attacco della foglia (m), a che altezza (m), grandezza (m), quanto pende (gradi; meno = si alza),
    //  se la faccia si gira verso chi guarda (1) o resta com'è (0), quanto gira (0-1), matura (coi tagli), un po' storta (gradi)]
    var FO = [
      [-75, .07, 1.02, .3, -25, 1, .8, 1, 6],       // la più alta, che si alza in mezzo
      [-40, .14, .96, .33, 6, 1, .75, 1, -8],       // in alto a destra
      [160, .13, .96, .32, 8, 1, .75, 1, 8],        // in alto a sinistra
      [-10, .17, .84, .33, 28, 1, .7, 1, -6],       // a destra
      [112, .17, .84, .33, 28, 1, .7, 1, 6],        // a sinistra
      [-150, .14, .9, .3, 78, 0, 0, 1, -5],         // dietro: pende giù verso il muro (davanti se ne vede il rovescio)
      [-112, .15, .8, .28, 8, 0, 0, 1, 7],          // dietro a destra, quasi piatta
      [-128, .12, .94, .29, 34, 1, .55, 1, -3],     // dietro, alta: riempie il buco in mezzo quando la pianta è girata
      [40, .16, .72, .27, 76, 1, .4, 1, 4],         // davanti: pende giù sopra il bordo del vaso
      [80, .13, .86, .23, 10, 1, .5, 2, -4]         // davanti a sinistra: la foglia nuova, più chiara
    ];
    var SO = .43, FR = [G * .7071, G * .7071, 0];   // FR: verso chi guarda (davanti o da dietro): le facce si girano un po' verso di lui
    FO.forEach(function (f, k) {
      var ph = f[0] / 57.296, h = [Math.cos(ph), Math.sin(ph), 0], B = add(mul(h, f[1]), [0, 0, f[2]]), be = f[4] / 57.296, Lf = f[3];
      var D = nrm(add(mul(h, Math.cos(be)), [0, 0, -Math.sin(be)])), N = nrm(add(mul(h, Math.sin(be)), [0, 0, Math.cos(be)]));   // la lama esce dal gambo e pende; N = la faccia
      if (f[5]) { var V = mul(FR, f[5]), Np = sub(V, mul(D, dot(V, D))); if (dot(Np, Np) > 1e-4) N = nrm(mista(N, nrm(Np), f[6])); }   // la faccia girata un po' verso la luce (davanti o dietro)
      N = ruotaAsse(D, f[8] / 57.296)(N);
      var Sd = crs(N, D);
      var gm = liscia([add(mul(h, .015), [0, 0, SO - .01]), add(mul(h, f[1] * .45), [0, 0, SO + (f[2] - SO) * .7]), B], 6).map(S);   // il gambo: esce dalla terra e si piega verso fuori
      var gambo = tratto(aperto(gm), L, 2.1) + tratto(aperto(gm), "#4f8a2b", 1.15) + tratto(aperto(gm), "#a9dc72", .35, op(.8) + " transform='translate(-.3 -.2)'");
      var vis = guarda(N) >= 0, la = lux(nrm(add(N, mul(Sd, -.38)))), lb = lux(nrm(add(N, mul(Sd, .38)))), cA, cB, id = "mf" + (k % 2);
      if (!vis) { la = lux(mul(nrm(add(N, mul(Sd, -.38))), -1)); lb = lux(mul(nrm(add(N, mul(Sd, .38))), -1)); }
      if (vis && f[7] === 1) { cA = mix("#1d5e2a", "#5cc463", .5 + .42 * lb); cB = mix("#1d5e2a", "#5cc463", .5 + .42 * la); }   // la faccia lucida, verde scuro
      else if (vis) { cA = mix("#3f9a3a", "#a5e57f", .5 + .4 * lb); cB = mix("#3f9a3a", "#a5e57f", .5 + .4 * la); }   // la foglia nuova, più chiara
      else { cA = mix("#7aa86c", "#c2e3ae", .5 + .4 * lb); cB = mix("#7aa86c", "#c2e3ae", .5 + .4 * la); }   // il rovescio, pallido
      var gr = lin("mo" + k, [[0, chiaro(cA, .1)], [.5, cA], [.5, cB], [1, scuro(cB, .14)]], 0, 0, 0, 1);
      var fg = "<g" + mat(B, mul(D, Lf), mul(Sd, Lf)) + ">" + usa(id, "", "fill='" + gr + "'") + "<g clip-path='url(#" + p + id + "c)'><path d='" + VE + "' fill='none' stroke='" + (vis ? "#c2e88a" : "#eef7dc") + "' stroke-width='.8' vector-effect='non-scaling-stroke'/>" +
        "<path d='" + LAT + "' fill='none' stroke='" + (vis ? "#7fcb5c" : "#e2f0cf") + "' stroke-width='.42' opacity='.85' vector-effect='non-scaling-stroke'/>" +
        (vis ? "<ellipse cx='.4' cy='" + (la > lb ? "-.17" : ".17") + "' rx='.3' ry='.065' fill='#ffffff' opacity='.26'/><ellipse cx='.62' cy='" + (la > lb ? "-.09" : ".09") + "' rx='.12' ry='.03' fill='#ffffff' opacity='.3'/>" : "") + "</g>" +
        usa("mfh" + (k % 2), "", "fill='none' stroke='" + scuro(cB, .45) + "' stroke-width='.45'") + usa("mfb" + (k % 2), "", "fill='none' stroke='" + L + "' stroke-width='.95'") + "</g>";   // le finestre con l'orlo sottile, poi il contorno
      cose.push([prof(add(B, mul(D, Lf * .45))), gambo + fg]);
    });
    // la foglia nuova arrotolata, al centro, e una radice aerea che scende nella terra
    var nu = liscia([[.01, .0, SO], [.03, -.01, .7], [.05, -.02, .9]], 5), nr = rametto(nu, function (t) { return .011 * (1 - t) + .003; });
    cose.push([prof([.03, -.01, .6]), pth(nr.d, lin("nf", [[0, "#d8f5a2"], [.5, "#a9e34b"], [1, "#66a80f"]], 0, 0, 1, 0), bordo(L, .9)) + dentro(nr.d, tratto(aperto(nr.sp.map(function (x, k) { return [x[0] + Math.sin(k * 1.3) * .9, x[1]]; })), "#74b816", .4))]);
    var ra = liscia([[.06, .04, .78], [.1, .07, .62], [.11, .08, SO + .01]], 5).map(S);
    cose.push([prof([.1, .07, .6]), tratto(aperto(ra), L, 1.6) + tratto(aperto(ra), "#8a6a4a", .8)]);
    return s + ordina(cose);
  });

  // ---------- le misure dal box e il contratto con SGMobiliArte ----------
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  window.SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: d.stanza || "tutte", reparto: d.reparto, w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice(), dietro: !!d.dietro, prezzo: d.prezzo, qual: d.qual == null ? 2 : d.qual };
      if (d.luce) { var kl = d.k || 1; o.luce = [Math.round(m.ax + d.luce[0] * kl), Math.round(m.ay + d.luce[1] * kl), d.luce[2], d.luce[3]]; }   // il punto della luce nel disegno davanti (ingrandito come il disegno)
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "pic" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!(opz.notte && d.luce);
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      if (d.k && d.k !== 1) c = "<g transform='scale(" + d.k + ")'>" + c + "</g>";   // le cose piccole un po' più grandi del vero, così si vedono bene
      return "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

/* =========================================================
   SPeeD GAME — MOBILI VISTI DALL'ALTO: SOGGIORNO E CUCINA, LA ROBA SCADENTE (quella di partenza)
   Gli stessi mobili della casa vista di lato (js/casa.js), visti dall'alto in diagonale come quelli del bagno
   (js/mobili-arte.js: stesse misure, stesse regole). Il davanti guarda in basso a sinistra; { dietro: true } = girato.
   Roba povera e vissuta ma simpatica: la toppa, le macchie, l'ammaccatura, l'anta storta, la stagnola sull'antenna.
   Si aggiunge al catalogo con SGMobiliArte.aggiungi({ nomi(), info(nome), svg(nome, opz) }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte || !window.SGMobiliArte.aggiungi) return;

  // ---------- attrezzi (gli stessi del bagno) ----------
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
  function via(a) { return "M" + a.map(function (x) { return q(x); }).join(" L"); }   // una linea aperta che passa per i punti
  function sposta(a, dx, dy) { return a.map(function (x) { return [x[0] + dx, x[1] + dy]; }); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  function gira(g, x, y) { return "transform='rotate(" + f1(g) + " " + f1(x) + " " + f1(y) + ")'"; }
  function rettD(x, y, w, h) { return "M" + q(x, y) + " H" + f1(x + w) + " V" + f1(y + h) + " H" + f1(x) + " Z"; }   // un rettangolo come tracciato (per i ritagli)
  function liscio(a) {   // una forma chiusa morbida che passa vicino ai punti
    var n = a.length, i;
    function m(i) { var x = a[i % n], y = a[(i + 1) % n]; return [(x[0] + y[0]) / 2, (x[1] + y[1]) / 2]; }
    var d = "M" + q(m(0));
    for (i = 1; i <= n; i++) d += " Q" + q(a[i % n]) + " " + q(m(i));
    return d + " Z";
  }
  function ovale(cx, cy, rx, ry, r, amp, n) { var a = [], i; for (i = 0; i < n; i++) { var t = i / n * 6.2832, k = 1 + (r() - .5) * amp; a.push([cx + Math.cos(t) * rx * k, cy + Math.sin(t) * ry * k]); } return a; }   // un ovale un po' sbilenco (a caso fisso)
  function riccio(cx, cy, rx, ry, n, amp, rot) {   // un ovale col bordo a smerli (l'imbottitura, la polvere)
    var d = "", i, a0 = rot || 0;
    for (i = 0; i <= n; i++) {
      var t = a0 + i / n * 6.2832, x = cx + Math.cos(t) * rx, y = cy + Math.sin(t) * ry;
      if (!i) { d = "M" + q(x, y); continue; }
      var tm = a0 + (i - .5) / n * 6.2832;
      d += " Q" + q(cx + Math.cos(tm) * rx * (1 + amp), cy + Math.sin(tm) * ry * (1 + amp)) + " " + q(x, y);
    }
    return d + " Z";
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
      DEFS.push("<" + tag + " id='" + id + "' " + a + ">" + stops.map(function (s) { return "<stop offset='" + f1(s[0] * 1000) / 1000 + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join("") + "</" + tag + ">");
    }
    return "url(#" + id + ")";
  }
  function lin(nome, stops, x1, y1, x2, y2, user) { return sfum("linearGradient", user ? nome + (++nC) : nome, stops, "x1='" + f1(x1) + "' y1='" + f1(y1) + "' x2='" + f1(x2) + "' y2='" + f1(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function rad(nome, stops, cx, cy, r) { return sfum("radialGradient", nome, stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function dentro(forma, corpo, pari) {   // corpo ritagliato dentro la forma (un tracciato "d"); pari = coi buchi
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'" + (pari ? " clip-rule='evenodd'" : "") + "/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  function ombra(x, y, rx, ry, k) {   // l'ombra morbida a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra)
    return ell(x, y, rx, ry, rad("om", [[0, "#000", .2], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5), k ? "opacity='" + k + "'" : "");
  }
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];
  var OTTONE = [[0, "#fff1b8"], [.4, "#d9a94a"], [1, "#8a5f14"]];

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda (si disegna dopo)
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf, rr: rr == null ? rf : rr, e: e || 2 }; }
  function giro(F, z, k, n, db) {
    var ka = k == null ? 1 : (k.length ? k[0] : k), kb = k == null ? 1 : (k.length ? k[1] : k), out = [], i; n = n || 60;
    for (i = 0; i < n; i++) {
      var t = i / n * 6.2832, c = Math.cos(t), s = Math.sin(t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / F.e), y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / F.e);
      out.push(P(F.ca + x * F.ra * ka, F.cb + (db || 0) + y * (y > 0 ? F.rf : F.rr) * kb, z));
    }
    return out;
  }
  function inviluppo(pp) {
    var a = pp.slice().sort(function (m, n) { return m[0] - n[0] || m[1] - n[1]; }), lo = [], hi = [], i;
    function cr(o, m, n) { return (m[0] - o[0]) * (n[1] - o[1]) - (m[1] - o[1]) * (n[0] - o[0]); }
    for (i = 0; i < a.length; i++) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], a[i]) <= 0) lo.pop(); lo.push(a[i]); }
    for (i = a.length - 1; i >= 0; i--) { while (hi.length >= 2 && cr(hi[hi.length - 2], hi[hi.length - 1], a[i]) <= 0) hi.pop(); hi.push(a[i]); }
    return lo.slice(0, -1).concat(hi.slice(0, -1));
  }
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }

  // ---------- i mobili squadrati (come nel bagno) ----------
  function faccia(o, dir, c) { return "<g transform='matrix(.8197 " + (dir > 0 ? ".4098" : "-.4098") + " 0 1 " + f1(o[0]) + " " + f1(o[1]) + ")'>" + c + "</g>"; }
  function tinte(c) {
    if (typeof c !== "string") return c;
    var k = c.slice(1);
    return [lin("ts" + k, [[0, chiaro(c, .32)], [1, chiaro(c, .1)]], 0, 0, 1, 1), lin("tl" + k, [[0, chiaro(c, .12)], [1, scuro(c, .06)]], 0, 0, 0, 1), lin("td" + k, [[0, scuro(c, .2)], [1, scuro(c, .34)]], 0, 0, 0, 1)];
  }
  function blocco(a0, a1, b0, b1, z0, z1, col, f, lw) {
    f = f || {};
    var u0 = G > 0 ? a0 : -a1, u1 = G > 0 ? a1 : -a0, v0 = G > 0 ? b0 : -b1, v1 = G > 0 ? b1 : -b0, c = tinte(col);
    var A = Puv(u0, v0, z1), B = Puv(u1, v0, z1), C = Puv(u1, v1, z1), D = Puv(u0, v1, z1), Bb = Puv(u1, v0, z0), Cb = Puv(u1, v1, z0), Db = Puv(u0, v1, z0);
    var Ws = (u1 - u0) * 61, Wd = (v1 - v0) * 61, H = z1 - z0, fs = G > 0 ? f.davanti : f.dietro;
    var s = faccia(D, 1, rett(0, 0, Ws, H, 0, c[1]) + (fs ? fs(Ws, H) : "")) + faccia(C, -1, rett(0, 0, Wd, H, 0, c[2]) + (f.fianco ? f.fianco(Wd, H) : "")) + poly([A, B, C, D], c[0]);
    if (f.sopra) s += f.sopra(A, B, C, D);
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), L, 1.1, "opacity='.8'");
    if (H > 5 && !f.senzaLuce) s += tratto("M" + q(D[0] + 1.6, D[1] + 1.4) + " L" + q(C[0] - .6, C[1] + 1.1), "#ffffff", 1.1, "opacity='.6'");
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, lw || 2.3));
  }
  function pannello(c, W, H, m, r) {   // un'anta in rilievo: il bordo chiaro in alto a sinistra, scuro in basso a destra
    return rett(m[0], m[1], W, H, r || 1.4, lin("an" + c.slice(1), [[0, chiaro(c, .2)], [1, chiaro(c, .02)]], 0, 0, 0, 1), "stroke='" + scuro(c, .45) + "' stroke-width='.9'") +
      tratto("M" + q(m[0] + 1, m[1] + H - 1) + " L" + q(m[0] + 1, m[1] + 1) + " L" + q(m[0] + W - 1, m[1] + 1), chiaro(c, .55), .9, "opacity='.8'") +
      tratto("M" + q(m[0] + W - 1, m[1] + 1.5) + " L" + q(m[0] + W - 1, m[1] + H - 1) + " L" + q(m[0] + 1.5, m[1] + H - 1), scuro(c, .3), .9, "opacity='.7'");
  }
  // l'angolo in alto a sinistra della faccia che si vede a sinistra (il davanti; da girato la schiena) e di quella che si vede a destra (il fianco)
  function oS(a0, a1, b0, b1, z) { return G > 0 ? P(a0, b1, z) : P(a1, b0, z); }
  function oD(a0, a1, b0, b1, z) { return G > 0 ? P(a1, b1, z) : P(a0, b0, z); }

  // un pezzo dagli spigoli tondi (cuscini, braccioli, il frigo, la TV): la sagoma tra i giri [z, k] dal basso in alto,
  // colorata come un blocco (il davanti alla luce, il fianco in ombra, il passaggio morbido sullo spigolo), poi il sopra, più chiaro
  function tondo(F, liv, c, lw, o) {
    o = o || {};
    var gg = liv.map(function (l) { return giro(F, l[0], l[1], 72); }), sil = sagoma(gg), b = limiti(sil), w = Math.max(1, b[2] - b[0]), h = Math.max(1, b[3] - b[1]);
    var um = G > 0 ? F.ca + F.ra : -F.ca + F.ra, vm = G > 0 ? F.cb + F.rf : -F.cb + F.rr, t = Math.max(.15, Math.min(.88, ((um - vm) * 50 - b[0]) / w)), d = chiuso(sil);
    var s = pth(d, lin("tg", [[0, chiaro(c, o.luce == null ? .2 : o.luce)], [t - .13, chiaro(c, .03)], [t + .04, scuro(c, .2)], [1, scuro(c, .34)]], b[0], 0, b[2], 0, true));
    s += dentro(d, rett(b[0], b[1], w, h, 0, lin("tv", [[0, "#ffffff", .1], [.5, "#ffffff", 0], [1, "#000000", .17]], 0, 0, 0, 1)));
    if (o.sopra !== false) s += pth(chiuso(gg[gg.length - 1]), lin("tt" + c.slice(1), [[0, chiaro(c, .38)], [1, chiaro(c, .12)]], 0, 0, 1, 1), "stroke='" + scuro(c, .4) + "' stroke-width='" + (o.lt || 1) + "' stroke-linejoin='round' stroke-opacity='" + (o.lo || .7) + "'");
    return s + pth(d, "none", bordo(L, lw || 2.2));
  }
  // un solido convesso a facce piane (v = vertici [a, b, z]; f = facce, liste di indici in giro); si vedono solo le facce girate verso chi guarda
  function solido(v, f, col, lw) {
    var cen = [0, 0, 0], s = "";
    v.forEach(function (x) { cen[0] += x[0] / v.length; cen[1] += x[1] / v.length; cen[2] += x[2] / v.length; });
    f.forEach(function (fc) {
      var a = v[fc[0]], b = v[fc[1]], c = v[fc[2]], e1 = [b[0] - a[0], b[1] - a[1], (b[2] - a[2]) / 61], e2 = [c[0] - a[0], c[1] - a[1], (c[2] - a[2]) / 61];
      var n = [e1[1] * e2[2] - e1[2] * e2[1], e1[2] * e2[0] - e1[0] * e2[2], e1[0] * e2[1] - e1[1] * e2[0]], m = [0, 0, 0];
      fc.forEach(function (i) { m[0] += v[i][0] / fc.length; m[1] += v[i][1] / fc.length; m[2] += v[i][2] / fc.length; });
      if (n[0] * (m[0] - cen[0]) + n[1] * (m[1] - cen[1]) + n[2] * (m[2] - cen[2]) / 61 < 0) n = [-n[0], -n[1], -n[2]];   // la normale verso fuori
      var nu = G * n[0], nv = G * n[1];
      if (nu + nv + n[2] * 50 / 61 <= 1e-9) return;   // girata dall'altra parte
      var k = Math.abs(n[2]) >= Math.max(Math.abs(nu), Math.abs(nv)) ? 0 : (nv >= nu ? 1 : 2);
      s += poly(fc.map(function (i) { return P(v[i][0], v[i][1], v[i][2]); }), col[k], bordo(L, lw || 1.6));
    });
    return s;
  }
  function venature(x, y, w, h, c, r, n, vert) {   // le venature del legno su un'asse: linee mosse un po' più scure (vert = asse in piedi)
    var s = "", i;
    for (i = 0; i < n; i++) {
      var k = (i + .5 + (r() - .5) * .6) / n, o = (r() - .5) * 1.6, j = (r() - .5) * 1.2;
      if (!vert) { var yy = y + h * k, x0 = x + r() * w * .15, x1 = x + w - r() * w * .15; s += tratto("M" + q(x0, yy) + " C" + q(x0 + (x1 - x0) * .33, yy + o) + " " + q(x0 + (x1 - x0) * .66, yy - o) + " " + q(x1, yy + j), scuro(c, .28), .5, "opacity='.6'"); }
      else { var xx = x + w * k, y0 = y + r() * h * .1, y1 = y + h - r() * h * .1; s += tratto("M" + q(xx, y0) + " C" + q(xx + o, y0 + (y1 - y0) * .33) + " " + q(xx - o, y0 + (y1 - y0) * .66) + " " + q(xx + j, y1), scuro(c, .28), .5, "opacity='.6'"); }
    }
    return s;
  }

  // il registro: box = [x0, y0, x1, y1] attorno al centro dell'impronta (per i mobili in piedi e le cose "sopra")
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  DIVANO CON LA TOPPA: stoffa marrone stinta, i cuscini sformati, la toppa a quadri cucita storta sullo schienale
  // =========================================================
  var DIV = "#8b6a4f";
  function toppa(x, y, w, h, g) {   // la toppa a quadri gialla e rossa, coi punti a croce agli angoli e l'impuntura tutt'intorno
    var t = rett(x, y, w, h, 0, "#c9a24a"), i;
    for (i = 1; i < w; i += 5) t += rett(x + i, y, 2.4, h, 0, "#b5462f", "opacity='.6'");
    for (i = 1; i < h; i += 5) t += rett(x, y + i, w, 2.4, 0, "#b5462f", "opacity='.38'");
    for (i = 2.2; i < w; i += 5) t += rett(x + i - .2, y, .45, h, 0, "#4a1d10", "opacity='.4'");
    for (i = 2.2; i < h; i += 5) t += rett(x, y + i - .2, w, .45, 0, "#4a1d10", "opacity='.32'");
    t += rett(x, y, w, h * .45, 0, "#ffffff", "opacity='.12'");
    var croci = [[x + 1.9, y + 1.9], [x + w - 1.9, y + 1.9], [x + 1.9, y + h - 1.9], [x + w - 1.9, y + h - 1.9]].map(function (v) { return tratto("M" + q(v[0] - 1.2, v[1] - 1.2) + " L" + q(v[0] + 1.2, v[1] + 1.2) + " M" + q(v[0] + 1.2, v[1] - 1.2) + " L" + q(v[0] - 1.2, v[1] + 1.2), L, .9); }).join("");
    return "<g " + gira(g, x + w / 2, y + h / 2) + ">" + rett(x + .9, y + 1.1, w, h, .8, "#000", "opacity='.2'") + dentro(rettD(x, y, w, h), t) + rett(x, y, w, h, .8, "none", bordo(L, 1)) +
      rett(x + 1.3, y + 1.3, w - 2.6, h - 2.6, .4, "none", "stroke='#f7ecd0' stroke-width='.7' stroke-dasharray='1.5 1.1'") + croci + "</g>";
  }
  function imbottitura(x, y, k) {   // lo strappo dai bordi sfilacciati, con l'imbottitura bianca che esce a sbuffo
    var st = [[-4.6, .3], [-3, -1], [-2, -.2], [-.4, -1.5], [1.2, -.5], [2.8, -1.3], [4.6, .1], [2.6, 1.3], [.8, .7], [-1, 1.5], [-2.8, .9]].map(function (v) { return [x + v[0] * k, y + v[1] * k]; });
    var nu = riccio(x + .2 * k, y - .9 * k, 3.4 * k, 2.3 * k, 7, .32, .4);
    return poly(st, "#2a1c14", bordo(L, .6)) + pth(nu, "#f8f4ea", bordo(L, .7)) + dentro(nu, ell(x + 1.4 * k, y + .6 * k, 3.4 * k, 1.8 * k, "#d8cdb8", "opacity='.8'") + ell(x - 1 * k, y - 2 * k, 1.4 * k, .7 * k, "#ffffff")) +
      tratto("M" + q(x - 1.6 * k, y - 1.2 * k) + " q" + q(.9 * k, -.7 * k) + " " + q(1.8 * k, -.1 * k) + " M" + q(x + .6 * k, y - .2 * k) + " q" + q(.8 * k, -.5 * k) + " " + q(1.6 * k, .1 * k), "#cbbfa8", .5) +
      tratto("M" + q(x + 4.2 * k, y + .2 * k) + " q" + q(1.2 * k, .6 * k) + " " + q(.8 * k, 2 * k) + " M" + q(x - 4.2 * k, y + .3 * k) + " q" + q(-.9 * k, .9 * k) + " " + q(-.3 * k, 1.9 * k), "#f0e9da", .5);   // i fili che pendono
  }
  function molla(x, y) {   // la molla che spunta dal cuscino
    var d = "", i;
    for (i = 0; i <= 36; i++) { var t = i / 12, g = t * 6.2832; d += (i ? " L" : "M") + q(x + Math.cos(g) * 2.2, y - t * 2.1 + Math.sin(g) * 1); }
    return ell(x, y + .5, 3.4, 1.5, "#2a1c14") + tratto(d, L, 1.9) + tratto(d, "#c3c9ce", .95) + tratto(d, "#ffffff", .35, "opacity='.85' transform='translate(-.3 -.2)'");
  }
  def("divano_toppa", { tipo: "piedi", nome: "Divano con la toppa", fp: [2, 1], box: [-82, -86, 94, 42], dietro: true, azione: "siedi", seduta: 26 }, function () {
    var c = DIV, girato = G < 0, r = rnd(31), s = ombra(6, 9, 86, 30);
    [[-.85, -.37], [.85, -.37], [-.85, .31], [.85, .31]].forEach(function (g) { s += blocco(g[0] - .04, g[0] + .04, g[1] - .04, g[1] + .04, 0, 4.6, "#b8863b", { senzaLuce: true }, 1.2); });   // i piedini di legno
    s += tondo(forma(0, .07, .77, .29, .29, 8), [[4, 1], [14.5, 1]], scuro(c, .28), 2);   // la base sotto i cuscini: la fascia scura
    function bracciolo(sg) {   // il bracciolo, tondo sopra; davanti la cucitura ad arco; su quello di destra lo strappo con l'imbottitura
      var F = forma(sg * .86, -.03, .1, .41, .41, 5), x = tondo(F, [[4, [.97, .985]], [9, 1], [27, [1.03, 1]], [31, [.88, .99]], [33.5, [.5, .97]]], c, 2.2, { lt: .7, lo: .45 });
      var cuc = "M2,26 L2,6.5 Q2,1.6 6.1,1.6 Q10.2,1.6 10.2,6.5 L10.2,26", lo = P(sg * .86, .18, 33.2);
      x += ell(lo[0], lo[1], 7, 2.2, chiaro(c, .32), "opacity='.35' " + gira(-27, lo[0], lo[1]));   // il bracciolo consumato dove si appoggiano i gomiti
      if (!girato) x += faccia(P(sg * .86 - .1, .38, 31), 1, tratto(cuc, scuro(c, .35), 1.6, "opacity='.5'") + tratto(cuc, chiaro(c, .25), .6, "stroke-dasharray='1.2 1' opacity='.8'"));
      if (sg > 0 && !girato) x += faccia(P(.96, .38, 31), -1, imbottitura(16, 11.5, 1.35));
      if (sg < 0 && girato) x += faccia(P(-.96, -.44, 31), -1, ell(30, 12, 6.4, 4.6, chiaro(c, .25), "opacity='.3'") + ell(31, 12.6, 3.4, 2.4, chiaro(c, .3), "opacity='.3'") + tratto("M33,15.6 q.8,1.4 .2,2.8 M35,14.8 q1,1 .9,2.4", chiaro(c, .4), .5, "opacity='.8'"));   // la stoffa lisa, con due fili che pendono
      return x;
    }
    function schienale() {   // lo schienale: le pieghe della stoffa lenta e la toppa; dietro la cucitura, la toppa di jeans, lo strappo e l'etichetta
      var F = forma(0, -.33, .77, .11, .11, 6), x = tondo(F, [[4, 1], [43, [1, 1.02]], [47.5, [.995, .86]], [50.5, [.98, .45]]], c, 2.3, { lt: .8, lo: .5 }), d = "", i;
      if (!girato) {
        d += tratto("M5,4 Q22,8.5 40,4.5 Q57,1 74,5 Q86,8 91,13", scuro(c, .32), 1.1, "opacity='.55'") + tratto("M10,10 Q18,8 26,11.5 M70,11 Q80,8.5 88,12", scuro(c, .32), .9, "opacity='.45'") +
          tratto("M6,3 Q22,7.5 40,3.5", chiaro(c, .3), .8, "opacity='.5'");
        for (i = 0; i < 26; i++) d += cer(4 + r() * 86, 2 + r() * 14, .5 + r() * .4, chiaro(c, .32), "opacity='.45'");   // i pallini della stoffa vecchia
        d += ell(25, 10.5, 5.2, 2.8, scuro(c, .3), "opacity='.32'") + ell(24.2, 10, 3, 1.5, scuro(c, .3), "opacity='.25'");   // una macchia
        d += toppa(56.5, .8, 22, 16.5, -6);   // grande e storta: si vede anche da lontano
      } else {
        d += tratto("M47,1 L47,38", scuro(c, .35), .9, "opacity='.55'") + tratto("M47.6,1 L47.6,38", chiaro(c, .3), .6, "stroke-dasharray='1.2 1' opacity='.6'");
        for (i = 0; i < 30; i++) d += cer(4 + r() * 86, 2 + r() * 34, .5 + r() * .4, chiaro(c, .3), "opacity='.4'");
        var tj = "";   // la toppa di jeans
        tj += rett(15, 8, 15, 12.5, .8, "#4a6fa5") + rett(17, 10, 11, 8.5, 2, "#7f9fc9", "opacity='.55'");
        for (i = 0; i < 9; i++) tj += tratto("M" + q(15 + i * 1.8, 8) + " L" + q(15 + i * 1.8 - 3, 20.5), "#3b5c8c", .4, "opacity='.6'");
        d += "<g " + gira(5, 22.5, 14) + ">" + rett(15.8, 9, 15, 12.5, .8, "#000", "opacity='.2'") + dentro(rettD(15, 8, 15, 12.5), tj) + rett(15, 8, 15, 12.5, .8, "none", bordo(L, 1)) +
          rett(16.3, 9.3, 12.4, 9.9, .4, "none", "stroke='#f4e3b0' stroke-width='.7' stroke-dasharray='1.4 1'") + "</g>";
        d += imbottitura(66, 12, 1.15);
        d += rett(78, 30, 6.5, 8.5, .6, "#f3efe4", bordo(L, .7)) + rett(78.8, 31, 4.9, 1, 0, "#d9480f", "opacity='.8'") + tratto("M79.2,33.6 L83.4,33.6 M79.2,35.2 L82.4,35.2", "#8a8070", .5);   // l'etichetta
      }
      return x + faccia(oS(-.77, .77, -.44, -.22, 43), 1, d);
    }
    function cuscino(sg) {   // il cuscino: gonfio ai bordi e infossato in mezzo; quello di destra più schiacciato
      var F = forma(sg * .385, .075, .37, .285, .285, 4), z = sg < 0 ? 26 : 24.6, top = giro(F, z, [.93, .88], 72), x = "";
      x += tondo(F, [[14, [.98, .96]], [18.5, [1.015, 1.03]], [z - 2.6, 1], [z, [.93, .88]]], c, 2.1, { lt: .9, lo: .55 });
      var m = P(sg * .385 + sg * .03, .05, z), fo = rad("fo", [[0, scuro(c, .32), .55], [.6, scuro(c, .32), .2], [1, scuro(c, .32), 0]], .5, .5, .5);
      var dd = ell(m[0], m[1] + 1.2, sg < 0 ? 16 : 20, sg < 0 ? 6.4 : 8, fo) + ell(m[0] - 4, m[1] - 2.5, 9, 3, "#ffffff", "opacity='.12'");
      dd += tratto("M" + q(m[0] - 14, m[1] + 4) + " Q" + q(m[0] - 4, m[1] + .5) + " " + q(m[0] + 6, m[1] + 3.5), scuro(c, .35), .9, "opacity='.4'");
      if (sg < 0) { var mc = P(-.56, .17, z); dd += ell(mc[0], mc[1], 4.6, 2.3, scuro(c, .25), "opacity='.25' stroke='" + scuro(c, .45) + "' stroke-width='.9' stroke-opacity='.5'"); }   // l'alone del caffè
      else { var mb = P(.62, .2, z); dd += ell(mb[0], mb[1], 3.4, 1.6, chiaro(c, .25), "opacity='.3'"); }
      x += dentro(chiuso(top), dd);
      if (sg > 0 && !girato) { var mo = P(.6, .24, z - .3); x += molla(mo[0], mo[1]); }   // la molla che spunta
      return x;
    }
    return s + ordina([[vicino(-.86, -.03), bracciolo(-1)], [vicino(.86, -.03), bracciolo(1)], [vicino(0, -.33), schienale()], [vicino(-.385, .075), cuscino(-1)], [vicino(.385, .075), cuscino(1)]]);
  });

  // =========================================================
  //  CASSETTA DELLA FRUTTA rovesciata, usata come tavolino: le assi con le fessure, il timbro con la mela, i chiodi, una scheggia
  // =========================================================
  def("tavolino_cassetta", { tipo: "piedi", nome: "Cassetta della frutta", fp: [1, 1], box: [-50, -56, 54, 32], dietro: true, piano: 27 }, function () {
    var c = "#c9995b", A = .39, B0 = -.23, B1 = .22, Z = 27, ZT = 25.4, r = rnd(47), s = ombra(5, 7, 44, 18), girato = G < 0;
    var toni = [c, mix(c, "#a59a86", .3), chiaro(c, .07), scuro(c, .06), mix(c, "#b9a27c", .35), chiaro(c, .12)];   // ogni asse un po' diversa: quella scolorita, quella più nuova
    function sag(a0, a1, b0, b1, z0, z1) { var u0 = G > 0 ? a0 : -a1, u1 = G > 0 ? a1 : -a0, v0 = G > 0 ? b0 : -b1, v1 = G > 0 ? b1 : -b0; return [Puv(u0, v0, z1), Puv(u1, v0, z1), Puv(u1, v0, z0), Puv(u1, v1, z0), Puv(u0, v1, z0), Puv(u0, v1, z1)]; }
    s += poly(sag(-A + .02, A - .02, B0 + .02, B1 - .02, 0, ZT), lin("bu", [[0, "#4a321e"], [1, "#22160b"]], 0, 0, 0, 1));   // il buio dentro (si vede tra le assi)
    function chiodi(x, H) { return cer(x, H * .3, .6, "#3a3430") + cer(x, H * .72, .6, "#3a3430") + cer(x - .2, H * .3 - .2, .22, "#9a948c") + cer(x - .2, H * .72 - .2, .22, "#9a948c"); }
    var ea = G > 0 ? [A - .032, A] : [-A, -A + .032];   // la tavola di testa dalla parte di chi guarda
    s += blocco(ea[0], ea[1], B0 + .02, B1 - .02, 0, ZT, scuro(c, .03), { senzaLuce: true, fianco: function (W, H) {
      return venature(0, 0, W, H, c, rnd(5), 6) + ell(W / 2, 5.4, 5.6, 1.9, "#24170c", bordo(L, .8)) + tratto("M" + q(W / 2 - 4.6, 6.6) + " Q" + q(W / 2, 7.9) + " " + q(W / 2 + 4.6, 6.6), chiaro(c, .3), .6, "opacity='.7'") +   // la maniglia a buco
        ell(W * .7, H * .62, 1.4, 1, scuro(c, .3), "opacity='.6'") + tratto("M" + q(W * .7 - 3, H * .62) + " Q" + q(W * .7, H * .62 - 2.4) + " " + q(W * .7 + 3.4, H * .62 + .2), scuro(c, .3), .5, "opacity='.6'");   // un nodo del legno
    } }, 1.5);
    var nb = G > 0 ? [B1 - .022, B1] : [B0, B0 + .022], fasce = [[.6, 7.4], [9.4, 16.2], [18.2, ZT]];
    fasce.forEach(function (z, i) {
      var fn = function (W, H) { return venature(0, 0, W, H, toni[i], rnd(11 + i), 3) + chiodi(1.7, H) + chiodi(W - 1.7, H) + (i === 1 ? tratto("M" + q(W * .62, H * .5) + " L" + q(W * .9, H * .42), scuro(c, .4), .5, "opacity='.7'") : ""); };
      s += blocco(-A, A, nb[0], nb[1], z[0], z[1], toni[i], { davanti: fn, dietro: fn, senzaLuce: i !== 2 }, 1.5);
    });
    var W0 = 2 * A * 61, buchi = fasce.map(function (z) { return rettD(0, ZT - z[1], W0, z[1] - z[0]); }).join(" "), st = "";
    // niente scritte: il motore specchia il disegno e si leggerebbero al contrario
    var ink = "#8a3a1c";
    if (!girato) {   // il timbro del fruttivendolo, stampato di traverso sulle assi: una mela grossa col picciolo e la foglia dentro un ovale
      var mela = "M24,9.2 C20.8,6.8 15.8,8.4 16,13.6 C16.2,18.8 20.2,21.4 24,20 C27.8,21.4 31.8,18.8 32,13.6 C32.2,8.4 27.2,6.8 24,9.2 Z";
      st += "<g " + gira(-5, 24, 13.4) + " opacity='.66'>" + ell(24, 13.6, 15, 10.6, "none", "stroke='" + ink + "' stroke-width='.8' stroke-dasharray='5 1.2'") +
        pth(mela, ink, "fill-opacity='.62'") + ell(20.4, 12, 1.4, 2.4, "#c9995b", "opacity='.8' " + gira(20, 20.4, 12)) + tratto("M24,9.2 Q23.6,6.6 25,5", ink, .9) +
        pth("M24.8,7 Q27.4,4.2 30,5.6 Q27.8,8.4 24.8,7 Z", ink, "fill-opacity='.62'") + cer(10.6, 13.6, .7, ink) + cer(37.4, 13.6, .7, ink) + "</g>";
      s += faccia(P(-A, B1, ZT), 1, dentro(buchi, st));
    } else {   // dietro: l'etichetta di carta mezza strappata, con la mela disegnata e due righe d'inchiostro
      st += pth("M13,1.2 L31,1.4 L31.4,6 L24,6.4 L22.6,4.8 L20.8,6.6 L13.2,6.4 Z", "#f2e6c4", bordo(L, .6)) + cer(16.6, 3.8, 1.8, "#d9480f", bordo(L, .5)) + tratto("M16.6,2 q.4,-1 1.2,-1.2", "#5d7a2a", .6) +
        tratto("M19.6,2.9 L29.6,2.9 M19.6,4.4 L26.4,4.4", "#9a6a4a", .7) + tratto("M27.4,4.4 L29.6,4.4", "#9a6a4a", .7);
      s += faccia(P(A, B0, ZT), 1, dentro(buchi, st));
    }
    var tops = [[B0, B0 + .13], [B0 + .165, B0 + .285], [B0 + .32, B1]];
    s += ordina(tops.map(function (b, i) {
      return [vicino(0, (b[0] + b[1]) / 2), blocco(-A, A, b[0], b[1], ZT, Z, toni[i + 3], { sopra: function () {
        var x = "", k, rr = rnd(71 + i), bm;
        for (k = 0; k < 3; k++) { bm = b[0] + (b[1] - b[0]) * (k + .5) / 3 + (rr() - .5) * .02; x += tratto("M" + q(P(-A + .03, bm, Z)) + " Q" + q(P(0, bm + (rr() - .5) * .03, Z)) + " " + q(P(A - .03, bm + (rr() - .5) * .02, Z)), scuro(toni[i + 3], .28), .55, "opacity='.6'"); }
        [-1, 1].forEach(function (sg) { [.3, .7].forEach(function (f) { var n = P(sg * (A - .028), b[0] + (b[1] - b[0]) * f, Z); x += ell(n[0], n[1], .75, .45, "#3a3430") + ell(n[0] - .2, n[1] - .15, .3, .2, "#a8a29a"); }); });   // i chiodi
        if (i === 1) x += tratto(linea(P(-.12, b[0] + .05, Z), P(.24, b[0] + .055, Z)), "#3b2414", .7, "opacity='.75'");   // la crepa
        if (i === 0) { var nd = P(.16, b[0] + .06, Z); x += ell(nd[0], nd[1], 2.4, 1.1, scuro(toni[3], .3), "opacity='.55'"); }   // un nodo
        return x;
      } }, 1.5)];
    }));
    var bv = G > 0 ? B1 : B0, sc = [P(.04, bv - G * .012, Z), P(.24, bv, Z), P(.33, bv + G * .03, Z + 2.2), P(.22, bv - G * .016, Z + .3)];   // la scheggia che si stacca dall'asse davanti
    s += poly([P(.04, bv - G * .012, Z), P(.24, bv, Z), P(.23, bv - G * .022, Z), P(.06, bv - G * .02, Z)], "#efd3a3") + poly(sc, lin("sh", [[0, "#f3dcb0"], [1, "#c99a62"]], 0, 0, 1, 1), bordo(L, .7));
    var ta = P(-.17, -.005, Z);   // l'alone della tazza sul legno
    s += ell(ta[0], ta[1], 3.6, 1.8, "none", "stroke='#5a3a1e' stroke-width='1' opacity='.38'") + ell(ta[0] + .5, ta[1] + .2, 3.1, 1.5, "none", "stroke='#5a3a1e' stroke-width='.45' opacity='.25'");
    return s;
  });

  // =========================================================
  //  TV A TUBO: la cassa beige col tubo dietro, lo schermo bombato, le manopole, le antenne a orecchie di coniglio
  //  (su una c'è la stagnola); da dietro le feritoie, l'etichetta e il filo
  // =========================================================
  def("tv_tubo", { tipo: "sopra", nome: "TV a tubo", fp: [1, 1], box: [-31, -62, 35, 20], dietro: true }, function () {
    var c = "#c9bfa8", girato = G < 0, s = ombra(3, 5, 30, 13);
    [[-.2, .17], [.2, .17], [-.2, .01], [.2, .01]].forEach(function (g) { s += blocco(g[0] - .03, g[0] + .03, g[1] - .025, g[1] + .025, 0, 2.2, "#4a4540", { senzaLuce: true }, 1); });   // i piedini
    var V = [[-.225, -.01, 4], [.225, -.01, 4], [.225, -.01, 28], [-.225, -.01, 28], [-.14, -.25, 7], [.14, -.25, 7], [.14, -.25, 23], [-.14, -.25, 23]];
    var Fc = [[0, 1, 2, 3], [4, 5, 6, 7], [3, 2, 6, 7], [0, 1, 5, 4], [0, 3, 7, 4], [1, 2, 6, 5]];
    function filo() {   // il filo della corrente che esce di dietro e si arriccia, con la spina
      var a = [P(.04, -.25, 8.5), P(.05, -.3, 2), P(.02, -.34, .6), P(-.06, -.38, .6), P(-.16, -.37, .6), P(-.2, -.33, .6)], d = "M" + q(a[0]) + " C" + q(a[1]) + " " + q(a[2]) + " " + q(a[3]) + " S" + q(a[4]) + " " + q(a[5]);
      return tratto(d, L, 2.8) + tratto(d, "#2b2b2b", 1.4) + blocco(-.25, -.2, -.35, -.31, 0, 2.6, "#e9e4d8", { senzaLuce: true }, .9) + tratto(linea(P(-.25, -.335, 1.5), P(-.28, -.335, 1.5)), "#b9b3a6", .8);
    }
    function tubo() {   // il tubo dietro: un tronco di piramide, con le feritoie sopra
      var x = solido(V, Fc, [lin("tps", [[0, chiaro(c, .28)], [1, chiaro(c, .06)]], 0, 0, 1, 1), lin("tpl", [[0, chiaro(c, .06)], [1, scuro(c, .08)]], 0, 0, 0, 1), lin("tpd", [[0, scuro(c, .2)], [1, scuro(c, .32)]], 0, 0, 0, 1)], 1.8), i, j;
      for (j = 0; j < 2; j++) for (i = 0; i < 6; i++) {   // le feritoie sul dorso
        var t = .3 + j * .32, a0 = -.15 + i * .06, f0 = [a0 * (1 - t) + a0 * .62 * t, -.01 - .24 * t, 28 - 5 * t], f2 = [f0[0], f0[1] - .05, f0[2] - 1];
        x += tratto(linea(P(f0[0], f0[1], f0[2]), P(f2[0], f2[1], f2[2])), "#5e564a", 1.1, "opacity='.75'");
      }
      if (girato) {   // la schiena: le feritoie, l'etichetta, la presa dell'antenna
        var d = "";
        for (i = 0; i < 7; i++) d += rett(2.2 + i * 1.9, 2.2, .9, 5.2, .45, "#5e564a", "opacity='.8'");
        d += rett(3, 9.2, 7.6, 4.6, .4, "#f4f1e8", bordo(L, .5)) + tratto("M3.8,10.6 L9.6,10.6 M3.8,11.9 L8.4,11.9", "#8a8274", .4) + rett(3.8, 12.7, 2.4, .7, 0, "#d9480f") +
          cer(13.4, 11.4, 1.6, lin("pa", CROMO, 0, 0, 1, 1), bordo(L, .6)) + cer(13.4, 11.4, .5, "#3a3a3a");
        x += faccia(P(.14, -.25, 23), 1, d);
      }
      return x;
    }
    function cassa() {   // la cassa davanti, con gli spigoli arrotondati
      var F = forma(0, .1, .25, .11, .11, 7), x = tondo(F, [[2.2, [.985, .96]], [5, 1], [27, 1], [29.6, [.975, .93]]], c, 2.2, { lt: .9, lo: .55 });
      if (!girato) {
        var d = "";
        d += rett(1.5, 1.4, 21.8, 19.6, 3.2, lin("cz", [[0, scuro(c, .1)], [1, scuro(c, .24)]], 0, 0, 1, 1), bordo(L, .9));   // la cornice dello schermo
        var sch = rettD(3, 3, 18.6, 16.4);
        d += rett(3, 3, 18.6, 16.4, 4.4, rad("sc", [[0, "#7d8f86"], [.45, "#4a5a53"], [1, "#1f2925"]], .38, .34, .78), bordo(L, 1));   // lo schermo spento, bombato
        d += dentro(sch, pth("M5,13 Q5.4,5.6 12.6,4.8 Q8,6.6 7.2,13.6 Z", "#ffffff", "opacity='.42'") + ell(17.2, 15.4, 2.2, 1, "#ffffff", "opacity='.16'"));   // il riflesso
        d += cer(26.4, 5.4, 2.5, rad("mp", [[0, "#a59a83"], [.7, "#7d725d"], [1, "#5b5242"]], .35, .3, .8), bordo(L, .9)) + tratto("M26.4,5.4 L26.4,3.2", "#ece6d6", .7) +
          cer(26.4, 11.2, 2.5, rad("mp", [[0, "#a59a83"], [.7, "#7d725d"], [1, "#5b5242"]], .35, .3, .8), bordo(L, .9)) + tratto("M26.4,11.2 L28.2,10", "#ece6d6", .7) +
          rett(24.6, 15.3, 3.6, 2.6, .6, "#6f6553", bordo(L, .7));   // le manopole e il tasto
        for (var i = 0; i < 4; i++) d += rett(24.2, 19.6 + i * 1.35, 4.6, .55, .25, "#5e564a", "opacity='.8'");   // l'altoparlante
        d += "<g " + gira(-32, 2.6, 2.4) + ">" + rett(-1, 1.2, 7.6, 2.6, .3, "#f2ead2", "opacity='.85' stroke='#bfb391' stroke-width='.4'") + "</g>";   // lo scotch sulla crepa
        d += tratto("M1.6,6.2 L3,3.6 L2.4,2.2", "#6f6553", .5, "opacity='.7'");
        x += faccia(P(-.25, .21, 28), 1, d);
      }
      return x;
    }
    function antenne() {   // la base e le due antenne, con le palline in cima; su quella di destra la pallina di stagnola
      var F = forma(0, .03, .06, .035, .035, 3), x = tondo(F, [[29.4, 1], [32.4, [.88, .88]]], "#4a4540", 1.3, { luce: .25, lt: .6 });
      var b1 = P(-.018, .03, 32), t1 = P(-.19, -.05, 51.5), b2 = P(.018, .03, 32), t2 = P(.21, .0, 49);
      function asta(a, b) { var d = linea(a, b); return tratto(d, L, 2.5) + tratto(d, "#aeb5ba", 1.1) + tratto(d, "#ffffff", .4, "opacity='.7' transform='translate(-.3 -.2)'"); }
      function pallina(t) { return cer(t[0], t[1], 1.6, rad("pl", [[0, "#ffffff"], [.5, "#b9c0c4"], [1, "#6b7378"]], .35, .3, .8), bordo(L, .7)); }
      function stagnola(t) {   // la pallina di stagnola accartocciata (per prendere meglio il segnale)
        var a = [], i, rr = rnd(9);
        for (i = 0; i < 16; i++) { var g = i / 16 * 6.2832, k = (i % 2 ? 2.5 : 3.6) + rr() * 1.1; a.push([t[0] + Math.cos(g) * k, t[1] + Math.sin(g) * k * .92]); }
        var o = poly(a, lin("sg", [[0, "#ffffff"], [.45, "#d3d8dc"], [1, "#858e94"]], 0, 0, 1, 1), bordo(L, .8));
        o += dentro(chiuso(a), poly([[t[0] - 3.6, t[1] - 1], [t[0] - .4, t[1] - 3.4], [t[0] + .6, t[1] - .2]], "#ffffff", "opacity='.85'") + poly([[t[0] + .6, t[1] - .2], [t[0] + 3.6, t[1] - 1.4], [t[0] + 2.6, t[1] + 2.4]], "#9aa3a9", "opacity='.6'") +
          poly([[t[0] - 2.8, t[1] + 1.2], [t[0] + .6, t[1] - .2], [t[0] - .4, t[1] + 3]], "#bfc6cb", "opacity='.7'") + cer(t[0] + 1.6, t[1] + 1, .6, "#ffffff"));
        return o + tratto("M" + q(t[0] - 2.4, t[1] + .4) + " L" + q(t[0] + .6, t[1] - .2) + " L" + q(t[0] + 2, t[1] - 2.2) + " M" + q(t[0] + .6, t[1] - .2) + " L" + q(t[0] + 1.6, t[1] + 2.2), "#6f787e", .45);
      }
      var l1 = asta(b1, t1) + pallina(t1), l2 = asta(b2, t2) + stagnola(t2);
      return x + (G > 0 ? l1 + l2 : l2 + l1);
    }
    return s + (girato ? cassa() + tubo() + filo() + antenne() : filo() + tubo() + cassa() + antenne());
  });

  // =========================================================
  //  SEDIA DI PLASTICA da giardino: tutta d'un pezzo, un po' ingiallita; lo schienale curvo con le fessure vere, la macchia
  // =========================================================
  def("sedia_plastica", { tipo: "piedi", nome: "Sedia di plastica", fp: [1, 1], box: [-32, -69, 40, 23], dietro: true, azione: "siedi", seduta: 27, piano: 27 }, function () {
    var c = "#ece9df", girato = G < 0, s = ombra(4, 6, 35, 15);
    function gamba(sa, sb) {   // una gamba: un canale di plastica che si allarga verso terra
      var t = P(sa * .16, sb * .148, 25.6), b = P(sa * .226, sb * .228, 0), dx = b[0] - t[0], dy = b[1] - t[1], l = Math.hypot(dx, dy), nx = -dy / l, ny = dx / l, w1 = 3.5, w2 = 2.5;
      var pp = [[t[0] + nx * w1, t[1] + ny * w1], [b[0] + nx * w2, b[1] + ny * w2], [b[0] - nx * w2, b[1] - ny * w2], [t[0] - nx * w1, t[1] - ny * w1]];
      return ell(b[0], b[1] + .4, 2.6, 1.2, scuro(c, .4)) + poly(pp, lin("gb", [[0, chiaro(c, .4)], [.45, c], [1, scuro(c, .24)]], pp[0][0], pp[0][1], pp[3][0], pp[3][1], true), bordo(L, 1.5)) +
        tratto(linea([t[0] - nx * .4, t[1] - ny * .4], [b[0] - nx * .3, b[1] - ny * .3]), scuro(c, .18), .9, "opacity='.7'");
    }
    function gambe() { var l = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(function (g) { return [vicino(g[0], g[1]), gamba(g[0], g[1])]; }); return ordina(l); }
    function seduta() {
      var F = forma(0, -.005, .215, .205, .2, 3.6), top = giro(F, 27.5, .985, 72), x = tondo(F, [[24.2, [.95, .94]], [25.8, 1], [27.5, .985]], c, 2.1, { lt: .9, lo: .5 });
      var m = P(0, -.03, 27.5), bu = P(0, .01, 27.5);
      x += dentro(chiuso(top), ell(m[0], m[1] - 1, 15, 6.5, rad("cv", [[0, scuro(c, .14), .5], [1, scuro(c, .14), 0]], .5, .5, .5)) + pth(chiuso(giro(F, 27.5, .86, 72)), "none", "stroke='#ffffff' stroke-width='1.1' opacity='.55'") +
        ell(bu[0], bu[1], 1.4, .7, "#5a5448") + (girato ? "" : ell(P(.1, .1, 27.5)[0], P(.1, .1, 27.5)[1], 3.2, 1.4, "#b3a88c", "opacity='.3'")) +
        tratto("M" + q(P(-.2, .08, 27.5)) + " L" + q(P(-.13, .07, 27.5)) + " L" + q(P(-.09, .1, 27.5)) + " L" + q(P(-.03, .09, 27.5)) + " M" + q(P(-.13, .07, 27.5)) + " L" + q(P(-.1, .03, 27.5)), "#6b6250", .6, "opacity='.8'"));   // la conca, il buchino per l'acqua, una macchia, la crepa
      return x;
    }
    function schienale() {   // lo schienale curvo: la superficie davanti e quella dietro (lo spessore), con tre fessure vere; il bordo arrotondato in cima
      var th = .04, near = girato ? th : 0, far = girato ? 0 : th, N = 14, k;
      function pt(sv, tv, d) { var a = sv * (.21 + .035 * tv), b = -.152 - .066 * (1 - sv * sv) - .056 * tv - d, z = 27.2 + (27.6 - 4.2 * sv * sv) * tv; return P(a, b, z); }
      function contorno(d) { var a = []; for (k = 0; k <= N; k++) a.push(pt(-1 + 2 * k / N, 0, d)); for (k = 1; k <= N; k++) a.push(pt(1, k / N, d)); for (k = N - 1; k >= 0; k--) a.push(pt(-1 + 2 * k / N, 1, d)); for (k = N - 1; k >= 1; k--) a.push(pt(-1, k / N, d)); return a; }
      function asola(t0, t1, s0, d) {
        var a = [], tm = (t0 + t1) / 2, hr = (t1 - t0) / 2, j, th2;
        for (j = 0; j <= 10; j++) a.push(pt(-s0 + 2 * s0 * j / 10, t0, d));
        for (j = 1; j < 8; j++) { th2 = j / 8 * Math.PI; a.push(pt(s0 + .07 * Math.sin(th2), tm - hr * Math.cos(th2), d)); }
        for (j = 10; j >= 0; j--) a.push(pt(-s0 + 2 * s0 * j / 10, t1, d));
        for (j = 1; j < 8; j++) { th2 = j / 8 * Math.PI; a.push(pt(-s0 - .07 * Math.sin(th2), tm + hr * Math.cos(th2), d)); }
        return a;
      }
      var fe = [[.35, .46, .55], [.52, .63, .6], [.69, .8, .55]];
      function lastra(d) { return chiuso(contorno(d)) + " " + fe.map(function (f) { return chiuso(asola(f[0], f[1], f[2], d)); }).join(" "); }
      var dn = lastra(near), bn = limiti(contorno(near)), x = "";
      x += pth(lastra(far), scuro(c, .27), "fill-rule='evenodd'") + pth(chiuso(contorno(far)), "none", bordo(L, 1.6));   // la faccia di là: si vede dallo spessore e dentro le fessure
      x += pth(dn, lin("sp", [[0, chiaro(c, .42)], [.55, c], [1, scuro(c, .14)]], bn[0], 0, bn[2], 0, true), "fill-rule='evenodd'");
      var sp = girato ? "" : ell(pt(.48, .2, 0)[0], pt(.48, .2, 0)[1], 3.8, 2.8, "#a89e84", "opacity='.42'") + ell(pt(.42, .16, 0)[0], pt(.42, .16, 0)[1], 1.6, 1.2, "#8f8468", "opacity='.3'");   // la macchia
      if (girato) for (k = 0; k < 5; k++) { var a1 = pt(-.7 + k * .33, .95, near), a2 = pt(-.72 + k * .33, .35 + (k % 2) * .1, near); sp += tratto(linea(a1, a2), "#9a927e", .7, "opacity='.25'"); }   // le righe della pioggia
      x += dentro(dn, sp + pth(chiuso(sposta(contorno(near), -1.4, -1.2)), "none", "stroke='#ffffff' stroke-width='1.2' opacity='.45'"), true);
      x += pth(chiuso(contorno(near)), "none", bordo(L, 1.6)) + fe.map(function (f) { return pth(chiuso(asola(f[0], f[1], f[2], near)), "none", bordo(scuro(c, .55), .8)); }).join("");
      var cima = []; for (k = 0; k <= 20; k++) cima.push(pt(-1.02 + 2.04 * k / 20, 1, th / 2));
      var dc = via(cima);
      return x + tratto(dc, L, 5) + tratto(dc, c, 3.2) + tratto(dc, "#ffffff", .9, "opacity='.75' transform='translate(-.4 -.7)'");
    }
    return s + gambe() + (girato ? seduta() + schienale() : schienale() + seduta());
  });

  // =========================================================
  //  PIANTA UN PO' SECCA nel vaso di coccio sbeccato: tre rametti stanchi, foglie secche (una ancora verde), due foglie cadute
  // =========================================================
  def("pianta_secca", { tipo: "sopra", nome: "Pianta un po' secca", fp: [1, 1], box: [-27, -47, 30, 16], dietro: true }, function () {
    var s = ombra(3, 4, 21, 9), r = rnd(83);
    function el(z, rr) { var c = P(0, 0, z); return { x: c[0], y: c[1], rx: rr * 70.71, ry: rr * 35.36 }; }
    function foglia(x, y, ang, l, w, col, curl) {   // una foglia secca accartocciata (curl = la punta che si arriccia)
      var d = "M0,0 C" + q(w, -l * .25) + " " + q(w * .8, -l * .78) + " " + q(curl ? w * .2 : 0, -l) + (curl ? " Q" + q(-w * .5, -l * .95) + " " + q(-w * .2, -l * .7) : "") + " C" + q(-w * .9, -l * .65) + " " + q(-w, -l * .2) + " 0,0 Z";
      return "<g transform='translate(" + f1(x) + " " + f1(y) + ") rotate(" + f1(ang) + ")'>" + pth(d, col, bordo(scuro(col, .5), .7)) + tratto("M0,-.5 L" + q(w * .1, -l * .78), scuro(col, .4), .5, "opacity='.7'") + "</g>";
    }
    function caduta(a, b, ang, col) { var p0 = P(a, b, 0); return "<g transform='translate(" + f1(p0[0]) + " " + f1(p0[1]) + ") scale(1 .55)'>" + foglia(0, 0, ang, 6.4, 2.4, col, true) + "</g>"; }   // una foglia caduta, distesa a terra
    var cadute = [[-.17, -.06, 70, "#a3833c"], [.14, .11, -100, "#b5a24e"]], dietroF = "", davantiF = "";
    cadute.forEach(function (f) { var x = caduta(f[0], f[1], f[2], f[3]); if (vicino(f[0], f[1]) < 0) dietroF += x; else davantiF += x; });
    s += dietroF;
    // il vaso di coccio
    var su = el(11.5, .098), giu = el(.5, .07);
    var sil = "M" + q(su.x - su.rx, su.y) + " L" + q(giu.x - giu.rx, giu.y) + " A" + f1(giu.rx) + "," + f1(giu.ry) + " 0 0,0 " + q(giu.x + giu.rx, giu.y) + " L" + q(su.x + su.rx, su.y) + " A" + f1(su.rx) + "," + f1(su.ry) + " 0 0,0 " + q(su.x - su.rx, su.y) + " Z";
    var crepa = "", ac = .6;   // la crepa sta sul vaso a un angolo fisso: si vede solo se è dalla parte di chi guarda
    var cp = P(Math.cos(ac) * .085, Math.sin(ac) * .085, 8);
    if (vicino(Math.cos(ac), Math.sin(ac)) > .2) crepa = tratto("M" + q(cp[0], cp[1] - 4) + " L" + q(cp[0] + 1, cp[1] - 1.6) + " L" + q(cp[0] - .4, cp[1]) + " L" + q(cp[0] + .8, cp[1] + 3), "#6e2a14", .7, "opacity='.85'");
    s += pth(sil, lin("vs", [[0, "#f6a77a"], [.38, "#e2683f"], [.8, "#b5482a"], [1, "#933a20"]], su.x - su.rx, 0, su.x + su.rx, 0, true)) +
      dentro(sil, ell(su.x - su.rx * .58, (su.y + giu.y) / 2, 1.8, 4.6, "#ffffff", "opacity='.28'") + crepa + ell(giu.x, giu.y, giu.rx * 1.2, 3, "#5a2a14", "opacity='.25'")) + pth(sil, "none", bordo(L, 1.7));
    var bo = el(14.6, .118), bo2 = el(10.8, .116), te = el(13.8, .089), bf = lin("bf", [[0, "#ee9466"], [.45, "#cf5532"], [1, "#8c341c"]], 0, 0, 1, 0);
    s += rett(bo.x - bo.rx, bo.y, bo.rx * 2, bo2.y - bo.y, 0, bf) + ell(bo2.x, bo2.y, bo2.rx, bo2.ry, bf) +   // il bordo grosso del vaso
      pth("M" + q(bo.x - bo.rx, bo.y) + " L" + q(bo2.x - bo2.rx, bo2.y) + " A" + f1(bo2.rx) + "," + f1(bo2.ry) + " 0 0,0 " + q(bo2.x + bo2.rx, bo2.y) + " L" + q(bo.x + bo.rx, bo.y), "none", bordo(L, 1.3)) +
      ell(bo.x, bo.y, bo.rx, bo.ry, lin("bs", [[0, "#f9b08a"], [1, "#d8693f"]], 0, 0, 1, 1), bordo(L, 1.2)) +
      ell(te.x, te.y, te.rx, te.ry, rad("te", [[0, "#7a5a3c"], [1, "#4a3020"]], .45, .45, .65), bordo("#5a2a14", .7));
    s += tratto("M" + q(te.x - 4, te.y - .4) + " L" + q(te.x - 1, te.y + .5) + " L" + q(te.x + 1.4, te.y - .6), "#2e1d10", .6, "opacity='.8'") + cer(te.x + 3.4, te.y + .8, .7, "#9a8a7a") + cer(te.x - 2.4, te.y + 1.6, .55, "#8a7a6a");   // la terra secca crepata e due sassolini
    var sb = .9, sbc = P(Math.cos(sb + 2.1) * .112, Math.sin(sb + 2.1) * .112, 14.6), vis = vicino(Math.cos(sb + 2.1), Math.sin(sb + 2.1));   // la sbeccatura sul bordo
    var sbS = poly([[sbc[0] - 2.6, sbc[1] - .6], [sbc[0] + 2.2, sbc[1] - .3], [sbc[0] + .6, sbc[1] + (vis > 0 ? 2.6 : 1.4)], [sbc[0] - 1, sbc[1] + (vis > 0 ? 2.2 : 1.2)]], "#e9b38f", bordo(L, .7));
    if (vis <= 0) s += sbS;
    // i rametti stanchi: in 3D, così da dietro si girano davvero
    // ogni foglia: [dove sul rametto, lunghezza, colore, punta arricciata, quanto è girata]; una sola è ancora verde
    var R = [
      { p: [[-.01, 0, 13.8], [-.06, .01, 30], [-.18, .06, 18]], f: [[.32, 5.4, "#a3833c", 0, -58], [.6, 6, "#a08a40", 1, 150], [1, 6.4, "#8f6f30", 1, 10]] },
      { p: [[0, -.01, 13.8], [.0, -.03, 32], [.07, -.05, 38]], f: [[.28, 5.4, "#b5a24e", 1, 62], [.5, 5.8, "#a08a40", 0, -66], [.72, 5.2, "#9c9a46", 1, 58], [.98, 5.2, "#7da34a", 0, -8]] },
      { p: [[.01, .01, 13.8], [.09, .03, 27], [.17, .1, 15]], f: [[.38, 5.4, "#9c9a46", 0, 52], [.68, 5.8, "#b5a24e", 1, -150], [1, 6.2, "#a3833c", 1, 6]] },
      { p: [[0, .02, 13.8], [.01, .03, 18], [.035, .055, 21.5]], f: [] },
      { p: [[-.005, -.005, 13.8], [-.03, -.06, 22], [-.075, -.1, 24.5]], f: [[1, 5, "#a08a40", 1, 0]] }
    ];
    function rametto(m) {
      var a = m.p.map(function (x) { return P(x[0], x[1], x[2]); }), d = "M" + q(a[0]) + " Q" + q(a[1]) + " " + q(a[2]), o = tratto(d, scuro("#8a7a3a", .5), 2.3) + tratto(d, "#8f7f3c", 1.1);
      m.f.forEach(function (f) {
        var t = f[0], u = 1 - t, x = u * u * a[0][0] + 2 * u * t * a[1][0] + t * t * a[2][0], y = u * u * a[0][1] + 2 * u * t * a[1][1] + t * t * a[2][1];
        var tx = 2 * u * (a[1][0] - a[0][0]) + 2 * t * (a[2][0] - a[1][0]), ty = 2 * u * (a[1][1] - a[0][1]) + 2 * t * (a[2][1] - a[1][1]), ang = Math.atan2(ty, tx) * 57.3 + 90 + f[4] * G;
        o += foglia(x, y, ang, f[1], f[1] * .42, f[2], f[3]);
      });
      if (!m.f.length) o += ell(a[2][0], a[2][1], .9, .6, "#6b5a2a") + tratto("M" + q(a[2][0], a[2][1]) + " l1.2,-1.2", "#8f7f3c", .7);   // il rametto spezzato
      return o;
    }
    var bi = el(14.6, .089), anello ="M" + q(bo.x - bo.rx, bo.y) + " A" + f1(bo.rx) + "," + f1(bo.ry) + " 0 0,0 " + q(bo.x + bo.rx, bo.y) + " L" + q(bi.x + bi.rx, bi.y) + " A" + f1(bi.rx) + "," + f1(bi.ry) + " 0 0,1 " + q(bi.x - bi.rx, bi.y) + " Z";
    var lr = R.map(function (m) { var e = m.p[2]; return [vicino(e[0], e[1]), rametto(m)]; }).sort(function (x, y) { return x[0] - y[0]; }), passato = false;
    lr.forEach(function (x) { if (!passato && x[0] > .05) { s += pth(anello, lin("bs", [[0, "#f7a983"], [1, "#d0603a"]], 0, 0, 1, 1), bordo(L, 1.2)) + (vis > 0 ? sbS : ""); passato = true; } s += x[1]; });   // davanti ai rametti di dietro passa il bordo del vaso
    if (!passato && vis > 0) s += sbS;
    return s + davantiF;
  });

  // =========================================================
  //  FRIGO AMMACCATO: il frigo vecchio tondeggiante color crema, il freezer sopra, le maniglie, l'ammaccatura,
  //  la ruggine, le calamite col biglietto; da dietro la serpentina nera, il motore e il filo
  // =========================================================
  def("frigo_ammaccato", { tipo: "piedi", nome: "Frigo ammaccato", fp: [1, 1], box: [-41, -113, 49, 29], dietro: true, piano: 92 }, function () {
    var c = "#ece4c9", girato = G < 0, r = rnd(19), s = ombra(5, 8, 42, 19);
    [[-.25, -.27], [.25, -.27], [-.25, .21], [.25, .21]].forEach(function (g) { s += blocco(g[0] - .035, g[0] + .035, g[1] - .035, g[1] + .035, 0, 3.2, "#4a4540", { senzaLuce: true }, 1); });   // i piedini
    var F = forma(0, -.03, .31, .3, .3, 8);
    s += tondo(F, [[3, [.985, .98]], [6, 1], [85, 1], [89.5, [.97, .95]], [92.5, [.9, .84]]], c, 2.4, { lt: 1, lo: .5 });
    var W = .62 * 61, H = 82;
    function maniglia(x, y, h) { return rett(x + 1, y + 1.2, 2.8, h, 1.4, "#000", "opacity='.18'") + rett(x, y, 2.8, h, 1.4, lin("mn", [[0, "#fbf8ee"], [.45, "#d8d0b6"], [1, "#9a917a"]], 0, 0, 1, 0), bordo(L, .9)) + rett(x + .6, y + 1.2, .7, h - 2.4, .35, "#ffffff", "opacity='.7'"); }
    function ruggine(x, y, k, rr) {
      var o = pth(liscio(ovale(x, y, 3.4 * k, 2.6 * k, rr, .7, 9)), "#b0703a", "opacity='.55'"), i;
      for (i = 0; i < 7; i++) o += cer(x + (rr() - .5) * 6 * k, y + (rr() - .5) * 4.6 * k, .35 + rr() * .5, "#7a3d18", "opacity='.6'");
      return o + tratto("M" + q(x + .6, y + 2 * k) + " Q" + q(x + 1.2, y + 6 * k) + " " + q(x + .4, y + 9 * k), "#a0602e", .8, "opacity='.35'");
    }
    if (!girato) {
      var d = "";
      d += tratto("M1.5,27.6 L" + f1(W - 1.5) + ",27.6", scuro(c, .5), 1.3) + tratto("M1.5,28.9 L" + f1(W - 1.5) + ",28.9", "#ffffff", .7, "opacity='.7'");   // la fessura tra freezer e frigo
      d += tratto("M1.4,1 L1.4,76", scuro(c, .2), .7, "opacity='.6'");
      d += rett(4, 4.6, 10.5, 3.2, 1.6, lin("st", CROMO, 0, 0, 1, 1), bordo(L, .7)) + rett(5.6, 5.6, 7.2, .5, .25, "#7d8991");   // la targhetta cromata
      d += maniglia(W - 6.8, 8, 15) + maniglia(W - 6.8, 35, 22);
      // l'ammaccatura: dentro è in ombra in alto a sinistra e presa dalla luce in basso a destra
      // (sfumata, senza contorno: deve sembrare una conca nella lamiera, non un buco)
      var am = liscio([[4.4, 55.4], [9.6, 52], [16, 53.8], [18, 59.8], [15, 65.2], [8.4, 65.8], [4.4, 61.6]]);
      d += dentro(am, ell(9.4, 57.2, 9, 7, rad("amd", [[0, scuro(c, .34), .7], [.55, scuro(c, .22), .35], [1, scuro(c, .2), 0]], .5, .5, .5)) +
        pth(liscio([[9, 66.4], [15.4, 61.4], [18.6, 61.8], [16.4, 66.6], [11, 68]]), "#ffffff", "opacity='.75'"));
      d += tratto("M5,61.6 Q4.6,54.6 10.4,52.6 Q14.4,51.6 16.6,54.2", scuro(c, .45), .7, "opacity='.45'") + tratto("M17.8,59 Q17.6,64.4 12.6,66", "#ffffff", 1.1, "opacity='.85'") +
        tratto("M7.8,57.6 Q10.4,56.4 12.6,58.4 M11,61.4 Q13,60.6 14.4,62", scuro(c, .3), .45, "opacity='.5'");   // le pieghine della lamiera
      d += ruggine(W - 8.5, 71.5, 1, rnd(3)) + ruggine(3.6, 74.6, .6, rnd(7));
      // il biglietto della spesa con la calamita rossa, la calamita gialla, la fetta di pizza
      d += "<g " + gira(-6, 10, 42) + ">" + rett(4.6, 34.2, 11.4, 14.4, .4, "#000", "opacity='.15'") + rett(4, 33.4, 11.4, 14.4, .4, "#fdfbf4", bordo(L, .6)) +
        tratto("M5.8,37.6 L13.4,37.6 M5.8,39.8 L12,39.8 M5.8,42 L13.8,42 M5.8,44.2 L10.6,44.2", "#4a6fa5", .5, "opacity='.8'") + pth("M15.4,44.6 L15.4,47.8 L12.2,47.8 Z", "#e6e0cf", bordo(L, .4)) + "</g>";
      d += "<g " + gira(-10, 9.6, 33.6) + ">" + rett(7.2, 31.2, 5.2, 5, 1, lin("cr", [[0, "#ff8a8a"], [1, "#c92a2a"]], 0, 0, 1, 1), bordo(L, .8)) + rett(8, 32, 1.6, 1.2, .5, "#ffffff", "opacity='.6'") + "</g>";
      d += cer(21.2, 34.6, 2.7, rad("cg", [[0, "#fff3a3"], [.6, "#fcc419"], [1, "#d39b06"]], .35, .3, .8), bordo(L, .8)) + cer(20.4, 34, .35, L) + cer(22, 34, .35, L) + tratto("M19.9,35.4 Q21.2,36.6 22.5,35.4", L, .45);   // la calamita sorridente
      d += "<g " + gira(14, 21, 45) + ">" + pth("M17.6,41.4 L24.6,41.4 L21.1,49.6 Z", "#f7d26a", bordo(L, .8)) + rett(17.2, 40.4, 7.8, 1.8, .9, "#c98a3a", bordo(L, .6)) + cer(20.2, 43.4, .8, "#d6336c") + cer(22.2, 44, .7, "#d6336c") + cer(21, 46, .6, "#d6336c") + "</g>";   // la fetta di pizza
      for (var i = 0; i < 11; i++) d += rett(3 + i * 2.9, 77.4, 1.1, 3.6, .4, "#3e3a33", "opacity='.85'");   // la griglia in basso
      s += faccia(P(-.31, .27, 85), 1, d);
      var fi = "", pe;   // l'adesivo a margherita, stinto, con un petalo che si stacca
      for (pe = 0; pe < 8; pe++) { var ga = pe * 45, ex = 23 + Math.cos(ga / 57.3) * 3.1, ey = 26 + Math.sin(ga / 57.3) * 3.1; if (pe !== 7) fi += ell(ex, ey, 2.1, 1.25, "#fbfaf2", "stroke='" + scuro(c, .35) + "' stroke-width='.4' " + gira(ga, ex, ey)); }
      fi += pth("M25.4,23.4 L28.6,21.6 L27.4,24.8 Z", "#ffffff", "stroke='" + scuro(c, .35) + "' stroke-width='.4'") + cer(23, 26, 1.7, "#f2c94c", "stroke='#b8901f' stroke-width='.4'");
      fi = "<g opacity='.85'>" + fi + "</g>" + ruggine(4, 76, .55, rnd(13)) + tratto("M8,44 L22,40", scuro(c, .25), .5, "opacity='.4'") +
        pth(liscio([[9, 60], [13, 58.6], [15, 61.6], [12, 63.6], [8.6, 62.6]]), scuro(c, .12), "opacity='.8'") + tratto("M9.4,59.6 Q12,58.4 14.4,60.4", scuro(c, .35), .6, "opacity='.6'") + tratto("M10,63 Q13,62.8 14.6,61.4", "#ffffff", .7, "opacity='.8'");   // e una botta anche sul fianco
      s += faccia(P(.31, .27, 85), -1, fi);
    } else {
      var e = "", rr = rnd(4), k;
      e += rett(4, 2, 9.4, 3.8, .5, lin("tg2", CROMO, 0, 0, 1, 1), bordo(L, .5)) + tratto("M5,3.4 L12,3.4 M5,4.6 L10,4.6", "#5b6870", .35);   // la targhetta coi dati
      var ser = "M8," + 8;   // la serpentina: il tubo nero che va avanti e indietro, coi fili di ferro dritti
      for (k = 0; k < 11; k++) { var y = 8 + k * 5.4, dx = k % 2 ? 8 : W - 8; ser += " L" + f1(dx) + "," + f1(y) + " A2.7,2.7 0 0," + (k % 2 ? 0 : 1) + " " + f1(dx) + "," + f1(y + 5.4); }
      e += tratto(ser, "#000", 2.6, "opacity='.2' transform='translate(1.2 1.6)'");
      for (k = 0; k < 11; k++) e += tratto("M" + f1(8.6 + k * (W - 17.2) / 10) + ",6.4 L" + f1(8.6 + k * (W - 17.2) / 10) + ",68.6", "#2a2d30", .55);
      e += tratto(ser, L, 2.6) + tratto(ser, "#2e3236", 1.5) + tratto(ser, "#80868c", .45, "opacity='.7' transform='translate(-.3 -.4)'");
      e += tratto("M" + f1(W - 5) + ",67.4 Q" + f1(W - 4) + ",73 " + f1(W / 2 + 6) + ",74", "#c77b3b", 1.2) + ell(W / 2, 75.6, 8.6, 5.4, rad("mo", [[0, "#6b7075"], [.5, "#2b2e31"], [1, "#121416"]], .38, .32, .8), bordo(L, 1)) + rett(W / 2 - 10, 79.6, 20, 1.6, .5, "#3a3a3a", bordo(L, .6)) + ell(W / 2 - 3, 73.6, 2.6, 1.2, "#ffffff", "opacity='.3'");   // il motore
      for (k = 0; k < 5; k++) e += cer(6 + rr() * 26, 10 + rr() * 56, .9 + rr(), "#8a8a8a", "opacity='.25'");   // la polvere
      s += faccia(P(.31, -.33, 85), 1, e);
      s += faccia(P(-.31, -.33, 85), -1, tratto("M6,30 L26,24", scuro(c, .3), .55, "opacity='.5'") + ruggine(30, 75, .6, rnd(23)));
      var fa = [P(-.18, -.33, 6), P(-.2, -.4, 1), P(-.26, -.44, .6), P(-.33, -.5, .6)], df = "M" + q(fa[0]) + " C" + q(fa[1]) + " " + q(fa[2]) + " " + q(fa[3]);
      s += tratto(df, L, 2.8) + tratto(df, "#2b2b2b", 1.4) + blocco(-.37, -.32, -.53, -.48, 0, 2.6, "#efeae0", { senzaLuce: true }, .9);   // il filo con la spina
      var pv = P(.08, -.46, 0);   // un batuffolo di polvere dietro il frigo
      s += pth(riccio(pv[0], pv[1], 3.8, 1.9, 10, .38, .3), "#b7b2a9", bordo("#77726a", .6)) + ell(pv[0] - 1, pv[1] - .6, 1.8, .7, "#d6d2ca") + tratto("M" + q(pv[0] + 3.4, pv[1] + .2) + " q1.6,.8 3,-.3 M" + q(pv[0] - 3.6, pv[1]) + " q-1.2,-.9 -2.6,-.4", "#8a857d", .45);
    }
    return s;
  });

  // =========================================================
  //  FORNELLO VECCHIO: il fornelletto di smalto crema coi due fuochi, sopra un mobiletto di legno con un'anta storta;
  //  una manopola manca, lo smalto è scheggiato; dietro il tubo del gas arancione
  // =========================================================
  def("fornello_vecchio", { tipo: "piedi", nome: "Fornello vecchio", fp: [1, 1], box: [-41, -69, 49, 28], dietro: true, piano: 51 }, function () {
    var legno = "#9b7650", sm = "#d9cfb6", girato = G < 0, s = ombra(5, 8, 42, 18);
    function tubo() {   // il tubo del gas arancione, con la fascetta
      var a = [P(.2, -.29, 40.5), P(.2, -.37, 38), P(.14, -.35, 22), P(.14, -.34, 9), P(.13, -.42, .8), P(-.04, -.45, .8)], d = "M" + q(a[0]) + " C" + q(a[1]) + " " + q(a[2]) + " " + q(a[3]) + " S" + q(a[4]) + " " + q(a[5]);
      var fc = P(.208, -.315, 40.2);
      return tratto(d, L, 4.2) + tratto(d, "#ef8a35", 2.6) + tratto(d, "#ffc58a", .8, "opacity='.75' transform='translate(-.5 -.4)'") + cer(fc[0], fc[1], 2.2, lin("fs", CROMO, 0, 0, 1, 1), bordo(L, .7));
    }
    function mobiletto() {
      return blocco(-.29, .29, -.27, .25, 0, 33, legno, {
        davanti: function (W, H) {   // le due ante: quella di destra storta, si vede il buio dietro
          var o = rett(0, H - 2.6, W, 2.6, 0, scuro(legno, .5)), w2 = W / 2 - 1.8;
          o += pannello(legno, w2, H - 4.4, [1.2, 1.4]) + venature(1.6, 2, w2 - 1, H - 6, legno, rnd(2), 4, true) + cer(w2 - 1.4, 12, 1.1, "#3b2b22") + cer(w2 - 1.7, 11.7, .4, "#a08060");
          o += pth("M" + q(W / 2 + .6, 1.4) + " L" + q(W - 1.2, 1.4) + " L" + q(W - 1.2, H - 3) + " L" + q(W / 2 + .6, H - 3) + " Z", "#24170c");   // il buio dietro l'anta che non chiude
          o += "<g " + gira(4.5, W - 1.2, 1.4) + ">" + pannello(legno, w2, H - 4.4, [W / 2 + .6, 1.4]) + venature(W / 2 + 1, 2, w2 - 1, H - 6, legno, rnd(6), 4, true) + cer(W / 2 + 2.6, 12, 1.1, "#3b2b22") + cer(W / 2 + 2.3, 11.7, .4, "#a08060") + "</g>";
          return o + ell(9, 4.4, 4, 2, "#2b1a0c", "opacity='.25'");   // la bruciacchiatura
        },
        fianco: function (W, H) { return venature(0, 0, W, H - 2.6, legno, rnd(12), 5) + tratto("M" + f1(W * .5) + ",0 L" + f1(W * .5) + "," + f1(H - 2.6), scuro(legno, .35), .6, "opacity='.6'") + rett(0, H - 2.6, W, 2.6, 0, scuro(legno, .5)); },
        dietro: function (W, H) { return rett(0, 0, W, H, 0, "#b08a62") + [[2, 2], [W - 2, 2], [2, H - 2], [W - 2, H - 2], [W / 2, 2], [W / 2, H - 2]].map(function (v) { return cer(v[0], v[1], .55, "#3b2b22"); }).join("") + ell(W * .72, 6, 3, 2.2, "#24170c", bordo(L, .6)); }
      }, 2.2);
    }
    function fornello() {
      var x = tondo(forma(0, -.01, .31, .28, .28, 10), [[33, 1], [46.5, 1], [48.5, [.985, .97]]], sm, 2.2, { lt: 1, lo: .6 });
      if (!girato) {
        var d = rett(1, 1, 35.8, 1.3, .6, lin("cs", CROMO, 0, 0, 0, 1), bordo(L, .5));   // il bordino cromato
        [5.8, 14.4, 23.4, 32].forEach(function (k, i) {
          if (i === 2) d += cer(k, 7.6, 2.6, "none", "stroke='#7d725d' stroke-width='.7' stroke-dasharray='1.2 1'") + cer(k, 7.6, 1, "#9ca8b0", bordo(L, .5)) + rett(k - .3, 7.2, .6, .8, 0, "#4a5560");   // la manopola che manca: resta il perno
          else d += cer(k + .4, 8.1, 2.6, "#000", "opacity='.2'") + cer(k, 7.6, 2.6, rad("mf", [[0, "#6b6b6b"], [.55, "#2b2b2b"], [1, "#111111"]], .38, .32, .8), bordo(L, .8)) + tratto("M" + q(k, 7.6) + " L" + q(k + (i % 2 ? 1.4 : -.6), 5.4), "#f1ebdc", .7);
        });
        d += tratto("M10.6,1 Q11,5 10.2,9.6", "#8a6a3a", 1, "opacity='.3'") + pth(liscio([[33.6, 11.4], [35.6, 10.8], [36.2, 12.6], [34.2, 13]]), "#1d1d1d", bordo(L, .4));   // la colatura e la scheggiatura dello smalto
        x += faccia(P(-.31, .27, 46.5), 1, d);
      } else {
        x += faccia(P(.31, -.29, 46.5), 1, rett(4.6, 4.4, 4.4, 3.6, 1, lin("ot", OTTONE, 0, 0, 1, 1), bordo(L, .7)) + rett(20, 3, 9, 5, .4, "#efe9da", bordo(L, .5)) + tratto("M21,4.6 L27.6,4.6 M21,6 L26,6", "#8a8274", .4));   // il bocchettone d'ottone e l'etichetta
      }
      return x;
    }
    function fuoco(a) {   // un fuoco: l'unto tutt'intorno, la coppa, lo spartifiamma nero e le quattro razze della griglia
      var c0 = P(a, -.01, 48.5), o = ell(c0[0], c0[1] + .3, 10.6, 5.3, rad("un", [[0, "#6b4a2a", .6], [.62, "#6b4a2a", .42], [1, "#6b4a2a", 0]], .5, .5, .5));
      var gc = P(a + .07, .1, 48.5); o += ell(gc[0], gc[1], 1.8, .8, "#7a5530", "opacity='.45'") + ell(gc[0] + 2.6, gc[1] + .6, .9, .45, "#7a5530", "opacity='.4'");   // le gocce d'unto
      o += ell(c0[0], c0[1] + .3, 6.4, 3.2, "#2b2b2b", bordo(L, .9)) + ell(c0[0], c0[1] - .5, 4.6, 2.3, "#141414") + ell(c0[0], c0[1] - 1.3, 4.4, 2.2, rad("cp", [[0, "#6a6a6a"], [.55, "#2a2a2a"], [1, "#141414"]], .4, .35, .7), bordo(L, .8)) + ell(c0[0] - .2, c0[1] - 1.4, 1.5, .75, "#8a8a8a");
      var razze = [45, 135, 225, 315].map(function (g) {
        var cg = Math.cos(g / 57.3), sg = Math.sin(g / 57.3), d = "M" + q(P(a + .052 * cg, -.01 + .052 * sg, 51)) + " L" + q(P(a + .118 * cg, -.01 + .118 * sg, 51)) + " L" + q(P(a + .118 * cg, -.01 + .118 * sg, 48.5));
        return [vicino(cg, sg), tratto(d, L, 3) + tratto(d, "#333333", 1.5) + tratto(d, "#8a8a8a", .45, "opacity='.7' transform='translate(-.3 -.3)'")];
      });
      return razze.filter(function (x) { return x[0] < 0; }).map(function (x) { return x[1]; }).join("") + o + razze.filter(function (x) { return x[0] >= 0; }).map(function (x) { return x[1]; }).join("");
    }
    var fuochi = ordina([[vicino(-.145, 0), fuoco(-.145)], [vicino(.145, 0), fuoco(.145)]]);
    return s + (girato ? mobiletto() + fornello() + tubo() + fuochi : tubo() + mobiletto() + fornello() + fuochi);
  });

  // =========================================================
  //  DA PARETE (62 × 200, di fronte): la lampadina appesa al filo e il quadretto storto
  // =========================================================
  def("lampadina", { tipo: "parete", nome: "Lampadina appesa", w: 62, h: 200 }, function () {
    var x = 31, yS = 60, yB = 72, s = "", y;
    s += tratto("M" + (x + 2.6) + ",0 L" + (x + 3.2) + "," + (yS + 2), "#000", 2, "opacity='.1'") + rett(x - 1.4, yS + 3, 9.6, 12, 2, "#000", "opacity='.1'") + ell(x + 3.6, yB + 16, 9, 10, "#000", "opacity='.12'");   // l'ombra sul muro
    s += tratto("M" + x + ",0 L" + x + "," + (yS + 1), L, 3.4) + tratto("M" + x + ",0 L" + x + "," + (yS + 1), "#5e4a3c", 1.9);   // il filo attorcigliato
    for (y = 1.2; y < yS - 1; y += 2.2) s += tratto("M" + q(x - .9, y) + " L" + q(x + .9, y + 1.4), "#9a826e", .7);
    s += rett(x - 2.7, 26, 5.4, 5.6, 1.2, lin("ni", [[0, "#55555e"], [.5, "#26262b"], [1, "#151518"]], 0, 0, 1, 0), bordo(L, .8)) + tratto("M" + q(x - 1.8, 27.2) + " L" + q(x - 1.8, 30.4), "#ffffff", .6, "opacity='.45'") +
      pth("M" + q(x + 2.6, 29.6) + " l2.8,1.4 l-.3,2 l-2.5,-1.2 Z", "#2a2a30", bordo(L, .6));   // il nastro isolante, con la codina che si stacca
    s += rett(x - 3, yS - 2.4, 6, 3, 1, "#3a2c22", bordo(L, .8)) + rett(x - 4.8, yS, 9.6, 10.4, 2, lin("pl", [[0, "#6a5444"], [.4, "#3e2f25"], [1, "#1f1712"]], 0, 0, 1, 0), bordo(L, 1.1)) +
      tratto("M" + q(x - 4.6, yS + 6.6) + " L" + q(x + 4.6, yS + 6.6), "#140e0a", .8) + rett(x - 3.5, yS + 1.4, 1.2, 7.6, .6, "#ffffff", "opacity='.25'");   // il portalampada di bachelite
    s += rett(x - 3.7, yS + 10, 7.4, 3.2, .8, lin("av", CROMO, 0, 0, 1, 0), bordo(L, .7)) + tratto("M" + q(x - 3.4, yS + 11.2) + " L" + q(x + 3.4, yS + 11.8) + " M" + q(x - 3.4, yS + 12.4) + " L" + q(x + 3.4, yS + 13), "#6f7c85", .45);   // l'attacco a vite
    var g = "M" + q(x - 3.6, yB + 1) + " C" + q(x - 3.8, yB + 5) + " " + q(x - 9, yB + 7) + " " + q(x - 9, yB + 14) + " A9,9 0 1,0 " + q(x + 9, yB + 14) + " C" + q(x + 9, yB + 7) + " " + q(x + 3.8, yB + 5) + " " + q(x + 3.6, yB + 1) + " Z";
    s += pth(g, rad("vb", [[0, "#ffffff"], [.55, "#f6f2e6"], [1, "#d6cfbb"]], .38, .38, .72), bordo(L, 1.2) + " fill-opacity='.96'");
    s += dentro(g, ell(x, yB + 6.5, 4.6, 3, "#8a8478", "opacity='.14'") +   // il vetro un po' annerito in cima (è vecchia)
      tratto("M" + q(x, yB + 1.5) + " L" + q(x, yB + 9), "#d9d2c2", 1.4, "opacity='.8'") + tratto("M" + q(x - .8, yB + 3) + " L" + q(x - 2.8, yB + 13) + " M" + q(x + .8, yB + 3) + " L" + q(x + 2.8, yB + 13), "#8f8a80", .5) +
      tratto("M" + q(x - 2.8, yB + 13) + " l.7,-1 l.7,1 l.7,-1 l.7,1 l.7,-1 l.7,1 l.7,-1 l.7,1", "#7a5a3a", .6) +   // il filamento
      tratto("M" + q(x - 6.4, yB + 15.5) + " Q" + q(x - 6.6, yB + 9.6) + " " + q(x - 3, yB + 8.6), "#ffffff", 1.7, "opacity='.9'") + cer(x - 6, yB + 18.4, .8, "#ffffff", "opacity='.8'"));
    return s;
  });

  def("quadro_storto", { tipo: "parete", nome: "Quadretto storto", w: 62, h: 200 }, function () {
    var x0 = 12, y0 = 70, W = 38, H = 31, cx = 31, ch = 60.5, s = "", g = "";   // ch = dove sta il chiodo
    g += tratto("M" + q(cx, ch) + " L" + q(x0 + 6, y0 + 3) + " M" + q(cx, ch) + " L" + q(x0 + W - 6, y0 + 3), "#5e5e5e", .8);   // il filo dietro
    g += rett(x0 + 2.6, y0 + 3.6, W, H, 1.6, "#000", "opacity='.16'");   // l'ombra sul muro
    g += rett(x0, y0, W, H, 1.6, lin("cq", [[0, "#b98454"], [.45, "#8a5a32"], [1, "#5e3a1e"]], 0, 0, 1, 1), bordo(L, 1.8));   // la cornice di legno sottile
    g += tratto("M" + q(x0 + 1.4, y0 + H - 2) + " L" + q(x0 + 1.4, y0 + 1.4) + " L" + q(x0 + W - 2, y0 + 1.4), "#d9a878", .8, "opacity='.75'") + tratto("M" + q(x0 + 4.4, y0 + H - 4.4) + " L" + q(x0 + W - 4.4, y0 + H - 4.4) + " L" + q(x0 + W - 4.4, y0 + 4.4), "#c98f5a", .7, "opacity='.6'");
    [[x0, y0], [x0 + W, y0], [x0, y0 + H], [x0 + W, y0 + H]].forEach(function (v, i) { var sx = i % 2 ? -1 : 1, sy = i < 2 ? 1 : -1; g += tratto("M" + q(v[0] + sx * .6, v[1] + sy * .6) + " L" + q(v[0] + sx * 4, v[1] + sy * 4), "#4a2c14", .5, "opacity='.7'"); });   // le giunture agli angoli
    var ix = x0 + 4, iy = y0 + 4, iw = W - 8, ih = H - 8, dd = rettD(ix, iy, iw, ih), qd = "";
    qd += rett(ix, iy, iw, ih, 0, lin("ci", [[0, "#bfd3dc"], [1, "#e6dcc0"]], 0, 0, 0, 1));   // il paesaggio sbiadito: il cielo, il sole, le colline, la casetta, l'alberello
    qd += cer(ix + 21, iy + 6, 3.4, "#f0d58a", "opacity='.85'") + cer(ix + 21, iy + 6, 5.2, "#f0d58a", "opacity='.25'");
    qd += pth("M" + q(ix - 1, iy + 14) + " Q" + q(ix + 9, iy + 8) + " " + q(ix + 18, iy + 13) + " Q" + q(ix + 25, iy + 10) + " " + q(ix + iw + 1, iy + 13) + " L" + q(ix + iw + 1, iy + ih + 1) + " L" + q(ix - 1, iy + ih + 1) + " Z", "#93a77a", "opacity='.9'");
    qd += pth("M" + q(ix - 1, iy + 18) + " Q" + q(ix + 12, iy + 13) + " " + q(ix + iw + 1, iy + 19) + " L" + q(ix + iw + 1, iy + ih + 1) + " L" + q(ix - 1, iy + ih + 1) + " Z", "#a8b58a");
    qd += rett(ix + 6, iy + 12.6, 4.4, 3.4, 0, "#f1ebdc", bordo("#6b5a4a", .4)) + pth("M" + q(ix + 5.4, iy + 12.8) + " L" + q(ix + 8.2, iy + 10.4) + " L" + q(ix + 11, iy + 12.8) + " Z", "#c0563a", bordo("#6b5a4a", .4)) + rett(ix + 7.6, iy + 14.2, 1.2, 1.8, 0, "#6b5a4a");
    qd += rett(ix + 23.4, iy + 13, .9, 3.6, 0, "#7a5a3a") + cer(ix + 23.8, iy + 11.8, 2.4, "#7f9a5a", bordo("#55663a", .4));
    qd += pth("M" + q(ix + 4, iy) + " L" + q(ix + 11, iy) + " L" + q(ix, iy + 13) + " L" + q(ix, iy + 6) + " Z", "#ffffff", "opacity='.28'");   // il riflesso del vetro
    qd += tratto("M" + q(ix + iw, iy + 2.6) + " L" + q(ix + iw - 5, iy + 6) + " L" + q(ix + iw - 7, iy + 11) + " M" + q(ix + iw - 5, iy + 6) + " L" + q(ix + iw - 1.6, iy + 9.4) + " M" + q(ix + iw - 5, iy + 6) + " L" + q(ix + iw - 9.4, iy + 4.6), "#ffffff", .6, "opacity='.9'");   // la crepa del vetro
    g += dentro(dd, qd) + rett(ix, iy, iw, ih, 0, "none", bordo(L, .9));
    g += pth("M" + q(x0 + W + .9, y0 + H - 6) + " L" + q(x0 + W - 2.4, y0 + H - 5) + " L" + q(x0 + W - 3.2, y0 + H + .9) + " L" + q(x0 + W + .9, y0 + H + .9) + " Z", "#e2bf94", bordo(L, .8));   // l'angolo scheggiato: si vede il legno chiaro
    s += "<g " + gira(-6.5, cx, ch) + ">" + g + "</g>";
    s += cer(cx + .7, ch + .9, 1.4, "#000", "opacity='.2'") + cer(cx, ch, 1.4, rad("ch", [[0, "#e9eef1"], [.6, "#9ca8b0"], [1, "#5b6870"]], .35, .3, .8), bordo(L, .6));   // il chiodo
    return s;
  });

  // =========================================================
  //  A TERRA (visto da sopra, 100 × 100 per mattonella): il tappeto liso, consumato, coi buchi e le frange sfilacciate
  // =========================================================
  def("tappeto_liso", { tipo: "terra", nome: "Tappeto liso", fp: [2, 1], w: 200, h: 100 }, function () {
    var r = rnd(61), s = "", i, cx = 100, cy = 50, base = "#9a8f86";
    var fuori = ovale(cx, cy, 89, 40, r, .025, 30), dF = liscio(fuori);
    var buchi = [liscio(ovale(141, 63, 9.5, 6, rnd(2), .55, 9)), liscio(ovale(58, 31, 4.2, 2.8, rnd(3), .5, 7)), liscio(ovale(118, 27, 2.4, 1.6, rnd(4), .4, 6))];
    var dB = dF + " " + buchi.join(" ");
    // le frange alle due teste: fili color panna, alcuni mancano, uno arricciato
    var fr = "";
    [-1, 1].forEach(function (sg) {
      for (i = 0; i < 13; i++) {
        if ((sg < 0 && (i === 3 || i === 8)) || (sg > 0 && (i === 5 || i === 10 || i === 11))) continue;
        var t = (i - 6) / 6 * .55, x1 = cx + sg * Math.cos(t) * 88, y1 = cy + Math.sin(t) * 40, l = 5 + r() * 2.6, x2 = x1 + sg * l * Math.cos(t * 1.4), y2 = y1 + l * Math.sin(t * 1.4) * .9;
        var d = (sg > 0 && i === 2) || (sg < 0 && i === 9) ? "M" + q(x1, y1) + " q" + q(sg * 3, 2) + " " + q(sg * 1, 4) + " q" + q(-sg * 2, 1) + " " + q(sg * .6, 3) : "M" + q(x1, y1) + " L" + q(x2, y2);
        fr += tratto(d, "#5e554e", 2.4) + tratto(d, "#d9d0c2", 1.3);
      }
    });
    s += fr;
    s += pth(dB, "#000", "opacity='.14' transform='translate(1.2 1.6)' fill-rule='evenodd'");   // l'ombra (è sottile)
    s += pth(dB, rad("tb", [[0, chiaro(base, .2)], [.65, base], [1, scuro(base, .12)]], .38, .32, .8), "fill-rule='evenodd'");
    var t = "";
    t += pth(dF + " " + liscio(ovale(cx, cy, 77, 31, rnd(5), .03, 26)), "#857a71", "fill-rule='evenodd' opacity='.75'");   // la fascia del bordo, più scura
    t += pth(liscio(ovale(cx, cy, 83, 35.6, rnd(6), .02, 26)), "none", "stroke='#b8ada2' stroke-width='2.4' stroke-dasharray='6 4' opacity='.85'");   // la riga tratteggiata
    t += pth("M" + q(cx - 40, cy) + " L" + q(cx, cy - 20) + " L" + q(cx + 40, cy) + " L" + q(cx, cy + 20) + " Z", "#8c6f68", "opacity='.18'") + pth("M" + q(cx - 22, cy) + " L" + q(cx, cy - 11) + " L" + q(cx + 22, cy) + " L" + q(cx, cy + 11) + " Z", "none", "stroke='#b39a8c' stroke-width='1.6' opacity='.3'") +
      cer(cx, cy, 4.6, "#8c6f68", "opacity='.22'");   // il disegno in mezzo, quasi sparito
    for (i = 0; i < 260; i++) { var px = 8 + r() * 184, py = 8 + r() * 84; t += rett(px, py, 1.2 + r() * 1.4, .55, 0, r() < .5 ? chiaro(base, .25) : scuro(base, .14), "opacity='.45'"); }   // la trama
    [[66, 58, 17, 9], [128, 38, 12, 7], [96, 70, 9, 5]].forEach(function (z, k) {   // le zone consumate: si vede l'ordito
      var dz = liscio(ovale(z[0], z[1], z[2], z[3], rnd(20 + k), .5, 10)), tz = "", j;
      for (j = -24; j < 24; j += 1.6) tz += tratto("M" + q(z[0] + j, z[1] - 12) + " L" + q(z[0] + j + 5, z[1] + 12), "#7a7068", .35, "opacity='.55'");
      t += pth(dz, "#b2a89c", "opacity='.75'") + dentro(dz, tz);
    });
    t += ell(40, 62, 8, 4.4, "#6e625a", "opacity='.22'") + ell(41, 61, 4.6, 2.4, "#6e625a", "opacity='.18'");   // una macchia
    buchi.forEach(function (b) { t += pth(b, "none", "stroke='#5a4e46' stroke-width='3' opacity='.5'"); });
    s += dentro(dB, t, true);
    var fil = "";   // i fili che pendono dai buchi
    [[132, 60, -1, 2], [137, 57.4, -.3, -2.6], [149, 61, 1.6, 1.4], [143, 68.6, .4, -2.4], [55, 30.6, 1.6, 1], [60.6, 29, -.6, 2]].forEach(function (f) { var d = "M" + q(f[0], f[1]) + " q" + q(f[2], f[3] * .5) + " " + q(f[2] * 1.6, f[3]); fil += tratto(d, "#5e554e", 1.6) + tratto(d, "#c9bfb2", .8); });
    s += pth(dB, "none", bordo(L, 1.5) + " fill-rule='evenodd'") + fil;
    return s;
  });

  // =========================================================
  function misure(d) { if (d.tipo === "parete" || d.tipo === "terra") return { w: d.w, h: d.h }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  // la stanza dove si vendono (roba di partenza: va nel mercatino dell'usato) — prezzo 0 e qualità 0, come nella casa di oggi
  var STANZA = { frigo_ammaccato: "cucina", fornello_vecchio: "cucina" };
  SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: STANZA[nome] || "soggiorno", w: m.w, h: m.h, fp: d.fp ? d.fp.slice() : [1, 1], prezzo: 0, qual: 0 };
      if (d.tipo === "piedi" || d.tipo === "sopra") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.piano) o.piano = d.piano;
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "mss" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1;
      var c; try { c = d.fn(opz); } finally { G = 1; }
      var testa = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "");
      if (d.tipo === "parete" || d.tipo === "terra") return testa + c + "</svg>";
      return testa + "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

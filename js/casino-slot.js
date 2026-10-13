/* =========================================================
   SPeeD GAME — LE SLOT MACHINE E LE MACCHINE DEL CASINÒ, VISTE DALL'ALTO
   Come i mobili della casa (js/mobili-arte.js, js/mobili-giochi.js): una mattonella è un rombo largo 100 e alto 50
   (circa 1 metro); in altezza 61 unità ≈ 1 metro. Il davanti guarda in basso a sinistra; con { dietro: true }
   la macchina girata (si vede il retro). Con { notte: true } rulli, schermi, lampadine e insegne sono accesi
   (il gioco poi scurisce la sala e mette l'alone nel punto "luce").
   In piedi: slot classica, slot video, slot del jackpot, slot gigante, video poker, bancomat.
   Da parete (larghe due pezzi di muro, 124 × 200): l'insegna JACKPOT e il maxischermo delle scommesse.
   Non si vendono nel negozio: reparto "casino", prezzo 0. Si aggiungono a SGMobiliArte con aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";

  // ---------- attrezzi (gli stessi dei mobili della casa) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato; NOTTE = luci accese
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(k) { return "opacity='" + f2(k) + "'"; }
  function sp(dx, dy) { return "transform='translate(" + f2(dx) + " " + f2(dy) + ")'"; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f2(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f2(rx) + "' ry='" + f2(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f2(x) + "' y='" + f2(y) + "' width='" + f2(w) + "' height='" + f2(h) + "'" + (r ? " rx='" + f2(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + f2(w || 2.4) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f2(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
  function linea(a, b) { return "M" + q(a) + " L" + q(b); }
  function chiuso(a) { return "M" + a.map(function (x) { return q(x); }).join(" L") + " Z"; }
  function aperto(a) { return "M" + a.map(function (x) { return q(x); }).join(" L"); }
  function limiti(a) { var b = [1e9, 1e9, -1e9, -1e9]; a.forEach(function (x) { b[0] = Math.min(b[0], x[0]); b[1] = Math.min(b[1], x[1]); b[2] = Math.max(b[2], x[0]); b[3] = Math.max(b[3], x[1]); }); return b; }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  function tono(c, t) { return t >= 0 ? chiaro(c, Math.min(.85, t)) : scuro(c, Math.min(.85, -t)); }
  // sfumature e ritagli (gli id col prefisso del disegno)
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
  function nuova(stops, x1, y1, x2, y2, user) { return sfum("linearGradient", "g" + (++nC), stops, "x1='" + f2(x1) + "' y1='" + f2(y1) + "' x2='" + f2(x2) + "' y2='" + f2(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function nuovaR(stops, cx, cy, r) { return sfum("radialGradient", "g" + (++nC), stops, "cx='" + f2(cx) + "' cy='" + f2(cy) + "' r='" + f2(r) + "'"); }
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  var CROMO = [[0, "#ffffff"], [.3, "#e4e9ec"], [.66, "#9ca8b0"], [1, "#65717a"]];
  var OTTONE = [[0, "#fff6cf"], [.3, "#f3d27a"], [.62, "#c99a36"], [1, "#7a5614"]];
  var CROMO_C = [[0, "#ffffff"], [.35, "#dee2e6"], [.7, "#8d969e"], [1, "#59626a"]];   // il cromo dei pezzi tondi
  function cromo(d, w) { return tratto(d, L, w + 2.4) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.7, w * .38), "opacity='.95' transform='translate(-.4 -.5)'"); }
  function ottone(d, w) { return tratto(d, L, w + 2.2) + tratto(d, "#c99a36", w) + tratto(d, "#fff3c4", Math.max(.6, w * .36), "opacity='.95' transform='translate(-.35 -.45)'"); }

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf, rr: rr == null ? rf : rr, e: e || 2 }; }
  function giro(F, z, k, n, db) {
    var ka = k == null ? 1 : (k.length ? k[0] : k), kb = k == null ? 1 : (k.length ? k[1] : k), out = [], i; n = n || 60;
    for (i = 0; i < n; i++) {
      var t = i / n * 6.2832, c = Math.cos(t), s = Math.sin(t), x = (c < 0 ? -1 : 1) * Math.pow(Math.abs(c), 2 / F.e), y = (s < 0 ? -1 : 1) * Math.pow(Math.abs(s), 2 / F.e);
      out.push(P(F.ca + x * F.ra * ka, F.cb + (db || 0) + y * (y > 0 ? F.rf : F.rr) * kb, z));
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
  function corpo(livelli, stops, lw) {   // un pezzo tondo pieno: la sagoma sfumata da sinistra a destra
    var pp = inviluppo([].concat.apply([], livelli)), b = limiti(pp);
    return pth(chiuso(pp), lin("cx", stops, b[0], 0, b[2], 0, true), bordo(L, lw || 2.4));
  }

  // ---------- i mobili squadrati (come nel bagno) ----------
  function faccia(o, dir, c) { return "<g transform='matrix(.8197 " + (dir > 0 ? ".4098" : "-.4098") + " 0 1 " + f1(o[0]) + " " + f1(o[1]) + ")'>" + c + "</g>"; }
  function tinte(c) {   // i tre colori: sopra, la faccia di sinistra (alla luce), quella di destra (in ombra)
    if (typeof c !== "string") return c;
    var k = c.slice(1);
    return [lin("ts" + k, [[0, chiaro(c, .32)], [1, chiaro(c, .1)]], 0, 0, 1, 1), lin("tl" + k, [[0, chiaro(c, .12)], [1, scuro(c, .06)]], 0, 0, 0, 1), lin("td" + k, [[0, scuro(c, .2)], [1, scuro(c, .34)]], 0, 0, 0, 1)];
  }
  // un blocco da a0..a1, b0..b1 (b1 = davanti), z0..z1; f = { davanti, dietro, fianco, sopra }: disegni piatti (W, H) per le facce
  function blocco(a0, a1, b0, b1, z0, z1, col, f, lw) {
    f = f || {};
    var u0 = G > 0 ? a0 : -a1, u1 = G > 0 ? a1 : -a0, v0 = G > 0 ? b0 : -b1, v1 = G > 0 ? b1 : -b0, c = tinte(col);
    var A = Puv(u0, v0, z1), B = Puv(u1, v0, z1), C = Puv(u1, v1, z1), D = Puv(u0, v1, z1), Bb = Puv(u1, v0, z0), Cb = Puv(u1, v1, z0), Db = Puv(u0, v1, z0);
    var Ws = (u1 - u0) * 61, Wd = (v1 - v0) * 61, H = z1 - z0, fs = G > 0 ? f.davanti : f.dietro;
    var s = faccia(D, 1, rett(0, 0, Ws, H, 0, c[1]) + (fs ? fs(Ws, H) : "")) + faccia(C, -1, rett(0, 0, Wd, H, 0, c[2]) + (f.fianco ? f.fianco(Wd, H) : "")) + poly([A, B, C, D], c[0]);
    if (f.sopra) s += f.sopra(A, B, C, D, (u1 - u0) * 100, (v1 - v0) * 100);
    s += tratto("M" + q(D) + " L" + q(C) + " L" + q(B) + " M" + q(C) + " L" + q(Cb), L, 1.1, "opacity='.8'");   // gli spigoli di dentro, sottili
    if (H > 5) s += tratto("M" + q(D[0] + 1.6, D[1] + 1.4) + " L" + q(C[0] - .6, C[1] + 1.1), "#ffffff", 1.1, "opacity='.6'");   // il filo di luce sullo spigolo davanti
    return s + poly([A, B, Bb, Cb, Db, D], "none", bordo(L, lw || 2.3));
  }
  function piano(O, X, Y, W, H, c) {   // un disegno piatto W × H steso su un piano qualsiasi: O = il suo angolo in alto a sinistra, X = la fine della riga di sopra, Y = la fine del lato di sinistra
    var m = [(X[0] - O[0]) / W, (X[1] - O[1]) / W, (Y[0] - O[0]) / H, (Y[1] - O[1]) / H, O[0], O[1]];
    return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>";
  }

  // ---------- la luce: viene da in alto a sinistra ----------
  function norma(v) { var l = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  var LUCE = norma([-.3, .5, .8]), VISTA = norma([1, 1, .82]), MEZZO = norma([LUCE[0] + VISTA[0], LUCE[1] + VISTA[1], LUCE[2] + VISTA[2]]);
  function tinta(c, n, m) {   // il colore di una superficie con la normale n (nella vista: u, v, z) fatta del materiale m
    m = m || {};
    var B = dot(n, LUCE), t = B >= .5 ? (B - .5) / .3 * .2 : (B - .5) / .8 * .27;
    var col = tono(c, t * (m.forza || 1));
    if (m.lucido) { var sp2 = Math.pow(Math.max(0, dot(n, MEZZO)), m.esp || 24) * m.lucido; if (sp2 > .01) col = mix(col, "#fff8ec", Math.min(.85, sp2)); }   // il lucido della lacca
    return col;
  }

  // ---------- i pezzi tirati: una sezione tirata lungo un asse ----------
  // asse "a": la sezione è fatta di punti [b, z] e va da a = t0 ad a = t1; asse "b": punti [a, z], da b = t0 a b = t1.
  // o = { mat, fascia(H) = disegni sulla parte tirata, tappo(T) = disegni sul tappo che si vede (piatto), tappoCol, lw }
  function arcoS(cx, cz, rx, rz, a0, a1, n) { var o = [], i; for (i = 0; i <= n; i++) { var t = a0 + (a1 - a0) * i / n; o.push([cx + rx * Math.cos(t), cz + rz * Math.sin(t)]); } return o; }
  function estruso(asse, prof, t0, t1, c, o) {
    o = o || {};
    var A = asse === "a", tv = G > 0 ? t1 : t0, tn = G > 0 ? t0 : t1, n = prof.length, m = o.mat, i;
    function p3(pt, t) { return A ? P(t, pt[0], pt[1]) : P(pt[0], t, pt[1]); }
    var capV = prof.map(function (x) { return p3(x, tv); }), capN = prof.map(function (x) { return p3(x, tn); });
    var sil = inviluppo(capV.concat(capN)), dSil = chiuso(sil), dCap = chiuso(capV);
    var nn = A ? [-.4472, .8944] : [.4472, .8944];   // sullo schermo, di traverso all'asse
    function spr(w) { return w[0] * nn[0] + w[1] * nn[1]; }
    var area = 0, en = [];
    for (i = 0; i < n; i++) { var u1 = prof[i], u2 = prof[(i + 1) % n]; area += (u1[0] * u2[1] - u2[0] * u1[1]) / 61; }
    var sg = area > 0 ? 1 : -1, zb = Math.min.apply(null, prof.map(function (x) { return x[1]; }));
    function tv2(nrm, z) { var col = tinta(c, nrm, m), f = o.ao ? Math.max(0, 1 - (z - zb) / (o.aoH || 8)) : 0; return f > 0 ? mix(col, "#000000", o.ao * f * f) : col; }
    for (i = 0; i < n; i++) {   // la normale di ogni lato della sezione, nella vista
      var e1 = prof[i], e2 = prof[(i + 1) % n], dx = e2[0] - e1[0], dz = (e2[1] - e1[1]) / 61, l = Math.sqrt(dx * dx + dz * dz) || 1, mx = sg * dz / l, mz = -sg * dx / l;
      en.push(A ? [0, G * mx, mz] : [G * mx, 0, mz]);
    }
    var voci = [], vis = [], luMax = -2, kLuce = 0;
    for (i = 0; i < n; i++) {
      var ea = en[(i + n - 1) % n], eb = en[i], va = dot(ea, VISTA) > .001, vb = dot(eb, VISTA) > .001, s = spr(capV[i]);
      if (!va && !vb) continue;
      vis.push({ k: i, s: s });
      var zz = prof[i][1], nm = va && vb ? norma([ea[0] + eb[0], ea[1] + eb[1], ea[2] + eb[2]]) : (va ? ea : eb), lu = dot(nm, MEZZO);
      if (lu > luMax) { luMax = lu; kLuce = i; }
      if (va && vb && dot(ea, eb) < .8) {   // uno spigolo vivo: due colori nello stesso punto
        var prima = spr(capV[(i + n - 1) % n]) < s;
        voci.push({ s: s, c: [tv2(prima ? ea : eb, zz), tv2(prima ? eb : ea, zz)] });
      } else voci.push({ s: s, c: [tv2(va && vb ? norma([ea[0] + eb[0], ea[1] + eb[1], ea[2] + eb[2]]) : (va ? ea : eb), zz)] });
    }
    voci.sort(function (x, y) { return x.s - y.s; }); vis.sort(function (x, y) { return x.s - y.s; });
    var smin = 1e9, smax = -1e9; sil.forEach(function (w) { var v = spr(w); if (v < smin) smin = v; if (v > smax) smax = v; });
    var st = []; voci.forEach(function (v) { v.c.forEach(function (cc) { st.push([f2(Math.max(0, Math.min(1, (v.s - smin) / (smax - smin || 1)))), cc]); }); });
    if (!st.length) st = [[0, c], [1, c]];
    var r = pth(dSil, nuova(st, nn[0] * smin, nn[1] * smin, nn[0] * smax, nn[1] * smax, true));
    var xs = prof.map(function (x) { return x[0]; }), zs = prof.map(function (x) { return x[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
    var H = {   // gli aiuti per decorare: p3, la catena dei punti che si vedono, il tappo piatto
      p3: p3, tv: tv, tn: tn, prof: prof, sil: sil, capV: capV, kLuce: kLuce,
      luccica: function (k, a, b) {   // la riga di luce lucida lungo il pezzo, dove la luce batte di più
        var pp = this.lungo(kLuce, t0 + (t1 - t0) * (a || .06), t0 + (t1 - t0) * (b || .94));
        return tratto(aperto(pp), "#ffffff", 1.3, op(k || .5)) + tratto(aperto(pp), "#ffffff", 3.2, op((k || .5) * .25));
      },
      vis: vis.map(function (v) { return v.k; }),
      sez: function (t, filtro) { return vis.filter(function (v) { return !filtro || filtro(prof[v.k]); }).map(function (v) { return p3(prof[v.k], t); }); },
      lungo: function (k, ta, tb) { return [p3(prof[k], ta == null ? t0 : ta), p3(prof[k], tb == null ? t1 : tb)]; },
      vicinoA: function (x, z) { var bi = 0, bd = 1e9; prof.forEach(function (w, j) { var d = Math.abs(w[0] - x) + Math.abs(w[1] - z) / 61; if (d < bd) { bd = d; bi = j; } }); return bi; }
    };
    if (o.fascia) r += dentro(dSil, o.fascia(H));
    var ct = o.tappoCol || tinta(c, A ? [1, 0, 0] : [0, 1, 0], m);   // il tappo che si vede: piatto, un po' più chiaro in alto
    r += pth(dCap, nuova([[0, chiaro(ct, .07)], [1, scuro(ct, .1)]], 0, 0, 0, 1));
    if (o.tappo) {
      var T;
      if (A) T = { O: P(tv, G > 0 ? x1 : x0, z1), X: P(tv, G > 0 ? x0 : x1, z1), Y: P(tv, G > 0 ? x1 : x0, z0), W: (x1 - x0) * 61, H: z1 - z0, x: function (b) { return (G > 0 ? x1 - b : b - x0) * 61; } };
      else T = { O: P(G > 0 ? x0 : x1, tv, z1), X: P(G > 0 ? x1 : x0, tv, z1), Y: P(G > 0 ? x0 : x1, tv, z0), W: (x1 - x0) * 61, H: z1 - z0, x: function (a) { return (G > 0 ? a - x0 : x1 - a) * 61; } };
      T.y = function (z) { return z1 - z; }; T.capV = capV; T.prof = prof;
      T.su = function (cont) { return piano(T.O, T.X, T.Y, T.W, T.H, cont); };
      r += dentro(dCap, o.tappo(T));
    }
    r += pth(dCap, "none", "stroke='" + L + "' stroke-width='1.1' stroke-linejoin='round' opacity='.7'");
    return r + pth(dSil, "none", bordo(L, o.lw || 2.3));
  }

  // ---------- le ombre a terra (stese sul pavimento, un po' spostate a destra: la luce viene da sinistra) ----------
  function aTerra(c) { return "<g transform='matrix(50 25 -50 25 0 0)'>" + c + "</g>"; }
  function ombraPianta(a0, a1, b0, b1, k, pad) {
    pad = pad == null ? .1 : pad;
    var cu = G * (a0 + a1) / 2 + .05, cv = G * (b0 + b1) / 2 - .01;
    return aTerra("<ellipse cx='" + f2(cu) + "' cy='" + f2(cv) + "' rx='" + f2((a1 - a0) / 2 + pad) + "' ry='" + f2((b1 - b0) / 2 + pad) + "' fill='" + rad("omp", [[0, "#000", .24], [.6, "#000", .16], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>");
  }

  // ---------- il legno e la lacca ----------
  function venature(W, H, c, seme, passo) {   // le venature lungo x in un rettangolo piatto W × H
    var r = rnd(seme), s = "", i, n = Math.max(2, Math.round(H / (passo || 3)));
    for (i = 0; i < n; i++) {
      var y = (i + .2 + r() * .6) * H / n, amp = .3 + r() * 1.1, fr = 1.5 + r() * 3, ph = r() * 6.28, d = "M.4," + f1(y + Math.sin(ph) * amp), x;
      for (x = 3; x < W - .6; x += 3) d += " L" + f1(x) + "," + f1(y + Math.sin(ph + x / W * fr * 3.14) * amp);
      d += " L" + f1(W - .4) + "," + f1(y + Math.sin(ph + fr * 3.14) * amp);
      s += tratto(d, r() < .72 ? scuro(c, .28 + r() * .15) : chiaro(c, .22), .35 + r() * .45, op(f2(.28 + r() * .35)));
    }
    return s;
  }
  function lucidoPiano(W, H, k) {   // il riflesso della vernice: una fascia larga e una riga sottile, in diagonale
    k = k || 1;
    return poly([[W * .16, 0], [W * .36, 0], [W * .2, H], [0, H]], "#ffffff", op(f2(.13 * k))) + poly([[W * .42, 0], [W * .46, 0], [W * .3, H], [W * .26, H]], "#ffffff", op(f2(.2 * k))) +
      rett(0, 0, W, H, 0, nuova([[0, "#fff", .14 * k], [.5, "#fff", 0]], 0, 0, 1, 1));
  }

  // ---------- altri attrezzi ----------
  // un disegno piatto steso su un piano dritto: sul piano ad a fisso (X = b·61, verso il davanti; Y = −z),
  // sul piano a b fisso (X = a·61; Y = −z) e sul piano a z fisso (X = a·61; Y = b·61)
  function mat(m, c) { return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>"; }
  function suA(a, c) { return mat([-.8197 * G, .4098 * G, 0, 1, 50 * G * a, 25 * G * a], c); }
  function suB(b, c) { return mat([.8197 * G, .4098 * G, 0, 1, -50 * G * b, 25 * G * b], c); }
  // una lastra sagomata: il contorno pr = [[b, z], ...] da a = x0 ad a = x1. Si vedono i bordi girati verso chi guarda e la faccia vicina;
  // o = { col, mat (i bordi), faccia (il colore della faccia), fuori (la a della faccia di fuori), arte (il disegno di fuori), dentro (il colore di dentro) }
  function lastra(pr, x0, x1, o) {
    var n = pr.length, i, s = "", area = 0, av = G > 0 ? x1 : x0;
    for (i = 0; i < n; i++) { var p1 = pr[i], p2 = pr[(i + 1) % n]; area += p1[0] * p2[1] - p2[0] * p1[1]; }
    var sg = area > 0 ? 1 : -1;
    for (i = 0; i < n; i++) {   // i bordi (lo spessore): solo quelli girati verso chi guarda
      var e1 = pr[i], e2 = pr[(i + 1) % n], db = e2[0] - e1[0], dz = (e2[1] - e1[1]) / 61, l = Math.sqrt(db * db + dz * dz) || 1;
      var nv = [0, G * sg * dz / l, -sg * db / l];
      if (dot(nv, VISTA) <= .001) continue;
      s += poly([P(x0, e1[0], e1[1]), P(x1, e1[0], e1[1]), P(x1, e2[0], e2[1]), P(x0, e2[0], e2[1])], tinta(o.col, nv, o.mat), bordo(L, .6));
    }
    var d = chiuso(pr.map(function (x) { return P(av, x[0], x[1]); }));
    s += pth(d, av === o.fuori ? o.faccia : (o.dentro || o.faccia));
    if (av === o.fuori && o.arte) s += dentro(d, suA(av, o.arte()));
    return s + pth(d, "none", bordo(L, o.lw || 2.2));
  }
  function stella(x, y, k, c, x2) {   // una stellina a quattro punte (il luccichio)
    var a = k * .22;
    return pth("M" + f1(x) + "," + f1(y - k) + " Q" + f2(x + a) + "," + f2(y - a) + " " + f1(x + k) + "," + f1(y) + " Q" + f2(x + a) + "," + f2(y + a) + " " + f1(x) + "," + f1(y + k) +
      " Q" + f2(x - a) + "," + f2(y + a) + " " + f1(x - k) + "," + f1(y) + " Q" + f2(x - a) + "," + f2(y - a) + " " + f1(x) + "," + f1(y - k) + " Z", c, x2);
  }
  function stella5(x, y, R, c, x2) {   // una stella a cinque punte
    var pp = [], i;
    for (i = 0; i < 10; i++) { var t = (-90 + i * 36) * Math.PI / 180, r = i % 2 ? R * .45 : R; pp.push([x + Math.cos(t) * r, y + Math.sin(t) * r]); }
    return poly(pp, c, x2);
  }
  function rq(x, y, w, h, r) {   // un rettangolo con gli angoli tondi, come tracciato
    return "M" + f2(x + r) + "," + f2(y) + " H" + f2(x + w - r) + " Q" + f2(x + w) + "," + f2(y) + " " + f2(x + w) + "," + f2(y + r) + " V" + f2(y + h - r) + " Q" + f2(x + w) + "," + f2(y + h) + " " + f2(x + w - r) + "," + f2(y + h) +
      " H" + f2(x + r) + " Q" + f2(x) + "," + f2(y + h) + " " + f2(x) + "," + f2(y + h - r) + " V" + f2(y + r) + " Q" + f2(x) + "," + f2(y) + " " + f2(x + r) + "," + f2(y) + " Z";
  }
  function ellD(x, y, rx, ry) { return "M" + q(x - rx, y) + " A" + f2(rx) + "," + f2(ry) + " 0 1,0 " + q(x + rx, y) + " A" + f2(rx) + "," + f2(ry) + " 0 1,0 " + q(x - rx, y) + " Z"; }
  function pallina(c, r, col, k) {   // una pallina lucida (la leva): c = il centro sullo schermo
    return cer(c[0], c[1], r, nuovaR([[0, chiaro(col, .65)], [.35, col], [1, scuro(col, .45)]], .35, .3, .8), bordo(L, k || .7)) + ell(c[0] - r * .32, c[1] - r * .38, r * .32, r * .2, "#ffffff", op(.85));
  }
  function cromo3() {   // il cromo per i blocchi: sopra, la faccia alla luce, quella in ombra
    return [nuova([[0, "#ffffff"], [1, "#c9d1d8"]], 0, 0, 1, 1), nuova([[0, "#f6f8fa"], [.45, "#c3cbd2"], [1, "#8d979f"]], 0, 0, 1, 0), nuova([[0, "#9aa4ac"], [1, "#5c666e"]], 0, 0, 1, 0)];
  }
  function g0(x, y, k, c) { return "<g transform='translate(" + f2(x) + " " + f2(y) + ") scale(" + f2(k) + ")'>" + c + "</g>"; }
  function raggiera(cx, cy, R, n, c, k, a0, a1) {   // i raggi (uno sì e uno no) che partono da (cx, cy), da a0 ad a1 gradi
    var o = "", i;
    for (i = 0; i < n; i += 2) {
      var t0 = (a0 + (a1 - a0) * i / n) * Math.PI / 180, t1 = (a0 + (a1 - a0) * (i + 1) / n) * Math.PI / 180;
      o += poly([[cx, cy], [cx + Math.cos(t0) * R, cy + Math.sin(t0) * R], [cx + Math.cos(t1) * R, cy + Math.sin(t1) * R]], c, op(k));
    }
    return o;
  }
  function ombraD(d, dx, dy, k) {   // l'ombra sul muro: la stessa forma spostata in basso a destra, in due velature
    k = k == null ? 1 : k;
    return pth(d, "#000", op(.06 * k) + " " + sp(dx * 1.7, dy * 1.7)) + pth(d, "#000", op(.13 * k) + " " + sp(dx, dy));
  }

  // ---------- le lampadine, le monete, le cifre luminose ----------
  function lampadina(x, y, r, c) {   // una lampadina della fila: di giorno spenta (vetro chiaro), di notte accesa con l'alone
    c = c || "#ffd43b";
    var k = c.slice(1);
    if (NOTTE) return cer(x, y, r * 2.7, rad("la" + k, [[0, chiaro(c, .45), .8], [.32, c, .38], [1, c, 0]], .5, .5, .5)) + cer(x, y, r, rad("ln" + k, [[0, "#ffffff"], [.5, chiaro(c, .62)], [1, c]], .4, .4, .7)) + cer(x - r * .3, y - r * .32, r * .3, "#ffffff", op(.95));
    return cer(x + r * .22, y + r * .28, r * 1.1, "#000", op(.22)) + cer(x, y, r, rad("lg" + k, [[0, "#fffdf2"], [.5, chiaro(c, .5)], [1, scuro(c, .25)]], .38, .35, .75), "stroke='" + scuro(c, .6) + "' stroke-width='" + f2(r * .24) + "'") + cer(x - r * .32, y - r * .34, r * .3, "#ffffff", op(.9));
  }
  function lampadine(pp, r, cols) { return pp.map(function (v, i) { return lampadina(v[0], v[1], r, cols[i % cols.length]); }).join(""); }
  function lungoArco(cx, cy, rx, ry, a0, a1, n) { var pp = [], i; for (i = 0; i <= n; i++) { var t = (a0 + (a1 - a0) * i / n) * Math.PI / 180; pp.push([cx + Math.cos(t) * rx, cy + Math.sin(t) * ry]); } return pp; }
  function lungoRett(x, y, w, h, passo) {   // i punti lungo il bordo di un rettangolo, uno ogni "passo"
    var pp = [], nx = Math.max(1, Math.round(w / passo)), ny = Math.max(1, Math.round(h / passo)), i;
    for (i = 0; i < nx; i++) pp.push([x + w * i / nx, y]);
    for (i = 0; i < ny; i++) pp.push([x + w, y + h * i / ny]);
    for (i = 0; i < nx; i++) pp.push([x + w - w * i / nx, y + h]);
    for (i = 0; i < ny; i++) pp.push([x, y + h - h * i / ny]);
    return pp;
  }
  function monetaD(x, y, r) {   // una moneta d'oro vista di fronte, con la stella in rilievo
    return cer(x + r * .12, y + r * .16, r, "#7a5000", op(.6)) + cer(x, y, r, rad("mo", [[0, "#fff6c4"], [.45, "#f7c948"], [1, "#a8740f"]], .35, .3, .8), bordo(L, r * .14)) +
      cer(x, y, r * .74, "none", "stroke='#b8860b' stroke-width='" + f2(r * .1) + "' opacity='.85'") + stella5(x, y, r * .46, "#e0a810", "stroke='#9a6a00' stroke-width='" + f2(r * .06) + "'") + ell(x - r * .38, y - r * .42, r * .28, r * .17, "#ffffff", op(.85));
  }
  function monetaT(c, r) {   // una moneta stesa (vista dall'alto in diagonale): c = il centro sullo schermo, r = il raggio in mattonelle
    var rx = 70.7 * r, ry = 35.4 * r;
    return ell(c[0], c[1] + .55, rx, ry, "#8a5a00") + ell(c[0], c[1], rx, ry, rad("mt", [[0, "#fff3b0"], [.5, "#f5c518"], [1, "#b07d0a"]], .35, .3, .8), bordo(L, .3)) +
      ell(c[0], c[1], rx * .64, ry * .64, "none", "stroke='#c8960c' stroke-width='.25'") + ell(c[0] - rx * .3, c[1] - ry * .3, rx * .26, ry * .22, "#ffffff", op(.85));
  }
  // le cifre luminose a sette segmenti (x, y = in alto a sinistra, h = altezza); il punto sta nello spazio fra due cifre
  var SEG = { "0": "abcdef", "1": "bc", "2": "abged", "3": "abgcd", "4": "fgbc", "5": "afgcd", "6": "afgedc", "7": "abc", "8": "abcdefg", "9": "abcdfg" };
  function ledL(testo, h) { var n = testo.replace(/[^0-9 ]/g, "").length; return n * h * .78 - h * .22; }
  function led(testo, x, y, h, c, acceso) {   // acceso = di notte: i segmenti più chiari, con la riga bianca dentro
    var w = h * .56, t = h * .19, gap = h * .22, o = "", px = x, e = t * .2, cl = acceso ? chiaro(c, .14) : c;
    function oriz(x0, yc) { return [[x0 + e, yc], [x0 + e + t / 2, yc - t / 2], [x0 + w - e - t / 2, yc - t / 2], [x0 + w - e, yc], [x0 + w - e - t / 2, yc + t / 2], [x0 + e + t / 2, yc + t / 2]]; }
    function vert(xc, ya, yb) { return [[xc, ya + e], [xc + t / 2, ya + e + t / 2], [xc + t / 2, yb - e - t / 2], [xc, yb - e], [xc - t / 2, yb - e - t / 2], [xc - t / 2, ya + e + t / 2]]; }
    testo.split("").forEach(function (ch) {
      if (ch === "." || ch === ",") { o += rett(px - gap / 2 - t * .55, y + h - t * 1.1, t * 1.1, t * 1.1, t * .3, cl); return; }
      if (ch !== " ") {
        var S = { a: oriz(px, y + t / 2), g: oriz(px, y + h / 2), d: oriz(px, y + h - t / 2), f: vert(px + t / 2, y + t / 2, y + h / 2), b: vert(px + w - t / 2, y + t / 2, y + h / 2), e: vert(px + t / 2, y + h / 2, y + h - t / 2), c: vert(px + w - t / 2, y + h / 2, y + h - t / 2) };
        var on = SEG[ch] || "";
        "abcdefg".split("").forEach(function (sg) {
          var acc = on.indexOf(sg) >= 0, pp = S[sg];
          o += poly(pp, acc ? cl : scuro(c, .55), acc ? "" : op(.14));
          if (acc && acceso && h > 4) o += tratto(linea(pp[0], pp[3]), "#fff3e6", t * .18, op(.5));   // il filo chiaro del segmento acceso
        });
      }
      px += w + gap;
    });
    return o;
  }

  // ---------- i simboli dei rulli (alti circa 10, centrati in 0,0) ----------
  var ORO_S = [[0, "#fff3b0"], [.35, "#ffd43b"], [.75, "#e6a100"], [1, "#a86b00"]];
  var GEMME = { rubino: "#f03e3e", smeraldo: "#2fb84a", zaffiro: "#228be6", ametista: "#ae3ec9", topazio: "#fab005", diamante: "#3bb2f6" };
  function gemma(x, y, k, c) {   // una gemma tagliata come un diamante, larga 10·k
    var A = [-4.8, -1.4], B = [-2.6, -4.2], C = [2.6, -4.2], D = [4.8, -1.4], E = [0, 4.8], I = [-1.25, -1.4], J = [1.25, -1.4];
    var o = poly([A, B, I], chiaro(c, .45)) + poly([B, C, J, I], chiaro(c, .72)) + poly([C, D, J], chiaro(c, .18)) + poly([A, I, E], chiaro(c, .12)) + poly([I, J, E], chiaro(c, .4)) + poly([J, D, E], scuro(c, .32));
    o += tratto("M-4.6,-1.4 L4.6,-1.4", "#ffffff", .3, op(.6)) + poly([A, B, C, D, E], "none", bordo(L, .6)) + stella(-2.3, -2.9, 1.3, "#ffffff", op(.95));
    return g0(x, y, k, o);
  }
  function simbolo(t, x, y, k) {
    var o = "";
    if (GEMME[t]) return gemma(x, y, k * .95, GEMME[t]);
    if (t === "moneta") return monetaD(x, y, k * 4.6);
    if (t === "stella") return g0(x, y, k, stella5(0, .4, 5.2, lin("st5", ORO_S, 0, 0, 1, 1), bordo(L, .6)) + stella5(-.6, -.2, 2, "#fff8d6", op(.6)));
    if (t === "sette") {
      var d7 = "M-4.3,-4.9 L4.5,-4.9 L4.5,-2.7 C2.5,-.5 1.3,2.1 1,4.9 L-2.6,4.9 C-2.2,1.7 -.7,-.7 1.1,-2.3 L-4.3,-2.3 Z";
      o = pth(d7, "none", "stroke='" + L + "' stroke-width='2.6' stroke-linejoin='round'") + pth(d7, "none", "stroke='#fff8e6' stroke-width='1.5' stroke-linejoin='round'") +
        pth(d7, lin("s7", [[0, "#ff6b6b"], [.5, "#e3101e"], [1, "#9b0a14"]], 0, 0, 0, 1)) + tratto("M-3.7,-4.2 L3.8,-4.2", "#ffffff", .5, op(.6));
    } else if (t === "campana") {
      var db = "M0,-4.4 C-2.2,-4.4 -3,-2.7 -3.1,-.5 C-3.2,1.5 -3.7,2.5 -4.7,3.2 L-4.7,3.9 L4.7,3.9 L4.7,3.2 C3.7,2.5 3.2,1.5 3.1,-.5 C3,-2.7 2.2,-4.4 0,-4.4 Z";
      o = cer(0, -4.7, .9, lin("cmp", ORO_S, 0, 0, 1, 0), bordo(L, .5)) + cer(0, 4.4, 1.1, "#8a5a10", bordo(L, .5)) + pth(db, lin("cmp", ORO_S, 0, 0, 1, 0), bordo(L, .6)) +
        rett(-4.6, 3.05, 9.2, .8, .3, "#c98a00") + tratto("M-1.9,-3 C-2.4,-1.6 -2.3,.4 -2.7,1.9", "#ffffff", .75, op(.75));
    } else if (t === "ciliegie") {
      var gs = "M-2.2,1.2 C-1.6,-1.6 .1,-3.5 1.7,-4.4 M2.4,1.6 C2.1,-1.2 1.9,-3 1.7,-4.4";
      o = tratto(gs, L, 1.35) + tratto(gs, "#37b24d", .65) + pth("M1.7,-4.4 C2.7,-5.7 4.9,-5.3 5,-3.8 C3.8,-2.9 2.5,-3.3 1.7,-4.4 Z", lin("fgl", [[0, "#8ce99a"], [1, "#2b8a3e"]], 0, 0, 1, 1), bordo(L, .45));
      [[-2.3, 2.5], [2.4, 2.9]].forEach(function (c) { o += cer(c[0], c[1], 2.45, rad("cil", [[0, "#ff8787"], [.45, "#e8202b"], [1, "#8a0f16"]], .35, .3, .75), bordo(L, .6)) + ell(c[0] - .8, c[1] - .9, .75, .5, "#ffffff", op(.85)); });
    } else if (t === "limone") {
      var dl = "M-4.9,.4 C-4.5,-3 2.6,-4.3 4.5,-1.1 C4.9,-.3 5.1,.1 5.3,.5 C4.5,3.4 -2.6,4.5 -4.6,1.2 Z";
      o = pth(dl, lin("lim", [[0, "#fff59d"], [.5, "#ffd60a"], [1, "#d49b00"]], 0, 0, .6, 1), bordo(L, .55)) + tratto("M-3,-1 C-1.6,-2.4 1,-2.8 2.6,-2.2", "#ffffff", .6, op(.7));
    } else if (t === "ferro") {   // il ferro di cavallo (c'era già sulla prima slot della storia)
      var df = "M-4.3,4.4 C-5.6,-.8 -3.6,-4.8 0,-4.8 C3.6,-4.8 5.6,-.8 4.3,4.4 L2,4.4 C3,0 2,-2.5 0,-2.5 C-2,-2.5 -3,0 -2,4.4 Z";
      o = pth(df, lin("fer", [[0, "#ffffff"], [.5, "#ced4da"], [1, "#7d868e"]], 0, 0, 1, 1), bordo(L, .55));
      [[-3.5, 1.6], [-3.2, -1.6], [-1.5, -3.6], [3.5, 1.6], [3.2, -1.6], [1.5, -3.6]].forEach(function (c) { o += cer(c[0], c[1], .4, "#495057"); });
    }
    return g0(x, y, k, o);
  }
  // la finestra dei rulli (piatta): x, y, w, h; col = per ogni rullo [sopra, centro, sotto]; k = grandezza dei simboli
  function rulli(x, y, w, h, col, k, gap) {
    var n = col.length, g = gap == null ? 1 : gap, rw = (w - g * (n - 1)) / n, o = rett(x, y, w, h, 0, "#141519"), i, cy = y + h / 2, dy = h * .52;
    for (i = 0; i < n; i++) {
      var rx = x + i * (rw + g), c = "";
      c += rett(rx, y, rw, h, 0, NOTTE ? lin("rln", [[0, "#d9c08f"], [.22, "#fff8e6"], [.5, "#ffffff"], [.78, "#fff8e6"], [1, "#d9c08f"]], 0, 0, 0, 1) : lin("rl", [[0, "#8e877c"], [.22, "#ebe5d9"], [.5, "#fffdf7"], [.78, "#ebe5d9"], [1, "#8a8378"]], 0, 0, 0, 1));
      c += simbolo(col[i][0], rx + rw / 2, cy - dy, k) + simbolo(col[i][1], rx + rw / 2, cy, k) + simbolo(col[i][2], rx + rw / 2, cy + dy, k);
      c += rett(rx, y, rw, h, 0, lin("rlo", [[0, "#000", NOTTE ? .38 : .55], [.3, "#000", 0], [.7, "#000", 0], [1, "#000", NOTTE ? .38 : .55]], 0, 0, 0, 1));   // il rullo è tondo: in alto e in basso gira via, più buio
      c += rett(rx, cy - h * .36, rw, h * .07, 0, "#ffffff", op(.22));   // il lucido lungo il rullo
      o += dentro(rq(rx, y, rw, h, Math.min(1, rw * .1)), c);
    }
    return o;
  }

  // ---------- i pezzi delle slot ----------
  // la "candela": la lucina a due piani in cima alle slot, col cappello cromato (di notte accesa)
  function candela(a, b, z, c1, c2, k) {
    k = k || 1;
    var r = .05 * k, F = forma(a, b, r, r, r, 2), o = "", zz = z, j;
    function pezzo(h, st) { var g = corpo([giro(F, zz, 1, 28), giro(F, zz + h, 1, 28)], st, .6 * k); zz += h; return g; }
    function vetro(h, c) {
      var st = NOTTE ? [[0, "#ffffff"], [.4, chiaro(c, .55)], [1, chiaro(c, .05)]] : [[0, chiaro(c, .42)], [.45, c], [1, scuro(c, .38)]], z0 = zz, g = pezzo(h, st);
      for (j = 1; j < 6; j++) {   // le righe in rilievo della plastica
        var t = (G > 0 ? -Math.PI / 4 : 3 * Math.PI / 4) + j * Math.PI / 6, ca = a + r * Math.cos(t), cb = b + r * Math.sin(t);
        g += tratto(linea(P(ca, cb, z0 + .5 * k), P(ca, cb, z0 + h - .5 * k)), NOTTE ? "#ffffff" : chiaro(c, .5), .35 * k, op(.5));
      }
      return g;
    }
    o += pezzo(1.5 * k, CROMO_C) + vetro(6 * k, c1) + pezzo(.9 * k, CROMO_C) + vetro(6 * k, c2) + pezzo(1.2 * k, CROMO_C);
    o += pth(chiuso(giro(F, zz, 1, 28)), nuovaR([[0, "#ffffff"], [.6, "#ced4da"], [1, "#7d868e"]], .4, .35, .8), bordo(L, .5 * k));
    if (NOTTE) [[z + 4.5 * k, c1], [z + 11.4 * k, c2]].forEach(function (v) { var m = P(a, b, v[0]); o += cer(m[0], m[1], 7.5 * k, nuovaR([[0, chiaro(v[1], .3), .55], [1, v[1], 0]], .5, .5, .5)); });   // di notte la candela fa luce intorno
    return o;
  }
  // la leva sul fianco destro (a = aL): il mozzo cromato, il braccio che sale e la pallina rossa; k = grandezza
  function leva(aL, bL, zL, k) {
    var R = 4.4 * k, i;
    function disco(a, rr) { var pp = []; for (i = 0; i < 26; i++) { var t = i / 26 * 6.2832; pp.push(P(a, bL + rr * Math.cos(t) / 61, zL + rr * Math.sin(t))); } return pp; }
    var d0 = disco(aL, R), d1 = disco(aL + .05 * k, R * .92), cc = P(aL + .05 * k, bL, zL);
    var mozzo = corpo([d0, d1], CROMO_C, .7 * k) + pth(chiuso(d1), nuovaR([[0, "#ffffff"], [.55, "#ced4da"], [1, "#6c767e"]], .35, .3, .8), bordo(L, .6 * k)) + cer(cc[0], cc[1], R * .3, "#495057", bordo(L, .3 * k));
    var c0 = P(aL + .055 * k, bL, zL), c1 = P(aL + .1 * k, bL, zL + 1.5 * k), cm = P(aL + .1 * k, bL - .01 * k, zL + 10 * k), c2 = P(aL + .1 * k, bL - .03 * k, zL + 31 * k);
    var br = cromo("M" + q(c0) + " Q" + q(c1) + " " + q(cm) + " L" + q(c2), 2.2 * k) + pallina(c2, 4.6 * k, "#e8202b", .8 * k);
    return G > 0 ? mozzo + br : br + mozzo;   // da dietro la leva sta dall'altra parte: prima il braccio, poi il mozzo
  }
  // la base su cui sta la slot: mogano lucido (o lacca nera) con lo sportello, la serratura e lo zoccolo d'ottone
  var MOGANO = "#6b2d1b";
  function base(a0, a1, b0, b1, z1, nera) {
    var c = nera ? "#24212a" : MOGANO, ott = nuova(OTTONE, 0, 0, 0, 1);
    function pelle(W, H, seme) { return (nera ? "" : venature(W, H, scuro(c, .08), seme, 2.3)) + lucidoPiano(W, H, nera ? .7 : .5); }
    function zoccolo(W, H) { return rett(0, H - 3.6, W, 3.6, 0, ott) + rett(0, H - 3.6, W, .5, 0, "#fff6cf", op(.85)) + rett(0, 0, W, 1.5, 0, ott) + rett(0, 1.1, W, .4, 0, "#5c3a10", op(.6)); }
    return blocco(a0, a1, b0, b1, 0, z1, c, {
      davanti: function (W, H) {
        var r = pelle(W, H, 41);
        r += pth(rq(3.2, 4.4, W - 6.4, H - 11, 1), "none", "stroke='" + scuro(c, .5) + "' stroke-width='1'") + pth(rq(3.9, 5.1, W - 7.8, H - 12.4, .8), "none", "stroke='" + (nera ? "#c99a36" : chiaro(c, .3)) + "' stroke-width='.45' opacity='.8'");   // lo sportello
        r += cer(W - 7, H * .42, 1.05, nuovaR(OTTONE, .35, .3, .8), bordo(L, .4)) + rett(W - 7.2, H * .42 - .45, .4, .9, 0, "#5c3a10");   // la serratura
        return r + zoccolo(W, H);
      },
      dietro: function (W, H) { var r = pelle(W, H, 47), y; for (y = 9; y < 19; y += 1.9) r += rett(W * .25, y, W * .5, .9, .45, "#1a0b05"); return r + zoccolo(W, H); },
      fianco: function (W, H) { return pelle(W, H, 43) + zoccolo(W, H); }
    }, 2.2);
  }
  // il vassoio d'acciaio che sporge in basso, con le monete d'oro dentro (pieno = il mucchio d'oro che arriva all'orlo)
  function vassoio(a0, a1, b0, b1, z0, z1, seme, n, pieno) {
    var s = blocco(a0, a1, b0, b1, z0, z1, cromo3(), { davanti: function (W, H) { return rett(0, .2, W, 1, 0, "#ffffff", op(.85)) + rett(0, H * .62, W, .45, 0, "#5c656e", op(.4)); }, fianco: function (W, H) { return rett(0, .2, W, 1, 0, "#ffffff", op(.6)); } }, 1.5);
    if (G < 0) return s;
    var e = .03, zf = z0 + 1.4, i, bocca = chiuso([P(a0 + e, b0, z1), P(a1 - e, b0, z1), P(a1 - e, b1 - e, z1), P(a0 + e, b1 - e, z1)]);
    var c = pth(bocca, nuova([[0, "#23272c"], [1, "#4b535b"]], 0, 0, 0, 1));
    c += poly([P(a0 + e, b0, z1 + 2), P(a1 - e, b0, z1 + 2), P(a1 - e, b0, zf), P(a0 + e, b0, zf)], nuova([[0, "#f1f3f5"], [1, "#868e96"]], 0, 0, 0, 1));   // la parete di dentro, alla luce
    c += poly([P(a0 + e, b0, z1 + 2), P(a0 + e, b1, z1 + 2), P(a0 + e, b1, zf), P(a0 + e, b0, zf)], nuova([[0, "#ced4da"], [1, "#5c656e"]], 0, 0, 0, 1));
    var rr = rnd(seme), mon = [], zm = pieno ? z1 - 3.4 : zf;
    if (pieno) c += poly([P(a0 + e, b0, zm), P(a1 - e, b0, zm), P(a1 - e, b1 - e, zm), P(a0 + e, b1 - e, zm)], nuova([[0, "#ffe066"], [1, "#c98a00"]], 0, 0, 0, 1));   // il mucchio d'oro
    for (i = 0; i < n; i++) {
      var ua = rr(), ub = rr();
      mon.push([a0 + e + .035 + ua * (a1 - a0 - 2 * e - .07), b0 + .035 + ub * (b1 - b0 - e - .06), zm + .5 + rr() * 2.6 + (pieno ? 3.2 * (1 - Math.abs(ua - .5) * 2) * (1 - Math.abs(ub - .5) * 1.4) : 0)]);
    }
    mon.sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]) || x[2] - y[2]; });
    mon.forEach(function (m) { c += monetaT(P(m[0], m[1], m[2]), .024); });
    if (pieno) {   // le monete del mucchio che spuntano sopra l'orlo
      var sopra = "";
      mon.filter(function (m) { return m[2] > z1 - .5; }).forEach(function (m) { sopra += monetaT(P(m[0], m[1], m[2]), .024); });
      return s + dentro(bocca, c) + pth(bocca, "none", "stroke='" + L + "' stroke-width='.7'") + tratto(aperto([P(a0 + e, b1 - e, z1), P(a1 - e, b1 - e, z1)]), "#ffffff", .5, op(.8)) + sopra;
    }
    return s + dentro(bocca, c) + pth(bocca, "none", "stroke='" + L + "' stroke-width='.7'") + tratto(aperto([P(a0 + e, b1 - e, z1), P(a1 - e, b1 - e, z1)]), "#ffffff", .5, op(.8));
  }
  // la pulsantiera che sporge, inclinata: il piano scuro col bordo e i tasti (t = [x, larghezza, colore, tondo]) che di notte si accendono
  function pulsantiera(a0, a1, b0, b1, zt, zf, zb, tasti, stile) {
    var st = stile || {};
    var s = lastra([[b0, zt], [b1, zf], [b1, zb], [b0, zb - 1.2]], a0, a1, { col: st.col || "#d5dbe0", mat: { lucido: .55, esp: 14 }, faccia: nuova([[0, st.f0 || "#eef1f3"], [1, st.f1 || "#8d969e"]], 0, 0, 1, 1), lw: st.lw || 1.3 });
    if (G < 0) return s;
    var W = (a1 - a0) * 61, H = st.H || 8, r = rett(0, 0, W, H, 0, nuova([[0, st.p0 || "#3b3e45"], [1, st.p1 || "#1c1e22"]], 0, 0, 0, 1)) + rett(0, 0, W, .7, 0, st.orlo || "#868e96") + rett(0, H - .8, W, .8, 0, st.orlo2 || "#f1f3f5", op(.9));
    tasti.forEach(function (t) {
      var x = t[0], w = t[1], c = NOTTE ? chiaro(t[2], .4) : t[2], cy = H / 2 + .2;
      if (t[3]) {   // il tasto tondo grande (si gira!)
        if (NOTTE) r += ell(x + w / 2, cy, w * .8, w * .7, c, op(.35));
        r += ell(x + w / 2, cy + w * .06, w / 2, w * .41, scuro(t[2], .55)) + ell(x + w / 2, cy, w / 2, w * .41, nuovaR([[0, chiaro(c, .55)], [.6, c], [1, scuro(c, .3)]], .4, .35, .75), "stroke='" + scuro(t[2], .55) + "' stroke-width='" + f2(Math.max(.45, w * .03)) + "'") + ell(x + w * .36, cy - w * .14, w * .14, w * .09, "#ffffff", op(.85));
      } else {
        if (NOTTE) r += rett(x - .7, cy - 2.7, w + 1.4, 5.4, 1.6, c, op(.32));
        r += rett(x, cy - 1.5, w, 3.4, .9, scuro(t[2], .55)) + rett(x, cy - 2, w, 3.4, .9, nuova([[0, chiaro(c, .45)], [1, scuro(c, .2)]], 0, 0, 0, 1), "stroke='" + scuro(t[2], .55) + "' stroke-width='.4'") + rett(x + .5, cy - 1.6, w - 1, .8, .4, "#ffffff", op(.65));
      }
    });
    return s + piano(P(a0, b0, zt), P(a1, b0, zt), P(a0, b1, zf), W, H, r);
  }
  // la stella d'oro in piedi, spessa (da b0 a b1, centro a = 0, z = zc; R e ri = le punte e gli incavi): i fianchi che si
  // vedono, dal più lontano al più vicino, poi la faccia davanti con la stellina chiara e le lampadine sulle punte
  function stellaD(b0, b1, zc, R, ri) {
    var prof = [], i, k, bv = G > 0 ? b1 : b0, bn = G > 0 ? b0 : b1, lati = [], o = "", area = 0, n = 10;
    for (k = 0; k < n; k++) { var th = (90 + k * 36) * Math.PI / 180, rs = k % 2 ? ri : R; prof.push([rs * Math.cos(th) / 61, zc + rs * Math.sin(th)]); }
    for (i = 0; i < n; i++) { var p1 = prof[i], p2 = prof[(i + 1) % n]; area += p1[0] * p2[1] - p2[0] * p1[1]; }
    var sg = area > 0 ? 1 : -1;
    for (i = 0; i < n; i++) {
      var e1 = prof[i], e2 = prof[(i + 1) % n], da = (e2[0] - e1[0]) * 61, dz = e2[1] - e1[1], l = Math.sqrt(da * da + dz * dz) || 1, nv = [G * sg * dz / l, 0, -sg * da / l];
      if (dot(nv, VISTA) <= .001) continue;
      lati.push({ k: G * (e1[0] + e2[0]), pp: [P(e1[0], bn, e1[1]), P(e2[0], bn, e2[1]), P(e2[0], bv, e2[1]), P(e1[0], bv, e1[1])], c: tinta("#e9a514", nv, { lucido: .7, esp: 12 }) });
    }
    lati.sort(function (x, y) { return x.k - y.k; });
    lati.forEach(function (f) { o += poly(f.pp, f.c, bordo(L, 1)); });
    var dC = chiuso(prof.map(function (x) { return P(x[0], bv, x[1]); }));
    o += pth(dC, nuovaR(NOTTE ? [[0, "#ffffff"], [.45, "#fff0a8"], [1, "#f2b81f"]] : [[0, "#fff6c9"], [.5, "#ffd43b"], [1, "#c98a00"]], .42, .38, .7));
    o += dentro(dC, suB(bv, stella5(0, -zc, R * .55, "none", "stroke='#fff8e6' stroke-width='.8' opacity='.85'") + poly([[-R, -zc - R], [-R * .2, -zc - R], [-R * .9, -zc + R], [-R * 1.7, -zc + R]], "#ffffff", op(.18))));
    o += pth(dC, "none", bordo(L, 1.7));
    var punte = []; for (k = 0; k < n; k += 2) punte.push(P(prof[k][0] * .82, bv, zc + (prof[k][1] - zc) * .82));
    return o + lampadine(punte, 1.3, ["#fff3bf", "#ffd43b"]) + lampadine([P(0, bv, zc)], 1.8, ["#fff3bf"]);
  }
  function cavo(a, b, z) {   // il filo della corrente che esce di dietro e va a terra
    var m = P(a + .1, b - .12, 0);
    return tratto("M" + q(P(a, b, z)) + " C" + q(P(a, b - .03, z * .3)) + " " + q(P(a + .03, b - .05, 0)) + " " + q(P(a + .1, b - .12, 0)), "#16161a", 1.5) + ell(m[0], m[1] - .5, 2, 1.1, "#2b2b30", bordo(L, .5));
  }
  function bordoArco(W, H, rz, e) {   // il bordo del davanti ad arco (piatto), rientrato di e: dai due lati in basso, su per l'arco
    return "M" + f2(e) + "," + f2(H) + " L" + f2(e) + "," + f2(rz) + " A" + f2(W / 2 - e) + "," + f2(rz - e) + " 0 0 1 " + f2(W - e) + "," + f2(rz) + " L" + f2(W - e) + "," + f2(H);
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  SLOT MACHINE CLASSICA ("il bandito con un braccio solo"): il mobile rosso laccato ad arco col bordo cromato sulla
  //  base di mogano; in alto il vetro ad arco con la raggiera d'oro e i diamanti, poi i tre rulli (ciliegie, 7, campanelle)
  //  dietro il vetro con la linea che paga, i crediti, la bocca delle banconote e la gettoniera, la pulsantiera che sporge
  //  coi tasti, la pancia rossa e d'oro, il vassoio d'acciaio con le monete; sul fianco la leva cromata con la pallina
  //  rossa; in cima la "candela" rossa e bianca. Dietro: lo sportello di servizio, le prese d'aria, l'etichetta e il filo
  // =========================================================
  def("slot_classica", { tipo: "piedi", nome: "Slot machine classica", fp: [1, 1], box: [-38, -132, 37, 19], dietro: true, luce: [0, .21, 79, 72, "#ffc46b"] }, function () {
    var A0 = -.33, A1 = .33, B0 = -.35, B1 = .21, Z0 = 38, ZA = 98, RZ = 13, ZT = ZA + RZ, ROSSO = "#c81f2a";
    var PROF = [[A0, Z0], [A1, Z0]].concat(arcoS(0, ZA, A1, RZ, 0, Math.PI, 20));
    function davanti(T) {   // il davanti piatto (W × 73: y = 111 − z)
      var W = T.W, H = T.H, cx = W / 2, r = "";
      // il vetro di sopra, ad arco: la raggiera d'oro, il diamante blu e i due rubini
      var yv = 21.4, ev = 2.6, vetro = "M" + f2(ev) + "," + yv + " L" + f2(ev) + "," + f2(RZ) + " A" + f2(cx - ev) + "," + f2(RZ - ev) + " 0 0 1 " + f2(W - ev) + "," + f2(RZ) + " L" + f2(W - ev) + "," + yv + " Z";
      var v = rett(0, 0, W, yv, 0, NOTTE ? nuovaR([[0, "#fffdf0"], [.5, "#ffd66b"], [1, "#f08c00"]], .5, .95, .95) : nuovaR([[0, "#ffe9a3"], [.55, "#f4b02a"], [1, "#b45309"]], .5, .95, .95));
      v += raggiera(cx, yv + 1, 30, 20, "#fff8dc", NOTTE ? .55 : .35, 180, 360);
      v += gemma(cx - 11.2, 15.4, .56, "#f03e3e") + gemma(cx + 11.2, 15.4, .56, "#f03e3e") + gemma(cx, 12.4, 1.02, "#339af0");
      v += stella(cx - 7, 6.2, 1.3, "#ffffff", op(.95)) + stella(cx + 7.6, 8.4, 1, "#ffffff", op(.9)) + stella(cx + 4.4, 3.9, .75, "#ffffff", op(.8)) + stella(cx - 15.4, 9.8, .8, "#ffffff", op(.8)) + stella(cx + 15.6, 11.2, .9, "#ffffff", op(.85));
      v += poly([[W * .12, 0], [W * .3, 0], [W * .1, yv], [-W * .08, yv]], "#ffffff", op(NOTTE ? .08 : .17));   // il riflesso del vetro
      if (NOTTE) r += pth(vetro, "none", "stroke='#fff3bf' stroke-width='3.4' opacity='.45'");   // di notte il vetro acceso si allarga
      r += dentro(vetro, v) + pth(vetro, "none", "stroke='#f8f9fa' stroke-width='1.3'") + pth(vetro, "none", "stroke='" + L + "' stroke-width='.45'");
      r += rett(0, 22.1, W, 1.7, 0, nuova(OTTONE, 0, 0, 0, 1)) + rett(0, 22.1, W, .4, 0, "#fff6cf", op(.9));   // la fascia d'ottone
      // i tre rulli dietro il vetro, nella cornice cromata, con la linea che paga e le frecce
      var bx = 3.1, by = 24.6, bw = W - 6.2, bh = 19, cor = rq(bx, by, bw, bh, 2.4);
      if (NOTTE) r += pth(cor, "none", "stroke='#ffe8a3' stroke-width='2.6' opacity='.4'");
      r += pth(cor, nuova([[0, "#ffffff"], [.45, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1), bordo(L, .7));
      var fx = bx + 1.7, fy = by + 1.6, fw = bw - 3.4, fh = bh - 3.2, fin = rq(fx, fy, fw, fh, 1.2), cy = fy + fh / 2;
      var cr = rulli(fx, fy, fw, fh, [["campana", "sette", "ciliegie"], ["ciliegie", "sette", "campana"], ["campana", "sette", "ciliegie"]], .74, .9);
      cr += tratto("M" + f2(fx) + "," + f2(cy) + " H" + f2(fx + fw), NOTTE ? "#ff5c5c" : "#e03131", NOTTE ? .7 : .55, op(.9));
      cr += poly([[fx + fw * .1, fy], [fx + fw * .27, fy], [fx + fw * .12, fy + fh], [fx - fw * .05, fy + fh]], "#ffffff", op(.13)) + rett(fx, fy, fw, fh * .25, 0, nuova([[0, "#fff", .22], [1, "#fff", 0]], 0, 0, 0, 1));
      r += dentro(fin, cr) + pth(fin, "none", "stroke='#1a1b1f' stroke-width='.6'");
      [[bx + .75, 1], [bx + bw - .75, -1]].forEach(function (f) { r += poly([[f[0] - f[1] * .45, cy - 1.15], [f[0] + f[1] * .85, cy], [f[0] - f[1] * .45, cy + 1.15]], NOTTE ? "#ffd8d8" : "#e03131", bordo(L, .25)); });
      // i crediti (cifre rosse), la bocca delle banconote, la gettoniera cromata
      var ly = 44.7;
      r += rett(4.2, ly, 11.6, 4.2, .8, "#121216", bordo(L, .4)) + led("888", 5.5, ly + .8, 2.6, NOTTE ? "#ff5440" : "#d9302a", NOTTE);
      r += rett(cx - 3.2, ly, 6.4, 4.2, .7, nuova([[0, "#3a3d44"], [1, "#16171b"]], 0, 0, 0, 1), bordo(L, .4)) + rett(cx - 2.4, ly + 1.7, 4.8, .7, .3, NOTTE ? "#8cff9e" : "#2f9e44");
      r += rett(W - 11.4, ly - .3, 7.4, 4.8, 1, nuova([[0, "#ffffff"], [.5, "#ced4da"], [1, "#7d868e"]], 0, 0, 1, 1), bordo(L, .45)) + rett(W - 6.6, ly + .5, .7, 3.2, .3, "#202226") + monetaD(W - 9.1, ly + 2.1, 1.2);
      // la pancia: il pannello d'oro col vetro rosso, la campana e le ciliegie
      var gx = 3, gy = 56, gw = W - 6, gh = 8.8, pan = rq(gx, gy, gw, gh, 1.4);
      r += pth(pan, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .6));
      var px = gx + 1.1, py = gy + 1.1, pw = gw - 2.2, ph = gh - 2.2, pin = rq(px, py, pw, ph, .8);
      var b = rett(px, py, pw, ph, 0, NOTTE ? nuovaR([[0, "#ff9a9a"], [.6, "#d31f2a"], [1, "#6b0a10"]], .5, .5, .7) : nuovaR([[0, "#e0303a"], [.6, "#9b111b"], [1, "#4e070c"]], .5, .5, .7));
      b += raggiera(cx, py + ph / 2, 24, 22, "#ffd43b", NOTTE ? .32 : .17, 0, 360);
      b += simbolo("ciliegie", cx - 10.4, py + ph / 2 + .2, .5) + simbolo("campana", cx, py + ph / 2, .58) + simbolo("ciliegie", cx + 10.4, py + ph / 2 + .2, .5);
      b += poly([[px + pw * .1, py], [px + pw * .24, py], [px + pw * .12, py + ph], [px - pw * .02, py + ph]], "#ffffff", op(.14));
      r += dentro(pin, b) + pth(pin, "none", "stroke='#5c0a0f' stroke-width='.4'");
      r += rett(0, 70.5, W, 2.5, 0, nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1)) + rett(0, 70.5, W, .35, 0, L, op(.5));   // lo zoccolo cromato
      // il bordo cromato tutto intorno e il lucido della lacca
      var ed = bordoArco(W, H, RZ, .9);
      r += tratto(ed, "#f8f9fa", 1.2, op(.95)) + tratto(ed, "#7d868e", .35, sp(.5, .4));
      r += rett(0, 0, W, H, 0, nuova([[0, "#fff", .12], [.45, "#fff", 0]], 0, 0, 1, 1));
      return T.su(r);
    }
    function dietro(T) {   // la schiena: lo sportello di servizio con la serratura, le prese d'aria, l'etichetta
      var W = T.W, H = T.H, r = "", y;
      r += rett(0, 0, W, H, 0, nuova([[0, "#000", 0], [1, "#000", .15]], 0, 0, 0, 1));
      r += pth(rq(4.5, 17, W - 9, 48, 2), "none", "stroke='#5a0a10' stroke-width='1.1'") + pth(rq(5.2, 17.7, W - 10.4, 46.6, 1.6), "none", "stroke='#ee6a72' stroke-width='.45' opacity='.55'");
      r += cer(W - 8.6, 41, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4)) + rett(W - 8.8, 40.4, .4, 1.2, 0, "#3d4349");
      for (y = 21; y < 31; y += 1.8) r += rett(9, y, W - 18, .8, .4, "#3a050a");
      r += rett(8.5, 52, 10, 6.5, .5, "#f1ece2") + rett(9.5, 53.2, 5, .6, 0, "#868e96") + rett(9.5, 54.6, 8, .5, 0, "#adb5bd") + rett(9.5, 55.8, 6.5, .5, 0, "#adb5bd");
      r += rett(0, 70.5, W, 2.5, 0, nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1));
      var ed = bordoArco(W, H, RZ, .9);
      return T.su(r + tratto(ed, "#f8f9fa", 1, op(.8)));
    }
    function fascia(H) {   // i fianchi laccati: il filetto d'oro con la stella, il bordo cromato vicino al davanti, il lucido
      var o = "", av = G > 0 ? A1 : A0, X0 = 61 * B0, X1 = 61 * B1;
      o += suA(av, pth(rq(X0 + 3.4, -93, X1 - X0 - 6.8, 48, 3), "none", "stroke='#f2c94c' stroke-width='.9'") + pth(rq(X0 + 4.4, -92, X1 - X0 - 8.8, 46, 2.4), "none", "stroke='#6e0b12' stroke-width='.45' opacity='.7'") +
        stella5(61 * (B0 + B1) / 2, -70, 4.4, nuova(OTTONE, 0, 0, 1, 1), bordo("#7a4a00", .45)));
      o += tratto(aperto(H.sez(G > 0 ? B1 - .022 : B0 + .022)), "#f8f9fa", 1.1, op(.9)) + tratto(aperto(H.sez(G > 0 ? B1 - .036 : B0 + .036)), "#6e0b12", .45, op(.6));
      return o + H.luccica(.5, .08, .92);
    }
    var corpoS = estruso("b", PROF, B0, B1, ROSSO, { mat: { lucido: .7, esp: 22 }, tappo: G > 0 ? davanti : dietro, fascia: fascia, lw: 2.4 });
    var sporge = vassoio(-.25, .25, B1, B1 + .15, 38.4, 45.6, 7, 9) + pulsantiera(A0 + .025, A1 - .025, B1, B1 + .12, 61.8, 58.4, 55.4, [[2.6, 4.4, "#f8f9fa"], [8, 4.4, "#ffd43b"], [13.4, 4.4, "#4dabf7"], [19, 5.6, "#ff922b"], [27.2, 6.8, "#f03e3e", 1]]);
    var s = ombraPianta(A0, A1, B0, B1 + .15, 1, .06), lev = leva(A1, -.05, 77, 1), bs = base(A0 + .006, A1 - .006, B0 + .012, B1 - .014, Z0);
    if (G > 0) s += bs + corpoS + sporge + lev;
    else s += sporge + lev + bs + corpoS + cavo(.12, B0 + .012, 8);
    return s + candela(0, (B0 + B1) / 2, ZT - .5, "#f03e3e", "#f8f9fa", 1);
  });

  // ---------- altri disegni piccoli: la corona, i semi e le carte, le lettere dell'insegna ----------
  function corona(x, y, k) {   // la corona d'oro con le perle e le gemme (larga 17·k)
    var d = "M-7.6,4.4 L-8.4,-3.6 L-4.2,0 L0,-6.2 L4.2,0 L8.4,-3.6 L7.6,4.4 Z";
    var o = pth(d, lin("crn", ORO_S, 0, 0, 1, 1), bordo(L, .7)) + rett(-8, 3.2, 16, 2.9, .8, lin("crb", ORO_S, 0, 0, 0, 1), bordo(L, .6));
    [[-8.4, -3.6], [0, -6.2], [8.4, -3.6]].forEach(function (c) { o += cer(c[0], c[1] - .9, 1.25, "#fff8e6", bordo(L, .4)) + cer(c[0] - .35, c[1] - 1.3, .4, "#ffffff"); });
    o += cer(0, 4.65, 1.05, "#e03131", bordo(L, .3)) + cer(-4.6, 4.65, .8, "#4dabf7", bordo(L, .3)) + cer(4.6, 4.65, .8, "#4dabf7", bordo(L, .3));
    o += tratto("M-6.5,2.4 L-7,-1.2", "#fff8d6", .7, op(.75)) + tratto("M-1.6,1.5 L-.4,-3.4", "#fff8d6", .6, op(.6));
    return g0(x, y, k, o);
  }
  function semeD(t, x, y, k, col) {   // i semi delle carte (alti 10·k): cuori, quadri, picche, fiori
    var d;
    if (t === "cuori") d = pth("M0,4.6 C-1.6,3 -5,1 -5,-1.6 C-5,-3.6 -3.6,-4.8 -2.3,-4.8 C-1.2,-4.8 -.4,-4.1 0,-3.1 C.4,-4.1 1.2,-4.8 2.3,-4.8 C3.6,-4.8 5,-3.6 5,-1.6 C5,1 1.6,3 0,4.6 Z", col);
    else if (t === "quadri") d = pth("M0,-5 L3.7,0 L0,5 L-3.7,0 Z", col);
    else if (t === "picche") d = pth("M0,-5 C1.4,-3 4.8,-1.2 4.8,1.4 C4.8,3 3.6,3.9 2.4,3.9 C1.5,3.9 .8,3.4 .5,2.8 C.6,3.9 1.1,4.6 1.8,5 L-1.8,5 C-1.1,4.6 -.6,3.9 -.5,2.8 C-.8,3.4 -1.5,3.9 -2.4,3.9 C-3.6,3.9 -4.8,3 -4.8,1.4 C-4.8,-1.2 -1.4,-3 0,-5 Z", col);
    else d = cer(0, -2.5, 2.2, col) + cer(-2.4, 1, 2.2, col) + cer(2.4, 1, 2.2, col) + pth("M-.5,1 C-.5,3 -1,4.3 -1.9,5 L1.9,5 C1,4.3 .5,3 .5,1 Z", col);
    return g0(x, y, k, d);
  }
  function carta(x, y, w, h, seme, tenuta) {   // una carta: il seme grande in mezzo, i segni piccoli negli angoli; "tieni" = la striscia gialla sopra
    var col = seme === "cuori" || seme === "quadri" ? "#e03131" : "#1b1b22";
    var o = rett(x + .3, y + .35, w, h, .7, "#000", op(.3)) + rett(x, y, w, h, .7, "#ffffff", "stroke='#adb5bd' stroke-width='.25'");
    o += semeD(seme, x + w / 2, y + h / 2 + .3, w * .085, col);
    o += rett(x + .7, y + .7, .8, 1.3, .2, col) + semeD(seme, x + 1.1, y + 2.9, .09, col) + rett(x + w - 1.5, y + h - 2, .8, 1.3, .2, col);
    if (tenuta) o += rett(x, y - 1.7, w, 1.15, .45, NOTTE ? "#fff3a0" : "#ffd43b");
    return o;
  }
  // le lettere grosse dell'insegna: tratti in un riquadro alto 10 ([tracciato, larghezza])
  var LETTERE = {
    J: ["M1.2,0 H6 M4.8,0 V6.6 C4.8,9.2 3.5,10 2.3,10 C1.1,10 .2,9.3 0,7.9", 6],
    A: ["M0,10 L3.3,0 L6.6,10 M1.4,6.4 H5.2", 6.6],
    C: ["M6.2,1.9 C5.4,.6 4.4,0 3.3,0 C-1,0 -1,10 3.3,10 C4.4,10 5.4,9.4 6.2,8.1", 6.2],
    K: ["M0,0 V10 M6.2,0 L.5,6.1 M2.4,4.1 L6.4,10", 6.4],
    P: ["M0,10 V0 H3.5 C6.4,0 6.4,5.5 3.5,5.5 H0", 6.1],
    O: ["M3.3,0 C7.6,0 7.6,10 3.3,10 C-1,10 -1,0 3.3,0 Z", 6.6],
    T: ["M0,0 H6.6 M3.3,0 V10", 6.6]
  };
  function trasla(d, dx, dy, k) {   // un tracciato spostato e ingrandito
    return d.replace(/([MLHVQCZ])([^MLHVQCZ]*)/g, function (_, c, nn) {
      var v = nn.trim() ? nn.trim().split(/[\s,]+/).map(Number) : [];
      if (c === "H") return "H" + v.map(function (x) { return f1(dx + x * k); }).join(" ") + " ";
      if (c === "V") return "V" + v.map(function (y) { return f1(dy + y * k); }).join(" ") + " ";
      return c + v.map(function (n, i) { return f1(i % 2 ? dy + n * k : dx + n * k); }).join(" ") + " ";
    });
  }
  function scritta(testo, x, y, alt, spazio) { var k = alt / 10, d = "", px = x; testo.split("").forEach(function (ch) { var l = LETTERE[ch]; if (l) { d += trasla(l[0], px, y, k); px += (l[1] + spazio) * k; } }); return d; }
  function larghezza(testo, alt, spazio) { var k = alt / 10, w = 0; testo.split("").forEach(function (ch, i) { var l = LETTERE[ch]; if (l) w += l[1] * k + (i ? spazio * k : 0); }); return w; }

  // =========================================================
  //  SLOT MACHINE VIDEO (moderna): il mobile nero lucido col grande schermo curvo che sale dalla pulsantiera e si
  //  raddrizza in alto (il gioco con le gemme, la moneta d'oro e la riga vincente dei rubini), le strisce di luce lungo
  //  i bordi (dal rosa all'azzurro), la barra di luce in cima, la pulsantiera nera coi tasti colorati e il grande tasto
  //  tondo, la stampante dei biglietti e la bocca delle banconote, la pancia viola illuminata e la base con la luce sotto.
  //  Dietro: il retro nero con lo sportello, le prese d'aria, l'etichetta e il filo
  // =========================================================
  def("slot_video", { tipo: "piedi", nome: "Slot machine video", fp: [1, 1], box: [-38, -159, 39, 18], dietro: true, luce: [0, .14, 92, 72, "#b48cff"] }, function () {
    var A0 = -.32, A1 = .32, B0 = -.33, BF = .3, I0 = A0 + .045, I1 = A1 - .045, NERO = "#2a2535", i;
    var S0 = [.285, 63.6], CC = [.05, 77], S1 = [.035, 124], N = 10, CUR = [];   // lo schermo curvo: una curva da S0 (in basso, inclinato) a S1 (in alto, dritto)
    for (i = 0; i <= N; i++) { var t = i / N; CUR.push([(1 - t) * (1 - t) * S0[0] + 2 * (1 - t) * t * CC[0] + t * t * S1[0], (1 - t) * (1 - t) * S0[1] + 2 * (1 - t) * t * CC[1] + t * t * S1[1]]); }
    var PR = [[B0, 30], [BF, 30], [BF, 59.6]].concat(CUR).concat([[.03, 127.4], [-.16, 127.4], [B0, 103]]);   // il fianco: (b, z)
    function schermoV(W, H) {   // il gioco sullo schermo (piatto, W × H, dall'alto in basso)
      var r = rett(-.5, -.5, W + 1, H + 1, 0, "#09080d"), x0 = 1.3, w = W - 2.6, y0 = 1.5, h = H - 3, sc = rq(x0, y0, w, h, 1.4), c = "", rr = rnd(77), j;
      c += rett(x0, y0, w, h, 0, NOTTE ? nuova([[0, "#8a3ad6"], [.3, "#43208a"], [.65, "#1d1258"], [1, "#0e1650"]], 0, 0, 0, 1) : nuova([[0, "#5a189a"], [.3, "#2d1263"], [.65, "#160c3d"], [1, "#0a0f33"]], 0, 0, 0, 1));
      for (i = 0; i < 18; i++) c += stella(x0 + rr() * w, y0 + rr() * h * .3, .4 + rr() * .6, "#ffffff", op(.4 + rr() * .5));   // le stelline del cielo
      var cx = W / 2, ly = y0 + h * .155;   // il marchio del gioco: la raggiera, la grande moneta d'oro, le due gemme rosa
      c += raggiera(cx, ly, 34, 28, "#ffc9ff", NOTTE ? .3 : .17, 0, 360) + cer(cx, ly, 10, nuovaR([[0, "#ffe066", .75], [1, "#ffe066", 0]], .5, .5, .5));
      c += gemma(cx - 10.2, ly + 1.2, .58, "#ff4f9a") + gemma(cx + 10.2, ly + 1.2, .58, "#ff4f9a") + monetaD(cx, ly, 5.8);
      c += rett(x0 + 2, y0 + h * .285, w - 4, .9, .45, "#ffd43b") + rett(x0 + 2, y0 + h * .285, w - 4, .3, .15, "#fff3bf");
      // la griglia 5 × 3 coi simboli e la riga vincente dei rubini
      var gx = x0 + 1.3, gy = y0 + h * .33, gw = w - 2.6, gh = h * .46, cw = gw / 5, ch = gh / 3, k = Math.min(cw, ch) * .088;
      var GR = [["zaffiro", "moneta", "smeraldo", "stella", "ametista"], ["rubino", "rubino", "rubino", "rubino", "zaffiro"], ["stella", "smeraldo", "moneta", "topazio", "rubino"]];
      c += rett(gx - .7, gy - .7, gw + 1.4, gh + 1.4, 1, nuova(OTTONE, 0, 0, 0, 1)) + rett(gx, gy, gw, gh, 0, "#120a2a");
      for (i = 0; i < 3; i++) for (j = 0; j < 5; j++) {
        c += rett(gx + cw * j + .25, gy + ch * i + .25, cw - .5, ch - .5, .6, NOTTE ? lin("cel", [[0, "#3c2585"], [1, "#1d1150"]], 0, 0, 0, 1) : lin("cel", [[0, "#2c1a66"], [1, "#160c3d"]], 0, 0, 0, 1));
        c += simbolo(GR[i][j], gx + cw * (j + .5), gy + ch * (i + .5), k);
      }
      c += (NOTTE ? pth(rq(gx - .3, gy + ch - .3, cw * 4 + .6, ch + .6, 1.2), "none", "stroke='#ffe066' stroke-width='1.8' opacity='.35'") : "") + pth(rq(gx + .1, gy + ch + .1, cw * 4 - .2, ch - .2, .9), "none", "stroke='#ffe066' stroke-width='" + (NOTTE ? 1 : .7) + "'");
      var my = y0 + h * .83, mw = (w - 3) / 3;   // i tre contatori in basso e il tasto sullo schermo
      for (i = 0; i < 3; i++) { var bx = x0 + 1.5 + i * mw; c += rett(bx + .3, my, mw - .6, 4, .7, "#0b0a12", "stroke='#5f3dc4' stroke-width='.35'") + led("888", bx + mw / 2 - ledL("888", 2.2) / 2, my + .9, 2.2, ["#ffd43b", "#69db7c", "#74c0fc"][i], NOTTE); }
      c += rett(x0 + w * .3, y0 + h * .925, w * .4, 2.2, 1.1, nuova([[0, "#b197fc"], [1, "#6741d9"]], 0, 0, 0, 1));
      c += rett(x0, y0, w, h, 0, nuova([[0, "#fff", .08], [.25, "#fff", 0], [.8, "#fff", 0], [1, "#fff", .12]], 0, 0, 0, 1));   // il vetro
      return r + dentro(sc, c) + pth(sc, "none", "stroke='#3b2a6b' stroke-width='.5'");
    }
    function schermoCurvo() {   // lo schermo steso sulla curva a fettine (lo stesso disegno, ogni fettina la sua parte)
      var Ws = (I1 - I0) * 61, lens = [], tot = 0, o = "", sopra = 0, h;
      for (i = 0; i < N; i++) { h = Math.sqrt(Math.pow((CUR[i + 1][0] - CUR[i][0]) * 61, 2) + Math.pow(CUR[i + 1][1] - CUR[i][1], 2)); lens.push(h); tot += h; }
      var cont = schermoV(Ws, tot);
      DEFS.push("<g id='" + p + "scr'>" + cont + "</g>");
      for (i = N - 1; i >= 0; i--) {
        var lo = CUR[i], hi = CUR[i + 1]; h = lens[i];
        o += piano(P(I0, hi[0], hi[1]), P(I1, hi[0], hi[1]), P(I0, lo[0], lo[1]), Ws, h, dentro("M0,-.3 H" + f2(Ws) + " V" + f2(h + .3) + " H0 Z", "<use href='#" + p + "scr' xlink:href='#" + p + "scr' transform='translate(0 " + f2(-sopra) + ")'/>"));
        sopra += h;
      }
      var low = CUR.slice(0, 5), pp = low.map(function (c) { return P(I0, c[0], c[1]); }).concat(low.slice().reverse().map(function (c) { return P(I1, c[0], c[1]); }));
      o += pth(chiuso(pp), "#ffffff", op(NOTTE ? .04 : .08));   // la luce sul vetro dove lo schermo guarda in su
      if (NOTTE) {   // di notte lo schermo acceso si allarga un po' oltre il bordo
        var giroS = CUR.map(function (c) { return P(I0, c[0], c[1]); }).concat(CUR.slice().reverse().map(function (c) { return P(I1, c[0], c[1]); }));
        o += pth(chiuso(giroS), "none", "stroke='#d0bfff' stroke-width='2.4' opacity='.4'");
      }
      return o;
    }
    function ledBordi() {   // le strisce di luce lungo i due bordi davanti, dal rosa all'azzurro
      var o = "", pp0 = [[BF + .004, 31], [BF + .004, 59.6]].concat(CUR.map(function (c) { return [c[0] + .004, c[1]]; })).concat([[.034, 127.2]]);
      [A0 + .018, A1 - .018].forEach(function (a) {
        var pp = pp0.map(function (v) { return P(a, v[0], v[1]); }), d = aperto(pp);
        var gr = lin("lb", [[0, "#ff4fd8"], [.5, "#b48cff"], [1, "#4dd9ff"]], 0, pp[0][1], 0, pp[pp.length - 1][1], true);
        o += NOTTE ? tratto(d, gr, 3.6, op(.4)) + tratto(d, gr, 1.6) + tratto(d, "#ffffff", .5, op(.85)) : tratto(d, gr, 1.5, op(.95)) + tratto(d, "#ffffff", .35, op(.5));
      });
      var dt = linea(P(A0 + .02, .03, 127.6), P(A1 - .02, .03, 127.6)), g2 = lin("lbs", [[0, "#ff4fd8"], [1, "#4dd9ff"]], P(A0, .03, 0)[0], 0, P(A1, .03, 0)[0], 0, true);   // la barra di luce in cima
      return o + (NOTTE ? tratto(dt, g2, 3.8, op(.45)) + tratto(dt, g2, 1.7) + tratto(dt, "#ffffff", .55) : tratto(dt, g2, 1.6) + tratto(dt, "#ffffff", .35, op(.5)));
    }
    function pancia() {   // sotto la pulsantiera: la stampante e la bocca delle banconote, la pancia viola illuminata (X = a·61, Y = −z)
      var x0 = A0 * 61, w = (A1 - A0) * 61, r = "";
      r += rett(x0 + 3.6, -55.8, 10, 3.6, .7, "#0f0e13", bordo(L, .4)) + rett(x0 + 4.6, -54.4, 8, .8, .4, NOTTE ? "#99e9f2" : "#22b8cf");
      r += rett(-x0 - 13.6, -55.8, 10, 3.6, .7, "#0f0e13", bordo(L, .4)) + rett(-x0 - 12.6, -54.4, 8, .8, .4, NOTTE ? "#b2f2bb" : "#37b24d");
      var bx = x0 + 3, by = -50.6, bw = w - 6, bh = 17.6, pan = rq(bx, by, bw, bh, 2.2);
      var c = rett(bx, by, bw, bh, 0, NOTTE ? nuovaR([[0, "#ffe3ff"], [.45, "#cc5de8"], [1, "#3c0e5c"]], .5, .55, .75) : nuovaR([[0, "#b55ad8"], [.55, "#6a1b9a"], [1, "#2b0a40"]], .5, .55, .75));
      c += raggiera(0, by + bh * .55, 30, 24, "#ffd6ff", NOTTE ? .35 : .18, 0, 360);
      c += gemma(-9.6, by + bh * .55, .64, "#ff4f9a") + gemma(9.6, by + bh * .55, .64, "#20c997") + monetaD(0, by + bh * .5, 4.8);
      c += stella(-12.4, by + 3.4, 1.1, "#ffffff", op(.9)) + stella(12.8, by + 4.2, .9, "#ffffff", op(.85)) + stella(5.6, by + bh - 2.8, .8, "#ffffff", op(.8));
      c += poly([[bx + bw * .08, by], [bx + bw * .22, by], [bx + bw * .1, by + bh], [bx - bw * .04, by + bh]], "#ffffff", op(.12));
      r += dentro(pan, c) + pth(pan, "none", "stroke='" + (NOTTE ? "#f3d9fa" : "#b197fc") + "' stroke-width='.8'") + pth(pan, "none", bordo(L, .35));
      return suB(BF, r);
    }
    function arteF() {   // il fianco nero lucido con la striscia di luce lungo il bordo davanti (X = b·61, Y = −z)
      var pp = [[BF - .035, 32], [BF - .035, 59]].concat(CUR.map(function (c) { return [c[0] - .035, c[1]]; })).concat([[-.005, 125.6]]);
      var d = aperto(pp.map(function (v) { return [v[0] * 61, -v[1]]; })), gr = lin("lfa", [[0, "#ff4fd8"], [.5, "#b48cff"], [1, "#4dd9ff"]], 0, -32, 0, -125, true);
      var o = NOTTE ? tratto(d, gr, 3.6, op(.4)) + tratto(d, gr, 1.5) + tratto(d, "#ffffff", .45, op(.9)) : tratto(d, gr, 1.4, op(.95)) + tratto(d, "#ffffff", .3, op(.45));
      return o + poly([[-14, -130], [-6, -130], [-17, -28], [-25, -28]], "#ffffff", op(.06)) + poly([[-2, -130], [0, -130], [-11, -28], [-13, -28]], "#ffffff", op(.08));   // il lucido della lacca
    }
    function retro() {   // il retro nero: lo sportello, le prese d'aria, la serratura e l'etichetta (X = a·61, Y = −z)
      var x0 = A0 * 61, w = (A1 - A0) * 61, r = "", y;
      r += pth(rq(x0 + 4, -98, w - 8, 60, 2), "none", "stroke='#060508' stroke-width='1'") + pth(rq(x0 + 4.7, -97.3, w - 9.4, 58.6, 1.6), "none", "stroke='#5a5368' stroke-width='.45' opacity='.7'");
      for (y = -94; y < -83; y += 1.8) r += rett(x0 + 8, y, w - 16, .8, .4, "#050407");
      r += cer(-x0 - 8.5, -66, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4));
      r += rett(x0 + 8, -52, 10, 6.5, .5, "#f1ece2") + rett(x0 + 9, -50.8, 5, .6, 0, "#868e96") + rett(x0 + 9, -49.4, 8, .5, 0, "#adb5bd") + rett(x0 + 9, -48.2, 6.5, .5, 0, "#adb5bd");
      return suB(B0, r);
    }
    function plinto(W, H) { return lucidoPiano(W, H, .6) + rett(0, 0, W, 1.2, 0, "#868e96") + rett(0, H - 5.4, W, 1.2, .6, NOTTE ? "#c5f6fa" : "#15aabf", NOTTE ? "" : op(.8)) + (NOTTE ? rett(0, H - 6.6, W, 3.6, 1.4, "#66d9e8", op(.35)) : ""); }
    function plintoD(W, H) { var y, r = lucidoPiano(W, H, .5) + rett(0, 0, W, 1.2, 0, "#868e96"); for (y = 7; y < 15; y += 1.8) r += rett(W * .25, y, W * .5, .8, .4, "#08070b"); return r; }
    function insegnaV(W, H) {   // il cartello luminoso in cima (il marchio del gioco): la moneta d'oro tra due gemme, le lampadine intorno
      var pan = rq(1.4, 1.4, W - 2.8, H - 2.8, 1.6), c = rett(0, 0, W, H, 0, NOTTE ? nuovaR([[0, "#ffd8ff"], [.4, "#c13fe0"], [1, "#3b0d63"]], .5, .55, .7) : nuovaR([[0, "#d47cf0"], [.45, "#7b1fa2"], [1, "#2b0a40"]], .5, .55, .7));
      c += raggiera(W / 2, H * .55, 26, 26, "#ffe3ff", NOTTE ? .38 : .2, 0, 360);
      c += gemma(W / 2 - 9.6, H * .56, .55, "#ff4f9a") + gemma(W / 2 + 9.6, H * .56, .55, "#20c997") + monetaD(W / 2, H * .52, 5.2);
      c += stella(5.4, 4.6, .9, "#ffffff", op(.9)) + stella(W - 5.2, H - 4.4, .8, "#ffffff", op(.85)) + rett(0, 0, W, H * .45, 0, "#ffffff", op(NOTTE ? .06 : .1));
      return rett(0, 0, W, H, 0, "#17141e") + dentro(pan, c) + pth(pan, "none", "stroke='" + (NOTTE ? "#f3d9fa" : "#b197fc") + "' stroke-width='.7'") +
        lampadine(lungoRett(1.4, 1.4, W - 2.8, H - 2.8, 3.6), .62, ["#fff3bf", "#ff8cc6", "#fff3bf", "#74e0ff"]);
    }
    function insegnaF(W, H) { return lucidoPiano(W, H, .5) + rett(0, H - 2.2, W, 1.1, .5, NOTTE ? "#e5dbff" : "#b48cff", NOTTE ? "" : op(.9)) + rett(0, 1, W, 1.1, .5, NOTTE ? "#c5f6fa" : "#4dd9ff", NOTTE ? "" : op(.9)); }
    function insegnaD(W, H) { var y, r = lucidoPiano(W, H, .4); for (y = 4; y < H - 3; y += 1.8) r += rett(W * .3, y, W * .4, .8, .4, "#08070b"); return r; }
    var cima = blocco(A0 + .03, A1 - .03, -.15, .02, 127.4, 145, NERO, { davanti: insegnaV, dietro: insegnaD, fianco: insegnaF }, 2.2);   // il cartello in cima
    var s = ombraPianta(A0, A1, B0, .43, 1, .06);
    var ped = blocco(A0 + .02, A1 - .02, B0 + .02, BF - .03, 0, 30, NERO, { davanti: plinto, dietro: plintoD, fianco: plinto }, 2.2);
    var cassa = lastra(PR, A0, A1, { col: NERO, mat: { lucido: .8, esp: 26 }, faccia: nuova([[0, "#4a4259"], [1, "#1c1924"]], 0, 0, 0, 1), fuori: G > 0 ? A1 : A0, arte: arteF, lw: 2.4 });
    var deck = pulsantiera(A0 + .02, A1 - .02, BF, BF + .13, 62.4, 59.2, 56.2, [[2.3, 3.7, "#ff6b6b"], [6.7, 3.7, "#ffa94d"], [11.1, 3.7, "#ffe066"], [15.5, 3.7, "#8ce99a"], [19.9, 3.7, "#74c0fc"], [25.4, 9.2, "#22d3c5", 1]],
      { col: "#2c2836", f0: "#4a4458", f1: "#17151c", p0: "#2d2a36", p1: "#121016", orlo: "#7048e8", orlo2: "#d0bfff" });
    if (G > 0) s += ped + cassa + cima + schermoCurvo() + ledBordi() + pancia() + deck;
    else s += deck + ped + cassa + cima + retro() + cavo(.1, B0 + .02, 8);
    return s;
  });

  // =========================================================
  //  SLOT DEL JACKPOT: la slot blu e oro col montepremi; sopra il cartello alto ad arco con la cornice d'oro piena di
  //  lampadine, la corona, le cifre rosse del jackpot e la pila di monete; sotto i rulli coi tre diamanti blu, i crediti,
  //  la pulsantiera, la pancia con le monete e il vassoio, sulla base nera e oro. Dietro: gli sportelli e le prese d'aria
  // =========================================================
  def("slot_jackpot", { tipo: "piedi", nome: "Slot del jackpot", fp: [1, 1], box: [-38, -178, 37, 19], dietro: true, luce: [0, -.05, 137, 82, "#ffd25e"] }, function () {
    var A0 = -.33, A1 = .33, B0 = -.35, B1 = .21, Z0 = 36, ZC = 104, BLU = "#2346c8", TB0 = -.25, TB1 = .09, TA = .318, TZ = 150, TR = 17;
    var TPROF = [[-TA, ZC], [TA, ZC]].concat(arcoS(0, TZ, TA, TR, 0, Math.PI, 22));   // il cartello: (a, z)
    var CRO = nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1);
    function davanti(W, H) {   // il davanti del mobile (piatto, W × 68: y = 104 − z)
      var cx = W / 2, r = "";
      var vt = rq(2.6, 2.2, W - 5.2, 13.6, 1.8);   // il vetro di sopra: la raggiera e i tre diamanti blu
      var v = rett(0, 0, W, 17, 0, NOTTE ? nuovaR([[0, "#fffbe6"], [.6, "#ffd36b"], [1, "#e8890c"]], .5, .6, .8) : nuovaR([[0, "#ffe7a0"], [.6, "#f1ac2a"], [1, "#a85a07"]], .5, .6, .8));
      v += raggiera(cx, 9.2, 26, 22, "#fff8dc", NOTTE ? .5 : .3, 0, 360) + gemma(cx - 10.6, 9.6, .64, "#339af0") + gemma(cx + 10.6, 9.6, .64, "#339af0") + gemma(cx, 9, .84, "#339af0");
      v += stella(cx - 5.6, 4.4, 1, "#ffffff", op(.9)) + stella(cx + 6.2, 13.4, .8, "#ffffff", op(.85)) + stella(cx + 15.6, 4.6, .7, "#ffffff", op(.8)) + stella(cx - 15.4, 13.4, .7, "#ffffff", op(.8));
      v += poly([[W * .1, 0], [W * .26, 0], [W * .14, 17], [-W * .02, 17]], "#ffffff", op(NOTTE ? .07 : .15));
      if (NOTTE) r += pth(vt, "none", "stroke='#fff3bf' stroke-width='3.2' opacity='.45'");
      r += dentro(vt, v) + pth(vt, "none", "stroke='#ffe8a3' stroke-width='1.1'") + pth(vt, "none", bordo(L, .45));
      r += rett(0, 16.9, W, 1.7, 0, nuova(OTTONE, 0, 0, 0, 1)) + rett(0, 16.9, W, .4, 0, "#fff6cf", op(.9));
      var bx = 3.1, by = 19.6, bw = W - 6.2, bh = 18.4, cor = rq(bx, by, bw, bh, 2.2);   // i rulli nella cornice d'oro
      if (NOTTE) r += pth(cor, "none", "stroke='#ffe8a3' stroke-width='2.6' opacity='.4'");
      r += pth(cor, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .7));
      var fx = bx + 1.6, fy = by + 1.5, fw = bw - 3.2, fh = bh - 3, fin = rq(fx, fy, fw, fh, 1.1), cy = fy + fh / 2;
      var cr = rulli(fx, fy, fw, fh, [["sette", "diamante", "campana"], ["ciliegie", "diamante", "ferro"], ["sette", "diamante", "campana"]], .72, .9);
      cr += tratto("M" + f2(fx) + "," + f2(cy) + " H" + f2(fx + fw), NOTTE ? "#ff5c5c" : "#e03131", NOTTE ? .7 : .55, op(.9));
      cr += poly([[fx + fw * .1, fy], [fx + fw * .27, fy], [fx + fw * .12, fy + fh], [fx - fw * .05, fy + fh]], "#ffffff", op(.13)) + rett(fx, fy, fw, fh * .25, 0, nuova([[0, "#fff", .22], [1, "#fff", 0]], 0, 0, 0, 1));
      r += dentro(fin, cr) + pth(fin, "none", "stroke='#1a1b1f' stroke-width='.6'");
      [[bx + .75, 1], [bx + bw - .75, -1]].forEach(function (f) { r += poly([[f[0] - f[1] * .45, cy - 1.15], [f[0] + f[1] * .85, cy], [f[0] - f[1] * .45, cy + 1.15]], NOTTE ? "#ffd8d8" : "#e03131", bordo(L, .25)); });
      var ly = 38.9;   // i crediti, la bocca delle banconote, la gettoniera
      r += rett(4.2, ly, 11.6, 4, .8, "#121216", bordo(L, .4)) + led("888", 5.5, ly + .7, 2.5, NOTTE ? "#ff5440" : "#d9302a", NOTTE);
      r += rett(cx - 3.2, ly, 6.4, 4, .7, nuova([[0, "#3a3d44"], [1, "#16171b"]], 0, 0, 0, 1), bordo(L, .4)) + rett(cx - 2.4, ly + 1.6, 4.8, .7, .3, NOTTE ? "#8cff9e" : "#2f9e44");
      r += rett(W - 11.4, ly - .3, 7.4, 4.6, 1, nuova([[0, "#fff6cf"], [.5, "#f3d27a"], [1, "#a8781a"]], 0, 0, 1, 1), bordo(L, .45)) + rett(W - 6.6, ly + .5, .7, 3, .3, "#202226") + monetaD(W - 9.1, ly + 2, 1.15);
      var gx = 3, gy = 50.7, gw = W - 6, gh = 8.4, pan = rq(gx, gy, gw, gh, 1.4);   // la pancia blu e oro con le tre monete
      r += pth(pan, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .6));
      var px = gx + 1.1, py = gy + 1.1, pw = gw - 2.2, ph = gh - 2.2, pin = rq(px, py, pw, ph, .8);
      var b = rett(px, py, pw, ph, 0, NOTTE ? nuovaR([[0, "#91a7ff"], [.6, "#2f4fd6"], [1, "#0b1a6b"]], .5, .5, .7) : nuovaR([[0, "#4263eb"], [.6, "#1c3aa9"], [1, "#0a1650"]], .5, .5, .7));
      b += raggiera(cx, py + ph / 2, 24, 22, "#ffd43b", NOTTE ? .32 : .17, 0, 360) + monetaD(cx - 9.4, py + ph / 2, 2.3) + monetaD(cx + 9.4, py + ph / 2, 2.3) + monetaD(cx, py + ph / 2 - .1, 2.8);
      b += poly([[px + pw * .1, py], [px + pw * .24, py], [px + pw * .12, py + ph], [px - pw * .02, py + ph]], "#ffffff", op(.14));
      r += dentro(pin, b) + pth(pin, "none", "stroke='#0a1650' stroke-width='.4'");
      r += rett(0, 65.5, W, 2.5, 0, CRO) + rett(0, 65.5, W, .35, 0, L, op(.5));
      return r + rett(0, 0, W, H, 0, nuova([[0, "#fff", .1], [.45, "#fff", 0]], 0, 0, 1, 1));
    }
    function dietro(W, H) {   // la schiena: lo sportello, le prese d'aria, la serratura, l'etichetta
      var r = "", y;
      r += pth(rq(4.5, 5, W - 9, 52, 2), "none", "stroke='#0c1a5a' stroke-width='1.1'") + pth(rq(5.2, 5.7, W - 10.4, 50.6, 1.6), "none", "stroke='#748ffc' stroke-width='.45' opacity='.55'");
      for (y = 9; y < 19; y += 1.8) r += rett(9, y, W - 18, .8, .4, "#0a1238");
      r += cer(W - 8.6, 31, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4)) + rett(8.5, 42, 10, 6.5, .5, "#f1ece2") + rett(9.5, 43.2, 5, .6, 0, "#868e96") + rett(9.5, 44.6, 8, .5, 0, "#adb5bd") + rett(9.5, 45.8, 6.5, .5, 0, "#adb5bd");
      return r + rett(0, H - 2.5, W, 2.5, 0, CRO) + lucidoPiano(W, H, .4);
    }
    function fianco(W, H) {   // il fianco blu: il filetto d'oro con la stella, il lucido
      return pth(rq(3.2, 4, W - 6.4, H - 11, 3), "none", "stroke='#f2c94c' stroke-width='.9'") + pth(rq(4.2, 5, W - 8.4, H - 13, 2.4), "none", "stroke='#0a1650' stroke-width='.45' opacity='.7'") +
        stella5(W / 2, H * .42, 4.4, nuova(OTTONE, 0, 0, 1, 1), bordo("#7a4a00", .45)) + lucidoPiano(W, H, .6) + rett(0, H - 2.5, W, 2.5, 0, CRO);
    }
    function insegna(T) {   // il cartello del montepremi (piatto, W × 63: y = 167 − z)
      var W = T.W, H = T.H, cx = W / 2, r = "", i;
      r += rett(0, 0, W, H, 0, NOTTE ? nuovaR([[0, "#ff8f8f"], [.55, "#cc1822"], [1, "#4a0508"]], .5, .45, .8) : nuovaR([[0, "#e5383b"], [.55, "#8f0d14"], [1, "#3a0406"]], .5, .45, .8));
      r += raggiera(cx, 30, 54, 30, "#ffd6a5", NOTTE ? .3 : .15, 0, 360);
      r += cer(cx, 13, 9, nuovaR([[0, "#ffe066", NOTTE ? .7 : .45], [1, "#ffe066", 0]], .5, .5, .5)) + corona(cx, 13.2, 1.12);
      var hL = 5.6, mw = ledL("888888", hL) + 3.6, mh = hL + 3.6, mx = cx - mw / 2, my = 23.6;   // le cifre del montepremi nella finestra nera
      r += pth(rq(mx - 1.2, my - 1.2, mw + 2.4, mh + 2.4, 2), nuova(OTTONE, 0, 0, 0, 1), bordo(L, .6)) + pth(rq(mx, my, mw, mh, 1.3), "#0b0506");
      r += led("888.888", mx + 1.8, my + 1.8, hL, NOTTE ? "#ff4a3a" : "#e8352b", NOTTE) + rett(mx, my, mw, mh * .4, 0, nuova([[0, "#fff", .12], [1, "#fff", 0]], 0, 0, 0, 1));
      [[cx - 8.8, 48.6, 3], [cx + 8.8, 48.6, 3], [cx - 4.5, 46.6, 3.3], [cx + 4.5, 46.6, 3.3], [cx, 44.4, 3.7]].forEach(function (m) { r += monetaD(m[0], m[1], m[2]); });   // la pila di monete
      r += stella(cx - 13, 40.6, 1.1, "#fff", op(.9)) + stella(cx + 13.6, 41.6, .9, "#fff", op(.85)) + stella(cx + 9, 4.6, .8, "#fff", op(.8));
      var orlo = bordoArco(W, H, TR, 1.9);   // la cornice d'oro lungo l'arco e i lati, con le lampadine
      r += tratto(orlo, L, 4.8) + tratto(orlo, "#dca52d", 3.6) + tratto(orlo, "#fff0b0", 1, sp(-.3, -.3));
      var pp = lungoArco(cx, TR, cx - 1.9, TR - 1.9, 180, 360, 10);
      for (i = TR + 5.6; i < H - 4; i += 5.6) { pp.push([1.9, i]); pp.push([W - 1.9, i]); }
      r += lampadine(pp, 1.08, ["#fff3bf", "#ffd43b"]);
      r += rett(0, H - 3.4, W, 3.4, 0, nuova(OTTONE, 0, 0, 0, 1)) + rett(0, H - 3.4, W, .5, 0, "#fff6cf", op(.8));
      return T.su(r + rett(0, 0, W, H, 0, nuova([[0, "#fff", .1], [.4, "#fff", 0]], 0, 0, 1, 1)));
    }
    function retroI(T) {   // il retro del cartello: le prese d'aria e le viti
      var W = T.W, H = T.H, r = "", y;
      for (y = 26; y < 44; y += 2) r += rett(8, y, W - 16, .9, .45, "#0a1238");
      [[5, 22], [W - 5, 22], [5, H - 6], [W - 5, H - 6]].forEach(function (v) { r += cer(v[0], v[1], .7, "#c9ced3", bordo(L, .25)); });
      return T.su(r + tratto(bordoArco(W, H, TR, 1.6), "#f2c94c", .8, op(.8)));
    }
    function fasciaT(H) { return tratto(aperto(H.sez(G > 0 ? TB1 - .02 : TB0 + .02)), "#f2c94c", 1, op(.9)) + H.luccica(.45, .08, .92); }
    var s = ombraPianta(A0, A1, B0, B1 + .15, 1, .06);
    var bs = base(A0 + .006, A1 - .006, B0 + .012, B1 - .014, Z0, true);
    var corpoJ = blocco(A0, A1, B0, B1, Z0, ZC, BLU, { davanti: davanti, dietro: dietro, fianco: fianco }, 2.4);
    var sporge = vassoio(-.25, .25, B1, B1 + .15, 36.4, 43.6, 11, 10) + pulsantiera(A0 + .025, A1 - .025, B1, B1 + .12, 60.4, 57.2, 54.2, [[2.6, 4.4, "#f8f9fa"], [8, 4.4, "#ffd43b"], [13.4, 4.4, "#ff922b"], [19, 5.6, "#4dabf7"], [27.2, 6.8, "#37b24d", 1]], { orlo: "#c99a36", orlo2: "#ffe8a3", col: "#e9c46a", f0: "#fff3c4", f1: "#a8781a" });
    var cart = estruso("b", TPROF, TB0, TB1, BLU, { mat: { lucido: .65, esp: 20 }, tappo: G > 0 ? insegna : retroI, fascia: fasciaT, lw: 2.3 });
    if (G > 0) s += bs + corpoJ + sporge + cart;
    else s += sporge + bs + corpoJ + cart + cavo(.12, B0 + .012, 8);
    return s;
  });

  // =========================================================
  //  SLOT GIGANTE (l'attrazione: larga due mattonelle, alta circa 220): la slot rossa e oro ad arco con le luci a festa;
  //  in cima la grande stella d'oro con le lampadine, sotto l'arco la raggiera con la stella, poi i tre rulli giganti con
  //  le campane d'oro (il premio della prima slot della storia) nella cornice cromata piena di lampadine, la fila di luci
  //  colorate, la pulsantiera coi tre tasti grandi, la pancia col ferro di cavallo, il vassoio pieno di monete, la
  //  grande leva sul fianco e il basamento nero con le luci. Dietro: i due sportelloni, le prese d'aria, le luci
  // =========================================================
  def("slot_gigante", { tipo: "piedi", nome: "Slot gigante", fp: [2, 1], box: [-71, -232, 71, 37], dietro: true, luce: [0, .1, 125, 125, "#ffcf5a"] }, function () {
    var A0 = -.82, A1 = .82, B0 = -.36, B1 = .2, Z0 = 15, ZA = 166, RZ = 32, ZT = ZA + RZ, ROSSO = "#c81f2a", i;
    var PROF = [[A0, Z0], [A1, Z0]].concat(arcoS(0, ZA, A1, RZ, 0, Math.PI, 34));
    var FESTA = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#f783ac"];
    function davanti(T) {   // il davanti (piatto, W × 183: y = 198 − z)
      var W = T.W, H = T.H, cx = W / 2, r = "";
      var ev = 4, vetro = "M" + f2(ev) + ",38 L" + f2(ev) + "," + f2(RZ) + " A" + f2(cx - ev) + "," + f2(RZ - ev) + " 0 0 1 " + f2(W - ev) + "," + f2(RZ) + " L" + f2(W - ev) + ",38 Z";
      var v = rett(0, 0, W, 38, 0, NOTTE ? nuovaR([[0, "#fffdf0"], [.45, "#ffd66b"], [1, "#e8590c"]], .5, .9, .9) : nuovaR([[0, "#ffeaa8"], [.5, "#f4b02a"], [1, "#a8430a"]], .5, .9, .9));
      v += raggiera(cx, 40, 70, 30, "#fff8dc", NOTTE ? .55 : .32, 180, 360);
      v += cer(cx, 21, 15, nuovaR([[0, "#ffffff", NOTTE ? .9 : .6], [1, "#fff3bf", 0]], .5, .5, .5)) + stella5(cx, 22, 12.5, lin("sg", ORO_S, 0, 0, 1, 1), bordo(L, .9)) + stella5(cx - .8, 21.2, 5, "#fff8d6", op(.55));
      v += stella5(cx - 26, 27, 4.6, lin("sg", ORO_S, 0, 0, 1, 1), bordo(L, .6)) + stella5(cx + 26, 27, 4.6, lin("sg", ORO_S, 0, 0, 1, 1), bordo(L, .6));
      v += stella(cx - 14, 9, 1.6, "#ffffff", op(.95)) + stella(cx + 15, 11, 1.3, "#ffffff", op(.9)) + stella(cx + 37, 31, 1.1, "#fff", op(.85)) + stella(cx - 38, 32, 1.1, "#fff", op(.85));
      v += poly([[W * .12, 0], [W * .24, 0], [W * .12, 38], [0, 38]], "#ffffff", op(NOTTE ? .07 : .14));
      r += dentro(vetro, v) + pth(vetro, "none", "stroke='#f8f9fa' stroke-width='1.6'") + pth(vetro, "none", "stroke='" + L + "' stroke-width='.6'");
      r += lampadine(lungoArco(cx, RZ, cx - 2, RZ - 2, 180, 360, 18), 1.45, ["#fff3bf", "#ffd43b"]);   // le lampadine lungo l'arco
      r += rett(0, 38.6, W, 2.8, 0, nuova(OTTONE, 0, 0, 0, 1)) + rett(0, 38.6, W, .6, 0, "#fff6cf", op(.9));
      // i tre rulli giganti nella cornice cromata piena di lampadine
      var bx = 4, by = 43.5, bw = W - 8, bh = 66, cor = rq(bx, by, bw, bh, 4);
      r += pth(cor, nuova([[0, "#ffffff"], [.45, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1), bordo(L, 1));
      var fx = bx + 5.4, fy = by + 5.2, fw = bw - 10.8, fh = bh - 10.4, fin = rq(fx, fy, fw, fh, 2), cy = fy + fh / 2;
      var cr = rulli(fx, fy, fw, fh, [["ciliegie", "campana", "diamante"], ["sette", "campana", "ciliegie"], ["ciliegie", "campana", "diamante"]], 2.15, 2.4);
      cr += tratto("M" + f2(fx) + "," + f2(cy) + " H" + f2(fx + fw), NOTTE ? "#ff5c5c" : "#e03131", NOTTE ? 1.6 : 1.2, op(.85));
      cr += poly([[fx + fw * .1, fy], [fx + fw * .22, fy], [fx + fw * .12, fy + fh], [fx, fy + fh]], "#ffffff", op(.12)) + rett(fx, fy, fw, fh * .22, 0, nuova([[0, "#fff", .22], [1, "#fff", 0]], 0, 0, 0, 1));
      r += dentro(fin, cr) + pth(fin, "none", "stroke='#1a1b1f' stroke-width='1'");
      r += lampadine(lungoRett(bx + 2.6, by + 2.5, bw - 5.2, bh - 5, 6.5), 1.2, ["#fff3bf", "#ff8787", "#fff3bf", "#ffd43b"]);
      [[bx + 2.6, 1], [bx + bw - 2.6, -1]].forEach(function (f) { r += poly([[f[0] - f[1] * 1.2, cy - 3], [f[0] + f[1] * 2.2, cy], [f[0] - f[1] * 1.2, cy + 3]], NOTTE ? "#ffe3e3" : "#e03131", bordo(L, .45)); });
      r += rett(0, 111, W, 2.4, 0, nuova(OTTONE, 0, 0, 0, 1));
      // la fila di lampadine colorate sotto la pulsantiera
      var fl = []; for (i = 0; i < 15; i++) fl.push([6 + i * (W - 12) / 14, 128.6]);
      r += rett(3, 125.4, W - 6, 6.4, 3.2, "#2a0507", bordo(L, .6)) + lampadine(fl, 1.7, FESTA);
      // la pancia: il ferro di cavallo d'oro tra le monete, sulla raggiera
      var gx = 6, gy = 134, gw = W - 12, gh = 33, pan = rq(gx, gy, gw, gh, 3);
      r += pth(pan, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .9));
      var px = gx + 2.4, py = gy + 2.4, pw = gw - 4.8, ph = gh - 4.8, pin = rq(px, py, pw, ph, 2);
      var b = rett(px, py, pw, ph, 0, NOTTE ? nuovaR([[0, "#ff9a9a"], [.6, "#d31f2a"], [1, "#6b0a10"]], .5, .5, .75) : nuovaR([[0, "#e0303a"], [.6, "#9b111b"], [1, "#4e070c"]], .5, .5, .75));
      b += raggiera(cx, py + ph / 2, 60, 30, "#ffd43b", NOTTE ? .3 : .16, 0, 360);
      b += simbolo("ferro", cx, py + ph / 2, 2.5) + monetaD(cx - 28, py + ph / 2 + 2, 6) + monetaD(cx + 28, py + ph / 2 + 2, 6) + monetaD(cx - 38, py + ph / 2 - 4, 4.4) + monetaD(cx + 38, py + ph / 2 - 4, 4.4);
      b += stella(cx - 16, py + 5, 1.6, "#ffffff", op(.9)) + stella(cx + 17, py + 6, 1.3, "#ffffff", op(.85)) + stella(cx + 6, py + ph - 4, 1.1, "#fff", op(.8));
      b += poly([[px + pw * .08, py], [px + pw * .18, py], [px + pw * .1, py + ph], [px, py + ph]], "#ffffff", op(.12));
      r += dentro(pin, b) + pth(pin, "none", "stroke='#5c0a0f' stroke-width='.6'");
      r += rett(0, H - 3.4, W, 3.4, 0, nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1));
      var ed = bordoArco(W, H, RZ, 1.1);
      r += tratto(ed, "#f8f9fa", 1.6, op(.95)) + tratto(ed, "#7d868e", .45, sp(.6, .5));
      return T.su(r + rett(0, 0, W, H, 0, nuova([[0, "#fff", .1], [.4, "#fff", 0]], 0, 0, 1, 1)));
    }
    function dietro(T) {   // la schiena: i due sportelloni con le serrature, le prese d'aria, l'etichetta, le lampadine sull'arco
      var W = T.W, H = T.H, r = "", y;
      r += rett(0, 0, W, H, 0, nuova([[0, "#000", 0], [1, "#000", .15]], 0, 0, 0, 1));
      [[8, 1], [W / 2 + 3, -1]].forEach(function (d) {
        var x = d[0], w = W / 2 - 11;
        r += pth(rq(x, 52, w, 112, 3), "none", "stroke='#5a0a10' stroke-width='1.4'") + pth(rq(x + 1, 53, w - 2, 110, 2.4), "none", "stroke='#ee6a72' stroke-width='.55' opacity='.5'");
        r += cer(d[1] > 0 ? x + w - 5 : x + 5, 108, 1.5, nuovaR(CROMO, .35, .3, .8), bordo(L, .5));
      });
      for (y = 42; y < 49; y += 2.2) r += rett(16, y, W - 32, 1, .5, "#3a050a");
      r += rett(14, 150, 12, 8, .6, "#f1ece2") + rett(15.2, 151.6, 6, .7, 0, "#868e96") + rett(15.2, 153.4, 9.6, .6, 0, "#adb5bd") + rett(15.2, 155, 8, .6, 0, "#adb5bd");
      r += lampadine(lungoArco(W / 2, RZ, W / 2 - 2, RZ - 2, 180, 360, 18), 1.45, ["#fff3bf", "#ffd43b"]);
      r += rett(0, H - 3.4, W, 3.4, 0, nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1));
      return T.su(r + tratto(bordoArco(W, H, RZ, 1.1), "#f8f9fa", 1.4, op(.85)));
    }
    function fascia(H) {   // i fianchi: il filetto d'oro, la fila di lampadine lungo il bordo davanti, il bordo cromato, il lucido
      var o = "", av = G > 0 ? A1 : A0, bl = G > 0 ? B1 - .055 : B0 + .055, X0 = 61 * B0, X1 = 61 * B1, z;
      o += suA(av, pth(rq(X0 + 6, -150, X1 - X0 - 12, 120, 4), "none", "stroke='#f2c94c' stroke-width='1.2'") + pth(rq(X0 + 7.2, -149, X1 - X0 - 14.4, 118, 3.4), "none", "stroke='#6e0b12' stroke-width='.55' opacity='.7'") +
        stella5(61 * (B0 + B1) / 2, -92, 7, nuova(OTTONE, 0, 0, 1, 1), bordo("#7a4a00", .6)));
      o += tratto(aperto(H.sez(G > 0 ? B1 - .022 : B0 + .022)), "#f8f9fa", 1.4, op(.9));
      var lb = [];
      for (z = 24; z < ZA - 2; z += 10) lb.push(P(av, bl, z));
      H.sez(bl, function (pt) { return pt[1] > ZA + 2; }).forEach(function (pt, k) { if (k % 3 === 1) lb.push(pt); });
      return o + lampadine(lb, 1.5, ["#fff3bf", "#ffd43b"]) + H.luccica(.5, .08, .92);
    }
    var stellaC = stellaD(-.125, -.035, ZT + 12.6, 15.5, 6.4);
    var plinto = blocco(A0 - .05, A1 + .05, B0 - .05, B1 + .28, 0, Z0, "#26222b", {
      davanti: function (W, H) { var pp = [], j; for (j = 0; j < 16; j++) pp.push([4 + j * (W - 8) / 15, 8.2]); return lucidoPiano(W, H, .6) + rett(0, 0, W, 1.8, 0, nuova(OTTONE, 0, 0, 0, 1)) + lampadine(pp, 1.4, FESTA) + rett(0, H - 2, W, 2, 0, nuova(OTTONE, 0, 0, 0, 1)); },
      dietro: function (W, H) { var pp = [], j; for (j = 0; j < 16; j++) pp.push([4 + j * (W - 8) / 15, 8.2]); return lucidoPiano(W, H, .5) + rett(0, 0, W, 1.8, 0, nuova(OTTONE, 0, 0, 0, 1)) + lampadine(pp, 1.4, FESTA); },
      fianco: function (W, H) { return lucidoPiano(W, H, .5) + rett(0, 0, W, 1.8, 0, nuova(OTTONE, 0, 0, 0, 1)) + lampadine([[W * .25, 8.2], [W * .5, 8.2], [W * .75, 8.2]], 1.4, FESTA); }
    }, 2.4);
    var corpoG = estruso("b", PROF, B0, B1, ROSSO, { mat: { lucido: .7, esp: 22 }, tappo: G > 0 ? davanti : dietro, fascia: fascia, lw: 2.8 });
    var vas = vassoio(-.48, .48, B1, B1 + .24, 16.5, 28.5, 23, 46, true);
    var deck = pulsantiera(A0 + .05, A1 - .05, B1, B1 + .19, 85, 80, 75.4, [[13, 13, "#f03e3e", 1], [41.6, 13, "#ffd43b", 1], [70.2, 13, "#37b24d", 1]], { H: 13, lw: 1.8 });
    var lev = leva(A1, -.08, 110, 2), s = ombraPianta(A0 - .05, A1 + .05, B0 - .05, B1 + .28, 1, .06);
    if (G > 0) s += plinto + corpoG + vas + deck + lev;
    else s += plinto + vas + deck + lev + corpoG + cavo(.3, B0, 20);
    return s + stellaC;
  });

  // =========================================================
  //  VIDEO POKER (la macchina bassa da bancone): il mobile di mogano coi due pannelli e lo zoccolo d'ottone, il
  //  poggiapiedi d'ottone, il bracciolo imbottito di pelle nera coi bottoni; sopra, inclinato verso chi gioca, lo schermo
  //  blu con le cinque carte e la tabella delle vincite, la fila dei tasti (punta, i cinque "tieni", dai le carte) e la
  //  candela blu. Dietro: la schiena di legno con le prese d'aria e il filo
  // =========================================================
  def("video_poker", { tipo: "piedi", nome: "Video poker", fp: [1, 1], box: [-41, -91, 41, 20], dietro: true, luce: [0, .02, 64, 56, "#74c0fc"] }, function () {
    var A0 = -.36, A1 = .36, B0 = -.34, B1 = .24, ZC = 44, NERO = "#26222b", i;
    var PRC = [[B1 - .01, ZC], [B1 - .01, ZC + 4.6], [-.17, 72], [B0 + .02, 72], [B0 + .02, ZC]];   // la cassa sopra: (b, z)
    var legno = nuova([[0, "#8a3f26"], [1, "#4e1f12"]], 0, 0, 1, 1);
    function pannelli(W, H) {   // il davanti di mogano: due pannelli in rilievo, i bottoncini d'ottone, lo zoccolo
      var r = venature(W, H, scuro(MOGANO, .08), 51, 2.3) + lucidoPiano(W, H, .5), ott = nuova(OTTONE, 0, 0, 0, 1);
      [[3, W / 2 - 4.5], [W / 2 + 1.5, W / 2 - 4.5]].forEach(function (pq) {
        r += pth(rq(pq[0], 5, pq[1], H - 14, 1.2), "none", "stroke='" + scuro(MOGANO, .5) + "' stroke-width='1.1'") + pth(rq(pq[0] + .8, 5.8, pq[1] - 1.6, H - 15.6, .9), "none", "stroke='" + chiaro(MOGANO, .3) + "' stroke-width='.5' opacity='.8'");
        r += cer(pq[0] + pq[1] / 2, (H - 9) / 2 + 2.5, 1.3, nuovaR(OTTONE, .35, .3, .8), bordo(L, .4));
      });
      return r + rett(0, H - 4, W, 4, 0, ott) + rett(0, H - 4, W, .5, 0, "#fff6cf", op(.85)) + rett(0, 0, W, 1.4, 0, ott);
    }
    function schiena(W, H) { var r = venature(W, H, scuro(MOGANO, .08), 53, 2.3) + lucidoPiano(W, H, .4), y; for (y = 10; y < 22; y += 1.9) r += rett(W * .22, y, W * .56, .9, .45, "#1a0b05"); return r + rett(0, H - 4, W, 4, 0, nuova(OTTONE, 0, 0, 0, 1)); }
    function fiancoL(W, H) { return venature(W, H, scuro(MOGANO, .2), 55, 2.3) + rett(0, H - 4, W, 4, 0, nuova(OTTONE, 0, 0, 0, 1)) + rett(0, 0, W, 1.4, 0, nuova(OTTONE, 0, 0, 0, 1)); }
    function pannello(W, H) {   // lo schermo e i tasti sul piano inclinato (piatto, W × H, dall'alto verso chi gioca)
      var r = rett(0, 0, W, H, 0, nuova([[0, "#34303b"], [1, "#16141a"]], 0, 0, 0, 1)), sx = 1.7, sy = 1.5, sw = W - 3.4, sh = 21, sc = rq(sx, sy, sw, sh, 1.2), c = "";
      c += rett(sx, sy, sw, sh, 0, NOTTE ? nuova([[0, "#3d7bff"], [1, "#1236b8"]], 0, 0, 0, 1) : nuova([[0, "#1c4fd6"], [1, "#0a237a"]], 0, 0, 0, 1));
      for (i = 0; i < 4; i++) {   // la tabella delle vincite: le righe gialle (quella accesa è rossa)
        var ty = sy + 1.3 + i * 1.45;
        c += rett(sx + 2, ty, sw * .42, .75, .3, i === 1 ? "#ff6b6b" : "#ffd43b", op(.95)) + rett(sx + sw * .52, ty, sw * .17, .75, .3, "#ffd43b", op(.9)) + rett(sx + sw * .74, ty, sw * .17, .75, .3, "#ffd43b", op(.6));
      }
      var cw = 6, chh = 8.6, gap = (sw - 4 - 5 * cw) / 4, SEMI = ["cuori", "picche", "quadri", "fiori", "cuori"];   // le cinque carte (due "tenute")
      for (i = 0; i < 5; i++) c += carta(sx + 2 + i * (cw + gap), sy + 8.4, cw, chh, SEMI[i], i === 0 || i === 4);
      c += led("888", sx + 2, sy + sh - 2.9, 2, "#ffd43b", NOTTE) + led("88", sx + sw - 2 - ledL("88", 2), sy + sh - 2.9, 2, "#ffd43b", NOTTE);
      c += poly([[sx + sw * .1, sy], [sx + sw * .26, sy], [sx + sw * .14, sy + sh], [sx - sw * .02, sy + sh]], "#ffffff", op(NOTTE ? .05 : .1)) + rett(sx, sy, sw, sh * .3, 0, nuova([[0, "#fff", .14], [1, "#fff", 0]], 0, 0, 0, 1));
      r += pth(rq(sx - .7, sy - .7, sw + 1.4, sh + 1.4, 1.6), "#09080c") + dentro(sc, c) + pth(sc, "none", "stroke='#4a5d8a' stroke-width='.4'");
      if (NOTTE) r += pth(rq(sx - 1.4, sy - 1.4, sw + 2.8, sh + 2.8, 2), "none", "stroke='#74c0fc' stroke-width='1.2' opacity='.35'");
      var by = sh + 3.2, bw = (W - 4 - 6 * .9) / 7, cols = ["#f03e3e", "#ffd43b", "#ffd43b", "#ffd43b", "#ffd43b", "#ffd43b", "#37b24d"];   // i tasti: punta, cinque "tieni", dai le carte
      for (i = 0; i < 7; i++) {
        var bx = 2 + i * (bw + .9), cc = NOTTE ? chiaro(cols[i], .4) : cols[i];
        if (NOTTE) r += rett(bx - .6, by - .6, bw + 1.2, 4.6, 1.2, cc, op(.3));
        r += rett(bx, by + .5, bw, 3.4, .8, scuro(cols[i], .55)) + rett(bx, by, bw, 3.4, .8, nuova([[0, chiaro(cc, .45)], [1, scuro(cc, .2)]], 0, 0, 0, 1), "stroke='" + scuro(cols[i], .55) + "' stroke-width='.35'") + rett(bx + .5, by + .4, bw - 1, .7, .35, "#ffffff", op(.6));
      }
      return r;
    }
    function bottoni(H) {   // il bracciolo: i bottoni del capitonné lungo la cima e le pieghe
      var k = H.vicinoA(.32, 52), l = H.lungo(k, A0, A1), o = "", j;
      for (j = 1; j < 8; j++) { var m = [l[0][0] + (l[1][0] - l[0][0]) * j / 8, l[0][1] + (l[1][1] - l[0][1]) * j / 8 + .8]; o += tratto("M" + q(m[0] - 2.2, m[1] - .9) + " L" + q(m[0], m[1]) + " L" + q(m[0] + 2.2, m[1] + 1.1), "#000", .4, op(.45)) + cer(m[0], m[1], .7, "#120e10") + cer(m[0] - .2, m[1] - .25, .25, "#8a7f86"); }
      return o + H.luccica(.35, .04, .96);
    }
    function poggiapiedi() {   // il poggiapiedi d'ottone coi due sostegni
      var o = "", zr = 8.6, br = .4;
      [-.24, .24].forEach(function (a) { o += ottone(linea(P(a, B1, zr + 1.4), P(a, br, zr)), 1.1); });
      return o + ottone(linea(P(A0 + .04, br, zr), P(A1 - .04, br, zr)), 2) + ottone(linea(P(A1 - .04, br, zr), P(A1 - .01, br, zr)), 2.4);
    }
    function retroCassa() {   // la schiena della cassa sopra: le prese d'aria e l'etichetta
      var x0 = A0 * 61, r = "", y;
      for (y = -69; y < -60; y += 1.8) r += rett(x0 + 9, y, -2 * x0 - 18, .8, .4, "#09080c");
      return suB(B0 + .02, r + rett(x0 + 8, -56, 9, 5.6, .5, "#f1ece2") + rett(x0 + 9, -54.8, 4.5, .55, 0, "#868e96") + rett(x0 + 9, -53.5, 7, .45, 0, "#adb5bd"));
    }
    var s = ombraPianta(A0, A1, B0, .42, 1, .06);
    var corpoP = blocco(A0, A1, B0, B1, 0, ZC, MOGANO, { davanti: pannelli, dietro: schiena, fianco: fiancoL }, 2.3);
    var cassa = lastra(PRC, A0 + .015, A1 - .015, { col: NERO, mat: { lucido: .8, esp: 24 }, faccia: legno, lw: 2.2 });
    var brac = estruso("a", arcoS(.32, ZC + 3.4, .08, 3.6, 0, 6.2832 * 23 / 24, 23), A0 - .008, A1 + .008, "#3a3035", { mat: { lucido: .6, esp: 10 }, fascia: bottoni, lw: 1.8,
      tappo: function (T) { return T.su(ell(T.W / 2, T.H / 2, T.W / 2 - .7, T.H / 2 - .7, "none", "stroke='#d9a83a' stroke-width='1.2'") + ell(T.W / 2 - .4, T.H / 2 - .5, T.W / 2 - 1.3, T.H / 2 - 1.3, "none", "stroke='#fff3c4' stroke-width='.4' opacity='.8'") + cer(T.W / 2, T.H / 2, .9, nuovaR(OTTONE, .35, .3, .8), bordo(L, .3))); } });   // in punta l'anello d'ottone
    var schermo = G > 0 ? piano(P(A0 + .03, -.17, 72), P(A1 - .03, -.17, 72), P(A0 + .03, B1 - .01, ZC + 4.6), (A1 - A0 - .06) * 61, 33.8, pannello((A1 - A0 - .06) * 61, 33.8)) : "";
    var cand = candela(A1 - .1, B0 + .1, 72, "#4dabf7", "#f8f9fa", .85);
    if (G > 0) s += corpoP + cassa + schermo + brac + poggiapiedi() + cand;
    else s += poggiapiedi() + brac + corpoP + cassa + retroCassa() + cand + cavo(-.1, B0, 8);
    return s;
  });

  // =========================================================
  //  BANCOMAT (moderno, in piedi): il mobile grafite col frontale d'acciaio spazzolato; in cima l'insegna azzurra che
  //  si illumina con la tessera e la moneta, lo schermo infossato sotto la visiera coi tasti ai lati, la tastiera
  //  inclinata coi tasti colorati, la bocca della tessera con la luce verde, la fessura dello scontrino e quella dei
  //  soldi. Dietro: la cassaforte con la manopola dei numeri, la maniglia a tre razze e le cerniere
  // =========================================================
  def("bancomat", { tipo: "piedi", nome: "Bancomat", fp: [1, 1], box: [-36, -114, 33, 17], dietro: true, luce: [0, .22, 90, 60, "#5cc8ff"] }, function () {
    var A0 = -.3, A1 = .3, B0 = -.3, B1 = .2, ZC = 84, GR = "#454b55", i;
    var tasto = nuova([[0, "#f1f3f5"], [1, "#9aa3ab"]], 0, 0, 0, 1);
    function fronte(W, H) {   // il frontale (piatto, W × 84: y = 84 − z)
      var r = "", cx = W / 2, rr = rnd(91);
      var fa = rq(2, 2.4, W - 4, 75, 2);
      r += pth(fa, nuova([[0, "#f1f3f5"], [.5, "#c5ccd3"], [1, "#8d969e"]], 0, 0, 1, 1), bordo(L, .7));
      var sp2 = ""; for (i = 0; i < 30; i++) { var yy = 3.5 + i * 2.45; sp2 += "M3," + f1(yy) + " H" + f1(W - 3) + " "; }
      r += dentro(fa, tratto(sp2, "#ffffff", .3, op(.25)) + rett(0, 0, W, 80, 0, nuova([[0, "#fff", .25], [.5, "#fff", 0]], 0, 0, 1, 1)));   // l'acciaio spazzolato
      // lo schermo infossato
      var sx = 6.2, sy = 7.6, sw = W - 12.4, sh = 16.6;
      r += pth(rq(sx - 2.2, sy - 2.2, sw + 4.4, sh + 4.4, 1.6), nuova([[0, "#14171b"], [1, "#2b3036"]], 0, 0, 0, 1), bordo(L, .6));
      var sc = rq(sx, sy, sw, sh, .8), c = rett(sx, sy, sw, sh, 0, NOTTE ? nuova([[0, "#74d1ff"], [1, "#1c6fd1"]], 0, 0, 0, 1) : nuova([[0, "#339af0"], [1, "#1a4f9c"]], 0, 0, 0, 1));
      c += rett(sx, sy, sw, 2.6, 0, "#ffffff", op(.9)) + cer(sx + 1.6, sy + 1.3, .8, "#1c7ed6") + rett(sx + 3.2, sy + .9, 6, .8, .4, "#1c7ed6", op(.8));
      [[sy + 4.6, "#40c057"], [sy + 8.6, "#fab005"], [sy + 12.6, "#e64980"]].forEach(function (b, k) {   // i tasti sullo schermo con le figurine (banconota, moneta, tessera)
        c += rett(sx + 1, b[0], 6.4, 3, .8, "#ffffff", op(.95)) + rett(sx + 1.8, b[0] + .9, 2.6, 1.3, .3, b[1]);
        c += rett(sx + sw - 7.4, b[0], 6.4, 3, .8, "#ffffff", op(.95)) + rett(sx + sw - 6.6, b[0] + .9, 4.6, .5, .25, "#adb5bd") + rett(sx + sw - 6.6, b[0] + 1.8, 3.4, .5, .25, "#ced4da");
      });
      c += rett(cx - 4.6, sy + 6, 9.2, 5.4, .7, "#69db7c", bordo("#1e5e2e", .35)) + cer(cx, sy + 8.7, 1.6, "#d3f9d8", bordo("#2b8a3e", .3)) + rett(cx - 3.8, sy + 6.7, 1, 4, .3, "#2b8a3e", op(.4)) + rett(cx + 2.8, sy + 6.7, 1, 4, .3, "#2b8a3e", op(.4));   // la banconota
      c += poly([[sx + sw * .1, sy], [sx + sw * .26, sy], [sx + sw * .14, sy + sh], [sx - sw * .02, sy + sh]], "#ffffff", op(NOTTE ? .06 : .12));
      r += dentro(sc, c) + pth(sc, "none", "stroke='#0b0d10' stroke-width='.4'");
      if (NOTTE) r += pth(rq(sx - .8, sy - .8, sw + 1.6, sh + 1.6, 1.2), "none", "stroke='#74d1ff' stroke-width='1' opacity='.4'");
      for (i = 0; i < 3; i++) { var ky = sy + 2.6 + i * 4.6; r += rett(2.7, ky, 2.4, 2.6, .5, tasto, bordo(L, .3)) + rett(W - 5.1, ky, 2.4, 2.6, .5, tasto, bordo(L, .3)); }   // i tasti ai lati dello schermo
      // la bocca della tessera con la luce verde, la fessura dello scontrino
      r += pth(rq(W - 13, 30, 9.4, 5.6, 1.2), nuova([[0, "#2b3036"], [1, "#0f1114"]], 0, 0, 0, 1), bordo(L, .5)) + rett(W - 12, 32.3, 7.4, 1.2, .6, NOTTE ? "#8cffb0" : "#2fb84a") + (NOTTE ? rett(W - 12.8, 31.5, 9, 2.8, 1.2, "#8cffb0", op(.35)) : "");
      r += rett(W - 11.4, 37.4, 6.6, 1.6, .7, "#1d2125", bordo(L, .3)) + rett(W - 10.6, 37.9, 5, .55, .25, "#5c656e");
      // la bocca dei soldi con la serranda
      var dx = 6.4, dy = 44, dw = W - 12.8, dh = 6;
      r += pth(rq(dx, dy, dw, dh, 1.8), nuova([[0, "#262b31"], [1, "#4a5158"]], 0, 0, 0, 1), bordo(L, .6)) + rett(dx + 2, dy + 2.4, dw - 4, 1.3, .6, "#0b0d10") + rett(dx + 2.4, dy + 2.9, dw - 4.8, .4, .2, "#5c656e");
      r += pth(rq(dx - .6, dy - .6, dw + 1.2, dh + 1.2, 2.2), "none", "stroke='" + (NOTTE ? "#b2f2bb" : "#69db7c") + "' stroke-width='" + (NOTTE ? .9 : .5) + "'" + (NOTTE ? "" : " opacity='.8'"));
      // le figurine delle tessere che si possono usare (senza marchi)
      [["#e8590c", 0], ["#1c7ed6", 6], ["#2f9e44", 12]].forEach(function (t) { r += rett(cx - 8.6 + t[1], 56, 5, 3.2, .5, t[0], bordo(L, .25)) + rett(cx - 7.8 + t[1], 57, 1.2, .9, .2, "#ffd43b"); });
      r += rett(0, H - 4, W, 4, 0, "#1e2126") + rett(0, H - 4, W, .5, 0, "#868e96");
      return r;
    }
    function fiancoB(W, H) {   // il fianco grafite con la striscia di luce azzurra vicino al davanti
      return lucidoPiano(W, H, .5) + rett(2, 8, 1.4, H - 16, .7, NOTTE ? "#c5ecff" : "#4dabf7", NOTTE ? "" : op(.9)) + (NOTTE ? rett(1.2, 7, 3, H - 14, 1.4, "#74c0fc", op(.35)) : "") + rett(0, H - 4, W, 4, 0, "#1e2126");
    }
    function cassaforte(W, H) {   // la schiena: la porta della cassaforte con le cerniere, la manopola dei numeri e la maniglia
      var r = lucidoPiano(W, H, .4), cx = W * .58, y;
      for (y = 3.6; y < 9; y += 1.6) r += rett(6, y, W - 12, .7, .35, "#1e2126");
      r += pth(rq(4, 12, W - 8, 63, 2), nuova([[0, "#b2b9c0"], [.5, "#8a939c"], [1, "#5c636a"]], 0, 0, 1, 1), bordo(L, 1)) + pth(rq(5.4, 13.4, W - 10.8, 60.2, 1.4), "none", "stroke='#dde2e6' stroke-width='.5' opacity='.7'");
      [22, 60].forEach(function (yy) { r += rett(2.4, yy, 2.6, 7.4, 1, nuova([[0, "#ffffff"], [.5, "#b8c0c7"], [1, "#6c767e"]], 0, 0, 1, 0), bordo(L, .45)); });
      r += cer(cx, 32, 5.8, "#2b3036", bordo(L, .6)) + cer(cx, 32, 4.8, nuovaR([[0, "#f8f9fa"], [.6, "#adb5bd"], [1, "#495057"]], .35, .3, .8), bordo(L, .45));
      for (i = 0; i < 24; i++) { var t = i / 24 * 6.2832, l1 = i % 4 ? 4 : 3.4; r += tratto(linea([cx + Math.cos(t) * l1, 32 + Math.sin(t) * l1], [cx + Math.cos(t) * 4.5, 32 + Math.sin(t) * 4.5]), "#343a40", .3); }
      r += cer(cx, 32, 1.5, "#343a40") + poly([[cx - .8, 25.4], [cx + .8, 25.4], [cx, 26.8]], "#e03131");
      var hy = 49;
      for (i = 0; i < 3; i++) { var a = -Math.PI / 2 + i * 2.0944, e = [cx + Math.cos(a) * 6, hy + Math.sin(a) * 6]; r += cromo(linea([cx, hy], e), .9) + cer(e[0], e[1], 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .35)); }
      r += cer(cx, hy, 2.2, nuovaR(CROMO, .35, .3, .8), bordo(L, .45));
      return r + rett(7, 64, 9, 5.4, .5, "#f1ece2") + rett(8, 65.2, 4.5, .55, 0, "#868e96") + rett(8, 66.5, 7, .45, 0, "#adb5bd") + rett(0, H - 4, W, 4, 0, "#1e2126");
    }
    function insegnaB(W, H) {   // l'insegna in cima, azzurra, con la tessera e la moneta (di notte si accende)
      var r = rett(0, 0, W, H, 0, NOTTE ? nuova([[0, "#d0ebff"], [.5, "#74c0fc"], [1, "#1c7ed6"]], 0, 0, 0, 1) : nuova([[0, "#4dabf7"], [.5, "#1c7ed6"], [1, "#0b4f9c"]], 0, 0, 0, 1)), cx = W / 2;
      r += rett(1.2, 1.2, W - 2.4, H - 2.4, 1, "none", "stroke='#ffffff' stroke-width='.5' opacity='.7'");
      r += rett(cx - 10.4, 3.2, 12, 7.8, 1.1, "#ffffff", bordo("#0b3d91", .45)) + rett(cx - 10.4, 4.9, 12, 1.5, 0, "#0b3d91") + rett(cx - 8.6, 7.4, 2.8, 2.1, .5, "#fcc419", bordo("#a87a00", .25)) + rett(cx - 4.6, 8.4, 5, .6, .3, "#adb5bd");
      r += monetaD(cx + 6.8, 7.1, 3.6);
      return r + rett(0, 0, W, H * .4, 0, nuova([[0, "#fff", .3], [1, "#fff", 0]], 0, 0, 0, 1));
    }
    function insegnaBf(W, H) { return rett(0, 0, W, H, 0, NOTTE ? nuova([[0, "#a5d8ff"], [1, "#1c7ed6"]], 0, 0, 0, 1) : nuova([[0, "#1c7ed6"], [1, "#0b3d91"]], 0, 0, 0, 1)) + rett(0, H * .45, W, .5, 0, "#ffffff", op(.6)); }
    function insegnaBd(W, H) { return [[3, 3], [W - 3, 3], [3, H - 3], [W - 3, H - 3]].map(function (v) { return cer(v[0], v[1], .6, "#c9ced3"); }).join("") + rett(W * .3, H * .4, W * .4, 1, .5, "#0b2a5c"); }
    var s = ombraPianta(A0, A1, B0, B1 + .1, 1, .06);
    var corpoB = blocco(A0, A1, B0, B1, 0, ZC, GR, { davanti: fronte, dietro: cassaforte, fianco: fiancoB }, 2.3);
    var testa = blocco(A0 + .008, A1 - .008, B0 + .06, B1 + .02, ZC, ZC + 14, "#1c5fb8", { davanti: insegnaB, dietro: insegnaBd, fianco: insegnaBf }, 2.2);
    var visiera = blocco(A0 + .03, A0 + .055, B1, B1 + .05, 55.2, 78.4, GR, null, 1) + blocco(A1 - .055, A1 - .03, B1, B1 + .05, 55.2, 78.4, GR, null, 1) + blocco(A0 + .03, A1 - .03, B1, B1 + .055, 78.4, 80.4, GR, null, 1.2);
    var tastiera = pulsantiera(-.25, .06, B1, B1 + .1, 52.6, 49.6, 47.6, [], { col: "#c5ccd3", p0: "#3a4048", p1: "#20242a", orlo: "#868e96" });
    if (G > 0) {   // i tasti della tastiera: quattro file di tre grigi, e i tre colorati (annulla, correggi, conferma)
      var Wk = .31 * 61, Hk = 8, kk = "";
      for (i = 0; i < 4; i++) for (var j = 0; j < 3; j++) kk += rett(2 + j * 3.6, .9 + i * 1.75, 3, 1.4, .35, tasto, "stroke='#495057' stroke-width='.2'");
      ["#f03e3e", "#fcc419", "#37b24d"].forEach(function (c, k2) { kk += rett(13.6, .9 + k2 * 2.3, 4.4, 1.9, .4, NOTTE ? chiaro(c, .3) : c, "stroke='" + scuro(c, .5) + "' stroke-width='.2'"); });
      tastiera += piano(P(-.25, B1, 52.6), P(.06, B1, 52.6), P(-.25, B1 + .1, 49.6), Wk, Hk, kk);
    }
    if (G > 0) s += corpoB + visiera + tastiera + testa;
    else s += visiera + tastiera + corpoB + testa + cavo(.12, B0, 6);
    return s;
  });

  // =========================================================
  //  INSEGNA "JACKPOT" (da parete, larga due pezzi di muro): il cartello di Las Vegas col cimiero a raggiera e la corona,
  //  la cornice d'oro piena di lampadine, la scritta JACKPOT d'oro in rilievo sul fondo rosso a raggi e il contatore del
  //  montepremi con le cifre rosse (1.000.000) tra due monete; i due sostegni; di notte tutto acceso
  // =========================================================
  def("insegna_jackpot", { tipo: "parete", nome: "Insegna JACKPOT", largo: 2, luce: [62, 62, 115, "#ffcf4a"] }, function () {
    var x = 6, y = 32, w = 112, h = 72, cx = 62, s = "", i;
    var pann = rq(x, y, w, h, 7), cre = "M" + q(cx - 31, y + 6) + " A31,25 0 0 1 " + q(cx + 31, y + 6) + " Z";
    s += ombraD(pann, 2.4, 3.2) + ombraD(cre, 2.4, 3.2);
    [18, 106].forEach(function (cx2) {   // le due catenelle che lo tengono appeso al soffitto, con la piastrina e l'anello
      var cat = "", yy;
      for (yy = 1.6; yy < y - 1.4; yy += 2.3) cat += Math.round(yy / 2.3) % 2 ? ell(cx2, yy + 1.1, .55, 1.25, "none", "stroke='#5c636a' stroke-width='.5'") : rett(cx2 - .25, yy, .5, 2.3, .25, "#868e96");
      s += pth("M" + q(cx2 + 1.2, 1.6) + " V" + f1(y), "none", "stroke='#000' stroke-width='1.3' opacity='.1'") + cat + rett(cx2 - 2.4, 0, 4.8, 1.6, .4, "#3a3f45", bordo(L, .4)) + ell(cx2, y - .6, 1.3, 1.1, "none", "stroke='#c99a36' stroke-width='.8'");
    });
    // il cimiero: la raggiera e la corona, col bordo d'oro e le lampadine colorate
    s += pth(cre, NOTTE ? rad("cre", [[0, "#fff6d6"], [.5, "#ffb84d"], [1, "#e8590c"]], .5, 1, .95) : rad("cre", [[0, "#ffe7a0"], [.55, "#f08c00"], [1, "#9c3a00"]], .5, 1, .95), bordo(L, 1.6));
    s += dentro(cre, raggiera(cx, y + 6, 40, 22, "#fff8dc", NOTTE ? .5 : .3, 180, 360)) + corona(cx, y - 8, 1.35);
    s += tratto("M" + q(cx - 28.6, y + 6) + " A28.6,22.6 0 0 1 " + q(cx + 28.6, y + 6), "#f2c94c", 2.4) + tratto("M" + q(cx - 28.6, y + 6) + " A28.6,22.6 0 0 1 " + q(cx + 28.6, y + 6), "#fff3c4", .6, sp(-.3, -.3));
    s += lampadine(lungoArco(cx, y + 6, 28.6, 22.6, 190, 350, 10), 1.25, ["#ff8787", "#fff3bf", "#74c0fc", "#fff3bf", "#ffd43b"]);
    // il pannello: la cornice d'oro e il fondo rosso a raggi
    s += pth(pann, rad("orc", [[0, "#fff3c4"], [.6, "#e0a92e"], [1, "#9a6a14"]], .35, .3, .95), bordo(L, 1.6));
    var inn = rq(x + 5, y + 5, w - 10, h - 10, 4);
    var c = pth(inn, NOTTE ? rad("fon", [[0, "#ff7a7a"], [.55, "#d01825"], [1, "#5c0810"]], .5, .5, .7) : rad("fon", [[0, "#e5383b"], [.55, "#a3101b"], [1, "#4a060b"]], .5, .5, .7));
    c += raggiera(cx, y + h / 2, 80, 36, "#ffd6a5", NOTTE ? .22 : .12, 0, 360);
    var rr = rnd(29); for (i = 0; i < 14; i++) c += stella(x + 8 + rr() * (w - 16), y + 7 + rr() * (h - 14), .6 + rr() * .9, "#fff3bf", op(.5 + rr() * .4));
    s += dentro(inn, c) + pth(inn, "none", "stroke='#5c0810' stroke-width='.8'") + pth(rq(x + 4.2, y + 4.2, w - 8.4, h - 8.4, 4.6), "none", "stroke='#fff3c4' stroke-width='.5' opacity='.8'");
    // la scritta JACKPOT d'oro in rilievo
    var alt = 15.5, spz = 2.3, lw = larghezza("JACKPOT", alt, spz), d = scritta("JACKPOT", cx - lw / 2, y + 9.6, alt, spz), gr = lin("let", [[0, "#fffbe6"], [.45, "#ffd43b"], [1, "#d48806"]], 0, y + 9.6, 0, y + 9.6 + alt, true);
    if (NOTTE) s += tratto(d, "#ffd43b", 9, op(.25));
    s += tratto(d, "#4a0508", 6.4, sp(1.2, 1.6)) + tratto(d, L, 5.6) + tratto(d, "#8f4a00", 4.6) + tratto(d, gr, 3.5) + tratto(d, "#ffffff", .8, op(NOTTE ? .95 : .7) + " " + sp(-.35, -.45));
    // il contatore del montepremi tra le due monete
    var hL = 11.5, mw = ledL("1000000", hL) + 5, mh = hL + 5, mx = cx - mw / 2, my = y + 32;
    s += pth(rq(mx - 1.6, my - 1.6, mw + 3.2, mh + 3.2, 3), rad("orm", [[0, "#fff3c4"], [.6, "#e0a92e"], [1, "#9a6a14"]], .35, .3, .95), bordo(L, .9)) + pth(rq(mx, my, mw, mh, 2), "#0b0506");
    s += led("1.000.000", mx + 2.5, my + 2.5, hL, NOTTE ? "#ff4a3a" : "#e8352b", NOTTE) + rett(mx, my, mw, mh * .4, 0, lin("vtr", [[0, "#fff", .14], [1, "#fff", 0]], 0, 0, 0, 1));
    s += monetaD(x + 14.5, my + mh / 2, 6.2) + monetaD(x + w - 14.5, my + mh / 2, 6.2);
    // le lampadine tutto intorno alla cornice
    s += lampadine(lungoRett(x + 2.5, y + 2.5, w - 5, h - 5, 6.3), 1.2, ["#fff3bf", "#ffd43b"]);
    return s;
  });

  // =========================================================
  //  MAXISCHERMO DELLE SCOMMESSE (da parete, largo due pezzi di muro): lo schermo grande con la cornice nera sottile;
  //  a sinistra la partita (il campo a strisce visto dalla telecamera, le righe, i giocatori rossi e blu, il pallone,
  //  il risultato in alto), a destra il tabellone delle quote colorate (i simboli degli sport, le maglie delle squadre,
  //  le quote verdi, grigie e rosse con le frecce), sotto la striscia che scorre; di notte acceso con la luce sul muro
  // =========================================================
  def("maxischermo", { tipo: "parete", nome: "Maxischermo delle scommesse", largo: 2, luce: [62, 66, 100, "#7fd1ff"] }, function () {
    var x = 5, y = 30, w = 114, h = 70, s = "", i, j, rr = rnd(63);
    var cor = rq(x, y, w, h, 2), dx = x + 1.8, dy = y + 1.8, dw = w - 3.6, dh = h - 3.6, sc = rq(dx, dy, dw, dh, .6);
    if (NOTTE) s += ell(62, y + h / 2, 70, 46, rad("alo", [[0, "#7fd1ff", .35], [1, "#7fd1ff", 0]], .5, .5, .5));   // la luce dello schermo sul muro
    s += ombraD(cor, 2.2, 3);
    s += pth(cor, lin("cor", [[0, "#3a3f47"], [1, "#0e1013"]], 0, 0, 0, 1), bordo(L, 1.3));
    var c = rett(dx, dy, dw, dh, 0, "#0b1a2e");
    // la partita: il campo a strisce visto dalla telecamera
    var px0 = dx, px1 = dx + dw * .64, py0 = dy + 7, py1 = dy + dh - 7.4;
    function cp(u, v) { var xl = px0 + (px1 - px0) * .1 * (1 - v), xr = px1 - (px1 - px0) * .1 * (1 - v); return [xl + (xr - xl) * u, py0 + (py1 - py0) * v]; }   // u, v da 0 a 1 → punto del campo
    c += rett(px0, dy, px1 - px0, py0 - dy + .5, 0, NOTTE ? "#2e3e55" : "#1f2b3c");   // gli spalti pieni di gente e i cartelloni colorati a bordo campo
    for (i = 0; i < 110; i++) c += cer(px0 + rr() * (px1 - px0), dy + .7 + rr() * (py0 - dy - 2.4), .4, ["#f8f9fa", "#ffd43b", "#e03131", "#1c7ed6", "#69db7c", "#f783ac"][Math.floor(rr() * 6)], op(.85));
    for (i = 0; i < 9; i++) c += rett(px0 + i * (px1 - px0) / 9, py0 - 1.6, (px1 - px0) / 9 - .3, 1.6, 0, ["#e03131", "#1c7ed6", "#fab005", "#2f9e44", "#7048e8"][i % 5]);
    c += poly([cp(0, 0), cp(1, 0), [px1, py1], [px0, py1]], NOTTE ? "#4cc35e" : "#2f9e44");
    for (i = 0; i < 10; i += 2) c += poly([cp(i / 10, 0), cp((i + 1) / 10, 0), cp((i + 1) / 10, 1), cp(i / 10, 1)], NOTTE ? "#5fd36f" : "#40b356");
    var rg = NOTTE ? "#ffffff" : "#e9f5ec";
    c += tratto(chiuso([cp(.03, .06), cp(.97, .06), cp(.97, .97), cp(.03, .97)]), rg, .55) + tratto(linea(cp(.5, .06), cp(.5, .97)), rg, .55);
    c += ell(cp(.5, .52)[0], cp(.5, .52)[1], 8.4, 6.6, "none", "stroke='" + rg + "' stroke-width='.55'") + cer(cp(.5, .52)[0], cp(.5, .52)[1], .5, rg);
    c += tratto(aperto([cp(.97, .3), cp(.83, .3), cp(.83, .77), cp(.97, .77)]), rg, .55) + tratto(aperto([cp(.97, .43), cp(.92, .43), cp(.92, .64), cp(.97, .64)]), rg, .5);
    c += tratto(aperto([cp(.03, .3), cp(.17, .3), cp(.17, .77), cp(.03, .77)]), rg, .55);
    [[-.025, .03], [.97, 1.025]].forEach(function (pp) {   // le due porte con la rete
      var dP = chiuso([cp(pp[0], .44), cp(pp[1], .44), cp(pp[1], .63), cp(pp[0], .63)]);
      c += pth(dP, "#ffffff", op(.3)) + pth(dP, "none", "stroke='#ffffff' stroke-width='.5'");
    });
    var gioc = [[.3, .3, 0], [.42, .62, 0], [.55, .4, 0], [.68, .75, 0], [.74, .5, 0], [.36, .8, 1], [.6, .22, 1], [.8, .62, 1], [.88, .45, 1], [.5, .7, 1]];
    gioc.sort(function (m, n) { return m[1] - n[1]; }).forEach(function (g) {   // i giocatori: l'ombra, la maglia, i pantaloncini, la testa
      var pt = cp(g[0], g[1]), k = .75 + g[1] * .5, col = g[2] ? "#1c7ed6" : "#e03131";
      c += ell(pt[0] + .6 * k, pt[1], 1.5 * k, .5 * k, "#000", op(.3)) + rett(pt[0] - .7 * k, pt[1] - 1.6 * k, 1.4 * k, 1.6 * k, .3, "#f8f9fa") + rett(pt[0] - .9 * k, pt[1] - 3.6 * k, 1.8 * k, 2.2 * k, .5, col) + cer(pt[0], pt[1] - 4.4 * k, .75 * k, "#f1c27d");
    });
    var pl = cp(.63, .58);
    c += ell(pl[0] + .5, pl[1] + .4, .8, .3, "#000", op(.3)) + cer(pl[0], pl[1] - .5, .7, "#ffffff", "stroke='#495057' stroke-width='.15'");
    // il risultato in alto a sinistra: le due maglie e le cifre (2 a 1), il tempo
    var ry = dy + 1.3;
    c += rett(dx + 1.5, ry, 34, 4.6, .8, "#08101c", op(.9));
    c += rett(dx + 2.4, ry + .8, 3, 3, .4, "#e03131") + rett(dx + 3.4, ry + .8, 1, 3, 0, "#ffffff", op(.8)) + led("2", dx + 7, ry + 1, 2.6, "#ffffff", NOTTE) + rett(dx + 9.6, ry + 2.1, 1.2, .5, .2, "#ffffff") + led("1", dx + 11.6, ry + 1, 2.6, "#ffffff", NOTTE) + rett(dx + 14.4, ry + .8, 3, 3, .4, "#1c7ed6") + rett(dx + 15.4, ry + .8, 1, 3, 0, "#ffffff", op(.8));
    c += rett(dx + 19.2, ry + .8, 10, 3, .5, "#fab005") + led("78", dx + 20.4, ry + 1.2, 2.2, "#1b1b22") + rett(dx + 25.2, ry + 1.6, .45, .45, 0, "#1b1b22") + rett(dx + 25.2, ry + 2.6, .45, .45, 0, "#1b1b22") + led("12", dx + 26, ry + 1.2, 2.2, "#1b1b22");
    c += cer(dx + 32, ry + 2.3, 1, "#ff3b3b") + (NOTTE ? cer(dx + 32, ry + 2.3, 2, "#ff3b3b", op(.3)) : "");   // il pallino rosso della diretta
    // il tabellone delle quote: i simboli degli sport e le righe delle partite
    var qx = dx + dw * .655, qw = dx + dw - qx - 1, qy = dy + 1.3;
    c += rett(qx, qy, qw, dh - 9, .8, "#0e2140");
    [["#ffffff", 0], ["#c0eb75", 1], ["#ff922b", 2]].forEach(function (t) {   // il pallone, la pallina da tennis, il pallone da basket
      var bx = qx + 3.2 + t[1] * 6.2, by = qy + 3, o2 = cer(bx, by, 2, t[0], bordo("#1b1b22", .3));
      if (t[1] === 0) o2 += poly([[bx, by - .8], [bx + .75, by - .25], [bx + .45, by + .65], [bx - .45, by + .65], [bx - .75, by - .25]], "#1b1b22");
      else if (t[1] === 1) o2 += tratto("M" + q(bx - 1.6, by - 1) + " C" + q(bx - .3, by - .3) + " " + q(bx - .3, by + .3) + " " + q(bx - 1.6, by + 1), "#ffffff", .3) + tratto("M" + q(bx + 1.6, by - 1) + " C" + q(bx + .3, by - .3) + " " + q(bx + .3, by + .3) + " " + q(bx + 1.6, by + 1), "#ffffff", .3);
      else o2 += tratto(linea([bx - 2, by], [bx + 2, by]) + " " + linea([bx, by - 2], [bx, by + 2]), "#1b1b22", .3);
      c += (t[1] === 0 ? rett(bx - 2.8, by - 2.6, 5.6, 5.2, .8, "#1c7ed6") : "") + o2;
    });
    var QUOTE = [["1,85", "3,40", "4,20"], ["2,10", "3,10", "3,60"], ["1,45", "4,50", "6,80"], ["2,70", "3,20", "2,55"], ["1,20", "6,00", "9,50"]];
    var MAGLIE = [["#e03131", "#1c7ed6"], ["#fab005", "#2b8a3e"], ["#ffffff", "#212529"], ["#7048e8", "#e8590c"], ["#1098ad", "#e64980"]];
    for (i = 0; i < 5; i++) {
      var yy = qy + 7.6 + i * 9.6;
      c += rett(qx + .8, yy - .8, qw - 1.6, 8.6, .6, i % 2 ? "#13294f" : "#173260");
      c += rett(qx + 1.6, yy, 2.4, 2.8, .4, MAGLIE[i][0], bordo("#08101c", .2)) + rett(qx + 1.6, yy + 3.8, 2.4, 2.8, .4, MAGLIE[i][1], bordo("#08101c", .2));
      c += rett(qx + 4.6, yy + .9, 7, .6, .3, "#adb5bd", op(.8)) + rett(qx + 4.6, yy + 4.7, 5.6, .6, .3, "#adb5bd", op(.8));
      for (j = 0; j < 3; j++) {   // le tre quote: la migliore verde, la peggiore rossa
        var tx = qx + 12.6 + j * 8.4, best = j === (i === 3 ? 2 : 0), worst = j === (i === 3 ? 0 : 2), tc = best ? "#2f9e44" : worst ? "#c92a2a" : "#495057";
        c += rett(tx, yy + .3, 7.6, 6.2, .8, NOTTE ? chiaro(tc, .15) : tc) + led(QUOTE[i][j], tx + .9, yy + 2.4, 2.1, "#ffffff", NOTTE);
        if (best) c += poly([[tx + 6.2, yy + 1.6], [tx + 7, yy + 1.6], [tx + 6.6, yy + .9]], "#d3f9d8");
        if (worst) c += poly([[tx + 6.2, yy + 1], [tx + 7, yy + 1], [tx + 6.6, yy + 1.7]], "#ffe3e3");
      }
    }
    // la striscia che scorre in basso
    var ty = dy + dh - 5.8;
    c += rett(dx, ty, dw, 5.8, 0, "#8f0d14") + rett(dx, ty, 12, 5.8, 0, "#fab005") + cer(dx + 6, ty + 2.9, 1.8, "#ffffff") + poly([[dx + 5.3, ty + 2.1], [dx + 7.1, ty + 2.9], [dx + 5.3, ty + 3.7]], "#c92a2a");
    for (i = 0; i < 6; i++) { var sx = dx + 14 + i * 17; c += rett(sx, ty + 1.7, 3, 2.4, .4, ["#e03131", "#1c7ed6", "#fab005", "#2b8a3e", "#7048e8", "#1098ad"][i]) + led(["2,10", "1,75", "3,30", "1,90", "2,45", "1,60"][i], sx + 4, ty + 1.8, 2.2, "#ffffff", NOTTE); }
    c += rett(dx, dy, dw, dh, 0, lin("vt", [[0, "#fff", NOTTE ? .04 : .1], [.4, "#fff", 0]], 0, 0, 1, 1)) + poly([[dx + dw * .52, dy], [dx + dw * .6, dy], [dx + dw * .44, dy + dh], [dx + dw * .36, dy + dh]], "#ffffff", op(NOTTE ? .03 : .06));   // il vetro
    if (!NOTTE) c += rett(dx, dy, dw, dh, 0, "#0b1a2e", op(.12));   // di giorno lo schermo è un po' meno brillante
    s += dentro(sc, c) + pth(sc, "none", "stroke='#000' stroke-width='.5'");
    s += tratto("M" + q(x + 2.4, y + h - 2) + " L" + q(x + 2.4, y + 2.4) + " L" + q(x + w - 3, y + 2.4), "#ffffff", .45, op(.35));   // il filo di luce sul bordo
    s += cer(62, y + h - .9, .45, NOTTE ? "#69db7c" : "#adb5bd");   // la lucina d'accensione
    return s;
  });

  // =========================================================
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  var pacco = {
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var o;
      if (d.tipo === "parete") {
        o = { tipo: "parete", nome: d.nome, stanza: "casino", reparto: "casino", w: 62 * (d.largo || 1), h: 200, fp: [d.largo || 1, 1], prezzo: 0, qual: 2 };
        if (d.luce) o.luce = d.luce.slice();
        return o;
      }
      var m = misure(d);
      o = { tipo: d.tipo, nome: d.nome, stanza: "casino", reparto: "casino", w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice(), dietro: !!d.dietro, prezzo: 0, qual: 2 };
      if (d.luce) { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      p = "csl" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!(opz.notte && d.luce);
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      var defs = DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "";
      if (d.tipo === "parete") { var w = 62 * (d.largo || 1); return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " 200' width='" + w + "' height='200'>" + defs + c + "</svg>"; }
      var m = misure(d);
      return "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + defs +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  };
  if (window.SGMobiliArte) window.SGMobiliArte.aggiungi(pacco);
})();

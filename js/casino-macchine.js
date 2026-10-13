/* =========================================================
   SPeeD GAME — LA SALA GIOCHI DEL CASINÒ: MACCHINE E ATTRAZIONI, VISTE DALL'ALTO
   Come le slot (js/casino-slot.js): una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza
   61 unità ≈ 1 metro. Il davanti guarda in basso a sinistra; con { dietro: true } la cosa girata (si vede il retro).
   Con { notte: true } schermi, lampadine e neon sono accesi (il gioco poi scurisce la sala e mette l'alone nel punto "luce").
   In piedi: lo sgabello delle slot, la slot con la ruota, il pachinko, la gru dei peluche, lo spingimonete,
   il distributore dei gratta e vinci, l'auto in palio, il gatto della fortuna e il drago d'oro.
   Da parete (un pezzo di muro, 62 × 200): le insegne al neon (i tre 7, i dadi, i semi delle carte, le ciliegie).
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

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  var STIRA = null;   // per allungare in altezza un pezzo (l'auto): [da che altezza, quanto]
  function Puv(u, v, z) { z = z || 0; if (STIRA) z = STIRA[0] + (z - STIRA[0]) * STIRA[1]; return [(u - v) * 50, (u + v) * 25 - z]; }
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
    if (t === "ruota") return g0(x, y, k, ruotina(0, 0, 5));
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

  // ---------- altri attrezzi: i pezzi torniti, le fasce curve, gli anelli ----------
  // un pezzo tornito (colonnina, perno): il profilo [[z, raggio in mattonelle], ...] attorno al punto (a, b)
  function dTornito(a, b, prof) {
    var c = P(a, b, 0), n = prof.length, sx = [], dx = [], i;
    for (i = 0; i < n; i++) { var rx = prof[i][1] * 70.71, y = c[1] - prof[i][0]; sx.push([c[0] - rx, y]); dx.push([c[0] + rx, y]); }
    var rt = prof[n - 1][1] * 70.71, rb = prof[0][1] * 70.71;
    var d = "M" + sx.map(function (x) { return q(x); }).join(" L") + " A" + f1(rt) + "," + f1(rt / 2) + " 0 0,1 " + q(dx[n - 1]);
    for (i = n - 2; i >= 0; i--) d += " L" + q(dx[i]);
    return d + " A" + f1(rb) + "," + f1(rb / 2) + " 0 0,1 " + q(sx[0]) + " Z";
  }
  function tornito(a, b, prof, stops, lw, luce) {   // luce = il filo chiaro a sinistra
    var c = P(a, b, 0), n = prof.length, rm = 0;
    prof.forEach(function (x) { rm = Math.max(rm, x[1] * 70.71); });
    var o = pth(dTornito(a, b, prof), lin("tn", stops, c[0] - rm, 0, c[0] + rm, 0, true), bordo(L, lw || 1.3));
    if (luce) o += tratto("M" + prof.slice(1, n - 1).map(function (x) { return q(c[0] - x[1] * 70.71 * .45, c[1] - x[0]); }).join(" L"), "#ffffff", luce, "opacity='.6'");
    return o;
  }
  // un anello orizzontale (raggio r attorno ad (a, b), all'altezza z): i punti da t0 a t1
  function arcoT(a, b, r, z, t0, t1, n) { var o = [], i; n = n || 24; for (i = 0; i <= n; i++) { var t = t0 + (t1 - t0) * i / n; o.push(P(a + r * Math.cos(t), b + r * Math.sin(t), z)); } return o; }
  // le due metà di un anello: quella lontana (dietro a quello che sta in mezzo) e quella vicina
  function metaAnello(a, b, r, z, n) { var A = arcoT(a, b, r, z, Math.PI * .75, Math.PI * 1.75, n), B = arcoT(a, b, r, z, -Math.PI * .25, Math.PI * .75, n); return G > 0 ? [A, B] : [B, A]; }
  // le facce piene di un solido fatto a pezzi: prima il contorno scuro di tutti i pezzi (che sporge un po'), poi i colori
  // (così il contorno resta solo tutt'intorno e i pezzi si attaccano senza righe in mezzo)
  function solido(facce, lw) {
    var o = "", r = "";
    facce.forEach(function (f) { o += poly(f.pp, L, "stroke='" + L + "' stroke-width='" + f2(lw || 2.4) + "' stroke-linejoin='round'"); });
    facce.forEach(function (f) { r += poly(f.pp, f.c, "stroke='" + f.c + "' stroke-width='.5' stroke-linejoin='round'"); });
    return o + r;
  }
  // una fascia curva (lo schienale tondo): l'anello da r0 a r1 attorno a (ca, cb), da t0 a t1 (t = 0 dietro, verso −b), da z0 a z1
  function banda(ca, cb, r0, r1, t0, t1, z0, z1, col, m, n) {
    n = n || 18;
    function pt(r, t, z) { return P(ca + r * Math.sin(t), cb - r * Math.cos(t), z); }
    var facce = [], i, rm = (r0 + r1) / 2;
    for (i = 0; i < n; i++) {
      var ta = t0 + (t1 - t0) * i / n, tb = t0 + (t1 - t0) * (i + 1) / n, tm = (ta + tb) / 2, k = vicino(ca + rm * Math.sin(tm), cb - rm * Math.cos(tm));
      var nF = [G * Math.sin(tm), -G * Math.cos(tm), 0], nD = [-nF[0], -nF[1], 0];
      if (dot(nF, VISTA) > 0) facce.push({ k: k - .002, pp: [pt(r1, ta, z0), pt(r1, tb, z0), pt(r1, tb, z1), pt(r1, ta, z1)], c: tinta(col, nF, m) });
      if (dot(nD, VISTA) > 0) facce.push({ k: k - .002, pp: [pt(r0, ta, z0), pt(r0, tb, z0), pt(r0, tb, z1), pt(r0, ta, z1)], c: tinta(col, nD, m) });
      facce.push({ k: k, pp: [pt(r0, ta, z1), pt(r1, ta, z1), pt(r1, tb, z1), pt(r0, tb, z1)], c: tinta(col, [0, 0, 1], m) });
    }
    [[t0, -1], [t1, 1]].forEach(function (e) {   // le due teste
      var t = e[0], nv = [G * Math.cos(t) * e[1], G * Math.sin(t) * e[1], 0];
      if (dot(nv, VISTA) > 0) facce.push({ k: vicino(ca + rm * Math.sin(t), cb - rm * Math.cos(t)) + .001, pp: [pt(r0, t, z0), pt(r1, t, z0), pt(r1, t, z1), pt(r0, t, z1)], c: tinta(col, nv, m) });
    });
    facce.sort(function (x, y) { return x.k - y.k; });
    var s = solido(facce, 2.4), sopra = function (r) { var pp = [], j; for (j = 0; j <= n; j++) pp.push(pt(r, t0 + (t1 - t0) * j / n, z1)); return aperto(pp); };
    return { s: s + tratto(sopra(r0), L, .8, op(.7)) + tratto(sopra(r1), L, .8, op(.7)), pt: pt };
  }

  // =========================================================
  //  SGABELLO DA SLOT: lo sgabello alto girevole di Las Vegas. Il piede tondo e la colonna di cromo, l'anello poggiapiedi
  //  coi raggi (ci appoggia i piedi chi è seduto), il perno nero che gira; la seduta tonda imbottita di finta pelle rossa
  //  col bordino, i bottoni e le pieghe, sul piatto cromato; lo schienale basso e curvo, imbottito, sui due tubi di cromo.
  //  Davanti alla slot si mette girato: chi siede guarda la macchina (e si vede di spalle, con lo schienale davanti)
  // =========================================================
  def("sgabello_slot", { tipo: "piedi", nome: "Sgabello da slot", fp: [1, 1], box: [-20, -72, 22, 11], dietro: true, azione: "siedi", seduta: 40 }, function () {
    var R = "#c8102e", ZS = 34.6, ZT = 41.6, ZP = 14, i;
    var s = ombraPianta(-.19, .19, -.19, .19, 1, .07);
    // il piede tondo (una cupola bassa di cromo) e la colonna
    var Fb = forma(0, 0, .19, .19, .19, 2), Fb2 = forma(0, 0, .15, .15, .15, 2), Fb3 = forma(0, 0, .065, .065, .065, 2);
    s += corpo([giro(Fb, 0, 1, 48), giro(Fb, 1.4, 1, 48), giro(Fb2, 2.6, 1, 48), giro(Fb3, 4, 1, 32)], CROMO_C, 1.3);
    var cb = P(0, 0, 1.4);
    s += pth(chiuso(giro(Fb2, 2.6, 1, 48)), nuovaR([[0, "#f8f9fa"], [.45, "#c9d0d6"], [1, "#6c767e"]], .35, .3, .75)) + pth(chiuso(giro(forma(0, 0, .1, .1, .1, 2), 3.2, 1, 32)), "#2b3035", op(.25));   // il piatto del piede e l'ombra della colonna
    s += tratto(aperto(arcoT(0, 0, .175, 1.6, -Math.PI * .25, Math.PI * .75, 24)), "#ffffff", .7, op(.8)) + ell(cb[0] - 6, cb[1] - 2.6, 2.6, .8, "#ffffff", op(.85));   // il filo di luce sul bordo del piede
    // l'anello poggiapiedi: la metà lontana, i raggi dietro la colonna, la colonna, i raggi davanti, la metà vicina
    var an = metaAnello(0, 0, .165, ZP, 26), RG = [Math.PI * .25, Math.PI * .75, Math.PI * 1.25, Math.PI * 1.75];
    function raggio(t) { return cromo(linea(P(.04 * Math.cos(t), .04 * Math.sin(t), ZP + 1.2), P(.162 * Math.cos(t), .162 * Math.sin(t), ZP)), 1.1); }
    var dietroR = "", davantiR = "";
    RG.forEach(function (t) { if (vicino(Math.cos(t), Math.sin(t)) < 0) dietroR += raggio(t); else davantiR += raggio(t); });
    s += cromo(aperto(an[0]), 1.7) + dietroR;
    s += tornito(0, 0, [[3.5, .04], [ZS - 4, .04]], CROMO, 1.2, .7);   // la colonna
    s += tornito(0, 0, [[ZP - 1.2, .055], [ZP + 2.4, .055]], CROMO, 1, .6);   // il manicotto dove si attaccano i raggi
    s += davantiR + cromo(aperto(an[1]), 1.7);
    s += tornito(0, 0, [[ZS - 4.4, .07], [ZS - 2.2, .085], [ZS - .6, .1]], [[0, "#5c5f66"], [.4, "#2b2d33"], [1, "#101114"]], 1.1);   // il perno nero che gira
    // lo schienale: i due tubi che salgono da sotto la seduta, la fascia imbottita curva (bordino, bottoni, cuciture)
    var ZB0 = 47, ZB1 = 61, TB = 1.05;
    var bd = banda(0, 0, .168, .212, -TB, TB, ZB0, ZB1, R, { lucido: .55, esp: 14 }, 22);
    function tubo(sg) { var t = sg * .55, sn = Math.sin(t), cs = Math.cos(t); return cromo("M" + q(P(.2 * sn, -.2 * cs, ZS + .4)) + " Q" + q(P(.24 * sn, -.24 * cs, ZS + 9)) + " " + q(P(.19 * sn, -.19 * cs, ZB0 + 2)), 1.6); }
    var schienale = tubo(-1) + tubo(1) + bd.s, pt = bd.pt;
    if (G > 0) {   // davanti si vede la parte imbottita di dentro: le due cuciture e i bottoni
      [-.36, .36].forEach(function (t) { schienale += tratto(linea(pt(.17, t, ZB0 + 1.2), pt(.17, t, ZB1 - 1.2)), scuro(R, .45), .7, op(.75)) + tratto(linea(pt(.17, t + .03, ZB0 + 1.2), pt(.17, t + .03, ZB1 - 1.2)), chiaro(R, .35), .4, op(.5)); });
      [-.7, 0, .7].forEach(function (t) { var c = pt(.168, t, (ZB0 + ZB1) / 2); schienale += cer(c[0] + .3, c[1] + .5, 1.15, scuro(R, .55), op(.55)) + cer(c[0], c[1], .85, nuovaR([[0, "#ffd0d6"], [1, scuro(R, .25)]], .35, .3, .8)); });
    } else {   // dietro: la finta pelle liscia con la cucitura e la stellina d'oro
      schienale += tratto(aperto([-.8, -.4, 0, .4, .8].map(function (t) { return pt(.214, t, ZB0 + 2.4); })), chiaro(R, .3), .5, "stroke-dasharray='1 .8' opacity='.7'");
      var cs = pt(.214, 0, (ZB0 + ZB1) / 2 + 1);
      schienale += stella5(cs[0], cs[1], 3.2, nuova(OTTONE, 0, 0, 1, 1), bordo("#7a4a00", .4));
    }
    schienale += tratto(aperto([-.95, -.5, 0, .5, .95].map(function (t) { return pt(.19, t, ZB1 + .2); })), chiaro(R, .5), .6, op(.75));   // il bordino in cima
    // la seduta: il piatto cromato, il cuscino gonfio (bordino, sette bottoni, le pieghe a raggiera) e il lucido
    var Fp = forma(0, 0, .185, .185, .185, 2.6), Fc = forma(0, 0, .205, .205, .205, 2.8), sed = "";
    sed += corpo([giro(Fp, ZS - .8, 1, 48), giro(Fp, ZS + 1.2, 1, 48)], CROMO_C, 1.2);
    var lv = [giro(Fc, ZS + .8, .96, 64), giro(Fc, ZS + 3.4, 1.02, 64), giro(Fc, ZT - 1.6, 1, 64), giro(Fc, ZT - .3, .86, 64), giro(Fc, ZT, .5, 48)];
    sed += corpo(lv, [[0, chiaro(R, .32)], [.35, R], [1, scuro(R, .5)]], 1.6);
    sed += tratto(aperto(metaAnello(0, 0, .2, ZS + 1.4, 30)[1]), scuro(R, .5), .7, op(.6));   // la cucitura sotto
    var top = giro(Fc, ZT - .4, .88, 64), bt = limiti(top);
    sed += pth(chiuso(top), nuovaR([[0, chiaro(R, .42)], [.55, chiaro(R, .1)], [1, scuro(R, .12)]], .36, .3, .85));
    sed += pth(chiuso(giro(Fc, ZT - .9, .93, 64)), "none", "stroke='" + chiaro(R, .5) + "' stroke-width='.6' opacity='.75'");   // il bordino
    var bot = [[0, 0]];
    for (i = 0; i < 6; i++) bot.push([.1 * Math.cos(i * Math.PI / 3 + .3), .1 * Math.sin(i * Math.PI / 3 + .3)]);
    for (i = 1; i < 7; i++) { var a1 = P(bot[i][0], bot[i][1], ZT - .2), a2 = P(bot[i][0] * 1.72, bot[i][1] * 1.72, ZT - .9); sed += tratto(linea(a1, a2), scuro(R, .4), .5, op(.55)); }   // le pieghe
    sed += tratto(chiuso(bot.slice(1).map(function (v) { return P(v[0], v[1], ZT - .1); })), scuro(R, .35), .45, op(.45));
    bot.forEach(function (v) { var c = P(v[0], v[1], ZT); sed += cer(c[0] + .3, c[1] + .45, 1.05, scuro(R, .55), op(.5)) + cer(c[0], c[1], .78, nuovaR([[0, "#ffd0d6"], [1, scuro(R, .22)]], .35, .3, .8)); });
    sed += ell(bt[0] + (bt[2] - bt[0]) * .3, bt[1] + (bt[3] - bt[1]) * .34, (bt[2] - bt[0]) * .13, (bt[3] - bt[1]) * .14, "#ffffff", op(.28));   // il lucido della finta pelle
    if (G > 0) s += schienale + sed;
    else s += sed + schienale;
    return s;
  });

  // la ruota della fortuna piatta (centro cx, cy; raggio R): gli spicchi colorati, i due spicchi d'oro con la stella,
  // i pallini dei premi, i chiodini d'oro e il mozzo; ricca = la ruota grande (24 spicchi), se no la ruotina dei rulli
  var SPICCHI = ["#e8202b", "#ffd43b", "#1c7ed6", "#2fb84a", "#ae3ec9", "#ff922b", "#f06595", "#15aabf"];
  function ruotina(cx, cy, R, ricca) {
    var o = "", n = ricca ? 24 : 8, i, r0 = R * .22, r1 = R * (ricca ? .87 : .84);
    o += cer(cx, cy, R, nuovaR([[0, "#fff6c9"], [.55, "#e9b23a"], [1, "#9a6a14"]], .35, .3, .8), bordo(L, Math.max(.35, R * .05)));
    for (i = 0; i < n; i++) {
      var a0 = -Math.PI / 2 - Math.PI / n + i * 2 * Math.PI / n, a1 = a0 + 2 * Math.PI / n, am = (a0 + a1) / 2, oro = ricca && i % 12 === 0;
      var c = oro ? "#f5c518" : SPICCHI[i % SPICCHI.length];
      if (NOTTE) c = chiaro(c, .2);
      o += "<path d='M" + q(cx + r0 * Math.cos(a0), cy + r0 * Math.sin(a0)) + " L" + q(cx + r1 * Math.cos(a0), cy + r1 * Math.sin(a0)) + " A" + f2(r1) + "," + f2(r1) + " 0 0,1 " + q(cx + r1 * Math.cos(a1), cy + r1 * Math.sin(a1)) +
        " L" + q(cx + r0 * Math.cos(a1), cy + r0 * Math.sin(a1)) + " A" + f2(r0) + "," + f2(r0) + " 0 0,0 " + q(cx + r0 * Math.cos(a0), cy + r0 * Math.sin(a0)) + " Z' fill='" + c + "' stroke='#5c3a10' stroke-width='" + f2(Math.max(.18, R * .012)) + "'/>";
      if (ricca) {
        var rm = R * .64, mx = cx + rm * Math.cos(am), my = cy + rm * Math.sin(am);
        if (oro) o += stella5(mx, my, R * .1, "#fff8d6", bordo("#9a6a14", R * .012));
        else o += "<g transform='translate(" + q(mx, my) + ") rotate(" + f1(am * 57.3 + 90) + ")'>" + rett(-R * .035, -R * .085, R * .07, R * .17, R * .015, "#ffffff", op(.92)) + rett(-R * .02, -R * .05, R * .04, R * .025, 0, scuro(c, .3)) + rett(-R * .02, R * .005, R * .04, R * .025, 0, scuro(c, .3)) + "</g>";
      }
    }
    o += cer(cx, cy, r1, nuovaR([[0, "#ffffff", NOTTE ? .25 : .32], [.5, "#ffffff", 0], [.85, "#000000", 0], [1, "#000000", .28]], .38, .32, .75));   // la luce sulla ruota: chiara in alto a sinistra, scura sul bordo
    for (i = 0; i < n; i++) { var ap = -Math.PI / 2 - Math.PI / n + i * 2 * Math.PI / n; o += cer(cx + r1 * Math.cos(ap), cy + r1 * Math.sin(ap), Math.max(.3, R * .025), "#fff3c4", bordo("#7a5214", Math.max(.12, R * .008))); }   // i chiodini
    o += cer(cx, cy, r0, nuovaR([[0, "#fff6c9"], [.5, "#e2b444"], [1, "#8a5c12"]], .35, .3, .8), bordo(L, Math.max(.3, R * .03))) + stella5(cx, cy + R * .01, r0 * .66, NOTTE ? "#fffbe6" : "#fff3c4", bordo("#9a6a14", Math.max(.1, R * .01)));
    return o;
  }

  // =========================================================
  //  SLOT DELLA RUOTA (come la "Wheel of Fortune" di Las Vegas): la slot viola laccata con le rifiniture d'oro sulla base
  //  nera; in cima la grande ruota luminosa nella sua cornice d'oro, con le 24 caselle colorate, i due spicchi d'oro della
  //  stella, i chiodini, il mozzo, la lancetta rossa e la corona di lampadine; sotto l'insegna con la ruotina, i tre rulli
  //  (due 7 e la ruota che fa girare la ruota grande), i crediti, la pulsantiera, la pancia coi raggi e le monete, il vassoio.
  //  Dietro: lo sportello di servizio, le prese d'aria e il coperchio tondo della ruota
  // =========================================================
  def("slot_ruota", { tipo: "piedi", nome: "Slot della ruota", fp: [1, 1], box: [-39, -177, 37, 20], dietro: true, luce: [0, -.04, 144, 96, "#ffcf6e"] }, function () {
    var A0 = -.33, A1 = .33, B0 = -.35, B1 = .21, Z0 = 36, ZT = 114, VIOLA = "#6a2bc2", RW = 24.5, ZW = ZT + 6 + RW, BW1 = .025, BW0 = -.1, i;
    var PROF = [[A0, Z0], [A1, Z0]].concat(arcoS(A1 - .05, ZT - 3, .05, 3, 0, Math.PI / 2, 5)).concat(arcoS(A0 + .05, ZT - 3, .05, 3, Math.PI / 2, Math.PI, 5));
    function davanti(T) {   // il davanti piatto (W × 78: y = 114 − z)
      var W = T.W, H = T.H, cx = W / 2, r = "";
      // l'insegna in alto: il vetro viola coi raggi, la ruotina d'oro e le stelline, nella cornice d'ottone con due lampadine
      var my = 2.6, mh = 9.4, mq = rq(2.2, my, W - 4.4, mh, 1.6), mi = rq(3.2, my + 1, W - 6.4, mh - 2, 1.1);
      var mc = rett(0, my, W, mh, 0, NOTTE ? nuovaR([[0, "#ffe9ff"], [.5, "#c85cf0"], [1, "#4b1380"]], .5, .5, .8) : nuovaR([[0, "#c58af0"], [.55, "#7b2fc0"], [1, "#2e0b52"]], .5, .5, .8));
      mc += raggiera(cx, my + mh / 2, 26, 24, "#ffe3ff", NOTTE ? .38 : .2, 0, 360) + ruotina(cx, my + mh / 2, 3.6);
      mc += stella(cx - 8.6, my + 3, 1, "#ffffff", op(.95)) + stella(cx + 9.4, my + 6.2, .9, "#ffffff", op(.85)) + stella(cx + 6.4, my + 2.4, .6, "#ffffff", op(.8)) + stella(cx - 11.6, my + 6.6, .7, "#ffffff", op(.8));
      if (NOTTE) r += pth(mq, "none", "stroke='#f3d9fa' stroke-width='2.6' opacity='.4'");
      r += pth(mq, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .6)) + dentro(mi, mc) + pth(mi, "none", "stroke='#3a0a5e' stroke-width='.4'");
      r += lampadine([[4.6, my + mh / 2], [W - 4.6, my + mh / 2]], .85, ["#fff3bf", "#ffd43b"]);
      // i tre rulli nella cornice cromata: due 7 e la ruota sulla linea che paga
      var bx = 3, by = 14.4, bw = W - 6, bh = 18.6, cor = rq(bx, by, bw, bh, 2.2);
      if (NOTTE) r += pth(cor, "none", "stroke='#ffe8a3' stroke-width='2.6' opacity='.4'");
      r += pth(cor, nuova([[0, "#ffffff"], [.45, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1), bordo(L, .7));
      var fx = bx + 1.7, fy = by + 1.6, fw = bw - 3.4, fh = bh - 3.2, fin = rq(fx, fy, fw, fh, 1.2), cy = fy + fh / 2;
      var cr = rulli(fx, fy, fw, fh, [["stella", "sette", "ciliegie"], ["campana", "sette", "moneta"], ["ciliegie", "ruota", "stella"]], .72, .9);
      cr += tratto("M" + f2(fx) + "," + f2(cy) + " H" + f2(fx + fw), NOTTE ? "#ff5c5c" : "#e03131", NOTTE ? .7 : .55, op(.9));
      cr += poly([[fx + fw * .1, fy], [fx + fw * .27, fy], [fx + fw * .12, fy + fh], [fx - fw * .05, fy + fh]], "#ffffff", op(.13)) + rett(fx, fy, fw, fh * .25, 0, nuova([[0, "#fff", .22], [1, "#fff", 0]], 0, 0, 0, 1));
      r += dentro(fin, cr) + pth(fin, "none", "stroke='#1a1b1f' stroke-width='.6'");
      [[bx + .75, 1], [bx + bw - .75, -1]].forEach(function (f) { r += poly([[f[0] - f[1] * .45, cy - 1.15], [f[0] + f[1] * .85, cy], [f[0] - f[1] * .45, cy + 1.15]], NOTTE ? "#ffd8d8" : "#e03131", bordo(L, .25)); });
      // i crediti, la bocca delle banconote, la gettoniera
      var ly = 35.2;
      r += rett(4.2, ly, 11.6, 4.2, .8, "#121216", bordo(L, .4)) + led("888", 5.5, ly + .8, 2.6, NOTTE ? "#ff5440" : "#d9302a", NOTTE);
      r += rett(cx - 3.2, ly, 6.4, 4.2, .7, nuova([[0, "#3a3d44"], [1, "#16171b"]], 0, 0, 0, 1), bordo(L, .4)) + rett(cx - 2.4, ly + 1.7, 4.8, .7, .3, NOTTE ? "#8cff9e" : "#2f9e44");
      r += rett(W - 11.4, ly - .3, 7.4, 4.8, 1, nuova([[0, "#ffffff"], [.5, "#ced4da"], [1, "#7d868e"]], 0, 0, 1, 1), bordo(L, .45)) + rett(W - 6.6, ly + .5, .7, 3.2, .3, "#202226") + monetaD(W - 9.1, ly + 2.1, 1.2);
      // la pancia: il vetro viola coi raggi d'oro, la pila di monete e le stelle, nella cornice d'oro
      var gx = 3, gy = 48.6, gw = W - 6, gh = 19, pan = rq(gx, gy, gw, gh, 1.6);
      r += pth(pan, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .6));
      var px = gx + 1.1, py = gy + 1.1, pw = gw - 2.2, ph = gh - 2.2, pin = rq(px, py, pw, ph, 1);
      var b = rett(px, py, pw, ph, 0, NOTTE ? nuovaR([[0, "#ffd6ff"], [.5, "#b43be0"], [1, "#35095c"]], .5, .6, .75) : nuovaR([[0, "#b55ad8"], [.55, "#5f1a9a"], [1, "#24073d"]], .5, .6, .75));
      b += raggiera(cx, py + ph * .62, 30, 26, "#ffe066", NOTTE ? .34 : .18, 0, 360);
      [[cx - 7, 0], [cx + 7, 0], [cx, 1]].forEach(function (m) { var yy = py + ph - 3.4 - m[1] * 2.6, k; for (k = 0; k < 4 - m[1] * 2; k++) b += ell(m[0], yy - k * 1.25, 3.4, 1.15, nuova([[0, "#fff3b0"], [.5, "#f5c518"], [1, "#a8740f"]], 0, 0, 0, 1), bordo(L, .3)); });   // le pile di monete
      b += monetaD(cx, py + ph * .38, 3.6) + gemma(cx - 9.6, py + ph * .36, .42, "#ff4f9a") + gemma(cx + 9.6, py + ph * .36, .42, "#3bb2f6");
      b += stella(px + 3, py + 2.6, .9, "#ffffff", op(.9)) + stella(px + pw - 3.2, py + 3.4, .8, "#ffffff", op(.85)) + poly([[px + pw * .1, py], [px + pw * .24, py], [px + pw * .12, py + ph], [px - pw * .02, py + ph]], "#ffffff", op(.13));
      r += dentro(pin, b) + pth(pin, "none", "stroke='#3a0a5e' stroke-width='.4'");
      r += rett(0, 75.4, W, 2.6, 0, nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1)) + rett(0, 75.4, W, .35, 0, L, op(.5));   // lo zoccolo cromato
      // il bordo d'oro tutto intorno e il lucido della lacca
      r += pth(rq(.8, .8, W - 1.6, H - 1.6, 2.6), "none", "stroke='#f2c94c' stroke-width='1.1' opacity='.95'") + pth(rq(.8, .8, W - 1.6, H - 1.6, 2.6), "none", "stroke='#7a5214' stroke-width='.3' transform='translate(.4 .4)'");
      r += rett(0, 0, W, H, 0, nuova([[0, "#fff", .12], [.45, "#fff", 0]], 0, 0, 1, 1));
      return T.su(r);
    }
    function dietro(T) {   // la schiena: lo sportello di servizio, le prese d'aria, la serratura, l'etichetta
      var W = T.W, H = T.H, r = "", y;
      r += rett(0, 0, W, H, 0, nuova([[0, "#000", 0], [1, "#000", .15]], 0, 0, 0, 1));
      r += pth(rq(4.5, 8, W - 9, 58, 2), "none", "stroke='#2a0a4a' stroke-width='1.1'") + pth(rq(5.2, 8.7, W - 10.4, 56.6, 1.6), "none", "stroke='#b58af0' stroke-width='.45' opacity='.55'");
      r += cer(W - 8.6, 36, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4)) + rett(W - 8.8, 35.4, .4, 1.2, 0, "#3d4349");
      for (y = 13; y < 25; y += 1.8) r += rett(9, y, W - 18, .8, .4, "#1e0638");
      r += rett(8.5, 52, 10, 6.5, .5, "#f1ece2") + rett(9.5, 53.2, 5, .6, 0, "#868e96") + rett(9.5, 54.6, 8, .5, 0, "#adb5bd") + rett(9.5, 55.8, 6.5, .5, 0, "#adb5bd");
      r += rett(0, 75.4, W, 2.6, 0, nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 0, 1));
      return T.su(r + pth(rq(.8, .8, W - 1.6, H - 1.6, 2.6), "none", "stroke='#f2c94c' stroke-width='.9' opacity='.8'"));
    }
    function fascia(H) {   // i fianchi laccati: il filetto d'oro con la ruotina, il bordo d'oro vicino al davanti, il lucido
      var o = "", av = G > 0 ? A1 : A0, X0 = 61 * B0, X1 = 61 * B1;
      o += suA(av, pth(rq(X0 + 3.4, -ZT + 6, X1 - X0 - 6.8, 66, 3), "none", "stroke='#f2c94c' stroke-width='.9'") + pth(rq(X0 + 4.4, -ZT + 7, X1 - X0 - 8.8, 64, 2.4), "none", "stroke='#2a0a4a' stroke-width='.45' opacity='.7'") +
        ruotina(61 * (B0 + B1) / 2, -ZT + 39, 6.4));
      o += tratto(aperto(H.sez(G > 0 ? B1 - .022 : B0 + .022)), "#f2c94c", 1.1, op(.95)) + tratto(aperto(H.sez(G > 0 ? B1 - .036 : B0 + .036)), "#2a0a4a", .45, op(.6));
      return o + H.luccica(.5, .08, .92);
    }
    // in cima: il collo d'oro, la ruota grande (l'orlo spesso, la faccia, la lancetta) e le lampadine
    function cima() {
      var o = "", R = RW / 61, bV = G > 0 ? BW1 : BW0, k;
      function collo(W, H) { return rett(0, 0, W, 1.2, 0, "#fff3c4", op(.8)) + rett(W * .2, H * .35, W * .6, H * .3, H * .15, "#9a6a14", op(.5)); }
      o += blocco(-.13, .13, -.085, .005, ZT, ZT + 3.6, "#d9a83a", { davanti: collo, dietro: collo, fianco: collo }, 1.5);
      o += blocco(-.06, .06, -.06, -.01, ZT + 3.6, ZT + 7.5, "#d9a83a", null, 1.2);
      var orlo = [];
      for (k = 0; k < 72; k++) { var t = k / 72 * 2 * Math.PI; orlo.push(P(R * Math.cos(t), BW1, ZW + RW * Math.sin(t))); orlo.push(P(R * Math.cos(t), BW0, ZW + RW * Math.sin(t))); }
      var bo = limiti(orlo);
      o += pth(chiuso(inviluppo(orlo)), nuova([[0, "#fff3c4"], [.3, "#e8b13a"], [.7, "#a87418"], [1, "#5e3f0c"]], bo[0], 0, bo[2], 0, true), bordo(L, 2.2));
      var fac = "";
      if (G > 0) {   // la faccia: la corona viola con le lampadine, la ruota, il vetro, la lancetta
        if (NOTTE) fac += cer(0, -ZW, RW * 1.08, nuovaR([[0, "#fff3c4", .5], [.75, "#ffcf6e", .25], [1, "#ffcf6e", 0]], .5, .5, .5));
        fac += cer(0, -ZW, RW, nuovaR([[0, "#7b35d0"], [.8, "#4a1590"], [1, "#24073d"]], .5, .5, .5));
        fac += cer(0, -ZW, RW * .985, "none", "stroke='#f2c94c' stroke-width='1.2'") + cer(0, -ZW, RW * .88, "none", "stroke='#f2c94c' stroke-width='1'");
        fac += ruotina(0, -ZW, RW * .86, true);
        for (k = 0; k < 20; k++) { var al = k / 20 * 2 * Math.PI - Math.PI / 2 + Math.PI / 20; fac += lampadina(RW * .935 * Math.cos(al), -ZW + RW * .935 * Math.sin(al), 1.05, ["#fff3bf", "#ffd43b"][k % 2]); }
        fac += pth("M" + q(-RW * .62, -ZW - RW * .1) + " A" + f1(RW * .8) + "," + f1(RW * .8) + " 0 0,1 " + q(RW * .1, -ZW - RW * .74) + " A" + f1(RW * .95) + "," + f1(RW * .95) + " 0 0,0 " + q(-RW * .62, -ZW - RW * .1) + " Z", "#ffffff", op(NOTTE ? .12 : .22));   // il riflesso del vetro
        // la lancetta rossa in cima, col perno d'oro
        var py = -ZW - RW * .99;
        fac += pth("M" + q(-3.2, py - 1.4) + " C" + q(-3.4, py + 2.6) + " " + q(-1.2, py + 5.6) + " " + q(0, py + 8.4) + " C" + q(1.2, py + 5.6) + " " + q(3.4, py + 2.6) + " " + q(3.2, py - 1.4) + " Z", nuova([[0, "#ff8787"], [.5, "#e8202b"], [1, "#8a0f16"]], 0, 0, 1, 1), bordo(L, .8));
        fac += tratto("M" + q(-1.8, py) + " C" + q(-1.8, py + 2.6) + " " + q(-.8, py + 4.6) + " " + q(-.2, py + 6.2), "#ffffff", .6, op(.7)) + cer(0, py + .2, 1.7, nuovaR(OTTONE, .35, .3, .8), bordo(L, .5)) + cer(-.5, py - .3, .5, "#ffffff", op(.9));
      } else {   // il coperchio di dietro: viola scuro, le prese d'aria e il tappo d'oro
        fac += cer(0, -ZW, RW, nuovaR([[0, "#5b2a9e"], [.8, "#3b1270"], [1, "#1e0638"]], .4, .4, .7));
        fac += cer(0, -ZW, RW * .985, "none", "stroke='#f2c94c' stroke-width='1.2'") + cer(0, -ZW, RW * .7, "none", "stroke='#1e0638' stroke-width='.8'");
        for (k = 0; k < 12; k++) { var ak = k / 12 * 2 * Math.PI; fac += tratto(linea([RW * .3 * Math.cos(ak), -ZW + RW * .3 * Math.sin(ak)], [RW * .62 * Math.cos(ak), -ZW + RW * .62 * Math.sin(ak)]), "#1e0638", 1.1, op(.8)); }
        fac += cer(0, -ZW, RW * .18, nuovaR(OTTONE, .35, .3, .8), bordo(L, .6)) + cer(-1.2, -ZW - 1.3, 1, "#ffffff", op(.6));
        for (k = 0; k < 20; k++) { var al2 = k / 20 * 2 * Math.PI; fac += cer(RW * .9 * Math.cos(al2), -ZW + RW * .9 * Math.sin(al2), .55, "#f2c94c", op(.85)); }   // le viti
      }
      o += suB(bV, fac);
      return o;
    }
    var corpoS = estruso("b", PROF, B0, B1, VIOLA, { mat: { lucido: .7, esp: 22 }, tappo: G > 0 ? davanti : dietro, fascia: fascia, lw: 2.4 });
    var sporge = vassoio(-.25, .25, B1, B1 + .15, 36.4, 43.6, 11, 9) + pulsantiera(A0 + .025, A1 - .025, B1, B1 + .12, 74, 70.6, 67.6, [[2.6, 4.4, "#f8f9fa"], [8, 4.4, "#ffd43b"], [13.4, 4.4, "#4dabf7"], [19, 5.6, "#ff922b"], [27.2, 6.8, "#e8202b", 1]]);
    var s = ombraPianta(A0, A1, B0, B1 + .15, 1, .06), bs = base(A0 + .006, A1 - .006, B0 + .012, B1 - .014, Z0, true);
    if (G > 0) s += bs + corpoS + sporge + cima();
    else s += sporge + bs + corpoS + cima() + cavo(.12, B0 + .012, 8);
    return s;
  });

  // le palline d'argento (pachinko): una pallina lucida vista di fronte, e tante palline sparse in un vassoio
  function argento(x, y, r) { return cer(x + r * .15, y + r * .2, r, "#000", op(.35)) + cer(x, y, r, rad("ag", [[0, "#ffffff"], [.35, "#e9ecef"], [.75, "#9aa3ab"], [1, "#4f575e"]], .35, .3, .75), bordo("#2b3035", r * .16)) + cer(x - r * .32, y - r * .36, r * .3, "#ffffff", op(.95)); }
  function mucchio(a0, a1, b0, b1, z, n, seme, r) {   // n palline tra a0..a1 e b0..b1 all'altezza z, dalla più lontana alla più vicina
    var rr = rnd(seme), pp = [], i;
    for (i = 0; i < n; i++) { var a = a0 + rr() * (a1 - a0), b = b0 + rr() * (b1 - b0); pp.push([a, b, z + rr() * 1.4 + (1 - Math.abs((a - (a0 + a1) / 2) / (a1 - a0) * 2)) * 1.6]); }
    pp.sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); });
    return pp.map(function (v) { var c = P(v[0], v[1], v[2]); return argento(c[0], c[1], r || 1.15); }).join("");
  }
  function girandola(x, y, R, cols) {   // il mulinello del pachinko (4 pale colorate col perno)
    var o = "", k;
    for (k = 0; k < 4; k++) { var t = k * Math.PI / 2 + .4, c = cols[k % cols.length]; o += pth("M" + q(x, y) + " L" + q(x + R * Math.cos(t), y + R * Math.sin(t)) + " Q" + q(x + R * .9 * Math.cos(t + .9), y + R * .9 * Math.sin(t + .9)) + " " + q(x + R * .2 * Math.cos(t + 1.5), y + R * .2 * Math.sin(t + 1.5)) + " Z", c, bordo(L, .25)); }
    return o + cer(x, y, R * .22, "#fff3c4", bordo(L, .25));
  }
  function tulipano(x, y, k, c) {   // il tulipano (la tasca che si apre): due petali e il cuore
    return g0(x, y, k, pth("M-2.6,-1.6 C-3,.6 -1.6,2.2 0,2.2 C1.6,2.2 3,.6 2.6,-1.6 L1.4,-.4 L0,-2 L-1.4,-.4 Z", nuova([[0, chiaro(c, .4)], [1, scuro(c, .25)]], 0, 0, 0, 1), bordo(L, .3)) + rett(-.6, 2, 1.2, 1.4, .3, "#c99a36"));
  }

  // =========================================================
  //  PACHINKO: la macchina giapponese alta e stretta. Sul basamento nero e oro, il telaio bianco perla con le strisce di
  //  luce rosa e azzurre e le casse; dietro il vetro il campo verticale: la guida cromata tonda, i chiodini d'ottone a file,
  //  lo schermo al centro nella cornice d'oro coi tre 7, i mulinelli, i tulipani, la buca di partenza, la porta del premio
  //  e le palline d'argento in volo; sotto i due vassoi pieni di palline e la manopola per tirare; in cima il contatore
  //  coi numeri rossi e la lampada di chiamata. Dietro: il retro di metallo col serbatoio delle palline, i binari e i fili
  // =========================================================
  def("pachinko", { tipo: "piedi", nome: "Pachinko", fp: [1, 1], box: [-35, -160, 31, 17], dietro: true, luce: [0, .1, 96, 78, "#ff8fd0"] }, function () {
    var A0 = -.27, A1 = .27, B0 = -.3, B1 = .17, Z0 = 50, ZM = 132, PERLA = "#e9e6f2", i, j;
    var s = ombraPianta(A0, A1, B0, B1 + .1, 1, .06);
    var bs = base(A0 + .01, A1 - .01, B0 + .01, B1 - .02, Z0, true);
    var PROF = [[A0, Z0], [A1, Z0]].concat(arcoS(A1 - .045, ZM - 3, .045, 3, 0, Math.PI / 2, 5)).concat(arcoS(A0 + .045, ZM - 3, .045, 3, Math.PI / 2, Math.PI, 5));
    function campo(w, h) {   // il campo da gioco (piatto, w × h, dall'alto in basso)
      var o = "", cx = w / 2, cy = h * .47, R = w * .47, rr = rnd(1949), k;
      // il fondo fuori dalla guida: rosa e viola coi fiori di ciliegio
      o += rett(0, 0, w, h, 0, NOTTE ? nuova([[0, "#ff9ee0"], [.5, "#b84fe8"], [1, "#4a1a9e"]], 0, 0, 0, 1) : nuova([[0, "#f783c9"], [.5, "#8e3bc4"], [1, "#2c1066"]], 0, 0, 0, 1));
      [[2, 3], [w - 2.4, 4.4], [2.6, h - 4], [w - 2.2, h - 3]].forEach(function (f) { for (k = 0; k < 5; k++) { var t = k * 1.2566 - 1.57; o += ell(f[0] + Math.cos(t) * 1.1, f[1] + Math.sin(t) * 1.1, .9, .9, "#ffd6ea"); } o += cer(f[0], f[1], .5, "#ff6fa8"); });
      // il campo tondo: azzurro notte coi raggi d'oro
      var gir = ellD(cx, cy, R, R * 1.08);
      var c = pth(gir, NOTTE ? nuovaR([[0, "#5ad1ff"], [.5, "#1d5fd6"], [1, "#0b1d66"]], .5, .45, .7) : nuovaR([[0, "#3ab0e8"], [.5, "#1a4fb0"], [1, "#0a1650"]], .5, .45, .7));
      c += raggiera(cx, cy - h * .06, 30, 30, "#ffe066", NOTTE ? .3 : .16, 0, 360);
      for (k = 0; k < 14; k++) c += stella(cx - R + rr() * R * 2, cy - R + rr() * R * 2, .3 + rr() * .45, "#ffffff", op(.4 + rr() * .5));
      // i chiodini d'ottone: le file a imbuto verso la buca di partenza, gli archi attorno ai mulinelli, le file in basso
      var ch = "";
      function chiodo(x, y) { ch += cer(x + .12, y + .15, .34, "#000", op(.4)) + cer(x, y, .32, "#f3d27a") + cer(x - .1, y - .1, .12, "#ffffff", op(.9)); }
      for (k = 0; k < 7; k++) { chiodo(cx - 11 + k * 1.15, cy + 1 + k * 1.6); chiodo(cx + 11 - k * 1.15, cy + 1 + k * 1.6); }
      for (k = 0; k < 6; k++) { chiodo(cx - 12.6 + k * .4, cy - 8 + k * 1.6); chiodo(cx + 12.6 - k * .4, cy - 8 + k * 1.6); }
      for (k = 0; k < 5; k++) { chiodo(cx - 2.6 + k * 1.3, cy + 13.6); }
      for (k = 0; k < 9; k++) { chiodo(cx - 9 + k * 2.25, cy + 17.2 + (k % 2) * 1.1); }
      [[-6.2, -12.4], [-4, -13.6], [-1.4, -14.2], [1.4, -14.2], [4, -13.6], [6.2, -12.4], [-8, 6], [8, 6], [-5.6, 9.4], [5.6, 9.4]].forEach(function (v) { chiodo(cx + v[0], cy + v[1]); });
      c += ch;
      // i mulinelli e i tulipani
      c += girandola(cx - 9.4, cy - 2.4, 2.3, ["#ff6b6b", "#ffd43b", "#69db7c", "#74c0fc"]) + girandola(cx + 9.4, cy - 2.4, 2.3, ["#74c0fc", "#ff6b6b", "#ffd43b", "#69db7c"]);
      c += tulipano(cx - 7.2, cy + 11.6, .62, "#ff4f6d") + tulipano(cx + 7.2, cy + 11.6, .62, "#ff4f6d") + tulipano(cx, cy + 9.6, .5, "#ffd43b");
      // lo schermo al centro: la cornice d'oro con le ali, i tre 7 su fondo blu, la buca di partenza sotto
      var sx = cx - 6.8, sy = cy - 9.6, sw = 13.6, sh = 9.6;
      c += pth("M" + q(sx - 3, sy + 1) + " Q" + q(cx, sy - 5.4) + " " + q(sx + sw + 3, sy + 1) + " L" + q(sx + sw + 1.6, sy + sh + 1.6) + " Q" + q(cx, sy + sh + 4.2) + " " + q(sx - 1.6, sy + sh + 1.6) + " Z", nuova(OTTONE, 0, 0, 0, 1), bordo(L, .5));
      c += pth("M" + q(sx - 2.4, sy + 1.2) + " Q" + q(cx, sy - 4.4) + " " + q(sx + sw + 2.4, sy + 1.2), "none", "stroke='#fff6cf' stroke-width='.4' opacity='.9'");
      var scr = rq(sx, sy, sw, sh, 1.2), sc = rett(sx, sy, sw, sh, 0, NOTTE ? nuova([[0, "#2b3fd6"], [1, "#0b1450"]], 0, 0, 0, 1) : nuova([[0, "#1c2a90"], [1, "#070c33"]], 0, 0, 0, 1));
      sc += raggiera(cx, sy + sh / 2, 12, 20, "#ffffff", .1, 0, 360);
      sc += simbolo("sette", cx - 4.2, sy + sh / 2, .36) + simbolo("sette", cx, sy + sh / 2, .36) + simbolo("sette", cx + 4.2, sy + sh / 2, .36);
      sc += rett(sx, sy, sw, sh * .4, 0, "#ffffff", op(.12));
      c += dentro(scr, sc) + pth(scr, "none", "stroke='#1a1b1f' stroke-width='.4'");
      c += pth("M" + q(cx - 1.6, cy + 4.6) + " L" + q(cx + 1.6, cy + 4.6) + " L" + q(cx + 1.1, cy + 6.4) + " L" + q(cx - 1.1, cy + 6.4) + " Z", nuova(OTTONE, 0, 0, 0, 1), bordo(L, .3));   // la buca di partenza
      // la porta del premio in basso (aperta, rossa) e la buca di uscita
      c += rett(cx - 4.4, cy + 19.6, 8.8, 2.6, .6, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .3)) + rett(cx - 3.6, cy + 20.2, 7.2, 1.4, .4, NOTTE ? "#ff6b6b" : "#c92a2a");
      // le palline d'argento: in salita lungo la guida e qua e là tra i chiodini
      [[cx - R * .82, cy - R * .62], [cx - R * .55, cy - R * .92], [cx - 4.6, cy + 3.4], [cx + 6.6, cy + 7.6], [cx - 9, cy + 14.8], [cx + 3.4, cy + 15.8], [cx + 10.6, cy - 6.4]].forEach(function (v) { c += argento(v[0], v[1], .62); });
      o += dentro(gir, c);
      // la guida cromata tutt'intorno
      o += pth(gir, "none", "stroke='" + L + "' stroke-width='2.2'") + pth(gir, "none", "stroke='#c3cbd2' stroke-width='1.4'") + pth(ellD(cx - .2, cy - .25, R - .2, R * 1.08 - .2), "none", "stroke='#ffffff' stroke-width='.4' opacity='.85'");
      // il vetro
      o += poly([[w * .08, 0], [w * .3, 0], [w * .05, h], [-w * .17, h]], "#ffffff", op(NOTTE ? .06 : .14)) + poly([[w * .4, 0], [w * .46, 0], [w * .21, h], [w * .15, h]], "#ffffff", op(NOTTE ? .05 : .1));
      return o;
    }
    function davanti(T) {   // il telaio davanti (W × 82: y = 132 − z)
      var W = T.W, H = T.H, cx = W / 2, r = "", k;
      // la striscia di luce in cima (i led arcobaleno)
      var LED = ["#ff6b6b", "#ffa94d", "#ffe066", "#69db7c", "#4dd9ff", "#748ffc", "#da77f2"];
      r += rett(3, 1.6, W - 6, 3.2, 1.4, "#24202e", bordo(L, .4));
      for (k = 0; k < 9; k++) { var lc = LED[k % LED.length]; r += (NOTTE ? rett(4.1 + k * (W - 8.2) / 9 - .4, 1.8, (W - 8.2) / 9 + .2, 2.8, 1, lc, op(.45)) : "") + rett(4.3 + k * (W - 8.2) / 9, 2.4, (W - 8.2) / 9 - .6, 1.6, .6, NOTTE ? chiaro(lc, .45) : lc); }
      // il ventaglio giapponese sopra il vetro: le stecche rosa e oro, il sole rosso, tra le due casse
      var fy = 18.4, FR = 11.6, ven = "";
      ven += pth("M" + q(cx - FR, fy) + " A" + f1(FR) + "," + f1(FR) + " 0 0,1 " + q(cx + FR, fy) + " Z", nuova(OTTONE, 0, 0, 0, 1), bordo(L, .6));
      for (k = 0; k < 8; k++) {
        var t0 = Math.PI + k * Math.PI / 8 + .04, t1 = Math.PI + (k + 1) * Math.PI / 8 - .04, rr0 = FR - 1;
        ven += pth("M" + q(cx, fy) + " L" + q(cx + rr0 * Math.cos(t0), fy + rr0 * Math.sin(t0)) + " A" + f1(rr0) + "," + f1(rr0) + " 0 0,1 " + q(cx + rr0 * Math.cos(t1), fy + rr0 * Math.sin(t1)) + " Z", k % 2 ? (NOTTE ? "#ffd6ef" : "#f783c9") : (NOTTE ? "#ffffff" : "#fff0f6"), bordo("#b0337d", .25));
      }
      ven += pth("M" + q(cx - 4.4, fy) + " A4.4,4.4 0 0,1 " + q(cx + 4.4, fy) + " Z", nuovaR(NOTTE ? [[0, "#fff3bf"], [.5, "#ff6b6b"], [1, "#c92a2a"]] : [[0, "#ff8787"], [.6, "#e03131"], [1, "#a51111"]], .5, 1, .9), bordo(L, .4));
      ven += cer(cx, fy, 1, "#f3d27a", bordo(L, .3)) + rett(cx - FR - .6, fy - .4, FR * 2 + 1.2, 1.4, .6, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .35));
      if (NOTTE) r += pth("M" + q(cx - FR, fy) + " A" + f1(FR) + "," + f1(FR) + " 0 0,1 " + q(cx + FR, fy) + " Z", "none", "stroke='#ffd6ef' stroke-width='2.4' opacity='.45'");
      r += ven;
      [[4.4, 9.6], [W - 4.4, 9.6]].forEach(function (v) { r += cer(v[0], v[1], 2.4, nuovaR([[0, "#5c5f66"], [1, "#1c1d21"]], .4, .35, .8), bordo(L, .4)); for (k = -1; k <= 1; k++) r += rett(v[0] - 1.5, v[1] + k * .9 - .2, 3, .4, .2, "#0c0c0f"); });
      // la cornice del vetro (cromo e la striscia rosa di luce) e il campo
      var gx = 2.6, gy = 21.2, gw = W - 5.2, gh = 43.4, fin = rq(gx, gy, gw, gh, 2.6), fuori = rq(gx - 1.1, gy - 1.1, gw + 2.2, gh + 2.2, 3.2);
      if (NOTTE) r += pth(fin, "none", "stroke='#ffc9ef' stroke-width='3.6' opacity='.5'");
      r += pth(fuori, nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#6c767e"]], 0, 0, 1, 1), bordo(L, .6)) + pth(rq(gx - .5, gy - .5, gw + 1, gh + 1, 2.9), "none", "stroke='" + (NOTTE ? "#ffd6ef" : "#f06595") + "' stroke-width='.6'");
      DEFS.push("<g id='" + p + "cmp'>" + campo(gw, gh) + "</g>");
      r += dentro(fin, "<use href='#" + p + "cmp' xlink:href='#" + p + "cmp' transform='translate(" + f2(gx) + " " + f2(gy) + ")'/>") + pth(fin, "none", "stroke='#1a1b1f' stroke-width='.5'");
      // le strisce di luce ai lati del vetro (rosa a sinistra, azzurra a destra)
      [[1.1, "#ff5fb8"], [W - 1.1, "#4dd9ff"]].forEach(function (v) { var d = "M" + f2(v[0]) + "," + f2(6) + " V" + f2(gy + gh - 2); r += NOTTE ? tratto(d, v[1], 2.6, op(.45)) + tratto(d, chiaro(v[1], .5), 1.1) : tratto(d, v[1], 1, op(.95)) + tratto(d, "#ffffff", .3, op(.6)); });
      // sotto il vetro: la mascherina col tasto giallo
      r += rett(3, 66.2, W - 6, 2.6, 1, nuova([[0, "#ffffff"], [1, "#b8bec8"]], 0, 0, 0, 1), bordo(L, .4)) + rett(cx - 3, 66.7, 6, 1.6, .8, NOTTE ? "#ffe066" : "#f2b705", bordo(L, .3));
      r += rett(0, 0, W, H, 0, nuova([[0, "#fff", .18], [.5, "#fff", 0]], 0, 0, 1, 1));
      return T.su(r);
    }
    function dietro(T) {   // il retro di metallo: il serbatoio trasparente con le palline, i binari, la scheda verde, i fili
      var W = T.W, H = T.H, r = "", k;
      r += rett(0, 0, W, H, 0, nuova([[0, "#9aa1aa"], [1, "#5f6670"]], 0, 0, 0, 1));
      r += rett(3, 3, W - 6, 13, 1.2, nuova([[0, "#e7f5ff", .55], [1, "#a5d8ff", .45]], 0, 0, 0, 1), bordo(L, .5));   // il serbatoio
      var rr = rnd(77); for (k = 0; k < 26; k++) r += argento(4.4 + rr() * (W - 8.8), 9 + rr() * 6, .62);
      r += rett(3, 3, W - 6, 2, .8, "#ffffff", op(.4));
      r += tratto("M" + f2(W - 6) + ",16 V22 Q" + f2(W - 6) + ",25 " + f2(W - 9) + ",25 H8 Q5,25 5,28 V36", "#d0d5db", 1.8) + tratto("M" + f2(W - 6) + ",16 V22 Q" + f2(W - 6) + ",25 " + f2(W - 9) + ",25 H8 Q5,25 5,28 V36", "#5f6670", .5);   // il binario delle palline
      r += rett(9, 29, W - 15, 14, .8, nuova([[0, "#2f9e44"], [1, "#1b5e2b"]], 0, 0, 1, 1), bordo(L, .4));   // la scheda
      for (k = 0; k < 3; k++) r += rett(11 + k * 5.4, 32, 3.8, 2.6, .3, "#1c1d21") + rett(11.4 + k * 5.4, 36.4, 2.4, 1.4, .2, "#d4b14a");
      r += tratto("M12,43 Q14,50 9,56 M18,43 Q20,52 24,58", "#e03131", .7) + tratto("M15,43 Q16,51 13,60", "#1c7ed6", .7) + tratto("M21,43 Q19,50 20,61", "#fab005", .7);
      r += rett(5, 47, 9, 6, .5, "#f1ece2") + rett(6, 48.2, 5, .6, 0, "#868e96") + rett(6, 49.6, 7, .5, 0, "#adb5bd");
      for (k = 0; k < 6; k++) r += rett(W * .22, 66 + k * 1.8, W * .56, .8, .4, "#3d434b");   // le prese d'aria
      return T.su(r + rett(.8, .8, W - 1.6, H - 1.6, 1.6, "none", "stroke='#d0d5db' stroke-width='.8'"));
    }
    function decalco(x, y, w, h) {   // l'adesivo sul fianco: rosa e viola coi fiori di ciliegio e le stelline
      var d = rq(x, y, w, h, 3), c = rett(x, y, w, h, 0, NOTTE ? nuova([[0, "#ffc9ef"], [.55, "#d36ee8"], [1, "#6741d9"]], 0, 0, 0, 1) : nuova([[0, "#f783c9"], [.55, "#b04ad6"], [1, "#4c2a9e"]], 0, 0, 0, 1)), k;
      [[x + w * .35, y + h * .26, 3.4], [x + w * .7, y + h * .55, 2.6], [x + w * .3, y + h * .8, 2]].forEach(function (f) {
        for (k = 0; k < 5; k++) { var t = k * 1.2566 - 1.57; c += ell(f[0] + Math.cos(t) * f[2] * .5, f[1] + Math.sin(t) * f[2] * .5, f[2] * .42, f[2] * .42, "#fff0f6", bordo("#d6336c", .2)); }
        c += cer(f[0], f[1], f[2] * .22, "#ffd43b");
      });
      c += stella(x + w * .75, y + h * .18, 1.2, "#ffffff", op(.9)) + stella(x + w * .22, y + h * .55, .9, "#ffffff", op(.8)) + stella(x + w * .66, y + h * .86, 1, "#ffffff", op(.85));
      return dentro(d, c) + pth(d, "none", "stroke='#ffffff' stroke-width='.7' opacity='.8'");
    }
    function fascia(H) {   // i fianchi bianco perla: la striscia di luce lungo il bordo davanti e il lucido
      var o = "", av = G > 0 ? A1 : A0, x0 = 61 * B0, x1 = 61 * B1, d = "M" + f2(G > 0 ? x1 - 2 : x0 + 2) + "," + f2(-Z0 - 3) + " V" + f2(-ZM + 3);
      o += suA(av, (NOTTE ? tratto(d, "#4dd9ff", 2.6, op(.4)) + tratto(d, "#c5f6fa", 1.1) : tratto(d, "#4dd9ff", 1.1, op(.95)) + tratto(d, "#ffffff", .35, op(.6))) +
        decalco(x0 + 4, -ZM + 8, x1 - x0 - 8, 46));
      return o + H.luccica(.55, .06, .94);
    }
    var telaio = estruso("b", PROF, B0 + .02, B1, PERLA, { mat: { lucido: .7, esp: 20 }, tappo: G > 0 ? davanti : dietro, fascia: fascia, lw: 2.3 });
    // i due vassoi davanti (bianco perla col bordo cromato), pieni di palline d'argento, e la manopola a destra
    function vassoioP(z0, z1, b1, n, seme) {
      var a0 = A0 + .03, a1 = A1 - .1, v = blocco(a0, a1, B1, b1, z0, z1, PERLA, { davanti: function (W, H) { return rett(0, .3, W, .9, 0, "#ffffff", op(.9)) + rett(0, H - 1.2, W, 1.2, 0, "#b8bec8"); } }, 1.4);
      if (G < 0) return v;
      var bocca = chiuso([P(a0 + .02, B1, z1), P(a1 - .02, B1, z1), P(a1 - .02, b1 - .02, z1), P(a0 + .02, b1 - .02, z1)]);
      return v + pth(bocca, "#3a3f47") + dentro(bocca, mucchio(a0 + .03, a1 - .03, B1 + .01, b1 - .03, z1 - 2.6, n, seme, 1.05)) + mucchio(a0 + .05, a1 - .05, B1 + .02, b1 - .05, z1 - .6, Math.round(n / 3), seme + 1, 1.05);
    }
    var sporge = vassoioP(Z0 + 1, Z0 + 5.4, B1 + .1, 10, 5) + vassoioP(Z0 + 7.6, Z0 + 12, B1 + .13, 16, 9);
    var mc = P(A1 - .05, B1 + .02, Z0 + 4.6), man = "";   // la manopola: la ghiera cromata, la gomma nera e il bottone rosso
    man += ell(mc[0] + .6, mc[1] + 1.2, 4.2, 3.6, "#000", op(.3)) + ell(mc[0], mc[1], 4.1, 3.6, nuovaR([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#5c666e"]], .35, .3, .8), bordo(L, .6));
    man += ell(mc[0] - .6, mc[1] + .3, 3, 2.6, nuovaR([[0, "#5c5f66"], [1, "#16171b"]], .35, .3, .8)) + ell(mc[0] - 1, mc[1] + .5, 1.3, 1.1, NOTTE ? "#ff8787" : "#e03131", bordo(L, .3)) + ell(mc[0] - 1.9, mc[1] - .9, .9, .6, "#ffffff", op(.7));
    // in cima: il contatore coi numeri rossi e la lampada di chiamata
    function contaD(W, H) { return rett(1.4, 1.2, W - 2.8, H - 2.4, .8, "#0b0b0e") + led("27", W / 2 - ledL("27", 4.4) / 2, H / 2 - 2.2, 4.4, NOTTE ? "#ff5440" : "#d9302a", NOTTE) + rett(1.4, 1.2, W - 2.8, (H - 2.4) * .4, .8, "#ffffff", op(.08)); }
    var conta = blocco(-.17, .17, -.2, .02, ZM, ZM + 9, "#24212a", { davanti: contaD, dietro: function (W, H) { return rett(W * .3, H * .3, W * .4, H * .2, .5, "#000", op(.5)); } }, 1.6);
    var Fd = forma(0, -.09, .085, .085, .085, 2), lam = "", zl = ZM + 9;
    lam += corpo([giro(Fd, zl, 1.1, 32), giro(Fd, zl + 1.6, 1.1, 32)], CROMO_C, .8);
    var cup = NOTTE ? [[0, "#ffffff"], [.4, "#ffc9ef"], [1, "#ff5fb8"]] : [[0, "#ffc9ef"], [.45, "#f06595"], [1, "#a61e4d"]];
    lam += corpo([giro(Fd, zl + 1.6, 1, 32), giro(Fd, zl + 5, .95, 32), giro(Fd, zl + 7.6, .7, 32), giro(Fd, zl + 9, .3, 24)], cup, 1);
    var lc2 = P(-.03, -.09, zl + 6.4); lam += ell(lc2[0] - 1.2, lc2[1] - .6, 1.6, 1, "#ffffff", op(.75));
    if (NOTTE) { var lc3 = P(0, -.09, zl + 4.5); lam += cer(lc3[0], lc3[1], 11, nuovaR([[0, "#ffc9ef", .6], [1, "#ff5fb8", 0]], .5, .5, .5)); }
    if (G > 0) s += bs + telaio + sporge + man + conta + lam;
    else s += sporge + man + bs + telaio + conta + lam + cavo(.1, B0 + .01, 8);
    return s;
  });

  // ---------- i peluche (disegnati in piedi, il punto (x, y) è in basso al centro; alti circa 12·k) ----------
  function morbido(c) { return nuovaR([[0, chiaro(c, .45)], [.55, c], [1, scuro(c, .3)]], .35, .3, .85); }
  function occhietti(x1, x2, y, r) { return [x1, x2].map(function (x) { return cer(x, y, r, "#1b1b22") + cer(x - r * .35, y - r * .35, r * .38, "#ffffff"); }).join(""); }
  function peluche(t, x, y, k, c) {
    var o = "", w = .45;
    if (t === "orso" || t === "gatto") {
      var ch = chiaro(c, .5);
      o += ell(-2, -.9, 1.6, 1.15, morbido(c), bordo(L, w)) + ell(2, -.9, 1.6, 1.15, morbido(c), bordo(L, w)) + ell(-2, -.8, .8, .55, ch) + ell(2, -.8, .8, .55, ch);
      o += ell(-3.3, -4.6, 1.2, 1.7, morbido(c), bordo(L, w) + " transform='rotate(25 -3.3 -4.6)'") + ell(3.3, -4.6, 1.2, 1.7, morbido(c), bordo(L, w) + " transform='rotate(-25 3.3 -4.6)'");
      o += ell(0, -3.7, 3.4, 3.3, morbido(c), bordo(L, w)) + ell(0, -3.3, 1.9, 1.8, ch, op(.85));
      if (t === "orso") o += cer(-3, -12.1, 1.45, morbido(c), bordo(L, w)) + cer(3, -12.1, 1.45, morbido(c), bordo(L, w)) + cer(-3, -12.1, .75, ch) + cer(3, -12.1, .75, ch);
      else o += pth("M-3.6,-10.6 L-3.3,-14.2 L-1,-12 Z M3.6,-10.6 L3.3,-14.2 L1,-12 Z", morbido(c), bordo(L, w)) + pth("M-3,-11.2 L-2.9,-13 L-1.8,-12 Z M3,-11.2 L2.9,-13 L1.8,-12 Z", "#ffb3c7");
      o += cer(0, -9.2, 3.9, morbido(c), bordo(L, w)) + ell(0, -8.2, 1.8, 1.25, ch) + ell(0, -8.7, .65, .45, "#2b1d14") + occhietti(-1.45, 1.45, -9.9, .48);
      o += tratto("M-.6,-7.6 Q0,-7.1 .6,-7.6", "#2b1d14", .3) + ell(-2.6, -8.3, .7, .4, "#ff8fab", op(.6)) + ell(2.6, -8.3, .7, .4, "#ff8fab", op(.6));
      if (t === "gatto") o += tratto("M-1.9,-8 L-4.4,-8.5 M-1.9,-7.6 L-4.4,-7.4 M1.9,-8 L4.4,-8.5 M1.9,-7.6 L4.4,-7.4", "#2b1d14", .2, op(.8));
      else o += pth("M-.9,-13.2 Q0,-14.4 .9,-13.2 Q0,-12.6 -.9,-13.2 Z", "#e03131", op(.9));   // il fiocchetto sulla testa dell'orso
    } else if (t === "coniglio") {
      o += ell(-1.6, -14, 1, 3.4, morbido(c), bordo(L, w) + " transform='rotate(-12 -1.6 -14)'") + ell(1.6, -14, 1, 3.4, morbido(c), bordo(L, w) + " transform='rotate(12 1.6 -14)'") + ell(-1.6, -13.8, .45, 2.3, "#ffb3c7", "transform='rotate(-12 -1.6 -13.8)'") + ell(1.6, -13.8, .45, 2.3, "#ffb3c7", "transform='rotate(12 1.6 -13.8)'");
      o += ell(0, -3.6, 3.3, 3.4, morbido(c), bordo(L, w)) + ell(-1.8, -.8, 1.5, 1, morbido(c), bordo(L, w)) + ell(1.8, -.8, 1.5, 1, morbido(c), bordo(L, w));
      o += cer(0, -9, 3.7, morbido(c), bordo(L, w)) + occhietti(-1.4, 1.4, -9.6, .5) + ell(0, -8.2, .55, .4, "#ff6b9a") + tratto("M-1.4,-8 L-3.6,-8.4 M1.4,-8 L3.6,-8.4", "#868e96", .2) + ell(-2.4, -8.2, .7, .4, "#ff8fab", op(.6)) + ell(2.4, -8.2, .7, .4, "#ff8fab", op(.6));
    } else if (t === "pulcino") {
      o += ell(-1.5, -.4, 1.2, .6, "#ff922b", bordo(L, w)) + ell(1.5, -.4, 1.2, .6, "#ff922b", bordo(L, w));
      o += cer(0, -5.2, 4.9, morbido(c), bordo(L, w)) + ell(-4.2, -5, 1.2, 2, morbido(c), bordo(L, w) + " transform='rotate(20 -4.2 -5)'") + ell(4.2, -5, 1.2, 2, morbido(c), bordo(L, w) + " transform='rotate(-20 4.2 -5)'");
      o += pth("M-.4,-10 Q-.6,-11.8 .8,-12 Q.2,-11 .6,-10 Z", morbido(c), bordo(L, .35)) + occhietti(-1.6, 1.6, -6.6, .52) + pth("M-1.1,-5.6 L1.1,-5.6 L0,-4.2 Z", "#ff922b", bordo(L, .3)) + ell(-2.8, -5, .8, .45, "#ff8fab", op(.6)) + ell(2.8, -5, .8, .45, "#ff8fab", op(.6));
    } else if (t === "rana") {
      o += ell(0, -3.4, 4.6, 3.4, morbido(c), bordo(L, w)) + ell(0, -2.8, 2.8, 2, chiaro(c, .55), op(.85));
      o += cer(-2.3, -7.2, 1.8, morbido(c), bordo(L, w)) + cer(2.3, -7.2, 1.8, morbido(c), bordo(L, w)) + cer(-2.3, -7.3, 1.05, "#ffffff") + cer(2.3, -7.3, 1.05, "#ffffff") + occhietti(-2.2, 2.4, -7.2, .55);
      o += tratto("M-1.8,-4.8 Q0,-3.6 1.8,-4.8", "#2b1d14", .35) + ell(-3, -4.8, .8, .45, "#ff8fab", op(.6)) + ell(3, -4.8, .8, .45, "#ff8fab", op(.6));
    } else if (t === "stella") {
      var pp = [], i; for (i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.6 : 6; pp.push([Math.cos(a) * r, -6 + Math.sin(a) * r]); }
      o += pth("M" + pp.map(function (v) { return q(v); }).join(" L") + " Z", morbido(c), bordo(L, w));
      o += occhietti(-1.3, 1.3, -6.6, .5) + tratto("M-1,-5.2 Q0,-4.4 1,-5.2", "#2b1d14", .3) + ell(-2.4, -5.4, .7, .4, "#ff8fab", op(.7)) + ell(2.4, -5.4, .7, .4, "#ff8fab", op(.7));
    } else {   // il cuore
      o += pth("M0,-.6 C-2.4,-2.4 -5.2,-4.4 -5.2,-7.4 C-5.2,-9.6 -3.6,-10.8 -2.4,-10.8 C-1.2,-10.8 -.4,-10.1 0,-9 C.4,-10.1 1.2,-10.8 2.4,-10.8 C3.6,-10.8 5.2,-9.6 5.2,-7.4 C5.2,-4.4 2.4,-2.4 0,-.6 Z", morbido(c), bordo(L, w));
      o += occhietti(-1.6, 1.6, -7, .5) + tratto("M-1,-5.6 Q0,-4.8 1,-5.6", "#2b1d14", .3);
    }
    return g0(x, y, k, o);
  }

  // =========================================================
  //  GRU DEI PELUCHE (la "claw machine"): il mobile rosa e turchese con la porta dei premi, la gettoniera e il prezzo;
  //  la mensola coi comandi (il joystick con la pallina rossa e il pulsante giallo); la vetrina coi montanti e le strisce
  //  di luce: dentro il mucchio di peluche colorati (orsetti, coniglietti, pulcini, ranocchie, stelle e cuori), la buca dei
  //  premi col bordo trasparente e la gru cromata a tre artigli che ha appena preso un orsetto; in cima l'insegna con la
  //  faccia dell'orsetto e le lampadine. Dietro: la vetrina uguale e lo sportello di servizio
  // =========================================================
  def("gru_peluche", { tipo: "piedi", nome: "Gru dei peluche", fp: [1, 1], box: [-42, -179, 42, 22], dietro: true, luce: [0, 0, 112, 78, "#ff6fbf"] }, function () {
    var A0 = -.37, A1 = .37, B0 = -.37, B1 = .33, ZB = 62, ZV = 142, ZC = 150, ROSA = "#f45ca6", TURCH = "#1fc8d6", i;
    var aF = G > 0 ? A0 : A1, bF = G > 0 ? B0 : B1, aV = G > 0 ? A1 : A0, bV = G > 0 ? B1 : B0;   // le pareti lontane e quelle vicine
    var s = ombraPianta(A0, A1, B0, B1 + .12, 1, .06);
    // il mobile sotto: la porta dei premi, la gettoniera, il prezzo, la striscia di luce
    function mobileD(W, H) {
      var r = lucidoPiano(W, H, .6) + rett(0, 0, W, 4.6, 0, TURCH) + rett(0, 3.8, W, .8, 0, "#0b7285", op(.6));
      for (i = 0; i < 9; i++) r += lampadina(3 + i * (W - 6) / 8, 2.2, .75, ["#fff3bf", "#ffd6ef", "#c5f6fa"][i % 3]);
      r += pth(rq(4, 14, 16, 22, 2), "#2b2433", bordo(L, .7)) + pth(rq(5.2, 15.2, 13.6, 19.6, 1.4), nuova([[0, "#9ad8e8", .55], [1, "#3b5a73", .65]], 0, 0, 0, 1)) + rett(5.2, 15.2, 13.6, 4, 1.4, "#ffffff", op(.3));   // la porta dei premi (lo sportellino trasparente)
      r += pth("M10,8 H14 V10.4 H16 L12,13 L8,10.4 H10 Z", NOTTE ? "#fff3bf" : "#ffd43b", bordo(L, .35));   // la freccia
      r += pth(rq(25, 11, 15, 22, 1.6), nuova([[0, "#ffffff"], [.5, "#ced4da"], [1, "#7d868e"]], 0, 0, 1, 1), bordo(L, .6));   // la gettoniera cromata
      r += rett(27, 13, 11, 5.4, .8, "#0b0b0e") + led("2", 30.6, 14.2, 3, NOTTE ? "#ff5440" : "#d9302a", NOTTE) + monetaD(35.4, 15.7, 1.6);
      r += rett(28.6, 21, 7.8, 1.4, .6, "#1c1d21") + cer(32.5, 27.6, 2, nuovaR([[0, "#ff8787"], [1, "#a51111"]], .35, .3, .8), bordo(L, .4)) + cer(31.9, 27, .6, "#ffffff", op(.8));
      r += pth(rq(4, 39, W - 8, 15, 2), "none", "stroke='#ffffff' stroke-width='.7' opacity='.6'") + peluche("orso", W / 2, 52.4, .95, "#ffd43b") + stella(9, 44, 1.2, "#ffffff", op(.9)) + stella(W - 9, 47, 1, "#ffffff", op(.85));
      return r + rett(0, H - 4, W, 4, 0, nuova([[0, "#ffffff"], [1, "#868e96"]], 0, 0, 0, 1)) + rett(0, H - 4, W, .4, 0, L, op(.5));
    }
    function mobileF(W, H) { var r = lucidoPiano(W, H, .6) + rett(0, 0, W, 4.6, 0, TURCH) + rett(0, 3.8, W, .8, 0, "#0b7285", op(.6)); r += pth(rq(5, 12, W - 10, 38, 3), "none", "stroke='#ffffff' stroke-width='.7' opacity='.6'") + peluche("coniglio", W / 2, 44, 1.6, "#fff0f6"); for (i = 0; i < 4; i++) r += stella(8 + i * (W - 16) / 3, 18 + (i % 2) * 22, 1, "#ffffff", op(.85)); return r + rett(0, H - 4, W, 4, 0, nuova([[0, "#ffffff"], [1, "#868e96"]], 0, 0, 0, 1)); }
    function mobileR(W, H) { var r = lucidoPiano(W, H, .6) + rett(0, 0, W, 4.6, 0, TURCH); r += pth(rq(6, 12, W - 12, 34, 2), "none", "stroke='#8a1c55' stroke-width='1'") + cer(W - 11, 29, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4)); for (i = 0; i < 5; i++) r += rett(W * .3, 16 + i * 1.8, W * .4, .8, .4, "#8a1c55"); return r + rett(0, H - 4, W, 4, 0, nuova([[0, "#ffffff"], [1, "#868e96"]], 0, 0, 0, 1)); }
    var mobile = blocco(A0, A1, B0, B1, 0, ZB, ROSA, { davanti: mobileD, dietro: mobileR, fianco: mobileF }, 2.4);
    // la mensola dei comandi (sporge davanti): il joystick e il pulsante giallo
    var mens = pulsantiera(A0 + .04, A1 - .04, B1, B1 + .13, ZB + 1.6, ZB - 1.4, ZB - 4.6, [[26, 8.4, "#ffd43b", 1]], { col: "#f8f0fb", f0: "#ffffff", f1: "#c9c0d6", p0: "#3b2a4d", p1: "#1e1428", orlo: TURCH, orlo2: "#c5f6fa", H: 9 });
    if (G > 0) {
      var jb = P(A0 + .16, B1 + .065, ZB + .2), jt = P(A0 + .16, B1 + .07, ZB + 9.5);
      mens += ell(jb[0], jb[1], 3.2, 1.6, "#1c1d21", bordo(L, .4)) + tratto(linea(jb, jt), L, 2.6) + tratto(linea(jb, jt), "#5c5f66", 1.4) + tratto(linea([jb[0] - .4, jb[1]], [jt[0] - .4, jt[1]]), "#ced4da", .4) + pallina(jt, 3, "#e8202b", .7);
    }
    // la vetrina: il fondo (le pareti lontane a pois), il pavimento, la buca dei premi, i peluche, la gru, i vetri, i montanti
    var dentroV = "";
    function parete(X0, X1) { var r = rett(X0, -ZV, X1 - X0, ZV - ZB, 0, NOTTE ? nuova([[0, "#ffd0ea"], [1, "#f06aac"]], 0, 0, 0, 1) : nuova([[0, "#ffe3f1"], [1, "#f7b2d6"]], 0, 0, 0, 1)), x, y, j = 0; for (y = -ZV + 5; y < -ZB - 2; y += 7) { for (x = X0 + 4 + (j % 2) * 3.5; x < X1 - 2; x += 7) r += cer(x, y, 1.2, "#ffffff", op(.75)); j++; } return r; }
    dentroV += suB(bF, parete(61 * A0, 61 * A1)) + suA(aF, parete(61 * B0, 61 * B1));
    var cA = .03, pav = [P(A0 + cA, B0 + cA, ZB + 2), P(A1 - cA, B0 + cA, ZB + 2), P(A1 - cA, B1 - cA, ZB + 2), P(A0 + cA, B1 - cA, ZB + 2)];
    dentroV += poly(pav, nuova([[0, "#d6a8e8"], [1, "#9d6cc0"]], 0, 0, 1, 1));
    // la buca dei premi (davanti a sinistra) col bordo di plastica trasparente
    var h0 = A0 + .05, h1 = A0 + .27, k0 = B1 - .27, k1 = B1 - .05, ZH = ZB + 12;
    function buca() {
      var o = poly([P(h0, k0, ZB + 2.2), P(h1, k0, ZB + 2.2), P(h1, k1, ZB + 2.2), P(h0, k1, ZB + 2.2)], "#1e1428"), lati = [[h0, k0, h1, k0], [h1, k0, h1, k1], [h1, k1, h0, k1], [h0, k1, h0, k0]];
      lati.forEach(function (l) { o += poly([P(l[0], l[1], ZB + 2), P(l[2], l[3], ZB + 2), P(l[2], l[3], ZH), P(l[0], l[1], ZH)], "#e7f5ff", op(.22) + " stroke='#ffffff' stroke-width='.5' stroke-opacity='.8'"); });
      return o + tratto(chiuso([P(h0, k0, ZH), P(h1, k0, ZH), P(h1, k1, ZH), P(h0, k1, ZH)]), "#ffffff", .7, op(.9));
    }
    var cose = [], rr = rnd(2024), TIPI = [["orso", "#b5703c"], ["coniglio", "#fff0f6"], ["pulcino", "#ffd43b"], ["orso", "#f783ac"], ["rana", "#69db7c"], ["stella", "#ffe066"], ["orso", "#74c0fc"], ["cuore", "#ff6b6b"], ["gatto", "#b197fc"], ["orso", "#ffffff"]], n = 0;
    for (i = 0; i < 4; i++) for (var j = 0; j < 4; j++) {
      var a = A0 + .1 + i * (A1 - A0 - .2) / 3 + (rr() - .5) * .06, b = B0 + .1 + j * (B1 - B0 - .2) / 3 + (rr() - .5) * .06;
      if (a < h1 + .04 && b > k0 - .04) continue;
      var tp = TIPI[n++ % TIPI.length]; cose.push({ k: vicino(a, b), z: ZB + 2, a: a, b: b, t: tp });
    }
    [[-.12, -.18], [.12, -.06], [-.02, .1], [.2, .16], [-.22, -.04], [.16, -.24], [.24, -.02], [-.26, -.24], [.04, -.2]].forEach(function (v) { var tp = TIPI[(n++ + 3) % TIPI.length]; cose.push({ k: vicino(v[0], v[1]) + .01, z: ZB + 7.5, a: v[0], b: v[1], t: tp }); });
    [[-.16, -.26], [.08, -.12], [.22, -.2], [-.04, -.02]].forEach(function (v) { var tp = TIPI[(n++ + 5) % TIPI.length]; cose.push({ k: vicino(v[0], v[1]) + .02, z: ZB + 13, a: v[0], b: v[1], t: tp }); });
    cose.push({ k: vicino((h0 + h1) / 2, (k0 + k1) / 2), buca: true });
    cose.sort(function (x, y) { return x.k - y.k; });
    cose.forEach(function (c) { if (c.buca) { dentroV += buca(); return; } var pt = P(c.a, c.b, c.z); dentroV += peluche(c.t[0], pt[0], pt[1], 1.02 + (c.z > ZB + 5 ? .06 : 0), c.t[1]); });
    // la gru: i binari in alto, il carrello, il filo e la testa cromata coi tre artigli che stringono un orsetto
    var gA = -.13, gB = .1, ZG = 104;
    [B0 + .06, B1 - .06].forEach(function (b) { dentroV += tratto(linea(P(A0 + .03, b, ZV - 3), P(A1 - .03, b, ZV - 3)), L, 2.4) + tratto(linea(P(A0 + .03, b, ZV - 3), P(A1 - .03, b, ZV - 3)), "#868e96", 1.2); });
    dentroV += tratto(linea(P(gA, B0 + .06, ZV - 4), P(gA, B1 - .06, ZV - 4)), L, 2.6) + tratto(linea(P(gA, B0 + .06, ZV - 4), P(gA, B1 - .06, ZV - 4)), "#adb5bd", 1.4);
    dentroV += blocco(gA - .04, gA + .04, gB - .04, gB + .04, ZV - 9, ZV - 4, cromo3(), null, 1);
    var gc = P(gA, gB, ZG), gt = P(gA, gB, ZV - 9);
    dentroV += tratto(linea(gt, [gc[0], gc[1] - 4]), "#212529", .8);
    var art = "";
    art += peluche("orso", gc[0] + .4, gc[1] + 13.6, .8, "#f783ac");   // l'orsetto preso
    [-1, 1].forEach(function (sg) { art += tratto("M" + q(gc[0] + sg * 2.4, gc[1] + 1) + " C" + q(gc[0] + sg * 6.4, gc[1] + 4) + " " + q(gc[0] + sg * 6, gc[1] + 9.6) + " " + q(gc[0] + sg * 3.2, gc[1] + 11.4), L, 2.4) + tratto("M" + q(gc[0] + sg * 2.4, gc[1] + 1) + " C" + q(gc[0] + sg * 6.4, gc[1] + 4) + " " + q(gc[0] + sg * 6, gc[1] + 9.6) + " " + q(gc[0] + sg * 3.2, gc[1] + 11.4), "#ced4da", 1.2); });
    art += tratto("M" + q(gc[0] + .4, gc[1] + 1.4) + " C" + q(gc[0] + 1.2, gc[1] + 5) + " " + q(gc[0] + 1.4, gc[1] + 8) + " " + q(gc[0] + .6, gc[1] + 10.6), L, 2.4) + tratto("M" + q(gc[0] + .4, gc[1] + 1.4) + " C" + q(gc[0] + 1.2, gc[1] + 5) + " " + q(gc[0] + 1.4, gc[1] + 8) + " " + q(gc[0] + .6, gc[1] + 10.6), "#f1f3f5", 1.2);
    art += pth("M" + q(gc[0] - 3.6, gc[1] + 1.6) + " C" + q(gc[0] - 3.6, gc[1] - 3.6) + " " + q(gc[0] + 3.6, gc[1] - 3.6) + " " + q(gc[0] + 3.6, gc[1] + 1.6) + " Z", nuova(CROMO, 0, 0, 1, 1), bordo(L, .7)) + rett(gc[0] - 3.9, gc[1] + .8, 7.8, 1.6, .6, nuova([[0, "#ffffff"], [1, "#868e96"]], 0, 0, 0, 1), bordo(L, .5)) + ell(gc[0] - 1.4, gc[1] - 1.4, 1.2, .7, "#ffffff", op(.85));
    dentroV += art;
    // i vetri (quelli vicini) e i montanti agli angoli, con la striscia di luce
    var v1 = [P(A0, bV, ZB), P(A1, bV, ZB), P(A1, bV, ZV), P(A0, bV, ZV)], v2 = [P(aV, B0, ZB), P(aV, B1, ZB), P(aV, B1, ZV), P(aV, B0, ZV)];
    function vetro(pp, seme) {
      var d = chiuso(pp), b = limiti(pp), w = b[2] - b[0], h = b[3] - b[1];
      return pth(d, "#e7f5ff", op(NOTTE ? .06 : .12)) + dentro(d, poly([[b[0] + w * .1, b[1]], [b[0] + w * .3, b[1]], [b[0] + w * .05, b[3]], [b[0] - w * .15, b[3]]], "#ffffff", op(NOTTE ? .1 : .2)) + poly([[b[0] + w * .42, b[1]], [b[0] + w * .48, b[1]], [b[0] + w * .23, b[3]], [b[0] + w * .17, b[3]]], "#ffffff", op(NOTTE ? .08 : .16))) + pth(d, "none", "stroke='#ffffff' stroke-width='.6' opacity='.7'");
    }
    function montante(a, b) {
      var c0 = P(a, b, ZB), c1 = P(a, b, ZV), o = tratto(linea(c0, c1), L, 3.6) + tratto(linea(c0, c1), "#f8f0fb", 2.1) + tratto(linea([c0[0] - .5, c0[1]], [c1[0] - .5, c1[1]]), "#ffffff", .6);
      var gl = lin("lm", [[0, "#ff5fb8"], [.5, "#ffe066"], [1, "#4dd9ff"]], 0, c1[1], 0, c0[1], true);
      return o + (NOTTE ? tratto(linea([c0[0] + .6, c0[1] - 2], [c1[0] + .6, c1[1] + 2]), gl, 2.4, op(.5)) + tratto(linea([c0[0] + .6, c0[1] - 2], [c1[0] + .6, c1[1] + 2]), "#ffffff", .7) : tratto(linea([c0[0] + .6, c0[1] - 2], [c1[0] + .6, c1[1] + 2]), gl, 1));
    }
    var lontani = montante(aF, bF) + montante(aF, bV) + montante(aV, bF);
    var vicinoM = montante(aV, bV);
    // in cima: la cassetta con le lampadine e l'insegna con la faccia dell'orsetto
    function cassaD(W, H) { var r = lucidoPiano(W, H, .5) + rett(0, H - 1.6, W, 1.6, 0, TURCH); for (i = 0; i < 10; i++) r += lampadina(2.6 + i * (W - 5.2) / 9, H / 2 - .4, .85, ["#fff3bf", "#ff8cc6", "#c5f6fa"][i % 3]); return r; }
    var cassa = blocco(A0 - .01, A1 + .01, B0 - .01, B1 + .01, ZV, ZC, ROSA, { davanti: cassaD, dietro: cassaD, fianco: cassaD }, 2.2);
    var PR = [[-.3, ZC], [.3, ZC]].concat(arcoS(0, ZC + 8, .3, 14, 0, Math.PI, 20));
    function insegna(T) {
      var W = T.W, H = T.H, cx = W / 2, r = "", d = "M1.4," + f2(H) + " L1.4,14 A" + f2(cx - 1.4) + ",13 0 0,1 " + f2(W - 1.4) + ",14 L" + f2(W - 1.4) + "," + f2(H) + " Z";
      var c = rett(0, 0, W, H, 0, NOTTE ? nuovaR([[0, "#fff0f8"], [.5, "#ff8cc6"], [1, "#c2255c"]], .5, .6, .8) : nuovaR([[0, "#ffd6ea"], [.5, "#f45ca6"], [1, "#9c1f5e"]], .5, .6, .8));
      c += raggiera(cx, H * .62, 30, 24, "#ffffff", NOTTE ? .3 : .18, 0, 360);
      c += peluche("orso", cx, H + 3.2, 1.25, "#c47a42");
      c += stella(6, 10, 1.3, "#ffffff", op(.95)) + stella(W - 6.4, 12, 1.1, "#ffffff", op(.9)) + stella(8, H - 5, .9, "#ffffff", op(.8)) + stella(W - 8, H - 4, 1, "#ffffff", op(.85));
      r += dentro(d, c) + pth(d, "none", "stroke='" + TURCH + "' stroke-width='1.2'") + pth(d, "none", bordo(L, .4));
      r += lampadine(lungoArco(cx, 14, cx - 3.6, 11.4, 190, 350, 9), .8, ["#fff3bf", "#c5f6fa", "#ffd6ef"]);
      return T.su(r);
    }
    function insegnaR(T) { var r = rett(0, 0, T.W, T.H, 0, nuova([[0, "#000", 0], [1, "#000", .2]], 0, 0, 0, 1)); for (i = 0; i < 4; i++) r += rett(T.W * .3, 8 + i * 1.8, T.W * .4, .8, .4, "#8a1c55"); return T.su(r); }
    var ins = estruso("b", PR, -.06, .02, ROSA, { mat: { lucido: .6, esp: 20 }, tappo: G > 0 ? insegna : insegnaR, lw: 2 });
    var scatola = chiuso(inviluppo([A0, A1].reduce(function (l, a) { [B0, B1].forEach(function (b) { l.push(P(a, b, ZB), P(a, b, ZV)); }); return l; }, []))), vetrina = dentro(scatola, dentroV) + lontani + vetro(v1) + vetro(v2) + vicinoM;
    if (G > 0) s += mobile + mens + vetrina + cassa + ins;
    else s += mens + mobile + vetrina + cassa + ins;
    return s;
  });

  // =========================================================
  //  SPINGIMONETE (il "coin pusher" a due posti): il mobile rosso laccato a festa con le lampadine e i due vassoi d'acciaio
  //  delle vincite; la vetrina coi due piani: in fondo il ripiano che va avanti e indietro e spinge le monete, la cascata
  //  di monete d'oro che cade sul piano di sotto, le monete in bilico sul bordo, i premi in cima (il lingotto, il pacco
  //  regalo, l'orsetto); le due gettoniere cromate sul davanti, i vetri coi riflessi, il fondo coi raggi e la grande moneta;
  //  in cima l'insegna a raggi da circo con la pila di monete, la corona e le lampadine. Dietro: il pannello di servizio
  // =========================================================
  def("spingimonete", { tipo: "piedi", nome: "Spingimonete", fp: [2, 1], box: [-71, -167, 70, 36], dietro: true, luce: [0, 0, 92, 130, "#ffd25e"] }, function () {
    var A0 = -.92, A1 = .92, B0 = -.4, B1 = .36, ZB = 50, ZP = 60, ZS = 69, ZV = 114, ZT = 122, ROSSO = "#d6283b", i;
    var aF = G > 0 ? A0 : A1, bF = G > 0 ? B0 : B1, aV = G > 0 ? A1 : A0, bV = G > 0 ? B1 : B0;
    var BG = B1 - .05;   // dove sta il vetro davanti
    var s = ombraPianta(A0, A1, B0, B1 + .14, 1, .06);
    // il mobile sotto: due sportelli coi vassoi, la stella nel mezzo, le lampadine in cima, la striscia di luce in basso
    function baseD(W, H) {
      var r = lucidoPiano(W, H, .6) + rett(0, 0, W, 5, 0, nuova(OTTONE, 0, 0, 0, 1)) + rett(0, 4.6, W, .6, 0, "#7a5214", op(.6));
      for (i = 0; i < 22; i++) r += lampadina(2.6 + i * (W - 5.2) / 21, 2.5, .8, ["#fff3bf", "#ff8787", "#ffd43b", "#74c0fc", "#8ce99a"][i % 5]);
      [[6, 42], [W - 48, 42]].forEach(function (d) { r += pth(rq(d[0], 10, d[1], 30, 2.4), "none", "stroke='#7a0d18' stroke-width='1.1'") + pth(rq(d[0] + .8, 10.8, d[1] - 1.6, 28.4, 1.8), "none", "stroke='#ff8a95' stroke-width='.45' opacity='.6'") + cer(d[0] + d[1] - 5, 25, 1, nuovaR(OTTONE, .35, .3, .8), bordo(L, .4)); });
      r += stella5(W / 2, 24, 7.4, nuova(OTTONE, 0, 0, 1, 1), bordo(L, .6)) + stella5(W / 2 - .8, 23.2, 3, "#fff8d6", op(.6));
      var ly = H - 7.4, gl = lin("lst", [[0, "#ff5fb8"], [.25, "#ffd43b"], [.5, "#69db7c"], [.75, "#4dd9ff"], [1, "#b48cff"]], 0, 0, W, 0, true);
      r += rett(2, ly, W - 4, 1.6, .8, gl, NOTTE ? "" : op(.85)) + (NOTTE ? rett(1, ly - 1, W - 2, 3.6, 1.6, gl, op(.4)) : "");
      return r + rett(0, H - 4, W, 4, 0, nuova(OTTONE, 0, 0, 0, 1)) + rett(0, H - 4, W, .5, 0, "#fff6cf", op(.8));
    }
    function baseF(W, H) { var r = lucidoPiano(W, H, .6) + rett(0, 0, W, 5, 0, nuova(OTTONE, 0, 0, 0, 1)); for (i = 0; i < 10; i++) r += lampadina(2.6 + i * (W - 5.2) / 9, 2.5, .8, ["#fff3bf", "#ff8787", "#ffd43b", "#74c0fc", "#8ce99a"][i % 5]); r += stella5(W / 2, 26, 6, nuova(OTTONE, 0, 0, 1, 1), bordo(L, .5)); return r + rett(0, H - 4, W, 4, 0, nuova(OTTONE, 0, 0, 0, 1)); }
    function baseR(W, H) { var r = lucidoPiano(W, H, .5) + rett(0, 0, W, 5, 0, nuova(OTTONE, 0, 0, 0, 1)), y; r += pth(rq(W * .3, 10, W * .4, 30, 2), "none", "stroke='#7a0d18' stroke-width='1.1'") + cer(W * .68, 25, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4)); for (y = 14; y < 24; y += 1.8) r += rett(W * .36, y, W * .28, .8, .4, "#5c0a12"); return r + rett(0, H - 4, W, 4, 0, nuova(OTTONE, 0, 0, 0, 1)); }
    var base = blocco(A0, A1, B0, B1, 0, ZB, ROSSO, { davanti: baseD, dietro: baseR, fianco: baseF }, 2.4);
    var vass = G > 0 ? vassoio(-.74, -.3, B1, B1 + .14, 12, 19, 21, 8, true) + vassoio(.3, .74, B1, B1 + .14, 12, 19, 23, 6) : "";
    // la vetrina: il fondo coi raggi e la grande moneta, i due piani coperti di monete, la cascata, i premi
    var dentroV = "";
    function fondo(X0, X1) {
      var w = X1 - X0, cx = X0 + w / 2, r = rett(X0, -ZV, w, ZV - ZB, 0, NOTTE ? nuovaR([[0, "#fff3c4"], [.45, "#ff6b6b"], [1, "#7a0d18"]], .5, .45, .75) : nuovaR([[0, "#ffd8a8"], [.45, "#e8414f"], [1, "#5c0a12"]], .5, .45, .75));
      r += raggiera(cx, -ZS - 14, 90, 36, "#fff3bf", NOTTE ? .35 : .2, 0, 360);
      r += monetaD(cx, -ZS - 18, 10) + monetaD(cx - 30, -ZS - 16, 6) + monetaD(cx + 30, -ZS - 16, 6);
      for (i = 0; i < 9; i++) r += lampadina(X0 + 6 + i * (w - 12) / 8, -ZV + 4, 1.1, ["#fff3bf", "#ffd43b", "#ff8787"][i % 3]);
      return r;
    }
    dentroV += suB(bF, fondo(61 * A0, 61 * A1)) + suA(aF, rett(61 * B0, -ZV, 61 * (B1 - B0), ZV - ZB, 0, nuova([[0, "#7a0d18"], [1, "#3a0509"]], 0, 0, 0, 1)));
    // il piano di sotto (lo specchio dorato) e il ripiano che spinge (in fondo, più alto)
    dentroV += poly([P(A0, B0, ZP), P(A1, B0, ZP), P(A1, BG - .02, ZP), P(A0, BG - .02, ZP)], nuova([[0, "#fff3c4"], [1, "#c99a36"]], 0, 0, 1, 1));
    var SB = -.06;   // il bordo davanti del ripiano che spinge
    function spinta(W, H) { var r = rett(0, 0, W, H, 0, nuova([[0, "#fff3c4"], [.5, "#d9a83a"], [1, "#8a6420"]], 0, 0, 0, 1)) + rett(0, .6, W, .8, 0, "#ffffff", op(.6)); for (i = 0; i < 14; i++) r += rett(2 + i * (W - 4) / 14, H * .35, (W - 4) / 14 - 1.6, H * .3, .6, "#7a5214", op(.35)); return r; }
    var ripiano = blocco(A0 + .02, A1 - .02, B0 + .02, SB, ZP, ZS, [nuova([[0, "#fff6d8"], [1, "#e2c27a"]], 0, 0, 1, 1), nuova([[0, "#f3dc9a"], [.5, "#c99a36"], [1, "#8a6420"]], 0, 0, 1, 0), nuova([[0, "#9a7428"], [1, "#5e430f"]], 0, 0, 1, 0)], { davanti: spinta, dietro: spinta, fianco: spinta }, 1.4);
    var monS = [], monG = [], rr = rnd(1888);
    for (i = 0; i < 60; i++) { var a = A0 + .06 + rr() * (A1 - A0 - .12), b = B0 + .05 + rr() * (SB - B0 - .07); monS.push([a, b, ZS + .4 + rr() * 2.2]); }
    for (i = 0; i < 80; i++) { var a2 = A0 + .06 + rr() * (A1 - A0 - .12), b2 = SB + .03 + Math.pow(rr(), .7) * (BG - SB - .1); monG.push([a2, b2, ZP + .4 + rr() * 1.8 + (b2 > BG - .2 ? rr() * 2.4 : 0)]); }
    function stesa(m) { return monetaT(P(m[0], m[1], m[2]), .032); }
    function ordina(l) { return l.sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]) || x[2] - y[2]; }); }
    // le monete in bilico sul bordo davanti del piano di sotto, e quelle che cadono dal ripiano (la cascata)
    var bilico = "", cascata = "";
    for (i = 0; i < 14; i++) { var ab = A0 + .1 + (i + rr() * .6) * (A1 - A0 - .2) / 14; bilico += monetaT(P(ab, BG - .035, ZP + .4), .032); }
    for (i = 0; i < 20; i++) {   // la cascata: le monete che scivolano giù dal bordo del ripiano (girate di taglio, un po' storte)
      var ac = A0 + .1 + (i + rr() * .8) * (A1 - A0 - .2) / 20, zc = ZP + 1.6 + rr() * (ZS - ZP - .6), cc = P(ac, SB + .02 + rr() * .07, zc), tilt = (rr() - .5) * 80, lar = .35 + rr() * .45;
      cascata += "<g transform='translate(" + q(cc) + ") rotate(" + f1(tilt) + ") scale(" + f2(lar) + " 1)'>" + monetaD(0, 0, 2.5) + "</g>";
    }
    for (i = 0; i < 9; i++) {   // e quelle che cadono dal bordo davanti, giù nella fessura delle vincite
      var ad = A0 + .14 + (i + rr() * .7) * (A1 - A0 - .28) / 9, zd = ZB + 9 + rr() * (ZP - ZB - 10), cd = P(ad, BG - .01, zd), td = (rr() - .5) * 90;
      cascata += "<g transform='translate(" + q(cd) + ") rotate(" + f1(td) + ") scale(" + f2(.4 + rr() * .4) + " 1)'>" + monetaD(0, 0, 2.3) + "</g>";
    }
    for (i = 0; i < 16; i++) { var ae = A0 + .1 + (i + rr() * .6) * (A1 - A0 - .2) / 16; bilico += monetaT(P(ae, BG - .06 + rr() * .02, ZP + 1.4 + rr() * 1.2), .032); }   // il secondo giro in bilico, sopra
    // i premi sul ripiano: il lingotto d'oro, il pacco regalo, l'orsetto
    var premi = "", pl = P(-.45, -.22, ZS + 1.6), pg = P(.42, -.2, ZS + 1.6), po = P(.02, -.26, ZS + 1.4);
    premi += pth("M" + q(pl[0] - 6, pl[1]) + " L" + q(pl[0] - 3.4, pl[1] - 4.6) + " L" + q(pl[0] + 6.4, pl[1] - 4.6) + " L" + q(pl[0] + 4, pl[1]) + " Z", nuova([[0, "#fff3b0"], [.5, "#f5c518"], [1, "#a8740f"]], 0, 0, 1, 1), bordo(L, .6)) + pth("M" + q(pl[0] - 3.4, pl[1] - 4.6) + " L" + q(pl[0] + 6.4, pl[1] - 4.6) + " L" + q(pl[0] + 4.6, pl[1] - 6.4) + " L" + q(pl[0] - 1.8, pl[1] - 6.4) + " Z", "#fff3b0", bordo(L, .5)) + stella(pl[0] - .6, pl[1] - 5.4, 1.2, "#ffffff", op(.9));
    premi += rett(pg[0] - 5, pg[1] - 8, 10, 8, .6, nuova([[0, "#74c0fc"], [1, "#1c63b8"]], 0, 0, 1, 1), bordo(L, .6)) + rett(pg[0] - 1, pg[1] - 8, 2, 8, 0, "#ffd43b") + pth("M" + q(pg[0], pg[1] - 8) + " C" + q(pg[0] - 4, pg[1] - 12) + " " + q(pg[0] - 4.6, pg[1] - 7.6) + " " + q(pg[0], pg[1] - 8) + " C" + q(pg[0] + 4, pg[1] - 12) + " " + q(pg[0] + 4.6, pg[1] - 7.6) + " " + q(pg[0], pg[1] - 8) + " Z", "#ffd43b", bordo(L, .45));
    premi += peluche("orso", po[0], po[1], .85, "#f783ac");
    var bordoD = poly([P(A0, BG - .02, ZB), P(A1, BG - .02, ZB), P(A1, BG - .02, ZP), P(A0, BG - .02, ZP)], nuova([[0, "#c99a36"], [.2, "#5c3a10"], [1, "#2a1a08"]], 0, 0, 0, 1)) + tratto(linea(P(A0, BG - .02, ZP - .3), P(A1, BG - .02, ZP - .3)), "#fff3c4", .8, op(.9));   // il bordo davanti del piano (sotto cadono le vincite)
    if (G > 0) dentroV += bordoD + ripiano + ordina(monS).map(stesa).join("") + premi + ordina(monG).map(stesa).join("") + bilico + cascata;
    else dentroV = suB(bF, fondo(61 * A0, 61 * A1)) + ripiano + ordina(monS).map(stesa).join("") + premi + ordina(monG).map(stesa).join("") + bilico + cascata;
    // i vetri, i montanti e le gettoniere
    var v1 = [P(A0, BG, ZB + 6.4), P(A1, BG, ZB + 6.4), P(A1, BG, ZV), P(A0, BG, ZV)], v2 = [P(aV, B0, ZB), P(aV, BG, ZB), P(aV, BG, ZV), P(aV, B0, ZV)];
    function vetro(pp) {
      var d = chiuso(pp), b = limiti(pp), w = b[2] - b[0], h = b[3] - b[1];
      return pth(d, "#e7f5ff", op(NOTTE ? .05 : .1)) + dentro(d, poly([[b[0] + w * .1, b[1]], [b[0] + w * .2, b[1]], [b[0] + w * .1, b[3]], [b[0], b[3]]], "#ffffff", op(.2)) + poly([[b[0] + w * .55, b[1]], [b[0] + w * .62, b[1]], [b[0] + w * .52, b[3]], [b[0] + w * .45, b[3]]], "#ffffff", op(.14))) + pth(d, "none", "stroke='#ffffff' stroke-width='.6' opacity='.7'");
    }
    function montante(a, b, z0) { var c0 = P(a, b, z0), c1 = P(a, b, ZV); return tratto(linea(c0, c1), L, 4) + tratto(linea(c0, c1), "#f2c94c", 2.4) + tratto(linea([c0[0] - .6, c0[1]], [c1[0] - .6, c1[1]]), "#fff6cf", .7); }
    var davantiV = "";
    if (G > 0) {
      var sog = blocco(A0, A1, BG - .02, B1, ZB, ZB + 6.4, "#e2b444", { davanti: function (W, H) {   // il davanzale d'oro sotto il vetro, con le due gettoniere cromate
        var r = rett(0, .4, W, .9, 0, "#fff6cf", op(.9));
        [W * .27, W * .73].forEach(function (x) { r += rett(x - 9, 1.6, 18, 3.6, 1, nuova([[0, "#ffffff"], [.5, "#ced4da"], [1, "#7d868e"]], 0, 0, 0, 1), bordo(L, .35)) + rett(x - 4, 2.7, 8, 1.2, .6, "#1c1d21") + monetaD(x + 6.4, 3.4, 1.3) + rett(x - 8, 2.6, 2.2, 1.6, .5, NOTTE ? "#8cff9e" : "#2f9e44"); });
        return r;
      } }, 1.4);
      davantiV += sog + vetro(v1) + vetro(v2) + montante(A0, BG, ZB + 6.4) + montante(0, BG, ZB + 6.4) + montante(A1, BG, ZB);
    } else {
      davantiV += vetro(v2) + montante(A1, B0, ZB) + montante(A0, B0, ZB) + montante(A0, BG, ZB);
      var dietroP = [P(A0, B0, ZB), P(A1, B0, ZB), P(A1, B0, ZV), P(A0, B0, ZV)];   // il pannello di servizio (da dietro non si vede dentro)
      davantiV += poly(dietroP, nuova([[0, scuro(ROSSO, .2)], [1, scuro(ROSSO, .42)]], 0, 0, 0, 1), bordo(L, 1.6)) + suB(B0, (function () {
        var r = "", k; r += pth(rq(61 * A0 + 4, -ZV + 4, 61 * (A1 - A0) - 8, ZV - ZB - 8, 3), "none", "stroke='#f2c94c' stroke-width='1.1'") + pth(rq(-40, -ZV + 14, 80, 36, 3), "none", "stroke='#5c0a12' stroke-width='1.2'");
        for (k = 0; k < 6; k++) r += rett(-24, -ZV + 21 + k * 2.2, 48, 1, .5, "#3a0509");
        return r + rett(18, -ZV + 40, 12, 7, .6, "#f1ece2") + rett(19, -ZV + 41.4, 7, .6, 0, "#868e96") + stella5(-34, -ZV + 32, 5, nuova(OTTONE, 0, 0, 1, 1), bordo(L, .5)) + stella5(34, -ZV + 32, 5, nuova(OTTONE, 0, 0, 1, 1), bordo(L, .5));
      })());
    }
    var scatola = chiuso(inviluppo([A0, A1].reduce(function (l, a) { [B0, BG].forEach(function (b) { l.push(P(a, b, ZB), P(a, b, ZV)); }); return l; }, [])));
    // in cima: la cassetta d'oro con le lampadine e l'insegna a raggi da circo
    function cassaD(W, H) { var r = rett(0, 0, W, H, 0, ROSSO) + lucidoPiano(W, H, .5) + rett(0, 0, W, 1.4, 0, "#f2c94c") + rett(0, H - 1.4, W, 1.4, 0, "#f2c94c"); for (i = 0; i < Math.round(W / 4.6); i++) r += lampadina(2.6 + i * 4.6, H / 2, .9, ["#fff3bf", "#ffd43b", "#ff8787", "#74c0fc"][i % 4]); return r; }
    var cassa = blocco(A0 - .01, A1 + .01, B0 - .01, B1 + .01 - .04, ZV, ZT, ROSSO, { davanti: cassaD, dietro: cassaD, fianco: cassaD }, 2.2);
    var PR = [[-.7, ZT], [.7, ZT]].concat(arcoS(0, ZT + 10, .7, 22, 0, Math.PI, 26));
    function insegna(T) {
      var W = T.W, H = T.H, cx = W / 2, r = "", d = "M1.6," + f2(H) + " L1.6,22 A" + f2(cx - 1.6) + ",20.6 0 0,1 " + f2(W - 1.6) + ",22 L" + f2(W - 1.6) + "," + f2(H) + " Z";
      var c = rett(0, 0, W, H, 0, NOTTE ? "#ffe066" : "#f5c518");
      for (i = 0; i < 20; i++) { var t0 = Math.PI + i * Math.PI / 20, t1 = t0 + Math.PI / 20; if (i % 2) continue; c += poly([[cx, H], [cx + Math.cos(t0) * 90, H + Math.sin(t0) * 90], [cx + Math.cos(t1) * 90, H + Math.sin(t1) * 90]], NOTTE ? "#ff6b6b" : "#e03131"); }
      c += cer(cx, H, 13, "#ffffff", op(.25));
      [[cx - 13, 4], [cx + 13, 4], [cx - 6.5, 6], [cx + 6.5, 6], [cx, 8]].forEach(function (m) { var k; for (k = 0; k < m[1]; k++) c += ell(m[0], H - 2.4 - k * 2.1, 5.6, 1.9, nuova([[0, "#fff3b0"], [.5, "#f5c518"], [1, "#a8740f"]], 0, 0, 0, 1), bordo(L, .4)) + ell(m[0] - 2, H - 3 - k * 2.1, 1.6, .4, "#ffffff", op(.6)); });   // le pile di monete
      c += "<g transform='translate(" + q(cx, H - 22) + ") scale(.95)'>" + monetaD(0, 0, 4.4) + "</g>" + g0(cx, H - 31, .9, pth("M-7.6,4.4 L-8.4,-3.6 L-4.2,0 L0,-6.2 L4.2,0 L8.4,-3.6 L7.6,4.4 Z", nuova([[0, "#fff3b0"], [.5, "#f5c518"], [1, "#a8740f"]], 0, 0, 1, 1), bordo(L, .7)) + cer(0, -7, 1.2, "#ff6b6b", bordo(L, .4)) + cer(-8.4, -4.6, .9, "#74c0fc", bordo(L, .3)) + cer(8.4, -4.6, .9, "#74c0fc", bordo(L, .3)));
      c += stella(10, 26, 1.4, "#ffffff", op(.9)) + stella(W - 10, 24, 1.2, "#ffffff", op(.9));
      r += dentro(d, c) + pth(d, "none", "stroke='#f2c94c' stroke-width='2.2'") + pth(d, "none", bordo(L, .5));
      r += lampadine(lungoArco(cx, 22, cx - 4.4, 18.4, 186, 354, 15), 1.05, ["#fff3bf", "#ff8787", "#ffd43b", "#74c0fc", "#8ce99a"]);
      return T.su(r);
    }
    function insegnaR(T) { return T.su(rett(0, 0, T.W, T.H, 0, nuova([[0, "#000", 0], [1, "#000", .2]], 0, 0, 0, 1)) + pth(rq(T.W * .3, 14, T.W * .4, 14, 2), "none", "stroke='#5c0a12' stroke-width='1'")); }
    var ins = estruso("b", PR, -.12, -.04, ROSSO, { mat: { lucido: .6, esp: 20 }, tappo: G > 0 ? insegna : insegnaR, lw: 2.2 });
    if (G > 0) s += base + vass + dentro(scatola, dentroV) + davantiV + cassa + ins;
    else s += base + dentro(scatola, dentroV) + davantiV + cassa + ins + cavo(.5, B0, 8);
    return s;
  });

  // il quadrifoglio portafortuna (centro x, y; grande R)
  function quadrifoglio(x, y, R, acceso) {
    var o = "", k, c1 = acceso ? "#8ff0a4" : "#40c057", c2 = acceso ? "#2fb84a" : "#1b7a35";
    o += tratto("M" + q(x + R * .1, y + R * .2) + " Q" + q(x + R * .5, y + R * .9) + " " + q(x + R * .3, y + R * 1.3), "#1b7a35", R * .16);
    for (k = 0; k < 4; k++) {
      var t = k * Math.PI / 2 + Math.PI / 4, cx = x + Math.cos(t) * R * .5, cy = y + Math.sin(t) * R * .5;
      o += "<g transform='translate(" + q(cx, cy) + ") rotate(" + f1(t * 57.3 + 90) + ")'>" + pth("M0," + f2(R * .55) + " C" + f2(-R * .75) + "," + f2(R * .1) + " " + f2(-R * .6) + "," + f2(-R * .62) + " 0," + f2(-R * .3) + " C" + f2(R * .6) + "," + f2(-R * .62) + " " + f2(R * .75) + "," + f2(R * .1) + " 0," + f2(R * .55) + " Z", nuovaR([[0, c1], [1, c2]], .4, .3, .8), bordo(L, Math.max(.3, R * .07))) + tratto("M0," + f2(R * .45) + " L0," + f2(-R * .15), "#d3f9d8", R * .05, op(.7)) + "</g>";
    }
    return o + cer(x, y, R * .14, "#ffd43b", bordo(L, Math.max(.2, R * .04)));
  }
  // un biglietto del gratta e vinci (x, y in alto a sinistra; w × h): la cornice colorata, i simboli, la parte d'argento grattata a metà
  function biglietto(x, y, w, h, c, seme) {
    var o = rett(x + .3, y + .4, w, h, .6, "#000", op(.3)) + rett(x, y, w, h, .6, nuova([[0, chiaro(c, .25)], [1, scuro(c, .15)]], 0, 0, 0, 1), bordo(L, .3));
    o += rett(x + w * .1, y + h * .1, w * .8, h * .22, .4, "#ffd43b") + stella(x + w * .5, y + h * .21, h * .08, "#ffffff", op(.9));
    var gx = x + w * .1, gy = y + h * .42, gw = w * .8, gh = h * .48, rr = rnd(seme), k;
    o += rett(gx, gy, gw, gh, .4, "#ffffff");
    for (k = 0; k < 3; k++) o += simbolo(["sette", "moneta", "ciliegie", "stella"][(seme + k) % 4], gx + gw * (k + .5) / 3, gy + gh * .5, Math.min(gw / 3, gh) * .07);
    o += pth("M" + q(gx + gw * .45, gy) + " L" + q(gx + gw, gy) + " L" + q(gx + gw, gy + gh) + " L" + q(gx + gw * .58, gy + gh) + " Q" + q(gx + gw * .52, gy + gh * .6) + " " + q(gx + gw * .62, gy + gh * .45) + " Q" + q(gx + gw * .4, gy + gh * .3) + " " + q(gx + gw * .45, gy) + " Z", nuova([[0, "#f1f3f5"], [.5, "#adb5bd"], [1, "#e9ecef"]], 0, 0, 1, 1));   // l'argento ancora da grattare
    for (k = 0; k < 3; k++) o += cer(gx + gw * (.4 + rr() * .2), gy + gh * (.2 + rr() * .7), .25, "#adb5bd");   // i trucioli
    return o;
  }

  // =========================================================
  //  DISTRIBUTORE DEI GRATTA E VINCI: il totem verde smeraldo ad arco col bordo d'oro; in cima il quadrifoglio nel sole
  //  d'oro con le lampadine, sotto lo schermo che mostra i biglietti (uno grattato a metà), la bocca da cui esce un
  //  biglietto colorato, la bocca delle banconote; sul fianco la vetrinetta coi biglietti in fila; sotto lo zoccolo con la
  //  striscia di luce. Dietro: lo sportello di servizio con la serratura, le prese d'aria e l'etichetta
  // =========================================================
  def("gratta_vinci", { tipo: "piedi", nome: "Distributore dei gratta e vinci", fp: [1, 1], box: [-31, -132, 27, 15], dietro: true, luce: [0, .16, 88, 70, "#b6ff8a"] }, function () {
    var A0 = -.25, A1 = .25, B0 = -.2, B1 = .16, Z0 = 7, ZA = 106, RZ = 16, VERDE = "#12a356", i;
    var PROF = [[A0, Z0], [A1, Z0]].concat(arcoS(0, ZA, A1, RZ, 0, Math.PI, 22));
    var s = ombraPianta(A0, A1, B0, B1, 1, .07);
    function zoccolo(W, H) { var gl = lin("zl", [[0, "#ff5fb8"], [.5, "#ffd43b"], [1, "#4dd9ff"]], 0, 0, W, 0, true); return rett(0, H * .45, W, 1.6, .8, gl, NOTTE ? "" : op(.85)) + (NOTTE ? rett(-1, H * .45 - 1, W + 2, 3.6, 1.6, gl, op(.4)) : "") + rett(0, 0, W, .8, 0, "#868e96"); }
    var zoc = blocco(A0 - .02, A1 + .02, B0 - .02, B1 + .02, 0, Z0, "#24212a", { davanti: zoccolo, dietro: zoccolo, fianco: zoccolo }, 1.8);
    function davanti(T) {   // il davanti piatto (W × 115: y = 122 − z)
      var W = T.W, H = T.H, cx = W / 2, r = "";
      // in cima: il sole d'oro coi raggi e il quadrifoglio, le lampadine lungo l'arco
      var sy = 15.4, sole = "M2.2," + f2(sy + 9) + " L2.2," + f2(RZ) + " A" + f2(cx - 2.2) + "," + f2(RZ - 2.2) + " 0 0,1 " + f2(W - 2.2) + "," + f2(RZ) + " L" + f2(W - 2.2) + "," + f2(sy + 9) + " Z";
      var c = rett(0, 0, W, sy + 10, 0, NOTTE ? nuovaR([[0, "#fffbe6"], [.5, "#ffd43b"], [1, "#e8590c"]], .5, .6, .8) : nuovaR([[0, "#fff3bf"], [.5, "#f5c518"], [1, "#c25e00"]], .5, .6, .8));
      c += raggiera(cx, sy, 30, 22, "#ffffff", NOTTE ? .4 : .25, 0, 360) + quadrifoglio(cx, sy - .6, 7.4, NOTTE);
      c += stella(5.6, 13, 1, "#ffffff", op(.95)) + stella(W - 5.6, 14.6, .9, "#ffffff", op(.9));
      if (NOTTE) r += pth(sole, "none", "stroke='#fff3bf' stroke-width='2.6' opacity='.45'");
      r += dentro(sole, c) + pth(sole, "none", "stroke='#f2c94c' stroke-width='1.2'") + pth(sole, "none", bordo(L, .35));
      r += lampadine(lungoArco(cx, RZ, cx - 3.4, RZ - 3.4, 192, 348, 9), .8, ["#fff3bf", "#ff8cc6", "#c5f6fa", "#ffd43b"]);
      r += rett(2, sy + 10.6, W - 4, 2.4, 1.1, nuova(OTTONE, 0, 0, 0, 1), bordo(L, .35));
      // lo schermo coi biglietti
      var gx = 2.6, gy = 31, gw = W - 5.2, gh = 30, scr = rq(gx, gy, gw, gh, 1.6);
      if (NOTTE) r += pth(scr, "none", "stroke='#d3f9d8' stroke-width='3' opacity='.4'");
      r += pth(rq(gx - 1, gy - 1, gw + 2, gh + 2, 2.2), "#1c1d21", bordo(L, .6));
      var sc = rett(gx, gy, gw, gh, 0, NOTTE ? nuova([[0, "#6fe8ff"], [.6, "#1c8fd6"], [1, "#0b3a80"]], 0, 0, 0, 1) : nuova([[0, "#3bb2e6"], [.6, "#145aa8"], [1, "#082658"]], 0, 0, 0, 1));
      sc += raggiera(cx, gy + gh * .55, 30, 24, "#ffffff", .1, 0, 360);
      sc += "<g transform='rotate(-14 " + q(cx - 7, gy + 16) + ")'>" + biglietto(cx - 13, gy + 5, 11, 17, "#f06595", 1) + "</g>" + "<g transform='rotate(12 " + q(cx + 7, gy + 16) + ")'>" + biglietto(cx + 2, gy + 5, 11, 17, "#7950f2", 2) + "</g>" + biglietto(cx - 6, gy + 9, 12, 18.4, "#20c997", 3);
      sc += rett(gx + 2, gy + gh - 4.4, gw - 4, 3, 1.4, nuova([[0, "#ffe066"], [1, "#f08c00"]], 0, 0, 0, 1)) + stella(cx, gy + gh - 2.9, 1, "#ffffff", op(.95));
      sc += rett(gx, gy, gw, gh * .4, 0, "#ffffff", op(NOTTE ? .05 : .1));
      if (!NOTTE) sc += rett(gx, gy, gw, gh, 0, "#061a33", op(.12));
      r += dentro(scr, sc);
      // la bocca dei biglietti con un biglietto che esce, la bocca delle banconote, il lettore
      r += rett(cx - 8, 65, 16, 3.4, 1.2, nuova([[0, "#ffffff"], [.5, "#ced4da"], [1, "#7d868e"]], 0, 0, 0, 1), bordo(L, .45)) + rett(cx - 6.6, 66.2, 13.2, 1, .5, "#141418");
      r += "<g transform='rotate(4 " + q(cx, 67) + ")'>" + rett(cx - 5, 66.6, 10, 9, .5, nuova([[0, "#ff8cc6"], [1, "#e64980"]], 0, 0, 0, 1), bordo(L, .3)) + rett(cx - 3.8, 70, 7.6, 4.2, .3, nuova([[0, "#f1f3f5"], [1, "#adb5bd"]], 0, 0, 1, 1)) + stella(cx, 68.2, .8, "#fff3bf") + "</g>";
      r += rett(4, 80, W - 8, 9, 1.4, nuova([[0, "#ffffff"], [.5, "#ced4da"], [1, "#7d868e"]], 0, 0, 1, 1), bordo(L, .45)) + rett(7, 82.4, W - 14, 1.2, .6, "#141418") + rett(7, 85.2, 4, 1.4, .6, NOTTE ? "#8cff9e" : "#2f9e44") + monetaD(W - 9, 86, 1.5);
      // la pancia: le monete e i quadrifogli su fondo giallo, nella cornice d'oro
      var px = 3, py = 93, pw = W - 6, ph = 17, pan = rq(px, py, pw, ph, 2);
      var pc = rett(px, py, pw, ph, 0, nuovaR([[0, "#fff9db"], [.6, "#ffd43b"], [1, "#e8a200"]], .5, .5, .75)) + raggiera(cx, py + ph / 2, 30, 22, "#ffffff", .25, 0, 360);
      pc += quadrifoglio(cx - 8, py + ph / 2, 3.4, false) + quadrifoglio(cx + 8, py + ph / 2, 3.4, false) + monetaD(cx, py + ph / 2, 4.4);
      r += dentro(pan, pc) + pth(pan, "none", "stroke='#f2c94c' stroke-width='1'") + pth(pan, "none", bordo(L, .35));
      // il bordo d'oro e il lucido della lacca
      r += tratto(bordoArco(W, H, RZ, .9), "#f2c94c", 1.2, op(.95)) + tratto(bordoArco(W, H, RZ, .9), "#7a5214", .35, sp(.4, .4));
      r += rett(0, 0, W, H, 0, nuova([[0, "#fff", .14], [.45, "#fff", 0]], 0, 0, 1, 1));
      return T.su(r);
    }
    function dietro(T) {   // la schiena: lo sportello di servizio, la serratura, le prese d'aria, l'etichetta
      var W = T.W, H = T.H, r = "", y;
      r += rett(0, 0, W, H, 0, nuova([[0, "#000", 0], [1, "#000", .15]], 0, 0, 0, 1));
      r += pth(rq(4, 26, W - 8, 70, 2), "none", "stroke='#0b5e30' stroke-width='1.1'") + pth(rq(4.7, 26.7, W - 9.4, 68.6, 1.6), "none", "stroke='#8ce99a' stroke-width='.45' opacity='.6'");
      r += cer(W - 8, 60, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4));
      for (y = 32; y < 44; y += 1.8) r += rett(8, y, W - 16, .8, .4, "#0b4a26");
      r += rett(7.5, 80, 10, 6.5, .5, "#f1ece2") + rett(8.5, 81.2, 5, .6, 0, "#868e96") + rett(8.5, 82.6, 8, .5, 0, "#adb5bd") + quadrifoglio(W / 2, 12, 5, false);
      return T.su(r + tratto(bordoArco(W, H, RZ, .9), "#f2c94c", 1, op(.8)));
    }
    function fascia(H) {   // i fianchi: la vetrinetta coi biglietti in fila, il bordo d'oro, il lucido
      var o = "", av = G > 0 ? A1 : A0, X0 = 61 * B0, X1 = 61 * B1, w = X1 - X0, k, j, ww = (w - 9) / 3;
      var vt = rq(X0 + 3, -96, w - 6, 40, 2.4), c = rett(X0, -96, w, 40, 0, nuova([[0, "#e6fcf5"], [1, "#96f2d7"]], 0, 0, 0, 1)), CC = ["#f06595", "#7950f2", "#fab005", "#20c997", "#ff6b6b", "#339af0"];
      for (k = 0; k < 3; k++) for (j = 0; j < 3; j++) c += biglietto(X0 + 4.5 + j * ww, -93 + k * 12.6, ww - 1.2, 11.4, CC[(k * 3 + j) % 6], k * 3 + j);
      c += poly([[X0 + 3, -96], [X0 + 9, -96], [X0 + 3, -86]], "#ffffff", op(.3));
      o += suA(av, dentro(vt, c) + pth(vt, "none", "stroke='#f2c94c' stroke-width='1.1'") + pth(vt, "none", bordo(L, .35)) + quadrifoglio((X0 + X1) / 2, -36, 5.4, false));
      o += tratto(aperto(H.sez(G > 0 ? B1 - .02 : B0 + .02)), "#f2c94c", 1.1, op(.95));
      return o + H.luccica(.5, .06, .94);
    }
    var corpoS = estruso("b", PROF, B0, B1, VERDE, { mat: { lucido: .7, esp: 22 }, tappo: G > 0 ? davanti : dietro, fascia: fascia, lw: 2.4 });
    s += zoc + corpoS;
    if (G < 0) s += cavo(.1, B0, 6);
    return s;
  });

  // un pezzo tirato lungo b con la sagoma concava (le carrozzerie): la sezione prof = [[a, z], ...] da b = t0 a b = t1.
  // I lati che si vedono uno per uno (dal più lontano al più vicino), il fianco vicino piatto (o.tappo(T) = i disegni sopra),
  // il contorno solo tutt'intorno; o.lato(i) = un colore diverso per il lato i (per esempio il buio dei passaruota)
  function carrozzeria(prof, t0, t1, c, o) {
    o = o || {};
    var n = prof.length, i, area = 0, facce = [], tv = G > 0 ? t1 : t0, m = o.mat || {};
    for (i = 0; i < n; i++) { var u1 = prof[i], u2 = prof[(i + 1) % n]; area += u1[0] * u2[1] - u2[0] * u1[1]; }
    var sg = area > 0 ? 1 : -1;
    for (i = 0; i < n; i++) {
      var e1 = prof[i], e2 = prof[(i + 1) % n], da = (e2[0] - e1[0]) * 61, dz = e2[1] - e1[1], l = Math.sqrt(da * da + dz * dz) || 1, nv = [G * sg * dz / l, 0, -sg * da / l];
      if (dot(nv, VISTA) <= .001) continue;
      var col = (o.lato && o.lato(i)) || tinta(c, nv, m);
      facce.push({ k: G * (e1[0] + e2[0]) / 2 + (e1[1] + e2[1]) / 2 * .0001, pp: [P(e1[0], t0, e1[1]), P(e2[0], t0, e2[1]), P(e2[0], t1, e2[1]), P(e1[0], t1, e1[1])], c: col });
    }
    facce.sort(function (x, y) { return x.k - y.k; });
    var cap = prof.map(function (x) { return P(x[0], tv, x[1]); }), dCap = chiuso(cap);
    var tutte = facce.concat([{ pp: cap, c: o.tappoCol || tinta(c, [0, G > 0 ? 1 : -1, 0].map(function (v, j) { return j === 1 ? G * (G > 0 ? 1 : -1) * Math.abs(v) : v; }), m) }]);
    var r = solido(tutte, o.lw || 2.4);
    if (o.tappo) {
      var xs = prof.map(function (x) { return x[0]; }), zs = prof.map(function (x) { return x[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
      var T = { O: P(G > 0 ? x0 : x1, tv, z1), X: P(G > 0 ? x1 : x0, tv, z1), Y: P(G > 0 ? x0 : x1, tv, z0), W: (x1 - x0) * 61, H: z1 - z0, x: function (a) { return (G > 0 ? a - x0 : x1 - a) * 61; }, y: function (z) { return z1 - z; } };
      T.su = function (cont) { return piano(T.O, T.X, T.Y, T.W, T.H, cont); };
      r += dentro(dCap, o.tappo(T));
    }
    return r + (o.spigoli ? o.spigoli : "");
  }

  // =========================================================
  //  AUTO IN PALIO: la sportiva rossa fiammante (carrozzeria laccata coi riflessi, i passaruota, i cerchi d'oro a cinque
  //  razze con le pinze rosse, i fari a goccia, la bocca nera davanti, le prese d'aria sul fianco, gli specchietti, il
  //  parabrezza e i finestrini scuri coi riflessi) con il nastro d'oro e il fiocco gigante sul tetto, sulla pedana girevole
  //  nera ovale col bordo d'oro e la corona di lampadine. Dietro: la coda coi quattro fanali tondi e gli scarichi
  // =========================================================
  def("auto_premio", { tipo: "piedi", nome: "Auto in palio", fp: [3, 2], box: [-92, -92, 91, 46], dietro: true, luce: [0, 0, 30, 190, "#ffd27a"] }, function () {
    var ROSSO = "#e0101e", ZG = 7, ZR = ZG + 11.5, RT = 11.5, RA = 13.6, ZB = 11, AR = -.74, AF = .74, BW = .5, BC = .38, KA = 1.2, i;   // KA: l'auto è un po' più alta del vero, per stare accanto all'avatar
    var s = "";
    // la pedana: il gradino nero lucido con le lampadine, il bordo d'oro, il disco col cerchio d'oro e i raggi
    var F1 = forma(0, 0, 1.44, .95, .95, 2), F2 = forma(0, 0, 1.38, .9, .9, 2), F3 = forma(0, 0, 1.33, .86, .86, 2);
    s += ombraPianta(-1.44, 1.44, -.95, .95, 1.1, .08);
    s += corpo([giro(F1, 0, 1, 96), giro(F1, 3.6, 1, 96)], [[0, "#4a4458"], [.4, "#24212a"], [1, "#0e0d12"]], 1.8);
    var bulbi = [], k;
    for (k = 0; k < 40; k++) { var t = k / 40 * 2 * Math.PI; if (vicino(Math.cos(t) * 1.44, Math.sin(t) * .95) >= -.05) bulbi.push(P(1.44 * Math.cos(t), .95 * Math.sin(t), 1.8)); }
    s += lampadine(bulbi, 1.05, ["#fff3bf", "#ffd43b"]);
    s += corpo([giro(F2, 3.6, 1, 96), giro(F2, ZG, 1, 96)], [[0, "#fff3c4"], [.35, "#e8b13a"], [.75, "#a87418"], [1, "#5e3f0c"]], 1.6);
    s += pth(chiuso(giro(F3, ZG, 1, 96)), nuovaR([[0, "#4a4458"], [.6, "#1e1c24"], [1, "#0b0a0e"]], .4, .35, .75));
    for (k = 0; k < 24; k++) { var tr = k / 24 * 2 * Math.PI; s += tratto(linea(P(.3 * Math.cos(tr), .2 * Math.sin(tr), ZG), P(1.28 * Math.cos(tr), .83 * Math.sin(tr), ZG)), "#5c5470", .4, op(.6)); }
    s += pth(chiuso(giro(forma(0, 0, 1.18, .76, .76, 2), ZG, 1, 96)), "none", "stroke='#e2b444' stroke-width='1.2' opacity='.9'") + pth(chiuso(giro(F3, ZG, .985, 96)), "none", "stroke='#fff3c4' stroke-width='.7' opacity='.8'");
    s += pth(chiuso(giro(forma(.02, 0, 1.25, .62, .62, 2.4), ZG, 1, 64)), rad("omb", [[0, "#000", .45], [.7, "#000", .25], [1, "#000", 0]], .5, .5, .5));   // l'ombra dell'auto sulla pedana
    STIRA = [ZG, KA];   // da qui in su tutto è più alto di KA (le ruote restano tonde: più grandi)
    // la carrozzeria (la sezione di lato: il muso a destra, la coda a sinistra, i due passaruota)
    var corpoP = [[-1.18, ZB]], ta = Math.asin((ZB - ZR) / RA), ka = 61 / KA;
    function arco(ac) { var pp = [], j, t0 = Math.PI - ta, t1 = ta; for (j = 0; j <= 14; j++) { var t = t0 + (t1 - t0) * j / 14; pp.push([ac + RA / ka * Math.cos(t), ZR + RA * Math.sin(t)]); } return pp; }
    var nArco1 = corpoP.length; corpoP = corpoP.concat(arco(AR)); var nArco1b = corpoP.length;
    var nArco2 = corpoP.length; corpoP = corpoP.concat(arco(AF)); var nArco2b = corpoP.length;
    corpoP = corpoP.concat([[1.16, ZB], [1.23, 13], [1.26, 16.5], [1.25, 20], [1.21, 22.6], [1.12, 24.6], [1, 26.2], [.8, 28.4], [.6, 30.6], [.42, 32.6], [.3, 33.8], [-.95, 35.6], [-1.06, 35.2], [-1.14, 33.6], [-1.19, 31.2], [-1.22, 27.6], [-1.23, 22.6], [-1.22, 17], [-1.2, 13]]);
    var cabP = [[-.95, 35.6], [.3, 33.8], [.22, 36.4], [.12, 41.4], [.02, 46], [-.06, 48.6], [-.14, 49.9], [-.26, 50.6], [-.4, 50.4], [-.52, 49.4], [-.64, 46.4], [-.76, 42.4], [-.87, 38.6]];
    function latoBuio(j) { return (j >= nArco1 && j < nArco1b - 1) || (j >= nArco2 && j < nArco2b - 1) ? "#2a2226" : null; }
    // il fianco: i riflessi della lacca, la portiera, la presa d'aria, la maniglia, la stella, il nastro d'oro
    var AN = -.28;   // dove passa il nastro
    function fianco(T) {
      var r = "", W = T.W, H = T.H, yb = T.y(ZB);
      r += rett(0, T.y(31.4), W, 8, 0, nuova([[0, "#ffffff", .38], [1, "#ffffff", 0]], 0, 0, 0, 1));   // la luce sulla spalla
      r += rett(0, T.y(17), W, T.y(ZB) - T.y(17), 0, nuova([[0, "#000", 0], [1, "#000", .35]], 0, 0, 0, 1));   // il buio in basso
      r += poly([[W * .16, 0], [W * .25, 0], [W * .17, H], [W * .08, H]], "#ffffff", op(.13)) + poly([[W * .3, 0], [W * .33, 0], [W * .25, H], [W * .22, H]], "#ffffff", op(.16)) + poly([[W * .66, 0], [W * .71, 0], [W * .63, H], [W * .58, H]], "#ffffff", op(.09));   // i riflessi della lacca
      r += tratto("M" + q(T.x(1.1), T.y(24)) + " Q" + q(T.x(.2), T.y(25.4)) + " " + q(T.x(-1.12), T.y(29.6)), "#ffffff", .9, op(.45));   // la nervatura sul fianco
      r += rett(0, yb - 3, W, 3, 0, "#1d1a20");   // la minigonna nera
      var x1 = T.x(.3), x2 = T.x(-.5);
      r += pth("M" + q(x1, T.y(32.6)) + " L" + q(x1 + (x2 - x1) * .02, T.y(13.4)) + " Q" + q((x1 + x2) / 2, T.y(12.2)) + " " + q(x2, T.y(13.6)) + " L" + q(x2, T.y(34.6)), "none", "stroke='#7a0710' stroke-width='.7' opacity='.85'");   // la portiera
      r += rett(Math.min(x1, x2) + Math.abs(x2 - x1) * .62, T.y(29.2), 6, 1.4, .7, nuova(CROMO, 0, 0, 0, 1), bordo(L, .25));   // la maniglia
      var xs1 = T.x(-.58), xs2 = T.x(-.9), ys = T.y(26.4);   // la presa d'aria davanti alla ruota dietro
      r += pth("M" + q(xs1, ys) + " Q" + q((xs1 + xs2) / 2, ys - 3) + " " + q(xs2, ys + 1.4) + " L" + q(xs2, ys + 9) + " Q" + q((xs1 + xs2) / 2, ys + 7) + " " + q(xs1, ys + 4) + " Z", "#1d1a20", bordo(L, .5));
      for (k = 1; k < 4; k++) r += tratto(linea([xs1 + (xs2 - xs1) * k / 4, ys + .5 - k * .3], [xs1 + (xs2 - xs1) * k / 4, ys + 4.6 + k * 1.1]), "#4a4458", .5);
      r += stella5(T.x(.62), T.y(23.4), 2.2, nuova(OTTONE, 0, 0, 1, 1), bordo(L, .3));   // lo stemma d'oro
      r += rett(T.x(AN) - 2.6, 0, 5.2, H, 0, nuova([[0, "#fff3c4"], [.5, "#f2c94c"], [1, "#b8860b"]], 0, 0, 1, 0)) + tratto(linea([T.x(AN) - 2.6, 0], [T.x(AN) - 2.6, H]), "#7a5214", .4) + tratto(linea([T.x(AN) + 2.6, 0], [T.x(AN) + 2.6, H]), "#7a5214", .4);   // il nastro
      return T.su(r);
    }
    function fiancoCab(T) {   // i finestrini scuri coi riflessi, il montante, il nastro d'oro
      var r = "", W = T.W, H = T.H, pp = [[.2, 36.6], [.1, 41.2], [.0, 45.6], [-.08, 48.1], [-.16, 49.1], [-.4, 49.4], [-.52, 48.5], [-.62, 45.9], [-.72, 42.3], [-.8, 38.8], [-.82, 37.6]].map(function (v) { return [T.x(v[0]), T.y(v[1])]; });
      var d = chiuso(pp), b = limiti(pp);
      r += pth(d, nuova([[0, "#5a6b86"], [.5, "#1e2433"], [1, "#0b0e16"]], 0, 0, 0, 1));
      r += dentro(d, poly([[b[0] + 2, b[1]], [b[0] + 9, b[1]], [b[0] + 3, b[3]], [b[0] - 4, b[3]]], "#ffffff", op(.28)) + poly([[b[0] + 12, b[1]], [b[0] + 14, b[1]], [b[0] + 8, b[3]], [b[0] + 6, b[3]]], "#ffffff", op(.2)));
      r += tratto(linea([T.x(-.47), T.y(49.2)], [T.x(-.55), T.y(37)]), "#b00d18", 2.2) + pth(d, "none", "stroke='#14161c' stroke-width='.7'");
      r += rett(T.x(AN) - 2.6, 0, 5.2, H, 0, nuova([[0, "#fff3c4"], [.5, "#f2c94c"], [1, "#b8860b"]], 0, 0, 1, 0)) + tratto(linea([T.x(AN) - 2.6, 0], [T.x(AN) - 2.6, H]), "#7a5214", .4) + tratto(linea([T.x(AN) + 2.6, 0], [T.x(AN) + 2.6, H]), "#7a5214", .4);
      return T.su(r);
    }
    var LAC = { lucido: .85, esp: 16 };
    var carr = carrozzeria(corpoP, -BW, BW, ROSSO, { mat: LAC, lato: latoBuio, tappo: fianco, tappoCol: "#d0101c" });
    var cab = carrozzeria(cabP, -BC, BC, ROSSO, { mat: LAC, tappo: fiancoCab, tappoCol: "#c40f1a", lw: 2 });
    // le ruote: la gomma (l'orlo tra le due facce) e il cerchio d'oro a cinque razze con la pinza rossa
    function ruota(ac, bEst, bInt, conCerchio) {
      var o = "", orlo = [], kk, rA = RT * KA / 61;
      for (kk = 0; kk < 48; kk++) { var t = kk / 48 * 2 * Math.PI; orlo.push(P(ac + rA * Math.cos(t), bEst, ZR + RT * Math.sin(t))); orlo.push(P(ac + rA * Math.cos(t), bInt, ZR + RT * Math.sin(t))); }
      var bo = limiti(orlo);
      o += pth(chiuso(inviluppo(orlo)), nuova([[0, "#5c5f66"], [.4, "#2b2d33"], [1, "#0e0f12"]], bo[0], 0, bo[2], 0, true), bordo(L, 1.6));
      if (!conCerchio) return o;
      var f = "", cx = ac * 61, cy = -ZR;
      f += cer(cx, cy, RT, nuovaR([[0, "#4a4d55"], [.75, "#1c1d22"], [1, "#0b0b0e"]], .4, .35, .7));
      f += cer(cx, cy, RT * .7, nuovaR([[0, "#fff3c4"], [.5, "#e2b444"], [1, "#8a5c12"]], .35, .3, .8), bordo(L, .6));
      f += cer(cx, cy, RT * .6, "#1c1d22");
      f += pth("M" + q(cx - RT * .5, cy - RT * .05) + " A" + f2(RT * .5) + "," + f2(RT * .5) + " 0 0,1 " + q(cx - RT * .12, cy - RT * .5) + " L" + q(cx - RT * .1, cy - RT * .38) + " A" + f2(RT * .38) + "," + f2(RT * .38) + " 0 0,0 " + q(cx - RT * .38, cy - RT * .05) + " Z", "#e8202b", bordo(L, .4));   // la pinza rossa
      for (kk = 0; kk < 5; kk++) { var ar = -Math.PI / 2 + kk * 2 * Math.PI / 5; f += pth("M" + q(cx + Math.cos(ar - .2) * RT * .14, cy + Math.sin(ar - .2) * RT * .14) + " L" + q(cx + Math.cos(ar - .1) * RT * .62, cy + Math.sin(ar - .1) * RT * .62) + " L" + q(cx + Math.cos(ar + .1) * RT * .62, cy + Math.sin(ar + .1) * RT * .62) + " L" + q(cx + Math.cos(ar + .2) * RT * .14, cy + Math.sin(ar + .2) * RT * .14) + " Z", nuova([[0, "#fff3c4"], [.5, "#e2b444"], [1, "#9a6a14"]], 0, 0, 1, 1), bordo(L, .4)); }
      f += cer(cx, cy, RT * .17, nuovaR([[0, "#fff6cf"], [1, "#b8860b"]], .35, .3, .8), bordo(L, .4)) + stella5(cx, cy, RT * .09, "#e8202b") + ell(cx - RT * .35, cy - RT * .4, RT * .14, RT * .07, "#ffffff", op(.6));
      var cy2 = -(ZG + (ZR - ZG) * KA);
      return { gomma: o, cerchio: suB(bEst, "<g transform='translate(" + q(cx, cy2) + ") scale(" + KA + ") translate(" + q(-cx, -cy) + ")'>" + f + "</g>") };
    }
    var bN = G > 0 ? BW : -BW, bNi = G > 0 ? BW - .16 : -BW + .16;
    function finestra(ac) {   // il buco del passaruota sul fianco vicino (fino a terra): la ruota si vede solo da lì
      var pp = arco(ac).map(function (v) { return P(v[0], bN, v[1]); }), a0 = arco(ac)[0][0], a1 = arco(ac)[14][0];
      return chiuso(pp.concat([P(a1, bN, ZG - 4), P(a0, bN, ZG - 4)]));
    }
    function ruotaV(ac) { var r = ruota(ac, bN, bNi, true); return dentro(finestra(ac), r.gomma) + r.cerchio; }
    var ruoteL = ruota(AR, -bN, -bNi, false) + ruota(AF, -bN, -bNi, false), ruoteV = ruotaV(AR) + ruotaV(AF);
    // i dettagli davanti (fari, bocca) e dietro (fanali, scarichi), il parabrezza, il lunotto, gli specchietti, il nastro sul tetto
    var dett = "";
    function quad(a0, b0, z0, a1, b1, z1, a2, b2, z2, a3, b3, z3, fill, x) { return poly([P(a0, b0, z0), P(a1, b1, z1), P(a2, b2, z2), P(a3, b3, z3)], fill, x); }
    if (G > 0) {
      [[.12, .42], [-.42, -.12]].forEach(function (bb) {   // i fari a goccia sul muso
        dett += quad(1.2, bb[0], 22.6, 1.2, bb[1], 22.6, 1.125, bb[1], 24.5, 1.125, bb[0], 24.5, NOTTE ? "#ffffff" : nuova([[0, "#ffffff"], [1, "#9fb7d0"]], 0, 0, 1, 1), bordo(L, .6));
        if (NOTTE) { var cl = P(1.18, (bb[0] + bb[1]) / 2, 23.6); dett += cer(cl[0], cl[1], 9, nuovaR([[0, "#ffffff", .7], [1, "#dbe9ff", 0]], .5, .5, .5)); }
      });
      dett += quad(1.255, -.34, 13.6, 1.255, .34, 13.6, 1.25, .34, 19.4, 1.25, -.34, 19.4, "#1d1a20", bordo(L, .6));   // la bocca
      for (k = 1; k < 7; k++) dett += tratto(linea(P(1.255, -.34 + k * .68 / 7, 13.8), P(1.25, -.34 + k * .68 / 7, 19.2)), "#4a4458", .45);
      dett += quad(1.2, -.46, 11.2, 1.2, .46, 11.2, 1.235, .46, 12.6, 1.235, -.46, 12.6, "#2b2d33");
      // il parabrezza
      dett += quad(.27, -BC + .045, 35.1, .27, BC - .045, 35.1, -.1, BC - .06, 48.9, -.1, -BC + .06, 48.9, nuova([[0, "#7d93b5"], [.4, "#26304a"], [1, "#0e121c"]], 0, 0, 0, 1), bordo("#14161c", .7));
      var w1 = P(.2, -.1, 38), w2 = P(.06, .1, 44);
      dett += poly([P(.24, -.2, 36.3), P(.2, .06, 36.3), P(.02, .1, 45), P(.04, -.16, 45)], "#ffffff", op(.22)) + tratto(linea(w1, w2), "#ffffff", .5, op(.3));
      // le prese d'aria sul cofano
      [-.2, .2].forEach(function (bb) {   // le due prese d'aria sul cofano, con le lamelle
        dett += quad(.78, bb - .065, 28.8, .78, bb + .065, 28.8, .64, bb + .065, 30.2, .64, bb - .065, 30.2, "#2a1a1e", bordo(L, .4));
        for (k = 1; k < 4; k++) dett += tratto(linea(P(.78 - k * .035, bb - .06, 28.8 + k * .35), P(.78 - k * .035, bb + .06, 28.8 + k * .35)), "#e0101e", .5);
      });
    } else {
      [-.38, -.22, .22, .38].forEach(function (bb) {   // i quattro fanali tondi
        var c = P(-1.222, bb, 25);
        if (NOTTE) dett += cer(c[0], c[1], 6.6, nuovaR([[0, "#ff8787", .7], [1, "#ff0000", 0]], .5, .5, .5));
        dett += ell(c[0], c[1], 2.6, 2.4, nuovaR(NOTTE ? [[0, "#ffffff"], [.4, "#ff6b6b"], [1, "#c92a2a"]] : [[0, "#ff8787"], [.5, "#e03131"], [1, "#7a0710"]], .4, .35, .8), bordo(L, .5)) + ell(c[0] - .8, c[1] - .8, .7, .5, "#ffffff", op(.8));
      });
      dett += quad(-1.205, -.44, 11.6, -1.205, .44, 11.6, -1.222, .44, 16.4, -1.222, -.44, 16.4, "#1d1a20", bordo(L, .5));   // il diffusore
      [-.12, .12].forEach(function (bb) { var c = P(-1.222, bb, 14.2); dett += ell(c[0], c[1], 2.2, 1.9, nuovaR([[0, "#ffffff"], [1, "#6c767e"]], .4, .35, .8), bordo(L, .4)) + ell(c[0], c[1], 1.3, 1.1, "#141418"); });
      // il lunotto e il cofano del motore con le griglie
      dett += quad(-.66, -BC + .05, 45.8, -.66, BC - .05, 45.8, -.86, BC - .05, 38.8, -.86, -BC + .05, 38.8, nuova([[0, "#7d93b5"], [.5, "#26304a"], [1, "#0e121c"]], 0, 0, 0, 1), bordo("#14161c", .7));
    }
    for (k = 0; k < 6; k++) dett += tratto(linea(P(-.97 - k * .028, -.32, 35.3 - k * .3), P(-.97 - k * .028, .32, 35.3 - k * .3)), "#2a1a1e", .8) + tratto(linea(P(-.975 - k * .028, -.32, 35.6 - k * .3), P(-.975 - k * .028, .32, 35.6 - k * .3)), "#ff6b6b", .35, op(.6));   // le feritoie sul cofano del motore
    // gli specchietti (sul lato che si vede)
    var sb = G > 0 ? BW : -BW, sm = P(.24, sb + (G > 0 ? .07 : -.07), 37), sm0 = P(.22, sb - (G > 0 ? .02 : -.02), 34.8);
    var specchio = tratto(linea(sm0, sm), L, 2.6) + tratto(linea(sm0, sm), "#c40f1a", 1.4) + ell(sm[0], sm[1] - 1, 3.4, 2.2, nuovaR([[0, "#ff6b6b"], [1, "#a30d16"]], .35, .3, .8), bordo(L, .6)) + ell(sm[0] - 1, sm[1] - 1.8, 1.2, .6, "#ffffff", op(.7));
    // il nastro d'oro sul tetto e il fiocco gigante
    var nastroT = quad(AN - .045, -BC, 50.55, AN + .045, -BC, 50.55, AN + .045, BC, 50.55, AN - .045, BC, 50.55, nuova([[0, "#fff3c4"], [.5, "#f2c94c"], [1, "#b8860b"]], 0, 0, 1, 0), bordo("#7a5214", .4));
    var fc = P(AN, 0, 51.2), fio = "";
    function cappio(sg) {   // un'ansa del fiocco (sg = −1 a sinistra, 1 a destra)
      var d = "M" + q(fc[0], fc[1] - 2) + " C" + q(fc[0] + sg * 6, fc[1] - 17) + " " + q(fc[0] + sg * 22, fc[1] - 16) + " " + q(fc[0] + sg * 19, fc[1] - 5) + " C" + q(fc[0] + sg * 17, fc[1] + 1) + " " + q(fc[0] + sg * 7, fc[1] + 1) + " " + q(fc[0], fc[1] - 2) + " Z";
      return pth(d, lin("fio", [[0, "#fff6cf"], [.4, "#f2c94c"], [1, "#a8740f"]], fc[0] + (sg < 0 ? -20 : 0), 0, fc[0] + (sg < 0 ? 0 : 20), 0, true), bordo(L, 1.1)) +
        tratto("M" + q(fc[0] + sg * 3, fc[1] - 4) + " C" + q(fc[0] + sg * 8, fc[1] - 13) + " " + q(fc[0] + sg * 17, fc[1] - 13) + " " + q(fc[0] + sg * 17, fc[1] - 6), "#fffbe6", .9, op(.8)) + tratto("M" + q(fc[0] + sg * 4, fc[1] - 1.4) + " C" + q(fc[0] + sg * 9, fc[1] - 5) + " " + q(fc[0] + sg * 13, fc[1] - 5) + " " + q(fc[0] + sg * 16, fc[1] - 3.6), "#8a5c12", .6, op(.6));
    }
    function coda(sg) {   // una coda del nastro che scende dal nodo, col taglio a V in fondo
      var x = fc[0], y = fc[1], d = "M" + q(x + sg * 1.6, y) + " C" + q(x + sg * 3.8, y + 5) + " " + q(x + sg * 6.6, y + 9) + " " + q(x + sg * 9.8, y + 14.6) + " L" + q(x + sg * 7.9, y + 13.3) + " L" + q(x + sg * 5.4, y + 16) +
        " C" + q(x + sg * 3.4, y + 10.6) + " " + q(x + sg * 1.4, y + 5.6) + " " + q(x - sg * .8, y + .6) + " Z";
      return pth(d, lin("cod", [[0, "#fff3c4"], [.45, "#f2c94c"], [1, "#a8740f"]], x, y, x + sg * 9, y + 15, true), bordo(L, .9)) + tratto("M" + q(x + sg * .6, y + 1.2) + " C" + q(x + sg * 2.8, y + 6) + " " + q(x + sg * 5, y + 9.6) + " " + q(x + sg * 7.4, y + 13.6), "#fffbe6", .6, op(.75));
    }
    fio += coda(-1) + coda(1) + cappio(-1) + cappio(1);
    fio += ell(fc[0], fc[1] - 2.6, 4.2, 3.8, nuovaR([[0, "#fffbe6"], [.5, "#f2c94c"], [1, "#9a6a14"]], .35, .3, .8), bordo(L, 1)) + ell(fc[0] - 1.2, fc[1] - 3.8, 1.4, .8, "#ffffff", op(.85));
    if (NOTTE) fio += stella(fc[0] - 12, fc[1] - 12, 2, "#ffffff", op(.95)) + stella(fc[0] + 14, fc[1] - 9, 1.6, "#ffffff", op(.9));
    // l'ordine: le ruote lontane, la carrozzeria, l'abitacolo, le ruote vicine, i dettagli, il nastro, il fiocco
    s += ruoteL + carr + cab + ruoteV + dett + specchio + nastroT + "<g transform='translate(" + q(fc) + ") scale(1.7) translate(" + q(-fc[0], -fc[1]) + ")'>" + fio + "</g>";
    STIRA = null;
    return s;
  });

  // ---------- l'oro delle statue (in piedi, la luce da sinistra in alto) ----------
  var ORO_ST = [[0, "#fffbe6"], [.22, "#ffe58a"], [.5, "#f2bf2c"], [.78, "#c98a0c"], [1, "#7a4f05"]];
  function oroR(cx, cy, r) { return nuovaR(ORO_ST, cx, cy, r); }   // l'oro tondo (cx, cy, r in frazioni della forma)

  // =========================================================
  //  GATTO DELLA FORTUNA (il Maneki-neko di Macao): il gatto d'oro gigante seduto, con la zampa destra alzata che chiama
  //  la fortuna, il collare rosso col campanello d'oro, la grande moneta ovale (il koban) nell'altra zampa, gli occhioni,
  //  i baffi e le guance rosse; seduto sul cuscino di velluto rosso con le nappe d'oro, sul piedistallo laccato rosso
  //  con le cornici d'oro e le monete. Dietro: la schiena tonda, la coda arricciata e il fiocco del collare
  // =========================================================
  def("gatto_fortuna", { tipo: "piedi", nome: "Gatto della fortuna", fp: [1, 1], box: [-45, -146, 45, 21], dietro: true }, function () {
    var RL = "#c8102e", s = ombraPianta(-.37, .37, -.37, .37, 1.1, .08);
    function cornice(medaglia) { return function (W, H) {
      var o = lucidoPiano(W, H, .55) + rett(3, 3, W - 6, H - 6, 1, "none", "stroke='#f2c94c' stroke-width='1.2'") + rett(4.2, 4.2, W - 8.4, H - 8.4, .8, "none", "stroke='#6e0b12' stroke-width='.45' opacity='.7'");
      if (medaglia) o += monetaD(W / 2, H / 2, 6.6) + monetaD(W / 2 - 12, H / 2 + 3, 3.4) + monetaD(W / 2 + 12, H / 2 + 3, 3.4);
      else o += stella5(W / 2, H / 2, 5, nuova(OTTONE, 0, 0, 1, 1), bordo(L, .5));
      return o;
    }; }
    s += blocco(-.36, .36, -.36, .36, 0, 30, RL, { davanti: cornice(true), dietro: cornice(false), fianco: cornice(false) }, 2.2);
    s += blocco(-.385, .385, -.385, .385, 30, 33, [nuova([[0, "#fff6cf"], [1, "#e2b444"]], 0, 0, 1, 1), nuova(OTTONE, 0, 0, 0, 1), nuova([[0, "#c99a36"], [1, "#7a5614"]], 0, 0, 0, 1)], null, 1.6);
    // il cuscino di velluto rosso con le nappe d'oro agli angoli
    var Fc = forma(0, 0, .31, .31, .31, 3.4), VEL = "#a3122a";
    s += corpo([giro(Fc, 33, .96, 64), giro(Fc, 35.6, 1.02, 64), giro(Fc, 38.2, .97, 64), giro(Fc, 39.2, .7, 48)], [[0, chiaro(VEL, .3)], [.4, VEL], [1, scuro(VEL, .5)]], 1.5);
    s += pth(chiuso(giro(Fc, 38.9, .8, 64)), nuovaR([[0, chiaro(VEL, .35)], [1, VEL]], .38, .32, .8));
    [[.29, .29], [-.29, .29], [.29, -.29], [-.29, -.29]].forEach(function (v) { if (vicino(v[0], v[1]) < 0) return; var c = P(v[0] * 1.03, v[1] * 1.03, 35.6); s += cer(c[0], c[1], 1.6, nuovaR(OTTONE, .35, .3, .8), bordo(L, .5)) + pth("M" + q(c[0] - 1.4, c[1] + 1) + " L" + q(c[0] - 1.8, c[1] + 6) + " L" + q(c[0] + 1.8, c[1] + 6) + " L" + q(c[0] + 1.4, c[1] + 1) + " Z", lin("nap", [[0, "#fff3c4"], [1, "#b8860b"]], 0, 0, 1, 0), bordo(L, .45)); });
    var g = P(0, .02, 38.6);
    return s + "<g transform='translate(" + q(g) + ") scale(1.1)'>" + (G > 0 ? gattoDavanti() : gattoDietro()) + "</g>";
  });
  function gattoDavanti() {   // il gatto visto da davanti (y = 0 sul cuscino, in su negativo)
    var s = "", oro = oroR(.35, .3, .85), oroB = lin("gob", ORO_ST, -26, 0, 26, 0, true);
    // la coda che spunta a destra, i piedi
    s += pth("M18,-6 C27,-6 31,-12 29,-19 C28,-23 24,-22 24.6,-19 C25.4,-14 22,-11 17,-11 Z", oroB, bordo(L, 1.2));
    // il corpo a pera e la pancia chiara
    var corpoG = "M-21,-2 C-27,-10 -27,-27 -21,-38 C-16,-46 16,-46 21,-38 C27,-27 27,-10 21,-2 C12,1 -12,1 -21,-2 Z";
    s += pth(corpoG, oroR(.35, .32, .8), bordo(L, 1.5)) + dentro(corpoG, ell(-10, -30, 9, 13, "#ffffff", op(.28)) + ell(14, -14, 12, 16, "#7a4f05", op(.22)));
    s += pth("M-12,-36 C-16,-26 -14,-10 -7,-4 C-2,-2 2,-2 7,-4 C14,-10 16,-26 12,-36 Z", nuovaR([[0, "#fffbe6"], [.6, "#ffe58a"], [1, "#e2a915"]], .4, .3, .8), "opacity='.9'");   // la pancia
    s += ell(-11, -2.4, 7.4, 4, oroR(.35, .3, .8), bordo(L, 1.1)) + ell(11, -2.4, 7.4, 4, oroR(.35, .3, .8), bordo(L, 1.1)) + tratto("M-13.4,-3.6 L-13.4,-.8 M-10,-4 L-10,-.6 M8.6,-3.6 L8.6,-.8 M12,-4 L12,-.6", "#9a6a0a", .7);
    // la zampa sinistra (a destra) che stringe il koban, la grande moneta ovale con le righe e il sigillo rosso
    var kob = "M8,-38 C17,-38 22,-31 22,-23 C22,-14 17,-8 8,-8 C-1,-8 -6,-14 -6,-23 C-6,-31 -1,-38 8,-38 Z";
    s += pth(kob, nuovaR([[0, "#fffbe6"], [.45, "#ffd43b"], [1, "#b8860b"]], .35, .3, .8), bordo(L, 1.2)) + pth("M8,-35.4 C15,-35.4 19.4,-30 19.4,-23 C19.4,-16 15,-10.6 8,-10.6 C1,-10.6 -3.4,-16 -3.4,-23 C-3.4,-30 1,-35.4 8,-35.4 Z", "none", "stroke='#b8860b' stroke-width='.8'");
    s += tratto("M3,-31 L3,-15 M6.4,-33 L6.4,-13 M9.8,-33 L9.8,-13 M13.2,-31 L13.2,-15", "#c98a0c", .6, op(.7)) + rett(5.6, -26.6, 4.8, 4.8, .5, "#d6283b", bordo("#7a0710", .4)) + ell(2.4, -32, 2.2, 1.2, "#ffffff", op(.8));
    s += pth("M14,-22 C21,-23 25,-19 24,-14 C23,-10 17,-10 14,-12 Z", oroR(.35, .3, .85), bordo(L, 1.1)) + tratto("M17.4,-11.4 L18.2,-14 M20.6,-11.2 L21.2,-13.8", "#9a6a0a", .6);
    // la testa: le orecchie, la faccia larga, il collare col campanello
    s += pth("M-21,-73 L-23,-94 L-6,-80 Z", oroR(.4, .3, .9), bordo(L, 1.2)) + pth("M21,-73 L23,-94 L6,-80 Z", oroR(.4, .3, .9), bordo(L, 1.2));
    s += pth("M-18.6,-76 L-20.2,-89.6 L-9.4,-80.4 Z", "#e8202b") + pth("M18.6,-76 L20.2,-89.6 L9.4,-80.4 Z", "#e8202b");
    var testa = "M-27,-60 C-28,-74 -18,-83 0,-83 C18,-83 28,-74 27,-60 C26,-48 16,-42 0,-42 C-16,-42 -26,-48 -27,-60 Z";
    s += pth(testa, oroR(.35, .3, .85), bordo(L, 1.5)) + dentro(testa, ell(-12, -72, 10, 6, "#ffffff", op(.3)) + ell(16, -50, 14, 9, "#7a4f05", op(.18)));
    s += ell(-17, -55.4, 4.4, 2.4, "#ff6b6b", op(.6)) + ell(17, -55.4, 4.4, 2.4, "#ff6b6b", op(.6));   // le guance
    [[-10.4, 1], [10.4, -1]].forEach(function (e) { s += ell(e[0], -62, 4.4, 5, "#1b1b22") + ell(e[0] - 1.4, -63.8, 1.8, 2, "#ffffff") + cer(e[0] + 1.6, -60, .8, "#ffffff", op(.8)) + tratto("M" + q(e[0] - 4, -69.4) + " Q" + q(e[0], -71.2) + " " + q(e[0] + 4, -69.4), "#e8202b", 1, op(.85)); });   // gli occhi e le sopracciglia rosse
    s += pth("M-2.2,-56.6 L2.2,-56.6 L0,-54 Z", "#ff6b9a", bordo("#a61e4d", .4)) + tratto("M0,-54 L0,-52.6 M-4.4,-51.4 C-2.4,-49.6 -.6,-50.4 0,-52.6 C.6,-50.4 2.4,-49.6 4.4,-51.4", "#5c1a1a", .8);   // il naso e la bocca
    s += tratto("M-12,-54 L-25,-56.4 M-12,-52.2 L-25.6,-51.6 M-12,-50.4 L-24,-47.4 M12,-54 L25,-56.4 M12,-52.2 L25.6,-51.6 M12,-50.4 L24,-47.4", "#5c1a1a", .6, op(.75));   // i baffi
    s += pth("M-18,-45 C-10,-40.4 10,-40.4 18,-45 L19,-41.6 C10,-36.6 -10,-36.6 -19,-41.6 Z", nuova([[0, "#ff4d5e"], [1, "#a30d16"]], 0, 0, 0, 1), bordo(L, 1));   // il collare
    s += cer(0, -35.6, 5.8, oroR(.35, .3, .8), bordo(L, 1)) + tratto("M-5.6,-36.6 L5.6,-36.6", "#9a6a0a", .7) + rett(-.6, -35, 1.2, 3.6, .5, "#5c3a10") + cer(0, -33.6, 1.2, "#5c3a10") + ell(-2, -38, 1.6, 1, "#ffffff", op(.85));   // il campanello
    s += ell(-6, -79, 3, 1.4, "#ffffff", op(.55)) + stella(-14, -78, 1.6, "#ffffff", op(.9)) + stella(22, -30, 1.4, "#ffffff", op(.85));   // i luccichii dell'oro
    // il braccio destro alzato (a sinistra), davanti accanto alla faccia, con la zampa che chiama (i cuscinetti rosa)
    s += pth("M-14,-39 C-24,-42 -31,-50 -33.4,-60 L-23.4,-63 C-21.6,-54.6 -16.4,-47.6 -8,-43 Z", oroR(.3, .3, .95), bordo(L, 1.2)) + tratto("M-29.6,-58 C-27,-50 -22,-45 -15,-42", "#fffbe6", .9, op(.55));
    s += pth("M-37,-66 C-38.6,-76.4 -32.4,-82.4 -27.2,-81.4 C-22,-80.4 -19.2,-75.4 -20.2,-67 C-21.4,-61.6 -34.8,-60.4 -37,-66 Z", oroR(.35, .3, .85), bordo(L, 1.3)) + tratto("M-31.4,-80.2 L-31,-77.6 M-26.8,-81 L-26.8,-78.4", "#9a6a0a", .7);
    s += ell(-28.6, -67.4, 4.2, 3.5, "#ff8fab", bordo("#c2255c", .55)) + cer(-33.6, -74.2, 1.7, "#ff8fab", bordo("#c2255c", .35)) + cer(-29.2, -76.4, 1.7, "#ff8fab", bordo("#c2255c", .35)) + cer(-24.6, -75, 1.7, "#ff8fab", bordo("#c2255c", .35)) + ell(-30, -69, 1.4, .8, "#ffffff", op(.6));
    return s;
  }
  function gattoDietro() {   // il gatto visto da dietro: la schiena, la coda arricciata, la nuca con le orecchie, il fiocco del collare
    var s = "", oroB = lin("gob", ORO_ST, -26, 0, 26, 0, true);
    var corpoG = "M-21,-2 C-27,-10 -27,-27 -21,-38 C-16,-46 16,-46 21,-38 C27,-27 27,-10 21,-2 C12,1 -12,1 -21,-2 Z";
    s += pth(corpoG, oroR(.35, .32, .8), bordo(L, 1.5)) + dentro(corpoG, ell(-10, -28, 8, 14, "#ffffff", op(.25)) + ell(14, -14, 12, 16, "#7a4f05", op(.22)) + tratto("M0,-44 C1,-30 1,-16 0,-4", "#c98a0c", .8, op(.6)));
    // la coda arricciata sulla schiena
    s += pth("M-6,-3 C-14,-6 -16,-16 -10,-21 C-5,-25 2,-22 2,-16 C2,-12 -2,-11 -4,-13 C-5.6,-15 -3.6,-17.6 -2,-16.4", "none", "stroke='" + L + "' stroke-width='7.6' stroke-linecap='round'") + pth("M-6,-3 C-14,-6 -16,-16 -10,-21 C-5,-25 2,-22 2,-16 C2,-12 -2,-11 -4,-13 C-5.6,-15 -3.6,-17.6 -2,-16.4", "none", "stroke='" + "#e9b23a" + "' stroke-width='5' stroke-linecap='round'") + tratto("M-12.4,-12 C-12.4,-17 -9,-21 -5,-21", "#fffbe6", 1, op(.7));
    // la zampa alzata (a destra, dietro la testa)
    s += pth("M14,-39 C24,-42 31,-50 33.4,-60 L23.4,-63 C21.6,-54.6 16.4,-47.6 8,-43 Z", oroR(.3, .3, .95), bordo(L, 1.2)) + pth("M37,-66 C38.6,-76.4 32.4,-82.4 27.2,-81.4 C22,-80.4 19.2,-75.4 20.2,-67 C21.4,-61.6 34.8,-60.4 37,-66 Z", oroR(.35, .3, .85), bordo(L, 1.3));
    // la nuca e le orecchie
    s += pth("M-21,-73 L-23,-94 L-6,-80 Z", oroR(.4, .3, .9), bordo(L, 1.2)) + pth("M21,-73 L23,-94 L6,-80 Z", oroR(.4, .3, .9), bordo(L, 1.2));
    var testa = "M-27,-60 C-28,-74 -18,-83 0,-83 C18,-83 28,-74 27,-60 C26,-48 16,-42 0,-42 C-16,-42 -26,-48 -27,-60 Z";
    s += pth(testa, oroR(.35, .3, .85), bordo(L, 1.5)) + dentro(testa, ell(-12, -72, 10, 6, "#ffffff", op(.28)) + ell(16, -50, 14, 9, "#7a4f05", op(.18)));
    s += pth("M-18,-45 C-10,-40.4 10,-40.4 18,-45 L19,-41.6 C10,-36.6 -10,-36.6 -19,-41.6 Z", nuova([[0, "#ff4d5e"], [1, "#a30d16"]], 0, 0, 0, 1), bordo(L, 1));
    s += pth("M0,-41 C-6,-47 -11,-44 -9,-39 C-7,-35 -3,-38 0,-41 C3,-38 7,-35 9,-39 C11,-44 6,-47 0,-41 Z", nuova([[0, "#ff6b7a"], [1, "#a30d16"]], 0, 0, 0, 1), bordo(L, .8)) + cer(0, -40.6, 1.6, "#c8102e", bordo(L, .6)) + tratto("M-1,-39.6 L-4,-31 M1,-39.6 L4,-31.4", "#c8102e", 1.6);   // il fiocco del collare
    return s + ell(-8, -78, 3, 1.4, "#ffffff", op(.5));
  }

  // ---------- i tubi (il corpo del drago): una curva nello spazio, disegnata a strisce d'oro (il buio sotto, la luce in alto a sinistra) ----------
  function curva(cp, n) {   // la curva morbida che passa per i punti cp ([a, b, z]), n pezzi
    var out = [], i, m = cp.length - 1;
    for (i = 0; i <= n; i++) {
      var t = i / n * m, k = Math.min(m - 1, Math.floor(t)), u = t - k, p0 = cp[Math.max(0, k - 1)], p1 = cp[k], p2 = cp[k + 1], p3 = cp[Math.min(m, k + 2)], v = [];
      for (var j = 0; j < 3; j++) v.push(.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u * u + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u * u * u));
      out.push(v);
    }
    return out;
  }
  var ORO_T = ["#a8690a", "#dd9f1e", "#f6cc4a", "#fff0b0"];
  function tubo(pp, rr, cols) {   // pp = i punti sullo schermo, rr = i raggi: il contorno, il buio, il mezzo, la luce, il lucido
    cols = cols || ORO_T;
    var passi = [[L, 2, 2.6, 0, 0, 1], [cols[0], 2, 0, 0, 0, 1], [cols[1], 1.5, 0, -.2, -.26, 1], [cols[2], .85, 0, -.36, -.46, 1], [cols[3], .3, 0, -.46, -.58, .8]], o = "";
    passi.forEach(function (ps) {
      for (var i = 0; i < pp.length - 1; i++) {
        var r = (rr[i] + rr[i + 1]) / 2, dx = ps[3] * r, dy = ps[4] * r;
        o += "<path d='M" + q(pp[i][0] + dx, pp[i][1] + dy) + " L" + q(pp[i + 1][0] + dx, pp[i + 1][1] + dy) + "' stroke='" + ps[0] + "' stroke-width='" + f2(r * ps[1] + ps[2]) + "' stroke-linecap='round' fill='none'" + (ps[5] < 1 ? " opacity='" + ps[5] + "'" : "") + "/>";
      }
    });
    return o;
  }
  function normale(pp, i, su) {   // la normale sullo schermo nel punto i (su = quella che guarda in alto)
    var a = pp[Math.max(0, i - 1)], b = pp[Math.min(pp.length - 1, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], l = Math.sqrt(tx * tx + ty * ty) || 1, n = [-ty / l, tx / l];
    if (su && n[1] > 0) n = [-n[0], -n[1]];
    return { n: n, t: [tx / l, ty / l] };
  }
  function pinne(pp, rr, ogni, da, a, h) {   // le pinne rosse lungo la schiena (verso l'alto), piegate verso la coda
    var o = "", i;
    for (i = da; i < pp.length - a; i += ogni) {
      var nt = normale(pp, i, true), n = nt.n, t = nt.t, r = rr[i], c = pp[i], hh = h || 5;
      var b1 = [c[0] + n[0] * r * .6 + t[0] * 2.2, c[1] + n[1] * r * .6 + t[1] * 2.2], b2 = [c[0] + n[0] * r * .6 - t[0] * 2.2, c[1] + n[1] * r * .6 - t[1] * 2.2], tip = [c[0] + n[0] * (r + hh) - t[0] * 2.4, c[1] + n[1] * (r + hh) - t[1] * 2.4];
      o += pth("M" + q(b1) + " Q" + q((b1[0] + tip[0]) / 2 + n[0], (b1[1] + tip[1]) / 2 + n[1]) + " " + q(tip) + " L" + q(b2) + " Z", nuova([[0, "#ffb08a"], [.5, "#e8452c"], [1, "#9c1a0e"]], 0, 0, 1, 1), bordo(L, .7));
    }
    return o;
  }
  function squame(pp, rr, ogni) {   // le squame: le "v" sulla schiena del tubo
    var o = "", i;
    for (i = 2; i < pp.length - 2; i += ogni) {
      var nt = normale(pp, i, true), n = nt.n, t = nt.t, r = rr[i], c = [pp[i][0] - .3 * r, pp[i][1] - .38 * r];
      [-.42, 0, .42].forEach(function (k) { var m = [c[0] + n[0] * r * k, c[1] + n[1] * r * k]; o += tratto("M" + q(m[0] + n[0] * r * .2 + t[0] * 1.2, m[1] + n[1] * r * .2 + t[1] * 1.2) + " Q" + q(m[0] - t[0] * .6, m[1] - t[1] * .6) + " " + q(m[0] - n[0] * r * .2 + t[0] * 1.2, m[1] - n[1] * r * .2 + t[1] * 1.2), "#9a5f05", .45, op(.55)); });
    }
    return o;
  }
  function artiglio(c, dir, k) {   // la zampa con quattro unghie d'avorio (c = il polso, dir = verso dove punta)
    var o = "", j;
    for (j = -1.5; j <= 1.5; j += 1) {
      var an = Math.atan2(dir[1], dir[0]) + j * .42, e = [c[0] + Math.cos(an) * 4.4 * k, c[1] + Math.sin(an) * 4.4 * k], m = [c[0] + Math.cos(an) * 2.4 * k, c[1] + Math.sin(an) * 2.4 * k];
      o += tratto(linea(c, m), L, 3.2 * k) + tratto(linea(c, m), "#e2a915", 2 * k) + pth("M" + q(m[0] - Math.sin(an) * .9 * k, m[1] + Math.cos(an) * .9 * k) + " Q" + q(e[0] + Math.cos(an + 1.2) * 1.2 * k, e[1] + Math.sin(an + 1.2) * 1.2 * k) + " " + q(e) + " L" + q(m[0] + Math.sin(an) * .9 * k, m[1] - Math.cos(an) * .9 * k) + " Z", "#fff8e6", bordo(L, .5));
    }
    return o;
  }

  // =========================================================
  //  DRAGO D'ORO (l'angolo di Macao): il drago cinese d'oro che si attorciglia uscendo e rientrando dalle nuvole di giada:
  //  il corpo a squame con le pinne rosse sulla schiena, la coda col ciuffo di fiamma, le zampe con gli artigli, il collo
  //  che sale alla testa (le corna ramificate, la criniera di fuoco, l'occhio, i baffi lunghi, la bocca aperta coi denti e la
  //  lingua) e la perla fiammeggiante stretta nella zampa davanti; sulla base lunga di giada lucida col bordo d'oro.
  //  Dietro: lo stesso drago visto dall'altra parte, con la nuca, le corna e la criniera
  // =========================================================
  def("drago_dorato", { tipo: "piedi", nome: "Drago d'oro", fp: [2, 1], box: [-86, -137, 76, 37], dietro: true }, function () {
    var s = ombraPianta(-.92, .92, -.4, .4, 1.1, .06), ZB = 16, i;
    var GIADA = "#2f9e6e";
    function giada(W, H) { var o = lucidoPiano(W, H, .6), rr = rnd(Math.round(W * 7)), k; for (k = 0; k < 6; k++) { var x = rr() * W, y = rr() * H; o += pth("M" + q(x, y) + " C" + q(x + 6, y - 3) + " " + q(x + 10, y + 4) + " " + q(x + 18, y + 1), "none", "stroke='#c3fae8' stroke-width='" + f2(.4 + rr() * .6) + "' opacity='.45'"); } return o + rett(0, 0, W, 1.6, 0, "#f2c94c") + rett(0, H - 2, W, 2, 0, "#f2c94c") + rett(0, H - 2, W, .4, 0, "#fff3c4", op(.8)); }
    s += blocco(-.9, .9, -.38, .38, 0, ZB, GIADA, { davanti: giada, dietro: giada, fianco: giada }, 2.2);
    // le nuvole di giada sopra la base (dove il drago entra ed esce)
    function nuvola(a, b, k) {
      var c = P(a, b, ZB), o = "", lumps = [[-7, -1, 6], [0, -3.6, 7.4], [7.4, -1.4, 6], [-2, 1.2, 6.4], [4, 1.8, 5.4]];
      lumps.forEach(function (l) { o += cer(c[0] + l[0] * k, c[1] + l[1] * k - 2 * k, l[2] * k, nuovaR([[0, "#b2f2d0"], [.5, "#3cbf86"], [1, "#16654a"]], .35, .3, .8), bordo(L, 1)); });
      return o + tratto("M" + q(c[0] - 4 * k, c[1] - 5.6 * k) + " Q" + q(c[0] - 1 * k, c[1] - 8.6 * k) + " " + q(c[0] + 2.4 * k, c[1] - 6.6 * k), "#e6fcf5", .9 * k, op(.8));
    }
    // il corpo: tre pezzi (la coda, l'arco nel mezzo, il collo) e le zampe
    function pezzo(cp, r0, r1, rMid, n, cosa) {
      var pt3 = curva(cp, n), pp = pt3.map(function (v) { return P(v[0], v[1], v[2]); }), rr = pt3.map(function (v, j) { var t = j / n; return rMid != null ? r0 + (rMid - r0) * Math.sin(Math.PI * t) * 1 + (r1 - r0) * t * 0 : r0 + (r1 - r0) * t; });
      return { pp: pp, rr: rr, k: vicino(cp[Math.floor(cp.length / 2)][0], cp[Math.floor(cp.length / 2)][1]), cosa: cosa };
    }
    var coda = pezzo([[.26, .1, ZB - 2], [.3, .03, 28], [.4, -.05, 40], [.54, -.07, 42], [.66, -.02, 36], [.76, .04, 38], [.83, .06, 47]], 5.4, 1.3, null, 30, "coda");
    var arco = pezzo([[-.34, .1, ZB - 2], [-.3, .04, 32], [-.2, -.06, 48], [-.06, -.08, 51], [.06, -.02, 38], [.1, .06, ZB - 2]], 5.4, 5.4, 6, 32, "arco");
    var collo = pezzo([[-.5, .1, ZB - 2], [-.53, .04, 30], [-.58, -.02, 48], [-.62, 0, 62], [-.64, .04, 72]], 6.2, 5.4, null, 24, "collo");
    function disegnaPezzo(pz) {
      var o = "", fin = pz.cosa === "coda" ? pinne(pz.pp, pz.rr, 3, 3, 4, 4.4) : pinne(pz.pp, pz.rr, 3, 3, 3, 5.4);
      o += fin + tubo(pz.pp, pz.rr) + squame(pz.pp, pz.rr, 3);
      if (pz.cosa === "coda") {   // il ciuffo di fiamma in punta alla coda
        var e = pz.pp[pz.pp.length - 1], nt = normale(pz.pp, pz.pp.length - 1, false), t = nt.t;
        o += pth("M" + q(e[0] - 2, e[1] - 1) + " C" + q(e[0] + t[0] * 6 - 4, e[1] + t[1] * 6 - 8) + " " + q(e[0] + t[0] * 12, e[1] + t[1] * 12 - 10) + " " + q(e[0] + t[0] * 14 + 2, e[1] + t[1] * 14 - 4) + " C" + q(e[0] + t[0] * 9, e[1] + t[1] * 9 - 2) + " " + q(e[0] + t[0] * 11 + 3, e[1] + t[1] * 11 + 4) + " " + q(e[0] + t[0] * 6, e[1] + t[1] * 6 + 4) + " C" + q(e[0] + 2, e[1] + 4) + " " + q(e[0], e[1] + 2) + " " + q(e[0] - 2, e[1] - 1) + " Z", nuova([[0, "#ffd8a8"], [.5, "#f03e3e"], [1, "#9c1a0e"]], 0, 0, 1, 1), bordo(L, .9));
      }
      return o;
    }
    // le zampe: quella di dietro che stringe la nuvola, quella davanti che tiene la perla
    function zampa(cp, r, dir) { var pt3 = curva(cp, 8), pp = pt3.map(function (v) { return P(v[0], v[1], v[2]); }), rr = pp.map(function () { return r; }), e = pp[pp.length - 1]; return tubo(pp, rr) + artiglio(e, dir, 1); }
    var zDietro = zampa([[.02, .02, 30], [.05, .14, 24], [.08, .23, ZB + 2]], 2.4, G > 0 ? [-.6, .8] : [.6, .8]);
    var zDavanti = zampa([[-.52, .06, 40], [-.5, .19, 35], [-.52, .29, 39]], 2.5, [0, -1]);
    // la perla fiammeggiante (stretta dagli artigli)
    var pc = P(-.52, .31, 48), perla = "";
    perla += pth("M" + q(pc[0] - 6, pc[1] + 3) + " C" + q(pc[0] - 12, pc[1] - 4) + " " + q(pc[0] - 6, pc[1] - 14) + " " + q(pc[0] + 1, pc[1] - 15) + " C" + q(pc[0] - 3, pc[1] - 10) + " " + q(pc[0] + 4, pc[1] - 10) + " " + q(pc[0] + 7, pc[1] - 13) + " C" + q(pc[0] + 11, pc[1] - 6) + " " + q(pc[0] + 9, pc[1] + 2) + " " + q(pc[0] + 5, pc[1] + 5) + " Z", nuova([[0, "#ffe066"], [.5, "#ff6b3d"], [1, "#c92a2a"]], 0, 0, 0, 1), bordo(L, .9));
    perla += tratto("M" + q(pc[0] - 4, pc[1] - 9) + " C" + q(pc[0] - 6, pc[1] - 3) + " " + q(pc[0] - 2, pc[1] + 2) + " " + q(pc[0] + 4, pc[1]), "#fff3bf", .8, op(.8));
    perla += cer(pc[0], pc[1] - 3, 5.6, nuovaR([[0, "#ffffff"], [.5, "#e3f2ff"], [1, "#8fb8de"]], .35, .3, .8), bordo(L, .9)) + ell(pc[0] - 1.8, pc[1] - 5.2, 1.9, 1.1, "#ffffff") + tratto("M" + q(pc[0] - 3.4, pc[1] - .6) + " Q" + q(pc[0], pc[1] + 1.2) + " " + q(pc[0] + 3.6, pc[1] - 1.4), "#74c0fc", .6, op(.6));
    // la testa (sul collo), grande
    var hc = collo.pp[collo.pp.length - 1], testa = "<g transform='translate(" + q(hc) + ") scale(" + (G > 0 ? "1.3 1.3" : "-1.3 1.3") + ")'>" + (G > 0 ? testaDrago() : nucaDrago()) + "</g>";
    // l'ordine: dal più lontano al più vicino (le nuvole davanti ai piedi dei pezzi)
    var cose = [
      { k: coda.k, s: disegnaPezzo(coda) }, { k: arco.k, s: disegnaPezzo(arco) }, { k: collo.k, s: disegnaPezzo(collo) },
      { k: vicino(.05, .2) + .02, s: zDietro }, { k: vicino(-.51, .3), s: zDavanti + perla },
      { k: vicino(-.5, .1) + .05, s: nuvola(-.5, .12, 1.15) }, { k: vicino(-.34, .1) + .05, s: nuvola(-.34, .12, 1.1) }, { k: vicino(.1, .06) + .05, s: nuvola(.1, .08, 1.1) },
      { k: vicino(.26, .1) + .05, s: nuvola(.26, .12, 1.1) }, { k: vicino(.08, .24) + .03, s: nuvola(.08, .25, .8) }, { k: vicino(.66, .2), s: nuvola(.66, .22, .85) }, { k: vicino(-.78, .18), s: nuvola(-.78, .2, .9) }, { k: vicino(-.2, -.2), s: nuvola(-.2, -.22, .8) }
    ];
    cose.push({ k: collo.k + .01, s: testa });
    cose.sort(function (x, y) { return x.k - y.k; });
    cose.forEach(function (c) { s += c.s; });
    return s;
  });
  var FUOCO = [[0, "#ffd8a8"], [.45, "#f03e3e"], [1, "#8a1508"]];
  function cornoD(dx, dy, sc, scuro2) {   // il corno ramificato (dalla radice in basso a sinistra verso l'alto e indietro)
    return "<g transform='translate(" + q(dx, dy) + ") scale(" + f2(sc) + ")'" + (scuro2 ? " opacity='.8'" : "") + ">" +
      pth("M-3,0 C-1,-8 4,-15 12,-20 C9,-15 8,-12 8.6,-9 C11,-12 14,-13.4 18,-13 C13,-10 9,-6 5,1 Z", nuova([[0, "#fffaf0"], [.6, "#e9d3a8"], [1, "#b8925a"]], 0, 0, 1, 1), bordo(L, .9)) +
      pth("M3.4,-12.6 C2,-17 3,-21 6,-24 C6.4,-20 7.2,-17.6 8.6,-15.6 Z", nuova([[0, "#fffaf0"], [1, "#c9a46a"]], 0, 0, 1, 1), bordo(L, .8)) + tratto("M-1,-2 C1,-8 5,-13 10,-17.4", "#ffffff", .5, op(.75)) + "</g>";
  }
  function testaDrago() {   // la testa vista di tre quarti, girata a sinistra (0,0 = dove si attacca al collo)
    var s = "", oro = lin("tdo", [[0, "#fff0b0"], [.35, "#f6cc4a"], [.75, "#dd9f1e"], [1, "#a8690a"]], -34, -20, 8, 14, true);
    // la criniera di fuoco dietro e sotto la testa
    s += pth("M1,-12 C4,-21 13,-22 14,-15 C20,-17 24,-9 17,-5 C23,-2 22,7 14,5 C16,12 8,15 5,9 C2,14 -5,13 -3,7 C-6,3 -5,-2 -4,-5 Z", nuova(FUOCO, 0, 0, 1, 1), bordo(L, 1));
    s += tratto("M4,-11 C7,-16 11,-16 12,-12 M5,1 C10,-1 15,1 15,4 M3,6 C5,9 6,11 5,12", "#ffd8a8", .7, op(.75));
    // le corna (quella lontana più chiara)
    s += cornoD(5, -11, .95, true) + cornoD(-1, -12, 1, false);
    // la mascella di sotto, aperta, con la bocca rossa, la lingua arricciata e i denti
    s += pth("M-2,2 C-10,9 -18,13 -27,13 C-30.4,13 -31,10 -28,8.6 C-20,8 -12,4 -6,-1 Z", oro, bordo(L, 1.1));
    s += pth("M-27.4,9 C-20,8.4 -12,4 -6,-1 L-8,-4.4 C-14,-2.2 -22,-.4 -29.4,1.8 Z", "#6e0b14");
    s += pth("M-19,5.2 C-25,3.6 -31.4,5.6 -34.6,10.4 C-31.6,8.6 -28.4,9 -26.4,10.6 C-24,9.2 -21.6,7.6 -19,5.2 Z", "#ff6b81", bordo(L, .6));
    [-24.6, -20.6, -16.6, -12.8].forEach(function (x, j) { s += pth("M" + q(x - 1.1, 7.6 - j * .9) + " L" + q(x, 4.4 - j * .9) + " L" + q(x + 1.1, 7.6 - j * .9) + " Z", "#ffffff", bordo(L, .3)); });
    s += pth("M-26.4,8.6 L-25.6,3.6 L-24.4,8.2 Z", "#ffffff", bordo(L, .35));   // la zanna di sotto
    // la testa: la fronte alta, il muso, il naso grosso all'insù
    var capo = "M5,-10 C3,-18 -5,-22 -12,-19 C-16,-17 -19,-14.4 -24,-13.4 C-29,-12.6 -33,-11 -34,-7 C-34.6,-3.6 -32,-1.4 -28,-2 C-21,-2 -13,-2.6 -6,-4.6 C-1,-6 4,-6.6 5,-10 Z";
    s += pth(capo, oro, bordo(L, 1.3)) + dentro(capo, ell(-16, -15, 8, 3, "#ffffff", op(.35)) + ell(-6, -6, 10, 3, "#a8690a", op(.25)));
    s += pth("M-29,-12.4 C-31,-17.6 -38,-16 -37.4,-10.2 C-37,-6.8 -32.8,-6.2 -30.4,-8.2 Z", nuovaR(ORO_ST, .35, .3, .85), bordo(L, 1)) + ell(-34.4, -9.6, 1.5, 1, "#5c3a10") + ell(-33.4, -13.4, 1.4, .8, "#ffffff", op(.7));   // il naso con la narice
    [-29.6, -25.8, -22, -18.2, -14.4].forEach(function (x) { s += pth("M" + q(x - 1, -2.6) + " L" + q(x, .4) + " L" + q(x + 1, -2.6) + " Z", "#ffffff", bordo(L, .3)); });   // i denti di sopra
    s += pth("M-27.6,-2.4 L-26.8,3 L-25.6,-2.4 Z", "#ffffff", bordo(L, .35));   // la zanna di sopra
    s += tratto("M-30,-3.4 C-24,-3.2 -16,-3.6 -8,-5.8", "#a8690a", .6, op(.7));
    // l'orecchio a pinna, l'occhio sporgente (iride arancio, pupilla a fessura) col sopracciglio di fuoco
    s += pth("M-1,-13 C3,-18 8,-17 9,-13 C6,-12 2,-11 -1,-13 Z", oro, bordo(L, .8));
    s += ell(-12.6, -12.4, 4.6, 3.9, "#fffbe6", bordo(L, 1)) + cer(-13.4, -12.2, 2.6, nuovaR([[0, "#ffd43b"], [1, "#e8590c"]], .4, .35, .7)) + ell(-13.4, -12.2, .8, 2.2, "#1b1b22") + cer(-14.6, -13.6, .8, "#ffffff");
    s += pth("M-19,-15.4 C-16,-21 -9,-22.4 -4,-19.4 C-2,-21.6 1.4,-21.4 3.4,-19.2 C0,-17.4 -3,-16.6 -6,-16 C-10,-16.8 -15,-16.2 -19,-15.4 Z", nuova(FUOCO, 0, 0, 0, 1), bordo(L, .8));
    // i baffi lunghi (dal naso, ondeggiano indietro) e la barba di fuoco sotto il mento
    s += tratto("M-31,-4 C-26,5 -31,15 -21,19 C-13,22 -9,15 -14,12.6", "#7a4f05", 1.5) + tratto("M-31,-4 C-26,5 -31,15 -21,19 C-13,22 -9,15 -14,12.6", "#f6cc4a", .85);
    s += tratto("M-27,-13 C-28,-24 -17,-30 -9,-27.6 C-3,-25.6 -4,-19.6 -9,-21.4", "#7a4f05", 1.4) + tratto("M-27,-13 C-28,-24 -17,-30 -9,-27.6 C-3,-25.6 -4,-19.6 -9,-21.4", "#f6cc4a", .8);
    s += pth("M-21,11.6 C-22,17 -18,21 -14,22 C-15,18 -13,15 -10,13 C-9,17 -5,20 -2,20 C-4,16 -3,11 -3,6 Z", nuova(FUOCO, 0, 0, 0, 1), bordo(L, .9));
    s += stella(-21, -15, 1.6, "#ffffff", op(.9)) + stella(-33.6, -14.6, 1.1, "#ffffff", op(.85));
    return s;
  }
  function nucaDrago() {   // la testa vista da dietro: il muso che guarda lontano, la criniera di fuoco tutt'intorno, la nuca d'oro con la cresta, le corna
    var s = "", oro = lin("tdo", [[0, "#fff0b0"], [.35, "#f6cc4a"], [.75, "#dd9f1e"], [1, "#a8690a"]], -18, -24, 16, 14, true);
    // la criniera di fuoco dietro la testa (le lingue di fiamma tutt'intorno)
    var crin = "M-12,-14 C-20,-16 -25,-8 -21,-3 C-27,1 -25,10 -18,10 C-22,16 -15,22 -9,18 C-9,25 0,27 2,21 C6,27 15,24 14,17 C21,20 26,12 20,7 C27,3 25,-6 18,-6 C21,-13 15,-19 9,-16 C8,-22 -1,-23 -3,-18 C-6,-21 -11,-19 -12,-14 Z";
    s += pth(crin, nuova(FUOCO, 0, 0, .4, 1), bordo(L, 1.1));
    s += tratto("M-18,-4 C-21,0 -20,5 -17,7 M17,-4 C21,0 21,5 18,7 M-8,15 C-7,19 -4,21 -2,20 M5,16 C6,20 10,21 12,19 M4,-17 C7,-19 10,-18 11,-15", "#ffd8a8", .8, op(.8));
    // il muso lontano (guarda in là, in su), la narice e un baffo che si alza
    s += pth("M-5,-9 C-9,-15 -14,-20 -20,-22 C-23.6,-23 -25.4,-20.4 -23.6,-18 C-18,-14 -12,-8 -7,-3 Z", oro, bordo(L, 1.1));
    s += pth("M-22,-23.4 C-24.6,-27 -29.6,-25 -28.6,-21 C-28,-18.6 -25,-18.4 -23.6,-20 Z", nuovaR(ORO_ST, .35, .3, .85), bordo(L, .9));
    s += tratto("M-21,-21 C-26,-28 -20,-34 -13,-31", "#7a4f05", 1.3) + tratto("M-21,-21 C-26,-28 -20,-34 -13,-31", "#f6cc4a", .7);
    [-1, 1].forEach(function (sg) { s += pth("M" + q(sg * 8, -11) + " C" + q(sg * 15, -17) + " " + q(sg * 20, -14) + " " + q(sg * 19, -8) + " C" + q(sg * 16, -8) + " " + q(sg * 12, -7) + " " + q(sg * 8, -5) + " Z", oro, bordo(L, .8)) + tratto("M" + q(sg * 10, -9) + " L" + q(sg * 17, -12), "#a8690a", .5, op(.7)); });   // le pinne delle orecchie
    // la nuca d'oro, con le squame accennate
    var capo = "M-10,-6 C-12,-16 -5,-21 1,-20 C8,-19 12,-13 11,-6 C10,0 5,3 0,3 C-6,3 -9,0 -10,-6 Z";
    s += pth(capo, oro, bordo(L, 1.3)) + dentro(capo, ell(-4, -14, 5, 2.4, "#ffffff", op(.35)) + tratto("M-8,-4 Q-4,-1 0,-4 Q4,-1 8,-4 M-7,-10 Q-3,-7 1,-10 Q5,-7 9,-10", "#a8690a", .6, op(.55)));
    // la cresta di fuoco al centro della nuca, che scende nella criniera
    [[0, -19, 1.2], [.4, -14.4, 1.05], [.6, -9.8, .95], [.6, -5.4, .85]].forEach(function (v) { var k = v[2]; s += pth("M" + q(v[0] - 2.4 * k, v[1] + 2 * k) + " L" + q(v[0] + 1.4 * k, v[1] - 4 * k) + " L" + q(v[0] + 2.6 * k, v[1] + 2.2 * k) + " Z", nuova(FUOCO, 0, 0, 1, 1), bordo(L, .6)); });
    // il collare della criniera che copre l'attacco del collo
    s += pth("M-12,-1 C-16,6 -12,14 -5,15 C-7,10 -4,8 0,8 C1,13 7,16 12,13 C8,10 11,4 11,-1 C6,4 -6,5 -12,-1 Z", nuova(FUOCO, 0, 0, 1, 1), bordo(L, 1));
    s += tratto("M-8,2 C-10,7 -9,11 -6,13 M5,4 C7,8 8,11 10,12", "#ffd8a8", .7, op(.75));
    // le corna: spuntano dalla cima della testa e vanno indietro, verso di noi
    s += cornoD(-6, -13, 1.05, true) + cornoD(3, -12, 1.15, false);
    return s;
  }
  // ---------- le insegne al neon (da parete, 62 × 200; in alto sul muro, sopra le macchine) ----------
  function trasla(d, dx, dy, k, ky) {   // un tracciato spostato e ingrandito (solo M, L, C, Q, Z; ky = un altro ingrandimento in altezza)
    return d.replace(/([MLCQZ])([^MLCQZ]*)/g, function (_, c, nn) {
      var v = nn.trim() ? nn.trim().split(/[\s,]+/).map(Number) : [];
      return c + v.map(function (n, i) { return f1(i % 2 ? dy + n * (ky || k) : dx + n * k); }).join(" ") + " ";
    });
  }
  function neon(d, c, w) {   // il tubo acceso: l'alone largo, il colore, l'anima bianca (di notte l'alone è più grande)
    w = w || 1.5;
    return tratto(d, c, w * (NOTTE ? 6.4 : 4), op(NOTTE ? .2 : .12)) + tratto(d, c, w * (NOTTE ? 3.2 : 2.3), op(NOTTE ? .42 : .3)) + tratto(d, chiaro(c, NOTTE ? .3 : .12), w) + tratto(d, "#ffffff", w * .36, op(NOTTE ? .95 : .75));
  }
  function tabella(x, y, w, h, r, viti) {   // il pannello nero lucido dove stanno i tubi, con l'ombra sul muro e le viti cromate
    var d = rq(x, y, w, h, r), o = ombraD(d, 2.2, 3);
    o += pth(d, nuova([[0, "#2b2733"], [.5, "#14121a"], [1, "#0a090d"]], 0, 0, 1, 1), bordo(L, 1.3)) + pth(rq(x + 1.2, y + 1.2, w - 2.4, h - 2.4, Math.max(.5, r - 1)), "none", "stroke='#4a4458' stroke-width='.6'");
    o += poly([[x + w * .08, y + 1], [x + w * .3, y + 1], [x + w * .12, y + h - 1], [x - w * .05, y + h - 1]], "#ffffff", op(.05));
    if (viti !== false) [[x + 3.4, y + 3.4], [x + w - 3.4, y + 3.4], [x + 3.4, y + h - 3.4], [x + w - 3.4, y + h - 3.4]].forEach(function (v) { o += cer(v[0], v[1], 1.2, nuovaR(CROMO, .35, .3, .8), bordo(L, .35)); });
    return o;
  }
  function tondo(cx, cy, r) {   // il pannello tondo
    var d = ellD(cx, cy, r, r), o = ombraD(d, 2.2, 3);
    return o + pth(d, nuovaR([[0, "#2b2733"], [.6, "#14121a"], [1, "#0a090d"]], .4, .35, .8), bordo(L, 1.3)) + pth(ellD(cx, cy, r - 1.3, r - 1.3), "none", "stroke='#4a4458' stroke-width='.6'") + cer(cx, cy - r + 3.4, 1.2, nuovaR(CROMO, .35, .3, .8), bordo(L, .35));
  }
  function stellinaN(x, y, k, c) { return neon("M" + q(x, y - k) + " L" + q(x + k * .3, y - k * .3) + " L" + q(x + k, y) + " L" + q(x + k * .3, y + k * .3) + " L" + q(x, y + k) + " L" + q(x - k * .3, y + k * .3) + " L" + q(x - k, y) + " L" + q(x - k * .3, y - k * .3) + " Z", c, .7); }

  // =========================================================
  //  INSEGNA AL NEON DEI TRE 7: il pannello nero con la cornice di neon viola, i tre 7 rossi di tubo col bordo, le stelline gialle
  // =========================================================
  def("neon_777", { tipo: "parete", nome: "Neon dei tre 7", luce: [31, 53, 74, "#ff4f6d"] }, function () {
    var s = tabella(4, 18, 54, 50, 5);
    s += neon(rq(7.4, 21.4, 47.2, 43.2, 3.4), "#b14dff", 1.2);
    [17.2, 31, 44.8].forEach(function (x, j) {
      var d = trasla("M-4.3,-4.9 L4.5,-4.9 L4.5,-2.7 C2.5,-.5 1.3,2.1 1,4.9 L-2.6,4.9 C-2.2,1.7 -.7,-.7 1.1,-2.3 L-4.3,-2.3 Z", x, 43.4 + (j === 1 ? -1.4 : 0), 1.42, 2.1);
      s += pth(d, "#ff4f6d", op(NOTTE ? .35 : .22)) + neon(d, "#ff2d55", 1.25);
    });
    s += stellinaN(11.6, 26.4, 2.2, "#ffe066") + stellinaN(50.4, 26.4, 2.2, "#ffe066") + stellinaN(31, 60.4, 2, "#ffe066");
    [14, 22, 40, 48].forEach(function (x) { s += cer(x, 60.4, .9, NOTTE ? "#fff3bf" : "#ffd43b") + (NOTTE ? cer(x, 60.4, 2.2, "#ffd43b", op(.35)) : ""); });
    return "<g transform='translate(0 7)'>" + s + "</g>";   // (un po' più in basso: le miniature mostrano la fascia del muro da 22 a 150)
  });

  // =========================================================
  //  INSEGNA AL NEON DEI DADI: il pannello nero con la cornice gialla, due dadi di neon (azzurro e rosa) che rotolano coi pallini
  // =========================================================
  def("neon_dadi", { tipo: "parete", nome: "Neon dei dadi", luce: [31, 53, 74, "#4dd9ff"] }, function () {
    var s = tabella(4, 18, 54, 52, 5);
    s += neon(rq(7.4, 21.4, 47.2, 45.2, 3.4), "#ffd43b", 1.1);
    function dado(cx, cy, l, rot, c, pal) {
      var o = "<g transform='translate(" + q(cx, cy) + ") rotate(" + f1(rot) + ")'>", h = l / 2, k = l * .27;
      o += rett(-h, -h, l, l, 2.6, c, op(NOTTE ? .22 : .14)) + neon(rq(-h, -h, l, l, 2.6), c, 1.2);
      pal.forEach(function (v) { o += cer(v[0] * k, v[1] * k, 1.25, chiaro(c, .5)) + cer(v[0] * k, v[1] * k, 2.6, c, op(NOTTE ? .4 : .25)) + cer(v[0] * k, v[1] * k, .5, "#ffffff"); });
      return o + "</g>";
    }
    s += dado(22, 39, 17, -14, "#4dd9ff", [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]]) + dado(40.4, 52, 15, 18, "#ff4fd8", [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]]);
    s += neon("M" + q(10.6, 58) + " Q" + q(14, 63) + " " + q(22, 63.2), "#ffffff", .6) + neon("M" + q(46, 27) + " Q" + q(50.4, 28) + " " + q(51.4, 33), "#ffffff", .6);   // le righe del movimento
    s += stellinaN(50.6, 63, 1.8, "#ffd43b") + stellinaN(12, 27.6, 1.6, "#ffd43b");
    return "<g transform='translate(0 7)'>" + s + "</g>";   // (un po' più in basso: le miniature mostrano la fascia del muro da 22 a 150)
  });

  // =========================================================
  //  INSEGNA AL NEON DEI SEMI DELLE CARTE: il pannello nero con la cornice d'oro, cuori e quadri rossi, picche azzurre, fiori verdi
  // =========================================================
  def("neon_carte", { tipo: "parete", nome: "Neon dei semi delle carte", luce: [31, 53, 74, "#ff6bd5"] }, function () {
    var s = tabella(4, 18, 54, 52, 5);
    s += neon(rq(7.4, 21.4, 47.2, 45.2, 3.4), "#ffc94d", 1.1);
    var SEMI = {
      cuori: "M0,4.6 C-1.6,3 -5,1 -5,-1.6 C-5,-3.6 -3.6,-4.8 -2.3,-4.8 C-1.2,-4.8 -.4,-4.1 0,-3.1 C.4,-4.1 1.2,-4.8 2.3,-4.8 C3.6,-4.8 5,-3.6 5,-1.6 C5,1 1.6,3 0,4.6 Z",
      quadri: "M0,-5 L3.7,0 L0,5 L-3.7,0 Z",
      picche: "M0,-5 C1.4,-3 4.8,-1.2 4.8,1.4 C4.8,3 3.6,3.9 2.4,3.9 C1.5,3.9 .8,3.4 .5,2.8 C.6,3.9 1.1,4.6 1.8,5 L-1.8,5 C-1.1,4.6 -.6,3.9 -.5,2.8 C-.8,3.4 -1.5,3.9 -2.4,3.9 C-3.6,3.9 -4.8,3 -4.8,1.4 C-4.8,-1.2 -1.4,-3 0,-5 Z",
      fiori: "M-.6,1.2 C-1.8,3 -4.6,2.6 -4.6,.4 C-4.6,-1.4 -2.6,-2.2 -1.4,-1.2 C-2.6,-2.6 -1.8,-5 0,-5 C1.8,-5 2.6,-2.6 1.4,-1.2 C2.6,-2.2 4.6,-1.4 4.6,.4 C4.6,2.6 1.8,3 .6,1.2 C.7,3 1.2,4.3 2,5 L-2,5 C-1.2,4.3 -.7,3 -.6,1.2 Z"
    };
    [["cuori", 20, 34, "#ff2d55"], ["picche", 42, 34, "#4dd9ff"], ["quadri", 20, 55, "#ff6b3d"], ["fiori", 42, 55, "#3ddc84"]].forEach(function (v) {
      var d = trasla(SEMI[v[0]], v[1], v[2], 1.75);
      s += pth(d, v[3], op(NOTTE ? .3 : .2)) + neon(d, v[3], 1.15);
    });
    s += stellinaN(31, 44.6, 2, "#ffffff");
    return "<g transform='translate(0 7)'>" + s + "</g>";   // (un po' più in basso: le miniature mostrano la fascia del muro da 22 a 150)
  });

  // =========================================================
  //  INSEGNA AL NEON DELLE CILIEGIE: il pannello tondo con la cornice rosa, due grosse ciliegie rosse di tubo coi gambi e la
  //  foglia verdi, i luccichii gialli
  // =========================================================
  def("neon_ciliegie", { tipo: "parete", nome: "Neon delle ciliegie", luce: [31, 53, 74, "#ff4f4f"] }, function () {
    var s = tondo(31, 45, 27);
    s += neon(ellD(31, 45, 23.6, 23.6), "#ff5fb8", 1.2);
    var gambi = "M22,47 C23,38 28,30 34,26 M40,49 C39,41 37,33 34,26";
    s += neon(gambi, "#3ddc84", 1.1);
    var foglia = "M34,26 C37,21 44,21 46,24 C43,28 38,28 34,26 Z";
    s += pth(foglia, "#3ddc84", op(NOTTE ? .3 : .2)) + neon(foglia, "#3ddc84", 1) + neon("M35.4,25.6 C38.6,24.6 41.6,24.4 44.4,24.2", "#b2f2bb", .5);
    [[22, 53.4, 7.4], [40.6, 55.6, 7.4]].forEach(function (c) {
      var d = ellD(c[0], c[1], c[2], c[2] * .95);
      s += pth(d, "#ff2d2d", op(NOTTE ? .32 : .2)) + neon(d, "#ff2d2d", 1.25) + neon("M" + q(c[0] - 4.4, c[1] - 1.4) + " Q" + q(c[0] - 3.6, c[1] - 4.4) + " " + q(c[0] - .6, c[1] - 5), "#ffffff", .55);
    });
    s += stellinaN(13.4, 33, 2, "#ffe066") + stellinaN(49.6, 36, 1.6, "#ffe066") + stellinaN(31, 66, 1.5, "#ffe066");
    return "<g transform='translate(0 7)'>" + s + "</g>";   // (un po' più in basso: le miniature mostrano la fascia del muro da 22 a 150)
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
      if (d.azione) { o.azione = d.azione; o.seduta = d.seduta; }
      if (d.luce) { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      p = "cmac" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!(opz.notte && d.luce);
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; STIRA = null; }
      var defs = DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "";
      if (d.tipo === "parete") { var w = 62 * (d.largo || 1); return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + w + " 200' width='" + w + "' height='200'>" + defs + c + "</svg>"; }
      var m = misure(d);
      return "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + defs +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  };
  if (window.SGMobiliArte) window.SGMobiliArte.aggiungi(pacco);
})();

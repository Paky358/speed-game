/* =========================================================
   SPeeD GAME — L'ELETTRONICA E I GIOCHI DELLA CASA, VISTI DALL'ALTO
   Come il bagno (js/mobili-arte.js): una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Gli stessi oggetti della casa vista di lato (js/casa.js), con gli stessi nomi e prezzi:
   cabinato arcade, flipper, juke-box, biliardino, cassa con le luci (in piedi);
   computer, console coi giochi, giradischi, radio vintage (da appoggiare sopra un mobile).
   Il davanti guarda in basso a sinistra; con { dietro: true } lo stesso oggetto girato (si vede il retro).
   Con { notte: true } schermi, insegne e lucine sono accesi (il gioco poi scurisce la stanza e mette l'alone in "luce").
   Si aggiungono a SGMobiliArte con aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";

  // ---------- attrezzi (gli stessi del bagno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato (da dietro)
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function f2(n) { return Math.round(n * 1000) / 1000; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(k) { return "opacity='" + k + "'"; }
  function poly(a, fill, x) { return "<polygon points='" + pts(a) + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function pth(d, fill, x) { return "<path d='" + d + "' fill='" + fill + "'" + attr(x) + "/>"; }
  function cer(x, y, r, fill, x2) { return "<circle cx='" + f1(x) + "' cy='" + f1(y) + "' r='" + f1(r) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function ell(x, y, rx, ry, fill, x2) { return "<ellipse cx='" + f1(x) + "' cy='" + f1(y) + "' rx='" + f1(rx) + "' ry='" + f1(ry) + "' fill='" + fill + "'" + attr(x2) + "/>"; }
  function rett(x, y, w, h, r, fill, x2) { return "<rect x='" + f1(x) + "' y='" + f1(y) + "' width='" + f1(w) + "' height='" + f1(h) + "'" + (r ? " rx='" + f1(r) + "'" : "") + " fill='" + fill + "'" + attr(x2) + "/>"; }
  function bordo(c, w) { return "stroke='" + c + "' stroke-width='" + (w || 2.4) + "' stroke-linejoin='round' stroke-linecap='round'"; }
  function tratto(d, c, w, x) { return "<path d='" + d + "' fill='none' stroke='" + c + "' stroke-width='" + f1(w) + "' stroke-linecap='round' stroke-linejoin='round'" + attr(x) + "/>"; }
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
  function cromo(d, w) { return tratto(d, L, w + 2.4) + tratto(d, "#a7b2ba", w) + tratto(d, "#ffffff", Math.max(.7, w * .38), "opacity='.95' transform='translate(-.4 -.5)'"); }

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda
  // le forme tonde in pianta (come nel bagno): centro (ca, cb), mezza larghezza ra, mezza profondità rf davanti e rr dietro; e = 2 ovale, di più = più squadrata
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
  // il colore di una superficie con la normale n (nella vista: u, v, z) fatta del materiale m
  function tinta(c, n, m) {
    m = m || {};
    var B = dot(n, LUCE), t = B >= .5 ? (B - .5) / .3 * .2 : (B - .5) / .8 * .27;
    if (m.velluto) { var g = 1 - Math.max(0, dot(n, VISTA)); t = t * .8 + g * g * m.velluto - .07; }   // il velluto: chiaro dove la stoffa gira, cupo e pieno dove ti guarda
    var col = tono(c, t * (m.forza || 1));
    if (m.lucido) { var sp = Math.pow(Math.max(0, dot(n, MEZZO)), m.esp || 24) * m.lucido; if (sp > .01) col = mix(col, m.riflesso ? chiaro(c, m.riflesso) : "#fff8ec", Math.min(.85, sp)); }   // il lucido (pelle, legno laccato; il velluto ha un riflesso morbido del suo colore)
    return col;
  }

  // ---------- i pezzi tirati (il juke-box, la radio): una sezione tirata lungo un asse ----------
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
    function sp(w) { return w[0] * nn[0] + w[1] * nn[1]; }
    var area = 0, en = [];
    for (i = 0; i < n; i++) { var u1 = prof[i], u2 = prof[(i + 1) % n]; area += (u1[0] * u2[1] - u2[0] * u1[1]) / 61; }
    var sg = area > 0 ? 1 : -1, zb = Math.min.apply(null, prof.map(function (x) { return x[1]; }));
    function tv2(nrm, z) {   // la tinta, e più buio in basso (dove il pezzo tocca la base o il pavimento)
      var col = tinta(c, nrm, m), f = o.ao ? Math.max(0, 1 - (z - zb) / (o.aoH || 8)) : 0;
      return f > 0 ? mix(col, "#000000", o.ao * f * f) : col;
    }
    for (i = 0; i < n; i++) {   // la normale di ogni lato della sezione, nella vista
      var e1 = prof[i], e2 = prof[(i + 1) % n], dx = e2[0] - e1[0], dz = (e2[1] - e1[1]) / 61, l = Math.sqrt(dx * dx + dz * dz) || 1, mx = sg * dz / l, mz = -sg * dx / l;
      en.push(A ? [0, G * mx, mz] : [G * mx, 0, mz]);
    }
    var voci = [], vis = [], luMax = -2, kLuce = 0;
    for (i = 0; i < n; i++) {
      var ea = en[(i + n - 1) % n], eb = en[i], va = dot(ea, VISTA) > .001, vb = dot(eb, VISTA) > .001, s = sp(capV[i]);
      if (!va && !vb) continue;
      vis.push({ k: i, s: s });
      var zz = prof[i][1], nm = va && vb ? norma([ea[0] + eb[0], ea[1] + eb[1], ea[2] + eb[2]]) : (va ? ea : eb), lu = dot(nm, MEZZO);
      if (lu > luMax) { luMax = lu; kLuce = i; }
      if (va && vb && dot(ea, eb) < .8) {   // uno spigolo vivo: due colori nello stesso punto
        var prima = sp(capV[(i + n - 1) % n]) < s;
        voci.push({ s: s, c: [tv2(prima ? ea : eb, zz), tv2(prima ? eb : ea, zz)] });
      } else voci.push({ s: s, c: [tv2(va && vb ? norma([ea[0] + eb[0], ea[1] + eb[1], ea[2] + eb[2]]) : (va ? ea : eb), zz)] });
    }
    voci.sort(function (x, y) { return x.s - y.s; }); vis.sort(function (x, y) { return x.s - y.s; });
    var smin = 1e9, smax = -1e9; sil.forEach(function (w) { var v = sp(w); if (v < smin) smin = v; if (v > smax) smax = v; });
    var st = []; voci.forEach(function (v) { v.c.forEach(function (cc) { st.push([f2(Math.max(0, Math.min(1, (v.s - smin) / (smax - smin || 1)))), cc]); }); });
    if (!st.length) st = [[0, c], [1, c]];
    var r = pth(dSil, nuova(st, nn[0] * smin, nn[1] * smin, nn[0] * smax, nn[1] * smax, true));
    var xs = prof.map(function (x) { return x[0]; }), zs = prof.map(function (x) { return x[1]; }), x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs), z0 = Math.min.apply(null, zs), z1 = Math.max.apply(null, zs);
    var H = {   // gli aiuti per decorare: p3, la catena dei punti che si vedono, il tappo piatto
      p3: p3, tv: tv, tn: tn, prof: prof, sil: sil, capV: capV, kLuce: kLuce,
      luccica: function (k, a, b) {   // la riga di luce lucida lungo il pezzo, dove la luce batte di più (pelle, legno laccato)
        var pp = this.lungo(kLuce, t0 + (t1 - t0) * (a || .06), t0 + (t1 - t0) * (b || .94));
        return tratto(aperto(pp), "#ffffff", 1.3, op(k || .5)) + tratto(aperto(pp), "#ffffff", 3.2, op((k || .5) * .25));
      },
      vis: vis.map(function (v) { return v.k; }),
      sez: function (t, filtro) { return vis.filter(function (v) { return !filtro || filtro(prof[v.k]); }).map(function (v) { return p3(prof[v.k], t); }); },
      lungo: function (k, ta, tb) { return [p3(prof[k], ta == null ? t0 : ta), p3(prof[k], tb == null ? t1 : tb)]; },
      vicinoA: function (x, z) { var bi = 0, bd = 1e9; prof.forEach(function (w, j) { var d = Math.abs(w[0] - x) + Math.abs(w[1] - z) / 61; if (d < bd) { bd = d; bi = j; } }); return bi; }
    };
    if (o.fascia) r += dentro(dSil, o.fascia(H));
    // il tappo che si vede: piatto, un po' più chiaro in alto
    var ct = o.tappoCol || tinta(c, A ? [1, 0, 0] : [0, 1, 0], m);
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

  // ---------- le gambe ----------
  // una gamba squadrata e affusolata, centrata in (a, b): r0 = mezzo lato in alto, r1 in basso
  function zampa(a, b, r0, r1, z0, z1, c) {
    var col = tinte(c), u = G * a, v = G * b;
    var T = [Puv(u - r0, v + r0, z1), Puv(u + r0, v + r0, z1), Puv(u + r0, v - r0, z1)], B = [Puv(u - r1, v + r1, z0), Puv(u + r1, v + r1, z0), Puv(u + r1, v - r1, z0)];
    return poly([T[0], T[1], B[1], B[0]], col[1]) + poly([T[1], T[2], B[2], B[1]], col[2]) + tratto(linea(T[1], B[1]), L, .8, op(.6)) +
      tratto(linea([T[0][0] + 1, T[0][1] + 1], [B[0][0] + .8, B[0][1] - .5]), "#ffffff", .7, op(.45)) + poly([T[0], T[1], T[2], B[2], B[1], B[0]], "none", bordo(L, 1.3));
  }

  // ---------- le ombre a terra (stese sul pavimento, un po' spostate a destra: la luce viene da sinistra) ----------
  function aTerra(c) { return "<g transform='matrix(50 25 -50 25 0 0)'>" + c + "</g>"; }
  function ombraPianta(a0, a1, b0, b1, k, pad) {
    pad = pad == null ? .1 : pad;
    var cu = G * (a0 + a1) / 2 + .05, cv = G * (b0 + b1) / 2 - .01;
    return aTerra("<ellipse cx='" + f2(cu) + "' cy='" + f2(cv) + "' rx='" + f2((a1 - a0) / 2 + pad) + "' ry='" + f2((b1 - b0) / 2 + pad) + "' fill='" + rad("omp", [[0, "#000", .24], [.6, "#000", .16], [1, "#000", 0]], .5, .5, .5) + "'" + (k ? " " + op(k) : "") + "/>");
  }

  // ---------- il legno: venature col caso fisso, il lucido della vernice ----------
  function venature(W, H, c, seme, passo, nodi) {   // le venature lungo x in un rettangolo piatto W × H
    var r = rnd(seme), s = "", i, n = Math.max(2, Math.round(H / (passo || 3)));
    for (i = 0; i < n; i++) {
      var y = (i + .2 + r() * .6) * H / n, amp = .3 + r() * 1.1, fr = 1.5 + r() * 3, ph = r() * 6.28, d = "M.4," + f1(y + Math.sin(ph) * amp), x;
      for (x = 3; x < W - .6; x += 3) d += " L" + f1(x) + "," + f1(y + Math.sin(ph + x / W * fr * 3.14) * amp);
      d += " L" + f1(W - .4) + "," + f1(y + Math.sin(ph + fr * 3.14) * amp);   // (dentro la faccia: non sporge dai bordi)
      s += tratto(d, r() < .72 ? scuro(c, .28 + r() * .15) : chiaro(c, .22), .35 + r() * .45, op(f2(.28 + r() * .35)));
    }
    for (i = 0; i < (nodi || 0); i++) {
      var nx = W * (.15 + r() * .7), ny = H * (.25 + r() * .5), rw = 2.2 + r() * 2.4;
      s += ell(nx, ny, rw * 1.8, rw * .7, "none", "stroke='" + scuro(c, .3) + "' stroke-width='.45' opacity='.45'") + ell(nx, ny, rw * 1.1, rw * .4, "none", "stroke='" + scuro(c, .3) + "' stroke-width='.45' opacity='.5'") + ell(nx, ny, rw * .45, rw * .2, scuro(c, .35), op(.5));
    }
    return s;
  }
  function lucidoPiano(W, H, k) {   // il riflesso della vernice sul piano: una fascia larga e una riga sottile, in diagonale
    k = k || 1;
    return poly([[W * .16, 0], [W * .36, 0], [W * .2, H], [0, H]], "#ffffff", op(f2(.13 * k))) + poly([[W * .42, 0], [W * .46, 0], [W * .3, H], [W * .26, H]], "#ffffff", op(f2(.2 * k))) +
      rett(0, 0, W, H, 0, nuova([[0, "#fff", .14 * k], [.5, "#fff", 0]], 0, 0, 1, 1));
  }
  function facciaLegno(c, seme, passo) { return function (W, H) { return venature(W, H, c, seme, passo || 2.2); }; }

  // ---------- altri attrezzi per l'elettronica ----------
  var NOTTE = false;   // di notte: schermi, insegne e lucine accesi
  // un disegno piatto steso su un piano dritto: sul piano ad a fisso (X = b·61, verso il davanti; Y = −z),
  // sul piano a b fisso (X = a·61; Y = −z) e sul piano a z fisso (X = a·61; Y = b·61)
  function mat(m, c) { return "<g transform='matrix(" + m.map(function (v) { return Math.round(v * 10000) / 10000; }).join(" ") + ")'>" + c + "</g>"; }
  function suA(a, c) { return mat([-.8197 * G, .4098 * G, 0, 1, 50 * G * a, 25 * G * a], c); }
  function suB(b, c) { return mat([.8197 * G, .4098 * G, 0, 1, -50 * G * b, 25 * G * b], c); }
  function suZ(z, c) { return mat([.8197 * G, .4098 * G, -.8197 * G, .4098 * G, 0, -z], c); }
  // una lastra sagomata (i fianchi del cabinato): il contorno pr = [[b, z], ...] da a = x0 ad a = x1.
  // Si vedono i bordi girati verso chi guarda e la faccia vicina; o = { col, mat (i bordi), faccia (il colore della faccia), fuori (la a della faccia di fuori), arte (il disegno di fuori), dentro (il colore di dentro) }
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
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function perVicino(l) { return l.slice().sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }); }
  // i disegni a quadretti dei videogiochi di una volta
  var INVASORE = ["..X.....X..", "...X...X...", "..XXXXXXX..", ".XX.XXX.XX.", "XXXXXXXXXXX", "X.XXXXXXX.X", "X.X.....X.X", "...XX.XX..."];
  var ALIENO = [".X...X.", "..XXX..", ".XXXXX.", "XX.X.XX", "X.....X"];
  function quadretti(mappa, x, y, k, c) {
    var o = "", i, j;
    for (i = 0; i < mappa.length; i++) for (j = 0; j < mappa[i].length; j++) if (mappa[i][j] === "X") o += rett(x + j * k, y + i * k, k + .04, k + .04, 0, c);
    return o;
  }
  function stella(x, y, k, c, x2) {   // una stellina a quattro punte
    var a = k * .22;
    return pth("M" + f1(x) + "," + f1(y - k) + " Q" + f2(x + a) + "," + f2(y - a) + " " + f1(x + k) + "," + f1(y) + " Q" + f2(x + a) + "," + f2(y + a) + " " + f1(x) + "," + f1(y + k) +
      " Q" + f2(x - a) + "," + f2(y + a) + " " + f1(x - k) + "," + f1(y) + " Q" + f2(x - a) + "," + f2(y - a) + " " + f1(x) + "," + f1(y - k) + " Z", c, x2);
  }
  function rq(x, y, w, h, r) {   // un rettangolo con gli angoli tondi, come tracciato
    return "M" + f2(x + r) + "," + f2(y) + " H" + f2(x + w - r) + " Q" + f2(x + w) + "," + f2(y) + " " + f2(x + w) + "," + f2(y + r) + " V" + f2(y + h - r) + " Q" + f2(x + w) + "," + f2(y + h) + " " + f2(x + w - r) + "," + f2(y + h) +
      " H" + f2(x + r) + " Q" + f2(x) + "," + f2(y + h) + " " + f2(x) + "," + f2(y + h - r) + " V" + f2(y + r) + " Q" + f2(x) + "," + f2(y) + " " + f2(x + r) + "," + f2(y) + " Z";
  }
  // un pomello o un tasto tondo in piedi sul piano a z (r in mattonelle, h in unità): il fianco sfumato e il cappello
  function tasto(a, b, z, r, h, c, sotto) {
    var F = forma(a, b, r, r, r, 2), o = "";
    if (sotto) o += pth(chiuso(giro(F, z + .05, 1.35, 24)), sotto, bordo(L, .45));   // l'anello sotto
    o += corpo([giro(F, z, 1, 24), giro(F, z + h, 1, 24)], [[0, chiaro(c, .35)], [.5, c], [1, scuro(c, .35)]], .6);
    return o + pth(chiuso(giro(F, z + h, 1, 24)), nuovaR([[0, chiaro(c, .55)], [.65, c], [1, scuro(c, .12)]], .38, .35, .75), bordo(L, .45));
  }
  function pallina(c, r, col, k) {   // una pallina lucida (la leva, la biglia): c = il centro sullo schermo
    return cer(c[0], c[1], r, nuovaR([[0, chiaro(col, .65)], [.35, col], [1, scuro(col, .45)]], .35, .3, .8), bordo(L, k || .7)) + ell(c[0] - r * .32, c[1] - r * .38, r * .32, r * .2, "#ffffff", op(.85));
  }
  function cromo3() {   // il cromo per i blocchi: sopra, la faccia alla luce, quella in ombra
    return [nuova([[0, "#ffffff"], [1, "#c9d1d8"]], 0, 0, 1, 1), nuova([[0, "#f6f8fa"], [.45, "#c3cbd2"], [1, "#8d979f"]], 0, 0, 1, 0), nuova([[0, "#9aa4ac"], [1, "#5c666e"]], 0, 0, 1, 0)];
  }
  // una gamba squadrata da T = [a, b, z] (in alto) a F (il piede, anche spostato in fuori); r0 e r1 = mezzo lato in alto e in basso
  function gambaQ(T, F, r0, r1, c) {
    var col = tinte(c), ua = G * T[0], va = G * T[1], ub = G * F[0], vb = G * F[1];
    var t = [Puv(ua - r0, va + r0, T[2]), Puv(ua + r0, va + r0, T[2]), Puv(ua + r0, va - r0, T[2])], f = [Puv(ub - r1, vb + r1, F[2]), Puv(ub + r1, vb + r1, F[2]), Puv(ub + r1, vb - r1, F[2])];
    return poly([t[0], t[1], f[1], f[0]], col[1]) + poly([t[1], t[2], f[2], f[1]], col[2]) + tratto(linea(t[1], f[1]), L, .7, op(.6)) +
      tratto(linea([t[0][0] + .9, t[0][1] + .7], [f[0][0] + .8, f[0][1] - .4]), "#ffffff", .8, op(.7)) + poly([t[0], t[1], t[2], f[2], f[1], f[0]], "none", bordo(L, 1.2));
  }
  function faccia4(pp, fill, cont, lw) {   // una faccia piana (punti sullo schermo) col suo disegno dentro e il contorno
    var d = chiuso(pp);
    return pth(d, fill) + (cont ? dentro(d, cont) : "") + pth(d, "none", bordo(L, lw || 2));
  }

  // ---------- il registro ----------
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  CABINATO ARCADE: i fianchi viola sagomati col bordino giallo e la grafica (le strisce e l'alieno a quadretti),
  //  l'insegna gialla che si accende, lo schermo inclinato con gli alieni, la pulsantiera con la leva rossa e i tasti,
  //  la porticina delle monete; dietro il pannello con lo sportello, le prese d'aria e il filo
  // =========================================================
  def("arcade", { tipo: "piedi", nome: "Cabinato arcade", fp: [1, 1], box: [-43, -126, 42, 22], dietro: true, prezzo: 3600, luce: [0, .23, 76, 85, "#9db4ff"] }, function () {
    var A0 = -.32, A1 = .32, T = .03, I0 = A0 + T, I1 = A1 - T, B0 = -.44, ZT = 104, VI = "#6a40e0", GI = "#ffd43b";
    var PR = [[B0, 0], [.27, 0], [.27, 47], [.4, 52.5], [.4, 59], [.31, 63], [.17, 89.5], [.31, 93], [.31, ZT], [B0, ZT]];   // il fianco: (b, z)
    var xa = I0 * 61, xb = I1 * 61, Wi = xb - xa;   // la larghezza di dentro, piatta
    function zcp(b) { return 59.1 + (.395 - b) / .095 * 3.6; }   // l'altezza della pulsantiera inclinata
    var s = ombraPianta(A0, A1, B0, .4, 1, .05);
    function arte() {   // la grafica dei fianchi (X verso il davanti, Y = −z)
      var r = rett(-30, -106, 58, 108, 0, nuova([[0, "#7a58ee"], [.55, "#4f2fc2"], [1, "#25136b"]], .2, 0, .5, 1));
      r += quadretti(INVASORE, -21.3, -84.5, 1.6, "#160b40") + quadretti(INVASORE, -22, -85.2, 1.6, "#69db7c") + quadretti(["", "", "", "..X.....X.."], -22, -85.2, 1.6, "#d3f9d8");   // l'alieno, con l'ombra e gli occhi chiari
      [["#ffd43b", 0], ["#ff922b", 5.6], ["#f06595", 11.2]].forEach(function (c) {   // le tre strisce che corrono verso il davanti
        var d = "M-30," + f1(-24 + c[1]) + " C-12," + f1(-28 + c[1]) + " 0," + f1(-50 + c[1]) + " 30," + f1(-64 + c[1]);
        r += tratto(d, "#160b40", 5.4) + tratto(d, c[0], 3.8) + tratto(d, chiaro(c[0], .55), 1, "opacity='.75' transform='translate(0 -1)'");
      });
      r += stella(4, -97, 2.2, "#fff3bf") + stella(-8, -95, 1.3, "#ffffff", op(.9)) + stella(14, -100.5, 1, "#ffffff", op(.8)) + stella(-24, -42, 1.6, "#fff3bf", op(.9)) + stella(8, -24, 1.2, "#ffffff", op(.8)) + stella(-14, -11, 1.4, "#fff3bf", op(.85));
      r += rett(-6, -106, 9, 108, 0, nuova([[0, "#fff", 0], [.5, "#fff", .13], [1, "#fff", 0]], 0, 0, 1, 0)) + rett(5, -106, 3, 108, 0, nuova([[0, "#fff", 0], [.5, "#fff", .1], [1, "#fff", 0]], 0, 0, 1, 0));   // il lucido della vernice
      return r + rett(-30, -106, 58, 108, 0, nuova([[0, "#000", .04], [1, "#000", .3]], 0, 0, 0, 1));   // questa faccia sta dalla parte dell'ombra
    }
    function fianco(x0, x1, fuori) { return lastra(PR, x0, x1, { col: GI, mat: { lucido: .55, esp: 12 }, faccia: "#4a2db8", dentro: "#2a1a5c", fuori: fuori, arte: arte }); }
    function tetto() {
      var A = P(I0, B0, ZT), B = P(I1, B0, ZT), C = P(I1, .31, ZT), D = P(I0, .31, ZT), q4 = chiuso([A, B, C, D]);
      return pth(q4, nuova([[0, chiaro(VI, .34)], [1, chiaro(VI, .1)]], 0, 0, 1, 1)) + dentro(q4, poly([P(I0, -.1, ZT), P(I0, .05, ZT), P(I1, -.3, ZT), P(I1, -.45, ZT)], "#ffffff", op(.13))) + pth(q4, "none", bordo(L, 1));
    }
    function insegna() {   // l'insegna gialla col disegno della casa vista di lato: i due rombi arancioni e la barra
      var y0 = -103.5, y1 = -93.2, gx = xa + .7, gw = Wi - 1.4, gy = y0 + .9, gh = y1 - y0 - 1.8, cy = gy + gh / 2;
      var r = rett(xa, y0, Wi, y1 - y0, 0, "#17151f");
      r += rett(gx, gy, gw, gh, .3, NOTTE ? nuovaR([[0, "#fffef5"], [.45, "#fff08f"], [1, "#ffc61a"]], .5, .5, .65) : nuova([[0, "#ffe57a"], [.55, "#ffd43b"], [1, "#e9a400"]], 0, 0, 0, 1));
      [-1, 1].forEach(function (sg) {
        var cx = sg * Wi * .33;
        r += pth("M" + f1(cx) + "," + f1(cy - 3.3) + " L" + f1(cx + 2.8) + "," + f1(cy) + " L" + f1(cx) + "," + f1(cy + 3.3) + " L" + f1(cx - 2.8) + "," + f1(cy) + " Z", "#e8590c", "stroke='#9c3505' stroke-width='.5'") + cer(cx - .7, cy - 1, .55, "#ffd8a8");
      });
      r += rett(-7.5, cy - 1.6, 15, 3.2, 1.6, "#e8590c", "stroke='#9c3505' stroke-width='.5'") + rett(-6.4, cy - 1.05, 9, .7, .35, "#ffc078", op(.85));
      r += rett(gx, gy, gw, gh * .4, 0, nuova([[0, "#fff", NOTTE ? .45 : .35], [1, "#fff", 0]], 0, 0, 0, 1));
      return suB(.305, r);
    }
    function schermo() {   // lo schermo a tubo dentro la cornice di vetro nero, con gli alieni; di notte si accende forte
      var W = Wi, H = 27.4, sx = 5.2, sy = 3.4, sw = W - 10.4, sh = 20.2, rr = rnd(55), i, j;
      var r = rett(0, 0, W, H, 0, nuova([[0, "#2c2a37"], [1, "#0e0d13"]], 0, 0, 0, 1));
      r += pth(rq(sx - 1.4, sy - 1.4, sw + 2.8, sh + 2.8, 2.6), "none", "stroke='#5f4bb6' stroke-width='.6'") + stella(2.6, 2.4, 1, "#7a58ee") + stella(W - 2.6, 2.4, 1, "#7a58ee") + stella(2.6, H - 2.4, 1, "#7a58ee") + stella(W - 2.6, H - 2.4, 1, "#7a58ee");
      var sc = rq(sx, sy, sw, sh, 2.2);
      var g = rett(sx, sy, sw, sh, 0, NOTTE ? nuovaR([[0, "#2a4cb0"], [.65, "#10205e"], [1, "#060b2a"]], .5, .5, .72) : nuovaR([[0, "#1d3470"], [.65, "#0c173f"], [1, "#050a1e"]], .5, .5, .72));
      for (i = 0; i < 20; i++) g += rett(sx + rr() * sw, sy + rr() * sh * .85, .32, .32, 0, "#ffffff", op(f2(.3 + rr() * .5)));
      var cols = ["#f783ac", "#66d9e8", "#8ce99a"];
      for (i = 0; i < 3; i++) for (j = 0; j < 5; j++) g += quadretti(ALIENO, sx + 2.6 + j * 3.75 + (i % 2) * .6, sy + 2.2 + i * 2.7, .33, NOTTE ? chiaro(cols[i], .3) : cols[i]);
      [0, 1, 2].forEach(function (k) { var bx = sx + 2.6 + k * 6.9; g += pth("M" + f1(bx) + "," + f1(sy + sh - 3.6) + " v-1.5 q0,-1.1 1.3,-1.1 h1.8 q1.3,0 1.3,1.1 v1.5 h-1.1 v-.7 q0,-.6 -.6,-.6 h-.8 q-.6,0 -.6,.6 v.7 Z", "#51cf66"); });   // i bunker
      var cx = sx + sw * .56;
      g += pth("M" + f1(cx - 1.4) + "," + f1(sy + sh - 1.2) + " h2.8 v-.9 h-.9 v-.5 h-.5 v-.5 h-.4 v.5 h-.5 v.5 h-.5 Z", "#ffd43b") + rett(cx - .15, sy + sh - 8.6, .3, 1.6, 0, "#ffffff");   // il cannone e il colpo
      g += stella(sx + sw * .3, sy + 9.6, .9, "#ffec99") + rett(sx + 1, sy + .6, 3, .5, 0, "#ffffff", op(.8)) + rett(sx + sw - 4, sy + .6, 3, .5, 0, "#ffffff", op(.8));   // lo scoppio e i punti
      for (i = sy; i < sy + sh; i += .7) g += rett(sx, i, sw, .24, 0, "#000", op(.2));   // le righe del tubo
      g += rett(sx, sy, sw, sh, 0, nuovaR([[0, "#9db4ff", NOTTE ? .3 : .1], [1, "#9db4ff", 0]], .5, .5, .6));
      g += poly([[sx + sw * .06, sy], [sx + sw * .3, sy], [sx + sw * .1, sy + sh], [sx - sw * .14, sy + sh]], "#ffffff", op(NOTTE ? .06 : .13)) + rett(sx, sy, sw, sh * .3, 0, nuova([[0, "#fff", NOTTE ? .08 : .14], [1, "#fff", 0]], 0, 0, 0, 1));
      r += dentro(sc, g) + pth(sc, "none", "stroke='#05050a' stroke-width='.8'");
      if (NOTTE) r += pth(rq(sx - .9, sy - .9, sw + 1.8, sh + 1.8, 3), "none", "stroke='#b8c8ff' stroke-width='1.4' opacity='.5'") + pth(rq(sx - 2, sy - 2, sw + 4, sh + 4, 3.6), "none", "stroke='#9db4ff' stroke-width='1.6' opacity='.22'");   // il bagliore dello schermo acceso
      r += poly([[W * .55, 0], [W * .68, 0], [W * .52, H], [W * .39, H]], "#ffffff", op(.05));   // il riflesso sul vetro della cornice
      return piano(P(I0, .165, 89.3), P(I1, .165, 89.3), P(I0, .3, 62.7), W, H, r);
    }
    function pulsantiera() {   // il piano inclinato coi colori del cabinato e il davanti col bordino giallo
      var W = Wi, H = 6.4, r = rett(0, 0, W, H, 0, nuova([[0, "#40444d"], [1, "#24272d"]], 0, 0, 0, 1));
      r += rett(0, .4, W, .8, 0, "#7a58ee") + rett(0, H - 1.3, W, .9, 0, "#7a58ee") + stella(W * .5, H * .5, .9, "#ffd43b", op(.8));
      if (NOTTE) r += rett(0, 0, W, H, 0, nuova([[0, "#b8c8ff", .5], [1, "#b8c8ff", .08]], 0, 0, 0, 1));   // la luce dello schermo sulla pulsantiera
      var o = piano(P(I0, .3, 62.7), P(I1, .3, 62.7), P(I0, .395, 59.1), W, H, r);
      var f = rett(xa, -59.1, Wi, 6.5, 0, nuova([[0, chiaro(VI, .15)], [1, scuro(VI, .15)]], 0, 0, 0, 1)) + rett(xa, -59.1, Wi, 1.3, 0, GI) + rett(xa, -59.1, Wi, .4, 0, "#fff3bf");
      return suB(.395, f) + o;
    }
    function comandi() {   // la leva rossa e i tasti, dal più lontano al più vicino
      var l = [[-.14, .35, "leva"], [.02, .355, "#ffd43b"], [.1, .345, "#4dabf7"], [.18, .355, "#69db7c"], [-.03, .316, "#f1f3f5"], [.05, .316, "#f1f3f5"]];
      return perVicino(l).map(function (t) {
        var a = t[0], b = t[1], z = zcp(b);
        if (t[2] === "leva") {
          var F = forma(a, b, .011, .011, .011, 2), c = P(a, b, z + 7.6);
          return pth(chiuso(giro(forma(a, b, .03, .03, .03, 2), z + .15, 1, 24)), "#141418", bordo(L, .5)) + corpo([giro(F, z, 1, 16), giro(F, z + 6.4, 1, 16)], CROMO, .6) + pallina(c, 2.4, "#f03e3e");
        }
        var pic = t[2] === "#f1f3f5", col = NOTTE && !pic ? chiaro(t[2], .25) : t[2];
        return tasto(a, b, z, pic ? .014 : .024, pic ? .8 : 1.3, col, "#1b1b22");
      }).join("");
    }
    function pancia() {   // il davanti di sotto: il viola, lo zoccolo e la porticina delle monete con le bocchette rosse
      var r = rett(xa, -47.2, Wi, 47.2, 0, nuova([[0, chiaro(VI, .14)], [1, scuro(VI, .1)]], 0, 0, 0, 1));
      r += rett(xa, -47.2, Wi, 1.4, 0, "#000", op(.3));   // l'ombra sotto la pulsantiera
      r += rett(xa, -3.4, Wi, 3.4, 0, "#1d1d24") + rett(xa, -3.4, Wi, .5, 0, "#868e96");   // lo zoccolo nero col filo d'alluminio
      r += rett(-7.4, -38.6, 14.8, 22.6, 1, nuova([[0, "#8a939c"], [.5, "#5c656e"], [1, "#3a4047"]], 0, 0, 1, 1), bordo(L, .8)) + rett(-6.5, -37.7, 13, 20.8, .6, "none", "stroke='#d0d6db' stroke-width='.45'");
      [-3.2, 3.2].forEach(function (x) {
        r += rett(x - 1.6, -35.6, 3.2, 7.6, .6, NOTTE ? nuovaR([[0, "#ffe3e3"], [.5, "#ff6b6b"], [1, "#c92a2a"]], .5, .45, .7) : nuova([[0, "#ff6b6b"], [1, "#b02525"]], 0, 0, 0, 1), "stroke='#4a0d0d' stroke-width='.5'");
        r += rett(x - .25, -34.3, .5, 3.4, .25, "#2a0808") + pth("M" + f1(x - .9) + ",-29.6 L" + f1(x + .9) + ",-29.6 L" + f1(x) + ",-28.6 Z", "#ffe3e3", op(.9));   // la fessura e la freccina
        r += rett(x - 1.4, -25.4, 2.8, 2.1, .4, "#24282d", "stroke='#9aa3ab' stroke-width='.35'");   // il resto
      });
      r += cer(0, -20.2, 1.15, nuovaR(CROMO, .35, .3, .8), bordo(L, .45)) + rett(-.15, -20.9, .3, 1.2, 0, "#3d4349");   // la serratura
      return suB(.262, r);
    }
    function schiena() {   // il pannello di dietro: lo sportello con la serratura, le prese d'aria, l'etichetta
      var r = rett(xa, -ZT, Wi, ZT, 0, nuova([[0, "#584b78"], [1, "#2f2645"]], 0, 0, 0, 1)), y;
      r += rett(-12.5, -88, 25, 48, 1.2, "none", "stroke='#120e1c' stroke-width='1'") + rett(-12, -87.5, 24, 47, 1, "none", "stroke='#62577c' stroke-width='.5'") + cer(9.5, -64, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4));
      for (y = -100.5; y < -93; y += 1.8) r += rett(-11, y, 22, .8, .4, "#0f0b18");
      for (y = -35; y < -14; y += 1.8) r += rett(4, y, 9, .8, .4, "#0f0b18");
      r += rett(-13, -33, 10, 6.5, .5, "#f1ece2") + rett(-12, -31.8, 5, .6, 0, "#868e96") + rett(-12, -30.4, 8, .5, 0, "#adb5bd") + rett(-12, -29.2, 6.5, .5, 0, "#adb5bd");
      return suB(B0 + .004, r) + tratto("M" + q(P(.12, B0 + .004, 7)) + " C" + q(P(.13, B0 - .03, 1)) + " " + q(P(.18, B0 - .04, 0)) + " " + q(P(.26, -.49, 0)), "#16161a", 1.6) + (function () { var m = P(.27, -.495, 0); return ell(m[0], m[1] - .6, 2.2, 1.3, "#2b2b30", bordo(L, .6)); })();
    }
    if (G > 0) s += fianco(A0, I0, A0) + tetto() + insegna() + schermo() + pancia() + pulsantiera() + comandi() + fianco(I1, A1, A1);
    else s += fianco(I1, A1, A1) + tetto() + schiena() + fianco(A0, I0, A0);
    return s;
  });

  // =========================================================
  //  FLIPPER: il mobile blu notte coi fianchi decorati (la cometa e le stelle) sulle gambe cromate; sotto il vetro il piano di gioco
  //  (il pianeta, i funghi colorati, le palette, le frecce che si accendono, la biglia d'acciaio); la testata con la grafica
  //  spaziale e il tabellone arancione a puntini; dietro il pannello della testata con le prese d'aria e il filo
  // =========================================================
  function razzo(x, y, ang) {   // un razzo argentato con l'oblò, le alette rosse e la fiammata
    return "<g transform='translate(" + f1(x) + " " + f1(y) + ") rotate(" + ang + ")'>" + pth("M-1.4,4.5 Q0,10 1.4,4.5 Z", "#ffd43b") + pth("M-.7,4.5 Q0,7.5 .7,4.5 Z", "#fff9db") +
      pth("M-2.5,4.7 L-1.6,1.4 L-1.6,4.7 Z M2.5,4.7 L1.6,1.4 L1.6,4.7 Z", "#e03131", "stroke='#5c0f0f' stroke-width='.3'") +
      pth("M0,-5 Q2,-2.4 1.7,4.6 L-1.7,4.6 Q-2,-2.4 0,-5 Z", nuova([[0, "#ffffff"], [1, "#adb5bd"]], 0, 0, 1, 0), "stroke='#3d2b22' stroke-width='.35'") +
      pth("M0,-5 Q1.2,-3.6 1.25,-2.8 L-1.25,-2.8 Q-1.2,-3.6 0,-5 Z", "#e03131") + cer(0, -.6, .8, "#74c0fc", "stroke='#3d2b22' stroke-width='.3'") + "</g>";
  }
  def("flipper", { tipo: "piedi", nome: "Flipper", fp: [1, 1], box: [-41, -126, 41, 21], dietro: true, prezzo: 3200, luce: [0, -.22, 86, 75, "#f78fd0"] }, function () {
    var A0 = -.28, A1 = .28, B0 = -.46, B1 = .44, BB = -.22, ZB = 41, ZH = 104, R = .03, PA0 = A0 + R, PA1 = A1 - R, BF = B1 - .05;
    function zt(b) { return b <= BB ? 64 : 64 - (b - BB) / (B1 - BB) * 7; }   // il bordo di sopra: in piano sotto la testata, poi scende verso chi gioca
    function zf(b) { return zt(b) - 2.2; }   // il piano di gioco, sotto il vetro
    var CW = 50, CH = 62;   // il piano di gioco disegnato piatto: x da sinistra a destra, y dal fondo verso chi gioca
    var s = ombraPianta(A0, A1, B0, B1, .85, .06);
    s += perVicino([[-.235, -.41], [.235, -.41], [-.235, .39], [.235, .39]]).map(function (g) {   // le gambe cromate, un po' aperte, coi piedini
      var sa = g[0] < 0 ? -1 : 1, sb = g[1] < 0 ? -1 : 1, fa = g[0] + .035 * sa, fb = g[1] + .03 * sb, m = P(fa, fb, 0);
      return gambaQ([g[0], g[1], ZB], [fa, fb, 1.6], .03, .023, cromo3()) + ell(m[0], m[1] - .7, 2.6, 1.4, "#2b2b30", bordo(L, .7));
    }).join("");
    var LATO = [[B0, ZB], [B1, ZB], [B1, zt(B1)], [BB, zt(BB)], [B0, zt(B0)]];
    function arteLato() {   // il fianco blu notte: la cometa che corre verso chi gioca, le stelle, il tasto della paletta (X verso il davanti, Y = −z)
      var r = rett(-30, -66, 60, 27, 0, nuova([[0, "#30449a"], [1, "#131d4c"]], 0, 0, 0, 1)), rr = rnd(7), i;
      for (i = 0; i < 16; i++) r += stella(-28 + rr() * 54, -63 + rr() * 20, .4 + rr() * .7, "#ffffff", op(f2(.4 + rr() * .5)));
      [["#f06595", 3.2, 4], ["#ff922b", 0, 3], ["#ffd43b", -2.6, 2.2]].forEach(function (k) {   // la coda della cometa: tre fiamme che si assottigliano
        var y = -51 + k[1], w = k[2];
        r += pth("M16," + f1(y - w / 2) + " Q-6," + f1(y - w * .8 + 2) + " -30," + f1(y + 4) + " Q-6," + f1(y + w * .5 + 2) + " 16," + f1(y + w / 2) + " Z", k[0], "stroke='#0d1333' stroke-width='.6'");
      });
      r += cer(17, -51, 3.6, nuovaR([[0, "#ffffff"], [.5, "#fff3bf"], [1, "#ffd43b"]], .4, .4, .7), "stroke='#0d1333' stroke-width='.6'") + stella(17, -51, 4.6, "#ffffff", op(.85));   // la testa della cometa
      r += cer(21.4, -51.6, 1.7, nuovaR(CROMO, .35, .3, .8), "stroke='#0d1333' stroke-width='.4'") + cer(21.4, -51.6, 1.1, NOTTE ? "#ff8787" : "#e03131");   // il tasto della paletta
      [[61 * (B1 - .05), -44.5], [61 * (B0 + .05), -44.5]].forEach(function (v) { r += rett(v[0] - 1.6, v[1] - 1.6, 3.2, 3.2, .3, nuovaR(CROMO, .35, .3, .8), "stroke='#0d1333' stroke-width='.3'"); });   // le piastre delle gambe
      return r + tratto("M" + f1(61 * B0) + ",-" + f1(zt(B0) - .7) + " L" + f1(61 * BB) + ",-" + f1(zt(BB) - .7) + " L" + f1(61 * B1) + ",-" + f1(zt(B1) - .7), "#c3cbd2", 1.2) + rett(-30, -66, 60, 27, 0, "#000", op(.12));
    }
    function lato(a) { return faccia4(LATO.map(function (x) { return P(a, x[0], x[1]); }), "#1d2b66", suA(a, arteLato()), 2.2); }
    function testaMobile(b, cont) { var z1 = zt(b); return faccia4([P(A0, b, ZB), P(A1, b, ZB), P(A1, b, z1), P(A0, b, z1)], "#24346f", suB(b, cont), 2.2); }
    function davantiMobile() {   // il davanti: la porticina delle monete, il tasto di partenza, il buco della molla
      var r = rett(-18, -58, 36, 18, 0, nuova([[0, "#3a4fa6"], [1, "#1c285e"]], 0, 0, 0, 1));
      r += rett(-5.2, -54.2, 10.4, 11.2, .8, nuova([[0, "#8a939c"], [1, "#454c54"]], 0, 0, 1, 1), bordo(L, .6));
      [-2.3, 2.3].forEach(function (x) { r += rett(x - 1.1, -52.8, 2.2, 4.6, .4, NOTTE ? "#ffc9c9" : "#e03131", "stroke='#4a0d0d' stroke-width='.4'") + rett(x - .2, -52.2, .4, 2.6, .2, "#2a0808"); });
      r += cer(-12.5, -53.4, 1.7, nuovaR([[0, "#ffd8a8"], [.5, "#fd7e14"], [1, "#a8440a"]], .35, .3, .8), bordo(L, .5));
      return r + cer(12.5, -51.5, 1.9, nuovaR(CROMO, .35, .3, .8), bordo(L, .5)) + cer(12.5, -51.5, .8, "#2b2f36");
    }
    function dietroMobile() {
      var r = rett(-18, -65, 36, 25, 0, nuova([[0, "#2c3d86"], [1, "#151f4d"]], 0, 0, 0, 1)), y;
      for (y = -60; y < -48; y += 1.8) r += rett(-9, y, 18, .8, .4, "#0b1030");
      return r + rett(-14.5, -47.5, 7.5, 4.4, .4, "#f1ece2") + rett(-13.6, -46.4, 3.8, .5, 0, "#868e96") + rett(-13.6, -45.2, 5.4, .4, 0, "#adb5bd");
    }
    function paletta(x, y, sg) {   // una paletta bianca con la gomma rossa, che scende verso il centro
      var d = "M" + f1(x) + "," + f1(y - 1.3) + " L" + f1(x + sg * 7) + "," + f1(y + 2.1) + " Q" + f1(x + sg * 7.7) + "," + f1(y + 2.9) + " " + f1(x + sg * 6.6) + "," + f1(y + 3.2) + " L" + f1(x) + "," + f1(y + 1.3) + " Q" + f1(x - sg * 1.5) + "," + f1(y) + " " + f1(x) + "," + f1(y - 1.3) + " Z";
      return pth(d, "#000", "opacity='.3' transform='translate(.5 .9)'") + pth(d, "#f8f9fa", "stroke='#e03131' stroke-width='.7'") + cer(x, y, .55, "#868e96");
    }
    function campo() {   // il piano di gioco visto da sopra (CW × CH)
      var r = rett(0, 0, CW, CH, 0, nuova([[0, "#2f6fe0"], [.55, "#1d55c4"], [1, "#163f99"]], 0, 0, 0, 1)), rr = rnd(91), i;
      for (i = 0; i < 46; i++) r += cer(rr() * CW, rr() * CH * .85, .22 + rr() * .3, "#ffffff", op(f2(.25 + rr() * .5)));
      r += cer(25, 19, 9.5, nuovaR([[0, "#d0bfff"], [.55, "#7950f2"], [1, "#3b1f8f"]], .35, .3, .8)) + ell(25, 19, 14.5, 3.2, "none", "stroke='#ffd43b' stroke-width='1.1' opacity='.9' transform='rotate(-12 25 19)'");   // il pianeta con l'anello
      [11, 20, 30, 39].forEach(function (x) { r += rett(x - .55, 1.5, 1.1, 7.5, .55, "#f1f3f5", "stroke='#495057' stroke-width='.25'"); });   // le corsie in alto
      [15.5, 25, 34.5].forEach(function (x) { r += cer(x, 5.5, 1.3, NOTTE ? "#fff8db" : "#ffd43b", "stroke='#8a6100' stroke-width='.3'"); });
      [["#ff6b6b", 35], ["#ffa94d", 39.4], ["#ffd43b", 43.8]].forEach(function (k) { var y = k[1]; r += pth("M25," + f1(y - 2.4) + " L27.8," + f1(y + .4) + " L26.3," + f1(y + .4) + " L26.3," + f1(y + 1.8) + " L23.7," + f1(y + 1.8) + " L23.7," + f1(y + .4) + " L22.2," + f1(y + .4) + " Z", NOTTE ? chiaro(k[0], .45) : k[0], "stroke='#ffffff' stroke-width='.35'"); });   // le frecce che si accendono
      ["#ff8787", "#ffd43b", "#74c0fc"].forEach(function (c, j) { r += rett(2.6, 23 + j * 3.3, 2.8, 2.3, .3, NOTTE ? chiaro(c, .3) : c, "stroke='#ffffff' stroke-width='.3'"); });   // i bersagli a sinistra
      r += tratto("M4.2,35 L4.2,49 L15.4,55.4", "#f1f3f5", 1.1) + tratto("M45.8,35 L45.8,49 L34.6,55.4", "#f1f3f5", 1.1) + tratto("M1.8,37 L1.8,52", "#f1f3f5", .9) + tratto("M48.3,11 L48.3,53", "#f1f3f5", .9);   // le guide e il corridoio della molla
      r += pth("M8.2,40.5 L8.2,48.4 L14,51.3 Z", NOTTE ? "#ff9b9b" : "#ff6b6b", "stroke='#ffffff' stroke-width='1'") + pth("M41.8,40.5 L41.8,48.4 L36,51.3 Z", NOTTE ? "#ff9b9b" : "#ff6b6b", "stroke='#ffffff' stroke-width='1'");   // le fionde
      r += paletta(16.6, 53.4, 1) + paletta(33.4, 53.4, -1);
      r += pth("M0,57.6 L16.5,57.6 Q25,61.2 33.5,57.6 L50,57.6 L50,62 L0,62 Z", "#20263a") + rett(3, 58.7, 9, 2.6, .4, "#f8f9fa") + rett(38, 58.7, 9, 2.6, .4, "#f8f9fa") + rett(4, 59.5, 6, .35, 0, "#adb5bd") + rett(39, 59.5, 6, .35, 0, "#adb5bd");   // in fondo, le schede delle regole
      return r + rett(0, 0, CW, CH, 0, nuovaR([[0, "#fff4d6", NOTTE ? .32 : .12], [1, "#fff4d6", 0]], .5, .55, .62));   // le luci del piano
    }
    function cosePiano() {   // i funghi e la biglia, dal più lontano al più vicino
      return [[15, 16, "#ff6b6b"], [35, 16, "#ffd43b"], [25, 25.5, "#69db7c"], [31, 37, "biglia"]].map(function (k) {
        var a = PA0 + k[0] / CW * (PA1 - PA0), b = BB + k[1] / CH * (BF - BB); return { v: vicino(a, b), k: k, a: a, b: b };
      }).sort(function (x, y) { return x.v - y.v; }).map(function (e) {
        var a = e.a, b = e.b, z = zf(b), k = e.k;
        if (k[2] === "biglia") { var c = P(a, b, z + 1.3), o = P(a + .012, b + .004, z); return ell(o[0], o[1], 1.9, .8, "#000", op(.35)) + pallina(c, 1.35, "#ced4da", .5); }
        var F = forma(a, b, .042, .042, .042, 2), col = NOTTE ? chiaro(k[2], .3) : k[2], cc = P(a, b, z + 1.6);
        return pth(chiuso(giro(F, z + .15, 1.25, 28)), "#f1f3f5", bordo(L, .5)) + corpo([giro(F, z + .15, .74, 28), giro(F, z + 1.6, .74, 28)], [[0, chiaro(col, .3)], [1, scuro(col, .35)]], .5) +
          pth(chiuso(giro(F, z + 1.6, 1, 28)), nuovaR([[0, "#ffffff"], [.45, chiaro(col, .2)], [1, scuro(col, .2)]], .4, .35, .75), bordo(L, .5)) + stella(cc[0], cc[1], 1.2, "#ffffff", op(.85));
      }).join("");
    }
    function vetro() { return poly([[7, 0], [17, 0], [3, CH], [-7, CH]], "#ffffff", op(.12)) + poly([[22, 0], [25.5, 0], [11.5, CH], [8, CH]], "#ffffff", op(.17)) + rett(0, 0, CW, CH, 0, nuova([[0, "#e7f5ff", .16], [.5, "#e7f5ff", 0], [1, "#e7f5ff", .08]], 0, 0, 1, 1)); }
    function sopra() {   // il piano di gioco, i muretti di dentro, i funghi, il vetro, le sponde cromate e la barra davanti
      var aw = G > 0 ? PA0 : PA1, o = piano(P(PA0, BB, zf(BB)), P(PA1, BB, zf(BB)), P(PA0, BF, zf(BF)), CW, CH, campo());
      o += faccia4([P(aw, BB, zf(BB)), P(aw, BF, zf(BF)), P(aw, BF, zt(BF)), P(aw, BB, zt(BB))], "#141c45", "", .6);
      o += G > 0 ? faccia4([P(PA0, BB, zf(BB)), P(PA1, BB, zf(BB)), P(PA1, BB, zt(BB)), P(PA0, BB, zt(BB))], "#141c45", "", .6) : faccia4([P(PA0, BF, zf(BF)), P(PA1, BF, zf(BF)), P(PA1, BF, zt(BF)), P(PA0, BF, zt(BF))], "#141c45", "", .6);
      o += cosePiano() + piano(P(PA0, BB, zt(BB) - .2), P(PA1, BB, zt(BB) - .2), P(PA0, BF, zt(BF) - .2), CW, CH, vetro());
      [[A0, PA0], [PA1, A1]].forEach(function (x) { o += faccia4([P(x[0], BB, zt(BB)), P(x[1], BB, zt(BB)), P(x[1], B1, zt(B1)), P(x[0], B1, zt(B1))], nuova([[0, "#ffffff"], [.5, "#c3cbd2"], [1, "#8d979f"]], 0, 0, 1, 0), "", .9); });
      return o + blocco(A0 - .006, A1 + .006, BF, B1 + .006, zt(B1) - .4, zt(B1) + 1.1, cromo3(), null, 1.2);   // la barra davanti
    }
    function vetroTesta(W, H) {   // la grafica luminosa: il cielo rosa e viola, il pianeta giallo con l'anello, il razzo, le lucine; sotto il tabellone arancione
      var gx = 1.7, gy = 1.7, gw = W - 3.4, gh = H - 12.4, rr = rnd(23), i, j, r = rett(0, 0, W, H, 0, nuova([[0, "#2b2b36"], [1, "#101015"]], 0, 0, 0, 1));
      var a = rett(gx, gy, gw, gh, 0, NOTTE ? nuova([[0, "#ffc2e2"], [.5, "#dc8af7"], [1, "#9470ff"]], 0, 0, 0, 1) : nuova([[0, "#f783ac"], [.5, "#b45fe0"], [1, "#6a3fe0"]], 0, 0, 0, 1));
      for (i = 0; i < 22; i++) a += stella(gx + rr() * gw, gy + rr() * gh, .3 + rr() * .5, "#ffffff", op(f2(.5 + rr() * .5)));
      var px = gx + gw * .7, py = gy + gh * .4, giro2 = "transform='rotate(-16 " + f1(px) + " " + f1(py) + ")'";
      a += ell(px, py, 10, 2.5, "none", "stroke='#fff3bf' stroke-width='1.1' " + giro2) + cer(px, py, 5.6, nuovaR([[0, "#fff9db"], [.5, "#ffd43b"], [1, "#e8590c"]], .35, .3, .8), "stroke='#7a2e0a' stroke-width='.45'");
      a += "<path d='M" + f1(px - 10) + "," + f1(py) + " A10,2.5 0 0 0 " + f1(px + 10) + "," + f1(py) + "' fill='none' stroke='#fff3bf' stroke-width='1.1' " + giro2 + "/>";   // l'anello davanti al pianeta
      a += razzo(gx + gw * .27, gy + gh * .58, 36);
      for (i = 0; i < 5; i++) a += cer(gx + 3 + i * (gw - 6) / 4, i % 2 ? gy + 2.4 : gy + gh - 2.2, .95, NOTTE ? "#fffbe6" : "#fff3bf", "stroke='#7a5a00' stroke-width='.25'");   // le lucine (come nella casa vista di lato)
      a += rett(gx, gy, gw, gh * .35, 0, nuova([[0, "#fff", .28], [1, "#fff", 0]], 0, 0, 0, 1));
      r += dentro(rq(gx, gy, gw, gh, 1), a) + pth(rq(gx, gy, gw, gh, 1), "none", "stroke='#c3cbd2' stroke-width='.5'");
      var dx = gx + 2.2, dy = H - 9.6, dw = gw - 4.4, dh = 7.2, k = .62, nx = Math.floor((dw - 1) / k), dots = "";   // il tabellone a puntini arancioni
      r += rett(dx, dy, dw, dh, .6, "#0a0a0d", "stroke='#43434d' stroke-width='.5'");
      var rp = rnd(5);
      for (i = 0; i < nx; i++) {
        var spazio = i % 6 === 5 || i < 2 || i > nx - 3, colonna = rp() * 32 | 0;
        for (j = 0; j < 5; j++) dots += cer(dx + .9 + i * k, dy + 1.3 + j * 1.15, .24, !spazio && (colonna >> j & 1) ? (NOTTE ? "#ffc078" : "#ff8c1a") : "#3a1e08");
      }
      return r + dots;
    }
    function latoTesta(W, H) { return rett(0, 0, W, H, 0, nuova([[0, "#2a2a42"], [1, "#121220"]], 0, 0, 0, 1)) + rett(0, H * .3, W, 2.6, 0, "#f06595") + rett(0, H * .3 + 2.6, W, 1.6, 0, "#ff922b") + rett(0, H * .3 + 4.2, W, 1, 0, "#ffd43b") + rett(0, 0, W, .8, 0, "#c3cbd2"); }
    function retroTesta(W, H) {
      var r = rett(0, 0, W, H, 0, nuova([[0, "#3a3a52"], [1, "#1d1d2b"]], 0, 0, 0, 1)), y;
      for (y = 4; y < 12; y += 1.7) r += rett(W * .2, y, W * .6, .8, .4, "#0c0c14");
      return r + rett(W * .6, H * .55, 9, 6, .5, "#f1ece2") + rett(W * .6 + 1, H * .55 + 1.2, 4.5, .5, 0, "#868e96") + rett(W * .6 + 1, H * .55 + 2.4, 7, .4, 0, "#adb5bd") + cer(W / 2, H * .84, 1, nuovaR(CROMO, .35, .3, .8), bordo(L, .4));
    }
    var testata = blocco(A0, A1, B0, BB, zt(B0), ZH, ["#2e2e3c", "#22222c", "#16161d"], { davanti: vetroTesta, dietro: retroTesta, fianco: latoTesta }, 2.2);
    if (G > 0) {
      s += testata + testaMobile(B1, davantiMobile()) + lato(A1) + sopra();
      s += cromo(linea(P(.205, B1, 51.5), P(.205, B1 + .05, 51.5)), 1.1) + pallina(P(.205, B1 + .066, 51.5), 1.8, "#e03131");   // la molla per lanciare la biglia
    } else {
      s += testaMobile(B0, dietroMobile()) + tratto("M" + q(P(.1, B0, 45)) + " C" + q(P(.1, B0 - .02, 20)) + " " + q(P(.12, B0 - .02, 1)) + " " + q(P(.2, -.49, 0)), "#16161a", 1.6);   // il filo
      s += lato(A0) + sopra() + testata;
    }
    return s;
  });

  // =========================================================
  //  JUKE-BOX: il mobile di legno lucido ad arco col bordo cromato; in alto l'arcobaleno di tubi luminosi su una raggiera
  //  (come nella casa vista di lato), le colonnine con le bollicine, la vetrina col disco, la griglia dorata con le liste
  //  di legno e la fila di tasti colorati; dietro il pannello con le prese d'aria, l'etichetta e il filo
  // =========================================================
  def("juke_box", { tipo: "piedi", nome: "Juke-box", fp: [1, 1], box: [-46, -99, 46, 24], dietro: true, prezzo: 2800, luce: [0, .11, 50, 85, "#ffb3d9"] }, function () {
    var A0 = -.38, A1 = .38, B0 = -.45, B1 = .11, ZA = 58, RZ = 24, LEGNO = "#a0522d", ARC = ["#ff6b6b", "#ffd43b", "#69db7c", "#4dabf7", "#cc5de8"];
    var PROF = [[A0, 3], [A1, 3]].concat(arcoS(0, ZA, A1, RZ, 0, Math.PI, 22));   // il davanti ad arco: (a, z)
    var s = ombraPianta(A0, A1, B0, B1, 1, .05) + blocco(A0 - .012, A1 + .012, B0 - .008, B1 + .016, 0, 3.2, "#5c2f17", null, 1.6);   // lo zoccolo scuro
    function davanti(T) {   // il disegno davanti (piatto, W × 79: y = 82 − z)
      var W = T.W, cx = W / 2, r = "", rr = rnd(13), i, j, CY = 30.6;
      r += tratto("M1,79 L1,24 A" + f1(cx - 1) + ",23 0 0 1 " + f1(W - 1) + ",24 L" + f1(W - 1) + ",79", "#f1f3f5", 1.1, op(.9)) + tratto("M1.8,79 L1.8,24.4 A" + f1(cx - 1.8) + ",22.2 0 0 1 " + f1(W - 1.8) + ",24.4 L" + f1(W - 1.8) + ",79", "#6b3416", .5, op(.8));   // il bordo cromato
      r += pth("M" + f1(cx - 19.6) + "," + CY + " A19.6,19.6 0 0 1 " + f1(cx + 19.6) + "," + CY + " Z", NOTTE ? nuovaR([[0, "#fffef7"], [.65, "#ffe9a8"], [1, "#ffb86b"]], .5, 1, 1) : nuovaR([[0, "#fff4d6"], [.65, "#f2d29b"], [1, "#cf9655"]], .5, 1, 1), "stroke='#6b3416' stroke-width='.8'");   // la raggiera
      for (i = 1; i < 12; i++) { var t = Math.PI * i / 12; r += tratto("M" + f1(cx) + "," + CY + " L" + f1(cx + Math.cos(t) * 19) + "," + f1(CY - Math.sin(t) * 19), "#c98a4b", .35, op(.55)); }
      ARC.forEach(function (c, k) {   // i cinque tubi dell'arcobaleno
        var R = 17.1 - k * 2.75, d = "M" + f1(cx - R) + "," + CY + " A" + f1(R) + "," + f1(R) + " 0 0 1 " + f1(cx + R) + "," + CY;
        r += NOTTE ? tratto(d, c, 3.6, op(.5)) + tratto(d, chiaro(c, .1), 2.1) + tratto(d, "#ffffff", .55, op(.9)) : tratto(d, scuro(c, .45), 2.7) + tratto(d, c, 1.95) + tratto(d, chiaro(c, .55), .6, op(.75));   // di notte: neon accesi
      });
      // le colonnine con le bollicine, coi tappi cromati
      [1.9, W - 6.5].forEach(function (x, k) {
        var tw = 4.6, y0 = 27, y1 = 71;
        r += rett(x, y0, tw, y1 - y0, 2.3, NOTTE ? nuova([[0, "#ffd8a8"], [.5, "#fff8ef"], [1, "#ffa94d"]], 0, 0, 1, 0) : nuova([[0, "#c2410c"], [.45, "#ffa94d"], [1, "#b33a0b"]], 0, 0, 1, 0), "stroke='#5c2f17' stroke-width='.6'");
        for (j = 0; j < 10; j++) r += cer(x + tw / 2 + (rr() - .5) * 2.2, y0 + 3 + rr() * (y1 - y0 - 6), .35 + rr() * .45, "none", "stroke='#ffffff' stroke-width='.3' opacity='.9'");
        r += rett(x + .9, y0 + 1, .8, y1 - y0 - 2, .4, "#ffffff", op(.45));
        [y0 - 1.3, y1 - .9].forEach(function (y) { r += rett(x - .35, y, tw + .7, 2.2, .7, nuova([[0, "#ffffff"], [1, "#8d979f"]], 0, 0, 0, 1), "stroke='#3d2b22' stroke-width='.4'"); });
      });
      // la vetrina col disco in piedi (come nella casa vista di lato), il braccio e la luce di dentro
      var wx = 8.2, wy = 33.2, ww = W - 16.4, wh = 16, fin = rq(wx, wy, ww, wh, 2.2), dy = 41.2;
      var v = rett(wx, wy, ww, wh, 0, NOTTE ? nuovaR([[0, "#ffe3f1"], [.55, "#c06a92"], [1, "#4a1a30"]], .5, .5, .75) : nuovaR([[0, "#7a5566"], [.6, "#33222c"], [1, "#171015"]], .5, .5, .75));
      for (i = 0; i < 9; i++) v += rett(wx + 2 + i * 1.1, wy + 2.5, .7, 11, .3, i % 2 ? "#1c1c22" : "#34343c");   // i dischi in fila nel caricatore
      for (i = 0; i < 9; i++) v += rett(wx + ww - 2.7 - i * 1.1, wy + 2.5, .7, 11, .3, i % 2 ? "#1c1c22" : "#34343c");
      v += cer(cx, dy, 6.5, "#141418") + cer(cx, dy, 5.3, "none", "stroke='#3d3d47' stroke-width='.3'") + cer(cx, dy, 4.2, "none", "stroke='#3d3d47' stroke-width='.3'") + cer(cx, dy, 3.1, "none", "stroke='#3d3d47' stroke-width='.25'");
      v += pth("M" + f1(cx - 4.6) + "," + f1(dy - 4.6) + " L" + f1(cx) + "," + dy + " L" + f1(cx - 1.6) + "," + f1(dy - 6.3) + " Z M" + f1(cx + 4.6) + "," + f1(dy + 4.6) + " L" + f1(cx) + "," + dy + " L" + f1(cx + 1.6) + "," + f1(dy + 6.3) + " Z", "#ffffff", op(.13));   // il riflesso sul vinile
      v += cer(cx, dy, 2.2, "#e03131") + cer(cx, dy, 1.4, "none", "stroke='#ffc9c9' stroke-width='.25'") + cer(cx, dy, .35, "#f1f3f5");
      v += tratto("M" + f1(cx + 8.5) + "," + f1(wy + 2.4) + " L" + f1(cx + 7.6) + "," + f1(dy - 2.4) + " L" + f1(cx + 4.4) + "," + f1(dy - 3.3), "#dee2e6", .8) + cer(cx + 8.5, wy + 2.4, .9, "#adb5bd");   // il braccio
      v += poly([[wx + ww * .12, wy], [wx + ww * .3, wy], [wx + ww * .14, wy + wh], [wx - ww * .04, wy + wh]], "#ffffff", op(NOTTE ? .08 : .14)) + rett(wx, wy, ww, wh * .3, 0, nuova([[0, "#fff", .18], [1, "#fff", 0]], 0, 0, 0, 1));
      r += dentro(fin, v) + pth(fin, "none", "stroke='#e9ecef' stroke-width='1.1'") + pth(fin, "none", "stroke='#495057' stroke-width='.35'");
      // la griglia dorata con le liste di legno (come nella casa vista di lato) e lo stemma cromato
      var gx = 8.2, gy = 51.8, gw = W - 16.4, gh = 19.2;
      r += rett(gx, gy, gw, gh, 1.2, nuova([[0, "#ecc887"], [1, "#b8884a"]], 0, 0, 0, 1), "stroke='#5c2f17' stroke-width='.7'");
      for (i = 0; i < 6; i++) r += rett(gx + 1.3, gy + 1.6 + i * 2.95, gw - 2.6, 1.55, .6, nuova([[0, "#8a5a33"], [1, "#5c3a21"]], 0, 0, 0, 1)) + rett(gx + 1.3, gy + 1.6 + i * 2.95, gw - 2.6, .4, .2, "#d9a56b", op(.8));
      r += ell(cx, gy + gh / 2, 4.2, 2.8, nuova([[0, "#ffffff"], [.5, "#ced4da"], [1, "#868e96"]], 0, 0, 0, 1), "stroke='#3d2b22' stroke-width='.5'") + stella(cx, gy + gh / 2, 1.9, NOTTE ? "#fff3bf" : "#e03131");
      // la fila dei tasti colorati
      r += rett(9.8, 72.6, W - 19.6, 4.4, 1.6, nuova([[0, "#f8f9fa"], [1, "#ced4da"]], 0, 0, 0, 1), "stroke='#5c2f17' stroke-width='.6'");
      ARC.forEach(function (c, k) { var bx = 13 + k * (W - 26) / 4; r += cer(bx, 74.8, 1.05, NOTTE ? chiaro(c, .35) : c, "stroke='" + scuro(c, .5) + "' stroke-width='.35'") + cer(bx - .3, 74.4, .35, "#ffffff", op(.8)); });
      return T.su(r + rett(0, 0, W, 79, 0, nuova([[0, "#fff", .1], [.4, "#fff", 0]], 0, 0, 1, 1)));
    }
    function dietro(T) {   // la schiena: il legno, il pannello con le prese d'aria e le viti, l'etichetta
      var W = T.W, r = venature(W, 80, scuro(LEGNO, .12), 61, 2.6), i;
      r += rett(6, 26, W - 12, 44, 1.2, nuova([[0, "#6e3a1d"], [1, "#4a2412"]], 0, 0, 0, 1), "stroke='#2e160a' stroke-width='.8'");
      for (i = 0; i < 9; i++) r += rett(10, 30 + i * 2.2, W - 20, 1, .5, "#1e0f07");
      [[8, 28], [W - 8, 28], [8, 68], [W - 8, 68]].forEach(function (v) { r += cer(v[0], v[1], .6, "#c9ced3"); });
      return T.su(r + rett(W * .52, 54, 10, 6.5, .5, "#f1ece2") + rett(W * .52 + 1, 55.2, 5, .5, 0, "#868e96") + rett(W * .52 + 1, 56.5, 7.5, .4, 0, "#adb5bd") + rett(W * .52 + 1, 57.6, 6, .4, 0, "#adb5bd"));
    }
    function fascia(H) {   // sui fianchi e sull'arco: il pannello intarsiato col filo cromato, le venature, il bordo cromato vicino al davanti
      var o = "", X0 = 61 * B0, X1 = 61 * B1;
      H.vis.forEach(function (k) { if (k > 2 && k % 2) o += tratto(aperto(H.lungo(k, B0 + .03, B1 - .03)), scuro(LEGNO, .3), .35, op(.4)); });
      o += suA(G > 0 ? A1 : A0, pth(rq(X0 + 3.5, -54, X1 - X0 - 7, 46, 2.5), "none", "stroke='" + scuro(LEGNO, .45) + "' stroke-width='1.2'") + pth(rq(X0 + 4.5, -53, X1 - X0 - 9, 44, 2), "none", "stroke='" + chiaro(LEGNO, .3) + "' stroke-width='.5' opacity='.7'") +
        rett(X0 + 3.5, -40.4, X1 - X0 - 7, 1.6, .5, nuova([[0, "#ffffff"], [.5, "#ced4da"], [1, "#7d868e"]], 0, 0, 0, 1), "stroke='#3d2b22' stroke-width='.35'"));
      return o + tratto(aperto(H.sez(B1 - .03)), "#f8f9fa", 1.1, op(.85)) + tratto(aperto(H.sez(B1 - .045)), "#5c2f17", .5, op(.6)) + H.luccica(.45, .1, .9);
    }
    s += estruso("b", PROF, B0, B1, LEGNO, { mat: { lucido: .45, esp: 16 }, tappo: G > 0 ? davanti : dietro, fascia: fascia, lw: 2.3 });
    if (G < 0) s += tratto("M" + q(P(-.2, B0, 9)) + " C" + q(P(-.2, B0 - .03, 2)) + " " + q(P(-.24, B0 - .04, 0)) + " " + q(P(-.3, -.495, 0)), "#16161a", 1.6);   // il filo
    return s;
  });

  // =========================================================
  //  BILIARDINO: il mobile di legno lucido sulle gambe robuste coi traversi, il campo verde a strisce con le righe bianche
  //  e le porte, le otto stecche cromate con le manopole nere (i blu da una parte, i rossi dall'altra), i giocatori
  //  coi pantaloncini e i calzettoni, la pallina; sulle testate i pallottolieri dei gol e l'uscita della pallina
  // =========================================================
  def("biliardino", { tipo: "piedi", nome: "Biliardino", fp: [2, 1], box: [-61, -85, 61, 28], dietro: true, prezzo: 2200 }, function () {
    var A0 = -.76, A1 = .76, B0 = -.36, B1 = .36, T = .035, ZB = 37, ZW = 52, ZE = 53.5, ZF = 46.5, ZR = 50, LEGNO = "#a0652b", BLU = "#1c7ed6", ROSSO = "#e03131";
    var ASTE = [[-.595, 0, 1], [-.425, 0, 2], [-.255, 1, 3], [-.085, 0, 5], [.085, 1, 5], [.255, 0, 3], [.425, 1, 2], [.595, 1, 1]];   // a, squadra (0 = blu con le manopole davanti, 1 = rossi dietro), quanti giocatori
    var s = ombraPianta(A0, A1, B0, B1, .9, .06);
    // le gambe e i traversi, dal più lontano al più vicino
    var piedi = [];
    [[-.68, -.28], [.68, -.28], [-.68, .28], [.68, .28]].forEach(function (g) { var m = P(g[0], g[1], 0); piedi.push({ v: vicino(g[0], g[1]), s: zampa(g[0], g[1], .045, .036, 1.5, ZB, LEGNO) + ell(m[0], m[1] - .6, 3, 1.5, "#2b2b30", bordo(L, .7)) }); });
    [-.28, .28].forEach(function (b) { piedi.push({ v: vicino(0, b) - .3, s: blocco(-.64, .64, b - .02, b + .02, 8, 12, scuro(LEGNO, .1), null, 1.2) }); });
    s += piedi.sort(function (x, y) { return x.v - y.v; }).map(function (x) { return x.s; }).join("");
    function legno(c, seme) { return function (W, H) { return venature(W, H, c, seme, 2.2); }; }
    function boccole(W, H) { return ASTE.map(function (t) { var x = (t[0] - A0 - T) * 61; return cer(x, ZW - ZR, 1.7, nuovaR(CROMO, .35, .3, .8), "stroke='#3d2b22' stroke-width='.4'") + cer(x, ZW - ZR, .7, "#2b2f36"); }).join(""); }
    function spondaFuori(W, H) { return venature(W, H, LEGNO, 71, 2.2) + rett(0, 1.4, W, .9, 0, scuro(LEGNO, .4), op(.7)) + rett(0, H - 3, W, 1.2, 0, scuro(LEGNO, .45), op(.6)) + boccole(W, H) + rett(W / 2 - 4, H - 8.5, 8, 3.2, .6, nuova(OTTONE, 0, 0, 1, 1), "stroke='#3d2b22' stroke-width='.4'"); }
    function spondaDentro(W, H) { return rett(0, 0, W, H, 0, scuro(LEGNO, .3)) + venature(W, H, scuro(LEGNO, .3), 72, 2.4) + boccole(W, H) + rett(0, 0, W, H, 0, nuova([[0, "#000", 0], [1, "#000", .3]], 0, 0, 0, 1)); }
    function sopraLegno(A, B, C, D, W, H) { return piano(A, B, D, W, H, venature(W, H, chiaro(LEGNO, .1), 73, 1.6) + lucidoPiano(W, H, .8)); }
    function lungo(b0, b1) {   // una sponda lunga: davanti al blocco c'è la faccia di fuori se è la sponda davanti
      var fuori = b1 === B1;
      return blocco(A0 + T, A1 - T, b0, b1, ZB, ZW, LEGNO, { davanti: fuori ? spondaFuori : spondaDentro, dietro: fuori ? spondaDentro : spondaFuori, fianco: legno(LEGNO, 74), sopra: sopraLegno }, 2.2);
    }
    function porta(W, H) {   // la testata vista da dentro: la bocca della porta al livello del campo
      return rett(0, 0, W, H, 0, scuro(LEGNO, .3)) + venature(W, H, scuro(LEGNO, .3), 75, 2.4) + rett(W / 2 - 6.5, ZE - ZF - 4.4, 13, 4.4, .8, "#141416", "stroke='#f1f3f5' stroke-width='.6'") + rett(W / 2 - 6, ZE - ZF - 3.9, 12, 1.2, 0, "#000", op(.5));
    }
    function uscita(W, H) {   // la testata vista da fuori: l'uscita della pallina col bordo cromato
      return venature(W, H, LEGNO, 76, 2.2) + rett(W / 2 - 4.5, H - 9, 9, 4.6, 2, "#17171a", "stroke='#dee2e6' stroke-width='.8'") + cer(W / 2 + 1.6, H - 6.4, 1.2, "#f8f9fa", bordo(L, .4));
    }
    function testata(a0, a1, dentroVisto) { return blocco(a0, a1, B0, B1, ZB, ZE, LEGNO, { fianco: dentroVisto ? porta : uscita, davanti: legno(LEGNO, 77), dietro: legno(LEGNO, 78), sopra: sopraLegno }, 2.2); }
    function pallottoliere(a) {   // sopra la testata: l'asta cromata con le palline dei gol
      var o = cromo(linea(P(a, -.2, ZE + 1.6), P(a, .2, ZE + 1.6)), .7), l = [];
      [-.2, .2].forEach(function (b) { o += tratto(linea(P(a, b, ZE), P(a, b, ZE + 1.6)), "#868e96", .9); });
      [-.17, -.14, -.11, -.08, -.05, .07, .1, .13, .16].forEach(function (b, k) { l.push([b, k < 5 ? ROSSO : BLU]); });
      return o + l.sort(function (x, y) { return G * x[0] - G * y[0]; }).map(function (x) { var c = P(a, x[0], ZE + 1.6); return pallina(c, 1.15, x[1], .45); }).join("");
    }
    function campo() {   // il campo visto da sopra (X = a·61, Y = b·61): le strisce del prato e le righe bianche
      var X = 61 * (A1 - T), Y = 61 * (B1 - T), r = rett(-X, -Y, 2 * X, 2 * Y, 0, "#2f9e44"), i, w = "stroke='#ffffff' stroke-width='.75' fill='none' opacity='.92'";
      for (i = 1; i < 10; i += 2) r += rett(-X + i * X / 5, -Y, X / 5, 2 * Y, 0, "#40c057", op(.55));
      r += "<rect x='" + f1(-X + 1.8) + "' y='" + f1(-Y + 1.8) + "' width='" + f1(2 * X - 3.6) + "' height='" + f1(2 * Y - 3.6) + "' " + w + "/>" + "<path d='M0," + f1(-Y + 1.8) + " V" + f1(Y - 1.8) + "' " + w + "/><circle cx='0' cy='0' r='6' " + w + "/>" + cer(0, 0, .7, "#ffffff");
      [-1, 1].forEach(function (sg) {
        var x0 = sg * (X - 1.8);
        r += "<path d='M" + f1(x0) + ",-9 H" + f1(x0 - sg * 8) + " V9 H" + f1(x0) + " M" + f1(x0) + ",-4.5 H" + f1(x0 - sg * 3.4) + " V4.5 H" + f1(x0) + "' " + w + "/>" + cer(x0 - sg * 6, 0, .55, "#ffffff");
        r += "<path d='M" + f1(x0 - sg * 8) + ",-3.4 A3.6,3.6 0 0 " + (sg > 0 ? 0 : 1) + " " + f1(x0 - sg * 8) + ",3.4' " + w + "/>";
      });
      return r + rett(-X, -Y, 2 * X, 2 * Y, 0, nuova([[0, "#000", .22], [.12, "#000", 0], [.88, "#000", 0], [1, "#000", .12]], 0, 0, 0, 1));
    }
    function omino(a, b, col) {   // un giocatore: le scarpe, i calzettoni, i pantaloncini bianchi, la maglia, la testa
      var o = blocco(a - .016, a + .016, b - .026, b + .026, ZF + .5, ZR + 2.4, col, {
        davanti: function (W, H) { return rett(0, H * .6, W, H * .16, 0, "#f8f9fa") + rett(0, H * .76, W, H * .14, 0, scuro(col, .15)) + rett(0, H * .9, W, H * .1, 0, "#1b1b1f") + rett(W * .4, 0, W * .2, H * .6, 0, "#ffffff", op(.5)); },
        dietro: function (W, H) { return rett(0, H * .6, W, H * .16, 0, "#f8f9fa") + rett(0, H * .76, W, H * .14, 0, scuro(col, .15)) + rett(0, H * .9, W, H * .1, 0, "#1b1b1f"); },
        fianco: function (W, H) { return rett(0, H * .6, W, H * .16, 0, "#e9ecef") + rett(0, H * .76, W, H * .14, 0, scuro(col, .3)) + rett(0, H * .9, W, H * .1, 0, "#111"); } }, .7);
      var c = P(a, b, ZR + 4.1);
      return o + cer(c[0], c[1], 1.8, nuovaR([[0, "#ffe3c4"], [.6, "#efb184"], [1, "#a8683c"]], .35, .3, .8), bordo(L, .6)) + pth("M" + f1(c[0] - 1.8) + "," + f1(c[1] - .2) + " A1.8,1.8 0 0 1 " + f1(c[0] + 1.8) + "," + f1(c[1] - .2) + " Q" + f1(c[0]) + "," + f1(c[1] - 1) + " " + f1(c[0] - 1.8) + "," + f1(c[1] - .2) + " Z", "#3b2416");
    }
    function giocatori() {   // le stecche coi giocatori e la pallina, dal più lontano al più vicino
      var l = ASTE.map(function (t) { return { v: G * t[0], t: t }; });
      l.push({ v: G * .16 + .001, palla: true });
      return l.sort(function (x, y) { return x.v - y.v; }).map(function (e) {
        if (e.palla) { var c = P(.16, .05, ZF + 1.1), o = P(.172, .052, ZF); return ell(o[0], o[1], 1.8, .8, "#000", op(.3)) + pallina(c, 1.15, "#f8f9fa", .5); }
        var t = e.t, a = t[0], n = t[2], col = t[1] ? ROSSO : BLU, bb = [];
        for (var j = 0; j < n; j++) bb.push(n === 1 ? 0 : -.25 + .5 * j / (n - 1) * (n < 4 ? .7 : 1) + (n < 4 ? .075 : 0));
        return cromo(linea(P(a, B0 + T, ZR), P(a, B1 - T, ZR)), .8) + bb.sort(function (x, y) { return G * x - G * y; }).map(function (b) { return omino(a, b, col); }).join("");
      }).join("");
    }
    function moncone(t, lato) {   // l'asta fuori dal mobile (lato 1 = davanti, −1 = dietro): la manopola dalla parte della sua squadra, il tappo di gomma dall'altra
      var a = t[0], bw = lato > 0 ? B1 : B0, mano = (t[1] === 0) === (lato > 0), b2 = bw + lato * (mano ? .06 : .045), o = cromo(linea(P(a, bw, ZR), P(a, b2, ZR)), .9);
      if (!mano) return o + tratto(linea(P(a, b2 - lato * .012, ZR), P(a, b2, ZR)), "#141416", 2.8);
      var e = bw + lato * .165, d = linea(P(a, b2, ZR), P(a, e, ZR)), m = P(a, e, ZR), k;
      o += tratto(d, L, 5) + tratto(d, "#25252b", 3.6) + tratto(d, "#7a7e88", .8, "transform='translate(-.4 -1.1)'");
      for (k = 1; k < 4; k++) { var g = P(a, b2 + lato * k * .025, ZR); o += tratto("M" + q(g[0] - .9, g[1] - 1.9) + " L" + q(g[0] + .9, g[1] + 1.9), "#0e0e11", .5, op(.8)); }
      return o + cer(m[0], m[1], 1.75, "#1b1b20", bordo(L, .6)) + cer(m[0] - .4, m[1] - .5, .6, "#8a8f99", op(.7));
    }
    function moncherini(lato) { return ASTE.slice().sort(function (x, y) { return G * x[0] - G * y[0]; }).map(function (t) { return moncone(t, lato); }).join(""); }
    function angoli2() {   // le cantonali d'ottone sopra gli spigoli
      return [[A0, B0], [A1, B0], [A0, B1], [A1, B1]].map(function (g) {
        var sa = g[0] < 0 ? 1 : -1, sb = g[1] < 0 ? 1 : -1;
        return poly([P(g[0], g[1], ZW + .05), P(g[0] + sa * .06, g[1], ZW + .05), P(g[0], g[1] + sb * .06, ZW + .05)], nuova(OTTONE, 0, 0, 1, 1), bordo(L, .5));
      }).join("");
    }
    var lontano = G > 0 ? -1 : 1;   // il lato lungo lontano da chi guarda
    s += moncherini(lontano) + (G > 0 ? testata(A0, A0 + T, true) + pallottoliere(A0 + T / 2) : testata(A1 - T, A1, true) + pallottoliere(A1 - T / 2));
    s += (G > 0 ? lungo(B0, B0 + T) : lungo(B1 - T, B1));
    s += suZ(ZF, campo()) + giocatori();
    s += (G > 0 ? lungo(B1 - T, B1) : lungo(B0, B0 + T)) + (G > 0 ? testata(A1 - T, A1, false) + pallottoliere(A1 - T / 2) : testata(A0, A0 + T, false) + pallottoliere(A0 + T / 2));
    return s + angoli2() + moncherini(-lontano);
  });

  // =========================================================
  //  CASSA CON LE LUCI: il mobile nero lucido sui piedini di gomma; davanti la griglia a forellini, il woofer grande e il tweeter
  //  con gli anelli di luci colorate, le strisce di luce sugli spigoli; sopra i comandi (la manopola, i tasti, le lucine del volume),
  //  sul fianco la maniglia; dietro le prese, il foro dei bassi e il filo
  // =========================================================
  function anelloLuci(cx, cy, r, w, k) {   // un anello di luci colorate (arcobaleno), di notte acceso forte; k = quanto è acceso
    var c = ["#ff4fa3", "#cc5de8", "#845ef7", "#4c6ef5", "#22b8cf", "#20c997", "#94d82d", "#fcc419", "#ff922b", "#fa5252"], o = cer(cx, cy, r, "none", "stroke='#0d0d10' stroke-width='" + f1(w + .8) + "'"), n = c.length, i;
    for (i = 0; i < n; i++) {
      var t0 = i / n * 6.2832 - 1.57, t1 = (i + 1) / n * 6.2832 - 1.57, col = k ? chiaro(c[i], .12) : scuro(c[i], .1), arco = "M" + f1(cx + Math.cos(t0) * r) + "," + f1(cy + Math.sin(t0) * r) + " A" + f1(r) + "," + f1(r) + " 0 0 1 " + f1(cx + Math.cos(t1) * r) + "," + f1(cy + Math.sin(t1) * r);
      if (k) o += "<path d='" + arco + "' fill='none' stroke='" + c[i] + "' stroke-width='" + f1(w * 2.2) + "' opacity='.4'/>";   // il bagliore colorato
      o += "<path d='" + arco + "' fill='none' stroke='" + col + "' stroke-width='" + f1(w) + "'/>";
    }
    return o + cer(cx, cy, r, "none", "stroke='#ffffff' stroke-width='" + f1(w * (k ? .22 : .3)) + "' opacity='" + (k ? .8 : .3) + "'");
  }
  def("cassa", { tipo: "piedi", nome: "Cassa con le luci", fp: [1, 1], box: [-21, -67, 21, 14], dietro: true, piano: 55, prezzo: 1100, luce: [0, .17, 20, 65, "#b197fc"] }, function () {
    var A0 = -.18, A1 = .18, B0 = -.17, B1 = .17, Z0 = 2, ZT = 55;
    var NERO = [nuova([[0, "#575c66"], [1, "#2c3036"]], 0, 0, 1, 1), nuova([[0, "#3a3e46"], [1, "#202328"]], 0, 0, 0, 1), nuova([[0, "#1f2126"], [1, "#111215"]], 0, 0, 0, 1)];
    DEFS.push("<pattern id='" + p + "fori' width='1.15' height='1.15' patternUnits='userSpaceOnUse'><circle cx='.57' cy='.57' r='.3' fill='#08090b'/></pattern>");
    var s = ombraPianta(A0, A1, B0, B1, 1, .05);
    [[A0 + .02, B0 + .02], [A1 - .06, B0 + .02], [A0 + .02, B1 - .06], [A1 - .06, B1 - .06]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }).forEach(function (g) { s += blocco(g[0], g[0] + .04, g[1], g[1] + .04, 0, Z0, "#2b2b30", null, .8); });   // i piedini di gomma
    function davanti(W, H) {   // la griglia, il tweeter e il woofer con gli anelli di luce, le strisce sugli spigoli
      var cx = W / 2, wy = H * .66, ty = H * .24, r = rett(0, 0, W, H, 0, "#24272c") + rett(.9, .9, W - 1.8, H - 1.8, 1.2, "url(#" + p + "fori)") + rett(.9, .9, W - 1.8, H - 1.8, 1.2, "none", "stroke='#4a4f58' stroke-width='.5'");
      r += anelloLuci(cx, wy, 9.3, 1.5, NOTTE) + cer(cx, wy, 8.3, nuova([[0, "#f1f3f5"], [1, "#6c757d"]], 0, 0, 1, 1)) + cer(cx, wy, 7.7, nuovaR([[0, "#4a4f58"], [.7, "#2b2f35"], [1, "#16181c"]], .35, .3, .8));   // l'anello di luci, il bordo cromato, la sospensione di gomma
      r += cer(cx, wy, 6, nuovaR([[0, "#3d424a"], [.6, "#1d2025"], [1, "#0e0f12"]], .4, .35, .75)) + cer(cx, wy, 4.6, "none", "stroke='#2e3238' stroke-width='.35'") + cer(cx, wy, 3.4, "none", "stroke='#2e3238' stroke-width='.35'");   // il cono
      r += cer(cx, wy, 2.4, nuovaR([[0, "#8a909a"], [.45, "#3a3e46"], [1, "#16181c"]], .35, .3, .75)) + ell(cx - .8, wy - .9, .8, .5, "#ffffff", op(.6));   // il cappuccio lucido
      r += anelloLuci(cx, ty, 4.9, 1.1, NOTTE) + cer(cx, ty, 4.1, nuova([[0, "#f1f3f5"], [1, "#6c757d"]], 0, 0, 1, 1)) + cer(cx, ty, 3.5, nuovaR([[0, "#dee2e6"], [.5, "#868e96"], [1, "#343a40"]], .35, .3, .8)) + ell(cx - .9, ty - 1, .8, .5, "#ffffff", op(.75));   // il tweeter
      [1.6, W - 1.6].forEach(function (x) {   // le strisce di luce
        if (NOTTE) r += rett(x - 1.1, 2.4, 2.2, H - 4.8, 1.1, nuova([[0, "#ff4fa3", .45], [.5, "#9775fa", .45], [1, "#22d3ee", .45]], 0, 0, 0, 1)) + rett(x - .45, 3, .9, H - 6, .45, nuova([[0, "#ff8cc6"], [.5, "#b197fc"], [1, "#66e3f5"]], 0, 0, 0, 1)) + rett(x - .15, 3.4, .3, H - 6.8, .15, "#ffffff", op(.85));
        else r += rett(x - .45, 3, .9, H - 6, .45, nuova([[0, "#e64980"], [.5, "#7048e8"], [1, "#1098ad"]], 0, 0, 0, 1));
      });
      return r + rett(cx - 3, H - 3.6, 6, 1.3, .6, nuova([[0, "#ffffff"], [1, "#868e96"]], 0, 0, 0, 1)) + poly([[W * .1, 0], [W * .32, 0], [W * .12, H], [-W * .1, H]], "#ffffff", op(.06));
    }
    function fianco(W, H) { return rett(0, 0, W, H, 0, "#000", op(.08)) + rett(W / 2 - 6, 5, 12, 4.6, 2.3, "#0c0d0f", "stroke='#4a4f58' stroke-width='.5'") + rett(W / 2 - 4.8, 6.4, 9.6, 1.8, .9, nuova([[0, "#5c626c"], [1, "#2b2f35"]], 0, 0, 0, 1)); }   // la maniglia incassata
    function retro(W, H) {   // le prese, l'interruttore, la presa del filo, il foro dei bassi, l'etichetta
      var r = rett(3, 6, W - 6, 17, 1, "#33373e", "stroke='#121316' stroke-width='.6'"), i;
      for (i = 0; i < 3; i++) r += cer(6.5 + i * 4.5, 10.5, 1.2, nuovaR(CROMO, .35, .3, .8), "stroke='#121316' stroke-width='.3'") + cer(6.5 + i * 4.5, 10.5, .45, "#08090b");
      r += rett(5.5, 15, 3.4, 5, .5, "#141518") + rett(6.2, 15.8, 2, 1.8, .3, "#e03131") + rett(12, 15, 6, 5, 1, "#141518") + rett(13.4, 16.6, .7, 1.8, 0, "#adb5bd") + rett(15.9, 16.6, .7, 1.8, 0, "#adb5bd");
      r += rett(4, H - 15, W - 8, 5, 2.5, "#060708", "stroke='#4a4f58' stroke-width='.6'") + rett(5, H - 14, W - 10, 1.4, .7, "#23262b");   // il foro dei bassi
      return r + rett(4, 27, 9, 5.5, .5, "#f1ece2") + rett(5, 28.2, 4.5, .45, 0, "#868e96") + rett(5, 29.4, 7, .4, 0, "#adb5bd") + rett(5, 30.4, 5.5, .4, 0, "#adb5bd");
    }
    s += blocco(A0, A1, B0, B1, Z0, ZT, NERO, { davanti: davanti, dietro: retro, fianco: fianco }, 2.2);
    // sopra: la striscia dei comandi verso il davanti (il centro resta libero per appoggiarci le cose)
    var lucine = "", i;
    for (i = 0; i < 7; i++) lucine += rett(-5.5 + i * 1.5, 8.1, 1, .8, .3, i < 4 ? "#51cf66" : i < 6 ? "#fcc419" : "#ff6b6b", op(NOTTE ? 1 : .8));
    s += suZ(ZT, rett(-9.6, 5.6, 19.2, 4.6, 2, "#16181c", "stroke='#4a4f58' stroke-width='.4'") + lucine + cer(6.6, 7.9, .7, "#4dabf7") + cer(8.3, 7.9, .7, NOTTE ? "#e5dbff" : "#9775fa"));
    s += tasto(-.12, .125, ZT, .022, 1.5, "#3a3f47", "#101114") + tratto(linea(P(-.12, .128, ZT + 1.5), P(-.12, .145, ZT + 1.5)), "#f1f3f5", .6);   // la manopola del volume
    if (G < 0) s += tratto("M" + q(P(-.066, B0, 37)) + " C" + q(P(-.066, B0 - .03, 20)) + " " + q(P(-.09, B0 - .04, 0)) + " " + q(P(-.15, -.3, 0)), "#16161a", 1.5);   // il filo dalla presa
    return s;
  });

  // =========================================================
  //  COMPUTER (da appoggiare sopra): lo schermo largo con la cornice sottile e il videogioco della casa vista di lato
  //  (il cielo, il prato, il sole, l'omino che salta, i blocchi), il piede d'alluminio; la tastiera chiara coi tasti bianchi
  //  e il mouse bianco sul tappetino; dietro il guscio nero con l'anello di luce e il filo
  // =========================================================
  function allu() { return [nuova([[0, "#ffffff"], [1, "#cfd5da"]], 0, 0, 1, 1), nuova([[0, "#e9ecef"], [1, "#aab3bb"]], 0, 0, 1, 0), nuova([[0, "#9aa3ab"], [1, "#6c757d"]], 0, 0, 1, 0)]; }
  function nero3() { return [nuova([[0, "#5a5f68"], [1, "#2c3036"]], 0, 0, 1, 1), nuova([[0, "#3a3e46"], [1, "#1d2025"]], 0, 0, 0, 1), nuova([[0, "#1f2126"], [1, "#101114"]], 0, 0, 0, 1)]; }
  // una piastra sagomata vista da sopra (pp = punti [a, b] della pianta), spessa da z0 a z1: i bordi verso chi guarda, poi il sopra
  function sagomata(pp, z0, z1, cs, cl, cd, sopra) {
    var n = pp.length, i, area = 0, ed = [];
    for (i = 0; i < n; i++) { var p1 = pp[i], p2 = pp[(i + 1) % n]; area += p1[0] * p2[1] - p2[0] * p1[1]; }
    var sg = area > 0 ? 1 : -1;
    for (i = 0; i < n; i++) {
      var e1 = pp[i], e2 = pp[(i + 1) % n], da = e2[0] - e1[0], db = e2[1] - e1[1], na = sg * db, nb = -sg * da;
      if (G * (na + nb) <= 0) continue;
      ed.push({ v: vicino((e1[0] + e2[0]) / 2, (e1[1] + e2[1]) / 2), s: poly([P(e1[0], e1[1], z0), P(e2[0], e2[1], z0), P(e2[0], e2[1], z1), P(e1[0], e1[1], z1)], G * (nb - na) > 0 ? cl : cd) });
    }
    var top = chiuso(pp.map(function (x) { return P(x[0], x[1], z1); }));
    return ed.sort(function (x, y) { return x.v - y.v; }).map(function (x) { return x.s; }).join("") + pth(top, cs) + (sopra || "") + pth(chiuso(inviluppo(pp.map(function (x) { return P(x[0], x[1], z0); }).concat(pp.map(function (x) { return P(x[0], x[1], z1); })))), "none", bordo(L, .9)) + pth(top, "none", "stroke='" + L + "' stroke-width='.5' opacity='.6'");
  }
  def("computer", { tipo: "sopra", nome: "Computer", fp: [1, 1], box: [-27, -48, 28, 16], dietro: true, prezzo: 1800, luce: [0, -.1, 23, 60, "#a5d8ff"] }, function () {
    var s = ombraPianta(-.3, .36, -.24, .17, .7, .03);
    function schermo(W, H) {   // la cornice sottile, il videogioco (come nella casa vista di lato) e il mento con la lucina
      var x0 = .9, y0 = .9, w = W - 1.8, h = H - 2.9, r = rett(0, 0, W, H, 0, nuova([[0, "#2a2d33"], [1, "#121316"]], 0, 0, 0, 1)), g, i;
      g = rett(x0, y0, w, h, 0, NOTTE ? nuova([[0, "#9fd8ff"], [1, "#e3f4ff"]], 0, 0, 0, 1) : nuova([[0, "#74c0fc"], [1, "#d0ebff"]], 0, 0, 0, 1));
      g += cer(x0 + w * .84, y0 + 3.6, 2.4, "#fff3bf") + cer(x0 + w * .84, y0 + 3.6, 3.4, "#fff3bf", op(.35));   // il sole
      [[.2, 3.4], [.55, 2.4]].forEach(function (c) { var cx = x0 + w * c[0], cy = y0 + c[1]; g += ell(cx, cy, 2.4, .9, "#ffffff") + ell(cx + 1.2, cy - .6, 1.4, .9, "#ffffff") + ell(cx - 1.1, cy - .3, 1.1, .7, "#ffffff"); });   // le nuvole
      var gy = y0 + h - 4.2;
      g += rett(x0, gy, w, 4.2, 0, "#c47a3a") + rett(x0, gy, w, 1.4, 0, "#69db7c") + rett(x0, gy + 1.2, w, .35, 0, "#2f9e44");   // il prato e la terra
      for (i = 0; i < 9; i++) g += rett(x0 + 1 + i * 4, gy + 2.4, 1.2, .6, .2, "#9a5a2a");
      g += rett(x0 + w * .78, gy - 4, 3.6, 4, 0, "#40c057", "stroke='#1e6b2c' stroke-width='.35'") + rett(x0 + w * .78 - .5, gy - 5.2, 4.6, 1.5, .2, "#51cf66", "stroke='#1e6b2c' stroke-width='.35'");   // il tubo verde
      [[.44, 7], [.5, 7]].forEach(function (c, k) { var bx = x0 + w * c[0] + k * 1.5; g += rett(bx, y0 + c[1], 2.3, 2.3, .2, k ? "#f59f00" : "#a0652b", "stroke='#5c3a1e' stroke-width='.3'") + (k ? rett(bx + .9, y0 + c[1] + .5, .5, 1.3, 0, "#fff3bf") : ""); });   // i blocchi
      g += cer(x0 + w * .51, y0 + 5.2, .8, "#ffd43b", "stroke='#b07d00' stroke-width='.25'");   // la moneta
      var ox = x0 + w * .3, oy = gy - 6.2;
      g += tratto("M" + f1(ox - 5) + "," + f1(gy - .4) + " Q" + f1(ox - 2.6) + "," + f1(oy - 3) + " " + f1(ox + 1.2) + "," + f1(oy + 2), "#ffffff", .35, "stroke-dasharray='.6 .6' opacity='.8'");   // il salto
      g += rett(ox, oy, 2.6, 3, .3, "#e8590c", "stroke='#7a2e0a' stroke-width='.3'") + rett(ox - .2, oy - .7, 3, 1, .4, "#e03131") + rett(ox + 1.5, oy + .7, .5, .5, 0, "#ffffff") + rett(ox + .2, oy + 3, .8, .8, 0, "#5c3a1e") + rett(ox + 1.6, oy + 3, .8, .8, 0, "#5c3a1e");   // l'omino che salta
      g += rett(x0 + .8, y0 + .7, 4, .6, .3, "#ffffff", op(.85)) + rett(x0 + .8, y0 + 1.6, 2.6, .5, .25, "#ffffff", op(.7));
      if (NOTTE) g += rett(x0, y0, w, h, 0, "#ffffff", op(.12));
      g += poly([[x0 + w * .1, y0], [x0 + w * .26, y0], [x0 + w * .08, y0 + h], [x0 - w * .08, y0 + h]], "#ffffff", op(NOTTE ? .05 : .16)) + rett(x0, y0, w, h * .3, 0, nuova([[0, "#fff", .16], [1, "#fff", 0]], 0, 0, 0, 1));
      r += dentro("M" + x0 + "," + y0 + " h" + f1(w) + " v" + f1(h) + " h" + f1(-w) + " Z", g);
      return r + rett(W / 2 - 2.5, H - 1.4, 5, .7, .35, "#3d4148") + cer(W - 2, H - 1, .35, NOTTE ? "#ffffff" : "#74c0fc") + rett(0, 0, W, .4, 0, "#ffffff", op(.2));
    }
    function retroPannello(W, H) { return rett(0, 0, W, H, 0, nuova([[0, "#3a3e46"], [1, "#16181c"]], 0, 0, 1, 1)) + poly([[W * .6, 0], [W * .7, 0], [W * .45, H], [W * .35, H]], "#ffffff", op(.07)); }
    function retroGuscio(W, H) {   // il guscio di dietro: l'anello di luce colorata e le prese d'aria
      var r = "", y;
      for (y = 2; y < 6; y += 1.3) r += rett(W * .15, y, W * .7, .6, .3, "#08090b");
      return r + anelloLuci(W / 2, H * .6, 3.4, .8, NOTTE) + cer(W / 2, H * .6, 2.6, "#1d2025");
    }
    function sottile(W, H) { return rett(0, 0, W, H, 0, "#2b2f35"); }
    function base() {   // il piede d'alluminio con gli angoli tondi
      var F = forma(0, -.15, .13, .09, .09, 5);
      return corpo([giro(F, 0, 1, 40), giro(F, 1.2, 1, 40)], [[0, "#f1f3f5"], [.5, "#aab3bb"], [1, "#6c757d"]], 1) + pth(chiuso(giro(F, 1.2, 1, 40)), nuova([[0, "#ffffff"], [1, "#c3cad1"]], 0, 0, 1, 1), bordo(L, .8));
    }
    var collo = blocco(-.025, .025, -.185, -.155, 1.2, 25, allu(), null, 1);
    var guscio = blocco(-.2, .2, -.155, -.125, 15, 31, nero3(), { dietro: retroGuscio }, 1.4);
    var pannello = blocco(-.31, .31, -.125, -.1, 12, 34, nero3(), { davanti: schermo, dietro: retroPannello, fianco: sottile }, 1.8);
    function tastiera() {   // la tastiera d'alluminio coi tasti bianchi (chiara, come nella casa vista di lato) e la barra spaziatrice
      var t = "", i, j, X0 = -.21 * 61, Y0 = .02 * 61, kw = 1.25, gap = .18;
      t += rett(X0 + .6, Y0 + .6, 23.2, 6.7, .6, "#9aa3ab");   // il fondo tra i tasti
      for (i = 0; i < 5; i++) for (j = 0; j < 16; j++) {
        if (i === 4 && j > 4 && j < 11) { if (j === 5) t += rett(X0 + 1 + j * (kw + gap), Y0 + 1 + i * (kw + gap), 6 * (kw + gap) - gap, kw, .25, "#f1f3f5", "stroke='#868e96' stroke-width='.15'"); continue; }
        t += rett(X0 + 1 + j * (kw + gap), Y0 + 1 + i * (kw + gap), kw, kw, .25, "#f8f9fa", "stroke='#868e96' stroke-width='.15'") + rett(X0 + 1.15 + j * (kw + gap), Y0 + 1.1 + i * (kw + gap), kw - .3, .3, .1, "#ffffff", op(.9));
      }
      t += rett(X0 + 1 + 15 * (kw + gap) + .2, Y0 + 1 + .3, .5, .5, .25, NOTTE ? "#d3f9d8" : "#51cf66");   // la lucina accesa
      return blocco(-.21, .19, .02, .15, 0, 1.6, allu(), null, 1) + suZ(1.6, t);
    }
    function mouse() {   // il tappetino blu e il mouse bianco lucido (come nella casa vista di lato)
      var o = suZ(.25, rett(.215 * 61, -.01 * 61, .15 * 61, .19 * 61, 1.2, "#34507a", "stroke='#1d2f4a' stroke-width='.5'") + rett(.215 * 61 + .8, -.01 * 61 + .8, .15 * 61 - 1.6, 2, .8, "#ffffff", op(.12))), F = forma(.29, .08, .03, .05, .05, 2);
      o += corpo([giro(F, .3, 1, 28), giro(F, 1.4, .95, 28), giro(F, 2.1, .62, 28)], [[0, "#ffffff"], [.45, "#dee2e6"], [1, "#8d979f"]], .8);
      var c = P(.29, .065, 2.1);
      return o + tratto(linea(P(.29, .045, 2.1), P(.29, .085, 2.1)), "#868e96", .35) + ell(c[0] - 1, c[1] - .6, .8, .35, "#ffffff", op(.9));
    }
    var filo = G < 0 ? tratto("M" + q(P(.06, -.155, 18)) + " C" + q(P(.07, -.2, 8)) + " " + q(P(.08, -.26, 0)) + " " + q(P(.14, -.34, 0)), "#16161a", 1.2) : "";
    if (G > 0) s += base() + collo + guscio + pannello + tastiera() + mouse();
    else s += tastiera() + mouse() + base() + pannello + guscio + filo + collo;
    return s;
  });

  // =========================================================
  //  CONSOLE COI GIOCHI (da appoggiare sopra): la console nera lucida sdraiata con la striscia di luce azzurra e la fessura dei dischi,
  //  il controller bianco coi tasti colorati (come nella casa vista di lato) e le levette, la pila di giochi con le copertine colorate;
  //  dietro le prese e il filo
  // =========================================================
  def("console", { tipo: "sopra", nome: "Console coi giochi", fp: [1, 1], box: [-31, -18, 31, 15], dietro: true, prezzo: 1200, luce: [.02, .06, 5, 30, "#66d9e8"] }, function () {
    var s = ombraPianta(-.31, .26, -.21, .28, .6, .02);
    function corpoConsole() {
      var A0 = -.15, A1 = .19, B0 = -.2, B1 = .06;
      function davanti(W, H) {   // la striscia di luce, la fessura dei dischi, i tasti e le prese
        return rett(0, 0, W, .9, 0, NOTTE ? "#c5f6fa" : "#22b8cf") + rett(0, .9, W, .3, 0, "#000", op(.4)) + rett(3, 2.1, 10, .5, .25, "#050506") + rett(3, 2.6, 10, .25, 0, "#868e96") +
          rett(W - 4.4, 2, 1.2, .8, .2, "#868e96") + rett(W - 2.6, 2, 1.2, .8, .2, "#868e96") + cer(1.6, 2.4, .5, NOTTE ? "#ffffff" : "#adb5bd");
      }
      function dietro(W, H) { return rett(2, 1.4, 2.8, 1.6, .2, "#08090b", "stroke='#6c757d' stroke-width='.2'") + rett(6, 1.4, 2.4, 1.6, .2, "#08090b", "stroke='#6c757d' stroke-width='.2'") + rett(10, 1.6, 1.6, 1.4, .7, "#08090b") + rett(12.5, 1.2, W - 14, 2.2, .3, "#000", op(.4)); }
      function fianco(W, H) { var o = "", x; for (x = 1.5; x < W - 1; x += 1.1) o += rett(x, 1.3, .5, H - 2.4, .25, "#08090b", op(.8)); return o; }
      function sopra(A, B, C, D, W, H) { return dentro(chiuso([A, B, C, D]), poly([lerp(A, B, .2), lerp(A, B, .38), lerp(D, C, .26), lerp(D, C, .08)], "#ffffff", op(.13)) + poly([lerp(A, B, .45), lerp(A, B, .5), lerp(D, C, .34), lerp(D, C, .29)], "#ffffff", op(.1))); }
      var o = "";
      [[A0 + .02, B0 + .02], [A1 - .05, B0 + .02], [A0 + .02, B1 - .05], [A1 - .05, B1 - .05]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }).forEach(function (g) { o += blocco(g[0], g[0] + .03, g[1], g[1] + .03, 0, .6, "#111214", null, .5); });
      o += blocco(A0, A1, B0, B1, .6, 2.9, nero3(), { davanti: function (W, H) { return rett(0, 0, W, H, 0, "#000", op(.25)); }, dietro: function (W, H) { return rett(0, 0, W, H, 0, "#000", op(.25)); } }, 1.1);   // la parte di sotto, opaca
      o += blocco(A0 + .005, A1 - .005, B0 + .005, B1 - .005, 2.9, 6.2, [nuova([[0, "#6b717c"], [.5, "#2b2f36"], [1, "#16181c"]], 0, 0, 1, 1), nuova([[0, "#4a4f58"], [1, "#24272c"]], 0, 0, 0, 1), nuova([[0, "#24272c"], [1, "#121316"]], 0, 0, 0, 1)], { davanti: davanti, dietro: dietro, fianco: fianco, sopra: sopra }, 1.1);
      return o;
    }
    function controller() {   // il controller bianco: la croce, i quattro tasti colorati, le due levette, la lucina in mezzo
      var ca = .13, cb = .195, k = .011, pp = [[-6, -4], [-2, -4.6], [2, -4.6], [6, -4], [8, -2], [8.3, 1], [7.5, 4.6], [5.6, 5.5], [3.8, 3.4], [-3.8, 3.4], [-5.6, 5.5], [-7.5, 4.6], [-8.3, 1], [-8, -2]].map(function (x) { return [ca + x[0] * k, cb + x[1] * k]; });
      var t = "<g transform='translate(" + f1(ca * 61) + " " + f1(cb * 61) + ") scale(" + f2(k * 61) + ")'>" +
        pth("M-5.2,-1.3 h1.6 v-1.6 h1.4 v1.6 h1.6 v1.4 h-1.6 v1.6 h-1.4 v-1.6 h-1.6 Z", "#3d4148") +   // la croce
        cer(4.6, -2.3, .75, "#40c057", "stroke='#1e6b2c' stroke-width='.2'") + cer(6, -.9, .75, "#e03131", "stroke='#7a1010' stroke-width='.2'") + cer(4.6, .5, .75, "#1c7ed6", "stroke='#0b3d75' stroke-width='.2'") + cer(3.2, -.9, .75, "#fab005", "stroke='#8a5d00' stroke-width='.2'") +
        cer(-2, 1.9, 1.25, "#2b2f35") + cer(-2.2, 1.7, .8, "#4a4f58") + cer(2, 1.9, 1.25, "#2b2f35") + cer(1.8, 1.7, .8, "#4a4f58") + rett(-1.4, -3.4, 2.8, .9, .45, NOTTE ? "#d0ebff" : "#74c0fc") + "</g>";
      return sagomata(pp, 0, 2.2, nuova([[0, "#ffffff"], [1, "#dee2e6"]], 0, 0, 1, 1), "#e9ecef", "#adb5bd", suZ(2.2, t));
    }
    function giochi() {   // la pila di giochi: le scatole di plastica e le copertine colorate
      var o = "", cop = [["#1971c2", "#74c0fc"], ["#2b8a3e", "#8ce99a"], ["#c92a2a", "#ffd43b"]];
      cop.forEach(function (c, i) {
        var a0 = -.29 + (i === 1 ? .012 : 0), b0 = .1 - (i === 1 ? .01 : 0) + (i === 2 ? .006 : 0), z0 = i * 1.05, A = a0 * 61, B = b0 * 61;
        var arte = rett(A + .4, B + .4, 13.5 * .61 - .8, 17 * .61 - .8, .3, c[0]) + rett(A + .4, B + .4, 13.5 * .61 - .8, 1.6, 0, "#f8f9fa") + rett(A + 1, B + .7, 3, .6, .2, c[0]);
        if (i === 2) arte += stella(A + 4.1, B + 6.2, 2.6, c[1], "stroke='#7a1010' stroke-width='.3'") + cer(A + 6.2, B + 8.6, .7, "#ffffff", op(.8));
        else arte += cer(A + 4.1, B + 6.2, 2.2, c[1]);
        o += blocco(a0, a0 + .135, b0, b0 + .17, z0, z0 + 1, ["#1d2b44", "#26334d", "#121a2b"], { fianco: function (W, H) { return rett(0, 0, W, H, 0, c[0]) + rett(0, H * .3, W, H * .25, 0, "#ffffff", op(.6)); } }, .7) + suZ(z0 + 1, arte);
      });
      return o;
    }
    var l = [{ v: vicino(.02, -.07), s: corpoConsole() }, { v: vicino(.13, .195), s: controller() }, { v: vicino(-.22, .185), s: giochi() }];
    s += l.sort(function (x, y) { return x.v - y.v; }).map(function (x) { return x.s; }).join("");
    if (G < 0) s += tratto("M" + q(P(.1, -.2, 2.2)) + " C" + q(P(.1, -.25, 1)) + " " + q(P(.12, -.28, 0)) + " " + q(P(.18, -.34, 0)), "#16161a", 1.1);   // il filo
    return s;
  });

  // =========================================================
  //  GIRADISCHI (da appoggiare sopra): il mobiletto di noce lucido coi piedini, il piatto d'alluminio coi puntini, il disco nero
  //  coi solchi e l'etichetta rossa, il braccio cromato col contrappeso, i tasti e la lucina verde (come nella casa vista di lato);
  //  il coperchio di plexiglas fumé aperto dietro
  // =========================================================
  def("giradischi", { tipo: "sopra", nome: "Giradischi", fp: [1, 1], box: [-26, -43, 26, 13], dietro: true, prezzo: 900 }, function () {
    var A0 = -.23, A1 = .23, B0 = -.18, B1 = .18, ZP = 6.2, NOCE = "#9c6233", s = ombraPianta(A0, A1, B0, B1, .8, .03);
    function coperchio() {   // il coperchio aperto, appoggiato indietro: plexiglas fumé coi riflessi e le cerniere cromate
      var bt = B0 - .06, zt = ZP + 21.6, sp = .05, o = "";
      var Q = [P(A0, B0, ZP), P(A1, B0, ZP), P(A1, bt, zt), P(A0, bt, zt)], d = chiuso(Q);
      [A0, A1].forEach(function (a) { o += poly([P(a, B0, ZP), P(a, bt, zt), P(a, bt + sp, zt + .6), P(a, B0 + sp, ZP + .4)], "#3a3f47", "opacity='.45' stroke='#adb5bd' stroke-width='.5'"); });   // i fianchi del coperchio
      o += pth(d, "#3b4048", op(.4)) + dentro(d, poly([lerp(Q[0], Q[1], .15), lerp(Q[0], Q[1], .32), lerp(Q[3], Q[2], .22), lerp(Q[3], Q[2], .05)], "#ffffff", op(.18)) + poly([lerp(Q[0], Q[1], .4), lerp(Q[0], Q[1], .45), lerp(Q[3], Q[2], .35), lerp(Q[3], Q[2], .3)], "#ffffff", op(.14))) + pth(d, "none", "stroke='#dee2e6' stroke-width='.8' opacity='.85'") + pth(d, "none", bordo(L, .6));
      [-.15, .15].forEach(function (a) { o += blocco(a - .02, a + .02, B0 - .012, B0 + .01, ZP - 1.5, ZP + 1, cromo3(), null, .6); });   // le cerniere
      return o;
    }
    function mobiletto() {
      var o = "";
      [[A0 + .03, B0 + .03], [A1 - .03, B0 + .03], [A0 + .03, B1 - .03], [A1 - .03, B1 - .03]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }).forEach(function (g) { var F = forma(g[0], g[1], .022, .022, .022, 2); o += corpo([giro(F, 0, 1, 16), giro(F, 1, 1, 16)], [[0, "#4a4f58"], [1, "#16181c"]], .7); });   // i piedini
      function davanti(W, H) { return venature(W, H, NOCE, 81, 1.8) + rett(0, 0, W, .6, 0, "#ffffff", op(.3)) + cer(W - 6.5, H / 2, .75, NOTTE ? "#8ce99a" : "#2b8a3e", "stroke='#1b3d24' stroke-width='.25'") + cer(W - 3.5, H / 2, 1.1, nuovaR(CROMO, .35, .3, .8), bordo(L, .35)); }
      return o + blocco(A0, A1, B0, B1, 1, ZP, NOCE, { davanti: davanti, dietro: facciaLegno(NOCE, 82, 1.8), fianco: facciaLegno(NOCE, 83, 1.8), sopra: function (A, B, C, D, W, H) { return piano(A, B, D, W, H, venature(W, H, chiaro(NOCE, .08), 84, 2.6) + lucidoPiano(W, H, .9)); } }, 1.8);
    }
    function piatto() {   // il piatto d'alluminio coi puntini sul bordo, il disco coi solchi e il riflesso, l'etichetta rossa
      var F = forma(-.05, 0, .158, .158, .158, 2), o = corpo([giro(F, ZP, 1, 64), giro(F, ZP + 1.5, 1, 64)], [[0, "#ffffff"], [.3, "#dee2e6"], [.7, "#9aa3ab"], [1, "#5f6870"]], 1), i;
      for (i = 0; i < 48; i++) { var t = i / 48 * 6.2832, ca = Math.cos(t), sb = Math.sin(t); if (G * (ca + sb) < .25) continue; var m = P(-.05 + ca * .158, sb * .158, ZP + .75); o += cer(m[0], m[1], .3, "#495057"); }   // i puntini del bordo
      var D = giro(F, ZP + 1.55, .97, 64), dD = chiuso(D), lab = giro(F, ZP + 1.6, .33, 32), c = P(-.05, 0, ZP + 1.6), r = "";
      for (i = 1; i < 7; i++) r += pth(chiuso(giro(F, ZP + 1.56, .9 - i * .085, 48)), "none", "stroke='#3d3f47' stroke-width='.3'");
      r += poly([c, giro(F, ZP + 1.56, 1.1, 64)[40], giro(F, ZP + 1.56, 1.1, 64)[46]], "#ffffff", op(.16)) + poly([c, giro(F, ZP + 1.56, 1.1, 64)[8], giro(F, ZP + 1.56, 1.1, 64)[14]], "#ffffff", op(.16));   // il riflesso sul vinile
      o += pth(dD, "#151518", bordo(L, .8)) + dentro(dD, r) + pth(chiuso(lab), "#e03131", "stroke='#7a1010' stroke-width='.35'") + pth(chiuso(giro(F, ZP + 1.6, .22, 24)), "none", "stroke='#ffc9c9' stroke-width='.25'") + cer(c[0], c[1] - .5, .5, "#e9ecef", bordo(L, .3));
      return o;
    }
    function braccio() {   // il perno, il braccio a esse cromato, il contrappeso, la testina appoggiata sul disco e il poggiabraccio
      var Fp = forma(.165, -.1, .03, .03, .03, 2), o = corpo([giro(Fp, ZP, 1, 24), giro(Fp, ZP + 2.6, 1, 24)], [[0, "#ffffff"], [.5, "#adb5bd"], [1, "#495057"]], .8) + pth(chiuso(giro(Fp, ZP + 2.6, 1, 24)), nuova([[0, "#ffffff"], [1, "#adb5bd"]], 0, 0, 1, 1), bordo(L, .5));
      var a = P(.165, -.1, ZP + 3.2), b = P(.16, .0, ZP + 3.2), c = P(.09, .08, ZP + 2.8), d = P(.05, .09, ZP + 2.6);
      var cw = [P(.168, -.13, ZP + 3.2), P(.172, -.17, ZP + 3.2)], res = P(.2, .06, ZP + 2.4);
      var pezzi = [{ v: vicino(.17, -.15), s: tratto(linea(cw[0], cw[1]), L, 4) + tratto(linea(cw[0], cw[1]), "#2b2f35", 2.8) + tratto(linea(cw[0], cw[1]), "#868e96", .7, "transform='translate(-.3 -.8)'") },
        { v: vicino(.2, .06), s: tratto(linea(P(.2, .06, ZP), res), "#adb5bd", .8) + cer(res[0], res[1], .7, "#343a40") },
        { v: vicino(.12, 0), s: cromo("M" + q(a) + " C" + q(b) + " " + q(b) + " " + q(c) + " L" + q(d), .8) + pth("M" + q(d[0] - 1.6, d[1] - .4) + " L" + q(d[0] + .9, d[1] - 1.2) + " L" + q(d[0] + 1.3, d[1] + .3) + " L" + q(d[0] - 1.2, d[1] + 1) + " Z", "#212529", bordo(L, .4)) }];
      return o + pezzi.sort(function (x, y) { return x.v - y.v; }).map(function (x) { return x.s; }).join("");
    }
    function tasti() { return tasto(-.19, .135, ZP, .022, .7, "#e9ecef", "#212529") + tasto(-.19, .075, ZP, .016, .6, "#adb5bd") + tasto(-.15, .14, ZP, .014, .6, "#adb5bd"); }   // avvio e velocità
    if (G > 0) s += coperchio() + mobiletto() + piatto() + braccio() + tasti();
    else s += mobiletto() + piatto() + tasti() + braccio() + coperchio();
    return s;
  });

  // =========================================================
  //  RADIO VINTAGE (da appoggiare sopra): il mobiletto arancione laccato con gli angoli tondi e il filo cromato,
  //  l'altoparlante tondo color crema coi forellini, la finestrella delle stazioni con l'ago rosso (di notte accesa),
  //  le due manopole marroni, la maniglia di cuoio; dietro il pannello coi buchi e il filo
  // =========================================================
  def("radio", { tipo: "sopra", nome: "Radio vintage", fp: [1, 1], box: [-21, -22, 17, 9], dietro: true, prezzo: 500, luce: [.09, .075, 9, 30, "#ffd27a"] }, function () {
    var A0 = -.2, A1 = .2, B0 = -.075, B1 = .075, Z0 = 1, Z1 = 13, r = .05, rz = r * 61, ARA = "#e8590c";
    var PROF = [].concat(arcoS(A1 - r, Z0 + rz, r, rz, -Math.PI / 2, 0, 5), arcoS(A1 - r, Z1 - rz, r, rz, 0, Math.PI / 2, 5), arcoS(A0 + r, Z1 - rz, r, rz, Math.PI / 2, Math.PI, 5), arcoS(A0 + r, Z0 + rz, r, rz, Math.PI, Math.PI * 1.5, 5));
    var s = ombraPianta(A0, A1, B0, B1, .8, .03);
    [[A0 + .04, B0 + .03], [A1 - .04, B0 + .03], [A0 + .04, B1 - .03], [A1 - .04, B1 - .03]].sort(function (x, y) { return vicino(x[0], x[1]) - vicino(y[0], y[1]); }).forEach(function (g) { var F = forma(g[0], g[1], .016, .016, .016, 2); s += corpo([giro(F, 0, 1, 12), giro(F, Z0 + .3, 1, 12)], [[0, "#5c3a1e"], [1, "#24160b"]], .6); });   // i piedini
    function davanti(T) {   // il davanti (W × 12): l'altoparlante, la finestrella, le manopole, il filo cromato
      var W = T.W, H = T.H, o = "", i, j, cx = 7, cy = 6.3;
      o += pth(rq(.8, .8, W - 1.6, H - 1.6, 2.4), "none", "stroke='#f1f3f5' stroke-width='.5' opacity='.9'");
      var gr = cer(cx, cy, 4.5, "#ffe8cc");
      for (i = -5; i <= 5; i++) for (j = -5; j <= 5; j++) { var x = cx + i * .85 + (j % 2 ? .42 : 0), y = cy + j * .75; if ((x - cx) * (x - cx) + (y - cy) * (y - cy) < 16) gr += cer(x, y, .22, "#c9a27a"); }
      o += gr + cer(cx, cy, 1.4, ARA, "stroke='#a33c06' stroke-width='.3'") + cer(cx, cy, 4.5, "none", "stroke='#dee2e6' stroke-width='.7'") + cer(cx, cy, 4.9, "none", "stroke='#7a2e0a' stroke-width='.3'");
      var dx = 12.6, dy = 2, dw = W - 14.6, dh = 4.8;
      o += rett(dx, dy, dw, dh, .8, NOTTE ? nuovaR([[0, "#fffbea"], [.7, "#ffe9a3"], [1, "#ffcf6b"]], .5, .5, .8) : nuova([[0, "#fff9db"], [1, "#f4dc93"]], 0, 0, 0, 1), "stroke='#dee2e6' stroke-width='.6'");
      for (i = 0; i < 13; i++) o += rett(dx + .8 + i * (dw - 1.6) / 12, dy + .7, .18, i % 3 ? .8 : 1.3, 0, "#7a5a00");
      for (i = 0; i < 6; i++) o += rett(dx + 1.2 + i * (dw - 2.4) / 5.4, dy + 3.1, .9, .35, .15, "#7a5a00", op(.7));
      o += rett(dx + dw * .58, dy + .4, .3, dh - .8, .15, "#e03131") + rett(dx, dy, dw, dh * .4, .8, "#ffffff", op(.25));
      [15.6, W - 3.6].forEach(function (x) { o += cer(x + .2, 9.9, 1.5, "#000", op(.25)) + cer(x, 9.6, 1.5, nuovaR([[0, "#b8743d"], [.6, "#7a3e1d"], [1, "#3d1e0d"]], .35, .3, .8), "stroke='#2e1608' stroke-width='.35'") + cer(x, 9.6, .7, "#9a5a2a") + ell(x - .5, 9, .45, .3, "#ffffff", op(.6)); });
      return T.su(o + rett(0, 0, W, H, 0, nuova([[0, "#fff", .12], [.5, "#fff", 0]], 0, 0, 1, 1)));
    }
    function dietro(T) {   // il pannello di masonite coi buchi per il caldo e l'etichetta
      var W = T.W, H = T.H, o = rett(2.6, 1.8, W - 5.2, H - 3.6, .8, "#6b4423", "stroke='#3d2412' stroke-width='.5'"), i, j;
      for (i = 0; i < 9; i++) for (j = 0; j < 3; j++) o += cer(5 + i * 1.6, 3.4 + j * 1.5, .4, "#2b190b");
      return T.su(o + rett(W - 9.4, 6.6, 5.4, 3.4, .3, "#f1ece2") + rett(W - 8.8, 7.4, 3, .35, 0, "#868e96") + rett(W - 8.8, 8.3, 4.2, .3, 0, "#adb5bd"));
    }
    function fascia(H) { return tratto(aperto(H.sez(B1 - .012)), "#f8f9fa", .7, op(.8)) + H.luccica(.55, .12, .88); }
    s += estruso("b", PROF, B0, B1, ARA, { mat: { lucido: .6, esp: 18 }, tappo: G > 0 ? davanti : dietro, fascia: fascia, lw: 1.8 });
    // la maniglia di cuoio sui due attacchi cromati
    var man = [], k;
    for (k = 0; k <= 12; k++) { var t = k / 12, aa = -.14 + .28 * t; man.push(P(aa, 0, Z1 + .4 + 4.6 * Math.sin(Math.PI * t))); }
    [-.14, .14].forEach(function (a) { var m = P(a, 0, Z1); s += ell(m[0], m[1], 1.6, .8, nuovaR(CROMO, .35, .3, .8), bordo(L, .4)); });
    s += tratto(aperto(man), L, 2.8) + tratto(aperto(man), "#8a4b22", 1.8) + tratto(aperto(man), "#c98a55", .5, "transform='translate(0 -.5)'");
    if (G < 0) s += tratto("M" + q(P(.12, B0, 3)) + " C" + q(P(.12, B0 - .03, 1)) + " " + q(P(.14, B0 - .05, 0)) + " " + q(P(.2, -.17, 0)), "#16161a", 1);   // il filo
    return s;
  });

  // =========================================================
  function misure(d) { var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  var pacco = {
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: "tutte", reparto: "elettronica", w: m.w, h: m.h, ax: m.ax, ay: m.ay, fp: d.fp.slice(), dietro: !!d.dietro, prezzo: d.prezzo, qual: 2 };
      if (d.piano) o.piano = d.piano;
      if (d.luce) { var l = d.luce, pt = Puv(l[0], l[1], l[2]); o.luce = [Math.round(pt[0] + m.ax), Math.round(pt[1] + m.ay), l[3], l[4]]; }   // il punto della luce nel disegno davanti
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "gio" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!opz.notte;
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "") +
        "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  };
  if (window.SGMobiliArte) window.SGMobiliArte.aggiungi(pacco);
})();

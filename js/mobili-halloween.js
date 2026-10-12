/* =========================================================
   SPeeD GAME — HALLOWEEN (vista dall'alto, come il bagno di js/mobili-arte.js)
   In piedi: calderone della strega, fantasmino, lapide finta, scopa della strega, pila di zucche.
   Piccoli da appoggiare sopra: candelabro, cappello da strega, gatto nero, zucca intagliata.
   Da parete: pipistrelli (due pezzi di muro), ragnatela col ragno, scheletro che dondola. A terra: tappeto ragnatela.
   Gli stessi oggetti della casa vista di lato (casa.js), stessi nomi e prezzi; si vendono solo nei giorni di Halloween.
   Divertenti e un po' paurosi, ma da cartone. Quelli che fanno luce (zucche, calderone, candelabro) hanno info().luce
   e con opz.notte si disegnano accesi.
   Misure: una mattonella è un rombo largo 100 e alto 50 (circa 1 metro); in altezza 61 unità ≈ 1 metro.
   Si aggiunge a SGMobiliArte con SGMobiliArte.aggiungi({ nomi, info, svg }).
   ========================================================= */
(function () {
  "use strict";
  if (!window.SGMobiliArte) return;

  // ---------- attrezzi (come nel bagno) ----------
  var nId = 0, p = "", DEFS = [], FATTI = {}, nC = 0, G = 1, NOTTE = false;   // il disegno in corso: prefisso degli id, definizioni; G = 1 davanti, -1 girato; NOTTE = acceso
  var L = "#3d2b22";   // il contorno caldo e scuro
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function f1(n) { return Math.round(n * 10) / 10; }
  function q(x, y) { if (typeof x === "object") { y = x[1]; x = x[0]; } return f1(x) + "," + f1(y); }
  function pts(a) { return a.map(function (x) { return q(x); }).join(" "); }
  function attr(x) { return x ? " " + x : ""; }
  function op(o) { return "opacity='" + Math.round(o * 100) / 100 + "'"; }
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
  function gira(g, x, y) { return "transform='rotate(" + f1(g) + " " + f1(x) + " " + f1(y) + ")'"; }
  // i colori
  function hx(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function mix(a, b, t) { var x = hx(a), y = hx(b); return "#" + x.map(function (v, i) { var r = Math.round(v + (y[i] - v) * t); return (r < 16 ? "0" : "") + r.toString(16); }).join(""); }
  function chiaro(c, t) { return mix(c, "#ffffff", t); }
  function scuro(c, t) { return mix(c, "#000000", t); }
  // sfumature e ritagli (gli id col prefisso del disegno; quelle "sul posto" hanno anche un numero)
  function sfum(tag, nome, stops, a) {
    var id = p + nome;
    if (!FATTI[id]) {
      FATTI[id] = 1;
      DEFS.push("<" + tag + " id='" + id + "' " + a + ">" + stops.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join("") + "</" + tag + ">");
    }
    return "url(#" + id + ")";
  }
  function lin(nome, stops, x1, y1, x2, y2, user) { return sfum("linearGradient", user ? nome + (++nC) : nome, stops, "x1='" + f1(x1) + "' y1='" + f1(y1) + "' x2='" + f1(x2) + "' y2='" + f1(y2) + "'" + (user ? " gradientUnits='userSpaceOnUse'" : "")); }
  function rad(nome, stops, cx, cy, r) { return sfum("radialGradient", nome, stops, "cx='" + cx + "' cy='" + cy + "' r='" + r + "'"); }
  function radU(nome, stops, cx, cy, r) { return sfum("radialGradient", nome + (++nC), stops, "cx='" + f1(cx) + "' cy='" + f1(cy) + "' r='" + f1(r) + "' gradientUnits='userSpaceOnUse'"); }   // radiale sul posto
  function dentro(forma, corpo) {   // corpo ritagliato dentro la forma (un tracciato "d")
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'><path d='" + forma + "'/></clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  function dentroTanti(forme, corpo) {   // corpo ritagliato dentro l'unione di più forme
    var id = p + "r" + (++nC);
    DEFS.push("<clipPath id='" + id + "'>" + forme.map(function (f) { return "<path d='" + f + "'/>"; }).join("") + "</clipPath>");
    return "<g clip-path='url(#" + id + ")'>" + corpo + "</g>";
  }
  function ombra(x, y, rx, ry, k) {   // l'ombra morbida a terra (la luce viene da in alto a sinistra: l'ombra scivola un po' a destra)
    return ell(x, y, rx, ry, rad("om", [[0, "#000", .2], [.6, "#000", .15], [1, "#000", 0]], .5, .5, .5), k ? op(k) : "");
  }
  var FERRO = [[0, "#8a8794"], [.22, "#55525e"], [.6, "#2a2830"], [1, "#141217"]];   // il ferro nero battuto
  var ORO = [[0, "#fff1b8"], [.4, "#f2c94c"], [1, "#a8781a"]];

  // ---------- la vista: dal mobile (a = larghezza, b = profondità con b+ = davanti, z = altezza) allo schermo ----------
  function Puv(u, v, z) { return [(u - v) * 50, (u + v) * 25 - (z || 0)]; }
  function P(a, b, z) { return Puv(a * G, b * G, z); }
  function vicino(a, b) { return G * (a + b); }   // più è grande, più la cosa è vicina a chi guarda (si disegna dopo)
  function ordina(l) { return l.sort(function (x, y) { return x[0] - y[0]; }).map(function (x) { return x[1]; }).join(""); }
  function forma(ca, cb, ra, rf, rr, e) { return { ca: ca, cb: cb, ra: ra, rf: rf, rr: rr == null ? rf : rr, e: e || 2 }; }
  function giro(F, z, k, n, db) {   // i punti sullo schermo del bordo della forma all'altezza z (k = grandezza, anche [ka, kb])
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
  function sagoma(livelli) { return inviluppo([].concat.apply([], livelli)); }
  function lucido(pp, k, alto) {   // il riflesso bianco, vicino al bordo di sinistra (da dove viene la luce)
    var b = limiti(pp), w = b[2] - b[0], h = b[3] - b[1];
    return dentro(chiuso(pp), ell(b[0] + w * .19, b[1] + h * (alto || .5), Math.max(1.6, w * .05), h * .3, "#ffffff", op(k || .7)));
  }
  // un cerchio in pianta (centro c = [a, b, z], raggio rho) e un tubo che passa per tanti cerchi: prima tutti i contorni, poi tutti i pieni
  function anello(c, rho, n) { var o = [], k; n = n || 16; for (k = 0; k < n; k++) { var t = k / n * 6.2832; o.push(P(c[0] + rho * Math.cos(t), c[1] + rho * Math.sin(t), c[2])); } return o; }
  function tubo(pp, rr, stops, lw) {
    var segs = [], tutti = [], i;
    function ra(i) { return typeof rr === "number" ? rr : rr[i]; }
    for (i = 0; i < pp.length - 1; i++) { var h = inviluppo(anello(pp[i], ra(i)).concat(anello(pp[i + 1], ra(i + 1)))); segs.push(h); tutti = tutti.concat(h); }
    var b = limiti(tutti), g = lin("tb", stops, b[0], 0, b[2], 0, true);
    return segs.map(function (h) { return pth(chiuso(h), L, bordo(L, lw || 2.2)); }).join("") + segs.map(function (h) { return pth(chiuso(h), g); }).join("");
  }
  // un tubo che piega in tutte le direzioni: i cerchi stanno di traverso al tubo (per la punta storta del cappello)
  function tuboStorto(pp, rr, stops, lw) {
    var segs = [], tutti = [], i, ri = [];
    for (i = 0; i < pp.length; i++) {
      var a = pp[Math.max(0, i - 1)], b = pp[Math.min(pp.length - 1, i + 1)], T = [b[0] - a[0], b[1] - a[1], (b[2] - a[2]) / 61], n = Math.hypot(T[0], T[1], T[2]) || 1; T = [T[0] / n, T[1] / n, T[2] / n];
      var h = Math.abs(T[2]) > .9 ? [1, 0, 0] : [0, 0, 1], N1 = [T[1] * h[2] - T[2] * h[1], T[2] * h[0] - T[0] * h[2], T[0] * h[1] - T[1] * h[0]], m = Math.hypot(N1[0], N1[1], N1[2]); N1 = [N1[0] / m, N1[1] / m, N1[2] / m];
      var N2 = [T[1] * N1[2] - T[2] * N1[1], T[2] * N1[0] - T[0] * N1[2], T[0] * N1[1] - T[1] * N1[0]], rho = typeof rr === "number" ? rr : rr[i], o = [], k;
      for (k = 0; k < 18; k++) { var t = k / 18 * 6.2832, c = Math.cos(t) * rho, s = Math.sin(t) * rho; o.push(P(pp[i][0] + c * N1[0] + s * N2[0], pp[i][1] + c * N1[1] + s * N2[1], pp[i][2] + 61 * (c * N1[2] + s * N2[2]))); }
      ri.push(o);
    }
    for (i = 0; i < ri.length - 1; i++) { var hh = inviluppo(ri[i].concat(ri[i + 1])); segs.push(hh); tutti = tutti.concat(hh); }
    var bb = limiti(tutti), g = lin("ts", stops, bb[0], bb[1], bb[2], bb[1] + (bb[2] - bb[0]) * .3, true);
    return { s: segs.map(function (x) { return pth(chiuso(x), L, bordo(L, lw || 2.2)); }).join("") + segs.map(function (x) { return pth(chiuso(x), g); }).join(""), sil: segs, b: bb };
  }
  // un ellissoide (centro c = [a, b, z]; semiassi: ar verso fuori lungo l'angolo phi, at di traverso, az in su; alfa = inclinato verso l'alto)
  function ellissoide(c, phi, ar, at, az, alfa) {
    var o = [], i, k, ca = Math.cos(alfa || 0), sa = Math.sin(alfa || 0);
    for (i = 0; i <= 8; i++) {
      var la = -1.5708 + i / 8 * 3.1416, w = Math.cos(la), zl = Math.sin(la);
      for (k = 0; k < 18; k++) {
        var t = k / 18 * 6.2832, xr = Math.cos(t) * w * ar, xt = Math.sin(t) * w * at, xz = zl * az;
        var r2 = xr * ca - xz / 61 * sa, z2 = xr * 61 * sa + xz * ca;   // girato nel piano verticale
        o.push(P(c[0] + r2 * Math.cos(phi) - xt * Math.sin(phi), c[1] + r2 * Math.sin(phi) + xt * Math.cos(phi), c[2] + z2));
      }
    }
    return inviluppo(o);
  }
  // un disegno piatto appoggiato su una superficie tonda che guarda verso l'angolo phi (nel mobile): x verso destra, y in giù
  function sulTondo(c, phi, k, corpo) {
    var fs = phi + (G < 0 ? Math.PI : 0), xa = (Math.sin(fs) + Math.cos(fs)) * 50 / 61 * k, xb = (Math.sin(fs) - Math.cos(fs)) * 25 / 61 * k;
    return "<g transform='matrix(" + [xa, xb, 0, k, c[0], c[1]].map(function (v) { return Math.round(v * 1000) / 1000; }).join(" ") + ")'>" + corpo + "</g>";
  }
  function guarda(phi) { var fs = phi + (G < 0 ? Math.PI : 0); return Math.cos(fs) + Math.sin(fs); }   // > 0: quella parte guarda verso di te
  function arco(pp, a0, a1) {   // i punti di un anello sullo schermo tra gli angoli a0 e a1 (gradi: 0 = a destra, 90 = in basso, 180 = a sinistra)
    var b = limiti(pp), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, rx = (b[2] - b[0]) / 2 || 1, ry = (b[3] - b[1]) / 2 || 1;
    return pp.map(function (x) { var a = Math.atan2((x[1] - cy) / ry, (x[0] - cx) / rx) * 57.296; while (a < a0) a += 360; return [a, x]; })
      .filter(function (x) { return x[0] <= a1; }).sort(function (m, n) { return m[0] - n[0]; }).map(function (x) { return x[1]; });
  }

  // ---------- i mobili squadrati e le lastre (dal bagno e dalla camera) ----------
  function faccia(o, dir, c) { return "<g transform='matrix(.8197 " + (dir > 0 ? ".4098" : "-.4098") + " 0 1 " + f1(o[0]) + " " + f1(o[1]) + ")'>" + c + "</g>"; }
  function tinte(c) {   // i tre colori: sopra, la faccia di sinistra (alla luce), quella di destra (in ombra)
    if (typeof c !== "string") return c;
    var k = c.slice(1);
    return [lin("ts" + k, [[0, chiaro(c, .32)], [1, chiaro(c, .1)]], 0, 0, 1, 1), lin("tl" + k, [[0, chiaro(c, .12)], [1, scuro(c, .06)]], 0, 0, 0, 1), lin("td" + k, [[0, scuro(c, .2)], [1, scuro(c, .34)]], 0, 0, 0, 1)];
  }
  // una lastra in piedi: il bordo di sopra segue il profilo zt(a), uguale ai due lati
  function lastra(a0, a1, b0, b1, z0, zt, col, f, lw) {
    f = f || {};
    var u0 = G > 0 ? a0 : -a1, u1 = G > 0 ? a1 : -a0, v0 = G > 0 ? b0 : -b1, v1 = G > 0 ? b1 : -b0, c = tinte(col), n = 28, i, zm = 0;
    function za(u) { return zt(G > 0 ? u : -u); }
    for (i = 0; i <= n; i++) zm = Math.max(zm, za(u0 + (u1 - u0) * i / n));
    var Ws = (u1 - u0) * 61, Wd = (v1 - v0) * 61, H = zm - z0, fs = G > 0 ? f.davanti : f.dietro, pr = [], tF = [], tB = [];
    for (i = 0; i <= n; i++) { var u = u0 + (u1 - u0) * i / n; pr.push([Ws * i / n, zm - za(u)]); tF.push(Puv(u, v1, za(u))); tB.push(Puv(u, v0, za(u))); }
    var sag = "M0," + f1(H) + " L" + pr.map(function (x) { return q(x); }).join(" L") + " L" + f1(Ws) + "," + f1(H) + " Z";
    var zE = za(u1), s = faccia(Puv(u0, v1, zm), 1, pth(sag, c[1]) + (fs ? dentro(sag, fs(Ws, H, pr)) : ""));
    s += faccia(Puv(u1, v1, zE), -1, rett(0, 0, Wd, zE - z0, 0, c[2]) + (f.fianco ? f.fianco(Wd, zE - z0) : ""));
    s += poly(tF.concat(tB.slice().reverse()), c[0]) + (f.sopra ? dentro(chiuso(tF.concat(tB.slice().reverse())), f.sopra(tF, tB)) : "");
    s += tratto(aperto(tF), L, 1.1, "opacity='.8'") + tratto(linea(Puv(u1, v1, zE), Puv(u1, v1, z0)), L, 1.1, "opacity='.8'");
    s += tratto(aperto(tF.map(function (x) { return [x[0] + .3, x[1] + 1.3]; })), "#ffffff", 1, "opacity='.5'");
    var fuori = inviluppo([Puv(u0, v1, z0), Puv(u1, v1, z0), Puv(u1, v0, z0), Puv(u0, v0, z0)].concat(tF, tB));   // la lastra è convessa: il contorno è l'involucro
    return s + poly(fuori, "none", bordo(L, lw || 2.3));
  }

  // il registro: box = [x0, y0, x1, y1] attorno al centro dell'impronta (uguale davanti e dietro); luce = [x, y, raggio, colore] dal centro
  var DIS = {};
  function def(nome, d, fn) { d.fn = fn; DIS[nome] = d; }

  // =========================================================
  //  LA ZUCCA: gli spicchi (ellissoidi in cerchio) da dietro in avanti, il picciolo, il coperchio tagliato, la faccia intagliata
  //  o = { a, b, z0, R, H, c, n, seme, giro, faccia: { tipo, phi, z, k }, coperchio, picciolo: { h, piega }, ricciolo, foglia }
  // =========================================================
  var FACCE = [
    {   // 0: gli occhi a triangolo un po' furbi e il sorrisone coi denti (come la zucca della casa)
      buchi: ["M-8.4,-2.6 L-4.2,-8.4 L-1.8,-1.8 Z", "M8.4,-2.6 L4.2,-8.4 L1.8,-1.8 Z", "M-1.4,1.6 L0,-.6 L1.4,1.6 Z",
        "M-10,3.4 Q0,13.6 10,3.4 L7,4.6 L5.2,8 L2.6,5.2 L0,8.4 L-2.6,5.2 L-5.2,8 L-7,4.6 Z"]
    },
    {   // 1: gli occhi a mezzaluna contenti e la bocca larga con un dente solo
      buchi: ["M-8.6,-3 Q-5.4,-8.6 -2.2,-3 Q-5.4,-5.2 -8.6,-3 Z", "M8.6,-3 Q5.4,-8.6 2.2,-3 Q5.4,-5.2 8.6,-3 Z",
        "M-9.4,2.6 Q0,6 9.4,2.6 Q7.6,11.4 0,11.8 Q-7.6,11.4 -9.4,2.6 Z M-1.6,4.4 L1.6,4.4 L1.6,7.4 L-1.6,7.4 Z"]
    },
    {   // 2: la faccia spaventata: gli occhi tondi e la bocca a O
      buchi: ["M-8,-4.2 A3.2,3.6 0 1,0 -1.6,-4.2 A3.2,3.6 0 1,0 -8,-4.2 Z", "M8,-4.2 A3.2,3.6 0 1,1 1.6,-4.2 A3.2,3.6 0 1,1 8,-4.2 Z",
        "M-3.2,6.6 A3.2,4 0 1,0 3.2,6.6 A3.2,4 0 1,0 -3.2,6.6 Z"]
    }
  ];
  function intaglio(tipo, k) {   // i buchi della faccia: di giorno scuri con la polpa gialla sul taglio, di notte accesi dalla candela dentro
    var F = FACCE[tipo || 0], s = "", tutti = F.buchi.join(" ");
    var polpa = NOTTE ? "#ffd35c" : "#ffb347", fondo = NOTTE ? rad("fl", [[0, "#ffffff"], [.35, "#fff3a6"], [.75, "#ffd43b"], [1, "#ff9f1c"]], .5, .45, .7) : rad("fb", [[0, "#8a3f12"], [.6, "#5a230a"], [1, "#3a1405"]], .5, .7, .7);
    s += pth(tutti, polpa, bordo(L, 1.1 / k));   // il taglio (lo spessore della buccia, chiaro)
    s += dentro(tutti, pth(tutti, fondo, "transform='translate(-.7 -.9)'"));   // dentro: la polpa resta in basso a destra
    if (NOTTE) s += dentro(tutti, ell(0, 9, 10, 4, "#ffffff", op(.5)));   // la fiamma che illumina il fondo
    return s;
  }
  function zuccaSvg(o) {
    var n = o.n || 8, r = rnd(o.seme || 7), s = "", sp = [], tutti = [], i, k, c = o.c;
    var d = o.R * .46, rr = o.R * .56, rt = o.R * Math.PI / n * 1.25, rz = o.H / 2, zc = o.z0 + rz;
    for (i = 0; i < n; i++) {
      var fo = (i + .5) / n * 6.2832 + (o.giro || 0), fs = fo + (G < 0 ? Math.PI : 0), pp = [], lz;
      var ca = o.a + d * Math.cos(fo), cb = o.b + d * Math.sin(fo), rri = rr * (.95 + r() * .1), rzi = rz * (.94 + r() * .07);
      for (lz = -1; lz <= 1.001; lz += .2) {
        var w = Math.sqrt(Math.max(0, 1 - lz * lz)), zl = zc + lz * rzi - (lz > .6 ? (lz - .6) * rz * .25 : 0);   // in cima lo spicchio scende un po' verso il picciolo
        for (k = 0; k < 22; k++) { var t = k / 22 * 6.2832, xr = Math.cos(t) * rri * w, xt = Math.sin(t) * rt * w; pp.push(P(ca + xr * Math.cos(fo) - xt * Math.sin(fo), cb + xr * Math.sin(fo) + xt * Math.cos(fo), zl)); }
      }
      var h = inviluppo(pp); tutti = tutti.concat(h);
      sp.push({ dep: Math.cos(fs) + Math.sin(fs), h: h, lu: (Math.sin(fs) - Math.cos(fs)) / 1.414, v: r() });
    }
    sp.sort(function (x, y) { return x.dep - y.dep; });
    var sil = inviluppo(tutti), b = limiti(sil), cen = P(o.a, o.b, o.z0 + o.H * .97);
    s += pth(chiuso(sil), scuro(c, .3));   // il fondo (si vede tra gli spicchi dietro)
    sp.forEach(function (x) {
      var base = mix(scuro(c, .2), chiaro(c, .16), Math.max(0, Math.min(1, .55 + .45 * x.lu + (x.v - .5) * .1))), bb = limiti(x.h);
      var g = radU("sp", [[0, chiaro(base, .42)], [.45, base], [1, scuro(base, .28)]], bb[0] + (bb[2] - bb[0]) * .36, bb[1] + (bb[3] - bb[1]) * .3, Math.max(bb[2] - bb[0], bb[3] - bb[1]) * .72);
      s += pth(chiuso(x.h), g, "stroke='" + scuro(c, .5) + "' stroke-width='.9' stroke-linejoin='round' opacity='.98'");
      if (x.dep > -.4) s += dentro(chiuso(x.h), ell(bb[0] + (bb[2] - bb[0]) * .33, bb[1] + (bb[3] - bb[1]) * .42, (bb[2] - bb[0]) * .1, (bb[3] - bb[1]) * .26, "#ffffff", op(.22 + .14 * Math.max(0, x.lu))));   // la lucentezza di ogni spicchio
    });
    s += ell(cen[0], cen[1] + 1, o.R * 18, o.R * 9, scuro(c, .45), op(.55));   // l'incavo in cima, attorno al picciolo
    if (o.coperchio) {   // il coperchio tagliato a zig-zag: di notte la luce esce dal taglio
      var cz = [], rl = o.R * .42;
      for (k = 0; k <= 36; k++) { var tt = k / 36 * 6.2832, rk = rl * (k % 2 ? 1.16 : .9); cz.push(P(o.a + rk * Math.cos(tt), o.b + rk * Math.sin(tt), o.z0 + o.H * .97 - 1.5)); }
      s += NOTTE ? tratto(chiuso(cz), "#ff9f1c", 2) + tratto(chiuso(cz), "#fff3a6", .9) : tratto(chiuso(cz), "#5a230a", 1.1, op(.85)) + tratto(chiuso(cz.map(function (x) { return [x[0] + .4, x[1] + .6]; })), "#ffc078", .5, op(.7));
    }
    if (o.faccia && G > 0) {   // la faccia intagliata (sul davanti: da dietro non si vede)
      var fc = o.faccia, Rf = (d + rr) * .97, fp = P(o.a + Rf * Math.cos(fc.phi), o.b + Rf * Math.sin(fc.phi), o.z0 + (fc.z != null ? fc.z : o.H * .5));
      s += dentro(chiuso(sil), (NOTTE ? cer(fp[0], fp[1] + 1, o.R * 75, radU("ag", [[0, "#ffe680", .75], [.5, "#ffb030", .35], [1, "#ff922b", 0]], fp[0], fp[1] + 1, o.R * 75)) : "") + sulTondo(fp, fc.phi, fc.k * o.R / .19, intaglio(fc.tipo, fc.k * o.R / .19)));   // di notte la buccia sottile si accende attorno alla faccia
    }
    s += pth(chiuso(sil), "none", bordo(L, 1.9));
    // il picciolo: un tubo storto, verde scuro e legnoso, con la cima secca
    var ph = (o.picciolo && o.picciolo.h) || 6, pg = (o.picciolo && o.picciolo.piega) || 1, rp = o.R * .17, z1 = o.z0 + o.H * .93, cp = [];
    for (k = 0; k <= 4; k++) { var tk = k / 4; cp.push([o.a + pg * .022 * tk * tk * o.R / .19, o.b - .012 * tk, z1 + ph * tk]); }
    s += tubo(cp, [rp * 1.35, rp * 1.05, rp * .95, rp * .9, rp * .85], [[0, "#9ccf6a"], [.4, "#5f9a3a"], [1, "#2f5a1e"]], 1.8);
    var ct = cp[cp.length - 1], tp = anello(ct, rp * .85, 14);
    s += pth(chiuso(tp), rad("pc", [[0, "#e6d6a0"], [.6, "#b59a5a"], [1, "#7a6232"]], .45, .45, .6), bordo(L, .8));
    [-.5, .35].forEach(function (t) { var a1 = P(cp[0][0] + rp * Math.cos(t + 1.6), cp[0][1] + rp * Math.sin(t + 1.6), cp[0][2] + 1), a2 = P(ct[0] + rp * .8 * Math.cos(t + 1.6), ct[1] + rp * .8 * Math.sin(t + 1.6), ct[2] - 1); s += tratto(linea(a1, a2), "#2f5a1e", .7, op(.6)); });   // le costole del picciolo
    if (o.ricciolo) {   // il viticcio arricciato
      var v0 = P(cp[1][0], cp[1][1], cp[1][2]), dv = "M" + q(v0), j;
      for (j = 1; j <= 26; j++) { var tj = j / 26, an = tj * 9.5, ra = 2 + tj * 5.5 * o.R / .19; dv += " L" + q(v0[0] + (o.ricciolo > 0 ? 1 : -1) * (tj * 11 * o.R / .19 + Math.cos(an) * ra * .5), v0[1] - tj * 3 + Math.sin(an) * ra * .45); }
      s += tratto(dv, L, 2.2) + tratto(dv, "#6fb53f", 1);
    }
    if (o.foglia) {   // una foglia di zucca, a cinque punte, appoggiata
      var fz = P(o.a + o.foglia[0], o.b + o.foglia[1], o.z0 + o.H * .9), fd = "M0,0 C-3,-1 -6,-4 -5,-8 L-3,-7 C-3,-10 -1,-12 1,-12 L1.6,-9.6 C3,-11 6,-10 6.6,-7.6 L4.6,-6.6 C7,-5 7,-2 5,0 Z";
      s += "<g transform='translate(" + f1(fz[0]) + " " + f1(fz[1]) + ") rotate(" + (o.foglia[2] || 0) + ") scale(" + (o.foglia[3] || 1) + " " + f1((o.foglia[3] || 1) * .7) + ")'>" + pth(fd, lin("fo", [[0, "#94d36a"], [1, "#3f8a2a"]], 0, 0, 1, 1), bordo(L, 1.1)) + tratto("M0,0 L0,-9 M0,-4 L-3.4,-6.6 M0,-4 L3.8,-5.6", "#2f6b1e", .6) + "</g>";
    }
    return s;
  }

  // =========================================================
  //  ZUCCA INTAGLIATA (piccola, da appoggiare): arancione a spicchi, il picciolo col viticcio, gli occhi furbi e il sorrisone coi denti
  // =========================================================
  def("zucca", { tipo: "sopra", nome: "Zucca intagliata", fp: [1, 1], box: [-20, -36, 20, 12], dietro: true, prezzo: 300, luce: [-4, -10, 70, "#ff922b"] }, function () {
    return ombra(2, 2, 18, 7.5) + zuccaSvg({ a: 0, b: 0, z0: 0, R: .2, H: 21, c: "#f76707", n: 8, seme: 3, faccia: { tipo: 0, phi: .95, z: 11.5, k: .7 }, coperchio: true, picciolo: { h: 6.5, piega: 1 }, ricciolo: 1 });
  });

  // =========================================================
  //  CALDERONE DELLA STREGA: la pancia di ferro nero sulle zampette, il fuoco di ceppi sotto, la pozione verde che bolle
  //  (le bolle, il vapore, un occhio che galleggia), il mestolo di legno, la bava verde che cola dal bordo, i due anelli
  // =========================================================
  def("calderone", { tipo: "piedi", nome: "Calderone della strega", fp: [1, 1], box: [-36, -76, 44, 26], dietro: true, prezzo: 1200, luce: [0, -46, 95, "#8ce99a"] }, function () {
    var s = ombra(4, 6, 38, 17), r = rnd(41), i, k;
    var ZB = 13, R = .29, F = forma(0, 0, R, R, R);   // ZB = dove comincia la pancia (sopra le zampe e il fuoco)
    var prof = [[0, .5], [3, .74], [8, .92], [14, 1], [21, .97], [27, .87], [31, .8]];   // la pancia: altezza sopra ZB e grandezza
    var ZL = ZB + 31, ZT = ZL + 4.5, ZQ = ZT - 2.6;   // il collo, la cima del labbro, la pozione
    var BAVA = NOTTE ? [[0, "#f4fff5"], [.4, "#a9f5b4"], [1, "#2f9e44"]] : [[0, "#c3fac8"], [.45, "#51cf66"], [1, "#237a33"]];
    function fiamma(x, y, h, w, g) {   // una lingua di fuoco (x, y = la base sullo schermo)
      var d = "M" + q(x - w, y) + " C" + q(x - w * 1.1, y - h * .45) + " " + q(x - w * .2, y - h * .6) + " " + q(x + w * .15 * g, y - h) + " C" + q(x + w * .5, y - h * .55) + " " + q(x + w * 1.1, y - h * .4) + " " + q(x + w, y) + " Z";
      var d2 = "M" + q(x - w * .55, y) + " C" + q(x - w * .6, y - h * .35) + " " + q(x, y - h * .45) + " " + q(x + w * .1 * g, y - h * .7) + " C" + q(x + w * .35, y - h * .4) + " " + q(x + w * .6, y - h * .3) + " " + q(x + w * .55, y) + " Z";
      return pth(d, NOTTE ? "#ffb03a" : "#ff7a1a", bordo(NOTTE ? "#c2410c" : "#9a3412", .9)) + pth(d2, NOTTE ? "#fff7c2" : "#ffd43b") + ell(x, y - h * .14, w * .32, h * .1, NOTTE ? "#ffffff" : "#fff3bf", op(.9));
    }
    function ceppo(f, r0, r1, rho) {   // un ceppo per terra lungo l'angolo f (da r0 a r1 dal centro)
      var dx = Math.cos(f), dy = Math.sin(f), pa = [], pb = [], t;
      for (t = 0; t < 18; t++) { var an = t / 18 * 6.2832, ox = -dy * Math.cos(an) * rho, oy = dx * Math.cos(an) * rho, oz = (1 + Math.sin(an)) * rho * 61; pa.push(P(dx * r0 + ox, dy * r0 + oy, oz)); pb.push(P(dx * r1 + ox, dy * r1 + oy, oz)); }
      var h = inviluppo(pa.concat(pb)), b = limiti(h), o = pth(chiuso(h), lin("cp", [[0, "#b07a48"], [.5, "#6b4022"], [1, "#3d2312"]], b[0], b[1], b[2], b[3], true), bordo(L, 1.3));
      var m1 = P(dx * (r0 + .04), dy * (r0 + .04), rho * 61 * 1.5), m2 = P(dx * (r1 - .03), dy * (r1 - .03), rho * 61 * 1.45);
      o += tratto(linea(m1, m2), "#3d2312", .7, op(.6)) + tratto(linea([m1[0], m1[1] + 2.4], [m2[0], m2[1] + 2.4]), "#e0a56a", .6, op(.45));   // la corteccia
      if (guarda(f) > 0) {   // la testa tagliata, se guarda verso di te
        var cb = limiti(pb), cx = (cb[0] + cb[2]) / 2, cy = (cb[1] + cb[3]) / 2;
        o += pth(chiuso(pb), NOTTE ? rad("cn", [[0, "#fff1a8"], [.5, "#ff922b"], [1, "#a8320c"]], .5, .5, .6) : rad("cc", [[0, "#f3d4a0"], [.7, "#d9a868"], [1, "#a8743a"]], .5, .5, .6), bordo(L, 1));
        o += ell(cx, cy, (cb[2] - cb[0]) * .26, (cb[3] - cb[1]) * .26, "none", "stroke='" + (NOTTE ? "#ffe066" : "#9a6a36") + "' stroke-width='.6'") + cer(cx, cy, .6, NOTTE ? "#ffffff" : "#7a5228");
      }
      return o;
    }
    function zampa(f) {   // una zampetta storta di ferro con il piede tondo
      var c = Math.cos(f), sn = Math.sin(f);
      return tubo([[c * .17, sn * .17, ZB + 5], [c * .23, sn * .23, ZB - 4], [c * .26, sn * .26, 2]], [.036, .03, .034], FERRO, 2) +
        (function () { var e = ellissoide([c * .27, sn * .27, 1.6], f, .05, .04, 1.8, 0); return pth(chiuso(e), lin("zp", FERRO, limiti(e)[0], 0, limiti(e)[2], 0, true), bordo(L, 1.1)); })();
    }
    function anelloLato(f) {   // l'orecchio di ferro con l'anello che pende
      var c = Math.cos(f), sn = Math.sin(f), rc = R * .985 + .05, o = "", pp = [];
      for (k = 0; k <= 24; k++) { var t = k / 24 * 6.2832; pp.push(P(c * (rc + .05 * Math.cos(t)), sn * (rc + .05 * Math.cos(t)), ZB + 19 + 3.4 * Math.sin(t))); }
      var lg = ellissoide([c * R * .99, sn * R * .99, ZB + 23.5], f, .035, .045, 2.6, 0);
      o += pth(chiuso(lg), lin("lg", FERRO, limiti(lg)[0], 0, limiti(lg)[2], 0, true), bordo(L, 1.1));
      return o + tratto(chiuso(pp), L, 3.8) + tratto(chiuso(pp), "#4a4752", 2) + tratto(chiuso(pp.slice(4, 14)).replace(" Z", ""), "#a5a2b0", .8, op(.8));
    }
    // le zampe e il fuoco dietro la pancia
    var zampe = [1.83, 3.93, 6.02].map(function (f) { return { f: f, d: guarda(f) }; });   // tre zampe: davanti resta aperto e si vede il fuoco
    zampe.forEach(function (z) { if (z.d < 0) s += zampa(z.f); });
    var ce = [[.45, .03, .27], [2.6, .03, .26], [4.6, .04, .27]].map(function (c) { return [guarda(c[0]), ceppo(c[0], c[1], c[2], .04)]; });
    s += ordina(ce.filter(function (c) { return c[0] <= 0; }));
    var fo = P(0, 0, 0);
    s += ell(fo[0], fo[1], 22, 10, rad("bg", [[0, "#ffd43b", NOTTE ? .85 : .5], [.5, "#ff922b", NOTTE ? .45 : .22], [1, "#ff922b", 0]], .5, .5, .5));   // il bagliore a terra
    s += fiamma(fo[0] - 6, fo[1] + 1, 11, 3.2, 1) + fiamma(fo[0] + 5, fo[1] + 1.5, 12, 3.4, -1) + fiamma(fo[0] - .5, fo[1] + 2, 17, 4.4, 1);
    s += ordina(ce.filter(function (c) { return c[0] > 0; }));
    // gli anelli dietro
    [0, Math.PI].forEach(function (f) { if (guarda(f) < 0) s += anelloLato(f); });
    // la pancia
    var lv = prof.map(function (x) { return giro(F, ZB + x[0], x[1], 48); }), sil = sagoma(lv), b = limiti(sil);
    s += corpo(lv, FERRO, 2.4) + lucido(sil, .45, .45);
    var cin = arco(giro(F, ZB + 14, 1.012, 48), -4, 184);   // la costola in rilievo attorno alla pancia (solo il davanti)
    s += tratto(aperto(cin), "#141217", 2.4) + tratto(aperto(cin.map(function (x) { return [x[0], x[1] - 1.1]; })), "#8a8794", .8, op(.7));
    s += dentro(chiuso(sil), ell(fo[0], P(0, 0, ZB)[1] + 3, 17, 7.5, rad("rf", [[0, "#ffc46b", NOTTE ? .85 : .55], [.6, "#ff922b", NOTTE ? .4 : .2], [1, "#ff922b", 0]], .5, .5, .5)) +   // il fuoco illumina il fondo
      ell(b[0] + 3, (b[1] + b[3]) / 2, 4, 12, "#ffffff", op(.08)));
    // il labbro, la bocca e la pozione
    s += corpo([giro(F, ZL - .5, .8, 48), giro(F, ZL + 2.2, .91, 48), giro(F, ZT, .88, 48)], FERRO, 2.2);
    var lab = giro(F, ZT, .88, 48), boc = giro(F, ZT, .7, 48), poz = giro(F, ZQ, .69, 48);
    s += pth(chiuso(lab), rad("lb", [[0, "#9b98a6"], [.55, "#4a4752"], [1, "#1e1c22"]], .3, .3, .8), bordo(L, 1.6));
    s += tratto(aperto(arco(lab, 150, 250)), "#c9c6d4", .9, op(.65));   // la luce sul bordo, a sinistra
    var lq = NOTTE ? [[0, "#ffffff"], [.3, "#d3f9d8"], [.7, "#69db7c"], [1, "#2b8a3e"]] : [[0, "#b2f2bb"], [.35, "#69db7c"], [.8, "#2f9e44"], [1, "#1b5e2a"]];
    var bol = "", pc = P(0, 0, ZQ);
    for (i = 0; i < 11; i++) {   // le bolle sulla pozione
      var an = r() * 6.2832, rr = Math.sqrt(r()) * .15, bp = P(rr * Math.cos(an), rr * Math.sin(an), ZQ), br = 1.1 + r() * 2.6;
      bol += r() < .25 ? ell(bp[0], bp[1], br * 1.3, br * .6, "none", "stroke='" + (NOTTE ? "#ffffff" : "#d3f9d8") + "' stroke-width='.7'") : cer(bp[0], bp[1] - br * .5, br, NOTTE ? "#ebfbee" : "#8ce99a", bordo(NOTTE ? "#69db7c" : "#2b8a3e", .7)) + cer(bp[0] - br * .35, bp[1] - br * .85, br * .3, "#ffffff", op(.9));
    }
    var occ = P(-.07, .06, ZQ);   // l'occhio che galleggia (guarda in su, a sinistra)
    bol += cer(occ[0], occ[1] - 1.4, 3.4, rad("oc", [[0, "#ffffff"], [.7, "#f1f3f5"], [1, "#c9ccd6"]], .4, .35, .7), bordo(L, .9)) + cer(occ[0] - 1, occ[1] - 2.2, 1.6, "#4dabf7", bordo("#1c5d99", .5)) + cer(occ[0] - 1.2, occ[1] - 2.4, .8, "#141217") + cer(occ[0] - 1.6, occ[1] - 2.9, .4, "#ffffff") +
      pth("M" + q(occ[0] - 3.6, occ[1] - .2) + " Q" + q(occ[0], occ[1] + 1.2) + " " + q(occ[0] + 3.6, occ[1] - .2) + " L" + q(occ[0] + 3.6, occ[1] + 2) + " L" + q(occ[0] - 3.6, occ[1] + 2) + " Z", NOTTE ? "#a9f5b4" : "#51cf66", op(.9));
    s += pth(chiuso(boc), "#141217", bordo(L, 1.2)) + dentro(chiuso(boc), pth(chiuso(poz), lin("pz", lq, 0, 0, .3, 1), bordo(NOTTE ? "#8ce99a" : "#237a33", .8)) + bol +
      (NOTTE ? ell(pc[0], pc[1], 16, 7, rad("pl", [[0, "#ffffff", .7], [1, "#ffffff", 0]], .5, .5, .5)) : ""));
    // il mestolo di legno appoggiato al bordo, coi cerchi dell'acqua attorno
    var m0 = [.07, -.08, ZQ], m1 = [.15, -.19, ZT + 6], m2 = [.21, -.275, ZT + 19], mp = P(m0[0], m0[1], m0[2]);
    s += ell(mp[0], mp[1], 4.6, 2, "none", "stroke='" + (NOTTE ? "#ffffff" : "#c3fac8") + "' stroke-width='.8' " + op(.8));
    s += tubo([m0, m1, m2], [.017, .016, .015], [[0, "#e8b77a"], [.45, "#b07a48"], [1, "#6b4022"]], 1.8);
    var mt = P(m2[0], m2[1], m2[2]); s += ell(mt[0], mt[1], 1.9, 1.2, "#e8c08a", bordo(L, .8));
    // la bava verde che cola dal labbro
    [[1.75, 9], [1.05, 6], [5.3, 7]].forEach(function (c) {
      if (guarda(c[0]) < .05) return;
      var t0 = P(R * .9 * Math.cos(c[0]), R * .9 * Math.sin(c[0]), ZT - .5), h = c[1], w = 2.2;
      var d = "M" + q(t0[0] - w * 1.3, t0[1] - 1) + " Q" + q(t0[0] - w, t0[1] + h * .5) + " " + q(t0[0] - w * .55, t0[1] + h) + " A" + f1(w * .9) + "," + f1(w * .9) + " 0 1,0 " + q(t0[0] + w * .55, t0[1] + h) + " Q" + q(t0[0] + w * .9, t0[1] + h * .45) + " " + q(t0[0] + w * 1.4, t0[1] - 1) + " Z";
      s += pth(d, lin("bv", BAVA, 0, 0, 1, 0), bordo(L, 1)) + ell(t0[0] - w * .5, t0[1] + h * .55, .5, h * .25, "#ffffff", op(.7));
    });
    // le bolle che salgono e il vapore
    [[-.03, .02, 6, 2], [.04, -.03, 11, 1.5], [-.01, .01, 16.5, 1.1]].forEach(function (c) { var bp = P(c[0], c[1], ZQ + c[2]); s += cer(bp[0], bp[1], c[3], NOTTE ? "#ebfbee" : "#b2f2bb", bordo(NOTTE ? "#69db7c" : "#2b8a3e", .6)) + cer(bp[0] - c[3] * .35, bp[1] - c[3] * .35, c[3] * .35, "#ffffff"); });
    var v0 = P(-.04, 0, ZQ + 4);
    s += pth("M" + q(v0[0] - 4, v0[1]) + " C" + q(v0[0] - 9, v0[1] - 7) + " " + q(v0[0] + 1, v0[1] - 11) + " " + q(v0[0] - 5, v0[1] - 19) + " C" + q(v0[0] + 3, v0[1] - 13) + " " + q(v0[0] - 3, v0[1] - 7) + " " + q(v0[0] + 3, v0[1]) + " Z", NOTTE ? "#d3f9d8" : "#e6fcf5", op(NOTTE ? .55 : .45));
    // gli anelli e le zampe davanti, poi le fiamme che leccano la pancia
    [0, Math.PI].forEach(function (f) { if (guarda(f) >= 0) s += anelloLato(f); });
    zampe.forEach(function (z) { if (z.d >= 0) s += zampa(z.f); });
    var fd = Puv(.13, .13, 0);   // davanti sullo schermo, in tutti i versi
    s += fiamma(fd[0] - 4, fd[1] + .5, 9, 2.6, 1) + fiamma(fd[0] + 4, fd[1] + 1, 7.5, 2.2, -1);
    return s;
  });

  // =========================================================
  //  FANTASMINO: il lenzuolo bianco che galleggia sopra la sua ombra, l'orlo a onde, le manine alzate,
  //  gli occhioni, la bocca a "O" e le guance rosa (da dietro solo il lenzuolo)
  // =========================================================
  def("fantasma", { tipo: "piedi", nome: "Fantasmino", fp: [1, 1], box: [-27, -72, 28, 13], dietro: true, prezzo: 900 }, function () {
    var s = ombra(2, 2, 17, 7.5, .9), i, k, z;
    var ZH = 7, ZT = 68, FI = 1.0;   // l'orlo (galleggia sopra l'ombra), la cima della testa, dove guarda la faccia
    function rag(z) {   // quanto è largo il lenzuolo all'altezza z (in mattonelle)
      if (z >= 50) return .175 * Math.sqrt(Math.max(0, 1 - Math.pow((z - 50) / (ZT - 50), 2)));
      if (z >= 16) return .175 + (50 - z) / 34 * .055;
      return .23 + (16 - z) * .0035;
    }
    function cer3(t, z) { var rr = rag(z); return P(rr * Math.cos(t), rr * Math.sin(t), z); }
    function zOrlo(t) { return ZH + 5.5 * (1 - Math.pow(Math.abs(Math.cos(3.5 * t)), .55)); }   // l'orlo a onde: giù tondo, su a punta
    var anelli = [];
    for (z = 16; z <= ZT; z += 2) anelli.push(giro(forma(0, 0, rag(z), rag(z), rag(z)), z, 1, 40));
    var su = sagoma(anelli), t0 = G > 0 ? -.7854 : 2.3562, gonna = [], n = 60;
    for (k = 0; k <= n; k++) gonna.push(cer3(t0 + k / n * 3.1416, 24));   // la gonna parte più in alto: così non si vede la giunta
    for (k = n; k >= 0; k--) { var t = t0 + k / n * 3.1416, rr = rag(zOrlo(t)); gonna.push(P(rr * Math.cos(t), rr * Math.sin(t), zOrlo(t))); }
    var tutti = su.concat(gonna), b = limiti(tutti), GL = lin("gl", [[0, "#ffffff"], [.42, "#f7f8fc"], [.78, "#dfe3f0"], [1, "#bfc6da"]], b[0], 0, b[2], 0, true);
    function manina(lato) {   // una manina alzata (un rigonfiamento del lenzuolo)
      var f = FI + lato * 1.58, c = [Math.cos(f) * (rag(36) + .025), Math.sin(f) * (rag(36) + .025), 36], e = ellissoide(c, f, .1, .042, 4.2, .95);
      return { d: guarda(f), s: pth(chiuso(e), L, bordo(L, 2.2)) + pth(chiuso(e), GL) + dentro(chiuso(e), ell(limiti(e)[0] + 3, limiti(e)[1] + 3, 2, 3.4, "#ffffff", op(.8))) };
    }
    var mani = [manina(-1), manina(1)];
    mani.forEach(function (m) { if (m.d < 0) s += m.s; });
    s += pth(chiuso(su), L, bordo(L, 2.6)) + pth(chiuso(gonna), L, bordo(L, 2.6)) + pth(chiuso(su), GL) + pth(chiuso(gonna), GL);
    // dentro il lenzuolo: le pieghe che scendono alle punte dell'orlo, l'ombra azzurrina in basso, la luce sulla testa
    var dd = "", tf = [chiuso(su), chiuso(gonna)];
    for (k = 0; k < 7; k++) {
      var tc = (k + .5) / 3.5 * 3.1416 / 1; if (guarda(tc) < .25) continue;
      var a1 = cer3(tc, 34), a2 = P(rag(zOrlo(tc)) * Math.cos(tc) * .995, rag(zOrlo(tc)) * Math.sin(tc) * .995, zOrlo(tc) + .6), m = [(a1[0] + a2[0]) / 2 + 1.5, (a1[1] + a2[1]) / 2];
      dd += "M" + q(a1) + " Q" + q(m) + " " + q(a2) + " ";
    }
    var fondo = P(0, 0, ZH);
    s += dentroTanti(tf, tratto(dd, "#c3c9dc", 1.1, op(.8)) + ell(fondo[0], fondo[1] + 2, 24, 9, rad("gb", [[0, "#aab3cc", .55], [1, "#aab3cc", 0]], .5, .5, .5)) +
      ell(b[0] + (b[2] - b[0]) * .3, b[1] + 12, 5, 7, "#ffffff", op(.95)) + ell(b[0] + (b[2] - b[0]) * .2, b[1] + 30, 2, 10, "#ffffff", op(.6)));
    // la faccia (sul davanti)
    if (G > 0) {
      var fc = cer3(FI, 46), fa = "";
      fa += ell(-6.6, -3.4, 2.9, 4.4, "#1d1a26") + ell(6.6, -3.4, 2.9, 4.4, "#1d1a26") + cer(-7.5, -5.1, 1.15, "#ffffff") + cer(5.7, -5.1, 1.15, "#ffffff") + cer(-5.9, -1.9, .5, "#ffffff") + cer(7.3, -1.9, .5, "#ffffff");
      fa += ell(0, 7, 3.4, 4.5, "#1d1a26") + dentro("M-3.4,7 A3.4,4.5 0 1,0 3.4,7 A3.4,4.5 0 1,0 -3.4,7 Z", ell(0, 10.2, 2.4, 1.8, "#ff8fab"));
      fa += ell(-11.4, 3.2, 3.1, 1.7, "#ffb3c7", op(.8)) + ell(11.4, 3.2, 3.1, 1.7, "#ffb3c7", op(.8));
      s += dentroTanti(tf, sulTondo(fc, FI, 1, fa));
    }
    mani.forEach(function (m) { if (m.d >= 0) s += m.s; });
    return s;
  });

  // =========================================================
  //  LAPIDE FINTA: la pietra grigia ad arco con "RIP" inciso e la cornice, la crepa, il muschio, sulla montagnola d'erba
  // =========================================================
  def("lapide", { tipo: "piedi", nome: "Lapide finta", fp: [1, 1], box: [-34, -60, 36, 21], dietro: true, prezzo: 400 }, function () {
    var s = ombra(4, 4, 33, 14, .9), r = rnd(77), i, PI = "#a9b0b9";
    var MG = forma(0, -.06, .37, .3, .3, 2.3), top = giro(MG, 3.2, .96, 48);
    s += corpo([giro(MG, 0, 1, 48), giro(MG, 3.2, .96, 48)], [[0, "#8cc152"], [.5, "#5f9a35"], [1, "#3c6b22"]], 1.8);
    var er = "";
    for (i = 0; i < 90; i++) {   // i fili d'erba sulla montagnola
      var a = (r() - .5) * .68, bb = -.06 + (r() - .5) * .56;
      if (a * a / .1 + (bb + .06) * (bb + .06) / .07 > 1) continue;
      var p0 = P(a, bb, 3.2), cl = r();
      er += tratto("M" + q(p0) + " l" + f1((r() - .5) * 1.8) + "," + f1(-1.4 - r() * 1.8), cl < .45 ? "#4a8526" : cl < .8 ? "#9fd65e" : "#c5ea8a", .7, op(.85));
    }
    s += pth(chiuso(top), rad("er", [[0, "#addc6d"], [.65, "#7cb646"], [1, "#5b8f31"]], .4, .35, .75), bordo(L, 1.4)) + dentro(chiuso(top), er);
    var A = .26, ZS = 30, RA = 15;
    function zt(a) { var t = Math.min(1, Math.abs(a) / A); return ZS + RA * Math.sqrt(1 - t * t); }
    function granito(W, H, seme) { var g = rnd(seme), o = "", j; for (j = 0; j < 46; j++) o += cer(g() * W, g() * H, .3 + g() * .5, g() < .55 ? "#6f7782" : "#e9edf1", op(.55)); return o; }
    function muschio(W, H, seme, quanto) {
      var g = rnd(seme), o = "", j;
      for (j = 0; j < quanto; j++) { var x = g() * W, y = H - g() * g() * 9; o += ell(x, y, 1.6 + g() * 2.6, 1 + g() * 1.4, g() < .5 ? "#7da83c" : "#a5c95a", op(.85)); }
      return o + ell(W * .14, 6.5, 3, 1.6, "#8db84a", op(.8)) + ell(W * .2, 5.2, 1.6, 1, "#b2d46a", op(.8));
    }
    function crepa(x, y, k) { var d = "M" + q(x, y) + " l" + f1(-2.6 * k) + "," + f1(3.2 * k) + " l" + f1(1.2 * k) + "," + f1(1.8 * k) + " l" + f1(-2.8 * k) + "," + f1(3.6 * k) + " m" + f1(1.6 * k) + "," + f1(-3.4 * k) + " l" + f1(2.2 * k) + "," + f1(1.4 * k); return tratto(d, "#e8ecef", 1.2, "transform='translate(.5 .6)' " + op(.8)) + tratto(d, "#4b525b", .9); }
    function fronte(W, H, pr) {
      var o = granito(W, H, 5);
      var cor = "M3.2," + f1(H - 2.5) + " L" + pr.slice(2, pr.length - 2).map(function (x) { return q(x[0], x[1] + 3.4); }).join(" L") + " L" + f1(W - 3.2) + "," + f1(H - 2.5);   // la cornice incisa che segue l'arco
      o += tratto(cor, "#eef1f4", 1.3, "transform='translate(.4 .5)' " + op(.8)) + tratto(cor, "#59616b", .9);
      // il teschietto in rilievo (le scritte no: il gioco specchia il disegno e verrebbero al contrario)
      var tx = W / 2, ty = 19, tes = "M" + q(tx - 6.4, ty + 1.5) + " C" + q(tx - 7.2, ty - 8) + " " + q(tx + 7.2, ty - 8) + " " + q(tx + 6.4, ty + 1.5) + " Q" + q(tx + 6, ty + 3.6) + " " + q(tx + 4.2, ty + 4) + " L" + q(tx + 4.2, ty + 6.8) + " Q" + q(tx, ty + 8.4) + " " + q(tx - 4.2, ty + 6.8) + " L" + q(tx - 4.2, ty + 4) + " Q" + q(tx - 6, ty + 3.6) + " " + q(tx - 6.4, ty + 1.5) + " Z";
      o += pth(tes, "#4f565f", "transform='translate(.9 1.1)' " + op(.55)) + pth(tes, lin("tz", [[0, "#eef1f4"], [1, "#b3bac3"]], 0, 0, 1, 1), bordo("#4f565f", .8));
      o += ell(tx - 2.7, ty - .3, 2, 2.4, "#353a41") + ell(tx + 2.7, ty - .3, 2, 2.4, "#353a41") + cer(tx - 3.2, ty - 1, .5, "#9aa1aa") + cer(tx + 2.2, ty - 1, .5, "#9aa1aa") + pth("M" + q(tx, ty + 2.2) + " l-1.1,2 l2.2,0 Z", "#353a41") +
        tratto("M" + q(tx - 1.7, ty + 5) + " L" + q(tx - 1.7, ty + 7) + " M" + q(tx, ty + 5.2) + " L" + q(tx, ty + 7.5) + " M" + q(tx + 1.7, ty + 5) + " L" + q(tx + 1.7, ty + 7), "#4f565f", .6);
      o += tratto("M" + f1(W / 2 - 7) + ",31 L" + f1(W / 2 + 7) + ",31", "#59616b", .8) + tratto("M" + f1(W / 2 - 7) + ",31.8 L" + f1(W / 2 + 7) + ",31.8", "#eef1f4", .6, op(.8));   // la riga incisa sotto
      return o + crepa(W - 4, 9, 1) + muschio(W, H, 9, 10);
    }
    function retroL(W, H) { return granito(W, H, 6) + crepa(7, 15, .9) + muschio(W, H, 10, 8); }
    var lp = lastra(-A, A, -.19, -.06, 2.6, zt, PI, { davanti: fronte, dietro: retroL, fianco: function (W, H) { return granito(W, H, 7); },
      sopra: function () { return granito(120, 40, 8).replace(/<circle/g, "<circle transform='translate(-60 -60)'"); } }, 2.4);
    // i ciuffi d'erba davanti e dietro alla pietra
    function ciuffo(a, bb, k) {
      var c = P(a, bb, 3), o = "", j;
      for (j = -2; j <= 2; j++) { var d = "M" + q(c[0] + j * 1.1, c[1]) + " Q" + q(c[0] + j * 1.6, c[1] - 3 * k) + " " + q(c[0] + j * 2.6, c[1] - (5.5 - Math.abs(j)) * k); o += tratto(d, L, 2) + tratto(d, j % 2 ? "#6db33f" : "#9fd65e", 1); }
      return o;
    }
    var l = [[vicino(0, -.125), lp]];
    [[-.2, -.02, 1], [-.05, -.03, .8], [.14, -.025, 1.1], [.22, -.04, .7], [-.15, -.23, .9], [.08, -.24, 1]].forEach(function (c) { l.push([vicino(c[0], c[1]), ciuffo(c[0], c[1], c[2])]); });
    return s + ordina(l);
  });

  // =========================================================
  //  SCOPA DELLA STREGA appoggiata al muro: il manico storto e nodoso, la saggina gialla legata col nastro viola e il fiocco
  // =========================================================
  def("scopa_strega", { tipo: "piedi", nome: "Scopa della strega", fp: [1, 1], box: [-24, -102, 30, 17], dietro: true, prezzo: 400 }, function () {
    var s = ombra(6, 1, 21, 9, .85), r = rnd(19), i, k;
    function asse(t) { return [.035 * t + .01 * Math.sin(t * 11), .07 - .47 * t, 86 * t]; }   // dalla saggina a terra fino in cima, appoggiato indietro
    var b0 = asse(0), bm = asse(.1), b1 = asse(.3), giu = anello([b0[0], b0[1] + .01, 0], .15, 40), mez = anello(bm, .138, 40), suA = anello(b1, .04, 24), sil = inviluppo(giu.concat(mez, suA)), bl = limiti(sil);
    // la saggina: un ciuffo a cono, coi fili chiari e scuri
    var fili = "";
    for (k = 0; k < 64; k++) {
      var t = k / 64 * 6.2832 + r() * .06; if (guarda(t) < -.35) continue;
      var pa = P(b1[0] + .035 * Math.cos(t), b1[1] + .035 * Math.sin(t), b1[2]), pm = P(bm[0] + .14 * Math.cos(t), bm[1] + .14 * Math.sin(t), bm[2]), rr = .14 + r() * .018, pb = P(b0[0] + rr * Math.cos(t), b0[1] + .01 + rr * Math.sin(t), r() * 1.5);
      fili += tratto("M" + q(pa) + " Q" + q(2 * pm[0] - (pa[0] + pb[0]) / 2, 2 * pm[1] - (pa[1] + pb[1]) / 2) + " " + q(pb), r() < .5 ? "#f9e4a2" : "#b9842f", .5 + r() * .5, op(.75 + r() * .25));
    }
    s += pth(chiuso(sil), lin("sg", [[0, "#f7dd92"], [.45, "#dcae58"], [1, "#9c6a24"]], bl[0], 0, bl[2], 0, true), bordo(L, 2)) + dentro(chiuso(sil), fili + ell(bl[0] + 6, (bl[1] + bl[3]) / 2 + 2, 2.4, 8, "#fff6d0", op(.45)));
    var punte = "";
    arco(giu, 0, 180).forEach(function (x, j) { if (j % 2) return; var dx = (r() - .5) * 2.6; punte += tratto("M" + q(x[0] - dx * .3, x[1] - 2.2) + " L" + q(x[0] + dx, x[1] + .6 + r() * 1.2), j % 4 ? "#c99a4a" : "#f2d48a", .8); });
    s += punte;
    // il manico: storto, coi nodi, e la punta a uncino
    var pp = [], rr2 = [];
    for (k = 0; k <= 8; k++) { var tk = .27 + k / 8 * .73; pp.push(asse(tk)); rr2.push(k === 3 || k === 6 ? .026 : .021); }
    var cima = asse(1);
    pp.push([cima[0] - .02, cima[1] + .015, cima[2] + 4]); rr2.push(.024);
    s += tubo(pp, rr2, [[0, "#b98252"], [.45, "#7a4a28"], [1, "#43260f"]], 2);
    [3, 6].forEach(function (k2) { var nn = P(pp[k2][0], pp[k2][1], pp[k2][2]); s += ell(nn[0] - .6, nn[1], 1.3, 1.9, "#4a2a12", op(.75)) + ell(nn[0] - 1, nn[1] - .6, .5, .8, "#c99366", op(.7)); });   // i nodi
    var rm = asse(.8), rm2 = [rm[0] + .05, rm[1] + .03, rm[2] + 7], rp = P(rm2[0], rm2[1], rm2[2]);
    s += tubo([rm, rm2], [.012, .008], [[0, "#b98252"], [1, "#5a3418"]], 1.6) + "<g transform='translate(" + f1(rp[0]) + " " + f1(rp[1]) + ") rotate(-30)'>" + pth("M0,0 C-2,-1.6 -2,-4.6 0,-6 C2,-4.6 2,-1.6 0,0 Z", lin("fg", [[0, "#a9e34b"], [1, "#5c940d"]], 0, 0, 1, 1), bordo(L, .8)) + "</g>";   // il rametto con la fogliolina
    // il nastro viola che lega la saggina, con lo spago e il fiocco davanti
    var n0 = asse(.27), n1 = asse(.335);
    s += tubo([n0, n1], [.054, .048], [[0, "#d68cf0"], [.4, "#9c36b5"], [1, "#5f1f73"]], 1.6);
    var sp = arco(anello(asse(.3), .057, 40), 0, 180);
    s += tratto(aperto(sp), "#f3d9fa", .7, op(.85));
    if (guarda(1.5708) > 0) {   // il fiocco (sul davanti della scopa)
      var fo = P(asse(.3)[0], asse(.3)[1] + .055, asse(.3)[2]);
      s += "<g transform='translate(" + f1(fo[0]) + " " + f1(fo[1]) + ")'>" + pth("M0,0 C-3,-3.4 -6.4,-2 -5.6,1 C-5,3 -2,2 0,0 Z M0,0 C3,-3.4 6.4,-2 5.6,1 C5,3 2,2 0,0 Z", lin("fc", [[0, "#e599f7"], [1, "#862e9c"]], 0, 0, 1, 1), bordo(L, .9)) +
        pth("M-1,.6 L-2.6,5 L-.8,4.2 Z M1,.6 L2.8,4.8 L1,4.2 Z", "#9c36b5", bordo(L, .7)) + cer(0, .2, 1.3, "#be4bdb", bordo(L, .7)) + "</g>";
    }
    return s;
  });

  // =========================================================
  //  PILA DI ZUCCHE: tre grandi sotto, una sopra con la faccia classica, la piccola in cima col viticcio e la foglia;
  //  quella davanti ride con gli occhi a mezzaluna. Di notte le facce si accendono.
  // =========================================================
  def("zucche_pila", { tipo: "piedi", nome: "Pila di zucche", fp: [1, 1], box: [-40, -64, 42, 26], dietro: true, prezzo: 500, luce: [0, -23, 85, "#ff922b"] }, function () {
    var s = ombra(4, 6, 40, 17);
    var Z = [
      { a: -.17, b: .07, z0: 0, R: .2, H: 21, c: "#f76707", seme: 11, n: 9, giro: .2, faccia: { tipo: 1, phi: .72, z: 10.5, k: .66 }, picciolo: { h: 3.5, piega: -1 } },
      { a: .16, b: -.12, z0: 0, R: .21, H: 22, c: "#fd7e14", seme: 12, n: 9, giro: .5, picciolo: { h: 4, piega: 1 } },
      { a: -.04, b: -.25, z0: 0, R: .17, H: 18, c: "#e8590c", seme: 13, n: 8, picciolo: { h: 3, piega: 1 } },
      { a: -.03, b: -.08, z0: 17.5, R: .175, H: 18.5, c: "#ff922b", seme: 14, n: 8, giro: .1, faccia: { tipo: 0, phi: .95, z: 9.5, k: .68 }, coperchio: true, picciolo: { h: 3.5, piega: 1 } },
      { a: -.025, b: -.1, z0: 34.5, R: .115, H: 12.5, c: "#ffa94d", seme: 15, n: 7, picciolo: { h: 5.5, piega: 1 }, ricciolo: -1, foglia: [.07, .02, 25, 1.25] }
    ];
    return s + ordina(Z.map(function (o) { return [vicino(o.a, o.b) + .82 * (o.z0 + o.H / 2) / 61, zuccaSvg(o)]; }));
  });

  // =========================================================
  //  CANDELABRO di ferro battuto: il piede a cupola sulle tre palline, lo stelo coi nodi, i due bracci a ricciolo,
  //  tre candele bianche con le colature di cera e le fiammelle (di notte più forti, con l'alone). È uguale da tutti i lati.
  // =========================================================
  def("candelabro", { tipo: "sopra", nome: "Candelabro", fp: [1, 1], box: [-17, -48, 17, 8], prezzo: 600, luce: [0, -38, 75, "#ffc078"] }, function () {
    var s = ombra(1.5, 1.5, 13, 5), E = [.7071, -.7071], F = forma(0, 0, .085, .085, .085);
    function lungo(t, z) { return [E[0] * t, E[1] * t, z]; }   // un punto lungo i bracci (si vedono di traverso, da sinistra a destra)
    function fiammella(x, y, h) {   // la fiammella sopra lo stoppino (x, y = la punta dello stoppino)
      var w = h * .3, d = "M" + q(x, y + 1) + " C" + q(x - w * 1.5, y - h * .2) + " " + q(x - w * .5, y - h * .7) + " " + q(x + w * .15, y - h) + " C" + q(x + w * .7, y - h * .6) + " " + q(x + w * 1.5, y - h * .2) + " " + q(x, y + 1) + " Z";
      var o = NOTTE ? cer(x, y - h * .4, h * 1.25, radU("al", [[0, "#fff3bf", .85], [.4, "#ffd43b", .35], [1, "#ffa94d", 0]], x, y - h * .4, h * 1.25)) : "";
      return o + pth(d, NOTTE ? "#ffd43b" : "#ffa94d", bordo(NOTTE ? "#e8590c" : "#c2410c", .6)) + ell(x, y - h * .32, w * .55, h * .3, NOTTE ? "#ffffff" : "#fff3bf") + ell(x, y + .1, w * .35, h * .12, "#4dabf7", op(NOTTE ? .5 : .7));
    }
    function candela(c, h) {   // una candela bianca: c = la base [a, b, z]; con lo stoppino, le colature e la fiammella
      var top = [c[0], c[1], c[2] + h], o = tubo([c, top], .021, [[0, "#ffffff"], [.45, "#f6efdc"], [1, "#cdbf9c"]], 1.4);
      var tp = anello(top, .021, 20), cc = P(top[0], top[1], top[2]);
      o += pth(chiuso(tp), rad("cm", [[0, "#e9dfc6"], [.6, "#f8f3e6"], [1, "#ffffff"]], .5, .5, .6), bordo(L, .7));
      var dav = P(top[0] + .0148, top[1] + .0148, top[2]);   // la colatura sul davanti
      o += pth("M" + q(dav[0] - 1.6, dav[1] - .4) + " Q" + q(dav[0] - 1.4, dav[1] + 2.6) + " " + q(dav[0] - .9, dav[1] + 3.6) + " A.8,.8 0 1,0 " + q(dav[0] + .5, dav[1] + 3.2) + " Q" + q(dav[0] + .6, dav[1] + 1.4) + " " + q(dav[0] + 1.6, dav[1] + .9) + " Z", "#fffdf6", bordo("#b9a983", .5));
      o += tratto(linea(cc, [cc[0], cc[1] - 1.8]), "#2b2124", .7);
      return o + fiammella(cc[0], cc[1] - 1.8, h > 10 ? 6.6 : 5.8);
    }
    function coppa(c) {   // il piattino che tiene la candela
      var G2 = forma(c[0], c[1], .036, .036, .036);
      return corpo([giro(G2, c[2] - 1.6, .45, 24), giro(G2, c[2] - .4, 1, 24), giro(G2, c[2], .96, 24)], FERRO, 1.1) + pth(chiuso(giro(G2, c[2], .96, 24)), rad("cp", [[0, "#9b98a6"], [.6, "#4a4752"], [1, "#1e1c22"]], .35, .3, .8), bordo(L, .8));
    }
    // le tre palline, il piede a cupola, lo stelo coi nodi
    [Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6].forEach(function (f) { var e = ellissoide([Math.cos(f) * .068, Math.sin(f) * .068, 1.2], f, .02, .02, 1.2, 0); s += pth(chiuso(e), lin("pd", FERRO, limiti(e)[0], 0, limiti(e)[2], 0, true), bordo(L, .9)); });
    s += corpo([giro(F, 1.4, .95, 40), giro(F, 3, 1, 40), giro(F, 4.2, .9, 40), giro(F, 6, .55, 40), giro(F, 7.6, .3, 40)], FERRO, 1.6);
    s += tratto(aperto(arco(giro(F, 3, 1.005, 40), -5, 185)), "#9b98a6", .7, op(.7));
    s += tubo([[0, 0, 7], [0, 0, 8.4], [0, 0, 9.4], [0, 0, 10.4], [0, 0, 12.6], [0, 0, 13.6], [0, 0, 14.8], [0, 0, 16.2], [0, 0, 21]], [.03, .018, .032, .016, .016, .036, .036, .018, .016], FERRO, 1.5);
    // i due bracci a esse coi riccioli
    [-1, 1].forEach(function (sg) {
      var pp = [lungo(sg * .012, 15.6), lungo(sg * .07, 14.4), lungo(sg * .118, 15.4), lungo(sg * .146, 17.8), lungo(sg * .15, 20)];
      s += tubo(pp, .0115, FERRO, 1.4);
      var rc = P(lungo(sg * .085, 11.6)[0], lungo(sg * .085, 11.6)[1], 11.6), d = "M" + q(P(lungo(sg * .03, 14.6)[0], lungo(sg * .03, 14.6)[1], 14.6)), k;
      for (k = 0; k <= 14; k++) { var an = k / 14 * 5.5, rr = 2.8 * (1 - k / 18); d += " L" + q(rc[0] + sg * Math.cos(an + 1.2) * rr * -1, rc[1] - Math.sin(an + 1.2) * rr * -1 * .9); }   // il ricciolo sotto il braccio
      s += tratto(d, L, 2.2) + tratto(d, "#4a4752", 1);
    });
    var cs = lungo(-.15, 20.2), cd = lungo(.15, 20.2), cm = [0, 0, 22.6];
    s += coppa(cs) + coppa(cd) + coppa(cm) + candela(cs, 9) + candela(cd, 9) + candela(cm, 11.2);
    return s;
  });

  // =========================================================
  //  CAPPELLO DA STREGA: la tesa larga che ondeggia, il cono di feltro nero-viola con la punta storta,
  //  il nastro viola con la fibbia d'oro sul davanti
  // =========================================================
  def("cappello_strega", { tipo: "sopra", nome: "Cappello da strega", fp: [1, 1], box: [-17, -31, 19, 10], dietro: true, prezzo: 250 }, function () {
    var s = ombra(1.5, 2, 15.5, 6.5), k, D = [.7071, -.7071], RT = .19;
    function zw(t) { return 1.6 + 1.1 * Math.sin(2 * t + .6); }   // la tesa ondeggia un po'
    var su = [], giu = [], dav = [];
    for (k = 0; k < 72; k++) { var t = k / 72 * 6.2832; su.push(P(RT * Math.cos(t), RT * Math.sin(t), zw(t))); giu.push(P(RT * Math.cos(t), RT * Math.sin(t), zw(t) - 1.6)); if (guarda(t) > -.08) dav.push(k); }
    dav.sort(function (m, n) { return su[m][0] - su[n][0]; });
    s += pth(chiuso(dav.map(function (k2) { return su[k2]; }).concat(dav.slice().reverse().map(function (k2) { return giu[k2]; }))), "#17131c", bordo(L, 1.5));   // lo spessore della tesa
    var bt = limiti(su);
    s += pth(chiuso(su), radU("te", [[0, "#6d5f80"], [.45, "#3a3046"], [1, "#16121b"]], bt[0] + (bt[2] - bt[0]) * .3, bt[1] + (bt[3] - bt[1]) * .3, (bt[2] - bt[0]) * .7), bordo(L, 1.6));
    s += tratto(aperto(arco(su.map(function (x) { return [x[0] * .9, x[1] * .9 - .3]; }), 140, 250)), "#9a8bb0", .8, op(.6));   // la luce sulla tesa
    // il cono con la punta che piega
    var asse = [[0, 0, 1.6], [0, 0, 6.6], [0, 0, 12], [D[0] * .012, D[1] * .012, 16.4], [D[0] * .042, D[1] * .042, 20.4], [D[0] * .085, D[1] * .085, 23], [D[0] * .128, D[1] * .128, 23.4], [D[0] * .158, D[1] * .158, 22]];
    var cono = tuboStorto(asse, [.088, .077, .058, .043, .03, .019, .01, .003], [[0, "#7a6a8e"], [.35, "#3d3349"], [.75, "#211b29"], [1, "#120e16"]], 2);
    s += cono.s;
    var p3 = P(asse[3][0], asse[3][1], asse[3][2]), p4 = P(asse[4][0], asse[4][1], asse[4][2]);
    s += tratto("M" + q(p3[0] - 3, p3[1] + 1.4) + " Q" + q(p3[0] - .6, p3[1] - .4) + " " + q(p4[0] - .4, p4[1] + 1.6), "#0c090f", .9) + tratto("M" + q(p3[0] - 2.6, p3[1] + 2.3) + " Q" + q(p3[0] - .2, p3[1] + .6) + " " + q(p4[0] + .3, p4[1] + 2.4), "#8a7aa0", .6, op(.7));   // la piega
    s += tratto("M" + q(P(0, 0, 8)[0] - 4.2, P(0, 0, 8)[1]) + " L" + q(p3[0] - 2.2, p3[1]), "#9a8bb0", .9, op(.45));   // la luce sul cono
    // il nastro viola e la fibbia
    var na = tuboStorto([[0, 0, 1.6], [0, 0, 6.4]], [.093, .082], [[0, "#da77f2"], [.4, "#9c36b5"], [1, "#4a1659"]], 1.6);
    s += na.s + tratto(aperto(arco(anello([0, 0, 6.2], .082, 40), -5, 185)), "#f3d9fa", .6, op(.75));
    if (guarda(1.5708) > 0) {
      var fb = P(0, .09, 4), fi = "";
      fi += rett(-3.4, -2.7, 6.8, 5.4, 1, lin("fo", ORO, 0, 0, 1, 1), bordo(L, .7)) + rett(-1.8, -1.3, 3.6, 2.6, .4, "#6a1f80", bordo(L, .5)) + rett(-.4, -1.6, .8, 3.2, .3, lin("fp", ORO, 0, 0, 1, 0), bordo(L, .4)) + rett(-3, -2.4, 2.4, 1, .5, "#fffbe6", op(.8));
      s += sulTondo(fb, 1.5708, 1, fi);
    }
    return s;
  });

  // =========================================================
  //  GATTO NERO seduto: guarda in basso a sinistra con gli occhioni gialli, la coda a punto di domanda,
  //  il collarino arancione col campanello d'oro (da dietro: la schiena, le orecchie e la coda)
  // =========================================================
  def("gatto_nero", { tipo: "sopra", nome: "Gatto nero", fp: [1, 1], box: [-21, -39, 25, 6], dietro: true, prezzo: 450 }, function () {
    var s = ombra(.5, 1, 12.5, 4.6), PEL = lin("pl", [[0, "#5b5269"], [.35, "#342d3d"], [1, "#16131b"]], -12, -34, 10, 0, true), PL = lin("pl2", [[0, "#4a4257"], [1, "#1d1923"]], -12, -14, 12, 0, true);
    var NERO = "#2a2531", LUCE = "#7f7596", b = bordo(L, 1.3);
    function coda(d) { return tratto(d, L, 6) + tratto(d, NERO, 3.8) + tratto(d, LUCE, .8, "transform='translate(-.8 -.6)' " + op(.7)); }
    if (G > 0) {
      s += coda("M6,-3 C13,-3 17,-8 16,-15 C15.3,-20 16.5,-24 19.6,-25.4");
      s += pth("M-9.5,-.6 C-11.5,-6.5 -10,-13.5 -5.5,-17.6 C-2,-20.6 3.6,-20 7,-15.8 C10.6,-11.4 12,-5 10,-.6 Q0,1.2 -9.5,-.6 Z", PEL, b);   // il corpo
      s += pth("M1.5,-.6 C.4,-6 3,-11.5 7.2,-11.6 C10.8,-11.6 12,-5.5 10,-.6 Z", PL, bordo(L, .9)) + ell(2.4, -.9, 2.9, 1.5, NERO, bordo(L, .9));   // la coscia e la zampa di dietro
      s += pth("M-8.2,-10 L-8.4,-1.6 Q-8.4,0 -6.6,0 L-5.4,0 Q-4.2,0 -4.4,-1.6 L-4.6,-10 Z", PL, bordo(L, .9)) + pth("M-4.4,-11 L-4.2,-1.4 Q-4.2,.4 -2.4,.4 L-1,.4 Q.4,.4 .2,-1.4 L0,-11 Z", PEL, bordo(L, .9));   // le zampe davanti
      s += tratto("M-7.1,-.2 L-7.1,-1.4 M-5.7,-.2 L-5.7,-1.4 M-2.9,.2 L-2.9,-1 M-1.4,.2 L-1.4,-1", "#0c0a0f", .5);
      s += tratto("M-9.6,-16 C-10.8,-12 -11,-6 -9.8,-1.6", LUCE, .9, op(.6));   // la luce sul petto
      s += pth("M-10.6,-18.9 Q-4.6,-14.6 2.2,-18.9 L2.2,-16.9 Q-4.6,-12.6 -10.6,-16.9 Z", lin("cl", [[0, "#ffc078"], [.5, "#fd7e14"], [1, "#c2410c"]], 0, 0, 0, 1), bordo(L, .8));   // il collarino
      s += cer(-4.4, -13.9, 1.9, rad("cb", [[0, "#fffbe6"], [.45, "#f5cf5a"], [1, "#9a6c12"]], .35, .3, .8), bordo(L, .7)) + tratto("M-5.4,-13.4 L-3.4,-13.4", "#6b4a0e", .5) + cer(-4.4, -12.5, .4, "#6b4a0e");   // il campanello
      // la testa, le orecchie, la faccia
      s += pth("M-11.8,-26.4 L-12.9,-35.2 L-6.8,-30.9 Z", PEL, bordo(L, 1.1)) + pth("M-11.4,-28.2 L-12.1,-33.2 L-8.6,-30.8 Z", "#f3a6c0", op(.85));
      s += pth("M-12.4,-23.4 C-12.8,-29 -8.8,-32 -4.4,-32 C.2,-32 3.6,-29 3.5,-24 C3.4,-19.4 0,-17 -4.4,-17 C-9.2,-17 -12.2,-19.2 -12.4,-23.4 Z", PEL, b);
      s += pth("M-2.4,-31.4 L2.8,-36.4 L3.4,-27.2 Z", PEL, bordo(L, 1.1)) + pth("M-1.1,-31.1 L2.3,-34.6 L2.7,-28.8 Z", "#f3a6c0", op(.85));
      s += tratto("M-11.6,-25.6 C-11.6,-29.6 -8.6,-31.4 -5,-31.5", LUCE, .9, op(.75));
      var occ = rad("oc", [[0, "#fff3bf"], [.5, "#ffd43b"], [1, "#94d82d"]], .45, .4, .7);
      s += ell(-9.3, -24.4, 1.8, 2.4, occ, bordo(L, .6)) + ell(-3.6, -24.6, 2.4, 2.8, occ, bordo(L, .6)) + ell(-9.1, -24.3, .5, 1.9, "#0c0a0f") + ell(-3.3, -24.5, .65, 2.2, "#0c0a0f") + cer(-9.8, -25.4, .55, "#ffffff") + cer(-4.3, -25.8, .7, "#ffffff");
      s += pth("M-7.7,-21.7 L-5.6,-21.7 L-6.6,-20.6 Z", "#f783ac", bordo(L, .4)) + tratto("M-6.6,-20.6 Q-7.3,-19.5 -8.3,-19.9 M-6.6,-20.6 Q-5.9,-19.5 -4.9,-19.9", "#0c0a0f", .55);
      s += tratto("M-9.2,-21 L-15.4,-22.4 M-9.2,-20.3 L-15.6,-20.3 M-9.1,-19.6 L-14.8,-18.2 M-4.2,-21 L1.8,-22.4 M-4.2,-20.3 L2.2,-20.4 M-4.3,-19.6 L1.6,-18.3", "#ddd8e8", .45, op(.9));   // i baffi
    } else {
      s += pth("M-10,-.6 C-12,-5.5 -11,-12.5 -7.4,-16.5 C-4,-20.2 2,-20.8 5.4,-18 C9.8,-14.4 11.2,-7 9.4,-.6 Q0,1.2 -10,-.6 Z", PEL, b);   // la schiena
      s += pth("M-10,-.6 C-11.6,-5.6 -9,-10.6 -5,-10.6 C-2,-10.6 -1,-5 -2.4,-.6 Z", PL, bordo(L, .9)) + pth("M9.4,-.6 C11,-5.6 9,-10.2 5.4,-10.2 C2.4,-10.2 1.4,-5 2.6,-.6 Z", PL, bordo(L, .9));   // le cosce
      s += tratto("M3.6,-18 C1,-14 -.6,-8 -.4,-2.5", LUCE, .9, op(.55)) + tratto("M-9.8,-4 C-10.6,-9 -8.6,-14 -5.6,-16.8", LUCE, .9, op(.6));
      s += pth("M-3.2,-19.8 Q4.4,-16.4 12,-19.9 L12,-18 Q4.4,-14.6 -3.2,-17.9 Z", lin("cl", [[0, "#ffc078"], [.5, "#fd7e14"], [1, "#c2410c"]], 0, 0, 0, 1), bordo(L, .8));
      s += pth("M-2.9,-27.4 L-2.7,-36.6 L2.6,-31.8 Z", PEL, bordo(L, 1.1)) + pth("M6.8,-31.9 L12.4,-36.1 L12.6,-27 Z", PEL, bordo(L, 1.1));   // le orecchie da dietro
      s += pth("M-3.6,-24.6 C-3.8,-29.8 0,-32.6 4.4,-32.6 C8.8,-32.6 12.4,-29.8 12.2,-24.8 C12,-20.2 8.8,-17.6 4.4,-17.6 C0,-17.6 -3.4,-20.2 -3.6,-24.6 Z", PEL, b);
      s += tratto("M-2.8,-26 C-2.6,-30 .6,-32 4,-32.1", LUCE, .9, op(.75)) + tratto("M-2.1,-28.6 L-2.3,-34.4 M7.9,-31.6 L11.6,-34.6", LUCE, .6, op(.6));
      s += coda("M-3,-1.4 C-11,-1 -15,-6.5 -14,-13.5 C-13.3,-18.5 -14.6,-22.5 -17.6,-24");
    }
    return s;
  });

  // =========================================================
  //  DA PARETE: disegni piatti di fronte, 62 × 200 per ogni pezzo di muro (y = 0 il soffitto, y = 200 il pavimento).
  //  La luce viene da in alto a sinistra: l'ombra sul muro scivola un po' in basso a destra.
  //  Le sagome si scrivono una volta col colore "§": diventano il contorno (L) e l'ombra sul muro (nero).
  // =========================================================
  function colora(sil, c) { return sil.replace(/§/g, c); }
  function ombraMuro(sil, dx, dy, k) { return "<g transform='translate(" + dx + " " + dy + ")' " + op(k || .15) + ">" + colora(sil, "#000") + "</g>"; }

  // =========================================================
  //  RAGNATELA COL RAGNO: la tela d'argento nell'angolo in alto (i raggi dal soffitto, i giri che si incurvano),
  //  un filo rotto che pende, le goccioline, un moscerino impacchettato e il ragno nero dagli occhietti rossi appeso al suo filo
  // =========================================================
  def("ragnatela", { tipo: "parete", nome: "Ragnatela col ragno", w: 62, h: 200, prezzo: 250 }, function () {
    var r = rnd(29), s = "", j, H = [1.2, 1.2];
    var A = [3, 21, 39, 56, 72, 87].map(function (g) { return g * Math.PI / 180; });   // i raggi, dall'angolo tra soffitto e muro
    var LU = A.map(function (a) { return .96 / Math.hypot(Math.cos(a) / 60, Math.sin(a) / 96) * (.95 + r() * .07); });   // fin dove arrivano (un quarto d'ellisse 60 × 96)
    function pr(j, t) { return [H[0] + Math.cos(A[j]) * LU[j] * t, H[1] + Math.sin(A[j]) * LU[j] * t]; }
    var T = [.15, .3, .46, .62, .79, .95], dR = "", dG = "";
    for (j = 0; j < A.length; j++) dR += "M" + q(H) + " L" + q(pr(j, 1)) + " ";
    T.forEach(function (t, i) {
      for (j = 0; j < A.length - 1; j++) {
        var p1 = pr(j, t * (.97 + r() * .06)), p2 = pr(j + 1, t * (.97 + r() * .06)), m = [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2], c = [m[0] - (m[0] - H[0]) * .17, m[1] - (m[1] - H[1]) * .17];
        if (i === 3 && j === 3) { dG += "M" + q(p1) + " Q" + q(p1[0] - 1.6, p1[1] + 4) + " " + q(p1[0] + .8, p1[1] + 8.5) + " M" + q(p2) + " Q" + q(p2[0] + 2.4, p2[1] + 2.6) + " " + q(p2[0] + 1.4, p2[1] + 6) + " "; continue; }   // il filo rotto: i due capi pendono
        dG += "M" + q(p1) + " Q" + q(c) + " " + q(p2) + " ";
      }
    });
    // i fili: prima l'ombra sul muro, poi il bordo scuro sottile (si vede sui muri chiari), poi l'anima d'argento
    s += tratto(dR + dG, "#000", 1.2, "transform='translate(1.5 2)' " + op(.13));
    s += tratto(dR, L, 1.9, op(.34)) + tratto(dG, L, 1.6, op(.3)) + tratto(dR, "#f8f9fa", 1, op(.97)) + tratto(dG, "#f1f3f5", .8, op(.95));
    s += tratto(dR + dG, "#ffffff", .35, "transform='translate(-.3 -.3)' " + op(.8));
    // le goccioline di rugiada sugli incroci
    [[1, 4], [3, 1], [5, 3], [2, 5]].forEach(function (g) { var c = pr(g[1], T[g[0]]); s += cer(c[0] + .4, c[1] + .9, .85, "#000", op(.1)) + cer(c[0], c[1] + .4, .85, rad("gc", [[0, "#ffffff"], [.6, "#eef6fb"], [1, "#b9d5e6"]], .35, .3, .75), bordo("#8fb3c9", .3)) + cer(c[0] - .3, c[1] + .1, .3, "#ffffff"); });
    // il moscerino impacchettato nella seta, appeso a un giro
    var mo = pr(4, .46);
    s += tratto("M" + q(mo) + " L" + q(mo[0], mo[1] + 4.6), L, 1.1, op(.35)) + tratto("M" + q(mo) + " L" + q(mo[0], mo[1] + 4.6), "#f8f9fa", .55);
    s += ell(mo[0] + 1.6, mo[1] + 10.4, 2.3, 3.7, "#000", op(.13));
    s += pth("M" + q(mo[0] - 1.4, mo[1] + 5.4) + " L" + q(mo[0] - 3, mo[1] + 3.6) + " L" + q(mo[0] - .6, mo[1] + 4.8) + " Z M" + q(mo[0] + 1.4, mo[1] + 5.4) + " L" + q(mo[0] + 3, mo[1] + 3.6) + " L" + q(mo[0] + .6, mo[1] + 4.8) + " Z", "#d0ebff", bordo(L, .5) + " " + op(.9));   // le alucce che spuntano
    s += ell(mo[0], mo[1] + 8.6, 2.3, 3.8, rad("bz", [[0, "#ffffff"], [.6, "#eceae4"], [1, "#b9b4a8"]], .35, .3, .75), bordo(L, .9));
    s += tratto("M" + q(mo[0] - 2, mo[1] + 6.6) + " L" + q(mo[0] + 2.1, mo[1] + 7.8) + " M" + q(mo[0] - 2.2, mo[1] + 8.8) + " L" + q(mo[0] + 2.2, mo[1] + 10.1) + " M" + q(mo[0] - 1.8, mo[1] + 10.9) + " L" + q(mo[0] + 1.6, mo[1] + 12), "#a8a294", .45);
    // il ragno, appeso al filo che scende dalla tela
    var ap = pr(2, T[4]), x = ap[0], y = 112, sil = "", o = "", sg;
    var Z = [[3, -2.4, 9.4, -10.6, 13.8, -5.2], [3.6, -.9, 11.4, -5.4, 15.2, .8], [3.8, .7, 11.2, .6, 14.2, 6.6], [3.2, 2.3, 8.8, 5.6, 10, 11.6]];   // le zampe: attacco, ginocchio, punta (x verso fuori, y in giù dal centro della testa)
    var dz = "";
    for (sg = -1; sg <= 1; sg += 2) Z.forEach(function (z) { dz += "M" + q(x + sg * z[0], y + z[1]) + " L" + q(x + sg * z[2], y + z[3]) + " L" + q(x + sg * z[4], y + z[5]) + " "; });
    sil += "<path d='" + dz + "' fill='none' stroke='§' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/>" + ell(x, y - 9, 6.2, 7.3, "§", "stroke='§' stroke-width='1.5'") + ell(x, y, 4.5, 4.2, "§", "stroke='§' stroke-width='1.3'");
    s += tratto("M" + q(ap) + " L" + q(x, y - 15), "#000", .9, "transform='translate(1.5 2)' " + op(.13)) + ombraMuro(sil, 2.6, 3.4, .16);
    s += tratto("M" + q(ap) + " L" + q(x, y - 15.6), L, 1.3, op(.32)) + tratto("M" + q(ap) + " L" + q(x, y - 15.6), "#f8f9fa", .65);
    o += tratto(dz, L, 2.6) + tratto(dz, "#2a2531", 1.35) + tratto(dz, "#8a7fa0", .45, "transform='translate(-.35 -.45)' " + op(.75));
    for (sg = -1; sg <= 1; sg += 2) Z.forEach(function (z) { o += cer(x + sg * z[4], y + z[5], .75, "#2a2531", bordo(L, .5)); });   // i piedini
    o += ell(x, y - 9, 6.2, 7.3, rad("ra", [[0, "#7a6e90"], [.35, "#3b3347"], [1, "#141118"]], .35, .28, .8), bordo(L, 1.5));   // la pancia (il filo esce da qui)
    o += tratto("M" + q(x - 2.6, y - 7.6) + " L" + q(x, y - 5.6) + " L" + q(x + 2.6, y - 7.6) + " M" + q(x - 2, y - 10.6) + " L" + q(x, y - 8.8) + " L" + q(x + 2, y - 10.6), "#9b8fb3", .7, op(.6));   // i segni a V sulla pancia
    o += ell(x - 2.5, y - 12.2, 1.5, 2.4, "#ffffff", op(.55) + " " + gira(-20, x - 2.5, y - 12.2)) + cer(x - 3.6, y - 8.6, .55, "#ffffff", op(.5));
    o += ell(x, y, 4.5, 4.2, rad("rt", [[0, "#6a5f7c"], [.5, "#2f2838"], [1, "#141118"]], .35, .3, .8), bordo(L, 1.3));   // la testa
    var OR = rad("ro", [[0, "#ffd8d8"], [.35, "#ff6b6b"], [1, "#b02525"]], .4, .35, .7);
    o += cer(x - 1.75, y + .5, 1.5, OR, bordo("#5c0d0d", .4)) + cer(x + 1.75, y + .5, 1.5, OR, bordo("#5c0d0d", .4)) + cer(x - .8, y - 2, .6, OR) + cer(x + .8, y - 2, .6, OR);   // i quattro occhietti rossi
    o += cer(x - 2.2, y, .5, "#ffffff") + cer(x + 1.3, y, .5, "#ffffff") + cer(x - 1.3, y + 1.1, .22, "#ffffff") + cer(x + 2.2, y + 1.1, .22, "#ffffff");
    o += pth("M" + q(x - 1.4, y + 3.4) + " L" + q(x - .45, y + 3.4) + " L" + q(x - .9, y + 5.3) + " Z M" + q(x + 1.4, y + 3.4) + " L" + q(x + .45, y + 3.4) + " L" + q(x + .9, y + 5.3) + " Z", "#fff4dc", bordo(L, .4));   // i dentini
    return s + o;
  });

  // =========================================================
  //  SCHELETRO CHE DONDOLA, appeso al soffitto col suo cordino: il teschio con gli occhioni neri e il sorriso a denti,
  //  la gabbia delle costole, la colonna, il bacino, braccia e gambe con le nocche; è un po' storto perché dondola
  // =========================================================
  def("scheletro", { tipo: "parete", nome: "Scheletro che dondola", w: 62, h: 200, prezzo: 700 }, function () {
    var X = 31, PARTI = [], k;
    var OS = lin("osL", [[0, "#fffef8"], [.5, "#f1ead6"], [1, "#c8bb9b"]], 0, 0, 0, 1), OSR = lin("osR", [[0, "#c8bb9b"], [.5, "#f1ead6"], [1, "#fffef8"]], 0, 0, 0, 1);
    var NOC = rad("on", [[0, "#ffffff"], [.5, "#f1ead6"], [1, "#c2b593"]], .35, .3, .75);
    function parte(l) { PARTI.push({ sil: l.map(function (x) { return x.sil; }).join(""), pie: l.map(function (x) { return x.pie; }).join("") }); }
    function osso(a, b, w, kn) {   // un osso lungo da a a b: il fusto largo w e le due nocche (grandi kn) alle teste
      var dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy), ux = dx / len, uy = dy / len, nx = -uy, ny = ux, g = Math.atan2(dy, dx), tr = "transform='translate(" + q(a) + ") rotate(" + f1(g * 57.2958) + ")'";
      var su = Math.cos(g) - Math.sin(g) > 0;   // il lato "sopra" del fusto guarda verso la luce?
      var noc = [];
      [[a, -1], [b, 1]].forEach(function (e) { [1, -1].forEach(function (sn) { noc.push([e[0][0] + nx * sn * kn * .42 + ux * e[1] * kn * .16, e[0][1] + ny * sn * kn * .42 + uy * e[1] * kn * .16]); }); });
      var fus = "<rect x='0' y='" + f1(-w / 2) + "' width='" + f1(len) + "' height='" + f1(w) + "' " + tr;
      var sil = fus + " fill='§' stroke='§' stroke-width='2.2' stroke-linejoin='round'/>" + noc.map(function (c) { return cer(c[0], c[1], kn * .55, "§", "stroke='§' stroke-width='2.2'"); }).join("");
      var pie = fus + " fill='" + (su ? OS : OSR) + "'/>" + noc.map(function (c) { return cer(c[0], c[1], kn * .55, NOC); }).join("");
      pie += "<path d='M" + f1(len * .2) + "," + f1((su ? -1 : 1) * w * .2) + " L" + f1(len * .8) + "," + f1((su ? -1 : 1) * w * .2) + "' stroke='#ffffff' stroke-width='" + f1(w * .3) + "' stroke-linecap='round' fill='none' " + op(.8) + " " + tr + "/>";   // il riflesso lungo il fusto
      return { sil: sil, pie: pie };
    }
    function forma2(d, fill, extra, lw) { return { sil: "<path d='" + d + "' fill='§' stroke='§' stroke-width='" + (lw || 2.4) + "' stroke-linejoin='round'/>", pie: pth(d, fill) + (extra || "") }; }
    function filo2(d, w) { return { sil: "<path d='" + d + "' fill='none' stroke='§' stroke-width='" + f1(w + 2) + "' stroke-linecap='round' stroke-linejoin='round'/>", pie: tratto(d, "#efe7d2", w) + tratto(d, "#fffef8", w * .4, "transform='translate(-.25 -.4)' " + op(.9)) }; }
    // il cordino dal gancio del soffitto all'anellino sul teschio
    parte([{ sil: "<path d='M31,2 L31,50' fill='none' stroke='§' stroke-width='2.4'/>", pie: tratto("M31,2 L31,50", "#8d8172", 1.3) + tratto("M31,2 L31,50", "#c9bda9", .55, "stroke-dasharray='1.3 1.3'") + cer(31, 49.6, 1.5, "none", bordo("#868e96", .8)) }]);
    // la colonna (dietro alle costole) e le gambe (dietro al bacino)
    var col = [];
    for (k = 0; k < 8; k++) { var yv = 80.6 + k * 2.9, wv = k < 5 ? 3.6 : 4.4; col.push(forma2("M" + f1(X - wv / 2) + "," + f1(yv) + " h" + f1(wv) + " v2.3 h" + f1(-wv) + " Z", lin("vt", [[0, "#fffdf4"], [1, "#d3c7a8"]], 0, 0, 1, 1), "", 1.8)); }
    parte(col);
    function gamba(sg, an, gi, pi) { return [osso([X + sg * 5, 110.4], an, 2.9, 3.8), osso(an, gi, 2.5, 3.3), forma2("M" + q(gi[0] - sg * .6, gi[1] + .4) + " Q" + q(pi[0] - sg * .4, pi[1] - 2.2) + " " + q(pi) + " Q" + q(pi[0] - sg * .2, pi[1] + 1.4) + " " + q(gi[0] - sg * 1.4, gi[1] + 2.4) + " Z", NOC, "", 2.2)]; }
    parte(gamba(-1, [X - 6.6, 124.8], [X - 6.8, 138.6], [X - 11.8, 141.6]).concat(gamba(1, [X + 6.2, 124.6], [X + 7.6, 138.4], [X + 12.6, 141]), [forma2("M" + q(X - 8.1, 124.7) + " a1.6,1.6 0 1,0 3.2,0 a1.6,1.6 0 1,0 -3.2,0 Z", NOC, "", 1.8), forma2("M" + q(X + 4.6, 124.5) + " a1.6,1.6 0 1,0 3.2,0 a1.6,1.6 0 1,0 -3.2,0 Z", NOC, "", 1.8)]));   // le gambe e le rotule
    // il bacino a farfalla coi due buchi e l'osso sacro
    var bac = "M" + q(X - 1.6, 101.4) + " C" + q(X - 5, 99.6) + " " + q(X - 11, 99.8) + " " + q(X - 10.8, 104.2) + " C" + q(X - 10.6, 107.8) + " " + q(X - 7.2, 110.6) + " " + q(X - 3.6, 111.8) + " L" + q(X + 3.6, 111.8) + " C" + q(X + 7.2, 110.6) + " " + q(X + 10.6, 107.8) + " " + q(X + 10.8, 104.2) + " C" + q(X + 11, 99.8) + " " + q(X + 5, 99.6) + " " + q(X + 1.6, 101.4) + " Z";
    parte([forma2(bac, rad("bc", [[0, "#ffffff"], [.5, "#f1ead6"], [1, "#c2b593"]], .35, .3, .8),
      dentro(bac, ell(X - 4.4, 107.6, 2, 1.6, "#3d2f28") + ell(X + 4.4, 107.6, 2, 1.6, "#3d2f28") + pth("M" + q(X - 2.4, 102.4) + " L" + q(X + 2.4, 102.4) + " L" + q(X, 109) + " Z", "#d9cfb4", bordo("#a99a78", .5)) +
        ell(X - 7.4, 102.8, 2.2, 1.2, "#ffffff", op(.75)) + ell(X + 8, 106.6, 2.2, 2.6, "#a99a78", op(.35))))]);
    // le costole, lo sterno e le clavicole
    var cos = [osso([X - 1.4, 80.4], [X - 10, 79.2], 1.8, 2.4), osso([X + 1.4, 80.4], [X + 10, 79.2], 1.8, 2.4)];
    [[83.4, 9.4, 3.6], [87.2, 10.6, 4], [91, 10.4, 4], [94.8, 9, 3.6]].forEach(function (c) {
      [-1, 1].forEach(function (sg) { var y = c[0], l = c[1], dd = c[2]; cos.push(filo2("M" + q(X + sg * 1.8, y) + " C" + q(X + sg * 6, y - 2.4) + " " + q(X + sg * (l + .8), y - 1) + " " + q(X + sg * l, y + dd * .85), 2.2)); });   // una costola: esce dalla colonna e scende sul fianco
    });
    cos.push(forma2("M" + q(X - 1.5, 81) + " h3 v10.6 q-1.5,2 -3,0 Z", OS, "", 1.8));
    parte(cos);
    // le braccia a penzoloni con le mani ossute
    function braccio(sg, go, po, ma) {
      var l = [osso([X + sg * 10.4, 80.4], go, 2.5, 3.4), osso(go, po, 2.2, 3), forma2("M" + q(ma[0] - 2, ma[1]) + " a2,1.7 0 1,0 4,0 a2,1.7 0 1,0 -4,0 Z", NOC, "", 2)], dd = "";
      [[-1.7, 1, -2.6, 4.6], [-.6, 1.4, -.9, 5.8], [.6, 1.4, .8, 5.6], [1.6, 1, 2.6, 4.4]].forEach(function (f) { dd += "M" + q(ma[0] + f[0] * sg, ma[1] + f[1]) + " L" + q(ma[0] + f[2] * sg, ma[1] + f[3]) + " "; });   // le dita
      l.splice(2, 0, filo2(dd + "M" + q(ma[0] - sg * 2, ma[1] - .6) + " L" + q(ma[0] - sg * 3.6, ma[1] + 2.4), 1.1));
      return l;
    }
    parte(braccio(-1, [X - 13, 94.4], [X - 14, 107], [X - 14.2, 109.2]).concat(braccio(1, [X + 13.4, 94], [X + 15.2, 106.6], [X + 15.6, 108.8])));
    // il collo e il teschio
    var te = "M" + q(X - 10.5, 62.5) + " C" + q(X - 11.6, 54.6) + " " + q(X - 6.4, 50.4) + " " + q(X, 50.4) + " C" + q(X + 6.4, 50.4) + " " + q(X + 11.6, 54.6) + " " + q(X + 10.5, 62.5) +
      " C" + q(X + 10.2, 65.2) + " " + q(X + 9.4, 66.9) + " " + q(X + 7.7, 67.8) + " C" + q(X + 6.8, 68.3) + " " + q(X + 6.6, 69.4) + " " + q(X + 6.4, 71) + " C" + q(X + 6, 74.2) + " " + q(X + 3.4, 75.4) + " " + q(X, 75.4) +
      " C" + q(X - 3.4, 75.4) + " " + q(X - 6, 74.2) + " " + q(X - 6.4, 71) + " C" + q(X - 6.6, 69.4) + " " + q(X - 6.8, 68.3) + " " + q(X - 7.7, 67.8) + " C" + q(X - 9.4, 66.9) + " " + q(X - 10.2, 65.2) + " " + q(X - 10.5, 62.5) + " Z";
    var fa = "";
    fa += ell(X + 7.6, 67.4, 3.6, 3, "#a99a78", op(.3)) + ell(X + 4.4, 74, 3, 1.6, "#a99a78", op(.3)) + ell(X - 5.6, 54.6, 3.4, 2, "#ffffff", op(.85) + " " + gira(-28, X - 5.6, 54.6));   // l'ombra sotto lo zigomo e la luce sulla fronte
    fa += ell(X - 4.2, 61.6, 3.4, 3.8, "#2b2124") + ell(X + 4.2, 61.6, 3.4, 3.8, "#2b2124");   // gli occhi vuoti
    fa += cer(X - 5.3, 60.2, 1, "#ffffff") + cer(X + 3.1, 60.2, 1, "#ffffff") + cer(X - 3.2, 63.3, .4, "#ffffff", op(.8)) + cer(X + 5.2, 63.3, .4, "#ffffff", op(.8));
    fa += tratto("M" + q(X - 7, 64.9) + " Q" + q(X - 4.2, 66.4) + " " + q(X - 1.6, 64.9) + " M" + q(X + 1.6, 64.9) + " Q" + q(X + 4.2, 66.4) + " " + q(X + 7, 64.9), "#ffffff", .6, op(.8));
    fa += pth("M" + q(X, 64.6) + " C" + q(X - .6, 65.6) + " " + q(X - 1.7, 66.5) + " " + q(X - 1.2, 67.3) + " C" + q(X - .8, 67.8) + " " + q(X - .3, 67.4) + " " + q(X, 67) + " C" + q(X + .3, 67.4) + " " + q(X + .8, 67.8) + " " + q(X + 1.2, 67.3) + " C" + q(X + 1.7, 66.5) + " " + q(X + .6, 65.6) + " " + q(X, 64.6) + " Z", "#2b2124");   // il naso a cuore rovesciato
    fa += rett(X - 5, 68.3, 10, 5.6, 2, "#2b2124") + rett(X - 4.6, 68.6, 9.2, 2.4, .9, "#fffdf5", bordo("#6b5a44", .4)) + rett(X - 4, 71.2, 8, 2.2, .9, "#f3ecd8", bordo("#6b5a44", .4));   // il sorriso a denti
    fa += tratto("M" + q(X - 2.3, 68.7) + " V71 M" + q(X, 68.7) + " V71 M" + q(X + 2.3, 68.7) + " V71 M" + q(X - 1.2, 71.3) + " V73.3 M" + q(X + 1.2, 71.3) + " V73.3", "#8a7a5e", .45);
    fa += tratto("M" + q(X + 5.4, 51.4) + " L" + q(X + 4.5, 53.8) + " L" + q(X + 6.1, 55) + " L" + q(X + 5.1, 57.4), "#8a7a5e", .6) + tratto("M" + q(X + 5.9, 51.6) + " L" + q(X + 5, 53.9) + " L" + q(X + 6.6, 55.1), "#ffffff", .4, op(.8));   // la crepa
    parte([forma2("M" + q(X - 1.8, 75) + " h3.6 v5 h-3.6 Z", OS, tratto("M" + q(X - 1.8, 77.5) + " h3.6", "#a99a78", .5), 1.8), forma2(te, rad("cr", [[0, "#ffffff"], [.45, "#f4eedc"], [1, "#c9bc9c"]], .38, .3, .75), dentro(te, fa))]);
    // tutto insieme, un po' girato (dondola): prima l'ombra sul muro, poi ogni parte col suo contorno
    var sil = PARTI.map(function (x) { return x.sil; }).join(""), gancio = rett(27.4, 0, 7.2, 1.7, .7, lin("gm", [[0, "#dee2e6"], [1, "#868e96"]], 0, 0, 0, 1), bordo(L, .7)) + tratto("M31,1.6 L31,3.4 Q31,5 32.4,4.6", "#868e96", 1.1);
    var gr = "transform='rotate(-4 31 2)'";
    return "<g transform='translate(3.4 3.8)' " + op(.15) + "><g " + gr + ">" + colora(sil, "#000") + "</g></g>" + gancio +
      "<g " + gr + ">" + PARTI.map(function (x) { return colora(x.sil, L) + x.pie; }).join("") + "</g>";
  });

  // =========================================================
  //  PIPISTRELLI (due pezzi di muro): uno stormo di pipistrelli neri che vola in diagonale, ognuno con le ali in un'altra posa,
  //  le orecchie a punta, gli occhi gialli, i dentini; l'ombra sul muro li stacca dalla parete
  // =========================================================
  def("pipistrelli", { tipo: "parete", nome: "Pipistrelli", fp: [2, 1], w: 124, h: 200, prezzo: 350 }, function () {
    var POSE = {   // il polso, la punta dell'ala e le punte delle due dita (lato destro; il sinistro è a specchio)
      su: { w: [10.6, -12.8], t: [21, -9.6], f2: [18.6, -1.2], f3: [12.8, 3.2] },
      ali: { w: [11.6, -7.2], t: [22.6, -3.4], f2: [18.8, 4.6], f3: [12.6, 6.6] },
      giu: { w: [10.8, -1.4], t: [19.4, 7.6], f2: [14.8, 11], f3: [9.6, 9.8] }
    }, S = [3.4, -1.6], B = [3.9, 5.4];
    var AL = lin("al", [[0, "#7a6c96"], [.45, "#3d3350"], [1, "#1a1622"]], 0, 0, 1, 1), CO = rad("cp", [[0, "#857a9c"], [.45, "#3f3650"], [1, "#16121c"]], .35, .3, .75);
    var OC = rad("oc", [[0, "#fff3bf"], [.5, "#ffd43b"], [1, "#f08c00"]], .4, .35, .7);
    function ala(P, sg) {   // l'ala: il braccio fino al polso, la punta, poi il bordo a festoni tra le dita
      function m(p) { return [p[0] * sg, p[1]]; }
      function fest(a, b) { var c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; return " Q" + q(c[0] + (S[0] * sg - c[0]) * .3, c[1] + (S[1] - c[1]) * .3) + " " + q(b); }
      var s0 = m(S), w = m(P.w), t = m(P.t), f2 = m(P.f2), f3 = m(P.f3), b = m(B);
      return { d: "M" + q(s0) + " Q" + q((s0[0] + w[0]) / 2, Math.min(s0[1], w[1]) - 1.2) + " " + q(w) + " Q" + q((w[0] + t[0]) / 2, Math.min(w[1], t[1]) - 1.4) + " " + q(t) + fest(t, f2) + fest(f2, f3) + fest(f3, b) + " Z",
        dita: "M" + q(w) + " L" + q(f2) + " M" + q(w) + " L" + q(f3), bra: "M" + q(s0) + " Q" + q((s0[0] + w[0]) / 2, Math.min(s0[1], w[1]) - 1.2) + " " + q(w) + " Q" + q((w[0] + t[0]) / 2, Math.min(w[1], t[1]) - 1.4) + " " + q(t), w: w };
    }
    var ore = [-1, 1].map(function (sg) { return "M" + q(sg * 1.1, -7.6) + " L" + q(sg * 3.9, -13.8) + " L" + q(sg * 4.6, -5.6) + " Z"; });
    function pip(x, y, k, posa, g) {
      var P = POSE[posa], al = [ala(P, -1), ala(P, 1)], tr = "transform='translate(" + f1(x) + " " + f1(y) + ") rotate(" + g + ") scale(" + k + ")'";
      var sil = al.map(function (a) { return "<path d='" + a.d + "' fill='§' stroke='§' stroke-width='2.2' stroke-linejoin='round'/>"; }).join("") +
        ore.map(function (d) { return "<path d='" + d + "' fill='§' stroke='§' stroke-width='2' stroke-linejoin='round'/>"; }).join("") + ell(0, 1.4, 4.4, 6.2, "§", "stroke='§' stroke-width='2'") + cer(0, -4.5, 4.4, "§", "stroke='§' stroke-width='2'");
      var o = colora(sil, L);
      al.forEach(function (a) { o += pth(a.d, AL) + dentro(a.d, tratto(a.dita, "#8577a0", .65, op(.8)) + tratto(a.bra, "#b8abd4", .9, "transform='translate(-.2 .75)' " + op(.7))) + cer(a.w[0], a.w[1], .7, "#4a4058"); });   // le ali, le dita e il pollice
      o += ore.map(function (d) { return pth(d, CO); }).join("") + [-1, 1].map(function (sg) { return pth("M" + q(sg * 1.9, -8) + " L" + q(sg * 3.7, -12.1) + " L" + q(sg * 4, -7) + " Z", "#a8668a", op(.85)); }).join("");
      o += ell(0, 1.4, 4.4, 6.2, CO) + ell(0, 2.8, 2.5, 3.6, "#5b5269", op(.55)) + tratto("M-1,1.6 l.4,1 M.6,2.4 l.4,1 M-.4,4 l.4,1", "#8a7fa0", .4, op(.8));   // il corpo e il pancino peloso
      o += cer(0, -4.5, 4.4, CO) + ell(-1.8, -7.1, 1.3, .8, "#ffffff", op(.45) + " " + gira(-25, -1.8, -7.1)) + ell(-3.1, .2, .7, 2.2, "#ffffff", op(.22));
      o += ell(-1.75, -4.4, 1.35, 1.6, OC, bordo(L, .35)) + ell(1.75, -4.4, 1.35, 1.6, OC, bordo(L, .35)) + ell(-1.65, -4.3, .42, 1.05, "#0c0a0f") + ell(1.85, -4.3, .42, 1.05, "#0c0a0f") + cer(-2.2, -5, .38, "#ffffff") + cer(1.3, -5, .38, "#ffffff");   // gli occhi gialli
      o += cer(0, -2.7, .45, "#c97a9a") + tratto("M-1.6,-1.7 Q0,-.8 1.6,-1.7", "#0c0a0f", .5) + pth("M-1.3,-1.45 L-.45,-1.2 L-.95,.2 Z M1.3,-1.45 L.45,-1.2 L.95,.2 Z", "#ffffff", bordo(L, .25));   // il nasino, la bocca e i dentini
      o += tratto("M-1.4,7.3 l-.5,1.3 M1.4,7.3 l.5,1.3", L, .9);   // le zampette
      return { sil: "<g " + tr + ">" + sil + "</g>", s: "<g " + tr + ">" + o + "</g>" };
    }
    var st = [pip(40, 114, 1.6, "ali", -9), pip(87, 76, 1.3, "su", 8), pip(33, 52, .95, "giu", -6), pip(101, 131, .85, "su", 12), pip(106, 33, .62, "giu", -14)];
    return st.map(function (b) { return ombraMuro(b.sil, 3.2, 4.2, .16); }).join("") + st.map(function (b) { return b.s; }).join("");
  });

  // =========================================================
  //  TAPPETO RAGNATELA (a terra, 2 × 2): il feltro grigio antracite a forma di tela, coi fili d'argento ricamati in rilievo,
  //  il bordino viola con le cuciture arancioni e il ragnetto di peluche arancione con la faccia da zucca sulla pancia
  // =========================================================
  def("tappeto_ragnatela", { tipo: "terra", nome: "Tappeto ragnatela", fp: [2, 2], w: 200, h: 200, prezzo: 500 }, function () {
    var r = rnd(61), s = "", i, k, C = 100, N = 8, R = 93;
    function pt(a, rr) { return [C + Math.cos(a) * rr, C + Math.sin(a) * rr]; }
    var ang = []; for (k = 0; k < N; k++) ang.push(-Math.PI / 2 + k * 2 * Math.PI / N + (r() - .5) * .07);
    function giro2(rr, sag, salta) {   // un giro di tela: tra un raggio e l'altro il filo si incurva verso il centro
      var d = "", k2;
      for (k2 = 0; k2 < N; k2++) {
        if (salta && salta(k2)) continue;
        var a0 = ang[k2], a1 = ang[(k2 + 1) % N] + (k2 === N - 1 ? 2 * Math.PI : 0), r0 = rr * (.97 + r() * .06), r1 = rr * (.97 + r() * .06);
        d += "M" + q(pt(a0, r0)) + " Q" + q(pt((a0 + a1) / 2, (r0 + r1) / 2 * sag)) + " " + q(pt(a1, r1)) + " ";
      }
      return d;
    }
    var bd = "M" + q(pt(ang[0], R));   // il bordo del tappeto: l'ultimo giro della tela
    for (k = 0; k < N; k++) { var a0 = ang[k], a1 = ang[(k + 1) % N] + (k === N - 1 ? 2 * Math.PI : 0); bd += " Q" + q(pt((a0 + a1) / 2, R * .8)) + " " + q(pt(a1, R)); }
    bd += " Z";
    s += pth(bd, "#000", "transform='translate(1.6 2.6)' " + op(.18));   // l'ombra
    // il feltro col pelo
    var tex = "";
    for (i = 0; i < 420; i++) { var an = r() * 6.2832, rr = Math.sqrt(r()) * R; tex += cer(C + Math.cos(an) * rr, C + Math.sin(an) * rr, .5 + r() * .5, r() < .5 ? "#ffffff" : "#000000", op(.04 + r() * .06)); }
    s += pth(bd, rad("fe", [[0, "#545b64"], [.55, "#3a4047"], [1, "#24282d"]], .42, .38, .62));
    // i fili d'argento ricamati: l'ombra del rilievo, il filo, il lucido
    var dR = "", dG = "";
    for (k = 0; k < N; k++) dR += "M" + q(pt(ang[k], 5)) + " L" + q(pt(ang[k], R - 2)) + " ";
    [17, 31, 46, 61, 76].forEach(function (rr, j) { dG += giro2(rr, .86, j === 3 ? function (k2) { return k2 === 5; } : null); });
    var rotto = pt((ang[5] + ang[6]) / 2, 54);   // un filo rotto che si arriccia
    dG += "M" + q(pt(ang[5], 61)) + " Q" + q(rotto[0] + 3, rotto[1] - 2) + " " + q(rotto) + " M" + q(pt(ang[6], 61)) + " Q" + q(rotto[0] + 2, rotto[1] + 7) + " " + q(rotto[0] - 2, rotto[1] + 5) + " ";
    s += dentro(bd, tex + tratto(dR + dG, "#111316", 2.8, "transform='translate(.6 .9)' " + op(.7)) + tratto(dR, "#c9ced4", 1.9) + tratto(dG, "#c9ced4", 1.6) + tratto(dR + dG, "#ffffff", .55, "transform='translate(-.35 -.45)' " + op(.7)) +
      cer(C, C, 4.6, "none", "stroke='#111316' stroke-width='2.4' transform='translate(.6 .9)' " + op(.7)) + cer(C, C, 4.6, "none", "stroke='#c9ced4' stroke-width='1.8'") + cer(C, C, 1.6, "#c9ced4") +
      ell(66, 58, 74, 58, rad("lu", [[0, "#ffffff", .13], [1, "#ffffff", 0]], .5, .5, .5)));   // la lucentezza del feltro
    // il bordino viola con la cucitura arancione
    s += tratto(bd, L, 7.4) + tratto(bd, lin("vi", [[0, "#9775fa"], [.5, "#6741d9"], [1, "#4527a0"]], 0, 0, 1, 1), 4.8) + tratto(bd, "#c0aaff", .8, "transform='translate(-.5 -.7)' " + op(.7));
    s += "<path d='" + bd + "' fill='none' stroke='#ff922b' stroke-width='1.2' stroke-dasharray='3.4 2.6' stroke-linecap='round' transform='translate(" + f1(C * .07) + " " + f1(C * .07) + ") scale(.93)'/>";
    // il ragnetto di peluche, che cammina verso il centro
    var sx = 137, sy = 64, Z = [[4.4, -6.4, 12, -14, 14, -21], [4.9, -4.2, 14.4, -6.4, 20.4, -9.6], [4.9, -1.8, 14.6, 2.4, 20.4, 7.4], [4.4, .4, 12, 10.4, 15.2, 18]], dz = "", o = "";
    [-1, 1].forEach(function (sg) { Z.forEach(function (z) { dz += "M" + q(sg * z[0], z[1]) + " L" + q(sg * z[2], z[3]) + " L" + q(sg * z[4], z[5]) + " "; }); });
    o += tratto(dz, L, 3.8) + tratto(dz, "#2a2531", 2.3) + "<path d='" + dz + "' fill='none' stroke='#ff922b' stroke-width='2.3' stroke-dasharray='1.8 2.2'/>";   // le zampe a righe
    o += ell(0, 8, 9, 10.4, rad("pz", [[0, "#ffd8a8"], [.4, "#ff922b"], [1, "#c2410c"]], .38, .3, .75), bordo(L, 1.6));   // la pancia a zucca
    o += tratto("M-4.2,-1.4 Q-4.6,8 -3,17.4 M0,-2.2 L0,18.4 M4.2,-1.4 Q4.6,8 3,17.4", "#d9480f", .7, op(.6));
    o += pth("M-5,3.2 L-1.6,3.2 L-3.3,6.6 Z M5,3.2 L1.6,3.2 L3.3,6.6 Z M-5.6,9.6 L-3.8,11.6 L-1.9,9.8 L0,11.8 L1.9,9.8 L3.8,11.6 L5.6,9.6 Q4.6,15.4 0,15.6 Q-4.6,15.4 -5.6,9.6 Z", "#5a230a");   // la faccia da zucca
    o += ell(-3.6, 2.4, 2.2, 3.4, "#ffffff", op(.4) + " " + gira(-20, -3.6, 2.4));
    o += ell(0, -4.4, 5.8, 5.4, rad("tr", [[0, "#6a5f7c"], [.5, "#2f2838"], [1, "#141118"]], .35, .3, .8), bordo(L, 1.5));   // la testa
    o += ell(-2.2, -6.6, 2, 2.2, "#ffffff", bordo(L, .5)) + ell(2.2, -6.6, 2, 2.2, "#ffffff", bordo(L, .5)) + cer(-2, -7.1, 1, "#141118") + cer(2.4, -7.1, 1, "#141118") + cer(-2.4, -7.5, .35, "#ffffff") + cer(2, -7.5, .35, "#ffffff");
    s += "<g transform='translate(" + (sx + 1.6) + " " + (sy + 2.6) + ") rotate(-35) scale(1.15)' " + op(.22) + ">" + tratto(dz, "#000", 3.4) + ell(0, 8, 9.4, 10.8, "#000") + ell(0, -4.4, 5.8, 5.4, "#000") + "</g>";   // l'ombra (è di peluche, un po' alto)
    s += "<g transform='translate(" + sx + " " + sy + ") rotate(-35) scale(1.15)'>" + o + "</g>";
    return s;
  });

  // =========================================================
  function misure(d) { if (d.tipo !== "piedi" && d.tipo !== "sopra") return { w: d.w, h: d.h }; var b = d.box; return { w: Math.ceil(b[2] - b[0]), h: Math.ceil(b[3] - b[1]), ax: Math.ceil(-b[0]), ay: Math.ceil(-b[1]) }; }
  window.SGMobiliArte.aggiungi({
    nomi: function () { return Object.keys(DIS); },
    info: function (nome) {
      var d = DIS[nome]; if (!d) return null;
      var m = misure(d), o = { tipo: d.tipo, nome: d.nome, stanza: "tutte", reparto: "halloween", w: m.w, h: m.h, fp: (d.fp || [1, 1]).slice(), prezzo: d.prezzo, qual: 2 };
      if (d.tipo === "piedi" || d.tipo === "sopra") { o.ax = m.ax; o.ay = m.ay; o.dietro = !!d.dietro; }
      if (d.luce) o.luce = d.tipo === "piedi" || d.tipo === "sopra" ? [m.ax + d.luce[0], m.ay + d.luce[1], d.luce[2], d.luce[3]] : d.luce.slice();   // dove esce la luce, nelle misure del disegno
      return o;
    },
    svg: function (nome, opz) {
      var d = DIS[nome]; if (!d) return "";
      opz = opz || {};
      var m = misure(d);
      p = "hw" + (++nId) + "_"; DEFS = []; FATTI = {}; nC = 0; G = opz.dietro && d.dietro ? -1 : 1; NOTTE = !!opz.notte;
      var c; try { c = d.fn(opz); } finally { G = 1; NOTTE = false; }
      var testa = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 " + m.w + " " + m.h + "' width='" + m.w + "' height='" + m.h + "'>" + (DEFS.length ? "<defs>" + DEFS.join("") + "</defs>" : "");
      if (d.tipo !== "piedi" && d.tipo !== "sopra") return testa + c + "</svg>";
      return testa + "<g transform='translate(" + m.ax + " " + m.ay + ")'>" + c + "</g></svg>";
    }
  });
})();

/* =========================================================
   STUDIO TV, LIVELLO 2: le tre strade di prova.
   Lo studio è un solo SVG grande come il "mondo" di js/studio.js
   (2 schermi di larghezza x 2 di altezza: maxischermo, pubblico,
   leggii negli stessi posti di oggi). Le inquadrature sono solo
   viewBox diversi: come la telecamera del gioco.
   Solo prova grafica: il gioco non lo carica.
   ========================================================= */
(function () {
  "use strict";
  var VW = 390, VH = 844, W = 780, H = 1688;
  var SCH = { x: 0.5 * VW, y: 0.06 * VH, w: VW, h: VH };   // il maxischermo (come S.R.schermo)
  // i posti dei leggii con 3 concorrenti (come postiLeggii di studio.js)
  var POSTI = [0, 1, 2].map(function (i) { var sp = 1.92 * VW / 3; return { cx: 0.04 * VW + sp * (i + 0.5), top: 1.36 * VH, w: Math.min(0.46 * VW, sp * 0.92) }; });
  var GIOC = [{ nome: "Paky", col: "#ffd43b" }, { nome: "Luca", col: "#4dabf7" }, { nome: "Giulia", col: "#ff6b6b" }];
  function camLeggio(i) {   // come suLeggio di studio.js
    var p = POSTI[i], w = Math.max(0.64 * VW, p.w * 1.5), h = w * VH / VW;
    return [Math.max(0, Math.min(W - w, p.cx - w / 2)), Math.max(0, Math.min(H - h, p.top + p.w * 0.72 - h / 2)), w, h];
  }
  // sul maxischermo la telecamera sta un filo più larga di quella del gioco, così si vede anche la cornice
  var CAM = { largo: [0, 0, W, H], leggio: camLeggio(0), schermo: (function () { var w = VW * 1.12; return [VW - w / 2, 0, w, w * VH / VW]; })() };

  // caso "fisso": lo stesso studio viene sempre uguale
  function rnd(seme) { var s = (seme >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; }
  function n(x) { return Math.round(x * 100) / 100; }
  function st(s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }
  function lin(id, x1, y1, x2, y2, stops, extra) { return "<linearGradient id='" + id + "' x1='" + x1 + "' y1='" + y1 + "' x2='" + x2 + "' y2='" + y2 + "'" + (extra || "") + ">" + stops.map(st).join("") + "</linearGradient>"; }
  function rad(id, cx, cy, r, stops, extra) { return "<radialGradient id='" + id + "' cx='" + cx + "' cy='" + cy + "' r='" + r + "'" + (extra || "") + ">" + stops.map(st).join("") + "</radialGradient>"; }
  var REG = " filterUnits='userSpaceOnUse' x='-200' y='-200' width='1180' height='2088' color-interpolation-filters='sRGB'";
  function sfoca(id, sd) { return "<filter id='" + id + "'" + REG + "><feGaussianBlur stdDeviation='" + sd + "'/></filter>"; }
  // bagliore: l'oggetto resta nitido e attorno fa luce
  function bagliore(id, sd, forza) { return "<filter id='" + id + "'" + REG + "><feGaussianBlur in='SourceGraphic' stdDeviation='" + sd + "' result='b'/><feComponentTransfer in='b' result='b2'><feFuncA type='linear' slope='" + (forza || 1.4) + "'/></feComponentTransfer><feMerge><feMergeNode in='b2'/><feMergeNode in='SourceGraphic'/></feMerge></filter>"; }
  // pubblico in penombra: colori spenti, più scuro, un filo di luce sul bordo alto (controluce) e sfocato quanto serve
  function filtroPubblico(id, o) {
    return "<filter id='" + id + "'" + REG + ">" +
      "<feColorMatrix in='SourceGraphic' type='saturate' values='" + o.sat + "' result='s'/>" +
      "<feComponentTransfer in='s' result='d'><feFuncR type='linear' slope='" + o.k[0] + "' intercept='" + o.q[0] + "'/><feFuncG type='linear' slope='" + o.k[1] + "' intercept='" + o.q[1] + "'/><feFuncB type='linear' slope='" + o.k[2] + "' intercept='" + o.q[2] + "'/></feComponentTransfer>" +
      "<feOffset in='SourceAlpha' dx='" + (o.dx || 0) + "' dy='" + (o.dy || 2) + "' result='o'/><feComposite in='SourceAlpha' in2='o' operator='out' result='e'/>" +
      "<feFlood flood-color='" + o.rim + "' flood-opacity='" + o.rimA + "'/><feComposite in2='e' operator='in' result='rim'/>" +
      "<feMerge result='m'><feMergeNode in='d'/><feMergeNode in='rim'/></feMerge>" +
      "<feGaussianBlur in='m' stdDeviation='" + o.blur + "'/></filter>";
  }
  // l'avatar sul palco: toni appena più veri (ombre fredde) e il controluce colorato sul bordo
  function filtroAvatar(id, o) {
    return "<filter id='" + id + "'" + REG + ">" +
      "<feComponentTransfer in='SourceGraphic' result='d'><feFuncR type='linear' slope='" + o.k[0] + "'/><feFuncG type='linear' slope='" + o.k[1] + "'/><feFuncB type='linear' slope='" + o.k[2] + "'/></feComponentTransfer>" +
      "<feOffset in='SourceAlpha' dx='" + o.dx + "' dy='" + o.dy + "' result='o'/><feComposite in='SourceAlpha' in2='o' operator='out' result='e'/><feGaussianBlur in='e' stdDeviation='" + (o.morb || 0.9) + "' result='e2'/>" +
      "<feFlood flood-color='" + o.rim + "' flood-opacity='" + o.rimA + "'/><feComposite in2='e2' operator='in' result='rim'/><feComposite in='rim' in2='SourceAlpha' operator='in' result='rim2'/>" +
      "<feMerge><feMergeNode in='d'/><feMergeNode in='rim2'/></feMerge></filter>";
  }
  // la griglia dei led (si vede da vicino, da lontano fa solo "schermo vero")
  function griglia(id, passo, col, a) {
    return "<pattern id='" + id + "' width='" + passo + "' height='" + passo + "' patternUnits='userSpaceOnUse'><path d='M0 " + (passo - 0.4) + "H" + passo + "M" + (passo - 0.4) + " 0V" + passo + "' stroke='" + col + "' stroke-opacity='" + a + "' stroke-width='.8'/></pattern>";
  }
  // fascio di luce: stretto alla sorgente, largo in fondo, sfuma lungo la strada
  function fascio(id, x0, y0, x1, y1, w0, w1, col, a0, a1, filtro, blend) {
    var dx = x1 - x0, dy = y1 - y0, L = Math.sqrt(dx * dx + dy * dy), nx = -dy / L, ny = dx / L;
    var pts = [[x0 + nx * w0 / 2, y0 + ny * w0 / 2], [x1 + nx * w1 / 2, y1 + ny * w1 / 2], [x1 - nx * w1 / 2, y1 - ny * w1 / 2], [x0 - nx * w0 / 2, y0 - ny * w0 / 2]];
    return "<linearGradient id='" + id + "' gradientUnits='userSpaceOnUse' x1='" + n(x0) + "' y1='" + n(y0) + "' x2='" + n(x1) + "' y2='" + n(y1) + "'>" + st([0, col, a0]) + st([0.55, col, n((a0 + a1) * 0.42)]) + st([1, col, a1]) + "</linearGradient>" +
      "<polygon points='" + pts.map(function (q) { return n(q[0]) + "," + n(q[1]); }).join(" ") + "' fill='url(#" + id + ")'" + (filtro ? " filter='url(#" + filtro + ")'" : "") + (blend ? " style='mix-blend-mode:" + blend + "'" : "") + "/>";
  }
  function rett(x, y, w, h, extra) { return "<rect x='" + n(x) + "' y='" + n(y) + "' width='" + n(w) + "' height='" + n(h) + "' " + (extra || "") + "/>"; }
  function ell(cx, cy, rx, ry, extra) { return "<ellipse cx='" + n(cx) + "' cy='" + n(cy) + "' rx='" + n(rx) + "' ry='" + n(ry) + "' " + (extra || "") + "/>"; }
  function testo(x, y, t, extra) { return "<text x='" + n(x) + "' y='" + n(y) + "' " + (extra || "") + ">" + t + "</text>"; }

  // ---------- avatar (quelli veri dell'app, js/omino.js) ----------
  var URL_AV = {}, PUB = [];
  function urlAvatar(nome) {
    if (URL_AV[nome]) return URL_AV[nome];
    var svg = SGOmino.svg(SGOmino.casuale(nome), { busto: true });
    URL_AV[nome] = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" }));
    return URL_AV[nome];
  }
  function pronto() {
    var nomi = GIOC.map(function (g) { return g.nome; }), i;
    for (i = 0; i < 26; i++) nomi.push("pubblico-" + i);
    var att = nomi.map(function (nm, k) {
      var u = urlAvatar(nm); if (k >= GIOC.length) PUB.push(u);
      var im = new Image(); im.src = u; return im.decode ? im.decode().catch(function () {}) : Promise.resolve();
    });
    if (document.fonts && document.fonts.load) ["400 40px Anton", "600 40px Oswald", "italic 800 40px MontserratI"].forEach(function (f) { att.push(document.fonts.load(f).catch(function () {})); });
    return Promise.all(att);
  }

  // ---------- pubblico a gradinate ----------
  // zone: [x0, x1, yAlto, yBasso]; ogni fila: prima la gente, poi il gradino davanti (la fila dopo gli sta sopra)
  function folla(p, o) {
    var r = rnd(o.seme || 5), out = [], fila = 0;
    o.zone.forEach(function (z, iz) {
      var y = z[2], k = 0;
      while (y <= z[3]) {
        var t = (y - z[2]) / Math.max(1, z[3] - z[2]), s = o.sMin + (o.sMax - o.sMin) * t, passoX = s * 0.82, x = z[0] - passoX * (k % 2 ? 0.5 : 0.1);
        var gente = [];
        while (x < z[1] + s * 0.2) {
          if (r() > 0.05) {
            var ss = s * (0.93 + r() * 0.12), xx = x + (r() - 0.5) * s * 0.14, yy = y - ss * 0.86 + (r() - 0.5) * 3;
            gente.push("<image href='" + PUB[Math.floor(r() * PUB.length)] + "' x='" + n(xx - ss / 2) + "' y='" + n(yy) + "' width='" + n(ss) + "' height='" + n(ss * 1.022) + "'" + (r() < 0.5 ? " transform='translate(" + n(2 * xx) + ",0) scale(-1,1)'" : "") + "/>");
          }
          x += passoX * (0.94 + r() * 0.12);
        }
        var fid = o.filtro ? o.filtro(iz, t) : (t < 0.35 && o.lontano ? "pubL" : "pub");
        out.push("<g filter='url(#" + p + fid + ")' clip-path='url(#" + p + "cz" + iz + ")'>" + gente.join("") + "</g>");
        out.push(o.gradino(y, z, t, fila, s));
        y += o.passo * (0.8 + 0.4 * t); k++; fila++;
      }
    });
    var clips = o.zone.map(function (z, iz) { return "<clipPath id='" + p + "cz" + iz + "'>" + rett(z[0], -40, z[1] - z[0], z[3] + 80) + "</clipPath>"; }).join("");
    return "<defs>" + clips + "</defs>" + out.join("");
  }

  // ---------- leggio: avatar + bancone (il bancone lo disegna la strada) ----------
  function yBanco(i) { var P = POSTI[i], em = P.w * 0.1; return P.top + P.w * 0.74 * 182 / 178 - 0.9 * em; }
  function avatar(p, i, filtro) {
    var P = POSTI[i], aw = P.w * 0.74, ah = aw * 182 / 178;
    return "<image href='" + URL_AV[GIOC[i].nome] + "' x='" + n(P.cx - aw / 2) + "' y='" + n(P.top) + "' width='" + n(aw) + "' height='" + n(ah) + "' filter='url(#" + p + filtro + ")'/>";
  }
  // riflesso sul pavimento lucido: il bancone capovolto, sfumato e sbiadito
  function riflesso(p, i, banco, yb, a, sfoc) {
    return "<g mask='url(#" + p + "mr" + i + ")'><g opacity='" + a + "' filter='url(#" + p + sfoc + ")' transform='translate(0," + n(2 * yb) + ") scale(1,-1)'>" + banco + "</g></g>" +
      "<mask id='" + p + "mr" + i + "' maskUnits='userSpaceOnUse' x='0' y='" + n(yb) + "' width='" + W + "' height='160'>" + rett(0, yb, W, 160, "fill='url(#" + p + "sfumaGiu)'") + "</mask>";
  }

  // =====================================================================
  // STRADA A · «Prima serata»: palco nero lucido, LED wall a colori pieni,
  // fasci di luce veri nella foschia, pubblico in penombra
  // =====================================================================
  function mondoA(p, shot) {
    var o = [], d = [], i, r = rnd(31);
    var dof = shot === "leggio" ? 1.5 : shot === "schermo" ? 0.7 : 0.3;
    d.push(
      lin(p + "fondo", 0, 0, 0, 1, [[0, "#0b0d1e"], [0.5, "#060714"], [1, "#020309"]]),
      lin(p + "sfumaGiu", 0, 0, 0, 1, [[0, "#fff", 0.9], [1, "#fff", 0]]),
      rad(p + "schBase", 0.5, 0.36, 0.85, [[0, "#3a5dff"], [0.22, "#1f39c9"], [0.52, "#0d1868"], [1, "#04061e"]]),
      rad(p + "aloneTit", 0.5, 0.5, 0.5, [[0, "#ff3fb4", 0.55], [0.5, "#b02cff", 0.22], [1, "#b02cff", 0]]),
      rad(p + "aloneCiano", 0.5, 0.5, 0.5, [[0, "#29d3ff", 0.5], [1, "#29d3ff", 0]]),
      lin(p + "titolo", 0, 0, 0, 1, [[0, "#ffffff"], [0.55, "#e2edff"], [1, "#9fbaff"]]),
      lin(p + "riga", 0, 0, 1, 0, [[0, "#9fc0ff", 0], [0.5, "#ffffff", 0.85], [1, "#9fc0ff", 0]]),
      lin(p + "vetro", 0, 0, 1, 1, [[0, "#fff", 0.09], [0.35, "#fff", 0], [1, "#fff", 0]]),
      lin(p + "bordoPalco", 0, 0, 1, 0, [[0, "#2f6bff"], [0.3, "#7a4dff"], [0.5, "#ff3fb0"], [0.7, "#7a4dff"], [1, "#2f6bff"]]),
      lin(p + "pavimento", 0, 0, 0, 1, [[0, "#0d1022"], [0.35, "#070915"], [1, "#020308"]]),
      lin(p + "gradino", 0, 0, 0, 1, [[0, "#0e1122"], [1, "#05060c"]]),
      lin(p + "traliccio", 0, 0, 0, 1, [[0, "#8b93ad"], [0.5, "#3a4058"], [1, "#151826"]]),
      rad(p + "pozza", 0.5, 0.5, 0.5, [[0, "#fff4dc", 0.55], [0.45, "#ffe7b8", 0.22], [1, "#ffe7b8", 0]]),
      rad(p + "nebbia", 0.5, 0.5, 0.5, [[0, "#4b6bff", 0.2], [1, "#4b6bff", 0]]),
      rad(p + "nebbiaRosa", 0.5, 0.5, 0.5, [[0, "#ff3fb0", 0.18], [1, "#ff3fb0", 0]]),
      lin(p + "lato", 0, 0, 1, 1, [[0, "#0a0f3a"], [1, "#060818"]]),
      lin(p + "piano", 0, 0, 0, 1, [[0, "#4a5070"], [0.18, "#1c2033"], [1, "#0b0c15"]]),
      lin(p + "fronte", 0, 0, 0, 1, [[0, "#1e2236"], [0.6, "#0e1020"], [1, "#07080f"]]),
      lin(p + "riflFronte", 0, 0, 1, 0.6, [[0, "#fff", 0.12], [0.4, "#fff", 0.02], [1, "#fff", 0]]),
      sfoca(p + "s2", 2), sfoca(p + "s4", 4), sfoca(p + "s8", 8), sfoca(p + "s14", 14), sfoca(p + "s28", 28), sfoca(p + "s1", 1.2),
      bagliore(p + "gl", 3, 1.6), bagliore(p + "gl8", 8, 1.3), bagliore(p + "glP", 2.2, 0.7),
      griglia(p + "led", 2.5, "#000", 0.12), griglia(p + "led5", 4, "#000", 0.38),
      "<mask id='" + p + "senzaSch' maskUnits='userSpaceOnUse' x='0' y='0' width='780' height='1688'>" + rett(0, 0, W, H, "fill='#fff'") + rett(SCH.x, SCH.y, SCH.w, SCH.h, "rx='6' fill='#333'") + "</mask>",
      filtroPubblico(p + "pub", { sat: 0.3, k: [0.085, 0.09, 0.15], q: [0.002, 0.003, 0.012], rim: "#9cbcff", rimA: 0.42, dy: 1.8, blur: dof }),
      filtroPubblico(p + "pubL", { sat: 0.2, k: [0.07, 0.075, 0.13], q: [0.003, 0.004, 0.014], rim: "#8fb0ff", rimA: 0.28, dy: 1.5, blur: dof + 0.4 }),
      filtroAvatar(p + "avOn", { k: [1.04, 1.0, 0.94], dx: 0, dy: 3, rim: "#fff2d0", rimA: 0.95 }),
      filtroAvatar(p + "avOff", { k: [0.8, 0.83, 0.95], dx: 1.5, dy: 2.5, rim: "#8fb4ff", rimA: 0.8 }),
      "<clipPath id='" + p + "clSch'>" + rett(SCH.x, SCH.y, SCH.w, SCH.h, "rx='6'") + "</clipPath>",
      "<clipPath id='" + p + "clL0'>" + rett(16, 38, 164, 394, "rx='5'") + "</clipPath>",
      "<clipPath id='" + p + "clL1'>" + rett(600, 38, 164, 394, "rx='5'") + "</clipPath>"
    );
    // fondo e parete di fondo (listelli verticali appena accesi)
    o.push(rett(0, 0, W, H, "fill='url(#" + p + "fondo)'"));
    for (i = 0; i < 26; i++) { var xl = 6 + i * 30.5; if (xl > 182 && xl < 598) continue; o.push(rett(xl, 0, 1.2, 450, "fill='#4060c0' opacity='" + n(0.08 + r() * 0.08) + "'")); }
    o.push(ell(110, 260, 260, 320, "fill='url(#" + p + "nebbia)'"), ell(670, 260, 260, 320, "fill='url(#" + p + "nebbia)'"));
    // LED wall laterali: immagini a colori pieni, con la grana dei led
    [0, 1].forEach(function (lato) {
      var x0 = lato ? 600 : 16, sx = function (x) { return lato ? 600 + 164 - (x - 16) : x; };
      o.push("<g clip-path='url(#" + p + "clL" + lato + ")'>", rett(x0, 38, 164, 394, "fill='url(#" + p + "lato)'"),
        "<g filter='url(#" + p + "s28)'>", ell(sx(50), 120, 120, 90, "fill='#2a4dff' opacity='.95'"), ell(sx(160), 300, 110, 90, "fill='#ff2fa0' opacity='.85'"),
        ell(sx(40), 410, 90, 60, "fill='#00c8ff' opacity='.6'"), ell(sx(130), 180, 60, 50, "fill='#8a3dff' opacity='.8'"), "</g>",
        "<g filter='url(#" + p + "s2)' style='mix-blend-mode:screen'>");
      for (var k = 0; k < 6; k++) { var yy = 70 + k * 62; o.push("<rect x='" + (x0 - 20) + "' y='" + yy + "' width='210' height='" + (k % 2 ? 2 : 4) + "' fill='#fff' opacity='" + (k % 2 ? 0.25 : 0.4) + "' transform='rotate(" + (lato ? 14 : -14) + " " + (x0 + 82) + " " + yy + ")'/>"); }
      o.push("</g>", rett(x0, 38, 164, 394, "fill='url(#" + p + "led5)'"), rett(x0, 38, 164, 394, "fill='url(#" + p + "vetro)'"), "</g>",
        rett(x0 - 3, 35, 170, 400, "rx='7' fill='none' stroke='#0c0e18' stroke-width='5'"), rett(x0 - 5.5, 32.5, 175, 405, "rx='8' fill='none' stroke='#59618a' stroke-opacity='.35' stroke-width='1'"));
    });
    // la luce del maxischermo che si spande attorno
    o.push(rett(SCH.x - 10, SCH.y - 10, SCH.w + 20, SCH.h + 20, "rx='14' fill='none' stroke='#2f5bff' stroke-width='40' opacity='.42' filter='url(#" + p + "s28)'"));
    // pubblico: gradinate ai lati e sotto il maxischermo
    o.push(folla(p, {
      seme: 7, passo: 44, sMin: 33, sMax: 44, lontano: true,
      zone: [[6, 188, 478, 1232], [592, 774, 478, 1232], [6, 774, 944, 1232]],
      gradino: function (y, z, t, fila) {
        return rett(z[0], y, z[1] - z[0], 44, "fill='url(#" + p + "gradino)'") + (fila % 3 ? "" :
          rett(z[0], y - 0.5, z[1] - z[0], 1, "fill='#5b86ff' opacity='" + n(0.12 + 0.22 * t) + "' filter='url(#" + p + "gl)'"));
      }
    }));
    // foschia sul pubblico: luci colorate morbide
    o.push("<g style='mix-blend-mode:screen'>", ell(90, 760, 200, 260, "fill='url(#" + p + "nebbiaRosa)'"), ell(690, 820, 200, 260, "fill='url(#" + p + "nebbia)'"), "</g>");
    // il maxischermo
    o.push(schermoA(p));
    // traliccio in alto con le teste mobili
    o.push(rett(0, 4, W, 3.5, "fill='url(#" + p + "traliccio)'"), rett(0, 24, W, 3.5, "fill='url(#" + p + "traliccio)'"));
    var zz = "M0 7"; for (i = 0; i < 40; i++) zz += "L" + n(i * 20 + 10) + " " + (i % 2 ? 7 : 24);
    o.push("<path d='" + zz + "' fill='none' stroke='#4a516b' stroke-width='1.4'/>");
    var TESTE = [[40, "#a8c8ff"], [128, "#ff3fb0"], [652, "#ff3fb0"], [740, "#a8c8ff"]];
    TESTE.forEach(function (t) {
      o.push(rett(t[0] - 9, 27, 18, 9, "rx='2' fill='#1a1d2b'"), rett(t[0] - 11, 34, 22, 15, "rx='6' fill='#262a3c' stroke='#5d6584' stroke-width='.8'"));
    });
    // fasci di luce nella foschia
    o.push("<g style='mix-blend-mode:screen' mask='url(#" + p + "senzaSch)'>",
      fascio(p + "f1", 40, 46, 330, 1236, 8, 190, "#a8c8ff", 0.42, 0.04, p + "s8"), fascio(p + "f1c", 40, 46, 330, 1236, 3, 60, "#e6f0ff", 0.5, 0.02, p + "s2"),
      fascio(p + "f2", 128, 46, 30, 1236, 8, 170, "#ff3fb0", 0.4, 0.04, p + "s8"), fascio(p + "f2c", 128, 46, 30, 1236, 3, 50, "#ff9ad6", 0.45, 0.02, p + "s2"),
      fascio(p + "f3", 652, 46, 750, 1236, 8, 170, "#ff3fb0", 0.4, 0.04, p + "s8"), fascio(p + "f3c", 652, 46, 750, 1236, 3, 50, "#ff9ad6", 0.45, 0.02, p + "s2"),
      fascio(p + "f4", 740, 46, 450, 1236, 8, 190, "#a8c8ff", 0.42, 0.04, p + "s8"), fascio(p + "f4c", 740, 46, 450, 1236, 3, 60, "#e6f0ff", 0.5, 0.02, p + "s2"),
      "</g>");
    TESTE.forEach(function (t) {
      o.push(ell(t[0], 46, 18, 12, "fill='" + t[1] + "' opacity='.75' filter='url(#" + p + "s8)'"), ell(t[0], 45, 6.5, 4.5, "fill='#fff'"),
        ell(t[0], 45, 38, 1.4, "fill='#fff' opacity='.55' filter='url(#" + p + "s1)'"));
    });
    // il bordo del palco: una riga di led, e il suo riflesso sul pavimento lucido
    o.push(rett(0, 1236, W, 16, "fill='#080a14'"), rett(0, 1252, W, H - 1252, "fill='url(#" + p + "pavimento)'"));
    var fug = "";   // le giunture del pavimento, in prospettiva
    for (i = -8; i <= 16; i++) { var xb = 390 + (i - 4) * 120; fug += "M" + n(390 + (xb - 390) * 0.11) + " 1252L" + n(xb) + " 1688"; }
    [1268, 1296, 1336, 1392, 1470, 1580].forEach(function (y) { fug += "M0 " + y + "H780"; });
    o.push("<path d='" + fug + "' stroke='#90a8ff' stroke-opacity='.06' stroke-width='1' fill='none'/>");
    o.push(rett(0, 1236, W, 2.5, "fill='url(#" + p + "bordoPalco)' filter='url(#" + p + "gl8)'"),
      rett(0, 1254, W, 46, "fill='url(#" + p + "bordoPalco)' opacity='.22' filter='url(#" + p + "s14)' style='mix-blend-mode:screen'"));
    // l'occhio di bue su chi tocca (Paky): cono caldo nella foschia e pozza di luce
    var P0 = POSTI[0];
    o.push("<g style='mix-blend-mode:screen'>", fascio(p + "spot", 182, -10, P0.cx, 1398, 26, 250, "#fff1d6", 0.22, 0.07, p + "s8"),
      ell(P0.cx, 1400, 150, 26, "fill='url(#" + p + "pozza)'"), "</g>");
    // i leggii
    for (i = 0; i < 3; i++) {
      var yb = yBanco(i), b = bancoA(p, i, yb);
      o.push(riflesso(p, i, b, yb + 122, 0.26, "s4"));
      o.push(ell(POSTI[i].cx, yb + 126, 100, 10, "fill='" + GIOC[i].col + "' opacity='.55' filter='url(#" + p + "s8)' style='mix-blend-mode:screen'"));
      o.push(avatar(p, i, i === 0 ? "avOn" : "avOff"), b);
    }
    // foschia bassa davanti al palco
    o.push(rett(0, 1200, W, 60, "fill='#5b7bff' opacity='.04' filter='url(#" + p + "s28)'"));
    return "<defs>" + d.join("") + "</defs>" + o.join("");
  }
  function schermoA(p) {
    var o = [], cx = SCH.x + SCH.w / 2, cy = SCH.y + SCH.h * 0.47, i;
    o.push("<g clip-path='url(#" + p + "clSch)'>", rett(SCH.x, SCH.y, SCH.w, SCH.h, "fill='url(#" + p + "schBase)'"));
    // raggi di luce dal centro (fermi qui; nel gioco girano piano)
    o.push("<g opacity='.5' style='mix-blend-mode:screen' filter='url(#" + p + "s2)'>");
    for (i = 0; i < 28; i++) { var a = i / 28 * Math.PI * 2, a2 = a + 0.035; o.push("<polygon points='" + n(cx) + "," + n(cy) + " " + n(cx + Math.cos(a) * 900) + "," + n(cy + Math.sin(a) * 900) + " " + n(cx + Math.cos(a2) * 900) + "," + n(cy + Math.sin(a2) * 900) + "' fill='#9fc0ff' opacity='" + (i % 2 ? 0.12 : 0.22) + "'/>"); }
    o.push("</g>");
    o.push(ell(cx, cy, 250, 150, "fill='url(#" + p + "aloneTit)'"), ell(cx - 60, cy + 120, 200, 90, "fill='url(#" + p + "aloneCiano)'"));
    // righe di luce orizzontali, come nelle grafiche della tv
    [cy - 120, cy + 118].forEach(function (y, k) { o.push(rett(SCH.x + 20, y, SCH.w - 40, 1.6, "fill='url(#" + p + "riga)' filter='url(#" + p + "gl)'")); });
    var T = "font-family='Anton,Oswald,Impact,sans-serif' font-size='76' text-anchor='middle' letter-spacing='1.5'";
    o.push("<g filter='url(#" + p + "s14)' opacity='.95'>", testo(cx, cy - 6, "LA LINEA", T + " fill='#3d6bff'"), testo(cx, cy + 74, "DEL TEMPO", T + " fill='#ff3fb4'"), "</g>",
      testo(cx, cy - 6, "LA LINEA", T + " fill='url(#" + p + "titolo)'"), testo(cx, cy + 74, "DEL TEMPO", T + " fill='url(#" + p + "titolo)'"));
    o.push(testo(cx, cy - 92, "IL GAME SHOW", "font-family='Inter,system-ui,sans-serif' font-weight='800' font-size='13' letter-spacing='5.5' text-anchor='middle' fill='#c9d6ff'"));
    o.push(rett(SCH.x, SCH.y, SCH.w, SCH.h, "fill='url(#" + p + "led)'"), rett(SCH.x, SCH.y, SCH.w, SCH.h, "fill='url(#" + p + "vetro)'"), "</g>");
    // cornice sottile di metallo scuro
    o.push(rett(SCH.x - 3.5, SCH.y - 3.5, SCH.w + 7, SCH.h + 7, "rx='9' fill='none' stroke='#0b0d16' stroke-width='7'"),
      rett(SCH.x - 7.5, SCH.y - 7.5, SCH.w + 15, SCH.h + 15, "rx='11' fill='none' stroke='#7f8cc0' stroke-opacity='.35' stroke-width='1'"));
    return o.join("");
  }
  function bancoA(p, i, y0) {
    var P = POSTI[i], w = P.w, em = w * 0.1, cx = P.cx, g = GIOC[i], o = [];
    var xt = cx - w / 2 - 3, yf = y0 + 1.1 * em, yb = y0 + 6.4 * em, gid = p + "col" + i;
    o.push(lin(gid, 0, 0, 0, 1, [[0, g.col, 1], [0.7, g.col, 0.35], [1, g.col, 0.05]]));
    o.push("<polygon points='" + n(cx - 0.46 * w) + "," + n(yf) + " " + n(cx + 0.46 * w) + "," + n(yf) + " " + n(cx + 0.42 * w) + "," + n(yb) + " " + n(cx - 0.42 * w) + "," + n(yb) + "' fill='url(#" + p + "fronte)' stroke='#2b3150' stroke-width='1'/>");
    // colonnine di luce nel colore del concorrente: piene in alto, si spengono verso il basso
    [-1, 1].forEach(function (s) {
      o.push("<polygon points='" + n(cx + s * 0.405 * w) + "," + n(yf + 4) + " " + n(cx + s * 0.392 * w) + "," + n(yf + 4) + " " + n(cx + s * 0.368 * w) + "," + n(yb - 5) + " " + n(cx + s * 0.381 * w) + "," + n(yb - 5) + "' fill='url(#" + gid + ")' filter='url(#" + p + "gl)'/>");
    });
    // riflesso del vetro, in diagonale
    o.push("<polygon points='" + n(cx - 0.46 * w) + "," + n(yf) + " " + n(cx + 0.1 * w) + "," + n(yf) + " " + n(cx - 0.2 * w) + "," + n(yb) + " " + n(cx - 0.42 * w) + "," + n(yb) + "' fill='url(#" + p + "riflFronte)'/>");
    o.push(testo(cx, y0 + 3.05 * em, g.nome, "font-family='Inter,system-ui,sans-serif' font-weight='800' font-size='" + n(1.2 * em) + "' text-anchor='middle' fill='#fff'"));
    // il tabellone dei punti: incassato, cifre luminose
    o.push(rett(cx - 0.3 * w, y0 + 3.55 * em, 0.6 * w, 2.0 * em, "rx='5' fill='#020309' stroke='#3a4370' stroke-width='1'"),
      rett(cx - 0.3 * w + 1.5, y0 + 3.55 * em + 1.5, 0.6 * w - 3, 0.7 * em, "rx='4' fill='#fff' opacity='.05'"),
      testo(cx, y0 + 5.17 * em, "0", "font-family='Oswald,Inter,sans-serif' font-weight='600' font-size='" + n(1.75 * em) + "' text-anchor='middle' fill='#dff1ff' filter='url(#" + p + "glP)'"));
    // piano di vetro nero, col filo di luce davanti
    o.push(rett(xt, y0, w + 6, 1.1 * em, "rx='5' fill='url(#" + p + "piano)'"), rett(xt + 4, y0 + 0.6, w - 2, 1.1, "rx='.6' fill='#fff' opacity='.55'"),
      rett(xt + 3, y0 + 1.1 * em - 1.8, w, 1.8, "rx='.9' fill='" + g.col + "' opacity='.9' filter='url(#" + p + "gl)'"));
    // striscia led in basso
    o.push(rett(cx - 0.42 * w, yb, 0.84 * w, 0.42 * em, "fill='" + g.col + "' filter='url(#" + p + "gl8)'"));
    return o.join("");
  }

  // ---------- quadri di contorno: interfaccia del gioco sopra la scena ----------
  var ICONE = {
    esci: "<svg viewBox='0 0 24 24' width='20' height='20'><path d='M15 5l-7 7 7 7' fill='none' stroke='currentColor' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'/></svg>",
    musica: "<svg viewBox='0 0 24 24' width='18' height='18'><path d='M9 18V6l10-2v12' fill='none' stroke='currentColor' stroke-width='2' stroke-linejoin='round'/><circle cx='6.5' cy='18' r='2.6' fill='currentColor'/><circle cx='16.5' cy='16' r='2.6' fill='currentColor'/></svg>",
    tel: "<svg viewBox='0 0 24 24' width='20' height='20'><rect x='6.5' y='2.5' width='11' height='19' rx='2.5' fill='none' stroke='currentColor' stroke-width='2'/><path d='M10.5 18.5h3' stroke='currentColor' stroke-width='2' stroke-linecap='round'/></svg>",
    via: "<svg viewBox='0 0 24 24' width='18' height='18'><path d='M7 4.5l12 7.5-12 7.5z' fill='currentColor'/></svg>"
  };
  var MONDI = { A: mondoA };
  function monta(box, strada, shot) {
    var p = "s" + strada.toLowerCase() + shot.slice(0, 3) + "_", c = CAM[shot];
    var svg = "<svg class='scena' xmlns='http://www.w3.org/2000/svg' viewBox='" + c.map(n).join(" ") + "' preserveAspectRatio='xMidYMid slice'>" + MONDI[strada](p, shot) + "</svg>";
    var ui = "<div class='grana'></div><div class='vignetta'></div>" +
      "<div class='ui-esci'>" + ICONE.esci + "</div><div class='ui-musica'>" + ICONE.musica + "</div>" +
      (shot !== "schermo" ? "<div class='ui-rec'><i></i>IN ONDA</div><div class='ui-barra'><div class='ui-btn'>" + ICONE.tel + "<span>Sono Paky, tocca a me</span>" + ICONE.via + "</div></div>" : "");
    box.innerHTML = "<div class='telefono st-" + strada.toLowerCase() + "'>" + svg + ui + "</div>";
  }
  // grana di pellicola leggera (fissa, col seme)
  function grana() {
    var c = document.createElement("canvas"); c.width = c.height = 160;
    var x = c.getContext("2d"), im = x.createImageData(160, 160), r = rnd(99);
    for (var k = 0; k < im.data.length; k += 4) { var v = Math.floor(r() * 255); im.data[k] = im.data[k + 1] = im.data[k + 2] = v; im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0);
    document.documentElement.style.setProperty("--grana", "url(" + c.toDataURL() + ")");
  }

  window.Studio2 = { pronto: function () { grana(); return pronto(); }, monta: monta, MONDI: MONDI, aiuti: {
    rnd: rnd, n: n, st: st, lin: lin, rad: rad, sfoca: sfoca, bagliore: bagliore, filtroPubblico: filtroPubblico, filtroAvatar: filtroAvatar, griglia: griglia,
    fascio: fascio, rett: rett, ell: ell, testo: testo, folla: folla, avatar: avatar, riflesso: riflesso, yBanco: yBanco,
    POSTI: POSTI, GIOC: GIOC, SCH: SCH, W: W, H: H, VW: VW, VH: VH } };
})();

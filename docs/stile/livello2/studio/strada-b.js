/* STRADA B · «Studio colorato»: pareti di pannelli LED magenta, viola, blu e ciano,
   pubblico in controluce, pavimento a piastrelle luminose, banconi di vetro */
(function () {
  "use strict";
  var A = Studio2.aiuti, n = A.n, lin = A.lin, rad = A.rad, rett = A.rett, ell = A.ell, testo = A.testo, fascio = A.fascio;
  var SCH = A.SCH, POSTI = A.POSTI, GIOC = A.GIOC, W = A.W, H = A.H;

  function mondoB(p, shot) {
    var o = [], d = [], i, r = A.rnd(53), u = function (k) { return "url(#" + p + k + ")"; };
    var dof = shot === "leggio" ? 1.5 : shot === "schermo" ? 0.7 : 0.3, MURO = 1240;
    d.push(
      lin(p + "muro", 0, 0, 1, 1, [[0, "#ff1f9b"], [0.28, "#c42bff"], [0.52, "#5b3cff"], [0.76, "#1f7bff"], [1, "#00d8ff"]]),
      lin(p + "sfumaGiu", 0, 0, 0, 1, [[0, "#fff", 0.9], [1, "#fff", 0]]),
      lin(p + "barra", 0, 0, 0, 1, [[0, "#fff", 0.85], [1, "#fff", 0]]),
      lin(p + "schB", 0, 0, 0, 1, [[0, "#2b0d7a"], [0.45, "#1c0858"], [0.75, "#160546"], [1, "#2d0a63"]]),
      rad(p + "schRosa", 0.5, 0.5, 0.5, [[0, "#ff2d95", 0.75], [0.6, "#ff2d95", 0.18], [1, "#ff2d95", 0]]),
      rad(p + "schCiano", 0.5, 0.5, 0.5, [[0, "#20d8ff", 0.6], [1, "#20d8ff", 0]]),
      lin(p + "titolo", 0, 0, 0, 1, [[0, "#ffffff"], [1, "#ffe1f3"]]),
      lin(p + "sotto", 0, 0, 1, 0, [[0, "#20e0ff"], [0.5, "#ff2d95"], [1, "#ff8a2b"]]),
      lin(p + "bordoSch", 0, 0, 1, 1, [[0, "#ffffff"], [0.5, "#9ff0ff"], [1, "#ffffff"]]),
      lin(p + "pavimento", 0, 0, 0, 1, [[0, "#22105a"], [0.3, "#120738"], [1, "#06021a"]]),
      lin(p + "gradino", 0, 0, 0, 1, [[0, "#26114f"], [1, "#0d0428"]]),
      lin(p + "vetroB", 0, 0, 0, 1, [[0, "#ffffff", 0.3], [0.5, "#ffffff", 0.12], [1, "#ffffff", 0.06]]),
      lin(p + "vetroLuce", 0, 0, 1, 0.5, [[0, "#fff", 0.35], [0.35, "#fff", 0.05], [1, "#fff", 0]]),
      lin(p + "colonna", 0, 0, 0, 1, [[0, "#fff", 0], [0.15, "#fff", 1], [0.85, "#fff", 1], [1, "#fff", 0]]),
      lin(p + "alzata", 0, 0, 0, 1, [[0, "#2a1166"], [1, "#0f0530"]]),
      lin(p + "pedata", 0, 0, 1, 0, [[0, "#ff4fc0"], [0.5, "#a46bff"], [1, "#3fd8ff"]]),
      lin(p + "bordoPalco", 0, 0, 1, 0, [[0, "#ff2d95"], [0.5, "#ffffff"], [1, "#20d8ff"]]),
      rad(p + "pozza", 0.5, 0.5, 0.5, [[0, "#fff0fa", 0.6], [0.5, "#ffd6f0", 0.22], [1, "#ffd6f0", 0]]),
      A.sfoca(p + "s2", 2), A.sfoca(p + "s4", 4), A.sfoca(p + "s8", 8), A.sfoca(p + "s14", 14), A.sfoca(p + "s24", 24), A.sfoca(p + "s40", 40),
      A.bagliore(p + "gl", 3, 1.6), A.bagliore(p + "gl8", 8, 1.4), A.bagliore(p + "glP", 2.2, 0.6),
      "<pattern id='" + p + "tess' width='52' height='52' patternUnits='userSpaceOnUse'><path d='M0 51.3H52M51.3 0V52' stroke='#14042e' stroke-opacity='.14' stroke-width='1'/></pattern>",
      A.griglia(p + "led", 2.5, "#000", 0.08),
      A.filtroPubblico(p + "pubS", { sat: 0.4, k: [0.22, 0.14, 0.27], q: [0.01, 0, 0.03], rim: "#ff8ae0", rimA: 0.95, dx: 1.4, dy: 1.8, blur: dof }),
      A.filtroPubblico(p + "pubD", { sat: 0.4, k: [0.12, 0.19, 0.28], q: [0, 0.01, 0.03], rim: "#8af0ff", rimA: 0.95, dx: -1.4, dy: 1.8, blur: dof }),
      A.filtroPubblico(p + "pubC", { sat: 0.4, k: [0.2, 0.14, 0.27], q: [0.008, 0, 0.03], rim: "#e2b8ff", rimA: 0.85, dy: 2, blur: dof }),
      A.filtroAvatar(p + "avOn", { k: [1.03, 1, 1.0], dx: 0, dy: 3, rim: "#ffffff", rimA: 0.9 }),
      A.filtroAvatar(p + "avOff", { k: [0.9, 0.86, 0.98], dx: 0, dy: 3, rim: "#ffb8ec", rimA: 0.8 }),
      "<clipPath id='" + p + "clMuro'>" + rett(0, 0, W, MURO) + "</clipPath>",
      "<clipPath id='" + p + "clSch'>" + rett(SCH.x, SCH.y, SCH.w, SCH.h, "rx='10'") + "</clipPath>",
      "<mask id='" + p + "senzaSch' maskUnits='userSpaceOnUse' x='0' y='0' width='780' height='1688'>" + rett(0, 0, W, H, "fill='#fff'") + rett(SCH.x - 12, SCH.y - 12, SCH.w + 24, SCH.h + 24, "rx='16' fill='#000'") + "</mask>"
    );
    // la parete: pannelli LED a colori pieni, con le giunture e qualche pannello più acceso
    o.push("<g clip-path='" + u("clMuro") + "'>", rett(0, 0, W, MURO, "fill='" + u("muro") + "'"),
      "<g filter='" + u("s40") + "'>", ell(110, 240, 260, 220, "fill='#ff3db4' opacity='.75'"), ell(720, 940, 240, 260, "fill='#00e5ff' opacity='.55'"),
      ell(390, 620, 300, 420, "fill='#2a0a7a' opacity='.55'"), ell(60, 900, 200, 260, "fill='#8a2bff' opacity='.6'"), ell(740, 200, 200, 200, "fill='#4b5bff' opacity='.6'"), "</g>");
    // grandi frecce di luce che puntano al centro (grafica della parete)
    o.push("<g style='mix-blend-mode:screen' filter='" + u("s4") + "' opacity='.55'>");
    [0, 1].forEach(function (lato) {
      var s = lato ? -1 : 1, x0 = lato ? W : 0;
      [0, 70].forEach(function (dy, k) {
        o.push("<polygon points='" + n(x0) + "," + (120 + dy) + " " + n(x0) + "," + (150 + dy) + " " + n(390 - s * 60) + "," + (520 + dy) + " " + n(390 - s * 60) + "," + (490 + dy) + "' fill='" + (k ? "#ffd2f2" : "#c8f6ff") + "' opacity='" + (k ? 0.5 : 0.8) + "'/>");
      });
    });
    o.push("</g>");
    for (var ty = 0; ty < MURO; ty += 52) for (var tx = 0; tx < W; tx += 52) { var v = r(); if (v < 0.2) o.push(rett(tx, ty, 51, 51, "fill='#000' opacity='" + n(0.03 + r() * 0.06) + "'")); else if (v > 0.93) o.push(rett(tx, ty, 51, 51, "fill='#fff' opacity='" + n(0.03 + r() * 0.05) + "'")); }
    o.push(rett(0, 0, W, MURO, "fill='" + u("tess") + "'"), rett(0, 0, W, MURO, "fill='" + u("led") + "'"), "</g>");
    // barre led in alto
    for (i = 0; i < 6; i++) o.push(rett(20 + i * 130, 10, 90, 5, "rx='2.5' fill='#fff' filter='" + u("gl") + "'"));
    // la luce del maxischermo sulla parete
    o.push(rett(SCH.x - 8, SCH.y - 8, SCH.w + 16, SCH.h + 16, "rx='18' fill='none' stroke='#2a0a6a' stroke-width='46' opacity='.7' filter='" + u("s24") + "'"));
    // pubblico in controluce davanti alla parete
    o.push(A.folla(p, {
      seme: 9, passo: 44, sMin: 33, sMax: 44,
      zone: [[6, 186, 640, 1232], [594, 774, 640, 1232]],
      filtro: function (iz) { return ["pubS", "pubD"][iz]; },
      gradino: function (y, z, t, fila) {
        return rett(z[0], y, z[1] - z[0], 44, "fill='" + u("gradino") + "'") + (fila % 2 ? "" :
          rett(z[0], y - 0.5, z[1] - z[0], 1.2, "fill='#ff5ccf' opacity='" + n(0.3 + 0.3 * t) + "' filter='" + u("gl") + "'"));
      }
    }));
    // colonne di luce ai lati del maxischermo
    [SCH.x - 14, SCH.x + SCH.w + 8].forEach(function (x) {
      o.push(rett(x - 6, 30, 18, 900, "fill='#ff5ccf' opacity='.5' filter='" + u("s14") + "'"), rett(x, 30, 6, 900, "rx='3' fill='" + u("colonna") + "'"));
    });
    o.push(scalinata(p));
    o.push(schermoB(p));
    // il bordo del palco e il pavimento a piastrelle luminose
    o.push(rett(0, 1236, W, 16, "fill='#10052a'"), rett(0, 1252, W, H - 1252, "fill='" + u("pavimento") + "'"));
    o.push("<g mask='url(#" + p + "mPav)' opacity='.55'><g filter='" + u("s24") + "' transform='translate(0,2504) scale(1,-1)'>" + rett(0, 600, W, 650, "fill='" + u("muro") + "'") + "</g></g>",
      "<mask id='" + p + "mPav' maskUnits='userSpaceOnUse' x='0' y='1252' width='780' height='436'>" + rett(0, 1252, W, 300, "fill='" + u("sfumaGiu") + "'") + "</mask>");
    var gr = "", vx = 390, vy = 980;
    for (i = -9; i <= 9; i++) { var xb = 390 + i * 104; gr += "M" + n(vx + (xb - vx) * (1252 - vy) / (H - vy)) + " 1252L" + n(xb) + " " + H; }
    [1262, 1280, 1306, 1342, 1392, 1460, 1556, 1688].forEach(function (y) { gr += "M0 " + y + "H780"; });
    o.push("<path d='" + gr + "' stroke='#5ce6ff' stroke-opacity='.22' stroke-width='1.1' fill='none' filter='" + u("gl") + "'/>");
    // qualche piastrella accesa
    [[1, 1, "#ff2d95"], [5, 2, "#20d8ff"], [-3, 2, "#b04dff"], [-6, 0, "#20d8ff"], [7, 0, "#ff2d95"], [-1, 3, "#ff8a2b"]].forEach(function (q) {
      var YY = [1252, 1262, 1280, 1306, 1342, 1392, 1460], y0 = YY[q[1] + 2], y1 = YY[q[1] + 3];
      function xa(xb, y) { return vx + (xb - vx) * (y - vy) / (H - vy); }
      var xb0 = 390 + q[0] * 104, xb1 = xb0 + 104;
      o.push("<polygon points='" + n(xa(xb0, y0)) + "," + y0 + " " + n(xa(xb1, y0)) + "," + y0 + " " + n(xa(xb1, y1)) + "," + y1 + " " + n(xa(xb0, y1)) + "," + y1 + "' fill='" + q[2] + "' opacity='.28' filter='" + u("s2") + "'/>");
    });
    o.push(rett(0, 1236, W, 2.5, "fill='" + u("bordoPalco") + "' filter='" + u("gl8") + "'"));
    // occhio di bue su Paky
    var P0 = POSTI[0];
    o.push("<g style='mix-blend-mode:screen' mask='url(#" + p + "senzaSch)'>", fascio(p + "spot", 150, -10, P0.cx, 1398, 24, 240, "#fff2fb", 0.24, 0.08, p + "s8"),
      ell(P0.cx, 1400, 150, 26, "fill='" + u("pozza") + "'"), "</g>");
    for (i = 0; i < 3; i++) {
      var yb = A.yBanco(i), b = bancoB(p, i, yb);
      o.push(A.riflesso(p, i, b, yb + 122, 0.3, "s4"));
      o.push(ell(POSTI[i].cx, yb + 126, 100, 11, "fill='" + GIOC[i].col + "' opacity='.6' filter='" + u("s8") + "' style='mix-blend-mode:screen'"));
      o.push(A.avatar(p, i, i === 0 ? "avOn" : "avOff"), b);
    }
    return "<defs>" + d.join("") + "</defs>" + o.join("");
  }

  // la scalinata al centro, sotto il maxischermo: gradini che si allargano, col filo di luce su ogni gradino
  function scalinata(p) {
    var o = [], y0 = SCH.y + SCH.h + 10, y1 = 1236, N = 7, h = (y1 - y0) / N, k, u = function (q) { return "url(#" + p + q + ")"; };
    for (k = 0; k < N; k++) {
      var y = y0 + k * h, x0 = SCH.x - 8 - k * 7, x1 = SCH.x + SCH.w + 8 + k * 7;
      o.push(rett(x0, y, x1 - x0, h, "fill='" + u("alzata") + "'"),
        rett(x0, y, x1 - x0, 7, "fill='" + u("pedata") + "' opacity='.55'"),
        rett(x0, y + 7, x1 - x0, 1.6, "fill='#fff' opacity='.9' filter='" + u("gl") + "'"),
        rett(x0, y + 9, x1 - x0, h * 0.6, "fill='" + u("pedata") + "' opacity='.12' filter='" + u("s4") + "'"));
    }
    return o.join("");
  }

  function schermoB(p) {
    var o = [], cx = SCH.x + SCH.w / 2, cy = SCH.y + SCH.h * 0.47, u = function (k) { return "url(#" + p + k + ")"; };
    o.push("<g clip-path='" + u("clSch") + "'>", rett(SCH.x, SCH.y, SCH.w, SCH.h, "fill='" + u("schB") + "'"),
      ell(cx + 60, SCH.y + SCH.h * 0.86, 330, 260, "fill='" + u("schRosa") + "'"), ell(SCH.x + 40, SCH.y + 90, 260, 220, "fill='" + u("schCiano") + "'"));
    // lastre di vetro inclinate, una sopra l'altra (grafica moderna)
    [[-150, 0.045], [-40, 0.03], [90, 0.04]].forEach(function (q, k) {
      o.push(rett(cx - 230 + q[0] * 0.3, cy + q[0] - 120, 460, 210, "rx='26' fill='#fff' fill-opacity='" + q[1] + "' stroke='#fff' stroke-opacity='.1' stroke-width='1' transform='rotate(-14 " + cx + " " + n(cy + q[0]) + ")'"));
    });
    var T = "font-family='MontserratI,Inter,sans-serif' font-style='italic' font-weight='800' font-size='58' text-anchor='middle' letter-spacing='-.5'";
    o.push("<g filter='" + u("s14") + "' opacity='.9'>", testo(cx, cy - 6, "LA LINEA", T + " fill='#ff2d95'"), testo(cx, cy + 62, "DEL TEMPO", T + " fill='#ff2d95'"), "</g>",
      testo(cx, cy - 6, "LA LINEA", T + " fill='" + u("titolo") + "'"), testo(cx, cy + 62, "DEL TEMPO", T + " fill='" + u("titolo") + "'"));
    o.push(rett(cx - 130, cy + 90, 260, 6, "rx='3' fill='" + u("sotto") + "' filter='" + u("gl") + "'"));
    o.push(testo(cx, cy - 82, "IL GAME SHOW", "font-family='Inter,system-ui,sans-serif' font-weight='800' font-size='13' letter-spacing='5.5' text-anchor='middle' fill='#8ff0ff'"));
    o.push(rett(SCH.x, SCH.y, SCH.w, SCH.h, "fill='" + u("led") + "'"), "</g>");
    // cornice: scura, col filo di luce bianco dentro e il bagliore fuori
    o.push(rett(SCH.x - 6, SCH.y - 6, SCH.w + 12, SCH.h + 12, "rx='15' fill='none' stroke='#ff4fc0' stroke-width='6' opacity='.7' filter='" + u("s8") + "'"),
      rett(SCH.x - 4.5, SCH.y - 4.5, SCH.w + 9, SCH.h + 9, "rx='14' fill='none' stroke='#140630' stroke-width='9'"),
      rett(SCH.x - 1, SCH.y - 1, SCH.w + 2, SCH.h + 2, "rx='11' fill='none' stroke='" + u("bordoSch") + "' stroke-width='2' filter='" + u("gl") + "'"));
    return o.join("");
  }

  function bancoB(p, i, y0) {
    var P = POSTI[i], w = P.w, em = w * 0.1, cx = P.cx, g = GIOC[i], o = [], gid = p + "pill" + i, u = function (k) { return "url(#" + p + k + ")"; };
    var xt = cx - w / 2 - 3, yf = y0 + 1.0 * em, yb = y0 + 6.4 * em;
    o.push(lin(gid, 0, 0, 0, 1, [[0, "#ffffff", 0.95], [0.18, g.col, 1], [1, g.col, 1]]));
    // frontale di vetro: si vede appena il pavimento dietro, i bordi prendono la luce
    var trap = n(cx - 0.46 * w) + "," + n(yf) + " " + n(cx + 0.46 * w) + "," + n(yf) + " " + n(cx + 0.42 * w) + "," + n(yb) + " " + n(cx - 0.42 * w) + "," + n(yb);
    o.push("<polygon points='" + trap + "' fill='#1a0840' fill-opacity='.55'/>", "<polygon points='" + trap + "' fill='" + u("vetroB") + "' stroke='#fff' stroke-opacity='.55' stroke-width='1.2'/>");
    o.push("<polygon points='" + n(cx - 0.46 * w) + "," + n(yf) + " " + n(cx - 0.05 * w) + "," + n(yf) + " " + n(cx - 0.3 * w) + "," + n(yb) + " " + n(cx - 0.42 * w) + "," + n(yb) + "' fill='" + u("vetroLuce") + "'/>");
    o.push(rett(cx - 0.37 * w, yf + 0.45 * em, 0.74 * w, 4.55 * em, "rx='9' fill='#12052e' fill-opacity='.82'"));
    o.push(testo(cx, y0 + 2.95 * em, g.nome, "font-family='Inter,system-ui,sans-serif' font-weight='800' font-size='" + n(1.18 * em) + "' text-anchor='middle' fill='#fff'"));
    o.push(rett(cx - 0.27 * w, y0 + 3.45 * em, 0.54 * w, 1.85 * em, "rx='" + n(0.92 * em) + "' fill='" + u(gid.slice(p.length)) + "' filter='" + u("glP") + "'"),
      testo(cx, y0 + 4.86 * em, "0", "font-family='Oswald,Inter,sans-serif' font-weight='600' font-size='" + n(1.55 * em) + "' text-anchor='middle' fill='#160833'"));
    // piano di vetro con il filo bianco davanti
    o.push(rett(xt, y0, w + 6, 1.0 * em, "rx='5' fill='#ffffff' fill-opacity='.22' stroke='#fff' stroke-opacity='.5' stroke-width='1'"),
      rett(xt + 3, y0 + 1, w, 1.6, "rx='.8' fill='#fff' filter='" + u("gl") + "'"), rett(xt + 3, y0 + 1.0 * em - 1.6, w, 1.6, "rx='.8' fill='" + g.col + "' opacity='.9'"));
    o.push(rett(cx - 0.42 * w, yb, 0.84 * w, 0.42 * em, "fill='" + g.col + "' filter='" + u("gl8") + "'"));
    return o.join("");
  }

  Studio2.MONDI.B = mondoB;
})();

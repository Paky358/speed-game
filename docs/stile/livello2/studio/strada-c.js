/* STRADA C · «Anello di luce»: un grande anello corallo dietro al maxischermo,
   pareti turchese scuro a lamelle, luci che salgono dal palco, pedane rotonde sul pavimento */
(function () {
  "use strict";
  var A = Studio2.aiuti, n = A.n, lin = A.lin, rad = A.rad, rett = A.rett, ell = A.ell, testo = A.testo, fascio = A.fascio;
  var SCH = A.SCH, POSTI = A.POSTI, GIOC = A.GIOC, W = A.W, H = A.H;
  var AX = 390, AY = 520, AR = 368;   // l'anello (centro e raggio)

  function mondoC(p, shot) {
    var o = [], d = [], i, r = A.rnd(77), u = function (k) { return "url(#" + p + k + ")"; };
    var dof = shot === "leggio" ? 1.5 : shot === "schermo" ? 0.7 : 0.3;
    d.push(
      rad(p + "fondo", 0.5, 0.3, 0.75, [[0, "#12808d"], [0.32, "#0a5560"], [0.66, "#042b33"], [1, "#010b0e"]]),
      lin(p + "sfumaGiu", 0, 0, 0, 1, [[0, "#fff", 0.9], [1, "#fff", 0]]),
      lin(p + "anello", 0, 0, 0, 1, [[0, "#ffc070"], [0.35, "#ff6a3c"], [0.65, "#ff3d78"], [1, "#ff6a3c"]]),
      lin(p + "lamella", 0, 0, 1, 0, [[0, "#0f606c"], [0.5, "#0b4b56"], [1, "#052a31"]]),
      rad(p + "caldo", 0.5, 0.5, 0.5, [[0, "#ff6a3c", 0.62], [0.5, "#ff3d78", 0.2], [1, "#ff3d78", 0]]),
      rad(p + "schC", 0.5, 0.32, 0.8, [[0, "#22b4c4"], [0.3, "#0f6b79"], [0.7, "#07333c"], [1, "#03181d"]]),
      lin(p + "titoloC", 0, 0, 0, 1, [[0, "#ffd0b0"], [0.5, "#ff6a4a"], [1, "#ff3d78"]]),
      lin(p + "titolo", 0, 0, 0, 1, [[0, "#ffffff"], [1, "#d8fbff"]]),
      lin(p + "pavimento", 0, 0, 0, 1, [[0, "#06343d"], [0.35, "#03191e"], [1, "#010809"]]),
      lin(p + "gradino", 0, 0, 0, 1, [[0, "#06303a"], [1, "#021317"]]),
      lin(p + "metallo", 0, 0, 0, 1, [[0, "#454d52"], [0.12, "#2b3236"], [0.6, "#171c1f"], [1, "#0b0e10"]]),
      lin(p + "pianoC", 0, 0, 0, 1, [[0, "#5a6267"], [0.25, "#2a3135"], [1, "#151a1d"]]),
      lin(p + "lucida", 0, 0, 1, 0.4, [[0, "#fff", 0.16], [0.45, "#fff", 0.03], [1, "#fff", 0]]),
      rad(p + "pozza", 0.5, 0.5, 0.5, [[0, "#ffe2cc", 0.6], [0.5, "#ffb48c", 0.2], [1, "#ffb48c", 0]]),
      "<pattern id='" + p + "spazzolato' width='6' height='3' patternUnits='userSpaceOnUse'><path d='M0 .5H6' stroke='#fff' stroke-opacity='.05' stroke-width='.6'/><path d='M0 2H3.5' stroke='#000' stroke-opacity='.18' stroke-width='.6'/></pattern>",
      A.sfoca(p + "s2", 2), A.sfoca(p + "s4", 4), A.sfoca(p + "s8", 8), A.sfoca(p + "s14", 14), A.sfoca(p + "s24", 24), A.sfoca(p + "s40", 40),
      A.bagliore(p + "gl", 3, 1.6), A.bagliore(p + "gl8", 8, 1.5), A.bagliore(p + "glA", 14, 1.3), A.bagliore(p + "glP", 2.4, 0.8),
      A.griglia(p + "led", 2.5, "#000", 0.1),
      A.filtroPubblico(p + "pub", { sat: 0.25, k: [0.07, 0.15, 0.17], q: [0, 0.01, 0.012], rim: "#ff9a70", rimA: 0.6, dy: 1.8, blur: dof }),
      A.filtroPubblico(p + "pubL", { sat: 0.2, k: [0.05, 0.12, 0.14], q: [0, 0.01, 0.012], rim: "#ff9a70", rimA: 0.42, dy: 1.5, blur: dof + 0.4 }),
      A.filtroAvatar(p + "avOn", { k: [1.04, 1, 0.95], dx: 0, dy: 3, rim: "#ffe0c8", rimA: 0.95 }),
      A.filtroAvatar(p + "avOff", { k: [0.82, 0.92, 0.95], dx: 0, dy: 3, rim: "#ff9a70", rimA: 0.75 }),
      "<clipPath id='" + p + "clSch'>" + rett(SCH.x, SCH.y, SCH.w, SCH.h, "rx='22'") + "</clipPath>",
      "<clipPath id='" + p + "clSopra'>" + rett(0, 0, W, 1236) + "</clipPath>",
      "<mask id='" + p + "senzaSch' maskUnits='userSpaceOnUse' x='0' y='0' width='780' height='1688'>" + rett(0, 0, W, H, "fill='#fff'") + rett(SCH.x - 10, SCH.y - 10, SCH.w + 20, SCH.h + 20, "rx='26' fill='#000'") + "</mask>"
    );
    o.push(rett(0, 0, W, H, "fill='" + u("fondo") + "'"));
    // pareti a lamelle verticali (legno scuro laccato turchese), più chiare vicino all'anello
    o.push("<g clip-path='" + u("clSopra") + "'>");
    for (i = 0; i < 44; i++) { var xl = i * 18; if (xl > SCH.x - 14 && xl < SCH.x + SCH.w) continue; o.push(rett(xl + 2, 0, 11, 1236, "fill='" + u("lamella") + "' opacity='" + n(0.75 + r() * 0.25) + "'")); }
    o.push("</g>");
    // l'anello: un bagliore grande e caldo, poi l'anello vero (dietro al maxischermo: se ne vedono i due archi)
    o.push("<g style='mix-blend-mode:screen'>", ell(AX, AY, AR + 120, AR + 120, "fill='" + u("caldo") + "'"), "</g>");
    o.push("<circle cx='" + AX + "' cy='" + AY + "' r='" + (AR + 36) + "' fill='none' stroke='#5fe3ef' stroke-opacity='.45' stroke-width='1.6' filter='" + u("gl") + "'/>",
      "<circle cx='" + AX + "' cy='" + AY + "' r='" + (AR - 34) + "' fill='none' stroke='#ff8a5c' stroke-opacity='.4' stroke-width='2' filter='" + u("gl") + "'/>",
      "<circle cx='" + AX + "' cy='" + AY + "' r='" + AR + "' fill='none' stroke='#ff4f5e' stroke-width='22' opacity='.55' filter='" + u("s14") + "'/>",
      "<circle cx='" + AX + "' cy='" + AY + "' r='" + AR + "' fill='none' stroke='" + u("anello") + "' stroke-width='9' filter='" + u("glA") + "'/>",
      "<circle cx='" + AX + "' cy='" + AY + "' r='" + AR + "' fill='none' stroke='#fff3e6' stroke-width='2.4' opacity='.9'/>");
    // pubblico, più in basso: l'anello passa dietro le gradinate
    o.push(A.folla(p, {
      seme: 21, passo: 44, sMin: 33, sMax: 44, lontano: true,
      zone: [[6, 188, 640, 1232], [592, 774, 640, 1232], [6, 774, 944, 1232]],
      gradino: function (y, z, t, fila) {
        return rett(z[0], y, z[1] - z[0], 44, "fill='" + u("gradino") + "'") + (fila % 3 ? "" :
          rett(z[0], y - 0.5, z[1] - z[0], 1.1, "fill='#ff8a5c' opacity='" + n(0.25 + 0.3 * t) + "' filter='" + u("gl") + "'"));
      }
    }));
    o.push(schermoC(p));
    // luci che salgono dal bordo del palco, sopra il pubblico
    o.push("<g style='mix-blend-mode:screen' mask='url(#" + p + "senzaSch)'>",
      fascio(p + "u1", 26, 1238, 120, 120, 8, 200, "#5fe3ef", 0.38, 0, p + "s8"), fascio(p + "u2", 150, 1238, 40, 260, 8, 170, "#ff7a50", 0.36, 0, p + "s8"),
      fascio(p + "u3", 630, 1238, 740, 260, 8, 170, "#ff7a50", 0.36, 0, p + "s8"), fascio(p + "u4", 754, 1238, 660, 120, 8, 200, "#5fe3ef", 0.38, 0, p + "s8"),
      fascio(p + "u1c", 26, 1238, 120, 120, 2, 50, "#d8fbff", 0.4, 0, p + "s2"), fascio(p + "u4c", 754, 1238, 660, 120, 2, 50, "#d8fbff", 0.4, 0, p + "s2"),
      "</g>");
    [26, 150, 630, 754].forEach(function (x, k) { o.push(ell(x, 1240, 16, 7, "fill='" + (k % 3 ? "#ff7a50" : "#5fe3ef") + "' opacity='.8' filter='" + u("s4") + "'"), ell(x, 1240, 5, 2.5, "fill='#fff'")); });
    // palco: pavimento lucido con le pedane rotonde di luce
    o.push(rett(0, 1236, W, 16, "fill='#02161a'"), rett(0, 1252, W, H - 1252, "fill='" + u("pavimento") + "'"));
    o.push(rett(0, 1236, W, 2, "fill='#5fe3ef' opacity='.7' filter='" + u("gl") + "'"));
    var PY = 1440;
    o.push(ell(AX, PY, 430, 120, "fill='#ff6a3c' opacity='.1' filter='" + u("s24") + "'"));
    [[420, 112, "#ff6a3c", 3, 0.95], [330, 86, "#5fe3ef", 1.6, 0.55], [236, 60, "#ff6a3c", 1.6, 0.5]].forEach(function (q) {
      o.push(ell(AX, PY, q[0], q[1], "fill='none' stroke='" + q[2] + "' stroke-width='" + q[3] + "' opacity='" + q[4] + "' filter='" + u("gl8") + "'"));
    });
    // il riflesso dell'anello sul pavimento: due strisce calde morbide
    o.push("<g style='mix-blend-mode:screen' opacity='.5' filter='" + u("s14") + "'>", rett(14, 1262, 30, 200, "fill='#ff6a3c'"), rett(736, 1262, 30, 200, "fill='#ff6a3c'"), "</g>");
    var P0 = POSTI[0];
    o.push("<g style='mix-blend-mode:screen' mask='url(#" + p + "senzaSch)'>", fascio(p + "spot", 165, -10, P0.cx, 1398, 24, 240, "#ffe9d8", 0.22, 0.07, p + "s8"),
      ell(P0.cx, 1400, 150, 26, "fill='" + u("pozza") + "'"), "</g>");
    for (i = 0; i < 3; i++) {
      var yb = A.yBanco(i), b = bancoC(p, i, yb);
      o.push(A.riflesso(p, i, b, yb + 118, 0.3, "s4"));
      o.push(ell(POSTI[i].cx, yb + 120, 96, 11, "fill='" + GIOC[i].col + "' opacity='.6' filter='" + u("s8") + "' style='mix-blend-mode:screen'"));
      o.push(A.avatar(p, i, i === 0 ? "avOn" : "avOff"), b);
    }
    return "<defs>" + d.join("") + "</defs>" + o.join("");
  }

  function schermoC(p) {
    var o = [], cx = SCH.x + SCH.w / 2, cy = SCH.y + SCH.h * 0.47, u = function (k) { return "url(#" + p + k + ")"; }, k;
    o.push("<g clip-path='" + u("clSch") + "'>", rett(SCH.x, SCH.y, SCH.w, SCH.h, "fill='" + u("schC") + "'"));
    // cerchi concentrici: l'anello ripreso nella grafica
    for (k = 0; k < 7; k++) o.push("<circle cx='" + cx + "' cy='" + n(cy + 20) + "' r='" + (90 + k * 46) + "' fill='none' stroke='" + (k % 2 ? "#5fe3ef" : "#ff7a50") + "' stroke-opacity='" + n(0.28 - k * 0.03) + "' stroke-width='" + (k === 2 ? 3 : 1.4) + "'/>");
    o.push("<circle cx='" + cx + "' cy='" + n(cy + 20) + "' r='182' fill='none' stroke='#ff6a3c' stroke-width='10' opacity='.35' filter='" + u("s14") + "'/>");
    var T = "font-family='Oswald,Anton,sans-serif' font-weight='700' font-size='70' text-anchor='middle' letter-spacing='2'";
    o.push("<g filter='" + u("s14") + "' opacity='.8'>", testo(cx, cy, "LA LINEA", T + " fill='#0b2f36'"), testo(cx, cy + 76, "DEL TEMPO", T + " fill='#ff3d78'"), "</g>",
      testo(cx, cy, "LA LINEA", T + " fill='" + u("titolo") + "'"), testo(cx, cy + 76, "DEL TEMPO", T + " fill='" + u("titoloC") + "'"));
    o.push(testo(cx, cy - 78, "IL GAME SHOW", "font-family='Inter,system-ui,sans-serif' font-weight='800' font-size='13' letter-spacing='5.5' text-anchor='middle' fill='#8ff3fa'"));
    o.push(rett(SCH.x, SCH.y, SCH.w, SCH.h, "fill='" + u("led") + "'"), "</g>");
    o.push(rett(SCH.x - 4, SCH.y - 4, SCH.w + 8, SCH.h + 8, "rx='25' fill='none' stroke='#03181c' stroke-width='8'"),
      rett(SCH.x - 8.5, SCH.y - 8.5, SCH.w + 17, SCH.h + 17, "rx='29' fill='none' stroke='#5fe3ef' stroke-opacity='.55' stroke-width='1.5' filter='" + u("gl") + "'"));
    return o.join("");
  }

  function bancoC(p, i, y0) {
    var P = POSTI[i], w = P.w, em = w * 0.1, cx = P.cx, g = GIOC[i], o = [], u = function (k) { return "url(#" + p + k + ")"; };
    var xt = cx - w / 2 - 2, yf = y0 + 0.9 * em, hF = 5.2 * em;
    // frontale di metallo spazzolato, angoli tondi
    o.push(rett(cx - 0.45 * w, yf, 0.9 * w, hF, "rx='" + n(0.9 * em) + "' fill='" + u("metallo") + "'"), rett(cx - 0.45 * w, yf, 0.9 * w, hF, "rx='" + n(0.9 * em) + "' fill='" + u("spazzolato") + "'"),
      rett(cx - 0.45 * w, yf, 0.9 * w, hF, "rx='" + n(0.9 * em) + "' fill='" + u("lucida") + "' stroke='#6d777d' stroke-opacity='.5' stroke-width='1'"));
    o.push(testo(cx, y0 + 2.75 * em, g.nome.toUpperCase(), "font-family='Oswald,Inter,sans-serif' font-weight='600' font-size='" + n(1.3 * em) + "' letter-spacing='1.5' text-anchor='middle' fill='#fff'"));
    o.push(rett(cx - 0.12 * w, y0 + 3.08 * em, 0.24 * w, 2.2, "rx='1.1' fill='" + g.col + "' filter='" + u("gl") + "'"));
    o.push(rett(cx - 0.27 * w, y0 + 3.5 * em, 0.54 * w, 1.9 * em, "rx='" + n(0.95 * em) + "' fill='#021015' stroke='#5fe3ef' stroke-opacity='.45' stroke-width='1.2'"),
      testo(cx, y0 + 4.98 * em, "0", "font-family='Oswald,Inter,sans-serif' font-weight='600' font-size='" + n(1.6 * em) + "' text-anchor='middle' fill='#7ff3ff' filter='" + u("glP") + "'"));
    // piano: bordo tondo, il filo caldo davanti
    o.push(rett(xt, y0, w + 4, 1.05 * em, "rx='" + n(0.5 * em) + "' fill='" + u("pianoC") + "'"), rett(xt + 6, y0 + 0.8, w - 8, 1.2, "rx='.6' fill='#fff' opacity='.45'"),
      rett(xt + 4, y0 + 1.05 * em - 2, w - 4, 2, "rx='1' fill='#ffb08a' filter='" + u("gl") + "'"));
    // base: la luce del colore del concorrente
    o.push(rett(cx - 0.36 * w, yf + hF - 0.1 * em, 0.72 * w, 0.32 * em, "rx='" + n(0.16 * em) + "' fill='" + g.col + "' filter='" + u("gl8") + "'"));
    return o.join("");
  }

  Studio2.MONDI.C = mondoC;
})();

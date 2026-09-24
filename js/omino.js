/* =========================================================
   SPeeD GAME — OMINI personalizzabili (stile Mii)
   Disegnati in SVG col codice: niente immagini, leggerissimi.
   Volume con sfumature morbide, ciocche, pieghe dei vestiti.
   SGOmino.svg(cfg, {busto, px})  -> stringa SVG
   SGOmino.el(cfg, opts)          -> elemento pronto
   SGOmino.casuale(seme)          -> omino a caso (sempre uguale per lo stesso seme)
   ========================================================= */
(function () {
  "use strict";

  var OPZ = {
    forma:     ["uomo", "donna"],
    corpo:     ["snello", "medio", "robusto"],
    pelle:     ["#ffe3cc", "#f7cda8", "#eab48a", "#cf9464", "#a96d43", "#7c4b2c", "#58341f"],
    viso:      ["tondo", "ovale", "squadrato"],
    occhi:     ["tondi", "dolci", "grandi", "felici", "furbi"],
    iride:     ["#3b2416", "#6b4423", "#2e6fbf", "#3f8f4f", "#6b6f76"],
    sopracc:   ["morbide", "decise", "alzate", "sottili"],
    naso:      ["piccolo", "tondo", "punta"],
    bocca:     ["sorriso", "sorrisone", "neutro", "o", "ghigno", "labbra"],
    guance:    ["no", "leggere", "rosse", "lentiggini"],
    capelli:   ["corti", "spettinati", "frangia", "caschetto", "lunghi", "coda", "ricci", "cresta", "calvo"],
    colCap:    ["#2a1d15", "#4b2f1d", "#7a4a26", "#b5672d", "#e0b85a", "#f3e3a8", "#9aa0a8", "#c0392b", "#2e86de", "#8e44ad", "#ff7eb6"],
    barba:     ["no", "accenno", "corta", "folta", "pizzetto", "baffi", "baffipizzetto", "baffoni"],
    capo:      ["maglietta", "lunga", "felpa", "camicia", "canotta"],
    maglia:    ["#e03131", "#1c7ed6", "#2f9e44", "#f59f00", "#7048e8", "#e64980", "#15aabf", "#343a40", "#f1f3f5", "#fd7e14"],
    stampa:    ["nessuna", "righe", "stella", "fulmine", "cuore"],
    sotto:     ["pantaloni", "gonna"],
    pantaloni: ["#2b3a67", "#343a40", "#6c5a3e", "#5c636a", "#1971c2", "#e64980", "#7048e8", "#f1f3f5"],
    scarpe:    ["#2a2a31", "#f1f3f5", "#e03131", "#1c7ed6", "#f59f00", "#6c4a2e"],
    accessorio:["nessuno", "occhiali", "sole", "cappellino", "berretto", "fascia", "cuffie", "orecchini", "corona"],
    colAcc:    ["#e03131", "#1c7ed6", "#2f9e44", "#f59f00", "#7048e8", "#e64980", "#15aabf", "#343a40", "#f1f3f5", "#fd7e14"]
  };
  var BASE = { forma: "uomo", corpo: "medio", pelle: 1, viso: "tondo", occhi: "tondi", iride: 1, sopracc: "morbide", naso: "piccolo",
               bocca: "sorriso", guance: "no", capelli: "corti", colCap: 1, barba: "no", capo: "lunga", maglia: 1, stampa: "nessuna",
               sotto: "pantaloni", pantaloni: 0, scarpe: 0, accessorio: "nessuno", colAcc: null };
  // nomi da mostrare nell'editor (se manca, si usa il valore con la maiuscola)
  var NOMI = { no: "Nessuna", nessuno: "Nessuno", sole: "Da sole", o: "A O", punta: "A punta", baffipizzetto: "Baffi+pizzetto", lunga: "Maniche lunghe" };
  // accessori liberi per tutti; gli altri (es. corona) si sbloccheranno coi trofei
  var LIBERI = ["nessuno", "occhiali", "sole", "cappellino", "berretto", "fascia", "cuffie", "orecchini"];

  var uid = 0, PREF = "om" + Math.random().toString(36).slice(2, 6);   // id unici anche se il file viene caricato due volte
  function rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function hex(c) { return "#" + c.map(function (x) { x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? "0" : "") + x.toString(16); }).join(""); }
  // amt > 0 schiarisce, < 0 scurisce
  function tono(h, amt) { return hex(rgb(h).map(function (x) { return amt > 0 ? x + (255 - x) * amt : x * (1 + amt); })); }
  function col(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }

  // completa una configurazione (e converte i vecchi omini: barba e baffi erano accessori)
  function norm(cfg) {
    cfg = cfg || {}; var c = {};
    for (var k in BASE) c[k] = cfg[k] != null ? cfg[k] : BASE[k];
    if (c.accessorio === "barba") { c.barba = "corta"; c.accessorio = "nessuno"; }
    if (c.accessorio === "baffi") { c.barba = "baffi"; c.accessorio = "nessuno"; }
    if (OPZ.accessorio.indexOf(c.accessorio) < 0) c.accessorio = "nessuno";
    if (c.colAcc == null) c.colAcc = c.maglia;   // di base l'accessorio ha il colore della maglia
    return c;
  }

  var TESTA = {
    tondo:     "M100,36 C132,36 154,60 154,92 C154,124 130,148 100,148 C70,148 46,124 46,92 C46,60 68,36 100,36 Z",
    ovale:     "M100,34 C131,34 152,58 152,90 C152,124 130,151 100,151 C70,151 48,124 48,90 C48,58 69,34 100,34 Z",
    squadrato: "M100,36 C136,36 155,56 155,88 C155,118 149,139 126,146 C113,150 87,150 74,146 C51,139 45,118 45,88 C45,56 64,36 100,36 Z"
  };
  var FRONTE = {
    corti:      "M45,100 C40,52 70,30 102,30 C134,30 162,50 155,100 C150,80 146,70 136,64 C118,72 90,70 66,64 C56,72 50,84 45,100 Z",
    spettinati: "M45,100 C42,62 56,42 70,37 L66,22 L84,31 L93,15 L106,29 L121,17 L124,33 L141,28 L138,44 C152,54 159,74 155,100 C150,82 144,72 134,66 C116,74 88,72 66,66 C56,74 50,86 45,100 Z",
    frangia:    "M45,104 C40,52 70,30 102,30 C134,30 162,52 155,104 C152,90 150,82 146,76 L139,81 L131,71 L121,80 L111,70 L100,79 L89,70 L79,80 L69,71 L59,80 C52,86 48,94 45,104 Z",
    caschetto:  "M45,102 C40,50 70,30 102,30 C134,30 162,50 155,102 C152,86 148,76 140,70 Q100,86 60,70 C52,78 48,88 45,102 Z",
    lunghi:     "M45,110 C38,52 68,30 104,30 C136,30 164,52 155,110 C152,90 146,76 136,68 C122,62 104,64 92,57 C82,70 64,76 52,86 C48,94 46,102 45,110 Z",
    coda:       "M45,98 C40,52 70,30 102,30 C134,30 162,50 155,98 C152,82 148,72 140,66 C120,58 96,60 80,70 C66,72 52,82 45,98 Z"
  };
  var BARBA = {
    corta: "M47,100 C49,132 72,154 100,154 C128,154 151,132 153,100 C148,118 136,128 124,130 C116,139 108,141 100,141 C92,141 84,139 76,130 C64,128 52,118 47,100 Z",
    folta: "M46,96 C45,142 70,172 100,172 C130,172 155,142 154,96 C150,116 138,126 124,128 C116,138 108,140 100,140 C92,140 84,138 76,128 C62,126 50,116 46,96 Z",
    pizzetto: "M88,137 Q100,142 112,137 Q111,149 100,152 Q89,149 88,137 Z",
    baffi: "M83,121 Q91,113 100,119 Q109,113 117,121 Q109,125 100,122 Q91,125 83,121 Z",
    baffoni: "M77,124 Q69,121 72,112 Q76,119 84,118 Q92,112 100,118 Q108,112 116,118 Q124,119 128,112 Q131,121 123,124 Q110,127 100,122 Q90,127 77,124 Z"
  };

  // curve di Bézier: per tagliare la manica a metà braccio
  function lp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
  function dividi(p, t) { var a = lp(p[0], p[1], t), b = lp(p[1], p[2], t), c = lp(p[2], p[3], t), d = lp(a, b, t), e = lp(b, c, t), f = lp(d, e, t); return [[p[0], a, d, f], [f, e, c, p[3]]]; }
  function tratto(p, t0, t1) { var q = dividi(p, t1)[0]; return t0 > 0 ? dividi(q, t0 / t1)[1] : q; }
  function curva(p) { function f(q) { return q[0].toFixed(1) + "," + q[1].toFixed(1); } return "M" + f(p[0]) + " C" + f(p[1]) + " " + f(p[2]) + " " + f(p[3]); }
  function chiaro(h) { var c = rgb(h); return (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255 > 0.62; }

  function svg(cfg, opts) {
    opts = opts || {};
    var c = norm(cfg), id = PREF + (++uid) + "_";
    function u(n) { return "url(#" + id + n + ")"; }
    var P = col(OPZ.pelle, c.pelle), H = col(OPZ.colCap, c.colCap), M = col(OPZ.maglia, c.maglia),
        T = col(OPZ.pantaloni, c.pantaloni), I = col(OPZ.iride, c.iride), A = col(OPZ.colAcc, c.colAcc), S = col(OPZ.scarpe, c.scarpe);
    var acc = c.accessorio, tipo = c.capelli, cappello = acc === "cappellino" || acc === "berretto";
    if (cappello && /spettinati|cresta|ricci/.test(tipo)) tipo = "corti";   // sotto il cappello si schiacciano
    var bA = tono(A, -0.42);
    var donna = c.forma === "donna", gonna = donna && c.sotto === "gonna";
    var bP = tono(P, -0.4), bH = tono(H, -0.5), bM = tono(M, -0.42), bT = tono(T, -0.45);
    var testa = TESTA[c.viso] || TESTA.tondo, fr = FRONTE[tipo];
    var o = [];

    // ---------- gradienti, ritagli e trame ----------
    function stops(a) { return a.map(function (s) { return "<stop offset='" + s[0] + "' stop-color='" + s[1] + "'" + (s[2] != null ? " stop-opacity='" + s[2] + "'" : "") + "/>"; }).join(""); }
    function rad(n, cx, cy, r, st) { return "<radialGradient id='" + id + n + "' cx='" + cx + "' cy='" + cy + "' r='" + r + "'>" + stops(st) + "</radialGradient>"; }
    function lin(n, x2, y2, st) { return "<linearGradient id='" + id + n + "' x1='0' y1='0' x2='" + x2 + "' y2='" + y2 + "'>" + stops(st) + "</linearGradient>"; }
    o.push("<defs>",
      rad("p", 0.36, 0.28, 0.85, [[0, tono(P, 0.25)], [0.45, P], [0.85, tono(P, -0.1)], [1, tono(P, -0.24)]]),
      lin("pl", 0.3, 1, [[0, tono(P, 0.06)], [1, tono(P, -0.24)]]),
      rad("h", 0.35, 0.18, 0.95, [[0, tono(H, 0.38)], [0.4, H], [1, tono(H, -0.4)]]),
      lin("m", 0.35, 1, [[0, tono(M, 0.24)], [0.45, M], [1, tono(M, -0.34)]]),
      lin("t", 0.3, 1, [[0, tono(T, 0.2)], [0.5, T], [1, tono(T, -0.38)]]),
      rad("i", 0.5, 0.42, 0.62, [[0, tono(I, 0.5)], [0.55, I], [1, tono(I, -0.55)]]),
      lin("sc", 0, 1, [[0, "#d8cfc8"], [0.38, "#ffffff"], [1, "#f1ece8"]]),
      rad("g", 0.5, 0.5, 0.5, [[0, "#ff4f5e", 0.6], [1, "#ff4f5e", 0]]),
      rad("ao", 0.5, 0.5, 0.5, [[0, "#000", 0.38], [1, "#000", 0]]),
      rad("ter", 0.5, 0.5, 0.5, [[0, "#000", 0.45], [0.65, "#000", 0.16], [1, "#000", 0]]),
      rad("lu", 0.5, 0.5, 0.5, [[0, "#fff", 0.8], [1, "#fff", 0]]),
      rad("oro", 0.4, 0.3, 0.8, [[0, "#fff3b0"], [0.4, "#ffc93c"], [1, "#b7790b"]]),
      lin("s", 0.2, 1, [[0, tono(S, 0.3)], [0.5, S], [1, tono(S, -0.45)]]),
      lin("a", 0.35, 1, [[0, tono(A, 0.26)], [0.45, A], [1, tono(A, -0.34)]]),
      "<clipPath id='" + id + "sc2'><rect x='0' y='73' width='200' height='200'/></clipPath>",   // capelli sotto il cappello
      lin("lente", 0.6, 1, [[0, "#4a5070"], [0.5, "#16161f"], [1, "#050507"]]),
      "<clipPath id='" + id + "cv'><path d='" + testa + "'/></clipPath>",
      fr ? "<clipPath id='" + id + "hc'><path d='" + fr + "'/></clipPath>" : "",
      "<clipPath id='" + id + "bc'><path d='" + (c.barba === "corta" || c.barba === "folta" ? BARBA[c.barba] : BARBA.pizzetto) + "'/></clipPath>",
      "<pattern id='" + id + "pt' patternUnits='userSpaceOnUse' width='4' height='4'><circle cx='1' cy='1' r='.75' fill='" + tono(H, -0.15) + "'/><circle cx='3' cy='3' r='.65' fill='" + tono(H, -0.15) + "'/></pattern>",
      "</defs>");

    // ombra morbida a terra
    if (!opts.busto) o.push("<ellipse cx='100' cy='245' rx='52' ry='9' fill='" + u("ter") + "'/>");
    o.push("<g class='om-tutto'>");
    if (cappello) o.push("<g clip-path='" + u("sc2") + "'>");   // col cappello, niente capelli che spuntano sopra

    // ---------- capelli DIETRO la testa ----------
    if (tipo === "lunghi") {
      o.push("<path d='M40,92 C38,38 162,38 160,92 L168,188 Q100,204 32,188 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>");
      [[38, 104], [44, 112], [156, 104], [162, 112]].forEach(function (p) {
        o.push("<path d='M" + p[0] + "," + p[1] + " Q" + (p[0] + (p[0] < 100 ? -4 : 4)) + ",150 " + p[0] + ",186' stroke='" + bH + "' stroke-width='1.4' opacity='.4' fill='none' stroke-linecap='round'/>");
      });
    }
    if (tipo === "caschetto") o.push("<path d='M40,92 C40,38 160,38 160,92 L162,142 Q148,152 134,144 L66,144 Q52,152 38,142 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
      "<path d='M42,110 Q40,128 44,142 M158,110 Q160,128 156,142' stroke='" + bH + "' stroke-width='1.4' opacity='.4' fill='none'/>");
    if (tipo === "coda") o.push("<path d='M146,62 C178,52 190,92 178,128 C173,143 160,148 155,136 C166,110 164,86 142,74 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
      "<path d='M156,70 Q176,86 168,128 M150,74 Q168,94 162,130' stroke='" + bH + "' stroke-width='1.3' opacity='.4' fill='none'/>",
      "<ellipse cx='149' cy='67' rx='6.5' ry='6' fill='#ff5c93' stroke='#b0144a' stroke-width='1.3'/>", "<circle cx='147' cy='65' r='2' fill='#fff' opacity='.5'/>");
    if (tipo === "ricci") riccioli(true);
    if (cappello) o.push("</g>");

    // ---------- corpo: corporatura + forma ----------
    var B = { snello: [27, 22, 24, 15, 12], medio: [34, 31, 33, 20, 17], robusto: [40, 46, 44, 25, 21] }[c.corpo] || [34, 31, 33, 20, 17];
    var sh = B[0] - (donna ? 5 : 0), wa = B[1] - (donna ? 7 : 0), he = B[2] + (donna ? 6 : 0), lw = B[3] - (donna ? 2 : 0), aw = B[4] - (donna ? 2 : 0);
    function x(v) { return (100 + v).toFixed(1); }
    if (!opts.busto) {
      var fG = gonna ? u("pl") : u("t");
      [97 - lw, 103].forEach(function (lx) {
        o.push("<rect x='" + lx + "' y='204' width='" + lw + "' height='35' rx='" + Math.min(9, lw / 2) + "' fill='" + fG + "'/>");
        if (!gonna) o.push("<path d='M" + (lx + lw / 2) + ",218 L" + (lx + lw / 2) + ",234' stroke='" + tono(T, 0.3) + "' stroke-width='1.2' opacity='.35'/>");
      });
      [97 - lw / 2, 103 + lw / 2].forEach(function (cx) {
        var rx = lw / 2 + 5;
        o.push("<ellipse cx='" + cx + "' cy='242.5' rx='" + (rx + 0.5) + "' ry='3.6' fill='#e4e4ea' stroke='#b9b9c4' stroke-width='.8'/>",
          "<ellipse cx='" + cx + "' cy='238.5' rx='" + rx + "' ry='7' fill='" + u("s") + "' stroke='" + tono(S, -0.5) + "' stroke-width='.8'/>",
          "<ellipse cx='" + (cx - 4) + "' cy='235.5' rx='5' ry='2.2' fill='" + u("lu") + "'/>",
          "<path d='M" + (cx - 3) + ",234.5 L" + (cx + 3) + ",234.5 M" + (cx - 3) + ",237 L" + (cx + 3) + ",237' stroke='" + (rgb(S)[0] > 200 ? "#9a9aa6" : "#e0e0e8") + "' stroke-width='1' opacity='.75'/>");
      });
    }
    // braccia (maniche con polsino) + mani col pollice
    var ax = 100 - (sh - 6), hx = 100 - (Math.max(sh, wa, he) + 12);
    var manica = { maglietta: 0.45, canotta: 0 }[c.capo]; if (manica == null) manica = 1;   // quanta parte del braccio copre la manica
    [1, -1].forEach(function (s) {
      var a = 100 + s * (ax - 100), h = 100 + s * (hx - 100), Pb = [[a, 166], [a - s * 12, 172], [h, 188], [h, 203]], d = curva(Pb);
      if (manica < 1) o.push("<path d='" + d + "' stroke='" + bP + "' stroke-width='" + (aw + 2) + "' stroke-linecap='round' fill='none'/>",
        "<path d='" + d + "' stroke='" + u("pl") + "' stroke-width='" + (aw - 1.5) + "' stroke-linecap='round' fill='none'/>");
      if (manica > 0) {
        var dm = curva(tratto(Pb, 0, manica)), orlo = curva(tratto(Pb, manica - 0.07, manica));
        o.push("<path d='" + dm + "' stroke='" + bM + "' stroke-width='" + (aw + 3.5) + "' stroke-linecap='round' fill='none'/>",
          "<path d='" + dm + "' stroke='" + u("m") + "' stroke-width='" + aw + "' stroke-linecap='round' fill='none'/>",
          "<path d='" + curva(tratto([[Pb[0][0] - s * 4, 170], [Pb[1][0], 176], [h + s * 3, 188], [h + s * 3, 198]], 0, manica * 0.95)) + "' stroke='#fff' stroke-width='2.5' opacity='.16' fill='none' stroke-linecap='round'/>",
          "<path d='" + orlo + "' stroke='" + tono(M, -0.28) + "' stroke-width='" + (aw + 1) + "' stroke-linecap='round' fill='none'/>");
      }
      o.push("<circle cx='" + h + "' cy='211' r='" + (aw / 2 + 0.5) + "' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1.3'/>",
        "<circle cx='" + (h + s * (aw / 2 - 1)) + "' cy='208' r='" + (aw / 5 + 0.8) + "' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1'/>");
    });
    // busto: maglietta con scollo, pieghe e orlo
    var tor = "M" + x(-he) + ",214 C" + x(-he - 1) + ",202 " + x(-wa) + ",198 " + x(-wa) + ",188 C" + x(-wa) + ",177 " + x(-sh) + ",172 " + x(-sh + 1) + ",163" +
      " C" + x(-sh + 6) + ",155 86,153 100,153 C114,153 " + x(sh - 6) + ",155 " + x(sh - 1) + ",163 C" + x(sh) + ",172 " + x(wa) + ",177 " + x(wa) + ",188" +
      " C" + x(wa) + ",198 " + x(he + 1) + ",202 " + x(he) + ",214 Q100,223 " + x(-he) + ",214 Z";
    o.push("<path d='" + tor + "' fill='" + u("m") + "' stroke='" + bM + "' stroke-width='1.8'/>",
      "<path d='M" + x(-he + 3) + ",210 Q100,219 " + x(he - 3) + ",210' stroke='" + tono(M, -0.25) + "' stroke-width='2' opacity='.55' fill='none'/>",
      "<path d='M" + x(-wa + 4) + ",190 Q" + x(-wa + 11) + ",196 " + x(-wa + 6) + ",205 M" + x(wa - 4) + ",190 Q" + x(wa - 11) + ",196 " + x(wa - 6) + ",205' stroke='" + bM + "' stroke-width='1.5' opacity='.3' fill='none' stroke-linecap='round'/>",
      "<path d='M" + x(-sh + 5) + ",182 Q" + x(-sh + 5) + ",168 82,161' stroke='#fff' stroke-width='4' opacity='.2' fill='none' stroke-linecap='round'/>");
    // stampa sul petto (ritagliata dentro la maglia)
    var inkS = chiaro(M) ? tono(M, -0.6) : "#ffffff";
    if (c.stampa !== "nessuna") {
      o.push("<clipPath id='" + id + "tc'><path d='" + tor + "'/></clipPath>", "<g clip-path='" + u("tc") + "'>");
      if (c.stampa === "righe") for (var ry3 = 163; ry3 < 222; ry3 += 9) o.push("<rect x='40' y='" + ry3 + "' width='120' height='4' fill='" + inkS + "' opacity='.32'/>");
      else if (c.stampa === "stella") {
        var st5 = []; for (var k5 = 0; k5 < 10; k5++) { var r5 = k5 % 2 ? 5 : 12, a5 = (-90 + k5 * 36) * Math.PI / 180; st5.push((100 + r5 * Math.cos(a5)).toFixed(1) + "," + (186 + r5 * Math.sin(a5)).toFixed(1)); }
        o.push("<polygon points='" + st5.join(" ") + "' fill='" + inkS + "' opacity='.9' stroke-linejoin='round' stroke='" + inkS + "' stroke-width='1.5'/>");
      }
      else if (c.stampa === "fulmine") o.push("<path d='M104,171 L93,188 L100,188 L96,200 L108,182 L101,182 L105,171 Z' fill='" + u("oro") + "' stroke='#8a5209' stroke-width='1.2' stroke-linejoin='round'/>");
      else if (c.stampa === "cuore") o.push("<path d='M100,197 C87,189 87,176 94.5,176 C98,176 100,179 100,181.5 C100,179 102,176 105.5,176 C113,176 113,189 100,197 Z' fill='" + (chiaro(M) || /e03131|e64980|fd7e14/.test(M) ? "#ff3d68" : "#ff6b8b") + "' stroke='" + (/e03131|e64980/.test(M) ? "#fff" : "none") + "' stroke-width='1.6'/>",
        "<ellipse cx='95' cy='180' rx='2.6' ry='1.6' fill='#fff' opacity='.45'/>");
      o.push("</g>");
    }
    // scollo / colletto / cappuccio secondo lo stile
    if (c.capo === "canotta") o.push("<path d='M83,154 Q100,182 117,154 Z' fill='" + u("pl") + "'/>",
      "<path d='M83,154 Q100,182 117,154' stroke='" + tono(M, -0.2) + "' stroke-width='2.4' fill='none'/>");
    else if (c.capo === "camicia") o.push("<path d='M85,155 Q100,168 115,155 Q100,162 85,155 Z' fill='" + tono(M, -0.4) + "'/>",
      "<path d='M100,160 L100,212' stroke='" + bM + "' stroke-width='1.3' opacity='.45'/>",
      "<circle cx='100' cy='172' r='1.7' fill='" + tono(M, 0.55) + "' stroke='" + bM + "' stroke-width='.5'/>", "<circle cx='100' cy='186' r='1.7' fill='" + tono(M, 0.55) + "' stroke='" + bM + "' stroke-width='.5'/>",
      "<circle cx='100' cy='200' r='1.7' fill='" + tono(M, 0.55) + "' stroke='" + bM + "' stroke-width='.5'/>",
      "<path d='M84,153 L94,168 L100,158 Z' fill='" + tono(M, 0.3) + "' stroke='" + bM + "' stroke-width='1.2' stroke-linejoin='round'/>",
      "<path d='M116,153 L106,168 L100,158 Z' fill='" + tono(M, 0.2) + "' stroke='" + bM + "' stroke-width='1.2' stroke-linejoin='round'/>");
    else {
      o.push("<path d='M85,155 Q100,171 115,155 Q100,163 85,155 Z' fill='" + tono(M, -0.4) + "'/>",
        "<path d='M84,155.5 Q100,172 116,155.5' stroke='" + tono(M, 0.2) + "' stroke-width='2.2' fill='none' stroke-linecap='round' opacity='.8'/>");
      if (c.capo === "felpa") o.push("<path d='M" + x(-wa + 8) + ",196 L" + x(wa - 8) + ",196 Q" + x(wa - 4) + ",208 " + x(wa - 9) + ",212 L" + x(-wa + 9) + ",212 Q" + x(-wa + 4) + ",208 " + x(-wa + 8) + ",196 Z' fill='" + tono(M, -0.1) + "' stroke='" + bM + "' stroke-width='1.2' opacity='.9'/>",
        "<path d='M" + x(-wa + 9) + ",197.5 L" + x(wa - 9) + ",197.5' stroke='#fff' stroke-width='1.2' opacity='.25'/>",
        "<path d='M93,163 L92,180 M107,163 L108,180' stroke='" + tono(M, 0.55) + "' stroke-width='1.6' stroke-linecap='round'/>",
        "<circle cx='92' cy='181.5' r='1.8' fill='" + tono(M, 0.6) + "'/>", "<circle cx='108' cy='181.5' r='1.8' fill='" + tono(M, 0.6) + "'/>");
    }
    if (donna) o.push("<path d='M" + x(-sh + 9) + ",180 Q88,186 97,181 M103,181 Q112,186 " + x(sh - 9) + ",180' stroke='" + bM + "' stroke-width='2' opacity='.32' fill='none' stroke-linecap='round'/>");
    if (gonna && !opts.busto) o.push("<path d='M" + x(-he + 1) + ",207 L" + x(-he - 9) + ",229 Q100,238 " + x(he + 9) + ",229 L" + x(he - 1) + ",207 Q100,214 " + x(-he + 1) + ",207 Z' fill='" + u("t") + "' stroke='" + bT + "' stroke-width='1.8' stroke-linejoin='round'/>",
      "<path d='M" + x(-he / 2) + ",212 L" + x(-he / 2 - 5) + ",232 M100,214 L100,234 M" + x(he / 2) + ",212 L" + x(he / 2 + 5) + ",232' stroke='" + bT + "' stroke-width='1.3' opacity='.35'/>",
      "<path d='M" + x(-he + 4) + ",214 L" + x(-he - 3) + ",228' stroke='#fff' stroke-width='3' opacity='.2' stroke-linecap='round'/>");
    // cappuccio della felpa: poggiato sulle spalle, dietro al collo
    if (c.capo === "felpa") o.push("<path d='M74,160 C68,144 82,134 100,134 C118,134 132,144 126,160 C116,151 84,151 74,160 Z' fill='" + u("m") + "' stroke='" + bM + "' stroke-width='1.6'/>",
      "<path d='M80,155 C80,146 90,140 100,140 C110,140 120,146 120,155' stroke='" + tono(M, -0.35) + "' stroke-width='3' fill='none' opacity='.6'/>");
    // collo con ombra morbida del mento
    o.push("<rect x='88' y='134' width='24' height='24' rx='7' fill='" + u("pl") + "'/>",
      "<ellipse cx='100' cy='143' rx='22' ry='10' fill='" + u("ao") + "'/>");

    // ---------- testa ----------
    [47, 153].forEach(function (ex) {
      var s = ex < 100 ? -1 : 1;
      o.push("<circle cx='" + ex + "' cy='99' r='10' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1.4'/>",
        "<path d='M" + (ex - s * 2) + ",93 Q" + (ex + s * 4) + ",99 " + (ex - s * 1) + ",105' stroke='" + tono(P, -0.3) + "' stroke-width='2' fill='none' stroke-linecap='round'/>");
    });
    o.push("<path d='" + testa + "' fill='" + u("p") + "' stroke='" + bP + "' stroke-width='1.6'/>");
    // dentro la testa: ombra dei capelli sulla fronte, luce di bordo, lucido della guancia
    o.push("<g clip-path='" + u("cv") + "'>");
    if (cappello) o.push("<path d='M36,78 Q100,66 164,78 L164,94 Q100,80 36,94 Z' fill='" + tono(P, -0.55) + "' opacity='.2'/>");   // ombra della visiera
    else if (fr) o.push("<path d='" + fr + "' transform='translate(0,5)' fill='" + tono(P, -0.5) + "' opacity='.2'/>");
    o.push("<path d='M57,70 Q47,94 55,120' stroke='#fff' stroke-width='3' opacity='.2' fill='none' stroke-linecap='round'/>",
      "<ellipse cx='72' cy='104' rx='11' ry='7' fill='" + u("lu") + "' opacity='.35'/>");
    if (tipo === "calvo" || tipo === "cresta") o.push("<ellipse cx='78' cy='55' rx='17' ry='9' fill='" + u("lu") + "' opacity='.7' transform='rotate(-25 78 55)'/>");
    o.push("</g>");

    // guance (a scelta)
    if (c.guance === "leggere" || c.guance === "rosse" || c.guance === "lentiggini") {
      var og = c.guance === "rosse" ? 1 : (c.guance === "leggere" ? 0.55 : 0.35);
      o.push("<ellipse cx='70' cy='117' rx='13' ry='8.5' fill='" + u("g") + "' opacity='" + og + "'/>", "<ellipse cx='130' cy='117' rx='13' ry='8.5' fill='" + u("g") + "' opacity='" + og + "'/>");
    }
    if (c.guance === "lentiggini") {
      [[63, 111], [68, 115], [72, 110], [60, 117], [76, 114], [67, 120], [137, 111], [132, 115], [128, 110], [140, 117], [124, 114], [133, 120], [95, 109], [105, 109], [100, 106]].forEach(function (p) {
        o.push("<circle cx='" + p[0] + "' cy='" + p[1] + "' r='.95' fill='" + tono(P, -0.45) + "' opacity='.65'/>");
      });
    }

    // ---------- occhi ----------
    var scuro = "#2a1a12";
    o.push("<g class='om-occhi'>");   // gruppo a parte: nell'editor sbatte le palpebre
    [80, 120].forEach(function (ex) {
      var s = ex < 100 ? -1 : 1;
      if (c.occhi === "felici") {
        o.push("<path d='M" + (ex - 8.5) + ",103 Q" + ex + ",92 " + (ex + 8.5) + ",103 Q" + ex + ",96 " + (ex - 8.5) + ",103 Z' fill='" + scuro + "' stroke='" + scuro + "' stroke-width='1.6' stroke-linejoin='round'/>");
        if (donna) o.push("<path d='M" + (ex + s * 8) + ",101 L" + (ex + s * 12) + ",98' stroke='" + scuro + "' stroke-width='2' stroke-linecap='round'/>");
        return;
      }
      var big = c.occhi === "grandi", rx = big ? 10 : 8, ry = big ? 12 : 10, ri = big ? 7.2 : 5.8, cy = 100;
      o.push("<clipPath id='" + id + "e" + ex + "'><ellipse cx='" + ex + "' cy='" + cy + "' rx='" + rx + "' ry='" + ry + "'/></clipPath>",
        "<ellipse cx='" + ex + "' cy='" + cy + "' rx='" + rx + "' ry='" + ry + "' fill='" + u("sc") + "' stroke='" + tono(P, -0.45) + "' stroke-width='.8'/>",
        "<g clip-path='" + u("e" + ex) + "'>",
        "<circle cx='" + (ex + s * 0.5) + "' cy='" + (cy + 1.5) + "' r='" + ri + "' fill='" + u("i") + "' stroke='" + tono(I, -0.6) + "' stroke-width='.9'/>",
        "<circle cx='" + (ex + s * 0.5) + "' cy='" + (cy + 1.5) + "' r='" + (ri * 0.48) + "' fill='#0c0c0e'/>",
        "<ellipse cx='" + ex + "' cy='" + (cy - ry + 1) + "' rx='" + rx + "' ry='3.5' fill='#000' opacity='.12'/>",
        "</g>",
        "<circle cx='" + (ex + 2.6) + "' cy='" + (cy - 2.4) + "' r='" + (big ? 2.8 : 2.2) + "' fill='#fff'/>",
        "<circle cx='" + (ex - 2) + "' cy='" + (cy + 4.5) + "' r='1.1' fill='#fff' opacity='.8'/>",
        "<path d='M" + (ex - rx - 0.6) + "," + (cy + 1) + " Q" + ex + "," + (cy - 2 * ry) + " " + (ex + rx + 0.6) + "," + (cy + 1) + "' stroke='" + scuro + "' stroke-width='" + (c.occhi === "dolci" ? 3.4 : 2.3) + "' fill='none' stroke-linecap='round'/>");
      if (donna || c.occhi === "dolci") o.push("<path d='M" + (ex + s * 6) + ",92.5 L" + (ex + s * 10.5) + ",88.5 M" + (ex + s * 8.5) + ",95.5 L" + (ex + s * 13) + ",93' stroke='" + scuro + "' stroke-width='2' stroke-linecap='round'/>");
      if (c.occhi === "furbi") o.push("<path d='M" + (ex - rx - 1) + "," + (cy + 1) + " Q" + ex + "," + (cy - 2 * ry) + " " + (ex + rx + 1) + "," + (cy + 1) + " Z' fill='" + u("p") + "'/>",
        "<path d='M" + (ex - rx - 1) + "," + (cy + 1) + " L" + (ex + rx + 1) + "," + cy + "' stroke='" + scuro + "' stroke-width='2.8' stroke-linecap='round'/>");
      else o.push("<path d='M" + (ex - rx + 1.5) + "," + (cy + ry - 1.5) + " Q" + ex + "," + (cy + ry + 2.5) + " " + (ex + rx - 1.5) + "," + (cy + ry - 1.5) + "' stroke='" + tono(P, -0.4) + "' stroke-width='1.1' opacity='.45' fill='none' stroke-linecap='round'/>");
    });
    o.push("</g>");
    // sopracciglia a forma (più spesse verso il naso, sottili verso l'esterno)
    var colS = tipo === "calvo" ? "#4b2f1d" : tono(H, -0.25);
    [80, 120].forEach(function (ex) {
      var s = ex < 100 ? -1 : 1, est = ex + s * 11, int = ex - s * 9, t = c.sopracc, yE, yI, cyb, sp;
      if (t === "decise") { yE = 80; yI = 85; cyb = 80; sp = 5.2; }
      else if (t === "alzate") { yE = 83; yI = 79; cyb = 72; sp = 4; }
      else if (t === "sottili") { yE = 84; yI = 83; cyb = 77; sp = 2.2; }
      else { yE = 85; yI = 83; cyb = 77.5; sp = 4.2; }
      o.push("<path d='M" + est + "," + yE + " Q" + ex + "," + cyb + " " + int + "," + yI + " L" + int + "," + (yI + sp) + " Q" + ex + "," + (cyb + sp * 0.85) + " " + est + "," + (yE + sp * 0.35) + " Z' fill='" + colS + "' stroke='" + colS + "' stroke-width='.9' stroke-linejoin='round'/>");
    });
    // naso
    var nas = tono(P, -0.36);
    if (c.naso === "tondo") o.push("<ellipse cx='100' cy='112.5' rx='6.5' ry='5' fill='" + tono(P, -0.07) + "' stroke='" + tono(P, -0.25) + "' stroke-width='.8'/>",
      "<ellipse cx='97.3' cy='115' rx='1.4' ry='1' fill='" + nas + "'/>", "<ellipse cx='102.7' cy='115' rx='1.4' ry='1' fill='" + nas + "'/>", "<circle cx='98' cy='110.5' r='1.8' fill='#fff' opacity='.45'/>");
    else if (c.naso === "punta") o.push("<path d='M100,102 Q107.5,113 98,117' stroke='" + nas + "' stroke-width='2.3' fill='none' stroke-linecap='round'/>", "<circle cx='101' cy='110' r='1.6' fill='#fff' opacity='.4'/>");
    else o.push("<path d='M95.5,114 Q100,117.5 104.5,114' stroke='" + nas + "' stroke-width='2.2' fill='none' stroke-linecap='round'/>", "<circle cx='99' cy='110.5' r='1.7' fill='#fff' opacity='.4'/>");

    // barba: prima della bocca (la bocca resta sopra), baffi dopo
    var conBarba = c.barba === "corta" || c.barba === "folta", conPizz = c.barba === "pizzetto" || c.barba === "baffipizzetto";
    if (c.barba === "accenno") o.push("<path d='" + BARBA.corta + "' fill='" + H + "' opacity='.16'/>", "<path d='" + BARBA.corta + "' fill='" + u("pt") + "' opacity='.7'/>");
    if (conBarba || conPizz) {
      var dB = conBarba ? BARBA[c.barba] : BARBA.pizzetto;
      o.push("<path d='" + dB + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.2' stroke-linejoin='round'/>", "<g clip-path='" + u("bc") + "'>");
      for (var bi = 0; bi < 11; bi++) {
        var bx = 50 + bi * 10;
        o.push("<path d='M" + bx + ",128 Q" + (bx + 3) + ",146 " + (bx - 1) + ",172' stroke='" + bH + "' stroke-width='1.2' opacity='.35' fill='none'/>",
          "<path d='M" + (bx + 5) + ",132 Q" + (bx + 7) + ",148 " + (bx + 4) + ",170' stroke='" + tono(H, 0.35) + "' stroke-width='1' opacity='.22' fill='none'/>");
      }
      o.push("</g>");
    }

    // bocca
    var lab = "#8a3328", dentro = "#5a1613";
    if (c.bocca === "sorrisone") o.push("<path d='M85,122 Q100,125 115,122 Q113,142 100,142 Q87,142 85,122 Z' fill='" + dentro + "' stroke='" + lab + "' stroke-width='1.3' stroke-linejoin='round'/>",
      "<path d='M87,123.3 Q100,126 113,123.3 L112,128.3 Q100,130.5 88,128.3 Z' fill='#fff'/>", "<ellipse cx='100' cy='137.5' rx='8' ry='3.6' fill='#ff6f73'/>");
    else if (c.bocca === "neutro") o.push("<path d='M90,128 Q100,130 110,128' stroke='" + lab + "' stroke-width='3' fill='none' stroke-linecap='round'/>",
      "<path d='M94,133 Q100,135 106,133' stroke='" + tono(P, -0.25) + "' stroke-width='2' fill='none' opacity='.55' stroke-linecap='round'/>");
    else if (c.bocca === "o") o.push("<ellipse cx='100' cy='128' rx='6' ry='7' fill='" + dentro + "' stroke='" + lab + "' stroke-width='1.6'/>", "<ellipse cx='100' cy='131.5' rx='3.8' ry='2' fill='#ff7b7b'/>");
    else if (c.bocca === "ghigno") o.push("<path d='M87,127 Q103,134 114,121 Q102,130 87,127 Z' fill='" + lab + "' stroke='" + lab + "' stroke-width='1.4' stroke-linejoin='round'/>");
    else if (c.bocca === "labbra") o.push("<path d='M86,126 Q92,120.5 100,123.5 Q108,120.5 114,126 Q100,128 86,126 Z' fill='#c9435a'/>",
      "<path d='M86,126 Q100,128 114,126 Q108,134.5 100,134.5 Q92,134.5 86,126 Z' fill='#dc5a70'/>",
      "<path d='M86,126 Q100,128 114,126' stroke='#7d1f33' stroke-width='1.1' fill='none'/>", "<ellipse cx='104' cy='130.5' rx='3.4' ry='1.3' fill='#fff' opacity='.45'/>");
    else o.push("<path d='M86,123 Q100,138 114,123 Q100,131 86,123 Z' fill='" + lab + "' stroke='" + lab + "' stroke-width='1.3' stroke-linejoin='round'/>",
      "<path d='M84.5,121 Q85.5,123.5 88,123.5 M115.5,121 Q114.5,123.5 112,123.5' stroke='" + lab + "' stroke-width='1.3' fill='none' stroke-linecap='round'/>");

    var dBaffi = (c.barba === "baffi" || c.barba === "baffipizzetto" || conBarba) ? BARBA.baffi : (c.barba === "baffoni" ? BARBA.baffoni : null);
    if (dBaffi) o.push("<path d='" + dBaffi + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.1' stroke-linejoin='round'/>",
      "<path d='M88,119 Q93,116.5 98,119 M102,119 Q107,116.5 112,119' stroke='" + tono(H, 0.35) + "' stroke-width='1' opacity='.4' fill='none'/>");

    // ---------- capelli DAVANTI (con ciocche e riflesso lucido) ----------
    if (/corti|spettinati|frangia|coda/.test(tipo)) [1, -1].forEach(function (s) {   // basette
      var bx = 100 - s * 54;
      o.push("<path d='M" + bx + ",92 Q" + (bx - s * 1) + ",104 " + (bx + s * 3) + ",113 L" + (bx + s * 7) + ",112 Q" + (bx + s * 5) + ",102 " + (bx + s * 6) + ",92 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1' stroke-linejoin='round'/>");
    });
    if (fr) {
      if (cappello) o.push("<g clip-path='" + u("sc2") + "'>");
      o.push("<path d='" + fr + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8' stroke-linejoin='round'/>", "<g clip-path='" + u("hc") + "'>");
      for (var ai = 0; ai < 13; ai++) {
        var ang = (168 - ai * 13) * Math.PI / 180, ex2 = 106 + 80 * Math.cos(ang), ey2 = 26 + 80 * Math.sin(ang),
            cxq = 106 + 42 * Math.cos(ang + 0.14), cyq = 26 + 42 * Math.sin(ang + 0.14);
        o.push("<path d='M106,26 Q" + cxq.toFixed(1) + "," + cyq.toFixed(1) + " " + ex2.toFixed(1) + "," + ey2.toFixed(1) + "' stroke='" + (ai % 2 ? tono(H, 0.4) : bH) + "' stroke-width='" + (ai % 2 ? 1 : 1.4) + "' opacity='" + (ai % 2 ? 0.25 : 0.38) + "' fill='none'/>");
      }
      o.push("</g>", "<path d='M68,50 Q98,33 131,46' stroke='#fff' stroke-width='6' opacity='.22' fill='none' stroke-linecap='round'/>",
        "<path d='M74,47 Q98,36 124,44' stroke='#fff' stroke-width='2' opacity='.35' fill='none' stroke-linecap='round'/>");
      if (cappello) o.push("</g>");
    }
    if (tipo === "cresta") o.push("<path d='" + FRONTE.corti + "' fill='" + H + "' opacity='.16'/>",
      "<path d='" + FRONTE.corti + "' fill='" + u("pt") + "' opacity='.35'/>",
      "<path d='M85,44 C86,22 96,6 100,4 C104,6 114,22 115,44 C108,50 92,50 85,44 Z' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.8'/>",
      "<path d='M92,42 Q94,24 100,8 M100,44 Q101,26 104,10 M108,43 Q107,28 106,14' stroke='" + bH + "' stroke-width='1.2' opacity='.4' fill='none'/>",
      "<path d='M95,16 Q96,28 93,40' stroke='#fff' stroke-width='2.5' opacity='.35' fill='none' stroke-linecap='round'/>");
    if (tipo === "ricci") riccioli(false);

    // ---------- accessori ----------
    if (acc === "occhiali" || acc === "sole") {
      var sole = acc === "sole";
      o.push("<path d='M66,97 L47,94 M134,97 L153,94' stroke='#1d1d24' stroke-width='2.8' stroke-linecap='round'/>",
        "<path d='M93,99 Q100,95 107,99' stroke='#1d1d24' stroke-width='2.8' fill='none'/>");
      [80, 120].forEach(function (ex) {
        if (sole) o.push("<rect x='" + (ex - 14) + "' y='89' width='28' height='21' rx='9' fill='" + u("lente") + "' stroke='#000' stroke-width='2'/>",
          "<path d='M" + (ex - 9) + ",95 L" + (ex - 3) + ",93 M" + (ex - 8) + ",99 L" + (ex + 4) + ",95' stroke='#fff' stroke-width='2' opacity='.45' stroke-linecap='round'/>");
        else o.push("<circle cx='" + ex + "' cy='100' r='13.5' fill='#bfe3ff' fill-opacity='.14' stroke='#1d1d24' stroke-width='2.8'/>",
          "<path d='M" + (ex - 7) + ",93 L" + (ex - 2) + ",90' stroke='#fff' stroke-width='2' opacity='.55' stroke-linecap='round'/>");
      });
    }
    if (acc === "fascia") o.push("<path d='M46,74 Q100,56 154,74 L155,85 Q100,67 45,85 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.4'/>",
      "<path d='M50,76 Q100,60 150,76' stroke='#fff' stroke-width='1.5' opacity='.3' fill='none'/>",
      "<path d='M150,76 Q162,70 166,78 Q160,84 152,82 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.2'/>");
    if (acc === "cappellino") o.push("<path d='M39,83 C35,14 165,14 161,83 Q100,71 39,83 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.8'/>",
      "<path d='M100,26 L100,75 M70,31 Q60,54 58,79 M130,31 Q140,54 142,79' stroke='" + bA + "' stroke-width='1.2' opacity='.35' fill='none'/>",
      "<path d='M44,79 Q100,68 156,79' stroke='#fff' stroke-width='1.2' stroke-dasharray='3 3' opacity='.45' fill='none'/>",
      "<path d='M94,78 Q152,69 184,86 Q154,97 94,86 Z' fill='" + tono(A, -0.22) + "' stroke='" + bA + "' stroke-width='1.8'/>",
      "<path d='M100,80 Q150,73 178,86' stroke='#fff' stroke-width='1.5' opacity='.25' fill='none'/>",
      "<circle cx='100' cy='24' r='5.5' fill='" + tono(A, -0.2) + "' stroke='" + bA + "' stroke-width='1'/>", "<path d='M58,50 Q80,30 108,29' stroke='#fff' stroke-width='5' opacity='.22' fill='none' stroke-linecap='round'/>");
    if (acc === "berretto") {
      o.push("<path d='M40,88 C34,16 166,16 160,88 Z' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.8'/>");
      for (var ri2 = 0; ri2 < 9; ri2++) o.push("<path d='M" + (52 + ri2 * 12) + ",44 L" + (52 + ri2 * 12) + ",82' stroke='" + bA + "' stroke-width='1.1' opacity='.25'/>");
      o.push("<path d='M37,75 Q100,62 163,75 L163,93 Q100,80 37,93 Z' fill='" + tono(A, -0.12) + "' stroke='" + bA + "' stroke-width='1.6'/>");
      for (var rb = 0; rb < 16; rb++) o.push("<path d='M" + (42 + rb * 7.7) + "," + (74 - Math.sin(rb / 15 * Math.PI) * 10) + " l0,15' stroke='" + bA + "' stroke-width='1.3' opacity='.35'/>");
      o.push("<circle cx='100' cy='18' r='12' fill='" + u("a") + "' stroke='" + bA + "' stroke-width='1.4'/>", "<circle cx='95' cy='13' r='4.5' fill='#fff' opacity='.25'/>",
        "<path d='M54,50 Q76,30 104,28' stroke='#fff' stroke-width='5' opacity='.2' fill='none' stroke-linecap='round'/>");
    }
    if (acc === "cuffie") o.push("<path d='M44,96 C38,24 162,24 156,96' stroke='#2b2b33' stroke-width='8' fill='none' stroke-linecap='round'/>",
      "<path d='M52,60 Q70,34 100,31' stroke='#fff' stroke-width='2' opacity='.25' fill='none' stroke-linecap='round'/>",
      "<rect x='33' y='82' width='20' height='32' rx='9' fill='" + u("a") + "' stroke='#222' stroke-width='1.8'/>", "<rect x='147' y='82' width='20' height='32' rx='9' fill='" + u("a") + "' stroke='#222' stroke-width='1.8'/>",
      "<rect x='37' y='86' width='6' height='12' rx='3' fill='#fff' opacity='.25'/>", "<rect x='151' y='86' width='6' height='12' rx='3' fill='#fff' opacity='.25'/>");
    if (acc === "orecchini") [47, 153].forEach(function (ex) {
      o.push("<circle cx='" + ex + "' cy='114' r='4.5' fill='none' stroke='" + u("oro") + "' stroke-width='2.2'/>", "<circle cx='" + (ex - 1.5) + "' cy='111' r='1' fill='#fff' opacity='.7'/>");
    });
    if (acc === "corona") o.push("<path d='M62,54 L68,22 L85,40 L100,12 L115,40 L132,22 L138,54 Q100,62 62,54 Z' fill='" + u("oro") + "' stroke='#a8740b' stroke-width='1.8' stroke-linejoin='round'/>",
      "<path d='M64,50 Q100,57 136,50' stroke='#fff3b0' stroke-width='2' opacity='.6' fill='none'/>",
      "<circle cx='100' cy='44' r='5' fill='#e03131' stroke='#8a1c1c'/>", "<circle cx='98.5' cy='42.5' r='1.5' fill='#fff' opacity='.7'/>",
      "<circle cx='79' cy='48' r='3.5' fill='#1c7ed6'/>", "<circle cx='121' cy='48' r='3.5' fill='#2f9e44'/>",
      "<circle cx='68' cy='22' r='3' fill='" + u("oro") + "'/>", "<circle cx='100' cy='12' r='3.2' fill='" + u("oro") + "'/>", "<circle cx='132' cy='22' r='3' fill='" + u("oro") + "'/>");

    function riccioli(dietro) {
      var i, a, rx2, ry2;
      function boccolo(cx, cy, r) {
        o.push("<circle cx='" + cx.toFixed(1) + "' cy='" + cy.toFixed(1) + "' r='" + r + "' fill='" + u("h") + "' stroke='" + bH + "' stroke-width='1.3'/>",
          "<path d='M" + (cx - r * 0.5).toFixed(1) + "," + (cy - r * 0.1).toFixed(1) + " a" + (r * 0.45) + "," + (r * 0.45) + " 0 1,1 " + (r * 0.6).toFixed(1) + "," + (r * 0.4).toFixed(1) + "' stroke='" + bH + "' stroke-width='1.1' opacity='.45' fill='none'/>",
          "<circle cx='" + (cx - r * 0.35).toFixed(1) + "' cy='" + (cy - r * 0.35).toFixed(1) + "' r='" + (r * 0.22).toFixed(1) + "' fill='#fff' opacity='.22'/>");
      }
      if (dietro) { for (i = 0; i < 6; i++) { boccolo(44 - i * 0.5, 90 + i * 9, 12); boccolo(156 + i * 0.5, 90 + i * 9, 12); } return; }
      for (i = 0; i <= 11; i++) { a = Math.PI * (1.02 + 0.96 * i / 11); rx2 = 100 + 50 * Math.cos(a); ry2 = 86 + 50 * Math.sin(a); boccolo(rx2, ry2, 14); }
      [[82, 44], [100, 40], [118, 44], [90, 56], [110, 56]].forEach(function (p) { boccolo(p[0], p[1], 13); });
    }

    o.push("</g>");   // fine om-tutto
    var vb = opts.busto ? "14 2 172 176" : "0 0 200 256";
    var px = opts.px ? " width='" + opts.px + "' height='" + Math.round(opts.px * (opts.busto ? 176 / 172 : 1.28)) + "'" : "";
    return "<svg xmlns='http://www.w3.org/2000/svg' viewBox='" + vb + "'" + px + " class='omino'>" + o.join("") + "</svg>";
  }

  function el(cfg, opts) { var s = document.createElement("span"); s.className = "omino-box"; s.innerHTML = svg(cfg, opts); return s; }

  // omino a caso ma stabile: lo stesso nome dà sempre lo stesso omino
  function casuale(seme) {
    var h = 2166136261, str = String(seme == null ? Math.random() : seme);
    for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    function pick(lista) { h = Math.imul(h ^ (h >>> 15), 2246822507); h ^= h >>> 13; return (h >>> 0) % lista.length; }
    function uno(lista) { return lista[pick(lista)]; }
    var donna = pick([0, 1]) === 1;
    return { forma: donna ? "donna" : "uomo", corpo: uno(OPZ.corpo), sotto: donna && pick([0, 1]) ? "gonna" : "pantaloni",
      pelle: pick(OPZ.pelle), viso: uno(OPZ.viso), capelli: uno(OPZ.capelli), colCap: pick(OPZ.colCap.slice(0, 7)),
      occhi: uno(OPZ.occhi), iride: pick(OPZ.iride), sopracc: uno(OPZ.sopracc), naso: uno(OPZ.naso), bocca: uno(OPZ.bocca),
      guance: uno(["no", "no", "leggere", "rosse", "lentiggini"]), barba: donna ? "no" : uno(["no", "no", "no", "accenno", "corta", "folta", "pizzetto", "baffi", "baffipizzetto", "baffoni"]),
      capo: uno(OPZ.capo), maglia: pick(OPZ.maglia), stampa: uno(["nessuna", "nessuna", "righe", "stella", "fulmine", "cuore"]),
      pantaloni: pick(OPZ.pantaloni.slice(0, 5)), scarpe: pick(OPZ.scarpe), colAcc: pick(OPZ.colAcc),
      accessorio: pick([0, 0, 0, 1]) ? uno(LIBERI) : "nessuno" };
  }

  window.SGOmino = { svg: svg, el: el, casuale: casuale, norm: norm, OPZ: OPZ, BASE: BASE, NOMI: NOMI, LIBERI: LIBERI };
})();

/* =========================================================
   SPeeD GAME — OMINI personalizzabili (stile Mii)
   Disegnati in SVG col codice: niente immagini, leggerissimi.
   SGOmino.svg(cfg, {busto, px})  -> stringa SVG
   SGOmino.el(cfg, opts)          -> elemento pronto
   SGOmino.casuale(seme)          -> omino a caso (sempre uguale per lo stesso seme)
   ========================================================= */
(function () {
  "use strict";

  var OPZ = {
    pelle:    ["#ffe3cc", "#f7cda8", "#eab48a", "#cf9464", "#a96d43", "#7c4b2c", "#58341f"],
    capelli:  ["corti", "spettinati", "frangia", "caschetto", "lunghi", "coda", "ricci", "cresta", "calvo"],
    colCap:   ["#2a1d15", "#4b2f1d", "#7a4a26", "#b5672d", "#e0b85a", "#f3e3a8", "#9aa0a8", "#c0392b", "#2e86de", "#8e44ad", "#ff7eb6"],
    occhi:    ["tondi", "dolci", "grandi", "felici", "furbi"],
    iride:    ["#3b2416", "#6b4423", "#2e6fbf", "#3f8f4f", "#6b6f76"],
    sopracc:  ["morbide", "decise", "alzate"],
    naso:     ["piccolo", "tondo", "punta"],
    bocca:    ["sorriso", "sorrisone", "neutro", "o", "ghigno"],
    maglia:   ["#e03131", "#1c7ed6", "#2f9e44", "#f59f00", "#7048e8", "#e64980", "#15aabf", "#343a40", "#f1f3f5", "#fd7e14"],
    pantaloni:["#2b3a67", "#343a40", "#6c5a3e", "#5c636a", "#1971c2", "#e64980", "#7048e8", "#f1f3f5"],
    forma:    ["uomo", "donna"],
    corpo:    ["snello", "medio", "robusto"],
    sotto:    ["pantaloni", "gonna"],
    accessorio:["nessuno", "occhiali", "sole", "cappellino", "fascia", "cuffie", "baffi", "barba", "corona"]
  };
  var BASE = { pelle: 1, capelli: "corti", colCap: 1, occhi: "tondi", iride: 1, sopracc: "morbide", naso: "piccolo",
               bocca: "sorriso", maglia: 1, pantaloni: 0, accessorio: "nessuno", forma: "uomo", corpo: "medio", sotto: "pantaloni" };

  // accessori liberi per tutti; gli altri (es. corona) si sbloccheranno coi trofei
  var LIBERI = ["nessuno", "occhiali", "sole", "cappellino", "fascia", "cuffie", "baffi", "barba"];

  var uid = 0;
  function rgb(h) { h = h.replace("#", ""); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function hex(c) { return "#" + c.map(function (x) { x = Math.max(0, Math.min(255, Math.round(x))); return (x < 16 ? "0" : "") + x.toString(16); }).join(""); }
  // amt > 0 schiarisce, < 0 scurisce
  function tono(h, amt) { return hex(rgb(h).map(function (x) { return amt > 0 ? x + (255 - x) * amt : x * (1 + amt); })); }
  function col(lista, v) { return typeof v === "string" && v.charAt(0) === "#" ? v : (lista[v] || lista[0]); }

  function svg(cfg, opts) {
    cfg = cfg || {}; opts = opts || {};
    var c = {}; for (var k in BASE) c[k] = cfg[k] != null ? cfg[k] : BASE[k];
    var id = "om" + (++uid) + "_";
    var P = col(OPZ.pelle, c.pelle), H = col(OPZ.colCap, c.colCap), M = col(OPZ.maglia, c.maglia),
        T = col(OPZ.pantaloni, c.pantaloni), I = col(OPZ.iride, c.iride);
    var acc = c.accessorio, tipo = c.capelli;
    if (acc === "cappellino" && /spettinati|cresta|ricci/.test(tipo)) tipo = "corti";   // sotto il cappello si schiacciano
    var o = [];

    // --- gradienti: danno il volume (luce in alto a sinistra) ---
    function radiale(nome, base, chiaro, scuro) {
      return "<radialGradient id='" + id + nome + "' cx='.38' cy='.3' r='.8'><stop offset='0' stop-color='" + tono(base, chiaro) +
        "'/><stop offset='.55' stop-color='" + base + "'/><stop offset='1' stop-color='" + tono(base, scuro) + "'/></radialGradient>";
    }
    function lineare(nome, base, chiaro, scuro) {
      return "<linearGradient id='" + id + nome + "' x1='0' y1='0' x2='.35' y2='1'><stop offset='0' stop-color='" + tono(base, chiaro) +
        "'/><stop offset='.5' stop-color='" + base + "'/><stop offset='1' stop-color='" + tono(base, scuro) + "'/></linearGradient>";
    }
    o.push("<defs>", radiale("p", P, 0.2, -0.2), radiale("h", H, 0.28, -0.3), lineare("m", M, 0.22, -0.28),
      lineare("t", T, 0.2, -0.3), radiale("oro", "#ffc93c", 0.45, -0.3), lineare("s", "#2d2d33", 0.25, -0.3), "</defs>");
    var fP = "url(#" + id + "p)", fH = "url(#" + id + "h)", fM = "url(#" + id + "m)", fT = "url(#" + id + "t)";
    var bordoP = tono(P, -0.38), bordoH = tono(H, -0.45), bordoM = tono(M, -0.4);

    // ombra a terra
    if (!opts.busto) o.push("<ellipse cx='100' cy='246' rx='46' ry='6' fill='#000' opacity='.28'/>");

    // --- capelli DIETRO la testa ---
    if (tipo === "lunghi") o.push("<path d='M40,92 C38,38 162,38 160,92 L168,188 Q100,204 32,188 Z' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='2'/>");
    if (tipo === "caschetto") o.push("<path d='M40,92 C40,38 160,38 160,92 L162,142 Q148,152 134,144 L66,144 Q52,152 38,142 Z' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='2'/>");
    if (tipo === "coda") o.push("<path d='M146,62 C178,52 190,92 178,128 C173,143 160,148 155,136 C166,110 164,86 142,74 Z' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='2'/>",
      "<circle cx='149' cy='67' r='6' fill='#ff5c93' stroke='#c2185b' stroke-width='1.5'/>");
    if (tipo === "ricci") riccioli(true);

    // --- corpo: corporatura + forma (donna = spalle più strette, vita segnata, fianchi più larghi) ---
    var B = { snello: [27, 22, 24, 15, 12], medio: [34, 31, 33, 20, 17], robusto: [40, 46, 44, 25, 21] }[c.corpo] || [34, 31, 33, 20, 17];
    var donna = c.forma === "donna", gonna = donna && c.sotto === "gonna";
    var sh = B[0] - (donna ? 5 : 0), wa = B[1] - (donna ? 7 : 0), he = B[2] + (donna ? 6 : 0), lw = B[3] - (donna ? 2 : 0), aw = B[4] - (donna ? 2 : 0);
    if (!opts.busto) {
      var lx = 97 - lw, fGamba = gonna ? fP : fT;
      o.push("<rect x='" + lx + "' y='204' width='" + lw + "' height='35' rx='" + Math.min(9, lw / 2) + "' fill='" + fGamba + "'/>",
        "<rect x='103' y='204' width='" + lw + "' height='35' rx='" + Math.min(9, lw / 2) + "' fill='" + fGamba + "'/>");
      [97 - lw / 2, 103 + lw / 2].forEach(function (x) {
        o.push("<ellipse cx='" + x + "' cy='240' rx='" + (lw / 2 + 5) + "' ry='7' fill='url(#" + id + "s)'/>",
          "<ellipse cx='" + (x - 5) + "' cy='237' rx='5' ry='2' fill='#fff' opacity='.25'/>");
      });
    }
    // braccia (maniche) + mani
    var ax = 100 - (sh - 6), hx = 100 - (Math.max(sh, wa, he) + 12);
    [1, -1].forEach(function (s) {
      var a = 100 + s * (ax - 100), h = 100 + s * (hx - 100), d = "M" + a + ",166 C" + (a + s * (-12)) + ",172 " + h + ",188 " + h + ",204";
      o.push("<path d='" + d + "' stroke='" + bordoM + "' stroke-width='" + (aw + 4) + "' stroke-linecap='round' fill='none'/>",
        "<path d='" + d + "' stroke='" + fM + "' stroke-width='" + aw + "' stroke-linecap='round' fill='none'/>",
        "<circle cx='" + h + "' cy='211' r='" + (aw / 2 + 0.5) + "' fill='" + fP + "' stroke='" + bordoP + "' stroke-width='1.5'/>");
    });
    // busto (maglietta) + colletto
    function x(v) { return (100 + v).toFixed(1); }
    var tor = "M" + x(-he) + ",214 C" + x(-he - 1) + ",202 " + x(-wa) + ",198 " + x(-wa) + ",188 C" + x(-wa) + ",177 " + x(-sh) + ",172 " + x(-sh + 1) + ",163" +
      " C" + x(-sh + 6) + ",155 86,153 100,153 C114,153 " + x(sh - 6) + ",155 " + x(sh - 1) + ",163 C" + x(sh) + ",172 " + x(wa) + ",177 " + x(wa) + ",188" +
      " C" + x(wa) + ",198 " + x(he + 1) + ",202 " + x(he) + ",214 Q100,223 " + x(-he) + ",214 Z";
    o.push("<path d='" + tor + "' fill='" + fM + "' stroke='" + bordoM + "' stroke-width='2'/>",
      "<path d='M84,157 Q100,172 116,157' stroke='" + bordoM + "' stroke-width='3.5' fill='none' stroke-linecap='round'/>",
      "<path d='M" + x(-sh + 4) + ",180 Q" + x(-sh + 5) + ",168 82,162' stroke='#fff' stroke-width='4' opacity='.18' fill='none' stroke-linecap='round'/>");
    if (donna) o.push("<path d='M" + x(-sh + 9) + ",180 Q88,186 97,181 M103,181 Q112,186 " + x(sh - 9) + ",180' stroke='" + bordoM + "' stroke-width='2.2' opacity='.35' fill='none' stroke-linecap='round'/>");
    if (gonna && !opts.busto) o.push("<path d='M" + x(-he + 1) + ",207 L" + x(-he - 9) + ",229 Q100,238 " + x(he + 9) + ",229 L" + x(he - 1) + ",207 Q100,214 " + x(-he + 1) + ",207 Z' fill='" + fT + "' stroke='" + tono(T, -0.4) + "' stroke-width='2' stroke-linejoin='round'/>",
      "<path d='M" + x(-he + 4) + ",214 L" + x(-he - 3) + ",228' stroke='#fff' stroke-width='3' opacity='.18' stroke-linecap='round'/>");
    // collo con ombra della testa
    o.push("<rect x='88' y='136' width='24' height='22' rx='6' fill='" + tono(P, -0.18) + "'/>",
      "<ellipse cx='100' cy='144' rx='14' ry='5' fill='" + tono(P, -0.35) + "' opacity='.55'/>");

    // --- testa ---
    o.push("<circle cx='47' cy='99' r='10' fill='" + fP + "' stroke='" + bordoP + "' stroke-width='1.5'/>", "<ellipse cx='48' cy='99' rx='4' ry='5.5' fill='" + tono(P, -0.18) + "'/>",
      "<circle cx='153' cy='99' r='10' fill='" + fP + "' stroke='" + bordoP + "' stroke-width='1.5'/>", "<ellipse cx='152' cy='99' rx='4' ry='5.5' fill='" + tono(P, -0.18) + "'/>",
      "<ellipse cx='100' cy='92' rx='54' ry='56' fill='" + fP + "' stroke='" + bordoP + "' stroke-width='1.8'/>");
    if (tipo === "calvo") o.push("<ellipse cx='76' cy='54' rx='14' ry='7' fill='#fff' opacity='.28' transform='rotate(-25 76 54)'/>");

    // guance
    o.push("<ellipse cx='70' cy='118' rx='9' ry='5.5' fill='#ff6b6b' opacity='.22'/>", "<ellipse cx='130' cy='118' rx='9' ry='5.5' fill='#ff6b6b' opacity='.22'/>");

    // --- occhi ---
    [80, 120].forEach(function (x) {
      var s = x < 100 ? -1 : 1;
      if (c.occhi === "felici") { o.push("<path d='M" + (x - 8) + ",103 Q" + x + ",93 " + (x + 8) + ",103' stroke='#2a1a12' stroke-width='3.4' fill='none' stroke-linecap='round'/>"); return; }
      var big = c.occhi === "grandi", rx = big ? 10 : 8, ry = big ? 12 : 10, ri = big ? 7.2 : 5.8;
      o.push("<ellipse cx='" + x + "' cy='100' rx='" + rx + "' ry='" + ry + "' fill='#fff' stroke='#00000030' stroke-width='1'/>",
        "<circle cx='" + (x + s * 0.5) + "' cy='101.5' r='" + ri + "' fill='" + I + "'/>",
        "<circle cx='" + (x + s * 0.5) + "' cy='101.5' r='" + (ri * 0.5) + "' fill='#111'/>",
        "<circle cx='" + (x + 2.6) + "' cy='97.6' r='" + (big ? 2.8 : 2.2) + "' fill='#fff'/>",
        "<circle cx='" + (x - 2) + "' cy='104.5' r='1.1' fill='#fff' opacity='.8'/>");
      if (donna) o.push("<path d='M" + (x + s * 6) + ",92.5 L" + (x + s * 10.5) + ",88.5 M" + (x + s * 8.5) + ",95.5 L" + (x + s * 13) + ",93' stroke='#2a1a12' stroke-width='2.2' stroke-linecap='round'/>");   // ciglia
      if (c.occhi === "dolci") o.push("<path d='M" + (x - 9) + ",96 Q" + x + ",88 " + (x + 9) + ",96' stroke='#2a1a12' stroke-width='3' fill='none' stroke-linecap='round'/>");
      if (c.occhi === "furbi") o.push("<path d='M" + (x - 10) + ",101 Q" + x + ",86 " + (x + 10) + ",101 Z' fill='" + fP + "'/>",
        "<path d='M" + (x - 10) + ",101 L" + (x + 10) + ",100' stroke='#2a1a12' stroke-width='2.8' stroke-linecap='round'/>");
    });
    // sopracciglia (colore dei capelli, un po' più scuro; se calvo marrone)
    var colS = tipo === "calvo" ? "#4b2f1d" : tono(H, -0.25);
    [80, 120].forEach(function (x) {
      var s = x < 100 ? -1 : 1, est = x + s * 10, int = x - s * 10, d;
      if (c.sopracc === "decise") d = "M" + est + ",81 L" + int + ",86";
      else if (c.sopracc === "alzate") d = "M" + est + ",84 Q" + x + ",74 " + int + ",80";
      else d = "M" + est + ",85 Q" + x + ",78 " + int + ",84";
      o.push("<path d='" + d + "' stroke='" + colS + "' stroke-width='" + (c.sopracc === "decise" ? 5 : 4) + "' fill='none' stroke-linecap='round'/>");
    });
    // naso
    if (c.naso === "tondo") o.push("<ellipse cx='100' cy='113' rx='5.5' ry='4.2' fill='" + tono(P, -0.14) + "'/>", "<circle cx='98' cy='111.5' r='1.6' fill='#fff' opacity='.35'/>");
    else if (c.naso === "punta") o.push("<path d='M99,105 Q106,114 97,117' stroke='" + tono(P, -0.35) + "' stroke-width='2.4' fill='none' stroke-linecap='round'/>");
    else o.push("<path d='M96,114 Q100,117 104,114' stroke='" + tono(P, -0.32) + "' stroke-width='2.4' fill='none' stroke-linecap='round'/>");
    // bocca
    var lab = "#7a2e22";
    if (c.bocca === "sorrisone") o.push("<path d='M85,123 Q100,125 115,123 Q113,141 100,141 Q87,141 85,123 Z' fill='#6b1f1a'/>",
      "<path d='M87,124 Q100,126 113,124 L112,129 Q100,130 88,129 Z' fill='#fff'/>", "<ellipse cx='100' cy='136.5' rx='7' ry='3.5' fill='#ff7b7b'/>");
    else if (c.bocca === "neutro") o.push("<path d='M91,128 L109,128' stroke='" + lab + "' stroke-width='3.2' stroke-linecap='round'/>");
    else if (c.bocca === "o") o.push("<ellipse cx='100' cy='128' rx='5.5' ry='6.5' fill='#6b1f1a'/>", "<ellipse cx='100' cy='131' rx='3.5' ry='2' fill='#ff7b7b'/>");
    else if (c.bocca === "ghigno") o.push("<path d='M88,127 Q102,133 113,121' stroke='" + lab + "' stroke-width='3.2' fill='none' stroke-linecap='round'/>");
    else o.push("<path d='M87,124 Q100,136 113,124' stroke='" + lab + "' stroke-width='3.2' fill='none' stroke-linecap='round'/>");

    // barba e baffi (colore capelli)
    if (acc === "barba") o.push("<path d='M48,104 C52,148 80,158 100,158 C120,158 148,148 152,104 C144,126 128,138 118,136 Q100,146 82,136 C72,138 56,126 48,104 Z' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='1.5'/>");
    if (acc === "baffi" || acc === "barba") o.push("<path d='M83,121 Q91,113 100,119 Q109,113 117,121 Q109,125 100,122 Q91,125 83,121 Z' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='1.2'/>");

    // --- capelli DAVANTI ---
    var fr = { corti: "M45,100 C40,52 70,30 102,30 C134,30 162,50 155,100 C150,80 146,70 136,64 C118,72 90,70 66,64 C56,72 50,84 45,100 Z",
      spettinati: "M45,100 C42,62 56,42 70,37 L66,22 L84,31 L93,15 L106,29 L121,17 L124,33 L141,28 L138,44 C152,54 159,74 155,100 C150,82 144,72 134,66 C116,74 88,72 66,66 C56,74 50,86 45,100 Z",
      frangia: "M45,104 C40,52 70,30 102,30 C134,30 162,52 155,104 C152,90 150,82 146,76 L139,81 L131,71 L121,80 L111,70 L100,79 L89,70 L79,80 L69,71 L59,80 C52,86 48,94 45,104 Z",
      caschetto: "M45,102 C40,50 70,30 102,30 C134,30 162,50 155,102 C152,86 148,76 140,70 Q100,86 60,70 C52,78 48,88 45,102 Z",
      lunghi: "M45,110 C38,52 68,30 104,30 C136,30 164,52 155,110 C152,90 146,76 136,68 C122,62 104,64 92,57 C82,70 64,76 52,86 C48,94 46,102 45,110 Z",
      coda: "M45,98 C40,52 70,30 102,30 C134,30 162,50 155,98 C152,82 148,72 140,66 C120,58 96,60 80,70 C66,72 52,82 45,98 Z" };
    if (fr[tipo]) o.push("<path d='" + fr[tipo] + "' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='2' stroke-linejoin='round'/>",
      "<path d='M70,46 Q96,34 126,42' stroke='#fff' stroke-width='5' opacity='.25' fill='none' stroke-linecap='round'/>");
    if (tipo === "cresta") o.push("<path d='" + fr.corti + "' fill='" + H + "' opacity='.16'/>",   // lati rasati
      "<path d='M85,44 C86,22 96,6 100,4 C104,6 114,22 115,44 C108,50 92,50 85,44 Z' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='2'/>",
      "<path d='M96,14 Q97,26 94,40' stroke='#fff' stroke-width='3' opacity='.3' fill='none' stroke-linecap='round'/>");
    if (tipo === "ricci") riccioli(false);

    // --- accessori ---
    if (acc === "occhiali" || acc === "sole") {
      var sole = acc === "sole";
      o.push("<path d='M67,97 L47,94 M133,97 L153,94' stroke='#222' stroke-width='3' stroke-linecap='round'/>",
        "<path d='M93,99 Q100,95 107,99' stroke='#222' stroke-width='3' fill='none'/>");
      [80, 120].forEach(function (x) {
        if (sole) o.push("<rect x='" + (x - 14) + "' y='89' width='28' height='21' rx='9' fill='#15151c' stroke='#000' stroke-width='2'/>",
          "<path d='M" + (x - 8) + ",94 L" + (x - 2) + ",94' stroke='#fff' stroke-width='3' opacity='.55' stroke-linecap='round'/>");
        else o.push("<circle cx='" + x + "' cy='100' r='13.5' fill='#bfe3ff' fill-opacity='.18' stroke='#222' stroke-width='3'/>");
      });
    }
    if (acc === "fascia") o.push("<path d='M46,74 Q100,56 154,74 L155,85 Q100,67 45,85 Z' fill='" + fM + "' stroke='" + bordoM + "' stroke-width='1.5'/>");
    if (acc === "cappellino") o.push("<path d='M44,80 C42,24 158,24 156,80 Q100,70 44,80 Z' fill='" + fM + "' stroke='" + bordoM + "' stroke-width='2'/>",
      "<path d='M96,76 Q150,68 180,84 Q152,94 96,84 Z' fill='" + tono(M, -0.22) + "' stroke='" + bordoM + "' stroke-width='2'/>",
      "<circle cx='100' cy='30' r='5' fill='" + tono(M, -0.2) + "'/>", "<path d='M62,50 Q82,34 108,34' stroke='#fff' stroke-width='5' opacity='.22' fill='none' stroke-linecap='round'/>");
    if (acc === "cuffie") o.push("<path d='M44,96 C38,24 162,24 156,96' stroke='#2b2b33' stroke-width='8' fill='none' stroke-linecap='round'/>",
      "<rect x='33' y='82' width='20' height='32' rx='9' fill='" + fM + "' stroke='#222' stroke-width='2'/>",
      "<rect x='147' y='82' width='20' height='32' rx='9' fill='" + fM + "' stroke='#222' stroke-width='2'/>");
    if (acc === "corona") o.push("<path d='M62,54 L68,22 L85,40 L100,12 L115,40 L132,22 L138,54 Q100,62 62,54 Z' fill='url(#" + id + "oro)' stroke='#a8740b' stroke-width='2' stroke-linejoin='round'/>",
      "<circle cx='100' cy='44' r='5' fill='#e03131' stroke='#8a1c1c'/>", "<circle cx='79' cy='48' r='3.5' fill='#1c7ed6'/>", "<circle cx='121' cy='48' r='3.5' fill='#2f9e44'/>");

    function riccioli(dietro) {
      var i, a, x, y;
      if (dietro) { for (i = 0; i < 6; i++) { y = 90 + i * 9; o.push("<circle cx='" + (44 - i * 0.5) + "' cy='" + y + "' r='12' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='1.5'/>", "<circle cx='" + (156 + i * 0.5) + "' cy='" + y + "' r='12' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='1.5'/>"); } return; }
      for (i = 0; i <= 11; i++) {
        a = Math.PI * (1.02 + 0.96 * i / 11); x = 100 + 50 * Math.cos(a); y = 86 + 50 * Math.sin(a);
        o.push("<circle cx='" + x.toFixed(1) + "' cy='" + y.toFixed(1) + "' r='14' fill='" + fH + "' stroke='" + bordoH + "' stroke-width='1.5'/>");
      }
      [[82, 44], [100, 40], [118, 44], [90, 56], [110, 56]].forEach(function (p) { o.push("<circle cx='" + p[0] + "' cy='" + p[1] + "' r='13' fill='" + fH + "'/>"); });
      o.push("<path d='M72,48 Q96,32 124,42' stroke='#fff' stroke-width='4' opacity='.22' fill='none' stroke-linecap='round'/>");
    }

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
    var donna = pick([0, 1]) === 1;
    var acc = OPZ.accessorio.filter(function (a) { return LIBERI.indexOf(a) >= 0 && !(donna && /baffi|barba/.test(a)); });
    return { forma: donna ? "donna" : "uomo", corpo: OPZ.corpo[pick(OPZ.corpo)], sotto: donna && pick([0, 1]) ? "gonna" : "pantaloni",
      pelle: pick(OPZ.pelle), capelli: OPZ.capelli[pick(OPZ.capelli)], colCap: pick(OPZ.colCap.slice(0, 7)),
      occhi: OPZ.occhi[pick(OPZ.occhi)], iride: pick(OPZ.iride), sopracc: OPZ.sopracc[pick(OPZ.sopracc)], naso: OPZ.naso[pick(OPZ.naso)],
      bocca: OPZ.bocca[pick(OPZ.bocca)], maglia: pick(OPZ.maglia), pantaloni: pick(OPZ.pantaloni.slice(0, 5)),
      accessorio: pick([0, 0, 0, 1]) ? acc[pick(acc)] : "nessuno" };
  }

  window.SGOmino = { svg: svg, el: el, casuale: casuale, OPZ: OPZ, BASE: BASE, LIBERI: LIBERI };
})();

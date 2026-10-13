/* =========================================================
   L'ASTA — LE MAGLIE DELLE SQUADRE (Fantacalcio)
   SGAstaArte.maglia(squadra) → la prima maglia 2026/27 vista di fronte, come stringa SVG (viewBox 0 0 100 100):
   colori e disegno veri (righe, metà e metà, croce, fascia, colletto, polsini), senza stemmi, sponsor o scritte.
   Si usa come immagine: SGAstaArte.magliaSrc(squadra) dà già il "data:image/svg+xml,..." pronto (fatto una volta sola).
   Squadra sconosciuta: maglia grigia neutra. Le maglie sono prese dal grafico ufficiale della Serie A 2026/27.
   ========================================================= */
(function () {
  "use strict";
  var A = window.SGAstaArte = window.SGAstaArte || {};

  // ---------- attrezzi ----------
  function mix(c1, c2, t) {   // mescola due colori "#rrggbb" (t = quanto del secondo)
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16), r = "#";
    for (var k = 16; k >= 0; k -= 8) { var x = Math.round(((a >> k) & 255) * (1 - t) + ((b >> k) & 255) * t); r += (x < 16 ? "0" : "") + x.toString(16); }
    return r;
  }
  function luce(c) { var v = parseInt(c.slice(1), 16); return 0.299 * (v >> 16) + 0.587 * ((v >> 8) & 255) + 0.114 * (v & 255); }
  function n1(v) { return Math.round(v * 100) / 100; }
  function stop(o, c, op) { return "<stop offset='" + o + "' stop-color='" + c + "' stop-opacity='" + op + "'/>"; }
  function bande(cx, wA, wB, fino) {   // le righe "B" ai due lati della banda centrale "A" (larga wA, centrata in cx)
    var d = "", x = wA / 2;
    while (x < fino) { d += "M" + n1(cx + x) + ",-20h" + wB + "v140h-" + wB + "zM" + n1(cx - x - wB) + ",-20h" + wB + "v140h-" + wB + "z"; x += wA + wB; }
    return d;
  }
  function fili(cx, wA, wB, fino) {   // una linea sottile al centro di ogni riga "B" (i fili d'oro dell'Udinese)
    var d = "", x = wA / 2 + wB / 2;
    while (x < fino) { d += "M" + n1(cx + x) + ",-20v140M" + n1(cx - x) + ",-20v140"; x += wA + wB; }
    return d;
  }

  // ---------- la sagoma (la metà destra è sempre la sinistra a specchio) ----------
  var LINEA = "#2a1b12", SPECCHIO = " transform='matrix(-1 0 0 1 100 0)'";
  var SAGOMA = "M39.2,8.8Q31.5,10.4 24.6,13Q14.6,21.2 7.4,31.6L17.2,41.8L25.4,35.4C27,52 24.9,72 25.6,88.4Q50,92.6 74.4,88.4C75.1,72 73,52 74.6,35.4L82.8,41.8L92.6,31.6Q85.4,21.2 75.4,13Q68.5,10.4 60.8,8.8Q50,4.8 39.2,8.8Z";
  var MANICA = "M24.6,13Q26.6,24 25.4,35.4L25,52L-2,52L-2,-2L24.6,-2Z";      // manica attaccata alla spalla (esce dalla sagoma: la taglia la sagoma)
  var MANICA_R = "M40.4,8Q29.6,19.6 25.4,35.4L25,52L-2,52L-2,-2L40.4,-2Z";   // manica "raglan": la cucitura va dal collo all'ascella
  var CUC = "M24.6,13Q26.6,24 25.4,35.4M75.4,13Q73.4,24 74.6,35.4", CUC_R = "M40.4,9.2Q29.6,19.6 25.4,35.4M59.6,9.2Q70.4,19.6 74.6,35.4";
  // le pieghe (metà sinistra): spicchi sottili che si assottigliano, sotto l'ascella, sulla manica e vicino all'orlo
  var PIEGHE = "M26.2,39.2Q31.9,42.4 35.4,50Q31.2,44.6 26.2,41.2ZM26.6,45.2Q30.9,47.8 32.6,54Q29.8,49.6 26.6,47ZM30.4,79Q37,75.4 43.4,79.4Q37,77.4 30.4,80.4ZM20.2,18Q16.3,24.6 12.2,30.2Q16.9,25.4 21.4,18.6Z";
  var SPALLA = "M39.2,8.8Q31.5,10.4 24.6,13Q14.6,21.2 7.4,31.6M60.8,8.8Q68.5,10.4 75.4,13Q85.4,21.2 92.6,31.6";
  var PIP = "M40.4,10.5Q32,11.8 25.4,14.6Q16,22.2 9.6,30.4M59.6,10.5Q68,11.8 74.6,14.6Q84,22.2 90.4,30.4", PIP_R = "M41.4,10Q31,20.2 26.8,35.4M58.6,10Q69,20.2 73.2,35.4";
  // il polsino: fasce parallele al bordo della manica (a, b = distanza dal bordo; e = quanto sborda per non lasciare buchi)
  var PO = [7.4, 31.6], PU = [17.2, 41.8], ASSE = [0.687, -0.726], LUNGO = [0.693, 0.721];
  function pt(P, t, e) { return n1(P[0] + t * ASSE[0] + e * LUNGO[0]) + "," + n1(P[1] + t * ASSE[1] + e * LUNGO[1]); }
  function fascia(a, b) { return "M" + pt(PO, a, -3) + "L" + pt(PU, a, 3) + "L" + pt(PU, b, 3) + "L" + pt(PO, b, -3) + "Z"; }
  function dueLati(d, attr, tr) {   // lo stesso pezzo a sinistra e a specchio a destra (tr = spostamento in più)
    return "<path d='" + d + "'" + attr + (tr ? " transform='" + tr + "'" : "") + "/><path d='" + d + "'" + attr + " transform='matrix(-1 0 0 1 100 0)" + (tr ? " " + tr : "") + "'/>";
  }
  function usa(id, attr, tr, tr2) {   // come dueLati, ma ripete un pezzo già scritto una volta (così il file resta leggero)
    return "<use xlink:href='#" + id + "'" + attr + (tr ? " transform='" + tr + "'" : "") + "/><use xlink:href='#" + id + "'" + attr + " transform='" + (tr2 || "matrix(-1 0 0 1 100 0)" + (tr ? " " + tr : "")) + "'/>";
  }

  // ---------- le squadre ----------
  // b = colore del corpo (con le righe è la riga al centro); r = [colore dell'altra riga, larghezza riga centrale, larghezza altra riga]
  // meta = [sinistra, destra] di chi guarda; man = maniche (colore, [sinistra, destra] o "righe"; manC = manica scura con una riga chiara); rag = maniche raglan
  // col = colletto { t: tondo | v | polo | aperto, c: colore, f/f2: filetti, pt: filetto a puntini }; pol = polsini [[colore, larghezza], ...] dal bordo
  // trama = disegno leggero nel tessuto; spalla = fascia sulle spalle; pip = filetto sulle spalle (o sulla cucitura raglan)
  var DATI = {
    Napoli:     { b: "#2f8fd8", col: { t: "aperto", c: "#3f9ce0", f: "#1d5f9e" }, pol: [["#2276bd", 2.6]] },
    Juventus:   { b: "#f6f4ef", r: ["#1d1d1d", 6.1, 6.1], man: "#f6f4ef", col: { t: "polo", c: "#f6f4ef", f: "#1d1d1d" }, pol: [["#1d1d1d", 1.3]] },
    Inter:      { b: "#131417", r: ["#2445b6", 8, 7], man: "righe", col: { t: "tondo", c: "#131417" }, pol: [["#131417", 2.4]] },
    Atalanta:   { b: "#101318", r: ["#2381df", 4.9, 8.8], man: "#2381df", spalla: "#101318", col: { t: "tondo", c: "#101318" }, pol: [["#101318", 2.4]] },
    Roma:       { b: "#94122a", col: { t: "tondo", c: "#f3a63a" }, pol: [["#f3a63a", 2.6]] },
    Milan:      { b: "#d3141f", r: ["#181717", 13.6, 13.6], man: "#181717", col: { t: "tondo", c: "#181717", f: "#d3141f" }, pol: [["#181717", 0.9], ["#d3141f", 1.1]] },
    Como:       { b: "#0c4a9e", trama: { t: "fili", c: "#3d78c6" }, col: { t: "polo", c: "#0c4a9e", f: "#ffffff", f2: "#d8344c" }, pol: [["#ffffff", 2.2], ["#d8344c", 0.9]] },
    Lazio:      { b: "#72bfee", rag: 1, col: { t: "polo", c: "#ffffff" }, pol: [["#ffffff", 3]] },
    Torino:     { b: "#6e1622", rag: 1, pip: "#ffffff", col: { t: "tondo", c: "#6e1622", f: "#ffffff" } },
    Sassuolo:   { b: "#13814f", r: ["#0e100e", 8.7, 6.8], man: "#13814f", col: { t: "tondo", c: "#0e100e", f: "#13814f" }, pol: [["#0e100e", 1.6]] },
    Fiorentina: { b: "#68399a", trama: { t: "rombi", c: "#9a72cc" }, col: { t: "v", c: "#ffffff" }, pol: [["#ffffff", 1.4]] },
    Bologna:    { b: "#202b55", r: ["#c3222e", 14, 14], rag: 1, man: "#202b55", col: { t: "polo", c: "#202b55", f: "#c3222e" } },
    Cagliari:   { meta: ["#9b1f34", "#243050"], man: ["#243050", "#9b1f34"], pip: "#ffffff", col: { t: "polo", c: "#243050", f: "#9b1f34" } },
    Parma:      { b: "#f7f6f1", croce: ["#1a1a1a", "#caa53c"], col: { t: "v", c: "#1a1a1a" }, pol: [["#1a1a1a", 2], ["#caa53c", 0.7]] },
    Venezia:    { b: "#262626", trama: { t: "righine", c: "#000000" }, fascia: ["#3f8f72", "#f2643a"], col: { t: "polo", c: "#1c1c1c", f: "#f2643a", f2: "#3f8f72" }, pol: [["#f2643a", 1.5], ["#3f8f72", 1.1]] },
    Udinese:    { b: "#eef0f5", r: ["#1c1d24", 6.9, 6.9], oro: "#d2a63a", man: "righe", manC: 1, col: { t: "tondo", c: "#eef0f5", f: "#1c1d24" }, pol: [["#1c1d24", 0.9], ["#eef0f5", 2.4]] },
    Monza:      { b: "#e32a30", col: { t: "polo", c: "#ffffff" } },
    Genoa:      { meta: ["#cc1229", "#10233a"], man: ["#10233a", "#cc1229"], rag: 1, col: { t: "polo", c: "#10233a", pt: "#ffffff" }, ptPol: "#ffffff" },
    Lecce:      { b: "#f5cd17", r: ["#d50419", 6.8, 6.8], man: "#f5cd17", col: { t: "polo", c: "#1c2b4f", f: "#f5cd17", f2: "#d50419" }, pol: [["#1c2b4f", 1.1], ["#d50419", 1.5]] },
    Frosinone:  { b: "#f5c53b", col: { t: "tondo", c: "#1f4f9e" }, pol: [["#1f4f9e", 2.4]] }
  };
  var GRIGIA = { b: "#9ba3ad", col: { t: "tondo", c: "#7b838e" } };   // squadra sconosciuta
  A.SQUADRE = ["Napoli", "Juventus", "Inter", "Atalanta", "Roma", "Milan", "Como", "Lazio", "Torino", "Sassuolo", "Fiorentina", "Bologna", "Cagliari", "Parma", "Venezia", "Udinese", "Monza", "Genoa", "Lecce", "Frosinone"];

  // ---------- il colletto ----------
  function colletto(d, p) {
    var c = d.col, L = " stroke='" + LINEA + "' stroke-width='1' stroke-linejoin='round'";
    var base = d.meta ? d.meta[1] : d.b, s = "", filo;
    var dentro = mix(luce(base) < 140 ? base : c.c, "#140d08", 0.6), retro = mix(c.c, "#000000", 0.22);   // dentro il collo: la stoffa in ombra (se la maglia è chiara, il colore del colletto)
    function filetto(dd, col, w, extra) { return dueLati(dd, " fill='none' stroke='" + col + "' stroke-width='" + w + "' stroke-linejoin='round' stroke-linecap='round'" + (extra || "")); }
    if (c.t === "polo" || c.t === "aperto") {   // colletto a polo (con la pattina e i bottoni) o aperto a V
      var ap = c.t === "aperto";
      var ala = ap ? "M38.6,8.4C35.6,9.6 33.8,11.4 33.6,12.8L42.6,25L49.4,23.8L40,10.2Z" : "M38.6,8.4C35.6,9.6 33.8,11.4 33.6,12.8L43.4,22.6L48.8,15.2Q44,13.4 40,10.2Z";
      s += "<path d='M40,10.2Q50,6.6 60,10.2" + (ap ? "L50,23.6Z" : "L52.6,15.2L47.4,15.2Z") + "' fill='" + dentro + "'/>";
      s += "<path d='M38.6,8.4Q50,3.4 61.4,8.4L60,10.2Q50,6.6 40,10.2Z' fill='" + retro + "'" + L + "/>";
      if (!ap) {
        var pat = d.meta ? c.c : d.b, bot = mix(pat, "#000000", 0.45);
        s += "<path d='M47.4,15L52.6,15L52.6,27.6Q50,28.6 47.4,27.6Z' fill='" + pat + "' stroke='" + LINEA + "' stroke-opacity='.55' stroke-width='.8'/>" +
          "<circle cx='50' cy='19.6' r='.95' fill='" + bot + "'/><circle cx='50' cy='24.4' r='.95' fill='" + bot + "'/>";
      }
      s += "<defs><path id='" + p + "a' d='" + ala + "'/></defs>" + usa(p + "a", " fill='#000' opacity='.22'", "translate(.5 .9)", "matrix(-1 0 0 1 100.5 .9)");   // l'ombra sotto il colletto
      s += usa(p + "a", " fill='" + c.c + "'" + L);
      filo = ap ? "M34.6,12.4L42.9,23.6L48.6,22.8" : "M34.4,12L43.3,21.2L48,15.1";
      if (c.f) s += filetto(filo, c.f, 0.9);
      if (c.f2) s += filetto(ap ? "M35.8,12.4L43.3,22.4L47.6,21.8" : "M35.6,11.9L43.4,19.9L47,15.1", c.f2, 0.65);
      if (c.pt) s += filetto(filo, c.pt, 0.9, " stroke-dasharray='.1 1.3'");
      s += "<path d='M37.6,9.8Q36,11.2 35.6,12.4' fill='none' stroke='#fff' stroke-width='.9' stroke-linecap='round' opacity='.45'/>";
    } else {   // girocollo o a V
      var v = c.t === "v";
      s += "<path d='M40.6,9.8Q50,6.6 59.4,9.8" + (v ? "L50,19.4Z" : "Q57.4,16 50,16.4Q42.6,16 40.6,9.8Z") + "' fill='" + dentro + "'/>";
      s += "<path d='M39.2,8.8Q50,4.8 60.8,8.8L59.4,9.8Q50,6.6 40.6,9.8Z' fill='" + retro + "'" + L + "/>";
      s += "<path d='" + (v ? "M39.2,8.8L50,22.8L60.8,8.8L59.4,9.8L50,19.4L40.6,9.8Z" : "M39.2,8.8Q40.4,19 50,19.2Q59.6,19 60.8,8.8L59.4,9.8Q57.4,16 50,16.4Q42.6,16 40.6,9.8Z") + "' fill='" + c.c + "'" + L + "/>";
      if (c.f) s += "<path d='" + (v ? "M40,9.3L50,21.1L60,9.3" : "M39.9,9.4Q41.4,17.8 50,18Q58.6,17.8 60.1,9.4") + "' fill='none' stroke='" + c.f + "' stroke-width='.85' stroke-linejoin='round'/>";
      s += "<path d='" + (v ? "M41.8,11.2L48.6,19.4" : "M41.6,11.4Q43.6,16.4 49,16.9") + "' fill='none' stroke='#fff' stroke-width='.8' stroke-linecap='round' opacity='.4'/>";
    }
    return s;
  }

  // ---------- la maglia intera ----------
  function disegna(d, p) {
    var s = "<svg xmlns='http://www.w3.org/2000/svg' xmlns:xlink='http://www.w3.org/1999/xlink' viewBox='0 0 100 100'><defs><clipPath id='" + p + "s'><path d='" + SAGOMA + "'/></clipPath><path id='" + p + "p' d='" + PIEGHE + "'/>";
    var reg = d.rag ? MANICA_R : MANICA, i;
    if (d.man === "righe") s += "<clipPath id='" + p + "m'><path d='" + reg + "'/></clipPath>";
    if (d.trama) {   // il disegno leggero del tessuto: rombi (Fiorentina), filetti (Como), righine scure (Venezia)
      var tt = d.trama.t;
      s += "<pattern id='" + p + "t' patternUnits='userSpaceOnUse' " + (tt === "rombi" ? "width='6' height='6' patternTransform='rotate(45)'><path d='M0,0H6M0,0V6' stroke='" + d.trama.c + "' stroke-width='1.1' opacity='.55'/>" :
        tt === "fili" ? "width='3.4' height='10'><path d='M1.7,0V10' stroke='" + d.trama.c + "' stroke-width='.55' opacity='.7'/>" :
        "width='4.6' height='10'><rect width='2.1' height='10' fill='" + d.trama.c + "' opacity='.28'/>") + "</pattern>";
    }
    // il volume: luce in alto a sinistra e ombra in basso a destra; il corpo è un cilindro (fianchi più scuri)
    s += "<linearGradient id='" + p + "l' x1='.1' y1='0' x2='.9' y2='1'>" + stop(0, "#fff", 0.32) + stop(0.36, "#fff", 0) + stop(0.62, "#000", 0) + stop(1, "#000", 0.36) + "</linearGradient>";
    s += "<linearGradient id='" + p + "c'>" + stop(0, "#000", 0.3) + stop(0.14, "#000", 0.04) + stop(0.32, "#fff", 0.08) + stop(0.55, "#fff", 0) + stop(0.86, "#000", 0.06) + stop(1, "#000", 0.32) + "</linearGradient>";
    s += "<radialGradient id='" + p + "r'>" + stop(0, "#fff", 0.2) + stop(1, "#fff", 0) + "</radialGradient></defs>";
    s += "<ellipse cx='50' cy='94.6' rx='31' ry='3.6' fill='#000' opacity='.15'/>";   // l'ombra morbida sotto
    s += "<g clip-path='url(#" + p + "s)'><rect width='100' height='100' fill='" + (d.meta ? d.meta[1] : d.b) + "'/>";
    // il disegno del corpo
    if (d.meta) s += "<rect width='50' height='100' fill='" + d.meta[0] + "'/><path d='M50,0V100' stroke='#000' stroke-opacity='.25' stroke-width='.8'/>";
    if (d.r) {
      s += "<path d='" + bande(50, d.r[1], d.r[2], 30) + "' fill='" + d.r[0] + "'/>";
      if (d.oro) s += "<path d='" + fili(50, d.r[1], d.r[2], 30) + "' stroke='" + d.oro + "' stroke-width='.55'/>";
    }
    if (d.trama) s += "<rect width='100' height='100' fill='url(#" + p + "t)'/>";
    if (d.croce) s += "<path d='M44.45,0h11.1v35.85H100v10.3H55.55V100h-11.1V46.15H0V35.85h44.45Z' fill='" + d.croce[1] + "'/><path d='M45.2,0h9.6v36.6H100v8.8H54.8V100h-9.6V45.4H0V36.6h45.2Z' fill='" + d.croce[0] + "'/>";
    if (d.fascia) {   // la fascia sul petto che sventola come una bandiera: sopra verde, sotto arancio, tagliata in diagonale
      var su = "M22,35.9C34,33.2 44,36.4 56,34.2S72,32.2 78,33.2";
      s += "<path d='" + su + "L78,45.9C72,45 64,47.2 56,46.6S34,47.6 22,48.6Z' fill='" + d.fascia[1] + "' stroke='#000' stroke-opacity='.3' stroke-width='.6'/><path d='" + su + "L78,42.4C64,41.6 40,38.6 22,36.7Z' fill='" + d.fascia[0] + "'/>";
    }
    // le maniche: tinta unita, di colori opposti (Genoa, Cagliari) o a righe lungo la manica
    if (d.man) for (i = 0; i < 2; i++) {
      var tr = i ? SPECCHIO : "", col = typeof d.man === "object" ? d.man[i] : d.man;
      if (col === "righe") {   // manC: manica scura con una sola riga chiara al centro (Udinese), se no righe lungo la manica
        var cA = d.manC ? d.r[0] : d.b, cB = d.manC ? d.b : d.r[0], wB = d.manC ? 4.2 : d.r[2];
        s += "<g" + tr + " clip-path='url(#" + p + "m)'><rect x='-2' y='-2' width='52' height='60' fill='" + cA + "'/><g transform='rotate(43.4 18.6 30.4)'><path d='" +
          (d.manC ? "M" + n1(18.6 - wB / 2) + ",-20h" + wB + "v140h-" + wB + "z" : bande(18.6, d.r[1], wB, 26)) + "' fill='" + cB + "'/>" +
          (d.oro ? "<path d='" + (d.manC ? "M" + n1(18.6 - wB / 2 - 1.2) + ",-20v140" : fili(18.6, d.r[1], wB, 26)) + "' stroke='" + d.oro + "' stroke-width='.55'/>" : "") + "</g></g>";
      } else s += "<path d='" + reg + "' fill='" + col + "'" + tr + "/>";
    }
    if (d.spalla) s += "<path d='" + SPALLA + "' fill='none' stroke='" + d.spalla + "' stroke-width='5.4'/>";
    if (d.pip) s += "<path d='" + (d.rag ? PIP_R : PIP) + "' fill='none' stroke='" + d.pip + "' stroke-width='1.05' stroke-linecap='round'/>";
    // i polsini
    var a = -3;
    (d.pol || []).forEach(function (f) { s += dueLati(fascia(a, Math.max(0, a) + f[1]), " fill='" + f[0] + "'"); a = Math.max(0, a) + f[1]; });
    if (d.ptPol) s += dueLati("M" + pt(PO, 2, -1) + "L" + pt(PU, 2, 1), " stroke='" + d.ptPol + "' stroke-width='.9' stroke-dasharray='.1 1.3' stroke-linecap='round'");
    if (d.pol) s += dueLati("M" + pt(PO, a, -2) + "L" + pt(PU, a, 2), " stroke='#000' stroke-opacity='.3' stroke-width='.6'");
    // la luce, le cuciture, le pieghe leggere e l'orlo
    s += "<rect x='24' width='52' height='100' fill='url(#" + p + "c)'/><rect width='100' height='100' fill='url(#" + p + "l)'/>";
    s += "<path d='" + (d.rag ? CUC_R : CUC) + "' fill='none' stroke='#000' stroke-opacity='.3' stroke-width='.9'/>";
    s += "<ellipse cx='37' cy='31' rx='13' ry='19' fill='url(#" + p + "r)'/>";   // il lucido del tessuto sul petto
    s += usa(p + "p", " fill='#fff' opacity='.06'", "translate(.8 -.8)") + usa(p + "p", " fill='#000' opacity='.14'");   // pieghe appena accennate
    s += "<g fill='none' stroke-linecap='round'><path d='M25.9,85.3Q50,89.5 74.1,85.3' stroke='#000' stroke-width='.7' opacity='.22'/>" +
      "<path d='M37.6,11.3Q31,12.5 26,14.7' stroke='#fff' stroke-width='1.6' opacity='.5'/><path d='M22.6,17Q16.6,22.8 11.6,29.4' stroke='#fff' stroke-width='1.3' opacity='.32'/></g></g>";
    s += "<path d='" + SAGOMA + "' fill='none' stroke='" + LINEA + "' stroke-width='2.6' stroke-linejoin='round'/>";   // il contorno
    return s + colletto(d, p) + "</svg>";
  }

  // ---------- per chi usa le maglie ----------
  var CACHE = {}, CACHE_SRC = {};
  function chiave(squadra) {
    var t = String(squadra || "").trim().toLowerCase();
    for (var i = 0; i < A.SQUADRE.length; i++) if (A.SQUADRE[i].toLowerCase() === t) return i;
    return -1;
  }
  A.maglia = function (squadra) {
    var k = chiave(squadra), id = k < 0 ? "x" : k;
    if (!CACHE[id]) CACHE[id] = disegna(k < 0 ? GRIGIA : DATI[A.SQUADRE[k]], "asm" + id);
    return CACHE[id];
  };
  A.magliaSrc = function (squadra) {   // pronta per <img src> o background-image: url("...")
    var id = chiave(squadra);
    return CACHE_SRC[id] || (CACHE_SRC[id] = "data:image/svg+xml," + encodeURIComponent(A.maglia(squadra)));
  };
})();

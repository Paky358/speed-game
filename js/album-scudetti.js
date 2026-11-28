// 🛡️ GLI SCUDETTI DELLE SQUADRE (28 nov 2026, nell'album della Mini Asta dalla novità v463; forma A scelta dal proprietario; il proprietario: quelli di prima «sono proprio a
// livello 0… colori un po' più seri», gli piace lo scudo col bordo d'oro lucido e dentro il segno della squadra).
// Disegni NOSTRI: la forma dello scudo, l'oro e le luci sono nostre (stile Notte vivace); dentro solo il SEGNO della squadra coi suoi
// colori (righe, croce, V, punta, onda, metà e metà): niente stemmi veri, niente lettere, niente animali, niente scritte dei club,
// niente maglie. SVG piccoli fatti dal codice: window.SG_SCUDETTI.svg(squadra, { forma: "A"|"B", bordo: "argento"|"oro" }) → testo svg
// (viewBox 100×116). Il bordo (il proprietario, 28 nov 2026): «le facciamo tutte con il bordo argento… la squadra che completi ha il bordo oro».
(function () {
  "use strict";
  // i colori: pieni ma seri (niente fluo)
  var C = {
    nero: "#15161c", bianco: "#f4f2ec", blu: "#123a8c", bluNotte: "#13234f", azzurro: "#2f7fd0", celeste: "#8cc6ea", napoli: "#1c8fd6",
    rosso: "#c8202f", granata: "#7c1d24", giallo: "#f2c230", oro: "#e8b72e", viola: "#5a2a8c", verde: "#1f8a4c", arancio: "#e0701e",
    grigio: "#9aa0a8", rosa: "#e889b0", pompei: "#8e1f2f", giallorosa: "#f0b43a"
  };
  // il segno di ogni squadra: una lista di pezzi dentro lo scudo (coordinate del viewBox 100×116, il campo va da x 10 a 90, y 8 a 108)
  function righe(cols, n) { var o = [], w = 80 / n; for (var i = 0; i < n; i++) o.push(["r", 10 + i * w, 0, w + 0.4, 116, cols[i % cols.length]]); return o; }
  function bande(cols, n, y0, y1) { y0 = y0 || 8; y1 = y1 || 108; var o = [], h = (y1 - y0) / n; for (var i = 0; i < n; i++) o.push(["r", 0, y0 + i * h, 100, h + 0.4, cols[i % cols.length]]); return o; }
  function pieno(c) { return [["r", 0, 0, 100, 116, c]]; }
  function mezzo(a, b) { return [["r", 0, 0, 50, 116, a], ["r", 50, 0, 50, 116, b]]; }
  function partito(a, b, y) { y = y || 52; return [["r", 0, 0, 100, y, a], ["r", 0, y, 100, 116 - y, b]]; }
  function diagonale(a, b) { return [["r", 0, 0, 100, 116, a], ["p", "M100 0 L100 116 L0 116 Z", b]]; }
  function fasciaO(bg, c, y, h) { return [["r", 0, 0, 100, 116, bg], ["r", 0, y, 100, h, c]]; }
  function fasciaD(bg, c, w) { w = w || 16; return [["r", 0, 0, 100, 116, bg], ["p", "M" + (-10) + " " + (30 - w) + " L110 " + (96 - w) + " L110 " + (96 + w) + " L-10 " + (30 + w) + " Z", c]]; }
  function croce(bg, c, w, y) { w = w || 14; y = y || 50; return [["r", 0, 0, 100, 116, bg], ["r", 50 - w / 2, 0, w, 116, c], ["r", 0, y - w / 2, 100, w, c]]; }
  function vee(bg, c) { return [["r", 0, 0, 100, 116, bg], ["p", "M4 4 L50 58 L96 4 L96 24 L50 78 L4 24 Z", c]]; }
  function punta(bg, c) { return [["r", 0, 0, 100, 116, bg], ["p", "M-6 116 L50 40 L106 116 Z", c], ["p", "M22 116 L50 78 L78 116 Z", bg]]; }
  function onda(bg, c) { return [["r", 0, 0, 100, 116, bg], ["p", "M0 64 C18 50 32 50 50 62 C68 74 82 74 100 60 L100 74 C82 88 68 88 50 76 C32 64 18 64 0 78 Z", c]]; }
  function capo(c, h) { return [["r", 0, 0, 100, h || 34, c]]; }
  var SEGNI = {
    // ---- le 20 di oggi ----
    Atalanta: diagonale(C.azzurro, C.nero),
    Bologna: righe([C.rosso, C.bluNotte], 5),
    Cagliari: mezzo(C.rosso, C.bluNotte).concat([["r", 48.6, 0, 2.8, 116, C.bianco]]),
    Como: croce(C.blu, C.bianco),
    Fiorentina: vee(C.viola, C.bianco),
    Frosinone: fasciaD(C.giallo, C.blu, 14),
    Genoa: mezzo(C.rosso, C.bluNotte).concat(capo(C.bianco, 42), [["r", 45, 0, 10, 42, C.rosso], ["r", 0, 20, 100, 10, C.rosso], ["r", 0, 42, 100, 2.4, C.oro]]),
    Inter: righe([C.nero, C.blu], 7),
    Juventus: righe([C.bianco, C.nero], 7),
    Lazio: fasciaO(C.celeste, C.bianco, 44, 20),
    Lecce: righe([C.giallo, C.rosso], 6),
    Milan: righe([C.rosso, C.nero], 6),
    Monza: fasciaO(C.rosso, C.bianco, 48, 16),
    Napoli: onda(C.napoli, C.bianco),
    Parma: righe([C.giallo, C.blu], 5),   // (28 nov 2026: la croce nera con le righe gialloblù era troppo vicina allo stemma vero)
    Roma: partito(C.pompei, C.giallorosa, 56).concat([["r", 0, 55, 100, 2.2, C.oro]]),
    Sassuolo: righe([C.verde, C.nero], 7),
    Torino: pieno(C.granata).concat(capo(C.bianco, 26), [["r", 0, 26, 100, 3, C.oro]]),
    Udinese: punta(C.bianco, C.nero),
    Venezia: [["r", 0, 0, 37, 116, C.arancio], ["r", 37, 0, 26, 116, C.nero], ["r", 63, 0, 37, 116, C.verde]],
    // ---- le stagioni passate ----
    Benevento: mezzo(C.giallo, C.rosso),
    Brescia: vee(C.blu, C.bianco),
    Carpi: righe([C.bianco, C.rosso], 6),
    Chievo: fasciaO(C.giallo, C.blu, 46, 22),
    Cremonese: righe([C.grigio, C.rosso], 6),
    Crotone: bande([C.rosso, C.bluNotte], 5),
    Empoli: fasciaD(C.azzurro, C.bianco, 10),
    Palermo: mezzo(C.rosa, C.nero),
    Pescara: fasciaO(C.celeste, C.bianco, 36, 12).concat([["r", 0, 62, 100, 12, C.bianco]]),
    Pisa: bande([C.nero, C.blu], 5),
    SPAL: righe([C.bianco, C.celeste], 7),
    Salernitana: fasciaD(C.granata, C.bianco, 8),
    Sampdoria: [["r", 0, 0, 100, 116, C.blu], ["r", 0, 44, 100, 7, C.bianco], ["r", 0, 51, 100, 7, C.rosso], ["r", 0, 58, 100, 7, C.nero], ["r", 0, 65, 100, 7, C.bianco]],
    Spezia: fasciaO(C.bianco, C.nero, 46, 18),
    Verona: mezzo(C.giallo, C.blu)
  };
  // le due forme dello scudo (nostre): A = scudo classico con le «orecchie» in alto e la punta; B = scudo più tondo da torneo
  var FORME = {
    A: { fuori: "M4 12 L20 4 Q50 10 80 4 L96 12 L96 56 C96 86 74 103 50 114 C26 103 4 86 4 56 Z", dentro: "M11 16 L22 10.6 Q50 16 78 10.6 L89 16 L89 56 C89 81 70 95 50 105 C30 95 11 81 11 56 Z" },
    B: { fuori: "M50 2 C70 2 86 6 96 12 L96 58 C96 88 72 106 50 114 C28 106 4 88 4 58 L4 12 C14 6 30 2 50 2 Z", dentro: "M50 9 C68 9 81 12 89 17 L89 58 C89 82 69 97 50 105 C31 97 11 82 11 58 L11 17 C19 12 32 9 50 9 Z" }
  };
  var METALLO = {   // (il bordo lucido: argento di base, oro a squadra completa)
    oro: { stop: "<stop offset=\"0\" stop-color=\"#fff3b8\"/><stop offset=\".28\" stop-color=\"#f2c230\"/><stop offset=\".55\" stop-color=\"#a8761a\"/><stop offset=\".78\" stop-color=\"#f7d871\"/><stop offset=\"1\" stop-color=\"#8a5c10\"/>", filo: "#5a3a06" },
    argento: { stop: "<stop offset=\"0\" stop-color=\"#ffffff\"/><stop offset=\".28\" stop-color=\"#c3cad6\"/><stop offset=\".55\" stop-color=\"#6f7888\"/><stop offset=\".78\" stop-color=\"#e9edf3\"/><stop offset=\"1\" stop-color=\"#59616e\"/>", filo: "#3a414c" }
  };
  var N = 0;
  function svg(sq, o) {
    o = o || {}; var F = FORME[o.forma || "A"], segno = SEGNI[sq] || pieno("#3a4160"), id = "sc" + (++N) + "_", M = METALLO[o.bordo === "oro" ? "oro" : "argento"];
    var pezzi = segno.map(function (p) { return p[0] === "r" ? '<rect x="' + p[1] + '" y="' + p[2] + '" width="' + p[3] + '" height="' + p[4] + '" fill="' + p[5] + '"/>' : '<path d="' + p[1] + '" fill="' + p[2] + '"/>'; }).join("");
    return '<svg viewBox="0 0 100 116" xmlns="http://www.w3.org/2000/svg" class="scudetto"' + (o.px ? ' width="' + o.px + '" height="' + Math.round(o.px * 1.16) + '"' : '') + '>' +
      '<defs><linearGradient id="' + id + 'o" x1="0" y1="0" x2="1" y2="1">' + M.stop + '</linearGradient>' +
      '<linearGradient id="' + id + 'l" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".45" stop-color="#fff" stop-opacity=".06"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>' +
      '<clipPath id="' + id + 'c"><path d="' + F.dentro + '"/></clipPath></defs>' +
      '<path d="' + F.fuori + '" fill="#0b0d18" transform="translate(0 2.5)" opacity=".55"/>' +   // (l'ombra sotto)
      '<path d="' + F.fuori + '" fill="url(#' + id + 'o)"/>' +                                    // (l'oro lucido)
      '<path d="' + F.fuori + '" fill="none" stroke="' + M.filo + '" stroke-width="1.2" opacity=".7"/>' +
      '<g clip-path="url(#' + id + 'c)">' + pezzi + '<rect x="0" y="0" width="100" height="116" fill="url(#' + id + 'l)"/>' +
      '<path d="M0 0 L100 0 L100 30 C70 44 30 44 0 30 Z" fill="#fff" opacity=".10"/></g>' +   // (la luce in alto)
      '<path d="' + F.dentro + '" fill="none" stroke="#0b0d18" stroke-width="2.2"/>' +
      '<path d="' + F.dentro + '" fill="none" stroke="#fff6d0" stroke-width=".7" opacity=".55" transform="translate(0 -.6)"/>' +
      '</svg>';
  }
  window.SG_SCUDETTI = { svg: svg, squadre: Object.keys(SEGNI), SEGNI: SEGNI, FORME: FORME };   // (FORME: per lo scudetto sul petto dei busti, js/games/asta.js scudoPetto)
})();
